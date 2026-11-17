// Reverse Angle: the parts of a cross-cut world. Two cameras at the two ends of one event: ours on the rail (A) and the
// locked eye of a child at a hayloft door (B). This file holds the cut itself (camera B, its target and the quad that
// shows it), the white pigeon that we are (a glint far off, a feathered model near), the two tips we see of ourselves,
// the red mittens, the waiting child and the falcon. The world file builds the valley and drives all of it from u.
import * as THREE from 'three';

export const BEAT_HZ = 2.5;
export const beatOf = (time) => { const b = time * BEAT_HZ + 0.25; return b - Math.floor(b); };
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const pulseOf = (b) => sst(0, 0.25, b) * (1 - sst(0.25, 0.8, b));

// one set of uniforms for the whole world: a fixed sun, sky fill, haze, the beat. Nothing is relit between shots.
export function makeShared(opts = {}) {
  const lin = (h) => new THREE.Color(h);
  return {
    uSunDir: { value: (opts.sunDir || new THREE.Vector3(0.5, 0.4, 0.6)).clone().normalize() },
    uSunCol: { value: lin('#FFF1D6').multiplyScalar(opts.sun ?? 1.3) },
    uSkyCol: { value: lin('#9DC0E8').multiplyScalar(opts.fill ?? 0.42) },
    uFogCol: { value: lin('#C9D9E6').multiplyScalar(0.82) },
    uFogK: { value: opts.fogK ?? 0.000615 },
    uBeat: { value: 0 }, uTime: { value: 0 }, uBrake: { value: 0 },
    uU: { value: 0 }, uSweep: { value: new THREE.Vector3(-900, 0, 0) },   // flight position; one broad cloud shadow (its z, its strength)
    uRes: { value: new THREE.Vector2(800, 450) },
  };
}

export const GLSL_COMMON = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uFogCol, uSweep; uniform float uFogK, uBeat, uTime, uBrake, uU; uniform vec2 uRes;
float pulse(float b){ return smoothstep(0., 0.25, b) * (1. - smoothstep(0.25, 0.8, b)); }
vec3 shadeLit(vec3 alb, vec3 n, float sh){
  float d = max(dot(n, uSunDir), 0.) * sh;
  vec3 amb = uSkyCol * (0.6 + 0.4 * n.y) + vec3(0.06, 0.05, 0.04) * (0.5 - 0.5 * n.y);
  return alb * (uSunCol * d + amb);
}
vec3 fogged(vec3 c, float dist){ return mix(uFogCol, c, exp(-uFogK * max(dist, 0.))); }
// the haze is warm only toward the sun; looking down-sun it is the sky's cool blue-grey. toCam: from the point to the eye
vec3 fogColDir(vec3 toCam){
  float s = 0.5 - 0.5 * dot(normalize(toCam.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz + vec2(1e-5, 0.)));
  return mix(vec3(0.74, 0.96, 1.3) * dot(uFogCol, vec3(0.3333)), uFogCol, smoothstep(0.2, 0.8, s)); }
vec3 foggedDir(vec3 c, float dist, vec3 toCam){ return mix(fogColDir(toCam), c, exp(-uFogK * max(dist, 0.))); }
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
// cloud shadows, 150 m across, crawling up the valley at 9 m/s: 1 in the sun, 0 under a cloud. They are carried by the
// flight itself (uU) more than by the clock, so the light at each moment of the story is always the same light.
float cloudT(){ return uTime * 0.25 + uU * 34.; }
// the one broad shadow that crosses the wood. A cloud is not a slab: it has thin places that let three quarters of the sun
// through, each about 20 m across (three spruce crowns side by side), and the wind draws them across the valley at 20 m/s,
// the speed the small clouds' shadows have in the film (17 m per unit of cloud time, 1.2 units a second at the flight's pace).
// Under the broad shadow the wood is therefore never one held tone: pools of sun cross it for as long as the shadow lies on it
float sweepSh(vec2 xz, float soft){ vec2 q = (xz - vec2(0., uSweep.x)) / vec2(260., 70.);
  vec2 hp = (xz + vec2(20. * uTime, 0.)) / 21.; float thin = smoothstep(0.46, 0.62, vnoise(hp) * 0.7 + vnoise(hp * 2.1 + 3.) * 0.3);
  return 1. - uSweep.y * (1. - smoothstep(0.62 - soft, 1., length(q))) * (1. - 0.75 * thin); }
float cloudSun(vec2 xz){ float t = cloudT(); vec2 cp = (xz + vec2(312. + 17. * t, 520. - 5. * t)) / 130.; return (1. - smoothstep(0.505, 0.565, vnoise(cp) * 0.65 + vnoise(cp * 2.3 + 7.) * 0.35)) * sweepSh(xz, 0.); }
// the same clouds with a soft edge: for the wood and its mist, where a hard edge would read as a cut
float cloudSoft(vec2 xz){ float t = cloudT(); vec2 cp = (xz + vec2(312. + 17. * t, 520. - 5. * t)) / 130.; return (1. - smoothstep(0.5, 0.66, vnoise(cp) * 0.65 + vnoise(cp * 2.3 + 7.) * 0.35)) * sweepSh(xz, 0.25); }
`;

// the lit surface of everything built: vertex colours as albedo, the shared sun and haze, and a surface grain chosen by
// the part number painted on each piece: 0 plain, 3 slate, 4 coursed stone, 5/6/7 timber with its grain along y/x/z,
// 8 hay, 9 knitted wool. opts.glow adds the ring's warm light (a point at uGlowPos) for the loft and the door frame.
export const GLSL_SURFACE = /* glsl */`
vec3 gBump;                                                                   // relief: added to the normal by the caller
float gStone = 1.;                                                            // size of the rubble's stones: the barn is built three times life size, and so are its stones
vec3 surface(vec3 alb, vec3 w, vec3 n, float part, float dist, out float gloss){
  gloss = 0.; gBump = vec3(0.);
  vec2 hz = n.xz + vec2(1e-4, 0.); hz /= max(length(hz), 1e-4);
  float tu = dot(w.xz, vec2(-hz.y, hz.x));                                  // along the wall or the eave
  if (part > 3.5 && part < 4.5) {                                             // coursed rubble: uneven courses, stones of every length, weathered
    vec3 T = vec3(-hz.y, 0., hz.x);
    float big = step(1.5, gStone); vec2 q = vec2(tu / gStone, w.y / (0.47 * gStone) + (0.95 * vnoise(vec2(w.y * 0.9, 1.7)) + 0.3 * sin(w.y * 2.3 + 1.)) * (1. - 0.6 * big)); q.y += 0.22 * vnoise(vec2(tu * 0.4, w.y * 0.3)); float row = floor(q.y);
    q.x = q.x * (0.5 + 1.0 * hash21(vec2(row, 1.))) + hash21(vec2(row, 7.)) * 3.; q.x += 0.75 * vnoise(vec2(q.x * 0.71 + row * 13.1, row * 0.37)); vec2 f = fract(q);
    float h = hash21(vec2(floor(q.x), row)), h3 = hash21(vec2(floor(q.x) + 7., row)), fade = clamp(1.25 - fwidth(q.y) * 4.5, 0., 1.);
    float d = min(min(f.x, 1. - f.x) * 2.6, min(f.y, 1. - f.y)), mort = 1. - smoothstep(0.02, 0.1, d);
    float stain = vnoise(vec2(tu * 0.17, w.y * 0.05)) * 0.6 + vnoise(vec2(tu, w.y) * 0.6) * 0.4, grit = vnoise(vec2(tu, w.y) * 5.) * 0.6 + vnoise(vec2(tu, w.y) * 13.) * 0.4;
    alb *= mix(1., 0.86 + 0.26 * h - big * 0.3 * step(0.7, h3) * h, fade) * mix(0.6 + 0.7 * stain, 0.8 + 0.35 * stain, big) * (0.86 + 0.14 * smoothstep(0., 9., w.y)) * mix(1., 0.82 + 0.36 * grit, fade);
    alb *= mix(vec3(1.), mix(vec3(1.06, 1., 0.92), vec3(0.92, 0.98, 1.08), h3) * (1. - 0.2 * step(0.86, h3)), fade);
    alb *= 1. - (0.26 - 0.16 * big) * smoothstep(0.45, 0.7, vnoise(vec2(tu * 2.3, w.y * 0.07) + 4.)) * smoothstep(3., 14., w.y);   // rain streaks down from the eaves
    alb = mix(alb, alb * vec3(1.16, 1.08, 0.8), smoothstep(0.58, 0.8, vnoise(vec2(tu, w.y) * 0.9 + 9.) * 0.6 + vnoise(vec2(tu, w.y) * 2.7) * 0.4) * 0.4);   // ochre lichen
    alb = mix(alb, alb * 0.6, mort * fade);
    // each stone has its own face and rounded arrises: the side light rakes them
    vec2 bev = vec2(smoothstep(0.82, 1., f.x) - (1. - smoothstep(0., 0.18, f.x)), smoothstep(0.72, 1., f.y) - (1. - smoothstep(0., 0.28, f.y)));
    gBump = (T * ((h - 0.5) * 0.5 + bev.x * 0.34 + (grit - 0.5) * 0.4) + vec3(0., 1., 0.) * ((h3 - 0.5) * 0.26 + bev.y * 0.34 + (stain - 0.5) * 0.2)) * fade;
  } else if (part > 2.5 && part < 3.5) {                                      // slate, in rows down the slope
    vec2 q = vec2(tu / 0.8, w.y / 0.4); float row = floor(q.y); q.x += 0.5 * mod(row, 2.) + 0.13 * hash21(vec2(row, 3.)); vec2 f = fract(q);
    float h = hash21(vec2(floor(q.x), row)), fade = clamp(1.25 - fwidth(q.y) * 3.2, 0., 1.);
    alb *= mix(1., 0.5 + 0.95 * h, fade) * (0.75 + 0.5 * vnoise(vec2(tu, w.y) * 0.35));
    alb *= 1. - 0.7 * fade * (1. - smoothstep(0., 0.26, f.y)) - 0.4 * fade * (1. - smoothstep(0., 0.07, min(f.x, 1. - f.x)));
    gBump = vec3(0., 1., 0.) * (0.5 * (smoothstep(0.6, 1., f.y) - 0.3) + (h - 0.5) * 0.3) * fade;                  // each course tips out over the one below
    alb = mix(alb, vec3(0.2, 0.17, 0.07), smoothstep(0.66, 0.8, vnoise(vec2(tu, w.y) * 0.5 + 3.)) * 0.4);
    gloss = 0.5 * (0.4 + 0.6 * h);
  } else if (part > 4.5 && part < 7.5) {                                      // timber
    vec3 g = part < 5.5 ? w.xzy : part < 6.5 ? w.yzx : w.xyz;                 // g.z runs along the grain
    float gr = vnoise(vec2(g.x * 9. + g.y * 7., g.z * 0.55)) * 0.6 + vnoise(vec2(g.x * 37. + g.y * 31., g.z * 1.7)) * 0.4;
    float knot = smoothstep(0.8, 0.95, vnoise(vec2(g.x + g.y, g.z * 0.35) * 1.3));
    alb *= (0.5 + 1.0 * gr) * (1. - 0.6 * knot);
    alb *= 1. - 0.5 * (1. - smoothstep(0., 0.035, abs(fract((g.x + g.y) * 1.6) - 0.5)));   // the joints between boards
  } else if (part > 10.5 && part < 11.5) {                                    // spruce bark: plates and furrows running up the stem
    float bk = vnoise(vec2((w.x + w.z) * 5.5, w.y * 0.55)) * 0.6 + vnoise(vec2((w.x - w.z) * 15., w.y * 1.9)) * 0.4;
    alb *= (0.4 + 1.1 * bk) * (0.8 + 0.4 * vnoise(vec2(w.x + w.z, w.y) * 0.9));
    alb = mix(alb, vec3(0.22, 0.24, 0.2), smoothstep(0.6, 0.85, vnoise(vec2(w.x - w.z, w.y * 0.6) * 1.4)) * 0.35);   // grey lichen
  } else if (part > 12.5 && part < 13.5) {                                    // straw bales: strands, two strings, round shoulders
    float by = (w.y - 10.91) / 1.12, row = floor(by), fy = fract(by), fx = fract((w.x - mod(row, 2.) + 1.01) / 2.02);
    float strand = vnoise(vec2(w.x * 2.6 + row * 5., w.y * 46.)) * 0.55 + vnoise(vec2(w.x * 9., w.y * 110. + w.z * 60.)) * 0.45;
    float ends = vnoise(vec2(w.x, w.y) * 38.) * 0.5 + vnoise(vec2(w.x, w.y + w.z) * 90.) * 0.5;
    float hf = clamp(1.6 - dist * 0.03, 0., 1.), ed = min(min(fx, 1. - fx) * 1.8, min(fy, 1. - fy)), sd = min(abs(fy - 0.31), abs(fy - 0.69));
    alb *= mix(0.8, 0.42 + 0.6 * strand + 0.5 * ends * ends, hf) * (0.4 + 0.6 * smoothstep(0., 0.13, ed)) * (0.8 + 0.2 * smoothstep(0., 0.1, sd));
    alb = mix(alb, vec3(0.2, 0.12, 0.05), (1. - smoothstep(0.012, 0.03, sd)) * 0.85);
    gBump = (vec3(-hz.y, 0., hz.x) * (smoothstep(0.86, 1., fx) - (1. - smoothstep(0., 0.14, fx))) + vec3(0., 1., 0.) * (smoothstep(0.8, 1., fy) - (1. - smoothstep(0., 0.2, fy)) + 0.35 * ((1. - smoothstep(0., 0.06, abs(fy - 0.34))) - (1. - smoothstep(0., 0.06, abs(fy - 0.28)))))) * 0.7;
  } else if (part > 13.5) {                                                   // October foliage: leaf masses, mottled gold and rust, holed at the edges
    float lf = vnoise(w.xy * 1.3 + w.z * 0.9) * 0.55 + vnoise(w.zy * 3.7 + w.x * 2.1) * 0.45, lg = vnoise(w.xz * 0.35 + w.y * 0.3);
    if (lf < 0.3 && dist < 400.) discard;
    alb *= (0.4 + 1.1 * lf) * mix(vec3(1.), vec3(1.06, 0.88, 0.5), smoothstep(0.45, 0.7, lg));   // gold to ochre: nothing here is red
    gBump = vec3(lf - 0.5, 0., vnoise(w.yx * 2.9) - 0.5) * 0.9;
  } else if (part > 7.5 && part < 8.5) {                                      // hay
    vec2 a = w.xz * mat2(0.8, 0.6, -0.6, 0.8), b = w.xz * mat2(0.5, -0.87, 0.87, 0.5);
    float s = vnoise(vec2(a.x * 7.3, a.y * 0.9 + w.y * 3.)) * 0.4 + vnoise(vec2(b.x * 11.7, b.y * 1.3 - w.y * 2.)) * 0.35 + vnoise(vec2(a.y * 29., b.y * 4.3)) * 0.25;
    float hf = clamp(1.5 - dist * 0.09, 0., 1.);
    alb *= mix(0.8, 0.5 + 0.95 * s * s, hf) * (0.8 + 0.4 * vnoise(w.xz * 0.5)) * (0.75 + 0.25 * smoothstep(-0.3, 0.4, sin(w.y * 5.6 + 0.5)));
  }
  return alb;
}
`;
export function litMat(shared, opts = {}) {
  return new THREE.ShaderMaterial({
    name: 'ra-lit' + (opts.name || ''), side: opts.side ?? THREE.FrontSide, vertexColors: true,
    uniforms: { ...shared, uTint: { value: new THREE.Color(opts.color || '#ffffff') }, uGlowPos: { value: opts.glowPos || new THREE.Vector3(0, -999, 0) },
      uGlow: { value: opts.glow ?? 0 }, uAmb: { value: opts.amb ?? 1 }, uSunK: { value: opts.sunK ?? 1 }, uRimK: { value: opts.rim ?? 0 },
      uGlowMin: { value: opts.glowMin ?? 0 }, uGlowFall: { value: opts.glowFall ?? 0.02 }, uCloudK: { value: opts.cloud ?? 0 },
      uEave: { value: opts.eave || new THREE.Vector4(0, 0, 0, 0) }, uWrap: { value: opts.wrap ?? 0 }, uAir: { value: opts.air || new THREE.Vector3(0, 0, 0) },
      uEdge: { value: opts.edge || new THREE.Vector3(0, 1, 0) }, uGrip: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float aPart; uniform float uTime, uGrip; varying vec3 vN, vW, vC, vL; varying float vPart;
      void main(){
        vec3 pos = position, nor = normal;
        // a mitten that grips (uGrip 0..1; only the pair on the sill is ever given it): the thumb is folded in under the palm,
        // the fingers are bent over at the knuckles toward the palm (115 degrees: a fist's hook), and the hand is cocked back
        // at the wrist (43 degrees), as a hand is that holds on to an edge with the forearm lying low behind it. The knit is
        // still drawn from the unbent position (vL), so the stitches bend with the wool
        if (uGrip > 0. && aPart > 8.5 && aPart < 9.5) {
          if (aPart > 9.1) {                                                  // the thumb (part 9.25): swung about the hand's length, in under the palm
            float hs = pos.x > 0. ? 1. : -1., a = -hs * 2.0 * uGrip, c = cos(a), sn = sin(a); vec2 q = pos.xz - vec2(hs * 0.1, 0.03);
            pos.xz = vec2(hs * 0.1, 0.03) + vec2(q.x * c + q.y * sn, -q.x * sn + q.y * c); nor.xz = vec2(nor.x * c + nor.z * sn, -nor.x * sn + nor.z * c);
          }
          float th = 2.0 * uGrip * smoothstep(0.3, 0.44, pos.y), c = cos(th), sn = sin(th); vec2 q = pos.yz - vec2(0.37, 0.045);   // the knuckles: half way up the hand (the pouch is 0.2 to 0.5), turning about a line inside the palm
          pos.yz = vec2(0.37, 0.045) + vec2(q.x * c - q.y * sn, q.x * sn + q.y * c); nor.yz = vec2(nor.y * c - nor.z * sn, nor.y * sn + nor.z * c);
          th = -0.75 * uGrip * smoothstep(0.13, 0.27, pos.y); c = cos(th); sn = sin(th); q = pos.yz - vec2(0.2, -0.03);            // the wrist: where the cuff ends (0.2), turning about a line at the back of it
          pos.yz = vec2(0.2, -0.03) + vec2(q.x * c - q.y * sn, q.x * sn + q.y * c); nor.yz = vec2(nor.y * c - nor.z * sn, nor.y * sn + nor.z * c);
        }
        vec4 p = vec4(pos, 1.);
        #ifdef USE_INSTANCING
        p = instanceMatrix * p; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * nor);
        #else
        vN = normalize(mat3(modelMatrix) * nor);
        #endif
        #ifdef USE_COLOR
        vC = color;
        #else
        vC = vec3(1.);
        #endif
        vPart = aPart; vL = position;   // one part number per piece: equal at all corners
        #ifdef USE_INSTANCING_COLOR
        vC *= instanceColor;
        #endif
        if (aPart > 13.5) p.xz += vec2(0.3 * sin(uTime * 1.1 + position.x * 0.13 + position.y * 0.21), 0.2 * sin(uTime * 1.6 + position.z * 0.17)) + 0.07 * sin(uTime * 4.3 + position.y * 1.9 + position.x * 2.3);   // wind in the crowns
        vec4 w = modelMatrix * p; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_COMMON + GLSL_SURFACE + /* glsl */`
      uniform vec3 uTint, uGlowPos; uniform float uGlow, uAmb, uSunK, uRimK, uGlowMin, uGlowFall, uCloudK, uWrap; uniform vec4 uEave; uniform vec3 uAir, uEdge;
      varying vec3 vN, vW, vC, vL; varying float vPart;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        gStone = uEave.x > 0. ? 1.7 : 1.; float gloss; vec3 alb = surface(vC * uTint, vW, n, vPart, dist, gloss);
        n = normalize(n + gBump);
        if (uEave.x > 0. && vPart > 3.5 && vPart < 4.5) alb *= 0.62 + 0.38 * smoothstep(0.5, 14., vW.y);   // the barn's wall is damp and dark toward the ground
        if (vPart > 8.5 && vPart < 9.5) {                                     // knitted wool, thick: columns of V stitches 2 cm wide, a ribbed turned cuff, a cable up the back of the hand
          float cuffK = 1. - smoothstep(0.165, 0.185, vL.y), kx = vL.x * 50., ky = vL.y * 44., cx = fract(kx) - 0.5;
          float kfade = clamp(1.5 - fwidth(kx) * 1.7, 0., 1.);                                   // stitches only where the lens can hold them
          float st = (1. - 0.5 * smoothstep(0.26, 0.5, abs(cx))) * (0.8 + 0.2 * sin((ky + abs(cx) * 1.2) * 6.2832));
          float ra = atan(vL.z / 0.76, vL.x + step(abs(vL.x) + abs(vL.z), 1e-5)), rib = 0.62 + 0.38 * smoothstep(-0.5, 0.5, cos(ra * 14.));   // the cuff's ribs run up it
          float back = 1. - smoothstep(-0.01, 0.01, vL.z), inY = smoothstep(0.2, 0.24, vL.y) * (1. - smoothstep(0.62, 0.68, vL.y));
          float sw = 0.026 * sin(vL.y * 34.), ca = max(1. - smoothstep(0.011, 0.02, abs(vL.x - sw)), 1. - smoothstep(0.011, 0.02, abs(vL.x + sw)));   // two strands crossing
          float gut = (1. - smoothstep(0.004, 0.012, abs(abs(vL.x) - 0.052))) * back * inY;      // a purl gutter either side of the cable
          float knit = mix(st, rib, cuffK); knit = mix(knit, 0.62 + 0.55 * ca, back * inY * (1. - smoothstep(0.044, 0.05, abs(vL.x)))); knit *= 1. - 0.45 * gut;
          knit *= 1. - 0.3 * (1. - smoothstep(0., 0.012, abs(vL.y - 0.2))) * (1. - cuffK);     // the shadow under the cuff's fold
          alb *= mix(0.86, knit, kfade) * (0.84 + 0.32 * (vnoise(vL.xy * 70.) * 0.6 + vnoise(vL.yz * 23.) * 0.4));
        }
        if (vPart > 0.5 && vPart < 1.5) {                                     // a quilted coat sleeve: stitched channels a hand apart, down filling between them
          float ch = fract(-vL.y / 0.2429), seam = 1. - smoothstep(0., 0.09, min(ch, 1. - ch));
          alb *= (1. - 0.6 * seam) * (0.78 + 0.34 * (vnoise(vL.xy * vec2(46., 19.)) * 0.6 + vnoise(vL.zy * vec2(21., 60.)) * 0.4)) * (0.72 + 0.4 * sin(3.1416 * ch));
          alb *= 1. - 0.35 * (1. - smoothstep(0.004, 0.012, abs(vL.x - 0.3 * vL.z)));           // the sleeve's long seam
        }
        if (vPart > 11.5 && vPart < 12.5) { float bq = dot(vL.xy, vec2(0.38, 0.92)) * 330., bq2 = dot(vL.xy, vec2(-0.6, 0.8)) * 47.; alb *= (1. - 0.2 * (0.5 + 0.5 * sin(bq)) * clamp(1.2 - fwidth(bq) * 0.5, 0., 1.)) * (0.9 + 0.1 * smoothstep(-0.3, 0.3, sin(bq2 + 3. * vnoise(vL.xy * 9.)))); }   // barbs, and the splits in the vane
        if (vPart > 9.5 && vPart < 10.5) alb *= (0.8 + 0.2 * smoothstep(-0.2, 0.35, sin(vL.z * 70. + abs(vL.x) * 22.))) * (0.85 + 0.3 * vnoise(vL.xz * 25.)) * (1. - 0.45 * smoothstep(0.9, 1.5, abs(vL.x)));   // barred plumage
        float ndl = max(dot(n, uSunDir), 0.) * mix(1., 0.3 + 0.7 * cloudSun(vW.xz), uCloudK);
        // the roof's overhang shades the top of the gable: uEave = ridge height, slope, depth of the shadow, strength
        float ev = uEave.x - abs(vW.x + uEave.z * uSunDir.x * 0.6) * uEave.y - vW.y; ndl *= 1. - uEave.w * (1. - smoothstep(uEave.z * 0.7, max(uEave.z, 1e-6), ev)) * step(0.5, abs(n.z));
        vec3 amb = mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.3333))), 0.35) * (0.6 + 0.4 * n.y) + vec3(0.2, 0.15, 0.07) * (0.5 - 0.5 * n.y);   // sky above, the straw's light from below
        vec3 c = alb * (uSunCol * ndl * uSunK + amb * uAmb);
        vec3 hv = normalize(V + uSunDir + vec3(0., 1e-4, 0.)); float sp = max(dot(n, hv), 0.); sp *= sp; sp *= sp; sp *= sp;
        c += uSunCol * gloss * sp * sp * 0.5 * uSunK * step(0., dot(n, uSunDir));
        float fr = 1. - max(dot(n, V), 0.); fr *= fr;
        c += alb * (uSunCol * 0.5 + uSkyCol) * fr * uRimK;                    // nap: wool and feather edges catch the sky
        if (vPart > 8.5 && vPart < 9.5) { float tlm = 0.5 + 0.5 * dot(-V, uSunDir);                                  // against the low sun the wool's nap is lit through, on the sun's side of each hand
          c += uSunCol * vec3(1., 0.2, 0.11) * fr * (0.35 + 0.65 * fr) * smoothstep(0.35, 0.85, tlm) * (0.35 + 0.65 * smoothstep(-0.3, 0.6, dot(n, uSunDir))) * 0.8 * uSunK; }
        vec3 g = uGlowPos - vW; float gd = length(g);
        float gk = uGlow / (1. + gd * gd * uGlowFall);
        float topK = mix(1., 0.15 + 0.85 * smoothstep(-0.2, 0.6, n.y), step(0.001, uWrap));   // a wrapped light rims the top, not the whole outline
        c += alb * vec3(1., 0.7, 0.36) * gk * (max((dot(n, g / max(gd, 1e-3)) + uWrap) / (1. + uWrap), uGlowMin) + fr * uRimK * 0.9 * topK);
        if (vPart > 8.5 && vPart < 9.5) c += vec3(1., 0.5, 0.26) * gk * fr * 0.42 * topK * step(0.001, uWrap);   // the wool's nap catches the ring
        if (vPart > 11.5 && vPart < 12.5) c += alb * alb * vec3(1., 0.76, 0.44) * gk * 0.6 * max(-dot(n, g / max(gd, 1e-3)), 0.);   // the ring's light comes through our own vanes
        // uEdge = the plane (z) of a frame's outer arris, how far the wear goes in, strength: the worn edge of the timber, the
        // dust and hay stuck to it, catch the sun that stands beyond the door, so each post ends in a thin line of light
        if (uEdge.z > 0.) { float eg = 1. - smoothstep(0., max(uEdge.y, 1e-4), abs(vW.z - uEdge.x)), ch = vnoise(vec2(vW.y * 7., vW.x * 3.)) * 0.6 + vnoise(vec2(vW.y * 31., vW.x * 9.)) * 0.4;
          c *= 1. - 0.5 * smoothstep(0.62, 0.7, vnoise(vec2(vW.z * 23. + vW.x * 17., vW.y * 0.9)));                         // drying checks run up the post: dark under the sun, the sky and the ring's light alike
          c += uSunCol * vec3(1., 0.74, 0.42) * eg * eg * uEdge.z * (1. - abs(n.z)) * (0.25 + 0.75 * cloudSoft(vW.xz)) * (0.35 + 1.1 * ch); }   // on the reveals only: the frame's outer face is the wall's face
        // the coat (part 1, the sleeve): whatever light falls on it, on screen it is never bluer than the coat's own colour
        // #2B2F3A (blue 58 to red 43: 1.35). The tone map's toe and the grade steepen a linear ratio in the darks (measured:
        // linear 1.75 came out 1.6 to 1.7 in the mid tones and over 3 near black), so the linear cap is 1.2 for blue and 1.06
        // for green: a slate grey. The sky's fill cannot turn it navy; the sun and the ring may still warm it
        if (vPart > 0.5 && vPart < 1.5) c.gb = min(c.gb, c.r * vec2(1.06, 1.2));
        c = foggedDir(c, dist, V);
        // uAir = density, the door's plane, brightness: dust hanging in the loft, lit by the ring and the slits; only the
        // part of the sight line that lies inside the loft counts, so from the valley the doorway stays dark
        float inside = dist * clamp((uAir.y - vW.z) / max(cameraPosition.z - vW.z, 1e-3), 0., 1.);
        c = mix(c, vec3(1., 0.7, 0.38) * uAir.z, 1. - exp(-inside * uAir.x));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// THE CUT. Camera B never moves. In a B shot the world draws itself from B into one target, then shows that target
// on one opaque quad held 0.5 m in front of whichever camera the engine is about to draw with.
export function makeCut(ctx, { eye, pitchDeg = 8, yaw = Math.PI }) {
  const renderer = ctx.renderer, size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const fovB = (aspect) => Math.min(64, Math.max(50, 2 * Math.atan(0.829 / Math.max(aspect, 0.1)) * 180 / Math.PI));
  const camB = new THREE.PerspectiveCamera(fovB(size.x / Math.max(1, size.y)), size.x / Math.max(1, size.y), 0.15, 4000);
  camB.position.copy(eye); camB.rotation.set(pitchDeg * Math.PI / 180, yaw, 0, 'YXZ'); camB.updateMatrixWorld(true);
  const samples = (ctx.quality?.detail ?? 1) < 0.8 ? 0 : 4;
  const target = new THREE.WebGLRenderTarget(Math.max(2, size.x), Math.max(2, size.y), { type: THREE.HalfFloatType, samples, depthBuffer: true });
  target.texture.minFilter = target.texture.magFilter = THREE.LinearFilter; target.texture.generateMipmaps = false;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    name: 'ra-cut', uniforms: { uMap: { value: target.texture } }, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, fog: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform sampler2D uMap; varying vec2 vUv; void main(){ gl_FragColor = vec4(max(texture2D(uMap, vUv).rgb, 0.), 1.); }',
  }));
  quad.name = 'ra-cut-quad'; quad.frustumCulled = false; quad.matrixAutoUpdate = false; quad.renderOrder = 9999; quad.visible = false;
  const now = new THREE.Vector2(), local = new THREE.Matrix4(), sc = new THREE.Vector3();
  return {
    camB, quad, target,
    // draw the scene from B; the caller has already shown and hidden what belongs to B's shot
    render(scene) {
      renderer.getDrawingBufferSize(now);
      const w = Math.max(2, Math.round(now.x)), h = Math.max(2, Math.round(now.y));
      if (w !== target.width || h !== target.height) { target.setSize(w, h); camB.aspect = w / h; camB.fov = fovB(w / h); camB.updateProjectionMatrix(); }
      const prev = renderer.getRenderTarget(), ac = renderer.autoClear;
      renderer.autoClear = true; renderer.setRenderTarget(target); renderer.render(scene, camB);
      renderer.setRenderTarget(prev); renderer.autoClear = ac;
    },
    // hold the quad in front of the camera that is about to draw
    place(camera) {
      const e = camera.projectionMatrix.elements, d = 0.5;
      sc.set(d / Math.max(1e-4, e[0]) * 1.002, d / Math.max(1e-4, e[5]) * 1.002, 1);
      local.makeTranslation(0, 0, -d).scale(sc);
      quad.matrix.copy(camera.matrixWorld).multiply(local); quad.matrixWorldNeedsUpdate = true;
    },
    dispose() { target.dispose(); },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE GLINT: what a white pigeon is at half a kilometre. A soft disc with a short horizontal dash, never under five
// pixels (at 1080), throbbing on the beat, never to black. Its centre is set to the exact point camera A occupies.
export function makeGlint(shared) {
  const mat = new THREE.ShaderMaterial({
    name: 'ra-glint', transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { ...shared, uPos: { value: new THREE.Vector3() }, uPx: { value: 5 }, uGain: { value: 1 }, uFlut: { value: 0 }, uCol: { value: new THREE.Color(1, 0.985, 0.95) }, uDash: { value: 1 } },
    vertexShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uPos; uniform float uPx; varying vec2 vQ;
      void main(){
        vec4 c = projectionMatrix * viewMatrix * vec4(uPos, 1.);
        c.xy += position.xy * (uPx * 4.) / max(uRes, vec2(1.)) * c.w;
        vQ = position.xy * 4.; gl_Position = c;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uGain, uFlut, uDash; uniform vec3 uCol; varying vec2 vQ;
      void main(){
        float r = length(vQ), p = mix(pulse(uBeat), 0.6 + 0.25 * sin(uTime * 4.3) + 0.15 * sin(uTime * 9.1), uFlut);
        float disc = 1. - smoothstep(0.5, 1.05, r), ax = abs(vQ.x);
        float th = mix(0.8, -0.55, p), wy = vQ.y - ax * th * (1. - 0.1 * ax);      // two wings: up, then struck down on the beat
        float dash = (1. - smoothstep(0.2, 0.46, abs(wy))) * (1. - smoothstep(1.9, 2.7, ax * sqrt(1. + th * th))) * uDash;
        float halo = (1. - smoothstep(0.5, 3.6, r)); halo *= halo * 0.2 * (0.4 + 0.6 * p);
        float a = clamp(max(disc, dash) + halo, 0., 1.) * uGain;
        gl_FragColor = vec4(uCol * 2.3 * (0.5 + 0.5 * p), a);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.name = 'ra-glint'; mesh.frustumCulled = false; mesh.renderOrder = 50; mesh.visible = false;
  return { mesh, mat, setPos(v) { mat.uniforms.uPos.value.copy(v); } };
}

// THE ONE FEATHER the strike leaves in the sky. Its place (uPos) is given by the world; here it is a feather: a bowed
// quill, a narrow leading vane and a broad one, turning about its own length as it falls. Flat to the eye it is white and
// takes the sun; edge on it is a short, bowed, tilted grey sliver (a fifth of its breadth, three fifths of its length). It slides down the wind as it falls:
// uWind metres sideways for every metre it has come down from uTop, the height it was let go at.
export function makeLooseFeather(shared) {
  const mat = new THREE.ShaderMaterial({
    name: 'ra-loose-feather', transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...shared, uPos: { value: new THREE.Vector3() }, uPx: { value: 12 }, uGain: { value: 0 }, uTop: { value: 0 }, uWind: { value: 0 } },
    vertexShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uPos; uniform float uPx, uTop, uWind; varying vec2 vQ; varying float vFl;
      void main(){
        vec4 c = projectionMatrix * viewMatrix * vec4(uPos + vec3(uWind * max(uTop - uPos.y, 0.), 0., 0.), 1.);
        float spin = uTime * 1.9 + 0.7 * sin(uTime * 0.6), fl = abs(cos(spin));                       // about its own length: flat, edge on, flat: under two flashes a second
        // it lies across its fall and swings like a pendulum: 60 degrees from upright, 30 and 15 either way, so never nearer upright than 14 degrees
        float a = 1.05 + 0.55 * sin(uTime * 1.1) + 0.25 * sin(uTime * 2.3), ca = cos(a), sa = sin(a), px = uPx * 2.2;
        // the axis it turns about is not quite its quill (the quill is bowed and heavy at its bare end): edge on, its tip has swung
        // toward or away from the eye and three fifths of its length is seen. The vanes narrow in the fragment shader, so the bow stays
        vec2 o = vec2(position.x * 0.42, position.y * (0.6 + 0.4 * fl));
        o = vec2(o.x * ca - o.y * sa, o.x * sa + o.y * ca);
        c.xy += o * px / max(uRes, vec2(1.)) * c.w * 2.;
        vQ = position.xy; vFl = fl; gl_Position = c;   // one turn for the whole feather: equal at all corners
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uGain; varying vec2 vQ; varying float vFl;
      void main(){
        float y = clamp(vQ.y * 0.5 + 0.5, 0., 1.), x = vQ.x - 0.3 * sin(3.1416 * y) + 0.15;            // the quill is bowed
        float wd = sqrt(max(sin(3.1416 * y), 0.)) * (0.5 + 0.5 * y) * smoothstep(0.1, 0.24, y);       // vanes from above the bare quill to a round tip
        float vane = 1. - smoothstep(0.75, 1., abs(x) / max(wd * (x > 0. ? 0.8 : 0.42) * max(vFl, 0.2), 1e-4));  // a broad vane and a narrow one; edge on they keep a fifth of their breadth
        float shaft = 1. - smoothstep(0.03, 0.12, abs(x)), quill = shaft * (1. - smoothstep(0.92, 1., y));
        float a = max(vane, quill * 0.9), flatK = smoothstep(0.15, 0.8, vFl);
        vec3 lit = vec3(1.3, 1.26, 1.14) + uSunCol * 0.55 * smoothstep(0.82, 1., vFl);                 // flat to us it takes the sun
        vec3 col = mix(vec3(0.5, 0.54, 0.63), lit, flatK) * (1. - 0.4 * shaft * flatK) * (0.85 + 0.15 * y);
        gl_FragColor = vec4(col, a * uGain);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); mesh.name = 'ra-loose-feather'; mesh.frustumCulled = false; mesh.renderOrder = 50; mesh.visible = false;
  return { mesh, mat, setPos(v) { mat.uniforms.uPos.value.copy(v); } };
}

// ---------------------------------------------------------------------------------------------------------------
// THE PIGEON: body, head, a tail of 12 feathers and per wing 10 primaries and 8 secondaries, each its own tapered
// blade. The vertex shader flaps them from uBeat and takes uBrake for the landing pose. Local frame: flies to -Z.
const FEATHER_VERT = /* glsl */`
  attribute vec4 aF;   // kind (0 primary, 1 secondary, 2 tail, 3 under covert of the hand, 4 under covert of the arm), index 0..1, side, length
  varying vec2 vFl; varying vec3 vN, vW; varying float vKind;
  const float ARM = 0.5, HAND = 0.32, TAU = 6.2831853;
  void main(){
    float kind = aF.x, t = aF.y, side = aF.z, len = aF.w, w = position.x, l = position.y;
    float cov = step(2.5, kind), hand = (kind < 0.5 || (kind > 2.5 && kind < 3.5)) ? 1. : 0.;
    float ph = TAU * (uBeat - 0.25);
    float a = mix(0.96, 0.26, uBrake) * cos(ph) + mix(0.06, 0.2, uBrake);          // shoulder, +-55 degrees; a raised V to brake
    float aw = 0.5 * cos(ph - TAU * 0.12) * (1. - 0.5 * uBrake) - 0.12;            // wrist, lagging
    float down = max(sin(ph), 0.);
    float wd = (cov > 0.5 ? 0.23 : kind < 0.5 ? mix(0.15, 0.112, uBrake) : kind < 1.5 ? 0.2 : 0.15) * (0.5 + 0.5 * smoothstep(0., 0.25, l)) * (1. - mix(0.8, 0.5, cov) * smoothstep(0.72, 1., l) * smoothstep(0.72, 1., l));   // a covert is broad and round-ended
    vec3 p, n;
    if (kind < 1.5 || cov > 0.5) {
      float ang = hand > 0.5 ? mix(1.2, 0.07, t) + uBrake * mix(-0.22, -0.6, t) : mix(1.52, 1.32, t) - 0.1 * uBrake * t;   // braking: the hand opens like fingers
      float rootX = hand > 0.5 ? ARM + HAND * t : ARM * (0.06 + 0.94 * t);
      vec2 dir = vec2(cos(ang), sin(ang)), per = vec2(-dir.y, dir.x);
      vec2 P = vec2(rootX, -0.03 - 0.04 * cov) + dir * (l * len) + per * (w * wd);                  // the coverts start ahead of the quills: they wrap the arm's leading edge
      float lift = (hand > 0.5 ? 0.004 + 0.006 * t : -0.004 + 0.003 * t) + w * 0.012 + 0.02 * sin(3.1416 * l) * (1. + uBrake);
      lift = mix(lift, -0.012 - 0.05 * (0.3 - len) + w * 0.01 - 0.012 * sin(3.1416 * l), cov);        // under the wing, the shorter row lying over the longer
      float xs = max(P.x, 0.), xi = min(xs, ARM), xo = max(xs - ARM, 0.), s = clamp(xs / 1.45, 0., 1.);
      float an = a + aw * (1. - 0.6 * uBrake) + 0.3 * s * s * (down + 0.35 * uBrake) * 1.3;                // tips bend up on the downstroke
      vec2 q = xi * vec2(cos(a), sin(a)) + xo * vec2(cos(an), sin(an));
      float au = xs < ARM ? a : an;
      n = vec3(-side * sin(au), cos(au), 0.);
      p = vec3(side * (0.09 + q.x), 0.05 + q.y, P.y) + n * lift;
    } else {
      float fan = mix(0.3, 1.05, uBrake), ang = (t * 2. - 1.) * fan;                // tail: 35 to 120 degrees
      vec2 dir = vec2(sin(ang), cos(ang)), per = vec2(dir.y, -dir.x);
      vec2 P = dir * (0.05 + l * len) + per * (w * wd);
      float dr = -0.22 * uBrake;                                                    // the fan tips down as a brake
      float y = 0.012 * abs(t - 0.5) + w * 0.01, z = P.y;
      p = vec3(P.x, 0.02 + y * cos(dr) + z * sin(dr), 0.24 + z * cos(dr) - y * sin(dr));
      n = vec3(0., cos(dr), -sin(dr));
    }
    float bp = 0.96 * uBrake, cb = cos(bp), sb = sin(bp);                          // body pitched up 50 degrees
    p = vec3(p.x, p.y * cb - p.z * sb, p.y * sb + p.z * cb); n = vec3(n.x, n.y * cb - n.z * sb, n.y * sb + n.z * cb);
    vFl = vec2(w, l); vKind = kind;   // smooth across the blade
    vN = normalize(mat3(modelMatrix) * n);
    vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const FEATHER_FRAG = /* glsl */`
  uniform float uFade; varying vec2 vFl; varying vec3 vN, vW; varying float vKind;
  void main(){
    vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(n, V) < 0.) n = -n;
    float ndl = dot(n, uSunDir), fw = fwidth(vFl.x) + 1e-4;
    float shaft = (1. - smoothstep(0.03, 0.03 + max(fw, 0.03), abs(vFl.x))) * clamp(0.1 / fw, 0., 1.) * (1. - smoothstep(0.8, 0.97, vFl.y));
    float barb = 0.93 + 0.07 * sin(vFl.y * 90. + abs(vFl.x) * 40.) * clamp(0.3 / fw - 1., 0., 1.);
    float ax = abs(vFl.x), edge = smoothstep(0.5, 0.3, ax);
    vec3 alb = vec3(0.82, 0.81, 0.78) * barb * (0.86 + 0.14 * edge);
    float tl = 0.5 + 0.5 * dot(-V, uSunDir), back = smoothstep(0.3, 0.7, tl);      // the sun behind the bird for this eye: both wings are lit through alike
    vec3 c = shadeLit(alb, n, 1. - back) + alb * vec3(0.5, 0.47, 0.42) * 0.32 * (1. - 0.5 * back);   // the straw fields' light from below
    // the sun behind the vane: every feather is a translucent blade, cream where one layer lets the light through,
    // amber and cooler where the next feather or the coverts lie over it, the shaft dark, the edge and tip burning
    float over = 1. - smoothstep(0.08, 0.6, vFl.y);                                // under the coverts
    float lap = smoothstep(0.0, 0.26, vFl.x) * (1. - smoothstep(0.5, 0.95, vFl.y)); // the half that lies under the next feather
    float thin = clamp(1. - 0.5 * over - 0.42 * lap, 0., 1.);
    float cov = (1. - smoothstep(0., 0.05, abs(vFl.y - 0.3 - 0.05 * cos(vFl.x * 6.2832)))) + (1. - smoothstep(0., 0.04, abs(vFl.y - 0.52 - 0.04 * cos(vFl.x * 6.2832)))) * step(0.5, vKind) * step(vKind, 1.5);   // the scalloped edges of the coverts
    float isCov = step(2.5, vKind);                                                 // an under covert: soft, close, nearly opaque, its round end catching the light
    // the flight feathers (primaries, secondaries, tail) are lit through as they always were: amber to cream, each free edge
    // and tip burning, the shaft a dark line down every blade. The under coverts have their own, quieter light
    vec3 through = mix(mix(vec3(0.8, 0.36, 0.09), vec3(0.86, 0.46, 0.16), isCov), mix(vec3(1., 0.79, 0.4), vec3(1., 0.86, 0.56), isCov), thin * (0.55 + 0.45 * smoothstep(0.15, 0.85, vFl.y))) * uSunCol * 0.8;
    c = mix(c, c * vec3(0.5, 0.55, 0.76), back * 0.7);
    c += through * back * tl * tl * mix(0.6 * (0.22 + 0.78 * thin), 0.2 * (0.3 + 0.7 * thin), isCov) * (1. - 0.35 * cov * (1. - isCov)) * (0.9 + 0.1 * barb);
    float rim = min(smoothstep(0.37, 0.48, -vFl.x) * mix(1., smoothstep(0.3, 0.75, vFl.y), isCov) + smoothstep(0.91, 0.99, vFl.y), 1.);   // the free edge and the tip burn
    c += vec3(1., 0.88, 0.66) * mix(1.2, 0.3, isCov) * rim * back * tl;
    c = mix(c, c * (0.82 + 0.3 * smoothstep(0.55, 0.95, vFl.y)) + vec3(0.16, 0.17, 0.2) * (1. - smoothstep(0.1, 0.6, vFl.y)), isCov);   // each covert shades the root of the next
    c *= 1. - mix(0.85, 0.12, isCov) * shaft;
    c = mix(c, vec3(1.32, 1.28, 1.2) * (0.82 + 0.18 * edge), 0.9 * smoothstep(60., 170., dist));   // far off the bird is simply white: a fleck with wings
    c = min(c, vec3(2.0));
    gl_FragColor = vec4(fogged(c, dist), 1.);
  }`;

// small geometry helpers: paint a geometry one colour (and a part number), merge a list of them
export function paint(geo, hex, part = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, c = new THREE.Color(hex);
  const col = new Float32Array(n * 3), pt = new Float32Array(n);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; pt[i] = part; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aPart', new THREE.BufferAttribute(pt, 1));
  g.deleteAttribute('uv'); return g;
}
export function merge(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const out = new THREE.BufferGeometry(), names = ['position', 'normal', 'color', 'aPart'], sizes = [3, 3, 3, 1];
  names.forEach((nm, k) => {
    const a = new Float32Array(n * sizes[k]); let o = 0;
    for (const g of list) { const s = g.attributes[nm]; if (s) a.set(s.array, o); o += g.attributes.position.count * sizes[k]; }
    out.setAttribute(nm, new THREE.BufferAttribute(a, sizes[k]));
  });
  for (const g of list) g.dispose();
  return out;
}
const at = (g, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz))); return g; };

export function makePigeon(shared) {
  const group = new THREE.Group(); group.name = 'ra-pigeon';
  // feathers: one blade, 3 columns by 6 rows; x = across (-0.5..0.5), y = along (0..1)
  const blade = new THREE.PlaneGeometry(1, 1, 2, 5); blade.translate(0, 0.5, 0);
  const rows = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) rows.push(0, i / 9, side, 0.62 + 0.13 * Math.sin(Math.PI * (0.25 + 0.75 * i / 9)));
    for (let i = 0; i < 8; i++) rows.push(1, i / 7, side, 0.4 + 0.07 * (i / 7));
    // under coverts: on the hand one row a third of a primary long; on the arm a greater row that ends 0.3 of the way down
    // the secondary beneath it (a secondary is 0.4 + 0.07 t long and the covert starts 0.04 ahead of its quill), and a lesser
    // row half as far down. 0.3 is where the blade's own shader draws the coverts' edge and begins to be lit through: the
    // coverts hide the wing's arm and the quills' roots and lie over no part of a blade that the sun comes through
    for (let i = 0; i < 9; i++) rows.push(3, i / 8, side, 0.27 - 0.05 * (i / 8));
    for (let i = 0; i < 10; i++) rows.push(4, i / 9, side, 0.04 + 0.3 * (0.4 + 0.07 * (i / 9)));
    for (let i = 0; i < 10; i++) rows.push(4, (i + 0.5) / 10, side, 0.04 + 0.15 * (0.4 + 0.07 * ((i + 0.5) / 10)));
  }
  for (let i = 0; i < 12; i++) rows.push(2, i / 11, 0, 0.42 - 0.08 * Math.abs(i / 11 - 0.5));
  const ig = new THREE.InstancedBufferGeometry().copy(blade); ig.instanceCount = rows.length / 4;
  ig.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(rows), 4));
  const fmat = new THREE.ShaderMaterial({ name: 'ra-feather', side: THREE.DoubleSide, uniforms: { ...shared, uFade: { value: 1 } },
    vertexShader: GLSL_COMMON + FEATHER_VERT, fragmentShader: GLSL_COMMON + FEATHER_FRAG });
  const feathers = new THREE.Mesh(ig, fmat); feathers.frustumCulled = false; feathers.name = 'ra-feathers'; group.add(feathers);
  // body: breast, head, beak, eyes, covert shoulders, feet (part 1, thrown forward by uBrake), brass tube on the left leg
  const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h), white = '#EDE9DF';
  const parts = [
    paint(at(S(1, 18, 14), 0, 0, 0.0, 0, 0, 0, 0.122, 0.112, 0.27), white),
    paint(at(S(1, 14, 12), 0, 0.05, -0.2, 0.35, 0, 0, 0.076, 0.078, 0.12), white),                    // the neck, drawn up
    paint(at(S(1, 18, 14), 0, -0.022, -0.09, 0.25, 0, 0, 0.13, 0.124, 0.16), white),                  // the deep breast: a pigeon is all chest
    paint(at(S(1, 12, 10), 0, -0.012, 0.25, -0.12, 0, 0, 0.075, 0.05, 0.15), white),                  // under-tail coverts: the body runs out into the tail
    paint(at(S(1, 12, 10), 0.105, 0.035, -0.03, 0, 0.2, 0, 0.07, 0.062, 0.14), white), paint(at(S(1, 12, 10), -0.105, 0.035, -0.03, 0, -0.2, 0, 0.07, 0.062, 0.14), white),   // the shoulders, over the wings' roots
    paint(at(S(1, 16, 12), 0, 0.085, -0.29, 0.2, 0, 0, 0.066, 0.07, 0.078), white, 2),                // head: narrow, high-browed
    paint(at(S(1), 0, 0.104, -0.318, 0, 0, 0, 0.05, 0.045, 0.05), white, 2),                        // the forehead
    paint(at(new THREE.ConeGeometry(0.017, 0.085, 8), 0, 0.066, -0.39, -Math.PI / 2 - 0.22, 0, 0), '#4A3E3A', 2),   // the bill, tipped down, dark enough to read from the door
    paint(at(S(1, 8, 6), 0.011, 0.083, -0.362, 0, 0, 0, 0.016, 0.013, 0.021), '#F4F0E8', 2), paint(at(S(1, 8, 6), -0.011, 0.083, -0.362, 0, 0, 0, 0.016, 0.013, 0.021), '#F4F0E8', 2),   // the cere
    // two dark eyes set forward on the head, each in a thin pale ring with a point of sky in it: seen from in front, a face
    paint(at(S(1, 10, 8), 0.045, 0.1, -0.338, 0, 0.55, 0, 0.0085, 0.02, 0.02), '#CFC8BC', 2),
    paint(at(S(1, 10, 8), 0.0485, 0.1, -0.343, 0, 0.55, 0, 0.0085, 0.0155, 0.0155), '#0B0908', 2),
    paint(at(S(0.0035, 5, 4), 0.052, 0.106, -0.353), '#FFFFFF', 2),
    paint(at(S(1, 10, 8), -0.045, 0.1, -0.338, 0, -0.55, 0, 0.0085, 0.02, 0.02), '#CFC8BC', 2),
    paint(at(S(1, 10, 8), -0.0485, 0.1, -0.343, 0, -0.55, 0, 0.0085, 0.0155, 0.0155), '#0B0908', 2),
    paint(at(S(0.0035, 5, 4), -0.052, 0.106, -0.353), '#FFFFFF', 2),
  ];
  // legs: a feathered thigh, a bare shank, three toes forward and one back, spread (a pigeon's foot is 5 cm; as built 0.07)
  const toe = (len, r) => new THREE.CylinderGeometry(r * 0.6, r, len, 5).translate(0, len / 2, 0);
  for (const sx of [-1, 1]) {
    parts.push(paint(at(S(1, 8, 6), sx * 0.045, -0.085, 0.03, 0, 0, 0, 0.03, 0.05, 0.035), white, 1));
    parts.push(paint(at(new THREE.CylinderGeometry(0.008, 0.009, 0.1, 6), sx * 0.045, -0.165, 0.03), '#B58E84', 1));
    for (const a of [-0.45, 0, 0.45]) parts.push(paint(at(toe(0.075, 0.0075), sx * 0.045, -0.213, 0.03, -Math.PI / 2 - 0.12, 0, a), '#B58E84', 1));
    parts.push(paint(at(toe(0.035, 0.007), sx * 0.045, -0.213, 0.03, Math.PI / 2 + 0.12, 0, 0), '#B58E84', 1));
  }
  parts.push(paint(at(new THREE.CylinderGeometry(0.019, 0.019, 0.055, 8), -0.045, -0.158, 0.03), '#D9A441', 1));   // the brass message tube on the left leg
  const bmat = new THREE.ShaderMaterial({ name: 'ra-bird-body', vertexColors: true, uniforms: { ...shared },
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute float aPart; varying vec3 vN, vW, vC, vL;
      void main(){
        vec3 p = position, n = normal; vL = position;
        if (aPart > 0.5 && aPart < 1.5) { float f = mix(1.25, -0.75, uBrake), c = cos(f), s = sin(f); vec3 h = vec3(0., -0.07, 0.03), q = p - h;   // feet: tucked back, then thrown forward
          p = h + vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c); n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c); }
        float bp = 0.96 * uBrake, cb = cos(bp), sb = sin(bp);
        if (aPart > 1.5) { vec3 nk = vec3(0., 0.05, -0.22), hq = p - nk; float hd = -0.42 * uBrake, hc = cos(hd), hs = sin(hd);   // the head does not pitch with the body: it bows 24 degrees, to look at whoever waits below it
          hq = vec3(hq.x, hq.y * hc - hq.z * hs, hq.y * hs + hq.z * hc); n = vec3(n.x, n.y * hc - n.z * hs, n.y * hs + n.z * hc);
          p = vec3(0., nk.y * cb - nk.z * sb + 0.02 * uBrake, nk.y * sb + nk.z * cb) + hq; }
        else { p = vec3(p.x, p.y * cb - p.z * sb, p.y * sb + p.z * cb); n = vec3(n.x, n.y * cb - n.z * sb, n.y * sb + n.z * cb); }
        vN = normalize(mat3(modelMatrix) * n); vC = color;
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vN, vW, vC, vL;
      void main(){
        vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
        // breast and neck in overlapping scalloped feathers, smaller toward the head: each one's lower edge catches the light
        float sz = mix(40., 24., smoothstep(-0.3, 0.05, vL.z)); vec2 k = vec2(atan(vL.x, 0.16 - vL.y) * sz * 0.16, vL.z * sz); float row = floor(k.y); k.x += 0.5 * mod(row, 2.); vec2 kf = fract(k);
        float sd = length(vec2(kf.x - 0.5, (kf.y - 0.1) * 0.9)), sk = clamp(1.6 - dist * 0.14, 0., 1.) * step(0.5, vC.g) * step(vC.b, 0.95);
        float scal = (smoothstep(0.34, 0.52, sd) - 0.5 * (1. - smoothstep(0., 0.3, kf.y))) * sk;
        float rim = 1. - max(dot(n, V), 0.); rim *= rim * rim; float tl = 0.5 + 0.5 * dot(-V, uSunDir);
        float flank = smoothstep(-0.55, 0.35, dot(n, uSunDir));                    // the light wraps round from behind
        vec3 c = shadeLit(vC * 0.86, n, 1.) * 0.66 + vC * vec3(0.33, 0.3, 0.54) * 0.36 * (0.75 + 0.25 * n.y) + vC * vec3(0.52, 0.52, 0.6) * 0.5;   // a white bird: even its shade side is pale
        c *= 1. - 0.1 * smoothstep(0.36, 0.5, sd) * sk; c += vec3(1., 0.85, 0.62) * 0.05 * max(-scal, 0.);    // each breast feather's edge lies in the next one's shade; the whole in its own soft blue-violet shadow, so the face reads
        c += vec3(1., 0.88, 0.66) * rim * flank * 2.2 * tl * step(0.5, vC.g);
        c = mix(c, vC * vec3(1.35, 1.32, 1.25), 0.85 * smoothstep(60., 170., dist));
        gl_FragColor = vec4(fogged(min(c, vec3(2.6)), dist), 1.);
      }`,
  });
  const body = new THREE.Mesh(merge(parts), bmat); body.frustumCulled = false; body.name = 'ra-bird-body'; group.add(body);
  const fwd = new THREE.Vector3(), m = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), zero = new THREE.Vector3();
  return { group, feathers, body,
    // put the bird at a point, flying along a tangent
    place(pos, tangent) { fwd.copy(tangent).negate(); m.lookAt(fwd, zero, up); group.quaternion.setFromRotationMatrix(m); group.position.copy(pos); } };
}

// ---------------------------------------------------------------------------------------------------------------
// THE TIPS: all we ever see of ourselves in A. Not loose blades: the HAND of each wing. A wrist, the wing's leading edge
// running back from it out of the picture (four rows of small coverts), a row of greater coverts and a row of median
// coverts lying over the quills' roots, and nine primaries growing out from under them. Of the arm only that leading
// edge is drawn, 0.43 m of it, so the limb leaves the picture and no end of it is seen; none of the arm's flight
// feathers and nothing of the body is drawn (the cast: never seen in A except as its primary tips). It is the dove's own feather (the lit-through cream blade with a dark shaft that
// camera B shows in the gasp): one blade, drawn once per feather. The hand lives in the wing's own plane, in metres:
// q.x along the span from the wrist to the tip, q.y toward the trailing edge. On the downstroke the fan opens and the
// tips bend up under the air; on the upstroke the fan closes and the hand flexes back at the wrist, as a pigeon's does.
// The stroke is the shared beat (uBeat) with the dove's own phase; uStroke (1 flying, 0 folded in the hands) stills it.
const HAND_VERT = /* glsl */`
  attribute vec4 aF;   // kind (0 primary, 1 greater covert, 2 median covert, 5.. marginal coverts by row), place, length, side
  uniform float uStroke; varying vec2 vFl; varying vec3 vN, vW, vK;
  void main(){
    float kind = aF.x, t = aF.y, len = aF.z, side = aF.w, w = position.x, l = 1. - (1. - position.y) * (1. - position.y);   // the blade's rows crowd toward the tip, where it rounds
    float ph = 6.2831853 * (uBeat - 0.25), down = max(sin(ph), 0.) * uStroke;                         // the dove's downstroke: the same half of the same beat
    float open = smoothstep(0.15, 0.33, uBeat) * (1. - smoothstep(0.62, 0.9, uBeat)) * uStroke;      // the fan is open through the downstroke, shut on the way back up
    float cov = (kind > 0.5 && kind < 2.5) || kind > 3.5 ? 1. : 0., marg = step(4.5, kind), row = kind - 5.;
    vec2 arm = vec2(-0.92, 0.39), root, dir; float wd, lift, flex = 0.4 * (1. - open);   // the wrist flexes 23 degrees on the upstroke
    if (kind < 2.5) {                                                         // the hand: quills set along 0.17 m of hand bone, the outermost at its end
      float ang = (0.04 + 0.86 * t) * mix(0.55, 1., open) + flex;            // nine quills fanned through 49 degrees when open, 27 when shut
      root = vec2(0.17 * (1. - t), -0.012 - 0.02 * cov); dir = vec2(cos(ang), sin(ang));
      wd = (cov > 0.5 ? 0.1 : mix(0.1, 0.125, t)) * (0.45 + 0.55 * smoothstep(0., 0.3, l));
      float em = (1. - smoothstep(0.2, 0.45, t)) * smoothstep(0.42, 0.6, l) * (1. - cov);   // the three outer primaries are cut away toward the tip: open, they stand apart as fingers
      float l3 = l * l * l; wd *= (1. - 0.38 * em) * sqrt(max(1. - l3 * l3 * mix(1., l3, cov), 0.));   // a round tip, rounder still on a covert
      lift = 0.004 + 0.016 * t - w * 0.012 + cov * (0.012 + 0.008 * (kind - 1.));
    } else {                                                                  // marginal coverts: small round scales in rows along the leading edge, hand and arm
      float sp = 0.17 - t * 0.6;                                              // along the edge, metres from the wrist: from the end of the hand bone (+0.17) back along the arm (to -0.43)
      vec2 along = sp > 0. ? vec2(1., 0.) : arm, back = sp > 0. ? vec2(0.08, 1.) : vec2(0.39, 0.92);
      root = along * abs(sp) + back * (-0.045 + 0.03 * row); dir = normalize(back + along * 0.25 * sign(sp));
      float l3 = l * l * l; wd = 0.062 * (0.6 + 0.4 * smoothstep(0., 0.3, l)) * sqrt(max(1. - l3 * l3, 0.));
      lift = 0.05 - 0.009 * row + w * 0.004 + 0.006 * sin(3.1416 * l);       // the leading edge is a round limb, thickest at its front
    }
    vec2 q = root + dir * (l * len) + vec2(-dir.y, dir.x) * (w * wd + 0.07 * l * l * len * (1. - marg));   // a quill is not straight: it curves back toward the trailing edge
    float sx = clamp(q.x / 0.9, 0., 1.), bend = 0.26 * sx * sx * down * (1. - marg);                 // tips bend up on the downstroke (the dove's 0.3 rad at the tip)
    lift += 0.02 * sin(3.1416 * l) * (1. - cov);                                                    // each vane is a shallow arch
    // the wing's plane in the carried frame (x right, y up, z toward the eye): the span runs in from the corner, down and
    // away from the eye, so the tips are 0.4 m further off than the wrist and the arm comes back past the eye's side
    vec3 A = normalize(vec3(-0.60, -0.62, -0.50)), Bv = normalize(vec3(-0.72, 0.55, 0.20)), Nu = normalize(cross(A, Bv));
    // the wrist stands 0.23 m in and 0.21 m down from the point the pair is carried by; folded in the hands (uStroke 0) it is drawn
    // back 0.3 m to our flank, so that only the shut quills lie beside us
    vec3 p = vec3(-0.23 + 0.3 * (1. - uStroke), -0.21, 0.10) + A * q.x + Bv * q.y - Nu * lift + Nu * bend;
    vec3 n = normalize(-Nu + A * (0.58 * sx * down * (1. - marg)) + Bv * (w * 0.12));   // toward the eye: we look at the wing's underside; the bent tip turns its face
    p.x *= side; n.x *= side;
    vFl = vec2(w, l); vK = vec3(cov, marg, kind);   // one kind per feather: equal at all corners
    vN = normalize(mat3(modelMatrix) * n);
    vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const HAND_FRAG = /* glsl */`
  uniform vec3 uGlowPos; uniform float uAmb, uGlow, uGlowFall, uGlowMin, uWrap; varying vec2 vFl; varying vec3 vN, vW, vK;
  void main(){
    vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(n, V) < 0.) n = -n;
    float isCov = vK.x, marg = vK.y, fw = fwidth(vFl.x) + 1e-4, ax = abs(vFl.x + 0.22 * (1. - isCov)), edge = 1. - smoothstep(0.3, 0.5, abs(vFl.x));   // a flight feather's shaft lies toward its leading edge: the narrow vane, the one the next feather leaves bare
    float shaft = (1. - smoothstep(0.025, 0.025 + max(fw, 0.03), ax)) * clamp(0.1 / fw, 0., 1.) * (1. - smoothstep(0.8, 0.97, vFl.y));
    float barb = 0.93 + 0.07 * sin(vFl.y * 90. + ax * 40.) * clamp(0.3 / fw - 1., 0., 1.);
    vec3 alb = vec3(0.82, 0.81, 0.78) * barb * (0.86 + 0.14 * edge);
    float tl = 0.5 + 0.5 * dot(-V, uSunDir), back = smoothstep(0.3, 0.7, tl);      // the sun behind this wing for our eye: it is lit through, as the dove's are from the loft
    // the next feather lies over this one's trailing half and throws a soft shade on it; a covert shades the root beneath it
    float lap = smoothstep(0.0, 0.26, vFl.x) * (1. - smoothstep(0.5, 0.95, vFl.y)), over = (1. - smoothstep(0.08, 0.6, vFl.y)) * (1. - isCov);
    float d = max(dot(n, uSunDir), 0.) * (1. - back);
    vec3 amb = uSkyCol * (0.8 + 0.2 * n.y) + vec3(0.06, 0.05, 0.04) * (0.5 - 0.5 * n.y);
    float thin = clamp(1. - 0.5 * over - 0.42 * lap, 0., 1.);
    // the dove's light: sun, sky, the straw fields from below (we see the wing's underside, which faces them); and where the sun
    // falls on the far side of a vane a part of it comes through, so a white wing's shade side is pale, never grey
    vec3 c = alb * (uSunCol * d + amb * (uAmb / 1.2)) + alb * vec3(0.5, 0.47, 0.42) * 0.5 * (1. - 0.5 * back) * (uAmb / 1.2);
    c += alb * uSunCol * vec3(1., 0.9, 0.72) * 0.3 * max(dot(-n, uSunDir), 0.) * (0.4 + 0.6 * thin) * (1. - back);
    c *= 1. - 0.3 * lap * (1. - 0.6 * isCov) - 0.22 * over;
    vec3 through = mix(mix(vec3(0.8, 0.36, 0.09), vec3(0.86, 0.46, 0.16), isCov), mix(vec3(1., 0.79, 0.4), vec3(1., 0.86, 0.56), isCov), thin * (0.55 + 0.45 * smoothstep(0.15, 0.85, vFl.y))) * uSunCol * 0.8;
    c = mix(c, c * vec3(0.62, 0.66, 0.82), back * 0.7);
    c += through * back * tl * tl * mix(0.75 * (0.22 + 0.78 * thin), 0.42 * (0.3 + 0.7 * thin), isCov) * (0.9 + 0.1 * barb);
    float rim = min(smoothstep(0.37, 0.48, -vFl.x) * mix(1., smoothstep(0.3, 0.75, vFl.y), isCov) + smoothstep(0.91, 0.99, vFl.y), 1.);   // the free edge and the tip burn
    c += vec3(1., 0.88, 0.66) * mix(1.2, 0.3, isCov) * rim * back * tl;
    c = mix(c, c * (0.86 + 0.24 * smoothstep(0.55, 0.95, vFl.y)) + vec3(0.16, 0.17, 0.2) * (1. - smoothstep(0.1, 0.6, vFl.y)) * (uAmb / 1.2), isCov * (1. - 0.6 * marg) * 0.7);   // each covert shades the root of the next
    c *= 1. - mix(0.85, 0.12, isCov) * shaft;
    // the ring's light in the loft: on the faces turned to it, and through the vanes that stand against it
    vec3 g = uGlowPos - vW; float gd = length(g), gk = uGlow / (1. + gd * gd * uGlowFall), gn = dot(n, g / max(gd, 1e-3));
    c += alb * vec3(1., 0.7, 0.36) * gk * max((gn + uWrap) / (1. + uWrap), uGlowMin) * (1. - 0.6 * shaft);
    c += alb * alb * vec3(1., 0.76, 0.44) * gk * 0.6 * max(dot(-V, g / max(gd, 1e-3)), 0.) * thin * (1. - isCov);
    gl_FragColor = vec4(fogged(min(c, vec3(2.0)), dist), 1.);
  }`;
export function makeTips(shared, opts = {}) {
  const mat = new THREE.ShaderMaterial({ name: 'ra-hand', side: THREE.DoubleSide,
    uniforms: { ...shared, uStroke: { value: 1 }, uAmb: { value: 1.2 }, uGlow: { value: opts.glow ?? 0 }, uGlowPos: { value: opts.glowPos || new THREE.Vector3(0, -999, 0) },
      uGlowFall: { value: opts.glowFall ?? 0.02 }, uGlowMin: { value: opts.glowMin ?? 0 }, uWrap: { value: opts.wrap ?? 0 } },
    vertexShader: GLSL_COMMON + HAND_VERT, fragmentShader: GLSL_COMMON + HAND_FRAG });
  const blade = new THREE.PlaneGeometry(1, 1, 2, 8); blade.translate(0, 0.5, 0);
  const mk = (side) => {
    const rows = [];
    // drawn in this order, far to near: the nine primaries from the innermost out (each
    // lies under the next one inward, as on the dove), the greater and median coverts over their roots, the marginal coverts
    // a pigeon's longest primary is the second from the outside (0.58 m here, where the dove's is 0.75: the hand is seen foreshortened, reaching away
    // from the eye); each one inward is 31 mm shorter, down to five eighths of the longest at the innermost (0.36 m), as on the bird
    for (let i = 8; i >= 0; i--) rows.push(0, i / 8, 0.58 - 0.031 * Math.abs(i - 1), side);
    for (let i = 8; i >= 0; i--) rows.push(1, i / 8, 0.18 - 0.004 * i, side);                 // a greater covert is a third to two fifths of its primary
    for (let i = 7; i >= 0; i--) rows.push(2, (i + 0.5) / 8, 0.1, side);                    // the median row half as long, set between them
    for (let r = 3; r >= 0; r--) for (let i = 0; i < 16; i++) rows.push(5 + r, (i + 0.5 * (r % 2)) / 16, 0.07 + 0.008 * r, side);   // four rows of small scales, staggered like tiles: 4 cm apart along the edge
    const ig = new THREE.InstancedBufferGeometry().copy(blade); ig.instanceCount = rows.length / 4;
    ig.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(rows), 4));
    const m = new THREE.Mesh(ig, mat); m.frustumCulled = false; m.matrixAutoUpdate = false; m.name = 'ra-tip'; return m;
  };
  return { left: mk(-1), right: mk(1), mat };
}

// ---------------------------------------------------------------------------------------------------------------
// RED MITTENS: a pouch and a thumb, the only red in the world. Local frame: cuff at the origin, fingers to +Y, palm to
// +Z, thumb to +X * hand. 0.5 m long as built (the farm is three times life size).
export function makeMittenGeometry(hand = 1) {
  const red = '#D4202A', dark = '#B61A23', sp = (x, k) => Math.sign(x) * Math.pow(Math.abs(x), k);
  // the pouch: a rounded slab, narrower at the wrist, the finger end curled a little toward the palm, and a gusset
  // swelling out low on the thumb's side where the thumb is knitted on
  const pouch = new THREE.SphereGeometry(1, 22, 16), pp = pouch.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), tap = 0.8 + 0.2 * sst(-1, 0.1, y), gus = 0.03 * Math.max(0, x * hand) * sst(0.25, -0.5, y);
    pp.setXYZ(i, sp(x, 0.72) * 0.138 * tap + hand * gus, y * 0.215 + 0.29, sp(z, 0.8) * 0.082 * (0.85 + 0.15 * tap) + 0.035 * Math.max(0, y) ** 2);
  }
  pouch.computeVertexNormals();
  // the thumb: a third of the hand's length (0.15 m of 0.5), standing 45 degrees off it, so it is a thumb in silhouette
  const thumb = new THREE.SphereGeometry(1, 12, 10), tp = thumb.attributes.position;
  for (let i = 0; i < tp.count; i++) { const ty = tp.getY(i); tp.setXYZ(i, sp(tp.getX(i), 0.8) * 0.056 * (1 - 0.18 * ty), ty * 0.15, sp(tp.getZ(i), 0.8) * 0.052 * (1 - 0.18 * ty)); }
  thumb.computeVertexNormals();
  // the cuff: 0.2 m of rib (14 ribs round it), turned over once, so it is thicker than the wrist and ends in two rolled edges
  const cuff = new THREE.CylinderGeometry(0.112, 0.128, 0.2, 28, 3, true), cp = cuff.attributes.position;
  for (let i = 0; i < cp.count; i++) { const a = Math.atan2(cp.getZ(i), cp.getX(i)), r = 1 + 0.05 * Math.cos(a * 14); cp.setXYZ(i, cp.getX(i) * r, cp.getY(i), cp.getZ(i) * r * 0.76); }
  cuff.computeVertexNormals();
  const roll = (r, y) => at(new THREE.TorusGeometry(r, 0.02, 6, 24).rotateX(Math.PI / 2), 0, y, 0, 0, 0, 0, 1, 1, 0.76);
  return merge([paint(pouch, red, 9), paint(at(thumb, hand * 0.15, 0.2, 0.014, 0, 0, -hand * 0.78), red, 9.25), paint(at(cuff, 0, 0.08, 0), dark, 9), paint(roll(0.125, -0.02), dark, 9), paint(roll(0.116, 0.182), dark, 9)]);
}
// the arm in its coat: a quilted sleeve 1.7 m long (the child is 3.75 m as built), 7 channels of down, narrow at the storm
// cuff where the mitten is pulled over it, wide toward the elbow. Local frame: wrist at the origin, the arm along -Y.
export function makeSleeveGeometry() {
  const pts = [];
  for (let k = 0; k <= 42; k++) { const t = k / 42, puff = Math.sqrt(Math.abs(Math.sin(Math.PI * t * 7))); pts.push(new THREE.Vector2((0.108 + 0.1 * t) * (0.84 + 0.22 * puff), -1.7 * t)); }
  const g = new THREE.LatheGeometry(pts, 16); g.scale(1, 1, 0.86); g.computeVertexNormals();
  return paint(g, '#2B2F3A', 1);
}
export function makeMittens(shared, scale = 1, opts = {}) {
  const mat = litMat(shared, { name: '-mitten', amb: 1.3, rim: 0.9, side: THREE.DoubleSide, ...opts });
  const mk = (hand) => { const m = new THREE.Mesh(makeMittenGeometry(hand), mat); m.scale.setScalar(scale); m.name = 'ra-mitten'; m.frustumCulled = false; return m; };
  const group = new THREE.Group(), L = mk(-1), R = mk(1); group.add(L, R);
  return { group, L, R, mat };
}

// THE WAITER as camera A sees her: a hooded coat, the face one dark tone inside the hood, 3.75 m as built.
// Local frame: feet at the origin, facing +Z.
export function makeWaiter(shared) {
  const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h), coat = '#2B2F3A', face = '#1B1612';
  const parts = [
    paint(at(new THREE.CylinderGeometry(0.62, 0.8, 2.9, 12), 0, 1.45, 0), coat),
    paint(at(S(1), 0, 2.85, 0, 0, 0, 0, 0.85, 0.36, 0.5), coat),
    paint(at(S(1), 0, 3.3, -0.03, 0, 0, 0, 0.47, 0.5, 0.5), coat),
    paint(at(new THREE.ConeGeometry(0.3, 0.42, 10), 0, 3.66, -0.16, -0.5, 0, 0), coat),
    paint(at(new THREE.CircleGeometry(0.3, 14), 0, 3.27, 0.455, 0, 0, 0, 1, 1.12, 1), face),
  ];
  const mesh = new THREE.Mesh(merge(parts), litMat(shared, { name: '-waiter' })); mesh.name = 'ra-waiter';
  const armGeo = paint(new THREE.CylinderGeometry(0.13, 0.15, 1, 8).translate(0, 0.5, 0), coat);
  const armMat = litMat(shared, { name: '-arm' }), arms = [new THREE.Mesh(armGeo, armMat), new THREE.Mesh(armGeo, armMat)];
  const group = new THREE.Group(); group.add(mesh, arms[0], arms[1]);
  const d = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  // stretch arm i from a shoulder to a wrist (both in the group's local frame)
  const setArm = (i, from, to) => { const a = arms[i]; d.subVectors(to, from); const len = d.length(); a.position.copy(from); a.scale.set(1, Math.max(0.05, len), 1); a.quaternion.setFromUnitVectors(yAxis, d.divideScalar(Math.max(1e-4, len))); };
  return { group, mesh, arms, setArm, shoulders: [new THREE.Vector3(-0.72, 2.85, 0.1), new THREE.Vector3(0.72, 2.85, 0.1)] };
}

// THE FALCON: slate, 3 m span as built, pointed wings half folded in the stoop, talons open. Flies to -Z.
export function makeFalcon(shared, kind = 'falcon') {
  // the goshawk's deal: a hawk of the wood, its wings short, broad and round at the hand (primaries four fifths as long and half as wide again,
  // fanned a fifth wider, a deeper arm) and its tail a third longer; the falcon keeps its long pointed wing
  const gos = kind === 'goshawk', pl = gos ? 0.8 : 1, pw = gos ? 1.5 : 1, pf = gos ? 1.2 : 1, sl = gos ? 1.25 : 1, tl = gos ? 1.33 : 1;
  const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h), slate = '#59616E', pale = '#A9A294', buff = '#979083', yel = '#E0B93C', hood = '#23272E';
  const parts = [
    paint(at(S(1), 0, 0.02, 0, 0, 0, 0, 0.2, 0.15, 0.5), slate, 0), paint(at(S(1), 0, -0.05, -0.04, 0, 0, 0, 0.19, 0.15, 0.44), pale, 10),
    paint(at(S(0.125), 0, 0.04, -0.5), hood), paint(at(S(0.09, 10, 8), 0, -0.02, -0.52, 0, 0, 0, 1, 0.8, 1), pale, 10),
    paint(at(new THREE.ConeGeometry(0.038, 0.11, 6), 0, 0.0, -0.635, -2.0, 0, 0), yel),
    paint(at(S(0.022, 6, 5), 0.085, 0.07, -0.56), '#0A0A0A'), paint(at(S(0.022, 6, 5), -0.085, 0.07, -0.56), '#0A0A0A'),
  ];
  // one flight feather: a tapered blade lying in the wing's plane, root at the origin, tip along +X
  const blade = (len, wid, hex, part) => { const g = new THREE.PlaneGeometry(len, wid, 3, 1).translate(len / 2, 0, 0).rotateX(-Math.PI / 2), q = g.attributes.position;
    for (let i = 0; i < q.count; i++) { const t = q.getX(i) / len; q.setZ(i, q.getZ(i) * (1 - 0.85 * t * t * t) + 0.25 * wid * t); } g.computeVertexNormals(); return paint(g, hex, part); };
  for (let i = 0; i < 9; i++) parts.push(at(blade((0.62 - 0.05 * Math.abs(i - 4) * 0.5) * tl, 0.11, i % 2 ? buff : pale, 10), 0, 0.01 + 0.002 * i, 0.38, 0, -Math.PI / 2 + (i - 4) * 0.11, 0));   // tail fan
  for (const sx of [-1, 1]) {
    const wing = [];
    for (let i = 0; i < 7; i++) wing.push(at(blade(0.5 * sl, 0.17, i % 2 ? buff : pale, 10), 0.12 + i * 0.085, 0.004 * i, -0.02 + 0.03 * i, 0, -1.25 - 0.05 * i, 0));   // secondaries, trailing back
    for (let i = 0; i < 9; i++) wing.push(at(blade((0.58 + 0.34 * Math.sin(Math.PI * (0.2 + 0.8 * i / 8))) * pl, 0.105 * pw, i > 5 ? slate : i % 2 ? buff : pale, 10), 0.72 + i * 0.02, 0.03 + 0.003 * i, 0.06, 0, -1.2 + i * 0.125 * pf, 0));   // primaries from the wrist
    wing.push(paint(at(S(1, 10, 6), 0.42, 0.012, -0.03, 0, 0, 0, 0.42, 0.035, 0.13), pale, 10));           // the arm and its coverts
    for (const g of wing) { g.rotateZ(0.32); if (sx < 0) { g.scale(-1, 1, 1); const ix = g.attributes.position.array; for (let k = 0; k < ix.length; k += 9) for (let c = 0; c < 3; c++) { const t = ix[k + 3 + c]; ix[k + 3 + c] = ix[k + 6 + c]; ix[k + 6 + c] = t; } g.computeVertexNormals(); } parts.push(g); }
    parts.push(paint(at(new THREE.CylinderGeometry(0.045, 0.028, 0.34, 6), sx * 0.1, -0.27, -0.14, 0.55, 0, 0), pale, 10));                 // feathered leg
    for (let k = -1; k <= 1; k++) {
      parts.push(paint(at(new THREE.CylinderGeometry(0.018, 0.014, 0.16, 5), sx * 0.1 + k * 0.05, -0.47, -0.27, 1.25, 0, k * 0.45), yel));
      parts.push(paint(at(new THREE.ConeGeometry(0.016, 0.1, 4), sx * 0.1 + k * 0.1, -0.5, -0.4, 2.5, 0, k * 0.45), '#0C0B0A'));
    }
  }
  const mesh = new THREE.Mesh(merge(parts), litMat(shared, { side: THREE.DoubleSide, name: '-falcon', amb: 1.35, rim: 0.35 })); mesh.name = 'ra-falcon'; mesh.frustumCulled = false;
  return { mesh };
}

// the set-piece viewer: the pigeon alone in its braking pose, or the waiter's sill and mittens
export async function buildHero(ctx, opts = {}) {
  const shared = makeShared({ sunDir: new THREE.Vector3(-0.6, 0.4, -0.7) }), object = new THREE.Group();
  shared.uFogK.value = 0; let update = () => {};
  if ((opts.piece || 'pigeon') === 'pigeon') {
    const bird = makePigeon(shared); bird.group.position.y = 1.2; bird.group.rotation.y = Math.PI; object.add(bird.group);
    update = (dt, time) => { shared.uBeat.value = beatOf(time); shared.uBrake.value = 0.5 + 0.5 * Math.sin(time * 0.4); };
  } else {
    const mit = makeMittens(shared), w = makeWaiter(shared); await ctx.yield();
    mit.L.position.set(-0.9, 3.1, 0.7); mit.R.position.set(0.9, 3.1, 0.7); object.add(w.group, mit.group);
    w.setArm(0, w.shoulders[0], mit.L.position); w.setArm(1, w.shoulders[1], mit.R.position);
    update = (dt, time) => { shared.uBeat.value = beatOf(time); };
  }
  return { object, radius: 2, height: 3, center: new THREE.Vector3(0, 1.2, 0), anchors: {}, update, dispose() {}, ground: false, groundY: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// flight4, THING ONE (SILL_PAIL): the corn pail on the sill. A galvanised pail 0.5 m across at its rolled rim (0.494: the
// sill's top is drawn 6 mm over SILL_Y, and lying on it the rim's top must still be at 14.1) and 0.5 m
// tall with its heap of corn, built in its own frame (foot's middle at the origin, y up), then set down twice: standing,
// and lying on its side with the corn run out over the board. Everything is in metres of the sill; nothing is random
// (the kernels take a hash of their own index). o: x, y, z (the standing foot's middle), foot (x of the lying pail's foot
// end), stop, stop2 (x no kernel's middle passes: on the board, and at its outer edge), mid (+1 or -1: the side of the sill's middle), reach (metres of board from the mouth's
// outer rim to the board's outer edge), corn (a THREE.Color). Returns { up, down, lie: [x, z] of the lying pail's middle }.
const flip = (g) => {   // the inside of a wall: the same triangles wound the other way, normals turned in
  const p = g.attributes.position.array, n = g.attributes.normal.array;
  for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) { const a = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = a; const b = n[i + 3 + k]; n[i + 3 + k] = n[i + 6 + k]; n[i + 6 + k] = b; }
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  return g;
};
const h01 = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
export function makePail(o) {
  const tin = '#9AA6B0', bright = '#C6D0D8', dim = '#6E7880', RIM = 0.247, R1 = 0.237, R0 = 0.195, HT = 0.44, corn = o.corn, cornDk = o.corn.clone().multiplyScalar(0.62), cornLt = o.corn.clone().multiplyScalar(1.25);
  const kernel = (x, y, z, i, k = 1) => paint(at(new THREE.OctahedronGeometry(0.017 * k, 0), x, y, z, h01(i, 5) * 3, h01(i, 6) * 3, 0, 1.25, 0.7, 1), i % 3 === 0 ? cornLt : i % 3 === 1 ? corn : cornDk);
  // the tin: wall, rolled rim, foot hoop, two ears, and the wire bail fallen to the loft's side (-z), lying against the wall
  const shell = () => [
    paint(new THREE.CylinderGeometry(R1, R0, HT, 16, 1, true).translate(0, HT / 2, 0), tin),
    paint(new THREE.CylinderGeometry(RIM, RIM, 0.035, 16, 1, true).translate(0, HT - 0.012, 0), bright),
    paint(new THREE.RingGeometry(R1 - 0.004, RIM, 16).rotateX(-Math.PI / 2).translate(0, HT + 0.0055, 0), bright),
    paint(new THREE.CylinderGeometry(R0 + 0.006, R0 + 0.006, 0.03, 16, 1, true).translate(0, 0.02, 0), dim),
  ];
  const BAIL = RIM + 0.014, ear = (ax, s) => paint(new THREE.BoxGeometry(ax ? 0.05 : 0.03, 0.07, ax ? 0.03 : 0.05).translate(ax ? 0 : s * (RIM + 0.008), HT - 0.05, ax ? s * (RIM + 0.008) : 0), dim);
  // standing: heaped. The crown of the corn is the pail's top, 0.06 over the rim: 0.5 m in all
  // (the heap is 0.066 over its seat 0.03 inside the rim, and a kernel lying on its crown is 0.024 more: 0.44 - 0.03 + 0.066 + 0.024 = 0.5)
  const up = shell(), HEAP = 0.066;
  up.push(ear(0, 1), ear(0, -1), paint(new THREE.TorusGeometry(BAIL, 0.012, 4, 10, Math.PI).rotateX(-1.95).translate(0, HT - 0.05, 0), dim));   // the bail hangs from the ears down the loft's side of the wall
  up.push(paint(new THREE.SphereGeometry(R1 - 0.004, 12, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, HEAP / (R1 - 0.004), 1).translate(0, HT - 0.03, 0), corn));
  for (let i = 0; i < 22; i++) { const a = h01(i, 1) * 6.283, r = (R1 - 0.03) * Math.sqrt(h01(i, 2)); up.push(kernel(Math.cos(a) * r, HT - 0.03 + HEAP * Math.sqrt(Math.max(0, 1 - (r / (R1 - 0.004)) ** 2)) + 0.002, Math.sin(a) * r, i)); }
  const gUp = merge(up).translate(o.x, o.y, o.z);
  // lying: its length along the sill, mouth toward the sill's middle, resting on rim and foot (so it tips 6.8 degrees and
  // its highest point, the rim's top, is 0.498 over the board), its foot's end at o.foot
  const tilt = Math.atan2(RIM - (R0 + 0.006), HT - 0.03), rot = new THREE.Matrix4().makeRotationZ(-o.mid * (Math.PI / 2 - tilt));
  const down = shell(); down.push(ear(1, 1), ear(1, -1));   // it has rolled a quarter turn as it went over: the ears are at its two sides
  down.push(flip(paint(new THREE.CylinderGeometry(R1 - 0.006, R0 - 0.006, HT - 0.01, 16, 1, true).translate(0, HT / 2 + 0.005, 0), dim)));
  down.push(paint(new THREE.CircleGeometry(R0 + 0.006, 16).rotateX(Math.PI / 2).translate(0, 0.006, 0), dim));                       // the foot's own disc
  down.push(paint(new THREE.CircleGeometry(R0, 16).rotateX(-Math.PI / 2).translate(0, 0.02, 0), tin));                               // the bottom, seen down the mouth
  const gTin = merge(down); gTin.applyMatrix4(rot);
  const mouthC = new THREE.Vector3(0, HT, 0).applyMatrix4(rot), midC = new THREE.Vector3(0, HT / 2, 0).applyMatrix4(rot);
  // THE ONE MEND, P1: it lies where it fell, its foot's end o.foot (0.30 m clear of the door post's face)
  gTin.computeBoundingBox(); const footEnd = o.mid > 0 ? gTin.boundingBox.min.x : gTin.boundingBox.max.x;
  const off = new THREE.Vector3(o.foot - footEnd, o.y + RIM - mouthC.y, o.z);   // the mouth's middle stands one rim radius over the board
  gTin.translate(off.x, off.y, off.z);
  const mx = mouthC.x + off.x, sp = [];   // the mouth's place on the board
  // the bail has swung down on its ears and hangs before the mouth, its bow resting on the board (the bow is 0.264 from
  // the ears and the ears 0.25 over the board, so it leans 18.7 degrees out)
  { const lean = Math.acos(Math.min(1, (RIM - 0.012) / BAIL)), X = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(o.mid * Math.sin(lean), -Math.cos(lean), 0), Z = new THREE.Vector3().crossVectors(X, Y);
    const b = new THREE.TorusGeometry(BAIL, 0.012, 4, 10, Math.PI); b.applyMatrix4(new THREE.Matrix4().makeBasis(X, Y, Z)); sp.push(paint(b.translate(mx - o.mid * 0.045, o.y + RIM, o.z), dim)); }
  // what is left in it: corn lying along the low side of the wall, from the mouth a third of the way in
  // (THE ONE MEND, P2: it is the heap's own stuff, kernels on a dark bed, 0.085 high inside the lip: no smooth yellow dome)
  sp.push(paint(at(new THREE.SphereGeometry(1, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), mx - o.mid * 0.1, o.y + 0.012, o.z, 0, 0, 0, 0.2, 0.085, 0.2), cornDk));
  for (let i = 0; i < 26; i++) { const a = h01(i, 17) * 6.283, rho = Math.sqrt(h01(i, 18)) * 0.94, hx = Math.min(0.2 * rho * Math.cos(a), 0.1);   // none beyond the mouth's plane: there the mound begins
    sp.push(kernel(mx - o.mid * (0.1 - hx), o.y + 0.012 + 0.085 * Math.sqrt(1 - rho * rho) + 0.004, o.z + 0.2 * rho * Math.sin(a), i + 140, 1.15)); }
  // THE ONE MEND, P2: the spill is a heap of kernels, not a patch. A low mound before the mouth: highest (HP) at the mouth's
  // lower lip, run out toward the sill's middle as far as o.stop (the gripping hand's wool less 0.10 m and half a kernel)
  // and 0.30 m either way along the mouth (the rim's 0.247 and a slump of 0.05); kernels 1.15 times the standing pail's lie
  // all over it, sunk a third into it. Beyond it single kernels thin out across the board toward its outer edge, where
  // six lie 1 cm inside the edge (no nearer the middle than o.stop2: the hand's knuckles are over the edge there)
  const HP = 0.075, RX = o.mid * (o.stop - mx), RZ = 0.30, zEdge = o.z + 0.25 + o.reach;
  { const g = new THREE.SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setXYZ(k, (x > 0 ? x * (RX + 0.012) : x * 0.045) * o.mid, p.getY(k) * HP, p.getZ(k) * (RZ + 0.012)); }
    if (o.mid < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } } g.computeVertexNormals(); sp.push(paint(g.translate(mx, o.y, o.z), cornDk)); }
  for (let i = 0; i < 64; i++) {   // on the mound: even over its plan, each on the mound's own surface
    const a = (h01(i, 3) - 0.5) * Math.PI, rho = Math.sqrt(h01(i, 4)) * 0.97, hx = RX * rho * Math.cos(a), hz = RZ * rho * Math.sin(a);
    sp.push(kernel(mx + o.mid * hx, o.y + HP * Math.sqrt(1 - rho * rho) + 0.004, o.z + hz, i + 40, 1.15));
  }
  for (let i = 0; i < 20; i++) {   // off the mound: on the board, fewer the farther; the last six at its outer edge
    const edge = i >= 14, a = 0.25 + h01(i, 7) * (Math.PI / 2 - 0.25), rho = 1.08 + 0.5 * h01(i, 8) * h01(i, 8);
    const kx = edge ? o.mid * (o.stop2 - mx) - 0.16 * h01(i, 8) : RX * Math.min(1, rho * Math.cos(a)), kz = edge ? zEdge - 0.01 : Math.min(o.z + RZ * rho * Math.sin(a), zEdge - 0.01);
    sp.push(kernel(mx + o.mid * kx, o.y + 0.011, kz, i + 110, 1.15));
  }
  const gDown = merge([gTin, ...sp]);
  return { up: gUp, down: gDown, lie: [midC.x + off.x, o.z], heap: [mx + o.mid * RX * 0.4, o.z, RX, RZ, HP], mouth: mx, tilt };
}

// ---------------------------------------------------------------------------------------------------------------
// flight4, THING TWO (BARN_FACE): parts of the barn itself, returned as painted pieces: `leaves` for the live door-frame
// mesh (the lower leaf's own mesh: the same oak in the same light), `lean` for the live farm mesh.
// (a) the hay door's two upper leaves thrown open flat against the gable, outside the jambs; (b) the lean-to's end wall
// toward the valley: its own top closed up to the roof, a plank door, a window of dark glass, a slate verge and a
// bargeboard. All in the barn's metres; nothing random. o: doorZ, sillY, lintelY, x0, x1 (the leaf's near and far edge
// from the door's middle), wallZ (the lean-to's end wall), lx0, lx1, wallTop, roof: { x, y, z, ang, len, wid, thick }
const bx = (x0, x1, y0, y1, z0, z1, hex, part = 0) => paint(new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), hex, part);
export function makeBarnFace(o) {
  const leaves = [], oak = ['#4A3828', '#42311F'], ledge = '#8B7355', z0 = o.doorZ, zl = o.doorZ + 0.12, zb = o.doorZ + 0.2;
  let out = leaves;
  for (const s of [-1, 1]) {
    const w = o.x1 - o.x0, pitch = w / 4;   // four planks to a leaf: 0.4 m boards 0.425 apart (the lower leaf's are 0.47 at 0.5)
    for (let k = 0; k < 4; k++) out.push(bx(s * (o.x0 + k * pitch + 0.0125), s * (o.x0 + (k + 1) * pitch - 0.0125), o.sillY, o.lintelY, z0, zl, oak[k % 2], 5));
    // three ledges across the planks and two braces between them, rising from the hinge side: a ledged and braced door
    const ys = [o.sillY + 0.2, (o.sillY + o.lintelY) / 2 - 0.125, o.lintelY - 0.45];
    for (const y of ys) out.push(bx(s * (o.x0 + 0.06), s * (o.x1 - 0.06), y, y + 0.25, zl, zb, ledge, 6));
    for (let k = 0; k < 2; k++) { const ya = ys[k] + 0.25, yb = ys[k + 1], dx = w - 0.3, len = Math.hypot(dx, yb - ya);
      out.push(paint(new THREE.BoxGeometry(len, 0.2, zb - zl).rotateZ(s * Math.atan2(yb - ya, dx)).translate(s * (o.x0 + w / 2), (ya + yb) / 2, (zl + zb) / 2), ledge, 6)); }
  }
  // the lean-to's end: the wall's own top, from the box's top to the underside of the roof
  const lean = []; out = lean;
  const r = o.roof, tn = Math.tan(r.ang), under = (x) => r.y + (x - r.x) * tn - r.thick / 2 / Math.cos(r.ang), wz = o.wallZ;
  { const sh = new THREE.Shape(); sh.moveTo(o.lx0, o.wallTop); sh.lineTo(o.lx1, o.wallTop); sh.lineTo(o.lx1, under(o.lx1)); sh.lineTo(o.lx0, under(o.lx0)); sh.closePath();
    out.push(paint(new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false }).translate(0, 0, wz - 0.4), '#7B7C80', 4)); }
  // plank door 2.2 by 4.4, its stone lintel; window 1.5 by 1.8, heads level. From our line (x 0) the barn's own corner
  // (x -12, 8 m nearer the valley than this wall) covers the wall's inner end on the last 40 m, so the door stands at the
  // wall's outer end, half a metre from its corner, and the window 0.9 m beyond the door
  const dxa = o.lx0 + 0.5, dxb = dxa + 2.2, wxa = dxb + 0.9, wxb = wxa + 1.5, head = 4.4, wy0 = head - 1.8, quoin = '#8F9094', trim = '#C9C0B0';
  out.push(bx(dxa, dxb, 0, head, wz - 0.1, wz + 0.1, '#2E2218', 5), bx(dxa - 0.25, dxb + 0.25, head, head + 0.45, wz - 0.05, wz + 0.14, quoin, 4));
  out.push(bx(dxa + 0.25, dxa + 0.45, 2.1, 2.3, wz + 0.1, wz + 0.17, '#101114'));                                    // its latch
  out.push(bx(wxa, wxb, wy0, head, wz - 0.05, wz + 0.03, '#1D2A3B'));                                                // dark glass: the sky's tone, no lamp behind it
  out.push(bx(wxa - 0.12, wxb + 0.12, head, head + 0.4, wz - 0.05, wz + 0.14, quoin, 4), bx(wxa - 0.2, wxb + 0.2, wy0 - 0.22, wy0, wz - 0.05, wz + 0.2, quoin, 4));
  for (const x of [wxa, (wxa + wxb) / 2, wxb]) out.push(bx(x - 0.06, x + 0.06, wy0, head, wz, wz + 0.09, trim));
  for (const y of [wy0 + 0.06, (wy0 + head) / 2, head - 0.06]) out.push(bx(wxa, wxb, y - 0.06, y + 0.06, wz, wz + 0.09, trim));
  // the roof's end: a course of slate standing a little over the slope, and a bargeboard under it 0.5 m proud of the wall
  const nx = -Math.sin(r.ang), ny = Math.cos(r.ang), zEnd = r.z + r.len / 2;
  out.push(paint(new THREE.BoxGeometry(r.wid + 0.1, 0.14, 0.6).rotateZ(r.ang).translate(r.x + nx * (r.thick / 2 + 0.07), r.y + ny * (r.thick / 2 + 0.07), zEnd - 0.25), '#56606F', 3));
  out.push(paint(new THREE.BoxGeometry(r.wid, 0.5, 0.22).rotateZ(r.ang).translate(r.x + nx * (r.thick / 2 - 0.25), r.y + ny * (r.thick / 2 - 0.25), wz + 0.5), '#3A2A1C', 6));
  return { leaves, lean };
}

// flight4, THING THREE (YARD_WAGON): a hay wagon at the farm's three times scale, side-on to the valley, half unloaded.
// o: x0, x1 (the bed's two ends: x0 is the tail, toward the hay door; the shafts go out beyond x1), z0, z1 (its two sides),
// ground, bedY (the floor's top), topY (the thing's top: the end gates' top rails), load (the hay's top), wheel (diameter).
// Lumps take a hash of their own index.
export function makeWagon(o) {
  const out = [], wood = '#8B7355', dark = '#5E4A36', iron = '#3A2A1C', zc = (o.z0 + o.z1) / 2, hw = (o.z1 - o.z0) / 2, R = o.wheel / 2, ay = o.ground + R, fl = 0.3;
  const wheelX = [o.x0 + R + 0.25, o.x1 - R - 0.25], wz = hw - 0.18;
  for (const x of wheelX) {
    for (const s of [-1, 1]) {
      const z = zc + s * wz, w = [paint(new THREE.TorusGeometry(R - 0.16, 0.16, 4, 16), wood), paint(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 8).rotateX(Math.PI / 2), iron)];
      for (let k = 0; k < 10; k++) w.push(paint(new THREE.CylinderGeometry(0.07, 0.1, R - 0.5, 4, 1, true).translate(0, (R - 0.5) / 2 + 0.3, 0).rotateZ(k * Math.PI / 5 + 0.2), dark));
      for (const g of w) out.push(g.translate(x, ay, z));
    }
    out.push(bx(x - 0.16, x + 0.16, ay - 0.16, ay + 0.16, zc - wz, zc + wz, iron));                                   // axle
    out.push(bx(x - 0.3, x + 0.3, ay + 0.16, o.bedY - fl, zc - hw + 0.5, zc + hw - 0.5, dark, 7));                     // bolster
  }
  out.push(bx(o.x0, o.x1, o.bedY - fl, o.bedY, zc - hw + 0.42, zc + hw - 0.42, wood, 6));                              // the floor, between the wheels
  const raveY = o.ground + o.wheel + 0.12;                                                                              // the raves clear the wheels' tops
  for (const s of [-1, 1]) {
    out.push(bx(o.x0, o.x1, raveY, raveY + 0.2, zc + s * (hw - 0.3), zc + s * hw, wood, 6));
    for (let k = 0; k <= 6; k++) { const x = o.x0 + 0.1 + k * (o.x1 - o.x0 - 0.2) / 6; out.push(bx(x - 0.08, x + 0.08, o.bedY, raveY, zc + s * (hw - 0.4), zc + s * (hw - 0.26), dark, 5)); }
  }
  // THE ONE MEND, W3: the wagon's own timber stands over its hay. A hay ladder (an end gate) at each end, the bed's whole
  // width: two stiles 0.22 m square standing in the raves, 0.36 m in from the bed's end and leaning out 8 degrees (as
  // first built), three rungs 0.2 m square and a top rail 0.22 square whose upper face is the thing's top (o.topY). The
  // rungs are a quarter of the stile apart. No member is thinner than a spoke (0.14 to 0.2)
  const lean = Math.asin(0.36 / 2.6), sz = hw - 0.15, railY = o.topY - 0.11, rise = railY - raveY, over = rise * Math.tan(lean), sl = rise / Math.cos(lean) + 0.09;
  for (const e of [[o.x0 + 0.36, -1], [o.x1 - 0.36, 1]]) {
    for (const s of [-1, 1]) out.push(paint(new THREE.BoxGeometry(0.22, sl, 0.22).translate(0, sl / 2, 0).rotateZ(-lean * e[1]).translate(e[0], raveY, zc + s * sz), wood, 5));
    for (let k = 1; k <= 4; k++) { const t = k / 4, th = k === 4 ? 0.22 : 0.2; out.push(paint(new THREE.BoxGeometry(th, th, 2 * hw).translate(e[0] + e[1] * over * t, raveY + rise * t, zc), k === 4 ? wood : dark, 7)); }
  }
  // a top rail along each side from one gate's stile to the other's, and five staves 1.8 m apart standing on the rave
  // over every stanchion but the two at the gates: the side is a ladder too, and the hay lies inside it
  for (const s of [-1, 1]) {
    out.push(bx(o.x0 + 0.36 - over, o.x1 - 0.36 + over, railY - 0.11, railY + 0.11, zc + s * (sz - 0.11), zc + s * (sz + 0.11), wood, 6));
    for (let k = 1; k <= 5; k++) { const x = o.x0 + 0.1 + k * (o.x1 - o.x0 - 0.2) / 6; out.push(bx(x - 0.08, x + 0.08, raveY + 0.2, railY - 0.11, zc + s * (sz - 0.08), zc + s * (sz + 0.08), dark, 5)); }
  }
  // the shafts, let down: from under the front of the bed to the ground 5.4 m out
  { const xa = o.x1 - 0.4, ya = ay + 0.3, xb = o.x1 + 5.4, yb = o.ground + 0.12, len = Math.hypot(xb - xa, yb - ya), ang = Math.atan2(yb - ya, xb - xa);
    for (const s of [-1, 1]) out.push(paint(new THREE.BoxGeometry(len, 0.2, 0.2).rotateZ(ang).translate((xa + xb) / 2, (ya + yb) / 2, zc + s * 0.95), wood, 6));
    out.push(bx(o.x1 + 0.5, o.x1 + 0.7, ay + 0.02, ay + 0.2, zc - 1.05, zc + 1.05, dark, 7)); }
  // the load: nine lumps of straw in a row, stepping down from the shafts' end toward the tail. THE ONE MEND, W3: its
  // highest lump's top is o.load (0.55 m under the top rail's underside); no lump passes the front gate (the first
  // middle is 2.1 m in from the bed's end: a lump is at most 1.57 long by half, the gate's foot 0.36 in) or lies on the
  // tail third of the bed (the last middle is 1.7 m up from it), and none is wider by half than hw - 0.75 about a
  // middle at most 0.1 off the bed's: the raves (inner face at hw - 0.3), their stanchions and the wheel tops stay bare
  const lumps = [], N = 9, xa = o.x1 - 2.1, xb = o.x0 + (o.x1 - o.x0) / 3 + 1.7;
  for (let i = 0; i < N; i++) {
    const step = Math.floor(i / 3), top = o.load - 0.95 * step - 0.5 * (i % 3) * (0.4 + 0.6 * h01(i, 11)) - (i ? 0.1 : 0), x = xa + (xb - xa) * i / (N - 1) + 0.25 * (h01(i, 12) - 0.5);
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, hy = (top - o.bedY) / 2 + 0.15;
    for (let k = 0; k < p.count; k++) { const px = p.getX(k), py = p.getY(k), pz = p.getZ(k), b = 1 + 0.1 * Math.sin(px * 4.1 + i * 1.7) * Math.sin(pz * 3.3 + i) + 0.06 * Math.sin(py * 5.2 + px * 2 + i * 2.9);
      p.setXYZ(k, px * b * (1.15 + 0.2 * h01(i, 13)), py * hy * (py > 0 ? 1 : 0.6), pz * b * (hw - 0.75) * (0.88 + 0.12 * h01(i, 14))); }
    g.computeVertexNormals(); lumps.push(paint(g.translate(x, o.bedY + hy * 0.6 - 0.05, zc + 0.2 * (h01(i, 15) - 0.5)), new THREE.Color('#C9B274').multiplyScalar(0.85 + 0.3 * h01(i, 16)), 8));
  }
  let ymax = -1e9; for (const g of lumps) { const p = g.attributes.position; for (let k = 0; k < p.count; k++) ymax = Math.max(ymax, p.getY(k)); }
  let zmax = 0; for (const g of lumps) { const p = g.attributes.position; for (let k = 0; k < p.count; k++) zmax = Math.max(zmax, Math.abs(p.getZ(k) - zc)); }
  const sy = (o.load - o.bedY) / (ymax - o.bedY), sw = (hw - 0.75) / zmax;   // the highest lump's top is exactly the load's top; the widest reaches exactly hw - 0.75 from the bed's middle
  for (const g of lumps) { g.translate(0, -o.bedY, -zc).scale(1, sy, sw).translate(0, o.bedY, zc); out.push(g); }
  return out;
}

// flight4, THING FOUR (FIELD_STACKS): one stack of round bales as a single geometry at the live bale's own size (radius 1,
// 1.5 long): three tiers of 9, 8 and 7, one bale deep, the bales' axes along z (the valley), so the row is 18 m long
// along x and 2 + 2 * 1.732 = 5.46 m high. Each round end carries the coil of the rolled straw: a darker heart, a paler
// turn, a darker turn, the pale rim (rings of vertex colour on the end toward +z, the end we fly at; a plain dark-hearted
// disc on the other). Origin: the row's middle on the ground.
export function makeStackGeometry() {
  const straw = new THREE.Color('#C9B274'), coil = new THREE.Color('#A88A4A'), SEG = 10, HL = 0.75, list = [];
  const disc = (zs, rings) => {   // rings: [radius, colour] from the middle out
    const pos = [], col = [], ring = (k, a) => [rings[k][0] * Math.cos(a), rings[k][0] * Math.sin(a)];
    const put = (x, y, c) => { pos.push(x, y, zs * HL); col.push(c.r, c.g, c.b); };
    for (let s = 0; s < SEG; s++) { const a0 = s / SEG * 6.2832, a1 = (s + 1) / SEG * 6.2832;
      for (let k = 0; k + 1 < rings.length; k++) {
        const p0 = ring(k, a0), p1 = ring(k, a1), q0 = ring(k + 1, a0), q1 = ring(k + 1, a1), c0 = rings[k][1], c1 = rings[k + 1][1];
        const tris = k === 0 && rings[0][0] === 0 ? [[p0, c0], [q0, c1], [q1, c1]] : [[p0, c0], [q0, c1], [q1, c1], [p0, c0], [q1, c1], [p1, c0]];
        for (let t = 0; t < tris.length; t += 3) { const o = zs > 0 ? [0, 1, 2] : [0, 2, 1]; for (const i of o) put(tris[t + i][0][0], tris[t + i][0][1], tris[t + i][1]); } } }
    const g = new THREE.BufferGeometry(), n = pos.length / 3, nor = new Float32Array(n * 3), pt = new Float32Array(n).fill(8);
    for (let i = 0; i < n; i++) nor[i * 3 + 2] = zs;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3)); g.setAttribute('aPart', new THREE.BufferAttribute(pt, 1)); return g;
  };
  const mid = straw.clone().lerp(coil, 0.5);
  for (let t = 0; t < 3; t++) for (let j = 0, n = 9 - t; j < n; j++) {
    const x = (j - (n - 1) / 2) * 2, y = 1 + t * 1.732;
    list.push(paint(new THREE.CylinderGeometry(1, 1, 2 * HL, SEG, 1, true).rotateX(Math.PI / 2), '#C9B274', 8).translate(x, y, 0));
    list.push(disc(1, [[0, coil], [0.42, straw], [0.74, coil], [1, straw]]).translate(x, y, 0), disc(-1, [[0, coil], [1, mid]]).translate(x, y, 0));
  }
  return merge(list);
}
