// The Hanging Meadow: hero set piece for "hanging-sea-lilies" (182 million years ago, Toarcian shelf sea, Holzmaden).
// A waterlogged conifer trunk awash at the sea's ceiling and, hanging beneath it, a colony of the sea lily
// Seirocrinus: 300 jointed ropes of 2-18 m, all trailing 20 degrees down-drift, each ending in a crown of ten
// feathered arms hung mouth-down. Everything that looks like a flower here is an animal; there is no plant.
//
// LOCAL SPACE  origin = middle of the trunk at the water line (y 0 is the sea's ceiling); the trunk lies along x
//   (root flare at -x, splintered break at +x); the wind pushes it toward +z, so the colony trails toward -z.
//   The piece hangs DOWN: it occupies x -9.6..9.6, y 0..-18.5, z +0.5..-8. radius 13, height 18, center (0,-9.5,-3.2).
//   Front is +z (the entry looks toward -z and the sun, so the crowns are backlit). ground: false (there is no floor).
//
// opts
//   palette   brief palette (7 hex): [0] level water, [1] upward water, [2] silver / sky, [3] saffron, [4] rose, [5] wood, [6] deep
//   detail    0.6-1 (default ctx.quality.detail or 1): halves the oysters, far crowns get eight arms; never fewer stems or crowns
//   crowns    'saffron' | 'coral' | 'lemon'   (seeded when absent: 60 / 20 / 20 %)
//   colony    'full' 300 | 'sparse' 200 | 'crowded' 400 stems (seeded when absent); gate crowns and the outline never change
//   backdrop  default true: the piece brings its own water dome, ceiling plane with Snell's window, and 16 sun shafts so
//             it can be judged alone. The world passes backdrop: false and builds its own from the exported WATER_GLSL.
//   sunDir    unit vector TOWARD the sun, local space (default 0.16, 0.819, -0.55: refracted, 35 degrees off vertical)
//   glow      strength of light through the arms (default 1)
//
// RETURNS (besides the contract)
//   uniforms            the shared uniform set (uTime, uSunDir, uCamL, uGain, uHalf, uAmbient, uSun, water colours ...):
//                       put the same objects into the world's own water materials so everything agrees.
//   setLight({ambient, sun, gain, half})   fill, sun, water brightness, the distance over which contrast halves (55 m)
//   setWake(pos, dir)   THE PROGRESS HOOK. Crowns clench when our wake reaches them: about 3 m ahead of pos along dir
//                       and within 3 m of that line; they stay shut past us and reopen over the next 14 m behind.
//                       It is stateless (a function of pos and dir only), so it follows u exactly when the world calls
//                       setWake(path position at u, path tangent at u) each frame. Left alone the piece uses the camera
//                       it is given in update() and that camera's own motion. setWake(null) returns to that.
//   variant, colony, stems (rest data of every stem: rx, rz, L, crown (Vector3), near, gate)
//   altColors           a second crown colour (rose with cream tips; saffron when the meadow itself is coral) for the further
//                       rafts whose spec says alt: 1 (buildSatellites), so the flight has a second accent
//
// anchors (local space)
//   flyThrough   the whole camera line the colony was built around, in order: underLog (3 m beneath the trunk on its
//                up-drift side, root flare to break), leadIn (left round the +x tassel), helix (57 points: 1.75 turns to
//                the left round the central bell, radius 6 -> 5, y -5 -> -15, axis leaning with the stems, crossing the
//                two lanes at x +-5.5 four times), exit (down-drift), teardrop (wide right-hand turn in open water,
//                rising to y -6), dive (13 points, the last straight: 60 m heading -x, diving 20 degrees, passing
//                2-3 m under the six lowest gate crowns, which hang to y -18.6). Each part is also given by name. No stem or crown rests within 1.6 m
//                of underLog, leadIn, helix, exit or dive (plus its own sway); the 22 gate crowns hang 1.8-2.2 m from it.
//   portalSeat   { position, facing (unit normal toward the arriving camera), dir (travel direction), radius 7 }:
//                the end of the dive, at (-9.4, -24.0, -6.9), 10 m beyond the lowest crowns, which hang across its upper
//                edge on the approach. Use portal tilt: true.
//   entry        { position, dir }: 70 m out, three-quarter on to the curtain, the sun beyond the raft and to the left.
//   gateCrowns (22 rest positions), bellFoot (lowest crown), lanes, helixAxis, logEnds, stubs, viewpoints, sunDir, lean.
//
// WHAT MOVES  the trunk rolls 6 degrees each way every 7 s and heaves with the swell; every stem sways with a lag that
//   runs down its length at 3 m/s; arms breathe, single arms flick (each about every 9 s), a crown now and then
//   clenches of its own accord (each about every 83 s), and crowns clench for our wake. All in vertex shaders.
//
// COST  about 137k triangles ('crowded' 142k, 'sparse' 99k), 6 draw calls (9 with the backdrop), no lights, no
//   textures, no shadows; build about 100-200 ms in steps of a few ms each. Everything is made at build.
//
// LIGHTING  none from the scene: the piece shades itself (custom ShaderMaterials, linear HDR out, scene fog honoured).
//   Sun = uSunDir, cut by an analytic shadow blade under the trunk (logShade) and a slow caustic net above y -12;
//   fill = the green water from all sides (uAmbient). Arms are two-sided and brightest with the sun BEHIND them.
//   Every material fades to waterColor(view direction) with distance, half every 55 m. Bloom gently (about 0.35).
//   waterColor has two keys: jade near the surface going to dusk blue with depth, and gold-green toward the sun (uWarm).
//   Far off, two ropes in three thin away and crowns are drawn larger, so a distant colony is lanterns on threads.
//
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2A9478', '#5FC6A0', '#E9F6E4', '#F2B631', '#C9577A', '#3A2A1E', '#0A1F1E'];
const LEAN = 20 * Math.PI / 180;          // the colony trails 20 degrees off vertical toward -z
const LOG_HALF = 9, LOG_R = 0.35;         // the trunk: 18 m along x, 0.7 m thick, awash at y 0
const ROLL_AMP = 6 * Math.PI / 180, ROLL_W = 2 * Math.PI / 7;   // rolls 6 degrees each way every 7 s

// ---------------------------------------------------------------------------------------------------------
// Shared GLSL. WATER_GLSL is exported so the world's own shaders (dome, ceiling, animals) fade to the same
// water: waterColor(dir, y) is silver-jade up, the palette jade level, black-green down; waterFade(col, pL)
// halves contrast every 55 m; logShade(p) is the analytic shadow blade under the trunk; caust(p) the slow net.
// All positions are in the hero's local space (the world may translate the hero; uCamL is the camera there).
// ---------------------------------------------------------------------------------------------------------
export const WATER_GLSL = /* glsl */`
uniform float uTime, uGain, uHalf, uWarm;
uniform vec3 uSunDir, uCamL, uWUp, uWLevel, uWDown, uWSilver;
vec3 waterColor(vec3 d, float y){
  // Three bands and two keys, so no frame is one teal: a pale sunlit layer under the surface that turns GOLD-GREEN
  // toward the sun, jade at eye level near the surface, and a blue deep: the level tone itself goes from jade to a
  // dusk blue as the line of sight ends deeper (y), and looking down it falls to a dark blue-green.
  float up = smoothstep(-.04, .6, d.y), dn = smoothstep(-.02, .72, -d.y);
  float deepK = clamp(-y/34., 0., 1.), dk = smoothstep(.12, .8, deepK);
  vec3 lvl = mix(uWLevel, uWLevel*vec3(.42, .62, 1.12) + vec3(0., .0, .03), dk);
  vec3 c = mix(lvl, uWUp, up);
  c = mix(c, uWSilver, smoothstep(.45, 1., d.y)*.5);
  c *= 1. + .28*up;
  c = mix(c, mix(uWDown, uWDown*vec3(.55, .8, 1.25), dk), dn*.94);
  c *= mix(1.1, .5, deepK);                                   // darker with depth
  float s = max(dot(d, uSunDir), 0.); s *= s; s *= s;          // the water glows toward the sun
  // THE WARM KEY (second polish, bolder): toward the sun the whole upper water is honey-gold, falling through
  // gold-green to jade at a right angle to it; away from the sun the water is a cooler, bluer jade. So the flight
  // changes key with its heading: gold when we swim into the light, blue-jade with the sun behind, indigo in the deep.
  vec3 sl = uSunDir*vec3(1., .3, 1.); sl /= max(length(sl), 1e-4);
  float sd = dot(d, sl), w = max(sd, 0.); w = w*w*w*smoothstep(-.12, .42, d.y)*(1. - .7*dk)*uWarm;   // a glow high in the water toward the sun; level water stays jade behind the crowns
  w *= 1. - .55*smoothstep(.45, .95, d.y);                      // straight up it is the window's business, not the water's
  // (fifth polish) CLEAN light: the wide lobe only lifts the jade to a pale, luminous aquamarine (no hue shift, so
  // never olive); the gold is a tight, bright core where the sun itself burns through, laid in as light, not as a tint
  float wc = w*w; wc *= wc*sqrt(max(w, 0.));                    // about the 13th power of the cosine: a core 25 degrees wide
  c = mix(c, c*vec3(.92, 1.06, 1.02) + vec3(.05, .16, .13), clamp(w*1.2, 0., 1.)*.7);
  c = mix(c, vec3(1.42, .86, .22)*(.6 + .9*dot(c, vec3(.3, .5, .2))), clamp(wc*1.6, 0., 1.)*.9);
  float aw = max(-sd, 0.); aw = aw*aw*(1. - .5*up)*uWarm;       // the side away from the sun: cooler and a step deeper
  c = mix(c, c*vec3(.62, .86, 1.16), clamp(aw, 0., 1.)*.7);
  return c*uGain*(1. + .3*s*s + .3*w*w);
}
float waterT(vec3 pL){ return exp2(-distance(pL, uCamL)/max(uHalf, 1.)); }
vec3 waterFade(vec3 col, vec3 pL){
  vec3 d = pL - uCamL; float l = max(length(d), 1e-4);
  d /= l;
  return mix(waterColor(d, uCamL.y + d.y*30.), col, exp2(-l/max(uHalf, 1.)));   // the same call the dome makes: no veil
}
float logShade(vec3 p){                                        // 0 in the blade of shadow under the trunk, 1 in sun
  float k = -p.y/max(uSunDir.y, .25);
  vec3 q = p + uSunDir*k;
  float inZ = 1. - smoothstep(.4, 1.0 + k*.02, abs(q.z));
  float inX = 1. - smoothstep(-.4, .5, abs(q.x) - ${LOG_HALF.toFixed(1)});
  float deep = 1. - smoothstep(14., 24., k);
  return 1. - inZ*inX*deep*.82;
}
float caust(vec3 p){                                           // soft net, cells about 0.6 m, drifting 0.3 m/s
  vec2 q = p.xz*5.2 + p.y*vec2(1.9, 1.3) + uTime*vec2(1.5, .9);
  q += 1.1*sin(q.yx*.57 + uTime*.35);
  float v = abs(sin(q.x) + sin(q.y) + sin((q.x + q.y)*.71 + 1.3));
  float net = 1. - smoothstep(0., .9, v);
  return net*smoothstep(-13., -3., p.y);
}
float hash11(float n){ return fract(sin(n*12.9898 + 4.1414)*43758.5453); }
`;

// The towed line. Every stem, cup and arm calls this, so a crown always sits exactly on the end of its rope.
// aRoot = (root x, root z, length, phase), aShape = (lean at the log, lean at the crown, sideways lean, sway).
const STEM_GLSL = /* glsl */`
uniform float uHeave, uRollK;
float rollAt(float t){ return uRollK*${ROLL_AMP.toFixed(5)}*sin(${ROLL_W.toFixed(5)}*t); }
vec3 stemPos(vec4 root, vec4 shp, float t){
  float L = root.z, d = t*L;
  float lagT = uTime - d/3.;                                   // whatever the log does runs down the rope at 3 m/s
  float ra = rollAt(lagT), cr = cos(ra), sr = sin(ra);
  vec3 r0 = vec3(root.x, -${(LOG_R * 0.93).toFixed(3)}, root.y);
  vec3 rr = vec3(r0.x, r0.y*cr - r0.z*sr, r0.y*sr + r0.z*cr);
  float keep = exp(-d/9.);
  vec3 p = r0 + (rr - r0)*keep + vec3(0., uHeave*keep, 0.);     // d = 0: exactly on the rolling, heaving wood
  float da = shp.y - shp.x;                                    // never zero: the builder keeps |da| >= 0.08
  float al = shp.x + da*t;
  float zi = (cos(shp.x) - cos(al))/da, yi = (sin(al) - sin(shp.x))/da;
  float cx = cos(shp.z), sx = sin(shp.z);
  p += L*vec3(sx*t, -yi*cx, -zi);
  float ph = uTime*.9 - d*.30 + root.w;
  float amp = shp.w*(.022*d + .05*smoothstep(0., 3., d));
  p.x += amp*sin(ph) + amp*.35*sin(ph*2.3 + root.w*3.);
  p.z += amp*.8*sin(ph*.83 + 1.7 + root.w*2.) - ra*keep*d*.25;
  // (fifth polish) a long rope is LIMP: a second, shorter wave (9 m long, creeping down it) lays a lazy S along it,
  // so no stalk is ever a dead-straight rod in any view
  float ph2 = uTime*.5 - d*.6 + root.w*2.7, amp2 = shp.w*min(.045*d, .5)*smoothstep(1.5, 4.2, distance(p, uCamL));   // (it straightens within 4 m of the eye: the path law holds)
  p.x += amp2*sin(ph2); p.z += amp2*.75*cos(ph2*1.13 + root.w);
  return p;
}
vec3 stemTan(vec4 root, vec4 shp, float t){
  float e = .012;
  vec3 a = stemPos(root, shp, max(t - e, 0.)), b = stemPos(root, shp, min(t + e, 1.));
  return (b - a)/max(length(b - a), 1e-5);
}
`;

// The same curve on the CPU (rest pose, no sway), for layout, the path law and the anchors.
function stemRest(rx, rz, L, a0, a1, xl, t, out) {
  const da = a1 - a0, al = a0 + da * t;
  const zi = (Math.cos(a0) - Math.cos(al)) / da, yi = (Math.sin(al) - Math.sin(a0)) / da;
  return out.set(rx + L * Math.sin(xl) * t, -LOG_R * 0.93 - L * yi * Math.cos(xl), rz - L * zi);
}

function lin(hex) { return new THREE.Color(hex); }

// Uniforms shared by every material of the piece (one object, so update() writes each value once).
function makeUniforms(pal, sunDir) {
  const up = lin(pal[1]), level = lin(pal[0]), down = lin(pal[6]), silver = lin(pal[2]);
  return {
    uTime: { value: 0 }, uGain: { value: 1.55 }, uHalf: { value: 55 }, uHeave: { value: 0 },
    uSunDir: { value: sunDir.clone() }, uCamL: { value: new THREE.Vector3(0, -6, 60) },
    uWUp: { value: up }, uWLevel: { value: level }, uWDown: { value: down }, uWSilver: { value: silver },
    uWakePos: { value: new THREE.Vector3(0, 500, 0) }, uWakeDir: { value: new THREE.Vector3(0, 0, -1) },
    uWarm: { value: 1 }, uPx: { value: 0.0015 }, uAmbient: { value: 0.55 }, uSun: { value: 1.0 }, uRollK: { value: 1 },
  };
}

function shader(U, extra, vertexShader, fragmentShader, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader, fragmentShader, fog: true, ...o,
  });
}

// ---------------------------------------------------------------------------------------------------------
// The camera line (local space). THE PATH IS THE LAW: stems are reseeded until none comes within 1.6 m of it,
// then gate crowns are hung 1.8-2.2 m to either side of it. The world coder flies exactly these points.
// ---------------------------------------------------------------------------------------------------------
const zAx = (y) => y * Math.tan(LEAN);                         // where the middle of the curtain is at depth y
function helixPoint(th, out) {
  const f = clamp((th - Math.PI / 2) / (3.5 * Math.PI), 0, 1);
  const y = lerp(-5, -15, f), r = lerp(6, 5, f);
  return out.set(r * Math.cos(th), y, zAx(y) - r * Math.sin(th));
}
function makeRoute() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const underLog = [V(-13, -4.2, 2.4), V(-10.5, -3.6, 2.2), V(-5, -3.6, 2.2), V(0, -3.6, 2.2), V(5, -3.6, 2.2), V(9.5, -3.8, 2.2)];
  const leadIn = [V(11.9, -3.9, 1.2), V(12.6, -4.0, -0.8), V(11.7, -4.15, -2.9), V(9.5, -4.3, -3.9), V(6.5, -4.5, -5.3), V(3.2, -4.75, -6.9)];
  const helix = [];
  for (let i = 0; i <= 56; i++) helix.push(helixPoint(Math.PI / 2 + (i / 56) * 3.5 * Math.PI, V(0, 0, 0)));
  const last = helix[helix.length - 1];                         // in the +x lane, heading down-drift (-z)
  const exit = [V(last.x + 0.3, -15.6, last.z - 5), V(last.x + 1.8, -15.9, last.z - 11)];
  const c20 = Math.cos(LEAN), s20 = Math.sin(LEAN);
  const diveDir = V(-c20, -s20, 0), under = V(0, -20.6, -6.9);  // the last straight passes 2.5 m under the lowest crowns
  const portal = under.clone().addScaledVector(diveDir, 10);   // the ring hangs just beyond the bell's foot: the last crowns frame it
  const dive = [];
  for (let i = 0; i <= 12; i++) dive.push(portal.clone().addScaledVector(diveDir, -60 + i * 5));
  const gateTh = [Math.PI, 2 * Math.PI, 3 * Math.PI, 4 * Math.PI];
  return { underLog, leadIn, helix, exit, dive, diveDir, under, portal, gateTh, all: [...underLog, ...leadIn, ...helix, ...exit, ...dive] };
}
function distToRoute(route, p) {                               // distance from p to the polyline pieces
  let best = 1e9;
  for (const seg of [route.underLog, route.leadIn, route.helix, route.exit, route.dive]) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = seg[i], b = seg[i + 1];
      const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
      const t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / (abx * abx + aby * aby + abz * abz), 0, 1);
      const dx = a.x + abx * t - p.x, dy = a.y + aby * t - p.y, dz = a.z + abz * t - p.z;
      const d = dx * dx + dy * dy + dz * dz; if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}

// A stem whose crown rests at (x, y, z): bisect the lean that reaches that z at that depth.
function solveStem(x, y, z, spread, ph, sw) {
  const tmp = new THREE.Vector3(); let lo = 0.16, hi = 0.52, L = 2;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    stemRest(0, 0, 1, m + spread, m - spread, 0, 1, tmp);
    L = (-y - LOG_R * 0.93) / ((Math.sin(m + spread) - Math.sin(m - spread)) / (2 * spread));
    stemRest(0, 0, L, m + spread, m - spread, 0, 1, tmp);
    if (-tmp.z < -z) lo = m; else hi = m;
  }
  const m = (lo + hi) / 2;
  return { rx: x, rz: 0, L, a0: m + spread, a1: m - spread, xl: 0, sw, ph, gate: 1 };
}

async function layoutColony(ctx, R, route, count) {
  const nearCap = count > 300 ? 80 : 96;
  const stems = [], tmp = new THREE.Vector3(), crowns = [];
  const env = (x) => 18 * (1 - 0.62 * Math.pow(Math.abs(x) / 3.5, 1.6));  // the bell: longest in the middle
  // 1. gate crowns, hand-seeded slots beside the path
  route.gateTh.forEach((th, gi) => {
    const c = helixPoint(th, new THREE.Vector3());
    for (let k = 0; k < 4; k++) {
      const side = k < 2 ? -1 : 1, lead = k % 2 ? 1 : -1;
      const off = R.range(1.8, 2.2), y = c.y + lead * R.range(0.25, 0.6) - 0.1;
      const z = zAx(y) + lead * side * R.range(0.1, 0.35) * Math.min(1, -y / 8);
      stems.push(solveStem(c.x + side * off, y, z, R.range(0.10, 0.15), R.range(0, 6.28), R.range(0.7, 1.0)));
    }
  });
  for (let k = 0; k < 6; k++) {                                // six over the last straight, overhead and to each side
    const x = -1.7 + k * 0.85 + R.range(-0.15, 0.15), side = k % 2 ? 1 : -1;
    const lineY = route.under.y + (x - route.under.x) * Math.tan(LEAN);   // the dive rises toward +x
    const y = Math.max(lineY + R.range(1.7, 2.2), -18.6);
    stems.push(solveStem(x, y, route.under.z + side * R.range(1.0, 1.6), 0.12, R.range(0, 6.28), 0.8));
  }
  for (const s of stems) { stemRest(s.rx, s.rz, s.L, s.a0, s.a1, s.xl, 1, tmp); crowns.push(tmp.clone()); }
  // 2. the rest: a central bell and two end tassels, reseeded until clear of the path and of each other
  const nBell = Math.round(count * 0.6) - 22, nTassel = Math.round(count * 0.2);
  const groups = [[nBell, 0], [nTassel, 1], [nTassel, -1]];
  for (const [n, g] of groups) {
    for (let i = 0; i < n; i++) {
      let s = null;
      for (let tries = 0; tries < 44; tries++) {
        const u = R(), v = R(), w = R(), ph = R.range(0, 6.28), g1 = R.gauss(), g2 = R.gauss(), sp = R.range(0.09, 0.16), sw = R.range(0.6, 1.15), rzr = R.range(-0.2, 0.2);
        let rx, Lmax;
        if (g === 0) { rx = (u * 2 - 1) * 3.5; rx = Math.sign(rx) * Math.pow(Math.abs(rx) / 3.5, 0.85) * 3.5; Lmax = env(rx); }
        else { rx = g * (7.35 + u * 1.5); Lmax = 10.5 - 2.5 * Math.abs(u - 0.45) * 2; }
        const longOne = i < n * 0.2;                             // a fifth of them trace the outline
        let L = longOne ? Lmax * (1 - 0.08 * v) : 2 + (Lmax - 2) * (0.04 + 0.96 * Math.sqrt(v));
        if (tries > 30) L *= 0.7;
        const m = clamp(LEAN + 0.01 + g1 * 0.075, 0.2, 0.5);        // the curtain is 2-4 m thick: end-on it is a loose fan, never a slanted sheet
        const c = { rx, rz: rzr, L: Math.max(L, 2), a0: m + sp, a1: m - sp, xl: clamp(g2 * 0.03, -0.07, 0.07) * (g === 0 ? 1 : 0.6), sw, ph, gate: 0 };
        // keep the bunches inside their own columns so the lanes stay open all the way down
        let ok = true;
        const reach = 0.5 + 0.03 * c.L * c.sw;                   // crown radius plus sway
        for (let k = 1; k <= 10 && ok; k++) {
          stemRest(c.rx, c.rz, c.L, c.a0, c.a1, c.xl, k / 10, tmp);
          const need = k === 10 ? 1.6 + reach * 0.5 : 1.6 + 0.022 * c.L * (k / 10) * c.sw;
          if (distToRoute(route, tmp) < need) ok = false;
          const ax = Math.abs(tmp.x); if (ax > 3.9 && ax < 7.1) ok = false;
        }
        if (ok) for (const o of crowns) { if (o.distanceToSquared(tmp) < (w < 0.3 ? 0.36 : 0.62) * (tries > 16 ? 0.55 : 1)) { ok = false; break; } }
        if (ok) { s = c; crowns.push(tmp.clone()); break; }
      }
      if (s) stems.push(s);
      await ctx.yield();
    }
  }
  // 3. the crowns that ever come close to the eye get the detailed arm
  stems.forEach((s, i) => { s.crown = crowns[i]; s.dPath = distToRoute(route, crowns[i]); });
  const order = stems.map((s, i) => i).sort((a, b) => stems[a].dPath - stems[b].dPath);
  order.forEach((i, rank) => { stems[i].near = rank < 80 || stems[i].dPath < 6; });
  let nNear = 0; for (const s of stems) if (s.near) nNear++;
  if (nNear > nearCap) order.forEach((i, rank) => { stems[i].near = rank < nearCap; });
  return stems;
}

// ---------------------------------------------------------------------------------------------------------
// Light. The sun (refracted, 35 degrees off vertical) and the green fill of the whole water column.
// litWater(albedo, N, p, back): N must face the viewer; back = how much of the sun comes THROUGH the surface.
// ---------------------------------------------------------------------------------------------------------
export const LIGHT_GLSL = /* glsl */`
uniform float uAmbient, uSun;
vec3 sunAt(vec3 p){ return mix(vec3(1., .96, .82), vec3(1.12, .9, .58), clamp(uWarm, 0., 1.))*uSun*logShade(p)*(1. + .7*caust(p))*exp2(p.y/26.); }   // a morning sun is gold
vec3 ambAt(vec3 N, float y){ return mix(uWLevel*1.5 + vec3(.05, .12, .10), uWSilver*.8, .30 + .30*N.y)*uAmbient*mix(1., .6, clamp(-y/40., 0., 1.)); }
`;

const STEM_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WATER_GLSL}
${STEM_GLSL}
uniform float uPx;
attribute vec4 aRoot, aShape;
varying vec3 vP, vS; varying vec2 vUv; varying float vCov, vTone, vKeep;
void main(){
  float t = position.y;
  vTone = fract(aRoot.w*7.31 + aRoot.x*3.7);                       // every rope its own tone, so a far curtain stays a crowd of threads
  vec3 p = stemPos(aRoot, aShape, t), T = stemTan(aRoot, aShape, t);
  vec3 V = uCamL - p; float dist = max(length(V), 1e-3); V /= dist;
  vec3 S = cross(T, V); S /= max(length(S), 1e-4);
  float r = mix(.0125, .006, t)*(1. + 2.2*exp(-t*aRoot.z*4.));     // swollen where it grips the wood
  float rr = max(r, dist*uPx*mix(.78, .52, smoothstep(10., 30., dist)));                                 // never thinner than a pixel and a half
  // Far off, two ropes in three thin away (each at its own distance, slowly), so a distant colony stays single
  // threads with lanterns on them and never closes into a striped sheet.
  float hK = fract(aRoot.w*13.7 + aRoot.x*1.31 + aRoot.y*.77), dRoot = distance(vec3(aRoot.x, -5., aRoot.y), uCamL);
  vKeep = 1. - smoothstep(hK*36. + 12., hK*36. + 19., dRoot)*step(hK, .72);
  rr *= vKeep;
  vCov = r/rr;
  p += S*position.x*rr;
  vP = p; vS = S; vUv = vec2(position.x, t*aRoot.z);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STEM_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${WATER_GLSL}
${LIGHT_GLSL}
uniform vec3 uUmber, uBead; uniform float uPx;
varying vec3 vP, vS; varying vec2 vUv; varying float vCov, vTone, vKeep;
void main(){
  vec3 V = uCamL - vP; float dist = max(length(V), 1e-3); V /= dist;
  float x = clamp(vUv.x, -1., 1.), nz = sqrt(max(1. - x*x, 0.));
  vec3 N = vS*x + V*nz; N /= max(length(N), 1e-4);
  float near = 1. - smoothstep(.0035, .011, dist*uPx);             // beads only while a 4 cm joint is several pixels long
  float fr = abs(fract(vUv.y/.04) - .5);                           // a pale bead every 4 cm: the stacked ossicles
  float bead = smoothstep(.30, .42, fr);
  float groove = smoothstep(.0, .08, fr)*.5 + .5;                  // the dark joint between two ossicles
  vec3 alb = mix(uUmber, uBead, mix(.13, bead*.42, near))*mix(1., .7 + .3*groove, near);
  float d = max(dot(N, uSunDir), 0.), rim = 1. - nz;
  vec3 am = ambAt(N, vP.y); am = mix(am, vec3(dot(am, vec3(.3, .5, .2))), .45);
  vec3 col = alb*1.2*(am*(.22 + .78*nz*nz) + sunAt(vP)*(.2 + .9*d + .5*rim*rim));
  // Far off a rope is a DARK thread: it fades toward a tone below the level water, never toward the bright water
  // above (behind it is the mirror of the surface, not the sky), and it holds that tone further than the water does.
  vec3 dir = -V, dlo = vec3(dir.x, min(dir.y, -.03), dir.z); dlo /= max(length(dlo), 1e-4);
  vec3 bg = waterColor(dlo, uCamL.y + dlo.y*30.);
  float cov = clamp(vCov, 0., 1.);
  float tone = .55 + .9*clamp(vTone, 0., 1.);
  vec3 dark = bg*vec3(.2, .24, .26)*mix(1., 2.1, smoothstep(5., 26., dist));   // a far rope is a dark thread, but each layer of the curtain is a step paler than the one in front: depth, not a scribble
  col = mix(dark, col*mix(.5, 1., cov)*tone, max(sqrt(cov), .3)*mix(.7, 1., clamp(vTone, 0., 1.)));
  vec3 farC = mix(waterColor(dir, uCamL.y + dir.y*30.), dark*mix(1., 1.9, clamp(vTone, 0., 1.)), exp2(-dist/120.));
  vec3 outc = mix(farC, col, exp2(-dist/max(uHalf*1.5, 1.)));
  gl_FragColor = vec4(mix(waterColor(dir, uCamL.y + dir.y*30.), outc, clamp(vKeep, 0., 1.)), 1.);
  #include <fog_fragment>
}`;

// One arm of a crown. position = (across -1..1, along 0..1, segments). The curve is integrated in the vertex
// shader so that opening, the single-arm flicks and the clench into a fist are all the same few lines.
const ARM_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WATER_GLSL}
${STEM_GLSL}
uniform float uPx, uCup;
uniform vec3 uWakePos, uWakeDir;
attribute vec4 aRoot, aShape, aArm;                                // aArm = azimuth, seed, length, crown seed
varying vec3 vP; varying vec3 vUv; varying float vClench;
float armAngle(float s, float cl, float fl, float sd, float opn){
  float k = smoothstep(.60, 1., s);
  float open = 1.52*opn - 1.22*smoothstep(.04, .62, s) - 4.4*k*sqrt(k);  // out, round into the bowl wall, then the crozier
  open += .09*sin(uTime*.7 + sd*40. + s*3.)*(1. - k) - fl*1.7*s*(1. - .6*k);
  float shut = .62 - 2.5*s - 1.6*s*s;
  return mix(open, shut, cl);
}
void main(){
  vec3 c = stemPos(aRoot, aShape, 1.), A = stemTan(aRoot, aShape, 1.);
  A = normalize(A + vec3(0., -.12, -.22));                         // mouth down and a little down-drift
  vec3 X = cross(A, vec3(1., 0., 0.)); X /= max(length(X), 1e-4);
  vec3 Y = cross(A, X);
  // clench: our wake reaches the crown about 3 m before we draw level; it stays shut past us and reopens behind
  vec3 dW = c - uWakePos; float along = dot(dW, uWakeDir), lat = length(dW - along*uWakeDir);
  float cw = (1. - smoothstep(2.7, 3.5, lat))*(1. - smoothstep(2.4, 4.2, along))*smoothstep(-14., -1.5, along);
  float f = fract(uTime/83. + aArm.w);
  float sp = smoothstep(0., .006, f)*(1. - smoothstep(.008, .05, f));
  float cl = max(cw, sp);
  float ft = fract(uTime*.105 + aArm.y*7.31);
  float fl = smoothstep(0., .03, ft)*(1. - smoothstep(.04, .2, ft));
  float dC = distance(c, uCamL);
  float ph = aArm.x, len = aArm.z*mix(1., .92, cl)*(1. + 1.25*smoothstep(18., 70., dC));   // far lanterns are drawn a little large, so a far bell is a cloud of lights on threads
  vec3 Rd = cos(ph)*X + sin(ph)*Y, Bn = cross(A, Rd);
  float n = max(position.z, 1.), sv = position.y, th = 0.;
  float opn = mix(.78, 1.1, hash11(aArm.w*3.7));                   // some crowns hold their bowl wider than others
  vec2 q = vec2(.032, .0);
  for (int i = 0; i < 14; i++){
    float fi = float(i), seg = clamp(sv*n - fi, 0., 1.);
    th = armAngle((fi + .5*seg)/n, cl, fl, aArm.y, opn);
    q += seg*(len/n)*vec2(sin(th), cos(th));
  }
  th = armAngle(sv, cl, fl, aArm.y, opn);
  vec3 Tn = sin(th)*Rd + cos(th)*A, Nn = cos(th)*Rd - sin(th)*A;
  vec3 p = c + Rd*q.x + A*(q.y + .03);
  vec3 V = uCamL - p; float dist = max(length(V), 1e-3);
  float hw = (.118*sqrt(max(sv, 0.))*sqrt(max(1. - sv, 0.))*(1. - .3*sv) + .007)*mix(1., .5, cl);   // a feather: widest two fifths of the way out   // a feather: widest a third of the way out
  hw = max(hw, dist*uPx*1.1);
  float vee = mix(.55, 1.15, cl);
  p += Bn*position.x*hw*cos(vee) - Nn*abs(position.x)*hw*sin(vee);
  if (uCup > .5) {                                                 // the cup: position is a point of a small lofted calyx
    p = c + (X*position.x + Y*position.z)*.78 + A*position.y*.8;
  }
  vP = p; vUv = vec3(position.x, sv, aArm.y); vClench = cl;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ARM_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${WATER_GLSL}
${LIGHT_GLSL}
uniform vec3 uCupCol, uArmCol, uTipCol;
uniform float uCup, uGlow, uPx;
varying vec3 vP; varying vec3 vUv; varying float vClench;
void main(){
  vec3 V = uCamL - vP; float dist = max(length(V), 1e-3); V /= dist;
  vec3 G = cross(dFdx(vP), dFdy(vP)); float glen = length(G);
  vec3 N = glen > 1e-12 ? G/glen : V;
  if (dot(N, V) < 0.) N = -N;
  float w = abs(vUv.x), s = vUv.y;
  float near = (1. - smoothstep(.0028, .0075, dist*uPx))*(1. - uCup);   // the comb only while a tooth is a few pixels wide
  // the comb: fine side branches each side of the midrib, slanting toward the tip, with water between them
  float tooth = abs(fract(s*30. - w*1.1) - .5)*2.;
  float gap = smoothstep(mix(.25, -.2, w), mix(.75, .45, w), tooth)*smoothstep(.16, .3, w);
  if (gap*near > .5) discard;
  vec3 alb = mix(uArmCol, uTipCol, smoothstep(.56, .9, s));
  alb = mix(uCupCol, alb, smoothstep(.0, .22, s));
  float rib = 1. - smoothstep(.04, .15, w);
  alb *= mix(vec3(1.), vec3(.5, .34, .28), rib*(1. - uCup));                            // the darker midrib
  alb *= mix(1., .78, (1. - near)*.5)*(.86 + .28*hash11(vUv.z*31.7));
  if (uCup > .5) alb = uCupCol*(.55 + .45*smoothstep(-.02, .05, vUv.y))*(.8 + .2*sin(vUv.x*60.));
  float fr = max(dot(N, uSunDir), 0.), bk = max(dot(-N, uSunDir), 0.);
  float halo = max(dot(-V, uSunDir), 0.); halo *= halo; halo *= halo;
  vec3 sun = sunAt(vP);
  vec3 am = ambAt(N, vP.y); am = mix(am, vec3(dot(am, vec3(.3, .5, .2)))*1.25, .8);   // crowns keep their own colour in green light
  float thin = (1. - .8*uCup)*(.75 + .5*w);                               // the combs are thinner than the midrib: more light through
  float ao = mix(.5, 1., smoothstep(0., .5, s))*(.8 + .2*w);                // deeper inside the bowl and along the groove
  vec3 col = alb*ao*(am*.85 + sun*(.55*fr + uGlow*thin*(1.9*bk + 1.5*halo) + .12));
  col += alb*alb*sun*uGlow*thin*(2.0*bk + 1.2*halo);                       // lit through: deeper and more saturated                                    // deeper, more saturated where it is lit through
  col *= mix(1., .8, vClench);
  col *= 1. + .9*smoothstep(14., 60., dist);                               // far crowns are a few pixels: keep the accent at strength
  float mx = max(col.r, max(col.g, col.b)); col *= 1.02/max(mx, 1.02);     // lit through they glow, but stay saffron: never bleached to white against the bright surface
  vec3 dv = -V;
  gl_FragColor = vec4(mix(waterColor(dv, uCamL.y + dv.y*30.), col, exp2(-dist/max(uHalf*1.7, 1.))), 1.);   // warm light carries further than the dark
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------
// The raft: a waterlogged conifer trunk and the crust of oysters and mussels under it. Both roll and heave in
// the vertex shader with the same rollAt(time) the stems hang from, so nothing ever comes unstuck.
// ---------------------------------------------------------------------------------------------------------
const LOG_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${WATER_GLSL}
uniform float uHeave, uRollK;
attribute vec3 aCol; attribute float aTint;
varying vec3 vP, vN, vL, vCol; varying vec2 vUv2; varying float vTint;
float rollAt(float t){ return uRollK*${ROLL_AMP.toFixed(5)}*sin(${ROLL_W.toFixed(5)}*t); }
void main(){
  vec3 p = position, n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix*vec4(p, 1.)).xyz; n = mat3(instanceMatrix)*n;
    vTint = aTint;
  #else
    vTint = 0.;
  #endif
  vL = p;
  float ra = rollAt(uTime), cr = cos(ra), sr = sin(ra);
  p = vec3(p.x, p.y*cr - p.z*sr + uHeave, p.y*sr + p.z*cr);
  n = vec3(n.x, n.y*cr - n.z*sr, n.y*sr + n.z*cr);
  vP = p; vN = n; vCol = aCol; vUv2 = uv;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LOG_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${WATER_GLSL}
${LIGHT_GLSL}
uniform vec3 uWood, uShellA, uShellB;
uniform float uShell;
varying vec3 vP, vN, vL, vCol; varying vec2 vUv2; varying float vTint;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y);
}
void main(){
  vec3 V = uCamL - vP; float dist = max(length(V), 1e-3); V /= dist;
  vec3 N = vN/max(length(vN), 1e-4);
  vec3 alb;
  if (uShell < .5) {
    vec2 g = vec2(vUv2.x, vL.x);
    float warp = vnoise(g*vec2(3., .6))*1.5;
    float grain = vnoise(vec2(g.x*26. + warp, g.y*.8));
    float groove = smoothstep(.28, .62, vnoise(vec2(g.x*52. + warp*2., g.y*1.7 + 9.)));
    float plates = smoothstep(.46, .58, vnoise(vec2(g.x*2.6 + 3., g.y*.5)) + .08*grain);
    alb = uWood*(2.7 + 5.2*grain);                                       // dark wet wood, but wood: the grain and the bare plates read from below
    alb = mix(alb*.55, alb*2.4 + vec3(.03, .026, .018), plates*.8);      // bark gone in plates: paler bare wood
    alb *= mix(.3, 1., groove)*vCol.y;
    float under = smoothstep(.0, .8, -vL.y/max(length(vL.yz), 1e-3));
    float crust = under*smoothstep(.42, .7, vnoise(g*vec2(9., 3.) + 17.));
    float dots = smoothstep(.55, .8, vnoise(g*vec2(70., 22.) + 5.));       // barnacle and spat speckle in the crust
    alb = mix(alb, uShellA*(.34 + .5*dots), crust*.75);                  // limy crust on the underside
    alb = mix(alb, alb*vec3(1.5, 1.02, .7), .5*vnoise(g*vec2(1.3, .35) + 31.));   // wet conifer wood is red-brown in places
    alb = mix(alb, uWood*3.2 + vec3(.03, .025, .01), vCol.x*(.6 + .4*grain));   // raw splintered heartwood
  } else {
    if (!gl_FrontFacing) N = -N;
    float ribs = .62 + .38*vCol.x, lines = .82 + .18*sin(vCol.y*46.);
    alb = mix(uShellA, uShellB, vTint)*ribs*lines*(.55 + .45*vCol.y)*.8;
  }
  float d = max(dot(N, uSunDir), 0.);
  vec3 am = ambAt(N, vP.y); am = mix(am, vec3(dot(am, vec3(.3, .5, .2)))*vec3(1.08, 1., .9), mix(.9, .92, uShell));
  vec3 col = alb*(am*mix(1.0, 1.35, uShell) + sunAt(vP)*(1.3*d + .04));
  float fres = 1. - max(dot(N, V), 0.); fres *= fres;
  col += fres*fres*uWLevel*.05*(1. - uShell);                             // wet sheen picks up the water
  // a trunk seen from below is ROUND: its flanks take the light scattered sideways through the water and the sun's
  // net crawls a little way round them, so the underside is a dark keel between two lit edges, never a flat bar
  float side = 1. - abs(N.y); side *= side;
  col = col*mix(.62, 1., uShell) + alb*(side*(.26*uWUp + .5*sunAt(vP)*smoothstep(-.5, .3, N.y)) + fres*.12*uWUp)*(1. - uShell)*uAmbient;   // and the wood itself stays the one true dark
  vec3 dv = -V, dlo = vec3(dv.x, min(dv.y, -.03), dv.z); dlo /= max(length(dlo), 1e-4);   // the one true dark: it holds its tone twice as far as the rest
  vec3 farC = mix(waterColor(dv, uCamL.y + dv.y*30.), waterColor(dlo, uCamL.y + dlo.y*30.)*.5, exp2(-dist/160.));
  gl_FragColor = vec4(mix(farC, col, exp2(-dist/max(uHalf*2.3, 1.))), 1.);
  #include <fog_fragment>
}`;

// The trunk, lofted ring by ring: root flare at -x with buttress lobes, a splintered break at +x, five stubs.
function buildLogGeometry(R, noise, NA = 20, NX = 58, lite = false) {
  const pos = [], uvs = [], col = [], idx = [];
  const ring = (x, rFn, cy, cz, shade, raw, xJit) => {
    const base = pos.length / 3;
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2, r = rFn(a);
      pos.push(x + (xJit ? xJit(j % NA) : 0), cy + r * Math.cos(a), cz + r * Math.sin(a));
      uvs.push(j / NA, x); col.push(raw, shade, 0);
    }
    return base;
  };
  const stitch = (b0, b1, n) => { for (let j = 0; j < n; j++) idx.push(b0 + j, b0 + j + 1, b1 + j, b0 + j + 1, b1 + j + 1, b1 + j); };
  const lobeN = 5, lobePh = R.range(0, 6.28);
  let prev = -1;
  const spikes = []; for (let j = 0; j < NA; j++) spikes.push((R() < 0.4 ? R.range(0.3, 1.0) : R.range(0, 0.25)) * 0.45);   // short splinters: a break, not a claw
  for (let i = 0; i <= NX; i++) {
    const f = i / NX, x = -LOG_HALF + f * 2 * LOG_HALF;
    const flare = Math.pow(1 - smoothstep(0, 0.16, f), 2);               // 0.35 -> 0.8 m at the root end
    const tip = smoothstep(0.9, 1.0, f);
    const cy = 0.05 * Math.sin(x * 0.31 + 1) - 0.04 * flare, cz = 0.06 * Math.sin(x * 0.23 + 2.4);
    const rFn = (a) => {
      const kn = noise.n2(a * 1.3 + 7, x * 0.5) * 0.06 + noise.n2(Math.cos(a) * 3 + x * 2.2, Math.sin(a) * 3) * 0.02;   // knots and swellings: a trunk, not a spar
      const lobes = flare * (0.45 + 0.16 * Math.cos(a * lobeN + lobePh) + 0.07 * Math.cos(a * 2 + 1));
      return (LOG_R * (1 - 0.12 * f) + kn + lobes) * (1 - 0.5 * tip * tip);
    };
    const b = ring(x, rFn, cy, cz, 1, tip > 0.6 ? 1 : 0, i === NX ? (j) => spikes[j] : (i === NX - 1 ? (j) => spikes[j] * 0.45 : null));
    if (prev >= 0) stitch(prev, b, NA);
    prev = b;
  }
  // end caps: the sawn-off look is wrong for a storm-thrown tree, so the root end is a knuckled dome and the break a hollow
  const capAt = (x, r0, dir, raw, depth) => {
    let pb = -1;
    for (let k = 0; k <= 3; k++) {
      const s = k / 3, b = ring(x + dir * depth * Math.sin(s * 1.57), (a) => Math.max(r0(a) * Math.cos(s * 1.5), 0.012), 0, 0, 0.75 - 0.3 * s, raw);
      if (pb >= 0) { if (dir > 0) stitch(pb, b, NA); else stitch(b, pb, NA); }
      pb = b;
    }
  };
  capAt(-LOG_HALF, (a) => LOG_R + 0.45 + 0.16 * Math.cos(a * lobeN + lobePh) + 0.07 * Math.cos(a * 2 + 1), -1, 0.4, 0.28);
  capAt(LOG_HALF + 0.05, () => LOG_R * 0.36, 1, 1, -0.35);
  // five broken branch stubs, 0.5-2 m, tapered, slightly kinked, ending in a ragged break
  const stubs = [];
  for (let s = 0; s < 5; s++) {
    const x0 = -5.5 + s * 2.9 + R.range(-0.8, 0.8), ang = R.range(-1.2, 1.2) + (s % 2 ? Math.PI * 0.5 : -Math.PI * 0.55) + Math.PI / 2;
    const len = s === 1 ? R.range(1.5, 2.0) : R.range(0.5, 1.3), r0 = 0.07 + 0.035 * len;
    const dir = new THREE.Vector3(R.range(0.15, 0.5), Math.cos(ang), Math.sin(ang)).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(dir).normalize(), v = dir.clone().cross(u);
    stubs.push({ x: x0, dir, len });
    let pb = -1; const NS = lite ? 5 : 8, NR = lite ? 3 : 5;
    for (let k = 0; k <= NR; k++) {
      const t = k / NR, base = pos.length / 3, rad = r0 * (1.5 - 0.5 * smoothstep(0, 0.25, t)) * (1 - 0.45 * t);
      const kink = 0.08 * len * Math.sin(t * 3 + s);
      for (let j = 0; j <= NS; j++) {
        const a = (j / NS) * Math.PI * 2, jag = k === NR ? ((j * 7 + s * 3) % 5) * 0.05 * len * 0.6 : 0;
        const d = LOG_R * 0.75 + t * len + jag;
        pos.push(x0 + dir.x * d + (u.x * Math.cos(a) + v.x * Math.sin(a)) * rad + kink * u.x,
          dir.y * d + (u.y * Math.cos(a) + v.y * Math.sin(a)) * rad + kink * u.y,
          dir.z * d + (u.z * Math.cos(a) + v.z * Math.sin(a)) * rad + kink * u.z);
        uvs.push(j / NS, x0 + t * len * 3); col.push(k === NR ? 1 : 0, 1, 0);
      }
      if (pb >= 0) stitch(pb, base, NS);
      pb = base;
    }
  }
  // the root plate (second polish: a far raft read as a plank): six broken roots splay from the flare and curl
  // back, so the end of every trunk is the foot of a storm-thrown TREE. No draws from R: the layout after is unchanged.
  const hr = (i) => { const q = Math.sin(i * 12.9898 + lobePh * 3.1) * 43758.5453; return q - Math.floor(q); };
  for (let s = 0; s < 6; s++) {
    const ang = (s / 6) * 6.2832 + lobePh + (hr(s) - 0.5) * 0.9, len = (s % 2 ? 0.5 : 0.8) + 0.5 * hr(s + 7), r0 = 0.17 + 0.07 * hr(s + 13);   // (fifth polish) short, stout and BLUNT: the knuckled foot of a tree, not a claw of spikes
    const rad0 = new THREE.Vector3(0, Math.cos(ang), Math.sin(ang)), dir = new THREE.Vector3(-0.8, rad0.y * 0.6, rad0.z * 0.6).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(dir).normalize(), v = dir.clone().cross(u);
    let pb = -1; const NS = lite ? 5 : 7, NR = lite ? 4 : 6;
    for (let k = 0; k <= NR; k++) {
      const t = k / NR, base = pos.length / 3, rad = r0 * (1 - 0.5 * t) * (1 + 0.5 * (1 - t) * (1 - t)) * (k === NR ? 0.55 : 1) + 0.01, curl = 0.55 * len * t * t + 0.08 * len * Math.sin(t * 5 + s * 2.1) * t, back = 0.5 * len * t * t;
      for (let j = 0; j <= NS; j++) {
        const a = (j / NS) * Math.PI * 2, jag = k === NR ? ((j * 5 + s * 3) % 4) * 0.02 : 0, d = t * len + jag;
        pos.push(-LOG_HALF + 0.25 + dir.x * d + back + (u.x * Math.cos(a) + v.x * Math.sin(a)) * rad,
          rad0.y * (0.42 + curl) + dir.y * d + (u.y * Math.cos(a) + v.y * Math.sin(a)) * rad,
          rad0.z * (0.42 + curl) + dir.z * d + (u.z * Math.cos(a) + v.z * Math.sin(a)) * rad);
        uvs.push(j / NS, -LOG_HALF + t * len * 2); col.push(k === NR ? 1 : 0, 0.9, 0);
      }
      if (pb >= 0) stitch(pb, base, NS);
      pb = base;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return { geometry: g, stubs };
}

function logRadiusAt(x) {
  const f = (x + LOG_HALF) / (2 * LOG_HALF);
  return LOG_R * (1 - 0.12 * f) + Math.pow(1 - smoothstep(0, 0.16, f), 2) * 0.42;
}

// One valve of an oyster: a ribbed, domed fan with a scalloped lip. Unit radius, hinge at the origin, +y out of the wood.
function buildShellGeometry() {
  const pos = [0, 0.05, 0], col = [0.6, 0.15, 0], idx = [], NA = 6, rings = [0.55, 1];
  rings.forEach((r, k) => {
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA - 0.5) * 3.5, rib = j % 2, rr = r * (1 + (k === 1 ? (rib ? 0.1 : -0.06) : 0));
      pos.push(Math.sin(a) * rr, (k === 0 ? 0.3 : 0.06) + rib * 0.07 * r, Math.cos(a) * rr - 0.15);
      col.push(rib, r, 0);
    }
  });
  for (let j = 0; j < NA; j++) {
    idx.push(0, 1 + j, 2 + j);
    const a = 1 + j, b = 1 + NA + 1 + j;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// The cup (calyx): five-sided like every sea lily, a collar where the rope meets it, a low dome closing the mouth side.
function buildCupGeometry() {
  const prof = [[-0.05, 0.007], [-0.008, 0.02], [0.03, 0.043], [0.06, 0.032], [0.074, 0.0]];
  const pos = [], idx = [], NS = 5;
  prof.forEach(([y, r], k) => {
    for (let j = 0; j <= NS; j++) { const a = (j / NS) * Math.PI * 2 + k * 0.0; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); }
  });
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < NS; j++) {
    const a = k * (NS + 1) + j, b = a + NS + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// position = (across, along, segments): three rows (edge, midrib, edge) for the near arm, two for the far one.
function buildArmGeometry(n, rows) {
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) for (let k = 0; k < rows; k++) pos.push(rows === 3 ? k - 1 : k * 2 - 1, i / n, n);
  for (let i = 0; i < n; i++) for (let k = 0; k < rows - 1; k++) {
    const a = i * rows + k, b = a + rows;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
function buildStemGeometry(n) {
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const t = Math.pow(i / n, 1.25); pos.push(-1, t, 0, 1, t, 0); }   // denser at the swollen base
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// Backdrop (opts.backdrop, on by default so the piece can be judged alone; the world passes backdrop: false and
// builds its own with WATER_GLSL): the water all round, the sea's ceiling with Snell's window, and sun shafts.
// ---------------------------------------------------------------------------------------------------------
const DOME_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p; }`;
const DOME_FRAG = /* glsl */`
${WATER_GLSL}
varying vec3 vD;
void main(){ vec3 d = vD/max(length(vD), 1e-4); gl_FragColor = vec4(waterColor(d, uCamL.y + d.y*30.), 1.); }`;
const CEIL_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const CEIL_FRAG = /* glsl */`
${WATER_GLSL}
uniform vec3 uSkyCol;
varying vec3 vP;
void main(){
  vec3 d = vP - uCamL; float l = max(length(d), 1e-3); d /= l;
  vec2 w = vP.xz;                                                    // swell 9 m long moving with the wind, plus chop
  vec2 n = vec2(.05*sin(w.x*.9 + uTime*.8) + .03*sin(dot(w, vec2(2.1, 1.7)) + uTime*1.7),
                .09*sin(w.y*.698 - uTime*1.6) + .03*sin(dot(w, vec2(-1.6, 2.4)) - uTime*1.3));
  float c = d.y + dot(n, d.xz)*1.2;
  float win = smoothstep(.60, .72, c);                               // Snell's window: 48.6 degrees from straight up
  vec3 sd = d + vec3(n.x, 0., n.y)*.9; sd /= max(length(sd), 1e-4);
  float s = max(dot(sd, uSunDir), 0.); float s2 = s*s; s2 *= s2; s2 *= s2; s2 *= s2;
  vec3 sky = mix(uWUp, uSkyCol, .7)*(.78 + .14*sin(w.x*.21 + 1.)*sin(w.y*.17)) + vec3(1., .97, .88)*(1.6*s2*s2 + .25*s2);
  vec3 mir = waterColor(vec3(d.x + n.x, -.25 - .5*d.y, d.z + n.y)/1.3, -4.)*(.9 + 1.6*abs(n.x + n.y));
  vec3 col = mix(mir, sky, win);
  gl_FragColor = vec4(mix(waterColor(d, uCamL.y + d.y*30.), col, exp2(-l/max(uHalf*1.3, 1.))), 1.);
}`;
const SHAFT_VERT = /* glsl */`
uniform float uTime; uniform vec3 uSunDir, uCamL;
attribute vec4 aShaft;                                               // x, z at the surface, width, phase
varying vec2 vUv; varying float vA;
void main(){
  float len = 26.;
  vec2 o = aShaft.xy + vec2(sin(uTime*.11 + aShaft.w), cos(uTime*.09 + aShaft.w*1.7))*1.6;
  vec3 top = vec3(o.x, 0., o.y), p = top - uSunDir*(position.y*len);
  vec3 V = uCamL - p; vec3 S = cross(uSunDir, V); S /= max(length(S), 1e-4);
  p += S*position.x*aShaft.z*(1. + position.y*.6);
  vUv = vec2(position.x, position.y);
  vA = .5 + .5*sin(uTime*.23 + aShaft.w*5.);
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftCol;
varying vec2 vUv; varying float vA;
void main(){
  float x = 1. - vUv.x*vUv.x; x = max(x, 0.);
  float a = x*x*(1. - smoothstep(.15, 1., vUv.y))*smoothstep(0., .04, vUv.y)*(.35 + .65*vA);
  gl_FragColor = vec4(uShaftCol*a, 1.);
}`;

const CROWN_VARIANTS = {
  saffron: (pal) => ({ cup: lin(pal[3]).multiply(new THREE.Color(1, 0.72, 0.5)), arm: lin(pal[3]), tip: lin(pal[4]) }),
  coral: (pal) => ({ cup: lin(pal[4]), arm: lin(pal[4]).lerp(lin(pal[3]), 0.35), tip: lin('#F6EBCB') }),
  lemon: (pal) => ({ cup: lin(pal[3]), arm: lin('#EFE07A'), tip: lin('#8A3F78') }),
  rose: () => ({ cup: lin('#A63A62'), arm: lin('#D9588A'), tip: lin('#F8E6D0') }),   // the second accent: some of the further colonies (spec.alt)
};

export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const R = ctx.rng.fork('hanging-sea-lilies');                 // one private stream: yields cannot reorder it
  const vr = R(), cr = R();
  const variant = opts.crowns || (vr < 0.6 ? 'saffron' : vr < 0.8 ? 'coral' : 'lemon');
  const colony = opts.colony || (cr < 0.6 ? 'full' : cr < 0.8 ? 'sparse' : 'crowded');
  const count = colony === 'sparse' ? 200 : colony === 'crowded' ? 400 : 300;
  const backdrop = opts.backdrop ?? true;
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(0.16, 0.819, -0.55)).normalize();
  const U = makeUniforms(pal, sunDir);
  const object = new THREE.Group(); object.name = 'hanging-sea-lilies';
  const route = makeRoute();
  await ctx.yield();
  const stems = await layoutColony(ctx, R, route, count);
  await ctx.yield();

  // ---- the raft
  const { geometry: logGeo, stubs } = buildLogGeometry(R, ctx.noise);
  const shellCream = lin('#D8CCB2');
  const logExtra = () => ({ uWood: { value: lin(pal[5]) }, uShellA: { value: shellCream }, uShellB: { value: new THREE.Color(0.07, 0.085, 0.12) }, uShell: { value: 0 } });
  const logMat = shader(U, logExtra(), LOG_VERT, LOG_FRAG, { side: THREE.DoubleSide });
  const log = new THREE.Mesh(logGeo, logMat); log.frustumCulled = false; log.name = 'log'; object.add(log);
  await ctx.yield();
  const nShell = Math.round(400 * (detail < 1 ? 0.5 : 1));
  const shellMat = shader(U, logExtra(), LOG_VERT, LOG_FRAG, { side: THREE.DoubleSide }); shellMat.uniforms.uShell.value = 1;
  const shells = new THREE.InstancedMesh(buildShellGeometry(), shellMat, nShell); shells.frustumCulled = false; shells.name = 'oysters';
  {
    const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), n = new THREE.Vector3(), t = new THREE.Vector3(), b = new THREE.Vector3();
    const tint = new Float32Array(nShell);
    for (let i = 0; i < nShell; i++) {
      const s = stems[Math.floor(R() * stems.length)];
      const x = R() < 0.7 ? clamp(s.rx + R.gauss() * 0.45, -LOG_HALF + 0.1, LOG_HALF - 0.6) : R.range(-LOG_HALF + 0.1, LOG_HALF - 0.6);
      const beta = clamp(R.gauss() * 0.5, -1.4, 1.4), rad = logRadiusAt(x) * 0.93;
      n.set(0, -Math.cos(beta), Math.sin(beta));
      const gam = R.range(0, 6.283), mussel = R() < 0.3, sc = mussel ? R.range(0.04, 0.065) : R.range(0.05, 0.095);
      b.set(1, 0, 0).cross(n).normalize();
      t.set(1, 0, 0).multiplyScalar(Math.cos(gam)).addScaledVector(b, Math.sin(gam));
      Z.copy(t).multiplyScalar(Math.cos(0.4)).addScaledVector(n, Math.sin(0.4)).normalize();     // tilted up like roof tiles
      X.crossVectors(n, Z).normalize(); Y.crossVectors(Z, X);
      m.makeBasis(X.multiplyScalar(sc * (mussel ? 0.55 : 1)), Y.multiplyScalar(sc * (mussel ? 1.5 : 1)), Z.multiplyScalar(sc * (mussel ? 1.5 : 1)));
      m.setPosition(x, 0.05 * Math.sin(x * 0.31 + 1) + n.y * rad, 0.06 * Math.sin(x * 0.23 + 2.4) + n.z * rad);
      shells.setMatrixAt(i, m); tint[i] = mussel ? R.range(0.75, 1) : R.range(0, 0.3);
    }
    shells.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1));
    shells.instanceMatrix.needsUpdate = true;
  }
  object.add(shells);
  await ctx.yield();

  // ---- stems: one instanced ribbon bent into the towed curve in the vertex shader
  const nS = stems.length, aRoot = new Float32Array(nS * 4), aShape = new Float32Array(nS * 4);
  stems.forEach((s, i) => { aRoot.set([s.rx, s.rz, s.L, s.ph], i * 4); aShape.set([s.a0, s.a1, s.xl, s.sw], i * 4); });
  const stemGeo = buildStemGeometry(count > 300 ? 34 : 40);
  stemGeo.setAttribute('aRoot', new THREE.InstancedBufferAttribute(aRoot, 4));
  stemGeo.setAttribute('aShape', new THREE.InstancedBufferAttribute(aShape, 4));
  stemGeo.instanceCount = nS;
  const stemMat = shader(U, { uUmber: { value: lin('#5B4636') }, uBead: { value: lin('#CDBFA0') } }, STEM_VERT, STEM_FRAG, { side: THREE.DoubleSide });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat); stemMesh.frustumCulled = false; stemMesh.name = 'stems'; object.add(stemMesh);
  await ctx.yield();

  // ---- crowns: ten arms each, the detailed arm for the crowns that come near the path
  const vc = CROWN_VARIANTS[variant] ? CROWN_VARIANTS[variant](pal) : CROWN_VARIANTS.saffron(pal);
  const armExtra = (cup) => ({ uCupCol: { value: vc.cup }, uArmCol: { value: vc.arm }, uTipCol: { value: vc.tip }, uCup: { value: cup }, uGlow: { value: opts.glow ?? 1 } });
  const farArms = (detail < 0.8 || count > 300) ? 8 : 10;
  const fill = (list, nArm) => {
    const n = list.length * nArm, r = new Float32Array(n * 4), sh = new Float32Array(n * 4), ar = new Float32Array(n * 4);
    let k = 0;
    for (const s of list) {
      const twist = s.seedA * 6.283;
      for (let a = 0; a < nArm; a++, k++) {
        r.set([s.rx, s.rz, s.L, s.ph], k * 4); sh.set([s.a0, s.a1, s.xl, s.sw], k * 4);
        ar.set([twist + (a / nArm) * 6.283 + (s.jit[a] - 0.5) * 0.24, s.jit[a + 10], 0.5 * s.size * (0.86 + 0.24 * s.jit[a + 20]), s.seedA], k * 4);
      }
    }
    return { n, r, sh, ar };
  };
  for (const s of stems) { s.seedA = R(); s.size = R.range(0.86, 1.12) * (s.L < 4 ? 0.8 : 1); s.jit = []; for (let a = 0; a < 30; a++) s.jit.push(R()); }
  const armMesh = (list, nArm, geo, name) => {
    const f = fill(list, nArm);
    geo.setAttribute('aRoot', new THREE.InstancedBufferAttribute(f.r, 4));
    geo.setAttribute('aShape', new THREE.InstancedBufferAttribute(f.sh, 4));
    geo.setAttribute('aArm', new THREE.InstancedBufferAttribute(f.ar, 4));
    geo.instanceCount = f.n;
    return geo;
  };
  const armMat = shader(U, armExtra(0), ARM_VERT, ARM_FRAG, { side: THREE.DoubleSide });
  const nearList = stems.filter((s) => s.near), farList = stems.filter((s) => !s.near);
  const nearMesh = new THREE.Mesh(armMesh(nearList, 10, buildArmGeometry(14, 3)), armMat); nearMesh.frustumCulled = false; nearMesh.name = 'arms-near'; object.add(nearMesh);
  await ctx.yield();
  const farMesh = new THREE.Mesh(armMesh(farList, farArms, buildArmGeometry(9, 2)), armMat); farMesh.frustumCulled = false; farMesh.name = 'arms-far'; object.add(farMesh);
  await ctx.yield();
  const cupMat = shader(U, armExtra(1), ARM_VERT, ARM_FRAG, { side: THREE.DoubleSide });
  const cupGeo = buildCupGeometry(), cf = fill(stems, 1);
  cupGeo.setAttribute('aRoot', new THREE.InstancedBufferAttribute(cf.r, 4));
  cupGeo.setAttribute('aShape', new THREE.InstancedBufferAttribute(cf.sh, 4));
  cupGeo.setAttribute('aArm', new THREE.InstancedBufferAttribute(cf.ar, 4));
  cupGeo.instanceCount = cf.n;
  const cupMesh = new THREE.Mesh(cupGeo, cupMat); cupMesh.frustumCulled = false; cupMesh.name = 'cups'; object.add(cupMesh);
  await ctx.yield();

  // ---- backdrop for judging the piece alone (the world builds its own from WATER_GLSL and passes backdrop: false)
  let dome = null;
  if (backdrop) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(320, 24, 16), new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -0.5; dome.frustumCulled = false; dome.name = 'water-dome'; object.add(dome);
    const cg = new THREE.PlaneGeometry(1200, 1200); cg.rotateX(Math.PI / 2);
    const ceil = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: { ...U, uSkyCol: { value: lin(pal[2]) } }, vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, side: THREE.DoubleSide }));
    ceil.frustumCulled = false; ceil.name = 'ceiling'; object.add(ceil);
    const sg = new THREE.InstancedBufferGeometry(), sp = [], si = [], NQ = 6;
    for (let i = 0; i <= NQ; i++) sp.push(-1, i / NQ, 0, 1, i / NQ, 0);
    for (let i = 0; i < NQ; i++) { const a = i * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
    const sh = new Float32Array(16 * 4);
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      sh.set([R.range(-17, 17), side * R.range(3.5, 16) - 3, R.range(0.25, 0.9), R.range(0, 6.28)], i * 4);
    }
    sg.setAttribute('aShaft', new THREE.InstancedBufferAttribute(sh, 4)); sg.instanceCount = 16;
    const shafts = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uCamL: U.uCamL, uShaftCol: { value: lin(pal[1]).lerp(lin(pal[2]), 0.5).multiplyScalar(0.075) } },
      vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    shafts.frustumCulled = false; shafts.renderOrder = 5; shafts.name = 'shafts'; object.add(shafts);
  }
  await ctx.yield();

  // ---- anchors (all local space)
  const gates = stems.filter((s) => s.gate).map((s) => s.crown.clone());
  let lowest = stems[0].crown; for (const s of stems) if (s.crown.y < lowest.y) lowest = s.crown;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ex = route.exit[route.exit.length - 1];
  const teardrop = [V(ex.x + 2.6, -15.5, ex.z - 10), V(19, -14, ex.z - 20), V(32, -12, ex.z - 22), V(44, -10, ex.z - 16), V(50, -8.5, -21), V(48, -7.2, -11.5), route.dive[0].clone()];
  const entryDir = V(0.8, 0, -0.6);
  const anchors = {
    entry: { position: route.underLog[0].clone().addScaledVector(entryDir, -70).setY(-6), dir: entryDir },
    underLog: route.underLog, leadIn: route.leadIn, helix: route.helix, exit: route.exit, teardrop, dive: route.dive,
    flyThrough: [...route.underLog, ...route.leadIn, ...route.helix, ...route.exit, ...teardrop, ...route.dive.slice(1)],
    helixAxis: { top: V(0, -5, zAx(-5)), bottom: V(0, -15, zAx(-15)) },
    portalSeat: { position: route.portal.clone(), facing: route.diveDir.clone().negate(), dir: route.diveDir.clone(), radius: 7 },
    gateCrowns: gates, bellFoot: lowest.clone(), lanes: [V(5.5, -9, zAx(-9)), V(-5.5, -9, zAx(-9))],
    logEnds: { rootFlare: V(-LOG_HALF, 0, 0), splinteredTop: V(LOG_HALF, 0, 0) }, stubs,
    viewpoints: {
      whole: V(-34, -7, 42), sideOn: V(48, -7.2, -11.5), underLog: V(-3, -3.6, 2.2), inLane: helixPoint(2 * Math.PI - 0.5, V(0, 0, 0)), underFoot: route.under.clone(),
    },
    sunDir: sunDir.clone(), lean: LEAN, driftDir: V(0, 0, -1),
  };

  const camW = new THREE.Vector3(), camL = new THREE.Vector3(), prev = new THREE.Vector3(), step = new THREE.Vector3(), size = new THREE.Vector2();
  let havePrev = false, manualWake = false;
  const view = { c: new THREE.Vector3(0, -9.5, -3.2), r: 13, h: 18 };
  return {
    object, radius: view.r, height: view.h, center: view.c, anchors,
    ground: false, groundY: -60,
    uniforms: U, variant, colony, stems, palette: pal, crownColors: vc, altColors: CROWN_VARIANTS[variant === 'coral' ? 'saffron' : 'rose'](pal), glow: opts.glow ?? 1,
    // Where our wake is: crowns within ~3 m of this point's line of travel clench ahead of it and reopen behind it.
    // Left alone, the piece takes both from the camera it is given; pass null to go back to that.
    setWake(pos, dir) {
      manualWake = !!pos;
      if (pos) { U.uWakePos.value.copy(pos); if (dir && dir.lengthSq() > 1e-8) U.uWakeDir.value.copy(dir).normalize(); }
    },
    setLight({ ambient, sun, gain, half } = {}) {
      if (ambient !== undefined) U.uAmbient.value = ambient; if (sun !== undefined) U.uSun.value = sun;
      if (gain !== undefined) U.uGain.value = gain; if (half !== undefined) U.uHalf.value = half;
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      U.uHeave.value = 0.13 * Math.sin(time * 1.08) + 0.04 * Math.sin(time * 1.9 + 1);
      if (!camera) return;
      camera.getWorldPosition(camW);
      object.updateWorldMatrix(true, false);
      camL.copy(camW); object.worldToLocal(camL);
      U.uCamL.value.copy(camL);
      if (ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(size);
        U.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1));
      }
      if (!manualWake) {
        if (havePrev) {
          step.subVectors(camL, prev); const l = step.length();
          if (dt > 0 && l > 1e-3 && l < 4) U.uWakeDir.value.lerp(step.multiplyScalar(1 / l), Math.min(1, dt * 6)).normalize();   // (by the clock's own step: none while it stands)
        }
        U.uWakePos.value.copy(camL); prev.copy(camL); havePrev = true;
      }
      if (dome) dome.position.copy(camL);
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------------------------------------
// MORE RAFTS. The sea is full of driftwood: the world hangs further, smaller colonies from further logs, at other
// distances, so that the meadow is one of many and the flight passes through a forest of them. Every one is a
// trunk awash at y 0 with its own ropes and crowns hanging DOWN from it and trailing the same way (-z): nothing
// grows from below. They use the hero's own shaders and uniforms (same water, same sun, same wake: their crowns
// clench for us too); their logs heave with the swell but do not roll (uRollK 0).
//   specs: [{ x, z, yaw, len, n, depth, lanes: [s...], gates: [Vector3...], check }]   (hero-local = world metres)
//     len: trunk length, n: stems, depth: the longest rope, lanes: gaps along the trunk (metres from its middle),
//     gates: places beside the camera line where a crown should hang (solved if a rope can reach them),
//     check: the camera passes near, so every rope is tested with clearOf.
//   clearOf(x, y, z): distance from that point to the camera line (the world's path).
// Returns { object, crowns: [Vector3...], count }.
// ---------------------------------------------------------------------------------------------------------
export async function buildSatellites(ctx, hero, specs, clearOf) {
  const R0 = ctx.rng.fork('hanging-sea-lilies-rafts'), R = R0, U = hero.uniforms, tmp = new THREE.Vector3();
  const object = new THREE.Group(); object.name = 'more-rafts';
  const all = [], crowns = [];
  for (let ci = 0; ci < specs.length; ci++) {
    const sp = specs[ci], Rr = sp.own ? ctx.core.makeRng(7001 + ci * 131 + ((ctx.seed | 0) % 100000)) : R0, half = sp.len / 2, cy = Math.cos(sp.yaw), sy = Math.sin(sp.yaw), lanes = sp.lanes || [];
    const R = Rr;                                                 // (shadows the shared stream inside this raft's layout)
    const rootOf = (sl) => [sp.x + cy * sl, sp.z + sy * sl];
    // every raft hangs its ropes in two to four TASSELS of different depth (as the meadow hangs in three), so its
    // outline is a row of pendants, never a rectangle; R2 is a private stream so the rest of the layout is unchanged
    const R2 = Rr.fork('tassels' + ci), bunches = [], nB = sp.len > 13 ? 4 : sp.len > 10 ? 3 : 2;
    for (let b = 0; b < nB; b++) {
      let c = (-1 + (2 * b + 1) / nB) * (half - 1) + R2.range(-0.7, 0.7);
      for (const l of lanes) if (Math.abs(c - l) < 2.6) c = l + (c >= l ? 2.9 : -2.9);
      bunches.push({ c, w: R2.range(1.0, 1.9) * (sp.len / nB) / 3.6, d: b === Math.floor(nB / 2) ? 1 : R2.range(0.45, 0.95) });
    }
    const push = (c, skip) => { c.col = ci; c.alt = sp.alt ? 1 : 0; c.seedA = R(); c.size = R.range(0.86, 1.12) * (c.L < 4 ? 0.8 : 1); c.jit = []; for (let a = 0; a < 30; a++) c.jit.push(R()); c.dPath = sp.check ? clearOf(c.crown.x, c.crown.y, c.crown.z) : 99; if (!sp.ghost && !skip) { all.push(c); crowns.push(c.crown); } };   // spec.ghost: every draw is made, nothing is built
    for (const g of sp.gates || []) {                            // a crown hung where the world asked for one
      const sl = clamp((g.x - sp.x) / Math.max(cy, 0.2), -half + 0.3, half - 0.3), rt = rootOf(sl);   // the rope hangs in the plane of its root's x
      const c = solveStem(rt[0], g.y, g.z - rt[1], R.range(0.10, 0.15), R.range(0, 6.28), R.range(0.7, 1.0)); c.rz = rt[1];
      stemRest(c.rx, c.rz, c.L, c.a0, c.a1, c.xl, 1, tmp);
      if (tmp.distanceTo(g) < 0.5 && c.L < 22 && clearOf(tmp.x, tmp.y, tmp.z) > 1.7) { c.crown = tmp.clone(); push(c, g.skip); if (g.dress) c.dPath = Math.min(c.dPath, 5); }   // dress: a crown the camera looks at from further off still gets the detailed arm
    }
    for (let i = 0; i < sp.n; i++) {
      for (let tries = 0; tries < 10; tries++) {
        const u = R(), v = R(), ph = R.range(0, 6.28), g1 = R.gauss(), g2 = R.gauss(), spd = R.range(0.09, 0.16), sw = R.range(0.6, 1.15), rzr = R.range(-0.2, 0.2);
        let sl = (u * 2 - 1) * (half - 0.4), bd = 1;
        if (R2() < 0.86) { const b = bunches[Math.floor(R2() * bunches.length)]; const o = clamp(R2.gauss() * 0.42, -1, 1); sl = clamp(b.c + o * b.w, -half + 0.4, half - 0.4); bd = b.d * (1 - 0.45 * o * o); }
        else bd = 0.3 + 0.25 * R2();                                // a few short stragglers between the tassels
        let inLane = false; for (const l of lanes) if (Math.abs(sl - l) < 1.9) inLane = true;
        if (inLane) continue;
        const Lmax = sp.depth * bd * (1 - 0.35 * Math.pow(Math.abs(sl) / half, 1.6));
        const L = Math.max(i < sp.n * 0.45 ? Lmax * (1 - 0.14 * v) : 1.6 + (Lmax - 1.6) * (0.15 + 0.85 * v), 1.6);   // crowns gather at the tassels' feet
        const m = clamp(LEAN + 0.01 + g1 * 0.075, 0.2, 0.52), rt = rootOf(sl);
        const c = { rx: rt[0], rz: rt[1] + rzr, L, a0: m + spd, a1: m - spd, xl: clamp(g2 * 0.03, -0.07, 0.07), sw, ph, gate: 0 };
        let ok = true;
        if (sp.check) for (let k = 2; k <= 10 && ok; k += 2) {
          stemRest(c.rx, c.rz, c.L, c.a0, c.a1, c.xl, k / 10, tmp);
          if (clearOf(tmp.x, tmp.y, tmp.z) < (k === 10 ? 2.1 + 0.02 * c.L : 1.7 + 0.022 * c.L * (k / 10))) ok = false;
        }
        stemRest(c.rx, c.rz, c.L, c.a0, c.a1, c.xl, 1, tmp);
        if (ok) { c.crown = tmp.clone(); push(c); break; }
      }
      if (i % 8 === 7) await ctx.yield();
    }
    await ctx.yield();
  }
  const attrs = (geo, list, nArm) => {
    const n = list.length * nArm, r = new Float32Array(n * 4), sh = new Float32Array(n * 4), ar = new Float32Array(n * 4);
    let k = 0;
    for (const c of list) for (let a = 0; a < nArm; a++, k++) {
      r.set([c.rx, c.rz, c.L, c.ph], k * 4); sh.set([c.a0, c.a1, c.xl, c.sw], k * 4);
      ar.set([c.seedA * 6.283 + (a / nArm) * 6.283 + (c.jit[a] - 0.5) * 0.24, c.jit[a + 10], 0.5 * c.size * (0.86 + 0.24 * c.jit[a + 20]), c.seedA], k * 4);
    }
    geo.setAttribute('aRoot', new THREE.InstancedBufferAttribute(r, 4)); geo.setAttribute('aShape', new THREE.InstancedBufferAttribute(sh, 4));
    if (nArm > 0) geo.setAttribute('aArm', new THREE.InstancedBufferAttribute(ar, 4));
    geo.instanceCount = n; return geo;
  };
  const still = { uRollK: { value: 0 } }, vc = hero.crownColors, pal = hero.palette;
  const add = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.name = name; object.add(m); return m; };
  const stemMat = shader(U, { ...still, uUmber: { value: lin('#5B4636') }, uBead: { value: lin('#CDBFA0') } }, STEM_VERT, STEM_FRAG, { side: THREE.DoubleSide });
  add(attrs(buildStemGeometry(13), all, 1), stemMat, 'raft-stems');
  await ctx.yield();
  // the crowns that ever come close to the eye get the detailed arm (at most 110 of them); a colony marked alt wears
  // the second colour (hero.altColors), so it has its own three meshes
  all.map((c, i) => i).sort((a, b) => all[a].dPath - all[b].dPath).forEach((i, rank) => { all[i].near = rank < 136 && all[i].dPath < 8.5; });
  for (const alt of [0, 1]) {
    const cc = alt ? (hero.altColors || vc) : vc, tag = alt ? '-alt' : '';
    const armExtra = (cup) => ({ ...still, uCupCol: { value: cc.cup }, uArmCol: { value: cc.arm }, uTipCol: { value: cc.tip }, uCup: { value: cup }, uGlow: { value: hero.glow } });
    const armMat = shader(U, armExtra(0), ARM_VERT, ARM_FRAG, { side: THREE.DoubleSide });
    const nearList = all.filter((c) => c.near && c.alt === alt), farList = all.filter((c) => !c.near && c.alt === alt);
    if (nearList.length) add(attrs(buildArmGeometry(10, 3), nearList, 10), armMat, 'raft-arms-near' + tag);
    await ctx.yield();
    if (farList.length) add(attrs(buildArmGeometry(4, 2), farList, 8), armMat, 'raft-arms-far' + tag);
    await ctx.yield();
    if (nearList.length) add(attrs(buildCupGeometry(), nearList, 1), shader(U, armExtra(1), ARM_VERT, ARM_FRAG, { side: THREE.DoubleSide }), 'raft-cups' + tag);
  }
  // the trunks: one light loft, instanced; each its own length, girth, heading and way up
  const lg = buildLogGeometry(R, ctx.noise, 12, 24, true).geometry;
  const logMat = shader(U, { ...still, uWood: { value: lin(pal[5]) }, uShellA: { value: lin('#D8CCB2') }, uShellB: { value: new THREE.Color(0.07, 0.085, 0.12) }, uShell: { value: 0 } }, LOG_VERT, LOG_FRAG, { side: THREE.DoubleSide });
  const logs = new THREE.InstancedMesh(lg, logMat, specs.length); logs.frustumCulled = false; logs.name = 'raft-logs';
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  specs.forEach((sp, i) => {
    const R = sp.own ? ctx.core.makeRng(9001 + i * 131 + ((ctx.seed | 0) % 100000)) : R0;
    const girth = clamp(sp.len / (2 * LOG_HALF), 0.75, 1.05) * R.range(1.25, 1.7);   // stout trunks 0.7 to 1.2 m through: tree, not plank
    const roll = R.range(0, 6.28), fl = R() < 0.5; e.set(roll, -sp.yaw + ((sp.flip !== undefined ? !!sp.flip : fl) ? Math.PI : 0), 0, 'YXZ'); q.setFromEuler(e);   // spec.flip: which end the root plate is
    m4.compose(ps.set(sp.x, sp.ghost ? 900 : -0.02, sp.z), q, sp.ghost ? sc.set(1e-4, 1e-4, 1e-4) : sc.set(sp.len / (2 * LOG_HALF), girth, girth)); logs.setMatrixAt(i, m4);
  });
  lg.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(specs.length), 1));
  logs.instanceMatrix.needsUpdate = true; object.add(logs);
  await ctx.yield();
  return { object, crowns, count: all.length };
}
