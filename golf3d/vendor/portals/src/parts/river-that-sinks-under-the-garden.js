// The dome over the sinking river: hero set piece of "The River That Sinks Under the Garden".
// A wide low dome sheathed in gold and lapis tiles on a ring of slender columns, on a round balcony that hangs over a
// cliff whose lower half is blue ice; the river runs into the cave mouth in that ice, under the rim of the dome.
// Local frame: the cliff face looks along +Z (the river arrives from +Z and leaves through the mouth toward -Z),
// origin on the water line at the middle of the mouth, +Y up.
// Also exported for the world: the shared light uniforms (makeLook), the ice material (makeIceMaterial), the tunnel of
// ice (makeIceCave), icicles (icicleGeometry), the fountain that throws rocks (makeRockFountain) and the water of the gardens (makeWaterMaterial).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2;
const C = (h) => new THREE.Color(h);

export const GLSL_N3 = /* glsl */`
float rsH(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float rsH1(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float rsN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(rsH(i), rsH(i + vec3(1,0,0)), f.x), mix(rsH(i + vec3(0,1,0)), rsH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(rsH(i + vec3(0,0,1)), rsH(i + vec3(1,0,1)), f.x), mix(rsH(i + vec3(0,1,1)), rsH(i + vec3(1,1,1)), f.x), f.y), f.z); }
float rsF(vec3 p){ return rsN(p) * 0.5 + rsN(p * 2.03 + 11.7) * 0.3 + rsN(p * 4.11 + 5.3) * 0.2; }
`;

// One set of light values for every shader of this world (the kit's lit materials take the three.js lights instead).
export function makeLook() {
  return {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.42, 0.66, 0.62).normalize() },
    uSunCol: { value: new THREE.Color(1.0, 0.93, 0.8).multiplyScalar(3.0) },
    uSkyCol: { value: new THREE.Color('#5d8fd6') },
    uHorizonCol: { value: new THREE.Color('#cfe2f2') },
    uGroundCol: { value: new THREE.Color('#4a6a3c') },
    uLamp: { value: new THREE.Color(0, 0, 0) },
    uIceGlow: { value: new THREE.Color('#9fe6ff') },
    uIceDeep: { value: new THREE.Color('#2a6fb8') },
    uIceGain: { value: 1.0 },
    uShaft: { value: new THREE.Color(1.0, 0.95, 0.82) },
    uDay: { value: new THREE.Color(1.0, 0.95, 0.82) },
    uDome: { value: new THREE.Vector4(0, 59, 0, 41) },
  };
}

// ---------------------------------------------------------------- the light of the sunless sea
// For every surface that stands in the sea's hall (P = the place, n = its normal, t = the clock): (a) the water's own light from below,
// strongest near the water and on what faces down, with a slow net of light in it (uBelow: the sea's level, the reach of the near light
// in metres, the share that reaches the vault; uBelowC its colour); (b) five shafts of daylight (uShaftP: x, z, radius, strength;
// uShaftC their colour): full light inside a shaft, and round it a glow on the faces turned to it that thins with the distance squared.
export const GLSL_SEA_LIGHT = /* glsl */`
uniform vec4 uShaftP[5]; uniform vec3 uShaftC, uBelowC; uniform vec4 uBelow;
vec3 rsSeaLight(vec3 P, vec3 n, float t){
  float hgt = max(P.y - uBelow.x, 0.0);
  float net = 1.0 - abs(2.0 * rsN(vec3(P.xz * 0.11 + vec2(t * 0.07, 0.0), P.y * 0.09 - t * 0.16)) - 1.0); net *= net; net *= net;
  float low = exp(-min(hgt / uBelow.y, 20.0)), high = exp(-min(hgt / (uBelow.y * 5.0), 20.0));
  vec3 lit = uBelowC * (low * (0.55 + 1.1 * net) + uBelow.z * high) * (0.5 + 0.5 * max(-n.y, 0.0) + 0.3 * (1.0 - abs(n.y)));
  for (int i = 0; i < 5; i++) {
    vec2 dv = uShaftP[i].xy - P.xz; float d = length(dv), rr = uShaftP[i].z;
    float inB = 1.0 - smoothstep(rr * 0.55, rr * 1.25, d);
    float facing = 0.3 + 0.7 * max(dot(n.xz, dv / max(d, 1e-3)), 0.0);
    lit += uShaftC * uShaftP[i].w * (inB * (0.4 + 0.6 * max(n.y, 0.0)) + (1.0 - inB) * facing * rr * rr / (rr * rr + 0.12 * d * d));
  }
  return lit;
}`;
// the uniforms that light takes: shafts = [[x, z, radius, strength] x 5], shaftColor, seaY, belowColor, reach, vault
export function seaLightUniforms(o) {
  const sh = []; for (let i = 0; i < 5; i++) { const q = (o.shafts || [])[i] || [0, 0, 1, 0]; sh.push(new THREE.Vector4(q[0], q[1], q[2], q[3])); }
  return { uShaftP: { value: sh }, uShaftC: { value: C(o.shaftColor || '#cfe6ff') }, uBelowC: { value: C(o.belowColor || '#3fd0b0') }, uBelow: { value: new THREE.Vector4(o.seaY ?? 0, o.reach ?? 18, o.vault ?? 0.5, 0) } };
}

// ---------------------------------------------------------------- ice: lit from inside
// attributes: aIce = (glow bias, ambient occlusion, light reaching it: 0..1 a shaft of sun inside (warm, uShaft), 1..2 that sun come through
// the ice (on every face), 0..-1 daylight (uDay))
// opts.sea = { uniforms: seaLightUniforms(...), ambient, rim: colour, inner: colour }: ice of the sunless sea. It is a solid body lit by
// the sea's light (above): its own colour times that light, a bright rim where it turns from the eye, and (aIce.z > 0) a light inside it.
// opts.halls = { x1, x2, blend, phos } (the caverns, which run toward -x): the ice is blue-white before x1, deep blue between x1 and x2, green-black
// after x2; there the day's light lies on faces turned to the mouth (+x) and is bluer, and the sea's phosphor on faces turned to the arch (-x)
export function makeIceMaterial(look, opts = {}) {
  return new THREE.ShaderMaterial({
    fog: !opts.ownFog, side: opts.side ?? THREE.FrontSide, defines: opts.sea ? { SEA_LIGHT: 1 } : {},
    uniforms: { ...THREE.UniformsLib.fog, ...look, ...(opts.sea ? { ...opts.sea.uniforms, uSeaAmb: { value: opts.sea.ambient ?? 0.25 }, uRimC: { value: C(opts.sea.rim || '#9fe6ff') }, uInnerC: { value: C(opts.sea.inner || '#7fe9ff') } } : {}), uOwnFog: { value: new THREE.Vector4(...(opts.ownFog || [0, 0, 0, 0])) }, uCliffX: { value: new THREE.Vector2(opts.cliffX ?? 0, opts.cliffX != null ? 1 : 0) }, uScale: { value: opts.scale ?? 1 }, uDark: { value: opts.dark ?? 0 },
      uFade: { value: new THREE.Vector4(...(opts.fade || [1e6, 2e6, -2e6, -1e6])) }, uUnder: { value: new THREE.Color(opts.under || '#000000') }, uTint: { value: new THREE.Vector3(...(opts.tint || [1, 1, 1])) }, uGrey: { value: opts.grey ?? 0 },
      uHallA: { value: new THREE.Vector4(opts.halls?.x1 ?? 0, opts.halls?.x2 ?? 0, opts.halls?.blend ?? 1, opts.halls ? 1 : 0) }, uHallPhos: { value: new THREE.Color(opts.halls?.phos || '#000000') },
      uLampP: { value: new THREE.Vector4(...(opts.lamp || [0, 0, 0, 0])) }, uLampC: { value: new THREE.Color(opts.lampColor || '#000000') } },
    vertexShader: /* glsl */`
      attribute vec3 aIce; varying vec3 vW, vN, vIce;
      #include <fog_pars_vertex>
      void main(){
        vIce = aIce;
        vec4 w = modelMatrix * vec4(position, 1.0);
        #ifdef USE_INSTANCING
          w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vN = normalize(mat3(modelMatrix) * normal);
        #endif
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uIceGlow, uIceDeep, uShaft, uDay, uUnder, uTint; uniform vec4 uFade, uHallA, uLampP, uOwnFog; uniform vec3 uHallPhos, uLampC; uniform float uIceGain, uTime, uScale, uDark, uGrey;
      varying vec3 vW, vN, vIce;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      #ifdef SEA_LIGHT
        uniform float uSeaAmb; uniform vec3 uRimC, uInnerC; uniform vec2 uCliffX;
        ${GLSL_SEA_LIGHT}
      #endif
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(cameraPosition - vW);
        vec3 p = vW * uScale;
        float big = rsF(p * 0.034 + 3.1);
        float mid = rsF(p * 0.12 + 9.0);
        float fine = rsN(p * 0.8);
        // layers of old ice, tilted and warped; a few bright seams where it has split
        float st = p.y * 0.2 + p.x * 0.03 + p.z * 0.02 + mid * 2.6 + big * 4.0;
        float band = smoothstep(0.0, 1.0, abs(fract(st) - 0.5) * 2.0);
        vec3 pc = p * 0.15 + vec3(mid * 0.8);
        float crack = 1.0 - abs(rsN(pc) * 2.0 - 1.0);
        crack = pow(clamp(crack, 0.0, 1.0), 40.0) * smoothstep(0.5, 0.68, big);
        float flute = rsN(vec3(p.x * 0.5, p.y * 0.035, p.z * 0.5));
        float thin = clamp(big * 1.35 + mid * 0.45 - 0.62 + vIce.x, 0.0, 1.0);
        vec3 turq = mix(uIceDeep, uIceGlow, 0.4) * vec3(0.52, 1.0, 1.08);
        vec3 col = mix(uIceDeep * 0.4, turq, smoothstep(0.05, 0.55, thin));
        col = mix(col, uIceGlow * vec3(0.88, 1.0, 1.0), smoothstep(0.5, 0.95, thin));
        col = mix(col, vec3(0.9, 1.0, 1.0), smoothstep(0.88, 1.0, thin) * 0.25);
        col *= 0.8 + 0.2 * band;
        col *= (0.86 + 0.18 * flute) * (0.86 + 0.26 * fine);
        col += uIceGlow * crack * 0.22;
        // the light is in the ice overhead: what faces up is lit by it, what hangs in its own shade is deep
        float up = n.y * 0.5 + 0.5;
        col *= 0.76 + 0.3 * smoothstep(0.15, 0.85, up);
        col += uIceGlow * 0.08 * max(n.y, 0.0) * (0.6 + 0.4 * fine);
        float rift = 1.0 - abs(rsN(p * 0.42 + vec3(mid * 2.4, 0.0, big * 3.0)) * 2.0 - 1.0);
        col *= 1.0 - 0.3 * pow(clamp(rift, 0.0, 1.0), 30.0) * smoothstep(0.55, 0.9, n.y);
        float fres = 1.0 - max(dot(n, v), 0.0);
        col += mix(uIceDeep, uIceGlow, 0.6) * fres * fres * 0.3;
        col *= uIceGain * clamp(vIce.y, 0.0, 1.5);
        col = mix(col, vec3(dot(col, vec3(0.25, 0.5, 0.25))), uGrey) * uTint;
        vec3 mouthDir = vec3(0.989, 0.148, 0.0);
        if (uHallA.w > 0.5) {
          // IN THE CAVERNS THE FLOOR IS ICE WITH FORM (on what lies near level): cracks that wander, deep and dark; pressure ridges,
          // white; pools of clear dark meltwater that gleam. FROST lies white on every ledge and shelf, thick where the ice is rough.
          // What turns from the light overhead (the clefts, the undersides) is blue-green.
          float lev = smoothstep(0.72, 0.93, n.y);
          float fl = max(smoothstep(0.03, 0.0, abs(rsN(vec3(vW.xz * 0.11, 2.0)) - 0.5)), 0.6 * smoothstep(0.035, 0.0, abs(rsN(vec3(vW.xz * 0.31 + 4.0, 6.0)) - 0.5)));
          float ridge = pow(clamp(1.0 - abs(rsN(vec3(vW.xz * 0.07 + 11.0, 3.0)) * 2.0 - 1.0), 0.0, 1.0), 14.0);
          float poolK = smoothstep(0.6, 0.68, rsF(vec3(vW.xz * 0.045 + 21.0, 1.0))) * lev;
          col = mix(col, col * 0.45 + uIceDeep * 0.12, lev * fl);
          col = mix(col, uIceDeep * 0.35, poolK * 0.75);
          col += poolK * uIceGlow * 0.5 * pow(clamp(1.0 - max(dot(n, v), 0.0), 0.0, 1.0), 3.0);
          col = mix(col, vec3(0.92, 0.97, 1.0) * (0.75 + 0.25 * fine), lev * ridge * 0.8 * (1.0 - poolK));
          float frost = smoothstep(0.45, 0.85, n.y) * smoothstep(0.35, 0.7, mid + 0.25 * fine) * (1.0 - poolK);
          col = mix(col, vec3(0.86, 0.93, 1.0) * (0.7 + 0.3 * fine), frost * 0.5);
          col = mix(col, col * vec3(0.55, 1.05, 0.95), smoothstep(0.1, -0.5, n.y) * 0.5);
          float k2 = smoothstep(uHallA.x + uHallA.z, uHallA.x - uHallA.z, vW.x), k3 = smoothstep(uHallA.y + uHallA.z, uHallA.y - uHallA.z, vW.x);
          vec3 gr = vec3(dot(col, vec3(0.25, 0.5, 0.25)));
          vec3 c1 = mix(col, gr, 0.25) * vec3(1.0, 1.08, 1.16), c2 = col * vec3(0.5, 0.72, 1.12), c3 = mix(col, gr, 0.3) * vec3(0.36, 0.66, 0.6);
          col = mix(mix(c1, c2, k2), c3, k3);
          // the first hall has depth by layers: the ice near at hand is dark and clear, the ice far off pale and milky
          float farK = smoothstep(25.0, 150.0, length(cameraPosition - vW)) * (1.0 - k2);
          col = mix(col * (1.0 - 0.18 * (1.0 - k2)), vec3(0.62, 0.76, 0.9) * (0.35 + 0.9 * dot(col, vec3(0.25, 0.5, 0.25))), farK * 0.55);
          col += uHallPhos * k3 * (0.05 + 0.3 * max(dot(n, -mouthDir), 0.0)) * (0.4 + 0.6 * fine);
        }
        col *= 1.0 - uDark * smoothstep(-0.2, 0.8, n.y) * 0.55;
        // where the sun reaches the ice (the cliff outside, the floor under a crack in the roof) it is warm on the cold blue
        float ndl = max(dot(n, uSunDir), 0.0);
        float lz = clamp(abs(vIce.z), 0.0, 1.0); vec3 lightC = vIce.z < 0.0 ? uDay : uShaft;
        #ifdef SEA_LIGHT
          lz = 0.0;                                                  // (in the sea aIce.z is the light inside the ice, below)
        #endif
        // a shaft's light falls from straight above
        // (a light of over 1 is the shaft's sun come THROUGH a body of ice: it lies on every face, the more the thinner the ice)
        float facing = vIce.z < 0.0 ? max(ndl, max(n.y, 0.0) * 0.8) : mix(max(n.y, 0.0), 0.75 + 0.25 * thin, clamp(vIce.z - 1.0, 0.0, 1.0));
        if (uHallA.w > 0.5 && vIce.z < 0.0) { lightC = mix(uDay, vec3(0.62, 0.8, 1.0), 0.7); facing = 0.15 + 0.85 * max(dot(n, mouthDir), 0.0); }
        vec3 sunlit = lightC * (0.3 + 0.4 * thin) * (0.2 + 0.8 * facing) + mix(uSkyCol, uIceGlow, 0.55) * 0.2 * (n.y * 0.5 + 0.5);
        col = mix(col, col * 0.72 + sunlit, lz);
        vec3 h = normalize(v + normalize(vec3(0.3, 0.9, 0.2)));
        float sp = pow(max(dot(n, h), 0.0), 60.0);
        col += (uIceGlow * 0.5 + lightC * lz) * sp * 0.45;
        #ifdef SEA_LIGHT
          // ice of the sunless sea: its own colour times the sea's light, a bright rim where it turns from the eye, a light inside it
          vec3 sl = rsSeaLight(vW, n, uTime), own = col;
          float rimK = pow(clamp(1.0 - max(dot(n, v), 0.0), 0.0, 1.0), 2.5);
          col = col * (uSeaAmb + sl) + uRimC * rimK * (0.08 + 0.25 * uSeaAmb + 0.6 * dot(sl, vec3(0.3, 0.5, 0.2))) + uInnerC * max(vIce.z, 0.0) * (0.35 + 0.65 * thin) * (0.7 + 0.3 * fine);
          // opts.cliffX: THE CLIFF'S FACE THAT IS TURNED TO THE CAVERNS (the back of the sea's cliff, about the arch) is the last hall's
          // own ice, green and dark with its veins, lit by the hall: the sea's light does not reach it
          if (uCliffX.y > 0.5 && n.x > 0.3 && abs(vW.x - uCliffX.x) < 0.75) col = mix(own, vec3(dot(own, vec3(0.25, 0.5, 0.25))), 0.3) * vec3(0.4, 0.72, 0.66) * (0.8 + 0.5 * fine) + uRimC * rimK * 0.08;
        #endif
        // opts.fade, opts.under: the ice goes dark above a height and takes a colour of the water on its lower end
        float lost = smoothstep(uFade.x, uFade.y, vW.y);
        col *= 1.0 - 0.94 * lost;
        col += uUnder * (1.0 - smoothstep(uFade.z, uFade.w, vW.y)) * (0.5 + 0.5 * fine);
        // a lamp of the place (opts.lamp: where it stands and its reach in metres): its light lies on the faces turned to it and falls off
        // with the square of the distance
        if (uLampP.w > 0.0) { vec3 L = uLampP.xyz - vW; float d2 = dot(L, L); col += uLampC * (0.2 + 0.8 * max(dot(n, L / sqrt(max(d2, 1.0))), 0.0)) * (0.6 + 0.4 * fine) / (1.0 + d2 / (uLampP.w * uLampP.w)); }
        gl_FragColor = vec4(col, 1.0);
        // opts.ownFog (colour, density): the body is lost in a dark of its own with distance, whatever haze the air has where one stands
        if (uOwnFog.w > 0.0) { float fd = length(cameraPosition - vW); gl_FragColor.rgb = mix(gl_FragColor.rgb, uOwnFog.rgb, 1.0 - exp(-min(uOwnFog.w * uOwnFog.w * fd * fd, 40.0))); }
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the dome's surfaces: tiles, gold, lapis, marble
// attributes: aMat (0 tiles, 1 gold, 2 lapis, 3 stone with vertex colour, 4 inner shell), uv (tiles: angle 0..1, height 0..1)
const GLSL_TILES = /* glsl */`
float rsLapis(float th, float v, float pat){
  float a;
  if (pat < 0.5) { float w = 0.46 * (1.0 - v) + 0.04; a = step(abs(fract(th * 12.0) - 0.5), w * 0.5) * step(0.06, v) + step(0.9, v); }
  else if (pat < 1.5) a = step(fract(th * 6.0 + v * 1.6), 0.44);
  else if (pat < 2.5) a = step(fract(v * 5.0 + 0.7 * abs(fract(th * 12.0) - 0.5)), 0.42);
  else { float d1 = fract(th * 12.0 + v * 6.0), d2 = fract(th * 12.0 - v * 6.0); a = abs(step(0.5, d1) - step(0.5, d2)); }
  return clamp(a, 0.0, 1.0);
}
// tile lattice: xy = position in the tile (-0.5..0.5, 0..1), z = lapis or gold, w = random per tile
vec4 rsTile(vec2 uv, float pat){
  float rows = 30.0, row = floor(uv.y * rows);
  float rr = cos(clamp((row + 0.5) / rows, 0.0, 1.0) * 1.5708);
  float n = max(24.0, floor(rr * 7.0 + 0.5) * 24.0);
  float x = uv.x * n + 0.5 * mod(row, 2.0), idx = floor(x);
  float thc = (idx + 0.5 - 0.5 * mod(row, 2.0)) / n, vc = (row + 0.5) / rows;
  return vec4(fract(x) - 0.5, fract(uv.y * rows), rsLapis(thc, vc, pat), rsH1(idx * 7.13 + row * 31.7));
}
`;
export function makeDomeMaterial(look, opts = {}) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsLib.fog, ...look, uPattern: { value: opts.pattern ?? 0 }, uGold: { value: C('#f5c344') }, uLapis: { value: C('#2146a8') } },
    vertexShader: /* glsl */`
      attribute float aMat; attribute vec3 color;
      varying vec3 vW, vN, vCol; varying vec2 vUv; varying float vMat;
      #include <fog_pars_vertex>
      void main(){
        vMat = aMat; vCol = color; vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizonCol, uGroundCol, uLamp, uGold, uLapis; uniform vec4 uDome; uniform float uPattern;
      varying vec3 vW, vN, vCol; varying vec2 vUv; varying float vMat;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      ${GLSL_TILES}
      vec3 skyAt(vec3 r){
        vec3 c = mix(uHorizonCol, uSkyCol, smoothstep(0.0, 0.7, r.y));
        return mix(c, uGroundCol * 1.4, smoothstep(0.02, -0.35, r.y));
      }
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 v = normalize(cameraPosition - vW);
        vec3 alb = vCol; float metal = 0.0, gloss = 0.25, seam = 1.0;
        if (vMat < 0.5) {
          vec4 t = rsTile(vUv, uPattern);
          vec3 tu = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-4, 0.0, 0.0)), tv = cross(n, tu);
          n = normalize(n + tu * t.x * 0.55 + tv * (t.y - 0.55) * 0.5 + (t.w - 0.5) * 0.12 * tu);
          seam = 1.0 - 0.55 * max(smoothstep(0.38, 0.5, abs(t.x)), smoothstep(0.84, 1.0, t.y));
          alb = mix(uGold, uLapis, t.z) * (0.82 + 0.36 * t.w);
          metal = 1.0 - t.z; gloss = mix(0.75, 0.9, t.z);
        } else if (vMat < 1.5) { alb = uGold * vCol; metal = 1.0; gloss = 0.7; }
        else if (vMat < 2.5) { float f = rsN(vW * 2.3); alb = uLapis * vCol * (0.75 + 0.5 * f); alb = mix(alb, uGold, step(0.93, rsN(vW * 5.0))); gloss = 0.85; }
        else if (vMat < 3.5) {
          float f = rsF(vW * 0.7), cy = vW.y / 1.35, row = floor(cy), hx = (vW.x + vW.z) / 2.9 + 0.5 * mod(row, 2.0);
          float lod = clamp(1.0 - distance(vW, cameraPosition) / 420.0, 0.0, 1.0), wall = 1.0 - abs(n.y);
          float joint = max(1.0 - smoothstep(0.02, 0.07, min(fract(cy), 1.0 - fract(cy))), 1.0 - smoothstep(0.012, 0.04, min(fract(hx), 1.0 - fract(hx))));
          alb = vCol * (0.84 + 0.32 * f) * (0.86 + 0.28 * rsH1(row * 13.1 + floor(hx) * 7.7) * wall) * (1.0 - 0.45 * joint * lod * wall); gloss = 0.3;
        }
        else {
          vec2 q = vec2(vUv.x * 96.0, vUv.y * 22.0), id = floor(q), f = fract(q) - 0.5;
          float star = step(0.72, rsH1(id.x * 3.7 + id.y * 57.0)) * smoothstep(0.34, 0.1, length(f) + 0.2 * abs(f.x * f.y) * 8.0);
          alb = mix(uLapis * 0.9, uGold * 1.5, star); gloss = 0.5;
        }
        float below = step(vW.y, uDome.y + 0.5);
        float ty = (uDome.y - vW.y) / max(uSunDir.y, 0.05);
        vec2 hx = vW.xz + uSunDir.xz * ty - uDome.xz;
        float inSh = below * smoothstep(uDome.w + 1.5, uDome.w - 2.5, length(hx));
        if (vMat > 3.5) inSh = 1.0;
        float ndl = max(dot(n, uSunDir), 0.0) * (1.0 - inSh);
        vec3 amb = mix(uGroundCol * 1.2, uSkyCol, n.y * 0.5 + 0.5) * (1.0 - 0.35 * inSh);
        if (vMat > 3.5) amb = uGroundCol * 2.2 + uSkyCol * 0.5 + uSunCol * 0.12;
        vec3 col = alb * (uSunCol * ndl + amb) * (1.0 - 0.6 * metal);
        vec3 r = reflect(-v, n);
        float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 5.0);
        vec3 f0 = mix(vec3(0.05), alb, metal);
        col += skyAt(r) * mix(f0, vec3(1.0), fres) * mix(gloss * 0.5, 1.0, metal) * (1.0 - 0.3 * inSh);
        vec3 h = normalize(v + uSunDir);
        float sp = pow(max(dot(n, h), 0.0), mix(30.0, 260.0, gloss));
        col += uSunCol * mix(vec3(0.6), alb * 1.4, metal) * sp * (0.4 + 2.6 * gloss) * (1.0 - inSh);
        float under = below * smoothstep(uDome.w * 1.25, uDome.w * 0.2, length(vW.xz - uDome.xz));
        col += alb * uLamp * (under * 1.6 + (vMat < 0.5 ? smoothstep(0.5, 0.0, vUv.y) * 0.5 : 0.0));
        col *= seam;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- a small geometry accumulator with explicit normals
export function makeGeo() {
  const P = [], N = [], K = [], U = [], M = [], I = [];
  const g = {
    P, I, col: [1, 1, 1], mat: 0,
    v(x, y, z, nx, ny, nz, u = 0, w = 0) { P.push(x, y, z); N.push(nx, ny, nz); K.push(g.col[0], g.col[1], g.col[2]); U.push(u, w); M.push(g.mat); return P.length / 3 - 1; },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    set(mat, col) { g.mat = mat; if (col) g.col = col; return g; },
    // surface of revolution about the vertical through (cx, cz); prof = [[r, y], ...] from bottom to top (or any order);
    // out = +1 normals away from the axis side of the profile's left, -1 flipped; shape(theta, k) may scale r and shift y
    lathe(cx, cz, prof, seg, o = {}) {
      const out = o.out ?? 1, a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, n = prof.length, base = P.length / 3;
      for (let j = 0; j <= seg; j++) {
        const th = a0 + (a1 - a0) * j / seg, ct = Math.cos(th), st = Math.sin(th);
        for (let i = 0; i < n; i++) {
          const a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)];
          let tr = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tr, ty) || 1; tr /= tl; ty /= tl;
          let r = prof[i][0], y = prof[i][1];
          if (o.shape) { const s = o.shape(th, i / (n - 1)); r *= s[0]; y += s[1]; }
          const nr = ty * out, ny = -tr * out;
          g.v(cx + ct * r, y, cz + st * r, ct * nr, ny, st * nr, o.uv ? j / seg : 0, o.uv ? i / (n - 1) : 0);
        }
      }
      for (let j = 0; j < seg; j++) for (let i = 0; i < n - 1; i++) {
        const a = base + j * n + i, b = a + n, c = b + 1, d = a + 1;
        if (o.skip && o.skip(a0 + (a1 - a0) * (j + 0.5) / seg, i)) continue;
        if (out > 0) I.push(a, d, c, a, c, b); else I.push(a, b, c, a, c, d);
      }
      return g;
    },
    // axis-aligned box rotated about Y by yaw, centre of its base at (x, y, z)
    box(x, y, z, sx, sy, sz, yaw = 0) {
      const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2;
      const W = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c], D = (lx, lz) => [lx * c + lz * s, -lx * s + lz * c];
      const face = (pts, nl) => { const d = nl[1] ? [0, nl[1], 0] : (() => { const q = D(nl[0], nl[2]); return [q[0], 0, q[1]]; })(); const ids = pts.map((p) => { const w = W(p[0], p[1], p[2]); return g.v(w[0], w[1], w[2], d[0], d[1], d[2]); }); g.quad(ids[0], ids[1], ids[2], ids[3]); };
      face([[-hx, 0, hz], [hx, 0, hz], [hx, sy, hz], [-hx, sy, hz]], [0, 0, 1]);
      face([[hx, 0, -hz], [-hx, 0, -hz], [-hx, sy, -hz], [hx, sy, -hz]], [0, 0, -1]);
      face([[hx, 0, hz], [hx, 0, -hz], [hx, sy, -hz], [hx, sy, hz]], [1, 0, 0]);
      face([[-hx, 0, -hz], [-hx, 0, hz], [-hx, sy, hz], [-hx, sy, -hz]], [-1, 0, 0]);
      face([[-hx, sy, hz], [hx, sy, hz], [hx, sy, -hz], [-hx, sy, -hz]], [0, 1, 0]);
      face([[-hx, 0, -hz], [hx, 0, -hz], [hx, 0, hz], [-hx, 0, hz]], [0, -1, 0]);
      return g;
    },
    build(extra) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      geo.setAttribute(extra || 'aMat', new THREE.Float32BufferAttribute(M, 1)); geo.setIndex(I);
      return geo;
    },
  };
  return g;
}
export const lin = (h, k = 1) => { const c = C(h); return [c.r * k, c.g * k, c.b * k]; };

// The dome, its ring of columns, the balcony and the steps. Local to the dome's axis: origin on the balcony floor.
// D = { R eave radius, RC column ring, HC column height, rise, RB balcony radius, cliffZ: the cliff edge in this frame (steps only behind it) }
async function domeGeometry(D, pause = async () => {}) {
  const g = makeGeo(), stone = lin('#e6dcc6'), stoneB = lin('#cfc3a8'), blue = lin('#ffffff'), gold = [1, 1, 1];
  const corbel = lin('#8c8068', 0.6);                                // under the overhang: the walls' darker stone, in shade
  const { R, RC, HC, rise, RB } = D, ye = HC + 1.6;
  // balcony: floor in rings of stone and lapis, a thick rim, the underside
  const rings = [[0, 3], [5, 2], [6.2, 3], [RC - 9, 3], [RC - 7.8, 2], [RC - 6.6, 3], [RC + 3.2, 3], [RC + 4.2, 2], [RC + 5.2, 3], [RB, 3]];
  for (let i = 0; i < rings.length - 1; i++) {
    const m = rings[i][1];
    g.set(m, m === 2 ? blue : (i % 2 ? stoneB : stone)).lathe(0, 0, [[rings[i + 1][0], 0], [rings[i][0], 0]], 72, { out: 1 });
  }
  g.set(3, stone).lathe(0, 0, [[RB - 1.2, -3.2], [RB + 0.5, -2.2], [RB + 0.5, -0.5], [RB, 0]], 72, { out: 1 });
  g.set(2, blue).lathe(0, 0, [[RB + 0.52, -1.9], [RB + 0.52, -0.9]], 72, { out: 1 });
  g.set(3, stoneB).lathe(0, 0, [[0, -3.2], [RB - 1.2, -3.2]], 72, { out: 1 });
  for (let k = 0; k < 24; k++) {                                     // corbels under the overhang
    const a = (k + 0.5) / 24 * TAU; g.set(3, corbel).box(Math.cos(a) * (RB - 9), -6.2, Math.sin(a) * (RB - 9), 17, 3.1, 1.6, -a);
  }
  await pause();
  // steps down to the plateau, only where there is land (behind the cliff edge)
  const land = (th) => Math.sin(th) * (RB + 6) < D.cliffZ - 3;
  for (let s = 0; s < 3; s++) {
    const r0 = RB + s * 3.4, r1 = r0 + 3.4, y = -1.05 * (s + 1);
    g.set(3, s % 2 ? stone : stoneB).lathe(0, 0, [[r1, y - 1.2], [r1, y], [r0 - 0.3, y]], 72, { out: 1, skip: (th) => !land(th) });
  }
  // balustrade and the poles of the pennants
  g.set(3, stone).lathe(0, 0, [[RB - 0.2, 0], [RB - 0.2, 1.15], [RB - 0.75, 1.15], [RB - 0.75, 0]], 72, { out: 1 });
  g.set(1, gold).lathe(0, 0, [[RB - 0.1, 1.15], [RB - 0.1, 1.4], [RB - 0.85, 1.4], [RB - 0.85, 1.15]], 72, { out: 1 });
  const poles = [];
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * TAU, x = Math.cos(a) * (RB - 0.5), z = Math.sin(a) * (RB - 0.5), h = 8.5 + 2.5 * (k % 2);
    g.set(1, gold).lathe(x, z, [[0.22, 0], [0.16, h], [0.5, h + 0.2], [0.02, h + 1.1]], 6);
    poles.push([x, h - 0.3, z, a]);
  }
  await pause();
  // columns: slender, stone with a lapis ring and a gold capital
  const cols = [];
  for (let k = 0; k < 24; k++) {
    if (k === 12) await pause();
    const a = (k + 0.5) / 24 * TAU, x = Math.cos(a) * RC, z = Math.sin(a) * RC;
    g.set(3, stoneB).lathe(x, z, [[1.25, 0], [1.25, 0.5], [0.85, 0.9], [0.72, 1.3]], 10);
    g.set(3, stone).lathe(x, z, [[0.72, 1.3], [0.7, HC * 0.45], [0.6, HC - 2.2]], 10);
    g.set(2, blue).lathe(x, z, [[0.76, HC * 0.3], [0.8, HC * 0.3 + 0.5], [0.76, HC * 0.3 + 1.0]], 10);
    g.set(1, gold).lathe(x, z, [[0.6, HC - 2.2], [0.66, HC - 1.5], [1.3, HC - 0.25], [1.35, HC]], 10);
    cols.push([x, z, a]);
  }
  await pause();
  // ring beam: lapis between two gold bands
  g.set(1, gold).lathe(0, 0, [[RC - 1.5, HC], [RC + 1.7, HC], [RC + 1.7, HC + 0.35]], 96);
  g.set(2, blue).lathe(0, 0, [[RC + 1.5, HC + 0.35], [RC + 1.5, HC + 1.25]], 96);
  g.set(1, gold).lathe(0, 0, [[RC + 1.8, HC + 1.25], [RC + 2.0, HC + 1.7]], 96);
  g.set(2, blue).lathe(0, 0, [[RC - 1.5, HC + 1.7], [RC - 1.5, HC]], 96);
  // the shell: low and wide, a scalloped eave that turns up a little between the columns
  const prof = [], NP = 22;
  for (let i = 0; i <= NP; i++) {
    const t = i / NP, a = t * Math.PI / 2;
    const r = R * Math.pow(Math.cos(a), 0.86), y = ye + rise * Math.pow(Math.sin(a), 1.12) + 0.9 * Math.exp(-t * 16);
    prof.push([Math.max(r, 0.05), y]);
  }
  const scallop = (th, t) => { const k = Math.pow(1 - t, 6); return [1 + 0.035 * k * Math.cos(th * 24), 0.55 * k * Math.cos(th * 24)]; };
  await pause();
  g.set(0, gold).lathe(0, 0, prof, 144, { out: 1, uv: true, shape: scallop });
  await pause();
  const inner = prof.map((p, i) => [Math.max(p[0] - 0.7, 0.03), p[1] - 0.55 - 0.5 * (i / NP)]);
  g.set(4, gold).lathe(0, 0, inner, 96, { out: -1, uv: true, shape: scallop });
  g.set(1, gold).lathe(0, 0, [[inner[0][0], inner[0][1]], [prof[0][0] + 0.35, (inner[0][1] + prof[0][1]) / 2 - 0.2], [prof[0][0], prof[0][1]]], 144, { out: 1, shape: (th) => scallop(th, 0) });
  await pause();
  // the finial: a stem of gold globes thinning to a needle
  const top = ye + rise, fin = [[3.4, top - 0.6], [3.0, top + 0.3], [1.3, top + 0.9]];
  let fy = top + 0.9;
  for (const rr of [2.3, 1.55, 1.0, 0.6]) { for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + k / 6 * Math.PI; fin.push([Math.max(0.28, Math.cos(a) * rr), fy + rr + Math.sin(a) * rr]); } fy += rr * 2 + 0.5; fin.push([0.28, fy]); }
  fin.push([0.2, fy + 2], [0.02, fy + 6.5]);
  g.set(1, gold).lathe(0, 0, fin, 14);
  // four basins on the balcony, still water in each (the design's jets are not built)
  const basins = [];
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) / 4 * TAU, x = Math.cos(a) * (RC - 14), z = Math.sin(a) * (RC - 14);
    g.set(3, stone).lathe(x, z, [[3.6, 0], [3.9, 0.9], [3.3, 0.9], [3.2, 0.45]], 20);
    g.set(2, blue).lathe(x, z, [[3.2, 0.5], [0, 0.5]], 20);
    g.set(1, gold).lathe(x, z, [[0.5, 0.5], [0.3, 1.9], [0.6, 2.1], [0.1, 2.5]], 8);
    basins.push([x, 2.4, z]);
  }
  await pause();
  const geometry = g.build();
  await pause();
  return { geometry, poles, cols, basins, top: fy + 6.5, eaveY: ye };
}

// long pennants on the balcony poles: one instanced strip, waved in the vertex shader
function makePennants(look, poles, cols, wind) {
  const SEG = 12, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; pos.push(t, 0.5 * (1 - 0.75 * t), 0, t, -0.5 * (1 - 0.75 * t), 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const n = poles.length, aP = new Float32Array(n * 4), aC = new Float32Array(n * 3);
  poles.forEach((p, i) => { aP.set([p[0], p[1], p[2], i * 1.7], i * 4); aC.set(cols[i % cols.length], i * 3); });
  geo.setAttribute('aPole', new THREE.InstancedBufferAttribute(aP, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(aC, 3));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsLib.fog, ...look, uWind: { value: new THREE.Vector2(wind[0], wind[1]).normalize() }, uLen: { value: 9.5 } },
    vertexShader: /* glsl */`
      attribute vec4 aPole; attribute vec3 aTint; uniform float uTime, uLen; uniform vec2 uWind;
      varying vec3 vTint, vN; varying float vT;
      #include <fog_pars_vertex>
      void main(){
        float t = position.x, ph = aPole.w;
        vec3 wdir = normalize((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz * 0.0 + vec3(uWind.x, 0.0, uWind.y));
        vec3 side = vec3(-wdir.z, 0.0, wdir.x);
        float w1 = sin(t * 7.0 - uTime * 5.2 + ph) * 0.9 * t, w2 = sin(t * 3.1 - uTime * 2.3 + ph * 1.7) * 1.3 * t;
        vec3 base = (modelMatrix * vec4(aPole.xyz, 1.0)).xyz;
        vec3 p = base + wdir * (t * uLen) + side * (w1 + w2) + vec3(0.0, position.y * 1.5 - t * t * 2.2 + 0.5 * sin(t * 5.0 - uTime * 3.7 + ph) * t, 0.0);
        float dw = cos(t * 7.0 - uTime * 5.2 + ph) * 6.3 * t + cos(t * 3.1 - uTime * 2.3 + ph * 1.7) * 4.0 * t;
        vN = normalize(side - wdir * dw / uLen);
        vTint = aTint; vT = t;
        vec4 mvPosition = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uLamp; varying vec3 vTint, vN; varying float vT;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN); float d = dot(n, uSunDir);
        vec3 col = vTint * (uSunCol * (abs(d) * 0.55 + 0.25) + uSkyCol * 0.6 + uGroundCol * 0.3 + uLamp * 0.6);
        col *= 0.8 + 0.2 * step(0.5, fract(vT * 6.0));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'pennants';
  return mesh;
}

// ---------------------------------------------------------------- the head wall: rock above, blue ice below, the mouth in the ice
export const MOUTH = { half: 17.5, top: 25, y0: -2 };
// half width of the hole at height y, m metres outside the mouth's own arch; and a sideways squeeze of a sheet's columns that
// lays them along that arch, so the hole has a smooth edge whatever the grid
const mouthHalf = (y, m = 0) => { const k = (y - MOUTH.y0) / (MOUTH.top + m - MOUTH.y0); return k >= 1 ? 0 : (MOUTH.half + m) * Math.sqrt(Math.max(0, 1 - k * k)); };
const mouthPush = (x, y, m) => { const hw = mouthHalf(y, m), W = 48, ax = Math.abs(x); return ax >= W || hw <= 0 ? x : Math.sign(x) * (hw + ax * (1 - hw / W)); };
// shape of the wall in the hero's frame: z of the face at (x, y), height of its top at x, height of the plateau d metres behind the edge
// the terraces of the head wall: heights of the treads, their depths, and where they begin, are whole, begin to die and are gone (metres aside)
export const TER = { y: [28, 33, 38], d: [7, 6, 6], x: [46, 58, 96, 118] };
export function wallShape(noise, o = {}) {
  const H0 = o.height ?? 42, seed = o.seed ?? 0;
  const topAt = (x) => H0 + smoothstep(46, 130, Math.abs(x)) * (9 + 9 * noise.n2(x * 0.011 + seed, 3.7)) + 2.5 * noise.n2(x * 0.05 + seed, 9.1) * smoothstep(30, 60, Math.abs(x));
  const base = (x, y) => {
    const ax = Math.abs(x), curve = 0.0019 * Math.max(0, ax - 40) ** 2;
    const lean = -0.1 * Math.max(0, y) - 2.2 * smoothstep(26, 38, y);
    const bulge = 3.2 * noise.fbm2(x * 0.028 + seed, y * 0.06 + 4, 3) + 1.4 * noise.n2(x * 0.11, y * 0.16 + seed) * smoothstep(20, 50, ax);
    const but = 5 * Math.pow(Math.abs(Math.sin(x * 0.045 + 1.3 + seed)), 6) * smoothstep(24, 60, ax);
    return curve + lean + bulge + but;
  };
  // the terraces: three treads on each side of the dome; terK = how far they are cut at x (0 = not at all), stepAt = treads below y
  const terK = (x) => { const ax = Math.abs(x); return smoothstep(TER.x[0], TER.x[1], ax) * (1 - smoothstep(TER.x[2], TER.x[3], ax)); };
  const stepAt = (y) => (y > TER.y[0] ? 1 : 0) + (y > TER.y[1] ? 1 : 0) + (y > TER.y[2] ? 1 : 0);
  // the face above i treads: upright on its own line (the rock's at the riser's middle), set back by the treads under it
  const faceZ = (x, y, i = stepAt(y)) => {
    const K = terK(x); if (i === 0 || K <= 0) return base(x, y);
    let cut = 0; for (let k = 0; k < i; k++) cut += TER.d[k];
    return lerp(base(x, y), base(x, TER.y[i - 1] + 2.5), smoothstep(0, 0.15, K)) - K * cut;
  };
  const backY = (x, d) => topAt(x) + d * 0.1 + 9 * smoothstep(10, 120, d) * (0.5 + noise.fbm2(x * 0.012 + seed, d * 0.012 + 8, 3)) - 0.004 * Math.max(0, d - 150) ** 2;
  return { topAt, faceZ, backY, H0, terK, base };
}
// THE WATER GATE UNDER THE DOME. The river goes into the hill through a gate of dressed stone built against the cliff: a gatehouse
// 50 m broad with the great arch in it (the mouth: 35 m broad at the water, 25 m high), a curtain wall to each side, and at each
// end, 49 m from the middle, a round tower standing in the water and rising over the cliff's edge beside the dome's balcony. The
// walls lean back a tenth (as the rock does) from a plane that clears the rock everywhere; the gatehouse stands 2.4 m before the
// curtains. Under the balcony the walls end 39.2 m up, under its corbels; beyond it they rise to a parapet over the cliff's edge.
export const GATE = { tower: 49, towerR: 6.5, house: 25, fore: 2.4, vous: 4.2, head: 39.2, step: 38 };
export function gatePlan(S) {
  let z0 = -1e9;
  for (let x = -GATE.tower - 4; x <= GATE.tower + 4; x += 1.5) for (let y = -7; y <= 44; y += 3) z0 = Math.max(z0, S.base(x, y) + 0.1 * y);
  z0 += 0.6;
  const wallZ = (x, y) => z0 + (Math.abs(x) <= GATE.house ? GATE.fore : 0) - 0.1 * y;
  const headY = (x) => Math.abs(x) < GATE.step ? GATE.head : S.topAt(x) + 1.2;
  // how far a place of the wall lies outside the mouth's own arch, in metres (less than 0: in the opening)
  const offArch = (x, y) => (Math.hypot(x / MOUTH.half, (y - MOUTH.y0) / (MOUTH.top - MOUTH.y0)) - 1) * MOUTH.half;
  return { z0, zg: z0 + GATE.fore, wallZ, headY, offArch };
}
async function gateGeometry(g, noise, S, pause = async () => {}) {
  const G = gatePlan(S), stone = lin('#e6dcc6'), stoneB = lin('#cfc3a8'), frostC = lin('#c4e4f4'), moss = lin('#5d7f4a'), dark = lin('#2a2620', 0.5);
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  // FROST ON THE STONE: thick within 9 m of the arch, in patches out to 16 m, and low over the water; moss low down away from the arch
  const tone = (x, y, base = stone) => {
    const d = G.offArch(x, y), n = noise.n2(x * 0.12 + 5, y * 0.12 + 9), fr = clamp(0.7 * smoothstep(9, 0, d) + 0.5 * smoothstep(0.0, 0.5, n) * smoothstep(16, 2, d) + 0.35 * smoothstep(7, 0, y) * (0.5 + n), 0, 0.88);
    return mix(mix(base, moss, 0.45 * smoothstep(9, 1, y) * smoothstep(22, 30, Math.abs(x)) * smoothstep(-0.2, 0.3, n)), frostC, fr);
  };
  // a flat face through four corners, its normal turned to the side `out` points to; each corner takes the stone's tone of its place
  const face = (pts, out, base = stone, plain = null, slot = 3) => {
    const [a, b, c] = pts, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const flip = nx * out[0] + ny * out[1] + nz * out[2] < 0, q = flip ? [pts[0], pts[3] || pts[2], pts[2], pts[1]] : pts, s = flip ? -1 : 1;
    const ids = (pts.length === 3 ? (flip ? [pts[0], pts[2], pts[1]] : pts) : q).map((v) => { g.set(slot, plain || tone(v[0], v[1], base)); return g.v(v[0], v[1], v[2], nx * s, ny * s, nz * s); });
    if (ids.length === 4) g.quad(ids[0], ids[1], ids[2], ids[3]); else g.I.push(ids[0], ids[1], ids[2]);
  };
  const FRONT = [0, 0.1, 1];
  // THE GATEHOUSE'S FACE: a sheet from 7 m under the water to the wall's head, its lines laid round the arch (the opening in it is
  // 0.6 m inside the voussoirs' outer edge, so the ring of voussoirs covers its cut)
  {
    const HOLE = GATE.vous - 0.6, xs = [], ys = [-7];
    for (let i = 0; i <= 14; i++) ys.push(MOUTH.y0 + (MOUTH.top + HOLE - MOUTH.y0) * Math.sin(i / 14 * Math.PI / 2));
    ys.push(33, GATE.head);
    for (let x = GATE.house; x > 0.5; x -= 1.25) xs.push(-x); xs.push(-1e-3, 1e-3); for (let x = 1.25; x <= GATE.house; x += 1.25) xs.push(x);
    const id = [];
    for (const x of xs) for (const y of ys) { const xw = mouthPush(x, y, HOLE); g.set(3, tone(xw, y)); id.push(g.v(xw, y, G.wallZ(xw, y), 0, 0.0995, 0.995)); }
    const NY = ys.length;
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < NY - 1; j++) {
      if (xs[i] < 0 && xs[i + 1] > 0 && mouthHalf(ys[j], HOLE) > 0) continue;
      const a = id[i * NY + j], b = id[(i + 1) * NY + j]; g.quad(a, b, b + 1, a + 1);
    }
  }
  await pause();
  // THE CURTAINS, from the gatehouse to the towers: their heads step up at 38 m aside, where the balcony's rim has fallen behind them
  for (const sd of [-1, 1]) {
    const xs = []; for (let ax = GATE.house; ax < GATE.tower - 3; ax += 1.5) { xs.push(ax); if (ax < GATE.step && ax + 1.5 >= GATE.step) xs.push(GATE.step - 1e-3, GATE.step + 1e-3); } xs.push(GATE.tower - 3);
    let prev = null;
    for (const ax of xs) {
      const x = sd * ax, xi = sd * (ax + 1e-3), hy = G.headY(x), cur = [];
      for (const y of [-7, 4.5, 14, 24, 33, hy]) { g.set(3, tone(x, y)); cur.push(g.v(x, y, G.wallZ(xi, y), 0, 0.0995, 0.995)); }
      if (prev) for (let k = 0; k < 5; k++) { if (sd > 0) g.quad(prev[k], cur[k], cur[k + 1], prev[k + 1]); else g.quad(cur[k], prev[k], prev[k + 1], cur[k + 1]); }
      prev = cur;
    }
  }
  // the gatehouse's two returns (its sides, 2.4 m deep, where it stands before the curtains)
  for (const sd of [-1, 1]) { const x = sd * GATE.house, xo = sd * (GATE.house + 1e-3); face([[x, -7, G.wallZ(x, -7)], [x, -7, G.wallZ(xo, -7)], [x, GATE.head, G.wallZ(xo, GATE.head)], [x, GATE.head, G.wallZ(x, GATE.head)]], [sd, 0, 0]); }
  // THE WALL'S HEAD: its top from the face back into the rock (a walk under the balcony; a coping beyond it), and the end of the
  // higher wall where the head steps up
  for (const sd of [-1, 1]) {
    const cuts = []; for (let ax = 0; ax < GATE.step; ax += 3) cuts.push([ax, Math.min(ax + 3, GATE.step)]); for (let ax = GATE.step; ax < GATE.tower - 3; ax += 3) cuts.push([ax, Math.min(ax + 3, GATE.tower - 3)]);
    for (const [a0, a1] of cuts) {
      const x0 = sd * a0, x1 = sd * a1, xa = sd * (a0 + 0.01), xb = sd * (a1 - 0.01), ya = G.headY(xa), yb = G.headY(xb);
      face([[x0, ya, G.wallZ(xa, ya)], [x1, yb, G.wallZ(xb, yb)], [x1, yb, S.base(x1, yb) - 2], [x0, ya, S.base(x0, ya) - 2]], [0, 1, 0], stoneB);
    }
    const x = sd * GATE.step, xo = sd * (GATE.step + 0.01), y1 = G.headY(xo);
    face([[x, GATE.head, G.wallZ(xo, GATE.head)], [x, y1, G.wallZ(xo, y1)], [x, y1, S.base(x, y1) - 2], [x, GATE.head, S.base(x, GATE.head) - 2]], [-sd, 0, 0]);
  }
  await pause();
  // THE VOUSSOIRS: 27 wedge stones round the arch, each 4.2 m long from the opening outward and standing half a metre proud of the
  // wall, a joint of a hand's breadth between them: by turns the walls' pale stone and the dome's lapis; the keystone is gold, a
  // third longer, and stands a metre proud. The pale ones are frosted from within.
  {
    const NV = 27, ell = (a, m) => [(MOUTH.half + m) * Math.cos(a), MOUTH.y0 + (MOUTH.top + m - MOUTH.y0) * Math.sin(a)];
    for (let i = 0; i < NV; i++) {
      const key = i === (NV - 1) / 2, a0 = (i + 0.07) / NV * Math.PI, a1 = (i + 0.93) / NV * Math.PI, m0 = -0.15, m1 = GATE.vous + (key ? 1.4 : 0), pr = key ? 1.0 : 0.5;
      const slot = key ? 1 : i % 2 ? 2 : 3, plain = key ? [1, 1, 1] : i % 2 ? [1.15, 1.15, 1.15] : null;
      const c = [ell(a0, m0), ell(a1, m0), ell(a1, m1), ell(a0, m1)], am = (a0 + a1) / 2, rad = [Math.cos(am), Math.sin(am), 0], tan = [-Math.sin(am), Math.cos(am), 0];
      const F = c.map((q) => [q[0], q[1], G.wallZ(q[0], q[1]) + pr]), B = c.map((q) => [q[0], q[1], G.wallZ(q[0], q[1]) - 1.4]);
      face(F, FRONT, stone, plain, slot);
      face([F[3], F[2], B[2], B[3]], rad, stone, plain, slot);                // its back (the outer edge)
      face([F[0], F[1], B[1], B[0]], [-rad[0], -rad[1], 0], stone, plain, slot); // its belly (the opening's edge)
      face([F[0], F[3], B[3], B[0]], [-tan[0], -tan[1], 0], stone, plain, slot); face([F[1], F[2], B[2], B[1]], tan, stone, plain, slot);
    }
    // THE PASSAGE: the arch's own soffit of stone going in from the wall's face to 3.5 m inside the rock's, more frosted the deeper
    const NA = 44; let prev = null;
    for (let i = 0; i <= NA; i++) {
      const a = lerp(-0.06, 1.06, i / NA) * Math.PI, [x, y] = ell(a, -0.1), zf = G.wallZ(x, y) - 1.2, zb = Math.min(zf - 2, S.faceZ(x, Math.max(y, 0)) - 3.5), cur = [];
      for (const [k, fr] of [[0, 0.35], [0.5, 0.65], [1, 0.9]]) { g.set(3, mix(i % 2 ? stone : stoneB, frostC, fr)); cur.push(g.v(x, y, lerp(zf, zb, k), -Math.cos(a), -Math.sin(a), 0)); }
      if (prev) for (let k = 0; k < 2; k++) g.quad(prev[k], cur[k], cur[k + 1], prev[k + 1]);
      prev = cur;
    }
  }
  await pause();
  // BUTTRESSES: at each corner of the gatehouse one 5.5 m broad, and on each curtain one 4 m broad where the wall's head steps up.
  // Each stands out in stages that draw in upward, every stage ending in a sloped weathering; stages: [the stage's top, how far it stands out].
  const buttress = (x, wd, stages) => {
    let y0 = -7; const zAt = (y) => G.wallZ(x, y), xl = x - wd / 2, xr = x + wd / 2;
    for (let k = 0; k < stages.length; k++) {
      const [y1, pr] = stages[k], nxt = k + 1 < stages.length ? stages[k + 1][1] : 0, yw = y1 + (pr - nxt) * 0.9, zb = -2.6;
      face([[xl, y0, zAt(y0) + pr], [xr, y0, zAt(y0) + pr], [xr, y1, zAt(y1) + pr], [xl, y1, zAt(y1) + pr]], FRONT);
      for (const [xs, sd] of [[xl, -1], [xr, 1]]) {
        face([[xs, y0, zAt(y0) + zb], [xs, y0, zAt(y0) + pr], [xs, y1, zAt(y1) + pr], [xs, y1, zAt(y1) + zb]], [sd, 0, 0]);
        face([[xs, y1, zAt(y1) + zb], [xs, y1, zAt(y1) + pr], [xs, yw, zAt(yw) + nxt], [xs, yw, zAt(yw) + zb]], [sd, 0, 0]);
      }
      face([[xl, y1, zAt(y1) + pr], [xr, y1, zAt(y1) + pr], [xr, yw, zAt(yw) + nxt], [xl, yw, zAt(yw) + nxt]], [0, 0.7, 0.7], stoneB);
      y0 = yw;
    }
  };
  for (const sd of [-1, 1]) {
    buttress(sd * (GATE.house - 0.2), 5.5, [[9, 3.6], [21, 2.5], [32.4, 1.5], [GATE.head - 0.4, 0.7]]);
    buttress(sd * GATE.step, 4, [[8, 3.0], [20, 2.0], [32.4, 1.2], [S.topAt(sd * GATE.step) + 2.6, 0.6]]);
  }
  // a course of stone along the walls 33 m up, and under each head a row of corbels carrying a cornice; a battered plinth along the
  // curtains' feet, 1.8 m out under the water and drawn in to the wall by 4.5 m up
  const band = (xa, xb, y, hh, pr, cb = stoneB) => {
    const xm = (xa + xb) / 2, z = (yy) => G.wallZ(xm, yy);
    face([[xa, y, z(y)], [xb, y, z(y)], [xb, y + 0.25, z(y + 0.25) + pr], [xa, y + 0.25, z(y + 0.25) + pr]], [0, -0.7, 0.7], cb);
    face([[xa, y + 0.25, z(y + 0.25) + pr], [xb, y + 0.25, z(y + 0.25) + pr], [xb, y + hh - 0.2, z(y + hh - 0.2) + pr], [xa, y + hh - 0.2, z(y + hh - 0.2) + pr]], FRONT, cb);
    face([[xa, y + hh - 0.2, z(y + hh - 0.2) + pr], [xb, y + hh - 0.2, z(y + hh - 0.2) + pr], [xb, y + hh, z(y + hh)], [xa, y + hh, z(y + hh)]], [0, 0.7, 0.7], cb);
  };
  for (const [xa, xb] of [[-GATE.house + 2.6, GATE.house - 2.6], [GATE.house + 2.6, GATE.step - 2], [-GATE.step + 2, -GATE.house - 2.6], [GATE.step + 2, GATE.tower - 4], [-GATE.tower + 4, -GATE.step - 2]]) {
    band(xa, xb, 32.4, 0.9, 0.5);
    const hy = G.headY((xa + xb) / 2), n = Math.max(2, Math.round((xb - xa) / 2.2));
    band(xa, xb, hy - 0.75, 0.75, 0.95, stone);
    for (let k = 0; k < n; k++) { const x = lerp(xa, xb, (k + 0.5) / n), z = G.wallZ((xa + xb) / 2, hy - 1.3); g.set(3, tone(x, hy - 1.9, stoneB)).box(x, hy - 1.9, z + 0.4, 0.9, 1.15, 0.8); }
    if (Math.abs(xa) >= GATE.house) {
      const xm = (xa + xb) / 2, x0 = xa, z = (y) => G.wallZ(xm, y);
      face([[x0, -7, z(-7) + 1.8], [xb, -7, z(-7) + 1.8], [xb, 4.2, z(4.2) + 0.3], [x0, 4.2, z(4.2) + 0.3]], [0, 0.15, 1]);
      face([[x0, 4.2, z(4.2) + 0.3], [xb, 4.2, z(4.2) + 0.3], [xb, 4.5, z(4.5)], [x0, 4.5, z(4.5)]], [0, 0.7, 0.7], stoneB);
    }
  }
  await pause();
  // THE TOWERS: one at each end of the curtains, round, 6.5 m in radius, its middle a metre before the curtain's plane. It stands
  // in the water on a battered foot, carries the walls' course of stone round it, and rises over the cliff's edge to a gallery on
  // corbels 49 m up; over the gallery a narrower drum with four openings, and a pointed roof in the dome's own tiles with a gold
  // finial 71 m up (the dome's eave stands 61 m up, its top 78). Slits light its stair.
  for (const sd of [-1, 1]) {
    const cx = sd * GATE.tower, cz = G.z0 + 1, R = GATE.towerR;
    g.set(3, stoneB).lathe(cx, cz, [[R + 1.9, -7], [R + 0.5, 4.5], [R, 5.5]], 28);
    g.set(3, stone).lathe(cx, cz, [[R, 5.5], [R, 32.4]], 28);
    g.set(3, stoneB).lathe(cx, cz, [[R, 32.4], [R + 0.5, 32.7], [R + 0.5, 33.1], [R, 33.3]], 28);
    g.set(3, stone).lathe(cx, cz, [[R, 33.3], [R, 46.6]], 28);
    g.set(3, stoneB).lathe(cx, cz, [[R, 46.6], [R + 0.5, 47.3], [R + 1.3, 48.8], [R + 1.3, 50.4], [R + 0.8, 50.4], [R + 0.8, 49.4], [R - 1.3, 49.4]], 28);
    g.set(3, stone).lathe(cx, cz, [[R - 1.3, 49.4], [R - 1.3, 55.6], [R - 0.6, 56.1], [R - 0.6, 56.7]], 28);
    g.set(0, [1, 1, 1]).lathe(cx, cz, [[R - 0.3, 56.5], [R - 1.3, 58.6], [R - 3.2, 61.6], [R - 5.0, 64.6], [0.5, 67.3]], 28, { uv: true });
    g.set(1, [1, 1, 1]).lathe(cx, cz, [[0.5, 67.3], [0.95, 68.1], [0.35, 68.9], [0.05, 71.4]], 8);
    for (let k = 0; k < 14; k++) { const a = (k + 0.5) / 14 * TAU; g.set(3, stoneB).box(cx + Math.sin(a) * (R + 1.05), 50.4, cz + Math.cos(a) * (R + 1.05), 1.5, 0.9, 0.5, a); }
    for (const [b, y, wd, hh] of [[0, 14, 0.55, 3], [0.7 * sd, 24, 0.55, 3], [-0.6 * sd, 38, 0.55, 3], [0, 42, 0.55, 2.4]]) g.set(3, dark).box(cx + Math.sin(b) * (R - 0.12), y, cz + Math.cos(b) * (R - 0.12), wd, hh, 0.3, b);
    for (let k = 0; k < 4; k++) { const b = (k + 0.5) / 4 * TAU; g.set(3, dark).box(cx + Math.sin(b) * (R - 1.42), 51.2, cz + Math.cos(b) * (R - 1.42), 1.3, 2.8, 0.3, b); }
  }
}
// the retaining walls of the terraces with their parapets and copings, and the stairs between the treads: the dome's own stone, in
// courses. Wall i holds tread i and stands 0.5 m before the rock under the tread's lip. Returns the geometry, lineZ(x, i) and the stairs' heads.
const FLIGHTS = [[1, 64, 1], [2, 84, -1], [3, 62, -1]];              // [the wall it climbs (3 = the rock under the top), its foot (m aside), +1 rising outward, -1 inward]
const STEP = { rise: 0.5, going: 0.9, broad: 2.2, landing: 2.7 };
async function terraceGeometry(noise, S, pause = async () => {}) {
  const g = makeGeo(), stone = lin('#e6dcc6'), stoneB = lin('#cfc3a8'), ivy = lin('#4d8d46'), mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const lineZ = (x, i) => (i === 0 ? Math.max(S.faceZ(x, 23, 0), S.faceZ(x, 25.5, 0), S.faceZ(x, 28, 0)) : i < 3 ? S.faceZ(x, TER.y[i] - 1, i) : S.faceZ(x, TER.y[2] + 2, 3) - 0.3) + 0.5;
  const slope = (x, i) => (lineZ(x + 0.5, i) - lineZ(x - 0.5, i));
  const heads = [];
  for (const sd of [-1, 1]) for (const [w, foot, dir] of FLIGHTS) {
    const y0 = TER.y[w - 1], rise = w < 3 ? 5 : S.topAt(sd * (foot + dir * 4.5)) - y0, n = Math.max(2, Math.round(rise / STEP.rise));
    for (let k = 0; k <= n; k++) {
      // the steps, and after the last the landing at the head
      const last = k === n, ax = foot + dir * (last ? n * STEP.going + STEP.landing / 2 : (k + 0.5) * STEP.going), x = sd * ax, h = last ? rise : (k + 1) * rise / n;
      g.set(3, k % 2 ? stone : stoneB).box(x, y0 - 0.3, lineZ(x, w) + STEP.broad / 2, last ? STEP.landing : STEP.going, h + 0.3, STEP.broad, -Math.atan(slope(x, w)));
    }
    heads.push([w, sd, foot + dir * (n * STEP.going + STEP.landing / 2)]);
  }
  const gapAt = (i, sd, ax) => heads.some((h) => h[0] === i && h[1] === sd && Math.abs(ax - h[2]) < STEP.landing / 2 + 0.4);
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    await pause();
    let prev = null;
    for (let ax = TER.x[0]; ax <= TER.x[3]; ax += 1) {
      const x = sd * ax;
      if (S.terK(x) * TER.d[i] < 1.2) { prev = null; continue; }
      const z = lineZ(x, i), dz = slope(x, i), nl = Math.hypot(dz, 1), nx = -dz / nl, nz = 1 / nl;
      const yT = TER.y[i] + (gapAt(i, sd, ax) ? 0 : 1), yF = i === 0 ? 22.4 : TER.y[i - 1] - 0.3;
      const hang = smoothstep(0.15, 0.5, noise.n2(ax * 0.09 + i * 7.3, sd * 3.1)), deep = smoothstep(0.0, 0.5, noise.n2(ax * 0.2 + i * 3.7, sd * 5.9 + 4));
      const cur = [];
      g.set(3, stone); cur.push(g.v(x, yF, z, nx, 0, nz));
      g.set(3, mix(stone, ivy, 0.7 * hang * deep)); cur.push(g.v(x, TER.y[i] - 2.2, z, nx, 0, nz));
      g.set(3, mix(stone, ivy, 0.7 * hang)); cur.push(g.v(x, yT, z, nx, 0, nz));
      g.set(3, mix(stoneB, ivy, 0.7 * hang)); cur.push(g.v(x, yT, z + 0.12, 0, 1, 0), g.v(x, yT, z - 0.7, 0, 1, 0));
      g.set(3, stoneB); cur.push(g.v(x, yT, z - 0.7, -nx, 0, -nz), g.v(x, TER.y[i] - 0.2, z - 0.7, -nx, 0, -nz));
      if (prev) {
        const Q = (a, b, c, d) => { if (sd > 0) g.quad(a, b, c, d); else g.quad(b, a, d, c); };
        Q(prev[0], cur[0], cur[1], prev[1]); Q(prev[1], cur[1], cur[2], prev[2]); Q(prev[3], cur[3], cur[4], prev[4]); Q(cur[6], prev[6], prev[5], cur[5]);
      }
      prev = cur;
    }
  }
  await pause();
  await gateGeometry(g, noise, S, pause);
  await pause();
  // two burners on the first terrace of each side, 4.4 m behind its parapet, 68 and 88 m aside: their smoke rises before the upper walls
  const burners = [];
  for (const sd of [-1, 1]) for (const ax of [68, 88]) burners.push(burnerInto(g, sd * ax, TER.y[0] - 0.3, lineZ(sd * ax, 0) - 4.4, 0.8));
  return { geometry: g.build(), lineZ, heads, burners };
}
async function headwallGeometry(noise, S, wing, pause = async () => {}) {
  const xs = []; { let x = 0; const half = []; while (x < wing) { half.push(x); x += x < 50 ? 2.5 : x < 120 ? 4.5 : 8; } half.push(wing); for (let i = half.length - 1; i > 0; i--) xs.push(-half[i]); for (const h of half) xs.push(h); }
  const back = [2.5, 6, 11, 18, 28, 42, 62, 90, 125, 165, 210];
  // rows up the face: [height, treads under it, seam]. A seam row repeats the row before it and no faces join the two, so the corners of
  // the terraces are sharp. Ten rows to 23 m, one at 25.5, five to each terrace (its lip twice, its tread's back twice, the riser's middle), the top.
  const rowsAt = (top) => {
    const R = []; for (let j = 0; j <= 9; j++) R.push([lerp(-7, 23, Math.pow(j / 9, 0.9)), 0, 0]);
    R.push([25.5, 0, 0]);
    for (let i = 0; i < 3; i++) { const y = TER.y[i], yn = i < 2 ? TER.y[i + 1] : top; R.push([y, i, 0], [y, i, 1], [y, i + 1, 0], [y, i + 1, 1], [(y + yn) / 2, i + 1, 0]); }
    R.push([top, 3, 0]);
    return R;
  };
  const SEAM = rowsAt(50).map((r) => r[2]), NF = SEAM.length - 1;
  const P = [], K = [], I = [], NR = NF + 1 + back.length;
  // the chasm's rock (albedo 0.05 to 0.085), wet to the first tread, a tenth lighter above it; the plateau's green hangs over the top of the face in patches
  const rockLo = C('#525150'), rockLoD = C('#3f4041'), rockHi = C('#5c5b59'), rockHiD = C('#454546'), rock = C('#5c5b59'), mossC = C('#56844a'), grass = C('#3d7f43'), grassB = C('#5c9a48'), tmp = new THREE.Color(), tmp2 = new THREE.Color();
  let col = 0;
  for (const x of xs) {
    if (++col % 14 === 0) await pause();
    const top = S.topAt(x);
    const rows = rowsAt(top), tk = S.terK(x);
    for (let j = 0; j <= NF; j++) {
      const y = rows[j][0], xw = mouthPush(x, y, 1.7), dk = 0.5 + 0.5 * noise.n2(x * 0.05, y * 0.21);
      P.push(xw, y, S.faceZ(xw, y, rows[j][1]));
      tmp.copy(rockLo).lerp(rockLoD, dk); tmp2.copy(rockHi).lerp(rockHiD, dk);
      tmp.lerp(tmp2, smoothstep(24, 30, y)).multiplyScalar(0.9 + 0.2 * noise.n2(x * 0.3, y * 0.3));
      // within the first terrace's reach the rock is wet from the ice's melt and carries moss in patches, thicker toward the water
      tmp.lerp(mossC, 0.65 * smoothstep(0.0, 0.4, noise.n2(x * 0.09 + 11, y * 0.13 + 5)) * smoothstep(30, 10, y) * smoothstep(TER.x[1], TER.x[0], Math.abs(x)));
      // a tread is grass from its lip to its back; the top of the face carries the plateau's green in patches
      const tread = tk > 0.03 && j > 10 && j < NF && ((rows[j][2] === 1 && rows[j][1] < rows[j + 1][1]) || (rows[j][2] === 0 && rows[j - 1][2] === 1 && rows[j - 1][0] === y));
      if (tread) tmp.copy(grass).lerp(grassB, 0.5 + 0.5 * noise.n2(x * 0.06 + 7, y)).multiplyScalar(0.9);
      if (j === NF) tmp.lerp(grass, 0.85 * smoothstep(-0.1, 0.4, noise.n2(x * 0.07, 3.3)));
      K.push(tmp.r, tmp.g, tmp.b);
    }
    for (let k = 0; k < back.length; k++) {
      const d = back[k], y = S.backY(x, d);
      P.push(x, y, S.faceZ(x, top) - d);
      tmp.copy(grass).lerp(grassB, 0.5 + 0.5 * noise.n2(x * 0.02 + 7, d * 0.02)).multiplyScalar(0.85 + 0.2 * noise.n2(x * 0.11, d * 0.11));
      if (k === 0) tmp.lerp(rock, 0.5);
      K.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < NR - 1; j++) {
    const a = i * NR + j, b = a + NR, xm = (xs[i] + xs[i + 1]) / 2;
    if (j < NF && Math.abs(xm) < 2 && mouthHalf(P[a * 3 + 1], 1.7) > 0) continue;
    if (j < NF && SEAM[j + 1] === 1) continue;
    I.push(a, b, b + 1, a, b + 1, a + 1);
  }
  await pause();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); geo.setIndex(I);
  await pause();
  geo.computeVertexNormals();
  await pause();
  return { rock: geo };
}

// THE ICE GROWS FROM WITHIN. It lines the passage of the gate: it begins on the stone soffit 2.5 m behind the wall's face as a
// thin lip, thickens inward (1.3 m by the rock's own face, where the caverns' ice takes over), and its rim at the passage's
// mouth is ragged: lobes of it reach forward along the soffit to within half a metre of the wall's face.
function mouthLiningGeometry(noise, S) {
  // [metres outside the mouth's own arch, z, glow]: the first three z are measured from the wall's face (going in), the rest from the rock's
  const G = gatePlan(S), NA = 66, prof = [[-0.12, -2.5, 0.02], [-0.45, -3.4, 0.12], [-0.9, -5, 0.3], [-1.3, -2, 0.5], [-1.2, -8, 0.68], [-0.4, -15, 0.84], [1.2, -22, 1]], NK = prof.length;
  const P = [], A = [], I = [];
  for (let i = 0; i <= NA; i++) {
    const a = lerp(-0.1, 1.1, i / NA) * Math.PI, ca = Math.cos(a), sa = Math.sin(a), lobe = 2 * Math.pow(0.5 + 0.5 * Math.sin(a * 23 + 3 * noise.n2(a * 2.3, 7.7)), 2);
    for (let k = 0; k < NK; k++) {
      const m = prof[k][0] + (k > 2 ? 0.45 : 0.12 * k) * noise.n2(a * 3.1 + 5, k * 0.9), x = (MOUTH.half + m) * ca, y = MOUTH.y0 + (MOUTH.top + m - MOUTH.y0) * sa, g = prof[k][2];
      const zr = S.faceZ(x, Math.max(y, 0)), zw = G.wallZ(x, y);
      let z = k < 3 ? Math.max(zw + prof[k][1] + (k === 0 ? lobe : k === 1 ? 0.4 * lobe : 0), zr - 1.2 + 0.4 * (2 - k)) : Math.min(zr + prof[k][1], zw - 5.6);
      P.push(x, y, z + (k > 2 ? 0.3 * noise.n2(a * 5.3, k * 1.7 + 9) : 0));
      // glow: up to where the lining passes the rock's face (g 0.3), then down to the cave's own depth of blue at its inner end
      A.push(0.3 + 0.4 * Math.min(g, 0.3) - 0.47 * smoothstep(0.3, 1, g) + 0.15 * noise.n2(a * 4.1 + 2, k * 1.3), 0.8 + 0.3 * Math.min(g, 0.3), smoothstep(0.1, 0.3, g) - 1);
    }
  }
  for (let i = 0; i < NA; i++) for (let k = 0; k < NK - 1; k++) { const p = i * NK + k, q = p + NK; I.push(p, p + 1, q + 1, p, q + 1, q); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// an icicle: unit length hanging down from the origin, widest (radius 0.09) at the root
export function icicleGeometry(sun = 0, sides = 7) {
  const P = [], A = [], I = [], NR = 6;
  for (let j = 0; j <= NR; j++) {
    const t = j / NR, r = 0.09 * Math.pow(1 - t, 1.25) * (1 + 0.35 * Math.sin(t * 17)) + 0.004 * (1 - t);
    for (let k = 0; k <= sides; k++) { const a = k / sides * TAU; P.push(Math.cos(a) * r * (1 + 0.25 * Math.sin(a * 3 + t * 5)), -t, Math.sin(a) * r); A.push(0.05 + 0.45 * t, 1, sun); }
  }
  for (let j = 0; j < NR; j++) for (let k = 0; k < sides; k++) { const a = j * (sides + 1) + k, b = a + sides + 1; I.push(a, a + 1, b + 1, a, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// a column of ice: unit height standing on the origin, radius 1 at its waist, spreading to 1 + foot at its foot and 1 + head at its head
// THE FAR SHAPE OF AN ICICLE (room for the triangles; drawn for a piece while the way is far from it, see the world file): a cone of
// the near shape's own sides, on its axis, its point at the near shape's point, one triangle a side (7 for the near shape's 84, 5 for
// the 60 of a shape of five sides). Its corners stand at the near shape's own angles, lobed in breadth as the near shape is (to the
// depth and at the turn that lie nearest the near shape's lobes along its whole length); its root is as broad as gives the near
// shape's area in the picture (from one side 6 in a hundred under it, from another 6.5 over, counted on the pieces as flown past).
// So fitted, no point of either shape lies farther from the other than 0.0196 of the piece's scale
// for a piece up to 1.2 scales long (0.0199 at 1.66; five sides: 0.0175), every point of each surface taken to the other on a grid
// of 15 points a triangle and finer. IT IS SHADED AS THE NEAR SHAPE IS ON THE MEAN: down each meridian of the near shape the mean
// of its own normals is taken (each place weighed by the shape's breadth there); the point of a side carries the mean of its two
// meridians, and its two root corners stand half as far again from that mean as their meridians do (a triangle's breadth falls to
// nothing at its point: so, over the whole face, the normals are spread as far as the near shape's are between the two meridians);
// the light value that runs down the length has the near shape's mean and spread. WHAT THE MEAN DOES NOT HOLD: the near shape is
// lobed and bulged, and from one side it turns more of itself edge-on than a cone does, from another less. By the two shapes alone,
// seen from every side at three heights, the mean of (1 - n.v)^2 over what is turned to the eye (the part of the ice's light that
// turns with the eye) stands 0.002 under the near shape's on the mean of all sides and up to 0.05 from it at the worst side (the
// near shape's own runs from 0.09 to 0.20 round the piece). It takes the same instance matrices and the same material.
const FAR_FIT = { 7: [0.088, 0.13, 0.6], 5: [0.088, 0.15, 1.2] };       // sides: [root radius, the lobes' depth, their turn]
export function icicleFarGeometry(sun = 0, sides = 7) {
  const near = icicleGeometry(sun, sides), np = near.getAttribute('position'), nn = near.getAttribute('normal'), NR = 6, [R0, lobe, turn] = FAR_FIT[sides] || FAR_FIT[7];
  const P = [], N = [], A = [], I = [], M = [], C = [], SPREAD = 1.5;
  // down each meridian of the near shape, every place weighed by the shape's breadth there: the mean of its normal; and over all
  // of them the mean place along the length and its spread
  let W = 0, T1 = 0, T2 = 0;
  for (let k = 0; k <= sides; k++) {
    let w = 0, x = 0, y = 0, z = 0;
    for (let j = 0; j < NR; j++) for (let q = 0; q < 8; q++) {
      const f = (q + 0.5) / 8, a = j * (sides + 1) + k, b = a + sides + 1, r = lerp(Math.hypot(np.getX(a), np.getZ(a)), Math.hypot(np.getX(b), np.getZ(b)), f), t = (j + f) / NR;
      w += r; x += r * lerp(nn.getX(a), nn.getX(b), f); y += r * lerp(nn.getY(a), nn.getY(b), f); z += r * lerp(nn.getZ(a), nn.getZ(b), f); W += r; T1 += r * t; T2 += r * t * t;
    }
    M.push([x / w, y / w, z / w]);
    const a = k / sides * TAU; C.push([Math.cos(a) * R0 * (1 + lobe * Math.sin(a * 3 + turn)), Math.sin(a) * R0]);
  }
  // (a cone's faces lie as 2 (1 - t): a value that runs evenly from a at its root to a + b at its point has the mean a + b / 3 and the spread b * b / 18)
  const tm = T1 / W, ts = Math.sqrt(18 * Math.max(0, T2 / W - tm * tm)), x0 = 0.05 + 0.45 * (tm - ts / 3), x1 = 0.05 + 0.45 * (tm + 2 * ts / 3);
  for (let k = 0; k < sides; k++) {
    const p = M[k], q = M[k + 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, mz = (p[2] + q[2]) / 2;
    const put = (c, x, y, z, ax) => { const l = Math.hypot(x, y, z) || 1; P.push(...c); N.push(x / l, y / l, z / l); A.push(ax, 1, sun); };
    put([C[k][0], 0, C[k][1]], mx + SPREAD * (p[0] - mx), my + SPREAD * (p[1] - my), mz + SPREAD * (p[2] - mz), x0);
    put([C[k + 1][0], 0, C[k + 1][1]], mx + SPREAD * (q[0] - mx), my + SPREAD * (q[1] - my), mz + SPREAD * (q[2] - mz), x0);
    put([0, -1, 0], mx, my, mz, x1);
    I.push(k * 3, k * 3 + 1, k * 3 + 2);
  }
  near.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  return g;
}
export function columnGeometry(sides = 9, rows = 8, foot = 0.9, head = 0.9) {
  const P = [], A = [], I = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, r = 1 + foot * Math.pow(Math.max(1 - 2 * t, 0), 3) + head * Math.pow(Math.max(2 * t - 1, 0), 3) + 0.1 * Math.sin(t * 23);
    for (let k = 0; k <= sides; k++) { const a = k / sides * TAU; P.push(Math.cos(a) * r * (1 + 0.14 * Math.sin(a * 3 + t * 6)), t, Math.sin(a) * r); A.push(0.12 + 0.25 * Math.sin(t * 9 + a), 0.85 + 0.15 * t, 0); }
  }
  for (let j = 0; j < rows; j++) for (let k = 0; k < sides; k++) { const a = j * (sides + 1) + k, b = a + sides + 1; I.push(a, b, b + 1, a, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the caverns: a tube of ice round a line of sections
// rings: [{ p: Vector3 (middle of the section), t: [tx, tz] heading, a: half width, b: half height, floor: y, river: lateral offset of the channel, sun, glow }]
export async function makeIceCave(noise, look, rings, o = {}) {
  const pause = o.yield || (async () => {});
  const NS = o.segments ?? 56, NFL = o.floorSegments ?? 40, P = [], A = [], I = [], n = rings.length;
  const pt = new Float32Array(n * (NS + 1) * 3);
  // light reaching a point: the section's own (daylight near the mouth, negative), or a shaft's spot (o.spots: [[x, z, radius]]) where that is stronger
  const spots = o.spots || [];
  // o.hold([x, y, z]): the world's hold on each point of the tube and of its floor (it keeps them behind the cliff they lie in)
  const hold = o.hold || (() => {}), hv = [0, 0, 0];
  const sunAt = (r, x, z) => { let v = r.sun ?? 0; for (const q of spots) { const d2 = ((x - q[0]) ** 2 + (z - q[1]) ** 2) / (q[2] * q[2]); if (d2 < 6) { const k = 0.85 * Math.exp(-d2); if (k > Math.abs(v)) v = k; } } return v; };
  const floorY = (r, i, lat) => {
    const rw = r.rw ?? 7, dl = Math.abs(lat - (r.river ?? 0)), edge = Math.max(0, Math.abs(lat) - r.a * 0.5);
    // a ledge (r.ledge = { y, edge }): left of its edge the floor stands at the ledge's level, with a cliff of ice down to the lower floor
    const le = r.ledge ? r.ledge.edge + (r.ledge.wander ?? 0) * noise.n2(i * 0.37, 4.1) : 0;       // the ledge's edge wanders
    const base = r.ledge ? r.floor + (r.ledge.y - r.floor) * smoothstep(le + 1.2, le - 2.2, lat) : r.floor;
    return base + 3.5 * smoothstep(rw - 3.5, rw + 2.5, dl) + 1.5 * noise.n2(lat * 0.09 + i * 0.13, i * 0.21) * smoothstep(rw, rw + 10, dl) + 0.9 * noise.n2(lat * 0.3, i * 0.9) * smoothstep(rw, rw + 6, dl)
      - 1.6 * smoothstep(rw, 2, dl) + 0.011 * edge * edge;
  };
  for (let i = 0; i < n; i++) {
    if (i % 8 === 7) await pause();
    const r = rings[i], rx = -r.t[1], rz = r.t[0];
    for (let k = 0; k <= NS; k++) {
      const th = (k % NS) / NS * TAU, c = Math.cos(th), s = Math.sin(th);
      const qx = r.p.x + rx * c * r.a, qy = r.p.y + s * r.b, qz = r.p.z + rz * c * r.a;
      const bump = 1 + 0.3 * noise.fbm3(qx * 0.018, qy * 0.024, qz * 0.018, 3) + 0.1 * noise.n3(qx * 0.07, qy * 0.07, qz * 0.07) + 0.05 * Math.sin(th * 9 + i * 0.7);
      let lat = c * r.a * bump, y = r.p.y + s * r.b * bump * (s > 0 ? 1 + 0.25 * noise.n2(i * 0.11, k * 0.3) : 1);
      const fy = floorY(r, i, lat) - 1.4;
      if (y < fy) y = fy;
      const q = (i * (NS + 1) + k) * 3;
      hv[0] = r.p.x + rx * lat; hv[1] = y; hv[2] = r.p.z + rz * lat; hold(hv);
      const x = hv[0], z = hv[2]; y = hv[1];
      pt[q] = x; pt[q + 1] = y; pt[q + 2] = z;
      P.push(x, y, z);
      const up = clamp((y - fy) / Math.max(r.b, 1), 0, 1.6);
      A.push((r.glow ?? 0) + 0.5 * noise.fbm3(x * 0.012 + 40, y * 0.02, z * 0.012, 2) + 0.14 * up - 0.27, (0.66 + 0.34 * smoothstep(0, 0.3, up)) * (r.ao ?? 1), sunAt(r, x, z));
    }
  }
  // o.split: the sections before it (the part that can be seen from outside through the mouth) make a mesh of their own
  const split = o.split ?? 0, IA = [];
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < NS; k++) { const a = i * (NS + 1) + k, b = a + NS + 1; (i < split ? IA : I).push(a, b, b + 1, a, b + 1, a + 1); }
  const f0 = P.length / 3;
  // The floor's columns follow the channel, so that a bank runs along the mesh wherever the river turns: counted from the river's middle, on each
  // side 4 across the bed, 4 up the bank (its 6 m) and the rest out to the tube's side (a third of all columns on the left, where the ledge is)
  // Their middle follows the river no faster than 0.8 m sideways per metre along (at a lip's sideways step it lags, or its quads would lie aslant).
  const mid = rings.map((r) => r.river ?? 0);
  for (let i = 1; i < n; i++) { const d = 0.8 * Math.hypot(rings[i].p.x - rings[i - 1].p.x, rings[i].p.z - rings[i - 1].p.z); mid[i] = clamp(mid[i], mid[i - 1] - d, mid[i - 1] + d); }
  for (let i = n - 2; i >= 0; i--) { const d = 0.8 * Math.hypot(rings[i].p.x - rings[i + 1].p.x, rings[i].p.z - rings[i + 1].p.z); mid[i] = clamp(mid[i], mid[i + 1] - d, mid[i + 1] + d); }
  const NL = Math.round(NFL * 0.325), colLat = (r, k, rv) => {
    const rw = r.rw ?? 7, side = k < NL ? -1 : 1, j = side < 0 ? NL - k : k - NL, nn = side < 0 ? NL : NFL - NL;
    const far = Math.max(r.a * 1.3 - side * rv, rw + 4), b0 = Math.max(rw - 3.5, 0.5), b1 = rw + 2.5;
    return rv + side * (j <= 4 ? b0 * j / 4 : j <= 8 ? b0 + (b1 - b0) * (j - 4) / 4 : b1 + (far - b1) * (j - 8) / (nn - 8));
  };
  for (let i = 0; i < n; i++) {
    if (i % 8 === 7) await pause();
    const r = rings[i], rx = -r.t[1], rz = r.t[0];
    for (let k = 0; k <= NFL; k++) {
      const lat = colLat(r, k, mid[i]), dl = Math.abs(lat - (r.river ?? 0));
      hv[0] = r.p.x + rx * lat; hv[1] = floorY(r, i, lat); hv[2] = r.p.z + rz * lat; hold(hv);
      const x = hv[0], y = hv[1], z = hv[2];
      P.push(x, y, z);
      // below a ledge the floor is thick ice over rock and no light comes up through it: the darkest ice of the hall
      const low = r.ledge ? 1 - 0.45 * smoothstep(r.ledge.edge - 1, r.ledge.edge + 5, lat) : 1;
      A.push((r.glow ?? 0) * 0.5 + 0.02 + 0.24 * noise.n2(x * 0.03 + 9, z * 0.03), (0.6 + 0.2 * noise.n2(x * 0.1, z * 0.1) + 0.2 * smoothstep(0, 14, dl)) * (r.ao ?? 1) * low, sunAt(r, x, z));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < NFL; k++) { const a = f0 + i * (NFL + 1) + k, b = a + NFL + 1; (i < split ? IA : I).push(a, b, b + 1, a, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry();
  await pause();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); geo.setIndex(IA.concat(I));
  geo.computeVertexNormals();
  await pause();
  geo.setIndex(I);
  const material = makeIceMaterial(look, { side: THREE.DoubleSide, dark: 0.0, halls: o.halls, ownFog: o.haze });      // o.haze: the caverns' own haze (colour, density)
  const mesh = new THREE.Mesh(geo, material); mesh.name = 'ice-cave';
  let front = null;
  if (IA.length) {
    const ga = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aIce']) ga.setAttribute(k, geo.getAttribute(k)); ga.setIndex(IA);
    front = new THREE.Mesh(ga, material); front.name = 'ice-cave-front';
  }
  const at = (i, k, out = new THREE.Vector3()) => { const q = (clamp(i, 0, n - 1) * (NS + 1) + ((k % NS) + NS) % NS) * 3; return out.set(pt[q], pt[q + 1], pt[q + 2]); };
  return { mesh, front, geometry: geo, at, segments: NS, rings, floorY: (i, lat) => floorY(rings[clamp(i, 0, n - 1)], i, lat) };
}

// a wall of ice with an arch in it (the far end of the caverns, seen from the sunless sea): f(i, j) -> { p: [x, y, z], hole, ice: [a, b, c] }
// (pause, if given, is awaited after every `every` lines of the sheet and before its normals: a long sheet is not one step of the build)
export async function iceSheetGeometry(nx, ny, f, pause = null, every = 40) {
  const P = [], A = [], I = [], H = [];
  for (let i = 0; i <= nx; i++) { if (pause && i % every === every - 1) await pause(); for (let j = 0; j <= ny; j++) { const q = f(i / nx, j / ny); P.push(q.p[0], q.p[1], q.p[2]); A.push(q.ice[0], q.ice[1], q.ice[2]); H.push(q.hole ? 1 : 0); } }
  if (pause) await pause();
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const a = i * (ny + 1) + j, b = a + ny + 1;
    if (H[a] + H[b] + H[a + 1] + H[b + 1] >= 3) continue;
    I.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the fountain: a thick column of foam forced up in pants, rocks vaulting in it
// Everything is thrown from the vent and worked out in the vertex shader from the shared clock. A pant leaves every `period`
// seconds, swelling and sinking; how strong it is comes from a seeded table, so no two are alike. Foam leaves all through a
// pant (the lower column never opens); the rocks leave at its strongest moment.
const GLSL_THROW = /* glsl */`
uniform float uTime, uH, uG, uPeriod, uLoud, uSeed, uCycle;
float rsPant(float t0){ float b = floor(t0 / uPeriod), f = fract(t0 / uPeriod), s = sin(3.14159265 * f); return uLoud * (0.5 + (0.22 + 0.33 * rsH1(b * 1.31 + uSeed)) * s * s); }
// a body thrown from the vent. o = (x, z at the vent, share of the height, lean), ph = its place in the cycle (0..1), dir = which way it leans
vec3 rsThrow(vec4 o, float ph, float dir, out vec3 vel, out float age, out float flight){
  float cyc = uCycle * uPeriod, t0 = (floor(uTime / cyc - ph) + ph) * cyc;
  age = uTime - t0;
  float v0 = sqrt(max(2.0 * uG * uH, 0.0)) * rsPant(t0) * o.z, hs = v0 * o.w;
  vec3 v = vec3(cos(dir) * hs, v0, sin(dir) * hs);
  flight = 2.0 * v0 / max(uG, 0.1);
  vel = v + vec3(0.0, -uG * age, 0.0);
  return vec3(o.x, 0.0, o.y) + v * age + vec3(0.0, -0.5 * uG * age * age, 0.0);
}
`;
const QUAD = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0];

// The fountain of the chasm. o: { rng, height, rocks, foam, mist, period, loud, bow, wind, girth, body, arc (seconds of a rock's flight its ribbon shows),
//   reach and fall (the farthest a rock and a body of water may land from the vent in still air, metres) }.
// Origin at the vent, +Y up.
export function makeRockFountain(look, o) {
  const rng = o.rng, sF = rng.fork('foam'), sK = rng.fork('rock'), sM = rng.fork('mist'), H = o.height ?? 66, G = 14, group = new THREE.Group(); group.name = 'rock-fountain';
  // H is the height a body reaches that is thrown whole (share 1) by a pant of strength 1. A pant's strength at its peak is `loud`
  // times 0.72 to 1.05 (rsPant), so the column's top stands (0.72 loud)^2 to (1.05 loud)^2 of H from pant to pant.
  // Every body is thrown once in a cycle of CYC pants: CYC is the least number of pants (five or more) that is longer than the longest
  // flight of anything thrown (a rock of share 1.12 by the strongest pant, and 0.3 s on the ground), so nothing is thrown again in flight.
  const sMax = (o.loud ?? 1) * 1.05, period = o.period ?? 1.9, CYC = Math.max(5, Math.ceil((2 * Math.sqrt(2 * H / G) * sMax * 1.12 + 0.3) / period));
  const U = { uH: { value: H }, uG: { value: G }, uPeriod: { value: period }, uLoud: { value: o.loud ?? 1 }, uSeed: { value: rng.range(0, 50) }, uCycle: { value: CYC } };
  // THE WATER: flung up as jets and falling back as rain. Every body of water is a streak laid along its own flight: 0.25 to 0.9 m across
  // times `body`, and as long as it flies in a sixth of a second (a jet leaving the vent at 40 m/s is 7 m long, at the crown it is a drop
  // a metre long). They leave the vent within `girth` metres of its middle.
  // Six in ten leave nearly upright and make the tight white core; the rest lean out and make the fan at the top and the veils and rain.
  // A body of share z and lean w thrown by a pant of strength S comes down 4 H S^2 z^2 w from where it left: every lean is cut so that
  // even the strongest pant's water comes down within `fall` (30 m) of the vent in still air. A falling streak is then carried down
  // the wind (the finer, the farther: at the most 1.7 times the wind's speed for the time it falls).
  // (`foam` bodies are in the air of a cycle of five pants: a longer cycle is given as many more, so the column is as thick)
  const nF = Math.round((o.foam ?? 520) * CYC / 5), fg = new THREE.InstancedBufferGeometry(), GIRTH = o.girth ?? 2.6, BODY = o.body ?? 1;
  fg.setAttribute('position', new THREE.Float32BufferAttribute(QUAD, 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  const fO = new Float32Array(nF * 4), fA = new Float32Array(nF * 4);
  for (let i = 0; i < nF; i++) {
    const a = sF.range(0, TAU), r = GIRTH * Math.sqrt(sF()), core = sF.chance(0.6);
    const z = core ? sF.range(0.8, 1.0) : sF.range(0.45, 0.92), w = core ? sF.range(0.004, 0.03) : sF.range(0.02, 0.075);
    fO.set([Math.cos(a) * r, Math.sin(a) * r, z, Math.min(w, (o.fall ?? 30) / (4 * H * sMax * sMax * z * z))], i * 4);
    fA.set([sF(), sF.range(0, TAU), BODY * (core ? sF.range(0.45, 0.9) : sF.range(0.25, 0.7)), sF()], i * 4);
  }
  fg.setAttribute('aO', new THREE.InstancedBufferAttribute(fO, 4)); fg.setAttribute('aA', new THREE.InstancedBufferAttribute(fA, 4)); fg.instanceCount = nF;
  const foamMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsLib.fog, ...look, ...U, uFWind: { value: new THREE.Vector2(o.wind ? o.wind[0] : 1.6, o.wind ? o.wind[1] : -0.7) } },
    vertexShader: /* glsl */`
      ${GLSL_N3}
      ${GLSL_THROW}
      attribute vec4 aO; attribute vec4 aA; uniform vec3 uSunDir; uniform vec2 uFWind;
      varying vec2 vQ; varying float vSeed, vFall, vA; varying vec3 vSunV, vColN;
      #include <fog_pars_vertex>
      void main(){
        vec3 vel; float age, flight; vec3 c = rsThrow(aO, aA.x, aA.y, vel, age, flight);
        float life = clamp(age / max(flight, 0.1), 0.0, 1.2), alive = step(age, flight * 1.02);
        // past the crown the water breaks: it spreads, thins, and goes down the wind
        float fall = smoothstep(0.42, 0.7, life), fine = clamp(1.0 - aA.z / ${BODY.toFixed(2)}, 0.0, 1.0), drift = fall * fall * age * (0.5 + 1.6 * fine);
        c.xz += uFWind * drift; vel.xz += uFWind * fall * (0.5 + 1.6 * fine);
        c.y = max(c.y, 0.2);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        vec3 vv = (modelViewMatrix * vec4(vel, 0.0)).xyz; vec2 ax = normalize(vv.xy + vec2(1e-4, 1e-3));
        float len = aA.z * 1.4 + length(vel) / 6.0, wid = aA.z * (1.0 + 0.9 * fall) * alive;
        mvPosition.xy += ax * position.y * len * alive + vec2(ax.y, -ax.x) * position.x * wid;
        vQ = position.xy * 2.0; vSeed = aA.w; vFall = fall;
        vA = alive * smoothstep(0.0, 0.03, life) * (1.0 - 0.55 * fall) * (1.0 - smoothstep(0.93, 1.02, life));
        vSunV = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
        // which way the column's own side faces here (outward from its axis, a little up)
        vColN = normalize((modelViewMatrix * vec4(normalize(vec3(c.x, 0.6, c.z) + vec3(1e-3, 0.0, 0.0)), 0.0)).xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSkyCol, uHorizonCol; uniform float uTime; varying vec2 vQ; varying float vSeed, vFall, vA; varying vec3 vSunV, vColN;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      void main(){
        // a streak: dense along its middle, torn at its sides and its ends
        float brk = rsN(vec3(vQ * vec2(2.2, 4.0 + 4.0 * vFall) + vSeed * 17.0, vSeed * 9.0 + uTime * 0.9));
        float a = (1.0 - vQ.x * vQ.x) * smoothstep(1.0, 0.45, abs(vQ.y)) * (0.62 + 0.9 * brk) * vA;
        if (a < 0.03) discard;
        // lit as a part of the column: one sunny side, one side in the sky's shade
        vec3 n = normalize(mix(vec3(vQ.x * 0.8, 0.0, 0.7), normalize(vColN), 0.6));
        float lit = smoothstep(-0.35, 0.65, dot(n, vSunV));
        vec3 sunny = min(uSunCol * 0.34 + uSkyCol * 0.32, vec3(0.98));
        vec3 shade = max(vec3(0.5, 0.6, 0.78) * (uSkyCol * 0.85 + uHorizonCol * 0.25), sunny * 0.42);
        vec3 col = mix(shade, sunny, lit) * (0.9 + 0.2 * brk);
        // with the sun behind the column its light comes through the water: the streaks' thin edges and the falling veils glow
        float back = clamp(-vSunV.z, 0.0, 1.0), thin = clamp(abs(vQ.x) * 0.7 + 0.5 * vFall + 0.25, 0.0, 1.0);
        col = mix(col, min(uSunCol * 0.5 + uSkyCol * 0.22, vec3(0.99)), 0.75 * back * thin);
        gl_FragColor = vec4(min(col, vec3(0.99)), min(a, 0.9));
        #include <fog_fragment>
      }`,
  });
  const foam = new THREE.Mesh(fg, foamMat); foam.frustumCulled = false; foam.renderOrder = 3; foam.name = 'foam'; group.add(foam);
  // FRAGMENTS: dark wet rock, few and large (1.2 to 2.0 m in radius, one in three 2.0 to 2.6 m), each on its own arc, and each DRAWS
  // that arc behind it: a ribbon of spray lying along the last second and a half of its own flight (below), so that a rock is seen
  // to be flung even where nothing is seen to move. Each is thrown a little higher than the water and leans so little that it comes
  // down inside the pool: a rock thrown to height h with strength S and lean w lands 4 h S^2 w from where it left, so the lean of
  // every rock is cut to keep even the loudest pant's throw inside `reach`.
  const nR = o.rocks ?? 12, base = T.rockGeometry({ rng: sK, kind: 'rock', radius: 1, detail: 1, color: '#3a3430', colorB: '#191614' });
  const rg = new THREE.InstancedBufferGeometry(); rg.setAttribute('position', base.getAttribute('position')); rg.setAttribute('normal', base.getAttribute('normal')); rg.setAttribute('color', base.getAttribute('color'));
  if (base.index) rg.setIndex(base.index);
  const rO = new Float32Array(nR * 4), rA = new Float32Array(nR * 4), reach = o.reach ?? 18;
  let rockMax = 0;
  for (let i = 0; i < nR; i++) {
    const ox = sK.range(-2, 2), oz = sK.range(-2, 2), z = sK.range(0.8, 1.12), w = sK.range(0.045, 0.09), rad = sK.chance(0.66) ? sK.range(1.2, 2.0) : sK.range(2.0, 2.6);
    rO.set([ox, oz, z, Math.min(w, Math.max(0, reach - 3) / (4 * H * sMax * sMax * z * z))], i * 4);
    rA.set([((i % CYC) + 0.5) / CYC, sK.range(0, TAU), rad, sK.range(0, TAU)], i * 4);
    rockMax = Math.max(rockMax, rad);
  }
  rg.setAttribute('aO', new THREE.InstancedBufferAttribute(rO, 4)); rg.setAttribute('aA', new THREE.InstancedBufferAttribute(rA, 4)); rg.instanceCount = nR;
  const rockMat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...THREE.UniformsLib.fog, ...look, ...U },
    vertexShader: /* glsl */`
      ${GLSL_N3}
      ${GLSL_THROW}
      attribute vec4 aO; attribute vec4 aA; attribute vec3 color; varying vec3 vN, vC, vV;
      #include <fog_pars_vertex>
      vec3 rsRot(vec3 p, vec3 ax, float a){ float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1.0 - c); }
      void main(){
        vec3 vel; float age, flight; vec3 c = rsThrow(aO, aA.x, aA.y, vel, age, flight);
        float alive = step(age, flight + 0.3);
        vec3 ax = normalize(vec3(cos(aA.w), 0.4, sin(aA.w))); float ang = aA.w * 7.0 + uTime * (0.5 + fract(aA.w * 3.7) * 1.1);
        vec3 p = c + rsRot(position * aA.z * alive, ax, ang);
        vN = normalize(mat3(modelMatrix) * rsRot(normal, ax, ang)); vC = color;
        vec4 w = modelMatrix * vec4(p, 1.0); vV = cameraPosition - w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; varying vec3 vN, vC, vV;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), v = normalize(vV), h = normalize(v + uSunDir);
        // a wet rock: a lit face, a dark face, a glint and a rim of sky light
        vec3 col = vC * (uSunCol * 0.6 * max(dot(n, uSunDir), 0.0) + mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5) * 0.8);
        col += uSunCol * 0.35 * pow(max(dot(n, h), 0.0), 30.0) + uSkyCol * 0.25 * pow(clamp(1.0 - max(dot(n, v), 0.0), 0.0, 1.0), 3.0);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const rocks = new THREE.Mesh(rg, rockMat); rocks.frustumCulled = false; rocks.name = 'rocks'; group.add(rocks);
  // each fragment's ARC: the spray torn from it, a ribbon along the path it has flown in the last `arc` seconds (1.5): every place of
  // the ribbon is where the rock itself was so long ago (the same throw worked for an earlier moment), so the ribbon bends as the
  // flight bends and is longest where the rock is fastest. It is as broad as the rock at the rock and half as broad again at its
  // end, where it has thinned to nothing.
  const TSEG = 14, ARC = o.arc ?? 1.5, tp = [], ti = [];
  for (let j = 0; j <= TSEG; j++) tp.push(-0.5, j / TSEG, 0, 0.5, j / TSEG, 0);
  for (let j = 0; j < TSEG; j++) { const q = j * 2; ti.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  const tg = new THREE.InstancedBufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setIndex(ti);
  tg.setAttribute('aO', rg.getAttribute('aO')); tg.setAttribute('aA', rg.getAttribute('aA')); tg.instanceCount = nR;
  const tailMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsLib.fog, ...look, ...U, uArc: { value: ARC } },
    vertexShader: /* glsl */`
      ${GLSL_N3}
      ${GLSL_THROW}
      uniform float uArc; attribute vec4 aO; attribute vec4 aA; varying vec2 vQ; varying float vA, vSeed;
      #include <fog_pars_vertex>
      void main(){
        vec3 vel; float age, flight; rsThrow(aO, aA.x, aA.y, vel, age, flight);
        float alive = step(age, flight + 0.3);
        // the same throw, so many seconds earlier (never before it left the vent)
        float back = min(position.y * uArc, age), a2 = age - back;
        vec3 v0 = vel + vec3(0.0, uG * age, 0.0), c = vec3(aO.x, 0.0, aO.y) + v0 * a2 + vec3(0.0, -0.5 * uG * a2 * a2, 0.0), v2 = v0 + vec3(0.0, -uG * a2, 0.0);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        vec3 vv = (modelViewMatrix * vec4(v2, 0.0)).xyz; vec2 ax = normalize(vv.xy + vec2(1e-4, 1e-3));
        mvPosition.xy += vec2(ax.y, -ax.x) * position.x * aA.z * (1.9 + 1.2 * position.y) * alive;
        vQ = vec2(position.x * 2.0, position.y); vA = alive * smoothstep(0.0, 0.3, age) * step(position.y * uArc, age + 0.05); vSeed = aA.w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSkyCol, uHorizonCol; uniform float uTime; varying vec2 vQ; varying float vA, vSeed;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      void main(){
        float brk = rsN(vec3(vQ.x * 2.2 + vSeed * 9.0, vQ.y * 9.0 + uTime * 1.5, vSeed * 5.0)), fine = rsN(vec3(vQ.x * 6.0 + vSeed, vQ.y * 30.0 + uTime * 2.5, 2.0));
        float a = (1.0 - vQ.x * vQ.x) * pow(1.0 - vQ.y, 1.25) * smoothstep(0.0, 0.03, vQ.y) * (0.35 + 0.75 * brk + 0.3 * fine) * 0.8 * vA;
        if (a < 0.02) discard;
        gl_FragColor = vec4(min(uSunCol * 0.24 + uSkyCol * 0.42 + uHorizonCol * 0.2, vec3(0.96)) * (0.85 + 0.2 * fine), min(a, 0.85));
        #include <fog_fragment>
      }`,
  });
  const tails = new THREE.Mesh(tg, tailMat); tails.frustumCulled = false; tails.renderOrder = 3; tails.name = 'rock-tails'; group.add(tails);
  // spray: mist that rolls at the foot and drifts downwind, thinner billows that leave the crown; where the sun stands behind
  // the eye the spray itself takes the colours of the bow, wide and faint
  const nM = o.mist ?? 90, mg = new THREE.InstancedBufferGeometry();
  mg.setAttribute('position', new THREE.Float32BufferAttribute(QUAD, 3)); mg.setIndex([0, 1, 2, 0, 2, 3]);
  const mO = new Float32Array(nM * 4), mA = new Float32Array(nM * 4);
  for (let i = 0; i < nM; i++) {
    // four kinds: mist rolling low at the column's foot (0), billows leaving the crown (1), veils of spray falling from the crown (2: taller
    // than wide), and the mist that lies over the pool (3: wide and low, 8 to 40 m from the vent, 1 to 6 m over the water)
    const kind = i % 5 === 1 ? 3 : i % 3 === 2 ? 2 : i % 4 === 0 ? 1 : 0, low = kind === 0, a = sM.range(0, TAU), r = kind === 3 ? sM.range(8, 40) : low ? sM.range(3, 12) : kind === 2 ? sM.range(2, 9) : sM.range(0, 8);
    mO.set([Math.cos(a) * r, kind === 3 ? sM.range(1, 6) : low ? sM.range(1, 12) : kind === 2 ? sM.range(H * 0.55, H * 0.95) : sM.range(H * 0.3, H * 0.95), Math.sin(a) * r, kind === 3 ? sM.range(18, 30) : low ? sM.range(10, 18) : kind === 2 ? sM.range(9, 15) : sM.range(12, 22)], i * 4);
    mA.set([sM.range(0, 1), sM.range(0, TAU), kind, sM.range(0.6, 1.4)], i * 4);
  }
  mg.setAttribute('aO', new THREE.InstancedBufferAttribute(mO, 4)); mg.setAttribute('aA', new THREE.InstancedBufferAttribute(mA, 4)); mg.instanceCount = nM;
  const mistMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsLib.fog, ...look, uBow: { value: o.bow ?? 0.35 }, uWind: { value: new THREE.Vector3(o.wind ? o.wind[0] : 1.6, 0.5, o.wind ? o.wind[1] : -0.7) }, uOpacity: { value: o.mistOpacity ?? 0.13 } },
    vertexShader: /* glsl */`
      attribute vec4 aO; attribute vec4 aA; uniform float uTime; uniform vec3 uWind; varying vec2 vQ; varying vec3 vW; varying float vA, vS;
      #include <fog_pars_vertex>
      void main(){
        float life = fract(uTime / (9.0 * aA.w) + aA.x), age = life * 9.0 * aA.w;
        float lie = step(2.5, aA.z), veil = step(1.5, aA.z) * (1.0 - lie), bil = step(0.5, aA.z) * (1.0 - veil) * (1.0 - lie);
        vec3 c = aO.xyz + uWind * vec3(1.0, 1.0 - lie, 1.0) * age * mix(1.0, 1.5, bil) * (1.0 - 0.6 * veil) * (1.0 - 0.65 * lie) + vec3(0.0, bil * 1.6 * age - veil * min(5.0 * age, aO.y - 4.0), 0.0);
        float sz = aO.w * (0.55 + 0.9 * life);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        mvPosition.xy += position.xy * sz * vec2(1.0, 1.0 + 1.6 * veil - 0.6 * lie);
        vW = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;
        vQ = position.xy * 2.0; vA = smoothstep(0.0, 0.18, life) * smoothstep(1.0, 0.5, life) * (1.0 + 0.8 * veil); vS = aA.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizonCol; uniform float uBow, uOpacity, uTime; varying vec2 vQ; varying vec3 vW; varying float vA, vS;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      void main(){
        float r2 = dot(vQ, vQ);
        float nz = rsN(vec3(vQ * 1.6 + vS * 7.0, uTime * 0.12 + vS));
        float a = clamp(1.0 - r2, 0.0, 1.0); a = a * a * (0.45 + 0.75 * nz) * uOpacity * vA;
        if (a < 0.003) discard;
        vec3 col = vec3(0.94, 0.97, 1.0) * min(uSunCol * 0.2 + uSkyCol * 0.45 + uHorizonCol * 0.22, vec3(0.95)) * (0.7 + 0.3 * nz);
        vec3 dir = normalize(vW - cameraPosition);
        float ang = degrees(acos(clamp(dot(dir, -uSunDir), -1.0, 1.0)));
        float t = clamp((ang - 37.0) / 7.0, 0.0, 1.0), win = smoothstep(0.0, 0.45, t) * smoothstep(1.0, 0.55, t);
        vec3 spec = clamp(vec3(smoothstep(0.3, 0.9, t), 1.0 - abs(t - 0.5) * 2.2, smoothstep(0.7, 0.1, t)), 0.0, 1.0);
        vec3 bowCol = mix(vec3(0.75), spec, 0.7) * uSunCol / max(max(uSunCol.r, max(uSunCol.g, uSunCol.b)), 1e-3);
        col = mix(col, bowCol, win * clamp(uBow, 0.0, 0.6) * step(0.0, uSunDir.y));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mist = new THREE.Mesh(mg, mistMat); mist.frustumCulled = false; mist.renderOrder = 4; mist.name = 'spray'; group.add(mist);
  return { object: group, loud: U.uLoud, bow: mistMat.uniforms.uBow, rocks, mist, rockMax };
}

// ---------------------------------------------------------------- incense: a burner, and the thread of smoke that rises from it
// A BURNER: a stone pedestal with a broad gold bowl on it, 4.2 m tall at k = 1 (the bowl 3.4 m across), embers in the bowl.
// Added to a makeGeo accumulator of the dome's material; returns where its smoke begins.
export const BURNER_H = 4.2;
export function burnerInto(g, x, y, z, k = 1) {
  const P = (list) => list.map(([r, h]) => [r * k, y + h * k]);
  g.set(3, lin('#cfc3a8')).lathe(x, z, P([[1.5, -0.6], [1.5, 0.35], [1.15, 0.6], [0.62, 0.95], [0.5, 2.5], [0.8, 2.85]]), 10);
  g.set(1, [1, 1, 1]).lathe(x, z, P([[0.45, 2.8], [1.25, 3.2], [1.7, 3.85], [1.72, 4.2], [1.55, 4.2], [1.4, 3.9]]), 14);
  g.set(1, [2.4, 0.9, 0.35]).lathe(x, z, P([[1.4, 3.9], [0.7, 4.02], [0.02, 4.08]]), 10);
  return [x, y + 4.05 * k, z];
}
// THE SMOKE of a burner: one thin thread from the bowl, a hand's breadth at its foot and widening as it rises (3 m at its top),
// leaning down the wind more the higher it is, in slow bends, thick and pale at the bowl and thinned away to nothing at its top.
// points: [[x, y, z, height]] (where each thread begins)
export function makeIncense(look, points, o = {}) {
  const n = points.length, geo = new THREE.InstancedBufferGeometry(), SEG = 18, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; pos.push(-0.5, t, 0, 0.5, t, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const aO = new Float32Array(n * 4), aS = new Float32Array(n);
  points.forEach((p, i) => { aO.set([p[0], p[1], p[2], p[3]], i * 4); aS[i] = (i * 0.6180339) % 1; });
  geo.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 1)); geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsLib.fog, ...look, uColor: { value: C(o.color ?? '#fff3d6') }, uOpacity: { value: o.opacity ?? 0.5 }, uWind: { value: new THREE.Vector2(o.wind ? o.wind[0] : 0.7, o.wind ? o.wind[1] : 0.4) } },
    vertexShader: /* glsl */`
      attribute vec4 aO; attribute float aS; uniform float uTime; uniform vec2 uWind; varying vec2 vQ; varying float vS;
      #include <fog_pars_vertex>
      void main(){
        float t = position.y, h = aO.w;
        vec3 c = aO.xyz + vec3(0.0, t * h, 0.0);
        c.xz += uWind * (t * t * h * 0.45) + vec2(sin(t * 5.0 - uTime * 0.55 + aS * 40.0), cos(t * 4.1 - uTime * 0.4 + aS * 23.0)) * (0.15 + t * 1.6) * t;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        mvPosition.x += position.x * (0.35 + 2.7 * pow(t, 1.4));
        vQ = vec2(position.x * 2.0, t); vS = aS;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSkyCol, uColor; uniform float uOpacity, uTime; varying vec2 vQ; varying float vS;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      void main(){
        float n1 = rsN(vec3(vQ.x * 1.2 + vS * 9.0, vQ.y * 5.0 - uTime * 0.3, vS * 5.0));
        float n2 = rsN(vec3(vQ.x * 2.6 + n1 * 1.5, vQ.y * 11.0 - uTime * 0.55, vS * 3.0 + 4.0));
        float body = clamp(1.0 - vQ.x * vQ.x, 0.0, 1.0), strand = smoothstep(0.25 * vQ.y, 0.35 + 0.45 * vQ.y, n1 * 0.6 + n2 * 0.5);
        float a = body * body * smoothstep(0.0, 0.03, vQ.y) * pow(clamp(1.0 - vQ.y, 0.0, 1.0), 1.3) * mix(1.0, strand, smoothstep(0.05, 0.4, vQ.y)) * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor * (uSunCol * 0.22 + uSkyCol * 0.5), a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; mesh.name = 'incense';
  return mesh;
}

// half width of the water in front of the cliff, z metres out from it (hero frame): a wide pool narrowing to the river. At the cliff it
// is 116 m broad (the ice of the mouth, 105 m, and a shore of 5 m to each side); it narrows to the river's 34 m over POOL_LEN, a length
// equal to that breadth (120 m in round numbers): the pool is as long as it is broad.
export const POOL_LEN = 120;
export const poolHalf = (z) => lerp(58, 17, smoothstep(6, POOL_LEN, z));

// a ribbon of water along a curve: aW = (across -1..1, metres along, half width in metres), aSide = level unit vector across it
export function ribbonGeometry(curve, segments, across, widthAt, lift = 0) {
  const P = [], W = [], S = [], I = [], p = new THREE.Vector3(), t = new THREE.Vector3(), len = curve.getLength();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments; curve.getPointAt(u, p); curve.getTangentAt(u, t);
    const l = Math.hypot(t.x, t.z) || 1, sx = -t.z / l, sz = t.x / l, hw = widthAt(u, p) * 0.5;
    for (let j = 0; j <= across; j++) { const a = j / across * 2 - 1; P.push(p.x + sx * hw * a, p.y + lift, p.z + sz * hw * a); W.push(a, u * len, hw); S.push(sx, 0, sz); }
    if (i < segments) for (let j = 0; j < across; j++) { const a0 = i * (across + 1) + j, b0 = a0 + across + 1; I.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 3)); g.setIndex(I);
  return g;
}

// The water of the gardens: a mirror broken by fine ripples. Each point follows its mirrored ray: to the sky, to the trees of the
// bank on that side (so the banks stand dark in the water and the sky lies between them), and, near the cliff, to the dome's
// shell, the balcony and the blue ice under it; edges of those are soft and the ripples break them. A pale line marks the current.
// U: { uBalc, uFace, uRise, uPattern } from the hero (omit them and the water shows sky and banks only). o.length, o.end: the ribbon's length and [from, to, within, beyond]: it fades out between from and to metres before its end, in full within, not at all beyond, so many metres of its middle.
export function makeWaterMaterial(look, U = {}, o = {}) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsLib.fog, ...look, uBalc: U.uBalc || { value: new THREE.Vector4(0, -1e5, 0, 1) }, uFace: U.uFace || { value: new THREE.Vector4(0, 0, 1, -1e6) },
      uRise: U.uRise || { value: 17 }, uPattern: U.uPattern || { value: 0 }, uGold: { value: C('#f5c344') }, uLapis: { value: C('#2146a8') },
      uDeep: { value: C(o.deep || '#0c4a52') }, uShallow: { value: C(o.shallow || '#a6ab8d') }, uRif: { value: [0, 1, 2, 3].map((i) => new THREE.Vector3(o.riffles && o.riffles[i] ? o.riffles[i][0] : 0, o.riffles && o.riffles[i] ? o.riffles[i][1] : 0, o.riffles && o.riffles[i] ? 1 : 0)) }, uShelf: { value: new THREE.Vector4(...(o.shelf || [1.7, 0.9, 4.5, 2.1])) }, uStill: { value: new THREE.Vector2(...(o.still || [-2e6, -1e6])) }, uBank: { value: C(o.bank || '#28583a') }, uTree: { value: o.tree ?? 13 }, uFlow: { value: o.flow ?? 1 }, uLen: { value: o.length ?? 1e9 }, uBloom: { value: C(o.bloom ? o.bloom[0] : '#28583a') }, uBloomL: { value: C(o.bloom ? o.bloom[1] : '#ffffff') }, uBloomK: { value: o.bloom ? 1 : 0 }, uEnd: { value: new THREE.Vector4(...(o.end || [12, 0, 1e6, 2e6])) } },
    vertexShader: /* glsl */`
      attribute vec3 aW; attribute vec3 aSide; varying vec3 vW, vA, vSide;
      #include <fog_pars_vertex>
      void main(){
        vA = aW; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vSide = normalize(mat3(modelMatrix) * aSide);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizonCol, uGold, uLapis, uIceGlow, uIceDeep, uDeep, uShallow, uBank; uniform vec4 uDome, uBalc, uFace;
      uniform float uTime, uRise, uPattern, uIceGain, uTree, uFlow, uLen, uBloomK; uniform vec3 uBloom, uBloomL; uniform vec4 uEnd, uShelf; uniform vec2 uStill; uniform vec3 uRif[4];
      varying vec3 vW, vA, vSide;
      #include <fog_pars_fragment>
      ${GLSL_N3}
      ${GLSL_TILES}
      void main(){
        float hw = max(vA.z, 0.5), a = vA.x, bd = (1.0 - abs(a)) * hw;
        vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
        float lod = clamp(1.0 - dist / 260.0, 0.0, 1.0);
        vec2 q = vec2(a * hw, vA.y);
        // THE RIPPLES are as long across the river as along it, or nearly (none longer than 1.5 times its breadth): swells of 3.3 by 5 m,
        // ripples of 1 by 1.4 m, and near the eye wavelets of 0.4 by 0.5 m and of 0.17 by 0.2 m; all go down with the current
        vec2 f1 = q * vec2(0.3, 0.2) + vec2(0.0, -uTime * 0.53 * uFlow), f2 = q * vec2(0.95, 0.7) + vec2(uTime * 0.1, -uTime * 1.09 * uFlow);
        vec2 s1 = vec2(rsN(vec3(f1, uTime * 0.2)), rsN(vec3(f1 + 17.3, uTime * 0.2))) - 0.5;
        vec2 s2 = vec2(rsN(vec3(f2, uTime * 0.45)), rsN(vec3(f2 + 9.1, uTime * 0.45))) - 0.5;
        float near = clamp(1.0 - dist / 70.0, 0.0, 1.0);
        vec2 f3 = q * vec2(2.6, 2.0) + vec2(-uTime * 0.25, -uTime * 2.46 * uFlow);
        vec2 s3 = vec2(rsN(vec3(f3, uTime * 0.8)), rsN(vec3(f3 + 5.7, uTime * 0.8))) - 0.5;
        float nearer = clamp(1.0 - dist / 34.0, 0.0, 1.0);
        vec2 f4 = q * vec2(6.0, 5.0) + vec2(uTime * 0.4, -uTime * 6.0 * uFlow);
        vec2 s4 = nearer > 0.0 ? vec2(rsN(vec3(f4, uTime * 1.1)), rsN(vec3(f4 + 3.3, uTime * 1.1))) - 0.5 : vec2(0.0);
        // R118: the garden's water is still near the cliff (so many metres out from its face): its ripples 0.15 of the river's
        float still = 1.0 - smoothstep(uStill.x, uStill.y, dot(vW, uFace.xyz) - uFace.w);
        // R121': a riffle lies within 9 m of each crossing between two bends, gone by 15 m
        float rif = 0.0; for (int i = 0; i < 4; i++) rif = max(rif, uRif[i].z * (1.0 - smoothstep(9.0, 15.0, distance(vW.xz, uRif[i].xy))));
        vec2 slope = (s1 * 0.085 * (0.4 + 0.6 * lod) + s2 * 0.09 * lod * lod + s3 * 0.1 * near * near + s4 * 0.08 * nearer) * mix(1.0, 0.15, still) * (1.0 + rif);
        vec3 side = normalize(vSide), T = normalize(cross(side, vec3(0.0, 1.0, 0.0)));
        // R432: slow rings on the still water: one place to a 26 m cell of the pool, each on its own period of 7 to 12 s; a ring runs out
        // at 0.9 m a second and is spent by 10 m
        vec2 ringG = vec2(0.0);
        if (still > 0.01) {
          vec2 cb = floor(vW.xz / 26.0 - 0.5);
          for (int i = 0; i < 4; i++) {
            vec2 id = cb + vec2(mod(float(i), 2.0), floor(float(i) / 2.0)); float h = rsH1(id.x * 12.7 + id.y * 71.3), h2 = rsH1(id.x * 31.1 + id.y * 5.9 + 3.0);
            vec2 c = (id + 0.25 + 0.5 * vec2(h, h2)) * 26.0, dv = vW.xz - c; float per = 7.0 + 5.0 * h2, t = fract(uTime / per + h), d = length(dv), x = d - t * per * 0.9;
            ringG += dv / max(d, 0.05) * sin(x * 2.6) * exp(-x * x / 1.4) * (1.0 - t) * smoothstep(0.0, 0.08, t);
          }
          ringG *= 0.09 * still;
        }
        vec3 N = normalize(vec3(0.0, 1.0, 0.0) - side * slope.x - T * slope.y - vec3(ringG.x, 0.0, ringG.y));
        float ndv = max(dot(N, V), 0.0);
        vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.015; R = normalize(R);
        float F = 0.08 + 0.92 * pow(clamp(1.0 - ndv, 0.0, 1.0), 3.5);
        vec3 refl = mix(uHorizonCol, uSkyCol, smoothstep(0.0, 0.5, R.y));
        // R432: the sky's clouds lie in the still water as soft shapes
        if (still > 0.01) refl = mix(refl, uHorizonCol * 0.75 + uSunCol * 0.14, 0.7 * still * smoothstep(0.5, 0.72, rsF(vec3(R.xz / max(R.y, 0.12) * 0.9 + 3.0, 7.0))));
        // the bank on the side the mirrored ray leaves by: its trees stand dark in the water
        float cr = dot(R.xz, side.xz), sg = cr >= 0.0 ? 1.0 : -1.0;
        float run = hw * (1.0 - a * sg) / max(abs(cr), 0.06);
        float th = uTree * (0.45 + 0.9 * rsN(vec3(vA.y * 0.045 + sg * 7.0, sg * 3.0, 1.0)));
        // R432: by the pool the banks' trees are the groves: their blossom stands in the water in clumps among the dark of the cedars
        float bloomK = uBloomK * still * smoothstep(0.4, 0.58, rsN(vec3(vA.y * 0.09 + sg * 3.0, sg * 5.0, 2.0)));
        refl = mix(refl, mix(uBank * (uSkyCol * 0.6 + uSunCol * 0.1), uBloom * (uSkyCol * 0.7 + uSunCol * 0.2), bloomK), 0.92 * smoothstep(th, th * 0.55, R.y * run));
        if (distance(vW.xz, uBalc.xz) < 520.0) {
          float hit = 0.0; vec3 rc = vec3(0.0);
          // what stands (the cliff, the balcony, the dome) is mirrored through gentler ripples, so its image holds together
          vec3 N2 = normalize(vec3(0.0, 1.0, 0.0) - (side * slope.x + T * slope.y) * 0.35 - vec3(ringG.x, 0.0, ringG.y));
          vec3 R = reflect(-V, N2); R.y = abs(R.y) + 0.015; R = normalize(R);
          // the cliff and the gate built against it
          float tf = (uFace.w - dot(vW, uFace.xyz)) / max(dot(R, uFace.xyz), 1e-4), yf = vW.y + R.y * tf;
          if (tf > 0.0 && yf < uBalc.y - 3.0) {
            // dark rock; the terraces' pale walls 46 to 118 m aside, 23 to 39 m up, cypresses before the upper two
            vec3 hp = vW + R * tf; float xl = abs(dot(hp.xz - uBalc.xz, vec2(uFace.z, -uFace.x)));
            float tk = smoothstep(46.0, 58.0, xl) * (1.0 - smoothstep(96.0, 118.0, xl)) * smoothstep(22.0, 23.5, yf) * (1.0 - smoothstep(38.5, 40.0, yf));
            // the water gate: its stone from the water up, as far as the towers 49 m aside; the arch is dark within and its ice glows there
            float mth = 1.0 - smoothstep(0.85, 1.0, length(vec2(xl / 17.5, max(yf + 2.0, 0.0) / 27.0))), icy = mth;
            float drum = 1.0 - smoothstep(53.0, 56.0, xl); tk = max(tk, drum);
            float cyp = step(28.0, yf) * smoothstep(0.35, 0.6, rsN(vec3(xl * 0.3, 2.0, 5.0))) * (1.0 - drum);
            vec3 rockC = vec3(0.045, 0.05, 0.055) * (uSunCol * 0.1 + uSkyCol * 0.5);
            vec3 wallC = mix(vec3(0.62, 0.58, 0.5), vec3(0.03, 0.09, 0.05), 0.8 * cyp) * (uSunCol * 0.12 + uSkyCol * 0.7);
            rc = mix(mix(rockC, wallC, tk), mix(uIceDeep, uIceGlow, 0.35 + 0.4 * rsN(vec3(vW.xz * 0.06, yf * 0.2))) * uIceGain * 0.9 * (1.0 - 0.7 * mth), icy);
            hit = mix(mix(0.75, 0.9, tk), 0.9, icy) * smoothstep(0.0, 3.0, uBalc.y - 3.0 - yf);
          }
          // the balcony's rim
          vec2 ob = vW.xz - uBalc.xz; float ba = dot(R.xz, R.xz), bb = dot(ob, R.xz), bc = dot(ob, ob) - uBalc.w * uBalc.w, bq = bb * bb - ba * bc;
          if (bq > 0.0) {
            float t = (-bb - sqrt(bq)) / max(ba, 1e-6), y = vW.y + R.y * t;
            float rim = step(0.0, t) * smoothstep(uBalc.y - 4.4, uBalc.y - 2.6, y) * smoothstep(uBalc.y + 2.4, uBalc.y + 0.6, y);
            rc = mix(rc, vec3(0.62, 0.58, 0.5) * (uSunCol * 0.12 + uSkyCol * 0.7), rim); hit = max(hit, rim * 0.9);
          }
          // the shell
          vec3 oc = vW - uDome.xyz, sc = vec3(1.0 / uDome.w, 1.0 / uRise, 1.0 / uDome.w);
          vec3 o2 = oc * sc, d2 = R * sc; float qa = dot(d2, d2), qb = dot(o2, d2), qc = dot(o2, o2) - 1.0, disc = qb * qb - qa * qc;
          if (disc > 0.0) {
            float t = (-qb - sqrt(disc)) / max(qa, 1e-6); vec3 h = oc + R * t;
            if (t > 0.0 && h.y > 0.0) {
              float th2 = atan(h.z, abs(h.x) < 1e-4 ? 1e-4 : h.x) / 6.2831853 + 0.5, hv = clamp(h.y / uRise, 0.0, 1.0);
              vec3 n = normalize(h * sc * sc);
              vec3 lightS = uSunCol * max(dot(n, uSunDir), 0.0) + mix(uHorizonCol, uSkyCol, n.y * 0.5 + 0.5);
              vec3 shell = mix(uGold * (0.4 * lightS + mix(uHorizonCol, uSkyCol, 0.5)), uLapis * lightS, rsLapis(th2, asin(hv) / 1.5708, uPattern));
              // (disc / qa = 1 - the square of the ray's nearest pass to the axis, in shell radii: the edge is soft over the outer 8% of the shell's breadth, at any distance)
              float soft = smoothstep(0.0, 0.15, disc / max(qa, 1e-6)) * smoothstep(0.0, 2.5, h.y);
              rc = mix(rc, shell, soft); hit = max(hit, soft);
            }
          }
          refl = mix(refl, rc, hit);
        }
        vec3 amb = uSkyCol * 0.55 + uHorizonCol * 0.25;
        // R119, R120: how deep the water is, from how far inside the ribbon's edge this point lies (uShelf: the edge's inset, the shelf's depth
        // and breadth, the drop beyond it). The bed shows through by exp(-depth / 0.8); the water's own colour grows by 1 - exp(-depth / 1.2)
        float e = uShelf.x - bd;
        float depth = uShelf.y * (1.0 - smoothstep(-uShelf.z, 0.0, e)) + uShelf.w * (1.0 - smoothstep(-uShelf.z - 3.5, -uShelf.z, e));
        depth = mix(depth, min(depth, 0.35), rif);
        float clear = exp(-depth / 0.8), cover = smoothstep(0.0, 0.12, depth);
        vec3 body = mix(uShallow, uDeep, 1.0 - exp(-depth / 1.2)) * (amb + uSunCol * 0.07);
        vec3 col = mix(body, refl, F);
        // the thread of the current wanders from side to side (no line is drawn along it: it carries the foam, below)
        float c0 = 0.45 * sin(vA.y * 0.045 + 1.7);
        // the sun on the ripples
        float sp = pow(max(dot(N, normalize(V + uSunDir)), 0.0), 220.0);
        col += uSunCol * sp * 0.5 * (0.3 + 0.7 * lod) * step(0.0, uSunDir.y);
        // R121': white on the riffles only: streaks 0.4 m by 3 m going with the current, on half the water there
        float white = rif * smoothstep(0.05, 0.2, depth) * smoothstep(0.42, 0.58, rsN(vec3(q.x * 2.5, q.y * 0.33 - uTime * 0.9 * uFlow, 4.0)));
        col = mix(col, vec3(0.9, 0.95, 0.95) * (amb + uSunCol * 0.25), 0.8 * white);
        float edge = cover * max(mix(1.0 - clear, 1.0, F), 0.8 * white);
        // FLECKS OF FOAM go down with the current at 1.4 m a second, in drifts some 5 by 8 m, thickest along the current's thread: each a
        // patch of 0.15 to 0.5 m; none on the still water; far off a drift is a pale wash
        if (still < 0.99) {
          vec2 fq = vec2(q.x, q.y - uTime * 1.4 * uFlow), fid = floor(fq / 0.7), ff = fract(fq / 0.7);
          float fh = rsH1(fid.x * 12.7 + fid.y * 71.3), fh2 = rsH1(fid.x * 3.3 + fid.y * 47.9 + 9.0);
          float drift = smoothstep(0.45, 0.7, rsN(vec3(fq * vec2(0.2, 0.125), 6.0))) * (0.2 + 0.8 * smoothstep(0.55, 0.0, abs(a - c0))) * (1.0 - still) * cover;
          vec2 fd = ff - 0.3 - 0.4 * vec2(fh2, fract(fh2 * 7.3)); float nearF = clamp(1.0 - dist / 90.0, 0.0, 1.0);
          fd.y *= 0.55 + 0.4 * fh;
          float fleck = step(fh, drift * 0.5) * smoothstep(0.08 + 0.3 * fh2 * fh2, 0.04, length(fd)) * (0.6 + 0.4 * rsN(vec3(fq * 7.0, 3.0))) * nearF + drift * 0.08 * (1.0 - nearF);
          col = mix(col, vec3(0.92, 0.96, 0.97) * (amb + uSunCol * 0.25), 0.85 * fleck); edge = max(edge, fleck);
        }
        // R432: petals lie on the still water in rafts, thickest within 12 m of the banks under the groves, and drift to the mouth at the
        // pool's own slow current (0.2 m a second); far off a raft is a pale wash
        if (still * uBloomK > 0.01) {
          vec2 pq = vW.xz + uFace.xz * uTime * 0.2, pid = floor(pq / 0.8), pf = fract(pq / 0.8);
          float ph = rsH1(pid.x * 12.7 + pid.y * 71.3), ph2 = rsH1(pid.x * 3.3 + pid.y * 47.9 + 9.0);
          float raft = smoothstep(0.38, 0.62, rsN(vec3(pq * 0.1, 3.0))) * (0.15 + 0.65 * (1.0 - smoothstep(4.0, 14.0, bd))) * still * cover;
          vec2 pd = pf - 0.3 - 0.4 * vec2(ph2, fract(ph2 * 7.3)); float ca = cos(ph * 6.2831853), sa = sin(ph * 6.2831853);
          pd = vec2(ca * pd.x + sa * pd.y, (ca * pd.y - sa * pd.x) * 1.7);
          float nearP = clamp(1.0 - dist / 110.0, 0.0, 1.0);
          float petal = step(ph, raft) * smoothstep(0.2, 0.14, length(pd)) * nearP + raft * 0.16 * (1.0 - nearP);
          col = mix(col, mix(uBloom, uBloomL, ph2) * (amb + uSunCol * 0.22), petal); edge = max(edge, petal);
        }
        gl_FragColor = vec4(col, edge * smoothstep(0.0, 6.0, vA.y) * (1.0 - smoothstep(uLen - uEnd.x, uLen - uEnd.y, vA.y) * smoothstep(uEnd.w, uEnd.z, abs(q.x))));
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the hero
// opts: { look, wing (half width of the head wall, 130), shape (wallShape result), mirror (length of the reflecting reach, 150),
//         stub (a short blind tunnel behind the mouth, for looking at the piece alone; default true), trees (default true),
//         floraMaterial, wind, detailTexture, pattern (0..3), density }
export async function buildHero(ctx, opts = {}) {
  // the piece's own streams, all taken here in one list from the stream it is given, before anything is built
  const rng = opts.rng || ctx.rng.fork('dome'), noise = ctx.noise;
  const RN = { shape: rng.fork('shape'), rock: rng.fork('rock'), pattern: rng.fork('pattern'), icicles: rng.fork('icicles'),
    trees: rng.fork('trees'), cherry0: rng.fork('cherry0'), cherry1: rng.fork('cherry1'), pine: rng.fork('pine'), scatter: rng.fork('scatter'),
    terrace: rng.fork('terrace'), cypress: rng.fork('cypress'), tongues: rng.fork('tongues'), runs: rng.fork('runs'), seeps: rng.fork('seeps') };
  const look = opts.look || makeLook(), WATER = opts.waterY ?? 0.14;
  const group = new THREE.Group(); group.name = 'dome-over-the-river';
  const wing = opts.wing ?? 130, S = opts.shape || wallShape(noise, { seed: RN.shape.range(0, 40) });
  const hw = await headwallGeometry(noise, S, wing, ctx.yield), G = gatePlan(S);
  await ctx.yield();
  const rockMat = T.makeRockMaterial({ rng: RN.rock, detailTexture: opts.detailTexture, top: '#2f6a3a', topAmount: 0.6, topSlope: [0.6, 0.88], contact: [0.01, 0, 0], bump: 1.1, detail: 0.8, bounce: '#b4d2d8', bounceAmount: opts.bounce ?? 2.2,
    waterLevel: WATER, wet: 0.7, wetRange: 30, wetTint: '#d0d4d8', wetRoughness: 0.3 });
  const rock = new THREE.Mesh(hw.rock, rockMat); rock.name = 'head-wall';
  const iceMat = makeIceMaterial(look, { side: THREE.DoubleSide });
  const throat = new THREE.Mesh(mouthLiningGeometry(noise, S), iceMat); throat.name = 'mouth-throat';
  group.add(rock, throat);
  await ctx.yield();

  // the dome on its balcony, hung out over the mouth
  const D = { R: 41, RC: 36, HC: 14, rise: 17, RB: 46, cliffZ: 20 };
  const dg = await domeGeometry(D, ctx.yield);
  const pattern = opts.pattern ?? RN.pattern.int(0, 3);
  const domeMat = makeDomeMaterial(look, { pattern });
  const dome = new THREE.Group(); dome.name = 'dome';
  dome.position.set(0, S.H0 + 3.2, S.faceZ(0, S.H0) - D.cliffZ);
  dome.add(new THREE.Mesh(dg.geometry, domeMat));
  const wind = opts.wind || [0.8, 0.6];
  const pennantCols = [lin('#f5c344', 0.9), lin('#f2a7b8', 0.95), lin('#2146a8', 1.1)];
  dome.add(makePennants(look, dg.poles, pennantCols, wind));
  group.add(dome);
  await ctx.yield();
  // the terraces' walls and stairs, in the dome's stone
  const ter = await terraceGeometry(noise, S, ctx.yield), terraces = new THREE.Mesh(ter.geometry, domeMat); terraces.name = 'terraces'; group.add(terraces);
  await ctx.yield();
  // ICE COMES OUT OF THE GATE ON THE WATER: on each side three low lobes of it. The first is rooted 4 m inside the passage against
  // the jamb and spills out past the corner of the gatehouse, 3 to 5 m high where it leaves the arch; the second lies along the
  // curtain's foot; the third reaches the tower's. Their rims lie half a metre under the water.
  {
    const tg = RN.tongues, TP = [], TA = [], TI = [];
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x0 = sd * (k === 0 ? MOUTH.half - tg.range(1.5, 3) : k === 1 ? tg.range(27, 33) : tg.range(38, 44)), len = k === 0 ? tg.range(20, 28) : tg.range(12, 20), half = k === 0 ? tg.range(5, 7.5) : tg.range(4, 7);
      const high = k === 0 ? tg.range(3, 5) : tg.range(1.2, 2.4), splay = sd * (k === 0 ? tg.range(38, 55) : tg.range(15, 35)) * Math.PI / 180, z0 = G.wallZ(x0, 0) - (k === 0 ? 4 : 0.5), ph = tg.range(0, TAU);
      const one = await iceSheetGeometry(10, 12, (u, v) => {
        const a = u * 2 - 1, out = v * (len + 2) - 2, lx = a * half * Math.sqrt(Math.max(0, 1 - v * v)) * (0.8 + 0.2 * Math.sin(v * 9 + ph));
        const y = WATER - 0.5 + (high + 0.5) * Math.pow(Math.max(0, 1 - a * a), 0.6) * smoothstep(0, 0.16, v) * Math.pow(1 - v, 0.5) * (0.8 + 0.2 * Math.sin(a * 5 + v * 9 + ph) + 0.12 * noise.n2(a * 3 + ph, v * 6));
        return { p: [x0 + Math.sin(splay) * out + Math.cos(splay) * lx, y, z0 + Math.cos(splay) * out - Math.sin(splay) * lx], hole: false, ice: [0.2 + 0.25 * (1 - v), 0.85, -0.45] };
      });
      const base = TP.length / 3, pa = one.attributes.position.array, ia = one.attributes.aIce.array, ix = one.index.array;
      for (let i = 0; i < pa.length; i++) { TP.push(pa[i]); TA.push(ia[i]); }
      for (let i = 0; i < ix.length; i++) TI.push(base + ix[i]);
    }
    // ICE HAS SPILLED OUT OVER THE ARCH'S FEET: on each side five runs of it lie on the lowest voussoirs and the wall beside them,
    // each from inside the opening outward and down toward the water (4 to 9 m long), 1.4 to 3 m broad at its root and drawn to
    // a point, a hand to 0.8 m thick. Higher up the arch carries only its frost and its icicles.
    for (let k = 0, rr = RN.runs; k < 10; k++) {
      const sd = k < 5 ? 1 : -1, up = rr.range(0.03, 0.27), a0 = (sd > 0 ? up : 1 - up) * Math.PI, len = rr.range(4, 9), wd = rr.range(1.4, 3), thick = rr.range(0.3, 0.8), ph = rr.range(0, TAU), sag = rr.range(0.5, 1) * up * Math.PI;
      const one = await iceSheetGeometry(6, 9, (u, v) => {
        const m = -0.6 + v * len, wv = wd * Math.pow(1 - v, 0.7) * (0.75 + 0.25 * Math.sin(v * 7 + ph)), a = a0 - sd * sag * v * v + ((u * 2 - 1) * wv + 0.4 * Math.sin(v * 3 + ph)) / (MOUTH.half + 2 + m);
        const x = (MOUTH.half + m) * Math.cos(a), y = MOUTH.y0 + (MOUTH.top + m - MOUTH.y0) * Math.sin(a), e = 1 - (u * 2 - 1) ** 2;
        return { p: [x, y, G.wallZ(x, y) + (m < GATE.vous ? 0.5 : 0) + 0.06 + thick * Math.pow(e, 0.6) * Math.pow(1 - v, 0.5) * smoothstep(-0.6, 0.2, m) - 1.2 * smoothstep(0.1, -0.6, m)], hole: false, ice: [0.25 + 0.2 * e, 0.9, -0.5] };
      });
      const base = TP.length / 3, pa = one.attributes.position.array, ia = one.attributes.aIce.array, ix = one.index.array;
      for (let i = 0; i < pa.length; i++) { TP.push(pa[i]); TA.push(ia[i]); }
      for (let i = 0; i < ix.length; i++) TI.push(base + ix[i]);
    }
    const tgeo = new THREE.BufferGeometry();
    tgeo.setAttribute('position', new THREE.Float32BufferAttribute(TP, 3)); tgeo.setAttribute('aIce', new THREE.Float32BufferAttribute(TA, 3)); tgeo.setIndex(TI); tgeo.computeVertexNormals();
    const tongues = new THREE.Mesh(tgeo, iceMat); tongues.name = 'gate-ice'; group.add(tongues);
  }

  // icicles hang from the arch's soffit, from half a metre to 3 m behind the wall's face: the ice within has begun to come out
  const icG = icicleGeometry(-1), nIc = 46, nSeep = 30, icicles = new THREE.InstancedMesh(icG, iceMat, nIc + nSeep), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const ir = RN.icicles;
  for (let i = 0; i < nIc; i++) {
    const x = (i / (nIc - 1) * 2 - 1) * MOUTH.half * 0.97 + ir.range(-0.3, 0.3), k = clamp(x / MOUTH.half, -0.999, 0.999);
    const y = MOUTH.y0 + (MOUTH.top - MOUTH.y0) * Math.sqrt(1 - k * k) + ir.range(-0.1, 0.25), len = ir.range(2.5, 8.5) * (0.45 + 0.55 * Math.sqrt(1 - k * k)), w = len * ir.range(0.9, 1.5);
    m4.compose(v3.set(x, y, G.wallZ(x, y) - ir.range(0.5, 3)), q4.identity(), s3.set(w, len, w)); icicles.setMatrixAt(i, m4);
  }
  // frozen seeps on the rock beyond the towers: six clusters of five
  for (let c = 0, sr = RN.seeps; c < 6; c++) {
    const cx = (c % 2 ? 1 : -1) * sr.range(GATE.tower + GATE.towerR + 2, 92), cy = sr.range(8, 22);
    for (let k = 0; k < 5; k++) {
      const x = cx + sr.range(-1.5, 1.5), y = cy + sr.range(-0.6, 0.6), len = sr.range(1.5, 4), w = len * sr.range(0.9, 1.5);
      m4.compose(v3.set(x, y, S.faceZ(x, y) + 0.4), q4.identity(), s3.set(w, len, w)); icicles.setMatrixAt(nIc + c * 5 + k, m4);
    }
  }
  icicles.name = 'icicles'; group.add(icicles);

  // a short blind tunnel so the mouth is not a hole when the piece stands alone
  if (opts.stub !== false) {
    const rings = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 11, k = (i === 0 ? 1.32 : 1.06) * (1 - 0.9 * t * t);
      rings.push({ p: new THREE.Vector3(0, 9 - 5 * t, 4 - i * 7), t: [0, -1], a: 19 * k, b: 17 * k, floor: -5 - 4 * t, river: 0, rw: 9, sun: smoothstep(0, 0.4, t) - 1, glow: 0.1 + 0.3 * t });
    }
    group.add((await makeIceCave(noise, look, rings, { segments: 40, yield: ctx.yield })).mesh);
  }

  // blossoming trees and dark cedars on the plateau, incense over the blossom
  let forest = null;
  if (opts.trees !== false) {
    let mat = opts.floraMaterial;
    if (!mat) { const mo = { wind: flora.makeWind({ direction: wind }) }; await flora.prepareLeafTexture(mo, ctx.yield); mat = flora.windMaterial(mo); }
    const tr = RN.trees, pts = [], dens = opts.density ?? 1, cx = dome.position.x, cz = dome.position.z, bl = opts.blossom || ['#f2a7b8', '#ffd6e0'];
    for (let i = 0, tries = 0; i < Math.round(30 * dens) && tries < 900; tries++) {
      const near = tr.chance(0.6), x = near ? tr.range(-1, 1) * Math.min(wing - 8, 112) : tr.range(-1, 1) * (wing - 8), d = near ? tr.range(7, 60) : tr.range(7, 150);
      const top = S.topAt(x), z = S.faceZ(x, top) - d;
      if (Math.hypot(x - cx, z - cz) < D.RB + 14) continue;
      const blossom = tr.chance(near ? 0.7 : 0.4), y = S.backY(x, d) - 0.4;
      pts.push({ x, y, z, s: tr.range(0.8, 1.3), rot: tr.range(0, TAU), d: 0, u: 0, v: blossom ? tr.int(0, 1) : 2 });
      i++;
    }
    // cypresses in a row 2.4 m behind each parapet, 6 to 9 m apart, none where the tread is under 4.5 m deep or within 3 m of a stair's head
    for (const sd of [-1, 1]) for (let i = 0, tc = RN.terrace; i < 3; i++) for (let ax = TER.x[0] + tc.range(2, 6); ax < TER.x[3]; ax += tc.range(6, 9)) {
      const x = sd * ax, s = tc.range(0.55, 0.8), rot = tc.range(0, TAU);
      if (S.terK(x) * TER.d[i] < 4.5 || ter.heads.some((h) => h[0] === i && h[1] === sd && Math.abs(ax - h[2]) < STEP.landing / 2 + 3) || (i === 0 && ter.burners.some((b) => Math.abs(b[0] - x) < 4))) continue;
      pts.push({ x, y: TER.y[i] - 0.3, z: ter.lineZ(x, i) - 3.1, s, rot, d: 0, u: 0, v: 3 });
    }
    await ctx.yield();
    // (each shape is one call into the kit and a step of the build of its own)
    const variants = [];
    variants.push(flora.cherryGeometry({ rng: RN.cherry0, detail: opts.treeDetail ?? 1, height: 11, leaf: bl[0], leafLight: bl[1] })); await ctx.yield();
    variants.push(flora.cherryGeometry({ rng: RN.cherry1, detail: 0, height: 9, leaf: bl[0], leafLight: bl[1] })); await ctx.yield();
    variants.push(flora.pineGeometry({ rng: RN.pine, detail: 0, height: 19, leaf: '#1b5238', leafLight: '#2f7a4e', leafDark: '#0f3b2a' })); await ctx.yield();
    variants.push(flora.cypressGeometry({ rng: RN.cypress, detail: 0, height: 15, leaf: '#1d5a3c', leafLight: '#2f7a4e', leafDark: '#0f3b2a' })); await ctx.yield();
    forest = flora.makeScatter({ rng: RN.scatter, points: pts, variants, material: mat });
    forest.object.name = 'plateau-trees'; group.add(forest.object);
  }

  group.add(makeIncense(look, ter.burners.map((b, i) => [b[0], b[1], b[2], 13 + 3 * (i % 2)]), { wind: [wind[0] * 0.8, wind[1] * 0.8] }));
  const MU = { uBalc: { value: new THREE.Vector4() }, uFace: { value: new THREE.Vector4(0, 0, 1, 0) }, uRise: { value: D.rise }, uPattern: domeMat.uniforms.uPattern };
  // the pool before the mouth (the world lays its own river instead and passes mirror: 0)
  let mirror = null;
  if ((opts.mirror ?? 150) > 0) {
    const len = opts.mirror ?? 150, line = new THREE.LineCurve3(new THREE.Vector3(0, 0.14, len + 1), new THREE.Vector3(0, 0.14, 1));
    mirror = new THREE.Mesh(ribbonGeometry(line, 40, 12, (u, p) => 2 * poolHalf(p.z)), makeWaterMaterial(look, MU, { still: [150, 230], shelf: [0, 0.9, 4.5, 2.1] })); mirror.renderOrder = 2; mirror.name = 'pool'; group.add(mirror);
  }

  const eave = new THREE.Vector3(), fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
  const place = () => {
    group.updateMatrixWorld(true);
    eave.set(dome.position.x, dome.position.y + dg.eaveY, dome.position.z).applyMatrix4(group.matrixWorld);
    look.uDome.value.set(eave.x, eave.y, eave.z, D.R);
    tmp.set(dome.position.x, dome.position.y, dome.position.z).applyMatrix4(group.matrixWorld);
    MU.uBalc.value.set(tmp.x, tmp.y, tmp.z, D.RB);
    fwd.set(0, 0, 1).transformDirection(group.matrixWorld);
    tmp.set(0, 0, G.zg - 0.5).applyMatrix4(group.matrixWorld);
    MU.uFace.value.set(fwd.x, fwd.y, fwd.z, tmp.dot(fwd));
  };
  place();
  return {
    object: group, radius: 62, height: 96, center: new THREE.Vector3(0, 44, -8), ground: true, groundY: -0.25,
    look, shape: S, dome: D, pattern, water: MU, parts: { rock, throat, dome, icicles, mirror, forest }, gate: G,
    anchors: {
      mouth: new THREE.Vector3(0, 8, 0), into: new THREE.Vector3(0, 0, -1), domeTop: new THREE.Vector3(0, dome.position.y + dg.top, dome.position.z),
      domeCentre: new THREE.Vector3(0, dome.position.y + 12, dome.position.z), poolHalf,
    },
    place,
    update(dt, time, camera) { look.uTime.value = time; place(); if (forest) forest.update(dt, time, camera); },
    dispose() {},
  };
}
