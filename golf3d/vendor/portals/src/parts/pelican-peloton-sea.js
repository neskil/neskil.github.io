// pelican-peloton-sea.js: the sky dome with its sun, the sea, the clouds, the sea pelicans and their laws,
// the splashes and the boats of the world pelican-peloton (build plan section 3.3).
//
// THIS STATE: everything stands. The sky and the sea (makeSky, makeSea); the drifting clouds and the standing bank
// (makeClouds); the sea pelican open, light and folded; the gliders on their seven typed lines, the ambient divers and
// the rare run's, the nine of the harbour, the splashes, the sitters and the roost, the boats; the bed under the road
// in the air (the bank's own draws), the watchers on its lobes and the pennants (plan-changes pb). Every law of place and
// of motion is in pelican-peloton-plan-sea.js (pure; its mirrors are what tools/ab/pp-count-sea.mjs counts) and is
// written again here as vertex text; nothing here reads a clock but the world's time (uTime) and, for the nine, the
// metres flown (uD); nothing reads the lens but the discs' turning to the eye (a splash's tongues and tears turn
// about their own axis) and the one line's width.
//
// The contract (build plan 3.3; the lead's ruling 4 for the third argument of makeSky):
//   makeSky(look, sunDir, opts)          -> { mesh, update(time, camP) }      opts.domeSun true | false: the sun's
//                                           disc and its pale halo are on the dome only when it is not false
//   makeSea(look, sunDir, opts)          -> { group, update(time, camP) }     opts.strokes, opts.shoal (opts.sunAt: see THE SUN)
//   makeClouds(look, dealt, opts)        -> { group, update(time), counts }   opts.detail (0..1) thins the bank's fog
//   seaPelicanGeometry(look, Y, opts)    -> a finished BufferGeometry (async) opts.folded; the open one carries the
//                                           light model as userData.lo
//   makeGliders(look, geometry, courses) -> one instanced mesh (plan-sea's seven lines where `courses` brings none)
//   makeDivers(look, geometry, rows, opts) -> one instanced mesh of the light model (rows kept by plan-sea's keepDivers;
//                                           opts.boats: the rare visit's boats, whose near divers are left out)
//   makeNine(look, geometry, table)      -> one instanced mesh, by uD (the plan's nineCourse rows)
//   makeSplashes(look, rows, opts)       -> one instanced mesh (crown, drops, foam) opts.byD for the nine; opts.boats as the divers'
//   makeWatchers(look, folded)           -> a group of two instanced meshes (plan-sea's watchers on the bed's lobes)
//   makePennants(look)                   -> one merged mesh (plan-sea's pennantPoles)
//   makeSitters(look, geometry, rows, roost, perch) -> one instanced mesh (the roost: plan-sea's roostPlaces where none is given;
//                                           perch: [[x, y, z, heading], ...] sitting places the world hands over, or none)
//   makeBoats(look, places, sails)       -> one instanced mesh
//
// THE SKY AND THE SEA are two plain ShaderMaterials of their own (they take no hull): each pixel writes ONE of the
// look's flat colours, and every edge between two colours is one pixel wide by the pixel's own footprint. Nothing in
// either reads a clock but the world's time (the strokes' slide and their coming and going), and nothing reads the
// lens but for: the dome's and the fan's place, the pixel's footprint, THE SUN'S ROAD, which reads the eye's
// bearing to the sun as light does (a mirror on the water), and THE FAR BAND of paler water, which begins SEA.FAR m
// from the eye whichever way it looks (the air between eye and water: optics, by the eye's place and never its gaze).
//
// THE SUN is on the dome, at infinity on the route's last tangent (the way out's chosen form: the engine's opening is
// born inside its disc): makeSky draws it about sunDir (opts.domeSun false leaves the sun and its halo out; the world
// never asks that), and the sea's road of light runs along sunDir's bearing from the eye. makeSea still takes
// opts.sunAt, a place of the world [x, y, z] for the water to answer instead; the world hands none, and nothing is
// read from the look or the page to choose.
import * as THREE from 'three';
import { PP, CLOUDS, NINE_LAW, BOAT_R, BOAT_H, SEA as SEALAW, layRoad } from './pelican-peloton-plan.js';
import { SKY as SKYLAW, BANK, FOOT, GLIDE, DIVE, ROOST, WATCH, PENNANT, clearLanes, seaBank, bankFoot, bedGoes, gliderLines, courseLength, roostPlaces, keepDivers, diverKeeps, linePlaces, cloudSide, NINE_SEA, watchers, pennantPoles } from './pelican-peloton-plan-sea.js';
import { makeDiscs, PP_GLSL, lineOf, flatMaterial, makeBuilder, ball, tube, stroke, plate, finish, appendHulls, setInstances } from './pelican-peloton.js';

const D2R = Math.PI / 180;
const f4 = (x) => Number(x).toFixed(5);
// the plan's road, laid once a visit for this part's own typed places (kept on the visit's look, never on the module)
const seaRoad = (look) => look._seaRoad || (look._seaRoad = layRoad());
const vec3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// ---------------------------------------------------------------------------------------------
// THE SKY (shader S4). A dome drawn at the lens's own place whatever camera draws it: its vertex shader turns the
// dome by the view's rotation alone and lays it ON THE FAR PLANE, so the dome cannot lag the lens or be cut by it;
// its depth is tested and not written, so it lies behind everything whatever the order of drawing (a group's
// renderOrder sorts before a mesh's own: the sea's group is drawn before the dome). Flat bands by elevation: the sea's far colour
// below the horizon (the fan's own far band meets it), the horizon's one dark line, the pale band to SKY.LOW
// degrees, the sky. With the sun on the dome: one pale halo ring to PP.HALO_R degrees and the plain disc of
// PP.SUN_R degrees about sunDir, no line and no rays. Every edge is one pixel wide by the pixel's own angle.
// ---------------------------------------------------------------------------------------------
const SKY = { LOW: 5, LINE_PT: PP.LINE_PT[0] };          // degrees of the pale band; the horizon line's width in points
const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main(){
    vDir = position;
    vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4;
    gl_Position = p.xyww;
  }`;
const SKY_FRAG = /* glsl */`
  uniform vec3 uSky, uLow, uSun, uHalo, uSeaFar, uInk, uSunDir;
  uniform vec4 uAng;                 // radians: the pale band's top, the sun's radius, the halo's radius; w 1 with the sun on the dome, 0 without
  uniform float uResY, uLinePt;
  varying vec3 vDir;
  float over(float x, float x0, float px){ return clamp((x - x0) / px + 0.5, 0., 1.); }   // 1 where x is over x0, one pixel of edge
  void main(){
    vec3 d = vDir / max(length(vDir), 1e-4);
    float px = clamp(max(length(dFdx(d)), length(dFdy(d))), 1e-5, 0.05);   // the angle one pixel covers, taken once
    float el = atan(d.y, max(length(d.xz), 1e-5));                         // elevation over the horizon
    float lc = length(cross(d, uSunDir)), dc = dot(d, uSunDir);
    float ang = atan(lc, dc + (lc + abs(dc) < 1e-6 ? 1e-6 : 0.));           // the angle to the sun's middle
    vec3 col = mix(uLow, uSky, over(el, uAng.x, px));
    col = mix(col, uHalo, uAng.w * (1. - over(ang, uAng.z, px)));
    col = mix(col, uSun, uAng.w * (1. - over(ang, uAng.y, px)));
    col = mix(uSeaFar, col, over(el, 0., px));
    // the horizon's dark line stands wholly over the horizon, so the sea fan's far rim never lies on it
    float hw = 0.5 * uLinePt * max(uResY / 450., 1.);
    col = mix(col, uInk, clamp(hw + 0.5 - abs(el / px - hw), 0., 1.));
    gl_FragColor = vec4(col, 1.);
  }`;
export function makeSky(look, sunDir, opts = {}) {
  const domeSun = opts.domeSun !== false, U = look.U || {};
  const sd = (sunDir && sunDir.isVector3 ? sunDir.clone() : vec3(sunDir || [0.6486, 0.1392, 0.7483])).normalize();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSky: { value: vec3(look.col('sky')) }, uLow: { value: vec3(look.col('skyLowBand')) }, uSun: { value: vec3(look.col('sun')) },
      uHalo: { value: vec3(look.col('halo')) }, uSeaFar: { value: vec3(look.col('seaFar')) }, uInk: { value: vec3(look.col('ink')) },
      uSunDir: { value: sd }, uAng: { value: new THREE.Vector4(SKY.LOW * D2R, PP.SUN_R * D2R, PP.HALO_R * D2R, domeSun ? 1 : 0) },
      uResY: U.uResY || { value: 450 }, uLinePt: { value: SKY.LINE_PT },
    },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthTest: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
  mesh.name = 'pp-sky'; mesh.renderOrder = -10; mesh.frustumCulled = false;
  // the dome is at the lens's place by its own shader; the mesh is moved there too, for whoever reads its place
  const update = (time, camP) => { if (camP) mesh.position.copy(camP); };
  return { mesh, update, domeSun };
}
// ---------------------------------------------------------------------------------------------
// THE SEA (shader S5). One fan of flat water about the lens at the sea's level; everything on it is drawn in the
// fragment shader as a pure function of the WORLD'S place and the world's time, so the fan is only a window on the
// sea and no stroke is ever made, skipped or wrapped by where the lens is. Flat blue; the paler far band; white wave
// strokes (short bowed dashes that grow from nothing, slide toward the shore and draw in to nothing) on lattices
// turned to one another, every row staggered and every stroke jittered in its cell, each life of a stroke in a new
// place of its cell; the same strokes, larger, on wider lattices far out. A stroke is held between two widths in
// POINTS of the picture and its edge is one pixel wide, measured through the pixel's own footprint on the water
// (the two derivatives of the place, taken once); a lattice whose rows stand closer than a few pixels goes over
// evenly to the water's colour (no shimmer at the horizon). THE SUN'S ROAD: a stroke whose own place lies within
// SEA.ROAD degrees of the sun's bearing from the eye is the sun's yellow, and there every cell carries one.
// ---------------------------------------------------------------------------------------------
const SEA = {
  RINGS: [6, 20, 60, 160, 420, 1100, 2600, 4800], SEGS: 48,   // the fan's rings, metres from the lens
  FAR: 900,                                                   // metres out from which the water is its paler far colour
  SLIDE: 1.5, TRAVEL: -130,                                   // m/s; the heading the strokes slide on (degrees left of +Z: toward the shore and back along the coast)
  W: 0.22, PT: [2.0, 4.0], KEEP: 0.55, BEND: [0.045, 0.085],    // a stroke's width in metres, held between these points; the share of cells with a white stroke; its bow over its half length
  // THE SUN'S ROAD, degrees either side of the sun's bearing from the eye [whole within, gone at]: under the dome's sun
  // (7.5 degrees in radius) and under the opening when it is the only sun (a disc 24 m in radius at a place of the world)
  ROAD: [6, 8], ROAD_AT: [3, 4.5],
  // the lattices: [cell along the crests, cell across them, a stroke's least and greatest length (all metres),
  //   the lattice's turn against the crests (degrees), the row spacing in pixels over which it is gone (0: never),
  //   its share of KEEP]. The last three are the far water's: few white strokes, and the sun's road out to the horizon
  LAT: [[5, 5, 2.5, 4, -18.5, 0, 1], [11, 15, 5, 7.5, 18.5, 0, 1], [22, 45, 10, 15, -7, 0, 1], [45, 135, 20, 30, 11, 300, 1], [90, 405, 40, 60, 0, 300, 0.7],
    [130, 1100, 60, 90, 5, 300, 0.4], [280, 3000, 120, 190, -4, 300, 0.25]],
  SHOAL: '#1C6B94',                                           // the rare visit's shoal patch: a dark teal
};
const SEA_T = [Math.sin(SEA.TRAVEL * D2R), Math.cos(SEA.TRAVEL * D2R)], SEA_E = [SEA_T[1], -SEA_T[0]];   // the slide's unit (x, z) and the crests' own axis
const SEA_VERT = /* glsl */`
  varying vec3 vW;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SEA_STROKE = /* glsl */`
  // set once in main: the crests' frame's metres one pixel covers across (gCa) and down (gCb) the picture, the metres
  // a pixel covers along a crest and across it, the points' size in pixels, the slide so far
  vec2 gCa, gCb, gSlide; float gFx, gFy, gPt;
  vec4 ppHash(vec2 p){
    vec4 q = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099));
    q += dot(q, q.wzxy + 33.33);
    return fract((q.xxyz + q.yzzw) * q.zywx);
  }
  // 0..1: a place of the water lies under the sun as the eye sees it (the sun a direction, or a place of the world)
  float ppRoad(vec2 at){
    vec2 b = uSunAt.w > 0.5 ? uSunAt.xz - uCam.xz : uSunAt.xz, v = at - uCam.xz;
    return smoothstep(uRoad.y, uRoad.x, dot(v / max(length(v), 1e-4), b / max(length(b), 1e-4)));
  }
  // ONE CELL'S STROKE. f: the pixel in the crests' frame, metres about the cell's middle (x along the crest, y the way
  // the strokes slide); id: the cell; len: the least and greatest length; L: the cell; road: the cell's share of the
  // sun's road; fade: the lattice's size by the footprint. A stroke grows from nothing and draws in to nothing by its
  // SIZE (never by going pale): by its own life on the world's time, by the footprint, and in the sun's road.
  float ppStroke(vec2 f, vec2 id, vec2 len, vec2 L, float road, float fade, float keep){
    vec4 h = ppHash(id);
    float ph = uTime / (5. + 4. * h.z) + 7. * h.x, cyc = floor(ph); ph -= cyc;
    vec4 g = ppHash(id + 37. * cyc + 11.);                               // each life of a stroke in a new place of its cell
    float size = smoothstep(0., 0.22, ph) * (1. - smoothstep(0.72, 1., ph)) * (h.w < uDense * keep ? 1. : road) * fade;
    float hl = 0.5 * mix(len.x, len.y, g.z) * size, hs = max(hl, 1e-3), bend = mix(${f4(SEA.BEND[0])}, ${f4(SEA.BEND[1])}, g.w);
    vec2 p = f - vec2((g.x - 0.5) * 0.6 * L.x, (g.y - 0.5) * 0.4 * L.y);
    float F = p.y - bend * (hs - p.x * p.x / hs);                        // the bowed line, in metres across it
    vec2 gr = vec2(2. * bend * p.x / hs, 1.);
    float G = max(length(vec2(dot(gr, gCa), dot(gr, gCb))), 1e-6);       // F a pixel
    // half the width in pixels: held between the two points, and never over a third of the half length (a stroke that
    // is drawing in keeps a dash's shape: it grows small, it does not grow stubby)
    float hw = min(0.5 * clamp(${f4(SEA.W)} * length(gr) / G, ${f4(SEA.PT[0])} * gPt, ${f4(SEA.PT[1])} * gPt), hl / (3. * gFx));
    float d2 = (abs(p.x) - hl) / gFx;                                    // pixels beyond the stroke's end
    return clamp(hw + 0.5 - length(vec2(abs(F) / G, max(d2, 0.))), 0., 1.) * clamp(2. * hw, 0., 1.);
  }
  // ONE LATTICE. ws: the pixel's place less the slide; a1: the lattice's own row axis in the world; tr: its turn against
  // the crests (cos, sin); L: the cell; len: the strokes' lengths; gone: see SEA.LAT. Rows are staggered; the pixel's own
  // cell and its nearer neighbour along the row are read (a stroke reaches no further). road: the stroke's share of the sun's road
  float ppLattice(vec2 ws, vec2 a1, vec2 tr, vec2 L, vec2 len, float salt, float gone, float keep, out float road){
    vec2 a2 = vec2(-a1.y, a1.x), q = vec2(dot(ws, a1), dot(ws, a2));
    float row = floor(q.y / L.y), stag = L.x * fract(row * 0.6180340 + salt);
    vec2 id = vec2(floor((q.x + stag) / L.x), row), mid = (id + 0.5) * L - vec2(stag, 0.), f = q - mid;
    float side = f.x < 0. ? -1. : 1.;
    vec2 midW = mid.x * a1 + mid.y * a2 + gSlide;
    float r1 = ppRoad(midW), r2 = ppRoad(midW + side * L.x * a1);
    float rows = L.y / gFy, lpx = len.x / gFx;                           // pixels from row to row; pixels a short stroke is long
    float fade = smoothstep(4., 9., rows) * smoothstep(4., 9., lpx) * (1. - step(0.5, gone) * smoothstep(gone, 2.5 * max(gone, 1.), rows));
    vec2 fc = vec2(tr.x * f.x - tr.y * f.y, tr.y * f.x + tr.x * f.y);    // into the crests' frame
    float c1 = ppStroke(fc, id + 91. * salt, len, L, r1, fade, keep), c2 = ppStroke(fc - side * L.x * tr, id + vec2(side, 0.) + 91. * salt, len, L, r2, fade, keep);
    road = smoothstep(0.3, 0.7, c1 > c2 ? r1 : r2);
    return max(c1, c2);
  }`;
const SEA_LAT = SEA.LAT.map(([Lu, Lv, l0, l1, turn, gone, keep], i) => {
  const t = turn * D2R, c = Math.cos(t), s = Math.sin(t), a1 = [c * SEA_E[0] + s * SEA_T[0], c * SEA_E[1] + s * SEA_T[1]];
  return `c = ppLattice(ws, vec2(${f4(a1[0])}, ${f4(a1[1])}), vec2(${f4(c)}, ${f4(s)}), vec2(${f4(Lu)}, ${f4(Lv)}), vec2(${f4(l0)}, ${f4(l1)}), ${f4(0.13 + 0.17 * i)}, ${f4(gone)}, ${f4(keep)}, rd); col = mix(col, mix(uStroke, uSun, rd), c);`;
}).join('\n    ');
const SEA_FRAG = /* glsl */`
  uniform vec3 uSea, uSeaFar, uStroke, uSun, uShoalCol, uCam;
  uniform vec4 uSunAt, uShoal;       // the sun: xyz and w 1 a place of the world, w 0 a direction; the shoal: x, z, radius, 1 when it is there
  uniform vec2 uRoad;                // the cosines of the sun's road's two angles (whole within, gone at)
  uniform float uTime, uResY, uDense;
  varying vec3 vW;
  ${SEA_STROKE}
  void main(){
    vec2 w = vW.xz;
    vec2 Jx = clamp(dFdx(w), -1e4, 1e4), Jy = clamp(dFdy(w), -1e4, 1e4);   // the pixel's footprint on the water: taken once, first
    vec2 e1 = vec2(${f4(SEA_E[0])}, ${f4(SEA_E[1])}), e2 = vec2(${f4(SEA_T[0])}, ${f4(SEA_T[1])});
    gPt = max(uResY / 450., 1.);
    gCa = vec2(dot(Jx, e1), dot(Jx, e2)); gCb = vec2(dot(Jy, e1), dot(Jy, e2));
    gFx = max(length(vec2(gCa.x, gCb.x)), 1e-6); gFy = max(length(vec2(gCa.y, gCb.y)), 1e-6);
    gSlide = e2 * (${f4(SEA.SLIDE)} * uTime);
    vec2 ws = w - gSlide;
    vec2 v = w - uCam.xz; float r = length(v); vec2 vn = v / max(r, 1e-4);
    float Gr = max(length(vec2(dot(vn, Jx), dot(vn, Jy))), 1e-4);          // metres of distance a pixel covers
    vec3 col = mix(uSea, uSeaFar, clamp((r - ${f4(SEA.FAR)}) / Gr + 0.5, 0., 1.));
    // the shoal: a dark round patch whose rim sways a little on the world's time
    vec2 sv = w - uShoal.xy; float sr = length(sv); vec2 sn = sv / max(sr, 1e-4);
    float sway = 1. + 0.04 * sin(sv.x * 0.21 + uTime * 0.5) + 0.04 * sin(sv.y * 0.17 - uTime * 0.37);
    float Gs = max(length(vec2(dot(sn, Jx), dot(sn, Jy))), 1e-4);
    col = mix(col, uShoalCol, uShoal.w * (1. - clamp((sr - uShoal.z * sway) / Gs + 0.5, 0., 1.)));
    float rd = 0., c = 0.;
    ${SEA_LAT}
    gl_FragColor = vec4(col, 1.);
  }`;
export function makeSea(look, sunDir, opts = {}) {
  const U = look.U || {};
  const sd = (sunDir && sunDir.isVector3 ? sunDir.clone() : vec3(sunDir || [0.6486, 0.1392, 0.7483])).normalize();
  // the sun the water answers to: the dome's sun, a direction (the world's way); or, where opts.sunAt names one, a place of the world
  const at = opts.sunAt || null;
  const sunAt = at ? new THREE.Vector4(at.x ?? at[0], at.y ?? at[1], at.z ?? at[2], 1) : new THREE.Vector4(sd.x, sd.y, sd.z, 0);
  const share = Math.min(1, Math.max(0.6, (opts.strokes ?? 2400) / 2400));          // ctx.quality.detail thins the white strokes
  const sh = opts.shoal, shoalCol = new THREE.Color(SEA.SHOAL);
  const uTime = { value: 0 }, uCam = { value: new THREE.Vector3(0, PP.ROAD_Y0 + PP.LENS_H, 0) };
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSea: { value: vec3(look.col('sea')) }, uSeaFar: { value: vec3(look.col('seaFar')) }, uStroke: { value: vec3(look.col('stroke')) },
      uSun: { value: vec3(look.col('sun')) }, uShoalCol: { value: new THREE.Vector3(shoalCol.r, shoalCol.g, shoalCol.b) },
      uSunAt: { value: sunAt }, uShoal: { value: sh ? new THREE.Vector4(sh.x, sh.z, sh.r, 1) : new THREE.Vector4(0, 0, 1, 0) },
      uCam, uTime, uResY: U.uResY || { value: 450 }, uDense: { value: SEA.KEEP * share },
      uRoad: { value: new THREE.Vector2(Math.cos((at ? SEA.ROAD_AT : SEA.ROAD)[0] * D2R), Math.cos((at ? SEA.ROAD_AT : SEA.ROAD)[1] * D2R)) },
    },
    vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.FrontSide,
  });
  // the fan: a middle point and the rings, flat at the sea's level, its face up
  const P = [0, 0, 0], I = [], n = SEA.SEGS, R = SEA.RINGS;
  for (let k = 0; k < R.length; k++) for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI; P.push(Math.cos(a) * R[k], 0, Math.sin(a) * R[k]); }
  for (let i = 0; i < n; i++) I.push(0, 1 + (i + 1) % n, 1 + i);
  for (let k = 0; k + 1 < R.length; k++) for (let i = 0; i < n; i++) {
    const a = 1 + k * n + i, b = 1 + k * n + (i + 1) % n, c = a + n, d = b + n;
    I.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setIndex(I);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'pp-sea'; mesh.frustumCulled = false; mesh.renderOrder = -5;
  mesh.position.set(0, PP.SEA_Y, 0);
  const group = new THREE.Group(); group.name = 'pp-sea-group'; group.add(mesh);
  const update = (time, camP) => {
    uTime.value = time;
    if (camP) { uCam.value.copy(camP); mesh.position.set(camP.x, PP.SEA_Y, camP.z); }
  };
  return { group, update, sunAt };
}

// ---------------------------------------------------------------------------------------------
// THE CLOUDS (shader S7: the kit's discs, each drawn first in the line and then in its flat colour). ONE pair of draws:
//   THE DRIFTING CLOUDS  the plan's dealt lanes, each cut to its CLEAR WINDOW (plan-sea: no circle ever comes before
//                        the sun's disc as seen from the route); a cloud rides its window to and fro on the world's
//                        time at its full size (plan-sea's cloudAt is the mirror)
//   THE STANDING BANK    plan-sea's typed bank (the flank to starboard of the road in the air, the fog under it and to
//                        port); each circle swells and settles on the world's time (plan-sea's bankAt is the mirror)
//   THE BANK'S WATERLINE the level circle on the sea under every circle of the bank that can reach it (makeFoot below)
// Every number in the vertex text is the plan's; nothing reads the lens but the discs' own turning to the eye and the
// hold of a shaded row CLOUD.UNDER m behind its place along the eye's own ray (the line's device: white lies over it whole).
// ---------------------------------------------------------------------------------------------
const CLOUD = { LINE: lineOf(40), BACK: 25, BACK_SHARE: 0.12, BACK_DRIFT: 80, COL: { A: 'stroke', B: 'stroke', C: 'stroke', D: 'pelicanShade', E: 'stroke', fog: 'stroke', far: 'stroke', high: 'stroke', shade: 'pelicanShade' }, UNDER: { D: 14 } };
const CLOUD_MOVE = /* glsl */`
  if (iO.z < 0.5) {                                                    // a drifting cloud's circle: along its window, about the cloud's middle
    float w = max(iL.z, 1.);
    c.xz += iL.xy * (w * (0.5 - 0.5 * cos(uTime * ${f4(2 * SKYLAW.SPEED)} / w + 6.2831853 * iL.w)) + iO.x); c.y += iO.y;
  } else {                                                             // a circle of the standing bank: it swells and settles
    float o2 = fract(iO.w * 7.3 + 0.19), sw = 1. - iO.x;               // (iO.x: the share of the swell a circle of THE BED leaves out; the old rows 0)
    c.y += ${f4(BANK.SW_Y)} * sw * r * sin(uTime * 6.2831853 / mix(${f4(BANK.PER_Y[0])}, ${f4(BANK.PER_Y[1])}, o2) + 6.2831853 * o2);
    r *= 1. + ${f4(BANK.SW_R)} * sw * sin(uTime * 6.2831853 / mix(${f4(BANK.PER_R[0])}, ${f4(BANK.PER_R[1])}, iO.w) + 6.2831853 * iO.w);
    if (iL.w > 0.) {                                                   // a shaded row: held iL.w m further off at the same size on the picture (as the line is), so white lies over it whole
      vec3 tc = c - cameraPosition; float l0 = max(length(tc), 1e-4); c += tc / l0 * iL.w; r *= (l0 + iL.w) / l0;
    }
  }`;
// THE BANK'S WATERLINE (plan-changes 53; plan-sea's bankFoot, footAt). Under every circle of the bank that can reach
// the sea lies ITS OWN LEVEL CIRCLE on the water: the true cut of the ball the circle stands for, sqrt(r x r - h x h)
// about its middle, by the same swell (CLOUD_MOVE's own text, so a shaded row's hold is carried too). The disc turned
// to the eye meets the water in a chord of that circle from wherever it is seen, so the bank's foot is a row of round
// lobes and no straight cut shows. Two draws of one instanced quad laid FLAT: the line first (FOOT.LIFT[0] over the
// sea; wider across the eye's bearing by the one line's held width, and along it by the width held at the rim's
// nearest point over the sine of the eye's height there, so the line is as wide on the picture round the lobe's own
// outline), then the fill (a shaded row's under the white). Nothing reads the lens but the line's width and that
// bearing (optics of the drawing, as the line's own width is); a circle clear of the water has radius 0 and draws nothing.
function makeFoot(look, feet) {
  const n = feet.length, iP = new Float32Array(n * 4), iC = new Float32Array(n * 4), iL = new Float32Array(n * 4), iO = new Float32Array(n * 4), g = new THREE.InstancedBufferGeometry();
  feet.forEach((c, i) => {
    const col = look.col(CLOUD.COL[c.row] || 'stroke'), under = CLOUD.UNDER[c.row] || 0;
    iP.set([c.x, c.y, c.z, c.r], i * 4); iC.set([col[0], col[1], col[2], FOOT.LIFT[under > 0 ? 1 : 2]], i * 4); iL.set([0, 0, 1, under], i * 4); iO.set([1 - (c.sw ?? 1), 0, 1, c.own], i * 4);
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  for (const [name, a] of [['iP', iP], ['iC', iC], ['iL', iL], ['iO', iO]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(a, 4));
  g.instanceCount = n;
  const mat = (ring) => new THREE.ShaderMaterial({
    uniforms: { ...look.U, uRing: { value: ring } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iP, iC, iL, iO;
      ${PP_GLSL}
      uniform float uRing;
      varying vec2 vUv; varying vec3 vCol;
      void main(){
        vec3 c = iP.xyz; float r = iP.w;
        ${CLOUD_MOVE}
        float h = c.y - ${f4(PP.SEA_Y)}, w = sqrt(max(r * r - h * h, 0.));          // the ball's own cut with the water
        vec3 f = vec3(c.x, ${f4(PP.SEA_Y)} + iC.w, c.z), te = f - cameraPosition;
        float hl = length(te.xz);
        vec2 u = hl > 1e-4 ? te.xz / hl : vec2(1., 0.), rad = vec2(w);              // the plan's unit away from the eye
        vCol = iC.rgb;
        if (uRing > 0. && w > 0.) {
          vec2 l = ppLine(uRing, ppPixel(projectionMatrix * viewMatrix * vec4(f, 1.)));
          // the rim's nearest point to the eye (the lobe's own outline on the picture): the line is held by the pixel THERE
          vec3 nr = f - vec3(u.x, 0., u.y) * min(w, 0.8 * hl), tn = nr - cameraPosition;
          vec2 ln = ppLine(uRing, ppPixel(projectionMatrix * viewMatrix * vec4(nr, 1.)));
          float k = 0.75 / max(uLine.x, 0.75), se = clamp(abs(tn.y) / max(length(tn), 1e-4), 0.12, 1.);
          rad = vec2(w + ln.x * mix(k, 1., ln.y) / se, w + l.x * mix(k, 1., l.y));
          vCol = mix(iC.rgb, uInk, l.y); f.y = ${f4(PP.SEA_Y + FOOT.LIFT[0])};
        }
        vUv = position.xy;
        vec2 q = u * (position.x * rad.x) + vec2(-u.y, u.x) * (position.y * rad.y);
        gl_Position = projectionMatrix * viewMatrix * vec4(f.x + q.x, f.y, f.z + q.y, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      void main(){ float d = dot(vUv, vUv); gl_FragColor = vec4(vCol, 1.); if (d > 1.) discard; }`,
  });
  const group = new THREE.Group(); group.name = 'pp-bank-foot';
  const ink = new THREE.Mesh(g, mat(CLOUD.LINE)); ink.frustumCulled = false; ink.name = 'pp-bank-foot-line'; ink.renderOrder = -1; group.add(ink);
  const fill = new THREE.Mesh(g, mat(0)); fill.frustumCulled = false; fill.name = 'pp-bank-foot-fill'; group.add(fill);
  return group;
}
// THE BANK LAID IN STEPS (the gate after the preview's mends): the typed bed, the bank and its waterline are worked out
// once a road and kept on it (plan-sea); the world runs this before makeClouds and hands back between the goes, so that
// no step of the build holds the bed's places AND the clouds' windows AND the discs. No die, no place, no pixel differs.
export function* bankSteps(look) { const road = seaRoad(look); yield* bedGoes(road); yield; seaBank(road); bankFoot(road); }
export function makeClouds(look, dealt, opts = {}) {
  const road = seaRoad(look), detail = opts.detail ?? 1, group = new THREE.Group(); let circles = 0, calls = 0;
  const lay = (list, iL, iO, back, name, backShare = 0) => {
    if (!list.length) return;
    group.add(makeDiscs(list, look, { ring: CLOUD.LINE, back, backShare, name, vertexPre: 'attribute vec4 iL, iO;', vertexMove: CLOUD_MOVE, attributes: { iL: { array: iL, size: 4 }, iO: { array: iO, size: 4 } } }));
    circles += list.length; calls += 2;
  };
  // the drifting clouds: their own two draws, the line held far enough back that a cloud near the lens is one shape
  const win = clearLanes((dealt && dealt.lanes) || [], road), list = [], iL = [], iO = [];
  for (const lane of win.lanes) {
    const ux = (lane.b[0] - lane.a[0]) / CLOUDS.LEN, uz = (lane.b[2] - lane.a[2]) / CLOUDS.LEN;
    lane.circles.forEach((q, j) => {
      const side = cloudSide(lane, j);                                 // its place across the lane (plan-sea's law)
      list.push({ p: [lane.a[0] + ux * lane.t0 + uz * side, lane.y, lane.a[2] + uz * lane.t0 - ux * side], r: q.r, col: 'stroke' });
      iL.push(ux, uz, lane.t1 - lane.t0, lane.phase); iO.push(q.along, q.up, 0, 0);
    });
  }
  lay(list, iL, iO, CLOUD.BACK_DRIFT, 'pp-clouds');
  // the standing bank (opts.detail under 1 thins its fog and its far row, never the flank beside the road in the air)
  const bank = seaBank(road).filter((c) => detail >= 1 || !(c.row === 'fog' || c.row === 'far') || c.own < 0.4 + 0.6 * detail), bl = [], bL = [], bO = [];
  for (const c of bank) { bl.push({ p: [c.x, c.y, c.z], r: c.r, col: CLOUD.COL[c.row] || 'stroke' }); bL.push(0, 0, 1, CLOUD.UNDER[c.row] || 0); bO.push(1 - (c.sw ?? 1), 0, 1, c.own); }
  lay(bl, bL, bO, CLOUD.BACK, 'pp-bank', CLOUD.BACK_SHARE);
  // the bank's waterline: the level circle under every circle of the bank that can reach the sea (the same thinning)
  const reach = new Set(bankFoot(road)), feet = bank.filter((c) => reach.has(c));
  if (feet.length) { group.add(makeFoot(look, feet)); circles += feet.length; calls += 2; }
  group.name = 'pp-sky-clouds';
  // the world's time is the look's own shared uniform (the world sets it every frame): update has nothing to copy
  return { group, update() {}, counts: { lanes: win.lanes.length, leftOut: win.leftOut + ((dealt && dealt.leftOut) || 0), circles, bank: bank.length, feet: feet.length, triangles: circles * 4, calls } };
}

// ---------------------------------------------------------------------------------------------
// THE SEA PELICAN (the kinds' ruling: the brown pelican in breeding dress; the flat look): a grey-brown body, wings
// and tail, a white neck and head with a straw crown and a chestnut nape, a long pale bill over a red pouch, dark
// hands to the wings. Modelled at its size in this world (5.6 m across the wings, 3.3 m long), +Z ahead, +Y up, +X to
// port, its middle at the origin. Parts 20 (the body), 21 (a wing's arm) and 22 (its hand) are moved here.
//   open     wings spread: 410 triangles with its lines (the gliders and the nine); userData.lo the same bird in
//            228 (the divers, who are never near)
//   folded   on the water or standing: wings shut along the body, the neck up, the bill on the breast, legs under it
//            (hidden under the water where it sits, standing where it roosts)
// ---------------------------------------------------------------------------------------------
const BIRD = { W: 0.065, SH: [0.36, 0.14, 0.25], WR: [1.45, 0.20], TIP: 2.8, SWEEP: 0.7, LEGS: ROOST.LEGS };
BIRD.FOLD = (NINE_LAW.FOLDED - BIRD.SH[0]) / (BIRD.TIP - BIRD.SH[0]);       // the folded wing's share of its reach: the plan's half span folded
const P3 = (x, y, z) => new THREE.Vector3(x, y, z), AX_X = P3(1, 0, 0), AX_Z = P3(0, 0, 1);
function layOpen(B, look, lo) {
  const c = (k) => look.col(k), W = BIRD.W, S = BIRD.SH, wr = BIRD.WR, o = { part: 20 };
  ball(B, P3(0, 0, 0), [0.42, 0.98, 0.36], { ...o, axis: AX_Z, side: AX_X, nseg: lo ? 5 : 7, nring: lo ? 3 : 4, col: c('brownBack'), line: W });
  if (lo) tube(B, [P3(0, 0.10, 0.64), P3(0, 0.34, 1.16)], [0.24, 0.21], { ...o, nseg: 4, col: c('brownHead'), line: W });
  else tube(B, [P3(0, 0.08, 0.6), P3(0, 0.28, 0.98), P3(0, 0.36, 1.2)], [0.25, 0.19, 0.21], { ...o, nseg: 5, col: c('brownHead'), line: W });
  tube(B, [P3(0, 0.30, 1.3), P3(0, 0.12, 2.3)], [0.10, 0.05], { ...o, nseg: lo ? 3 : 4, col: c('straw'), line: lo ? 0 : W, cap0: false });
  if (!lo) {
    tube(B, [P3(0, 0.30, 0.62), P3(0, 0.45, 0.98)], [0.12, 0.10], { ...o, nseg: 3, flat: 0.6, col: c('brownNape'), line: 0 });
    ball(B, P3(0, 0.50, 1.2), [0.14, 0.07, 0.16], { ...o, nseg: 4, nring: 2, col: c('brownCrown'), line: 0 });
    tube(B, [P3(0, 0.16, 1.32), P3(0, 0.0, 1.75), P3(0, 0.05, 2.15)], [0.08, 0.12, 0.03], { ...o, nseg: 4, flat: 0.6, col: c('brownPouch'), line: 0, cap0: false });
  }
  tube(B, [P3(0, 0.02, -0.8), P3(0, 0, -1.3)], [0.26, 0.36], { ...o, nseg: lo ? 3 : 4, flat: 0.14, col: c('brownBack'), line: lo ? 0 : W, cap0: false });
  for (const s of [1, -1]) {
    const wing = { nseg: 4, flat: 0.1, side: AX_Z, line: W, cap0: false };
    tube(B, [P3(s * S[0], S[1], S[2]), P3(s * wr[0], wr[1], 0.32)], [0.5, 0.45], { ...wing, part: 21, col: c('brownBack'), cap1: false });
    tube(B, [P3(s * wr[0], wr[1], 0.32), P3(s * 2.72, 0.14, 0.05)], [0.45, 0.2], { ...wing, part: 22, col: c('wingTip'), round: 0.4 });
  }
}
function layFolded(B, look) {
  const c = (k) => look.col(k), W = BIRD.W, o = { part: 20 };
  ball(B, P3(0, 0.40, 0), [0.50, 0.95, 0.46], { ...o, axis: AX_Z, side: AX_X, nseg: 6, nring: 4, col: c('brownBack'), line: W });
  for (const s of [1, -1]) ball(B, P3(s * 0.44, 0.52, -0.12), [0.10, 0.82, 0.34], { ...o, axis: AX_Z, side: AX_X, nseg: 4, nring: 2, col: c('brownBack'), line: W });
  tube(B, [P3(0, 0.62, 0.62), P3(0, 1.25, 0.80), P3(0, 1.72, 0.66)], [0.24, 0.16, 0.21], { ...o, nseg: 5, col: c('brownHead'), line: W });
  tube(B, [P3(0, 0.80, 0.46), P3(0, 1.62, 0.50)], [0.12, 0.10], { ...o, nseg: 3, col: c('brownNape'), line: 0, cap0: false, cap1: false });
  ball(B, P3(0, 1.90, 0.66), [0.15, 0.07, 0.17], { ...o, nseg: 4, nring: 2, col: c('brownCrown'), line: 0 });
  tube(B, [P3(0, 1.66, 0.82), P3(0, 0.80, 1.22)], [0.10, 0.045], { ...o, nseg: 4, col: c('straw'), line: W, cap0: false });
  tube(B, [P3(0, 1.50, 0.80), P3(0, 0.92, 1.06)], [0.12, 0.04], { ...o, nseg: 4, flat: 0.6, col: c('brownPouch'), line: 0, cap0: false });
  tube(B, [P3(0, 0.42, -0.85), P3(0, 0.46, -1.25)], [0.24, 0.3], { ...o, nseg: 4, flat: 0.16, col: c('wingTip'), line: 0, cap0: false });
  for (const s of [1, -1]) stroke(B, [P3(s * 0.2, 0.1, -0.05), P3(s * 0.2, -BIRD.LEGS, -0.05)], 0.05, { ...o });
}
export async function seaPelicanGeometry(look, Y, opts = {}) {
  const B = makeBuilder();
  if (opts.folded) layFolded(B, look); else layOpen(B, look, false);
  const g = await finish(B, Y);
  if (!opts.folded) { const L = makeBuilder(); layOpen(L, look, true); g.userData.lo = await finish(L, Y); }
  g.userData.folded = !!opts.folded;
  return g;
}
// one instanced mesh of a bird (or a boat): the model's own arrays shared, the rows as iA and iB (and more by name)
function flock(src, rows, material, name, more) {
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex(src.index); for (const k of Object.keys(src.attributes)) g.setAttribute(k, src.attributes[k]);
  setInstances(g, rows);
  for (const [k, a] of Object.entries(more || {})) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(a), 4));
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = name;
  mesh.userData.triangles = (src.userData.triangles || 0) * rows.length;
  return mesh;
}

// THE BIRD'S OWN GLSL (every flying maker's vertexPre begins with it):
//   sbWing   the wings in the bird's own frame: `a` the arm's lift about the shoulder, `b` the hand's own about the
//            wrist (it lags the arm), `f` 0..1 folded (drawn in to the plan's folded half span and swept back)
//   sbPlace  the bird's frame to the world: at P, flying along the unit F, level across U (the sky's up; a stooping
//            bird hands in a U leant along its course so that the cross never fails), rolled about F
//   sbBeat   three slow beats and then a long glide, by a phase 0..1: -> (the arm's lift, the hand's)
const BIRD_GLSL = /* glsl */`
  void sbWing(inout vec3 p, inout vec3 n, float part, float a, float b, float f){
    if (part > 20.5) {
      float sx = p.x < 0. ? -1. : 1.; vec3 q = vec3(abs(p.x), p.y, p.z), m = vec3(n.x * sx, n.y, n.z);
      vec2 wr = vec2(${f4(BIRD.WR[0])}, ${f4(BIRD.WR[1])}), sh = vec2(${f4(BIRD.SH[0])}, ${f4(BIRD.SH[1])});
      if (part > 21.5) { q.xy = ppRot2(q.xy - wr, b) + wr; m.xy = ppRot2(m.xy, b); }
      q.xy = ppRot2(q.xy - sh, a) + sh; m.xy = ppRot2(m.xy, a);
      float k = q.x - sh.x; q.x = sh.x + k * mix(1., ${f4(BIRD.FOLD)}, f); q.z -= f * k * ${f4(BIRD.SWEEP)};
      p = vec3(q.x * sx, q.y, q.z); n = vec3(m.x * sx, m.y, m.z);
    }
  }
  void sbPlace(inout vec3 p, inout vec3 n, vec3 P, vec3 F, vec3 U, float roll){
    vec3 X = cross(U, F); X = X / max(length(X), 1e-4); vec3 Y = cross(F, X);
    float c = cos(roll), s = sin(roll); vec3 X2 = X * c + Y * s, Y2 = Y * c - X * s;
    p = P + X2 * p.x + Y2 * p.y + F * p.z; n = X2 * n.x + Y2 * n.y + F * n.z;
  }
  vec2 sbBeat(float ph){
    float w = ph / ${f4(GLIDE.BEAT_SHARE)}, env = smoothstep(0., 0.12, w) * (1. - smoothstep(0.88, 1., w)), a = 6.2831853 * ${f4(GLIDE.BEATS)} * w;
    return vec2(${f4(GLIDE.DIHEDRAL)} + ${f4(GLIDE.FLAP)} * sin(a) * env, ${f4(GLIDE.TIP)} * sin(a - 1.1) * env);
  }
`;

// ---------------------------------------------------------------------------------------------
// THE GLIDERS: fifty-four birds in single file on plan-sea's seven typed lines (the world's deal leaves the lines to
// this part: `courses` is taken only if it brings lines of its own). One instanced mesh; a bird's place is its line's
// closed course read at  fract(time * speed / length + its own share)  (plan-sea's gliderU and courseAt are the
// mirror), it heads along the course, banks into its turns by the course's own bend, and beats its wings three times
// and glides, each bird a little after the one ahead.
//   iA: the line's first point in uCourse, its number of points, the bird's share of the loop, loops a second
//   iB: the wingbeat's own phase, metres a second
// ---------------------------------------------------------------------------------------------
const GLIDER_MOVE = /* glsl */`
  {
    float cn = iA.y, cu = fract(uTime * iA.w + iA.z) * cn, ci = floor(cu), t = cu - ci, t2 = t * t, t3 = t2 * t;
    vec3 c0 = uCourse[int(iA.x + mod(ci, cn) + 0.5)], c1 = uCourse[int(iA.x + mod(ci + 1., cn) + 0.5)];
    vec3 c2 = uCourse[int(iA.x + mod(ci + 2., cn) + 0.5)], c3 = uCourse[int(iA.x + mod(ci + 3., cn) + 0.5)];
    vec3 P = ((1. - 3. * t + 3. * t2 - t3) * c0 + (4. - 6. * t2 + 3. * t3) * c1 + (1. + 3. * t + 3. * t2 - 3. * t3) * c2 + t3 * c3) / 6.;
    vec3 T = 0.5 * (-(1. - t) * (1. - t) * c0 + (3. * t2 - 4. * t) * c1 + (-3. * t2 + 2. * t + 1.) * c2 + t2 * c3);
    vec3 A = (1. - t) * c0 + (3. * t - 2.) * c1 + (1. - 3. * t) * c2 + t * c3;
    float tl = max(length(T), 1e-4), bend = (T.z * A.x - T.x * A.z) / (tl * tl * tl);
    vec2 bt = sbBeat(fract(uTime / ${f4(GLIDE.FLAP_T)} + iB.x));
    sbWing(p, n, part, bt.x, bt.y, 0.);
    sbPlace(p, n, P, T / tl, vec3(0., 1., 0.), -clamp(atan(iB.y * iB.y * bend / 9.81), -0.9, 0.9));
  }`;
export function makeGliders(look, geometry, courses) {
  if (!geometry) return null;
  const road = seaRoad(look), lines = courses && courses.length ? courses : gliderLines(road), pts = [], rows = [];
  lines.forEach((c, li) => {
    const base = pts.length, len = c.len || courseLength(c), speed = c.speed || GLIDE.SPEED, n = c.n || 8, gap = c.gap || GLIDE.GAP / len;
    for (const p of c.pts) pts.push(new THREE.Vector3(p[0], p[1], p[2]));
    for (let k = 0; k < n; k++) rows.push([base, c.pts.length, (c.at || 0) - k * gap, speed / len, li * 0.23 + k * 0.09, speed, 0, 0]);
  });
  linePlaces(road);                                                   // the lines' places by cells, made here once (the divers' keeping law reads them in the next step)
  const mat = flatMaterial(look.U, {}, { vertexPre: `uniform vec3 uCourse[${pts.length}];\n` + BIRD_GLSL, vertexMove: GLIDER_MOVE, uniforms: { uCourse: { value: pts } } });
  return flock(geometry, rows, mat, 'pp-gliders');
}

// ---------------------------------------------------------------------------------------------
// THE NINE of the harbour: the plan's ninePlace written again in GLSL (and plan-sea's nineLift: leaving the ring a bird
// climbs over the plan's course and slants down to it, so that no two of them meet), a function of the metres flown (uD) and of the
// typed numbers of nineCourse and of nothing else (the wingbeat too goes by the metres). One instanced mesh.
//   iA: the glide's third point (x, z), the tip point (x, z)     iB: the strike (x, z), the cork (x, z)
//   iC: the metres flown at which it is AHEAD m short of its strike, the tip's height, its own phase
// The heading is the course's own (read 2 m of flight behind and ahead); under the water (where the model is drawn in
// to nothing) it comes round to the stoop's bearing in plan, which it keeps where it sits.
// ---------------------------------------------------------------------------------------------
const N9 = NINE_LAW;
const NINE_GLSL = /* glsl */`
  uniform vec4 uRing, uG01;
  attribute vec4 iC;
  vec4 nineAt(float q, vec4 gt, vec4 sc, float tipY){
    vec3 P; float f = 0.;
    if (q < ${f4(N9.Q_GLIDE)}) {
      float a = 1.5707963 + (q - ${f4(N9.Q_GLIDE)}) / ${f4(N9.RING_RUN)}, co = cos(a) * ${f4(N9.RING_R)}, si = sin(a) * ${f4(N9.RING_R * N9.RING_HAND)};
      P = vec3(uRing.x + co * uRing.z + si * uRing.w, ${f4(N9.RING_Y)}, uRing.y + co * uRing.w - si * uRing.z);
    } else if (q < ${f4(N9.Q_TIP)}) {
      float e = (q - ${f4(N9.Q_GLIDE)}) / ${f4(N9.Q_TIP - N9.Q_GLIDE)}, m = 1. - e;
      vec2 g = m * m * m * uG01.xy + 3. * m * m * e * uG01.zw + 3. * m * e * e * gt.xy + e * e * e * gt.zw;
      P = vec3(g.x, mix(${f4(N9.RING_Y)}, tipY, e * e * (3. - 2. * e)), g.y);
    } else if (q < 0.) {
      float t = (q - ${f4(N9.Q_TIP)}) / ${f4(-N9.Q_TIP)}, run = max(length(sc.xy - gt.zw), 1e-6);
      float a = clamp(${f4(3 * N9.ARM / (N9.Q_TIP - N9.Q_GLIDE) * -N9.Q_TIP)} / run, 0., 1.), g = a * t + (1. - a) * t * t;
      vec2 xz = mix(gt.zw, sc.xy, g); P = vec3(xz.x, tipY * (1. - t * t), xz.y); f = clamp(t * 2., 0., 1.);
    } else if (q < ${f4(N9.Q_UP)}) {
      float t = q / ${f4(N9.Q_UP)}, g = t * t * (3. - 2. * t); vec2 xz = mix(sc.xy, sc.zw, g);
      P = vec3(xz.x, ${f4(-N9.DEEP)} * smoothstep(0., 3., q) * (1. - smoothstep(${f4(N9.Q_UP - 6)}, ${f4(N9.Q_UP)}, q)), xz.y); f = 1.;
    } else {
      float u = q - ${f4(N9.Q_UP)};
      P = vec3(sc.z, 0.3 + 0.9 * exp(-u / 6.) * sin(u / 2.2) - 0.3 * exp(-u / 4.), sc.w); f = 1.;
    }
    P.y += ${f4(NINE_SEA.LIFT)} * clamp(min((q - ${f4(NINE_SEA.Q[0])}) / ${f4(NINE_SEA.Q[1] - NINE_SEA.Q[0])}, (${f4(NINE_SEA.Q[2])} - q) / ${f4(NINE_SEA.Q[2] - NINE_SEA.Q[1])}), 0., 1.);   // plan-sea's nineLift
    return vec4(P, f);
  }
`;
// the same lines for both stooping kinds: from three places a, b, c of the course (b the bird's own) and the stoop's
// bearing in plan `hs`: `st` 0..1 the stoop (the cross leans along it), `sit` 0..1 under and sitting (the heading comes
// round to hs and lies level), `beat` the wingbeat's phase
const STOOP_PLACE = /* glsl */`
    vec3 d1 = b.xyz - a.xyz, d2 = c.xyz - b.xyz, hs3 = vec3(hs.x, 0., hs.y);
    vec3 F = (c.xyz - a.xyz) * (1. - sit) + hs3 * (sit * 4. + 1e-3); F = F / max(length(F), 1e-5);
    float l1 = max(length(d1), 1e-3), bend = (d1.z * d2.x - d1.x * d2.z) / (l1 * l1 * max(length(d2), 1e-3));   // the course's bend, 1 / m
    vec2 bt = sbBeat(beat) * (1. - b.w);
    sbWing(p, n, part, bt.x, bt.y, b.w);
    p *= step(-1.2, b.y);                                              // under the surface nothing of it is drawn
    sbPlace(p, n, b.xyz, F, vec3(0., 1., 0.) + 2. * st * (1. - sit) * hs3, -clamp(atan(bend * 20.), -0.8, 0.8) * (1. - st));`;
const NINE_MOVE = /* glsl */`
  {
    float q = uD - iC.x;
    vec4 a = nineAt(q - 2., iA, iB, iC.y), b = nineAt(q, iA, iB, iC.y), c = nineAt(q + 2., iA, iB, iC.y);
    vec2 hs = iB.xy - iA.zw; hs = hs / max(length(hs), 1e-4);
    float st = smoothstep(${f4(N9.Q_TIP - 4)}, ${f4(N9.Q_TIP + 6)}, q), sit = smoothstep(4., 10., q), beat = fract(q / 70. + iC.z);
    ${STOOP_PLACE}
  }`;
export function makeNine(look, geometry, table) {
  if (!geometry || !table || !table.length) return null;
  const rows = [], iC = [], c0 = table[0];
  table.forEach((c, i) => {
    rows.push([c.glide[2][0], c.glide[2][1], c.tip[0], c.tip[1], c.strike[0], c.strike[1], c.cork[0], c.cork[1]]);
    iC.push(c.di - N9.AHEAD, c.tipY, (i * 0.37) % 1, 0);
  });
  const uniforms = { uRing: { value: new THREE.Vector4(c0.ring.x, c0.ring.z, c0.ring.tx, c0.ring.tz) }, uG01: { value: new THREE.Vector4(c0.glide[0][0], c0.glide[0][1], c0.glide[1][0], c0.glide[1][1]) } };
  const mat = flatMaterial(look.U, {}, { vertexPre: NINE_GLSL + BIRD_GLSL, vertexMove: NINE_MOVE, uniforms });
  return flock(geometry, rows, mat, 'pp-nine', { iC });
}

// ---------------------------------------------------------------------------------------------
// THE DIVERS (the ambient ones, and the rare run's by the same maker): plan-sea's diverPlace written again in GLSL, on
// the world's time. One instanced mesh of the light model.
//   iA: the strike (x, z), the cork (x, z)     iB: the ring's middle (x, z), its radius, its height
//   iC: the cycle's seconds, its phase, the hand, the wingbeat's own phase
// ---------------------------------------------------------------------------------------------
const DIVER_GLSL = /* glsl */`
  attribute vec4 iC;
  vec4 diverAt(float u, vec4 sk, vec4 rg, float hand){
    float R = rg.z, H = rg.w, a1 = atan(sk.y - rg.y, sk.x - rg.x), a0 = a1 - hand * ${f4(DIVE.TURN)}; vec3 P; float f = 0.;
    u = fract(u);
    if (u < ${f4(DIVE.CIRCLE)}) {
      float a = a0 + hand * ${f4(DIVE.TURN)} * (u / ${f4(DIVE.CIRCLE)}); P = vec3(rg.x + R * cos(a), H, rg.y + R * sin(a));
    } else if (u < ${f4(DIVE.STRIKE)}) {
      float t = (u - ${f4(DIVE.CIRCLE)}) / ${f4(DIVE.STRIKE - DIVE.CIRCLE)}, g = 0.35 * t + 0.65 * t * t;
      vec2 xz = mix(rg.xy + R * vec2(cos(a1), sin(a1)), sk.xy, g); P = vec3(xz.x, H * (1. - t * t), xz.y); f = clamp(t * 2., 0., 1.);
    } else if (u < ${f4(DIVE.UP)}) {
      float t = (u - ${f4(DIVE.STRIKE)}) / ${f4(DIVE.UP - DIVE.STRIKE)}, g = t * t * (3. - 2. * t); vec2 xz = mix(sk.xy, sk.zw, g);
      P = vec3(xz.x, ${f4(-DIVE.DEEP)} * smoothstep(0., 0.15, t) * (1. - smoothstep(0.85, 1., t)), xz.y); f = 1.;
    } else if (u < ${f4(DIVE.SIT)}) {
      float t = (u - ${f4(DIVE.UP)}) / ${f4(DIVE.SIT - DIVE.UP)}; P = vec3(sk.z, 0.3 + 0.6 * sin(3.14159265 * t) * (1. - t), sk.w); f = 1.;
    } else {
      float t = (u - ${f4(DIVE.SIT)}) / ${f4(1 - DIVE.SIT)}; vec2 xz = mix(sk.zw, rg.xy + R * vec2(cos(a0), sin(a0)), t);
      P = vec3(xz.x, mix(0.3, H, t * t * (3. - 2. * t)), xz.y); f = 1. - clamp(t * 4., 0., 1.);
    }
    return vec4(P, f);
  }
`;
const DIVER_MOVE = /* glsl */`
  {
    float u = fract(uTime / iC.x + iC.y), du = 0.22 / iC.x;
    vec4 a = diverAt(u - du, iA, iB, iC.z), b = diverAt(u, iA, iB, iC.z), c = diverAt(u + du, iA, iB, iC.z);
    // the stoop's bearing in plan, and the bearing of the run it takes off on (from the cork to its ring's first place)
    float a1 = atan(iA.y - iB.y, iA.x - iB.x), a0 = a1 - iC.z * ${f4(DIVE.TURN)};
    vec2 run = iB.xy + iB.z * vec2(cos(a0), sin(a0)) - iA.zw; run = run / max(length(run), 1e-4);
    float under = step(${f4(DIVE.STRIKE + 0.02)}, u) * step(u, ${f4(DIVE.SIT)});
    float st = smoothstep(${f4(DIVE.CIRCLE)}, ${f4(DIVE.CIRCLE + 0.05)}, u) * step(u, ${f4(DIVE.STRIKE + 0.02)}), sit = under, beat = fract(uTime / 2.6 + iC.w);
    vec2 hs = mix(vec2(cos(a1), sin(a1)), run, under);
    ${STOOP_PLACE}
  }`;
// THE KEPT ROWS of a deal of divers, for the birds' maker and the splashes' alike (so a bird and its splash are kept or
// left out together): the rows clear of the gliders' lines (plan-sea's keepDivers), less every row whose cycle comes
// within KEEP.BOAT m of one of `boats` (the rare visit's boats beyond the eight typed ones: plan-sea's diverKeeps).
// A law of places, done once in the build. -> [[row, its number among the rows clear of the lines], ...]
function keptDivers(look, rows, boats) {
  const road = seaRoad(look), keep = keepDivers(rows, road), out = [];
  keep.rows.forEach((r, i) => { if (!boats || !boats.length || diverKeeps(r, road, boats)) out.push([r, i]); });
  out.leftOut = keep.leftOut + keep.rows.length - out.length;
  return out;
}
export function makeDivers(look, geometry, rows, opts = {}) {
  if (!geometry || !rows || !rows.length) return null;
  const src = geometry.userData.lo || geometry, list = [], iC = [], kept = keptDivers(look, rows, opts.boats);
  for (const [r, i] of kept) {
    list.push([r.strike[0], r.strike[1], r.cork[0], r.cork[1], r.ring[0], r.ring[1], r.ringR, r.ringY]);
    iC.push(r.per, r.phase, r.hand, (i * 0.6180339) % 1);
  }
  const mat = flatMaterial(look.U, {}, { vertexPre: DIVER_GLSL + BIRD_GLSL, vertexMove: DIVER_MOVE });
  if (!list.length) return null;
  const mesh = flock(src, list, mat, 'pp-divers', { iC }); mesh.userData.leftOut = kept.leftOut;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE SPLASHES (plan-changes pb 5; the lead's P6: no ink-outlined whole circle lies on the water). Every strike has
//   A CROWN   DIVE.CROWN tongues of white water standing round the strike, each a pointed leaf with the one line
//             round it, leaning outward; they rise fast and fall back, their feet running out a little
//   DROPS     small tears thrown up and out, each pointed behind along its own flight, drawn in to nothing
//             before they come down to the water
//   FOAM      a ring that runs out over the water and is gone, drawn as DIVE.FOAM white dashes with gaps between
//             them, no line: a broken line, never a whole circle
// all of it inside the plan's splash radius about the strike (3 m for a diver, 5 m for one of the nine: plan-sea's
// splashReach, counted). ONE draw of one instanced quad a group: a tongue is turned to the eye about its own
// leaning axis, a drop faces the eye, a dash lies flat on the water (nothing else reads the lens but the line's width).
//   rows of divers        on the world's time: from the row's own strike for DIVE.SPLASH_T seconds
//   opts.byD (the nine)   by the metres flown: from the bird's strike on, sunk back DIVE.NINE_Q metres later
//   iP: the strike (x, z)   iL: (the cycle's seconds, its phase | the metres flown at the strike, 0), the part's number, the splash's own number
// ---------------------------------------------------------------------------------------------
const SPLASH_VERT = (byD, drops, tall, out, plume, reach) => /* glsl */`
  attribute vec4 iP, iL;
  ${PP_GLSL}
  uniform vec3 uSurf;
  varying vec2 vUv; varying vec3 vInk; varying vec2 vK;
  void main(){
    float tau = ${byD ? `(uD - iL.x) / ${f4(DIVE.NINE_Q)}` : `(fract(uTime / iL.x + iL.y) - ${f4(DIVE.STRIKE)}) * iL.x / ${f4(DIVE.SPLASH_T)}`};
    float on = step(0., tau) * step(tau, 1.), k = iL.z, own = iL.w; tau = clamp(tau, 0., 1.);
    vec3 c = vec3(iP.x, ${f4(PP.SEA_Y)}, iP.y), ax = vec3(0., 1., 0.), sd = vec3(1., 0., 0.); float hw = 0., hh = 0., kind = 0., lineOn = 1.;
    if (k < ${f4(DIVE.CROWN - 0.5)}) {                                 // a tongue of the crown
      float a = 6.2831853 * (own + k / ${f4(DIVE.CROWN)}), j = fract(k * 0.618 + own * 3.7), t6 = pow(max(tau, 1e-4), 0.55);
      vec2 d2 = vec2(cos(a), sin(a));
      hh = ${f4(0.5 * DIVE.CROWN_TALL * plume)} * (0.6 + 0.4 * j) * sin(3.14159265 * t6) * on;
      hw = ${f4(0.5 * DIVE.CROWN_W * plume)} * (0.7 + 0.3 * j) * smoothstep(0., 0.25, sin(3.14159265 * t6)) * on;
      ax = normalize(vec3(d2.x * ${f4(DIVE.LEAN)}, 1., d2.y * ${f4(DIVE.LEAN)}));
      c.xz += d2 * ${f4(plume)} * mix(${f4(DIVE.CROWN_R[0])}, ${f4(DIVE.CROWN_R[1])}, t6); c += ax * hh;
      vec3 te = cameraPosition - c; sd = cross(ax, te); sd = sd / max(length(sd), 1e-4);
    } else if (k < ${f4(DIVE.CROWN + drops - 0.5)}) {                   // a drop: up and out, and gone before the water; a tear, its point trailing
      float kd = k - ${f4(DIVE.CROWN)}, a = 6.2831853 * (own + (kd + 0.5) / ${f4(drops)}), mo = ${f4(out)} * (0.55 + 0.45 * fract(kd * 0.618 + own)), mt = ${f4(tall)} * (0.6 + 0.4 * fract(kd * 0.37 + own));
      vec2 d2 = vec2(cos(a), sin(a)); float tq = max(tau, 0.02);
      c.xz += mo * pow(tq, 0.7) * d2; c.y += mt * 4. * tau * (1. - tau);
      vec3 vel = vec3(d2.x * mo * 0.7 * pow(tq, -0.3), mt * 4. * (1. - 2. * tau), d2.y * mo * 0.7 * pow(tq, -0.3));
      ax = -vel / max(length(vel), 1e-4);
      hw = ${f4(DIVE.DROP[0] * plume + DIVE.DROP[1])} * smoothstep(0., 0.08, tau) * (1. - smoothstep(0.6, 0.9, tau)) * on; hh = ${f4(DIVE.DROP[2])} * hw; kind = 1.;
      vec3 te = cameraPosition - c; sd = cross(ax, te); sd = sd / max(length(sd), 1e-4);
    } else {                                                           // a dash of the foam's broken ring
      float kf = k - ${f4(DIVE.CROWN + drops)}, j = fract(kf * 0.618 + own * 5.1), a = 6.2831853 * (own * 1.7 + (kf + 0.4 * j) / ${f4(DIVE.FOAM)});
      float rr = ${f4(DIVE.FOAM_R * reach)} * sqrt(tau);
      c.xz += rr * vec2(cos(a), sin(a)); c.y += 0.12;
      sd = vec3(-sin(a), 0., cos(a)); ax = vec3(cos(a), 0., sin(a));
      hw = rr * ${f4(Math.PI / DIVE.FOAM)} * mix(${f4(DIVE.DASH[0])}, ${f4(DIVE.DASH[1])}, j) * on;
      hh = ${f4(0.5 * (0.3 * plume + 0.18))} * (1. - tau) * smoothstep(0., 0.12, tau) * on; kind = 2.; lineOn = 0.;
    }
    vec2 l = ppLine(${f4(BIRD.W)}, ppPixel(projectionMatrix * viewMatrix * vec4(c, 1.)));
    float lw = min(l.x * mix(0.75 / max(uLine.x, 0.75), 1., l.y), 0.6 * hw) * lineOn;   // (a part drawn in to nothing takes its line with it)
    vInk = mix(uSurf, uInk, l.y); vK = vec2(kind, lw / max(hw + lw, 1e-5)); vUv = position.xy;
    gl_Position = projectionMatrix * viewMatrix * vec4(c + sd * (position.x * (hw + lw)) + ax * (position.y * (hh + lw * step(0.5, kind) * step(kind, 1.5))), 1.);
  }`;
const SPLASH_FRAG = /* glsl */`
  uniform vec3 uSurf;
  varying vec2 vUv; varying vec3 vInk; varying vec2 vK;
  void main(){
    float x = abs(vUv.x), t = 0.5 * vUv.y + 0.5, d = 0., edge = 1.;
    if (vK.x < 0.5) { edge = 1.6 * (1. - t) * (0.55 + 0.9 * t); d = x; }                  // a tongue: a leaf, wide low down, pointed
    else if (vK.x < 1.5) { edge = 2.55 * sqrt(max(t, 0.)) * (1. - t); d = x; }             // a drop: a tear, round ahead, pointed behind (no root of a number under 0 where a sample lies past the quad's foot)
    else d = sqrt(x * x * x * x + vUv.y * vUv.y);                                        // a dash: a bar with round ends
    vec3 col = d > edge - vK.y ? mix(uSurf, vInk, step(0.5, 1.5 - vK.x)) : uSurf;
    gl_FragColor = vec4(col, 1.);
    if (d > edge) discard;
  }`;
export function makeSplashes(look, rows, opts = {}) {
  if (!rows || !rows.length) return null;
  const byD = !!opts.byD, D = DIVE, drops = byD ? D.NINE_DROPS : D.DROPS, per = D.CROWN + drops + D.FOAM, iP = [], iL = [];
  const kept = byD ? rows.map((r, i) => [r, i]) : keptDivers(look, rows, opts.boats);
  for (const [row, i] of kept) for (let k = 0; k < per; k++) {
    iP.push(row.strike[0], row.strike[1], 0, 0);
    if (byD) iL.push(row.di - NINE_LAW.AHEAD, 0, k, (i * 0.6180339) % 1); else iL.push(row.per, row.phase, k, (i * 0.6180339) % 1);
  }
  const g = new THREE.InstancedBufferGeometry(), n = kept.length * per;
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); g.setAttribute('iL', new THREE.InstancedBufferAttribute(new Float32Array(iL), 4));
  g.instanceCount = n;
  const vert = byD ? SPLASH_VERT(true, drops, D.NINE_TALL, D.NINE_OUT, D.NINE_PLUME, NINE_LAW.SPLASH_R) : SPLASH_VERT(false, drops, D.TALL, D.OUT, D.PLUME, SEALAW.SPLASH_R);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...look.U, uSurf: { value: new THREE.Vector3(...look.col('surf')) } }, vertexShader: vert, fragmentShader: SPLASH_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = byD ? 'pp-splash-nine' : 'pp-splash'; mesh.userData.triangles = n * 2;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE SITTERS AND THE ROOST: the folded bird, one instanced mesh. A sitter rides the water where the plan dealt it,
// bobbing and rocking on the world's time; the fourteen of the roost stand on the stack's ledges and its top
// (`roost` as the stack's builder hands it over, [[x, y, z, bearing out from the axis], ...]; where none is handed
// over, plan-sea's roostPlaces, the same law), each turned along its ledge, its feet on the rim. `perch` (plan-changes
// 54): places where a bird sits on a thing of the world's own, as the world hands them over.
//   iA: x, y, z, the heading     iB: the phase, the bob's metres, the rock's share
// ---------------------------------------------------------------------------------------------
const SIT_MOVE = /* glsl */`
  {
    float ph = 6.2831853 * iB.x, rock = 0.07 * iB.z * sin(uTime * 1.1 + ph + 1.3), cs = cos(iA.w), sn = sin(iA.w);
    p.xy = ppRot2(p.xy, rock); n.xy = ppRot2(n.xy, rock);
    p = vec3(p.x * cs + p.z * sn, p.y + iB.y * sin(uTime * 1.1 + ph), -p.x * sn + p.z * cs) + iA.xyz;
    n = vec3(n.x * cs + n.z * sn, n.y, -n.x * sn + n.z * cs);
  }`;
export function makeSitters(look, geometry, rows, roost, perch) {
  if (!geometry) return null;
  const list = [], stand = roost && roost.length ? roost : roostPlaces(seaRoad(look));
  (rows || []).forEach((r) => list.push([r.x, -0.12, r.z, r.turn, r.phase, 0.12, 1, 0]));
  stand.forEach((q, i) => {
    const top = i >= stand.length - ROOST.N[ROOST.N.length - 1], out = top ? 0 : ROOST.OUT;
    list.push([q[0] + Math.sin(q[3]) * out, q[1] + BIRD.LEGS, q[2] + Math.cos(q[3]) * out, q[3] + (i % 2 ? 1.25 : -1.25) + (top ? i : 0), (i * 0.37) % 1, 0, 0.3, 0]);
  });
  // a bird on a perch SITS (its legs under it, inside what it sits on): [x, y of the seat, z, the heading]; it rocks as the roost's do
  (perch || []).forEach((q, i) => list.push([q[0], q[1], q[2], q[3], (0.21 + i * 0.47) % 1, 0, 0.3, 0]));
  if (!list.length) return null;
  return flock(geometry, list, flatMaterial(look.U, {}, { vertexMove: SIT_MOVE }), 'pp-sitters');
}

// ---------------------------------------------------------------------------------------------
// THE WATCHERS (plan-changes pb 2; plan-sea's watchers, watcherAt). On the bed's lobes beside the road in the air
// stand rows of SMALL birds of the sea's own kind (the folded bird again in few triangles, drawn at about half its
// size, its wings their own part 21) and here and there a BIG one (the folded bird itself). A watcher's feet ride its
// lobe: the ball's own height at its place by the bank's swell (CLOUD_MOVE's law written again), WATCH.SINK in; a
// small one hops for a while and stands for a while and opens its wings as it hops, and each rocks, all on the
// world's time by its own phase. Two instanced meshes of one law.
//   iA: x, z, the heading, the size     iB: the phase, the hop's metres, metres from the lobe's middle, the legs
//   iC: the lobe's middle height, its radius, its own number, its share of the swell
// ---------------------------------------------------------------------------------------------
const WATCH_SH = [0.44, 0.80];                                         // the small bird's shoulder (x, y): its wing swings out about it
const WATCH_MOVE = /* glsl */`
  {
    float ph = 6.2831853 * iB.x, sz = iA.w, o2 = fract(iC.z * 7.3 + 0.19);
    float cy = iC.x + ${f4(BANK.SW_Y)} * iC.w * iC.y * sin(uTime * 6.2831853 / mix(${f4(BANK.PER_Y[0])}, ${f4(BANK.PER_Y[1])}, o2) + 6.2831853 * o2);
    float cr = iC.y * (1. + ${f4(BANK.SW_R)} * iC.w * sin(uTime * 6.2831853 / mix(${f4(BANK.PER_R[0])}, ${f4(BANK.PER_R[1])}, iC.z) + 6.2831853 * iC.z));
    float feet = cy + sqrt(max(cr * cr - iB.z * iB.z, 0.)) - ${f4(WATCH.SINK)} * sz;
    float gate = smoothstep(0.2, 0.6, sin(uTime * ${f4(WATCH.GATE_W)} + ph * 3.)), hop = iB.y * gate * max(0., sin(uTime * ${f4(WATCH.HOP_W)} + ph));
    if (part > 20.5) {                                                 // a wing: out from the shoulder while the bird hops
      float sx = p.x < 0. ? -1. : 1., a = 1.2 * gate * (0.55 + 0.45 * sin(uTime * ${f4(2 * WATCH.HOP_W)} + ph));
      vec2 q = ppRot2(vec2(abs(p.x), p.y) - vec2(${f4(WATCH_SH[0])}, ${f4(WATCH_SH[1])}), a) + vec2(${f4(WATCH_SH[0])}, ${f4(WATCH_SH[1])}), m = ppRot2(vec2(n.x * sx, n.y), a);
      p.xy = vec2(q.x * sx, q.y); n.xy = vec2(m.x * sx, m.y);
    }
    float rock = 0.09 * sin(uTime * 1.3 + ph * 1.7), cs = cos(iA.z), sn = sin(iA.z);
    p.xy = ppRot2(p.xy, rock); n.xy = ppRot2(n.xy, rock);
    p = p * sz + vec3(0., iB.w * sz + feet + hop, 0.);
    p = vec3(p.x * cs + p.z * sn + iA.x, p.y, -p.x * sn + p.z * cs + iA.y);
    n = vec3(n.x * cs + n.z * sn, n.y, -n.x * sn + n.z * cs);
  }`;
function layWatcher(B, look) {
  const c = (k) => look.col(k), W = BIRD.W, o = { part: 20 };
  ball(B, P3(0, 0.40, 0), [0.50, 0.95, 0.46], { ...o, axis: AX_Z, side: AX_X, nseg: 5, nring: 3, col: c('brownBack'), line: W });
  tube(B, [P3(0, 0.62, 0.62), P3(0, 1.25, 0.80), P3(0, 1.74, 0.66)], [0.24, 0.16, 0.22], { ...o, nseg: 4, col: c('brownHead'), line: W });
  tube(B, [P3(0, 1.66, 0.82), P3(0, 0.80, 1.22)], [0.11, 0.045], { ...o, nseg: 3, col: c('straw'), line: 0, cap0: false });
  for (const s of [1, -1]) {
    ball(B, P3(s * 0.46, 0.46, -0.12), [0.09, 0.80, 0.34], { part: 21, axis: AX_Z, side: AX_X, nseg: 4, nring: 2, col: c('wingTip'), line: 0 });
    stroke(B, [P3(s * 0.2, 0.1, -0.05), P3(s * 0.2, -BIRD.LEGS, -0.05)], 0.05, { ...o });
  }
}
function plainGeometry(B) {                                           // a small model made in one go (as the boat's is)
  appendHulls(B);
  const g = new THREE.BufferGeometry();
  for (const [k, a, n] of [['position', B.pos, 3], ['normal', B.nor, 3], ['aCol', B.col, 3], ['aK', B.k, 4], ['aRig', B.rig, 4]]) g.setAttribute(k, new THREE.Float32BufferAttribute(a, n));
  g.setIndex(B.idx); g.userData.triangles = B.idx.length / 3;
  return g;
}
export function makeWatchers(look, folded) {
  const all = watchers(seaRoad(look)), group = new THREE.Group(), mat = flatMaterial(look.U, {}, { vertexPre: 'attribute vec4 iC;', vertexMove: WATCH_MOVE });
  const B = makeBuilder(); layWatcher(B, look);
  let triangles = 0;
  for (const [big, src, name] of [[false, plainGeometry(B), 'pp-watchers'], [true, folded, 'pp-watchers-big']]) {
    const list = all.filter((w) => !!w.big === big); if (!src || !list.length) continue;
    const rows = list.map((w) => [w.x, w.z, w.turn, w.size, w.phase, w.hop, w.off, BIRD.LEGS]), iC = [];
    for (const w of list) iC.push(w.lobe.y, w.lobe.r, w.lobe.own, w.lobe.sw ?? 1);
    const mesh = flock(src, rows, mat, name, { iC }); group.add(mesh); triangles += mesh.userData.triangles;
  }
  group.name = 'pp-watchers-all'; group.userData.triangles = triangles;
  return group;
}

// ---------------------------------------------------------------------------------------------
// THE PENNANTS (plan-changes pb 3; plan-sea's pennantPoles). One merged mesh, one draw: the poles (strokes with a
// knob), the strings sagging between them, and on every string PENNANT.N small pennants in four of the world's flat
// colours in turn, each a plate with the one line round it. A pennant's foot (part 21, aRig: its phase, 0 at the
// string and 1 at its foot, the unit across its string in plan) waves across the string on the world's time.
// ---------------------------------------------------------------------------------------------
const PENNANT_COL = ['bikeRed', 'bikeYellow', 'bikeTeal', 'stroke'];
const PENNANT_MOVE = /* glsl */`
  if (part > 20.5) {
    float w = aRig.y * (${f4(PENNANT.WAVE[0])} * sin(uTime * ${f4(PENNANT.WAVE[1])} + 6.2831853 * aRig.x) + ${f4(0.4 * PENNANT.WAVE[0])} * sin(uTime * ${f4(1.83 * PENNANT.WAVE[1])} + 15.7 * aRig.x));
    p.xz += aRig.zw * w; p.y += 0.3 * abs(w) * aRig.y;
  }`;
export function makePennants(look) {
  const T = PENNANT, B = makeBuilder(), lines = pennantPoles(seaRoad(look)), cols = PENNANT_COL.map((k) => look.col(k)); let n = 0;
  for (const line of lines) for (let i = 0; i < line.length; i++) {
    const a = line[i], b = line[i + 1];
    stroke(B, [P3(a.x, a.y - a.foot, a.z), P3(a.x, a.y + 0.12, a.z)], 0.07, {});
    ball(B, P3(a.x, a.y + 0.2, a.z), [0.15, 0.15, 0.15], { nseg: 4, nring: 2, col: cols[1], line: 0 });
    if (!b) continue;
    const at = (t) => P3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - T.SAG * 4 * t * (1 - t), a.z + (b.z - a.z) * t);
    stroke(B, [0, 0.25, 0.5, 0.75, 1].map(at), 0.03, {});
    const hl = Math.hypot(b.x - a.x, b.z - a.z), nx = (b.z - a.z) / hl, nz = -(b.x - a.x) / hl;
    for (let k = 0; k < T.N; k++, n++) {
      const t = (k + 0.5) / T.N, h = T.W / 2 / Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), q0 = at(t - h), q1 = at(t + h), m = at(t), from = B.pos.length / 3;
      plate(B, q0, q1, P3(m.x + (q1.x - m.x) * 0.12, m.y - T.DROP, m.z + (q1.z - m.z) * 0.12), P3(m.x + (q0.x - m.x) * 0.12, m.y - T.DROP, m.z + (q0.z - m.z) * 0.12), { col: cols[n % 4], line: 0.05, two: false });
      const ph = (n * 0.6180339) % 1, rig = [ph, 0, nx, nz];
      for (let v = from; v < B.pos.length / 3; v++) { const li = v - from, corner = li < 4 ? li : (li - 4) >> 1; B.k[v * 4 + 1] = 21; rig[1] = corner >= 2 ? 1 : 0; for (let q = 0; q < 4; q++) B.rig[v * 4 + q] = rig[q]; }
    }
  }
  const mesh = new THREE.Mesh(plainGeometry(B), flatMaterial(look.U, {}, { vertexMove: PENNANT_MOVE, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'pp-pennants'; mesh.userData.triangles = mesh.geometry.userData.triangles; mesh.userData.pennants = n;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE BOATS: a white hull 7 m long, a mast, a mainsail swung a little off and a jib, 12 m tall; each sail red or
// white, the boat's turn and the phase of its rocking as the world's stream dealt them. One instanced mesh; a boat
// rolls, pitches and rides up and down on the world's time about its own place (it never leaves the plan's 3.5 m).
//   iA: x, z, the turn, the phase     iB: the sails' colour
// ---------------------------------------------------------------------------------------------
const BOAT_MOVE = /* glsl */`
  {
    float ph = 6.2831853 * iA.w, roll = 0.09 * sin(uTime * 0.9 + ph), pitch = 0.035 * sin(uTime * 1.27 + ph * 1.7), cs = cos(iA.z), sn = sin(iA.z);
    p.xy = ppRot2(p.xy, roll); n.xy = ppRot2(n.xy, roll); p.yz = ppRot2(p.yz, pitch); n.yz = ppRot2(n.yz, pitch);
    p = vec3(p.x * cs + p.z * sn + iA.x, p.y + 0.12 * sin(uTime * 0.7 + ph * 2.3), -p.x * sn + p.z * cs + iA.y);
    n = vec3(n.x * cs + n.z * sn, n.y, -n.x * sn + n.z * cs);
  }`;
function boatGeometry(look) {
  const B = makeBuilder(), W = lineOf(BOAT_H), o = { part: 20 };
  ball(B, P3(0, 0.25, 0), [1.2, BOAT_R, 0.85], { ...o, axis: AX_Z, side: AX_X, nseg: 8, nring: 5, col: look.col('lighthouseWhite'), line: W });
  stroke(B, [P3(0, 0.6, 0.4), P3(0, BOAT_H - 0.1, 0.4)], 0.09, { ...o });
  plate(B, P3(0, 1.5, 0.2), P3(1.15, 1.7, -3.1), P3(0.02, BOAT_H - 0.7, 0.05), P3(0, BOAT_H - 0.5, 0.2), { ...o, tint: 1, line: W * 0.5 });
  plate(B, P3(0, 1.3, 3.3), P3(0.45, 1.5, 0.7), P3(0.02, BOAT_H - 1.8, 0.55), P3(0, BOAT_H - 1.6, 0.6), { ...o, tint: 1, line: W * 0.5 });
  appendHulls(B);                                                     // one small model: made in one go (the maker is not async)
  const g = new THREE.BufferGeometry();
  for (const [k, a, n] of [['position', B.pos, 3], ['normal', B.nor, 3], ['aCol', B.col, 3], ['aK', B.k, 4], ['aRig', B.rig, 4]]) g.setAttribute(k, new THREE.Float32BufferAttribute(a, n));
  g.setIndex(B.idx); g.userData.triangles = B.idx.length / 3;
  return g;
}
export function makeBoats(look, places, sails) {
  if (!places || !places.length) return null;
  const red = look.col('sail'), white = look.col('surf');
  const rows = places.map((p, i) => { const s = (sails && sails[i]) || {}, c = s.red ? red : white; return [p[0], p[1], s.turn || 0, s.phase || 0, c[0], c[1], c[2], 0]; });
  const mesh = flock(boatGeometry(look), rows, flatMaterial(look.U, {}, { vertexMove: BOAT_MOVE }), 'pp-boats');
  return mesh;
}
