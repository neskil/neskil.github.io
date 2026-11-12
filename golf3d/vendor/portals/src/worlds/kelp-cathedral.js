// KELP CATHEDRAL: under a cold green sea, giant kelp rises like cathedral columns through shafts of sun,
// and a humpback whale and her calf pass through the nave.
//
// Layout: the camera path IS the aisle (heading -Z). Kelp columns stand in loose rows either side of it,
// reaching the surface (y = 0) and trailing a canopy along the current. Chapters, in the order the flight meets them
// (the brief's beats are keyed to path progress u; everything else is placed in metres from the wreck, the sea lions'
// axis, the vault or the exit):
//   THE NAVE        entry between gold, back-lit columns, shafts slanting through them
//   THE CLERESTORY  the path climbs to 16 m under the surface: columns lean in overhead, moon jellies hang back-lit
//                   among the amber fronds
//   THE RIVER       down again under a pointed arch of five bowed columns into the sardine school: a silver river
//                   120 m long that follows the aisle, turns slowly about its own axis and opens in a tunnel round
//                   the lens (the brief's beat), dark backs, mirror flanks flashing in waves
//                   Somewhere beside the lane between the entry and the wreck (a draw of its own, either side) a reef head
//                   in orange and gold with its own garibaldi
//   THE WRECK       the dip: the dark, overgrown skeleton of a fishing boat in open sand (the kelp stands back from it and
//                   from its berth beside the lane: one hull length clear ahead of its stem and one astern), garibaldi in
//                   its ribs, and on some seeds a turtle wheeling over its far side (never nearer the lens line than 13 m).
//                   A dark ray lies on the lane's edge beside the wreck: when the lens first comes within 18 of its spans
//                   it lifts and flees across the aisle and away down its far side at twice the lens's speed, until the
//                   water's own fog has taken it. From the wreck to where the whales come in over the lane, evenly spaced
//                   with a seeded phase: eelgrass meadows on the open sand (beside the wreck on the open side of the lane,
//                   nearer the whales' clearing across it; thick and tall in the middle, thinning to single blades at a
//                   ragged rim, a third of the blades paler), and groups of three low bedded ledges where a rib of rock
//                   breaks through (each group on a side it draws; weathered, mottled tops that take the sun and the
//                   caustics, sand in their hollows, dark risers, sand drifted against their feet, fans on the top beds);
//                   low two-bed ledges of the same rock lie along the aisle
//   THE DIVERS      three sea lions corkscrew down from the surface round an upright axis in the aisle (LION_S, where the
//                   gaze goes), trailing bubbles; keyed to path progress from end to end, as the brief asks. The helix is
//                   drawn for each sea (its turns, its hand, the bearing they dive in on); they circle level at its foot
//                   until they head down the aisle. The leader reaches the foot when the lens is LION_FOOT metres short
//                   of the axis; they keep 27 m and more ahead of the lens, winding about their line from a phase of
//                   their own, and climb ahead of it to the light at the pitch they came down by (the run is the turns
//                   of their dive unwound); gone at the surface as the whales come in
//   THE WHALES      mother and calf come down from the right where the kelp parts for them (no column within WHALE_GAP
//                   metres of her line), pass overhead-ahead (never less than WHALE_LEAD metres ahead of the lens: seen
//                   from below against the surface, nose to flukes), then pull ahead and LEAD down the aisle until she
//                   climbs over the roof of the vault and out through the surface
//   THE GATE        a vault of dark, bedded rock 16 m long where the aisle narrows, one pier stouter than the other (a share
//                   drawn for each sea), bedded blocks fallen at both faces of each pier;
//                   its soffit carries a quiet ripple of light bounced up off the sand and is studded with glowing
//                   anemones; moon jellies drift in its shadow, the glade is bright beyond
//   THE BREACH      seen from under the vault's far half: she falls back through the surface ahead. A ragged wreath of
//                   foam (heaped on one side, nearly gone on the other) runs outward over the ceiling as she goes down
//                   (as wide as she is deep, spent when she is deepest), light is let down through it and thousands of
//                   small bubbles are dragged down behind her (the moment nobody expects); she levels out and hangs
//                   over the chancel
//   THE CHANCEL     an open sandy floor, the craggy, anemone-collared exit arch with its buttresses, the portal
//                   recessed in its throat. The rock of the exit group takes the water's fog like all the rock of the
//                   nave (rock turned from the sun is a dark, back-lit shape everywhere; only down-facing rock takes
//                   the light bounced off the sand). The way out is found by its light: from 260 m a soft bloom in the
//                   water, coming up with the opening itself; near to, the next world's light lies on the rock round
//                   the opening (most on the faces turned to it, broken by the rock's relief) and on the sand before it
//
// The flight (route, pace, points of interest, lens) is the first version's, unchanged.
//
// File map
//   1 constants and shaders: fogFrag (gaze-dependent water fog; rock takes the level colour, goes darker as it fades and
//     has its own reach, uFogK), KELP_* (giant kelp),
//     FISH_* (sardines), BED_* (sea bed, rock, timber: one self-lit material; it also takes the light of the way out), PLUME_*
//     (bubbles), CROWN_* (the foam wreath of the breach), SHAFT_* (light let down through it), RIM_* (the glow of the way out in the water),
//     GLOW_* (lamp halos), DOME_* (backdrop gradient)
//   2 geometry builders: kelpColumnGeometry / makeKelpChunk, fishGeometry / makeSardines, buildWreck,
//     starGeometry / urchinGeometry, rockArchGeometry (vault and exit arch; bedded jambs and feet), ledgeGeometry (low bedded ledges), sealionGeometry
//   3 build(): per-seed character and ctx.vary -> flight path and pace -> whale track (whaleAt) -> light and
//     water -> sea bed -> rock (vault, exit arch, buttresses, wall, stacks, boulders, floor life) -> wreck -> kelp
//     (rows, the whales' clearing, the wreck's berth, the reef head's place, bowed columns) -> understory and reef (the rock rib's
//     groups, eelgrass meadows, the sand banked against rock, the garden, the reef head, the vault's feet) -> rock crust (anemones
//     stood along the rock's normals, lamp halos) -> fauna (sardines,
//     garibaldi, sea lions and their bubbles, jellies of the nave and the vault, the ray, visitors, rare pod) -> hero ->
//     white water (bubbles, crown, shafts) -> portal haze, the light of the way out -> returned world (pois, pace, update)
// The portal: the engine's halo is off (portal.halo false, style 'ring'); a haze disc thins over the opening as the lens
// closes (from 260 m to 120 m), its glow in the water comes up on the same curve (portal-glow: soft light, no line), and
// the rock and sand near the opening are lit by it in their own shader (uExit*).
// Driven by path progress (the journey's own events): the whales, the sea lions, the sardines' head, the ray's flight
// (by the lens's own time since it startled the ray), the breach's bubbles and crown. Everything else runs on the world clock.
// ctx.vary: hour picks the mood (golden/dawn = gold, day = noon, night = emerald), mood shifts fog and ray
// strength, density scales kelp gaps, weed, coral and fish counts, rare adds a pod of three more humpbacks
// escorting the pair. ctx.quality.detail thins particles, seagrass, cobbles, bubbles and the far kelp rows only.
// rng: ctx.rng feeds the layout in the order the first version drew it and every draw is used (none is taken and thrown away:
// the arches' asymmetry, the sea lions' helix and winding); later additions draw from streams of their own (rx, ry, rz, rn,
// and the named ones at the head of build: rock-rib, reef-head, meadows, vault-feet, nave-jellies, vault-lamps), made from the seed and
// never forked from ctx.rng. (The exit collar is the site's own; it forks the flora stream three times where the site forks once.) No yield falls between two draws that other code could interleave with.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as Water from '../kit/water.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/kelp-cathedral.js';

const PALETTE = ['#e8f6c8', '#5fb89a', '#1f7f86', '#0d4a5c', '#062a38', '#a88f2e', '#ff8a3c'];
const SURF = 0;                       // sea surface
const FLOOR = -40;                    // aisle floor
// Water fog whose colour depends on where you look: gold-green toward the surface, deep teal toward the bottom.
// (Level gaze gives exactly scene.fog.color, so kit objects match; the backdrop dome draws the same gradient,
// so rock lost in the haze below eye level melts into the water instead of standing as a dark lump.)
const FOG_TINT = /* glsl */`
vec3 waterTint(float vy){ return mix(mix(vec3(1.), vec3(.56, .7, .9), smoothstep(0., .2, -vy)), vec3(1.5, 1.34, .78), smoothstep(0., .32, vy)); }
`;
// k: how far the thing is carried (1 = the water's own reach, 135 m; the exit arch and its buttresses use .55, so they stand
// in the haze as far as the portal's rim light does). dim: what the haze does to it on the way (rock goes DARKER than the
// water as it fades, a shape against the light, never a pale ghost; at the very end of its reach it is plain water).
const fogFrag = (level, k = '1.', dim = '1.') => /* glsl */`
#ifdef USE_FOG
  { float fk = ${k}, fdn = fogDensity*fk, ff = 1. - exp(-fdn*fdn*vFogDepth*vFogDepth);
    vec3 vd = vWorld - cameraPosition; float fd = length(vd), far = smoothstep(90./fk, 135./fk, fd);
    ff = max(ff, far);                                         // by true distance: beyond the water's reach nothing of ours is left,
    float vy = vd.y/max(fd, 1e-4);                             // and it fades to exactly what the backdrop draws there (no pale ghosts, no lumps)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor*waterTint(mix(vy, min(vy, 0.), max(far, ${level})))*(${dim}), ff); }
#endif
`;
// (small fish lose themselves in the water sooner than rock does: the far end of the school is a faint haze of fish, gone by 84 m,
// not a speckle of dark dashes over the sand)
const FOG_FRAG = fogFrag('0.'), FOG_FRAG_FISH = fogFrag('0.', '1.6'), FOG_FRAG_ROCK = fogFrag('.85', 'uFogK', 'mix(1., mix(.62, 1., far), rockK)');   // rock above eye level takes the level water colour: it stays solid and dark, not milky

// ------------------------------------------------------------------ giant kelp (custom: 35 m columns)
// One column = 2-3 stipes rising from a shared holdfast. Stipes that reach the surface bend over and trail a
// canopy along the current. Blades and gas bladders hang off the stipes and stream with the swell. Everything
// is positioned in the vertex shader from (s along the stipe, blade-local offset), so sway costs nothing on the CPU.
const KELP_VERT = /* glsl */`
attribute vec4 aA, aB, iBase, iRnd;      // aA = (s 0..1.3, stipe phase, stipe height factor, type 0 stipe 1 blade 2 bladder)
uniform float uTime;                      // aB = (azimuth, blade length, seed, blade width)
uniform vec4 uSwell;                      // xy direction, z amplitude (m), w angular speed
uniform vec2 uFlow;                       // mean current: the canopy streams this way
attribute vec2 iLean;                     // metres the top is pushed sideways (a column bowed over the aisle)
uniform vec3 uColBase, uColMid, uColTip;
varying vec3 vWorld, vN, vCol;
varying vec2 vUv;
varying float vThin, vCau, vSeed;
#include <fog_pars_vertex>
${flora.FLORA_CAUSTIC_GLSL}
vec3 stipe(float sN, float ph, float hk, out vec3 vel){
  float canopy = step(.97, hk)*step(0., iBase.w);
  float H = abs(iBase.w)*hk;
  float fb = sN < .8 ? sN : .8+.2*(1.-exp(-(sN-.8)*5.));
  float f = mix(sN/1.3, fb, canopy);
  float run = H*(sN-fb)*canopy;
  float phase = uTime*uSwell.w - dot(iBase.xz, uSwell.xy)*.05 + iRnd.y;
  float k = pow(max(f, 0.), 1.5), amp = uSwell.z*(.3+H/40.);
  vec2 side = vec2(-uSwell.y, uSwell.x);
  float a1 = phase - f*1.3, a2 = phase*.61 + iRnd.y*5. + f*2.2;
  vec2 sw = (uSwell.xy*sin(a1) + side*sin(a2)*.4)*amp*k;
  vel = vec3(uSwell.x,0.,uSwell.y)*cos(a1) + vec3(side.x,0.,side.y)*.4*cos(a2);
  float a = ph*2.4 + iRnd.x;
  vec2 root = vec2(cos(a), sin(a))*.5;
  vec2 wob = vec2(sin(sN*5.+ph*3.), cos(sN*4.3+ph*5.))*(.6+1.4*sN)*smoothstep(0.,.2,sN);
  vec2 fl = uFlow*run + vec2(-uFlow.y,uFlow.x)*sin(run*.3+ph*4.+uTime*.35)*run*.16 + uFlow*H*.06*f*f;
  float fl4 = f*min(hk, 1.); fl4 *= fl4;                                // lean by height above the holdfast: a short stipe stays by its column
  vec2 xz = root*(1.-.5*f) + wob + sw + fl + iLean*fl4*fl4;
  float bob = canopy*sin(uTime*.7 + run*.4 + iRnd.y)*.12*smoothstep(.85,1.1,sN);
  return vec3(iBase.x+xz.x, iBase.y + H*f - canopy*.3*smoothstep(.9,1.2,sN) + bob, iBase.z+xz.y);
}
void main(){
  vec3 vel; vec3 P = stipe(aA.x, aA.y, aA.z, vel);
  float type = aA.w; vec3 wp, n;
  vThin = 0.; vUv = vec2(0., 1.); vSeed = aB.z;
  if (type < .5) {
    wp = P + position; n = normalize(position + vec3(1e-4, 0., 0.));
    vCol = mix(uColMid, uColTip, .35 + .4*smoothstep(0., 1.1, aA.x))*1.5; vThin = .35;
  } else {
    float az = aB.x + iRnd.x;
    vec3 o = vec3(cos(az), 0., sin(az));
    // blades drape down and out from the stipe and trail in whatever the water is doing
    vec3 D = normalize(o*.42 + vec3(0., -.3, 0.) + vel*.7 + vec3(uFlow.x, 0., uFlow.y)*.72);
    vec3 S = normalize(cross(D, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.));      // D may be vertical: never a zero vector
    vec3 N = cross(S, D);
    if (type < 1.5) {
      float t = position.y, L = aB.y, w = t*5. - uTime*1.7 + aB.z*40.;
      float cup = position.x*position.x*aB.w*.5;                       // blades are a little troughed
      wp = P + D*(L*t+.75) - vec3(0., L*.2*t*t, 0.) + S*(position.x*aB.w) + N*(sin(w)*.09*L*t + sin(w*2.3+position.x*5.)*.05*aB.w - cup);
      n = normalize(N - D*(cos(w)*.45*t) + S*(position.x*1.1));
      vCol = mix(uColMid, uColTip, clamp(t*.75+.3*aB.z, 0., 1.));
      vCol = mix(vCol, uColMid*vec3(.72, 1.08, .6), .42*step(.66, fract(aB.z*13.7)))*(.84 + .4*fract(aB.z*7.3));   // older, greener blades among the gold
      vThin = 1.; vUv = vec2(position.x*2., t);
    } else {
      wp = P + D*(.1 + aB.w*1.45) + (S*position.x + D*(position.y*1.6) + N*position.z)*aB.w;
      n = normalize(S*position.x + D*position.y*.6 + N*position.z + vec3(0., 1e-4, 0.));
      vCol = uColTip*1.6; vThin = .5;
    }
  }
  vCol *= iRnd.z; vCol.r *= 1. + iRnd.w; vCol.b *= 1. - iRnd.w;
  vWorld = wp; vN = n;
  vCau = floraCaustic(wp.xz*.3 + wp.y*.05, uTime*.55);
  vec4 mvPosition = viewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const KELP_FRAG = /* glsl */`
uniform float uTime, uSurf;
uniform vec3 uSunDir, uSunCol, uSkyCol, uDeepCol;
varying vec3 vWorld, vN, vCol;
varying vec2 vUv;
varying float vThin, vCau, vSeed;
#include <fog_pars_fragment>
${FOG_TINT}
void main(){
  float edge = 0.;
  if (vThin > .9) {                    // blade outline: narrow at the bladder, broad, scalloped margin, pointed tip
    float t = clamp(vUv.y, 0., 1.);
    float prof = pow(max(sin(3.14159*pow(max(t, 0.), .62)), 0.), .5)*(.86 + .14*sin(t*33. + vSeed*60.)*sin(t*9.+vSeed*20.)) + .04;
    if (abs(vUv.x) > prof) discard;
    edge = smoothstep(.45, 1., abs(vUv.x)/prof);
  }
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.) N = -N;
  float att = exp(-max(uSurf - vWorld.y, 0.)*.032);
  float cau = vCau;
  float ndl = dot(N, uSunDir), front = max(ndl, 0.), back = max(-ndl, 0.)*vThin;
  // crinkled blade: dark midrib, ruffled margins, darker where it joins the stipe
  float rib = smoothstep(0., .16, abs(vUv.x)), ruffle = .5+.5*sin(vUv.y*37. + abs(vUv.x)*7. + vSeed*30.);
  vec3 alb = vCol*(.62+.38*rib)*(1.-.22*ruffle*step(.9, vThin))*(.55+.45*smoothstep(0., .35, vUv.y));
  vec3 amb = mix(uDeepCol + uSkyCol*.25, uSkyCol, N.y*.5+.5)*(.9+.6*att);
  vec3 sun = uSunCol*att*(.5+1.1*cau);
  // light coming through a blade: amber, strongest when the blade hangs between the eye and the sun
  // (stained glass: amber, thicker and darker along the midrib, the ruffled margin and toward the stipe, fine veins between)
  float vein = .5+.5*sin(abs(vUv.x)*24. - vUv.y*11. + vSeed*9.);
  float ribs = .5+.5*cos(abs(vUv.x)*31.);                              // fine ribs along the blade
  vec3 thru = pow(max(alb, vec3(0.)), vec3(.7))*vec3(1.34, .98, .3)*(1. - .16*edge)*(.86 + .14*vein)*(.9 + .1*ribs)*(.8 + .3*clamp(vUv.y, 0., 1.));
  float halo = pow(max(dot(-V, uSunDir), 0.), 2.5);
  vec3 col = alb*(1. - .1*edge)*(.93 + .07*ribs)*(amb + sun*front*.8) + thru*(sun*back*(.5+2.5*halo) + sun*.1*vThin + uSkyCol*att*.2*vThin);
  if (vThin < .4) col += alb*uSkyCol*.6;            // stipes are olive-amber rope, never black poles
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG}
}`;

// Template geometry for one column. lod 0 = near (3 stipes, bladders), 1 = far (2 stipes, fewer and bigger blades).
async function kelpColumnGeometry(rng, lod, pause) {
  const pos = [], A = [], B = [], idx = [];
  const stipes = lod ? 2 : 3, segs = lod ? 7 : 11, blades = lod ? 10 : 18;
  let n = 0;
  const v = (x, y, z, s, ph, hk, type, b0, b1, b2, b3) => { pos.push(x, y, z); A.push(s, ph, hk, type); B.push(b0, b1, b2, b3); return n++; };
  for (let k = 0; k < stipes; k++) {
    const ph = rng() * 6.283, hr = rng.range(0.55, 1.12), hk = k === 0 || hr > 0.9 ? 1 : hr;
    const r0 = lod ? 0.2 : 0.13;
    for (let j = 0; j <= segs; j++) {
      const s = 1.3 * j / segs, r = r0 * (1 - 0.5 * j / segs);
      for (let i = 0; i < 3; i++) { const a = i * 2.0944 + k; v(Math.cos(a) * r, 0, Math.sin(a) * r, s, ph, hk, 0, 0, 0, 0, 0); }
      if (j > 0) { const b = n - 6; for (let i = 0; i < 3; i++) { const i1 = (i + 1) % 3; idx.push(b + i, b + 3 + i, b + i1, b + i1, b + 3 + i, b + 3 + i1); } }
    }
    const nb = Math.round(blades * (0.6 + 0.4 * hk)), rows = lod ? 2 : 3;
    for (let b = 0; b < nb; b++) {
      const s = lerp(0.05, 1.29, Math.pow((b + rng()) / nb, 0.85)), az = rng() * 6.283, L = rng.range(4.5, 7.5) * (lod ? 1.3 : 1.08), W = L * rng.range(0.16, 0.22) * (lod ? 1.2 : 0.8), seed = rng();
      const base = n;
      for (let r = 0; r <= rows; r++) {
        const t = r / rows;                 // a plain strip: the fragment shader cuts the scalloped outline
        v(-0.5, t, 0, s, ph, hk, 1, az, L, seed, W); v(0.5, t, 0, s, ph, hk, 1, az, L, seed, W);
        if (r > 0) { const q = base + r * 2; idx.push(q - 2, q - 1, q, q, q - 1, q + 1); }
      }
      if (!lod && b % 2 === 0) {           // gas bladder where the blade joins the stipe: a fat golden olive
        const o = n, rad = rng.range(0.3, 0.4);
        for (const p of [[0, 1, 0], [0, -1, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]]) v(p[0], p[1], p[2], s, ph, hk, 2, az, L, seed, rad);
        for (let i = 0; i < 4; i++) { const a = o + 2 + i, b2 = o + 2 + (i + 1) % 4; idx.push(o, a, b2, o + 1, b2, a); }
      }
      if (b % 6 === 5) await pause();
    }
    await pause();
  }
  return { pos: new Float32Array(pos), A: new Float32Array(A), B: new Float32Array(B), idx: n > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), triangles: idx.length / 3 };
}

// items: [{ x, y, z, H (negative: does not reach the surface), yaw, phase, bright, hue, lx, lz (optional lean of the top, metres) }]
function makeKelpChunk(tpl, items, material) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(tpl.pos, 3));
  g.setAttribute('aA', new THREE.BufferAttribute(tpl.A, 4));
  g.setAttribute('aB', new THREE.BufferAttribute(tpl.B, 4));
  g.setIndex(new THREE.BufferAttribute(tpl.idx, 1));
  const ib = new Float32Array(items.length * 4), ir = new Float32Array(items.length * 4), il = new Float32Array(items.length * 2);
  const box = new THREE.Box3(), q = new THREE.Vector3();
  items.forEach((it, i) => {
    ib.set([it.x, it.y, it.z, it.H], i * 4); ir.set([it.yaw, it.phase, it.bright, it.hue], i * 4); il.set([it.lx || 0, it.lz || 0], i * 2);
    box.expandByPoint(q.set(it.x, it.y, it.z)); box.expandByPoint(q.set(it.x + (it.lx || 0), it.y + Math.abs(it.H), it.z + (it.lz || 0)));
  });
  g.setAttribute('iLean', new THREE.InstancedBufferAttribute(il, 2));
  g.setAttribute('iBase', new THREE.InstancedBufferAttribute(ib, 4));
  g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(ir, 4));
  g.instanceCount = items.length;
  g.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 22;
  const m = new THREE.Mesh(g, material); m.name = 'giant-kelp'; m.matrixAutoUpdate = false;
  return m;
}

// ------------------------------------------------------------------ sardine school (custom: splits around the camera)
// A long ribbon of fish streaming along the flight path itself (13 samples of it, joined by a Catmull-Rom curve in the
// shader). Where the ribbon sits is a function of path progress (uHead), so it meets the camera at u = 0.2 whatever the
// flight speed; a hole opens around uCam.
const FISH_VERT = /* glsl */`
attribute vec4 iA, iB;                 // iA = (lag m, lateral x, lateral y, seed)  iB = (size, phase, wander, radius 0..1)
uniform vec3 uPts[13], uCam;
uniform float uHead, uSpan, uTime, uHole;
varying vec3 vWorld, vN; varying float vUp, vSeed, vQ;
#include <fog_pars_vertex>
vec3 lane(float q){
  float x = clamp(q, 0., 1.)*12., fi = min(floor(x), 11.), f = x - fi; int k = int(fi);
  vec3 p0 = uPts[max(k - 1, 0)], p1 = uPts[k], p2 = uPts[k + 1], p3 = uPts[min(k + 2, 12)];
  return .5*(2.*p1 + (p2 - p0)*f + (2.*p0 - 5.*p1 + 4.*p2 - p3)*f*f + (3.*p1 - p0 - 3.*p2 + p3)*f*f*f);
}
vec3 fishPos(float q){
  vec3 C = lane(q);
  vec3 Tn = normalize(lane(q + .02) - lane(q - .02) + vec3(0., 0., -1e-4));
  vec3 S = normalize(cross(Tn, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), U = cross(S, Tn);
  float wave = sin(q*16. - uTime*.8), pinch = 1.+.45*sin(q*7.+1.3);
  // the whole river turns slowly about its own axis (faster inside): a tunnel of fish, their flanks to the lens as they pass
  float tw = q*26.*(1.25 - .5*iB.w) + uTime*.2, ct = cos(tw), st = sin(tw);
  vec2 o = vec2(iA.y*ct - iA.z*1.5625*st, (iA.y*st + iA.z*1.5625*ct)*.7);
  vec3 p = C + S*(o.x*pinch*(1.+.2*wave) + sin(uTime*.5+iA.w*31.)*iB.z + 1.2*sin(q*9.-uTime*.3))
             + U*(o.y*(1.-.15*wave) + cos(uTime*.37+iA.w*17.)*iB.z*.6 + 1.2*sin(q*6.+uTime*.21));
  vec3 d = p - uCam; float al = dot(d, Tn); vec3 pr = d - Tn*al; float rr = length(pr) + 1e-3;
  float R = uHole*exp(-al*al/220.);
  return p + pr/rr*(sqrt(max(rr*rr + R*R, 0.)) - rr);
}
void main(){
  float q = uHead + (iA.x + sin(uTime*.23 + iA.w*50.)*1.6)/uSpan;
  vec3 p = fishPos(q), pa = fishPos(q - .7/uSpan);
  vec3 Fw = normalize(pa - p + vec3(0., 0., 1e-4)), S = normalize(cross(Fw, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.)), U = cross(S, Fw);
  vec3 lp = position;
  lp.x += sin(uTime*11. + iB.y*6.283 - lp.z*9.)*.06*(.25 + max(0., .15-lp.z)*2.6);
  vec3 wp = p + (S*lp.x + U*lp.y + Fw*lp.z)*iB.x;
  vN = normalize(S*normal.x + U*normal.y + Fw*normal.z + vec3(0., 1e-4, 0.));
  vUp = position.y/.11; vSeed = iA.w + q*.5; vQ = q; vWorld = wp;
  vec4 mvPosition = viewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FISH_FRAG = /* glsl */`
uniform float uTime, uSurf;
uniform vec3 uSunDir, uSunCol, uSkyCol, uDeepCol, uTop, uBelly;
varying vec3 vWorld, vN; varying float vUp, vSeed, vQ;
#include <fog_pars_fragment>
${FOG_TINT}
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.) N = -N;
  float att = exp(-max(uSurf - vWorld.y, 0.)*.03);
  vec3 alb = mix(uBelly, uTop, smoothstep(-.35, .25, vUp));            // dark blue-green back over the upper half, mirror flank below
  alb *= 1. - .35*(1. - smoothstep(0., .12, abs(vUp - .15)));         // the dark lateral line
  alb = mix(alb, uBelly, .5*smoothstep(.12, .55, V.y));                // looked down on, a back takes the light off the surface: grey-silver on the sand, not black
  vec3 Hh = normalize(V + uSunDir);
  float flank = 1.-smoothstep(.1, .5, vUp);
  float fl = max(sin(uTime*2.6 - vQ*46. + vSeed*1.7), 0.), flash = .22 + 2.6*fl*fl*fl*fl;      // the flanks flash in waves that run down the school
  float spec = pow(max(dot(N, Hh), 0.), 40.)*6.*flank + pow(max(1.-abs(dot(N, V)), 0.), 2.)*.25*flank;
  // a mirror flank shows the water it faces: bright where it tilts up at the surface, with the flash wave over it
  float mirror = flank*(.35 + .65*smoothstep(-.3, .6, N.y))*(.55 + .9*fl*fl);
  vec3 amb = mix(uDeepCol, uSkyCol, N.y*.5+.5);
  vec3 col = alb*(amb*1.0 + uSunCol*att*(.2+max(dot(N, uSunDir), 0.))) + uBelly*(uSkyCol*1.5 + uSunCol*att*.5)*mirror*.6 + uSunCol*att*spec*flash*uBelly*1.5;
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG_FISH}
}`;
function fishGeometry() {
  const P = { nose: [0, 0, 0.5], top: [0, 0.11, 0.12], bot: [0, -0.1, 0.12], l: [0.06, 0, 0.12], r: [-0.06, 0, 0.12], tb: [0, 0, -0.34], tt: [0, 0.1, -0.5], tk: [0, -0.1, -0.5] };
  const tris = [['nose', 'top', 'l'], ['nose', 'l', 'bot'], ['nose', 'bot', 'r'], ['nose', 'r', 'top'], ['tb', 'l', 'top'], ['tb', 'bot', 'l'], ['tb', 'r', 'bot'], ['tb', 'top', 'r'], ['tb', 'tt', 'tk']];
  const pos = []; for (const t of tris) for (const k of t) pos.push(...P[k]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
function makeSardines(rng, count, shared, fogU) {
  const base = fishGeometry(), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', base.getAttribute('position')); g.setAttribute('normal', base.getAttribute('normal'));
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const lag = clamp(rng.gauss() * 24, -62, 62), a = rng() * 6.283, r = Math.pow(rng(), 0.6);
    iA.set([lag, Math.cos(a) * r * 5, Math.sin(a) * r * 3.2, rng()], i * 4);
    iB.set([rng.range(0.32, 0.5), rng(), rng.range(0.2, 0.5), r], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = count;
  const uniforms = { ...fogU, ...shared, uPts: { value: Array.from({ length: 13 }, () => new THREE.Vector3()) }, uCam: { value: new THREE.Vector3() },
    uHead: { value: 0.5 }, uSpan: { value: 100 }, uHole: { value: 3.5 }, uTop: { value: new THREE.Color('#10303c') }, uBelly: { value: new THREE.Color('#dfeee6') } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'sardines'; mesh.matrixAutoUpdate = false;
  base.dispose();
  return { object: mesh, uniforms, triangles: count * 9 };
}

// ------------------------------------------------------------------ sea bed, rock and timber: one cheap self-lit material
// Vertex colour broken up by value noise; sand ripples, grit and the drifting shadow of the canopy on flat ground;
// relief (it turns the normal too), bedding, crevices, rose crusts and an algae film on rock; plank seams, butt joints,
// wormholes and a felt of weed on timber (uWarm); hemisphere light that fades with depth, sun with the same caustic
// pattern the kelp and the kit plants use (up-facing surfaces only), rock undersides lit by the light bounced up off
// the sand (rippling), the shadow the vault throws, red absorbed with depth, scene fog.
const BED_VERT = /* glsl */`
varying vec3 vWorld, vN, vCol, vObj;
#include <fog_pars_vertex>
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix*p; n = mat3(instanceMatrix)*n;
  #endif
  vec4 w = modelMatrix*p;
  vWorld = w.xyz; vN = normalize(mat3(modelMatrix)*n + vec3(0., 1e-5, 0.)); vCol = color; vObj = position;
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BED_FRAG = /* glsl */`
uniform float uTime, uSurf, uSand, uGain, uWarm, uShade, uFogK;
uniform vec3 uSunDir, uSunCol, uSkyCol, uDeepCol, uGateDim;      // uGateDim = the vault's half length, half width, soffit height
uniform vec3 uExitCol; uniform vec4 uExit, uExitDir;              // the way out: its centre (xyz) and half width (w); the way it faces (xyz) and how fast its light thins with distance (w)
uniform vec4 uGate;                                               // the vault's centre (xz) and axis (xz): it throws a shadow back along the light
varying vec3 vWorld, vN, vCol, vObj;
#include <fog_pars_fragment>
${flora.FLORA_CAUSTIC_GLSL}
${FOG_TINT}
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h21(i), h21(i+vec2(1., 0.)), f.x), mix(h21(i+vec2(0., 1.)), h21(i+vec2(1., 1.)), f.x), f.y); }
float h31(vec3 p){ p = fract(p*vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1., 0., 0.)), f.x), mix(h31(i+vec3(0., 1., 0.)), h31(i+vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i+vec3(0., 0., 1.)), h31(i+vec3(1., 0., 1.)), f.x), mix(h31(i+vec3(0., 1., 1.)), h31(i+vec3(1., 1., 1.)), f.x), f.y), f.z);
}
// lumps, creases along the bedding, grain; broken into steps near the lens (q): flat beds with sharp risers, not dimples
// (nq, oq: how many steps and where they fall; each bed has its own, so the risers of one bed do not run on into the next)
float relief(vec3 p, float fine, float q, float nq, float oq){
  float r = 1. - abs(vn3(p*vec3(.85, 1.5, .85))*2. - 1.);
  float h = vn3(p*.5)*.48 + r*r*.24 + vn3(p*1.6)*.14;
  h = mix(h, (floor(h*nq + oq) - oq)/nq, q);
  return h + vn3(p*4.6)*.14*fine;
}
void main(){
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float dist = length(vWorld - cameraPosition), midK = 1. - smoothstep(18., 50., dist);
  vec2 q = abs(N.y) > .62 ? vWorld.xz : (abs(N.x) > abs(N.z) ? vWorld.zy : vWorld.xy);
  float rocky = (1. - smoothstep(.8, .97, N.y)*uSand)*(1.-uWarm);
  float m = rocky > .5 ? vn3(vWorld*.8)*.6 + vn3(vWorld*3.4)*.4 : vn(q*.8)*.6 + vn(q*3.4)*.4;
  vec3 alb = vCol*(.7+.6*m);
  float flatness = smoothstep(.88, .98, N.y)*uSand;
  float rip = sin(vWorld.x*2.2 + vWorld.z*1.0 + 3.*vn(vWorld.xz*.22));
  float grit = vn(vWorld.xz*6.3);
  alb *= 1. + flatness*(rip*.2 + .1 + smoothstep(.74, .92, grit)*.45 - (1. - smoothstep(.08, .3, grit))*.28);   // ripples, shell hash, dark grit
  alb *= mix(1., .68 + .5*vn(vWorld.xz*.12 + 3.), flatness);                                          // drifts of darker silt
  // bedding: 2 m cells, each split into two or three beds of unequal thickness (0.3 to 1.3 m); a few upright joints cut the
  // rock into blocks and every block has slipped a little, so the partings step across a joint (widths are taken here, outside the branch)
  float sb0 = vWorld.y*.5 + vn3(vWorld*.06)*1.9, sbw = max(.045, fwidth(sb0)*1.5), h0 = .5;
  float jc = dot(vWorld.xz, vec2(.31, .17)) + vn3(vWorld*.2)*.8, jw = max(.014, fwidth(jc)*1.5), sandK = 0.;
  if (rocky > .02) {
    // rock: relief in three scales (it also turns the normal, so the form reads in soft light), bedding, dark crevices,
    // rose crusts of coralline algae, a green film on upward faces. The fine scales fade with distance: no static.
    float fine = 1. - smoothstep(14., 40., dist), grainK = 1. - smoothstep(7., 20., dist);
    float stepK = .6*(1. - smoothstep(16., 42., dist));              // the steps melt back into soft relief before they could crawl
    float sb = sb0 + (h21(vec2(floor(jc), 3.)) - .5)*.3, bc = floor(sb), bf = fract(sb);
    float b1 = .2 + .3*h21(vec2(bc, 1.)), b2 = b1 + .18 + .42*h21(vec2(bc, 2.)), bi = step(b1, bf) + step(b2, bf);
    float bd = bf - (bi > 1.5 ? b2 : (bi > .5 ? b1 : 0.)), tone = h21(vec2(bc*3. + bi, 7.));   // height above the parting under this bed; the bed's own number
    vec3 pw = vec3(vWorld.x*.78, vWorld.y*1.6, vWorld.z*.78) + vec3(tone*5., 0., tone*3.);   // stretched along the bedding; every bed has its own grain
    float nq = 3. + 3.*tone, oq = fract(tone*7.3);
    h0 = relief(pw, fine, stepK, nq, oq);
    vec3 g = (vec3(relief(pw + vec3(.12, 0., 0.), fine, stepK, nq, oq), relief(pw + vec3(0., .12, 0.), fine, stepK, nq, oq), relief(pw + vec3(0., 0., .12), fine, stepK, nq, oq)) - h0)/.12;
    g = clamp(g, vec3(-2.2), vec3(2.2));
    g -= N*dot(g, N);
    N = normalize(N - g*(.95 + .55*fine)*mix(.62, 1., midK)*rocky);          // (further off the grain softens: beds and blocks, not a combed stripe)
    float strata = sin(vWorld.y*1.9 + 5.*vn3(vWorld*.25)), beds = sin(vWorld.y*5.7 + 4.*vn3(vWorld*.7) + tone*19.)*smoothstep(.35, .6, vn3(vWorld*vec3(.4, 1.5, .4)));   // laminae come and go
    float crev = smoothstep(.24, .46, h0);
    alb *= 1. + rocky*((vn3(vWorld*9.)-.5)*.25*grainK + (vn3(vWorld*2.6)-.5)*.3 + strata*.16 + beds*.1*fine);
    alb *= mix(1., mix(.74, .38+.62*crev, mix(.5, 1., midK)), rocky*.85);
    // beds: each a little lighter or darker than the next, a dark parting under every one (steep faces)
    float wallK = 1. - vN.y*vN.y, lineK = 1. - smoothstep(30., 75., dist);
    float brk = .25 + .75*smoothstep(.34, .56, vn3(vec3(vWorld.x*.42, sb*1.7, vWorld.z*.42) + tone*11.));        // a parting breaks off and picks up again
    alb *= mix(1., (.8 + .38*tone)*(1. - .56*lineK*brk*(1. - smoothstep(0., sbw, bd))*(.045/sbw)), rocky*wallK);   // the parting widens and fades with distance: no crawling hairlines
    float jr = floor(jc + .5);                                                                                   // joints: upright, a few metres apart, each showing over part of its height only
    alb *= 1. - .36*rocky*wallK*lineK*(1. - smoothstep(0., jw, abs(jc - jr)))*(.014/jw)*smoothstep(.42, .6, vn3(vec3(jr*7.31, vWorld.y*.22 + jr*3.7, 2.)));
    float crust = smoothstep(.6, .68, vn3(vWorld*.55 + 17.)*.75 + vn3(vWorld*2.1)*.25)*crev;
    float ledgeK = 5.333*uSand*(1. - uSand)*(1. - uWarm);          // 1 on rock that lies low in the sand, 0 on bare rock and on the bed
    alb = mix(alb, vec3(.4, .2, .27)*(.65+.7*m), rocky*crust*(.2 + .4*ledgeK));
    alb = mix(alb, alb*vec3(.7, 1.14, .68), rocky*smoothstep(.25, .8, N.y)*.32);
    // rock that lies low in the sand (uSand .25) wears a dusting of it on whatever faces up, patchy, thickest in the hollows
    float upK = smoothstep(.4, .92, vN.y);
    alb *= 1. - .4*ledgeK*upK*fine*smoothstep(.7, .8, vn3(vWorld*4.4 + 3.));                 // weather pits
    float dust = ledgeK*upK*(.1 + smoothstep(.36, .62, vn3(vWorld*.7 + 7.)*.7 + vn3(vWorld*2.3 + 2.)*.3) + .2*(1. - crev));
    sandK = clamp(dust, 0., .9);                                    // (where the sand lies on it, it is lit and tinted as the sand is)
    alb = mix(alb, vec3(.56, .49, .31)*(.75 + .5*m), sandK);
  }
  if (uWarm > .5) {                                            // old timber
    float girth = (abs(N.y) > .75 ? vObj.x : vObj.y)*3.3 + vn(vObj.zx*.4)*.35, pl = floor(girth), fp = fract(girth);   // planks run fore and aft: up the sides, across the deck
    float seam = smoothstep(0., .08, fp)*(1. - smoothstep(.92, 1., fp));
    float bz = fract(vObj.z*.21 + h21(vec2(pl, 3.))), joint = smoothstep(0., .025, bz)*(1. - smoothstep(.975, 1., bz));
    float worm = smoothstep(.8, .9, vn(vObj.xz*5. + pl*7.)*.6 + vn(vObj.zy*9.)*.4);
    float grain = .78 + .44*vn(vec2(vObj.z*1.3 + pl*13., girth*9.));
    alb *= grain*(.3+.7*seam*joint)*(1.-.6*worm)*(.75+.5*h21(vec2(pl, 9.)));
    float felt = clamp(smoothstep(.15, .7, N.y)*.6 + smoothstep(.45, .75, vn(q*.9))*.45, 0., 1.)*(.35 + .65*smoothstep(.3, .7, vn(q*2.7 + 4.)));
    alb = mix(alb, mix(vec3(.075, .15, .05), vec3(.2, .05, .045), smoothstep(.55, .8, vn(q*.37 + 9.)))*(.6+.9*m)*(.55+.45*seam*joint), felt*.8);   // green and red weed felt
  }
  float depth = max(uSurf - vWorld.y, 0.), att = exp(-depth*.028);
  float cau = floraCaustic(vWorld.xz*.3 + vWorld.y*.05, uTime*.55);
  float ndl = max(dot(N, uSunDir), 0.)*smoothstep(-.05, .35, N.y);
  // the canopy's shadow drifts over the floor with the swell
  float can = vn(vWorld.xz*.1 + vec2(uTime*.045, sin(uTime*.21)*.25))*.6 + vn(vWorld.xz*.29 - vec2(uTime*.07, 0.))*.4;
  float shadow = mix(1., smoothstep(.3, .62, can), uShade);
  // the vault of the gate keeps the sun off whatever lies under it (followed back along the light to the soffit)
  vec2 gd = vWorld.xz + uSunDir.xz/max(uSunDir.y, .25)*max(uGateDim.z - vWorld.y, 0.) - uGate.xy;
  float gate = (1. - smoothstep(uGateDim.x - 4., uGateDim.x + 3., abs(dot(gd, uGate.zw))))*(1. - smoothstep(uGateDim.y - 3., uGateDim.y + 3., abs(dot(gd, vec2(-uGate.w, uGate.z)))))*step(vWorld.y, uGateDim.z);
  shadow *= 1. - .82*gate;
  float rockK = (1.-uSand)*(1.-uWarm);                     // bare rock: form shading first (dark underside, sun-dappled top), lit cooler than the water
  float occ = mix(1., mix(.8 - .16*rockK, 1., smoothstep(-.75, .45, N.y)), 1.-uSand);         // undersides sit in shade, not in black
  // light under water is scattered from everywhere: shadowed faces sit in deep teal, never in black
  float sd = dot(N, uSunDir)*.5 + .5;                      // rock turned from the light is a dark shape against it;
  float nearK = 1. - smoothstep(10., 38., dist);           // close to the lens there is less water in between and its relief still reads
  vec3 amb = mix(uDeepCol*.8 + uSkyCol*.34*(1.-.6*uSand), uSkyCol*1.5, N.y*.5+.5)*(.5+.65*att)*mix(.62+.6*sd, mix(.4, .54, nearK)+.96*sd, rockK) + uDeepCol*(1.7 - 1.25*rockK)*(1.-uSand);
  vec3 L = amb*occ*(.72+.28*shadow) + uSunCol*att*ndl*(.4+1.7*cau)*shadow*(1. + .7*rockK + 2.6*uSand*rockK*nearK);   // (the last term: ledges on the sand, uSand .25, take the sun like the sand they lie in)
  // rock that faces down is lit from below: the glow of the sand and the caustics dancing on it, bounced up;
  // rock that faces away from the sun is filled by the bright water behind the viewer
  vec3 fillDir = normalize(vec3(-uSunDir.x, .45, -uSunDir.z));
  vec3 upDir = normalize(vec3(fillDir.x*.6, -1., fillDir.z*.6));                 // from the sand below, a little from the mouth behind
  // (down-facing rock only: on upright faces this bounce lit the shadow side to the water's own value, and the rock
  // went milky and then to nothing in the haze. A wall that faces away from the sun is a dark shape now.)
  float under = clamp(dot(N, upDir)*1.05 + .22, 0., 1.)*mix(mix(.12, .5, nearK), 1., 1. - smoothstep(-.55, -.05, N.y));
  float lap = pow(max(floraCaustic((vWorld.xz + vWorld.y*.3)*.42 + 5., uTime*.5), 0.), .6);
  // (a quiet ripple that follows the relief: the soffit stays dark stone with light moving on it, never a pale sheet)
  L += rockK*((uSkyCol*vec3(.7, .95, 1.25)*1.1 + uDeepCol*2.2 + uSunCol*vec3(1., .96, .7)*(.08 + .95*lap)*(.7 + .6*h0))*under*(.45+.55*att) + uSkyCol*(.1 + .2*midK*step(.9, uFogK))*max(dot(N, fillDir), 0.));
  // inside the vault: its jambs take the light that comes in at the two mouths and up off the sunlit sand (most low down and
  // toward the mouths, rippling), so a jamb seen from along the aisle is bedded rock with light on it, not a flat dark wedge
  vec2 gp = vWorld.xz - uGate.xy; float gax = abs(dot(gp, uGate.zw)), glat = abs(dot(gp, vec2(-uGate.w, uGate.z)));
  float inGate = (1. - smoothstep(uGateDim.x + 1., uGateDim.x + 5., gax))*(1. - smoothstep(uGateDim.y, uGateDim.y + 3., glat))*step(vWorld.y, uGateDim.z);
  float jamb = inGate*(1. - N.y*N.y)*smoothstep(1.5, 10., uGateDim.z - vWorld.y)*(.3 + .7*smoothstep(.1, 1., gax/max(uGateDim.x, 1.)));
  L += rockK*jamb*(uSkyCol*.4 + uDeepCol*.6 + uSunCol*vec3(1., .96, .7)*(.03 + .34*lap))*(.45 + 1.1*h0)*(.45 + .55*att);
  float lum = dot(L, vec3(.3, .46, .24));
  L = mix(L, lum*vec3(.97, .98, 1.13), .55*rockK*(1. - sandK));
  // the next world's light, let in at the opening of the exit arch: it falls on whatever is turned to the opening and stands on the
  // nave's side of it, most on what is nearest, and the rock's own relief breaks it (N is the relief's normal; h0 its height)
  vec3 te = uExit.xyz - vWorld; float de = max(length(te), .5), dOut = max(de - uExit.w, 0.);
  L += uExitCol*max(dot(N, te/de), 0.)*smoothstep(-1.5, 1.5, -dot(te, uExitDir.xyz))*(.5 + 1.1*h0)/(1. + dOut*dOut*uExitDir.w);
  L = mix(L, lum*vec3(1.16, 1., .74), .3*max(uSand, sandK));            // sand keeps some of its warmth
  L = mix(L, lum*vec3(1.2, .96, .68), .5*uWarm);            // old timber stays brown
  vec3 col = alb*L*uGain;
  col.r *= mix(1., mix(mix(mix(.6, .9, rockK), .9, flatness), 1., uWarm), 1.-exp(-depth*.05));
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG_ROCK}
}`;
function bedMaterial(shared, fogU, sand, side, gain = 1.25, warm = 0, shade = 0.5, fogK = 1) {
  return new THREE.ShaderMaterial({ vertexShader: BED_VERT, fragmentShader: BED_FRAG, fog: true, vertexColors: true, side,
    uniforms: { ...fogU, ...shared, uSand: { value: sand }, uGain: { value: gain }, uWarm: { value: warm }, uShade: { value: shade }, uFogK: { value: fogK } } });
}

// ------------------------------------------------------------------ white water and bubble trails
// Small soft bubbles born along a track. A bubble's age is (clock - its birth), where the clock is path progress u for the
// whale's breach (the plume grows and thins with the flight, not with the wall clock) and the sea lions' own clock
// for their trails (uPeriod > 0: the route is a loop, so each bubble is reborn every lap). Time only makes them shiver.
// A bubble never draws narrower than 1.6 pixels: far off it grows fainter instead of sparkling.
const PLUME_VERT = /* glsl */`
attribute vec4 aP, aR;                 // aP = birth position, birth clock   aR = drift x, drift z, size, seed
uniform float uU, uTime, uSurf, uPeriod, uPx;
uniform vec2 uLife, uGrow;         // uGrow: a bubble's size at birth and what it gains by the end of its life (times its own size)                    // shortest and longest life, in clock units
varying vec2 vUv; varying vec3 vWorld; varying float vA, vSeed;
#include <fog_pars_vertex>
void main(){
  float life = mix(uLife.x, uLife.y, fract(aR.w*7.31));
  float age = uU - aP.w; if (uPeriod > 0.) age = mod(age, uPeriod);
  float t = clamp(age/life, 0., 1.);
  float on = step(0., age)*step(age, life);
  vec3 p = aP.xyz;
  p.xz += aR.xy*sqrt(max(t, 0.))*(1.2 + 2.6*fract(aR.w*3.7)) + vec2(sin(uTime*1.3 + aR.w*40.), cos(uTime*1.1 + aR.w*23.))*.22;
  float sz = aR.z*(uGrow.x + uGrow.y*t);
  p.y = min(p.y + t*(2.5 + 6.5*fract(aR.w*13.3)) + sin(uTime*2.1 + aR.w*60.)*.14, uSurf - .15 - sz);
  vec4 mvPosition = viewMatrix*vec4(p, 1.);
  float grow = max(1., 1.6*max(-mvPosition.z, .1)/max(sz*uPx, 1e-3));
  mvPosition.xy += position.xy*sz*grow;
  vWorld = p; vUv = position.xy; vSeed = aR.w;
  vA = on*smoothstep(0., .1, t)*(1. - smoothstep(.6, 1., t))*smoothstep(1.5, 6., -mvPosition.z)/grow*(1. - smoothstep(uSurf - 1.6, uSurf - .5, p.y));   // they burst at the ceiling: no raft of blobs
  gl_Position = on > .5 ? projectionMatrix*mvPosition : vec4(2., 2., 2., 1.);      // unborn and spent bubbles are thrown off screen
  #include <fog_vertex>
}`;
const PLUME_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol; uniform float uSurf, uGain, uRing;
varying vec2 vUv; varying vec3 vWorld; varying float vA, vSeed;
#include <fog_pars_fragment>
${FOG_TINT}
void main(){
  float d = length(vUv); if (d > 1.) discard;
  float soft = 1. - smoothstep(0., 1., d); soft *= soft;
  float ring = smoothstep(.45, .8, d)*(1. - smoothstep(.8, 1., d));
  vec2 gq = vUv - vec2(-.3, .36); float glint = exp(-dot(gq, gq)*14.);            // the sun in every bubble
  float att = exp(-max(uSurf - vWorld.y, 0.)*.035);
  vec3 col = (uSkyCol*1.3 + uSunCol*att*(.4 + .3*smoothstep(-.2, .7, vUv.y)))*(.85 + .3*fract(vSeed*5.3))*uGain + uSunCol*att*glint*1.3*uGain;
  gl_FragColor = vec4(col, vA*clamp(soft*.42 + ring*uRing + glint*.6, 0., 1.));
  ${FOG_FRAG}
}`;
// The crown where she falls back in: one sheet just under the surface. A ragged wreath of foam runs outward over the ceiling
// (heaped on one side, nearly gone on the other, torn into clumps), a broken line of light at its front and a fainter one inside; the foam is thousands of small round bubbles (three sizes
// on jittered grids, melting into an even veil where they would be smaller than a pixel), never a solid mass.
const CROWN_VERT = /* glsl */`
varying vec2 vP; varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vP = position.xy; vec4 w = modelMatrix*vec4(position, 1.); vWorld = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CROWN_FRAG = /* glsl */`
uniform float uAge, uTime; uniform vec3 uSunCol, uSkyCol;
varying vec2 vP; varying vec3 vWorld;
#include <fog_pars_fragment>
${FOG_TINT}
float ch21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float dots(vec2 p, float s, float fill, float px){
  vec2 q = p*s, i = floor(q), f = fract(q) - .5;
  vec2 o = (vec2(ch21(i), ch21(i + 17.3)) - .5)*.5;
  float r = mix(.16, .4, ch21(i + 5.1));
  float d = step(ch21(i + 9.7), fill)*(1. - smoothstep(r*.4, r, length(f - o)));
  return mix(d, fill*.22, smoothstep(.2, .55, px*s));               // too small to draw: an even veil of the same weight
}
void main(){
  float r = length(vP), a = clamp(uAge, 0., 1.);
  float px = length(fwidth(vP));
  float ang = atan(vP.y, vP.x + 1e-5);
  float R = 2.5 + 13.*sqrt(max(a, 0.));                             // the ring runs outward on the ceiling
  float wob = .5*sin(ang*5. + 1.3) + .35*sin(ang*9. - 2.1 + uTime*.3);
  float x = r - R - wob*(1. + 2.*a), w = 1.1 + 2.6*a;
  float band = exp(-x*x/(w*w));                                     // the crown itself
  float inner = 1. - smoothstep(R*.25, R*.95, r);                   // churned water inside it, thinning
  float fade = smoothstep(0., .05, a)*(1. - smoothstep(.5, 1., a));
  // a wreath, not a ring: heaped on the side she fell toward, nearly gone on the other, torn into clumps between
  float side = smoothstep(-.55, .65, .8*sin(ang + 1.) + .45*sin(ang*3. + 2.) + .3*sin(ang*7. - uTime*.1));
  float clump = .16 + .84*smoothstep(-.3, .5, sin(vP.x*1.7 + 2.*sin(vP.y*1.1 + 1.))*sin(vP.y*1.9 + 2.*sin(vP.x*.8)));
  float fill = clamp(band*(1.25 - .7*a) + inner*(.75 - .7*a)*(1. - a), 0., 1.)*(.08 + .92*side)*clump;
  vec2 q = vP + vec2(sin(uTime*.5 + vP.y*.6), cos(uTime*.43 + vP.x*.6))*.12;      // the bubbles jostle
  float b = dots(q, 1.1, fill*.9, px) + dots(q + 7.7, 2.2, fill, px)*.8 + dots(q + 3.1, 4.4, fill, px)*.6;
  float torn = .35 + .65*smoothstep(-.3, .5, sin(ang*13. + 2.*sin(ang*3.) + uTime*.2)*.6 + sin(ang*29. - 1.7)*.4);   // the front is broken, not drawn with a compass
  float line = exp(-x*x/.16)*(1. - .6*a)*torn*(.15 + .85*side);
  float x2 = r - R*.55, second = exp(-x2*x2/(.06 + .3*a))*.4*(1. - a)*torn;
  float alpha = clamp(b*.8 + (line + second)*.11 + band*.1*(.2 + .8*side)*clump, 0., 1.)*fade*(1. - smoothstep(17., 19.5, r));
  gl_FragColor = vec4((uSkyCol*1.6 + uSunCol*.9)*(.58 + .2*line), alpha);          // foam in the shade of its own spray: just under the bloom
  ${FOG_FRAG}
}`;
// Shafts of light let down through the broken surface: a few soft blades hung from the crown along the light.
const SHAFT_VERT = /* glsl */`
attribute vec4 aS;                     // offset from the crown's centre (xz), length, seed
uniform vec3 uC, uDir; uniform float uAge, uTime, fogDensity;
varying vec2 vUv; varying float vK;
void main(){
  float a = clamp(uAge, 0., 1.);
  vec3 b = uC + vec3(aS.x, 0., aS.y)*(.5 + .9*sqrt(max(a, 0.)));
  vec3 p = b + uDir*(position.y*aS.z);
  vec3 side = normalize(cross(uDir, cameraPosition - p) + vec3(1e-4, 0., 0.));
  p += side*position.x*(.6 + 1.5*position.y)*(.8 + .6*fract(aS.w*7.));
  float d = length(p - cameraPosition);
  vUv = position.xy;
  vK = (.55 + .45*sin(uTime*(.6 + fract(aS.w*3.)) + aS.w*40.))*smoothstep(0., .08, a)*(1. - smoothstep(.45, .95, a))*exp(-fogDensity*fogDensity*d*d);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uCol; varying vec2 vUv; varying float vK;
void main(){ float e = 1. - abs(vUv.x); gl_FragColor = vec4(uCol*e*e*(1. - vUv.y)*smoothstep(0., .06, vUv.y)*vK, 1.); }`;
// The portal's rim light, drawn by the world so that the water can take it: the engine's own ring formula for a round
// opening, times a soft far glow (uFar) and a crisp rim (uRim) that the world fades in with the distance to the portal.
const RIM_VERT = /* glsl */`
varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const RIM_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uTime, uFar, uRim, uR;
varying vec2 vP;
float rh21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float rvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(rh21(i), rh21(i+vec2(1., 0.)), f.x), mix(rh21(i+vec2(0., 1.)), rh21(i+vec2(1., 1.)), f.x), f.y); }
void main(){
  // light in the water, never a line: far off a wide, soft bloom with the opening glowing whole in it; as the lens closes and the
  // rock round the opening shows the light itself (the rock's own shader), the bloom thins to a faint breath round the opening
  float d = length(vP) - uR, x = max(d, 0.)/uR;
  vec2 dir = vP/max(length(vP), 1e-4);
  float wisp = rvn(dir*2.6 + vec2(uTime*.2, x*5. - uTime*.7))*.6 + rvn(dir*5.7 - vec2(x*9. - uTime*.5, uTime*.15))*.4;   // no seam: looked up by direction, not by angle
  float bloom = (exp(-x*1.3)*.24 + exp(-x*3.5)*.1*(.4 + 1.2*wisp*wisp))*mix(1., .45, uRim);
  float whole = (.2 + .16*wisp)*(1. - uRim)*(1. - smoothstep(-.6, 0., d/uR*4.));
  gl_FragColor = vec4(uColor*(bloom + whole)*uFar, 1.);
}`;

// ------------------------------------------------------------------ lamps: the soft halo each anemone of the vault throws on the water round it
const GLOW_VERT = /* glsl */`
attribute vec4 aP, aC;                 // aP = position, radius   aC = colour, phase
uniform float uTime, fogDensity;
varying vec2 vUv; varying vec3 vC;
void main(){
  vec4 mv = viewMatrix*vec4(aP.xyz, 1.);
  float pulse = .72 + .28*sin(uTime*1.1 + aC.w*6.283), d = length(mv.xyz);
  mv.xy += position.xy*aP.w*(.85 + .15*pulse);
  mv.z += min(aP.w*.45, d*.3);                                   // toward the eye, so the rock it sits on does not cut it in half
  vUv = position.xy; vC = aC.rgb*pulse*exp(-fogDensity*fogDensity*d*d)*smoothstep(1., 4., d);
  gl_Position = projectionMatrix*mv;
}`;
const GLOW_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vC;
void main(){
  float d2 = dot(vUv, vUv); if (d2 > 1.) discard;
  float a = exp(-d2*7.)*(1. - d2)*(1. - d2) + .6*exp(-d2*70.);
  gl_FragColor = vec4(vC*a, 1.);
}`;

// ------------------------------------------------------------------ backdrop: the water body itself, darker below eye level
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.); }`;
const DOME_FRAG = /* glsl */`
uniform vec3 uCol; varying vec3 vDir;
${FOG_TINT}
void main(){ float vy = vDir.y/max(length(vDir), 1e-4); gl_FragColor = vec4(uCol*waterTint(min(vy, 0.)), 1.); }`;

// ------------------------------------------------------------------ floor life: sea stars and urchins (instanced, bed material)
function starGeometry() {                 // five tapering arms, domed; radius 1
  const pos = [], col = [], P = (x, y, z, k) => { pos.push(x, y, z); col.push(k, k, k); };
  const tri = (a, b, c) => { P(...a); P(...b); P(...c); };
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.2832, a0 = a - 0.63, a1 = a + 0.63, c = [0, 0.2, 0, 1], tip = [Math.cos(a), 0.03, Math.sin(a), 0.75];
    const l = [Math.cos(a0) * 0.3, 0.02, Math.sin(a0) * 0.3, 0.6], r = [Math.cos(a1) * 0.3, 0.02, Math.sin(a1) * 0.3, 0.6], mid = [Math.cos(a) * 0.45, 0.14, Math.sin(a) * 0.45, 1.1];
    tri(c, mid, l); tri(c, r, mid); tri(l, mid, tip); tri(mid, r, tip);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); return g;
}
function urchinGeometry(rng) {            // a dark test bristling with spines; radius 1
  const pos = [], col = [], P = (v, k) => { pos.push(v.x, v.y, v.z); col.push(k, k, k); };
  const ico = new THREE.IcosahedronGeometry(0.42, 0), ip = ico.getAttribute('position'), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < ip.count; i += 3) {
    a.fromBufferAttribute(ip, i); b.fromBufferAttribute(ip, i + 1); c.fromBufferAttribute(ip, i + 2);
    a.y = a.y * 0.7 + 0.3; b.y = b.y * 0.7 + 0.3; c.y = c.y * 0.7 + 0.3;
    P(a, 0.55); P(b, 0.55); P(c, 0.55);
    n.copy(a).add(b).add(c).multiplyScalar(1 / 3); if (n.y < 0.12) continue;
    const base = n.clone(), w = 0.07;
    t.set(rng.range(-0.3, 0.3), rng.range(-0.05, 0.3), rng.range(-0.3, 0.3));
    const tip = n.clone().setY(n.y - 0.3).normalize().add(t).normalize().multiplyScalar(rng.range(0.8, 1.05)); tip.y = Math.max(0.08, tip.y + 0.3);
    const s1 = new THREE.Vector3(w, 0, 0), s2 = new THREE.Vector3(0, 0, w);
    for (const s of [s1, s2]) { P(base.clone().sub(s), 0.7); P(base.clone().add(s), 0.7); P(tip, 1.5); }
  }
  ico.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); return g;
}

// ------------------------------------------------------------------ the wreck: keel, ribs and the last planks of a fishing boat
// Square, tapering, worm-eaten timbers (flat-shaded prisms), strakes still nailed to the ribs, a planked bow and
// foredeck so it reads as a boat. Built in local metres (the world scales it), in short steps.
async function buildWreck(rng, noise, pause) {
  const L = 17, Bm = 2.9, D = 3.0, N = 14, tri = [], tips = [], spots = [];
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2]), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const quad = (a, b, c, d) => tri.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
  const zAt = (i) => lerp(-L / 2 + 1.1, L / 2 - 1.3, i / (N - 1));
  const ribPt = (z, side, th, out = 1) => {
    const k = Math.max(0.03, 1 - Math.pow(Math.abs(2 * z / L), 2.2)), b = Bm * Math.pow(k, 0.55) * out, d = D * (0.72 + 0.28 * k);
    return [side * b * Math.sin(th), d * (1 - Math.cos(th)) + 0.15, z];
  };
  // a square timber along a polyline: w across (the side that faces away from ref), h along ref; tapering, eaten by noise
  const beam = (pts, w0, w1, h0, h1, ref, erode = 0.3) => {
    const n = pts.length, rings = [];
    for (let i = 0; i < n; i++) {
      const p = V(pts[i]), t = i / (n - 1), Tn = V(pts[Math.min(n - 1, i + 1)]).sub(V(pts[Math.max(0, i - 1)])).normalize();
      const S = new THREE.Vector3().crossVectors(Tn, ref); if (S.lengthSq() < 1e-6) S.crossVectors(Tn, X); S.normalize();
      const U = new THREE.Vector3().crossVectors(S, Tn);
      const e = 1 - erode * (0.5 + 0.5 * noise.n3(p.x * 1.7 + 3, p.y * 1.7, p.z * 1.7)), w = lerp(w0, w1, t) * 0.5 * e, h = lerp(h0, h1, t) * 0.5 * e;
      rings.push([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => p.clone().addScaledVector(S, sx * w * (1 + 0.16 * noise.n3(p.z * 3 + sx * 5, p.y * 3 + sy * 5, p.x * 3))).addScaledVector(U, sy * h)));
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; quad(rings[i][k], rings[i][k1], rings[i + 1][k1], rings[i + 1][k]); }
    quad(rings[0][3], rings[0][2], rings[0][1], rings[0][0]); quad(rings[n - 1][0], rings[n - 1][1], rings[n - 1][2], rings[n - 1][3]);
  };
  { const pts = []; for (let i = 0; i <= 8; i++) pts.push([0, 0.12 + 0.05 * noise.n2(i * 0.7, 3), lerp(-L / 2 - 0.3, L / 2 + 0.3, i / 8)]); beam(pts, 0.5, 0.5, 0.58, 0.58, Y, 0.15); }   // keel
  { const pts = []; for (let i = 0; i <= 6; i++) pts.push([0, 0.52, lerp(-L / 2 + 1.5, L / 2 - 2, i / 6)]); beam(pts, 0.34, 0.34, 0.26, 0.26, Y, 0.35); }                              // keelson
  await pause();
  const len = [];
  for (let i = 0; i < N; i++) {
    const z = zAt(i) + rng.range(-0.12, 0.12); len.push([]);
    for (const side of [-1, 1]) {
      const l = i >= N - 5 ? rng.range(0.97, 1.05) : side < 0 ? rng.range(0.78, 1.08) : (rng.chance(0.35) ? rng.range(0.25, 0.5) : rng.range(0.6, 1.05));   // the bow is still whole
      len[i].push(l);
      const pts = []; for (let j = 0; j <= 6; j++) pts.push(ribPt(z, side, (j / 6) * l * Math.PI / 2));
      beam(pts, 0.4, 0.2, 0.32, 0.18, Z); tips.push(pts[6]); if (i % 2 === 0) spots.push(pts[3]);
      await pause();
    }
    if (len[i][0] > 0.97 && len[i][1] > 0.93 && i % 2 === 0) {                           // a surviving deck beam
      const a = ribPt(z, -1, len[i][0] * Math.PI / 2), b = ribPt(z, 1, len[i][1] * Math.PI / 2), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.14, z];
      beam([a, [(a[0] + m[0]) / 2, (a[1] + m[1]) / 2 + 0.05, z], m, [(b[0] + m[0]) / 2, (b[1] + m[1]) / 2 + 0.05, z], b], 0.24, 0.24, 0.22, 0.22, Z, 0.25); spots.push(m);
    }
    await pause();
  }
  beam([[0, 0.1, L / 2 - 0.4], [0, 0.8, L / 2 + 0.2], [0, 1.6, L / 2 + 0.7], [0, 3.1, L / 2 + 1.2], [0, 4.4, L / 2 + 1.3]], 0.44, 0.3, 0.5, 0.3, X, 0.2);      // stem post
  await pause();
  beam([[0, 0.1, -L / 2 + 0.3], [0, 1.6, -L / 2 - 0.1], [0, 3.2, -L / 2 - 0.2]], 0.4, 0.28, 0.44, 0.3, X, 0.3);                                             // stern post
  beam([[-1.6, 0.5, -4.2], [-0.5, 1.1, -1.8], [0.6, 1.7, 0.6], [2, 2.2, 3.1], [3.4, 2.7, 5.6]], 0.44, 0.3, 0.44, 0.3, Y, 0.2);                               // fallen mast
  tips.push([0, 4.4, L / 2 + 1.3], [3.4, 2.9, 5.6], [0, 3.2, -L / 2 - 0.2]); spots.push([0.6, 1.9, 0.6], [0, 0.45, -3], [0, 0.45, 2.5], [0, 0.45, -6.5]);
  // strakes still nailed to the ribs (the fragment shader draws their seams, butts and wormholes); some have lost a plank
  const strake = (side, t0, t1, i0, i1) => {
    let pa = null, pb = null;
    for (let i = i0; i <= i1; i++) {
      const z = zAt(i), rag = i === i0 || i === i1 ? rng.range(-0.7, 0.5) : 0, a = V(ribPt(z + rag, side, t0 * Math.PI / 2, 1.06)), b = V(ribPt(z + rag * 0.4, side, t1 * Math.PI / 2, 1.06));
      if (pa && !(i > i0 + 1 && i < i1 && rng.chance(0.1))) quad(pa, pb, b, a);
      pa = a; pb = b;
    }
  };
  await pause();
  strake(-1, 0.1, 0.3, 1, 11); strake(-1, 0.34, 0.52, 3, 12); await pause(); strake(-1, 0.56, 0.72, 6, 10); strake(1, 0.08, 0.3, 2, 7); strake(1, 0.34, 0.5, 8, 12);
  await pause();
  // the bow section keeps its planking, a foredeck and both wales: enough hull for a boat silhouette
  for (const side of [-1, 1]) {
    strake(side, 0.06, 0.3, N - 5, N - 1); strake(side, 0.33, 0.55, N - 6, N - 1); strake(side, 0.58, 0.78, N - 5, N - 1); strake(side, 0.81, 0.99, N - 5, N - 1);
    await pause();
    const i0 = side < 0 ? 1 : N - 7, wale = [];
    for (let i = i0; i < N; i++) wale.push(ribPt(zAt(i), side, 0.76 * Math.PI / 2, 1.1));
    beam(wale, 0.2, 0.2, 0.3, 0.3, Y, 0.3);
    await pause();
  }
  strake(-1, 0.76, 0.93, 2, 8); strake(1, 0.56, 0.72, 4, 9); strake(-1, 0.02, 0.09, 0, N - 1); strake(1, 0.02, 0.07, 0, N - 1);
  { // foredeck: planks across the last ribs, a ragged break at its after edge
    const M = 7, rows = [];
    for (let i = N - 4; i < N; i++) {
      const z = zAt(i), a = ribPt(z, -1, 0.985 * Math.PI / 2, 0.97), b = ribPt(z, 1, 0.985 * Math.PI / 2, 0.97), row = [];
      for (let j = 0; j <= M; j++) { const t = j / M, br = i === N - 4 ? rng.range(-1.1, 0.6) : 0; row.push(new THREE.Vector3(lerp(a[0], b[0], t), lerp(a[1], b[1], t) + 0.12 * Math.sin(t * Math.PI), z + br)); }
      rows.push(row);
    }
    for (let i = 1; i < rows.length; i++) for (let j = 0; j < M; j++) if (!rng.chance(i === 1 ? 0.4 : 0.14)) quad(rows[i - 1][j], rows[i][j], rows[i][j + 1], rows[i - 1][j + 1]);   // planks have fallen in
    spots.push([0.8, rows[1][3].y + 0.05, rows[1][3].z], [-1, rows[2][2].y + 0.05, rows[2][2].z]);
  }
  await pause();
  const pos = new Float32Array(tri), col = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2], n = noise.fbm3(x * 0.9 + 7, y * 0.9, z * 0.9, 2) * 0.5 + 0.5, silt = smoothstep(0.9, 0.15, y) * 0.75;
    const k = 0.7 + 0.6 * n;                                                             // waterlogged wood, silted grey-gold near the sand
    col[i] = lerp(0.2 * k, 0.36, silt); col[i + 1] = lerp(0.135 * k, 0.32, silt); col[i + 2] = lerp(0.07 * k, 0.2, silt);
    if (i % 1500 === 0) await pause();
  }
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  await pause();
  g.computeVertexNormals();                                                              // not indexed: flat facets, hard timber edges
  return { geometry: g, tips, spots, length: L };
}

// ------------------------------------------------------------------ rock arches (custom: the vault of the gate and the exit arch)
// A thick band of rock swept along a half ellipse in the local XY plane (fly through along Z, origin at the base centre).
// Its section is a rounded slab, `thick` across (more in the legs) and `depth` long; lumps, creases and beds broken into
// steps, a soffit that is eaten back, flaring feet and a few planar breaks displace it. Indexed and smooth-shaded: the form comes from the relief (and
// from the rock shader's own), not from facets. opts: halfWidth and apex of the opening, thick, depth, sink, nu, nv, legK,
// cuts, innerShade (brightness of the rock on the side of the opening), asym (one pier stouter than the other, by this share), colA, colB. geometry.userData = { A, B, inner(p) }: the centre line's half axes; inner(p) is true for a local point
// on the side of the opening.
async function rockArchGeometry(rng, noise, o, pause) {
  const { halfWidth, apex, thick, depth, sink = 6, nu = 72, nv = 48, legK = 0.6, cuts = 9, innerShade = 1, asym = 0 } = o;
  const hrAt = (leg) => thick * 0.5 * (1 + legK * leg), A = halfWidth + hrAt(1), Bv = apex + thick * 0.5, ext = 0.1;
  const n0 = rng.range(0, 200), NV = (nu + 1) * nv;
  const P = new Float32Array(NV * 3), C = new Float32Array(NV * 3), O = new Float32Array(NV * 3), K = new Float32Array(NV), sec = [0, 0, 0, 0];
  const cA = new THREE.Color(o.colA || '#8a8690'), cB = new THREE.Color(o.colB || '#5c5a66');
  // rounded-rectangle outline, by arc length: p 0..1 from the middle of the inner side -> sec = [r, z, nr, nz]
  const section = (p, hr, hz) => {
    const rc = Math.min(hr, hz) * 0.72, lr = 2 * (hr - rc), lz = 2 * (hz - rc), arc = Math.PI / 2 * rc;
    let d = p * (2 * lr + 2 * lz + 4 * arc);
    const corner = (cr, cz, a0) => { const a = a0 - d / rc; sec[2] = Math.cos(a); sec[3] = Math.sin(a); sec[0] = cr + sec[2] * rc; sec[1] = cz + sec[3] * rc; };
    const side = (r, z, nr, nz) => { sec[0] = r; sec[1] = z; sec[2] = nr; sec[3] = nz; };
    if (d < lz / 2) return side(-hr, d, -1, 0); d -= lz / 2;
    if (d < arc) return corner(-hr + rc, hz - rc, Math.PI); d -= arc;
    if (d < lr) return side(-hr + rc + d, hz, 0, 1); d -= lr;
    if (d < arc) return corner(hr - rc, hz - rc, Math.PI / 2); d -= arc;
    if (d < lz) return side(hr, hz - rc - d, 1, 0); d -= lz;
    if (d < arc) return corner(hr - rc, -(hz - rc), 0); d -= arc;
    if (d < lr) return side(hr - rc - d, -hz, 0, -1); d -= lr;
    if (d < arc) return corner(-hr + rc, -(hz - rc), -Math.PI / 2); d -= arc;
    return side(-hr, -(hz - rc) + d, -1, 0);
  };
  for (let i = 0; i <= nu; i++) {
    const tt = i / nu, a = Math.PI * clamp((tt - ext) / (1 - 2 * ext), 0, 1), drop = sink * Math.max(0, ext - tt, tt - (1 - ext)) / ext;
    const ca = Math.cos(a), sa = Math.sin(a), leg = 1 - sa, cx = A * ca, cy = Bv * sa - drop;
    let nx = Bv * ca, ny = A * sa; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    // asym: the pier on the +x side is that much stouter and the other that much slighter, the crown between them leaning from one to
    // the other. The rock is added and taken on the OUTSIDE (the section is pushed out by what it gains), so the opening keeps its size
    const hr0 = hrAt(leg) * (1 + 0.16 * noise.n2(tt * 6 + n0, 1.7)), hr = hr0 * (1 + asym * ca), out = hr - hr0, hz = depth * 0.5 * (1 + 0.2 * leg + 0.12 * noise.n2(tt * 5 + n0, 9.3));
    for (let j = 0; j < nv; j++) {
      section(j / nv, hr, hz);
      const r = sec[0], z = sec[1], nr = sec[2], nz = sec[3], k = (i * nv + j) * 3;
      const x = cx + nx * (r + out), y = cy + ny * (r + out), ox = nx * nr, oy = ny * nr, oz = nz;                // oxyz: outward normal of the plain slab
      const big = noise.fbm3(x * 0.07 + n0, y * 0.07, z * 0.07, 3), mid = noise.fbm3(x * 0.2, y * 0.2 + n0, z * 0.2, 3);
      const sb = y * 0.46 + noise.n3(x * 0.06, y * 0.06, z * 0.06 + n0) * 1.5, kb = Math.floor(sb), fb = sb - kb;
      const hard = 0.3 + 0.7 * (Math.sin(kb * 12.9898 + n0) * 0.5 + 0.5), innerK = Math.max(0, -nr), wall = (1 - oy * oy) * (1 - innerK);
      const bed = ((fb < 0.22 ? fb / 0.22 : 1 - (fb - 0.22) * 0.85) - 0.62) * hard * 1.25 * wall;     // hard beds stand proud, soft ones are eaten back
      const rid = 1 - Math.abs(noise.n3(x * 0.16 + n0, y * 0.16, z * 0.16));
      let d = big * 2.4 + mid * 1.25 + (rid * rid - 0.5) * 0.9;
      d = lerp(d, Math.round(d / 0.8) * 0.8, 0.5) + bed + 1.5 * smoothstep(5, -1.5, y) * (1 - innerK) * (0.6 + 0.8 * (fb < 0.22 ? fb / 0.22 : 1 - (fb - 0.22) * 0.85));   // broken into steps; the feet flare, bed by bed
      d = d * (1 - 0.45 * innerK) - 0.55 * innerK;                                                 // the opening only ever gets bigger
      if (innerK > 0.3) d = Math.min(d, 0.6);
      // the jambs (the upright inner faces of the legs) are bedded too: the soft beds are eaten back into shelves up to 1.4 m deep,
      // so a jamb seen from along the aisle is stepped rock, not one flat slab (the opening only gets bigger)
      if (innerK > 0.3) { const jam = innerK * (1 - oy * oy) * smoothstep(-2, 1.5, y); d = Math.min(d + ((fb < 0.22 ? fb / 0.22 : 1 - (fb - 0.22) * 0.85) - 0.95) * hard * 1.5 * jam * (0.55 + 0.45 * rid), 0.6); }
      P[k] = x + ox * d; P[k + 1] = y + oy * d; P[k + 2] = z + oz * d; O[k] = ox; O[k + 1] = oy; O[k + 2] = oz; K[k / 3] = innerK;
      const shade = (0.8 + 0.2 * clamp(d / 1.5, -1, 1)) * (0.92 + 0.16 * hard) * lerp(1, innerShade, innerK), mixK = clamp(0.5 + 0.9 * noise.n3(x * 0.11, y * 0.3 + n0, z * 0.11), 0, 1);
      C[k] = lerp(cA.r, cB.r, mixK) * shade; C[k + 1] = lerp(cA.g, cB.g, mixK) * shade; C[k + 2] = lerp(cA.b, cB.b, mixK) * shade;
    }
    await pause();
  }
  // planar breaks: where a block has come away the rock is cut flat (outside faces only, never deeper than 1.7 m)
  for (let c = 0; c < cuts; c++) {
    let k0 = 0; for (let t = 0; t < 30; t++) { k0 = rng.int(0, NV - 1); if (K[k0] < 0.05 && P[k0 * 3 + 1] > 1) break; }
    let mx = O[k0 * 3] + rng.range(-0.55, 0.55), my = O[k0 * 3 + 1] + rng.range(-0.55, 0.55), mz = O[k0 * 3 + 2] + rng.range(-0.55, 0.55);
    const ml = Math.hypot(mx, my, mz) || 1, back = rng.range(0.4, 1.3), reach = rng.range(3.5, 7.5); mx /= ml; my /= ml; mz /= ml;
    const px = P[k0 * 3] - mx * back, py = P[k0 * 3 + 1] - my * back, pz = P[k0 * 3 + 2] - mz * back;
    for (let k = 0; k < NV * 3; k += 3) {
      if (K[k / 3] > 0.05) continue;
      const dx = P[k] - px, dy = P[k + 1] - py, dz = P[k + 2] - pz, s = dx * mx + dy * my + dz * mz;
      if (s <= 0 || dx * dx + dy * dy + dz * dz > reach * reach) continue;
      const e = Math.min(s * 0.85, 1.7); P[k] -= mx * e; P[k + 1] -= my * e; P[k + 2] -= mz * e;
      const f = 1 + 0.14 * Math.min(1, s); C[k] *= f; C[k + 1] *= f; C[k + 2] *= f;                 // a fresher, paler face
    }
    if (c % 2 === 1) await pause();
  }
  await pause();
  const idx = new Uint32Array(nu * nv * 6);
  for (let i = 0, w = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const j1 = (j + 1) % nv, a = i * nv + j, b = i * nv + j1, c = (i + 1) * nv + j, e = (i + 1) * nv + j1;
    idx[w++] = a; idx[w++] = b; idx[w++] = c; idx[w++] = b; idx[w++] = e; idx[w++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  await pause();
  g.computeVertexNormals();
  await pause();
  const probe = (Math.floor(nu / 2) * nv + Math.floor(nv / 2)) * 3 + 1;                            // the crown's outer side must face up
  if (g.getAttribute('normal').array[probe] < 0) {
    for (let w = 0; w < idx.length; w += 3) { const t = idx[w + 1]; idx[w + 1] = idx[w + 2]; idx[w + 2] = t; }
    g.index.needsUpdate = true; await pause(); g.computeVertexNormals(); await pause();
  }
  g.computeBoundingSphere();
  g.userData = { A, B: Bv, inner: (p) => (p.x * p.x) / (A * A) + (Math.max(p.y, 0) * Math.max(p.y, 0)) / (Bv * Bv) < 1, triangles: idx.length / 3 };
  return g;
}

// ------------------------------------------------------------------ a low bedded ledge breaking through the sand
// Two to four beds of unequal thickness, each a ragged plate with straight broken edges, stepping back from the one under it. The
// pile dips a few degrees, so its down-dip edge runs under the sand and its up-dip edge stands as a small scarp. Tops are flat and
// pale (they take the sun and the caustics like the sand they lie in), risers are steep and darker, with a dark foot. Footprint
// about `length` x 1 (radius 1 across), the sand line at y = lift, the lowest bed reaches 0.5 below it. userData.crown = the middle
// of the top bed. Each bed costs 9 x segments triangles.
function ledgeGeometry(rng, noise, o = {}) {
  const beds = o.beds ?? 3, M = o.segments ?? 18, len = o.length ?? 1.6, lift = o.lift ?? 0, dip = o.dip ?? rng.range(0.05, 0.13), dipDir = rng() * 6.283;
  const cTop = new THREE.Color(o.top ?? '#a8a293'), cSide = new THREE.Color(o.side ?? '#66626e'), cSandy = new THREE.Color('#b8a67a'), pos = [], colr = [], idx = [], sd = rng.range(0, 90);
  const push = (x, y, z, c, k) => { pos.push(x, y, z); colr.push(c.r * k, c.g * k, c.b * k); return pos.length / 3 - 1; };
  let y0 = -0.5, cx = 0, cz = 0, R = 1, scarp = 0; const crown = new THREE.Vector3();
  for (let b = 0; b < beds; b++) {
    const th = b === 0 ? 0.5 + rng.range(0.1, 0.24) : rng.range(0.07, 0.17), y1 = y0 + th, tone = rng.range(0.8, 1.1) * (b === 0 ? 1.06 : 0.94), cuts = [], ox = [], oz = [];
    for (let k = 0, n = rng.int(4, 6) + (o.cuts ?? 0); k < n; k++) { const a = rng() * 6.283; cuts.push(Math.cos(a), Math.sin(a), R * rng.range(0.5, 0.86)); }   // straight breaks: a plate with corners, not a disc
    for (let i = 0; i < M; i++) {
      const a = i / M * 6.283, ca = Math.cos(a), sa = Math.sin(a);
      const r = R * (0.86 + 0.2 * noise.n2(ca * 1.2 + sd + b * 7.1, sa * 1.2 - sd) + 0.07 * noise.n2(ca * 3.4 + sd, sa * 3.4 + b * 3.3));
      let x = ca * r, z = sa * r;
      for (let k = 0; k < cuts.length; k += 3) { const d = x * cuts[k] + z * cuts[k + 1] - cuts[k + 2]; if (d > 0) { x -= cuts[k] * d; z -= cuts[k + 1] * d; } }
      ox.push(cx + x * len); oz.push(cz + z);
    }
    // the bed's top: centre, an inner ring, the worn edge; then the riser on vertices of its own (a hard edge under the top):
    // a rounded lip, a slight batter, a dark foot tucked under the bed below
    // (the top is weathered: mottled from dark to pale, pitted, a little sand lying in its hollows)
    const topAt = (x, z, k, dy) => {
      const w = noise.n2(x * 1.7 + sd, z * 1.7 - sd + b * 5.7), w2 = noise.n2(x * 4.3 - sd, z * 4.3 + b * 3.1), low = smoothstep(0.05, -0.55, w + 0.4 * w2), kk = tone * k * lerp(0.7, 1.1, clamp(0.5 + 0.5 * w + 0.25 * w2, 0, 1));
      pos.push(x, y1 + dy + 0.06 * (w + 0.5 * w2) * (k > 1.05 ? 0.3 : 1), z);
      colr.push(lerp(cTop.r * kk, cSandy.r * tone, 0.7 * low), lerp(cTop.g * kk, cSandy.g * tone, 0.7 * low), lerp(cTop.b * kk, cSandy.b * tone, 0.7 * low)); return pos.length / 3 - 1;
    };
    const c0 = topAt(cx, cz, 1, 0.02), core = [], inner = [], edge = [], lipA = [], lipB = [], foot = [];
    for (let i = 0; i < M; i++) {
      const x = ox[i], z = oz[i];
      core.push(topAt(lerp(cx, x, 0.3), lerp(cz, z, 0.3), 1, 0.02));
      inner.push(topAt(lerp(cx, x, 0.62), lerp(cz, z, 0.62), 1, 0.02));
      edge.push(topAt(lerp(cx, x, 0.94), lerp(cz, z, 0.94), 1.08, 0));
    }
    for (let i = 0; i < M; i++) {
      const x = ox[i], z = oz[i];
      lipA.push(push(lerp(cx, x, 0.94), y1, lerp(cz, z, 0.94), cSide, tone * 1.25));
      lipB.push(push(x, y1 - Math.min(0.07, th * 0.4), z, cSide, tone));
      foot.push(push(lerp(cx, x, 1.05), y0 - 0.06, lerp(cz, z, 1.05), cSide, tone * 0.62));
    }
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      idx.push(c0, core[j], core[i], core[i], core[j], inner[j], core[i], inner[j], inner[i], inner[i], inner[j], edge[j], inner[i], edge[j], edge[i]);
      idx.push(lipA[i], lipA[j], lipB[j], lipA[i], lipB[j], lipB[i], lipB[i], lipB[j], foot[j], lipB[i], foot[j], foot[i]);
    }
    crown.set(cx, y1, cz);
    if (b === 0) scarp = rng() * 6.283;                                                                      // the side all the beds break off on
    const Rn = R * rng.range(0.64, 0.84), sh = (R - Rn) * rng.range(0.8, 1.0), sa2 = scarp + rng.range(-0.35, 0.35);   // the next bed: smaller, flush with the scarp, a broad step on the other side
    cx += Math.cos(sa2) * sh * len * 0.8; cz += Math.sin(sa2) * sh * 0.8; R = Rn; y0 = y1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  const tilt = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(dipDir), 0, Math.sin(dipDir)), dip).setPosition(0, lift, 0);
  g.applyMatrix4(tilt); g.computeVertexNormals(); g.userData.crown = crown.applyMatrix4(tilt);
  return g;
}

// ------------------------------------------------------------------ sea lion: a sleek torpedo with long fore flippers (kit swimmer shader)
function sealionGeometry(L) {
  const g = new F.Geo(), top = new THREE.Color('#8a6a48'), bel = new THREE.Color('#d8b488'), fin = new THREE.Color('#4a382a');
  const R = [[0.5, 0, 0, 0], [0.478, 0.004, 0.026, 0.024], [0.435, 0.012, 0.05, 0.05], [0.375, 0.016, 0.058, 0.06], [0.3, 0.01, 0.055, 0.058], [0.2, 0, 0.08, 0.086],
    [0.08, -0.004, 0.1, 0.106], [-0.06, -0.004, 0.097, 0.1], [-0.2, 0, 0.077, 0.08], [-0.33, 0.004, 0.05, 0.05], [-0.43, 0.006, 0.026, 0.024], [-0.5, 0.006, 0, 0]];
  const body = g.loft(R.map(([z, y, rx, ry]) => ({ z: z * L, y: y * L, rx: rx * L, ry: ry * L })), { sides: 10, top, belly: bel, shade: [-0.5, 0.3] });
  g.anim(body, () => [0, 0, 0, 0]);
  const root = new THREE.Vector3(0.085 * L, -0.05 * L, 0.1 * L), d = new THREE.Vector3(0.72, -0.42, -0.55).normalize(), FL = 0.34 * L, le = [], te = [], cl = [], ct = [], q = new THREE.Vector3();
  for (let i = 0; i <= 5; i++) {
    const t = i / 5, chord = 0.09 * L * (1 - 0.62 * t) * (0.75 + 0.25 * Math.sin(Math.min(1, t * 1.3 + 0.1) * Math.PI));
    q.copy(root).addScaledVector(d, t * FL); q.z -= t * t * 0.05 * L;
    le.push([q.x, q.y, q.z + chord * 0.4]); te.push([q.x, q.y - 0.004 * L, q.z - chord * 0.6]); cl.push(fin.clone()); ct.push(fin.clone().multiplyScalar(0.8));
  }
  const pf = g.strip(le, te, cl, ct);
  g.anim(pf, (x, y, z) => [clamp(q.set(x, y, z).sub(root).dot(d) / FL, 0, 1), 1, 1, 0]); g.pivot(pf, root.x, root.y, root.z); g.mirror(pf);
  const hf = g.strip([[0.012 * L, 0.006 * L, -0.43 * L], [0.03 * L, 0.004 * L, -0.55 * L], [0.046 * L, 0, -0.67 * L]], [[0.0, 0.006 * L, -0.45 * L], [0.006 * L, 0.004 * L, -0.57 * L], [0.014 * L, 0, -0.68 * L]], [fin, fin, fin], [fin, fin, fin]);
  g.anim(hf, (x, y, z) => [0, 0, 0, clamp((-0.43 * L - z) / (0.25 * L), 0, 1) * 0.7]); g.mirror(hf, 0);
  return g.build();
}

// table lookup with smooth (Catmull-Rom) interpolation: rows [x, a, b, c, ...], col picks a..c
function tabAt(Tb, x, col) {
  const n = Tb.length;
  if (x <= Tb[0][0]) return Tb[0][col];
  if (x >= Tb[n - 1][0]) return Tb[n - 1][col];
  let i = 0; while (i < n - 2 && x > Tb[i + 1][0]) i++;
  const x0 = Tb[i][0], x1 = Tb[i + 1][0], y0 = Tb[i][col], y1 = Tb[i + 1][col], h = x1 - x0, t = (x - x0) / h;
  const m0 = i > 0 ? (y1 - Tb[i - 1][col]) / (x1 - Tb[i - 1][0]) : (y1 - y0) / h, m1 = i < n - 2 ? (Tb[i + 2][col] - y0) / (Tb[i + 2][0] - x0) : (y1 - y0) / h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
}

export default {
  id: 'kelp-cathedral',
  name: 'Kelp Cathedral',
  category: 'ocean',
  media: ['underwater'],
  weirdness: 0.1,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, pause = () => ctx.yield();
    const rx = ctx.core.makeRng(((ctx.seed | 0) * 7919 + 1234567) >>> 0);   // a second stream for later additions: the first keeps every older draw where it was
    const ry = ctx.core.makeRng(((ctx.seed | 0) * 104729 + 7654321) >>> 0);   // a third, for the meadows and the rock rib of the open sand
    const rn = ctx.core.makeRng(((ctx.seed | 0) * 32452843 + 1357911) >>> 0);   // a fifth, for the cast the first stream never knew (the reef's garibaldi, the nave's jellies, the ray, where the rib breaks through)
    // streams of their own, made from the seed and a name (they draw nothing from any parent): the ledge groups of the rock rib, the
    // reef head's place, its rocks' turns and its corals, the meadows, the blocks at the vault's feet, the places of the nave's jellies,
    // the vault's lamps (their picks on the rock and their growth)
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('kelp-cathedral/' + name + ':' + ctx.seed));
    const rRib = stream('rock-rib'), rReef = stream('reef-head'), rMeadow = stream('meadows'), rFeet = stream('vault-feet'), rNave = stream('nave-jellies'), rLamp = stream('vault-lamps');
    const vary = ctx.vary || {}, detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
    const lush = clamp(vary.density ?? 1, 0.7, 1.3), vmood = clamp(vary.mood ?? 0.5, 0, 1), rare = !!vary.rare;
    const scene = new THREE.Scene();
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---------------------------------------------------------------- per-seed character (and the viewer's wishes: ctx.vary)
    let mood = rng.pick(['noon', 'gold', 'emerald']);
    if (vary.hour === 'golden' || vary.hour === 'dawn') mood = 'gold'; else if (vary.hour === 'day') mood = 'noon'; else if (vary.hour === 'night') mood = 'emerald';
    const M = {
      noon:    { el: 1.1,  fog: '#0f5266', dens: 0.0112, sun: '#e8f6c8', rays: 1.0,  kelp: 0.0,   exposure: 1.1,  sky: '#8fcfc4' },
      gold:    { el: 0.8,  fog: '#14585e', dens: 0.0122, sun: '#f8e6a0', rays: 1.35, kelp: 0.14,  exposure: 1.15, sky: '#a0cfae' },
      emerald: { el: 0.96, fog: '#0f5c60', dens: 0.0134, sun: '#d8f8c0', rays: 0.85, kelp: -0.04, exposure: 1.1,  sky: '#86d2b4' },
    }[mood];
    const fogDens = M.dens * lerp(0.93, 1.08, vmood), rayK = M.rays * lerp(1.18, 0.86, vmood);   // mood: clear and raked with light .. thick and still
    const bend = rng.sign() * rng.range(0.6, 1.25);                      // which way and how much the nave curves
    const sunAz = rng.range(-0.5, 0.5);
    const swellAng = rng.range(0, Math.PI * 2), swellAmp = rng.range(1.1, 2.1);
    const flowAng = rng.range(-0.7, 0.7) + (rng.chance(0.5) ? 0 : Math.PI);   // canopy streams roughly along or against the nave
    const wreckSide = rng.sign();
    const fogCol = col(M.fog);

    // ---------------------------------------------------------------- the flight
    const B = bend;
    const path = makePath([[0, -22.6, 0], [1.6 * B, -20.4, -30], [4.2 * B, -16, -62], [8.5 * B, -25.5, -112], [9.5 * B, -30.6, -162], [5 * B, -29.4, -215],
      [-1.5 * B, -28.8, -270], [-6 * B, -27.6, -325], [-8 * B, -27, -385], [-8 * B, -27.4, -450], [-8 * B, -28, -520]]);
    const LP = path.length, near = T.pathNearest(path), DUR = 50;
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    // point in path space: s metres along, lat metres to the right, at height y
    const onPath = (s, lat, y, out = new THREE.Vector3()) => {
      path.posAtDist(s, out); path.tangentAtDist(s, tmp);
      const l = Math.hypot(tmp.x, tmp.z) || 1; out.x += (-tmp.z / l) * lat; out.z += (tmp.x / l) * lat; if (y !== undefined) out.y = y; return out;
    };
    const yawAt = (s) => { path.tangentAtDist(s, tmp); return Math.atan2(-tmp.x, -tmp.z); };
    const end = path.end.clone();
    const ARCH1_S = LP * 0.775, arch1 = onPath(ARCH1_S, 0), WRECK_S = LP * 0.33, wreckP = onPath(WRECK_S, wreckSide * 14.5);
    // the camera lingers under the whales and at the breach, and hurries a little down the first stretch of nave
    const pace = (u) => 1 + 0.14 * smoothstep(0.03, 0.08, u) * (1 - smoothstep(0.12, 0.17, u)) - 0.42 * smoothstep(0.4, 0.47, u) * (1 - smoothstep(0.69, 0.75, u))
      - 0.24 * smoothstep(0.765, 0.8, u) * (1 - smoothstep(0.85, 0.9, u));

    // ---------------------------------------------------------------- the whales' track (keyed to u, never to time)
    // Part A, rows [u, metres AHEAD of the camera, metres right of the aisle, depth]: diagonal in from the right, over the lens
    // in the middle of the pass, then she pulls ahead and leads; then she climbs over the vault and leaves through the surface.
    // Her lead over the lens is never under WHALE_LEAD metres, one number for the whole pass: far enough ahead that the lens,
    // looking up at her, takes her in from nose to flukes.
    const TA = [[0.30, 78, 78, -9], [0.36, 54, 46, -10], [0.40, 37, 25, -11.5], [0.44, 21, 9.5, -12.4], [0.48, 16.5, 3, -12.8], [0.52, 15, 0.5, -13], [0.56, 18, 0, -13.2],
      [0.60, 23, -1, -13.5], [0.64, 27, -1.5, -13.2], [0.68, 31, -1, -10.5], [0.71, 34, 0, -6], [0.735, 38, 0, -0.4], [0.76, 42, 0, 3]];
    const WHALE_LEAD = 21, leadAt = (u) => { const a = tabAt(TA, u, 1); return 0.5 * (a + WHALE_LEAD + Math.hypot(a - WHALE_LEAD, 2)); };
    // Part B, rows [u, position along the path as a fraction of its length, metres right, depth]: she falls back in ahead of the
    // camera beyond the arch, levels out and idles over the chancel, so the camera passes beneath her on its way to the portal.
    const TB = [[0.77, 0.863, 3.5, 3], [0.785, 0.872, 4, -0.5], [0.80, 0.886, 5, -7], [0.82, 0.898, 6.5, -12.5], [0.84, 0.907, 8, -14.6], [0.87, 0.917, 9, -14.8],
      [0.90, 0.927, 9, -14], [0.95, 0.943, 8, -13], [1.0, 0.958, 7, -12.5]];
    const U_IN = 0.785;                                   // where the lens is when she falls back in through the surface
    const whaleAt = (u, out = new THREE.Vector3()) => (u < 0.765
      ? onPath(u * LP + leadAt(u), tabAt(TA, u, 2), tabAt(TA, u, 3), out)
      : onPath(tabAt(TB, u, 1) * LP, tabAt(TB, u, 2), tabAt(TB, u, 3), out));
    const track = [];                                                    // ground track: kelp and stacks keep off it
    // (the kelp parts where she swims: no column within WHALE_GAP metres of the line she comes down along)
    const WHALE_GAP = 16;
    for (let u = 0.31; u <= 0.6; u += 0.008) { const p = whaleAt(u); track.push(p.x, p.z, 8.5); }
    const trackA = track.length;                                         // (the rest is her line over the chancel)
    for (let u = 0.785; u <= 1; u += 0.012) { const p = whaleAt(u); track.push(p.x, p.z, 7); }
    // where the whales come in over the lane: the first place her ground track lies inside the aisle (the design's aisle, 25 m wide)
    let ENTRY_S = LP; for (let u = 0.31; u < 0.6; u += 0.002) { const p = whaleAt(u), n = near(p.x, p.z); if (n.dist < 12.5) { ENTRY_S = n.u * LP; break; } }
    const offTrack = (x, z, pad, padA = pad) => { for (let i = 0; i < track.length; i += 3) if (Math.hypot(x - track[i], z - track[i + 1]) < track[i + 2] + (i < trackA ? padA : pad)) return false; return true; };

    // ---------------------------------------------------------------- light and water
    const sunDir = new THREE.Vector3(Math.sin(sunAz) * Math.cos(M.el), Math.sin(M.el), -Math.cos(sunAz) * Math.cos(M.el)).normalize();   // above and ahead
    const light = Water.waterLight('noon', { sunDir, sunColor: M.sun, sunIntensity: 3.4, zenith: '#8fd4c0', mid: '#c2ead6', horizon: '#e4f6dc', fogColor: M.fog });
    const vents = [];
    for (let i = 0; i < 9; i++) { const p = onPath(rng.range(0.04, 0.98) * LP, rng.sign() * rng.range(5, 16)); vents.push([p.x, FLOOR + 0.5, p.z]); }
    vents.push([wreckP.x, FLOOR + 1.5, wreckP.z]);
    const uw = Water.makeUnderwater({ rng: rng.fork('uw'), light, surfaceY: SURF, floorY: FLOOR, water: '#6aa9a2', deep: PALETTE[4], fogDensity: fogDens, absorption: 0.04,
      rayIntensity: rayK * 1.2, rays: { count: 90, range: 240, width: 3.4 }, chop: rng.range(0.75, 1.35),
      particles: { count: Math.round(950 * detail), range: 46, size: 0.055, color: PALETTE[0], glowColor: PALETTE[0], glowFraction: 0.015, glowIntensity: 1.3 },
      bubbles: { count: Math.round(260 * detail), size: 0.085, sources: vents } });
    scene.add(uw.object);
    scene.fog = new THREE.FogExp2(fogCol.clone(), fogDens);
    scene.background = fogCol.clone();
    const keepWater = () => { uw.volumeColor.copy(fogCol); uw.fog.color.copy(fogCol); uw.background.copy(fogCol); };
    uw.update(0, 0, null); keepWater();
    const toLight = uw.rayDir.clone().negate();                          // toward the light, as seen under water
    const hemi = new THREE.HemisphereLight(col(M.sky), col('#0c3c46'), 2.2);
    const sun = new THREE.DirectionalLight(col(M.sun), 2.3); sun.position.copy(toLight).multiplyScalar(100);
    scene.add(hemi, sun, sun.target);
    const shared = { uTime: { value: 0 }, uSurf: { value: SURF }, uSunDir: { value: toLight }, uSunCol: { value: col(M.sun, 1.45) },
      uSkyCol: { value: col(M.sky, 0.5) }, uDeepCol: { value: col(PALETTE[3], 0.46) },
      uGate: { value: new THREE.Vector4(0, 0, 0, -1) }, uGateDim: { value: new THREE.Vector3(1, 1, -1000) },
      uExit: { value: new THREE.Vector4(0, -1000, 0, 1) }, uExitDir: { value: new THREE.Vector4(0, 0, 1, 1) }, uExitCol: { value: new THREE.Color(0, 0, 0) } };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const faunaLight = { sunDir: toLight.clone(), sunColor: M.sun, sunIntensity: 2.4, sky: M.sky, skyIntensity: 1.5, ground: '#0f4652', groundIntensity: 1.0 };
    // backdrop: the same gaze-dependent gradient the fog fades to, drawn behind everything (it rides on cameraPosition in its shader)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 20, 10), new THREE.ShaderMaterial({ vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, uniforms: { uCol: { value: fogCol } },
      side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false }));
    dome.renderOrder = -10; dome.frustumCulled = false; dome.name = 'water-backdrop'; scene.add(dome);
    await pause();

    // ---------------------------------------------------------------- sea bed: sandy aisle, rock terraces either side, rising toward the exit
    const n0 = rng.range(0, 500);
    const baseH = (x, z) => {
      const n = near(x, z), d = n.dist;
      const w = noise.fbm2(x * 0.011 + n0, z * 0.011, 3);
      const dd = Math.max(0, d - 9.5 + w * 6 + noise.fbm2(x * 0.09, z * 0.09 + n0, 3) * 4) * 0.3, k = Math.floor(dd / 5), f = dd / 5 - k;   // ragged, sloping risers
      let h = FLOOR + 3.6 * smoothstep(0.5, 1, n.u) + (k + 0.7 * smoothstep(0.3, 1, f) + 0.3 * f) * 5;
      h += noise.ridged2(x * 0.028 + n0, z * 0.028, 3) * 6.5 * smoothstep(9, 42, d) - 1.5 * smoothstep(9, 42, d);
      h += noise.fbm2(x * 0.07, z * 0.07 + n0, 3) * 0.7 + Math.sin(x * 1.1 + z * 0.35 + noise.n2(x * 0.05, z * 0.05) * 4) * 0.07;
      const wx = x - wreckP.x, wz = z - wreckP.z; h += 1.1 * Math.exp(-(wx * wx + wz * wz) / 170);                    // silt banked up round the wreck
      return Math.min(h, -6);
    };
    const cSand = col('#cfc09a'), cRock = col('#4a4a56'), cRock2 = col('#66626c'), cRed = col('#6a2c3a'), cGreen = col('#3e6a38'), cGold = col('#7a6a2a');
    const groundColor = (x, z, h, ny, out) => {
      const d = near(x, z).dist, n1 = noise.fbm2(x * 0.05 + 31, z * 0.05, 3), n2 = noise.fbm2(x * 0.16, z * 0.16 + 57, 2);
      const rocky = clamp(smoothstep(7.5, 18, d + n1 * 8) * 0.8 + smoothstep(0.93, 0.72, ny), 0, 1);
      out.copy(cSand).multiplyScalar((0.85 + 0.2 * n2) * (1 - 0.3 * smoothstep(7, 13.5, d)));                             // sand darkens under the kelp rows
      out.lerp(cRock, rocky).lerp(cRock2, rocky * smoothstep(-0.2, 0.6, n2) * 0.6);
      out.lerp(cRed, smoothstep(0.15, 0.6, n1 + n2 * 0.5) * rocky * 0.55).lerp(cGreen, smoothstep(0.1, 0.55, -n1 + n2 * 0.4) * (0.25 + 0.4 * rocky)).lerp(cGold, smoothstep(0.35, 0.8, n2) * 0.25);
      return out;
    };
    const bedMat = bedMaterial(shared, fogU(), 1, THREE.FrontSide, 1.25, 0, 0.62), dummyTex = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
    const landOpts = { rng: rng.fork('land'), noise, path, height: baseH, color: groundColor, biome: 'lunar', detailTexture: dummyTex, materialInstance: bedMat,
      bounds: [Math.min(0, -8 * B, 9.5 * B) - 125, end.z - 70, Math.max(0, -8 * B, 9.5 * B) + 125, 60],
      corridor: { clearance: 7.2, width: 8, slope: 0.9, rough: 0.2 }, cell: 3, near: 34, levels: 4, maxTriangles: 48000,
      palette: { rock: '#4a4a56', rockB: '#66626c', strata: 0.3, rockSlope: [0.55, 0.82], patch: '#8a8f62', patchAmount: 0.25 }, material: { roughness: 0.95 } };
    const land = await T.makeTerrainAsync(landOpts, ctx.yield);
    scene.add(land.object);
    const heightAt = land.heightAt, floorAt = land.surfaceAt || land.heightAt;
    await pause();

    // ---------------------------------------------------------------- rock: two arches, the end wall, stacks, boulders, cobbles
    const rockMat = bedMaterial(shared, fogU(), 0, THREE.FrontSide, 1.15, 0, 0.35);

    // rock that lies low in the open sand (the rib, the garden and reef rocks, the slabs of the aisle): a quarter sand, so its tops
    // take the sun and the caustics as the sand round it does and stand a little lighter than its shadowed sides
    const ledgeMat = bedMaterial(shared, fogU(), 0.25, THREE.FrontSide, 1.45, 0, 0.35);
    const rz = ctx.core.makeRng(((ctx.seed | 0) * 15485863 + 2468013) >>> 0);   // a fourth stream, for the shapes of the ledges
    const rockCols = { color: '#8a8690', colorB: '#5c5a66', colorTop: '#77806e' };      // cool grey-violet: separates from kelp and water
    const solids = [];                                                   // { x, z, r } footprints nothing else may grow into
    // the gate, where the aisle narrows: a vault of rock 16 m long over the aisle, its soffit 7 m above the lens. The whales
    // climb over its roof as the camera comes up to it; the breach is seen from under its far half, framed by its mouth.
    const VAULT = { halfWidth: 12.5, apex: 18.5, thick: 4.6, depth: 16, legK: 0.7 };
    const a1y = heightAt(arch1.x, arch1.z) - 1, r1 = rng.fork('arch1'), VAULT_ASYM = rng.range(0.1, 0.4);    // its right pier is the stouter one, by a share drawn for each sea
    const a1 = new THREE.Mesh(await rockArchGeometry(r1, noise, { ...VAULT, asym: VAULT_ASYM, sink: 6, nu: 72, nv: 46, cuts: 14, innerShade: 0.85, colA: '#7f7c88', colB: '#4c4a58' }, pause), rockMat);
    a1.position.set(arch1.x, a1y, arch1.z); a1.rotation.y = yawAt(ARCH1_S); a1.name = 'arch-nave'; a1.updateMatrixWorld(true); scene.add(a1);
    path.tangentAtDist(ARCH1_S, tmp); { const l = Math.hypot(tmp.x, tmp.z) || 1; shared.uGate.value.set(arch1.x, arch1.z, tmp.x / l, tmp.z / l); }
    shared.uGateDim.value.set(VAULT.depth / 2, VAULT.halfWidth + 2, a1y + VAULT.apex + 1.5);
    await pause();
    // the exit arch: craggy, 9 m deep, the portal recessed 2 m inside its throat; two leaning buttress stacks flank it
    const r2 = rng.fork('arch2'), EXIT_ASYM = rng.range(-0.25, 0.25);         // either pier may be the stouter one
    const a2 = new THREE.Mesh(await rockArchGeometry(r2, noise, { asym: EXIT_ASYM, halfWidth: 9.3, apex: 17, thick: 5, depth: 9, sink: 6, nu: 64, nv: 40, legK: 0.55, cuts: 22, innerShade: 0.62, colA: '#7f7c88', colB: '#4c4a58' }, pause), bedMaterial(shared, fogU(), 0, THREE.FrontSide, 1.1, 0, 0.35));
    a2.position.set(end.x, end.y - 8.7, end.z - 2.5); a2.name = 'arch-exit'; a2.updateMatrixWorld(true); scene.add(a2);
    await pause();
    for (const sgn of [-1, 1]) {
      const g = T.seaStackGeometry({ rng: rx.fork('buttress'), noise, height: rx.range(13, 16.5), radius: rx.range(3.6, 4.4), top: 'flat', segments: 22, ledges: 4, undercut: 0.1, flute: 0.2, lobes: 0.9, roughness: 0.75, waist: 0.12, lean: 0.2, sink: 5, crease: 1.1, ...rockCols });
      const m = new THREE.Mesh(g, rockMat), bx = end.x + sgn * rx.range(16, 17.5), bz = end.z - rx.range(1, 4); m.position.set(bx, heightAt(bx, bz) - 1, bz); m.rotation.y = rx() * 6.283; m.name = 'buttress'; scene.add(m);
      await pause();
    }
    const wall = new THREE.Mesh(T.cliffGeometry({ rng: rng.fork('wall'), noise, length: 170, height: 46, depth: 18, segments: [54, 20], ledges: 4, ragged: 1, crease: 1.1, ...rockCols }), rockMat);
    wall.position.set(end.x, end.y - 15, end.z - 20); wall.name = 'end-wall'; scene.add(wall);
    await pause();
    for (const sgn of [-1, 1]) { for (const ds of [-6, 6]) { const p = onPath(ARCH1_S + ds, sgn * 17); solids.push({ x: p.x, z: p.z, r: 9 }); } solids.push({ x: end.x + sgn * 14, z: end.z - 2, r: 8.5 }); }
    // sea stacks: a gateway of rock either side of the first arch, and a few lone ones in the kelp (never on the whales' track)
    const stackSpots = [], stackMeshes = [];
    for (const sgn of [-1, 1]) {
      stackSpots.push([ARCH1_S + rng.range(-6, 6), sgn * rng.range(24, 29), rng.range(27, 35), rng.range(6, 8.5)], [ARCH1_S + rng.range(4, 16), sgn * rng.range(38, 46), rng.range(24, 34), rng.range(7, 10)],
        [ARCH1_S - rng.range(14, 26), sgn * rng.range(31, 40), rng.range(16, 26), rng.range(5, 8)], [LP - rng.range(5, 16), sgn * rng.range(27, 36), rng.range(22, 32), rng.range(6, 9)]);
    }
    for (let i = 0, n = rng.int(4, 7); i < n; i++) stackSpots.push([rng.range(0.05, 0.66) * LP, rng.sign() * rng.range(30, 62), rng.range(12, 30), rng.range(5, 9)]);
    for (const [s, lat, h, r] of stackSpots) {
      const p = onPath(s, lat), sr = rng.fork('stack'), more = rng.chance(0.4), ledges = rng.int(2, 3) + (more ? 1 : 0), undercut = rng.range(0.05, 0.1), waist = rng.range(0.08, 0.2), lean = rng.range(0.03, 0.14), yaw = rng() * 6.283;
      if (!offTrack(p.x, p.z, r + 5)) continue;
      // near stacks are craggy, flat-topped and bedded with chiselled edges; those the water all but hides are cheap and faceted
      const far = Math.abs(lat) > 30;
      const g = T.seaStackGeometry({ rng: sr, noise, height: h, radius: r, top: 'flat', segments: far ? 18 : 24, ledges: far ? ledges + 1 : 4, undercut, flute: 0.16, lobes: far ? 0.8 : 0.9, roughness: far ? 0.7 : 0.75, waist, lean, sink: 5, crease: far ? 0 : 1.1, ...rockCols });
      const m = new THREE.Mesh(g, rockMat); stackMeshes.push({ m, d: Math.abs(lat), s }); m.position.set(p.x, heightAt(p.x, p.z) - 1, p.z); m.rotation.y = yaw; m.name = 'stack'; scene.add(m);
      solids.push({ x: p.x, z: p.z, r: r + 2 });
      await pause();
    }
    const boulders = async (name, kind, count, geoDetail, band, scale, clearance, sink) => {
      const spots = T.scatter({ rng: rng.fork('boulders' + name), heightAt, normalAt: land.normalAt, bounds: land.bounds, path, clearance, band, count, scale, radius: 1, sink });
      await pause();
      const gr = rng.fork('rockgeo' + name), geo = kind === 'ledge' ? ledgeGeometry(gr, noise, { beds: 2, segments: 16, cuts: 1, length: 1.35, lift: 0.4 }) : T.rockGeometry({ rng: gr, kind, detail: geoDetail, color: '#77747e', colorB: '#4e4c58' });
      await pause();
      if (name === '1' || name === '2' || name === 'cobble') {   // the boulders and cobbles beside the aisle, up to the vault: sunlit tops, like the ledges (the rest stay dark shapes)
        const [sunny, rest] = spots.split((i, x, y, z) => { const n = near(x, z); return n.dist < 15 && n.u * LP < ARCH1_S; });
        scene.add(T.makeInstances(geo, ledgeMat, sunny, { brightness: 0.2, tints: [new THREE.Color(1.3, 1.28, 1.2)] }).object, T.makeInstances(geo, rockMat, rest, { brightness: 0.25 }).object);
        return spots;
      }
      const inst = T.makeInstances(geo, kind === 'ledge' ? ledgeMat : rockMat, spots, { brightness: kind === 'ledge' ? 0.14 : 0.25 });
      scene.add(inst.object); return spots;
    };
    const bigSpots = await boulders('2', 'boulder', 46, 2, [11, 60], [1.8, 5], 9, 0.35);
    await pause();
    await boulders('1', 'boulder', 150, 1, [6.5, 60], [0.6, 2.2], 6.5, 0.35);
    await pause();
    // rock ribs breaking through the sand of the aisle: low two-bed ledges, the first bed all but level with the sand (the kit sinks
    // each by 0.55 of its size and the ledge's own sand line is 0.4 up, so a pale sunlit plate and one low step show)
    await boulders('slab', 'ledge', 70, 1, [3, 12], [1.3, 3.2], 3, 0.55);
    await pause();
    await boulders('cobble', 'pebble', Math.round(320 * detail), 0, [1, 13], [0.3, 1.15], 1, 0.3);
    for (let i = 0; i < bigSpots.count; i++) if (bigSpots.scales[i] > 3) solids.push({ x: bigSpots.positions[i * 3], z: bigSpots.positions[i * 3 + 2], r: bigSpots.scales[i] * 0.8 });
    await pause();
    // floor life: sea stars and urchins on the sand beside the aisle
    const lifeMat = bedMaterial(shared, fogU(), 0, THREE.DoubleSide, 2.3, 0.5, 0.5), rl = rng.fork('floor-life'), mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), sc3 = new THREE.Vector3(), tint = new THREE.Color();
    const sprinkle = (geo, count, scale, colors, name) => {
      const mesh = new THREE.InstancedMesh(geo, lifeMat, count); mesh.name = name;
      for (let i = 0, cx = 0, cz = 0; i < count; i++) {
        if (i % 4 === 0) { const p = onPath(rl.range(0.03, 0.97) * LP, rl.sign() * rl.range(2, 11)); cx = p.x; cz = p.z; }     // small parties
        const x = cx + rl.range(-1.6, 1.6), z = cz + rl.range(-1.6, 1.6), s = rl.range(scale[0], scale[1]);
        eu.set(rl.range(-0.12, 0.12), rl() * 6.283, rl.range(-0.12, 0.12)); qt.setFromEuler(eu); sc3.set(s, s * rl.range(0.8, 1.2), s);
        mesh.setMatrixAt(i, mtx.compose(tmp2.set(x, floorAt(x, z) + 0.02, z), qt, sc3)); mesh.setColorAt(i, tint.set(rl.pick(colors)).multiplyScalar(rl.range(0.75, 1.15)));
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); scene.add(mesh);
    };
    await pause();
    sprinkle(starGeometry(), 72, [0.45, 0.85], ['#e8703a', '#d8483a', '#e8a04a', '#b0503a', '#d8c08a'], 'sea-stars');
    await pause();
    sprinkle(urchinGeometry(rng.fork('urchin')), 84, [0.4, 0.7], ['#9a4a8a', '#7a3a72', '#a84a5a', '#6a4a8a'], 'urchins');
    await pause();

    // ---------------------------------------------------------------- the wreck: a dark skeleton half sunk in silt, in a clearing beside the dip
    const wr = await buildWreck(rng.fork('wreck'), noise, pause);
    const wreckMat = bedMaterial(shared, fogU(), 0, THREE.DoubleSide, 2.0, 1, 0.25);
    const wreck = new THREE.Mesh(wr.geometry, wreckMat); wreck.name = 'wreck';
    const wreckFlip = rng.chance(0.5);
    wreck.position.set(wreckP.x, heightAt(wreckP.x, wreckP.z) - 0.6, wreckP.z);
    // heeled a little toward the aisle, so the camera looks into the ribs
    wreck.rotation.set(rng.range(-0.05, 0.05), yawAt(WRECK_S) + rng.range(-0.16, 0.16) + (wreckFlip ? Math.PI : 0), wreckSide * (wreckFlip ? -1 : 1) * rng.range(0.12, 0.24), 'YXZ');
    const WRECK_SCALE = 1.5;
    wreck.scale.setScalar(WRECK_SCALE); wreck.updateMatrixWorld(true); scene.add(wreck);
    wr.geometry.computeBoundingBox();
    const WRECK_LEN = (wr.geometry.boundingBox.max.z - wr.geometry.boundingBox.min.z) * WRECK_SCALE;   // the hull as it lies, stem to stern (m)
    // the wreck lies in open sand: no column within WRECK_CLEAR metres of it, and the row beside the lane stands back along its
    // berth: one hull length clear ahead of its stem and one astern, the same both ways (so 1.5 lengths either side of its middle),
    // nothing nearer the lane than the wreck's own far side
    const WRECK_CLEAR = 19, WRECK_BERTH = 1.5 * WRECK_LEN, WRECK_FAR = 14.5 + 5.5;
    solids.push({ x: wreckP.x, z: wreckP.z, r: WRECK_CLEAR });
    // the columns that are stood by hand (the entry pair, the bowed ones): [s, lateral] of each foot, and where each top is pushed to
    const ENTRY_COLS = [[23, -10.6], [30, 10.9]], sbow = Math.sign(B) || 1;
    const BOWS = [[97, -sbow * 13, 100, sbow * 7, 1.12], [101.5, -sbow * 13.6, 105.5, sbow * 11, 1.18], [106, -sbow * 12.8, 110, sbow * 3.5, 1.12], [99, sbow * 13.2, 103, -sbow * 6, 1.12], [104, sbow * 13.8, 108, -sbow * 9.5, 1.18],
      ...[[38, -11.8, 5], [47, 12, 5.5], [55, -12.2, 6], [62, 11.8, 5.5]].map(([s0, lat, inw]) => [s0, lat, s0 + 2, lat - Math.sign(lat) * inw, 1.06])];
    // the reef head: three low rocks crowded with coral beside the lane, somewhere along the river. Its place is a draw of its own over
    // the whole stretch from the entry to the wreck's clearing, on a side of its own, wherever the bed allows it: clear sand, no stack
    // or great boulder within a metre of its footprint and no hand-stood column's holdfast within 3 m of it
    const REEF_R = 5.5, REEF_LAT = 10.8;
    let REEF_S = 0, reefSide = 1, reefP = new THREE.Vector3();
    for (let t = 0; t < 40; t++) {
      REEF_S = rReef.range(REEF_R + 6, WRECK_S - WRECK_CLEAR - REEF_R - 1.5); reefSide = rReef.sign(); onPath(REEF_S, reefSide * REEF_LAT, undefined, reefP);
      let free = true;
      for (const s of solids) if (Math.hypot(reefP.x - s.x, reefP.z - s.z) < s.r + REEF_R + 1) free = false;
      for (const [cs, cl] of [...ENTRY_COLS, ...BOWS]) { onPath(cs, cl, undefined, tmp2); if (Math.hypot(reefP.x - tmp2.x, reefP.z - tmp2.z) < REEF_R + 3) free = false; }
      if (free) break;
    }
    solids.push({ x: reefP.x, z: reefP.z, r: REEF_R });
    await pause();

    // ---------------------------------------------------------------- giant kelp: loose rows either side of the aisle
    const kc = (h) => { const c = col(h); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h - M.kelp * 0.06, clamp(hsl.s + M.kelp * 0.3, 0, 1), hsl.l * (1 + M.kelp * 0.4)); return c; };
    const kelpMat = new THREE.ShaderMaterial({ vertexShader: KELP_VERT, fragmentShader: KELP_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), ...shared, uSwell: { value: new THREE.Vector4(Math.cos(swellAng), Math.sin(swellAng), swellAmp, rng.range(0.42, 0.56)) },
        uFlow: { value: new THREE.Vector2(Math.sin(flowAng), -Math.cos(flowAng)) }, uColBase: { value: kc('#3a3614') }, uColMid: { value: kc('#665618') }, uColTip: { value: kc('#a88a2a') } } });
    const NCH = 8, kelpChunks = [], nearItems = Array.from({ length: NCH }, () => []), farItems = Array.from({ length: NCH }, () => []);
    const blocked = (x, z, pad) => {
      for (const s of solids) if (Math.hypot(x - s.x, z - s.z) < s.r + pad) return true;
      return !offTrack(x, z, 0, WHALE_GAP - 8.5);
    };
    const rk = rng.fork('kelp'), gapP = rng.range(0.08, 0.2) / lush, rows = 5;
    let placed = 0;
    for (const sgn of [-1, 1]) for (let r = 0; r < rows; r++) {
      const step = 9.2 * (1 + r * 0.13);
      for (let s = -26 + rk.range(0, step); s < LP - 3; s += step * rk.range(0.7, 1.3)) {
        if (++placed % 6 === 0) await pause();
        const chancel = s > ARCH1_S + 10 && s < LP - 26, thin = rk();                 // the chancel beyond the first arch is open water: few columns
        if (rk.chance(gapP + r * 0.03 + (chancel ? (r === 0 ? 0.75 : r === 1 ? 0.4 : 0) : 0))) continue;
        if (r >= 2 && thin > detail) continue;                                           // slower machines: thinner far rows
        const lat = sgn * (13.6 + r * 9.6 + (r === 0 ? rk.range(-0.6, 3.4) : rk.range(-3.2, 3.2)));
        const p = onPath(s, lat), n = near(p.x, p.z);
        if (sgn === wreckSide && sgn * lat < WRECK_FAR && Math.abs(s - WRECK_S) < WRECK_BERTH) continue;
        if (n.dist < 12.6 || blocked(p.x, p.z, 1.5) || p.z < end.z - 3) continue;
        const y = heightAt(p.x, p.z) - 0.3, depth = SURF - y;
        if (depth < 9) continue;
        const tall = rk.chance(r < 2 ? 0.86 : 0.72);
        const it = { x: p.x, y, z: p.z, H: tall ? depth - 0.35 : -depth * rk.range(0.42, 0.8), yaw: rk() * 6.283, phase: rk() * 6.283, bright: rk.range(0.78, 1.18), hue: rk.range(-0.12, 0.12) };
        (r < 2 ? nearItems : farItems)[clamp(Math.floor((s / LP) * NCH), 0, NCH - 1)].push(it);
      }
    }
    const column = (s, lat) => { const p = onPath(s, lat), y = heightAt(p.x, p.z) - 0.3; return { x: p.x, y, z: p.z, H: SURF - y - 0.35, yaw: rk() * 6.283, phase: rk() * 6.283, bright: rk.range(0.8, 1.0), hue: rk.range(-0.05, 0.1) }; };
    // two tall columns close to the entry: dark shapes against the bright ceiling in the very first view
    nearItems[0].push(column(...ENTRY_COLS[0]), column(...ENTRY_COLS[1]));
    await pause();
    const tplNear = await kelpColumnGeometry(rng.fork('kelpgeo0'), 0, pause);
    await pause();
    const tplFar = await kelpColumnGeometry(rng.fork('kelpgeo1'), 1, pause);
    await pause();
    // bowed columns. Five of them, three from one side and two from the other, cross over the aisle in a pointed arch of
    // kelp (seen ahead from the top of the clerestory climb, then the camera passes under it with the sardines); four more lean in
    // over the climb itself, so their canopies close overhead where the camera looks up into the light.
    {
      const bowed = [];
      const bow = (s0, lat, s1, lat1, bright) => { const it = column(s0, lat), top = onPath(s1, lat1); it.lx = top.x - it.x; it.lz = top.z - it.z; it.bright *= bright; bowed.push(it); };
      for (const b of BOWS) bow(...b);
      const m = makeKelpChunk(tplNear, bowed, kelpMat); m.name = 'bowed-kelp'; scene.add(m);
    }
    await pause();
    // in chunks along the aisle: a chunk further than the water carries (everything is plain haze by 135 m) is not drawn
    for (let c = 0; c < NCH; c++) {
      for (const [tpl, items] of [[tplNear, nearItems[c]], [tplFar, farItems[c]]]) {
        if (!items.length) continue;
        const m = makeKelpChunk(tpl, items, kelpMat); kelpChunks.push({ m, s0: c * LP / NCH, s1: (c + 1) * LP / NCH }); scene.add(m);
      }
      await pause();
    }
    await pause();

    // ---------------------------------------------------------------- understory and reef life from the kit, in one slow current
    const seaWind = flora.makeWind({ direction: [Math.cos(swellAng), Math.sin(swellAng)], speed: 0.4, strength: 1.4, gustScale: 0.03, gustiness: 0.4 });
    const matOpts = { wind: seaWind, backlight: 1.1, backlightTint: '#fff2a0', caustics: 0.6, causticScale: 0.3, detail: 0.15 };
    await flora.prepareLeafTexture(matOpts, ctx.yield);
    const matSea = flora.windMaterial(matOpts);
    await pause();
    const fr = rng.fork('flora'), growth = [];
    const weed = async (d) => {
      const a = flora.kelpGeometry({ rng: fr.fork('red' + d), height: 4.6, detail: d, base: '#3a0f1a', mid: '#8a2436', tip: '#d8604e', float: '#c05048' });
      await pause();
      const b = flora.kelpGeometry({ rng: fr.fork('green' + d), height: 3.6, detail: d, base: '#12351c', mid: '#2f7a3a', tip: '#9ad86a', float: '#7ac060' });
      await pause();
      const c = flora.kelpGeometry({ rng: fr.fork('gold' + d), height: 6.5, detail: d, base: '#3a3212', mid: '#8a7424', tip: '#d8b850', float: '#c0a850' });
      await pause();
      return [a, b, c];
    };
    const weedNear = await weed(1), weedFar = await weed(0);
    growth.push(flora.makeKelp({ rng: fr.fork('weeds'), path, heightAt, material: matSea, variants: weedNear, farVariants: weedFar, farDistance: 24, count: Math.round(rng.int(250, 310) * 0.86 * lush), radius: 52, corridor: 4.2,
      scale: [0.6, 1.5], spacing: 1.2, chunks: 3, cullDistance: 170, yRange: [-46, -12] }));
    await pause();
    // short red and green tufts right beside the aisle, so the floor under the lens is never bare
    growth.push(flora.makeKelp({ rng: fr.fork('aisle-weed'), path, heightAt, material: matSea, variants: [weedNear[0], weedNear[1]], farVariants: [weedFar[0], weedFar[1]], farDistance: 7.5, count: Math.round(190 * lush), radius: 12.5, corridor: 3,
      scale: [0.3, 0.75], spacing: 1.0, chunks: 3, cullDistance: 150, yRange: [-46, -12] }));
    await pause();
    // corals in the brief's palette, fans and branching colonies only: orange, rust and gold (the garibaldi keep the one hot accent)
    const reefCols = ['#c8563a', '#e8843a', '#d8b04a', '#b8743a'];
    growth.push(flora.makeCorals({ rng: fr.fork('corals'), path, heightAt, material: matSea, detail: 1, kinds: ['fan', 'branching', 'fan'], count: Math.round(112 * lush), radius: 42, corridor: 5.5, scale: [0.8, 2.6], chunks: 2, cullDistance: 150,
      colors: reefCols, glow: 0.12, density: (x, z, d) => smoothstep(8, 15, d) }));
    await pause();
    growth.push(await flora.makeGrassAsync({ rng: fr.fork('grass'), path, heightAt, wind: seaWind, map: matSea.map, root: '#1f4a3a', tip: '#5f9a6e', dry: '#a8a85a', height: [1.6, 3.2], width: [0.35, 0.7], flowers: 0,
      materialOptions: { caustics: 0.5 }, count: Math.round(3800 * detail), radius: 30, bias: 1.2,
      density: (x, z, lat) => (lat <= 5.5 ? 0 : smoothstep(5.5, 11, lat) * (0.3 + 0.7 * smoothstep(-0.2, 0.3, noise.n2(x * 0.03 + 9, z * 0.03)))) }, ctx.yield));
    await pause();
    // The rock rib: bedded rock under the sand breaks through in groups of three ledges, evenly spaced from the wreck to where the
    // whales come in. RIB_W: a ledge's own width (m). A group steps out from the lane's middle, a ledge every width along and half a
    // width further out; the groups stand RIB_GAP apart (six to eight widths: a group is three long, so the bed lies bare between two
    // groups for as long as a group or longer), the first a seeded share of a gap beyond the wreck. Each group draws its side; inside
    // the wreck's own clearing the rib shows on the open side only (on the wreck's side it lies under the wreck's silt). Where the
    // garden's boulders already stand, no ledge.
    const RIB = [], RIB_W = 3.7, ribPhase = rn(), RIB_GAP = RIB_W * rn.range(6, 8);
    const GARDEN_S = 0.38 * LP, GARDEN = [[0, 13.5, 3.4], [5, 10.6, 1.9], [-6, 11.8, 2.3], [-2, 17.5, 4.2], [9, 14.5, 2.6]].map(([ds, lat, sc]) => ({ sc, p: onPath(GARDEN_S + ds, -wreckSide * lat) }));
    for (let g0 = WRECK_S + ribPhase * RIB_GAP; g0 + 3 * RIB_W < ENTRY_S; g0 += RIB_GAP) {
      const drawn = rRib.sign(), side = Math.abs(g0 - WRECK_S) < WRECK_CLEAR ? -wreckSide : drawn;
      for (let j = 0; j < 3; j++) {
        const rs = g0 + j * RIB_W, sc = rRib.range(1.4, 2.0), p = onPath(rs, side * RIB_W * (1.05 + 0.5 * j));
        if (!GARDEN.some((q) => Math.hypot(p.x - q.p.x, p.z - q.p.z) < sc * 1.9 + q.sc)) RIB.push({ rs, sc, p, side });
      }
    }
    {
      // Eelgrass wants light: the meadows lie on the open sand where the kelp stands back, from the wreck to where the whales come in,
      // evenly spaced (the first a seeded share of a gap beyond the wreck; MEADOW_GAP: a meadow's own length and a strip of bare sand
      // a tenth to a third as long). Beside the wreck a meadow keeps to the open side of the lane; the nearer the whales' clearing,
      // where the kelp is parted on both sides, the further it lies across the lane. Rows [path progress abreast of its middle,
      // metres to the open side, half length, half width, nearest to the lens line]: a meadow whose own rim stops short of the
      // lane's middle sheds no blades onto the lane; one that reaches the middle lies right across it.
      const MEADOWS = [], MEADOW_LEN = 18, MEADOW_GAP = MEADOW_LEN * rMeadow.range(1.1, 1.33), meadowPhase = rMeadow();
      for (let ms = WRECK_S + meadowPhase * MEADOW_GAP; ms - MEADOW_LEN / 2 < ENTRY_S; ms += MEADOW_GAP) {
        const t = clamp((ms - WRECK_S) / (ENTRY_S - WRECK_S), 0, 1), ha = MEADOW_LEN / 2 * rMeadow.range(0.9, 1.1), hw = rMeadow.range(4.4, 5.4), ml = lerp(6.6, -0.6, smoothstep(0.15, 0.9, t));
        MEADOWS.push([ms / LP, ml, ha, hw, ml - hw > 0 ? ml - hw - 0.4 : -9]);
      }
      const MU0 = (WRECK_S - MEADOW_LEN) / LP, MU1 = (ENTRY_S + 1.5 * MEADOW_LEN) / LP, MT = 48, tab = new Float32Array((MT + 1) * 4);   // the lens line over the meadows: points and headings
      for (let i = 0; i <= MT; i++) { const u = lerp(MU0, MU1, i / MT); path.pointAt(u, tmp2); path.tangentAt(u, tmp); tab.set([tmp2.x, tmp2.z, tmp.x, tmp.z], i * 4); }
      // how deep inside a meadow a point is: 1 at its middle, 0 on its rim, below 0 outside (u: path progress there)
      const meadowAt = (x, z, u) => {
        const f = clamp((u - MU0) / (MU1 - MU0), 0, 0.9999) * MT, i = Math.floor(f) * 4, g = f - Math.floor(f);
        const px = lerp(tab[i], tab[i + 4], g), pz = lerp(tab[i + 1], tab[i + 5], g), tx = lerp(tab[i + 2], tab[i + 6], g), tz = lerp(tab[i + 3], tab[i + 7], g);
        const ls = ((x - px) * -tz + (z - pz) * tx) * -wreckSide;                                   // metres toward the open side
        let k = -1;
        for (const [mu, ml, ha, hw, lmin] of MEADOWS) if (ls > lmin) k = Math.max(k, 1 - Math.hypot((u - mu) * LP / ha, (ls - ml) / hw));
        return k;
      };
      // a meadow is thick and tall in the middle and thins out to single blades over its last metres (a ragged, wandering rim);
      // a third of the blades are a little paler and more olive and stand a little taller, so their tips catch the sun
      const eel = await flora.makeGrassAsync({ rng: ry.fork('eelgrass'), path, heightAt, wind: seaWind, material: growth[growth.length - 1].material, root: '#0f3626', tip: '#6c9458', dry: '#8a9a52', height: [1.1, 2.05], width: [0.5, 0.95], flowers: 0,
        count: Math.round(3200 * detail), radius: 11, bias: 1, uRange: [MU0, MU1], chunks: 2,
        density: (x, z, lat, u) => {
          const c = meadowAt(x, z, u); if (c < -0.6) return 0;
          for (const r of RIB) if (Math.hypot(x - r.p.x, z - r.p.z) < r.sc * 1.5 + 0.5) return 0;
          const rr = 1 - c + 0.55 * noise.n2(x * 0.16 + 5, z * 0.16) + 0.2 * noise.n2(x * 0.5, z * 0.5), k = 1 - smoothstep(0.3, 1.0, rr);
          return Math.max(k * (0.3 + 0.7 * k), 0.2 * (1 - smoothstep(0.75, 1.5, rr)));          // the thick of it; and single blades scattered for a few metres beyond its rim
        } }, ctx.yield);
      growth.push(eel);
      await pause();
      const uOf = (x, z) => { const n = near(x, z), u = n.u; path.pointAt(u, tmp2); path.tangentAt(u, tmp); return u + ((x - tmp2.x) * tmp.x + (z - tmp2.z) * tmp.z) / LP; };   // progress of the lens line abreast of a point
      for (const mesh of eel.meshes) {
        const e = mesh.instanceMatrix.array, cl = mesh.instanceColor.array;
        for (let i = 0; i < mesh.count; i++) {
          const m = i * 16, x = e[m + 12], z = e[m + 14], c = clamp(meadowAt(x, z, uOf(x, z)), 0, 1), hh = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453, h = hh - Math.floor(hh);
          const light = h < 0.34, rim = 1 - smoothstep(0, 0.5, c), hk = (0.45 + 0.85 * smoothstep(0, 0.8, c)) * (light ? 1.14 : 1), h0 = Math.hypot(e[m + 4], e[m + 5], e[m + 6]);
          e[m + 4] *= hk; e[m + 5] *= hk; e[m + 6] *= hk; e[m + 13] += 0.1 * h0 * (1 - hk);
          const g = (light ? 1.35 : 0.6 + 0.4 * h) * (1 + 0.3 * rim);
          cl[i * 3] *= g * (light ? 1.25 : 0.9); cl[i * 3 + 1] *= g; cl[i * 3 + 2] *= g * (light ? 0.8 : 1.05);
        }
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2;
        await pause();
      }
    }
    await pause();
    const ribFans = [];
    // sand banked against the foot of a rock: a low drift, higher on its lee side, that runs out into the floor (one merged mesh in
    // the sea bed's own material and colours, so it is the same sand)
    const bankPos = [], bankCol = [], bankIdx = [], bcol = new THREE.Color();
    const bank = (x0, z0, a, b, yaw, h, r = rz) => {                        // half axes a (along yaw) and b; the drift's height at the rock; r: the rock's own stream
      const NS = 18, RINGS = [[0.5, 1], [0.92, 0.9], [1.3, 0.4], [1.75, 0.1], [2.2, 0]], base = bankPos.length / 3, cy = Math.cos(yaw), sy = Math.sin(yaw), lee = r() * 6.283;
      for (let r = 0; r < RINGS.length; r++) for (let i = 0; i < NS; i++) {
        const an = i / NS * 6.283, k = RINGS[r][0] * (1 + 0.12 * Math.sin(an * 3 + lee)), lx = Math.cos(an) * a * k, lz = Math.sin(an) * b * k;
        const x = x0 + lx * cy + lz * sy, z = z0 - lx * sy + lz * cy, y = floorAt(x, z) + (r === RINGS.length - 1 ? -0.14 : h * RINGS[r][1] * (0.62 + 0.38 * Math.cos(an - lee)));
        bankPos.push(x, y, z); groundColor(x, z, y, 1, bcol); bankCol.push(bcol.r, bcol.g, bcol.b);
      }
      for (let r = 0; r < RINGS.length - 1; r++) for (let i = 0; i < NS; i++) { const j = (i + 1) % NS, p0 = base + r * NS, q0 = p0 + NS; bankIdx.push(p0 + i, p0 + j, q0 + j, p0 + i, q0 + j, q0 + i); }
    };
    // a coral head and boulder garden pushing into the aisle beyond the wreck, on the side away from it
    {
      // (chiselled and cut into flat faces: bedrock, not pillows; sunk a little further, sand banked round them)
      const gs = -wreckSide, gg = T.rockGeometry({ rng: rng.fork('garden'), kind: 'boulder', detail: 2, color: '#8a8690', colorB: '#5c5a66', crease: 0.8, cuts: 7, cutDepth: [0.55, 0.88] });
      { const C = gg.getAttribute('color'), Nn = gg.getAttribute('normal'); for (let i = 0; i < C.count; i++) { const k = 0.75 * smoothstep(0.25, 0.8, Nn.getY(i)); C.setXYZ(i, lerp(C.getX(i), 0.4, k), lerp(C.getY(i), 0.375, k), lerp(C.getZ(i), 0.31, k)); } }
      await pause();
      for (const { sc, p: q } of GARDEN) {
        const m = new THREE.Mesh(gg, ledgeMat);
        m.position.set(q.x, heightAt(q.x, q.z) + sc * 0.1, q.z); m.scale.set(sc, sc * 0.72, sc * 1.1); m.rotation.y = fr() * 6.283; m.name = 'garden-rock'; scene.add(m);
        bank(q.x, q.z, sc * 0.95, sc * 1.02, m.rotation.y, 0.17 * sc);
        await pause();
      }
      const gc = onPath(GARDEN_S, gs * 11);
      growth.push(flora.makeCorals({ rng: fr.fork('garden'), path, heightAt, material: matSea, detail: 1, kinds: ['fan', 'branching', 'fan'], count: 30, uRange: [0.35, 0.41], radius: 17, corridor: 8.6, scale: [1.0, 2.5],
        cluster: { size: [6, 11], radius: 3.2 }, chunks: 1, cullDistance: 160, colors: reefCols, glow: 0.2, density: (x, z) => (near(x, z).dist > 7.4 && Math.hypot(x - gc.x, z - gc.z) < 13 ? 1 : 0) }));
      await pause();
      // the reef head (its place: REEF_S, above): three low rocks crowded with fans and branching coral
      for (const [ds, lat, sc] of [[0, REEF_LAT, 2.6], [5.5, REEF_LAT - 2, 1.5], [-5, REEF_LAT + 1.8, 2.1]]) {
        const q = onPath(REEF_S + ds, reefSide * lat), m = new THREE.Mesh(gg, ledgeMat);
        m.position.set(q.x, heightAt(q.x, q.z) + sc * 0.07, q.z); m.scale.set(sc, sc * 0.7, sc * 1.1); m.rotation.y = rReef() * 6.283; m.name = 'reef-rock'; scene.add(m);
        bank(q.x, q.z, sc * 0.95, sc * 1.02, m.rotation.y, 0.17 * sc);
        await pause();
      }
      // the rock rib (its groups: RIB, above): long, low ledges of two or three beds set across the aisle, their flat tops pale and
      // sunlit, a fan or two on the top bed of each, sand drifted against their feet (shapes, turns and fans from the rib's own stream)
      for (const { rs, sc, p: q, side } of RIB) {
        const lg = ledgeGeometry(rRib, noise, { beds: sc > 1.55 ? 3 : 2, segments: 20, length: 1.75 }), m = new THREE.Mesh(lg, ledgeMat), yaw = yawAt(rs) + side * 0.55 + rRib.range(-0.2, 0.2);
        m.position.set(q.x, heightAt(q.x, q.z) - 0.04 * sc, q.z); m.scale.set(sc * 1.1, sc, sc * 1.1); m.rotation.y = yaw; m.name = 'rib-ledge'; m.updateMatrixWorld(true); scene.add(m);
        const cw = lg.userData.crown.clone().applyMatrix4(m.matrixWorld);
        for (let k = 0, n = sc > 1.45 ? 2 : 1; k < n; k++) ribFans.push({ x: cw.x + rRib.range(-0.5, 0.5) * sc * 0.4, y: cw.y - 0.04, z: cw.z + rRib.range(-0.5, 0.5) * sc * 0.4, s: rRib.range(0.8, 1.5), rot: rRib() * 6.283, d: 0, u: 0 });
        bank(q.x, q.z, sc * 1.5, sc * 0.95, yaw, 0.2 * sc, rRib);
        await pause();
      }
      // the vault's feet: bedded blocks fallen from the piers, sand drifted against them. Rock falls from both faces of a pier, so
      // two lie at each face of each pier (the face up the aisle and the face down it): one against the pier's foot, a smaller one
      // further out. Their places follow the pier: its half depth along the aisle and its own thickness at the foot (the stouter
      // pier's blocks lie further out); sizes, turns and shapes from the blocks' own stream
      for (const sgn of [-1, 1]) for (const face of [-1, 1]) {
        const hrF = VAULT.thick * 0.5 * (1 + VAULT.legK) * (1 + VAULT_ASYM * sgn);        // the pier's half thickness at its foot
        for (const [off, lk, s0, s1] of [[2.2, 0.67, 2.8, 3.3], [4.4, 1.9, 2.2, 2.7]]) {
          const sc = rFeet.range(s0, s1), q = onPath(ARCH1_S + face * (VAULT.depth / 2 + off), sgn * (VAULT.halfWidth + lk * hrF));
          const lg = ledgeGeometry(rFeet, noise, { beds: 3, segments: 20, cuts: 1, length: 1.4 }), m = new THREE.Mesh(lg, ledgeMat), yaw = yawAt(ARCH1_S) - sgn * face * 0.5 + rFeet.range(-0.3, 0.3);
          m.position.set(q.x, heightAt(q.x, q.z) - 0.04 * sc, q.z); m.scale.set(sc, sc * 1.25, sc); m.rotation.y = yaw; m.name = 'vault-foot'; scene.add(m);
          bank(q.x, q.z, sc * 1.25, sc * 0.9, yaw, 0.22 * sc, rFeet);
          await pause();
        }
      }
      {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(bankPos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(bankCol, 3)); g.setIndex(bankIdx); g.computeVertexNormals();
        const m = new THREE.Mesh(g, bedMat); m.name = 'sand-banks'; scene.add(m);
      }
      const rc = onPath(REEF_S, reefSide * (REEF_LAT - 1.2));
      growth.push(flora.makeCorals({ rng: rReef.fork('reef'), path, heightAt, material: matSea, detail: 1, kinds: ['fan', 'branching', 'branching'], count: 34, uRange: [Math.max(0.004, (REEF_S - 17) / LP), (REEF_S + 20) / LP], radius: 17, corridor: 5.6, scale: [0.9, 2.3],
        cluster: { size: [6, 11], radius: 3 }, chunks: 1, cullDistance: 160, colors: ['#e8843a', '#ff9a50', '#d8b04a', '#c8563a', '#e86a8a'], glow: 0.25, density: (x, z) => (near(x, z).dist > 5.2 && Math.hypot(x - rc.x, z - rc.z) < 11 ? 1 : 0) }));
    }
    await pause();
    // things that grow ON the rock and the timber: points picked from a mesh's own vertices, with the rock's normal there
    const vv = new THREE.Vector3(), vnr = new THREE.Vector3();
    const crustFrom = async (mesh, count, scale, test, out = [], minNy = -0.35, r = fr) => {
      mesh.updateMatrixWorld(true);
      const P = mesh.geometry.getAttribute('position'), Nn = mesh.geometry.getAttribute('normal');
      for (let i = 0, tries = 0; i < count && tries < count * 30; tries++) {
        if (tries % 40 === 39) await pause();                                 // (only r is drawn from here: fr, or the vault lamps' own stream; nothing else draws from it meanwhile)
        const k = r.int(0, P.count - 1); vv.fromBufferAttribute(P, k);
        if (Nn.getY(k) < minNy || !test(vv)) continue;
        vnr.fromBufferAttribute(Nn, k).transformDirection(mesh.matrixWorld); vv.applyMatrix4(mesh.matrixWorld);
        out.push({ x: vv.x, y: vv.y - 0.1, z: vv.z, s: r.range(scale[0], scale[1]), rot: r() * 6.283, d: 0, u: 0, nx: vnr.x, ny: vnr.y, nz: vnr.z }); i++;
      }
      return out;
    };
    const fromLocal = (mesh, list, scale, out = []) => { for (const t of list) { vv.set(t[0], t[1], t[2]).applyMatrix4(mesh.matrixWorld); out.push({ x: vv.x, y: vv.y - 0.06, z: vv.z, s: fr.range(scale[0], scale[1]), rot: fr() * 6.283, d: 0, u: 0 }); } return out; };
    // the kit plants everything upright: turn each anemone to stand along the rock's own normal, so they ring the exit arch
    // like a collar, sprout sideways from the piers and hang from the soffit of the vault
    const alongNormals = (res, pts) => {
      const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), quat = new THREE.Quaternion(), qn = new THREE.Quaternion(), scl = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3();
      for (const mesh of res.meshes || []) {
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, m4); m4.decompose(pos, quat, scl);
          let best = null, bd = 0.03;
          for (const q of pts) { const d = Math.abs(q.x - pos.x) + Math.abs(q.y - pos.y) + Math.abs(q.z - pos.z); if (d < bd) { bd = d; best = q; } }
          if (!best || best.nx === undefined) continue;
          qn.setFromUnitVectors(up, nrm.set(best.nx, best.ny, best.nz).normalize()); quat.premultiply(qn);
          pos.addScaledVector(nrm, -0.1 * scl.y); pos.y += 0.1; mesh.setMatrixAt(i, m4.compose(pos, quat, scl));
        }
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 3;
      }
    };
    const anemone = (name, points, colors, glow, mat = matSea, r = fr) => { const res = flora.makeAnemones({ rng: r.fork(name), material: mat, points, colors, glow, sink: 0, tentacles: 10, cullDistance: 190 }); alongNormals(res, points); growth.push(res); return res; };
    const in1 = a1.geometry.userData.inner, in2 = a2.geometry.userData.inner;
    // the exit arch: the front of its throat wears a dense collar of glowing anemones (the portal's rim light), the face a looser scatter
    const lip = await crustFrom(a2, 170, [0.5, 1.4], (p) => in2(p) && p.y > 0.5 && p.z > 0.6, [], -1);
    await pause();
    await crustFrom(a2, 34, [0.9, 2.0], (p) => !in2(p) && p.y > -1 && p.z > 1, lip);
    await pause();
    // (in three lots: one kit call for the whole collar held the page for ~70 ms)
    for (let i = 0, n = Math.ceil(lip.length / 3); i < 3; i++) { anemone('lip' + i, lip.slice(i * n, (i + 1) * n), ['#ff8ab0', '#ffb070', '#ff8a3c', '#ffd890', '#e8f6c8'], 1.2); await pause(); }
    // the vault: small bright anemones on its soffit and the inner faces of its piers, each with a soft halo (lamps in the gate).
    // An addition of this crew's: their picks and their growth draw from a stream of their own ('vault-lamps'), not from the site's flora stream
    const lamps = await crustFrom(a1, 40, [0.5, 1.2], (p) => in1(p) && p.y > 2.5 && Math.abs(p.z) < VAULT.depth / 2 - 0.5, [], -1, rLamp);
    await pause();
    anemone('lamps', lamps, ['#ff8ab0', '#ffb070', '#ffd890', '#a0f0d0', '#e8f6c8'], 1.5, matSea, rLamp);
    await pause();
    const crust = await crustFrom(a1, 56, [0.8, 2.2], (p) => !in1(p) && p.y > 0);
    await pause();
    stackMeshes.sort((a, b) => a.d - b.d);
    for (let i = 0; i < Math.min(4, stackMeshes.length); i++) { const st = stackMeshes[i]; st.c0 = crust.length; await crustFrom(st.m, 14, [1.2, 2.6], (p) => p.y > 1.5, crust); st.c1 = crust.length; }
    await pause();
    // The stacks keep out of the gate. A craggy stack's foot spreads in lobes as far as 25 m from its axis, and on many seas a lobe of
    // the stack beside a pier ran through that pier and out into the opening or before its mouth: flat four-sided facets of the stack's
    // paler rock, 6 to 9 m wide, leaning in the gate from the sand to the springing (a pane of glass against the arch, not rock). Within
    // the vault's length and 8 m before each mouth (fading out over the next 6 m) no stack's rock stands nearer the aisle than the
    // middle line of the vault's own ring (the half ellipse its builder gives: A across, B high); a stack whose own axis stands beside
    // the vault (within its length, fading over the next 6 m) keeps out of that line with all its rock, however far a lobe of it runs.
    // What would stand inside is drawn in toward the stack's own axis to within a metre of that line and, as deep as it stood inside
    // it, back into the vault's length: it ends inside the ring's rock, and both piers show their own bedded rock on the side of the
    // opening and on their fronts. A rule of the place, for every stack and either pier; the creatures picked on that rock go with it.
    // (No draw is made here, and the picks above were made on the stacks as they were built: the flora stream deals as before.)
    {
      const { A: GA, B: GB } = a1.geometry.userData, ux = shared.uGate.value.z, uz = shared.uGate.value.w, HALF = VAULT.depth / 2;
      // where a point of a stack is drawn to (false: it stays). x, z in the world, y over the vault's base; (cx, cz) the stack's axis; out takes the new x, z
      const drawIn = (x, y, z, cx, cz, out) => {
        const dx = x - arch1.x, dz = z - arch1.z, ax = dx * ux + dz * uz;                                                                 // ax: metres along the aisle from the vault's middle
        const axC = (cx - arch1.x) * ux + (cz - arch1.z) * uz, latS = (cz - arch1.z) * ux - (cx - arch1.x) * uz, sd = Math.sign(latS), latC = latS * sd, lat = (dz * ux - dx * uz) * sd;   // lat: metres from its axis, on the stack's side
        const w = Math.max(1 - smoothstep(HALF + 8, HALF + 14, Math.abs(ax)), 1 - smoothstep(HALF, HALF + 6, Math.abs(axC)));           // how far the rule holds here: by the point's place, or wholly for a stack of the gate
        const lim = GA * Math.sqrt(Math.max(0, 1 - Math.max(y, 0) ** 2 / (GB * GB))), e = lim - lat;                                           // e: how far inside the ring's middle line
        if (w <= 0 || e <= 0 || latC <= lim) return false;
        const k = 1 - Math.exp(-e), lat1 = lim - k, ax1 = axC + (ax - axC) * (latC - lat1) / (latC - lat);
        const axF = lerp(ax, lerp(ax1, clamp(ax1, 1 - HALF, HALF - 1), k), w), latF = lerp(lat, lat1, w) * sd;
        out.x = arch1.x + axF * ux - latF * uz; out.z = arch1.z + axF * uz + latF * ux; return true;
      };
      for (const st of stackMeshes) {
        const m = st.m, c = m.position, P = m.geometry.getAttribute('position'), C = m.geometry.getAttribute('color'), seen = new Map(), pos = [], colr = [], idx = [];
        let moved = 0; m.updateMatrixWorld(true);
        for (let i = 0; i < P.count; i++) {                                 // (the kit's stack has a vertex of its own for every corner of every facet: found again by place)
          const key = P.getX(i) + ',' + P.getY(i) + ',' + P.getZ(i); let j = seen.get(key);
          if (j === undefined) {
            j = pos.length / 3; seen.set(key, j); colr.push(C.getX(i), C.getY(i), C.getZ(i));
            vv.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
            if (drawIn(vv.x, vv.y - a1y, vv.z, c.x, c.z, vv)) { m.worldToLocal(vv); pos.push(vv.x, P.getY(i), vv.z); moved++; } else pos.push(P.getX(i), P.getY(i), P.getZ(i));
          }
          idx.push(j);
        }
        if (!moved) continue;                                               // (a stack that keeps clear is left as the kit built it, bit for bit)
        m.geometry.dispose(); m.geometry = T.buildCreased(new Float32Array(pos), new Float32Array(colr), idx, st.d > 30 ? 0 : 1.1);   // creased as it was built (far stacks are faceted)
        for (let k = st.c0 ?? 0; k < (st.c1 ?? 0); k++) { const q = crust[k]; if (drawIn(q.x, q.y + 0.1 - a1y, q.z, c.x, c.z, vv)) { q.x = vv.x; q.z = vv.z; } }
        await pause();
      }
    }
    fromLocal(wreck, wr.tips.filter((t, i) => i % 3 === 0), [0.45, 0.8], crust);
    anemone('crust', crust, ['#ff8ab0', '#ffb070', '#a0f0d0', '#ff8a3c', '#e8f6c8'], 0.6);
    await pause();
    growth.push(flora.makeAnemones({ rng: fr.fork('anem'), path, heightAt, material: matSea, count: 34, radius: 18, corridor: 4, scale: [0.8, 1.9], tentacles: 10, colors: ['#ff8ab0', '#ffb070', '#a0f0d0', '#e8f6c8'], glow: 0.5 }));
    await pause();
    {
      const n = lamps.length, g = new THREE.InstancedBufferGeometry(), aP = new Float32Array(n * 4), aC = new Float32Array(n * 4), lc = ['#ff8ab0', '#ffb070', '#ffd890', '#a0f0d0'].map((h) => col(h));
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2]);
      lamps.forEach((q, i) => { const c = lc[i % lc.length], k = rx.range(0.1, 0.18); aP.set([q.x + q.nx * 0.5 * q.s, q.y + 0.1 + q.ny * 0.5 * q.s, q.z + q.nz * 0.5 * q.s, 0.5 + 0.7 * q.s], i * 4); aC.set([c.r * k, c.g * k, c.b * k, rx()], i * 4); });
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, uniforms: { ...fogU(), uTime: shared.uTime } }));
      m.frustumCulled = false; m.renderOrder = 5; m.name = 'lamp-halos'; scene.add(m);
    }
    await pause();
    // sea fans on the faces of both arches, red and green weed on their tops and furring the wreck's ribs and keel
    const fans = await crustFrom(a2, 38, [0.9, 2.2], (p) => !in2(p) && p.y > 1 && p.z > -1, [], -0.1), exitFans = fans.splice(0, fans.length);
    await pause();
    await crustFrom(a1, 34, [1.0, 2.6], (p) => !in1(p) && p.y > 1, fans, -0.1);
    fromLocal(wreck, wr.spots.filter((t, i) => i % 3 === 1), [0.7, 1.3], fans);
    growth.push(flora.makeCorals({ rng: fr.fork('fans'), material: matSea, points: fans, detail: 1, kinds: ['fan'], cluster: false, colors: ['#e8843a', '#d8b04a', '#c8563a', '#f0a070'], glow: 0.25, cullDistance: 190 }));
    await pause();
    growth.push(flora.makeCorals({ rng: ry.fork('exit-fans'), material: matSea, points: exitFans, detail: 1, kinds: ['fan'], cluster: false, colors: ['#e8843a', '#d8b04a', '#c8563a', '#f0a070'], glow: 0.25, cullDistance: 190 }));
    await pause();
    growth.push(flora.makeCorals({ rng: ry.fork('rib-fans'), material: matSea, points: ribFans, detail: 1, kinds: ['fan'], cluster: false, colors: ['#e8843a', '#d8b04a', '#c8563a'], glow: 0.2, cullDistance: 150 }));
    await pause();
    const tufts = await crustFrom(a1, 30, [0.35, 0.8], (p) => !in1(p) && p.y > 10, [], 0.45), nT1 = tufts.length;
    await pause();
    await crustFrom(a2, 30, [0.3, 0.7], (p) => !in2(p) && p.y > 9, tufts, 0.45);
    const nT2 = tufts.length;
    await pause();
    fromLocal(wreck, wr.tips.filter((t, i) => i % 3 !== 0), [0.2, 0.42], tufts);
    fromLocal(wreck, wr.spots.filter((t, i) => i % 3 !== 1), [0.25, 0.5], tufts);
    tufts.forEach((p, i) => { p.v = i % 2; });                                           // red and green only
    const exitTufts = tufts.splice(nT1, nT2 - nT1);
    growth.push(flora.makeKelp({ rng: fr.fork('tufts'), material: matSea, points: tufts, variants: weedNear, cullDistance: 190 }));
    growth.push(flora.makeKelp({ rng: ry.fork('exit-tufts'), material: matSea, points: exitTufts, variants: weedNear, cullDistance: 190 }));
    for (const g of growth) scene.add(g.object);
    await pause();

    // ---------------------------------------------------------------- fauna
    const fauna = [], rf = rng.fork('fauna');
    // the sardine school: meets the camera at u = 0.2 and parts around the lens
    const sardines = makeSardines(rf.fork('sardines'), Math.round((1400 + 0.65 * rf.int(1000, 1500)) * 1.75 * lush), shared, fogU());   // 3600-4150 small fish: a river 120 m long
    {
      const U0 = 0.04, U1 = 0.42, su = sardines.uniforms;
      su.uPts.value.forEach((v, i) => { path.pointAt(lerp(U0, U1, i / 12), v); v.y -= 0.6; });
      su.uSpan.value = (U1 - U0) * LP;
      // the river comes up the nave against the camera, slowly: its head reaches the lens early in the climb, the thick of it
      // parts round the lens at the brief's beat and its tail is still about the reef head and the wreck
      sardines.head = (u) => (0.19 + (0.2 - u) * 0.1 - U0) / (U1 - U0);
    }
    scene.add(sardines.object);
    await pause();
    // garibaldi: the orange accent, in small loose groups at the entry, in the wreck's ribs, at the garden and both arches
    // [s, lateral, height above the bed | absolute y when 4th is set]
    const gSpots = [[0.07 * LP, -wreckSide * 7.2, -24.5, 1], [REEF_S + 1, reefSide * (REEF_LAT - 2.2), 3.6], [WRECK_S + 1, wreckSide * 14.5, 5.5], [0.38 * LP, -wreckSide * 9.5, 5], [0.5 * LP, rf.sign() * 7.4, -31, 1], [ARCH1_S - 3, rf.sign() * 6.2, 5.5],
      [LP - 7.5, 5.6, end.y + 1.2, 1], [LP - 6.5, -5.4, end.y - 1.6, 1]];
    for (const [s, lat, up, abs] of gSpots) {
      const p = onPath(s, lat), rg = s === REEF_S + 1 ? rn : rf;          // (the reef's group is not the first stream's: every other draw stays where it was)
      fauna.push(F.makeFishSchool({ rng: rg.fork('garibaldi'), species: 'reef', count: rg.int(9, 14), varieties: [['#ff7a22', '#ff9440']], light: faunaLight, center: [p.x, abs ? up : heightAt(p.x, p.z) + up, p.z],
        radius: abs ? rg.range(2.6, 3.2) : rg.range(3, 4.6), height: 1.2, speed: rg.range(0.7, 1.1), size: 3.0, spread: [3.2, 1.8, 6], vivid: 1, glow: '#ff5a10', glowIntensity: 1.8, caustics: 0.3 }));
      await pause();
    }
    await pause();
    // three sea lions, keyed to path progress from end to end (their clock is the lens's place on the route, never the wall
    // clock). They corkscrew down from the surface round an upright axis in the aisle, LION_S along the route. The helix is theirs
    // and drawn for each sea: HEL_TURNS turns down (2 to 2.4), its hand, the bearing they dive in on (HEL_A0); having come down they
    // circle level at the foot for what is left of a turn, until they head down the aisle. The leader reaches the foot when the lens
    // is still LION_FOOT metres short of the axis. Then they keep ahead of the lens, winding about their line (one winding to a
    // turn's length of their helix, begun on a phase of their own, LION_WIND), and climb ahead of it to the light at the pitch they
    // came down by: the run is as long as the turns of their dive unwound (height / pitch x one turn's length = HEL_TURNS x
    // HEL_TURN), and they are gone at the surface. Each trails bubbles.
    const plumePx = { value: 360 };                                       // pixels per metre at one metre: set every frame from the drawing buffer
    const LION_S = 0.36 * LP + 22, LION_C = onPath(LION_S, -wreckSide * 1.5), LION_SPEED = 5.5, LION_FOOT = 28;
    const LION_UB = (LION_S - LION_FOOT) / LP, LION_V = 0.587 * LP;       // LION_V: metres of their route per unit of u on the helix
    const HEL_R = [5.5, 4.4], HEL_Y = [-7, -25.5], HEL_AXIS = 1.5;        // the helix: radius and depth at the top and at the foot; its axis stands this far off the lens line
    const HEL_TURNS = rf.range(2.0, 2.4), HEL_HAND = rf.sign(), HEL_A0 = rf() * 6.2832;
    const rLion = rf.fork('sealions'), LION_WIND = rf() * 6.2832;
    const HEL_END = -HEL_HAND * Math.PI / 2;                              // the bearing on the circle where a swimmer of this hand heads down the aisle
    const HEL_SWEEP = HEL_TURNS * 6.2832 + ((((HEL_END - HEL_A0) * HEL_HAND - HEL_TURNS * 6.2832) % 6.2832) + 6.2832) % 6.2832;   // the turns down, then on round to that bearing
    const HEL_TURN = 6.2832 * 0.5 * (HEL_R[0] + HEL_R[1]);                // one turn's length (m)
    const lionFootLat = -wreckSide * (HEL_AXIS - HEL_HAND * HEL_R[1]), LION_SIDE = Math.sign(lionFootLat);   // where the helix lets them go, and on which side of the lens line that is
    // the line the leader follows after the helix, rows [share of the run the lens has flown since the foot, metres ahead of the lens,
    // metres off the lens line on the side the helix let them go, depth]
    const LION_T = [[0, LION_FOOT, Math.abs(lionFootLat), HEL_Y[1]], [0.112, 27.5, 2.4, -24.6], [0.208, 27, 2, -23], [0.296, 27, 1.6, -20.6], [0.384, 27, 1, -18.2], [0.472, 28, 0.6, -16.2],
      [0.56, 31, 0.6, -13.6], [0.648, 35.5, 1, -10.4], [0.736, 41, 1.4, -7.2], [0.824, 48, 1.8, -4.2], [0.912, 55.5, 2, -1.8], [1, 63, 2, -0.8]];
    const LION_RUN = HEL_TURNS * HEL_TURN, LION_UE = LION_UB + LION_RUN / LP, lionV = [], lionS = [];   // lionS[i]: metres along their route when the lens is at lionV[i]
    let lions, lionTrail, lionS0 = 0, lionL = 1;
    const lionTravel = (u) => {                                           // where the leader is on the route (m)
      if (u <= LION_UB) return lionS0 + (u - LION_UB) * LION_V;
      const n = lionV.length, f = Math.min(n - 1.0001, (u - LION_UB) / (LION_UE - LION_UB) * (n - 1)), i = Math.floor(f);
      return u >= LION_UE ? lionS[n - 1] + (u - LION_UE) * LION_V * 2 : lerp(lionS[i], lionS[i + 1], f - i);
    };
    {
      const pts = [], NH = Math.round(20 * HEL_SWEEP / 6.2832), NLD = 64, sd = -wreckSide, lead = [], aim = new THREE.Vector3();
      let helLen = 0;
      for (let i = 0; i < NH; i++) {                                      // the helix: down for HEL_TURNS turns, then level round the foot, ending headed down the aisle
        const k = i / NH, th = HEL_END - HEL_HAND * HEL_SWEEP * (1 - k), kd = Math.min(1, k * HEL_SWEEP / (HEL_TURNS * 6.2832)), rad = lerp(HEL_R[0], HEL_R[1], kd);
        const q = onPath(LION_S + Math.cos(th) * rad, sd * (HEL_AXIS + Math.sin(th) * rad), lerp(HEL_Y[0], HEL_Y[1], 0.5 * kd + 0.5 * smoothstep(0, 1, kd)));
        if (i) helLen += Math.hypot(q.x - pts[i - 1][0], q.y - pts[i - 1][1], q.z - pts[i - 1][2]);
        pts.push([q.x, q.y, q.z]);
      }
      for (let i = 0; i <= NLD; i++) {                                    // the lying helix down the aisle, then the climb to the surface
        const f = i / NLD, dm = LION_RUN * f, v = LION_UB + dm / LP, rr = 4.2 * smoothstep(0, 0.144, f) * (1 - smoothstep(0.7, 0.93, f)), ph = LION_WIND + 6.2832 * dm / HEL_TURN;
        const q = onPath(v * LP + tabAt(LION_T, f, 1), LION_SIDE * tabAt(LION_T, f, 2) + sd * rr * Math.sin(ph), tabAt(LION_T, f, 3) - 0.5 * rr * Math.cos(ph));
        pts.push([q.x, q.y, q.z]); lead.push(q);
      }
      // (start 0: the kit adds nothing of its own; where they are on the route is lionTravel's alone)
      lions = F.makeSwimmer(sealionGeometry(3.5), { rng: rLion, route: pts, closed: false, routeSamples: 512, speed: LION_SPEED, start: 0, light: faunaLight, count: 3, spread: [1.3, 0.9, 3.8] }, rf.fork('sealions2'),
        { len: 3.5, speed: LION_SPEED, count: 3, swim: [0.9, 0.05, 3, 0.25], fin: [0.9, 0.5, 0.25, 1.2], bank: 30, bob: 0.2, rim: 1.4, spec: 0.9, shine: 40, scales: [0.94, 0.86], near: 0.25 });
      lionL = lions.route.length;
      for (let i = 0, sq = 0; i <= NLD; i++) {                            // where on the baked route each of those moments is (the first: the foot of the helix)
        aim.copy(lead[i]);
        let best = sq, bd = 1e9; for (let q = i ? sq : Math.max(0, helLen - 0.4 * HEL_TURN), q1 = i ? Math.min(lionL, sq + 14) : Math.min(lionL, helLen + 0.4 * HEL_TURN); q <= q1; q += 0.1) { lions.route.pointAt(q, tmp2); const d = tmp2.distanceTo(aim); if (d < bd) { bd = d; best = q; } }
        sq = best; lionV.push(lerp(LION_UB, LION_UE, i / NLD)); lionS.push(best);
      }
      lionS0 = lionS[0];
      lions.object.name = 'sea-lions'; scene.add(lions.object);
      await pause();
      // bubble trails: each sprite is born where its sea lion is at one moment of the pass (the clock is the leader's place on the route)
      const NB = Math.round(640 * detail), lap = lionL / LION_SPEED, iA = lions.geometry.getAttribute('iA'), iB = lions.geometry.getAttribute('iB');
      const g = new THREE.InstancedBufferGeometry(), aP = new Float32Array(NB * 4), aR = new Float32Array(NB * 4);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2]);
      for (let i = 0; i < NB; i++) {
        const k = i % 3, born = rx() * lap, da = rx() * 6.283;
        lions.positionAt(born - iA.getZ(k) / LION_SPEED, LION_UB, tmp2);
        aP.set([tmp2.x + iA.getX(k) + rx.range(-0.3, 0.3), tmp2.y + iA.getY(k) + rx.range(-0.2, 0.5), tmp2.z + iB.getW(k) + rx.range(-0.3, 0.3), born], i * 4);
        aR.set([Math.cos(da) * 0.25, Math.sin(da) * 0.25, rx.range(0.05, 0.13), rx()], i * 4);
      }
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); g.instanceCount = NB;
      const mat = new THREE.ShaderMaterial({ vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, transparent: true, depthWrite: false, fog: true,
        uniforms: { ...fogU(), uU: { value: 0 }, uPeriod: { value: 0 }, uLife: { value: new THREE.Vector2(2, 4) }, uGrow: { value: new THREE.Vector2(0.7, 0.8) }, uRing: { value: 0.5 }, uGain: { value: 1.5 }, uPx: plumePx, uTime: shared.uTime, uSurf: shared.uSurf, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol } });
      lionTrail = new THREE.Mesh(g, mat); lionTrail.frustumCulled = false; lionTrail.renderOrder = 6; lionTrail.name = 'sea-lion-bubbles'; scene.add(lionTrail);
    }
    await pause();
    // a second, darker school that circles high over the chancel
    {
      const c = onPath(0.9 * LP, -4);
      fauna.push(F.makeFishSchool({ rng: rf.fork('mackerel'), species: 'mackerel', count: Math.round(rf.int(120, 200) * lush), light: faunaLight, center: [c.x, -17.5, c.z], radius: rf.range(17, 22), height: 2.5, speed: 4 }));
    }
    await pause();
    // moon jellies: five drift inside the throat of the vault, pale lamps in its shadow, the rest in the glade beyond it;
    // nine more hang in the nave itself, back-lit among the gold columns of the clerestory
    {
      const nave = [];
      for (let i = 0; i < 9; i++) { const q = onPath(lerp(40, 116, i / 8) + rNave.range(-4, 4), (i % 2 ? 1 : -1) * rNave.range(4.6, 8.5)); nave.push([q.x, q.y + rNave.range(1, 5.5), q.z]); }
      fauna.push(F.makeJellyfish({ rng: rn.fork('nave-jellies'), preset: 'moon', count: 9, size: 1.15, positions: nave, center: nave[4], spread: [6, 3, 6], drift: [1.2, 0.8, 1.4], light: faunaLight, glowIntensity: 1.9, hueVariety: 0.3 }));
    }
    await pause();
    {
      const c = onPath(ARCH1_S + 26, 0), throat = [[-6, -6.2, -25.2], [-2.5, 6.6, -23.6], [1, -5.6, -24.2], [4, 6, -26.2], [7, -6.8, -23.2]].map(([ds, lat, y]) => { const q = onPath(ARCH1_S + ds, lat); return [q.x, y, q.z]; });
      fauna.push(F.makeJellyfish({ rng: rf.fork('jellies'), preset: 'moon', count: 19, size: 1.35, positions: throat, center: [c.x, -25.5, c.z], spread: [15, 6.5, 13], avoid: path, clear: 6, drift: [1.6, 0.9, 1.8], light: faunaLight, glowIntensity: 1.7, hueVariety: 0.3 }));
    }
    await pause();
    // the sand ray. Its course is fixed in the world and laid out from the wreck: it lies on the sand on the lane's edge beside the
    // wreck; when the lens first comes within RAY_STARTLE metres of it, it lifts and flees: one long glide across the aisle beyond
    // the wreck and away down the far side of the aisle, rising a little, at its own steady speed, drawing away all the time until
    // the water has taken it (the water's own fog fades it: nothing switches it off while anything of it can be seen; it is put away
    // only at the end of its course, 190 m and more from the lens). Where it is on the course: its speed times the time the lens
    // has taken since the startle (the flight's own clock); its wings beat on the world's clock, from a phase of its own.
    // RAY_STARTLE: a ray lying on the sand lets a big thing come to within 18 of its own spans before it lifts. RAY_FLEE: it flees
    // at twice the speed the lens has at the place where it startles it.
    // Rows [metres beyond the wreck along the route, metres to the wreck's side of the lens line, metres over the floor].
    const RAY_SPAN = 3.2, RAY_STARTLE = 18 * RAY_SPAN, RAY_FLEE = 2;
    let raySpeed = 1, rayBeat = 0;
    const RAY_COURSE = [[-6, 5.5, 0.15], [-1.5, 5.3, 0.45], [5, 4.4, 1.7], [16, 1.6, 3.1], [32, -2.6, 3.4], [54, -5.5, 3.6], [84, -6.5, 4.6], [120, -6.5, 6.4], [165, -6, 8],
      [215, -5, 8.6], [270, -4, 8.6]];
    let ray, rayL = 1, rayS0 = 0, rayStar = 0;                            // rayS0: where on its baked route it rests; rayStar: metres along OUR route where the lens startles it
    const rayTau = [0];                                                   // seconds the lens takes from the startle, per metre of route beyond it
    const rayTravel = (u) => {
      const f = clamp(u * LP - rayStar, 0, rayTau.length - 1.001), i = Math.floor(f);
      return Math.min(rayS0 + raySpeed * lerp(rayTau[i], rayTau[i + 1], f - i), 0.945 * rayL);
    };
    {
      const pts = RAY_COURSE.map(([ds, lat, up]) => { const q = onPath(WRECK_S + ds, wreckSide * lat); return [q.x, floorAt(q.x, q.z) + up, q.z]; });
      const rest = new THREE.Vector3(pts[0][0], pts[0][1], pts[0][2]);
      { const a = pts[0], b = pts[1], k = 26 / Math.max(0.1, Math.hypot(b[0] - a[0], b[2] - a[2])); pts.unshift([a[0] - (b[0] - a[0]) * k, a[1], a[2] - (b[2] - a[2]) * k]); }   // a run-in behind its rest: the kit fades a swimmer in over the first of an open route
      for (let q = 0; q < LP; q += 0.5) { path.posAtDist(q, tmp2); if (tmp2.distanceTo(rest) < RAY_STARTLE) { rayStar = q; break; } }
      // (the engine scales pace so that the flight lasts its duration: the lens's speed at a place is length / duration x pace x paceK)
      let inv = 0; for (let i = 0; i < 64; i++) inv += 2 / (clamp(pace(i / 64), 0.35, 2.5) + clamp(pace((i + 1) / 64), 0.35, 2.5));
      const paceK = inv / 64, lensSpeed = (s) => (LP / DUR) * clamp(pace(s / LP), 0.35, 2.5) * paceK;
      raySpeed = RAY_FLEE * lensSpeed(rayStar);
      for (let q = rayStar; q < LP; q += 1) rayTau.push(rayTau[rayTau.length - 1] + 1 / lensSpeed(q + 0.5));
      // (start 0: the kit adds nothing of its own; where it is on its course is rayTravel's alone)
      ray = F.makeMantaRay({ rng: rn.fork('sand-ray'), light: faunaLight, span: RAY_SPAN, route: pts, closed: false, start: 0, speed: raySpeed, top: '#3a3842', belly: '#e0d8c8' });
      rayBeat = rn() * 10;                                                // the phase its wings beat from
      rayL = ray.route.length;
      { let bd = 1e9; for (let q = 0; q <= Math.min(rayL, 60); q += 0.1) { ray.route.pointAt(q, tmp2); const d = tmp2.distanceTo(rest); if (d < bd) { bd = d; rayS0 = q; } } }
      ray.object.name = 'sand-ray'; scene.add(ray.object);
    }
    await pause();
    // visitors that change with the seed
    // (the turtle wheels over the far side of the wreck: its loop is centred beyond the wreck, so the nearest it ever comes to the
    // lens line is 13 m, whatever the clock)
    if (rf.chance(0.65)) { const tc = onPath(WRECK_S + 3, wreckSide * 21); fauna.push(F.makeTurtle({ rng: rf.fork('turtle'), light: faunaLight, length: 1.5, center: [tc.x, FLOOR + 9.5, tc.z], radius: 6.5, wobble: 0.1, height: 1.2, speed: 0.8 })); }
    {
      const c = onPath(rf.range(0.6, 0.68) * LP, rf.sign() * rf.range(20, 26)), kind = rf.pick(['manta', 'shark', 'none']);
      if (kind === 'manta') fauna.push(F.makeMantaRay({ rng: rf.fork('manta'), light: faunaLight, span: 2.9, center: [c.x, -19, c.z], radius: 12, height: 2, speed: 1.6 }));
      if (kind === 'shark') fauna.push(F.makeShark({ rng: rf.fork('shark'), light: faunaLight, length: 3.6, center: [c.x, -22, c.z], radius: 13, height: 2, speed: 1.5 }));
    }
    // the rare visit (ctx.vary.rare): a pod of three more humpbacks leads the pair down the nave, ghosts in the haze ahead
    if (rare) fauna.push(F.makeWhale({ rng: rf.fork('pod'), length: 12.5, count: 3, light: faunaLight, spread: [6, 2.5, 13], top: '#3a4a58', belly: '#cfd8d8', along: { path, side: -8, up: 16.5, lead: 60, from: 0.34, to: 0.62, drift: 4 } }));
    for (const f of fauna) scene.add(f.object);
    await pause();

    // ---------------------------------------------------------------- the hero: humpback and calf
    const hero = await buildHero(ctx, { palette: PALETTE, calfSide: 1, surfaceY: 13, sunDir: toLight });
    hero.setLight({ sunDir: toLight, sunColor: col(M.sun, 1.55), surfaceY: 13 });
    hero.object.visible = false; scene.add(hero.object);
    const bufSize = new THREE.Vector2(), wA = new THREE.Vector3(), wB = new THREE.Vector3(), poiV = new THREE.Vector3(), poiW = new THREE.Vector3(), camP = new THREE.Vector3(), fwd = new THREE.Vector3(), camW = new THREE.Vector3();
    const gazeAt = (out, u, minAhead) => {                                 // never behind the lens: the gaze tilts up, it does not flip
      path.pointAt(u, camP); path.tangentAt(u, fwd);
      out.sub(camP); const ahead = out.dot(fwd); if (ahead < minAhead) out.addScaledVector(fwd, minAhead - ahead);
      return out.add(camP);
    };
    const whalePoi = (time, u) => { whaleAt(clamp(u, 0.31, 0.74), poiV); poiV.y -= 1; return gazeAt(poiV, u, 9); };
    const plungePoi = (time, u) => { whaleAt(clamp(u, 0.79, 0.9), poiW); poiW.y += 1.5; return gazeAt(poiW, u, 16); };
    const lionsAt = LION_C.clone().setY(-20);
    const rayCol = uw.rays && uw.rays.material && uw.rays.material.uniforms && uw.rays.material.uniforms.uRayColor ? uw.rays.material.uniforms.uRayColor.value : null;
    await pause();

    // ---------------------------------------------------------------- white water where she falls back into the sea (U_IN)
    // Thousands of small bubbles: a fifth of them burst outward under the surface with the crown, the rest are dragged down
    // behind her flukes and rise again. Over them, on the ceiling, the crown: a ring of fine foam running outward (one
    // sheet, drawn in its shader), and a fan of light let down through the broken surface.
    // The crown's age is the mother's own depth: the wreath runs outward over the ceiling while she goes down and is as wide as
    // she is deep (the ring's radius goes with the root of its age, so the age is the square of her depth over the depth of her
    // plunge); it is spent when she has reached the bottom of her plunge. U_SPLASH: where the lens is when she comes back down
    // through the surface; U_DEEP: where it is when she is deepest; PLUNGE: how deep that is (all three read off her track).
    let U_SPLASH = 0.765, U_DEEP = 1, PLUNGE = 1;
    for (let u = 0.765; u <= 1; u += 0.0005) { const y = whaleAt(u, tmp2).y; if (y >= 0) U_SPLASH = u; if (-y > PLUNGE) { PLUNGE = -y; U_DEEP = u; } }
    const crownAgeAt = (u) => { if (u <= U_SPLASH) return 0; if (u >= U_DEEP) return 1; const k = clamp(-whaleAt(u, tmp2).y / PLUNGE, 0, 1); return k * k; };
    const NPL = Math.round(2600 * detail), plumeGeo = new THREE.InstancedBufferGeometry(), rp = rng.fork('plume');
    const crownC = whaleAt(U_IN + 0.002).clone().setY(SURF - 0.3);
    {
      plumeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); plumeGeo.setIndex([0, 1, 2, 1, 3, 2]);
      const aP = new Float32Array(NPL * 4), aR = new Float32Array(NPL * 4);
      for (let i = 0; i < NPL; i++) {
        const ring = i % 5 === 0, fine = !ring && i % 2 === 0, a = rp() * 6.283, da = rp() * 6.283;
        if (ring) {                       // the crown's own bubbles: born on the ring as it passes, just under the ceiling
          const ub = U_IN + rp.range(0, 0.03), rad = 2.5 + 13 * Math.sqrt(crownAgeAt(ub)) + rp.range(-1.4, 1.4);
          aP.set([crownC.x + Math.cos(a) * rad, -rp.range(2.2, 6.5), crownC.z + Math.sin(a) * rad, ub], i * 4);
          const side = smoothstep(-0.55, 0.65, 0.8 * Math.sin(1 - a) + 0.45 * Math.sin(2 - 3 * a) + 0.3 * Math.sin(-7 * a));   // the wreath's own heap and gap (the sheet's angle runs the other way)
          aR.set([Math.cos(a) * 0.7, Math.sin(a) * 0.7, rp.range(0.09, 0.2) * (0.25 + 0.75 * side), rp()], i * 4);
        } else {
          const ub = U_IN + Math.pow(rp(), 1.3) * (fine ? 0.058 : 0.052);
          whaleAt(ub, tmp2);
          const deep = clamp(-tmp2.y / 14, 0, 1), rad = lerp(3.6, 1.5, deep) * (fine ? 0.75 : 1) * Math.sqrt(rp());
          aP.set([tmp2.x + Math.cos(a) * rad, Math.min(tmp2.y + rp.range(-1.6, 1.2), -0.35), tmp2.z + Math.sin(a) * rad, ub], i * 4);
          aR.set([Math.cos(da), Math.sin(da), fine ? rp.range(0.045, 0.1) : rp.range(0.07, 0.15), rp()], i * 4);
        }
        if (i % 200 === 199) await pause();
      }
      plumeGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); plumeGeo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4));
      plumeGeo.instanceCount = NPL;
    }
    const plumeMat = new THREE.ShaderMaterial({ vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, transparent: true, depthWrite: false, fog: true,
      uniforms: { ...fogU(), uU: { value: 0 }, uPeriod: { value: 0 }, uLife: { value: new THREE.Vector2(0.035, 0.085) }, uGrow: { value: new THREE.Vector2(0.6, 0.45) }, uRing: { value: 0.16 }, uGain: { value: 1.3 }, uPx: plumePx, uTime: shared.uTime, uSurf: shared.uSurf, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol } });
    const plume = new THREE.Mesh(plumeGeo, plumeMat); plume.frustumCulled = false; plume.renderOrder = 6; plume.name = 'white-water'; plume.visible = false; scene.add(plume);
    await pause();
    const crownMat = new THREE.ShaderMaterial({ vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uAge: { value: 0 }, uTime: shared.uTime, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol } });
    const crown = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), crownMat);
    crown.rotation.x = -Math.PI / 2; crown.position.copy(crownC); crown.renderOrder = 5; crown.name = 'breach-crown'; crown.visible = false; scene.add(crown);
    const shaftGeo = new THREE.BufferGeometry(), NSH = 9;
    {
      const sp = [], sa = [], si = [];
      for (let i = 0; i < NSH; i++) {
        const a = (i + rp()) / NSH * 6.283, rad = rp.range(1.5, 6.5), len = rp.range(11, 19), seed = rp(), o = i * 4;
        for (const [x, y] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { sp.push(x, y, 0); sa.push(Math.cos(a) * rad, Math.sin(a) * rad, len, seed); }
        si.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
      shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); shaftGeo.setAttribute('aS', new THREE.Float32BufferAttribute(sa, 4)); shaftGeo.setIndex(si);
    }
    const shaftMat = new THREE.ShaderMaterial({ vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uAge: { value: 0 }, uTime: { value: 0 }, uC: { value: crownC }, uDir: { value: uw.rayDir.clone().normalize() }, uCol: { value: col(M.sun, 0.34) } } });
    const shafts = new THREE.Mesh(shaftGeo, shaftMat); shafts.frustumCulled = false; shafts.renderOrder = 6; shafts.name = 'breach-shafts'; shafts.visible = false; scene.add(shafts);
    await pause();

    // ---------------------------------------------------------------- water haze over the far portal
    // The engine's portal ignores fog, so from 500 m it would read as a crisp ring in water that only carries ~120 m.
    // A soft disc just in front of it, the colour the backdrop has there, thins out as the camera closes: the portal swims
    // up out of the haze. (It is drawn before the other transparent things; drawn last it wiped the light shafts in front
    // of it and stood in the far water as a dark lump.)
    const veilMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false,
      uniforms: { uCol: { value: fogCol.clone() }, uOp: { value: 1 } },
      vertexShader: 'varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform vec3 uCol; uniform float uOp; varying vec2 vP; varying vec3 vW;
        ${FOG_TINT}
        void main(){ float r = length(vP); vec3 d = vW - cameraPosition; float vy = d.y/max(length(d), 1e-4);
          gl_FragColor = vec4(uCol*waterTint(min(vy, 0.)), uOp*(1.-smoothstep(.8, 1., r))); }` });
    // VEIL: the opening comes up out of the haze between 260 m and 120 m from it (the first version's figures: beyond 260 m
    // nothing of the way out is seen, neither the opening nor its glow); EXIT_LIGHT: how strongly its light falls on the rock
    const VEIL = [120, 260], EXIT_LIGHT = 1.2;
    const veil = new THREE.Mesh(new THREE.CircleGeometry(1, 40), veilMat);
    veil.scale.setScalar(16); veil.renderOrder = -5; veil.name = 'portal-haze';   // first of the transparent things: the shafts, jellies and bubbles in front of it draw over it
    path.tangentAt(1, tmp2); veil.position.copy(end).addScaledVector(tmp2, -0.6); veil.lookAt(tmp.copy(end).addScaledVector(tmp2, -10));
    scene.add(veil);
    // the light of the way out (the engine's halo is off). On the rock: every rock and sand material carries it (uExit*), a light at
    // the opening that faces up the aisle and thins with the square of the distance from the opening's edge (half gone 9 m out).
    // In the water: a sheet level with the opening, a hair in front of it, that draws only soft light (portal-glow)
    shared.uExit.value.set(end.x, end.y, end.z, 6.5); shared.uExitCol.value.copy(col('#c8f6dc', EXIT_LIGHT));
    const rimMat = new THREE.ShaderMaterial({ vertexShader: RIM_VERT, fragmentShader: RIM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      uniforms: { uColor: { value: col('#c8f6dc') }, uTime: { value: 0 }, uFar: { value: 0 }, uRim: { value: 0 }, uR: { value: 6.5 } } });
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), rimMat);
    tmp2.y = 0; tmp2.normalize(); rim.position.copy(end).addScaledVector(tmp2, -0.05); shared.uExitDir.value.set(-tmp2.x, 0, -tmp2.z, 0.012); rim.lookAt(tmp.copy(end).addScaledVector(tmp2, -10));
    rim.renderOrder = 6; rim.frustumCulled = false; rim.name = 'portal-glow'; rim.visible = false; scene.add(rim);
    await pause();

    return {
      scene, path, duration: DUR, pace, ride: 'none',
      camera: { fov: 64, near: 0.3, far: 900, lookAhead: 24, sway: 1, bank: 0.8 },
      pois: [
        { at: [wreck.position.x, wreck.position.y + 3, wreck.position.z], from: 0.15, to: 0.35, weight: 0.55 },
        { at: lionsAt, from: 0.33, to: 0.42, weight: 0.5, fade: 0.25 },
        { at: whalePoi, from: 0.37, to: 0.775, weight: 0.66, fade: 0.2 },
        { at: plungePoi, from: 0.775, to: 0.89, weight: 0.45 },
      ],
      portal: { shape: 'circle', radius: 6.5, color: '#c8f6dc', glow: 0.75, style: 'ring', halo: false, revealDistance: 220 },   // the light of the way out is the world's own (on the rock, and portal-glow in the water)
      post: { exposure: M.exposure, bloom: { strength: 0.5, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#f6ffec', shadowTint: '#021a22', vignette: 0.38, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        shared.uTime.value = time;
        camera.getWorldPosition(camW);
        uw.update(dt, time, camera); keepWater(); uw.applyTo(scene, camera);
        if (rayCol) rayCol.multiplyScalar(0.4 + 0.6 * smoothstep(0, 0.06, u));       // thinner shafts in the entry view: they washed out the picture seen through the previous portal
        for (const g of growth) g.update(dt, time, camera);
        for (const k of kelpChunks) k.m.visible = k.s1 > u * LP - 50 && k.s0 < u * LP + 150;
        const sv = u < 0.5; sardines.object.visible = sv;
        if (sv) { sardines.uniforms.uCam.value.copy(camW); sardines.uniforms.uHead.value = sardines.head(u); }
        for (const f of fauna) f.update(dt, time, camera, u);
        // the ray: its place on its course by the flight's clock, its wing beat by the world's (a stir while it lies, full strokes in flight)
        const rt = rayTravel(u), flown = smoothstep(0.5, 9, rt - rayS0);
        ray.update(dt, rt / raySpeed, camera, u); ray.uniforms.uPhase.value = time + rayBeat; ray.uniforms.uTime.value = time; ray.uniforms.uFin.value.y = lerp(0.07, 0.4, flown);
        ray.object.visible = rt < 0.94 * rayL;                             // (the end of its course: the water took it long before)
        const ls = lionTravel(u), lv = !ctx.through && ls < lionL + 16 && camW.distanceTo(lionsAt) < 170; lions.object.visible = lv;      // (beyond the water's reach before, gone at the surface after)
        lions.update(dt, clamp(ls, 0.2, lionL + 16) / LION_SPEED, camera, u);
        lionTrail.visible = lv; lionTrail.material.uniforms.uU.value = ls / LION_SPEED;
        plumePx.value = ctx.renderer.getDrawingBufferSize(bufSize).y / (2 * Math.tan(camera.fov * Math.PI / 360));
        const pd = camW.distanceTo(end);
        veilMat.uniforms.uOp.value = smoothstep(VEIL[0], VEIL[1], pd); veil.visible = pd > VEIL[0];       // the opening comes up out of the haze
        veilMat.uniforms.uCol.value.copy(scene.fog.color);
        // the glow of the way out comes up through the water with the opening itself (the veil's own curve: nothing of it beyond
        // VEIL[1]): a wide soft bloom first; as the lens closes the bloom thins and the rock shows the light (one smooth curve)
        const thru = 1 - smoothstep(VEIL[0], VEIL[1], pd), farK = 1 - Math.exp(-5 * thru);
        rimMat.uniforms.uTime.value = time; rimMat.uniforms.uFar.value = farK; rimMat.uniforms.uRim.value = 1 - Math.exp(-8 * thru * thru); rim.visible = farK > 0.004;
        const crownAge = crownAgeAt(u), crownOn = crownAge > 0 && crownAge < 1;
        plumeMat.uniforms.uU.value = u; plume.visible = u > 0.76 && u < 0.96;
        crownMat.uniforms.uAge.value = crownAge; crown.visible = crownOn; shaftMat.uniforms.uAge.value = crownAge; shaftMat.uniforms.uTime.value = time; shafts.visible = crownOn;
        // the pair: on screen from 0.31, over the roof of the vault and out through the surface, back in at U_IN, left behind over the chancel
        const hv = !ctx.through && ((u > 0.31 && u < 0.746) || (u > 0.777 && u < 0.985)); hero.object.visible = hv;
        if (hv) {
          whaleAt(u - 0.004, wA); whaleAt(u + 0.004, wB); whaleAt(u, hero.object.position);
          wB.sub(wA).add(hero.object.position); hero.object.lookAt(wB);
          hero.setLight({ surfaceY: Math.max(1, SURF - hero.object.position.y) });
          hero.setProgress(u < 0.765 ? (u - 0.4) / 0.28 : 0); hero.update(dt, time, camera);
        }
      },
      dispose() {
        hero.dispose(); dummyTex.dispose(); if (matSea.map) matSea.map.dispose();
        for (const o of [land, uw, lions, ray, ...growth, ...fauna]) if (o && typeof o.dispose === 'function') o.dispose();
      },
    };
  },
};
