// HERO SET PIECE for "tulou-rings" (Rings in the Tea Mist): ring A, a Fujian rammed-earth ring fortress
// (tulou), built to be flown INSIDE at second-gallery height and then seen again from above as a tile ring.
//
// WHAT IT IS
//   A 96 m ring: battered ochre rammed-earth wall on a river-cobble plinth (2 m thick, 17 m to the eave, two
//   rows of small windows high up), an iron-studded gate under a stone lintel on +Z, a continuous grey-black
//   tile roof ring with upturned eaves, white ridge mortar, drip tiles and rafter ends. Inside: 32 bays x
//   (ground floor of kitchens + three galleries at 4.2 / 8.4 / 12.6 m) with posts, turned balusters, worn rails,
//   joist ends, plank doors with red couplets, shuttered windows, benches, baskets, tools; hung at every bay:
//   paired red lanterns, tea trays on cantilevered racks, laundry on poles, chilli and maize strings, herb
//   bundles, birdcages, door curtains. Court: concentric cobbles with slab paths and an eave-drip gutter, a
//   swept-roof ancestral shrine with incense burner, a well with a turning windlass, a turning stone mill, jars,
//   table and stools, hens and a file of ducks that scatter from the camera, kitchen smoke and sun shafts.
//   The court is a village on an ordinary market morning: some fifty villagers under conical hats, two instanced figures (standers who bend to their work, carriers with
//   shoulder poles who pace the paths) with their ground shadows; five stalls under cloth awnings along the cross path with sellers and buyers; people bowing at the
//   two burners, at the well and the washing, at the mill, turning the crop on the drying mats, unloading the handcart, talking in knots; the earth god's little house with a bronze burner and its incense thread behind the hall,
//   washing day at the well (water jars, buckets, a frame of washing in the breeze) beside the low table with stools and steaming bowls, the stone
//   mill among sacks and winnowing trays, and round tea trays 1.2 m across laid out on straw mats in rosettes, rows and fans on the open cobbles;
//   thirty hens, a file of twelve white ducks. The hall, the well roof and the washing throw long shadows across the cobbles. By the kitchen doors on
//   the sunlit side stand three banana clumps and a persimmon hung with fruit; in one bay in five a songbird hops between the perches of its cage.
//
// SPACE (local): origin at the centre of the court floor, +Y up, gate toward +Z. To match the brief (gate on
//   the south side, world X east / Z north) the world should use hero.object.rotation.y = Math.PI.
//   radius 52 (outer eave; apron skirt to 57), height 20.6 (ridge), post line radius 39, court 78 m across.
//
// OPTS
//   palette      array of 7 hex strings (brief order: mist, earth, tile, timber, tea green, lantern red, far blue)
//   sunDir       [x,y,z] direction TO the sun in hero-local space. If omitted the hero finds the first
//                DirectionalLight in the scene it is added to and follows it (used for the analytic roof / wall /
//                gallery shadows and for the shafts). hero.setSun(v3) overrides at any time.
//   lanternGlow  emissive multiplier of the red lanterns (default 1.1; about 0.75 keeps them lantern-red in sun and shade by day; 2.6 and more at night)
//   shafts       0..1 sun-shaft intensity (default 0.4); hero.setShafts(x) lets the world raise it with u
//   fill         [r,g,b] linear light that fills the ring's own shade inside the walls: the open sky overhead, and (warmer, growing toward the lit side) the
//                sunlit galleries opposite (default [0.3, 0.38, 0.55]); hero.setFill(r, g, b)
//   phases       { windlass, bucket, mill }: where the well's windlass, its bucket and the millstone stand in their cycles when the clock starts (radians; default 0)
//   folk         villagers to stand or walk outside the walls, in the hero's own instanced figures (hero-local): [{ x, z, y, heading, bend, speed }] stands,
//                [{ x, z, y, walk: { dir, half } }] paces `half` metres each way along `dir` (radians, 0 = local +x)
//   smoke        false to leave the kitchen smoke to the world (default true)
//   animals      false to leave out hens and ducks (default true)
//   festival     true/false forces the New-Year variant (twice the lanterns); default: by seed (1 in 6)
//   extraSmoke   [[x,y,z,scale?], ...] more kitchen-smoke bases (hero-local), e.g. under the climb-out line
//   sky          [r,g,b] linear colour of the sky above: the roof tiles take it as fill and as a sheen at grazing angles (default [0.4, 0.5, 0.7]); hero.setSky(r, g, b)
//   shade        [r,g,b] what the cast shadows of the hall, the well roof and the washing multiply the cobbles by (default a cool [0.42, 0.47, 0.6])
//   mist         { uMist: { value: Vector4(top outside (world y), top inside the court (above the ring's base), k outside, k inside) }, uMistCol: { value: Color } } shared
//                uniforms of the world's height mist: surfaces below the (noisy) top dissolve into the mist colour
//
// PROGRESS HOOKS (nothing here runs on wall-clock for scripted beats)
//   hens and ducks scatter from the camera's ground point automatically (camera passed to update()).
//   hero.setProgress(u) : u in 0..1 over the lap; slides a pole of washing out of the west gallery
//                         and raises the shaft intensity toward the end of the lap (optional).
//   hero.setShafts(x), hero.setLanternGlow(x), hero.setSun(dirLocal), hero.setBounce(r, g, b), hero.setWet(0..1)
//
// ALSO EXPORTED: Soup (the geometry accumulator) and buildRing(ctx, opts): a lighter ring on the same dimensions and
//   shader programs for the rest of the village (lod 1 = ring E with its inner ring, lod 2 = far rings; opts.square
//   rounds it into a square). The world scales and places them.
//
// ANCHORS (hero-local; all positions [x,y,z])
//   lap          { center, radius: 34.5, y: 10.5, startAngle, sweep, points[] } the anticlockwise 265 degree lap
//                of the brief (as flown with rotation.y = PI). Hard structure (posts, rails, eave) stays >= 4.4 m
//                from it; only soft hung things (lanterns, trays, laundry) come to about 2 m.
//   flyThrough   ordered points: up the outer wall, over the ridge, sink into the court, the lap, climb out over
//                the roof on the sun side. >= 6 m clear of hard structure except the ridge crossing (4 m, as the
//                brief asks for tiles 3 m below) and the lap (4.4 m).
//   gate         { position, facing } outer face of the gate (mist pours out here); gateInside likewise.
//   courtCenter, wellTop, shrine, incense, mill : points of interest in the court.
//   portalSeat   { position, facing } a free seat 4 m above the court axis in front of the shrine steps, facing
//                the gate. (The brief seats the real exit in ring E; this is for worlds that end here.)
//   viewpoints   named camera positions with a look-at: lapEast, lapWest, overRidge, above, gateOutside.
//   smokeBases   where the kitchen smoke columns start (so the world can add its own or put shafts through them).
//
// COST  about 150k triangles (167k at New Year), 17 draw calls, no lights, no textures, build about 300 ms (hero.triangles reports it).
// LIGHT expects one warm directional sun (the brief's low ESE sun) plus a cool hemisphere fill and scene fog.
//   All surfaces are MeshStandardMaterial with procedural detail injected (fog and tone handled by three);
//   smoke and shafts are ShaderMaterials with the fog chunks. Lanterns and embers are emissive.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#EEF1EC', '#C9995A', '#474C52', '#33211A', '#4E8A3A', '#D3271B', '#6C90A4'];

// ---------- colour helpers (linear rgb arrays) ----------
const _c = new THREE.Color();
const C = (hex) => { _c.set(hex); return [_c.r, _c.g, _c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const desat = (c, k = 0.7) => { const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return [l + (c[0] - l) * k, l + (c[1] - l) * k, l + (c[2] - l) * k]; };
const jit = (c, rng, a = 0.12) => { const k = 1 + rng.range(-a, a); return [c[0] * k * (1 + rng.range(-a, a) * 0.35), c[1] * k, c[2] * k * (1 + rng.range(-a, a) * 0.35)]; };

// ---------- shared GLSL ----------
const GLSL_NOISE = /* glsl */`
float h11(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm2(vec2 p){ return vn2(p) * .5 + vn2(p * 2.03 + 7.1) * .3 + vn2(p * 4.1 + 3.7) * .2; }
`;

// stones on concentric courses: a jittered Voronoi in metres over (arc, radius). Returns (F1, F2 - F1, the stone's hash), distances in pitches.
const GLSL_COBBLE = /* glsl */`
vec2 gCobD = vec2(0.);   // from the pixel to the centre of its stone, in pitches (arc, radius)
vec3 cobVor(float rr, float a01, float pitch, float jit, float seed){
  float ri = floor(rr / pitch), F1 = 9., F2 = 9., hid = 0.;
  for (int j = -1; j <= 1; j++) {
    float rj = ri + float(j);
    if (rj >= 0.) {
      float rc = (rj + .5) * pitch, n = max(5., floor(6.2831 * rc / (pitch * 1.2))), a = a01 * n + h11(rj * 1.37 + seed) * 7., ai = floor(a);
      for (int i = -1; i <= 1; i++) {
        float ci = ai + float(i); vec2 id = vec2(mod(ci, n), rj) + seed;
        vec2 jt = (vec2(h21(id + 2.2), h21(id + 6.1)) - .5) * jit;
        vec2 d = vec2((ci + .5 + jt.x - a) / n * 6.2831 * rc, (rj + .5 + jt.y) * pitch - rr) / pitch;
        float dd = length(d);
        if (dd < F1) { F2 = F1; F1 = dd; hid = h21(id + 4.4); gCobD = d; } else if (dd < F2) { F2 = dd; }
      }
    }
  }
  return vec3(F1, F2 - F1, hid);
}`;

// walkers (aBird.y = 2: a long thin loop about home, to and fro; floor(aBird.x) picks its direction in sixteenths of a turn) and
// standers (aBird.y = 3: fract(aBird.x) is the heading in turns): offset from home and heading
const GLSL_PERSON = /* glsl */`
void personMove(vec4 ab, float t, out vec2 off, out float head){
  float ph = ab.x;
  if (ab.y < 2.5) { float ld = floor(ph) * .3927, a = fract(ph) * 6.283 + t * ab.z, cl = cos(ld), sl = sin(ld);
    vec2 e = vec2(sin(a), cos(a) * .2) * ab.w, de = vec2(cos(a), -sin(a) * .2) * sign(ab.z);
    off = vec2(e.x * cl - e.y * sl, e.x * sl + e.y * cl); vec2 dv = vec2(de.x * cl - de.y * sl, de.x * sl + de.y * cl); head = atan(dv.x, dv.y);
  } else { off = vec2(0.); head = fract(ph) * 6.283 + .2 * sin(t * .43 + ph * 31.); }
}`;

// analytic shadow of the ring on itself: roof planes, gallery floors and the wall cylinder
const glslShadow = (P) => /* glsl */`
uniform vec4 uInner;
float tuAnn(vec3 p, vec3 s, float y0, float r0, float r1){
  float t = (y0 - p.y) / max(s.y, .04);
  float r = length(p.xz + s.xz * t);
  float inside = smoothstep(r0 - .3, r0 + .3, r) * (1. - smoothstep(r1 - .3, r1 + .3, r));
  return 1. - inside * smoothstep(.05, .5, t);
}
float tuShadow(vec3 p, vec3 s){
  float sh = tuAnn(p, s, ${(P.eaveIn + 0.5).toFixed(2)}, ${P.rEaveIn.toFixed(2)}, ${P.rEaveOut.toFixed(2)});
  sh *= tuAnn(p, s, ${(P.eave + 0.7).toFixed(2)}, ${P.rPost.toFixed(2)}, ${(P.R + 1.5).toFixed(2)});
  sh *= tuAnn(p, s, ${(P.ridgeY - 1.2).toFixed(2)}, ${(P.rRidge - 3.6).toFixed(2)}, ${(P.rRidge + 3.2).toFixed(2)});
  sh *= tuAnn(p, s, ${P.floors[1].toFixed(2)}, ${(P.rPost - 0.5).toFixed(2)}, ${P.rBack.toFixed(2)});
  sh *= tuAnn(p, s, ${P.floors[2].toFixed(2)}, ${(P.rPost - 0.5).toFixed(2)}, ${P.rBack.toFixed(2)});
  sh *= tuAnn(p, s, ${P.floors[3].toFixed(2)}, ${(P.rPost - 0.5).toFixed(2)}, ${P.rBack.toFixed(2)});
  sh = mix(sh, sh * tuAnn(p, s, uInner.x, uInner.y, uInner.z), uInner.w);
  float a = max(dot(s.xz, s.xz), 1e-4), b = dot(p.xz, s.xz), c = dot(p.xz, p.xz) - ${((P.R - 1) * (P.R - 1)).toFixed(1)};
  float disc = b * b - a * c;
  if (disc > 0.) {
    float sq = sqrt(disc), t1 = (-b - sq) / a, t2 = (-b + sq) / a, top = ${P.eave.toFixed(2)};
    sh *= 1. - smoothstep(.3, .8, t1) * (1. - smoothstep(top - .4, top + .4, p.y + s.y * t1));
    sh *= 1. - smoothstep(.3, .8, t2) * (1. - smoothstep(top - .4, top + .4, p.y + s.y * t2));
  }
  return sh * smoothstep(.0, .08, s.y);
}`;

// procedural surface detail, by material kind
const glslDetail = (P) => ({
  plain: /* glsl */`{ vec3 p = vLp; float n = fbm2(p.xz * .9 + p.y * 1.7 + uSeed), g = vn2(vec2((p.x + p.z) * 7., p.y * 1.1));
    vec3 c = diffuseColor.rgb; float wl = smoothstep(.2, .38, dot(c, vec3(.333)));
    float s = atan(p.x, p.z + step(abs(p.x) + abs(p.z), 1e-4)) * length(p.xz);
    c *= (.8 + .34 * n) * (.93 + .14 * g);
    float streak = vn2(vec2(s * 2.3, p.y * .22 + 5.)) * (.6 + .4 * vn2(vec2(s * .4, 2.)));
    c = mix(c, c * vec3(.72, .64, .52), wl * smoothstep(.3, .62, streak) * .5);
    c = mix(c, vec3(.33, .2, .09) * (.7 + .6 * g), wl * smoothstep(.63, .68, fbm2(vec2(s * .33, p.y * .45) + uSeed)) * .8);
    diffuseColor.rgb = c; }`,
  earth: /* glsl */`{ vec3 p = vLp; float s = atan(p.x, p.z) * ${P.R.toFixed(1)}; vec3 c = diffuseColor.rgb;
    float n1 = fbm2(vec2(s, p.y) * .33 + uSeed), n2 = vn2(vec2(s, p.y) * 3.1), pl = ${P.plinth.toFixed(2)};
    float eDet = 1. - smoothstep(.04, .16, fwidth(p.y));
    if (p.y < pl + (n1 - .5) * .3) {
      vec2 g = vec2(s * 2.5, p.y * 3.1); g.x += floor(g.y) * .5; vec2 id = floor(g), f = fract(g) - .5;
      f += (vec2(h21(id), h21(id + 9.1)) - .5) * .28; float d = length(f * vec2(1., 1.2)), stone = smoothstep(.52, .36, d);
      vec3 sc = mix(vec3(.25, .24, .22), vec3(.42, .38, .32), h21(id + 3.3)); sc = mix(sc, vec3(.27, .31, .34), step(.72, h21(id + 5.7)));
      c = mix(vec3(.07, .06, .05), sc * (.7 + .9 * (.5 - d)), stone);
      c = mix(c, vec3(.09, .15, .05), smoothstep(.45, .75, n1) * .65 * (1. - smoothstep(0., 1.7, p.y)));
      gRough = mix(1., .6, stone);
    } else {
      vec2 w = vec2(s, p.y);
      float lift = (p.y + (vn2(vec2(s * .3, 7.)) - .5) * .12) / .46, li = floor(lift), lf = fract(lift);
      c *= mix(mix(.9, .7, eDet), 1., smoothstep(0., .07, lf) * smoothstep(1., .9, lf)) * (.9 + .2 * h11(li + uSeed));
      { float hs = (fract(s / 3.7 + h11(floor(li / 4.)) * .5) - .5) * 3.7, hk = step(mod(li, 4.), .5) * step(4.5, p.y);
        c *= 1. - .8 * hk * eDet * (1. - smoothstep(.08, .15, length(vec2(hs, (lf - .5) * .46)))); }
      float fj = abs(fract(s / 3.7 + h11(li) * .5) - .5); c *= 1. - .07 * smoothstep(.006, .0, fj);
      float g1 = vn2(w * 7.), g2 = vn2(w * 21.); vec2 pw = w * 15., pid = floor(pw);
      float peb = h21(pid + 3.), prd = smoothstep(.42, .2, length(fract(pw) - .5 + (vec2(h21(pid + 1.3), h21(pid + 8.1)) - .5) * .4));
      c *= (.84 + .3 * n1) * (.86 + .28 * g2) * (.94 + .12 * n2);
      c *= 1. + (step(.88, peb) * .22 - step(peb, .1) * .2) * prd * (.4 + .6 * g1);
      c *= 1. - .24 * smoothstep(.58, .78, vn2(w * vec2(1.1, 2.3) + 11.));
      c *= mix(vec3(1.07, .99, .88), vec3(.93, 1., 1.07), fbm2(w * .09 + uSeed * 1.7));
      c = mix(c, vec3(dot(c, vec3(.3, .5, .2))) * vec3(1.1, 1., .84), .2 + .15 * smoothstep(6., 16., p.y));
      c *= mix(.6, 1.05, smoothstep(pl - 1., pl + 7., p.y + (n1 - .5) * 4.));
      float st = vn2(vec2(s * .9, p.y * .05 + 3.)) * vn2(vec2(s * .23 + 9., 1.5)); c *= 1. - .34 * smoothstep(.3, .7, st) * smoothstep(5., 16., p.y);
      c = mix(c, c * vec3(1.16, 1.12, 1.02) + .025, smoothstep(.69, .72, fbm2(vec2(s * .1, p.y * .15) + uSeed * 3.)) * .6);
      float ci = floor(s / 17.), ck = abs(fract(s / 17. + (vn2(vec2(p.y * .45, ci)) - .5) * .09) - .5);
      c *= 1. - .55 * smoothstep(.004, .0, ck) * step(.45, h11(ci + uSeed)) * smoothstep(pl, pl + 3., p.y);
      c = mix(c, c * vec3(.62, .74, .5), smoothstep(.55, .8, n1) * (1. - smoothstep(pl, pl + 3.5, p.y)) * .6);
    }
    diffuseColor.rgb = c; }`,
  tile: /* glsl */`{ vec2 tc = vTile, fwv = fwidth(tc); float det = 1. - smoothstep(.14, .46, max(fwv.x, fwv.y * .8));
    float col = floor(tc.x), fx = fract(tc.x), row = floor(tc.y), fy = fract(tc.y);
    float h = .5 - .5 * cos(6.2831 * fx), hs = h21(vec2(col, row) + uSeed);
    float detX = 1. - smoothstep(.24, .62, fwv.x), detY = 1. - smoothstep(.22, .58, fwv.y);   // ribs and courses blur away each on its own axis: a roof seen along its ribs keeps them
    float nearT = 1. - smoothstep(.012, .075, max(fwv.x, fwv.y));   // within a dozen metres: a flat-backed cover tile over a narrow dark channel, a lip at the end of every tile, grain
    h = mix(h, smoothstep(.05, .46, 1. - abs(2. * fx - 1.)), nearT);
    vec3 c0 = diffuseColor.rgb, c = c0 * mix(1., .7 + .55 * hs, det);
    c *= mix(1., mix(.5, 1.14, h), detX); c *= 1. - .4 * smoothstep(.16, .0, fy) * detY;
    c *= 1. - nearT * (.5 * smoothstep(.075, .0, fy) - .2 * smoothstep(.0, .075, fy) * smoothstep(.24, .09, fy));
    c *= mix(1., (.78 + .44 * vn2(vLp.xz * 19. + vLp.y * 13.)) * (.9 + .2 * h21(vec2(col, row) + 7.3)), nearT);
    float m = fbm2(vLp.xz * .2 + uSeed), m2 = vn2(vLp.xz * 1.9);
    float st2 = vn2(vec2(tc.x * .55 + uSeed, tc.y * .045)), st3 = vn2(vec2(tc.x * .16, tc.y * .11 + uSeed * 2.));   // rain streaks a tile or two wide down the slope, and weathered patches: what a roof 40 m off is made of
    c *= (.74 + .52 * st2) * (.82 + .36 * st3);
    // pattern that stays when the single tiles have blurred away: course bands, rain streaks down the slope, repairs, lichen, moss
    float band = h11(floor(tc.y / 5.) + uSeed), streak = vn2(vec2(tc.x * .07, tc.y * .4 + uSeed));
    c *= (1. + .2 * (band * 2. - 1.)) * (1. - .26 * smoothstep(.42, .8, streak));
    float rp = h21(floor(vec2(tc.x / 13., tc.y / 4.)) + uSeed * 3.), rq = smoothstep(.3, .6, vn2(vLp.xz * .11 + uSeed * 5.));
    c = mix(c, c * vec3(.9, 1.02, 1.22) * 1.25, step(.86, rp) * rq * .6);        // newer blue-grey tiles
    c = mix(c, c * vec3(1.5, 1.12, .86), step(rp, .12) * rq * .55);              // older brown ones
    float eaveK = max(1. - smoothstep(0., 7., tc.y), smoothstep(40., 47., tc.y)), ridgeK = 1. - smoothstep(0., 2.6, abs(tc.y - 21.2));
    c = mix(c, vec3(.36, .38, .31) * (.75 + .5 * m2), smoothstep(.6, .74, fbm2(vLp.xz * 1.3 + 17. + uSeed)) * .3);
    c = mix(c, vec3(.07, .1, .04) * (.6 + .9 * m2), smoothstep(.6 - .14 * max(eaveK, ridgeK), .86 - .12 * max(eaveK, ridgeK), m) * (1. - h * .7 * det) * (.3 + .3 * max(eaveK, ridgeK)));
    { float nearD = 1. - smoothstep(9., 24., length(vViewPosition)), ty = tc.y + .5 * step(.5, fract(col * .5)), fy2 = fract(ty), tid = h21(vec2(col, floor(ty)) + 3.1 + uSeed);
      c *= 1. - nearD * (.6 * smoothstep(.16, .03, fy2) - .12 * smoothstep(.16, .3, fy2) * smoothstep(.5, .3, fy2));
      c *= 1. + nearD * .5 * (tid - .5);
      c = mix(c, vec3(.06, .085, .035) * (.7 + .6 * m2), nearD * step(.94, tid) * .5);   // a tile here and there gone to moss
      diffuseColor.rgb = c * (1. - .3 * uWet); gRough = mix(mix(mix(.6, .36, h * detX), .9, nearD * .8), .24, uWet); gSlope = sin(6.2831 * fx) * detX; gRib = mix(1., .45 + 1.1 * h, detX); } }`,
  hung: /* glsl */`{ vec3 p = vLp; diffuseColor.rgb *= (.8 + .3 * vn2(p.xz * 6. + p.y * 5.)) * (.9 + .2 * vn2(p.xz * 31. + p.y * 27.)); }`,
  cobble: /* glsl */`{ vec2 q = vLp.xz; float r = length(q); if (r < 1e-3) { q = vec2(0., 1e-3); r = 1e-3; }
    float ang = atan(q.x, q.y), a01 = ang / 6.2831 + .5, rp = ${P.rPost.toFixed(2)}, re = ${P.rEaveIn.toFixed(2)}, rw = ${P.R.toFixed(2)};
    float fp = max(length(dFdx(vLp.xz)), length(dFdy(vLp.xz)));   // the larger axis of the pixel's footprint on the floor, in metres
    float mo = fbm2(q * .16 + uSeed), big = fbm2(q * .03 + uSeed * .7), pat = fbm2(q * .18 + uSeed * 1.9), wr = vn2(q * .6 + uSeed) - .5;
    // river cobbles a hand long, with patches a few metres across re-laid in big flags; both on wavering concentric courses
    bool flag = pat > .6; float pitch = flag ? .52 : .25;
    vec3 v = flag ? cobVor(r + wr * .2, a01, .52, .46, uSeed + 31.) : cobVor(r + wr * .12, a01, .25, .42, uSeed);
    float det = 1. - smoothstep(.3, .9, fp / pitch);
    float joint = 1. - smoothstep(flag ? .025 : .04, flag ? .075 : .12, v.y);
    float hs = v.z, hv = fract(hs * 7.13);
    vec3 base = diffuseColor.rgb;
    vec3 hue = hs < .42 ? vec3(1.1, 1., .84) : (hs < .78 ? vec3(1.) : vec3(.84, .95, 1.12));   // buff, grey, blue-grey
    vec3 stone = base * mix(.84, 1.14, hv) * hue * mix(.86, 1.05, smoothstep(0., .35, v.y));
    if (flag) stone *= .9 + .2 * vn2(q * 7. + hs * 40.);
    float nearC = 1. - smoothstep(.006, .03, fp);   // within about eight metres of the eye
    { vec2 tg = vec2(cos(ang), -sin(ang)), rd = vec2(sin(ang), cos(ang)), sx = normalize(uSun.xz + vec2(1e-4, 0.));   // the stone's own dome: lit on the sun's side, shaded on the other, a dark seam round it
      float dome = dot(-gCobD, vec2(dot(sx, tg), dot(sx, rd)));
      stone *= 1. + nearC * (.5 * dome * smoothstep(0., .25, uSun.y) - .22 * smoothstep(.2, .0, v.y)); }
    vec3 c = mix(base * .92, mix(stone, base * mix(.6, .42, nearC), joint), det);   // the joints are the stones' own mean, darker: the pattern fades to its own average
    c *= mix(1., .82 + .36 * fbm2(q * .45 + uSeed), 1. - smoothstep(.7, 2.4, fp));   // wear and damp that stay when the stones have blurred away
    c *= mix(1., .9 + .2 * vn2(q * 1.7), 1. - smoothstep(.2, .6, fp));
    c *= (.8 + .4 * big) * mix(vec3(1.05, 1., .93), vec3(.95, 1., 1.06), fbm2(q * .011 + uSeed * 1.3));
    c *= 1. - .1 * smoothstep(.42, .5, abs(fract(r / 6.5 + .3) - .5));   // a darker band of set stones every 6.5 m
    { float tr = max(1. - smoothstep(1.3, 4.2, abs(q.x)), 1. - smoothstep(1.1, 3.6, abs(q.y - 6.)));   // feet have polished the cobbles beside the slab paths and under the galleries
      tr = max(tr, 1. - smoothstep(0., 3.4, abs(r - ${(P.rPost - 2.6).toFixed(2)}))); c *= 1. + .2 * tr * (.6 + .4 * vn2(q * .9)); }
    { // moss: out of the joints onto the stones' edges, and in patches at the foot of the galleries, along the gutter and round the well
      float zone = max(max(smoothstep(rp - 7., rp - 1.5, r), 1. - smoothstep(.2, 2.2, abs(r - re))), 1. - smoothstep(2., 5.5, length(q - uWell.xy)));
      float mossP = smoothstep(.5, .72, fbm2(q * .33 + uSeed * 3.)) * zone, mossJ = smoothstep(.42 - .14 * nearC, .7, mo) * (1. - smoothstep(0., .3, v.y)) * det;
      c = mix(c, mix(vec3(.07, .11, .04), vec3(.17, .24, .07), vn2(q * 2.7 + 5.)), clamp(mossJ * .85 + mossP * .6, 0., .85)); }
    // slab paths: axis gate-shrine, cross axis, ring walk under the galleries, medallion
    float slab = max(1. - smoothstep(1.25, 1.4, abs(q.x)), 1. - smoothstep(1.0, 1.15, abs(q.y - 6.)));
    slab *= 1. - smoothstep(rw + 7.5, rw + 8.5, r);
    slab = max(slab, smoothstep(rp - .55, rp - .4, r) * (1. - smoothstep(rw + .4, rw + .6, r)));
    slab = max(slab, 1. - smoothstep(2.6, 2.75, length(q - vec2(0., 6.))));
    vec2 sg = (r > rp - .6 && r < rw + .6) ? vec2(ang * rp / 1.9, (r - rp) / .9) : q / vec2(1.3, .9) + vec2(0., step(.0, q.x) * .5);
    vec2 sid = floor(sg), sf = abs(fract(sg) - .5);
    vec3 sl = vec3(.3, .29, .27) * (.6 + .55 * h21(sid + 1.7)) * (.8 + .4 * vn2(q * 9.)) * (.8 + .4 * fbm2(q * .9 + uSeed));
    sl *= 1. - .75 * smoothstep(.44, .5, max(sf.x, sf.y)) * (1. - smoothstep(.3, .9, fp / .9));
    c = mix(c, sl, slab);
    // eave-drip gutter with ripple rings
    float gut = 1. - smoothstep(.2, .32, abs(r - re));
    float k = floor(ang * re / .9), tt = fract(uTime * .65 + h11(k) * 7.), dd = length(vec2((fract(ang * re / .9) - .5) * .9, r - re));
    float ring = smoothstep(.035, .0, abs(dd - tt * .38)) * (1. - tt);
    c = mix(c, vec3(.05, .06, .065) + ring * vec3(.5, .56, .6), gut);
    float wet = smoothstep(.44, .72, fbm2(q * .06 + uSeed * 2.)) * (1. - slab * .5); wet = max(wet, uWet * (.5 + .5 * mo));
    c *= mix(1., .72, wet);
    { float pl = 0., ao = 0.;   // under every set scene of the court: a soft contact shade by day, the pool of its lanterns by night
      for (int i = 0; i < 12; i++) { vec4 s = uScenes[i]; vec2 dq = q - s.xy; float d2 = dot(dq, dq); pl += s.w * exp(-d2 / max(s.z * s.z, .01)); ao = max(ao, s.w * (1. - smoothstep(.5, 2.6, sqrt(d2)))); }
      c *= 1. - .25 * ao; gPool = pl; }
    gBounce = mix(.06, 1.3, smoothstep(rp - 20., rp - 1., r)) * (.8 - .2 * cos(ang * ${P.bays.toFixed(1)}));   // light off the galleries (lanterns at night) pools at their foot, bay by bay
    float out_ = smoothstep(rw + 4.5, rw + 8., r + (mo - .5) * 3.) * (1. - slab);
    c = mix(c, vec3(.34, .27, .17) * (.62 + .6 * mo), out_);
    diffuseColor.rgb = c; gRough = mix(1., .25, max(wet * .8, gut)); }`,
});

// ---------- materials: MeshStandardMaterial + injected detail, analytic ring shadow, wind and glow ----------
function makeMat(P, U, kind, o = {}) {
  const hung = !!o.hung, tile = kind === 'tile', bird = !!o.bird, shadow = o.shadow !== false && !tile;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 0.9, metalness: 0, side: o.side ?? THREE.FrontSide });
  const D = glslDetail(P);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    if (!sh.uniforms.uTrue) sh.uniforms.uTrue = { value: 1 };     // (a ring that sets nothing out at true size: the ring's own metres)
    if (!sh.uniforms.uPlanP) sh.uniforms.uPlanP = { value: 2 };   // (a round ring)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      varying vec3 vLp; varying vec4 vWm; uniform float uTime; uniform float uSlide; uniform vec3 uCam;
      ${hung ? 'attribute vec3 aPivot; attribute vec3 aWind; attribute float aGlow; varying float vGlow; varying vec3 vHd; uniform float uTrue;' : ''}
      ${tile ? 'attribute vec2 aTile; varying vec2 vTile;' : ''}
      ${bird ? 'attribute vec4 aBird;' + GLSL_PERSON : ''}`)
      .replace('#include <color_vertex>', `#include <color_vertex>
      ${bird ? 'if (color.r > 1.9) vColor.rgb = color.rgb - 2.;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      ${hung ? `{ vec3 d = transformed - aPivot; float ph = aWind.x, w = max(-d.y, 0.);
        vec2 rad = normalize(aPivot.xz + vec2(1e-3, 0.)), tn = vec2(rad.y, -rad.x);
        float gust = .55 + .45 * sin(uTime * .37 + atan(rad.x, rad.y) * 2.);
        float sw = max(aWind.y, 0.);
        float a1 = sw * gust * (sin(uTime * 1.25 + ph) + .45 * sin(uTime * 2.3 + ph * 1.7));
        float a2 = sw * gust * sin(uTime * .95 + ph * 2.1);
        transformed.xz += (rad * a1 + tn * a2 * .7) * w;
        transformed.xz += rad * aWind.z * gust * w * sin(uTime * 2.7 + ph + dot(transformed.xz, tn) * 2.3 + w * 1.6);
        if (aGlow < -1.5 && aGlow > -2.5) transformed.xz += rad * (1. - uSlide) * 2.3;
        if (aGlow < -2.5 && aGlow > -3.5) {   // a caged songbird: it sits, then hops to the other perch
          float hp = uTime * .8 + ph, cyc = fract(hp), sd2 = step(.5, fract(hp * .5)) * 2. - 1., mv = smoothstep(0., .16, cyc);
          transformed.xz += tn * mix(-sd2, sd2, mv) * .1; transformed.y += sin(mv * 3.1416) * .06 + .012 * step(.6, cyc) * abs(sin(uTime * 11. + ph)); }
        if (aGlow < -3.5) {   // the yard life of the small rings (buildYardLife), each thing about the place it stands on (aPivot, its feet), at true size (uTrue: one metre in the ring's own):
          // hens (-4) wander and peck; villagers at their work (-5: aWind.y the bend, aWind.z the heading) lean over it from the hips; a carrier (-6: aWind.y
          // the half beat, aWind.z the beat's bearing) paces a long thin loop. All on the world's clock, each from its own phase (aWind.x)
          vec3 b = d; vec2 off = vec2(0.); float head, lift = 0.;
          if (aGlow > -4.5) {
            head = ph * 6.283 + sin(uTime * .33 + ph * 9.) * 1.7; off = vec2(sin(uTime * .23 + ph * 20.), cos(uTime * .19 + ph * 31.)) * 1.2 * uTrue;
            b.y -= pow(max(0., sin(uTime * 2.3 + ph * 40.)), 6.) * step(0., sin(uTime * .4 + ph * 13.)) * max(b.z, 0.) * .9;
          } else if (aGlow > -5.5) {
            head = aWind.z + .2 * sin(uTime * .43 + ph * 31.);
            float bend = aWind.y * (.55 + .45 * sin(uTime * (.5 + .6 * fract(ph * 7.)) + ph * 47.)), hip = .97 * uTrue;
            if (b.y > hip) { float y = b.y - hip, cb = cos(bend), sb = sin(bend); b = vec3(b.x, hip + y * cb - b.z * sb, b.z * cb + y * sb); }
          } else {
            float a = ph * 6.283 + uTime * 1.4 * uTrue / max(aWind.y, .5), cl = cos(aWind.z), sl = sin(aWind.z);
            vec2 e = vec2(sin(a), cos(a) * .12) * aWind.y, de = vec2(cos(a), -sin(a) * .12);
            off = vec2(e.x * cl - e.y * sl, e.x * sl + e.y * cl); vec2 dv = vec2(de.x * cl - de.y * sl, de.x * sl + de.y * cl); head = atan(dv.x, dv.y);
            float st = sin(uTime * 6.5 + ph * 50.); b.z += st * .2 * uTrue * sign(b.x) * (1. - smoothstep(0., .85 * uTrue, b.y)) * step(abs(b.x), .2 * uTrue); lift = .025 * uTrue * abs(st);
          }
          float ch = cos(head), shd = sin(head);
          transformed = aPivot + vec3(b.x * ch + b.z * shd + off.x, b.y + lift, -b.x * shd + b.z * ch + off.y); }
        vGlow = aGlow; vHd = d; }` : ''}
      ${bird ? `{ float ph = aBird.x, t = uTime; vec3 b = transformed; float head, lift = 0.; vec2 off;
        vec2 home = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
        if (aBird.y < .5) {
          head = ph * 6.283 + sin(t * .33 + ph * 9.) * 1.7;
          off = vec2(sin(t * .23 + ph * 20.), cos(t * .19 + ph * 31.)) * 1.5;
          vec2 away = home + off - uCam.xz; float dl = max(length(away), .01), sc = 1. - smoothstep(5., 16., dl);
          off += away / dl * sc * 5.; lift = sc * abs(sin(t * 9. + ph * 30.)) * .35;
          head = mix(head, atan(away.x, away.y), sc);
          float pk = pow(max(0., sin(t * 2.3 + ph * 40.)), 6.) * step(0., sin(t * .4 + ph * 13.)) * (1. - sc);
          b.y -= pk * max(b.z, 0.) * .9;
        } else if (aBird.y < 1.5) {
          float a = ph + t * aBird.z; off = vec2(sin(a), cos(a)) * aBird.w; head = a + 1.5708 * sign(aBird.z);
          vec2 away = home + off - uCam.xz; float dl = max(length(away), .01), sc = 1. - smoothstep(5., 15., dl);
          off += away / dl * sc * 3.5; lift = sc * abs(sin(t * 8. + ph * 9.)) * .2;
          b.x += sin(t * 7. + ph * 50.) * .05 * b.y * 3.;
        } else {   // people: walkers stride, standers lean over their work from the hips
          personMove(aBird, t, off, head);
          if (aBird.y < 2.5) { float st = sin(t * 6.5 + ph * 50.); b.z += st * .2 * sign(b.x) * (1. - smoothstep(0., .85, b.y)) * step(abs(b.x), .2); lift = .025 * abs(st); }
          else { float bend = aBird.w * (.55 + .45 * sin(t * aBird.z + ph * 47.));
            if (b.y > .85) { float y = b.y - .85, cb = cos(bend), sb = sin(bend); b = vec3(b.x, .85 + y * cb - b.z * sb, b.z * cb + y * sb); } }
        }
        float ch = cos(head), shd = sin(head);
        transformed = vec3(b.x * ch + b.z * shd + off.x, b.y + lift, -b.x * shd + b.z * ch + off.y); }` : ''}
      #ifdef USE_INSTANCING
        vLp = (instanceMatrix * vec4(transformed, 1.)).xyz;
      #else
        vLp = transformed;
      #endif
      vWm = vec4((modelMatrix * vec4(vLp, 1.)).xyz, modelMatrix[3].y);
      ${hung ? `if (aWind.y < 0.) { vec2 dc = transformed.xz - aPivot.xz; float gb = .6 + .4 * sin(uTime * .37 + aWind.x);
        transformed.y += aWind.y * length(dc) * gb * (sin(uTime * 1.7 + aWind.x) + .4 * sin(uTime * 3.1 + aWind.x * 2.3)); }` : ''}
      ${tile ? 'vTile = aTile;' : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
      uniform vec3 uSun; uniform vec3 uBounce; uniform vec3 uFill; uniform vec3 uSkyC; uniform vec4 uMist; uniform vec3 uMistCol; uniform float uTime, uSeed, uGlow, uWet, uPlanP; varying vec3 vLp; varying vec4 vWm; float gRough = 1.; float gSlope = 0.; float gBounce = 1.; float gPool = 0.; float gRib = 1.; float gSh = 1.;
      ${hung ? 'varying float vGlow; varying vec3 vHd; float gLan = 1.;' : ''}${tile ? 'varying vec2 vTile;' : ''}${kind === 'cobble' ? 'uniform vec4 uScenes[12]; uniform vec3 uWell;' : ''}
      ${GLSL_NOISE}${kind === 'cobble' ? GLSL_COBBLE : ''}${shadow ? glslShadow(P) : ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      ${D[kind] || ''}
      ${hung ? `if (vGlow > .5) {   // lit paper over eight ribs: the light inside is faint by day (the vertex colours carry a bright belly and darker caps), so the sun still models the form
        vec2 hv = vHd.xz; if (dot(hv, hv) < 1e-8) hv = vec2(1e-4, 0.);
        float rb = abs(fract(atan(hv.y, hv.x) / 6.2832 * 8.) - .5), nearL = 1. - smoothstep(16., 30., length(vViewPosition));
        gLan = 1. - .55 * nearL * (1. - smoothstep(.04, .11, rb)); diffuseColor.rgb *= .9 * gLan; }
      if (vGlow < -.5 && vGlow > -1.5) { float s = h21(floor(vLp.xz * 36.) + floor(vLp.y * 3.));
        diffuseColor.rgb *= mix(vec3(.5, .56, .38), vec3(1.3, 1.25, .9), s);
        if (s > .82) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.36, .25, .09), .65); }
      if (vGlow < -.1 && vGlow > -.4) { float bl = fbm2(vLp.xz * 1.1 + uSeed), gr = vn2(vLp.xz * 3.7 + 9.);   // awning cloth: bleached in blotches, grimy along the folds
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.333))) * 1.3 + .03, .5 * smoothstep(.3, .7, bl)) * (.68 + .5 * gr); }` : ''}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * gRough, .06, 1.);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      ${tile ? `{ vec3 dpx = dFdx(vViewPosition), dpy = dFdy(vViewPosition); float dux = dFdx(vTile.x), duy = dFdy(vTile.x);
        vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); vec3 g = (dux * r1 + duy * r2) * sign(dot(dpx, r1) + 1e-9);
        float gl = length(g); if (gl > 1e-7) normal = normalize(normal - g / gl * gSlope * .85); }` : ''}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      ${tile ? `{ vec3 tv = normalize(vViewPosition); float tf = 1. - clamp(dot(normal, tv), 0., 1.); tf *= tf;
        float tw = vn2(vec2(vTile.x * .55 + uSeed, vTile.y * .045)) * (.6 + .8 * vn2(vec2(vTile.x * .16, vTile.y * .11 + uSeed * 2.)));
        reflectedLight.indirectDiffuse += uSkyC * .62 * BRDF_Lambert(diffuseColor.rgb);
        reflectedLight.indirectSpecular += mix(uSkyC, vec3(dot(uSkyC, vec3(.333))), .35) * (.03 + .4 * tf) * (1. - .5 * roughnessFactor) * (.35 + 1.3 * tw) * gRib * (.25 + .75 * smoothstep(5., 18., length(vViewPosition))); }` : ''}
      ${kind === 'cobble' ? 'reflectedLight.directDiffuse *= 1.6;   // worn stones under a raking sun: the lit half of a court is a sheet of light, not a grey floor' : ''}
      ${shadow ? `{ float tsh = tuShadow(vLp, uSun); gSh = tsh; reflectedLight.directDiffuse *= tsh; reflectedLight.directSpecular *= tsh;
        float ins = 1. - smoothstep(${(P.R - 2.5).toFixed(1)}, ${(P.R - 1.5).toFixed(1)}, length(vLp.xz));
        reflectedLight.indirectDiffuse += uBounce * BRDF_Lambert(diffuseColor.rgb) * mix(.5, 1., ins) * (1. - .7 * tsh) * gBounce;
        { // the ring's own shade is open to the whole sky and faces the sunlit galleries across the court: a cool fill from overhead, and a warm one that
          // grows toward the lit side. Shade stays shade (a third of the sunlit floor), never a black half
          vec2 sx = normalize(uSun.xz + vec2(1e-4, 0.)); float toLit = clamp(.5 - dot(vLp.xz, sx) / ${(2 * P.rPost).toFixed(1)}, 0., 1.);
          float up = clamp(.5 + .5 * inverseTransformDirection(normal, viewMatrix).y, 0., 1.);
          reflectedLight.indirectDiffuse += (uFill * (.4 + .6 * up) + vec3(1., .8, .56) * dot(uFill, vec3(.3)) * (.25 + .75 * toLit)) * BRDF_Lambert(diffuseColor.rgb) * (1. - tsh) * ins * smoothstep(0., .12, uSun.y); }
        reflectedLight.indirectDiffuse += vec3(1., .52, .2) * (gPool * max(uGlow - 1., 0.) * 1.4) * BRDF_Lambert(diffuseColor.rgb);
        reflectedLight.indirectDiffuse += vec3(1., 1.2, 1.8) * dot(uBounce, vec3(.6)) * BRDF_Lambert(diffuseColor.rgb) * (1. - ins) * (1. - tsh); }` : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      ${hung ? 'totalEmissiveRadiance += vColor.rgb * max(vGlow, 0.) * uGlow * gLan;' : ''}`)
      .replace('#include <fog_fragment>', `{ // THE MIST BY THE THING'S OWN PLACE IN THE RING'S PLAN. Outside the wall (mIn 0) a thing below the sea's top dissolves into the sea, as it always
        // did. Inside the wall's inner face (mIn 1: by the ring's own centre and plan; the square ring by its own rounded square, uPlanP) the court holds
        // its own POOL instead: a shallow pool on the cobbles whose top is the sea's own state (uMist.y over the ring's base, as the world hands it), its
        // noise cut to 0.9 m either way and its upper edge 0.9 m soft, so it never stands over 3.4 m: under the first gallery's rail of the smallest ring
        // (5.16 m x 0.667); it fades in from the floor, 1.6 m under the top. Its strength is the sea's own (uMist.w) times a factor of the place: 2 at the
        // gate, held through the gate bay (10 m from the wall's inner face at the gate) and falling to the court's middle (46 m from the gate), where and
        // beyond which it is 0.3 in drifting wisps: the gate is the ring's one opening, the mist drains to it and lies deepest there, and the world's
        // tongue begins 3 m outside it. In the ring's own roof shadow (gSh) the pool is cool, as the ground's ring shadows are.
        vec2 mA = clamp(abs(vLp.xz), 0., 400.);
        float mR = uPlanP > 2.5 ? pow(pow(mA.x, uPlanP) + pow(mA.y, uPlanP), 1. / uPlanP) : length(vLp.xz);
        float mIn = 1. - smoothstep(${(P.R - 2.5).toFixed(1)}, ${(P.R - 1.5).toFixed(1)}, mR);
        float mGate = 1. - smoothstep(10., 46., length(vLp.xz - vec2(0., ${(P.R - 2).toFixed(1)}))), mWisp = .35 + 1.3 * vn2(vLp.xz * .09 + uTime * vec2(.021, -.013));
        float mTop = mix(uMist.x, uMist.y + vWm.w, mIn), mK = mix(uMist.z, min(uMist.w * mix(.3 * mWisp, 2., mGate), 1.), mIn);
        float mN = (vn2(vWm.xz * .05 + uTime * .03) - .5) * 5. + (vn2(vWm.xz * .21 - uTime * .05) - .5) * 1.8;
        mN *= mix(1., .265, mIn);
        float mLo = mix(4.2, 1.6, mIn), mHi = mix(1.3, .9, mIn);   // outside the wall the sea has a crisp waterline (a soft one draws a second, pale outline round the ring)
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uMistCol * mix(vec3(1.), mix(vec3(.6, .68, .86), vec3(1.), gSh), mIn), mK * (1. - smoothstep(mTop - mLo + mN, mTop + mHi + mN, vWm.y))); }
      #include <fog_fragment>`);
  };
  mat.customProgramCacheKey = () => 'tulou-' + kind + (hung ? 'h' : '') + (bird ? 'b' : '') + P.key;
  return mat;
}

// ---------- geometry accumulator ----------
const _m = new THREE.Matrix4(), _e = new THREE.Euler();
export class Soup {
  constructor(o = {}) {
    this.p = []; this.n = []; this.c = []; this.tile = o.tile ? [] : null; this.ext = o.hung ? [] : null;
    this.M = new THREE.Matrix4(); this.st = []; this.h = [0, 0, 0, 0, 0, 0, 0]; this.tu = 0; this.tv = 0;
  }
  get tris() { return this.p.length / 9; }
  frame(theta, r = 0, y = 0) { this.M.makeRotationY(theta).setPosition(Math.sin(theta) * r, y, Math.cos(theta) * r); return this; }
  push(x, y, z, ry = 0, rx = 0, rz = 0) { this.st.push(this.M.clone()); _m.makeRotationFromEuler(_e.set(rx, ry, rz, 'YXZ')).setPosition(x, y, z); this.M.multiply(_m); return this; }
  pop() { this.M.copy(this.st.pop()); return this; }
  // hung state: pivot (current local coords), phase, swing amplitude, flutter amplitude, glow (-1 = tea speckle, -2 = sliding pole)
  hang(x, y, z, ph = 0, sw = 0, fl = 0, gl = 0) {
    const e = this.M.elements;
    this.h = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14], ph, sw, fl, gl];
  }
  v(x, y, z, nx, ny, nz, col) {
    const e = this.M.elements, h = this.h;
    this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    this.n.push(e[0] * nx + e[4] * ny + e[8] * nz, e[1] * nx + e[5] * ny + e[9] * nz, e[2] * nx + e[6] * ny + e[10] * nz);
    this.c.push(col[0], col[1], col[2]);
    if (this.ext) this.ext.push(h[0], h[1], h[2], h[3], h[4], h[5], h[6]);
    if (this.tile) this.tile.push(this.tu, this.tv);
  }
  // quad a,b,c,d (a,b take colour c0; c,d take c1); flat normal, flipped to agree with `hint` when given
  quad(a, b, c, d, c0, c1 = c0, hint = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { const t = b; b = d; d = t; nx = -nx; ny = -ny; nz = -nz; const tc = c0; if (c0 !== c1) { /* colours follow vertices */ this._q(a, b, c, d, nx, ny, nz, c0, c1, c1, tc); return; } }
    this._q(a, b, c, d, nx, ny, nz, c0, c0, c1, c1);
  }
  _q(a, b, c, d, nx, ny, nz, ca, cb, cc, cd) {
    this.v(a[0], a[1], a[2], nx, ny, nz, ca); this.v(b[0], b[1], b[2], nx, ny, nz, cb); this.v(c[0], c[1], c[2], nx, ny, nz, cc);
    this.v(a[0], a[1], a[2], nx, ny, nz, ca); this.v(c[0], c[1], c[2], nx, ny, nz, cc); this.v(d[0], d[1], d[2], nx, ny, nz, cd);
  }
  // box: centre x,z, base y0; sides shade from col*g0 at the foot to col*g1 at the top; o.skip holds face letters (t b e w s n)
  box(cx, y0, cz, w, h, d, col, o = {}) {
    if (o.ry || o.rx || o.rz) { this.push(cx, y0, cz, o.ry || 0, o.rx || 0, o.rz || 0); this.box(0, 0, 0, w, h, d, col, { ...o, ry: 0, rx: 0, rz: 0 }); this.pop(); return; }
    const x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h, z0 = cz - d / 2, z1 = cz + d / 2, sk = o.skip || '';
    const lo = mul(col, o.g0 ?? 0.86), hi = mul(col, o.g1 ?? 1), tw = o.taper ?? 0;
    const X0 = x0 + tw, X1 = x1 - tw, Z0 = z0 + tw, Z1 = z1 - tw;
    if (!sk.includes('s')) this._q([x0, y0, z1], [x1, y0, z1], [X1, y1, Z1], [X0, y1, Z1], 0, 0, 1, lo, lo, hi, hi);
    if (!sk.includes('n')) this._q([x1, y0, z0], [x0, y0, z0], [X0, y1, Z0], [X1, y1, Z0], 0, 0, -1, lo, lo, hi, hi);
    if (!sk.includes('e')) this._q([x1, y0, z1], [x1, y0, z0], [X1, y1, Z0], [X1, y1, Z1], 1, 0, 0, lo, lo, hi, hi);
    if (!sk.includes('w')) this._q([x0, y0, z0], [x0, y0, z1], [X0, y1, Z1], [X0, y1, Z0], -1, 0, 0, lo, lo, hi, hi);
    if (!sk.includes('t')) { const t = mul(col, o.gt ?? 1.1); this._q([X0, y1, Z1], [X1, y1, Z1], [X1, y1, Z0], [X0, y1, Z0], 0, 1, 0, t, t, t, t); }
    if (!sk.includes('b')) { const b = mul(col, 0.5); this._q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0, b, b, b, b); }
  }
  // frustum / prism about a vertical axis; smooth radial normals; o.cap (top, default true), o.capB, o.g0/g1 shading
  cyl(cx, y0, cz, r0, r1, h, sides, col, o = {}) {
    if (o.ry || o.rx || o.rz) { this.push(cx, y0, cz, o.ry || 0, o.rx || 0, o.rz || 0); this.cyl(0, 0, 0, r0, r1, h, sides, col, { ...o, ry: 0, rx: 0, rz: 0 }); this.pop(); return; }
    const lo = mul(col, o.g0 ?? 0.85), hi = mul(col, o.g1 ?? 1), y1 = y0 + h, a0 = o.a0 ?? 0, sy = (r0 - r1) / (Math.hypot(r0 - r1, h) || 1);
    for (let i = 0; i < sides; i++) {
      const a = a0 + (i / sides) * TAU, b = a0 + ((i + 1) / sides) * TAU, sa = Math.sin(a), ca = Math.cos(a), sb = Math.sin(b), cb = Math.cos(b);
      const fl = o.flat ? [Math.sin((a + b) / 2), Math.cos((a + b) / 2)] : null;
      const na = fl || [sa, ca], nb = fl || [sb, cb];
      this.v(cx + sa * r0, y0, cz + ca * r0, na[0], sy, na[1], lo); this.v(cx + sb * r0, y0, cz + cb * r0, nb[0], sy, nb[1], lo); this.v(cx + sb * r1, y1, cz + cb * r1, nb[0], sy, nb[1], hi);
      this.v(cx + sa * r0, y0, cz + ca * r0, na[0], sy, na[1], lo); this.v(cx + sb * r1, y1, cz + cb * r1, nb[0], sy, nb[1], hi); this.v(cx + sa * r1, y1, cz + ca * r1, na[0], sy, na[1], hi);
      if (o.cap !== false && r1 > 0.001) { const t = mul(col, o.gt ?? 1.08); this.v(cx, y1, cz, 0, 1, 0, t); this.v(cx + sa * r1, y1, cz + ca * r1, 0, 1, 0, t); this.v(cx + sb * r1, y1, cz + cb * r1, 0, 1, 0, t); }
      if (o.capB) { const t = mul(col, 0.5); this.v(cx, y0, cz, 0, -1, 0, t); this.v(cx + sb * r0, y0, cz + cb * r0, 0, -1, 0, t); this.v(cx + sa * r0, y0, cz + ca * r0, 0, -1, 0, t); }
    }
  }
  // surface of revolution about the local Y axis. profile: [[r, y, col], ...]; listed bottom->top faces outward,
  // top->bottom faces inward. o.tileU: rib count per turn, o.tileV: course length (writes aTile).
  lathe(profile, segs, o = {}) {
    const n = profile.length, nr = [], len = [0];
    for (let j = 0; j < n - 1; j++) { const dr = profile[j + 1][0] - profile[j][0], dy = profile[j + 1][1] - profile[j][1], l = Math.hypot(dr, dy) || 1; nr.push([dy / l, -dr / l]); len.push(len[j] + l); }
    const vn = (j, k) => { if (!o.smooth) return nr[j]; const a = nr[Math.max(0, k - 1)], b = nr[Math.min(n - 2, k)], x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU;
    for (let i = 0; i < segs; i++) {
      const A = a0 + (i / segs) * (a1 - a0), B = a0 + ((i + 1) / segs) * (a1 - a0), sa = Math.sin(A), ca = Math.cos(A), sb = Math.sin(B), cb = Math.cos(B);
      const uA = (o.tu0 || 0) + (i / segs) * (o.tileU || 0), uB = (o.tu0 || 0) + ((i + 1) / segs) * (o.tileU || 0);
      for (let j = 0; j < n - 1; j++) {
        const p = profile[j], q = profile[j + 1], n0 = vn(j, j), n1 = vn(j, j + 1), v0 = (o.tv0 || 0) + len[j] / (o.tileV || 1), v1 = (o.tv0 || 0) + len[j + 1] / (o.tileV || 1);
        const P0 = () => { this.tu = uA; this.tv = v0; this.v(sa * p[0], p[1], ca * p[0], sa * n0[0], n0[1], ca * n0[0], p[2]); };
        const P1 = () => { this.tu = uB; this.tv = v0; this.v(sb * p[0], p[1], cb * p[0], sb * n0[0], n0[1], cb * n0[0], p[2]); };
        const Q1 = () => { this.tu = uB; this.tv = v1; this.v(sb * q[0], q[1], cb * q[0], sb * n1[0], n1[1], cb * n1[0], q[2]); };
        const Q0 = () => { this.tu = uA; this.tv = v1; this.v(sa * q[0], q[1], ca * q[0], sa * n1[0], n1[1], ca * n1[0], q[2]); };
        P0(); P1(); Q1(); P0(); Q1(); Q0();
      }
    }
  }
  // parametric sheet: fn(u, v) -> [x, y, z, col, tu, tv]; normals by differences, flipped toward o.up when given
  grid(nu, nv, fn, o = {}) {
    const pts = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(fn(i / nu, j / nv));
    const at = (i, j) => pts[clamp(j, 0, nv) * (nu + 1) + clamp(i, 0, nu)], nrm = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1), ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (o.up && nx * o.up[0] + ny * o.up[1] + nz * o.up[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
      nrm.push([nx, ny, nz]);
    }
    const e = (i, j) => { const k = j * (nu + 1) + i, p = pts[k], m = nrm[k]; this.tu = p[4] || 0; this.tv = p[5] || 0; if (o.pivotTop) { this.h[0] = this._wx(pts[i]); this.h[1] = this._wy(pts[i]); this.h[2] = this._wz(pts[i]); } this.v(p[0], p[1], p[2], m[0], m[1], m[2], p[3]); };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const g = pts[j * (nu + 1) + i], hh = pts[(j + 1) * (nu + 1) + i + 1], m = nrm[j * (nu + 1) + i];
      const ux = pts[j * (nu + 1) + i + 1][0] - g[0], uy = pts[j * (nu + 1) + i + 1][1] - g[1], uz = pts[j * (nu + 1) + i + 1][2] - g[2], vx = hh[0] - g[0], vy = hh[1] - g[1], vz = hh[2] - g[2];
      const fwd = (uy * vz - uz * vy) * m[0] + (uz * vx - ux * vz) * m[1] + (ux * vy - uy * vx) * m[2] >= 0;
      if (fwd) { e(i, j); e(i + 1, j); e(i + 1, j + 1); e(i, j); e(i + 1, j + 1); e(i, j + 1); } else { e(i, j); e(i + 1, j + 1); e(i + 1, j); e(i, j); e(i, j + 1); e(i + 1, j + 1); }
    }
  }
  _wx(p) { const e = this.M.elements; return e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12]; }
  _wy(p) { const e = this.M.elements; return e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13]; }
  _wz(p) { const e = this.M.elements; return e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14]; }
  // the same geometry as toGeometry(), handed over one attribute at a time (y = ctx.yield): a big soup is tens of milliseconds of copying
  async toGeometryAsync(y) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await y();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await y();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await y();
    if (this.tile) g.setAttribute('aTile', new THREE.Float32BufferAttribute(this.tile, 2));
    if (this.ext) {
      const nv = this.ext.length / 7, pv = new Float32Array(nv * 3), wd = new Float32Array(nv * 3), gl = new Float32Array(nv);
      for (let i = 0; i < nv; i++) { pv[i * 3] = this.ext[i * 7]; pv[i * 3 + 1] = this.ext[i * 7 + 1]; pv[i * 3 + 2] = this.ext[i * 7 + 2]; wd[i * 3] = this.ext[i * 7 + 3]; wd[i * 3 + 1] = this.ext[i * 7 + 4]; wd[i * 3 + 2] = this.ext[i * 7 + 5]; gl[i] = this.ext[i * 7 + 6]; if ((i & 32767) === 32767) await y(); }
      g.setAttribute('aPivot', new THREE.BufferAttribute(pv, 3)); g.setAttribute('aWind', new THREE.BufferAttribute(wd, 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
    }
    return g;
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.tile) g.setAttribute('aTile', new THREE.Float32BufferAttribute(this.tile, 2));
    if (this.ext) {
      const nv = this.ext.length / 7, pv = new Float32Array(nv * 3), wd = new Float32Array(nv * 3), gl = new Float32Array(nv);
      for (let i = 0; i < nv; i++) { pv[i * 3] = this.ext[i * 7]; pv[i * 3 + 1] = this.ext[i * 7 + 1]; pv[i * 3 + 2] = this.ext[i * 7 + 2]; wd[i * 3] = this.ext[i * 7 + 3]; wd[i * 3 + 1] = this.ext[i * 7 + 4]; wd[i * 3 + 2] = this.ext[i * 7 + 5]; gl[i] = this.ext[i * 7 + 6]; }
      g.setAttribute('aPivot', new THREE.BufferAttribute(pv, 3)); g.setAttribute('aWind', new THREE.BufferAttribute(wd, 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
    }
    return g;
  }
}

// ---------- the shell: earth wall, windows, gate, roof ring ----------
const wallR = (P, y) => lerp(P.R + 0.45, P.R, clamp((y - P.plinth) / (P.eave - P.plinth), 0, 1));

function buildWall(K) {
  const { P, rng, col, wall, wood } = K, R = P.R, e = col.earth, st = col.stone;
  wall.frame(0);
  wall.lathe([[R + 1.2, -0.6, st], [R + 1.05, 0.35, st], [R + 0.82, 0.6, st], [R + 0.6, P.plinth, st], [R + 0.45, P.plinth + 0.04, e],
    [wallR(P, 6), 6, e], [wallR(P, 11), 11, e], [R, P.eave + 0.3, mul(e, 0.8)]], K.lod >= 2 ? 96 : 160);
  // two rows of small openings high in the wall, each with granite lintel and sill, some with a plank shutter
  const dA = TAU / P.bays;
  for (let row = 0; row < 2; row++) {
    const y = row ? 13.7 : 9.9;
    for (let b = 0; b < P.bays; b++) {
      if (row === 0 && rng.chance(0.18)) continue;
      const th = (b + (row ? 0.5 : 0) + rng.range(-0.12, 0.12)) * dA, z = wallR(P, y);
      wood.frame(th);
      const w = rng.range(0.5, 0.62), h = rng.range(0.78, 0.95);
      wood.box(0, y, z - 0.02, w, h, 0.1, [0.012, 0.01, 0.01], { skip: 'nb', g0: 1, gt: 1 });
      wood.box(0, y + h, z + 0.02, w + 0.36, 0.16, 0.2, jit(st, rng), { skip: 'n' });
      if (K.lod >= 2) continue;
      wood.box(0, y - 0.1, z + 0.03, w + 0.24, 0.1, 0.24, jit(st, rng), { skip: 'n' });
      wood.box(-w / 2 - 0.04, y, z + 0.0, 0.08, h, 0.14, mul(e, 0.7), { skip: 'ntb' });
      wood.box(w / 2 + 0.04, y, z + 0.0, 0.08, h, 0.14, mul(e, 0.7), { skip: 'ntb' });
      if (rng.chance(0.3)) wood.box(-w / 2 - 0.02, y + 0.02, z + 0.2, 0.04, h - 0.04, w * 0.9, jit(col.wood2, rng), { ry: rng.range(-0.5, 0.3) });
    }
  }
  // things leaning on the outside: firewood stacks, pole bundles, a ladder
  for (let i = 0; i < 9; i++) {
    const th = rng.range(0.25, TAU - 0.25); wood.frame(th); const z = R + 1.35;
    if (i < 5) { for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) wood.cyl(-1.5 + k * 0.5 + (r % 2) * 0.2, 0.05 + r * 0.26, z + rng.range(-0.05, 0.05), 0.13, 0.12, 0.9, 5, jit(col.wood2, rng, 0.3), { rx: Math.PI / 2, capB: false, a0: rng() }); }
    else if (i < 8) { for (let k = 0; k < 6; k++) wood.cyl(rng.range(-0.5, 0.5), 0, z + 0.5, 0.045, 0.03, rng.range(5, 7.5), 5, jit(col.bamboo, rng, 0.2), { rx: -0.2 + rng.range(-0.03, 0.03), rz: rng.range(-0.1, 0.1), cap: false }); }
    else { for (const s of [-0.28, 0.28]) wood.box(s, 0, z + 1.2, 0.07, 6.2, 0.07, col.bamboo, { rx: -0.24 }); for (let k = 1; k < 13; k++) wood.box(0, k * 0.45, z + 1.2 - k * 0.45 * Math.tan(0.24), 0.6, 0.05, 0.05, col.bamboo, {}); }
  }
}

function buildGate(K) {
  const { P, rng, col, wood, hung } = K, R = P.R, z = wallR(P, 2), st = mul(col.stone, 1.25);
  wood.frame(0); wood.M.scale(_v.set(1.3, 1.3, 1));
  // granite surround
  for (const s of [-1, 1]) wood.box(s * 1.55, 0, z + 0.05, 0.6, 3.7, 0.7, jit(st, rng, 0.06), { g0: 0.7, taper: 0.03 });
  wood.box(0, 3.7, z + 0.08, 4.3, 0.7, 0.8, jit(st, rng, 0.06), { g0: 0.8, taper: 0.04 });
  wood.box(0, 4.4, z - 0.1, 3.5, 0.14, 0.5, mul(st, 0.8), {});
  // dark passage, reveals, threshold and steps
  wood.box(0, 0, z - 1.6, 2.5, 3.7, 0.1, [0.01, 0.009, 0.008], { skip: 'nbt', g0: 1 });
  for (const s of [-1, 1]) wood.quad([s * 1.25, 0, z - 1.6], [s * 1.25, 0, z - 0.2], [s * 1.25, 3.7, z - 0.2], [s * 1.25, 3.7, z - 1.6], mul(col.earth, 0.12), mul(col.earth, 0.3), [-s, 0, 0]);
  wood.box(0, 0.0, z + 0.25, 2.9, 0.22, 1.5, mul(st, 0.9), { g0: 0.8 });
  for (let k = 0; k < 3; k++) wood.box(0, -0.5 + k * 0.07, z + 2.3 - k * 0.45, 4.6 - k * 0.5, 0.6, 1.0, jit(st, rng, 0.08), { g0: 0.75, skip: 'b' });
  // iron-studded leaves: one nearly shut, one swung in
  const leaf = (s, ang) => {
    wood.push(s * 1.22, 0.22, z - 0.35, s * ang);
    const c = jit(mul(col.timber, 1.5), rng, 0.1);
    wood.box(-s * 0.6, 0, 0, 1.2, 3.45, 0.13, c, { g0: 0.55 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) wood.box(-s * (0.18 + i * 0.28), 0.25 + j * 0.42, 0.075, 0.07, 0.07, 0.05, [0.05, 0.05, 0.055], { skip: 'n', taper: 0.02 });
    wood.box(-s * 0.6, 1.0, 0.075, 1.2, 0.09, 0.03, [0.04, 0.04, 0.045], { skip: 'n' }); wood.box(-s * 0.6, 2.4, 0.075, 1.2, 0.09, 0.03, [0.04, 0.04, 0.045], { skip: 'n' });
    wood.pop();
  };
  leaf(-1, rng.range(0.15, 0.35)); leaf(1, rng.range(1.0, 1.35));
  // name tablet, red couplets, a parasol left by the door
  wood.box(0, 4.75, z + 0.1, 2.5, 0.95, 0.16, mul(st, 1.1), { taper: 0.03 });
  wood.box(0, 4.85, z + 0.19, 2.2, 0.75, 0.03, mul(col.red, 0.55), { skip: 'n' });
  for (let k = 0; k < 3; k++) wood.box(-0.7 + k * 0.7, 4.98, z + 0.21, 0.42, 0.48, 0.02, [0.5, 0.36, 0.1], { skip: 'n' });
  for (const s of [-1, 1]) { wood.box(s * 2.25, 0.9, z + 0.02, 0.42, 2.6, 0.03, jit(mul(col.red, 0.75), rng, 0.1), { skip: 'n', g0: 0.75 });
    for (let k = 0; k < 5; k++) wood.box(s * 2.25, 1.15 + k * 0.48, z + 0.04, 0.2, 0.3, 0.02, [0.03, 0.02, 0.02], { skip: 'n' }); }
  wood.cyl(2.9, 0, z + 0.6, 0.03, 0.03, 1.5, 5, col.bamboo, { rx: -0.3 }); wood.cyl(2.9, 1.2, z + 0.25, 0.75, 0.04, 0.32, 10, jit(col.red, rng), { rx: -0.3, cap: false });
  // gate lanterns on brackets
  const hk = K.hung; if (K.hungOut) K.hung = K.hungOut;   // (ring A: what hangs outside the wall is kept apart, see buildHero)
  for (const s of [-1, 1]) { wood.box(s * 2.7, 4.75, z + 0.55, 0.08, 0.08, 1.2, col.timber, {}); lantern(K, s * 2.7, 4.72, z + 1.05, 0.5, rng() * 9, 0.55); }
  K.hung = hk;
}

// one red lantern in the hung soup: cord, caps, ribbed body, tassel. (x,y,z) = hanging point in the current frame.
function lantern(K, x, y, z, size, ph, cord = 0.4) {
  const { hung, col, rng } = K, r = size * 0.5, hgt = size * 0.92, red = jit(mix(col.red, [0.74, 0.09, 0.055], 0.55), rng, 0.1), gold = [0.74, 0.5, 0.12], small = size < 0.4;   // the small New Year lanterns are lighter
  hung.M.copy(K.wood.M);
  hung.hang(x, y, z, ph, 0.27 + rng() * 0.12, 0, 0);
  hung.cyl(x, y - cord, z, 0.016, 0.016, cord, 3, [0.03, 0.02, 0.02], { cap: false });
  const y0 = y - cord - hgt, h7 = hung.h[6];
  if (!small) hung.cyl(x, y - cord - 0.02, z, r * 0.46, r * 0.4, 0.1, 6, gold, { cap: false, g0: 0.7 });
  hung.h[6] = K.glow;
  const prof = [[r * 0.42, 0], [r * 0.96, hgt * 0.3], [r * 0.96, hgt * 0.7], [r * 0.42, hgt]];
  const band = [[0.5, 1.0], [1.0, 1.04], [1.04, 0.56]];   // dark at the caps, brightest round the belly
  for (let j = 0; j < 3; j++) hung.cyl(x, y0 + prof[j][1], z, prof[j][0], prof[j + 1][0], prof[j + 1][1] - prof[j][1], small ? 5 : 6, red, { cap: false, g0: band[j][0], g1: band[j][1] });
  hung.h[6] = h7;
  hung.cyl(x, y0 - 0.08, z, r * 0.4, r * 0.46, 0.1, small ? 4 : 6, gold, { capB: !small, cap: false, g0: 0.7 });
  hung.h[4] *= 1.5; hung.cyl(x, y0 - 0.05 - size * 0.7, z, 0.05, 0.022, size * 0.7, 3, mul(red, 0.9), { cap: false });
}

// The roof ring's own figures, in the metres of the 96 m ring module (a ring is drawn at its scale): both builders take them from here, and the world reads
// roofSection to keep its flight clear of the roof.
export const ROOF = { rEaveOut: 52, eaveOut: 16.5, rEaveIn: 37.2, eaveIn: 15.5, rRidge: 45.4, ridgeY: 20 };
const roofSag = (s, drop) => drop * (0.5 * s + 0.5 * (1 - (1 - s) * (1 - s)));   // how far a slope has fallen, s of the way from the ridge to its eave
const RIDGE_BLOCK = { y0: 0.28, h0: 0.3, d0: 0.34, h1: 0.5, d1: 0.26 };   // the tallest thing on the ridge, the two-tier block of every eighth bay: base height over ridgeY, the heights and radial depths of its two tiers
// The roof's section from the outer eave over the ridge to the inner eave, as [radius, height] in the ring's own metres, with the ridge carrying its TALLEST
// block all the way round (where the blocks and the upturned finials stand round the ring is drawn by the seed; no finial reaches as high: ridgeY + 0.875).
export function roofSection(n = 12) {
  const P = ROOF, B = RIDGE_BLOCK, rr = P.rRidge, ry = P.ridgeY, yo = ry - 0.3, ro = rr + 0.3, ri = rr - 0.3, hw = Math.max(B.d0, B.d1) / 2, top = ry + B.y0 + B.h0 + B.h1, out = [[P.rEaveOut + 0.02, P.eaveOut - 0.2]];
  for (let j = n; j >= 0; j--) { const s = j / n; out.push([lerp(ro, P.rEaveOut, s), yo - roofSag(s, yo - P.eaveOut)]); }
  out.push([rr + 0.38, ry - 0.27], [rr + 0.3, ry + 0.1], [rr + hw, ry + B.y0], [rr + hw, top], [rr - hw, top], [rr - hw, ry + B.y0], [rr - 0.3, ry + 0.1], [rr - 0.38, ry - 0.27]);
  for (let j = 0; j <= n; j++) { const s = j / n; out.push([lerp(ri, P.rEaveIn, s), yo - roofSag(s, yo - P.eaveIn)]); }
  out.push([P.rEaveIn - 0.02, P.eaveIn - 0.2]);
  return out;
}
// true sizes the world's rules of distance are made from: a gallery post's width at its foot (buildBay), a rib tile's width (buildRibs), a villager's height
// (the figure of buildPeople stands 1.78 m to the tip of the hat and is drawn at 1.0 to 1.16: at the middle of that)
const POST_R = 0.165, RIB_W = 0.25;
export const TRUE_SIZE = { rib: RIB_W, villager: 1.78 * 1.08 };

async function buildRoof(K, ctx) {
  const { P, rng, col, roof, wood, noise } = K;
  const NR = Math.round(TAU * P.rRidge / 0.5), SEG = K.roofSeg || 192, ty = roofSag;
  const tc = col.tile, prof = [], N = K.roofN || 9, LS = K.roofSeg ? 96 : 128;
  const yo = P.ridgeY - 0.3, ro = P.rRidge + 0.3, ri = P.rRidge - 0.3;
  prof.push([P.rEaveOut + 0.02, P.eaveOut - 0.2, mul(tc, 0.5)]);
  for (let j = N; j >= 0; j--) { const s = j / N; prof.push([lerp(ro, P.rEaveOut, s), yo - ty(s, yo - P.eaveOut), mul(tc, 1 - 0.12 * s)]); }
  for (let j = 0; j <= N; j++) { const s = j / N; prof.push([lerp(ri, P.rEaveIn, s), yo - ty(s, yo - P.eaveIn), mul(tc, 1 - 0.12 * s)]); }
  prof.push([P.rEaveIn - 0.02, P.eaveIn - 0.2, mul(tc, 0.5)]);
  roof.frame(0);
  for (let c = 0; c < 4; c++) { roof.lathe(prof, SEG / 4, { smooth: true, tileU: NR / 4, tileV: 0.36, a0: c * TAU / 4, a1: (c + 1) * TAU / 4, tu0: c * NR / 4 }); await ctx.yield(); }
  { // where a point of either slope sits along the tile courses (the lathe's own v), for things laid on the roof
    const pl = [0]; for (let j = 1; j < prof.length; j++) pl.push(pl[j - 1] + Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]));
    K.NR = NR; K.tvAt = (r, outer) => { const j0 = outer ? 1 : N + 2, j1 = outer ? N + 1 : 2 * N + 2;
      for (let j = j0; j < j1; j++) { const a = prof[j][0], b = prof[j + 1][0]; if ((r - a) * (r - b) <= 0) return (pl[j] + (pl[j + 1] - pl[j]) * (Math.abs(b - a) > 1e-6 ? (r - a) / (b - a) : 0)) / 0.36; }
      return pl[outer ? j0 : j1] / 0.36; }; }
  K.roofY = (r) => { const s = r > P.rRidge ? (r - ro) / (P.rEaveOut - ro) : (ri - r) / (ri - P.rEaveIn); const c = clamp(s, 0, 1); return yo - ty(c, yo - (r > P.rRidge ? P.eaveOut : P.eaveIn)); };
  // white ridge mortar, soffits, rafter ends, ridge finials
  const lm = mul(col.lime, 1.05), ld = mul(col.lime, 0.55), rr = P.rRidge, ry = P.ridgeY;
  wood.frame(0);
  const cap = mul(tc, 0.62), capT = mul(tc, 0.95), capR = mul(tc, 0.86), capRT = mul(tc, 1.02);
  wood.lathe([[rr + 0.5, ry - 0.44, ld], [rr + 0.43, ry - 0.3, lm], [rr + 0.38, ry - 0.27, lm]], LS);
  wood.lathe([[rr - 0.38, ry - 0.27, lm], [rr - 0.43, ry - 0.3, lm], [rr - 0.5, ry - 0.44, ld]], LS);
  roof.lathe([[rr + 0.38, ry - 0.27, capR], [rr + 0.3, ry + 0.1, capR], [rr + 0.12, ry + 0.3, capRT], [rr - 0.12, ry + 0.3, capRT], [rr - 0.3, ry + 0.1, capR], [rr - 0.38, ry - 0.27, capR]], LS, { tileU: NR, tileV: 0.36, tv0: 19.2 });
  const tb = mul(col.timber, 1.1), tbd = mul(col.timber, 0.45);
  wood.lathe([[P.R - 0.1, P.eave + 0.75, tbd], [P.rEaveOut, P.eaveOut - 0.2, tb]], LS);
  wood.lathe([[P.rEaveIn, P.eaveIn - 0.2, tb], [P.rPost + 0.1, K.roofY(P.rPost) - 0.3, mul(tb, 0.7)], [P.rBack, K.roofY(P.rBack) - 0.35, tbd]], K.roofSeg ? P.bays * 2 : P.bays * 4);
  await ctx.yield();
  const nro = K.rafters ?? 128, so = Math.atan2(P.eave + 0.75 - P.eaveOut + 0.2, P.rEaveOut - P.R), si = Math.atan2(K.roofY(P.rPost) - P.eaveIn, P.rPost - P.rEaveIn);
  for (let i = 0; i < nro; i++) { wood.frame((i + 0.5) / nro * TAU); wood.box(0, P.eaveOut - 0.37 + 0.95 * Math.tan(so), P.rEaveOut - 0.95, 0.13, 0.15, 2.0, jit(col.wood2, rng, 0.15), { rx: so, skip: 'tn', g0: 0.7 }); }
  await ctx.yield();
  const nri = K.rafters === 0 ? 0 : P.bays * 5;
  for (let i = 0; i < nri; i++) { wood.frame((i + 0.5) / nri * TAU); wood.box(0, P.eaveIn - 0.37 + 0.95 * Math.tan(si), P.rEaveIn + 0.95, 0.12, 0.14, 2.0, jit(col.wood2, rng, 0.15), { rx: -si, skip: 'ts', g0: 0.7 }); }
  await ctx.yield();
  for (let b = 0; b < P.bays; b++) {
    wood.frame((b + rng.range(0.3, 0.7)) * TAU / P.bays);
    if (b % 8 === 0) { const B = RIDGE_BLOCK; wood.box(0, ry + B.y0, rr, 1.5, B.h0, B.d0, lm, { taper: 0.05 }); wood.box(0, ry + B.y0 + B.h0, rr, 0.5, B.h1, B.d1, mul(col.tile, 0.9), { taper: 0.08 }); }
    else { const w = rng.range(0.35, 0.7), hh = rng.range(0.1, 0.2), lc = rng.chance(0.5); wood.box(0, ry + 0.28, rr, w + 0.25, hh + 0.06, 0.34, lc ? mul(lm, 0.8) : cap, { taper: 0.03 }); }
    if (b % 4 === 0) for (const s of [-1, 1]) {   // an upturned finial either side of the ridge block
      wood.box(s * 1.1, ry + 0.29, rr, 0.9, 0.16, 0.26, cap, { rz: s * 0.16, taper: 0.03 }); wood.box(s * 1.68, ry + 0.42, rr, 0.56, 0.12, 0.2, capT, { rz: s * 0.6, taper: 0.03 }); wood.box(s * 2.0, ry + 0.7, rr, 0.3, 0.09, 0.15, capT, { rz: s * 1.05 }); }
  }
  void noise;
}

// one triangle into a tile soup (s.tu set by the caller), wound so that the face looks the way its normals do
function tileTri(s, p0, n0, t0, c0, p1, n1, t1, c1, p2, n2, t2, c2) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
  const fw = (uy * vz - uz * vy) * (n0[0] + n2[0]) + (uz * vx - ux * vz) * (n0[1] + n2[1]) + (ux * vy - uy * vx) * (n0[2] + n2[2]) >= 0;
  const put = (p, n, t, c) => { s.tv = t; s.v(p[0], p[1], p[2], n[0], n[1], n[2], c); };
  put(p0, n0, t0, c0); if (fw) { put(p1, n1, t1, c1); put(p2, n2, t2, c2); } else { put(p2, n2, t2, c2); put(p1, n1, t1, c1); }
}

// real rib tiles where the camera skims the roof: a rounded rib on every crest the tile shader draws (tc.x = i + .5), following the slope;
// th0..th1 in degrees of the ring's own angle (0 = the gate), on the outer or the inner slope. They go into K.ribs (tile material).
function buildRibs(K, th0, th1, outer) {
  const { P, col } = K, s = K.ribs, NR = K.NR, c = mul(col.tile, 1.04), cd = mul(col.tile, 0.8), w = RIB_W / 2, h = 0.105, NS = 4;
  const rA = outer ? P.rRidge + 0.42 : P.rRidge - 0.42, rB = outer ? P.rEaveOut + 0.04 : P.rEaveIn - 0.04;
  for (let i = Math.round(th0 / 360 * NR); i < Math.round(th1 / 360 * NR); i++) {
    const A = (i + 0.5) / NR * TAU, sa = Math.sin(A), ca = Math.cos(A), tx = ca, tz = -sa, f = outer ? 1 : -1;   // t: along the ring
    s.tu = i + 0.5;
    let pv = null;
    for (let j = 0; j <= NS; j++) {
      const r = rA + (rB - rA) * j / NS, y = K.roofY(Math.min(Math.max(r, P.rEaveIn), P.rEaveOut)) - 0.01, tv = K.tvAt(Math.min(Math.max(r, P.rEaveIn), P.rEaveOut), outer);
      const cur = { r, y, tv };
      if (pv) for (const sd of [-1, 1]) {   // two faces, shaded as a half round: side normals lean out, the crest's points up
        const q = (o, top) => [sa * o.r + (top ? 0 : sd * tx * w), o.y + (top ? h : 0), ca * o.r + (top ? 0 : sd * tz * w)], n = (top) => top ? [sa * 0.25 * f, 0.97, ca * 0.25 * f] : [sd * tx * 0.9, 0.44, sd * tz * 0.9];
        const a = q(pv, 0), b = q(cur, 0), cc = q(cur, 1), d = q(pv, 1), nb = n(0), nt = n(1);
        tileTri(s, a, nb, pv.tv, cd, b, nb, cur.tv, cd, cc, nt, cur.tv, c); tileTri(s, a, nb, pv.tv, cd, cc, nt, cur.tv, c, d, nt, pv.tv, c);
      }
      pv = cur;
    }
  }
}

// Round trays of tea are put out to dry on the roof's inner slope all round the ring: a group in every second bay (which of the two sets of bays is
// drawn), three to five trays to a group, each at a drawn place across its bay and up the upper part of the slope (radius 40.8 to 43.2, in reach of the
// ridge), a tray's own width and a hand apart, each behind a batten that keeps it from sliding. All from the stream 'roof-trays'.
function roofTrays(K) {
  const { P, col, wood, hung } = K, q = K.stream('roof-trays'), dA = TAU / P.bays, APART = 1.75;
  for (let b = q.int(0, 1); b < P.bays; b += 2) {
    const put = [];
    for (let k = q.int(3, 5), tr = 0; k > 0 && tr < 40; tr++) {
      const rr = q.range(40.8, 43.2), a = (b + q.range(-0.42, 0.42)) * dA;
      if (put.some(([a2, r2]) => Math.hypot((a - a2) * rr, rr - r2) < APART)) continue;
      put.push([a, rr]); k--;
      const y = K.roofY(rr), sl = Math.atan2(K.roofY(rr + 0.5) - K.roofY(rr - 0.5), 1);
      wood.frame(a); wood.push(0, y + 0.16, rr, 0, -sl); hung.M.copy(wood.M);
      const tea = K.persimmon ? [0.7, 0.26, 0.03] : mul(mix(col.tea, [0.3, 0.19, 0.06], q() * q()), 1.5);
      hung.hang(0, 0, 0, 0, 0, 0, 0); hung.cyl(0, 0, 0, 0.74, 0.8, 0.09, 8, [0.5, 0.4, 0.2], { cap: false, g0: 0.6, a0: q() });
      hung.h[6] = -1; hung.cyl(0, 0.05, 0, 0.76, 0.0, 0.03, 8, tea, { cap: false, g0: 1, g1: 1.15 }); hung.h[6] = 0;
      wood.box(0, -0.16, -0.5, 1.2, 0.16, 0.08, mul(col.bamboo, 0.8), { skip: 'b' });   // a batten keeps it from sliding
      wood.pop();
    }
  }
  wood.M.identity(); hung.M.identity();
}

// ---------- the galleries, bay by bay ----------
function buildBay(K, b, t) {
  const { P, rng, col, wood } = K, dA = TAU / P.bays, tn = Math.tan(dA / 2), cs = Math.cos(dA / 2);
  const F = P.floors[t], H = (t < 3 ? P.floors[t + 1] - F : 3.25), zp = P.rPost * cs, zb = P.rBack * cs, hwp = zp * tn, hwb = zb * tn;
  const tim = jit(mul(col.timber, 1.25), rng, 0.18), worn = jit(col.wood2, rng, 0.15), gate = t === 0 && b === 0;
  wood.frame(b * dA);
  if (t > 0) {
    // plank floor, its dark underside, joists with their ends showing, fascia board
    const zf = zp - 0.36, hf = zf * tn;
    wood.quad([-hf, F, zf], [hf, F, zf], [hwb, F, zb], [-hwb, F, zb], mul(worn, 1.15), mul(worn, 0.5), [0, 1, 0]);
    wood.quad([-hf, F - 0.3, zf], [hf, F - 0.3, zf], [hwb, F - 0.3, zb], [-hwb, F - 0.3, zb], mul(tim, 0.75), mul(tim, 0.3), [0, -1, 0]);
    for (let j = 0; j < 3; j++) wood.box((j - 1) * hwp * 0.62, F - 0.5, (zp + zb) / 2 - 0.3, 0.13, 0.22, zb - zp + 0.6, tim, { skip: 'ts', g0: 0.7 });
    for (let j = 0; j < 4; j++) wood.box((j - 1.5) * hwp * 0.36 + 0.4, F - 0.27, zf - 0.08, 0.1, 0.15, 0.3, mul(worn, 0.8), { skip: 'ts' });
    wood.box(0, F - 0.3, zf, hf * 2, 0.32, 0.07, jit(worn, rng, 0.1), { skip: 'sb', g0: 0.75 });
    // rail: worn top bar, bottom rail, stanchions, turned balusters (a few replaced or missing)
    wood.box(0, F + 1.0, zp - 0.03, hwp * 2, 0.09, 0.14, mul(worn, 1.5), { g0: 0.6, gt: 1.25 });
    wood.box(0, F + 0.13, zp - 0.03, hwp * 2, 0.07, 0.09, tim, { skip: 'b' });
    for (const s of [-1, 1]) wood.box(s * hwp / 3, F, zp - 0.03, 0.1, 1.0, 0.1, tim, { skip: 'tb' });
    const NB = 12;
    for (let i = 0; i < NB; i++) {
      const u = -hwp + (i + 1) * (2 * hwp) / (NB + 1); if (rng.chance(0.03)) continue;
      const bc = rng.chance(0.06) ? mul(worn, 1.5) : jit(tim, rng, 0.2);
      wood.cyl(u, F + 0.2, zp - 0.03, 0.034, 0.066, 0.38, 3, bc, { cap: false, a0: i });
      wood.cyl(u, F + 0.58, zp - 0.03, 0.066, 0.034, 0.42, 3, bc, { cap: false, a0: i });
    }
  }
  // post with base and capital, corbels, lantern arm; beam along the chord
  if (t === 0) wood.cyl(-hwp, 0, zp, 0.3, 0.24, 0.5, 8, jit(col.stone, rng, 0.1), { g0: 0.7 });
  wood.cyl(-hwp, F + (t === 0 ? 0.5 : 0), zp, POST_R, 0.15, H - (t === 0 ? 0.5 : 0), 8, tim, { cap: false, g0: 0.75, g1: 0.9, flat: true });
  wood.box(-hwp, F + H - 0.58, zp, 1.5, 0.13, 0.13, mul(tim, 0.9), { taper: 0.0 });
  wood.box(-hwp, F + H - 0.45, zp, 0.8, 0.13, 0.15, mul(tim, 0.9), {});
  wood.box(-hwp, F + H - 0.72, zp - 0.42, 0.09, 0.1, 0.9, tim, { skip: 's' });
  wood.box(0, F + H - 0.32, zp, hwp * 2, 0.28, 0.2, tim, { g0: 0.7 });
  // back wall: limewash over a stained dado, darker under the ceiling
  const lime = jit(col.lime, rng, 0.1), dado = mix(lime, col.earth, 0.45 + rng() * 0.3), dh = t === 0 ? 1.4 : 1.05, wtop = F + H + (t === 3 ? 1.3 : -0.3);
  wood.quad([hwb, F, zb], [-hwb, F, zb], [-hwb, F + dh, zb], [hwb, F + dh, zb], mul(dado, 0.6), mul(dado, 0.95), [0, 0, -1]);
  wood.quad([hwb, F + dh, zb], [-hwb, F + dh, zb], [-hwb, wtop, zb], [hwb, wtop, zb], mul(lime, 1.12), mul(lime, t === 3 ? 0.5 : 0.72), [0, 0, -1]);
  if (gate) { // passage through to the gate
    wood.box(0, 0, zb - 0.04, 2.7, 3.6, 0.06, [0.012, 0.01, 0.009], { skip: 'sbt', g0: 1 });
    for (const s of [-1, 1]) wood.box(s * 1.5, 0, zb - 0.12, 0.3, 3.7, 0.24, mul(col.stone, 1.1), { skip: 's', g0: 0.7 });
    wood.box(0, 3.6, zb - 0.12, 3.5, 0.4, 0.26, mul(col.stone, 1.1), { skip: 's' });
    return;
  }
  // two plank doors and a shuttered window, set by seed
  const zw = zb - 0.02, lay = [-hwb * 0.6 + rng.range(-0.3, 0.3), rng.range(-0.35, 0.35), hwb * 0.6 + rng.range(-0.3, 0.3)];
  const widx = t === 0 ? rng.int(0, 2) : 1, kitchen = t === 0;
  for (let k = 0; k < 3; k++) {
    const u = lay[k];
    if (k === widx && !(kitchen && rng.chance(0.3))) { // window
      const w = rng.range(0.95, 1.25), h = rng.range(0.8, 1.0), y = F + rng.range(1.15, 1.35);
      wood.box(u, y, zw - 0.02, w, h, 0.04, [0.014, 0.012, 0.011], { skip: 'sbt', g0: 1 });
      wood.box(u, y - 0.1, zw - 0.08, w + 0.24, 0.1, 0.18, tim, { skip: 's' }); wood.box(u, y + h, zw - 0.07, w + 0.2, 0.1, 0.14, tim, { skip: 's' });
      for (const s of [-1, 1]) wood.box(u + s * (w / 2 + 0.04), y, zw - 0.06, 0.08, h, 0.12, tim, { skip: 'stb' });
      if (rng.chance(0.55)) { for (let i = 0; i < 6; i++) wood.box(u - w / 2 + (i + 0.5) * w / 6, y, zw - 0.07, 0.045, h, 0.045, mul(worn, 0.9), { skip: 'stb' }); }
      else { const sc = jit(worn, rng, 0.2); wood.box(u - w / 4, y, zw - 0.06, w / 2 - 0.02, h, 0.035, sc, { skip: 'stb' }); wood.box(u + w / 2 - 0.02, y, zw - 0.06 - w / 4 * 0.8, 0.035, h, w / 2, mul(sc, 0.9), { ry: -0.5, skip: 'tb' }); }
      continue;
    }
    const w = kitchen ? rng.range(1.15, 1.4) : rng.range(0.88, 1.0), h = kitchen ? 2.25 : 2.05, open = rng.chance(kitchen ? 0.75 : 0.3);
    for (const s of [-1, 1]) wood.box(u + s * (w / 2 + 0.05), F, zw - 0.07, 0.1, h, 0.14, tim, { skip: 'stb', g0: 0.7 });
    wood.box(u, F + h, zw - 0.08, w + 0.34, 0.13, 0.16, tim, { skip: 's' });
    wood.box(u, F, zw - 0.12, w + 0.2, 0.09, 0.26, kitchen ? col.stone : mul(worn, 0.8), { skip: 'sb' });
    if (open) {
      wood.box(u, F + 0.09, zw - 0.02, w, h - 0.09, 0.04, kitchen ? [0.03, 0.016, 0.008] : [0.014, 0.012, 0.011], { skip: 'sbt', g0: 1, g1: kitchen ? 0.3 : 1 });
      if (kitchen) { wood.quad([u + w * 0.7, F + h + 0.13, zw - 0.015], [u - w * 0.7, F + h + 0.13, zw - 0.015], [u - w * 0.45, F + h + 1.5, zw - 0.015], [u + w * 0.45, F + h + 1.5, zw - 0.015], [0.03, 0.027, 0.024], mul(lime, 0.5), [0, 0, -1]); K.kitchens.push([b, u]); }
      else if (rng.chance(0.65)) K.curtains.push([b, u, F + h, w, rng()]);
    } else {
      const dc = jit(rng.chance(0.25) ? mix(worn, col.red, 0.35) : worn, rng, 0.25);
      wood.box(u, F + 0.09, zw - 0.045, w, h - 0.09, 0.05, dc, { skip: 'sbt', g0: 0.65 });
      wood.box(u, F + 0.5, zw - 0.085, w, 0.08, 0.03, mul(dc, 0.7), { skip: 's' }); wood.box(u, F + 1.5, zw - 0.085, w, 0.08, 0.03, mul(dc, 0.7), { skip: 's' });
      if (K.festival || rng.chance(0.4)) wood.box(u, F + 1.05, zw - 0.075, 0.3, 0.3, 0.012, jit(col.red, rng, 0.1), { skip: 's', rz: Math.PI / 4 });
    }
    if (!kitchen && rng.chance(0.7)) for (const s of [-1, 1]) wood.box(u + s * (w / 2 + 0.26), F + 0.55, zw - 0.012, 0.16, 1.4, 0.012, jit(mul(col.red, rng.range(0.55, 0.95)), rng, 0.1), { skip: 'sb', g0: 0.8 });
  }
  bayProps(K, b, t, F, zp, zb, hwp, hwb, lay);
}

// benches, baskets, tools, jars, pots on the rail: the marks of use
function bayProps(K, b, t, F, zp, zb, hwp, hwb, lay) {
  const { rng, col, wood } = K, worn = jit(col.wood2, rng, 0.2), zw = zb - 0.02, bam = jit(col.bamboo, rng, 0.15);
  const gapU = () => { const g = rng.int(0, 1); return (lay[g] + lay[g + 1]) / 2 + rng.range(-0.3, 0.3); };
  if (rng.chance(0.5)) { const u = gapU(), w = rng.range(1.2, 1.9); wood.box(u, F + 0.4, zw - 0.3, w, 0.06, 0.34, worn, { gt: 1.3 }); for (const s of [-1, 1]) wood.box(u + s * (w / 2 - 0.15), F, zw - 0.3, 0.07, 0.4, 0.3, mul(worn, 0.7), { skip: 'tb' }); }
  const n = rng.int(2, 4);
  for (let i = 0; i < n; i++) {
    const u = rng.range(-hwb * 0.92, hwb * 0.92), kind = rng.int(0, t === 0 ? 7 : 6), z = zw - rng.range(0.3, 0.55);
    if (kind === 0) { const r = rng.range(0.22, 0.34); wood.cyl(u, F, z, r * 0.8, r, r * 1.1, 8, bam, { cap: true, gt: 1, g0: 0.6 }); wood.cyl(u, F + r * 1.0, z, r * 0.9, r * 0.5, 0.12, 8, jit(rng.pick([col.tea, [0.45, 0.33, 0.08], mul(col.red, 0.8), [0.3, 0.26, 0.2]]), rng, 0.15), {}); }
    else if (kind === 1) { wood.box(u, F, zw - 0.5, 0.045, 1.9, 0.045, mul(worn, 1.2), { rx: 0.24, skip: 'b' }); wood.box(u, F + 0.02, zw - 0.52, 0.2, 0.26, 0.03, [0.06, 0.06, 0.065], { rx: 0.9 }); }
    else if (kind === 2) { wood.cyl(u, F, zw - 0.6, 0.03, 0.025, 2.3, 5, bam, { rx: 0.25, rz: rng.range(-0.15, 0.15) }); }
    else if (kind === 3) { const r = rng.range(0.2, 0.3), jc = jit([0.16, 0.09, 0.05], rng, 0.2); wood.cyl(u, F, z, r * 0.6, r, r * 1.1, 8, jc, { cap: false, g0: 0.6 }); wood.cyl(u, F + r * 1.1, z, r, r * 0.55, r * 0.9, 8, jc, { cap: true, gt: 0.25 }); }
    else if (kind === 4) { wood.box(u, F + 0.3, z, 0.34, 0.04, 0.34, worn, { gt: 1.3 }); wood.box(u, F, z, 0.26, 0.3, 0.26, mul(worn, 0.6), { skip: 'tb', taper: -0.03 }); }
    else if (kind === 5) { wood.cyl(u, F + rng.range(1.5, 2.2), zw - 0.02, 0.34, 0.02, 0.16, 10, jit([0.42, 0.33, 0.16], rng, 0.1), { rx: -Math.PI / 2, cap: false }); }
    else if (kind === 6) { for (let k = 0; k < 3; k++) wood.cyl(u + k * 0.05, F + k * 0.02, zw - 0.2 - k * 0.07, 0.56, 0.6, 0.05, 10, bam, { rx: -1.3, gt: 1.2 }); }
    else { const r = rng.range(0.4, 0.5), jc = jit([0.1, 0.07, 0.05], rng, 0.2), zz = zp + rng.range(0.5, 1.2); wood.cyl(u, F, zz, r * 0.55, r, r * 1.2, 9, jc, { cap: false, g0: 0.6 }); wood.cyl(u, F + r * 1.2, zz, r, r * 0.6, r * 0.8, 9, jc, { cap: true, gt: 0.5 }); if (rng.chance(0.5)) wood.cyl(u, F + r * 2.0, zz, r * 0.7, r * 0.66, 0.05, 9, worn, {}); }
  }
  if (t > 0 && rng.chance(0.42)) { // pots of orchids and spring onions along the rail
    const m = rng.int(2, 5), u0 = rng.range(-hwp * 0.8, hwp * 0.3);
    for (let i = 0; i < m; i++) { const u = u0 + i * rng.range(0.38, 0.5), r = rng.range(0.09, 0.14);
      wood.cyl(u, F + 1.09, zp - 0.03, r * 0.7, r, r * 1.5, 6, jit([0.3, 0.13, 0.07], rng, 0.2), { cap: false, g0: 0.7 });
      const g = jit(col.tea, rng, 0.25); for (let k = 0; k < 3; k++) wood.cyl(u + rng.range(-0.04, 0.04), F + 1.09 + r * 1.3, zp - 0.03 + rng.range(-0.04, 0.04), r * 0.7, 0.0, rng.range(0.22, 0.45), 3, g, { cap: false, rz: rng.range(-0.35, 0.35), rx: rng.range(-0.35, 0.35), g0: 0.6, g1: 1.3 }); }
  }
}

// a necklace of red lanterns under the inner eave, one per bay, and four under the eave over the gate (its own small
// generator, so the bays' own random sequence is untouched)
function eaveNecklace(K) {
  const { P, wood } = K, dA = TAU / P.bays, keep = K.rng; let sd = 7 + P.bays;
  const r = () => { sd = (sd * 16807 + 11) % 2147483647; return sd / 2147483647; }; r.range = (a, b) => a + (b - a) * r();
  K.rng = r;
  const one = K.lod ? (x, y, z, s) => lanternLite(K, x, y, z, s, r() * 20) : (x, y, z, s) => lantern(K, x, y, z, s, r() * 20, 0.34);
  for (let b = 0; b < P.bays; b++) { wood.frame((b + 0.5) * dA); one(0, P.eaveIn - 0.28, P.rEaveIn - 0.3, 0.66 + 0.1 * r()); }
  const hk = K.hung; if (K.hungOut) K.hung = K.hungOut;   // the four over the gate hang from the OUTER eave
  wood.frame(0); for (const x of [-3.6, -1.25, 1.25, 3.6]) one(x, P.eaveOut - 0.3, P.rEaveOut - 0.55, 0.74);
  K.hung = hk; K.rng = keep;
}

// ---------- hung things: lanterns, tea trays on racks, laundry, strings, cages, curtains ----------
function cloth(K, x, ytopFn, z0, w, len, colr, ph, sw, fl, gl = 0, along = 'z') {
  const { hung } = K; hung.h[3] = ph; hung.h[4] = sw; hung.h[5] = fl; hung.h[6] = gl;
  const c0 = mul(colr, 1.05), c1 = mul(colr, 0.78);
  const cn = K.clothN || 3;
  hung.grid(cn, cn, (u, v) => { const s = (u - 0.5) * w, xx = along === 'z' ? x : x + s, zz = along === 'z' ? z0 + s : z0; return [xx, ytopFn(zz) - v * len, zz, mix(c0, c1, v)]; }, { pivotTop: true });
}

// the lap flies along ring A's second gallery (floor 8.4 m): washing hung no nearer the axis than this keeps, with its sway, 2.0 m from every point of the flown line (the need is 36.587 m, at the bay where the lap comes in)
const WASH_R = 36.65;

async function buildHung(K, ctx) {
  const { P, rng, col, wood, hung } = K, dA = TAU / P.bays, tn = Math.tan(dA / 2), cs = Math.cos(dA / 2), zp = P.rPost * cs, zb = P.rBack * cs, hwp = zp * tn;
  const cloths = [[0.03, 0.05, 0.16], [0.6, 0.6, 0.56], mul(col.red, 0.7), mul(col.blue, 0.9), [0.45, 0.3, 0.12], [0.5, 0.52, 0.5], [0.08, 0.16, 0.2]];
  const bam = col.bamboo;
  for (let t = 0; t < 4; t++) for (let b = 0; b < P.bays; b++) {
    if ((b & 3) === 0) await ctx.yield();
    if (b === 0 && K.hungTier) K.hungTier.push(hung.p.length / 3);   // (where each tier's hung things begin: see setInside)
    const F = P.floors[t], H = t < 3 ? P.floors[t + 1] - F : 3.25, yb = F + H - 0.74;
    wood.frame(b * dA); hung.M.copy(wood.M);
    // paired lanterns on the post bracket
    hung.hang(0, 0, 0); hung.box(-hwp, yb + 0.02, zp - 0.82, 0.78, 0.06, 0.06, mul(col.timber, 1.2), {});
    const two = K.festival || rng.chance(0.86), sz = rng.range(0.46, 0.56);
    lantern(K, -hwp - 0.31, yb, zp - 0.82, sz, rng() * 20, rng.range(0.22, 0.4));
    if (two) lantern(K, -hwp + 0.31, yb, zp - 0.82, sz * rng.range(0.9, 1.05), rng() * 20, rng.range(0.22, 0.4));
    if (K.festival) for (let k = 0; k < 3; k++) lanternLite(K, (k - 1) * hwp * 0.5 + hwp * 0.25, F + H - 0.12, zp - 0.12, 0.34, rng() * 20);   // the New Year's second set: the light lantern (20 triangles), so the festival stays inside the triangle budget
    hung.M.copy(wood.M);
    // strings of chillies and maize, herb bundles, hung from the beam
    const ns = rng.int(t === 0 ? 1 : 0, t === 0 ? 4 : 2);
    for (let i = 0; i < ns; i++) {
      const u = rng.range(-hwp * 0.85, hwp * 0.85), L = rng.range(0.7, 1.4), kind = rng.int(0, 2), z = zp + rng.range(0.15, 0.4), yy = F + H - 0.32;
      hung.hang(u, yy, z, rng() * 20, 0.14, 0.0, 0);
      if (kind === 0) hung.cyl(u, yy - L, z, 0.05, 0.085, L, 5, jit(mul(col.red, 0.85), rng, 0.15), { cap: false, g0: 0.7, a0: rng() });
      else if (kind === 1) hung.cyl(u, yy - L, z, 0.09, 0.1, L, 5, jit([0.62, 0.42, 0.07], rng, 0.15), { cap: false, g0: 0.75, a0: rng() });
      else { hung.cyl(u, yy - 0.3, z, 0.012, 0.012, 0.3, 3, [0.05, 0.04, 0.03], { cap: false }); hung.cyl(u, yy - 0.3 - L * 0.5, z, 0.16, 0.04, L * 0.5, 5, jit([0.25, 0.3, 0.16], rng, 0.2), { cap: false, g0: 0.6 }); }
    }
    if (t === 0 || (t === 0 && b === 0)) continue;
    const slide = t === 2 && b === K.slideBay, f = slide ? 0.6 : rng(), uc = rng.range(-0.9, 0.9);
    if (f < 0.5) { // tea trays on a cantilevered rack (it quivers in the breeze: negative swing = bounce about the rail)
      hung.hang(uc, F + 1.1, zp + 0.2, rng() * 20, -0.026, 0, 0);
      for (let k = -1; k <= 1; k++) hung.box(uc + k * 1.36, F + 1.09, zp - 1.05, 0.055, 0.055, 2.75, jit(bam, rng, 0.1), { skip: 's' });
      for (const z of [zp - 0.42, zp - 1.35, zp - 2.3]) hung.box(uc, F + 1.145, z, 2.95, 0.045, 0.045, jit(bam, rng, 0.1), {});
      for (const s of [-1, 1]) hung.box(uc + s * 1.36, F + 0.36, zp - 1.15, 0.045, 0.045, 2.17, mul(bam, 0.8), { rx: 0.67, skip: 'ns' });
      const spots = [[-0.68, -0.88], [0.68, -0.88], [0, -1.9], [-1.36, -1.9], [1.36, -1.9]], nt = rng.int(3, 5);
      for (let i = 0; i < nt; i++) {
        const sx = uc + spots[i][0], sz2 = zp + spots[i][1], w = rng() * rng();
        const tea = K.persimmon ? jit([0.7, 0.26, 0.03], rng, 0.15) : mul(mix(col.tea, [0.3, 0.19, 0.06], w), 1.5);
        hung.h[6] = 0; hung.cyl(sx, F + 1.17, sz2, 0.55, 0.6, 0.07, 10, jit([0.5, 0.4, 0.2], rng, 0.1), { cap: false, g0: 0.6, a0: rng() });
        if (rng.chance(0.9)) { hung.h[6] = -1; hung.cyl(sx, F + 1.2, sz2, 0.57, 0.0, 0.03, 10, tea, { cap: false, g0: 1, g1: 1.15 }); }
        else hung.cyl(sx, F + 1.18, sz2, 0.57, 0.0, 0.01, 10, [0.45, 0.36, 0.18], { cap: false, g0: 1 });
      }
      hung.h[6] = 0;
    } else if (f < 0.76) { // laundry on a pole pushed out over the court
      const ph = rng() * 20, gl = slide ? -2 : 0, tilt = 0.13, zc = zp - 1.0, yc = F + 1.32, py = (z) => yc + (zc - z) * Math.tan(tilt);
      hung.hang(uc, yc, zc, ph, 0, 0, gl);
      hung.box(uc, yc, zc, 0.055, 0.055, 3.5, jit(bam, rng, 0.1), { rx: tilt });
      const z0 = zp - 0.55, nc = rng.int(3, 4), row = []; let run = -0.06;
      for (let i = 0; i < nc; i++) { const w = rng.range(0.4, 0.62), len = rng.range(0.65, 1.25); row.push([w, len, jit(rng.pick(cloths), rng, 0.12)]); run += w + 0.06; }
      // on the lap's gallery no washing hangs nearer the ring's axis than WASH_R: a row that would pass it is fitted between its start and that limit, widths and gaps together
      const k = t === 2 ? Math.min(1, (z0 - WASH_R) / run) : 1; let z = z0;
      for (let i = 0; i < nc; i++) { const [w, len, c] = row[i], wk = w * k; cloth(K, uc, (zz) => py(zz) - 0.02, z - wk / 2, wk, len, c, ph + i, 0.24, 0.2, gl); z -= wk + 0.06 * k; }
    }
    const cg = K.cageRng;
    if (cg && cg() < 0.2) { // a songbird in a bamboo cage hung from the beam: open bars, two perches, a bird that hops between them
      const u = cg.range(-hwp * 0.6, hwp * 0.6), yy = F + H - 0.32, z = zp - 0.04, cr = 0.25, ch = 0.4, yb0 = yy - 0.52 - ch, cb = jit(bam, cg, 0.1), ph = cg() * 20;
      hung.hang(u, yy, z, ph, 0.1, 0, 0);
      hung.box(u, yy - 0.52, z, 0.022, 0.52, 0.022, [0.04, 0.03, 0.03], { skip: 'tb' });
      hung.cyl(u, yb0 - 0.03, z, cr, cr, 0.04, 10, cb, { capB: true, gt: 0.6 }); hung.cyl(u, yb0 + ch, z, cr, cr, 0.03, 10, cb, { cap: false });   // floor tray and top hoop
      hung.cyl(u, yb0 + ch + 0.03, z, cr, 0.03, 0.12, 10, mul(cb, 1.1), { cap: false });   // the domed top
      for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; hung.box(u + Math.sin(a) * cr, yb0, z + Math.cos(a) * cr, 0.02, ch, 0.02, cb, { skip: 'tb', ry: a }); }
      hung.box(u, yb0 + 0.13, z, 0.44, 0.016, 0.016, mul(cb, 0.7), {});   // the perch, along the gallery
      const bc = cg.pick([[0.85, 0.7, 0.1], [0.24, 0.5, 0.16], [0.72, 0.22, 0.1], [0.75, 0.75, 0.7]]);
      hung.h[6] = -3;   // the hop (hung vertex shader)
      hung.box(u, yb0 + 0.145, z, 0.075, 0.085, 0.13, bc, { taper: 0.012 }); hung.box(u, yb0 + 0.21, z + 0.055, 0.06, 0.06, 0.07, mul(bc, 1.1), { taper: 0.01 });
      hung.box(u, yb0 + 0.235, z + 0.1, 0.02, 0.015, 0.035, [0.9, 0.6, 0.15], {}); hung.box(u, yb0 + 0.17, z - 0.11, 0.045, 0.012, 0.12, mul(bc, 0.7), { rx: -0.35 });
      hung.h[6] = 0;
    }
  }
  if (K.hungTier) K.hungTier.push(hung.p.length / 3);   // (where the four tiers' hung things end)
  // door curtains breathe
  for (const [b, u, ytop, w, sd] of K.curtains) {
    wood.frame(b * dA); hung.M.copy(wood.M);
    cloth(K, u, () => ytop - 0.02, zb - 0.1, w * 0.96, rng.range(1.0, 1.5), jit(rng.pick([cloths[0], cloths[1], cloths[2], cloths[6]]), rng, 0.15), sd * 20, 0.05, 0.13, 0, 'x');
  }
}

// ---------- court: shrine, well, mill, mats, table ----------
function buildShrine(K) {
  const { rng, col, wood, roof, hung } = K, st = jit(mul(col.stone, 1.15), rng, 0.06), sx = 0, sz = -12.5;
  wood.M.identity(); wood.push(sx, 0, sz);
  wood.box(0, 0, 0, 11.6, 0.6, 8.4, st, { taper: 0.06, g0: 0.7 });
  for (let k = 0; k < 3; k++) wood.box(0, 0, 4.2 + 0.3 + k * 0.3, 4.2, 0.45 - k * 0.15, 0.32, mul(st, 0.95), { skip: 'b' });
  const lime = col.lime, wr = [0.2, 0.05, 0.035];
  wood.box(0, 0.6, -3.3, 10.2, 3.5, 0.3, lime, { g0: 0.55 });
  for (const s of [-1, 1]) { wood.box(s * 4.95, 0.6, -0.9, 0.3, 3.5, 5.1, lime, { g0: 0.55 }); wood.box(s * 4.95, 0.6, -0.9, 0.34, 0.9, 5.14, mix(lime, col.earth, 0.6), { g0: 0.6, skip: 't' }); }
  wood.box(0, 0.6, -3.1, 9.6, 3.4, 0.1, mul(wr, 0.5), { skip: 'n', g0: 0.5 });
  for (const x of [-4.7, -1.75, 1.75, 4.7]) { wood.cyl(x, 0.6, 2.9, 0.3, 0.25, 0.3, 8, st, {}); wood.cyl(x, 0.9, 2.9, 0.2, 0.17, 3.0, 8, jit(wr, rng, 0.1), { cap: false, g0: 0.7 }); }
  wood.box(0, 3.85, 2.9, 10.3, 0.4, 0.26, mul(wr, 0.9), {}); wood.box(0, 3.5, 2.9, 3.4, 0.35, 0.1, mul(col.timber, 1.2), {});
  wood.box(0, 3.05, 3.02, 2.0, 0.6, 0.08, [0.02, 0.02, 0.03], { skip: 'n' }); for (let k = 0; k < 3; k++) wood.box(-0.6 + k * 0.6, 3.17, 3.07, 0.36, 0.36, 0.02, [0.55, 0.4, 0.1], { skip: 'n' });
  // altar with red cloth and tablets
  wood.box(0, 0.6, -2.3, 3.4, 1.0, 0.9, mul(wr, 0.8), {}); wood.box(0, 0.62, -1.84, 3.3, 0.95, 0.02, mul(col.red, 0.8), { skip: 'n' });
  for (let k = 0; k < 5; k++) wood.box(-1.2 + k * 0.6, 1.6, -2.4, 0.22, 0.55 + (k === 2 ? 0.25 : 0), 0.1, [0.5, 0.36, 0.1], {});
  for (const s of [-1, 1]) wood.box(s * 2.6, 0.75, 3.02, 0.3, 2.6, 0.03, mul(col.red, 0.7), { skip: 'n', g0: 0.8 });
  // swept tile roof with upturned ends, underside, ridge
  const ridgeY = 6.5, tc = col.tile, drop = (v) => 2.55 * (0.45 * v + 0.55 * (1 - (1 - v) * (1 - v)));
  const sheet = (side, dy) => (u, v) => { const a = Math.abs(u * 2 - 1), sw = a * a * a; return [(u * 2 - 1) * (6.0 + 0.55 * v), ridgeY - 0.1 + dy + 0.4 * sw * (1 - v) - drop(v) + 0.85 * sw * v, side * (0.12 + v * 5.0), mul(tc, 1 - 0.12 * v), (u * 2 - 1) * 6.0 / 0.3, v * 5.6 / 0.34]; };
  roof.M.copy(wood.M);
  for (const s of [-1, 1]) { roof.grid(12, 5, sheet(s, 0), { up: [0, 1, 0] }); wood.grid(8, 2, (u, v) => { const p = sheet(s, -0.14)(u, v); p[3] = mul(col.timber, 1.1 - 0.5 * (1 - v)); return p; }, { up: [0, -1, 0] }); }
  for (const s of [-1, 1]) wood.quad([s * 4.95, 4.1, -3.3], [s * 4.95, 4.1, 3.0], [s * 4.95, ridgeY - 0.2, 0.1], [s * 4.95, ridgeY - 0.2, -0.1], mul(lime, 0.8), mul(lime, 0.6), [s, 0, 0]);
  const lm = mul(col.lime, 1.05);
  for (let i = 0; i < 12; i++) { const u0 = (i + 0.5) / 12, a = u0 * 2 - 1, y = ridgeY - 0.12 + 0.4 * Math.abs(a * a * a); wood.box(a * 6.0, y, 0, 1.04, 0.34, 0.34, lm, { rz: Math.atan(1.2 * a * Math.abs(a) / 6.0) * 1.0, taper: 0.04, g0: 0.6 }); }
  for (const s of [-1, 1]) wood.box(s * 6.15, ridgeY + 0.2, 0, 0.7, 0.5, 0.22, mul(tc, 0.9), { rz: s * 0.6, taper: 0.08 });
  wood.box(0, ridgeY + 0.2, 0, 0.5, 0.45, 0.3, mul(col.red, 0.5), { taper: 0.1 });
  if (K.cast) {   // ring A's shrine is passed at arm's length: rib tiles on its roof, a timber frame, lattice windows, a plaque and lanterns on its back and side walls
    for (const sd of [-1, 1]) for (let k = -20; k < 20; k++) {
      const u = ((k + 0.5) * 0.05 + 1) / 2, f = sheet(sd, 0); let pv = null;
      for (let j = 0; j <= 5; j++) {
        const p = f(u, Math.min(j / 5, 1) * 1.0), cur = [p[0], p[1], p[2], p[5]];
        if (pv) for (const e of [-1, 1]) { roof.tu = k + 0.5;
          const A = [pv[0] + e * 0.115, pv[1] - 0.01, pv[2]], B = [cur[0] + e * 0.115, cur[1] - 0.01, cur[2]], Cc = [cur[0], cur[1] + 0.1, cur[2]], D = [pv[0], pv[1] + 0.1, pv[2]], nb = [e * 0.9, 0.44, 0], nt = [0, 0.95, sd * 0.3];
          tileTri(roof, A, nb, pv[3], tc, B, nb, cur[3], tc, Cc, nt, cur[3], tc); tileTri(roof, A, nb, pv[3], tc, Cc, nt, cur[3], tc, D, nt, pv[3], tc); }
        pv = cur;
      }
    }
    const tm = mul(wr, 1.25), dk = [0.02, 0.016, 0.014], gold = [0.6, 0.42, 0.1], keepR = K.rng, rs = K.stream('hall-frame'); K.rng = rs;
    for (const x of [-5.0, -2.5, 0, 2.5, 5.0]) wood.box(x, 0.6, -3.5, 0.24, 3.5, 0.16, jit(tm, rs, 0.1), { skip: 'sb', g0: 0.7 });
    for (const y of [1.5, 3.86]) wood.box(0, y, -3.5, 10.2, 0.2, 0.14, tm, { skip: 's' });
    wood.box(0, 2.0, -3.49, 1.9, 1.45, 0.06, dk, { skip: 's', g0: 1 });   // a square lattice window behind the altar
    for (let i = 0; i < 5; i++) { wood.box(-0.8 + i * 0.4, 2.0, -3.54, 0.06, 1.45, 0.05, gold, { skip: 'sb' }); if (i < 4) wood.box(0, 2.22 + i * 0.34, -3.54, 1.9, 0.06, 0.05, gold, { skip: 's' }); }
    wood.box(0, 1.9, -3.53, 2.2, 0.1, 0.16, tm, { skip: 's' }); wood.box(0, 3.45, -3.53, 2.2, 0.1, 0.16, tm, { skip: 's' });
    for (const x of [-3.75, 3.75]) { wood.box(x, 1.75, -3.49, 0.62, 1.9, 0.04, mul(col.red, 0.75), { skip: 's', g0: 0.8 }); for (let i = 0; i < 4; i++) wood.box(x, 1.95 + i * 0.44, -3.53, 0.3, 0.3, 0.02, gold, { skip: 's', rz: Math.PI / 4 }); }
    for (const sd of [-1, 1]) {
      for (const z of [-3.3, -0.9, 1.6]) wood.box(sd * 5.14, 0.6, z, 0.16, 3.5, 0.24, jit(tm, rs, 0.1), { skip: 'b', g0: 0.7 });
      for (const y of [1.5, 3.86]) wood.box(sd * 5.14, y, -0.85, 0.14, 0.2, 5.1, tm, {});
      wood.box(sd * 5.13, 2.05, -2.1, 0.06, 1.1, 1.3, dk, { g0: 1 }); for (let i = 0; i < 4; i++) wood.box(sd * 5.17, 2.05, -2.6 + i * 0.33, 0.05, 1.1, 0.06, gold, { skip: 'b' });
      wood.box(sd * 5.13, 1.9, 0.4, 0.05, 1.6, 0.7, mul(col.red, 0.7), { g0: 0.8 });
      lantern(K, sd * 5.6, 4.5, -4.3, 0.62, rs() * 9, 0.5); lantern(K, sd * 2.0, 3.85, -4.55, 0.56, rs() * 9, 0.3);
    }
    K.rng = keepR;
  }
  // lanterns under the front beam
  for (const s of [-1, 1]) lantern(K, s * 3.2, 3.85, 3.25, 0.72, rng() * 9, 0.4);
  // bronze incense burner on a plinth in front of the steps
  const bz = [0.09, 0.075, 0.045], bx = 0, bzz = 7.2;
  wood.cyl(bx, 0, bzz, 0.75, 0.68, 0.45, 8, st, { g0: 0.7 });
  for (let k = 0; k < 3; k++) wood.box(bx + Math.sin(k * 2.094) * 0.3, 0.45, bzz + Math.cos(k * 2.094) * 0.3, 0.1, 0.4, 0.1, bz, { skip: 'tb' });
  wood.cyl(bx, 0.8, bzz, 0.3, 0.52, 0.45, 10, bz, { cap: false, g0: 0.6, g1: 1.3 }); wood.cyl(bx, 1.25, bzz, 0.56, 0.5, 0.08, 10, mul(bz, 1.4), { gt: 0.5 });
  for (const s of [-1, 1]) wood.box(bx + s * 0.55, 1.2, bzz, 0.06, 0.35, 0.2, bz, {});
  hung.M.copy(wood.M); hung.hang(0, 0, 0, 0, 0, 0, 5);
  for (let k = 0; k < 5; k++) hung.box(bx + rng.range(-0.25, 0.25), 1.33, bzz + rng.range(-0.25, 0.25), 0.025, 0.35, 0.025, [0.9, 0.3, 0.06], { skip: 'b' });
  hung.h[6] = 0;
  K.incense = [sx + bx, 1.75, sz + bzz]; K.shrine = [sx, 3, sz];
  if (K.cast) { K.cast.M.copy(wood.M); K.cast.quad([-6.5, 4.7, -5.1], [6.5, 4.7, -5.1], [6.5, 4.7, 5.1], [-6.5, 4.7, 5.1], [1, 1, 1]); K.cast.M.identity(); }
  wood.pop();
}

function buildCourt(K) {
  const { P, rng, col, wood, hung } = K, st = jit(mul(col.stone, 1.1), rng, 0.06), side = K.side, worn = col.wood2;
  // cobbled court and outer apron (pattern in the shader)
  const cob = K.cob, cc = [0.34, 0.325, 0.3];
  cob.frame(0);
  cob.lathe([[P.R - 0.8, 0.02, mul(cc, 0.8)], [P.rPost, 0.02, cc], [20, 0.02, cc], [0.02, 0.02, cc]], 72);
  cob.lathe([[P.R + 10.5, -0.9, mul(cc, 0.8)], [P.R + 8.6, 0.0, cc], [P.R + 0.4, 0.07, cc]], 96);
  // well: slab, kerb, water, frame with a little plank roof (windlass and bucket are separate turning meshes)
  const [wx, wz] = K.well; wood.M.identity(); wood.push(wx, 0, wz, K.wellRot);
  wood.cyl(0, 0.02, 0, 2.1, 2.0, 0.18, 8, st, { g0: 0.8, a0: 0.39 });
  wood.lathe([[1.08, 0.2, mul(st, 0.75)], [1.12, 0.82, st], [1.02, 0.92, mul(st, 1.15)], [0.76, 0.92, mul(st, 1.15)], [0.74, 0.3, mul(st, 0.25)]], 12);
  wood.cyl(0, 0.3, 0, 0.75, 0.0, 0.02, 12, [0.015, 0.03, 0.035], { cap: false, g0: 1 });
  for (const s of [-1, 1]) { wood.box(s * 1.3, 0.2, 0, 0.16, 2.35, 0.16, mul(col.timber, 1.4), { g0: 0.7 }); wood.box(s * 1.3, 0.2, 0, 0.3, 0.3, 0.5, st, {}); }
  wood.box(0, 2.45, 0, 3.0, 0.14, 0.14, mul(col.timber, 1.4), {});
  for (const s of [-1, 1]) wood.box(0, 2.62, s * 0.42, 3.3, 0.05, 1.05, jit(worn, rng, 0.1), { rx: s * 0.5, gt: 1.2 });
  wood.box(0, 1.0, 0, 0.02, 0.62, 0.02, [0.3, 0.25, 0.15], { skip: 'tb' });
  wood.box(1.9, 0.2, 0.9, 0.5, 0.42, 0.5, mul(worn, 0.8), { taper: -0.04, gt: 0.3 }); // wash tub
  if (K.cast) { K.cast.M.copy(wood.M); K.cast.quad([-1.65, 2.6, -0.9], [1.65, 2.6, -0.9], [1.65, 2.6, 0.9], [-1.65, 2.6, 0.9], [1, 1, 1]); K.cast.M.identity(); }
  wood.pop();
  // stone mill base (upper stone turns separately)
  const [mx, mz] = K.mill; wood.M.identity(); wood.push(mx, 0, mz, K.millAt ? K.millAt[2] : 0);
  wood.cyl(0, 0, 0, 0.55, 0.6, 0.5, 8, mul(st, 0.8), { g0: 0.6 });
  wood.cyl(0, 0.5, 0, 1.0, 1.05, 0.14, 12, st, { gt: 0.6 }); wood.cyl(0, 0.6, 0, 0.72, 0.72, 0.22, 12, mul(st, 1.1), {});
  wood.box(1.25, 0, 0.3, 0.5, 0.36, 0.5, [0.14, 0.09, 0.05], { taper: 0.05, gt: 2.5 });
  wood.pop();
  // drying mats on the cobbles, low table with stools, brooms
  wood.M.identity();
  const grain = [[0.62, 0.48, 0.16], mul(col.tea, 1.1), [0.5, 0.2, 0.05], [0.6, 0.5, 0.3]];
  for (let i = 0; i < (K.laid ? 0 : K.mats); i++) {   // (ring A lays all its mats by the court's own rule: buildWaking)
    const a = -side * rng.range(0.5, 1.9) + rng.range(-0.2, 0.2), r = K.matR ? rng.range(K.matR[0], K.matR[1]) : rng.range(15, 29), x = Math.sin(a) * r, z = Math.cos(a) * r, w = rng.range(2.2, 3.2), d = rng.range(3.4, 5.2), ry = a + rng.range(-0.3, 0.3);
    if (Math.abs(x) < 3 || Math.abs(z - 6) < 3) continue;
    if (K.matList) K.matList.push([x, z, w, d, ry]);
    wood.box(x, 0.03, z, w, 0.03, d, [0.3, 0.23, 0.11], { ry, skip: 'b', gt: 1 });
    hung.M.identity(); hung.hang(x, 0.06, z, 0, 0, 0, -1);
    hung.box(x, 0.06, z, w - 0.4, 0.035, d - 0.4, desat(jit(rng.pick(grain), rng, 0.1)), { ry, skip: 'b', gt: 1.05, taper: 0.06 });
    hung.h[6] = 0;
  }
  const tx = K.table ? K.table[0] : side * 8.5, tz = K.table ? K.table[1] : -4.5; wood.push(tx, 0, tz);
  wood.cyl(0, 0.42, 0, 0.7, 0.7, 0.06, 10, jit(worn, rng, 0.1), { gt: 1.3 }); wood.cyl(0, 0, 0, 0.1, 0.1, 0.42, 5, mul(worn, 0.6), { cap: false });
  wood.cyl(0.15, 0.48, 0.1, 0.09, 0.07, 0.13, 6, [0.3, 0.12, 0.06], {});
  for (let k = 0; k < 5; k++) { const a = k * 1.3 + rng(), r = rng.range(1.0, 1.4); wood.box(Math.sin(a) * r, 0.28, Math.cos(a) * r, 0.34, 0.04, 0.34, worn, { ry: a, gt: 1.3 }); wood.box(Math.sin(a) * r, 0, Math.cos(a) * r, 0.26, 0.28, 0.26, mul(worn, 0.6), { ry: a, skip: 'tb', taper: -0.03 }); }
  if (K.breakfast) {   // breakfast left standing: five bowls of congee, a stack of bamboo steamers, chopsticks; the steam is one of the hero's smoke bases
    for (let k = 0; k < 5; k++) { const a = k * 1.257 + 0.4, bx = Math.sin(a) * 0.45, bz = Math.cos(a) * 0.45; wood.cyl(bx, 0.48, bz, 0.06, 0.11, 0.07, 7, [0.74, 0.72, 0.66], { cap: false, g0: 0.8 }); wood.cyl(bx, 0.535, bz, 0.1, 0.0, 0.005, 7, [0.8, 0.74, 0.6], { cap: false, g0: 1 }); wood.box(bx * 1.42, 0.485, bz * 1.42, 0.02, 0.012, 0.2, [0.4, 0.26, 0.12], { ry: a + 1.2 }); }
    for (let k = 0; k < 2; k++) wood.cyl(-0.14, 0.48 + k * 0.1, -0.1, 0.17, 0.17, 0.09, 9, jit([0.56, 0.45, 0.22], rng, 0.08), { gt: 1.2 });
    K.steam = [[tx, 0.62, tz]]; }
  wood.pop();
}

// ---------- the yards of the small rings, seen from above the mist sea (ring B, which stands twice: ring C is the same build; and the square ring S) ----------
// What buildCourt sets out stays where it stands: the hall on the axis from the gate, the well with its kerb and little roof, the mill, the table, the
// mats. Added here, each kind from a stream of its own (its name + the ring's), every try's dice drawn before its test:
//   MATS      two or three (drawn) more, of drying tea (green), of pepper or in autumn persimmon (red), the third either (drawn): 2.6 to 3.2 m by 3.8 to
//             5 m, the long side along the ring, anywhere round the court 9 to 27 m from its middle, where the keep-clear leaves room (YARD.tries each);
//   FIREWOOD  three stacks under the gallery against the kitchen wall, between the bay's two doors (YARD.stack long, of the ring's own metres: the doors
//             stand at least 1.02 m either side of the bay's middle), a log deep, 0.9 to 1.3 m high, in three bays drawn from those two and more from
//             the gate bay, three and more apart;
//   HENS      four to six (drawn) round a spot 4 to 7 m into the court from an open kitchen door (the first clear one of twelve drawn), each within
//             1.5 m of it, wandering 1.2 m and pecking (the hung shader);
//   FOLK      four to six (drawn), never more: the first so many of: one drawing water at the well's kerb; one turning the crop at the first new mat
//             (none if no mat found room); a carrier with a shoulder pole pacing 5 to 7 m each way along the cross path, 10 to 22 m from the medallion
//             on a drawn side; one at the mill; one at an open kitchen door, on the ring walk's court edge; one at the table.
// THE KEEP-CLEAR (YARD, the ring's own metres; a thing's radius is added): inside rIn of the middle (the ring walk and the foot of the galleries stay
// free); off the gate axis (its slabs reach 1.4 m) and the cross path (1.15 m); off the hall, its steps and its burner; off the well's slab, the mill and
// its trough, the table and its stools; off buildCourt's own mats and off what is laid here.
// TRUE SIZE: these are things of a person's measure, so each is built 1 / scale larger in the ring's own metres (o.scale: what the world stands the ring
// at). They are set down whole at their place in the ring as built (the square ring is rounded out after everything else: K.warp), not stretched with it.
const YARD = { rIn: 34, axis: 1.6, cross: 1.4, hall: [7.2, -18.2, -4.2], well: 3.2, mill: 2.6, table: 2.2, tries: 40, stack: 1.9 };
const YARD_COATS = [[0.42, 0.14, 0.05], [0.62, 0.6, 0.55], [0.05, 0.045, 0.04], [0.5, 0.3, 0.12]];
const YARD_CLOTHS = [[0.07, 0.13, 0.33], [0.4, 0.38, 0.35], [0.4, 0.11, 0.06], [0.15, 0.24, 0.42], [0.35, 0.27, 0.13], [0.09, 0.09, 0.11]];
function buildYardLife(K, o) {
  const { P, col, wood, hung, side } = K, T = 1 / o.scale, dA = TAU / P.bays, Y = YARD, table = K.table || [side * 8.5, -4.5], own = K.matList || [], laid = [];
  const at = (x, z) => { const k = K.warp ? K.warp(x, z) : 1; return [x * k, z * k]; };   // a place of the round plan, in the ring as built
  const bay = (b, u, r) => { const th = b * dA; return [Math.sin(th) * r + Math.cos(th) * u, Math.cos(th) * r - Math.sin(th) * u]; };   // u along a bay's wall, r out from the middle
  const clear = (x, z, rad) => Math.hypot(x, z) + rad <= Y.rIn && Math.abs(x) >= Y.axis + rad && Math.abs(z - 6) >= Y.cross + rad
    && !(Math.abs(x) < Y.hall[0] + rad && z > Y.hall[1] - rad && z < Y.hall[2] + rad)
    && Math.hypot(x - K.well[0], z - K.well[1]) >= Y.well + rad && Math.hypot(x - K.mill[0], z - K.mill[1]) >= Y.mill + rad && Math.hypot(x - table[0], z - table[1]) >= Y.table + rad
    && own.every((m) => Math.hypot(x - m[0], z - m[1]) >= Math.hypot(m[2], m[3]) / 2 + rad) && laid.every((m) => Math.hypot(x - m[0], z - m[1]) >= m[2] + rad);
  // the mats
  const mq = K.stream('court-mats-' + o.name), nMat = mq.int(2, 3), third = mq.chance(0.5), red = K.persimmon ? [0.7, 0.26, 0.03] : [0.5, 0.07, 0.03], green = mul(col.tea, 1.5), mats = [];
  for (let i = 0; i < 3; i++) {
    let got = null;
    for (let tr = 0; tr < Y.tries; tr++) {
      const a = mq() * TAU, r = mq.range(9, 27), w = mq.range(2.6, 3.2) * T, d = mq.range(3.8, 5.0) * T, ry = a + Math.PI / 2 + mq.range(-0.3, 0.3), k = mq.range(0.9, 1.1), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (!got && i < nMat && clear(x, z, Math.hypot(w, d) / 2)) got = { x, z, w, d, ry, k };
    }
    if (!got) continue;
    const [X, Z] = at(got.x, got.z), c = mul(i === 0 ? green : i === 1 ? red : third ? red : green, got.k);
    laid.push([got.x, got.z, Math.hypot(got.w, got.d) / 2]); mats.push({ X, Z, w: got.w, ry: got.ry });
    wood.M.identity(); wood.box(X, 0.03, Z, got.w, 0.03, got.d, [0.3, 0.23, 0.11], { ry: got.ry, skip: 'b', gt: 1 });
    hung.M.identity(); hung.hang(X, 0.06, Z, 0, 0, 0, -1);
    hung.box(X, 0.06, Z, got.w - 0.4 * T, 0.035, got.d - 0.4 * T, c, { ry: got.ry, skip: 'b', gt: 1.05, taper: 0.06 * T });
    hung.h[6] = 0;
  }
  // the firewood
  const wq = K.stream('court-wood-' + o.name), zb = P.rBack * Math.cos(dA / 2), dep = 0.45 * T, stacked = [];
  for (const b of wq.shuffle(Array.from({ length: P.bays - 3 }, (_, i) => i + 2))) {
    const h = wq.range(0.9, 1.3) * T, tone = wq.range(0.8, 1.15), ends = Array.from({ length: 15 }, () => wq.range(0.7, 1.2));
    if (stacked.length >= 3 || stacked.some((x) => Math.min(Math.abs(x - b), P.bays - Math.abs(x - b)) < 3)) continue;
    stacked.push(b);
    // (against the wall as built: the wall's face at the bay's middle, and the wall's own line there)
    const p = bay(b, 0, zb), W = at(p[0], p[1]), a0 = bay(b, -0.5, zb), a1 = bay(b, 0.5, zb), A0 = at(a0[0], a0[1]), A1 = at(a1[0], a1[1]), ry = Math.atan2(-(A1[1] - A0[1]), A1[0] - A0[0]);
    const cut = [0.6, 0.47, 0.27], bark = mul([0.27, 0.18, 0.1], tone), zc = -(0.03 + dep / 2);
    wood.M.identity(); wood.push(W[0], 0, W[1], ry);
    wood.box(0, 0.02, zc, Y.stack, h, dep, bark, { skip: 'b', g0: 0.7, gt: 1.2 });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const x0 = (i - 2.5) * Y.stack / 5 + 0.03, x1 = x0 + Y.stack / 5 - 0.06, y0 = 0.04 + j * h / 3, y1 = y0 + h / 3 - 0.04 * T, zf = zc - dep / 2 - 0.012, c = mul(cut, ends[i * 3 + j]);
      wood.quad([x0, y0, zf], [x1, y0, zf], [x1, y1, zf], [x0, y1, zf], c, c, [0, 0, -1]); }
    wood.pop();
  }
  // the hens
  const hen = (X, Z, s, ph, c) => { hung.M.identity(); hung.push(X, 0.03, Z); hung.M.scale(_v.set(s, s, s)); hung.hang(0, 0, 0, ph, 0, 0, -4);
    hung.box(0, 0.12, -0.02, 0.17, 0.17, 0.3, c, { taper: 0.03, skip: 'b' }); hung.box(0, 0.2, -0.2, 0.1, 0.2, 0.03, mul(c, 0.8), { rx: -0.6, skip: 'b' });
    hung.box(0, 0.24, 0.13, 0.08, 0.2, 0.09, c, { rx: 0.35, skip: 'b' }); hung.box(0, 0.43, 0.2, 0.02, 0.05, 0.07, [0.8, 0.05, 0.03], { skip: 'b' });
    hung.pop(); hung.h[6] = 0; };
  const hq = K.stream('court-hens-' + o.name), nHen = hq.int(4, 6), doors = K.kitchens; let spot = null;
  for (let tr = 0; tr < 12; tr++) { const pick = hq(), inw = hq.range(4, 7); if (!doors.length) continue;
    const dr = doors[Math.floor(pick * doors.length)], p = bay(dr[0], dr[1], P.rPost - inw); if (!spot && clear(p[0], p[1], 0)) spot = p; }
  for (let i = 0; i < 6; i++) { const a = hq() * TAU, r = 1.5 * T * Math.sqrt(hq()), ph = hq(), sc = hq.range(0.85, 1.15), coat = YARD_COATS[Math.floor(hq() * YARD_COATS.length)];
    if (!spot || i >= nHen) continue;
    const q = at(spot[0] + Math.sin(a) * r, spot[1] + Math.cos(a) * r); hen(q[0], q[1], T * sc, ph, coat); }
  // the folk: a figure under a conical hat, facing its own +z, moved by the hung shader (code -5 stands and bends, -6 paces)
  const figure = (X, Z, s, cloth, code, ph, A, B) => {
    const cl2 = mul(cloth, 0.74), indigo = [0.035, 0.045, 0.085], skin = [0.56, 0.37, 0.26], straw = [0.62, 0.53, 0.29];
    hung.M.identity(); hung.push(X, 0.03, Z); hung.M.scale(_v.set(s, s, s)); hung.hang(0, 0, 0, ph, A, B, code);
    for (const sx of [-0.1, 0.1]) hung.box(sx, 0, 0, 0.14, 0.86, 0.16, indigo, { skip: 'tb', g0: 0.7 });
    hung.box(0, 0.8, 0, 0.33, 0.64, 0.2, cloth, { taper: -0.035, g0: 0.76 }); hung.box(0, 1.36, 0, 0.44, 0.09, 0.22, cl2, { taper: 0.05, skip: 'b' });
    hung.cyl(0, 1.44, 0.01, 0.1, 0.085, 0.2, 5, skin, { g0: 0.8 }); hung.cyl(0, 1.6, 0, 0.34, 0.0, 0.18, 8, straw, { cap: false, g0: 0.72, g1: 1.2 });
    if (code < -5.5) {   // the carrier: a hand up on the pole each side, a basket at either end
      for (const sx of [-1, 1]) hung.box(sx * 0.22, 1.36, -0.02, 0.09, 0.34, 0.1, cl2, { rz: -sx * 1.25, skip: 'b', g0: 1 });
      hung.box(0, 1.42, -0.06, 1.7, 0.035, 0.035, [0.55, 0.44, 0.22], {});
      for (const sx of [-0.78, 0.78]) hung.cyl(sx, 0.5, -0.06, 0.2, 0.25, 0.36, 6, [0.5, 0.4, 0.2], { g0: 0.6 });
    } else for (const sx of [-1, 1]) hung.box(sx * 0.25, 1.38, 0, 0.09, 0.5, 0.1, cl2, { rx: Math.PI - 0.8, rz: sx * 0.12, skip: 'b', g0: 1 });
    hung.pop(); hung.h[6] = 0; };
  const fq = K.stream('court-folk-' + o.name), nFolk = fq.int(4, 6);
  const dice = Array.from({ length: 6 }, () => ({ s: T * TRUE_SIZE.villager / 1.78 * fq.range(1.0, 1.12), cloth: jit(YARD_CLOTHS[Math.floor(fq() * YARD_CLOTHS.length)], fq, 0.15), ph: fq() }));
  const cSide = fq.sign(), cAt = fq.range(10, 22), cHalf = fq.range(5, 7) * T, dPick = fq();
  const wr = K.wellRot, cw = Math.cos(wr), sw = Math.sin(wr), wd = 1.12 + 0.55 * T, m0 = mats[0], dr = doors.length ? doors[Math.floor(dPick * doors.length)] : null;
  const work = [
    { p: at(K.well[0] + 0.2 * cw - wd * sw, K.well[1] - 0.2 * sw - wd * cw), head: wr, bend: 0.42 },                                                      // at the kerb (1.12 m of the ring's own, and half a pace), facing the well
    m0 ? { p: [m0.X - (m0.w / 2 + 0.45 * T) * Math.cos(m0.ry), m0.Z + (m0.w / 2 + 0.45 * T) * Math.sin(m0.ry)], head: m0.ry + Math.PI / 2, bend: 0.6 } : null,   // at the middle of the mat's long edge, facing it
    { p: at(cSide * cAt, 6), walk: cHalf },                                                                                                                 // the carrier, along the cross path
    { p: at(K.mill[0] + 0.4, K.mill[1] + 1.05 + 0.6 * T), head: Math.PI, bend: 0.3 },                                                                     // at the millstone (1.05 m of the ring's own, and a pace)
    dr ? { p: (() => { const q = bay(dr[0], dr[1], P.rPost - 0.3); return at(q[0], q[1]); })(), head: dr[0] * dA + Math.PI, bend: 0.1 } : null,           // before the door, looking into the court
    { p: at(table[0] + side * (1.6 + 0.45 * T), table[1] + 0.4), head: -side * Math.PI / 2, bend: 0.2 },                                                  // beyond the stools (1.6 m of the ring's own), facing the table
  ];
  for (let i = 0; i < nFolk; i++) { const w = work[i], d = dice[i]; if (!w) continue;
    if (w.walk) figure(w.p[0], w.p[1], d.s, d.cloth, -6, d.ph, w.walk, 0); else figure(w.p[0], w.p[1], d.s, d.cloth, -5, d.ph, w.bend, w.head); }
  wood.M.identity(); hung.M.identity();
  K.yard = { mats: mats.length, stacks: stacked.length, hens: spot ? nHen : 0, folk: work.slice(0, nFolk).filter(Boolean).length };
}

// ---------- the court's life (ring A): a village waking inside its own walls. The things of the morning are set out here; the villagers and their stalls come in buildMarket ----------
// The design's cast: the earth god's house with its bronze burner and incense thread behind the hall, washing day at the well (buckets, water jars, a frame
// of washing) beside the low table with its stools and steaming bowls, the stone mill with sacks and winnowing trays, and round tea trays 1.2 m across laid
// out on straw mats in rosettes, rows and fans. WHERE THINGS STAND is the court's own business (layCourt): the hall, the earth god's house and the slab
// paths are fixed; the stalls stand along the cross path; the washing place and the mill each take a place round the court, clear of all of those; the mats
// fill the open cobbles between. Nothing set out on the cobbles reaches further from the middle than COURT.rOpen; outside it a round is left clear for the
// dog (COURT.rDog), inside the ring walk under the galleries where the carriers pace (COURT.rWalk). K.cast collects flat shapes whose shadows the low sun
// throws across the cobbles (makeShade); K.scenes the contact shade (and the lantern pools at night) the cobble shader lays under each scene.
export const COURT = { rOpen: 27.1, rDog: 29.15, rWalk: [31.2, 32.8] };
// The court's fixed places, in its own metres and frame (the gate toward +z): the cross path's line, the earth god's house behind the hall; how far a stall
// stands back from the cross path and its footprint (the awning and the buyers before it; x along the front, z out from it); the washing place's and the
// mill's footprints in their own frames (x along the ring, z outward: [x0, x1, z0, z1]), the
// band of radius their middles are drawn in, how far apart the two stand, the gap their footprints keep from paths and buildings.
const CROSS_Z = 6, GOD = [-4.5, -22.5], STALL_BACK = 4.8, STALL_RECT = [-2.5, 2.5, -1.7, 3.6], WASH_RECT = [-8.4, 8.0, -4.6, 4.2], MILL_RECT = [-5.0, 5.1, -4.4, 3.3], SCENE_R = [16, 21], SCENE_APART = 20, SCENE_GAP = 0.6;
function layCourt(K) {
  // what is set down so far: round things [x, z, radius] and footprints [x, z, turn, x0, x1, z0, z1] (a rectangle in the thing's own frame)
  const taken = K.taken = [[GOD[0], GOD[1], 4.0]];
  const off = (x, z, t) => { if (t.length === 3) return Math.hypot(x - t[0], z - t[1]) - t[2];
    const cf = Math.cos(t[2]), sf = Math.sin(t[2]), lx = (x - t[0]) * cf - (z - t[1]) * sf, lz = (x - t[0]) * sf + (z - t[1]) * cf; return Math.hypot(Math.max(t[3] - lx, 0, lx - t[4]), Math.max(t[5] - lz, 0, lz - t[6])); };
  // is a round thing of radius `rad` at (x, z) clear of the slab paths (the gate axis, the cross path), of the hall and its burner, and of everything set down so far?
  const free = K.free = (x, z, rad) => {
    if (Math.abs(x) < 1.6 + rad || Math.abs(z - CROSS_Z) < 1.4 + rad) return false;
    if (Math.abs(x) < 7.2 + rad && z < -6.2 + rad && z > -18.2 - rad) return false;
    return !taken.some((t) => off(x, z, t) < rad);
  };
  // THE STALLS stand along the cross path, three down one arm and two down the other (which arm has three is drawn), fronts to the path and STALL_BACK from
  // its middle line (the awning's front edge 3.1 m off it, the buyers at the edge of the slabs), on alternate sides of the path: the first 6.5 to 8 m from
  // the medallion, each next one 4.4 to 5.6 m further out (two on one side are then 8.8 m and more apart; an awning is 4.6 m wide). From 'court-stalls'.
  { const q = K.stream('court-stalls'), arm0 = q.sign(); K.stallSites = [];
    for (const [arm, n] of [[arm0, 3], [-arm0, 2]]) { let s = q.range(6.5, 8), side = q.sign();
      for (let k = 0; k < n; k++) { const x = arm * s, z = CROSS_Z + side * STALL_BACK; const ry = side > 0 ? Math.PI : 0; K.stallSites.push([x, z, ry]); taken.push([x, z, ry, ...STALL_RECT]); s += q.range(4.4, 5.6); side = -side; } } }
  // THE WASHING PLACE (the well, the low table beside it, the washing) and THE MILL each take a place round the court from 'court-scenes': a bearing all
  // round, a radius in SCENE_R, lying along the ring; the whole footprint SCENE_GAP clear of the slab paths, the hall, the earth god's house and the stalls,
  // and inside COURT.rOpen; the mill's middle SCENE_APART and more from the washing place's, so the two stand in different quarters of the court.
  const q = K.stream('court-scenes');
  const fits = (cx, cz, ry, [x0, x1, z0, z1]) => { const cf = Math.cos(ry), sf = Math.sin(ry), nx = Math.ceil(x1 - x0), nz = Math.ceil(z1 - z0);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const lx = x0 + (x1 - x0) * i / nx, lz = z0 + (z1 - z0) * j / nz, x = cx + lx * cf + lz * sf, z = cz - lx * sf + lz * cf; if (Math.hypot(x, z) > COURT.rOpen || !free(x, z, SCENE_GAP)) return false; }
    return true; };
  const scene = (rect, other) => { let a = 0, x = 0, z = 0;
    for (let tr = 0; tr < 600; tr++) { a = q() * TAU; const r = q.range(SCENE_R[0], SCENE_R[1]); x = Math.sin(a) * r; z = Math.cos(a) * r; if (fits(x, z, a, rect) && !(other && Math.hypot(x - other[0], z - other[1]) < SCENE_APART)) break; }
    return [x, z, a]; };
  const frame = ([x, z, ry]) => { const cf = Math.cos(ry), sf = Math.sin(ry); return (lx, lz) => [x + lx * cf + lz * sf, z - lx * sf + lz * cf]; };
  K.wash = scene(WASH_RECT, null);
  { const T = frame(K.wash); K.well = T(-2.9, 0.9); K.wellRot = K.wash[2] + 0.35; K.table = T(3.1, -0.3); K.breakfast = true; taken.push([...K.wash, ...WASH_RECT]); }
  K.millAt = scene(MILL_RECT, K.wash);
  { K.mill = [K.millAt[0], K.millAt[1]]; taken.push([...K.millAt, ...MILL_RECT]); }
  // Two knots of people have their places before any mat is laid, from 'r17c-court-odds' (K.odds; buildMarket draws on after these): three elders
  // talking by the hall steps (either side of the axis, 3.4 to 9.5 m off it, between the burner and the cross path), and three talking inside the gate
  // beside the gate path (on either side, 3.2 to 4.2 m off its middle line, 12 to 17 m from the court's middle).
  K.odds = K.stream('r17c-court-odds'); K.knots = [];
  for (const spot of [(o) => [o.sign() * o.range(3.4, 9.5), o.range(-4.4, -1.2), 1.3], (o) => [o.sign() * o.range(3.2, 4.2), o.range(12, 17), 1.6]])
    for (let g = 0; g < 300; g++) { const [px, pz, rad] = spot(K.odds); if (!free(px, pz, rad)) continue; K.knots.push([px, pz]); taken.push([px, pz, 1.65]); break; }
  // the ducks keep to the water: their file goes round the well just outside its slab and its wash tub (radius 2.85, give or take 0.15), a duck every 0.85 m
  // or so, at a duck's waddle (0.36 m a second)
  K.duckR = 2.85; K.duckJit = 0.15; K.duckGap = 0.3; K.duckPace = 0.36; K.duckWhite = true; K.laid = true;
}
async function buildWaking(K, ctx) {
  const { col, wood, hung, roof, cast } = K, rng = K.mrng, bam = col.bamboo, worn = col.wood2, W1 = [1, 1, 1], mq = K.stream('court-mats');
  const scenes = K.scenes = [], taken = K.taken, free = K.free;
  const sr = makeRng(Math.floor(K.duckPhase * 1e6) + 173), keepRng = K.rng; K.rng = sr;
  K.midMats = []; K.trayList = [];
  const place = (x, z, ry) => { wood.M.identity(); wood.push(x, 0, z, ry); hung.M.copy(wood.M); roof.M.copy(wood.M); const cf = Math.cos(ry), sf = Math.sin(ry); return (lx, ly, lz) => [x + lx * cf + lz * sf, ly, z - lx * sf + lz * cf]; };
  const jar = (x, z, s, c) => { wood.cyl(x, 0, z, 0.26 * s, 0.42 * s, 0.5 * s, 9, c, { cap: false, g0: 0.6 }); wood.cyl(x, 0.5 * s, z, 0.42 * s, 0.2 * s, 0.36 * s, 9, c, { gt: 0.3 }); };
  const basket = (bx, bz, g, s = 1) => { wood.cyl(bx, 0, bz, 0.3 * s, 0.4 * s, 0.42 * s, 7, jit([0.42, 0.33, 0.16], sr, 0.1), { cap: false, g0: 0.6 }); wood.cyl(bx, 0.36 * s, bz, 0.38 * s, 0.12 * s, 0.16 * s, 7, jit(g, sr, 0.12), { gt: 1.2, g0: 0.8 }); };
  const hat = (x, y, z, rx = 0) => { wood.cyl(x, y, z, 0.46, 0.0, 0.22, 10, [0.64, 0.54, 0.3], { cap: false, g0: 0.7, g1: 1.2, rx }); };
  const teaCol = (w, q) => K.persimmon && q() < 0.55 ? jit([0.7, 0.26, 0.03], q, 0.15) : mul(mix(col.tea, [0.3, 0.19, 0.06], w), 1.5);
  // a round bamboo tray of drying leaf, in the hung soup (glow -1 = the leaf speckle); x, z in the soup's current frame
  const tray = (x, y, z, r, tea, q) => { hung.hang(x, y, z, 0, 0, 0, 0); hung.cyl(x, y, z, r * 0.94, r, 0.09, 10, jit([0.5, 0.4, 0.2], q, 0.1), { cap: false, g0: 0.6, a0: q() }); hung.h[6] = -1; hung.cyl(x, y + 0.05, z, r * 0.96, 0.0, 0.03, 10, tea, { cap: false, g0: 1, g1: 1.15 }); hung.h[6] = 0; };
  { // 1. the earth god's house behind the hall: a stone platform, a small limewashed shrine under a swept tile roof, a bronze burner whose incense thread climbs seven metres, red candles, offerings
    const ry = Math.atan2(GOD[0], GOD[1]), T = place(GOD[0], GOD[1], ry), st = jit(mul(col.stone, 1.2), sr, 0.06), bz = [0.1, 0.082, 0.05], red = mul(col.red, 0.8), gold = [0.62, 0.44, 0.1], lime = col.lime, y0 = 0.4;
    wood.box(0, 0, 0, 6.2, y0, 4.8, st, { taper: 0.06, g0: 0.7 }); wood.box(0, 0, 2.62, 3.0, 0.2, 0.5, mul(st, 0.95), { skip: 'b' });
    wood.box(0, y0, -1.3, 2.7, 2.25, 1.6, lime, { g0: 0.6 }); wood.box(0, y0, -1.3, 2.74, 0.7, 1.64, mix(lime, col.earth, 0.6), { g0: 0.6, skip: 't' });
    wood.box(0, y0 + 0.4, -0.49, 1.3, 1.5, 0.04, [0.02, 0.016, 0.014], { skip: 'n', g0: 1 });   // the niche, its gilt figure, couplets and a lintel board
    wood.cyl(0, y0 + 0.45, -0.6, 0.28, 0.17, 0.62, 6, gold, { cap: false, g0: 0.6 }); wood.cyl(0, y0 + 1.07, -0.6, 0.14, 0.12, 0.22, 6, mul(gold, 1.2), {});
    for (const s of [-1, 1]) wood.box(s * 0.98, y0 + 0.3, -0.48, 0.3, 1.65, 0.03, red, { skip: 'n', g0: 0.8 });
    wood.box(0, y0 + 2.0, -0.48, 2.0, 0.24, 0.03, red, { skip: 'n' }); for (let k = 0; k < 3; k++) wood.box(-0.5 + k * 0.5, y0 + 2.04, -0.46, 0.2, 0.16, 0.02, gold, { skip: 'n' });
    const tc = col.tile, sheet = (side, dy) => (u, v) => { const a = Math.abs(u * 2 - 1), sw = a * a * a; return [(u * 2 - 1) * (2.3 + 0.25 * v), 3.85 + dy + 0.2 * sw * (1 - v) - 0.95 * (0.45 * v + 0.55 * (1 - (1 - v) * (1 - v))) + 0.42 * sw * v, -1.3 + side * (0.08 + v * 1.75), mul(tc, 1 - 0.12 * v), (u * 2 - 1) * 2.3 / 0.3, v * 2.0 / 0.34]; };
    for (const s of [-1, 1]) { roof.grid(8, 3, sheet(s, 0), { up: [0, 1, 0] }); wood.grid(4, 1, (u, v) => { const p = sheet(s, -0.1)(u, v); p[3] = mul(col.timber, 1.0 - 0.5 * (1 - v)); return p; }, { up: [0, -1, 0] }); }
    for (const s of [-1, 1]) wood.quad([s * 1.35, y0 + 2.25, -2.1], [s * 1.35, y0 + 2.25, -0.5], [s * 1.35, 3.7, -1.25], [s * 1.35, 3.7, -1.35], mul(lime, 0.8), mul(lime, 0.6), [s, 0, 0]);
    wood.box(0, 3.74, -1.3, 4.5, 0.24, 0.28, mul(col.lime, 1.05), { taper: 0.03, g0: 0.6 });
    for (const s of [-1, 1]) wood.box(s * 2.36, 3.92, -1.3, 0.5, 0.36, 0.2, mul(tc, 0.9), { rz: s * 0.6, taper: 0.06 });
    // the burner: three legs, a round belly, a rim with two ears, ash, sticks with glowing tips
    const bx = 0, bzz = 1.0;
    for (let k = 0; k < 3; k++) wood.cyl(bx + Math.sin(k * 2.094 + 0.5) * 0.56, y0, bzz + Math.cos(k * 2.094 + 0.5) * 0.56, 0.09, 0.17, 0.62, 5, bz, { cap: false, g0: 0.6 });
    wood.cyl(bx, y0 + 0.56, bzz, 0.5, 0.92, 0.5, 12, bz, { cap: false, g0: 0.6, g1: 1.25 }); wood.cyl(bx, y0 + 1.06, bzz, 0.92, 0.84, 0.44, 12, mul(bz, 1.3), { cap: false });
    wood.cyl(bx, y0 + 1.5, bzz, 0.97, 0.97, 0.08, 12, mul(bz, 1.6), { gt: 0.3 });
    for (const s of [-1, 1]) { wood.box(bx + s * 0.97, y0 + 1.5, bzz, 0.1, 0.52, 0.36, bz, {}); wood.box(bx + s * 0.97, y0 + 1.94, bzz, 0.12, 0.1, 0.5, mul(bz, 1.3), {}); }
    for (let k = 0; k < 9; k++) { const px = bx + sr.range(-0.55, 0.55), pz = bzz + sr.range(-0.55, 0.55), h = 0.55 + 0.35 * sr();
      wood.box(px, y0 + 1.58, pz, 0.035, h, 0.035, [0.4, 0.1, 0.06], { skip: 'b' });
      hung.hang(px, y0 + 1.58, pz, 0, 0, 0, 5); hung.box(px, y0 + 1.58 + h, pz, 0.05, 0.07, 0.05, [0.9, 0.3, 0.06], {}); hung.h[6] = 0; }
    for (const s of [-1, 1]) {   // a red candle on a stone stand either side, a plate of fruit, a lantern on a bamboo crook
      wood.cyl(s * 2.3, y0, 1.5, 0.3, 0.22, 0.9, 8, st, { g0: 0.7 }); wood.cyl(s * 2.3, y0 + 0.9, 1.5, 0.1, 0.09, 0.62, 6, mul(col.red, 0.9), { g0: 0.8 });
      hung.hang(s * 2.3, y0 + 1.52, 1.5, sr() * 20, 0, 0, 6); hung.box(s * 2.3, y0 + 1.53, 1.5, 0.07, 0.16, 0.07, [1.0, 0.5, 0.12], { taper: 0.02 }); hung.h[6] = 0;
      wood.cyl(s * 1.25, y0, 2.0, 0.34, 0.3, 0.07, 8, [0.6, 0.58, 0.52], {}); wood.cyl(s * 1.25, y0 + 0.07, 2.0, 0.26, 0.05, 0.24, 6, K.persimmon ? [0.8, 0.3, 0.04] : [0.85, 0.5, 0.06], { gt: 1.2 });
      wood.box(s * 2.75, y0, -0.6, 0.07, 3.3, 0.07, jit(bam, sr, 0.1), { skip: 'b', rz: -s * 0.06 }); wood.box(s * 2.5, y0 + 3.2, -0.6, 0.8, 0.06, 0.06, bam, {});
      lantern(K, s * 2.25, y0 + 3.2, -0.6, 0.66, sr() * 20, 0.3); hung.M.copy(wood.M);
    }
    cast.quad(T(-2.6, 2.9, -3.1), T(2.6, 2.9, -3.1), T(2.6, 2.9, 0.5), T(-2.6, 2.9, 0.5), W1); cast.quad(T(-0.95, 0.4, 1.0), T(0.95, 0.4, 1.0), T(0.95, 2.0, 1.0), T(-0.95, 2.0, 1.0), W1);
    wood.pop(); scenes.push([GOD[0], GOD[1], 4.4, 1.1]);
    K.incense2 = T(bx, y0 + 2.3, bzz);
  }
  { // 2. washing day at the well (built by buildCourt at K.well, with the low table at K.table): water jars, buckets and a shoulder pole, a frame of washing in the breeze, a bench with a hat left on it
    // (its things in its own frame, x along the ring and z outward from K.wash: the well 2.9 m one way and the table 3.1 m the other, the water jars at the
    // far end beyond the well, the washing line on the court's side. The jars are of the sizes of the jars at the foot of the galleries, the two largest lidded)
    const ry = K.wash[2], T = place(K.wash[0], K.wash[1], ry), jc = [0.17, 0.1, 0.06];
    for (const [jx, jz, s] of [[-7.2, 0.4, 1.25], [-6.6, 1.9, 1.15], [-7.8, 1.8, 1.0], [-6.3, -0.9, 0.9]]) { jar(jx, jz, s, jit(jc, sr, 0.2)); if (s > 1.1) wood.cyl(jx, 0.86 * s, jz, 0.3 * s, 0.28 * s, 0.05, 9, jit(worn, sr, 0.1), {}); }
    for (const [px, pz] of [[0.9, 2.3], [1.6, 2.6], [-2.4, -2.6]]) { wood.cyl(px, 0, pz, 0.2, 0.27, 0.4, 8, jit(worn, sr, 0.12), { cap: false, capB: true, g0: 0.6 }); wood.cyl(px, 0.32, pz, 0.25, 0.0, 0.01, 8, [0.03, 0.06, 0.07], { cap: false, g0: 1 }); wood.box(px, 0.4, pz, 0.5, 0.03, 0.03, [0.05, 0.05, 0.05], {}); }
    wood.box(1.25, 0.46, 2.45, 1.9, 0.045, 0.045, [0.55, 0.44, 0.22], { ry: 0.4 });   // the shoulder pole laid across two of them
    // the washing: two bamboo trestles, a pole between them, cloths that belly and snap
    const lz = -3.2, lh = 2.75, cl = [[0.03, 0.05, 0.16], [0.62, 0.62, 0.58], mul(col.red, 0.75), mul(col.blue, 0.9), [0.5, 0.52, 0.5], [0.08, 0.16, 0.2], [0.62, 0.6, 0.5]];
    for (const s of [-1, 1]) for (const q of [-1, 1]) wood.box(s * 3.4, 0, lz + q * 0.55, 0.07, lh + 0.25, 0.07, jit(bam, sr, 0.12), { rx: -q * 0.2, skip: 'b' });
    wood.box(0, lh, lz, 7.2, 0.07, 0.07, jit(bam, sr, 0.1), {});
    let cx = -3.0; for (let i = 0; i < 6; i++) { const w = sr.range(0.8, 1.15), len = sr.range(1.2, 1.95); cloth(K, cx + w / 2, () => lh - 0.03, lz, w, len, jit(cl[(i * 3 + 1) % cl.length], sr, 0.12), sr() * 20, 0.2, 0.24, 0, 'x'); cx += w + 0.1; }
    hung.hang(0, 0, 0, 0, 0, 0, 0);
    cast.quad(T(-3.2, 1.0, lz), T(3.2, 1.0, lz), T(3.2, lh, lz), T(-3.2, lh, lz), W1);
    wood.box(6.3, 0.42, 1.9, 1.9, 0.06, 0.4, jit(worn, sr, 0.1), { gt: 1.3, ry: 0.3 }); for (const s of [-1, 1]) wood.box(6.3 + s * 0.7, 0, 1.9 - s * 0.22, 0.08, 0.42, 0.34, mul(worn, 0.7), { skip: 'tb', ry: 0.3 });
    hat(6.0, 0.48, 2.0); hat(7.4, 0.0, 1.6, 0.9); basket(7.0, 0.4, col.tea, 1.2); basket(4.9, 2.2, [0.62, 0.48, 0.16], 1.1);
    wood.pop(); scenes.push([K.well[0], K.well[1], 2.7, 1.0], [K.table[0], K.table[1], 1.9, 0.8], [T(0, 0, lz)[0], T(0, 0, lz)[2], 3.0, 0.5]);
  }
  { // 3. the stone mill (built by buildCourt at K.mill): sacks of grain, winnowing trays, a mat of threshed rice, a flour trough, a broom
    const mx = K.mill[0], mz = K.mill[1], ry = K.millAt[2], sk = [0.5, 0.42, 0.26]; place(mx, mz, ry);
    for (let k = 0; k < 3; k++) wood.box(2.6 + k * 0.85, 0, -0.9, 0.78, 0.5, 1.15, jit(sk, sr, 0.12), { taper: 0.09, gt: 1.15, skip: 'b' });
    wood.box(3.0, 0.5, -0.9, 0.78, 0.46, 1.1, jit(sk, sr, 0.12), { taper: 0.09, gt: 1.15, skip: 'b', ry: 0.25 }); wood.box(4.6, 0, 0.3, 0.74, 1.05, 0.5, jit(sk, sr, 0.12), { taper: 0.07, gt: 1.1, skip: 'b', rx: 0.12 });
    for (const [wx, wz, rx2] of [[3.2, 1.0, -1.25], [3.85, 1.1, -1.3]]) wood.cyl(wx, 0.02, wz, 0.72, 0.78, 0.06, 12, jit([0.5, 0.4, 0.2], sr, 0.1), { rx: rx2, gt: 1.2 });
    wood.box(-3.1, 0.03, 0.4, 2.7, 0.03, 3.6, [0.3, 0.23, 0.11], { skip: 'b', gt: 1, ry: 0.2 });
    hung.hang(-3.1, 0.06, 0.4, 0, 0, 0, -1); hung.box(-3.1, 0.06, 0.4, 2.3, 0.04, 3.2, desat([0.66, 0.52, 0.2]), { ry: 0.2, skip: 'b', gt: 1.05, taper: 0.06 }); hung.h[6] = 0;
    tray(-1.5, 0.03, 2.3, 0.74, [0.7, 0.56, 0.22], sr); tray(1.2, 0.03, 2.5, 0.66, mul(col.tea, 1.4), sr); hung.hang(0, 0, 0, 0, 0, 0, 0);
    wood.box(0.3, 0, -2.6, 2.2, 0.4, 0.7, jit(worn, sr, 0.1), { taper: 0.07, gt: 0.45 }); wood.box(0.3, 0.34, -2.6, 1.9, 0.05, 0.5, [0.7, 0.66, 0.58], { skip: 'b' });
    basket(-1.6, -2.3, [0.62, 0.48, 0.16], 1.25); basket(-2.5, -1.5, [0.7, 0.56, 0.22], 1.1); basket(2.3, 1.9, col.tea, 1.1);
    wood.box(-1.3, 0.05, -3.7, 0.05, 0.05, 1.7, mul(bam, 0.9), { ry: 1.2 }); wood.box(-2.05, 0.03, -3.4, 0.5, 0.08, 0.3, [0.5, 0.4, 0.2], { ry: 1.2, skip: 'b' });
    wood.pop(); scenes.push([mx, mz, 2.3, 1.0]);
  }
  K.rng = keepRng;
  await ctx.yield();
  // --- drying mats in the middle of the court (radius MID_R: from 5 m out to the inner edge of the rings of tea mats), each a different crop: as many as lie
  // clear of the slab paths, the hall, the stalls, the scenes and the two knots of people, up to seven and the seed's own three to six more (they are
  // laid before the tea trays: they are the smaller, and nearer the middle)
  hung.M.identity(); wood.M.identity();
  const TRAY_PITCH = 7.2;   // (a tea mat is 7 m long: the spacing of their places, below)
  const MID_R = [5, COURT.rOpen - 2 * TRAY_PITCH], MID_MATS = 7 + K.mats, grain = [[0.62, 0.48, 0.16], mul(col.tea, 1.1), [0.5, 0.2, 0.05], [0.6, 0.5, 0.3], [0.66, 0.1, 0.05], [0.75, 0.42, 0.06]];
  for (let i = 0, n = 0; i < 600 && n < MID_MATS; i++) {
    const a = mq() * TAU, r = mq.range(MID_R[0], MID_R[1]), x = Math.sin(a) * r, z = Math.cos(a) * r, w = mq.range(2.2, 3.2), d = mq.range(3.2, 4.8), ry = a + mq.range(-0.3, 0.3);
    if (!free(x, z, 2.5)) continue;
    taken.push([x, z, 2.6]); n++; K.midMats.push([x, z, w, d, ry]);
    wood.box(x, 0.03, z, w, 0.03, d, [0.3, 0.23, 0.11], { ry, skip: 'b', gt: 1 });
    hung.hang(x, 0.06, z, 0, 0, 0, -1);
    hung.box(x, 0.06, z, w - 0.4, 0.035, d - 0.4, desat(jit(K.persimmon && mq.chance(0.5) ? [0.7, 0.26, 0.03] : mq.pick(grain), mq, 0.1)), { ry, skip: 'b', gt: 1.05, taper: 0.06 });
    hung.h[6] = 0;
    if (n % 3 === 0) { wood.push(x + Math.cos(ry) * (w / 2 + 0.6), 0, z - Math.sin(ry) * (w / 2 + 0.6), ry); wood.box(0, 0.04, 0, 0.05, 0.05, 1.9, mul(bam, 0.9), { ry: 0.3 }); wood.box(0.28, 0.03, 0.9, 0.6, 0.06, 0.12, [0.45, 0.36, 0.18], { ry: 0.3, skip: 'b' }); wood.pop(); }   // the rake left beside it
  }
  hung.hang(0, 0, 0, 0, 0, 0, 0);
  await ctx.yield();
  // --- round tea trays, 1.2 m across, on straw mats (rosettes, rows and fans, the leaf green where it was put out this morning and withering to bronze).
  // The mats are laid in two rings round the court, TRAY_PITCH apart (a mat is 7 m long), the outer ring's mats ending inside COURT.rOpen. Each ring is
  // walked once round from a drawn start, a step of TRAY_STEP at a time, and a place is marked wherever a mat lies clear of the slab paths, the hall, the
  // stalls, the scenes, the drying mats and the place before it (so every clear stretch of a ring holds as many mats as fit, side by side). A mat is laid at up to TRAY_MATS
  // of the places, taken in a drawn order. From 'court-mats' (as the drying mats before them).
  hung.M.identity(); wood.M.identity();
  const mat0 = [0.36, 0.29, 0.14], TRAY_MATS = 9, TRAY_STEP = 0.6, TRAY_RINGS = [COURT.rOpen - 3.6 - TRAY_PITCH, COURT.rOpen - 3.6], places = []; let ri = 0;
  for (const r of TRAY_RINGS) { const n = Math.floor(TAU * r / TRAY_STEP), a0 = mq() * TAU, ring = [];
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n, x = Math.sin(a) * r, z = Math.cos(a) * r; if (free(x, z, 3.3) && !ring.some((p) => Math.hypot(x - p[0], z - p[1]) < TRAY_PITCH)) ring.push([x, z, a]); }
    places.push(...ring); }
  K.trayPlaces = places.length;
  for (const [x, z, ry] of mq.shuffle(places).slice(0, TRAY_MATS)) {
    const kind = ri % 3, turn = mq() * TAU, w0 = mq() * 0.5;
    taken.push([x, z, 3.7]); ri++; K.trayList.push([x, z, 7.2, 4.3, ry]);
    const cf = Math.cos(ry), sf = Math.sin(ry), L = (lx, lz) => [x + lx * cf + lz * sf, z - lx * sf + lz * cf];
    if (kind === 0) {   // a rosette: one, six and twelve on a round mat
      wood.cyl(x, 0.025, z, 3.35, 3.4, 0.035, 20, jit(mat0, mq, 0.1), { gt: 1, g0: 0.7 });
      tray(x, 0.07, z, 0.6, teaCol(0.85, mq), mq);
      for (let k = 0; k < 6; k++) { const a = turn + k * TAU / 6; tray(x + Math.sin(a) * 1.3, 0.07, z + Math.cos(a) * 1.3, 0.6, teaCol(0.45 + 0.3 * mq(), mq), mq); }
      for (let k = 0; k < 12; k++) { const a = turn + (k + 0.5) * TAU / 12; tray(x + Math.sin(a) * 2.56, 0.07, z + Math.cos(a) * 2.56, 0.6, teaCol(w0 * mq(), mq), mq); }
    } else if (kind === 1) {   // rows on a long mat laid along the ring: fresh at one end, bronze at the other
      wood.box(x, 0.025, z, 7.0, 0.035, 4.3, jit(mat0, mq, 0.1), { ry, skip: 'b', gt: 1 });
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const p = L((i - 2) * 1.32, (j - 1) * 1.32); tray(p[0], 0.07, p[1], 0.6, teaCol(Math.min(1, i / 4 * 0.9 + 0.2 * mq()), mq), mq); }
    } else {   // a fan: offset rows of four, three, four and three
      wood.box(x, 0.025, z, 5.6, 0.035, 5.4, jit(mat0, mq, 0.1), { ry, skip: 'b', gt: 1 });
      for (let j = 0; j < 4; j++) for (let i = 0, n = j % 2 ? 3 : 4; i < n; i++) { const p = L((i - (n - 1) / 2) * 1.3, (j - 1.5) * 1.14); tray(p[0], 0.07, p[1], 0.6, teaCol(Math.min(1, j / 3 * 0.8 + 0.25 * mq()), mq), mq); }
    }
    if (ri % 2) { const p = L(kind === 1 ? 4.1 : 3.9, 0.6); wood.push(p[0], 0, p[1], ry + mq.range(-0.5, 0.5)); basket(0, 0, col.tea, 1.15); basket(0.95, 0.3, [0.36, 0.5, 0.14], 1.0); hat(0.3, 0.0, 1.1, mq.range(0.7, 1.0)); wood.pop(); }
    else { const p = L(-(kind === 1 ? 4.2 : 3.9), -0.4); wood.box(p[0], 0.3, p[1], 0.4, 0.05, 0.4, jit(worn, mq, 0.1), { ry, gt: 1.3 }); wood.box(p[0], 0, p[1], 0.3, 0.3, 0.3, mul(worn, 0.6), { ry, skip: 'tb', taper: -0.03 }); }
  }
  hung.hang(0, 0, 0, 0, 0, 0, 0);
  await ctx.yield();
  K.trayMats = ri;
  // the hens keep to the grain: by the mill's mat of threshed rice and its sacks, and on the first three drying mats
  { const cf = Math.cos(K.millAt[2]), sf = Math.sin(K.millAt[2]), M = (lx, lz) => [K.mill[0] + lx * cf + lz * sf, K.mill[1] - lx * sf + lz * cf];
    K.henSpots = [M(-3.1, 0.4), M(3.4, -0.9), ...K.midMats.slice(0, 3).map(([x, z]) => [x, z])]; while (K.henSpots.length < 5) K.henSpots.push(M(0, 0)); }
  // --- along the foot of the galleries: sacks, jars, firewood, baskets
  const goods = [[0.85, 0.3, 0.03], [0.2, 0.42, 0.1], [0.68, 0.06, 0.04], [0.74, 0.7, 0.6], [0.8, 0.55, 0.08], [0.36, 0.5, 0.14], [0.5, 0.26, 0.1]];
  for (let i = 0; i < 16; i++) {
    const a = (i + rng()) / 16 * TAU, r = rng.range(34.9, 35.7), x = Math.sin(a) * r, z = Math.cos(a) * r, kind = i % 4;
    if (Math.abs(x) < 3.5 || Math.abs(z - 6) < 3.2) continue;
    wood.M.identity(); wood.push(x, 0, z, a + rng.range(-0.3, 0.3));
    if (kind === 0) { const sk = [0.5, 0.42, 0.26]; for (let k = 0; k < 3; k++) wood.box(k * 0.8 - 0.8, 0, 0, 0.72, 0.42, 1.05, jit(sk, rng, 0.12), { taper: 0.09, gt: 1.15, skip: 'b' }); wood.box(-0.4, 0.42, 0, 0.72, 0.4, 1.0, jit(sk, rng, 0.12), { taper: 0.09, gt: 1.15, skip: 'b', ry: 0.2 }); }
    else if (kind === 1) for (let k = 0; k < 3; k++) jar(k * 0.95 - 0.95, 0, rng.range(0.85, 1.2), jit([0.2, 0.12, 0.07], rng, 0.2));
    else if (kind === 2) { const fw = [0.3, 0.2, 0.1]; wood.box(0, 0, 0, 2.4, 0.5, 0.8, jit(fw, rng, 0.1), { skip: 'b', gt: 1.3 }); wood.box(0.1, 0.5, 0, 1.9, 0.36, 0.78, jit(mul(fw, 1.2), rng, 0.1), { skip: 'b', gt: 1.3 }); }
    else for (let k = 0; k < 3; k++) { const g = jit(rng.pick(goods), rng, 0.12), px = k * 0.9 - 0.9, pz = rng.range(-0.3, 0.3); wood.cyl(px, 0, pz, 0.3, 0.4, 0.42, 7, jit([0.42, 0.33, 0.16], rng, 0.1), { cap: false, g0: 0.6 }); wood.cyl(px, 0.36, pz, 0.38, 0.12, 0.16, 7, g, { gt: 1.2, g0: 0.8 }); }
    wood.pop();
  }
  // --- a handcart of tea sacks left in the court, 10 to 22 m out, wherever it stands clear
  for (let tr = 0; tr < 300; tr++) {
    const a = rng() * TAU, r = rng.range(10, 22), x = Math.sin(a) * r, z = Math.cos(a) * r; if (!free(x, z, 2.2)) continue;
    taken.push([x, z, 2.4]); const tw = mul(col.timber, 1.5), cr = rng() * TAU; K.cart = [x, z, cr];
    wood.M.identity(); wood.push(x, 0, z, cr);
    wood.box(0, 0.62, 0, 1.3, 0.1, 2.3, jit(worn, rng, 0.1), { gt: 1.2 }); for (const sx of [-0.62, 0.62]) wood.box(sx, 0.72, 0, 0.05, 0.3, 2.3, tw, { skip: 'b' });
    for (const sx of [-0.78, 0.78]) wood.cyl(sx - 0.04, 0.6, 0, 0.6, 0.6, 0.08, 10, tw, { rz: -Math.PI / 2, capB: true, gt: 0.8 });
    for (const sx of [-0.5, 0.5]) wood.box(sx, 0.62, 1.9, 0.06, 0.06, 1.6, tw, { rx: -0.14 });
    for (let k = 0; k < 3; k++) wood.box(rng.range(-0.15, 0.15), 0.72, -0.75 + k * 0.72, 0.9, 0.36, 0.66, jit([0.5, 0.42, 0.26], rng, 0.12), { taper: 0.08, gt: 1.15, skip: 'b' });
    wood.pop(); break;
  }
  wood.M.identity(); hung.M.identity(); roof.M.identity();
}

// ---------- the court's people and their market (ring A) ----------
// Ordinary villagers on an ordinary morning, each at the court's own business: people bowing before the hall's burner and the earth god's, three elders
// talking by the hall steps; a market of five stalls under cloth awnings along the cross path (layCourt), their sellers behind the trestles and buyers
// before them; at the washing place one drawing water, one at the tub, two at the washing, two by the breakfast table; at the mill one feeding the stone and
// one at the flour trough; people turning the crop on the drying mats; inside the gate a knot of three talking and two unloading the handcart. Carriers
// with shoulder poles walk the slab paths and the ring walk at the foot of the galleries. No stage, no lion, no bunting, no crowd: forty-odd figures in twos
// and threes. The people's sizes, clothes and gaits come from the market's own stream; every place that is tried until it is free, and the goods that are
// set down only where there is room, come from the stream 'r17c-court-odds' (K.odds), so that what fits where never changes who the people are. Bearings are world
// bearings (degrees from east toward north) and radii from the court's middle. K.cast collects the flat shapes whose shadows the low sun throws across the
// cobbles; K.scenes the contact shade under each stall.
async function buildMarket(K, ctx) {
  const { col, wood, hung, cast } = K, rng = makeRng(Math.floor(K.duckPhase * 1e6) + 733), odds = K.odds, bam = col.bamboo, worn = col.wood2, W1 = [1, 1, 1], D2R = Math.PI / 180;
  const people = K.people = [], stalls = K.stalls = [], taken = K.taken, free = K.free, keepRng = K.rng; K.rng = rng;
  const at = (deg, r) => [-Math.cos(deg * D2R) * r, -Math.sin(deg * D2R) * r];
  const awn = [mul(col.red, 0.95), [0.1, 0.17, 0.42], [0.62, 0.42, 0.1], [0.62, 0.6, 0.52], [0.12, 0.3, 0.2], [0.16, 0.26, 0.5]];
  const goods = [[0.85, 0.3, 0.03], [0.2, 0.42, 0.1], [0.68, 0.06, 0.04], [0.74, 0.7, 0.6], [0.8, 0.55, 0.08], [0.22, 0.08, 0.26], [0.36, 0.5, 0.14], [0.5, 0.26, 0.1]];
  const cloths = [[0.08, 0.14, 0.36], [0.42, 0.4, 0.36], [0.42, 0.1, 0.07], [0.16, 0.25, 0.4], [0.36, 0.26, 0.12], [0.08, 0.08, 0.1], [0.22, 0.33, 0.4], [0.34, 0.33, 0.3]];
  const person = (x, z, mode, a, b, c, y = 0.03) => { people.push({ x, z, y, mode, a, b, c, sc: rng.range(1.0, 1.16), col: jit(rng.pick(cloths), rng, 0.15) }); };
  // a stander faces `heading` (radians, 0 = local +z) and bends from the hips by up to `bend`; a walker paces a long thin loop, `half` metres each way, along dirRad
  const stander = (x, z, heading, bend = 0.12, speed = 0.7, y) => person(x, z, 3, ((heading / TAU) % 1 + 1) % 1, speed * rng.range(0.8, 1.2), bend, y);
  const walker = (x, z, dirRad, half) => person(x, z, 2, ((Math.round(dirRad / 0.3927) % 16) + 16) % 16 + rng(), 2.2 / half * rng.range(0.85, 1.15) * rng.sign(), half);
  const tangent = (wd, r, half) => { const p = at(wd, r), a = Math.atan2(p[0], p[1]); walker(p[0], p[1], -a, half); };
  const knot = (x, z, m, rad = 0.75) => { const h = rng() * TAU; for (let k = 0; k < m; k++) { const b = h + k * TAU / m + rng.range(-0.25, 0.25); stander(x + Math.sin(b) * rad, z + Math.cos(b) * rad, b + Math.PI, 0.08, 0.5); } taken.push([x, z, rad + 0.9]); };
  const sacks = (x, z, ry) => { const sk = [0.5, 0.42, 0.26]; wood.M.identity(); wood.push(x, 0, z, ry); for (let k = 0; k < 3; k++) wood.box(k * 0.8 - 0.8, 0, 0, 0.72, 0.42, 1.05, jit(sk, odds, 0.12), { taper: 0.09, gt: 1.15, skip: 'b' }); wood.box(-0.4, 0.42, 0, 0.72, 0.4, 1.0, jit(sk, odds, 0.12), { taper: 0.09, gt: 1.15, skip: 'b', ry: 0.2 }); wood.pop(); };
  const jars = (x, z, ry) => { wood.M.identity(); wood.push(x, 0, z, ry); for (let k = 0; k < 3; k++) { const jar = jit([0.2, 0.12, 0.07], odds, 0.2), px = k * 0.95 - 0.95, s = odds.range(0.85, 1.25); wood.cyl(px, 0, 0, 0.26 * s, 0.42 * s, 0.5 * s, 7, jar, { cap: false, g0: 0.6 }); wood.cyl(px, 0.5 * s, 0, 0.42 * s, 0.2 * s, 0.36 * s, 7, jar, { gt: 0.3 }); } wood.pop(); };
  // --- the five stalls along the cross path, where layCourt put them (x, z, and which way the front faces)
  let si = 0;
  for (const [x, z, ry0] of K.stallSites || []) {
    if (si === 2 || si === 4) await ctx.yield();
    const ry = ry0 + rng.range(-0.12, 0.12), cf = Math.cos(ry), sf = Math.sin(ry), c1 = awn[si % awn.length], c2 = rng.chance(0.5) ? [0.66, 0.63, 0.55] : mul(c1, 0.55);
    const T = (lx, ly, lz) => [x + lx * cf + lz * sf, ly, z - lx * sf + lz * cf], hF = 2.95, hB = 2.5, ay = (zz) => hB + (hF - hB) * (zz + 1.5) / 3.2 + 0.04, ph = rng() * 20;
    wood.M.identity(); wood.push(x, 0, z, ry); hung.M.copy(wood.M);
    for (const [px, pz, h] of [[-1.9, 1.15, hF], [1.9, 1.15, hF], [-1.9, -1.15, hB], [1.9, -1.15, hB]]) wood.box(px, 0, pz, 0.09, h, 0.09, jit(bam, rng, 0.1), { skip: 'tb', g0: 0.7 });
    // the awning: a lean-to of striped cloth with a valance along its front edge
    hung.hang(0, hF + 0.1, 0, ph, 0, 0.1, -0.25);
    const sag = (u, v) => ay(-1.5 + v * 3.2) - (0.1 + 0.05 * Math.sin(u * 9.4)) * Math.sin(Math.PI * v);
    for (let k = 0; k < 6; k++) hung.grid(1, 3, (u, v) => [((k + u) / 6 - 0.5) * 4.6, sag((k + u) / 6, v), -1.5 + v * 3.2, mul(k % 2 ? c2 : c1, (0.84 + 0.26 * v) * (k % 3 ? 1 : 0.9))], { up: [0, 1, 0] });
    hung.grid(3, 3, (u, v) => [(u - 0.5) * 4.56, sag(u, v) - 0.035, -1.48 + v * 3.16, mul(c1, 0.3 + 0.12 * v)], { up: [0, -1, 0] });   // the shaded underside
    hung.h[6] = 0;
    cloth(K, 0, () => ay(1.7), 1.7, 4.6, 0.4, c1, ph, 0.04, 0.22, 0, 'x');
    hung.h[4] = 0; hung.h[5] = 0;
    // a table on trestles, a cloth down its front, heaps of produce, baskets on the cobbles
    wood.box(0, 0.98, 0.45, 3.5, 0.08, 1.3, jit(worn, rng, 0.1), { gt: 1.25 });
    for (const sx of [-1.5, 1.5]) for (const sz of [-0.05, 0.95]) wood.box(sx, 0, sz, 0.09, 0.98, 0.09, mul(worn, 0.6), { skip: 'tb' });
    wood.box(0, 0.3, 1.11, 3.4, 0.7, 0.03, mul(c2, 0.8), { skip: 'tb', g0: 0.7 });
    for (let k = 0; k < 7; k++) { const g = jit(rng.pick(goods), rng, 0.12), rr = rng.range(0.2, 0.3); wood.cyl(-1.45 + k * 0.48 + rng.range(-0.05, 0.05), 1.06, 0.45 + rng.range(-0.3, 0.3), rr, rr * 0.45, rng.range(0.16, 0.34), 6, g, { gt: 1.2, g0: 0.75, a0: rng() }); }
    for (let k = 0; k < 3; k++) { const g = jit(rng.pick(goods), rng, 0.12), bx = rng.range(-2.2, 2.2), bz = 1.9 + rng.range(0, 0.7); wood.cyl(bx, 0, bz, 0.3, 0.4, 0.42, 7, jit([0.42, 0.33, 0.16], rng, 0.1), { cap: false, g0: 0.6 }); wood.cyl(bx, 0.36, bz, 0.38, 0.12, 0.16, 7, g, { gt: 1.2, g0: 0.8 }); }
    for (const sx of [-1, 1]) lantern(K, sx * 1.9, hF - 0.05, 1.42, 0.5, rng() * 20, 0.3);
    wood.pop();
    cast.quad(T(-2.3, ay(-1.5), -1.5), T(2.3, ay(-1.5), -1.5), T(2.3, ay(1.7), 1.7), T(-2.3, ay(1.7), 1.7), W1);
    cast.quad(T(-1.75, 0.98, -0.2), T(1.75, 0.98, -0.2), T(1.75, 0.98, 1.1), T(-1.75, 0.98, 1.1), W1);
    K.scenes.push([x, z, 3.6, 1]); stalls.push([x, z, ry]);
    { const p = T(rng.range(-0.8, 0.8), 0, -0.6); stander(p[0], p[2], ry, 0.18, 0.9); }   // the seller
    for (let k = 0, n = si % 2 ? 1 : 2; k < n; k++) { const p = T((k ? 1 : -1) * rng.range(0.5, 1.4), 0, 2.9 + rng.range(0, 0.5)); stander(p[0], p[2], ry + Math.PI + rng.range(-0.3, 0.3), 0.1 + 0.25 * rng(), 0.6); }
    { const p = T(si % 2 ? -3.3 : 3.3, 0, 0.2); if (free(p[0], p[2], 1.0)) { (si % 2 ? jars : sacks)(p[0], p[2], ry + odds.range(-0.4, 0.4)); taken.push([p[0], p[2], 1.4]); } }   // sacks or jars at the stall's end
    si++;
  }
  wood.M.identity(); hung.M.identity();
  await ctx.yield();
  // --- before the hall's burner two bow and one waits; three elders talk by the steps; two bow to the earth god and one stands by with her basket
  for (const [px, pz, bd] of [[-1.3, -3.5, 0.5], [0.3, -3.1, 0.55], [1.7, -3.9, 0.1]]) stander(px, pz, Math.PI + rng.range(-0.15, 0.15), bd, 0.45);
  if (K.knots[0]) knot(K.knots[0][0], K.knots[0][1], 3);
  { const ry = Math.atan2(GOD[0], GOD[1]), cf = Math.cos(ry), sf = Math.sin(ry), T = (lx, lz) => [GOD[0] + lx * cf + lz * sf, GOD[1] - lx * sf + lz * cf];
    for (const [lx, lz, bd] of [[-0.9, 3.5, 0.5], [0.9, 3.7, 0.55], [2.9, 3.2, 0.08]]) { const p = T(lx, lz); stander(p[0], p[1], ry + Math.PI + rng.range(-0.15, 0.15), bd, 0.45); } }
  // --- the washing place: at the well one drawing water (on the slab, 0.6 m from the kerb) and one bent over the wash tub, two at the washing, two by the breakfast table
  { const ry = K.wash[2], cf = Math.cos(ry), sf = Math.sin(ry), T = (lx, lz) => [K.wash[0] + lx * cf + lz * sf, K.wash[1] - lx * sf + lz * cf];
    const wr = K.wellRot, cw = Math.cos(wr), sw = Math.sin(wr), Wl = (lx, lz) => [K.well[0] + lx * cw + lz * sw, K.well[1] - lx * sw + lz * cw];
    { const p = Wl(0.2, -1.75); stander(p[0], p[1], wr, 0.42, 1.1, 0.2); } { const p = Wl(1.9, 0.1); stander(p[0], p[1], wr, 0.62, 0.9, 0.2); }
    { const p = T(-1.3, -2.25); stander(p[0], p[1], ry + Math.PI, 0.1, 0.6); } { const p = T(2.0, -4.15); stander(p[0], p[1], ry, 0.14, 0.7); }
    { const p = T(5.75, -1.5); stander(p[0], p[1], ry - 1.2, 0.2, 0.5); } { const p = T(3.6, 2.35); stander(p[0], p[1], ry + Math.PI + 0.19, 0.3, 0.6); } }
  // --- the mill (one feeding the stone from between the winnowing trays, outside the sweep of its pole; one at the flour trough) and the drying mats, someone with a rake turning the crop on five of them
  { const mx = K.mill[0], mz = K.mill[1], ry = K.millAt[2], cf = Math.cos(ry), sf = Math.sin(ry), T = (lx, lz) => [mx + lx * cf + lz * sf, mz - lx * sf + lz * cf];
    { const p = T(-0.1, 2.15); stander(p[0], p[1], ry + Math.PI, 0.3, 0.8); } { const p = T(0.9, -3.75); stander(p[0], p[1], ry, 0.55, 0.9); } }
  [...(K.midMats || []), ...(K.trayList || [])].slice(0, 5).forEach(([x, z, w, d, ry]) => { const sd = rng.sign(); stander(x + sd * Math.cos(ry) * (w / 2 + 0.5), z - sd * Math.sin(ry) * (w / 2 + 0.5), ry - sd * Math.PI / 2, 0.7, 0.8); });
  // --- inside the gate, beside the gate path: a knot of three talking (its place from layCourt); two unloading the handcart; more sacks and jars set down on the gate's half of the court
  if (K.knots[1]) knot(K.knots[1][0], K.knots[1][1], 3);
  if (K.cart) { const [cx, cz, cr] = K.cart, cf = Math.cos(cr), sf = Math.sin(cr), T = (lx, lz) => [cx + lx * cf + lz * sf, cz - lx * sf + lz * cf];
    { const p = T(1.5, -0.3); stander(p[0], p[1], cr - Math.PI / 2, 0.45, 0.8); } { const p = T(-1.6, 0.9); stander(p[0], p[1], cr + Math.PI / 2, 0.2, 0.6); }
    { const p = T(-2.3, -1.4); if (free(p[0], p[1], 1.0)) { sacks(p[0], p[1], cr + 0.4); taken.push([p[0], p[1], 1.4]); } } }
  for (let g = 0, n = 0; g < 300 && n < 2; g++) { const p = at(odds.range(215, 330), odds.range(8, 19)); if (!free(p[0], p[1], 1.5)) continue; taken.push([p[0], p[1], 1.6]); (n ? jars : sacks)(p[0], p[1], odds() * TAU); n++; }
  // --- people on the move: carriers with shoulder poles in along the gate path, along the cross path, and round the ring walk at the foot of the galleries
  for (const sx of [-0.7, 0.7]) walker(sx, 23, Math.PI / 2, rng.range(9, 10.5));
  for (const sx of [-1, 1]) walker(sx * 21, 5.7, 0, rng.range(6.5, 7.5));
  for (let k = 0; k < 6; k++) tangent((k + 0.2 + 0.6 * rng()) * 60, COURT.rWalk[(k + 1) % 2], rng.range(6, 7.5));
  for (const f of K.folk || []) {   // villagers the world asks for outside the walls (hero-local; y is the ground under their feet)
    if (f.walk) person(f.x, f.z, 2, ((Math.round(f.walk.dir / 0.3927) % 16) + 16) % 16 + rng(), 2.2 / f.walk.half, f.walk.half, f.y ?? 0.03);
    else person(f.x, f.z, 3, (((f.heading || 0) / TAU) % 1 + 1) % 1, f.speed ?? 0.6, f.bend ?? 0.1, f.y ?? 0.03);
    people[people.length - 1].out = true; }
  K.rng = keepRng; wood.M.identity(); hung.M.identity();
}

// ring E's villagers (the ring with the inner house ring and the old well kerb in its middle): knots of two and three talking in the outer court and beside
// the kerb, people at the well, the mill and the table, carriers walking the two ring walks.
function ringFolk(K) {
  const rng = makeRng(Math.floor(K.duckPhase * 1e6) + 733), people = K.people = [], D2R = Math.PI / 180;
  const cloths = [[0.08, 0.14, 0.36], [0.42, 0.4, 0.36], [0.42, 0.1, 0.07], [0.16, 0.25, 0.4], [0.36, 0.26, 0.12], [0.08, 0.08, 0.1], [0.22, 0.33, 0.4], [0.34, 0.33, 0.3]];
  const person = (x, z, mode, a, b, c) => { people.push({ x, z, y: 0.03, mode, a, b, c, sc: rng.range(1.0, 1.16), col: jit(rng.pick(cloths), rng, 0.15) }); };
  const stander = (x, z, heading, bend = 0.12, speed = 0.7) => person(x, z, 3, ((heading / TAU) % 1 + 1) % 1, speed * rng.range(0.8, 1.2), bend);
  const tangent = (deg, r, half) => { const a = deg * D2R; person(Math.sin(a) * r, Math.cos(a) * r, 2, ((Math.round(-a / 0.3927) % 16) + 16) % 16 + rng(), 2.2 / half * rng.range(0.85, 1.15) * rng.sign(), half); };
  const knot = (x, z, m, rad = 0.75) => { const h = rng() * TAU; for (let k = 0; k < m; k++) { const b = h + k * TAU / m + rng.range(-0.25, 0.25); stander(x + Math.sin(b) * rad, z + Math.cos(b) * rad, b + Math.PI, 0.08, 0.5); } };
  // THE KNOTS stand by the court's own numbers (the ring's own metres); their places are drawn from the stream 'ring-e-knots':
  //   E_KERB   the foot of the old kerb's step: the world lays it 10.8 m of its own from the middle and stands ring E at 1.29 times the module (8.37)
  //   E_POST   the eave posts of the inner house ring on its court side (buildInner)
  //   E_WALKS  the two ring walks of the outer court, and E_BEAT, the longest half beat a carrier paces along a walk's tangent (this function's last line)
  //   PACE     one pace: the clear ground left between a standing person and the next thing
  // Three knots stand round the old kerb in the inner court: one in each third of the turn from a drawn start, give or take 8 degrees, the knot's middle
  // from E_KERB + PACE + its own radius to E_POST - PACE - its own radius out: none of its people is nearer than a pace to the kerb's foot or to the posts.
  // Four stand in the outer court, drawn the same way: one in each quarter of the turn from a drawn start of their own, give or take 8 degrees, between
  // the two ring walks: none of their people nearer than a pace to where the inner walk's carriers turn (hypot(E_WALKS[0], E_BEAT) out) or to the outer
  // walk's line. The well, the mill and the table stand in that band, so a knot also keeps a pace clear of each one's reach (the ducks' round about the
  // well, 5.2 m; the miller's place, 2.7 m; the two at the table, 2.2 m). The four are drawn as a set (start, bearings, distances), and the set is drawn
  // again until all four are clear, up to KNOT_SETS times: a little over half of all sets are clear, so it takes under two on average; were none of
  // the forty clear, the knots of the last set that are not clear would be left out. (The knots' people still come from this function's own stream.)
  const E_KERB = 10.8 / 1.29, E_POST = 15.6, E_WALKS = [24.2, 34.6], E_BEAT = 7.5, PACE = 0.75, KNOT_R = 0.75, KNOT_SETS = 40;
  { const q = K.stream('ring-e-knots'), d0 = q() * 360;
    for (const [k, m, rad] of [[0, 3, 0.75], [1, 3, 0.75], [2, 2, 0.6]]) { const a = (d0 + k * 120 + q.range(-8, 8)) * D2R, r = q.range(E_KERB + PACE + rad, E_POST - PACE - rad); knot(Math.sin(a) * r, Math.cos(a) * r, m, rad); }
    const reach = [[K.well, 5.2], [K.mill, 2.7], [K.table, 2.2]].filter((e) => e[0]), clear = (p) => reach.every(([c, cr]) => Math.hypot(p[0] - c[0], p[1] - c[1]) >= cr + PACE + KNOT_R);
    let set = [];
    for (let tr = 0; tr < KNOT_SETS && !(set.length && set.every(clear)); tr++) { const d1 = q() * 360;
      set = [0, 1, 2, 3].map((k) => { const a = (d1 + k * 90 + q.range(-8, 8)) * D2R, r = q.range(Math.hypot(E_WALKS[0], E_BEAT) + PACE + KNOT_R, E_WALKS[1] - PACE - KNOT_R); return [Math.sin(a) * r, Math.cos(a) * r]; }); }
    [3, 2, 3, 3].forEach((m, k) => { if (clear(set[k])) knot(set[k][0], set[k][1], m, KNOT_R); }); }
  { const wr = K.wellRot, cw = Math.cos(wr), sw = Math.sin(wr), Wl = (lx, lz) => [K.well[0] + lx * cw + lz * sw, K.well[1] - lx * sw + lz * cw];
    { const p = Wl(0.2, -2.6); stander(p[0], p[1], wr, 0.42, 1.1); } { const p = Wl(2.0, 2.2); stander(p[0], p[1], wr + Math.PI, 0.6, 0.9); } }
  stander(K.mill[0] + 0.4, K.mill[1] + 2.6, Math.PI, 0.3, 0.8);
  if (K.table) { stander(K.table[0] + 2.1, K.table[1] + 0.4, -Math.PI / 2, 0.2, 0.5); stander(K.table[0] - 0.6, K.table[1] - 2.1, 0.25, 0.3, 0.6); }
  for (let k = 0; k < 6; k++) tangent((k + 0.2 + 0.6 * rng()) * 60, k % 2 ? 24.2 : 34.6, rng.range(6, 7.5));
}

// the people: two instanced figures under conical hats (carriers with a shoulder pole and two baskets; standers), moved in the vertex shader
async function buildPeople(K, mat, shadeMat, ctx) {
  // two soups: s is dyed by the instance's cloth colour; o keeps its own colours (skin, straw, indigo, undyed cloth): its vertex colours are stored 2 higher and the shader takes the 2 off
  const fig = (carry) => {
    const s = new Soup(), o = new Soup(), cl = [1, 1, 1], cl2 = [0.74, 0.74, 0.74], indigo = [0.035, 0.045, 0.085], skin = [0.56, 0.37, 0.25], straw = [0.62, 0.52, 0.29], sash = [0.5, 0.45, 0.36], hair = [0.03, 0.028, 0.03];
    for (const sx of [-0.1, 0.1]) { o.box(sx, 0, 0, 0.14, 0.86, 0.16, indigo, { skip: 'tb', g0: 0.7, taper: 0.012 }); o.box(sx, 0, 0.05, 0.12, 0.07, 0.25, [0.05, 0.04, 0.035], { skip: 'b' }); }
    s.box(0, 0.8, 0, 0.33, 0.64, 0.2, cl, { taper: -0.035, g0: 0.76 });   // the tunic, wider at the shoulders
    o.box(0, 0.84, 0, 0.37, 0.1, 0.235, sash, { skip: 'tb' });
    s.box(0, 1.36, 0, 0.44, 0.09, 0.22, cl2, { taper: 0.05, skip: 'b' });   // the yoke
    o.cyl(0, 1.44, 0.01, 0.1, 0.085, 0.2, 6, skin, { g0: 0.8 }); o.box(0, 1.5, -0.075, 0.17, 0.15, 0.07, hair, { skip: 'b' });
    o.cyl(0, 1.6, 0, 0.34, 0.0, 0.18, 8, straw, { cap: false, g0: 0.72, g1: 1.2 }); o.cyl(0, 1.585, 0, 0.34, 0.34, 0.015, 8, [0.3, 0.25, 0.14], { cap: false, capB: true });
    if (carry) {
      for (const sx of [-1, 1]) { s.box(sx * 0.22, 1.36, -0.02, 0.09, 0.34, 0.1, cl2, { rz: -sx * 1.25, skip: 'b', g0: 1 }); o.box(sx * 0.56, 1.44, -0.04, 0.09, 0.09, 0.1, skin, {}); }   // a hand up on the pole each side
      o.box(0, 1.42, -0.06, 1.7, 0.035, 0.035, [0.55, 0.44, 0.22], {});
      for (const sx of [-0.78, 0.78]) { o.box(sx, 0.86, -0.06, 0.012, 0.56, 0.012, [0.2, 0.16, 0.12], { skip: 'tb' }); o.cyl(sx, 0.5, -0.06, 0.2, 0.25, 0.36, 6, [0.5, 0.4, 0.2], { cap: false, g0: 0.6 }); s.cyl(sx, 0.8, -0.06, 0.24, 0.08, 0.1, 6, cl, { gt: 1.1 }); }
    } else {
      for (const sx of [-1, 1]) { s.box(sx * 0.25, 1.38, 0.0, 0.09, 0.5, 0.1, cl2, { rx: Math.PI - 0.8, rz: sx * 0.12, skip: 'b', g0: 1 }); o.box(sx * 0.25, 0.97, 0.36, 0.08, 0.09, 0.09, skin, {}); }   // arms down and forward to the work
    }
    for (let i = 0; i < o.c.length; i++) s.c.push(o.c[i] + 2);
    for (let i = 0; i < o.p.length; i++) { s.p.push(o.p[i]); s.n.push(o.n[i]); }
    return s.toGeometry();
  };
  // the figure's shadow: a flat outline that the shader turns side-on to the sun and lays along the ground
  const card = (carry) => {
    const p = [], q = (x0, y0, x1, y1) => p.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);
    q(-0.22, 0, 0.22, 1.5); p.push(-0.33, 1.5, 0, 0.33, 1.5, 0, 0, 1.76, 0);
    if (carry) for (const s of [-1, 1]) { q(s * 0.56, 0.5, s * 1.0, 0.9); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  };
  const out = [];
  for (const mode of [2, 3]) {
    await ctx.yield();
    const list = K.people.filter((p) => p.mode === mode && p.out).concat(K.people.filter((p) => p.mode === mode && !p.out)), nOut = list.filter((p) => p.out).length; if (!list.length) continue;   // those outside the wall first: setCourt(false) draws only them
    const mesh = new THREE.InstancedMesh(fig(mode === 2), mat, list.length), shade = new THREE.InstancedMesh(card(mode === 2), shadeMat, list.length);
    const ab = new Float32Array(list.length * 4), m = new THREE.Matrix4(), c = new THREE.Color();
    await ctx.yield();
    list.forEach((p, i) => { m.makeScale(p.sc, p.sc, p.sc).setPosition(p.x, p.y, p.z); mesh.setMatrixAt(i, m); shade.setMatrixAt(i, m); c.setRGB(p.col[0], p.col[1], p.col[2]); mesh.setColorAt(i, c); ab.set([p.a, mode, p.b, p.c], i * 4); });
    mesh.geometry.setAttribute('aBird', new THREE.InstancedBufferAttribute(ab, 4)); shade.geometry.setAttribute('aBird', new THREE.InstancedBufferAttribute(ab.slice(), 4));
    for (const o of [mesh, shade]) { o.frustumCulled = false; o.instanceMatrix.needsUpdate = true; }
    mesh.name = mode === 2 ? 'carriers' : 'villagers'; shade.name = 'cast-shadows'; shade.renderOrder = -0.3; mesh.userData.out = shade.userData.out = nOut; mesh.userData.all = shade.userData.all = list.length;
    out.push(mesh, shade);
  }
  return out;
}

// ---------- by the kitchen doors on the sunlit side: three banana clumps and a persimmon tree hung with fruit ----------
// They stand at radius 36.6, between the goods at the foot of the galleries and the posts, under 4.6 m (the first turn of the helix passes 6 m above them,
// the low turn 8 m inside them). Leaves and fruit are in the hung soup: the leaves bob from the stem top in the breeze, the fruit swing on their stalks.
function buildGarden(K, sun) {
  const { col, wood, hung } = K, q = makeRng(Math.floor(K.duckPhase * 1e6) + 523), D2R = Math.PI / 180, th0 = Math.atan2(-sun.x, -sun.z) / D2R;
  const clear = (d) => { for (const pa of [0, 180, -180, 80.4, -80.4, 360 - 80.4, 80.4 - 360]) { const e = d - pa; if (Math.abs(e) < 8) d = pa + (e < 0 ? -9.5 : 9.5); } return d; };   // off the slab paths
  const stemC = [0.3, 0.36, 0.14], leafA = [0.13, 0.36, 0.07], leafB = mix(col.tea, [0.3, 0.55, 0.1], 0.6);
  for (const off of [-17, 8, 30]) {
    wood.frame(clear(th0 + off + q.range(-2, 2)) * D2R); hung.M.copy(wood.M);
    const r0 = 36.6 + q.range(-0.4, 0.3), ns = 3;
    for (let k = 0; k < ns; k++) {
      const a = k * 2.1 + q() * 1.2, rr = k ? q.range(0.45, 0.8) : 0, px = Math.sin(a) * rr, pz = r0 + Math.cos(a) * rr * 0.7, h = q.range(1.9, 2.7) * (k ? 0.85 : 1), lean = q.range(-0.08, 0.08);
      wood.cyl(px, 0, pz, 0.17, 0.11, h, 6, jit(stemC, q, 0.12), { cap: false, g0: 0.6, rz: lean });
      const tx = px - Math.sin(lean) * h, ty = Math.cos(lean) * h;
      for (let l = 0; l < 4; l++) {   // four great leaves a stem (twelve a clump): they rise, arch out all round and droop at the tip
        const la = a + l * 1.57 + q.range(-0.4, 0.4) + 3.1, L = q.range(1.7, 2.5), dx = Math.sin(la), dz = Math.cos(la) * 0.8 - 0.25, dl = Math.hypot(dx, dz) || 1, ux = dx / dl, uz = dz / dl, rise = q.range(0.8, 1.9), wd = q.range(0.62, 0.82);
        hung.hang(tx, ty, pz, q() * 20, -0.045, 0.03, 0);
        hung.grid(5, 2, (u, v) => { const w = wd * Math.pow(Math.sin(Math.PI * (0.07 + 0.9 * u)), 0.7), sdv = (v - 0.5) * w, e = Math.abs(v - 0.5) * 2;
          return [tx + ux * L * u - uz * sdv, ty + rise * u - (rise + 0.9) * u * u - e * 0.16 * w, pz + uz * L * u + ux * sdv, mul(mix(leafB, leafA, e * 0.8 + 0.2 * u), 0.8 + 0.35 * (1 - e))]; }, { up: [0, 1, 0] });
      }
    }
  }
  { // the persimmon: a low spreading tree, most of its leaves down, the fruit orange on the bare twigs
    wood.frame(clear(th0 - 4.5) * D2R); hung.M.copy(wood.M);
    const z0 = 36.3, bark = [0.2, 0.15, 0.1], fruit = [0.86, 0.33, 0.035], h0 = 1.55;
    wood.cyl(0, 0, z0, 0.19, 0.12, h0 + 0.1, 7, bark, { cap: false, g0: 0.6, rz: 0.06 });
    for (let k = 0; k < 6; k++) {
      const ry = k * TAU / 6 + q.range(-0.3, 0.3), rx = k < 5 ? q.range(0.6, 0.95) : 0.12, L = q.range(1.5, 2.1), ax = [Math.sin(rx) * Math.sin(ry), Math.cos(rx), Math.sin(rx) * Math.cos(ry)];
      wood.cyl(0, h0, z0, 0.075, 0.025, L, 5, jit(bark, q, 0.15), { cap: false, ry, rx });
      for (const f of [0.5, 0.74, 0.97]) {
        if (q() < 0.2) continue;
        const fx = ax[0] * L * f + q.range(-0.12, 0.12), fy = h0 + ax[1] * L * f, fz = z0 + ax[2] * L * f + q.range(-0.12, 0.12), fr = q.range(0.1, 0.125), fc = jit(fruit, q, 0.1);
        hung.hang(fx, fy, fz, q() * 20, 0.1, 0, 0);
        hung.cyl(fx, fy - 0.1 - fr * 1.7, fz, fr * 0.3, fr, fr * 0.8, 6, fc, { cap: false, g0: 0.7 }); hung.cyl(fx, fy - 0.1 - fr * 0.9, fz, fr, fr * 0.42, fr * 0.8, 6, fc, { gt: 0.35 });
        if (q() < 0.6) { const la = q() * TAU, lc = jit(q() < 0.5 ? [0.5, 0.36, 0.06] : [0.24, 0.4, 0.08], q, 0.15), lx = Math.sin(la) * 0.3, lz = Math.cos(la) * 0.3;   // a leaf or two still on
          hung.hang(fx, fy, fz, q() * 20, 0.16, 0.05, 0); hung.quad([fx - lz * 0.3, fy, fz + lx * 0.3], [fx + lz * 0.3, fy, fz - lx * 0.3], [fx + lx + lz * 0.2, fy - 0.2, fz + lz - lx * 0.2], [fx + lx - lz * 0.2, fy - 0.2, fz + lz + lx * 0.2], lc, mul(lc, 0.8), [0, 1, 0]); }
      }
    }
  }
  wood.M.identity(); hung.M.identity(); hung.hang(0, 0, 0, 0, 0, 0, 0);
}

// shadows the low sun throws across the cobbles from the hall, the earth god's house, the well roof, the washing, the stalls and the people: flat shapes laid along the ground in the
// vertex shader and multiplied into the picture, only where the ring's own roof shadow (tuShadow) has not already fallen
function makeShade(P, U, person) {
  return new THREE.ShaderMaterial({
    uniforms: { uSun: U.uSun, uTime: U.uTime, uInner: U.uInner, uShade: U.uShade, uShK: U.uShK }, defines: person ? { PERSON: 1 } : {},
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      uniform vec3 uSun; uniform float uTime; varying vec3 vG; varying float vL;
      #ifdef PERSON
      attribute vec4 aBird;
      ${GLSL_PERSON}
      #endif
      void main(){
        vec3 p = position;
        #ifdef PERSON
          vec2 off; float head; personMove(aBird, uTime, off, head);
          float sc = length(instanceMatrix[0].xyz); vec2 sd = normalize(uSun.xz + vec2(1e-4, 0.)), pr = vec2(sd.y, -sd.x);
          p = vec3(instanceMatrix[3].x + (off.x + pr.x * position.x) * sc, position.y * sc, instanceMatrix[3].z + (off.y + pr.y * position.x) * sc);
        #endif
        vL = p.y / max(uSun.y, .2);
        vG = vec3(p.x - uSun.x * vL, .05, p.z - uSun.z * vL);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vG, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uShade; uniform float uShK; varying vec3 vG; varying float vL;
      ${glslShadow(P)}
      void main(){
        float k = uShK * tuShadow(vG, uSun) * (1. - smoothstep(${(P.rPost - 2.4).toFixed(1)}, ${(P.rPost - 1.).toFixed(1)}, length(vG.xz))) * (1. - .45 * smoothstep(2., 11., vL));
        gl_FragColor = vec4(mix(vec3(1.), uShade, k), 1.);
      }`,
  });
}

// turning parts: windlass drum with crank, bucket, upper millstone with its push bar
function buildMovers(K) {
  const { col } = K, st = mul(col.stone, 1.2), tw = mul(col.timber, 1.6);
  const wl = new Soup(); wl.cyl(-1.2, 0, 0, 0.13, 0.13, 2.4, 8, tw, { rz: -Math.PI / 2, capB: true });
  wl.box(1.32, -0.05, 0, 0.06, 0.5, 0.06, tw, {}); wl.box(1.5, 0.4, 0, 0.36, 0.06, 0.06, tw, {});
  for (let k = 0; k < 4; k++) wl.cyl(-0.2 + k * 0.1, 0, 0, 0.15, 0.15, 0.06, 8, [0.3, 0.25, 0.15], { rz: -Math.PI / 2, cap: false });
  const bk = new Soup(); bk.cyl(0, 0, 0, 0.17, 0.22, 0.3, 8, mul(col.wood2, 0.9), { cap: false, capB: true, g0: 0.6 }); bk.cyl(0, 0.24, 0, 0.2, 0.0, 0.01, 8, [0.02, 0.04, 0.05], { cap: false });
  bk.box(0, 0.3, 0, 0.36, 0.03, 0.03, [0.05, 0.05, 0.05], {});
  const ms = new Soup(); ms.cyl(0, 0, 0, 0.66, 0.66, 0.3, 12, st, { gt: 0.9 }); ms.cyl(0.25, 0.3, 0, 0.1, 0.12, 0.06, 6, mul(st, 0.4), {});
  ms.box(0.9, 0.1, 0, 1.6, 0.07, 0.07, tw, {}); ms.box(1.65, 0.1, 0, 0.06, 0.45, 0.06, tw, {});
  return { wl, bk, ms };
}

// hens (rust, white, black) and a file of white ducks, moved in the vertex shader. Each is a rounded body (a six-sided lathe laid along the bird), a tapered
// neck, a head, a tail fan; the hen has a comb, wattle and beak, the duck a flatter, longer body, an upright neck and a flat bill. Colours with red above 1.9
// are the bird's own (comb, beak, bill, legs: the shader takes 2 off); the rest is white, tinted by the instance colour.
function birdSoup(duck) {
  const s = new Soup(), w = [1, 1, 1], own = (r, g, b) => [2 + r, 2 + g, 2 + b], flat = { g0: 1, g1: 1, gt: 1, skip: 'b' };
  const body = (y, z, sx, sy, prof) => { s.push(0, y, z, 0, Math.PI / 2, 0); s.M.scale(_v.set(sx, 1, sy)); s.lathe(prof.map(([r, t, k]) => [r, t, [k, k, k]]), 6, { smooth: true }); s.pop(); };
  if (duck) {
    body(0.17, -0.02, 1, 0.78, [[0.004, -0.25, 0.7], [0.06, -0.22, 0.75], [0.115, -0.1, 0.86], [0.13, 0.03, 0.96], [0.1, 0.15, 1], [0.004, 0.2, 0.95]]);
    s.box(0, 0.19, -0.25, 0.08, 0.1, 0.03, [0.8, 0.8, 0.8], { rx: -1.0, skip: 'b' });                       // the upturned tail
    s.cyl(0, 0.2, 0.14, 0.055, 0.04, 0.2, 5, w, { rx: 0.12, cap: false, g0: 0.85 });                        // an upright neck
    s.box(0, 0.385, 0.165, 0.075, 0.075, 0.105, w, { taper: 0.014, g0: 0.9 });
    s.box(0, 0.4, 0.25, 0.052, 0.02, 0.075, own(0.9, 0.5, 0.06), flat);                                      // the bill
    for (const sx of [-0.045, 0.045]) { s.box(sx, 0, 0.0, 0.022, 0.09, 0.022, own(0.85, 0.45, 0.06), { ...flat, skip: 'tb' }); s.box(sx, 0, 0.025, 0.05, 0.012, 0.07, own(0.85, 0.45, 0.06), flat); }
  } else {
    body(0.235, -0.01, 0.95, 1.05, [[0.004, -0.19, 0.7], [0.07, -0.155, 0.76], [0.105, -0.05, 0.88], [0.11, 0.04, 0.97], [0.078, 0.13, 1], [0.004, 0.17, 0.95]]);
    for (const k of [-1, 0, 1]) s.box(k * 0.035, 0.27, -0.16, 0.055, 0.23 - 0.03 * Math.abs(k), 0.02, [0.78, 0.78, 0.78], { rx: -0.7, ry: k * 0.38, skip: 'b', taper: -0.008 });   // the tail fan
    s.cyl(0, 0.27, 0.1, 0.062, 0.038, 0.19, 5, w, { rx: 0.4, cap: false, g0: 0.85 });                        // the neck
    s.box(0, 0.425, 0.185, 0.066, 0.075, 0.09, w, { taper: 0.012, g0: 0.9 });
    s.box(0, 0.5, 0.185, 0.018, 0.045, 0.08, own(0.8, 0.05, 0.03), flat);                                    // comb
    s.box(0, 0.385, 0.235, 0.02, 0.045, 0.022, own(0.75, 0.05, 0.03), flat);                                 // wattle
    s.cyl(0, 0.455, 0.228, 0.02, 0.0, 0.06, 4, own(0.9, 0.6, 0.1), { rx: Math.PI / 2, cap: false, g0: 1, g1: 1 });   // beak
    for (const sx of [-0.05, 0.05]) s.box(sx, 0, 0, 0.02, 0.14, 0.02, own(0.8, 0.55, 0.1), { ...flat, skip: 'tb' });
  }
  return s;
}

function buildBirds(K, mat) {
  const { rng, P } = K;
  const nh = 30, nd = 12, m = new THREE.Matrix4(), c = new THREE.Color();
  const henMesh = new THREE.InstancedMesh(birdSoup(false).toGeometry(), mat, nh), duckMesh = new THREE.InstancedMesh(birdSoup(true).toGeometry(), mat, nd), abH = new Float32Array(nh * 4), abD = new Float32Array(nd * 4);
  const hens = [[0.42, 0.14, 0.05], [0.62, 0.6, 0.55], [0.05, 0.045, 0.04], [0.5, 0.3, 0.12]];
  let groups = [], duckPh = 0;
  for (let g = 0; g < 5; g++) { const a = rng() * TAU, r = rng.range(8, 30); groups.push([Math.sin(a) * r, Math.cos(a) * r]); }
  if (K.henSpots) groups = K.henSpots;
  const hq = K.henRng || rng, dHome = K.well;   // (ring A's hens come from a stream of their own; the ducks' home is the well)
  for (let i = 0; i < nh + nd; i++) {
    if (i < nh) {
      let x = 0, z = 0;
      for (let tr = 0; tr < 8; tr++) { const g = groups[i % 5]; x = g[0] + hq.gauss() * 2.5; z = g[1] + hq.gauss() * 2.5; if (Math.hypot(x, z) < P.rPost - 3 && !(Math.abs(x) < 7.5 && z < -6.5 && z > -18.5)) break; x = hq.range(-8, 8); z = hq.range(10, 22); }
      const sc = hq.range(0.85, 1.15); m.makeScale(sc, sc, sc).setPosition(x, 0.03, z); henMesh.setMatrixAt(i, m);
      const h = hens[hq.int(0, 3)]; c.setRGB(h[0], h[1], h[2]); henMesh.setColorAt(i, c);
      abH.set([hq(), 0, 0, 0], i * 4);
    } else {
      const dr = K.duckRng, ds = dr.range(0.85, 1.15), k = i - nh; duckPh += k ? (K.duckGap || 0.115) * dr.range(0.6, 1.4) : 0;   // a straggling file, not an evenly dotted arc
      m.makeScale(ds, ds, ds).setPosition(dHome[0], 0.03, dHome[1]); duckMesh.setMatrixAt(k, m);
      const tint = dr(); if (K.duckWhite) c.setRGB(0.8 - 0.1 * tint, 0.79 - 0.1 * tint, 0.74 - 0.12 * tint); else if (tint < 0.2) c.setRGB(0.36, 0.27, 0.17); else if (tint < 0.36) c.setRGB(0.4, 0.4, 0.4); else c.setRGB(0.66, 0.65, 0.6);
      duckMesh.setColorAt(k, c);
      abD.set([K.duckPhase + duckPh, 1, K.side * (K.duckPace ? K.duckPace / K.duckR : 0.06), (K.duckR || 4.6) + (K.duckR ? dr.range(-1, 1) * K.duckJit : dr.range(-0.6, 0.6))], k * 4);
    }
  }
  const grp = new THREE.Group(); grp.name = 'fowl';
  for (const [mesh, ab] of [[henMesh, abH], [duckMesh, abD]]) { mesh.geometry.setAttribute('aBird', new THREE.InstancedBufferAttribute(ab, 4)); mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; grp.add(mesh); }
  return grp;
}

// ---------- kitchen smoke, steam and the incense thread: instanced soft puffs ----------
function makeSmoke(K, U, bases) {
  const quad = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry(), rng = K.rng;
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  const ab = [], as = [];
  for (const b of bases) { const n = b.kind ? Math.max(10, Math.round(24 * K.detail)) : 9; for (let i = 0; i < n; i++) { ab.push(b.p[0], b.p[1], b.p[2], b.scale || 1); as.push((i + rng()) / n, rng(), b.kind, (0.11 - 0.08 * b.kind) * rng.range(0.85, 1.15)); } }
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(ab), 4));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(as), 4));
  g.instanceCount = ab.length / 4;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWind: { value: new THREE.Vector2(K.wind[0], K.wind[1]) }, uEave: { value: K.P.eaveIn }, uTint: { value: new THREE.Vector3().fromArray(K.smokeTint || [1, 1, 1]) } }]),
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      attribute vec4 aBase; attribute vec4 aSeed; uniform float uTime; uniform vec3 uSun; uniform vec2 uWind; uniform float uEave; varying vec2 vUv; varying vec4 vP; varying vec3 vL;
      #include <fog_pars_vertex>
      void main(){
        float l = fract(uTime * aSeed.w + aSeed.x), kit = aSeed.z, hy = fract(aSeed.y * 7.3), hz = fract(aSeed.y * 13.7);
        vec3 b = aBase.xyz; vec2 inw = -normalize(b.xz + vec2(1e-3, 0.));
        vec3 p = b + vec3(0., pow(l, mix(1., .8, kit)) * mix(3.6, 34., kit), 0.);
        p.xz += inw * kit * 4.4 * smoothstep(0., .2, l);
        float sh = smoothstep(.25, 1., l); p.xz += uWind * (sh * sh * 15. + l * 3.5) * kit;
        // a wisp, not a column: every puff keeps its own side of the plume and wanders further from the axis as it ages
        float wob = (.25 + 6. * l) * mix(.06, 1., kit), own = mix(.6, 1.4, hz);
        p.x += sin(uTime * .3 + aBase.x + l * 7. + hy * 6.) * wob * .5 + (aSeed.y - .5) * wob * own; p.z += cos(uTime * .24 + aBase.z + l * 5.5 + hz * 6.) * wob * .5 + (hy - .5) * wob * own;
        float size = aBase.w * mix(mix(.07, .6, l), mix(.85, 2.9, sqrt(l)), kit);
        float lit = (.2 + .8 * smoothstep(uEave - 7., uEave + 3., p.y)) * smoothstep(0., .2, uSun.y);
        vP = vec4(smoothstep(0., .07, l) * pow(1. - l, 1.4) * mix(.5, .3, smoothstep(0., .5, kit)), aSeed.y, lit, l);
        vUv = position.xy;
        // each puff is drawn out along its own drift (up at first, down the wind once it shears) by its own aspect
        vec3 dr = vec3(uWind.x * (sh * 1.6 + .12), 1., uWind.y * (sh * 1.6 + .12)) * kit + vec3(0., 1. - kit, 0.);
        vec2 ax = (modelViewMatrix * vec4(dr, 0.)).xy; ax = ax / max(length(ax), 1e-4);
        float asp = mix(1., mix(1.25, 1.8, hz), kit);   // kitchen smoke: long thin wisps drawn out along their drift
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); mvPosition.xy += (ax * position.y * asp + vec2(ax.y, -ax.x) * position.x / asp) * size;
        vP.x *= smoothstep(size * .9, size * 3.2 + 6., -mvPosition.z);   // a column the camera flies through thins round it instead of veiling the frame
        vec2 sv = (viewMatrix * modelMatrix * vec4(uSun, 0.)).xy; sv = sv / max(length(sv), 1e-4);
        vec3 svw = normalize((viewMatrix * modelMatrix * vec4(uSun, 0.)).xyz); float fs = max(dot(normalize(mvPosition.xyz), svw), 0.);
        vL = vec3(dot(sv, ax), dot(sv, vec2(ax.y, -ax.x)), fs * fs * fs * lit);   // the sun's side of the puff, in the puff's own axes; z: looking up-sun through it, it glows
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec4 vP; varying vec3 vL; uniform vec3 uTint; uniform float uTime;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float r = length(vUv), l = vP.w, t = uTime * .11;
        vec2 q = vUv * 1.7 + vP.y * 17.;
        float n = vn2(q + vec2(t, -t * 1.7)) * .62 + vn2(q * 2.7 - vec2(t * 1.4, t * 2.3) + 5.) * .38;   // two octaves that drift: the edge is never still
        float a = smoothstep(1., .0, r + (n - .5) * mix(.9, 1.6, l)); a *= a;   // a soft core that thins to nothing at the edge
        a *= smoothstep(.12, .62, vn2(vec2(vUv.x * 1.4 + vP.y * 31., vUv.y * .7 - t * 2.) + 3.));   // strands: the wisp is torn along its length
        a *= vP.x * 1.7; if (a < .004) discard;
        float sun = clamp(.5 + .75 * dot(vUv, vec2(vL.y, vL.x)), 0., 1.);   // lit rim toward the sun, blue on the far side
        vec3 shade = vec3(.36, .43, .56), warm = vec3(.9, .8, .64);
        vec3 c = mix(shade, mix(shade * 1.25, warm, sun), vP.z) * (.82 + .3 * n) * (1. + .9 * clamp(vL.z, 0., 1.));
        gl_FragColor = vec4(c * uTint, a);
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uTime = U.uTime; mat.uniforms.uSun = U.uSun;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3; return mesh;
}

// ---------- sun shafts raking over the roof on the sun side: additive blades that turn to the camera ----------
function makeShafts(K, U) {
  const quad = new THREE.PlaneGeometry(2, 1, 1, 6); quad.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(), rng = K.rng, n = 16, a = [];
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  for (let i = 0; i < n; i++) a.push((i / (n - 1) - 0.5) * 1.7 + rng.range(-0.05, 0.05), rng.range(3, 8), rng() * 20, rng.range(-1.5, 1.5));
  g.setAttribute('aSh', new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uDim: { value: new THREE.Vector2(K.P.rRidge, K.P.ridgeY) } }]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aSh; uniform vec3 uSun; uniform vec2 uDim; uniform float uTime; varying vec3 vS; varying float vF; varying float vD; varying float vG;
      #include <fog_pars_vertex>
      void main(){
        vec2 sh = normalize(uSun.xz + vec2(1e-4, 0.)); float az = atan(sh.x, sh.y) + aSh.x;
        vec3 o = vec3(sin(az) * (uDim.x + aSh.w), uDim.y - .3, cos(az) * (uDim.x + aSh.w));
        vec3 dir = -normalize(uSun + vec3(0., 1e-4, 0.)); float L = min(uDim.y / max(uSun.y, .14) * 1.03, 90.);
        vec3 c = o + dir * (position.y * L);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.); vec3 dv = normalize((modelViewMatrix * vec4(dir, 0.)).xyz);
        float pick = fract(aSh.z * 1.618);   // seven or eight of the sixteen are the shafts; the rest are the faint light between them
        vG = mix(.1, 1., smoothstep(.42, .58, pick));
        vec3 sd = cross(dv, mvPosition.xyz); float dl = length(sd), bw = (.8 + .2 * aSh.y) * (1. + position.y * 1.1); sd /= max(dl, 1e-4);
        mvPosition.xyz += sd * position.x * bw;
        vS = vec3(position.x, position.y, aSh.z); vF = smoothstep(bw * 1.2, bw * 3. + 4., dl);
        vF *= 1. - .85 * smoothstep(.72, .96, abs(dot(mvPosition.xyz / max(length(mvPosition.xyz), 1e-4), dv)));   // seen end-on (looking up-sun) the whole fan would stack into a white wall
        vD = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uShaft, uTime; uniform vec3 uSun; varying vec3 vS; varying float vF; varying float vD; varying float vG;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float x = 1. - vS.x * vS.x, a = x * x * smoothstep(0., .07, vS.y) * (1. - smoothstep(.5, 1., vS.y));
        a *= smoothstep(0., .35, 1. - abs(vS.x)) * smoothstep(4., 14., vD);   // soft long edges, and never a card across the lens
        a *= (.5 + .5 * vn2(vec2(vS.x * 1.5 + vS.z, vS.y * 7. - uTime * .06))) * (.7 + .3 * sin(uTime * .23 + vS.z));
        vec3 col = vec3(1., .78, .5) * a * vF * vG * uShaft * .74 * smoothstep(.06, .25, uSun.y);
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  mat.uniforms.uTime = U.uTime; mat.uniforms.uSun = U.uSun; mat.uniforms.uShaft = U.uShaft;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; return mesh;
}

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion();

// ---------- lighter rings for the rest of the village (same dimensions, same shader programs) ----------
function lanternLite(K, x, y, z, size, ph) {
  const { hung, col, rng } = K, r = size * 0.5, red = jit(mix(col.red, [0.74, 0.09, 0.055], 0.55), rng, 0.1), sd = K.lod >= 2 ? 4 : 5;
  hung.M.copy(K.wood.M); hung.hang(x, y, z, ph, 0.26 + rng() * 0.1, 0, K.glow);
  hung.cyl(x, y - 0.3 - size * 0.9, z, r * 0.45, r, size * 0.45, sd, red, { cap: false, g0: 0.55, g1: 1.04, a0: ph });
  hung.cyl(x, y - 0.3 - size * 0.45, z, r, r * 0.45, size * 0.45, sd, red, { cap: false, g0: 1.04, g1: 0.6, a0: ph });
  hung.h[6] = 0;
}

function buildBayLite(K, b, t) {
  const { P, rng, col, wood } = K, far = K.lod >= 2, dA = TAU / P.bays, tn = Math.tan(dA / 2), cs = Math.cos(dA / 2);
  const F = P.floors[t], H = t < 3 ? P.floors[t + 1] - F : 3.25, zp = P.rPost * cs, zb = P.rBack * cs, hwp = zp * tn, hwb = zb * tn;
  const tim = jit(mul(col.timber, 1.25), rng, 0.18), worn = jit(col.wood2, rng, 0.15);
  wood.frame(b * dA);
  if (t > 0) {
    const zf = zp - 0.36, hf = zf * tn;
    wood.quad([-hf, F, zf], [hf, F, zf], [hwb, F, zb], [-hwb, F, zb], mul(worn, 1.15), mul(worn, 0.5), [0, 1, 0]);
    wood.box(0, F - 0.3, zf, hf * 2, 0.32, 0.07, jit(worn, rng, 0.1), { skip: 'sbtew', g0: 0.75 });
    wood.box(0, F + 0.96, zp - 0.03, hwp * 2, 0.1, 0.14, mul(worn, 1.5), { skip: far ? 'sbew' : 'ew', g0: 0.6, gt: 1.25 });
    if (far) wood.box(0, F + 0.1, zp - 0.03, hwp * 2, 0.86, 0.04, mul(tim, 0.6), { skip: 'tbews' });
    else {
      wood.box(0, F + 0.13, zp - 0.03, hwp * 2, 0.07, 0.09, tim, { skip: 'bew' });
      for (let i = 0; i < 7; i++) wood.box(-hwp + (i + 1) * (2 * hwp) / 8, F + 0.2, zp - 0.03, 0.07, 0.76, 0.07, jit(tim, rng, 0.2), { skip: 'tb' });
    }
  }
  wood.cyl(-hwp, F, zp, 0.17, 0.15, H, far ? 4 : 6, tim, { cap: false, g0: 0.75, g1: 0.9, flat: true });
  wood.box(0, F + H - 0.32, zp, hwp * 2, 0.28, 0.2, tim, { skip: 'tew', g0: 0.7 });
  const lime = jit(col.lime, rng, 0.1), dado = mix(lime, col.earth, 0.45 + rng() * 0.3), dh = t === 0 ? 1.4 : 1.05, wtop = F + H + (t === 3 ? 1.3 : -0.3);
  wood.quad([hwb, F, zb], [-hwb, F, zb], [-hwb, F + dh, zb], [hwb, F + dh, zb], mul(dado, 0.6), mul(dado, 0.95), [0, 0, -1]);
  wood.quad([hwb, F + dh, zb], [-hwb, F + dh, zb], [-hwb, wtop, zb], [hwb, wtop, zb], mul(lime, 1.12), mul(lime, t === 3 ? 0.5 : 0.72), [0, 0, -1]);
  const zw = zb - 0.02, dark = [0.014, 0.012, 0.011];
  if (t === 0 && b === 0) { wood.box(0, 0, zw - 0.04, 2.7, 3.6, 0.06, dark, { skip: 'sbt', g0: 1 }); wood.box(0, 3.6, zw - 0.12, 3.5, 0.4, 0.26, mul(col.stone, 1.1), { skip: 's' }); return; }
  const nk = far ? 2 : 3, kitchen = t === 0;
  for (let k = 0; k < nk; k++) {
    const u = (k - (nk - 1) / 2) * hwb * (far ? 1.0 : 0.62) + rng.range(-0.3, 0.3);
    if (!far && k === 1 && !kitchen) {
      const w = rng.range(0.95, 1.25), h = rng.range(0.8, 1.0), y = F + rng.range(1.15, 1.35);
      wood.box(u, y, zw - 0.03, w, h, 0.04, dark, { skip: 'sbt', g0: 1 }); wood.box(u, y - 0.1, zw - 0.08, w + 0.24, 0.1, 0.18, tim, { skip: 'sb' });
      if (rng.chance(0.5)) wood.box(u - w / 4, y, zw - 0.07, w / 2 - 0.02, h, 0.035, jit(worn, rng, 0.2), { skip: 'stb' });
      continue;
    }
    const w = kitchen ? rng.range(1.15, 1.4) : rng.range(0.88, 1.0), h = kitchen ? 2.25 : 2.05, open = rng.chance(kitchen ? 0.7 : 0.3);
    const dc = open ? (kitchen ? [0.03, 0.016, 0.008] : dark) : jit(rng.chance(0.25) ? mix(worn, col.red, 0.35) : worn, rng, 0.25);
    wood.box(u, F + 0.05, zw - 0.04, w, h, 0.05, dc, { skip: 'sbt', g0: open ? 1 : 0.65 });
    if (!far) {
      wood.box(u, F + h, zw - 0.08, w + 0.34, 0.13, 0.16, tim, { skip: 'sb' });
      if (!kitchen && rng.chance(0.6)) for (const s of [-1, 1]) wood.box(u + s * (w / 2 + 0.26), F + 0.55, zw - 0.012, 0.16, 1.4, 0.012, jit(mul(col.red, rng.range(0.55, 0.95)), rng, 0.1), { skip: 'sbtew', g0: 0.8 });
    }
    if (kitchen && open) K.kitchens.push([b, u]);
  }
  if (!far && rng.chance(0.7)) { // a jar or a basket by the wall
    const u = rng.range(-hwb * 0.9, hwb * 0.9), r = rng.range(0.22, 0.4), jar = rng.chance(0.5);
    wood.cyl(u, F, zw - 0.45, r * 0.7, r, r * 1.5, 6, jar ? jit([0.14, 0.08, 0.05], rng, 0.2) : jit(col.bamboo, rng, 0.15), { gt: jar ? 0.4 : 1.2, g0: 0.6 });
  }
}

async function buildHungLite(K, ctx) {
  const { P, rng, col, wood, hung } = K, far = K.lod >= 2, dA = TAU / P.bays, tn = Math.tan(dA / 2), cs = Math.cos(dA / 2), zp = P.rPost * cs, hwp = zp * tn;
  const cloths = [[0.03, 0.05, 0.16], [0.6, 0.6, 0.56], mul(col.red, 0.7), mul(col.blue, 0.9), [0.45, 0.3, 0.12], [0.5, 0.52, 0.5], [0.08, 0.16, 0.2]], bam = col.bamboo;
  for (let t = 0; t < 4; t++) for (let b = 0; b < P.bays; b++) {
    if ((b & 7) === 0 && (t || b)) await ctx.yield();
    if (b === 0 && K.hungTier) K.hungTier.push(hung.p.length / 3);   // (where each tier's hung things begin: see setInside)
    const F = P.floors[t], H = t < 3 ? P.floors[t + 1] - F : 3.25, yb = F + H - 0.5;
    wood.frame(b * dA);
    lanternLite(K, -hwp - 0.32, yb, zp - 0.8, rng.range(0.5, 0.62), rng() * 20);
    if (!far || K.festival) lanternLite(K, -hwp + 0.32, yb, zp - 0.8, rng.range(0.5, 0.6), rng() * 20);
    if (K.festival && !far) lanternLite(K, hwp * rng.range(-0.4, 0.5), yb + 0.2, zp - 0.15, 0.38, rng() * 20);
    if (t === 0) continue;
    const f = rng(), uc = rng.range(-0.9, 0.9);
    hung.M.copy(wood.M);
    if (f < 0.5) { // tea trays on a rack
      hung.hang(uc, F + 1.1, zp + 0.2, rng() * 20, -0.026, 0, 0);
      for (const s of [-1, 1]) hung.box(uc + s * 1.36, F + 1.09, zp - 1.05, 0.06, 0.06, 2.75, jit(bam, rng, 0.1), { skip: 'sb' });
      hung.box(uc, F + 1.14, zp - 2.3, 2.95, 0.05, 0.05, jit(bam, rng, 0.1), { skip: 'bew' });
      const spots = [[-0.68, -0.88], [0.68, -0.88], [0, -1.9]], nt = far ? 2 : 3;
      for (let i = 0; i < nt; i++) {
        const w = rng() * rng(), tea = K.persimmon ? jit([0.7, 0.26, 0.03], rng, 0.15) : mul(mix(col.tea, [0.3, 0.19, 0.06], w), 1.5);
        hung.h[6] = -1; hung.cyl(uc + spots[i][0], F + 1.18, zp + spots[i][1], 0.6, 0.0, 0.04, far ? 6 : 8, tea, { cap: false, g0: 1, g1: 1.15, a0: i });
      }
      hung.h[6] = 0;
    } else if (f < 0.78) { // laundry on a pole
      const ph = rng() * 20, tilt = 0.13, zc = zp - 1.0, yc = F + 1.32, py = (z) => yc + (zc - z) * Math.tan(tilt);
      hung.hang(uc, yc, zc, ph, 0, 0, 0);
      hung.box(uc, yc, zc, 0.06, 0.06, 3.5, jit(bam, rng, 0.1), { rx: tilt, skip: 'b' });
      let z = zp - 0.55; const nc = far ? 2 : rng.int(3, 4);
      for (let i = 0; i < nc; i++) { const w = rng.range(0.45, 0.7), len = rng.range(0.7, 1.3); cloth(K, uc, (zz) => py(zz) - 0.02, z - w / 2, w, len, jit(rng.pick(cloths), rng, 0.12), ph + i, 0.24, 0.2, 0); z -= w + 0.08; }
    }
  }
}

// ring E's inner ring: one storey of rooms round the innermost court, plus a low stone kerb circle
function buildInner(K) {
  const { rng, col, wood, roof } = K, tc = col.tile, lime = col.lime, rr = 18.5, ry = 4.7, nb = 20, dA = TAU / nb;
  const prof = [[21.7, 3.2, mul(tc, 0.5)], [21.6, 3.3, mul(tc, 0.88)], [20.5, 3.85, mul(tc, 0.94)], [19.5, 4.35, tc], [rr + 0.25, ry, tc], [rr - 0.25, ry, tc], [17.5, 4.35, tc], [16.5, 3.85, mul(tc, 0.94)], [15.4, 3.3, mul(tc, 0.88)], [15.3, 3.2, mul(tc, 0.5)]];
  roof.frame(0); roof.lathe(prof, 80, { smooth: true, tileU: Math.round(TAU * rr / 0.5), tileV: 0.36 });
  const lm = mul(lime, 1.05), ld = mul(lime, 0.55), dado = mix(lime, col.earth, 0.5), tb = mul(col.timber, 1.1);
  wood.frame(0);
  wood.lathe([[rr + 0.4, ry - 0.3, ld], [rr + 0.25, ry + 0.12, lm], [rr - 0.25, ry + 0.12, lm], [rr - 0.4, ry - 0.3, ld]], 64);
  wood.lathe([[20.3, 0, mul(dado, 0.6)], [20.3, 1.1, dado], [20.3, 3.6, mul(lime, 0.8)]], 64);
  wood.lathe([[16.7, 3.6, mul(lime, 0.8)], [16.7, 1.1, dado], [16.7, 0, mul(dado, 0.6)]], 64);
  wood.lathe([[21.6, 3.2, tb], [20.3, 3.7, mul(tb, 0.5)]], 64); wood.lathe([[16.7, 3.7, mul(tb, 0.5)], [15.4, 3.2, tb]], 64);
  const dark = [0.014, 0.012, 0.011];
  for (let b = 0; b < nb; b++) {
    wood.frame(b * dA); const pass = b % 5 === 0, tim = jit(mul(col.timber, 1.25), rng, 0.18), worn = jit(col.wood2, rng, 0.2);
    for (const [z, s] of [[16.7, -1], [20.3, 1]]) {
      const w = pass ? 2.4 : rng.range(0.9, 1.1), h = pass ? 2.7 : 2.0, open = pass || rng.chance(0.35);
      wood.box(0, 0.03, z + s * 0.03, w, h, 0.06, open ? dark : jit(rng.chance(0.3) ? mix(worn, col.red, 0.35) : worn, rng, 0.2), { skip: s < 0 ? 'sbt' : 'nbt', g0: open ? 1 : 0.65 });
      wood.box(0, h, z + s * 0.08, w + 0.4, 0.14, 0.16, tim, { skip: 'b' });
      if (!pass) { for (const q of [-1, 1]) wood.box(q * (w / 2 + 0.3), 0.6, z + s * 0.015, 0.17, 1.4, 0.012, jit(mul(col.red, rng.range(0.6, 0.95)), rng, 0.1), { skip: 'bt', g0: 0.8 });
        const wx = (z * Math.tan(dA / 2)) * 0.55; wood.box(wx, 1.3, z + s * 0.03, 0.9, 0.8, 0.05, dark, { skip: 'bt', g0: 1 }); wood.box(wx, 1.2, z + s * 0.08, 1.1, 0.1, 0.16, tim, { skip: 'b' }); }
    }
    for (const [z, s] of [[15.6, -1], [21.4, 1]]) { const x = z * Math.tan(dA / 2);
      wood.cyl(x, 0, z, 0.13, 0.12, 3.25, 5, tim, { cap: false, g0: 0.7, flat: true }); lanternLite(K, x + 0.35, 3.25, z + s * 0.1, 0.5, rng() * 20); }
    if (!pass && rng.chance(0.6)) { const r = rng.range(0.3, 0.45); wood.cyl(rng.range(-1.6, 1.6), 0, 16.0, r * 0.6, r, r * 1.3, 7, jit([0.12, 0.08, 0.05], rng, 0.2), { gt: 0.5, g0: 0.6 }); }
  }
  K.shrine = [0, 3, 0]; K.incense = null;
}

function ringCols(pal, rng) {
  const earthTone = rng.pick([[0.62, 0.33, 0.11], [0.52, 0.27, 0.12], [0.66, 0.42, 0.17], [0.55, 0.36, 0.2]]);
  return {
    mist: pal[0], earth: jit(mix(pal[1], earthTone, rng.range(0.1, 0.55)), rng, 0.06), tile: mul(mix(pal[2], [0.09, 0.07, 0.06], rng.range(0, 0.4)), rng.range(1.5, 1.9)),
    timber: mul(pal[3], 2.0), wood2: mix(pal[3], pal[1], rng.range(0.32, 0.46)), tea: pal[4], red: pal[5], blue: pal[6],
    lime: mul(mix(pal[0], pal[1], rng.range(0.08, 0.2)), 0.8), stone: [0.3, 0.29, 0.27], bamboo: [0.42, 0.36, 0.16],
  };
}

// opts: name, lod (1 | 2), bays, inner (ring E's inner ring instead of the shrine), square (superellipse power, e.g. 5),
//   palette, sunDir (local), bounce [r,g,b], lanternGlow, festival, persimmon, animals, smoke, wet
export async function buildRing(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tulou-ring-' + (opts.name || 'b')) : ctx.rng;
  const pal = ((opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE).map(C), R = 48, eave = 17, lod = opts.lod ?? 1, inner = !!opts.inner;
  const P = { R, eave, plinth: 2, bays: opts.bays ?? 32, floors: [0, 4.2, 8.4, 12.6], rBack: 41.2, rPost: 39, ...ROOF, key: R + '-' + eave };
  const col = ringCols(pal, rng), side = rng.sign();
  const K = {
    P, rng, col, noise: ctx.noise, detail: ctx.quality?.detail ?? 1, lod, roofSeg: opts.roofSeg ?? (lod >= 2 ? 72 : 128), roofN: lod >= 2 ? 3 : 5, rafters: 0, clothN: lod >= 2 ? 1 : 2,
    wall: new Soup(), roof: new Soup({ tile: true }), wood: new Soup(), hung: new Soup({ hung: true }), cob: new Soup(),
    kitchens: [], curtains: [], glow: 1, side, festival: !!opts.festival, persimmon: !!opts.persimmon, slideBay: -1, smokeTint: opts.smokeTint,
    well: inner ? [side * 27, 9] : [side * rng.range(10, 15), 6 + rng.range(4.5, 8)], wellRot: rng.range(-0.6, 0.6), mill: inner ? [-side * 29, -6] : [-side * rng.range(9, 15), 6 - rng.range(4.5, 8)],
    mats: rng.int(3, 6), matR: inner ? [25, 33] : null, table: inner ? [side * 26, -12] : null, duckPhase: rng() * TAU, wind: [rng.range(0.5, 1) * (rng.chance(0.75) ? -1 : 1), rng.range(-0.5, 0.5)],
  };
  const U = {
    uSun: { value: new THREE.Vector3(-0.85, 0.42, 0.32).normalize() }, uTime: { value: 0 }, uSeed: { value: rng() * 50 },
    uGlow: { value: opts.lanternGlow ?? 1.1 }, uSlide: { value: 1 }, uCam: { value: new THREE.Vector3(1e4, 0, 1e4) }, uShaft: { value: 0 }, uBounce: { value: new THREE.Vector3(0.5, 0.45, 0.36) }, uFill: { value: new THREE.Vector3().fromArray(opts.fill || [0.3, 0.38, 0.55]) }, uSkyC: { value: new THREE.Vector3().fromArray(opts.sky || [0.4, 0.5, 0.7]) },
    uInner: { value: new THREE.Vector4(4.2, 15.4, 21.6, inner ? 1 : 0) }, uWet: { value: opts.wet ?? 0 },
    uMist: opts.mist?.uMist || { value: new THREE.Vector4(0, 0, 0, 0) }, uMistCol: opts.mist?.uMistCol || { value: new THREE.Color(1, 1, 1) },
    uScenes: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uWell: { value: new THREE.Vector3(K.well[0], K.well[1], 0) },
    uShade: { value: new THREE.Vector3().fromArray(opts.shade || [0.42, 0.47, 0.6]) }, uShK: { value: 1 },
    uTrue: { value: opts.life ? 1 / opts.life.scale : 1 }, uPlanP: { value: opts.square || 2 },   // one true metre in the ring's own (see buildYardLife); the power of the ring's plan (2: round)
  };
  K.duckRng = makeRng(Math.floor(K.duckPhase * 1e6) + 7); K.stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  if (opts.life) K.matList = [];   // (buildCourt notes the mats it lays: the yard's new things keep clear of them)
  if (opts.sunDir) U.uSun.value.fromArray(opts.sunDir).normalize();
  if (opts.bounce) U.uBounce.value.fromArray(opts.bounce);
  if (inner) K.hungOut = new Soup({ hung: true });   // (ring E: the gate's lanterns are kept apart from what hangs inside, see setInside)
  buildWall(K); await ctx.yield();
  buildGate(K); await ctx.yield();
  await buildRoof(K, ctx); await ctx.yield();
  const woodOutN = K.wood.p.length / 3, wCut = [0, woodOutN];   // the timber of the wall, the gate and the roof comes first in its mesh; the galleries' after it, tier by tier
  for (let t = 0; t < 4; t++) { for (let b = 0; b < P.bays; b++) { buildBayLite(K, b, t); if ((b & 7) === 7) await ctx.yield(); } wCut.push(K.wood.p.length / 3); }
  if (inner) K.hungTier = [0];
  await buildHungLite(K, ctx); await ctx.yield();
  const hCut = inner ? K.hungTier.concat([K.hung.p.length / 3]) : null;
  if (lod <= 1) eaveNecklace(K);
  if (hCut) hCut.push(K.hung.p.length / 3);
  await ctx.yield();
  if (inner) buildInner(K); else buildShrine(K);
  await ctx.yield();
  buildCourt(K); await ctx.yield();
  if (opts.square) { // round the ring into a square with rounded corners (the middle of the court keeps its shape)
    const pw = opts.square, f = (x, z) => { const r = Math.hypot(x, z); if (r < 1e-3) return 1; const c = Math.abs(x) / r, s = Math.abs(z) / r; return 1 + (Math.pow(Math.pow(c, pw) + Math.pow(s, pw), -1 / pw) - 1) * smoothstep(20, 36, r); };
    for (const sp of [K.wall, K.roof, K.wood, K.cob, K.hung]) {
      const p = sp.p; for (let i = 0; i < p.length; i += 3) { const k = f(p[i], p[i + 2]); p[i] *= k; p[i + 2] *= k; }
      if (sp.ext) { const e = sp.ext; for (let i = 0; i < e.length; i += 7) { const k = f(e[i], e[i + 2]); e[i] *= k; e[i + 2] *= k; } }
    }
    K.warp = f;
  }
  if (opts.life) { buildYardLife(K, { name: opts.name || 'b', scale: opts.life.scale }); await ctx.yield(); }   // the small rings' yards, set down in the ring as built
  const object = new THREE.Group(); object.name = 'tulou-ring-' + (opts.name || 'b');
  const mats = {
    earth: makeMat(P, U, 'earth', { roughness: 0.95 }), tile: makeMat(P, U, 'tile', { roughness: 0.8 }), wood: makeMat(P, U, 'plain', { roughness: 0.85 }),
    cob: makeMat(P, U, 'cobble', { roughness: 0.9 }), hung: makeMat(P, U, 'hung', { roughness: 0.8, hung: true, side: THREE.DoubleSide }),
  };
  const add = (soup, mat, name) => { const m = new THREE.Mesh(soup.toGeometry(), mat); m.name = name; object.add(m); return m; };
  const addA = async (soup, mat, name) => { const m = new THREE.Mesh(await soup.toGeometryAsync(ctx.yield), mat); m.name = name; object.add(m); return m; };
  await ctx.yield();
  await addA(K.wall, mats.earth, 'wall'); await ctx.yield();
  await addA(K.roof, mats.tile, 'roof'); await ctx.yield();
  // Ring E (the ring the flight ends in) is seen from far off over its own roof, the top gallery first. So its galleries' timber and hung things are put in
  // order from the top tier down, behind what is outside the wall, and setInside(level) draws as far down as can be seen:
  //   timber: [wall, gate, roof | tier 3 | tier 2 | tier 1 | tier 0 | inner house ring, court]     hung: [gate lanterns | eave necklace, tier 3 | tier 2 | tier 1 | tier 0 | the rest]
  // wLvl[k], hLvl[k]: how many vertices are drawn at level k (0: nothing inside ... 4: everything). Only the order of triangles changes, not one of them.
  let wLvl = null, hLvl = null;
  if (inner) {
    wCut.push(K.wood.p.length / 3);   // wCut: 0, outside, after tier 0, 1, 2, 3, end
    await reorderSoup(K.wood, wCut, [0, 4, 3, 2, 1, 5], ctx.yield);
    { const n = (i) => wCut[i + 1] - wCut[i]; wLvl = [n(0), n(0) + n(4), n(0) + n(4) + n(3), n(0) + n(4) + n(3) + n(2), Infinity]; }
    hCut.push(K.hung.p.length / 3);   // hCut: 0, tier 0 begins, tier 1, 2, 3, after tier 3, after the necklace, end
    await reorderSoup(K.hung, hCut, [0, 5, 4, 3, 2, 1, 6], ctx.yield);
    for (const k of ['p', 'n', 'c', 'ext']) K.hung[k] = K.hungOut[k].concat(K.hung[k]);
    { const n = (i) => hCut[i + 1] - hCut[i], o = K.hungOut.p.length / 3 + n(0); hLvl = [o, o + n(5) + n(4), o + n(5) + n(4) + n(3), o + n(5) + n(4) + n(3) + n(2), Infinity]; }
    await ctx.yield();
  }
  const timberMesh = await addA(K.wood, mats.wood, 'timber'); await ctx.yield();
  const floorOnly = [await addA(K.cob, mats.cob, 'cobbles')]; await ctx.yield();
  const hungMesh = await addA(K.hung, mats.hung, 'hung'); await ctx.yield();
  const birdMat = opts.animals || opts.people ? makeMat(P, U, 'bird', { roughness: 0.9, bird: true }) : null;
  if (opts.animals) { const b = buildBirds(K, birdMat); object.add(b); floorOnly.push(b); }
  if (opts.people && inner) { ringFolk(K); for (const m of await buildPeople(K, birdMat, makeShade(P, U, true), ctx)) { object.add(m); floorOnly.push(m); } }   // villagers in the court the flight ends in: four instanced meshes
  const dA = TAU / P.bays, bases = [], used = [], want = lod >= 2 ? 2 : 4;
  for (const [b, u] of rng.shuffle(K.kitchens.slice())) {
    if (bases.length >= want) break; if (used.some((x) => Math.min(Math.abs(x - b), P.bays - Math.abs(x - b)) < 4)) continue; used.push(b);
    const th = b * dA, z = P.rBack - 0.7; bases.push({ p: [Math.sin(th) * z + Math.cos(th) * u, 2.5, Math.cos(th) * z - Math.sin(th) * u], kind: 1, scale: rng.range(0.6, 0.85) });
  }
  if (opts.smoke !== false && bases.length) object.add(makeSmoke(K, U, bases));
  const gz = wallR(P, 2); let galOn = 4, floorOn = true;
  return {
    object, radius: P.rEaveOut, height: P.ridgeY + 0.6, uniforms: U,
    anchors: { gate: { position: [0, 2, gz + 1.5], facing: [0, 0, 1] }, courtCenter: [0, 0, 0], smokeBases: bases.map((b) => b.p.slice()) },
    triangles: Math.round(K.wall.tris + K.roof.tris + K.wood.tris + K.cob.tris + K.hung.tris), yard: K.yard || null,
    setSun(d) { U.uSun.value.copy(d).normalize(); }, setBounce(r, g, b) { U.uBounce.value.set(r, g, b); }, setFill(r, g, b) { U.uFill.value.set(r, g, b); }, setLanternGlow(x) { U.uGlow.value = x; }, setWet(x) { U.uWet.value = x; }, setSky(r, g, b) { U.uSkyC.value.set(r, g, b); },
    // What is inside ring E, by where it can be seen from. level: how far down the galleries are drawn (0 none, 1 the top tier and the eave's lanterns, 2, 3,
    // 4 all four tiers and the inner house ring); floor: the cobbles, the villagers and their shadows, the fowl. At level 0 with the floor off, the wall, the
    // roof, the gate with its lanterns and the smoke are still drawn.
    setInside(level, floor) {
      if (wLvl && level !== galOn) { galOn = level; timberMesh.geometry.setDrawRange(0, wLvl[level]); hungMesh.geometry.setDrawRange(0, hLvl[level]); hungMesh.visible = hLvl[level] > 0; }
      if (floor !== floorOn) { floorOn = floor; for (const m of floorOnly) m.visible = floor; }
    },
    update(dt, time, camera) { U.uTime.value = time; if (camera && opts.animals) { object.updateWorldMatrix(true, false); _v.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(_v); U.uCam.value.copy(_v); } },
  };
}

// put the stretches of a soup's vertices in a new order: cut[i]..cut[i + 1] is stretch i (one attribute at a time: a big soup is tens of milliseconds of copying)
async function reorderSoup(s, cut, order, y) { for (const [k, w] of [['p', 3], ['n', 3], ['c', 3], ['ext', 7]]) { const a = s[k]; if (a) { s[k] = [].concat(...order.map((i) => a.slice(cut[i] * w, cut[i + 1] * w))); await y(); } } }
// ---------- the hero ----------

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tulou-hero') : ctx.rng;
  const pal = ((opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE).map(C);
  const R = 48, eave = 17;
  const P = { R, eave, plinth: 2, bays: 32, floors: [0, 4.2, 8.4, 12.6], rBack: 41.2, rPost: 39, ...ROOF, key: R + '-' + eave };
  // per-seed character: earth and tile tone, limewash, festival or persimmon season, which side the well is on
  const earthTone = rng.pick([[0.62, 0.33, 0.11], [0.52, 0.27, 0.12], [0.66, 0.42, 0.17], [0.55, 0.36, 0.2]]);
  const col = {
    mist: pal[0], earth: jit(mix(pal[1], earthTone, rng.range(0.1, 0.55)), rng, 0.06), tile: mul(mix(pal[2], [0.09, 0.07, 0.06], rng.range(0, 0.4)), rng.range(1.5, 1.9)),
    timber: mul(pal[3], 2.0), wood2: mix(pal[3], pal[1], rng.range(0.32, 0.46)), tea: pal[4], red: pal[5], blue: pal[6],
    lime: mul(mix(pal[0], pal[1], rng.range(0.08, 0.2)), 0.8), stone: [0.3, 0.29, 0.27], bamboo: [0.42, 0.36, 0.16],
  };
  const side = rng.sign();
  const K = {
    P, rng, col, noise: ctx.noise, detail: ctx.quality?.detail ?? 1,
    wall: new Soup(), roof: new Soup({ tile: true }), wood: new Soup(), hung: new Soup({ hung: true }), cob: new Soup(), ribs: new Soup({ tile: true }),
    kitchens: [], curtains: [], glow: 1, side, smokeTint: opts.smokeTint, cast: new Soup(), matList: [], hungOut: new Soup({ hung: true }),
    festival: opts.festival ?? rng.chance(1 / 6), persimmon: opts.persimmon ?? rng.chance(0.2), slideBay: Math.round(P.bays * 0.25) + rng.int(0, 2),
    folk: opts.folk || null, mats: rng.int(3, 6), duckPhase: rng() * TAU, wind: [rng.range(0.5, 1) * (rng.chance(0.75) ? -1 : 1), rng.range(-0.5, 0.5)],
  };
  const U = {
    uSun: { value: new THREE.Vector3(-0.85, 0.42, 0.32).normalize() }, uTime: { value: 0 }, uSeed: { value: rng() * 50 },
    uGlow: { value: opts.lanternGlow ?? 1.1 }, uSlide: { value: 0 }, uCam: { value: new THREE.Vector3(1e4, 0, 1e4) }, uShaft: { value: opts.shafts ?? 0.4 }, uBounce: { value: new THREE.Vector3(0.5, 0.45, 0.36) }, uFill: { value: new THREE.Vector3().fromArray(opts.fill || [0.3, 0.38, 0.55]) }, uSkyC: { value: new THREE.Vector3().fromArray(opts.sky || [0.4, 0.5, 0.7]) },
    uInner: { value: new THREE.Vector4(0, 0, 0, 0) }, uWet: { value: opts.wet ?? 0 },
    uMist: opts.mist?.uMist || { value: new THREE.Vector4(0, 0, 0, 0) }, uMistCol: opts.mist?.uMistCol || { value: new THREE.Color(1, 1, 1) },
    uScenes: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uWell: { value: new THREE.Vector3() },
    uShade: { value: new THREE.Vector3().fromArray(opts.shade || [0.42, 0.47, 0.6]) }, uShK: { value: 1 },
  };
  K.duckRng = makeRng(Math.floor(K.duckPhase * 1e6) + 7); K.mrng = makeRng(Math.floor(K.duckPhase * 1e6) + 91); K.cageRng = makeRng(Math.floor(K.duckPhase * 1e6) + 311);
  // A thing that stands by a rule of its own takes a stream of its own, made from the world's seed and the thing's name (it draws nothing from `rng`).
  K.stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)); K.henRng = K.stream('r17c-hens');
  layCourt(K); U.uWell.value.set(K.well[0], K.well[1], 0);
  let sunFixed = false, bounceFixed = false;
  if (opts.sunDir) { U.uSun.value.fromArray(opts.sunDir).normalize(); sunFixed = true; }

  buildWall(K); await ctx.yield();
  buildGate(K); await ctx.yield();
  await buildRoof(K, ctx); await ctx.yield();
  // real rib tiles on the part of the roof the flight skims: both slopes where it tips over the ridge and climbs out again, the inner slope round the sun side
  // (a box round each stretch of ribs, for the world's "are the ribs in the frame": ribBoxes)
  const ribBoxes = [], ribs = (a, b, outer) => { const v0 = K.ribs.p.length; buildRibs(K, a, b, outer); const bx = new THREE.Box3(), q = K.ribs.p; for (let i = v0; i < q.length; i += 3) bx.expandByPoint(_v.set(q[i], q[i + 1], q[i + 2])); if (!bx.isEmpty()) ribBoxes.push(bx); };
  ribs(-80, -47.5, true); ribs(-47.5, -15, true); await ctx.yield();
  for (let a = -140; a < 10; a += 50) { ribs(a, Math.min(a + 50, 10), false); await ctx.yield(); }
  roofTrays(K); await ctx.yield();
  // The timber of the wall, the gate and the roof comes first in its mesh; then the four tiers of galleries; the hall, the stalls and the court's furniture
  // after them. Hung things likewise: what is on the roof, the four tiers, the rest.
  const wCut = [0, K.wood.p.length / 3];
  for (let t = 0; t < 4; t++) {
    for (let b = 0; b < P.bays; b++) { buildBay(K, b, t); if ((b & 1) === 1) await ctx.yield(); }
    wCut.push(K.wood.p.length / 3); await ctx.yield();
  }
  K.hungTier = [];
  await buildHung(K, ctx); await ctx.yield();
  eaveNecklace(K); await ctx.yield();
  const hCut = [0, ...K.hungTier, K.hung.p.length / 3];   // hCut: 0, tier 0 begins, tier 1, 2, 3, after tier 3 (the door curtains and the eave's necklace follow), after those
  buildShrine(K); await ctx.yield();
  buildCourt(K); await ctx.yield();
  await buildWaking(K, ctx); await ctx.yield();
  await buildMarket(K, ctx); K.scenes.forEach((st, i) => { if (i < 12) U.uScenes.value[i].set(st[0], st[1], st[2], st[3]); }); await ctx.yield();
  buildGarden(K, U.uSun.value); await ctx.yield();
  // What is INSIDE the wall is put in order of how far down a sight line over the roof must reach to find it, so that setInside can draw as far as can be seen
  // (only the order of triangles changes, not one of them):
  //   timber: [wall, gate, roof | hall, stalls, court | tier 3 | tier 2 | tier 1 | tier 0]     hung: [gate lanterns, roof trays | curtains, eave necklace, tier 3 | tier 2 | tier 1 | tier 0 | the court's]
  wCut.push(K.wood.p.length / 3); await reorderSoup(K.wood, wCut, [0, 5, 4, 3, 2, 1], ctx.yield);
  hCut.push(K.hung.p.length / 3); await reorderSoup(K.hung, hCut, [0, 5, 4, 3, 2, 1, 6], ctx.yield);
  const wN = (i) => wCut[i + 1] - wCut[i], hN = (i) => hCut[i + 1] - hCut[i];
  const wOut = wN(0), wCourt = wN(5), wTier = [0, wN(4), wN(4) + wN(3), wN(4) + wN(3) + wN(2), wN(4) + wN(3) + wN(2) + wN(1)];   // vertices: outside the wall, the court's, the tiers down to level k
  const hOut = K.hungOut.p.length / 3 + hN(0), hLvl = [hOut, hOut + hN(5) + hN(4), hOut + hN(5) + hN(4) + hN(3), hOut + hN(5) + hN(4) + hN(3) + hN(2), hOut + hN(5) + hN(4) + hN(3) + hN(2) + hN(1)];
  await ctx.yield();

  const object = new THREE.Group(); object.name = 'tulou-ring-A';
  const mats = {
    earth: makeMat(P, U, 'earth', { roughness: 0.95 }), tile: makeMat(P, U, 'tile', { roughness: 0.8 }), wood: makeMat(P, U, 'plain', { roughness: 0.85 }),
    cob: makeMat(P, U, 'cobble', { roughness: 0.9 }), hung: makeMat(P, U, 'hung', { roughness: 0.8, hung: true, side: THREE.DoubleSide }), bird: makeMat(P, U, 'bird', { roughness: 0.9, bird: true }),
  };
  const add = (soup, mat, name) => { const m = new THREE.Mesh(soup.toGeometry(), mat); m.name = name; object.add(m); return m; };
  const addA = async (soup, mat, name) => { const m = new THREE.Mesh(await soup.toGeometryAsync(ctx.yield), mat); m.name = name; object.add(m); return m; };
  await addA(K.wall, mats.earth, 'wall'); await ctx.yield();
  await addA(K.roof, mats.tile, 'roof'); await ctx.yield();
  const timberMesh = await addA(K.wood, mats.wood, 'timber'); await ctx.yield();
  await addA(K.cob, mats.cob, 'cobbles'); await ctx.yield();
  // the hung things that are OUTSIDE the wall (the two gate lanterns, the four on the outer eave over the gate) are the first vertices of the hung mesh:
  // setInside(0, ...) draws only those and the roof's trays, so they hang there all the way up the lane
  for (const k of ['p', 'n', 'c', 'ext']) K.hung[k] = K.hungOut[k].concat(K.hung[k]);
  await ctx.yield();
  const hungMesh = await addA(K.hung, mats.hung, 'hung'); await ctx.yield();
  { const m = await addA(K.ribs, mats.tile, 'roof-ribs'); m.frustumCulled = false; } await ctx.yield();
  const mv = buildMovers(K);
  const windlass = add(mv.wl, mats.wood, 'windlass'), bucket = add(mv.bk, mats.wood, 'bucket'), millstone = add(mv.ms, mats.wood, 'millstone');
  windlass.position.set(K.well[0], 1.62, K.well[1]); windlass.rotation.order = 'YXZ'; windlass.rotation.y = K.wellRot;
  bucket.position.set(K.well[0], 0.8, K.well[1]); millstone.position.set(K.mill[0], 0.82, K.mill[1]);
  // where the well's windlass and bucket and the millstone stand in their cycles when the clock starts (radians; the world draws them, see opts.phases)
  const PH = { windlass: 0, bucket: 0, mill: 0, ...(opts.phases || {}) };
  let birds = null; const courtOnly = [windlass, bucket, millstone], folkMeshes = [];   // (setInside, below)
  if (opts.animals !== false) { birds = buildBirds(K, mats.bird); object.add(birds); courtOnly.push(birds); }
  await ctx.yield();
  if (K.cast.tris) {   // the shadows of the hall, the earth god's house, the well roof, the washing and the stalls
    const castMesh = new THREE.Mesh(K.cast.toGeometry(), makeShade(P, U)); castMesh.name = 'cast-shadows'; castMesh.renderOrder = -0.3; castMesh.frustumCulled = false; object.add(castMesh); courtOnly.push(castMesh);
  }
  if (K.people && K.people.length) for (const m of await buildPeople(K, mats.bird, makeShade(P, U, true), ctx)) { object.add(m); folkMeshes.push(m); }   // the villagers and their shadows: four instanced meshes
  await ctx.yield();
  await ctx.yield();
  // smoke from kitchen doors (spread round the ring), plus the incense thread
  const dA = TAU / P.bays, bases = [], kit = rng.shuffle(K.kitchens.slice()), want = rng.int(3, 5), used = [];
  for (const [b, u] of kit) {
    if (bases.length >= want) break; if (used.some((x) => Math.min(Math.abs(x - b), P.bays - Math.abs(x - b)) < 4)) continue; used.push(b);
    const th = b * dA, z = P.rBack - 0.7; bases.push({ p: [Math.sin(th) * z + Math.cos(th) * u, 2.5, Math.cos(th) * z - Math.sin(th) * u], kind: 1, scale: rng.range(0.8, 1.15) });
  }
  const smokeBases = bases.map((b) => b.p.slice());
  for (const p of opts.extraSmoke || []) bases.push({ p: [p[0], p[1], p[2]], kind: 1, scale: p[3] ?? 1.4 });
  if (K.incense) bases.push({ p: K.incense, kind: 0, scale: 1 });
  if (K.incense2) bases.push({ p: K.incense2, kind: 0.12, scale: 1.5 });   // the earth god's burner: a thread that climbs seven metres before the breeze takes it
  for (const p of K.steam || []) bases.push({ p, kind: 0.06, scale: 1.6 });   // the bowls on the low table: a breath of steam
  let smoke = null, shafts = null;
  if (opts.smoke !== false) { smoke = makeSmoke(K, U, bases); object.add(smoke); }
  shafts = makeShafts(K, U); object.add(shafts);

  // anchors (local space; lap and fly-through as flown with rotation.y = PI: world east = local -X, north = local -Z)
  const lapR = 34.5, lapY = 10.5, sweep = 265 * Math.PI / 180, lapPts = [];
  for (let i = 0; i <= 18; i++) { const a = (i / 18) * sweep; lapPts.push([-lapR * Math.cos(a), lapY, -lapR * Math.sin(a)]); }
  const W = (x, y, z) => [-x, y, -z];
  const flyThrough = [W(33, 5, -80), W(31, 10, -64), W(28.5, 19, -50), W(26, 24.3, -37.5), W(22, 22, -30), W(21.5, 18.5, -23), W(25, 15, -15), W(31, 12, -7),
    ...lapPts, W(7, 14, -29.5), W(19, 23.5, -28), W(33, 30, -28), W(50, 36, -24)];
  const gz = wallR(P, 2);
  const anchors = {
    lap: { center: [0, lapY, 0], radius: lapR, y: lapY, startAngle: 0, sweep, points: lapPts },
    flyThrough,
    gate: { position: [0, 2, gz + 1.5], facing: [0, 0, 1] }, gateInside: { position: [0, 2, P.rPost - 1], facing: [0, 0, -1] },
    courtCenter: [0, 0, 0], wellTop: [K.well[0], 2.7, K.well[1]], shrine: K.shrine, incense: K.incense, mill: [K.mill[0], 1.1, K.mill[1]],
    portalSeat: { position: [0, 7.5, 6], facing: [0, 0, 1] },
    viewpoints: {
      lapEast: { position: [-lapR, lapY, 0], lookAt: [-20, 9.5, -28] }, lapWest: { position: [lapR, lapY, 0], lookAt: [20, 9.5, 28] },
      overRidge: { position: W(26, 24.3, -37.5), lookAt: [0, 4, -4] }, above: { position: [10, 78, 62], lookAt: [0, 8, 0] }, gateOutside: { position: [9, 3.2, gz + 30], lookAt: [0, 7, gz] },
    },
    smokeBases, stalls: K.stalls || [], people: (K.people || []).map((p) => [p.x, p.y, p.z, p.mode]),
    court: { wash: K.wash, mill: K.millAt, trayPlaces: K.trayPlaces, trayMats: K.trayMats, dryingMats: K.midMats.length, cart: K.cart || null, taken: K.taken },
  };

  let insideKey = '', light = null, frame = 0, shaftBase = U.uShaft.value, shaftNow = shaftBase, shaftSeen = 1;   // shaftSeen: the blades are for eyes inside the court; from above the roof they fade
  return {
    object, radius: P.rEaveOut, height: P.ridgeY + 0.6, center: new THREE.Vector3(0, 9, 0), anchors,
    ground: true, groundY: -0.25,
    triangles: Math.round(K.wall.tris + K.roof.tris + K.wood.tris + K.cob.tris + K.hung.tris + K.ribs.tris),
    setSun(d) { U.uSun.value.copy(d).normalize(); sunFixed = true; },
    setShafts(x) { shaftBase = x; shaftNow = x; U.uShaft.value = x * shaftSeen; },
    setLanternGlow(x) { U.uGlow.value = x; },
    setSky(r, g, b) { U.uSkyC.value.set(r, g, b); },
    setBounce(r, g, b) { U.uBounce.value.set(r, g, b); bounceFixed = true; },
    setFill(r, g, b) { U.uFill.value.set(r, g, b); },
    setWet(x) { U.uWet.value = x; },
    // What is inside the wall, by where it can be seen from (the world asks with its sight-line and frame tests):
    //   level  how many tiers of galleries a sight line over the roof reaches, from the top (0: nothing inside ... 4: all four); their timber and their hung
    //          things (lanterns, trays, washing, cages; with the top tier the door curtains and the eave's necklace) are drawn that far down;
    //   court  the court can be seen: its timber (hall, stalls, well, mill, garden), everything hung in it, and its life as ONE set (the villagers and their
    //          shadows, the fowl, the cast shadows, the well's and the mill's moving parts). Off, all of these go together;
    // What stands outside the wall is always drawn: the wall, the roof, the gate and its lanterns, the roof's trays, the villagers on the footbridge and by
    // the lane with their shadows. (Drawing the court's timber with a tier that is seen costs nothing in the picture: the near roof hides what no line reaches.)
    setInside(level, court) {
      const key = level + (court ? 'c' : '-'); if (key === insideKey) return; insideKey = key;
      timberMesh.geometry.setDrawRange(0, !level ? wOut : court && level === 4 ? Infinity : wOut + wCourt + wTier[level]);
      hungMesh.geometry.setDrawRange(0, court ? Infinity : hLvl[level]); hungMesh.visible = court || hLvl[level] > 0;
      for (const m of folkMeshes) { m.count = court ? m.userData.all : m.userData.out; m.visible = m.count > 0; }
      for (const m of courtOnly) m.visible = court;
    },
    ribBoxes,   // boxes round the stretches of real rib tiles, in the ring's own space
    setProgress(u) { U.uSlide.value = smoothstep(0.3, 0.6, u); shaftNow = shaftBase * (0.8 + 0.3 * smoothstep(0.3, 0.7, u)); U.uShaft.value = shaftNow * shaftSeen; },
    update(dt, time, camera) {
      U.uTime.value = time;
      windlass.rotation.x = time * 0.9 + PH.windlass; bucket.position.y = 0.72 + 0.28 * Math.sin(time * 0.45 + PH.bucket); millstone.rotation.y = -(time * 0.5 + PH.mill);
      if (camera) { object.updateWorldMatrix(true, false); _v.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(_v); U.uCam.value.copy(_v);
        shaftSeen = 1 - smoothstep(P.eave - 3, P.ridgeY + 1, _v.y); U.uShaft.value = shaftNow * shaftSeen; U.uShK.value = 1 - smoothstep(P.ridgeY + 8, P.ridgeY + 22, _v.y); }
      if ((!light || !light.parent) && frame++ % 20 === 0) { light = null; let root = object; while (root.parent) root = root.parent; root.traverse((o) => { if (o.isDirectionalLight && (!light || o.intensity > light.intensity)) light = o; }); }
      if (light && !sunFixed) { light.getWorldPosition(_v); light.target.getWorldPosition(_v2); _v.sub(_v2); if (_v.lengthSq() > 1e-6) { object.getWorldQuaternion(_q).invert(); U.uSun.value.copy(_v.applyQuaternion(_q).normalize()); } }
      if (light && !bounceFixed) { const k = light.intensity * 0.17 * clamp(U.uSun.value.y * 3, 0, 1); U.uBounce.value.set(light.color.r * k, light.color.g * k * 0.92, light.color.b * k * 0.78); }
    },
    dispose() {},
  };
}
