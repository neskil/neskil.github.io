// THE TWIN SPIRE: hero set piece of "The Flinching Forest".
//
// WHAT          An organ-pipe cluster of ~200 fused ivory worm tubes, about 50 x 38 m at the foot, stepping
//               up in ranks (30, 55, 80, 110, 135 m) to two master pipes 160 m tall, 6 m thick, 24 m apart
//               (at x = -12 and x = +12). [Since widened: a stepped face ~115 m across the foot, ranks 48-135 m.] Every lower pipe carries its own 6-12 m spiral plume; from the
//               masters rise two great counter-wound plumes ~90 m tall and 55 m across, meshing like gears,
//               their lowest whorls hanging 22 m below the mouths as a red veil across the gap. In the gap,
//               at y 150, a grown ivory hoop (14 m opening) on six buttress roots seats the exit portal.
// SIZE          radius ~42 (great plumes), height ~252, centre (0, 150, 0). Origin at base centre, +Y up.
//               Front is +Z: the hoop faces +Z and -Z; the brief's last leg flies +Z -> -Z through it,
//               so rotate the piece so that local +Z points to world south-east.
// OPTS          palette  : 7 hex strings (brief order: ivory, crimson, coral, gold, jade, teal, mint)
//               detail   : 0.6-1 (default ctx.quality.detail or 1): fewer mist puffs and motes, and coarser
//                          terrace-plume meshes below 0.8; pipes, hoop and great plumes never thin
//               wine, glowA, glowB : optional self-shadow colour (hex) and back-lit glow colours ([r,g,b]) for other palettes
//               sunDir   : THREE.Vector3 towards the sun in WORLD space (the shaders light with world-space normals;
//                          default: 56 deg up, 65 deg left of local -Z, right for an unrotated piece)
// PROGRESS      hero.setProgress(u)   world path u (call it every frame, and once at build with u = 0):
//                                     shade arrives and terraces flinch upward 0.775-0.80, the great plumes
//                                     screw down 0.80-0.855 (west, x < 0, first; east 0.5 s later), then each
//                                     mouth breathes its mist column. It also sets uShade; overwrite after if
//                                     the world's own shade(xz) should rule.
//               hero.setFlinch(terraces, west, east, mistW, mistE)   direct control instead, all 0-1
//                                     (terraces is a wave climbing the ranks; 1 = fully in the pipe).
//               hero.uniforms         { uSunDir, uSunCol, uFill (.value Vector3 / Color), uShade (0-0.85 of the
//                                     sun removed) below the world height uShadeY (default 400 = the whole piece; the
//                                     world raises it so the shade climbs), uRingGlow (0-1: the ring's light through the veil), uCamFlinch (metres, default 16: terrace plumes nearer the
//                                     camera than this screw down, so they flinch rank by rank on the climb;
//                                     0 disables), uWind (mist lean, local unit vector), uMist (Vector2) }.
//               Until setProgress / setFlinch is first called the piece runs a 30 s demo cycle from time
//               (open, flinch, bare with mist, heal with wobble) so it can be judged alone.
//               Idle motion (time): plumes turn once in 40 s, opposite hands counter-turn like gears, a ripple
//               runs up each spiral, tips tremble, gold motes rise through the whorls.
// ANCHORS       portalSeat {position (0,150,0), normal (0,0,1), radius 7}   ring centre and facing
//               flyThrough [..]  the final straight, +Z to -Z through the hoop, >= 6 m clear of everything
//                                once the great plumes are down (the veil crosses it while they are open)
//               approach [..]    the rising approach the world flies: 300 m straight down the hoop axis from +Z,
//                                climbing from crown height to the ring, the whole broad face ahead all the way
//               climb / orbit    an older close route up the -X/-Z flank and round the back (kept for reference)
//               viewpoints       { veil, gears, far } good places to look at it from
//               mouths [2]       the master pipe mouths (mist columns start here), greatPlumeCentre [2],
//                                greatPlumeRadius, veilBottomY, masterPipeX
// COST          ~116k triangles, 7 draw calls (pipes+hoop, terrace plumes, great plumes, mist, terrace puffs, motes, ring glow),
//               no lights, no textures. Build ~100 ms on the software test machine.
// STYLE         plumes are bare parametric helicoid sheets; filaments (rods, herringbone barbs, hashed tip
//               lengths) are cut out with discard in the fragment shader, colour runs coral -> crimson -> wine
//               along each filament, light = wrapped key + orange transmission when back-lit, red clamped 0.9.
// LIGHTING      self-lit ShaderMaterials: one hard key (uSunDir/uSunCol) plus a jade fill (uFill); scene
//               lights are ignored, scene fog is honoured. Red is clamped to 0.9 so it never blooms.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#E4DCCB', '#D8283A', '#E66E58', '#F6C453', '#7FD1C2', '#17414A', '#DDF3EE'];
const MASTER_X = 12, MASTER_H = 160, MASTER_R = 3, RING_Y = 150;

// ---- geometry sink -------------------------------------------------------------------------------------------
function makeSink() { return { pos: [], nor: [], uv: [], dat: [], idx: [] }; }

// Lathe a profile [[y, r], ...] round a (possibly leaning, bowed) axis into the sink.
// axis(y) -> [x, z] offset of the centre line at height y. dat = (seed, tubeHeight, throatFlag).
function lathe(sink, prof, segs, axis, seed, H, lobes) {
  const base = sink.pos.length / 3, n = prof.length;
  for (let i = 0; i < n; i++) {
    const [y, r, rim] = prof[i];
    const a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)];
    let ty = b[0] - a[0], tr = b[1] - a[1]; const tl = Math.hypot(ty, tr) || 1; ty /= tl; tr /= tl;
    const [ax, az] = axis(y);
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * TAU, c = Math.cos(th), s = Math.sin(th);
      const lob = rim ? 1 + rim * 0.5 * Math.cos(th * lobes) : 1;         // scalloped lip
      const yy = y + (rim ? rim * 0.9 * (0.5 + 0.5 * Math.cos(th * lobes)) : 0);
      sink.pos.push(ax + c * r * lob, yy, az + s * r * lob);
      sink.nor.push(c * ty, -tr, s * ty);
      sink.uv.push(j / segs, yy);
      sink.dat.push(seed, H, i >= n - 3 ? 1 : 0);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
    const p = base + i * (segs + 1) + j, q = p + segs + 1;
    sink.idx.push(p, q, p + 1, p + 1, q, q + 1);
  }
}

// One worm tube: flared foot, slightly flaring body with repair collars, rolled lobed lip, dark throat.
function tubeProfile(rng, H, R, rich) {
  const p = [], foot = R * rng.range(1.25, 1.5), lip = Math.min(0.32, R * 0.22) * (rich ? 1.25 : 1);
  if (rich) p.push([-1.5, foot * 1.05]);
  p.push([0.2, foot], [H * 0.035 + 1.2, R * 0.98]);
  const nBody = rich ? 9 : 2, collars = [];
  for (let k = 0; k < (rich ? 4 : 1); k++) if (rng.chance(rich ? 1 : 0.5)) collars.push(rng.range(0.15, 0.9));
  for (let k = 1; k <= nBody; k++) {
    const f = k / (nBody + 1);
    p.push([H * f, R * (0.9 + 0.1 * f) * (1 + rng.range(-0.025, 0.025))]);
  }
  for (const c of collars) {                                               // old repairs: a paler raised sleeve
    const y = H * c, w = R * rng.range(0.5, 1.1), rr = R * (0.9 + 0.1 * c);
    if (rich) p.push([y - w, rr], [y - w * 0.8, rr * 1.07], [y + w * 0.8, rr * 1.075], [y + w, rr * 1.0]);
    else p.push([y - w, rr * 1.08], [y + w, rr * 1.09]);
  }
  p.sort((a, b) => a[0] - b[0]);
  const top = R * 1.04;
  if (rich) p.push([H - lip * 3.2, top], [H - lip * 1.4, top * 1.03], [H - lip * 0.9, top + lip * 0.75, 0.0],
    [H - lip * 0.25, top + lip * 1.05, lip * 0.5], [H + lip * 0.3, top + lip * 0.55, lip * 0.8],
    [H + lip * 0.25, top - lip * 0.3, lip * 0.6], [H - lip * 1.2, top - lip * 0.9], [H - 3.0, top * 0.8], [H - 3.01, 0.001]);
  else p.push([H - lip * 2.4, top], [H - lip * 0.7, top + lip * 0.95, lip * 0.3], [H + lip * 0.3, top + lip * 0.5, lip * 0.8],
    [H - lip * 0.6, top - lip * 0.8, lip * 0.2], [H - 2.4, top * 0.8], [H - 2.41, 0.001]);
  return p;
}

// ---- layout: where the ~200 pipes stand, and how tall --------------------------------------------------------
async function layoutPipes(rng, ctx) {
  const pipes = [];
  const lean = rng.range(0.004, 0.012);
  pipes.push({ x: -MASTER_X, z: 0, H: MASTER_H, R: MASTER_R, master: 1, lx: 0, lz: 0, bow: -lean });
  pipes.push({ x: MASTER_X, z: 0, H: MASTER_H, R: MASTER_R, master: 1, lx: 0, lz: 0, bow: lean });
  const ranks = [135, 112, 90, 68, 48], edges = [3.1, 6.2, 10, 13.8, 17.7];     // every rank stands clear of the forest's crowns
  const sx = rng.range(2.4, 2.8), sz = rng.range(0.9, 1.02);              // a broad stepped face, 110-125 m at the foot              // footprint proportions per seed
  const sway = rng.range(0, TAU), swayA = rng.range(0, 2.2);
  let tries = 0;
  while (pipes.length < 194 && tries++ < 9000) {
    if ((tries & 511) === 0) await ctx.yield?.();
    const x = rng.range(-63, 63), z = rng.range(-19, 19);
    const dx = Math.max(Math.abs(x) - MASTER_X, 0), d0 = Math.hypot(dx / sx, z / sz);
    const d = d0 + swayA * Math.sin(Math.atan2(z, x) * 3 + sway) * (d0 / 17.7);
    if (d > 17.7) continue;
    let k = 0; while (d > edges[k]) k++;
    if (k === 0 && Math.abs(x) < 11.5) k = 1;                               // keep a saddle under the hoop
    if (Math.abs(x) < 9 && Math.abs(z) < 5 && k < 2) k = 2;                 // and a clear lane through it
    const R = rng.range(1.15, 1.9) * (k === 0 ? 1.2 : k === 4 ? 0.85 : 1);
    let ok = true;
    for (const q of pipes) { const dd = Math.hypot(q.x - x, q.z - z); if (dd < (q.R + R) * 0.86) { ok = false; break; } }
    if (!ok) continue;
    const H = ranks[k] * (k === 0 ? rng.range(0.92, 1.05) : rng.range(0.86, 1.07)) + rng.range(-2, 2);
    const out = Math.hypot(x, z) || 1, l = rng.range(0.0, 0.03) * (k / 4);
    pipes.push({ x, z, H, R, master: 0, rank: k, lx: (x / out) * l, lz: (z / out) * l, bow: rng.range(-0.5, 0.5) });
  }
  return pipes;
}

// Sweep a round tube along a curve (hoop, buttress roots). pt(t) -> Vector3, rad(t) -> radius.
function sweep(sink, pt, rad, nAlong, nAround, seed, closed, vScale) {
  const base = sink.pos.length / 3, P = new THREE.Vector3(), Q = new THREE.Vector3(), T = new THREE.Vector3();
  const N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3(0, 0, 1);
  let len = 0; const prev = pt(0).clone();
  for (let i = 0; i <= nAlong; i++) {
    const t = i / nAlong, e = 0.5 / nAlong;
    P.copy(pt(t)); len += P.distanceTo(prev); prev.copy(P);
    Q.copy(pt(closed ? t + e : Math.min(1, t + e))); T.copy(pt(closed ? t - e : Math.max(0, t - e))); T.subVectors(Q, T).normalize();
    N.crossVectors(ref, T); if (N.lengthSq() < 1e-6) N.set(1, 0, 0); N.normalize(); B.crossVectors(T, N);
    const r = rad(t);
    for (let j = 0; j <= nAround; j++) {
      const th = (j / nAround) * TAU, c = Math.cos(th), s = Math.sin(th);
      const nx = N.x * c + B.x * s, ny = N.y * c + B.y * s, nz = N.z * c + B.z * s;
      sink.pos.push(P.x + nx * r, P.y + ny * r, P.z + nz * r);
      sink.nor.push(nx, ny, nz);
      sink.uv.push(j / nAround, len * vScale);
      sink.dat.push(seed, 1e4, 0);
    }
  }
  for (let i = 0; i < nAlong; i++) for (let j = 0; j < nAround; j++) {
    const p = base + i * (nAround + 1) + j, q = p + nAround + 1;
    sink.idx.push(p, p + 1, q, p + 1, q + 1, q);
  }
}

function sinkToGeometry(sink) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(sink.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(sink.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(sink.uv, 2));
  g.setAttribute('aDat', new THREE.Float32BufferAttribute(sink.dat, 3));
  g.setIndex(sink.idx);
  return g;
}

// ---- shared GLSL ---------------------------------------------------------------------------------------------
const GLSL_COMMON = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uFill, uTeal;
  uniform float uShade, uTime;
  float hash11(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
  }
  // sky fill: jade from above, teal bounce from below; never grey
  vec3 fillLightS(float ny, float sh) { return mix(uFill * 0.55 + vec3(0.06, 0.02, 0.015), uFill, 0.5 + 0.5 * ny) * (1. + 0.06 * sh); }
  vec3 fillLight(float ny) { return fillLightS(ny, uShade); }
  // Fill for an ivory pipe, so that it has form in shade as well as in sun: brighter toward the sun's quarter of the sky,
  // deep and cool at the foot rising to a pale lip, and a warm bounce from the sunlit plumes on the side turned from the sun.
  vec3 pipeFill(vec3 N, float sh, float hg, vec3 warm) {
    vec2 sa = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
    float az = dot(N.xz, sa), lee = 0.5 - 0.5 * az;
    vec3 cool = mix(vec3(1.), uTeal / max(max(uTeal.r, uTeal.g), max(uTeal.b, 1e-3)), 0.5);
    float azK = 0.3;                      // in sun the side turned from it is plainly darker and cooler
    float lipK = hg * hg * hg;
    vec3 sky = fillLightS(N.y, sh) * (1. - azK + azK * az) * mix(0.2 + 0.42 * (1. - sh), 1.14 - 0.42 * sh + 0.34 * sh * lipK, mix(hg, hg * hg, sh)) * mix(mix(vec3(1.), cool, 0.6 + 0.4 * sh), vec3(1.), hg);
    sky *= mix(vec3(1.), cool, 0.4 * lee * (1. - sh));
    return sky * (1. - 0.42 * sh) + warm * lee * lee * mix(0.36, 0.22, hg) * (0.1 + 0.9 * sh);
  }
  // a high sun rakes upright pipes only weakly: for them the key is taken from lower down, so each has a lit side
  float pipeKey(vec3 N) { float k = clamp((dot(N, normalize(uSunDir * vec3(1., 0.5, 1.) + vec3(0., 1e-4, 0.))) + 0.5) / 1.5, 0., 1.); return k * k * 1.22; }
  // thin ground mist that gathers wherever a cloud's shadow lies: near, middle and far ranks part into separate tones
  vec3 shadeMist(vec3 col, vec3 w, float sh) {
    float d = length(cameraPosition - w);
    float f = (1. - exp(-d * 0.011)) * (1. - smoothstep(0.5, 8., w.y)) * smoothstep(0.08, 0.55, sh) * 0.42;
    return mix(col, uFill * 0.5 + vec3(0.012), f);
  }
  // On the Spire the shade is a front that climbs: everything below uShadeY is in the cloud's shadow, the rest still in sun.
  #ifdef HERO_SHADE
    uniform float uShadeY;
    #define SHADE_AT(y) (uShade * (1. - smoothstep(uShadeY - 7., uShadeY + 7., (y))))
  #else
    #define SHADE_AT(y) uShade
  #endif
`;

function makeTubeMaterial(U, pal, heroShade) {
  return new THREE.ShaderMaterial({
    defines: heroShade ? { HERO_SHADE: 1 } : {},
    uniforms: { ...U, uIvory: { value: pal[0] }, uGold: { value: pal[3] }, uCoral: { value: pal[2] }, uOpen: { value: 1 } },
    fog: true,
    vertexShader: /* glsl */`
      attribute vec3 aDat;
      varying vec3 vW, vN; varying vec2 vUv; varying vec3 vDat;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv; vDat = aDat;
        vec4 w = modelMatrix * vec4(position, 1.);
        vW = w.xyz; vN = mat3(modelMatrix) * normal;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uIvory, uGold, uCoral; uniform float uOpen;
      varying vec3 vW, vN; varying vec2 vUv; varying vec3 vDat;
      #include <fog_pars_fragment>
      void main() {
        float seed = vDat.x, H = vDat.y, throat = vDat.z;
        float shd = SHADE_AT(vW.y);
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        float ang = vUv.x * 6.2831853, y = vUv.y;
        // growth rings 0.4 m apart: a raised rib, a hairline groove, a faint amber band
        float rp = y / 0.4 + 0.25 * vnoise(vec2(ang * 1.5 + seed * 9., y * 0.3)) + seed * 7.;
        float rf = fract(rp), rid = floor(rp);
        float near = 1. - smoothstep(0.1, 0.36, fwidth(rp));                         // rings melt away when sub-pixel
        float rib = smoothstep(0.0, 0.18, rf) * (1. - smoothstep(0.18, 0.5, rf)) * near;
        float groove = (1. - smoothstep(0.0, 0.05, abs(rf - 0.93))) * near;
        float flute = cos(ang * 8. + seed * 20.);
        // bend the normal with ribs and flutes (tangent frame from N and up)
        vec3 Tn = normalize(cross(vec3(0., 1., 0.), N) + vec3(1e-4, 0., 1e-4));
        float dRib = (smoothstep(0.0, 0.18, rf + 0.04) * (1. - smoothstep(0.18, 0.5, rf + 0.04)) * near - rib) * 6.;
        N = normalize(N + Tn * sin(ang * 8. + seed * 20.) * 0.22 - vec3(0., 1., 0.) * (dRib * 0.13 - groove * 0.12));
        vec3 alb = uIvory * (0.9 + 0.1 * hash11(seed * 13.1));
        alb *= mix(vec3(1.), vec3(1.0, 0.86, 0.62), 0.22 * hash11(rid + seed * 31.) * smoothstep(0.5, 0.95, rf));   // amber band
        alb *= 1. - 0.22 * groove;
        alb *= 0.93 + 0.07 * flute;
        float blotch = vnoise(vec2(ang * 2.2 + seed * 40., y * 0.12));
        alb *= 0.88 + 0.16 * blotch;                                                  // old repairs, weathering
        // sea-green algal felt in the grooves of the lee side, strongest low down
        float lee = smoothstep(0.35, 0.95, dot(N, normalize(vec3(0.75, 0., 0.65))));
        float felt = lee * mix(0.35, smoothstep(0.55, 1., rf), near) * smoothstep(0.35, 0.75, vnoise(vec2(ang * 5., y * 0.7 + seed)));
        float hN = H > 9000. ? 0.85 : y / max(H, 1.);
        alb = mix(alb, vec3(0.24, 0.5, 0.42), 0.4 * felt * (1. - smoothstep(0.2, 0.9, hN)));
        // gold lichen freckles under the lip
        float nearLip = smoothstep(H - 3.5, H - 0.4, y) * step(y, H + 2.) * step(H, 9000.);
        float fre = smoothstep(0.72, 0.8, vnoise(vec2(ang * 14., y * 5.) + seed * 3.));
        alb = mix(alb, uGold * 0.85, fre * nearLip * 0.8);
        // light
        // fallen filaments banked against the foot
        float drift = (1. - smoothstep(0.5, 1.5 + 1.2 * vnoise(vec2(ang * 3. + seed * 5., seed * 9.)), y)) * step(H, 9000.);
        alb = mix(alb, mix(uCoral * vec3(0.95, 0.6, 0.7), uIvory * vec3(1., 0.9, 0.7), 0.55 * vnoise(vec2(ang * 9., y * 6. + seed * 3.))) * (0.7 + 0.3 * vnoise(vec2(ang * 40., y * 3.))), drift * 0.85);
        float hg = smoothstep(0.0, 0.75, hN);
        float ao = (0.62 + 0.38 * smoothstep(0.2, 0.98, hN)) * (0.86 + 0.14 * flute);
        float ndl = pipeKey(N);
        vec3 lit = uSunCol * ndl * (1. - shd) * mix(0.7, 1., ao) + pipeFill(N, shd, hg, uCoral) * (0.86 + 0.14 * flute);
        // in shade each pipe keeps a pale rim, brightest on the side toward the sunlit country
        vec3 Vr = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float rimK = 1. - abs(dot(N, Vr)); rimK *= rimK * rimK;
        lit += (uFill * 0.55 + uSunCol * 0.3 * max(dot(N.xz, uSunDir.xz / max(length(uSunDir.xz), 1e-4)), 0.)) * rimK * shd * (0.45 + 0.55 * hg);
        // red light spilling down from the open plume above
        lit += uCoral * 0.22 * uOpen * smoothstep(H - 9., H, y) * step(y, H + 2.);
        vec3 col = alb * lit;
        col = mix(col, uTeal * (0.5 + 0.9 * fillLightS(1., shd)), throat * 0.92);           // dark teal throat
        col = shadeMist(col, vW, shd);
        gl_FragColor = vec4(min(col, vec3(1.18)), 1.);                                    // sunlit ivory is the brightest solid thing there is
        #include <fog_fragment>
      }`,
  });
}

// ---- plumes --------------------------------------------------------------------------------------------------
// Parametric geometry: position = (a along the ramp 0-1, s along the filament 0-1, part) where part is
// 0 / 1 for the two interleaved ramps and 2 for the stalk. The vertex shader winds it into shape, so one
// shader does idle turning, ripple, tremble and the corkscrew retreat.
function plumeGeometry(segPerTurn, radial, turns, stalkSegs) {
  const pos = [], idx = [], nA = Math.round(segPerTurn * turns);
  for (let ramp = 0; ramp < 2; ramp++) {
    const base = pos.length / 3;
    for (let i = 0; i <= nA; i++) for (let j = 0; j <= radial; j++) pos.push(i / nA, Math.pow(j / radial, 0.8), ramp);
    for (let i = 0; i < nA; i++) for (let j = 0; j < radial; j++) {
      const p = base + i * (radial + 1) + j, q = p + radial + 1;
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
  }
  const base = pos.length / 3, nH = stalkSegs, nR = 6;
  for (let i = 0; i <= nH; i++) for (let j = 0; j <= nR; j++) pos.push(i / nH, j / nR, 2);
  for (let i = 0; i < nH; i++) for (let j = 0; j < nR; j++) {
    const p = base + i * (nR + 1) + j, q = p + nR + 1;
    idx.push(p, q, p + 1, p + 1, q, q + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 130, 0), 160);
  return g;
}
// STREETS (a paint only: nothing is placed, sized, timed or lit by it). One field over the ground of the plateau, S(point) in -1..1,
// made of the point's place along and across the wind and three phases thrown from dice of its own; it reads nothing else (no path,
// clock, lens or shadow). Where S > 0.76 lies an OLD street, where S < -0.76 a SPAWNING street: winding bands some 95 m wide, 420 m
// apart. Every animal is classed whole by its own root (the edge ragged by a hash of the root, half a pitch), the far paint by its ground point.
const STANDS = /* glsl */`
  uniform vec4 uStand;       // the field's three phases s0, s1, s2 and the paint's strength (0 on the Spire, 1 in the forest)
  uniform vec2 uStandW;      // the wind's direction, a constant of the place
  float standF(vec2 p) { float a = dot(p, uStandW), c = dot(p, vec2(-uStandW.y, uStandW.x)); return sin(c * 0.015 + 1.5 * sin(a * 0.007 + uStand.y) + 0.6 * sin(a * 0.019 + uStand.z) + uStand.x); }
  // an animal's class by its root: +1 in an old street, -1 in a spawning street, 0 elsewhere
  float standOf(vec2 root) { float S = standF(root) + 0.12 * (fract(sin(dot(root, vec2(12.9898, 78.233))) * 43758.5453) - 0.5); return (step(0.76, S) - step(S, -0.76)) * uStand.w; }
  // an old street is older growth: a tint laid over whatever is already drawn there (pale heart, banding, light and shade all stay underneath).
  // At k = 1 it takes the crown's mean colour halfway to the look's wine; it lets go of the brightest filaments (largest channel 0.3 to 0.8) and spares a channel the pixel hardly has (whole from half of its largest, none under a tenth), so no channel is emptied; k is the class, let go in a cloud's shade by the caller
  vec3 standTint(vec3 c, vec3 coral, vec3 crimson, vec3 wine, float k) { float v = max(c.r, max(c.g, c.b)); return c * mix(vec3(1.), wine / max(mix(crimson, coral, 0.5), vec3(1e-3)), 0.5 * k * (1. - smoothstep(0.3, 0.8, v)) * smoothstep(0.1, 0.5, c / max(v, 1e-4))); }
`;

const PLUME_VERT = /* glsl */`
  attribute vec3 iRoot;      // mouth centre (local)
  attribute vec4 iSize;      // plume height, plume radius, handedness (+1 / -1), seed
  attribute vec2 iOrder;     // flinch order 0-1 (terraces: by height; great: 0 west, 1 east), hue shift
  uniform float uTime, uTurns, uLow, uSlopeLo, uSlopeHi, uGreat, uFlinchT, uCamFlinch, uSpin, uRoot0;
  uniform vec2 uFlinchG;
  ${STANDS}
  varying float vStand;
  varying vec3 vW; varying vec4 vP; varying vec3 vI;
  #include <fog_pars_vertex>
  void main() {
    float a = position.x, s = position.y, part = position.z;
    float Hp = iSize.x, Rp = iSize.y, hand = iSize.z, seed = iSize.w;
    vec3 rootW = (modelMatrix * vec4(iRoot, 1.)).xyz;
    vStand = standOf(rootW.xz);
    // retraction R for this animal
    //<retraction>
    float Rt = smoothstep(0., 0.1, uFlinchT * 1.12 - iOrder.x - 0.02 * seed);
    float dc = distance(cameraPosition, rootW + vec3(0., Hp * 0.5, 0.));
    Rt = max(Rt, 1. - smoothstep(uCamFlinch * 0.75, uCamFlinch + 0.001, dc));
    float R = mix(Rt, mix(uFlinchG.x, uFlinchG.y, iOrder.x), uGreat);
    //</retraction>
    float isStalk = step(1.5, part);
    float aa = mix(a, 0., isStalk);
    float ang, r, y, hf;
    float stalkR = Rp * 0.035 + 0.05;
    if (isStalk > 0.5) {
      ang = a * 2.5 + position.y * 6.2831853;
      r = stalkR * (1.15 - 0.6 * a);
      y = Hp * (-0.06 + 0.76 * a);
      hf = a * 0.7;
    } else {
      float rad = Rp * mix(uLow, 1., aa * (2. - aa));
      float slope = mix(uSlopeLo, uSlopeHi, smoothstep(0., 0.5, aa));
      ang = hand * (aa * uTurns * 6.2831853 + part * 3.14159265) + seed * 6.2831853;
      // a ripple running up the spiral, tips trembling
      float rip = sin(aa * uTurns * 6.2831853 * 1.0 - uTime * 1.7 + seed * 40.);
      float trem = sin(uTime * 6.1 + aa * 310. + seed * 9.) * s * s * s;
      r = stalkR * 0.6 + s * rad * (1. + 0.035 * rip);
      y = Hp * (uRoot0 + 0.62 * aa) + rad * (slope * s - 0.22 * s * s * s * s * sign(slope + 0.3)) + rad * (0.03 * rip * s + 0.012 * trem);
      ang += hand * (0.10 * s * s + 0.02 * trem);                       // filaments sweep back a little
      hf = clamp((0.05 + 0.62 * aa) + 0.3 * s, 0., 1.);
    }
    ang += hand * uTime * 0.157 * uSpin;                                // one turn in 40 s; opposite hands counter-turn
    float Rv = clamp(R * 1.3 - 0.3 * hf, 0., 1.);
    float k = 1. - Rv;
    r *= mix(k, 1. - 0.45 * Rv, isStalk);
    ang += hand * 18.85 * Rv * (1. - isStalk);                          // three turns on the way down
    y = y * k * k - (2.5 + Hp * 0.04) * Rv * (1. - 0.8 * uGreat);      // the great plumes stop at the lip: their folded tips still show in the mouths
    vec3 p = iRoot + vec3(cos(ang) * r, y, sin(ang) * r);
    p.x += uGreat * sign(iRoot.x) * max(y, 0.) * 0.14;                  // the great plumes lean apart, so there is sky between their upper whorls
    vec4 w = modelMatrix * vec4(p, 1.);
    vW = w.xyz;
    vP = vec4(aa * uTurns, s, part, Rv);
    vI = vec3(seed, iOrder.y, aa);
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const PLUME_FRAG = /* glsl */`
  ${GLSL_COMMON}
  uniform vec3 uCoral, uCrimson, uWine, uGold, uGlowA, uGlowB;
  uniform float uFil, uPin, uGreat, uFogK, uCore;
  ${STANDS}
  varying float vStand;
  varying vec3 vW; varying vec4 vP; varying vec3 vI;
  #include <fog_pars_fragment>
  void main() {
    float s = vP.y, part = vP.z, seed = vI.x, aa = vI.z;
    vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
    vec3 dx = dFdx(vW), dy = dFdy(vW);
    vec3 N = cross(dx, dy); N = N / max(length(N), 1e-9); N = normalize(N + vec3(0., 1e-4, 0.));
    if (dot(N, V) < 0.) N = -N;
    float shd = SHADE_AT(vW.y);
    float sunK = 1. - shd;
    vec3 col;
    if (part > 1.5) {
      // the stalk: coral, ringed, fleshy
      float ring = 0.5 + 0.5 * sin(vP.x * 3. + aa * 240.);
      vec3 alb = mix(uCoral, uCrimson, 0.25 + 0.2 * ring) * 0.85;
      col = alb * (uSunCol * sunK * (0.25 + 0.75 * max(dot(N, uSunDir), 0.)) + fillLightS(N.y, shd) * 0.8);
    } else {
      float fx = vP.x * uFil + part * 0.5;
      float fw = fwidth(fx);
      float id = floor(fx), f = fract(fx) - 0.5;
      float len = 0.74 + 0.26 * hash11(id * 1.37 + seed * 91. + part * 17.);        // hashed lengths: a fringe, not an edge
      len *= 1. - 0.25 * smoothstep(0.9, 1., aa) - 0.3 * (1. - smoothstep(0., 0.03, aa));
      float sn = s / len;
      if (sn > 1.) discard;
      // rod: tapering, a hand thick; pinnules: herringbone barbs on both sides, shorter toward the tip
      float rodW = mix(0.2, 0.05, sn) / max(0.25 + s * 3.5, 0.25);                   // rods fuse at the root
      float rod = 1. - smoothstep(rodW, rodW + max(fw, 0.02), abs(f));
      float pc = sn * len * uPin - abs(f) * 2.6;
      // barbs keep to 2-4 px by halving their count with distance, so the vane never turns to mush
      float pw = fwidth(s) * uPin + fw * 2.6;
      float lod = clamp(log2(max(pw, 1e-4) / 0.2), 0., 5.);
      float l0 = floor(lod), sc = exp2(-l0);
      float b0 = 1. - smoothstep(0.24, 0.24 + max(pw * sc, 0.03), abs(fract(pc * sc) - 0.5));
      float b1 = 1. - smoothstep(0.24, 0.24 + max(pw * sc * 0.5, 0.03), abs(fract(pc * sc * 0.5) - 0.5));
      float pin = mix(b0, b1, smoothstep(0.35, 0.85, lod - l0));
      float pinLen = 0.5 * (1. - sn * sn * sn) * smoothstep(0.02, 0.12, sn) + 0.02;
      pin *= 1. - smoothstep(pinLen - 0.04, pinLen, abs(f));
      float alpha = max(rod, pin);
      float sheet = smoothstep(0.3, 0.8, fw);                                        // rods under ~2 px: a flat 55 % sheet
      // far off, filaments are drawn in bundles at least ~2.5 px wide with their own hashed lengths: a fringe, never a dot screen
      float gw = exp2(ceil(log2(max(fw * 2.5, 1.))));
      float gid = floor(fx / gw), gf = fract(fx / gw);
      float lenG = 0.62 + 0.38 * hash11(gid * 1.91 + seed * 37. + part * 5.);
      // (further still, where a bundle is only a pixel or two, the gaps close up: a solid plume, not a dot screen)
      float aSheet = step(sn, lenG) * mix(1., step(0.36, gf), smoothstep(0.5, 0.72, sn) * (1. - smoothstep(1.2, 3., fw)));
      alpha = mix(alpha, aSheet, sheet);
      if (alpha < 0.5) discard;
      // colour by radius: coral core, crimson mid, wine tip
      vec3 alb = mix(uCoral * vec3(1., 1.3, 1.1), mix(uCrimson, uCoral, 0.18), smoothstep(uCore, 0.95, sn));
      alb = mix(alb, uWine * 1.6, smoothstep(0.78, 1., sn) * 0.75);
      alb *= 0.8 + 0.4 * hash11(id * 0.77 + seed * 5.) * mix(1., 0.5, sheet);
      alb *= 0.9 + 0.2 * vnoise(vec2(fx * 0.06, seed * 7.));                          // slow banding along the ramp                           // filament to filament
      alb = mix(alb, alb * vec3(1.08, 0.8, 0.7), vI.y);                              // animal to animal
      alb = mix(alb, uGold, 0.5 * (1. - sheet) * rod * (1. - smoothstep(0.0, 0.07, sn)));   // gold at the roots
      alb = mix(alb, uGold * 0.8, step(0.5, -vStand) * (1. - smoothstep(0.35, 0.5, sn)));   // a spawning street: gold-hearted to mid-length
      float ndl = dot(N, uSunDir);
      float front = max(ndl, 0.), back = max(-ndl, 0.);
      float ao = mix(0.2, 1., smoothstep(0.03, 0.7, sn)) * mix(mix(0.8, 0.55, uGreat), 1., aa);
      ao = mix(ao, mix(mix(0.8, 0.55, uGreat), 1., aa), step(0.5, -vStand));               // and its heart is not occluded
      // the sun through a whorl: orange-red glow, rods as darker lines
      float vdl = max(dot(-V, uSunDir), 0.);
      vec3 glow = mix(uGlowA, uGlowB, smoothstep(0.15, 0.95, sn)) * (0.75 + 0.5 * hash11(id * 0.77 + seed * 5.));
      vec3 trans = glow * (0.62 * back + 0.5 * vdl * vdl * vdl) * mix(1., 0.45, rod * (1. - sheet));
      vec3 lit = uSunCol * sunK * (alb * (0.16 + 0.55 * front) * ao + trans * mix(0.5, 1., ao));
      lit += alb * fillLightS(N.y, shd) * ao * 0.6;
      lit = mix(lit, uWine * (0.4 + 0.3 * sunK), (1. - ao) * 0.6);                  // self-shadow is wine, never black
      lit = standTint(lit, uCoral, uCrimson, uWine, step(0.5, vStand) * clamp(1. - 2. * shd / 0.85, 0., 1.));   // an old street deepens what is drawn above toward wine, and has let go of it by half of a cloud's shade
      col = lit;
    }
    col.r = min(col.r, 0.9); col = min(col, vec3(0.9));
    gl_FragColor = vec4(col, 1.);
    // the hero's plumes hold their colour through the haze (uFogK < 1), so they are the accent of the far view
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        float fogFactor = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
      #endif
      gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor * uFogK);
    #endif
  }`;

function makePlumeMaterial(U, pal, wine, great) {
  return new THREE.ShaderMaterial({
    defines: { HERO_SHADE: 1 },
    uniforms: {
      ...U, uCoral: { value: pal[2] }, uCrimson: { value: pal[1] }, uWine: { value: wine }, uGold: { value: pal[3] },
      uTurns: { value: great ? 5 : 3.5 }, uGreat: { value: great ? 1 : 0 },
      uLow: { value: great ? 0.8 : 0.42 }, uSlopeLo: { value: great ? -1.3 : 0.1 }, uRoot0: { value: great ? 0.012 : 0.05 }, uSlopeHi: { value: great ? 1.05 : 0.8 },
      uFil: { value: great ? 150 : 90 }, uPin: { value: great ? 46 : 26 }, uSpin: { value: 1 }, uFogK: { value: great ? 0.22 : 0.5 },
    },
    vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, side: THREE.DoubleSide, fog: true,
  });
}

// Shared with the world module so the forest's own plumes and pipes are shaded by the very same code.
export const heroKit = { GLSL_COMMON, PLUME_VERT, PLUME_FRAG, plumeGeometry, makeTubeMaterial, makeSink, lathe, tubeProfile, sinkToGeometry };
heroKit.STANDS = STANDS;   // the streets' field, handed to the world's shaders beside the kit; live's export line above stays as it is

// ---- build ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('twin-spire') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = hex.map((h) => new THREE.Color(h));
  const wine = opts.wine ? new THREE.Color(opts.wine) : pal[1].clone().multiplyScalar(0.34).lerp(new THREE.Color('#7A1426'), 0.6);
  // sun: 56 deg up, 65 deg left of the final heading (which is local -Z)
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.906 * 0.559, 0.829, -0.423 * 0.559)).normalize();
  await ctx.yield?.();
  const fogU = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const U = {
    ...fogU,
    uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Color('#FFF4DA').multiplyScalar(1.15) },
    uFill: { value: new THREE.Color('#8FD6C8').lerp(new THREE.Color('#ffffff'), 0.3).multiplyScalar(0.7) }, uTeal: { value: pal[5] },
    uShade: { value: 0 }, uShadeY: { value: 400 }, uTime: { value: 0 },
    uCore: { value: opts.core ?? 0.2 },
    uGlowA: { value: new THREE.Vector3(...(opts.glowA || [0.95, 0.30, 0.09])) }, uGlowB: { value: new THREE.Vector3(...(opts.glowB || [0.85, 0.07, 0.04])) },
    uFlinchT: { value: 0 }, uFlinchG: { value: new THREE.Vector2(0, 0) }, uCamFlinch: { value: 16 },
    uStand: { value: new THREE.Vector4(0, 0, 0, 0) }, uStandW: { value: new THREE.Vector2(1, 0) },      // the forest's streets are not painted on the Spire
  };
  const group = new THREE.Group(); group.name = 'twin-spire';

  // 1. pipes, hoop and buttress roots: one merged mesh
  await ctx.yield?.();
  const pipes = await layoutPipes(rng, ctx);
  await ctx.yield?.();
  const sink = makeSink();
  let pipeN = 0;
  for (const p of pipes) {
    if ((++pipeN & 15) === 0) await ctx.yield?.();
    const rich = p.master === 1;
    p.axis = (y) => { const f = Math.max(0, y) / p.H; return [p.x + p.lx * y + p.bow * f * f, p.z + p.lz * y + (rich ? 0 : p.bow * 0.6 * Math.sin(f * 3.1))]; };
    p.seed = rng();
    lathe(sink, tubeProfile(rng, p.H, p.R, rich), rich ? 24 : 8, p.axis, p.seed, p.H, rich ? 12 : 4);
    const m = p.axis(p.H); p.mouth = new THREE.Vector3(m[0], p.H, m[1]);
  }
  await ctx.yield?.();
  // the hoop: one ivory tube bent into a ring, growth rings running round it
  const hoopR = 8.15, hoopT = 1.12, hoopSeed = rng(), wob = rng.range(0, TAU);
  const tmp = new THREE.Vector3();
  sweep(sink, (t) => { const a = t * TAU; const r = hoopR + 0.12 * Math.sin(a * 5 + wob); return tmp.set(Math.cos(a) * r, RING_Y + Math.sin(a) * r, 0.25 * Math.sin(a * 2 + wob)); },
    (t) => hoopT * (1 + 0.1 * Math.sin(t * TAU * 7 + wob) + 0.14 * Math.pow(Math.abs(Math.cos(t * TAU)), 6)), 72, 12, hoopSeed, true, 1);
  await ctx.yield?.();
  // six buttress roots, three to each master pipe, flared where they fuse
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (const sg of [-1, 1]) {
    const master = pipes[sg < 0 ? 0 : 1];
    const struts = [[40, 6.5, 1.3], [-46, -14, -1.2], [-74, -27, 1.6]];
    for (const [deg, dy, dz] of struts) {
      const phi = (deg + rng.range(-5, 5)) * Math.PI / 180;
      const a0 = [sg * Math.cos(phi) * hoopR, RING_Y + Math.sin(phi) * hoopR, 0];
      const yEnd = RING_Y + dy + rng.range(-1.5, 1.5), mx = master.axis(yEnd)[0];
      const b0 = [mx - sg * (master.R * 0.75), yEnd, dz * rng.range(0.8, 1.3)];
      const c0 = [(a0[0] + b0[0]) * 0.5 + sg * rng.range(-0.6, 0.4), (a0[1] + b0[1]) * 0.5 + (dy > 0 ? 1.4 : -2.4) * rng.range(0.7, 1.2), b0[2] * 0.8];
      const thick = rng.range(0.62, 0.82);
      sweep(sink, (t) => { const k = 1 - t; A.fromArray(a0).multiplyScalar(k * k); B.fromArray(c0).multiplyScalar(2 * k * t); C.fromArray(b0).multiplyScalar(t * t); return tmp.copy(A).add(B).add(C); },
        (t) => thick * (1 + 0.9 * Math.pow(1 - t, 4) + 1.3 * Math.pow(t, 4)), 14, 8, rng(), false, 1);
    }
  }
  await ctx.yield?.();
  const tubeMat = makeTubeMaterial(U, pal, true);
  const tubes = new THREE.Mesh(sinkToGeometry(sink), tubeMat);
  await ctx.yield?.();
  tubes.geometry.computeBoundingSphere();
  group.add(tubes);
  await ctx.yield?.();

  // 2. terrace plumes: one per lower pipe
  const lower = pipes.filter((p) => !p.master), nT = lower.length;
  const tGeo = plumeGeometry(detail < 0.8 ? 10 : 12, 2, 3.5, 1);
  const iRoot = new Float32Array(nT * 3), iSize = new Float32Array(nT * 4), iOrder = new Float32Array(nT * 2);
  lower.forEach((p, i) => {
    const Hp = rng.range(8.5, 15) * (p.rank === 4 ? 0.85 : 1);
    const Rp = Math.min(Hp * rng.range(0.4, 0.5), p.rank === 0 ? 3.8 : 9);
    iRoot.set([p.mouth.x, p.mouth.y - 0.4, p.mouth.z], i * 3);
    iSize.set([Hp, Rp, rng.sign(), rng()], i * 4);
    iOrder.set([Math.min(0.98, (p.H / 150) * 0.92 + rng.range(0, 0.05)), Math.pow(rng(), 2)], i * 2);
    p.plumeTop = p.H + Hp;
  });
  tGeo.setAttribute('iRoot', new THREE.InstancedBufferAttribute(iRoot, 3));
  tGeo.setAttribute('iSize', new THREE.InstancedBufferAttribute(iSize, 4));
  tGeo.setAttribute('iOrder', new THREE.InstancedBufferAttribute(iOrder, 2));
  tGeo.instanceCount = nT;
  const terraceMat = makePlumeMaterial(U, pal, wine, false);
  const terrace = new THREE.Mesh(tGeo, terraceMat); terrace.frustumCulled = false;
  group.add(terrace);
  await ctx.yield?.();

  // 3. the two great plumes, wound opposite ways
  const gGeo = plumeGeometry(48, 5, 5, 10);
  const hand = rng.sign(), GH = 114, GR = 27.5;
  const m0 = pipes[0].mouth, m1 = pipes[1].mouth;
  gGeo.setAttribute('iRoot', new THREE.InstancedBufferAttribute(new Float32Array([m0.x, m0.y - 0.5, m0.z, m1.x, m1.y - 0.5, m1.z]), 3));
  gGeo.setAttribute('iSize', new THREE.InstancedBufferAttribute(new Float32Array([GH, GR, hand, rng(), GH * rng.range(0.96, 1.03), GR, -hand, rng()]), 4));
  gGeo.setAttribute('iOrder', new THREE.InstancedBufferAttribute(new Float32Array([0, rng() * 0.3, 1, rng() * 0.3]), 2));
  gGeo.instanceCount = 2;
  const greatMat = makePlumeMaterial(U, pal, wine, true);
  const great = new THREE.Mesh(gGeo, greatMat); great.frustumCulled = false;
  group.add(great);
  await ctx.yield?.();

  // 4. mist columns breathed from the two mouths after the retreat (camera-facing puffs, one draw call)
  const nPuff = Math.round(14 * detail) * 2;
  const mGeo = new THREE.InstancedBufferGeometry();
  mGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  mGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const iM = new Float32Array(nPuff * 3);
  for (let i = 0; i < nPuff; i++) iM.set([i % 2, (Math.floor(i / 2) + rng() * 0.6) / (nPuff / 2), rng()], i * 3);
  mGeo.setAttribute('iM', new THREE.InstancedBufferAttribute(iM, 3));
  mGeo.instanceCount = nPuff;
  const mistMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uMist: { value: new THREE.Vector2(0, 0) }, uMouth: { value: [m0.clone(), m1.clone()] },
      uWind: { value: new THREE.Vector3(0.3, 0, -0.95) }, uMint: { value: pal[6] } },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      attribute vec3 iM;
      uniform vec2 uMist; uniform vec3 uMouth[2]; uniform vec3 uWind; uniform float uTime;
      uniform vec3 uSunDir;
      varying vec2 vQ; varying vec3 vA; varying vec2 vS;
      #include <fog_pars_vertex>
      void main() {
        float m = iM.x, age = fract(iM.y + uTime * 0.12), seed = iM.z;
        float amt = mix(uMist.x, uMist.y, m);
        vec3 c = mix(uMouth[0], uMouth[1], m);
        c.y += -1. + age * 30. * (0.35 + 0.65 * amt);
        c += uWind * (age * age * 11. + sin(uTime * 0.6 + seed * 20.) * age * 1.5);
        c.xz += (vec2(hash(seed), hash(seed + 0.37)) - 0.5) * (1. + age * 5.);
        float size = (3.0 + age * 10.5) * (0.8 + 0.4 * seed);
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.);
        mvPosition.xy += position.xy * size;
        vQ = position.xy; vA = vec3(amt * sin(3.14159 * age) * (1. - 0.5 * age), seed, age);
        vec3 sv = (viewMatrix * vec4(uSunDir, 0.)).xyz; vS = sv.xy / max(length(sv.xy), 0.2);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`.replace('void main()', 'float hash(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }\n      void main()'),
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uMint;
      varying vec2 vQ; varying vec3 vA; varying vec2 vS;
      #include <fog_pars_fragment>
      void main() {
        float d = length(vQ);
        float n = vnoise(vQ * 2.2 + vA.y * 30. + vec2(0., -uTime * 0.25)) * 0.55 + vnoise(vQ * 5. + vA.y * 11. + vec2(0., -uTime * 0.4)) * 0.3 + vnoise(vQ * 11. + vA.y * 7.) * 0.15;
        // mist, not a white ball: torn at the edge, thin enough to see through, lit on the sun's side and grey-cool on the other
        float a = (1. - smoothstep(0.1, 0.95, d + (n - 0.5) * 1.0)) * vA.x * 0.72 * (0.5 + 0.7 * n);
        if (a < 0.004) discard;
        float sunSide = smoothstep(-0.7, 0.6, dot(vQ, vS) + (n - 0.5) * 0.6);
        vec3 col = uMint * (uSunCol * (1. - uShade) * (0.14 + 0.8 * sunSide) * (0.7 + 0.5 * n) + fillLight(0.6) * mix(0.6, 1., sunSide));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mist = new THREE.Mesh(mGeo, mistMat); mist.frustumCulled = false; mist.renderOrder = 3;
  group.add(mist);

  // 4a. every terrace pipe breathes a small puff as its plume goes down, so the flinch is seen climbing rank by rank
  const pGeo = new THREE.InstancedBufferGeometry();
  pGeo.setAttribute('position', mGeo.getAttribute('position')); pGeo.setIndex([0, 1, 2, 0, 2, 3]);
  pGeo.setAttribute('iRoot', tGeo.getAttribute('iRoot')); pGeo.setAttribute('iSize', tGeo.getAttribute('iSize')); pGeo.setAttribute('iOrder', tGeo.getAttribute('iOrder'));
  pGeo.instanceCount = nT;
  const puffMat = new THREE.ShaderMaterial({
    defines: { HERO_SHADE: 1 },
    uniforms: { ...U, uWind: mistMat.uniforms.uWind, uMint: { value: pal[6] } }, transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      attribute vec3 iRoot; attribute vec4 iSize; attribute vec2 iOrder;
      uniform float uTime, uFlinchT; uniform vec3 uWind;
      varying vec2 vQ; varying vec3 vA; varying float vY;
      #include <fog_pars_vertex>
      void main() {
        float seed = iSize.w;
        float x = uFlinchT * 1.12 - iOrder.x - 0.02 * seed;                 // > 0 once this pipe's plume has begun to sink
        float burst = smoothstep(0.03, 0.09, x) * (1. - smoothstep(0.12, 0.3, x));
        float breathe = 0.5 * smoothstep(0.1, 0.2, x) * smoothstep(0.1, 0.8, sin(uTime * 0.8 + seed * 40.));
        float amt = max(burst, breathe);
        float age = fract(uTime * 0.4 + seed * 7.);
        vec3 c = iRoot + vec3(0., 1.2 + age * 10., 0.) + uWind * age * age * 7.;
        float size = (2.4 + age * 5.) * (0.8 + 0.5 * fract(seed * 13.));
        vQ = position.xy;
        vec4 wc = modelMatrix * vec4(c, 1.);
        vec4 mvPosition = viewMatrix * wc;
        mvPosition.xy += position.xy * size * step(0.004, amt);
        vA = vec3(amt * sin(3.14159 * age) * smoothstep(14., 40., length(mvPosition.xyz)), seed, age); vY = wc.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uMint;
      varying vec2 vQ; varying vec3 vA; varying float vY;
      #include <fog_pars_fragment>
      void main() {
        float d = length(vQ);
        float n = vnoise(vQ * 2.2 + vA.y * 30. + vec2(0., -uTime * 0.3)) * 0.6 + vnoise(vQ * 5. + vA.y * 11.) * 0.4;
        float a = (1. - smoothstep(0.2, 1., d + (n - 0.5) * 0.6)) * vA.x * 0.6;
        if (a < 0.004) discard;
        float shd = SHADE_AT(vY);
        vec3 col = uMint * (uSunCol * (1. - shd) * (0.7 + 0.45 * n) + fillLightS(0.6, shd) * 1.25);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const puffsT = new THREE.Mesh(pGeo, puffMat); puffsT.frustumCulled = false; puffsT.renderOrder = 3;
  group.add(puffsT);

  // 4b. gold motes sieved by the great plumes (additive glints, the only thing here meant to bloom)
  const nMote = Math.round(240 * detail);
  const oGeo = new THREE.InstancedBufferGeometry();
  oGeo.setAttribute('position', mGeo.getAttribute('position')); oGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const iO = new Float32Array(nMote * 4);
  for (let i = 0; i < nMote; i++) { const a = rng() * TAU, r = 4 + 34 * Math.sqrt(rng()); iO.set([(i % 2 ? m1.x : m0.x) + Math.cos(a) * r, rng(), Math.sin(a) * r, rng()], i * 4); }
  oGeo.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 4));
  oGeo.instanceCount = nMote;
  const moteMat = new THREE.ShaderMaterial({
    uniforms: { ...U, uGold: { value: pal[3] } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    vertexShader: /* glsl */`
      attribute vec4 iO; uniform float uTime, uShade, uShadeY;
      varying vec2 vQ; varying float vK;
      #include <fog_pars_vertex>
      void main() {
        float seed = iO.w, age = fract(iO.y + uTime * (0.012 + 0.01 * seed));
        vec3 c = vec3(iO.x, 132. + age * 125., iO.z);
        float sw = uTime * 0.25 + seed * 40.;
        c.xz += vec2(sin(sw + c.y * 0.05), cos(sw * 0.8 + c.y * 0.04)) * 3.;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.);
        float size = max(0.16, -mvPosition.z * 0.0016) * (0.7 + 0.6 * seed);
        mvPosition.xy += position.xy * size;
        float tw = 0.55 + 0.45 * sin(uTime * (1.2 + seed * 1.6) + seed * 60.);
        vK = tw * sin(3.14159 * age) * (1. - 0.75 * uShade * (1. - smoothstep(uShadeY - 16., uShadeY + 16., c.y))) * min(1., 0.16 / max(size * 0.5, 0.08) + 0.35);
        vQ = position.xy;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold; varying vec2 vQ; varying float vK;
      #include <fog_pars_fragment>
      void main() {
        float d = dot(vQ, vQ);
        float a = (1. - smoothstep(0.05, 1., d)) * vK;
        gl_FragColor = vec4(uGold * 3.2 * a, 1.);
        #include <fog_fragment>
      }`,
  });
  const motes = new THREE.Mesh(oGeo, moteMat); motes.frustumCulled = false; motes.renderOrder = 4;
  group.add(motes);

  // 4c. the ring's own light, seen through the red veil before the great plumes go down (one additive quad)
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uMint: { value: pal[6] }, uGlow: { value: 0 }, uTime: U.uTime }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * 15., 0., 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMint; uniform float uGlow, uTime; varying vec2 vQ;
      void main() {
        float d = length(vQ) * 15. / 7.2;
        float disc = 1. - smoothstep(0.82, 1.0, d);
        float halo = exp(-max(d - 1., 0.) * 3.2) * 0.35;
        float sw = 0.82 + 0.18 * sin(atan(vQ.y, abs(vQ.x) < 1e-5 ? 1e-5 : vQ.x) * 3. + d * 5. - uTime * 0.8);
        gl_FragColor = vec4(uMint * (disc * 0.8 * sw + halo * 0.7) * uGlow, 1.);
      }`,
  });
  const ringGlow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
  ringGlow.position.set(0, RING_Y, 0.4); ringGlow.frustumCulled = false; ringGlow.renderOrder = 5;
  group.add(ringGlow);

  // 5. anchors (local space)
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const w = 0.7071;
  const anchors = {
    portalSeat: { position: V(0, RING_Y, 0), normal: V(0, 0, 1), radius: 7 },
    approach: [V(0, 42, 245), V(0, 78, 162), V(0, 128, 85), V(0, RING_Y, 30), V(0, RING_Y, 0)],
    flyThrough: [V(0, RING_Y, 100), V(0, RING_Y, 60), V(0, RING_Y, 30), V(0, RING_Y, 0), V(0, RING_Y, -30), V(0, RING_Y, -70)],
    climb: [V(-46 * w, 22, -46 * w), V(-43 * w, 52, -43 * w), V(-41 * w, 80, -41 * w), V(-40 * w, 108, -40 * w), V(-40 * w, 132, -40 * w)],
    orbit: [V(-40 * w, 132, -40 * w), V(-6, 152, -52), V(48, 166, -50), V(88, 172, 0), V(92, 166, 62), V(56, 156, 112), V(16, 151, 122), V(0, RING_Y, 100)],
    viewpoints: { veil: V(0, 146, 62), gears: V(60, 200, 150), far: V(-120, 60, 300) },
    mouths: [m0.clone(), m1.clone()],
    greatPlumeCentre: [V(m0.x, 205, 0), V(m1.x, 205, 0)],
    greatPlumeRadius: GR, veilBottomY: 137, masterPipeX: MASTER_X,
  };

  // 6. progress: everything scripted hangs off these, never the clock
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const heal = (t) => Math.min(1, Math.max(0, ss(0, 1, t) + 0.09 * Math.sin(9 * t) * (1 - t)));   // unfurl, overshoot, wobble
  const state = { driven: false, mist: mistMat.uniforms.uMist.value };
  function setFlinch(terraces, west, east, mistW, mistE) {
    state.driven = true;
    U.uFlinchT.value = terraces; U.uFlinchG.value.set(west, east ?? west);
    tubeMat.uniforms.uOpen.value = 1 - terraces;
    if (mistW !== undefined) state.mist.set(mistW, mistE ?? mistW);
  }
  function setProgress(u) {
    const tw = ss(0.80, 0.8435, u), te = ss(0.811, 0.8545, u);
    const mw = ss(0.835, 0.865, u) * (1 - 0.4 * ss(0.9, 1, u)), me = ss(0.846, 0.876, u) * (1 - 0.4 * ss(0.9, 1, u));
    setFlinch(ss(0.775, 0.802, u), tw, te, mw, me);
    U.uShade.value = 0.85 * ss(0.772, 0.80, u);
  }
  function demo(time) {                                                    // 30 s loop for judging the piece alone
    const t = ((time % 30) + 30) % 30;
    const back = 1 - heal((t - 24.5) / 4), backG = 1 - heal((t - 25) / 4.5);
    U.uFlinchT.value = ss(16, 17.6, t) * back;
    U.uFlinchG.value.set(ss(17.5, 19.5, t) * backG, ss(18, 20, t) * (1 - heal((t - 25.6) / 4.5)));
    tubeMat.uniforms.uOpen.value = 1 - U.uFlinchT.value;
    state.mist.set(ss(19, 20.5, t) * (1 - ss(23.5, 26.5, t)), ss(19.5, 21, t) * (1 - ss(24, 27, t)));
    U.uShade.value = 0.85 * ss(15.8, 17.6, t) * (1 - ss(24, 25.5, t));
  }

  return {
    object: group,
    radius: 42, height: 252, center: V(0, 150, 0),
    anchors, uniforms: { ...U, uWind: mistMat.uniforms.uWind, uMist: mistMat.uniforms.uMist, uRingGlow: glowMat.uniforms.uGlow }, setProgress, setFlinch,
    update(dt, time) {
      U.uTime.value = time;
      if (!state.driven) demo(time);
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
