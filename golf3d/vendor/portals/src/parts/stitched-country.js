// THE NEEDLE AND THE ONE THREAD: hero set piece of "stitched-country".
//
// A 120 m mirror-steel needle sews a crimson running stitch through linen, leaping like a dolphin: it slides out of
// one hole point-first, hangs and pitches over at ~60-95 m with the button sun flashing down its length, and plunges
// through the next hole 110 m on. Each piercing dimples the cloth 4 m and sends a ring ripple 200 m out; each exit
// tugs the previous slack stitch taut. The thread it sews with comes from the country itself: a hill of satin-stitch
// fields (French knots, pom-pom trees) is pulled out row by row, each row lifting off crimped in its own colour and
// blushing to crimson as the feeder strands gather into one line that arcs overhead into the needle's eye. A standing
// wooden embroidery hoop (14 m opening, brass screw, frill of caught linen) stands on the needle's entry line, so the
// needle dives clean through its centre once a lap.
//
// LOCAL SPACE  origin at the base centre (cloth = y 0), +Y up. Default layout is a RING: the stitch road is a circle
//              of radius 105 m (four stitches of 110 m sewn + 55 m skipped) round a 78 m-radius unravelling hill at
//              the origin, sewn for ever; stitches 2.75 laps-of-a-stitch old are unpicked. The hoop sits on the ring
//              toward +Z (within about +-25 degrees, per seed). Pass opts.road for a linear country (see OPTS).
// SIZE         radius ~100 (ring 105, needle swings to ~130), height ~110 (needle tip ~97 m, thread knot 96 m).
//              The linen disc is 420 m in radius (opts.cloth = false removes it).
// COST         about 104k triangles, 6 draw calls (linen, hill, knots, needle, hoop, threads), no lights,
//              no textures. Build ~100-200 ms. Per frame: ~20 Bezier strands re-posed on the CPU.
// LIGHTING     Linen, satin, thread, knots and needle are self-lit ShaderMaterials (they do NOT read scene lights):
//              a broad warm key from opts.lightDir (default (-0.6, 0.7, 0.4)), lavender shade. Only the hoop is a
//              MeshStandardMaterial and needs the world's hemisphere + sun. All respect scene.fog. Wants a pale linen
//              sky, light fog, bloom threshold ~0.9: only the needle's sun glint and flash (HDR 5-25) bloom.
//              Regrade through hero.uniforms: uSun, uAmb, uShade, uLinen, uCrimson, uButton (linear THREE.Color).
// STYLE        Embroidery on linen, how it is done so the world can match it:
//              - linen: over-under weave from |sin| of xz / 0.3 m with a checker choosing warp or weft on top, faded by
//                fwidth into slub streaks (two stretched value noises) and mottling; blue dashed pencil outlines
//                from a 62 m Voronoi edge; needle-hole dots; shading = shade colour + key * smoothstep wrap.
//              - satin fields: Voronoi fields, each with a stitch angle; rows 2.2 m wide across the stitch, per-row
//                dye-lot jitter, cosine row bump faded by fwidth, Kajiya-Kay highlight pow(sin(T,H), 70) along the
//                stitch modulated by a travelling sheen wave; darker feather-stitch hedges on field borders.
//              - thread: tube with a three-ply twist (|sin| of length*0.11 + angle*3/2pi), wrap diffuse, fuzz rim
//                pow(1-N.V, 2.2), Kajiya-Kay along the tangent; kept >= ~2 px wide by widening with distance.
//              - chrome: reflection of a tiny analytic environment (bright linen sky, pearl-button sun, patchwork
//                ground, dark horizon band, crimson streak) with lengthwise polishing noise. The only hard mirror.
//
// OPTS         palette      7 hex strings in brief order (linen, cream, blue, green, gold, brown, crimson).
//              lightDir     [x,y,z] direction TO the key light.
//              road         (d, outVector3) => point on the cloth d metres along the stitch road, in hero local space.
//                           Omit for the ring. With a road, also pass roadLength (default 1400): stitch i runs from
//                           road(i*165) to road(i*165+110); nothing is unpicked unless opts.keep is set.
//              hoopStitch   index of the stitch whose far hole the hoop guards (default: the last); hoop: false omits it.
//              hoopHeight   height of the hoop centre above its hole (default 9.2).
//              mounds       [{x, z, r, h}] unravelling hills (default one at the origin); [] for none, then
//                           feederSources: [Vector3] (live, at most 8) are the points the feeder strands rise from.
//              angle        launch/entry angle of the needle in degrees (default 49-55 per seed).
//              period       nominal seconds per stitch (default 3; only scales the ripple clock and the default loop).
//              keep         age in stitches after which a stitch is pulled out again (ring 2.75, road Infinity).
//              cloth, clothRadius, knots (700), threadRadius (0.58), threadHeight (96), gatherBack (190),
//              layRadius (1) and stitchRadius (1.4): the strand being laid and the laid stitches, in thread radii;
//              moundRings (40), moundSegs (96): mesh density of each mound,
//              knotDetail (0): how round the hills' flower knots are (0: a ball of 20 triangles, 1: of 80, as their trees have),
//              needleWiden (0.0062): how fast the needle thickens with distance; needleRim (0.62): brightness of its outline,
//              feederSag (0): how deep each feeder strand hangs, as a share of its span, up to feederSagMax (40 m);
//              hang: false keeps the supply thread's older, stiffer shape,
//              fieldOrder   (x, z) => 0..1: when each field unravels under setUnravel (default: shuffled); unravelSpan: the
//                           share of setUnravel's range one field takes (default 0.45).
//              startPhase, span, needleCutY (discard needle below this world y if the world's cloth is not opaque).
//
// PROGRESS     Nothing scripted runs on the clock unless you let it. hero.setPhase(s): stitch phase, integer part =
//              stitch index, fraction = the leap (0 point breaks cloth, 0.30 airborne, 0.66 point pierces the far
//              hole, 0.96 gone under). hero.setProgress(u): u 0..1 maps to s = hoopClearPhase - (1-u)*span, so at u = 1
//              the needle has just vanished through the hoop. hero.hoopPhase = s at which the point enters the hoop.
//              hero.setUnravel(x): 0 hill fully stitched .. 1 bare. If never called: s = startPhase + time/period
//              and the hill unravels (to about three quarters) and is re-sewn on a 64 s loop. Sheen, wobble and thread whip use time.
//
// ANCHORS (local space)
//   portalSeat   { position, facing, direction, radius: 7 }: centre of the hoop opening; facing looks back at the
//                arriving camera, direction is the way through. Seat the 14 m portal here.
//   flyThrough   7 points: a straight line from 240 m out, descending to hoop height by 60 m out, level through the
//                hoop and 110 m beyond. Clear of all static parts by > 6 m; the needle crosses it only while diving
//                through the hoop (phase hoopPhase .. hoopClearPhase), so arrive after that.
//   beyond       point 60 m past the hoop.   ringRoad { center, radius, direction } (null with opts.road).
//   mounds       [{ center, radius }].   threadHeight: height of the gathering knot.
//   viewpoints   { far, reveal, chase, under }: good camera positions looking at `center` / the needle.
// LIVE         hero.needle { tip, eye, crown, dir } and hero.gather (Vector3s updated every frame), hero.rippleAt(x, z)
//              (cloth height offset, same wave as the shaders: use it to lift sheep, train, trees), hero.road(d),
//              hero.pose(s, tipOut, dirOut), hero.uniforms.uRip (vec4[8]: x, z, seconds, strength) for your own linen.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E6DCC8', '#F7F2E6', '#7FA8B8', '#8DAA5B', '#D9A441', '#8A5A3C', '#C4283C'];
export const PITCH = 165, SEW = 110, NEEDLE_LEN = 120, EYE_Y = 6.5; // one stitch: 110 m sewn + 55 m skipped; eye centre 6.5 m from the crown
const NRIP = 8, TAU = Math.PI * 2;

// ---------- shared GLSL ----------
export const GLSL_COMMON = /* glsl */`
  uniform vec4 uRip[${NRIP}];   // x, z, seconds since the needle pierced here, strength
  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
  float ripple(vec2 p){
    float h = 0.;
    for (int i = 0; i < ${NRIP}; i++) {
      vec4 r = uRip[i]; if (r.w <= 0.) continue;
      float d = length(p - r.xy), t = r.z, fr = d - 67. * t;
      h += r.w * (2.3 * exp(-fr * fr / 200.) * cos(fr * 0.22) * exp(-d / 120.) * smoothstep(0., .2, t)
                 - 4. * exp(-d * d / 70.) * (exp(-t * 2.4) + 0.14));
    }
    return h;
  }`;
const FOG_U = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// JS twin of ripple() so the world can lift sheep, trains and trees with the same wave
function rippleJS(rip, x, z) {
  let h = 0;
  for (let i = 0; i < NRIP; i++) {
    const r = rip[i]; if (r.w <= 0) continue;
    const d = Math.hypot(x - r.x, z - r.y), t = r.z, fr = d - 67 * t;
    h += r.w * (2.3 * Math.exp(-fr * fr / 200) * Math.cos(fr * 0.22) * Math.exp(-d / 120) * smoothstep(0, 0.2, t)
      - 4 * Math.exp(-d * d / 70) * (Math.exp(-t * 2.4) + 0.14));
  }
  return h;
}

// swept tube with elliptical sections along +Y: rings = [[y, cx, rx, rz], ...]; smooth normals, closed ends
function sweep(rings, radial = 20) {
  const pos = [], idx = [];
  for (const [y, cx, rx, rz] of rings) for (let j = 0; j < radial; j++) { const a = (j / radial) * TAU; pos.push(cx + Math.cos(a) * rx, y, Math.sin(a) * rz); }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + (j + 1) % radial, c = a + radial, d = b + radial;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function mergeGeos(list) {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, vo * 3); else col.fill(1, vo * 3, (vo + g.attributes.position.count) * 3);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo;
    vo += g.attributes.position.count; io += ia.length; g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('color', new THREE.BufferAttribute(col, 3)); m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}
function paint(g, color, jitter = 0, rng = null) {
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 1 + (rng ? (rng() - 0.5) * jitter : 0); c[i * 3] = color.r * k; c[i * 3 + 1] = color.g * k; c[i * 3 + 2] = color.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}

// ---------- needle kinematics (pure functions of the stitch phase s = stitch index + fraction of the leap) ----------
// A rigid needle can only pass a hole along its own axis, so each leap is three moves in the vertical plane through
// the stitch's two holes: (1) f 0..F1 it slides OUT of hole A along a fixed line raised `alpha` from the cloth,
// decelerating; (2) F1..F2 it is airborne: the centre follows a Hermite arc and the needle pitches over (the hang);
// (3) F2..F3 it slides IN through hole B along a fixed line, accelerating; F3..1 it is under the cloth.
export const F1 = 0.3, F2 = 0.66, F3 = 0.96;
function makeKinematics(road, alpha) {
  const L = NEEDLE_LEN, Q0 = -3, LQ = L + 6, A = new THREE.Vector3(), B = new THREE.Vector3(), h = new THREE.Vector3(), c1 = new THREE.Vector3(), c2 = new THREE.Vector3();
  const ca = Math.cos(alpha), sa = Math.sin(alpha), KK = 0.4 * LQ / F1 * (F2 - F1);
  const solve = (fn, target) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (fn(m) < target) lo = m; else hi = m; } return lo; };
  const eOutQ = (u) => 1.6 * u - 0.6 * u * u, eInQ = (u) => 0.4 * u + 0.6 * u * u;
  const fEyeOut = F1 * solve(eOutQ, (L - EYE_Y - Q0) / LQ), fEyeIn = F2 + (F3 - F2) * solve(eInQ, (L - EYE_Y - Q0) / LQ);
  // pose at phase s: writes the tip position and the unit axis (eye -> tip); returns the fraction f
  function pose(s, tip, dir) {
    const i = Math.floor(s), f = s - i;
    road(i * PITCH, A); road(i * PITCH + SEW, B); h.subVectors(B, A).setY(0).normalize();
    if (f < F1) { dir.copy(h).multiplyScalar(ca).setY(sa); tip.copy(A).addScaledVector(dir, Q0 + LQ * eOutQ(f / F1)); }
    else if (f < F2) {
      const u = (f - F1) / (F2 - F1), u2 = u * u, u3 = u2 * u, th = alpha * Math.cos(Math.PI * u);
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2, r = Q0 + LQ - L / 2;
      c1.copy(A).addScaledVector(h, ca * r); c1.y += sa * r; c2.copy(B).addScaledVector(h, -ca * r); c2.y += sa * r;
      tip.copy(c1).multiplyScalar(h00).addScaledVector(c2, h01).addScaledVector(h, (h10 + h11) * KK * ca); tip.y += (h10 - h11) * KK * sa;
      dir.copy(h).multiplyScalar(Math.cos(th)).setY(Math.sin(th)); tip.addScaledVector(dir, L / 2);
    } else { const u = (f - F2) / (F3 - F2); dir.copy(h).multiplyScalar(ca).setY(-sa); tip.copy(B).addScaledVector(dir, Q0 + LQ * (u < 1 ? eInQ(u) : 1 + (u - 1) * 0.4)); }
    return f;
  }
  return { pose, fEyeOut, fEyeIn, fEntry: F2 + (F3 - F2) * solve(eInQ, -Q0 / LQ), fExit: F1 * solve(eOutQ, -Q0 / LQ) };
}

// ---------- the shadows of what hangs overhead, for any cloth shader that has uSunDir: the gathering knot (uKnot), the strand
// from the needle's eye up to it (uSup: its four control points) and the strands the hills feed it (uFeed: where each leaves
// its hill, w = how strongly it is there). overheadShadow(p, y): 0..1 at the cloth point (p = xz, y = its height)
export const OVERHEAD_GLSL = /* glsl */`
  uniform vec3 uKnot; uniform vec3 uSup[4]; uniform vec4 uFeed[8];
  float strandSh(vec2 p, vec3 a, vec3 b, float y, float w){
    float sy = max(uSunDir.y, 0.15);
    vec2 sa = a.xz - uSunDir.xz * max(a.y - y, 0.) / sy, sb = b.xz - uSunDir.xz * max(b.y - y, 0.) / sy, ab = sb - sa;
    float t = clamp(dot(p - sa, ab) / max(dot(ab, ab), 1e-3), 0., 1.), h = max(mix(a.y, b.y, t) - y, 0.), soft = w + h * 0.018;
    return (1. - smoothstep(soft * 0.35, soft * 1.5, length(p - (sa + ab * t)))) / (1. + h * 0.004);
  }
  float overheadShadow(vec2 p, float y){
    float s = 0.; vec3 b0 = uSup[0];
    for (int i = 1; i <= 5; i++) { float t = float(i) / 5., k = 1. - t;
      vec3 b1 = k * k * k * uSup[0] + 3. * k * k * t * uSup[1] + 3. * k * t * t * uSup[2] + t * t * t * uSup[3]; s = max(s, strandSh(p, b0, b1, y, 2.0)); b0 = b1; }
    for (int i = 0; i < 8; i++) { if (uFeed[i].w <= 0.) continue; s = max(s, strandSh(p, uFeed[i].xyz, uKnot, y, 1.3) * uFeed[i].w); }
    float hk = max(uKnot.y - y, 0.), kr = 5. + hk * 0.018;
    vec2 ks = uKnot.xz - uSunDir.xz * hk / max(uSunDir.y, 0.15);
    return max(s, (1. - smoothstep(kr * 0.5, kr * 1.6, length(p - ks))) / (1. + hk * 0.004));
  }`;

// ---------- linen + satin-field material (cloth disc and unravelling mounds share it) ----------
function makeLinenMaterial(U, NF) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), uRip: U.uRip, uTime: U.uTime, uSunDir: U.uSunDir, uSun: U.uSun, uAmb: U.uAmb, uShade: U.uShade, uLinen: U.uLinen, uPencil: U.uPencil,
      uCrimson: U.uCrimson, uPal: U.uPal, uSeed: U.uSeed, uSeedB: U.uSeedB, uNe0: U.uNe0, uNe1: U.uNe1, uRowW: U.uRowW, uSt: U.uSt, uStW: U.uStW, uKnot: U.uKnot, uSup: U.uSup, uFeed: U.uFeed },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      attribute float aField;
      varying vec3 vW; varying vec3 vN; varying float vField; varying float vRip;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.);
        float h = ripple(w.xz), e = 3.;
        float hx = ripple(w.xz + vec2(e, 0.)), hz = ripple(w.xz + vec2(0., e));
        w.y += h; vRip = h;
        vN = normalize(normalize(mat3(modelMatrix) * normal) + vec3(h - hx, 0., h - hz) / e);
        vW = w.xyz; vField = aField;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define NF ${NF}
      ${GLSL_COMMON}
      uniform float uTime, uRowW, uFade;
      uniform vec3 uSunDir, uSun, uAmb, uShade, uLinen, uPencil, uCrimson, uNe0, uNe1;
      uniform vec3 uPal[6]; uniform vec4 uSeed[NF]; uniform vec4 uSeedB[NF]; uniform vec4 uSt[6]; uniform float uStW[6];
      varying vec3 vW; varying vec3 vN; varying float vField; varying float vRip;
      #include <fog_pars_fragment>
      ${OVERHEAD_GLSL}
      float segShadow(vec2 p){                    // soft shadow of the needle on the cloth
        vec3 a = uNe0, b = uNe1; if (a.y < 0. && b.y < 0.) return 0.;
        vec2 sa = a.xz - uSunDir.xz * (a.y - vW.y) / uSunDir.y, sb = b.xz - uSunDir.xz * (b.y - vW.y) / uSunDir.y;
        vec2 ab = sb - sa; float t = clamp(dot(p - sa, ab) / max(dot(ab, ab), 1e-3), 0., 1.);
        float hgt = mix(a.y, b.y, t) - vW.y; if (hgt < 0.) return 0.;
        float soft = 1.2 + hgt * 0.07, d = length(p - (sa + ab * t));
        return (1. - smoothstep(1.4 - soft * .3, 1.4 + soft, d)) * (1. / (1. + hgt * 0.018));
      }
      void main(){
        vec2 p = vW.xz; vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        // ---- linen: over-under weave near, slubby streaks far
        vec2 uv = p / 0.3; vec2 fw = fwidth(uv); float wf = 1. - smoothstep(0.2, 0.7, max(fw.x, fw.y));
        float chk = mod(floor(uv.x) + floor(uv.y), 2.);
        float warpT = abs(sin(3.14159 * uv.x)), weftT = abs(sin(3.14159 * uv.y));
        float weave = mix(warpT * (0.75 + 0.25 * weftT), weftT * (0.75 + 0.25 * warpT), chk);
        float slub = vnoise(vec2(p.x * 0.9, p.y * 0.035)) * 0.5 + vnoise(vec2(p.x * 0.03, p.y * 1.1)) * 0.5;
        float mott = vnoise(p * 0.021) * 0.6 + vnoise(p * 0.11) * 0.4;
        vec3 alb = uLinen * (0.9 + 0.1 * slub) * (0.93 + 0.1 * mott);
        alb *= mix(1., 0.7 + 0.42 * weave, wf);
        N = normalize(N + vec3(vnoise(p * 0.06) - .5, 0., vnoise(p * 0.06 + 31.7) - .5) * 0.22);
        // ---- pencil ghost of the unpicked design + empty needle holes
        vec2 gp = p / 62.; vec2 gi = floor(gp), gf = fract(gp); float d1 = 9., d2 = 9.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y));
          vec2 c = o + vec2(hash21(gi + o), hash21(gi + o + 17.3)) * 0.8 + 0.1; float d = length(c - gf);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        float edge = (d2 - d1) * 62.;
        float dash = step(0.35, fract((p.x + p.y) * 0.11));
        float pencil = (1. - smoothstep(0.35, 1.1, edge)) * dash * 0.5 * (1. - vField);
        vec2 hp = p / 2.2; vec2 hc = fract(hp) - .5; float holeRow = step(0.8, vnoise(floor(hp.yy * 0.25 + gi * 7.) + 3.));
        float hole = (1. - smoothstep(0.08, 0.2, length(hc))) * step(0.5, hash21(floor(hp) + gi)) * (1. - smoothstep(0.03, 0.12, max(fwidth(hp.x), fwidth(hp.y))));
        float spec = 0.; vec3 specCol = vec3(1.);
        // ---- satin fields on the mounds, unravelled row by row
        if (vField > 0.5) {
          float b1 = 1e9, b2 = 1e9; vec4 sd = uSeed[0], sb = uSeedB[0];
          for (int i = 0; i < NF; i++) { float d = distance(p, uSeed[i].xy) / max(uSeedB[i].z, 0.01); if (d < b1) { b2 = b1; b1 = d; sd = uSeed[i]; sb = uSeedB[i]; } else if (d < b2) b2 = d; }
          float fe = (b2 - b1) * 0.5;                                   // metres-ish to the field border
          vec2 dir = vec2(cos(sd.z), sin(sd.z)), prp = vec2(-dir.y, dir.x), q = p - sd.xy;
          float u = dot(q, dir), v = dot(q, prp), Rf = sb.x, rows = floor(2. * Rf / uRowW);
          float ri = clamp(floor((Rf - v) / uRowW), 0., rows - 1.);
          float cur = sb.y * rows, uu = clamp(u / (2. * Rf) + .5, 0., 1.); if (mod(ri, 2.) > .5) uu = 1. - uu;
          float st = (sb.y <= 0.) ? 1. : ((ri > floor(cur)) ? 1. : ((ri == floor(cur)) ? step(fract(cur), uu) : 0.));
          float lifting = (ri == floor(cur) && sb.y > 0.) ? (1. - smoothstep(0., 0.12, uu - fract(cur))) * st : 0.;
          // linen under the field: dotted needle holes along each row, blue pencil outline
          float rv = fract((Rf - v) / uRowW), ru = fract(u / 1.1);
          float fwv = fwidth(v / uRowW);
          float dots = (1. - smoothstep(0.05, 0.16, length(vec2(rv - .5, (ru - .5) * 0.5)))) * (1. - smoothstep(0.1, 0.4, fwv));
          vec3 bare = alb * vec3(0.95, 0.91, 0.86) * (1. - 0.5 * dots) * (0.88 + 0.12 * smoothstep(0.08, 0.2, abs(rv - .5)) * (1. - smoothstep(0.25, 0.8, fwv)) + 0.12 * smoothstep(0.25, 0.8, fwv));
          bare = mix(bare, uPencil, (1. - smoothstep(0.5, 1.6, fe)) * 0.75);
          { // what a pulled-out field leaves on the hill: the ghost of its dye in the cloth, soft gathers where the cloth has lost
            // its stitches, and the tacking that still holds it to its form: a running stitch of the field's thread round every 5 m of height
            vec3 dye = uPal[int(sd.w)]; float qa = atan(q.y, q.x + 1e-5), ql = max(length(q), 6.);
            bare = mix(bare, bare * (0.5 + 0.95 * dye), 0.34);
            bare *= 0.93 + 0.07 * sin(qa * 9. + vnoise(p * 0.07) * 5.);
            float cb = vW.y / 5., cf = fwidth(cb) + 1e-4;
            float tack = (1. - smoothstep(0.03, 0.03 + cf * 1.5, abs(fract(cb) - .5))) * step(0.42, fract(qa * ql / 3.4)) * (1. - smoothstep(0.2, 0.5, cf));
            bare = mix(bare, mix(dye, uCrimson, 0.45) * 0.72, tack * 0.85);
          }
          // satin: one colour per field, each row a slightly different dye lot, floss stripes along the stitch
          float wave = sin(dot(p, vec2(0.05, 0.031)) - uTime * 0.9) * 0.5 + 0.5;       // sheen wave, like wind over a crop
          vec3 fc = uPal[int(sd.w)]; float rh = hash21(vec2(ri, sd.w * 7.1 + sd.x));
          fc *= 0.8 + 0.34 * rh; fc *= 0.9 + 0.2 * wave;
          float rowB = 0.5 + 0.5 * cos(6.2832 * rv); float rf = 1. - smoothstep(0.15, 0.6, fwv);
          fc *= mix(1., 0.72 + 0.36 * rowB, rf);
          fc *= 0.94 + 0.06 * vnoise(vec2(u * 0.5, v * 6.));
          vec3 T = normalize(vec3(dir.x, 0., dir.y) + N * 0.0); T = normalize(T - N * dot(T, N));
          vec3 Hh = normalize(uSunDir + V); float th = dot(normalize(T + N * (wave - .5) * 0.5), Hh);
          float kk = pow(sqrt(max(1. - th * th, 0.)), 70.);
          float hedge = (1. - smoothstep(1.0, 2.4, fe + sin(u * 2.2) * 0.5));
          vec3 hedgeCol = uPal[1] * vec3(0.32, 0.5, 0.3);
          vec3 sat = mix(fc, hedgeCol, hedge * 0.85);
          sat = mix(sat, sat * 1.25 + 0.05, lifting);
          alb = mix(bare, sat, st);
          spec = st * (1. - hedge) * kk * (0.1 + 0.3 * wave); specCol = mix(vec3(1.), fc, 0.7) * 1.2;
          N = normalize(N + vec3(prp.x, 0., prp.y) * (rv - .5) * 0.5 * rf * st);
          hole = 0.; pencil = 0.;
        }
        alb = mix(alb, uPencil, pencil); alb *= 1. - 0.5 * hole;
        // ---- light: broad soft window key, lavender shade, pucker shading where the needle has pierced
        float nl = dot(N, uSunDir); float dif = smoothstep(-0.35, 0.95, nl);
        float sh = segShadow(p) * 0.6;
        float puck = clamp(-vRip * 0.16, 0., 0.5);
        float st2 = 0.;
        for (int i = 0; i < 6; i++) { vec4 sg = uSt[i]; if (uStW[i] <= 0.) continue; vec2 ab = sg.zw - sg.xy, pq = p + uSunDir.xz * 0.9 - sg.xy;
          float t = clamp(dot(pq, ab) / max(dot(ab, ab), 1e-3), 0., 1.); st2 = max(st2, (1. - smoothstep(0.4, 3.2, length(pq - ab * t))) * uStW[i]); }
        sh = max(sh, st2 * 0.5 * (1. - vField));
        sh = max(sh, overheadShadow(p, vW.y) * 0.8);
        vec3 light = uShade * (0.5 + 0.2 * N.y) + uSun * dif * (1. - sh);
        light = mix(light, uShade * 0.45, puck);
        float fres = pow(1. - max(dot(N, V), 0.), 3.);
        vec3 col = alb * light + alb * fres * 0.12 * uSun + specCol * spec * uSun * (1. - sh);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the needle: crown, two-strand eye, shaft, long ogive point (local +Y from crown to tip) ----------
function makeNeedleGeometry(rng) {
  const rings = (n, f) => { const r = []; for (let i = 0; i <= n; i++) r.push(f(i / n)); return r; };
  const eyeA = 2.0, eyeB = 11.4, L = NEEDLE_LEN, rS = 1.6;
  const parts = [];
  // crown: a squashed capsule
  parts.push(sweep(rings(10, (t) => { const y = -0.1 + t * 3.1, k = Math.sqrt(Math.max(1e-4, 1 - Math.pow(Math.abs(t * 2 - 1), 2.6))); return [y, 0, 2.05 * k, 1.12 * k]; }), 24));
  // the eye: two cheeks bowing apart round a slot 1.9 m wide
  for (const sgn of [-1, 1]) parts.push(sweep(rings(18, (t) => {
    const y = lerp(eyeA - 0.9, eyeB + 1.2, t), e = Math.pow(Math.sin(Math.PI * clamp((y - eyeA + 1.2) / (eyeB - eyeA + 2.4), 0, 1)), 0.55);
    return [y, sgn * (0.5 + 0.98 * e), 0.62 - 0.1 * e, 1.1 + 0.05 * e];
  }), 14));
  // shaft and point; flat by the eye, round by 18 m, the faintest waist, then a 38 m ogive to a needle-sharp tip
  parts.push(sweep(rings(64, (t) => {
    const y = t < 0.25 ? lerp(eyeB - 1.2, 22, t / 0.25) : lerp(22, L, Math.pow((t - 0.25) / 0.75, 0.85));
    const cap = smoothstep(eyeB - 1.25, eyeB + 0.6, y), fl = 1 - smoothstep(eyeB, 19, y);
    const tp = smoothstep(L - 40, L, y), og = Math.sqrt(Math.max(0, 1 - Math.pow(tp, 1.7))) * (1 - 0.25 * tp);
    const r = (rS - 0.22 * smoothstep(20, 80, y)) * Math.max(og, 0.004);
    return [y, 0, r * (1 + 0.28 * fl) * (0.25 + 0.75 * cap), r * (1 - 0.3 * fl) * (0.25 + 0.75 * cap)];
  }), 24));
  const g = mergeGeos(parts); g.deleteAttribute('color');
  return g;
}
function makeNeedleMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), uSunDir: U.uSunDir, uLinen: U.uLinen, uPal: U.uPal, uCrimson: U.uCrimson, uFlash: U.uFlash, uButton: U.uButton, uCut: U.uCut, uWide: U.uWide, uRim: U.uRim },
    vertexShader: /* glsl */`
      uniform float uWide;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vAx;
      #include <fog_pars_vertex>
      void main(){
        vL = position; vLN = normal;
        vec3 lp = position;
        vAx = normalize(mat3(modelMatrix) * vec3(0., 1., 0.));
        if (position.y > -100.) {                                      // the needle (not the safety pin that shares this steel): never a hairline
          vec4 c0 = modelMatrix * vec4(0., position.y, 0., 1.);
          lp.xz *= max(1., distance(cameraPosition, c0.xyz) * uWide);
        }
        vec4 w = modelMatrix * vec4(lp, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uLinen, uCrimson, uButton; uniform vec3 uPal[6]; uniform float uFlash, uCut, uRim;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN; varying vec3 vAx;
      #include <fog_pars_fragment>
      float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
      // the tiny world the chrome mirrors: bright linen sky with a pearl-button sun, a patchwork ground, a crimson line
      vec3 env(vec3 r){
        float su = dot(r, uSunDir);
        // sky: bright only high up and toward the window, falling to a dark band at the horizon (mirror banding)
        vec3 sky = uLinen * mix(0.12, 0.86, smoothstep(0.16, 0.9, r.y * 0.6 + su * 0.5));
        sky *= mix(0.24, 1., smoothstep(-0.3, 0.2, sin(atan(r.z, r.x + 1e-5) * 2. + 0.6)));           // the window's dark piers: light and dark bands down the barrel whichever way it leans
        sky += uButton * (smoothstep(0.972, 0.99, su) * 3.2 + pow(max(su, 0.), 900.) * 26.);
        float az = atan(r.z, r.x + 1e-5), band = floor(az * 2.2 + n1(r.y * 3.) * 1.2);
        vec3 patchC = uPal[int(mod(band, 5.))];
        vec3 gnd = mix(patchC * 0.2, uLinen * 0.12, smoothstep(-0.05, -0.9, r.y));
        gnd = mix(gnd, patchC * 0.75, (1. - smoothstep(0.03, 0.1, abs(r.y + 0.34 + 0.05 * sin(az * 3.)))) * 0.8);          // a streak of field colour
        gnd = mix(gnd, uCrimson * 1.05, (1. - smoothstep(0.04, 0.11, abs(r.y + 0.16 + 0.04 * sin(az * 2. + 1.)))) * 0.9);  // and of the crimson road
        vec3 e = mix(gnd, sky, smoothstep(-0.03, 0.03, r.y + 0.02 * sin(az * 9.)));
        return mix(e, vec3(0.05, 0.05, 0.08), 0.86 * exp(-r.y * r.y * 16.));
      }
      void main(){
        if (vW.y < uCut) discard;
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        // lengthwise polishing lines and the long thread groove under the eye
        float ang = atan(vLN.z, vLN.x);
        float brush = n1(ang * 40.) * 0.5 + n1(ang * 140. + vL.y * 0.05) * 0.5;
        float groove = (1. - smoothstep(0.25, 0.5, abs(vL.x))) * smoothstep(11.5, 13.5, vL.y) * (1. - smoothstep(26., 34., vL.y)) * step(0.5, abs(vLN.z));
        N = normalize(N + (brush - .5) * 0.05 * normalize(cross(N, vec3(0., 1., 0.) + 1e-3)) - N * groove * 0.25);
        vec3 R = reflect(-V, N);
        float fres = pow(1. - max(dot(N, V), 0.), 4.);
        vec3 col = env(R) * mix(vec3(0.6, 0.67, 0.82), vec3(1.), fres);
        // studio banding round the barrel: a dark core stripe beside the highlight, so it reads as a mirror at any distance
        float fc = max(dot(N, V), 0.);
        float prof = mix(0.2, 1., smoothstep(0.52, 0.86, fc));                        // dark flanks either side of a bright core
        col *= mix(prof, uRim, 1. - smoothstep(0.04, 0.24, fc));                      // and a thin rim at the very edge (lighter by default; dark draws the needle's outline on a pale sky)
        col *= 1. - 0.35 * groove;
        col *= 0.96 + 0.04 * n1(vL.y * 1.7 + ang * 3.);
        // lines of light running the length of the barrel: work across the axis so they never slide off the end
        vec3 ax = normalize(vAx);
        vec3 sP = uSunDir - ax * dot(uSunDir, ax); sP = normalize(sP + ax * 1e-4);
        vec3 vP = V - ax * dot(V, ax); vP = normalize(vP + sP * 1e-3);
        vec3 hP = normalize(sP + vP + ax * 1e-4);
        float air = smoothstep(-0.12, 0.1, uFlash) * (1. - smoothstep(0.9, 1.12, uFlash));
        float isNeedle = step(-100., vL.y);
        float lit = smoothstep(0.45, 0.95, dot(N, hP));
        float fy = (vL.y - uFlash * 150. + 15.) / 9.;
        col += uButton * lit * exp(-fy * fy) * 5.5;                                   // the button sun flashing down the needle during the hang
        float hl = pow(max(dot(N, hP), 0.), 40.);                                     // standing highlight toward the viewer
        float gl = pow(max(dot(N, sP), 0.), 26.);                                     // sun glint on the lit flank, whoever is looking
        col += uButton * (hl * (1.7 + 2.6 * air * isNeedle) + gl * (0.7 + 3.2 * air) * isNeedle + fres * 0.3);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- threads: one instanced tube, each instance a cubic Bezier updated on the CPU ----------
const SEGS = 56, RAD = 7;
function makeStrandGeometry(count) {
  const tt = [], idx = [];
  for (let i = 0; i <= SEGS; i++) for (let j = 0; j < RAD; j++) tt.push(i / SEGS, (j / RAD) * TAU, 0);
  for (let i = 0; i < SEGS; i++) for (let j = 0; j < RAD; j++) {
    const a = i * RAD + j, b = i * RAD + (j + 1) % RAD, c = a + RAD, d = b + RAD; idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tt, 3)); g.setIndex(idx);
  const mk = (n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(count * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
  for (const [name, n] of [['iP0', 3], ['iP1', 3], ['iP2', 3], ['iP3', 3], ['iA', 4], ['iB', 4], ['iC0', 3]]) g.setAttribute(name, mk(n));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
function makeStrandMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), uRip: U.uRip, uTime: U.uTime, uS: U.uS, uSunDir: U.uSunDir, uSun: U.uSun, uAmb: U.uAmb, uCrimson: U.uCrimson, uTwist: U.uTwist },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      attribute vec3 iP0, iP1, iP2, iP3, iC0; attribute vec4 iA, iB;   // iA: radius, slack wiggle, crimp, whip   iB: length, ramp end (t), ride, phase
      uniform float uTime, uS; uniform vec3 uCrimson;
      varying vec3 vW; varying vec3 vN; varying vec3 vT; varying vec3 vCol; varying vec2 vUV; varying float vLen, vPly;
      #include <fog_pars_vertex>
      vec3 curve(float t){
        float k = 1. - t; vec3 c = k * k * k * iP0 + 3. * k * k * t * iP1 + 3. * k * t * t * iP2 + t * t * t * iP3;
        vec3 ch = iP3 - iP0; vec3 sd = normalize(vec3(-ch.z, 0., ch.x) + vec3(1e-4, 0., 0.));
        float env = sin(3.14159 * t);
        c += sd * sin(t * 31.4 + iB.w) * iA.y * env + vec3(0., 1., 0.) * abs(sin(t * 18.8 + iB.w * 1.7)) * iA.y * 0.6 * env;   // slack loops
        c.y += sin(t * iB.x * 1.9) * iA.z * (1. - t) * smoothstep(0., .04, t);                                               // crimp from the old stitches
        c += (sd * sin(t * 11. - uS * 6.2832 * 2.) + vec3(0., 1., 0.) * cos(t * 8. - uS * 6.2832 * 2.)) * iA.w * env;         // whip wave from the leap
        c.y += ripple(c.xz) * iB.z * (1. - smoothstep(1., 9., c.y));
        return c;
      }
      void main(){
        float t = position.x, a = position.y;
        vec3 c = curve(t), tg = normalize(curve(t + 0.012) - curve(t - 0.012));
        vec3 sd = normalize(cross(tg, vec3(0., 1., 0.)) + vec3(1e-3, 0., 1e-3)); vec3 up = cross(sd, tg);
        vec4 wc = modelMatrix * vec4(c, 1.);
        float r = max(iA.x, distance(cameraPosition, wc.xyz) * 0.0023) * step(1e-4, iA.x);
        vec3 n = cos(a) * sd + sin(a) * up;
        vec4 w = modelMatrix * vec4(c + n * r, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vT = normalize(mat3(modelMatrix) * tg);
        vUV = vec2(t, a); vLen = iB.x / max(r, 0.05) * (iB.w < 0. ? 2.2 : 1.); vPly = iB.w < 0. ? 1. : 0.;
        vCol = mix(iC0, uCrimson, smoothstep(iB.y * 0.6, iB.y * 1.6 + 1e-3, t));
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSun, uAmb, uCrimson; uniform float uTwist;
      varying vec3 vW; varying vec3 vN; varying vec3 vT; varying vec3 vCol; varying vec2 vUV; varying float vLen, vPly;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN), T = normalize(vT), V = normalize(cameraPosition - vW);
        // three-ply twist: grooves spiral round the strand, fading to plain sheen when they get too fine
        float tw = vUV.x * vLen * 0.11 * uTwist + vUV.y * 3. / 6.2832;
        float fwv = fwidth(vUV.x * vLen * 0.11 * uTwist); float tf = 1. - smoothstep(0.15, 0.5, fwv);
        float ply = abs(sin(3.14159 * tw));
        vec3 alb = vCol * mix(1., mix(0.5, 0.26, vPly) + mix(0.62, 0.9, vPly) * ply, tf);
        N = normalize(N + T * (ply - 0.5) * 0.5 * tf * vPly);                 // each ply is a round of its own
        alb *= 0.9 + 0.2 * fract(sin(floor(tw) * 91.7) * 43758.5);
        float dif = mix(smoothstep(-0.5, 0.9, dot(N, uSunDir)), smoothstep(-0.15, 0.9, dot(N, uSunDir)) * (0.55 + 0.45 * N.y), vPly);
        vec3 Hh = normalize(uSunDir + V); float th = dot(T, Hh);
        float kk = pow(sqrt(max(1. - th * th, 0.)), 34.) * smoothstep(-0.2, 0.5, dot(N, Hh));
        float rim = pow(1. - max(dot(N, V), 0.), 2.2);                       // fibre fuzz
        vec3 col = alb * (uAmb * 1.1 + uSun * dif) + (alb * 0.9 + 0.12) * rim * 0.42 * uSun + mix(vec3(1.), alb, 0.5) * kk * 0.55 * uSun;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- French knots, pom-pom trees and tassels on the mounds; they pop off as their row is pulled ----------
function makeKnotMaterial(U, NF) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...FOG_U(), uRip: U.uRip, uTime: U.uTime, uSunDir: U.uSunDir, uSun: U.uSun, uAmb: U.uAmb, uSeedB: U.uSeedB },
    vertexShader: /* glsl */`
      #define NF ${NF}
      ${GLSL_COMMON}
      attribute vec4 iK;        // field index, row threshold 0..1, wobble phase, stem height
      attribute vec3 iCol;
      uniform float uTime; uniform vec4 uSeedB[NF];
      varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying float vAO;
      #include <fog_pars_vertex>
      void main(){
        float prog = uSeedB[int(iK.x)].y;
        float gone = smoothstep(iK.y - 0.03, iK.y + 0.005, prog) * step(1e-4, prog);
        float pop = (1. - gone) * (1. + 2.2 * gone * (1. - gone) * 1.6);          // swell, then nothing
        vec4 o = instanceMatrix * vec4(0., 0., 0., 1.);
        vec3 lp = mat3(instanceMatrix) * position * pop;
        float wob = sin(uTime * 1.7 + iK.z) * 0.08 * iK.w;                         // pom-poms wobble on their stems
        vec4 w = modelMatrix * vec4(o.xyz + lp + vec3(wob, iK.w * (pop > 0.01 ? 1. : 0.) + gone * 6., wob * 0.6), 1.);
        w.y += ripple(w.xz);
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vCol = iCol; vW = w.xyz; vAO = 0.62 + 0.38 * smoothstep(-0.6, 0.7, position.y);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSun, uAmb;
      varying vec3 vN; varying vec3 vCol; varying vec3 vW; varying float vAO;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float dif = smoothstep(-0.4, 0.9, dot(N, uSunDir)), rim = pow(1. - max(dot(N, V), 0.), 2.);
        float fib = 0.9 + 0.1 * sin(vW.y * 9. + vW.x * 7.);
        vec3 col = vCol * fib * vAO * (uAmb * 1.1 + uSun * dif) + vCol * rim * 0.35 * uSun;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- the standing embroidery hoop (hole axis = local Z, centre at the origin) ----------
async function makeHoopGeometry(rng, C, legDrop, pause) {
  const parts = [], wood = C.wood, brass = C.brass;
  const ringProfile = (r0, r1, hz, bev) => { const p = []; const cs = [[r0 + bev, -hz], [r1 - bev, -hz], [r1, -hz + bev], [r1, hz - bev], [r1 - bev, hz], [r0 + bev, hz], [r0, hz - bev], [r0, -hz + bev], [r0 + bev, -hz]]; for (const c of cs) p.push(new THREE.Vector2(c[0], c[1])); return p; };
  const grain = (g, base) => { const n = g.attributes.position.count, c = new Float32Array(n * 3), P = g.attributes.position;
    for (let i = 0; i < n; i++) { const a = Math.atan2(P.getY(i), P.getX(i)), k = 0.86 + 0.14 * Math.sin(a * 37 + Math.sin(a * 5) * 3) + 0.08 * Math.sin(a * 131 + P.getZ(i) * 4); c[i * 3] = base.r * k; c[i * 3 + 1] = base.g * k * k; c[i * 3 + 2] = base.b * k * k; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; };
  const inner = new THREE.LatheGeometry(ringProfile(7.0, 7.85, 0.95, 0.16), 96).rotateX(Math.PI / 2);
  const outer = new THREE.LatheGeometry(ringProfile(7.95, 8.9, 0.75, 0.16), 96, Math.PI + 0.07, TAU - 0.14).rotateX(Math.PI / 2);
  parts.push(grain(inner, wood.clone().multiplyScalar(1.18)), grain(outer, wood.clone().multiplyScalar(0.82)));
  await pause();
  // linen caught between the rings, frilling out behind
  const skirt = new THREE.LatheGeometry([new THREE.Vector2(7.9, -0.2), new THREE.Vector2(8.7, -0.8), new THREE.Vector2(9.3, -1.0), new THREE.Vector2(9.9, -0.9)], 96).rotateX(Math.PI / 2);
  { const P = skirt.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), r = Math.hypot(x, y), a = Math.atan2(y, x), k = smoothstep(8.6, 9.9, r);
      P.setZ(i, P.getZ(i) + Math.sin(a * 23 + Math.sin(a * 3) * 2) * 0.25 * k); const rr = r + Math.sin(a * 11) * 0.22 * k; P.setXY(i, Math.cos(a) * rr, Math.sin(a) * rr); }
    skirt.computeVertexNormals(); parts.push(paint(skirt, C.cream.clone().multiply(new THREE.Color(0.6, 0.57, 0.64)), 0.06, rng)); }
  await pause();
  // brass tightening screw across the split at the top
  { const sp = [], hot = brass.clone().multiplyScalar(2.6);
    for (const sd of [-1, 1]) sp.push(paint(new THREE.BoxGeometry(0.7, 2.0, 1.3).translate(sd * 0.8, 9.3, 0), hot, 0.08, rng));
    sp.push(paint(new THREE.CylinderGeometry(0.3, 0.3, 5.4, 10).rotateZ(Math.PI / 2).translate(0.4, 9.7, 0), hot.clone().multiplyScalar(0.8)));
    sp.push(paint(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 8).rotateZ(Math.PI / 2).translate(-1.7, 9.7, 0), hot));
    sp.push(paint(new THREE.CylinderGeometry(1.1, 0.9, 0.55, 12).rotateZ(Math.PI / 2).translate(3.0, 9.7, 0), hot));
    sp.push(paint(new THREE.BoxGeometry(0.45, 2.9, 0.75).translate(3.45, 9.7, 0), hot.clone().multiplyScalar(1.15)));
    parts.push(...sp); }
  // turned trestle legs when the hoop stands clear of the cloth
  if (legDrop > 0.3) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(sx * 4.9, -6.6, sz * 0.2), b = new THREE.Vector3(sx * 6.4, -8.3 - legDrop - 1.5, sz * 3.2), len = a.distanceTo(b);
    const leg = sweep([[0, 0, 0.3, 0.3], [0.3, 0, 0.42, 0.42], [len * 0.2, 0, 0.36, 0.36], [len * 0.25, 0, 0.5, 0.5], [len * 0.3, 0, 0.38, 0.38], [len * 0.85, 0, 0.5, 0.5], [len * 0.9, 0, 0.68, 0.68], [len, 0, 0.6, 0.6]], 10);
    leg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())).translate(a.x, a.y, a.z);
    parts.push(paint(leg, wood.clone().multiplyScalar(0.9), 0.1, rng));
  }
  await pause();
  return mergeGeos(parts);
}

// =====================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('stitched-hero') : ctx.rng;
  const palHex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const [cLinen, cCream, cBlue, cGreen, cGold, cBrown, cCrimson] = pal;
  const hueShift = rng.range(-0.025, 0.025);
  const fieldCols = [cGreen.clone(), cGold.clone(), cBlue.clone(), cGreen.clone().multiplyScalar(opts.darkField ?? 0.8), cGreen.clone().lerp(cGold, 0.45), cGold.clone().lerp(cBrown, 0.45).lerp(cCrimson, rng.range(0.05, 0.2))];
  for (const c of fieldCols) c.offsetHSL(hueShift, 0.04, -0.02);
  rng.shuffle(fieldCols);
  const period = opts.period ?? 3, alpha = THREE.MathUtils.degToRad(opts.angle ?? rng.range(49, 55));
  const sunDir = new THREE.Vector3(...(opts.lightDir || [-0.6, 0.7, 0.4])).normalize();

  // ---- the road the needle sews. Default: a ring of four stitches round the origin, sewn for ever.
  const ring = !opts.road, Rr = (4 * PITCH) / TAU, sgn = ring && rng.chance(0.5) ? -1 : 1;
  const hoopAhead = SEW - 7;
  const a0 = rng.range(-0.45, 0.45) - sgn * hoopAhead / Rr;
  const road = ring ? (d, out) => { const a = a0 + sgn * d / Rr; return out.set(Math.sin(a) * Rr, 0, Math.cos(a) * Rr); } : opts.road;
  const lap = ring ? 4 : Infinity;
  const nStitch = ring ? 4 : Math.max(1, Math.floor((opts.roadLength ?? 1400) / PITCH));
  const hoopStitch = ring ? 0 : (opts.hoopStitch ?? nStitch - 1);
  const keep = opts.keep ?? (ring ? 2.75 : Infinity);                   // stitches older than this are unpicked
  const K = makeKinematics(road, alpha);
  const startS = opts.startPhase ?? rng.range(0, 4);

  // ---- uniforms shared by every material
  const U = {
    uRip: { value: Array.from({ length: NRIP }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uTime: { value: 0 }, uS: { value: 0 }, uSunDir: { value: sunDir },
    uSun: { value: new THREE.Color(1.0, 0.94, 0.84).multiplyScalar(0.62) }, uAmb: { value: new THREE.Color(0.5, 0.49, 0.5) }, uShade: { value: new THREE.Color(0.66, 0.62, 0.72) },
    uLinen: { value: cLinen.clone() }, uPencil: { value: cBlue.clone().multiplyScalar(0.9) }, uCrimson: { value: cCrimson.clone() },
    uPal: { value: fieldCols }, uSeed: { value: [] }, uSeedB: { value: [] }, uNe0: { value: new THREE.Vector3(0, -10, 0) }, uNe1: { value: new THREE.Vector3(0, -10, 0) },
    uKnot: { value: new THREE.Vector3(0, -1e3, 0) }, uSup: { value: Array.from({ length: 4 }, () => new THREE.Vector3(0, -1e3, 0)) }, uFeed: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    uRowW: { value: 2.2 }, uSt: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) }, uStW: { value: [0, 0, 0, 0, 0, 0] }, uFlash: { value: -1 }, uButton: { value: new THREE.Color(1.0, 0.93, 0.86) }, uCut: { value: opts.needleCutY ?? -1e5 },
    uTwist: { value: rng.range(0.85, 1.25) }, uWide: { value: opts.needleWiden ?? 0.0062 }, uRim: { value: opts.needleRim ?? 0.62 },
  };

  // ---- mounds: hills of satin fields that are pulled out row by row to feed the thread
  const mounds = opts.mounds ?? [{ x: 0, z: 0, r: 78, h: rng.range(28, 38) }];
  const perMound = mounds.length ? (mounds.length === 1 ? rng.int(6, 8) : Math.max(3, Math.floor(12 / mounds.length))) : 0;
  const NF = Math.max(1, mounds.length * perMound), fields = [];
  for (const m of mounds) {
    const ph = rng.range(0, TAU);
    for (let k = 0; k < perMound; k++) {
      const c = k === 0, a = ph + (k / (perMound - 1)) * TAU + rng.range(-0.25, 0.25), rr = c ? m.r * rng.range(0, 0.12) : m.r * rng.range(0.56, 0.68);
      fields.push({ x: m.x + Math.cos(a) * rr, z: m.z + Math.sin(a) * rr, ang: rng.range(0, Math.PI), col: (fields.length + (c ? 3 : 0)) % 6, Rf: m.r * (c ? 0.3 : 0.34), order: 0, prog: 0, m });
    }
  }
  const order = rng.shuffle(fields.map((_, i) => i)); order.forEach((fi, o) => { fields[fi].order = o / Math.max(1, fields.length); });
  if (opts.fieldOrder) for (const f of fields) f.order = clamp(opts.fieldOrder(f.x, f.z), -0.5, 1);     // the world decides which field goes first
  while (fields.length < NF) fields.push({ x: 1e6, z: 1e6, ang: 0, col: 0, Rf: 1, order: 0, prog: 0, m: null });
  U.uSeed.value = fields.map((f) => new THREE.Vector4(f.x, f.z, f.ang, f.col));
  U.uSeedB.value = fields.map((f) => new THREE.Vector4(f.Rf, 0, 1, 0));
  const hgt = (x, z) => { let h = 0; for (const m of mounds) { const q = Math.hypot(x - m.x, z - m.z) / m.r; if (q < 1) { const k = Math.pow(1 - q * q, 1.35); h += m.h * k * (1 + 0.16 * ctx.noise.fbm2(x * 0.02 + 7, z * 0.02, 3)) + 0.4 * smoothstep(1, 0.9, q); } } return h; };
  const fieldAt = (x, z) => { let b = 0, bd = 1e9; for (let i = 0; i < fields.length; i++) { const d = Math.hypot(x - fields[i].x, z - fields[i].z); if (d < bd) { bd = d; b = i; } } return b; };

  const object = new THREE.Group(); object.name = 'stitched-country-hero';
  await ctx.yield();
  const linenMat = makeLinenMaterial(U, NF);

  // cloth disc (the world may switch it off and drive its own linen with hero.uniforms.uRip)
  const clothR = opts.clothRadius ?? 420;
  if (opts.cloth !== false) {
    const NR = 70, NS = 144, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) { const r = clothR * Math.pow(i / NR, 1.55); for (let j = 0; j < NS; j++) { const a = (j / NS) * TAU; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const nor = new Float32Array(pos.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aField', new THREE.BufferAttribute(new Float32Array(pos.length / 3), 1)); g.setIndex(idx);
    const cloth = new THREE.Mesh(g, linenMat); cloth.name = 'linen'; cloth.frustumCulled = false; object.add(cloth);
  }
  await ctx.yield();
  for (const m of mounds) {
    const NR = opts.moundRings ?? 40, NS = opts.moundSegs ?? 96, pos = [], nor = [], idx = [], e = 0.8;
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NS; j++) {
      if (j === 0) await ctx.yield();
      const r = m.r * (i / NR), a = (j / NS) * TAU, x = m.x + Math.cos(a) * r, z = m.z + Math.sin(a) * r, sink = i === NR ? -0.5 : 0;
      pos.push(x, hgt(x, z) + sink, z);
      const n = new THREE.Vector3(hgt(x - e, z) - hgt(x + e, z), 2 * e, hgt(x, z - e) - hgt(x, z + e)).normalize(); nor.push(n.x, n.y, n.z);
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aField', new THREE.BufferAttribute(new Float32Array(pos.length / 3).fill(1), 1)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, linenMat); mesh.name = 'mound'; mesh.frustumCulled = false; object.add(mesh);
    await ctx.yield();
  }
  await ctx.yield();

  // knots, pom-pom trees and tassel tufts on the fields
  const nKnots = mounds.length ? (opts.knots ?? 700) : 0;
  if (nKnots) {
    // the pom-pom trees are the first sixth of the knots and keep the rounder ball; the flower knots, a metre or two across and
    // never nearer than a hill's flank, are a ball of a quarter the triangles (opts.knotDetail: 1 gives them the rounder one)
    const round = (det) => { const g = new THREE.IcosahedronGeometry(1, det), P = g.attributes.position, Nn = g.attributes.normal; for (let i = 0; i < P.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(P, i).normalize(); Nn.setXYZ(i, v.x, v.y, v.z); } return g; };
    const nTreeK = Math.ceil(nKnots * 0.16), kg = round(1), kgF = round(opts.knotDetail ?? 0), kMat = makeKnotMaterial(U, NF);
    const km = new THREE.InstancedMesh(kg, kMat, nTreeK); km.name = 'knots'; km.frustumCulled = false;
    const kf = new THREE.InstancedMesh(kgF, kMat, Math.max(1, nKnots - nTreeK)); kf.name = 'flower-knots'; kf.frustumCulled = false; kf.count = nKnots - nTreeK;
    const iKs = [new Float32Array(nTreeK * 4), new Float32Array((nKnots - nTreeK) * 4)], iCols = [new Float32Array(nTreeK * 3), new Float32Array((nKnots - nTreeK) * 3)], M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const flowerCols = [new THREE.Color('#f3b6c4'), cCream.clone(), cGold.clone().lerp(cCream, 0.3), cGold.clone().lerp(cBrown, 0.25).lerp(cCream, 0.2)];
    for (let i = 0; i < nKnots; i++) {
      const m = mounds[i % mounds.length], tree = i < nKnots * 0.16, a = rng.range(0, TAU), rr = m.r * Math.sqrt(rng.range(0.01, 0.9));
      const x = m.x + Math.cos(a) * rr, z = m.z + Math.sin(a) * rr, fi = fieldAt(x, z), f = fields[fi];
      const v = -(x - f.x) * Math.sin(f.ang) + (z - f.z) * Math.cos(f.ang);
      const s = tree ? rng.range(2.4, 4.4) : rng.range(0.5, 1.1);
      p.set(x, hgt(x, z) + s * (tree ? 0.75 : 0.35), z); sc.set(s, s * (tree ? rng.range(0.85, 1.1) : 0.6), s); q.setFromEuler(new THREE.Euler(0, rng.range(0, TAU), 0));
      const j = tree ? i : i - nTreeK, iK = iKs[tree ? 0 : 1], iCol = iCols[tree ? 0 : 1];
      (tree ? km : kf).setMatrixAt(j, M.compose(p, q, sc));
      iK.set([fi, clamp((f.Rf - v) / (2 * f.Rf), 0.01, 0.99), rng.range(0, TAU), tree ? s * 0.25 : 0], j * 4);
      const c = tree ? cGreen.clone().lerp(rng.chance(0.3) ? cGold : cBrown, rng.range(0, 0.3)).multiplyScalar(rng.range(0.55, 0.8)) : rng.pick(flowerCols).clone().multiplyScalar(rng.range(0.85, 1));
      iCol.set([c.r, c.g, c.b], j * 3);
      if ((i & 31) === 31) await ctx.yield();
    }
    [kg, kgF].forEach((g, n) => { g.setAttribute('iK', new THREE.InstancedBufferAttribute(iKs[n], 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCols[n], 3)); });
    object.add(km); object.add(kf);
  }
  await ctx.yield();

  // ---- the needle
  const needle = new THREE.Mesh(makeNeedleGeometry(rng), makeNeedleMaterial(U)); needle.name = 'needle'; needle.matrixAutoUpdate = false; needle.frustumCulled = false; object.add(needle);
  await ctx.yield();

  // ---- where the needle threads the hoop: sample one leap and find where the rigid needle crosses the hoop plane
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const tip = new THREE.Vector3(), eye = new THREE.Vector3(), dir = new THREE.Vector3(0, 1, 0), crown = new THREE.Vector3(), gather = new THREE.Vector3(), lat = new THREE.Vector3();
  // the hoop stands on the needle's entry line into the hoop stitch's far hole, so the needle slides clean through its centre
  const hA = road(hoopStitch * PITCH, new THREE.Vector3()).clone(), hB = road(hoopStitch * PITCH + SEW, new THREE.Vector3()).clone();
  const hoopT = hB.clone().sub(hA).setY(0).normalize(), hoopH = opts.hoopHeight ?? 9.2;
  const hoopC = hB.clone().addScaledVector(hoopT, -hoopH / Math.tan(alpha)); hoopC.y += hoopH;
  const hoopP = hoopC.clone().setY(hB.y), sIn = hoopStitch + K.fEntry - 0.012, sOut = hoopStitch + F3;
  await ctx.yield();
  if (opts.hoop !== false) {
    const C = { wood: cBrown.clone().lerp(cGold, 0.12).multiplyScalar(opts.hoopWood ?? 1.15), brass: cGold.clone().multiplyScalar(1.3), cream: cCream.clone() };
    const hoopG = await makeHoopGeometry(rng, C, hoopC.y - 8.3 - hoopP.y, () => ctx.yield());
    const hoop = new THREE.Mesh(hoopG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide, emissive: cBrown.clone(), emissiveIntensity: 0.16 }));
    hoop.name = 'hoop'; hoop.position.copy(hoopC);
    hoop.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(UP, hoopT).normalize(), UP, hoopT));
    object.add(hoop);
  }
  await ctx.yield();

  // ---- strands: stitch slots, the supply thread, one feeder per field
  const NST = 6, feederSrc = mounds.length ? null : (opts.feederSources || []);
  const nFeed = mounds.length ? fields.length : feederSrc.length, NSTR = NST + 1 + nFeed;
  const sg = makeStrandGeometry(NSTR), strands = new THREE.Mesh(sg, makeStrandMaterial(U)); strands.name = 'thread'; strands.frustumCulled = false; object.add(strands);
  const at = (n) => sg.attributes[n], aP = [at('iP0'), at('iP1'), at('iP2'), at('iP3')], aA = at('iA'), aB = at('iB'), aC = at('iC0');
  const rThread = opts.threadRadius ?? 0.58;
  const setStrand = (k, p0, p1, p2, p3, r, wig, crimp, whip, ride, col, ramp) => {
    aP[0].setXYZ(k, p0.x, p0.y, p0.z); aP[1].setXYZ(k, p1.x, p1.y, p1.z); aP[2].setXYZ(k, p2.x, p2.y, p2.z); aP[3].setXYZ(k, p3.x, p3.y, p3.z);
    const len = p0.distanceTo(p1) + p1.distanceTo(p2) + p2.distanceTo(p3);
    aA.setXYZW(k, r, wig, crimp, whip); aB.setXYZW(k, len, ramp > 0 ? ramp / len : 0, ride, k * 2.4); aC.setXYZ(k, col.r, col.g, col.b);
  };
  const hide = (k) => aA.setXYZW(k, 0, 0, 0, 0);
  const crimsonLit = cCrimson.clone();
  const feedCols = fields.map((f) => fieldCols[f.col].clone().lerp(cCream, 0.25));

  // ---- state
  let sManual = null, unravelManual = null, sNow = startS, finalTaut = 0, gatherBack = opts.gatherBack ?? 190;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3(), P3 = new THREE.Vector3(), basisX = new THREE.Vector3(), basisZ = new THREE.Vector3(), M4 = new THREE.Matrix4();
  const stitchOK = (i) => ring || (i >= 0 && i < nStitch);
  const sEnd = sOut + 0.03, span = opts.span ?? (ring ? 6 : nStitch);

  function apply(s, time) {
    sNow = s; U.uS.value = s; U.uTime.value = time;
    const i0 = Math.floor(s), f = K.pose(s, tip, dir);
    eye.copy(tip).addScaledVector(dir, -(NEEDLE_LEN - EYE_Y)); crown.copy(tip).addScaledVector(dir, -NEEDLE_LEN);
    // needle frame: the eye's slot looks sideways across the road
    v0.copy(dir).setY(0).normalize(); lat.crossVectors(UP, v0).normalize();
    basisZ.copy(lat).addScaledVector(dir, -lat.dot(dir)).normalize(); basisX.crossVectors(dir, basisZ);
    needle.matrix.copy(M4.makeBasis(basisX, dir, basisZ).setPosition(crown)); needle.matrixWorldNeedsUpdate = true;
    U.uNe0.value.copy(tip); U.uNe1.value.copy(crown);
    U.uFlash.value = (f - F1 + 0.04) / (F2 - F1 + 0.08);
    // ripples: the last few times the point went in (strong) or came out (gentle)
    let n = 0; const rip = U.uRip.value;
    for (let j = i0; j > i0 - 4 && n < NRIP; j--) {
      if (!stitchOK(j)) continue;
      for (const [sEv, dEv, amp] of [[j + K.fEntry, j * PITCH + SEW, 1], [j + K.fExit, j * PITCH, 0.55]]) {
        if (sEv > s || n >= NRIP) continue;
        const age = (s - sEv) * period, w = amp * (1 - smoothstep(3.0, 4.4, age)); if (w <= 0) continue;
        road(dEv, v0); rip[n++].set(v0.x, v0.z, age, w);
      }
    }
    for (; n < NRIP; n++) rip[n].w = 0;
    // stitches
    for (let k = 0; k < NST; k++) {
      const i = i0 - k, age = s - i;
      U.uStW.value[k] = 0;
      if (!stitchOK(i) || age < K.fEyeOut) { hide(k); continue; }
      road(i * PITCH, A); A.y -= 0.7; road(i * PITCH + SEW, B); B.y -= 0.7;
      if (age < K.fEyeIn) {                              // being laid: from its hole up to the eye
        P1.lerpVectors(A, eye, 0.3); P1.y = Math.max(A.y + 1.6, lerp(A.y, eye.y, 0.12));
        P2.copy(eye).addScaledVector(dir, -16); P2.y = Math.max(A.y + 1.2, P2.y - 5);
        setStrand(k, A, P1, P2, eye, rThread * (opts.layRadius ?? 1), 0, 0, 0.5, 1, crimsonLit, 0); aB.setW(k, -1 - k * 2.4); U.uSt.value[k].set(A.x, A.z, lerp(A.x, eye.x, 0.25), lerp(A.z, eye.z, 0.25)); U.uStW.value[k] = 0.6;
        continue;
      }
      const x = (age - K.fEyeIn) / (1 + K.fEyeOut - K.fEyeIn), y = x - 0.62;
      let slack = smoothstep(0, 0.25, x) * (x < 0.62 ? 1 : Math.exp(-3.2 * y) * Math.cos(7 * y));   // slack loops, then the tug as the needle surges out of the next hole
      if (!ring && i === nStitch - 1) slack *= 1 - finalTaut;                       // the last stitch is drawn flat for the camera that follows it through the hoop
      let pull = 0;
      if (age > keep) { pull = (age - keep) / 0.55; if (pull >= 1) { hide(k); continue; } slack = Math.max(slack, Math.sin(Math.PI * pull) * 0.8); }
      P3.lerpVectors(B, A, pull);
      const h = Math.max(0.5, 1.1 + 4.5 * slack);
      P1.lerpVectors(A, P3, 0.25); P2.lerpVectors(A, P3, 0.75);
      { // control heights solved so the curve clears the cloth at one third and two thirds of the way (the road may climb)
        const dA = i * PITCH, dL = SEW * (1 - pull), lift = 0.667 * (h + 0.7) - 0.7;
        const t1 = road(dA + dL * 0.315, v1).y + lift, t2 = road(dA + dL * 0.685, v1).y + lift + pull * 1.3;
        P1.y = (-5 * A.y + 18 * t1 - 9 * t2 + 2 * P3.y) / 6; P2.y = (2 * A.y - 9 * t1 + 18 * t2 - 5 * P3.y) / 6;
      }
      setStrand(k, A, P1, P2, P3, rThread * (opts.stitchRadius ?? 1.4), 0.8 * Math.abs(slack) * (1 - pull * 0.6), 0, 0, 1, crimsonLit, 0); aB.setW(k, -1 - k * 2.4); U.uSt.value[k].set(A.x, A.z, P3.x, P3.z); U.uStW.value[k] = 1;
    }
    // the supply thread: from the eye up to the gathering knot that trails 190 m behind, 88 m up
    road(s * PITCH - gatherBack, gather); gather.y += (opts.threadHeight ?? 96) + Math.sin(s * TAU) * 2.5;
    if (opts.hang !== false && mounds.length) {           // the knot is dragged toward whichever hills are feeding it, so the strand to the eye never hangs plumb
      let px = 0, pz = 0, pw = 0.6;
      for (const fl of fields) { if (!fl.m) continue; const w = smoothstep(0, 0.08, fl.prog) * (1 - smoothstep(0.92, 1, fl.prog)); px += w * (fl.x - gather.x); pz += w * (fl.z - gather.z); pw += w; }
      gather.addScaledVector(lat, clamp((px * lat.x + pz * lat.z) / pw * 0.2, -36, 36) + (opts.gatherSide ?? 0) * (lat.x < 0 ? -1 : 1) * (1 - Math.min(1, (pw - 0.6) * 2)));
    }
    const taut = smoothstep(K.fEyeOut - 0.05, F1 + 0.08, f) * (1 - smoothstep(F2 - 0.1, F3, f));
    v0.subVectors(gather, eye); const dist = v0.length(), dy = gather.y - eye.y; v0.setY(0); const dh = v0.length(); v0.normalize();
    const kick = Math.exp(-Math.pow((f - 0.32) / 0.16, 2));                       // the whip that runs up the thread as the needle leaps
    if (opts.hang === false) {
      P1.copy(eye).addScaledVector(v0, dist * 0.22).addScaledVector(lat, 3); P1.y += lerp(-14, 12, taut);
      P2.copy(gather).addScaledVector(v0, -dist * 0.3); P2.y -= lerp(30, 6, taut);
    } else {
      // slack, the strand hangs from the knot like a rope from a hook: it runs out almost level from the eye and swings
      // up steeply under the knot; at each leap it is snatched nearly straight
      const floorY = gather.y - (opts.threadHeight ?? 96) + 4, tk = taut * 0.82;
      P1.copy(eye).addScaledVector(v0, dh * 0.55).addScaledVector(lat, 3); P1.y = Math.max(eye.y + dy * 0.04 - 5, Math.min(floorY, eye.y + dy * 0.3));
      P2.copy(gather).addScaledVector(v0, -dh * 0.12); P2.y = gather.y - dy * 0.52 - 6;
      v1.lerpVectors(eye, gather, 0.33); v2.lerpVectors(eye, gather, 0.67); P1.lerp(v1, tk); P2.lerp(v2, tk);
    }
    setStrand(NST, eye, P1, P2, gather, rThread, 0, 0, 1.0 + 2.2 * (1 - taut) + 1.2 * kick, 0, crimsonLit, 0);
    U.uKnot.value.copy(gather); U.uSup.value[0].copy(eye); U.uSup.value[1].copy(P1); U.uSup.value[2].copy(P2); U.uSup.value[3].copy(gather);
    let nSh = 0;                                             // the feeders whose shadows the cloth shaders draw (the first eight)
    // feeders: each lifts the row now being pulled from its field, still crimped, blushing to crimson over 30 m
    for (let j = 0; j < nFeed; j++) {
      const k = NST + 1 + j;
      if (feederSrc) { A.copy(feederSrc[j]); }
      else {
        const fl = fields[j]; if (!fl.m || fl.prog <= 0.001 || fl.prog >= 0.999) { hide(k); continue; }
        const rows = Math.floor(2 * fl.Rf / U.uRowW.value), cur = fl.prog * rows, ri = Math.floor(cur);
        let uu = cur - ri; if (ri % 2) uu = 1 - uu;
        const u = (uu - 0.5) * 2 * fl.Rf, v = fl.Rf - (ri + 0.5) * U.uRowW.value, c = Math.cos(fl.ang), sn = Math.sin(fl.ang);
        A.set(fl.x + c * u - sn * v, 0, fl.z + sn * u + c * v); A.y = hgt(A.x, A.z) + 0.4;
        if (nSh < 8) U.uFeed.value[nSh++].set(A.x, A.y, A.z, smoothstep(0.001, 0.03, fl.prog) * (1 - smoothstep(0.97, 0.999, fl.prog)));
      }
      v0.subVectors(gather, A); const dl = v0.length(); v0.setY(0).normalize();
      const sag = Math.min(dl * (opts.feederSag ?? 0), opts.feederSagMax ?? 40);   // each feeder hangs in a slack arc of its own depth
      P1.copy(A).addScaledVector(v0, dl * (sag > 0 ? 0.16 : 0.08)); P1.y += 16 + 3 * Math.sin(time * 1.3 + j) - sag * 0.35;
      P2.copy(gather).addScaledVector(v0, -dl * (sag > 0 ? 0.36 : 0.3)); P2.y -= 22 + (j % 3) * 4 + sag * (0.85 + 0.15 * (j % 3));
      if (sag > 0) { P1.y = Math.max(P1.y, hgt(P1.x, P1.z) + 9, A.y + 5); P2.y = Math.max(P2.y, hgt(P2.x, P2.z) + 14); }
      setStrand(k, A, P1, P2, gather, rThread * 0.66, 0, 0.6, sag > 0 ? 0.9 + 1.7 * kick : 0.5, 0, feederSrc ? crimsonLit : feedCols[j], 30);
    }
    for (; nSh < 8; nSh++) U.uFeed.value[nSh].w = 0;
    for (const a of aP) a.needsUpdate = true; aA.needsUpdate = true; aB.needsUpdate = true; aC.needsUpdate = true;
  }
  function applyUnravel(x) {
    const spanU = opts.unravelSpan ?? 0.45;
    for (let i = 0; i < fields.length; i++) { const fl = fields[i]; fl.prog = clamp((x - fl.order * (1 - spanU)) / spanU, 0, 1); U.uSeedB.value[i].y = fl.prog; }
  }
  const unravelOff = rng.range(0.02, 0.2);

  const fly = [-240, -170, -115, -60, 0, 50, 110].map((d, i) => hoopC.clone().addScaledVector(hoopT, d).setY(hoopC.y + (d < -60 ? (-d - 60) * 0.1 : 0)));
  const hero = {
    object, radius: ring ? 100 : (opts.roadLength ?? 1400) / 2, height: 110, center: new THREE.Vector3(0, 34, 0), ground: false, groundY: 0,
    uniforms: U, needle: { tip, eye, crown, dir }, gather,
    hoopPhase: sIn, hoopClearPhase: sEnd, stitchesPerLap: lap,
    anchors: {
      portalSeat: { position: hoopC.clone(), facing: hoopT.clone().negate(), direction: hoopT.clone(), radius: 7 },
      flyThrough: fly, beyond: hoopC.clone().addScaledVector(hoopT, 60),
      ringRoad: ring ? { center: new THREE.Vector3(0, 0, 0), radius: Rr, direction: sgn } : null,
      mounds: mounds.map((m) => ({ center: new THREE.Vector3(m.x, hgt(m.x, m.z), m.z), radius: m.r })),
      threadHeight: opts.threadHeight ?? 96,
      viewpoints: {
        far: new THREE.Vector3(-150, 70, 300), reveal: hoopC.clone().addScaledVector(hoopT, -210).add(new THREE.Vector3(0, 45, 0)),
        chase: hoopC.clone().addScaledVector(hoopT, -150).setY(12), under: new THREE.Vector3(0, 40, 0).addScaledVector(hoopT, -80),
      },
    },
    road: (d, out = new THREE.Vector3()) => road(d, out),
    pose: (s, tipOut, dirOut) => K.pose(s, tipOut, dirOut),
    rippleAt: (x, z) => rippleJS(U.uRip.value, x, z),
    setPhase(s) { sManual = s; },                              // stitch phase: integer part = stitch index, fraction = leap
    setProgress(u) { sManual = sEnd - (1 - clamp(u, 0, 1)) * span; },
    setUnravel(x) { unravelManual = x; },
    setFinalTaut(x) { finalTaut = clamp(x, 0, 1); },
    setGatherBack(x) { gatherBack = x; },                      // how far behind the needle the gathering knot trails (opts.gatherBack), live             // road mode: 1 pulls the last stitch flat
    update(dt, time) {
      const s = sManual !== null ? sManual : startS + time / period;
      if (unravelManual !== null) applyUnravel(clamp(unravelManual, 0, 1));
      else { const c = (time / 64 + unravelOff) % 1; applyUnravel(c < 0.84 ? 0.06 + 0.72 * c / 0.84 : 0.78 * (1 - smoothstep(0.86, 0.98, c)) + 0.06 * smoothstep(0.86, 0.98, c)); }
      apply(s, time);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}
