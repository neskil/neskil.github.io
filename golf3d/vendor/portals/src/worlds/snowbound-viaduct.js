// THE MIDWINTER EXPRESS: snow falls on an alpine town at dusk as a steam train with glowing windows crosses a
// towering stone viaduct beneath a floodlit castle. The flight: over the rooftops, down past the lit fir in the
// market square, low over the skaters on the frozen pond, a climbing sweep round the right-hand slope to meet the
// express head-on above the central arch, a dive under that arch as its carriages stream across, down the lamp-lit
// street of the mill hamlet with the castle three-quarter above its roofs, up the snowfield's lamp-lit footpath past
// the village bonfire and the skiers, then over the causeway parapet to the castle gatehouse, whose arch holds the portal.
// World space == hero space: the viaduct runs along X at z = 0, the camera flies +Z -> -Z, the town climbs +X.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep as sm, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/snowbound-viaduct.js';

const PALETTE = ['#1b2a55', '#5a6fa8', '#c9b6c8', '#eef3fa', '#3b3f4a', '#7a2f2a', '#ffc46b'];
const TAU = Math.PI * 2;
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mixHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const isWin = (s) => (s >= 1 && s <= 7) || s === 9;

// quad with the winding chosen so its normal points along `want`
function Q(b, p0, p1, p2, p3, want, uv) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * want[0] + ny * want[1] + nz * want[2] < 0) b.quad(p1, p0, p3, p2, uv); else b.quad(p0, p1, p2, p3, uv);
}
// one window cell on a vertical panel facing `yaw` (0 = +Z)
function winQuad(b, rng, x, y, z, w, h, yaw, style, lit, col) {
  const rx = Math.cos(yaw) * w / 2, rz = -Math.sin(yaw) * w / 2, ox = Math.sin(yaw) * 0.07, oz = Math.cos(yaw) * 0.07;
  b.surf(style, rng(), lit); if (col) b.col(col, 1, 1);
  b.quad([x - rx + ox, y - h / 2, z - rz + oz], [x + rx + ox, y - h / 2, z + rz + oz], [x + rx + ox, y + h / 2, z + rz + oz], [x - rx + ox, y + h / 2, z - rz + oz], [0, 0, 1, 1]);
}
// snow on everything that faces up (Builder arrays, before toGeometry)
function snowCaps(b, from, minNy, snow, rng) {
  for (let i = from; i < b.nv; i++) {
    const st = Math.round(b.W[i * 3]);
    if (st === 8 || isWin(st) || b.N[i * 3 + 1] < minNy) continue;
    const k = 0.9 + 0.1 * rng();
    b.C[i * 3] = snow[0] * k; b.C[i * 3 + 1] = snow[1] * k; b.C[i * 3 + 2] = snow[2] * k; b.W[i * 3] = 0; b.W[i * 3 + 1] = 0;
  }
}

// ---------------------------------------------------------------- snow ground: a light Lambert shader (the kit's detailed terrain
// material cost more than the rest of the frame together on a software renderer); rock shows on steep faces, sparkle near the eye
function makeSnowMaterial(time, rock, trk) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time; sh.uniforms.uRock = { value: rock }; sh.uniforms.uTrk = { value: trk };
    sh.vertexShader = 'attribute vec2 aShade; varying vec3 vWP; varying vec3 vWN; varying float vAO;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n vWP = (modelMatrix * vec4(position, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * normal); vAO = aShade.y;');
    sh.fragmentShader = 'uniform float uTime; uniform vec3 uRock; uniform vec4 uTrk; varying vec3 vWP; varying vec3 vWN; varying float vAO; float sparkle = 0., lampWash = 0., driftRim = 0.;\n float sbH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n float sbN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(sbH(i), sbH(i + vec2(1., 0.)), f.x), mix(sbH(i + vec2(0., 1.)), sbH(i + vec2(1., 1.)), f.x), f.y); }\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
      { vec2 q = vWP.xz; float d = length(vWP - cameraPosition);
        float drift = sin(q.x * .23 + sin(q.y * .11) * 2.3) * sin(q.y * .19 + sin(q.x * .13) * 2.1);
        float fine = sin(q.x * 1.9 + q.y * .7) * sin(q.y * 2.3 - q.x * .5) * (1. - smoothstep(10., 70., d));
        float pn = sbN(q * .043 + 3.) + .5 * sbN(q * .13 - 7.) - .75;
        float wall = smoothstep(95., 175., abs(q.x)) + (1. - smoothstep(-360., -300., q.y));
        float rvg = -95. * smoothstep(8., 75., -q.y) + min(0., q.y + 75.) * .12;                  // the gorge side of the hamlet's shelf is rock too
        wall += smoothstep(30., 46., -q.y) * (1. - smoothstep(150., 175., -q.y)) * smoothstep(2., 8., q.x - rvg) * (1. - smoothstep(24., 36., q.x - rvg));
        vec2 qg = q + 7. * vec2(sbN(q * .045 + 2.), sbN(q * .045 + 11.)); float yg = vWP.y + 5. * sbN(q * .08);      // warped, so no rib follows the noise lattice
        vec2 an = abs(vWN.xz) + 1e-3; float wz = smoothstep(.3, .7, an.x / (an.x + an.y));      // walls facing +-x run along z, and the other way round
        float gz = sbN(vec2(qg.y * .15, yg * .034 + 3.)) * .5 + sbN(vec2(qg.y * .41, yg * .085)) * .5;
        float gx = sbN(vec2(qg.x * .15, yg * .034 + 3.)) * .5 + sbN(vec2(qg.x * .41, yg * .085)) * .5;
        float strata = sbN(vec2(dot(qg, vec2(.021, .017)), yg * .19 + 2.)) * .64 + sbN(vec2(dot(qg, vec2(.05, -.04)), yg * .47)) * .36;      // bedding: level ledges a few metres apart
        float gully = mix(gx, gz, wz) * .66 + strata * .42 - .04 + (sbN(vec2((qg.x + qg.y) * .04, yg * .09 + 5.)) - .5) * .3 + (sbN(vec2((qg.x - qg.y) * .38, yg * .31)) - .5) * .24;      // buttresses a few times taller than wide, cut across by level beds: a crag, not streaks
        float wk = clamp(wall, 0., 1.);
        float rk = 1. - smoothstep(.46, .74, vWN.y + pn * .2);
        float steep = 1. - smoothstep(.3, .72, vWN.y + pn * .08);          // a wide ramp: the mesh only says how much rock, the noise draws every edge
        float th = mix(.82, .42, steep);
        float led = sbN(vec2((q.x - q.y) * .03, vWP.y * .15 + pn * 3.)) * .7 + sbN(vec2((q.x + q.y) * .07, vWP.y * .4)) * .3;      // snow lying on the ledges
        rk = mix(rk, smoothstep(th - .14, th + .14, gully) * (.55 + .45 * steep) * (1. - .85 * smoothstep(.42, .7, led + (sbN(q * .53 + vWP.y * .4) - .5) * .2)), wk);           // crisp ribs standing out of the steep snow, couloirs of snow between them
        // trodden lanes: along both quays, round the pond, along every terrace street, round the square
        float rvx = 4.5 * sin(q.y * .012 + 1.3) * smoothstep(262., 345., q.y);
        float hw = 8.5 + uTrk.x * smoothstep(uTrk.y - 62., uTrk.y - 34., q.y) * (1. - smoothstep(uTrk.y + 34., uTrk.y + 60., q.y));
        float town = smoothstep(120., 150., q.y) * (1. - smoothstep(496., 506., q.y));
        float wob = sin(q.y * .21) * .45 + sin(q.x * .17) * .4;
        float lane = (1. - smoothstep(.5, 1.9, abs(abs(q.x - rvx) - hw - 6.9 + wob))) * town;
        float tx = mod(q.x - 34., 26.) - 2.9 + wob;
        lane = max(lane, (1. - smoothstep(.5, 1.9, abs(tx))) * step(34., q.x) * step(q.x, 166.) * smoothstep(165., 180., q.y) * (1. - smoothstep(496., 506., q.y)));
        float dsq = length(q - uTrk.zw), sled = 0.;
        lane = max(lane, 1. - smoothstep(1., 2.2, abs(dsq - 21.5 + wob)));
        lane = max(lane, (1. - smoothstep(.8, 1.7, abs(q.y - uTrk.w + wob))) * step(rvx + hw + 6., q.x) * step(q.x, uTrk.z - 20.));
        lane = max(lane, 1. - smoothstep(.9, 2.3, abs(length(q - vec2(-38., -177.)) - 4.6 + wob)));
        lane = max(lane, (1. - smoothstep(.6, 1.8, abs(q.x + 24.5 + wob))) * smoothstep(150., 158., -q.y) * (1. - smoothstep(236., 244., -q.y)));
        lane = max(lane, 1. - smoothstep(.5, 1.7, abs(length((q - vec2(-37.5, -204.)) / vec2(4.5, 12.5)) - 1.) * 4.5 + wob * .5));
        { vec2 pa = q - vec2(-26.5, -81.), ba = vec2(3., 22.), pb = q - vec2(-23.5, -59.), bc = vec2(16., 2.5);                   // the way from the hamlet's street across the shelf to the causeway
          float d1 = length(pa - ba * clamp(dot(pa, ba) / 493., 0., 1.)), d2 = length(pb - bc * clamp(dot(pb, bc) / 262.25, 0., 1.));
          lane = max(lane, 1. - smoothstep(.6, 1.8, min(d1, d2) + wob * .6));
          lane = max(lane, 1. - smoothstep(.8, 2., abs(length(q - vec2(-21.5, -50.5)) - 2.9 + wob * .6)));                        // and the ring trodden round the snowman
          lane = max(lane, (1. - smoothstep(.5, 1.5, abs(q.x + 22.2 + wob * .4))) * step(-59., q.y) * step(q.y, -53.)); }
        { float st = smoothstep(72., 80., -q.y) * (1. - smoothstep(141., 152., -q.y)), sx = q.x + 30. + .9 * sin(q.y * .07);      // the hamlet's street, trodden from wall to wall, and the lane along the far bank from the mill to the cottages
          lane = max(lane, (1. - smoothstep(2.6, 5.2, abs(sx) + wob)) * st * .9);
          lane = max(lane, (1. - smoothstep(.5, 1.7, abs(q.x + 17. + 1.6 * sin(q.y * .085) + wob * .5))) * smoothstep(24., 32., q.y) * (1. - smoothstep(100., 108., q.y))); }
        { float gzn = smoothstep(139., 146., -q.y) * (1. - smoothstep(224., 236., -q.y));                 // sledge runs down the bank between the footpath and the causeway, all the way to the hamlet's last yard: paired runner lines
          float c1 = abs(q.x + 16. - 3.2 * sin(q.y * .06)), c2 = abs(q.x + 12.4 - 2.2 * sin(q.y * .05 + 2.)), c3 = abs(q.x + 20. - 2.4 * sin(q.y * .07 + 4.));
          float s1 = abs(c1 - .32), s2 = abs(c2 - .32), s3 = abs(c3 - .32);
          sled = (1. - smoothstep(.09, .3, min(s1, min(s2, s3)))) * gzn;
          lane = max(lane, (1. - smoothstep(.25, .8, min(c1, min(c2, c3)) + wob * .2)) * gzn * .6);      // and the snow packed between the runners by the boots that haul the sledges up again
          // the sleigh's runner lines: down the hamlet's street and on up the footpath to the gate, and the hoofprints between them
          float rz = smoothstep(74., 82., -q.y) * (1. - smoothstep(236., 244., -q.y)), cxs = mix(q.x + 30. + .9 * sin(q.y * .07), q.x + 24.5 + wob, smoothstep(140., 156., -q.y));
          float hoof = (1. - smoothstep(.1, .24, length(vec2(abs(cxs) - .2, mod(q.y + step(0., cxs) * .55, 1.1) - .55))));
          sled = max(sled, max(1. - smoothstep(.07, .24, abs(abs(cxs) - .78)), hoof * .8) * rz); }
        rk *= 1. - (1. - smoothstep(13., 21., abs(q.x))) * smoothstep(40., 52., -q.y) * (1. - smoothstep(236., 250., -q.y));
        { float lz = mod(-q.y - 39.88, 16.48) - 8.24, dx = abs(q.x) - 7.;                          // one lamp every 16.48 m up both parapets
          lampWash = exp(-(lz * lz * .03 + dx * dx * .017)) * smoothstep(0., 1.5, dx) * smoothstep(44., 52., -q.y) * (1. - smoothstep(238., 246., -q.y)) * (1. - rk); }
        vec3 driftC = vec3(1.);
        { float bk = smoothstep(-22., -19., q.x) * (1. - smoothstep(-10.5, -8., q.x)) * smoothstep(128., 138., -q.y) * (1. - smoothstep(212., 228., -q.y)) * (1. - rk);      // the bank between the footpath and the causeway: the wind's drifts across it, a lit crest and a blue lee to each
          float dv = sbN(vec2(q.x * .2 + q.y * .06, q.y * .42 + 3.)) + .35 * sbN(vec2(q.x * .6 + 5., q.y * 1.1));
          float crest = smoothstep(.6, .72, dv) * (1. - smoothstep(.72, .82, dv)), lee = smoothstep(.78, .92, dv) * (1. - smoothstep(.98, 1.2, dv));
          driftC = mix(vec3(1.), vec3(.64, .73, .95), lee * bk * .75) * (1. + .14 * crest * bk); driftRim = crest * bk * (1. - lane); }
        lane *= (.45 + .55 * sbN(q * 1.3)) * (1. - rk);
        diffuseColor.rgb *= mix(vec3(1.), vec3(.7, .76, .9), lane * .8) * mix(vec3(1.), vec3(.56, .64, .86), sled * (1. - rk) * (.7 + .3 * sbN(q * .9)));
        float bands = mix(.84, .78 + .14 * sin(vWP.y * .55 + pn * 9.), (1. - smoothstep(60., 300., d))) * (.8 + .4 * sbN(q * .31)) * (.72 + .56 * gully);
        diffuseColor.rgb *= (1. + .06 * drift + .035 * fine) * (.7 + .3 * vAO) * driftC;
        diffuseColor.rgb = mix(diffuseColor.rgb, uRock * bands * (.62 + .4 * sbN(vec2(dot(q, vec2(.06)), vWP.y * 1.4)) + .16 * sbN(vec2(dot(q, vec2(.9, .7)), vWP.y * .12))), rk * mix(.85, .55, wk));
        vec2 c = floor(q * 9.); float h = fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453);
        sparkle = step(.992, h) * (1. - rk) * (1. - smoothstep(5., 50., d)) * (.5 + .5 * sin(uTime * 2.5 + h * 300.)); }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(.9, .95, 1.) * sparkle * 1.5 + vec3(1., .6, .24) * lampWash * .6 + vec3(.78, .86, 1.) * driftRim * .1;');
  };
  return m;
}

// ---------------------------------------------------------------- additive light pools on snow and ice
function makePools(list, time) {
  const n = list.length, P = new Float32Array(n * 12), U = new Float32Array(n * 8), C = new Float32Array(n * 16), I = new Uint16Array(n * 6);
  list.forEach((q, i) => {
    const [x, y, z] = q.p, a = q.u, b = q.v, c = q.c, ph = ((i * 0.618) % 1) * 0.98 + (q.f ? 1 : 0) + (q.s ? 2 : 0);      // the whole part: 1 = a flame's light, 2 = a streak on the ice
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) {
      const s = cs[k][0], t = cs[k][1], o = i * 4 + k;
      P[o * 3] = x + a[0] * s + b[0] * t; P[o * 3 + 1] = y + a[1] * s + b[1] * t; P[o * 3 + 2] = z + a[2] * s + b[2] * t;
      U[o * 2] = s; U[o * 2 + 1] = t; C[o * 4] = c[0]; C[o * 4 + 1] = c[1]; C[o * 4 + 2] = c[2]; C[o * 4 + 3] = ph;
    }
    I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.setAttribute('aCol', new THREE.BufferAttribute(C, 4)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: `attribute vec4 aCol; varying vec2 vUv; varying vec4 vCol; varying vec2 vXZ; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vUv = uv; vCol = aCol; vXZ = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec4 vCol; varying vec2 vXZ; ${fx.GLSL_FOG_PARS_FRAG}
      float plH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float plN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(plH(i), plH(i + vec2(1., 0.)), f.x), mix(plH(i + vec2(0., 1.)), plH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){ float r = length(vUv); if (r > 1.) discard; float a = (1. - r); a = a * a * (1.4 - .4 * a);
        float code = floor(vCol.a + .001), ph = fract(vCol.a), fl = step(.5, mod(code, 2.));
        a *= mix(1., (.22 + 1.15 * smoothstep(.24, .76, plN(vXZ * vec2(1.7, .8 + .6 * ph) + ph * 31.))) * (1.12 - .42 * vUv.y), step(1.5, code));      // a streak on the ice is broken along its length by frost and blade marks, brightest under its lamp
        a *= mix(.9 + .1 * sin(uTime * (5. + 9. * ph) + ph * 40.) * sin(uTime * 1.7 + ph * 17.), .72 + .2 * sin(uTime * 9. + ph * 40.) * sin(uTime * 5.3 + ph * 17.) + .08 * sin(uTime * 23. + ph * 9.), fl);
        gl_FragColor = vec4(vCol.rgb * a * (1. - fxFog()), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; mesh.frustumCulled = false; mesh.name = 'light-pools';
  return mesh;
}

// ---------------------------------------------------------------- chimney smoke: billboard puffs rising and shearing in the wind
function makeSmoke(emitters, rng, time, wind, cool, warm, reach) {
  const K = 9, n = emitters.length * K, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(n * 4), D = new Float32Array(n * 4);
  emitters.forEach((e, i) => {
    const seed = rng(), s = e[3] || 1;
    for (let k = 0; k < K; k++) { const o = (i * K + k) * 4; B[o] = e[0]; B[o + 1] = e[1]; B[o + 2] = e[2]; B[o + 3] = s; D[o] = (k + rng() * 0.6) / K + seed; D[o + 1] = rng(); D[o + 2] = rng.range(0.75, 1.3); D[o + 3] = rng.range(0.05, 0.085); }
  });
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uWind: { value: new THREE.Vector3(wind[0], 1, wind[1]) }, uCool: { value: cool }, uWarm: { value: warm } },
    fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `attribute vec4 aBase, aData; uniform float uTime; uniform vec3 uWind; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float age = fract(uTime * aData.w + aData.x), s = aBase.w;
        vec3 p = aBase.xyz; float lift = (1. - exp(-age * 2.2)) * 11. * aData.z * s;
        p.y += lift; p.xz += uWind.xz * (age * age * 9. + age * 2.) * s;
        p.x += sin(age * 9. + aData.y * 30. + uTime * .4) * age * 1.3 * s; p.z += cos(age * 7. + aData.y * 50.) * age * 1.1 * s;
        float size = (.55 + 5.4 * pow(age, .75)) * s * (.8 + .5 * aData.y);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); mvPosition.xy += position.xy * size;
        vQ = position.xy; vK = vec3(age, smoothstep(0., .08, age) * pow(1. - age, 1.6), aData.y);
        gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uCool, uWarm; uniform float uTime; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r = length(vQ); if (r > 1.) discard;
        float lump = .78 + .22 * sin(vQ.x * 5. + vK.z * 30. + uTime * .6) * cos(vQ.y * 4.3 - vK.z * 11.);
        float lump2 = sin(vQ.x * 9. - vK.z * 17. + uTime * .4) * sin(vQ.y * 8. + vK.z * 23.);
        float a = (1. - smoothstep(.05, 1., r + (lump - .78) * 1.6 + lump2 * .12)) * vK.y * .5;
        vec3 col = mix(uWarm, uCool, smoothstep(0., .45, vK.x)) * (.82 + .3 * vQ.y);
        gl_FragColor = vec4(fxFogPremult(col * a, a), a); }`,
  });
  // the chimneys of each reach (reach(e) -> 0, 1, ...) are a mesh of their own with a sphere round them and their plumes: a reach wholly out of the picture is not drawn
  const group = new THREE.Group(); group.name = 'chimney-smoke';
  const parts = new Map(); emitters.forEach((e, i) => { const k = reach ? reach(e) : 0; if (!parts.has(k)) parts.set(k, []); parts.get(k).push(i); });
  for (const idx of parts.values()) {
    const gg = g.clone(), nn = idx.length * K, Bp = new Float32Array(nn * 4), Dp = new Float32Array(nn * 4), c = new THREE.Vector3(); let r = 0;
    idx.forEach((i, j) => { Bp.set(B.subarray(i * K * 4, (i + 1) * K * 4), j * K * 4); Dp.set(D.subarray(i * K * 4, (i + 1) * K * 4), j * K * 4); c.x += emitters[i][0] / idx.length; c.y += emitters[i][1] / idx.length; c.z += emitters[i][2] / idx.length; });
    for (const i of idx) r = Math.max(r, Math.hypot(emitters[i][0] - c.x, emitters[i][1] - c.y, emitters[i][2] - c.z) + 34 * (emitters[i][3] || 1));
    gg.setAttribute('aBase', new THREE.InstancedBufferAttribute(Bp, 4)); gg.setAttribute('aData', new THREE.InstancedBufferAttribute(Dp, 4)); gg.instanceCount = nn;
    gg.boundingSphere = new THREE.Sphere(c, r);
    const mesh = new THREE.Mesh(gg, m); mesh.frustumCulled = true; mesh.renderOrder = 2; mesh.name = 'chimney-smoke'; group.add(mesh);
  }
  g.dispose();
  return group;
}

// ---------------------------------------------------------------- skaters: small instanced figures gliding round the pond
// where a skater is at angle a on its (slowly drifting, slightly wobbling) oval; shared by the figures and their ice trails
const SKATE_GLSL = `
  vec2 skPos(vec4 iC, vec4 iP, float a, float t){
    vec2 ctr = iC.xy + 1.4 * vec2(sin(t * .07 + iP.x), cos(t * .09 + iP.x * 2.));
    return ctr + vec2(iC.z * cos(a), iC.w * sin(a)) * (1. + .1 * sin(a * 2. + iP.x * 3.)); }
  vec2 skTan(vec4 iC, vec4 iP, float a){ return normalize(vec2(-iC.z * sin(a), iC.w * cos(a))) * sign(iP.y); }
  uniform vec4 uEsc;
  vec2 escPos(vec4 iC, float z){ return vec2(mix(iC.y, iC.x, smoothstep(uEsc.z, uEsc.y, z)), z); }`;
function makeSkaters(list, time, amb, warm, o = {}) {
  // each figure may carry its own ground `g` (y = g[0] + g[1] * dz + g[2] * dz * dz, dz = z - g[3]) and `t` = [trail, lean]; the rest take o.ground / o.trail / o.lean
  const G0 = o.ground || [0.06, 0, 0, 0], T0 = [o.trail ?? 1, o.lean ?? 1], uEsc = o.escort || { value: new THREE.Vector4(0, 1, 0, 0) }, fadeU = { value: 1 };      // fadeU: 0 = folded away .. 1 = there (group.userData.fade)
  const P = [], Nn = [], C = [], A = [], I = []; let nv = 0; const SEG = 6;
  // six-sided lofted tube through rings [y, rx, rz, cx, cz]
  const loft = (rings, col, part, cap = true) => {
    const b0 = nv;
    rings.forEach((r, j) => {
      for (let k = 0; k < SEG; k++) {
        const a = (k + 0.5) / SEG * TAU, c = Math.cos(a), s = Math.sin(a);
        P.push((r[3] || 0) + c * r[1], r[0], (r[4] || 0) + s * r[2]); Nn.push(c, 0.2, s); C.push(col[0], col[1], col[2]); A.push(part); nv++;
      }
      if (j) for (let k = 0; k < SEG; k++) { const a = b0 + (j - 1) * SEG + k, b = b0 + (j - 1) * SEG + (k + 1) % SEG, c = a + SEG, d = b + SEG; I.push(a, c, b, b, c, d); }
    });
    if (cap) { const t0 = b0 + (rings.length - 1) * SEG; for (let k = 1; k < SEG - 1; k++) I.push(t0, t0 + k + 1, t0 + k); }
  };
  const W = [1, 1, 1], skin = [0.92, 0.64, 0.5], dark = [0.09, 0.09, 0.13];
  loft([[0.6, 0.31, 0.24], [0.8, 0.25, 0.19], [1.05, 0.2, 0.155], [1.32, 0.24, 0.17], [1.47, 0.2, 0.15], [1.53, 0.08, 0.08]], W, 0);       // coat flaring to a skirt
  for (const sx of [-1, 1]) {
    loft([[0, 0.07, 0.15, sx * 0.11, 0.04], [0.11, 0.07, 0.08, sx * 0.11], [0.45, 0.085, 0.09, sx * 0.11], [0.72, 0.105, 0.105, sx * 0.11]], dark, sx < 0 ? 1 : 2);   // boot and leg
    loft([[0.82, 0.03, 0.03, sx * 0.31], [0.9, 0.06, 0.06, sx * 0.31], [1.15, 0.065, 0.065, sx * 0.3], [1.44, 0.078, 0.078, sx * 0.25]], W, sx < 0 ? 3 : 4);          // arm
  }
  loft([[1.5, 0.07, 0.07], [1.57, 0.115, 0.12], [1.67, 0.13, 0.135], [1.77, 0.115, 0.12]], skin, 5, false);                               // head
  loft([[1.72, 0.142, 0.147], [1.81, 0.136, 0.14], [1.9, 0.085, 0.09], [1.96, 0.03, 0.03]], W, 6);                                        // woolly hat
  loft([[1.95, 0.03, 0.03], [1.995, 0.06, 0.06], [2.04, 0.03, 0.03]], [1.5, 1.5, 1.6], 5);                                                // pompom
  loft([[1.45, 0.155, 0.145], [1.535, 0.155, 0.145]], W, 6, false);                                                                       // scarf
  { const b0 = nv; for (const [x, y, z] of [[-0.07, 1.52, -0.12], [0.07, 1.52, -0.12], [0.08, 1.4, -0.62], [-0.08, 1.4, -0.62]]) { P.push(x, y, z); Nn.push(0, 1, 0); C.push(1, 1, 1); A.push(7); nv++; } I.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3); }   // its flying tail
  { const b0 = nv, X = 0.37, Z = 0.12, r = 0.085;         // a lantern in the right hand (part 8): drawn only for figures whose t[0] is -1, folded away for the rest
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (const y of [0.6, 0.84]) { P.push(X + dx * r, y, Z + dz * r); Nn.push(dx, 0.2, dz); C.push(1, 1, 1); A.push(8); nv++; }
    for (let k = 0; k < 4; k++) { const a = b0 + k * 2, b = b0 + ((k + 1) % 4) * 2; I.push(a, a + 1, b, b, a + 1, b + 1); } }
  const n = list.length, iC = new Float32Array(n * 4), iP = new Float32Array(n * 4), iK = new Float32Array(n * 3), iK2 = new Float32Array(n * 3), iG = new Float32Array(n * 4), iT = new Float32Array(n * 2);
  list.forEach((s, i) => { iC.set(s.c, i * 4); iP.set(s.p, i * 4); iK.set(s.k, i * 3); iK2.set(s.k2, i * 3); iG.set(s.g || G0, i * 4); iT.set(s.t || T0, i * 2); });
  const inst = (g) => { g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iG', new THREE.InstancedBufferAttribute(iG, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 2)); g.instanceCount = n; return g; };
  const g = inst(new THREE.InstancedBufferGeometry());
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(A), 1)); g.setIndex(I);
  g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 3)); g.setAttribute('iK2', new THREE.InstancedBufferAttribute(iK2, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uAmb: { value: amb }, uWarm: { value: warm }, uEsc, uEdgeK: { value: o.edge ?? 0 }, uFade: fadeU }, fog: true, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 color, iK, iK2; attribute vec4 iC, iP, iG; attribute vec2 iT; attribute float aPart; uniform float uTime, uEdgeK, uFade; varying vec3 vCol, vN; varying float vSide; ${fx.GLSL_FOG_PARS_VERT} ${SKATE_GLSL}
      void main(){ float a = iP.x + uTime * iP.y, dir = sign(iP.y), sz = iP.z;
        vec2 pos = skPos(iC, iP, a, uTime), t = skTan(iC, iP, a);
        if (iC.z < 0.) { float ze = max(uEsc.x + iP.x, iC.w); pos = escPos(iC, ze); t = normalize(escPos(iC, ze - .6) - pos); dir = 0.; }
        vec3 fw = vec3(t.x, 0., t.y), rt = vec3(t.y, 0., -t.x);
        vec3 l = position * sz; float s = sin(uTime * 1.5 * iP.w + iP.x * 7.), hip = clamp(1. - l.y / (.74 * sz), 0., 1.), arm = clamp(1.5 - l.y / sz, 0., 1.);
        if (aPart > .5 && aPart < 1.5) { l.z += (.52 * s - .06) * hip * sz; l.x -= .24 * max(-s, 0.) * hip * sz; l.y += .13 * max(-s, 0.) * hip * hip * sz; }
        if (aPart > 1.5 && aPart < 2.5) { l.z -= (.52 * s + .06) * hip * sz; l.x += .24 * max(s, 0.) * hip * sz; l.y += .13 * max(s, 0.) * hip * hip * sz; }
        if (aPart > 2.5 && aPart < 3.5) { l.z -= .38 * s * arm * sz; l.x -= .06 * arm * sz; }
        if (aPart > 3.5 && aPart < 4.5) { l.z += .38 * s * arm * sz; l.x += .06 * arm * sz; }
        if (aPart > 7.5) l = iT.x < -.5 ? l + vec3(.04, 0., .26 * s) * sz : vec3(0.);
        if (aPart > 6.5 && aPart < 7.5) { float k = -position.z - .12; l.y += k * (.16 * sin(uTime * 9. + iP.x * 5. + k * 6.) + .12) * sz; l.x += k * .2 * sin(uTime * 7. + iP.x * 3.) * sz; }
        float up = max(l.y - .5 * sz, 0.);
        l.z += .32 * up * iT.y; l.x += -.16 * dir * l.y * iT.y + .1 * s * up; l.y -= .05 * abs(s) * sz * step(.5 * sz, l.y) + .06 * up;
        float gd = pos.y - iG.w; vec3 foot = vec3(pos.x, iG.x + iG.y * gd + iG.z * gd * gd, pos.y);
        // on the pond (uEdgeK 1) no figure is ever cut by the frame: as one comes to the left, right or bottom edge it draws itself in, within about its own width
        // (a few frames in flight); walkers and village folk (uEdgeK 0) are left as they are
        vec4 cF = projectionMatrix * viewMatrix * vec4(foot, 1.); float wF = max(cF.w, .3), wd = .7 * sz * projectionMatrix[0][0] / wF, ht = 2.04 * sz * projectionMatrix[1][1] / wF;
        float edge = cF.w > .3 ? clamp((1. - abs(cF.x) / wF - .2 * wd) / max(.9 * wd, 1e-4), 0., 1.) * clamp((cF.y / wF + 1. - .06 * ht) / max(.4 * ht, 1e-4), 0., 1.) : 1.;
        vec3 w = foot + (rt * l.x + vec3(0., l.y, 0.) + fw * l.z) * (mix(1., edge, uEdgeK) * uFade);
        vN = rt * normal.x + vec3(0., normal.y, 0.) + fw * normal.z; vSide = pos.x;
        vCol = aPart > 7.5 ? vec3(15., 8.5, 3.) : aPart > 5.5 ? iK2 : (aPart < .5 || (aPart > 2.5 && aPart < 4.5) ? iK : color);
        vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uAmb, uWarm; varying vec3 vCol, vN; varying float vSide; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float lamp = .5 + .5 * dot(n, normalize(vec3(sign(vSide), .35, .25)));
        vec3 c = vCol * (uAmb * (.6 + .4 * n.y) + uWarm * (.25 + 1.1 * lamp * lamp) + vec3(.5, .38, .5) * pow(max(-n.z, 0.), 2.) * .22);
        gl_FragColor = vec4(fxApplyFog(c), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'skaters';
  // contact shadows and the fresh white lines their blades leave on the ice
  const TP = [], TA = [], TI = [], NT = 12;
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { TP.push(x, 0, z); TA.push(0); }
  TI.push(0, 1, 2, 0, 2, 3);
  for (let i = 0; i <= NT; i++) { TP.push(-1, 0, i / NT, 1, 0, i / NT); TA.push(1, 1); if (i) { const a = 4 + (i - 1) * 2; TI.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
  const tg = inst(new THREE.InstancedBufferGeometry());
  tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TP), 3)); tg.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(TA), 1)); tg.setIndex(TI);
  const tm = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uSh: { value: new THREE.Vector4(...(o.shadow || [0, 1, 0, 0])) }, uEsc, uFade: fadeU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: `attribute vec4 iC, iP, iG; attribute vec2 iT; attribute float aPart; uniform float uTime; uniform vec4 uSh; varying vec3 vK; varying float vTr; ${fx.GLSL_FOG_PARS_VERT} ${SKATE_GLSL}
      void main(){ float tt = aPart > .5 ? position.z : 0., back = tt * 3.2, a = iP.x + (uTime - back) * iP.y;
        vec2 pos = skPos(iC, iP, a, uTime), t = skTan(iC, iP, a);
        if (iC.z < 0.) { float ze = max(uEsc.x + iP.x, iC.w) + tt * 20.; pos = escPos(iC, ze); t = normalize(escPos(iC, ze - .6) - pos); }
        vec3 fw = vec3(t.x, 0., t.y), rt = vec3(t.y, 0., -t.x), w;
        float gd = pos.y - iG.w, gy = iG.x + iG.y * gd + iG.z * gd * gd; vTr = iT.x;
        if (aPart < .5) { float al = position.z * .5 + .5;      // uSh: the way the low light throws a shadow (x, z), its length in body heights, its strength; length 0 = a contact blob
          vec3 blob = rt * position.x * .5 * iP.z + fw * (position.z * .8 + .05) * iP.z;
          vec3 lng = vec3(uSh.x, 0., uSh.y) * ((al * uSh.z - .18) * iP.z) + vec3(-uSh.y, 0., uSh.x) * (position.x * (.3 + .16 * al) * iP.z);
          w = vec3(pos.x, gy - .03, pos.y) + mix(blob, lng, step(.01, uSh.z));
          if (iT.x < -.5) { vec3 o = (rt * position.x + fw * position.z) * 2.7 + rt * .37 * iP.z; w = vec3(pos.x + o.x, gy + .05 + (iG.y + 2. * iG.z * gd) * o.z, pos.y + o.z); } }
        else w = vec3(pos.x, gy - .02, pos.y) + rt * (position.x * (.06 + .05 * tt) + .2 * sin((uTime - back) * 1.5 * iP.w + iP.x * 7.) * iP.z) - fw * .1;
        vK = vec3(aPart > .5 ? position.x : position.x, aPart > .5 ? tt : position.z, aPart);
        vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec4 uSh; uniform float uFade; varying vec3 vK; varying float vTr; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ vec3 c; float a;
        if (vK.z < .5) { float al = vK.y * .5 + .5, lng = (1. - smoothstep(.3, 1., abs(vK.x))) * smoothstep(0., .05, al) * (1. - al * al) * uSh.w;
          a = uSh.z > .01 ? lng : (1. - smoothstep(.15, 1., length(vK.xy))) * .55; c = vec3(.004, .008, .03);
          if (vTr < -.5) { a = 1. - smoothstep(0., 1., length(vK.xy)); a *= a * .5; c = vec3(1.5, .92, .42); } }      // a lantern's pool
        else { a = pow(clamp(1. - vK.y, 0., 1.), 1.4) * .75 * (1. - vK.x * vK.x * .6) * smoothstep(0., .04, vK.y) * max(vTr, 0.); c = vec3(.72, .8, 1.) * 1.15; }
        gl_FragColor = vec4(fxApplyFog(c), a * uFade); }`,
  });
  const trails = new THREE.Mesh(tg, tm); trails.frustumCulled = false; trails.renderOrder = 1; trails.name = 'skate-trails';
  const group = new THREE.Group(); group.add(mesh, trails); group.userData.fade = fadeU;
  return group;
}

// ---------------------------------------------------------------- the frozen river: dark glassy ice with cracks, skate scratches,
// wind-packed snow, and a real (analytic) mirror image of the viaduct, its lanterns and the passing train
function makeIceSheet(geometry, o) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: o.time, uDeep: { value: o.deep }, uIce: { value: o.ice }, uSnowLit: { value: o.snowLit }, uSkyH: { value: o.skyH }, uSkyZ: { value: o.skyZ }, uBand: { value: o.band }, uDeep2: { value: o.deep2 },
      uWarm: { value: o.warm }, uSk: { value: o.ovals }, uTrain: { value: o.train }, uPond: { value: o.pond }, uSkM: { value: o.skM }, uSkC: { value: o.skC } },
    fog: true,
    vertexShader: `attribute float aDepth, aSnow; varying vec3 vWP; varying float vDepth, vSnow; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vWP = (modelMatrix * vec4(position, 1.)).xyz; vDepth = aDepth; vSnow = aSnow;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform float uTime; uniform vec3 uDeep, uDeep2, uIce, uSnowLit, uSkyH, uSkyZ, uWarm, uTrain, uBand; uniform vec4 uSk[16]; uniform vec4 uPond; uniform vec4 uSkM[24]; uniform vec3 uSkC[24];
      varying vec3 vWP; varying float vDepth, vSnow; ${fx.GLSL_FOG_PARS_FRAG}
      const float PITCH = 41.;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      float crack(vec2 p){ vec2 i = floor(p), f = fract(p); float a = 8., b = 8.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 r = g + h22(i + g) - f; float d = dot(r, r); if (d < a) { b = a; a = d; } else if (d < b) b = d; }
        return sqrt(b) - sqrt(a); }
      void main(){
        vec3 V = normalize(vWP - cameraPosition); float dist = length(vWP - cameraPosition), px = dist * .0022;
        vec2 q = vWP.xz; float n1 = vn(q * .09 + 3.), n2 = vn(q * .31 - 7.), n3 = vn(q * 1.1 + 5.);
        vec2 qw = q + 2.4 * vec2(vn(q * .13), vn(q * .13 + 19.));
        float near = (1. - smoothstep(50., 240., dist));
        float cm = smoothstep(.42, .7, vn(q * .045 + 7.)), cm2 = smoothstep(.5, .8, vn(q * .11 + 23.));       // cracks come in fields, most of the sheet is clear
        float c1 = crack(qw / 11.) * 11., l1 = (1. - smoothstep(.02, .02 + px * 1.3, c1)) * min(1., .05 / px) * (.25 + .75 * cm);
        float c2 = crack(qw / 2.6 + 5.) * 2.6, l2 = (1. - smoothstep(.008, .008 + px * 1.3, c2)) * (1. - smoothstep(10., 45., dist)) * .45 * cm2 * cm;
        vec2 qp = qw - V.xz / max(-V.y, .14) * .6; float c3 = crack(qp / 11.) * 11., l3 = (1. - smoothstep(0., .45, c3)) * (.2 + .8 * cm);
        vec3 body = mix(mix(uDeep, uDeep2, (1. - smoothstep(-44., -22., vWP.z))), uIce, .12 + .5 * n1 * n1 + .16 * n2);      // the gorge reach is paler, wind-polished ice
        body = mix(body, uIce * 1.25, .3 * smoothstep(.45, .85, vn(q * .4 + 2.)) * n3);
        float pdz = q.y - uPond.x + (n1 - .5) * 36. + (n2 - .5) * 9., pm = uPond.z * (1. - smoothstep(30., 60., -pdz)) * (1. - smoothstep(60., 100., pdz));      // its two ends are ragged lobes of swept ice, never a straight edge across the river       // (it reaches further up-river, toward the town, than down)       // the swept skating pond: polished ice, a mirror for the sky and the lights round it
        body = mix(body, uDeep * .8 + uIce * .3, .7 * pm);            // deep, clear ice: the mirror lies on a dark, saturated ground, so the pond is darker than the snow round it
        body += uIce * l3 * .4 * near;
        // old skate scratches following the skaters' ovals
        float sc = 0.;
        for (int i = 0; i < 16; i++) { vec4 e = uSk[i]; if (e.z > .5) {
          vec2 d = (q - e.xy) / e.zw; float r = length(d), x = (r - 1.) * min(e.z, e.w) + (vn(d * 2.5 + float(i) * 7.) - .5) * .6, w = .012 + px * .7;
          sc += (1. - smoothstep(w, w * 2.4, abs(x))) + .7 * (1. - smoothstep(w, w * 2.4, abs(x - .8))) + .7 * (1. - smoothstep(w, w * 2.4, abs(x + .95))); } }
        { float up = smoothstep(uPond.x + 30., uPond.x + 52., q.y) * (1. - smoothstep(uPond.x + 104., uPond.x + 128., q.y));      // the way up the river to the rink: long, crossing blade lines
          float rvx = 4.5 * sin(q.y * .012 + 1.3) * smoothstep(262., 345., q.y), w = .012 + px * .7, s2 = 0.;
          for (int i = 0; i < 4; i++) { float fi = float(i);
            float d = abs(q.x - rvx - (fi - 1.5) * 2.5 - 1.7 * sin(q.y * (.05 + .013 * fi) + fi * 2.1) - .5 * sin(q.y * .19 + fi));
            s2 += (1. - smoothstep(w, w * 2.4, d)) + .7 * (1. - smoothstep(w, w * 2.4, abs(d - .42))); }
          sc += s2 * up; }
        sc = min(sc, 1.5) * (.35 + .65 * vn(q * .6 + 9.)) * (1. - smoothstep(12., 60., dist));
        float lines = max(l1, l2) * near + sc * .22;
        // snow: a drifted fringe along the banks and wind-packed patches
        vec2 qd = vec2(q.x, q.y * .4);                            // wind-packed snow lies in long soft drifts drawn out along the valley, thinning to a dusting at their edges
        float sn = vn(qd * .08 + 11.) * .55 + vn(qd * .27 + 2.) * .3 + n3 * .15;
        float soft = (1. - smoothstep(124., 150., q.y)) * smoothstep(-16., 6., q.y);      // between the pond and the viaduct the drifts are soft-edged and gather toward the banks: clear, scratched ice down the middle
        float cover = clamp(vSnow, 0., 1.), drift = smoothstep(1.02 - cover - .13 - .11 * soft, 1.02 - cover + .05 + .06 * soft, sn + (n3 - .5) * .05) * (1. - .6 * soft * smoothstep(1.5, 3., vDepth));
        float snow = max(1. - smoothstep(.2, 1.7, vDepth + (n2 - .5) * 1.1 + (n3 - .5) * .4), drift * drift * (.82 + .18 * vn(vec2(q.x * 1.7, q.y * .3))));
        // mirror: the dusk sky; under it what really stands up the valley (the far ridges, the crag, the castle); in front of those the viaduct's arcade
        // with its lanterns and the train; nearest, the skaters. Every image lies where a flat mirror puts it, at its true size
        vec3 N = normalize(vec3((n3 - .5) * .05, 1., (vn(q * 1.1 + 31.) - .5) * .05));
        vec3 R = reflect(V, N); R.y = abs(R.y) + .002;
        vec3 R0 = vec3(V.x, abs(V.y) + .002, V.z);                // the undisturbed mirror ray, for the lights
        float fres = .05 + .8 * pow(1. - clamp(-V.y, 0., 1.), 4.); fres = mix(fres, max(fres, mix(.66, .3, smoothstep(.07, .5, -V.y))), pm);      // glossier the more the eye grazes it; toward the eye the deep ice shows through
        vec3 Rm = normalize(mix(R, R0, .85 * pm));                // the polished pond gives a clean image, the rough river ice a broken one
        vec3 skyc = mix(uSkyH * (1. + .1 * pm), uSkyZ, mix(pow(clamp(R.y, 0., 1.), .45), smoothstep(.1, .52, Rm.y), pm)), add = vec3(0.); float sil = 0.;
        float bz = max(-R0.z, 0.) / max(length(R0.xz), 1e-3);
        skyc += uBand * pow(bz, 5.) * exp(-R0.y * R0.y * 4.) * mix(.3, .5, pm) * (1. + .3 * n1);            // the ember slot up the valley, mirrored down the river: never brighter than the sky that stands in the arches
        vec3 refl = skyc, hill = uSnowLit * .4 + uSkyZ * .22;      // snow slopes in the blue of the dusk
        if (Rm.z < -.02) {
          float iz = 1. / max(-Rm.z, .05), az = Rm.x * iz, sl = Rm.y * iz;
          float ridge = .15 + .17 * smoothstep(.06, .6, abs(az - .03)) + .05 * (vn(vec2(az * 11. + 3., 1.)) - .5);      // the far skyline: lowest in the pass behind the castle
          refl = mix(skyc, mix(hill, skyc, .16), 1. - smoothstep(-.012, .012, sl - ridge));
          float dzc = vWP.z + 292.;
          if (dzc > 40.) {
            float hx = vWP.x + az * dzc, hy = sl * dzc, sb = 1. + dzc * .004;
            float crag = 56. * (1. - smoothstep(46., 130., abs(hx))) + 7. * (vn(vec2(hx * .06, 5.)) - .5);
            float tw = abs(mod(hx + 4.5, 9.) - 4.5), ti = floor((hx + 4.5) / 9.);
            float cst = step(abs(hx), 36.) * (13. + (9. + 14. * h21(vec2(ti, 3.))) * (1. - smoothstep(1.3, 2.4, tw)) + 12. * (1. - smoothstep(4., 9., abs(hx))));
            refl = mix(refl, mix(hill, uWarm * .34, .62), (1. - smoothstep(-sb, sb, hy - crag - cst)) * step(1., cst));      // the floodlit castle
            refl = mix(refl, hill * .85, 1. - smoothstep(-sb, sb, hy - crag));
          }
        }
        refl *= 1. - .8 * pm * smoothstep(60., 160., dist);      // from far up the river the pond is dark, deep ice carrying only its lights: the sky comes into the mirror as the eye comes down to it
        { float sg = R0.x < 0. ? -1. : 1., tb = (uPond.y + 8. - q.x * sg) / max(abs(R0.x), .03), hh = R0.y * tb, hz = q.y + R0.z * tb;      // the lit house fronts along the bank the mirror ray runs to
          float cw = hz * .37 + sg * 3.3, ci = floor(cw), cf = fract(cw), wn = h21(vec2(ci, sg * 5. + 2.)), wn2 = h21(vec2(ci, sg * 3. + 9.));
          float win = step(sg > 0. ? .5 : .78, wn) * smoothstep(0., .1, cf) * (1. - smoothstep(.2 + .5 * wn2, .32 + .6 * wn2, cf));      // windows of unequal width and height, some dark: never an even comb
          float hs = smoothstep(.3, .55, vn(vec2(hz * .085 + 3., sg * 7.))) * win * (.3 + 1.1 * wn2);
          refl = mix(refl, uDeep2 * .7, .8 * pm * (1. - smoothstep(5., 13., hh)));      // toward either bank the mirror holds the dark of the bank, not the sky
          add += uWarm * pm * (1.1 * hs * smoothstep(.6, 2.2, hh) * (1. - smoothstep(3.5 + 5. * wn, 6. + 7. * wn, hh)) * exp(-tb * .01) + .1 * smoothstep(uPond.y * .45, uPond.y + 2., abs(q.x)) * (.6 + .4 * n2)); }
        if (Rm.z < -.02 && vWP.z > 6.) {
          float t = vWP.z / -Rm.z; vec2 h = vWP.xy + Rm.xy * t;
          float xm = mod(h.x + PITCH * .5, PITCH) - PITCH * .5, bl = .45 + t * .0075;      // crisp enough to read as the arcade, softer the further the ray runs
          float solid = abs(h.x) > 3.5 * PITCH ? 1. : max(smoothstep(17. - bl, 17. + bl, abs(xm)), smoothstep(-bl, bl, h.y - 41.5 - sqrt(max(289. - xm * xm, 0.))));
          sil = solid * (1. - smoothstep(66.3 - bl, 66.3 + bl, h.y));
          float t0 = vWP.z / max(-R0.z, .02); vec2 g = vWP.xy + R0.xy * t0;
          float pxl = (floor(g.x / PITCH) + .5) * PITCH; vec2 dl = vec2((g.x - pxl) * .8, (g.y - 69.) * .05);
          add += uWarm * .5 * exp(-dot(dl, dl) * .35) * step(abs(g.x), 150.) * (.45 + .55 * vn(vec2(q.x * .7, q.y * .3)));
          float inT = step(uTrain.x - uTrain.y, g.x) * step(g.x, uTrain.x - 16.) * step(abs(g.x), 171.) * uTrain.z;
          float ty = (g.y - 69.4) * .22; add += uWarm * 1.3 * inT * exp(-ty * ty) * (.6 + .4 * sin(g.x * 1.6));
          vec2 df = vec2(g.x - uTrain.x + 14., (g.y - 68.) * .2); add += vec3(1., .42, .12) * 2.2 * exp(-dot(df, df) * .08) * step(abs(uTrain.x), 171.) * uTrain.z;
          float t2 = (vWP.z + 250.) / max(-R0.z, .02); vec2 h2 = vWP.xy + R0.xy * t2;
          add += uWarm * .4 * (1. - sil) * exp(-(h2.x * h2.x / 500. + (h2.y - 78.) * (h2.y - 78.) / 900.));
        }
        // the skaters' own images: each stands on its head under its skates, coat over legs, drawn out a little with the length of the ray
        float skm = 0.; vec3 skc = vec3(0.);
        if (dist < 170.) {
          float hl = max(length(R0.xz), 1e-3), rise = R0.y / hl; vec2 dr = R0.xz / hl;
          for (int i = 0; i < 24; i++) { vec4 e = uSkM[i]; if (e.z > .1) {
            vec2 rel = e.xy - q; float al = dot(rel, dr), pp = rel.x * dr.y - rel.y * dr.x, hh = al * rise / e.z;      // how far up the figure the ray meets it: 0 at the skates, 1 at the crown
            float w = e.z * (hh < .38 ? .1 : hh < .76 ? .16 : .085) + al * .012 + .03;
            float m = step(0., al) * (1. - smoothstep(w * .55, w, abs(pp))) * smoothstep(-.03, .04, hh) * (1. - smoothstep(.93, 1.03, hh));
            vec3 c = hh < .38 ? vec3(.012, .012, .02) : hh < .76 ? uSkC[i] : hh < .86 ? vec3(.3, .2, .16) : uSkC[i] * .6 + vec3(.12);
            skc = mix(skc, c, m); skm = max(skm, m); } }
        }
        float fro = smoothstep(.4, .76, n2 * .55 + n1 * .45 + (n3 - .5) * .3) * pm * mix(1., .5, smoothstep(40., 170., dist));      // frost blooms and scuffed ice: there the mirror is dull, and the image breaks up (less so from far off)
        refl = mix(refl, vec3(.026, .03, .062), sil * .9 * (1. - .45 * fro)) + add * (1. - .5 * fro);
        refl = mix(refl, skc, skm * .92);
        refl = mix(refl, uSkyZ * .42 + uIce * .4, fro * .5) * (1. - .3 * min(sc, 1.) * pm);
        vec3 col = mix(body, refl, fres) + vec3(.75, .88, 1.) * lines * .42 * (1. - fres * .6) * (1. + .15 * pm);
        col = mix(col, uDeep * 1.2, .8 * pm * (1. - smoothstep(1.4, 2.9, vDepth + (n2 - .5) * .5)));      // the shadowed line under the bank
        col = mix(col, uSnowLit * (.88 + .14 * vn(q * 2.3)), snow);
        gl_FragColor = vec4(fxApplyFog(col), 1.); }`,
  });
  const mesh = new THREE.Mesh(geometry, m); mesh.name = 'river-ice'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- snow-capped boulders (one merged mesh)
async function makeBoulders(list, rng, rockC, snowC, light, yld) {
  const P = [], C = [], I = []; let nv = 0, done = 0;
  const base = new THREE.IcosahedronGeometry(1, 1), bp = base.attributes.position, tmp = new THREE.Vector3();
  for (const [x, y, z, r] of list) {
    const sx = rng.range(0.8, 1.3), sy = rng.range(0.55, 0.85), sz = rng.range(0.8, 1.3), ph = rng() * 9, b0 = nv;
    for (let i = 0; i < bp.count; i++) {
      tmp.fromBufferAttribute(bp, i);
      const k = 1 + 0.2 * Math.sin(tmp.x * 3.1 + ph) * Math.sin(tmp.y * 2.7 + ph * 1.7) + 0.14 * Math.sin(tmp.z * 4.3 + ph * 0.6);
      const sn = sm(-0.05, 0.35, tmp.y + 0.15 * Math.sin(tmp.x * 5 + ph)), d = 0.75 + 0.25 * Math.sin(ph + i);
      P.push(x + tmp.x * r * sx * k, y + (tmp.y * sy * k + 0.22 * sn) * r, z + tmp.z * r * sz * k);
      const L = light(tmp.x, tmp.y * 0.7 + 0.5 * sn, tmp.z);
      C.push(lerp(rockC[0] * d, snowC[0], sn) * L[0], lerp(rockC[1] * d, snowC[1], sn) * L[1], lerp(rockC[2] * d, snowC[2], sn) * L[2]); nv++;
    }
    for (let i = 0; i < bp.count; i += 3) I.push(b0 + i, b0 + i + 1, b0 + i + 2);
    if (yld && ++done % 6 === 0) await yld();
  }
  base.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setIndex(I);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true })); mesh.name = 'boulders';
  return mesh;
}

// ---------------------------------------------------------------- banners and pennants: cloth waving in the vertex shader
function makeFlags(list, time, amb, warm) {
  const P = [], U = [], D = [], Wv = [], C = [], C2 = [], I = []; let nv = 0; const NU = 9, NV = 3;
  for (const f of list) {
    const b0 = nv;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, v = j / NV - 0.5, w = 1 - (f.taper || 0) * u;
      P.push(f.o[0] + f.a[0] * u + f.b[0] * v * w, f.o[1] + f.a[1] * u + f.b[1] * v * w, f.o[2] + f.a[2] * u + f.b[2] * v * w);
      U.push(u, v); D.push(f.n[0], f.n[1], f.n[2]); Wv.push(f.k, f.w, f.amp, f.ph);
      C.push(f.c[0], f.c[1], f.c[2]); C2.push(f.c2[0], f.c2[1], f.c2[2], f.band ? 1 : 0); nv++;
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = b0 + j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
  g.setAttribute('aDir', new THREE.BufferAttribute(new Float32Array(D), 3)); g.setAttribute('aWave', new THREE.BufferAttribute(new Float32Array(Wv), 4));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aC2', new THREE.BufferAttribute(new Float32Array(C2), 4)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uAmb: { value: amb }, uWarm: { value: warm } }, fog: true, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 color, aDir; attribute vec4 aWave, aC2; uniform float uTime; varying vec3 vCol; varying vec4 vC2; varying vec2 vUv; varying float vS; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float ph = aWave.x * uv.x - uTime * aWave.y + aWave.w, g = .5 + .5 * sin(uTime * .37 + aWave.w);
        float d = (sin(ph) + .45 * sin(ph * 2.3 + uv.y * 3. + 1.)) * aWave.z * uv.x * (.55 + .45 * g);
        vec3 p = position + aDir * d + vec3(0., -1., 0.) * abs(d) * .25 * uv.x;
        vS = .72 + .28 * cos(ph + .6); vCol = color; vC2 = aC2; vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uAmb, uWarm; varying vec3 vCol; varying vec4 vC2; varying vec2 vUv; varying float vS; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float bd = step(.5, vC2.w), av = abs(vUv.y);
        float trim = max(step(.37, av), bd * max(step(.84, vUv.x), step(abs(vUv.x - .36) * 7. + av * 4.2, 1.)));      // gold border, gold foot and a lozenge on the hanging ones
        trim *= 1. - bd * step(abs(vUv.x - .36) * 7. + av * 4.2, .55);
        gl_FragColor = vec4(fxApplyFog(mix(vCol, vC2.rgb, trim) * (uAmb + uWarm) * vS), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'banners';
  return mesh;
}

// ---------------------------------------------------------------- the lit church clock: dial and moving hands drawn in the shader
function makeClock(faces, time) {
  const P = [], U = [], I = [];
  faces.forEach((f, i) => {
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [s, t] of cs) { P.push(f.c[0] + f.r[0] * s, f.c[1] + f.rad * t, f.c[2] + f.r[2] * s); U.push(s, t); }
    I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time }, fog: true, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; ${fx.GLSL_FOG_PARS_VERT} void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; ${fx.GLSL_FOG_PARS_FRAG}
      float hand(vec2 p, float a, float len, float w){ vec2 d = vec2(sin(a), cos(a)); float t = clamp(dot(p, d), -.12, len); return 1. - smoothstep(w, w + .035, length(p - d * t)); }
      void main(){ float r = length(vUv); if (r > 1.) discard; float ang = atan(vUv.x, vUv.y + 1e-5);
        float tick = smoothstep(.7, .73, r) * (1. - smoothstep(.86, .89, r)) * step(abs(fract(ang / 6.2832 * 12. + .5) - .5), .1);
        float mn = uTime * .105 + 1.1, dk = max(max(tick, smoothstep(.9, .94, r)), max(hand(vUv, mn, .8, .04), hand(vUv, mn / 12. + 2.4, .52, .065)));
        dk = max(dk, 1. - smoothstep(.07, .1, r));
        vec3 face = vec3(1., .8, .5) * (2.1 - .7 * r) * (.96 + .04 * sin(uTime * 7.));
        gl_FragColor = vec4(fxApplyFog(mix(face, vec3(.03, .025, .035), dk)), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'church-clock';
  return mesh;
}

// ---------------------------------------------------------------- spindrift: snow torn off crests, roofs and parapets, streaming down the wind.
// emitters: [x, y, z, scale]; one draw call of billboards that stretch along the wind and catch the low key light
function makeSpindrift(emitters, rng, time, wind, cool, key, amount) {
  const K = 7, n = emitters.length * K, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(n * 4), D = new Float32Array(n * 4);
  emitters.forEach((e, i) => {
    const seed = rng(), s = e[3] || 1;
    for (let k = 0; k < K; k++) { const o = (i * K + k) * 4; B[o] = e[0]; B[o + 1] = e[1]; B[o + 2] = e[2]; B[o + 3] = s; D[o] = (k + rng() * 0.7) / K + seed; D[o + 1] = rng(); D[o + 2] = rng.range(0.7, 1.3); D[o + 3] = rng.range(0.16, 0.26) / Math.sqrt(s); }
  });
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aData', new THREE.InstancedBufferAttribute(D, 4));
  g.instanceCount = n;
  const wl = Math.hypot(wind[0], wind[1]) || 1;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uWind: { value: new THREE.Vector3(wind[0] / wl, amount, wind[1] / wl) }, uCool: { value: cool }, uKey: { value: key } },
    fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `attribute vec4 aBase, aData; uniform float uTime; uniform vec3 uWind; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float age = fract(uTime * aData.w + aData.x), s = aBase.w;
        float gust = .55 + .45 * sin(uTime * .31 + aBase.x * .05 + aBase.z * .03) * sin(uTime * .17 + aData.y * 3.);
        vec3 w = vec3(uWind.x, 0., uWind.z);
        vec3 p = aBase.xyz + w * (age * (11. + 5. * aData.y) * s * (.6 + .6 * gust));
        p.y += (sin(age * 5. + aData.y * 30.) * .5 + age * (1.6 * aData.z - .5)) * s;
        p += cross(w, vec3(0., 1., 0.)) * sin(age * 6. + aData.y * 50.) * age * 1.2 * s;
        float size = (.5 + 3.6 * age) * s * (.8 + .5 * aData.y);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vec3 wv = normalize((viewMatrix * vec4(w, 0.)).xyz + vec3(0., 0., 1e-4));
        vec2 ax = normalize(wv.xy + vec2(1e-4, 0.));                      // stretch each puff along the wind as it is seen
        mvPosition.xy += (ax * position.x * (1. + 1.3 * age) + vec2(-ax.y, ax.x) * position.y * .62) * size;
        vQ = position.xy; vK = vec3(age, smoothstep(0., .1, age) * pow(1. - age, 1.5) * uWind.y * gust, aData.y);
        gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uCool, uKey; uniform float uTime; varying vec2 vQ; varying vec3 vK; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r = length(vQ); if (r > 1.) discard;
        float lump = .7 + .3 * sin(vQ.x * 6. + vK.z * 30. - uTime * 1.3) * cos(vQ.y * 4.3 - vK.z * 11.);
        float a = (1. - smoothstep(.1, 1., r)) * vK.y * .62 * lump;
        vec3 col = uCool * (.8 + .3 * vQ.y) + uKey * (.55 + .45 * (1. - r));
        gl_FragColor = vec4(fxFogPremult(col * a, a), a); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'spindrift';
  return mesh;
}

// ---------------------------------------------------------------- snow squalls: broad, soft veils of falling snow that cross the valley with the wind.
// list: [z, y, width, height, phase, strength = 1]; each is an upright sheet across the flight line that wraps along X and fades as the lens nears it
function makeSqualls(list, time, wind, col, amount) {
  const n = list.length, P = new Float32Array(n * 12), U = new Float32Array(n * 8), C = new Float32Array(n * 16), A = new Float32Array(n * 4), I = new Uint16Array(n * 6);
  list.forEach((q, i) => {
    const cs = [[-1, 0], [1, 0], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) {
      const o = i * 4 + k; P[o * 3] = cs[k][0] * q[2] * 0.5; P[o * 3 + 1] = q[1] + cs[k][1] * q[3]; P[o * 3 + 2] = q[0];
      U[o * 2] = cs[k][0] * 0.5 + 0.5; U[o * 2 + 1] = cs[k][1]; C[o * 4] = q[4]; C[o * 4 + 1] = q[2]; C[o * 4 + 2] = 0.6 + 0.8 * ((i * 0.618) % 1); C[o * 4 + 3] = i; A[o] = q[5] ?? 1;
    }
    I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setAttribute('aSq', new THREE.BufferAttribute(C, 4)); g.setAttribute('aAmt', new THREE.BufferAttribute(A, 1)); g.setIndex(new THREE.BufferAttribute(I, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uWind: { value: new THREE.Vector2(wind[0], amount) }, uCol: { value: col } },
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `attribute vec4 aSq; attribute float aAmt; uniform float uTime; uniform vec2 uWind; varying vec2 vUv; varying vec3 vK; varying vec3 vWV; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ const float SPAN = 520.;
        float cx = mod(aSq.x * SPAN + uTime * uWind.x * 5.5 * aSq.z + SPAN * .5, SPAN) - SPAN * .5;
        vec3 p = position; p.x += cx;
        vUv = uv; vK = vec3(aSq.w * 17.3, (1. - smoothstep(SPAN * .5 - aSq.y * .5 - 30., SPAN * .5 - aSq.y * .5, abs(cx))) * aAmt, sign(uWind.x));
        vec4 wp = modelMatrix * vec4(p, 1.); vWV = wp.xyz - cameraPosition;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform float uTime; uniform vec2 uWind; uniform vec3 uCol; varying vec2 vUv; varying vec3 vK; varying vec3 vWV; ${fx.GLSL_FOG_PARS_FRAG}
      float sqH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float sqN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(sqH(i), sqH(i + vec2(1., 0.)), f.x), mix(sqH(i + vec2(0., 1.)), sqH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float edge = smoothstep(0., .34, vUv.x) * (1. - smoothstep(.66, 1., vUv.x)) * smoothstep(0., .25, vUv.y) * (1. - smoothstep(.45, 1., vUv.y));
        vec2 q = vec2(vUv.x * 4. - vUv.y * 1.3 * vK.z, vUv.y) + vec2(vK.x, 0.);
        float billow = sqN(q * vec2(1.3, 1.7) + vec2(uTime * .02, uTime * .05)) * .6 + sqN(q * vec2(3.1, 3.3) - vec2(0., uTime * .09)) * .4;
        float streak = sqN(vec2(q.x * 7. + sqN(q * 2.3) * 1.6, q.y * 2.6 + uTime * .5)) * .6 + sqN(vec2(q.x * 15., q.y * 4.6 + uTime * .9)) * .4;      // gusts: soft curtains that lean with the wind
        float d = length(vWV);
        float a = edge * edge * smoothstep(.3, .8, billow) * (.82 + .18 * streak) * uWind.y * vK.y * smoothstep(14., 70., d);
        gl_FragColor = vec4(fxFogPremult(uCol * (.92 + .16 * streak) * a, a), a); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'snow-squalls';
  return mesh;
}

// ---------------------------------------------------------------- the ember slot: the day's last fire in a gap between the far peaks and the snow deck,
// with long bars of stratus drifting across it. An additive arc at infinity round the up-valley axis; it follows the lens (set from camera.matrixWorld).
function makeEmberBand(time, lo, hi, k, az0) {
  const NA = 40, NE = 11, R = 2500, SPAN = 2.2, E0 = -0.06, E1 = 0.9, P = [], B = [], I = [];
  for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) {
    const u = i / NA * 2 - 1, e = lerp(E0, E1, j / NE), a = az0 + u * SPAN;
    P.push(R * Math.sin(a) * Math.cos(e), R * Math.sin(e), -R * Math.cos(a) * Math.cos(e)); B.push(u, e / 0.5236);
  }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 2)); g.setIndex(I);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uLo: { value: lo }, uHi: { value: hi }, uK: { value: k } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `attribute vec2 aB; varying vec2 vB; void main(){ vB = aB; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime, uK; uniform vec3 uLo, uHi; varying vec2 vB;      // vB: azimuth -1..1 across the arc, elevation in units of 30 degrees
      float ebH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float ebN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(ebH(i), ebH(i + vec2(1., 0.)), f.x), mix(ebH(i + vec2(0., 1.)), ebH(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float xs = vB.x * 1.517, e = vB.y;                                              // xs: azimuth in the slot's own units (it keeps its width; the arc is wider for the glow above it)
        float wAz = 1. - smoothstep(.2, 1., abs(xs)); wAz = wAz * wAz * (3. - 2. * wAz);
        float wU = 1. - smoothstep(.2, 1., abs(vB.x)); wU = wU * wU * (3. - 2. * wU);
        float n = ebN(vec2(xs * 9. + uTime * .006, e * 24.)) * .58 + ebN(vec2(xs * 23. - uTime * .011, e * 60. + 3.)) * .42;      // long bars, ten times wider than tall
        float n2 = ebN(vec2(xs * 3.5 - uTime * .003, 9.));
        float nb = ebN(vec2(xs * 4.5 + uTime * .004, e * 3.2 - uTime * .003)) * .6 + ebN(vec2(xs * 11. - uTime * .006, e * 8. + 5.)) * .4;      // slow billows in the deck's underside
        float top = .3 + .2 * wAz + .1 * (n2 - .5);                                        // the underside of the deck: 9 to 15 degrees up, highest behind the castle
        float slot = 1. - smoothstep(top - .1, top + .03, e + (n - .5) * .16);
        float under = exp(-max(e - top, 0.) * 4.) * .16 * (.6 + .8 * n2) * (.35 + 1.3 * nb);      // the deck's underside carries the fire far up the sky, in billows
        float bars = smoothstep(.5, .68, n) * smoothstep(.04, .2, e) * .82;                // slate bars of cloud across the fire
        float lip = smoothstep(.36, .5, n) * (1. - smoothstep(.5, .62, n));                 // their undersides catch it
        vec3 c = mix(uLo, uHi, smoothstep(top - .2, top + .04, e));                        // orange on the horizon, ember red under the deck
        float a = (slot * (1. - bars) * (1. + .6 * lip) * wAz + under * wU) * smoothstep(-.11, -.02, e);
        gl_FragColor = vec4(c * a * uK, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -5; mesh.name = 'ember-slot';
  return mesh;
}

// ---------------------------------------------------------------- string lights that sway: every span hangs in a catenary between its two ends and swings about
// the line through them, leaning a little down the wind and rocking in the gusts (each span to its own rhythm); bulbs are instanced glows, wires thin ribbons.
// One mesh of bulbs and one of wire for every garland in the world.
const GARLAND_GLSL = `
  uniform float uTime, uFade; uniform vec3 uWd; uniform vec2 uGust;
  vec3 garlandAt(vec3 A, vec3 B, float t, vec4 k){      // k: sag (m), swing (rad), phase, drop below the wire (m)
    vec3 d = B - A; float L = max(length(d), 1e-3); d /= L;
    vec3 dn = vec3(0., -1., 0.) + d * d.y; dn = dn / max(length(dn), 1e-3);
    vec3 sd = cross(d, dn);
    float th = k.y * (uGust.x * dot(sd, uWd) + uGust.y * (.62 * sin(uTime * (.9 + .5 * fract(k.z * 3.7)) + k.z * 6.283) + .38 * sin(uTime * 2.3 + k.z * 17.)));
    return mix(A, B, t) + (dn * cos(th) + sd * sin(th)) * (k.x * 4. * t * (1. - t) + k.w); }`;
function makeGarlands(spans, o) {
  const rng = o.rng, cols = o.colors; let nb = 0, nw = 0;
  for (const s of spans) {
    s.L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]);
    s.n = Math.max(1, Math.round(s.L / (s.spacing || 1.1))); s.seg = s.wire === false ? 0 : clamp(Math.round(s.L / 1.5), 2, 10);
    nb += s.n; nw += s.seg ? s.seg + 1 : 0;
  }
  const iA = new Float32Array(nb * 3), iB = new Float32Array(nb * 3), iK = new Float32Array(nb * 4), iT = new Float32Array(nb * 4), iC = new Float32Array(nb * 3), iN = new Float32Array(nb);
  const wA = new Float32Array(nw * 6), wB = new Float32Array(nw * 6), wK = new Float32Array(nw * 6), wT = new Float32Array(nw * 4), WI = [];
  let ib = 0, iw = 0;
  for (const s of spans) {
    const r = s.rng || rng, sag = (s.sag ?? 0.1) * s.L, sw = s.swing ?? 0.2, ph = r(), c0 = Math.floor(r() * cols.length);      // (a string hung at a place that always had a stream of its own draws from that stream)
    for (let i = 0; i < s.n; i++, ib++) {
      const c = cols[s.shuffle === false ? (c0 + i) % cols.length : Math.floor(r() * cols.length)], k = 1.3 * (s.gain ?? 1);
      iA.set(s.a, ib * 3); iB.set(s.b, ib * 3); iK.set([sag, sw, ph, 0.07], ib * 4);
      iT.set([(i + 0.5) / s.n, (s.size ?? 0.5) * (0.85 + 0.3 * r()), r(), (s.twinkle ?? 0.8) * (0.05 + 0.95 * r())], ib * 4);
      iC.set([c[0] * k, c[1] * k, c[2] * k], ib * 3);
      iN[ib] = s.near ?? 1;
    }
    if (!s.seg) continue;
    for (let i = 0; i <= s.seg; i++, iw++) {
      for (let e = 0; e < 2; e++) { const q = iw * 2 + e; wA.set(s.a, q * 3); wB.set(s.b, q * 3); wK.set([sag, sw, ph], q * 3); wT[q * 2] = i / s.seg; wT[q * 2 + 1] = e ? 1 : -1; }
      if (i) { const a = iw * 2 - 2; WI.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  const wl = Math.hypot(o.wind[0], o.wind[1]) || 1;
  const U = { ...fx.fogUniforms(), uTime: o.time, uWd: { value: new THREE.Vector3(o.wind[0] / wl, 0, o.wind[1] / wl) }, uGust: { value: new THREE.Vector2(o.lean ?? 0.3, o.gust ?? 0.7) }, uPx: { value: 0.0012 }, uFade: { value: 1 } };      // uFade: 0 = dark .. 1 = lit
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 3)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 3)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 4));
  g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iC, 3)); g.setAttribute('iN', new THREE.InstancedBufferAttribute(iN, 1)); g.instanceCount = nb;
  const bm = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 iA, iB, iCol; attribute vec4 iK, iT; attribute float iN; uniform float uPx; varying vec2 vQ; varying vec3 vCol; varying float vHalo; ${fx.GLSL_FOG_PARS_VERT} ${GARLAND_GLSL}
      void main(){ vec3 p = garlandAt(iA, iB, iT.x, iK);
        vec4 mvPosition = viewMatrix * vec4(p, 1.); float dist = max(-mvPosition.z, .1), s = max(iT.y, dist * uPx * 2.2);
        float tw = 1. - iT.w * (.5 + .5 * sin(uTime * (1.2 + 2.3 * fract(iT.z * 7.3)) + iT.z * 40.));
        // a span may cap its bulbs close to the eye (iN < 1): a beacon from afar, but passed at arm's length each bulb is a small coloured lamp and its
        // wide halo all but gone, so what it hangs on keeps its own colour. By distance from the eye, the same all through the flight
        float nearK = mix(iN, 1., smoothstep(42., 135., dist)); vHalo = nearK * nearK;
        vCol = iCol * tw * min(1., iT.y / s) * nearK * uFade; vQ = position.xy;
        mvPosition.xy += position.xy * s; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `varying vec2 vQ; varying vec3 vCol; varying float vHalo; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
        float a = (exp(-r2 * 5.) * .42 * vHalo + exp(-r2 * 60.) * 2.6) * (1. - r2);
        gl_FragColor = vec4(vCol * a * (1. - fxFog()), 1.); }`,
  });
  const bulbs = new THREE.Mesh(g, bm); bulbs.frustumCulled = false; bulbs.renderOrder = 3; bulbs.name = 'garland-bulbs';
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.BufferAttribute(wA, 3)); wg.setAttribute('aB', new THREE.BufferAttribute(wB, 3));
  wg.setAttribute('aK', new THREE.BufferAttribute(wK, 3)); wg.setAttribute('aT', new THREE.BufferAttribute(wT, 2)); wg.setIndex(WI);
  const wm = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 aB, aK; attribute vec2 aT; uniform float uPx; varying float vA; ${fx.GLSL_FOG_PARS_VERT} ${GARLAND_GLSL}
      void main(){ vec4 k = vec4(aK, 0.); vec3 p = garlandAt(position, aB, aT.x, k), q = garlandAt(position, aB, aT.x + .03, k);
        vec4 mvPosition = viewMatrix * vec4(p, 1.); vec3 tv = (viewMatrix * vec4(q - p, 0.)).xyz;
        vec2 nn = vec2(-tv.y, tv.x); float l = length(nn); nn = l > 1e-6 ? nn / l : vec2(0., 1.);
        float dist = max(-mvPosition.z, .1), w = max(.012, dist * uPx);
        vA = clamp(.012 / w, 0., 1.) * uFade * uFade; mvPosition.xy += nn * aT.y * w; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `varying float vA; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ gl_FragColor = vec4(fxApplyFog(vec3(.012, .012, .02)), .85 * sqrt(max(vA, 0.))); }`,
  });
  const wires = new THREE.Mesh(wg, wm); wires.frustumCulled = false; wires.renderOrder = 2; wires.name = 'garland-wires';
  const group = new THREE.Group(); group.add(wires, bulbs); group.name = 'garlands';
  return { object: group, uniforms: U, bulbs: nb };
}

// ---------------------------------------------------------------- snow falling through the light of every lamp: a few flakes drift down round each lamp head,
// carried by the wind, each one lit by how near the lamp it is. One instanced, additive mesh for all the lamps of the valley.
function makeLampSnow(list, o) {
  const rng = o.rng, K = o.per ?? 12, n = list.length * K, iL = new Float32Array(n * 4), iD = new Float32Array(n * 4);
  list.forEach((p, i) => {
    for (let k = 0; k < K; k++) {
      const q = (i * K + k) * 4, a = rng() * TAU, r = Math.pow(rng(), 0.75);
      iL.set([p[0], p[1], p[2], p[3] ?? 1], q); iD.set([Math.cos(a) * r, rng(), Math.sin(a) * r, rng()], q);
    }
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: o.time, uVel: { value: new THREE.Vector3(o.velocity[0], Math.max(0.3, -o.velocity[1]), o.velocity[2]) }, uCol: { value: o.color }, uPx: o.px, uFade: { value: 1 } },
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec4 iL, iD; uniform float uTime, uPx, uFade; uniform vec3 uVel; varying vec2 vQ; varying float vK; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float R = 3.1 * iL.w, H = 5.2 * iL.w;
        float yy = fract(iD.y + uTime * uVel.y / H * (.8 + .4 * iD.w));
        vec2 xz = fract(iD.xz * .5 + .5 + uTime * uVel.xz / (2. * R)) * 2. - 1.;
        xz += .1 * vec2(sin(uTime * 1.3 + iD.w * 40.), cos(uTime * 1.1 + iD.y * 31.));
        vec3 off = vec3(xz.x * R, (.3 - yy) * H, xz.y * R);
        float d2 = dot(off, off), rr = dot(xz, xz);
        float lit = (1. - smoothstep(.45, 1., rr)) * smoothstep(0., .08, yy) * (1. - smoothstep(.85, 1., yy)) / (1. + d2 * .42 / (iL.w * iL.w));
        vec4 mvPosition = viewMatrix * vec4(iL.xyz + off, 1.); float dist = max(-mvPosition.z, .1), sz = .05 + .05 * iD.w, s = max(sz, dist * uPx * 1.1);
        vK = lit * min(1., sz / s) * (.7 + .6 * iD.w) * uFade; vQ = position.xy;
        mvPosition.xy += position.xy * s; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uCol; varying vec2 vQ; varying float vK; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
        gl_FragColor = vec4(uCol * (vK * (1. - r2) * (1. - fxFog())), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'lamp-snow';
  return mesh;
}

// ---------------------------------------------------------------- horse sleighs with their lanterns, and the dog: instanced, each going round its own long oval
// at a steady pace on its own ground (y = g[0] + g[1] * dz + g[2] * dz * dz, dz = z - g[3]); list entries: { kind: 0 sleigh | 1 dog, c: [cx, cz, rx, rz],
// p: [phase, angular speed, size, gait rate], g, k: blanket colour, k2: the riders' coats, m: [stride, bounce] }
function makeTrotters(list, time, amb, warm) {
  const P = [], Nn = [], C = [], A = [], I = []; let nv = 0;
  const vtx = (x, y, z, nx, ny, nz, col, part, kind, hy, hz) => { P.push(x, y, z); Nn.push(nx, ny, nz); C.push(col[0], col[1], col[2]); A.push(part, kind, hy, hz); return nv++; };
  const tube = (pts, col, part, kind, hy = 0, hz = 0) => {      // six-sided tube through [x, y, z, r] points, capped
    const b0 = nv, SEG = 6;
    pts.forEach((p, j) => {
      const a = pts[Math.max(j - 1, 0)], c = pts[Math.min(j + 1, pts.length - 1)];
      let dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2]; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const ref = Math.abs(dy) > 0.9 ? [0, 0, 1] : [0, 1, 0];
      let ux = ref[1] * dz - ref[2] * dy, uy = ref[2] * dx - ref[0] * dz, uz = ref[0] * dy - ref[1] * dx; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
      const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
      for (let k = 0; k < SEG; k++) { const t = (k + 0.5) / SEG * TAU, cs = Math.cos(t), sn = Math.sin(t), nx = ux * cs + vx * sn, ny = uy * cs + vy * sn, nz = uz * cs + vz * sn; vtx(p[0] + nx * p[3], p[1] + ny * p[3], p[2] + nz * p[3], nx, ny + 0.15, nz, col, part, kind, hy, hz); }
      if (j) for (let k = 0; k < SEG; k++) { const q = b0 + (j - 1) * SEG + k, r = b0 + (j - 1) * SEG + (k + 1) % SEG; I.push(q, q + SEG, r, r, q + SEG, r + SEG); }
    });
    const t0 = b0 + (pts.length - 1) * SEG; for (let k = 1; k < SEG - 1; k++) I.push(b0, b0 + k, b0 + k + 1, t0, t0 + k + 1, t0 + k);
  };
  const box = (x0, y0, z0, x1, y1, z1, col, part, kind) => {
    for (const [n, q] of [[[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]], [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]], [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]], [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]], [[0, 0, -1], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]]]) {
      const b0 = nv; for (const p of q) vtx(p[0], p[1], p[2], n[0], n[1], n[2], col, part, kind, 0, 0); I.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
    }
  };
  const bay = [0.2, 0.105, 0.055], dk = [0.035, 0.03, 0.035], red = [0.42, 0.06, 0.045], wood = [0.2, 0.12, 0.07], skin = [0.92, 0.64, 0.5], W = [1, 1, 1], HZ0 = 2.6;
  // the horse (its middle 2.6 m ahead of the rig's own): barrel, neck and head, four legs, tail, a blanket in the instance's colour
  tube([[0, 1.32, HZ0 - 0.95, 0.24], [0, 1.36, HZ0 - 0.5, 0.36], [0, 1.33, HZ0 + 0.3, 0.37], [0, 1.4, HZ0 + 0.8, 0.3]], bay, 0, 0);
  tube([[0, 1.37, HZ0 - 0.38, 0.385], [0, 1.35, HZ0 + 0.2, 0.395]], W, 9, 0);
  tube([[0, 1.42, HZ0 + 0.7, 0.26], [0, 1.9, HZ0 + 1.12, 0.17], [0, 2.08, HZ0 + 1.26, 0.15], [0, 1.86, HZ0 + 1.66, 0.085]], bay, 5, 0, 1.42, HZ0 + 0.7);
  tube([[0, 1.62, HZ0 + 0.74, 0.07], [0, 2.14, HZ0 + 1.1, 0.06]], dk, 5, 0, 1.42, HZ0 + 0.7);      // mane
  [[1, -0.19, 0.62], [2, 0.19, 0.62], [3, -0.19, -0.66], [4, 0.19, -0.66]].forEach(([part, x, z]) => tube([[x, 1.2, HZ0 + z, 0.125], [x, 0.62, HZ0 + z + 0.03, 0.07], [x, 0.03, HZ0 + z, 0.06]], part > 2 ? bay : dk, part, 0, 1.2, HZ0 + z));
  tube([[0, 1.36, HZ0 - 0.95, 0.075], [0, 1.0, HZ0 - 1.16, 0.06], [0, 0.6, HZ0 - 1.2, 0.03]], dk, 6, 0);
  for (const sx of [-1, 1]) {      // shafts, runners curled up at the front, a lantern on a post at each front corner
    tube([[sx * 0.44, 1.15, HZ0 + 0.35, 0.035], [sx * 0.5, 0.86, 0.15, 0.035]], dk, 7, 0);
    tube([[sx * 0.72, 0.06, -2.9, 0.045], [sx * 0.72, 0.06, 0.1, 0.045], [sx * 0.72, 0.36, 0.52, 0.04], [sx * 0.72, 0.8, 0.56, 0.035]], dk, 7, 0);
    for (const z of [-2.3, -0.5]) tube([[sx * 0.72, 0.08, z, 0.03], [sx * 0.66, 0.46, z, 0.03]], dk, 7, 0);
    tube([[sx * 0.8, 0.9, -0.12, 0.03], [sx * 0.8, 1.52, -0.12, 0.03]], dk, 7, 0);
    box(sx * 0.8 - 0.11, 1.5, -0.23, sx * 0.8 + 0.11, 1.8, -0.01, W, 8, 0);
    box(sx * 0.8 - 0.14, 1.8, -0.26, sx * 0.8 + 0.14, 1.85, 0.02, dk, 7, 0);
    box(sx * 0.7 - 0.05, 0.44, -2.75, sx * 0.7 + 0.05, 1.02, 0.02, red, 7, 0);       // the body's sides
  }
  box(-0.7, 0.44, -2.75, 0.7, 0.52, 0.02, wood, 7, 0); box(-0.7, 0.44, -2.8, 0.7, 1.62, -2.7, red, 7, 0); box(-0.7, 0.44, 0, 0.7, 1.22, 0.08, red, 7, 0);      // floor, high back, dash
  box(-0.62, 0.52, -2.3, 0.62, 0.92, -1.85, wood, 7, 0); box(-0.62, 0.52, -1.1, 0.62, 0.98, -0.72, wood, 7, 0);      // two benches
  box(-0.66, 1.62, -2.82, 0.66, 1.7, -2.68, W, 7, 0);      // snow on the back rail
  for (const [x, z] of [[-0.3, -0.92], [0.28, -2.08], [-0.3, -2.08]]) {      // the driver and two passengers, wrapped up
    tube([[x, 0.6, z + 0.18, 0.2], [x, 0.98, z + 0.02, 0.27], [x, 1.5, z, 0.2], [x, 1.62, z, 0.09]], W, 10, 0);
    tube([[x, 1.6, z, 0.08], [x, 1.72, z + 0.01, 0.135], [x, 1.86, z, 0.11]], skin, 7, 0);
    tube([[x, 1.82, z, 0.14], [x, 1.98, z, 0.06]], W, 9, 0);
  }
  // the dog: a big shaggy sheepdog, galloping
  tube([[0, 0.5, -0.42, 0.11], [0, 0.52, -0.2, 0.16], [0, 0.55, 0.22, 0.17], [0, 0.6, 0.42, 0.13]], W, 9, 1);
  tube([[0, 0.62, 0.36, 0.12], [0, 0.76, 0.56, 0.115], [0, 0.7, 0.8, 0.055]], W, 5, 1, 0.62, 0.36);
  [[1, -0.1, 0.27], [2, 0.1, 0.27], [3, -0.1, -0.3], [4, 0.1, -0.3]].forEach(([part, x, z]) => tube([[x, 0.46, z, 0.07], [x, 0.03, z + 0.02, 0.04]], part > 2 ? W : [1.6, 1.6, 1.7], part, 1, 0.46, z));
  tube([[0, 0.54, -0.42, 0.05], [0, 0.72, -0.66, 0.045], [0, 0.86, -0.74, 0.02]], [1.6, 1.6, 1.7], 6, 1);
  const vP = new THREE.BufferAttribute(new Float32Array(P), 3), vN = new THREE.BufferAttribute(new Float32Array(Nn), 3), vC = new THREE.BufferAttribute(new Float32Array(C), 3), vA = new THREE.BufferAttribute(new Float32Array(A), 4);
  const geo = (kind) => {      // the triangles of one kind, instanced for the entries of that kind
    const ls = list.filter((q) => q.kind === kind), n = ls.length, iC = new Float32Array(n * 4), iP = new Float32Array(n * 4), iG = new Float32Array(n * 4), iK = new Float32Array(n * 3), iK2 = new Float32Array(n * 3), iM = new Float32Array(n * 3);
    ls.forEach((q, i) => { iC.set(q.c, i * 4); iP.set(q.p, i * 4); iG.set(q.g, i * 4); iK.set(q.k, i * 3); iK2.set(q.k2 || q.k, i * 3); iM.set([q.kind, q.m[0], q.m[1]], i * 3); });
    const g = new THREE.InstancedBufferGeometry(), ix = [];
    for (let i = 0; i < I.length; i += 3) if (A[I[i] * 4 + 1] === kind) ix.push(I[i], I[i + 1], I[i + 2]);
    g.setAttribute('position', vP); g.setAttribute('normal', vN); g.setAttribute('color', vC); g.setAttribute('aPart', vA); g.setIndex(ix);
    for (const [name, arr, sz] of [['iC', iC, 4], ['iP', iP, 4], ['iG', iG, 4], ['iK', iK, 3], ['iK2', iK2, 3], ['iM', iM, 3]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, sz));
    g.instanceCount = n;
    return g;
  };
  const m = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uTime: time, uAmb: { value: amb }, uWarm: { value: warm }, uFade: { value: 1 } }, fog: true, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 color, iK, iK2, iM; attribute vec4 iC, iP, iG, aPart; uniform float uTime, uFade; varying vec3 vCol, vN; ${fx.GLSL_FOG_PARS_VERT}
      void main(){ float a = iP.x + uTime * iP.y, part = aPart.x, sz = iP.z;
        vec2 pos = iC.xy + vec2(iC.z * cos(a), iC.w * sin(a)), tn = vec2(-iC.z * sin(a), iC.w * cos(a));
        float tl = length(tn); tn = (tl > 1e-4 ? tn / tl : vec2(0., 1.)) * (iP.y < 0. ? -1. : 1.);
        vec3 fw = vec3(tn.x, 0., tn.y), rt = vec3(tn.y, 0., -tn.x), l = position;
        float gp = uTime * iP.w + iP.x * 7., dog = step(.5, iM.x);
        if (part > .5 && part < 4.5) {      // a leg swings about its hip: a trot (diagonal pairs together), or the dog's gallop (fore and hind pairs)
          float lead = dog > .5 ? step(2.5, part) * 2.4 : (abs(part - 2.5) > 1. ? 0. : 3.1416);
          float th = iM.y * sin(gp + lead), dy = l.y - aPart.z, dz = l.z - aPart.w, cs = cos(th), sn = sin(th);
          l.y = aPart.z + dy * cs - dz * sn; l.z = aPart.w + dy * sn + dz * cs;
          l.y += max(0., -sin(gp + lead + 1.2)) * iM.y * .28 * clamp(-dy * 1.4, 0., 1.);
        }
        if (part > 4.5 && part < 5.5) l.y += (l.z - aPart.w) * (.1 * sin(gp * (dog > .5 ? 1. : 2.) + .6) * min(iM.y * 3., 1.) + .05 * sin(uTime * .8 + iP.x * 3.));
        if (part > 5.5 && part < 6.5) l.x += .25 * sin(uTime * (dog > .5 ? 9. : 1.7) + iP.x * 5.) * clamp(1.4 - l.y, 0., 1.) * (dog > .5 ? .3 : 1.);
        if (part < 6.5 || part > 8.5) l.y += iM.z * abs(sin(gp + .5)) * (part > 9.5 ? .3 : 1.);
        if (abs(aPart.y - iM.x) > .5) l = vec3(0.);
        l *= sz * uFade;
        vec2 wxz = pos + rt.xz * l.x + fw.xz * l.z; float gd = wxz.y - iG.w;
        vec3 w = vec3(wxz.x, iG.x + iG.y * gd + iG.z * gd * gd + l.y, wxz.y);
        vN = rt * normal.x + vec3(0., normal.y, 0.) + fw * normal.z;
        vCol = part > 7.5 && part < 8.5 ? vec3(15., 8.5, 3.) : part > 9.5 ? iK2 * color : part > 8.5 ? iK * color : color;
        vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: `uniform vec3 uAmb, uWarm; varying vec3 vCol, vN; ${fx.GLSL_FOG_PARS_FRAG}
      void main(){ vec3 n = vN; float nl = length(n); n = nl > 1e-4 ? n / nl : vec3(0., 1., 0.); if (!gl_FrontFacing) n = -n;
        vec3 c = vCol * (uAmb * (.6 + .4 * n.y) + uWarm * (.5 + .6 * max(n.y, 0.)));
        if (vCol.r > 4.) c = vCol;
        gl_FragColor = vec4(fxApplyFog(c), 1.); }`,
  });
  const group = new THREE.Group(); group.name = 'sleighs'; group.userData.fade = m.uniforms.uFade;
  for (const kind of [0, 1]) if (list.some((q) => q.kind === kind)) { const mesh = new THREE.Mesh(geo(kind), m); mesh.frustumCulled = false; group.add(mesh); }
  return group;
}

// a Builder's geometry made one attribute at a time, the page handed back in between: the same result as Builder.toGeometry(), which does it in one step
async function builderGeometry(b, yld) {
  if (!(b.P && b.N && b.C && b.U && b.W && b.I)) return b.toGeometry();      // the kit's Builder changed inside: let it make its own geometry
  const g = new THREE.BufferGeometry(), nv = b.nv, N = b.N;
  for (let i = 0; i < nv * 3; i += 3) if (!(N[i] * N[i] + N[i + 1] * N[i + 1] + N[i + 2] * N[i + 2] > 1e-10)) { N[i] = 0; N[i + 1] = 1; N[i + 2] = 0; }
  g.setAttribute('position', new THREE.BufferAttribute(b.P.slice(0, nv * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, nv * 3), 3)); await yld();
  g.setAttribute('color', new THREE.BufferAttribute(b.C.slice(0, nv * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(b.U.slice(0, nv * 2), 2)); await yld();
  g.setAttribute('win', new THREE.BufferAttribute(b.W.slice(0, nv * 3), 3));
  g.setIndex(new THREE.BufferAttribute(nv > 65535 ? b.I.slice(0, b.ni) : new Uint16Array(b.I.subarray(0, b.ni)), 1)); await yld();
  if (nv) { g.computeBoundingBox(); g.computeBoundingSphere(); }
  await yld();
  return S.groupFamilies(g);
}

export default {
  id: 'snowbound-viaduct',
  name: 'The Midwinter Express',
  category: 'city',
  weirdness: 0.05,
  async build(ctx) {
    await ctx.yield();                                    // the modules were evaluated in this same task: hand the page back before any work
    const { rng, noise } = ctx;
    const scene = new THREE.Scene();
    const time = { value: 0 };
    const updaters = [];

    // ------------------------------------------------------------ per-seed character (these draws keep the owner's order)
    const dusk = rng();                                   // variation inside a look: 0 = earlier, warmer ... 1 = later, deeper
    let snowfall = rng.range(0.7, 1.5);                   // light flurry ... heavy fall
    let fogD = lerp(0.00118, 0.0017, clamp(0.5 * (snowfall - 0.7) / 0.8 + 0.5 * rng(), 0, 1));
    const sqZ = rng.range(304, 330), firX = rng.range(31, 36), firH = rng.range(28, 34);
    const pondR = rng.range(15, 21), pondZ = rng.range(168, 186), TH = rng.range(7.6, 9.2);
    const windA = rng.range(-0.5, 0.5) + (rng.chance(0.5) ? Math.PI : 0), wind = [Math.cos(windA), Math.sin(windA) * 0.6];
    const festive = rng.chance(0.5);                      // multicolour or warm white string lights
    const bannerC = rng.pick([['#8f2a26', '#ffc46b'], ['#243f8c', '#f0d9a0'], ['#8f2a26', '#eef3fa'], ['#5c2a6e', '#ffc46b']]);
    const amber = new THREE.Color(PALETTE[6]);
    const snowC = lin('#dfe6f4');

    // ------------------------------------------------------------ the look: three evenings, chosen by seed (its own stream, so the layout above is untouched)
    //   ember    the last ember of the day burning in a slot under a heavy slate snow sky: coral key light skimming every crest
    //   blizzard blue hour in a driving snowstorm: no horizon, snow flying flat, every lamp a fat halo, the train the brightest thing
    //   frost    a clear, still, bitter evening: turquoise to rose afterglow, first stars, smoke standing straight up, sharp far peaks
    const vary = ctx.vary || {}, QD = clamp(ctx.quality?.detail ?? 1, 0.5, 1), DEN = clamp(vary.density ?? 1, 0.7, 1.3), mood = clamp(vary.mood ?? 0.5, 0, 1);
    const lookR = makeRng(hashSeed(ctx.seed + ':dusk')), lookV = lookR(), lookH = { golden: 'ember', dawn: 'ember', night: 'blizzard', day: 'frost' }[vary.hour];
    let look = lookV < 0.38 ? 'ember' : lookV < 0.68 ? 'blizzard' : 'frost';
    if (lookH && lookR() < 0.75) look = lookH;
    const rare = !!vary.rare;                             // the rare event: a rotary snowplough leads the Express, throwing its arc of snow off the viaduct
    const LK = {
      ember: {
        zenith: '#131d44', mid: mixHex('#19264e', '#162248', dusk), horizon: mixHex('#22325e', '#1e2c56', dusk), ground: '#0c1630', horizonPow: 4.5, midPow: 1.5,
        scatterColor: mixHex('#ff8e5e', '#ff7452', mood), scatter: 0.07, scatterPow: 9, scatterHigh: 0, scatterFall: 7, sunGlow: 0, sunAz: 2, stars: 0,
        cover: [1.3, 1.4], soft: 0.48, cloudLit: '#364c7c', cloudShade: '#192548', silver: 0, absorb: 0.12, haze: 0.03,
        hemiSky: '#6f98d8', hemiGround: '#263a6c', hemiK: lerp(1.6, 1.4, dusk), keyColor: mixHex('#ffa462', '#ff9456', mood), keyK: lerp(3.9, 3.4, dusk), keyDir: [0.3, 0.25, -0.92],
        fog: '#2f4680', farTint: '#3a3a66', ridgeRim: 0.16, windMul: 1, exposure: 1.04, bloom: 0.62, halo: 1.5, glowK: 1.45, flood: 0.95, lit: 0.12, night: 1,
        band: [mixHex('#ff9440', '#ff7a36', mood), '#d23c2a', lerp(1.32, 1.18, dusk)],      // the slot of fire under the cloud deck: low colour, high colour, strength
        tint: '#fff4ec', shadowTint: '#03101c', contrast: 1.1, saturation: 1.02, vignette: 0.42,
      },
      blizzard: {
        // torn cloud lit violet and rose from below by the last light up the valley, a pale mauve band low down behind the viaduct and the castle,
        // and a fog that pales with distance, so the mountain walls stand as layered silhouettes through the driving snow
        zenith: '#1a2152', mid: mixHex('#4a4490', '#3e3a80', dusk), horizon: mixHex('#c9a6cf', '#b392c4', dusk), ground: '#272b5e', horizonPow: 3, midPow: 1.3,
        scatterColor: mixHex('#ffb6c4', '#ee9abc', mood), scatter: 0.8, scatterPow: 3.5, scatterHigh: 0.08, scatterFall: 3.2, sunGlow: 0.2, sunAz: 0, stars: 0,
        cover: [0.7, 0.9], soft: 0.5, cloudLit: '#cbb0da', cloudShade: '#2c2e6a', silver: 0.4, absorb: 1.25, haze: 0.14,
        hemiSky: '#8ea2e8', hemiGround: '#343e7e', hemiK: lerp(1.75, 1.5, dusk), keyColor: '#e6aacb', keyK: 1.25, keyDir: [0.22, 0.34, -0.9],
        fog: mixHex('#8d84bc', '#766eaa', dusk), farTint: '#9c8cc0', ridgeRim: 0.35, windMul: 1, exposure: 1.06, bloom: 0.68, halo: 2.1, glowK: 2.6, flood: 2.15, lit: 0.16, night: 1,
        tint: '#f6f0ff', shadowTint: '#060a22', contrast: 1.08, saturation: 1.0, vignette: 0.44,
      },
      frost: {
        zenith: '#0e2248', mid: mixHex('#1f5f86', '#184c78', dusk), horizon: mixHex('#f2a892', '#e08a8c', dusk), ground: '#1c2c54', horizonPow: 4.2, midPow: 1.9,
        scatterColor: mixHex('#ffc09a', '#ffa888', mood), scatter: 0.85, scatterPow: 7, scatterHigh: 0.03, scatterFall: 4, sunGlow: 0.45, sunAz: 10, stars: 0.7,
        cover: [0.18, 0.3], cloudLit: '#f0a09a', cloudShade: '#3a4a84', silver: 1, absorb: 1.4, haze: 0.17,
        hemiSky: '#7fb2e2', hemiGround: '#2f4c7c', hemiK: lerp(1.75, 1.45, dusk), keyColor: mixHex('#ffa684', '#ff9478', mood), keyK: lerp(3.6, 3.0, dusk), keyDir: [0.4, 0.3, -0.87],
        fog: mixHex('#6a7fb4', '#55689e', dusk), farTint: '#a27c9c', windMul: 0.12, exposure: 1.04, bloom: 0.55, halo: 1.3, glowK: 1.3, flood: 0.95, lit: 0.08, night: 0.95,
        tint: '#fff6f0', shadowTint: '#04121e', contrast: 1.1, saturation: 1.04, vignette: 0.38,
      },
    }[look];
    if (look === 'blizzard') { snowfall = lerp(1.8, 2.2, mood); fogD = lerp(0.00112, 0.00132, dusk); }
    if (look === 'frost') { snowfall = lerp(0.62, 0.86, mood); fogD = lerp(0.00082, 0.001, dusk); }
    const storm = look === 'blizzard';
    const blow = look === 'blizzard' ? 1 : 0;           // how hard the wind drives the snow
    const fogColor = new THREE.Color(LK.fog);

    // ------------------------------------------------------------ the flight: over the roofs, down past the fir, low over the pond, then a wide climbing
    // sweep up the right-hand slope with the gaze on the Express crossing the viaduct, to meet the locomotive from the front and a little above (35 m off,
    // never in its steam), the castle and the hamlet's lights beyond it; a dive to the left under the central arch while the carriages stream past overhead,
    // out over the frozen bend, down the lamp-lit street of the mill hamlet at eave height, up the footpath across the snowfield (bonfire and skiers to the left,
    // the causeway's lamps to the right) and over the parapet onto the causeway for the last straight to the gate
    await ctx.yield();
    const ex = rng.range(28, 38), sway = rng.range(-3, 3);
    const path = makePath([
      [ex, 50, 455], [ex - 3, 47.5, 418], [ex - 11, 38.5, 378], [15 + sway * 0.4, 25, sqZ + 27], [6.5, 15.5, sqZ - 17], [0.5, 9, 250],
      [0, 6.6, 198], [0, 6.9, 172], [3, 9, 151], [12, 13, 131], [33, 20.5, 113], [56.5, 31, 94], [70.5, 45, 75.5], [67.5, 59, 59.5], [56, 70.5, 51], [42, 77, 44], [29, 76, 35.5], [17, 62.5, 23], [6.5, 48.5, 8.5], [-1, 41.5, -6], [-6, 39.3, -22],
      [-12, 37.6, -40], [-21, 35.5, -61], [-28.5, 34, -86], [-30.5, 35.2, -110], [-29, 38.5, -132], [-25.5, 43.8, -153], [-22, 50, -172], [-13, 56.5, -189], [-3.5, 61, -203], [0, 62.8, -216], [0, 63.6, -232], [0, 64, -250],      // up the lamp-lit footpath, then over the parapet onto the causeway
    ]);
    const uArch = path.nearestXZ(0, 0).u, uMeet = path.nearestXZ(29, 35.5).u;
    // pace: a brisk climb, linger for the meeting with the train and the dive, a little quicker over the bend, unhurried down the hamlet street and into the gate
    const pace = (u) => 1 + 0.3 * sm(uMeet - 0.24, uMeet - 0.18, u) * (1 - sm(uMeet - 0.09, uMeet - 0.03, u)) - 0.42 * sm(uMeet - 0.05, uMeet - 0.01, u) * (1 - sm(uMeet + 0.012, uMeet + 0.04, u)) + 0.12 * sm(uArch + 0.04, uArch + 0.08, u) * (1 - sm(uArch + 0.1, uArch + 0.16, u));
    // the train runs at a steady real speed whatever the pace: its place is keyed to u through the time the engine will take to reach u
    const DUR = 48, NT = 256, tauT = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tauT[i] = tauT[i - 1] + 1 / (NT * clamp(pace((i - 0.5) / NT), 0.35, 2.5));
    const tau = (u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return lerp(tauT[i], tauT[i + 1], f - i); };
    const trainV = 11.5, trainK = trainV * DUR / tauT[NT], tauMeet = tau(uMeet);
    const headXAt = (u) => (rare ? 4 : 12) + trainK * (tau(u) - tauMeet);         // at the top of the climb the locomotive is on the central arch, ahead of the lens and a little below it, the castle clear of its steam to the right
    // where the gaze rests while the train crosses: on the arcade ahead of and under the train while it is far (the train in the upper middle of the frame, the
    // arches, the cottages and the castle beyond below and beside it), and just over the locomotive at the meeting, so the valley beyond stands above the train
    const trainAt = new THREE.Vector3();
    // on the climb the gaze leads the train by a further 20 m and sits low, so the frame holds the arcade, the lit cottages and the castle, not the bare left-hand crag
    const trainPoi = (t, u) => trainAt.set(clamp(headXAt(u) - lerp(-30, 1, sm(uMeet - 0.11, uMeet, u)) + 20 * sm(uMeet - 0.156, uMeet - 0.106, u) * (1 - sm(uMeet - 0.076, uMeet - 0.016, u)), -168, 168), lerp(34, 82, sm(uMeet - 0.14, uMeet - 0.02, u)), 0);

    // ------------------------------------------------------------ the valley
    const riverX = (z) => (z > -8 ? 4.5 * Math.sin(z * 0.012 + 1.3) * sm(262, 345, z) : -95 * sm(-8, -75, z) + Math.min(0, z + 75) * 0.12);
    const riverHalf = (z) => (z < -8 ? 7 : 8.5 + pondR * sm(pondZ - 62, pondZ - 34, z) * (1 - sm(pondZ + 34, pondZ + 60, z)));
    const yC = (z) => (z > -205 ? 19.5 + (z + 44) / -161 * 35.5 : 55 + (z + 205) / -45);       // causeway deck height
    const terrace = (x) => { const s = (x - 34) / 26; if (s < 0) return 0; const k = Math.floor(s), f = s - k; return TH * (Math.min(k, 5) + (k < 5 ? sm(0.72, 1, f) : 1)); };
    const SEAT = [[27, 38], [38, 21], [-26, 31], [-36, 50], [88, 97], [95, 70]], seatY = [];      // the cottages on the slopes each stand on a levelled, snowed-over terrace
    const height = (x, z, seat) => {
      const rx = riverX(z), ax = Math.abs(x - rx), AX = Math.abs(x), hw = riverHalf(z), tw = sm(125, 168, z);
      const n1 = noise.fbm2(x * 0.011, z * 0.011, 3), n2 = noise.n2(x * 0.045 + 7, z * 0.045);
      const flat = (x < 0 ? 28 : 6) * tw, dS = x < rx ? rx - x : Math.max(0, x);       // the left wall rises from the river, the right one from the axis
      let h = 2.7 + 59 * Math.pow(sm(hw + 5 + flat, 165, dS), 1.1) + Math.max(0, dS - 165) * 1.05 + (n1 * 6 + n2 * 1.2) * sm(24 + flat, 95, dS);
      if (x > 0 && tw > 0) h = lerp(h, 2.7 + terrace(x) + Math.max(0, x - 190) * 0.9 + n2 * 0.25, tw);
      if (AX > 170) h += (26 + 150 * noise.ridged2(x * 0.0026 + 3, z * 0.0026, 4)) * sm(170, 430, AX);
      if (z < -330) h += (40 + 190 * noise.ridged2(x * 0.0024 - 5, z * 0.0024, 4)) * sm(-340, -640, z) * (0.2 + 0.8 * sm(36, 230, Math.abs(x - 14)));   // a pass behind the castle: the sky's last light shows through it
      const az = Math.abs(z);
      if (az < 36 && AX < 172) h = Math.min(h, 60.5 + 50 * sm(11, 36, az));              // keep the tunnel mouths open
      if (z < -8) {
        const gorge = sm(-34, -58, z) * (1 - sm(-150, -200, z));                        // the river bend cuts a gorge under the causeway side
        const backFloor = (19 * sm(-10, -46, z) + 21 * sm(-60, -240, z)) * sm(hw - 2, hw + lerp(46, 19, gorge), x - rx);
        h += backFloor;
        const dC = Math.hypot(x, z + 292), mound = sm(122, 54, dC);
        h = Math.max(h, lerp(backFloor + 2.7, 55, mound) + n1 * 22 * mound * (1 - mound));
        if (z > -264 && z < -38 && AX < 30) {
          const top = yC(z) - 1.1;
          h = Math.max(h, top - Math.max(0, AX - 6.6) * 1.7);
          if (AX < 7.6) h = Math.min(h, top);
        }
        if (dC < 60) h = Math.min(h, 55.2);
      }
      if (seat !== false && z > -10 && z < 122) for (let i = 0; i < seatY.length; i++) { const d = Math.hypot(x - SEAT[i][0], z - SEAT[i][1]); if (d < 21) h = lerp(h, seatY[i], 1 - sm(10, 21, d)); }
      const bank = sm(hw - 1.5, hw + 5 + 4 * sm(-4, -20, z) + 0.55 * Math.max(0, h - 2.7), ax);
      return lerp(lerp(-3.2, -1.1, sm(-4, -20, z)), h, bank);       // a shallow, snowed-in bed below the viaduct
    };
    { const hs = SEAT.map(([x, z]) => height(x, z, false) - 0.7); for (const h of hs) seatY.push(h); }

    // ------------------------------------------------------------ sky, fog, light
    await ctx.yield();
    const cover = rng.range(0.55, 0.95);
    const sky = makeSky({
      rng: rng.fork('sky'), preset: 'blueHour',
      zenith: LK.zenith, mid: LK.mid, horizon: LK.horizon, ground: LK.ground,
      horizonPow: LK.horizonPow, midPow: LK.midPow, scatterColor: LK.scatterColor, scatter: LK.scatter, scatterPow: LK.scatterPow, scatterHigh: LK.scatterHigh, scatterFall: LK.scatterFall,
      sunElevation: -4, sunAzimuth: LK.sunAz + rng.range(-10, 10) * 0.3, sunIntensity: 0, sunGlow: LK.sunGlow, stars: LK.stars, starDensity: 0.5, twinkle: look === 'frost' ? 0.85 : 0.5, milkyWay: 0, bodies: [],
      clouds: { coverage: lerp(LK.cover[0], LK.cover[1], (cover - 0.55) / 0.4), softness: LK.soft ?? 0.5, scale: rng.range(0.75, 1.1), lit: LK.cloudLit, shade: LK.cloudShade, silver: LK.silver, absorb: LK.absorb, haze: LK.haze, wind: [0.012 * wind[0] * (1 + 2 * blow), 0.012 * wind[1] * (1 + 2 * blow)] },
      fogColor, renderOrder: 1000,
    });
    sky.object.name = 'sky'; scene.add(sky.object); updaters.push(sky);
    const bandCol = LK.band ? new THREE.Color(LK.band[0]).multiplyScalar(LK.band[2]) : new THREE.Color(0, 0, 0);
    const emberBand = LK.band ? makeEmberBand(time, bandCol, new THREE.Color(LK.band[1]).multiplyScalar(LK.band[2] * 0.8), 1, 0.06) : null;
    if (emberBand) scene.add(emberBand);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(fogColor, fogD);
    const hemiSky = new THREE.Color(LK.hemiSky), hemiGround = new THREE.Color(LK.hemiGround);
    const hemi = new THREE.HemisphereLight(hemiSky, hemiGround, LK.hemiK);
    // the key: the last light of the day coming low down the valley from beyond the castle, so every crest, roof edge and crown has a warm rim
    const rimDir = new THREE.Vector3(...LK.keyDir).normalize(), rimColor = new THREE.Color(LK.keyColor);
    const rim = new THREE.DirectionalLight(rimColor, LK.keyK); rim.position.copy(rimDir).multiplyScalar(300);
    scene.add(hemi, rim);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({
      rng: rng.fork('ridges'), sunDir: rimDir, sunColor: rimColor, sunIntensity: storm ? 0.7 : 0.9, haze: LK.farTint, hazeNear: storm ? 0.3 : 0.42, hazeFar: 0.86, rim: LK.ridgeRim ?? 0.5, snow: '#b9c4e6', snowLine: 0.45,
      colorNear: look === 'frost' ? '#2a4270' : storm ? '#27306e' : '#1c2a5c', ambient: hemiSky.clone().multiplyScalar(0.3 * LK.hemiK), radius: [950, 2300], height: [190, 520], jagged: 0.75, layers: 4,
    });
    scene.add(ridges.object); updaters.push(ridges);
    await ctx.yield();

    // ------------------------------------------------------------ terrain and frozen river
    const nearP = T.pathNearest(path);
    const lod = (x, z) => {                               // terrain detail: fine by the path, kept moderate under the town, the castle and the viaduct
      let d = nearP(x, z).dist;
      if (z > 140 && z < 510 && x > -60 && x < 170) d = Math.min(d, 52);
      if (z < 30 && z > -170 && x > -150 && x < 60) d = Math.min(d, 34 + Math.max(0, Math.abs(z) - 20) * 0.2);
      if (Math.abs(z) < 24 && Math.abs(x) < 200) d = Math.min(d, 40);
      const dc = Math.hypot(x, z + 295); if (dc < 150) d = Math.min(d, 20 + dc * 0.45);
      if (z > 40 && z < 125 && x > 62 && x < 122) d = Math.min(d, 16);      // the two terraces up the right-hand slope
      return d;
    };
    const dummyTex = new THREE.DataTexture(new Uint8Array(4), 1, 1), snowHi = new THREE.Color('#e4eaf6'), snowLo = new THREE.Color('#bfcae4');
    const land = await T.makeTerrainAsync({
      rng: rng.fork('land'), noise, path, height, corridor: false, cell: 3.5, near: 22, bounds: [-336, -616, 336, 532], refine: 0, maxTriangles: 44000, focus: lod,
      materialInstance: makeSnowMaterial(time, new THREE.Color(look === 'frost' ? '#5a6486' : '#525a80'), new THREE.Vector4(pondR, pondZ, firX, sqZ)), detailTexture: dummyTex, ao: 0.5,
      color: (x, z, h, ny, out) => {
        const k = sm(-0.7, 0.7, noise.n2(x * 0.012 + 3, z * 0.012) + 0.4 * noise.n2(x * 0.06, z * 0.06 + 9));
        out.r = lerp(snowLo.r, snowHi.r, k); out.g = lerp(snowLo.g, snowHi.g, k); out.b = lerp(snowLo.b, snowHi.b, k);
        if (z < -4) { const lift = 1 + 0.28 * sm(-4, -20, z) * (1 - sm(9, 24, Math.abs(x - riverX(z)))); out.r *= lift; out.g *= lift; out.b *= lift; }   // keep the river trench from reading as a dark hole
        return out;
      },
    }, ctx.yield, 1);
    scene.add(land.object); dummyTex.dispose();
    const groundAt = (x, z) => Math.max(land.heightAt(x, z), 0.04);
    await ctx.yield();

    const ovals = Array.from({ length: 16 }, () => new THREE.Vector4()), iceTrain = new THREE.Vector3(-999, 200, 0);
    const skMir = Array.from({ length: 24 }, () => new THREE.Vector4()), skMirC = Array.from({ length: 24 }, () => new THREE.Vector3()); let skMirror = null;      // the skaters as the ice mirrors them: x, z, height; lit coat colour
    // the escorts' z for the lens at path z `zc`: they wait up-river, set off as the lens comes, keep ahead of it at 0.6 of its speed (36 m ahead where it levels out over the river,
    // 22 m by the time they have swung out to the sides of the pond), and are overtaken there, outside the frame
    const escTop = pondZ + 74, escZ = (zc) => { const x = escTop - (pondZ + 51 + (zc - pondZ - 87) * 0.6); return x > 0 ? escTop - x * x / (x + 2) : escTop; };
    const escU = { value: new THREE.Vector4(escZ(455), pondZ + 50, pondZ + 30, 0) }, escP = new THREE.Vector3();
    {
      const P = [], Dp = [], Sn = [], I = [], NX = 20, rows = [];
      for (let z = 520; z >= -430; z -= 4) rows.push(z);
      const cover = (z) => lerp(lerp(lerp(0.3, 0.05, sm(pondZ + 66, pondZ + 46, z) * (1 - sm(pondZ - 44, pondZ - 66, z))), 0.9, sm(8, -14, z)), 0.36, sm(-34, -62, z));   // town reach, swept pond, snowed-in below the viaduct, wind-scoured black ice in the gorge
      for (let j = 0; j < rows.length; j++) {
        const z = rows[j], rx = riverX(z), hw = riverHalf(z) + 9;
        const cz = cover(z);
        for (let i = 0; i <= NX; i++) { const x = rx + (i / NX * 2 - 1) * hw; P.push(x, 0, z); Dp.push(-height(x, z)); Sn.push(cz); }
        if (j) for (let i = 0; i < NX; i++) { const a = (j - 1) * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; I.push(a, c, b, b, c, d); }
        if (j % 30 === 29) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      for (let k = 0; k < I.length; k += 3) { const t = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = t; }      // face up
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(Dp), 1));
      g.setAttribute('aSnow', new THREE.BufferAttribute(new Float32Array(Sn), 1)); g.setIndex(I);
      const snowLit = hemiSky.clone().multiplyScalar(hemi.intensity).add(rimColor.clone().multiplyScalar(rim.intensity * rimDir.y)).multiplyScalar(0.3).multiply(snowHi);
      const bandC = new THREE.Color(LK.horizon).lerp(new THREE.Color(LK.scatterColor), clamp(LK.scatter * 0.45, 0, look === 'ember' ? 0.2 : 0.6));      // the sky low down the valley, which is what the ice mirrors
      scene.add(makeIceSheet(g, { time, deep: mixHex('#081234', '#050a24', dusk), deep2: mixHex('#132654', '#0f2048', dusk), ice: mixHex('#26468a', '#1c3676', dusk), snowLit, band: bandCol.clone().multiplyScalar(0.85),
        skyH: bandC.multiplyScalar(look === 'ember' ? 0.7 : 0.62), skyZ: new THREE.Color(LK.mid).multiplyScalar(0.9), warm: amber, ovals, train: iceTrain, pond: new THREE.Vector4(pondZ, 8.5 + pondR, 1, 0), skM: skMir, skC: skMirC }));
    }
    await ctx.yield();

    // ------------------------------------------------------------ the hero: the Express on the Viaduct
    const hero = await buildHero(ctx, { palette: PALETTE, crags: false, progress: 0, light: false, plough: rare, wind, blow, flakes: Math.round(7000 * QD * (look === 'frost' ? 0.7 : 1)) });
    hero.setLight({ sky: hemiSky.clone().multiplyScalar(LK.hemiK / Math.PI * 1.35), ground: hemiSky.clone().multiplyScalar(LK.hemiK / Math.PI * 0.8).add(rimColor.clone().multiplyScalar(LK.keyK * rimDir.y / Math.PI * 0.5)), rim: rimColor.clone().multiplyScalar(LK.keyK / Math.PI * 1.2), rimDir, warm: amber });
    scene.add(hero.object);
    hero.uniforms.uGlowK.value = LK.glowK; hero.uniforms.uLampK.value = 4.2;       // the parapet lanterns wash the spandrels a little more warmly
    const trainLen = hero.anchors.train.length;
    await ctx.yield();

    // ------------------------------------------------------------ shared materials for everything built
    const mats = S.makeMaterials({ night: LK.night, lit: rng.range(0.6, 0.74) + LK.lit, glow: lerp(2.9, 3.5, dusk), flood: LK.flood, floodColor: '#ffc68c', warm: '#ffbe6e', nightFill: [0.035, 0.06, 0.125] });
    mats.setSky({ top: LK.zenith, horizon: new THREE.Color(LK.horizon).lerp(new THREE.Color(LK.scatterColor), look === 'ember' ? 0.3 : 0.5), sun: LK.keyColor, sunDir: [rimDir.x, rimDir.y, rimDir.z] });
    const pools = [], smokers = [], lampPos = [], glowPts = [], glowCols = [], glowSizes = [];
    const addPool = (x, z, r, col, k = 1, y) => {
      const y0 = y ?? groundAt(x, z), e = 1.5, gx = (groundAt(x + e, z) - groundAt(x - e, z)) / (2 * e), gz = (groundAt(x, z + e) - groundAt(x, z - e)) / (2 * e);
      const sx = y == null ? clamp(gx, -0.5, 0.5) : 0, sz = y == null ? clamp(gz, -0.5, 0.5) : 0;
      pools.push({ p: [x, y0 + 0.22, z], u: [r, sx * r, 0], v: [0, sz * r, r], c: [col.r * k, col.g * k, col.b * k] });
    };
    const addGlow = (x, y, z, size, col) => { glowPts.push([x, y, z]); glowCols.push(col); glowSizes.push(size); };
    const addPool2 = (x, z, ax, az, rx, rz, col, k) => {      // elongated pool on level ground: half axes rx along (ax,az), rz across
      pools.push({ p: [x, groundAt(x, z) + 0.25, z], u: [ax * rx, 0, az * rx], v: [-az * rz, 0, ax * rz], c: [col.r * k, col.g * k, col.b * k] });
    };
    // every string of lights in the valley goes into one swaying garland mesh, and every lamp head gets its own little fall of lit snow (both made further down)
    const gSpans = [], snowLamps = [];
    // Nothing in the valley is switched on or off at a place of the lens. The small moving things beyond the viaduct (the sleighs and the dog behind one, the
    // villagers, the hamlet's and the snowfield's strings of lights, the snow in their lamps' light) come up out of nothing as the eye nears them: each kind
    // scales up or lights up over some forty metres of the eye's distance to where it is (`fades`, below), and is only left out of the draw while it is at
    // nothing. The skaters and the reeds of the river above the pond are drawn whenever any of their ground is in the picture (`inView`).
    const farFolk = new THREE.Group(), pondLife = new THREE.Group(), FB = new S.Builder(12000), fades = [];
    farFolk.name = 'far-folk'; pondLife.name = 'pond-life'; scene.add(farFolk, pondLife);
    const upRiver = new THREE.Group(); upRiver.name = 'up-river'; scene.add(upRiver);      // the reeds and boulders of the river above the pond
    // obj comes to full as the eye's distance to `at` falls from `gone` to `full` metres; u: the uniform(s) that carry it
    const fadeIn = (obj, u, at, gone, full) => { fades.push({ obj, u: Array.isArray(u) ? u : [u], at, gone, full }); return obj; };
    const gSpan = (a, b, o) => gSpans.push({ a, b, ...o });
    const gChain = (pts, o) => { for (let i = 1; i < pts.length; i++) gSpan(pts[i - 1], pts[i], o); };

    // ------------------------------------------------------------ the town: terraces of steep-roofed houses
    const hr = rng.fork('houses'), SURF = S.SURF;
    const wallsP = ['#d9c7a3', '#c9785c', '#e3d5b8', '#b86a6a', '#d8b25f', '#a7b98f', '#8fa7c2', '#cfa98a'];
    const roofsP = ['#7a2f2a', '#5a3a30', '#3b3f4a', '#6e3528'];
    const variants = [];
    for (let i = 0; i < 18; i++) {
      const fine = i < 10, floors = i < 4 ? 2 : hr.int(2, 4);
      const g = S.buildingGeometry({ rng: hr, style: 'townhouse', width: hr.range(7, 10.5), depth: hr.range(9, 12), floors, detail: fine ? 0.8 : 0.45, lit: 1.2, shop: fine && i % 3 === 0, palette: { wall: wallsP, roof: roofsP, accent: '#ffc46b' } });
      const p = g.attributes.position; let top = -1e9;
      for (let k = 0; k < p.count; k++) top = Math.max(top, p.getY(k));
      let cx = 0, cz = 0, cn = 0;
      for (let k = 0; k < p.count; k++) if (p.getY(k) > top - 0.02) { cx += p.getX(k); cz += p.getZ(k); cn++; }
      const cells = [], gn = g.attributes.normal, gu = g.attributes.uv, gw = g.attributes.win;      // [x0, y0, x1, y1, cols, rows, z] of every window wall facing the street
      if (fine && gw && gu) for (let k = 0; k + 3 < p.count; k++) {
        if (Math.round(gw.getX(k)) !== 1 || gn.getZ(k) < 0.9) continue;
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, u1 = 0, v1 = 0, ok = true; const zf = p.getZ(k);
        for (let q = k; q < k + 4; q++) {
          if (Math.round(gw.getX(q)) !== 1 || gn.getZ(q) < 0.9 || Math.abs(p.getZ(q) - zf) > 0.01) ok = false;
          x0 = Math.min(x0, p.getX(q)); x1 = Math.max(x1, p.getX(q)); y0 = Math.min(y0, p.getY(q)); y1 = Math.max(y1, p.getY(q)); u1 = Math.max(u1, gu.getX(q)); v1 = Math.max(v1, gu.getY(q));
        }
        if (ok && x1 - x0 > 3 && y1 - y0 > 2 && u1 >= 1.5) { cells.push([x0, y0, x1, y1, Math.round(u1), Math.max(1, Math.round(v1)), zf]); k += 3; }
      }
      // the roof's own measures, read off its tiled slopes: eave and ridge heights, and which way the ridge runs
      let eave = 1e9, ridge = -1e9, rx0 = 1e9, rx1 = -1e9, rz0 = 1e9, rz1 = -1e9;
      if (gw) {
        for (let k = 0; k < p.count; k++) if (Math.round(gw.getX(k)) === 11) { eave = Math.min(eave, p.getY(k)); ridge = Math.max(ridge, p.getY(k)); }
        for (let k = 0; k < p.count; k++) if (Math.round(gw.getX(k)) === 11 && p.getY(k) > ridge - 0.03) { rx0 = Math.min(rx0, p.getX(k)); rx1 = Math.max(rx1, p.getX(k)); rz0 = Math.min(rz0, p.getZ(k)); rz1 = Math.max(rz1, p.getZ(k)); }
      }
      const roofOk = ridge > eave + 0.5 && eave > 1;
      variants.push({ g, w: g.userData.w, d: g.userData.d, h: top, chim: [cx / cn, top, cz / cn], fine, low: i < 4, cells, eave: roofOk ? eave : 0, ridge: roofOk ? ridge : 0, alongX: rx1 - rx0 > rz1 - rz0 });
      await ctx.yield();
    }
    await ctx.yield();
    const TBs = [new S.Builder(30000)], m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), YA = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    const plinthC = lin('#8f8a94'), houses = [];
    let TB = TBs[0];
    const nextTB = () => {      // carry on in a fresh builder with the same pen state
      const b = new S.Builder(30000);
      for (const k of ['c', 'g0', 'g1', 'style', 'seed', 'sd', 'lit', 'wn', 'fl', 'flY', 'flL']) if (k in TB) b[k] = TB[k];
      TBs.push(b); TB = b;
    };
    // the quay houses are passed close and low: shutters folded back beside every window, sills loaded with snow, icicles under the cornice, an oriel on every second one
    const qR = makeRng(hashSeed(ctx.seed + ':quay')), shutP = ['#2f5a44', '#7a2f2a', '#2c4a7c', '#5a4630', '#3e5a6a', '#7a5a2a'].map(lin), trimQ = lin('#d9cdb4'), iceQ = [0.62, 0.74, 0.95];
    let quayN = 0;
    const dressHouse = (v, x, y, z, yaw, sc) => {
      const b = TB, shC = shutP[Math.floor(qR() * shutP.length)], oriel = quayN++ % 2 === 0; let yTop = 0, xa = 0, xb = 0, zF = 0, did = false;
      b.tr(x, y, z, yaw, sc);
      for (const [x0, y0, x1, y1, cols, rows, zf] of v.cells) {
        const cw = (x1 - x0) / cols, ch = (y1 - y0) / rows, sw = 0.19 * cw;
        if (y1 > yTop) { yTop = y1; xa = x0; xb = x1; zF = zf; }
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const wx0 = x0 + (c + 0.24) * cw, wx1 = x0 + (c + 0.76) * cw, wy0 = y0 + (r + 0.2) * ch, wy1 = y0 + (r + 0.8) * ch;
          if (oriel && !did && y0 > 1 && r === 0 && c === Math.floor(cols / 2)) {      // an oriel: a glazed bay on a corbel, under its own little snow roof
            did = true; const cx = x0 + (c + 0.5) * cw, ow = cw * 1.04, oy0 = y0 + 0.1 * ch, oy1 = y0 + 0.96 * ch, od = 0.95;
            b.col(trimQ, 0.9, 1).surf(SURF.WINDOW, qR(), 1.5); b.box(cx - ow / 2, oy0, zf, cx + ow / 2, oy1, zf + od, { cellW: ow, cellH: oy1 - oy0, top: false });
            b.col(trimQ, 0.7, 0.9).surf(SURF.PLAIN); b.frustum(cx, zf + od * 0.3, ow * 0.5, od * 0.5, ow, od, oy0 - 0.75, oy0, { topZ: od * 0.2 });
            b.box(cx - ow / 2 - 0.1, oy0 - 0.08, zf, cx + ow / 2 + 0.1, oy0 + 0.06, zf + od + 0.1, { bottom: true });
            Q(b, [cx - ow / 2 - 0.14, oy1 + 0.62, zf], [cx + ow / 2 + 0.14, oy1 + 0.62, zf], [cx + ow / 2 + 0.14, oy1 - 0.04, zf + od + 0.16], [cx - ow / 2 - 0.14, oy1 - 0.04, zf + od + 0.16], [0, 1, 0.4]);
            for (const sx of [-1, 1]) { const X = cx + sx * (ow / 2 + 0.14), A = [X, oy1 + 0.62, zf], B = [X, oy1 - 0.04, zf + od + 0.16], C = [X, oy1 - 0.04, zf]; if (sx > 0) b.tri(A, B, C); else b.tri(A, C, B); }
            for (let xi = cx - ow / 2; xi < cx + ow / 2; xi += 0.3) { const l = 0.18 + 0.5 * qR(); b.col(iceQ, 1, 1).tri([xi + 0.05, oy1 - 0.04, zf + od + 0.14], [xi - 0.05, oy1 - 0.04, zf + od + 0.14], [xi, oy1 - 0.04 - l, zf + od + 0.14]); }
            continue;
          }
          b.col(shC, 0.72, 1).surf(SURF.PLANKS, 0, 1);
          for (const sx of [-1, 1]) { const xs = sx < 0 ? wx0 - 0.06 - sw : wx1 + 0.06; Q(b, [xs, wy0 - 0.02, zf + 0.07], [xs + sw, wy0 - 0.02, zf + 0.07], [xs + sw, wy1 + 0.04, zf + 0.07], [xs, wy1 + 0.04, zf + 0.07], [0, 0, 1], [0, 0, 1, 3]); }
          b.col(trimQ, 0.85, 1).surf(SURF.PLAIN); b.box(wx0 - 0.14, wy0 - 0.2, zf, wx1 + 0.14, wy0 - 0.07, zf + 0.3, { bottom: true });
          b.col(snowC, 0.9, 1); b.box(wx0 - 0.1, wy0 - 0.07, zf, wx1 + 0.1, wy0 + 0.05 + 0.07 * qR(), zf + 0.26);
        }
      }
      if (yTop > 0) for (let xi = xa + 0.2; xi < xb - 0.1; xi += 0.24 + 0.3 * qR()) {      // icicles under the cornice
        const l = 0.2 + 0.75 * qR() * qR(); b.col(iceQ, 1, 1).surf(SURF.PLAIN).tri([xi + 0.055, yTop - 0.22, zF + 0.17], [xi - 0.055, yTop - 0.22, zF + 0.17], [xi, yTop - 0.22 - l, zF + 0.17]);
      }
      b.pop();
    };
    const placeHouse = (x, z, yaw, fine, quay = false, street = null) => {      // street: true = a low house, false = any fine one, standing by the flight on purpose
      const y = land.heightAt(x, z) + 0.3, n = path.nearestXZ(x, z), sc = hr.range(0.92, 1.14);
      let v = hr.pick(variants.filter((q) => (street == null ? q.fine === fine || (fine && q.low) : street ? q.low : q.fine)));
      if (street == null && n.dist < 27 && y + v.h * sc > n.y - 9.5) { v = hr.pick(variants.filter((q) => q.low)); if (n.dist < 15 && y + v.h * sc > n.y - 9.5) return null; }
      const base = TB.nv, off = hr();
      TB.addGeometry(v.g, m4.compose(v3.set(x, y, z), qt.setFromAxisAngle(YA, yaw), s3.set(sc, sc, sc)));
      for (let i = base; i < TB.nv; i++) if (isWin(Math.round(TB.W[i * 3]))) { TB.W[i * 3 + 1] = Math.round(((TB.W[i * 3 + 1] + off) % 1) * 1024) / 1024; if (quay) TB.W[i * 3 + 2] *= 1.9; }
      const w = v.w * sc, d = v.d * sc;
      if (quay && v.cells && v.cells.length) dressHouse(v, x, y, z, yaw, sc);
      // the footing: pale stone in the walls' own tone, washed by the windows above; on a terrace it is a low sill with snow banked against it
      const seated = SEAT.some((q) => q[0] === x && q[1] === z);
      TB.tr(x, y, z, yaw); TB.flood(0.5, -1.5, 9); TB.col(plinthC, 0.95, 1.2).surf(SURF.MASONRY, 0, 0.9); TB.box(-w / 2 - 0.25, seated ? -2.6 : -7.5, -d / 2 - 0.25, w / 2 + 0.25, 0.02, d / 2 + 0.25, { m: 1, top: false }); TB.flood(0);
      if (seated) {
        TB.surf(SURF.PLAIN);
        for (const [ax, az, bx, bz, ox, oz] of [[-w / 2 - 0.25, d / 2 + 0.25, w / 2 + 0.25, d / 2 + 0.25, 0, 1], [w / 2 + 0.25, d / 2 + 0.25, w / 2 + 0.25, -d / 2 - 0.25, 1, 0], [-w / 2 - 0.25, -d / 2 - 0.25, -w / 2 - 0.25, d / 2 + 0.25, -1, 0]]) {
          const sh = 0.9 + 0.1 * qR(), r = 1.5 + 0.8 * qR();
          TB.col(snowC, sh, sh); Q(TB, [ax, 0.1, az], [bx, 0.1, bz], [bx + ox * r, -0.75, bz + oz * r], [ax + ox * r, -0.75, az + oz * r], [ox * 0.5, 1, oz * 0.5]);
        }
      }
      TB.pop();
      const c = Math.cos(yaw), s = Math.sin(yaw), lx = v.chim[0] * sc, lz = v.chim[2] * sc;
      const smoking = hr.chance(0.72);
      if (smoking) smokers.push([x + lx * c + lz * s, y + v.h * sc + 0.3, z - lx * s + lz * c, hr.range(0.8, 1.35)]);
      addPool2(x + s * (d / 2 + 3.4), z + c * (d / 2 + 3.4), c, -s, w * 0.75, 4.8, amber, hr.range(0.34, 0.52) * (storm ? 1.9 : 1));
      if (seated) addPool(x + s * (d / 2 + 2.5), z + c * (d / 2 + 2.5), 10, amber, storm ? 1.0 : 0.7);
      if (quay) { const dx = w * 0.3 * hr.sign(), dz2 = d / 2 + 0.3; addGlow(x + dx * c + dz2 * s, y + 2.5, z - dx * s + dz2 * c, 3.4, '#ffc070'); }      // a lantern by the door
      houses.push({ x, y, z, w, d, h: v.h * sc, yaw, sc, quay, eave: v.eave, ridge: v.ridge, alongX: v.alongX, chim: v.chim, smoking });
      return houses[houses.length - 1];
    };
    const churchX = 70.5, churchZ = sqZ + 4;
    const rowX = [null, 45.5, 69.5, 95.5, 121.5, 147.5];
    for (let r = 0; r < 6; r++) {
      if (r === 2 || r === 4) nextTB();
      for (let z = 494 - hr.range(0, 6); z > 150; z -= hr.range(10.6, 13.4)) {
        const pondish = riverHalf(z) > 12, inSq = Math.abs(z - sqZ) < 31;
        const x = r === 0 ? riverX(z) + riverHalf(z) + 12.8 : rowX[r] + hr.range(-1.2, 1.2);
        if (r === 0 && (pondish || inSq || (z < sqZ && z > sqZ - 44))) continue;
        if (r === 1 && inSq) continue;
        if (Math.abs(x - churchX) < 17 && Math.abs(z - churchZ + 6) < 27) continue;
        if (!hr.chance(r < 2 ? 0.93 : 0.86 - r * 0.03)) continue;
        placeHouse(x, z, -Math.PI / 2 + hr.range(-0.1, 0.1) + (hr.chance(0.08) ? Math.PI / 2 : 0), r < 3, r === 0);
        await ctx.yield();
      }
      await ctx.yield();
    }
    for (let z = 488; z > 172; z -= hr.range(11, 15)) {            // the far bank: a single quay row
      if (!hr.chance(0.66)) continue;
      placeHouse(riverX(z) - riverHalf(z) - 13.5 - hr.range(0, 3), z, Math.PI / 2 + hr.range(-0.12, 0.12), true, true);
    }
    // the mill hamlet on the shelf across the gorge, below the causeway, and the covered wooden bridge that joins the two banks
    const zBr = -98, xBr = riverX(zBr);
    // one street on the shelf under the causeway wall: taller houses on the gorge side, low ones backing onto the causeway; the flight goes down it at eave height
    const hamlet = [];
    for (let i = 0; i < 5; i++) hamlet.push([-44.5, -82 - i * 12, 1]);
    for (let i = 0; i < 4; i++) hamlet.push([-15.5, -88 - i * 12, -1]);
    const hamletH = [];
    for (const [hx0, hz0, sd] of hamlet) { const hh = placeHouse(hx0 - sd * hr.range(0, 1.2), hz0 + hr.range(-1, 1), sd * Math.PI / 2 + hr.range(-0.1, 0.1), true, true, sd < 0); if (hh) hamletH.push(hh); await ctx.yield(); }
    for (const [dz, off] of [[-86, 15.5], [-111, 15]]) placeHouse(riverX(dz) - riverHalf(dz) - off, dz, Math.PI / 2, true, true);
    await ctx.yield();
    for (const [x, z, sd] of [[27, 38, -1], [38, 21, -1], [-26, 31, 1], [-36, 50, 1], [88, 97, -1], [95, 70, -1]]) { placeHouse(x, z, sd * Math.PI / 2 + hr.range(-0.25, 0.25), true, true); await ctx.yield(); }      // cottages at the foot of the viaduct, and two up the slope the flight climbs round
    for (const [x, z] of [[-23.5, -86], [-36.5, -98], [-23.5, -110], [-36.5, -122], [-31, -142]]) { lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 8, amber, 0.7); }
    { const x = riverX(-92) - riverHalf(-92) - 21; lampPos.push([x, groundAt(x, -92), -92]); addPool(x, -92, 8, amber, 0.7); }
    {
      const b = TB, wood = lin('#6a4630'), woodD = lin('#3e2a1e'), stn = lin('#6f6a70'), L = 13.5, Wd = 2.5, y0 = 3.5;
      b.tr(xBr, 0, zBr, 0);
      b.col(stn, 0.6, 0.95).surf(SURF.MASONRY, 0, 0.5);
      for (const sx of [-1, 1]) {      // piers standing in the ice, stone approaches into both banks
        b.cbox(sx * 7.4, -3, 0, 2.4, y0 + 2.6, 6.4, { m: 1 });
        b.box(Math.min(sx * L, sx * (L + 10)), -4, -Wd - 0.7, Math.max(sx * L, sx * (L + 10)), y0, Wd + 0.7, { m: 1 });
      }
      b.col(woodD, 0.9, 1).surf(SURF.PLANKS, 0, 1); b.box(-L, y0 - 0.5, -Wd, L, y0, Wd, { bottom: true });
      for (const sz of [-1, 1]) {
        b.col(wood, 0.75, 1.05).surf(SURF.PLANKS, 0, 1);
        b.box(-L, y0, sz * Wd - 0.12, L, y0 + 1.25, sz * Wd + 0.12);                      // boarded lower wall
        b.box(-L, y0 + 2.5, sz * Wd - 0.14, L, y0 + 3.0, sz * Wd + 0.14);                 // wall plate
        for (let x = -L; x <= L + 0.01; x += 2.25) b.cbox(x, y0 + 1.25, sz * Wd, 0.24, 1.25, 0.28);
        for (let x = -L, k = 0; x < L - 0.1; x += 2.25, k++) b.beam(k % 2 ? [x, y0 + 2.5, sz * Wd] : [x, y0 + 1.3, sz * Wd], k % 2 ? [x + 2.25, y0 + 1.3, sz * Wd] : [x + 2.25, y0 + 2.5, sz * Wd], 0.1, 0.14);
      }
      b.col(lin('#4a3a34'), 0.9, 1.1).surf(SURF.PLANKS, 0, 1); b.gable(-L - 0.9, -Wd - 0.75, L + 0.9, Wd + 0.75, y0 + 3.0, 2.0, { alongX: true, overhang: 0.2, wallColor: wood });
      b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.6);
      for (const x of [-9, -3, 3, 9]) b.cbox(x, y0 + 2.3, 0, 0.32, 0.46, 0.32);         // lanterns under the ridge shine out through the open sides
      b.pop();
      for (const x of [-9, -3, 3, 9]) addGlow(xBr + x, y0 + 2.45, zBr, 6, '#ffb060');
      for (const sx of [-1, 1]) { addGlow(xBr + sx * (L + 0.5), y0 + 1.7, zBr, 8, '#ffb868'); addPool(xBr + sx * (L + 5), zBr, 7, amber, 0.6); snowLamps.push([xBr + sx * (L + 0.5), y0 + 1.9, zBr, 0.8]); }
      for (const sz of [-1, 1]) pools.push({ p: [xBr, 0.07, zBr + sz * 6.5], u: [12, 0, 0], v: [0, 0, 5], c: [amber.r * 0.55, amber.g * 0.55, amber.b * 0.55] });
    }
    // ------------------------------------------------------------ the valley floor below the viaduct, seen from the climb: the mill on the far bank with its wheel
    // turning in an open race, a small covered footbridge across the ice to the cottages, and the lamp-lit lane that joins them (the lane is in the snow shader)
    const MILL = [-19, 76], millY = groundAt(MILL[0], MILL[1]) + 0.25, FBZ = 52, laneX = (z) => -17 - 1.6 * Math.sin(z * 0.085), afterCaps = [];
    let wheel = null, millSmoke = null;
    {
      const b = TB, stn = lin('#7d7884'), wood = lin('#5e3f2c'), woodD = lin('#3a281d'), cream = lin('#d9c7a3'), mr = makeRng(hashSeed(ctx.seed + ':mill'));
      b.tr(MILL[0], millY, MILL[1], Math.PI / 2);      // local +Z looks across the river, local -X up the valley toward the oncoming lens
      b.flood(0.5, 0, 8); b.col(stn, 0.7, 1).surf(SURF.MASONRY, 0, 0.9); b.box(-5, -3, -3.7, 5, 3.3, 3.7, { m: 1, top: false });
      b.col(wood, 0.8, 1.05).surf(SURF.PLANKS, 0, 1); b.box(-5.2, 3.3, -3.9, 5.2, 6.3, 3.9, { top: false, bottom: true });
      b.col(woodD, 1, 1); b.box(-5.35, 3.18, -4.05, 5.35, 3.42, 4.05, { bottom: true });
      for (const x of [-3.3, -1.1, 1.1, 3.3]) winQuad(b, mr, x, 4.85, 3.9, 1.35, 1.6, 0, SURF.WINDOW, 2.5, cream);
      for (const x of [-3.4, -1.2]) winQuad(b, mr, x, 1.75, 3.7, 1.2, 1.5, 0, SURF.ARCHED, 2.3, stn);
      for (const z of [-2, 2]) winQuad(b, mr, -5.2, 4.85, z, 1.4, 1.6, -Math.PI / 2, SURF.WINDOW, 2.5, cream);
      winQuad(b, mr, -5, 1.45, -1.6, 1.7, 2.7, -Math.PI / 2, SURF.ARCHED, 2.1, lin('#4a3526'));      // the door, on the lane
      winQuad(b, mr, -5, 1.9, 1.9, 1.2, 1.5, -Math.PI / 2, SURF.ARCHED, 2.3, stn);
      winQuad(b, mr, -5.28, 7.5, 0, 1.2, 1.4, -Math.PI / 2, SURF.ARCHED, 2.4, cream);                 // a lit loft window in the boarded gable
      b.col(lin('#5a3a30'), 0.9, 1.1).surf(SURF.PLAIN); b.gable(-5.2, -3.9, 5.2, 3.9, 6.3, 3.7, { alongX: true, overhang: 0.6, wallColor: wood, wallStyle: SURF.PLANKS });
      b.col(stn, 0.7, 1).surf(SURF.MASONRY, 0, 0.9); b.cbox(2.8, 8, -1.3, 1.15, 3.1, 1.15, { m: 1 });
      // the race: a stone wall outside the wheel, parallel to the river front, the water running between the two; the axle's bearing block on the wall
      b.box(-2.1, -3, 6.4, 5.1, 1.2, 6.95, { m: 1 }); b.box(-2.1, -3, 3.7, -1.7, 0.45, 6.4, { m: 1 }); b.cbox(1.5, 1.2, 6.67, 1, 0.75, 0.55, { m: 1 });
      b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(-5.55, 2.75, -0.45, 0.3, 0.44, 0.3); b.cbox(4.75, 3.4, 4.1, 0.3, 0.44, 0.3);      // a lantern by the door, another over the race
      b.flood(0); b.pop();
      const W2 = (lx, ly, lz) => [MILL[0] + lz, millY + ly, MILL[1] - lx];      // mill-local to world
      { const p = W2(-5.6, 2.95, -0.45), q = W2(4.75, 3.6, 4.3); addGlow(p[0], p[1], p[2], 5.5, '#ffb866'); addGlow(q[0], q[1], q[2], 5.5, '#ffb866'); snowLamps.push([p[0], p[1], p[2], 0.8], [q[0], q[1], q[2], 0.8]); }
      addPool(MILL[0] + 1.5, MILL[1] + 8.5, 8, amber, 0.8); addPool(MILL[0] + 7.5, MILL[1] - 1.5, 7, amber, 0.75);
      { const c = W2(2.8, 11.4, -1.3); millSmoke = [c[0], c[1], c[2], 1.25]; }      // (it joins the list of chimneys last, see the smoke)
      houses.push({ x: MILL[0], y: millY, z: MILL[1], w: 8, d: 11, h: 10, yaw: Math.PI / 2, sc: 1, quay: false, eave: 0, ridge: 0, rng: mr });      // (its woodpile is dealt from the mill's own stream)
      // the wheel: a mesh of its own, turned in update()
      const wb = new S.Builder(1600), R = 2.75, NP = 12;
      wb.flood(0.45, -3, 7).col(woodD, 1.25, 1.25).surf(SURF.PLANKS, 0, 1);
      for (let i = 0; i < NP; i++) {
        const a0 = i / NP * TAU, a1 = (i + 1) / NP * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        for (const z of [-0.55, 0.55]) { wb.beam([R * c0, R * s0, z], [R * c1, R * s1, z], 0.16, 0.24); if (i % 2 === 0) wb.beam([0, 0, z], [R * c0, R * s0, z], 0.12, 0.14); }
        const r0 = R - 0.62, r1 = R + 0.14, A = [r0 * c0, r0 * s0, -0.55], B = [r1 * c0, r1 * s0, -0.55], C = [r1 * c0, r1 * s0, 0.55], D = [r0 * c0, r0 * s0, 0.55];
        wb.quad(A, B, C, D, [0, 0, 1, 1]); wb.quad(B, A, D, C, [0, 0, 1, 1]);
      }
      wb.beam([0, 0, -1.1], [0, 0, 0.95], 0.36, 0.36);
      wheel = new THREE.Mesh(await builderGeometry(wb, () => ctx.yield()), mats.facades); wheel.name = 'mill-wheel';
      const wg = new THREE.Group(); { const c = W2(1.5, 1.75, 5.55); wg.position.set(c[0], c[1], c[2]); } wg.rotation.y = Math.PI / 2; wg.add(wheel); scene.add(wg);
      afterCaps.push((b2) => {      // the race itself: dark, open water under the wheel and a frozen tail race down to the river
        b2.flood(0).surf(SURF.PLAIN).col([0.022, 0.04, 0.1], 1, 1);
        { const a = W2(-1.7, 0.5, 3.75), c = W2(5.1, 0.5, 6.4); Q(b2, [a[0], a[1], a[2]], [c[0], a[1], a[2]], [c[0], a[1], c[2]], [a[0], a[1], c[2]], [0, 1, 0]); }
        b2.col([0.1, 0.17, 0.36], 1, 1);
        for (let k = 0; k < 5; k++) { const xa = MILL[0] + 6.9 + k * 0.95, xb = xa + 0.95, z0 = MILL[1] - 5, z1 = MILL[1] - 3; Q(b2, [xa, groundAt(xa, z0) + 0.07, z0], [xb, groundAt(xb, z0) + 0.07, z0], [xb, groundAt(xb, z1) + 0.07, z1], [xa, groundAt(xa, z1) + 0.07, z1], [0, 1, 0]); }
        const ice = [0.62, 0.74, 0.95];      // icicles along the lean-to and the eaves on the river side
        b2.col(ice, 1, 1);
        for (let k = 0; k < 26; k++) { const lx = -5 + k * 0.4 + 0.2 * mr(), l = 0.25 + 0.8 * mr() * mr(), p = W2(lx, 5.6, 4.48); b2.tri([p[0], p[1], p[2] + 0.06], [p[0], p[1], p[2] - 0.06], [p[0], p[1] - l, p[2]]); }
      });
    }
    await ctx.yield();
    {   // the footbridge: the big one's little sister, boarded and roofed, three lanterns under its ridge
      const b = TB, wood = lin('#6a4630'), woodD = lin('#3e2a1e'), stn = lin('#6f6a70'), L = 13.2, Wd = 1.7, y0 = 3.3, xF = riverX(FBZ);
      b.tr(xF, 0, FBZ, 0); b.flood(0.4, 0, 8);
      b.col(stn, 0.6, 0.95).surf(SURF.MASONRY, 0, 0.5);
      for (const sx of [-1, 1]) { b.cbox(sx * 5.2, -3.4, 0, 1.7, y0 + 3, 4.4, { m: 1 }); b.box(Math.min(sx * L, sx * (L + 7)), -4, -Wd - 0.5, Math.max(sx * L, sx * (L + 7)), y0, Wd + 0.5, { m: 1 }); }
      b.col(woodD, 0.9, 1).surf(SURF.PLANKS, 0, 1); b.box(-L, y0 - 0.45, -Wd, L, y0, Wd, { bottom: true });
      for (const sz of [-1, 1]) {
        b.col(wood, 0.8, 1.1).surf(SURF.PLANKS, 0, 1);
        b.box(-L, y0, sz * Wd - 0.1, L, y0 + 1.15, sz * Wd + 0.1); b.box(-L, y0 + 2.35, sz * Wd - 0.12, L, y0 + 2.8, sz * Wd + 0.12);
        for (let x = -L; x <= L + 0.01; x += 2.2) b.cbox(x, y0 + 1.15, sz * Wd, 0.22, 1.2, 0.26);
      }
      b.col(lin('#4a3a34'), 0.9, 1.1).surf(SURF.PLANKS, 0, 1); b.gable(-L - 0.8, -Wd - 0.6, L + 0.8, Wd + 0.6, y0 + 2.8, 1.6, { alongX: true, overhang: 0.2, wallColor: wood });
      b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.7);
      for (const x of [-8.5, 0, 8.5]) b.cbox(x, y0 + 2.1, 0, 0.3, 0.44, 0.3);
      b.flood(0); b.pop();
      for (const x of [-8.5, 0, 8.5]) { addGlow(xF + x, y0 + 2.3, FBZ, 6, '#ffb060'); snowLamps.push([xF + x, y0 + 1.6, FBZ + 2.4, 0.7]); }
      for (const sx of [-1, 1]) { addGlow(xF + sx * (L + 0.4), y0 + 1.6, FBZ, 7, '#ffb868'); addPool(xF + sx * (L + 4.5), FBZ, 7, amber, 0.7); }
      for (const sz of [-1, 1]) pools.push({ p: [xF, 0.07, FBZ + sz * 5.5], u: [11, 0, 0], v: [0, 0, 4.6], c: [amber.r * 0.6, amber.g * 0.6, amber.b * 0.6] });
      // lamps along the lane, a chain of bulbs from lamp to lamp
      const heads = [];
      for (const z of [106, 90, 62, 46, 30]) { const x = laneX(z) - 2.6, y = groundAt(x, z); lampPos.push([x, y, z]); addPool(x + 1.6, z, 8.5, amber, 0.8); heads.push([x, y + 4.25, z]); }
      gChain(heads, { sag: 0.07, swing: 0.2, spacing: 1.05, size: 0.52, twinkle: 0.9 });
    }
    await ctx.yield();
    // ------------------------------------------------------------ the roofs and gables of every house the flight passes close (the quays, the hamlet, the cottages):
    // no roof is a bare white slab and no gable a bare pale triangle. Snow has slid off the eaves here and there and left the tiles showing, with a thick lip
    // of snow above and icicles below; elsewhere it hangs over the eave in a roll; a roll of snow rides the ridge; a lit dormer sits in each slope, a second
    // chimney smokes at the far end of the ridge; the gables are boarded in dark wood with a lit loft window, a collar beam and barge boards.
    afterCaps.push(async (bT) => {
      let b = bT;
      const rD = makeRng(hashSeed('roof-more:' + ctx.seed));      // a stream of its own: the dressing below it adds never shifts a draw of the roofs' own
      const rR = makeRng(hashSeed(ctx.seed + ':roofs')), tiles = ['#5c2a26', '#4a3028', '#343842', '#58302a'].map(lin), woodG = lin('#a87a52'), beamC = lin('#33231b'), ice = [0.62, 0.74, 0.95];
      const shade = [snowC[0] * 0.56, snowC[1] * 0.63, snowC[2] * 0.8], cream = lin('#d9c7a3'), stn = lin('#7d7884');
      const triOut = (A, B, C, want) => {
        const nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
        if (nx * want[0] + ny * want[1] + nz * want[2] < 0) b.tri(B, A, C, undefined, undefined, undefined, [1, 0], [0, 0], [0.5, 1]); else b.tri(A, B, C);
      };
      let nH = 0;
      for (const h of houses) {
        if (!h.quay || !h.eave) continue;
        const W = h.w / h.sc, D = h.d / h.sc, ov = 0.4, aX = h.alongX, half = (aX ? D : W) / 2, len = (aX ? W : D) / 2 + ov, er = h.eave, rg = h.ridge;
        const slope = (rg - er) / (half + ov), hw = rg - slope * half, tc = tiles[Math.floor(rR() * tiles.length)], nl = Math.hypot(1, slope);
        const V = (sv, y, o) => (aX ? [sv, y, o] : [o, y, sv]);
        // P: sv along the ridge, t 0 at the ridge .. 1 at the eave, sd which slope, lift off the roof's plane
        const P = (sv, t, sd, lift = 0) => V(sv, rg - (rg - er) * t + lift / nl, sd * (t * (half + ov) + lift * slope / nl));
        const up = (sd) => V(0, 1, sd * slope), out = (sd, y = 0) => V(0, y, sd);
        b = h.z < 0 ? FB : bT;      // beyond the viaduct the dressing rides in the far mesh
        b.tr(h.x, h.y, h.z, h.yaw, h.sc); b.flood(0);
        const more = h.z < 110;      // the hamlet's and the cottages' roofs, which the flight passes low over: none of them is left a bare plane of snow
        for (const sd of [-1, 1]) {
          const rolls = [];
          for (let s0 = -len; s0 < len - 0.3;) {
            const s1 = Math.min(len, s0 + 1.2 + 2.6 * rR()), t0 = 0.74 + 0.14 * rR();
            if (rR() < 0.55) {
              b.surf(SURF.TILES, 0, 1).col(tc, 0.8, 1.05); Q(b, P(s0, 1, sd, 0.05), P(s1, 1, sd, 0.05), P(s1, t0, sd, 0.05), P(s0, t0, sd, 0.05), up(sd), [s0, 0, s1, (1 - t0) * 6]);
              b.surf(SURF.PLAIN).col(shade, 1, 1); Q(b, P(s0, t0, sd, 0.05), P(s1, t0, sd, 0.05), P(s1, t0 - 0.02, sd, 0.32), P(s0, t0 - 0.02, sd, 0.32), out(sd, 0.3));
              b.col(snowC, 0.98, 0.98); Q(b, P(s0, t0 - 0.02, sd, 0.32), P(s1, t0 - 0.02, sd, 0.32), P(s1, t0 - 0.24, sd, 0.05), P(s0, t0 - 0.24, sd, 0.05), up(sd));
              b.col(ice, 1, 1);
              for (let sv = s0 + 0.2; sv < s1 - 0.1; sv += 0.45 + 0.55 * rR()) { const C = P(sv, 1, sd, -0.1); C[1] -= 0.25 + 0.7 * rR() * rR(); triOut(P(sv - 0.055, 1, sd, -0.1), P(sv + 0.055, 1, sd, -0.1), C, out(sd)); }
            } else {
              b.surf(SURF.PLAIN).col(snowC, 1, 1); Q(b, P(s0, 1.05, sd, 0.03), P(s1, 1.05, sd, 0.03), P(s1, 0.9, sd, 0.3), P(s0, 0.9, sd, 0.3), up(sd));
              b.col(snowC, 0.97, 0.97); Q(b, P(s0, 0.9, sd, 0.3), P(s1, 0.9, sd, 0.3), P(s1, 0.66, sd, 0.05), P(s0, 0.66, sd, 0.05), up(sd));
              b.col(shade, 1, 1); Q(b, P(s0, 1.05, sd, 0.03), P(s1, 1.05, sd, 0.03), P(s1, 1.05, sd, -0.24), P(s0, 1.05, sd, -0.24), out(sd, -0.2));
              rolls.push([s0, s1]);
            }
            s0 = s1;
          }
          // a dormer: a lit window under its own little load of snow
          const tf = 0.66, yb = rg - (rg - er) * tf, yt = yb + 1.2, tb = tf - 1.2 / (rg - er), sv = (rR() - 0.5) * (len - 1.6) * 1.6, lit = rR() < 0.8;
          if (tb > 0.08 && len > 2.4) {
            const of = sd * tf * (half + ov), ob = sd * tb * (half + ov), hwD = 0.8;
            b.surf(SURF.PLAIN).col(cream, 0.8, 0.95); Q(b, V(sv - hwD, yb - 0.05, of), V(sv + hwD, yb - 0.05, of), V(sv + hwD, yt, of), V(sv - hwD, yt, of), out(sd));
            for (const e of [-1, 1]) triOut(V(sv + e * hwD, yb - 0.05, of), V(sv + e * hwD, yt, of), V(sv + e * hwD, yt, ob), V(e, 0, 0));
            { const c = V(sv, yb + 0.56, of); winQuad(b, rR, c[0], c[1], c[2], 1.05, 0.9, aX ? (sd > 0 ? 0 : Math.PI) : sd * Math.PI / 2, SURF.WINDOW, lit ? 2.6 : 0.2, cream); }
            b.surf(SURF.PLAIN).col(snowC, 1, 1); Q(b, V(sv - hwD - 0.15, yt + 0.24, of + sd * 0.22), V(sv + hwD + 0.15, yt + 0.24, of + sd * 0.22), V(sv + hwD + 0.15, yt + 0.08, ob), V(sv - hwD - 0.15, yt + 0.08, ob), [0, 1, 0]);
            b.col(shade, 1, 1); Q(b, V(sv - hwD - 0.15, yt - 0.02, of + sd * 0.22), V(sv + hwD + 0.15, yt - 0.02, of + sd * 0.22), V(sv + hwD + 0.15, yt + 0.24, of + sd * 0.22), V(sv - hwD - 0.15, yt + 0.24, of + sd * 0.22), out(sd));
          }
          if (more) {
            const rise = rg - er, svD = Math.max(-len + 1.4, Math.min(len - 1.4, sv));
            if (!(tb > 0.08 && len > 2.4) && rise > 1) {      // a low roof has no room for the tall dormer: it gets a small one, lit, under its own cap of snow
              const hD = Math.min(1.1, rise * 0.5), tfD = 0.72, ybD = rg - rise * tfD, ytD = ybD + hD, of = sd * tfD * (half + ov), ob = sd * (tfD - hD / rise) * (half + ov), hwD = 0.62;
              b.surf(SURF.PLAIN).col(cream, 0.8, 0.95); Q(b, V(svD - hwD, ybD - 0.05, of), V(svD + hwD, ybD - 0.05, of), V(svD + hwD, ytD, of), V(svD - hwD, ytD, of), out(sd));
              for (const e of [-1, 1]) triOut(V(svD + e * hwD, ybD - 0.05, of), V(svD + e * hwD, ytD, of), V(svD + e * hwD, ytD, ob), V(e, 0, 0));
              { const c = V(svD, ybD + hD * 0.5, of); winQuad(b, rD, c[0], c[1], c[2], 0.86, hD * 0.7, aX ? (sd > 0 ? 0 : Math.PI) : sd * Math.PI / 2, SURF.WINDOW, rD() < 0.85 ? 2.6 : 0.2, cream); }
              b.surf(SURF.PLAIN).col(snowC, 1, 1); Q(b, V(svD - hwD - 0.14, ytD + 0.22, of + sd * 0.2), V(svD + hwD + 0.14, ytD + 0.22, of + sd * 0.2), V(svD + hwD + 0.14, ytD + 0.07, ob), V(svD - hwD - 0.14, ytD + 0.07, ob), [0, 1, 0]);
              b.col(shade, 1, 1); Q(b, V(svD - hwD - 0.14, ytD - 0.02, of + sd * 0.2), V(svD + hwD + 0.14, ytD - 0.02, of + sd * 0.2), V(svD + hwD + 0.14, ytD + 0.22, of + sd * 0.2), V(svD - hwD - 0.14, ytD + 0.22, of + sd * 0.2), out(sd));
            }
            // where a load of snow has slid: the tiles bare in a strip down the slope, and the heap it left hanging over the eave
            const a0 = svD > 0 ? rD.range(-len + 0.7, svD - 3.4) : rD.range(svD + 1.5, len - 2.6), a1 = a0 + rD.range(0.7, 1.4), t0 = rD.range(0.3, 0.44), t1 = rD.range(0.6, 0.72);
            if (a0 > -len + 0.5 && a1 < len - 0.5 && Math.abs((a0 + a1) / 2 - svD) > 1.5 + (a1 - a0) / 2 && rD() < 0.8) {
              b.surf(SURF.TILES, 0, 1).col(tc.map((v, i) => v * 0.6 + snowC[i] * 0.4), 0.9, 1.1); Q(b, P(a0, t1, sd, 0.045), P(a1, t1, sd, 0.045), P(a1 - 0.2, t0, sd, 0.045), P(a0 + 0.25, t0, sd, 0.045), up(sd), [a0, 0, a1, (t1 - t0) * 6]);
              b.surf(SURF.PLAIN).col(shade, 1.05, 1.05); Q(b, P(a0 - 0.1, t1, sd, 0.05), P(a1 + 0.1, t1, sd, 0.05), P(a1 + 0.1, t1 + 0.02, sd, 0.36), P(a0 - 0.1, t1 + 0.02, sd, 0.36), out(sd, -0.3));
              b.col(snowC, 1, 1); Q(b, P(a0 - 0.1, t1 + 0.02, sd, 0.36), P(a1 + 0.1, t1 + 0.02, sd, 0.36), P(a1 + 0.2, t1 + 0.2, sd, 0.06), P(a0 - 0.2, t1 + 0.2, sd, 0.06), up(sd));
            }
            b.surf(SURF.PLAIN).col(ice, 1, 1);      // icicles under the rolls of snow that hang over the eave
            for (const [r0, r1] of rolls) for (let q = r0 + 0.15 + 0.3 * rD(); q < r1 - 0.1; q += 0.4 + 0.7 * rD()) { const C = P(q, 1.05, sd, -0.24); C[1] -= 0.22 + 0.75 * rD() * rD(); triOut(P(q - 0.06, 1.05, sd, -0.24), P(q + 0.06, 1.05, sd, -0.24), C, out(sd)); }
          }
        }
        b.surf(SURF.PLAIN).col(snowC, 1.02, 1.02);      // the ridge's roll of snow
        { const A = V(-len, rg - 0.12, -0.34), B = V(len, rg + 0.2, 0.34); b.box(Math.min(A[0], B[0]), A[1], Math.min(A[2], B[2]), Math.max(A[0], B[0]), B[1], Math.max(A[2], B[2]), { bottom: false }); }
        {   // a second chimney, smoking, at the other end of the ridge from the first
          const cs = (aX ? h.chim[0] : h.chim[2]) > 0 ? -1 : 1, c = V(cs * (len - ov) * 0.55, rg - 0.5, 0.05);
          b.surf(SURF.MASONRY, 0, 1.4).col(stn, 0.75, 1); b.cbox(c[0], c[1], c[2], 0.85, 1.75, 0.85, { m: 1 });
          b.surf(SURF.PLAIN).col(snowC, 1, 1); Q(b, [c[0] - 0.5, c[1] + 1.8, c[2] - 0.5], [c[0] + 0.5, c[1] + 1.8, c[2] - 0.5], [c[0] + 0.5, c[1] + 1.8, c[2] + 0.5], [c[0] - 0.5, c[1] + 1.8, c[2] + 0.5], [0, 1, 0]);
          const cc = Math.cos(h.yaw), sn = Math.sin(h.yaw);
          if (!h.smoking) smokers.push([h.x + (c[0] * cc + c[2] * sn) * h.sc, h.y + (c[1] + 2.1) * h.sc, h.z + (-c[0] * sn + c[2] * cc) * h.sc, 0.7 + 0.3 * rR()]);      // every one of these houses has a fire lit: where the first chimney is cold, this one smokes
        }
        for (const e of [-1, 1]) {      // the gables
          const sg = e * (len - ov + 0.07), A = V(sg, hw, -half), B = V(sg, hw, half), C = V(sg, rg - 0.08, 0), want = V(e, 0, 0);
          b.flood(0.4, er - 2.5, 9); b.surf(SURF.PLANKS, 0, 1).col(woodG, 1, 1);      // the gable is washed from below by the windows' and the lamps' light
          { const nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]), kA = woodG.map((v) => v * 0.85), kC = woodG.map((v) => v * 1.15);
            if (nx * want[0] + nz * want[2] < 0) b.tri(B, A, C, kA, kA, kC, [2 * half, 0], [0, 0], [half, rg - hw]); else b.tri(A, B, C, kA, kA, kC, [0, 0], [2 * half, 0], [half, rg - hw]); }
          b.col(beamC, 1, 1);
          b.beam(V(sg + e * 0.08, hw + 0.06, -half - 0.1), V(sg + e * 0.08, hw + 0.06, half + 0.1), 0.2, 0.24);
          for (const sd of [-1, 1]) { const x = sg + e * (ov - 0.07); Q(b, V(x, er - 0.26, sd * (half + ov)), V(x, rg - 0.26, 0), V(x, rg + 0.08, 0), V(x, er + 0.08, sd * (half + ov)), want); }      // barge boards
          if (rg - hw > 2.2) { const c = V(sg, hw + (rg - hw) * 0.4, 0); winQuad(b, rR, c[0], c[1], c[2], 0.95, 1.15, aX ? e * Math.PI / 2 : (e > 0 ? 0 : Math.PI), SURF.ARCHED, rR() < 0.75 ? 2.5 : 0.2, cream); }
          b.flood(0);
        }
        b.pop();
        if (++nH % 6 === 0) await ctx.yield();
      }
    });
    for (const v of variants) v.g.dispose();
    await ctx.yield();
    {   // street furniture: benches round the pond, woodpiles by the doors, rail fences along the quays
      const wood = lin('#4a3628'), wood2 = lin('#7a5a3c'), b = TB;
      for (const dz of [-30, -15, 0, 15, 30]) for (const sx of [-1, 1]) {
        const z = pondZ + dz + hr.range(-3, 3), x = riverX(z) + sx * (riverHalf(z) + 4.4), y = groundAt(x, z);
        b.tr(x, y, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2); b.col(wood, 1, 1).surf(SURF.PLANKS, 0, 1);
        b.cbox(0, 0.42, 0, 2.3, 0.12, 0.55); b.cbox(0, 0.62, -0.3, 2.3, 0.6, 0.1); b.cbox(-0.95, -0.3, 0, 0.12, 0.74, 0.5); b.cbox(0.95, -0.3, 0, 0.12, 0.74, 0.5); b.pop();
      }
      for (const h of houses) { const wr = h.rng || hr;
        if (!wr.chance(0.4)) continue;
        b.tr(h.x, h.y, h.z, h.yaw); b.col(wood2, 0.7, 1.05).surf(SURF.PLANKS, 0, 1);
        const sx = wr.sign(), l = wr.range(1.8, 3.2); b.cbox(sx * (h.w / 2 - l / 2 - 0.4), -0.4, h.d / 2 + 0.55, l, wr.range(1.3, 1.9), 0.9, { m: 1.5 }); b.pop();
      }
      await ctx.yield();
      b.col(wood, 1, 1).surf(SURF.PLAIN);
      for (const sx of [-1, 1]) {
        let run = 0, prev = null;
        for (let z = 486; z > 122; z -= 2.7) {
          const pondish = riverHalf(z) > 9.5; if (pondish || (run++ % 9) > 5) { prev = null; continue; }
          const x = riverX(z) + sx * (riverHalf(z) + 3.7), y = groundAt(x, z), p = [x, y + 0.95, z];
          b.cbox(x, y - 0.3, z, 0.16, 1.45, 0.16);
          if (prev) { b.beam(prev, p, 0.07, 0.11); b.beam([prev[0], prev[1] - 0.45, prev[2]], [p[0], p[1] - 0.45, p[2]], 0.07, 0.11); }
          prev = p;
        }
        await ctx.yield();
      }
    }
    await ctx.yield();
    // a ring of lanterns on poles round the skating pond, a garland of bulbs from pole to pole, each lantern's light lying on the ice
    const pondSpans = [];
    {
      const b = TB, pole = lin('#3a2a20'), stR = makeRng(hashSeed(ctx.seed + ':streaks')), svR = makeRng(hashSeed('streak-vary:' + ctx.seed));
      for (const sx of [-1, 1]) {
        let prev = null;
        for (let k = -5; k <= 5; k++) {
          // the poles stand at unequal intervals (6 to 13 m), as a village sets them out, so neither they nor their reflections make an even row
          const z = pondZ + k * 9.4 + (sx > 0 ? 2.2 : -2.2) + svR.range(-2.9, 2.9), x = riverX(z) + sx * (riverHalf(z) + 1.4), y = groundAt(x, z), top = [x, y + 3.25, z];
          b.col(pole, 1, 1).surf(SURF.PLAIN); b.cbox(x, y - 0.4, z, 0.17, 3.7, 0.17);
          b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(x, y + 3.3, z, 0.36, 0.5, 0.36);
          addGlow(x, y + 3.55, z, 4.6, '#ffbe6c'); snowLamps.push([x, y + 3.5, z, 0.8]);
          { const rP = svR.range(3.4, 5.6), kP = svR.range(0.34, 0.78); pools.push({ p: [x - sx * 3.4, 0.07, z], u: [rP, 0, 0], v: [0, 0, rP], c: [amber.r * kP, amber.g * kP, amber.b * kP] }); }
          { const l0 = stR.range(4.2, 9.5), k0 = stR.range(0.24, 0.44), w0 = stR.range(0.6, 1.05), off = stR.range(-0.5, 0.7);      // drawn out toward the oncoming lens
            // no two alike: from a short stub to a long blade (2.5 to 15 m), from faint to bright, thin or broad, each leaning its own way toward the middle of
            // the river (where the eye that sees it is), and one in three broken in two by a field of frost
            const r1 = svR(), r2 = svR(), r3 = svR(), r4 = svR(), brk = svR.chance(0.34), gap = svR.range(1.2, 3), l2 = svR.range(1.2, 3.6);
            const len = l0 * lerp(0.55, 1.7, r1 * r1), kS = k0 * lerp(0.16, 1.5, r2 * r2), wS = w0 * lerp(0.7, 1.3, r3), ln = lerp(0.04, 0.4, r4), dn = Math.hypot(ln, 1), dx = -sx * ln / dn, dz = 1 / dn;
            const x0 = x - sx * (2.4 + off), z0 = z - 1;
            pools.push({ p: [x0 + dx * len, 0.075, z0 + dz * len], u: [dz * wS, 0, -dx * wS], v: [dx * len, 0, dz * len], c: [amber.r * kS, amber.g * kS, amber.b * kS], s: true });
            if (brk) { const m = 2 * len + gap + l2; pools.push({ p: [x0 + dx * m, 0.075, z0 + dz * m], u: [dz * wS * 0.8, 0, -dx * wS * 0.8], v: [dx * l2, 0, dz * l2], c: [amber.r * kS * 0.7, amber.g * kS * 0.7, amber.b * kS * 0.7], s: true }); } }
          if (prev) pondSpans.push([prev, top]);
          prev = top;
        }
      }
    }
    await ctx.yield();

    // the church with its lit clock
    const churchY = land.heightAt(churchX, churchZ) + 0.4, clockFaces = [];
    {
      const b = TB, st = lin('#8d8791'), wl = lin('#b9ad9f'), rf = lin('#5c6890');
      b.tr(churchX, churchY, churchZ, -Math.PI / 2);
      b.flood(0.5, 0, 22); b.col(st, 0.6, 1).surf(SURF.MASONRY, 0, 1);
      b.box(-7, -9, -20.5, 7, 1.4, 5, { m: 1 });
      b.flood(0.7, 0, 60); b.box(-5.1, -9, 5, 5.1, 17, 14.2, { m: 1, top: false });      // the shaft is washed by warm light from its foot
      b.flood(1.0, 19, 15); b.box(-5.1, 17, 5, 5.1, 31, 14.2, { m: 1, bottom: false }); b.flood(0.5, 0, 22);      // the tower's clock stage is floodlit, so the tower is a lit landmark from the entry, not a dark block
      b.col(wl, 0.85, 1).surf(SURF.ARCHED, hr(), 1.7);
      b.wall(6.5, 5, 6.5, -20, 1.4, 12, { cellW: 4.2, cellH: 10.6 }); b.wall(-6.5, -20, -6.5, 5, 1.4, 12, { cellW: 4.2, cellH: 10.6 });
      b.wall(6.5, -20, -6.5, -20, 1.4, 12, { cellW: 4.4, cellH: 10.6 });
      b.col(wl, 0.85, 1).surf(SURF.MASONRY, 0, 1); b.wall(-6.5, 5, -5.1, 5, 1.4, 12, { m: 1 }); b.wall(5.1, 5, 6.5, 5, 1.4, 12, { m: 1 });
      b.col(rf, 1, 1).surf(SURF.PLAIN); b.gable(-6.5, -20, 6.5, 5, 12, 9.5, { alongX: false, overhang: 0.6, wallColor: wl });
      for (const [yaw, x, z] of [[0, 0, 14.2], [Math.PI / 2, 5.1, 9.6], [-Math.PI / 2, -5.1, 9.6], [Math.PI, 0, 5]]) {
        winQuad(b, hr, x, 26.4, z, 2.2, 4.6, yaw, SURF.ARCHED, 1.9, wl); winQuad(b, hr, x + Math.cos(yaw) * 2.6, 26.4, z - Math.sin(yaw) * 2.6, 2.2, 4.6, yaw, SURF.ARCHED, 1.9, wl);
        winQuad(b, hr, x - Math.cos(yaw) * 2.6, 26.4, z + Math.sin(yaw) * 2.6, 2.2, 4.6, yaw, SURF.ARCHED, 1.9, wl);
      }
      winQuad(b, hr, 0, 4.2, 14.2, 3, 5, 0, SURF.ARCHED, 1.4, lin('#4a3526'));
      b.col(st, 1, 1.1).surf(SURF.MASONRY, 0, 1); b.box(-5.6, 31, 4.5, 5.6, 32.2, 14.7, { m: 1 });
      b.flood(0.35, 30, 30); b.col(rf, 1.25, 0.8).surf(SURF.PLAIN); b.frustum(0, 9.6, 10, 10, 0, 0, 32.2, 56, { m: 1 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.frustum(sx * 4.9, 9.6 + sz * 4.4, 1.5, 1.5, 0, 0, 32.2, 37.5, { m: 1 });
      {   // the tower dressed: a plinth, string courses that carry snow, pale pilasters at the corners, lit slit windows up the shaft, louvre slats across the
          // belfry openings, lanterns on brackets, and snow lying in tongues on the foot of the spire
        const tR = makeRng(hashSeed(ctx.seed + ':tower')), slat = lin('#2a2220');
        b.flood(0.8, 0, 60); b.col(st, 0.95, 1.1).surf(SURF.MASONRY, 0, 1);
        b.box(-5.5, -9, 4.6, 5.5, 2.4, 14.6, { m: 1 });
        for (const y of [8.6, 15.4, 23.3]) b.box(-5.45, y, 4.65, 5.45, y + 0.5, 14.55, { m: 1, bottom: true });
        b.col(wl, 0.95, 1.05);
        for (const sx of [-1, 1]) for (const z of [5.05, 14.15]) b.cbox(sx * 5.05, 2.4, z, 1.25, 28.6, 1.25, { m: 1 });
        b.flood(0);
        for (const [yaw, x, z] of [[0, 0, 14.2], [Math.PI / 2, 5.1, 9.6], [-Math.PI / 2, -5.1, 9.6]]) {
          for (const y of [5.6, 12.2]) winQuad(b, tR, x, y, z, 1.1, 2.6, yaw, SURF.ARCHED, 2.3, wl);
          const cx = Math.cos(yaw), sn = Math.sin(yaw);
          b.col(slat, 1, 1).surf(SURF.PLAIN);
          for (const o of [-2.6, 0, 2.6]) for (let k = 0; k < 5; k++) {
            const px = x + cx * o + sn * 0.12, pz = z - sn * o + cx * 0.12, y = 24.6 + k * 0.82;
            b.cbox(px, y, pz, Math.abs(cx) * 2.1 + Math.abs(sn) * 0.2, 0.13, Math.abs(sn) * 2.1 + Math.abs(cx) * 0.2);
          }
          b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(x + sn * 0.45, 8.9, z + cx * 0.45, 0.36, 0.52, 0.36);
          const wx = churchX - (z + cx * 0.5), wz = churchZ + (x + sn * 0.5);      // (church-local to world)
          addGlow(wx, churchY + 9.2, wz, 6.5, '#ffbe70'); snowLamps.push([wx, churchY + 9.2, wz, 0.8]);
          pools.push({ p: [churchX - (z + cx * 0.06), churchY + 8.2, churchZ + (x + sn * 0.06)], u: [-sn * 4.6, 0, cx * 4.6], v: [0, 7.2, 0], c: [amber.r * 0.55, amber.g * 0.5, amber.b * 0.42] });
        }
        b.surf(SURF.PLAIN);
        for (let f = 0; f < 4; f++) {      // snow on the spire's foot
          const ax = [1, 0, -1, 0][f], az = [0, 1, 0, -1][f], P = (sv, t) => { const hw = 5 * (1 - t) + 0.07; return [ax * hw - az * sv * hw, 32.25 + 23.8 * t, 9.6 + az * hw + ax * sv * hw]; };
          for (let k = 0; k < 4; k++) {
            const s0 = -1 + k * 0.5 + 0.08 * tR(), s1 = s0 + 0.34 + 0.2 * tR(), t1 = 0.1 + 0.2 * tR(), sh = 0.9 + 0.1 * tR(), A = P(s0, 0), B = P(s1, 0), C = P((s0 + s1) / 2, t1);
            const nx = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), nz = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
            const sc3 = [snowC[0] * sh, snowC[1] * sh, snowC[2] * sh]; if (nx * ax + nz * az > 0) b.tri(A, B, C, sc3); else b.tri(B, A, C, sc3);
          }
        }
      }
      b.flood(0); b.pop();
      clockFaces.push({ c: [churchX - 14.3, churchY + 19.6, churchZ], r: [0, 0, 3.1], rad: 3.1 }, { c: [churchX - 9.6, churchY + 19.6, churchZ + 5.2], r: [3.1, 0, 0], rad: 3.1 });
      addGlow(churchX - 15.2, churchY + 19.6, churchZ, 9, '#ffbe70'); addGlow(churchX - 9.6, churchY + 19.6, churchZ + 6, 9, '#ffbe70');
      addPool(churchX - 21, churchZ, 12, amber, 0.4);
    }
    await ctx.yield();

    // the market square: the giant lit fir, stalls, string lights
    const firY = land.heightAt(firX, sqZ);
    const wnd = flora.makeWind({ direction: [wind[0], wind[1]], strength: look === 'frost' ? 0.2 : lerp(0.5, 1.1, clamp((snowfall - 0.7) / 0.8, 0, 1)) + 0.9 * blow, speed: 0.8 + 0.6 * blow });
    const treeMatO = { wind: wnd, backlight: 0, ambient: 1.7, leafAmbient: 1.8, sheen: 0.15 };
    await flora.prepareLeafTexture(treeMatO, ctx.yield, 2);      // the leaf atlas, drawn in short steps
    const treeMat = flora.windMaterial(treeMatO);
    await ctx.yield();
    // no tree may carry anything darker than a blue-grey shadow: the dark core tube and bark between the snow tiers used to read as black blocks
    const shadowC = lin('#33485c').map((v) => v * 1.3);
    const liftDarks = (g) => {
      const c = g.attributes.color, a = c.array;
      for (let i = 0; i < a.length; i += 3) if (Math.max(a[i], a[i + 1], a[i + 2]) < 0.1) { const k = 0.9 + 0.2 * ((i * 0.6180339) % 1); a[i] = shadowC[0] * k; a[i + 1] = shadowC[1] * k; a[i + 2] = shadowC[2] * k; }
      return g;
    };
    flora.coniferGeometry({ rng: makeRng(hashSeed('warm')), detail: 0 }).dispose();      // a throwaway sapling: the first call into the kit's conifer code is the slow one
    await ctx.yield();
    flora.coniferGeometry({ rng: makeRng(hashSeed('warm2')), detail: 1 }).dispose();
    await ctx.yield();
    const firG = flora.coniferGeometry({ rng: rng.fork('fir'), height: firH, detail: 2, snow: 0.55, flex: 0.2, leaf: '#28583a' });
    await ctx.yield();
    liftDarks(firG);
    const fir = new THREE.Mesh(firG, treeMat); fir.position.set(firX, firY - 0.2, sqZ); scene.add(fir);
    await ctx.yield();
    const firR = firG.userData.radius || firH * 0.2;
    const lightCols = festive ? ['#ffd9a0', '#ff6a50', '#ffe08a', '#8fd0ff', '#ffb060'] : ['#ffd9a0', '#ffc880', '#ffe6b8'];
    {
      const pts = [], turns = 8, N = 120;
      for (let i = 0; i <= N; i++) { const t = i / N, a = t * turns * TAU, r = firR * (1 - t) * 0.86 + 0.3; pts.push([firX + Math.cos(a) * r, firY + firH * (0.16 + 0.8 * t), sqZ + Math.sin(a) * r]); }
      gChain(pts, { sag: 0.03, swing: 0.3, spacing: 0.85, size: storm ? 0.7 : 1.05, twinkle: 1, gain: 1.25, wire: false, near: 0.5, rng: rng.fork('fir-lights') });       // (the fir's lights draw from the fir's own stream, as ever)
      addGlow(firX, firY + firH + 0.6, sqZ, storm ? 7 : 11, storm ? '#bfa878' : '#fff0c0'); addGlow(firX, firY + firH * 0.45, sqZ, firH * 0.95, storm ? '#2e1c0c' : '#7a4a20');
      addPool(firX, sqZ, 26, amber, 0.42); addPool(firX - 6, sqZ + 2, 10, amber, 0.4);
    }
    await ctx.yield();
    const stalls = [], stallYaw = [], poles = [], nSt = rng.int(8, 11), a0 = rng() * TAU;
    for (let i = 0; i < nSt; i++) {
      const a = a0 + i * TAU / nSt, r = 12.5 + (i % 2) * 2.5, x = firX + Math.cos(a) * r, z = sqZ + Math.sin(a) * r;
      if (path.nearestXZ(x, z).dist < 11) continue;
      stalls.push([x, groundAt(x, z), z]); stallYaw.push(Math.atan2(firX - x, sqZ - z));
      addPool(x + (firX - x) * 0.18, z + (sqZ - z) * 0.18, 5, amber, 0.55);
    }
    const mkR = rng.fork('market'), mkH = Math.ceil(stalls.length / 2);      // the stalls in two batches
    if (mkH) scene.add(S.makeMarket({ rng: mkR, mats, positions: stalls.slice(0, mkH), yaws: stallYaw.slice(0, mkH) }).object);
    await ctx.yield();
    if (stalls.length > mkH) scene.add(S.makeMarket({ rng: mkR.fork('b'), mats, positions: stalls.slice(mkH), yaws: stallYaw.slice(mkH) }).object);
    await ctx.yield();
    const strings = [];
    for (let i = 0; i < 8; i++) {
      const a = a0 + 0.3 + i * TAU / 8, x = firX + Math.cos(a) * 19.5, z = sqZ + Math.sin(a) * 19.5;
      const y = groundAt(x, z); if (path.distanceTo(x, y + 7.6, z) < 8) continue;
      poles.push([x, y + 7.6, z]);
      TB.col(lin('#3a2a20'), 1, 1).surf(SURF.PLAIN); TB.cbox(x, y - 0.5, z, 0.28, 8.2, 0.28);
      strings.push([[0, firH * 0.55 - 8, 0], [x - firX, y + 7.6 - firY - 8, z - sqZ]]);
    }
    for (let i = 0; i < poles.length; i++) { const p = poles[i], q = poles[(i + 1) % poles.length]; if (Math.hypot(p[0] - q[0], p[2] - q[2]) < 19) strings.push([[p[0] - firX, p[1] - firY - 8, p[2] - sqZ], [q[0] - firX, q[1] - firY - 8, q[2] - sqZ]]); }
    await ctx.yield();
    { const gaR = rng.fork('garlands');       // (the square's garlands draw from their own stream, as ever)
      for (const [p, q] of strings) gSpan([p[0] + firX, p[1] + firY + 8, p[2] + sqZ], [q[0] + firX, q[1] + firY + 8, q[2] + sqZ], { sag: 0.1, swing: 0.16, spacing: 1.15, size: 0.5, twinkle: 0.8, shuffle: false, rng: gaR }); }
    await ctx.yield();
    // the hamlet street: garlands from eave to eave, three stalls, a small lit fir at its head
    const hFirX = -39, hFirZ = -147;
    {
      const hmR = rng.fork('hamlet');
      // garlands from eave to eave all the way down the street (they zigzag), a swag of bulbs under the eaves of every house, and the pond's chain from pole to pole
      for (let z = -86, k = 0; z >= -134; z -= 6, k++) {
        const g = groundAt(-30, z), dz = k % 2 ? 2.6 : -2.6;
        if (path.distanceTo(-30, g + 5.2, z) > 3.4) gSpan([-38.2, g + 6.4, z - dz], [-21.8, g + 6.4, z + dz], { sag: 0.1, swing: 0.2, spacing: 0.95, size: 0.5, twinkle: 0.9 });
      }
      for (const h of hamletH) if (h.eave) {
        const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), fz = h.d / 2 + 0.5, hx = h.w / 2 + 0.3, y = h.y + h.eave * h.sc - 0.2;
        gSpan([h.x - hx * c + fz * sn, y, h.z + hx * sn + fz * c], [h.x + hx * c + fz * sn, y, h.z - hx * sn + fz * c], { sag: 0.085, swing: 0.12, spacing: 0.8, size: 0.42, twinkle: 0.9 });
      }
      for (const sp of pondSpans) gSpan(sp[0], sp[1], { sag: 0.11, swing: 0.22, spacing: 0.95, size: 0.5, twinkle: 0.9 });
      await ctx.yield();
      const st = [[-35.5, -88, Math.PI / 2], [-24.5, -104, -Math.PI / 2], [-35.5, -112, Math.PI / 2]];
      scene.add(S.makeMarket({ rng: hmR.fork('stalls'), mats, positions: st.map(([x, z]) => [x, groundAt(x, z), z]), yaws: st.map((q) => q[2]) }).object);
      for (const [x, z] of st) addPool(x + (x < -30 ? 2.5 : -2.5), z, 5, amber, 0.55);
      await ctx.yield();
      const hy = groundAt(hFirX, hFirZ), hH = 11.5;
      const hG = liftDarks(flora.coniferGeometry({ rng: hmR.fork('fir'), height: hH, detail: 1, snow: 0.5, flex: 0.2, leaf: '#28583a' }));
      await ctx.yield();
      const hFir = new THREE.Mesh(hG, treeMat); hFir.position.set(hFirX, hy - 0.2, hFirZ); scene.add(hFir);
      const hR = hG.userData.radius || hH * 0.22, pts = [];
      for (let i = 0; i <= 44; i++) { const t = i / 44, a = t * 5 * TAU, r = hR * (1 - t) * 0.86 + 0.25; pts.push([hFirX + Math.cos(a) * r, hy + hH * (0.16 + 0.8 * t), hFirZ + Math.sin(a) * r]); }
      gChain(pts, { sag: 0.03, swing: 0.3, spacing: 0.7, size: 0.72, twinkle: 1, gain: 1.2, wire: false });
      addGlow(hFirX, hy + hH + 0.4, hFirZ, 7, '#fff0c0'); addGlow(hFirX, hy + hH * 0.45, hFirZ, hH * 0.9, '#7a4a20'); addPool(hFirX, hFirZ, 12, amber, 0.5);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the castle on its crag, the gatehouse and the causeway
    const CB = new S.Builder(40000), cr = rng.fork('castle'), mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k], MM = 1.15;   // MM: masonry courses per metre of uv
    const Qm = (b, p0, p1, p2, p3, want, uv) => Q(b, p0, p1, p2, p3, want, uv && uv.map((v) => v * MM));
    const flames = []; let tallX = 24, gateGarland = null;
    const FL = (y) => 0.1 + 1.26 * Math.exp(-Math.max(y, 0) / 18);
    const tier = (ya, yb, k = 1) => { const r = clamp(FL(yb) / FL(ya), 0.34, 0.995); CB.flood(FL(ya) * k, ya, -(yb - ya) / Math.log((r - 0.3) / 0.7)); };
    const stoneC = lin(cr.pick(['#8e8c98', '#98938f', '#868692'])), roofC = lin(cr.pick(['#2f4470', '#6a2a2c', '#34405c'])), flags = [];
    const bc1 = lin(bannerC[0]).map((v) => v * 1.9), bc2 = lin(bannerC[1]).map((v) => v * 0.6);
    const wl = Math.hypot(wind[0], wind[1]), wdx = wind[0] / wl, wdz = wind[1] / wl;
    const CX = 0, CY = 55, CZ = -250;
    const tower = (x, z, r, h, o = {}) => {
      const y0 = o.y0 ?? -10, seg = o.seg ?? 12, R = r * 1.16, H = h - y0;
      const fk = o.flood ?? 1, ym = Math.max(y0, 0) + 13, hm = ym - y0;
      CB.surf(SURF.MASONRY, 0, 1.2);
      if (hm < H * 0.7) {
        tier(Math.max(y0, 0), ym, fk); CB.col(stoneC, 0.84, 0.74); CB.lathe(x, y0, z, [[r * (o.turret ? 0.55 : 1.1), 0], [r, hm * 0.4], [r, hm]], seg, { m: MM });
        tier(ym, h, fk); CB.col(stoneC, 0.74, 0.58); CB.lathe(x, ym, z, [[r, 0], [r, (H - hm) * 0.35], [r, H * 0.88 - hm], [R, H * 0.915 - hm], [R, H - hm]], seg, { m: MM });
      } else { tier(Math.max(y0, 0), h, fk); CB.col(stoneC, 0.8, 0.6); CB.lathe(x, y0, z, [[r * (o.turret ? 0.55 : 1.1), 0], [r, H * 0.1], [r, H * 0.5], [r, H * 0.88], [R, H * 0.915], [R, H]], seg, { m: MM }); }
      CB.col(mul(stoneC, 0.5)).surf(SURF.PLAIN); CB.disc(x, h - 0.3, z, R, seg);
      CB.col(stoneC, 0.62, 0.74).surf(SURF.MASONRY, 0, 1.2);
      const nm = Math.max(8, Math.round(TAU * R / 2.4) & ~1);
      for (let i = 0; i < nm; i += 2) { const a = TAU * (i + 0.5) / nm; CB.tr(x + (R - 0.3) * Math.cos(a), h, z + (R - 0.3) * Math.sin(a), Math.PI / 2 - a); CB.cbox(0, 0, 0, TAU * R / nm, 1.3, 0.6, { m: MM }); CB.pop(); }
      if (o.roof !== false) {
        const rh = R * (o.steep ?? cr.range(2.1, 2.8)), top = h + 0.2 + rh;
        CB.col(roofC, 0.75, 1.15).surf(SURF.TILES); CB.lathe(x, h + 0.2, z, [[R * 0.92, 0], [R * 0.42, rh * 0.55], [0, rh]], seg, { m: MM, smooth: false });
        CB.col(lin('#2a2420')).surf(SURF.PLAIN); CB.beam([x, top - 0.5, z], [x, top + 4.4, z], 0.14, 0.14);
        const L = 4.4 + r * 0.75;
        flags.push({ o: [CX + x, CY + top + 3.4, CZ + z], a: [wdx * L, 0, wdz * L], b: [0, -L * 0.42, 0], n: [-wdz, 0, wdx], k: 7, w: 6.5, amp: 0.62, ph: cr() * 6, taper: 0.75, c: bc1, c2: bc2 });
      }
      const rings = Math.max(1, Math.round(H / 12));
      for (let k = 0; k < rings; k++) {
        const y = y0 + H * (0.3 + 0.55 * (k + 0.5) / rings);
        for (let i = 0; i < 3; i++) { if (cr.chance(0.1)) continue; const a = Math.PI / 2 + (i - 1) * 0.95 + cr.range(-0.2, 0.2); winQuad(CB, cr, x + r * 1.02 * Math.cos(a), y, z + r * 1.02 * Math.sin(a), 1.05, 2.5, Math.PI / 2 - a, SURF.ARCHED, 2.7, mul(stoneC, 0.8)); }
      }
    };
    CB.tr(CX, CY, CZ, 0);
    {
      const GW = 11.5, GD = 13, GH = 28, AR = 8, SP = 10, NA = 14, b = CB, GK = 2.3;
      b.col(stoneC, 0.8, 0.66).surf(SURF.MASONRY, 0, 0.8);
      for (const sx of [-1, 1]) {
        tier(0, SP, GK); Qm(b, [sx * GW, -10, 0], [sx * AR, -10, 0], [sx * AR, SP, 0], [sx * GW, SP, 0], [0, 0, 1], [0, -10, GW - AR, SP]);
        tier(SP, GH, GK); Qm(b, [sx * GW, SP, 0], [sx * AR, SP, 0], [sx * AR, GH, 0], [sx * GW, GH, 0], [0, 0, 1], [0, SP, GW - AR, GH]);
        tier(0, SP, GK); Qm(b, [sx * AR, 1, 0], [sx * AR, 1, -2.4], [sx * AR, SP, -2.4], [sx * AR, SP, 0], [-sx, 0, 0], [0, 1, 2.4, SP]);
      }
      for (let i = 0; i < NA; i++) {
        const a0 = Math.PI * i / NA, a1 = Math.PI * (i + 1) / NA, x0 = AR * Math.cos(a0), y0 = SP + AR * Math.sin(a0), x1 = AR * Math.cos(a1), y1 = SP + AR * Math.sin(a1);
        tier(SP, GH, GK); b.col(stoneC, 0.78, 0.5); Qm(b, [x0, y0, 0], [x1, y1, 0], [x1, GH, 0], [x0, GH, 0], [0, 0, 1], [x0, y0, x1, GH]);
        {   // the archivolt: a ring of voussoirs standing proud of the wall
          const k = 1 + 1.25 / AR, vs = i % 2 ? 0.95 : 0.74, zf = 0.42;
          b.col(mul(stoneC, vs), 1, 0.8); Qm(b, [x0, y0, zf], [x1, y1, zf], [x1 * k, SP + (y1 - SP) * k, zf], [x0 * k, SP + (y0 - SP) * k, zf], [0, 0, 1], [i, 0, i + 1, 1.25]);
          b.col(mul(stoneC, 0.6), 1, 1); Qm(b, [x0 * k, SP + (y0 - SP) * k, 0], [x1 * k, SP + (y1 - SP) * k, 0], [x1 * k, SP + (y1 - SP) * k, zf], [x0 * k, SP + (y0 - SP) * k, zf], [x0 + x1, y0 + y1 - 2 * SP, 0], [i, 0, i + 1, zf]);
          Qm(b, [x0, y0, 0], [x1, y1, 0], [x1, y1, zf], [x0, y0, zf], [-(x0 + x1), 2 * SP - y0 - y1, 0], [i, 0, i + 1, zf]);
        }
        b.col(mul(stoneC, 0.8), 1, 0.6); Qm(b, [x0, y0, 0], [x1, y1, 0], [x1, y1, -2.4], [x0, y0, -2.4], [-(x0 + x1), SP - (y0 + y1) / 2, 0], [i, 0, i + 1, 2.4]);
      }
      await ctx.yield();
      b.flood(0); b.col([0.012, 0.012, 0.02], 1, 1).surf(SURF.PLAIN); Q(b, [-AR, 1, -2.4], [AR, 1, -2.4], [AR, SP + AR, -2.4], [-AR, SP + AR, -2.4], [0, 0, 1]);
      b.col(stoneC, 0.75, 1).surf(SURF.MASONRY, 0, 0.8); b.box(-AR, -10, -2.4, AR, 1, 0.02, { m: MM });
      tier(0, GH, 0.8); b.col(stoneC, 0.8, 0.62);
      b.wall(GW, 0, GW, -GD, -10, GH, { m: MM }); b.wall(-GW, -GD, -GW, 0, -10, GH, { m: MM }); b.wall(GW, -GD, -GW, -GD, -10, GH, { m: MM });
      Q(b, [-GW, GH, 0], [GW, GH, 0], [GW, GH, -GD], [-GW, GH, -GD], [0, 1, 0]);
      b.box(-GW - 0.5, GH - 2.6, -0.2, GW + 0.5, GH - 1.6, 0.5, { m: MM, bottom: true });
      b.col(stoneC, 0.5, 0.62); for (let x = -GW + 0.6; x < GW; x += 1.55) b.cbox(x, GH - 3.6, 0.28, 0.7, 1.0, 0.56, { m: MM });       // machicolation corbels
      tier(SP, GH, GK); b.col(stoneC, 0.7, 0.7); b.box(-GW - 0.2, 19.7, 0, GW + 0.2, 20.2, 0.5, { m: MM, bottom: true });           // string course over the arch
      for (const sx of [-1, 1]) {      // jambs under the archivolt, a lantern on each, the keystone, and the raised portcullis showing its teeth
        tier(0, SP, GK); b.col(stoneC, 0.86, 0.74).surf(SURF.MASONRY, 0, 0.8); b.box(Math.min(sx * AR, sx * (AR + 1.25)), -1, 0, Math.max(sx * AR, sx * (AR + 1.25)), SP, 0.42, { m: MM });
        b.box(Math.min(sx * (AR - 0.1), sx * (AR + 1.4)), SP - 0.5, 0, Math.max(sx * (AR - 0.1), sx * (AR + 1.4)), SP, 0.6, { m: MM, bottom: true });
        b.flood(0); b.col(lin('#1c1a1c'), 1, 1).surf(SURF.PLAIN); b.cbox(sx * (AR + 0.62), 6.2, 0.75, 0.16, 0.16, 0.7); b.cbox(sx * (AR + 0.62), 5.0, 1.05, 0.62, 0.12, 0.62); b.cbox(sx * (AR + 0.62), 6.0, 1.05, 0.74, 0.14, 0.74);
        b.col([1, 0.7, 0.36], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(sx * (AR + 0.62), 5.12, 1.05, 0.46, 0.88, 0.46);
        addGlow(CX + sx * (AR + 0.62), CY + 5.6, CZ + 1.3, 7.5, '#ffb866');
      }
      for (const sx of [-1, 1]) {      // stepped corner buttresses, a fire basket on each shoulder
        const xb = sx * (GW + 0.2);
        tier(0, SP, GK); b.col(stoneC, 0.86, 0.72).surf(SURF.MASONRY, 0, 0.8); b.box(xb - 1.4, -10, 0, xb + 1.4, 12.5, 1.9, { m: MM });
        tier(SP, GH, GK); b.col(stoneC, 0.8, 0.66); b.box(xb - 1.1, 12.5, 0, xb + 1.1, 18.6, 1.2, { m: MM }); b.box(xb - 0.8, 18.6, 0, xb + 0.8, 24.2, 0.7, { m: MM });
        b.flood(0); b.col(lin('#1c1a1c'), 1, 1).surf(SURF.PLAIN); b.lathe(xb, 12.5, 1.4, [[0.14, 0], [0.3, 0.2], [0.62, 0.8], [0.56, 0.84]], 6);
        b.col([1, 0.45, 0.12], 1, 1).surf(SURF.GLOW, 0, 1.3); b.lathe(xb, 13.25, 1.4, [[0.5, 0], [0.3, 0.36], [0, 1.05]], 5);
        flames.push([CX + xb, CY + 13.9, CZ + 1.4]);
        pools.push({ p: [CX + xb, CY + 15.5, CZ + (sx > 0 ? 0.72 : 0.73)], u: [4.2, 0, 0], v: [0, 5.2, 0], c: [amber.r * 0.8, amber.g * 0.62, amber.b * 0.45], f: true });      // their light on the wall above
      }
      {
        const pts = [], RG = AR + 1.75;
        for (let i = 0; i <= 26; i++) { const a = Math.PI * i / 26; pts.push([CX + RG * Math.cos(a), CY + SP + RG * Math.sin(a), CZ + 0.95]); }
        gateGarland = [[CX + RG, CY + 3.2, CZ + 0.95], ...pts, [CX - RG, CY + 3.2, CZ + 0.95]];
      }
      tier(SP, GH, GK); b.col(stoneC, 1.0, 0.9).surf(SURF.MASONRY, 0, 0.8); b.box(-0.9, SP + AR - 0.2, 0, 0.9, SP + AR + 2.0, 0.62, { m: MM, bottom: true });
      b.flood(0); b.col(lin('#16161c'), 1, 1).surf(SURF.PLAIN);
      for (let x = -7.6; x <= 7.61; x += 0.76) {
        const yt = SP + Math.sqrt(Math.max(AR * AR - x * x, 0)), yb = Math.abs(x) < 7.05 ? SP + Math.sqrt(7.12 * 7.12 - x * x) : 1;
        if (yt - yb > 0.25) { b.beam([x, yt, 0.2], [x, yb + 0.3, 0.2], 0.13, 0.13); b.beam([x, yb + 0.3, 0.2], [x, yb, 0.2], 0.03, 0.13); }
      }
      for (let x = -GW; x < GW - 1; x += 2.56) b.cbox(x + 0.9, GH, -0.4, 1.5, 1.4, 1, { m: MM });
      for (const x of [-6.3, -2.1, 2.1, 6.3]) winQuad(b, cr, x, 22.6, 0, 1.6, 3, 0, SURF.ARCHED, 2.9, mul(stoneC, 0.8));
      const gt = cr.range(35, 40);
      tower(-GW - 4.6, -5, 5.7, gt, { flood: 1.5 }); tower(GW + 4.6, -5, 5.7, gt, { flood: 1.5 });
      await ctx.yield();
      for (const sx of [-1, 1]) {
        flags.push({ o: [CX + sx * 9.75, CY + 25.6, CZ + 0.62], a: [0, -12.5, 0], b: [3.5, 0, 0], n: [0, 0, 1], k: 4.2, w: 2.3, amp: 0.48, ph: cr() * 6, taper: 0, band: true, c: bc1, c2: bc2 });
        // a brazier on a stone pedestal either side of the gate
        b.flood(1.2, 0, 6); b.col(stoneC, 0.7, 0.9).surf(SURF.MASONRY, 0, 1.2); b.cbox(sx * 10.6, -3, 3.6, 1.5, 4.6, 1.5, { m: MM });
        b.flood(0); b.col(lin('#1c1a1c'), 1, 1).surf(SURF.PLAIN); b.lathe(sx * 10.6, 1.6, 3.6, [[0.25, 0], [0.5, 0.25], [1.05, 0.95], [0.95, 1.0]], 8);
        b.col([1, 0.42, 0.1], 1, 1).surf(SURF.GLOW, 0, 1.3); b.lathe(sx * 10.6, 2.45, 3.6, [[0.85, 0], [0.5, 0.5], [0, 1.5]], 6);
        flames.push([CX + sx * 10.6, CY + 3.4, CZ + 3.6]); smokers.push([CX + sx * 10.6, CY + 3.6, CZ + 3.6, 1.1]);
        pools.push({ p: [CX + sx * 10.6, CY + 0.5, CZ + 5], u: [9, 0, 0], v: [0, 0, 9], c: [amber.r * 0.9, amber.g * 0.75, amber.b * 0.6], f: true });
        b.flood(1.0, 1, 11); b.col(stoneC, 0.8, 0.62).surf(SURF.MASONRY, 0, 1.2);
        // curtain walls, corner towers
        b.flood(1.05, 0, 7.5); b.col(stoneC, 0.8, 0.6).surf(SURF.MASONRY, 0, 1.2);
        const xa = sx * (GW + 9), xb = sx * 55;
        for (const [t, ph] of [[0.14, 1.1], [0.49, 2.9], [0.86, 4.3]]) flags.push({ o: [CX + lerp(xa, xb, t), CY + 10.4, CZ - 4.85], a: [0, -8.2, 0], b: [3, 0, 0], n: [0, 0, 1], k: 4.2, w: 2.3, amp: 0.55, ph: ph + sx, taper: 0, band: true, c: bc1, c2: bc2 });      // long banners hung from the string course
        for (const t of [0.14, 0.49, 0.86]) pools.push({ p: [CX + lerp(xa, xb, t), CY + 6.6, CZ - 5.42], u: [5, 0, 0], v: [0, 6.4, 0], c: [amber.r * 0.4, amber.g * 0.36, amber.b * 0.3] });
        b.box(Math.min(xa, xb), -12, -8.5, Math.max(xa, xb), 15, -5.5, { m: MM });
        const wx0 = Math.min(xa, xb), wx1 = Math.max(xa, xb);
        b.col(stoneC, 0.7, 0.66); b.box(wx0, 10.6, -5.5, wx1, 11.1, -5.05, { m: MM, bottom: true });                          // string course
        b.col(stoneC, 0.5, 0.6); for (let x = wx0 + 0.9; x < wx1 - 0.5; x += 1.7) b.cbox(x, 13.7, -5.25, 0.75, 1.3, 0.5, { m: MM });     // corbel table under the crenels
        for (const t of [0.3, 0.68]) {                                                                                       // stepped buttresses
          const x = lerp(wx0, wx1, t);
          b.flood(1.1, 0, 7); b.col(mul(stoneC, 0.7), 0.84, 0.6).surf(SURF.MASONRY, 0, 1.2); b.box(x - 1.5, -12, -5.5, x + 1.5, 6.5, -3.4, { m: MM }); b.box(x - 1.15, 6.5, -5.5, x + 1.15, 12.6, -4.3, { m: MM });
          b.flood(0); b.col(lin('#1c1a1c'), 1, 1).surf(SURF.PLAIN); b.cbox(x, 7.3, -3.9, 0.14, 0.14, 0.9); b.lathe(x, 7.35, -3.3, [[0.12, 0], [0.3, 0.16], [0.52, 0.6], [0.46, 0.64]], 6);
          b.col([1, 0.45, 0.12], 1, 1).surf(SURF.GLOW, 0, 1.3); b.lathe(x, 7.9, -3.3, [[0.42, 0], [0.26, 0.3], [0, 0.85]], 5);
          flames.push([CX + x, CY + 8.4, CZ - 3.3]);
          pools.push({ p: [CX + x, CY + 0.45, CZ - 0.6], u: [6.5, 0, 0], v: [0, 0, 5.5], c: [amber.r * 0.7, amber.g * 0.55, amber.b * 0.42], f: true });
        }
        b.flood(0.85, 0, 6); b.col(stoneC, 0.8, 0.6).surf(SURF.MASONRY, 0, 1.2);
        for (let x = wx0 + 3.4; x < wx1 - 2; x += 5.9) if (Math.abs((x - wx0) / (wx1 - wx0) - 0.3) > 0.06 && Math.abs((x - wx0) / (wx1 - wx0) - 0.68) > 0.06) winQuad(b, cr, x, 6.6, -5.5, 0.55, 2.4, 0, SURF.SLIT, 2.6, mul(stoneC, 0.8));
        b.col(stoneC, 0.8, 0.6).surf(SURF.MASONRY, 0, 0.8);
        for (let x = Math.min(xa, xb) + 0.6; x < Math.max(xa, xb) - 1; x += 2.6) b.cbox(x + 0.6, 15, -5.9, 1.4, 1.3, 0.8, { m: MM });
        b.flood(0); b.surf(SURF.PLAIN);      // snow drifted against the wall's foot
        for (let x = wx0, k = 0; x < wx1 - 0.5; x += 4.3, k++) {
          const x1 = Math.min(x + 4.3, wx1), h0 = 1.5 + 0.9 * Math.sin(x * 0.37 + sx), h1 = 1.5 + 0.9 * Math.sin((x + 4.3) * 0.37 + sx), sh = 0.92 + 0.08 * ((k * 0.618) % 1);
          b.col(snowC, sh, sh); Q(b, [x, h0, -5.45], [x1, h1, -5.45], [x1, -1, -5.5 + 2.6 + h1 * 0.7], [x, -1, -5.5 + 2.6 + h0 * 0.7], [0, 1, 0.5]);
        }
        b.flood(0.85, 0, 6); b.col(stoneC, 0.8, 0.6).surf(SURF.MASONRY, 0, 0.8);
        b.box(sx * 55 - 1.5, -14, -90, sx * 55 + 1.5, 13, -8, { m: MM });
        tower(sx * 56, -8, 5.3, cr.range(24, 31), { y0: -16 }); tower(sx * 56, -90, 5, cr.range(26, 36), { y0: -18 });
      }
      b.flood(0.6, 0, 8); b.col(stoneC, 0.75, 0.6).surf(SURF.MASONRY, 0, 1.2); b.box(-55, -16, -91.5, 55, 12, -88.5, { m: MM });
      await ctx.yield();
      // the keep
      const KH = cr.range(54, 62), kz = -54;
      b.surf(SURF.MASONRY, 0, 1.2);
      tier(0, 13); b.col(stoneC, 0.84, 0.74).box(-12, -10, kz - 12, 12, 13, kz + 12, { m: MM, top: false }); tier(13, 30); b.col(stoneC, 0.74, 0.64).box(-12, 13, kz - 12, 12, 30, kz + 12, { m: MM, top: false });
      tier(30, KH); b.col(stoneC, 0.64, 0.52).box(-12, 30, kz - 12, 12, KH, kz + 12, { m: MM }); b.col(stoneC, 0.56, 0.7);
      b.box(-13, KH, kz - 13, 13, KH + 2, kz + 13, { m: MM, bottom: true });
      for (let x = -13; x < 12; x += 2.9) for (const sz of [-1, 1]) { b.cbox(x + 1, KH + 2, kz + sz * 12.5, 1.6, 1.4, 0.9, { m: MM }); b.cbox(sz * 12.5, KH + 2, kz + x + 1, 0.9, 1.4, 1.6, { m: MM }); }
      for (let k = 0; k < 6; k++) {
        const y = 12 + k * (KH - 19) / 5;
        for (const x of [-8.4, -5, -1.7, 1.7, 5, 8.4]) { if (cr.chance(0.14)) continue; winQuad(b, cr, x, y, kz + 12, 1.5, 3.1, 0, SURF.ARCHED, 2.9, mul(stoneC, 0.8)); }
        for (const z of [-7.5, -2.5, 2.5, 7.5]) for (const sx of [-1, 1]) if (cr.chance(0.8)) winQuad(b, cr, sx * 12, y, kz + z, 1.5, 3.1, sx * Math.PI / 2, SURF.ARCHED, 2.6, mul(stoneC, 0.8));
      }
      for (const sx of [-1, 1]) {   // keep chimneys
        b.flood(0.3, 0, 30); b.col(stoneC, 0.6, 0.7).surf(SURF.MASONRY, 0, 1.2); b.cbox(sx * 6.5, KH + 2, kz - 3 * sx, 1.7, 12, 1.7, { m: MM });
        smokers.push([CX + sx * 6.5, CY + KH + 14.4, CZ + kz - 3 * sx, 2.5]);
      }
      b.col(roofC, 0.75, 1.15).surf(SURF.TILES); b.hip(-10.5, kz - 10.5, 10.5, kz + 10.5, KH + 2, cr.range(13, 18), { overhang: 0, ridge: 0.25 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) tower(sx * 12, kz + sz * 12, 2.7, KH + cr.range(7, 12), { y0: KH - 16, turret: true, steep: 3, seg: 8, flood: 0.5 });
      for (const sx of [-1, 1]) flags.push({ o: [CX + sx * 5.2, CY + KH - 5, CZ + kz + 12.7], a: [0, -17, 0], b: [3.8, 0, 0], n: [0, 0, 1], k: 4.6, w: 2, amp: 0.48, ph: cr() * 6, taper: 0, band: true, c: bc1, c2: bc2 });
      await ctx.yield();
      // halls and the tall towers
      const hall = (x0, z0, x1, z1, h, rise) => {
        tier(0, h, 0.9); b.col(stoneC, 0.82, 0.62).surf(SURF.MASONRY, 0, 1.2); b.box(x0, -10, z0, x1, h, z1, { m: MM, top: false });
        for (const t of [0.25, 0.75]) { const cx = lerp(x0, x1, t), zm = (z0 + z1) / 2; b.cbox(cx, h, zm, 1.5, rise + 2.6, 1.5, { m: MM }); smokers.push([CX + cx, CY + h + rise + 2.9, CZ + zm, cr.range(1.8, 2.4)]); }
        b.col(mul(stoneC, 1.05), 0.9, 1).surf(SURF.ARCHED, cr(), 2.9); b.wall(x0 + 1.5, z1 + 0.08, x1 - 1.5, z1 + 0.08, h * 0.3, h * 0.86, { cellW: 3.6, cellH: h * 0.56 });
        b.col(roofC, 0.75, 1.1); b.gable(x0, z0, x1, z1, h, rise, { alongX: true, overhang: 0.5, wallColor: stoneC, wallStyle: SURF.MASONRY });
      };
      hall(-42, -40, -14, -22, cr.range(17, 22), 10); hall(14, -37, 41, -21, cr.range(13, 18), 8.5);
      addGlow(CX, CY + 22, CZ - 30, 70, '#5a3418');
      const side = cr.sign();
      tallX = side * cr.range(22, 27);
      tower(tallX, -58, 6.3, cr.range(78, 90), { steep: 2.7, seg: 14, fall: 20 });
      tower(-side * cr.range(24, 30), -64, 5.3, cr.range(58, 70), { steep: 2.5 });
      if (cr.chance(0.7)) tower(side * 7, -76, 3.8, cr.range(66, 76), { steep: 3.1, seg: 10 });
      tower(-side * 43, -52, 4.4, cr.range(36, 46), { steep: 2.4, seg: 10 });
      b.flood(0);
    }
    CB.pop();
    await ctx.yield();
    // the causeway: a stone ramp with parapets and lamp piers, a stepped, splayed foot, and a trodden, drifted deck
    const cwSpans = [[], []]; let buildDeck;
    const CW = new S.Builder(16000), cr8 = makeRng(hashSeed(ctx.seed + ':wall'));       // the causeway is a mesh of its own, so no single step turns the whole castle into a geometry
    {
      const b = CW, NS = 25, z0c = -44, z1c = -250, yF = yC(z0c);
      b.flood(0.3, 0, 400);
      for (let i = 0; i < NS; i++) {
        const za = lerp(z0c, z1c, i / NS), zb = lerp(z0c, z1c, (i + 1) / NS), ya = yC(za), yb = yC(zb);
        b.col(stoneC, 0.55, 0.95).surf(SURF.MASONRY, 0, 1.2);
        for (const sx of [-1, 1]) {
          const w0 = b.nv;
          Qm(b, [sx * 6, ya - 17, za], [sx * 6, yb - 17, zb], [sx * 6, yb - 5.5, zb], [sx * 6, ya - 5.5, za], [sx, 0, 0], [-za, ya - 17, -zb, ya - 5.5]);
          Qm(b, [sx * 6, ya - 5.5, za], [sx * 6, yb - 5.5, zb], [sx * 6, yb + 1.1, zb], [sx * 6, ya + 1.1, za], [sx, 0, 0], [-za, ya - 5.5, -zb, ya + 1.1]);
          if (i % 2 === 1 && i < NS - 1) { const zm = (za + zb) / 2, ym = yC(zm); b.box(Math.min(sx * 6, sx * 6.65), ym - 17, zm - 0.75, Math.max(sx * 6, sx * 6.65), ym + 1.3, zm + 0.75, { m: MM }); }
          if (b.P && b.W) for (let v = w0; v < b.nv; v++) { const d = yC(b.P[v * 3 + 2]) + 1.1 - b.P[v * 3 + 1]; b.W[v * 3 + 1] = d < 0.6 ? 0.8 : d < 2.6 ? 0.6 : d < 9 ? 0.36 : 0.16; }      // lamp light falling down the wall: enough of it that the courses show under an ember sky too
          b.beam([sx * 6.12, ya - 0.2, za], [sx * 6.12, yb - 0.2, zb], 0.34, 0.22);                                   // a string course under the parapet: snow lies along it
          if (i % 2 === 1 && i < NS - 1) {      // a lantern niche in every buttress, its light on the wall and down the bank
            const zm = (za + zb) / 2, ym = yC(zm), r = 4.6;
            winQuad(b, cr8, sx * 6.66, ym + 0.2, zm, 0.8, 1.05, sx * Math.PI / 2, SURF.ARCHED, 2.7, mul(stoneC, 0.9)); b.col(stoneC, 0.55, 0.95).surf(SURF.MASONRY, 0, 1.2);
            addGlow(sx * 6.9, ym + 0.2, zm, 4.2, '#ffb866'); snowLamps.push([sx * 7.3, ym + 0.6, zm, 0.7]);
            pools.push({ p: [sx * 9.3, ym - 1.1 - 2.7 * 1.7 + 0.3, zm], u: [-sx * r * 0.507, r * 0.862, 0], v: [0, -0.215 * r, 0.977 * r], c: [amber.r * 0.8, amber.g * 0.8, amber.b * 0.8] });
          }
          Qm(b, [sx * 5.2, ya, za], [sx * 5.2, yb, zb], [sx * 5.2, yb + 1.1, zb], [sx * 5.2, ya + 1.1, za], [-sx, 0, 0], [-za, ya, -zb, ya + 1.1]);
          Q(b, [sx * 5.2, ya + 1.1, za], [sx * 6, ya + 1.1, za], [sx * 6, yb + 1.1, zb], [sx * 5.2, yb + 1.1, zb], [0, 1, 0]);
          if (i % 2 === 0 && i < NS - 1) {
            const zm = (za + zb) / 2, ym = yC(zm);
            b.cbox(sx * 5.6, ym + 0.4, zm, 1.15, 1.5, 1.15, { m: MM });
            const out = zm < -188, lx = sx * (out ? 7.9 : 5.6);
            if (out) { b.box(Math.min(sx * 6, sx * 8.8), ym - 17, zm - 0.9, Math.max(sx * 6, sx * 8.8), ym + 1.5, zm + 0.9, { m: MM }); b.cbox(lx, ym + 1.5, zm, 2.2, 0.4, 2.2, { m: MM }); }
            if (path.distanceTo(lx, ym + 6, zm) < (out ? 6.4 : 7.5)) { cwSpans[sx < 0 ? 0 : 1].push(null); continue; }      // the lens comes in over the parapet here
            lampPos.push([lx, ym + 1.9, zm]); cwSpans[sx < 0 ? 0 : 1].push([lx, ym + 5.85, zm]);
            const sl = (yC(zm + 1) - yC(zm - 1)) / 2;
            pools.push({ p: [sx * 2.4, ym + 0.5, zm], u: [4.4, 0, 0], v: [0, sl * 8.5, 8.5], c: [amber.r, amber.g, amber.b] });
          }
        }
      }
      // the foot: steps down the snowfield between splayed wing walls, lamp piers at the top and the bottom
      b.flood(0.24, yF - 6, 30);
      let top = yF, zS = z0c; const run = 0.625, drift = [];
      for (let k = 0; k < 34; k++) {
        const zn = zS + run, hwS = 5.2 + (k + 1) * 0.14, g = Math.max(groundAt(0, zn + 0.6), groundAt(-hwS, zn + 0.6), groundAt(hwS, zn + 0.6), groundAt(0, zS)) + 0.55, prev = top;
        top = Math.min(top, Math.max(g, top - 0.425));
        b.col(stoneC, 0.5, 0.82).surf(SURF.MASONRY, 0, 0.6); b.box(-hwS, top - 4.5, zS, hwS, top, zn, { m: MM });
        for (const sx of [-1, 1]) b.box(Math.min(sx * hwS, sx * (hwS + 0.8)), top - 5, zS, Math.max(sx * hwS, sx * (hwS + 0.8)), top + 1.15, zn, { m: MM });
        if (k) drift.push([zS, prev, top, hwS]);
        zS = zn;
        if (top - g < 0.05 && k > 16) break;
      }
      const hwE = 5.2 + Math.round((zS - z0c) / run) * 0.14 + 0.4;
      for (const [x, z, y] of [[-6.5, z0c, yF], [6.5, z0c, yF], [-hwE, zS + 0.3, top], [hwE, zS + 0.3, top]]) {
        b.col(stoneC, 0.6, 1).surf(SURF.MASONRY, 0, 1.2); b.cbox(x, y - 7, z, 1.9, 9.6, 1.9, { m: MM }); b.cbox(x, y + 2.6, z, 2.3, 0.35, 2.3, { m: MM });
        lampPos.push([x, y + 2.95, z]);
        if (z === z0c) pools.push({ p: [x * 0.45, yC(z - 4) + 0.5, z - 4], u: [5.5, 0, 0], v: [0, -0.22 * 5.5, 5.5], c: [amber.r * 0.8, amber.g * 0.8, amber.b * 0.8] }); else addPool(x * 0.6, z + 4.5, 8, amber, 0.7);
      }
      b.flood(0);
      buildDeck = () => {     // after the snow caps, so its trodden colours survive
        // drifts against both parapets, trodden snow, a swept centre band of dark setts showing through, and wandering footprints
        const trod = lin('#c3cde6'), sett = lin('#a4abc9'), print = lin('#8f9bc2'), lift = [0.5, 0.1, 0, 0, 0.1, 0.5], NSEG = NS * 4;
        const E = (z, j) => [-5.2, -4.55 + 0.25 * Math.sin(z * 0.31), -1.0 + 0.3 * Math.sin(z * 0.23 + 1) + 0.12 * Math.sin(z * 0.71), 0.95 + 0.3 * Math.sin(z * 0.19 + 2.2) + 0.12 * Math.sin(z * 0.83 + 1), 4.55 + 0.25 * Math.sin(z * 0.27 + 4), 5.2][j];
        b.flood(0);
        for (let i = 0; i < NSEG; i++) {
          const za = lerp(z0c, z1c, i / NSEG), zb = lerp(z0c, z1c, (i + 1) / NSEG), ya = yC(za) + 0.02, yb = yC(zb) + 0.02;
          for (let j = 0; j < 5; j++) {
            const bare = j === 2;
            if (bare) { const k0 = 0.88 + 0.12 * cr(), k1 = k0; b.surf(SURF.MASONRY, 0, 0.45).col(sett, k0, k1); }
            else { const sh = j === 0 || j === 4 ? 0.95 + 0.05 * cr() : 0.9 + 0.1 * cr(); b.surf(SURF.PLAIN).col(j === 0 || j === 4 ? snowC : trod, sh, sh); }
            Q(b, [E(za, j), ya + lift[j], za], [E(za, j + 1), ya + lift[j + 1], za], [E(zb, j + 1), yb + lift[j + 1], zb], [E(zb, j), yb + lift[j], zb], [0, 1, 0], bare ? [E(za, j) * 1.4, za * 1.4, E(za, j + 1) * 1.4, zb * 1.4] : undefined);
          }
        }
        b.surf(SURF.PLAIN).col(print, 1, 1);
        for (const [x0, ph] of [[-3.1, 0], [2.9, 2], [-2.4, 4]]) for (let z = z0c - 0.6, k = 0; z > z1c + 2; z -= 0.8, k++) {
          const x = x0 + 0.5 * Math.sin(z * 0.11 + ph) + (k % 2 ? 0.17 : -0.17);
          Q(b, [x - 0.13, yC(z + 0.2) + 0.13, z + 0.2], [x + 0.13, yC(z + 0.2) + 0.13, z + 0.2], [x + 0.13, yC(z - 0.2) + 0.13, z - 0.2], [x - 0.13, yC(z - 0.2) + 0.13, z - 0.2], [0, 1, 0]);
        }
        for (const x0 of [-2.85, -0.95, 0.95, 2.85]) for (let i = 0; i < NSEG; i++) {      // the sleigh's runners have cut two pairs of ruts, up one side and down the other
          const za = lerp(z0c, z1c + 6, i / NSEG), zb = lerp(z0c, z1c + 6, (i + 1) / NSEG), xa = x0 + 0.12 * Math.sin(za * 0.09 + x0), xb = x0 + 0.12 * Math.sin(zb * 0.09 + x0);
          Q(b, [xa - 0.08, yC(za) + 0.15, za], [xa + 0.08, yC(za) + 0.15, za], [xb + 0.08, yC(zb) + 0.15, zb], [xb - 0.08, yC(zb) + 0.15, zb], [0, 1, 0]);
        }
        // the stair foot: snow drifted over the steps at both sides, the dark risers left showing only down the swept middle
        const noses = [[z0c - 0.4, yF, 5.2]];
        for (const [z, ya, , hw] of drift) noses.push([z, ya, hw]);
        noses.push([zS, top, noses[noses.length - 1][2] + 0.14], [zS + 1.6, top - 0.5, noses[noses.length - 1][2] + 0.14]);
        for (const sx of [-1, 1]) for (let i = 0; i + 1 < noses.length; i++) {
          const [za, ya, ha] = noses[i], [zb, yb, hb] = noses[i + 1], sh = 0.93 + 0.06 * cr();
          const xa0 = sx * (1.2 + 0.32 * Math.sin(za * 0.33 + sx * 1.3)), xb0 = sx * (1.2 + 0.32 * Math.sin(zb * 0.33 + sx * 1.3));
          b.col(snowC, sh, sh); Q(b, [xa0, ya + 0.15, za], [sx * ha, ya + 0.55, za], [sx * hb, yb + 0.55, zb], [xb0, yb + 0.15, zb], [0, 1, 0]);
          b.col(trod, 0.8, 0.8); Q(b, [xa0, ya + 0.15, za], [xb0, yb + 0.15, zb], [xb0, yb + 0.04, zb], [xa0, ya + 0.04, za], [-sx, 0, 0]);      // the cut edge of the drift
          if (sx > 0) { const k = 0.86 + 0.1 * ((i * 0.618) % 1), xl0 = -(1.2 + 0.32 * Math.sin(za * 0.33 - 1.3)), xl1 = -(1.2 + 0.32 * Math.sin(zb * 0.33 - 1.3)); b.col(trod, k, k); Q(b, [xl0, ya + 0.04, za], [xa0, ya + 0.04, za], [xb0, yb + 0.04, zb], [xl1, yb + 0.04, zb], [0, 1, 0]); }
        }
      };
    }
    await ctx.yield();
    // ------------------------------------------------------------ the snowfield between the hamlet and the gate: a lamp-lit footpath climbing to the causeway,
    // a bonfire with the village round it, a ski loop above it (the figures are made with the villagers, further down; their tracks are in the snow shader)
    const BF = [-38, -177], bankLamps = [[-31, -159], [-28.5, -172], [-20.5, -186], [-28.5, -200], [-20.5, -214], [-28.5, -228], [-20.5, -241]];
    {
      const b = TB, fy = groundAt(BF[0], BF[1]);
      b.col(lin('#3a2a20'), 0.8, 1.1).surf(SURF.PLANKS, 0, 1);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, c = Math.cos(a), sn = Math.sin(a); b.beam([BF[0] + c * 1.5, fy - 0.2, BF[1] + sn * 1.5], [BF[0] - c * 0.25, fy + 2.5, BF[1] - sn * 0.25], 0.2, 0.2); }
      b.col([1, 0.45, 0.12], 1, 1).surf(SURF.GLOW, 0, 1.4); b.lathe(BF[0], fy + 0.15, BF[1], [[1.05, 0], [0.7, 0.9], [0.28, 2.1], [0, 3.3]], 6);
      flames.push([BF[0], fy + 1.7, BF[1]]); smokers.push([BF[0], fy + 3.2, BF[1], 0.9]);
      addGlow(BF[0], fy + 1.9, BF[1], 15, '#ff8a3a');
      addPool(BF[0], BF[1], 15, new THREE.Color('#ff9a48'), 0.85); pools[pools.length - 1].f = true;
      for (const [x, z] of bankLamps) { lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 11, amber, 0.8); }
      // the footpath from the street's head to the gate: a rail fence either side with snow on every post and rail, a lantern on every fourth post, drifts blown
      // against it, and a chain of bulbs from lamp to lamp along each side (gaps at the two places where the sleigh turns)
      const fpX = (z) => lerp(-30, -24.5, sm(-140, -156, z)), post = lin('#3a2a20'), fR = makeRng(hashSeed(ctx.seed + ':fence'));
      for (const sx of [-1, 1]) {
        const b = FB; b.flood(0);
        let prev = null;
        for (let z = -144, k = 0; z > -238; z -= 3.4, k++) {
          const x = fpX(z) + sx * 3.1 + 0.25 * Math.sin(z * 0.3 + sx), y = groundAt(x, z);
          if (Math.abs(z + 164) < 5.5 || Math.abs(z + 208) < 5.5 || path.distanceTo(x, y + 2, z) < 4.5) { prev = null; continue; }
          const lean = 0.12 * (fR() - 0.5), top = [x + lean, y + 1.25, z];
          b.col(post, 0.9, 1.1).surf(SURF.PLANKS, 0, 1); b.beam([x, y - 0.3, z], top, 0.17, 0.17);
          if (prev) for (const dy of [0.3, 0.75]) {      // two rails: a board's face and the snow lying along its top edge
            const A = [prev[0], prev[1] - dy, prev[2]], B = [top[0], top[1] - dy, top[2]];
            Q(b, [A[0], A[1] - 0.13, A[2]], [B[0], B[1] - 0.13, B[2]], B, A, [-sx, 0, 0]); Q(b, [A[0], A[1] - 0.13, A[2]], [B[0], B[1] - 0.13, B[2]], B, A, [sx, 0, 0]);
            Q(b, [A[0] - 0.05, A[1], A[2]], [A[0] + 0.05, A[1], A[2]], [B[0] + 0.05, B[1], B[2]], [B[0] - 0.05, B[1], B[2]], [0, 1, 0]);
          }
          if ((k + (sx > 0 ? 2 : 0)) % 4 === 0) {
            b.col([1, 0.72, 0.38], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(top[0], top[1] + 0.02, top[2], 0.26, 0.36, 0.26);
            addGlow(top[0], top[1] + 0.25, top[2], 4.2, '#ffb866'); addPool(x - sx * 1.2, z, 4.6, amber, 0.62); snowLamps.push([top[0], top[1] + 0.3, top[2], 0.6]);
          }
          if (fR() < 0.4) { const r = 1.5 + 1.6 * fR(); b.col(snowC, 0.9, 1).surf(SURF.PLAIN); b.sphere(x + sx * (0.5 + 0.5 * fR()), y - r * 0.7, z + fR() * 2, r, 9, 5); }      // a drift against the fence
          prev = top;
        }
      }
      for (const xs of [-28.5, -20.5]) { const pts = bankLamps.filter((q) => q[0] === xs).map(([x, z]) => [x, groundAt(x, z) + 4.3, z]); for (let i = 1; i < pts.length; i++) if (path.distanceTo((pts[i][0] + pts[i - 1][0]) / 2, pts[i][1] - 1.5, (pts[i][2] + pts[i - 1][2]) / 2) > 6) gSpan(pts[i - 1], pts[i], { sag: 0.06, swing: 0.2, spacing: 1.1, size: 0.52, twinkle: 0.9 }); }
      // the gate's own light lies down the causeway: long pools on the deck, fading from the arch to the bend and a little beyond
      const gateC = new THREE.Color('#ffd9a0');
      for (const [z, k, L] of [[-243, 1.0, 7], [-229, 0.7, 9], [-213, 0.46, 9.5], [-196, 0.3, 9.5], [-178, 0.2, 9.5], [-160, 0.13, 9.5]]) {
        const sl = (yC(z - 1) - yC(z + 1)) / -2;
        pools.push({ p: [0, yC(z) + 0.5, z], u: [4.7, 0, 0], v: [0, sl * L, L], c: [gateC.r * k, gateC.g * k, gateC.b * k] });
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ warm, lit things on the two empty snow banks the flight looks down on. On the hamlet's shelf below
    // the stair foot: two lamps, a snowman with children circling it, a sledge with a lantern, and the way trodden from the street to the causeway (the lane is in the
    // snow shader). At the foot of the causeway's bank, where the flight leaves the footpath: a second sledge, its lantern's light lying on the snow and up the bank.
    // (The children are made with the villagers, further down; the props go into the town's mesh after its snow caps, so they keep their colours.)
    const SM = [-21.5, -50.5], SL1 = [-18.8, -56.4, 1.3], SL2 = [-17.2, -183.4, 0.2];
    let buildGreen;
    {
      for (const [x, z] of [[-26.6, -52.2], [-27.4, -69]]) { lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 11.5, amber, 0.85); }
      for (const [x, z] of [SL1, SL2]) { addGlow(x, groundAt(x, z) + 1.2, z, 4.4, '#ffb866'); addPool(x, z, 5.6, amber, 0.75); }
      { const r = 7, x = -10, z = -177, y = yC(z) - 1.1 - (Math.abs(x) - 6.6) * 1.7 + 0.3;      // and the parapet lamps' light spilling down the causeway's bank above it, lying on the bank's own slope
        pools.push({ p: [x, y, z], u: [r * 0.507, r * 0.862, 0], v: [0, -0.215 * r, 0.977 * r], c: [amber.r * 1.15, amber.g * 1.15, amber.b * 1.15] }); }
      buildGreen = (b) => {
        const dark = lin('#262022'), twig = lin('#3a2a20');
        const snowman = (x, z, k, yaw) => {
          const y = groundAt(x, z) - 0.12 * k, c = Math.sin(yaw), d = Math.cos(yaw), px = d, pz = -c;      // it faces (c, d)
          b.flood(0).surf(SURF.PLAIN);
          b.col(snowC, 0.7, 1.0); b.sphere(x, y + 0.95 * k, z, 1.1 * k, 9, 5);
          b.col(snowC, 0.78, 1.02); b.sphere(x, y + 2.3 * k, z, 0.8 * k, 9, 5);
          b.col(snowC, 0.86, 1.05); b.sphere(x, y + 3.32 * k, z, 0.56 * k, 8, 5);
          b.col(dark, 1, 1); b.cyl(x, y + 3.74 * k, z, 0.66 * k, 0.66 * k, 0.07 * k, 10); b.cyl(x, y + 3.8 * k, z, 0.42 * k, 0.38 * k, 0.58 * k, 10);      // a top hat
          b.col(lin('#b8322c'), 1, 1); b.cyl(x, y + 2.9 * k, z, 0.52 * k, 0.6 * k, 0.24 * k, 10, { cap: false });                                     // a scarf
          b.col(twig, 1, 1);
          for (const sx of [-1, 1]) b.beam([x + px * sx * 0.66 * k, y + 2.45 * k, z + pz * sx * 0.66 * k], [x + px * sx * 1.7 * k, y + 3.15 * k, z + pz * sx * 1.7 * k], 0.09 * k, 0.09 * k);
          b.col(dark, 1, 1);
          for (const sx of [-1, 1]) b.cbox(x + c * 0.5 * k + px * sx * 0.2 * k, y + 3.4 * k, z + d * 0.5 * k + pz * sx * 0.2 * k, 0.12 * k, 0.12 * k, 0.12 * k);
          for (const hy of [1.95, 2.3, 2.65]) { const q = (hy === 2.3 ? 0.78 : 0.72) * k; b.cbox(x + c * q, y + hy * k, z + d * q, 0.13 * k, 0.13 * k, 0.13 * k); }
          b.col([1, 0.42, 0.1], 1, 1).surf(SURF.GLOW, 0, 0.3); b.beam([x + c * 0.5 * k, y + 3.28 * k, z + d * 0.5 * k], [x + c * 1.05 * k, y + 3.22 * k, z + d * 1.05 * k], 0.11 * k, 0.11 * k);
          b.surf(SURF.PLAIN);
        };
        const sledge = (x, z, yaw, k) => {
          b.tr(x, groundAt(x, z) + 0.02, z, yaw, k); b.flood(0);
          b.col(lin('#8a5a34'), 0.9, 1.1).surf(SURF.PLANKS, 0, 1); b.box(-0.44, 0.36, -0.95, 0.44, 0.45, 0.85, { bottom: true });
          b.col(twig, 1, 1).surf(SURF.PLAIN);
          for (const sx of [-1, 1]) {
            b.beam([sx * 0.4, 0.06, -1.0], [sx * 0.4, 0.06, 0.92], 0.08, 0.1); b.beam([sx * 0.4, 0.06, 0.92], [sx * 0.4, 0.56, 1.3], 0.08, 0.08);      // runner, curled up at the front
            for (const zz of [-0.62, 0.5]) b.beam([sx * 0.4, 0.08, zz], [sx * 0.4, 0.38, zz], 0.07, 0.07);
          }
          b.beam([-0.4, 0.56, 1.3], [0.4, 0.56, 1.3], 0.07, 0.07);
          b.col(dark, 1, 1); b.cbox(0, 0.45, -0.25, 0.34, 0.05, 0.34); b.cbox(0, 0.92, -0.25, 0.38, 0.07, 0.38);
          b.col([1, 0.7, 0.36], 1, 1).surf(SURF.GLOW, 0, 1.7); b.cbox(0, 0.5, -0.25, 0.26, 0.42, 0.26);                // the lantern standing on it
          b.col(snowC, 0.95, 1).surf(SURF.PLAIN); b.box(-0.4, 0.45, 0.15, 0.4, 0.5, 0.8);                               // a little snow on the seat
          b.pop();
        };
        snowman(SM[0], SM[1], 0.86, 0.48); sledge(SL1[0], SL1[1], SL1[2], 1.35); sledge(SL2[0], SL2[1], SL2[2], 1.35);
      };
    }
    await ctx.yield();
    for (const b of TBs) { snowCaps(b, 0, 0.35, snowC, hr); await ctx.yield(); }
    snowCaps(CB, 0, 0.5, snowC, cr);
    await ctx.yield();
    snowCaps(CW, 0, 0.5, snowC, cr);
    await ctx.yield();
    buildDeck();
    await ctx.yield();
    buildGreen(TB);
    await ctx.yield();
    {   // the bank beyond the hamlet's last yard, between the footpath and the causeway: the yard's old rail fence, leaning, snow on every post and rail, and a drift blown against it
      const b = FB, yR = makeRng(hashSeed('yard-fence:' + ctx.seed)), post = lin('#3a2a20'), line = [[-21.2, -133.6], [-12.4, -136.6], [-9.7, -146.2]];
      b.flood(0); let prev = null;
      for (let s = 0; s < line.length - 1; s++) {
        const [ax, az] = line[s], [bx, bz] = line[s + 1], n = Math.round(Math.hypot(bx - ax, bz - az) / 2.4);
        for (let i = s ? 1 : 0; i <= n; i++) {
          const x = lerp(ax, bx, i / n) + 0.3 * (yR() - 0.5), z = lerp(az, bz, i / n) + 0.3 * (yR() - 0.5), y = groundAt(x, z), top = [x + 0.3 * (yR() - 0.5), y + 1.05 + 0.25 * yR(), z + 0.2 * (yR() - 0.5)];
          b.col(post, 0.9, 1.15).surf(SURF.PLANKS, 0, 1); b.beam([x, y - 0.3, z], top, 0.16, 0.16);
          if (prev && yR() < 0.86) for (const dy of [0.28, 0.7]) {      // (a rail is down here and there)
            const A = [prev[0], prev[1] - dy, prev[2]], B = [top[0], top[1] - dy, top[2]], nx = B[2] - A[2], nz = A[0] - B[0];
            Q(b, [A[0], A[1] - 0.12, A[2]], [B[0], B[1] - 0.12, B[2]], B, A, [nx, 0, nz]); Q(b, [A[0], A[1] - 0.12, A[2]], [B[0], B[1] - 0.12, B[2]], B, A, [-nx, 0, -nz]);
            Q(b, [A[0], A[1] + 0.01, A[2] - 0.05], [A[0], A[1] + 0.01, A[2] + 0.05], [B[0], B[1] + 0.01, B[2] + 0.05], [B[0], B[1] + 0.01, B[2] - 0.05], [0, 1, 0]);
          }
          prev = top;
        }
      }
      { const r = 2.1, x = -15.6, z = -137.4; b.col(snowC, 0.9, 1).surf(SURF.PLAIN); b.sphere(x, groundAt(x, z) - r * 0.68, z, r, 9, 5); }
    }
    snowCaps(FB, 0, 0.35, snowC, makeRng(hashSeed(ctx.seed + ':far-caps')));
    for (const f of afterCaps) { await f(TB); await ctx.yield(); }
    { const far = new THREE.Mesh(await builderGeometry(FB, () => ctx.yield()), mats.facades); far.name = 'town-far'; scene.add(far); }      // the hamlet's roof dressing and the footpath's fences: always there
    await ctx.yield();
    for (const b of TBs) { const town = new THREE.Mesh(await builderGeometry(b, () => ctx.yield()), mats.facades); town.name = 'town'; scene.add(town); await ctx.yield(); }
    const castle = new THREE.Mesh(await builderGeometry(CB, () => ctx.yield()), mats.facades); castle.name = 'castle';
    await ctx.yield();
    const causeway = new THREE.Mesh(await builderGeometry(CW, () => ctx.yield()), mats.facades); causeway.name = 'causeway';
    await ctx.yield();
    scene.add(castle, causeway);
    scene.add(makeClock(clockFaces, time));
    const HK = LK.hemiK / 2.15;      // custom shaders below were tuned against a hemisphere of about 2.15
    const ambCloth = hemiSky.clone().multiplyScalar(0.4 * HK).add(rimColor.clone().multiplyScalar(0.05 * LK.keyK)), warmCloth = new THREE.Color('#ffb070').multiplyScalar(0.3);
    scene.add(makeFlags(flags, time, ambCloth, warmCloth));
    await ctx.yield();
    {
      const swR = rng.fork('swags');       // (the causeway's swags draw from their own stream, as ever)
      for (let k = 0; k < 2; k++) { const side = cwSpans[k]; for (let i = 1; i < side.length; i++) if (side[i - 1] && side[i]) gSpan(side[i - 1], side[i], { sag: 0.13, swing: 0.2, spacing: 1.25, size: 0.6, twinkle: 0.9, rng: swR }); }
      // and across the causeway from lamp to lamp, wherever the flight does not come within 7 m of the string
      for (let i = 0; i < cwSpans[0].length; i++) { const a = cwSpans[0][i], b = cwSpans[1][i]; if (a && b && path.distanceTo(0, a[1] - 1, a[2]) > 7) gSpan(a, b, { sag: 0.085, swing: 0.2, spacing: 0.9, size: 0.56, twinkle: 0.9, rng: swR }); }
    }
    { const ggR = rng.fork('gate-garland'); if (gateGarland) gChain(gateGarland, { sag: 0.03, swing: 0.1, spacing: 0.9, size: 0.62, twinkle: 0.9, wire: false, rng: ggR }); }       // (the gate's garland draws from its own stream, as ever)
    await ctx.yield();

    // ------------------------------------------------------------ street lamps and their pools
    for (let i = 0; i < 6; i++) {
      const a = a0 + 0.9 + i * TAU / 6, x = firX + Math.cos(a) * 25, z = sqZ + Math.sin(a) * 25;
      if (path.nearestXZ(x, z).dist < 11 || x > 58) continue;
      lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 8.5, amber, 0.7);
    }
    const lsR = makeRng(hashSeed('lamp-streaks:' + ctx.seed));
    for (let z = 482; z > 30; z -= 26) {
      const pond = riverHalf(z) > 12, low = z < pondZ - 62;
      for (const sx of [-1, 1]) {
        if (low && sx < 0) continue;
        const x = riverX(z) + sx * (riverHalf(z) + (pond ? 3.6 : 5.4));
        if (path.nearestXZ(x, z).dist < 10) continue;
        lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 7.5, amber, 0.68);
        if (pond) {            // long reflection streak on the ice, drawn out toward the oncoming camera
          { const len = lsR.range(4.5, 11), kS = 0.1 + 0.46 * lsR() ** 2, wS = lsR.range(0.8, 1.6), ln = lsR.range(0.03, 0.3), dn = Math.hypot(ln, 1), dx = -sx * ln / dn, dz = 1 / dn;      // each its own length, strength and lean toward the flight line (they never cross it)
            pools.push({ p: [x - sx * 3.2 + dx * len, 0.06, z - 1 + dz * len], u: [dz * wS, 0, -dx * wS], v: [dx * len, 0, dz * len], c: [amber.r * kS, amber.g * kS, amber.b * kS], s: true }); }
          addPool(x - sx * 5, z, 6, amber, 0.5, 0.05);
        } else addPool(x - sx * 6.5, z, 8, amber, 0.45, 0.05);
      }
    }
    const lampSets = [], lampM = new THREE.Matrix4(), lampS = new THREE.Vector3();
    for (const [z, sx] of [[-15, -1], [-36, 1], [-60, 1], [-84, -1]]) {      // the snowed-in bend below the viaduct
      const x = riverX(z) + sx * (riverHalf(z) + 6.5); lampPos.push([x, groundAt(x, z), z]); addPool(x, z, 8.5, amber, 0.7); addPool(x - sx * 7, z, 7, amber, 0.4, 0.05);
    }
    await ctx.yield();
    for (const inReach of [(z) => z > pondZ + 118, (z) => z <= pondZ + 118 && z > -8, (z) => z <= -8]) {      // the lamps of each reach of the valley are a mesh of their own, so those of a reach wholly behind the lens are not drawn
      const pos = lampPos.filter((q) => inReach(q[2])).sort((a, b) => b[2] - a[2]); if (!pos.length) continue;      // from the town's end down the valley, so the count can stop at the last post that is there
      const lm = S.makeLamps({ mats, type: 'classic', positions: pos, pool: false, power: 2.4, haloSize: LK.halo }); scene.add(lm.object);
      // a lamp's light (its halo) is there from any distance; its post, thinner than a pixel from far off, grows out of nothing between 315 m and 265 m from the eye
      const inst = lm.object.children.find((o) => o.isInstancedMesh);
      if (inst) lampSets.push({ inst, pos, k: pos.map(() => 1), base: pos.map((q, i) => { const m = new THREE.Matrix4(); inst.getMatrixAt(i, m); return m; }) });
      await ctx.yield();
    }
    // all the strings of lights, swaying: still air barely stirs them, the blizzard leans them down the wind
    const gO = (lbl) => ({ rng: makeRng(hashSeed(ctx.seed + lbl)), colors: lightCols.map(lin), time, wind, lean: look === 'frost' ? 0.08 : storm ? 1.1 : 0.4, gust: look === 'frost' ? 0.45 : storm ? 1.25 : 0.8 });
    const gFar = (q) => q.a[2] + q.b[2] < 0, gOff = (q) => gFar(q) && Math.abs(q.a[0] + q.b[0]) > 20;      // off the causeway's axis: the hamlet's and the snowfield's
    const garl = makeGarlands(gSpans.filter((q) => !gFar(q)), gO(':strings'));
    scene.add(garl.object);
    await ctx.yield();
    for (const off of [false, true]) {      // the causeway's and the gate's are always lit (they show through the arches from the pond); the hamlet's and the snowfield's come on as the eye nears the hamlet
      const far = makeGarlands(gSpans.filter((q) => gFar(q) && gOff(q) === off), gO(off ? ':strings-off' : ':strings-far'));
      for (const m of far.object.children) m.material.uniforms.uPx = garl.uniforms.uPx;
      scene.add(far.object);
      if (off) fadeIn(far.object, far.uniforms.uFade, [-28, 45, -125], 296, 250);
    }
    const bufSz = new THREE.Vector2();
    await ctx.yield();
    // snow falling through the light of every lamp: street lamps, the pond's lanterns, the causeway's, the bridges', the viaduct's
    for (const p of lampPos) snowLamps.push([p[0], p[1] + 4.0, p[2]]);
    for (const p of hero.anchors.lanterns || []) snowLamps.push([p.x, p.y - 0.4, p.z, 0.8]);
    for (const p of hero.anchors.lamps || []) snowLamps.push([p.x, p.y, p.z]);
    { const lg = 1.5 + 9.5 * blow, lk = storm ? 3.4 : look === 'frost' ? 3.0 : 2.6;
      const lO = (lbl) => ({ rng: makeRng(hashSeed(ctx.seed + lbl)), time, velocity: [wind[0] * lg * 0.4, -(look === 'frost' ? 1.0 : 1.7), wind[1] * lg * 0.4], color: new THREE.Color(amber.r * lk, amber.g * lk * 0.92, amber.b * lk * 0.8), px: garl.uniforms.uPx, per: Math.round(9 * QD) });
      scene.add(makeLampSnow(snowLamps.filter((q) => q[2] >= -8), lO(':lamp-snow')));
      const far = makeLampSnow(snowLamps.filter((q) => q[2] < -8), lO(':lamp-snow-far')); scene.add(far); fadeIn(far, far.material.uniforms.uFade, [-15, 40, -100], 270, 225); }
    await ctx.yield();
    scene.add(makePools(pools, time));
    const coolSmoke = hemiSky.clone().multiplyScalar(0.95 * HK).add(rimColor.clone().multiplyScalar(0.07 * LK.keyK)), warmSmoke = new THREE.Color('#ffb070').multiplyScalar(0.8).lerp(coolSmoke, 0.3);
    const smokeWind = [wind[0] * LK.windMul * (1 + 1.2 * blow), wind[1] * LK.windMul * (1 + 1.2 * blow)];
    if (millSmoke) smokers.push(millSmoke);
    scene.add(makeSmoke(smokers, rng.fork('smoke'), time, smokeWind, coolSmoke, warmSmoke, (e) => (e[2] > pondZ + 118 ? 0 : e[2] > -8 ? 1 : 2)));      // the town, the pond and the foot of the viaduct, beyond the viaduct
    await ctx.yield();

    // ------------------------------------------------------------ snow-laden forest
    const fr = rng.fork('forest');
    let hLastX = NaN, hLastZ = NaN, hLast = 0;       // the height last asked for: the kit asks for a spot's height right after dens() has, so work it out once
    const hAt = (x, z) => { if (x !== hLastX || z !== hLastZ) { hLast = land.heightAt(x, z); hLastX = x; hLastZ = z; } return hLast; };
    const dens = (x, z) => {
      const rx = riverX(z), hw = riverHalf(z), ax = Math.abs(x - rx), AX = Math.abs(x);
      if (ax < hw + 4.5) return 0;
      if (Math.abs(z) < 17 && AX < 195) return 0;
      if (z < -34 && z > -268 && AX < (z < -150 && z > -215 ? 9.5 : 16)) return 0;      // firs stand close under the causeway wall where the flight climbs in over it
      if (z < -238 && z > -348 && AX < (z > -252 ? 30 : 64)) return 0;      // firs stand on the crag's shoulders, right up to the curtain walls
      let k = 1;
      if (z < -70 && z > -156 && x < -4 && x > -58) {        // the hamlet's street and yards, and a thin wood round it
        if (Math.abs(x + 30) < 10 && z > -140) return 0;
        if (Math.hypot(x - hFirX, z - hFirZ) < 9) return 0;
        for (const h of hamlet) if (Math.abs(h[0] - x) < 10.5 && Math.abs(h[1] - z) < 10.5) return 0;
        k = 0.3;
      }
      if (z > 8 && z < 66 && AX > 14 && AX < 50) return 0;       // the cottages at the foot of the viaduct
      if (Math.abs(x - 91) < 12 && z > 58 && z < 109) return 0;       // and the two up the right-hand slope
      if (z > 150 && z < 506) {
        if (x > rx + hw && x < 166) { if (Math.abs(x - firX) < 32 && Math.abs(z - sqZ) < 34) return 0; if (Math.abs(x - churchX) < 14 && Math.abs(z - churchZ + 6) < 24) return 0; k = 0.07; }
        else if (x < rx - hw && x > rx - hw - 34) k = 0.14;
        if (k < 1) for (const h of houses) if (Math.abs(h.x - x) < 9.5 && Math.abs(h.z - z) < 9.5) return 0;
      }
      if (hAt(x, z) > 150) k *= 0.2;
      return k * (0.3 + 0.7 * sm(-0.35, 0.3, noise.n2(x * 0.021 + 11, z * 0.021)));
    };
    const needles = { leaf: '#2c4a44', leafDark: '#33485c', leafLight: '#44685c', bark: '#8f8a98', barkDark: '#6a6476' };      // rimed bark and a frosted core
    const nearTrees = [];       // one tree at a time (same order of draws from fr), handing the page back in between
    nearTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 2, snow: 0.5, slim: 0.7, droop: 1, ...needles }))); await ctx.yield();
    nearTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 2, snow: 0.45, slim: 0.8, droop: 1, ...needles }))); await ctx.yield();
    nearTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 2, snow: 0.55, slim: 0.72, droop: 1, ...needles }))); await ctx.yield();
    nearTrees.push(flora.birchGeometry({ rng: fr, detail: 1, foliage: false })); await ctx.yield();
    const midTrees = [];
    midTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 1, snow: 0.58, slim: 0.78, droop: 1, ...needles }))); await ctx.yield();
    midTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 1, snow: 0.52, slim: 0.86, droop: 1, ...needles }))); await ctx.yield();
    midTrees.push(liftDarks(flora.coniferGeometry({ rng: fr, detail: 1, snow: 0.62, slim: 0.8, droop: 1, ...needles }))); await ctx.yield();
    midTrees.push(flora.birchGeometry({ rng: fr, detail: 1, foliage: false })); await ctx.yield();
    const farTrees = [liftDarks(flora.coniferGeometry({ rng: fr, detail: 0, snow: 0.7, ...needles })), liftDarks(flora.coniferGeometry({ rng: fr, detail: 0, snow: 0.6, slim: 1.25, ...needles }))];
    await ctx.yield();
    const NEAR = 58, open = (x, z) => z < 128 && z > -118 && Math.abs(x) < 21;       // nothing within ~20 m of the lens round the viaduct
    // the mill's yard, the lane beside the river and the footbridge's ends are ground where no tree stands: part of both woods' density (the woods are dealt with them in)
    const cleared = (x, z) => (z > 20 && z < 112 && Math.abs(x - laneX(z)) < 3.4) || Math.hypot(x - MILL[0], z - MILL[1]) < 11 || (Math.abs(z - FBZ) < 7 && Math.abs(x) < 26);
    const DT = lerp(0.82, 1.06, (DEN - 0.7) / 0.6);
    // each wood in two steps, the placing and then the instances, with the page handed back in between. The draws are the kit's own, in the kit's
    // own order: makeScatter forks 'pts' from its rng for the placing and keeps `clear` at 0.75 of the widest variant, exactly as done here.
    const clearOf = (vs) => vs.reduce((m, g) => Math.max(m, (g.userData.radius || 1) * 0.75), 0);
    const groveO = {
      rng: fr.fork('near'), path, heightAt: hAt, material: treeMat, count: Math.round(rng.int(84, 100) * DT * (0.7 + 0.3 * QD)), radius: NEAR, corridor: 14, spacing: 4.4, scale: [0.8, 1.45], falloff: 0.15, tilt: 0,
      farDistance: 999, chunks: 4, cullDistance: 300, density: (x, z) => (open(x, z) || cleared(x, z) ? 0 : dens(x, z)), variants: nearTrees, farVariants: farTrees,
    };
    const grovePts = flora.scatterPoints({ ...groveO, rng: groveO.rng.fork('pts'), clear: clearOf(nearTrees) });
    // The wood's two clearings: ground where no tall tree stands, each a place in the valley's own coordinates and part of the wood's density. (The kit deals a
    // tree all its draws before it asks the density, and a tree refused there would re-deal every tree after it down the whole valley; so a clearing is taken
    // from the wood after the deal: a tree dealt into one is young growth there, or is planted on the clearing's rim.)
    //   the snowfield's clearing, from the causeway's embankment to 14 m west of the footpath (x -38.5 .. -8, z -238 .. -154): open snow with the lamp-lit
    //   path through it; its tall trees stand in a row along its west rim, young firs along the embankment's foot
    //   the cottages' clearing on the right bank below the viaduct (x 20 .. 36, z 64 .. 94), between the two lit cottages and the slope above: young firs only
    const snowfield = (x, z) => z < -154 && z > -238 && x > -44.5 && x < -8, RIM = -38.5, cottageGlade = (x, z) => x > 20 && x < 36 && z > 64 && z < 94;
    {
      const plots = [[-45, -163, 1.25, 0], [-48, -176, 1.4, 1], [-46.5, -190, 1.15, 2], [-47.5, -205, 1.35, 0], [-39, -166, 1.0, 3], [-43, -183, 1.05, 3],      // the rim's row: four firs and two birches
        [-14.5, -160, 0.34, 0], [-13.2, -167.5, 0.28, 1], [-15.6, -174, 0.37, 2], [-13.5, -181, 0.3, 0], [-15, -188.5, 0.35, 1], [-13, -196, 0.27, 2], [-15.8, -203, 0.36, 0], [-13.8, -210, 0.3, 1]]; let k = 0;      // the young firs along the foot of the causeway's embankment
      for (const sp of plots) if (sp[2] > 0.5) sp[0] = Math.min(sp[0], RIM - 0.5);      // a tall tree stands on the rim or beyond it, never in the clearing
      for (const q of grovePts) if (snowfield(q.x, q.z)) {
        const sp = plots[k] || [-52 - 3 * (k - plots.length), -160 - 11 * (k - plots.length), 1.1]; k++;
        q.x = sp[0]; q.z = sp[1]; q.y = hAt(sp[0], sp[1]); q.s = sp[2];
      }
      for (; k < plots.length; k++) { const sp = plots[k]; grovePts.push({ x: sp[0], y: hAt(sp[0], sp[1]), z: sp[1], s: sp[2], rot: k * 2.4, d: 30, u: 0.88, v: sp[3] }); }
      for (const q of grovePts) if (cottageGlade(q.x, q.z)) q.s = Math.min(q.s, 1) * 0.36;
    }
    await ctx.yield();
    const grove = flora.makeForest({ ...groveO, points: grovePts });
    await ctx.yield();
    const forestO = {
      rng: fr, path, heightAt: hAt, material: treeMat, count: Math.round((rng.int(390, 450) - 100) * DT * (0.6 + 0.4 * QD)), radius: 280, corridor: 13, spacing: 3.4, scale: [0.7, 1.45], falloff: 0.45, tilt: 0,
      farDistance: 90, chunks: 2, density: (x, z, dist) => (dist < NEAR || cleared(x, z) ? 0 : dens(x, z)), variants: midTrees, farVariants: farTrees,
    };
    const forestPts = flora.scatterPoints({ ...forestO, rng: fr.fork('pts'), clear: clearOf(midTrees) });
    forestPts.length = Math.max(0, forestPts.length - 74);       // the last fifty: they pay for the life on the snowfield below the gate
    await ctx.yield();
    const forest = flora.makeForest({ ...forestO, points: forestPts });
    grove.object.name = 'grove'; forest.object.name = 'forest'; scene.add(grove.object, forest.object); updaters.push(grove, forest);
    await ctx.yield();
    {   // young firs on the lip of the hamlet's shelf and on the causeway's bank where the flight leaves the footpath: a small wood of their own, so that no
      // tree of the grove changes; each group is drawn only from within 175 m (not while the lens is over the pond, where the frame is fullest)
      const yp = [[-36.5, -46.5, 0.34, 0], [-38.2, -52.5, 0.42, 1], [-37, -58.5, 0.3, 0], [-10.3, -166.5, 0.27, 1], [-9.5, -173, 0.3, 0], [-10.8, -179.5, 0.25, 1]]
        .map(([x, z, sc, v]) => ({ x, y: hAt(x, z), z, s: sc, rot: x * 3.1, d: 30, u: z > -100 ? 0.2 : 0.8, v }));
      const young = flora.makeForest({ rng: makeRng(hashSeed(ctx.seed + ':young')), path, heightAt: hAt, material: treeMat, tilt: 0, farDistance: 999, chunks: 2, cullDistance: 175, variants: [nearTrees[0], nearTrees[2]], points: yp });
      young.object.name = 'young-firs'; scene.add(young.object); updaters.push(young);
      // and seedlings on the bank between the footpath and the causeway, of the light far kind (a fifth of a near tree's triangles each), drawn from within 175 m too
      const bp = [[-18.9, -139.8, 0.3, 0], [-11.3, -150.6, 0.36, 1], [-19.4, -163.5, 0.26, 0], [-11.8, -157.5, 0.24, 1], [-18.2, -176, 0.32, 1], [-11.6, -192, 0.28, 0]]
        .map(([x, z, sc, v]) => ({ x, y: hAt(x, z), z, s: sc, rot: x * 2.3 + z, d: 30, u: 0.8, v }));
      const seedl = flora.makeForest({ rng: makeRng(hashSeed('bank-firs:' + ctx.seed)), path, heightAt: hAt, material: treeMat, tilt: 0, farDistance: 999, chunks: 1, cullDistance: 175, variants: farTrees, points: bp });
      seedl.object.name = 'bank-firs'; scene.add(seedl.object); updaters.push(seedl);
    }
    await ctx.yield();
    {   // frosted reeds and snow-capped boulders along the pond rim and the lower river
      const rr = rng.fork('rim'), pts = [], rocks = [];
      for (let z = pondZ + 60; z > pondZ - 62; z -= 1.6) for (const sx of [-1, 1]) {
        if (!rr.chance(0.3 + 0.3 * sm(-0.2, 0.5, noise.n2(z * 0.07, sx * 9)))) continue;
        const x = riverX(z) + sx * (riverHalf(z) + rr.range(-0.4, 2)); pts.push({ x, y: Math.max(land.heightAt(x, z), 0), z, s: rr.range(0.5, 0.95), rot: rr() * TAU, d: 20, u: 0 });
      }
      for (let z = -12; z > -110; z -= 2.2) for (const sx of [-1, 1]) {
        if (!rr.chance(0.3)) continue;
        const x = riverX(z) + sx * (riverHalf(z) + rr.range(0, 3)); if (Math.abs(x) < 7 && z < -36) continue;
        pts.push({ x, y: Math.max(land.heightAt(x, z), 0), z, s: rr.range(0.8, 1.3), rot: rr() * TAU, d: 20, u: 0 });
      }
      const reedP = { leaf: '#a89e7a', tip: '#e9e6da', root: '#6c6650', head: '#4a3526' };
      await ctx.yield();
      const reedRng = rr.fork('reeds'), reedA = flora.reedGeometry({ rng: rr, ...reedP });      // the same draws from rr, in the same order as before
      await ctx.yield();
      const reedB = flora.reedGeometry({ rng: rr, height: 2.9, ...reedP });
      await ctx.yield();
      const reeds = flora.makeScatter({ rng: reedRng, points: pts, material: treeMat, variants: [reedA, reedB], tilt: 0.08, tint: 0.12, colors: [new THREE.Color(2.3, 2.2, 2.1), new THREE.Color(1.9, 1.85, 1.85)], scale: [0.6, 1] });
      reeds.object.name = 'reeds'; scene.add(reeds.object);
      await ctx.yield();
      // reeds and stones along both banks of the reach above the pond, close under the lens as it comes down to the ice: their own stream and their own
      // meshes, so nothing before them changes and they are behind the lens (not drawn) by the time it is over the pond
      const ur = makeRng(hashSeed(ctx.seed + ':upriver')), upPts = [], upRocks = [];
      for (let z = pondZ + 104; z > pondZ + 60; z -= 1.25) for (const sx of [-1, 1]) {
        if (!ur.chance(0.5 + 0.35 * sm(-0.2, 0.5, noise.n2(z * 0.07, sx * 9)))) continue;
        const x = riverX(z) + sx * (riverHalf(z) + ur.range(-0.5, 1.6)); upPts.push({ x, y: Math.max(land.heightAt(x, z), 0), z, s: ur.range(0.8, 1.35), rot: ur() * TAU, d: 20, u: 0 });
      }
      for (let i = 0; i < 16; i++) { const z = pondZ + ur.range(60, 104), sx = ur.sign(), x = riverX(z) + sx * (riverHalf(z) + ur.range(0.6, 2.2)), r = ur.range(0.6, 1.25); upRocks.push([x, Math.max(groundAt(x, z), 0) + r * 0.12, z, r]); }
      const upReeds = flora.makeScatter({ rng: ur.fork('reeds'), points: upPts, material: treeMat, variants: [reedA, reedB], tilt: 0.08, tint: 0.12, colors: [new THREE.Color(2.3, 2.2, 2.1), new THREE.Color(1.9, 1.85, 1.85)], scale: [0.6, 1] });
      upReeds.object.name = 'reeds-up'; upRiver.add(upReeds.object);
      await ctx.yield();
      const rock = (x, z, r) => rocks.push([x, Math.max(groundAt(x, z), 0) + r * 0.12, z, r]);
      for (let i = 0; i < 16; i++) { const z = pondZ + rr.range(-58, 56), sx = rr.sign(); rock(riverX(z) + sx * (riverHalf(z) + rr.range(1.6, 3.4)), z, rr.range(0.6, 1.5)); }
      for (let i = 0; i < 16; i++) { const z = rr.range(-112, -10), sx = rr.sign(), x = riverX(z) + sx * (riverHalf(z) + rr.range(-1.5, 5)); if (z < -36 && Math.abs(x) < 8) continue; rock(x, z, rr.range(0.9, 2.4)); }
      for (let i = 0; i < 8; i++) { const sx = rr.sign(); rock(sx * rr.range(9, 17), rr.range(-52, -24), rr.range(0.8, 1.9)); }
      for (let i = 0; i < 12; i++) { const sx = i % 2 ? 1 : -1, x0 = sx * rr.range(10, 28), z0 = rr.range(-240, -150), r0 = rr.range(1.0, 2.6); rock(x0 < -17 && z0 > -224 ? x0 - 30 : x0, z0, r0); }      // those on the left stand clear of the footpath, the fire and the ski loop
      const Lo = [0, 0, 0];
      const light = (nx, ny, nz) => {
        const l = Math.hypot(nx, ny, nz) || 1, w = 0.5 + 0.5 * ny / l, d = Math.max(0, (nx * rimDir.x + ny * rimDir.y + nz * rimDir.z) / l) * rim.intensity, k = hemi.intensity / Math.PI;
        Lo[0] = lerp(hemiGround.r, hemiSky.r, w) * k + rimColor.r * d / Math.PI; Lo[1] = lerp(hemiGround.g, hemiSky.g, w) * k + rimColor.g * d / Math.PI; Lo[2] = lerp(hemiGround.b, hemiSky.b, w) * k + rimColor.b * d / Math.PI;
        return Lo;
      };
      await ctx.yield();
      scene.add(await makeBoulders(rocks, rr, lin('#565a72'), lin('#dfe6f4'), light, ctx.yield));
      await ctx.yield();
      { const up = await makeBoulders(upRocks, ur.fork('rocks'), lin('#565a72'), lin('#dfe6f4'), light, ctx.yield); up.name = 'boulders-up'; upRiver.add(up); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ life: skaters, crows, geese, deer
    {
      const sk = rng.fork('skaters'), n = Math.min(16, Math.max(12, Math.round(rng.int(11, 16) * DEN))), list = [], hwP = 8.5 + pondR - 3, SKZ = 1.42;      // storybook figures: they must read from the far end of the pond
      const coats = ['#b83a32', '#2f5fa8', '#e0b040', '#2f7a5a', '#d8d8e0', '#7a3a8a', '#d86a30', '#3a4a78'], hats = ['#e03a30', '#f2c440', '#3f86e0', '#f0f0f6', '#3aa878', '#f07a30', '#d058a8'];
      if (storm) coats[4] = '#c2356e';                         // no pale coat in the storm: against the lamp-lit snow in the air every coat must read
      const LANE = 15.6, bandOut = pondR + 4.7, rxMax = Math.max(1.7, (bandOut - LANE) / 2.2), zHi = pondZ + 31, zLo = Math.max(pondZ - 32, 140);      // both bands run the whole length of the pond
      // the rink: half the skaters on each side of the clear strip under the flight line. Each band is three loops end to end, and the two or three skaters of a
      // loop go round it at one speed, a half or a third of a lap apart: so they stay spread along the whole band at every moment, and no three ever bunch.
      // The far loop of each band (the one in the frame as the lens crosses the middle of the pond) is filled first.
      const rk = makeRng(hashSeed(ctx.seed + ':rink')), NCELL = 3, nSide = [Math.ceil(n / 2) + 1, Math.floor(n / 2) + 1], cells = [[], []], seat = [[], []];
      for (let s = 0; s < 2; s++) {
        const sd = s ? 1 : -1, cut = [0, 1 / 3 + rk.range(-0.025, 0.025), 2 / 3 + rk.range(-0.025, 0.025), 1];
        const cap = nSide[s] >= 9 ? [4, 3, 2] : nSide[s] === 8 ? [3, 3, 2] : [3, 2, 2], fill = [0, 0, 0];
        for (let j = 0, c = 0; j < nSide[s]; j++) { for (let t = 0; t < NCELL && fill[c] >= cap[c]; t++) c = (c + 1) % NCELL; seat[s].push([c, fill[c]++]); c = (c + 1) % NCELL; }      // dealt round the loops, the far one first
        for (let c = 0; c < NCELL; c++) {
          const z0 = lerp(zLo, zHi, cut[c]), z1 = lerp(zLo, zHi, cut[c + 1]), rz = Math.max(4.5, ((z1 - z0) / 2 - 1.9) / 1.1), rx = lerp(0.62, 1, rk()) * rxMax;
          const cx = sd * lerp(LANE + 1.1 * rx, Math.max(LANE + 1.1 * rx, bandOut - 1.1 * rx), rk()), v = rk.range(4.6, 7);
          cells[s].push({ cx, cz: (z0 + z1) / 2, rx, rz, w: sd * v / (0.75 * rz + 0.25 * rx), a0: rk() * TAU, m: Math.max(fill[c], 1) });      // everyone in a band circles the same way, as on any rink: down the inner track with the flight, back up along the bank toward the lens
        }
      }
      const rinkSpot = (s, j, jit) => { const [c, slot] = seat[s][j], q = cells[s][c]; const f = [1, 0.55, 0.78, 0.66][slot % 4];      // each skater of a loop keeps its own lane and its own centre, so no two ever ride together
        return { c: [q.cx + (slot % 2 ? 1 : -1) * (1 - f) * q.rx * 0.7, q.cz + [0, 1.5, -1.2, 0.8][slot % 4], q.rx * f, q.rz], a: q.a0 + ((slot + 0.3 * (jit - 0.5)) / q.m) * TAU, w: q.w }; };
      for (let i = 0; i < n; i++) {
        const big = i % 4 === 3, side = i % 2 ? 1 : -1;        // (the layout the scratches follow: most to one side of the flight line, a few lapping the whole pond)
        const rz = big ? sk.range(18, 25) : sk.range(8, 20);
        const cx = big ? sk.range(-1.5, 1.5) : side * sk.range(10.5, hwP - 5.5), ax = Math.abs(cx);
        const rx = big ? sk.range(hwP * 0.6, hwP * 0.76) : sk.range(3, Math.min(ax - 5.5, hwP - ax - 1));
        const cz = pondZ + sk.range(-1, 1) * Math.max(0, 30 - rz * 1.1), v = sk.range(5, 8.5), coat = sk.pick(coats);
        let hat = sk.pick(hats); if (hat === coat) hat = hats[3];
        ovals[i].set(cx, cz, rx, rz);                            // the old scratches on the ice keep these wide ovals
        // the skaters themselves keep to the two sides of the pond: the strip under the flight line, which the bottom edge of the frame sweeps as the
        // lens passes low over the ice, stays clear, so that no figure is ever cut by that edge (the same draws as before; each takes its place in a loop)
        const sp = rinkSpot(i % 2, i >> 1, sk());
        list.push({ c: sp.c, p: [sp.a, sp.w + sk.sign() * 0, sk.range(0.85, 1.05) * SKZ, sk.range(0.8, 1.2)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25) });
      }
      for (let i = 0; i < 4; i++) {      // and four more
        const sd = i % 2 ? 1 : -1, cz = pondZ + sk.range(66, 74), rz = sk.range(12, 16), v = sk.range(5, 7.5), coat = sk.pick(coats); let hat = sk.pick(hats); if (hat === coat) hat = hats[3];
        if (i < 2) {      // two race the lens down the river, 35 m ahead of it and a little slower, and swing out to either side as the pond opens: their place is keyed to the flight's progress
          list.push({ c: [sd * 2.7, sd * (LANE + 0.7), -1, pondZ - 8], p: [sk() * 2.4 + sk.sign() * 0, 1, sk.range(0.85, 1.05) * 1.2, sk.range(1.5, 1.9)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25) });
          continue;
        }
        const sp = rinkSpot(sd > 0 ? 1 : 0, nSide[sd > 0 ? 1 : 0] - 1, sk());      // the other two are children: one more in each band, in the loop that has room
        list.push({ c: sp.c, p: [sp.a, sp.w + sk.sign() * 0 + (cz + rz + v) * 0, sk.range(0.85, 1.05) * 1.2, sk.range(0.8, 1.2)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25) });
      }
      {   // and a few out in the middle of the pond, on small loops that cross under the flight line
        const mk = makeRng(hashSeed(ctx.seed + ':mid-rink'));
        for (let i = 0; i < 4; i++) {
          const sd = i % 2 ? 1 : -1, rx = mk.range(3.6, 5), rz = mk.range(5, 7.5), cz = pondZ - 22 + i * 13.5 + mk.range(-2, 2), v = mk.range(4.4, 6.2), coat = coats[(i * 3 + 1) % coats.length], hat = hats[(i * 2 + 5) % hats.length];
          list.push({ c: [sd * (rx * 0.55 + mk.range(0, 1.5)), cz, rx, rz], p: [mk() * TAU, sd * v / (0.5 * (rx + rz)), mk.range(0.85, 1.02) * SKZ, mk.range(0.8, 1.2)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25) });
        }
      }
      const figAmb = hemiSky.clone().multiplyScalar(0.72 * HK).add(rimColor.clone().multiplyScalar(0.04 * LK.keyK));
      const shL = Math.hypot(rimDir.x, rimDir.z) || 1;      // the low light from up the valley lays every skater's shadow long across the ice, toward the lens
      pondLife.add(makeSkaters(list, time, figAmb, amber.clone().multiplyScalar(0.7), { shadow: [-rimDir.x / shL, -rimDir.z / shL, storm ? 3.2 : 4.6, storm ? 0.46 : 0.66], escort: escU, edge: 1 }));
      {   // their own images in the ice: where each one is this frame (the figures' own motion, worked out here once more) and its coat as the lamps and the sky light it
        const nM = Math.min(list.length, skMir.length), kA = 0.85, kW = 0.5;
        for (let i = 0; i < nM; i++) { const k = list[i].k; skMirC[i].set(k[0] * (figAmb.r * kA + amber.r * kW), k[1] * (figAmb.g * kA + amber.g * kW), k[2] * (figAmb.b * kA + amber.b * kW)); }
        skMirror = (t) => {
          const E = escU.value;
          for (let i = 0; i < nM; i++) {
            const c = list[i].c, q = list[i].p, m = skMir[i];
            if (c[2] < 0) { const ze = Math.max(E.x + q[0], c[3]); m.set(lerp(c[1], c[0], sm(E.z, E.y, ze)), ze, 2.04 * q[2], 0); continue; }
            const a = q[0] + t * q[1], w = 1 + 0.1 * Math.sin(a * 2 + q[0] * 3);
            m.set(c[0] + 1.4 * Math.sin(t * 0.07 + q[0]) + c[2] * Math.cos(a) * w, c[1] + 1.4 * Math.cos(t * 0.09 + q[0] * 2) + c[3] * Math.sin(a) * w, 2.04 * q[2], 0);
          }
        };
      }
      await ctx.yield();
      // villagers out in the hamlet street (the same little figures, walking: slow loops, short quick steps, on the street's own slope)
      const vr = rng.fork('villagers'), folk = [], laneFolk = [], tracks = [[-30, -99, 2.6, 11], [-30.3, -119, 2.4, 10], [-28.4, -108, 1.4, 17], [-31.6, -110, 1.4, 18]];
      for (let i = 0; i < Math.round(9 * DEN); i++) {
        const tk = tracks[i % 4], v = vr.range(1.2, 1.9), coat = vr.pick(coats); let hat = vr.pick(hats); if (hat === coat) hat = hats[3];
        folk.push({ c: tk, p: [vr() * TAU, (v / ((tk[2] + tk[3]) / 2)) * vr.sign(), vr.range(0.85, 1.05), vr.range(2.6, 3.4)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25), t: i % 2 ? undefined : [-1, 0.3] });      // every second one carries a lantern
      }
      const g0 = groundAt(-30, -86), g1 = groundAt(-30, -110), g2 = groundAt(-30, -134);      // the street's rise, as a parabola through three spots
      // out on the snowfield below the gate and up the causeway: each group on its own ground (a parabola through three spots of its track)
      const br = makeRng(hashSeed(ctx.seed + ':bank')), par = (cx, cz, rz) => { const a = groundAt(cx, cz + rz), m = groundAt(cx, cz), c = groundAt(cx, cz - rz); return [m + 0.06, (a - c) / (2 * rz), (a + c - 2 * m) / (2 * rz * rz), cz]; };
      const fig = (c, v, stride, g, t) => {
        const coat = br.pick(coats); let hat = br.pick(hats); if (hat === coat) hat = hats[3];
        folk.push({ c, p: [br() * TAU, (v / ((c[2] + c[3]) / 2)) * br.sign(), br.range(0.85, 1.05), stride], k: lin(coat), k2: lin(hat).map((q) => q * 1.25), g, t });
      };
      const gRing = par(BF[0], BF[1], 6), gSki = par(-37.5, -204, 12.5), gPa = par(-24.5, -174, 13), gPb = par(-24.5, -201, 13), gPc = par(-24.5, -227, 10), gCw = [yC(-118) + 0.1, -35.5 / 161, 0, -118];
      for (let i = 0; i < Math.round(6 * DEN); i++) fig([BF[0], BF[1], 4.6, 4.6], br.range(0.9, 1.3), br.range(2.4, 3.2), gRing, [0, 0.3]);
      for (let i = 0; i < 5; i++) fig([-37.5, -204, 4.5, 12.5], br.range(3.4, 4.6), br.range(0.8, 1.2), gSki, [1, 1]);
      for (let i = 0; i < 4; i++) fig([-24.5, i % 2 ? -201 : -174, 1.6, 13], br.range(0.9, 1.2), br.range(2.6, 3.4), i % 2 ? gPb : gPa, [-1, 0.3]);      // the walkers on the footpath and the causeway carry lanterns (t[0] = -1)
      for (let i = 0; i < 2; i++) fig([-24.5, -227, 1.6, 10], br.range(0.9, 1.2), br.range(2.6, 3.4), gPc, [-1, 0.3]);
      for (let i = 0; i < 6; i++) fig([0, -118, 2.9, 52], br.range(0.8, 1.0), br.range(2.6, 3.4), gCw, [-1, 0.3]);
      {   // a line of lantern bearers walking up the footpath to the gate, evenly strung out, and two more on the lane by the mill
        const pr = makeRng(hashSeed(ctx.seed + ':procession')), walk = (c, a, w, g, size = 1) => { const coat = pr.pick(coats); let hat = pr.pick(hats); if (hat === coat) hat = hats[3];
          folk.push({ c, p: [a, w, size * pr.range(0.85, 1.05), pr.range(2.6, 3.4)], k: lin(coat), k2: lin(hat).map((q) => q * 1.25), g, t: [-1, 0.3] }); };
        for (let i = 0; i < 12; i++) { const tr = i % 3, cz = [-174, -201, -227][tr], rz = tr === 2 ? 10 : 13; walk([-24.5, cz, 1.25, rz], (Math.floor(i / 3) / 4 + 0.03 * tr) * TAU + pr.range(-0.12, 0.12), 1.05 / ((1.25 + rz) / 2), [gPa, gPb, gPc][tr]); }
        const gMl = par(-17, 68, 30), nF = folk.length;
        for (let i = 0; i < 3; i++) walk([laneX(68) + 0.4, 68, 0.9, 30], i * 2.1 + pr(), (i % 2 ? -1 : 1) * 1.1 / 15.5, gMl);
        laneFolk.push(...folk.splice(nF));
      }
      {   // the children round the snowman on the shelf, two lantern walkers on the way across it, and two by the sledge at the foot of the causeway's bank
        const gr = makeRng(hashSeed(ctx.seed + ':green'));
        const kid = (c, v, stride, g, t, size) => {
          const coat = gr.pick(coats); let hat = gr.pick(hats); if (hat === coat) hat = hats[3];
          folk.push({ c, p: [gr() * TAU, (v / ((c[2] + c[3]) / 2)) * gr.sign(), size * gr.range(0.92, 1.05), stride], k: lin(coat), k2: lin(hat).map((q) => q * 1.25), g, t });
        };
        const gSm = par(SM[0], SM[1], 2.9), gLane = par(-25, -70, 10), gSl = par(SL2[0] + 0.4, SL2[1] + 2.6, 1.5);
        for (let i = 0; i < 4; i++) kid([SM[0], SM[1], 2.9, 2.9], gr.range(1.3, 1.9), gr.range(2.8, 3.4), gSm, i % 2 ? [-1, 0.3] : [0, 0.3], 0.74);
        for (let i = 0; i < 2; i++) kid([-25, -70, 0.9, 10], gr.range(0.9, 1.2), gr.range(2.6, 3.2), gLane, [-1, 0.3], 1);
        for (let i = 0; i < 2; i++) kid([SL2[0] + 0.4, SL2[1] + 2.6, 1.5, 1.5], gr.range(0.8, 1.1), gr.range(2.8, 3.4), gSl, i ? [-1, 0.3] : [0, 0.3], 0.74);
      }
      const folkMesh = makeSkaters(folk, time, figAmb, amber.clone().multiplyScalar(0.8), { ground: [g1 + 0.06, (g0 - g2) / 48, (g0 + g2 - 2 * g1) / 1152, -110], trail: 0, lean: 0.3 });
      folkMesh.name = 'villagers'; farFolk.add(folkMesh); fadeIn(farFolk, folkMesh.userData.fade, [-28, 40, -110], 300, 255);      // (the same distances as every small moving thing beyond the viaduct)
      { const lf = makeSkaters(laneFolk, time, figAmb, amber.clone().multiplyScalar(0.8), { trail: 0, lean: 0.3 }); lf.name = 'lane-walkers'; scene.add(lf); }      // on the near side of the viaduct: always there
      await ctx.yield();
      {   // horse sleighs with their lanterns: one going up and down the causeway, one on the footpath across the snowfield with a dog running behind it,
          // one standing in the hamlet street; and the dog that runs the lane by the mill
        const blanket = lin(bannerC[0]).map((q) => q * 1.6), slope = (x, z) => (groundAt(x, z + 3) - groundAt(x, z - 3)) / 6, sp = (v, rx, rz) => v / (0.75 * rz + 0.25 * rx);
        const gSf = par(-24.5, -186, 22), gSt = [groundAt(-29.6, -124) + 0.05, slope(-29.6, -124), 0, -124], gLn = par(-17, 68, 34), dogC = [0.5, 0.36, 0.22];
        const rgR = makeRng(hashSeed(ctx.seed + ':rigs')), ph1 = rgR() * TAU, ph2 = rgR() * TAU, ph3 = rgR() * TAU, ph4 = rgR() * TAU;      // where each is on its round when we arrive is dealt by seed (the dog keeps its place behind its sleigh)
        const rigs = [
          { kind: 0, c: [0, -124, 1.9, 58], p: [ph1, sp(3.3, 1.9, 58), 1.3, 7.5], g: gCw, k: blanket, k2: lin('#2f5fa8'), m: [0.5, 0.05] },
          { kind: 0, c: [-24.5, -186, 0.6, 22], p: [ph2, sp(2.9, 0.6, 22), 1.3, 7], g: gSf, k: blanket, k2: lin('#2f7a5a'), m: [0.5, 0.05] },
          { kind: 1, c: [-24.5, -186, 0.6, 22], p: [ph2 - 0.34, sp(2.9, 0.6, 22), 1.6, 12], g: gSf, k: dogC, m: [0.8, 0.1] },
          { kind: 0, c: [-29.6, -124, 0.01, 0.01], p: [Math.PI, 1e-5, 1.3, 1], g: gSt, k: blanket, k2: lin('#b83a32'), m: [0, 0] },
          { kind: 1, c: [-17, 68, 0.7, 34], p: [ph3, sp(6.5, 0.7, 34), 1.7, 12.5], g: gLn, k: dogC, m: [0.85, 0.12] },
        ];
        rigs.splice(4, 0, { kind: 1, c: [-16.6, -151, 0.5, 10.5], p: [ph4, sp(3.4, 0.5, 10.5), 1.2, 10.5], g: par(-16.6, -151, 10.5), k: [0.78, 0.24, 0.05], m: [0.7, 0.08] });      // a fox trotting the sledge run on the bank below the causeway
        const farRigs = makeTrotters(rigs.slice(0, 5), time, figAmb, amber.clone().multiplyScalar(0.8)); scene.add(farRigs); fadeIn(farRigs, farRigs.userData.fade, [-12, 40, -130], 300, 255);
        scene.add(makeTrotters(rigs.slice(5), time, figAmb, amber.clone().multiplyScalar(0.8)));      // the dog on the mill lane, this side of the viaduct: always there
        addPool(-29.6, -124, 5, amber, 0.7);
      }
    }
    await ctx.yield();
    const faunaLight = F.lightFrom(scene), animals = [];
    await ctx.yield();
    animals.push(F.makeFlock({ rng: rng.fork('crows'), species: 'crows', count: rng.int(14, 26), light: faunaLight, center: [churchX - 18, churchY + 42, churchZ + 12], radius: 36, size: 1.5 }));
    await ctx.yield();
    animals.push(F.makeFlock({ rng: rng.fork('daws'), species: 'crows', count: rng.int(8, 15), light: faunaLight, center: [CX + tallX * 0.6, CY + 70, CZ - 50], radius: 30, size: 1.7 }));
    await ctx.yield();
    animals.push(F.makeFlock({ rng: rng.fork('burst'), species: 'crows', count: rng.int(9, 16), light: faunaLight, size: 1.5, cross: { path, u: 0.176, lead: 34, height: 3, angle: rng.range(50, 75), side: -1, span: 190, window: 0.111, rise: 16 } }));
    await ctx.yield();
    {   // crows lifting off the roofs at the foot of the pond as the climb begins: the place is the path's own bend there, wherever the pace puts it
      const cR = makeRng(hashSeed(ctx.seed + ':roof-crows'));
      animals.push(F.makeFlock({ rng: cR, species: 'crows', count: 8 + Math.floor(cR() * 5), light: faunaLight, size: 1.5, cross: { path, u: path.nearestXZ(12, 131).u, lead: 30, height: -1, angle: 58, side: 1, span: 130, window: 0.1, rise: 20 } }));
    }
    await ctx.yield();
    const hasGeese = rng.chance(0.5), hasDeer = rng.chance(0.6);
    if (hasGeese) animals.push(F.makeFlock({ rng: rng.fork('geese'), species: 'geese', count: rng.int(9, 17), light: faunaLight, size: 1.3, cross: { path, u: 0.28, lead: 110, height: 34, angle: rng.range(55, 80), side: rng.sign(), span: 520, window: 0.28 } }));
    await ctx.yield();
    if (hasDeer) animals.push(F.makeHerd({ rng: rng.fork('deer'), species: 'deer', count: rng.int(4, 7), light: faunaLight, heightAt: land.heightAt, path, clear: 14, center: [-36 + 0 * rng.sign(), 0, -68], radius: 11 }));      // on the shelf between the stair foot and the hamlet, below the flight as it leaves the arch
    for (const a of animals) { scene.add(a.object); updaters.push(a); }
    await ctx.yield();

    // ------------------------------------------------------------ falling snow, haze, glows
    const set = fx.fxGroup(); set.object.name = 'fx'; scene.add(set.object);
    const squallK = storm ? 0.55 : 0.5; let squallBack = null;
    const gust = 1.5 + 9.5 * blow, fall = look === 'frost' ? 1.1 : 1.9;                 // the blizzard drives the snow nearly flat
    set.add(fx.makeParticles({ rng: rng.fork('snow-near'), preset: 'snow', time, density: snowfall * QD, velocity: [wind[0] * gust, -fall - 0.6 * blow, wind[1] * gust], ...(blow ? { box: [80, 46, 80], turbulence: [1.6, 0.5, 0.35], size: [0.05, 0.19] } : {}) }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('snow-far'), preset: 'snow', time, count: Math.round(2500 * snowfall * QD * (look === 'frost' ? 1.7 : 1)), box: [170, 100, 170], size: blow ? [0.16, 0.42] : [0.14, 0.34], opacity: blow ? 0.62 : 0.5, velocity: [wind[0] * gust * 1.45, -fall * 1.3 - 0.8 * blow, wind[1] * gust * 1.45], near: [5, 16] }));
    await ctx.yield();
    // weather that moves: spindrift streaming off the peaks, the crag, the castle roofs and the parapets; snow squalls crossing the valley; mist in the gorge
    {
      const drifts = [];
      for (const f of flags) if (f.taper) drifts.push([f.o[0], f.o[1] - 4.4, f.o[2], 1.5]);
      for (let i = 0; i < 9; i++) { const a = -0.6 + i * 0.55, x = CX + 61 * Math.cos(a), z = CZ - 42 + 61 * Math.sin(a); drifts.push([x, groundAt(x, z) + 0.6, z, 1.7]); }
      for (let z = -60; z > -240; z -= 22) for (const sx of [-1, 1]) drifts.push([sx * 5.7, yC(z) + 1.3, z, 0.9]);
      for (let z = -44; z > -150; z -= 13) { const x = riverX(z) + riverHalf(z) + 11; drifts.push([x, groundAt(x, z) + 0.5, z, 1.7]); }      // off the lip of the gorge below the hamlet
      for (const h of houses) if (h.z < -70) drifts.push([h.x, h.y + h.h - 0.3, h.z, 1.0]);                                                 // and off the hamlet's roofs
      const cand = [];
      for (let z = 430; z >= -600; z -= 43) for (let x = -310; x <= 310; x += 31) {
        if (Math.abs(x) < 95) continue;
        const h = land.heightAt(x, z); if (h < 70 || h < land.heightAt(x - 22, z) + 2 || h < land.heightAt(x + 22, z) + 2) continue;
        cand.push([x, h + 1, z, clamp(h / 45, 2.2, 6)]);
      }
      cand.sort((p, q) => q[1] - p[1]); for (const c of cand.slice(0, Math.round(30 * QD))) drifts.push(c);
      await ctx.yield();
      for (let i = 0; i < houses.length; i += 6) drifts.push([houses[i].x, houses[i].y + houses[i].h - 0.4, houses[i].z, 0.8]);
      const snowAir = hemiSky.clone().multiplyScalar(LK.hemiK / Math.PI), keyAir = rimColor.clone().multiplyScalar(LK.keyK / Math.PI);
      scene.add(makeSpindrift(drifts, rng.fork('spindrift'), time, wind, snowAir.clone().multiplyScalar(0.9), keyAir.clone().multiplyScalar(look === 'blizzard' ? 0.25 : 0.6), look === 'frost' ? 1.15 : storm ? 1.5 : 1));
      if (look !== 'frost') scene.add(makeSqualls([[300, 0, 190, 95, 0.1], [118, -5, 220, 110, 0.55, 0.6], [-72, 0, 200, 100, 0.8], [-185, 30, 180, 95, 0.33]], time, wind,      // kept thin: the viaduct and the castle must read through them from the entry
        snowAir.clone().multiplyScalar(storm ? 1.25 : 1.5).add(keyAir.clone().multiplyScalar(storm ? 0.8 : 0.4)), storm ? 0.5 : 0.6));
      // one more sheet of driven snow just beyond the viaduct: from the town the arcade stands dark against it; it thins out before the lens meets the train
      if (look !== 'frost') { squallBack = makeSqualls([[-40, 30, 260, 120, 0.3]], time, wind, snowAir.clone().multiplyScalar(storm ? 1.2 : 1.5).add(keyAir.clone().multiplyScalar(storm ? 1.1 : 0.7)), squallK); scene.add(squallBack); }
      const mistC = snowAir.clone().multiplyScalar(1.25).add(keyAir.clone().multiplyScalar(0.3));
      set.add(fx.makeMist({ rng: rng.fork('mist'), count: Math.round(40 * QD), area: [250, 12, 210], center: [-45, 8, -70], size: [26, 56], color: mistC, opacity: look === 'frost' ? 0.3 : 0.4,
        drift: [wind[0] * 1.1 * Math.max(LK.windMul, 0.7) + 0.12, 0, wind[1] * 1.1 * Math.max(LK.windMul, 0.7)], time }));
    }
    await ctx.yield();
    set.add(fx.makeGlows({ time, positions: flames, colors: flames.map(() => '#ff9a40'), sizes: flames.map(() => 9), size: 1, intensity: 0.8, flicker: 0.55, core: 0.5 }));
    // in the storm the floodlit castle throws a soft warm halo on the snow-filled air BEHIND and above it: a sprite beyond the back wall, depth tested, so every
    // tower, window, banner and the gate stand in front of it as they are; it eases down as the lens comes near (a uniform, nothing switched)
    const beacon = storm ? fx.makeGlows({ time, positions: [[CX, CY + 64, CZ - 150]], colors: ['#e89a58'], sizes: [250], size: 1, intensity: 2.2, flicker: 0.04, core: 0, depthBias: 0 }) : null;
    if (beacon) set.add(beacon);
    // and from the town the arcade needs something paler behind it than the crag: a broad, soft glow in the snow-filled air between the viaduct and the crag,
    // depth tested, so piers and spandrels stand dark in front of it; it is gone before the lens reaches the pond (a uniform, nothing switched)
    const veilK = storm ? 1.0 : look === 'ember' ? 0.7 : 0;
    // three low, overlapping: a band behind the whole arcade that leaves the castle above the deck alone; in the ember look a fourth, behind the keep, so the castle's towers stand against a soft warm halo from the entry
    const veil = veilK ? fx.makeGlows({ time, positions: storm ? [[-105, 16, -70], [0, 14, -70], [105, 16, -70]] : [[-105, 16, -70], [0, 14, -70], [105, 16, -70], [CX, CY + 92, CZ - 120]],
      colors: storm ? ['#b798cc'] : ['#c8683a', '#c8683a', '#c8683a', [8, 3.3, 1.35]], sizes: storm ? [330] : [330, 330, 330, 250], size: 1, intensity: veilK, flicker: 0.03, core: 0, depthBias: 0 }) : null;
    if (veil) set.add(veil);
    set.add(fx.makeGlows({ time, positions: glowPts, colors: glowCols, sizes: glowSizes, size: 1, intensity: storm ? 0.68 : 0.5, flicker: 0.12, core: 0.35 }));
    await ctx.yield();

    const firTop = new THREE.Vector3(firX, firY + firH * 0.62, sqZ);
    // is any of a box of ground [x0, y0, z0, x1, y1, z1] in the picture, with a sixth of the frame to spare all round? Its eight corners against the four sides
    // of the view and the plane of the eye (the view's own near and far planes are left out: behind a portal they are not the usual ones)
    const viewM = new THREE.Matrix4(), pondBox = [-(pondR + 21), -1, 132, pondR + 21, 5, pondZ + 98], upBox = [-30, -1, pondZ + 54, 30, 6, pondZ + 110];
    const inView = (b) => {
      const e = viewM.elements; let l = 0, r = 0, d = 0, t = 0, h = 0;
      for (let i = 0; i < 8; i++) {
        const x = b[i & 1 ? 3 : 0], y = b[i & 2 ? 4 : 1], z = b[i & 4 ? 5 : 2];
        const cx = e[0] * x + e[4] * y + e[8] * z + e[12], cy = e[1] * x + e[5] * y + e[9] * z + e[13], m = 1.17 * (e[3] * x + e[7] * y + e[11] * z + e[15]);
        if (cx + m < 0) l++; if (cx - m > 0) r++; if (cy + m < 0) d++; if (cy - m > 0) t++; if (m < 0.05) h++;
      }
      return !(l === 8 || r === 8 || d === 8 || t === 8 || h === 8);
    };
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 24, sway: 0.7, bank: 0.8 },
      pois: [
        { at: [0, 62, -250], from: 0, to: 0.093, weight: 0.3 },
        { at: firTop, from: 0.065, to: 0.232, weight: 0.5 },
        { at: trainPoi, from: uMeet - 0.26, to: uMeet + 0.04, weight: 0.8, fade: 0.1 },             // follow the Express out of its tunnel and across, hold the locomotive at the meeting, let go for the dive
        { at: [0, 66, -250], from: uMeet + 0.02, to: uArch + 0.02, weight: 0.6, fade: 0.25 },        // through the dive the gaze goes to the gate, framed by the arch
        { at: [4, 86, -285], from: uArch + 0.08, to: 0.86, weight: 0.5, fade: 0.3 },                 // from the hamlet street the castle stands three-quarter above the roofs
      ],
      portal: { shape: 'arch', width: 14, height: 16, color: '#ffd9a0', glow: 1.1, revealDistance: 300 },
      post: {
        exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.7, threshold: 0.9 },
        grade: { saturation: LK.saturation, contrast: LK.contrast, tint: LK.tint, shadowTint: LK.shadowTint, vignette: LK.vignette, grain: 0.03, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        for (const o of updaters) o.update(dt, t, camera, u);
        if (emberBand) emberBand.position.setFromMatrixPosition(camera.matrixWorld);
        const hx = headXAt(u);
        hero.setProgress(hero.anchors.train.progressForHeadX(hx)); hero.update(dt, t, camera);
        iceTrain.set(hx, trainLen, 1);
        escU.value.x = escZ(path.pointAt(u, escP).z);
        if (skMirror) skMirror(t);
        if (camera) {
          const M = camera.matrixWorld.elements, lx = M[12], ly = M[13], lz = M[14];      // where the lens is: read from the world matrix, which is what the camera behind a portal is given
          // the storm's halo behind the castle and the veil behind the arcade are for the far view: they ease down with the lens's distance up-river of the viaduct (places, not moments)
          if (beacon) beacon.uniforms.uIntensity.value = 2.2 * (1 - 0.86 * sm(sqZ + 40, pondZ - 34, lz));      // (full from above the square, eased down by the pond's foot)
          if (veil) veil.uniforms.uIntensity.value = veilK * (1 - sm(sqZ, pondZ + 34, lz));      // (it is the town's view of the arcade: gone by the pond's head, where the arches themselves take over)
          for (const f of fades) { const k = 1 - sm(f.full, f.gone, Math.hypot(lx - f.at[0], ly - f.at[1], lz - f.at[2])); for (const q of f.u) q.value = k; f.obj.visible = k > 0.002; }
          for (const L of lampSets) {
            let n = 0, ch = false;
            for (let i = 0; i < L.pos.length; i++) {
              const q = L.pos[i], k = 1 - sm(265, 315, Math.hypot(lx - q[0], ly - q[1], lz - q[2]));
              if (k > 0.002) n = i + 1;
              if (Math.abs(k - L.k[i]) > 1e-3) { L.k[i] = k; const e = Math.max(k, 1e-3); L.inst.setMatrixAt(i, lampM.copy(L.base[i]).scale(lampS.set(e, e, e))); ch = true; }
            }
            if (ch) L.inst.instanceMatrix.needsUpdate = true;
            L.inst.count = n;
          }
          viewM.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix);
          pondLife.visible = ctx.through || inView(pondBox); upRiver.visible = ctx.through || inView(upBox);
        }
        if (squallBack) squallBack.material.uniforms.uWind.value.y = squallK * (1 - sm(uMeet - 0.11, uMeet - 0.03, u));
        mats.update(dt, t); set.update(dt, t, camera);
        if (wheel) wheel.rotation.z = -0.32 * t;
        if (camera && ctx.renderer) { const h = ctx.renderer.getDrawingBufferSize(bufSz).y, e = camera.projectionMatrix.elements[5]; if (h > 0 && e > 0.01) garl.uniforms.uPx.value = 0.8 / (e * h); }
      },
      dispose() {
        hero.dispose();
        for (const o of updaters) if (typeof o.dispose === 'function') o.dispose();
        for (const o of [set, mats, land, wnd]) if (o && typeof o.dispose === 'function') o.dispose();
      },
    };
  },
};
