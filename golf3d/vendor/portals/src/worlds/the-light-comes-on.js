// THE LIGHT COMES ON
// We are a fruit fly inside a closed fridge built giant (300 m wide, 420 m tall, 240 m deep). For the first 10% of
// the flight the box is sealed and dark: the only light is a green standby diode, and the one bright shape is the
// frost rosette on the back plate, dead ahead. Then the seal cracks, the bulb comes on (one eased rise, latched),
// the glass city of jars blazes blue-white from behind, the door (src/parts/the-light-comes-on.js) swings away, its
// gasket peels like a zip, a bar of kitchen light widens across the terraces and all the cold falls out over the
// shelf edges. We loop round the back-left corner, fly the avenue between the jar towers, hairpin over the front
// edge past the ice trays, dive down the canyon with the fog-falls and leave through the foot of the slot.
// SPACE  the brief's: x -150 (latch) .. +150 (hinge), y up, z from the back plate (0) to the door plane (-240).
//        The hero sits at (0, 0, -240). No three.js lights: every material shades itself with the hero's lcShade().
// BEATS  (path u) 0-0.10 dark (a deep teal haze, the diode's green pool, every liquid a faint fill of its own hue, the jars
//        mirrored in the glass, the seal a hairline of kitchen light behind us that rims the glass amber); 0.093 thump (needles
//        shiver); 0.10 the bulb, the door begins to move; 0.19-0.25 on along the back plate, the
//        frost burst passing 20 m off, then a climbing right turn in the back-left corner up under the ceiling;
//        0.27-0.35 the held beat (slowed), THE PICTURE: from 390-400 m up in that corner, looking down the diagonal,
//        the door stands as a pale wall across the frame with its racks one above another (the lower ones seen through
//        a lane of bare, clear glass on the top terrace), the gasket's zip half way down its near edge and the kitchen's
//        bar floor to ceiling on the left; small backlit jars line the lane (none taller than a third of the frame) and
//        the bulb's light is let onto the door (uKey.x, 0.20-0.26 up, 0.35-0.44 back down); 0.36-0.43 down the lane to
//        the hero jar, the mint and one tall soda on the lip, amber and lime towers against the hinge-side wall; 0.43-0.48 the
//        avenue; 0.48-0.55 hairpin, wide round the ice trays: at 0.50-0.53 THE ICE (clear cubes low in the frame, mist over
//        the tray's rail, the door's top rack ablaze above them, a lit amber bottle on the lip at the right);
//        0.55-0.62 three cubes tip off the tray and tumble past; 0.55-0.93 the dive, down the middle of the canyon and
//        looking ALONG the shelves to the slot (slowed 0.66-0.86), THE STREET OF GLASS (STREET below): 0.66-0.74 the middle
//        shelf, ranks of cobalt, amber, magenta, olive and claret glass lit from behind with the jelly among them and a tall
//        ruby bottle nearest; 0.76-0.83 the bottom shelf headed by the big jar of preserved lemons; 0.80-0.88 the bowl of
//        cherries by the slot; the door's lower racks carry coloured glass on the right all the way down and the last bottles
//        before the portal are lit claret and magenta; a fly escorts us 0.80-0.90; 0.93-1 exit. Rare visit: a cat's head in the slot
//        above the portal, rising 0.55-0.63 and gone by 0.97, pupil narrowing 0.65-0.76, a blink at 0.785, breaths at
//        0.72 and 0.83. From the avenue on these are kept in script time s (see sOf and uOf below).
// LIGHT  the bulb's ribbed housing throws its light back into the box, so the door and the canyon stay in teal shadow
//        and the glass on them glows. Colour is carried through the whole flight: the bulb's light picks up lime, amber,
//        cyan and ruby on its way through the glass and lays them as rippling pools on frost, walls and shelves
//        (lcThrown in the hero), every jar throws a pool of its own colour on its shelf, the frost's glints come in
//        white, diode green and the kitchen's colour, the ice cubes hold the colours of the room, and the slot is a
//        source of light with a hot core, not a painted wall. The falls are sheets and puffs kept within a few metres of the shelf fronts,
//        the upper two stopping well short of the next shelf: the air of the canyon between them is left clear.
// EDGE   the last metres: the latch-side post is white enamel going blue (the hero's enamelMaterial), the loose length of
//        gasket on it is a strip of bellows rubber (buildStrap, M.strap), the fog at the foot of the slot rolls (GLSL_FOOT in
//        M.mist) and drips fall from the shelf edges through the kitchen's bar (a stream of its own, lco-bar-drips). The
//        tipped cubes fall as they always did; only their ice is new.
// LOOKS  midnight raid (amber bar, deep contrast), bright morning (daylight, leaf shadow, high key), party night
//        (rose, gold and violet glows drifting, a cake under a cloche, champagne in the door).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, PROFILES, bottleMesh, glassMaterial, enamelMaterial, rbox, paint, tube, rod, knob, GLSL_LIGHT, GLSL_BEADS, GLSL_FOOT } from '../parts/the-light-comes-on.js';

const TAU = Math.PI * 2;
const PAL = ['#04080B', '#0E2A33', '#7FD6E8', '#EAF6FF', '#5BE6B4', '#FFB45A', '#C8324A'];
const HZ = -240;                                   // the hero's origin in z
const SHELF = [320, 215, 110], EDGE_Z = -180;
const ROSE = [-89, 345], ROSE_R = 40;
const BULB = [95, 404, -150], DIODE = [14, 406.6, -73];
const U_THUMP = 0.093, U_ON = 0.1, U_CUBES = 0.55, U_FLY = [0.8, 0.9];   // script time (s); below 0.16 s is u
const SPEED = 21.5;
const DARK_HAZE = '#18313a', DARK_DENSITY = 0.0038;      // the air before the bulb
const bell = (x, a, b, f = 0.3) => smoothstep(a, a + (b - a) * f, x) * (1 - smoothstep(b - (b - a) * f, b, x));

// ---------------------------------------------------------------- the path (flown and checked for clearance)
const ENTRY = [-0.7606, 0, 0.6493];                // straight for the rosette, 215 m ahead
const along = (d) => [75 + ENTRY[0] * d, 352, -140 + ENTRY[2] * d];
const PATH = [
  along(0), along(40), along(80), along(120), along(150),
  [-58, 353, -29], [-78, 357, -22], [-98, 365, -22],                                                            // on toward the rosette, then left along the back plate, the frost burst passing 20 m off
  [-116, 376, -30], [-124, 387, -46], [-120, 396, -63], [-106, 401, -76], [-88, 400, -86],                       // a climbing right turn in the back left corner, up under the ceiling: the whole box lies ahead, the door a wall across it
  [-66, 390, -103], [-43, 366, -122], [-27, 349.5, -133.5], [-13, 344.5, -139.5],                                  // down the diagonal avenue toward the lip, sinking below the lids of the jars that line it
  [14, 344, -140], [64, 347, -134],                                                                           // the avenue
  [104, 347, -136], [128, 345.5, -157], [128, 342, -184], [114, 328, -197],                                     // hairpin over the edge: wide round the ice trays, which lie low on the left with the door's top rack above them
  [98, 303, -203.5], [82, 271, -203.5], [68, 244, -203.5], [50, 223, -205], [22, 200.5, -208], [-18, 166, -213.5], [-58, 128, -229],   // the dive: a plunge past two shelves down the middle of the canyon, the shelf fronts and their ranks of glass on the left, the door's racks standing off on the right
  [-95, 92, -248], [-122.5, 82, -254.5], [-150, 72, -261],                                                        // the exit line, 20 degrees down
];
// SCRIPT TIME. The beats of this world (the door's swing, the peel, the falls, the cubes, the cat) were written against an
// earlier, longer route (1005.4 m) and are kept in its measure, s. sOf(u) turns the path's u into s and uOf(s) turns it back:
// the dark leg plays as flown, the terrace is crossed faster than it used to be, and from the avenue on every place on
// the route has the s it always had.
const L_OLD = 1005.41, A1_OLD = 467.8, A2_OLD = 518.7, L_NEW = makePath(PATH).length;
const U2 = 1 - (L_OLD - A2_OLD) / L_NEW, U1 = U2 - (A2_OLD - A1_OLD) / L_NEW;
const KNOTS = [[0, 0], [0.16, 0.16], [U1, A1_OLD / L_OLD], [U2, A2_OLD / L_OLD], [1, 1]];
function remap(x, a, b) { let i = 0; while (i < KNOTS.length - 2 && x > KNOTS[i + 1][a]) i++; const k0 = KNOTS[i], k1 = KNOTS[i + 1]; return k0[b] + (k1[b] - k0[b]) * clamp((x - k0[a]) / Math.max(k1[a] - k0[a], 1e-6), 0, 1); }
const sOf = (u) => remap(clamp(u, 0, 1), 0, 1), uOf = (s) => remap(clamp(s, 0, 1), 1, 0);

// where the eye rests through the middle of the flight: [u, heading in degrees from the door's normal toward the hinge, pitch].
// One poi with a high weight aims the gaze by this table: round the turn past the frost corner, the reveal (0.25), the frame
// to remember (0.30-0.33: the slot aslant on the left, the lane of jars, the door), the hero jar (0.375), the avenue with the
// bulb at its end, the ice tray and the door racks at the hairpin, then down the canyon. From the avenue on it is in script time.
const GAZE = [[0.2, -95, -3], [0.214, -92, -1], [0.232, -26, -11], [0.25, 36, -20], [0.27, 22, -24], [0.3, 19, -25], [0.33, 18, -25], [0.35, 16, -25], [0.385, 24, -15], [0.4275, 24, -8], [0.447, 28, -6],
  ...[[0.479, 46, -5], [0.497, 4, -1], [0.518, -12, 1.5], [0.536, -36, 3], [0.55, -45, 3], [0.585, -52, -1], [0.61, -68, -8], [0.64, -80, -22], [0.67, -84, -20], [0.7, -92, -13], [0.735, -93, -12], [0.76, -92, -14], [0.79, -90, -17],
    [0.82, -90, -18], [0.85, -92, -17], [0.87, -92, -16], [0.9, -85, -12], [0.93, -77, -5], [0.97, -76.7, -6]].map((g) => [uOf(g[0]), g[1], g[2]])];
// the windows of the points of interest, in u
const POI_WIN = { rose: [0, 0.235], gazeA: [0.185, 0.5, 0.1], gazeB: [0.45, 0.97, 0.058], portal: [uOf(0.78), 0.96], crisper: [uOf(0.8), uOf(0.92)] };
function gazeAt(u, out) {
  const n = GAZE.length; let i = 0; while (i < n - 2 && u > GAZE[i + 1][0]) i++;
  const p1 = GAZE[i], p2 = GAZE[i + 1], p0 = GAZE[Math.max(i - 1, 0)], p3 = GAZE[Math.min(i + 2, n - 1)];
  const h = p2[0] - p1[0], t = clamp((u - p1[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
  const cr = (k) => {                                   // a smooth curve through the table: the head never stops and starts
    const m1 = (p2[k] - p0[k]) / Math.max(p2[0] - p0[0], 1e-6) * h, m2 = (p3[k] - p1[k]) / Math.max(p3[0] - p1[0], 1e-6) * h;
    return (2 * t3 - 3 * t2 + 1) * p1[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[k] + (t3 - t2) * m2;
  };
  const az = cr(1) * Math.PI / 180, pt = cr(2) * Math.PI / 180;
  return out.set(Math.sin(az) * Math.cos(pt), Math.sin(pt), -Math.cos(az) * Math.cos(pt));
}

// ---------------------------------------------------------------- shader pieces
const HEAD = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FBM + GLSL_LIGHT + GLSL_BEADS + fx.GLSL_FOG_PARS_FRAG;
// the usual first lines of a fragment shader: N (unit, facing the eye), V, dist, P (hero-local), bulb and diode terms
const FRAG_IN = /* glsl */`
  vec3 Vv = cameraPosition - vW; float dist = max(length(Vv), 1e-3); vec3 V = Vv/dist;
  vec3 P = vW - uOrigin;
  vec3 Lb = uBulbPos - vW; float db = max(length(Lb), 1.); Lb /= db; float att = lcBulbAtt(db);
  vec3 Ld = uDiodePos - vW; Ld = Ld/max(length(Ld), 1.);
  vec3 Hb = normalize(Lb + V + vec3(0., 1e-3, 0.)), Hd = normalize(Ld + V + vec3(0., 1e-3, 0.));
  float dio = uDiode*(1. - .6*uBulb);
  float mpp = max(length(fwidth(vW)), 1e-4);
`;
// glints: every cell holds a tiny mirror with its own tilt; it flashes when it lines up between the eye and a light
const GLSL_GLINT = /* glsl */`
float lcGlintK(vec2 uv, vec3 N, vec3 H, float aa, float lo){
  uv = mat2(.819, .574, -.574, .819)*uv + 3.7;
  vec2 id = floor(uv), f = fract(uv) - .5;
  vec3 r = hash33(vec3(id, 7.3)) - .5;
  vec3 n = normalize(r*2. + N*.7);
  float s = smoothstep(lo, .995, dot(n, H));
  float rad = .08 + .16*fract(r.z*7.3 + r.x*3.1 + .5);
  float d = length(f - r.xy*.44);
  return s*s*(1. - smoothstep(rad*.35, min(rad + aa, .27), d))*(1. - smoothstep(.22, .6, aa));
}
float lcGlint(vec2 uv, vec3 N, vec3 H, float aa){ return lcGlintK(uv, N, H, aa, .9); }
`;
const VERT_STD = /* glsl */`
  attribute vec2 aSw; uniform float uTime;
  varying vec3 vW, vN, vCol, vO;
  ${fx.GLSL_FOG_PARS_VERT}
  void main(){
    vec3 p = position; vO = position;
    #ifdef USE_COLOR
      vCol = color;
    #else
      vCol = vec3(1.);
    #endif
    #ifdef USE_SWAY
      p += vec3(sin(uTime*1.7 + aSw.y), .35*sin(uTime*2.3 + aSw.y*1.3), cos(uTime*1.3 + aSw.y*.7))*aSw.x;
    #endif
    #ifdef USE_INSTANCING
      vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.); vN = mat3(modelMatrix)*(mat3(instanceMatrix)*normal);
    #else
      vec4 w = modelMatrix*vec4(p, 1.); vN = mat3(modelMatrix)*normal;
    #endif
    vW = w.xyz;
    vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
    ${fx.GLSL_FOG_VERT}
  }`;
const PREMULT = { transparent: true, premultipliedAlpha: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
const ADDITIVE = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

function makeMaterials(U, look) {
  const fogU = () => fx.fogUniforms();
  const mk = (o) => new THREE.ShaderMaterial({ fog: true, ...o, uniforms: { ...fogU(), ...U, ...(o.uniforms || {}) } });
  const M = {};

  // ---- the back plate: enamel under a crust of frost, densest in the rosette round the vent
  M.plate = mk({
    uniforms: { uFrost: { value: look.frost }, uRose: { value: new THREE.Vector3(ROSE[0], ROSE[1], ROSE_R) }, uGain: { value: look.plateGain } },
    vertexShader: VERT_STD,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; uniform float uFrost, uGain; uniform vec3 uRose;
      ${HEAD}${GLSL_GLINT}
      void main(){
        ${FRAG_IN}
        #ifdef LC_WALL
          vec2 q = vec2(vW.z, vW.y), bq = vec2(uBulbPos.z, uBulbPos.y);
        #else
          vec2 q = vW.xy, bq = uBulbPos.xy;
        #endif
        vec2 rq = q - uRose.xy; float r = length(rq);
        float ang = atan(rq.y, rq.x + (abs(rq.x) + abs(rq.y) < 1e-3 ? 1e-3 : 0.));
        float n1 = fbm(q*.03 + 7.1), n2 = fbm(q*.11 + 1.7);
        #ifdef LC_WALL
          // the crust runs on round the corner from the rosette and thins toward the door
          float rose = 0.;
          float crust = (1. - smoothstep(26., 150., -vW.z + (n2 - .5)*46.))*smoothstep(236., 322., vW.y + (n1 - .5)*70.);
        #else
          float rose = 1. - smoothstep(uRose.z*.5, uRose.z*1.55, r + (n2 - .5)*26.);
          float crust = (1. - smoothstep(40., 150., vW.x + 150. + (n2 - .5)*46.))*smoothstep(236., 322., vW.y + (n1 - .5)*70.)*.8;
        #endif
        float cover = clamp(max(max(rose, crust), smoothstep(.64 - .34*uFrost, .92 - .2*uFrost, n1 + q.y/420.*.2)), 0., 1.);
        float arms = abs(sin(ang*9. + (n2 - .5)*5. + r*.05));
        float fern = (1. - smoothstep(0., .55, arms))*rose;
        float fine = 1. - smoothstep(.3, 1.2, mpp);
        // the crust: feathers of ice laid along two grains that cross, on a warped domain, so no lattice shows
        vec2 wq = q + 7.*vec2(fbm(q*.06 + 3.1), fbm(q*.06 + 9.7));
        vec2 w1 = mat2(.766, .643, -.643, .766)*wq, w2 = mat2(.5, -.866, .866, .5)*wq;
        float f1 = fbm(vec2(w1.x*.17, w1.y*1.25)), f2 = fbm(vec2(w2.x*.17, w2.y*1.25) + 5.3);
        float grainMix = smoothstep(.38, .62, fbm(q*.021 + 8.));
        float feather = mix(f1, f2, grainMix);
        float crystal = mix(.6, smoothstep(.2, .8, feather)*.75 + fbm(mat2(.6, .8, -.8, .6)*wq*2.3)*.25, fine);
        vec3 enamel = vec3(.5, .58, .63)*(.9 + .1*n2);
        enamel *= 1. - .14*smoothstep(.42, .5, abs(fract(q.x/30. + .5) - .5));
        vec3 ice = vec3(.8, .88, .93)*(.7 + .3*crystal);
        ice = mix(ice, vec3(.93, .97, 1.), fern*.6);
        vec3 alb = mix(enamel, ice, cover);
        #ifndef LC_WALL
          // lit, the wheel is an eye with spokes: between the fern's arms the plate lies in the needles' blue shade
          alb *= mix(vec3(1.), vec3(.34, .52, .74), uBulb*rose*(1. - fern)*.66);
        #endif
        // in the dark the crust keeps its face nearly flat: the diode finds points on it, never a marbled sheen
        vec2 gq = vec2(f1 - .5, f2 - .5)*(.45*(.12 + .88*uBulb));
        #ifdef LC_WALL
          vec3 N0 = vec3(1., 0., 0.);
          vec3 N = normalize(vec3(1., gq.y*1.7*cover*fine, gq.x*1.7*cover*fine));
        #else
          vec3 N0 = vec3(0., 0., -1.);
          vec3 N = normalize(vec3(gq*1.7*cover*fine, -1.));
        #endif
        // the needles' long blue shadows, raking away from the bulb
        vec2 bd = q - bq; bd = bd/max(length(bd), 1.);
        vec2 sq = vec2(dot(q, vec2(-bd.y, bd.x)), dot(q, bd));
        float streak = vnoise(vec2(sq.x*.55, sq.y*.035 + 4.))*vnoise(vec2(sq.x*.21 + 9., sq.y*.02));
        float shadow = smoothstep(.16, .4, streak)*cover*(.4 + .6*uFrost)*(1. - uBulb);   // (a painted stand-in, kept for the dark: lit, every needle throws its own shadow, see M.needle)
        #ifdef LC_WALL
          float lift = 1. + uGain*cover*.1;
        #else
          float lift = 1. + uGain*cover*(1. - .5*rose*(1. - fern));
        #endif
        #ifdef LC_WALL
          // beside the slot the kitchen light lies on the wall: the gold is brightest at the slot and gone a shelf's depth in
          float inBar = lcBar(P)*exp(-max(P.z, 0.)/30.), inBarFar = lcBar(P)*exp(-max(P.z, 0.)/110.);
          shadow *= 1. - inBar;
        #endif
        // before the bulb the plate has no sheen to speak of: specular amount rises with the light
        vec3 col = lcShade(vW, N, V, alb*(1. - .6*shadow), 28., mix(.05, .35 + cover*.5, uBulb))*lift;
        col += mix(uShadowCol, vec3(.2, .05, .3), .55*smoothstep(.35, .65, n2))*alb*(uBulb*shadow*1.3);
        #ifdef LC_WALL
          // below the top terrace this wall stands in the shade of the shelves and what is on them: it falls away to teal
          float shelfShade = uBulb*(1. - smoothstep(196., 336., P.y + (n1 - .5)*30.));
          col = mix(col, alb*uShadowCol*(.12 + uKey.y*.2), .9*shelfShade);
        #endif
        // IN THE BULB'S LIGHT the crust has relief. Its slope is taken over .3 m toward the bulb's foot on this surface (a third
        // of a feather's .8 m, so that a feather's flank is in shade and not half the crust): flanks that face the bulb are the
        // brightest of the plate, lee flanks lie at .24 of them (two stops) and go blue; the edge of every patch of crust has its
        // lit side and its shade side. Then the body is held under the bloom pass (lcCap): the glints added below are what goes over it.
        #ifndef LC_WALL
          col *= 1. - .3*uBulb;                                 // lit, the plate is seen from close: held under the tone map's shoulder
        #endif
        {
          vec2 wqU = wq - bd*.3;
          vec2 w1u = mat2(.766, .643, -.643, .766)*wqU, w2u = mat2(.5, -.866, .866, .5)*wqU;
          float featherU = mix(fbm(vec2(w1u.x*.17, w1u.y*1.25)), fbm(vec2(w2u.x*.17, w2u.y*1.25) + 5.3), grainMix);
          vec2 dqx = dFdx(q), dqy = dFdy(q); float det = dqx.x*dqy.y - dqx.y*dqy.x; det = abs(det) < 1e-7 ? 1e-7 : det;
          float cvx = dFdx(cover), cvy = dFdy(cover);
          float slopeC = dot(vec2(cvx*dqy.y - cvy*dqx.y, cvy*dqx.x - cvx*dqy.x)/det, bd)*(1. - smoothstep(.15, .6, mpp));
          float rel = (smoothstep(.2, .8, feather) - smoothstep(.2, .8, featherU))*cover + clamp(slopeC, -.4, .4)*1.2;
          float leeK = 1. - smoothstep(-.3, -.06, rel), crestK = smoothstep(.05, .28, rel), relK = uBulb*cover*fine;
          col *= mix(1., 1. + .14*crestK - .76*leeK, relK);
          col = mix(col, alb*lcShadeTip(), relK*leeK*.5);
          #ifdef LC_WALL
            // the moulded runners throw theirs: one every 26 m from y 28, standing 4.6 m off the wall (the stout rails under the
            // shelves 7.6 m). Under each lies its shadow, as tall as the runner stands off times (404 - y)/50: the bulb's foot on
            // this wall is at y 404, and the light is taken to stand 50 m off it (as for the needles)
            float yr = 28. + 26.*ceil((vW.y - 28.)/26.), hlf = 1.7, off = 4.6, zEnd = -221.;
            if (abs(yr - 314.) < 1. || abs(yr - 210.) < 1. || abs(yr - 106.) < 1.) { yr = yr > 300. ? ${(SHELF[0] - 7.5).toFixed(1)} : (yr > 200. ? ${(SHELF[1] - 7.5).toFixed(1)} : ${(SHELF[2] - 7.5).toFixed(1)}); hlf = 3.2; off = 7.6; zEnd = -183.; }
            float sLen = off*max(uBulbPos.y - vW.y, 0.)/50., st = (yr - hlf - vW.y)/max(sLen, .05);
            float rs = smoothstep(-.03, .04, st)*(1. - smoothstep(.55, 1., st))*step(yr, 400.)*smoothstep(zEnd - 3., zEnd + 3., vW.z)*step(.1, sLen);
            rs *= .9*uBulb*lcHood(vW)*(1. - shelfShade)*(1. - inBar);
            col = mix(col, min(col, alb*mix(lcShadeRoot(), lcShadeTip(), smoothstep(0., .8, st))), rs);
          #endif
          // colour soaked into the ice itself: green from above where the diode hangs, the kitchen's colour low on the slot side
          // (part of the body, so under the same ceiling)
          float gw = exp(-length(vW - uDiodePos)/190.), kw = uBar.w*uWarm*exp(-max(vW.x + 150., 0.)/120.)*smoothstep(-40., -190., vW.z)*.8;
          vec3 soak = alb*cover*uBulb*(uGreenCol*uGreenCol*(gw*.9*clamp(dot(N, Ld)*.7 + .5, 0., 1.)) + uWarmCol*kw*.3);
          #ifndef LC_WALL
            soak *= 1. - .3*uBulb;
          #endif
          col += soak;
          col = mix(col, lcCap(col, .9), uBulb);
        }
        #ifndef LC_WALL
          float keep = 1. - .3*uBulb;                           // (the glints are scaled as they always were)
        #else
          float keep = 1.;
        #endif
        vec3 body = col; col = vec3(0.);
        float aa = mpp/1.6, near = 1. - smoothstep(.35, .9, aa);
        float gB = lcGlint(q/1.6, N, Hb, aa)*near + lcGlint(q/4.3 + 31., N, Hb, aa*.37) + lcGlint(q/9.1 + 57., N, Hb, aa*.176)*.7;
        // the diode's glints: sparse points that travel as the eye moves, densest in the rosette
        float gD = lcGlintK(q/1.6 + 11., N0, Hd, aa, .955)*near + lcGlintK(q/3.1 + 5., N0, Hd, aa*.52, .962)*.8;
        float tw = .7 + .3*sin(uTime*3. + (f1 + f2)*37.);
        // the crust shimmers in waves, and not in white alone: a share of its points throw back the diode's green, the
        // kitchen's colour and whatever colour the bulb's light picked up on its way through the glass
        vec3 thr = lcThrown(vW);
        float hue = fract((f1*3.1 + f2*2.3)*7. + floor(q.x/4.3)*.37 + floor(q.y/4.3)*.61);
        vec3 gcol = hue < .4 ? uBulbCol : (hue < .72 ? mix(uGreenCol, vec3(.7, 1., .9), .25)*1.25 : mix(uWarmCol, uBulbCol, .2)*1.2);
        col += gcol*thr*(uBulb*att*gB*8.*cover*(.55 + .45*sin(uTime*2.7 + (f1 + f2)*61.)));
        col += mix(uDiodeCol, vec3(.8, 1., .95), .35)*(dio*gD*7.*tw*(cover*.7 + rose*.5 + .1));
        col += uDiodeCol*(dio*(.006 + .2*fern)*cover*pow(max(dot(N0, Hd), 0.), 6.));
        col += vec3(.62, 1., .9)*((1. - uBulb)*uDiode*(rose*(.06 + .3*fern + .14*crystal*crystal) + cover*(1. - rose)*.014*(.4 + .6*crystal)));
        col = body + col*keep;
        #ifdef LC_WALL
          col = col*(1. - .3*inBar) + alb*uWarmCol*(uWarm*inBar*(.16 + .2*cover));   // the light runs along this wall, not onto it
          vec3 Hk = normalize(LC_KITCHEN + V + vec3(0., 1e-3, 0.));
          col += uWarmCol*(uWarm*inBarFar*5.*cover*(lcGlint(q/1.6 + 19., N, Hk, aa)*near + lcGlint(q/4.3 + 41., N, Hk, aa*.37) + .6*lcGlint(q/9.1 + 23., N, Hk, aa*.176)));
          col += alb*uWarmCol*(uWarm*inBarFar*.12*cover*(.4 + .6*crystal));
          col *= 1. - .3*smoothstep(.5, 1., cos((vW.y - 20.)*6.2832/26.))*(1. - cover*.6)*(1. - inBar)*(1. - uBulb);   // (a painted band under each runner, for the dark: lit, the runners throw their own shadows, above)
        #endif
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });

  M.wall = mk({ defines: { LC_WALL: 1 }, uniforms: M.plate.uniforms, vertexShader: VERT_STD, fragmentShader: M.plate.fragmentShader });

  // ---- frost needles: clusters of three spikes, placed and turned in the vertex shader
  // Lit, every spike also throws its shadow: three more triangles in the cluster (needleGeometry), which this vertex shader
  // lays on the surface the cluster stands on (back plate z 0, latch-side wall x -150, ceiling y 420), from the spike's root to
  // where the bulb's light carries its tip. The light is taken to stand 50 m off the plate and the wall above the bulb's foot
  // there (the point of the surface nearest the bulb), and its true 16 m under the ceiling: a spike h tall, T metres along the
  // surface from the foot, throws h*T/50, at most 6 h. The tip is the tip as it shivers, so the shadow leans with it. The shadows
  // are laid over the plate (premultiplied: the needles themselves cover fully, and the mesh is drawn after the opaque things
  // and before every other transparent one, as it always was), .06 to .2 m off it in 24 steps so two that cross never fight.
  M.needle = mk({
    ...PREMULT, depthWrite: true,
    uniforms: { uShiver: { value: 0 }, uGain: { value: look.needleGain } },
    vertexShader: /* glsl */`
      attribute vec3 aBase, aAxis; attribute vec2 aWr; attribute float aFace;
      uniform float uShiver, uTime; uniform vec3 uBulbPos;
      varying vec3 vW, vSh; flat varying vec2 vId; varying float vH;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        float L = max(length(aAxis), 1e-3); vec3 ax = aAxis/L;
        vec3 t1 = cross(ax, vec3(.37, .81, .45)); t1 = t1/max(length(t1), 1e-3); vec3 t2 = cross(ax, t1);
        float isSh = step(11.5, aFace);
        vec3 pu = isSh > .5 ? (aFace < 12.5 ? ${SPIKE_TIP[0]} : (aFace < 13.5 ? ${SPIKE_TIP[1]} : ${SPIKE_TIP[2]})) : position;
        vec3 p = (t1*pu.x + ax*pu.y + t2*pu.z)*L;
        p += t1*(sin(uTime*41. + aWr.y*60.)*uShiver*pu.y*L*.05);
        vId = vec2(aWr.y, aFace); vH = isSh > .5 ? 0. : position.y; vSh = vec3(0.);
        vec3 q = aBase + p;
        if (isSh > .5) {
          // the surface: its normal into the box, how far root and tip stand off it, the bulb's foot on it, the light's stand-off
          vec3 nrm = vec3(0.), foot = uBulbPos; float hr = 0., ht = 0., S = 50.;
          if (aBase.y > 419.5) { nrm = vec3(0., -1., 0.); hr = 420. - aBase.y; ht = 420. - q.y; foot.y = 420.; S = max(420. - uBulbPos.y, 4.); }
          else if (aBase.x < -144. && aBase.z < -1.) { nrm = vec3(1., 0., 0.); hr = aBase.x + 150.; ht = q.x + 150.; foot.x = -150.; }
          else if (aBase.z > -4.) { nrm = vec3(0., 0., -1.); hr = -aBase.z; ht = -q.z; foot.z = 0.; }
          vec3 Lp = foot + nrm*S;
          hr = clamp(hr, 0., S*.8); ht = clamp(ht, 0., S*.8);
          vec3 rS = aBase + (aBase - Lp)*(hr/(S - hr)), tS = q + (q - Lp)*(ht/(S - ht));
          vec3 dir = tS - rS; dir -= nrm*dot(dir, nrm);
          float len = length(dir), maxL = 6.*max(ht - hr, 0.);
          vec3 dn = dir/max(len, 1e-3);
          len = min(len, maxL)*step(.5, dot(nrm, nrm));
          vec3 side = cross(nrm, dn);
          float wd = L*(aFace < 12.5 ? ${SPIKES[0][3].toFixed(3)} : (aFace < 13.5 ? ${SPIKES[1][3].toFixed(3)} : ${SPIKES[2][3].toFixed(3)}))*1.8*step(1e-3, len);   // (1.8: the spike's own width and, beyond it, the soft edge the bulb's 10 m of glass gives a shadow)
          q = rS + dn*(len*position.y) + side*(wd*position.x) + nrm*(.06 + .006*floor(fract(aWr.y*57.3)*24.));
          vSh = vec3(1., position.y, position.x);
        }
        vec4 w = modelMatrix*vec4(q, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vSh; flat varying vec2 vId; varying float vH; uniform float uGain;
      ${HEAD}
      void main(){
        ${FRAG_IN}
        vec3 N = cross(dFdx(vW), dFdy(vW)); N = N/max(length(N), 1e-9);
        if (dot(N, V) < 0.) N = -N;
        if (vSh.x > .5) {
          // a spike's shadow on the plate: the look's shade, deep teal at its root going blue toward its tip, where it thins away;
          // soft at its sides. As much of it as there is bulb light on the surface to take away (none before the bulb, none
          // in the shade of the shelves, none where the kitchen's bar lies on the wall)
          float along = vSh.y, across = abs(vSh.z)/max(1. - along, 1e-3);
          float sa = .82*(1. - smoothstep(.4, 1., along))*(1. - smoothstep(.3, 1., across))*uBulb*lcHood(vW);
          float onWall = 1. - step(-149.5, vW.x);
          sa *= 1. - onWall*(1. - smoothstep(196., 336., vW.y)*(1. - lcBar(P)*exp(-max(P.z, 0.)/30.)));
          vec3 sc = mix(lcShadeRoot(), lcShadeTip(), smoothstep(0., .8, along));
          gl_FragColor = vec4(fxFogPremult(sc*sa, sa), sa);
          return;
        }
        vec3 alb = vec3(.78, .87, .93)*(.85 + .3*fract(vId.x*7.3));
        float deep = smoothstep(0., .4, vH);
        // seen from close the thicket is not one white: each spike has a lit face and a blue one, a pale tip and a root in shade
        float nearK = uBulb*(1. - smoothstep(60., 170., dist)), lam = clamp(dot(N, Lb)*.75 + .4, 0., 1.);
        vec3 col = lcShade(vW, N, V, alb, 50., 1.2)*(uGain*mix(.5, 1., deep)*(1. - .25*nearK)) + uShadowCol*alb*(uBulb*(1. - deep)*uKey.y);
        float back = clamp(dot(-V, Lb)*.5 + .5, 0., 1.), fres = pow(max(1. - abs(dot(N, V)), 0.), 2.);
        float hood = lcHood(vW);
        vec3 thr = lcThrown(vW);
        col += uBulbCol*thr*(uBulb*att*(back*back*.5 + fres*.4)*deep*(1. - .4*nearK));
        col += alb*uBulbCol*thr*(uBulb*att*hood*mix(.5 + .85*deep, (.1 + .95*deep*deep)*mix(.3, 1.05, lam), nearK));        // ice scatters the bulb's light: from afar no needle is darker than its wall
        col = mix(col, col*vec3(.62, .8, 1.05), nearK*(1. - lam)*.7);
        // every needle is a prism: one in three flashes green, one in four the kitchen's colour
        float hue = fract(vId.x*17.3 + vId.y*.31);
        vec3 gcol = hue < .42 ? uBulbCol : (hue < .76 ? mix(uGreenCol, vec3(.7, 1., .9), .2)*1.3 : mix(uWarmCol, uBulbCol, .15)*1.25);
        vec3 soak = alb*uBulb*deep*(uGreenCol*uGreenCol*(exp(-length(vW - uDiodePos)/190.)*1.5*clamp(dot(N, Ld)*.8 + .35, 0., 1.)) + uWarmCol*(uBar.w*uWarm*exp(-max(vW.x + 150., 0.)/120.)*smoothstep(-40., -190., vW.z)*.3));
        col += soak;
        // IN THE BULB'S LIGHT a spike has a lit flank and a shade flank. What the bulb strikes squarely is hard blue-white and the
        // brightest thing on the wall, each face a little different and the ice's grain showing along it, the tip palest; what is
        // turned away is blue, two stops under; inside the rosette the roots stand in the thicket's own shade, deep teal. The
        // body is held under the bloom pass (lcCap): only the glints below go over it. All of it comes in with the bulb.
        {
          float inRose0 = 1. - smoothstep(48., 74., length(vW.xy - vec2(${ROSE[0].toFixed(1)}, ${ROSE[1].toFixed(1)})) + vW.z*-.5);
          float litF = smoothstep(-.15, .45, dot(N, Lb));
          float occl = (1. - smoothstep(0., .55, vH))*mix(.3, 1., inRose0);
          float facet = .86 + .28*fract(vId.y*.37 + vId.x*5.3), grain = .93 + .07*sin(vH*38. + vId.x*61.);
          vec3 iceL = alb*uBulbCol*thr*(min(att*hood*2.6, 1.5)*facet*grain*(.84 + .22*smoothstep(.55, 1., vH))*(.6 + .4*clamp(dot(N, Lb), 0., 1.)));   // (a face square to the bulb is the brightest; one that the light only grazes has .6 of it)
          vec3 shadeN = mix(lcShadeTip(), lcShadeRoot(), occl)*(.75 + .5*facet*grain);
          vec3 lit = mix(shadeN, iceL, litF*(1. - occl)) + uBulbCol*thr*(att*hood*fres*.14) + soak*.5;
          col = mix(col, lcCap(lit, .9), uBulb);
        }
        vec3 rn = normalize(N + (hash33(vec3(vId.x*91.7, vId.y, 3.)) - .5)*1.2);
        float wob = .05*sin(uTime*2.5 + vId.x*40. + vId.y);
        float gB = smoothstep(.93, .998, dot(rn, Hb) + wob), gD = smoothstep(.9, .998, dot(rn, Hd) + wob);
        float tw = .75 + .25*sin(uTime*2.3 + vId.x*50.);
        // a face that flashes far off is a spark, and flashes at 6 as it always did; within 40 m of the eye it is a pane of light
        // several pixels wide, and is held at 1.4, just over the bloom's threshold (from 140 m a face is under a pixel)
        col += gcol*thr*(uBulb*att*gB*gB*mix(1.4, 6., smoothstep(40., 140., dist)));
        float inRose = 1. - smoothstep(48., 74., length(vW.xy - vec2(${ROSE[0].toFixed(1)}, ${ROSE[1].toFixed(1)})) + vW.z*-.5);
        col += mix(uDiodeCol, vec3(.8, 1., .95), fract(vId.x*3.1)*.75)*(dio*(gD*gD*7.*tw + (.13 + .5*pow(max(dot(N, Hd), 0.), 3.) + .2*(1. - uBulb))*mix(.12, 1., inRose)));
        vec3 Lk = vec3(-146., vW.y, uOrigin.z) - vW; Lk = Lk/max(length(Lk), 1.);
        float gK = smoothstep(.9, .998, dot(rn, normalize(Lk + V + vec3(0., 1e-3, 0.))) + wob);
        col += uWarmCol*(uDark.x*gK*gK*5.*step(.7, fract(vId.x*23.7)));
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });

  // ---- leaves, fruit, cake, flies: matte colour with light coming through and a bloom of frost on the skin
  M.veg = mk({
    vertexColors: true, side: THREE.DoubleSide, defines: { USE_SWAY: 1 },
    uniforms: { uTrans: { value: 0.6 }, uBloom: { value: 0.3 } },
    vertexShader: VERT_STD,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vCol; uniform float uTrans, uBloom;
      ${HEAD}
      void main(){
        ${FRAG_IN}
        vec3 N = vN/max(length(vN), 1e-4); if (dot(N, V) < 0.) N = -N;
        vec3 col = lcShade(vW, N, V, vCol, 14., .14);
        float fres = pow(max(1. - abs(dot(N, V)), 0.), 2.5), back = clamp(dot(-V, Lb)*.5 + .5, 0., 1.);
        col += vCol*uBulbCol*(uBulb*att*back*back*uTrans);
        col += vec3(.7, .82, .9)*(uBulb*att*fres*uBloom) + uDiodeCol*(dio*fres*.05);
        col += vCol*uWarmCol*(uWarm*lcBar(P)*fres*.6);
        gl_FragColor = vec4(fxApplyFog(col), 1.);
      }`,
  });
  M.fly = mk({ vertexColors: true, uniforms: { uTrans: { value: 0.25 }, uBloom: { value: 0.9 } }, vertexShader: VERT_STD, fragmentShader: M.veg.fragmentShader });

  // ---- the crispers' misted fronts: mist streaming down inside the glass, clear tracks where drops have run
  M.pane = mk({
    ...PREMULT,
    vertexShader: VERT_STD,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN;
      ${HEAD}
      void main(){
        ${FRAG_IN}
        vec3 N = vN/max(length(vN), 1e-4);
        vec2 q = P.xy;
        float mist = fbm(vec2(q.x*.05, q.y*.028 + uTime*.045));
        float track = smoothstep(.7, .9, vnoise(vec2(q.x*.46, q.y*.011 + uTime*.018)))*smoothstep(.3, .6, vnoise(vec2(q.x*.07, 5.) + .3));
        float a = clamp(.36 + .34*mist - .34*track, .08, .85);
        a *= .55 + .45*smoothstep(0., 30., 104. - q.y) ;
        vec3 haze = uBulbCol*(uBulb*att*.5) + mix(uDarkCol*.4, uShadowCol*(1.05*uKey.y), uBulb);
        haze = mix(haze, uWarmCol*(uWarm*.75) + haze*.15, lcBar(P)*.85);
        vec3 bd = lcBeads(q/2.2, .42, uTime*.4, mpp/2.2)*(1. - smoothstep(90., 220., dist));
        float fres = pow(max(1. - abs(dot(N, V)), 0.), 3.);
        vec3 col = haze*(.55 + .6*mist)*a;
        col += (uBulbCol*(uBulb*att*1.6) + uWarmCol*(uWarm*lcBar(P)) + uDiodeCol*(dio*.8))*bd.y;
        col += uBulbCol*(uBulb*att*fres*.3) + uDiodeCol*(dio*fres*.06);
        a = clamp(a + bd.x*.2 + fres*.3, 0., 1.);
        gl_FragColor = vec4(fxFogPremult(col, a), a);
      }`,
  });

  // ---- the jelly: the one jewel. Two wobble modes (a sway and a squash), lit from inside by whatever is behind it
  M.jelly = mk({
    uniforms: { uJelly: { value: new THREE.Color(look.jelly) }, uWob: { value: new THREE.Vector4(0.2, 0.15, 0, 0) }, uSize: { value: new THREE.Vector2(15, 14) } },
    vertexShader: /* glsl */`
      uniform vec4 uWob; uniform vec2 uSize; uniform float uTime;
      varying vec3 vW, vN; varying float vH;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        vec3 p = position; float h = clamp(p.y/uSize.y, 0., 1.); vH = h;
        float s1 = sin(uTime*5.3)*uWob.x + uWob.z, s2 = sin(uTime*7.9 + 1.)*uWob.y + uWob.w;
        p.xz += vec2(.8, .6)*(s1*h*h*2.2);
        p.xz *= 1. + s2*.06*h; p.y *= 1. - s2*.05;
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vH; uniform vec3 uJelly;
      ${HEAD}
      void main(){
        ${FRAG_IN}
        vec3 N = vN/max(length(vN), 1e-4);
        float ndv = abs(dot(N, V)), fres = pow(max(1. - ndv, 0.), 3.), back = clamp(dot(-V, Lb)*.5 + .5, 0., 1.);
        vec3 j = max(uJelly, vec3(1e-3));
        vec3 body = mix(j, j*j*j*.7, ndv*.8);
        float bar = lcBar(P);
        vec3 E = uBulbCol*(uBulb*att*(.6 + 1.5*back*back + .5*vH)) + mix(uDarkCol*.4, uShadowCol*uKey.y, uBulb) + uWarmCol*(uWarm*bar*.9);
        vec3 col = body*E*1.3;
        col += j*uBulbCol*(uBulb*att*fres*.9) + uBulbCol*(uBulb*att*(fres*fres*.5 + pow(max(dot(N, Hb), 0.), 90.)*3.5));
        col += uDiodeCol*(dio*(pow(max(dot(N, Hd), 0.), 80.)*2.5 + fres*.08));
        col += uWarmCol*(uWarm*bar*fres*.6);
        gl_FragColor = vec4(fxApplyFog(col), 1.);
      }`,
  });

  // ---- ice cubes: clear, wet blocks. The eye's ray is bent into the cube and followed to where it leaves, and the room is
  // looked up in that direction (lcIceRoom: the door's backlit bottles as upright bands of orange, lime and cyan, the kitchen's
  // bar, the bulb as one hard point, the lit back of the box, teal shade), so what stands behind a cube shows through it bent and
  // blue. On its way the ray gathers the milky heart, a soft white cloud. The edges turned to the bulb carry a white rim, the
  // others a thin cold line; one face wears a few frost needles.
  M.ice = mk({
    vertexShader: /* glsl */`
      attribute float aSeed;
      varying vec3 vW, vN, vO, vVo, vR0, vR1, vR2; varying float vSeed;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        vO = position; vSeed = aSeed;
        mat3 m3 = mat3(modelMatrix)*mat3(instanceMatrix);
        float sc = max(length(m3[0]), 1e-4);
        vR0 = m3[0]/sc; vR1 = m3[1]/sc; vR2 = m3[2]/sc;                 // the cube's own axes in the world
        vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.);
        vW = w.xyz; vN = m3*normal;
        vec3 e = cameraPosition - w.xyz;
        vVo = vec3(dot(e, vR0), dot(e, vR1), dot(e, vR2));              // toward the eye, in the cube's own space
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vO, vVo, vR0, vR1, vR2; varying float vSeed;
      ${HEAD}
      // where a ray from p (in or on the unit cube) along d leaves it: the distance, and n = that face's inward normal
      float lcBoxOut(vec3 p, vec3 d, out vec3 n){
        vec3 ds = vec3(abs(d.x) < 1e-4 ? 1e-4 : d.x, abs(d.y) < 1e-4 ? 1e-4 : d.y, abs(d.z) < 1e-4 ? 1e-4 : d.z);
        vec3 sg = sign(ds), t3 = (sg*.5 - p)/ds;
        float t = min(t3.x, min(t3.y, t3.z));
        n = t3.x <= t ? vec3(-sg.x, 0., 0.) : (t3.y <= t ? vec3(0., -sg.y, 0.) : vec3(0., 0., -sg.z));
        return max(t, 0.);
      }
      // the room as a block of ice sees it, by direction
      vec3 lcIceRoom(vec3 d, vec3 Pw, float att){
        float hl = max(length(d.xz), 1e-3), el = d.y/hl;
        vec3 c = mix(uDarkCol*.4, uShadowCol*uKey.y, uBulb)*(.22 + .75*smoothstep(-.7, .6, d.y));
        // the lit back of the box, and its ceiling
        c += uBulbCol*(uBulb*att*(.2*smoothstep(.1, .8, d.z)*(.5 + .5*vnoise(d.xy*5. + 2.)) + .1*smoothstep(.5, .95, d.y)));
        // the door's racks: backlit bottles, upright bands of orange, lime, cyan and milk; a second rank below
        float az = atan(d.x, -d.z + (abs(d.x) + abs(d.z) < 1e-3 ? 1e-3 : 0.));
        float face = smoothstep(.05, .5, -d.z/hl);
        float bc = az*6.5 + .35*sin(el*2.6 + az*3.), bh = hash11(floor(bc)*1.7 + 3.1), bf = abs(fract(bc) - .5);
        float rack = smoothstep(-.42, -.22, el)*(1. - smoothstep(.3, .8, el)) + .55*smoothstep(-1.7, -1.3, el)*(1. - smoothstep(-.85, -.6, el));
        vec3 liqc = bh < .36 ? vec3(1., .5, .07) : (bh < .66 ? vec3(.5, .95, .16) : (bh < .84 ? vec3(.1, .7, 1.) : vec3(.8, .9, .9)));
        // (looked at steeply from above, the lower rank is a soft pale glow, not upright bands: bands drawn by compass bearing would
        // close into a wheel round the straight-down direction)
        float steep = smoothstep(.55, 1.05, -el);
        c += mix(liqc, vec3(.72, .8, .52), steep)*uBulbCol*(uBulb*att*1.25*face*rack*mix(1. - smoothstep(.2, .44, bf), .5, steep));
        // the kitchen's bar, standing in the slot
        vec3 P = Pw - uOrigin;
        vec2 ts = vec2(-146. - P.x, -40. - P.z); ts = ts/max(length(ts), 1.);
        float bar = max(dot(d.xz/hl, ts), 0.); bar *= bar; bar *= bar; bar *= bar; bar *= bar; bar *= bar;
        c += (uWarmCol*uWarmCol*.7 + uWarmCol*.5)*(uWarm*uBar.w*bar*1.6*(1. - smoothstep(.6, 1.5, abs(el))));
        // the shelf's burning edge, below
        c += uGreenCol*uGreenCol*(uBulb*1.4*face*exp(-(el + .95)*(el + .95)*30.));
        // the bulb: a soft bloom round one hard point
        vec3 Lb = uBulbPos - Pw; Lb = Lb/max(length(Lb), 1.);
        float bd = max(dot(d, Lb), 0.), b2 = bd*bd, b8 = b2*b2*b2*b2, b64 = b8*b8*b8*b8*b8*b8*b8*b8;
        c += uBulbCol*(uBulb*att*(.5*b8*b8 + 14.*b64*b64*b64*b64));
        return c;
      }
      void main(){
        ${FRAG_IN}
        vec3 N = vN/max(length(vN), 1e-4);
        vec3 No = vec3(dot(N, vR0), dot(N, vR1), dot(N, vR2));
        vec3 Vo = vVo/max(length(vVo), 1e-4);
        // no face is optically flat: slow swells, melted smooth
        vec3 wq = vO*3.1 + vSeed*13.;
        vec3 Nb = normalize(No + (vec3(vnoise(wq), vnoise(wq + 5.7), vnoise(wq + 11.3)) - .5)*.16);
        float ndv = max(dot(Nb, Vo), 0.), f1 = 1. - ndv, fr = .03 + .97*f1*f1*f1*f1*f1;
        vec3 T = refract(-Vo, Nb, 1./1.31);
        T = dot(T, T) < 1e-6 ? -Vo : T;
        vec3 n1; float t1 = lcBoxOut(vO, T, n1);
        vec3 p1 = vO + T*t1;
        // the milky heart: a soft white cloud in the middle of the block, a little off centre and lobed, with a few fine bubbles in it
        vec3 hc = (vec3(fract(vSeed*7.3), fract(vSeed*13.7), fract(vSeed*29.1)) - .5)*.12;
        float cloud = 0., spark = 0.;
        for (int i = 0; i < 6; i++) {
          vec3 q = vO + T*(t1*(float(i) + .5)/6.) - hc;
          float r = length(q);
          cloud += 1. - smoothstep(.1, .3 + .1*vnoise(q*4. + vSeed*17.), r);
          spark += smoothstep(.86, .95, vnoise(q*21. + vSeed*3.))*(1. - smoothstep(.12, .3, r));
        }
        cloud = 1. - exp(-cloud*t1*.75);
        // two fine cracks through the heart: ragged white veils, each met once by the ray where it crosses the crack's plane
        vec3 k1 = normalize(vec3(.62, .31, -.72) + (vec3(fract(vSeed*3.7), fract(vSeed*9.1), fract(vSeed*17.3)) - .5)), k2 = normalize(vec3(-.4, .82, .41) + (vec3(fract(vSeed*23.9), fract(vSeed*5.9), fract(vSeed*41.3)) - .5));
        float d1 = dot(T, k1), d2 = dot(T, k2);
        float tk1 = (.04 - dot(vO, k1))/(abs(d1) < 1e-3 ? 1e-3 : d1), tk2 = (-.05 - dot(vO, k2))/(abs(d2) < 1e-3 ? 1e-3 : d2);
        vec3 qk1 = vO + T*tk1 - hc, qk2 = vO + T*tk2 - hc;
        float veil = step(0., tk1)*step(tk1, t1)*smoothstep(.42, .7, vnoise(qk1*5. + vSeed*29.))*(1. - smoothstep(.2, .46, length(qk1)))
                   + step(0., tk2)*step(tk2, t1)*smoothstep(.42, .7, vnoise(qk2*5. + vSeed*7.))*(1. - smoothstep(.2, .46, length(qk2)));
        // out through the far face, bent again; past the critical angle it glances off that face and leaves by the next
        vec3 wq1 = p1*2.7 + vSeed*7.;
        vec3 n1b = normalize(n1 + (vec3(vnoise(wq1 + 3.), vnoise(wq1 + 9.), vnoise(wq1 + 15.)) - .5)*.22);
        vec3 T2 = refract(T, n1b, 1.31);
        float pathLen = t1;
        vec3 a1 = abs(p1); float farEdge = smoothstep(.38, .49, a1.x + a1.y + a1.z - max(a1.x, max(a1.y, a1.z)) - min(a1.x, min(a1.y, a1.z)));
        if (dot(T2, T2) < 1e-6) {
          vec3 Tr = reflect(T, n1), n2; float t2 = lcBoxOut(p1, Tr, n2);
          T2 = refract(Tr, n2, 1.31); T2 = dot(T2, T2) < 1e-6 ? reflect(Tr, n2) : T2;
          pathLen += t2;
        }
        vec3 dW = vR0*T2.x + vR1*T2.y + vR2*T2.z; dW = dW/max(length(dW), 1e-4);
        // what lies beyond, bent and blue: ice takes the red out of what comes through it, the more the further it has come, and
        // scatters a little of the bulb's cold light on the way. Each block has a blue of its own, so one stands off the next
        vec3 tint = mix(vec3(.5, .8, 1.), vec3(.74, .94, 1.), fract(vSeed*5.3));
        vec3 through_ = lcIceRoom(dW, vW, att)*exp(-pathLen*vec3(.85, .3, .14))*tint*1.25
                      + uBulbCol*vec3(.2, .46, .74)*(uBulb*(.14 + .36*att)*(1. - exp(-pathLen*.9)));
        vec3 Nw = vR0*Nb.x + vR1*Nb.y + vR2*Nb.z; Nw = Nw/max(length(Nw), 1e-4);
        vec3 shade = mix(uDarkCol*.4, uShadowCol*uKey.y, uBulb);
        vec3 heart = uBulbCol*vec3(.9, .96, 1.)*(uBulb*(.3 + .7*att)*(.84 + .2*clamp(Nw.y, 0., 1.))) + shade*1.1 + uWarmCol*(uWarm*uBar.w*.1);
        vec3 col = mix(through_, heart, clamp(cloud*.92 + veil*.5*(1. - cloud), 0., 1.)) + uBulbCol*(uBulb*att*spark*.25);
        // the wet skin mirrors the room, most at a glancing angle
        col = mix(col, lcIceRoom(reflect(-V, Nw), vW, att)*1.1 + uBulbCol*(uBulb*att*.12), fr);
        // edges. Just inside each edge the light is turned back into the block: a darker, bluer line. The edge itself gathers light:
        // white where it is turned to the bulb, a thin cold line where it is not. The far edges show through the body as pale lines
        vec3 ao = abs(vO); float mid = ao.x + ao.y + ao.z - max(ao.x, max(ao.y, ao.z)) - min(ao.x, min(ao.y, ao.z));
        float bevel = smoothstep(.43, .475, mid), inner = smoothstep(.25, .42, mid)*(1. - bevel);
        col *= vec3(1.) - inner*vec3(.3, .19, .12)*(1. - cloud*.5);
        float toBulb = smoothstep(-.15, .6, dot(Nw, Lb)), back = clamp(dot(-V, Lb)*.5 + .5, 0., 1.);
        float kf = clamp(dot(Nw, LC_KITCHEN)*.8 + .3, 0., 1.)*min(uWarm*uBar.w, 1.);                 // the edges turned to the slot take the kitchen's colour
        col += uBulbCol*(uBulb*att*(bevel*(.16 + 1.5*toBulb + .5*back*toBulb)*(1. - .8*kf) + farEdge*(1. - cloud)*(1. - bevel)*.2));
        col += (uWarmCol*uWarmCol*.7 + uWarmCol*.4)*(uWarm*uBar.w*(bevel*(.1 + 1.6*kf) + .4*fr));
        // a few frost needles on one face (the block's own top): fine white strokes growing in from one corner, a quarter fan of
        // about six, each 11 cm wide at its root (.012 of the 9 m block) and tapering to nothing a fifth to two thirds of the way across
        vec2 fqn = vO.xz + .47; float fln = max(length(fqn), 1e-3), fan = atan(fqn.y, fqn.x + (abs(fqn.x) + abs(fqn.y) < 1e-4 ? 1e-3 : 0.));
        float cn = fan*7. + floor(vSeed*11.), hn = hash11(floor(cn)*1.9 + floor(vSeed*97.)), reachN = .2 + .5*hn, wn = min(.012*7./fln, .3)*max(1. - fln/reachN, 0.), aaN = clamp(mpp*.78/fln, 1e-3, .5);   // 7 places to a radian; .78 = 7/9, a pixel in those places on a 9 m block
        float needles = (1. - smoothstep(wn - aaN, wn + aaN, abs(fract(cn) - .5)))*step(fln, reachN)*step(.4, hn)*smoothstep(.8, .95, No.y)*smoothstep(.03, .09, fln)*(1. - smoothstep(.25, .6, aaN));
        col = mix(col, uBulbCol*(uBulb*(.4 + .6*att)*1.05) + shade, needles*.75);
        // one hard highlight, and the wet film's small glints along the rims
        float nh = max(dot(Nw, Hb), 0.), nh2 = nh*nh, nh8 = nh2*nh2*nh2*nh2, nh64 = nh8*nh8*nh8*nh8*nh8*nh8*nh8*nh8;
        col += uBulbCol*(uBulb*att*(9.*nh64*nh64*nh64*nh64*nh64*nh64 + .8*bevel*toBulb*smoothstep(.9, .96, vnoise(vO*23. + V*2. + uTime*.3))));
        col += uDiodeCol*(dio*(fr*.4 + bevel*.12));
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });

  // ---- drips off the shelf edges: they swell, let go, and fall through the bar as gold sparks
  M.drip = mk({
    ...ADDITIVE,
    vertexShader: /* glsl */`
      attribute vec4 aD; uniform float uTime;
      varying vec2 vUv; varying vec3 vW; varying float vA;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        float t = fract(aD.z + uTime*aD.w);
        float hang = smoothstep(0., .4, t), fall = max(t - .4, 0.)/.6;
        vec3 c = vec3(aD.x, aD.y - 1.2 - hang*.8 - fall*fall*96., ${(EDGE_Z - 1.2).toFixed(1)});
        vec3 toCam = cameraPosition - c; float d = max(length(toCam), 1e-3);
        vec3 r = cross(vec3(0., 1., 0.), toCam/d); r = r/max(length(r), 1e-3);
        float wdt = max(mix(.35, 1., hang), d*.0028), hgt = wdt*(1.15 + 3.2*min(fall*3., 1.));
        vec3 p = c + r*(position.x*wdt) + vec3(0., position.y*hgt, 0.);
        vUv = position.xy*2.; vW = p; vA = (1. - smoothstep(.9, 1., t))*smoothstep(0., .08, t)*min(1., mix(.35, 1., hang)/max(d*.0028, 1e-4));
        vec4 mvPosition = viewMatrix*vec4(p, 1.); gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying float vA;
      ${HEAD}
      void main(){
        vec3 P = vW - uOrigin;
        float a = (1. - smoothstep(.25, 1., length(vUv)))*vA;
        float att = lcBulbAtt(length(uBulbPos - vW));
        vec3 c = uBulbCol*(uBulb*att*1.6) + uWarmCol*(uWarm*lcBar(P)*3.2) + uDiodeCol*(uDiode*(1. - uBulb)*.25);
        gl_FragColor = vec4(c*(a*(1. - fxFog())), 0.);
      }`,
  });

  // ---- the length of gasket that hangs on the cabinet's edge beside the way out: grey bellows rubber, its folds running along
  // it (darker in the folds, a rim of light on each ridge: the bulb's from the box, the kitchen's from the slot), its free end
  // shivering a little as the door's gasket does when it lets go (the same 9 a second, over a slower sway). aS = (along 0..1,
  // across -1..1, 1 on the folded face and 0 on the flat back); aW, aNn = the strip's width and facing at that place.
  M.strap = mk({
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aS, aW, aNn; uniform float uTime;
      varying vec3 vW, vNo, vS;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        float free = smoothstep(.04, .5, aS.x);                       // held at the top, loose from there down
        vec3 p = position + aW*(free*(.16*sin(uTime*9. + aS.x*15.) + .42*sin(uTime*1.7 + aS.x*5.5))) + aNn*(free*.3*sin(uTime*2.3 + aS.x*7.));
        vS = aS; vNo = mat3(modelMatrix)*aNn;
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vNo, vS;
      ${HEAD}
      void main(){
        ${FRAG_IN}
        vec3 n = cross(dFdx(vW), dFdy(vW)); n = n/max(length(n), 1e-9);
        if (dot(n, V) < 0.) n = -n;
        vec3 ns = vNo/max(length(vNo), 1e-3); if (dot(ns, V) < 0.) ns = -ns;
        n = normalize(n*.6 + ns);
        float fc = -cos((vS.y*.5 + .5)*25.1327);                      // 1 on each of the four ridges, -1 in the folds between (as the strip is built)
        float fold = mix(.6, .42 + .58*smoothstep(-1., 1., fc), vS.z);
        vec3 alb = vec3(.44, .48, .5)*fold*(.9 + .1*sin(vS.x*61. + vS.y*9.));
        vec3 col = lcShade(vW, n, V, alb, 14., .16);
        float fres = pow(max(1. - abs(dot(n, V)), 0.), 3.);
        // the box's own light on the rubber (the bulb is hooded from the door's side, so this is bounce off the white walls)
        col += alb*uBulbCol*(uBulb*(.07 + .26*att)*(.55 + .45*fold)) + uBulbCol*(uBulb*.1*fres);
        float ridge = smoothstep(.1, 1., fc)*vS.z; ridge *= ridge;
        float bar = min(lcBar(P) + .5*lcOutside(P) + .35*uBar.w, 1.);
        col += uBulbCol*(uBulb*(.25 + .6*att)*ridge*.5) + uWarmCol*(uWarm*bar*(ridge*.3 + fres*.5));
        gl_FragColor = vec4(fxApplyFog(max(col, vec3(0.))), 1.);
      }`,
  });

  // ---- mist: soft puffs at the feet of the falls, on the canyon floor, over the sill, and the cat's breath
  M.mist = mk({
    ...PREMULT,
    uniforms: { uBreath: { value: 0 }, uMistAmt: { value: look.fogAmt } },
    vertexShader: /* glsl */`
      attribute vec4 aC, aR; uniform vec3 uFalls; uniform float uTime, uBreath, uMistAmt, uBulb;
      varying vec2 vUv; varying vec3 vW; varying vec3 vP; varying float vUp;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        float ph = aR.x*6.2832, kind = aR.w;
        vec3 c = aC.xyz + vec3(sin(uTime*.21 + ph), .35*sin(uTime*.33 + ph*1.7), .6*cos(uTime*.17 + ph*.6))*aR.y;
        float amt = kind < .5 ? uFalls.x : (kind < 1.5 ? uFalls.y : (kind < 3.5 ? uFalls.z : 1.));
        amt = kind > 3.5 ? 1. : smoothstep(.5, 1., amt);
        if (kind > 4.5) { amt = uBreath; c.x += uBreath*26.*(.4 + aR.x); }
        if (kind > 5.5) {
          // the river: along the canyon floor, humping up through the foot of the slot under the portal, then out and down
          float tt = fract(aR.x + uTime*.03), k = 1. - tt;
          c = k*k*k*vec3(-6., 15., -212.) + 3.*k*k*tt*vec3(-98., 27., -224.) + 3.*k*tt*tt*vec3(-160., 96., -262.) + tt*tt*tt*vec3(-236., -30., -322.)
            + aC.xyz*(1. - .4*tt) + vec3(sin(uTime*.21 + ph), .35*sin(uTime*.33 + ph*1.7), .6*cos(uTime*.17 + ph*.6))*aR.y;
          amt = smoothstep(.5, 1., uFalls.z)*smoothstep(0., .1, tt)*(1. - smoothstep(.8, 1., tt));
        }
        if (kind > 6.5) {
          // cold rolling off the ice: it gathers behind the tray's rail, creeps over it and sinks down its front to the shelf
          float tt = fract(aR.x + uTime*(.035 + .012*aR.y)), over = smoothstep(.3, .66, tt);
          c = aC.xyz + vec3(sin(uTime*.21 + ph)*aR.y, .9*sin(tt*3.1416) - 12.*over*over, -2.5 + 14.*tt);
          amt = uBulb*smoothstep(0., .14, tt)*(1. - smoothstep(.72, 1., tt));
        }
        vec4 mvPosition = viewMatrix*modelMatrix*vec4(c, 1.);
        float rot = aR.x*6.2832 + uTime*.12*(aR.z - .5), size = aC.w*(1. + .12*sin(uTime*.4 + ph*2.));
        vec2 q = mat2(cos(rot), sin(rot), -sin(rot), cos(rot))*position.xy*size;
        vUp = q.y/max(size*.5, 1e-3);
        float a = amt*uMistAmt*aR.z*mix(smoothstep(14., 70., -mvPosition.z), smoothstep(6., 22., -mvPosition.z), step(6.5, kind));
        vW = (modelMatrix*vec4(c, 1.)).xyz + vec3(q, 0.)*mat3(viewMatrix);
        mvPosition.xy += q;
        vUv = position.xy*2.; vP = vec3(a, aR.x, kind);
        gl_Position = a < .003 ? vec4(2., 2., 2., 1.) : projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW; varying vec3 vP; varying float vUp;
      ${HEAD}${GLSL_FOOT}
      void main(){
        vec3 P = vW - uOrigin;
        float r = length(vUv);
        float n = fbmLo(vUv*1.4 + vP.y*23. + vec2(0., uTime*.085));
        float d = (1. - r*r)*(.3 + 1.3*n) - .22 - .16*vnoise(vUv*4.6 + vP.y*51. - vec2(0., uTime*.15));
        float a = smoothstep(0., .95, d)*vP.x;
        // the fog that creeps on the top shelf (kind 4) lies low on its bare glass: full to 5 m above it (the glass is at y ${SHELF[0]}),
        // gone by 18 m, the shoulders of the lowest jars. Back from the lip (z ${EDGE_Z}) and short of the ice trays, which stand from
        // x 55 and carry their own cold higher
        a *= 1. - step(3.5, vP.z)*step(vP.z, 4.5)*smoothstep(${(EDGE_Z - 2).toFixed(1)}, ${(EDGE_Z + 4).toFixed(1)}, vW.z)*(1. - smoothstep(40., 52., vW.x))*smoothstep(5., 18., vW.y - ${SHELF[0].toFixed(1)});
        float att = lcBulbAtt(length(uBulbPos - vW));
        // lit from above: a bright crown and a teal underside give each billow its roundness
        float crown = smoothstep(-.75, .65, vUp + (n - .5)*.9);
        vec3 c = uBulbCol*(uBulb*(.42 + .58*att)*mix(.46, 1.14, crown))*mix(vec3(.58, .86, 1.), vec3(1.), n*crown);
        c += mix(uDarkCol, uShadowCol*(1.1*uKey.y), uBulb)*.7;
        #ifdef USE_FOG
          c += (fogColor*1.2 + uDiodeCol*(uDiode*.02*crown))*(1. - uBulb);                         // before the bulb mist is a shade paler than the air it hangs in
        #endif
        c = mix(c, uWarmCol*(uWarm*.85)*mix(.32, 1.1, crown) + c*mix(.55, .1, crown), lcBar(P)*.9*mix(.5, 1., crown));   // gold on the crowns, the undersides stay teal
        c *= .8 + .28*n;
        // at the foot of the slot (lcFoot in the hero) every billow shows its lobes, turning over as the river leaves: thin in the
        // creases, the crowns cold where the bulb reaches them, gold below where the bar crosses. (Not the cat's breath, kind 5.)
        float foot = lcFoot(P)*(1. - step(4.5, vP.z)*step(vP.z, 5.5)), roll = lcRoll(vUv*1.5 + vP.y*37., uTime);
        a *= mix(1., .66 + .48*roll, foot);
        c = mix(c*mix(1., .7 + .42*roll, foot), uBulbCol*vec3(.8, .93, 1.)*(uBulb*(.42 + .5*att)), foot*.3*roll*roll*smoothstep(.2, .9, crown));
        gl_FragColor = vec4(fxFogPremult(max(c, vec3(0.))*a, a), a);
      }`,
  });

  // ---- what the jars throw on the glass shelf: a teal shadow and, down its middle, light focused through the liquid
  M.caustic = mk({
    ...PREMULT, side: THREE.DoubleSide,                     // (the strips lie face down: without this they show only from below)
    vertexShader: /* glsl */`
      attribute vec4 aJ, aK; uniform vec3 uBulbPos;
      varying vec2 vUv, vC; varying vec3 vW, vLiq;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        vec2 dir = aJ.xy - uBulbPos.xz; float dl = max(length(dir), 1.); dir /= dl;
        float len = clamp(aK.w*dl/max(uBulbPos.y - aJ.w - aK.w*.6, 20.), aJ.z*1.5, 150.);
        float s = mix(-aJ.z*1.6, len, position.x + .5), tWide = position.y*2.*aJ.z*mix(1.6, 1.6, position.x + .5);
        vec3 p = vec3(aJ.x + dir.x*s - dir.y*tWide, aJ.w + .14, aJ.y + dir.y*s + dir.x*tWide);
        vUv = vec2((s + aJ.z*1.1)/max(len + aJ.z*1.1, 1.), position.y*2.*1.28); vLiq = aK.rgb; vC = (p.xz - aJ.xy)/max(aJ.z, 1.);
        vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv, vC; varying vec3 vW, vLiq;
      ${HEAD}
      void main(){
        float inside = step(abs(vW.x), 147.)*step(${EDGE_Z.toFixed(1)}, vW.z)*step(vW.z, -1.);
        float b = abs(vUv.y), a0 = vUv.x;
        float sh = (1. - smoothstep(.55, 1., b))*smoothstep(0., .06, a0)*(1. - smoothstep(.45, 1., a0));
        // where the jar meets the glass: a soft dark ring all round its foot
        float cd = length(vC), contact = (1. - smoothstep(.85, 1.5, cd))*smoothstep(.5, .8, cd);
        // a ring of water where the cold glass has stood, broken here and there, catching the light
        float wet = (1. - smoothstep(.03, .1, abs(cd - 1.34 - .06*vnoise(vC*2.3 + vLiq.rg*9.))))*smoothstep(.3, .55, vnoise(vC*1.1 + vLiq.gb*7.));
        float ripple = .45 + .75*vnoise(vec2(a0*12. - uTime*.5, vUv.y*4. + uTime*.2));
        float ca = exp(-b*b*9.)*smoothstep(.08, .24, a0)*(1. - smoothstep(.3, .95, a0))*ripple;
        float pool = exp(-b*b*2.6)*smoothstep(.05, .2, a0)*(1. - smoothstep(.5, 1., a0))*(.7 + .3*ripple);
        float att = lcBulbAtt(length(uBulbPos - vW));
        vec3 lq = max(vLiq, vec3(.02)); lq = lq*lq/max(max(lq.r, max(lq.g, lq.b)), .05);      // the liquid's colour, deepened
        vec3 c = lq*uBulbCol*(uBulb*att*(ca*4.2 + pool*1.7)*(1. + .9*uDark.y)) + uBulbCol*(uBulb*att*(ca*ca*.6 + wet*.55)) + uShadowCol*lq*(uBulb*sh*.5);
        float al = max(max(sh*(.6 + .3*uDark.y), contact*.84), max(pool*.5, wet*.3))*uBulb*inside;
        gl_FragColor = vec4(fxFogPremult(max(c, vec3(0.))*inside, al), al);
      }`,
  });
  // ---- every jar mirrored in the glass it stands on: a soft, upside-down picture of it drawn out toward the eye, longer the
  // lower the eye. Before the bulb it carries the jar's dim fill and its outline; lit, its colour. aJ: x, z, R, shelf y;
  // aK: liquid rgb, H; aM: fill, milk, lit, shape (0 jar, 1 bottle with a neck, 2 dome)
  M.refl = mk({
    ...PREMULT,
    vertexShader: /* glsl */`
      attribute vec4 aJ, aK, aM;
      varying vec2 vQ; varying vec3 vW; varying vec4 vJ, vLiq, vM;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){
        vec2 toCam = cameraPosition.xz - aJ.xy; float D = max(length(toCam), 1.); vec2 dir = toCam/D;
        float c = cameraPosition.y - aJ.w, H = aK.w;
        float len = min(D*H/max(c + H, 1.), max(D - 3., 0.));          // where the jar's top is mirrored
        float s = position.y + .5; vec2 sd = vec2(-dir.y, dir.x);
        vec2 xz = aJ.xy + dir*(s*len) + sd*(position.x*2.4*aJ.z);
        vQ = vec2(position.x*2.4, s*len);
        vJ = vec4(D, c, H, aJ.z); vLiq = vec4(aK.rgb, smoothstep(5., 24., c)); vM = aM;
        vec4 w = modelMatrix*vec4(xz.x, aJ.w + .1, xz.y, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix*w; gl_Position = vLiq.a < .003 ? vec4(2., 2., 2., 1.) : projectionMatrix*mvPosition;
        ${fx.GLSL_FOG_VERT}
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vW; varying vec4 vJ, vLiq, vM;
      ${HEAD}
      void main(){
        float d = vQ.y, D = vJ.x, c = max(vJ.y, .5), H = max(vJ.z, 1.);
        float hN = d*c/max(D - d, .5)/H;                                 // the height on the jar that is mirrored here
        float hc = clamp(hN, 0., 1.), shape = vM.w;
        float x = abs(vQ.x + (vnoise(vW.xz*.3) - .5)*.34*hc*(1. - .6*uDark.y));            // frost on the sheet smears the picture
        float w = shape > 1.5 ? sqrt(max(1. - hc*hc, 0.)) : mix(1., .44, smoothstep(.48, .76, hc)*step(.5, shape));
        float aa = max(fwidth(vQ.x), 1e-3)*1.5 + .05 + .14*hc;
        float inside = (1. - smoothstep(w - aa, w + aa, x))*(1. - smoothstep(.95, 1.03, hN));
        float rim = smoothstep(w - aa*2.5 - .14, w - aa*.5, x)*inside;
        float inLiq = 1. - smoothstep(vM.x - .03, vM.x + .03, hN);
        float elev = c/max(length(vec2(D, c)), 1.);                      // sine of the eye's height above the sheet
        float k = (mix(.22, .5, uBulb) + .7*pow(max(1. - elev, 0.), 2.5))*vLiq.a*mix(1., .5, hc);
        float inShelf = step(abs(vW.x), 147.)*step(${EDGE_Z.toFixed(1)}, vW.z)*step(vW.z, -1.);
        vec3 liq = max(vLiq.rgb, vec3(1e-3)); float milk = vM.y, dkn = 1. - uBulb;
        float att = lcBulbAtt(length(uBulbPos - vW))*vM.z;
        vec3 hue = lcDarkHue(liq, milk);
        vec3 lit = (liq*uBulbCol*(uBulb*att*(1.5 + .9*(1. - hc)))*inLiq + uBulbCol*(uBulb*att*(.12*(1. - inLiq) + .9*rim)))*(1. + .8*uDark.y);
        vec3 dark = hue*(dkn*uDark.z*(.05 + .1*(1. - hc)))*inLiq + mix(uDiodeCol, hue, .7)*(dkn*uDiode*.36*rim);
        float ripple = .7 + .3*vnoise(vec2(vW.x*.8 + vW.z*.3, vW.z*.8));
        float m = k*inside*inShelf;
        vec3 col = (lit + dark)*(m*ripple);
        float a = m*.55*(.2 + .8*uBulb);
        gl_FragColor = vec4(fxFogPremult(max(col, vec3(0.)), a), a);
      }`,
  });
  return M;
}

// ---------------------------------------------------------------- the outside: kitchen, cat, the two lamps, fly wings
function makeOutsideMaterials(U, look) {
  const mk = (o) => new THREE.ShaderMaterial({ ...o, uniforms: { ...fx.fogUniforms(), ...U, ...(o.uniforms || {}) } });
  const O = {};
  // three out-of-focus layers wrapped round the slot (wall 900 m, cupboard and window 700 m, worktop 500 m)
  O.kitchen = mk({
    ...PREMULT, fog: false, side: THREE.DoubleSide,
    uniforms: { uLook: { value: look.index } },
    vertexShader: /* glsl */`
      attribute vec3 aL; varying vec3 vL, vKw;
      void main(){ vL = aL; vec4 w = modelMatrix*vec4(position, 1.); vKw = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vL, vKw; uniform float uLook;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}${fx.GLSL_FBM}${GLSL_LIGHT}
      float sq(float x){ return x*x; }
      // the shadow of a leafy twig: one cell holds a stem with five leaves set left and right along it, all swaying together
      float lcTwig(vec2 p, float sw){
        vec2 id = floor(p), f = fract(p) - .5; float h = hash12(id + 3.7), h2 = hash12(id*1.7 + 9.1);
        float ang = (h - .5)*2.4 + sw*(.6 + .8*h2);
        float c = cos(ang), s = sin(ang); vec2 q = vec2(c*f.x + s*f.y, -s*f.x + c*f.y);
        float sh = (1. - smoothstep(.006, .034, abs(q.y + .05*sin(q.x*5. + h*9.))))*(1. - smoothstep(.36, .44, abs(q.x)));
        for (int i = 0; i < 5; i++) {
          float fi = float(i), sd = mod(fi, 2.)*2. - 1., la = sd*(.75 + .3*h2) + sw*1.5*sd;
          vec2 lp = q - vec2(-.34 + fi*.17, 0.);
          float cl = cos(la), sl = sin(la); vec2 l = vec2(cl*lp.x + sl*lp.y, -sl*lp.x + cl*lp.y) - vec2(.125, 0.);
          sh = max(sh, 1. - smoothstep(.55, 1.2, length(l/vec2(.135, .05 + .012*fi))));
        }
        return sh*step(.22, h2);
      }
      vec3 blob(float a, float y, float ph, vec3 c){
        vec2 g = vec2(.55 + .24*sin(uTime*.17 + ph), 250. + 190.*sin(uTime*.13 + ph*1.7));
        return c*exp(-(sq((a - g.x)*7.) + sq((y - g.y)/190.)));
      }
      void main(){
        float a = vL.x, y = vL.y, layer = vL.z;
        vec3 col = vec3(0.); float al = 1.;
        float blot = fbm(vec2(a*6., y*.004) + 3.);
        float lamp = smoothstep(.36, .95, a)*(.4 + .6*smoothstep(-220., 480., y))*(1. - .5*smoothstep(520., 900., y));
        // seen from the terrace the slot looks out at the lamplit side of the kitchen (a near .5): a glowing wall, its shapes
        // only darker blurs on it. From the canyon and the exit line (a under .3) it looks at the shadowed side wall
        float band = exp(-sq((a - .53)/.13)), shady = 1. - smoothstep(.3, .5, a);
        float rise = .45 + .55*smoothstep(-420., 520., y + 90.*sin(a*23.));
        if (layer < .5) {
          float low = exp(-sq((y + 40.)/300.));
          if (uLook < .5) col = mix(mix(vec3(.11, .052, .045), vec3(.034, .04, .11), shady)*(.75 + .5*blot) + vec3(.2, .095, .04)*low*(1. - .7*shady), vec3(1.2, .6, .18)*1.05, lamp*(.65 + .55*blot)) + vec3(1.5, .7, .19)*(band*rise*(.75 + .35*blot));
          else if (uLook < 1.5) {
            // a sunlit wall: pale gold, cooler and dimmer toward the top, with the soft shadow of leaves and twigs swaying on it
            vec2 lq = vec2(a*10., y*.0042);
            float sw = .16*sin(uTime*.7 + a*9.) + .07*sin(uTime*1.3 + y*.004);
            float leaf = max(lcTwig(lq + vec2(sw*.12, 0.), sw), .8*lcTwig(lq*1.6 + vec2(4.3, 1.7) - vec2(sw*.1, 0.), -sw));
            float bough = smoothstep(.3, .55, fbm(lq*.45 + 7.));
            leaf = clamp(leaf*(.45 + .55*bough) + .3*bough*smoothstep(.45, .7, fbm(lq*1.3 + 2.)), 0., 1.);
            vec3 wallc = vec3(1.22, 1., .64)*(1. - .34*smoothstep(-100., 800., y))*(.9 + .1*lamp);
            col = mix(wallc, vec3(.4, .5, .36), .7*leaf);
          } else {
            col = vec3(.085, .05, .12)*(.75 + .5*blot) + vec3(.12, .06, .1)*low + vec3(.5, .3, .14)*(lamp*.45);
            col += blob(a, y, 0., vec3(1., .32, .5)) + blob(a, y, 2.1, vec3(1., .72, .25)) + blob(a, y, 4.2, vec3(.55, .35, 1.)) + uWarmCol*(band*rise*.6);
          }
        } else if (layer < 1.5) {
          float cup = smoothstep(.5, .535, a)*(1. - smoothstep(.72, .84, a))*(1. - smoothstep(400., 520., y));
          float inset = smoothstep(.535, .56, a)*(1. - smoothstep(.69, .77, a))*smoothstep(-170., -60., y)*(1. - smoothstep(300., 380., y));
          float win = smoothstep(.3, .38, a)*(1. - smoothstep(.485, .515, a))*smoothstep(300., 400., y)*(1. - smoothstep(690., 900., y));
          win *= 1. - .45*(1. - smoothstep(.0, .012, abs(a - .47)));                    // a glazing bar
          // a tall cupboard on the shadowed side, seen through the slot from the canyon
          float cup2 = smoothstep(.01, .13, a)*(1. - smoothstep(.15, .28, a))*(1. - smoothstep(250., 480., y));
          float inset2 = smoothstep(.06, .13, a)*(1. - smoothstep(.16, .23, a))*smoothstep(-220., -40., y)*(1. - smoothstep(190., 360., y));
          cup = max(cup, cup2); inset = max(inset, inset2*.8);
          vec3 cc = uLook < .5 ? mix(vec3(.62, .34, .13), vec3(.13, .1, .24), shady)*(.5 + .35*inset) : (uLook < 1.5 ? vec3(.78, .7, .56)*(.75 + .2*inset) : vec3(.26, .14, .22)*(.6 + .4*inset));
          vec3 wc = uLook < .5 ? vec3(.035, .07, .19) : (uLook < 1.5 ? vec3(.62, .82, 1.08) : vec3(.05, .05, .2));
          wc *= .8 + .2*smoothstep(.33, .43, a);
          al = max(cup, win)*(1. - .55*band); col = mix(wc, cc*(.6 + .8*lamp), cup);
        } else {
          float top = 108. + 9.*sin(a*5.);
          al = (1. - smoothstep(top - 75., top + 75., y))*smoothstep(0., .17, a)*(1. - .5*band);
          vec3 edge = (uLook < 1.5 ? uWarmCol : vec3(.8, .5, .7))*exp(-sq((y - top + 8.)/62.))*(.3 + .5*lamp)*(1. - .8*shady);
          float doors = .8 + .2*smoothstep(.02, .32, abs(fract(a*11.) - .5))*smoothstep(0., 170., top - y);
          col = (uLook > .5 && uLook < 1.5 ? vec3(.2, .22, .24) : (uLook < .5 ? mix(vec3(.075, .04, .032), vec3(.03, .032, .075), shady) : vec3(.055, .034, .07)))*doors + edge;
        }
        // the slot is a source of light, not a painted wall: across it (from the cabinet's edge to the door's) the glow has a
        // hot core and falls away to both edges, and it is brightest at lamp height. Worked out along the eye's own ray,
        // so the core stays in the middle of the bar from wherever it is seen.
        vec2 sA = vec2(-150., uOrigin.z), sE = vec2(150. - 300.*cos(uDoor), uOrigin.z - 300.*sin(uDoor)), se = sE - sA;
        vec2 rr = vKw.xz - cameraPosition.xz, ac = sA - cameraPosition.xz;
        float den = rr.x*se.y - rr.y*se.x; den = abs(den) < 1e-3 ? 1e-3 : den;
        float sp = clamp((ac.x*rr.y - ac.y*rr.x)/den, 0., 1.);
        float prof = sin(sp*3.14159); prof = prof*sqrt(max(prof, 0.));
        float ty = clamp((ac.x*se.y - ac.y*se.x)/den, 0., 1.), ySlot = cameraPosition.y + (vKw.y - cameraPosition.y)*ty;     // the height at which this ray leaves the box
        float vert = .3 + .7*exp(-sq((ySlot - 300.)/170.));
        float inBox = smoothstep(-6., 16., cameraPosition.z - uOrigin.z);                              // from outside (the last metres) there is no slot to look through
        float gk = uLook < .5 ? .85 : (uLook < 1.5 ? .4 : .7);
        col = mix(col, col*mix(.3, 1.05, prof)*mix(.55, 1.1, vert) + uWarmCol*uWarmCol*(prof*prof*vert*gk), inBox);
        al = mix(al, max(al, prof*prof*vert*.85), inBox);
        al *= uBar.w;
        gl_FragColor = vec4(col*al, al);
      }`,
  });
  // the cat: a soft dark head with two ears, a moonlit rim all the way over it, and one wide eye. It is small enough
  // to stand whole in the slot as seen from the dive. uCat = presence, pupil, lids, unused; vUv in metres from the eye
  O.cat = mk({
    ...PREMULT, fog: true, side: THREE.DoubleSide,
    uniforms: { uCat: { value: new THREE.Vector4(0, 1, 1.2, 0) } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      ${fx.GLSL_FOG_PARS_VERT}
      void main(){ vUv = position.xy; vec4 mvPosition = viewMatrix*modelMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition; ${fx.GLSL_FOG_VERT} }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; uniform vec4 uCat;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}${fx.GLSL_FBM}${GLSL_LIGHT}${fx.GLSL_FOG_PARS_FRAG}
      float lcEar(vec2 e){ return max(abs(e.x)*1.3 + e.y*.62 - 9.5, -e.y - 14.)/16.; }
      float lcSmin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
      void main(){
        vec2 p = vUv, hc = vec2(8., -5.);
        float head = length((p - hc)/vec2(30., 26.)) - 1.;
        float ears = min(lcEar(p - (hc + vec2(-17., 27.))), lcEar(p - (hc + vec2(17., 28.))));
        float body = length((p - (hc + vec2(6., -76.)))/vec2(40., 50.)) - 1.;
        float d = lcSmin(lcSmin(head, ears, .28), body, .3);
        d += (fbm(p*.11) - .5)*.09 + (vnoise(p*.9) - .5)*.035;                // fur: a soft, broken edge
        float inside = 1. - smoothstep(-.04, .04, d);
        vec2 up = (p - hc)/max(length(p - hc), 1e-3);
        float upness = smoothstep(-.75, .25, up.y);
        float rim = exp(-abs(d + .03)*7.)*upness;
        float soak = exp(-max(-d, 0.)*3.2)*upness;                             // moonlight soaking a little way into the fur
        vec3 col = (vec3(.006, .007, .012) + vec3(.06, .09, .17)*soak)*inside + vec3(.5, .66, .95)*(rim*.95);
        float r = length(p)/11.;
        float ang = atan(p.y, p.x + (abs(p.x) + abs(p.y) < 1e-3 ? 1e-3 : 0.));
        float iris = 1. - smoothstep(.93, 1.03, r);
        vec3 ic = mix(vec3(1., .74, .1), vec3(.2, .86, .3), smoothstep(.2, .95, r))*(.72 + .28*vnoise(vec2(ang*9., r*3.)));
        float pw = mix(.08, .52, uCat.y);
        float pupil = 1. - smoothstep(1., 1.3, length(vec2(p.x/(11.*pw), p.y/(11.*.88))));
        ic *= 1. - pupil;
        ic *= 1. - .65*smoothstep(.78, 1., r);
        ic += vec3(1., 1., .92)*((1. - smoothstep(0., .13, length(p/11. - vec2(-.3, .36))))*.9);
        float lids = 1. - smoothstep(uCat.z, uCat.z + .14, abs(p.y)/11.);
        col = mix(col, ic*(.5 + .75*uBulb), iris*lids*inside);
        float al = clamp(max(inside, rim*.8), 0., 1.)*uCat.x*smoothstep(-112., -48., p.y);
        // out in the kitchen air, not in the box's haze: only a third of the fog, so the head stays a dark shape
        vec3 fogged = fxFogPremult(col*uCat.x, al);
        gl_FragColor = vec4(max(mix(col*uCat.x, fogged, .3), 0.), al);
      }`,
  });
  // a plain glowing thing (the bulb, the diode): uLevel is set every frame
  O.lamp = (hex) => mk({
    fog: true, uniforms: { uCol: { value: new THREE.Color(hex) }, uLevel: { value: 0 } },
    vertexShader: VERT_STD,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; uniform vec3 uCol; uniform float uLevel;
      ${fx.GLSL_FOG_PARS_FRAG}
      void main(){
        vec3 V = normalize(cameraPosition - vW); float ndv = abs(dot(vN/max(length(vN), 1e-4), V));
        gl_FragColor = vec4(fxApplyFog(uCol*(uLevel*(.45 + .55*ndv*ndv)) + uCol*.004), 1.);
      }`,
  });
  // the bar as light in the air: a tall soft glow standing in the slot, turned to the eye. Brightest above the zip, a dim
  // ember where the gasket still holds; it stands down as the route comes close (uGlow)
  O.barGlow = mk({
    ...ADDITIVE, fog: false, depthTest: false,
    uniforms: { uGlow: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float uDoor; uniform vec3 uOrigin;
      varying vec2 vQ; varying float vY;
      void main(){
        vec2 E = vec2(150. - 300.*cos(uDoor), uOrigin.z - 300.*sin(uDoor));
        vec3 c = vec3((E.x - 150.)*.5, position.y, (E.y + uOrigin.z)*.5);
        vec2 toCam = cameraPosition.xz - c.xz; float d = max(length(toCam), 1e-3);
        vec3 p = c + vec3(-toCam.y, 0., toCam.x)/d*(position.x*110.);
        vQ = vec2(position.x*2., d); vY = position.y;
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vY; uniform float uGlow;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}${GLSL_LIGHT}
      void main(){
        float g = exp(-vQ.x*vQ.x*9.) + .35*exp(-vQ.x*vQ.x*2.2);
        float open = smoothstep(uBar.y - 16., uBar.y + 12., vY);
        float vert = smoothstep(2., 46., vY)*(1. - smoothstep(372., 418., vY));
        float drift = .78 + .22*vnoise(vec2(vQ.x*2.3, vY*.012 - uTime*.05));
        float a = g*(.2 + .8*open)*vert*drift*uBar.w*uWarm*uGlow*smoothstep(60., 170., vQ.y);
        gl_FragColor = vec4((uWarmCol*uWarmCol*.5 + uWarmCol*.2)*(a*1.7), 0.);
      }`,
  });
  // the blur of a fly's wings: a pale veil with a bright edge, so it shows against fog and against the dark
  O.wing = mk({
    ...PREMULT, fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: VERT_STD,
    fragmentShader: /* glsl */`
      varying vec3 vW, vCol;
      ${HEAD}
      void main(){
        vec3 P = vW - uOrigin; float att = lcBulbAtt(length(uBulbPos - vW));
        float beat = .5 + .5*sin(uTime*19. + vCol.g*6.2832), edge = vCol.r*vCol.r;
        float a = (.2 + .55*edge)*(.7 + .3*beat);
        vec3 light = uBulbCol*(uBulb*(.4 + .6*att)) + uDiodeCol*(uDiode*(1. - uBulb)*.3) + uWarmCol*(uWarm*lcBar(P)*.6) + mix(uDarkCol, uShadowCol*uKey.y, uBulb);
        vec3 c = light*mix(vec3(.4, .52, .6), vec3(1.05, 1.12, 1.18), edge);
        gl_FragColor = vec4(fxFogPremult(c*a, a), a);
      }`,
  });
  return O;
}

// ---------------------------------------------------------------- geometry helpers
const WHITE = new THREE.Color(0.76, 0.81, 0.84), LINER = new THREE.Color(0.72, 0.79, 0.83), WIRE = new THREE.Color(0.62, 0.7, 0.74);
const TRAY = new THREE.Color(0.5, 0.7, 0.8), ICETRAY = new THREE.Color(0.2, 0.4, 0.5), DARKC = new THREE.Color(0.02, 0.03, 0.035), BLADE = new THREE.Color(0.2, 0.3, 0.34);
const ss = smoothstep;
// corners fall off: brightness by distance to the nearest edge of the box face a point lies on
function boxShade(x, y, z) {
  const d = [150 - Math.abs(x), Math.min(y, 420 - y), Math.min(-z, 240 + z)].sort((a, b) => a - b);
  return 0.46 + 0.54 * ss(0, 52, d[1]);
}
function xform(g, x, y, z, ry = 0, rx = 0, rz = 0) { if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; }
function mergeAll(parts) { const list = parts.map((g) => (g.index ? g.toNonIndexed() : g)); const m = mergeGeometries(list, false); for (const g of parts) g.dispose(); for (const g of list) g.dispose(); return m; }
// the same for a long list of parts, a few at a time
async function mergeMany(ctx, parts) {
  const list = [];
  for (let i = 0; i < parts.length; i++) { const g = parts[i]; list.push(g.index ? g.toNonIndexed() : g); if ((i & 7) === 7) await ctx.yield(); }
  await ctx.yield();
  const m = mergeGeometries(list, false); for (const g of parts) g.dispose(); for (const g of list) g.dispose(); return m;
}

// the cabinet (four enamel planes with runners and ribs), the two lamp housings, the fan grille, the crisper frames,
// the ice trays, the saucers: everything white, in one mesh. aMat as in the hero: 0 enamel, 1 metal, 3 frosted plastic, 4 plain
async function buildShell(ctx, L) {
  const parts = [], add = (g, c, m = 0, fn = null) => { parts.push(paint(g, c, m, fn)); return g; };
  const wall = (w, h, sw, sh) => new THREE.PlaneGeometry(w, h, sw, sh);
  add(xform(wall(240, 420, 16, 28), 150, 210, -120, -Math.PI / 2), WHITE, 0, boxShade);        // (the left wall is a frost plate, built with the back plate)
  add(xform(wall(300, 240, 20, 16), 0, 420, -120, 0, Math.PI / 2), WHITE, 0, boxShade);
  add(xform(wall(300, 240, 12, 10), 0, 0, -120, 0, -Math.PI / 2), LINER, 4, (x, y, z) => 0.6 * boxShade(x, y, z));
  await ctx.yield();
  // moulded shelf runners every 26 m, stouter where a shelf rests
  for (const sx of [-1, 1]) {
    for (let y = 28; y < 410; y += 26) {
      if (SHELF.some((t) => Math.abs(y - (t - 7)) < 12)) continue;
      add(rbox(sx * 147.7, y, -112, 4.6, 3.4, 218, 1.5, 1), WHITE, 0, (x, yy, z) => boxShade(x, yy, z) * (yy < y ? 0.62 : 1) * (sx < 0 ? 0.3 + 0.7 * ss(196, 336, yy) : 1));
    }
    for (const t of SHELF) add(rbox(sx * 146.2, t - 7.5, -94, 7.6, 6.4, 178, 2.2, 1), WHITE, 0, (x, yy, z) => boxShade(x, yy, z) * (yy < t - 8 ? 0.55 : 0.95) * (sx < 0 ? 0.3 + 0.7 * ss(196, 336, yy) : 1));
    await ctx.yield();
  }
  for (const z of [-30, -90, -150, -210]) add(rbox(0, 418.2, z, 292, 3.6, 6, 1.5, 1), WHITE, 0, (x, y, zz) => boxShade(x, 400, zz) * 0.9);
  // bulb housing: base, ribbed collar, wire cage
  const [bx, by, bz] = BULB;
  add(rbox(bx, 417.4, bz, 42, 5.2, 32, 2.2, 2), WHITE, 0);
  { const g = new THREE.CylinderGeometry(8.4, 11, 9.5, 28, 4, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.07 * Math.cos(a * 14); p.setXYZ(i, x * k, p.getY(i), z * k); }
    g.computeVertexNormals(); add(xform(g, bx, 410.4, bz), LINER, 0, (x, y) => 0.7 + 0.3 * ss(406, 415, y)); }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI, c = Math.cos(a) * 9.6, s = Math.sin(a) * 9.6;
    add(tube([[bx - c, 411, bz - s], [bx - c * 0.92, 402, bz - s * 0.92], [bx - c * 0.5, 396.6, bz - s * 0.5], [bx, 395.2, bz], [bx + c * 0.5, 396.6, bz + s * 0.5], [bx + c * 0.92, 402, bz + s * 0.92], [bx + c, 411, bz + s]], 0.42, 5), WIRE, 1);
  }
  await ctx.yield();
  // thermostat housing with its dial; the diode lens is a separate lamp
  add(rbox(0, 413.2, -60, 56, 13.6, 42, 3.4, 2), LINER, 0, (x, y) => 0.72 + 0.28 * ss(406, 418, y));
  { const g = new THREE.CylinderGeometry(8.2, 8.8, 3.4, 30, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 4) { const k = 1 + 0.045 * Math.cos(Math.atan2(z, x) * 15); p.setXYZ(i, x * k, p.getY(i), z * k); } }
    g.computeVertexNormals(); add(xform(g, -11, 404.9, -60), WHITE, 0, () => 0.9); }
  add(rbox(-11, 403, -56.5, 1.4, 1, 7, 0.4, 1), WIRE, 1);
  add(rbox(DIODE[0], 406, DIODE[2], 7, 1.4, 7, 0.6, 1), WIRE, 1);
  for (let i = 0; i < 5; i++) add(rbox(8 + i * 3.2, 405.9, -47, 1.3, 1, 9, 0.4, 1), LINER, 0, () => 0.6);       // vent slots
  await ctx.yield();
  // the fan's grille in the middle of the rosette
  const [fxx, fyy] = ROSE;
  add(xform(new THREE.CircleGeometry(13.4, 36), fxx, fyy, -0.35, Math.PI), DARKC, 4);
  add(xform(new THREE.TorusGeometry(13.8, 1.5, 8, 44), fxx, fyy, -1.9), WHITE, 0);
  add(xform(new THREE.TorusGeometry(16.4, 0.7, 6, 44), fxx, fyy, -0.5), WHITE, 0, () => 0.8);
  for (let k = -3; k <= 3; k++) { const yo = k * 3.55, hc = Math.sqrt(13.6 * 13.6 - yo * yo); add(rbox(fxx, fyy + yo, -3.1, 2 * hc, 1.15, 1.5, 0.5, 1), WHITE, 0); }
  add(rbox(fxx, fyy, -3.5, 1.7, 27, 1.1, 0.5, 1), WHITE, 0); add(xform(new THREE.CylinderGeometry(2.6, 2.6, 1.4, 16), fxx, fyy, -4, 0, Math.PI / 2), WIRE, 1);
  await ctx.yield();
  // crisper drawers: frames, handles, a pale back for the silhouettes to stand against
  for (const cx of [-75, 75]) {
    const dim = (x, y, z) => 0.55 + 0.45 * ss(0, 60, y);
    add(rbox(cx, 101.4, -176, 143, 6, 6.4, 2.2, 1), WHITE, 0, dim); add(rbox(cx, 5.6, -176, 143, 6, 6.4, 2.2, 1), WHITE, 0, dim);
    for (const sx of [-1, 1]) add(rbox(cx + sx * 69.6, 53.5, -176, 5.2, 92, 6.4, 2.2, 1), WHITE, 0, dim);
    add(rbox(cx, 88, -181, 76, 3.4, 3.2, 1.3, 2), TRAY, 3);
    for (const sx of [-1, 1]) add(rbox(cx + sx * 34, 88, -178.6, 3, 3, 4, 1, 1), TRAY, 3);
  }
  add(xform(wall(292, 100, 12, 6), 0, 54, -122, Math.PI), new THREE.Color(0.34, 0.47, 0.5), 4, (x, y) => 0.45 + 0.55 * ss(0, 100, y));
  add(rbox(0, 54, -150, 4.6, 100, 56, 1.6, 1), WHITE, 0, (x, y) => 0.5 + 0.4 * ss(0, 100, y));
  await ctx.yield();
  // ice trays: a stack of two, eight cells each
  const tray = (x, y, z, ry) => {
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), put = (g, sh = 1) => { g.applyMatrix4(m); add(g, ICETRAY, 3, () => sh); };
    put(rbox(0, 0.8, 0, 46, 1.6, 23, 0.6, 1), 0.8);
    for (const s of [-1, 1]) { put(rbox(0, 3.6, s * 11, 46, 7.2, 1.3, 0.55, 1)); put(rbox(s * 22.5, 3.6, 0, 1.3, 7.2, 23, 0.55, 1)); }
    put(rbox(0, 3.3, 0, 45, 6.4, 1.1, 0.5, 1), 0.9); for (let i = -1; i <= 1; i++) put(rbox(i * 11.2, 3.3, 0, 1.1, 6.4, 22, 0.5, 1), 0.9);
    put(rbox(-25.2, 6.4, 0, 4.4, 1.2, 9, 0.5, 1));
  };
  for (const t of L.trays) { tray(t[0], t[1], t[2], t[3]); await ctx.yield(); }
  // saucers under the jelly, the fruit bowl and the cake
  const saucer = (x, y, z, r) => add(xform(new THREE.LatheGeometry([[0.01, 0.9], [r * 0.82, 0.9], [r, 2.2], [r * 1.02, 2.0], [r * 0.86, 0], [0.01, 0]].map((q) => new THREE.Vector2(q[0], q[1])), 40), x, y, z), WHITE, 0, (xx, yy, zz) => 0.6 + 0.4 * ss(r * 0.6, r, Math.hypot(xx - x, zz - z)));
  for (const s of L.saucers) saucer(s[0], s[1], s[2], s[3]);
  // the clip that holds the length of gasket hanging on the cabinet's edge beside the way out (the length itself: buildStrap)
  add(rbox(-140.9, 177, -233, 1.4, 7, 5.5, 0.6, 1), new THREE.Color(0.5, 0.53, 0.55), 4);
  // the spoon left standing in the open jar
  if (L.spoon) { const [a, b] = L.spoon; add(rod(a, b, 0.95, 7), WIRE, 1); add(knob(b[0], b[1], b[2], 1.6), WIRE, 1); const g = new THREE.SphereGeometry(3.4, 12, 8); g.scale(1, 1.5, 0.35); add(xform(g, a[0], a[1] - 2, a[2]), WIRE, 1); }
  return mergeMany(ctx, parts);
}
// The length of gasket that has come away from the door and hangs curled on the cabinet's edge, beside the way out: a strip of the
// bellows swept down the line the plain strap used to follow (the same nine points, with that strap's shear worked in), 5.4 m
// wide (the door's gasket is 12.8: this is one lip of it, torn free), four folds on its face (0.55 m deep) over a flat back.
// The frame is carried down the line without twist, so the folded face looks out from the post all the way round the curl.
function buildStrap() {
  const line = [[-140.5, 176, -233], [-140.3, 160, -233.5], [-139.6, 146, -234.5], [-138, 134, -236.5], [-136.4, 126, -239.5], [-136.2, 120, -243], [-137.6, 117, -246], [-139.6, 118.5, -246.5], [-140, 122.5, -244.5]];
  const curve = new THREE.CatmullRomCurve3(line.map((q) => new THREE.Vector3(q[0], q[1], q[2] + (q[0] + 139) * 0.9)), false, 'catmullrom', 0.5);
  const RINGS = 48, FOLDS = 4, K = FOLDS * 6, HALF = 2.7, sec = [];           // 48 rings: one every 1.5 m of its 70 m; 6 points to a fold
  for (let j = 0; j <= K; j++) sec.push([(j / K) * 2 - 1, 0.3 + 0.55 * (0.5 - 0.5 * Math.cos((j / K) * FOLDS * TAU)), 1]);
  sec.push([1, -0.4, 0], [-1, -0.4, 0]);
  const m = sec.length, pos = [], aS = [], aW = [], aNn = [], idx = [];
  const T = new THREE.Vector3(), T0 = new THREE.Vector3(), W = new THREE.Vector3(0, 0, 1), Nn = new THREE.Vector3(), C = new THREE.Vector3(), q = new THREE.Quaternion();
  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS; curve.getPointAt(t, C); curve.getTangentAt(t, T);
    if (i > 0) W.applyQuaternion(q.setFromUnitVectors(T0, T));
    W.addScaledVector(T, -W.dot(T)).normalize(); Nn.crossVectors(W, T).normalize(); T0.copy(T);
    const taper = 1 - 0.45 * smoothstep(0.9, 1, t);                              // the torn end narrows
    for (const S of sec) {
      pos.push(C.x + W.x * S[0] * HALF * taper + Nn.x * S[1], C.y + W.y * S[0] * HALF * taper + Nn.y * S[1], C.z + W.z * S[0] * HALF * taper + Nn.z * S[1]);
      aS.push(t, S[0], S[2]); aW.push(W.x, W.y, W.z); aNn.push(Nn.x, Nn.y, Nn.z);
    }
  }
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b = (i + 1) * m + j, a2 = i * m + (j + 1) % m, b2 = (i + 1) * m + (j + 1) % m; idx.push(a, b, a2, b, b2, a2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 3)); g.setAttribute('aNn', new THREE.Float32BufferAttribute(aNn, 3));
  g.setIndex(idx); g.computeBoundingSphere(); g.boundingSphere.radius += 2;
  return g;
}
function buildFan() {
  const parts = [];
  // five pitched paddles: broad toward the tip, twisted and cambered, pale on the leading edge and dark on the trailing one
  for (let i = 0; i < 5; i++) {
    const g = new THREE.PlaneGeometry(1, 1, 6, 4), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const s = p.getX(k) + 0.5, v = p.getY(k), r = 2.2 + s * 10, w = 2.4 + 4.2 * Math.sin(Math.PI * clamp(s * 0.8 + 0.12, 0, 1)), a = 0.8 - 0.4 * s;
      p.setXYZ(k, r + 0.9 * v * s, v * w * Math.cos(a), -v * w * Math.sin(a) + 0.7 * (1 - 4 * v * v) * s);
    }
    g.computeVertexNormals();
    paint(g, BLADE, 1, (x, y) => (0.4 + 0.95 * ss(-2.6, 2.6, y)) * (0.7 + 0.45 * ss(2, 12, x)));
    g.rotateZ((i / 5) * TAU); parts.push(g);
  }
  { const g = new THREE.CylinderGeometry(2.4, 2.4, 1.6, 14); g.rotateX(Math.PI / 2); parts.push(paint(g, BLADE, 1)); }
  return mergeAll(parts);
}

// ---------------------------------------------------------------- leaves, fruit, cake, flies (one vertex-coloured mesh)
const _c = new THREE.Color();
function vegPaint(g0, colorFn, sway = 0, phase = 0) {
  const g = g0.index ? g0.toNonIndexed() : g0; if (g !== g0) g0.dispose();
  const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), sw = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); colorFn(x, y, z, _c);
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    sw[i * 2] = typeof sway === 'function' ? sway(x, y, z) : sway; sw[i * 2 + 1] = phase + (x + z) * 0.07;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSw', new THREE.BufferAttribute(sw, 2));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
async function buildVeg(ctx, L, rng, noise) {
  const parts = [], put = async (g, x, y, z, ry = 0, rx = 0, rz = 0) => { parts.push(xform(g, x, y, z, ry, rx, rz)); await ctx.yield(); };   // each piece set down, the page gets a breath
  const fruit = (r, a, b, sx = 1, sy = 1) => {
    const g = new THREE.SphereGeometry(r, 16, 11); g.scale(sx, sy, 1); const s = rng() * 9;
    return vegPaint(g, (x, y, z, c) => { const t = clamp(0.5 + 0.5 * y / r + 0.35 * noise.n3(x * 0.12 + s, y * 0.12, z * 0.12), 0, 1); c.setRGB(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); });
  };
  const leaf = (w, h, a, b, sway, ph) => {
    const g = new THREE.PlaneGeometry(w, h, 2, 4), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) + h / 2, t = y / h; p.setXYZ(i, x * Math.sin(Math.PI * clamp(t * 0.94 + 0.06, 0, 1)) * 1.25, y, 0.09 * y * y / h * 4 - Math.abs(x) * 0.25); }
    g.computeVertexNormals();
    return vegPaint(g, (x, y, z, c) => { const t = y / h; c.setRGB(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); }, (x, y) => sway * (y / h) * (y / h), ph);
  };
  // a mint leaf: creased along its midrib, cupped, arching back, toothed, with veins a shade darker; light comes through it
  const mintLeaf = (w, h, sway, ph) => {
    const g = new THREE.PlaneGeometry(1, 1, 8, 16), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) * 2, t = p.getY(i) + 0.5;
      const wid = Math.pow(Math.sin(Math.PI * clamp(t * 0.9 + 0.07, 0, 1)), 0.75) * (1 + 0.05 * Math.sin(t * 44));
      const x = u * wid * w * 0.5;
      p.setXYZ(i, x, t * h, -0.24 * Math.abs(x) + 0.07 * u * u * w + 0.2 * t * t * h + 0.025 * w * Math.sin(t * 9 + u * 3));
    }
    g.computeVertexNormals();
    return vegPaint(g, (x, y, z, c) => {
      const t = y / h, u = Math.abs(x) / (w * 0.5 + 1e-6);
      const vein = Math.max(1 - ss(0.0, 0.1, u), 0.7 * ss(0.7, 0.95, Math.sin((t * 4.5 - u * 1.3) * TAU) * 0.5 + 0.5) * ss(0.05, 0.2, u));
      const k = (1 - 0.42 * vein) * (0.82 + 0.3 * u);
      c.setRGB(lerp(0.09, 0.27, t) * k, lerp(0.36, 0.76, t) * k, lerp(0.15, 0.31, t) * k);
    }, (x, y) => sway * (y / h) * (y / h), ph);
  };
  const lettuce = (r, seed) => {
    const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, nr = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.3 * noise.fbm3(x * 1.5 + seed, y * 1.5, z * 1.5, 3) + 0.09 * noise.n3(x * 4.2, y * 4.2 + seed, z * 4.2);
      p.setXYZ(i, x * k * r, y * k * r * 0.82, z * k * r); nr.setXYZ(i, x, y, z);
    }
    return vegPaint(g, (x, y, z, c) => { const t = clamp(y / (r * 0.82) * 0.5 + 0.5, 0, 1), n = noise.n3(x * 0.16 + seed, y * 0.16, z * 0.16) * 0.5 + 0.5; c.setRGB(lerp(0.13, 0.5, t * n), lerp(0.33, 0.74, t), lerp(0.08, 0.22, n)); }, 0.22, seed);
  };
  // left crisper: three lettuces like green cumulus, lemons and plums up against the glass
  await put(lettuce(20, 1.3), -110, 24, -150); await put(lettuce(21.5, 4.1), -66, 26, -145); await put(lettuce(19, 7.7), -27, 23, -151);
  await put(fruit(8.5, [0.75, 0.55, 0.08], [1.0, 0.86, 0.22], 1.28), -126, 13, -166, 0.3); await put(fruit(8, [0.7, 0.5, 0.08], [1.0, 0.84, 0.2], 1.28), -90, 12.5, -167, -0.5);
  await put(fruit(7.5, [0.2, 0.06, 0.2], [0.5, 0.2, 0.42]), -48, 12, -167); await put(fruit(7, [0.22, 0.07, 0.22], [0.52, 0.22, 0.4]), -36, 11.5, -164); await put(fruit(7.2, [0.2, 0.06, 0.2], [0.48, 0.2, 0.4]), -41, 23, -165);
  // right crisper: a sheaf of leeks, tomatoes on the vine, a halved lime, a bunch of mint and parsley
  for (let i = 0; i < 5; i++) {
    const g = new THREE.CylinderGeometry(3.1, 3.8, 84, 10, 6);
    await put(vegPaint(g, (x, y, z, c) => { const t = ss(-20, 30, y); c.setRGB(lerp(0.78, 0.2, t), lerp(0.8, 0.5, t), lerp(0.66, 0.14, t)); }), 62 + rng.range(-3, 3), 9 + (i % 2) * 6.5 + (i > 3 ? 6 : 0), -146 - i * 3.2 + (i % 2) * 4, 0, 0, Math.PI / 2 + rng.range(-0.05, 0.05));
    for (let k = 0; k < 2; k++) await put(leaf(7, 30, [0.16, 0.44, 0.12], [0.3, 0.62, 0.2], 0.5, i + k), 104 + rng.range(-2, 2), 9 + (i % 2) * 6.5, -146 - i * 3.2, rng.range(-0.4, 0.4), 0, -Math.PI / 2 + rng.range(-0.35, 0.5));
  }
  for (let i = 0; i < 4; i++) await put(fruit(7.6, [0.6, 0.06, 0.04], [0.95, 0.2, 0.1], 1, 0.9), 22 + i * 14.5, 11.6 + (i % 2) * 1.2, -167 + (i % 2) * 2.5);
  await put(vegPaint(tube([[14, 20, -167], [30, 21.5, -166], [48, 20.5, -167], [70, 21, -166]], 0.8, 5), (x, y, z, c) => c.setRGB(0.2, 0.42, 0.12)), 0, 0, 0);
  { const g = new THREE.SphereGeometry(9, 18, 9, 0, TAU, 0, Math.PI / 2);
    await put(vegPaint(g, (x, y, z, c) => c.setRGB(0.3, 0.6, 0.12)), 104, 14, -161, 0, Math.PI / 2 + 0.25);
    const d = new THREE.CircleGeometry(8.8, 24);
    await put(vegPaint(d, (x, y, z, c) => { const r = Math.hypot(x, y) / 8.8, a = Math.atan2(y, x), seg = Math.abs(Math.cos(a * 4.5)); const k = r > 0.86 ? 0.5 : seg < 0.12 || r < 0.1 ? 1.0 : 0.72; c.setRGB(0.62 * k + 0.2, 0.86 * k + 0.1, 0.34 * k + 0.08); }), 104, 14, -161.2, Math.PI, -0.25); }
  for (let i = 0; i < 46; i++) {
    const a = rng() * TAU, r = rng.range(0, 11), h = rng.range(0, 34), big = rng() < 0.5;
    await put(leaf(big ? 7.5 : 5, big ? 10 : 7.5, [0.1, 0.36, 0.14], big ? [0.26, 0.66, 0.3] : [0.34, 0.7, 0.2], rng.range(0.4, 1.1), i), 126 + Math.cos(a) * r, 34 + h, -160 + Math.sin(a) * r * 0.6, a, rng.range(-0.9, 0.4), rng.range(-0.5, 0.5));
  }
  for (let i = 0; i < 7; i++) await put(vegPaint(rod([124 + i * 0.8, 6, -160], [122 + i * 1.6 + rng.range(-3, 3), 44 + rng.range(0, 14), -160 + rng.range(-4, 4)], 0.55, 5), (x, y, z, c) => c.setRGB(0.18, 0.4, 0.14), (x, y) => 0.3 * ss(6, 50, y), i), 0, 0, 0);
  // the bowl of twelve peaches and plums on the middle terrace
  const [bx, by, bz] = L.bowl; L.fruitTops = [];
  for (let i = 0; i < 12; i++) {
    const ring = i < 7 ? 0 : i < 11 ? 1 : 2, n = [7, 4, 1][ring], k = i - [0, 7, 11][ring], a = (k / n) * TAU + ring * 0.6, rr = [10.2, 5.4, 0][ring], r = rng.range(5.2, 6.2);
    const plum = rng() < 0.35, x = bx + Math.cos(a) * rr, y = by + 6.5 + ring * 6.6, z = bz + Math.sin(a) * rr;
    await put(plum ? fruit(r * 0.9, [0.2, 0.06, 0.22], [0.5, 0.22, 0.46], 1, 1.08) : fruit(r, [0.86, 0.3, 0.12], [1.0, 0.68, 0.34], 1, 0.94), x, y, z, rng() * TAU, rng.range(-0.3, 0.3));
    L.fruitTops.push([x, y + r * 0.95, z]);
  }
  // the bowl of cherries on the bottom terrace, by the slot: a heap of dark red fruit, each with its point of light and its stalk
  if (L.cherries) {
    const [cx, cy, cz] = L.cherries, CR = makeRng(hashSeed('lco-cherries'));
    const cherry = (r) => {
      const g = new THREE.SphereGeometry(r, 14, 10), s = CR() * 9;
      return vegPaint(g, (x, y, z, c) => {
        const up = y / r, n = 0.5 + 0.5 * noise.n3(x * 0.2 + s, y * 0.2, z * 0.2), hl = ss(0.9, 0.985, (x * 0.42 + y * 0.8 - z * 0.42) / r);
        const k = lerp(0.42, 1, ss(-0.8, 0.7, up)) * (0.8 + 0.3 * n);
        c.setRGB(lerp(0.38 * k, 1.5, hl), lerp(0.006 * k, 1.3, hl) + 0.008 * n * k, lerp(0.03 * k, 1.3, hl));
      });
    };
    const rings = [[9, 12.2, 0], [6, 6.4, 5.6], [3, 2.6, 10.6]];
    for (const [n, rad, up] of rings) for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + up * 0.4 + CR.range(-0.12, 0.12), r = CR.range(4.5, 5.3), x = cx + Math.cos(a) * rad, y = cy + 6.2 + up + CR.range(-0.4, 0.4), z = cz + Math.sin(a) * rad;
      await put(cherry(r), x, y, z, CR() * TAU, CR.range(-0.4, 0.4));
      if (CR() < 0.7) {
        const lean = CR() * TAU, hgt = CR.range(8, 11.5), ex = Math.cos(lean) * hgt * 0.45, ez = Math.sin(lean) * hgt * 0.45;
        await put(vegPaint(tube([[x, y + r * 0.86, z], [x + ex * 0.3, y + r + hgt * 0.5, z + ez * 0.3], [x + ex, y + r + hgt, z + ez]], 0.34, 5), (xx, yy, zz, c) => c.setRGB(0.2, 0.26, 0.07), (xx, yy) => 0.25 * ss(y + r, y + r + hgt, yy), i), 0, 0, 0);
      }
    }
  }
  // party: a cake under the cloche
  if (L.cake) {
    const [cx, cy, cz] = L.cake;
    await put(vegPaint(new THREE.CylinderGeometry(11.5, 12, 9, 32, 2), (x, y, z, c) => { const band = Math.abs(y) < 0.9; c.setRGB(band ? 0.7 : 0.93, band ? 0.2 : 0.86, band ? 0.26 : 0.76); }), cx, cy + 7, cz);
    await put(vegPaint(new THREE.TorusGeometry(10, 1.5, 8, 30), (x, y, z, c) => c.setRGB(0.98, 0.93, 0.86)), cx, cy + 11.6, cz, 0, Math.PI / 2);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; await put(fruit(1.9, [0.5, 0.02, 0.06], [0.9, 0.1, 0.16]), cx + Math.cos(a) * 10, cy + 13.4, cz + Math.sin(a) * 10); }
  }
  // the sprig of mint standing in the tumbler
  if (L.mint) {
    const [mx, my, mz, mh] = L.mint;
    const stem = [[mx - 2, my + 3, mz], [mx, my + mh * 0.6, mz + 1], [mx + 3, my + mh + 8, mz - 1], [mx + 5, my + mh + 17, mz - 2]];
    await put(vegPaint(tube(stem, 0.7, 6), (x, y, z, c) => c.setRGB(0.2, 0.46, 0.2), (x, y) => 0.5 * ss(my + mh * 0.8, my + mh + 16, y), 2), 0, 0, 0);
    // leaves in opposite pairs, each pair turned a quarter from the last, smaller toward the tip; a bud of four at the top
    for (let n = 0; n < 4; n++) {
      const t = n / 3, y = my + mh * 0.8 + 16.5 * t, x = mx + 1.2 + 3.6 * t, z = mz - 0.4 - 1.5 * t;
      for (const side of [0, 1]) await put(mintLeaf(9.5 - 3.6 * t, 14 - 5 * t, 0.3 + 0.35 * t, n * 2 + side), x, y, z, n * 1.45 + side * Math.PI + 0.5, 0.95 - 0.3 * t);
    }
    for (let i = 0; i < 4; i++) await put(mintLeaf(3.4, 5.4, 0.7, 9 + i), mx + 5, my + mh + 16.5, mz - 2, i * 1.571 + 0.3, 0.42);
  }
  return mergeMany(ctx, parts);
}
// a fruit fly, 3 m long, flying toward +z: a tapered, banded amber abdomen, a humped thorax, a wide head with two
// big red eyes, six jointed legs; and (a second mesh) the blur of its wings, three pale petals a side
function buildFly() {
  const parts = [], amber = [0.62, 0.4, 0.13];
  const ball = (r, x, y, z, sx, sy, sz, fn, shape = null) => {
    const g = new THREE.SphereGeometry(r, 18, 12);
    if (shape) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const q = shape(p.getX(i) / r, p.getY(i) / r, p.getZ(i) / r); p.setXYZ(i, q[0] * r, q[1] * r, q[2] * r); } }
    g.scale(sx, sy, sz); if (shape) g.computeVertexNormals();
    parts.push(xform(vegPaint(g, fn), x, y, z));
  };
  // abdomen: tapering to the tail and drooping a little, dark bands across the back, a pale belly
  ball(0.64, 0, -0.02, -0.72, 1, 0.94, 1.7, (x, y, z, c) => {
    const band = Math.sin(z * 8.2 + 0.6) > 0.15 && y > -0.2 ? 0.3 : 1, tip = ss(-0.5, -1.05, z), belly = ss(0.1, -0.5, y);
    c.setRGB(lerp(amber[0] * band, 0.16, tip) + 0.22 * belly, lerp(amber[1] * band, 0.09, tip) + 0.2 * belly, lerp(amber[2] * band, 0.04, tip) + 0.1 * belly);
  }, (x, y, z) => { const k = 1 - 0.42 * ss(0.1, -1, z); return [x * k, y * k - 0.16 * ss(0, -1, z), z]; });
  // thorax: humped, tan with two darker stripes down the back
  ball(0.6, 0, 0.14, 0.34, 1.02, 1.06, 1.12, (x, y, z, c) => { const st = y > 0.3 && Math.abs(Math.abs(x) - 0.2) < 0.07 ? 0.6 : 1; c.setRGB(0.5 * st, 0.31 * st, 0.12 * st); });
  // head, and the eyes that are most of it
  ball(0.4, 0, 0.1, 1.06, 1.18, 1, 0.86, (x, y, z, c) => c.setRGB(0.46, 0.3, 0.12));
  for (const s of [-1, 1]) {
    ball(0.33, s * 0.36, 0.17, 1.13, 0.86, 1.16, 1.02, (x, y, z, c) => { const k = 0.75 + 0.5 * ss(-0.1, 0.5, y); c.setRGB(1.25 * k, 0.07 * k, 0.03 * k); });
    parts.push(xform(vegPaint(knob(0, 0, 0, 0.085), (x, y, z, c) => c.setRGB(0.3, 0.2, 0.08)), s * 0.12, 0.2, 1.44));
    for (let i = 0; i < 3; i++) {
      const base = [s * 0.34, -0.22, 0.74 - i * 0.4], knee = [s * (0.98 + 0.05 * i), -0.5, 1.08 - i * 0.66], foot = [s * (1.14 + 0.1 * i), -1.22, 1.3 - i * 0.9];
      const dark = (x, y, z, c) => c.setRGB(0.16, 0.1, 0.045);
      parts.push(vegPaint(rod(base, knee, 0.08, 5), dark), vegPaint(rod(knee, foot, 0.055, 5), dark), vegPaint(knob(knee[0], knee[1], knee[2], 0.09), dark));
    }
  }
  parts.push(vegPaint(rod([0, -0.08, 1.3], [0, -0.52, 1.44], 0.075, 5), (x, y, z, c) => c.setRGB(0.3, 0.2, 0.08)));
  const body = mergeAll(parts), wparts = [];
  // the wings beat too fast to see: each is three petals fanned through its stroke. colour = (edge 0..1, which petal, 0)
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const g = new THREE.PlaneGeometry(1, 1, 7, 2), p = g.attributes.position, col = new Float32Array(p.count * 3), L = 3.5, W = 1.45, e = s * [0.86, 0.28, -0.3][k];
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = p.getY(i), sh = Math.pow(Math.sin(Math.PI * (u * 0.9 + 0.05)), 0.7);
      const X = s * u * L, Z = v * W * sh - 0.42 * u * L;
      p.setXYZ(i, X * Math.cos(e) + s * 0.3, X * Math.sin(e) + 0.52, Z + 0.42);
      col[i * 3] = Math.max(Math.abs(v) * 2, u > 0.93 ? 1 : 0) * ss(0.02, 0.2, u); col[i * 3 + 1] = k / 3 + (s > 0 ? 0 : 0.5); col[i * 3 + 2] = 0;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
    wparts.push(g);
  }
  return { body, wings: mergeAll(wparts) };
}
// a cluster of three frost spikes in unit space (the main one along +y), each face tagged for its own glint
// [tilt from the axis, bearing round it, length, half width at the root]
const SPIKES = [[0, 0, 1, 0.062], [0.5, 0.7, 0.62, 0.052], [0.62, 3.6, 0.48, 0.046]];
const SPIKE_TIP = SPIKES.map((q) => `vec3(${(Math.sin(q[0]) * Math.cos(q[1]) * q[2]).toFixed(4)}, ${(Math.cos(q[0]) * q[2]).toFixed(4)}, ${(Math.sin(q[0]) * Math.sin(q[1]) * q[2]).toFixed(4)})`);
function needleGeometry() {
  const pos = [], face = [], A = new THREE.Vector3(), T1 = new THREE.Vector3(), T2 = new THREE.Vector3();
  const spike = (tilt, az, len, rad, f0) => {
    A.set(Math.sin(tilt) * Math.cos(az), Math.cos(tilt), Math.sin(tilt) * Math.sin(az));
    T1.set(0.3, 0.1, 0.9).cross(A).normalize(); T2.copy(A).cross(T1);
    const b = []; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.6; b.push([T1.x * Math.cos(a) * rad + T2.x * Math.sin(a) * rad, T1.y * Math.cos(a) * rad + T2.y * Math.sin(a) * rad, T1.z * Math.cos(a) * rad + T2.z * Math.sin(a) * rad]); }
    for (let i = 0; i < 4; i++) { pos.push(...b[i], ...b[(i + 1) % 4], A.x * len, A.y * len, A.z * len); face.push(f0 + i, f0 + i, f0 + i); }
  };
  for (let k = 0; k < 3; k++) spike(SPIKES[k][0], SPIKES[k][1], SPIKES[k][2], SPIKES[k][3], k * 4);
  // the shadow each spike throws: one flat triangle, laid on the surface the cluster stands on by the needles' vertex shader
  // (M.needle). position = (side -1 | +1 at the root, 0 at the tip; 0 root | 1 tip; 0); aFace 12, 13, 14 = which spike
  for (let k = 0; k < 3; k++) { pos.push(1, 0, 0, -1, 0, 0, 0, 1, 0); face.push(12 + k, 12 + k, 12 + k); }
  return { pos, face };
}

// ---------------------------------------------------------------- the cast of glass on the three terraces
const LIQ = { milk: [0.86, 0.9, 0.9, 1], lime: [0.62, 0.86, 0.3, 0.15], soda: [0.2, 0.78, 0.92, 0], amber: [1.0, 0.62, 0.16, 0.08], marmalade: [1.0, 0.5, 0.08, 0.2],
  honey: [1.0, 0.68, 0.1, 0.12], ruby: [0.8, 0.09, 0.15, 0.06], water: [0.42, 0.8, 0.92, 0], brine: [0.5, 0.84, 0.62, 0.06],
  cobalt: [0.1, 0.34, 0.96, 0], magenta: [0.92, 0.13, 0.5, 0.04], olive: [0.56, 0.64, 0.12, 0.08], claret: [0.95, 0.1, 0.17, 0.03], lemon: [1.0, 0.9, 0.42, 0.06] };
// THE STREET OF GLASS. The dive runs down the middle of the canyon and looks along the fronts of the two lower shelves toward the
// slot, so each of them carries a rank of lit, coloured glass on its lip and a second rank behind it, set down by hand:
// [x, z, profile, R, H, liquid, fill, lit, fizz]. Three of them are the subjects of the dive: the tall claret bottle beside the
// jelly and a shorter ruby one before it, whole in the frame at 0.70 (seen 0.66-0.74), the jar of preserved lemons on the bottom shelf (0.76-0.83) and, in the kitchen's light at the
// latch end, the bowl of cherries (CHERRY_XZ, 0.80-0.88).
const STREET = [
  [[62, -168, 'soda', 9, 72, 'cobalt', 0.74, 1.3, 1], [34, -169, 'swing', 9, 62, 'ruby', 0.74, 1.15, 0], [-32, -167, 'swing', 10.5, 88, 'claret', 0.72, 1.35, 0],
    [-96, -168, 'swing', 9, 72, 'magenta', 0.7, 1.4, 0], [-120, -167, 'soda', 9, 76, 'cobalt', 0.76, 1.5, 1],
    [46, -138, 'carafe', 12, 62, 'amber', 0.6, 1.2, 0], [18, -125, 'soda', 9.5, 78, 'magenta', 0.72, 1.2, 1], [-10, -124, 'swing', 10, 82, 'amber', 0.66, 1.3, 0],
    [-46, -134, 'carafe', 13, 60, 'olive', 0.62, 1.3, 0], [-88, -132, 'soda', 9.5, 74, 'cobalt', 0.74, 1.2, 1], [-112, -140, 'jam', 14, 38, 'ruby', 0.78, 1.5, 0], [-128, -117, 'swing', 9.5, 80, 'lime', 0.66, 1.2, 0]],
  [[44, -168, 'swing', 9.5, 72, 'amber', 0.7, 1.3, 0], [20, -169, 'soda', 9, 80, 'cobalt', 0.76, 1.5, 1], [-4, -167, 'pickle', 12, 56, 'lime', 0.82, 1.3, 0],
    [-52, -163, 'pickle', 17, 84, 'lemon', 0.9, 1.25, 5], [-84, -168, 'swing', 9.5, 76, 'magenta', 0.7, 1.5, 0],
    [58, -140, 'milk', 11.5, 62, 'milk', 0.6, 0.9, 0], [30, -138, 'carafe', 13.5, 62, 'olive', 0.6, 1.3, 0], [-20, -136, 'swing', 10, 84, 'claret', 0.7, 1.6, 0],
    [-74, -132, 'soda', 9.5, 78, 'cobalt', 0.76, 1.5, 1], [-102, -138, 'honey', 13, 36, 'honey', 0.78, 1.5, 0], [-129, -128, 'swing', 9, 70, 'amber', 0.66, 1.5, 0]],
];
const CHERRY_XZ = [-119, -161];
const CAPS = [[0.7, 0.76, 0.78], [0.82, 0.62, 0.3], [0.55, 0.68, 0.78], [0.3, 0.72, 0.56], [0.8, 0.82, 0.8]];
// the frame to remember (u 0.27-0.35) is seen from under the ceiling in the back left corner, down the diagonal: the door a
// wall across the far end, the terrace a city of small glass below. Jars placed by hand; every one is cut to the height the
// held beat allows where it stands (see maxH in layoutJars). [x, z, kind, { R, H, liq, ... }]
const EYES_U = [0.27, 0.29, 0.31, 0.33, 0.35], FOV = 70;
const RANKS = [
  [-31, -169, 'soda', { R: 6.5, H: 72, fill: 0.72, lit: 0.95 }], [-30, -151, 'pickle', { R: 8, H: 52, liq: 'lime', fill: 0.8 }], [-3, -116, 'soda', { R: 8, H: 66, fill: 0.72 }],
  // left of the lane, by the slot, standing in the bar of kitchen light: an amber carafe, the one ruby bottle, a lime
  [-122, -142, 'carafe', { R: 9, H: 64, liq: 'amber', fill: 0.6 }], [-129, -166, 'swing', { profile: 'sauce', R: 8.5, H: 58, liq: 'ruby', fill: 0.7 }], [-110, -167, 'swing', { R: 6.5, H: 60, liq: 'lime', fill: 0.66 }],
  // in the corner past the ice trays, against the hinge-side wall: colour where the avenue looks, the skyline under the bulb
  [131, -126, 'swing', { R: 8.5, H: 72, liq: 'amber', fill: 0.68 }],
  // on the lip beyond the ice trays, inside the hairpin: one tall amber bottle, lit from behind, where the hinge-side wall would stand dark
  [112.5, -168.5, 'swing', { R: 6.3, H: 60, liq: 'amber', fill: 0.7, lit: 1 }],
  [112, -100, 'soda', { R: 9.5, H: 80, fill: 0.7 }], [128, -76, 'carafe', { R: 13, H: 76, liq: 'amber', fill: 0.55 }], [96, -68, 'swing', { R: 9.5, H: 84, liq: 'lime', fill: 0.62 }],
];
// the lane: a strip of bare glass from the corner toward the door, [x, z, dx, dz, half width, widening per metre]. Nothing stands
// on it, so the eye runs down it to the door and, through the glass, down the door's lower racks
const LANE = [-98, -72, 0.2756, -0.9613, 22, 0.08];
// the two rows of the avenue: [u, side (+1 = right of travel), clearance, kind, liquid]
const ROWS = [
  [0.352, -1, 15, 'swing', 'lime'], [0.352, 1, 17, 'honey', 'honey'], [0.374, -1, 14, 'jam', 'marmalade'], [0.374, 1, 15, 'soda', 'soda'],
  [0.396, -1, 14, 'soda', 'soda'], [0.396, 1, 15, 'carafe', 'amber'], [0.418, -1, 15, 'pickle', 'brine'], [0.418, 1, 14, 'swing', 'lime'], [0.436, 1, 16, 'milk', 'milk'],
];
const HERO_XZ = [-6, -164.5], MINT_XZ = [18, -165], SODA_XZ = [42, -167];   // along the lip, left of the avenue: the hero jar, the tall soda of the close pass, the mint
const TYPES = [
  { p: 'milk', R: [10, 13], H: [52, 78], fill: [0.45, 0.75], liq: ['milk'], fizz: 0, w: 3 },
  { p: 'swing', R: [9, 11], H: [66, 85], fill: [0.5, 0.7], liq: ['lime', 'amber'], fizz: 0, w: 2 },
  { p: 'soda', R: [9, 10.5], H: [64, 82], fill: [0.6, 0.8], liq: ['soda'], fizz: 1, w: 3 },
  { p: 'pickle', R: [11, 14], H: [55, 80], fill: [0.7, 0.85], liq: ['brine', 'lime'], fizz: 0, w: 2 },
  { p: 'carafe', R: [13, 15.5], H: [55, 78], fill: [0.4, 0.65], liq: ['milk', 'lime', 'amber'], fizz: 0, w: 2 },
  { p: 'jam', R: [13, 16.5], H: [30, 42], fill: [0.6, 0.8], liq: ['amber', 'marmalade'], fizz: 0, w: 2, low: 1 },
  { p: 'honey', R: [12, 15], H: [30, 38], fill: [0.6, 0.8], liq: ['honey'], fizz: 0, w: 1.5, low: 1 },
  { p: 'tumbler', R: [10, 12], H: [30, 36], fill: [0.3, 0.6], liq: ['water'], fizz: 0, w: 1, low: 1 },
];
async function layoutJars(ctx, rng, path, look) {
  const jars = [], L = { trays: [[78, 320, -167.5, 0], [80, 327.3, -167, 0.1]], saucers: [], spoon: null, mint: null, cake: null };
  // the camera corridor over the top terrace, sampled once
  const cor = []; for (let i = 0; i <= 300; i++) { const p = path.pointAt((i / 300) * uOf(0.66)); cor.push(p.x, p.z); }
  const pathClear = (x, z) => { let b = 1e9; for (let i = 0; i < cor.length; i += 2) { const dx = cor[i] - x, dz = cor[i + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  const axisClear = (x, z) => { const s = clamp((x - 75) * ENTRY[0] + (z + 140) * ENTRY[2], 0, 215); return Math.hypot(x - 75 - ENTRY[0] * s, z + 140 - ENTRY[2] * s); };
  const axisS = (x, z) => clamp((x - 75) * ENTRY[0] + (z + 140) * ENTRY[2], 0, 215);
  const type = (name) => TYPES.find((t) => t.p === name);
  const make = (t, x, y, z, o = {}) => {
    const R = o.R ?? rng.range(t.R[0], t.R[1]), H = o.H ?? rng.range(t.H[0], t.H[1]);
    return { profile: o.profile || t.p, x, y, z, R, H, fill: o.fill ?? rng.range(t.fill[0], t.fill[1]), liq: LIQ[o.liq || rng.pick(t.liq)], cap: rng.pick(CAPS), fizz: o.fizz ?? t.fizz, phase: rng(), lit: o.lit ?? rng.range(0.8, 1), shelf: y };
  };
  const free = (j, list, gap = 2.5) => list.every((k) => k.shelf !== j.shelf || Math.hypot(k.x - j.x, k.z - j.z) > k.R + j.R + gap);
  const onShelf = (j) => Math.abs(j.x) < 139 - j.R && j.z > -177 + j.R && j.z < -13 - j.R;
  const keep = [];                                       // discs kept free on a shelf: [shelfY, x, z, r]
  const offKeep = (j) => keep.every((k) => k[0] !== j.shelf || Math.hypot(k[1] - j.x, k[2] - j.z) > k[3] + j.R);
  // the held beat looks down on the terrace from five places on the route. A jar may stand no taller than a quarter of
  // that frame from any of them, and no taller than lets the door's top rack show over it
  const eyes = EYES_U.map((u) => path.pointAt(u)), top0 = SHELF[0];
  const maxH = (x, z, share) => {
    let h = 90;
    for (const e of eyes) {
      if (z > e.z + 12) continue;                                              // behind the eye
      const D = Math.hypot(x - e.x, z - e.z), up = e.y - top0;
      h = Math.min(h, up - D * Math.tan(Math.atan2(up, D) - share * FOV * Math.PI / 180));
      const k = (e.z + 250) / Math.max(e.z - z, 1);
      if (Math.abs(e.x + (x - e.x) * k) < 150) h = Math.min(h, (350 - e.y) / k + up);
    }
    return h;
  };
  // nothing on the lane, and nothing within 55 m of where the eye stands for most of the beat (a jar that near is a lid filling the frame)
  const offLane = (j) => {
    const rx = j.x - LANE[0], rz = j.z - LANE[1], t = rx * LANE[2] + rz * LANE[3];
    if (t > -24 && Math.abs(rx * LANE[3] - rz * LANE[2]) < LANE[4] + LANE[5] * Math.max(t, 0) + j.R) return false;
    for (let i = 0; i < 4; i++) if (Math.hypot(j.x - eyes[i].x, j.z - eyes[i].z) < 50 + j.R) return false;
    return true;
  };
  // cut a jar to the height its place allows; a bottle cut by much is drawn slimmer, so it stays a bottle
  const fit = (j, share = 0.29) => { const h = maxH(j.x, j.z, share) * (0.88 + 0.12 * j.phase); if (j.H > h) { const k = Math.max(h, 22) / j.H; j.H *= k; if (k < 0.85 && j.R > 7) j.R = Math.max(j.R * Math.pow(k, 0.7), 6.5); } return j; };
  const push = (j, margin = 9.5, loose = false) => { if (onShelf(j) && free(j, jars) && offKeep(j) && (j.shelf !== top0 || offLane(j)) && axisClear(j.x, j.z) > j.R + 11 + 0.15 * axisS(j.x, j.z) && (!margin || pathClear(j.x, j.z) > j.R + margin)) { jars.push(j); return true; } return false; };
  const top = SHELF[0];
  keep.push([top, 79, -167.5, 25.5], [top, 97.5, -176, 8], [top, 60.5, -149.5, 7], [top, 93, -148.5, 7]);                     // the ice trays
  // the two black necks either side of the entry axis
  // (one ruby, one amber: magenta and amber in the dark; made with the draws they always had, then filled)
  { const a = along(100), b = along(124), nA = make(type('swing'), a[0] + ENTRY[2] * 13, top, a[2] - ENTRY[0] * 13, { R: 8.4, H: 47, liq: 'lime' }), nB = make(type('milk'), b[0] - ENTRY[2] * 13.5, top, b[2] + ENTRY[0] * 13.5, { R: 8.8, H: 45 });
    nA.liq = LIQ.ruby; nA.fill = Math.max(nA.fill, 0.64); nB.liq = LIQ.amber; nB.fill = Math.max(nB.fill, 0.6); jars.push(nA, nB); }
  // beside the path: side +1 = right of travel
  const beside = (u, side, clear, t, o = {}, loose = false) => {
    const p = path.pointAt(u), d = path.tangentAt(u), l = Math.hypot(d.x, d.z) || 1, rx = -d.z / l, rz = d.x / l;
    const j = make(t, 0, top, 0, o); j.x = p.x + rx * side * (clear + j.R); j.z = p.z + rz * side * (clear + j.R);
    return push(fit(j), 0, loose) ? j : null;
  };
  // placed by hand (no clearance test: the route passes well above or beside them)
  const place = (xz, t, o, share) => { const j = fit(make(t, xz[0], top, xz[1], o), share); return push(j, 0) ? j : null; };
  const hj = look.heroJar === 'honey' ? place(HERO_XZ, type('honey'), { R: 12, H: 37, fill: 0.78, fizz: 4, liq: 'honey' })
    : look.heroJar === 'cherries' ? place(HERO_XZ, type('pickle'), { R: 12, H: 40, fill: 0.84, fizz: 3, liq: 'ruby' })
      : place(HERO_XZ, type('jam'), { profile: 'jamopen', R: 12, H: 39, fill: 0.76, fizz: 2, liq: 'marmalade' });
  place(SODA_XZ, type('soda'), { R: 9.4, H: 74, fill: 0.74, lit: 0.9 }, 0.31);                                         // the close pass
  if (hj && look.heroJar === 'marmalade') L.spoon = [[hj.x + 2, top + hj.H * 0.42, hj.z + 1], [hj.x + 9, top + hj.H + 17, hj.z - 3]];
  const tum = place(MINT_XZ, type('tumbler'), { R: 10.5, H: 32, fill: 0.5 });
  if (tum) L.mint = [tum.x, top, tum.z, tum.H];
  for (const q of RANKS) place(q, type(q[2]), q[3]);
  for (const q of ROWS) beside(q[0], q[1], q[2], type(q[3]), { liq: q[4] });
  // towers along the back of the avenue (script time)
  for (const q of [[0.462, 1, 'carafe'], [0.483, 1, 'swing'], [0.5, 1, 'soda'], [0.517, 1, 'milk'], [0.535, 1, 'pickle']]) beside(uOf(q[0]), q[1], rng.range(11, 15), type(q[2]), {}, true);
  const pick = (low) => { const list = low ? TYPES.filter((t) => t.low) : TYPES; let s = 0; for (const t of list) s += t.w; let r = rng() * s; for (const t of list) { r -= t.w; if (r <= 0) return t; } return list[0]; };
  // loose blocks on the rest of the top terrace
  const want = jars.length + Math.round(24 * look.density);
  const blocks = []; for (let i = 0; i < 9; i++) blocks.push([rng.range(-120, 125), rng.range(-150, -30)]);
  for (let n = 0; n < 900 && jars.length < want; n++) {
    if ((n & 31) === 0) await ctx.yield();               // each try is checked against the whole corridor
    const b = rng.pick(blocks), wide = (n & 1) === 1, x = wide ? rng.range(-136, 136) : b[0] + rng.gauss() * 24, z = wide ? rng.range(-172, -16) : b[1] + rng.gauss() * 20;
    push(fit(make(pick(false), x, top, z)), 8.5, true);
  }
  L.topCount = jars.length;
  // middle terrace: the jelly on the lip, the fruit bowl, the cake at a party; bottom terrace: more glass in the shade
  const mid = SHELF[1], bot = SHELF[2];
  L.jelly = [2, mid, -160]; L.bowl = [-66, mid + 2.2, -158];
  keep.push([mid, 2, -160, 27], [mid, -66, -158, 24]);
  L.saucers.push([2, mid, -160, 21.5], [-66, mid, -158, 14]);
  jars.push({ profile: 'bowl', x: -66, y: mid + 2, z: -158, R: 17.5, H: 11.5, fill: 0.0, liq: LIQ.water, cap: CAPS[0], fizz: 0, phase: 0.3, lit: 0.75, shelf: mid, noShadow: true });
  if (look.variant === 'party') {
    L.cake = [54, mid + 2.2, -158]; keep.push([mid, 54, -158, 22]); L.saucers.push([54, mid, -158, 17.5]);
    jars.push({ profile: 'cloche', x: 54, y: mid + 2.2, z: -158, R: 15.5, H: 25, fill: 0.0, liq: LIQ.water, cap: CAPS[0], fizz: 0, phase: 0.6, lit: 0.8, shelf: mid, noShadow: true });
  }
  // the street of glass along the two lower lips (its own dice, so the terraces above are as they were)
  { const SR = makeRng(hashSeed('lco-street:' + ctx.seed)), saucerR = { [mid]: [[2, -160, 21.5], [-66, -158, 17.5]], [bot]: [] };
    if (L.cake) saucerR[mid].push([54, -158, 22 + 12]);
    L.cherries = [CHERRY_XZ[0], bot + 2, CHERRY_XZ[1]]; L.saucers.push([CHERRY_XZ[0], bot, CHERRY_XZ[1], 15]);
    jars.push({ profile: 'bowl', x: CHERRY_XZ[0], y: bot + 2, z: CHERRY_XZ[1], R: 19, H: 12.5, fill: 0.0, liq: LIQ.water, cap: CAPS[0], fizz: 0, phase: 0.8, lit: 1.2, shelf: bot, noShadow: true });
    saucerR[bot].push([CHERRY_XZ[0], CHERRY_XZ[1], 19]);
    [mid, bot].forEach((y, k) => {
      for (const q of STREET[k]) {
        if (!saucerR[y].every((c) => Math.hypot(c[0] - q[0], c[1] - q[1]) > c[2] + q[3] + 0.5)) continue;
        jars.push({ profile: q[2], x: q[0], y, z: q[1], R: q[3], H: q[4] * (0.96 + 0.08 * SR()), fill: q[6], liq: LIQ[q[5] === 'ruby' && look.jellyKind === 'ruby' ? 'amber' : q[5]], cap: CAPS[Math.floor(SR() * CAPS.length)], fizz: q[8], phase: SR(), lit: q[7], shelf: y });
      }
    }); }
  for (const [y, count, lit] of [[mid, Math.round(18 * look.density), 0.62], [bot, Math.round(14 * look.density), 0.46]]) {
    const w = jars.length + count;
    for (let n = 0; n < 500 && jars.length < w; n++) {
      if ((n & 31) === 0) await ctx.yield();
      const t = pick(false), j = make(t, rng.range(-134, 134), y, -176 + 14 + Math.pow(rng(), 1.6) * 130, { lit: lit * rng.range(0.85, 1.1) });
      j.H = Math.min(j.H, 88); push(j, 0);
    }
  }
  return { jars, L };
}

const LOOKS = {
  // midnight: a dark teal box, amber the only warmth, glass glowing. morning: a bright white-green box in luminous haze.
  // party: indigo shade, the bar drifting through rose, gold and violet.
  midnight: { index: 0, fogLit: '#0f3540', fogDensity: 0.0019, fogAmt: 1, portal: '#ffc27a', plateGain: 0.9, needleGain: 1.2,
    post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.72, threshold: 1.0 }, grade: { saturation: 1.16, contrast: 1.08, tint: '#e2f0ff', shadowTint: '#021119', vignette: 0.44, grain: 0.03, aberration: 0 } } },
  morning: { index: 1, fogLit: '#4a8c80', fogDensity: 0.0013, fogAmt: 0.8, portal: '#fff0c4', plateGain: 0.8, needleGain: 1.3,
    post: { exposure: 0.9, bloom: { strength: 0.32, radius: 0.7, threshold: 1.12 }, grade: { saturation: 1.24, contrast: 1.2, tint: '#f3fff6', shadowTint: '#1c4a42', vignette: 0.2, grain: 0.02, aberration: 0 } } },
  party: { index: 2, fogLit: '#131a3c', fogDensity: 0.0019, fogAmt: 1, portal: '#ff9fc4', plateGain: 0.9, needleGain: 1.2,
    post: { exposure: 0.95, bloom: { strength: 0.42, radius: 0.74, threshold: 1.05 }, grade: { saturation: 1.2, contrast: 1.12, tint: '#e8ecff', shadowTint: '#0a0f24', vignette: 0.42, grain: 0.03, aberration: 0 } } },
};

export default {
  id: 'the-light-comes-on',
  name: 'The Light Comes On',
  category: 'domestic',
  weirdness: 0.2,
  media: ['tiny', 'interior'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const detail = (ctx.quality && ctx.quality.detail) || 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    const path = makePath(PATH), duration = path.length / SPEED, scriptSeconds = L_OLD / SPEED;   // the ringing after each tug is timed in script seconds

    // ------------------------------------------------------------------ which visit is this
    const hour = vary.hour || 'any', pickR = makeRng(hashSeed('lco-b:' + ctx.seed))(), V = rng.fork('variety');
    const variant = hour === 'dawn' || hour === 'day' ? 'morning' : hour === 'golden' ? 'party'
      : hour === 'night' ? (pickR < 0.55 ? 'midnight' : 'party') : (pickR < 0.4 ? 'midnight' : pickR < 0.7 ? 'morning' : 'party');
    const look = { ...LOOKS[variant], variant, density: clamp(vary.density ?? 1, 0.7, 1.3), frost: V.range(0.25, 1),
      heroJar: V.pick(['marmalade', 'marmalade', 'honey', 'cherries']), jellyKind: V.pick(['ruby', 'ruby', 'lime', 'amber']), rare: !!vary.rare };
    look.jelly = { ruby: '#d8203c', lime: '#9be03a', amber: '#ffa62a' }[look.jellyKind];
    // before the bulb the air is a deep teal haze, thicker than the lit air: the far wall lifts off black and every bottle stands dark against it
    const fogDark = new THREE.Color(DARK_HAZE), fogLit = new THREE.Color(look.fogLit), fogNow = fogDark.clone();
    scene.background = fogNow; scene.fog = new THREE.FogExp2(fogNow, DARK_DENSITY);

    // ------------------------------------------------------------------ the hero: the door, its gasket, the shelves, the falls
    const hero = await buildHero(ctx, { palette: PAL, variant, density: look.density, frost: look.frost, duration: scriptSeconds, shelfDepth: 180, progress: 0,
      bulbPos: [BULB[0], BULB[1], BULB[2] - HZ], diodePos: [DIODE[0], DIODE[1] - 1.2, DIODE[2] - HZ], lane: [LANE[0], LANE[1] - HZ, LANE[2], LANE[3], LANE[4], LANE[5]] });
    hero.object.position.set(0, 0, HZ); scene.add(hero.object);
    hero.setBulb(0); hero.setProgress(0); hero.update(0, 0, null);
    const U = hero.uniforms, A = hero.anchors, HAZE = U.uKey.value.w;
    U.uSlosh.value.w = 0.034;                               // every liquid surface trembles a little, always
    await ctx.yield();
    const M = makeMaterials(U, look), O = makeOutsideMaterials(U, look);
    await ctx.yield();
    const enamel = enamelMaterial(U, look.frost);
    const jarSlosh = new THREE.Vector4(0, 0, 0, 0.03);
    const glass = glassMaterial({ ...U, uSlosh: { value: jarSlosh } });
    await ctx.yield();

    // ------------------------------------------------------------------ the cast and the cabinet
    const { jars, L } = await layoutJars(ctx, rng.fork('jars'), path, look);
    await ctx.yield();
    const shell = new THREE.Mesh(await buildShell(ctx, L), enamel); scene.add(shell);
    await ctx.yield();
    const fan = new THREE.Mesh(buildFan(), enamel); fan.position.set(ROSE[0], ROSE[1], -1.6); scene.add(fan);
    scene.add(new THREE.Mesh(buildStrap(), M.strap));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(300, 420).rotateY(Math.PI).translate(0, 210, 0), M.plate); scene.add(plate);
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(240, 420).rotateY(Math.PI / 2).translate(-150, 210, -120), M.wall); scene.add(wallL);
    await ctx.yield();
    for (const name of Object.keys(PROFILES)) {
      const list = jars.filter((j) => j.profile === name); if (!list.length) continue;
      const m = bottleMesh(name, list, glass, name === 'bowl' || name === 'cloche' ? 36 : 34);
      m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 230, -95), 260); scene.add(m);
      await ctx.yield();
    }
    await ctx.yield();
    // what each jar throws on its shelf
    { const list = jars.filter((j) => !j.noShadow), n = list.length + 1, g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const aJ = new Float32Array(n * 4), aK = new Float32Array(n * 4), jc = new THREE.Color(look.jelly);
      list.forEach((j, i) => { aJ.set([j.x, j.z, j.R, j.shelf], i * 4); aK.set([j.liq[0], j.liq[1], j.liq[2], j.H * (0.35 + 0.65 * j.fill)], i * 4); });
      aJ.set([L.jelly[0], L.jelly[2], 18, L.jelly[1] + 1.2], (n - 1) * 4); aK.set([jc.r, jc.g, jc.b, 14], (n - 1) * 4);
      g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 4));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 215, -90), 260);
      const m = new THREE.Mesh(g, M.caustic); m.renderOrder = 1.5; scene.add(m);
      // and its picture in the glass
      const NECK = { milk: 1, swing: 1, soda: 1, sauce: 1, carafe: 1, champagne: 1 };
      const g2 = new THREE.InstancedBufferGeometry(), aM = new Float32Array(n * 4), aK2 = new Float32Array(n * 4);
      g2.setAttribute('position', g.attributes.position); g2.setIndex(g.index);
      list.forEach((j, i) => { aK2.set([j.liq[0], j.liq[1], j.liq[2], j.H], i * 4); aM.set([j.profile === 'tumbler' ? j.fill * 0.9 : j.fill * 0.93, j.liq[3], Math.min(j.lit, 1), NECK[j.profile] ? 1 : 0], i * 4); });
      aK2.set([jc.r, jc.g, jc.b, 16.8], (n - 1) * 4); aM.set([1, 0, 0.9, 2], (n - 1) * 4);
      g2.setAttribute('aJ', g.attributes.aJ); g2.setAttribute('aK', new THREE.InstancedBufferAttribute(aK2, 4)); g2.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4));
      g2.instanceCount = n; g2.boundingSphere = g.boundingSphere;
      const m2 = new THREE.Mesh(g2, M.refl); m2.renderOrder = 1.6; m2.frustumCulled = false; scene.add(m2); }
    await ctx.yield();

    // ------------------------------------------------------------------ frost: needles on the back plate, the corner, the ceiling, the shelf lips
    let needles;
    { const base = needleGeometry(), g = new THREE.InstancedBufferGeometry(), R = rng.fork('frost');
      g.setAttribute('position', new THREE.Float32BufferAttribute(base.pos, 3)); g.setAttribute('aFace', new THREE.Float32BufferAttribute(base.face, 1));
      const want = Math.round(5900 * detail * (0.72 + 0.4 * look.frost)), aB = [], aA = [], aW = [], T = new THREE.Vector3();
      const put = (x, y, z, ax, ay, az, len) => {
        const l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
        const d = path.distanceTo(x + ax * len, y + ay * len, z + az * len); if (d < 8) len = Math.max(1.2, len - (8 - d));
        aB.push(x, y, z); aA.push(ax * len, ay * len, az * len); aW.push(1, R());
      };
      const nRose = Math.round(want * 0.45), nPlate = Math.round(want * 0.25), nWall = Math.round(want * 0.21), nCeil = want - nRose - nPlate - nWall;
      for (let i = 0; i < nRose; i++) {
        if ((i & 511) === 0) await ctx.yield();             // thousands of needles: a few hundred at a time
        const a = R() * TAU, t = Math.pow(R(), 0.75), r = 16.5 + t * (ROSE_R * 1.25 - 16.5), sp = lerp(0.35, 1.25, t) * R.range(0.6, 1.2);
        put(ROSE[0] + Math.cos(a) * r, ROSE[1] + Math.sin(a) * r, 0, Math.cos(a) * sp + R.range(-0.25, 0.25), Math.sin(a) * sp + R.range(-0.25, 0.25), -1, lerp(9, 2.4, t * t) * R.range(0.55, 1));
      }
      for (let i = 0, k = 0; i < nPlate && k < nPlate * 12; k++) {
        if ((k & 511) === 0) await ctx.yield();
        const x = R.range(-147, 147), y = 20 + Math.pow(R(), 0.6) * 396;
        if (noise.fbm2(x * 0.02 + 5, y * 0.02, 3) < 0.12 - 0.3 * look.frost) continue;
        put(x, y, 0, R.range(-0.7, 0.7), R.range(-0.7, 0.7), -1, R.range(2, 6.5)); i++;
      }
      await ctx.yield();
      for (let i = 0; i < nWall; i++) put(-150, 416 - Math.pow(R(), 1.3) * 150, -2 - Math.pow(R(), 1.35) * 128, 1, R.range(-0.7, 0.7), R.range(-0.7, 0.7), R.range(2, 6));
      await ctx.yield();
      for (let i = 0; i < nCeil; i++) put(R.range(-146, 60), 420, -1 - Math.pow(R(), 1.6) * 70, R.range(-0.4, 0.4), -1, R.range(-0.4, 0.4), R.range(2, 7));
      // rime on the fan grille and on the runners where they cross the frost: the largest things in frame at the turn
      for (let i = 0, n = Math.round(240 * detail); i < n; i++) {
        const a = R() * TAU, rr = R() < 0.55 ? 14.6 : 16.9, up = Math.sin(a) > -0.2 ? 0.6 : 0;
        put(ROSE[0] + Math.cos(a) * rr, ROSE[1] + Math.sin(a) * rr, -2.4, Math.cos(a) * 0.7 + R.range(-0.3, 0.3), Math.sin(a) * 0.7 + up, -0.9, R.range(1.8, 4.6));
      }
      for (let i = 0, n = Math.round(260 * detail); i < n; i++) {
        const y = [236, 262, 288, 340, 366, 392][R.int(0, 5)], z = -3 - Math.pow(R(), 1.5) * 110;
        put(-147.7 + R.range(-1.8, 2.2), y + 1.6, z, R.range(-0.1, 0.5), 1, R.range(-0.4, 0.4), R.range(1.2, 3.4));
      }
      await ctx.yield();
      if (look.frost > 0.55) for (const t of SHELF) for (let i = 0, n = Math.round(60 * detail * look.frost); i < n; i++) put(R.range(-146, 146), t - 3.8, EDGE_Z + R.range(0, 1.6), R.range(-0.08, 0.08), -1, R.range(-0.08, 0.08), R.range(3, 9));
      await ctx.yield();
      const n = aB.length / 3;
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(aB), 3)); g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(new Float32Array(aA), 3));
      g.setAttribute('aWr', new THREE.InstancedBufferAttribute(new Float32Array(aW), 2));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 230, -100), 300);
      needles = new THREE.Mesh(g, M.needle); needles.renderOrder = -0.5; scene.add(needles); }   // (-0.5: its shadows are laid over the plate, so it is drawn straight after the opaque things, before the shelves, the glass and the mist)
    await ctx.yield();

    // ------------------------------------------------------------------ crispers, fruit, the jelly, ice
    const veg = new THREE.Mesh(await buildVeg(ctx, L, rng.fork('veg'), noise), M.veg); scene.add(veg);
    await ctx.yield();
    { const parts = []; for (const cx of [-75, 75]) parts.push(new THREE.PlaneGeometry(134, 90, 1, 1).rotateY(Math.PI).translate(cx, 53.5, -177.4));
      const pane = new THREE.Mesh(mergeAll(parts), M.pane); pane.renderOrder = 3; scene.add(pane); }
    let jelly;
    { const pts = [[0.01, 14], [3, 13.9], [6.5, 13.2], [9.6, 11.6], [11.6, 9.2], [12.9, 6.2], [14, 3], [15, 0.6], [15, 0]].map((q) => new THREE.Vector2(q[0], q[1])).reverse();
      const g = new THREE.LatheGeometry(pts, 56), p = g.attributes.position, bite = new THREE.Vector3(-9.4, 9.6, -6.2), q = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        q.fromBufferAttribute(p, i); const a = Math.atan2(q.z, q.x), r = Math.hypot(q.x, q.z), flute = 1 + 0.055 * Math.cos(a * 12) * ss(0.5, 4, q.y) * (1 - ss(10.5, 13.6, q.y));
        q.x *= flute; q.z *= flute;
        const d = q.distanceTo(bite); if (d < 6.2 && r > 0.1) { const k = Math.sqrt(6.2 * 6.2 - d * d) * 0.85 / r; q.x -= q.x * k * 0.75; q.z -= q.z * k * 0.75; q.y -= Math.sqrt(6.2 * 6.2 - d * d) * 0.3; }
        p.setXYZ(i, q.x, q.y, q.z);
      }
      g.computeVertexNormals(); g.deleteAttribute('uv');
      jelly = new THREE.Mesh(g, M.jelly); jelly.position.set(L.jelly[0], L.jelly[1] + 1.2, L.jelly[2]); jelly.rotation.y = 2.2; jelly.scale.setScalar(1.2); scene.add(jelly); }
    await ctx.yield();
    const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const BIG = new THREE.Sphere(new THREE.Vector3(0, 200, -150), 420);
    // ice: cubes in the top tray, two loose ones, and the three that tip off the edge at U_CUBES
    const CUBE = 9, trayM = new THREE.Matrix4().makeRotationY(L.trays[1][3]).setPosition(L.trays[1][0], L.trays[1][1], L.trays[1][2]);
    const iceR = rng.fork('ice'), statics = [], fallers = [];
    // every cell holds a cube, loosely seated and standing well clear of the rim; one is tipped up on the divider
    for (let i = 0; i < 4; i++) for (const row of [-1, 1]) {
      const tip = row > 0 && i === 2, p = new THREE.Vector3(-16.8 + i * 11.2 + (tip ? 1.2 : 0), tip ? 9.2 : 7.3 + iceR.range(-0.3, 0.5), row * 5.5).applyMatrix4(trayM);
      if (row < 0 && i > 0) fallers.push({ start: p, hang: new THREE.Vector3(79 + i * 6, 339 - (i % 2) * 7, -189 - i * 1.6), axis: new THREE.Vector3(iceR.range(-1, 1), iceR.range(-0.4, 0.4), iceR.range(-1, 1)).normalize(), spin: iceR.range(0.9, 1.5) });
      else statics.push([p, 0.1 + iceR.range(-0.2, 0.2), tip ? 0.42 : iceR.range(-0.1, 0.1), tip ? 0.2 : iceR.range(-0.1, 0.1)]);
    }
    // loose on the shelf round the trays
    statics.push([new THREE.Vector3(93, 325.1, -148.5), 0.7, 0, 0], [new THREE.Vector3(97.5, 325.1, -176), 0.2, 0, 0], [new THREE.Vector3(60.5, 325.1, -149.5), 0.5, 0, 0]);
    const iceG = rbox(0, 0, 0, 1, 1, 1, 0.1, 2), iceN = statics.length + 3;
    { const sd = new Float32Array(iceN); for (let i = 0; i < iceN; i++) sd[i] = iceR(); iceG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1)); }
    const ice = new THREE.InstancedMesh(iceG, M.ice, iceN); ice.frustumCulled = false;
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(CUBE, CUBE, CUBE), _p = new THREE.Vector3(), _p2 = new THREE.Vector3(), _d = new THREE.Vector3();
    statics.forEach((s, i) => { ice.setMatrixAt(i + 3, _m.compose(s[0], _q.setFromEuler(_e.set(s[2], s[1], s[3])), _s)); });
    scene.add(ice);
    await ctx.yield();
    // drips along the three shelf lips
    { const n = Math.round(150 * detail), g = quad(), a = new Float32Array(n * 4), R = rng.fork('drips');
      for (let i = 0; i < n; i++) a.set([R.range(-146, 146), SHELF[i % 3] - 4, R(), R.range(0.12, 0.22)], i * 4);
      g.setAttribute('aD', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; g.boundingSphere = BIG;
      const m = new THREE.Mesh(g, M.drip); m.renderOrder = 6.5; scene.add(m); }
    // and more of them where the kitchen's bar crosses the lips, by the way out: there they fall through its light as gold sparks.
    // From the wall (x -146.5, half a metre inside the shelf's end) to where the bar's edge lies on the shelf fronts with the door
    // at its 15 degrees (x -99); two in five on the bottom lip, two on the middle one, one on the top; swelling and falling at the
    // same rates as the rest. A stream of their own.
    { const n = Math.round(60 * detail), g = quad(), a = new Float32Array(n * 4), R = makeRng(hashSeed('lco-bar-drips:' + ctx.seed));
      for (let i = 0; i < n; i++) a.set([R.range(-146.5, -99), SHELF[[2, 1, 2, 1, 0][i % 5]] - 4, R(), R.range(0.12, 0.22)], i * 4);
      g.setAttribute('aD', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; g.boundingSphere = BIG;
      const m = new THREE.Mesh(g, M.drip); m.renderOrder = 6.5; scene.add(m); }
    // mist: feet of the falls (0..2), the floor tray and the sill (3), fog creeping on the top shelf (4), the cat's breath (5)
    { const R = rng.fork('mist'), c = [], r = [], add = (x, y, z, size, alpha, drift, kind) => { c.push(x, y, z, size); r.push(R(), drift, alpha, kind); };
      const k = detail < 0.9 ? 0.7 : 1;
      // the feet stay within a few metres of their falls: the air of the dive, out in the canyon, is left clear
      // each foot is a rank of billows standing out from the shelf front, the lower ones larger
      A.fallFeet.forEach((f, i) => { const pool = i === 2; for (let j = 0; j < Math.round((pool ? 38 : 34) * k); j++) add(R.range(-142, 142), f.y + (pool ? R.range(-4, 12) : R.range(-3, 7)), f.z + HZ + (pool ? R.range(-12, 8) : R.range(-9, 2)), pool ? R.range(26, 44) : R.range(15, 25), pool ? R.range(0.2, 0.32) : R.range(0.34, 0.52), pool ? R.range(4, 8) : R.range(2.5, 4.5), i); });
      for (let j = 0; j < Math.round(34 * k); j++) add(R.range(-140, 140), R.range(6, 20), R.range(-240, -188), R.range(40, 64), R.range(0.2, 0.34), R.range(4, 9), 3);
      // the river: offsets from its line (see M.mist); it flows out under the portal as a sill
      for (let j = 0; j < Math.round(170 * k); j++) add(R.range(-12, 12), R.range(-4, 9), R.range(-42, 42), R.range(26, 44), R.range(0.4, 0.58), R.range(2, 4), 6);
      for (let j = 0; j < Math.round(36 * k); j++) add(R.range(-12, 12), R.range(-6, 5), R.range(-66, -28), R.range(26, 40), R.range(0.36, 0.5), R.range(2, 4), 6);   // and its far bank: the sill runs the full width of the slot
      for (let j = 0; j < Math.round(30 * k); j++) add(R.range(-136, 40), R.range(323, 328), R.range(-178, -150), R.range(20, 34), R.range(0.16, 0.27) * 0.45, R.range(4, 8), 4);
      for (let j = 0; j < Math.round(26 * k); j++) add(R.range(52, 140), R.range(326, 336), R.range(-178, -150), R.range(13, 24), R.range(0.2, 0.32), R.range(4, 7), 4);   // cold rolling off the ice
      for (let j = 0; j < Math.round(16 * k); j++) add(R.range(10, 128), R.range(334, 374), R.range(-224, -198), R.range(26, 40), R.range(0.12, 0.2), R.range(8, 13), 4);   // haze adrift in the top of the canyon
      for (let j = 0; j < Math.round(80 * k); j++) { const x = R.range(56, 104); add(x, 333.6 + R.range(-0.6, 0.8), -155.4 - 0.1 * (x - 80) + R.range(-1, 1), R.range(7, 11.5), R.range(0.42, 0.64), R.range(1.2, 2.4), 7); }   // cold rolling off the ice, over the tray's rail (see M.mist)
      for (let j = 0; j < 12; j++) add(-158 + R.range(-5, 5), R.range(110, 134), -264 + R.range(-8, 8), R.range(12, 20), R.range(0.3, 0.42), R.range(3, 6), 5);
      for (let j = 0; j < Math.round(16 * k); j++) add(R.range(-146, -104), R.range(318, 352), R.range(-232, -184), R.range(15, 27), R.range(0.2, 0.34), R.range(4, 8), 4);   // cold drifting across the bar: gold fog
      const g = quad(); g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(c), 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(new Float32Array(r), 4));
      g.instanceCount = c.length / 4; g.boundingSphere = BIG;
      const m = new THREE.Mesh(g, M.mist); m.renderOrder = 5.6; scene.add(m); }
    await ctx.yield();

    // ------------------------------------------------------------------ outside: the kitchen round the slot, and (one visit in eight) the cat
    { const pos = [], aL = [], idx = [], SEG = 30, cx = -146, cz = -276;
      [900, 700, 500].forEach((rad, layer) => {
        const base = pos.length / 3;
        for (let i = 0; i <= SEG; i++) { const a = i / SEG, th = (-205 + 150 * a) * Math.PI / 180; for (const y of [-2400, 960]) { pos.push(cx + Math.cos(th) * rad, y, cz + Math.sin(th) * rad); aL.push(a, y, layer); } }
        for (let i = 0; i < SEG; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(aL, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, O.kitchen); m.renderOrder = -3; m.frustumCulled = false; scene.add(m); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 420, 1, 6).translate(0, 210, 0), O.barGlow); m.renderOrder = 6.2; m.frustumCulled = false; scene.add(m); }
    const CAT_EYE = new THREE.Vector3(-168, 152, -266), CAT_AIM = new THREE.Vector3(20, 200, -221), CAT_SCALE = 0.62;
    let cat = null, catSide = null;
    if (look.rare) {
      cat = new THREE.Mesh(new THREE.PlaneGeometry(190, 220, 1, 1).translate(14, -58, 0), O.cat); cat.renderOrder = -1; cat.frustumCulled = false;
      cat.position.copy(CAT_EYE); cat.lookAt(CAT_AIM); cat.scale.setScalar(CAT_SCALE); cat.updateMatrix(); catSide = new THREE.Vector3().setFromMatrixColumn(cat.matrix, 0).normalize(); scene.add(cat);
    }
    await ctx.yield();
    // the two lamps and their halos
    const bulbMat = O.lamp(PAL[3]), diodeMat = O.lamp(PAL[4]);
    { const b = new THREE.Mesh(new THREE.SphereGeometry(5.2, 20, 14).scale(1, 1.22, 1), bulbMat); b.position.set(BULB[0], BULB[1], BULB[2]); scene.add(b);
      const d = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), diodeMat); d.position.set(DIODE[0], DIODE[1] - 1, DIODE[2]); scene.add(d); }
    const timeU = { value: 0 };
    await ctx.yield();
    const diodeGlow = fx.makeGlow({ rng: rng.fork('dg'), position: [DIODE[0], DIODE[1] - 1.6, DIODE[2]], color: PAL[4], size: 3.4, intensity: 1.8, time: timeU, fogAmount: 0.5 });
    await ctx.yield();
    const bulbGlow = fx.makeGlow({ rng: rng.fork('bg'), position: [BULB[0], BULB[1] - 2, BULB[2]], color: '#cfeaff', size: 70, intensity: 0, time: timeU, fogAmount: 0.4 });
    await ctx.yield();
    const rays = fx.makeGodRays({ rng: rng.fork('rays'), position: [BULB[0], BULB[1] - 6, BULB[2]], direction: [-0.5, -0.62, 0.6], radius: 7, count: 10, length: 250, width: [3, 26], color: '#cfeeff', intensity: 0, falloff: 1.4, time: timeU });
    // a soft halo on the way out, so the portal reads from the top of the dive; it fades as we come close
    const exitGlow = fx.makeGlow({ rng: rng.fork('eg'), position: path.pointAt(1).toArray(), color: look.portal, size: 150, intensity: 0, time: timeU, fogAmount: 0.2 });
    scene.add(diodeGlow.object, bulbGlow.object, rays.object, exitGlow.object);
    await ctx.yield();
    // air: fine ice dust everywhere, frost shed from the needles along the back plate
    const dustCold = new THREE.Color('#e4f7ff'), dustGreen = new THREE.Color(PAL[4]);
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round(2200 * detail), box: [130, 84, 130], size: [0.1, 0.34], colors: ['#e4f7ff', '#a6e8f4', '#ffffff'],
      intensity: 0.9, velocity: [-1.6, -1.1, -2.2], velocityRandom: [1.2, 0.6, 1.2], turbulence: [1.6, 0.8, 0.12], time: timeU, renderOrder: 7 });
    await ctx.yield();
    const shed = fx.makeParticles({ rng: rng.fork('shed'), preset: 'snow', follow: false, center: [-58, 326, -17], box: [190, 160, 30], count: Math.round(1300 * detail), size: [0.25, 0.8],
      colors: ['#ffffff', '#bfeeff', '#e9fbff'], intensity: 1.6, velocity: [0, -2.4, -0.6], velocityRandom: [0.6, 0.8, 0.6], twinkle: 1, time: timeU, renderOrder: 7 });
    const coneDust = fx.makeParticles({ rng: rng.fork('cone'), preset: 'dust', follow: false, center: [52, 338, -104], box: [120, 120, 110], count: Math.round(520 * detail), size: [0.1, 0.34],
      colors: ['#ffffff', '#cfefff', '#eaffff'], intensity: 1.5, velocity: [-0.8, -1.4, 0.9], velocityRandom: [0.8, 0.5, 0.8], turbulence: [1.2, 0.6, 0.15], twinkle: 1, time: timeU, renderOrder: 7 });
    await ctx.yield();
    const barDust = fx.makeParticles({ rng: rng.fork('bar'), preset: 'dust', follow: false, center: [-118, 220, -170], box: [56, 380, 150], count: Math.round(900 * detail), size: [0.12, 0.46],
      colors: [look.portal, '#ffffff', look.portal], intensity: 1.5, velocity: [0.9, -1.2, 1.6], velocityRandom: [0.8, 0.5, 0.8], turbulence: [1.2, 0.6, 0.15], twinkle: 1, time: timeU, renderOrder: 7 });
    scene.add(motes.object, shed.object, coneDust.object, barDust.object);
    await ctx.yield();
    // three fruit flies round the peach bowl; one comes up to meet us in the dive, one has landed and walks
    const flyG = buildFly(), flies = new THREE.InstancedMesh(flyG.body, M.fly, 3), wings = new THREE.InstancedMesh(flyG.wings, O.wing, 3);
    flies.frustumCulled = false; wings.frustumCulled = false; wings.renderOrder = 6; scene.add(flies, wings);
    await ctx.yield();
    const bowlC = new THREE.Vector3(L.bowl[0], L.bowl[1] + 15, L.bowl[2]), topFruit = new THREE.Vector3().fromArray(L.fruitTops[11]);
    const flyPos = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], flyDir = [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1)];
    const UP = new THREE.Vector3(0, 1, 0), _l = new THREE.Matrix4(), _cp = new THREE.Vector3(), _cd = new THREE.Vector3(), _cr = new THREE.Vector3();
    const placeFly = (i, p, dir, scale, wingScale) => {
      _l.lookAt(_p2.set(0, 0, 0), _d.copy(dir).multiplyScalar(-1), UP); _q.setFromRotationMatrix(_l);
      flies.setMatrixAt(i, _m.compose(p, _q, _p2.set(scale, scale, scale))); wings.setMatrixAt(i, _m.compose(p, _q, _p2.set(wingScale, wingScale, wingScale)));
    };

    // ------------------------------------------------------------------ the frame
    const portalPos = path.pointAt(1), gazePoi = new THREE.Vector3(), _g = new THREE.Vector3(), _gp = new THREE.Vector3();
    // the gaze table does the looking from the reveal to the middle of the dive (it comes last, so it has the last word);
    // a rare visit looks a little higher down the canyon, at the eye in the gap
    const gazeFn = (t, u) => { gazeAt(u, _g); if (look.rare) _g.y += 0.05 * bell(sOf(u), 0.66, 0.92, 0.3); return gazePoi.copy(path.pointAt(u, _gp)).addScaledVector(_g, 120); };
    const pois = [
      { at: new THREE.Vector3(ROSE[0], ROSE[1], -4), from: POI_WIN.rose[0], to: POI_WIN.rose[1], weight: 0.5 },
      { at: portalPos, from: POI_WIN.portal[0], to: POI_WIN.portal[1], weight: 0.5 },
      // the crisper greenhouses on the left, or (one visit in eight) the cat looking in over the portal
      look.rare ? { at: new THREE.Vector3(CAT_EYE.x, CAT_EYE.y + 10, CAT_EYE.z), from: uOf(0.66), to: uOf(0.93), weight: 0.4 } : { at: new THREE.Vector3(-96, 58, -178), from: POI_WIN.crisper[0], to: POI_WIN.crisper[1], weight: 0.22 },
      { at: gazeFn, from: POI_WIN.gazeA[0], to: POI_WIN.gazeA[1], weight: 0.9, fade: POI_WIN.gazeA[2] },
      { at: gazeFn, from: POI_WIN.gazeB[0], to: POI_WIN.gazeB[1], weight: 0.9, fade: POI_WIN.gazeB[2] },
    ];

    const JOLTS = [[U_THUMP, 1], [0.245, 0.4], [0.495, 0.45], [U_CUBES + 0.02, 0.5], [0.71, 0.3], [0.805, 0.3]];
    const ring = (u, freq, decay, ph) => { let s = 0; for (const j of JOLTS) { const t = (u - j[0]) * scriptSeconds; if (t > 0) s += j[1] * Math.exp(-t * decay) * Math.sin(t * freq + ph); } return s; };
    let onAt = null, bulb = 0, slow = 0;
    const KEY_X = U.uKey.value.x, U_FILL = [0.2, 0.262, 0.352, 0.44];
    const KEY_HOLD = variant === 'morning' ? 0.5 : 0.17, GLOW_HOLD = variant === 'morning' ? 0.3 : 1.25;

    return {
      scene, path, duration,
      camera: { fov: FOV, near: 0.8, far: 2600, lookAhead: 22, sway: 0.6, bank: 0.35 },
      // linger where the door is seen whole and down the street of glass in the canyon, between the ranks on the shelf fronts and the door's racks
      pace: (u) => 1 - 0.45 * bell(u, 0.255, 0.375, 0.3) - 0.22 * bell(sOf(u), 0.655, 0.86, 0.25),
      pois,
      portal: { shape: 'circle', radius: 12, color: look.portal, glow: 0.7, revealDistance: 420, tilt: true, dewash: 0 },
      post: look.post,
      ride: 'none', companion: 'none', style: 'none',
      update(dt, t, camera, u) {
        timeU.value = t;
        const s = sOf(u);                                        // script time: every beat below is keyed to it
        // the switch: latched the first time u passes U_ON, then a 0.35 s filament rise on the clock; it can never run backwards.
        // (seen through the previous portal u is 0, so the box stays dark; a frame posed later in the flight finds it already lit)
        if (onAt === null && u >= U_ON) onAt = t - (u - U_ON) * duration;
        const el = onAt === null ? -1 : t - onAt;
        if (el > 0) { bulb = Math.max(bulb, smoothstep(0, 0.35, el)); slow = Math.max(slow, smoothstep(0, 0.6, el)); }
        hero.setDiode(1.3 + 0.22 * Math.sin(t * 0.8)); hero.setBulb(bulb); hero.setProgress(s); hero.update(dt, t, camera);
        // while the whole door is in view from the corner, more of the bulb's light is let past its hood onto the liner: a white
        // wall with the bottles' long shadows down it. By the hairpin it is back in teal shade and the glass on it glows
        const fill = smoothstep(U_FILL[0], U_FILL[1], u) * (1 - 0.86 * smoothstep(U_FILL[2], U_FILL[3], u));
        // the held picture is backlit: the liner stays darker than the glass that stands before it, the kitchen's bar is the
        // brightest thing in the frame, its light rims the jars and lies along the glass shelf (uDark.y)
        const hold = smoothstep(U_FILL[0], U_FILL[1], u) * (1 - smoothstep(U_FILL[2], U_FILL[3], u));
        U.uKey.value.x = lerp(KEY_X + (0.9 - KEY_X) * fill, KEY_HOLD, hold);
        U.uDark.value.y = hold;
        U.uDark.value.x = 1 - bulb;                               // the hairline of kitchen light round the seal, until the bulb
        O.barGlow.uniforms.uGlow.value = 0.25 + 0.75 * fill + GLOW_HOLD * hold;
        scene.fog.density = lerp(DARK_DENSITY, look.fogDensity, slow) * (1 - 0.3 * hold);            // the held picture is hard and clear: thinner air between the eye and the door
        U.uKey.value.w = HAZE * (1 - 0.8 * smoothstep(0.58, 0.72, s));        // down in the canyon the lit air thins: the gold stays in the slot and on what crosses the bar
        fogNow.copy(fogDark).lerp(fogLit, slow); scene.fog.color.copy(fogNow);
        // thump, shiver, tremble
        const th = (s - U_THUMP) * scriptSeconds;
        M.needle.uniforms.uShiver.value = th > 0 ? Math.exp(-th * 2.6) : 0;
        jarSlosh.x = 0.35 * ring(s, 2.6, 0.5, 0.3); jarSlosh.y = 0.35 * ring(s, 1.9, 0.4, 1.5); jarSlosh.z = 0.006 * ring(s, 9, 2.2, 0);
        M.jelly.uniforms.uWob.value.z = 0.55 * ring(s, 10, 1.1, 0); M.jelly.uniforms.uWob.value.w = 0.5 * ring(s, 14, 1.3, 1);
        fan.rotation.z = t * 2.3;
        // lamps and air
        bulbMat.uniforms.uLevel.value = 0.012 + 6.2 * bulb; diodeMat.uniforms.uLevel.value = (2.4 + 0.9 * Math.sin(t * 0.8)) * (1 - 0.6 * bulb);
        diodeGlow.uniforms.uIntensity.value = (1.1 + 0.5 * Math.sin(t * 0.8)) * (1 - 0.7 * bulb); bulbGlow.uniforms.uIntensity.value = 0.5 * bulb; rays.uniforms.uIntensity.value = 0.08 * slow;
        // the dust belongs to the cold air of the box: it thins as we leave through the slot
        motes.uniforms.uColorA.value.copy(dustGreen).lerp(dustCold, bulb); motes.setOpacity((0.16 + 0.2 * slow) * (1 - 0.8 * smoothstep(0.84, 0.95, s)));
        camera.getWorldPosition(_p2); const toExit = _p2.distanceTo(portalPos);
        exitGlow.uniforms.uIntensity.value = 4.6 * slow * smoothstep(100, 250, toExit) * smoothstep(0.5, 0.6, s); exitGlow.update(dt, t, camera);
        shed.setOpacity(slow * (0.55 + 0.45 * Math.exp(-Math.max(el, 0) * 0.25)));
        coneDust.setOpacity(0.6 * slow); barDust.setOpacity(0.6 * slow * U.uBar.value.w); coneDust.update(dt, t, camera); barDust.update(dt, t, camera);
        diodeGlow.update(dt, t, camera); bulbGlow.update(dt, t, camera); rays.update(dt, t, camera); motes.update(dt, t, camera); shed.update(dt, t, camera);
        // the three cubes: at rest on the tray, tipping off, then tumbling down the canyon a little slower than we dive
        for (let k = 0; k < 3; k++) {
          // off the tray and over the lip in front of the door racks, then down the canyon beside us
          const f = fallers[k], u0 = U_CUBES + k * 0.008, w = smoothstep(u0, u0 + 0.034, s), w2 = smoothstep(0.596, 0.668, s);
          path.pointAt(uOf(clamp(0.648 + 0.009 * k + (s - 0.615) * 0.3, 0, 1)), _p); _p.y -= 9.5 + 3 * k; _p.z += 11.5 + 0.6 * k;
          _p2.lerpVectors(f.start, f.hang, w); _p2.y += Math.sin(Math.min(w * 1.6, 1) * Math.PI) * 5 - 26 * smoothstep(0.585, 0.66, s) * (1 - w2);
          _p.lerpVectors(_p2, _p, w2);
          _q.setFromAxisAngle(f.axis, Math.max(s - u0, 0) * scriptSeconds * f.spin);
          ice.setMatrixAt(k, _m.compose(_p, _q, _s));
        }
        ice.instanceMatrix.needsUpdate = true;
        // flies
        // one of them comes up to meet us low in the dive and hangs in the air beside us, side on, before it peels away
        const esc = bell(s, U_FLY[0], U_FLY[1], 0.3);
        camera.getWorldPosition(_cp); camera.getWorldDirection(_cd); _cr.crossVectors(_cd, UP).normalize();
        for (let i = 0; i < 2; i++) {
          const a = t * (i ? 0.7 : 0.9) + i * 2.1, p = flyPos[i];
          _p.set(bowlC.x + Math.cos(a) * (i ? 20 : 26), bowlC.y + (i ? 6 : 9) + 4.5 * Math.sin(a * 2 + i), bowlC.z + Math.sin(a) * (i ? 13 : 16));
          if (i === 0 && esc > 0) {
            _p2.copy(_cp).addScaledVector(_cd, 25).addScaledVector(_cr, -5.5 + Math.sin(t * 1.3) * 1.1); _p2.y += -3.2 + Math.sin(t * 2.3) * 0.8;
            _p.lerp(_p2, esc);
          }
          // the heading eases by the clock step: 0.35 of the way in a sixtieth of a second on any screen, and not at all while the clock stands
          _d.subVectors(_p, p); if (dt > 0 && _d.lengthSq() > 1e-6 && _d.lengthSq() < 400) flyDir[i].lerp(_d.normalize(), 1 - Math.pow(1 - 0.35, dt * 60)).normalize();
          if (i === 0 && esc > 0.5) { flyDir[0].copy(_cr).multiplyScalar(0.84).addScaledVector(_cd, -0.42); flyDir[0].y += 0.12; flyDir[0].normalize(); }
          p.copy(_p); placeFly(i, p, flyDir[i], i ? 1 : 1.35, i ? 1 : 1.35);
        }
        { const w = t * 0.3, a = Math.floor(w) * 2.4 + smoothstep(0.15, 0.85, w - Math.floor(w)) * 2.4;
          flyPos[2].set(topFruit.x + Math.cos(a) * 2.3, topFruit.y + 0.55, topFruit.z + Math.sin(a) * 2.3); flyDir[2].set(-Math.sin(a), 0, Math.cos(a));
          placeFly(2, flyPos[2], flyDir[2], 1, 0.001); }
        flies.instanceMatrix.needsUpdate = true; wings.instanceMatrix.needsUpdate = true;
        // the cat
        if (cat) {
          const arrive = smoothstep(0.6, 0.67, s), leave = smoothstep(0.93, 0.975, s), away = 1 - arrive + leave;
          // it comes up into the gap from below and behind the door, and sinks a little to keep us in view as we dive
          cat.position.copy(CAT_EYE).addScaledVector(catSide, away * 70); cat.position.y -= away * 90 + 22 * smoothstep(0.8, 0.92, s);
          const c = O.cat.uniforms.uCat.value;
          c.x = arrive * (1 - leave); c.y = 1 - 0.86 * smoothstep(0.69, 0.785, s); c.z = 1.25 - 1.25 * bell(s, 0.795, 0.82, 0.4);
          M.mist.uniforms.uBreath.value = bell(s, 0.725, 0.78, 0.35) + bell(s, 0.82, 0.875, 0.35);
        }
      },
      dispose() {},
    };
  },
};
