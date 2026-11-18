// HERO SET PIECE for "snow-ghosts" (First Tracks): THE SLALOM THROUGH THE SNOW GHOSTS.
//
// WHAT IT IS
//   A 300 m apron of untracked powder holding ~450 snow ghosts: subalpine firs so loaded with rime that each
//   is a leaning white figure 5-11 m tall with a flared skirt, drooping pillow tiers, shoulders, a neck and a
//   drooped head, rime fins on the windward side and a lee drift tail, all bowed the same way (downwind, +X).
//   A 10 m glade winds down through them. The companion in the red jacket carves it: two grooves with a
//   shadowed wall and a bright lip are cut behind them as a doubled S, every turn throws a fan of powder that
//   hangs, drifts downwind and IGNITES white-gold when it stands between the camera and the sun. Each figure
//   throws a long blue shadow (baked shadow map, also handed to the world), heads shed dust in gusts, spindrift
//   crawls over the surface, diamond dust glints round the camera, a brushed branch can drop a snow bomb.
//
// LOCAL SPACE  origin = centre of the glade on the snow, +Y up. UPHILL is +Z, the fall line runs toward -Z
//   (camera enters at z = +150 and leaves at z = -150 where the forest stops at a line of sky). Skier's left
//   is -X. Sun comes from the left (-X, 24 deg up, 75 deg left of the fall line); wind blows to +X.
//
// OPTS (all optional)
//   palette    7 hex strings, brief order [cobalt sky, snow white, shadow blue, milky haze, sun, slate, red]
//   heightAt   (x, z) => y in local space. Supply the WORLD's terrain function here so ghosts, tracks, snow
//              and anchors sit on it. Default: an apron easing from 28 to 20 degrees with soft undulation.
//   glade      (z) => x of the glade centre line (the camera line). Default: a per-seed winding S.
//   snow       true (default): build the hero's own snow surface (sastrugi, sparkle, baked blue shadows).
//              false when the world's terrain covers the area (then sample anchors.shadow in its shader).
//   length 300, width 180   extent along the fall line / across it
//   density    1 (default) scales how tightly the figures stand (spacing ~11.5 m / sqrt(density))
//   count      cap on the number of figures (default 520)
//   spacing    grid step of the figures in metres at density 1 (default 11.5); near: cap on detailed figures (72)
//   thin       metres over which the lower treeline thins out (default 46; small = the forest stops at a line)
//   keep       (x, z) => false to refuse a figure there (the world's ribs and flanks)
//   sunDir     Vector3 pointing TO the sun in local space (default: brief). Bakes the shadow map direction.
//   speed      companion speed in m/s used to turn distance into plume age (default 22)
//   progress   initial companion progress 0..1 (default: companion just below the origin)
//   dust       true (default): diamond dust points round the camera
//   trackTop, trackBottom   z range of the companion's line when it runs beyond the forest (default: the forest)
//   plumeScale (z) => 0..1 multiplier on the plumes thrown at local z (0 = none)
//   top        z of the upper treeline when the forest runs further uphill than length / 2 (it thins out over the
//              last 60 m below it); the shadow map grows to cover it
//   extra      [{ x, y, z, scale }] detailed figures standing somewhere else (the world's rock stacks): same material,
//              same gust nod and head dust, foot at the given y
//   casters    [{ x, z, h, r }] other things that throw a baked shadow (the world's rock outcrops)
//   Also returned for a world that wraps the piece: makeSnowMaterial() (the snow shader for the world's own terrain:
//   attribute aRS = rock amount, baked shadow), shareUniforms(), setCompanionPose(pos, dir, visible, tuck), and the
//   uniforms uSparkle, uRock, uPlumeA (plume opacity; below 1 the freshest powder is also thinned so the skier shows).
//   uScat scales how hard powder against the sun ignites (capped, so a plume stays a lit fan). Plumes are thrown to the
//   outside of each turn and thin out round the eye-to-companion sight line, so the red jacket is never hidden.
//   setCompanionPose's tuck is 0..1 (0 tall, 1 folded and pitched forward for the jump).
//
// RETURNS (besides the contract fields)
//   setProgress(p)     p 0..1 = companion's position along the track, top to bottom. Tracks are drawn only
//                      behind the companion, plumes are born where the companion is. Drive it from path u
//                      (companion ~25 m ahead of the camera). Until the first call the piece demo-loops on
//                      time so it is alive on its own; after the first call time only drives ambient motion.
//   progressAtZ(z)     p for which the companion is at local z (use with the camera's own z - 25).
//   setBomb(i, t)      snow bomb falling off gate figure i (anchors.gates[i]) : t = seconds since release
//                      (falls 0.9 s, bursts on the snow, clears by 2.4 s); t < 0 hides it.
//   setLight({ sun, sunColor, sky, shade, intensity })   any subset; sun = Vector3 to the sun (local).
//   uniforms, info     shared uniform block; info = { triangles, ghosts, extent, trackLength, seedNotes }
//
// ANCHORS (local space)
//   flyThrough   ordered eye points (1.5 m above the snow) down the glade centre line, uphill -> downhill.
//                NOTE: clearance is deliberately 1.2-2.5 m at the gate figures (the brief waives the 6 m rule
//                here); nothing ever stands within 2.6 m of this line and the line itself is always clear.
//   gladeX(z), heightAt(x,z), trackPoint(p, target)   the same functions the hero was built with
//   companion    live Vector3 of the companion (updated by setProgress); companionHeading: live unit Vector3
//   gates        [{ position, top, side }] the tall figures on the outside of each turn (closest passes)
//   entry, exit  { position, facing } top and bottom of the glade; exit is where the forest stops
//   portalSeat   { position, facing, note } NOT inside the forest: suggested seat on the glade axis beyond the
//                lower treeline (the brief puts the 14 m portal in the cloud well past the cliff)
//   viewpoints   { heroFrame, aerial, fromBelow } each { position, gaze }
//   sun, wind    unit vectors (to the sun / downwind)
//   shadow       { texture, rect:{x0,z0,w,d}, uvOf(x,z) } baked ghost shadows, red channel 1 = in shadow;
//                uv = ((x-x0)/w, (z-z0)/d). Sample it in the world's snow and rig shaders for the stripes.
//
// SIZE   true extent 180 x 300 m, figures to 11 m, ~135 m of fall (info.extent). The reported radius / height /
//        center are a VIEWING vignette (radius 8, height 60, centre 7 m above the origin) so that the part
//        viewer's orbit stays above the slope and close to the figures; use info.extent for layout.
// COST   ~118k triangles (figures ~90k: about 70 near ones at 900 triangles, ~380 far ones at 150; snow 12k,
//        tracks 12k, companion 2.5k), 17 draw calls (12 instanced figure batches, snow, tracks, companion,
//        powder, diamond dust), one 512x1024 canvas texture, no lights, build ~300 ms with ctx.yield() breaks. Do not scale the object
//        non-uniformly; plume and dust billboards assume scale 1.
// LODS   Five figure forms: gate (26x30, the figures we brush past), hi (20x22), mid (13x14), lo (9x9), far (6x5).
//        Within 18 m the figure shader adds a rime crust (three noise scales combed along the wind, pits in shade).
// LIGHT  Self-lit ShaderMaterials (scene lights ignored, scene fog honoured): hard white-gold sun from
//        anchors.sun, pure blue sky fill, no grey. Wants a dark cobalt sky behind it, bloom threshold ~0.9.
//        The companion uses the same sun and blue fill, so its red reads on both sides.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1B55B8', '#F8FBFF', '#7EA4DE', '#DDE8F3', '#FFF0D2', '#2A323D', '#D9352B'];
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ shared GLSL
const GLSL_COMMON = /* glsl */ `
uniform vec3 uSun, uSunCol, uSky, uShade, uCamL;
uniform float uSunI, uTime;
float hash31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
// snow BRDF: soft shoulder so sun-facing faces do not clip, hard enough to keep a terminator
vec3 snowLight(vec3 N, vec3 V, float shadow, float ao, vec3 alb){
  float ndl = dot(N, uSun);
  float lit = (1. - exp(-2.6 * max(ndl + 0.06, 0.))) * (1. - shadow);
  float up = N.y * 0.5 + 0.5;
  vec3 amb = uShade * (0.50 + 0.42 * up) + vec3(0.80, 0.86, 1.0) * 0.13 * (1. - up);
  float term = smoothstep(-0.35, 0.05, ndl) * (1. - smoothstep(0.05, 0.5, ndl));
  vec3 c = alb * (uSunCol * uSunI * lit + amb * ao);
  c += alb * uSunCol * 0.10 * term * (1. - shadow);
  float fr = 1. - max(dot(N, V), 0.); fr *= fr * fr;
  c += uSky * 0.55 * fr * (1. - 0.7 * lit);
  return c;
}
// pin-point sparkle that shifts with the view
float sparkle(vec3 p, vec3 V, float dist, float cell){
  vec3 q = p * cell; vec3 id = floor(q);
  float h = hash31(id);
  float ph = fract(h * 17.3 + dot(V, vec3(h * 9.1 - 4.5, 5.3, 7.7 - h * 11.)) * 2.2);
  vec3 f = fract(q) - 0.5;
  float d = dot(f, f);
  return step(0.9, h) * smoothstep(0.8, 1.0, ph) * smoothstep(0.2, 0.02, d) * (1. - smoothstep(30., 110., dist));
}
`;

// ------------------------------------------------------------------ ghost form
// One rime figure, about 8 m tall, origin at its foot, bowed toward +X. Vertex colour: r = ambient
// occlusion, g = needle-window mask (lee side), b = height fraction (for the gust nod).
function ghostForm(prm, noise, segs, rings) {
  const H = prm.H, nV = segs * (rings + 1) + 1;
  const pos = new Float32Array(nV * 3), col = new Float32Array(nV * 3);
  const th = 0.8, tanL = Math.tan(prm.lean);
  const spine = (t, o) => {
    let x = H * tanL * Math.pow(t, 1.45), y = H * t, z = prm.wob * Math.sin(t * 3.1 + prm.ph);
    if (t > th) { const k = (t - th) / (1 - th); x += prm.hook * Math.sin(k * 1.35); y -= prm.drop * k * k; }
    o[0] = x; o[1] = y; o[2] = z;
  };
  const prof = (t) => {
    let r = prm.baseR * (1 + 0.42 * Math.exp(-t * 8)) * (1 - 0.6 * Math.pow(t, 1.25));
    r += prm.baseR * prm.sh * Math.exp(-Math.pow((t - prm.ts) / 0.075, 2));
    r -= prm.baseR * 0.2 * Math.exp(-Math.pow((t - prm.ts - 0.115) / 0.045, 2));
    r += prm.baseR * prm.head * Math.exp(-Math.pow((t - 0.9) / 0.06, 2));
    if (t > 0.9) { const k = (t - 0.9) / 0.1; r *= Math.sqrt(Math.max(0, 1 - k * k)) * 0.92 + 0.08 * (1 - k); }
    return Math.max(r, 0.02);
  };
  const s = [0, 0, 0], s2 = [0, 0, 0];
  let v = 0;
  for (let j = 0; j <= rings; j++) {
    // rings bunch a little toward shoulders and head where the form changes fastest
    const tj = j / rings, t = Math.min(0.995, tj + 0.05 * Math.sin(tj * Math.PI) * (tj - 0.3));
    spine(Math.min(1, t + 0.02), s2); spine(Math.max(0, t - 0.02), s);
    let e1x = s2[1] - s[1], e1y = -(s2[0] - s[0]); const el = Math.hypot(e1x, e1y) || 1; e1x /= el; e1y /= el;
    if (e1x < 0.25) { e1x = 0.25; e1y = -Math.sqrt(1 - 0.0625); }
    spine(t, s);
    const R = prof(t);
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nA = noise.n3(ca * 1.1 + prm.ph, t * 5.0, sa * 1.1);
      const q = (t * prm.tiers + 0.22 * nA + prm.ph) % 1;
      const pillow = Math.sin(Math.PI * Math.pow(q < 0 ? q + 1 : q, 0.68));           // drooping tier
      const lobe = Math.abs(noise.n3(ca * 2.1 - prm.ph, t * 9.0 + 3.1, sa * 2.1));     // cauliflower puffs
      const wind = Math.max(-ca, 0), lee = Math.max(ca, 0);
      const fin = wind * wind * (0.5 + 0.5 * Math.sin(a * 6.0 + t * 11.0 + prm.ph * 5));  // rime plates into the wind
      const body = smoothstep(0.02, 0.14, t) * (1 - smoothstep(0.86, 0.98, t));
      let m = 1 + body * (0.21 * (pillow - 0.55) + 0.24 * (lobe - 0.3) + 0.2 * fin) + 0.24 * lee * (1 - 0.5 * t);
      // drooping loaded boughs: two "arms" at the shoulders, across the wind
      let arm = 0;
      for (let k = 0; k < 2; k++) {
        let da = a - prm.armA[k]; da = Math.atan2(Math.sin(da), Math.cos(da));
        arm += prm.armS[k] * Math.exp(-Math.pow(da / 0.5, 2)) * Math.exp(-Math.pow((t - prm.armT[k]) / 0.07, 2));
      }
      m += arm;
      const r = R * m;
      pos[v * 3] = s[0] + ca * r * e1x;
      pos[v * 3 + 1] = Math.max(-0.4, s[1] + ca * r * e1y - arm * prm.baseR * 0.9 - body * 0.25 * (pillow - 0.5) * R * 0.5);
      pos[v * 3 + 2] = s[2] + sa * r * prm.flat;
      col[v * 3] = clamp(0.62 + 0.9 * (m - 1) + 0.25 * t, 0.35, 1);
      const win = Math.exp(-Math.pow((a < Math.PI ? a : a - TAU) / 0.55 - prm.winA, 2)) * Math.exp(-Math.pow((t - prm.winT) / 0.05, 2));
      col[v * 3 + 1] = win > 0.45 && pillow < 0.75 ? 1 : 0;
      col[v * 3 + 2] = t;
      v++;
    }
  }
  spine(1, s); pos[v * 3] = s[0]; pos[v * 3 + 1] = s[1] - 0.02; pos[v * 3 + 2] = s[2];
  col[v * 3] = 1; col[v * 3 + 1] = 0; col[v * 3 + 2] = 1;
  const idx = [];
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
    const a = j * segs + i, b = j * segs + (i + 1) % segs, c = a + segs, d = b + segs;
    idx.push(a, c, b, b, c, d);
  }
  const top = rings * segs;
  for (let i = 0; i < segs; i++) idx.push(top + i, v, top + (i + 1) % segs);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function formParams(rng) {
  const stout = rng();
  return {
    H: 8, lean: rng.range(0.17, 0.33), hook: rng.range(0.8, 1.7), drop: rng.range(0.4, 1.3),
    wob: rng.range(0.1, 0.4), ph: rng.range(0, 6.28), baseR: lerp(1.25, 1.85, stout),
    sh: rng.range(0.3, 0.58), ts: rng.range(0.62, 0.74), head: rng.range(0.2, 0.34),
    tiers: rng.range(3.5, 6.5), flat: rng.range(0.82, 1.0),
    armA: [rng.range(1.1, 2.0), -rng.range(1.1, 2.0)], armT: [rng.range(0.5, 0.7), rng.range(0.42, 0.66)],
    armS: [rng.range(0.15, 0.6), rng.chance(0.7) ? rng.range(0.15, 0.55) : 0],
    winA: rng.range(-0.6, 0.6), winT: rng.range(0.3, 0.48),
  };
}

function ghostMaterial(U, fogOn) {
  return new THREE.ShaderMaterial({
    fog: fogOn, vertexColors: true,
    uniforms: U,
    vertexShader: /* glsl */ `
      attribute vec3 aInst;   // seed, needle window on/off, foot y
      uniform float uTime; uniform vec3 uCamL;
      varying vec3 vN, vP, vC; varying vec2 vI; varying float vH;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; float t = color.b;
        vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.);
        // gusts cross the forest as slow waves; heads nod downwind
        float g = sin(uTime * 1.1 + ip.x * 0.09 - ip.z * 0.05 + aInst.x * 6.) + 0.5 * sin(uTime * 2.7 + aInst.x * 40.);
        p.x += t * t * (0.10 + 0.07 * g);
        p.y -= t * t * t * 0.05 * g;
        vec4 lp = instanceMatrix * vec4(p, 1.);
        // per-figure low-frequency warp so no two instances share a silhouette
        float w = smoothstep(0.05, 0.5, t);
        lp.x += w * 0.45 * sin(lp.y * 0.55 + aInst.x * 31.);
        lp.z += w * 0.40 * sin(lp.y * 0.47 + aInst.x * 17.);
        vP = lp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vC = color; vI = aInst.xy; vH = lp.y - aInst.z;
        vec4 mvPosition = modelViewMatrix * lp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      uniform sampler2D uShadow; uniform vec4 uShRect; uniform vec3 uNeedle;
      varying vec3 vN, vP, vC; varying vec2 vI; varying float vH;
      #include <common>
      #include <fog_pars_fragment>
      float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x), mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x), mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 Vv = uCamL - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
        vec3 Ng = normalize(vN);
        vec3 N = Ng;
        float fade = 1. - smoothstep(35., 130., dist);
        float nearK = 1. - smoothstep(2.5, 12., dist), farK = smoothstep(30., 110., dist);
        // rime crust: cauliflower bumps, finer feathering on the windward side
        vec3 b1 = sin(vP * 5.6 + 1.7 * sin(vP.zxy * 3.4 + vI.x * 9.));
        vec3 b2 = sin(vP.yzx * 11.0 + 2.0 * sin(vP * 6.1));
        // close up: 2-4 cm crust grains and rime feathers combed into the wind
        vec3 b3 = sin(vP.zxy * 43. + 2.5 * sin(vP * 21. + vI.x * 5.));
        float fins = sin(vP.y * 37. + 4. * b1.x + vP.z * 15.);
        float windward = max(-N.x, 0.);
        N = normalize(N + fade * (0.15 * b1 + (0.07 + 0.12 * windward) * b2) + nearK * (0.12 * b3 + vec3(0., 0.12 * windward * fins, 0.04 * fins)));
        // the rime crust itself, read within 18 m: plates and feathers combed along the wind at three scales, with
        // blue pits between them, so a figure passing the shoulder is a surface and not a white mass
        float nearR = 1. - smoothstep(5., 18., dist), fineK = 1. - smoothstep(2.5, 8., dist);
        vec3 rq = vP * vec3(0.42, 1., 1.) + vI.x * 13.;
        float r1h = vn3(rq * 10.), r2h = vn3(rq * 25. + 7.3), r3h = vn3(rq * 55. + 3.1);
        float rh = 0.55 * r1h + 0.3 * r2h + 0.15 * mix(0.5, r3h, fineK);
        vec3 dpx = dFdx(vP), dpy = dFdy(vP);
        float dhx = dFdx(rh), dhy = dFdy(rh);
        vec3 c1 = cross(dpy, Ng), c2 = cross(Ng, dpx);
        float det = dot(dpx, c1);
        vec3 grad = (dhx * c1 + dhy * c2) * (det < 0. ? -1. : 1.) / max(abs(det), 1e-7);
        grad /= max(1., length(grad) / 24.);
        N = normalize(N - nearR * 0.034 * grad);
        float cav = smoothstep(0.27, 0.45, rh);                       // 0 in the pits between the plates
        // shadow thrown by upwind neighbours, read just sunward of the foot (four soft taps), fading with height
        // and on steep faces, where one texel is stretched over metres of surface
        vec2 suv = (vP.xz + normalize(uSun.xz + vec2(1e-4)) * (2.6 + vH * 1.3) - uShRect.xy) / uShRect.zw;
        vec2 spx = vec2(0.003, 0.0015);
        float sh = 0.25 * (texture2D(uShadow, suv + spx).r + texture2D(uShadow, suv - spx).r
                 + texture2D(uShadow, suv + vec2(spx.x, -spx.y)).r + texture2D(uShadow, suv + vec2(-spx.x, spx.y)).r);
        sh *= (1. - smoothstep(1.0, 6.0, vH)) * 0.85 * (0.25 + 0.75 * smoothstep(0.08, 0.5, abs(Ng.y)));
        sh *= step(0.002, suv.x) * step(suv.x, 0.998) * step(0.002, suv.y) * step(suv.y, 0.998);   // nothing outside the baked map
        float ao = vC.r * vC.r * (0.7 + 0.3 * smoothstep(0., 2.5, vH));
        ao = mix(ao, 0.92, 0.75 * farK);
        ao *= mix(1., 0.76 + 0.24 * cav, nearR);
        sh = max(sh, nearR * 0.38 * (1. - cav) * (1. - smoothstep(0.55, 0.95, dot(N, uSun))));   // the sun does not reach into the pits
        float streak = vn3(vP * vec3(1.3, 10., 10.) + vI.x * 7.);    // feathered fins lying along the wind
        vec3 alb = vec3(0.72, 0.735, 0.76);
        alb *= 1. - nearK * (0.07 * (0.5 + 0.5 * b3.x * b3.y) + 0.07 * (0.5 + 0.5 * fins) * windward) + 0.05 * nearK * b2.x;
        alb *= 1. + nearR * (0.16 * (streak - 0.5) + 0.1 * (rh - 0.5));
        float win = vC.g * step(0.5, vI.y);
        alb = mix(alb, uNeedle * (0.6 + 0.8 * hash31(floor(vP * 9.))), win);
        alb *= 0.86 + 0.14 * vC.r;
        vec3 c = snowLight(N, V, sh, ao, alb);
        // crown and shoulders catch the sky and the low sun even from uphill; a warm rim on the sun side
        float ndl = dot(N, uSun), crown = smoothstep(0.15, 0.85, N.y);
        float far2 = smoothstep(80., 210., dist);                     // seen from the bowl the forest is a crowd of figures: each keeps a blue side
        c += alb * uSunCol * uSunI * (0.3 * crown * (0.35 + 0.65 * smoothstep(1., 5., vH)) + 0.2 * farK * (1. - far2) * smoothstep(-0.6, 0.3, ndl)) * (1. - sh);
        c *= mix(vec3(1.), vec3(0.6, 0.72, 1.0), far2 * (1. - smoothstep(-0.2, 0.4, dot(Ng, uSun))));
        c += alb * uSky * 0.2 * crown;
        float rim = 1. - max(dot(N, V), 0.); rim *= rim;
        c += uSunCol * uSunI * 0.3 * rim * smoothstep(-0.45, 0.25, ndl) * (1. - sh) * (1. - win);
        float sp = sparkle(vP, V, dist, 16.) * (1. - win) * smoothstep(1.5, 6., dist);
        c += uSunCol * sp * 5.0 * max(ndl + 0.2, 0.) * (1. - sh);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ snow surface and carved tracks
// One material, two uses: the snow patch (aTrk absent -> TRACK undefined) and the companion's grooves.
function snowMaterial(U, fogOn, track, world) {
  return new THREE.ShaderMaterial({
    fog: fogOn, uniforms: U, transparent: !!track, depthWrite: !track,
    polygonOffset: !!track, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    defines: track ? { TRACK: 1 } : world ? { WORLD: 1 } : {},
    vertexShader: /* glsl */ `
      varying vec3 vP, vN;
      #ifdef TRACK
      attribute vec2 aTrk; varying vec2 vT;   // x = cross coordinate (+ toward the sun), y = arc position s
      #elif defined(WORLD)
      attribute vec2 aRS; varying vec2 vRS;   // x = rock amount, y = baked terrain shadow
      #else
      attribute float aEdge; varying float vE;
      #endif
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vP = position; vN = normal;
        #ifdef TRACK
        vT = aTrk;
        #elif defined(WORLD)
        vRS = aRS;
        #else
        vE = aEdge;
        #endif
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      uniform sampler2D uShadow; uniform vec4 uShRect; uniform float uS, uSparkle; uniform vec3 uRock;
      varying vec3 vP, vN;
      #ifdef TRACK
      varying vec2 vT;
      #elif defined(WORLD)
      varying vec2 vRS;
      #else
      varying float vE;
      #endif
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        vec3 Vv = uCamL - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
        vec3 N = normalize(vN);
        float fade = 1. - smoothstep(40., 160., dist);
        // sastrugi: wind-combed ridges running along X, plus soft pillows
        vec2 q = vP.xz;
        float e = 0.35;
        float h0 = vnoise(vec2(q.x * 0.22, q.y * 1.5)) + 0.5 * vnoise(vec2(q.x * 0.6 + 7., q.y * 3.7)) + 1.4 * vnoise(q * 0.13);
        float hx = vnoise(vec2((q.x + e) * 0.22, q.y * 1.5)) + 0.5 * vnoise(vec2((q.x + e) * 0.6 + 7., q.y * 3.7)) + 1.4 * vnoise((q + vec2(e, 0.)) * 0.13);
        float hz = vnoise(vec2(q.x * 0.22, (q.y + e) * 1.5)) + 0.5 * vnoise(vec2(q.x * 0.6 + 7., (q.y + e) * 3.7)) + 1.4 * vnoise((q + vec2(0., e)) * 0.13);
        float nearK = 1. - smoothstep(10., 45., dist);
        N = normalize(N + fade * 0.55 * (1. + 1.1 * nearK) * vec3(h0 - hx, 0., h0 - hz));
        vec2 suv = (vP.xz - uShRect.xy) / uShRect.zw;
        vec2 px = 0.6 / uShRect.zw;
        float sh = 0.4 * texture2D(uShadow, suv).r + 0.15 * (texture2D(uShadow, suv + vec2(px.x, 0.)).r + texture2D(uShadow, suv - vec2(px.x, 0.)).r
                 + texture2D(uShadow, suv + vec2(0., px.y)).r + texture2D(uShadow, suv - vec2(0., px.y)).r);
        sh = smoothstep(0.08, 0.8, sh) * 0.96;
        sh *= step(0.002, suv.x) * step(suv.x, 0.998) * step(0.002, suv.y) * step(suv.y, 0.998);   // nothing outside the baked map
        vec3 alb = vec3(0.74, 0.755, 0.78) * (0.93 + 0.07 * vnoise(q * 0.5));
        // wind ripples: long pale and dull streaks lying across the fall line, so the snow moves under the tips
        alb *= 1. + 0.12 * fade * (vnoise(vec2(q.x * 0.1 + 3., q.y * 0.85)) + 0.5 * vnoise(vec2(q.x * 0.33, q.y * 2.7)) - 0.75);
        float ao = 1., a = 1., glint = 1.;
        #ifdef TRACK
        // painted trench: c in -1..1 is the groove; + side is toward the sun. The sun-side wall and the
        // floor lie in blue shadow, the far wall's top catches the sun as a bright sliver, lips are raised.
        float c = vT.x, ac = abs(c);
        float inside = 1. - smoothstep(0.86, 1.0, ac);
        float wallSh = smoothstep(-1.0, -0.45, -c * 1.0) ;            // 1 over most of the floor, 0 at far-wall top
        float trench = inside * (1. - smoothstep(0.55, 0.98, -c));
        sh = max(sh, trench * 0.97);
        ao = mix(1., 0.62 + 0.3 * smoothstep(1.0, -0.6, c), inside);
        float lip = smoothstep(1.0, 1.25, ac) * (1. - smoothstep(1.4, 2.3, ac));
        N = normalize(N + vec3(uSun.x, 0., uSun.z) * (lip * sign(c) * 0.55 + inside * step(c, -0.5) * 0.9));
        alb *= 1. + 0.06 * lip;
        a = (1. - smoothstep(1.7, 2.4, ac)) * step(vT.y, uS) * smoothstep(0., 0.8, uS - vT.y + 0.8);
        glint = 1. - inside;
        if (a < 0.01) discard;
        #elif defined(WORLD)
        // the world's terrain: rock shows through on ribs and walls, large shadows are baked per vertex
        // snow lies in streaks down the fall line of the flanks (they fall away along X); a wide, soft threshold
        float rkN = 0.6 * vnoise(vec2(q.y * 0.2 + 5., q.x * 0.045 + vP.y * 0.05)) + 0.4 * vnoise(vec2(q.x * 0.21 + vP.y * 0.3, q.y * 0.21 - vP.y * 0.2));
        float rk = smoothstep(0.3, 0.74, vRS.x + 1.0 * (rkN - 0.5) * step(0.02, vRS.x) * (1. - smoothstep(0.85, 1.1, vRS.x)));
        sh = max(sh, clamp(vRS.y, 0., 1.) * 0.96);
        float strata = vnoise(vec2(q.x * 0.35 + q.y * 0.2, vP.y * 1.7)) * 0.8 + mix(0.5, vnoise(vec2(q.x * 1.3, vP.y * 5.0 + q.y)), fade * fade) * 0.2;
        // exposed rock is never a slab: snow lies in streaks down the flank and on every ledge between the beds
        float soft = 1. - smoothstep(0.9, 1.15, vRS.x);              // (not on the cliff wall, which stays dark)
        float chute = smoothstep(0.42, 0.6, vnoise(vec2(q.x * 0.09 + vP.y * 0.06, q.y * 0.7 + 2.)));
        float shelf = smoothstep(0.56, 0.68, vnoise(vec2(q.x * 0.13 + q.y * 0.1 + 4., vP.y * 0.85)));
        rk *= 1. - max(0.9 * chute * soft, 0.8 * shelf * (0.4 + 0.6 * soft));
        alb = mix(alb, uRock * (0.45 + 1.3 * strata), rk);
        N = normalize(mix(N, normalize(vN + 0.4 * vec3(strata - 0.5, 0., vnoise(q * 0.9) - 0.5)), rk));
        glint = 1. - rk;
        #else
        if (vE + 0.25 * (vnoise(q * 0.07) - 0.5) < 0.03) discard;
        #endif
        #ifdef WORLD
        // wind drifts: low swells that give the open faces a lit side and a blue side
        float d0 = vnoise(q * vec2(0.05, 0.09)), dx1 = vnoise((q + vec2(3., 0.)) * vec2(0.05, 0.09)), dz1 = vnoise((q + vec2(0., 3.)) * vec2(0.05, 0.09));
        N = normalize(N + (1. - rk) * 3.4 * vec3(d0 - dx1, 0., d0 - dz1));
        // wind ripples a few metres long, combed across the fall line and strongest on the steep open faces,
        // so the bowl is never one flat sheet: every ripple has a lit flank and a blue one
        float steep = clamp((1. - vN.y) * 5., 0.25, 1.);
        vec2 rq = q * vec2(0.19, 0.46) + 3.7 * vec2(vnoise(q * 0.021), vnoise(q * 0.021 + 9.));
        float m0 = vnoise(rq) + 0.5 * vnoise(rq * 2.3 + 5.);
        float mx = vnoise(rq + vec2(0.19, 0.)) + 0.5 * vnoise(rq * 2.3 + vec2(0.437, 0.) + 5.);
        float mz = vnoise(rq + vec2(0., 0.46)) + 0.5 * vnoise(rq * 2.3 + vec2(0., 1.058) + 5.);
        float midK = (1. - rk) * steep * (1. - smoothstep(160., 420., dist));
        N = normalize(N + midK * 2.6 * vec3(m0 - mx, 0., m0 - mz));
        alb *= 1. + 0.1 * midK * (m0 - 0.75);
        #endif
        vec3 col = snowLight(N, V, sh, ao, alb);
        #ifdef WORLD
        vec3 rockC = alb * (uSunCol * uSunI * max(dot(N, uSun), 0.) * (1. - sh) + uShade * 0.55 + vec3(0.30, 0.33, 0.40) * 0.62);   // slate in the shade, not ultramarine
        col = mix(col, rockC, rk);
        #endif
        float sp = sparkle(vec3(vP.x, 0., vP.z), V, dist, 9.) + 0.6 * sparkle(vec3(vP.x, 3., vP.z), V, dist * 2.5, 28.);
        col += uSunCol * sp * 6.0 * uSparkle * (1. - sh) * glint * smoothstep(0., 0.25, dot(N, uSun));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// Baked top-down shadow map of every figure, drawn as stretched silhouettes on a canvas.
async function bakeShadows(ghosts, rect, sun, ctx) {
  const cw = 512, ch = 1024;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, cw, ch);
  const sx = cw / rect.w, sz = ch / rect.d;
  const hl = Math.hypot(sun.x, sun.z) || 1e-3, dx = -sun.x / hl, dz = -sun.z / hl;   // shadow direction on the ground
  const stretch = hl / Math.max(sun.y, 0.08);                                         // length per metre of height
  const prof = [[0, 1.35], [0.06, 1.2], [0.25, 0.95], [0.5, 0.72], [0.62, 0.62], [0.7, 0.78], [0.78, 0.5], [0.84, 0.36], [0.91, 0.5], [0.97, 0.3], [1.0, 0.05]];
  for (let pass = 0; pass < 3; pass++) {
    const grow = [1.45, 1.15, 0.9][pass];
    g.fillStyle = ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,1)'][pass];
    for (const gh of ghosts) {
      const len = gh.h * stretch + gh.h * 0.25 * dx, wS = gh.s * gh.w;
      g.beginPath();
      for (let side = -1; side <= 1; side += 2) {
        for (let k = 0; k < prof.length; k++) {
          const p = side < 0 ? prof[k] : prof[prof.length - 1 - k];
          const al = p[0] * len - (pass < 2 ? 0.3 : 0), wd = (p[1] * wS * grow + (grow - 0.9) * p[0] * 1.2) * side;
          const X = gh.x + dx * al - dz * wd, Z = gh.z + dz * al + dx * wd;
          const cx = (X - rect.x0) * sx, cy = (Z - rect.z0) * sz;
          if (side < 0 && k === 0) g.moveTo(cx, cy); else g.lineTo(cx, cy);
        }
      }
      g.closePath(); g.fill();
    }
    await ctx.yield();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.flipY = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = 4;
  return tex;
}

// ------------------------------------------------------------------ powder: plumes, head dust, spindrift, snow bomb
function powderMaterial(U, fogOn) {
  return new THREE.ShaderMaterial({
    fog: fogOn, uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aO, aV; attribute vec4 aP; attribute float aM;   // aP: birth s | phase, life, size, rnd
      uniform float uTime, uS, uSpeed, uBombT, uBombH, uPlumeA, uScat; uniform vec3 uCamL, uSun, uWind, uBombO, uComp;
      varying vec2 vUv, vSunXY; varying float vA, vScat, vR, vK, vLit, vFan;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float life = aP.y, age; vec3 o = aO;
        float fan = step(0.15, aM) * step(aM, 0.5);                // a fan thrown to the sun's side
        if (aM < 0.5) age = (uS - aP.x) / uSpeed;                 // born when the companion passed
        else if (aM < 1.5) age = fract(uTime / life + aP.w) * life; // ambient loop
        else { age = uBombT - aP.x; o += uBombO; }                 // snow bomb
        float k = age / life;
        float alive = step(0., age) * step(k, 1.);
        k = clamp(k, 0., 1.);
        float d = (1. - exp(-1.5 * age)) / 1.5;
        vec3 p; float size = aP.z, alpha;
        if (aM < 1.5) {
          p = o + aV * d + uWind * (age * 1.6 + age * age * 0.35) * (aM < 0.5 ? 1. : 0.6);
          p.y -= 0.55 * age * age * (aM < 0.5 ? 1. - 0.55 * fan : 0.3);
          p.y = max(p.y, o.y - 0.2 - 0.45 * p.z * 0. );
          p += 0.35 * age * vec3(sin(uTime * 1.3 + aP.w * 40.), sin(uTime * 1.7 + aP.w * 23.), cos(uTime * 1.1 + aP.w * 31.));
          size *= 0.3 + 1.25 * sqrt(k);
          alpha = smoothstep(0., 0.05, k) * pow(1. - k, 1.6 - 0.35 * fan);
          if (aM > 0.5) alpha *= 0.3 * smoothstep(0., 0.2, k);
          else {
            alpha *= mix(1., smoothstep(0., 0.3, k), step(uPlumeA, 0.999)) * mix(uPlumeA, min(uPlumeA + 0.17, 1.), smoothstep(0.25, 0.5, age)) * (1. - 0.2 * fan);
            // the sight line from the eye to the red jacket stays open: plumes thin out round it
            vec3 ab = uComp - uCamL, ap = p - uCamL;
            float tt = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-3), 0., 1.);
            float ds = length(ap - ab * tt);
            alpha *= mix(0.1, 1., smoothstep(0.4 * size + 0.3, 1.05 * size + 1.3, ds));
          }
        } else {
          float tHit = 0.9, fall = min(age, tHit);
          p = o + aV * 0.25 * fall + vec3(0., -uBombH * (fall / tHit) * (fall / tHit), 0.) + uWind * 0.5 * fall;
          float b = max(age - tHit, 0.);
          float bd = (1. - exp(-3. * b)) / 3.;
          p += vec3(aV.x, abs(aV.y) * 0.7 + 1.5, aV.z) * 2.6 * bd + uWind * b * 1.5;
          size *= mix(0.45, 1.0 + 1.6 * sqrt(b / 1.5), step(tHit, age));
          alpha = age < tHit ? 0.95 : pow(max(1. - b / 1.5, 0.), 1.5);
        }
        alpha *= alive;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        mvPosition.xy += position.xy * size * alive * vec2(1., 1. + 0.45 * fan);      // a fan stands taller than it is wide
        gl_Position = projectionMatrix * mvPosition;
        vec3 toP = p - uCamL; float dl = length(toP);
        float ct = dot(toP / max(dl, 1e-3), uSun);
        float fs = max(ct, 0.); fs *= fs;
        vScat = min(fs * fs * fs * 2.0 + fs * 0.55, 1.5) * uScat;
        // the sun-side fan takes the light over a much wider angle, and far more of it
        vScat = mix(vScat, max(vScat, 1.45 * smoothstep(0.08, 0.72, ct) * uScat), fan); vFan = fan;
        vec2 sxy = (modelViewMatrix * vec4(uSun, 0.)).xy; vSunXY = sxy / max(length(sxy), 0.2);                          // forward scatter: flares toward the sun only
        vLit = 0.5 - 0.5 * ct;                                      // front-lit when the sun is behind the camera
        vUv = position.xy; vA = alpha * (aM > 0.5 && aM < 1.5 ? smoothstep(3., 12., dl) : smoothstep(3.5 + 1.5 * fan, 14. + 8. * fan, dl)); vR = aP.w; vK = (aM > 0.5 && aM < 1.5) ? max(k, 0.7) : k;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_COMMON}
      varying vec2 vUv, vSunXY; varying float vA, vScat, vR, vK, vLit, vFan;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv);
        if (r2 > 1. || vA < 0.004) discard;
        vec2 w = vUv * 2.3 + vR * 17.;
        float n = vnoise(w + vec2(0., -uTime * 0.4)) * 0.5 + vnoise(w * 2.3 + 3.) * 0.32 + vnoise(w * 5.3 + vec2(7., -uTime * 0.6)) * 0.18;
        float body = 1. - r2;
        float sc = min(vScat, 0.7 + 1.0 * vFan);
        // the veil thins where it ignites, so the fan keeps its structure and its blue core
        float a = body * smoothstep(0.05 + 0.3 * vK, 0.7, n * 0.7 + body * 0.6) * vA * (1. - (0.4 - 0.2 * vFan) * min(vScat, 1.));
        // two tones and nothing between: a blue core in its own shade, and a sunward limb that is brighter than the
        // snow behind it (so it reads as light, never as grey haze) and burns white-gold against the sun
        float core = body * (0.5 + 0.5 * n);
        float rimK = 1. - core;
        float wisp = 0.3 + 1.5 * smoothstep(0.3, 0.8, vnoise(w * 1.7 + vec2(vR * 31., -uTime * 0.7)));
        float limb = 0.3 + 0.8 * dot(vUv, vSunXY) + 0.2 * vUv.y + 0.45 * (n - 0.5) + 0.35 * rimK;
        float sunny = smoothstep(0.3, 0.8, limb) * (0.45 + 0.55 * vLit) + 0.3 * rimK * rimK + 0.35 * min(sc, 1.);
        sunny = clamp((sunny - 0.32 * core * (1. - 0.6 * vLit)) * mix(1., 0.55 + 0.45 * wisp, vFan), 0., 1.);
        vec3 c = mix(uShade * 0.9 + 0.02, uSunCol * uSunI * (1.05 + 1.6 * sc * mix(0.5 + 0.5 * rimK, (0.2 + 0.8 * rimK) * wisp, vFan)) + uShade * 0.4, sunny);
        // diamond dust riding in the plume: white glints that hang for two seconds
        vec2 gq = vUv * 24. + vR * 50., gid = floor(gq);
        float gt = uTime * 0.5 + vR * 9. + hash21(gid) * 3., gph = fract(gt);
        float gl = step(0.982, hash21(gid + floor(gt) * 7.31)) * smoothstep(0.3, 0.0, length(fract(gq) - 0.5)) * smoothstep(0., 0.12, gph) * smoothstep(1., 0.7, gph);
        c += vec3(5.5) * gl * (0.45 + 1.2 * sc) * body;
        gl_FragColor = vec4(c, clamp(a, 0., 1.));
        #include <fog_fragment>
      }`,
  });
}

function dustMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aD;
      uniform float uTime, uPx; uniform vec3 uCamL, uWind, uSun;
      varying float vTw;
      void main(){
        const float B = 56.;
        vec3 p = position + (uWind * 0.8 + vec3(0., -0.12, 0.)) * uTime + 0.4 * sin(uTime * 0.3 + aD.xyz * 6.28);
        p = mod(p - uCamL + 0.5 * B, B) - 0.5 * B + uCamL;
        vec3 toP = p - uCamL; float dl = length(toP);
        float tw = 0.5 + 0.5 * sin(uTime * (1.5 + 3. * aD.x) + aD.y * 60. + dot(toP, vec3(1.7, 2.3, 1.1)));
        tw *= tw; tw *= tw; tw *= tw;
        vTw = tw * smoothstep(1.5, 5., dl) * (1. - smoothstep(18., 28., dl)) * (0.35 + 0.65 * aD.w);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (1.3 + 1.4 * aD.z) * clamp(9. / max(dl, 1.), 0.6, 1.6);
      }`,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main(){
        vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.;
        if (r > 1. || vTw < 0.01) discard;
        float f = 1. - r; f *= f;
        gl_FragColor = vec4(vec3(2.6) * vTw * f, 1.);
      }`,
  });
}

// ------------------------------------------------------------------ the companion (red jacket, seen from behind)
// Figure space: feet at y = 0, travelling toward +Z, ~1.75 m tall in a carving crouch.
function buildCompanion(pal) {
  const red = new THREE.Color(pal[6]).multiplyScalar(0.95), slate = new THREE.Color(pal[5]), dark = slate.clone().multiplyScalar(0.45);
  const redTip = red.clone();
  const parts = [];
  const paint = (g, c, shadeY) => {
    g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv');
    const n = g.attributes.position.count, a = new Float32Array(n * 3), nr = g.attributes.normal;
    for (let i = 0; i < n; i++) { const k = shadeY ? 0.8 + 0.2 * nr.getY(i) : 1; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); parts.push(g);
  };
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), q = new THREE.Quaternion(), m = new THREE.Matrix4();
  const limb = (a, b, r, c, sx = 1, sz = 1) => {
    d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = d.length();
    const g = new THREE.CapsuleGeometry(r, len, 3, 8);
    g.scale(sx, 1, sz);
    q.setFromUnitVectors(up, d.normalize());
    m.compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m); paint(g, c, true);
  };
  for (const s of [-1, 1]) {
    // ski: a thin blade with an upturned tip, red band at the tip
    const ski = new THREE.BoxGeometry(0.1, 0.025, 1.75, 1, 1, 8);
    const sp = ski.attributes.position;
    for (let i = 0; i < sp.count; i++) { const z = sp.getZ(i); if (z > 0.55) sp.setY(i, sp.getY(i) + Math.pow((z - 0.55) / 0.33, 2) * 0.13); sp.setX(i, sp.getX(i) * (1 - 0.5 * smoothstep(0.7, 0.875, Math.abs(z)))); }
    ski.translate(s * 0.19, 0.02, 0.1); ski.computeVertexNormals(); paint(ski, dark, false);
    const band = new THREE.BoxGeometry(0.105, 0.03, 0.12); band.translate(s * 0.19, 0.09, 0.84); band.rotateX(0); paint(band, redTip, false);
    limb([s * 0.19, 0.06, 0.02], [s * 0.19, 0.5, 0.16], 0.075, dark);                 // boot and shin
    limb([s * 0.19, 0.5, 0.16], [s * 0.14, 0.86, -0.14], 0.095, slate);               // thigh
    limb([s * 0.25, 1.36, 0.06], [s * 0.42, 1.1, 0.22], 0.07, red);                   // upper arm
    limb([s * 0.42, 1.1, 0.22], [s * 0.5, 0.97, 0.46], 0.06, red);                    // forearm
    limb([s * 0.5, 0.97, 0.46], [s * 0.51, 0.95, 0.54], 0.065, dark);                 // mitten
    limb([s * 0.51, 0.96, 0.52], [s * 0.66, 0.2, -0.55], 0.022, dark);                // pole
    const basket = new THREE.CylinderGeometry(0.06, 0.06, 0.012, 8); basket.translate(s * 0.65, 0.26, -0.5); paint(basket, dark, false);
  }
  limb([0, 0.88, -0.14], [0, 1.4, 0.1], 0.2, red, 1.05, 0.78);                        // jacket
  limb([0, 0.82, -0.15], [0, 0.95, -0.12], 0.19, slate, 1.0, 0.8);                    // hips
  limb([0, 1.02, -0.2], [0, 1.3, -0.1], 0.13, slate, 1.1, 0.7);                       // pack
  const head = new THREE.SphereGeometry(0.13, 10, 8); head.scale(1, 1.08, 1.1); head.translate(0, 1.6, 0.17); paint(head, dark, true);
  limb([0, 1.42, 0.1], [0, 1.5, 0.13], 0.1, red);                                     // collar
  return parts;
}

// ------------------------------------------------------------------ build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('snow-ghosts-hero') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const detail = ctx.quality?.detail ?? 1;
  const L = opts.length ?? 300, W = opts.width ?? 180;
  const density = (opts.density ?? 1) * rng.range(0.85, 1.15);
  const speed = opts.speed ?? 22;
  const fogOn = true;
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');

  // ---- sun, wind
  const sun = new THREE.Vector3();
  if (opts.sunDir) sun.copy(opts.sunDir).normalize();
  else { const el = 24 * Math.PI / 180, az = 75 * Math.PI / 180; sun.set(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)); }
  const wind = new THREE.Vector3(1, 0, rng.range(-0.12, 0.12)).normalize();
  const windStrength = rng.range(0.8, 1.3);

  // ---- terrain and glade functions (local space)
  const ox = rng.range(-50, 50), oz = rng.range(-50, 50);
  const rawH = (x, z) => 0.448 * z + 0.00028 * z * z + 1.5 * noise.fbm2(x * 0.011 + ox, z * 0.011 + oz, 3) + 0.35 * noise.n2(x * 0.045 - oz, z * 0.045 + ox);
  const h00 = rawH(0, 0);
  const heightAt = opts.heightAt || ((x, z) => rawH(x, z) - h00);
  const lam = rng.range(60, 70), A = rng.range(6.2, 8.2), ph = rng.range(0, TAU), ph2 = rng.range(0, TAU), A2 = rng.range(3, 7);
  const glade0 = (z) => A * Math.sin(TAU * z / lam + ph) + A2 * Math.sin(TAU * z / 270 + ph2);
  const g00 = opts.glade ? 0 : glade0(0);
  const gladeX = opts.glade || ((z) => glade0(z) - g00);
  const offA = rng.range(1.0, 1.6), offP = rng.range(0.7, 1.5);
  const trackX = (z) => gladeX(z) + offA * Math.sin(TAU * z / lam + ph + offP) + 0.4 * Math.sin(TAU * z / 23 + ph2);
  const normalAt = (x, z, o) => { const e = 0.6; o.set(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(); return o; };

  const group = new THREE.Group(); group.name = 'snow-ghosts-hero';
  const C = (hex) => new THREE.Color(hex);
  const zHi = Math.max(opts.top ?? L / 2, L / 2);                          // upper treeline (may lie above the nominal patch)
  const shadowRect = { x0: -W / 2 - 14, z0: -L / 2 - 14, w: W + 60, d: zHi + L / 2 + 28 };
  const U = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uSun: { value: sun.clone() }, uSunCol: { value: C(pal[4]) }, uSunI: { value: 0.92 },
    uSky: { value: C(pal[0]).lerp(C(pal[2]), 0.45) }, uShade: { value: C(pal[2]).multiplyScalar(0.9) },
    uCamL: { value: new THREE.Vector3(0, 30, 80) }, uTime: { value: 0 },
    uShadow: { value: null }, uShRect: { value: new THREE.Vector4(shadowRect.x0, shadowRect.z0, shadowRect.w, shadowRect.d) },
    uNeedle: { value: new THREE.Color('#0b1a12') },
    uS: { value: 0 }, uSpeed: { value: speed }, uWind: { value: wind.clone().multiplyScalar(windStrength) },
    uBombT: { value: -1 }, uBombH: { value: 6 }, uBombO: { value: new THREE.Vector3() }, uPx: { value: 2 },
    uSparkle: { value: 1 }, uRock: { value: C(pal[5]) }, uPlumeA: { value: 1 },
    uScat: { value: 1 }, uComp: { value: new THREE.Vector3(0, 1, 0) },
  };
  // every material shares the same uniform objects (fog uniforms are refreshed per material by three)
  const share = () => { const o = {}; for (const k in U) o[k] = U[k]; for (const k in THREE.UniformsLib.fog) o[k] = { value: U[k].value }; return o; };

  // ---- ghost forms: 6 per seed, two detail levels
  const NF = 6, forms = [];
  for (let f = 0; f < NF; f++) {
    const prm = formParams(rng);
    // five levels: the gate figures we brush past, the inner rows, the rest of the near crowd, the forest, the far flanks
    const gate = ghostForm(prm, noise, 26, 30);
    await ctx.yield();
    const hi = ghostForm(prm, noise, 20, 22), mid = ghostForm(prm, noise, 13, 14), lo = ghostForm(prm, noise, 9, 9), far = ghostForm(prm, noise, 6, 5);
    const pa = hi.attributes.position, last = pa.count - 1;
    forms.push({ prm, gate, hi, mid, lo, far, top: new THREE.Vector3(pa.getX(last), pa.getY(last), pa.getZ(last)) });
    await ctx.yield();
  }
  await ctx.yield();

  // ---- placement: jittered hex grid, a winding glade kept clear, gate figures on the outside of each turn
  const ghosts = [], gates = [];
  const fTop = L / 2 - 6, fBot = -L / 2 + 4;
  const zTop = opts.trackTop ?? fTop, zBot = opts.trackBottom ?? fBot;      // the companion's line may run beyond the forest
  let prevD = 0;
  for (let z = fTop - 4; z > fBot + 5; z -= 1) {
    const dgl = gladeX(z - 0.5) - gladeX(z + 0.5);
    if (prevD !== 0 && Math.sign(dgl) !== Math.sign(prevD)) {
      const side = Math.sign(gladeX(z) - gladeX(z + 6)) || 1;      // outside of the turn
      const sc = rng.range(1.12, 1.36), f = rng.int(0, NF - 1);
      // (on the sun side a gate stands a little further off, so it is not washed out by the light behind it)
      const x = gladeX(z) + side * (3.0 + 0.42 * forms[f].prm.baseR * sc + (side < 0 ? 0.5 : 0) + (side * sun.x > 0 ? 1.4 : 0)), zz = z + rng.range(-1.5, 1.5);
      const gh = { x, z: zz, sy: sc, sxz: sc * rng.range(0.8, 0.95), f, yaw: rng.range(-0.3, 0.3), gate: true, hi: true, side };
      ghosts.push(gh); gates.push(gh);
    }
    if (dgl !== 0) prevD = dgl;
  }
  const sp = (opts.spacing ?? 11.5) / Math.sqrt(density), rowD = sp * 0.866, maxCount = opts.count ?? 520;
  const thin = opts.thin ?? 46;                                   // metres over which the lower treeline thins out
  const cand = [];
  for (let r = 0, z = -L / 2 + 5; z < zHi - 3; z += rowD, r++) {
    for (let x = -W / 2 + 4 + (r & 1) * sp * 0.5; x < W / 2 - 4; x += sp) {
      const gx = x + rng.range(-0.32, 0.32) * sp, gz = z + rng.range(-0.32, 0.32) * sp;
      const sc = clamp(1 + 0.2 * rng.gauss(), 0.62, 1.38);
      const dg = Math.abs(gx - gladeX(gz));
      if (dg < 5.4 + 1.7 * sc) continue;
      if (opts.keep && !opts.keep(gx, gz)) continue;                                            // the world's own limits (ribs, flanks)
      if (noise.n2(gx * 0.013 + 9, gz * 0.013 - 4) > 0.5 && rng.chance(0.85)) continue;        // natural clearings
      const edge = (gz + L / 2) / thin + 0.25 * noise.n2(gx * 0.03, 7.7);                          // the forest thins, then stops
      if (edge < 1 && rng() > edge * edge) continue;
      if (zHi > L / 2 + 1) {                                                                       // the upper treeline: outliers first, then the crowd
        const eT = (zHi - gz) / 60 + 0.3 * noise.n2(gx * 0.03 + 4.1, gz * 0.03);
        if (eT < 1 && rng() > eT * eT * eT) continue;
      }
      let ok = true;
      for (const g of gates) if (Math.hypot(g.x - gx, g.z - gz) < 6.5) { ok = false; break; }
      if (!ok) continue;
      cand.push({ x: gx, z: gz, sy: sc, sxz: sc * rng.range(0.82, 1.18), f: rng.int(0, NF - 1), yaw: rng.range(-0.5, 0.5), gate: false, hi: dg < 26, dg });
    }
  }
  // the far flanks carry fewer figures (no rng here: the layout of the rest stays as it was)
  for (let i = cand.length - 1; i >= 0; i--) { const c = cand[i]; if (c.dg > 112 || (c.dg > 72 && noise.n2(c.x * 0.37 + 2.2, c.z * 0.37 - 5.1) > 0.42)) cand.splice(i, 1); }
  // a second pass: one figure every 8 m on alternate sides, 7.5 to 10 m from the line, so both edges of the frame
  // hold a tall figure all the way down the glade
  {
    const r3 = makeRng('sg-inner:' + ctx.seed);
    let sd = r3.sign();
    for (let z = zHi - 26; z > fBot + 8; z -= r3.range(7, 9)) {
      sd = -sd;
      const sc = r3.range(0.95, 1.3), dgi = r3.range(7.6, 10) + (sd * sun.x > 0 ? 0.8 : 0), zz = z + r3.range(-1.2, 1.2), x = gladeX(zz) + sd * dgi;
      const f = r3.int(0, NF - 1), yaw = r3.range(-0.5, 0.5), sxz = sc * r3.range(0.82, 1.05);
      if (opts.keep && !opts.keep(x, zz)) continue;
      if (Math.abs(x - gladeX(zz - 5)) < 6.4 || Math.abs(x - gladeX(zz + 5)) < 6.4) continue;       // the line swings: stay off it up and down the hill
      let ok = true;
      for (const g of ghosts) if (Math.hypot(g.x - x, g.z - zz) < 6.2) { ok = false; break; }
      if (ok) for (const g of cand) if (Math.hypot(g.x - x, g.z - zz) < 5.6) { ok = false; break; }
      if (ok) cand.push({ x, z: zz, sy: sc, sxz, f, yaw, gate: false, hi: true, dg: Math.abs(x - gladeX(zz)) - 3 });
    }
  }
  if (cand.length + ghosts.length > maxCount) { rng.shuffle(cand); cand.length = Math.max(0, maxCount - ghosts.length); }
  let nHi = ghosts.length; const hiCap = Math.round((opts.near ?? 72) * (0.6 + 0.4 * detail));
  cand.sort((a, b) => a.dg - b.dg);
  const midFrom = Math.round(hiCap * 0.5);                         // the nearer half of the detailed crowd keeps the full form
  for (const c of cand) { if (c.hi && nHi < hiCap) { nHi++; c.mid = nHi > midFrom; } else c.hi = false; c.far = !c.hi && c.dg > 58; ghosts.push(c); }
  const nForest = ghosts.length;
  for (const e of opts.extra || []) ghosts.push({ x: e.x, z: e.z, y: e.y, sy: e.scale, sxz: e.scale * 0.92, f: (ghosts.length * 5 + 1) % NF, yaw: ((ghosts.length * 0.618) % 1 - 0.5), gate: false, hi: e.hi !== false, extra: true, dg: 0 });
  await ctx.yield();
  for (const g of ghosts) { if (!g.extra) g.y = heightAt(g.x, g.z) - 0.25; g.h = 8 * g.sy; g.s = g.sxz; g.w = forms[g.f].prm.baseR / 1.5; g.seed = rng(); }
  await ctx.yield();

  // ---- shadow map
  const casters = ghosts.slice(0, nForest).concat((opts.casters || []).map((c) => ({ x: c.x, z: c.z, h: c.h, s: 1, w: c.r / 1.2 })));
  const shadowTex = await bakeShadows(casters, shadowRect, sun, ctx);
  U.uShadow.value = shadowTex;
  await ctx.yield();

  // ---- instanced figures
  const ghostMat = ghostMaterial(share(), fogOn);
  let triangles = 0;
  {
    const m4 = new THREE.Matrix4(), qy = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    let nWin = 0;
    for (let f = 0; f < NF; f++) for (const lod of ['gate', 'hi', 'mid', 'lo', 'far']) {
      const list = ghosts.filter((g) => g.f === f && (g.gate ? 'gate' : g.hi ? (g.mid ? 'mid' : 'hi') : g.far ? 'far' : 'lo') === lod);
      if (!list.length) continue;
      const geo = forms[f][lod];
      const im = new THREE.InstancedMesh(geo, ghostMat, list.length);
      const inst = new Float32Array(list.length * 3);
      list.forEach((g, i) => {
        qy.setFromAxisAngle(yAxis, g.yaw);
        m4.compose(v3.set(g.x, g.y, g.z), qy, s3.set(g.sxz, g.sy, g.sxz));
        im.setMatrixAt(i, m4);
        // the needle window: on the lee side of a few figures, and on the gates that turn their lee side to the glade
        const win = g.hi && (g.seed > 0.72 || (g.gate && (g.side < 0 || nWin < 3)));
        if (win && g.gate) nWin++;
        inst[i * 3] = g.seed; inst[i * 3 + 1] = win ? 1 : 0; inst[i * 3 + 2] = g.y;
        g.top = forms[f].top.clone().applyMatrix4(m4);
      });
      geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3));
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = `ghosts-${f}-${lod}`;
      group.add(im);
      triangles += (geo.index.count / 3) * list.length;
    }
  }
  await ctx.yield();

  // ---- snow surface (own patch; the world may replace it with its terrain)
  const tmpN = new THREE.Vector3();
  if (opts.snow !== false) {
    const nx = 60, nz = 100, x0 = -W / 2 - 12, z0 = -L / 2 - 12, sw = W + 24 + 20, sd = L + 24;
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), nor = new Float32Array(pos.length), edge = new Float32Array((nx + 1) * (nz + 1));
    let v = 0;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + (i / nx) * sw, z = z0 + (j / nz) * sd;
      pos[v * 3] = x; pos[v * 3 + 1] = heightAt(x, z); pos[v * 3 + 2] = z;
      normalAt(x, z, tmpN); nor[v * 3] = tmpN.x; nor[v * 3 + 1] = tmpN.y; nor[v * 3 + 2] = tmpN.z;
      edge[v] = clamp(Math.min(x - x0, x0 + sw - x, z - z0, z0 + sd - z) / 14, 0, 1);
      v++;
    }
    const idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1));
    g.setIndex(idx);
    const snow = new THREE.Mesh(g, snowMaterial(share(), fogOn, false));
    snow.name = 'snow'; snow.frustumCulled = false; group.add(snow);
    triangles += idx.length / 3;
  }
  await ctx.yield();

  // ---- the companion's line: samples, arc length, curvature
  const NS = Math.round((zTop - zBot) / 0.72), dzs = (zTop - zBot) / NS;
  const TP = new Float32Array((NS + 1) * 3), TS = new Float32Array(NS + 1), TC = new Float32Array(NS + 1);
  for (let i = 0; i <= NS; i++) {
    if ((i & 255) === 255) await ctx.yield();
    const z = zTop - i * dzs, x = trackX(z);
    TP[i * 3] = x; TP[i * 3 + 1] = heightAt(x, z); TP[i * 3 + 2] = z;
    if (i) TS[i] = TS[i - 1] + Math.hypot(TP[i * 3] - TP[i * 3 - 3], TP[i * 3 + 1] - TP[i * 3 - 2], TP[i * 3 + 2] - TP[i * 3 - 1]);
    const e = 2.5; TC[i] = clamp((trackX(z + e) - 2 * x + trackX(z - e)) / (e * e) / 0.06, -1, 1);
  }
  const Stot = TS[NS];
  const idxAtS = (s) => { let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TS[m] > s) hi = m; else lo = m; } return lo + clamp((s - TS[lo]) / Math.max(TS[lo + 1] - TS[lo], 1e-4), 0, 1); };
  const sAtZ = (z) => { const f = clamp((zTop - z) / dzs, 0, NS), i = Math.min(NS - 1, Math.floor(f)); return lerp(TS[i], TS[i + 1], f - i); };
  const trackAt = (f, o) => { const i = Math.min(NS - 1, Math.max(0, Math.floor(f))), k = clamp(f - i, 0, 1); return o.set(lerp(TP[i * 3], TP[i * 3 + 3], k), lerp(TP[i * 3 + 1], TP[i * 3 + 4], k), lerp(TP[i * 3 + 2], TP[i * 3 + 5], k)); };
  const xdir = (i, o) => { const a = Math.max(0, i - 1), b = Math.min(NS, i + 1); const tx = TP[b * 3] - TP[a * 3], tz = TP[b * 3 + 2] - TP[a * 3 + 2], l = Math.hypot(tx, tz) || 1; return o.set(-tz / l, 0, tx / l); };  // unit, +X-ish

  // ---- carved grooves: two painted trenches with raised lips, revealed behind the companion
  {
    const CR = [-2.4, -1.3, -1, -0.5, 0.5, 1, 1.3, 2.4], LIFT = [0.012, 0.075, 0.055, 0.03, 0.03, 0.055, 0.075, 0.012];
    const nv = (NS + 1) * 16, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), trk = new Float32Array(nv * 2), idx = [];
    const xd = new THREE.Vector3();
    let v = 0;
    for (let i = 0; i <= NS; i++) {
      if ((i & 63) === 63) await ctx.yield();
      xdir(i, xd);
      const side = Math.sign(xd.x * sun.x + xd.z * sun.z) || 1, ac = Math.abs(TC[i]);
      const w = 0.135 * (1 + 0.45 * ac), gap = 0.3 + 0.08 * ac;
      for (let g = 0; g < 2; g++) for (let k = 0; k < 8; k++) {
        const off = (g ? gap : -gap) + CR[k] * w, x = TP[i * 3] + xd.x * off, z = TP[i * 3 + 2] + xd.z * off;
        pos[v * 3] = x; pos[v * 3 + 1] = heightAt(x, z) + LIFT[k] * (1 + ac); pos[v * 3 + 2] = z;
        normalAt(x, z, tmpN); nor[v * 3] = tmpN.x; nor[v * 3 + 1] = tmpN.y; nor[v * 3 + 2] = tmpN.z;
        trk[v * 2] = CR[k] * side; trk[v * 2 + 1] = TS[i];
        if (i < NS && k < 7) { const a = v, b = v + 1, c = v + 16, d = v + 17; if (xd.x > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
        v++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aTrk', new THREE.BufferAttribute(trk, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, snowMaterial(share(), fogOn, true));
    m.material.side = THREE.DoubleSide; m.name = 'tracks'; m.frustumCulled = false; m.renderOrder = 1; group.add(m);
    triangles += idx.length / 3;
  }

  await ctx.yield();
  // ---- companion
  const compGeo = mergeGeometries(buildCompanion(pal), false);
  const companion = new THREE.Mesh(compGeo, new THREE.ShaderMaterial({
    fog: fogOn, vertexColors: true, uniforms: share(),
    vertexShader: `varying vec3 vN, vC;
      #include <common>
      #include <fog_pars_vertex>
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uSun, uSunCol, uShade; uniform float uSunI; varying vec3 vN, vC;
      #include <common>
      #include <fog_pars_fragment>
      void main(){ vec3 N = normalize(vN); float ndl = dot(N, uSun);
        vec3 l = uSunCol * uSunI * 1.25 * smoothstep(-0.1, 0.6, ndl) + uShade * (0.55 + 0.3 * N.y) + vec3(0.30, 0.32, 0.36) * (0.6 - 0.4 * N.y);
        gl_FragColor = vec4(vC * l, 1.);
      #include <fog_fragment>
      }`,
  }));
  companion.name = 'companion'; companion.matrixAutoUpdate = false; companion.frustumCulled = false;
  companion.scale.setScalar(1.12); group.add(companion);
  triangles += compGeo.attributes.position.count / 3;
  await ctx.yield();

  // ---- powder sprites: carved plumes (progress-keyed), head dust and spindrift (ambient), one snow bomb
  {
    const O = [], V = [], P = [], M = [];
    const xd = new THREE.Vector3(), r2 = rng.fork ? rng.fork('powder') : rng;
    // one grain of a turn's fan: grain k of n at track sample i, its draws taken from the stream r
    const grain = (r, i, k, n, ac, out, sunny) => {
      xdir(i, xd);
      const tx = (TP[i * 3 + 3] - TP[i * 3 - 3]), ty = (TP[i * 3 + 4] - TP[i * 3 - 2]), tz = (TP[i * 3 + 5] - TP[i * 3 - 1]), tl = Math.hypot(tx, ty, tz) || 1;
      // thrown to the OUTSIDE of the turn, sideways and up, and born once the skier is two metres past: the
      // fan stands beside the red jacket, never over it
      // a fan: every grain leaves at 20 to 80 degrees above the snow, the fastest in the middle of the arc
      const th = (20 + 60 * (k + r()) / n) * Math.PI / 180, spd = (2.6 + 9.5 * ac) * r.range(0.6, 1) * (0.75 + 0.35 * Math.sin((th - 0.35) * 3));
      const lat = out * spd * Math.cos(th) * (sunny ? 0.8 : 1), fw = r.range(-1, 2);
      const upv = spd * Math.sin(th) * (sunny ? 1.12 : 1);
      const off = out * r.range(1.5, 2.5), ox0 = TP[i * 3] + xd.x * off, oz0 = TP[i * 3 + 2] + xd.z * off;
      O.push(ox0, heightAt(ox0, oz0) + 0.25, oz0);
      V.push(xd.x * lat + tx / tl * fw + r.range(-0.6, 0.6), upv + ty / tl * fw * 0.5, xd.z * lat + tz / tl * fw + r.range(-0.6, 0.6));
      if (sunny) P.push(TS[i] + r.range(1.8, 2.8), (1.6 + 0.8 * ac) * r.range(0.85, 1.15), (1.0 + 1.5 * ac) * r.range(0.8, 1.25), r());
      else P.push(TS[i] + r.range(1.8, 2.8), (1.2 + 1.3 * ac) * r.range(0.8, 1.15), (0.9 + 1.7 * ac) * r.range(0.8, 1.25), r());
      M.push(sunny ? 0.3 : 0);
    };
    const fanMore = [];                                         // the sharper turns' further grains: dealt last, from a fork of their own
    for (let i = 2; i < NS - 1; i++) {
      const pk = opts.plumeScale ? opts.plumeScale(TP[i * 3 + 2]) : 1;       // the world can quiet the plumes (a slow, straight ridge)
      if (pk < 0.04) continue;
      const cn = TC[i] * pk, ac = Math.abs(cn);
      xdir(i, xd); const out = -Math.sign(cn) || 1;
      // a fan thrown to the sun's side stands between us and the light as we come down on it: taller, longer in the air
      const sunny = out * (xd.x * sun.x + xd.z * sun.z) > 0 && ac > 0.22;
      const n = 1 + (ac > 0.4 ? 1 : 0) + (ac > 0.6 ? 1 : 0) + (ac > 0.8 ? 1 : 0) + (sunny && ac > 0.5 ? 1 : 0);
      // The powder stream deals each turn its first nBase grains (one fewer than n on the sharper turns) and, after the
      // last turn, the head dust, the spindrift and the snow bomb. A sharper turn's further grain waits for the fork
      // taken further down, after that stream's last draw, so it shifts none of those.
      const nBase = 1 + (ac > 0.4 ? 1 : 0) + (ac > 0.75 ? 1 : 0) + (sunny && ac > 0.5 ? 1 : 0);
      for (let k = 0; k < nBase; k++) grain(r2, i, k, n, ac, out, sunny);
      for (let k = nBase; k < n; k++) fanMore.push([i, k, n, ac, out, sunny]);
      if ((i & 255) === 255) await ctx.yield();
    }
    const fanEnd = M.length;
    const hiG = ghosts.filter((g) => g.hi && g.top);
    for (const g of hiG) {                                      // dust streaming off heads and shoulders
      if (!g.gate && r2.chance(0.45)) continue;
      for (let k = 0; k < 2; k++) {
        const hgt = k ? 1 : r2.range(0.6, 0.8);
        O.push(lerp(g.x, g.top.x, hgt) + r2.range(-0.4, 0.6), lerp(g.y, g.top.y, hgt) + 0.2, g.top.z + r2.range(-0.5, 0.5));
        V.push(wind.x * 1.6, -r2.range(0.6, 1.6), wind.z * 1.6 + r2.range(-0.3, 0.3));
        P.push(0, r2.range(3, 5.5), r2.range(0.7, 1.4), r2()); M.push(1);
      }
    }
    const nDrift = Math.round(90 * detail);
    for (let k = 0; k < nDrift; k++) {                            // spindrift crawling over the surface
      const z = r2.range(-L / 2 + 10, L / 2 - 10), x = gladeX(z) + r2.range(-38, 30);
      O.push(x, heightAt(x, z) + 0.3, z); V.push(wind.x * 6, 0.25, wind.z * 6);
      P.push(0, r2.range(3.5, 6), r2.range(2.2, 4.2), r2()); M.push(1);
    }
    for (let k = 0; k < 22; k++) {                                // the snow bomb
      const a = r2.range(0, TAU), r = Math.sqrt(r2());
      O.push(Math.cos(a) * r * 0.6, r2.range(-0.4, 0.5), Math.sin(a) * r * 0.6);
      V.push(Math.cos(a) * (0.4 + r), r2.range(0.2, 1), Math.sin(a) * (0.4 + r));
      P.push(r2.range(0, 0.1), 2.4, r2.range(0.9, 1.7), r2()); M.push(2);
    }
    {                                                             // the further grains, then moved up to stand with the rest of the fans
      const rm = r2.fork ? r2.fork('fan-more') : makeRng('sg-fan-more:' + ctx.seed), n0 = M.length;
      for (const f of fanMore) grain(rm, ...f);
      for (const [A, per] of [[O, 3], [V, 3], [P, 4], [M, 1]]) { const rest = A.splice(fanEnd * per, (n0 - fanEnd) * per); for (const v of rest) A.push(v); }
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aO', new THREE.InstancedBufferAttribute(new Float32Array(O), 3));
    g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(V), 3));
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4));
    g.setAttribute('aM', new THREE.InstancedBufferAttribute(new Float32Array(M), 1));
    g.instanceCount = M.length;
    const m = new THREE.Mesh(g, powderMaterial(share(), fogOn));
    m.name = 'powder'; m.frustumCulled = false; m.renderOrder = 3; group.add(m);
    triangles += M.length * 2;
  }

  // ---- diamond dust round the camera
  if (opts.dust !== false) {
    const n = Math.round(1400 * detail), pos = new Float32Array(n * 3), aD = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { pos[i * 3] = rng.range(0, 56); pos[i * 3 + 1] = rng.range(0, 56); pos[i * 3 + 2] = rng.range(0, 56); aD[i * 4] = rng(); aD[i * 4 + 1] = rng(); aD[i * 4 + 2] = rng(); aD[i * 4 + 3] = rng(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aD', new THREE.BufferAttribute(aD, 4));
    const pts = new THREE.Points(g, dustMaterial(U));
    pts.name = 'diamond-dust'; pts.frustumCulled = false; pts.renderOrder = 4; group.add(pts);
  }
  await ctx.yield();

  // ---- progress: companion pose, track reveal, plume birth
  const compPos = new THREE.Vector3(), compHead = new THREE.Vector3(0, 0, -1);
  const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), nrm = new THREE.Vector3();
  const basis = new THREE.Matrix4(), sclM = new THREE.Matrix4();
  let driven = false, progress = 0;
  const applyS = (s) => {
    s = clamp(s, 0, Stot);
    U.uS.value = s;
    const f = idxAtS(s);
    trackAt(f, compPos); trackAt(Math.max(0, f - 1.5), pa); trackAt(Math.min(NS, f + 1.5), pb);
    bz.subVectors(pb, pa).normalize(); compHead.copy(bz); bz.y *= 0.45; bz.normalize();
    const i = Math.min(NS, Math.round(f)), cn = TC[i];
    normalAt(compPos.x, compPos.z, nrm); nrm.y += 1.2; nrm.normalize();
    bx.crossVectors(nrm, bz).normalize();                       // skier's right... sign fixed below
    const inside = Math.sign(bx.x) * Math.sign(cn) || 0;        // lean into the turn
    by.copy(nrm).addScaledVector(bx, inside * Math.tan(0.52 * Math.abs(cn))).normalize();
    bx.crossVectors(by, bz).normalize(); by.crossVectors(bz, bx).normalize();
    basis.makeBasis(bx, by, bz);
    const sc = 1.2, crouch = 1 - 0.1 * Math.abs(cn);
    sclM.makeScale(sc, sc * crouch, sc);
    companion.matrix.copy(basis).multiply(sclM).setPosition(compPos.x, compPos.y - 0.1, compPos.z);
    companion.matrixWorldNeedsUpdate = true;
    companion.visible = s < Stot - 0.5 || driven;
    U.uComp.value.set(compPos.x, compPos.y + 1.1, compPos.z);
  };
  const setProgress = (p) => { driven = true; progress = clamp(p, 0, 1); applyS(progress * Stot); };
  // the world may take the companion off the snow (the cliff jump): position of the feet, heading, visibility
  // tuck 0..1: 0 stands tall, 1 is a compact airborne tuck (folded down and pitched forward over the skis)
  const setCompanionPose = (pos, dir, visible = true, tuck = 0.5) => {
    driven = true;
    compPos.copy(pos); compHead.copy(dir).normalize();
    bz.copy(compHead); by.set(0, 1, 0); bx.crossVectors(by, bz).normalize(); by.crossVectors(bz, bx).normalize();
    const pa0 = 0.42 * tuck, cp = Math.cos(pa0), sp0 = Math.sin(pa0);
    pa.copy(by).multiplyScalar(cp).addScaledVector(bz, sp0); pb.copy(bz).multiplyScalar(cp).addScaledVector(by, -sp0);
    basis.makeBasis(bx, pa, pb); sclM.makeScale(1.2, 1.2 * (1 - 0.3 * tuck), 1.2);
    U.uComp.value.set(compPos.x, compPos.y + 1.0, compPos.z);
    companion.matrix.copy(basis).multiply(sclM).setPosition(compPos.x, compPos.y, compPos.z);
    companion.matrixWorldNeedsUpdate = true; companion.visible = visible;
  };
  const progressAtZ = (z) => sAtZ(z) / Stot;
  const sCentre = sAtZ(-8);
  const p0 = opts.progress ?? sCentre / Stot;
  applyS(p0 * Stot);

  // ---- snow bomb
  const nearGate = gates.length ? gates.reduce((a, b) => (Math.abs(b.z + 2) < Math.abs(a.z + 2) ? b : a)) : null;
  const setBomb = (i, t) => {
    const g = gates[Math.max(0, Math.min(gates.length - 1, i | 0))];
    if (!g || !g.top) { U.uBombT.value = -1; return; }
    const y0 = lerp(g.y, g.top.y, 0.78), bxp = lerp(g.x, g.top.x, 0.6) - g.side * 1.2;
    U.uBombO.value.set(bxp, y0, g.z);
    U.uBombH.value = Math.max(1, y0 - heightAt(bxp, g.z) - 0.3);
    U.uBombT.value = t;
  };
  let bombDriven = false;

  const setLight = (o = {}) => {
    if (o.sun) U.uSun.value.copy(o.sun).normalize();
    if (o.sunColor) U.uSunCol.value.set(o.sunColor);
    if (o.sky) U.uSky.value.set(o.sky);
    if (o.shade) U.uShade.value.set(o.shade);
    if (o.intensity != null) U.uSunI.value = o.intensity;
  };

  // ---- anchors
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const flyThrough = [];
  for (let z = L / 2; z >= -L / 2 - 0.01; z -= 10) { const x = gladeX(z); flyThrough.push(V3(x, heightAt(x, z) + 1.5, z)); }
  const zE = -L / 2, xE = gladeX(zE), yE = heightAt(xE, zE);
  const exitDir = V3(gladeX(zE) - gladeX(zE + 8), heightAt(xE, zE) - heightAt(gladeX(zE + 8), zE + 8), -8).normalize();
  const hz = 24, hx = gladeX(hz);
  const anchors = {
    flyThrough, gladeX, heightAt,
    trackPoint: (p, target = new THREE.Vector3()) => trackAt(idxAtS(clamp(p, 0, 1) * Stot), target),
    companion: compPos, companionHeading: compHead,
    gates: gates.map((g) => ({ position: V3(g.x, g.y + 0.25, g.z), top: g.top ? g.top.clone() : V3(g.x, g.y + g.h, g.z), side: g.side })),
    entry: { position: V3(gladeX(L / 2), heightAt(gladeX(L / 2), L / 2) + 1.5, L / 2), facing: V3(0, -0.45, -0.89).normalize() },
    exit: { position: V3(xE, yE + 1.5, zE), facing: exitDir },
    portalSeat: {
      position: V3(xE, yE - 95, zE - 190), facing: V3(0, 0.87, 0.5).normalize(),
      note: 'not built here: the brief seats the 14 m portal in a cloud well ~150 m out from the cliff foot, beyond the lower treeline on the glade axis; this is only a suggested spot',
    },
    viewpoints: {
      heroFrame: { position: V3(hx, heightAt(hx, hz) + 1.5, hz), gaze: V3(trackX(-8), heightAt(trackX(-8), -8) + 1.5, -8) },
      aerial: { position: V3(40, heightAt(40, 50) + 30, 50), gaze: V3(0, 4, 0) },
      fromBelow: { position: V3(gladeX(-60) + 4, heightAt(gladeX(-60) + 4, -60) + 3, -60), gaze: V3(0, 6, 0) },
    },
    sun: sun.clone(), wind: wind.clone(),
    shadow: { texture: shadowTex, rect: shadowRect, uvOf: (x, z, o = new THREE.Vector2()) => o.set((x - shadowRect.x0) / shadowRect.w, (z - shadowRect.z0) / shadowRect.d) },
  };

  // ---- per-frame
  const camL = new THREE.Vector3(), size = new THREE.Vector2();
  const update = (dt, time, camera) => {
    U.uTime.value = time;
    if (camera) {
      camera.getWorldPosition(camL); group.worldToLocal(camL); U.uCamL.value.copy(camL);
    }
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = Math.max(1.5, (size.y / 450) * 1.7); }
    if (!driven) {                                              // demo loop until the world takes over
      const span = Stot + 45;
      const s = ((sCentre + speed * (time - 12)) % span + span) % span;
      applyS(s);
    }
    if (!bombDriven && nearGate) { const tb = (((time - 10.9) % 7) + 7) % 7; setBomb(gates.indexOf(nearGate), tb < 2.6 ? tb : -1); }
  };

  return {
    object: group,
    radius: 8, height: 60, center: new THREE.Vector3(0, 7, 0),
    anchors, update,
    setProgress, progressAtZ, setLight, setCompanionPose,
    makeSnowMaterial: () => snowMaterial(share(), fogOn, false, true), shareUniforms: share,
    setBomb: (i, t) => { bombDriven = true; setBomb(i, t); },
    uniforms: U,
    info: {
      triangles: Math.round(triangles), ghosts: ghosts.length, ghostsNear: ghosts.filter((g) => g.hi).length,
      extent: { width: W, length: L, yTop: heightAt(0, L / 2), yBottom: heightAt(0, -L / 2), tallest: 11 },
      trackLength: Stot, turns: gates.length,
      seedNotes: { gladeWavelength: lam, gladeAmplitude: A, density, windStrength },
    },
    dispose() { shadowTex.dispose(); },
    ground: false, groundY: 0,
  };
}
