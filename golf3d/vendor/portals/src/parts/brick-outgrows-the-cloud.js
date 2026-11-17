// The Brick That Outgrew the Cloud: hero set piece and style kit. After Pieter Bruegel the Elder (The Tower of Babel, 1563).
//
// WHAT IT IS. The tower, whole: one spiral ramp (no closed tiers) of round-arched bays in pale stone facing over a raw
// red brick core, upper turns still brick, living rock breaking through the port flank, a crag of the hill inside the last
// ring, the bite (the far starboard flank cut open: ring inside ring of red vault, cut ends as round arches, vault backs
// as ledges), about 20 treadwheel cranes with turning wheels, scaffolds on the cut faces and round the exit arch, huts,
// troughs and stacks along the roads, ladders, ropes, ~3,500 ant people (men on the coping of every tier), the red brick-dust
// and white lime stains, the cloud, the hoist with its pallet, and the exit: a brick arch on its timber centering with
// the keystone hanging from a crane's rope.
//
// SIZE AND FRAME. radius 400 (foot 350 + buttresses; the cloud reaches further), height 520. Origin at the base centre,
// +Y up, FRONT (the entry side) toward +Z, starboard flank toward +X. In the world: object.position.set(0, 0, 1200);
// object.rotation.y = Math.PI, so that local +Z looks back down the entry course and local +X is world starboard (-X).
// The tower leans 3 degrees toward local -X (port; left in the first frame). Expects flat ground at y 0 round it.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), setProgress(u), dispose,
//   cloud, cloudAt(u, out), pallet, palletHeld, keystone }
//   opts.palette  seven hex strings in the brief's order (default PALETTE)
//   opts.detail   0.6..1 thins scaffolds, people and cloud lobes (default ctx.quality.detail or 1)
//   opts.stoneTo  turn (0..7) below which the bays are stone-faced; default seeded 4.3..5.25; about 2 for "the dark panel"
//   opts.distK    strength of the brown/green/blue distance rings on the tower (default 0.3: it stays stone and red)
//   opts.keepLight true if the world sets STYLE_UNIFORMS.uLight itself (default: the hero sets it every frame to
//                 "from starboard and behind at entry, 40 degrees up", turned with the object)
// PROGRESS. Call hero.setProgress(u) every frame before hero.update(): bays of the ramp wall rise at u 0.50-0.61, bays of
// the crown rise from u 0.01 on (three in the first three seconds) and at 0.80-0.96, scaffolds one lift ahead, the stains
// creep down all flight, the pallet races up the bite at u 0.635-0.69, the keystone comes down at u 0.86-0.995, the cloud
// slides. If setProgress is never called (the set-piece viewer) u loops with time. Idle life runs on time: wheels, rope
// swing, walking people, cloud lobes. For the rare "drop" set hero.palletHeld = true and move hero.pallet yourself.
//
// ANCHORS (local space, lean applied; convert with object.localToWorld):
//   flyThrough   ordered safe line, 6 m clear: quay, climb, the ramp ledge (10 m over the roadway, 9 m off the buttresses,
//                near crane 12 m to port), the bite (12 m over its floor), the top ledge, approach, arch mouth, portal seat
//   biteLine (9 points, also in flyThrough), rampStart, biteMouth, biteHead
//   portalSeat   { position, facing, width 14 }: 6 m inside the arch mouth; facing = the way the mouth looks (back along
//                the path). The last 70 m (approach -> archMouth) run straight and level along local +Z (world -Z).
//   archMouth, approach, keystoneSlot, nearCrane, greatCrane (the stains start under it), hoist (where the pallet passes),
//   fleetGaze (a point far out between the piers: the poi of u 0.70-0.76), crown, top, cloud, viewpoints, light
//
// ADDED FOR THE WORLD. STYLE_UNIFORMS.uRim and bowlLift(xz) (GLSL, in STYLE_DECL): the tipped-up earth, flat within
// 1.2 km of the tower and rising to uRim at 9 km; bruegelMaterial({ bowl: true }) lifts its vertices by it. driftShadow(wp):
// the small clouds' shadows, drifting on the clock over every surface (bruegel() includes it). uSpinT: the treadwheels'
// own clock; hero.wheelsHeld = true stops them. The hero also returns frame (the tower's spiral frame: bearing, at, frac,
// surface, bite), lean (the leaning group; lean.matrixWorld takes tower-frame points to the world) and hoistRange
// [low, high] (the pallet's travel, in the leaning frame). The world may replace hero.cloudAt(u, out).
//
// COST. About 144k triangles, 39 draw calls, no lights, no textures; build about 210 ms in yielded steps (none over 50 ms).
// opts.dbg = 'bite' | 'ramp' | 'exit' | 'top' moves the set-piece viewer's orbit close to that part.
//
// THE STYLE, for the rest of the world (flat pipeline: post { flat: 1, bloom 0, saturation 1, contrast 1 }; no inverse).
//   STYLE_UNIFORMS   the one shared uniforms object: uTime, uU, uLight, uEye, uView, uDist (ring distances), uGreen, uBlue,
//                    uShadowC, uUmber2, uCloud/uCloudR (cloud shadow ellipse), uTowerPos/uTowerLean (tower shadow), stains.
//                    hero.update() sets all of them every frame; the world only shades with them.
//   STYLE_DECL       GLSL uniform declarations (vertex-safe). STYLE_GLSL = STYLE_DECL + fragment functions:
//                    bruegel(light, shade, n, wp, uv, mark, distK) the whole look; cloudShadow(wp); towerShadow(wp);
//                    pigmentDistance(c, wp, k); masonry(uv, mark); ruled(x, period, width) fwidth-safe ruling.
//   bruegelMaterial({ instanced, distK, side, towerShadow })  THE material: two authored tones per vertex (aLight, aShade),
//                    hard step on the normal, cast shadow as a third flat colour, courses/putlog holes/day-work patches
//                    ruled from aUV in metres by aMark (0 none, 1 brick, 2 ashlar, 3 timber, 5/6 arch ring, 7 rock), pigment by
//                    ground distance from the eye. distK 1 for land, town, ships; 0.3 for the tower.
//                    towerShadow: true adds the tower's cast shadow (use it on ground, sea, town, ships).
//   makePaint()      geometry collector for it (poly, box, build). makeInstances(): add(matrix, pigmentPair, mark,
//                    birthU, seed) then mesh(geometry, instancedMaterial); vertices with aTint 1 take the instance pigment.
//   makePigments(pal) the tone pairs [light, shade] (stone, brick, timber, thatch, rock, turf, lime, smock, red, dark)
//   mixHex(a, b, t)  mixes two hexes as paint (display space)
//   contourMaterial({ width, distK, bowl }) + addHullNormals(geo)  the hair-thin brown contour: an inverted hull, constant pixels
//   ribbonMaterial() + makeRibbons()  ropes, shrouds, poles, ladders: never under 1.5 px, optional sway and birth
//   figureMaterial(pig, { minPx, nearK, smock, smock2 }) + makeFigures()  his people: cap-and-smock lumps, never under
//                    minPx (~4 px; nearK holds them larger within 260 m), walking to and fro
//   cloudMaterial(white, under, breath) + cloudGeometry(rng, len, wid, thick, lobes)  lobed lead-white clouds, flat
//                    underside; cloudGeometrySteps(..., detail, yieldNow) builds the same a few lobes at a time
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ------------------------------------------------------------------------------------------------------------
// THE STYLE: oil on oak panel, flat pigments, after Pieter Bruegel the Elder.
// ------------------------------------------------------------------------------------------------------------
export const PALETTE = ['#D9C7A3', '#A8452E', '#7A5C38', '#5F7A45', '#6E8C96', '#2F5560', '#EEE6D2'];
const UMBER2 = '#3B2A14';   // umber laid double: contour, arch mouths, base of every shade tone

// One uniforms object shared by every material of the style (pass it on, never clone it).
export const STYLE_UNIFORMS = {
  uTime: { value: 0 },                                            // idle clock (wings, smoke, walking)
  uSpinT: { value: 0 },                                           // the treadwheels' own clock (it can be stopped: hero.wheelsHeld)
  uRim: { value: 1500 },                                          // height of the land bowl's rim, 9 km from the tower (the world sets it)
  uU: { value: 0.5 },                                             // journey progress 0..1 (births, stains, shadow)
  uLight: { value: new THREE.Vector3(-0.55, 0.64, 0.53).normalize() },  // world direction TOWARD the light
  uEye: { value: new THREE.Vector3() },                           // world camera position (distance rings)
  uView: { value: new THREE.Vector2(800, 450) },                  // drawing buffer size in pixels
  uDist: { value: new THREE.Vector4(500, 700, 2500, 3000) },      // brown ends, green begins, green ends, blue begins
  uGreen: { value: new THREE.Color(PALETTE[3]) },
  uBlue: { value: new THREE.Color(PALETTE[4]) },
  uShadowC: { value: new THREE.Color(PALETTE[5]) },
  uUmber2: { value: new THREE.Color(UMBER2) },
  uCloud: { value: new THREE.Vector4(0, 415, 0, 0.3) },           // cloud centre (world xyz) and yaw
  uCloudR: { value: new THREE.Vector2(300, 110) },                // cloud half length and half width
  uTowerPos: { value: new THREE.Vector3() },                      // tower base centre, world
  uTowerLean: { value: new THREE.Vector2(-0.0524, 0) },           // world xz drift of the axis per metre of height
  uTowerInv: { value: new THREE.Matrix4() },                      // world -> the tower's leaning frame (stains)
  uStainA: { value: new THREE.Vector4(0.5, 9, 330, 210) },        // the red brick-dust stain
  uStainB: { value: new THREE.Vector4(0.66, 6, 300, 140) },       // the white lime stain
  uStainCA: { value: new THREE.Color(PALETTE[1]) },
  uStainCB: { value: new THREE.Color(PALETTE[6]) },
  uVaultC: { value: new THREE.Color('#7a3a23') },                 // the lightest tone inside an arch mouth: brick in shade
};

// GLSL shared by every material: the two-tone step, the cast shadows, the pigment rings, the ruled marks.
// Uniform declarations alone (safe in a vertex shader); STYLE_GLSL adds the fragment functions.
export const STYLE_DECL = /* glsl */`
uniform float uTime, uU, uSpinT, uRim;
uniform vec3 uLight, uEye, uGreen, uBlue, uShadowC, uUmber2, uTowerPos, uVaultC;
uniform vec2 uView, uCloudR, uTowerLean;
uniform vec4 uDist, uCloud;
float bHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// The tipped-up earth: flat within 1.2 km of the tower, then rising, sea and all, to uRim at 9 km.
float bowlLift(vec2 xz) { float s = clamp((length(xz - uTowerPos.xz) - 1200.0) / 7800.0, 0.0, 1.3); return uRim * (0.3 * s + 0.7 * s * s); }
`;
export const STYLE_GLSL = STYLE_DECL + /* glsl */`
// 1 inside the cloud's cast shadow (a lobed ellipse on the plane of the cloud, thrown along the light), hard edged.
float cloudShadow(vec3 wp) {
  float t = max(uCloud.y - wp.y, 0.0) / max(uLight.y, 0.08);
  vec2 p = wp.xz + uLight.xz * t - uCloud.xz;
  float c = cos(uCloud.w), s = sin(uCloud.w);
  vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) / max(uCloudR, vec2(1.0));
  float e = dot(q, q) * (1.0 + 0.16 * sin(q.x * 9.0 + 1.3 + uTime * 0.8) * sin(q.y * 7.0 - uTime * 0.5));      // the lobes boil slowly, as the cloud's do
  float fw = max(fwidth(e), 1e-4);
  return (1.0 - smoothstep(1.0 - fw, 1.0 + fw, e)) * step(wp.y, uCloud.y - 4.0);
}
// 1 inside the shadows of the small clouds that drift over the whole country: flat, hard-edged, lobed ellipses on a
// 1.1 km grid, moving with the clock. Every surface asks where its ray to the light meets the ground, so the same shadow
// lies on the sea, climbs a gable and crosses the tower's face.
float driftShadow(vec3 wp) {
  vec2 p = wp.xz - uLight.xz * (max(wp.y - bowlLift(wp.xz), 0.0) / max(uLight.y, 0.08));
  vec2 bg = (p - vec2(uTime * 14.0, uTime * 6.0)) / 1100.0;
  vec2 bc = floor(bg), bf = (fract(bg) - 0.5 - 0.25 * (vec2(bHash(bc), bHash(bc + 3.1)) - 0.5)) * vec2(1.6, 2.6);
  float be = dot(bf, bf) * (1.0 + 0.2 * sin(bf.x * 40.0 + uTime * 0.4) * sin(bf.y * 31.0));
  float bw = max(fwidth(be), 1e-5);
  return (1.0 - smoothstep(0.16 - bw, 0.16 + bw, be)) * step(0.3, bHash(bc + 7.7));
}
// 1 inside the tower's cast shadow (for the ground, the town and the sea; the tower itself does not use it).
float towerShadow(vec3 wp) {
  float sh = 0.0;
  for (int i = 0; i < 9; i++) {
    float h = float(i) * 60.0;
    float t = max(h - (wp.y - uTowerPos.y), 0.0) / max(uLight.y, 0.08);
    vec2 c = uTowerPos.xz + uTowerLean * h - uLight.xz * t;
    float r = 350.0 - 28.0 * float(i);
    vec2 d = wp.xz - c;
    sh = max(sh, step(dot(d, d), r * r));
  }
  return sh;
}
// Distance changes the pigment, never the sharpness: brown, then green, then blue, in rings round the eye.
vec3 pigmentDistance(vec3 c, vec3 wp, float k) {
  float d = length(wp.xz - uEye.xz);
  float l = dot(c, vec3(0.3, 0.5, 0.2));
  vec3 g = uGreen * (0.42 + 1.25 * l), b = mix(uBlue * (0.42 + 1.2 * l), uBlue, 0.2);
  c = mix(c, g, smoothstep(uDist.x, uDist.y, d) * k);
  c = mix(c, b, smoothstep(uDist.z, uDist.w, d) * k);
  return c;
}
// A ruled line every 'period' metres, 'w' metres wide, never thinner than 1.5 px; below 3 px a period it is its flat average.
float ruled(float x, float period, float w) {
  float fw = max(fwidth(x), 1e-6);
  float ww = max(w, 1.5 * fw);
  float d = abs(fract(x / period + 0.5) - 0.5) * period;
  float line = 1.0 - smoothstep(0.5 * ww - 0.5 * fw, 0.5 * ww + 0.5 * fw, d);
  return mix(w / period, line, smoothstep(3.0, 6.0, period / fw));
}
float fadeAt(float x, float period) { return smoothstep(3.0, 6.0, period / max(fwidth(x), 1e-6)); }
// A coarse bond: courses ch tall and bl long, staggered; the lines keep to 1.5 px.
float coarse(vec2 uv, float ch, float bl) {
  float xs = uv.x + bl * 0.5 * mod(floor(uv.y / ch), 2.0);
  float odd = step(0.86, bHash(vec2(floor(xs / bl), floor(uv.y / ch) + 31.0)));
  return max(max(0.36 * ruled(uv.y, ch, ch * 0.1), 0.3 * ruled(xs, bl, ch * 0.1)), 0.16 * odd);
}
// The marks of masonry: returns how much double umber is glazed over the tone (0..~0.5). mark: 1 brick, 2 ashlar, 3 timber.
float masonry(vec2 uv, float mark) {
  float m = 0.0;
  if (mark > 8.5) return 0.0;
  if (mark > 7.5) {                                     // turf: tufts, a dark tick each, and far off whole patches a tone apart
    vec2 tc = floor(uv / vec2(0.9, 0.6)), tf = fract(uv / vec2(0.9, 0.6));
    m = 0.55 * step(0.5, bHash(tc)) * step(abs(tf.x - 0.5), 0.1) * step(abs(tf.y - 0.45), 0.32) * fadeAt(uv.y, 0.25);
    vec2 pc = uv / vec2(2.3, 1.5) + 0.35 * sin(uv.yx * 1.9);
    m = max(m, 0.26 * step(0.5, bHash(floor(pc) + 5.0)) * fadeAt(uv.y, 1.5));
    m = max(m, 0.14 * step(0.6, bHash(floor(uv / vec2(9.0, 6.0)) + 9.0)));
  } else if (mark > 6.5) {                              // living rock: beds and fissures, drawn
    m = max(0.6 * ruled(uv.y + 0.7 * sin(uv.x * 0.31), 2.6, 0.09), 0.5 * ruled(uv.x + 1.1 * sin(uv.y * 0.43) + 3.1 * bHash(vec2(floor((uv.y + 0.7 * sin(uv.x * 0.31)) / 2.6 + 0.5), 2.0)), 6.2, 0.09));
    m = max(m, 0.2 * step(0.55, bHash(floor(vec2(uv.x / 6.2 + 0.13 * sin(uv.y * 0.43), uv.y / 2.6)))) * fadeAt(uv.y, 2.6));
    m = max(m, 0.12 * step(0.5, bHash(floor(vec2(uv.x / 19.0, uv.y / 7.8)) + 4.0)));
  } else if (mark > 4.5) {                              // an arch ring: voussoirs across the band, a contour on each edge
    float vp = mark < 5.5 ? 0.075 : 0.5, v1 = mark < 5.5 ? 4.0 : 3.0, v2 = mark < 5.5 ? 10.0 : 3.0;
    float g0 = fadeAt(uv.x, vp), g1 = fadeAt(uv.x, vp * v1), g2 = fadeAt(uv.x, vp * v2);
    m = max(0.36 * ruled(uv.x, vp, vp * 0.14), 0.8 * ruled(uv.y, 1.5, 0.07));
    // far off the unit grows: the ring is still counted, in groups of bricks on edge
    m = max(m, 0.4 * ruled(uv.x, vp * v1, vp * 0.4) * g1 * (1.0 - 0.85 * g0));
    m = max(m, 0.4 * ruled(uv.x, vp * v2, vp * 0.6) * g2 * (1.0 - 0.85 * g1));
    m = max(m, 0.12 * step(0.8, bHash(vec2(floor(uv.x / vp), 3.0))) * g0);
  } else if (mark > 2.5) {                              // timber: plank joints along the piece
    m = 0.5 * ruled(uv.x, 0.32, 0.03);
  } else if (mark > 0.5) {
    bool brick = mark < 1.5;
    float ch = brick ? 0.065 : 0.46, bl = brick ? 0.215 : 1.05;
    float row = floor(uv.y / ch);
    float xs = uv.x + bl * 0.5 * mod(row, 2.0);
    float fine = fadeAt(uv.y, ch);
    float odd = step(0.9, bHash(vec2(floor(xs / bl), row)));                 // every tenth brick a tone darker
    m = max(m, 0.34 * ruled(uv.y, ch, ch * 0.16));
    m = max(m, 0.30 * ruled(xs, bl, ch * 0.16) * fine);
    m = max(m, mix(0.02, 0.2 * odd, fine));
    // far off the unit grows, as the painter's does: courses are still drawn, a few to a mark, with their perpends
    float k1 = brick ? 4.0 : 3.0, k2 = brick ? 10.0 : 3.0;
    float f1 = fadeAt(uv.y, ch * k1), f2 = fadeAt(uv.y, ch * k2);
    m = max(m, coarse(uv, ch * k1, bl * k1) * f1 * (1.0 - 0.85 * fine));
    m = max(m, coarse(uv, ch * k2, bl * k2) * f2 * (1.0 - 0.85 * f1) * (brick ? 1.0 : 0.0));
    // the lift: a scaffold height of work, its joint and its putlog holes
    float lh = brick ? 1.3 : 1.84, lw = brick ? 2.6 : 3.15;
    float lrow = floor(uv.y / lh);
    m = max(m, 0.26 * ruled(uv.y, lh, 0.035));
    vec2 hp = vec2(fract(uv.x / lw + 0.37 * lrow) * lw, fract(uv.y / lh) * lh) - vec2(0.5 * lw, 0.62 * lh);
    float hw = max(0.09, 0.75 * fwidth(uv.y));
    float hole = (1.0 - smoothstep(hw, hw * 1.3 + 1e-4, max(abs(hp.x), abs(hp.y))));
    m = max(m, mix(0.02, 0.8 * hole, fadeAt(uv.y, lh * 0.33)));
    // the day's work: whole patches a tone apart, flat, so no wall is ever bare
    vec2 dc = floor(vec2(uv.x / (lw * 3.0) + 0.5 * mod(floor(uv.y / (lh * 3.0)), 2.0), uv.y / (lh * 3.0)));
    m = max(m, 0.13 * step(0.62, bHash(dc + 7.0)) * fadeAt(uv.y, lh * 3.0));
    m = min(m * 1.3, 0.7);
  }
  return m;
}
// An arch mouth (mark 9; q in arch units from the springing centre, half span 1). Far off it is flat double umber. Near,
// the vault is drawn running back into the dark in one-point perspective: ring inside ring, each a tone deeper, a rib
// where each begins, the floor and one wall a tone lighter, the end double umber.
vec3 vaultMouth(vec2 q) {
  float px = 1.0 / max(fwidth(q.x) + fwidth(q.y), 1e-4);
  float near = smoothstep(16.0, 34.0, px);
  vec2 vp = vec2(0.14, -0.9), d = q - vp;
  float dd = max(dot(d, d), 1e-5), vd = dot(vp, d);
  float kArc = dd / max(-vd + sqrt(max(vd * vd + dd * (1.0 - dot(vp, vp)), 0.0)), 1e-4);
  float kWall = d.x > 0.0 ? d.x / (1.0 - vp.x) : -d.x / (1.0 + vp.x);
  float kFloor = -d.y / 1.7;
  float k, zone;      // zone: 0 soffit, 1 wall, 2 floor
  if (d.y < 0.0) { k = max(kWall, kFloor); zone = kFloor > kWall ? 2.0 : 1.0; }
  else if (vp.y + d.y / max(kWall, 1e-4) <= 0.0) { k = kWall; zone = 1.0; }
  else { k = kArc; zone = 0.0; }
  k = clamp(k, 0.02, 1.0);
  float lk = log(k) / log(0.76), ring = floor(lk), fl = lk - ring, fw = max(fwidth(lk), 1e-4);
  float m = min(0.08 + 0.24 * ring, 0.96);
  m -= zone > 1.5 ? 0.16 : (zone > 0.5 && d.x > 0.0 ? 0.1 : 0.0);
  float rib = (1.0 - smoothstep(0.1, 0.1 + fw, fl)) * step(0.5, ring) * step(zone, 1.5);
  m = mix(m, max(m - 0.3, 0.0), rib);
  m = mix(m, 0.97, step(4.5, lk));
  return mix(uVaultC, uUmber2, clamp(mix(1.0, m, near), 0.0, 1.0));
}
// THE routine. cl / cs: the light and shade pigments of this surface; n: world normal; wp: world position;
// uv: metres along and up the surface; mark: 0 none, 1 brick, 2 ashlar, 3 timber, 5 brick arch ring, 6 stone arch ring, 7 living rock
// (ring uv: x along the ring, y 0..1.5 across the band); distK: strength of the pigment rings.
vec3 bruegel(vec3 cl, vec3 cs, vec3 n, vec3 wp, vec2 uv, float mark, float distK) {
  float lit = step(0.04, dot(n, uLight));
  if (mark > 6.5 && mark < 7.5) {      // living rock: every bed carries its turf (a band with a ragged lower edge), and whatever lies flat is turf
    float bed = uv.y / 10.5 + 0.3 * sin(uv.x * 0.045) + 0.17 * sin(uv.x * 0.13 + 1.7);
    float bi = floor(bed), bf = bed - bi + 0.05 * sin(uv.x * 0.8 + bi * 2.3) + 0.03 * sin(uv.x * 2.9);
    float gap = step(0.3, bHash(vec2(floor(uv.x / 37.0 + bi * 0.37), bi)));
    if (bf > 0.6 - 0.16 * bHash(vec2(bi, 5.0)) && gap > 0.5 || n.y > 0.82) { cl = mix(uGreen, uUmber2, 0.2); cs = mix(uGreen, uUmber2, 0.58); mark = 8.0; }
  }
  vec3 c = mix(cs, cl, lit);
  vec3 du = cl - uUmber2;
  float sh = max(cloudShadow(wp), driftShadow(wp));
#ifdef TOWER_SHADOW
  sh = max(sh, towerShadow(wp));
#endif
  c = mix(c, mix(cs, uShadowC, 0.25 * step(0.004, dot(du, du))), sh);
  c = mix(c, uUmber2, masonry(uv, mark));
  if (mark > 8.5) c = vaultMouth(uv);
  return pigmentDistance(c, wp, distK);
}
`;

const STYLE_VERT = /* glsl */`
attribute vec3 aLight, aShade;
attribute vec2 aUV;
attribute float aMark;
#ifdef INST
attribute vec3 iLight, iShade;     // pigment pair of this instance, taken where the vertex has aTint 1
attribute vec4 iInfo;              // x: mark of tinted parts, y: birth u, z: seed, w: spare
attribute float aTint;
#endif
varying vec3 vL, vS, vN, vW;
varying vec2 vUV;
varying float vMark;
void main() {
  vec3 p = position, n = normal;
  vL = aLight; vS = aShade; vMark = aMark; vUV = aUV;
#ifdef INST
  vL = mix(aLight, iLight, aTint); vS = mix(aShade, iShade, aTint);
  if (aTint > 0.5) vMark = aMark > 3.5 ? iInfo.x + 4.0 : iInfo.x;      // aMark 4 on a tinted vertex = the arch ring of the instance's masonry
#ifdef SPIN
  { float a = uSpinT * iInfo.w, c = cos(a), sn = sin(a); p.yz = vec2(c * p.y - sn * p.z, sn * p.y + c * p.z); n.yz = vec2(c * n.y - sn * n.z, sn * n.y + c * n.z); }
#endif
  float grow = smoothstep(iInfo.y, iInfo.y + 0.035, uU);
  p.y *= grow; p.z *= step(0.001, grow);
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vUV = aMark > 8.5 ? aUV : aUV * sc.xy + vec2(iInfo.z * 37.0, iInfo.z * 11.0);
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
#ifdef BOWL
  wp.y += bowlLift((modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz);
#endif
  vN = mat3(modelMatrix) * (mat3(instanceMatrix) * (n / max(sc * sc, vec3(1e-6))));
#else
  vec4 wp = modelMatrix * vec4(p, 1.0);
#ifdef BOWL
  wp.y += bowlLift(wp.xz);
#endif
  vN = mat3(modelMatrix) * n;
#endif
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
const STYLE_FRAG = /* glsl */`
uniform float uDistK;
varying vec3 vL, vS, vN, vW;
varying vec2 vUV;
varying float vMark;
#ifdef STAIN
uniform mat4 uTowerInv;
uniform vec4 uStainA, uStainB;        // bearing (rad), half width (m), top height, full length (m), all in the tower's frame
uniform vec3 uStainCA, uStainCB;
float stainMask(vec3 tp, vec4 st) {
  float r = length(tp.xz);
  float a = atan(tp.x, r < 1e-3 ? 1.0 : tp.z) - st.x;
  a -= 6.2831853 * floor(a / 6.2831853 + 0.5);
  float d = a * r, tongue = floor(d / 4.5);
  float len = st.w * (0.5 + 0.5 * uU) * (0.45 + 0.55 * bHash(vec2(tongue, st.z)));
  float hw = st.y * (0.75 + 0.25 * bHash(vec2(tongue, 3.0)));
  // near, a tongue is runs and drips a hand wide with wall between them (never a slab of one colour); far, its flat average
  float run = floor(d / 1.3), drip = step(fract(d / 1.3), 0.34 + 0.4 * bHash(vec2(run, 7.0))) * step(st.z - len * (0.35 + 0.65 * bHash(vec2(run, 9.0))), tp.y);
  return step(abs(d), hw) * step(st.z - len, tp.y) * step(tp.y, st.z + 2.0) * mix(0.8, drip, fadeAt(d, 1.3));
}
#endif
void main() {
  vec3 n = vN / max(length(vN), 1e-5);
  if (!gl_FrontFacing) n = -n;
  vec3 cl = vL, cs = vS;
#ifdef STAIN
  vec3 tp = (uTowerInv * vec4(vW, 1.0)).xyz;
  float keep = step(0.02, dot(vL - uUmber2, vL - uUmber2)) * step(n.y, 0.6);          // the dark mouths take no dust, and it runs down faces: the roads stay their own colour
  float sa = stainMask(tp, uStainA) * keep, sb = stainMask(tp, uStainB) * keep;
  cl = mix(cl, uStainCA, 0.82 * sa); cs = mix(cs, mix(uStainCA, uUmber2, 0.5), 0.82 * sa);
  cl = mix(cl, uStainCB, 0.85 * sb); cs = mix(cs, mix(uStainCB, uUmber2, 0.45), 0.85 * sb);
#endif
  gl_FragColor = vec4(bruegel(cl, cs, n, vW, vUV, vMark, uDistK), 1.0);
}
`;

// The one material family. opts: { instanced: bool (per-instance pigments + birth), distK: pigment-ring strength
// (1 for the land, 0.3 for the tower so it stays stone and red), side }. Geometry needs position, normal, aLight, aShade,
// aUV (metres), aMark; instanced geometry also aTint and the instance attributes iLight, iShade, iInfo.
export function bruegelMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE_UNIFORMS, uDistK: { value: opts.distK ?? 1 } },
    defines: { ...(opts.instanced ? { INST: 1 } : {}), ...(opts.stain ? { STAIN: 1 } : {}), ...(opts.spin ? { SPIN: 1 } : {}), ...(opts.towerShadow ? { TOWER_SHADOW: 1 } : {}), ...(opts.bowl ? { BOWL: 1 } : {}) },
    vertexShader: STYLE_DECL + STYLE_VERT, fragmentShader: STYLE_GLSL + STYLE_FRAG,
    side: opts.side ?? THREE.FrontSide,
  });
}

// Contour: an inverted hull in double umber, uWidth pixels wide at any distance (brown, never black). Draw the same
// geometry a second time with this material; the geometry needs the attribute hullN (see addHullNormals).
export function contourMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE_UNIFORMS, uWidth: { value: opts.width ?? 1.8 }, uDistK: { value: opts.distK ?? 0.5 } },
    defines: opts.bowl ? { BOWL: 1 } : {},
    side: THREE.BackSide,
    vertexShader: STYLE_DECL + /* glsl */`
      attribute vec3 hullN;
      uniform float uWidth;
      varying vec3 vW;
      void main() {
        mat4 mm = modelMatrix;
        #ifdef USE_INSTANCING
        mm = modelMatrix * instanceMatrix;
        #endif
        vec4 wp = mm * vec4(position, 1.0);
        #ifdef BOWL
        wp.y += bowlLift((mm * vec4(0.0, 0.0, 0.0, 1.0)).xz);
        #endif
        vec3 wn = mat3(mm) * hullN;
        vW = wp.xyz;
        vec4 cp = projectionMatrix * viewMatrix * wp;
        vec4 cn = projectionMatrix * viewMatrix * vec4(wp.xyz + wn, 1.0);
        vec2 d = (cn.xy / max(abs(cn.w), 1e-4) - cp.xy / max(abs(cp.w), 1e-4)) * uView;
        float l = length(d);
        d = l > 1e-5 ? d / l : vec2(0.0);
        cp.xy += d / uView * 2.0 * uWidth * cp.w;
        gl_Position = cp;
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      uniform float uDistK; varying vec3 vW;
      void main() { gl_FragColor = vec4(pigmentDistance(uUmber2, vW, uDistK), 1.0); }`,
  });
}
// Averages the normals of coincident vertices into the attribute hullN, so an inverted hull does not split at hard edges.
export function addHullNormals(geo) {
  // coincident vertices are found by a number key on x and y (2 cm grid) and a short list on z: no strings, so a big mesh costs little
  const p = geo.attributes.position, n = geo.attributes.normal, map = new Map(), out = new Float32Array(p.count * 3), slot = new Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const kz = Math.round(p.getZ(i) * 50), k = (Math.round(p.getX(i) * 50) + 4194304) * 8388608 + Math.round(p.getY(i) * 50) + 4194304;
    let list = map.get(k);
    if (!list) { list = []; map.set(k, list); }
    let a = null;
    for (let j = 0; j < list.length; j++) if (list[j][3] === kz) { a = list[j]; break; }
    if (!a) { a = [0, 0, 0, kz]; list.push(a); }
    a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); slot[i] = a;
  }
  for (let i = 0; i < p.count; i++) {
    const a = slot[i], l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
  }
  geo.setAttribute('hullN', new THREE.BufferAttribute(out, 3));
  return geo;
}

// The same in short steps, for a big mesh inside build(): yields every few thousand vertices.
export async function addHullNormalsAsync(geo, yieldNow) {
  const p = geo.attributes.position, n = geo.attributes.normal, map = new Map(), out = new Float32Array(p.count * 3), slot = new Array(p.count);
  for (let i = 0; i < p.count; i++) {
    if (i % 5000 === 4999) await yieldNow();
    const kz = Math.round(p.getZ(i) * 50), k = (Math.round(p.getX(i) * 50) + 4194304) * 8388608 + Math.round(p.getY(i) * 50) + 4194304;
    let list = map.get(k);
    if (!list) { list = []; map.set(k, list); }
    let a = null;
    for (let j = 0; j < list.length; j++) if (list[j][3] === kz) { a = list[j]; break; }
    if (!a) { a = [0, 0, 0, kz]; list.push(a); }
    a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); slot[i] = a;
  }
  await yieldNow();
  for (let i = 0; i < p.count; i++) {
    if (i % 15000 === 14999) await yieldNow();
    const a = slot[i], l = Math.hypot(a[0], a[1], a[2]) || 1;
    out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l;
  }
  geo.setAttribute('hullN', new THREE.BufferAttribute(out, 3));
  return geo;
}

// Ribbons: ropes, shrouds, poles, ladders, hoist lines. Camera-facing strips aWidth metres wide that never thin below
// 1.5 px. Build the geometry with makeRibbons(); one flat pigment per ribbon (two-tone things are not ribbons).
export function ribbonMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE_UNIFORMS, uDistK: { value: opts.distK ?? 0.5 } },
    side: THREE.DoubleSide,
    vertexShader: STYLE_DECL + /* glsl */`
      attribute vec3 aOther, aLight;
      attribute vec4 aSway;            // xyz: swing of this end in metres, w: phase
      attribute vec3 aRib;             // x: side -1/+1, y: width in metres, z: birth u (rises from its lower end)
      varying vec3 vC, vW;
      void main() {
        vec3 a = position, b = aOther;
        float grow = smoothstep(aRib.z, aRib.z + 0.03, uU);
        vec3 lo = a.y < b.y ? a : b;
        a = mix(lo, a, grow); b = mix(lo, b, grow);
        a += aSway.xyz * sin(uTime * 0.9 + aSway.w);
        vec4 wa = modelMatrix * vec4(a, 1.0), wb = modelMatrix * vec4(b, 1.0);
        vec4 ca = projectionMatrix * viewMatrix * wa, cb = projectionMatrix * viewMatrix * wb;
        vec2 d = (cb.xy / max(abs(cb.w), 1e-4) - ca.xy / max(abs(ca.w), 1e-4)) * uView;
        float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
        float pxPerM = uView.y * projectionMatrix[1][1] * 0.5 / max(abs(ca.w), 1e-3);
        float wpx = max(aRib.y * pxPerM, 1.5) * step(0.001, grow);
        ca.xy += vec2(-d.y, d.x) * aRib.x * wpx / uView * ca.w;
        vC = aLight; vW = wa.xyz;
        gl_Position = ca;
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      uniform float uDistK; varying vec3 vC, vW;
      void main() { gl_FragColor = vec4(pigmentDistance(vC, vW, uDistK), 1.0); }`,
  });
}
// Collector for ribbons: r.seg(a, b, width, color, birth, swayA, swayB, phase) then r.build().
export function makeRibbons() {
  const P = [], O = [], C = [], R = [], W = [], I = []; let n = 0;
  const put = (a, b, side, w, c, birth, sw, ph) => {
    P.push(a.x, a.y, a.z); O.push(b.x, b.y, b.z); C.push(c.r, c.g, c.b); R.push(side, w, birth);
    W.push(sw ? sw.x : 0, sw ? sw.y : 0, sw ? sw.z : 0, ph);
  };
  return {
    get count() { return n / 4; },
    seg(a, b, w, c, birth = -1, swA = null, swB = null, ph = 0) {
      // the screen direction is taken a->b at one end and b->a at the other, so the sides are mirrored there
      put(a, b, -1, w, c, birth, swA, ph); put(a, b, 1, w, c, birth, swA, ph);
      put(b, a, 1, w, c, birth, swB, ph); put(b, a, -1, w, c, birth, swB, ph);
      I.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); n += 4;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aOther', new THREE.Float32BufferAttribute(O, 3));
      g.setAttribute('aLight', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aRib', new THREE.Float32BufferAttribute(R, 3));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(W, 4));
      g.setIndex(I);
      return g;
    },
  };
}

// Pigments. A tone pair is [light, shade]: the shade is the same pigment over umber, mixed as paint (in display space).
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function mixHex(a, b, t) {
  const A = hexRGB(a), B = hexRGB(b);
  return new THREE.Color().setRGB((A[0] + (B[0] - A[0]) * t) / 255, (A[1] + (B[1] - A[1]) * t) / 255, (A[2] + (B[2] - A[2]) * t) / 255, THREE.SRGBColorSpace);
}
export function makePigments(pal = PALETTE) {
  const u2 = UMBER2, pair = (h, k = 0.42) => [new THREE.Color(h), mixHex(h, u2, k)];
  const hx = (c) => '#' + c.getHexString();
  return {
    stone: pair(pal[0]), brick: pair(pal[1]), timber: pair(pal[2], 0.5), lime: pair(pal[6], 0.36),
    thatch: [mixHex(pal[2], pal[0], 0.35), mixHex(pal[2], u2, 0.4)],
    rock: [mixHex(pal[0], pal[2], 0.42), mixHex(pal[2], u2, 0.55)],
    turf: [mixHex(pal[3], pal[2], 0.35), mixHex(pal[3], u2, 0.6)],
    cloud: [new THREE.Color(pal[6]), new THREE.Color(pal[4])],
    red: pair(pal[1], 0.3), smock: [mixHex(pal[0], pal[2], 0.5), mixHex(pal[2], u2, 0.6)],
    dark: [new THREE.Color(u2), new THREE.Color(u2)], umber2: new THREE.Color(u2), hex: hx,
  };
}

// Geometry collector for the material family: flat faces with a pigment pair, a mark and uv in metres.
// g.poly(points, pig, mark, tint, uv): a convex polygon, counter-clockwise seen from its front; uv defaults to
// (horizontal run along the face, height), which keeps courses level and plumb to whatever frame the piece is built in.
export function makePaint() {
  const P = [], N = [], L = [], S = [], U = [], M = [], T = [], I = []; let n = 0;
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3(), tt = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const api = {
    get tris() { return I.length / 3; },
    poly(pts, pig, mark = 0, tint = 0, uvs = null, nrm = null) {
      e1.subVectors(pts[1], pts[0]); e2.subVectors(pts[pts.length - 1], pts[0]); nn.crossVectors(e1, e2);
      if (nn.lengthSq() < 1e-12) return;
      nn.normalize();
      const flatTop = Math.abs(nn.y) > 0.9;
      if (!flatTop) tt.crossVectors(UP, nn).normalize();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = nrm ? nrm[i] : nn;
        P.push(p.x, p.y, p.z); N.push(q.x, q.y, q.z);
        L.push(pig[0].r, pig[0].g, pig[0].b); S.push(pig[1].r, pig[1].g, pig[1].b); M.push(mark); T.push(tint);
        if (uvs) U.push(uvs[i][0], uvs[i][1]); else if (flatTop) U.push(p.x, p.z); else U.push(p.dot(tt), p.y);
      }
      for (let i = 1; i < pts.length - 1; i++) I.push(n, n + i, n + i + 1);
      n += pts.length;
    },
    // box between two corners in a local frame given by a Matrix4 (or null), open faces skipped by the mask 'skip' ("b" bottom, "t" top)
    box(x0, y0, z0, x1, y1, z1, pig, mark = 0, tint = 0, m = null, skip = 'b', taper = null) {
      const tx = taper ? taper[0] : 0, tz = taper ? taper[1] : 0;      // metres each side shrinks at the top
      const c = (x, y, z) => { const v = new THREE.Vector3(x, y, z); return m ? v.applyMatrix4(m) : v; };
      const a = c(x0, y0, z0), b = c(x1, y0, z0), d = c(x0, y0, z1), e = c(x1, y0, z1);
      const A = c(x0 + tx, y1, z0 + tz), B = c(x1 - tx, y1, z0 + tz), D = c(x0 + tx, y1, z1 - tz), E = c(x1 - tx, y1, z1 - tz);
      api.poly([d, e, E, D], pig, mark, tint); api.poly([b, a, A, B], pig, mark, tint);
      api.poly([e, b, B, E], pig, mark, tint); api.poly([a, d, D, A], pig, mark, tint);
      if (!skip.includes('t')) api.poly([D, E, B, A], pig, mark, tint);
      if (!skip.includes('b')) api.poly([a, b, e, d], pig, mark, tint);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aLight', new THREE.Float32BufferAttribute(L, 3));
      g.setAttribute('aShade', new THREE.Float32BufferAttribute(S, 3));
      g.setAttribute('aUV', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aMark', new THREE.Float32BufferAttribute(M, 1));
      g.setAttribute('aTint', new THREE.Float32BufferAttribute(T, 1));
      g.setIndex(I);
      return g;
    },
    // the same in short steps (a yield between the attributes), for the big meshes
    async buildAsync(yieldNow) {
      const g = new THREE.BufferGeometry();
      for (const [name, arr, size] of [['position', P, 3], ['normal', N, 3], ['aLight', L, 3], ['aShade', S, 3], ['aUV', U, 2], ['aMark', M, 1], ['aTint', T, 1]]) { g.setAttribute(name, new THREE.Float32BufferAttribute(arr, size)); await yieldNow(); }
      g.setIndex(I);
      return g;
    },
  };
  return api;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------------------
// THE TOWER, in its own leaning frame (the group is tipped 3 degrees toward -X; everything below is plumb to the tower).
// One spiral: wall parameter s in turns; bearing(s) = seam + 360 s, measured from +Z (the entry side) toward +X
// (starboard in the world, once the world has turned the piece by PI). The wall at s has radius 350 - 28 s and its
// top, the roadway, is at 60 s; so there are no closed tiers, only a ramp 28 m wide rising 60 m a turn.
// ------------------------------------------------------------------------------------------------------------
const RW = (s) => 350 - 28 * s;
const TOP = (s) => 60 * s;
function towerFrame(seamDeg) {
  const f = {
    seam: seamDeg,
    bearing: (s) => seamDeg + 360 * s,
    frac: (bDeg) => (((bDeg - seamDeg) % 360) + 360) % 360 / 360,
    dir: (bDeg, out = new THREE.Vector3()) => out.set(Math.sin(bDeg * DEG), 0, Math.cos(bDeg * DEG)),
    at: (bDeg, r, y, out = new THREE.Vector3()) => out.set(Math.sin(bDeg * DEG) * r, y, Math.cos(bDeg * DEG) * r),
    // height of the built surface at radius r on bearing b (the stair of the tiers)
    surface: (bDeg, r) => { const fr = f.frac(bDeg); const k = Math.min(6, Math.floor((350 - r) / 28 - fr)); return k < 0 ? 0 : 60 * (k + fr); },
    // the bite: an oblique trench climbing the far starboard flank. t 0..1 -> bearing, radius, floor height, half widths
    bite: (t) => ({ b: 98 + 74 * t, r: 268 - 122 * t, y: 138 + 264 * t, wp: 8 + 44 * (1 - t) * (1 - t), ws: 8 + 60 * (1 - t) * (1 - t) }),
    biteT: (bDeg) => (bDeg - 98) / 74,
  };
  return f;
}

const HUMP = 0.8;      // how far a vault back rises above its ledge (low: from below a ledge is its rim, from above a floor)
const inBite = (bDeg) => { const b = ((bDeg % 360) + 360) % 360; return b > 98 && b < 172; };

// A faceted rock mass (living rock, quarried): an icosphere pushed about by noise, turf on what faces the sky.
function rockMass(g, pig, noise, c, rx, ry, rz, seed, detail = 2) {
  const ico = new THREE.IcosahedronGeometry(1, detail).toNonIndexed(), p = ico.attributes.position, pts = [V(), V(), V()];
  const disp = (v) => {
    const n = noise.fbm3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3 - seed, 3);
    const k = 1 + 0.38 * n + 0.12 * Math.sign(n) * Math.abs(noise.n3(v.x * 4 + seed, v.y * 4, v.z * 4));
    return V(c.x + v.x * rx * k, c.y + Math.round(v.y * ry * k / 6) * 6 * 0.5 + v.y * ry * k * 0.5, c.z + v.z * rz * k);
  };
  for (let i = 0; i < p.count; i += 3) {
    for (let k = 0; k < 3; k++) pts[k] = disp(V(p.getX(i + k), p.getY(i + k), p.getZ(i + k)));
    const ny = V().subVectors(pts[1], pts[0]).cross(V().subVectors(pts[2], pts[0])).normalize().y;
    g.poly([pts[0], pts[1], pts[2]], ny > 0.8 ? pig.turf : pig.rock, ny > 0.8 ? 0 : 7);
  }
  ico.dispose();
}

// Walls, roadway, parapet, the crag of the core and the rock breaking through the port flank.
async function buildBody(F, pig, rng, noise, stoneTo, rocks, yieldNow) {
  const g = makePaint(), rk = makePaint(), SEG = 96, road = [mixHex(PALETTE[0], PALETTE[2], 0.45), mixHex(PALETTE[2], UMBER2, 0.5)];
  let arc = 0;
  for (let i = 0; i < 7 * SEG; i++) {
    const s0 = i / SEG, s1 = (i + 1) / SEG, sm = (s0 + s1) / 2, b0 = F.bearing(s0), b1 = F.bearing(s1), bm = (b0 + b1) / 2;
    const r0 = RW(s0), r1 = RW(s1), y0 = TOP(s0), y1 = TOP(s1), w = (b1 - b0) * DEG * (r0 + r1) / 2;
    const cut = inBite(bm) && sm >= 3;
    const isStone = sm + 0.5 * noise.n2(bm * 0.022, sm * 1.4) < stoneTo;
    const wp = pig.brick, mk = 1;          // the core is raw brick; stone is only the facing the bays bring
    if (!cut) {
      const ya = Math.max(0, y0 - 60) - (s0 < 1 ? 0 : 0.5), yb = Math.max(0, y1 - 60) - (s0 < 1 ? 0 : 0.5), ph = 1.5;
      // wall face and parapet (outer face, top, inner face)
      g.poly([F.at(b0, r0, ya), F.at(b1, r1, yb), F.at(b1, r1, y1 + ph), F.at(b0, r0, y0 + ph)], wp, mk, 0, [[arc, ya], [arc + w, yb], [arc + w, y1 + ph], [arc, y0 + ph]]);
      g.poly([F.at(b0, r0, y0 + ph), F.at(b1, r1, y1 + ph), F.at(b1, r1 - 1.3, y1 + ph), F.at(b0, r0 - 1.3, y0 + ph)], wp, 0);
      g.poly([F.at(b1, r1 - 1.3, y1), F.at(b0, r0 - 1.3, y0), F.at(b0, r0 - 1.3, y0 + ph), F.at(b1, r1 - 1.3, y1 + ph)], wp, mk);
    }
    if (!(inBite(bm) && sm >= 3.3)) {
      g.poly([F.at(b0, r0 - 1.3, y0), F.at(b1, r1 - 1.3, y1), F.at(b1, r1 - 28.5, y1), F.at(b0, r0 - 28.5, y0)], road, 2, 0, [[arc, 0], [arc + w, 0], [arc + w, 27], [arc, 27]]);
    }
    arc += w;
    if (i % 64 === 63) await yieldNow();
  }
  // the crag: what is left of the hill the tower is built round, standing inside the last ring
  // bedded rock: beds 5 m thick stand out and back by turns, so the hill is ledges of turf over faces of stone
  const NB = 96, NV = 20, apex = V(rng.range(-22, 6), 520, rng.range(-14, 14)), grid = [], tufts = [];
  for (let v = 0; v <= NV; v++) {
    const row = [], vv = v * 10 / NV;
    for (let k = 0; k <= NB; k++) {
      const kk = (k % NB) * 44 / NB, b = F.seam + (k % NB) * 360 / NB, sb = 6 + (k % NB) / NB, base = F.at(b, RW(sb) - 27, TOP(sb) - 3), t = v / NV;
      const tip = V(apex.x, apex.y - 95 * (0.5 + 0.5 * noise.n2(kk * 0.9, 3.3)) * (1 - t) - 30 * noise.n2(b * 0.02, 9) * (t < 1 ? 1 : 0), apex.z);
      const p = base.clone().lerp(tip, Math.pow(t, 0.75));
      const n = noise.fbm3(p.x * 0.02, p.y * 0.03, p.z * 0.02, 3), inner = v > 0 && v < NV ? 1 : 0;
      p.addScaledVector(F.dir(b), inner * (16 * n + (v % 2 ? 1 : -1) * (1.5 + 4 * Math.abs(noise.n2(kk * 2.1, Math.floor(vv) * 1.7))) + 3 * noise.n3(p.x * 0.09, p.y * 0.09, p.z * 0.09)));
      if (inner) p.y += 22 * noise.n2(kk * 1.3 + 5, vv * 0.9) * (v / NV) + (v % 2 ? -1.6 : 1.6);
      if (v === NV) p.copy(apex);
      row.push(p);
    }
    grid.push(row);
    if (v % 2 === 1) await yieldNow();
  }
  await yieldNow();
  // No facet shows: the light and shade of the crag are told from the hill's own smooth normal (one lit flank, one shaded,
  // a clean edge between), a bed is turf or stone as a whole (a tread or a riser), and the beds and fissures are drawn in
  // uv that runs round the hill and up it, so the marks cross every triangle unbroken.
  const gn = grid.map((row) => row.map(() => V())), e1 = V(), e2 = V();
  for (let v = 0; v <= NV; v++) for (let k = 0; k <= NB; k++) {
    const kp = (k + 1) % NB, km = (k + NB - 1) % NB, vp = Math.min(NV, v + 1), vm = Math.max(0, v - 1);
    e1.subVectors(grid[v][kp], grid[v][km]); e2.subVectors(grid[vp][k], grid[vm][k]);
    gn[v][k].crossVectors(e2, e1);
    if (gn[v][k].lengthSq() < 1e-6) gn[v][k].set(0, 1, 0); else gn[v][k].normalize();
    if (v === NV) gn[v][k].set(0, 1, 0);
  }
  for (let v = 0; v <= NV; v++) { const row = gn[v].map((q, k) => q.clone().add(gn[v][(k + 1) % NB]).add(gn[v][(k + NB - 1) % NB]).add(gn[Math.min(NV, v + 1)][k]).add(gn[Math.max(0, v - 1)][k]).normalize()); gn[v] = row; }
  await yieldNow();
  const ruv = (q, k) => [k * 9.6, q.y];
  for (let v = 0; v < NV; v++) {
    for (let k = 0; k < NB; k++) {
      const a = grid[v][k], b = grid[v][k + 1], c = grid[v + 1][k + 1], d = grid[v + 1][k];
      const na = gn[v][k], nb = gn[v][(k + 1) % NB], nc = gn[v + 1][(k + 1) % NB], nd = gn[v + 1][k];
      const turf = (k * 13 + v * 7) % 5 < 2;      // (for the bushes only: the turf itself is drawn by the material in beds round the hill, mark 7)
      const ua = ruv(a, k), ub = ruv(b, k + 1), uc = ruv(c, k + 1), ud = ruv(d, k);
      const tris = (k + v) % 2 ? [[[a, b, c], [ua, ub, uc], [na, nb, nc]], [[a, c, d], [ua, uc, ud], [na, nc, nd]]] : [[[a, b, d], [ua, ub, ud], [na, nb, nd]], [[b, c, d], [ub, uc, ud], [nb, nc, nd]]];
      for (const [tri, uvs, nrm] of tris) {
        rk.poly(tri, pig.rock, 7, 0, uvs, nrm);
        if (v < NV * 0.7 && (turf ? (k * 7 + v * 3) % 3 !== 1 : (k * 5 + v * 11) % 4 === 0)) tufts.push({ p: V().add(tri[0]).add(tri[1]).add(tri[2]).multiplyScalar(1 / 3), thorn: !turf || (k + v) % 4 === 0, h: ((k * 37 + v * 91) % 17) / 17 });
      }
    }
    if (v % 2 === 1) await yieldNow();
  }
  for (const r of rocks) { await yieldNow(); rockMass(rk, pig, noise, r.c, r.rx, r.ry, r.rz, r.seed); }
  return { g, rk, tufts };
}

// A wall panel z = zp with a round-headed hole, the reveal of the hole and (unless open) its flat dark mouth.
// Rectangle x0..x1, y0..y1; the hole has half span a, sill ys, springing yc, centre cx. tint 1 = takes the instance pigment.
function archPanel(g, pig, o) {
  const { x0, x1, y0, y1, cx, a, ys, yc, zp, zb, nseg, open } = o, tint = 1, mk = o.mark ?? 2;
  const ex = Math.min(cx - x0, x1 - cx), ey = y1 - yc, corner = Math.atan2(ey, ex);
  // angles: the two rectangle corners are always samples, so the spandrel closes exactly
  const half = [];
  const n1 = Math.max(1, Math.round(nseg * corner / Math.PI)), n2 = Math.max(1, nseg / 2 - n1);
  for (let i = 0; i < n1; i++) half.push(corner * i / n1);
  for (let i = 0; i <= n2; i++) half.push(corner + (Math.PI / 2 - corner) * i / n2);
  const ang = half.concat(half.slice(0, -1).reverse().map((t) => Math.PI - t));
  const arc = ang.map((t) => [cx + a * Math.cos(t), yc + a * Math.sin(t)]);
  const rect = ang.map((t) => { const c = Math.cos(t), s = Math.sin(t), k = Math.min(ex / Math.max(Math.abs(c), 1e-6), ey / Math.max(Math.abs(s), 1e-6)); return [cx + c * k, yc + s * k]; });
  const P = (q, z) => V(q[0], q[1], z);
  // panel: jamb strips, the strip under the sill, spandrels
  if (cx - a > x0) g.poly([V(x0, y0, zp), V(cx - a, y0, zp), V(cx - a, yc, zp), V(x0, yc, zp)], pig, mk, tint);
  if (x1 > cx + a) g.poly([V(cx + a, y0, zp), V(x1, y0, zp), V(x1, yc, zp), V(cx + a, yc, zp)], pig, mk, tint);
  if (ys > y0) g.poly([V(cx - a, y0, zp), V(cx + a, y0, zp), V(cx + a, ys, zp), V(cx - a, ys, zp)], pig, mk, tint);
  for (let i = 0; i < ang.length - 1; i++) g.poly([P(arc[i], zp), P(rect[i], zp), P(rect[i + 1], zp), P(arc[i + 1], zp)], pig, mk, tint);
  // the reveal: splayed (a second arch ring to the eye), then the mouth
  const a2 = a * (o.splay ?? 0.86), zs = zp - (o.splayDepth ?? 1.2);
  const arc2 = ang.map((t) => [cx + a2 * Math.cos(t), yc + a2 * Math.sin(t)]);
  const ring = (A, zA, B, zB, m2 = mk, pg = pig, tn = tint) => {
    const ra = A === arc ? a : a2, rb = B === arc ? a : a2, n = ang.length - 1;
    g.poly([V(cx + ra, ys, zA), P(A[0], zA), P(B[0], zB), V(cx + rb, ys, zB)], pg, mk, tn);
    for (let i = 0; i < n; i++) g.poly([P(A[i], zA), P(A[i + 1], zA), P(B[i + 1], zB), P(B[i], zB)], pg, m2, tn,
      m2 === mk ? null : [[ra * ang[i], 0], [ra * ang[i + 1], 0], [ra * ang[i + 1], 1.5], [ra * ang[i], 1.5]]);
    g.poly([P(A[n], zA), V(cx - ra, ys, zA), V(cx - rb, ys, zB), P(B[n], zB)], pg, mk, tn);
  };
  ring(arc, zp, arc2, zs, o.edgeMark ?? mk);
  if (zb < zs - 0.01) ring(arc2, zs, arc2, zb, mk, o.soffit ?? pig, o.soffit ? 0 : tint);       // o.soffit: the vault running back into the dark
  if (ys > y0 + 0.01) g.poly([V(cx - a, ys, zp), V(cx + a, ys, zp), V(cx + a2, ys, zs), V(cx - a2, ys, zs)], pig, mk, tint);   // sill
  if (ys <= y0 + 0.01 && o.floor !== false) g.poly([V(cx - a, ys, zp), V(cx + a, ys, zp), V(cx + a2, ys, zb), V(cx - a2, ys, zb)], o.soffit ?? pig, mk, o.soffit ? 0 : tint);   // the floor of the reveal
  if (!open) {
    // the mouth: mark 9, uv in arch units from the springing centre (the material draws the vault running back, ring inside ring)
    const dk = o.dark, y0n = (ys - yc) / a2, mu = (q) => [(q[0] - cx) / a2, (q[1] - yc) / a2];
    g.poly([V(cx - a2, ys, zb), V(cx + a2, ys, zb), V(cx + a2, yc, zb), V(cx - a2, yc, zb)], dk, 9, 0, [[-1, y0n], [1, y0n], [1, 0], [-1, 0]]);
    for (let i = 0; i < ang.length - 1; i += 2) {
      const j = Math.min(i + 2, ang.length - 1);
      if (i + 1 < j) g.poly([P(arc2[i], zb), P(arc2[i + 1], zb), P(arc2[j], zb), V(cx, yc, zb)], dk, 9, 0, [mu(arc2[i]), mu(arc2[i + 1]), mu(arc2[j]), [0, 0]]);
      else g.poly([P(arc2[i], zb), P(arc2[j], zb), V(cx, yc, zb)], dk, 9, 0, [mu(arc2[i]), mu(arc2[j]), [0, 0]]);
    }
  }
  return { ang, arc };
}
// The raised archivolt: a band round the arch head standing 'lift' proud of the panel, with its outer rim.
function archivolt(g, pig, cx, yc, a, wBand, zp, lift, ang, mk, rim = true) {
  const P = (r, t, z) => V(cx + r * Math.cos(t), yc + r * Math.sin(t), z), b = a + wBand;
  for (let i = 0; i < ang.length - 1; i++) {
    const t0 = ang[i], t1 = ang[i + 1];
    g.poly([P(a, t0, zp + lift), P(b, t0, zp + lift), P(b, t1, zp + lift), P(a, t1, zp + lift)], pig, mk, 1,
      [[a * t0, 0], [a * t0, 1.5], [a * t1, 1.5], [a * t1, 0]]);                      // voussoirs set on edge round the ring
    if (rim) g.poly([P(b, t0, zp + lift), P(b, t0, zp), P(b, t1, zp), P(b, t1, zp + lift)], pig, 0, 1);
  }
}

// One arcade bay, 24 m wide and 58 m tall in its own frame (x along the wall, y up, z outward): a buttress on its left
// edge, a plinth, the great double-ringed arch round a dark mouth, a string course, two windows, a cornice.
function bayGeometry(pig, o = {}) {
  const g = makePaint(), st = pig.stone, dk = pig.dark, W = 12, ZP = 2.1, nseg = o.nseg ?? 10;
  // buttress: two tapering lifts with a weathered offset between
  g.box(-W - 2.5, 0, 0, -W + 2.5, 33, 7.2, st, 2, 1, null, 'b', [0.35, 1.3]);
  g.box(-W - 1.8, 33, 0, -W + 1.8, 57.2, 4.6, st, 2, 1, null, 'b', [0.3, 1.4]);
  // plinth, string course, cornice
  g.box(-W, 0, ZP, W, 3.2, ZP + 1.1, st, 2, 1, null, 'b', [0, 0.5]);
  g.box(-W, 32.2, ZP, W, 33.6, ZP + 0.8, st, 0, 1, null, 'b');
  g.box(-W, 56.2, 0, W, 58, ZP + 1.2, st, 0, 1, null, 'b');
  // lower storey: the great arch
  const big = archPanel(g, st, { x0: -W, x1: W, y0: 3.2, y1: 32.2, cx: 0.4, a: 7.2, ys: 3.2, yc: 21.5, zp: ZP, zb: 0.25, nseg, open: o.open, dark: dk, edgeMark: 4 });
  archivolt(g, st, 0.4, 21.5, 7.2, 1.5, ZP, 0.16, big.ang, 4, false);
  // upper storey: two windows
  for (const sx of [-1, 1]) {
    archPanel(g, st, { x0: sx < 0 ? -W : 0, x1: sx < 0 ? 0 : W, y0: 33.6, y1: 56.2, cx: sx * 6, a: 2.5, ys: 38.5, yc: 46, zp: ZP, zb: 0.25, nseg: 4, open: o.open, dark: dk, splay: 0.8, splayDepth: 1.0, edgeMark: 4 });
  }
  return g;
}

// Instance collector for the instanced material: add(matrix, pigment pair, mark, birth u, seed) then apply(mesh).
export function makeInstances() {
  const M = [], Lc = [], Sc = [], Info = [];
  return {
    get count() { return M.length; },
    add(m, pig, mark, birth = -1, seed = 0, spin = 0) {
      M.push(m.clone()); Lc.push(pig[0].r, pig[0].g, pig[0].b); Sc.push(pig[1].r, pig[1].g, pig[1].b); Info.push(mark, birth, seed, spin);
    },
    mesh(geo, mat) {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, M.length));
      for (let i = 0; i < M.length; i++) im.setMatrixAt(i, M[i]);
      im.count = M.length;
      geo.setAttribute('iLight', new THREE.InstancedBufferAttribute(new Float32Array(Lc.length ? Lc : [0, 0, 0]), 3));
      geo.setAttribute('iShade', new THREE.InstancedBufferAttribute(new Float32Array(Sc.length ? Sc : [0, 0, 0]), 3));
      geo.setAttribute('iInfo', new THREE.InstancedBufferAttribute(new Float32Array(Info.length ? Info : [0, 0, 0, 0]), 4));
      im.frustumCulled = false;
      return im;
    },
  };
}
// Frame on the tower: x along the wall (bearing increasing), y up, z outward; origin at radius r, height y.
function wallFrame(F, bDeg, r, y, sx = 1, sy = 1, sz = 1, flip = false, out = new THREE.Matrix4()) {
  const c = Math.cos(bDeg * DEG), s = Math.sin(bDeg * DEG), k = flip ? -1 : 1;
  out.set(c * sx * k, 0, s * sz * k, s * r,
          0, sy, 0, y,
          -s * sx * k, 0, c * sz * k, c * r,
          0, 0, 0, 1);
  return out;
}
// Frame for a cut end in the bite: x radial (outward), y up, z along the ring toward the void (dirSign +1 = bearing increasing).
function cutFrame(F, bDeg, r, y, dirSign, sx = 1, sy = 1, out = new THREE.Matrix4()) {
  const c = Math.cos(bDeg * DEG), s = Math.sin(bDeg * DEG), k = dirSign;
  // x axis = radial * -k (keeps the frame right-handed with z = tangent * k), so the arch reads the same from both sides
  out.set(-s * k * sx, 0, c * k, s * r,
          0, sy, 0, y,
          -c * k * sx, 0, -s * k, c * r,
          0, 0, 0, 1);
  return out;
}

// Lays the arcade round the spiral. Returns { closed, open } instance collectors and the list of bays (for scaffolds, workers).
async function layBays(F, pig, rng, noise, stoneTo, rocks, births, yieldNow) {
  const closed = makeInstances(), open = makeInstances(), list = [], m = new THREE.Matrix4(), p = V();
  let s = 0.3, i = 0;
  while (s < 7) {
    const w = 24.5 * (1 + 0.06 * (rng() * 2 - 1)), ds = w / (2 * Math.PI * RW(s)), sc = s + ds / 2, b = F.bearing(sc);
    s += ds; i++;
    if (s > 7) break;
    if (i % 80 === 0) await yieldNow();
    const base = Math.max(0, TOP(sc) - 60), h = TOP(sc) + 1.6 - base + rng.range(-0.3, 0.3);
    const cut = inBite(b) && sc >= 3;
    F.at(b, RW(sc), base + h * 0.5, p);
    const inRock = rocks.some((r) => ((p.x - r.c.x) / (r.rx * 1.05)) ** 2 + ((p.y - r.c.y) / (r.ry * 1.05)) ** 2 + ((p.z - r.c.z) / (r.rz * 1.05)) ** 2 < 1);
    const isStone = sc + 0.5 * noise.n2(b * 0.022, sc * 1.4) < stoneTo;
    const seed = rng();
    if (cut || inRock || h < 16) continue;
    wallFrame(F, b, RW(sc) + 0.15, base, w / 24, h / 58, rng.range(0.92, 1.1), false, m);
    let birth = births(sc, b), late = false;
    if (birth < 0 && !isStone && seed < 0.3) { birth = 0.03 + 0.9 * ((seed * 37.7) % 1); late = true; }     // the picture is still being made, all flight long
    closed.add(m, isStone ? pig.stone : pig.brick, isStone ? 2 : 1, birth, seed);
    list.push({ s: sc, b, r: RW(sc), base, h, w, birth, stone: isStone, late });
  }
  return { closed, open, list };
}

// The cut end of a ring vault, 22 m wide and 30 m tall (x across the ring, y up, z out of the cut): two pier ends,
// a round arch with its bricks set on edge, and the vault running back into the dark.
function vaultEndGeometry(pig, open, depth) {
  const g = makePaint();
  const res = archPanel(g, pig.brick, { x0: -11, x1: 11, y0: 0, y1: 30, cx: 0, a: 8.3, ys: 0, yc: 16.2, zp: 0, zb: -depth, nseg: 8, open, dark: pig.dark, mark: 1, edgeMark: 4, splay: 0.84, splayDepth: 1.4, soffit: open ? null : [pig.brick[1], mixHex(PALETTE[1], UMBER2, 0.72)] });
  const ringPig = [mixHex(PALETTE[1], PALETTE[0], 0.3), mixHex(PALETTE[1], UMBER2, 0.3)], P = (r, t, z) => V(r * Math.cos(t), 16.2 + r * Math.sin(t), z), ang = res.ang;
  for (let i = 0; i < ang.length - 1; i++) {      // the ring: bricks set on edge, standing 0.35 m proud (its own pigment: aTint 0, mark 5)
    const t0 = ang[i], t1 = ang[i + 1];
    g.poly([P(8.3, t0, 0.35), P(10.1, t0, 0.35), P(10.1, t1, 0.35), P(8.3, t1, 0.35)], ringPig, 5, 0, [[8.3 * t0, 0], [8.3 * t0, 1.5], [8.3 * t1, 1.5], [8.3 * t1, 0]]);
    g.poly([P(10.1, t0, 0.35), P(10.1, t0, 0), P(10.1, t1, 0), P(10.1, t1, 0.35)], pig.dark, 0, 0);
  }
  for (const sx of [-1, 1]) g.poly(sx > 0 ? [V(8.3, 0, 0.35), V(10.1, 0, 0.35), V(10.1, 16.2, 0.35), V(8.3, 16.2, 0.35)] : [V(-10.1, 0, 0.35), V(-8.3, 0, 0.35), V(-8.3, 16.2, 0.35), V(-10.1, 16.2, 0.35)], ringPig, 5, 0, [[0, 0], [0, 1.5], [16.2, 1.5], [16.2, 0]].map((q, i2) => (sx > 0 ? [[0, 0], [0, 1.5], [16.2, 1.5], [16.2, 0]] : [[0, 1.5], [0, 0], [16.2, 0], [16.2, 1.5]])[i2]));
  return g;
}
// The bite: the flank cut open. A polar grid of vault cells (6 rings x 13 bays x 10 storeys of 30 m); every face a cell
// shows to the air becomes an instance: a cut vault end, a through arch, or a vault back.
async function layBite(F, pig, rng, yieldNow) {
  const NJ = 6, NM = 13, NL = 10, B0 = 98, DB = 74 / NM, Y0 = 138, SH = 30, RO = 259, RS = 22;
  const ends = makeInstances(), thru = makeInstances(), tops = makePaint(), m = new THREE.Matrix4();
  const hx = [-11, -8.6, -5.5, 0, 5.5, 8.6, 11], hy = [0, 0, 0.63 * HUMP, HUMP, 0.63 * HUMP, 0, 0];
  const cells = new Uint8Array(NJ * NM * NL);
  const lat = (b, r) => { const t = Math.min(1, Math.max(0, F.biteT(b))), B = F.bite(t); return { d: r - B.r, B }; };
  for (let j = 0; j < NJ; j++) for (let k = 0; k < NM; k++) for (let l = 0; l < NL; l++) {
    const rm = RO - RS * j - 11, b0 = B0 + DB * k, b1 = b0 + DB, bm = (b0 + b1) / 2, yb = Y0 + SH * l, yt = yb + SH;
    const surf = F.surface(bm, rm);
    let isVoid = false, pier = false;
    for (const b of [b0, bm, b1]) {
      const q = lat(b, rm);
      if (q.d > -(q.B.wp + 11) && q.d < q.B.ws + 11 && yt > q.B.y + 2) isVoid = true;
    }
    const q = lat(bm, rm);
    if (!isVoid && q.d >= q.B.ws + 11 && q.d < q.B.ws + 33 && yt <= q.B.y + 46 && yb <= surf + 14 && k % 3 !== 2 && F.biteT(bm) > 0.12) pier = true;
    cells[(j * NM + k) * NL + l] = (!isVoid && yt <= surf + 14) || pier ? 1 : 0;
  }
  await yieldNow();
  // a pier cannot float: fill beneath any occupied cell
  for (let j = 0; j < NJ; j++) for (let k = 0; k < NM; k++) {
    let top = -1;
    for (let l = NL - 1; l >= 0; l--) if (cells[(j * NM + k) * NL + l]) { top = l; break; }
    for (let l = 0; l < top; l++) cells[(j * NM + k) * NL + l] = 1;
  }
  const occ = (j, k, l) => {
    if (l < 0 || j >= NJ) return true;                 // the tower below, the rock core inside
    if (k < 0 || k >= NM) return l < NL && j >= 0 && Y0 + SH * (l + 1) <= F.surface(k < 0 ? B0 - 1 : B0 + 75, RO - RS * j - 11) + 14;
    if (j < 0 || l >= NL) return false;
    return cells[(j * NM + k) * NL + l] === 1;
  };
  const br = pig.brick, ledges = [], faces = [];
  for (let j = 0; j < NJ; j++) for (let k = 0; k < NM; k++) for (let l = 0; l < NL; l++) {
    if (k === 0 && l === 0) await yieldNow();
    if (!occ(j, k, l)) continue;
    const ro = RO - RS * j, rm = ro - 11, ri = ro - RS, b0 = B0 + DB * k, bm = b0 + DB / 2, yb = Y0 + SH * l, seed = rng();
    const free = !occ(j - 1, k, l) && !occ(j + 1, k, l);
    if (!occ(j, k + 1, l)) { ends.add(cutFrame(F, b0 + DB, rm, yb, 1, 1, 1, m), br, 1, -1, seed); faces.push(m.clone()); }
    if (!occ(j, k - 1, l)) { ends.add(cutFrame(F, b0, rm, yb, -1, 1, 1, m), br, 1, -1, seed + 0.3); faces.push(m.clone()); }
    if (!occ(j - 1, k, l)) (free ? thru : ends).add(wallFrame(F, bm, ro, yb, ro * DB * DEG / 22, 1, 1, false, m), br, 1, -1, seed + 0.5);
    if (!occ(j + 1, k, l)) (free ? thru : ends).add(wallFrame(F, bm, ri, yb, ri * DB * DEG / 22, 1, 1, true, m), br, 1, -1, seed + 0.7);
    if (!occ(j, k, l + 1)) {
      for (let i = 0; i < 6; i++) tops.poly([F.at(b0, rm + hx[i + 1], yb + SH + hy[i + 1]), F.at(b0 + DB, rm + hx[i + 1], yb + SH + hy[i + 1]), F.at(b0 + DB, rm + hx[i], yb + SH + hy[i]), F.at(b0, rm + hx[i], yb + SH + hy[i])], br, 1);      // wound to face the sky
      for (const [bq, rev] of [[b0, true], [b0 + DB, false]]) {
        const cp = [1, 5, 4, 3, 2].map((i) => F.at(bq, rm + hx[i], yb + SH + hy[i]));
        tops.poly(rev ? cp.reverse() : cp, br, 1);
      }
      ledges.push({ b: bm, r: rm, y: yb + SH, w: rm * DB * DEG });
    }
  }
  for (const [b, flip] of [[B0, true], [B0 + 74, false]]) {
    const fr = F.frac(b);
    for (let k = 3; k <= 6; k++) {
      const ro = RW(k + fr), ri = k === 6 ? 96 : ro - 28, yt = TOP(k + fr), q = [F.at(b, ri, Y0 - 2), F.at(b, ro, Y0 - 2), F.at(b, ro, yt), F.at(b, ri, yt)];
      if (yt > Y0) tops.poly(flip ? q.reverse() : q, br, 1);
    }
  }
  return { ends, thru, tops, ledges, faces };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const pal = opts.palette ?? PALETTE, pig = makePigments(pal), U = STYLE_UNIFORMS;
  U.uGreen.value.set(pal[3]); U.uBlue.value.set(pal[4]); U.uShadowC.value.set(pal[5]); U.uStainCA.value.set(pal[1]); U.uStainCB.value.set(pal[6]); U.uVaultC.value.copy(pig.brick[1]);
  const root = new THREE.Group(), lean = new THREE.Group();
  lean.rotation.z = 3 * DEG; root.add(lean);
  const seam = -20 + rng.range(-12, 12), F = towerFrame(seam);
  const stoneTo = opts.stoneTo ?? rng.range(4.3, 5.25);
  const rocks = [], nRocks = rng.int(5, 7);
  for (let i = 0; i < nRocks; i++) {
    const b = 218 + (i + rng()) * 104 / nRocks, k = rng.int(0, 4), s = k + F.frac(b), big = rng.range(0.8, 1.35);
    rocks.push({ c: F.at(b, RW(s) + 2, TOP(s) - rng.range(18, 34)), rx: 30 * big, ry: rng.range(34, 56) * big, rz: rng.range(36, 58) * big, seed: rng.range(0, 99) });
  }
  // the ramp wall's bays: each is whole about 55 m before the eye reaches it (the wall beside us is built, the wall ahead is rising)
  const births = (s, b) => { const bb = ((b % 360) + 360) % 360; return s >= 3 && s < 4 && bb > 62 && bb < 98 ? 0.486 + 0.079 * (bb - 62) / 36 : -1; };
  const matWall = bruegelMaterial({ distK: opts.distK ?? 0.3, stain: true });
  const matInst = bruegelMaterial({ distK: opts.distK ?? 0.3, stain: true, instanced: true });
  const matOpen = bruegelMaterial({ distK: opts.distK ?? 0.3, instanced: true, side: THREE.DoubleSide });

  const bodyParts = await buildBody(F, pig, rng, noise, stoneTo, rocks, ctx.yield);
  await ctx.yield();
  lean.add(new THREE.Mesh(await bodyParts.g.buildAsync(ctx.yield), matWall));
  await ctx.yield();
  const rockBuilt = await bodyParts.rk.buildAsync(ctx.yield);
  await ctx.yield();
  const rockGeo = await addHullNormalsAsync(rockBuilt, ctx.yield), matLine = contourMaterial({ width: 1.6, distK: 0.3 });
  lean.add(new THREE.Mesh(rockGeo, matWall), new THREE.Mesh(rockGeo, matLine));
  await ctx.yield();
  {      // thorn and turf on the crag where the builders have not reached: small lobes of two greens
    const bg = makePaint(), bushes = makeInstances(), bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), YA = V(0, 1, 0), e = [], f = [], top = V(0, 1, 0);
    for (let i = 0; i < 5; i++) { e.push(V(Math.sin(i / 5 * 6.283) * 0.7, 0.6, Math.cos(i / 5 * 6.283) * 0.7)); f.push(V(Math.sin((i + 0.5) / 5 * 6.283), 0, Math.cos((i + 0.5) / 5 * 6.283))); }
    for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; bg.poly([e[i], e[j], top], pig.turf, 0, 1); bg.poly([e[i], f[i], e[j]], pig.turf, 0, 1); bg.poly([f[i], f[j], e[j]], pig.turf, 0, 1); }
    const thornP = [mixHex(pal[3], UMBER2, 0.35), mixHex(pal[3], UMBER2, 0.72)], turfP = [mixHex(pal[3], pal[0], 0.25), mixHex(pal[3], UMBER2, 0.5)];
    await ctx.yield();
    for (const t of bodyParts.tufts) {
      const sc = t.thorn ? 1.6 + 2.2 * t.h : 0.9 + 1.2 * t.h;
      bm.compose(t.p, bq.setFromAxisAngle(YA, t.h * 40), V(sc * (0.9 + 0.5 * t.h), sc * (t.thorn ? 1.1 : 0.55), sc));
      bushes.add(bm, t.thorn ? thornP : turfP, 0, -1, t.h);
    }
    await ctx.yield();
    lean.add(bushes.mesh(bg.build(), matInst));
  }
  await ctx.yield();
  await ctx.yield();
  const bays = await layBays(F, pig, rng, noise, stoneTo, rocks, births, ctx.yield);
  await ctx.yield();
  const bayGeo = bayGeometry(pig, {}).build();
  await ctx.yield();
  lean.add(bays.closed.mesh(bayGeo, matInst));
  await ctx.yield();
  const bite = await layBite(F, pig, rng, ctx.yield);
  await ctx.yield();
  lean.add(bite.ends.mesh(vaultEndGeometry(pig, false, 13).build(), matInst));
  await ctx.yield();
  lean.add(bite.thru.mesh(vaultEndGeometry(pig, true, 11).build(), matOpen));
  const topsGeo = addHullNormals(bite.tops.build());
  lean.add(new THREE.Mesh(topsGeo, matWall));
  await ctx.yield();
  // the crown and the exit arch
  const crown = buildCrown(F, pig, rng, bays.open);
  lean.add(new THREE.Mesh(crown.geo, matWall));
  await ctx.yield();
  const openBayGeo = bayGeometry(pig, { open: true }).build();
  lean.add(bays.open.mesh(openBayGeo, matOpen));
  await ctx.yield();
  // the cloud across the far shoulder (not leaning: it is weather)
  const cloudHome = new THREE.Vector3(185, 388, -190), cloudAxis = new THREE.Vector3(0.85, 0, -0.53), cloudDrift = new THREE.Vector3(0.53, 0, 0.85);
  await ctx.yield();
  const cloudGeo = await cloudGeometrySteps(rng.fork('cloud'), 600, 105, 62, Math.round(13 * (0.7 + 0.3 * detail)), 2, ctx.yield);
  await ctx.yield();
  const cloud = new THREE.Mesh(cloudGeo, cloudMaterial(pal[6], pal[4], 2.2, 26));
  cloud.rotation.y = -Math.atan2(cloudAxis.z, cloudAxis.x); cloud.frustumCulled = false;
  root.add(cloud);
  await ctx.yield();
  // the site: cranes, wheels, ropes, scaffolds, people
  const sA = Math.max(2, Math.min(4, Math.floor(stoneTo - 0.35))) + F.frac(30);
  const cranes = placeCranes(F, rng, rocks, bite.ledges, crown, sA), cg = craneGeometry(pig);
  const houses = makeInstances(), wheels = makeInstances(), wm = new THREE.Matrix4();
  for (const c of cranes) {
    houses.add(c.m, pig.timber, 3, -1, rng());
    const spin = (c.kind === 'near' ? 0.5 : rng.range(0.3, 0.7)) * rng.sign();
    for (const w of WHEEL_AT) wheels.add(wm.copy(c.m).multiply(new THREE.Matrix4().makeTranslation(w.x, w.y, w.z)), pig.timber, 0, -1, rng(), spin);
  }
  await ctx.yield();
  const houseGeo = addHullNormals(cg.house.build());
  lean.add(houses.mesh(houseGeo, matInst), houses.mesh(houseGeo, matLine));
  lean.add(wheels.mesh(cg.wheel.build(), bruegelMaterial({ distK: opts.distK ?? 0.3, instanced: true, spin: true, side: THREE.DoubleSide })));
  await ctx.yield();
  await ctx.yield();
  const site = await buildSite(F, pig, rng, bays.list, cranes, bite.ledges, crown, detail, ctx.yield, bite.faces);
  await ctx.yield();
  // the hoist line in the bite and the pallet of brick that races up it
  const Bh = F.bite(0.36), hoistAt = F.at(Bh.b, Bh.r + 7, 0), hoistLo = Bh.y - 55, hoistHi = Bh.y + 112;
  site.rib.seg(V(hoistAt.x, hoistLo, hoistAt.z), V(hoistAt.x, hoistHi + 5, hoistAt.z), 0.12, pig.umber2);
  site.rib.seg(F.at(Bh.b, Bh.r + 9, hoistHi + 5.5), F.at(Bh.b + 2, Bh.r - 52, hoistHi + 3), 0.5, pig.timber[0]);      // the gallows it hangs from
  site.rib.seg(F.at(Bh.b, Bh.r + 3, hoistHi + 5.5), F.at(Bh.b + 2, Bh.r - 30, hoistHi - 22), 0.35, pig.timber[0]);
  const matRib = ribbonMaterial({ distK: (opts.distK ?? 0.3) * 0.35 });
  const ribs = new THREE.Mesh(site.rib.build(), matRib); ribs.frustumCulled = false;
  await ctx.yield();
  // the stone on the near crane's rope: a dressed block in a rope sling, with its contour
  const lg = makePaint();
  lg.box(-0.95, -1.5, -0.6, 0.95, -0.35, 0.6, pig.stone, 2, 0, null, '');
  for (const sx of [-0.6, 0.6]) { beam(lg, V(sx, -1.56, -0.66), V(sx, -1.56, 0.66), 0.09, pig.dark, 0, ''); for (const sz of [-0.66, 0.66]) beam(lg, V(sx, -1.56, sz), V(0, 0, 0), 0.07, pig.dark, 0, ''); }
  await ctx.yield();
  const loadGeo = addHullNormals(lg.build()), load = new THREE.Group(), nl = site.nearLoad;
  load.add(new THREE.Mesh(loadGeo, matWall), new THREE.Mesh(loadGeo, matLine));
  if (nl) load.position.copy(nl.lo); else load.scale.setScalar(1e-3);
  lean.add(load);
  await ctx.yield();
  const furnBuilt = await site.furn.buildAsync(ctx.yield);
  await ctx.yield();
  const furnGeo = await addHullNormalsAsync(furnBuilt, ctx.yield);
  lean.add(new THREE.Mesh(furnGeo, matWall), new THREE.Mesh(furnGeo, matLine));
  await ctx.yield();
  const people = site.fig.mesh(figureMaterial(pig, { distK: (opts.distK ?? 0.3) * 0.35, minPx: 5.6, nearK: 0.65, smock: [mixHex(pal[2], UMBER2, 0.3), mixHex(pal[2], UMBER2, 0.78)], smock2: pig.timber }));      // dark smocks: they stand on pale stone and red brick
  lean.add(ribs, people);
  await ctx.yield();
  const pg = makePaint();
  // the pallet: two battens in a rope sling and the bricks on them, each one drawn (they are counted from below as it passes)
  for (const z of [-0.75, 0.75]) pg.box(-1.5, 0, z - 0.14, 1.5, 0.2, z + 0.14, pig.timber, 3, 0, null, '');
  const brickB = [mixHex(pal[1], pal[0], 0.16), pig.brick[1]], brickC = [mixHex(pal[1], UMBER2, 0.2), mixHex(pal[1], UMBER2, 0.55)];
  for (let l = 0; l < 4; l++) for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 3; iz++) {
    const x = -1.2 + 0.6 * ix + (l % 2 ? 0.08 : -0.08), z = -0.84 + 0.56 * iz + (l % 2 ? -0.05 : 0.05), y = 0.2 + 0.33 * l, h = (ix * 7 + iz * 3 + l * 5) % 6;
    pg.box(x + 0.03, y + 0.02, z + 0.03, x + 0.57, y + 0.31, z + 0.53, h === 0 ? brickC : h === 3 ? brickB : pig.brick, 0, 0, null, '');
  }
  for (const [x, z] of [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]]) beam(pg, V(x, 0.2, z), V(0, 4.2, 0), 0.09, pig.dark, 0, 'bt');
  await ctx.yield();
  const palletGeo = addHullNormals(pg.build()), pallet = new THREE.Group();
  await ctx.yield();
  pallet.add(new THREE.Mesh(palletGeo, matWall), new THREE.Mesh(palletGeo, matLine));
  const dust = new THREE.Mesh(cloudGeometry(rng.fork('dust'), 16, 2.4, 3.2, 5, 1), cloudMaterial(pal[1], '#' + pig.brick[1].getHexString(), 0.25));
  dust.rotation.z = Math.PI / 2; dust.position.y = -9; pallet.add(dust);
  pallet.position.copy(hoistAt); lean.add(pallet);
  // the keystone on its rope
  const kg = makePaint(), kq = (x, y, z) => V(x, y, z).applyMatrix4(crown.frame), ka = 75 * DEG;
  const kx0 = 9 * Math.cos(ka), ky0 = 13 + 9 * Math.sin(ka), kx1 = 10.7 * Math.cos(ka), ky1 = 13 + 10.7 * Math.sin(ka);
  const kf = [[-kx0, ky0], [kx0, ky0], [kx1, ky1], [-kx1, ky1]];
  kg.poly(kf.map((q) => V(q[0], q[1], 1.8)), pig.stone, 2);
  kg.poly(kf.map((q) => V(q[0], q[1], 0.05)).reverse(), pig.stone, 2);
  for (let i = 0; i < 4; i++) { const q = kf[i], r = kf[(i + 1) % 4]; kg.poly([V(q[0], q[1], 0.05), V(r[0], r[1], 0.05), V(r[0], r[1], 1.8), V(q[0], q[1], 1.8)], pig.stone, 2); }
  await ctx.yield();
  const keyGeo = addHullNormals(kg.build().applyMatrix4(crown.frame)), keystone = new THREE.Group();
  keystone.add(new THREE.Mesh(keyGeo, matWall), new THREE.Mesh(keyGeo, matLine));
  lean.add(keystone);
  const keyCrane = cranes[cranes.length - 1], keyTip = CRANE_TIP.clone().applyMatrix4(keyCrane.m), keyTop = kq(0, ky1, 0.9);
  const kr = makeRibbons(); kr.seg(V(0, 0, 0), V(0, -1, 0), 0.1, pig.umber2);
  const keyRope = new THREE.Mesh(kr.build(), matRib); keyRope.frustumCulled = false; keyRope.position.set(keyTop.x, keyTip.y, keyTop.z);
  lean.add(keyRope);
  await ctx.yield();
  const fall = new THREE.Mesh(cloudGeometry(rng.fork('fall'), 30, 6, 7, 5, 1), cloudMaterial(pal[1], '#' + pig.brick[1].getHexString(), 0.5));
  const fallTop = F.at(30, RW(sA) + 9, TOP(sA) - 4); fall.rotation.set(0, 30 * DEG, Math.PI / 2); lean.add(fall);
  await ctx.yield();
  lean.add(new THREE.Mesh(addHullNormals(crown.geo), matLine));
  U.uStainA.value.set(30 * DEG, 16, TOP(sA) + 1, TOP(sA) * 0.97); U.uStainB.value.set(41 * DEG, 9, TOP(sA) + 1, TOP(sA) * 0.66);
  await ctx.yield();

  // anchors, in the hero's local space (lean applied)
  const lightLocal = new THREE.Vector3(0.55, 0.64, 0.53).normalize();
  lean.updateMatrix();
  const toRoot = (v) => v.clone().applyMatrix4(lean.matrix), fly = [new THREE.Vector3(0, 14, 580), new THREE.Vector3(60, 40, 440)];
  // the ramp: first from the air outside the parapet, so the arcade above the road stands whole as a curving wall of bays with
  // the road, its men and the country in one frame; then in over the parapet to pass the near crane at 13 m
  for (const [b, dr, dy] of [[34, 20, 19], [44, 26, 17], [54, 25, 15], [64, 15, 13.5], [74, 3, 12.5], [84, -6, 11.5], [93, -8.5, 11]]) { const s = 2 + F.frac(b); fly.push(toRoot(F.at(b, RW(s) + dr, TOP(s) + dy))); }
  const biteLine = [];
  for (let i = 0; i <= 8; i++) { const B = F.bite(i / 8); biteLine.push(toRoot(F.at(B.b, B.r, B.y + 12))); }
  fly.push(...biteLine);
  // out of the cloud the course swings wide of the top ring, over the cloud's floor: the whole summit (crag, huts, the last
  // ring, the arch and its crane) stands to port with the country beyond it, before the eye comes back in to the arch
  for (const [b, dr, dy] of [[192, 14, 18], [210, 62, 27], [230, 50, 22]]) { const s = 6 + F.frac(b); fly.push(toRoot(F.at(b, RW(s) + dr, TOP(s) + dy))); }
  fly.push(toRoot(crown.anchors.approach), toRoot(crown.anchors.mouth), toRoot(crown.anchors.seat));
  const near = cranes[0], great = cranes[1], Bm = F.bite(0.6);
  const anchors = {
    portalSeat: { position: toRoot(crown.anchors.seat), facing: crown.anchors.facing.clone().transformDirection(lean.matrix), width: 14 },
    archMouth: toRoot(crown.anchors.mouth), approach: toRoot(crown.anchors.approach), keystoneSlot: toRoot(crown.anchors.crownSlot),
    flyThrough: fly, biteLine, rampStart: fly[2].clone(), biteMouth: biteLine[0].clone(), biteHead: biteLine[8].clone(),
    nearCrane: toRoot(V(0, 6, 0).applyMatrix4(near.m)), greatCrane: toRoot(V(0, 9, 0).applyMatrix4(great.m)),
    hoist: toRoot(V(hoistAt.x, Bh.y + 12, hoistAt.z)),
    fleetGaze: toRoot(F.at(Bm.b, Bm.r + 900, 0)),                       // look here from the bite (u 0.70-0.76): out between the piers
    crown: toRoot(V(0, 470, 0)), top: toRoot(V(0, 520, 0)), cloud: cloudHome.clone(),
    viewpoints: { entry: new THREE.Vector3(0, 55, 1200), reveal: biteLine[4].clone(), summit: fly[fly.length - 4].clone() },
    light: lightLocal.clone(),
  };
  const _eye = new THREE.Vector3(), _inv = new THREE.Matrix4(), _sz = new THREE.Vector2(), _v = new THREE.Vector3(), _q = new THREE.Quaternion();
  const dbg = opts.dbg || null;      // close views for the set-piece viewer: opts.dbg = 'bite' | 'ramp' | 'exit' | 'top'
  let progress = null, lastTime = null;
  const hero = {
    object: root, radius: 400, height: 520, center: new THREE.Vector3(-10, 250, 0),
    anchors, ground: true, groundY: 0,
    setProgress(u) { progress = u; },
    pallet, keystone, palletHeld: false, wheelsHeld: false, frame: F, lean, hoistRange: [hoistLo, hoistHi],
    cloud, cloudAt(u, out) { return out.copy(cloudHome).addScaledVector(cloudDrift, 70 * (u - 0.6)).addScaledVector(cloudAxis, 50 * (u - 0.6)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!hero.wheelsHeld && lastTime !== null) U.uSpinT.value += Math.min(2, Math.max(0, time - lastTime));      // by the clock, so a paused or stepped clock still turns them
      lastTime = time;
      U.uU.value = progress === null ? (time / 46) % 1 : progress;      // alone in the viewer the journey loops
      if (camera) { camera.getWorldPosition(_eye); U.uEye.value.copy(_eye); }
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_sz); U.uView.value.copy(_sz); }
      const u = U.uU.value;
      root.updateWorldMatrix(true, false);
      root.getWorldQuaternion(_q);
      if (!opts.keepLight) U.uLight.value.copy(lightLocal).applyQuaternion(_q);      // from starboard and behind at entry, 40 degrees up
      // the cloud slides across the shoulder with the journey and drags its shadow
      hero.cloudAt(u, cloud.position);
      _v.copy(cloud.position).applyMatrix4(root.matrixWorld);
      U.uCloud.value.set(_v.x, _v.y + 4, _v.z, 0);
      _v.copy(cloudAxis).applyQuaternion(_q); U.uCloud.value.w = Math.atan2(_v.z, _v.x);
      U.uCloudR.value.set(285, 100);
      U.uTowerPos.value.setFromMatrixPosition(root.matrixWorld);
      _v.set(-Math.tan(3 * DEG), 0, 0).applyQuaternion(_q); U.uTowerLean.value.set(_v.x, _v.z);
      // the pallet races up the bite as we enter it; the keystone comes down as we arrive
      const pu = Math.min(1, Math.max(0, (u - 0.661) / 0.055));
      if (!hero.palletHeld) pallet.position.y = hoistLo + (hoistHi - hoistLo) * pu;
      const ft = (time * 0.11) % 1;
      fall.position.set(fallTop.x, fallTop.y - 150 * ft, fallTop.z); fall.scale.setScalar(0.35 + 0.5 * ft);
      const ku = Math.min(1, Math.max(0, (u - 0.86) / 0.135)), drop = 11 * (1 - ku * ku * (3 - 2 * ku));
      keystone.position.y = drop;
      if (nl) load.position.copy(nl.lo).addScaledVector(nl.sw, Math.sin(time * 0.9 + nl.ph));      // it swings with its rope
      keyRope.scale.y = Math.max(0.1, keyTip.y - keyTop.y - drop);
      lean.updateWorldMatrix(true, false);
      U.uTowerInv.value.copy(_inv.copy(lean.matrixWorld).invert());
    },
    dispose() {},
  };
  if (dbg) {          // close views for the set-piece viewer: ?dbg=bite|ramp|exit|top
    const t = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(lean.matrix);
    const B = F.bite(0.55), views = { bite: [F.at(B.b, B.r, B.y + 20), 30, 60], ramp: [F.at(72, RW(2 + F.frac(72)) - 16, TOP(2 + F.frac(72)) + 12), 22, 40], exit: [crown.anchors.mouth.clone(), 24, 30], top: [new THREE.Vector3(0, 430, 0), 120, 200] };
    const v = views[dbg];
    if (v) { hero.center = t(v[0].x, v[0].y, v[0].z); hero.radius = v[1]; hero.height = v[2]; hero.ground = false; }
  }
  return hero;
}

// The cloud: piles of lobes in lead white with a flat blue-grey underside and no outline. Opaque, so that flying
// through it is a second of flat white. It breathes by time; the world slides it by moving the returned group.
export function cloudMaterial(white = PALETTE[6], under = PALETTE[4], breath = 1, cell = 0) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE_UNIFORMS, uWhite: { value: new THREE.Color(white) }, uUnder: { value: new THREE.Color(under) }, uBreath: { value: breath }, uCell: { value: cell } },
    side: THREE.DoubleSide,
    vertexShader: STYLE_DECL + /* glsl */`
      attribute float aPhase, aH;
      uniform float uBreath;
      varying vec3 vN, vW;
      varying float vH;
      void main() {
        vec3 p = position + normal * uBreath * (2.5 * sin(uTime * 0.31 + aPhase) + 1.5 * sin(uTime * 0.53 + aPhase * 1.7 + position.x * 0.05));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vN = mat3(modelMatrix) * normal; vW = wp.xyz; vH = aH;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: STYLE_DECL + /* glsl */`
      uniform vec3 uWhite, uUnder; uniform float uCell; varying vec3 vN, vW; varying float vH;
      void main() {
        vec3 n = vN / max(length(vN), 1e-5);
        vec3 c = vH < 0.05 ? uUnder : (dot(n, uLight) < -0.3 ? mix(uWhite, uUnder, 0.38) : uWhite);      // the underside ends on a level line (aH), not along the mesh
        // the pile is told in small round lobes: on the white, a scallop of the shade tone under each (cells of uCell metres;
        // hard edged, flat, and left out where a cell is under about 7 px)
        vec3 q = vW / max(uCell, 1e-3) + vec3(0.0, 0.31, 0.0);
        float fq = max(max(fwidth(q.x), fwidth(q.y)), fwidth(q.z));      // derivatives are taken outside the branch
        if (uCell > 0.0 && vH >= 0.05) {
          vec3 c0 = floor(q), d = fract(q) - 0.5;
          d -= (vec3(bHash(c0.xy + c0.z * 7.1), bHash(c0.yz + c0.x * 3.3), bHash(c0.zx + c0.y * 5.7)) - 0.5) * 0.28;
          float lower = step(length(d), 0.46) * step(0.5, length(d - 0.21 * normalize(uLight + vec3(0.0, 0.6, 0.0))));      // a crescent on the side away from the light, under each lobe
          float keep = step(0.3, bHash(c0.xz + c0.y * 1.7 + 11.0)) * (1.0 - smoothstep(0.1, 0.16, fq));
          c = mix(c, mix(uWhite, uUnder, 0.38), lower * keep);
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
function cloudLobe(ico, rng, len, wid, thick, nLobes, i) {
  const t = nLobes > 1 ? i / (nLobes - 1) : 0.5, g = ico.clone(), p = g.attributes.position, n = g.attributes.normal;
  const env = Math.sin(Math.PI * (0.08 + 0.84 * t)), rx = len / nLobes * rng.range(1.0, 1.7), rz = wid * (0.45 + 0.55 * env) * rng.range(0.6, 1), ry = thick * (0.35 + 0.65 * env) * rng.range(0.6, 1.1);
  const cx = (t - 0.5) * len * 0.86, cz = wid * 0.5 * rng.range(-1, 1) * env, ph = new Float32Array(p.count).fill(rng.range(0, 6.28)), hh = new Float32Array(p.count);
  for (let k = 0; k < p.count; k++) {
    let y = p.getY(k);
    hh[k] = Math.max(0, y + 0.3);
    if (y < -0.3) { y = -0.3; n.setXYZ(k, 0, -1, 0); }
    p.setXYZ(k, cx + p.getX(k) * rx, (y + 0.3) * ry, cz + p.getZ(k) * rz);
  }
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aH', new THREE.BufferAttribute(hh, 1));
  return g;
}
// The same cloud built a few lobes at a time, yielding between (for a large cloud inside build()).
export async function cloudGeometrySteps(rng, len, wid, thick, nLobes, detail, yieldNow) {
  const parts = [], ico = new THREE.IcosahedronGeometry(1, detail);
  for (let i = 0; i < nLobes; i++) { parts.push(cloudLobe(ico, rng, len, wid, thick, nLobes, i)); if (i % 3 === 2) await yieldNow(); }
  await yieldNow();
  const out = mergeGeometries(parts);
  parts.forEach((g) => g.dispose()); ico.dispose();
  return out;
}
export function cloudGeometry(rng, len, wid, thick, nLobes, detail = 2) {
  const parts = [], ico = new THREE.IcosahedronGeometry(1, detail);
  for (let i = 0; i < nLobes; i++) parts.push(cloudLobe(ico, rng, len, wid, thick, nLobes, i));
  const out = mergeGeometries(parts);
  parts.forEach((g) => g.dispose()); ico.dispose();
  return out;
}

// The crown: the ring vault on the last ledge. Finished (roofed) from the exit arch at bearing 270 round to the seam;
// before the arch only a free-standing arcade, rising. Returns anchors in the tower's frame.
function buildCrown(F, pig, rng, open) {
  const g = makePaint(), tim = makePaint(), m = new THREE.Matrix4(), RC = (s) => RW(s) - 14.5, sE = 6 + F.frac(270), br = pig.brick, dk = pig.dark;
  // outer arcade of half-size open bays
  let s = 6.0, n = 0;
  while (s < 7) {
    const w = 12.25, ds = w / (2 * Math.PI * (RW(s) - 3.5)), sc = s + ds / 2, b = ((F.bearing(sc) % 360) + 360) % 360;
    s += ds;
    if (s > 7 || (b > 96 && b < 176) || (b > 236 && b < 272)) continue;
    const birth = sc >= sE ? -1 : (b < 96 || b > 300 ? (n < 3 ? 0.012 + 0.02 * n : 0.08 + 0.36 * rng()) : 0.8 + 0.16 * (b - 176) / 60);
    if (sc < sE) n++;
    wallFrame(F, b, RW(sc) - 3.5, TOP(sc), w / 24 * 0.99, sc >= sE ? 0.5 : rng.range(0.34, 0.5), 0.5, false, m);
    open.add(m, br, 1, birth, rng());
  }
  // the finished vault: outer wall, humped roof, inner wall, and its dark inside
  const N = Math.max(6, Math.round((7 - sE) * 360 / 5)), prof = [[11, 0], [11, 15.5], [9.6, 19.6], [5.6, 23], [0, 24.4], [-5.6, 23], [-9.6, 19.6], [-11, 15.5], [-11, 0]];
  for (let i = 0; i < N; i++) {
    const s0 = sE + (7 - sE) * i / N, s1 = sE + (7 - sE) * (i + 1) / N, b0 = F.bearing(s0), b1 = F.bearing(s1);
    for (let k = 0; k < prof.length - 1; k++) {
      const [xa, ya] = prof[k], [xb, yb] = prof[k + 1];
      g.poly([F.at(b0, RC(s0) + xa, TOP(s0) + ya), F.at(b1, RC(s1) + xa, TOP(s1) + ya), F.at(b1, RC(s1) + xb, TOP(s1) + yb), F.at(b0, RC(s0) + xb, TOP(s0) + yb)], br, 1);
    }
  }
  // the far end of the vault (at the seam) and the exit arch at bearing 270: x radial, z toward the comer
  const fE = cutFrame(F, 270, RC(sE), TOP(sE), -1), fS = cutFrame(F, F.bearing(7) - 0.01, RC(7), TOP(7), 1);
  const gE = makePaint(), gS = makePaint();
  const ex = archPanel(gE, br, { x0: -11, x1: 11, y0: 0, y1: 24.4, cx: 0, a: 9, ys: 0, yc: 13, zp: 0, zb: -26, nseg: 12, open: false, dark: dk, mark: 1, edgeMark: 5, splay: 0.86, splayDepth: 1.3, floor: false, soffit: [mixHex(PALETTE[1], UMBER2, 0.8), dk[0]] });
  archivolt(gE, br, 0, 13, 9, 1.5, 0, 0.6, ex.ang.slice(0, 6), 5); archivolt(gE, br, 0, 13, 9, 1.5, 0, 0.6, ex.ang.slice(7), 5);
  archPanel(gS, br, { x0: -11, x1: 11, y0: 0, y1: 24.4, cx: 0, a: 8, ys: 0, yc: 13, zp: 0, zb: -6, nseg: 8, open: false, dark: dk, mark: 1, edgeMark: 5, floor: false });
  // the timber centering the arch still sits on: a lagged rib, a collar, struts, two posts
  const T = pig.timber, rib = (r0, r1, z0, z1) => {
    for (let i = 0; i < 12; i++) {
      const t0 = Math.PI * i / 12, t1 = Math.PI * (i + 1) / 12, P = (r, t, z) => V(r * Math.cos(t), 13 + r * Math.sin(t), z);
      tim.poly([P(r0, t0, z1), P(r1, t0, z1), P(r1, t1, z1), P(r0, t1, z1)], T, 3);
      tim.poly([P(r0, t1, z1), P(r0, t1, z0), P(r0, t0, z0), P(r0, t0, z1)], T, 3, 0, [[r0 * t1, 0], [r0 * t1, z1 - z0], [r0 * t0, z1 - z0], [r0 * t0, 0]]);
    }
  };
  rib(7.25, 7.8, -2.2, 0.9);
  tim.box(-6.6, 16, 0.3, 6.6, 16.6, 0.9, T, 3, 0, null, '');
  for (const sx of [-1, 1]) {
    tim.box(sx * 7.55 - 0.3, 0, 0.2, sx * 7.55 + 0.3, 13.2, 0.9, T, 3, 0, null, 'b');
    const q = new THREE.Matrix4().makeRotationZ(sx * -0.62).setPosition(sx * 3.4, 16.3, 0.55);
    tim.box(-0.22, 0, -0.25, 0.22, 4.6, 0.25, T, 3, 0, q, 'bt');
  }
  tim.box(-0.25, 16.6, 0.3, 0.25, 20.2, 0.9, T, 3, 0, null, 'bt');
  const out = [g.build(), gE.build().applyMatrix4(fE), gS.build().applyMatrix4(fS), tim.build().applyMatrix4(fE)];
  const P = (x, y, z) => V(x, y, z).applyMatrix4(fE);
  return {
    geo: mergeGeometries(out), sE, frame: fE,
    anchors: { seat: P(0, 7.4, -6), mouth: P(0, 7.4, 0), approach: P(0, 7.4, 70), crownSlot: P(0, 22.3, 0.3), facing: V(0, 0, 1).transformDirection(fE), craneAt: P(8.6, 20.9, -6) },
  };
}

// A timber along a -> b, th thick.
function beam(g, a, b, th, pig, mark = 3, skip = 'b') {
  const d = V().subVectors(b, a), len = d.length();
  if (len < 1e-4) return;
  const m = new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.multiplyScalar(1 / len)), V(1, 1, 1));
  g.box(-th / 2, 0, -th / 2, th / 2, len, th / 2, pig, mark, 0, m, skip);
}
// The treadwheel crane: a boarded house under a thatched gable, an axle through it, a jib and its stays; and the
// walking wheel (9 m across, axis along x through its own origin) that goes on each end of the axle.
// Frame: x along the ledge, y up, z out over the edge. Jib tip at CRANE_TIP.
const CRANE_TIP = V(0, 19, 10.5), WHEEL_AT = [V(-4.9, 5.2, 0), V(4.9, 5.2, 0)];
function craneGeometry(pig) {
  const g = makePaint(), T = pig.timber, th = pig.thatch, dk = pig.dark;
  for (const [x, z] of [[-2.7, -2.3], [2.7, -2.3], [-2.7, 2.3], [2.7, 2.3]]) g.box(x - 0.25, 0, z - 0.25, x + 0.25, 1.2, z + 0.25, T, 3, 0, null, 'bt');
  g.box(-3, 1.2, -2.6, 3, 8, 2.6, T, 3, 0, null, '');
  g.box(-3.3, 1.0, -2.9, 3.3, 1.4, 2.9, T, 0, 0, null, '');                                   // sill plate
  g.poly([V(-0.8, 1.4, 2.62), V(0.8, 1.4, 2.62), V(0.8, 4.2, 2.62), V(-0.8, 4.2, 2.62)], dk, 0);   // door
  g.poly([V(1.5, 5.4, 2.62), V(2.4, 5.4, 2.62), V(2.4, 6.5, 2.62), V(1.5, 6.5, 2.62)], dk, 0);     // shutter hole
  g.poly([V(3.02, 4.3, 0.9), V(3.02, 4.3, -0.9), V(3.02, 6.1, -0.9), V(3.02, 6.1, 0.9)], dk, 0);
  g.poly([V(-3.02, 4.3, -0.9), V(-3.02, 4.3, 0.9), V(-3.02, 6.1, 0.9), V(-3.02, 6.1, -0.9)], dk, 0);
  // gable roof, ridge along x
  const e = 3.5, r = 3.9, ye = 7.7, yr = 11.2;
  g.poly([V(-r, ye, e), V(r, ye, e), V(r * 0.93, yr, 0), V(-r * 0.93, yr, 0)], th, 3);
  g.poly([V(r, ye, -e), V(-r, ye, -e), V(-r * 0.93, yr, 0), V(r * 0.93, yr, 0)], th, 3);
  g.poly([V(3, 8, 2.6), V(3, 8, -2.6), V(3, 10.9, 0)], T, 3); g.poly([V(-3, 8, -2.6), V(-3, 8, 2.6), V(-3, 10.9, 0)], T, 3);
  beam(g, V(-6.3, 5.2, 0), V(6.3, 5.2, 0), 0.6, T, 0, '');                                     // axle
  beam(g, V(0, 9.6, 1.2), CRANE_TIP.clone().add(V(0, 0.5, 0.6)), 0.55, T, 3, '');              // jib
  beam(g, V(0, 9.8, 1.2), V(0, 14.5, -1.2), 0.4, T, 3, '');                                    // king post
  beam(g, V(0, 14.4, -1.2), V(0, 15.6, 6.3), 0.3, T, 3, '');                                   // stay
  beam(g, V(0, 9.3, 3.2), V(0, 12.4, 4.2), 0.3, T, 3, '');                                     // strut
  const w = makePaint();
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * 2 * Math.PI, a1 = a0 + 0.62 * 2 * Math.PI / 12, a2 = ((i + 1) / 12) * 2 * Math.PI;
    const P = (x, r2, a) => V(x, r2 * Math.cos(a), r2 * Math.sin(a));
    w.poly([P(-0.8, 4.5, a0), P(0.8, 4.5, a0), P(0.8, 4.5, a1), P(-0.8, 4.5, a1)], T, 0);       // tread board, gap after it
    for (const x of [-0.8, 0.8]) w.poly([P(x, 4.5, a0), P(x, 4.5, a2), P(x, 4.0, a2), P(x, 4.0, a0)], T, 0);   // rim
  }
  for (const x of [-0.8, 0.8]) for (let k = 0; k < 2; k++) {
    const a = k * Math.PI / 2 + 0.3;
    beam(w, V(x, -4.2 * Math.cos(a), -4.2 * Math.sin(a)), V(x, 4.2 * Math.cos(a), 4.2 * Math.sin(a)), 0.32, T, 0, 'bt');
  }
  return { house: g, wheel: w };
}

// Where the cranes stand (tower frame). Returns [{ m: Matrix4, scale, rope, kind }].
function placeCranes(F, rng, rocks, ledges, crown, great) {
  const list = [], add = (b, r, y, scale, rope, kind) => list.push({ m: wallFrame(F, b, r, y, scale, scale, scale), b, r, y, scale, rope, kind });
  const sN = 2 + F.frac(78); add(78, RW(sN) - 28 + 2.3 + 3.6, TOP(sN), 1, 2.6, 'near');
  const sG = great; add(30, RW(sG) - 6.5, TOP(sG), 1.5, 46, 'great');
  let tries = 0;
  while (list.length < 11 && tries++ < 200) {
    const k = rng.int(1, 6), b = rng.range(0, 360), s = k + F.frac(b), bb = ((b % 360) + 360) % 360;
    if ((inBite(bb) && s >= 2.9) || (s >= 6 && bb > 170 && bb < 292) || (k === 2 && bb > 20 && bb < 110) || list.some((c) => Math.abs(c.y - TOP(s)) < 40 && Math.abs(((c.b - bb + 540) % 360) - 180) < 28)) continue;
    add(bb, RW(s) - 5.5, TOP(s), rng.range(0.85, 1.2), rng.range(12, 50), 'far');
  }
  // one on every ledge of the bite that has room
  const picked = [];
  for (const L of rng.shuffle(ledges.slice())) {
    if (picked.length >= 9 || L.y < 190 || picked.some((q) => Math.abs(q.y - L.y) < 20 && Math.abs(q.b - L.b) < 14)) continue;
    picked.push(L); add(L.b, L.r, L.y + HUMP, 0.9, rng.range(8, 22), 'bite');
  }
  // the one that lowers the keystone: on a platform on the vault roof, jib over the crown of the exit arch
  const slot = crown.anchors.crownSlot, at = crown.anchors.craneAt, z = V(slot.x - at.x, 0, slot.z - at.z), reach = z.length();
  z.normalize();
  const x = V(0, 1, 0).cross(z), sc = reach / CRANE_TIP.z;
  list.push({ m: new THREE.Matrix4().makeBasis(x.multiplyScalar(sc), V(0, sc, 0), z.clone().multiplyScalar(sc)).setPosition(at), b: 270, r: 0, y: at.y, scale: sc, rope: 0, kind: 'key' });
  return list;
}

// His people: lumps of cap and smock in two tones, no face, legs in double umber. Instanced billboards that stand
// plumb to their parent, walk to and fro along iWalk and never draw smaller than about 3 px, so a tier can be counted.
// makeFigures() collects them: f.add(position, walkVector, capColor, speed, white) then f.mesh(material).
export function figureMaterial(pig, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE_UNIFORMS, uDistK: { value: opts.distK ?? 0.5 }, uMinPx: { value: opts.minPx ?? 4.2 }, uNearK: { value: opts.nearK ?? 0 }, uSmL: { value: (opts.smock ?? pig.smock)[0] }, uSmS: { value: (opts.smock ?? pig.smock)[1] }, uSm2: { value: (opts.smock2 ?? opts.smock ?? pig.smock)[0] }, uWhL: { value: pig.lime[0] }, uWhS: { value: pig.lime[1] } },
    vertexShader: STYLE_DECL + /* glsl */`
      attribute vec3 iPos;
      attribute vec4 iWalk, iLook;       // walk vector (m) and phase; cap colour and speed (negative speed = white smock)
      uniform float uMinPx, uNearK;
      varying vec2 vQ; varying vec3 vCap, vW; varying float vSide, vWhite, vTone;
      void main() {
        float sp = abs(iLook.w);
        vTone = step(0.5, fract(iWalk.w * 3.7));
        vec3 base = iPos + iWalk.xyz * sin(uTime * sp * 0.35 + iWalk.w);
        vec4 wb = modelMatrix * vec4(base, 1.0);
        vec3 up = mat3(modelMatrix) * vec3(0.0, 1.0, 0.0);
        up /= max(length(up), 1e-5);
        vec3 right = cross(up, uEye - wb.xyz);
        float rl = length(right);
        right = rl > 1e-4 ? right / rl : vec3(1.0, 0.0, 0.0);
        vec4 cb = projectionMatrix * viewMatrix * wb;
        float pxPerM = uView.y * projectionMatrix[1][1] * 0.5 / max(abs(cb.w), 1e-3);
        float h = max(1.75, uMinPx * (1.0 + uNearK * (1.0 - smoothstep(260.0, 620.0, abs(cb.w)))) / max(pxPerM, 1e-4));      // nearer than 260 m they are held larger: counted on the tiers above the climb
        float bob = 0.07 * abs(sin(uTime * sp * 2.4 + iWalk.w * 3.0));
        vec3 wp = wb.xyz + right * position.x * h * 0.56 + up * (position.y * h + bob);
        vQ = vec2(position.x + 0.5, position.y); vCap = iLook.rgb; vW = wp;
        vSide = step(0.0, dot(right, uLight)); vWhite = step(iLook.w, 0.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      uniform float uDistK; uniform vec3 uSmL, uSmS, uSm2, uWhL, uWhS;
      varying vec2 vQ; varying vec3 vCap, vW; varying float vSide, vWhite, vTone;
      void main() {
        float x = abs(vQ.x - 0.5) * 2.0, y = vQ.y;
        bool leg = y < 0.34 && x > 0.1 && x < 0.52;
        bool smock = y >= 0.34 && y < 0.8 && x < mix(0.95, 0.66, (y - 0.34) / 0.46);
        bool head = y >= 0.8 && x < 0.44;
        if (!(leg || smock || head)) discard;
        float litHalf = (vQ.x > 0.5) == (vSide > 0.5) ? 1.0 : 0.0;
        vec3 sm = mix(mix(uSmS, mix(uSmL, uSm2, vTone), litHalf), mix(uWhS, uWhL, litHalf), vWhite);
        vec3 c = leg ? uUmber2 : (smock ? sm : (y > 0.87 ? vCap : mix(uSmS, uSmL, 0.5)));
        gl_FragColor = vec4(pigmentDistance(c, vW, uDistK), 1.0);
      }`,
  });
}
export function makeFigures() {
  const P = [], Wk = [], Lk = [];
  return {
    get count() { return P.length / 3; },
    add(p, walk, cap, speed = 1, white = false, phase = 0) { P.push(p.x, p.y, p.z); Wk.push(walk.x, walk.y, walk.z, phase); Lk.push(cap.r, cap.g, cap.b, white ? -speed : speed); },
    mesh(mat) {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(P), 3));
      g.setAttribute('iWalk', new THREE.InstancedBufferAttribute(new Float32Array(Wk), 4));
      g.setAttribute('iLook', new THREE.InstancedBufferAttribute(new Float32Array(Lk), 4));
      g.instanceCount = P.length / 3;
      const me = new THREE.Mesh(g, mat); me.frustumCulled = false;
      return me;
    },
  };
}

// The building site on the tower: crane ropes and loads, scaffolds one lift ahead of the brick, ladders, the people.
async function buildSite(F, pig, rng, bays, cranes, ledges, crown, detail, yieldNow, faces = []) {
  const rib = makeRibbons(), fig = makeFigures(), u2 = pig.umber2, pole = mixHex(PALETTE[2], PALETTE[0], 0.4), m = new THREE.Matrix4(), a = V(), b = V();
  const caps = [pig.timber[0], pig.timber[1], u2, pig.smock[1], pig.lime[0]];
  const cap = () => (rng() < 0.1 ? pig.red[0] : rng.pick(caps));
  let nearLoad = null;
  for (const c of cranes) {
    const tip = CRANE_TIP.clone().applyMatrix4(c.m), top = V(0, 9.8, 2.2).applyMatrix4(c.m), tan = V(1, 0, 0).transformDirection(c.m);
    rib.seg(tip, top, 0.08, u2);
    if (c.rope > 0) {
      const lo = tip.clone().add(V(0, -c.rope, 0)), sw = tan.clone().multiplyScalar(0.5 + 0.022 * c.rope), ph = rng.range(0, 6.28);
      rib.seg(tip, lo, 0.09, u2, -1, null, sw, ph);
      if (c.kind === 'near') nearLoad = { lo, sw, ph };
      else rib.seg(lo, lo.clone().add(V(0, -1.3 * c.scale, 0)), 1.7 * c.scale, rng() < 0.6 ? pig.stone[0] : pig.brick[0], -1, sw, sw, ph);
    }
    // the men at the windlass and round the foot of it
    for (let k = 0; k < (c.kind === 'near' ? 0 : 3); k++) fig.add(V(rng.range(-6, 6), 0, rng.range(-7, -3.5)).applyMatrix4(c.m), tan.clone().multiplyScalar(rng.range(0.5, 3)), cap(), rng.range(0.6, 1.4), rng() < 0.25, rng.range(0, 6.28));
    if (c.kind === 'near') for (const wpos of WHEEL_AT) fig.add(V(wpos.x, wpos.y - 4.4, 0.3).applyMatrix4(c.m), V(0, 0, 0), cap(), 1.3, false, rng.range(0, 6.28));
  }
  // scaffolds: poles, ledgers, putlogs, ladders
  let nb = 0;
  for (const bay of bays) {
    if (nb++ % 40 === 0) await yieldNow();
    if (!(bay.birth > 0 || rng() < (bay.stone ? 0.07 : 0.3) * detail)) continue;
    wallFrame(F, bay.b, bay.r + 0.15, bay.base, 1, 1, 1, false, m);
    const hp = bay.h * (bay.birth > 0 || !bay.stone ? rng.range(0.8, 1.06) : rng.range(0.4, 0.9)), birth = bay.birth > 0 && !bay.late ? bay.birth - 0.045 : -1, hw = bay.w / 2 - 3.2;
    const L = (x0, y0, z0, x1, y1, z1, w, c) => rib.seg(a.set(x0, y0, z0).applyMatrix4(m).clone(), b.set(x1, y1, z1).applyMatrix4(m).clone(), w, c, birth);
    for (const x of [-hw, 0, hw]) L(x, 0, 9.3, x + rng.range(-0.3, 0.3), hp + rng.range(0, 3), 9.3, 0.2, pole);
    let prev = 0, side = 1;
    for (let y = 7 + rng.range(-1, 1); y < hp - 1; y += 11.5) {
      L(-hw - 1, y, 9.4, hw + 1, y + rng.range(-0.3, 0.3), 9.4, 0.3, pole);
      for (const x of [-hw, hw]) L(x, y, 9.3, x, y, 2.2, 0.16, pole);
      if (birth < 0 && rng() < 0.7) fig.add(a.set(rng.range(-hw, hw) * 0.8, y + 0.15, 8.6).applyMatrix4(m), b.set(1, 0, 0).transformDirection(m).multiplyScalar(rng.range(0.5, 2.5)), cap(), rng.range(0.5, 1.2), rng() < 0.12, rng.range(0, 6.28));
      const x0 = side * hw * 0.3, x1 = side * hw * 0.75;
      L(x0, prev, 9.8, x1, y, 9.8, 0.1, u2); L(x0 + 0.55, prev, 9.8, x1 + 0.55, y, 9.8, 0.1, u2);
      for (let r = 1; r < 5; r++) { const t = r / 5; L(x0 + (x1 - x0) * t, prev + (y - prev) * t, 9.8, x0 + (x1 - x0) * t + 0.55, prev + (y - prev) * t, 9.8, 0.07, u2); }
      prev = y; side = -side;
    }
  }
  // the people on the ramp, tier by tier, and on every ledge of the bite
  const nLedge = Math.round(2500 * detail);
  for (let i = 0; i < nLedge; i++) {
    if (i % 120 === 0) await yieldNow();
    const s = 0.4 + 6.6 * Math.sqrt(rng()), bDeg = F.bearing(s), bb = ((bDeg % 360) + 360) % 360, r = RW(s) - rng.range(3, 25), sp = rng.range(0.5, 1.6), ph = rng.range(0, 6.28), wh = rng() < 0.12, c = cap(), rg = rng.range(1.5, 13);
    if ((inBite(bb) && s >= 3.3) || (s >= 6 && i % 3 !== 0) || (s >= 5.9 && bb > 156 && bb < 216)) continue;      // nobody stands where the cloud lies on the top ring: a man in the white reads as floating      // the top turn is short: one in three, or it is a crowd
    // the stretch of ramp we fly (10 m over the roadway, 9.5 m in from the parapet): they keep to the inner wall, 14 m and more from the eye
    const rr = bb > 28 && bb < 100 && s > 2 && s < 2.5 ? RW(s) - 19.5 - 7 * (RW(s) - r - 3) / 22 : r;
    const rt = s >= 6 && bb > 225 && bb < 275 && RW(s) - rr > 8 && RW(s) - rr < 21 ? RW(s) - (rr % 2 < 1 ? 5 : 23.5) : rr;
    F.at(bDeg, rt, TOP(s) + 0.1, a);
    fig.add(a, V(Math.cos(bDeg * DEG), 0, -Math.sin(bDeg * DEG)).multiplyScalar(rg), c, sp, wh, ph);
  }
  // men on the coping of the stone facing (it stands 3 m proud of the wall): the tiers above the eye are read by who stands at their rims
  const norm = (d) => ((d % 360) + 360) % 360;
  const done = bays.filter((B) => B.birth < 0 && B.s < 5.9 && !(B.s > 1.9 && B.s < 2.6 && norm(B.b) > 20 && norm(B.b) < 105) && !(B.s > 4.9 && norm(B.b) > 150 && norm(B.b) < 222));
  for (let i = 0; i < Math.round(460 * detail) && done.length; i++) {
    if (i % 120 === 0) await yieldNow();
    let B = done[0];
    for (let k = 0; k < 12; k++) { B = done[rng.int(0, done.length - 1)]; const bb = norm(B.b); if (i % 2 || bb > 325 || bb < 75) break; }      // half of them on the face the climb looks up
    F.at(B.b + rng.range(-0.2, 0.2) * B.w / B.r / DEG, B.r + 2.9, B.base + B.h + 0.05, a);
    fig.add(a, V(Math.cos(B.b * DEG), 0, -Math.sin(B.b * DEG)).multiplyScalar(rng.range(1, 0.22 * B.w)), cap(), rng.range(0.5, 1.3), rng() < 0.15, rng.range(0, 6.28));
  }
  await yieldNow();
  // files of hod carriers on the ramp ahead of us and on the top ring: a road is never bare
  for (let i = 0; i < Math.round(250 * detail); i++) {
    const top = i % 5 === 4, bq = top ? rng.range(216, 268) : rng.range(30, 99), sq = (top ? 6 : 2) + F.frac(bq), rq = RW(sq) - (top ? (rng() < 0.5 ? rng.range(2.5, 8) : rng.range(21, 26)) : rng.range(19.5, 26.5));      // on the top ring they keep to the two sides of the road: the eye comes down the middle to the arch
    F.at(bq, rq, TOP(sq) + 0.1, a);
    fig.add(a, V(Math.cos(bq * DEG), 0, -Math.sin(bq * DEG)).multiplyScalar(rng.range(2, 14)), cap(), rng.range(0.6, 1.5), rng() < 0.12, rng.range(0, 6.28));
  }
  let nl = 0;
  for (const Lg of ledges) for (let k = 0; k < Math.round(13 * detail); k++) {
    if (nl++ % 240 === 239) await yieldNow();
    const dx = k % 2 ? rng.range(-9, 9) : rng.sign() * rng.range(8.9, 10.5), bq = Lg.b + rng.range(-0.3, 0.3) * Lg.w / Lg.r / DEG, B = F.bite(Math.min(1, Math.max(0, F.biteT(bq))));
    F.at(bq, Lg.r + dx, Lg.y + (Math.abs(dx) > 8.6 ? 0 : HUMP * (1 - Math.abs(dx) / 8.6)), a);
    const nearLine = Math.hypot(Lg.r + dx - B.r, a.y - B.y - 12) < 17;      // the eye passes here: nobody within 17 m of it
    const wv = V(Math.cos(Lg.b * DEG), 0, -Math.sin(Lg.b * DEG)).multiplyScalar(rng.range(1, Lg.w * 0.2)), cc = cap(), sp = rng.range(0.5, 1.4), wh = rng() < 0.12, ph = rng.range(0, 6.28);
    if (!nearLine) fig.add(a, wv, cc, sp, wh, ph);
  }
  for (let k = 0; k < 12; k++) {
    const x = rng.range(-7, 7), z = rng.range(-22, -1.5);
    fig.add(V(x, 24.4 - 0.045 * x * x * 1.6, z).applyMatrix4(crown.frame), V(0, 0, 1).transformDirection(crown.frame).multiplyScalar(rng.range(0.5, 3)), cap(), rng.range(0.5, 1.3), rng() < 0.22, rng.range(0, 6.28));
  }
  // what stands on every stretch of ledge: a thatched hut, a mortar trough, a stack of brick or dressed stone, a ladder
  const furn = makePaint(), lime = pig.lime, T = pig.timber, th = pig.thatch;
  const hut = (q) => {
    furn.box(-2.3, 0, -1.6, 2.3, 2.2, 1.6, T, 3, 0, q, 'bt');
    const e = [V(-2.7, 2.0, 2.0), V(2.7, 2.0, 2.0), V(2.7, 2.0, -2.0), V(-2.7, 2.0, -2.0), V(-2.5, 4.3, 0), V(2.5, 4.3, 0)].map((v) => v.applyMatrix4(q));
    furn.poly([e[0], e[1], e[5], e[4]], th, 3); furn.poly([e[2], e[3], e[4], e[5]], th, 3);
    furn.poly([e[1], e[2], e[5]], T, 3); furn.poly([e[3], e[0], e[4]], T, 3);
    furn.poly([V(-0.6, 0, 1.63), V(0.6, 0, 1.63), V(0.6, 1.7, 1.63), V(-0.6, 1.7, 1.63)].map((v) => v.applyMatrix4(q)), pig.dark, 0);
  };
  const trough = (q) => {
    furn.box(-1.7, 0, -0.8, 1.7, 0.6, 0.8, T, 3, 0, q, 'bt');
    furn.poly([V(-1.7, 0.6, 0.8), V(1.7, 0.6, 0.8), V(1.7, 0.6, -0.8), V(-1.7, 0.6, -0.8)].map((v) => v.applyMatrix4(q)), lime, 0);
  };
  const stack = (q, stone, k = 1) => furn.box(-1.3 * k, 0, -0.75 * k, 1.3 * k, 1.25 * k, 0.75 * k, stone ? pig.stone : pig.brick, stone ? 2 : 1, 0, q, 'b');
  const q4 = new THREE.Matrix4(), sh4 = new THREE.Matrix4();
  const put = (bq, r, y, dx, dz, yaw = 0) => q4.copy(wallFrame(F, bq, r, y, 1, 1, 1, false, m)).multiply(sh4.makeRotationY(yaw).setPosition(dx, 0, dz));
  let sR = 0.45, nf = 0;
  while (sR < 6.95) {
    const bq = F.bearing(sR), bb = ((bq % 360) + 360) % 360, top = sR >= 6, outer = top && nf % 2 === 1, r = RW(sR) - (top ? (outer ? 6.2 : 24) : 25.2), y = TOP(sR) + 0.05;
    const step = rng.range(44, 70) / (2 * Math.PI * RW(sR)) * (top ? 0.42 : 1);
    sR += step;
    if ((inBite(bb) && sR >= 3.2) || (top && sR >= crown.sE - 0.012)) { nf++; continue; }
    if (nf++ % 10 === 9) await yieldNow();
    const kind = rng();
    if (kind < 0.62) hut(put(bq, r, y, 0, 0, rng.range(-0.2, 0.2) + (outer ? Math.PI : 0)));
    if (kind > 0.3) trough(put(bq, r, y, kind < 0.62 ? 5.6 : 0, 1.6, rng.range(-0.5, 0.5)));
    stack(put(bq, r, y, -5.4, 0.6, rng.range(-0.4, 0.4)), sR < 4.4, rng.range(0.9, 1.4));
    if (rng() < 0.5) stack(put(bq, r, y, -8.6, 1.0, rng.range(-0.4, 0.4)), sR < 4.4, rng.range(0.7, 1.1));
    if (!top && rng() < 0.6) {       // a ladder against the wall behind
      const l0 = V(2.9, 0, -0.4).applyMatrix4(put(bq, r, y, 3.4, 0)), l1 = V(2.9, 9, -2.9).applyMatrix4(q4), l2 = V(3.5, 0, -0.4).applyMatrix4(q4), l3 = V(3.5, 9, -2.9).applyMatrix4(q4);
      rib.seg(l0, l1, 0.1, u2); rib.seg(l2, l3, 0.1, u2);
      for (let k = 1; k < 8; k++) rib.seg(l0.clone().lerp(l1, k / 8), l2.clone().lerp(l3, k / 8), 0.07, u2);
    }
  }
  await yieldNow();
  // and on the vault backs in the bite: stacks, troughs, a scaffold of poles, a hut where there is room
  for (const Lg of ledges) {
    const B = F.bite(Math.min(1, Math.max(0, F.biteT(Lg.b))));
    if (Math.hypot(Lg.r - B.r, Lg.y + 3 - B.y - 12) < 20) continue;
    if (cranes.some((c) => c.kind === 'bite' && Math.abs(c.b - Lg.b) < 0.01 && Math.abs(c.r - Lg.r) < 0.01 && Math.abs(c.y - Lg.y) < 4)) continue;      // the crane has this ledge
    const y = Lg.y + HUMP * 0.85, kind = rng();
    if (kind < 0.3) hut(put(Lg.b, Lg.r, y, 0, 0, Math.PI / 2 + rng.range(-0.2, 0.2)));
    else if (kind < 0.62) trough(put(Lg.b, Lg.r, y, rng.range(-3, 3), 0, rng.range(-0.6, 0.6)));
    stack(put(Lg.b, Lg.r, y, rng.range(-1, 1) + (kind < 0.62 ? 5.5 : 0), rng.range(-0.8, 0.8), rng.range(-0.5, 0.5)), false, rng.range(0.9, 1.5));
    if (rng() < 0.55 * detail) {
      const hp = rng.range(8, 14), x0 = rng.range(-7, -4.5);
      put(Lg.b, Lg.r, y, 0, 0);
      const P = (x, yy, z) => V(x, yy, z).applyMatrix4(q4);
      for (let k = 0; k < 3; k++) rib.seg(P(x0 + 3.2 * k, -0.4, 4.5), P(x0 + 3.2 * k + rng.range(-0.3, 0.3), hp + rng.range(0, 2.5), 4.5), 0.18, pole);
      rib.seg(P(x0 - 0.8, hp * 0.55, 4.6), P(x0 + 7.2, hp * 0.55 + rng.range(-0.3, 0.3), 4.6), 0.24, pole);
      rib.seg(P(x0 - 0.8, hp * 0.96, 4.6), P(x0 + 7.2, hp * 0.96, 4.6), 0.2, pole);
    }
  }
  {
    const P = (x, y, z) => V(x, y, z).applyMatrix4(crown.frame), ax = V(1, 0, 0).transformDirection(crown.frame);
    for (const x of [-13.6, -11.4, 11.4, 13.6]) rib.seg(P(x, 0, 1.6), P(x + rng.range(-0.3, 0.3), 27 + rng.range(0, 3), 1.6), 0.2, pole);
    for (const sx of [-1, 1]) for (const y of [7.5, 15.5, 23]) {
      rib.seg(P(sx * 10.6, y, 1.7), P(sx * 14.4, y + rng.range(-0.2, 0.2), 1.7), 0.3, pole);
      fig.add(P(sx * rng.range(11.6, 13.2), y + 0.15, 1.3), ax.clone().multiplyScalar(0.6), cap(), rng.range(0.5, 1.2), false, rng.range(0, 6.28));
    }
    rib.seg(P(-14.4, 26.2, 1.7), P(14.4, 26.4, 1.7), 0.3, pole);
    for (let k = 0; k < 5; k++) fig.add(P(rng.range(-12, 12), 26.5, 1.3), ax.clone().multiplyScalar(rng.range(0.5, 2)), cap(), rng.range(0.5, 1.2), rng() < 0.15, rng.range(0, 6.28));
    for (const sx of [-1, 1]) { rib.seg(P(sx * 12.1, 0, 2.6), P(sx * 12.1, 7.5, 1.8), 0.1, u2); rib.seg(P(sx * 12.7, 0, 2.6), P(sx * 12.7, 7.5, 1.8), 0.1, u2); for (let k = 1; k < 7; k++) rib.seg(P(sx * 12.1, k * 1.07, 2.6 - 0.114 * k), P(sx * 12.7, k * 1.07, 2.6 - 0.114 * k), 0.07, u2); }
  }
  const lineAt = []; for (let i = 0; i <= 40; i++) { const B = F.bite(i / 40); lineAt.push(F.at(B.b, B.r, B.y + 12)); }
  let nfc = 0;
  for (const fm of faces) {
    if (nfc++ % 20 === 19) await yieldNow();
    if (rng() > 0.6 * detail) continue;
    const c0 = V(0, 15, 2).applyMatrix4(fm);
    if (lineAt.some((q) => q.distanceTo(c0) < 19)) continue;
    const P = (x, y, z) => V(x, y, z).applyMatrix4(fm), sx = rng.sign(), x0 = sx * 10.6, x1 = sx * rng.range(3.5, 7), top = rng.range(17, 29), along = V(1, 0, 0).transformDirection(fm);
    rib.seg(P(x0, -0.5, 1.9), P(x0 + rng.range(-0.2, 0.2), top + 2, 1.9), 0.18, pole); rib.seg(P(x1, -0.5, 1.9), P(x1 + rng.range(-0.2, 0.2), top + 1, 1.9), 0.18, pole);
    for (let y = rng.range(6, 9); y < top; y += rng.range(7.5, 9.5)) {
      rib.seg(P(x0 + sx * 0.6, y, 1.9), P(x1 - sx * 0.6, y + rng.range(-0.2, 0.2), 1.9), 0.3, pole);
      rib.seg(P(x0, y, 1.9), P(x0, y, 0.2), 0.14, pole); rib.seg(P(x1, y, 1.9), P(x1, y, 0.2), 0.14, pole);
      const nm = rng() < 0.45 ? 2 : 1;
      for (let k = 0; k < nm; k++) fig.add(P(x0 + (x1 - x0) * rng.range(0.2, 0.8), y + 0.15, 1.5), along.clone().multiplyScalar(rng.range(0.3, 1.2)), cap(), rng.range(0.5, 1.2), rng() < 0.12, rng.range(0, 6.28));
    }
  }
  return { rib, fig, furn, nearLoad };
}
