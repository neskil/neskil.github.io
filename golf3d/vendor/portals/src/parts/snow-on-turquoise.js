// HERO SET PIECE for "snow-on-turquoise" (Snow on Turquoise): THE GREAT DOME IN THE TEARING SQUALL.
//
// WHAT IT IS
//   A Timurid mausoleum dome: octagonal brick base hall (13 m) with eight tiled arch niches and a tall gateway
//   slab on the front, a 26 m tiled drum (banna'i diamond brickwork, eight grille windows, a 4 m band of
//   ochre-and-cobalt interlace between gold collars, a three-tier scalloped cornice at 30 m) and above it the
//   bulbous dome, 30 m across at its bulge, of 64 glazed turquoise ribs with crazing, lozenge inlay, repairs
//   and lost tiles. EVERY GROOVE HOLDS A STRIP OF PACKED SNOW (64 separate strips, ragged, per-seed), so the
//   dome reads as white and turquoise stripes converging on a gold finial (crown 58 m, finial 64 m).
//   The scripted beat: when the cloud-shadow edge crosses, the sun rakes the ribs (crests flash, grooves drop
//   to cobalt, snow goes from grey to bright), spindrift smoking off the crown lights up as ice dust, and the
//   snow below the bulge in three neighbouring grooves on the camera side LETS GO: a slab slides down the curve gathering
//   speed, leaves a wet darker groove with running meltwater glints, hits the cornice and bursts into tumbling
//   chunks and a powder cloud that falls away. Two free-standing leaning minarets stand south of the dome.
//
// LOCAL SPACE  origin = centre of the base on the ground, +Y up, front (gateway slab) = +Z = SOUTH,
//   +X = EAST. Put object.position at the brief's (-300, 0, -50) with no rotation and everything lines up:
//   the camera's close pass is the WEST flank (local x = -32, y = 42), the slab is on -X.
//
// OPTS (all optional)
//   palette    7 hex strings, brief order [snow, turquoise, cobalt, deep cobalt, gold-ochre, orange, buff]
//   minarets   true (default): build the two leaning minarets at local (-22,130) and (-34,80)
//   slabAngle  direction of the sliding slab seen from above, radians from +X toward +Z (default PI = west)
//   duration   seconds the whole flight takes (default 41); turns path u into slide seconds
//   releaseU   u at which the slab lets go (default 0.47); lightU = u the shadow edge crosses (default 0.46)
//   relV       [v0, v1, v2] where along each of the three grooves (0 crown .. 1 cornice) the slab's top edge is
//   sunDir     Vector3 TO the sun, local space (default brief: -0.35, 0.42, 0.84)
//   dust       true (default): ice-dust glints round the dome
//
// RETURNS (besides the contract fields)
//   setProgress(u)   path u 0..1. Drives the slab (release at releaseU, about 3.4 s of slide and burst),
//                    the sun strength (0.1 in the squall, full just after the edge has crossed), the fill
//                    (flat grey-white in the squall, blue hemisphere once clear) and the travelling shadow
//                    edge (a line moving north-east, crossing the dome centre at lightU, 30 m soft). Until the first call the piece
//                    demo-loops on time (full sun, slab every 10 s) so it is alive in the part viewer.
//   setLight({ sun, sunColor, sunAmount, sky, bounce, edge })   any subset, call AFTER setProgress each frame
//                    to override: sun = Vector3 to the sun, sunAmount 0..1, edge = [nx, nz, d, soft] the
//                    world-space shadow line (lit where nx*x + nz*z < d).
//   uniforms         the shared uniform block (uSunDir, uSunCol, uSunAmt, uEdge, uSky, uBounce, uWind, uTime; uKey, uShaft and
//                    uShaft2 are the squall's own light: a soft key and two breaks in the cloud, x, z, 1 / radius, strength);
//                    uSunDir and uEdge are WORLD space, uWind (xyz direction, w speed) is local.
//
// ANCHORS (local space)
//   closePass     ordered points of the west-flank pass (17 m off the ribs at 42 m up, so the whole dome fits the
//                 frame) and the arc round the north shoulder at 22 m off the ribs: a safe camera line
//   flyThrough    longer line: between the two minarets, up the west flank, round the north shoulder, away east
//   lookAt        point on the dome the camera's point of interest should hold (the sliding groove at bulge)
//   slab          { top, bulge, cornice, outward }: where the slab starts, passes and bursts
//   crown, finialTip, corniceRing { y, radius }, drum { radius }, minarets [{ base, top, lean }]
//   viewpoints    { south, west, reveal } good still positions looking at `center`
//   portalSeat    the hero holds no portal (it sits in the east madrasa); given only as a fallback:
//                 inside the front gateway arch, facing +Z
//
// SIZE   radius 36 (dome group; minarets stand outside it up to 132 m south), height 64.
// COST   about 96k triangles, 7 draw calls (dome, drum+hall+minarets, snow, chunks, powder, spindrift, ice
//        dust), no lights, no textures, build about 180 ms. ctx.quality.detail thins only the ice dust.
// LIGHT  Self-lit ShaderMaterials (scene lights ignored, scene fog honoured): low sun from the SSW with a
//        tight glaze highlight that blooms, strong blue hemisphere fill so all shadow is cobalt, lit snow
//        held near 0.75. Wants a cold blue sky or the slate squall wall behind it.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const NRIB = 64;
const PROF_N = 48;           // profile table segments (equal arc length, v = 0 crown .. 1 cornice)
const Y_BASE = 30.3, Y_BULGE = 40.5, Y_CROWN = 58, R_BULGE = 15, RIB_A = 0.46, LOBE_P = 0.85;
const DEFAULT_PALETTE = ['#F4F8FB', '#19B3AE', '#1D4FA8', '#13235A', '#D59B2C', '#EE6A1F', '#9C8468'];

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// radius of the smooth dome (no ribs) at height y
function domeR(y) {
  if (y >= Y_BULGE) { const t = Math.min(1, (y - Y_BULGE) / (Y_CROWN - Y_BULGE)); return R_BULGE * Math.pow(Math.max(0, 1 - Math.pow(t, 1.9)), 0.62); }
  const s = (Y_BULGE - y) / (Y_BULGE - Y_BASE); return R_BULGE - 1.6 * s * s;
}
// equal-arc-length table of the meridian from crown (index 0) to the cornice (index PROF_N)
function makeProfile() {
  const M = 800, pr = [], py = [], acc = [0];
  for (let i = 0; i <= M; i++) { const y = Y_CROWN - (Y_CROWN - Y_BASE) * (i / M); pr.push(domeR(y)); py.push(y); }
  for (let i = 1; i <= M; i++) acc.push(acc[i - 1] + Math.hypot(pr[i] - pr[i - 1], py[i] - py[i - 1]));
  const L = acc[M], tab = [];
  let j = 0;
  for (let k = 0; k <= PROF_N; k++) {
    const d = (k / PROF_N) * L;
    while (j < M - 1 && acc[j + 1] < d) j++;
    const t = (d - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
    tab.push(new THREE.Vector2(pr[j] + (pr[j + 1] - pr[j]) * t, py[j] + (py[j + 1] - py[j]) * t));
  }
  const tn = tab.map((_, k) => tab[Math.min(PROF_N, k + 1)].clone().sub(tab[Math.max(0, k - 1)]).normalize());
  return { tab, tn, length: L };
}
// profile lookup: point and outward normal (in the r,y plane) at v in 0..1
function profAt(P, v, out) {
  const f = Math.min(1, Math.max(0, v)) * PROF_N, i = Math.min(PROF_N - 1, Math.floor(f)), t = f - i;
  const a = P.tab[i], b = P.tab[i + 1];
  const ta = P.tn[i], tb = P.tn[i + 1];
  let tx = ta.x + (tb.x - ta.x) * t, ty = ta.y + (tb.y - ta.y) * t; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
  out.r = a.x + (b.x - a.x) * t; out.y = a.y + (b.y - a.y) * t; out.nr = -ty; out.ny = tx;
  return out;
}
const ribAmp = (r) => RIB_A * sstep(0.6, 6, r) * Math.sqrt(Math.min(1, r / R_BULGE));
const lobe = (x) => Math.pow(Math.max(0, Math.cos(x * Math.PI * 0.5)), LOBE_P);   // x in -1..1, 0 = rib crest

// ---------------------------------------------------------------- shared GLSL
export const GLSL_LIGHT = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uSky, uBounce;
  uniform float uSunAmt, uTime, uFogCap, uFogTop, uKey, uGhost;
  uniform vec4 uEdge, uShaft, uShaft2;
  vec3 hemi(vec3 n) { return mix(uBounce, uSky, clamp(n.y * 0.5 + 0.5, 0.0, 1.0)); }
  float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.13 + 7.1) + 0.2 * vnoise(p * 4.31 + 3.7); }
  // the sun: full behind the travelling cloud-shadow edge; ahead of it a share (uKey) comes through the squall as a
  // soft key, and one ragged hole in the cloud (uShaft: x, z, 1 / radius, strength) lays a pool of light on the city
  // (uShaft2: a second, wider break in the cloud that travels with the wind over the roofs the flight opens on)
  float shaftAt(vec2 p) { return uShaft.w * (1.0 - smoothstep(0.3, 1.0, length((p - uShaft.xy) * uShaft.z))) + 0.3 * uShaft2.w * (1.0 - smoothstep(0.2, 1.0, length((p - uShaft2.xy) * uShaft2.z))); }
  // far air beyond the cloud-shadow edge lies under the storm: its haze is darker than the lit air this side of it
  float fogShade(vec3 wp, float dist) { return mix(1.0, 0.64, smoothstep(-uEdge.w, uEdge.w * 4.0, dot(wp.xz, uEdge.xy) - uEdge.z) * smoothstep(400.0, 1400.0, dist) * smoothstep(0.5, 1.0, uSunAmt)); }
  float sunMask(vec3 wp) {
    float d = dot(wp.xz, uEdge.xy) - uEdge.z;
    float rag = vnoise(wp.xz * 0.021 + uTime * 0.02) - 0.5;
    float hole = uShaft.w * (1.0 - smoothstep(0.3, 1.0, length((wp.xz - uShaft.xy) * uShaft.z) + rag * 0.5));
    float hole2 = uShaft2.w * (1.0 - smoothstep(0.42, 1.0, length((wp.xz - uShaft2.xy) * uShaft2.z) + rag * 0.3 + (vnoise(wp.xz * 0.0085 - uTime * 0.012 + 5.0) - 0.5) * 0.6));
    hole2 *= 0.42 + 0.58 * smoothstep(0.3, 0.6, vnoise(wp.xz * 0.028 - uTime * vec2(0.19, -0.165)));      // shreds of cloud crossing it on the wind
    return max(uSunAmt * (1.0 - smoothstep(-uEdge.w, uEdge.w, d)), max(uKey, max(hole, hole2)));
  }
`;
// fog with a ceiling (uFogCap): landmarks stay as ghosts in the whiteout instead of vanishing
const GLSL_FOG_OUT = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    fogF *= 1.0 - smoothstep(uFogTop, uFogTop + 12.0, vWP.y);      // freezing fog burns off from the top
    // under the hole in the squall the falling snow itself is lit: the air there glows warm
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * fogShade(vWP, vFogDepth) + uSunCol * 0.1 * shaftAt(vWP.xz), min(fogF, uFogCap));
  #endif
`;
// world-space sun shadows from a few boxes (xyz min / max) and upright cylinders (x, z, radius, height)
export function worldCastGLSL(nb, nc) {
  return /* glsl */`
  uniform vec4 uBoxA[${nb}], uBoxB[${nb}], uCyl[${nc}];
  float worldShadow(vec3 p, vec3 sd, float cyl) {
    float sh = 1.0;
    vec3 inv = 1.0 / (sign(sd) * max(abs(sd), vec3(1e-3)) + vec3(1e-6));
    for (int i = 0; i < ${nb}; i++) {
      vec3 t1 = (uBoxA[i].xyz - p) * inv, t2 = (uBoxB[i].xyz - p) * inv;
      vec3 lo = min(t1, t2), hi = max(t1, t2);
      float tn = max(max(lo.x, lo.y), lo.z), tf = min(min(hi.x, hi.y), hi.z);
      sh *= 1.0 - smoothstep(0.0, 1.2, tf - max(tn, 0.0)) * step(0.0, tf);
    }
    vec2 d = sd.xz; float dl = max(length(d), 1e-3); d /= dl;
    for (int i = 0; i < ${nc}; i++) {
      vec2 o = uCyl[i].xy - p.xz; float al = dot(o, d), pe = abs(o.x * d.y - o.y * d.x);
      float y = p.y + sd.y * (al / dl);
      // a negative radius marks a tree crown: it floats above 0.35 h and lets light through
      float rr = abs(uCyl[i].z), crown = step(uCyl[i].z, 0.0);
      float dap = smoothstep(0.34, 0.5, vnoise((p.xz + d * al * 0.35) * 0.9 + float(i) * 7.3)) * (0.55 + 0.45 * step(0.4, vnoise(p.xz * 2.6 + float(i) * 3.1)));
      float band = (1.0 - smoothstep(uCyl[i].w - 2.0, uCyl[i].w + 1.0, y)) * mix(1.0, 0.95 * dap * smoothstep(0.28 * uCyl[i].w, 0.42 * uCyl[i].w, y), crown);
      sh *= 1.0 - cyl * (1.0 - smoothstep(rr * mix(0.75, 0.5, crown), rr * 1.15 + 0.004 * al, pe)) * step(0.0, al) * band;
    }
    return sh;
  }`;
}
// dome meridian lookup shared by the snow strips (vertex shader)
const GLSL_PROF = /* glsl */`
  uniform vec2 uProf[${PROF_N + 1}];
  float ribAmp(float r) { return ${RIB_A.toFixed(3)} * smoothstep(0.6, 6.0, r) * sqrt(min(1.0, r / ${R_BULGE.toFixed(1)})); }
  void profAt(float v, out vec2 p, out vec2 n) {
    float f = clamp(v, 0.0, 1.0) * ${PROF_N}.0;
    float fi = min(floor(f), ${PROF_N - 1}.0);
    int i = int(fi);
    vec2 a = uProf[i], b = uProf[i + 1];
    p = mix(a, b, f - fi);
    vec2 tg = b - a; tg = tg / max(length(tg), 1e-5);
    n = vec2(-tg.y, tg.x);
  }
`;

// ---------------------------------------------------------------- materials
function fogUniforms(extra) { return THREE.UniformsUtils.merge([THREE.UniformsLib.fog, extra || {}]); }
// shared uniform objects are assigned after merge so every material sees the same value holders
function shareUniforms(mat, U) { for (const k in U) mat.uniforms[k] = U[k]; return mat; }

function domeMaterial(U, C) {
  const m = new THREE.ShaderMaterial({
    fog: true,
    uniforms: fogUniforms({ uWetAll: { value: 0 }, uWet: { value: [new THREE.Vector4(-9, 0, 0, 0), new THREE.Vector4(-9, 0, 0, 0), new THREE.Vector4(-9, 0, 0, 0)] }, ...C }),
    vertexShader: /* glsl */`
      attribute vec3 aNm; attribute vec4 aD;
      uniform vec3 uSunDir;
      varying vec3 vWP, vN, vNm; varying vec4 vD; varying float vTl;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vNm = normalize(mat3(modelMatrix) * aNm);
        vD = aD;
        float ph = aD.x * ${(TAU / NRIB).toFixed(8)};
        vTl = dot(normalize(mat3(modelMatrix) * vec3(-sin(ph), 0.0, cos(ph))), uSunDir);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 cTurq, cCob, cDeep, cOchre, cBuff, cSnow;
      uniform vec4 uWet[3]; uniform float uWetAll;
      varying vec3 vWP, vN, vNm; varying vec4 vD; varying float vTl;
      #include <fog_pars_fragment>
      void main() {
        float q = vD.x, s = vD.y, r0 = vD.z;
        float x = (fract(q + 0.5) - 0.5) * 2.0, ax = abs(x);
        float Lb = pow(max(cos(ax * 1.5708), 0.0), ${LOBE_P.toFixed(2)});
        float hp = 3.14159 * r0 / ${NRIB}.0;
        float A = ${RIB_A.toFixed(3)} * smoothstep(0.6, 6.0, r0) * sqrt(min(1.0, r0 / ${R_BULGE.toFixed(1)}));
        float pix = max(fwidth(s), fwidth(q) * 2.0 * hp) + 1e-4;      // metres per pixel on the surface
        vec2 tuv = vec2(x * hp, s);
        vec3 N = normalize(vN), V = normalize(cameraPosition - vWP);

        // glazed tiles: rows along the rib, half-bond
        vec2 tc = tuv / vec2(0.24, 0.16); tc.x += 0.5 * floor(tc.y);
        vec2 ti = floor(tc), tf = fract(tc);
        float tfade = 1.0 - smoothstep(0.03, 0.09, pix);
        float th = h21(ti + floor(q + 0.5) * 17.0);
        float joint = max(smoothstep(0.90, 0.99, max(tf.x, 1.0 - tf.x)) , smoothstep(0.86, 0.985, max(tf.y, 1.0 - tf.y))) * tfade;
        float big = fbm(vec2(q * 0.33, s * 0.11) + 3.0), big2 = fbm(vec2(q * 0.09 + 20.0, s * 0.05));
        vec3 alb = cTurq * (0.78 + 0.34 * (th - 0.5) * tfade + 0.36 * (big - 0.5));
        alb = mix(alb, cTurq * vec3(0.55, 1.05, 0.95), smoothstep(0.52, 0.75, big2) * 0.55);       // older, greener firing
        float rep = step(0.9, h21(floor(tc / vec2(7.0, 11.0)) + 5.0 + floor(q * 0.25)));
        alb = mix(alb, mix(cTurq, cCob, 0.22) * 1.12, rep * 0.7);                                     // repaired panels
        // lozenge inlay on the crests, staggered rib to rib
        float ly = fract(s / 3.4 + 0.5 * mod(floor(q + 0.5), 2.0)) - 0.5;
        float ld = ax / 0.42 + abs(ly) * 3.4 / 0.62;
        float lfade = (1.0 - smoothstep(0.12, 0.4, pix)) * smoothstep(0.32, 0.5, hp);
        vec3 inl = mix(mix(cCob, cTurq, 0.38), cOchre * 1.1, 1.0 - smoothstep(0.22, 0.30, ld));
        alb = mix(alb, inl, (1.0 - smoothstep(0.90, 1.0, ld)) * lfade * 0.85);
        // crazing in the glaze (voronoi cracks), only near
        float cfade = 1.0 - smoothstep(0.008, 0.03, pix);
        float craze = 0.0;
        if (cfade > 0.01) {
          vec2 cp = tuv * 11.0, ci = floor(cp), cf = fract(cp); float d1 = 9.0, d2 = 9.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)); vec2 o = g + h22(ci + g) - cf; float d = dot(o, o);
            if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
          }
          craze = (1.0 - smoothstep(0.0, 0.05 + pix * 22.0, sqrt(d2) - sqrt(d1))) * cfade;
        }
        alb *= 1.0 - 0.38 * craze - 0.45 * joint;
        // lost tiles show the brick, soot and run-off gather in the grooves and under the bulge
        float lost = smoothstep(0.80, 0.84, fbm(ti * 0.21 + 9.0) + 0.16 * th) * tfade;
        vec3 brick = cBuff * (0.55 + 0.4 * th);
        float glaze = 1.0 - lost;
        alb = mix(alb, brick, lost);
        float streak = vnoise(vec2(q * 5.0, s * 0.22)) * vnoise(vec2(q * 1.3 + 4.0, s * 0.6));
        alb *= 1.0 - 0.45 * streak * smoothstep(0.3, 1.0, ax);
        // wet groove left by the slab
        float wet = 0.0;
        for (int k = 0; k < 3; k++) {
          float dq = abs(q - uWet[k].x);
          wet = max(wet, (1.0 - smoothstep(0.34, 0.66, dq)) * step(uWet[k].y, s) * (1.0 - smoothstep(uWet[k].z - 1.2, uWet[k].z + 0.2, s)) * uWet[k].w);
        }
        wet = max(wet, uWetAll * smoothstep(0.45, 0.8, ax) * (0.6 + 0.4 * streak));
        alb = mix(alb, alb * vec3(0.28, 0.5, 0.6), wet);
        // frost and wind-packed snow on up-facing glaze near the crown
        float frost = smoothstep(0.45, 0.95, N.y + (fbm(tuv * 1.7) - 0.5) * 0.7) * (1.0 - wet);
        alb = mix(alb, cSnow * 0.8, frost * 0.85); glaze *= 1.0 - frost;

        // light: sun with rib-to-rib shadowing, blue hemisphere, glaze highlight
        float ndl = max(dot(N, uSunDir), 0.0), ndlW = clamp(dot(N, uSunDir) * 0.6 + 0.4, 0.0, 1.0), ndlM = dot(normalize(vNm), uSunDir);
        float xs = x * sign(vTl);
        float need = A * (1.0 - cos(1.5708 * max(xs, 0.0))) / max((2.0 - xs) * hp, 0.05);
        float have = ndlM / max(abs(vTl), 1e-3);
        float sh = smoothstep(need * 0.6 - 0.03, need * 1.4 + 0.04, have) * smoothstep(-0.06, 0.1, ndlM);
        float mask = sunMask(vWP);
        float ao = mix(0.2, 1.0, pow(Lb, 0.6)) * vD.w;
        vec3 grooveT = mix(vec3(1.0), cCob * 2.2 + 0.08, (1.0 - Lb) * 0.9);      // groove fill drops to cobalt
        vec3 col = alb * (uSunCol * ndlW * sh * mask * 0.74 + hemi(N) * ao * grooveT);
        vec3 H = normalize(uSunDir + V);
        float ndh = max(dot(N, H), 0.0), nv = max(dot(N, V), 0.0);
        float gl = glaze * (0.75 + 0.5 * th) * (1.0 + 0.7 * wet);
        col += uSunCol * (pow(ndh, 320.0) * 3.4 + pow(ndh, 28.0) * 0.05) * gl * sh * mask * step(0.0, ndl - 0.001);
        float fr = 0.04 + 0.96 * pow(max(1.0 - nv, 0.0), 5.0);
        col += hemi(reflect(-V, N)) * fr * 0.3 * gl * ao;
        // spindrift skimming the ribs: streamers of powder driven round the dome by the wind
        float sdr = fbm(vec2(q * 0.2 - uTime * 0.55, s * 0.8 + sin(q * 0.3 + uTime * 0.3))) * vnoise(vec2(q * 0.8 - uTime * 2.2, s * 2.4));
        col += cSnow * (hemi(N) * 0.5 + uSunCol * mask * 0.3) * smoothstep(0.26, 0.5, sdr) * 0.1 * smoothstep(0.5, 0.9, N.y);
        // meltwater beads running down the wet groove and sunlit crests
        vec2 bc = vec2(x * hp * 9.0, (s - uTime * (0.5 + 0.9 * h11(floor(x * hp * 9.0) + floor(q + 0.5)))) * 2.2);
        float bead = step(0.95, h21(floor(bc))) * (1.0 - smoothstep(0.04, 0.16, length(fract(bc) - 0.5)));
        col += uSunCol * bead * (wet * 2.0 + 0.5 * glaze * smoothstep(0.5, 0.9, Lb)) * mask * sh * ndl * (1.0 - smoothstep(0.01, 0.04, pix));
        col += alb * glaze * uGhost * (0.55 + 0.45 * Lb);      // glaze keeps its colour in the flat light of the squall
        gl_FragColor = vec4(col, 1.0);
        ${GLSL_FOG_OUT}
      }`,
  });
  return shareUniforms(m, U);
}

function snowMaterial(U, C, S) {
  const m = new THREE.ShaderMaterial({
    fog: true,
    uniforms: fogUniforms({ ...C }),
    vertexShader: /* glsl */`
      attribute vec4 aG; attribute vec3 aS;
      uniform vec3 uSunDir, uSlide, uRelV; uniform float uLen; uniform vec4 uShed;
      ${GLSL_PROF}
      attribute float aE;
      varying vec3 vWP, vN, vLP, vSD; varying vec3 vSh;   // vSh: need, ndlM, |tl|
      varying float vAO; varying vec4 vE; varying vec3 vSl;   // vSl: slab on the move 0..1, metres below its top edge, plate phase
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position, n = normal; vSh = vec3(0.0, 1.0, 1.0); vAO = 1.0; vE = vec4(0.0); vSl = vec3(0.0);
        vLP = position; vSD = uSunDir * mat3(modelMatrix);
        if (aS.x > -0.5) {
          vLP = vec3(0.0, 100.0, 0.0);
          // the great shedding (rare): every other groove lets go in a wave running round from uShed.z
          float shT = uShed.x - abs(mod(aG.x - uShed.z + 3.14159265, 6.2831853) - 3.14159265) * uShed.w - aS.y * 0.7;
          float shS = shT <= 0.0 ? 0.0 : (shT < 2.885 ? 2.6 * shT * shT : 21.63 + 15.0 * (shT - 2.885));
          float sl = aS.x < 0.5 ? uSlide.x : aS.x < 1.5 ? uSlide.y : aS.x < 2.5 ? uSlide.z : shS;
          float rv = aS.x < 0.5 ? uRelV.x : aS.x < 1.5 ? uRelV.y : aS.x < 2.5 ? uRelV.z : uShed.y;
          float moving = step(rv, aG.y) * step(0.001, sl);
          float v2 = aG.y + moving * sl / uLen;
          float gone = smoothstep(0.985, 1.02, v2) * moving;
          vec2 p2, n2; profAt(min(v2, 1.0), p2, n2);
          float A = ribAmp(p2.x), hp = 3.14159 * p2.x / ${NRIB}.0;
          float lat = aG.z, wf = aG.w * (1.0 - gone);
          float hEdge = A * pow(max(sin(wf * 1.5708), 0.0), ${LOBE_P.toFixed(2)});
          // a moving slab rides up, cracks into plates and piles at its front
          float plate = moving * (0.10 + 0.30 * sin(aG.y * 61.0 + aS.y * 40.0) * min(1.0, sl * 0.4));
          vSl = vec3(moving * step(aS.x, 2.5) * min(1.0, 0.25 + sl * 0.4), (aG.y - rv) * uLen, aG.y * 61.0 + aS.y * 40.0);
          float h = hEdge - 0.06 + (aS.z + plate) * (1.0 - lat * lat) * (1.0 - gone);
          float r = p2.x + n2.x * h, y = p2.y + n2.y * h;
          float ph = aG.x + lat * wf * ${(Math.PI / NRIB).toFixed(8)};
          float c = cos(ph), s = sin(ph);
          p = vec3(r * c, y, r * s);
          vec3 nm = vec3(n2.x * c, n2.y, n2.x * s), tp = vec3(-s, 0.0, c);
          n = normalize(nm + tp * lat * 0.85);
          vec3 sd = normalize(uSunDir * mat3(modelMatrix));
          vSh = vec3(max(A - h, 0.0) / max(hp, 0.05), dot(nm, sd), abs(dot(tp, sd)));
          vAO = 0.58 + 0.42 * (1.0 - lat * lat * lat * lat);
          vE = vec4(lat, aE, aG.x * 31.0 + aS.y * 9.0, aG.y * uLen);
        }
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      ${GLSL_CAST}
      uniform vec3 cSnow, cCob;
      varying vec3 vWP, vN, vLP, vSD; varying vec3 vSh; varying float vAO; varying vec4 vE; varying vec3 vSl;
      #include <fog_pars_fragment>
      void main() {
        // packed snow breaks off raggedly: noise in the strip's own space eats its ends, gaps and edges
        float rg = fbm(vec2(vE.z + vE.x * 0.9, vE.w * 1.5)), rg2 = vnoise(vec2(vE.z * 3.0 + vE.x * 3.5, vE.w * 5.0));
        // inside a gap the strip is gone outright (no stray lump left standing in an empty groove, where it reads as a
        // hole in the rib); the ragged break is a short band at the gap's edge, and what is left there stays narrow
        float eg = smoothstep(0.15, 0.45, vE.y);
        // (the break is rounded: the edges of the strip give out before its middle, so an end is a tongue of snow)
        if (eg * (1.2 + 1.1 * vE.x * vE.x) + (rg - 0.5) * 0.9 * (1.0 - 0.8 * eg) + (rg2 - 0.5) * 0.3 > 0.5 || abs(vE.x) > mix(0.58 + 0.56 * rg + 0.2 * rg2, 0.5, eg)) discard;
        // the slab on the move: its trailing edge tears away from the snow above, and it rides as broken plates
        float crack = 0.0;
        if (vSl.x > 0.0) {
          if (vSl.y < 0.12 + 0.34 * rg2) discard;
          crack = max(1.0 - smoothstep(-0.96, -0.8, sin(vSl.z + (rg - 0.5) * 1.6)), 1.0 - smoothstep(0.3, 0.75, vSl.y - 0.34 * rg2)) * vSl.x;
        }
        vec3 N = normalize(vN), V = normalize(cameraPosition - vWP);
        float g = fbm(vWP.xz * 2.3 + vWP.y * 1.7);
        float gfade = 1.0 - smoothstep(12.0, 40.0, length(cameraPosition - vWP));
        N = normalize(N + (vec3(vnoise(vWP.yz * 5.0), vnoise(vWP.xz * 5.0), vnoise(vWP.xy * 5.0)) - 0.5) * 0.5 + (vec3(vnoise(vWP.yz * 16.0), vnoise(vWP.xz * 16.0 + 3.0), vnoise(vWP.xy * 16.0 + 7.0)) - 0.5) * 0.7 * gfade);
        float sh = mix(1.0, smoothstep(vSh.x * 0.6 - 0.03, vSh.x * 1.4 + 0.04, vSh.y / max(vSh.z, 1e-3)), 0.5) * smoothstep(-0.06, 0.1, vSh.y);      // packed snow stands proud of the groove and catches the sun
        sh *= castShadow(vLP, normalize(vSD));
        float ndl = clamp(dot(N, uSunDir) * 0.8 + 0.2, 0.0, 1.0);
        float mask = sunMask(vWP);
        vec3 alb = cSnow * (0.74 + 0.14 * g);
        vec3 col = alb * (uSunCol * ndl * sh * mask * 0.44 + hemi(N) * (0.86 * vAO * mix(0.8, 1.0, uSunAmt)));
        // forward-scattered rim and single-crystal sparkle in the sun
        col += uSunCol * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.0) * 0.02 * mask * sh;
        vec3 sc = floor(vWP * 26.0);
        float sp = step(0.992, h21(sc.xy + sc.z * 7.3)) * pow(max(dot(normalize(N + (h22(sc.xz) .xyx - 0.5) * 0.9), normalize(uSunDir + V)), 0.0), 30.0);
        col += uSunCol * sp * 2.2 * mask * sh;
        float sdr = fbm(vec2(dot(vWP.xz, vec2(0.7, -0.7)) * 0.22 - uTime * 1.3, vWP.y * 0.3)) * vnoise(vec2(dot(vWP.xz, vec2(0.7, -0.7)) * 0.9 - uTime * 3.3, vWP.y * 0.8));
        col *= 0.93 + 0.3 * smoothstep(0.18, 0.5, sdr);
        col *= mix(vec3(1.0), vec3(0.34, 0.45, 0.7), crack);
        // where the packed snow meets the glaze it thins and takes the groove's cobalt shade, so a stripe lies in its groove
        col *= mix(vec3(0.62, 0.74, 0.98), vec3(1.0), smoothstep(0.0, 0.5, 1.0 - abs(vE.x)));
        gl_FragColor = vec4(col, 1.0);
        ${GLSL_FOG_OUT}
      }`,
  });
  m.uniforms.uShed = S.uShed; m.uniforms.uProf = { value: S.prof }; m.uniforms.uSlide = S.uSlide; m.uniforms.uRelV = S.uRelV; m.uniforms.uLen = { value: S.len };
  return shareUniforms(m, U);
}

// analytic shadow of the drum and dome on everything else (local space, piece assumed unrotated about X/Z)
const GLSL_CAST = /* glsl */`
  float castShadow(vec3 lp, vec3 sd) {
    vec2 d = sd.xz; float dd = max(dot(d, d), 1e-4);
    float b = dot(lp.xz, d), sh = 1.0;
    float c1 = dot(lp.xz, lp.xz) - 169.0, h1 = b * b - dd * c1;
    if (b < 0.0 && h1 > 0.0 && c1 > 0.5) { float t = (-b - sqrt(h1)) / dd; float y = lp.y + sd.y * t; sh = min(sh, smoothstep(30.0, 31.5, y)); }
    float c2 = dot(lp.xz, lp.xz) - 215.0, h2 = b * b - dd * c2;
    if (b < 0.0 && h2 > 0.0 && c2 > 0.5) { float t = (-b - sqrt(h2)) / dd; float y = lp.y + sd.y * t; sh = min(sh, max(1.0 - smoothstep(29.0, 30.5, y), smoothstep(50.0, 55.0, y))); }
    return sh;
  }
`;

// PATTERN IDS for the tile material (attribute aP.x): 0 brick, 1 banna'i diamonds (aP.y = 1: chevrons),
// 2 interlace band, 3 star lattice, 4 spiral banding, 5 gold-ochre (aP.y = 1: gilded metal), 6 grille,
// 7 timber, 8 plain glaze tinted by vertex colour.  color.r = baked AO, color.g/b = tint seeds.
// Added for the city (world file): 9 bark (color.b = wind sway weight, aP.y = rime), 10 mud plaster (aP.y = 1
// whitewash with a turquoise dado, color.g = tint), 11 carpet (aP.y = variant, color.b = swing weight),
// 12 opening (aP.y: 0 dark recess, 1 painted door, 2 lamplit window, 3 oven glow), 13 packed snow,
// 14 striped awning cloth (color.b = flap weight), 15 ribbed lesser dome (uv.x in ribs, crest at .5),
// 16 plain wool (color.g picks madder / indigo / brown / buff / cream, color.b tone), 17 icicle fringe (color.b = strip height).
// o: { cast (true: the hero's own analytic dome shadow, local space), world: { n: [boxes, cylinders], uBoxA, uBoxB,
// uCyl } world-space box shadows, fogCap: own uniform, lamp: uniform 0..1 (lit windows), rime: uniform 0..1 }
// Two vertex-colour conventions: color.r under 0.5 = baked sun shadow; on patterns 1-3 color.b = 0 = niche back in shade.
// Pattern 16 with color.g = 1 is rook black.
export function tileMaterial(U, C, o = {}) {
  const defs = {};
  if (o.cast !== false) defs.DOME_CAST = 1;
  if (o.world) defs.WORLD_CAST = 1;
  const m = new THREE.ShaderMaterial({
    fog: true, vertexColors: true, defines: defs,
    uniforms: fogUniforms({ ...C }),
    vertexShader: /* glsl */`
      attribute vec2 aP;
      uniform vec3 uSunDir; uniform vec4 uWind; uniform float uTime;
      varying vec3 vWP, vN, vLP, vSD, vC; varying vec2 vUv, vP;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        if (aP.x > 8.5 && aP.x < 9.5) {
          float g = sin(uTime * 1.7 + wp.x * 0.31 + wp.z * 0.23) + 0.5 * sin(uTime * 3.1 + wp.x * 0.9);
          wp.xz += uWind.xz * g * 0.11 * color.b;
        } else if (aP.x > 10.5 && aP.x < 11.5 || aP.x > 13.5 && aP.x < 14.5) {
          float g = sin(uTime * 2.3 + wp.x * 1.3 + wp.z * 1.1 + wp.y * 1.7) + 0.6 * sin(uTime * 1.1 + wp.x * 0.4);
          wp.xyz += normalize(mat3(modelMatrix) * normal) * g * 0.16 * color.b;
        }
        vWP = wp.xyz; vLP = position; vN = normalize(mat3(modelMatrix) * normal);
        vSD = uSunDir * mat3(modelMatrix);
        vUv = uv; vP = aP; vC = color;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      ${GLSL_CAST}
      uniform vec3 cTurq, cCob, cDeep, cOchre, cBuff, cSnow;
      uniform float uLamp, uRime;
      varying vec3 vWP, vN, vLP, vSD, vC; varying vec2 vUv, vP;
      #include <fog_pars_fragment>
      #ifdef WORLD_CAST
      ${o.world ? worldCastGLSL(o.world.n[0], o.world.n[1]) : ''}
      #endif
      // glazed brick-end mosaic: returns 0 ground, 1 turquoise, 2 cobalt, 3 white
      float bannai(vec2 c, float chev) {
        float a = mod(c.x + c.y, 8.0), b = mod(c.x - c.y + 64.0, 8.0);
        float k = 0.0;
        if (chev > 0.5) {
          float z = mod(c.y + abs(mod(c.x, 8.0) - 4.0), 4.0);
          k = z < 0.5 ? 2.0 : z < 1.5 ? 1.0 : z < 2.5 ? 0.0 : 0.0; if (z > 2.5 && mod(c.x, 2.0) < 0.5) k = 3.0;
        } else {
          if (a < 0.5 || b < 0.5) k = 1.0;
          if (abs(a - 4.0) < 1.5 && abs(b - 4.0) < 1.5) k = 2.0;
          if (abs(a - 4.0) < 0.5 && abs(b - 4.0) < 0.5) k = 3.0;
          if ((abs(a - 4.0) < 0.5 && b < 0.5) || (abs(b - 4.0) < 0.5 && a < 0.5)) k = 2.0;
        }
        return k;
      }
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vWP);
        vec2 uv = vUv; float id = vP.x;
        float pix = max(fwidth(uv.x), fwidth(uv.y)) + 1e-4;
        float n1 = fbm(uv * 0.35 + id * 9.0), n2 = fbm(uv * 2.7);
        // fired brick ground shared by all tile patterns
        vec2 bc = uv / vec2(0.30, 0.085); bc.x += 0.5 * floor(bc.y);
        vec2 bi = floor(bc), bf = fract(bc); float bh = h21(bi);
        float bfade = 1.0 - smoothstep(0.02, 0.06, pix);
        float mortar = max(smoothstep(0.93, 0.99, max(bf.x, 1.0 - bf.x)), smoothstep(0.80, 0.96, max(bf.y, 1.0 - bf.y))) * bfade;
        vec3 brick = cBuff * (0.8 + 0.4 * (bh - 0.5) * bfade + 0.34 * (n1 - 0.5)) * mix(vec3(1.0), vec3(1.12, 0.94, 0.8), bh * 0.5);
        brick = mix(brick, cBuff * 1.05, mortar * 0.6);
        vec3 alb = brick; float glaze = 0.0, metal = 0.0, snowAdd = 0.0; vec3 glow = vec3(0.0);
        if (id < 0.5) {
        } else if (id < 1.5) {
          vec2 c = floor(uv / 0.3), f = fract(uv / 0.3);
          float k = bannai(c, vP.y);
          float fade = 1.0 - smoothstep(0.1, 0.3, pix);
          float e = smoothstep(0.90, 0.98, max(max(f.x, 1.0 - f.x), max(f.y, 1.0 - f.y))) * fade;
          float hh = h21(c + 3.0);
          vec3 g = k < 0.5 ? brick : k < 1.5 ? cTurq : k < 2.5 ? cCob : cSnow * 0.78;
          g *= 0.82 + 0.3 * hh * fade;
          float lostT = step(0.955, h21(c * 1.7 + 11.0) + 0.1 * n1);
          g = mix(g, brick * 0.8, lostT * step(0.5, k));
          // seen from close each glazed brick end is four small tiles
          float fine1 = (1.0 - smoothstep(0.006, 0.025, pix)) * step(0.5, k); vec2 f2 = abs(fract(uv / 0.15) - 0.5);
          g *= 1.0 + fine1 * ((h21(floor(uv / 0.15) + 5.0) - 0.5) * 0.3 - 0.35 * smoothstep(0.4, 0.49, max(f2.x, f2.y)));
          // the same lattice drawn soft for distance, so the big diamonds survive when the bricks blur
          float l1 = abs(fract((uv.x + uv.y) / 2.4 + 0.0625) - 0.5) * 2.4, l2 = abs(fract((uv.x - uv.y) / 2.4 + 0.0625) - 0.5) * 2.4;
          float lw = 0.14 + pix * 0.6;
          vec3 mean = mix(brick, cTurq * 0.9, 0.8 * smoothstep(1.2 - lw * 1.3, 1.2 - lw * 0.3, max(l1, l2)));
          mean = mix(mean, cCob, 0.85 * (1.0 - smoothstep(0.3, 0.5 + pix, max(l1, l2))));
          if (vP.y > 0.5) { float z = abs(fract((uv.y + abs(fract(uv.x / 2.4) - 0.5) * 2.4) / 1.2) - 0.5) * 2.0; mean = mix(mix(cCob, cTurq, smoothstep(0.2, 0.5, z)), brick * 1.1, smoothstep(0.5, 0.75, z)); }
          alb = mix(mean, g * (1.0 - 0.5 * e), fade); glaze = step(0.5, k) * (1.0 - lostT) * fade + 0.4 * (1.0 - fade);
        } else if (id < 2.5) {
          // ochre-and-cobalt interlace: eight-point stars in octagons with woven diagonal straps
          vec2 p = abs(fract(uv / 2.0) - 0.5);
          float d1 = max(p.x, p.y), d2 = (p.x + p.y) * 0.7071;
          float star = min(d1, d2), oct = max(d1, d2);
          float w = 0.022 + pix * 0.35;
          vec3 g = cCob * 0.9;
          g = mix(g, mix(cCob, cTurq, 0.55), 1.0 - smoothstep(0.24, 0.24 + w, star));
          g = mix(g, cSnow * 0.8, 1.0 - smoothstep(0.085, 0.085 + w, star));
          g = mix(g, cCob, 1.0 - smoothstep(0.04, 0.04 + w, oct));
          float strap = min(abs(star - 0.26), abs(oct - 0.40));
          strap = min(strap, abs(p.x - p.y) * 0.7071 + step(oct, 0.40));
          vec2 pc = abs(p - 0.5); float cd = pc.x + pc.y;
          strap = min(strap, abs(cd - 0.13));
          g = mix(g, cDeep, 1.0 - smoothstep(0.0, 0.03 + w, cd - 0.02) );
          float sm = 1.0 - smoothstep(0.042, 0.042 + w, strap);
          g = mix(g, cOchre * 1.25, sm); metal = sm * 0.8;
          g = mix(g, cSnow * 0.8, (1.0 - smoothstep(0.0, w, abs(strap - 0.06))) * 0.45 * (1.0 - smoothstep(0.02, 0.08, pix)));
          float edge = min(uv.y, 4.0 - uv.y);
          g = mix(g, mod(floor(uv.x / 0.25), 2.0) < 0.5 ? cSnow * 0.8 : cDeep, 1.0 - smoothstep(0.16, 0.18, edge));
          alb = g * (0.85 + 0.3 * n2); glaze = 1.0;
        } else if (id < 3.5) {
          // star lattice: twelve-point stars on a hexagon net
          vec2 q = uv / 1.7; vec2 r2 = vec2(1.0, 1.7320508);
          vec2 a = mod(q, r2) - r2 * 0.5, b = mod(q + r2 * 0.5, r2) - r2 * 0.5;
          vec2 p = dot(a, a) < dot(b, b) ? a : b;
          float rr = length(p), ang = atan(p.y, abs(p.x) < 1e-5 ? 1e-5 : p.x);
          float af = abs(mod(ang + 6.2831853, 0.5235988) - 0.2617994);
          float st = rr * (cos(af) + sin(af) * 1.35);
          float w = 0.018 + pix * 0.4;
          vec3 g = mix(brick, cTurq * 0.9, 1.0 - smoothstep(0.455, 0.455 + w, rr * cos(af)));
          g = mix(g, cCob, 1.0 - smoothstep(0.40, 0.40 + w, st));
          g = mix(g, cSnow * 0.8, 1.0 - smoothstep(0.0, w, abs(st - 0.41) - 0.012));
          g = mix(g, cTurq, 1.0 - smoothstep(0.17, 0.17 + w, rr * cos(af)));
          g = mix(g, cOchre, 1.0 - smoothstep(0.06, 0.06 + w, rr));
          // seen from close the fields resolve into small glazed tesserae with a fine grout line
          float fine = 1.0 - smoothstep(0.012, 0.05, pix);
          vec2 tq = uv / 0.19; tq.x += 0.5 * floor(tq.y); vec2 tf2 = abs(fract(tq) - 0.5);
          float grout = smoothstep(0.5 - 0.06 - pix * 3.0, 0.5 - 0.02, max(tf2.x, tf2.y));
          g *= mix(1.0, (0.84 + 0.32 * h21(floor(tq) + 7.0)) * (1.0 - 0.4 * grout), fine);
          float fade = 1.0 - smoothstep(0.25, 0.7, pix);
          alb = mix(mix(cCob, cTurq, 0.45), g, fade) * (0.85 + 0.3 * n2); glaze = 0.9 * (1.0 - 0.6 * grout * fine);
        } else if (id < 4.5) {
          // spiral banding: uv.x is metres round a 14.45 m girth, two bands a turn
          float dg = (uv.y - uv.x * (6.4 / 14.4513)) / 3.2;
          float w = fract(dg), bn = floor(dg);
          vec2 c = floor(vec2(uv.x, uv.y - uv.x * (6.4 / 14.4513)) / 0.28);
          float k = bannai(c, mod(bn, 2.0));
          float fade = 1.0 - smoothstep(0.1, 0.3, pix);
          vec3 g = k < 0.5 ? brick : k < 1.5 ? cTurq : k < 2.5 ? cCob : cSnow * 0.78;
          g = mix(mix(brick, cTurq, 0.35), g * (0.85 + 0.3 * h21(c)), fade);
          float sw = min(w, 1.0 - w) * 3.2;
          g = mix(g, cCob, 1.0 - smoothstep(0.22, 0.26, sw));
          g = mix(g, cSnow * 0.8, 1.0 - smoothstep(0.05, 0.08, abs(sw - 0.30)));
          alb = g; glaze = 0.3;
        } else if (id < 5.5) {
          // gold-ochre: a carved chevron rope in dull gilt; only its highlight blooms
          float rope = abs(fract(uv.y / 0.25 + abs(fract(uv.x / 0.5) - 0.5) * 2.0) - 0.5) * 2.0, rfade = 1.0 - smoothstep(0.03, 0.14, pix);
          alb = cOchre * mix(0.62, 0.9, vP.y) * (0.86 + 0.4 * n2) * mix(1.0, 0.66 + 0.6 * rope, rfade * (1.0 - vP.y)) * mix(1.0, 1.0 - 0.3 * mortar, 1.0 - vP.y); metal = mix(0.75 + 0.25 * rope * rfade, 1.0, vP.y); glaze = 0.6;
        } else if (id < 6.5) {
          vec2 f = abs(fract(uv / 0.42) - 0.5);
          float lat = min(min(f.x, f.y), abs(f.x - f.y) * 0.7071);
          float fade = 1.0 - smoothstep(0.1, 0.35, pix);
          alb = mix(cDeep * 0.22, cBuff * 1.1, (1.0 - smoothstep(0.035, 0.06 + pix * 0.5, lat)) * fade + 0.3 * (1.0 - fade));
        } else if (id < 7.5) {
          float gr = vnoise(vec2(uv.x * 30.0, uv.y * 1.5));
          alb = vec3(0.21, 0.13, 0.075) * (0.6 + 0.7 * gr);
        } else if (id < 8.5) {
          alb = mix(cTurq, cCob, vC.g) * (0.75 + 0.5 * vC.b);
          glaze = 1.0;
        } else if (id < 9.5) {
          float gr = vnoise(vec2(uv.x * 26.0, uv.y * 2.0));
          alb = vec3(0.075, 0.058, 0.05) * (0.55 + 0.9 * gr);
          alb = mix(alb, cSnow * 0.8, clamp(uRime * (0.55 + 0.6 * gr) + 0.35 * vP.y * smoothstep(-0.2, 0.6, N.y), 0.0, 0.92));
        } else if (id < 10.5) {
          float ptc = fbm(uv * 0.9 + vC.g * 31.0), run = vnoise(vec2(uv.x * 3.1, uv.y * 0.45 + vC.g * 9.0));
          float straw = vnoise(uv * 34.0) * (1.0 - smoothstep(0.02, 0.08, pix));
          vec3 mud = cBuff * mix(vec3(0.80, 0.78, 0.76), vec3(1.08, 1.0, 0.9), vC.g) * (0.8 + 0.32 * ptc + 0.1 * straw);
          mud = mix(mud, cBuff * vec3(1.22, 1.18, 1.08), smoothstep(0.6, 0.72, fbm(uv * 0.31 + 5.0 + vC.g * 7.0)) * 0.5);     // fresh patches
          vec2 kc = uv * 0.55 + vC.g * 13.0, ki = floor(kc), kf = fract(kc); float k1 = 9.0, k2 = 9.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = g + h22(ki + g) - kf; float d = dot(o, o); if (d < k1) { k2 = k1; k1 = d; } else if (d < k2) { k2 = d; } }
          float crack = (1.0 - smoothstep(0.0, 0.03 + pix * 2.0, sqrt(k2) - sqrt(k1))) * step(0.55, h21(ki + 3.0)) * (1.0 - smoothstep(0.03, 0.12, pix));
          mud *= 1.0 - 0.35 * crack;
          mud *= 1.0 - 0.08 * run * smoothstep(0.35, 0.8, run);
          // rammed-earth lifts: a faint horizontal seam every half metre, and the damp foot of the wall
          float lift = 1.0 - smoothstep(0.0, 0.07 + pix, abs(fract(uv.y / 0.55 + 0.12 * ptc) - 0.5));
          mud *= 1.0 - 0.13 * lift * (1.0 - smoothstep(0.05, 0.3, pix));
          mud *= mix(vec3(0.74, 0.76, 0.82), vec3(1.0), smoothstep(0.1, 1.1, uv.y + 0.5 * ptc));
          mud = mix(mud, vec3(dot(mud, vec3(0.3, 0.5, 0.2))) * vec3(1.02, 1.0, 0.98), 0.38) * vec3(1.22, 1.12, 1.0);
          mud = mix(mud, cSnow * 0.8, smoothstep(0.6, 0.95, fbm(uv * vec2(0.5, 1.4) + 17.0 + vC.g * 5.0)) * (0.16 + 0.5 * uRime));     // wind-plastered snow
          if (vP.y > 0.5) {
            mud = mix(cSnow * vec3(0.74, 0.74, 0.73) * (0.86 + 0.16 * ptc), mud, smoothstep(0.72, 0.95, ptc + 0.3 * run) * 0.45);
            mud = mix(mud, mix(cTurq, cCob, vC.g) * (0.7 + 0.4 * ptc), (1.0 - smoothstep(0.85, 0.9, uv.y)) * 0.85 * step(0.25, vC.b));
          }
          alb = mud * mix(0.62, 1.0, smoothstep(0.0, 0.9, uv.y + 0.4 * ptc));
        } else if (id < 11.5) {
          float row = floor(uv.y / 0.34), hr = h11(row + vP.y * 17.0 + floor(vC.g * 64.0));
          vec3 mad = vec3(0.34, 0.035, 0.03), cream = cSnow * vec3(0.62, 0.56, 0.44);
          vec3 a1 = vP.y < 0.5 ? cCob * 0.85 : mad, a2 = vP.y < 0.5 ? mad : cCob * 0.8;
          vec3 g = hr < 0.42 ? a1 : hr < 0.72 ? a2 : hr < 0.86 ? cream : cOchre * 0.75;
          vec2 dm = abs(fract(uv / vec2(0.46, 0.68)) - 0.5);
          float dia = dm.x + dm.y;
          g = mix(g, hr < 0.5 ? cream : cDeep, (1.0 - smoothstep(0.2, 0.2 + pix * 3.0 + 0.02, dia)) * step(0.3, hr) * (1.0 - smoothstep(0.1, 0.3, pix)));
          g = mix(g, cDeep * 0.8, 1.0 - smoothstep(0.0, 0.05, min(uv.x, vC.g > -1.0 ? 9.0 : 0.0)));
          alb = g * (0.8 + 0.3 * vnoise(uv * vec2(60.0, 9.0)));
        } else if (id < 12.5) {
          if (vP.y < 0.5) alb = vec3(0.022, 0.02, 0.022);
          else if (vP.y < 1.5) { float pl = abs(fract(uv.x / 0.22) - 0.5); alb = mix(cTurq, cCob, step(0.5, vC.g)) * (0.5 + 0.3 * h11(floor(uv.x / 0.22) + vC.g * 9.0)) * (1.0 - 0.5 * smoothstep(0.42, 0.5, pl)); }
          else if (vP.y < 2.5) {
            vec2 f = abs(fract(uv / vec2(0.3, 0.4)) - 0.5);
            float bars = smoothstep(0.38, 0.46, max(f.x, f.y));
            alb = mix(vec3(0.05, 0.045, 0.05), vec3(0.14, 0.09, 0.05), bars);
            glow = vec3(1.0, 0.56, 0.2) * uLamp * (1.0 - bars) * (2.2 + 1.2 * vC.b) * step(0.35, vC.g) * (0.9 + 0.1 * sin(uTime * (5.0 + 7.0 * vC.b) + vC.b * 40.0));
            glaze = 0.5;
          } else { alb = vec3(0.03, 0.02, 0.015); glow = vec3(1.0, 0.36, 0.08) * (0.9 + 0.9 * uLamp) * (0.75 + 0.25 * sin(uTime * 7.0 + vC.b * 40.0) * sin(uTime * 3.1 + vC.b * 13.0)); }
        } else if (id < 13.5) {
          alb = cSnow * 0.84; snowAdd = 1.0;
        } else if (id < 14.5) {
          float st = smoothstep(0.42, 0.5, abs(fract(uv.x / 0.7) - 0.5) * 2.0 * 0.5 + 0.2);
          alb = mix(cOchre * 1.05, cSnow * vec3(0.7, 0.66, 0.56), st * 0.8) * (0.8 + 0.3 * vnoise(uv * vec2(40.0, 6.0)));
        } else if (id > 16.5) {
          // icicle fringe: teeth of varied length hanging from the top edge of the strip (uv.y = metres up from its foot)
          float tx = uv.x * 2.6, len = 0.3 + 0.65 * h11(floor(tx) + 3.0), wx = abs(fract(tx) - 0.5) * 2.0;
          if (vC.b - uv.y > len * vC.b * (1.0 - wx * (1.5 + h11(floor(tx)))) ) discard;
          alb = mix(cSnow * 0.9, cTurq * 0.6 + cSnow * 0.4, 0.35); glaze = 1.0;
        } else if (id > 15.5) {
          vec3 wool = vC.g < 0.3 ? vec3(0.30, 0.055, 0.045) : vC.g < 0.55 ? vec3(0.045, 0.07, 0.22) : vC.g < 0.8 ? vec3(0.19, 0.12, 0.075) : vC.g < 0.93 ? vec3(0.33, 0.27, 0.19) : vC.g < 0.985 ? vec3(0.62, 0.6, 0.55) : vec3(0.014, 0.014, 0.02);
          alb = wool * (0.85 + 0.25 * vnoise(uv * vec2(9.0, 30.0))) * (0.8 + 0.4 * vC.b);
        } else {
          float xr = abs(fract(uv.x) - 0.5) * 2.0, pw = fwidth(uv.x) * 2.0;
          float groove = smoothstep(0.50 - pw, 0.64 + pw, xr + (n2 - 0.5) * 0.18);
          float lie = smoothstep(-0.32, 0.12, N.y + (n1 - 0.5) * 0.5);
          float fadeR = 1.0 - smoothstep(0.35, 0.9, pw);
          vec2 tc = uv / vec2(0.125, 0.3); float th = h21(floor(tc));
          alb = cTurq * (0.72 + 0.3 * (th - 0.5) * (1.0 - smoothstep(0.03, 0.1, pix)) + 0.4 * (n1 - 0.5));
          alb *= 1.0 - 0.4 * smoothstep(0.55, 1.0, xr) * (1.0 - groove);
          alb = mix(alb, mix(cTurq, cCob, 0.3), step(0.93, h21(floor(tc / vec2(3.0, 9.0)) + 2.0)) * 0.6);
          snowAdd = mix(0.42 * lie, groove * lie, fadeR); glaze = 0.55;
        }
        // weathering: rain streaks under ledges, damp at the foot, grime
        float streak = vnoise(vec2(uv.x * 1.6, uv.y * 0.12)) * vnoise(vec2(uv.x * 0.5 + 9.0, 0.3));
        alb *= 1.0 - (id > 9.5 && id < 10.5 ? 0.1 : 0.35) * streak * (1.0 - metal);
        alb *= id > 15.5 ? 1.0 : mix(0.72, 1.0, smoothstep(0.0, 2.2, vLP.y + n1));
        // snow lying on anything that faces up
        float sn = max(smoothstep(0.55, 0.8, N.y + (n2 - 0.5) * 0.3) * (id > 16.5 ? 0.5 : id > 15.5 ? 0.0 : id > 13.5 && id < 14.5 ? 0.3 * smoothstep(0.45, 0.6, n1) : 1.0), snowAdd);
        alb = mix(alb, cSnow * 0.84, sn); glaze *= 1.0 - sn; metal *= 1.0 - sn;
        // color.r under 0.5 marks a baked sun shadow (flat quads laid on snow): the sun is cut, the skylight stays.
        // On tile patterns 1 to 3 color.b near 0 marks the back of a niche: it sits in the arch's own shade.
        float bsh = smoothstep(0.3, 0.5, vC.r), ao = mix(id > 12.5 && id < 13.5 ? vC.g : 0.96, vC.r, bsh);      // a shadow quad on snow (pattern 13) carries its skylight in color.g
        float rec = id > 0.5 && id < 3.5 ? 1.0 - smoothstep(0.05, 0.35, vC.b) : 0.0;
        ao *= 1.0 - 0.3 * rec;
        float cshad = bsh * (1.0 - 0.7 * rec);
        #ifdef DOME_CAST
          cshad *= castShadow(vLP, normalize(vSD)) * smoothstep(0.5, 0.85, ao);
        #endif
        #ifdef WORLD_CAST
          cshad *= worldShadow(vWP + N * 0.12, uSunDir, 0.0);
        #endif
        float mask = sunMask(vWP) * cshad;
        float ndl = max(dot(N, uSunDir), 0.0);
        vec3 col = alb * (uSunCol * ndl * mask * mix(id < 0.5 ? 0.6 : 0.66, 0.38, sn) + hemi(N) * ao * mix(1.0, 0.86, sn));
        // each small tile is set at its own slight angle, so a wall near the sun's mirror line glitters tile by tile
        vec2 tcell = floor(uv / 0.15);
        float jf = 1.0 - smoothstep(0.02, 0.12, pix);
        vec3 Ng = normalize(N + (vec3(h22(tcell), h21(tcell + 9.0)) - 0.5) * 0.2 * jf);
        vec3 H = normalize(uSunDir + V); float ndh = max(dot(Ng, H), 0.0);
        // too far to tell the tiles apart, their glints merge into one wider, far dimmer sheen (not a white sheet)
        float glint = min(mix(pow(max(dot(N, H), 0.0), 90.0) * 0.45, pow(ndh, 180.0) * 3.5 * smoothstep(5.0, 22.0, length(cameraPosition - vWP)), jf), 1.2);
        float graze = 0.3 + 0.7 * smoothstep(0.06, 0.4, dot(N, V));      // a wall seen edge-on beside the lens keeps its pattern instead of glaring white
        glint *= mix(1.0, 0.12 + 0.88 * step(0.78, h21(tcell + 4.0)), jf);
        col += uSunCol * (glint * glaze + pow(ndh, 22.0) * 0.06 * glaze) * mask * step(0.001, ndl) * graze;
        col += uSunCol * cOchre * (pow(ndh, 40.0) * min(0.6 + 5.6 * vP.y, 2.2) + pow(ndh, 6.0) * mix(0.08, 0.25, vP.y)) * metal * mask * step(0.001, ndl);
        col += hemi(reflect(-V, N)) * (0.04 + 0.96 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 5.0)) * 0.3 * glaze * ao;
        col += alb * glaze * uGhost * ao;      // glaze keeps its colour in the flat light of the squall
        vec3 sc = floor(vWP * 22.0);
        col += uSunCol * step(0.994, h21(sc.xy + sc.z * 7.3)) * sn * mask * 1.6 * (1.0 - smoothstep(0.02, 0.07, pix));
        gl_FragColor = vec4(col + glow, 1.0);
        ${GLSL_FOG_OUT}
      }`,
  });
  shareUniforms(m, U);
  m.uniforms.uLamp = o.lamp || { value: 0 }; m.uniforms.uRime = o.rime || { value: 0 };
  if (o.fogCap) m.uniforms.uFogCap = o.fogCap;
  if (o.world) { m.uniforms.uBoxA = o.world.uBoxA; m.uniforms.uBoxB = o.world.uBoxB; m.uniforms.uCyl = o.world.uCyl; }
  return m;
}

// ---------------------------------------------------------------- geometry accumulator
// Grids with normals from neighbour differences; every vertex carries uv in metres, a pattern id and AO.
export class Geo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.ap = []; this.c = []; this.i = []; this.count = 0; this.m = null; this.pat = 0; this.aux = 0; }
  set(pat, aux = 0) { this.pat = pat; this.aux = aux; return this; }
  // f(s, t, o) fills o.x o.y o.z o.u o.v and optionally o.ao o.g o.b ; wrap closes the grid in s
  grid(nu, nv, f, wrap = false, flip = false) {
    const W = nu + 1, o = { x: 0, y: 0, z: 0, u: 0, v: 0, ao: 1, g: 0, b: 0.5 };
    const P = new Float32Array(W * (nv + 1) * 3), base = this.count, m = this.m;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      o.ao = 1; o.g = 0; o.b = 0.5; f(i / nu, j / nv, o);
      const k = (j * W + i) * 3; P[k] = o.x; P[k + 1] = o.y; P[k + 2] = o.z;
      const us = this.uvS || 1;      // uvS: pattern scale (0.5 = motifs twice as large)
      this.uv.push(o.u * us, o.v * us); this.ap.push(this.pat, this.aux); this.c.push(o.ao, o.g, o.b);
    }
    const e = m ? m.elements : null;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      let i0 = i - 1, i1 = i + 1; const j0 = Math.max(0, j - 1), j1 = Math.min(nv, j + 1);
      if (wrap) { if (i0 < 0) i0 = nu - 1; if (i1 > nu) i1 = 1; } else { i0 = Math.max(0, i0); i1 = Math.min(nu, i1); }
      const a = (j * W + i0) * 3, b = (j * W + i1) * 3, c = (j0 * W + i) * 3, d = (j1 * W + i) * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
      let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
      if (flip) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const k = (j * W + i) * 3; let x = P[k], y = P[k + 1], z = P[k + 2];
      if (e) {
        const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
        const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz;
        x = X; y = Y; z = Z; nx = NX; ny = NY; nz = NZ;
      }
      this.p.push(x, y, z); this.n.push(nx, ny, nz);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W, d = c + 1;
      if (flip) this.i.push(a, b, c, b, d, c); else this.i.push(a, c, b, b, c, d);
    }
    this.count += W * (nv + 1);
  }
  // lathe band between (r0,y0) and (r1,y1); rf(phi, t) adds to the radius; girth = metres of uv.x per turn
  ring(r0, y0, r1, y1, o = {}) {
    const nu = o.nu || 64, nv = o.nv || 1, rf = o.rf, girth = o.girth || TAU * Math.max(r0, r1), cf = o.cf;
    this.grid(nu, nv, (s, t, q) => {
      const ph = s * TAU, r = r0 + (r1 - r0) * t + (rf ? rf(ph, t) : 0);
      q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = y0 + (y1 - y0) * t;
      q.u = s * girth; q.v = (o.v0 || 0) + t * (o.vLen ?? Math.hypot(r1 - r0, y1 - y0));
      q.ao = o.ao ? o.ao(t, ph) : 1; if (cf) cf(ph, t, q);
    }, true, false);
  }
  // flat quad from four corners (counter-clockwise seen from outside), uv in metres from the first edge
  quad(a, b, c, d, u0 = 0, v0 = 0, ao0 = 1, ao1 = 1) {
    const w = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), h = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    this.grid(1, 1, (s, t, q) => {
      const p0 = s ? b : a, p1 = s ? c : d;
      q.x = p0[0] + (p1[0] - p0[0]) * t; q.y = p0[1] + (p1[1] - p0[1]) * t; q.z = p0[2] + (p1[2] - p0[2]) * t;
      q.u = u0 + s * w; q.v = v0 + t * h; q.ao = t ? ao1 : ao0;
    }, false, true);
  }
  // box centred at (cx, cy, cz), rotated ry about Y; no bottom face
  box(cx, cy, cz, sx, sy, sz, ry = 0, tilt = null) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const P = (x, y, z) => { if (tilt) { x += tilt[0] * (y + hy); z += tilt[1] * (y + hy); } return [cx + x * c + z * s, cy + y, cz - x * s + z * c]; };
    this.quad(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz));
    this.quad(P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz));
    this.quad(P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz));
    this.quad(P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz));
    this.quad(P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz));
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aP', new THREE.Float32BufferAttribute(this.ap, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    return g;
  }
}

// height of a pointed (two-centred) arch of half-width hw above its springing, at offset x from the axis
export function archH(x, hw) { const c = hw * 0.45, R = hw + c, a = Math.min(hw, Math.abs(x)) + c; return Math.sqrt(Math.max(0, R * R - a * a)); }

// A wall W wide and H tall whose outside face lies at distance `dist` from the origin along direction `ang`
// (radians from +X toward +Z), holding a recessed pointed-arch niche. Local x runs along the wall.
export function archWall(G, ang, dist, W, H, o) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (x, y, z) => [c * (dist + z) + s * x, (o.y0 || 0) + y, s * (dist + z) - c * x];
  const hw = o.aw / 2, sp = o.spring, dp = o.depth, top = sp + archH(0, hw), fr = o.frame ?? 0.7, fT = top + fr + 0.5, N = 14;
  const wallPat = o.wallPat ?? 1, u0 = o.u0 || 0;
  // o.starS: pattern scale of the star lattice parts (jambs, spandrels, reveal, back) when it differs from the wall's;
  // o.framePat / o.frameLine: the frame in another pattern with a thin ochre line along its inner edge; o.reveal false:
  // the caller lines the reveal itself
  const S0 = G.uvS || 1, sS = o.starS || S0, fp = o.framePat ?? 5, fl = o.frameLine || 0;
  const flat = (x0, y0, x1, y1, z, pat, aux, ao0 = 1, ao1 = 1) => { G.set(pat, aux); G.quad(P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z), u0 + x0, y0, ao0, ao1); };
  // piers either side of the frame, wall above the frame
  flat(-W / 2, 0, -hw - fr - 0.5, H, 0, wallPat, o.wallAux || 0, 0.8, 1);
  flat(hw + fr + 0.5, 0, W / 2, H, 0, wallPat, o.wallAux || 0, 0.8, 1);
  flat(-hw - fr - 0.5, fT, hw + fr + 0.5, H, 0, wallPat, o.wallAux || 0);
  // gold-ochre frame standing 0.12 m proud, with returns
  const z1 = 0.12;
  flat(-hw - fr - 0.5, 0, -hw - 0.5, fT, z1, fp, 0, 0.8, 1); flat(hw + 0.5, 0, hw + fr + 0.5, fT, z1, fp, 0, 0.8, 1);
  flat(-hw - 0.5, top + 0.5, hw + 0.5, fT, z1, fp, 0);
  if (fl > 0) { flat(-hw - 0.5 - fl, 0, -hw - 0.5, top + 0.5 + fl, z1 + 0.03, 5, 0, 0.8, 1); flat(hw + 0.5, 0, hw + 0.5 + fl, top + 0.5 + fl, z1 + 0.03, 5, 0, 0.8, 1); flat(-hw - 0.5, top + 0.5, hw + 0.5, top + 0.5 + fl, z1 + 0.03, 5, 0); }
  // jamb panels and spandrels in star lattice
  const jb = o.jamb || [3, 0, sS];      // the half-metre jamb strips: [pattern, aux, scale]
  G.uvS = jb[2];
  flat(-hw - 0.5, 0, -hw, sp, 0.04, jb[0], jb[1], 0.75, 1); flat(hw, 0, hw + 0.5, sp, 0.04, jb[0], jb[1], 0.75, 1);
  G.uvS = sS; G.set(3, 0);
  G.grid(N, 1, (a, t, q) => {
    const x = -hw - 0.5 + a * (o.aw + 1), y0 = sp + archH(x, hw), y = y0 + (top + 0.5 - y0) * t, p = P(x, y, 0.04);
    q.x = p[0]; q.y = p[1]; q.z = p[2]; q.u = u0 + x; q.v = y;
  }, false, true);
  // reveal (intrados) running up one jamb, over the arch and down the other
  const out = (a) => { const k = a * (N + 4); if (k <= 2) return [-hw, sp * k / 2]; if (k >= N + 2) return [hw, sp * (N + 4 - k) / 2]; const x = -hw + (k - 2) / N * o.aw; return [x, sp + archH(x, hw)]; };
  const rA = o.revealAo ?? 0.55;      // occlusion at the back of the reveal (the front is 0.95)
  // uv.x is metres along the outline (up one jamb, over the arch, down the other), uv.y metres into the wall
  const arc = [0]; for (let k = 1; k <= N + 4; k++) { const e0 = out((k - 1) / (N + 4)), e1 = out(k / (N + 4)); arc.push(arc[k - 1] + Math.hypot(e1[0] - e0[0], e1[1] - e0[1])); }
  G.set(o.revealPat ?? 1, o.revealAux ?? 1);
  if (o.reveal !== false) G.grid(N + 4, 1, (a, t, q) => { const e = out(a), p = P(e[0], e[1], -dp * t); q.x = p[0]; q.y = p[1]; q.z = p[2]; q.u = arc[Math.round(a * (N + 4))]; q.v = dp * t; q.ao = 0.95 - (0.95 - rA) * t; }, false, false);
  // back wall of the niche, and a door or grille in it
  if (o.open) { G.uvS = S0; return; }
  G.set(o.backPat ?? 3, o.backAux || 0);
  G.grid(N, 2, (a, t, q) => { const x = -hw + a * o.aw, y = (sp + archH(x, hw)) * t, p = P(x, y, -dp); q.x = p[0]; q.y = p[1]; q.z = p[2]; q.u = u0 + x + 0.85; q.v = y; q.ao = 0.52 + 0.14 * t; if (o.backShade) q.b = 0; }, false, true);
  const dw = o.doorW ?? hw * 0.42, dh = o.doorH ?? sp * 0.8;
  G.set(o.doorPat ?? 6, o.doorAux || 0);
  G.grid(6, 1, (a, t, q) => { const x = -dw + a * 2 * dw, y = (dh + archH(x, dw) * 0.8) * t, p = P(x, y, -dp + 0.06); q.x = p[0]; q.y = p[1]; q.z = p[2]; q.u = x; q.v = y; q.ao = 0.6; q.g = o.doorG ?? 0; q.b = o.doorB ?? 0.5; }, false, true);
  G.uvS = S0;
  if (o.noSill) return;
  // sill ledge under the niche: catches snow
  G.set(0, 0); G.box(...P(0, 0.2, 0.25), o.aw + 2 * fr + 1.6, 0.4, 0.7, -ang + Math.PI / 2);
}

// ---------------------------------------------------------------- moving snow: chunks, powder, spindrift, ice dust
const GLSL_TAU = /* glsl */`
  uniform vec3 uTau;
  float tauOf(float slot) { return slot < 0.5 ? uTau.x : slot < 1.5 ? uTau.y : uTau.z; }
`;
function chunkMaterial(U, C, uTau) {
  const m = new THREE.ShaderMaterial({
    fog: true, uniforms: fogUniforms({ ...C }),
    vertexShader: /* glsl */`
      attribute vec4 aC, aV; attribute vec3 aR;
      ${GLSL_TAU}
      varying vec3 vWP, vN;
      #include <fog_pars_vertex>
      void main() {
        float t = tauOf(aV.w) - aC.w;
        float tl = clamp(t, 0.0, aR.z);
        float sc = step(0.0, t) * (1.0 - smoothstep(aR.z, aR.z + 0.3, t)) * aR.y;
        float a = t * (2.0 + 5.0 * aR.x), b = t * (1.0 + 4.0 * fract(aR.x * 7.3));
        float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
        vec3 p = position, n = normal;
        p = vec3(p.x * ca - p.y * sa, p.x * sa + p.y * ca, p.z); n = vec3(n.x * ca - n.y * sa, n.x * sa + n.y * ca, n.z);
        p = vec3(p.x, p.y * cb - p.z * sb, p.y * sb + p.z * cb); n = vec3(n.x, n.y * cb - n.z * sb, n.y * sb + n.z * cb);
        vec3 c = aC.xyz + aV.xyz * tl + vec3(0.0, -4.9, 0.0) * tl * tl;
        vec4 wp = modelMatrix * vec4(c + p * sc, 1.0);
        vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 cSnow;
      varying vec3 vWP, vN;
      #include <fog_pars_fragment>
      void main() {
        vec3 N = normalize(normalize(vN) + (vec3(vnoise(vWP.yz * 9.0), vnoise(vWP.xz * 9.0), vnoise(vWP.xy * 9.0)) - 0.5) * 0.7);
        float ndl = clamp(dot(N, uSunDir) * 0.8 + 0.2, 0.0, 1.0), mask = sunMask(vWP);
        vec3 col = cSnow * (0.72 + 0.16 * fbm(vWP.xz * 3.1 + vWP.y * 2.3)) * (uSunCol * ndl * mask * 0.44 + hemi(N) * 0.84);
        vec3 sc = floor(vWP * 26.0);
        col += uSunCol * step(0.99, h21(sc.xy + sc.z * 7.3)) * 1.6 * mask * ndl;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  m.uniforms.uTau = uTau;
  return shareUniforms(m, U);
}

function powderMaterial(U, C, uTau) {
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, uniforms: fogUniforms({ ...C }),
    vertexShader: /* glsl */`
      attribute vec4 aC, aV; attribute vec3 aR;
      uniform vec4 uWind;
      ${GLSL_TAU}
      varying vec3 vWP; varying vec3 vQ;   // corner xy, alpha
      varying float vSeed;
      #include <fog_pars_vertex>
      void main() {
        float t = tauOf(aV.w) - aC.w, a = clamp(t / aR.z, 0.0, 1.0);
        float k = (1.0 - exp(-1.6 * max(t, 0.0))) / 1.6;
        vec3 c = aC.xyz + aV.xyz * k + vec3(0.0, -1.5, 0.0) * max(t, 0.0) * (0.5 + k) + uWind.xyz * uWind.w * 0.35 * max(t, 0.0) * a;
        float size = aR.y * (0.35 + 2.4 * sqrt(a)) * step(0.0, t) * step(t, aR.z);
        vec4 wp = modelMatrix * vec4(c, 1.0);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        float rot = aR.x * 6.283 + t * (aR.x - 0.5);
        vec2 q = vec2(position.x * cos(rot) - position.y * sin(rot), position.x * sin(rot) + position.y * cos(rot));
        wp.xyz += (right * q.x + up * q.y) * size;
        vWP = wp.xyz; vQ = vec3(position.xy, smoothstep(0.0, 0.07, a) * (1.0 - a) * (1.0 - a) * smoothstep(1.5, 6.0, length(cameraPosition - (modelMatrix * vec4(c, 1.0)).xyz))); vSeed = aR.x;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 cSnow;
      varying vec3 vWP; varying vec3 vQ; varying float vSeed;
      #include <fog_pars_fragment>
      void main() {
        float r = length(vQ.xy);
        float n = fbm(vQ.xy * 2.2 + vSeed * 31.0);
        float a = (1.0 - smoothstep(0.15 + 0.45 * n, 1.0, r)) * vQ.z * 0.56;
        if (a < 0.004) discard;
        float mask = sunMask(vWP);
        vec3 col = cSnow * 0.8 * (hemi(vec3(0.0, 0.6, 0.0)) * 0.95 + uSunCol * mask * (0.3 + 0.25 * n) * (1.0 - 0.5 * r));
        vec3 sc = floor(vWP * 9.0);
        col += uSunCol * step(0.995, h21(sc.xy + sc.z * 3.1 + floor(uTime * 3.0))) * 1.5 * mask * (1.0 - r);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  m.uniforms.uTau = uTau;
  return shareUniforms(m, U);
}

function spindriftMaterial(U, C) {
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: fogUniforms({ ...C }),
    vertexShader: /* glsl */`
      attribute vec4 aA, aB;
      uniform vec4 uWind; uniform float uTime;
      varying vec3 vWP; varying vec4 vQ;
      #include <fog_pars_vertex>
      void main() {
        float s = aB.x, seed = aA.w, len = aB.z * 0.7;
        float yw = (fract(seed * 7.31) - 0.5) * 0.5, cy = cos(yw), sy = sin(yw);
        vec3 dir = normalize(vec3(uWind.x * cy - uWind.z * sy, uWind.y + 0.10 * sin(seed * 20.0), uWind.x * sy + uWind.z * cy));
        vec3 lat = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
        vec3 c = aA.xyz + dir * s * len;
        // each plume bends along its length as the wind swings, lifts off its anchor and then sags
        c.y += s * len * 0.10 + sin(s * 5.0 - uTime * 1.7 + seed * 9.0) * 0.7 * s - s * s * len * 0.15;
        c += lat * (sin(s * 3.7 - uTime * 1.1 + seed * 5.0) * 1.1 * s + sin(s * 5.0 + seed * 20.0 + uTime * 1.3) * s * len * 0.18);
        vec4 wp = modelMatrix * vec4(c, 1.0);
        vec3 wd = normalize(mat3(modelMatrix) * dir);
        vec3 sv = cross(wd, cameraPosition - wp.xyz); sv = sv / max(length(sv), 1e-4);
        wp.xyz += sv * aB.y * aB.w * (0.12 + 1.05 * s);
        vWP = wp.xyz; vQ = vec4(s, aB.y, seed, len);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LIGHT}
      uniform vec3 cSnow; uniform vec4 uWind;
      varying vec3 vWP; varying vec4 vQ;
      #include <fog_pars_fragment>
      void main() {
        float s = vQ.x, e = vQ.y, seed = vQ.z;
        float gust = 0.55 + 0.45 * sin(uTime * 0.8 + seed * 17.0);
        float n = fbm(vec2(s * vQ.w * 0.3 - uTime * 1.5, e * 1.6 + seed * 7.0));
        float n2 = vnoise(vec2(s * vQ.w * 1.4 - uTime * 3.2, e * 5.0 + seed * 3.0));
        float mask = sunMask(vWP);
        // torn into puffs along its length and gone over its last two fifths; thinner still where the sun lights it
        float a = pow(max(1.0 - e * e, 0.0), 2.0) * smoothstep(0.0, 0.1, s) * pow(clamp(1.0 - s, 0.0, 1.0), 1.4) * (1.0 - smoothstep(0.6, 1.0, s)) * smoothstep(0.24, 1.0, n * 0.8 + n2 * 0.5) * (0.34 + 0.3 * gust) * mix(1.0, 0.6, mask);
        if (a < 0.004) discard;
        vec3 V = normalize(cameraPosition - vWP);
        float fwd = pow(max(dot(-V, uSunDir), 0.0), 6.0);
        vec3 col = min(cSnow * 0.8 * (hemi(vec3(0.0, 0.5, 0.0)) + uSunCol * mask * (0.28 + 0.35 * fwd)), vec3(0.92));
        vec3 sc = floor(vWP * 9.0);
        float tw = step(0.975, h21(sc.xy + sc.z * 5.7)) * pow(max(sin(uTime * (3.0 + 6.0 * h21(sc.zx)) + h21(sc.yz) * 40.0), 0.0), 8.0);
        col += uSunCol * tw * 4.0 * mask;
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  return shareUniforms(m, U);
}

function dustMaterial(U, C) {
  const m = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...C },
    vertexShader: /* glsl */`
      attribute vec4 aA;
      uniform vec4 uWind, uEdge; uniform float uTime, uSunAmt;
      varying vec3 vQ;
      void main() {
        vec3 box = vec3(90.0, 56.0, 90.0);
        vec3 c = mod(aA.xyz * box + uWind.xyz * uWind.w * uTime * 0.5 + vec3(0.0, -0.6 * uTime, 0.0), box) - box * 0.5 + vec3(0.0, 40.0, 0.0);
        c.x += sin(uTime * 0.6 + aA.w * 30.0) * 0.8; c.y += sin(uTime * 0.9 + aA.w * 50.0) * 0.4;
        vec4 wp = modelMatrix * vec4(c, 1.0);
        float dist = length(cameraPosition - wp.xyz);
        float size = max(0.03, dist * 0.0013);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        wp.xyz += (right * position.x + up * position.y) * size;
        float d = dot(wp.xz, uEdge.xy) - uEdge.z;
        float mask = uSunAmt * (1.0 - smoothstep(-uEdge.w, uEdge.w, d));
        float tw = pow(max(sin(uTime * (2.0 + 5.0 * aA.w) + aA.w * 90.0), 0.0), 40.0);
        vQ = vec3(position.xy, tw * mask * smoothstep(3.0, 9.0, dist) * (1.0 - smoothstep(120.0, 260.0, dist)));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol;
      varying vec3 vQ;
      void main() {
        float r = length(vQ.xy);
        float a = (1.0 - smoothstep(0.2, 1.0, r)) * vQ.z;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uSunCol * 2.4 * a, 1.0);
      }`,
  });
  return shareUniforms(m, U);
}

// merged camera-facing quads / ribbons helpers
function quadCloud(n, fill) {
  const pos = new Float32Array(n * 12), a = new Float32Array(n * 16), b = new Float32Array(n * 16), c = new Float32Array(n * 12), idx = [];
  const C = [-1, -1, 1, -1, 1, 1, -1, 1], o = { a: [0, 0, 0, 0], b: [0, 0, 0, 0], c: [0, 0, 0] };
  for (let i = 0; i < n; i++) {
    fill(i, o);
    for (let k = 0; k < 4; k++) {
      pos.set([C[k * 2], C[k * 2 + 1], 0], (i * 4 + k) * 3); a.set(o.a, (i * 4 + k) * 4); b.set(o.b, (i * 4 + k) * 4); c.set(o.c, (i * 4 + k) * 3);
    }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(a, 4)); g.setAttribute('aA', new THREE.BufferAttribute(a, 4));
  g.setAttribute('aV', new THREE.BufferAttribute(b, 4)); g.setAttribute('aR', new THREE.BufferAttribute(c, 3));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-dome') : ctx.rng;
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const duration = opts.duration ?? 41, releaseU = opts.releaseU ?? 0.47, lightU = opts.lightU ?? 0.46;
  const slabAngle = opts.slabAngle ?? Math.PI;
  const object = new THREE.Group(); object.name = 'snow-on-turquoise-hero';

  // per-seed character
  const snowiness = rng.range(0.86, 1.12);
  const hueShift = rng.range(-0.012, 0.016);
  const turq = pal[1].clone().offsetHSL(hueShift, 0, rng.range(-0.02, 0.02));
  const uvSeed = rng.range(0, 40);

  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.35, 0.42, 0.84)).normalize();
  const U = {
    uSunDir: { value: sunDir.clone() },
    uSunCol: { value: new THREE.Color('#FFF1D6').multiplyScalar(2.3) },
    uSunAmt: { value: 1 },
    uEdge: { value: new THREE.Vector4(Math.SQRT1_2, -Math.SQRT1_2, 1e5, 15) },
    uSky: { value: new THREE.Color('#6F9BE8').multiplyScalar(0.95) },
    uBounce: { value: new THREE.Color('#DCE6F2').multiplyScalar(0.5) },
    uTime: { value: 0 },
    uWind: { value: new THREE.Vector4(0.75, 0.1, -0.65, 6) },
    uFogCap: { value: 1 }, uFogTop: { value: 1e5 },
    uKey: { value: 0 }, uGhost: { value: 0 }, uShaft: { value: new THREE.Vector4(0, 0, 0.01, 0) }, uShaft2: { value: new THREE.Vector4(0, 0, 0.01, 0) },
  };
  { const w = new THREE.Vector3(0.75, 0.1, -0.65).normalize(); U.uWind.value.set(w.x, w.y, w.z, 6); }
  const C = {
    cSnow: { value: pal[0] }, cTurq: { value: turq }, cCob: { value: pal[2] }, cDeep: { value: pal[3] },
    cOchre: { value: pal[4] }, cBuff: { value: pal[6] },
  };
  const P = makeProfile(), LEN = P.length, pr = { r: 0, y: 0, nr: 0, ny: 0 };
  await ctx.yield();

  // ---- the ribbed dome: 64 lobes, 8 columns a rib
  {
    const NU = NRIB * 8, NV = 38, V0 = 0.03, W = NU + 1;
    const pos = new Float32Array(W * (NV + 1) * 3), nor = new Float32Array(W * (NV + 1) * 3), nm = new Float32Array(W * (NV + 1) * 3), aD = new Float32Array(W * (NV + 1) * 4);
    const pt = (q, v, o) => {
      profAt(P, v, pr);
      const x = ((q + 0.5) - Math.floor(q + 0.5) - 0.5) * 2, h = ribAmp(pr.r) * lobe(x), r = pr.r + pr.nr * h, ph = q * TAU / NRIB;
      o[0] = Math.cos(ph) * r; o[1] = pr.y + pr.ny * h; o[2] = Math.sin(ph) * r;
    };
    const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], d = [0, 0, 0], p0 = [0, 0, 0];
    for (let j = 0; j <= NV; j++) {
      const v = V0 + (1 - V0) * (j / NV);
      for (let i = 0; i <= NU; i++) {
        const q = i / 8, k = j * W + i, ph = q * TAU / NRIB;
        pt(q, v, p0); pt(q - 0.03, v, a); pt(q + 0.03, v, b); pt(q, Math.max(0.001, v - 0.004), c); pt(q, Math.min(1, v + 0.004), d);
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
        pos.set(p0, k * 3); nor.set([nx / l, ny / l, nz / l], k * 3);
        profAt(P, v, pr);
        nm.set([pr.nr * Math.cos(ph), pr.ny, pr.nr * Math.sin(ph)], k * 3);
        aD.set([q + 0.0, v * LEN + uvSeed, pr.r, 1 - 0.3 * sstep(0.93, 1, v)], k * 4);
      }
      if (j % 2 === 1) await ctx.yield();
    }
    const idx = new Uint32Array(NU * NV * 6); let n = 0;
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const k = j * W + i; idx[n++] = k; idx[n++] = k + 1; idx[n++] = k + W; idx[n++] = k + 1; idx[n++] = k + W + 1; idx[n++] = k + W; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aNm', new THREE.BufferAttribute(nm, 3)); g.setAttribute('aD', new THREE.BufferAttribute(aD, 4));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    var domeMat = domeMaterial(U, C);
    const mesh = new THREE.Mesh(g, domeMat); mesh.name = 'dome'; object.add(mesh);
  }
  await ctx.yield();

  // ---- snow: 64 groove strips (param space, slide in the vertex shader) + static caps, ledges and roofs
  const k0 = ((Math.round(slabAngle / (TAU / NRIB) - 0.5) % NRIB) + NRIB) % NRIB;
  const slotK = [k0, (k0 + 1) % NRIB, (k0 + 2) % NRIB];      // later releases lie further along the camera's sweep
  // the slabs are the snow below the bulge: 12 to 15 m of groove that lets go, pours off the cornice from the first
  // instant and is gone in about two seconds, so the whole event fits the time the groove is beside the camera
  const relV = opts.relV || [rng.range(0.61, 0.64), rng.range(0.64, 0.68), rng.range(0.67, 0.71)];
  const relDelay = [0, rng.range(0.2, 0.35), rng.range(0.4, 0.6)];
  const SL = { a: 6.5, vmax: 15 };
  const slideAt = (t) => { if (t <= 0) return 0; const tc = SL.vmax / SL.a; return t < tc ? 0.5 * SL.a * t * t : 0.5 * SL.a * tc * tc + SL.vmax * (t - tc); };
  const timeFor = (dist) => { const tc = SL.vmax / SL.a, dc = 0.5 * SL.a * tc * tc; return dist < dc ? Math.sqrt(2 * dist / SL.a) : tc + (dist - dc) / SL.vmax; };
  const S = { uShed: { value: new THREE.Vector4(-1, 2, 0, 0.5) }, prof: P.tab, uSlide: { value: new THREE.Vector3() }, uRelV: { value: new THREE.Vector3(relV[0], relV[1], relV[2]) }, len: LEN };
  const sPos = [], sNor = [], sG = [], sS = [], sE = [], sIdx = []; let sCount = 0;
  const strip = (k, va, vb, nseg, slot, hero) => {
    const ph = (k + 0.5) * TAU / NRIB, seed = rng();
    const base = sCount;
    // gaps first. A gap shorter than three rows (about 2 m) between two stretches of snow is filled, so the stripe
    // stays whole; then a stretch of snow shorter than three rows left between gaps, or between a gap and the
    // strip's end, goes with the gap: alone in an empty groove it reads as a lump stuck in a hole in the rib.
    const gaps = [];
    for (let j = 0; j <= nseg; j++) {
      const v = va + (vb - va) * (j / nseg), n2 = noise.n2(k * 2.9 + 50, v * 3.6), gthr = 0.62 - 0.36 * sstep(0.66, 0.95, v);
      gaps.push(hero ? 0 : sstep(gthr, gthr + 0.07, n2));
    }
    if (!hero) for (const want of [0, 1]) for (let j = 0, run = -1; j <= nseg + 1; j++) {
      const inRun = j <= nseg && (gaps[j] < 0.5) === (want === 1);
      if (inRun && run < 0) run = j;
      if (!inRun && run >= 0) {
        // want 0: a run of gap rows, filled if short and enclosed; want 1: a run of snow rows, removed if short
        if (j - run < 3 && (want === 1 ? run > nseg * 0.35 : run > 0 && j <= nseg)) for (let i = run; i < j; i++) gaps[i] = want;
        run = -1;
      }
    }
    for (let j = 0; j <= nseg; j++) {
      const v = va + (vb - va) * (j / nseg);
      const n1 = noise.n2(k * 3.7 + 11, v * 9);
      // packed wide at the crown, a stripe on the shoulder, thin and broken under the bulge
      let wf = (0.96 - 0.41 * sstep(0.03, 0.22, v) - 0.1 * sstep(0.34, 0.58, v) - 0.12 * sstep(0.62, 0.8, v) - 0.08 * sstep(0.85, 1, v)) * snowiness * (1 + 0.13 * n1);
      let th = (0.16 + 0.07 * n1 + 0.1 * sstep(0.3, 0.05, v)) * snowiness;
      const gap = gaps[j];
      // gaps and ends keep their width and are broken off raggedly in the fragment shader (aE), so no knife-cut points
      wf *= (0.86 + 0.3 * noise.n2(k * 7.1 + 3, v * 46)) * (1 - 0.25 * gap); th *= 1 - 0.5 * gap;
      if (hero) { wf = Math.min(0.66, wf * 1.1); th *= 1.5; }
      // the lower end runs out as a long narrowing tongue (rounded off in the fragment shader), not a squared-off bar
      const end = hero ? 1 : sstep(0, 0.03, v - va) * sstep(0, 0.075, vb - v);
      wf = Math.min(0.97, wf * (0.5 + 0.5 * end)); th *= 0.4 + 0.6 * end;
      const eat = hero ? 0 : Math.max(gap, 1 - end);
      for (let i = 0; i < 5; i++) { sPos.push(0, 40, 0); sNor.push(0, 1, 0); sG.push(ph, v, (i - 2) / 2, wf); sS.push(slot, seed, th); sE.push(eat); }
      if (j < nseg) for (let i = 0; i < 4; i++) { const a = base + j * 5 + i, b = a + 1, c = a + 5, d = c + 1; sIdx.push(a, c, b, b, c, d); }
    }
    sCount += (nseg + 1) * 5;
  };
  for (let k = 0; k < NRIB; k++) {
    const slot = slotK.indexOf(k), vTop = 0.04 + 0.02 * rng(), vEnd = slot >= 0 ? 0.99 : rng.range(0.88, 0.99) - (rng.chance(0.18) ? rng.range(0.1, 0.25) : 0);
    if (slot >= 0) { strip(k, vTop, relV[slot] - 0.0005, 26, 3, false); strip(k, relV[slot], vEnd, 32, slot, true); }
    else strip(k, vTop, vEnd, 40, 3, false);
  }
  await ctx.yield();

  // ---- architecture (one tile material) and static snow drifts
  const G = new Geo(), SG = new Geo();
  const AP = 19, FACE = 2 * AP * Math.tan(Math.PI / 8), WALL_H = 13.9, ROOF_Y = 13;
  const T = new THREE.Matrix4();
  // lathe from a list of [r, y] points
  const lathe = (g, pts, o = {}) => { for (let i = 0; i < pts.length - 1; i++) g.ring(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); };
  const ball = (yc, R, n = 5) => { const a = []; for (let i = 0; i <= n; i++) { const t = -1.25 + 2.5 * i / n; a.push([Math.max(0.12, Math.cos(t) * R), yc + Math.sin(t) * R]); } return a; };
  const scallop = (cells, amp, tiers) => (ph, t) => { const tier = Math.min(tiers - 1, Math.floor(t * tiers)); return amp * Math.abs(Math.sin(ph * cells * 0.5 + tier * Math.PI * 0.5)) * (0.45 + 0.55 * (t * tiers - tier)); };
  const cellTint = (cells, tiers) => (ph, t, q) => { const tier = Math.min(tiers - 1, Math.floor(t * tiers)), c = Math.floor(ph * cells / TAU + tier * 0.5); q.g = (c + tier) % 2 ? 0.92 : 0.06; q.b = 0.35 + 0.5 * (((c * 7 + tier * 3) % 5) / 4); };

  // octagonal base hall: seven niche walls, the front wall hidden behind the gateway slab
  for (let i = 0; i < 8; i++) {
    const ang = i * Math.PI / 4;
    if (i !== 2) archWall(G, ang, AP, FACE, WALL_H, { aw: 6.4, spring: 4.6, depth: 1.3, wallPat: 1, wallAux: 0, u0: i * 2.4 + uvSeed, backPat: rng.chance(0.35) ? 6 : 3 });
    const c = Math.cos(ang), s = Math.sin(ang), W2 = FACE / 2;
    const Pw = (x, y, z) => [c * (AP + z) + s * x, y, s * (AP + z) - c * x];
    // ochre string course, parapet top and inner face
    G.set(5, 0); G.quad(Pw(-W2, 11.6, 0.1), Pw(W2, 11.6, 0.1), Pw(W2, 12.1, 0.1), Pw(-W2, 12.1, 0.1));
    G.set(0, 0); G.quad(Pw(-W2, WALL_H, 0.05), Pw(W2, WALL_H, 0.05), Pw(W2 - 0.25, WALL_H, -0.6), Pw(-W2 + 0.25, WALL_H, -0.6));
    G.quad(Pw(W2 - 0.25, ROOF_Y, -0.6), Pw(-W2 + 0.25, ROOF_Y, -0.6), Pw(-W2 + 0.25, WALL_H, -0.6), Pw(W2 - 0.25, WALL_H, -0.6));
    // engaged corner shaft with a snow-capped knob
    const va = ang + Math.PI / 8, vr = AP / Math.cos(Math.PI / 8);
    G.m = T.clone().makeTranslation(Math.cos(va) * vr, 0, Math.sin(va) * vr);
    G.set(4, 0); G.ring(0.72, 0, 0.62, 14.3, { nu: 10, nv: 2, girth: 14.4513, vLen: 14.3 });
    G.set(5, 0); lathe(G, [[0.8, 14.3], [0.8, 14.7], [0.5, 15.0]], { nu: 10 });
    G.set(8, 0); lathe(G, [[0.5, 15.0], [0.66, 15.4], [0.5, 15.9], [0.12, 16.3]], { nu: 10, cf: (ph, t, q) => { q.g = 0.05; q.b = 0.6; } });
    G.m = null;
  }
  await ctx.yield();
  // gateway slab (pishtaq) on the front, +Z
  {
    const PD = AP + 4.5, PW = 17.5, PH = 21, a = Math.PI / 2;
    archWall(G, a, PD, PW, PH, { aw: 8.6, spring: 7.5, depth: 3.4, wallPat: 1, wallAux: 1, frame: 0.8, backPat: 3, doorPat: 7, doorW: 1.5, doorH: 4.2, revealPat: 3, u0: uvSeed });
    const Pw = (x, y, z) => [x, y, PD + z];        // ang = 90 deg: local x = world x, outward = +Z
    const hw = PW / 2;
    G.set(2, 0);    // interlace frieze across the head of the slab (2 m tall: the 4 m band at half scale)
    G.grid(1, 1, (s, t, q) => { q.x = -hw + 0.6 + s * (PW - 1.2); q.y = 15.6 + 2.2 * t; q.z = PD + 0.1; q.u = s * 32; q.v = t * 4; }, false, true);
    G.set(5, 0); G.quad(Pw(-hw, 18.2, 0.12), Pw(hw, 18.2, 0.12), Pw(hw, 18.7, 0.12), Pw(-hw, 18.7, 0.12));
    G.set(1, 0);
    G.quad(Pw(hw, 0, 0), Pw(hw, 0, -4.5 - 3), Pw(hw, PH, -4.5 - 3), Pw(hw, PH, 0), 0, 0, 0.8, 1);
    G.quad(Pw(-hw, 0, -4.5 - 3), Pw(-hw, 0, 0), Pw(-hw, PH, 0), Pw(-hw, PH, -4.5 - 3), 0, 0, 0.8, 1);
    G.set(0, 0);
    G.quad(Pw(hw, WALL_H - 1, -7.5), Pw(-hw, WALL_H - 1, -7.5), Pw(-hw, PH, -7.5), Pw(hw, PH, -7.5));
    G.quad(Pw(-hw, PH, 0), Pw(hw, PH, 0), Pw(hw, PH, -7.5), Pw(-hw, PH, -7.5));
    for (const sx of [-1, 1]) {      // corner turrets
      G.m = T.clone().makeTranslation(sx * hw, 0, PD - 0.2);
      G.set(0, 0); G.ring(1.25, 0, 1.25, 2.4, { nu: 8 }); G.ring(1.25, 2.4, 1.0, 2.4, { nu: 8 });
      G.set(4, 0); G.ring(1.0, 2.4, 0.86, 22.6, { nu: 14, nv: 3, girth: 14.4513, vLen: 20.2 });
      G.set(5, 0); lathe(G, [[0.98, 22.6], [1.05, 23.0], [1.3, 23.5], [1.3, 23.8], [0.8, 23.8]], { nu: 14 });
      G.set(8, 0); lathe(G, [[0.8, 23.8], [1.05, 24.5], [0.95, 25.2], [0.55, 25.9], [0.1, 26.3]], { nu: 16, rf: (ph) => 0.06 * Math.abs(Math.cos(ph * 4)), cf: (ph, t, q) => { q.g = 0.04; q.b = 0.6; } });
      G.set(5, 1); lathe(G, [[0.1, 26.3], ...ball(26.7, 0.22, 3), [0.03, 27.6]], { nu: 6 });
      G.m = null;
    }
  }
  await ctx.yield();
  // roof of the hall (snow lies on it by the shader) and the foot of the drum
  G.set(0, 0);
  G.grid(64, 1, (s, t, q) => { const ph = s * TAU, f = ((ph + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8, ro = (AP - 0.6) / Math.cos(f), r = ro + (13.4 - ro) * t; q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = ROOF_Y; q.u = q.x; q.v = q.z; q.ao = 1 - 0.3 * t; }, true, false);
  lathe(G, [[14.3, ROOF_Y], [14.3, 13.9], [13.55, 13.9]], { nu: 48 });
  G.set(5, 0); lathe(G, [[13.5, 13.9], [13.62, 14.25], [13.12, 14.6]], { nu: 64 });
  // drum: diamond brickwork, gold collars, the 4 m interlace band, chevrons, scalloped cornice
  G.set(1, 0); G.ring(13, 14.6, 13, 21.5, { nu: 96, nv: 2, girth: 81.6, v0: 0, vLen: 6.9, ao: (t) => 0.8 + 0.2 * Math.min(1, t * 3) });
  G.set(5, 0); lathe(G, [[13, 21.5], [13.14, 21.6], [13.14, 21.9], [13, 22]], { nu: 96 });
  G.set(2, 0); G.ring(13, 22, 13, 26, { nu: 96, nv: 1, girth: 82, v0: 0, vLen: 4 });
  G.set(5, 0); lathe(G, [[13, 26], [13.14, 26.1], [13.14, 26.4], [13, 26.5]], { nu: 96 });
  G.set(1, 1); G.ring(13, 26.5, 13, 28.3, { nu: 96, nv: 1, girth: 81.6, v0: 0.3, vLen: 1.8, ao: (t) => 1 - 0.28 * t });
  G.set(8, 0); G.ring(13, 28.3, 15.3, 30.3, { nu: 192, nv: 9, rf: scallop(48, 0.24, 3), cf: cellTint(48, 3), ao: (t) => 0.62 + 0.38 * t });
  G.set(5, 0); lathe(G, [[15.55, 30.3], [15.6, 30.75], [13.2, 30.75]], { nu: 96 });
  await ctx.yield();
  // eight grille windows with gold surrounds
  for (let i = 0; i < 8; i++) {
    const p0 = (i + 0.5) * Math.PI / 4, hwA = 1.15 / 13;
    for (const [pat, grow, rr] of [[5, 0.3, 13.04], [6, 0, 13.08]]) {
      G.set(pat, 0);
      G.grid(6, 1, (s, t, q) => { const x = (s - 0.5) * 2, ph = p0 + x * (hwA + grow / 13), top = 18.6 + grow + archH(x * 1.15, 1.15) * 1.0; const y = 15.7 - grow + (top - 15.7 + grow) * t; q.x = Math.cos(ph) * rr; q.z = Math.sin(ph) * rr; q.y = y; q.u = x * 1.15; q.v = y; q.ao = 0.85; }, false, false);
    }
  }
  // putlog beams left in the drum, a scaffold and a ladder on the lee side: repairs never finished
  G.set(7, 0);
  const nBeams = rng.int(14, 22), beamPh0 = rng.range(0, TAU);
  for (let i = 0; i < nBeams; i++) {
    if (rng.chance(0.25)) continue;
    const ph = beamPh0 + i * TAU / nBeams, L = rng.range(1.1, 2.0), r = 13 + L / 2 - 0.2;
    G.box(Math.cos(ph) * r, 27.2 + rng.range(-0.05, 0.05), Math.sin(ph) * r, L, 0.16, 0.16, -ph);
  }
  const scPh = rng.range(-1.9, -0.5);      // north-east quadrant
  for (let i = 0; i < 4; i++) {
    const ph = scPh + (i - 1.5) * 0.11;
    for (const r of [13.5, 14.9]) G.box(Math.cos(ph) * r, ROOF_Y + 6.6, Math.sin(ph) * r, 0.16, 13.2 + rng.range(-0.6, 1.4), 0.16, -ph, [rng.range(-0.01, 0.01), rng.range(-0.01, 0.01)]);
  }
  for (let lv = 0; lv < 3; lv++) {
    const y = ROOF_Y + 3.6 + lv * 4.1;
    G.box(Math.cos(scPh) * 14.2, y, Math.sin(scPh) * 14.2, 1.7, 0.08, 4.9, -scPh);
    G.box(Math.cos(scPh) * 14.95, y - 0.5, Math.sin(scPh) * 14.95, 0.1, 0.1, 5.2, -scPh);
  }
  G.box(Math.cos(scPh + 0.26) * 14.4, ROOF_Y + 2.0, Math.sin(scPh + 0.26) * 14.4, 0.5, 4.2, 0.08, -scPh, [0.0, 0.0]);
  // gold finial: collar, three balls, spike
  G.set(5, 1);
  lathe(G, [[1.8, 56.8], [1.65, 57.7], [0.8, 58.3], [0.42, 58.9], ...ball(59.9, 0.95), [0.3, 60.75], ...ball(61.35, 0.62), ...ball(62.2, 0.36, 4), [0.14, 62.7], [0.03, 64]], { nu: 20 });
  await ctx.yield();

  // ---- static snow: cornice ledge, roof drifts banked on the lee side, gateway top
  const leeAng = Math.atan2(U.uWind.value.z, U.uWind.value.x);
  SG.grid(128, 3, (s, t, q) => {
    const ph = s * TAU, h = (0.2 + 0.14 * noise.n2(Math.cos(ph) * 4, Math.sin(ph) * 4 + 7)) * snowiness, k = t * 3;
    const r = k < 1 ? 15.82 - 0.5 * k : k < 2 ? 15.32 - 1.1 * (k - 1) : 14.22 - 0.95 * (k - 2);
    q.y = k < 1 ? 30.62 + (0.13 + h) * k : k < 2 ? 30.75 + h * (1 + 0.15 * (k - 1)) : 30.75 + h * 1.15 + (0.35 + h) * (k - 2);
    q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r;
  }, true, false);
  SG.grid(96, 5, (s, t, q) => {
    const ph = s * TAU, f = ((ph + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8, ro = (AP - 0.75) / Math.cos(f), r = ro + (14.25 - ro) * t;
    const lee = Math.max(0, Math.cos(ph - leeAng));
    q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r;
    q.y = ROOF_Y + (0.1 + 0.1 * noise.n2(q.x * 0.35, q.z * 0.35) + (0.25 + 1.0 * lee) * t * t * t + 0.4 * (1 - t) * (1 - t) * (1 - t)) * snowiness;
  }, true, false);
  SG.grid(8, 4, (s, t, q) => {
    const ex = Math.min(s, 1 - s) * 8, ez = Math.min(t, 1 - t) * 4, e = Math.min(1, ex) * Math.min(1, ez);
    q.x = (s - 0.5) * 17.9; q.z = AP - 3.1 + t * 7.8; q.y = 20.95 + (0.12 + 0.3 * e + 0.12 * noise.n2(q.x * 0.5, q.z * 0.5)) * snowiness;
  }, false, true);
  await ctx.yield();

  // ---- the two leaning minarets
  const minaretInfo = [];
  const minaret = (x, z, leanDir, leanDeg, hs) => {
    const k = new THREE.Vector3(Math.sin(leanDir), 0, -Math.cos(leanDir));
    const M = new THREE.Matrix4().makeRotationAxis(k, leanDeg * Math.PI / 180).setPosition(x, 0, z);
    G.m = M; SG.m = M;
    const Y = (y) => y * hs, shaftR = (y) => 2.75 - 0.6 * (y - 5.3) / 27.7;
    G.set(0, 0); G.ring(3.3, 0, 3.2, Y(4.6), { nu: 8, nv: 2, ao: (t) => 0.75 + 0.25 * t }); G.ring(3.2, Y(4.6), 2.85, Y(4.6), { nu: 8 });
    G.set(5, 0); lathe(G, [[2.85, Y(4.6)], [2.95, Y(4.95)], [2.75, Y(5.3)]], { nu: 32 });
    G.set(4, 0); G.ring(2.75, Y(5.3), 2.15, Y(33), { nu: 32, nv: 6, girth: 14.4513, v0: rng.range(0, 6), vLen: Y(27.7) });
    G.set(5, 0);
    for (const yc of [17.6, 32.5]) { const r = shaftR(yc) + 0.1; lathe(G, [[r - 0.1, Y(yc - 0.4)], [r, Y(yc - 0.3)], [r, Y(yc + 0.3)], [r - 0.12, Y(yc + 0.4)]], { nu: 32 }); }
    G.set(8, 0); G.ring(2.15, Y(33), 3.4, Y(35.4), { nu: 96, nv: 6, rf: scallop(24, 0.2, 3), cf: cellTint(24, 3), ao: (t) => 0.6 + 0.4 * t });
    G.set(5, 0); lathe(G, [[3.6, Y(35.4)], [3.65, Y(35.7)], [1.75, Y(35.7)]], { nu: 32 });
    G.set(6, 0); G.ring(3.5, Y(35.7), 3.5, Y(36.6), { nu: 32, girth: 21.84, vLen: 0.84 });
    G.set(1, 1); G.ring(1.75, Y(35.7), 1.65, Y(39.6), { nu: 24, nv: 1, girth: 9.6, vLen: 3.9 });
    G.set(8, 0); G.ring(1.65, Y(39.6), 2.15, Y(40.3), { nu: 64, nv: 3, rf: scallop(16, 0.12, 1), cf: cellTint(16, 1), ao: (t) => 0.65 + 0.35 * t });
    G.set(5, 0); lathe(G, [[2.3, Y(40.3)], [2.32, Y(40.55)], [1.6, Y(40.55)]], { nu: 32 });
    G.set(8, 0);
    G.grid(64, 10, (s, t, q) => {
      const ph = s * TAU, tt = Math.max(0, (t - 0.3) / 0.7), r0 = t < 0.3 ? 1.6 + 0.38 * Math.sin(t / 0.3 * Math.PI / 2) : 1.98 * Math.pow(Math.max(0, 1 - Math.pow(tt, 1.9)), 0.62);
      const r = r0 * (1 + 0.075 * Math.abs(Math.cos(ph * 8))) + 0.1 * (1 - t);
      q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = Y(40.55 + 3.5 * t); q.u = s * 12; q.v = t * 4; q.g = 0.03; q.b = 0.62 + 0.25 * Math.abs(Math.cos(ph * 8));
    }, true, false);
    G.set(5, 1); lathe(G, [[0.2, Y(43.9)], ...ball(Y(44.05) + 0.4, 0.3, 4), [0.1, Y(44.05) + 0.85], [0.02, Y(44.05) + 1.7]], { nu: 8 });
    // snow: balcony floor drift, rail caps, cap dome hood
    SG.grid(32, 2, (s, t, q) => { const ph = s * TAU, r = 3.68 - 1.9 * t; q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = Y(35.7) + (t === 0 ? -0.06 : 0.16 + 0.1 * noise.n2(ph * 2, x)) + 0.2 * t * t; }, true, false);
    SG.grid(32, 2, (s, t, q) => { const ph = s * TAU, r = 3.62 - 0.24 * t; q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = Y(36.6) + (t === 1 ? 0.14 + 0.07 * noise.n2(ph * 3, z) : 0); }, true, false);
    SG.grid(24, 3, (s, t, q) => { const ph = s * TAU, tt = 0.58 + 0.42 * t, r0 = 1.98 * Math.pow(Math.max(0, 1 - Math.pow((tt - 0.3) / 0.7, 1.9)), 0.62); const r = Math.max(0.24, r0 * 1.09 + 0.06 + 0.07 * noise.n2(ph * 2, x + t * 3) * (1 - t)); q.x = Math.cos(ph) * r; q.z = Math.sin(ph) * r; q.y = Y(40.55 + 3.5 * tt) + 0.1; }, true, false);
    G.m = null; SG.m = null;
    minaretInfo.push({ base: new THREE.Vector3(x, 0, z), top: new THREE.Vector3(0, Y(44.05) + 1.7, 0).applyMatrix4(M), lean: new THREE.Vector3(Math.cos(leanDir), 0, Math.sin(leanDir)).multiplyScalar(Math.sin(leanDeg * Math.PI / 180)), balconyY: Y(35.7), radius: 3.7 });
  };
  if (opts.minarets !== false) {
    minaret(-22, 130, rng.range(0, TAU), rng.range(2.0, 3.0), rng.range(0.97, 1.04));
    await ctx.yield();
    minaret(-34, 80, rng.range(0, TAU), rng.range(2.0, 3.0), rng.range(0.93, 1.0));
  }
  await ctx.yield();

  const tileMat = tileMaterial(U, C);
  tileMat.side = THREE.DoubleSide; domeMat.side = THREE.DoubleSide;
  const arch = new THREE.Mesh(G.toGeometry(), tileMat); arch.name = 'drum-hall-minarets'; object.add(arch);
  await ctx.yield();

  // merge static snow behind the strips and build the one snow mesh
  for (let i = 0; i < SG.count; i++) { sPos.push(SG.p[i * 3], SG.p[i * 3 + 1], SG.p[i * 3 + 2]); sNor.push(SG.n[i * 3], SG.n[i * 3 + 1], SG.n[i * 3 + 2]); sG.push(0, 0, 0, 0); sS.push(-1, 0, 0); sE.push(0); }
  for (let i = 0; i < SG.i.length; i++) sIdx.push(SG.i[i] + sCount);
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); snowGeo.setAttribute('normal', new THREE.Float32BufferAttribute(sNor, 3));
  snowGeo.setAttribute('aG', new THREE.Float32BufferAttribute(sG, 4)); snowGeo.setAttribute('aS', new THREE.Float32BufferAttribute(sS, 3)); snowGeo.setAttribute('aE', new THREE.Float32BufferAttribute(sE, 1));
  snowGeo.setIndex(sIdx);
  const snowMat = snowMaterial(U, C, S); snowMat.side = THREE.DoubleSide;
  const snow = new THREE.Mesh(snowGeo, snowMat); snow.name = 'snow'; snow.frustumCulled = false; object.add(snow);
  await ctx.yield();

  // ---- the burst: tumbling chunks and powder, all functions of slide seconds (uTau per groove)
  const uTau = { value: new THREE.Vector3(-1, -1, -1) };
  const grooveAng = slotK.map((k) => (k + 0.5) * TAU / NRIB);
  const tEnd = relV.map((rv) => timeFor((1 - rv) * LEN));
  const groovePoint = (slot, v, lift = 0.3) => { profAt(P, v, pr); const a = grooveAng[slot], r = pr.r + pr.nr * lift; return new THREE.Vector3(Math.cos(a) * r, pr.y + pr.ny * lift, Math.sin(a) * r); };
  {
    const ico = new THREE.IcosahedronGeometry(1, 0).toNonIndexed(), ip = ico.getAttribute('position'), NC = 60, per = ip.count;
    const pos = new Float32Array(NC * per * 3), nor = new Float32Array(NC * per * 3), aC = new Float32Array(NC * per * 4), aV = new Float32Array(NC * per * 4), aR = new Float32Array(NC * per * 3);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let i = 0; i < NC; i++) {
      const slot = i % 3, a = grooveAng[slot] + rng.range(-0.035, 0.035), t0 = tEnd[slot] * Math.pow(rng(), 0.55), sp = Math.min(SL.vmax, SL.a * t0);
      const vo = 1.2 + 0.32 * sp + rng.range(0, 2.2), vy = rng.range(-2.5, 2.8), vt = rng.range(-1.3, 1.3), size = rng.range(0.15, 0.36) * (rng.chance(0.15) ? 1.2 : 1);
      const c = [Math.cos(a) * 15.5, 31.0, Math.sin(a) * 15.5], v = [Math.cos(a) * vo - Math.sin(a) * vt, vy, Math.sin(a) * vo + Math.cos(a) * vt];
      // lands on the hall roof if it is still over it, otherwise falls to the ground
      const tR = (vy + Math.sqrt(vy * vy + 19.6 * (31.0 - ROOF_Y - 0.4))) / 9.8, tG = (vy + Math.sqrt(vy * vy + 19.6 * 30.6)) / 9.8;
      const land = 15.5 + vo * tR < AP - 1 ? tR : tG;
      const seed = rng(), sq = [rng.range(0.8, 1.2), rng.range(0.66, 0.95), rng.range(0.8, 1.2)];
      for (let k = 0; k < per; k += 3) {
        const o = (i * per + k) * 3;
        const jit = (vx) => { vx.fromBufferAttribute(ip, k + (vx === va ? 0 : vx === vb ? 1 : 2)); const h = Math.sin(vx.x * 12.9 + vx.y * 78.2 + vx.z * 37.7 + i) * 43758.5; vx.multiplyScalar(0.8 + 0.4 * (h - Math.floor(h))); vx.x *= sq[0]; vx.y *= sq[1]; vx.z *= sq[2]; };
        jit(va); jit(vb); jit(vc);
        nn.subVectors(vb, va).cross(vc.clone().sub(va)).normalize();
        pos.set([va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z], o);
        for (let m = 0; m < 3; m++) { const vm = m === 0 ? va : m === 1 ? vb : vc, vl = vm.length() || 1, rx = nn.x * 0.3 + vm.x / vl * 0.7, ry = nn.y * 0.3 + vm.y / vl * 0.7, rz = nn.z * 0.3 + vm.z / vl * 0.7, rl = Math.hypot(rx, ry, rz) || 1; nor.set([rx / rl, ry / rl, rz / rl], o + m * 3); aC.set([c[0], c[1], c[2], t0], (i * per + k + m) * 4); aV.set([v[0], v[1], v[2], slot], (i * per + k + m) * 4); aR.set([seed, size, land], o + m * 3); }
      }
    }
    ico.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aC', new THREE.BufferAttribute(aC, 4)); g.setAttribute('aV', new THREE.BufferAttribute(aV, 4)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 3));
    const m = new THREE.Mesh(g, chunkMaterial(U, C, uTau)); m.name = 'chunks'; m.frustumCulled = false; m.material.side = THREE.DoubleSide; object.add(m);
  }
  await ctx.yield();
  {
    const NB = 96, NT = 48;       // cornice burst puffs + puffs smoking off the groove behind the slab
    const g = quadCloud(NB + NT, (i, o) => {
      const slot = i % 3, a = grooveAng[slot];
      if (i < NB) {
        const t0 = tEnd[slot] * Math.pow(rng(), 0.6), sp = Math.min(SL.vmax, SL.a * t0), vo = 1.5 + 0.3 * sp + rng.range(0, 3), vt = rng.range(-2, 2);
        const aa = a + rng.range(-0.05, 0.05);
        o.a = [Math.cos(aa) * 15.6, 30.9 + rng.range(-0.3, 0.8), Math.sin(aa) * 15.6, t0];
        o.b = [Math.cos(aa) * vo - Math.sin(aa) * vt, rng.range(-2.0, 13.0) - 0.1 * sp, Math.sin(aa) * vo + Math.cos(aa) * vt, slot];      // most of it booms up past the camera
        o.c = [rng(), rng.range(1.3, 2.6), rng.range(2.6, 4.4)];
      } else {
        // the plume riding the slab: puffs thrown up along the groove as its tail passes, and from the first crack at release
        const v = relV[slot] + (1 - relV[slot]) * Math.pow(rng(), 1.5), p = groovePoint(slot, v, 0.7), t0 = timeFor((v - relV[slot]) * LEN) * rng.range(0.7, 1.0);
        profAt(P, v, pr);
        o.a = [p.x, p.y, p.z, t0];
        o.b = [Math.cos(a) * (pr.nr * 3.2 + pr.ny * 2.5), pr.ny * 3.2 - pr.nr * 3.5 + rng.range(0, 2), Math.sin(a) * (pr.nr * 3.2 + pr.ny * 2.5), slot];
        o.c = [rng(), rng.range(0.6, 1.1), rng.range(1.2, 2.0)];
      }
    });
    const m = new THREE.Mesh(g, powderMaterial(U, C, uTau)); m.name = 'powder'; m.frustumCulled = false; m.renderOrder = 3; object.add(m);
  }
  await ctx.yield();
  // ---- spindrift ribbons smoking off the crown, the rib shoulders, the cornice and the minaret caps
  {
    const anchors = [];
    for (let i = 0; i < 10; i++) { const a = rng.range(0, TAU), r = rng.range(0.4, 3.2); anchors.push([Math.cos(a) * r, 57.2 + rng.range(-0.8, 0.6), Math.sin(a) * r, rng.range(18, 34), rng.range(1.4, 3.0)]); }
    for (let i = 0; i < 10; i++) { const a = leeAng + rng.range(-1.9, 1.9), v = rng.range(0.16, 0.62); profAt(P, v, pr); anchors.push([Math.cos(a) * (pr.r + 0.4), pr.y + 0.3, Math.sin(a) * (pr.r + 0.4), rng.range(10, 20), rng.range(0.8, 1.6)]); }
    for (let i = 0; i < 6; i++) { const a = leeAng + rng.range(-1.6, 1.6); anchors.push([Math.cos(a) * 15.6, 31.0, Math.sin(a) * 15.6, rng.range(8, 14), rng.range(0.8, 1.6)]); }
    for (const mi of minaretInfo) for (let i = 0; i < 2; i++) anchors.push([mi.top.x, mi.top.y - 2.6 - i * 6.5, mi.top.z, rng.range(7, 12), rng.range(0.7, 1.3)]);
    anchors.push([0, 21.3, AP + 2, 10, 1.4], [6, 21.3, AP, 12, 1.2]);
    const NS = 18, n = anchors.length, aA = new Float32Array(n * (NS + 1) * 8), aB = new Float32Array(n * (NS + 1) * 8), idx = [];
    anchors.forEach((an, r) => {
      const seed = rng();
      for (let j = 0; j <= NS; j++) for (let e = 0; e < 2; e++) {
        const k = (r * (NS + 1) + j) * 2 + e;
        aA.set([an[0], an[1], an[2], seed], k * 4); aB.set([j / NS, e * 2 - 1, an[3], an[4]], k * 4);
      }
      for (let j = 0; j < NS; j++) { const a = (r * (NS + 1) + j) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * (NS + 1) * 6), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); g.setIndex(idx);
    const m = new THREE.Mesh(g, spindriftMaterial(U, C)); m.name = 'spindrift'; m.frustumCulled = false; m.renderOrder = 2; object.add(m);
  }
  await ctx.yield();
  if (opts.dust !== false) {
    const g = quadCloud(Math.round(1500 * detail), (i, o) => { o.a = [rng(), rng(), rng(), rng()]; o.b = [0, 0, 0, 0]; o.c = [0, 0, 0]; });
    const m = new THREE.Mesh(g, dustMaterial(U, {})); m.name = 'ice-dust'; m.frustumCulled = false; m.renderOrder = 4; object.add(m);
  }
  await ctx.yield();

  // ---- progress, light, anchors
  let driven = false, tau = -1;
  const SKY_CLEAR = U.uSky.value.clone(), BOUNCE_CLEAR = U.uBounce.value.clone();
  const SKY_SQUALL = new THREE.Color('#DDE4EC').multiplyScalar(0.62), BOUNCE_SQUALL = new THREE.Color('#DDE4EC').multiplyScalar(0.46);
  const wp = new THREE.Vector3();
  const applyTau = (t) => {
    tau = t;
    for (let k = 0; k < 3; k++) {
      const tk = t - relDelay[k], sl = Math.min(slideAt(tk), LEN + 2);
      S.uSlide.value.setComponent(k, sl); uTau.value.setComponent(k, tk > 0 ? tk : -1);
      domeMat.uniforms.uWet.value[k].set(slotK[k] + 0.5, relV[k] * LEN + uvSeed, relV[k] * LEN + uvSeed + sl, sl > 0 ? 1 : 0);
    }
  };
  applyTau(-1);
  const setProgress = (u) => {
    driven = true;
    applyTau((u - releaseU) * duration);
    const clear = sstep(lightU - 0.05, lightU + 0.05, u);
    U.uSunAmt.value = 0.1 + 0.9 * clear;
    U.uSky.value.copy(SKY_SQUALL).lerp(SKY_CLEAR, clear); U.uBounce.value.copy(BOUNCE_SQUALL).lerp(BOUNCE_CLEAR, clear);
    object.getWorldPosition(wp);
    const e = U.uEdge.value;
    e.z = wp.x * e.x + wp.z * e.y + (u - lightU) * 1000; e.w = 15;
  };
  const setLight = (l = {}) => {
    if (l.sun) U.uSunDir.value.copy(l.sun).normalize();
    if (l.sunColor) U.uSunCol.value.copy(l.sunColor);
    if (l.sunAmount !== undefined) U.uSunAmt.value = l.sunAmount;
    if (l.sky) U.uSky.value.copy(l.sky);
    if (l.bounce) U.uBounce.value.copy(l.bounce);
    if (l.edge) U.uEdge.value.set(l.edge[0], l.edge[1], l.edge[2], l.edge[3] ?? 15);
  };
  // rare event: seconds since the great shedding began (negative = off); the wave starts at the slab's groove
  const setShed = (sec) => {
    S.uShed.value.set(sec, sec > 0 ? 0 : 2, (slotK[0] + 0.5) * TAU / NRIB, 0.25);
    domeMat.uniforms.uWetAll.value = sec > 0 ? Math.min(1, Math.max(0, (sec - 0.8) / 1.8)) : 0;
  };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const outward = V3(Math.cos(grooveAng[0]), 0, Math.sin(grooveAng[0]));
  const anchors = {
    closePass: [V3(-38, 37, 22), V3(-32, 42, -3), V3(-27.5, 44, -25), V3(-8, 44, -37), V3(15.5, 43, -35), V3(33, 39, -19)],
    flyThrough: [V3(-48, 19, 162), V3(-34, 24, 130), V3(-22, 31, 80), V3(-38, 37, 22), V3(-32, 42, -3), V3(-27.5, 44, -25), V3(-8, 44, -37), V3(15.5, 43, -35), V3(33, 39, -19), V3(55, 27, 22), V3(88, 15, 44)],
    lookAt: groovePoint(0, 0.66, 0.3),
    slab: { top: groovePoint(0, relV[0]), bulge: groovePoint(0, 0.84), cornice: V3(outward.x * 15.6, 30.9, outward.z * 15.6), outward, grooves: slotK.slice(), seconds: Math.max(...tEnd.map((t, k) => t + relDelay[k])) + 2.6 },
    crown: V3(0, Y_CROWN, 0), finialTip: V3(0, 64, 0),
    corniceRing: { y: 30.75, radius: 15.8 }, drum: { radius: 13, footY: ROOF_Y }, hall: { apothem: AP, wallTop: WALL_H },
    minarets: minaretInfo,
    viewpoints: { south: V3(4, 30, 96), west: V3(-24, 40, 0), reveal: V3(21, 39, -12), ghost: V3(-90, 13, 350) },
    portalSeat: { position: V3(0, 7, AP + 5.5), facing: V3(0, 0, 1) },
    wind: V3(U.uWind.value.x, U.uWind.value.y, U.uWind.value.z),
  };

  return {
    object, radius: 36, height: 64, center: V3(0, 37, 0), anchors,
    uniforms: U, setProgress, setLight, setShed, colors: C, materials: { tile: tileMat, dome: domeMat, snow: snowMat },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) applyTau(time % 10);      // demo loop for the part viewer: full sun, a slab every 10 s
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
