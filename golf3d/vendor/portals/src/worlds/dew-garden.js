// THE DEW GARDEN: an insect's flight through a back-garden lawn at sunrise, built at 100x scale.
// Grass blades are a back-lit forest, dew drops are lenses holding the garden upside down, and at the
// far end of a toadstool-ring clearing the Web (src/parts/dew-garden.js) stands against the sun with
// the exit portal in its open hub.
//
// Layout: the Web (the hero, 1.3 times its own size) stands in the z = 0 plane facing +Z, the sun is
// low behind it (-Z). The path enters at z ~ 420 among the blades
// and passes, one after another: a blade arched over the aisle with a necklace of drops
// (u 0.12), the big drop (u 0.18-0.2), a lone toadstool whose cap the route passes under (u 0.25),
// the ladybird on its blade (u 0.325; it then flies ahead down the aisle) and a dandelion clock
// that lets a score of its seeds go (from u 0.38); they ride on ahead of the camera as a loose
// drift of tufts until about u 0.6. The drop, the toadstool and the ladybird stand on one side and
// the clock on the other, and the gaze (gazeAt) goes from one to the next in one slow sweep. The
// route climbs out between the parting blades
// and runs down the clearing LOW (12-14 m; the hub is at 34 m and the route rises to it over the
// last 80 m) in one gentle weave, each bend passing a subject of its own close by: the elder
// toadstool of the ring, a small orb web strung between two blades, a self-sown foxglove with a
// fat drop on every lip; the two damselflies cross near the lens on unbroken lines. From the run
// the Web stands against a dark band of tree crowns with the sun in the notch behind its upper
// half, the bed straight behind it in shade with the tulip cups standing up into the light, and
// shafts of gold streaming through it.
//
// Everything is self-lit by custom shaders sharing one sun / sky / wind uniform set (no scene
// lights), so the low back-light, translucency and rims are identical on every plant.
//
// Variations by visit. HOUR (ctx.vary.hour honoured: dawn/night -> first light, golden -> sunrise,
// day -> the misty hour; otherwise by seed): FIRST LIGHT (rose and violet, cold blue shade, heavy dew,
// pools of mist), FULL SUNRISE (peach and gold), THE MISTY HOUR (pale gold, thick luminous mist, long
// shafts, pollen on the air). DENSITY (ctx.vary.density): how thick the blades stand away from the
// route, how much dew, how many daisies, clover and floor litter. RARE (ctx.vary.rare): the snail, a
// house-sized amber shell gliding into the clearing beside the run, horns waving, a wet trail behind it.
// ctx.quality.detail thins far blades, lawn tufts, floor litter, bokeh and pollen; never the cast.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, stepNormals } from '../parts/dew-garden.js';

const PALETTE = ['#ffe6b8', '#bfe3a0', '#5f9e3a', '#2e5a22', '#3a2a1a', '#e8f4ff', '#ff5a7a'];
const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ shared GLSL
// One wind for everything. sp = spatial phase (baked per plant on the CPU so that drops, seeds and
// the ladybird can ride the same motion), rp = random phase, amp = metres at the tip, s = 0..1 height.
const GLSL_SWAY = /* glsl */`
  uniform float uTime; uniform vec3 uWindV;
  vec3 swayOff(float sp, float rp, float amp, float s) {
    float gust = 0.6 + 0.4 * sin(uTime * 0.21 + sp * 0.37);
    float nod = (sin(uTime * 0.8 + sp) * 0.7 + sin(uTime * 1.9 + rp) * 0.3) * gust;
    float a = amp * s * s * uWindV.z;
    vec2 d = uWindV.xy * nod * a + vec2(-uWindV.y, uWindV.x) * sin(uTime * 1.3 + rp * 1.7) * a * 0.3;
    return vec3(d.x, -abs(nod) * a * 0.12, d.y);
  }`;
// the same function on the CPU
function swayOffJS(out, time, wind, sp, rp, amp, s) {
  const gust = 0.6 + 0.4 * Math.sin(time * 0.21 + sp * 0.37);
  const nod = (Math.sin(time * 0.8 + sp) * 0.7 + Math.sin(time * 1.9 + rp) * 0.3) * gust;
  const a = amp * s * s * wind.z, c = Math.sin(time * 1.3 + rp * 1.7) * a * 0.3;
  return out.set(wind.x * nod * a - wind.y * c, -Math.abs(nod) * a * 0.12, wind.y * nod * a + wind.x * c);
}
const GLSL_HASH = /* glsl */`
  float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  float vn3(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    return mix(mix(mix(hash11(n), hash11(n + 1.0), f.x), mix(hash11(n + 57.0), hash11(n + 58.0), f.x), f.y),
               mix(mix(hash11(n + 113.0), hash11(n + 114.0), f.x), mix(hash11(n + 170.0), hash11(n + 171.0), f.x), f.y), f.z);
  }`;
const GLSL_FOGF = /* glsl */`
  float fogF() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }`;
const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);

// ------------------------------------------------------------------ plant material
// Self-lit plant shader: hemisphere ambient, wrapped sun, transmission through thin tissue when the
// sun is behind it, a bright rim toward the sun, darkening toward the soil. aData = (thin, sway
// height 0..1, kind, tint mask). kind: 1 blade, 2 clover leaflet, 3 toadstool cap, 4 petal, 5 moss,
// 6 ladybird wing case, 7 tulip petal, 8 gills, 9 damselfly body. Works instanced (iVar = spatial
// phase, random phase, sway amplitude, blade bend; iCol = tint) and plain.
function makePlantMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, vertexColors: true,
    uniforms: { ...fogU(), uTime: U.uTime, uWindV: U.uWindV, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uLeafSun: U.uLeafSun, uSkyCol: U.uSkyCol,
      uGroundCol: U.uGroundCol, uShade: U.uShade, uMist: U.uMist, uMistCol: U.uMistCol },
    vertexShader: /* glsl */`
      attribute vec4 aData; attribute vec4 iVar; attribute vec3 iCol;
      varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec4 vData; varying vec3 vTint;
      #include <fog_pars_vertex>
      ${GLSL_SWAY}
      void main() {
        vCol = color; vUv = uv; vData = aData;
        vec3 p = position, n = normal;
        #ifdef USE_INSTANCING
          float isBlade = step(0.5, aData.z) * step(aData.z, 1.5);
          float b = iVar.w * isBlade;
          n = normalize(vec3(n.x, n.y - 2.0 * b * p.y * n.z, n.z));
          p.z += b * p.y * p.y;
          mat4 im = modelMatrix * instanceMatrix;
          vec3 sc = vec3(dot(im[0].xyz, im[0].xyz), dot(im[1].xyz, im[1].xyz), dot(im[2].xyz, im[2].xyz));
          vec4 wp = im * vec4(p, 1.0);
          vN = normalize(mat3(im) * (n / sc));
          wp.xyz += swayOff(iVar.x, iVar.y, iVar.z, aData.y);
          vTint = mix(vec3(1.0), iCol, aData.w);
        #else
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vN = normalize(mat3(modelMatrix) * n);
          vTint = vec3(1.0);
        #endif
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uLeafSun, uSkyCol, uGroundCol, uMist, uMistCol; uniform vec2 uShade;
      varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec4 vData; varying vec3 vTint;
      #include <fog_pars_fragment>
      ${GLSL_HASH}
      void main() {
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vW), L = uSunDir;
        vec3 alb = vCol * vTint; float thin = vData.x, kind = vData.z, gloss = 0.0, fuzz = 0.0, glow = 0.0, edge = 0.0;
        if (kind > 0.5 && kind < 1.5) {                 // grass blade: parallel veins, pale midrib
          float rib = 0.5 + 0.5 * cos(vUv.x * 22.0);
          alb *= 0.84 + 0.22 * rib;
          alb = mix(alb, alb * 1.3 + vec3(0.02, 0.03, 0.0), 1.0 - smoothstep(0.0, 0.16, abs(vUv.x)));
          thin *= 0.75 + 0.35 * rib; gloss = 0.25;
        } else if (kind < 2.5) { if (kind > 1.5) {      // clover leaflet: pale chevron, side veins
          float ch = abs(vUv.y - 0.36 - 0.3 * abs(vUv.x));
          float band = 1.0 - smoothstep(0.03, 0.1, ch);
          alb = mix(alb, alb * 1.45 + vec3(0.06, 0.08, 0.05), band * 0.65);
          float vein = smoothstep(0.78, 1.0, abs(fract(vUv.y * 9.0 - abs(vUv.x) * 3.0) - 0.5) * 2.0);
          alb *= 1.0 + 0.2 * vein - 0.25 * (1.0 - smoothstep(0.0, 0.07, abs(vUv.x)));
        } } else if (kind < 3.5) {                      // toadstool cap: pale warts
          vec2 g = vUv * 4.3; vec2 c = floor(g), f = fract(g) - 0.5;
          vec2 o = (vec2(hash21(c), hash21(c + 7.3)) - 0.5) * 0.5;
          float sz = 0.1 + 0.17 * hash21(c + 3.1);
          float spot = 1.0 - smoothstep(sz, sz + 0.05, length(f - o));
          // the skin: crimson at the crown paling to orange-red at the margin, cloudy, finely pitted, with the margin's
          // radial grooves; each wart is a crumb of veil standing on the skin, with a shadow round its foot
          float rr = clamp(length(vUv), 0.0, 1.0), ang = atan(vUv.y, abs(vUv.x) < 1e-5 ? 1e-5 : vUv.x) * 86.0;
          g = vUv / max(rr, 1e-4) * asin(min(rr, 0.999)) * 3.4; c = floor(g); f = fract(g) - 0.5;      // warts laid out along the dome's arc, so they stay round down its steep side
          o = (vec2(hash21(c), hash21(c + 7.3)) - 0.5) * 0.5; sz = 0.1 + 0.17 * hash21(c + 3.1);
          spot = 1.0 - smoothstep(sz, sz + 0.05, length(f - o));
          float cloud = vn3(vW * 1.1 + 5.0), pit = vn3(vW * 7.0 + 2.0);
          alb *= mix(vec3(0.74, 0.6, 0.62), vec3(1.14, 1.12, 0.98), smoothstep(0.15, 1.0, rr)) * (0.74 + 0.42 * cloud) * (0.9 + 0.2 * pit);
          alb *= 1.0 - 0.24 * smoothstep(0.93, 0.995, rr) * (0.5 + 0.5 * cos(ang)) * (1.0 - smoothstep(1.2, 2.6, fwidth(ang)));
          float foot = (1.0 - smoothstep(sz + 0.04, sz + 0.15, length(f - o))) * (1.0 - spot);
          alb *= 1.0 - 0.42 * foot;
          alb = mix(alb, vec3(0.8, 0.76, 0.68) * (0.78 + 0.34 * vn3(vW * 9.0 + 1.0)), spot); thin *= 1.0 - 0.7 * spot; gloss = 0.5 * (1.0 - spot) * (0.35 + 0.9 * cloud);
        } else if (kind < 4.5) {                        // petal: fine streaks
          alb *= 0.9 + 0.1 * sin(vUv.x * 9.0) * sin(vUv.y * 3.0 + 1.0);
        } else if (kind < 5.5) {                        // moss: mottled fuzz
          float m = 0.55 * vn3(vW * 0.9) + 0.45 * vn3(vW * 2.6 + 7.0);
          float tuft = vn3(vW * 7.0 + 3.0), fine = vn3(vW * 19.0);
          alb *= (0.3 + 0.95 * m) * (0.45 + 0.7 * tuft + 0.45 * fine * fine);
          alb = mix(alb, alb * vec3(1.35, 1.25, 0.6), smoothstep(0.55, 0.9, tuft * 0.6 + fine * 0.5));   // pale sporophyte tips
          thin *= 0.25 + 0.75 * m; fuzz = 0.3 + 1.0 * fine * tuft;
        } else if (kind < 6.5) {                        // ladybird wing case: black spots, lacquer
          vec2 g = vec2(vUv.x * 2.0, vUv.y * 3.0); vec2 c = floor(g), f = fract(g) - 0.5;
          vec2 o = (vec2(hash21(c + 1.3), hash21(c + 5.7)) - 0.5) * 0.3;
          float spot = 1.0 - smoothstep(0.2, 0.25, length(f - o));
          alb = mix(alb, vec3(0.012), spot); gloss = 1.1; glow = 0.5; thin = max(thin, 0.5);   // lacquer the low sun shines through: red even against the light
        } else if (kind < 7.5) {                        // tulip petal: feathered streaks, pale base
          alb *= 0.84 + 0.16 * sin(vUv.x * 16.0 + sin(vUv.y * 5.0) * 1.5);
          alb = mix(alb, vec3(0.85, 0.8, 0.45), (1.0 - smoothstep(0.0, 0.3, vUv.y)) * 0.55);
          thin *= 0.7 + 0.3 * vUv.y;
          edge = smoothstep(0.84, 1.0, vUv.y) * 0.9 + smoothstep(0.78, 1.0, abs(vUv.x)) * 0.35;     // the rim of the cup catches the sun
        } else if (kind < 8.5) {                        // gills
          float gl = abs(fract(vUv.x * 70.0) - 0.5) * 2.0; alb *= 0.55 + 0.5 * gl; thin *= 0.5 + 0.5 * gl;
        } else if (kind < 9.5) { gloss = 1.2; glow = 1.0; }   // damselfly / beetle body: enamel
        else if (kind < 10.5) {                         // wet pebble, soil crumb, snail skin: speckled, glossy, a lit edge toward the sun
          float sp = vn3(vW * 5.0), sp2 = vn3(vW * 17.0 + 3.0);
          alb *= (0.55 + 0.6 * sp) * (0.8 + 0.4 * step(0.62, sp2)); gloss = 0.55; edge = 0.55;
        } else {                                        // snail shell: amber, dark bands that follow the whorl, growth lines, lacquer
          float band = smoothstep(0.26, 0.44, abs(fract(vUv.x * 3.0 + 0.12) - 0.5));
          alb *= mix(vec3(0.4, 0.17, 0.06), vec3(1.0), band) * (0.84 + 0.16 * sin(vUv.y * 380.0)); gloss = 1.0; edge = 0.2;
        }
        float ndl = dot(N, L);
        vec3 amb = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
        vec3 col = alb * (amb + uLeafSun * max(ndl * 0.8 + 0.2, 0.0) * 1.3);
        float toSun = max(dot(-V, L), 0.0);
        col += alb * (0.35 + 0.65 * alb) * uLeafSun * max(-ndl, 0.0) * thin * (0.9 + 1.5 * toSun * toSun);   // through a leaf the light comes out green whatever the hour: uLeafSun
        col += alb * uSkyCol * thin * 1.3 * max(-N.y, 0.0);       // sky light coming down through leaves and petals seen from below
        float rim = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0);
        vec3 lit = mix(uSunCol, alb * 2.2, 0.6) * rim * (0.1 + 1.2 * toSun * toSun * toSun) * (0.35 + 0.65 * thin);
        lit += mix(alb, vec3(0.75, 0.95, 0.35), 0.5) * uSunCol * fuzz * rim * (0.35 + 2.6 * toSun * toSun);                         // moss: a lime halo of back-lit fuzz
        lit += alb * glow * (0.3 + 0.5 * max(N.y, 0.0) + 1.8 * rim);                                                                // insect enamel catches the back-light
        lit += uSunCol * alb * edge * (0.25 + 1.5 * rim + 1.3 * max(-ndl, 0.0)) * (0.35 + 0.65 * toSun);                            // lit edges: tulip rims, wet stones
        vec3 R = reflect(-V, N);
        lit += gloss * (uSunCol * 2.5 * pow(max(dot(R, L), 0.0), 50.0) + uSkyCol * 0.5 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 2.0));
        float sh = smoothstep(0.0, uShade.y, vW.y);
        col *= mix(vec3(0.5, 0.75, 0.62) * uShade.x, vec3(1.0), sh);
        col += lit * mix(0.62, 1.0, sh);                // the deep shade at soil level dims the body colour more than the lights on its edges
        // the bed straight behind the Web lies in the band's shadow, deep green, so that the beads have the dark behind them;
        // the tulip cups stand up into the light and keep their colour
        col *= 1.0 - (kind > 6.5 && kind < 7.5 ? 0.2 : 0.74) * (1.0 - smoothstep(62.0 + max(0.0, -vW.z - 30.0) * 0.5, 112.0 + max(0.0, -vW.z - 30.0) * 0.5, abs(vW.x))) * (1.0 - smoothstep(-24.0, -4.0, vW.z));
        col = mix(col, uMistCol, uMist.x * (1.0 - exp(-vFogDepth * uMist.y)) * (1.0 - smoothstep(0.0, uMist.z, vW.y)) * (0.2 + 0.8 * smoothstep(-50.0, 20.0, vW.z)) * (0.76 + 0.24 * smoothstep(148.0, 184.0, vW.z)));   // no gold veil behind the Web: its beads need the dark; and a quarter less of it over the open ground of the clearing than among the blades
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ mesh accumulator
function makeAcc() { return { p: [], c: [], uv: [], d: [], i: [], n: 0 }; }
// data = [thin, sway, kind, tint]
function vtx(a, x, y, z, col, u, v, data) {
  a.p.push(x, y, z); a.c.push(col.r, col.g, col.b); a.uv.push(u, v); a.d.push(data[0], data[1], data[2], data[3]);
  return a.n++;
}
function quadIdx(a, i0, i1, i2, i3) { a.i.push(i0, i1, i2, i2, i1, i3); }
function accToGeometry(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(a.c, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2));
  g.setAttribute('aData', new THREE.Float32BufferAttribute(a.d, 4));
  g.setIndex(a.i);
  g.computeVertexNormals();
  return g;
}
const _c = new THREE.Color();
const mixCol = (a, b, t, mul = 1) => _c.copy(a).lerp(b, t).multiplyScalar(mul).clone();

// grid surface: fn(u, v) -> [x, y, z, col, sway], u and v in 0..1; uv = (uMap(u), v)
function addGrid(a, nu, nv, fn, data, uRange = [-1, 1]) {
  const base = a.n;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv, r = fn(u, v);
    vtx(a, r[0], r[1], r[2], r[3], lerp(uRange[0], uRange[1], u), v, [data[0], r[4] ?? data[1], data[2], data[3]]);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const k = base + j * (nu + 1) + i;
    quadIdx(a, k, k + 1, k + nu + 1, k + nu + 2);
  }
}
// tube along pts (Vector3[]); rad(t), col(t), sway(t)
function addTube(a, pts, sides, rad, col, sway, data) {
  const base = a.n, n = pts.length, T = V3(), A = V3(), B = V3();
  for (let j = 0; j < n; j++) {
    const t = j / (n - 1);
    T.copy(pts[Math.min(n - 1, j + 1)]).sub(pts[Math.max(0, j - 1)]).normalize();
    A.set(1, 0, 0); if (Math.abs(T.x) > 0.9) A.set(0, 0, 1);
    B.crossVectors(T, A).normalize(); A.crossVectors(B, T).normalize();
    const r = rad(t), c = col(t), s = sway(t);
    for (let i = 0; i <= sides; i++) {
      const an = (i / sides) * TAU, cx = Math.cos(an) * r, cz = Math.sin(an) * r;
      vtx(a, pts[j].x + A.x * cx + B.x * cz, pts[j].y + A.y * cx + B.y * cz, pts[j].z + A.z * cx + B.z * cz, c, i / sides, t, [data[0], s, data[2], data[3]]);
    }
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < sides; i++) {
    const k = base + j * (sides + 1) + i;
    quadIdx(a, k, k + sides + 1, k + 1, k + sides + 2);
  }
}
// lathe around the Y axis: prof = [[r, y, col, kind, thin], ...] bottom to top; uv = cap-plane coords (kind 3) or (angle, r)
function addLathe(a, prof, sides, R) {
  const base = a.n;
  for (let j = 0; j < prof.length; j++) {
    const [r, y, col, kind, thin] = prof[j];
    for (let i = 0; i <= sides; i++) {
      const an = (i / sides) * TAU, x = Math.cos(an) * r, z = Math.sin(an) * r;
      const cap = kind === 3;
      vtx(a, x, y, z, col, cap ? x / R : i / sides, cap ? z / R : r / R, [thin, 0, kind, 0]);
    }
  }
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < sides; i++) {
    const k = base + j * (sides + 1) + i;
    quadIdx(a, k, k + sides + 1, k + 1, k + sides + 2);
  }
}

// ------------------------------------------------------------------ plant geometry
// Grass blade, unit size: 1 tall, 1 wide at its widest, V-folded, 6 segments. The instance matrix
// gives width and height; the arch is bent in the vertex shader (iVar.w) so every blade differs.
const BLADE_ROWS = [0, 0.1, 0.24, 0.42, 0.6, 0.8, 1];
const bladeHalfWidth = (y) => 0.5 * (y < 0.25 ? 0.72 + 0.28 * (y / 0.25) : Math.pow(Math.max(0, 1 - (y - 0.25) / 0.75), 0.8));
const bladeCol = (pal) => {
  const deep = pal[3].clone().multiplyScalar(0.75), mid = pal[2].clone(), lime = pal[1].clone().lerp(pal[2], 0.35), tip = pal[1].clone().lerp(pal[0], 0.35);
  return (y) => (y < 0.3 ? mixCol(deep, mid, y / 0.3) : y < 0.75 ? mixCol(mid, lime, (y - 0.3) / 0.45) : mixCol(lime, tip, (y - 0.75) / 0.25));
};
// flat = a plain tapering ribbon, two triangles a segment, for blades that are only ever seen far off
function bladeGeometry(pal, rows = BLADE_ROWS, flat = false) {
  const a = makeAcc(), colAt = bladeCol(pal);
  for (let j = 0; j < rows.length; j++) {
    const y = rows[j], hw = Math.max(bladeHalfWidth(y), 0.03), col = colAt(y);
    const d = [lerp(0.55, 1, smoothstep(0, 0.5, y)), y, 1, 1];
    if (flat) {
      vtx(a, -hw, y, 0, col, -1, y, d); vtx(a, hw, y, 0, col, 1, y, d);
      if (j > 0) { const k = (j - 1) * 2; quadIdx(a, k, k + 1, k + 2, k + 3); }
    } else {
      vtx(a, -hw, y, 0, col, -1, y, d); vtx(a, 0, y, -hw * 0.42, col, 0, y, d); vtx(a, hw, y, 0, col, 1, y, d);
      if (j > 0) { const k = (j - 1) * 3; quadIdx(a, k, k + 1, k + 3, k + 4); quadIdx(a, k + 1, k + 2, k + 4, k + 5); }
    }
  }
  return accToGeometry(a);
}
// The blade that holds the big drop: it rises, arches over and comes down, its tip pointing at the ground `reach`
// metres out along +Z and tipY above its root, bowed by the weight of the water. Sways as one piece with its drop.
function archBladeGeometry(pal, reach, tipY, W, rise = 5.2) {
  const a = makeAcc(), colAt = bladeCol(pal), N = 18, top = tipY + rise;
  const P = [[0, 0], [-0.08 * reach, top * 0.95], [0.72 * reach, top * 1.32], [reach, tipY]];
  const bez = (t, k) => { const s = 1 - t; return s * s * s * P[0][k] + 3 * s * s * t * P[1][k] + 3 * s * t * t * P[2][k] + t * t * t * P[3][k]; };
  for (let j = 0; j <= N; j++) {
    const t = j / N, z = bez(t, 0), y = bez(t, 1), dz = bez(Math.min(1, t + 0.01), 0) - bez(Math.max(0, t - 0.01), 0), dy = bez(Math.min(1, t + 0.01), 1) - bez(Math.max(0, t - 0.01), 1), l = Math.hypot(dz, dy) || 1;
    const hw = 0.5 * W * (t < 0.2 ? 0.75 + 0.25 * (t / 0.2) : Math.pow(Math.max(0, 1 - (t - 0.2) / 0.8), 0.7)) + 0.05, col = colAt(Math.min(1, t * 1.15));
    const ny = dz / l, nz = -dy / l, d = [lerp(0.55, 1, smoothstep(0, 0.4, t)), Math.sqrt(t), 1, 1];
    vtx(a, -hw, y, z, col, -1, t, d); vtx(a, 0, y - ny * hw * 0.42, z - nz * hw * 0.42, col, 0, t, d); vtx(a, hw, y, z, col, 1, t, d);
    if (j > 0) { const k = (j - 1) * 3; quadIdx(a, k, k + 1, k + 3, k + 4); quadIdx(a, k + 1, k + 2, k + 4, k + 5); }
  }
  return accToGeometry(a);
}

// Clover: an arcing stem carrying three heart-shaped leaflets, about 10 m tall and leaning `lean`
// metres along +X. Leaf centre ends up at (lean, H, 0).
function cloverGeometry(pal, rng, H = 10, lean = 4, R = 2.7, lo = false) {
  const a = makeAcc();
  const stemC = pal[2].clone().lerp(pal[1], 0.3).multiplyScalar(0.8), leafA = pal[2].clone().lerp(pal[1], 0.25), leafB = pal[1].clone().multiplyScalar(0.95);
  const pts = [];
  for (let j = 0; j <= 5; j++) { const t = j / 5; pts.push(V3(lean * t * t, H * (t - 0.06 * Math.sin(t * Math.PI)), 0.5 * Math.sin(t * 3))); }
  addTube(a, lo ? [pts[0], pts[2], pts[5]] : pts, lo ? 3 : 5, (t) => lerp(0.3, 0.14, t), () => stemC, (t) => t, [0.5, 0, 0, 1]);
  const top = pts[5];
  const leaves = [];
  for (let k = 0; k < 3; k++) {
    const an = (k / 3) * TAU + 0.4, ca = Math.cos(an), sa = Math.sin(an), droop = rng.range(0.1, 0.28), cup = rng.range(0.1, 0.22);
    leaves.push({ ca, sa, droop, cup });
    addGrid(a, lo ? 2 : 4, lo ? 3 : 4, (u, v) => {
      const uu = u * 2 - 1;
      const w = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72) * 0.94 + 0.04), 0.7) * 0.66;
      const len = v * (1 - 0.2 * Math.pow(1 - Math.abs(uu), 2) * smoothstep(0.55, 1, v));
      const lx = len * R * 1.05 + 0.12, lz = uu * w * R;
      const ly = -droop * R * len * len + cup * R * Math.abs(uu) * w - 0.03;
      return [top.x + ca * lx - sa * lz, top.y + ly, top.z + sa * lx + ca * lz, mixCol(leafA, leafB, v * 0.6 + 0.4 * Math.abs(uu)), 1];
    }, [0.95, 1, 2, 1]);
  }
  const g = accToGeometry(a);
  // a point on the rim of leaflet k (v along it, uu across it, -1..1), in the plant's own frame: where a drop can hang
  g.userData.rim = (k, v, uu, out) => {
    const { ca, sa, droop, cup } = leaves[k], w = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72) * 0.94 + 0.04), 0.7) * 0.66;
    const len = v * (1 - 0.2 * Math.pow(1 - Math.abs(uu), 2) * smoothstep(0.55, 1, v)), lx = len * R * 1.05 + 0.12, lz = uu * w * R;
    return out.set(top.x + ca * lx - sa * lz, top.y - droop * R * len * len + cup * R * Math.abs(uu) * w - 0.03, top.z + sa * lx + ca * lz);
  };
  return g;
}

// Daisy: stem H tall, a ring of white rays round a yellow dome, green calyx underneath.
function daisyGeometry(pal, rng, H = 16) {
  const a = makeAcc();
  const stemC = pal[2].clone().multiplyScalar(0.8), white = new THREE.Color(0.8, 0.79, 0.74), blush = white.clone().lerp(pal[6], 0.22);
  const yel = new THREE.Color(0.85, 0.6, 0.08), yelD = new THREE.Color(0.6, 0.36, 0.04);
  const pts = [];
  for (let j = 0; j <= 5; j++) { const t = j / 5; pts.push(V3(1.4 * Math.sin(t * 1.9), H * t, 0.8 * t * t)); }
  addTube(a, pts, 5, (t) => lerp(0.26, 0.16, t), () => stemC, (t) => t, [0.4, 0, 0, 1]);
  const top = pts[5], tilt = 0.3, ct = Math.cos(tilt), st = Math.sin(tilt);
  const place = (x, y, z) => [top.x + x, top.y + y * ct - z * st, top.z + y * st + z * ct];
  const NP = 26;
  for (let k = 0; k < NP; k++) {
    const an = (k / NP) * TAU + rng.range(-0.05, 0.05), len = rng.range(1.75, 2.25), w = rng.range(0.2, 0.26), dr = rng.range(-0.05, 0.25);
    const ca = Math.cos(an), sa = Math.sin(an);
    addGrid(a, 1, 2, (u, v) => {
      const r = 0.6 + v * len, ww = (u * 2 - 1) * w * (v < 0.5 ? 0.6 + 0.8 * v : 1.0 - 0.5 * (v - 0.5) * 2);
      const p = place(ca * r - sa * ww, 0.12 - dr * v * v * len * 0.5 + 0.08 * (1 - Math.abs(u * 2 - 1)), sa * r + ca * ww);
      return [p[0], p[1], p[2], v < 0.1 ? blush : mixCol(white, blush, v * v * 0.5), 1];
    }, [0.9, 1, 4, 0]);
  }
  addGrid(a, 8, 3, (u, v) => {            // yellow disc florets
    const ph = v * 1.35, r = Math.sin(ph) * 0.78, an = u * TAU;
    const p = place(Math.cos(an) * r, 0.16 + (Math.cos(ph) - 0.22) * 0.5, Math.sin(an) * r);
    return [p[0], p[1], p[2], mixCol(yelD, yel, 1 - v * 0.6), 1];
  }, [0.2, 1, 0, 0]);
  addGrid(a, 8, 1, (u, v) => {            // calyx
    const r = lerp(0.2, 0.85, v), an = u * TAU;
    const p = place(Math.cos(an) * r, -0.5 + 0.55 * v, Math.sin(an) * r);
    return [p[0], p[1], p[2], stemC, 1];
  }, [0.3, 1, 0, 1]);
  const g = accToGeometry(a); g.userData.top = top.clone();
  return g;
}

// Dandelion stem, unit height with a receptacle on top (instance scale = (r, H, r)).
function dandelionStemGeometry(pal) {
  const a = makeAcc();
  const c0 = pal[2].clone().lerp(pal[1], 0.5).multiplyScalar(0.8), c1 = pal[1].clone().lerp(pal[6], 0.25).multiplyScalar(0.75);
  const pts = []; for (let j = 0; j <= 4; j++) pts.push(V3(0, j / 4, 0));
  addTube(a, pts, 6, (t) => lerp(0.42, 0.26, t), (t) => mixCol(c0, c1, t), (t) => t, [0.6, 0, 0, 1]);
  return accToGeometry(a);
}
// One dandelion seed: stalk along +Y from the receptacle (y 0.4) to the pappus, a shallow cone of
// filaments (drawn additively as fine radial lines). uv.y < 0 marks the stalk.
const SEED_LEN = 1.55, SEED_R = 0.62;
function seedGeometry() {
  const p = [], uv = [], idx = [];
  const y0 = 0.4, y1 = SEED_LEN - 0.3, w = 0.02;
  for (const [dx, dz] of [[w, 0], [0, w]]) {
    const b = p.length / 3;
    p.push(-dx, y0, -dz, dx, y0, dz, -dx, y1, -dz, dx, y1, dz); uv.push(0, -1, 1, -1, 0, -1, 1, -1);
    idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
  }
  for (const [dx, dz] of [[0.04, 0], [0, 0.04]]) {       // the seed itself: a small dark spindle at the foot of the stalk
    const b = p.length / 3;
    p.push(-dx * 0.4, y0 - 0.04, -dz * 0.4, dx * 0.4, y0 - 0.04, dz * 0.4, -dx, y0 + 0.1, -dz, dx, y0 + 0.1, dz, -dx * 0.4, y0 + 0.3, -dz * 0.4, dx * 0.4, y0 + 0.3, dz * 0.4);
    uv.push(0, -2, 1, -2, 0, -2, 1, -2, 0, -2, 1, -2);
    idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3, b + 2, b + 3, b + 4, b + 4, b + 3, b + 5);
  }
  const c = p.length / 3, N = 10;
  p.push(0, y1, 0); uv.push(0, 0);
  for (let k = 0; k <= N; k++) { const an = (k / N) * TAU; p.push(Math.cos(an) * SEED_R, SEED_LEN, Math.sin(an) * SEED_R); uv.push(k / N, 1); }
  for (let k = 0; k < N; k++) idx.push(c, c + 1 + k, c + 2 + k);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Toadstool (fly agaric), about 9 m tall with a 9.6 m cap.
function toadstoolGeometry(pal) {
  const a = makeAcc(), R = 4.8;
  const cream = new THREE.Color(0.74, 0.69, 0.58), creamD = cream.clone().multiplyScalar(0.7), gill = new THREE.Color(0.78, 0.72, 0.6);
  const red = pal[6].clone().lerp(new THREE.Color(0.8, 0.05, 0.03), 0.6).multiplyScalar(0.8), redD = red.clone().multiplyScalar(0.75);
  const prof = [
    [0.0, 0, creamD, 0, 0.15], [1.45, 0.05, creamD, 0, 0.15], [1.6, 0.7, cream, 0, 0.15], [1.05, 1.7, cream, 0, 0.15], [0.8, 4.4, cream, 0, 0.15],
    [1.5, 4.5, cream, 0, 0.5], [0.85, 5.2, cream, 0, 0.3], [0.8, 6.25, cream, 0, 0.15],
    [0.8, 6.25, gill, 8, 0.55], [4.55, 5.95, gill, 8, 0.6],
    [4.55, 5.95, redD, 3, 0.3], [4.8, 6.15, redD, 3, 0.3], [4.6, 6.9, red, 3, 0.25], [3.8, 7.8, red, 3, 0.2], [2.5, 8.55, red, 3, 0.2], [1.1, 8.95, red, 3, 0.2], [0, 9.05, red, 3, 0.2],
  ];
  addLathe(a, prof, 20, R);
  return accToGeometry(a);
}

// Moss cushion: a lumpy flattened dome, unit radius.
function mossGeometry(pal, rng, noise, detail = 3) {
  const src = new THREE.IcosahedronGeometry(1, detail), pos = src.attributes.position, a = makeAcc();
  const lo = pal[3].clone().multiplyScalar(0.7), hi = pal[2].clone().lerp(pal[1], 0.45);
  const ox = rng.range(0, 9), oz = rng.range(0, 9);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const b = 1 + 0.1 * Math.sin(x * 4 + ox) * Math.sin(z * 4 + oz) + 0.13 * noise.n3(x * 1.7 + ox, y * 1.7, z * 1.7 + oz) + 0.03 * noise.n3(x * 4 + oz, y * 4, z * 4 + ox);
    x *= b; z *= b; y = y * 0.6 * b; if (y < 0) y = -0.12 * (1 - Math.exp(y * 9));       // soft skirt instead of a hard cut
    vtx(a, x, y, z, mixCol(lo, hi, smoothstep(-0.1, 0.6, y)), x, z, [0.7, 1, 5, 1]);
    if (i % 3 === 2) a.i.push(i - 2, i - 1, i);
  }
  src.dispose();
  const g = accToGeometry(a), P = g.attributes.position, N = g.attributes.normal, v = V3();
  for (let i = 0; i < P.count; i++) { v.set(P.getX(i), Math.max(0.05, P.getY(i)) / 0.36, P.getZ(i)).normalize(); N.setXYZ(i, v.x, v.y, v.z); }   // smooth dome normals (the source is unindexed)
  return g;
}

// Pebble or soil crumb: a lumpy ball, unit radius, tinted per instance (kind 10: wet stone with a lit edge).
function pebbleGeometry(detail) {
  const src = new THREE.IcosahedronGeometry(1, detail), pos = src.attributes.position, a = makeAcc(), white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const b = 1 + 0.16 * Math.sin(x * 2.7 + 1.3) * Math.sin(z * 3.1 + 0.4) + 0.12 * Math.sin(y * 3.7 + x * 1.9);
    vtx(a, x * b, y * b, z * b, white, x * 0.5 + 0.5, z * 0.5 + 0.5, [0, 0, 10, 1]);
    if (i % 3 === 2) a.i.push(i - 2, i - 1, i);
  }
  src.dispose();
  const g = accToGeometry(a), P = g.attributes.position, N = g.attributes.normal, v = V3();
  for (let i = 0; i < P.count; i++) { v.set(P.getX(i), P.getY(i), P.getZ(i)).normalize(); N.setXYZ(i, v.x, v.y, v.z); }
  return g;
}

// A fallen petal lying on the soil, about 1 m long, curled at the rim; tinted per instance.
function petalGeometry() {
  const a = makeAcc(), white = new THREE.Color(0.9, 0.88, 0.84);
  addGrid(a, 2, 3, (u, v) => {
    const uu = u * 2 - 1, w = 0.3 * Math.pow(Math.sin(Math.PI * (0.08 + 0.9 * v)), 0.6);
    return [uu * w, 0.16 * uu * uu + 0.22 * v * v - 0.05, v - 0.5, white, 0];
  }, [0.9, 0, 4, 1]);
  return accToGeometry(a);
}

// Tulip, about 31 m tall: stem, two broad leaves, a deep cup of six petals tinted per instance. lo = the far rows.
function tulipGeometry(pal, rng, lo = false) {
  const a = makeAcc(), H = 21;
  const stemC = pal[2].clone().lerp(pal[1], 0.2).multiplyScalar(0.7), leafC = pal[2].clone().lerp(pal[3], 0.3), leafT = pal[1].clone().multiplyScalar(0.8);
  const white = new THREE.Color(0.82, 0.82, 0.82);
  const pts = [];
  for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push(V3(1.3 * Math.sin(t * 2.2), H * t, 0.8 * t * t)); }
  addTube(a, lo ? [pts[0], pts[2], pts[4]] : pts, lo ? 3 : 5, (t) => lerp(0.62, 0.42, t), () => stemC, (t) => t * 0.8, [0.3, 0, 0, 0]);
  for (let k = 0; k < 2; k++) {
    const an = k * Math.PI + rng.range(-0.5, 0.5), ca = Math.cos(an), sa = Math.sin(an), L = rng.range(13, 17), W = rng.range(1.6, 2.2);
    addGrid(a, lo ? 1 : 2, lo ? 3 : 5, (u, v) => {
      const uu = u * 2 - 1, w = W * Math.sin(Math.PI * Math.pow(v, 0.6) * 0.97 + 0.03);
      const out = 0.6 + 6 * v * v, up = L * v * (1 - 0.18 * v);
      const lx = out - Math.abs(uu) * 0.6, lz = uu * w + 0.7 * Math.sin(v * 5 + k);
      return [ca * lx - sa * lz, up, sa * lx + ca * lz, mixCol(leafC, leafT, v), v * 0.6];
    }, [0.85, 0, 1, 0]);
  }
  const top = pts[4], CH = 10.5;
  for (let k = 0; k < 6; k++) {
    const inner = k % 2, an = (k / 6) * TAU, rs = inner ? 0.86 : 1.0;
    addGrid(a, lo ? 2 : 3, lo ? 3 : 5, (u, v) => {
      const uu = u * 2 - 1;
      const rc = (0.6 + 3.5 * Math.pow(Math.sin(Math.min(1, v * 1.25) * Math.PI * 0.5), 0.8) - 0.75 * smoothstep(0.6, 1, v)) * rs;
      const dw = 0.78 * Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * v)), 0.55) * (1 - 0.55 * smoothstep(0.7, 1, v));
      const ph = an + uu * dw;
      return [top.x + Math.cos(ph) * rc, top.y - 0.2 + v * CH * (1 - 0.1 * uu * uu), top.z + Math.sin(ph) * rc, white, 0.8];
    }, [0.9, 0.8, 7, 1]);
  }
  return accToGeometry(a);
}

// ------------------------------------------------------------------ dew
// Instanced camera-facing lenses. iPos = centre + radius, iSw = the sway of the plant it sits on
// (spatial phase, random phase, amplitude, height), iDat = (seed, falls?, period s, phase 0..1).
// Close up: a refracted, inverted garden (blade silhouettes, sky, a tiny sun), fresnel reflection,
// dark edge and back-lit rim. Far away: a soft point with a view-dependent rainbow sparkle.
function makeDewMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: { ...fogU(), uTime: U.uTime, uWindV: U.uWindV, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uViewH: U.uViewH, uGain: U.uDewGain,
      uDewCol: U.uDewCol, uSkyZen: U.uSkyZen, uSkyHor: U.uSkyHor, uSkyMid: U.uSkyMid, uCloudLit: U.uCloudLit, uGrassA: U.uGrassA, uGrassB: U.uGrassB, uSoil: U.uSoil,
      uBandCol: U.uBandCol, uStool: U.uStool },
    vertexShader: /* glsl */`
      attribute vec4 iPos; attribute vec4 iSw; attribute vec4 iDat;
      uniform float uViewH;
      varying vec2 vUv; varying vec3 vW; varying vec2 vDat; varying float vLod; varying float vDim; varying float vBig;
      #include <fog_pars_vertex>
      ${GLSL_SWAY}
      const float Q = 2.4;
      void main() {
        vec3 p = iPos.xyz + swayOff(iSw.x, iSw.y, iSw.z, iSw.w);
        float r = iPos.w * (1.0 + 0.05 * sin(uTime * 3.1 + iDat.x * 40.0));
        float gone = 0.0, stretch = 1.0;
        if (iDat.y > 0.5) {
          float t = fract(uTime / iDat.z + iDat.w) * iDat.z, grow = iDat.z - 2.4, tf = max(0.0, t - grow);
          r *= 0.25 + 0.75 * smoothstep(0.0, grow * 0.8, t);
          p.y -= 0.5 * 9.0 * tf * tf;
          gone = step(p.y, 0.6); stretch = 1.0 + min(tf, 1.0) * 0.6;
        }
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vec4 mvPosition = viewMatrix * wp;
        float pxPerM = projectionMatrix[1][1] * uViewH * 0.5 / max(-mvPosition.z, 0.1);
        float rpx = r * pxPerM, rr = max(r, 1.3 / pxPerM);
        vLod = smoothstep(1.6, 4.5, rpx); vDim = clamp(rpx / 1.3, 0.0, 1.0); vBig = smoothstep(9.0, 30.0, rpx);
        vec2 ext = position.xy * Q * rr * (1.0 - gone);
        ext.x *= 1.0 + 0.04 * sin(uTime * 2.3 + iDat.x * 17.0); ext.y *= stretch * (1.0 - 0.04 * sin(uTime * 2.3 + iDat.x * 17.0));
        mvPosition.xy += ext;
        vUv = position.xy * Q; vDat = iDat.xw;
        vW = wp.xyz + vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]) * ext.x + vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * ext.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uDewCol, uSkyZen, uSkyHor, uSkyMid, uCloudLit, uGrassA, uGrassB, uSoil, uBandCol;
      uniform vec4 uStool;
      uniform float uGain, uTime;
      varying vec2 vUv; varying vec3 vW; varying vec2 vDat; varying float vLod; varying float vDim; varying float vBig;
      #include <fog_pars_fragment>
      ${GLSL_FOGF}
      ${GLSL_HASH}
      const float Q = 2.4;
      vec3 env(vec3 d) {
        float h = d.y, az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
        // the hour's own sky: its horizon colour at the grass tips, through the mid band to the colour overhead, with a few soft clouds
        vec3 sky = mix(uSkyHor * 0.92, uSkyMid, smoothstep(0.26, 0.56, h));
        sky = mix(sky, uSkyZen, smoothstep(0.5, 0.96, h));
        float cl = smoothstep(0.52, 0.7, vn3(vec3(d.x * 2.6, h * 4.5, d.z * 2.6) + 3.7)) * smoothstep(0.3, 0.46, h) * (1.0 - smoothstep(0.86, 0.985, h));
        sky = mix(sky, mix(uCloudLit, uSkyZen * 0.7, smoothstep(0.42, 0.92, h)), cl * 0.8);
        float sd = max(dot(d, uSunDir), 0.0);
        sky += uSunCol * (4.0 * smoothstep(0.984, 0.997, sd) + 0.7 * pow(sd, 40.0) + 0.15 * pow(sd, 6.0));
        float c1 = az * 8.0, c2 = az * 21.0 + 1.7;
        float t1 = 0.2 + 0.42 * hash11(floor(c1) + 3.0) * (1.0 - 2.0 * abs(fract(c1) - 0.5));
        float t2 = 0.08 + 0.34 * hash11(floor(c2) + 31.0) * (1.0 - 2.0 * abs(fract(c2) - 0.5));
        float tp = max(t1, t2);
        float gm = 1.0 - smoothstep(tp - 0.015, tp + 0.015, h);
        vec3 grass = mix(uGrassB * 0.6, uGrassA * 0.85, smoothstep(-0.2, tp, h)) * (0.5 + 0.8 * hash11(floor(c2) + 5.0));
        grass += uSunCol * uGrassA * 0.55 * pow(sd, 3.0);
        grass = mix(grass, uSoil, smoothstep(0.2, 0.75, -h));
        // beyond the grass tips, toward the sunrise, the dark band of the neighbours' crowns
        float bt = 0.3 + 0.07 * sin(az * 5.0 + 1.0) + 0.04 * sin(az * 13.0);
        sky = mix(sky, uBandCol, (1.0 - smoothstep(bt - 0.04, bt + 0.03, h)) * (1.0 - smoothstep(-0.35, 0.15, d.z)) * (1.0 - 0.75 * smoothstep(0.93, 0.99, sd)));
        vec3 col = mix(sky, grass, gm);
        // the toadstool that stands beyond the big drop: a red cap with pale warts on a cream stem
        float cs = dot(d, uStool.xyz);
        if (cs > 0.6 && uStool.w > 0.0) {
          vec3 rs = cross(vec3(0.0, 1.0, 0.0), uStool.xyz); rs = rs / max(length(rs), 1e-4);
          vec2 q = vec2(dot(d, rs), d.y - uStool.y) / cs;
          float cap = (1.0 - smoothstep(0.85, 1.0, length(vec2(q.x / 0.2, (q.y - 0.005) / 0.12)))) * smoothstep(-0.004, 0.012, q.y);
          float stem = (1.0 - smoothstep(0.026, 0.04, abs(q.x) * (1.0 + 1.3 * smoothstep(-0.2, 0.0, q.y)))) * smoothstep(-0.27, -0.24, q.y) * (1.0 - smoothstep(0.0, 0.01, q.y));
          vec2 wg = q * 26.0; float wart = 1.0 - smoothstep(0.16, 0.3, length(fract(wg) - 0.5 - 0.25 * (vec2(hash11(floor(wg.x) + 7.0 * floor(wg.y)), hash11(floor(wg.y) + 3.0)) - 0.5)));
          col = mix(col, vec3(0.7, 0.66, 0.56) * (0.5 + 0.5 * smoothstep(-0.03, 0.03, q.x)), stem * uStool.w);
          col = mix(col, mix(vec3(0.62, 0.05, 0.03) * (0.55 + 0.6 * smoothstep(-0.1, 0.12, q.y)), vec3(0.8, 0.76, 0.68), wart * 0.9), cap * uStool.w);
        }
        return col;
      }
      void main() {
        float r = length(vUv);
        vec3 L = uSunDir, V = normalize(vW - cameraPosition);
        float toSun = max(dot(V, L), 0.0); toSun = toSun * toSun * toSun;
        vec3 rdir = normalize(vec3(hash11(vDat.x * 91.0), hash11(vDat.x * 57.0 + 3.0), hash11(vDat.y * 33.0 + 7.0)) - 0.5 + vec3(0.0, 0.0, 1e-4));
        float sp = max(0.5 + 0.5 * sin(vDat.x * 6.283 + dot(cameraPosition, rdir) * 1.1 + uTime * 0.7), 0.0);
        float spark = pow(sp, 14.0);
        vec3 rb = mix(vec3(1.0), hue(vDat.y + dot(cameraPosition, vec3(0.043, 0.031, 0.027))) * 1.35, 0.6);
        vec4 near = vec4(0.0);
        if (r < 1.0) {
          vec3 n = vec3(vUv, sqrt(max(1.0 - r * r, 0.0)));
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 upv = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          vec3 fwd = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
          vec3 tang = right * n.x + upv * n.y;
          vec3 Nw = tang + fwd * n.z;
          vec3 c = env(normalize(V - tang * 1.75)) * vec3(0.95, 1.0, 1.05) * 1.15;
          vec3 rf = reflect(V, Nw);
          float fres = pow(clamp(1.0 - n.z, 0.0, 1.0), 3.0);
          c = mix(c, env(rf), 0.07 + 0.6 * fres);
          // glass: the picture darkens toward the edge and the outline is dark; the light the drop gathers comes out as a
          // crescent inside the edge away from the sun, with only a thread of rim light round the rest
          c *= mix(1.0, 0.26, smoothstep(0.5, 0.93, r));
          vec2 sdir = vec2(dot(L, right), dot(L, upv)); float sl = length(sdir); sdir = sl > 1e-3 ? sdir / sl : vec2(0.0, 1.0);
          float away = clamp(0.5 - 0.5 * dot(vUv / max(r, 1e-3), sdir), 0.0, 1.0);
          float cres = smoothstep(0.6, 0.88, r) * (1.0 - smoothstep(0.92, 1.0, r)) * away * away;
          c += uSunCol * (cres * (0.45 + 1.3 * toSun) + smoothstep(0.93, 0.985, r) * (0.07 + 0.3 * toSun));
          c += uSunCol * 8.0 * pow(clamp(dot(rf, L), 0.0, 1.0), 160.0);
          vec2 wq = vUv - vec2(-0.4, 0.44); wq = vec2(wq.x * 0.77 + wq.y * 0.64, -wq.x * 0.64 + wq.y * 0.77) * vec2(3.6, 9.0);
          c += (uSkyZen + vec3(0.35)) * 0.55 * (1.0 - smoothstep(0.5, 1.0, length(wq)));      // the sky's window on its shoulder
          float a = 1.0 - smoothstep(1.0 - max(fwidth(r), 1e-4) * 1.5, 1.0, r);
          near = vec4(c * a, a);
        }
        vec2 q = mix(vUv, (vUv - vec2(0.56, 0.66)) * 6.5, vBig);
        float star = exp(-dot(q, q) * 2.6) + 0.55 * exp(-abs(q.x) * 9.0 - abs(q.y) * 1.7) + 0.55 * exp(-abs(q.y) * 9.0 - abs(q.x) * 1.7);
        star *= 1.0 - smoothstep(Q * 0.55, Q, r);
        near.rgb += mix(rb, vec3(1.0), 0.6 * vBig) * uSunCol * (spark + 0.35 * vBig) * star * 2.6 * uGain * (0.3 + 0.7 * toSun);
        float fa = exp(-r * r * 4.5);
        float fstar = (fa + 0.5 * (exp(-abs(vUv.x) * 7.0 - abs(vUv.y) * 1.3) + exp(-abs(vUv.y) * 7.0 - abs(vUv.x) * 1.3))) * (1.0 - smoothstep(Q * 0.5, Q, r));
        float dim = mix(0.4, 1.0, vDim);
        vec3 fc = (uDewCol * 0.24 + uSunCol * (0.14 + 0.6 * toSun)) * fa * dim + rb * uSunCol * spark * fstar * 6.0 * uGain * (0.35 + 0.65 * toSun) * mix(0.6, 1.0, vDim);
        vec4 o = mix(vec4(fc, fa * 0.5 * dim), near, vLod);
        o.rgb = mix(o.rgb, fogColor * o.a, fogF());
        gl_FragColor = o;
      }`,
  });
}

// ------------------------------------------------------------------ dandelion seeds (additive fluff)
function makeSeedMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime, uWindV: U.uWindV, uSunDir: U.uSunDir, uSunCol: U.uSunCol },
    vertexShader: /* glsl */`
      attribute vec4 iVar;
      varying vec2 vUv; varying vec3 vW; varying vec2 vLoc; varying float vFade;
      #include <fog_pars_vertex>
      ${GLSL_SWAY}
      void main() {
        vUv = uv; vLoc = position.xz; vFade = iVar.w;
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        wp.xyz += swayOff(iVar.x, iVar.y, iVar.z, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol;
      varying vec2 vUv; varying vec3 vW; varying vec2 vLoc; varying float vFade;
      #include <fog_pars_fragment>
      ${GLSL_FOGF}
      void main() {
        float toSun = max(dot(normalize(vW - cameraPosition), uSunDir), 0.0); toSun *= toSun;
        float a = 0.55;
        if (vUv.y >= 0.0) {                             // the pappus: thirty fine filaments, each ending in a bright tuft
          float f = abs(fract(atan(vLoc.y, abs(vLoc.x) < 1e-5 ? 1e-5 : vLoc.x) * 4.775) - 0.5) * 2.0;
          a = smoothstep(0.72, 0.97, f) * (0.24 + 0.5 * vUv.y) + smoothstep(0.86, 1.0, vUv.y) * 0.9 * smoothstep(0.3, 0.9, f) + 0.045 + 0.07 * min(vUv.y * vUv.y, 1.0);   // bright tips, a soft glow between the hairs
        }
        a *= vFade * (1.0 - fogF());
        vec3 col = mix(vec3(1.0), uSunCol, 0.45) * (0.5 + 0.85 * toSun);
        if (vUv.y < 0.0) col *= vec3(0.62, 0.5, 0.36);  // the stalk: straw brown, not a white bar
        if (vUv.y < -1.5) { col = vec3(0.1, 0.06, 0.035); a = 0.85 * vFade * (1.0 - fogF()); }   // the seed hanging under it: dark against the light
        gl_FragColor = vec4(col * a, a);
      }`,
  });
}

// ------------------------------------------------------------------ the seeds that fly: soft tufts of light
// One parachute: the dark seed, its straw stalk and a pappus of hair-fine filaments that bow outward and upward like a
// shuttlecock, each ending in a bright tip; a soft glow sits in the cup. Every hair is a ribbon turned to the camera
// and never thinner than a pixel and a bit (it dims instead), so a tuft far off is a mote of light and one near by is a
// drawing in fine lines. aT = the hair's direction and side (for the glow: its corner), aK = (kind, how far along).
const TUFT_HAIRS = 15;
function tuftGeometry() {
  const p = [], t = [], k = [], idx = [];
  const y0 = 0.4, y1 = SEED_LEN - 0.3;
  const ribbon = (pts, kind) => {
    const b = p.length / 3, n = pts.length, T = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      T.subVectors(pts[Math.min(n - 1, j + 1)], pts[Math.max(0, j - 1)]).normalize();
      for (const sd of [-1, 1]) { p.push(pts[j].x, pts[j].y, pts[j].z); t.push(T.x, T.y, T.z, sd); k.push(kind, j / (n - 1)); }
      if (j > 0) { const q = b + (j - 1) * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
    }
  };
  ribbon([new THREE.Vector3(0, y0 - 0.04, 0), new THREE.Vector3(0, y0 + 0.3, 0)], 1);                  // the seed
  ribbon([new THREE.Vector3(0, y0 + 0.25, 0), new THREE.Vector3(0, y1, 0)], 0);                        // the stalk
  for (let h = 0; h < TUFT_HAIRS; h++) {
    const an = (h / TUFT_HAIRS) * TAU + 0.7 * Math.sin(h * 2.4), reach = SEED_R * (0.82 + 0.3 * Math.abs(Math.sin(h * 1.7 + 0.4))), lift = 0.26 + 0.14 * Math.sin(h * 3.1), pts = [];
    for (let j = 0; j <= 3; j++) { const q = j / 3, rho = reach * Math.pow(q, 1.25), up = lift * Math.pow(q, 0.55); pts.push(new THREE.Vector3(Math.cos(an) * rho, y1 + up, Math.sin(an) * rho)); }
    ribbon(pts, 2);
  }
  { const b = p.length / 3; for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { p.push(0, y1 + 0.14, 0); t.push(cx, cy, 0, 0); k.push(3, 0); } idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 2));
  g.setIndex(idx);
  return g;
}
function makeTuftMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uSunDir: U.uSunDir, uSunCol: U.uSunCol, uViewH: U.uViewH },
    vertexShader: /* glsl */`
      attribute vec4 aT; attribute vec2 aK; attribute vec4 iVar;
      uniform float uViewH;
      varying vec3 vK; varying vec3 vW; varying vec2 vQ; varying float vFade;
      #include <fog_pars_vertex>
      void main() {
        mat4 im = modelMatrix * instanceMatrix;
        float scl = length(im[0].xyz);
        vec4 wp = im * vec4(position, 1.0);
        vec4 mvPosition = viewMatrix * wp;
        float pxPerM = projectionMatrix[1][1] * uViewH * 0.5 / max(-mvPosition.z, 0.1), thin = 1.0;
        vQ = vec2(0.0);
        if (aK.x > 2.5) { mvPosition.xy += aT.xy * ${(SEED_R * 1.5).toFixed(3)} * scl; vQ = aT.xy; }
        else {
          vec3 tv = mat3(viewMatrix) * (mat3(im) * aT.xyz); tv = tv / max(length(tv), 1e-5);
          vec3 side = cross(tv, mvPosition.xyz / max(length(mvPosition.xyz), 1e-4)); side = side / max(length(side), 1e-4);
          float w0 = (aK.x > 1.5 ? 0.02 : aK.x > 0.5 ? 0.085 : 0.03) * scl, w = max(w0, 1.35 / pxPerM);
          thin = clamp(w0 / w, 0.0, 1.0);
          mvPosition.xyz += side * aT.w * w * 0.5; vQ.x = aT.w;
        }
        vK = vec3(aK, thin); vFade = iVar.w; vW = wp.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol;
      varying vec3 vK; varying vec3 vW; varying vec2 vQ; varying float vFade;
      #include <fog_pars_fragment>
      ${GLSL_FOGF}
      void main() {
        vec3 V = vW - cameraPosition; V = V / max(length(V), 1e-4);
        float toSun = clamp(dot(V, uSunDir), 0.0, 1.0); toSun *= toSun;
        vec3 warm = mix(vec3(1.0), uSunCol, 0.5), col; float a;
        if (vK.x > 2.5) {                                // the glow in the cup
          vec2 gq = clamp(vQ, -1.0, 1.0); float r2 = clamp(dot(gq, gq), 0.0, 1.0);
          a = (1.0 - r2) * (1.0 - r2) * (0.15 + 0.3 * toSun); col = warm * 1.3;
        } else {
          float ax = clamp(vQ.x, -1.0, 1.0), across = 1.0 - ax * ax, th = clamp(vK.z, 0.0, 1.0);      // the across coordinate held to its own range before it is squared
          if (vK.x > 1.5) {                              // a hair: faint at the root, a bright point at its tip
            float tip = smoothstep(0.74, 1.0, vK.y);
            a = across * (0.3 + 0.3 * vK.y + 0.6 * tip) * th; col = warm * (0.7 + 0.9 * toSun) * (1.0 + 1.5 * tip);
          } else if (vK.x > 0.5) { a = across * 0.9 * th; col = vec3(0.1, 0.06, 0.035); }      // the seed, dark against the light
          else { a = across * 0.6 * th; col = vec3(0.62, 0.5, 0.36) * (0.5 + 0.6 * toSun); }      // the stalk, straw
        }
        a = clamp(a, 0.0, 1.0) * vFade * (1.0 - fogF());
        gl_FragColor = vec4(col * a, a);
      }`,
  });
}

// ------------------------------------------------------------------ bokeh: out-of-focus highlights that ride with the camera
function makeBokehMaterial(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime, uAmount: U.uBokeh },
    vertexShader: /* glsl */`
      attribute vec4 iPos; attribute vec4 iCol;
      uniform float uTime;
      varying vec2 vUv; varying vec3 vCol;
      void main() {
        vec3 wc = iPos.xyz + vec3(cameraPosition.x, 0.0, cameraPosition.z);
        wc.x += sin(uTime * 0.13 + iCol.w) * 4.0; wc.y += sin(uTime * 0.19 + iCol.w * 1.7) * 2.0;
        vec4 mv = viewMatrix * vec4(wc, 1.0);
        float s = iPos.w * (0.9 + 0.1 * sin(uTime * 0.7 + iCol.w * 3.0));
        mv.xy += position.xy * s;
        vUv = position.xy;
        vCol = iCol.rgb * (0.55 + 0.45 * sin(uTime * (0.5 + fract(iCol.w) * 1.3) + iCol.w * 5.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uAmount;
      varying vec2 vUv; varying vec3 vCol;
      void main() {
        float r = length(vUv);
        float a = (1.0 - smoothstep(0.9, 1.0, r)) * (0.5 + 0.5 * smoothstep(0.55, 0.93, r));
        gl_FragColor = vec4(vCol * a * uAmount, 1.0);
      }`,
  });
}

// ------------------------------------------------------------------ soil and moss ground
function makeGroundMaterial(U, pal) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...fogU(), uSunDir: U.uSunDir, uSunCol: U.uSunCol, uLeafSun: U.uLeafSun, uSkyCol: U.uSkyCol, uMist: U.uMist, uMistCol: U.uMistCol,
      uSoil: { value: pal[4].clone().multiplyScalar(0.42) }, uMoss: { value: pal[3].clone().lerp(pal[2], 0.35).multiplyScalar(0.8) }, uLime: { value: pal[1].clone().multiplyScalar(0.6) } },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz; vN = normal;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uLeafSun, uSkyCol, uSoil, uMoss, uLime, uMist, uMistCol;
      varying vec3 vW; varying vec3 vN;
      #include <fog_pars_fragment>
      ${fx.GLSL_NOISE}
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float m = fbmLo(vW.xz * 0.045), d = 0.6 * vnoise(vW.xz * 0.5 + 7.0) + 0.4 * vnoise(vW.xz * 1.3), g = vnoise(vW.xz * 2.3);
        // the clearing floor is mossier than the soil under the blades
        float clr = (1.0 - smoothstep(34.0, 64.0, abs(vW.x))) * smoothstep(-70.0, -10.0, vW.z) * (1.0 - smoothstep(170.0, 205.0, vW.z));
        clr = max(clr, 0.8 * (1.0 - smoothstep(-50.0, 20.0, vW.z)));                         // and the lawn runs on under the flowerbed
        float moss = smoothstep(0.32, 0.56, m + (d - 0.5) * 0.35 + 0.3 * clr);
        float nearF = exp(-vFogDepth * 0.016), midF = exp(-vFogDepth * 0.005);
        vec3 d1 = vnoised(vW.xz * 1.5 + 3.0), d2 = vnoised(vW.xz * 6.0 + 11.0);
        vec3 alb = mix(uSoil * (0.55 + 0.9 * d), mix(uMoss, uLime, d * g) * (0.6 + 0.8 * g), moss);
        alb *= mix(1.0, 0.62 + 0.76 * d1.x, midF) * mix(1.0, 0.7 + 0.6 * d2.x, nearF);
        // crumbs of dark soil and small pebbles, each with a lit edge toward the sun
        vec2 cg = vW.xz * 0.85, cc = floor(cg), co = 0.2 + 0.6 * hash22(cc);
        float ch = hash12(cc + 9.0), cr = 0.07 + 0.2 * hash12(cc + 3.0);
        vec2 cv = fract(cg) - co; float cd = length(cv);
        float crumb = (1.0 - smoothstep(cr * 0.75, cr, cd)) * step(0.4, ch) * midF;
        float crumbLit = crumb * smoothstep(-0.2, 0.9, dot(cv / max(cd, 1e-3), normalize(uSunDir.xz))) * smoothstep(cr * 0.35, cr * 0.9, cd);
        alb = mix(alb, mix(uSoil * 0.35, uSoil * 1.5 + 0.03, step(0.78, ch)), crumb * (1.0 - 0.6 * moss));
        N = normalize(N + vec3(d1.y, 0.0, d1.z) * -0.22 * midF + vec3(d2.y, 0.0, d2.z) * -0.1 * nearF);
        // long light and shadow streaks thrown toward the camera by the blades
        vec2 sp = vec2(dot(vW.xz, vec2(-uSunDir.z, uSunDir.x)), dot(vW.xz, uSunDir.xz));
        float streak = smoothstep(0.4, 0.68, 0.65 * vnoise(vec2(sp.x * 0.2, sp.y * 0.016)) + 0.35 * vnoise(vec2(sp.x * 0.55, sp.y * 0.04) + 3.0));
        float ndl = max(dot(N, uSunDir), 0.0);
        vec3 col = alb * (uSkyCol * 0.5 + uLeafSun * (0.12 + 2.6 * ndl) * streak);
        col += mix(uSunCol, alb * 5.0, 0.6 * moss) * streak * mix(0.3, 0.1, moss) * pow(max(dot(reflect(-V, N), uSunDir), 0.0), 12.0) * (0.3 + g);   // wet soil shines, moss only glows
        col += mix(uSunCol, uLeafSun, 0.6) * alb * 2.2 * crumbLit * (0.3 + 0.7 * streak);
        // wet sparkles: tiny beads of water on the soil that flash as the camera moves
        vec2 sg = vW.xz * 2.6, sc = floor(sg); float sh = hash12(sc + 17.0);
        float sdot = 1.0 - smoothstep(0.05, 0.22, length(fract(sg) - 0.25 - 0.5 * hash22(sc + 5.0)));
        float tw = pow(max(0.5 + 0.5 * sin(sh * 311.0 + dot(cameraPosition, vec3(1.3, 0.9, 1.1)) * 1.4), 0.0), 6.0);
        float toSunG = max(dot(-V, uSunDir), 0.0);
        col += uSunCol * 3.2 * sdot * tw * step(0.9, sh) * nearF * (0.25 + 0.75 * toSunG * toSunG) * (0.35 + 0.65 * streak);
        col *= 1.0 - 0.74 * (1.0 - smoothstep(62.0 + max(0.0, -vW.z - 30.0) * 0.5, 112.0 + max(0.0, -vW.z - 30.0) * 0.5, abs(vW.x))) * (1.0 - smoothstep(-24.0, -4.0, vW.z));
        col = mix(col, uMistCol, uMist.x * (1.0 - exp(-vFogDepth * uMist.y)) * (1.0 - smoothstep(0.0, uMist.z, vW.y)) * (0.2 + 0.8 * smoothstep(-50.0, 20.0, vW.z)) * (0.76 + 0.24 * smoothstep(148.0, 184.0, vW.z)));   // no gold veil behind the Web: its beads need the dark; and a quarter less of it over the open ground of the clearing than among the blades
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ the far band: fence, hedge and the neighbours' tree
// crowns in shade, dark and cool under the sunrise. It stands behind the lower two thirds of the Web so that every bead
// shows as a bright point on dark, and its crowns part where the sun stands. One plane, painted out of focus.
function makeBandMaterial(U, haze, crown, leaf, wood, sunX, hazeK, sunY) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uHaze: { value: haze }, uCrown: { value: crown }, uLeaf: { value: leaf }, uWood: { value: wood }, uSunX: { value: sunX }, uSunY: { value: sunY }, uHazeK: { value: hazeK }, uSunCol: U.uSunCol, uTime: U.uTime },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uHaze, uCrown, uLeaf, uWood, uSunCol; uniform float uSunX, uSunY, uTime, uHazeK; varying vec2 vUv;
      float h1(float n) { return fract(sin(n * 91.7) * 43758.5); }
      float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
      void main() {
        float x = (vUv.x - 0.5) * 3800.0, y = vUv.y * 520.0 - 20.0;
        float sx = (x - uSunX) / 180.0, gap = exp(-sx * sx);                       // the parting where the sun stands
        float sw = 0.25 * sin(uTime * 0.3 + x * 0.004);
        // the trees: three ranks of big soft crowns, the nearer ones lower and darker
        float c1 = 352.0 + 60.0 * (n1(x * 0.0062 + 3.0) - 0.5) + 30.0 * abs(sin(x * 0.0113 + 2.3 + sw)) + 14.0 * abs(sin(x * 0.037 + 0.4 + 2.0 * sw)) + 30.0 * smoothstep(300.0, 1200.0, abs(x - uSunX));
        c1 = mix(c1, uSunY - 62.0, gap);
        float c2 = 236.0 + 50.0 * (n1(x * 0.0091 + 17.0) - 0.5) + 24.0 * abs(sin(x * 0.017 + 0.7 - sw)) + 11.0 * abs(sin(x * 0.051 + 1.9 + 1.5 * sw));
        c2 = mix(c2, uSunY - 112.0, gap * 0.9);
        float a1 = 1.0 - smoothstep(c1 - 30.0, c1 + 16.0, y), a2 = 1.0 - smoothstep(c2 - 22.0, c2 + 10.0, y);
        float mot = n1(x * 0.021 + y * 0.013) * n1(x * 0.0083 - y * 0.031 + 5.0);
        vec3 far = uCrown * (0.75 + 0.9 * mot) + uHaze * (0.07 + 0.25 * uHazeK);
        far += uSunCol * 0.2 * smoothstep(c1 - 46.0, c1 + 4.0, y) * (0.25 + 0.75 * exp(-sx * sx * 0.12));             // light catching the tops
        vec3 mid = mix(uCrown, uLeaf, 0.45) * (0.55 + 1.0 * n1(x * 0.033 - y * 0.02 + 9.0) * n1(x * 0.012 + y * 0.04)) + uHaze * (0.025 + 0.2 * uHazeK);
        mid += uSunCol * 0.1 * smoothstep(c2 - 30.0, c2 + 2.0, y) * (0.3 + 0.7 * exp(-sx * sx * 0.2));
        vec3 col = mix(far, mid, a2); float a = a1 + a2 * (1.0 - a1);
        // the fence in front of them: boards that melt into each other, the sun grazing its top rail
        float bx = x / 11.0, id = floor(bx), f = fract(bx);
        float top = 104.0 + 4.0 * sin(x * 0.0043 + 1.3) + 1.5 * (h1(id) - 0.5);
        float fa = 1.0 - smoothstep(top - 9.0, top + 5.0, y);
        float tone = mix(h1(id), h1(id + 1.0), smoothstep(0.3, 0.7, f));
        vec3 fc = uWood * (0.7 + 0.6 * tone) + uHaze * (0.05 + 0.16 * uHazeK) + uSunCol * 0.14 * smoothstep(top - 16.0, top, y) * exp(-sx * sx * 0.3);
        col = mix(col, fc, fa); a = a + fa * (1.0 - a);
        // shrubs and tall weeds along its foot, a blur of deep green
        float hh = 64.0 + 18.0 * sin(x * 0.019 + 0.7) + 11.0 * sin(x * 0.047 + 2.1 + 0.3 * sin(uTime * 0.4 + x * 0.01)) + 6.0 * sin(x * 0.11 + uTime * 0.25);
        float hm = 1.0 - smoothstep(hh - 18.0, hh + 8.0, y);
        vec3 lf = uLeaf * (0.7 + 0.7 * n1(x * 0.027 + y * 0.05) * n1(x * 0.071 + 2.0)) + uHaze * (0.06 + 0.2 * uHazeK);
        col = mix(col, lf, hm * 0.92);
        col = mix(col, uHaze, uHazeK * 0.45 * (1.0 - smoothstep(0.0, 90.0, y)));   // ground mist at its foot
        gl_FragColor = vec4(col, a * 0.97);
      }`,
  });
}

// ------------------------------------------------------------------ shafts of sun streaming through the Web
// Long soft ribbons parallel to the light, so in perspective they fan out from the sun toward the camera.
// position = start point, aDir = direction and length, aA = (side, along 0..1, half width, phase).
function makeShaftMaterial(U, color) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime, uCol: { value: color }, uAmount: U.uShafts },
    vertexShader: /* glsl */`
      attribute vec4 aDir; attribute vec4 aA;
      varying vec2 vUv; varying float vPh; varying float vFace; varying float vDepth; varying float vLen;
      #include <fog_pars_vertex>
      void main() {
        vec3 wp0 = position + aDir.xyz * aDir.w * aA.y;
        vec4 mvPosition = viewMatrix * vec4(wp0, 1.0);
        vec3 tv = normalize(mat3(viewMatrix) * aDir.xyz);
        vec3 side = cross(tv, normalize(mvPosition.xyz));
        float sl = length(side);
        side = side / max(sl, 1e-4);
        mvPosition.xyz += side * aA.x * aA.z * (0.75 + 0.9 * aA.y);
        vUv = vec2(aA.x, aA.y); vPh = aA.w; vFace = smoothstep(0.035, 0.16, sl); vDepth = -mvPosition.z; vLen = aDir.w * aA.y;      // metres from where the shaft leaves the Web
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uAmount, uTime;
      varying vec2 vUv; varying float vPh; varying float vFace; varying float vDepth; varying float vLen;
      #include <fog_pars_fragment>
      ${GLSL_FOGF}
      void main() {
        float across = clamp(1.0 - abs(vUv.x), 0.0, 1.0); across = across * across * (3.0 - 2.0 * across);      // the across coordinate held to its own range before it is squared
        float along = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float dust = 0.72 + 0.28 * sin(vUv.y * 23.0 - uTime * 0.5 + vPh) * sin(vUv.y * 7.0 + uTime * 0.23 + vPh * 2.0);
        float breathe = 0.75 + 0.25 * sin(uTime * 0.37 + vPh * 3.0);
        float a = across * along * dust * breathe * vFace * smoothstep(5.0, 26.0, vDepth) * (1.0 - 0.8 * fogF()) * (0.4 + 0.6 * smoothstep(0.0, 100.0, vLen));
        gl_FragColor = vec4(uCol * a * uAmount, 1.0);
      }`,
  });
}

// ------------------------------------------------------------------ insect wings: a glassy pane with fine veins that turns
// to a bright sliver against the sun
function makeWingMaterial(U, color, flap, vein = [4, 16], glint = 1) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uCol: { value: new THREE.Color(color) }, uFlap: { value: new THREE.Vector3(...flap) }, uVein: { value: new THREE.Vector2(...vein) }, uGlint: { value: glint } },
    vertexShader: /* glsl */`
      attribute vec3 aW;      // side sign, phase, hinge height
      uniform float uTime; uniform vec3 uFlap;
      varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        float an = (uFlap.z + uFlap.y * sin(uTime * uFlap.x + aW.y)) * aW.x;
        vec3 p = position; p.y -= aW.z;
        float c = cos(an), s = sin(an);
        p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c); p.y += aW.z;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * vec3(-s, c, 0.0));
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uCol; uniform vec2 uVein; uniform float uGlint;
      varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      #include <fog_pars_fragment>
      void main() {
        vec3 V = normalize(vW - cameraPosition), N = normalize(vN);
        float toSun = max(dot(V, uSunDir), 0.0);
        float lon = smoothstep(0.86, 1.0, abs(fract(vUv.x * uVein.x * 0.5 + 0.5) - 0.5) * 2.0);                       // long veins
        float crs = smoothstep(0.84, 1.0, abs(fract(vUv.y * uVein.y + vUv.x * 0.7) - 0.5) * 2.0) * 0.55;               // cross veins
        float vein = min(1.0, lon + crs);
        float edge = smoothstep(0.82, 1.0, abs(vUv.x)), lead = smoothstep(0.7, 1.0, vUv.x);
        float stigma = smoothstep(0.84, 0.87, vUv.y) * (1.0 - smoothstep(0.92, 0.95, vUv.y)) * smoothstep(0.35, 0.6, vUv.x);   // the dark cell near the tip
        float sheen = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 2.0);
        float back = toSun * toSun, rim = min(1.0, vein + edge);
        float sliver = pow(max(dot(reflect(V, N), uSunDir), 0.0), 26.0);
        float a = clamp(0.07 + 0.1 * sheen + (0.34 + 0.4 * back) * vein + 0.6 * edge + 0.6 * stigma + 0.85 * sliver * uGlint, 0.0, 1.0);
        vec3 col = uCol * (0.3 + 0.3 * sheen) * (1.0 - 0.3 * vein) + uSunCol * (0.04 + 1.1 * back * rim + 2.4 * sliver) * (0.6 + 0.4 * lead) * uGlint;
        col = mix(col, vec3(0.02, 0.02, 0.03), stigma * 0.85);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ creatures
const ellipsoid = (cx, cy, cz, rx, ry, rz, colFn) => (u, v) => {
  const an = u * TAU, ph = v * Math.PI, x = rx * Math.sin(ph) * Math.cos(an), y = ry * Math.cos(ph), z = rz * Math.sin(ph) * Math.sin(an);
  return [cx + x, cy + y, cz + z, colFn(x / rx, y / ry, z / rz), 0];
};

// Ladybird, about 1.3 m long. Local frame: +Z forward, +Y up off the leaf, origin under the belly.
// Returns the group and the parts the world animates (wing cases, hind wings, two leg tripods).
function buildLadybird(U, plantMat, rng, shell) {
  const group = new THREE.Group(); group.name = 'ladybird';
  const black = new THREE.Color(0.016, 0.014, 0.014), white = new THREE.Color(0.8, 0.78, 0.7);
  const body = makeAcc();
  const back = shell.clone().multiplyScalar(0.8);     // the back under the wing cases is red too: it shows when the cases lift
  addGrid(body, 14, 8, ellipsoid(0, 0.17, -0.08, 0.47, 0.2, 0.6, (x, y) => (y > 0.1 ? back : black)), [0, 0, 6, 0]);
  addGrid(body, 14, 8, ellipsoid(0, 0.24, 0.42, 0.37, 0.27, 0.27, (x, y, z) => (Math.abs(x) > 0.42 && z > -0.1 && y > -0.1 ? white : black)), [0, 0, 9, 0]);
  addGrid(body, 8, 5, ellipsoid(0, 0.2, 0.68, 0.2, 0.16, 0.15, (x, y, z) => (Math.abs(x) > 0.5 && y > 0.2 && z > 0 ? white : black)), [0, 0, 9, 0]);
  for (const s of [-1, 1]) addTube(body, [V3(s * 0.08, 0.26, 0.78), V3(s * 0.2, 0.34, 0.95), V3(s * 0.36, 0.3, 1.02)], 4, () => 0.018, () => black, () => 0, [0, 0, 9, 0]);
  group.add(new THREE.Mesh(accToGeometry(body), plantMat));
  // wing cases, built relative to their hinge at the front of the back
  const hinge = V3(0, 0.44, 0.24), cases = [], wings = [];
  for (const s of [-1, 1]) {
    const a = makeAcc();
    addGrid(a, 9, 10, (u, v) => {
      const an = u * Math.PI * 0.5, sh = Math.pow(Math.sin(Math.PI * (0.1 + 0.88 * v)), 0.55);
      const x = s * (0.012 + 0.52 * Math.sin(an) * sh), y = 0.1 + 0.42 * Math.cos(an) * sh - 0.2 * Math.sin(an), z = 0.3 - 1.02 * v;
      return [x, y - hinge.y, z - hinge.z, shell, 0];
    }, [0.1, 0, 6, 0], [0, 1]);
    const m = new THREE.Mesh(accToGeometry(a), plantMat); m.position.copy(hinge); group.add(m); cases.push(m);
    // hind wing: a long membrane folded under the case
    const p = [], uv = [], aw = [], idx = [];
    for (let j = 0; j <= 5; j++) {
      const t = j / 5, w = 0.34 * Math.sin(Math.PI * (0.08 + 0.9 * t)) ** 0.7;
      p.push(0.05 + 1.5 * t, 0, w * 0.5, 0.05 + 1.5 * t, 0, -w); uv.push(-1, t, 1, t); aw.push(0, 0, 0, 0, 0, 0);
      if (j > 0) { const k = (j - 1) * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    wg.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3)); wg.setIndex(idx);
    const wm = new THREE.Mesh(wg, U.ladyWingMat); wm.position.set(s * 0.1, 0.4, 0.12); wm.scale.set(s, 1, 1); wm.visible = false;
    group.add(wm); wings.push(wm);
  }
  // legs: two alternating tripods
  const tripods = [];
  for (let tset = 0; tset < 2; tset++) {
    const a = makeAcc();
    for (let k = 0; k < 3; k++) {
      const s = (k + tset) % 2 ? 1 : -1, z = 0.38 - k * 0.36;
      addTube(a, [V3(s * 0.28, 0.12, z), V3(s * 0.62, 0.26, z + (k - 1) * -0.08), V3(s * 0.82, 0.0, z + (k - 1) * -0.2), V3(s * 0.9, -0.02, z + (k - 1) * -0.26)], 4, (t) => lerp(0.04, 0.02, t), () => black, () => 0, [0, 0, 9, 0]);
    }
    const m = new THREE.Mesh(accToGeometry(a), plantMat); group.add(m); tripods.push(m);
  }
  return { group, cases, wings, tripods };
}

// Damselfly, about 5 m long before scaling: +Z forward. A head with two wide-set eyes, a deep thorax the four
// wings grow from, a long banded abdomen with a slight droop and a pale tail light. Body in the plant shader
// (enamel), the four glassy panes beating in their own shader.
function buildDamselfly(U, plantMat, wingMat, rng, tint) {
  const group = new THREE.Group(); group.name = 'damselfly';
  const blue = new THREE.Color(tint), dark = new THREE.Color(0.012, 0.016, 0.03), pale = blue.clone().lerp(new THREE.Color(0.75, 0.9, 1), 0.55), eye = blue.clone().lerp(new THREE.Color(0.02, 0.2, 0.12), 0.5).multiplyScalar(0.7);
  const a = makeAcc(), pts = [], NS = 10;
  // abdomen: ten segments, each electric blue with a black ring at its joint, swelling a little at each joint, drooping toward the tip
  for (let j = 0; j <= NS * 3; j++) { const t = j / (NS * 3); pts.push(V3(0, 0.1 - 0.1 * t - 0.42 * t * t, -0.42 - 3.75 * t)); }
  addTube(a, pts, 7, (t) => (0.125 - 0.04 * t) * (1 + 0.16 * Math.pow(Math.abs(Math.sin(t * NS * Math.PI)), 6)) * (t > 0.84 ? 1.3 : 1),
    (t) => { const f = (t * NS) % 1; return t > 0.84 ? (t > 0.97 ? dark : pale) : f < 0.2 || f > 0.9 ? dark : blue; }, () => 0, [0, 0, 9, 0]);
  // thorax: deep and humped, dark on the back with blue shoulder stripes; the wings root along its top
  addGrid(a, 10, 7, ellipsoid(0, 0.12, 0.12, 0.31, 0.36, 0.66, (x, y) => (y > 0.25 && Math.abs(x) < 0.3 ? dark : y > -0.1 && Math.abs(x) > 0.55 && Math.abs(x) < 0.85 ? dark : blue)), [0, 0, 9, 0]);
  addGrid(a, 8, 4, ellipsoid(0, 0.14, 0.78, 0.17, 0.15, 0.2, () => dark), [0, 0, 9, 0]);                       // neck
  // head: a bar with an eye at each end
  addGrid(a, 8, 5, ellipsoid(0, 0.18, 1.0, 0.36, 0.17, 0.17, (x, y, z) => (z > 0.3 && y < 0.4 ? pale : dark)), [0, 0, 9, 0]);
  for (const s of [-1, 1]) addGrid(a, 8, 6, ellipsoid(s * 0.4, 0.2, 1.02, 0.2, 0.2, 0.2, (x, y) => (y > 0.1 ? eye : blue)), [0, 0, 9, 0]);
  // legs: folded up under the thorax as a basket
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) addTube(a, [V3(s * 0.16, -0.14, 0.5 - k * 0.22), V3(s * 0.34, -0.36, 0.68 - k * 0.2), V3(s * 0.2, -0.5, 0.92 - k * 0.16)], 3, () => 0.022, () => dark, () => 0, [0, 0, 9, 0]);
  group.add(new THREE.Mesh(accToGeometry(a), plantMat));
  // wings: narrow at the root, widest two thirds out, held half open and swept back
  const p = [], uv = [], aw = [], idx = [], hingeY = 0.44;
  for (const s of [-1, 1]) for (let pair = 0; pair < 2; pair++) {
    const z0 = 0.36 - pair * 0.3, L = pair ? 3.0 : 3.25, sweep = pair ? 0.5 : 0.2, phase = pair * 1.9 + (s > 0 ? 0 : 0.15), b = p.length / 3, NW = 9;
    for (let j = 0; j <= NW; j++) {
      const t = j / NW, w = 0.03 + 0.4 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + 0.9 * Math.pow(t, 1.5))), 0.8) * (0.25 + 0.75 * smoothstep(0.0, 0.3, t));
      const x = s * (0.1 + L * t), zc = z0 - sweep * L * t;
      p.push(x, hingeY, zc + w * 0.45, x, hingeY, zc - w * 0.55); uv.push(1, t, -1, t); aw.push(s, phase, hingeY, s, phase, hingeY);
      if (j > 0) { const k = b + (j - 1) * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
    }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  wg.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3)); wg.setIndex(idx);
  const wm = new THREE.Mesh(wg, wingMat); wm.frustumCulled = false; wm.renderOrder = 2.5; group.add(wm);
  return { group };
}

// The snail (the rare visit): a house-sized amber shell on a long wet foot, about 27 m from tail to horns and 16 m
// tall. Local frame: +Z forward, origin on the ground under the shell. Returns the group and the four horns
// (separate meshes so they can feel the air).
function buildSnail(plantMat) {
  const group = new THREE.Group(); group.name = 'snail';
  const amber = new THREE.Color(0.8, 0.48, 0.17), honey = new THREE.Color(0.92, 0.74, 0.36), skin = new THREE.Color(0.66, 0.6, 0.47), skinD = new THREE.Color(0.38, 0.33, 0.25), dark = new THREE.Color(0.03, 0.03, 0.035);
  const a = makeAcc(), pts = [];
  for (let j = 0; j <= 18; j++) { const t = j / 18, lift = smoothstep(0.72, 1, t); pts.push(V3(0.5 * Math.sin(t * 5), 1.3 + 0.5 * Math.sin(t * Math.PI) + 3.4 * lift * lift, -12 + 27 * t)); }
  addTube(a, pts, 10, (t) => 0.3 + 2.6 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.03 + 0.95 * Math.pow(t, 0.8))), 0.6) * (1 - 0.35 * smoothstep(0.72, 1, t)),
    (t) => mixCol(skinD, skin, 0.25 + 0.75 * t), () => 0, [0.3, 0, 10, 0]);
  // the shell: a tube that shrinks as it winds, two and a half whorls, leaning out to one side
  const ctr = V3(0.4, 9.2, -2.5), NS = 76, SD = 14, bq = 0.105, TH = 5.2 * Math.PI, base = a.n;
  for (let j = 0; j <= NS; j++) {
    const th = (j / NS) * TH, e = Math.exp(-bq * th), rho = 5.3 * e, ar = 3.9 * e * (j === NS ? 0.05 : 1), ca = Math.cos(th - 1.9), sa = Math.sin(th - 1.9);
    const cx = ctr.x + 6.2 * (1 - e), cy = ctr.y + sa * rho, cz = ctr.z + ca * rho, col = mixCol(amber, honey, 0.5 + 0.5 * Math.sin(th * 0.9));
    for (let i = 0; i <= SD; i++) {
      const an = (i / SD) * TAU, rr = ar * Math.cos(an);
      vtx(a, cx + ar * Math.sin(an), cy + sa * rr, cz + ca * rr, col, i / SD, th / TH, [0.55, 0, 11, 0]);
    }
  }
  for (let j = 0; j < NS; j++) for (let i = 0; i < SD; i++) { const k = base + j * (SD + 1) + i; quadIdx(a, k, k + SD + 1, k + 1, k + SD + 2); }
  group.add(new THREE.Mesh(accToGeometry(a), plantMat));
  const head = pts[18], horns = [];
  for (const [sx, len, up] of [[-1, 5.2, 1], [1, 5.2, 1], [-1, 1.8, 0], [1, 1.8, 0]]) {
    const h = makeAcc();
    addTube(h, [V3(0, 0, 0), V3(0, len * 0.5, len * 0.12), V3(0, len, len * 0.16)], 6, (t) => lerp(0.36, 0.2, t), (t) => mixCol(skin, skinD, t * 0.6), () => 0, [0.4, 0, 10, 0]);
    addGrid(h, 6, 4, ellipsoid(0, len + 0.15, len * 0.16, 0.42, 0.42, 0.42, () => (up ? dark : skinD)), [0, 0, 9, 0]);
    const m = new THREE.Mesh(accToGeometry(h), plantMat);
    m.position.set(head.x + sx * (up ? 0.75 : 1.0), head.y + (up ? 0.9 : -0.5), head.z + (up ? -0.6 : 0.6)); m.userData = { sx, up };
    group.add(m); horns.push(m);
  }
  return { group, horns };
}

// ------------------------------------------------------------------ instancing helpers
// items: [{ m: Matrix4, v: [sp, rp, amp, bend], c: [r, g, b] }]
function instancedPlants(base, mat, items, margin = 30) {
  const g = new THREE.BufferGeometry();
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  g.setIndex(base.index);
  const n = items.length, iv = new Float32Array(n * 4), ic = new Float32Array(n * 3);
  const mesh = new THREE.InstancedMesh(g, mat, Math.max(1, n));
  const box = new THREE.Box3(), p = V3();
  for (let i = 0; i < n; i++) {
    const it = items[i];
    mesh.setMatrixAt(i, it.m); iv.set(it.v, i * 4); ic.set(it.c || [1, 1, 1], i * 3);
    box.expandByPoint(p.setFromMatrixPosition(it.m));
  }
  mesh.count = n;
  g.setAttribute('iVar', new THREE.InstancedBufferAttribute(iv, 4));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 3));
  const sph = new THREE.Sphere(); if (n) box.getBoundingSphere(sph); sph.radius += margin;
  mesh.boundingSphere = sph; g.boundingSphere = sph.clone();
  mesh.userData.sharedGeometry = true;
  return mesh;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = V3(), _p = V3();
function trs(x, y, z, ry, rx, rz, sx, sy, sz) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy ?? sx, sz ?? sx));
}

// ------------------------------------------------------------------ the three hours
// sky = makeSky colours; skyK = ambient tint of the shade; shade = how dark the soil level is; mist = ground glow;
// band = the hedge and tree crowns behind the Web (dark, cool); cloud = lit / shade of the dome clouds.
const HOURS = {
  first: { sun: '#ffb27e', horizon: '#ff9c76', scatter: '#ff7a5c', zenith: '#2a3a86', mid: '#b98fb4', fog: '#c98e8a', elev: [13.2, 14.0], sunI: 9,
    skyK: [0.5, 0.62, 1.0], amb: 0.44, shade: 0.3, mist: 1.0, mistCol: '#f09aa0', fogD: 0.0031, dew: 1.4, pollen: 0.35, exposure: 1.0, sat: 1.12,
    band: '#1e2c5c', bandLeaf: '#173a44', cloudLit: '#ffae96', cloudShade: '#56508c', cover: [0.3, 0.5], shafts: 0.8, tint: '#ffeee6', shadow: '#080a1c',
    leaf: '#c6d4ae', veil: '#a8848c' },     // the light as leaves and soil take it in the first hour: the rose stays in the sky, the mist and the rims
  sunrise: { sun: '#ffe0aa', horizon: '#ffb984', scatter: '#ffc878', zenith: '#2e58a8', mid: '#f2bd80', fog: '#f6c896', elev: [14.8, 16.0], sunI: 10,
    skyK: [0.8, 0.9, 1.0], amb: 0.52, shade: 0.4, mist: 1.0, mistCol: '#ffd27a', fogD: 0.0028, dew: 1.0, pollen: 0.8, exposure: 0.95, sat: 1.1,
    band: '#1c4a5c', bandLeaf: '#1a4c3a', cloudLit: '#ffd9b0', cloudShade: '#8a86b8', cover: [0.18, 0.4], shafts: 1.0, tint: '#fff6e6', shadow: '#06140a' },
  mist: { sun: '#fff0c4', horizon: '#ffe2ac', scatter: '#fff0b8', zenith: '#6a98cc', mid: '#f6e6c4', fog: '#f4e2b4', elev: [16.4, 17.4], sunI: 11,
    skyK: [0.9, 0.95, 1.0], amb: 0.6, shade: 0.5, mist: 1.4, mistCol: '#ffe6a0', fogD: 0.0033, dew: 0.8, pollen: 1.5, exposure: 0.78, sat: 1.16,
    band: '#2e5866', bandLeaf: '#2c5a44', cloudLit: '#fff4dc', cloudShade: '#aab4cc', cover: [0.1, 0.25], shafts: 1.45, tint: '#fffaea', shadow: '#0a1a10' },
};

// ------------------------------------------------------------------ the world
export default {
  id: 'dew-garden',
  name: 'The Dew Garden',
  category: 'domestic',
  weirdness: 0.15,
  media: ['air', 'tiny'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const scene = new THREE.Scene();

    // ---------- which visit is this: hour, density, the rare snail, the graphics level
    const vary = ctx.vary || {}, vr = rng.fork('visit');
    let hourName = ['sunrise', 'first', 'mist', 'sunrise'][Math.floor(vr() * 4)];
    if (vary.hour === 'dawn' || vary.hour === 'night') hourName = 'first'; else if (vary.hour === 'golden') hourName = 'sunrise'; else if (vary.hour === 'day') hourName = 'mist';
    const mood = HOURS[hourName], rare = !!vary.rare, dens = clamp(vary.density ?? 1, 0.7, 1.3), QD = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const VAR = {
      mirror: rng.chance(0.5) ? -1 : 1,
      elev: rng.range(mood.elev[0], mood.elev[1]), az: rng.range(-2, 2),
      mist: rng.range(0.8, 1.2) * mood.mist, wind: rng.range(0.7, 1.35), windAng: rng.range(0, TAU),
      toadstools: rng.int(9, 13), ringR: rng.range(26, 33), ringZ: rng.range(84, 104),
      tulips: rng.pick([['#ff5a7a', '#ffd9e2', '#ff8a3c'], ['#ffc83a', '#ff5a7a', '#fff3e0'], ['#b65cff', '#ff5a7a', '#ffe6b8'], ['#ff3d55', '#ffb23a', '#ff7aa0']]),
      damsel: rng.pick(['#1f6dff', '#12b0d8', '#3450ff']),
      lady: rng.pick(['#d81e12', '#e8560c', '#c4101c']),
      dew: rng.range(0.85, 1.2) * mood.dew * dens, clocks: rng.int(5, 8), daisies: Math.round(rng.int(40, 60) * dens), clouds: rng.range(mood.cover[0], mood.cover[1]),
    };
    const pal = PALETTE.map((h) => new THREE.Color(h)); pal[0].set(mood.sun);
    const palHex = PALETTE.slice(); palHex[0] = mood.sun;
    const R = { blades: rng.fork('blades'), dew: rng.fork('dew'), flora: rng.fork('flora'), fauna: rng.fork('fauna'), fx: rng.fork('fx'), floor: rng.fork('floor') };

    await ctx.yield();
    // ---------- sky: the sun low and straight ahead of the final run; peach to gold from the horizon to the top of the Web
    const sky = makeSky({ rng: rng.fork('sky'), preset: 'dawn', sunElevation: VAR.elev, sunAzimuth: VAR.az, zenith: mood.zenith, mid: mood.mid,
      horizon: mood.horizon, ground: '#4a4a26', scatterColor: mood.scatter, scatter: 0.45, scatterPow: 3.2, scatterHigh: 0.05, scatterFall: 3.6, horizonPow: 3.0, midPow: 2.1,
      sunColor: mood.sun, sunSize: 1.25, sunIntensity: mood.sunI, sunGlow: 0.85, sunGlowTight: 0.4,
      stars: 0, quality: 0.5, clouds: { coverage: VAR.clouds, lit: mood.cloudLit, shade: mood.cloudShade, silver: 1.6, haze: 0.3, opacity: 0.8 }, clouds2: { lit: mood.cloudLit, shade: mood.cloudShade, opacity: 0.24, coverage: 0.45 } });
    scene.add(sky.object);
    await ctx.yield();
    {
      // Workaround for kit/sky: its dome is two 16-segment fans with apexes straight up and down and ring vertices on
      // the X axis. With the camera exactly level and looking down -Z (this world's final run, in frozen screenshots)
      // those vertices land on clip w = 0 and the software rasteriser floods the frame with one flat colour. The
      // shader only needs each vertex's direction, so the same fans rebuilt slightly skewed are equivalent.
      const low = sky.object.children.find((c) => c.name === 'skyLower');
      if (low && sky.object.geometry?.attributes?.position?.count === 17 && low.geometry?.attributes?.position?.count === 17) {
        const fan = (ax, ay, az) => {
          const N = 16, pos = [ax, ay, az], idx = [];
          for (let i = 0; i < N; i++) { const a = (i / N) * TAU + 0.137; pos.push(Math.cos(a), -0.045, Math.sin(a)); idx.push(0, 1 + i, 1 + ((i + 1) % N)); }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
        };
        sky.object.geometry.dispose(); sky.object.geometry = fan(0.043, 1, 0.071);
        low.geometry.dispose(); low.geometry = fan(-0.037, -1, 0.059);
      }
    }
    const SUN = sky.sunDirection.clone().normalize();
    const fogCol = new THREE.Color(mood.fog).multiplyScalar(0.6);
    scene.fog = new THREE.FogExp2(fogCol, mood.fogD);
    scene.background = fogCol.clone();
    scene.userData.visit = { hour: hourName, rare, dens, mirror: VAR.mirror };

    await ctx.yield();

    // ---------- shared uniforms
    const zen = pal[5].clone().lerp(new THREE.Color('#6fa8e8'), 0.6).multiplyScalar(0.8);
    const dropSky = [new THREE.Color(mood.horizon), new THREE.Color(mood.mid).lerp(new THREE.Color(mood.cloudShade), 0.55), new THREE.Color(mood.cloudShade).lerp(new THREE.Color(mood.zenith), 0.4)];
    const U = {
      uTime: { value: 0 }, uWindV: { value: V3(Math.cos(VAR.windAng), Math.sin(VAR.windAng), VAR.wind) },
      uSunDir: { value: SUN }, uSunCol: { value: pal[0].clone().multiplyScalar(1.05) }, uLeafSun: { value: new THREE.Color(mood.leaf || mood.sun).multiplyScalar(1.05) },
      uSkyCol: { value: zen.clone().lerp(pal[0], 0.35).multiply(new THREE.Color(...mood.skyK)).multiplyScalar(mood.amb) }, uGroundCol: { value: pal[3].clone().multiplyScalar(0.32) },
      uShade: { value: new THREE.Vector2(mood.shade, 7.5) }, uMist: { value: V3(0.7 * VAR.mist, 0.012, 9) }, uMistCol: { value: mood.veil ? new THREE.Color(mood.veil) : new THREE.Color(mood.sun).lerp(new THREE.Color(mood.mistCol), 0.45).multiplyScalar(0.66) }, uViewH: { value: 1080 }, uDewGain: { value: 1 }, uBokeh: { value: 1 },
      uDewCol: { value: pal[5].clone() },
      // what the drops hold: this hour's sky (horizon, the band above it, overhead, and the lit side of its clouds)
      uSkyHor: { value: dropSky[0] }, uSkyMid: { value: dropSky[1] }, uSkyZen: { value: dropSky[2] }, uCloudLit: { value: new THREE.Color(mood.cloudLit) },
      uGrassA: { value: pal[1].clone().multiplyScalar(0.95) }, uGrassB: { value: pal[3].clone().multiplyScalar(0.8) }, uSoil: { value: pal[4].clone().multiplyScalar(0.5) },
      uBandCol: { value: new THREE.Color(mood.band).lerp(new THREE.Color(mood.bandLeaf), 0.4).multiplyScalar(0.9) }, uStool: { value: new THREE.Vector4(0, 0, -1, 0) },
    };
    const wind = U.uWindV.value;
    const plantMat = makePlantMaterial(U);
    await ctx.yield();
    U.ladyWingMat = makeWingMaterial(U, '#d8c8a0', [0, 0, 0], [1.2, 2.5]);

    // ---------- path: three gentle bends through the blades past the subjects (see the gaze below), then the low
    // run down the clearing and the climb into the hub. It starts climbing, so that the portal of the world before looks up the aisle at
    // the sun (the ground under the first metres is dug 8 m below the route so that the opening never shows soil).
    const HUB = 34, WEB_S = 1.3, mx = VAR.mirror, j = () => rng.range(-1.5, 1.5);
    // Down the clearing the route weaves once to each side of the axis (6 m, over 120 m) and comes back to it for the last
    // 50 m: toward the ring's elder toadstool and the small web on one side, then toward the wilding foxglove on the other.
    const path = makePath([
      [40 * mx, 5.6, 420], [37.5 * mx, 8.6, 394], [29 * mx, 7.4, 358], [17 * mx, 6.0, 328], [(1 + j()) * mx, 5.6, 304], [(-15 + j()) * mx, 5.6, 280], [-22 * mx, 6.2, 252],
      [-17 * mx, 7.5, 226], [-6.5 * mx, 9, 204], [-2.6 * mx, 11.2, 186], [-4.8 * mx, 12.6, 165], [-6.5 * mx, 12.0, 142], [-3.6 * mx, 12.6, 120], [1.8 * mx, 13.8, 100],
      [6.2 * mx, 16.0, 82], [3.4 * mx, 19.0, 66], [0, 22.4, 52], [0, 25.9, 37], [0, 29.4, 22], [0, HUB, 0],
    ]);
    const PT = V3(), TG = V3(), A0 = V3();
    // n points to the LEFT of travel; lateral offsets below are multiplied by mx, the visit's mirror
    const frameAt = (u) => { const p = path.pointAt(u, V3()), t = path.tangentAt(u, V3()); return { p, t, n: V3(t.z, 0, -t.x).normalize() }; };
    await ctx.yield();
    // ---------- the subjects of the clearing run, in the order the route meets them (x is given for the unmirrored visit):
    // the mark of the clearing's mouth (GATE_Z), the elder toadstool of the ring, a small orb web between two
    // blades, the wilding foxglove whose bells the route passes under; then the Web itself.
    const GATE_Z = 177, ELDER = { x: -21 * mx, z: 139, s: 1.55 }, MINI = { x: -14.6 * mx, y: 15.4, z: 110, R: 6.6, yaw: 0.87 * mx }, WILD = { x: 21.5 * mx, z: 73 };
    const miniEx = V3(Math.cos(MINI.yaw), 0, -Math.sin(MINI.yaw)), miniC = V3(MINI.x, MINI.y, MINI.z);
    const miniBlades = [-1, 1].map((sg) => ({ x: MINI.x + miniEx.x * sg * 8.3, z: MINI.z + miniEx.z * sg * 8.3, sg }));

    // ---------- ground
    const inClearing = (x, z) => {
      const hw = 46 + 6 * noise.n2(z * 0.03, 5.1) - 32 * smoothstep(148, 184, z);
      return Math.min(hw - Math.abs(x), z + 14, 184 - z);
    };
    const hRaw = (x, z) => (1.6 * noise.fbm2(x * 0.012, z * 0.012, 3) + 0.45 * noise.n2(x * 0.08, z * 0.08) - 0.5) * lerp(1, 0.35, smoothstep(-12, 6, inClearing(x, z)));
    const hAtN = (x, z, n) => Math.min(hRaw(x, z), n.y - 4.3 - 3.5 * (1 - smoothstep(0.03, 0.1, n.u)) + Math.max(0, n.dist - 9) * 0.3);
    const hAt = (x, z) => hAtN(x, z, path.nearestXZ(x, z));
    {
      // an 800 x 920 m grid of 8 m cells (the layout of a PlaneGeometry laid flat), filled in small steps
      const NX = 100, NZ = 115, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = new Uint32Array(NX * NZ * 6);
      await ctx.yield();
      for (let iz = 0, k = 0; iz <= NZ; iz++) {
        for (let ix = 0; ix <= NX; ix++, k += 3) { const x = ix * 8 - 400, z = iz * 8 - 460 + 130; pos[k] = x; pos[k + 1] = hAt(x, z); pos[k + 2] = z; }
        await ctx.yield();
      }
      for (let iz = 0, k = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++, k += 6) {
        const a = ix + (NX + 1) * iz, b = a + NX + 1;
        idx[k] = a; idx[k + 1] = b; idx[k + 2] = a + 1; idx[k + 3] = b; idx[k + 4] = b + 1; idx[k + 5] = a + 1;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      await stepNormals(g, () => ctx.yield());
      await ctx.yield();
      const ground = new THREE.Mesh(g, makeGroundMaterial(U, pal)); ground.name = 'soil'; ground.renderOrder = 0.5; scene.add(ground);
      const apron = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200).rotateX(-Math.PI / 2), ground.material); apron.position.set(0, -3.2, -300); apron.name = 'soil'; apron.renderOrder = 0.6; scene.add(apron);
    }
    await ctx.yield();

    // ---------- the hero: the Web between two foxgloves, hub at (0, HUB, 0)
    const spAt = (x, z) => (x * wind.x + z * wind.y) * 0.045;
    // a point on a blade record: yf = 0..1 up it, off = metres off the upper face
    const bladePoint = (b, yf, out, off = 0) => {
      const Hs = b.H * (1 - 0.2 * b.bend * b.bend);
      let ly = yf * Hs, lz = b.bend * b.H * yf * yf;
      if (off) { const ty = Hs, tz = 2 * b.bend * b.H * yf, l = Math.hypot(ty, tz); ly += (tz / l) * off; lz -= (ty / l) * off; }
      const cl = Math.cos(b.lean), sl = Math.sin(b.lean), y2 = ly * cl - lz * sl, z2 = ly * sl + lz * cl;
      return out.set(b.x + z2 * Math.sin(b.rot), b.y + y2, b.z + z2 * Math.cos(b.rot));
    };
    // the two blades the small web hangs between: they lean a little apart, and the web is moored to each at two heights
    for (const b of miniBlades) Object.assign(b, { y: hAt(b.x, b.z) - 0.3, rot: Math.atan2(miniEx.x * b.sg, miniEx.z * b.sg) + 0.5 * b.sg * mx, lean: 0, H: b.sg > 0 ? 28 : 33, W: 2.0, bend: 0.17, amp: 0.3,
      sp: spAt(b.x, b.z), rp: 0, tint: 1.06, warm: 0.5, lod: 0, giant: true, d: path.nearestXZ(b.x, b.z).dist });      // (rp, where its sway starts, is drawn below from the small web's own stream)
    const toHero = (v) => [v.x / WEB_S, (v.y + 0.9) / WEB_S, v.z / WEB_S];
    const miniMoor = []; for (const b of miniBlades) for (const yf of [0.36, 0.76]) miniMoor.push(toHero(bladePoint(b, yf, V3())));
    const hero = await buildHero(ctx, { palette: palHex, hubHeight: (HUB + 0.9) / WEB_S, scale: WEB_S, sunDir: SUN.toArray(), sunColor: mood.sun, sky: [dropSky[0].getHex(), dropSky[2].getHex()],
      miniWeb: { c: toHero(miniC), ex: miniEx.toArray(), R: MINI.R / WEB_S, moor: miniMoor, detail: QD },
      wild: { x: WILD.x / WEB_S, z: WILD.z / WEB_S, rot: 0, H: 32, lean: mx } });      // its raceme faces up the clearing (+z), as the racemes of its two parents do
    hero.object.position.set(0, -0.9, 0); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const hubW = V3(0, HUB, 0);
    // things spread along the whole route in one mesh: one of these is not drawn while every plant in it stands behind the camera's
    // own plane by more than its size (a rule in space, the same at every point of the flight)
    const behindCull = [];
    const lateObjs = [];        // far things of the clearing end, hidden behind 400 m of blades and haze: not drawn before u 0.3
    // Round 3's streams. Each is made from the world's seed and a name and draws nothing from any other stream, so the
    // visit's own stream and its forks are not touched by them. Every loop whose number of draws depends on something this
    // round moved or added (the route through the clearing, the new subjects' ground, the sight lines) has one (RL), and so
    // has every new thing (RN).
    const named = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const RL = {}; for (const k of ['blade-grid', 'giants', 'blade-dew', 'ring', 'young', 'clover', 'daisies', 'clocks', 'moss', 'litter']) RL[k] = named('dew-garden-loop-' + k);
    const RN = {}; for (const k of ['elder', 'tufts', 'mini', 'flies']) RN[k] = named('dew-garden-new-' + k);
    for (const b of miniBlades) b.rp = RN.mini() * TAU;      // where the sway of each of the small web's two blades starts
    await ctx.yield();

    // ---------- the subjects of the forest half. The drop, the toadstool and the ladybird stand on one side of the route and the
    // clock on the Web's side, so that the gaze goes from one to the next in a single slow sweep (see gazeAt below).
    const dropF = frameAt(0.208), ladyF = frameAt(0.365), dandF = frameAt(0.47);
    const DROP_R = 3.0, CLOCK_S = 2.1;
    const bigDrop = dropF.p.clone().addScaledVector(dropF.n, -6.7 * mx).add(V3(0, 2.6, 0));
    // the drop's blade: rooted further out on the same side, arching over and coming down to the top of the ball
    const dropRoot = dropF.p.clone().addScaledVector(dropF.n, -13.9 * mx).addScaledVector(dropF.t, -2.5); dropRoot.y = hAt(dropRoot.x, dropRoot.z) - 0.3;
    const dropTip = bigDrop.clone().add(V3(0, DROP_R * 0.86, 0));
    const dropArch = { reach: Math.hypot(dropTip.x - dropRoot.x, dropTip.z - dropRoot.z), rot: Math.atan2(dropTip.x - dropRoot.x, dropTip.z - dropRoot.z), tipY: dropTip.y - dropRoot.y,
      sp: spAt(dropRoot.x, dropRoot.z), rp: R.blades() * TAU, amp: 0.2 };
    // before the drop a second arched blade spans the aisle, beaded underneath like a necklace: the first thing the eye meets
    // after the entry, with the big drop small in the distance under it
    const garF = frameAt(0.125), garRoot = garF.p.clone().addScaledVector(garF.n, 10.5 * mx), garTip = garF.p.clone().addScaledVector(garF.n, -8 * mx);
    garRoot.y = hAt(garRoot.x, garRoot.z) - 0.3; garTip.y = garF.p.y + 3.4;
    const garArch = { reach: Math.hypot(garTip.x - garRoot.x, garTip.z - garRoot.z), rot: Math.atan2(garTip.x - garRoot.x, garTip.z - garRoot.z), tipY: garTip.y - garRoot.y,
      sp: spAt(garRoot.x, garRoot.z), rp: 1.7, amp: 0.16 };
    const sAbeam = (p) => path.nearestXZ(p.x, p.z).u * path.length;      // the route metres at which the route comes abeam of a place
    // blade record -> matrix and points on it
    const mkBlade = (x, z, rot, lean, H, W, bend, amp, tint, rr = R.blades) => ({ x, z, y: hAt(x, z) - 0.3, rot, lean, H, W, bend, amp, sp: spAt(x, z), rp: rr() * TAU, tint });
    // the ladybird's blade leans along the direction of travel, so the beetle climbs its near face toward the camera's side
    const ladyAt = ladyF.p.clone().addScaledVector(ladyF.n, -7.5 * mx);
    const ladyRot = Math.atan2(ladyF.t.x, ladyF.t.z) + 0.5 * mx;
    const ladyBlade = mkBlade(ladyAt.x - Math.sin(ladyRot) * 1.0, ladyAt.z - Math.cos(ladyRot) * 1.0, ladyRot, 0, 16.5, 2.9, 0.3, 0.2, 1.08);
    const dandBase = V3(dandF.p.x + dandF.n.x * 9 * mx, 0, dandF.p.z + dandF.n.z * 9 * mx), dandHeadY = dandF.p.y + 5.5;
    const SNAIL = { x: -37 * mx, z: 48, r: 17, ry: 1.33 * mx, s: 1.3 };
    const keepOut = [[dropRoot.x, dropRoot.z, 3.2], [garRoot.x, garRoot.z, 3.2], [ladyBlade.x, ladyBlade.z, 4.2], [dandBase.x, dandBase.z, 5]];
    if (rare) keepOut.push([SNAIL.x, SNAIL.z, SNAIL.r]);
    // a lone toadstool beside the aisle between the drop and the ladybird: the route passes under the rim of its cap
    const stoolF = frameAt(0.285), loneStool = { x: stoolF.p.x - stoolF.n.x * 8.5 * mx, z: stoolF.p.z - stoolF.n.z * 8.5 * mx, s: 1.3 };
    keepOut.push([loneStool.x, loneStool.z, 8.5]);
    { const d = V3(loneStool.x - bigDrop.x, 5.95 * loneStool.s - bigDrop.y, loneStool.z - bigDrop.z).normalize(); U.uStool.value.set(d.x, d.y, d.z, 1); }   // what the drops hold of it
    keepOut.push([ELDER.x, ELDER.z, 8.5], [WILD.x, WILD.z, 7], [miniBlades[0].x, miniBlades[0].z, 2.6], [miniBlades[1].x, miniBlades[1].z, 2.6]);
    const nearNew = (x, z) => Math.hypot(x - ELDER.x, z - ELDER.z) < 13 || Math.hypot(x - MINI.x, z - MINI.z) < 13 || Math.hypot(x - WILD.x, z - WILD.z) < 13;
    // sight lines: from the route to each subject nothing may stand in front; a blade under a line is cut down to fit
    const sights = [];
    // (the eyes of a stretch stand at even steps of route metres, one every 2 to 2.5 m, never at steps of u)
    const addSightM = (m0, m1, at, r, beyond = 0) => {
      const d0 = Math.max(0, m0), d1 = Math.max(d0, m1), n = Math.max(1, Math.ceil((d1 - d0) / 2.5));
      for (let k = 0; k <= n; k++) {
        const c = path.posAtDist(d0 + ((d1 - d0) * k) / n, V3()), dx = at.x - c.x, dz = at.z - c.z, len = Math.hypot(dx, dz);
        sights.push({ x: c.x, z: c.z, y: c.y, dx: dx / len, dz: dz / len, len, slope: (at.y - c.y) / len, r, beyond });
      }
    };
    const addSight = (u0, u1, at, r, beyond = 0) => addSightM(u0 * path.length, u1 * path.length, at, r, beyond);
    addSight(0.07, 0.208, bigDrop, DROP_R + 1.0, 0);
    // from the necklace on, nothing tall stands within 22 m behind the ball either (some three and a half of its widths): it shows against the far grass and the sky
    addSightM(sAbeam(garTip), sAbeam(bigDrop), bigDrop, DROP_R + 1.0, 22);
    addSight(0.27, 0.36, V3(ladyAt.x, ladyF.p.y, ladyAt.z), 2.8, 0);
    addSight(0.38, 0.47, V3(dandBase.x, dandHeadY, dandBase.z), 1.55 * CLOCK_S + 1.2, 16);
    addSight(0.45, 0.64, V3(0, HUB - 4, 0), 26, 0);        // climbing out: the whole Web shows between the parting blades
    const sightTop = (x, z, pad) => {                // the highest a plant at (x, z) may reach
      let top = 1e9;
      for (const s of sights) {
        const px = x - s.x, pz = z - s.z, t = px * s.dx + pz * s.dz;
        if (t < 2 || t > s.len + s.beyond) continue;
        const rad = lerp(1.4, s.r, Math.min(1, t / s.len)) + pad;
        if (Math.abs(px * s.dz - pz * s.dx) < rad) top = Math.min(top, s.y + s.slope * t - rad);
      }
      return top;
    };

    // ---------- grass: full blades beside the route, lighter ones behind them, flat ribbons far off and for the lawns
    const blades = [ladyBlade, ...miniBlades], giants = [];
    const roofU = [0.24, 0.34], gladeU = [0.2, 0.55];
    {
      const cs = 1.7, rb = RL['blade-grid']; let row = 0;
      for (let gz = -150; gz < 472; gz += cs) {
        await ctx.yield(); row++;
        for (let gx = -178; gx < 198; gx += cs) {
          const x = gx + rb() * cs, z = gz + rb() * cs, n = path.nearestXZ(x, z), d = n.dist;
          const cl = inClearing(x, z), clump = noise.n2(x * 0.045, z * 0.045), fine = noise.n2(x * 0.16 + 9, z * 0.16);
          const corridor = 7.2 + 2.6 * smoothstep(gladeU[0], gladeU[0] + 0.06, n.u) * (1 - smoothstep(gladeU[1] - 0.05, gladeU[1], n.u)) * (0.6 + 0.4 * fine);
          let p, hMul = 1, wMul = 1, tuft = false, zone = 0;
          if (cl > 0) { if (cl < 2.5 || (Math.abs(z) < 4 && Math.abs(x) < 27 * WEB_S)) continue; p = 0.17 * (0.5 + 0.8 * smoothstep(-0.5, 0.5, clump)); hMul = 0.24; tuft = true; }
          else if (d < corridor) { p = 0.55; tuft = true; }
          else {
            const web = Math.abs(x) < 125 && z > -70 && z < 205;
            p = d < 24 ? 0.85 : d < 60 ? 0.3 * dens : (web ? 0.105 : 0.042) * dens * QD;
            if (d > 60) { hMul = 1.25; wMul = 1.8; }
            if (z > 10 && z < 200 && cl > -34) {                                          // tall wall round the clearing: its rim stands above the camera
              const side = smoothstep(192, 166, z), k = clamp(-cl / 34, 0, 1);
              hMul *= lerp(lerp(1.7, 1, k), lerp(2.7, 1.25, k), side);
              if (d > 24) p = Math.max(p, lerp(0.5, 0.12, k) * side); wMul *= 1 + 0.25 * side;
            }
            if (z > 180 && z < 250 && d < 30) { hMul *= 1.0 + 0.5 * smoothstep(250, 205, z); if (d < 22) p *= 0.6; }  // the blades the camera climbs out through
            if (z < -6 && Math.abs(x) < 150) { zone = 1; hMul *= lerp(0.5, 0.78, smoothstep(-20, -130, z)); wMul = 1.5; p = 0.62 * QD * (0.6 + 0.5 * smoothstep(-0.6, 0.3, clump)); }   // the dewy lawn behind the Web: low, thick, back-lit
            else if (n.u > gladeU[0] && n.u < gladeU[1] && d < 30) {                      // the middle stretch stands in clumps with gaps of light between them
              p *= 0.16 + 0.95 * smoothstep(-0.25, 0.3, clump);
              hMul *= 0.72 + 0.4 * smoothstep(-0.3, 0.5, clump);
            } else p *= 0.6 + 0.6 * smoothstep(-0.5, 0.4, noise.n2(x * 0.035, z * 0.035));
            if (n.u < 0.07 && d < 26) hMul *= 1.3;                                          // the entry: blades stand well over the camera
            if (n.u > 0.47 && n.u < 0.6 && d < 17 && cl < -3) p *= 0.36;                    // where the camera climbs out the blades part
            if (n.u > 0.455 && n.u < 0.62 && d < 26 && cl <= 0) {                           // and stand down one side only: a dark frame beside the open view of the Web
              path.tangentAt(n.u, TG); path.pointAt(n.u, PT);
              if (((x - PT.x) * TG.z - (z - PT.z) * TG.x) * mx < 0) { const k = smoothstep(0.455, 0.49, n.u); p *= 1 - 0.9 * k; hMul *= 1 - 0.5 * k; }
            }
          }
          if (rb() > p) continue;
          if (Math.hypot(x - 27.5 * WEB_S, z) < 15 || Math.hypot(x + 27.5 * WEB_S, z) < 15) continue;
          let skip = false; for (const k of keepOut) if (Math.hypot(x - k[0], z - k[1]) < k[2]) skip = true;
          if (skip) continue;
          const y = hAtN(x, z, n) - 0.3;
          let H = (d < 26 ? rb.range(10, 18) : rb.range(8, 15)) * hMul, bend = rb.range(0.05, 0.42), rot = rb() * TAU;
          if (cl <= 0 && d < corridor) { H = Math.min(rb.range(0.9, 2.3) + 2.2 * smoothstep(7.2, corridor, d), n.y - y - 2.7); if (H < 0.7) continue; bend = rb.range(0.1, 0.5); }
          if (cl <= 0 && d < 40 && sights.length) {                                         // nothing stands between the route and its subjects
            const top = sightTop(x, z, 1.1 + 0.07 * H);
            if (y + H > top) { H = top - y; if (H < 1.6) continue; tuft = tuft || H < 5; }
          }
          const W = tuft ? (0.3 + 0.07 * H) * rb.range(0.8, 1.3) * (zone ? 1.5 : 1) : (0.5 + 0.04 * H) * rb.range(0.85, 1.3) * wMul;
          if (!tuft && d < 18) {       // near the route a blade may arch toward it only when it stays out of the corridor
            path.pointAt(n.u, PT);
            const tw = Math.sin(rot) * (PT.x - x) + Math.cos(rot) * (PT.z - z);
            if (tw > 0 && (H * 0.9 + y - n.y < 8.5 || d - bend * H < 4.5)) rot += Math.PI;
          }
          const lod = (cl > 0 || zone || d > 44) && H < 23 ? 2 : (tuft || d > 15.5) && H < 26 ? 1 : 0;
          blades.push({ x, z, y, rot, lean: rb.range(-0.1, 0.1), H, W, bend, amp: H * rb.range(0.035, 0.07), sp: spAt(x, z), rp: rb() * TAU,
            tint: rb.range(0.82, 1.15) * (zone ? lerp(0.32, 0.95, smoothstep(0.05, 0.4, noise.n2(x * 0.055 + z * 0.004, z * 0.011 + 7))) * lerp(0.5, 1, Math.max(smoothstep(26, 58, Math.abs(x)), smoothstep(-44, -66, z))) : 1), d, u: n.u, warm: rb(), lod, zone });
        }
      }
      // giants standing in the clearing beside the run: near silhouettes that slide past the camera. Each is pushed
      // outward until no point of it (with its sway) comes within 8.5 m of the path, and kept off the sight line to the Web.
      const rg = RL.giants;
      for (let k = 0; k < 9; k++) {
        const z = 153 - k * 12.5 + rg.range(-3, 3), side = (k % 2 ? 1 : -1) * mx, H = rg.range(31, 40), bend = rg.range(0.28, 0.46);
        let lat = Math.max(10.5, 5 + 27 * (165 - z) / 165) + rg.range(0, 2.5), b = null;
        const rot = Math.atan2(side * rg.range(0.25, 0.9), rg.range(0.5, 1));
        for (let tries = 0; tries < 12; tries++, lat += 1) {
          b = mkBlade(side * lat, z, rot, rg.range(-0.06, 0.06), H, (0.5 + 0.04 * H) * rg.range(1.05, 1.3), bend, H * 0.045, rg.range(0.95, 1.15), rg);
          let ok = true;
          for (let yf = 0.3; yf <= 1.001; yf += 0.05) { bladePoint(b, yf, PT); if (path.distanceTo(PT.x, PT.y, PT.z) < 8.5 + b.amp * yf * yf) ok = false; }
          if (ok) break;
        }
        const gone = (rare && Math.hypot(b.x - SNAIL.x, b.z - SNAIL.z) < SNAIL.r + 3) || nearNew(b.x, b.z);     // the snail has the room; so have the elder toadstool, the small web and the wilding
        b.warm = rg(); b.lod = 0; b.giant = true; if (!gone) { blades.push(b); giants.push(b); }
        for (let q = 0; q < 2; q++) {                 // each has a couple of lesser companions at its foot
          const a2 = rg() * TAU, r2 = rg.range(1.5, 4), c = mkBlade(b.x + Math.cos(a2) * r2 + side * 2, b.z + Math.sin(a2) * r2, rg() * TAU, rg.range(-0.1, 0.1), H * rg.range(0.35, 0.6), 1.5, rg.range(0.2, 0.45), 1.0, rg.range(0.85, 1.1), rg);
          let ok = !gone;
          for (let yf = 0.3; yf <= 1.001; yf += 0.1) { bladePoint(c, yf, PT); if (path.distanceTo(PT.x, PT.y, PT.z) < 9.5) ok = false; }
          if (ok) { c.warm = rg(); c.lod = 0; blades.push(c); }
        }
      }
      await ctx.yield();
      const geos = [bladeGeometry(pal), bladeGeometry(pal, [0, 0.3, 0.65, 1]), bladeGeometry(pal, [0, 0.34, 0.7, 1], true)], chunks = new Map();
      await ctx.yield();
      const order = blades.slice().sort((p, q) => q.z - p.z);
      await ctx.yield();
      let bi = 0;
      for (const b of order) {
        if (++bi % 250 === 0) await ctx.yield();
        const Hs = b.H * (1 - 0.2 * b.bend * b.bend), t = b.tint, w = b.warm ?? 0.5;
        const item = { m: trs(b.x, b.y, b.z, b.rot, b.lean, 0, b.W, Hs, b.W), v: [b.sp, b.rp, b.amp, (b.bend * b.H) / b.W], c: b.zone && t < 0.6 ? [t * 0.8, t, t * 1.12] : [t * (0.92 + 0.2 * w), t, t * (1.0 - 0.25 * w)] };
        const key = ((b.zone ? 0 : 1 + Math.floor((b.z + 150) / 78)) * 2 + (b.x < 0 ? 0 : 1)) * 3 + (b.lod ?? 0);
        if (!chunks.has(key)) chunks.set(key, []);
        chunks.get(key).push(item);
      }
      await ctx.yield();
      for (const key of [...chunks.keys()].sort((p, q) => q - p)) {
        const lod = key % 3, m = instancedPlants(geos[lod], plantMat, chunks.get(key), 32); m.name = ['blades', 'blades-mid', 'blades-far'][lod]; m.renderOrder = -0.2; scene.add(m);
        if (key < 6) lateObjs.push(m);                 // the lawn behind the Web is not drawn until the forest is half flown
        await ctx.yield();
      }
      // the arching blade that holds the big drop
      const am = instancedPlants(archBladeGeometry(pal, dropArch.reach, dropArch.tipY, 1.9), plantMat,
        [{ m: trs(dropRoot.x, dropRoot.y, dropRoot.z, dropArch.rot, 0, 0, 1), v: [dropArch.sp, dropArch.rp, dropArch.amp, 0], c: [1.06, 1.1, 0.9] }], 20);
      am.name = 'drop-blade'; scene.add(am); await ctx.yield();
      const gm = instancedPlants(archBladeGeometry(pal, garArch.reach, garArch.tipY, 1.7), plantMat,
        [{ m: trs(garRoot.x, garRoot.y, garRoot.z, garArch.rot, 0, 0, 1), v: [garArch.sp, garArch.rp, garArch.amp, 0], c: [1.0, 1.08, 0.9] }], 20);
      gm.name = 'necklace-blade'; scene.add(gm); await ctx.yield();
    }
    await ctx.yield();

    // ---------- dew: drops on the blades (tips, and beads along the midrib), the big drop, a few that fall
    const dew = { pos: [], sw: [], dat: [] };
    let dewR = R.dew;      // the stream the drops of the block being built draw from (a loop with a stream of its own sets it and gives it back)
    const addDrop = (p, r, sp, rp, amp, s, falls = 0, rr = dewR) => {
      dew.pos.push(p.x, p.y, p.z, r); dew.sw.push(sp, rp, amp, s);
      dew.dat.push(rr(), falls, falls ? rr.range(5, 11) : 0, rr());
    };
    dewR = RL['blade-dew'];
    for (const b of blades) {
      if (b === ladyBlade || b.sg) continue;
      const rd = dewR;
      if (b.zone) {                                   // the lawn behind the Web: a bead on about one tip in seven, so the whole lawn glitters
        if (rd() < 0.15 * Math.min(1.2, VAR.dew)) { const r = rd.range(0.22, 0.5); bladePoint(b, 1, PT); PT.y -= r * 0.5; addDrop(PT, r, b.sp, b.rp, b.amp, 1); }
        continue;
      }
      if (!(b.d < 34)) continue;
      const near = b.d < 16 ? 1 : 0.55;
      if (rd() < 0.42 * near * VAR.dew) { const r = rd.range(0.14, 0.42) * (rd() < 0.12 ? 1.7 : 1); bladePoint(b, 1, PT); PT.y -= r * 0.85; if (path.distanceTo(PT.x, PT.y, PT.z) > 6 + r) addDrop(PT, r, b.sp, b.rp, b.amp, 1, rd() < 0.2 ? 1 : 0); }
      const nb = rd() < 0.5 * near * VAR.dew ? rd.int(1, 3) : 0;
      for (let k = 0; k < nb; k++) { const yf = rd.range(0.35, 0.95), r = rd.range(0.08, 0.26); bladePoint(b, yf, PT, r * 0.8 + 0.1); if (path.distanceTo(PT.x, PT.y, PT.z) > 6) addDrop(PT, r, b.sp, b.rp, b.amp, yf); }
    }
    for (const b of giants) {
      const rd = dewR, r = rd.range(0.35, 0.6); bladePoint(b, 1, PT); PT.y -= r * 0.85; addDrop(PT, r, b.sp, b.rp, b.amp, 1, rd() < 0.4 ? 1 : 0);
      for (let k = 0; k < 6; k++) { const yf = rd.range(0.45, 0.97), r2 = rd.range(0.14, 0.4); bladePoint(b, yf, PT, r2 * 0.8 + 0.1); addDrop(PT, r2, b.sp, b.rp, b.amp, yf); }
    }
    dewR = R.dew;
    await ctx.yield();
    // ---------- toadstool ring in the clearing (the path crosses high above it)
    const rf = R.flora, mossItems = [], stools = [];
    {
      const items = [];
      const rq = RL.ring; dewR = rq;
      for (let k = 0; k < VAR.toadstools; k++) {
        // a horseshoe open toward the Web: nothing tall stands on the floor of the last stretch, where the gaze is up on the silk
        const an = Math.PI / 2 + ((k + 0.5) / VAR.toadstools - 0.5) * (TAU - 1.9) + rq.range(-0.12, 0.12), rr = VAR.ringR * rq.range(0.92, 1.08), s = rq.range(0.75, 1.25);
        const x0 = Math.cos(an) * rr, z = VAR.ringZ + Math.sin(an) * rr * 1.15;
        // none under the route: one that would stand within reach of it is moved out to the side it already stands on
        let x = x0; { const nn = path.nearestXZ(x0, z), need = 4.8 * s + 8.2; if (nn.dist < need) { path.pointAt(nn.u, PT); x = PT.x + (x0 < PT.x ? -need : need); } }
        if (nearNew(x, z)) continue;                                // the elder, the small web and the wilding have their own ground
        const y = hAt(x, z) - 0.25;
        stools.push({ x, y, z, s });
        items.push({ m: trs(x, y, z, rq() * TAU, rq.range(-0.08, 0.08), rq.range(-0.08, 0.08), s), v: [0, 0, 0, 0] });
        for (let q = 0; q < 3; q++) { const rr2 = rq.range(0.4, 3.3) * s, a2 = rq() * TAU, r = rq.range(0.25, 0.55); PT.set(x + Math.cos(a2) * rr2, y + (9.05 * s - 0.085 * rr2 * rr2 / s) + r * 0.7, z + Math.sin(a2) * rr2); addDrop(PT, r, 0, 0, 0, 0); }
        for (let q = 0; q < 2; q++) { const a2 = rq() * TAU, d2 = rq.range(2.5, 6) * s, ms = rq.range(1.6, 3.6); mossItems.push({ m: trs(x + Math.cos(a2) * d2, hAt(x + Math.cos(a2) * d2, z + Math.sin(a2) * d2) - 0.1, z + Math.sin(a2) * d2, rq() * TAU, 0, 0, ms, ms * rq.range(0.7, 1.1), ms), v: [0, 0, 0, 0], c: [rq.range(0.85, 1.2), 1, 0.9] }); }
      }
      dewR = R.dew;
      {                                 // the elder of the ring: the route swings in beside its cap. A lesser one behind it, youngsters and moss at its foot
        const { x, z, s } = ELDER, y = hAt(x, z) - 0.3, out = x < 0 ? -1 : 1;
        stools.push({ x, y, z, s });
        items.push({ m: trs(x, y, z, RN.elder() * TAU, 0.04, 0.05 * out, s), v: [0, 0, 0, 0] });
        for (let q = 0; q < 9; q++) { const rr2 = RN.elder.range(0.4, 4.1) * s, a2 = RN.elder() * TAU, r = RN.elder.range(0.32, 0.7); PT.set(x + Math.cos(a2) * rr2, y + (9.05 * s - 0.085 * rr2 * rr2 / s) + r * 0.7, z + Math.sin(a2) * rr2); addDrop(PT, r, 0, 0, 0, 0, 0, RN.elder); }
        for (let q = 0; q < 5; q++) { const a2 = (q / 5) * TAU + RN.elder.range(-0.3, 0.3), r = RN.elder.range(0.3, 0.55); PT.set(x + Math.cos(a2) * 4.66 * s, y + 5.95 * s - r * 0.8, z + Math.sin(a2) * 4.66 * s); addDrop(PT, r, 0, 0, 0, 0, q < 2 ? 1 : 0, RN.elder); }   // drops hanging from the rim of its cap; two let go and grow again
        const x1 = x + out * 7.5, z1 = z - 12, s1 = 0.92; stools.push({ x: x1, y: hAt(x1, z1) - 0.25, z: z1, s: s1 });
        items.push({ m: trs(x1, hAt(x1, z1) - 0.25, z1, RN.elder() * TAU, -0.06, 0.05, s1), v: [0, 0, 0, 0] });
        for (let q = 0; q < 3; q++) { const a2 = RN.elder.range(-1.2, 1.2) + (out > 0 ? Math.PI : 0), d2 = RN.elder.range(8.2, 10.5), s2 = RN.elder.range(0.3, 0.5), x2 = x + Math.cos(a2) * d2, z2 = z + Math.sin(a2) * d2; items.push({ m: trs(x2, hAt(x2, z2) - 0.2, z2, RN.elder() * TAU, 0.06, 0.06, s2), v: [0, 0, 0, 0] }); }
        for (let q = 0; q < 5; q++) { const a2 = RN.elder() * TAU, d2 = RN.elder.range(3, 9.5), ms = RN.elder.range(1.8, 3.8), x2 = x + Math.cos(a2) * d2, z2 = z + Math.sin(a2) * d2; mossItems.push({ m: trs(x2, hAt(x2, z2) - 0.1, z2, RN.elder() * TAU, 0, 0, ms, ms * RN.elder.range(0.45, 0.75), ms), v: [0, 0, 0, 0], c: [RN.elder.range(0.85, 1.2), 1, 0.9] }); }
      }
      {                                 // the lone one in the forest, with two youngsters at its foot
        const { x, z, s } = loneStool, y = hAt(x, z) - 0.3;
        items.push({ m: trs(x, y, z, rf() * TAU, 0.05, -0.04, s), v: [0, 0, 0, 0] });
        for (let q = 0; q < 5; q++) { const rr2 = rf.range(0.4, 3.6) * s, a2 = rf() * TAU, r = rf.range(0.3, 0.6); PT.set(x + Math.cos(a2) * rr2, y + (9.05 * s - 0.085 * rr2 * rr2 / s) + r * 0.7, z + Math.sin(a2) * rr2); addDrop(PT, r, 0, 0, 0, 0); }
        for (let q = 0; q < 2; q++) { const a2 = rf() * TAU, d2 = rf.range(3.4, 5.2), s2 = rf.range(0.3, 0.45), x2 = x + Math.cos(a2) * d2, z2 = z + Math.sin(a2) * d2; items.push({ m: trs(x2, hAt(x2, z2) - 0.2, z2, rf() * TAU, 0.06, 0.06, s2), v: [0, 0, 0, 0] }); }
        for (let q = 0; q < 4; q++) { const a2 = rf() * TAU, d2 = rf.range(2.5, 7), ms = rf.range(1.6, 3.4), x2 = x + Math.cos(a2) * d2, z2 = z + Math.sin(a2) * d2; mossItems.push({ m: trs(x2, hAt(x2, z2) - 0.1, z2, rf() * TAU, 0, 0, ms, ms * rf.range(0.45, 0.7), ms), v: [0, 0, 0, 0], c: [rf.range(0.85, 1.2), 1, 0.9] }); }
      }
      for (let k = 0; k < 4; k++) {     // a few youngsters outside the ring
        const ry = RL.young, x = ry.range(-36, 36), z = ry.range(24, 170), s = ry.range(0.35, 0.55);
        if (Math.abs(Math.hypot(x, (z - VAR.ringZ) / 1.15) - VAR.ringR) < 8 || nearNew(x, z)) continue;
        items.push({ m: trs(x, hAt(x, z) - 0.2, z, ry() * TAU, 0.05, 0.05, s), v: [0, 0, 0, 0] });
      }
      const m = instancedPlants(toadstoolGeometry(pal), plantMat, items, 14); m.name = 'toadstools'; scene.add(m);
    }

    // ---------- clover: a roof over the route (u 0.27-0.385), patches in the grass, a carpet in the clearing
    const CH = 11.8, CL = 4; await ctx.yield();
    {
      const forest = [], floor = [];
      const rf = RL.clover; dewR = rf;      // the clover's own stream, under the name its lines have always used
      const tryClover = (x, z, rot, s, list, minBase) => {
        const nb = path.nearestXZ(x, z); if (nb.dist < minBase) return false;
        const y = hAtN(x, z, nb) - 0.2, lx = x + CL * s * Math.cos(rot), lz = z - CL * s * Math.sin(rot), ly = y + CH * s;
        const n = path.nearestXZ(lx, lz), dy = ly - n.y;
        if (dy < 6.4 && Math.hypot(Math.max(0, n.dist - 2.9 * s), dy) < 6.6) return false;
        if (ly + 0.8 > sightTop(lx, lz, 3 * s) || ly > sightTop(x, z, 1)) return false;
        for (const k of keepOut) if (Math.hypot(x - k[0], z - k[1]) < k[2] - 1) return false;
        const sp = spAt(x, z), rp = rf() * TAU, amp = 0.55 * s, t = rf.range(0.85, 1.15);
        list.push({ m: trs(x, y, z, rot, 0, 0, s), v: [sp, rp, amp, 0], c: [t, t, t * rf.range(0.85, 1.05)] });
        if (rf() < 0.36 * VAR.dew && s > 0.5) { const r = rf.range(0.25, 0.55) * Math.min(1, s); PT.set(lx, ly + r * 0.55, lz); addDrop(PT, r, sp, rp, amp, 1); }
        return true;
      };
      for (let i = 0; i < 170; i++) {
        const f = frameAt(rf.range(roofU[0] - 0.005, roofU[1] + 0.005)), side = rf.sign(), bd = 7.5 + 15 * rf() * rf();
        tryClover(f.p.x + f.n.x * bd * side, f.p.z + f.n.z * bd * side, Math.atan2(f.n.z * side, -f.n.x * side) + rf.range(-0.5, 0.5), rf.range(0.96, 1.2), forest, 7.5);
      }
      for (let i = 0; i < 120; i++) {
        const uu = rf() < 0.6 ? rf.range(0.03, 0.26) : rf.range(0.4, 0.56), f = frameAt(uu), side = rf.sign(), bd = rf.range(8, 34);
        tryClover(f.p.x + f.n.x * bd * side, f.p.z + f.n.z * bd * side, rf() * TAU, rf.range(0.55, 0.95), forest, 8);
      }
      for (let c = 0; c < 15; c++) {
        const cx = rf.range(-40, 40), cz = rf.range(20, 172), n = rf.int(12, 22);
        for (let i = 0; i < n; i++) {
          const x = cx + rf.gauss() * 7, z = cz + rf.gauss() * 7;
          if (inClearing(x, z) < 2 || z < 12) continue;
          let bad = false; for (const t of stools) if (Math.hypot(x - t.x, z - t.z) < 5.5 * t.s) bad = true;
          if (!bad) tryClover(x, z, rf() * TAU, rf.range(0.32, 0.6), floor, 0);
        }
      }
      dewR = R.dew; await ctx.yield();
      const geo = cloverGeometry(pal, rf, CH, CL, 2.7), geoLo = cloverGeometry(pal, rf, CH, CL, 2.7, true); await ctx.yield();
      const a = instancedPlants(geo, plantMat, forest, 16), b = instancedPlants(geoLo, plantMat, floor, 12);
      a.name = 'clover-roof'; b.name = 'clover-floor'; scene.add(a, b);
      behindCull.push({ m: a, c: forest.map((it) => V3().setFromMatrixPosition(it.m)), r: 18 });
    }
    await ctx.yield();

    // ---------- daisies: round the clearing and here and there among the blades
    const clearHW = (z) => 46 + 6 * noise.n2(z * 0.03, 5.1) - 32 * smoothstep(148, 184, z);
    {
      const geo = daisyGeometry(pal, rf, 16), top = geo.userData.top, items = [];
      const rz = RL.daisies; dewR = rz;
      for (let i = 0; i < VAR.daisies * 3 && items.length < VAR.daisies; i++) {
        let x, z, s;
        if (rz() < 0.68) { z = rz.range(18, 176); x = rz.sign() * (clearHW(z) - rz.range(2, 16)); s = rz.range(0.85, 1.5); }
        else { const f = frameAt(rz.range(0.03, 0.6)), bd = rz.range(9.5, 32) * rz.sign(); x = f.p.x + f.n.x * bd; z = f.p.z + f.n.z * bd; s = rz.range(0.6, 1.0); }
        const rot = rz() * TAU, y = hAt(x, z) - 0.2;
        PT.set(top.x, top.y, top.z).multiplyScalar(s).applyAxisAngle(V3(0, 1, 0), rot).add(TG.set(x, y, z));
        if (path.distanceTo(PT.x, PT.y, PT.z) < 9.5 || path.nearestXZ(x, z).dist < 7.5 || PT.y + 2 > sightTop(PT.x, PT.z, 2.5)) continue;
        if (rare && Math.hypot(x - SNAIL.x, z - SNAIL.z) < SNAIL.r) continue;
        if (PT.y > 10 && Math.abs(PT.x) < 30 && z < 182) continue;      // the damselflies' lanes across the clearing stay clear
        const sp = spAt(x, z), rp = rz() * TAU;
        items.push({ m: trs(x, y, z, rot, 0, 0, s), v: [sp, rp, 0.9 * s, 0] });
        if (rz() < 0.3) { PT.y += 0.5 * s; addDrop(PT, rz.range(0.2, 0.4), sp, rp, 0.9 * s, 1); }
      }
      for (const [z0, side, out] of [[146, 1, 0], [122, 1, 3], [91, -1, 14]]) {     // three big ones whose heads pass at camera height, each on the side the route swings away from there
        const s = rz.range(1.05, 1.25), rot = rz() * TAU;
        for (let lat = Math.max(12, 6 + 27 * (165 - z0) / 165) + out, tries = 0; tries < 12; tries++, lat += 1) {
          const x = side * mx * lat, z = z0 + rz.range(-3, 3), y = hAt(x, z) - 0.2;
          PT.set(top.x, top.y, top.z).multiplyScalar(s).applyAxisAngle(V3(0, 1, 0), rot).add(TG.set(x, y, z));
          if (path.distanceTo(PT.x, PT.y, PT.z) < 11.5 + 2.4 * s || nearNew(x, z)) continue;
          const sp = spAt(x, z), rp = rz() * TAU;
          items.push({ m: trs(x, y, z, rot, 0, 0, s), v: [sp, rp, 0.8 * s, 0] });
          PT.y += 0.5 * s; addDrop(PT, 0.5, sp, rp, 0.8 * s, 1);
          break;
        }
      }
      dewR = R.dew;
      const m = instancedPlants(geo, plantMat, items, 30); m.name = 'daisies'; scene.add(m); await ctx.yield();
    }

    // ---------- dandelion clocks; the big one inside the third bend lets its seeds go across the route from u ~ 0.38
    const seedMat = makeSeedMaterial(U), seedGeo = seedGeometry(); await ctx.yield();
    const fib = []; for (let k = 0; k < 100; k++) { const y = 1 - (2 * (k + 0.5)) / 100, r = Math.sqrt(1 - y * y), a = k * 2.39996; fib.push(V3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    const UP = V3(0, 1, 0);
    const relHead = { c: V3(), sp: 0, rp: 0, amp: 0, hs: 1 }, relSeeds = [];
    let nLoose = 0;
    {
      const stems = [], seedsF = [], seedsC = []; seedsF.cen = []; seedsC.cen = [];      // the clocks of the forest half and those of the clearing: two meshes, so the far ones are not drawn from the other end
      const addClock = (x, z, H, release, hs, seeds = seedsC, rf = R.flora) => {
        const y = hAt(x, z) - 0.3, wd = release ? 1.7 : 0.9, m = trs(x, y, z, rf() * TAU, rf.range(-0.05, 0.05), rf.range(-0.05, 0.05), wd, H, wd);
        const c = V3(0, 1, 0).applyMatrix4(m), sp = spAt(x, z), rp = rf() * TAU, amp = release ? 0.45 : H * 0.055;
        stems.push({ m, v: [sp, rp, amp, 0] });
        mossItems.push({ m: trs(c.x, c.y - 0.1 * hs, c.z, 0, 0, 0, 0.6 * hs), v: [sp, rp, amp, 0], c: [2.2, 1.7, 1.2] });
        if (release) Object.assign(relHead, { c, sp, rp, amp, hs });
        seeds.cen.push(c);
        for (let k = 0; k < fib.length; k++) {
          const q = new THREE.Quaternion().setFromUnitVectors(UP, fib[k]);
          if (release && fib[k].y > -0.6 && rf() < 0.5 && nLoose++ % 3 === 0) { relSeeds.push({ q, d: fib[k] }); continue; }      // one in three of the loose ones flies
          seeds.push({ m: new THREE.Matrix4().compose(c, q, _s.set(hs, hs, hs)), v: [sp, rp, amp, 1] });
        }
        if (release) for (let e = 0; e < 48; e++) {       // a second, looser shell: every fifth of it flies, a third of it stays, so the globe is still a globe while they peel away
          const yy = 1 - ((e + 0.5) / 48) * 1.4, r = Math.sqrt(1 - yy * yy), a = e * 2.39996 + 1.3, d = V3(Math.cos(a) * r, yy, Math.sin(a) * r), q = new THREE.Quaternion().setFromUnitVectors(UP, d);
          if (e % 5 === 0) relSeeds.push({ q, d }); else if (e % 3 === 1) seeds.push({ m: new THREE.Matrix4().compose(c, q, _s.set(hs, hs, hs)), v: [sp, rp, amp, 1] });
        }
        return c;
      };
      addClock(dandBase.x, dandBase.z, dandHeadY - hAt(dandBase.x, dandBase.z) + 0.3, true, CLOCK_S, seedsF);
      const rk = RL.clocks;
      for (let i = 0, made = 0; i < 60 && made < VAR.clocks; i++) {
        let x, z, H;
        if (made < VAR.clocks - 2) { z = rk.range(24, 172); x = rk.sign() * (clearHW(z) - rk.range(4, 20)); H = rk.range(19, 31); }
        else { const f = frameAt(rk.range(0.04, 0.3)), bd = rk.range(13, 30) * rk.sign(); x = f.p.x + f.n.x * bd; z = f.p.z + f.n.z * bd; H = rk.range(15, 21); }
        if (path.distanceTo(x, H, z) < 12 || Math.hypot(x - 27.5, z) < 16 || Math.hypot(x + 27.5, z) < 16 || H + 2 > sightTop(x, z, 2.5)) continue;
        if (rare && Math.hypot(x - SNAIL.x, z - SNAIL.z) < SNAIL.r + 2) continue;
        addClock(x, z, H, false, rk.range(0.95, 1.3), made < VAR.clocks - 2 ? seedsC : seedsF, rk); made++;
      }
      const sm = instancedPlants(dandelionStemGeometry(pal), plantMat, stems, 34); sm.name = 'dandelion-stems'; scene.add(sm); await ctx.yield();
      for (const list of [seedsF, seedsC]) if (list.length) { const hm = instancedPlants(seedGeo, seedMat, list, 6); hm.name = 'dandelion-clocks'; hm.renderOrder = 3; scene.add(hm); behindCull.push({ m: hm, c: list.cen, r: 8 }); }
    }
    // the seeds that fly: about a score of tufts, moved on the CPU. Everything about their flight is a length in METRES OF
    // ROUTE measured from places: they are let go while we fly from the ladybird's blade to one stalk-height short of the
    // clock (the side of the head that faces the visit's wind goes first), take station down the route ahead of us, from
    // two to five stalk-heights off, each at its own tilt, rising slowly, and we gain on each a little all its life: the Web
    // is first seen whole through a slow snow of them.
    const relMesh = instancedPlants(tuftGeometry(), makeTuftMaterial(U), relSeeds.map(() => ({ m: new THREE.Matrix4(), v: [0, 0, 0, 1] })), 1e5);
    relMesh.name = 'flying-seeds'; relMesh.frustumCulled = false; relMesh.renderOrder = 3; relMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const relFade = relMesh.geometry.attributes.iVar; relFade.setUsage(THREE.DynamicDrawUsage);
    scene.add(relMesh);
    // STALK = how high the clock's head stands over its foot (some 13 m): the tufts' measure
    const STALK = dandHeadY - hAt(dandBase.x, dandBase.z), tuftFrom = sAbeam(ladyAt), tuftTo = sAbeam(dandBase) - STALK;
    relSeeds.forEach((s, i) => {
      const windward = 0.5 - 0.5 * (s.d.x * wind.x + s.d.z * wind.y);     // the side of the head that faces the visit's wind goes first
      const f1 = (i * 0.618034 + 0.11) % 1, f2 = (i * 0.754878 + 0.47) % 1, f3 = (i * 0.569840 + 0.3) % 1;       // spread evenly, not in clumps
      s.mR = lerp(tuftFrom, tuftTo, clamp(0.6 * windward + 0.4 * RN.tufts(), 0, 1));      // the route metres at which it is let go
      s.lead = lerp(2, 5, f2 * f2 * 0.5 + f2 * 0.5) * STALK; s.lat = lerp(-1, 1, f1) * (3 + 0.6 * s.lead) + RN.tufts.range(-1.5, 1.5); s.up = lerp(-1, 11, f3) + RN.tufts.range(-1, 1); s.drift = RN.tufts.range(-0.02, 0.02);
      s.ph = RN.tufts() * TAU; s.spin = RN.tufts.range(-0.35, 0.35); s.tx = RN.tufts.range(-0.45, 0.45); s.tz = RN.tufts.range(-0.45, 0.45); s.life = RN.tufts.range(6, 8.5) * STALK;      // how many metres we fly before it has faded
    });
    await ctx.yield();

    // ---------- moss cushions: at the feet of the foxgloves, along the route, across the clearing; the ones beside the
    // route wear a fuzz of pale sporophyte hairs that catches the back-light
    const hairs = [];
    {
      const fuzz = (x, y, z, ms, hgt, rf) => {
        const n = Math.round(34 * QD);
        for (let q = 0; q < n; q++) {
          const a2 = rf() * TAU, rr = ms * Math.sqrt(rf()) * 0.92, hx = x + Math.cos(a2) * rr, hz = z + Math.sin(a2) * rr, hh = rf.range(0.5, 1.25);
          const hy = y + hgt * 0.6 * Math.sqrt(Math.max(0, 1 - (rr / ms) * (rr / ms))) - 0.05, t = rf.range(0.9, 1.5);
          hairs.push({ m: trs(hx, hy, hz, rf() * TAU, rf.range(-0.25, 0.25), rf.range(-0.25, 0.25), 0.07, hh, 0.07), v: [spAt(hx, hz), rf() * TAU, hh * 0.12, 1.5], c: [1.5 * t, 1.35 * t, 0.7 * t] });
        }
      };
      for (const sb of hero.anchors.stemBases) for (let q = 0; q < 4; q++) { const a2 = rf() * TAU, d2 = rf.range(4, 11), ms = rf.range(2, 4.5), x = sb.x * WEB_S + Math.cos(a2) * d2, z = sb.z * WEB_S + 6 + Math.sin(a2) * d2 * 0.7; mossItems.push({ m: trs(x, hAt(x, z) - 0.1, z, rf() * TAU, 0, 0, ms, ms * 0.8, ms), v: [0, 0, 0, 0], c: [1, 1, 0.9] }); }
      const rm = RL.moss; await ctx.yield();
      for (let i = 0; i < 64; i++) { if (i % 16 === 15) await ctx.yield();
        const f = frameAt(rm.range(0.01, 0.6)), bd = rm.range(5.5, 19) * rm.sign(), ms = rm.range(1.4, 3.6) * (Math.abs(bd) < 8 ? 0.75 : 1), x = f.p.x + f.n.x * bd, z = f.p.z + f.n.z * bd, hgt = ms * rm.range(0.6, 1), y = hAt(x, z) - 0.1;
        if (y + hgt * 0.6 > f.p.y - 3.4) continue;
        mossItems.push({ m: trs(x, y, z, rm() * TAU, 0, 0, ms, hgt, ms), v: [0, 0, 0, 0], c: [rm.range(0.8, 1.2), 1, 0.9] });
        if (Math.abs(bd) < 15) fuzz(x, y, z, ms, hgt, rm);
      }
      for (let i = 0; i < 26; i++) { const z = rf.range(18, 176), x = rf.range(-1, 1) * (clearHW(z) - 4), ms = rf.range(2, 5.5); mossItems.push({ m: trs(x, hAt(x, z) - 0.15, z, rf() * TAU, 0, 0, ms, ms * rf.range(0.5, 0.8), ms), v: [0, 0, 0, 0], c: [rf.range(0.85, 1.25), 1, 0.85] }); } await ctx.yield();
      const m = instancedPlants(mossGeometry(pal, rf, noise, 3), plantMat, mossItems, 8); m.name = 'moss'; scene.add(m); await ctx.yield();
      const hm = instancedPlants(bladeGeometry(pal, [0, 0.5, 1], true), plantMat, hairs, 4); hm.name = 'moss-hairs'; scene.add(hm);
    }
    await ctx.yield();

    // ---------- the forest floor under the camera: wet pebbles and soil crumbs with lit edges, fallen petals, clover
    // sprouts, beads of water that flash
    {
      const fl = RL.litter, pebbles = [], crumbs = [], petals = [], sprouts = [], tul = VAR.tulips.map((h) => new THREE.Color(h));
      const N = Math.round(900 * dens * QD); dewR = fl;
      for (let i = 0; i < N; i++) { if (i % 128 === 127) await ctx.yield();
        const u = fl.range(0.0, 0.6), f = frameAt(u), bd = fl.gauss() * 6.5, x = f.p.x + f.n.x * bd + fl.range(-1, 1), z = f.p.z + f.n.z * bd + fl.range(-1, 1);
        if (Math.abs(bd) > 17 || inClearing(x, z) > 0) continue;
        const y = hAt(x, z), k = fl();
        if (k < 0.14) { const s = fl.range(0.3, 0.9), g = fl.range(0.28, 0.7); pebbles.push({ m: trs(x, y + s * 0.12, z, fl() * TAU, fl.range(-0.3, 0.3), fl.range(-0.3, 0.3), s * fl.range(0.8, 1.4), s * fl.range(0.45, 0.7), s), v: [0, 0, 0, 0], c: [g * 1.05, g, g * 0.9] }); }
        else if (k < 0.5) { const s = fl.range(0.14, 0.42), g = fl.range(0.35, 0.8); crumbs.push({ m: trs(x, y + s * 0.3, z, fl() * TAU, fl() * 3, fl() * 3, s * fl.range(0.8, 1.5), s, s), v: [0, 0, 0, 0], c: [g * 0.75, g * 0.55, g * 0.38] }); }
        else if (k < 0.74) { const s = fl.range(0.8, 1.9), c = fl() < 0.45 ? tul[fl.int(0, 2)] : new THREE.Color(0.82, 0.8, 0.76); petals.push({ m: trs(x, y + 0.12, z, fl() * TAU, fl.range(-0.2, 0.2), fl.range(-0.25, 0.25), s), v: [spAt(x, z), fl() * TAU, 0.05, 0], c: [c.r, c.g, c.b] }); }
        else if (k < 0.9) { const s = fl.range(0.09, 0.2), t = fl.range(0.9, 1.25); if (CH * s < f.p.y - y - 3) sprouts.push({ m: trs(x, y - 0.1, z, fl() * TAU, 0, 0, s), v: [spAt(x, z), fl() * TAU, 0.5 * s, 0], c: [t, t * 1.05, t * 0.85] }); }
        else { const r = fl.range(0.12, 0.34); PT.set(x, y + r * 0.9, z); addDrop(PT, r, 0, 0, 0, 0); }
      }
      const pm = instancedPlants(pebbleGeometry(1), plantMat, pebbles, 4); pm.name = 'pebbles'; scene.add(pm); await ctx.yield();
      const cm = instancedPlants(pebbleGeometry(0), plantMat, crumbs, 4); cm.name = 'crumbs'; scene.add(cm); await ctx.yield();
      const tm = instancedPlants(petalGeometry(), plantMat, petals, 4); tm.name = 'petals'; scene.add(tm); await ctx.yield();
      dewR = R.dew;
      const sm = instancedPlants(cloverGeometry(pal, R.floor, CH, CL, 2.7, true), plantMat, sprouts, 4); sm.name = 'sprouts'; scene.add(sm);
    }
    await ctx.yield();

    // ---------- the flowerbed beyond the Web: a band of back-lit cups three rows deep under the dark hedge, more rows fading into the haze
    {
      const near = [], far = [], cols = VAR.tulips.map((h) => new THREE.Color(h).multiplyScalar(0.9));
      const put = (list, x, z, y, s) => {
        const band = noise.n2(x * 0.006 + 3, z * 0.02), c = cols[band > 0.25 ? 1 : band < -0.3 ? 2 : 0].clone().offsetHSL(rf.range(-0.015, 0.015), 0, rf.range(-0.04, 0.04));
        list.push({ m: trs(x, y, z, rf() * TAU, rf.range(-0.04, 0.04), rf.range(-0.04, 0.04), s), v: [spAt(x, z), rf() * TAU, 1.3 * s, 0], c: [c.r, c.g, c.b] });
      };
      for (const [z0, step, half, s0, list] of [[-60, 10, 150, 0.6, near], [-84, 11.5, 190, 0.7, near], [-112, 13.5, 230, 0.8, near], [-146, 16, 270, 0.94, far], [-188, 19, 300, 1.1, far]]) {
        for (let gx = -half; gx <= half; gx += step) {
          if (rf() < 0.06) continue;
          const x = gx + rf.range(-4, 4), z = z0 + rf.range(-7, 7);
          if (Math.abs(x) < 72 - (z0 + 60) * 0.12) continue;          // none straight behind the Web: its lowest beads stand against the shaded bed and the band
          put(list, x, z, hAt(x, z) - 0.5, s0 * rf.range(0.86, 1.14));
        }
      }
      const rows = Math.round(5 * (0.6 + 0.4 * QD));
      for (let row = 0; row < rows; row++) {
        const gz = -256 - row * 52 - row * row * 4, sc = 1.3 + row * 0.22, step = 24 + row * 5, half = 320 + row * 50;
        for (let gx = -half; gx <= half; gx += step) { if (rf() < 0.1) continue; const x = gx + rf.range(-10, 10); if (Math.abs(x) < 72 - (gz + 60) * 0.12) continue; put(far, x, gz + rf.range(-12, 12), -3.6, sc * rf.range(0.85, 1.2)); }
      }
      const a = instancedPlants(tulipGeometry(pal, rf, false), plantMat, near, 60), b = instancedPlants(tulipGeometry(pal, rf, true), plantMat, far, 60);
      a.name = 'tulips'; b.name = 'tulips-far'; scene.add(a, b); lateObjs.push(a, b);
    }
    await ctx.yield();

    // the big drop goes in last so it is drawn over every other bead: a neck of water round the blade's tip, then the ball
    addDrop(V3(bigDrop.x, dropTip.y + 0.2, bigDrop.z), 0.66, dropArch.sp, dropArch.rp, dropArch.amp, 1);
    addDrop(bigDrop, DROP_R, dropArch.sp, dropArch.rp, dropArch.amp, 1);
    {                                    // the necklace: seven drops hanging under the blade that spans the aisle (the same curve as archBladeGeometry)
      const top = garArch.tipY + 5.2, Pz = [0, -0.08 * garArch.reach, 0.72 * garArch.reach, garArch.reach], Py = [0, top * 0.95, top * 1.32, garArch.tipY];
      const bez = (t, P) => { const q = 1 - t; return q * q * q * P[0] + 3 * q * q * t * P[1] + 3 * q * t * t * P[2] + t * t * t * P[3]; };
      [[0.36, 0.5], [0.45, 0.72], [0.54, 0.98], [0.63, 1.2], [0.72, 0.92], [0.81, 0.7], [0.9, 0.52]].forEach(([t, r]) => {
        const lz = bez(t, Pz);
        addDrop(PT.set(garRoot.x + Math.sin(garArch.rot) * lz, garRoot.y + bez(t, Py) - r * 0.9 - 0.3, garRoot.z + Math.cos(garArch.rot) * lz), r, garArch.sp, garArch.rp, garArch.amp, Math.sqrt(t));
      });
    }
    // ---------- all the dew, one draw call
    let dewMesh;
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(dew.pos), 4));
      g.setAttribute('iSw', new THREE.InstancedBufferAttribute(new Float32Array(dew.sw), 4));
      g.setAttribute('iDat', new THREE.InstancedBufferAttribute(new Float32Array(dew.dat), 4));
      g.instanceCount = dew.pos.length / 4;
      dewMesh = new THREE.Mesh(g, makeDewMaterial(U)); dewMesh.name = 'dew'; dewMesh.frustumCulled = false; dewMesh.renderOrder = 2;
      scene.add(dewMesh);
    }
    await ctx.yield();

    // ---------- far layers: the dark band of fence, hedge and tree crowns under the sun; bokeh highlights riding with the camera
    {
      const bandHaze = fogCol.clone().lerp(new THREE.Color(mood.zenith), 0.7);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(3800, 520), makeBandMaterial(U, bandHaze, new THREE.Color(mood.band), new THREE.Color(mood.bandLeaf),
        pal[4].clone().lerp(new THREE.Color(mood.band), 0.5).multiplyScalar(0.5), (SUN.x / Math.max(0.2, -SUN.z)) * 1040, hourName === 'mist' ? 0.75 : hourName === 'first' ? 0.5 : 0.3, (SUN.y / Math.max(0.2, -SUN.z)) * 1040 + 18));
      band.position.set(0, 240, -960); band.name = 'band'; band.renderOrder = -0.5; scene.add(band);
      const N = Math.round(200 * QD), ip = new Float32Array(N * 4), ic = new Float32Array(N * 4), rb = R.fx;
      const tints = [pal[0], pal[0], pal[0], pal[1], pal[1], pal[5], pal[5], pal[6]];
      const sunAz = Math.atan2(SUN.x, -SUN.z);
      for (let i = 0; i < N; i++) {
        const a = rb() < 0.78 ? sunAz + rb.gauss() * 0.55 : rb() * TAU, dist = rb.range(230, 520), c = rb.pick(tints), k = rb.range(0.07, 0.24) * (rb() < 0.12 ? 2.2 : 1);
        ip.set([Math.sin(a) * dist, 1 + 78 * rb() * rb(), -Math.cos(a) * dist, rb.range(5, 16) * dist / 350], i * 4);
        ic.set([c.r * k, c.g * k, c.b * k, rb() * 40], i * 4);
        if (i >= N * 0.75) {           // a far row low along the foot of the fence and over the flowerbed
          const a2 = sunAz + rb.range(-0.75, 0.75), d2 = rb.range(540, 780), c2 = rb.pick([pal[0], pal[1], pal[1], pal[6], pal[5]]), k2 = rb.range(0.05, 0.13);
          ip.set([Math.sin(a2) * d2, rb.range(4, 58), -Math.cos(a2) * d2, rb.range(12, 30)], i * 4);
          ic.set([c2.r * k2, c2.g * k2, c2.b * k2, rb() * 40], i * 4);
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 4));
      g.instanceCount = N;
      const bokeh = new THREE.Mesh(g, makeBokehMaterial(U)); bokeh.name = 'bokeh'; bokeh.frustumCulled = false; bokeh.renderOrder = 1; scene.add(bokeh);
    }

    // ---------- creatures: the ladybird on its blade, two damselflies before the Web
    const lady = buildLadybird(U, plantMat, R.fauna, new THREE.Color(VAR.lady).multiplyScalar(0.85));
    const LADY_S = 2.4; lady.group.scale.setScalar(LADY_S); scene.add(lady.group);
    const ladyPos = bladePoint(ladyBlade, 0.3, V3());
    const damselWing = makeWingMaterial(U, '#d6f0ff', [44, 0.5, 0.2], [5, 26], 1.3);
    const flies = [0, 1].map((i) => {
      const f = buildDamselfly(U, plantMat, damselWing, R.fauna, i ? new THREE.Color(VAR.damsel).offsetHSL(0.04, 0, 0.03) : VAR.damsel);
      f.group.scale.setScalar(i ? 1.9 : 2.2); scene.add(f.group); return f;
    });
    // the rare visit: the snail, gliding up the clearing beside the run with its wet trail behind it
    let snail = null;
    if (rare) {
      snail = buildSnail(plantMat);
      snail.group.position.set(SNAIL.x, hAt(SNAIL.x, SNAIL.z) - 0.5, SNAIL.z); snail.group.rotation.y = SNAIL.ry; snail.group.scale.setScalar(SNAIL.s); scene.add(snail.group);
      // the trail: from the far end of the clearing, turning in toward the middle where the snail is now
      const tr = makeAcc(), wet = new THREE.Color(0.62, 0.66, 0.56), mid = [];
      let tx = SNAIL.x - Math.sin(SNAIL.ry) * 12, tz = SNAIL.z - Math.cos(SNAIL.ry) * 12, ta = SNAIL.ry + Math.PI;
      for (let k = 0; k <= 26; k++) { mid.push([tx, tz, ta]); ta = lerp(ta, Math.PI + 0.25 * Math.sin(k * 0.7), 0.16); tx += Math.sin(ta) * 3; tz += Math.cos(ta) * 3; }
      addGrid(tr, 1, 26, (u, v) => {
        const c = mid[Math.round(v * 26)], w = (u * 2 - 1) * 3.2 * (1 - 0.5 * v), x = c[0] + Math.cos(c[2]) * w, z = c[1] - Math.sin(c[2]) * w;
        return [x, hAt(x, z) + 0.14, z, wet, 0];
      }, [0, 0, 10, 0]);
      const tm = new THREE.Mesh(accToGeometry(tr), plantMat); tm.name = 'snail-trail'; scene.add(tm);
    }
    await ctx.yield();

    // ---------- air: gold ground mist, pools of mist in the clearing, pollen, shafts of sun between the blades
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const gold = new THREE.Color(mood.sun).lerp(new THREE.Color(mood.mistCol), 0.4);
    set.add(fx.makeMist({ rng: R.fx, time, count: hourName === 'mist' ? 64 : 40, area: [320, 5, 320], center: [0, 3.2, 0], size: [18, 38], color: gold.clone().multiplyScalar(0.8), opacity: 0.2 * VAR.mist,
      drift: [wind.x * 0.9, 0, wind.y * 0.9], follow: true }));
    await ctx.yield();
    {
      const pools = [], rp = R.fx;
      for (let i = 0; i < 18; i++) { const z = rp.range(34, 170), x = rp.range(-1, 1) * (clearHW(Math.max(20, z)) + 12); pools.push([x, rp.range(2.5, 5.5), z]); }
      set.add(fx.makeMist({ rng: R.fx, time, positions: pools, size: [24, 46], color: new THREE.Color(mood.mistCol).lerp(new THREE.Color('#ffffff'), 0.3).multiplyScalar(0.7), opacity: 0.1 * VAR.mist, drift: [0, 0, 0], flatten: 0.3 }));
    }
    await ctx.yield();
    set.add(fx.makeParticles({ rng: R.fx, preset: 'pollen', time, density: 0.8 * mood.pollen * QD, size: [0.07, 0.18] }));
    await ctx.yield();
    // shafts of sun slanting down between the blades, aimed to cross the view a little ahead of the camera and to one side
    const sunFlat = V3(SUN.x, 0, SUN.z).normalize(); let entryGlow = null;
    for (const [uu, lat] of [[0.035, -9], [0.11, 10], [0.23, -10], [0.3, 9], [0.36, -7], [0.42, 9], [0.48, -9]]) {
      // (drawn steeper than the true sun: the kit fades a shaft that is seen end-on, and the camera here looks into the light)
      const f = frameAt(uu + 0.04), tgt = f.p.clone().addScaledVector(f.n, lat * mx); tgt.y = 0;
      const dir = sunFlat.clone().multiplyScalar(-0.64).add(V3(0, -0.77, 0)).normalize(), src = tgt.clone().addScaledVector(dir, -62);
      set.add(fx.makeGodRays({ rng: R.fx, time, position: src, direction: dir, radius: 12, count: 9, length: 66, width: [1.0, 3.6], color: gold,
        intensity: 0.34 * mood.shafts, falloff: 0.9, speed: 0.6, fogAmount: 0.3 }));
      await ctx.yield();
    }
    // the hot core of the sunrise low between the blades straight ahead of the entry (it is what the previous world's portal shows)
    {
      const e = frameAt(0), pos = [], sizes = [];
      for (const [dist, y, sz] of [[210, 40, 1.7], [130, 20, 0.9]]) { const q = e.p.clone().addScaledVector(sunFlat, dist); pos.push([q.x, y, q.z]); sizes.push(sz); }   // straight under the sun as the entry sees it: one soft bloom, no second disc
      entryGlow = set.add(fx.makeGlows({ rng: R.fx, time, positions: pos, sizes, size: 42, color: gold, intensity: 1.0, core: 0.1, halo: 1.4, flicker: 0.05, fogAmount: 0.2, depthBias: 0, near: [0.05, 0.4] }));
    }
    // the dandelion clock glows from inside, and the sun wears a wide warm halo that the blades and the foxgloves cut into
    const clockGlow = set.add(fx.makeGlow({ rng: R.fx, time, position: relHead.c, size: 3.3 * CLOCK_S, color: new THREE.Color(mood.sun).lerp(new THREE.Color('#ffffff'), 0.4), intensity: 0.3, core: 0.3, halo: 1.1, fogAmount: 0.4, depthBias: 0, near: [0.3, 1.2] }));
    const sunHalo = set.add(fx.makeGlow({ rng: R.fx, time, size: 430, color: new THREE.Color(mood.sun).lerp(new THREE.Color(mood.scatter), 0.6), intensity: 0.22, core: 0.2, halo: 1.25, rays: 0.3, fogAmount: 0, depthBias: 0, near: [0.01, 0.02], minAngle: 0, renderOrder: -0.4 }));
    sunHalo.object.frustumCulled = false;
    await ctx.yield();
    // shafts of gold streaming through the Web toward the camera: parallel to the light, so they fan out from the sun in perspective
    U.uShafts = { value: 0 };
    {
      const rs = R.fx, NSH = 30, p = [], dir = [], aa = [], idx = [], D = SUN.clone().negate();
      for (let i = 0; i < NSH; i++) {
        let x = 0, y = 0;
        for (let t = 0; t < 8; t++) { x = rs.range(-38, 38) * WEB_S; y = rs.range(9, HUB + 34); if (Math.hypot(x, y - HUB) > 12.5 * WEB_S) break; }
        const len = Math.min(210, (y - 1.5) / Math.max(0.08, SUN.y)) * rs.range(0.8, 1), w = rs.range(1.3, 3.6), ph = rs() * TAU, b = p.length / 3, SEG = 6;
        const sx = x + SUN.x * 8, sy = y + SUN.y * 8, sz = SUN.z * 8;          // they start a little behind the Web and pierce it
        for (let j = 0; j <= SEG; j++) for (const s of [-1, 1]) { p.push(sx, sy, sz); dir.push(D.x, D.y, D.z, len + 8); aa.push(s, j / SEG, w, ph); }
        for (let j = 0; j < SEG; j++) { const k = b + j * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 4)); g.setAttribute('aA', new THREE.Float32BufferAttribute(aa, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, makeShaftMaterial(U, gold.clone().multiplyScalar(0.3 * 0.85 * mood.shafts))); m.name = 'web-shafts'; m.frustumCulled = false; m.renderOrder = 3.5; scene.add(m);
    }
    await ctx.yield();

    // ---------- per-frame state
    const size = new THREE.Vector2(), sw = V3(), A = V3(), B = V3(), C = V3(), basis = new THREE.Matrix4(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion();
    const mat = new THREE.Matrix4(), camW = V3(), camF = V3(), O = V3();
    const relHeadPos = V3(), MIST0 = U.uMist.value.x;
    let lateOn = true;
    const Dmouth = path.length - sAbeam(V3(-2.6 * mx, 0, 184));      // metres of route left to the hub at the mouth of the clearing (z = 184)

    // The ladybird climbs its blade, lifts its wing cases as the camera comes up (u 0.30-0.335), takes off and then flies
    // down the aisle ahead of the camera, red against the light, until it climbs away over the blades (u 0.41-0.5).
    // where the ladybird flies: ahead of the camera and to its own side of the aisle, so that it is seen three-quarters on
    function ladyFlight(u, away, out, tg) {
      const ul = Math.min(1, u + 0.03 + 0.07 * away);
      path.pointAt(ul, out); path.tangentAt(ul, tg);
      out.x += tg.z * (-5.5 + 15 * away) * mx; out.z -= tg.x * (-5.5 + 15 * away) * mx; out.y += -1.5 + 16 * away * away;
      return out;
    }
    // ---------- the gaze. One point of interest whose target is a function of u alone: the look-ahead direction, turned toward
    // each subject in its own window by at most its cap (a soft limit), so the head never whips round as a subject passes abeam
    // and never looks back; the windows overlap, so there is always a subject inside the frame. The engine's poi at the hub
    // follows it and takes over down the clearing.
    const RAD = Math.PI / 180, gzP = V3(), gzA = V3(), gzQ = V3(), gzT = V3(), gzOut = V3(), gzLady = V3();
    const gzSubjects = [      // at, window in (a0, a1), window out (b0, b1), weight, yaw cap
      { at: bigDrop, a0: 0.06, a1: 0.12, b0: 0.2, b1: 0.25, w: 0.9, cap: 40 * RAD },
      { at: V3(loneStool.x, stoolF.p.y + 3, loneStool.z), a0: 0.2, a1: 0.24, b0: 0.26, b1: 0.3, w: 0.7, cap: 35 * RAD },
      { at: gzLady, a0: 0.27, a1: 0.31, b0: 0.39, b1: 0.44, w: 0.8, cap: 35 * RAD, lady: true },
      { at: V3(dandBase.x, dandHeadY, dandBase.z), a0: 0.39, a1: 0.44, b0: 0.45, b1: 0.5, w: 0.8, cap: 35 * RAD },
      { at: hubW, a0: 0.44, a1: 0.5, b0: 0.57, b1: 0.63, w: 0.85, cap: 60 * RAD },
    ];
    const softCap = (a, cap) => cap * Math.tanh(a / cap), PITCH_CAP = 14 * RAD;
    function gazeAt(time, u) {
      path.pointAt(u, gzP); path.pointAt(Math.min(1, u + 22 / path.length), gzA); gzA.sub(gzP).normalize();
      const yaw0 = Math.atan2(gzA.x, -gzA.z), pit0 = Math.asin(clamp(gzA.y, -1, 1));
      let yaw = 0, pit = 0;
      for (const s of gzSubjects) {
        const w = s.w * smoothstep(s.a0, s.a1, u) * (1 - smoothstep(s.b0, s.b1, u)); if (w <= 0) continue;
        if (s.lady) {
          const yf = lerp(0.2, 0.345, smoothstep(0.06, 0.3, u)), fly = smoothstep(0.335, 0.357, u);
          bladePoint(ladyBlade, yf, gzLady, 0.3);
          if (fly > 0) gzLady.lerp(ladyFlight(u, smoothstep(0.41, 0.5, u), gzQ, gzT), fly * fly * (3 - 2 * fly));
        }
        gzQ.copy(s.at).sub(gzP); const len = Math.max(gzQ.length(), 1e-3);
        let b = Math.atan2(gzQ.x, -gzQ.z) - yaw0; b = Math.atan2(Math.sin(b), Math.cos(b));
        yaw += w * softCap(b, s.cap); pit += w * softCap(Math.asin(clamp(gzQ.y / len, -1, 1)) - pit0, PITCH_CAP);
      }
      const y = yaw0 + yaw, p = pit0 + pit, cp = Math.cos(p);
      return gzOut.set(Math.sin(y) * cp, Math.sin(p), -Math.cos(y) * cp).multiplyScalar(200).add(gzP);
    }
    // down the clearing each close thing draws the eye a little its way: one pull of 0.2 on each (with the Web's 0.75 the
    // two that are on together stay under 1), from one thing-spacing (the route metres between the elder and the small
    // web) before the point where the thing bears 45 degrees off the bow (as far short of abeam as it stands off the
    // route), until that point: the gaze never follows a thing past the beam
    const sidePois = [];
    {
      const gap = sAbeam(MINI) - sAbeam(ELDER);
      for (const at of [V3(ELDER.x, 10.5, ELDER.z), miniC, V3(WILD.x, 22, WILD.z)]) {
        const n = path.nearestXZ(at.x, at.z), to = n.u * path.length - n.dist;
        sidePois.push({ at, from: (to - gap) / path.length, to: to / path.length, weight: 0.2 });
      }
    }
    const qRoll = new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), -0.45 * mx);
    function updateLadybird(time, u) {
      const yf = lerp(0.2, 0.345, smoothstep(0.06, 0.3, u)), off = 0.42 * bladeHalfWidth(yf) * ladyBlade.W + 0.04;
      bladePoint(ladyBlade, yf, ladyPos, off);
      bladePoint(ladyBlade, yf + 0.01, A, off); bladePoint(ladyBlade, yf - 0.01, B, off); A.sub(B).normalize();           // forward: up the blade
      bladePoint(ladyBlade, yf, B, off + 1).sub(ladyPos).normalize();                                                       // up: off the face
      C.crossVectors(B, A).normalize();
      qA.setFromRotationMatrix(basis.makeBasis(C, B, A));
      ladyPos.add(swayOffJS(sw, time, wind, ladyBlade.sp, ladyBlade.rp, ladyBlade.amp, yf));
      const open = smoothstep(0.3, 0.335, u), fly = smoothstep(0.335, 0.357, u), away = smoothstep(0.41, 0.5, u), g = lady.group;
      if (fly > 0) {
        ladyFlight(u, away, A, TG);
        A.y += Math.sin(time * 2.3) * 0.35; A.x += Math.sin(time * 1.7) * 0.4;
        ladyPos.addScaledVector(B, 1.6 * Math.min(1, fly * 6)).lerp(A, fly * fly * (3 - 2 * fly));
        TG.y = 0.5 + 0.3 * away; qB.setFromRotationMatrix(basis.lookAt(O, TG.normalize().negate(), UP)).multiply(qRoll);   // nose up and rolled toward the camera: the red back shows
        qA.slerp(qB, smoothstep(0, 0.5, fly));
      }
      g.visible = away < 0.985; g.position.copy(ladyPos); g.quaternion.copy(qA); g.scale.setScalar(LADY_S * (1 - 0.5 * away));
      const walk = yf * ladyBlade.H * 9 + Math.sin(time * 1.3) * 0.3 * (1 - open);
      lady.tripods[0].rotation.y = Math.sin(walk) * 0.2 * (1 - fly); lady.tripods[1].rotation.y = -Math.sin(walk) * 0.2 * (1 - fly);
      const ext = smoothstep(0.35, 1, open), beat = smoothstep(0.6, 1, open);
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        lady.cases[i].rotation.set(0.3 * open, -s * 1.05 * open, s * 0.55 * open);
        const w = lady.wings[i]; w.visible = ext > 0.02; w.scale.set(s * Math.max(0.05, ext), 1, Math.max(0.05, ext));
        w.rotation.set(0, s * 0.7 * (1 - ext), s * (0.3 + 0.6 * Math.sin(time * 46 + i)) * beat);
      }
    }

    function updateSeeds(time, u) {
      relHeadPos.copy(relHead.c).add(swayOffJS(sw, time, wind, relHead.sp, relHead.rp, relHead.amp, 1));
      const hs = relHead.hs, sNow = u * path.length;
      for (let i = 0; i < relSeeds.length; i++) {
        const s = relSeeds[i], k = sNow - s.mR;      // metres we have flown since it was let go
        let fade = 1;
        if (k <= 0) mat.compose(relHeadPos, s.q, _s.set(hs, hs, hs));
        else {
          // it eases off the head over our first two stalk-heights of flight; we gain 8 m on it in every 100 m (no floor:
          // the nearest is let go 26 m ahead and is still 17 m off when it fades)
          const b = smoothstep(0, 2 * STALK, k), dl = clamp(sNow + s.lead - 0.08 * k, 0, path.length), sc = hs;
          path.posAtDist(dl, A); path.tangentAtDist(dl, TG);
          const lat = (s.lat + s.drift * k) * mx;
          A.x += TG.z * lat + Math.sin(time * 0.5 + s.ph) * 0.9; A.z += -TG.x * lat + Math.cos(time * 0.43 + s.ph) * 0.9;
          A.y += s.up + 0.03 * k + Math.sin(time * 0.7 + s.ph * 1.7) * 0.7;      // it rises 3 m in every 100 m we fly
          B.lerpVectors(relHeadPos, A, b);
          _e.set(s.tx + 0.17 * Math.sin(time * 0.6 + s.ph), time * s.spin + s.ph, s.tz + 0.17 * Math.cos(time * 0.5 + s.ph * 1.3)); qB.setFromEuler(_e);      // its own tilt, a slow rocking, a slow turn
          qA.copy(s.q).slerp(qB, smoothstep(0, 0.6, b));
          B.y -= SEED_LEN * 0.6 * b * sc;      // hang below the parachute rather than pivot on the receptacle
          mat.compose(B, qA, _s.set(sc, sc, sc));
          fade = 1 - smoothstep(s.life - 1.5 * STALK, s.life, k);
        }
        relMesh.setMatrixAt(i, mat); relFade.setW(i, fade);
      }
      relMesh.instanceMatrix.needsUpdate = true; relFade.needsUpdate = true;
    }
    let seedsEnd = 0; for (const s of relSeeds) seedsEnd = Math.max(seedsEnd, s.mR + s.life);      // the route metres past which the last tuft has faded out

    // The damselflies, each on one unbroken line of flight. Every station of the two lines is a place of the clearing, taken
    // as the route metres at which the route comes abeam of it: the mark of the clearing's mouth, the elder toadstool, the small web, the
    // wilding. The first idles toward the elder at a fifth of our speed until we reach the gate, then keeps ahead of us on the elder's side,
    // lets us close to the distance the elder itself stands off the route, crosses our bow between 15 m past it and
    // the small web in a shallow dip under the line to the hub, and climbs away over the wilding. The second darts along one
    // straight line from a far place under the Web to a near place beside the route while we fly from the gate to the wilding,
    // and creeps along the same line from first to last, so it is never still; we pass it close as the route straightens.
    const sGate = sAbeam(V3(-3.2 * mx, 0, GATE_Z)), sElder = sAbeam(ELDER), sMini = sAbeam(MINI), sWild = sAbeam(WILD);
    const dElder = path.nearestXZ(ELDER.x, ELDER.z).dist;      // how far off the route the elder stands (some 14.6 m)
    const hoverAt = V3(-9.5 * mx, 22.5, 54), dartFrom = V3(34 * mx, 12, 22), flyP = V3(), flyQ = V3();      // the second one's two places: low and far off under the Web's far side; 54 m before the Web, 9.5 m off its axis
    const flyPh = [RN.flies() * TAU, RN.flies() * TAU];      // where each one's hovering bob starts: its own draw, another on every visit
    function flyLine(i, s, out) {      // s = metres of route flown
      if (i === 0) {
        const cross = smoothstep(sGate + 15, sMini, s), off = smoothstep(sMini, sWild, s);
        // ahead of us by three times the elder's distance at first, by once that distance when we are abeam of the elder
        const dl = Math.min(path.length, Math.max(s, sGate + 0.2 * (s - sGate)) + dElder * (lerp(3, 1, smoothstep(sGate, sElder, s)) + 1.5 * off));
        path.posAtDist(dl, out); path.tangentAtDist(dl, TG);
        const lat = (lerp(26, -17, cross) - 24 * off) * mx;      // from beyond the elder's far rim (21.8 m off the route) to beyond the wilding's stem (16.1 m off on the other side), then on outward
        out.x += TG.z * lat; out.z -= TG.x * lat; out.y += 4.5 - 6.3 * Math.sin(Math.PI * cross) + 30 * off * off;
        return out;
      }
      const k = smoothstep(sGate, sWild, s);
      out.lerpVectors(dartFrom, hoverAt, k + 0.25 * (s - sElder) / path.length); out.y -= 5 * Math.sin(Math.PI * k);
      return out;
    }
    function updateFlies(time, u) {
      for (let i = 0; i < 2; i++) {
        const g = flies[i].group, ph = flyPh[i];
        const sNow = u * path.length; flyLine(i, sNow, flyP); flyLine(i, sNow + 2, flyQ).sub(flyP);      // it heads where it will be when we have flown 2 m more
        const yaw = Math.atan2(flyQ.x, flyQ.z), sp = flyQ.length();
        const pitch = i === 0 && sp > 1e-4 ? -Math.asin(clamp(flyQ.y / sp, -0.6, 0.6)) * 0.6 : 0;
        g.position.set(flyP.x + Math.sin(time * 1.7 + ph) * 0.7, flyP.y + Math.sin(time * 2.3 + ph * 2) * 0.6, flyP.z + Math.sin(time * 1.3 + ph * 3) * 0.7);
        g.rotation.set(-0.1 + pitch + 0.08 * Math.sin(time * 1.1 + ph), yaw + 0.18 * Math.sin(time * 0.7 + ph), 0.12 * Math.sin(time * 0.9 + ph));
      }
    }
    updateLadybird(0, 0); updateSeeds(0, 0); updateFlies(0, 0);

    return {
      scene, path, duration: 46, ride: 'none',
      pace: (u) => 1 - 0.3 * bell(u, 0.12, 0.24, 0.4) - 0.24 * bell(u, 0.38, 0.49, 0.4) - 0.2 * bell(u, 0.68, 0.9, 0.4),
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 22, sway: 0.7, bank: 0.8 },
      pois: [
        { at: gazeAt, from: 0.03, to: 0.67, weight: 1, fade: 0.06 },
        { at: hubW, from: 0.5, to: 1, weight: 0.75 },
        ...sidePois,
      ],
      portal: { shape: 'circle', radius: 9, color: '#ffd98a', glow: 1.2, revealDistance: 190 },
      post: { exposure: mood.exposure * 0.93, bloom: { strength: 0.42, radius: 0.6, threshold: 1.05 },
        grade: { saturation: mood.sat, contrast: 1.1, tint: mood.tint, shadowTint: mood.shadow, vignette: 0.34, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        U.uTime.value = t; time.value = t;
        if (ctx.renderer?.getDrawingBufferSize) U.uViewH.value = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        camera.getWorldPosition(camW); camera.getWorldDirection(camF);
        for (const b of behindCull) {
          let vis = false;
          for (const c of b.c) if ((c.x - camW.x) * camF.x + (c.y - camW.y) * camF.y + (c.z - camW.z) * camF.z > -b.r) { vis = true; break; }
          if (b.m.visible !== vis) b.m.visible = vis;
        }
        sunHalo.object.position.copy(camW).addScaledVector(SUN, 1500);
        sky.update(dt, t, camera); set.update(dt, t, camera);
        // The light of the Web is a rule of the place: D = metres of route left to the hub. Its sparkle rises from the mouth
        // of the clearing (where it is first seen whole) to the distance of its own height (2 HUB), and nearer than that,
        // where the lace surrounds the eye, it eases by a quarter down to half the hub's height: seen from close, the lace
        // lies over a garden that keeps its colour, it does not flatten it to pale gold
        const D = (1 - u) * path.length;
        const hp = smoothstep(0.62, 1, u); hero.setProgress(hp);
        hero.uniforms.uGain.value = lerp(0.5, 1.3, 1 - smoothstep(2 * HUB, Dmouth, D)) - 0.3 * (1 - smoothstep(0.5 * HUB, 2 * HUB, D)); hero.update(dt, t, camera);
        entryGlow.uniforms.uIntensity.value = 1.0 * (1 - smoothstep(0.03, 0.15, u));
        clockGlow.uniforms.uIntensity.value = 0.3 * (1 - 0.5 * smoothstep(0.43, 0.52, u));
        U.uShafts.value = smoothstep(0.46, 0.62, u);
        U.uBokeh.value = 1 - 0.55 * (1 - smoothstep(HUB, 3 * HUB, D));      // inside three hub-heights of the Web the out-of-focus highlights give way to its own beads
        U.uMist.value.x = MIST0 * lerp(1, 0.55, smoothstep(0.5, 0.66, u));      // gold ground glow in the forest, clearer air over the clearing
        const late = u > 0.3; if (late !== lateOn) { lateOn = late; for (const o of lateObjs) o.visible = late; }
        updateLadybird(t, u); updateFlies(t, u);
        { const fly = u * path.length < seedsEnd + 5; if (fly !== relMesh.visible) relMesh.visible = fly; if (fly) updateSeeds(t, u); }      // once the last tuft has faded the swarm is not drawn
        if (snail) {                                    // it glides a few metres while the camera crosses the clearing, horns feeling the air
          const gl = 5 * smoothstep(0.45, 1, u);
          snail.group.position.x = SNAIL.x + Math.sin(SNAIL.ry) * gl; snail.group.position.z = SNAIL.z + Math.cos(SNAIL.ry) * gl;
          snail.group.rotation.z = 0.015 * Math.sin(t * 0.5);
          for (const h of snail.horns) { const d = h.userData; h.rotation.set(0.5 + 0.22 * Math.sin(t * 0.7 + d.sx) + (d.up ? 0 : 0.7), 0, -d.sx * (0.32 + 0.14 * Math.sin(t * 0.9 + d.sx * 2 + d.up))); }
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};