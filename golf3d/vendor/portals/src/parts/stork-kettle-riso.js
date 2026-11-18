// KETTLE OVER THE STRAIT: hero set piece "The kettle" + THE PRESS (the three-plate riso separation the whole world prints with).
//
// WHAT     A thermal full of white storks: about 6,000 birds in one leaning helix 250 m wide and 1,280 m tall (scrub to cloud
//          base), drawn in three levels of detail by one ink shader:
//            LOD0  51 modelled storks (662 triangles: lofted body, neck, head, eye, vermilion bill and legs, tail fan, cambered
//                  arm wing, eight separate hand feathers of which six are fingers): the camera's own lane and its two neighbours
//            LOD1  ~375 lighter storks (216 triangles): the six stair lanes within 80 m of the camera's height
//            RINGS THE FUNNEL, the top of the kettle: about 265 storks in a packed kettle (233 in a plain one, 194 in a thin one) nose to tail on a conical helix
//                  about the thermal's axis, built in root-local space: five turns, 44 m wide at the top ring (22 m under
//                  the top of the climb, about 1,235 m) narrowing to 13 m, 84 m further down (about 1,151 m). The lens'
//                  lane (36 m) passes THROUGH its wall on the way up: the birds of the turns that cross the lane (circles
//                  32 to 40 m wide, about 70) are fully modelled storks in the company's draw call, the rest the lighter
//                  model in one more. From the top it is looked back DOWN into: ring inside ring of paper-white backs over
//                  the headland and the strait. Never narrower than 24 design px near (13 beyond 300 m, by range
//                  alone), whiter coverts than the lanes. The lanes thin out through its height band so the rings stand
//                  alone, and hero.setCalm(k) thins the far column below to one tick in five.
//            COMPANY about 120 modelled storks in one more draw call: (a) the first 288 m of the departing file (32 birds),
//                  which leaves from under the base over the east side, hooks out and runs south down across the left of
//                  the final view; (b) the escorts, 18 storks in the lens' own frame in two groups (hero.setStair(k, k2)): the stair, seven
//                  stepping away ahead-right and below the lens plus three outside the lane (opts.stairLayout 0|1|2: three
//                  stairs), and eight companions 6 to 26 m below for the look back down. A group that is off waits 46 m
//                  under the lens. No escort is nailed to its station: each wanders 3 to 5 m along the lane, 2 m across
//                  and 1.3 m in height on its own slow periods; hero.setEscort(lead, clock) stretches the stair's leads
//                  and runs that wander on with the climb; (c) the funnel's turns that cross the lane (above).
//            TICK  ~5,200 four-triangle ticks: four helical strands filling the rest of the column and the far file. A tick is
//                  never narrower than 8 design pixels and flips between paper and plum as its bank turns it to the sun.
//          AGAINST THE CLOUD BASE (opts.base / hero.setBase): a bird whose background is the dark underside of the cloud
//          (worked out per bird from the ray lens -> bird -> base plane) prints as PAPER with plum flight feathers at 13 design
//          px or more (escorts 27, file 30), never as a plum tick, which would vanish there. Seen from high above, far
//          ticks shrink to a third so the bottom of the column does not print as confetti on the sea.
//          THE FILE SEEN END-ON or nearly (wherever one bird at its held size would be drawn wider than the gap to the next
//          on the page): the birds go to their true size (10 design px at least), each is turned to show the lens its whole
//          back, nose along the file's line on the page, and they are thinned by halves, bird by bird, so the gap always
//          stays wider than a bird: a DOTTED THREAD (bare paper on the dark sky and the base, plum on the pale coast and
//          sea, and hazed only a fifth as much as anything else), never a ladder of rungs or a solid line.
//          THE RING'S SIGHTLINE (hero.setRing(k)): with k = 1 any bird that would cross the line from the lens to the exit
//          ring slides sideways out of a cone round it (it keeps its size), so the ring is never crossed by a bird.
//          Motion (all in the vertex shader): circling, bank rocking, a glitter wave climbing the column every 16 s, flaps when
//          a bird slips out of lift and deep labouring beats below 85 m, fingers working, head turns, legs dropping and
//          tucking, lanes sliding past each other, the file peeling off south bird by bird.
// SIZE     Local space: origin on the thermal's axis at the scrub (the cliff top), +Y up, +Z = south (the strait),
//          +X = east. radius 125, height 1280 (opts.height), center = mid column. Birds circle clockwise seen from above.
// THE CLIMB The birds live in the CAMERA'S frame: every bird keeps a fixed height offset from the camera and wraps between
//          scrub and base, so the stair stays around the lens while the column streams past the land. update() reads the
//          camera's LOCAL position: its y is the stair's altitude, its azimuth about the axis is the stair's phase (the
//          camera's own slot in the 36 m lane is empty: next bird 12 m ahead and 1.6 m up, and so on). So the world only has
//          to move this object:   hero.object.position.y = path.pointAt(u).y - hero.altitudeAt(u)
//          (altitudeAt(u) is the brief's time-lapse: 15 m above the scrub at u 0-0.11, then 180, 480, 780, 1010, 1130,
//          1215 and 1256 m at u 0.85; from there the offset is constant, so the last straight is flown rigidly to the ring
//          at about 1,276 m, 4 m under the cloud base) and sink the land group by the same amount; the cloud base sits at
//          local y = height. hero.top = { u, altitude }: where the climb ends.
//          Overrides: hero.setAltitude(y | null), hero.setPhase(rad | null), hero.setProgress(u) (= setAltitude(altitudeAt(u))
//          for a world that leaves the object where it is). Phase lock: on a cut the camera is seated in its slot at once;
//          while it circles (within 110 m of the axis) the lane turns with it; parked or far away the kettle turns by itself.
//          A 6.5 m bubble (opts.bubble) pushes any bird out of the lens' way, whatever the path does.
// ANCHORS  (local) entry, entryDir: start of the 70 m level lead-in, 36 m east of the axis, heading south.
//          flyThrough: 30 points of the suggested path in local XZ with PATH heights (15 m -> ~173 m: the path itself climbs
//          only ~160 m): lead-in, two right-hand turns of helix at 36 m rising 14 degrees (u 0.11-0.86), then out on the
//          tangent, 85 m straight due south at 12 degrees up. The path really climbs because the engine's exit ring stands
//          at the path's end from the first frame: the rise keeps it above the level gaze until the top.
//          portalSeat { position (the ring, 4 m under the cloud base and 36 m east of the axis, 85 m south), normal (faces
//          the arriving camera), radius 7, pathEnd (the same point in PATH heights) }.
//          fileStart (default: 16 m above the top of the climb, over the east side), fileDir, fileLength, fileHook, fileSlant:
//          the departing file (3 degrees east of south, 1:33 down; from 40 m on it rides fileLift (4.5 m) higher, so it
//          passes the ring at the ring's own height, and past fileBend[0] (96 m) it bears away east: a diagonal on the page
//          from beside the ring down the left third to the far coast).
//          hero.funnel { y0, y1, count, radiusAt(y) }: the funnel's height band (in which the lanes thin), its bird count
//          and its radius at a height. axisBase, axisTop, ringLook, viewpoints [{ name, position, target }] (whole, inLane, downTheFunnel).
// OPTS     palette (brief order: paper, blue, pink, yellow, plum, vermilion, olive), height, radius, exposure (SEE PRESS),
//          press (share an existing makePress()), hour 'noon'|'golden'|'haze', wind 'calm'|'east', cast 'white'|'black'|
//          'packed'|'thin', lineScreen, paper, wander, leanDeg, spacing (12), rise (1.6), lanes, ticks (5600), tickPx (8),
//          chordPx (5.5), bubble, wavePeriod (16), fileStart [x,y,z], fileHook (-6), fileSlant (0.052), fileSpeed (11),
//          backdrop (false = no stand-in sea in the sky), base [x, z, darkRadius] (the world's cloud base, see above),
//          funnel (false = no rings, escorts or near file), funnelTurns (5), fileBend [from m, turn, over m, descent]
//          ([96, 0.8, 60, 0.03]), fileLift (4.5), escort (table, see the build).
//          Unset mood opts are chosen from ctx.rng and reported in hero.mood so the world can dress to match.
//          ctx.quality.detail thins ticks and the outer lanes only.
// THE PRESS  makePress(opts) -> { page, sky, shared, uniforms, setExposure, setGrade, setSun, setDebugPlate, ink(obj), dispose }
//          hero.press is the one buildHero made (page and sky are children of hero.object). HOW THE STYLE IS DONE:
//          1. Every surface is drawn with an ink material on LAYER 1 (press.ink(object) sets it) and writes coverage, not
//             colour:  gl_FragColor = vec4(pink, blue, yellow, 8/(8 + viewDepth)).  Use styleMaterial(press, {...}) (also
//             hero.styleMaterial): geometry carries an `ink` vec3 recipe per vertex; light is ink (inkShade: shade adds blue,
//             then pink), haze removes ink (inkHaze: pink and yellow gone by 8 km, blue settles to 22%, paper stays paper).
//             White is zero ink. INK_GLSL is exported for hand-written shaders. Shared uniforms (press.shared): uSunDir,
//             uHaze, uTime. No scene fog, no lights: fog is the haze function.
//          2. press.page is one full-screen triangle on layer 0, drawn first. Its onBeforeRender prints the scene's layer 1
//             with the camera it is handed into a half-float target of the current target's size (two sizes cached), then
//             composites: each plate read at its own register offset (blue toward lower right on an 11 s loop, pink toward
//             upper left on 17 s, +2.5 px within 25 m, cap 4 px; forms thinner than the slip hold register so they are not torn
//             into specks), blue through a 75 degree dot screen of 6 design px (or a line screen), pink through a static 2 px
//             grain, yellow flat with roller bands, multiplied over paper with fibre. It writes depth (13 m - 1500 m) so the
//             engine's portal and ride sort against the print, and it outputs the inverse of the engine's tone curve.
//          3. press.sky is the ink sky dome (blue plate alone; at golden hour a low band of yellow on the sun's side, which
//             thins upward into paper through its own 7 px dot screen); it follows the printing camera by itself. Below the horizon it
//             draws a stand-in strait for the part viewer: pass backdrop: false or cover it with the world's own sea.
//          EXPOSURE (important): paper needs a scene value of about 2.5, which the engine's bloom would smear over the inks.
//          Run the world at post.exposure E (3 is right), bloom threshold 1.1, grade saturation 1, contrast 1, no vignette,
//          grain or tint, and pass buildHero(ctx, { exposure: E }) (or press.setExposure(E)): the page divides by E, paper stays
//          under the bloom threshold and lands on #F6F0E2. With NO exposure opt the part assumes the part viewer, whose post
//          cannot be set: it then prints at 70% brightness (uDim) to stay under the viewer's bloom.
//          Solo birds: hero.makeSoloStork({ flap, legs, seed }) -> Mesh (+Z forward; uniforms.uSolo.w = 1 keys its flight
//          feathers with paper and trails its legs as one thin line, for a stork flown against the dark base) for the nest pair, the entry trio and the
//          stork that crosses the lens; press.setDebugPlate(1|2|3) shows one plate alone.
// LIGHTING Self-lit ink: reads no scene lights or fog. Sun = press.shared.uSunDir (noon: due south, 64 degrees up; golden:
//          west, 25 degrees). Wants post exposure 3, bloom 0.3 at threshold 1.1 and nothing else in the grade.
// COST     ~230k triangles (by seed), 5 draw calls for the birds + 1 sky + 1 page = 7, 3 programs + sky + page,
//          one extra scene pass into a half-float target (the plates), ~100 ms build in yielded steps, no lights, no textures.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';

const DEFAULT_PALETTE = ['#F6F0E2', '#3255A4', '#FF48B0', '#FFB511', '#321871', '#FF330C', '#323C0B'];
const TAU = Math.PI * 2;
const VIEWER = { exposure: 1, dim: 0.7, grade: [1.05, 1.04] };   // the part viewer cannot set post: see the header
const INK_LAYER = 1;
const hexToVec3 = (hex, out = new THREE.Vector3()) => {   // raw display (sRGB) values: the page multiplies inks in display space
  const n = parseInt(String(hex).replace('#', ''), 16);
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

// ================================================================ THE PRESS: shared ink GLSL
// Every ink material writes   gl_FragColor = vec4(pink, blue, yellow, depthCode)   (coverage 0-1, not colour).
// depthCode = 8 / (8 + view depth in metres): 1 at the lens, 0 at infinity; the page decodes it for register and depth.
export const INK_GLSL = /* glsl */`
uniform vec3 uSunDir;      // unit vector TOWARD the sun (world space)
uniform vec4 uHaze;        // x: distance by which pink and yellow are gone (8000), y: blue haze tone (.22), z: blue haze distance, w: unused
uniform float uTime;
// shade: light is ink. lit = N.L (-1..1). k scales how much ink the shadow may add (white birds use a small k).
vec3 inkShade(vec3 ink, float lit, float k){
  float s = (1. - smoothstep(-.45, .35, lit)) * k;
  ink.g += (1. - ink.g) * clamp(s * .62, 0., 1.);                 // turning faces take blue first
  ink.r += (1. - ink.r) * smoothstep(.6, 1., s) * .55;            // the deepest shadow adds pink: plum, never grey
  return ink;
}
// haze removes ink: pink and yellow thin to nothing, blue settles to the haze tone
vec3 inkHaze(vec3 ink, float dist){
  float h = clamp(dist / max(uHaze.x, 1.), 0., 1.); h = 1. - (1. - h) * (1. - h);
  float hb = (1. - exp(-dist / max(uHaze.z, 1.))) * smoothstep(0., .08, max(ink.g, max(ink.r, ink.b)));   // paper stays paper
  ink.r *= 1. - h; ink.b *= 1. - h;
  ink.g = mix(ink.g, uHaze.y, hb);
  return ink;
}
vec4 inkOut(vec3 ink, float viewDepth){ return vec4(clamp(ink, 0., 1.), 8. / (8. + max(viewDepth, 0.))); }
float inkHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float inkNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(inkHash(i), inkHash(i + vec2(1., 0.)), f.x), mix(inkHash(i + vec2(0., 1.)), inkHash(i + vec2(1., 1.)), f.x), f.y); }
`;

const PAGE_VERT = /* glsl */`void main(){ gl_Position = vec4(position.xy, 0., 1.); }`;
const PAGE_FRAG = /* glsl */`precision highp float;
uniform sampler2D tPlates; uniform vec2 uRes; uniform float uPx, uTime, uExposure, uLine, uFarClamp, uDebug, uFibre, uDim;
uniform vec3 uPaper, uPink, uBlue, uYellow, uWander; uniform vec2 uProj, uGrade; uniform mat3 uInvOut, uInvIn;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float nearness(float a){ return smoothstep(.242, .6, a); }                 // 0 at 25 m and beyond, 1 inside 5 m
vec3 toLin(vec3 c){ return mix(c / 12.92, pow((max(c, 0.) + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
// inverse of the engine's tone curve (col/.6 -> ACES fit), so that what reaches the screen is the printed colour
vec3 invTone(vec3 d){
  vec3 y = clamp(uInvOut * d, 0., .985);
  vec3 A = 1. - .983729 * y, B = .0245786 - .432951 * y, C = -(.000090537 + .238081 * y);
  vec3 v = (-B + sqrt(max(B * B - 4. * A * C, 0.))) / max(2. * A, vec3(1e-3));
  return max(uInvIn * v, 0.) * .6;
}
void main(){
  vec2 fc = gl_FragCoord.xy, uv = fc / uRes, dp = fc / uPx, px = uPx / uRes;   // dp: design pixels (450 to the page height)
  // ---- register: blue wanders toward lower right (11 s), pink toward upper left (17 s), yellow stays. Never opposed on one axis.
  const vec2 dirB = vec2(.8660, -.5), dirP = vec2(-.3420, .9397);
  float wB = uWander.x * 1.5 * (.5 + .5 * sin(6.28318 * uTime / 11.));
  float wP = uWander.y * 1.2 * (.5 + .5 * sin(6.28318 * uTime / 17. + 1.3));
  vec4 s0 = textureLod(tPlates, uv, 0.); float aC = s0.a;
  float nB = nearness(max(aC, textureLod(tPlates, uv - dirB * 4. * px, 0.).a));
  float nP = nearness(max(aC, textureLod(tPlates, uv - dirP * 4. * px, 0.).a));
  vec2 oB = (dirB * min(wB + 2.5 * nB, 4.) + vec2(.5, .866) * .25 * sin(uTime * .37)) * px;
  vec2 oP = (dirP * min(wP + 2.5 * nP, 4.) + vec2(.94, .342) * .25 * sin(uTime * .29 + 2.)) * px;
  // a plate slips as a whole, but a form thinner than the slip (a wing seen edge-on, a bill, a far tick) would be torn into
  // loose specks of single inks: where a value differs from both its neighbours along the slip, it holds register
  float b1 = textureLod(tPlates, uv - oB, 0.).g, b2 = textureLod(tPlates, uv + oB, 0.).g, b3 = textureLod(tPlates, uv - 2. * oB, 0.).g;
  float p1 = textureLod(tPlates, uv - oP, 0.).r, p2 = textureLod(tPlates, uv + oP, 0.).r, p3 = textureLod(tPlates, uv - 2. * oP, 0.).r;
  float kB = max(clamp((min(abs(s0.g - b1), abs(s0.g - b2)) - abs(b1 - b2)) * 4., 0., 1.), clamp((min(abs(b1 - s0.g), abs(b1 - b3)) - abs(s0.g - b3)) * 4., 0., 1.));
  float kP = max(clamp((min(abs(s0.r - p1), abs(s0.r - p2)) - abs(p1 - p2)) * 4., 0., 1.), clamp((min(abs(p1 - s0.r), abs(p1 - p3)) - abs(s0.r - p3)) * 4., 0., 1.));
  float tb = mix(b1, s0.g, kB), tp = mix(p1, s0.r, kP);
  float ty = uWander.z > 0. ? textureLod(tPlates, uv + uWander.z * vec2(0., 1.) * px, 0.).b : s0.b;
  // ---- blue: round dots, pitch 6 px, 75 degrees; radius from the tone at this pixel. One seed in four: a line screen.
  vec2 q = mat2(.258819, .965926, -.965926, .258819) * dp * (6.28318 / 6.);
  float Td = .5 - .25 * (cos(q.x) + cos(q.y));
  float Tl = .5 - .5 * cos(q.x * 1.2);
  float T = mix(Td, Tl, uLine);
  float e = .3 / sqrt(max(uPx, 1.));
  float tb2 = tb * (1. + 2. * e) - e + smoothstep(.88, .94, tb) * .4;
  float b = smoothstep(-e, e, tb2 - T);
  // ---- pink: static grain of 2 px specks
  vec2 cell = floor(dp * .5);
  float Tp = fract(52.9829189 * fract(dot(cell, vec2(.06711056, .00583715))) + .31 * h21(cell));
  float p = smoothstep(-.06, .06, tp * 1.14 - .07 - Tp);
  // ---- yellow: flat, on or off at 50 percent, times roller bands 90 px deep
  float band = .96 + .04 * sin(6.28318 * dp.y / 90. + 1.7 * sin(dp.x * .013));
  float yl = smoothstep(.42, .58, ty) * band;
  // ---- paper with fibre
  float fib = h21(floor(dp * vec2(.45, 1.6))) * .6 + h21(floor(dp * 1.3 + 7.)) * .4;
  vec3 col = uPaper * (1. - uFibre * fib);
  if (uDebug > .5) { p *= step(abs(uDebug - 1.), .1); b *= step(abs(uDebug - 2.), .1); yl *= step(abs(uDebug - 3.), .1); }
  col *= mix(vec3(1.), uPink, p) * mix(vec3(1.), uBlue, b) * mix(vec3(1.), uYellow, yl);
  vec3 lin = toLin(col) * uDim;
  float l = dot(lin, vec3(.2126, .7152, .0722));
  lin = (lin - .5) / uGrade.y + .5; lin = max(mix(vec3(l), lin, 1. / uGrade.x), 0.);     // undo the grade's contrast and saturation
  gl_FragColor = vec4(invTone(lin) / max(uExposure, .01), 1.);
  float d = clamp(8. * (1. - aC) / max(aC, 1e-5), 13., uFarClamp);
  gl_FragDepth = clamp(((uProj.y - uProj.x * d) / d) * .5 + .5, 0., 1.);
}`;

// ---------------------------------------------------------------- makePress
// The page (layer 0, drawn first) + the shared ink uniforms + the ink sky. See the header for how the world uses it.
export function makePress(opts = {}) {
  const pal = opts.palette || DEFAULT_PALETTE;
  const shared = {
    uSunDir: { value: (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(0, Math.sin(64 * Math.PI / 180), Math.cos(64 * Math.PI / 180))).normalize() },
    uHaze: { value: new THREE.Vector4(opts.hazeInk ?? 8000, opts.hazeTone ?? 0.22, opts.hazeBlue ?? 5200, 0) },
    uTime: { value: 0 },
  };
  const m3 = (c) => new THREE.Matrix3().set(c[0], c[3], c[6], c[1], c[4], c[7], c[2], c[5], c[8]);   // from columns
  const inM = m3([.59719, .07600, .02840, .35458, .90834, .13383, .04823, .01566, .83777]);
  const outM = m3([1.60475, -.10208, -.00327, -.53108, 1.10813, -.07276, -.07367, -.00605, 1.07602]);
  const U = {
    tPlates: { value: null }, uRes: { value: new THREE.Vector2(800, 450) }, uPx: { value: 1 }, uTime: shared.uTime,
    uExposure: { value: opts.exposure ?? 3 }, uLine: { value: opts.lineScreen ? 1 : 0 }, uFarClamp: { value: opts.farClamp ?? 1500 }, uDim: { value: opts.dim ?? 1 },
    uDebug: { value: opts.debugPlate ?? 0 }, uFibre: { value: 0.03 },
    uPaper: { value: hexToVec3(opts.paper || pal[0]) }, uBlue: { value: hexToVec3(pal[1]) }, uPink: { value: hexToVec3(pal[2]) }, uYellow: { value: hexToVec3(pal[3]) },
    uWander: { value: new THREE.Vector3(1, 1, 0) }, uProj: { value: new THREE.Vector2(-1, -1) }, uGrade: { value: new THREE.Vector2(1, 1) },
    uInvOut: { value: outM.clone().invert() }, uInvIn: { value: inM.clone().invert() },
  };
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const pageMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PAGE_VERT, fragmentShader: PAGE_FRAG, depthFunc: THREE.AlwaysDepth, depthTest: true, depthWrite: true, fog: false, toneMapped: false });
  const page = new THREE.Mesh(tri, pageMat);
  page.frustumCulled = false; page.renderOrder = -1000; page.layers.set(0); page.name = 'riso-page';

  // the ink sky: drawn by the blue plate alone; follows whichever camera prints the plates
  const skyU = { ...shared, uPx: U.uPx, uSkyTone: { value: new THREE.Vector4(opts.skyTop ?? 0.58, opts.skyHorizon ?? 0.12, opts.skyGold ?? 0, opts.backdrop === false ? 0 : 1) } };
  const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`precision highp float;` + INK_GLSL + /* glsl */`
      uniform vec4 uSkyTone; uniform float uPx; varying vec3 vDir;
      void main(){
        vec3 d = vDir / max(length(vDir), 1e-5); float h = d.y;
        float up = smoothstep(0., .66, h);                                   // (the dots swell quickly above the paper horizon, so a level gaze has blue behind its white birds)
        float blue = mix(uSkyTone.y, uSkyTone.x, pow(max(up, 0.), .75));
        blue *= smoothstep(.0, .055, h) * .9 + .1;                         // the band of bare-paper haze on the horizon
        // golden hour: a low band of flat yellow on the sun's side only, thinning away round the horizon; its top edge wanders
        // and is torn into dry-roller streaks, and a sliver of bare paper is left between it and the horizon
        vec2 hz = d.xz / max(length(d.xz), 1e-4), sz = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
        float toSun = smoothstep(-.35, .75, dot(hz, sz));
        float gTop = .02 + (.03 + .045 * inkNoise(hz * 6. + 3.) + .02 * inkNoise(hz * 19.)) * toSun;
        float streak = inkNoise(vec2(dot(hz, vec2(-sz.y, sz.x)) * 25., h * 220.));
        // (its upper edge is not a cut: over about 60 design px the plate thins into paper through its own dot screen, 7 px
        // pitch at 15 degrees, nailed to the page like the blue one)
        float yTone = 1. - smoothstep(gTop - .035, gTop + .07 + .03 * toSun, h + .03 * streak);
        vec2 yq = mat2(.965926, .258819, -.258819, .965926) * (gl_FragCoord.xy / max(uPx, .25)) * (6.28318 / 7.);
        float yT = .5 - .25 * (cos(yq.x) + cos(yq.y));
        float yel = uSkyTone.z * smoothstep(.014, .02, h) * smoothstep(-.07, .07, yTone * 1.16 - .08 - yT) * step(.06, toSun);
        float dn = max(-h, 0.), dist = 1. / max(dn, .004);
        vec2 sp = d.xz * dist;
        float v = sp.y * 5. + inkNoise(sp * vec2(.7, 2.)) * 1.6 + uTime * .08, fw = max(fwidth(v), 1e-4);   // derivative taken outside the branch
        if (h < 0.) {                                                      // below the horizon: a stand-in strait (viewer backdrop)
          float f = abs(fract(v) - .5);
          float lines = (1. - smoothstep(.03 + fw * .5, .03 + fw * 1.5, f)) * (1. - smoothstep(.12, .45, fw)) * smoothstep(.5, .66, inkNoise(sp * vec2(.9, 3.) + 7.));
          float sea = mix(.7, .88, inkNoise(sp * .35)) * (1. - lines * .9);
          blue = mix(.2, mix(uSkyTone.y + .1, sea, smoothstep(0., .07, dn)), uSkyTone.w);
          blue = mix(blue, blue * (.1 + .9 * smoothstep(0., .02, dn)), uSkyTone.w);
          yel = 0.;
        }
        gl_FragColor = vec4(0., clamp(blue, 0., 1.), yel, 0.0004);
      }` }));
  sky.frustumCulled = false; sky.renderOrder = -100; sky.layers.set(INK_LAYER); sky.name = 'riso-sky';

  // ---- plate targets (cached per size: the main view and the portal view), printed from the page's onBeforeRender
  const targets = new Map();
  const cam2 = new THREE.PerspectiveCamera(); cam2.matrixAutoUpdate = false; cam2.matrixWorldAutoUpdate = false; cam2.layers.set(INK_LAYER);
  const size = new THREE.Vector2(), clearCol = new THREE.Color();
  let printing = false;
  const press = { page, sky, shared, uniforms: U, layer: INK_LAYER, skyUniforms: skyU, beforePrint: null };
  page.onBeforeRender = (renderer, scene, camera) => {
    if (printing) return;
    const cur = renderer.getRenderTarget();
    if (cur) size.set(cur.width, cur.height); else renderer.getDrawingBufferSize(size);
    const samples = opts.samples ?? (cur ? cur.samples : 0);
    const key = size.x + 'x' + size.y + 's' + samples;
    let rt = targets.get(key);
    if (!rt) {
      if (targets.size >= 2) { const k0 = targets.keys().next().value; targets.get(k0).dispose(); targets.delete(k0); }
      rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, samples, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
      rt.texture.colorSpace = THREE.NoColorSpace;
      targets.set(key, rt);
    } else { targets.delete(key); targets.set(key, rt); }
    cam2.matrixWorld.copy(camera.matrixWorld); cam2.matrixWorldInverse.copy(camera.matrixWorldInverse);
    cam2.projectionMatrix.copy(camera.projectionMatrix); cam2.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    cam2.near = camera.near; cam2.far = camera.far; cam2.fov = camera.fov; cam2.aspect = camera.aspect;
    cam2.position.setFromMatrixPosition(camera.matrixWorld);
    // the sky rides with the printing camera (in the sky's parent space)
    if (sky.parent) { sky.position.copy(cam2.position); sky.parent.worldToLocal(sky.position); sky.scale.setScalar(camera.far * 0.9); sky.updateMatrixWorld(true); }
    if (press.beforePrint) press.beforePrint(cam2, size);
    const pe = camera.projectionMatrix.elements; U.uProj.value.set(pe[10], pe[14]);
    U.uRes.value.copy(size); U.uPx.value = Math.max(0.5, size.y / 450);
    const xr = renderer.xr.enabled, sh = renderer.shadowMap.autoUpdate, ac = renderer.autoClear, ca = renderer.getClearAlpha();
    renderer.getClearColor(clearCol);
    printing = true;
    renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false; renderer.autoClear = true;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0);
    renderer.state.buffers.depth.setMask(true);
    renderer.clear();
    renderer.render(scene, cam2);
    renderer.setRenderTarget(cur); renderer.setClearColor(clearCol, ca);
    renderer.xr.enabled = xr; renderer.shadowMap.autoUpdate = sh; renderer.autoClear = ac;
    printing = false;
    U.tPlates.value = rt.texture;
  };
  press.setExposure = (e) => { U.uExposure.value = e; };
  press.setGrade = (saturation = 1, contrast = 1) => { U.uGrade.value.set(saturation, contrast); };
  press.setSun = (dirTowardSun) => { shared.uSunDir.value.copy(dirTowardSun).normalize(); };
  press.setDebugPlate = (n) => { U.uDebug.value = n; };   // 0 all, 1 pink, 2 blue, 3 yellow
  press.setTime = (t) => { shared.uTime.value = t; };
  press.ink = (obj) => { obj.traverse((o) => o.layers.set(INK_LAYER)); return obj; };
  press.dispose = () => { for (const rt of targets.values()) rt.dispose(); targets.clear(); U.tPlates.value = null; };
  return press;
}

// ---------------------------------------------------------------- styleMaterial
// The ink material factory for everything else in the world. Geometry attributes: position, normal, ink (vec3: pink, blue,
// yellow recipe 0-1; missing = white). Hooks are GLSL snippets:
//   vertexPre / fragmentPre     declarations (uniforms, functions, varyings)
//   vertexMain                  may change  vec3 p (object space), vec3 n, vec3 inkV (the recipe)  before projection
//   fragmentMain                may change  vec3 ink, float lit, float shadeK  (has vWorld, vNormal, vDepth, uTime, inkNoise)
// opts: uniforms, shade (how much ink shadow adds, default 1), side, instanced (bool: InstancedMesh), haze (default true)
export function styleMaterial(press, o = {}) {
  const uniforms = { ...press.shared, uShadeK: { value: o.shade ?? 1 }, ...(o.uniforms || {}) };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: o.side ?? THREE.FrontSide, fog: false, toneMapped: false,
    vertexShader: /* glsl */`
      attribute vec3 ink; varying vec3 vInk, vNormal, vWorld; varying float vDepth;
      uniform float uTime;
      ${o.vertexPre || ''}
      void main(){
        vec3 p = position, n = normal, inkV = ink;
        ${o.vertexMain || ''}
        #ifdef USE_INSTANCING
          vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.); vNormal = mat3(modelMatrix) * mat3(instanceMatrix) * n;
        #else
          vec4 w = modelMatrix * vec4(p, 1.); vNormal = mat3(modelMatrix) * n;
        #endif
        vWorld = w.xyz; vInk = inkV; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`precision highp float;
      ${INK_GLSL}
      uniform float uShadeK; varying vec3 vInk, vNormal, vWorld; varying float vDepth;
      ${o.fragmentPre || ''}
      void main(){
        vec3 ink = vInk; vec3 n = vNormal / max(length(vNormal), 1e-5); if (!gl_FrontFacing) n = -n;
        float lit = dot(n, uSunDir), shadeK = uShadeK;
        ${o.fragmentMain || ''}
        ink = inkShade(ink, lit, shadeK);
        ${o.haze === false ? '' : 'ink = inkHaze(ink, vDepth);'}
        gl_FragColor = inkOut(ink, vDepth);
      }`,
  });
  return mat;
}

// ================================================================ STORK GEOMETRY
// Model space: +Z forward (bill), +Y up, span along X, 2.1 m across. Extra attributes:
//   ink    vec3   recipe (pink, blue, yellow)
//   aPart  vec4   x: signed distance along the wing from its root (0 off the wings), y: part id, z: feather index, w: fraction along the part
//   aUV    vec2   wings: (span 0-1, chord 0 leading - 1 trailing); hand feathers: (span, -1 .. 1 across the feather);
//                 legs: cross-section offset (widened with distance)
const WHITE = [0, 0, 0], PLUM = [1, 1, 0], VERM = [1, 0, 1];
const P_BODY = 0, P_WING = 1, P_FEATHER = 2, P_LEG = 3, P_NECK = 4, P_BILL = 4.25, P_TAIL = 5;
const WING_ROOT = 0.07, WING_ARM = 0.632;   // lateral start of the wing, length of the arm (to the wrist)

class SGeo {
  constructor() { this.P = []; this.K = []; this.A = []; this.U = []; this.I = []; this.n = 0; }
  v(x, y, z, ink, part, u = 0, w = 0) { this.P.push(x, y, z); this.K.push(ink[0], ink[1], ink[2]); this.A.push(part[0], part[1], part[2], part[3]); this.U.push(u, w); return this.n++; }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('ink', new THREE.Float32BufferAttribute(this.K, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.A, 4));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.U, 2));
    g.setIndex(this.I); g.computeVertexNormals();
    return g;
  }
}

// a lofted tube of elliptical rings along Z: stations [z, y, rx, ry, ink, partId, frac]
function loft(G, st, sides, capStart = true) {
  const rings = [];
  for (const s of st) {
    const ring = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU + Math.PI / sides;
      // a slightly flat belly and a ridge along the back so the body is not a tube
      const cy = Math.sin(a), cx = Math.cos(a), k = cy < 0 ? 0.86 : 1.0;
      const bl = s[5] === P_BILL ? 1 : 0;
      ring.push(G.v(cx * s[2], s[1] + cy * s[3] * k, s[0], s[4], [0, s[5], 0, s[6]], bl * cx * s[2], bl * cy * s[3] * k));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    G.quad(rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i]);
  }
  if (capStart) { const c = G.v(0, st[0][1], st[0][0] - st[0][2] * 0.6, st[0][4], [0, st[0][5], 0, st[0][6]]); for (let i = 0; i < sides; i++) G.tri(c, rings[0][(i + 1) % sides], rings[0][i]); }
  const e = st[st.length - 1], c2 = G.v(0, e[1], e[0] + e[2] * 0.8, e[4], [0, e[5], 0, e[6]]), last = rings[rings.length - 1];
  for (let i = 0; i < sides; i++) G.tri(c2, last[i], last[(i + 1) % sides]);
}

const wingLE = (s) => 0.17 + 0.07 * Math.sin(Math.min(s / 0.68, 1) * Math.PI * 0.8) - 0.03 * s;
const wingTE = (s) => -0.17 + 0.05 * s;

function buildStorkGeometry(lod) {
  const G = new SGeo(), hi = lod === 0;
  const sides = hi ? 8 : 5;
  // ---- body, neck, head (one loft), then the bill (its own loft so the ink edge is hard)
  const body = hi ? [
    [-0.30, 0.004, 0.022, 0.018, WHITE, P_BODY, 0], [-0.25, 0.0, 0.062, 0.05, WHITE, P_BODY, 0], [-0.16, -0.004, 0.09, 0.075, WHITE, P_BODY, 0],
    [-0.04, -0.008, 0.104, 0.09, WHITE, P_BODY, 0], [0.08, -0.006, 0.1, 0.088, WHITE, P_BODY, 0], [0.17, 0.0, 0.078, 0.072, WHITE, P_BODY, 0],
    [0.24, 0.008, 0.046, 0.046, WHITE, P_NECK, 0.0], [0.33, 0.012, 0.033, 0.034, WHITE, P_NECK, 0.3], [0.43, 0.016, 0.029, 0.03, WHITE, P_NECK, 0.65],
    [0.50, 0.022, 0.031, 0.034, WHITE, P_NECK, 0.9], [0.545, 0.03, 0.041, 0.044, WHITE, P_NECK, 1], [0.585, 0.03, 0.036, 0.038, WHITE, P_NECK, 1], [0.61, 0.024, 0.024, 0.026, WHITE, P_NECK, 1],
  ] : [
    [-0.29, 0.004, 0.03, 0.025, WHITE, P_BODY, 0], [-0.17, -0.004, 0.088, 0.074, WHITE, P_BODY, 0], [0.04, -0.008, 0.104, 0.09, WHITE, P_BODY, 0],
    [0.18, 0.0, 0.074, 0.07, WHITE, P_BODY, 0], [0.26, 0.01, 0.04, 0.04, WHITE, P_NECK, 0.05], [0.46, 0.018, 0.03, 0.031, WHITE, P_NECK, 0.75],
    [0.55, 0.03, 0.041, 0.044, WHITE, P_NECK, 1], [0.61, 0.024, 0.024, 0.026, WHITE, P_NECK, 1],
  ];
  loft(G, body, sides);
  const bill = hi ? [[0.605, 0.022, 0.021, 0.023, VERM, P_BILL, 1], [0.68, 0.016, 0.016, 0.017, VERM, P_BILL, 1], [0.76, 0.01, 0.01, 0.01, VERM, P_BILL, 1], [0.835, 0.004, 0.003, 0.003, VERM, P_BILL, 1]]
    : [[0.605, 0.022, 0.021, 0.023, VERM, P_BILL, 1], [0.72, 0.013, 0.013, 0.013, VERM, P_BILL, 1], [0.835, 0.004, 0.003, 0.003, VERM, P_BILL, 1]];
  loft(G, bill, hi ? 6 : 4, false);
  if (hi) for (const sx of [-1, 1]) {   // the eye: a plum lozenge standing just proud of the head
    const e = [1, 1, 0], pt = [0, P_NECK, 0, 1], x = sx * 0.0425, a = G.v(x, 0.04, 0.575, e, pt), b = G.v(x, 0.05, 0.562, e, pt), c = G.v(x, 0.04, 0.549, e, pt), d = G.v(x, 0.031, 0.562, e, pt);
    if (sx > 0) G.quad(a, b, c, d); else G.quad(d, c, b, a);
  }
  // ---- tail: a short white fan
  {
    const n = hi ? 4 : 2, base = [], tip = [];
    for (let i = 0; i <= n; i++) { const f = i / n * 2 - 1; base.push(G.v(f * 0.055, 0.012, -0.24, WHITE, [0, P_TAIL, 0, 0])); tip.push(G.v(f * 0.115, 0.006 - Math.abs(f) * 0.008, -0.45 + f * f * 0.035, WHITE, [0, P_TAIL, 0, 1])); }
    for (let i = 0; i < n; i++) G.quad(base[i], base[i + 1], tip[i + 1], tip[i]);
  }
  // ---- legs: vermilion, trailing past the tail; knee knob, foot. aUV holds the cross-section offset.
  for (const sx of [-1, 1]) {
    const cx = sx * 0.034;
    const st = hi ? [[-0.16, -0.05, 0.02], [-0.3, -0.045, 0.013], [-0.41, -0.04, 0.017], [-0.52, -0.035, 0.011], [-0.63, -0.032, 0.011], [-0.68, -0.034, 0.02], [-0.76, -0.04, 0.005]]
      : [[-0.16, -0.05, 0.019], [-0.5, -0.037, 0.015], [-0.76, -0.04, 0.008]];
    const rings = [];
    for (let k = 0; k < st.length; k++) {
      const ring = [], foot = k >= st.length - 2 ? 1.8 : 1;
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI / 2; const ox = Math.cos(a) * st[k][2] * foot, oy = Math.sin(a) * st[k][2]; ring.push(G.v(cx + ox, st[k][1] + oy, st[k][0], VERM, [0, P_LEG, sx, k / (st.length - 1)], ox, oy)); }
      rings.push(ring);
    }
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; G.quad(rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]); }
  }
  // ---- wings: the arm is a cambered sheet (pattern drawn in the shader), the hand is eight separate feathers, six of them fingers
  const ns = hi ? 10 : 4, nc = hi ? 5 : 2, S_W = 0.68, SPAN = WING_ARM + 0.37;
  for (const sg of [1, -1]) {
    const grid = [];
    for (let i = 0; i <= ns; i++) {
      const s = (i / ns) * S_W, d = s / S_W * WING_ARM, le = wingLE(s), te = wingTE(s), row = [];
      for (let j = 0; j <= nc; j++) {
        const c = j / nc, cc = Math.pow(c, 0.85);
        const y = 0.045 + 0.022 * Math.sin(Math.PI * Math.pow(c, 0.7)) * (1 - 0.4 * s) - 0.012 * c;
        row.push(G.v(sg * (WING_ROOT + d), y, lerp(le, te, cc), WHITE, [sg * Math.max(d, 1e-3), P_WING, 0, c], d / SPAN, cc));
      }
      grid.push(row);
    }
    for (let i = 0; i < ns; i++) for (let j = 0; j < nc; j++) {
      if (sg > 0) G.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]); else G.quad(grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j], grid[i][j]);
    }
    const le = wingLE(S_W), te = wingTE(S_W), NF = 8, LEN = [0.33, 0.37, 0.37, 0.34, 0.3, 0.26, 0.22, 0.19];
    const ts0 = hi ? [0, 0.3, 0.6, 0.86, 1] : [0, 0.5, 1];
    for (let k = 0; k < NF; k++) {
      const ck = 0.07 + k * 0.122, al = (-13 + 9.5 * k) * Math.PI / 180, L = LEN[k];
      const bx = WING_ARM - 0.03, bz = lerp(le, te, ck), by = 0.05 - 0.012 * ck - 0.0035 * k;
      const dx = Math.cos(al), dz = -Math.sin(al), px = Math.sin(al), pz = Math.cos(al);
      const w0 = k < 6 ? 0.03 : 0.036, rowA = [], rowB = [], ts = !hi && k >= 6 ? [0, 1] : ts0;
      for (const t of ts) {
        const hw = w0 * (1 - 0.3 * t) * (t > 0.99 ? 0.28 : t > 0.8 ? 0.8 : 1), d = bx + dx * L * t, z = bz + dz * L * t, y = by + 0.01 * t;
        rowA.push(G.v(sg * (WING_ROOT + d + px * hw), y, z + pz * hw, PLUM, [sg * (d + px * hw), P_FEATHER, k, t], (d + px * hw) / SPAN, 1));
        rowB.push(G.v(sg * (WING_ROOT + d - px * hw), y, z - pz * hw, PLUM, [sg * (d - px * hw), P_FEATHER, k, t], (d - px * hw) / SPAN, -1));
      }
      for (let i = 0; i < ts.length - 1; i++) {
        if (sg > 0) G.quad(rowA[i], rowA[i + 1], rowB[i + 1], rowB[i]); else G.quad(rowB[i], rowB[i + 1], rowA[i + 1], rowA[i]);
      }
    }
  }
  return G.build();
}

// the far bird: a flat tick of four triangles that the shader flips between paper and plum
function buildTickGeometry() {
  const G = new SGeo();
  for (const sg of [1, -1]) {
    const pts = [[0.0, 0.18, 0, 0], [0.0, -0.17, 0, 1], [1.0, -0.05, 1, 0.5]];
    const id = pts.map((p) => G.v(sg * (WING_ROOT + p[0]), 0.03, p[1], WHITE, [sg * Math.max(p[0], 1e-3), P_WING, 0, p[3]], p[2], p[3]));
    if (sg > 0) G.tri(id[0], id[2], id[1]); else G.tri(id[1], id[2], id[0]);
  }
  const pb = [0, P_BODY, 0, 0];
  const a = G.v(0, 0.03, 0.8, WHITE, pb, 0, 0), b = G.v(0.085, 0.03, 0.1, WHITE, pb, 0, 0), c = G.v(0, 0.03, -0.62, WHITE, pb, 0, 0.2), d = G.v(-0.085, 0.03, 0.1, WHITE, pb, 0, 0);
  G.quad(a, b, c, d);
  return G.build();
}

// ================================================================ STORK INK SHADER
// One vertex program for the three levels of detail and for free "solo" storks. Circling, bank, rocking, flaps, fingered
// primaries, head turns and leg drops all happen here from per-instance numbers.
const FILE_LEN = 1620, FILE_NEAR = 288;   // (32 birds fly as modelled storks: a power of two, so the thread's thinning by halves carries over to the ticks)
const STORK_VERT = /* glsl */`
attribute vec3 ink; attribute vec4 aPart; attribute vec2 aUV;
#ifndef SOLO
attribute vec4 iA;   // radius, phase offset, height offset, rate factor   (file birds: -, -, metres along the file, -)
attribute vec4 iB;   // seed, size, kind (0 column, 1 file near, 2 file far, 3 funnel, 4 escort), foot (1: radius follows the thermal's profile; escort: group 0 | 1)
#endif
#ifdef FUNNEL
attribute vec4 iC;   // funnel birds: centre of the bird's circle (local x, y, z), bank.  iA = radius, phase, 0, turn rate
#endif               // escort birds: iA = radius, lead on the camera's phase, height below the camera, extra bank
uniform float uTime, uPhase, uAlt, uH, uBubble, uBufH, uMinPx, uWave, uBlack, uChordPx, uStair, uStair2, uHook, uSlant, uCalm;
uniform vec4 uBend; uniform float uLift;
uniform vec2 uLean, uFunBand, uEsc; uniform vec4 uFile; uniform vec4 uSolo; uniform vec4 uBaseC, uRing;
varying vec3 vInk, vN; varying vec4 vPart; varying vec2 vUV; varying float vDepth, vSeed, vPx, vBase, vWhite, vFile;
#ifndef SOLO
// the departing file's line: s metres from its start. It leaves on the line of the last straight (a little to its left and
// above), passes lower left of the ring and from uBend.x on swings away to the left (uBend.y: the slope it settles to,
// uBend.z: metres over which it turns), sinking uBend.w to the metre
vec3 fileAt(float s){
  float e = max(1. - s / 80., 0.), t = max(s - uBend.x, 0.);
  return uFile.xyz + vec3(uHook * e * e + uSlant * s + uBend.y * (t - uBend.z * (1. - exp(-t / max(uBend.z, 1.)))), -uBend.w * s + uLift * (1. - exp(-max(s - 40., 0.) / 40.)), s);
}
#endif
void main(){
  vec3 p = position, n = normal; float part = aPart.y; vWhite = 0.; vFile = 0.;
  float seed, size = 1., env, legDrop, bank = 0., grow = 1., yAlt = 600.;
  vec3 c = vec3(0.), fwd = vec3(0., 0., 1.), outw = vec3(1., 0., 0.), upB = vec3(0., 1., 0.); float endOn = 0., skyK = 0.;
#ifdef SOLO
  seed = uSolo.y; env = uSolo.x; legDrop = uSolo.z;
#else
  seed = iB.x; size = iB.y;
  if (iB.z < .5) {
    yAlt = mod(iA.z + uAlt, max(uH, 1.));
    float r = iA.x * mix(1., mix(.42, 1., smoothstep(0., 520., yAlt)), iB.w);
    float phi = uPhase * iA.w + iA.y;
    c = vec3(r * sin(phi), yAlt, -r * cos(phi)); c.xz += uLean * (yAlt - uAlt);
    fwd = vec3(cos(phi), 0., sin(phi)); outw = vec3(sin(phi), 0., -cos(phi));
    bank = clamp(atan(20. / max(r, 4.)), .1, .62);
    bank += .09 * sin(uTime * .9 + seed * 40.) + .17 * sin(6.28318 * (uTime / max(uWave, 1.) - yAlt / 420.) + seed * .8);
    grow = smoothstep(0., 7., yAlt) * (1. - smoothstep(uH - 5., uH, yAlt));
#ifdef TICK
    // the look back down (uCalm 1): of the column below the lens only one tick in five is left, and none deeper than 380 m,
    // so the page under the rings is sea and coast and not confetti
    grow *= mix(1., step(fract(seed * 7.7), .2) * (1. - smoothstep(140., 380., uAlt - yAlt)), uCalm * smoothstep(30., 60., uAlt - yAlt));
#endif
#ifndef TICK
    grow *= 1. - smoothstep(uFunBand.x - 14., uFunBand.x - 4., yAlt) * (1. - smoothstep(uFunBand.y + 2., uFunBand.y + 10., yAlt));   // the lanes end where the funnel begins: its rings stand alone
#endif
    float lab = 1. - smoothstep(20., 85., yAlt);                                  // labouring up from the scrub
    float cyc = fract(uTime / (9. + 7. * seed) + seed * 7.);
    env = max(lab, smoothstep(0., .03, cyc) * (1. - smoothstep(.1, .14, cyc)));     // a few flaps when it slips out of lift
    float lc = fract(uTime / (13. + 9. * fract(seed * 5.3)) + seed * 3.);
    legDrop = max(lab * .8, smoothstep(0., .06, lc) * (1. - smoothstep(.16, .3, lc)) * step(.55, fract(seed * 9.7)));
  }
#ifdef FUNNEL
  else if (iB.z > 3.5) {
    // the escorts: storks that keep station on the lens (locked to the camera's phase and height). Group 0 is the stair
    // ahead (uStair), group 1 the companions inside the turn for the look back down (uStair2); each waits 46 m below
    float st = mix(uStair, uStair2, iB.w);
    // no escort is nailed to its station: each wanders round it on its own slow periods (uEsc.y is the escorts' clock, which
    // the world runs on with the climb): 3 to 5 m forward and back along the lane (less for the nearest), 2 m across it,
    // 1.3 m in height, so the stair stretches, closes and re-forms as it climbs. uEsc.x stretches the stair's leads.
    float h1 = fract(seed * 7.13), h2 = fract(seed * 13.7), h3 = fract(seed * 23.3), tE = uEsc.y;
    float lead = iA.y * mix(uEsc.x, 1., iB.w);
    float amp = min(.15, abs(lead) * .27 + .015) * mix(1., .55, iB.w);
    float phi = uPhase + lead + amp * (.7 * sin(tE * (.1 + .06 * h1) + seed * 20.) + .3 * sin(tE * (.23 + .1 * h2) + seed * 51.));
    float r = iA.x + 2. * sin(tE * (.09 + .07 * h2) + seed * 31.) * mix(1., .6, iB.w) + .4 * sin(uTime * .17 + seed * 31.);
    yAlt = uAlt + iA.z - (1. - st) * 46. + 1.3 * sin(tE * (.08 + .08 * h3) + seed * 40.) * mix(1., .7, iB.w) + .3 * sin(uTime * .6 + seed * 40.);
    c = vec3(r * sin(phi), yAlt, -r * cos(phi));
    fwd = normalize(vec3(cos(phi), .16, sin(phi))); outw = vec3(sin(phi), 0., -cos(phi));   // nose a little up: the back turns to the lens behind and above
    bank = .44 + iA.w + .07 * sin(uTime * .9 + seed * 40.);
    grow = smoothstep(.02, .3, st) * smoothstep(0., 7., yAlt);
    float cyc = fract(uTime / (9. + 7. * seed) + seed * 7.);
    env = smoothstep(0., .03, cyc) * (1. - smoothstep(.1, .14, cyc)); legDrop = 0.;
  } else if (iB.z > 2.5) {
    // THE FUNNEL: the top turns of the kettle, a cone of rings about the thermal's axis that opens upward. It is built in
    // root-local space (iC.xyz = the centre of the bird's circle, iA.x its radius), so the lens climbs through its wall and
    // then looks back down into it. Like the column it leans with the wind about the lens' own height.
    float phi = iA.y + uTime * iA.w;
    float r = iA.x * (1. + .03 * sin(uTime * .23 + seed * 20.));
    c = iC.xyz + vec3(r * sin(phi), .45 * sin(uTime * .5 + seed * 30.), -r * cos(phi));
    c.xz += uLean * (c.y - uAlt);
    vWhite = 1.;                                                                   // the rings are read from above: broad paper coverts, plum only on the hand and the trailing edge
    fwd = vec3(cos(phi), 0., sin(phi)); outw = vec3(sin(phi), 0., -cos(phi));
    bank = iC.w + .06 * sin(uTime * .9 + seed * 40.) + .08 * sin(6.28318 * (uTime / max(uWave, 1.) - c.y / 420.) + seed * .8);
    yAlt = c.y;
    float cyc = fract(uTime / (9. + 7. * seed) + seed * 7.);
    env = smoothstep(0., .03, cyc) * (1. - smoothstep(.1, .14, cyc));
    float lc = fract(uTime / (13. + 9. * fract(seed * 5.3)) + seed * 3.);
    legDrop = smoothstep(0., .06, lc) * (1. - smoothstep(.16, .3, lc)) * step(.55, fract(seed * 9.7));
  }
#endif
  else {
    float span = iB.z < 1.5 ? ${FILE_NEAR.toFixed(1)} : ${FILE_LEN.toFixed(1)};
    float s = mod(iA.z + uTime * uFile.w, span);
    float e = max(1. - s / 80., 0.);
    c = fileAt(s);
    float hk = sign(uHook);                                                        // which way the head of the file hooks in
    float trn = uBend.y * (1. - exp(-max(s - uBend.x, 0.) / max(uBend.z, 1.)));
    fwd = normalize(vec3(-.4 * e * hk + uSlant + trn, -.3, 1.)); { vec3 o1 = cross(vec3(0., 1., 0.), fwd); outw = o1 / max(length(o1), 1e-4); }   // drawn nose-down: the lens, behind and below, is shown the white underside
    bank = .85 * e * hk + .06 * sin(uTime * .8 + seed * 40.);                       // banked hard as it peels off: its white underside is turned to the lens
    grow = smoothstep(0., 8., s) * (iB.z < 1.5 ? 1. : step(${FILE_NEAR.toFixed(1)}, s) * (1. - smoothstep(${(FILE_LEN - 80).toFixed(1)}, ${FILE_LEN.toFixed(1)}, s)));
    env = (1. - smoothstep(0., 30., s)) * .5; legDrop = 0.; yAlt = 600.;
  }
#endif
  // ---- where the bird is, how big it is on the page
  vec4 wc = modelMatrix * vec4(c, 1.);
  vec3 toC = wc.xyz - cameraPosition; float dist = max(length(toC), 1e-3);
#ifndef SOLO
  // nothing stands between the lens and the ring: a bird that would cross the portal's disc or its one-radius margin
  // slides outward from the lens-to-ring line instead (uRing.w: 0 until the ring is the subject)
  vec3 ts = (modelMatrix * vec4(uRing.xyz, 1.)).xyz - cameraPosition; float dsr = max(length(ts), 1e-3); ts /= dsr;
  float tA = dot(toC, ts); vec3 pv = toC - ts * tA + vec3(.013, -.021, .008); float pl = max(length(pv), 1e-3);
  float needR = clamp(tA, 0., dsr + 8.) * min(14. / dsr, .7) * uRing.w * step(0., tA) * (1. - smoothstep(dsr + 2., dsr + 8., tA));
  wc.xyz += pv / pl * max(needR - pl, 0.);
  toC = wc.xyz - cameraPosition; dist = max(length(toC), 1e-3);
  wc.xyz += toC / dist * max(uBubble - dist, 0.);                                 // nothing comes within the bubble of the lens
  dist = max(dist, uBubble);
  // the departing file as A DOTTED THREAD. Wherever a bird at its held size would be drawn wider than the gap to the next on
  // the page (the file seen end-on or nearly, and all of it from the last straight), the birds go to their true size (never
  // under 10 design px) and are thinned by halves, bird by bird (every second, every fourth ... by the bird's own number, each
  // fading out at its own distance), so that the gap on the page always stays wider than a bird: separate paper ticks with
  // plum hands, from beside the ring down to the far coast, and never a ladder of rungs or a solid line.
  if (iB.z > .5 && iB.z < 2.5) {
    float sF = mod(iA.z + uTime * uFile.w, iB.z < 1.5 ? ${FILE_NEAR.toFixed(1)} : ${FILE_LEN.toFixed(1)});
    vec3 nx = (modelMatrix * vec4(fileAt(sF + 9.), 1.)).xyz - cameraPosition;
    float ppr = projectionMatrix[1][1] * uBufH * .5, ppm = ppr / dist;
    float gap = length(cross(toC / dist, nx / max(length(nx), 1e-3))) * ppr;         // pixels from this bird to the next on the page
    float wide = max(ppm * 2.05 * size, uMinPx * (iB.z < 1.5 ? 3.8 : 1.));           // ... and how wide it would be drawn at its held size
    endOn = smoothstep(.9, 1.7, wide / max(gap, 1e-3)) * smoothstep(34., 80., dist);
    skyK = smoothstep(.02, .045, toC.y / dist);                                     // above the far coast the ground is the dark sky or the base: paper there, and two dot pitches of it
    float wideT = max(ppm * 2.05 * size, uMinPx * mix(1.3, 2., skyK));
    float lv = log2(max((1.25 * wideT + .1 * uMinPx) / max(gap, 1e-3), 1e-3));
    float j = floor(iA.z / 9. + .5);
    float tz = j < .5 ? 8. : mod(j, 2.) > .5 ? 0. : mod(j, 4.) > .5 ? 1. : mod(j, 8.) > .5 ? 2. : mod(j, 16.) > .5 ? 3. : mod(j, 32.) > .5 ? 4. : mod(j, 64.) > .5 ? 5. : 6.;
    grow *= mix(1., 1. - smoothstep(tz - .1, tz + .4, lv), endOn);
    vFile = endOn;
    // ... and each of them is turned to show the lens its whole back (its wing plane square to the line of sight, its body
    // along the file's line on the page): end-on a bird is a hairline, in plan it is a bird
    mat3 MR = mat3(modelMatrix);
    vec3 vd = toC / dist, fdir = nx - toC; fdir -= vd * dot(fdir, vd);
    float fl = length(fdir);
    if (fl > 1e-3 && endOn > 0.) {
      vec3 f2 = mix(fwd, (fdir / fl) * MR, endOn), u2 = mix(upB, (-vd) * MR, endOn);
      fwd = f2 / max(length(f2), 1e-4); upB = u2 / max(length(u2), 1e-4);
      vec3 o2 = cross(upB, fwd); outw = o2 / max(length(o2), 1e-4); upB = cross(fwd, outw);
      bank *= 1. - endOn;
    }
  }
  // is the cloud base behind this bird? (the ray from the lens through it meets the dark underside): then it prints as paper
  float baseY = (modelMatrix * vec4(0., uH, 0., 1.)).y;
  vec2 hit = cameraPosition.xz + toC.xz * ((baseY - cameraPosition.y) / max(toC.y, 1e-3)) - (modelMatrix * vec4(uBaseC.x, uH, uBaseC.y, 1.)).xz;
  vBase = step(.03, toC.y / dist) * (1. - smoothstep(uBaseC.z, uBaseC.z + 90., length(hit * vec2(.89, 1.)))) * uBaseC.w;
  vBase = max(vBase, endOn * skyK);
#else
  vBase = 0.;
#endif
  float pxPerM = projectionMatrix[1][1] * uBufH * .5 / dist;
  vPx = pxPerM * 2.05 * size;
  float big = smoothstep(18., 30., vPx);                                          // thin parts are fattened only on birds drawn as paper
  // ---- a wing seen edge-on is thinner than the dot screen can draw: lean it toward the lens (the side already showing)
  // until its chord covers uChordPx on the page. Never more than half a radian.
  float cbT = cos(bank), sbT = sin(bank);
  mat3 MT = mat3(modelMatrix);
  vec3 axY = MT * (upB * cbT - outw * sbT), axZ = MT * fwd, vv = -toC / dist;
  float vy = dot(vv, axY), vz = dot(vv, axZ);
  float want = min(uChordPx / max(pxPerM * .34 * size, 1e-4), .5);
  float tw = clamp(asin(want) - asin(min(abs(vy), 1.)), 0., .5) * smoothstep(.25, .6, abs(vz)) * (vy * vz > 0. ? -1. : 1.);
  if (part > .5 && part < 2.5) {
    float ct = cos(tw), st = sin(tw); vec2 yz = vec2(p.y - .045, p.z);
    p.y = .045 + yz.x * ct + yz.y * st; p.z = yz.y * ct - yz.x * st;
  }
  // ---- wings: flap about the shoulder, the hand lagging; on set wings the tips ride up and the fingers work
  float d = abs(aPart.x), sg = sign(aPart.x);
  float fph = uTime * (11. + 3. * fract(seed * 3.7)) * mix(1., .72, step(.9, env)) + seed * 50.;
  if (d > 0.) {
    float a = mix(.17, .07, env) + env * (.62 * sin(fph) + .1);                    // set wings: arm lifted, hand drooped, fingers up
#ifdef TICK
    a += .26;                                                                      // a tick keeps a shallow V so it never goes edge-on to nothing
#endif
    float aTip = env * .5 * sin(fph - 1.1) - (1. - env) * (.25 + .03 * sin(uTime * 1.3 + seed * 20.));
    float dOut = max(d - .5, 0.);
    float xl = d * cos(a) + dOut * (cos(a + aTip) - cos(a));
    p.y += d * sin(a) + dOut * (sin(a + aTip) - sin(a));
    p.x = sg * (${WING_ROOT.toFixed(3)} + xl);
    if (part > 1.5 && part < 2.5) {
      float t = aPart.w, k = aPart.z;
      p.y += t * t * (.075 + .03 * sin(uTime * 1.7 + k * 1.3 + seed * 20.)) * (1. - env * .6) * step(k, 5.5);
      p.z += t * .028 * sin(uTime * .8 + k * .9 + seed * 9.) - t * env * .05 * cos(fph);
    }
  }
  // ---- bill and legs never thinner than 3 px, so the plates still overlap on them when they slip (a solo stork, which the
  // world flies at arm's length and scales up, is fattened by a fifth at most within 8 m: its legs are two hairline red lines)
#ifdef SOLO
  float fatMax = mix(1.2, 3., smoothstep(8., 16., dist));
#else
  float fatMax = 3.;
#endif
  if (part > 4.1 && part < 4.4) p.xy += aUV * (clamp(2.6 / max(pxPerM * .042, 1e-4), 1., fatMax) - 1.) * big;
  // ---- head turns, legs drop and tuck
  if (part > 3.5 && part < 4.5) {
    float yaw = .55 * sin(uTime * .37 + seed * 30.) * smoothstep(.2, .9, sin(uTime * .23 + seed * 11.)) * aPart.w * aPart.w;
    float cy = cos(yaw), sy = sin(yaw); vec2 hz = vec2(p.x, p.z - .26);
    p.x = hz.x * cy + hz.y * sy; p.z = .26 - hz.x * sy + hz.y * cy;
    n.xz = vec2(n.x * cy + n.z * sy, -n.x * sy + n.z * cy);
  }
  if (part > 2.5 && part < 3.5) {
    p.xy += aUV * (clamp(2.2 / max(pxPerM * .03, 1e-4), 1., fatMax) - 1.) * big;
#ifdef SOLO
    p.x -= aPart.z * .022 * uSolo.w; p.xy -= aUV * .35 * uSolo.w;                   // (uSolo.w: seen from below against the cloud, the legs trail as one thin line)
#endif
    float la = legDrop * 1.05, cl = cos(la), sl = sin(la); vec2 yz = vec2(p.y + .05, p.z + .16);
    p.y = -.05 + yz.x * cl + yz.y * sl; p.z = -.16 - yz.x * sl + yz.y * cl;
  }
  // ---- place the bird
  float cb = cos(bank), sb = sin(bank);
  vec3 up = upB;
  float sc = size * grow, zf = 1.;
#ifndef SOLO
  float mn = uMinPx * (1. + .65 * vBase);                                         // paper on the dark base wants two dot pitches
#ifdef FUNNEL
  // modelled birds hold a size on the page: escorts 27 design px, the head of the file 30, the funnel's rings 24 (13 far
  // off: one floor for a far ring bird, by its range alone, from 130 to 300 m)
  mn = uMinPx * (iB.z > 3.5 ? 3.4 : iB.z > 2.5 ? mix(3., 1.6, smoothstep(130., 300., dist)) : 3.8);
#endif
#ifdef TICK
  mn *= mix(1., .36, smoothstep(.45, .8, -toC.y / dist) * smoothstep(200., 700., dist));   // looked down on from the top, the far column must not clot
#endif
  mn = mix(mn, uMinPx * mix(1.3, 2., skyK), endOn);
  float kMin = max(1., mn / max(vPx, 1e-4));                                      // no bird is ever narrower than its minimum on the page
  sc *= kMin;
  zf += .9 * endOn * clamp(kMin - 1., 0., 1.);                                    // a thread bird held at its floor is drawn broader in the chord: a mark, not a hairline
#ifdef FUNNEL
  vPx *= kMin;                                                                    // ... and one held at that size keeps its three inks
#endif
#endif
  vec3 q = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z * zf) * sc;
  vec3 nn = vec3(n.x * cb - n.y * sb, n.x * sb + n.y * cb, n.z);
  mat3 M3 = mat3(modelMatrix);
  vec3 w = wc.xyz + M3 * (outw * q.x + up * q.y + fwd * q.z);
  vN = M3 * (outw * nn.x + up * nn.y + fwd * nn.z);
  vInk = ink; vPart = aPart; vUV = aUV; vSeed = seed;
  vec4 mv = viewMatrix * vec4(w, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;

const STORK_FRAG = /* glsl */`precision highp float;
${INK_GLSL}
uniform float uUnder, uBlack, uGold; uniform vec4 uSolo;
varying vec3 vInk, vN; varying vec4 vPart; varying vec2 vUV; varying float vDepth, vSeed, vPx, vBase, vWhite, vFile;
void main(){
  vec3 n = vN / max(length(vN), 1e-5); if (!gl_FrontFacing) n = -n;
  float lit = dot(n, uSunDir);
  vec3 ink = vInk; float part = vPart.y;
  float black = step(1. - uBlack, fract(vSeed * 17.31));                           // one in ten a black stork (cast variation)
#ifdef TICK
  // far birds: a tick that flips between paper and plum as its bank turns it to and from the sun
  float top = smoothstep(-.02, .14, lit);
  // against the dark cloud base a plum tick would vanish: there it prints as paper with plum tips and a plum trailing edge
  // (a tick of the departing thread: bare paper on the dark sky and base, plum on the pale coast and sea, so it reads on both)
  float thr = vFile * (1. - vBase);
  float flight = max(step(mix(mix(.6, .8, vBase), .3, thr), vUV.x), step(mix(mix(.74, .84, vBase), .5, thr), vUV.y));
  float plum = max(max(flight, (1. - top) * (1. - max(vBase, vFile))), max(black, vFile * (1. - vBase)));
  plum *= 1. - vFile * vBase;                                                      // (a thread tick on the dark sky is bare paper: nothing at that size but the mark)
  ink = vec3(plum, plum, 0.);
#else
  float sWing = vUV.x, cWing = vUV.y;
  float fs = sWing * 30. + cWing * 2.2, lw = max(fwidth(fs), 1e-4), fc = fwidth(cWing) * 1.5 + 1e-4;
  float fkey = clamp(fwidth(vUV.y) * .8, 1e-3, .3);                                        // (taken outside the branches: the paper key of a hand feather, below)
  if (part > .5 && part < 1.5) {
    // the arm: white coverts in front with a scalloped edge, plum secondaries behind, feather gaps knocked out as paper lines
    float edge = mix(.52, .62, vWhite) + .04 * abs(sin(sWing * 3.14159 * 30.));
    float plum = smoothstep(edge - fc, edge + fc, cWing);
    float f = abs(fract(fs) - .5);
    float line = (1. - smoothstep(lw * .7, lw * 1.5, f)) * (1. - smoothstep(.16, .45, lw)) * smoothstep(edge + .03, edge + .1, cWing);
    float row = (1. - smoothstep(fc * .5, fc * 1.3, abs(cWing - .72))) * (1. - smoothstep(.02, .06, fc));
    plum *= 1. - max(line, row * .85);
    plum = max(plum, black * (1. - max(line, row) * .0));
    ink = vec3(plum, plum, 0.);
  }
#ifdef SOLO
  // A solo stork flown against the dark cloud base (uSolo.w = 1): plum flight feathers would be lost in the plum of the cloud,
  // so each is KEYED with bare paper: a finger is a plum shaft between two paper edges with a paper tip, and the plum band
  // of the arm ends in a paper line along the trailing edge (the gaps between its feathers are paper lines already)
  if (uSolo.w > 0.) {
    if (part > 1.5 && part < 2.5) {
      ink *= 1. - uSolo.w * max(smoothstep(.3 - fkey, .3 + fkey, abs(vUV.y)), smoothstep(.9, .97, vPart.w));
    } else if (part > .5 && part < 1.5) ink *= 1. - uSolo.w * smoothstep(.93 - fc, .93 + fc, cWing);
  }
#endif
  if (black > .5 && part < .5) { float belly = (1. - smoothstep(-.03, .02, n.y)) * step(vInk.r, .5); ink = mix(vec3(1., 1., 0.), ink, belly); }
  if (black > .5 && part > 3.5 && part < 4.5 && vInk.b < .5) ink = vec3(1., 1., 0.);
  // light is ink: white takes only a light dot on its shaded side (the underwing 12-15 percent); golden hour lines it with yellow
  // a bird narrower than three dot pitches would be lost in the screen: it becomes a solid tick (no vermilion, shaded side plum)
  float small = (1. - smoothstep(15., 21., vPx)) * (1. - vBase);                    // ... unless the dark base is behind it
  ink = mix(ink, vec3(1., 1., 0.), small * step(.5, ink.b));
  float bare = vFile * vBase * (1. - smoothstep(15., 21., vPx));                    // (a small bird of the thread on the dark sky is bare paper: no vermilion, no plum, no shade)
  ink = mix(ink, vec3(0.), bare);
  float white = 1. - max(ink.r, max(ink.g, ink.b));
  ink.rg = max(ink.rg, vec2(white * small * max(1. - smoothstep(-.02, .14, lit), vFile)));      // (a small bird of the departing thread is plum whichever way it is lit)
  white = 1. - max(ink.r, max(ink.g, ink.b));
  float sh = 1. - smoothstep(-.35, .3, lit);
  ink.g += white * sh * uUnder * (1. - bare);
  ink.b += white * step(.5, uGold) * (smoothstep(-.05, .05, lit) - smoothstep(.3, .42, lit)) * (1. - bare);
#endif
  ink = inkHaze(ink, vDepth * (1. - .8 * vFile));                                  // (the thread keeps its ink through the haze: it is the last thing read)
  gl_FragColor = inkOut(ink, vDepth);
}`;

function storkMaterial(press, K, defines) {
  return new THREE.ShaderMaterial({ uniforms: { ...press.shared, ...K }, defines, vertexShader: STORK_VERT, fragmentShader: STORK_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false });
}

// a free stork (the nest pair, the bird that crosses the lens, the three labouring up at the entry): a Mesh the world
// moves itself (+Z forward). uniforms.uSolo = (flap 0-1, seed, legs dropped 0-1, 0).
export function makeSoloStork(press, o = {}) {
  const K = kettleUniforms(o.height ?? 1280);
  K.uSolo.value.set(o.flap ?? 0, o.seed ?? 0.37, o.legs ?? 0, 0);
  const mesh = new THREE.Mesh(o.geometry || buildStorkGeometry(0), storkMaterial(press, K, { SOLO: 1 }));
  mesh.frustumCulled = false; mesh.layers.set(INK_LAYER);
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => { const rt = renderer.getRenderTarget(); const h = rt ? rt.height : renderer.domElement.height; material.uniforms.uBufH.value = h; material.uniforms.uChordPx.value = 5.5 * h / 450; };
  return mesh;
}

function kettleUniforms(H) {
  return {
    uPhase: { value: 0 }, uAlt: { value: 0 }, uH: { value: H }, uBubble: { value: 6.5 }, uBufH: { value: 450 }, uMinPx: { value: 2.6 },
    uWave: { value: 16 }, uBlack: { value: 0 }, uChordPx: { value: 5.5 }, uLean: { value: new THREE.Vector2() }, uFile: { value: new THREE.Vector4(-26, H - 12, 36, 11) },
    uSolo: { value: new THREE.Vector4(0, 0, 0, 0) }, uUnder: { value: 0.14 }, uGold: { value: 0 }, uStair: { value: 1 }, uStair2: { value: 0 }, uHook: { value: -6 }, uSlant: { value: 0.052 },
    uCalm: { value: 0 }, uBend: { value: new THREE.Vector4(1e5, 0, 60, 0.075) }, uLift: { value: 0 },
    uRing: { value: new THREE.Vector4(0, H, 0, 0) }, uFunBand: { value: new THREE.Vector2(1e6, 1e6) }, uEsc: { value: new THREE.Vector2(1, 0) }, uBaseC: { value: new THREE.Vector4(0, 0, 360, 0) },
  };
}

function instanced(base, iA, iB) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
  g.instanceCount = iA.length / 4;
  return g;
}

// monotone cubic through [x, y] keys (Fritsch-Carlson): no overshoot, so the climb never dips
function monotone(keys) {
  const n = keys.length, dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx.push(keys[i + 1][0] - keys[i][0]); m.push((keys[i + 1][1] - keys[i][1]) / dx[i]); }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  return (x) => {
    if (x <= keys[0][0]) return keys[0][1]; if (x >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (x > keys[i + 1][0]) i++;
    const h = dx[i], u = (x - keys[i][0]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h * t[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h * t[i + 1];
  };
}

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('stork-kettle') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = opts.palette || DEFAULT_PALETTE;
  const H = opts.height ?? 1280, R = opts.radius ?? 125, LANE = 36, OMEGA = 14 / LANE;

  // ---- the seeded edition (the world reads hero.mood and dresses the rest to match)
  const mood = {
    hour: opts.hour || (rng.chance(0.6) ? 'noon' : rng.chance(0.6) ? 'golden' : 'haze'),
    wind: opts.wind || (rng.chance(0.4) ? 'east' : 'calm'),
    cast: opts.cast || rng.pick(['white', 'white', 'black', 'packed', 'thin']),
    lineScreen: opts.lineScreen ?? rng.chance(0.25),
    paper: opts.paper || (rng.chance(0.35) ? '#F2E8D0' : pal[0]),
    wander: opts.wander || rng.pick(['blue', 'pink', 'both']),
  };
  mood.leanDeg = opts.leanDeg ?? (mood.wind === 'east' ? 12 : rng.range(1.5, 4));
  const sun = mood.hour === 'golden' ? new THREE.Vector3(-Math.cos(0.436), Math.sin(0.436), 0.12) : new THREE.Vector3(0, Math.sin(1.117), Math.cos(1.117));
  const ownPress = !opts.press;
  const viewer = ownPress && opts.exposure == null;      // no opts at all: the part viewer, whose post we cannot set
  const press = opts.press || makePress({
    palette: pal, paper: mood.paper, lineScreen: mood.lineScreen, sunDir: sun, exposure: viewer ? VIEWER.exposure : opts.exposure, dim: viewer ? VIEWER.dim : 1, backdrop: opts.backdrop,
    hazeInk: mood.hour === 'haze' ? 3600 : 8000, hazeBlue: mood.hour === 'haze' ? 2200 : 5200, hazeTone: mood.hour === 'haze' ? 0.15 : 0.22,
    skyTop: mood.hour === 'haze' ? 0.44 : mood.hour === 'golden' ? 0.52 : 0.58, skyHorizon: mood.hour === 'haze' ? 0.04 : 0.12, skyGold: mood.hour === 'golden' ? 1 : 0,
  });
  if (viewer) press.setGrade(VIEWER.grade[0], VIEWER.grade[1]);
  if (ownPress) press.uniforms.uWander.value.set(mood.wander === 'pink' ? 0.55 : 1, mood.wander === 'blue' ? 0.55 : 1, 0);

  const group = new THREE.Group(); group.name = 'stork-kettle';
  if (ownPress) { group.add(press.page); group.add(press.sky); }
  await ctx.yield?.();

  // ---- who flies where. Column birds: iA = radius, phase offset, height offset, rate factor.
  const spacing = opts.spacing ?? rng.range(11.4, 12.6), rise = opts.rise ?? rng.range(1.5, 1.75);
  const density = mood.cast === 'thin' ? 0.72 : 1;
  const lanes = opts.lanes || [20, 28, 36, 44, 52, 70];
  const A0 = [], B0 = [], A1 = [], B1 = [], A2 = [], B2 = [], AF = [], BF = [], CF = [];
  const KMAX = 35, BAND0 = KMAX * rise + 6;
  lanes.forEach((r) => {
    const own = r === LANE, close = Math.abs(r - LANE) < 10;
    // lanes slide past each other at up to 2 m/s; the camera's own lane holds station
    const sig = own ? 0 : close ? rng.range(0.5, 1.1) * rng.sign() : r < LANE ? rng.range(0.9, 1.7) * rng.sign() : -rng.range(0.8, 2.0);
    const off = own ? 0 : rng() * TAU, f = 1 - sig / (r * OMEGA);
    for (let k = -KMAX; k <= KMAX; k++) {
      const jr = own ? 0.5 : 1.2;
      const a = [r + rng.range(-jr, jr), k * spacing / r + off + rng.range(-0.012, 0.012), ((k * rise + rng.range(-0.3, 0.3)) % H + H) % H, f];
      const b = [rng(), rng.range(1.0, 1.16), 0, 0];
      const thin = rng();
      if (own && k >= 0 && k <= 3) continue;                          // the camera's own slot, and the three ahead of it (the escort stair flies there, lower)
      const near = own ? Math.abs(k) <= 12 : close && Math.abs(k) <= 6;
      if (!near && !own && thin > Math.min(density, 0.6 + 0.4 * detail)) continue;
      if (near) { A0.push(...a); B0.push(...b); } else { A1.push(...a); B1.push(...b); }
    }
  });
  // the rest of the column: helical strands of ticks from the scrub to the cloud base, never within BAND0 of the camera's height
  const nTick = Math.round((opts.ticks ?? 5600) * (mood.cast === 'packed' ? 1 : mood.cast === 'thin' ? 0.72 : 0.9) * lerp(0.7, 1, clamp((detail - 0.6) / 0.4, 0, 1)));
  const band = H - 2 * BAND0, RS = R / 125;
  const strands = [[20, 12, 34], [36, 13, 34], [66, 18, 40], [100, 24, 46]].map((q) => ({ r: q[0] * RS + rng.range(-2, 2), sp: q[1] * rng.range(0.92, 1.08), pitch: q[2] * rng.range(0.9, 1.12) }));
  let want = 0; for (const q of strands) { q.n = (band / q.pitch) * TAU * q.r / q.sp; want += q.n; }
  const kTick = (nTick * 0.94) / want;
  strands.forEach((q) => {
    const n = Math.floor(q.n * kTick), dphi = (band / q.pitch) * TAU / n, off = rng() * TAU, f = Math.pow(LANE / q.r, 0.55) * rng.range(0.96, 1.04);
    for (let m = 0; m < n; m++) {
      A2.push(q.r + rng.range(-1.6, 1.6), m * dphi + off + rng.range(-0.02, 0.02), BAND0 + (m + rng.range(-0.25, 0.25)) / n * band, f);
      B2.push(rng(), rng.range(0.95, 1.1), 0, 1);
    }
  });
  for (let m = Math.round(nTick * 0.06); m > 0; m--) {              // stragglers between the strands
    const r = rng.range(14, R);
    A2.push(r, rng() * TAU, BAND0 + rng() * band, Math.pow(LANE / r, 0.55)); B2.push(rng(), rng.range(0.95, 1.1), 0, 1);
  }
  // the departing file: 180 birds 9 m apart; the first 360 m fly as modelled storks, the rest as ticks
  const FILE_N = 180, FILE_NEAR_N = Math.round(FILE_NEAR / 9);
  // (with the funnel they ride in its mesh as fully modelled storks, a little larger: each in turn is the one that peels off beside the ring)
  const FILE_HEAD = opts.funnel === false ? 0 : FILE_NEAR_N;
  for (let j = 0; j < FILE_NEAR_N; j++) {
    const b = [rng(), rng.range(0.95, 1.05), 1, 0];
    if (j < FILE_HEAD) { AF.push(0, 0, j * 9, 1); BF.push(b[0], b[1] * 1.65, 1, 0); CF.push(0, 0, 0, 0); } else { A1.push(0, 0, j * 9, 1); B1.push(...b); }
  }
  for (let j = 0; j < FILE_N; j++) { A2.push(0, 0, j * 9, 1); B2.push(rng(), 1, 2, 0); }
  await ctx.yield?.();

  // ---- geometry and materials: three levels of detail, three draw calls
  const K = kettleUniforms(H);
  K.uBlack.value = mood.cast === 'black' ? 0.1 : 0; K.uGold.value = mood.hour === 'golden' ? 1 : 0;
  K.uWave.value = opts.wavePeriod ?? 16; K.uBubble.value = opts.bubble ?? 6.5;
  const lean = Math.tan(mood.leanDeg * Math.PI / 180); K.uLean.value.set(-lean, 0);          // downwind is west
  const g0 = buildStorkGeometry(0); await ctx.yield?.();
  const g1 = buildStorkGeometry(1), g2 = buildTickGeometry();
  const mats = [storkMaterial(press, K, {}), storkMaterial(press, K, {}), storkMaterial(press, K, { TICK: 1 })];
  const meshes = [[g0, A0, B0], [g1, A1, B1], [g2, A2, B2]].map(([g, a, b], i) => {
    const m = new THREE.Mesh(instanced(g, a, b), mats[i]);
    m.frustumCulled = false; m.layers.set(INK_LAYER); m.name = 'storks-lod' + i; group.add(m); return m;
  });
  await ctx.yield?.();

  // ---- the suggested flight, in local XZ with PATH heights (the engine's path climbs about 150 m; see altitudeAt for the rest):
  // the level lead-in, two right-hand turns of helix at 36 m rising 14 degrees (which keeps the exit ring high out of the
  // entry view and of the level gaze until the top), then out of the turn on its tangent, due south, 85 m straight and
  // 12 degrees up to the ring
  const fly = [], D2R = Math.PI / 180;
  const at = (r, deg) => [r * Math.sin(deg * D2R), -r * Math.cos(deg * D2R)];
  const RISE = LANE * 30 * D2R * Math.tan(14 * D2R), T8 = Math.tan(12 * D2R);
  let py = 15;
  fly.push([LANE, py, -70], [LANE, py, -35]);
  for (let deg = 90; deg <= 810; deg += 30) { const p = at(LANE, deg); fly.push([p[0], py, p[1]]); if (deg < 810) py += RISE; }
  for (const z of [28, 56, 85]) fly.push([LANE, py + z * T8, z]);
  const flyThrough = fly.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  // the time-lapse: altitude = path height + an offset that grows through the climb and is CONSTANT from u 0.85, so the
  // last straight is flown rigidly (nothing slides against the ring). Keys are the apparent altitudes at u.
  const fpath = makePath(flyThrough), tp = new THREE.Vector3();
  const pathYAt = (u) => fpath.pointAt(clamp(u, 0, 1), tp).y;
  const sH = H / 1280, U_TOP = 0.86;
  const offKeys = [[0, 15], [0.114, 15], [0.26, 180], [0.40, 480], [0.50, 780], [0.59, 1010], [0.66, 1130], [0.74, 1215], [0.80, 1244], [0.85, 1256], [1, 0]]
    .map((k, i) => [k[0], i < 2 ? 0 : k[1] * sH - pathYAt(k[0])]);
  offKeys[offKeys.length - 1][1] = offKeys[offKeys.length - 2][1];
  const offAt = monotone(offKeys);
  const altitudeAt = (u) => pathYAt(u) + offAt(clamp(u, 0, 1));
  const endP = flyThrough[flyThrough.length - 1], A_TOP = altitudeAt(U_TOP);
  const seat = new THREE.Vector3(endP.x, altitudeAt(1), endP.z);
  // the file leaves from under the cloud base over the east side of the kettle, 14 m above the lens' line out of the turn,
  // hooks out to its left and runs south (3 degrees east of south, 1:13 down): from the last straight it comes down across
  // the left of the view, passes 14 m from the ring's centre (lower left) and falls away toward the far continent
  const fs = opts.fileStart || [LANE + 6.7, A_TOP + 15.8, -24]; K.uHook.value = opts.fileHook ?? -6; K.uSlant.value = opts.fileSlant ?? 0.052;
  K.uFile.value.set(fs[0], fs[1], fs[2], opts.fileSpeed ?? 11);
  K.uRing.value.set(seat.x, seat.y, seat.z, 0);
  // the file's swing to the left: from 96 m on (just short of the ring) it turns over 60 m to a line 39 degrees east of south
  // and sinks 3 m in a hundred, so from the last straight it runs from beside the ring down the left third of the page to the far coast
  const fb = opts.fileBend || [96, 0.8, 60, 0.03]; K.uBend.value.set(fb[0], fb[1], fb[2], fb[3]); K.uLift.value = opts.fileLift ?? 4.5;
  if (opts.base) K.uBaseC.value.set(opts.base[0], opts.base[1], opts.base[2] ?? 360, 1);
  await ctx.yield?.();

  // ---- THE FUNNEL and THE ESCORTS (one more draw call of modelled storks; no random draws: placed by hash so seeds keep their look)
  // THE FUNNEL is the top of the kettle: about 265 storks (packed; 233 plain, 194 thin) nose to tail on a conical helix about the thermal's axis, five
  // turns from 22 m under the top of the climb down 84 m, 44 m wide at the top ring and 13 m at the lowest. The lens' lane
  // (36 m) passes through its wall two thirds of the way up, so the climb goes THROUGH it: the birds of the turns that
  // cross the lane (the circles 32 to 40 m wide, which pass the lens at arm's length) are fully modelled storks in the
  // company's mesh, the rest the lighter model in a draw call of their own. From the top it is looked back down into:
  // ring inside ring of paper backs over the headland and the strait.
  const hsh = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
  const funY1 = A_TOP - 22, funY0 = funY1 - 84, funTurns = opts.funnelTurns ?? 5;
  const funR = (f) => lerp(44, 13, f);                               // f: 0 at the top ring, 1 at the lowest
  let nFunnel = 0;
  if (opts.funnel !== false) {
    const tight = mood.cast === 'packed' ? 0.88 : mood.cast === 'thin' ? 1.2 : 1;
    const total = funTurns * TAU, AR = [], BR = [], CR = [];
    let a = 0, i = 0;
    while (a < total && i < 280) {
      const f = a / total, r0 = funR(f), y = funY1 - (funY1 - funY0) * f;
      const close = Math.abs(r0 - LANE) < 4, a4 = close ? AF : AR, b4 = close ? BF : BR, c4 = close ? CF : CR;
      a4.push(r0 + (hsh(i, 1) - 0.5) * 1.0, 0.6 + a, 0, clamp(12 / r0, 0.27, 0.62)); b4.push(hsh(i, 2), lerp(1.3, 1.45, f) + hsh(i, 3) * 0.06, 3, 0);
      c4.push(0, y + (hsh(i, 4) - 0.5) * 0.8, 0, clamp(Math.atan(20 / r0), 0.2, 0.6) * 0.8);
      a += lerp(4.2, 3.4, f) * tight / r0; i++;
    }
    nFunnel = i; K.uFunBand.value.set(funY0, funY1);
    const matF = storkMaterial(press, K, { FUNNEL: 1 });
    const gR = instanced(g1, AR, BR); gR.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(CR), 4));
    const mR = new THREE.Mesh(gR, matF);
    mR.frustumCulled = false; mR.layers.set(INK_LAYER); mR.name = 'storks-rings'; group.add(mR); meshes.push(mR); mats.push(matF);
    // the escorts, in the lens' own frame: [metres ahead along the lane, radius, drop below the lens, size, group, extra bank]
    // group 0, the stair: seven storks stepping down and to the right ahead of the lens on the inside of the lane, all below
    // it so their backs show (on the page they step UP to the right), and three outside the lane, ahead-left and below;
    // group 1, for the look back down (the gaze is then 58 degrees down, ahead and inside the turn): eight storks 6 to 26 m
    // below, backs to the lens, placed over the whole page at 10 to 30 m (three of them a fifth of the page high and more).
    // opts.stairLayout (0 | 1 | 2) picks one of three stairs, so two visits do not show the same birds in the same places.
    const STAIRS = [
      [[8.6, 34.4, 5.6, 1.45], [13.5, 33.6, 6.3, 1.4], [19, 32.6, 6.9, 1.36], [25.5, 31.6, 7.4, 1.36], [32.5, 30.8, 7.8, 1.38], [41, 30.2, 8.1, 1.38], [49.5, 29.8, 8.4, 1.4],
        [8.5, 41.5, 3.6, 1.3], [17, 43.5, 6.2, 1.32], [27.5, 45, 8.6, 1.36]],
      [[9.5, 33.2, 4.6, 1.45], [15, 35.2, 7.6, 1.4], [21, 31.4, 5.8, 1.38], [28, 33.6, 9.0, 1.38], [35, 29.6, 6.8, 1.38], [44, 31.6, 9.6, 1.4], [53, 28.6, 8.0, 1.4],
        [11, 40.5, 4.6, 1.3], [21, 42.5, 7.4, 1.34], [33, 44.5, 10.2, 1.38]],
      [[9.2, 35.4, 6.4, 1.45], [12.5, 31.8, 4.9, 1.4], [18, 34.2, 8.2, 1.38], [24, 30.2, 6.4, 1.36], [30, 32.6, 9.4, 1.38], [38, 28.8, 7.2, 1.38], [47, 31.0, 10.2, 1.4],
        [7.5, 40.6, 5.2, 1.3], [15, 42.8, 3.8, 1.32], [25, 44.6, 7.2, 1.36]],
    ];
    const ESC = opts.escort || [
      ...STAIRS[clamp(Math.round(opts.stairLayout ?? 0), 0, 2)].map((e, j) => [e[0], e[1], e[2], e[3], 0, j > 6 ? 0.08 : 0]),
      [8, 35.6, 5.9, 1.4, 1, 0], [0.6, 26.7, 9.1, 1.4, 1, 0.04], [4.4, 36.8, 11.1, 1.4, 1, 0], [13.7, 43, 12.5, 1.45, 1, 0.06], [8.5, 23.2, 13, 1.45, 1, 0.06],
      [-5.8, 26.8, 18.9, 1.5, 1, 0.06], [22.7, 33.1, 13.5, 1.5, 1, 0], [4.1, 22.1, 26.1, 1.55, 1, 0.1],
    ];
    ESC.forEach((e, j) => { AF.push(e[1], e[0] / e[1], -e[2], e[5] || 0); BF.push(hsh(j, 7), e[3], 4, e[4]); CF.push(0, 0, 0, 0); });
    const gF = instanced(g0, AF, BF); gF.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(CF), 4));
    const mF = new THREE.Mesh(gF, matF);
    mF.frustumCulled = false; mF.layers.set(INK_LAYER); mF.name = 'storks-company'; group.add(mF); meshes.push(mF);
  }

  // ---- state driven from update()
  const lp = new THREE.Vector3(), bufSize = new THREE.Vector2(), minPx = opts.tickPx ?? 8;
  let phase = rng() * TAU, havePhase = false, prevPhi = 0, phaseSet = null, altSet = null, escClock = 0;
  const hero = {
    object: group, radius: R, height: H, center: new THREE.Vector3(0, H * 0.5, 0), ground: false, groundY: 0,
    press, mood, uniforms: K, meshes, materials: mats, altitudeAt, laneRadius: LANE, lanes, spacing, omega: OMEGA,
    styleMaterial: (o) => styleMaterial(press, o),
    makeSoloStork: (o = {}) => makeSoloStork(press, { height: H, geometry: g0, ...o }),
    setAltitude(y) { altSet = y; }, setPhase(phi) { phaseSet = phi; },
    setProgress(u) { altSet = altitudeAt(u); },
    setStair(k, k2 = 0) { K.uStair.value = clamp(k, 0, 1); K.uStair2.value = clamp(k2, 0, 1); },   // 0: that escort group waits 46 m below, 1: in place by the lens
    // the escorts' stair: lead stretches its spacing along the lane (1 = as built), clock is added to the time their slow
    // wander runs on (a world keys it to its u, so that the stair re-forms with the climb and not only with the clock)
    setEscort(lead = 1, clock = 0) { K.uEsc.value.x = lead; escClock = clock; },
    setCalm(k) { K.uCalm.value = clamp(k, 0, 1); },                    // 1: the column far below the lens is thinned (the look back down)
    setRing(k) { K.uRing.value.w = clamp(k, 0, 1); },                 // 1: birds slide clear of the lens-to-ring line (the ring is the subject)
    setBase(x, z, r = 360) { K.uBaseC.value.set(x, z, r, 1); },       // centre and dark radius of a cloud base at local y = height
    top: { u: U_TOP, altitude: A_TOP },                               // where the climb ends and the last straight begins
    funnel: { y0: funY0, y1: funY1, count: nFunnel, radiusAt: (y) => funR(clamp((funY1 - y) / (funY1 - funY0), 0, 1)) },
    get phase() { return phase; },
    anchors: {
      axisBase: new THREE.Vector3(0, 0, 0), axisTop: new THREE.Vector3(0, H, 0),
      entry: new THREE.Vector3(LANE, 15, -70), entryDir: new THREE.Vector3(0, 0, 1),
      flyThrough,
      portalSeat: { position: seat, normal: new THREE.Vector3(0, -Math.sin(12 * D2R), -Math.cos(12 * D2R)), radius: 7, pathEnd: endP.clone() },
      fileStart: new THREE.Vector3(fs[0], fs[1], fs[2]), fileDir: new THREE.Vector3(K.uSlant.value, -0.075, 1).normalize(), fileLength: FILE_LEN, fileHook: K.uHook.value, fileSlant: K.uSlant.value,
      ringLook: seat.clone(),
      viewpoints: [
        { name: 'whole', position: new THREE.Vector3(900, 420, 1300), target: new THREE.Vector3(0, H * 0.5, 0) },
        { name: 'inLane', position: new THREE.Vector3(LANE, 400, 0), target: new THREE.Vector3(LANE - 6, 403, 12) },
        { name: 'downTheFunnel', position: new THREE.Vector3(14, A_TOP - 14, -33), target: new THREE.Vector3(0, funY0, 16) },
      ],
    },
    update(dt, time, camera) {
      press.shared.uTime.value = time; K.uEsc.value.y = time + escClock;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(bufSize); K.uBufH.value = bufSize.y; K.uMinPx.value = minPx * bufSize.y / 450; K.uChordPx.value = (opts.chordPx ?? 5.5) * bufSize.y / 450; }
      group.updateWorldMatrix(true, false);
      lp.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(lp);
      K.uAlt.value = clamp(altSet != null ? altSet : lp.y, 0, H);
      // the stair turns with the camera: lock the lane's phase to the camera's azimuth while it circles, free-run otherwise
      if (phaseSet != null) phase = phaseSet;
      else if (dt > 0) {
        const rH = Math.hypot(lp.x, lp.z), phiCam = Math.atan2(lp.x, -lp.z), inReach = rH > 8 && rH < 110;
        let dphi = phiCam - prevPhi; dphi -= Math.round(dphi / TAU) * TAU;
        let err = phiCam - phase; err -= Math.round(err / TAU) * TAU;
        if (!havePhase || Math.abs(dphi) > 0.25) { if (inReach) phase += err; }            // a cut: seat the camera in its slot at once
        else if (inReach && dphi / dt > 0.15 * OMEGA) phase += dphi + Math.sign(err) * Math.min(Math.abs(err), 0.45 * dt);   // locked (slides in if it was free)
        else phase += OMEGA * dt;                                                           // camera parked or far away: the kettle turns by itself
        prevPhi = phiCam; havePhase = true;
      }
      K.uPhase.value = phase;
    },
    dispose() { if (ownPress) press.dispose(); if (!meshes.some((m) => m.geometry.attributes.position === g0.attributes.position)) g0.dispose(); },
  };
  group.userData.hero = hero;
  return hero;
}
