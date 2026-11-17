// THE GUST AND THE GREAT MAPLE: hero set piece for "maple-gale" (The Leaf Wind).
//
// Two things that are really one: (1) a 28 m sugar maple, fully crimson, leaning 12 degrees downwind
// from a schist outcrop, whose ~34,000 leaves are torn off in a wave that crosses the crown from
// windward to leeward in two seconds, branch by branch, leaving black limbs springing up and
// whipping bare while the cloud pours downwind, hangs past the lip and rains down; and (2) THE GUST
// itself: ~56,000 tumbling maple leaves in nine braided streams that follow the camera path, part
// round every obstacle capsule (trunks, boulders, the maple's own crown), curl in the lee and rejoin.
//
// ORIENTATION  origin = centre of the trunk where it meets the rock (y = 0), +Y up.
//              +X = DOWNWIND / downstream / the way the camera travels. The brink of the fall is the
//              plane x = anchors.lipX (+11). +Z = the stream side: the camera passes at z = +16
//              (16 m from the trunk), so the tree is on the camera's LEFT; the sun belongs at +Z
//              (camera's right), a little behind (-X). Rotate hero.object so local +X is the path
//              heading at the lip. The rock base reaches 6 m below y = 0 so it can be sunk in a bank.
// SIZE         radius 14 m, height 28 m. The crown is windswept: it spans roughly x -12..+19 (out over
//              the lip), z -15..+9.3 (never nearer than 6.5 m to the camera line; measured 7.5-9 m).
//              The torn-off cloud travels 30-90 m downwind and falls to anchors.poolY (-61.5). The gust
//              is a treadmill 180 m long (40 behind, 140 ahead of the camera) x 44 wide x 18 high.
// COST         ~115k triangles (limbs+roots 22k, rock 2.2k, maple leaves 34k and gust 56k single
//              triangles), 4 draw calls, ~150 ms build, no lights, no textures, no render targets.
//              Plus, when the world calls setBursts: one more draw of crown-burst leaves, at most about 9k triangles on
//              screen (only the trees within 100 m of the front). The limbs are not drawn from beyond 520 m.
//
// DRIVING IT   hero.setPath(path)      world-space makePath() of the journey. Call once after placing
//                                      hero.object in the scene. The gust then lives in path coordinates
//                                      (it bends with the gorge and dives with the last 60 m).
//              hero.setProgress(u)     every frame, the world's u. Moves the gust treadmill with the
//                                      camera and runs the strip: it begins when the camera is
//                                      opts.stripLead (50 m) short of the tree and the crown is bare
//                                      50 m later (2 s at 25 m/s); the cloud's flight keeps running on u.
//              hero.setStrip(sec)      alternative to path driving: the strip clock in seconds
//                                      (< -3 calm, -3..0 the crown heaves and flashes pale, 0..2 strips,
//                                      then the cloud flies; null hands control back).
//              hero.setObstacles([{ x, z, r, y0, y1 }])  world-space capsules (vertical cylinders) the
//                                      leaf streams part round: near trunks and boulders. The 10 nearest
//                                      the camera are used each frame; the maple adds its own two.
//              hero.setHold(i, x, z, r, y0, y1)  two more capsules (i = 0 or 1) the world may move every frame (an animal
//                                      the streams must part round, the sight line to it); they are always used, whatever
//                                      else is near. r = 0 switches one off.
//              await hero.setBursts(trees, rng)  the crown bursts (once, in build): trees = [{ c, r, ry, s, t, lat, hgt, n, cols }]
//              (see buildBurstGeometry); one added draw, its range moved with the front; returns { leaves, peak }
//              hero.frontLead  metres the front runs ahead of the lens (25)
//              hero.setPatch(x, z, r, floor, x2, z2, r2)  the world's travelling break of sun: full sun inside radius r
//                                      of world (x, z), eased over 64 m to `floor` x sun outside it, plus an optional
//                                      second break of radius r2 resting at (x2, z2). Default: no patch.
//              hero.setSun(gain)       0..1+ multiplier on the direct sun term of every material here
//                                      (the world's travelling sun patch sampled at the tree).
//              hero.gust               { mesh, uniforms, setLead(m), setAhead(0..1), setAirSpeed(m/s|null),
//                                      setFloor(m) }: leaves farther ahead of the camera than `lead` are
//                                      thinned to `ahead` (brief: frontS = camera + 25 m; default lead 25,
//                                      ahead 0.3). Each leaf drifts -10..+5 m/s relative to the camera (so
//                                      the field is never frozen at u = 0); setAirSpeed adds a common
//                                      drift (set it once, not per frame). setFloor: lowest leaf height
//                                      relative to the path (-3.6: keeps them off the water 4.5 m below).
//                                      setClear(r): radius (m) of an open tube round the path ahead of the lens.
//                                      setAmount(0..1): the share of the leaves aloft (the world lets the air calm between gusts).
//                                      setRibbons({ n, a, b }): the two RIBBONS. Besides the nine wandering streams the gust
//                                      carries two ropes of leaves, each three strands braided round one another, whose
//                                      centre lines the world lays out along the path: a and b are Float32Arrays of n x 4
//                                      values (metres right of the path, metres above it, density 0..1, braid radius), one
//                                      row every gust.ribStep (4 m) of path distance from 0. They are always there (not
//                                      packets), so the world can run one through a birch trunk or over a boulder and the
//                                      picture holds at any moment; an obstacle given with rib: true keeps its place among
//                                      the capsules whatever else is near. setRibbonAmount(0..1) thins both.
//                                      The gust mesh is a child of hero.object but cancels its transform,
//                                      so add only hero.object to the scene and never scale it.
//              hero.stripClock() / stripAmount() / treeS()   read-backs for camera POIs and sound.
//              Until setProgress/setStrip is called the piece runs a 16 s demo loop on wall time
//              (heave, strip, bare, regrow) with the gust blowing past a still camera at 24 m/s.
//
// OPTS         palette   7 hex strings in brief order [crimson, orange, gold, schist, slate, cream, hemlock]
//              season    'peak' (default) | 'early' (a third of the crown still green-gold) | 'late'
//                        (40 % of the crown already gone, more leaves in the gust)
//              weather   'slate' (default) | 'golden' (hotter back-light) | 'squall' (graupel pellets
//                        streak through the gust) | 'dawn' (rime-pale undersides, calmer flutter)
//              hour      alias kept for the brief's variations: 'golden' or 'dawn' set weather
//              gustLeaves 56000, mapleLeaves 34000 (scaled by ctx.quality.detail, the tree less so)
//              ribbonLeaves 0: leaves of the two ribbons (78 % in the first, 22 % in the second), on top of gustLeaves
//              base      false leaves out the schist outcrop (roots stay)
//              stripLead 50 (m), lead 25, ahead 0.3, path (same as setPath)
//
// ANCHORS (local space, THREE.Vector3 unless noted)
//   trunkBase, crownCentre, crownTop      the tree
//   windDir                               (1,0,0)
//   lipX, waterY, poolY                   numbers: brink plane, stream level at the lip, pool level
//   pass                                  closest camera point (0, 8, 16)
//   flyThrough                            ordered safe camera line (>= 6.5 m from every limb and leaf at
//                                         rest): 420 m of straight run at z = 16, the rise over the lip,
//                                         20 m of open air, the 52 m nose-over and the 60 m dive
//   viewpoints { farReveal, stripStart, bare, openAir }   where the brief's key frames are taken
//   fallFoot                              foot of the horsetail, on the path axis
//   spiralEye                             eye of the leaf spiral on the pool
//   portalSeat { position, facing }       centre of the 14 m ring, 5 m above the eye; facing looks back
//                                         up the 50 degree dive (portal tilt: true)
//   obstacles                             [{x,z,r,y0,y1}] the maple's trunk and crown as local capsules
//
// LIGHTING     Custom ShaderMaterials with lights: true: they take the scene's FIRST DirectionalLight
//              as the sun, the first HemisphereLight plus AmbientLight as fill, and scene fog. Wants a
//              warm low sun from +Z (#FFE9C4, intensity ~3) against a dark slate sky, cool slate fill
//              (hemisphere ~0.6-1). Leaves are translucent: seen against the sun they go to ember
//              (HDR ~1.5-2.5, gentle bloom). Nothing else is emissive.
// STYLE        no special art style: naturalistic, linear HDR.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PALETTE = ['#C8281C', '#E8742A', '#F0B428', '#23262B', '#55606C', '#E9E4D6', '#1F3A2E'];
const LEAN = 12 * Math.PI / 180, LIP_X = 11, WATER_Y = -1.5, POOL_Y = -61.5, PASS_Z = 16, PASS_Y = 8;
const N_PATH = 48, PATH_DS = 4, N_OBS = 14, N_STREAM = 9, WIN_BACK = 40, WIN_LEN = 180;

// ---------- shared GLSL ----------
// scene lights (fragment). Directions are in view space.
const GLSL_LIGHT = /* glsl */`
  #include <common>
  #include <lights_pars_begin>
  uniform float uSunGain;
  uniform vec4 uPatch;                 // world x, z of the travelling break of sun, its radius, sun gain outside it
  varying vec2 vPW;                    // world xz of this fragment
  uniform vec3 uPatch2;                // a second break of sun that rests on the tree: world x, z, radius
  float mgPatch(){
    float a = 1.0 - smoothstep(uPatch.z - 32.0, uPatch.z + 32.0, distance(vPW, uPatch.xy));
    float b = 1.0 - smoothstep(uPatch2.z*0.55, uPatch2.z*1.5, distance(vPW, uPatch2.xy));
    return mix(uPatch.w, 1.0, max(a, b));
  }
  vec3 mgSunDir(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].direction;
    #else
      return vec3(0.0, 1.0, 0.0);
    #endif
  }
  vec3 mgSunCol(){
    #if NUM_DIR_LIGHTS > 0
      return directionalLights[0].color * (uSunGain * mgPatch());
    #else
      return vec3(0.0);
    #endif
  }
  vec3 mgAmb(vec3 n){
    vec3 irr = ambientLightColor;
    #if NUM_HEMI_LIGHTS > 0
      irr += getHemisphereLightIrradiance(hemisphereLights[0], n);
    #endif
    return irr;
  }
  float mgHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx+33.33); return fract((p.x+p.y)*p.y); }
  float mgNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mgHash(i), mgHash(i+vec2(1.,0.)), f.x), mix(mgHash(i+vec2(0.,1.)), mgHash(i+vec2(1.,1.)), f.x), f.y); }
`;

// limb sway, shared by the wood and by the leaves that hang on it (vertex).
// b = (flex metres, phase, release order 0 windward .. 1 leeward, tipness 0..1)
const GLSL_BEND = /* glsl */`
  uniform float uTime, uClock, uStripDur, uCalm;
  vec3 mgBend(vec3 p, vec4 b){
    float tau = uClock - b.z*uStripDur;                 // seconds since this branch let go
    float tp = max(tau, 0.0);
    float bare = smoothstep(0.0, 0.35, tau);
    float heave = smoothstep(-2.8, -0.15, tau);         // the front arriving, windward side first
    float gs = sin(uTime*0.9 + p.x*0.07 + b.y)*0.5 + 0.5;
    float gf = sin(uTime*2.3 - p.x*0.19 + b.y*1.7);
    float load = mix(0.30 + 0.22*gs + 0.06*gf, 1.05 + 0.22*gf, heave) * uCalm;
    float ring = exp(-1.4*tp)*cos(8.5*tp + b.y);        // unloaded limb springs back and rings
    load = mix(load, 0.42 + 0.14*gf + 0.55*ring, bare);
    float whip = b.w*(0.07 + 0.10*heave + 0.34*bare*(0.4 + 0.6*exp(-0.35*tp)));
    vec3 d = vec3(b.x*load, 0.0, 0.0);
    d.y = -b.x*load*0.38*(1.0 - bare) + b.x*0.30*bare*(1.0 + 0.6*ring);
    d += b.x*whip*vec3(sin(uTime*7.3 + b.y*5.0), 0.7*sin(uTime*9.1 + b.y*3.0), 0.9*cos(uTime*6.1 + b.y*7.0));
    return p + d;
  }
`;

// five-lobed maple leaf in q space: stem foot at (0,-1), tip at (0,1). Returns signed "inside" distance.
const GLSL_LEAF = /* glsl */`
  float mgLobe(float a, float a0, float w, float L){ float d = abs(a - a0)/w; return L*(1.0 - d)*(1.0 + 0.10*cos(d*15.7)); }
  float mgLeaf(vec2 q){
    float x = abs(q.x), y = q.y + 0.22;
    float r = length(vec2(x, y)) + 1e-5;
    float a = acos(clamp(y/r, -1.0, 1.0));
    float R = max(max(mgLobe(a, 0.0, 0.52, 1.20), mgLobe(a, 0.98, 0.50, 1.02)), max(mgLobe(a, 1.92, 0.46, 0.66), 0.36 - 0.10*smoothstep(2.2, 3.1, a)));
    float blade = R - r;
    float stem = min(0.05 - x, min(q.y + 0.98, -0.2 - q.y));
    return max(blade, stem*2.0);
  }
`;

// leaf shading shared by the crown and the gust (fragment). n = leaf normal (view space) facing the
// viewer, nl = normal used for lighting, col = pigment, pale = underside colour.
const GLSL_LEAFSHADE = /* glsl */`
  uniform float uEmber, uLeafAmb;
  vec3 mgLeafShade(vec3 col, vec3 pale, vec3 nGeo, vec3 nl, vec3 viewDir, float ao, float under){
    vec3 L = mgSunDir(), S = mgSunCol();
    vec3 n = nGeo * (dot(nGeo, viewDir) < 0.0 ? -1.0 : 1.0);     // the side we see
    float lit = max(max(dot(nl, L), dot(n, L)), 0.0);            // the seen side faces the sun: lit, whatever the blended normal says
    float back = max(-dot(n, L), 0.0);                           // sun is behind the blade: it glows through
    vec3 surf = mix(col, pale, under);
    vec3 thru = col*col*3.2 + col*0.35;                          // saturated ember
    vec3 amb = mix(mgAmb(n), mgAmb(-n), 0.4)*uLeafAmb;           // a blade takes the sky on both faces
    vec3 c = surf*RECIPROCAL_PI*(S*lit*1.15 + amb*ao);
    c += thru*RECIPROCAL_PI*(S*back*uEmber + amb*0.3)*(0.55 + 0.45*ao);
    float sp = pow(max(dot(n, normalize(L + viewDir)), 0.0), 24.0);
    c += S*sp*0.05*(1.0 - under);                                // waxy top
    return max(c, (col + thru*0.25)*(0.045*uLeafAmb));           // no leaf is darker than deep wine
  }
`;

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const lightU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);

// ---------- the schist outcrop the tree grips ----------
function makeBaseHeight(noise, seedOff) {
  // plateau round the trunk, stepped along strata dipping 30 degrees, a cliff toward the brink (+X),
  // a slope to the water (+Z) and a rough fall-away everywhere else
  return (x, z) => {
    const n1 = noise.fbm2(x * 0.09 + seedOff, z * 0.09 - seedOff, 3), n2 = noise.n2(x * 0.45 + 7, z * 0.45 + 3);
    const ang = Math.atan2(z + 1.5, x), facet = 1 + 0.16 * Math.cos(ang * 3 + seedOff) + 0.09 * Math.cos(ang * 5 - seedOff * 2);
    const rr = Math.hypot(x / (11.5 + 2.2 * n1), (z + 1.5) / (9.5 + 1.8 * n1)) / facet;
    let h = 0.55 * n1 + 0.10 * n2 - 0.25 * Math.max(0, rr - 0.25);
    const raw = h + x * 0.085 + z * 0.03;                    // strata planes cut the top into ledges
    const st = Math.floor(raw / 0.7) * 0.7 + 0.7 * smoothstep(0.78, 1.0, raw / 0.7 - Math.floor(raw / 0.7));
    h = lerp(h, st - x * 0.085 - z * 0.03, 0.8);
    h -= 1.7 * smoothstep(3.0, 8.5, z);                      // down to the stream
    h -= 6.5 * smoothstep(0.78, 1.12, rr) * (0.8 + 0.3 * n2);   // the edge
    h -= 7.0 * smoothstep(LIP_X - 3.4 + 1.2 * n1, LIP_X - 0.6, x);   // the brink side
    h += 0.5 * Math.exp(-(x * x + z * z) / 3.2);             // root mound
    return Math.max(h, -6.5);
  };
}

function buildBaseGeometry(baseH, rng) {
  const RINGS = 20, SEGS = 56, pos = [], idx = [];
  const tw = rng.range(0, 6.28);
  pos.push(0, baseH(0, 0), 0);
  for (let i = 1; i <= RINGS; i++) {
    const f = i / RINGS, r = 15.5 * Math.pow(f, 1.25);
    for (let j = 0; j < SEGS; j++) {
      const a = (j + (i % 2) * 0.5) / SEGS * Math.PI * 2 + tw;
      const x = Math.cos(a) * r * 1.0, z = Math.sin(a) * r * 0.9 - 1.0;
      pos.push(x, i === RINGS ? -6.6 : baseH(x, z), z);
    }
  }
  for (let j = 0; j < SEGS; j++) idx.push(0, 1 + (j + 1) % SEGS, 1 + j);
  for (let i = 1; i < RINGS; i++) {
    const a0 = 1 + (i - 1) * SEGS, b0 = a0 + SEGS, sh = i % 2;      // ring i is offset half a step when odd
    for (let j = 0; j < SEGS; j++) {
      const j1 = (j + 1) % SEGS;
      if (sh) idx.push(a0 + j, a0 + j1, b0 + j1, a0 + j, b0 + j1, b0 + j);
      else idx.push(a0 + j, a0 + j1, b0 + j, a0 + j1, b0 + j1, b0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- the maple's skeleton ----------
// returns branches: { pts[], rad[], flex[], tip[], depth, phase, rel, parent }
async function growMaple(ctx, rng, baseH) {
  const B = [];
  const NSEG = [13, 8, 6, 4, 3], WANDER = [0.035, 0.13, 0.2, 0.26, 0.3], KFLEX = [0, 0.032, 0.07, 0.115, 0.17];
  const TIP = [0.0, 0.18, 0.45, 0.75, 1.0], KIDS = [10, 5, 4, 3, 0];
  const tmpU = V3(), tmpV = V3();
  async function grow(start, dir, len, r0, depth, flex0, parent, group) {
    const n = NSEG[depth], pts = [start.clone()], rad = [r0], flex = [flex0], tip = [depth === 0 ? 0 : TIP[depth - 1]];
    const d = dir.clone().normalize(), p = start.clone();
    const r1 = depth === 0 ? r0 * 0.42 : Math.max(0.028, r0 * 0.36);
    const lift = [0, 0.07, 0.02, -0.02, -0.05][depth];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      d.x += rng.gauss() * WANDER[depth] + (depth > 0 ? 0.035 : 0);     // windswept: everything trends leeward
      d.y += rng.gauss() * WANDER[depth] * 0.6 + lift * (depth === 1 ? (1.6 - t) : 1);
      d.z += rng.gauss() * WANDER[depth];
      d.normalize();
      p.addScaledVector(d, len / n);
      pts.push(p.clone());
      rad.push(lerp(r0, r1, Math.pow(t, 0.85)));
      flex.push(depth === 0 ? 0.42 * Math.pow(clamp((p.y + 1.2) / 20, 0, 1), 2) : flex0 + KFLEX[depth] * len * t);
      tip.push(depth === 0 ? 0.03 * t : lerp(TIP[depth - 1], TIP[depth], t));
    }
    const b = { pts, rad, flex, tip, depth, phase: rng.range(0, 6.28), rel: 0.5, parent, group: group ?? null, dirEnd: d.clone() };
    B.push(b);
    if (depth === 2 && b.group == null) b.group = b;
    const kids = KIDS[depth]; if (!kids) return b;
    const az0 = rng.range(0, 6.28);
    for (let k = 0; k < kids; k++) {
      const last = k === kids - 1;
      // where along the parent
      let t = depth === 0 ? lerp(0.3, 1.0, Math.pow(k / (kids - 1), 0.9)) : lerp(0.32, 1.0, (k + rng.range(0.1, 0.9)) / kids);
      if (last) t = 1;
      const f = t * n, i0 = Math.min(n - 1, Math.floor(f)), ft = f - i0;
      const at = pts[i0].clone().lerp(pts[i0 + 1], ft);
      const pd = pts[i0 + 1].clone().sub(pts[i0]).normalize();
      tmpU.set(0.31, 0.2, 0.93).cross(pd); if (tmpU.lengthSq() < 1e-4) tmpU.set(1, 0, 0); tmpU.normalize(); tmpV.crossVectors(pd, tmpU);
      const az = az0 + k * 2.39996 + rng.range(-0.35, 0.35);
      let ang = depth === 0 ? lerp(1.22, 0.7, t) * rng.range(0.9, 1.1) * (last ? 0.3 : 1) : (last ? rng.range(0.1, 0.35) : rng.range(0.55, 1.0));
      const cd = pd.clone().multiplyScalar(Math.cos(ang)).addScaledVector(tmpU, Math.cos(az) * Math.sin(ang)).addScaledVector(tmpV, Math.sin(az) * Math.sin(ang));
      if (depth >= 1) { cd.y += depth === 1 ? 0.22 : 0.08; cd.x += 0.08; }
      let clen;
      if (depth === 0) clen = lerp(14.5, 9.0, t) * rng.range(0.9, 1.1);
      else clen = len * [0, 0.56, 0.55, 0.56][depth] * (1.15 - 0.4 * t) * rng.range(0.8, 1.2);
      clen = Math.max(clen, [0, 3.2, 1.6, 0.8][depth]);
      const pr = lerp(rad[i0], rad[i0 + 1], ft);
      const cr = Math.max(0.03, pr * (depth === 0 ? rng.range(0.5, 0.64) : rng.range(0.55, 0.7)) * (last ? 1.1 : 1));
      const cf = lerp(flex[i0], flex[i0 + 1], ft);
      await grow(at, cd, clen, cr, depth + 1, cf, b, depth + 1 > 2 ? b.group : null);
      if (depth === 0) await ctx.yield();                              // a breath after every bough
    }
    return b;
  }
  const trunk = await grow(V3(0, -1.2, 0), V3(0.02, 1, rng.range(-0.04, 0.02)), 19.5 * rng.range(0.96, 1.04), 0.6, 0, 0, null, null);

  // scale to 28 m, lean 12 degrees downwind, keep the stream side (+Z) clear of the camera line
  let top = 0; for (const b of B) for (const p of b.pts) top = Math.max(top, p.y);
  const sc = 28.6 / Math.max(top, 1), cl = Math.cos(LEAN), sl = Math.sin(LEAN);
  for (const b of B) for (const p of b.pts) {
    if (p.y > 0) { p.y *= sc; const k = 1 + (sc - 1) * clamp(p.y / 6, 0, 1); p.x *= k; p.z *= k; }
    const x = p.x * cl + p.y * sl, y = -p.x * sl + p.y * cl; p.x = x; p.y = y;
    if (p.z > 4) p.z = 4 + 4.7 * Math.tanh((p.z - 4) / 4.7);
    if (p.z < -11) p.z = -11 + 3 * Math.tanh((p.z + 11) / 3);
    if (p.y < 6 && b.depth > 0) p.y = 6 - 2.0 * Math.tanh((6 - p.y) / 2.0) + 0.0;     // no limb sweeps the ledge
  }
  // release order: branch by branch, windward (-X) to leeward (+X)
  let x0 = 1e9, x1 = -1e9;
  const mid = (b) => b.pts[Math.floor(b.pts.length * 0.6)].x;
  for (const b of B) if (b.depth >= 1) { x0 = Math.min(x0, mid(b)); x1 = Math.max(x1, mid(b)); }
  const jit = new Map();
  for (const b of B) {
    const g = b.depth >= 2 ? b.group : b;
    if (!jit.has(g)) jit.set(g, rng.range(-0.07, 0.07));
    b.rel = clamp((mid(g) - x0) / Math.max(x1 - x0, 1) * 0.86 + 0.07 + jit.get(g), 0, 1);
    if (b.depth === 0) b.rel = 0.5;
  }
  // surface roots gripping the rock
  const nRoots = rng.int(6, 8), ra0 = rng.range(0, 6.28);
  for (let k = 0; k < nRoots; k++) {
    let a = ra0 + k / nRoots * 6.283 + rng.range(-0.25, 0.25);
    const len = rng.range(3.0, 6.0), n = 9, pts = [], rad = [], r0 = rng.range(0.2, 0.3);
    let x = Math.cos(a) * 0.35 + 0.1, z = Math.sin(a) * 0.35;
    for (let i = 0; i <= n; i++) {
      const t = i / n, r = lerp(r0, 0.045, Math.pow(t, 0.7));
      const gy = baseH(x, z);
      pts.push(V3(x, i === 0 ? 0.75 : Math.max(gy + r * (0.55 - 0.5 * t), -6.2), z)); rad.push(r);
      a += rng.gauss() * 0.22; x += Math.cos(a) * len / n; z += Math.sin(a) * len / n;
    }
    B.push({ pts, rad, flex: pts.map(() => 0), tip: pts.map(() => 0), depth: 5, phase: 0, rel: 0.5, parent: trunk, group: null, root: true });
  }
  return B;
}

// ---------- limbs: tapered tubes with flare, per-vertex bend data ----------
async function buildLimbGeometry(ctx, B, rng, barkA, barkB) {
  const SIDES = [12, 7, 5, 4, 3, 6];
  let nv = 0, ni = 0;
  for (const b of B) { const s = SIDES[b.depth], n = b.pts.length; nv += (s + 1) * n; ni += s * (n - 1) * 6; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const bend = new Float32Array(nv * 4), rad = new Float32Array(nv), idx = new Uint32Array(ni);
  let v = 0, ii = 0;
  const T = V3(), N = V3(), Bn = V3(), prevT = V3(), q = new THREE.Quaternion(), tmp = V3(), c = new THREE.Color();
  const lobes = rng.int(5, 7), lobePh = rng.range(0, 6.28);
  for (let bi = 0; bi < B.length; bi++) {
    if ((bi & 63) === 0) await ctx.yield();                        // a breath every 64 limbs
    const b = B[bi], s = SIDES[b.depth], n = b.pts.length, base = v;
    const tone = rng.range(0.75, 1.2);
    let along = rng.range(0, 10);
    for (let i = 0; i < n; i++) {
      const p = b.pts[i];
      if (i < n - 1) T.subVectors(b.pts[i + 1], p); else T.subVectors(p, b.pts[i - 1]);
      if (i > 0 && i < n - 1) T.add(tmp.subVectors(p, b.pts[i - 1]));
      T.normalize();
      if (i === 0) { N.set(0.2, 0.1, 1).cross(T); if (N.lengthSq() < 1e-4) N.set(1, 0, 0).cross(T); N.normalize(); }
      else { q.setFromUnitVectors(prevT, T); N.applyQuaternion(q); N.addScaledVector(T, -N.dot(T)).normalize(); }
      Bn.crossVectors(T, N); prevT.copy(T);
      if (i > 0) along += p.distanceTo(b.pts[i - 1]);
      const r = b.rad[i];
      for (let j = 0; j <= s; j++) {
        const a = j / s * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        let rr = r;
        if (b.depth === 0) {                                       // root flare with buttress lobes, knots higher up
          const fl = Math.exp(-Math.max(p.y, -0.4) / 1.25);
          rr *= 1 + fl * (0.75 + 0.5 * Math.cos(lobes * a + lobePh)) + 0.07 * Math.sin(a * 3 + p.y * 1.7) + 0.05 * Math.sin(a * 5 - p.y * 0.9);
        } else if (b.depth === 1 || b.root) rr *= 1 + 0.10 * Math.sin(a * 2 + along * 1.3) + (i === 0 ? 0.35 : 0);   // collar at the union
        const k = v * 3;
        nor[k] = N.x * ca + Bn.x * sa; nor[k + 1] = N.y * ca + Bn.y * sa; nor[k + 2] = N.z * ca + Bn.z * sa;
        pos[k] = p.x + nor[k] * rr; pos[k + 1] = p.y + nor[k + 1] * rr; pos[k + 2] = p.z + nor[k + 2] * rr;
        const shade = tone * (b.root ? 0.9 : 1) * (0.85 + 0.3 * rng()) * (b.depth >= 3 && !b.root ? 0.8 : 1);
        c.copy(barkA).lerp(barkB, clamp(0.5 + 0.5 * Math.sin(along * 0.7 + a * 2), 0, 1)).multiplyScalar(shade);
        col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
        uv[v * 2] = j / s * Math.max(1, Math.round(r * 14)); uv[v * 2 + 1] = along;
        bend[v * 4] = b.flex[i]; bend[v * 4 + 1] = b.phase; bend[v * 4 + 2] = b.rel; bend[v * 4 + 3] = b.tip[i];
        rad[v] = rr; v++;
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < s; j++) {
      const a0 = base + i * (s + 1) + j, a1 = a0 + 1, b0 = a0 + s + 1, b1 = b0 + 1;
      idx[ii++] = a0; idx[ii++] = b0; idx[ii++] = a1; idx[ii++] = a1; idx[ii++] = b0; idx[ii++] = b1;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aBend', new THREE.BufferAttribute(bend, 4)); g.setAttribute('aR', new THREE.BufferAttribute(rad, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

function woodMaterial(U, moss) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), uTime: U.uTime, uClock: U.uClock, uStripDur: U.uStripDur, uCalm: U.uCalm, uPx: U.uPx, uSunGain: U.uSunGain, uPatch: U.uPatch, uPatch2: U.uPatch2, uGrow: U.uGrow, uMoss: { value: moss } },
    vertexShader: /* glsl */`
      attribute vec4 aBend; attribute vec3 aCol; attribute float aR;
      uniform float uPx, uGrow;
      varying vec3 vN, vNw, vV, vCol, vOP; varying vec2 vUv; varying float vShade; varying vec2 vPW;
      #include <fog_pars_vertex>
      ${GLSL_BEND}
      void main(){
        vec3 p = mgBend(position, aBend);
        vPW = (modelMatrix*vec4(p, 1.0)).xz;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
        vec3 nv = normalize(normalMatrix*normal);
        mvPosition.xyz += nv*max(0.75*uPx*length(mvPosition.xyz) - aR, 0.0);     // twigs never thinner than 1.5 px
        float bare = smoothstep(0.0, 0.5, uClock - aBend.z*uStripDur);
        vShade = mix(1.0, mix(0.5, 1.0, max(bare, 1.0 - uGrow)), smoothstep(0.1, 0.5, aBend.w));   // twigs sit in leaf shade until stripped
        vN = nv; vNw = normalize(mat3(modelMatrix)*normal); vV = mvPosition.xyz; vCol = aCol; vOP = position; vUv = uv;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMoss;
      varying vec3 vN, vNw, vV, vCol, vOP; varying vec2 vUv; varying float vShade;
      ${GLSL_LIGHT}
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), view = normalize(-vV);
        // bark: long furrows that wander, plates across them
        float fu = mgNoise(vec2(vUv.x*5.0 + 0.6*mgNoise(vec2(vUv.x*2.0, vUv.y*0.8)), vUv.y*0.55));
        float pl = mgNoise(vec2(vUv.x*2.0, vUv.y*3.2));
        float ridge = smoothstep(0.25, 0.75, fu);
        vec3 alb = vCol*(0.45 + 0.85*ridge)*(0.8 + 0.4*pl);
        float up = clamp(vNw.y, 0.0, 1.0);
        float m = smoothstep(0.35, 0.8, up*0.8 + 0.5*mgNoise(vOP.xz*1.3 + vOP.y*0.7))*(1.0 - smoothstep(4.0, 15.0, vOP.y));
        m = max(m, 0.7*(1.0 - smoothstep(0.2, 2.2, vOP.y))*smoothstep(0.3, 0.6, mgNoise(vOP.xy*2.0 + vOP.z)));
        alb = mix(alb, uMoss*(0.7 + 0.6*pl), m*0.85);
        n = normalize(n + (ridge - 0.5)*0.35*normalize(cross(n, vec3(0.31, 0.53, 0.79)) + 1e-4));
        vec3 L = mgSunDir(), S = mgSunCol();
        float ndl = max(dot(n, L), 0.0);
        vec3 c = alb*RECIPROCAL_PI*(S*ndl*vShade + mgAmb(n)*(0.55 + 0.45*vShade));
        float fr = 1.0 - max(dot(n, view), 0.0); fr *= fr; fr *= fr;
        c += mgAmb(reflect(-view, n))*RECIPROCAL_PI*fr*0.35*(1.0 - m);                        // wet bark takes the sky
        c += S*pow(max(dot(n, normalize(L + view)), 0.0), 18.0)*0.035*ridge*vShade;
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

function rockMaterial(U, pal) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true,
    uniforms: { ...lightU(), ...fogU(), uSunGain: U.uSunGain, uPatch: U.uPatch, uPatch2: U.uPatch2, uRock: { value: pal.rock }, uMoss: { value: pal.moss }, uRamp: { value: pal.ramp }, uLitter: U.uLitter },
    vertexShader: /* glsl */`
      varying vec3 vN, vNw, vV, vOP; varying vec2 vPW;
      #include <fog_pars_vertex>
      void main(){
        vPW = (modelMatrix*vec4(position, 1.0)).xz;
        vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
        vN = normalMatrix*normal; vNw = mat3(modelMatrix)*normal; vV = mvPosition.xyz; vOP = position;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRock, uMoss, uRamp[5]; uniform float uLitter;
      varying vec3 vN, vNw, vV, vOP;
      ${GLSL_LIGHT}
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), nw = normalize(vNw), view = normalize(-vV);
        // thin schist beds dipping 30 degrees
        float s = dot(vOP, vec3(-0.49, 0.85, -0.17));
        float warp = mgNoise(vOP.xz*0.35)*0.5 + mgNoise(vOP.xz*1.7 + vOP.y)*0.12;
        float bed = mgNoise(vec2((s + warp)*5.0, 0.5))*0.55 + mgNoise(vec2((s + warp)*17.0, 3.5))*0.45, fine = mgNoise(vec2((s + warp)*46.0, vOP.x*0.4 + vOP.z*0.3));
        float bl = mgNoise(vOP.xz*0.6 + vOP.y*0.9);
        vec3 alb = uRock*(0.6 + 0.8*bed)*(0.7 + 0.6*fine)*(0.75 + 0.6*bl);
        alb = mix(alb, alb*vec3(1.25, 1.0, 0.78) + 0.012, smoothstep(0.62, 0.9, mgNoise(vOP.xz*0.23 + 9.0))*0.6);   // rusty weathering
        float up = clamp(nw.y, 0.0, 1.0);
        float mn = mgNoise(vOP.xz*0.8 + 3.0)*0.6 + mgNoise(vOP.xz*3.1)*0.4;
        float moss = smoothstep(0.5, 0.72, mn)*smoothstep(0.55, 0.9, up)*0.85;
        alb = mix(alb, uMoss*(0.6 + 0.9*mgNoise(vOP.xz*6.0)), moss*0.9);
        // fallen leaves: drifts in the lee and in the steps
        vec2 lc = vOP.xz*4.3; vec2 ci = floor(lc), cf = fract(lc) - 0.5;
        float h1 = mgHash(ci), h2 = mgHash(ci + 17.3);
        float drift = smoothstep(0.35, 0.8, mgNoise(vOP.xz*0.42 + 5.0)*0.7 + 0.3*smoothstep(-2.0, 7.0, vOP.x))*smoothstep(0.6, 0.9, up);
        float fleck = step(length(cf + (vec2(h1, h2) - 0.5)*0.5), 0.2 + 0.2*h2)*step(1.0 - drift*uLitter, h1*0.999);
        int li = int(min(h2*4.2, 4.0));
        vec3 lcol = uRamp[li]*(0.55 + 0.6*h1);
        alb = mix(alb, lcol, fleck);
        n = normalize(n + (bed - 0.5)*0.5*(mat3(viewMatrix)*vec3(-0.49, 0.85, -0.17))*(1.0 - moss));
        vec3 L = mgSunDir(), S = mgSunCol();
        float ndl = max(dot(n, L), 0.0);
        float ao = 0.55 + 0.45*smoothstep(-5.0, 0.5, vOP.y);
        vec3 c = alb*RECIPROCAL_PI*(S*ndl + mgAmb(n)*ao);
        float fr = 1.0 - max(dot(n, view), 0.0); fr = fr*fr*fr;
        float wet = (1.0 - moss)*(1.0 - fleck);
        c += mgAmb(reflect(-view, n))*RECIPROCAL_PI*(0.02 + 0.3*fr)*wet*ao;                    // cold sky sheen on wet rock
        c += S*pow(max(dot(n, normalize(L + view)), 0.0), 40.0)*0.10*wet*bed;
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- leaves ----------
// one triangle per leaf; the five-lobed outline is cut in the fragment shader (no atlas, no mips to manage)
function leafTriangle() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1.62, -1.02, 0, 1.62, -1.02, 0, 0, 2.22, 0], 3));
  return g;
}

export { GLSL_LEAF };

const LEAF_FRAG = /* glsl */`
  uniform vec3 uPale;
  varying vec2 vQ; varying vec3 vCol, vNg, vNl, vV; varying vec3 vAux;     // vAux = (ao, underside flash, kind); vPW comes with GLSL_LIGHT
  ${GLSL_LIGHT}
  ${GLSL_LEAF}
  ${GLSL_LEAFSHADE}
  #include <fog_pars_fragment>
  void main(){
    float d = mgLeaf(vQ);
    float fw = fwidth(d);
    float blob = 0.82 - length(vQ - vec2(0.0, 0.05));
    d = mix(d, blob, smoothstep(0.22, 0.6, fw));                 // far away the lobes melt into a disc: no sparkle
    if (vAux.z > 0.5) d = 0.5 - length(vQ*vec2(1.0, 0.45) - vec2(0.0, 0.1));   // graupel streak
    if (d < 0.0) discard;
    vec3 view = normalize(-vV);
    vec3 ng = normalize(vNg), nl = normalize(vNl);
    float top = dot(ng, view) > 0.0 ? 1.0 : 0.0;
    float under = max((1.0 - top)*0.85, vAux.y);
    float near = 1.0 - smoothstep(0.02, 0.10, fw);
    float ax = abs(vQ.x), yy = vQ.y + 0.22;
    float vein = max(smoothstep(0.045, 0.0, ax), smoothstep(0.04, 0.0, abs(ax*0.62 - yy*0.78)*step(0.0, yy)));
    vec3 col = vCol*(0.86 + 0.28*mgNoise(vQ*2.3 + vCol.rg*40.0))*(1.0 + 0.35*vein*near);
    col *= 0.75 + 0.25*smoothstep(0.0, 0.25, d + (1.0 - near));   // darker crisped margin
    ng = normalize(ng + cross(ng, vec3(0.37, 0.61, 0.70))*sign(vQ.x)*0.22*near);   // folded along the midrib
    vec3 c = mgLeafShade(col, mix(col, uPale, 0.45), ng, mix(nl, ng, 0.35), view, vAux.x, under);
    if (vAux.z > 0.5) c = uPale*RECIPROCAL_PI*(mgSunCol()*0.7 + mgAmb(view)*1.6);
    gl_FragColor = vec4(c, 1.0);
    #include <fog_fragment>
  }`;

function crownLeafMaterial(U, pal) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    uniforms: { ...lightU(), ...fogU(), uTime: U.uTime, uClock: U.uClock, uStripDur: U.uStripDur, uCalm: U.uCalm, uPx: U.uPx, uSunGain: U.uSunGain, uPatch: U.uPatch, uPatch2: U.uPatch2,
      uGrow: U.uGrow, uEmber: U.uEmber, uLeafAmb: U.uLeafAmb, uPale: { value: pal.pale }, uLip: { value: LIP_X }, uPoolY: { value: POOL_Y }, uGather: { value: new THREE.Vector4(-13, 18, -1.5, 12) }, uTube: U.uTube },
    vertexShader: /* glsl */`
      attribute vec4 iPos, iBend, iRnd; attribute vec3 iOut, iCol;
      uniform float uPx, uGrow, uLip, uPoolY, uTube; uniform vec4 uGather;
      varying vec2 vQ; varying vec3 vCol, vNg, vNl, vV; varying vec3 vAux; varying vec2 vPW;
      #include <fog_pars_vertex>
      ${GLSL_BEND}
      void main(){
        float seed = iRnd.y, h2 = fract(seed*13.7), h3 = fract(seed*29.3), h4 = fract(seed*53.9);
        float tau = uClock - (iBend.z + iRnd.x)*uStripDur, tp = max(tau, 0.0);
        float fly = step(0.0, tau);
        float heave = smoothstep(-2.8, -0.15, tau)*(1.0 - fly);
        vec3 P = mgBend(iPos.xyz, iBend);
        // torn off: accelerated to wind speed against drag, thrown up, gathered into the stream by the camera line
        float W = 13.0 + 22.0*seed, k = 1.6 + 2.6*h2;
        P.x += W*(tp - (1.0 - exp(-k*tp))/k);
        P.y += (h2*6.0 - 1.5)*(1.0 - exp(-1.6*tp))/1.6 - 0.5*tp*h3;
        float g = 0.6*(1.0 - exp(-0.4*tp));
        P.z = mix(P.z, uGather.x + uGather.y*h3, g);
        P.y = mix(P.y, uGather.z + uGather.w*h4, g*0.7);
        P.yz += (vec2(h4, fract(seed*91.7)) - 0.5)*5.0*sqrt(tp);                 // the plume frays as it goes
        float tu = min(tp*1.5, 1.0);
        P += tu*vec3(0.0, 0.55*sin(tp*3.1 + seed*40.0), 0.7*cos(tp*2.3 + seed*60.0));
        // past the lip the gust has nothing to push against: they hang, then rain down
        float over = max(P.x - uLip, 0.0), D = 18.0 + 62.0*h4*h4;
        P.x = min(P.x, uLip) + D*(1.0 - exp(-over/D));
        float tl = over/W, vt = 3.2 + 3.4*h3;
        P.y -= vt*(tl - (1.0 - exp(-0.7*tl))/0.7);
        P.z += sin(tl*2.1 + seed*50.0)*0.9*min(tl, 1.0);
        // the flight line stays open: a soft tube round the camera path from the pass, over the lip and down the dive
        { float tk = uTube*fly*smoothstep(uLip - 30.0, uLip - 6.0, P.x);
          float qx = P.x - (uLip + 20.0);
          float py = qx < 0.0 ? ${PASS_Y.toFixed(1)} : (qx < 39.83 ? -44.0 + sqrt(max(2704.0 - qx*qx, 1.0)) : -10.575 - 1.1918*(qx - 39.83));
          float cy = mix(1.0, 0.643, clamp(qx/39.83, 0.0, 1.0));
          vec2 off = vec2(P.z - ${PASS_Z.toFixed(1)}, (P.y - py)*cy);
          float dd = max(length(off), 1e-2), kk = sqrt(1.0 + tk*tk/(dd*dd));
          P.z = ${PASS_Z.toFixed(1)} + off.x*kk; P.y = py + off.y*kk/cy; }
        float sc = mix(smoothstep(seed*0.7, seed*0.7 + 0.3, uGrow), 1.0, fly)*smoothstep(uPoolY, uPoolY + 2.5, P.y)*mix(1.0, 0.7, smoothstep(0.3, 3.0, tp));
        // orientation: hanging and fluttering on the twig, or tumbling free
        vec3 rv = vec3(h2, h3, h4) - 0.5;
        vec3 e2 = normalize(iOut*0.55 + vec3(0.25 + 1.3*heave, -0.7 + 0.5*heave, 0.0) + rv*0.9);
        vec3 e1 = normalize(cross(e2, vec3(0.31, 0.89, 0.33) + rv) + vec3(1e-4, 0.0, 0.0));
        vec3 nA = cross(e1, e2);
        float fl = (0.3 + 1.2*heave)*sin(uTime*(5.0 + 6.0*h2) + seed*90.0)*uCalm;
        vec3 e1a = e1*cos(fl) + nA*sin(fl);
        float a1 = seed*40.0 + tp*(5.0 + 9.0*h2), a2 = seed*23.0 + tp*(1.0 + 2.0*h3);
        vec3 f1 = vec3(cos(a2), 0.0, sin(a2)), f2 = cos(a1)*vec3(0.0, 1.0, 0.0) + sin(a1)*vec3(-sin(a2), 0.0, cos(a2));
        e1 = mix(e1a, f1, fly); e2 = mix(e2, f2, fly);
        vec3 ng = cross(e1, e2);
        vec4 mvc = modelViewMatrix*vec4(P, 1.0);
        float dist = length(mvc.xyz);
        float size = max(iPos.w, 1.3*uPx*dist)*sc*step(1e-3, iPos.w)*smoothstep(0.8, mix(8.0, 13.0, fly), dist);
        vec3 wp = P + (position.x*e1 + (position.y + mix(0.75, 0.0, fly))*e2)*size;
        vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0);
        vPW = (modelMatrix*vec4(wp, 1.0)).xz;
        // (seen from far up the straight the crown is a lit crimson spark: a rule from distance, the haze takes less of it)
        float farK = smoothstep(150.0, 380.0, dist);
        vQ = position.xy; vCol = iCol*(1.0 + 0.3*farK)*vec3(1.0, 1.0 - 0.38*farK, 1.0 - 0.3*farK); vV = mvPosition.xyz;
        vNg = normalMatrix*ng; vNl = normalMatrix*mix(normalize(iOut*0.8 + ng*0.45), ng, fly);
        float flash = heave*(0.45 + 0.55*sin(uTime*3.0 + seed*31.0 + iPos.x*0.6));
        vAux = vec3(mix(iRnd.w, 1.0, smoothstep(0.0, 0.8, tau)), clamp(flash, 0.0, 1.0), 0.0);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
        #ifdef USE_FOG
          vFogDepth *= 1.0 - 0.5*farK;
        #endif
      }`,
    fragmentShader: LEAF_FRAG,
  });
}

// hang the leaves on the outer branches
async function buildCrownLeaves(ctx, B, rng, count, crownC, pickColor, season) {
  const tw = B.filter((b) => !b.root && b.depth >= 2);
  const W = tw.map((b) => { let L = 0; for (let i = 1; i < b.pts.length; i++) L += b.pts[i].distanceTo(b.pts[i - 1]); return L * [0, 0, 0.22, 0.7, 1.0][b.depth]; });
  const tot = W.reduce((a, b) => a + b, 0);
  const iPos = new Float32Array(count * 4), iBend = new Float32Array(count * 4), iRnd = new Float32Array(count * 4), iOut = new Float32Array(count * 3), iCol = new Float32Array(count * 3);
  const p = V3(), o = V3(), c = new THREE.Color();
  let n = 0, maxR = 1;
  for (let bi = 0; bi < tw.length && n < count; bi++) {
    const b = tw[bi], m = bi === tw.length - 1 ? count - n : Math.min(count - n, Math.round(count * W[bi] / tot));
    const segs = b.pts.length - 1, spread = [0, 0, 0.95, 0.8, 0.65][b.depth];
    for (let k = 0; k < m; k++) {
      if ((n & 1023) === 0) await ctx.yield();                       // a breath every 1024 leaves
      const t = b.depth === 2 ? rng.range(0.45, 1) : Math.pow(rng(), 0.7);
      const f = t * segs, i0 = Math.min(segs - 1, Math.floor(f)), ft = f - i0;
      p.copy(b.pts[i0]).lerp(b.pts[i0 + 1], ft);
      p.x += rng.gauss() * spread; p.y += rng.gauss() * spread * 0.8 - 0.1; p.z += rng.gauss() * spread;
      if (p.z > 9.3) p.z = 9.3 - rng() * 0.4;                         // the camera line stays clear
      if (p.y < 4.6) p.y = 4.6 + rng() * 0.6;
      o.subVectors(p, crownC); o.y *= 0.8; const r = o.length(); maxR = Math.max(maxR, r); o.normalize();
      iPos.set([p.x, p.y, p.z, rng.range(0.26, 0.40)], n * 4);
      iBend.set([lerp(b.flex[i0], b.flex[i0 + 1], ft), b.phase, b.rel, lerp(b.tip[i0], b.tip[i0 + 1], ft)], n * 4);
      const straggler = rng.chance(0.05) ? rng.range(0.15, 0.6) : 0;
      iRnd.set([rng.range(-0.05, 0.07) + straggler, rng(), 0, r], n * 4);
      iOut.set([o.x, o.y, o.z], n * 3);
      pickColor(c, rng, o); iCol.set([c.r, c.g, c.b], n * 3);
      n++;
    }
  }
  await ctx.yield();
  // ambient occlusion: deep leaves sit in the crown's shade
  for (let i = 0; i < n; i++) { const r = iRnd[i * 4 + 3] / maxR; iRnd[i * 4 + 3] = 0.3 + 0.7 * smoothstep(0.35, 0.95, r); }
  if (season === 'late') for (let i = 0; i < n; i++) if (rng.chance(0.4)) iPos[i * 4 + 3] = 0;   // already gone
  // shuffle (own little generator, so nothing else changes): any prefix of the instances is then an even sample of the
  // crown, and the tree can be drawn with fewer leaves while it is far away
  await ctx.yield();
  { let st = 0x2545f491; const sets = [[iPos, 4], [iBend, 4], [iRnd, 4], [iOut, 3], [iCol, 3]];
    for (let i = n - 1; i > 0; i--) {
      if ((i & 4095) === 0) await ctx.yield();
      st = (Math.imul(st, 1664525) + 1013904223) >>> 0; const j = st % (i + 1);
      if (j !== i) for (const [a, k] of sets) for (let e = 0; e < k; e++) { const t = a[i * k + e]; a[i * k + e] = a[j * k + e]; a[j * k + e] = t; }
    } }
  const g = leafTriangle();
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 4)); g.setAttribute('iBend', new THREE.InstancedBufferAttribute(iBend, 4));
  g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(iRnd, 4)); g.setAttribute('iOut', new THREE.InstancedBufferAttribute(iOut, 3));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  g.instanceCount = n;
  return g;
}

// ---------- the gust: a treadmill of leaves in braided streams, in path coordinates ----------
function gustMaterial(U, G, pal) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    defines: { NP: N_PATH, NOBS: N_OBS, NSTREAM: N_STREAM },
    uniforms: { ...lightU(), ...fogU(), uTime: U.uTime, uPx: U.uPx, uSunGain: U.uSunGain, uPatch: U.uPatch, uPatch2: U.uPatch2, uEmber: U.uEmber, uLeafAmb: U.uLeafAmb, uPale: { value: pal.pale },
      uPath: G.uPath, uPathS0: G.uPathS0, uCamS: G.uCamS, uAir: G.uAir, uStream: G.uStream, uObsA: G.uObsA, uObsB: G.uObsB, uLead: G.uLead, uAhead: G.uAhead, uFloor: G.uFloor, uClear: G.uClear, uAmount: G.uAmount, uRibA: G.uRibA, uRibB: G.uRibB, uRibAmt: G.uRibAmt },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC; attribute vec3 iCol;
      uniform vec3 uPath[NP]; uniform vec4 uStream[NSTREAM], uObsA[NOBS], uObsB[NOBS];
      uniform float uTime, uPx, uPathS0, uCamS, uAir, uLead, uAhead, uFloor, uClear, uAmount, uRibAmt;
      uniform vec4 uRibA[NP], uRibB[NP];   // the two ribbons at the path samples: metres right, metres up, density, braid radius
      varying vec2 vQ; varying vec3 vCol, vNg, vNl, vV; varying vec3 vAux; varying vec2 vPW;
      #include <fog_pars_vertex>
      vec3 pathAt(float s, out vec3 T){
        float f = clamp((s - uPathS0)/${PATH_DS.toFixed(1)}, 0.0, float(NP) - 1.001);
        int i = int(floor(f)); float fr = f - float(i);
        int im = i > 0 ? i - 1 : 0, ip = i < NP - 2 ? i + 2 : NP - 1;
        vec3 a = uPath[i], b = uPath[i + 1];
        T = normalize(mix(b - uPath[im], uPath[ip] - a, fr) + vec3(1e-5, 0.0, 0.0));
        return mix(a, b, fr);
      }
      void main(){
        float seed = iC.x;
        float sRel = mod(iA.x + iA.w*uTime + uAir + 3.5*sin(uTime*0.45 + seed*50.0), ${WIN_LEN.toFixed(1)}) - ${WIN_BACK.toFixed(1)};
        float s = uCamS + sRel;
        float edge = smoothstep(${(-WIN_BACK).toFixed(1)}, ${(-WIN_BACK + 10).toFixed(1)}, sRel)*(1.0 - smoothstep(${(WIN_LEN - WIN_BACK - 20).toFixed(1)}, ${(WIN_LEN - WIN_BACK).toFixed(1)}, sRel));
        float ahead = smoothstep(uLead, uLead + 14.0, sRel + (seed - 0.5)*16.0);
        float keep = mix(1.0, step(fract(seed*17.31), uAhead), ahead)*step(fract(seed*29.73), uAmount);
        float lat, hgt, rib = 0.0;
        if (iB.x >= 99.5) {
          // a ribbon: three strands rolling round one another along a centre line the world laid through the trunks and over
          // the stones; denser and thinner in slow waves, never empty
          float code = iB.x - 100.0, rb = step(9.5, code), strand = code - 10.0*rb;
          float f = clamp((s - uPathS0)/${PATH_DS.toFixed(1)}, 0.0, float(NP) - 1.001);
          int i = int(floor(f)); float fr = f - float(i);
          vec4 R = mix(mix(uRibA[i], uRibA[i + 1], fr), mix(uRibB[i], uRibB[i + 1], fr), rb);
          float roll = s*0.25 + uTime*(0.9 - 1.7*rb) + strand*2.094 + rb*1.7;
          float wob = 0.75 + 0.25*sin(s*0.057 + strand*1.3 + uTime*0.3);
          vec2 o = R.w*wob*vec2(cos(roll), 0.8*sin(roll)) + vec2(iA.y, iA.z)*(0.11 + 0.08*R.w);      // each strand a rope a hand-span thick, with a few strays
          lat = R.x + o.x; hgt = max(R.y + o.y, uFloor - 0.6 + 0.4*seed);
          keep = step(fract(seed*29.73), uRibAmt*R.z*(0.74 + 0.26*sin(s*0.08 - uTime*1.2 + rb*2.0 + strand)))
               * mix(1.0, step(fract(seed*17.31), 0.5), smoothstep(45.0, 110.0, sRel));
          rib = 1.0;
        } else if (iB.x >= 0.0) {
          vec4 st = uStream[int(iB.x + 0.5)];
          float roll = s*0.06 + uTime*0.8 + st.z*3.0, cr = cos(roll), sr = sin(roll);
          vec2 o = vec2(iA.y*cr - iA.z*sr, (iA.y*sr + iA.z*cr)*0.7)*st.w;      // each stream rolls like a rope
          lat = st.x + 2.9*sin(s*0.031 + st.z) + 1.2*sin(s*0.083 + st.z*1.7) + o.x;
          hgt = st.y + 1.5*sin(s*0.043 + st.z*2.3) + 0.6*sin(s*0.11 + st.z) + o.y;
        } else { lat = iC.y; hgt = iC.z + 1.2*sin(s*0.05 + seed*30.0); }
        lat += 0.3*sin(uTime*1.3 + seed*40.0 + s*0.21); hgt += 0.25*sin(uTime*1.7 + seed*71.0 + s*0.17);
        hgt = mix(max(hgt, uFloor + 0.4*seed), hgt, rib);
        { float cl = (1.0 - rib)*uClear*smoothstep(1.0, 9.0, sRel)*(1.0 + 0.085*max(sRel - 9.0, 0.0)), rr = max(length(vec2(lat, hgt)), 1e-2), kk = sqrt(1.0 + cl*cl/(rr*rr)); lat *= kk; hgt *= kk; }
        vec3 T; vec3 P = pathAt(s, T);
        vec2 Th = normalize(T.xz + vec2(1e-5, 0.0)), Nh = vec2(-Th.y, Th.x);
        P.xz += Nh*lat; P.y += hgt;
        // part round the obstacles (displacement of potential flow past a cylinder), curl in the lee
        for (int k = 0; k < NOBS; k++) {
          vec4 A = uObsA[k];
          float wv = 1.0 - smoothstep(0.0, A.w + 0.5, max(A.y - P.y, P.y - uObsB[k].x));
          float a = A.w*wv;
          vec2 d = P.xz - A.xz;
          P.xz = A.xz + d*sqrt(1.0 + a*a/max(dot(d, d), 1e-3));
          d = P.xz - A.xz;
          float side = dot(d, Nh) < 0.0 ? -1.0 : 1.0;
          // a ribbon unbraids round what it meets: the strands on one side ride up and those on the other dip, so that from
          // beside it (where the lens is) it opens like an eye round the trunk and closes again behind
          P.y += rib*side*0.7*a*(a*a/max(dot(d, d), max(a*a, 1e-3)));
          vec2 c = A.xz + Th*a*1.9 + Nh*side*a*0.75;
          vec2 dw = P.xz - c;
          float ang = -side*2.6*exp(-dot(dw, dw)/max(a*a*1.1, 1e-3))*wv;
          float ca = cos(ang), sa = sin(ang);
          P.xz = c + vec2(dw.x*ca - dw.y*sa, dw.x*sa + dw.y*ca);
        }
        vec4 mvc = modelViewMatrix*vec4(P, 1.0);
        float dist = length(mvc.xyz);
        float size = max(iB.w, 1.25*uPx*dist)*edge*keep*smoothstep(0.8, 7.0, dist);
        float a1 = iB.y + iB.z*uTime, a2 = seed*23.0 + uTime*(0.6 + seed);
        vec3 e1 = vec3(cos(a2), 0.0, sin(a2)), e2 = cos(a1)*vec3(0.0, 1.0, 0.0) + sin(a1)*vec3(-sin(a2), 0.0, cos(a2));
        if (iC.w > 0.5) { e2 = T*5.0; e1 = normalize(cross(T, vec3(0.3, 1.0, 0.2))); }       // graupel: a streak along the flow
        vec3 ng = normalize(cross(e1, e2));
        vec3 wp = P + (position.x*e1 + (position.y - 0.1)*e2)*size;
        vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0);
        vPW = (modelMatrix*vec4(wp, 1.0)).xz;
        vQ = position.xy; vCol = iCol; vV = mvPosition.xyz; vNg = normalMatrix*ng; vNl = vNg;
        vAux = vec3(1.0, 0.0, iC.w);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: LEAF_FRAG,
  });
}

async function buildGustGeometry(ctx, rng, nLoose, pickColor, squall, nRibA = 0, nRibB = 0) {
  const count = nLoose + nRibA + nRibB;
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iC = new Float32Array(count * 4), iCol = new Float32Array(count * 3);
  const c = new THREE.Color(), up = V3(0, 1, 0);
  // Each stream carries three gusts: packets of leaves some thirty metres long that keep together (every leaf of a packet
  // drifts past the lens at the packet's own speed), with a thin thread of stragglers between them and calmer air beside.
  const pulses = Array.from({ length: N_STREAM }, () => Array.from({ length: 3 }, (_, j) => ({ s: ((j + rng.range(0.15, 0.85)) / 3) * WIN_LEN, v: rng.range(-7, 3), len: rng.range(5, 9) })));
  for (let i = 0; i < nLoose; i++) {
    if ((i & 511) === 0) await ctx.yield();                         // a breath every 512 leaves
    const inStream = rng() < 0.9, wide = rng.chance(0.12) ? 1.4 : 0.48;
    const graupel = squall && rng.chance(0.14) ? 1 : 0;
    const k = rng.int(0, N_STREAM - 1);
    let s0 = rng() * WIN_LEN, v = rng.range(-10, 5);
    if (inStream && rng.chance(0.8)) { const P = pulses[k][rng.int(0, 2)]; s0 = (P.s + rng.gauss() * P.len + WIN_LEN * 4) % WIN_LEN; v = P.v; }
    iA.set([s0, rng.gauss() * wide, rng.gauss() * wide, v], i * 4);
    iB.set([inStream && !graupel ? k : -1, rng.range(0, 6.28), rng.range(3, 11) * rng.sign(), graupel ? 0.035 : rng.range(0.10, 0.19)], i * 4);
    iC.set([rng(), rng.range(-22, 22), -3.5 + 17.5 * Math.pow(rng(), 1.4), graupel], i * 4);
    pickColor(c, rng, up); iCol.set([c.r, c.g, c.b], i * 3);
  }
  // the two ribbons: leaves spread evenly along the whole treadmill, each in one of three strands, each with its own drift
  const rr = rng.fork('ribbons');
  for (let i = nLoose; i < count; i++) {
    if ((i & 511) === 0) await ctx.yield();
    const rb = i - nLoose < nRibA ? 0 : 1, strand = rr.int(0, 2);
    const stray = rr.chance(0.1) ? 3 : 1;
    iA.set([rr() * WIN_LEN, rr.gauss() * stray, rr.gauss() * stray, rr.range(-9, 2.5)], i * 4);
    iB.set([100 + 10 * rb + strand, rr.range(0, 6.28), rr.range(3, 11) * rr.sign(), rr.range(0.13, 0.22)], i * 4);
    iC.set([rr(), 0, 0, 0], i * 4);
    pickColor(c, rr, up); c.multiplyScalar(1.25); iCol.set([Math.min(c.r, 0.8), Math.min(c.g, 0.8), Math.min(c.b, 0.8)], i * 3);   // the brightest leaves ride the ribbons
  }
  const g = leafTriangle();
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  g.instanceCount = count;
  return g;
}

// ---------- crown bursts: the plume a tree throws into the stream as the front reaches it ----------
// One draw of single-triangle leaves (three vertices each, not instanced, so that only the trees near the front are drawn:
// the draw range is moved in update()). Every leaf belongs to one tree and has its own place in that tree's crown. It lets
// go when the front (uFrontS, a path distance) has run aQ.z metres past the tree, windward side first, flashes its pale
// underside, is thrown up and downwind against drag and is gathered into a stream line beside the flight line (aR.xy, in
// path coordinates, so it bends with the gorge), where it rides on ahead of us, tumbling, and is gone within sixty metres of the front's travel.
// The clock is path distance over the gust's nominal speed, so a still at a given u always shows the same plume.
function burstMaterial(U, G, pal) {
  return new THREE.ShaderMaterial({
    fog: true, lights: true, side: THREE.DoubleSide,
    defines: { NP: N_PATH },
    uniforms: { ...lightU(), ...fogU(), uTime: U.uTime, uPx: U.uPx, uSunGain: U.uSunGain, uPatch: U.uPatch, uPatch2: U.uPatch2, uEmber: U.uEmber, uLeafAmb: U.uLeafAmb, uPale: { value: pal.pale },
      uPath: G.uPath, uPathS0: G.uPathS0, uFrontS: G.uFrontS, uGustV: G.uGustV },
    vertexShader: /* glsl */`
      attribute vec4 aP;       // where it hangs in the crown (world), size
      attribute vec4 aQ;       // downwind at the tree (x, z), metres of front travel past the tree at which it lets go, seed
      attribute vec4 aR;       // the stream line it joins: metres right of the path, metres above it; the tree's path distance; its speed as a share of the gust's
      attribute vec3 aCol;
      uniform vec3 uPath[NP];
      uniform float uTime, uPx, uPathS0, uFrontS, uGustV;
      varying vec2 vQ; varying vec3 vCol, vNg, vNl, vV; varying vec3 vAux; varying vec2 vPW;
      #include <fog_pars_vertex>
      vec3 pathAt(float s, out vec3 T){
        float f = clamp((s - uPathS0)/${PATH_DS.toFixed(1)}, 0.0, float(NP) - 1.001);
        int i = int(floor(f)); float fr = f - float(i);
        int im = i > 0 ? i - 1 : 0, ip = i < NP - 2 ? i + 2 : NP - 1;
        vec3 a = uPath[i], b = uPath[i + 1];
        T = normalize(mix(b - uPath[im], uPath[ip] - a, fr) + vec3(1e-5, 0.0, 0.0));
        return mix(a, b, fr);
      }
      void main(){
        float seed = aQ.w, h2 = fract(seed*13.7), h3 = fract(seed*29.3), h4 = fract(seed*53.9), h5 = fract(seed*91.7), h6 = fract(seed*71.3);
        float dl = uFrontS - aR.z - aQ.z;                       // metres the front has run since this leaf let go
        float t = max(dl, 0.0)/max(uGustV, 1.0);                // seconds, at the gust's own speed
        float k = 3.0 + 2.5*h2, W = uGustV*aR.w;
        // taken up to the wind's speed against drag, and thrown ahead by the gust behind the front, which is faster than the
        // front itself: most leaves a little, a few far, so the plume is thick at the crown and drawn out to a point downwind
        // (and since we travel with the front, the thrown leaves stay in front of the lens for the rest of their flight)
        float adv = W*(t - (1.0 - exp(-k*t))/k) + (3.0 + 15.0*h6*h6)*(1.0 - exp(-2.4*t));
        vec3 A = aP.xyz + vec3(aQ.x, 0.0, aQ.y)*adv;
        A.y += (2.4 + 3.6*h3)*(1.0 - exp(-2.2*t))/2.2 - 0.6*t*t;          // flung up out of the lee of the crown, then sinking
        vec3 T1; vec3 B = pathAt(aR.z + adv, T1);
        vec2 Th = normalize(T1.xz + vec2(1e-5, 0.0)), Nh = vec2(-Th.y, Th.x);
        float roll = (aR.z + adv)*0.19 + floor(seed*3.0)*2.094 + uTime*0.7;
        vec2 o = vec2(cos(roll), 0.8*sin(roll))*(0.25 + 0.55*h5);         // three strands rolling round one another, as the ribbons do
        B.xz += Nh*(aR.x + o.x); B.y += aR.y + o.y;
        float g = 1.0 - exp(-(1.3 + 0.9*h4)*t); g = g*g*(3.0 - 2.0*g);    // gathered into the stream: straight downwind at first, then drawn across
        vec3 P = mix(A, B, g);
        P += (vec3(h4, h2, h5) - 0.5)*(0.85*sqrt(t)*(1.0 - 0.75*g));       // the jet frays a little as it leaves the crown, and closes again in the stream
        P += min(t*2.0, 1.0)*vec3(0.0, 0.4*sin(t*3.1 + seed*40.0 + uTime*1.3), 0.5*cos(t*2.3 + seed*60.0 + uTime*1.1));
        float life = 40.0 + 22.0*h3;                                      // metres of the front's travel: two seconds and more in the air, the last third of it thinning away
        float sc = smoothstep(0.0, 1.4, dl)*(1.0 - smoothstep(life*0.62, life, dl));
        float a1 = seed*40.0 + uTime*(3.0 + 8.0*h2)*(h3 < 0.5 ? -1.0 : 1.0), a2 = seed*23.0 + uTime*(0.6 + seed);
        vec3 e1 = vec3(cos(a2), 0.0, sin(a2)), e2 = cos(a1)*vec3(0.0, 1.0, 0.0) + sin(a1)*vec3(-sin(a2), 0.0, cos(a2));
        vec3 ng = normalize(cross(e1, e2));
        vec4 mvc = modelViewMatrix*vec4(P, 1.0);
        float dist = length(mvc.xyz);
        float size = max(aP.w*mix(1.3, 1.0, smoothstep(0.0, 0.7, t)), 1.25*uPx*dist)*sc*smoothstep(0.8, 7.0, dist);   // (a burst leaf keeps its own size, with the floor and the fade near the eye the flying leaves have)
        vec3 wp = P + (position.x*e1 + (position.y - 0.1)*e2)*size;
        vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0);
        vPW = (modelMatrix*vec4(wp, 1.0)).xz;
        vQ = position.xy; vCol = aCol; vV = mvPosition.xyz; vNg = normalMatrix*ng; vNl = vNg;
        vAux = vec3(1.0, 0.6*(1.0 - smoothstep(0.0, 0.3, t)), 0.0);      // torn off pale side up
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: LEAF_FRAG,
  });
}

// trees: [{ c: [x, y, z] crown centre (world), r, ry: crown radii, s: path distance, t: [tx, tz] downwind there, lat, hgt: the
// stream line its leaves join (path coordinates), n: leaves, cols: [THREE.Color], size: 1 (leaf scale), tight: 1 (under 1: the
// leaves let go in a shorter breath), fan: [across, up] (metres the mass is through where it joins its line; default a thread) }], sorted here by s.
async function buildBurstGeometry(ctx, rng, trees) {
  const total = trees.reduce((a, b) => a + b.n, 0), nv = total * 3;
  const pos = new Float32Array(nv * 3), aP = new Float32Array(nv * 4), aQ = new Float32Array(nv * 4), aR = new Float32Array(nv * 4), aCol = new Float32Array(nv * 3);
  const tri = [-1.62, -1.02, 1.62, -1.02, 0, 2.22], c = new THREE.Color(), starts = [];
  let i = 0;
  for (const tr of trees) {
    starts.push(i);
    for (let k = 0; k < tr.n; k++, i++) {
      if ((i & 511) === 0) await ctx.yield();
      // its place in the crown: the leaves pour out of its lee shoulder, a ball half the crown across, so the plume is thick
      // where it leaves the tree
      let dx = rng.gauss(), dy = rng.gauss(), dz = rng.gauss(); const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const rb = Math.min(0.3 * tr.r, 1.6) * Math.pow(rng(), 0.45), al = dx * tr.t[0] + dz * tr.t[1], rr = rb / tr.r;
      const px = tr.c[0] + tr.t[0] * tr.r * 0.45 + dx * rb, py = tr.c[1] + tr.ry * 0.3 + dy * rb * 0.8, pz = tr.c[2] + tr.t[1] * tr.r * 0.45 + dz * rb;
      // it pours for a second of the front's travel: hardest as the front arrives, thinning after, so that at any moment of
      // the burst the plume stands as a jet from the crown, drawn out downwind
      // (two thirds of them go in three gusts, the first the hardest, so the plume has knots of leaves along it and is never
      // an even spray; the rest pour between the gusts)
      const gq = rng(), gust = gq < 0.3 ? -10.5 : gq < 0.5 ? -2.5 : gq < 0.66 ? 6.5 : 1e3;
      const rel = 0.5 * tr.r * al * rr + (gust < 100 ? gust + rng.gauss() * 2.1 : lerp(-13, 18, Math.pow(rng(), 1.7))) * (tr.tight ?? 1);   // (tight < 1: torn out in one breath, a spray and not a trail)
      const size = rng.range(0.16, 0.26) * (tr.size || 1), seed = rng(), lat = tr.lat + rng.gauss() * (tr.fan ? tr.fan[0] : 0.3), hgt = tr.hgt + rng.gauss() * (tr.fan ? tr.fan[1] : 0.25), sp = rng.range(0.86, 1.03);
      c.copy(tr.cols[rng.int(0, tr.cols.length - 1)]).multiplyScalar(rng.range(0.7, 1.02));
      const cr = Math.min(c.r, 0.8), cg = Math.min(c.g, 0.8), cb = Math.min(c.b, 0.8);
      for (let v = 0; v < 3; v++) {
        const o = i * 3 + v;
        pos[o * 3] = tri[v * 2]; pos[o * 3 + 1] = tri[v * 2 + 1];
        aP[o * 4] = px; aP[o * 4 + 1] = py; aP[o * 4 + 2] = pz; aP[o * 4 + 3] = size;
        aQ[o * 4] = tr.t[0]; aQ[o * 4 + 1] = tr.t[1]; aQ[o * 4 + 2] = rel; aQ[o * 4 + 3] = seed;
        aR[o * 4] = lat; aR[o * 4 + 1] = hgt; aR[o * 4 + 2] = tr.s; aR[o * 4 + 3] = sp;
        aCol[o * 3] = cr; aCol[o * 3 + 1] = cg; aCol[o * 3 + 2] = cb;
      }
    }
  }
  starts.push(i);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.BufferAttribute(aP, 4)); g.setAttribute('aQ', new THREE.BufferAttribute(aQ, 4));
  g.setAttribute('aR', new THREE.BufferAttribute(aR, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(aCol, 3));
  g.setDrawRange(0, 0);
  g.userData.starts = starts;
  return g;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('maple-gale-hero');
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const hexes = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE;
  const [cCrimson, cOrange, cGold, cSchist, cSlate, cCream, cHemlock] = hexes.map((h) => new THREE.Color(h));
  const season = opts.season || 'peak';
  const weather = opts.weather || (opts.hour === 'golden' || opts.hour === 'dawn' ? opts.hour : 'slate');

  // colours (linear). Ordinary albedo stays under ~0.8.
  const cScarlet = cCrimson.clone().lerp(cOrange, 0.4), cDeep = cCrimson.clone().multiplyScalar(0.5);
  const cGoldS = cGold.clone().multiplyScalar(0.85), cBrown = cOrange.clone().lerp(cSchist, 0.62);
  const cGreen = cHemlock.clone().lerp(new THREE.Color('#7d9a2e'), 0.6);
  const pal = {
    pale: cCream.clone().lerp(cCrimson, weather === 'dawn' ? 0.04 : 0.14).multiplyScalar(0.82),
    rock: cSchist.clone().lerp(cSlate, 0.18).lerp(new THREE.Color('#4a4038'), 0.25).multiplyScalar(2.6),
    moss: cHemlock.clone().lerp(new THREE.Color('#5d7d2a'), 0.55).multiplyScalar(1.15),
    ramp: [cCrimson, cScarlet, cOrange.clone().multiplyScalar(0.9), cGoldS, cBrown],
  };
  const barkA = cSchist.clone().lerp(new THREE.Color('#57463a'), 0.6).multiplyScalar(1.25);
  const barkB = barkA.clone().multiplyScalar(0.55).lerp(cSlate, 0.08);
  const scarletBias = rng.range(-0.12, 0.16);          // per seed: a darker, bloodier tree or a brighter scarlet one
  const crownColor = (c, r, o) => {
    const t = r() + scarletBias + 0.22 * o.y;
    if (season === 'early' && r.chance(0.33)) { c.copy(cGreen).lerp(cGoldS, r() * 0.7); }
    else if (t < 0.3) c.copy(cDeep).lerp(cCrimson, r());
    else if (t < 0.82) c.copy(cCrimson).lerp(cScarlet, r() * 0.35);
    else if (t < 1.08) c.copy(cCrimson).lerp(cScarlet, 0.5 + 0.5 * r());
    else c.copy(cScarlet).lerp(cOrange, r() * 0.7);
    c.multiplyScalar(r.range(0.78, 1.1));
  };
  const gustColor = (c, r) => {
    const t = r();
    if (t < 0.36) c.copy(cCrimson).lerp(cDeep, r() * 0.5);
    else if (t < 0.58) c.copy(cScarlet);
    else if (t < 0.79) c.copy(cOrange).multiplyScalar(0.9);
    else if (t < 0.94) c.copy(cGoldS).lerp(cOrange, r() * 0.4);
    else c.copy(cBrown);
    c.multiplyScalar(r.range(0.72, 1.08));
  };

  const U = {
    uTime: { value: 0 }, uClock: { value: -9 }, uStripDur: { value: 2 }, uCalm: { value: weather === 'dawn' ? 0.7 : 1 }, uPx: { value: 0.0015 },
    uTube: { value: 6.5 }, uSunGain: { value: 1 }, uPatch: { value: new THREE.Vector4(0, 0, 1e6, 1) }, uPatch2: { value: new THREE.Vector3(0, 0, 1e-3) }, uGrow: { value: 1 }, uEmber: { value: weather === 'golden' ? 2.3 : 1.7 }, uLeafAmb: { value: weather === 'slate' ? 1.7 : weather === 'dawn' ? 1.45 : 1.3 }, uLitter: { value: season === 'late' ? 1 : 0.7 },
  };
  const G = {
    uPath: { value: Array.from({ length: N_PATH }, (_, i) => V3(i * PATH_DS, 0, 0)) }, uPathS0: { value: 0 }, uCamS: { value: 0 }, uAir: { value: 0 },
    uStream: { value: [] }, uObsA: { value: Array.from({ length: N_OBS }, () => new THREE.Vector4(0, -9999, 0, 0)) },
    uObsB: { value: Array.from({ length: N_OBS }, () => new THREE.Vector4(-9999, 0, 0, 0)) },
    uLead: { value: opts.lead ?? 25 }, uAhead: { value: opts.ahead ?? 0.3 }, uFloor: { value: opts.floor ?? -3.6 }, uClear: { value: 0 }, uAmount: { value: 1 },
    uRibA: { value: Array.from({ length: N_PATH }, () => new THREE.Vector4(0, 0, 0, 1)) }, uRibB: { value: Array.from({ length: N_PATH }, () => new THREE.Vector4(0, 0, 0, 1)) }, uRibAmt: { value: 1 },
    uFrontS: { value: -1e4 }, uGustV: { value: 26 },
  };
  // nine streams across the corridor; those that cross the lens line ride below or above eye level
  const sr = rng.fork('streams');
  for (let k = 0; k < N_STREAM; k++) {
    const L = lerp(-17, 17, (k + 0.5) / N_STREAM) + sr.range(-1.6, 1.6);
    let H = sr.range(-2.8, 9.5);
    if (Math.abs(L) < 5.5) H = sr.chance(0.5) ? sr.range(-3.0, -1.9) : sr.range(2.8, 5.5);
    G.uStream.value.push(new THREE.Vector4(L, H, sr.range(0, 6.28), sr.range(0.85, 1.5)));
  }

  const object = new THREE.Group(); object.name = 'maple-gale-hero';

  // rock
  const baseH = makeBaseHeight(noise, rng.range(0, 50));
  if (opts.base !== false) {
    const rock = new THREE.Mesh(buildBaseGeometry(baseH, rng.fork('rock')), rockMaterial(U, pal));
    rock.name = 'outcrop'; object.add(rock);
  }
  await ctx.yield();

  // tree
  const B = await growMaple(ctx, rng.fork('skeleton'), baseH);
  await ctx.yield();
  const limbs = new THREE.Mesh(await buildLimbGeometry(ctx, B, rng.fork('bark'), barkA, barkB), woodMaterial(U, pal.moss));
  limbs.name = 'limbs'; limbs.frustumCulled = false; object.add(limbs);
  await ctx.yield();

  // crown extent from the outer twigs
  const bb = new THREE.Box3();
  for (const b of B) if (!b.root && b.depth >= 3) for (const p of b.pts) bb.expandByPoint(p);
  const crownC = bb.getCenter(V3()); crownC.y -= 1.0;
  const crownR = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.5;
  const nCrown = Math.round((opts.mapleLeaves ?? 34000) * lerp(1, detail, 0.5));
  const crown = new THREE.Mesh(await buildCrownLeaves(ctx, B, rng.fork('leaves'), nCrown, crownC, crownColor, season), crownLeafMaterial(U, pal));
  crown.name = 'crown-leaves'; crown.frustumCulled = false; object.add(crown);
  const crownCount = crown.geometry.instanceCount;
  await ctx.yield();

  // gust
  const nGust = Math.round((opts.gustLeaves ?? 56000) * detail * (season === 'late' ? 1.12 : 1));
  const ribK = lerp(0.6, 1, detail), nRibA = Math.round((opts.ribbonLeaves ?? 0) * 0.78 * ribK), nRibB = Math.round((opts.ribbonLeaves ?? 0) * 0.22 * ribK);
  const gustMesh = new THREE.Mesh(await buildGustGeometry(ctx, rng.fork('gust'), nGust, gustColor, weather === 'squall', nRibA, nRibB), gustMaterial(U, G, pal));
  gustMesh.name = 'gust'; gustMesh.frustumCulled = false; gustMesh.matrixAutoUpdate = false; object.add(gustMesh);
  await ctx.yield();
  // the crown bursts: their material is made here, their leaves when the world has planted its trees (setBursts)
  const burstMat = burstMaterial(U, G, pal);
  let burstMesh = null, burstS = [], burstStart = [];

  // ---------- anchors ----------
  const waterAt = (x) => WATER_Y + (x < 0 ? -x * 36 / 560 : 0);
  const fly = [];
  for (const x of [-420, -340, -260, -180, -120]) fly.push(V3(x, waterAt(x) + 4.5, PASS_Z));
  fly.push(V3(-87, waterAt(-87) + 4.5, PASS_Z), V3(-45, PASS_Y + 0.25, PASS_Z), V3(0, PASS_Y, PASS_Z), V3(LIP_X, PASS_Y, PASS_Z), V3(LIP_X + 20, PASS_Y, PASS_Z));
  const ax = LIP_X + 20, DIVE = 50 * Math.PI / 180;
  for (let d = 10; d <= 50; d += 10) { const a = d * Math.PI / 180; fly.push(V3(ax + 52 * Math.sin(a), PASS_Y - 52 * (1 - Math.cos(a)), PASS_Z)); }
  const arcEnd = fly[fly.length - 1];
  fly.push(V3(arcEnd.x + 30 * Math.cos(DIVE), arcEnd.y - 30 * Math.sin(DIVE), PASS_Z));
  const seat = V3(arcEnd.x + 60 * Math.cos(DIVE), arcEnd.y - 60 * Math.sin(DIVE), PASS_Z);
  fly.push(seat.clone());
  const ownObstacles = [
    { x: 0.9, z: 0, r: 1.5, y0: -4, y1: 9 },
    { x: crownC.x, z: crownC.z, r: crownR * 0.9, y0: bb.min.y + 3, y1: bb.max.y - 1, crown: true },
  ];
  const anchors = {
    trunkBase: V3(0, 0, 0), crownCentre: crownC.clone(), crownTop: V3(crownC.x + 1.5, bb.max.y, crownC.z), windDir: V3(1, 0, 0),
    lipX: LIP_X, waterY: WATER_Y, poolY: POOL_Y,
    pass: V3(0, PASS_Y, PASS_Z), flyThrough: fly,
    viewpoints: { farReveal: fly[0].clone(), stripStart: V3(-50, PASS_Y + 0.3, PASS_Z), bare: V3(0, PASS_Y, PASS_Z), openAir: V3(LIP_X + 20, PASS_Y, PASS_Z) },
    fallFoot: V3(LIP_X + 3, POOL_Y, PASS_Z), spiralEye: V3(seat.x, POOL_Y, PASS_Z),
    portalSeat: { position: seat.clone(), facing: V3(-Math.cos(DIVE), Math.sin(DIVE), 0) },
    obstacles: ownObstacles.map((o) => ({ ...o })),
  };

  // ---------- driving state ----------
  const demoPath = makePath(fly.map((p) => [p.x, p.y, p.z]));
  let path = opts.path || null, mode = 'demo', progress = 0, manualClock = null, sTree = null, sTreeKey = '';
  let airSpeed = null, clock = -9;
  let userObs = [], ribTab = null;
  const ownCand = ownObstacles.map(() => ({ x: 0, z: 0, r: 0, y0: 0, y1: 0, d: -1 })), holds = [0, 1].map(() => ({ x: 0, z: 0, r: 0, y0: -1e3, y1: 1e3, d: -1 }));
  const stripLead = opts.stripLead ?? 50;
  let lead = opts.lead ?? 25;
  const frontLead = 25;                                   // the design's front: camera path distance + 25 m
  const M = new THREE.Matrix4(), tmp = V3(), wpos = V3(), buf = new THREE.Vector2(), cand = [];
  let keyX = NaN, keyZ = NaN, keyPath = undefined;

  function update(dt, time, camera) {
    U.uTime.value = time;
    object.updateWorldMatrix(true, false); M.copy(object.matrixWorld);
    gustMesh.matrix.copy(M).invert(); gustMesh.matrixWorldNeedsUpdate = true;      // the gust lives in world/path space
    let hpx = 1080; if (ctx.renderer?.getDrawingBufferSize) hpx = ctx.renderer.getDrawingBufferSize(buf).y || 1080;
    const p5 = camera?.projectionMatrix?.elements[5] || 1.66;
    U.uPx.value = 2 / (p5 * hpx);

    // where along the path the tree stands
    const P = path || demoPath;
    wpos.setFromMatrixPosition(M);
    if (sTree === null || keyPath !== P || keyX !== wpos.x || keyZ !== wpos.z) {
      const n = path ? P.nearestXZ(wpos.x, wpos.z) : P.nearestXZ(0, 0);
      sTree = n.u * P.length; keyPath = P; keyX = wpos.x; keyZ = wpos.z;
    }
    const camS = mode === 'path' ? progress * P.length : sTree - 25;
    // far away the crown is drawn with a third of its leaves (each is then about a pixel); all of them from 220 m in
    // (and from beyond 520 m the limbs, a pixel wide under the leaves, are not drawn: the tree is its crimson crown there)
    if (camera) { tmp.setFromMatrixPosition(camera.matrixWorld); const dT = tmp.distanceTo(wpos); crown.geometry.instanceCount = Math.max(1, Math.round(crownCount * lerp(0.3, 1, 1 - smoothstep(220, 450, dT)))); limbs.visible = dT < 520; }

    // strip clock (seconds): < 0 before the front, 0..2 the strip, then the cloud's flight
    let grow = 1;
    if (manualClock != null) clock = manualClock;
    else if (mode === 'path') clock = Math.max(-9, (camS - (sTree - stripLead)) / (stripLead / U.uStripDur.value));
    else {
      const ph = (((time + 13) % 20) + 20) % 20;                 // demo loop: calm, heave, strip, bare, regrow
      if (ph < 4) clock = -4.5 + ph * 1.125;
      else if (ph < 15) clock = ph - 4;
      else { clock = -5; grow = clamp((ph - 15) / 4.2, 0, 1); }
    }
    U.uClock.value = clock; U.uGrow.value = grow;

    // path frame samples under the treadmill
    const s0 = Math.floor((camS - WIN_BACK - 4) / PATH_DS) * PATH_DS;
    const arr = G.uPath.value;
    for (let i = 0; i < N_PATH; i++) { P.posAtDist(s0 + i * PATH_DS, arr[i]); if (!path) arr[i].applyMatrix4(M); }
    G.uPathS0.value = s0; G.uCamS.value = camS;
    if (ribTab) {                                                      // the ribbons' centre lines under the same samples
      const i0 = Math.round(s0 / PATH_DS), ra = G.uRibA.value, rb = G.uRibB.value;
      for (let i = 0; i < N_PATH; i++) { const k = clamp(i0 + i, 0, ribTab.n - 1) * 4; ra[i].fromArray(ribTab.a, k); rb[i].fromArray(ribTab.b, k); }
    }
    G.uLead.value = mode === 'demo' ? 999 : lead;
    // the front, and the trees whose plumes are in the air: those it reached within the last hundred metres
    const frontS = mode === 'path' ? camS + frontLead : -1e4;
    G.uFrontS.value = frontS;
    if (burstMesh) {
      burstMesh.matrix.copy(gustMesh.matrix); burstMesh.matrixWorldNeedsUpdate = true;
      let i0 = 0, i1 = 0; const n = burstS.length;
      while (i0 < n && burstS[i0] < frontS - 84) i0++;
      i1 = i0; while (i1 < n && burstS[i1] < frontS + 18) i1++;
      burstMesh.geometry.setDrawRange(burstStart[i0] * 3, (burstStart[i1] - burstStart[i0]) * 3);
    }
    const rel = airSpeed ?? (mode === 'demo' ? 24 : 0);
    G.uAir.value = (((rel * time) % WIN_LEN) + WIN_LEN) % WIN_LEN;

    // obstacles: the maple's own two, then the nearest of the world's
    cand.length = 0;
    const bare = smoothstep(0.4, 2.6, clock) * grow + (1 - grow);
    for (let i = 0; i < ownObstacles.length; i++) {
      const o = ownObstacles[i], c = ownCand[i];
      tmp.set(o.x, 0, o.z).applyMatrix4(M);
      c.x = tmp.x; c.z = tmp.z; c.r = o.crown ? o.r * lerp(1, 0.3, bare) : o.r; c.y0 = o.y0 + tmp.y; c.y1 = o.y1 + tmp.y;
      cand.push(c);
    }
    for (const h of holds) if (h.r > 0.01) cand.push(h);              // the world's own moving capsules: always among the twelve
    if (userObs.length) {
      // the nearest to where we look: a point ten metres down the path from the lens; a ribbon's own trunk or stone counts as nearer
      if (mode === 'path' && path) P.posAtDist(Math.min(camS + 10, P.length), tmp); else if (camera) tmp.setFromMatrixPosition(camera.matrixWorld); else tmp.copy(wpos);
      for (const o of userObs) { const dx = o.x - tmp.x, dz = o.z - tmp.z; o.d = (dx * dx + dz * dz) * (o.rib ? 0.16 : 1); }
      if (userObs.length > N_OBS - 2) userObs.sort((a, b) => a.d - b.d);
      for (let i = 0; i < userObs.length && cand.length < N_OBS; i++) cand.push(userObs[i]);
    }
    for (let i = 0; i < N_OBS; i++) {
      const o = cand[i], A = G.uObsA.value[i], Bv = G.uObsB.value[i];
      if (!o) { A.set(0, -9999, 0, 0); Bv.set(-9999, 0, 0, 0); continue; }
      const fade = o.d > 0 ? 1 - smoothstep(110, 140, Math.sqrt(o.d)) : 1;
      A.set(o.x, o.y0 ?? -1e3, o.z, Math.max(0, (o.r ?? 1) * fade)); Bv.set(o.y1 ?? 1e3, 0, 0, 0);
    }
  }

  await ctx.yield();
  return {
    object, radius: 14, height: 28, center: V3(crownC.x * 0.7, 15, 0), anchors,
    ground: true, groundY: -2.4,
    uniforms: U,
    update,
    dispose() {},
    setPath(p) { path = p || null; sTree = null; },
    setProgress(u) { mode = 'path'; progress = clamp(u, 0, 1); },
    setStrip(sec) { manualClock = sec == null ? null : sec; },
    setObstacles(list) { userObs = (list || []).map((o) => ({ x: o.x, z: o.z, r: o.r ?? 1, y0: o.y0 ?? -1e3, y1: o.y1 ?? 1e3, d: 0, rib: !!o.rib })); },
    setHold(i, x, z, r, y0 = -1e3, y1 = 1e3) { const h = holds[i & 1]; h.x = x; h.z = z; h.r = Math.max(0, r); h.y0 = y0; h.y1 = y1; },
    setSun(g) { U.uSunGain.value = Math.max(0, g); },
    setPatch(x, z, r, floor, x2 = 0, z2 = 0, r2 = 0) { U.uPatch.value.set(x, z, r, floor); U.uPatch2.value.set(x2, z2, Math.max(r2, 1e-3)); },
    // The crown bursts. Call once in build(), after the trees are planted: makes the one draw of plume leaves (hidden until
    // the front nears a tree). Returns { leaves, peak }: all the leaves, and the most that are ever drawn at once.
    async setBursts(trees, rngB) {
      if (burstMesh || !trees || !trees.length) return { leaves: 0, peak: 0 };
      const list = [...trees].sort((a, b) => a.s - b.s);
      const g = await buildBurstGeometry(ctx, rngB || rng.fork('bursts'), list);
      burstS = list.map((t) => t.s); burstStart = g.userData.starts;
      burstMesh = new THREE.Mesh(g, burstMat); burstMesh.name = 'crown-bursts'; burstMesh.frustumCulled = false; burstMesh.matrixAutoUpdate = false; object.add(burstMesh);
      let peak = 0;
      for (let i = 0, j = 0; i < list.length; i++) { while (burstS[i] - burstS[j] > 102) j++; peak = Math.max(peak, burstStart[i + 1] - burstStart[j]); }
      return { leaves: burstStart[list.length], peak };
    },
    frontLead,
    stripClock: () => clock,
    stripAmount: () => clamp(clock / U.uStripDur.value, 0, 1),
    treeS: () => sTree,
    gust: {
      mesh: gustMesh, uniforms: G,
      setLead(m) { lead = m; }, setAhead(a) { G.uAhead.value = clamp(a, 0, 1); },
      setAirSpeed(v) { airSpeed = v == null ? null : v; }, setFloor(y) { G.uFloor.value = y; }, setClear(r) { G.uClear.value = Math.max(0, r); },
      setAmount(a) { G.uAmount.value = clamp(a, 0, 1); },
      ribStep: PATH_DS, setRibbons(tab) { ribTab = tab && tab.n > 1 ? tab : null; }, setRibbonAmount(a) { G.uRibAmt.value = clamp(a, 0, 1); },
    },
  };
}
