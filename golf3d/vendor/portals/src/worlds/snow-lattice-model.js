// The Snow Lattice: a chemist's ball-and-stick model of ice the size of a city, in cold morning daylight.
// FIX 7 (after review 8 and the outside reviews): the tonal key is set in linear values (see the part's header: a real
// half-tone away from the key, a real baked shade, a deep plum nave); the screw is a stair seen from low beside it; over
// the fork the path keeps nearer the axis and the first file comes down steeply, left of the ring; a last branchlet is
// laid beside the ring's foot during the run-in; the looks at the relay and at the guest turn less far, so the far mouth
// stays whole in the frame; the far arms show in the mouth from u 0.33.
// Everything is the model-maker's three materials (lacquered balls, brass rods, steel springs), shaded by the
// style routines of ../parts/snow-lattice-model.js. World space = lattice space moved by OFF (see below).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as PART from '../parts/snow-lattice-model.js';

const { LATTICE, PALETTE, STYLE_GLSL, makeStyle, makeBatch, buildLattice, makeHelixPool } = PART;
const { RING, A_LAT, DX, LAYER, BOND, C_LAT, R_O } = LATTICE;

// lattice -> world: the shaft we fly is the channel at lattice (0, 2 A_LAT); the upright ring sits at lattice
// (0, A_LAT, 5.5 C_LAT) and must land at world z 850.
const Z_RING = 850, OFF = new THREE.Vector3(0, -2 * A_LAT, Z_RING - 5.5 * C_LAT);
const Z_CLIFF = 150, Z_ROOT = 510;
const Y_SHAFT = 2 * A_LAT;                       // lattice y of the shaft's axis

// ---------------------------------------------------------------- sky: blue-white over rose, a pale disc of sun
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const SKY_FRAG = /* glsl */`
${STYLE_GLSL}
uniform vec3 uEye, uSunCol; uniform float uDisc;
varying vec3 vDir;
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 col = mix(uEye, uPal[4], smoothstep(0.0, 0.34, d.y));          // near white at the level of the eye, the sky's own blue by the top of the frame
  col = mix(col, uPal[5], (1.0 - smoothstep(-0.16, 0.03, d.y)) * 0.96);
  float s = dot(d, uSun);
  col = mix(col, uSunCol, smoothstep(0.9990, 0.9994, s) * uDisc);
  col += uSunCol * 0.10 * smoothstep(0.93, 1.0, s) * uDisc;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- the cliff behind and beside the real face ring.
// One plane just behind the first ring of real balls. Every cell is looked INTO along the true view ray: the dim
// rose-grey nave, two deeper rings sliding in parallax, and the disc of sky at its end (drawn at a stylised short
// depth so that every shaft shows one, not only the shaft on the axis). Where no real face stands in front
// (aFace 1: beyond the built lattice) the face ring itself is drawn too, on the face's own plane.
const SLAB_VERT = /* glsl */`
uniform vec3 uOff;
attribute float aFace;
varying vec3 vL, vCam; varying float vFace;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vL = w.xyz - uOff; vCam = cameraPosition - uOff; vFace = aFace;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HEX_GLSL = /* glsl */`
vec2 slmCell(vec2 p){
  float q = p.x / ${DX.toFixed(4)}, r = (p.y - q * ${LAYER.toFixed(4)}) / ${A_LAT.toFixed(4)};
  float x = q, z = r, y = -q - r;
  float rx = floor(x + 0.5), ry = floor(y + 0.5), rz = floor(z + 0.5);
  float ex = abs(rx - x), ey = abs(ry - y), ez = abs(rz - z);
  if (ex > ey && ex > ez) rx = -ry - rz; else if (ey <= ez) rz = -rx - ry;
  return vec2(rx * ${DX.toFixed(4)}, rx * ${LAYER.toFixed(4)} + rz * ${A_LAT.toFixed(4)});
}
// offset from the nearest vermilion column of the ring round a cell centre (d = offset from that centre)
vec2 slmBall(vec2 d){
  vec2 sg = vec2(d.x < 0.0 ? -1.0 : 1.0, d.y < 0.0 ? -1.0 : 1.0);
  vec2 l1 = d - vec2(sg.x * ${RING.toFixed(3)}, 0.0), l2 = d - sg * vec2(${(RING / 2).toFixed(3)}, ${LAYER.toFixed(4)});
  return dot(l1, l1) < dot(l2, l2) ? l1 : l2;
}
float slmIvory(vec2 d){
  vec2 q = abs(d);
  return min(length(q - vec2(0.0, ${LAYER.toFixed(4)})), length(q - vec2(${(RING * 0.75).toFixed(3)}, ${(LAYER / 2).toFixed(4)})));
}
vec3 slmSky(float dy, vec3 eye){
  vec3 c = mix(eye, uPal[4], smoothstep(0.0, 0.34, dy));
  return mix(c, uPal[5], (1.0 - smoothstep(-0.16, 0.03, dy)) * 0.96);
}`;
const SLAB_FRAG = /* glsl */`
${STYLE_GLSL}
${HEX_GLSL}
uniform vec3 uOff;
uniform vec4 uSlab;        // z of the face ring's plane; this plane keeps the cells from y to w metres off the flown shaft; shaft axis y in z
uniform float uMode;        // 0 the painted wall | 1 the backdrop deep inside: the nave's plain dark | 2 the plane over the real naves: it keeps each cell's point of daylight when the painting lifts
uniform vec3 uFade;         // alpha, and the distances from the eye over which this painted plane lifts (nearer: gone)
varying vec3 vL, vCam; varying float vFace;
void main(){
  vec3 ray = vL - vCam; float dist = length(ray);
  float rz = abs(ray.z) < 1e-3 ? 1e-3 : ray.z;
  vec2 sl = ray.xy / rz;                                          // sideways metres per metre of depth
  vec2 pf = vL.xy - sl * (vL.z - uSlab.x);                        // this ray where it crossed the face

  float px = max(fwidth(pf.x) + fwidth(pf.y), 1e-3) * 0.7;        // metres per pixel on the face
  vec2 c = slmCell(pf), d0 = pf - c;
  float rc = length(c - vec2(0.0, uSlab.z));
  if (rc < uSlab.y || rc >= uSlab.w || c.y > uOff.y * -1.0 + 46.0) discard;   // cell by cell; nothing above the brink
  vec3 naveC = uPal[5] * vec3(0.10, 0.045, 0.085);                  // the nave: a deep plum, never black
  vec3 col = naveC;
  if (uMode > 0.5 && uMode < 1.5) { gl_FragColor = vec4(uPal[5] * vec3(0.075, 0.033, 0.065), uFade.x * smoothstep(uFade.y, uFade.z, dist)); return; }   // (the rampart's own dark: one tone with the liner, its cap and its lid)
  // two deeper rings, sliding behind the face
  vec2 p2 = pf + sl * 27.15, c2 = slmCell(p2), p1 = pf + sl * 13.57, c1 = slmCell(p1);
  float dk = 1.0 - smoothstep(0.42, 0.64, px);                    // (from far off a cell is one ring round one dark nave: marks that would beat with the face ring are left out)
  col = mix(col, mix(uPal[0], naveC, 0.74), (1.0 - smoothstep(2.0 - px, 2.0 + px, length(slmBall(p2 - c2)))) * dk);
  col = mix(col, mix(uPal[1], naveC, 0.66), (1.0 - smoothstep(1.2 - px, 1.2 + px, slmIvory(p1 - c1))) * dk);
  col = mix(col, mix(uPal[0] * vec3(0.8, 0.8, 0.95), naveC, 0.46), (1.0 - smoothstep(2.0 - px, 2.0 + px, length(slmBall(p1 - c1)))) * dk);
  // the disc of sky at the end of the shaft: slides with the eye, cut by the bore it is seen through
  float bore = 1.0 - smoothstep(6.6 - px, 6.6 + px, length(d0));
  float rd = 2.8 * clamp(dist / 140.0, 0.25, 1.0);                 // a far end looks further off as the eye comes close
  float disc = (1.0 - smoothstep(rd - px, rd + px, length(d0 + sl * 5.5))) * bore;
  float pm = uMouth.x * smoothstep(uMouth.y, uMouth.y + max(uMouth.w, 0.1), rc);   // outside the pool of daylight round the flown mouth the wall steps a tone back
  col = mix(col, vec3(0.985, 0.992, 1.0), disc * (1.0 - 0.40 * pm));
  vec3 flatT = mix(naveC, vec3(0.985, 0.992, 1.0), 0.11);
  if (vFace > 0.5) {
    // the face ring, flat: steel along the hexagon, ivory on the links, vermilion at the six corners, one highlight each
    vec2 q = abs(d0);
    float hx = max(q.y, q.y * 0.5 + q.x * 0.8660254);
    col = mix(col, uPal[3] * 0.82, 1.0 - smoothstep(0.5, 0.5 + px, abs(hx - ${LAYER.toFixed(4)})));
    col = mix(col, uPal[1] * 0.95, 1.0 - smoothstep(1.2 - px, 1.2 + px, slmIvory(d0)));
    vec2 lb = slmBall(d0);
    float lit = smoothstep(-2.0, 0.9, dot(lb, vec2(0.66, 0.50)));
    vec3 vcol = mix(uPal[0] * vec3(0.40, 0.40, 0.60) + uPal[4] * 0.035, uPal[0], lit);
    vcol = mix(vcol, vec3(1.0, 1.0, 0.98), (1.0 - smoothstep(0.30, 0.30 + px, length(lb - vec2(0.74, 0.78)))) * (1.0 - smoothstep(0.2, 0.5, px)));
    col = mix(col, vcol, 1.0 - smoothstep(2.0 - px, 2.0 + px, length(lb)));
    flatT = mix(flatT, uPal[0] * 0.92, 0.2); flatT = mix(flatT, uPal[1] * 0.95, 0.12);
  }
  col = mix(col, col * vec3(0.54, 0.48, 0.62), pm);
  // the cliff falls away into the rose haze of the hollow, row by row (the real face balls carry the same term)
  float kr = clamp((-52.0 - (c.y + uOff.y)) / 60.0, 0.0, 1.0); kr = kr * kr * (3.0 - 2.0 * kr) * 0.9;
  vec3 roseC = uPal[5];
  if (vFace > 0.5) {
    vec2 q2 = abs(d0);
    float hx2 = max(q2.y, q2.y * 0.5 + q2.x * 0.8660254);
    roseC = mix(roseC, mix(uPal[5], vec3(1.0), 0.30), 1.0 - smoothstep(1.6, 1.6 + px, abs(hx2 - ${LAYER.toFixed(4)})));
  }
  col = mix(col, roseC, kr); flatT = mix(flatT, mix(uPal[5], vec3(1.0), 0.08), kr);
  col = mix(flatT, col, 1.0 - smoothstep(1.6, 3.4, px));         // under about five pixels a cell: its flat average
  float A = uFade.x * smoothstep(uFade.y, uFade.z, dist);
  if (uMode > 1.5) A = max(A, disc * smoothstep(30.0, 52.0, dist));
  gl_FragColor = vec4(slmAerial(col, dist), A);
}`;

// ---------------------------------------------------------------- the far arms of the crystal: flat rose, a paler
// honeycomb, dissolving into the sky's own colour by aK (1 at the top edge, 0 where the haze has it)
const FAR_VERT = /* glsl */`
attribute vec2 aPl; attribute vec4 aK;
varying vec3 vW; varying vec2 vPl; varying vec4 vK;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vPl = aPl; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FAR_FRAG = /* glsl */`
${STYLE_GLSL}
${HEX_GLSL}
uniform vec3 uEye; uniform float uFar;
varying vec3 vW; varying vec2 vPl; varying vec4 vK;
void main(){
  vec3 ray = vW - cameraPosition; float dist = max(length(ray), 1.0);
  vec3 skyc = slmSky(ray.y / dist, uEye);
  vec2 p = vPl * 0.15;
  vec2 d = p - slmCell(p), q = abs(d);
  float h = max(q.y, q.y * 0.5 + q.x * 0.8660254);
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4) * 0.7;
  float line = smoothstep(7.35 - fw, 7.35 + fw, h);               // the honeycomb: paler than the plate
  line = mix(line, 0.22, smoothstep(1.3, 3.4, fw));
  vec3 col = mix(uPal[5] * vec3(0.60, 0.33, 0.42), mix(uPal[5], vec3(1.0), 0.12), line);   // (the plate: flat rose a plain step darker than the sky beside it)
  float k = clamp((vW.y - vK.y) / max(vK.z - vK.y, 1.0), 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k) * vK.x * mix(1.0, uFar, vK.w);
  gl_FragColor = vec4(mix(skyc, col, clamp(k, 0.0, 1.0)), 1.0);
}`;

// ---------------------------------------------------------------- the rampart round the shaft we fly, beyond the built
// lattice: a six-sided liner in the nave's own rose-grey, drawn as the honeycomb it stands for and crossed by the same
// bars of daylight as the balls in front of it
const LINER_VERT = /* glsl */`
attribute float aCap;
varying vec3 vL; varying float vCap;
void main(){ vL = position; vCap = aCap; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LINER_FRAG = /* glsl */`
${STYLE_GLSL}
${HEX_GLSL}
uniform float uAxisY, uRootZ, uRL, uTop, uCut;
uniform vec3 uGap, uEye;
varying vec3 vL; varying float vCap;
void main(){
  vec2 d = vec2(vL.x, vL.y - uAxisY);
  float fxy = fwidth(vL.x) + fwidth(vL.y), fz = fwidth(vL.z);
  vec2 q0 = abs(d);
  if (vCap < 0.5 && vL.z > uCut) discard;                         // its far end draws back as the eye comes out into the bay: nothing flat stands near the eye there
  bool cap = vCap > 0.5;                                          // the flat cap behind the cliff's real depth: naves seen end-on
  if (cap && vCap < 1.5 && max(q0.y, q0.y * 0.5 + q0.x * 0.8660254) < uRL && d.y < uTop) discard;
  float ang = dot(d, d) > 1.0 ? atan(d.y, d.x) : 0.0;
  // one even deep plum, and in it the rampart's own balls a tone above the dark, none drawn larger than a ball: no facet,
  // no painted cell, nothing but depth behind the lit ring, the relay wall and the guest
  vec2 p = cap ? vL.xy : vec2(ang * 64.171, vL.z);
  vec2 dc = p - slmCell(p);
  float fw = max(cap ? fxy : fz + fxy, 1e-3) * 0.7;
  float keep = 1.0 - smoothstep(0.5, 1.6, fw);
  float bl = (1.0 - smoothstep(2.0 - fw, 2.0 + fw, length(slmBall(dc)))) * keep;
  float iv = (1.0 - smoothstep(1.2 - fw, 1.2 + fw, slmIvory(dc))) * keep;
  vec3 nave = uPal[5] * vec3(0.075, 0.033, 0.065);
  if (vCap > 1.5) { bl = 0.0; iv = 0.0; }
  vec3 col = nave + uPal[0] * 0.075 * bl + uPal[1] * vec3(0.055, 0.045, 0.085) * iv;
  // behind the guest's cage the rampart stands open to the day: not a pane but a gap in the lattice, a dozen cells of it
  // open, each a ring of balls and links in silhouette against the blue-white sky; the gap's edge is the cells' own
  vec2 cg = p - dc;
  vec2 g = abs((cap ? vec2(1e3) : vec2(cg.x, cg.y * 0.6124)) - uGap.xy);
  float gh = max(g.y, g.y * 0.5 + g.x * 0.8660254);
  float gap = step(gh, 20.0) * uGap.z;
  float fg = min(fw, 0.7);
  vec2 qd = abs(dc); float hxd = max(qd.y, qd.y * 0.5 + qd.x * 0.8660254);
  float sil = max(max(1.0 - smoothstep(2.0 - fg, 2.0 + fg, length(slmBall(dc))), 1.0 - smoothstep(1.2 - fg, 1.2 + fg, slmIvory(dc))), 1.0 - smoothstep(0.42, 0.42 + fg, abs(hxd - ${LAYER.toFixed(4)})));
  col = mix(col, mix(mix(uPal[4], uEye, 0.25), nave * 1.7, sil), gap);
  gl_FragColor = vec4(col, 1.0);
}`;

const LIGHTS = {
  //            sky        eye-level  haze       sun        disc
  morning:  ['#DCE9F4', '#F5F9FC', '#E7C3C4', '#FFFFFF', 1],
  dawn:     ['#BDB6CF', '#F6D6CF', '#F0C6AE', '#FFE9D6', 1],
  overcast: ['#E6EBEF', '#F8F9F9', '#E3D0D2', '#FFFFFF', 0],
  golden:   ['#D6E1EA', '#FBEFD0', '#EFC8A4', '#FFF1B8', 1],
  bluehour: ['#8C9FCC', '#CCD4EA', '#BBAACB', '#E8ECFF', 0],
};

export default {
  id: 'snow-lattice-model',
  name: 'The Snow Lattice',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    // ---- the seeded edition: light, set, vapour (chosen once, here; nothing is switched later)
    const hour = vary.hour || 'any';
    const lightPick = rng.pick(['morning', 'morning', 'dawn', 'overcast', 'golden']);
    const light = hour === 'dawn' ? 'dawn' : hour === 'golden' ? 'golden' : hour === 'night' ? 'bluehour'
      : hour === 'day' ? (lightPick === 'overcast' ? 'overcast' : 'morning') : lightPick;
    const faded = rng.chance(0.28), thick = rng.chance(0.3), rare = !!vary.rare;
    const L = LIGHTS[light];
    const pal = PALETTE.slice();
    if (faded) { pal[0] = '#E27C6C'; pal[1] = '#F7F5EE'; pal[2] = '#93794A'; }
    if (light === 'golden') { pal[1] = faded ? '#F8EBC8' : '#F6E2B4'; pal[2] = faded ? '#B08E48' : '#DDA63C'; }
    if (light === 'bluehour') { pal[1] = '#E4E6F2'; }
    pal[4] = L[0]; pal[5] = L[2];
    const style = makeStyle(pal), U = style.uniforms;
    if (thick) U.uHaze.value.x = 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(L[1]);
    const model = new THREE.Group(); model.name = 'lattice space'; model.position.copy(OFF); scene.add(model);

    // ---- sky
    const skyU = { ...U, uEye: { value: new THREE.Color(L[1]) }, uSunCol: { value: new THREE.Color(L[3]) }, uDisc: { value: L[4] } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16),
      new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---- the hero: the growing face (terrace, steps, zips, sprigs, the upright ring), in lattice space
    let hero = null, heroError = '';
    try { hero = await PART.buildHero(ctx, { style, detail, palette: pal, rare, density: dens, light }); }
    catch (e) { heroError = String(e && e.message || e); hero = null; }
    if (hero && hero.object) model.add(hero.object); else hero = null;
    const HA = (hero && hero.anchors) || {};
    await ctx.yield();

    // ---- the flight: Vapour, Shaft (dead straight, level), then down out of the rampart to half way up the first
    // step (lattice y 9.5: the row being laid is a wall on our left, its kink close ahead), then up to the step's top
    // line to watch the arm fork, and level from there to the upright ring
    const ringW = new THREE.Vector3(0, A_LAT, 5.5 * C_LAT).add(OFF);
    if (HA.portalSeat && HA.portalSeat.position) ringW.copy(HA.portalSeat.position).add(OFF);
    // (the rare edition, the screw: out of the rampart the path sinks 20 m and runs level beside the wound hill, 18 m off its nearest face and 3 m under that face's top line (lattice y 13.5), as it flies the zip: the turns stack in profile on the left; then down to the ring)
    const path = makePath(rare ? [
      [0, 0, 0], [0, 0, 60], [0, 0, 150], [0, 0, 330], [0, 0, 440], [0, 0, 492], [0.2, -5, 516], [-0.9, -13.5, 538], [-2, -19.2, 558], [-2, -19.8, 640], [-1.6, -19.4, 690],
      [-0.5, -17.6, 726], [0, ringW.y, 762], [0, ringW.y, ringW.z - 72], [0, ringW.y, ringW.z - 36], [0, ringW.y, ringW.z],
    ] : [
      [0, 0, 0], [0, 0, 60], [0, 0, 150], [0, 0, 330], [0, 0, 440], [0, 0, 500], [0.9, -7.5, 526], [2.2, -18.5, 548], [2.9, -23.4, 564],
      [3.2, -22.6, 572], [4, -17, 582], [6.2, -10, 592], [8.4, -5.6, 602], [9.6, -4.4, 613], [10, -4.2, 628], [9, -5, 648], [6.4, -6.5, 670], [3.6, -9.2, 692], [1.4, -13, 716], [0.4, ringW.y, 744], [0, ringW.y, ringW.z - 72], [0, ringW.y, ringW.z - 36], [0, ringW.y, ringW.z],
    ]);
    const GUEST = new THREE.Vector3(DX, Y_SHAFT + LAYER, 311 - OFF.z);   // lattice space: 21 m ahead of the eye at its beat (u 0.34)
    const camZ = new Float32Array(257), pv = new THREE.Vector3();
    for (let i = 0; i <= 256; i++) camZ[i] = path.pointAt(i / 256, pv).z;
    const zAt = (u) => { const f = Math.min(1, Math.max(0, u)) * 256, i = Math.min(255, Math.floor(f)); return camZ[i] + (camZ[i + 1] - camZ[i]) * (f - i); };
    await ctx.yield();

    // ---- the cliff face and the shaft we fly: real lattice, one batch
    const zc0 = Z_CLIFF - OFF.z, zr = Z_ROOT - OFF.z - 0.8;       // lattice z of the cliff face and of the arm's root
    const FACE_Z = zc0 + 11, XF = 262, YB0 = -182 - OFF.y, YB1 = 50 - OFF.y, RT = 62;   // the face ring: the first bilayer of balls
    // how far a cell of the cliff has gone into the rose haze of the hollow, by its height (world y), row by row
    const roseAt = (yw) => { const t = Math.min(1, Math.max(0, (-52 - Math.round(yw / LAYER) * LAYER) / 60)); return t * t * (3 - 2 * t) * 0.9; };
    // THE HOPPER. The shaft does not run as a pipe to the root: from world z 391 the rampart's far face is a stepped
    // hexagonal bay (the hopper habit of a growing crystal), opening one ring of channels at a time, so the far mouth is
    // a window that swells and we come out into daylight by steps. Its floor is the terrace's own floor carried back.
    const zE0 = 391.5 - OFF.z, zE1 = 478 - OFF.z, zE2 = 500 - OFF.z;
    // the breach behind the guest: along the eye's line to its cage at its beat the rampart stands open, widening, to the day
    const gEye = new THREE.Vector3(0, Y_SHAFT, zAt(0.34) - OFF.z), gDir = GUEST.clone().sub(gEye).normalize(), gv = new THREE.Vector3();
    const breach = (x, y, z) => { gv.set(x, y, z).sub(GUEST); const t = gv.dot(gDir); return t > 7 && gv.addScaledVector(gDir, -t).length() < 4.6 + 0.17 * t; };
    const hexR = (x, y) => { const ax = Math.abs(x), ay = Math.abs(y - Y_SHAFT); return Math.max(ay, ay * 0.5 + ax * 0.866); };
    const openR = (z) => z <= zE0 ? 0 : z <= zE1 ? 26 : z <= zE2 ? 42.8 : 1e3;
    const batch = makeBatch();
    // the relay's lane: the three columns of our shaft's right-hand wall (the corner at axis height and the two beside it) with the links between them
    const rightWall = (q) => q.z > zc0 + 20 && ((q.m === -2 && q.n === 3 && q.c > 1) || (q.m === -1 && (q.n === 2 || q.n === 3) && q.c < 2));
    const frng = rng.fork ? rng.fork('lattice') : rng;
    const lat = await buildLattice(ctx, batch, {
      rng: frng, pegs: 0.5,
      bounds: { x0: -XF, x1: XF, y0: YB0, y1: YB1, z0: zc0, z1: zr },
      site(x, y, z, cls) {
        const r = Math.hypot(x, y - Y_SHAFT), own = r < 10.5;
        if (z < FACE_Z) { const k = roseAt(y + OFF.y); return { shade: own ? 0 : 8 + k }; }   // the face is full pigment down to where the hollow's haze takes it; beyond the flown ring it can step a tone back (uMouth)
        if (z > zE0) {
          if (y < 0.1) {                                              // the bay's floor: the terrace floor carried back under the hopper
            if (y < -3 * LAYER - 0.1 || Math.abs(x) > (z > zE2 ? 150 : 56)) return null;
            if (y < -0.1) return { shade: y > -LAYER - 0.1 ? 10.42 : 10.72 };   // under the floor's top layer every well is a dim nave going down
            return { shade: !rare && z > zE1 && x > 4 ? (x > 14 ? 0.86 : 0.62) : 0 };   // (the step's foot and the shelf under its row sit in shade, as on the terrace)
          }
          // the first step's row, already laid, is carried back through the bay with the floor: coming out, the eye falls on it at once
          // (it is the zip's own row and is laid on the same clock: the kink comes out of the bay ahead of us)
          if (!rare && z > zE1 && x > 14 && y < 2 * LAYER + 0.1) {
            if (x >= 14 + 2 * DX) return (r < RT || (z > zE2 && x < 150)) ? { shade: 6.4 } : null;   // (past the rampart's far face the tier runs out to the brink, as on the terrace)
            const zrt = HA.rootZ ?? zr + 0.8, ZCc = [1 / 16, 7 / 16, 9 / 16, 15 / 16][cls];
            return y > 2 * LAYER - 0.1 && x < 14 + DX ? { T: ((Math.round(z / C_LAT - ZCc) + (cls === 2 ? 0.5 : 1)) * C_LAT - zrt) / 16, glide: 1 } : { T: (z - 6 - zrt) / 16, glide: 1.25 };
          }
          // (the screw's edition: its nearest turn's row, long laid, is carried back through the bay in the same way: coming out, the lower left of the frame is fresh row, not the bay's risers)
          if (rare && z > zE1 && x > 16 && x < 16 + 2 * DX && y < 2 * LAYER + 0.1) return { shade: 0 };
          const h = hexR(x, y), o = openR(z);
          if (h < o || r >= RT) return null;                          // open air
          if (z > zE1 - 16) return { shade: 6 + Math.min(1, Math.max(0, (h - o) / 20)) };   // the risers round the bay's mouth face away from the key: wood in shade, like the tiers they run into (all round: the rim of the window is dark against the light)
          // the hopper's risers: the nave's dim all the way; the last of them, round the bay's mouth, wood in shade (above)
          return { shade: 10 + Math.min(0.85, Math.max(0.56, 0.04 + Math.max(0, h - o - 6) / 26, 0.8 * Math.min(1, 1 - (z - zE0 - 30) / 45))) };   // (FIX 6: never in daylight: the rim of the window is round balls dark against the light)
        }
        if (r < RT) {
          // a site of the shafts: dim from one ring inside the mouth; only the flown ring's own six columns (2 + shade) and
          // the guest's cage are lit to full pigment by the walking bars, the rest of the rampart (10 + shade) stays a tone back
          const sh = Math.min(0.92, 0.10 + 0.72 * Math.min(1, (z - FACE_Z + 3) / 10) + (own ? 0 : 0.08));
          const cage = Math.hypot(x - GUEST.x, y - GUEST.y) < 10.5 && Math.abs(z - GUEST.z) < 22;
          if (!own && !cage && breach(x, y, z)) return null;
          if (own && x < -4 && z > zc0 + 20) return { shade: 2 + Math.min(sh, 0.22 + 0.6 * Math.min(1, Math.max(0, 1 - (z - zc0 - 30) / 40))) };   // the relay's lane, the right-hand wall: never quite dim
          return { shade: (own || cage ? 2 : 10) + sh };
        }
        if (r < 106 && z < zc0 + 52) return { shade: 10 + 0.74 + 0.16 * (z - zc0) / 52 };   // the cliff's real depth: nave sites too
        return null;
      },
      // the relay lane: the column at the right-hand corner of our shaft's ring
      lane: (a, b) => (rightWall(a) && rightWall(b)) ? 1 : 0,
    });
    await ctx.yield();

    // ---- loose molecules: the vapour (skeins in the hollow, streaming over the brink, a thin veil on the terrace)
    const vrng = rng.fork ? rng.fork('vapour') : rng;
    const seen = [];
    const putVapour = (xw, yw, zw, loop, over = false) => {
      if (path.distanceTo(xw, yw, zw) < 9.5 + 2.5 * loop || (!over && zw > Z_CLIFF - 6 - 2.4 * loop && zw < Z_ROOT + 4)) return false;
      if (loop > 1 && zw < 36 && Math.hypot(xw, yw) < 1.25 * zw) { vrng(); return false; }   // none but the hand-placed ones stands close in the entry's own view
      // no clump: seen from the entry no two loose molecules of the hollow stand one over the other
      if (zw < 160 || over) { const d = Math.max(4, zw - 6), ax = xw / d, ay = yw / d;
        for (let i = 0; i < seen.length; i += 3) { const m = 3.7 / d + 3.7 / seen[i + 2]; if (Math.abs(ax - seen[i]) < m && Math.abs(ay - seen[i + 1]) < m) { vrng(); return false; } }
        seen.push(ax, ay, d); }
      batch.vapour(xw - OFF.x, yw - OFF.y, zw - OFF.z, vrng() * 97, loop, 0); return true;
    };
    // the near ones, hand placed: the nearest 8 m off the course
    // (one hangs whole in the left third of the entry frame, 13 m from the eye there; none crosses the rosette of seven cells round the mouth at u 0.12)
    { const d = 31, ax = 8.5 / d, ay = -4.5 / d; seen.push(ax, ay, d); batch.vapour(8.5 - OFF.x, -4.5 - OFF.y, 37 - OFF.z, 0.37 * 97, 0.35, 0); }   // (22 m from the eye at the entry: under a quarter of the frame)
    for (const p of [[-9.5, 6.5, 65], [-12, 3.5, 66], [7, 18, 98], [-17, -12, 108], [31, 5, 122], [-7, -8.5, 70], [-25, 10, 131], [-31, -13.5, 139]]) putVapour(p[0], p[1], p[2], 0.5);
    // two strings wheel across the face of the wall to either side of the mouth, their molecules ten metres apart
    for (let k = 0; k < 2; k++) { const sd = k ? -1 : 1, y0 = k ? -9 : 21;
      for (let i = 0; i < 7; i++) { const t = i / 6; putVapour(sd * (90 - 58 * t) + vrng.gauss() * 0.8, y0 - 17 * t + 9 * Math.sin(t * 3.1) + vrng.gauss() * 0.8, 120 - 34 * t, vrng.range(1.0, 1.5)); } }
    {
      // skeins, in every edition: wheeling ribbons of evenly spaced molecules to either side of the course, 78 m and more
      // from the entry, files climbing away over the brink toward the growing edges, and a high scatter against the sky;
      // the wall's hexagons stay countable between them. Thick is more streams reaching further back, never a cloud.
      const kq = detail * dens * (thick ? 1 : 0.6), nW = Math.max(8, Math.round(26 * kq)), nR = 6;
      for (let k = 0; k < nR; k++) {
        const side = k % 2 ? -1 : 1, tier = k >> 1;
        const cx = side * (92 + vrng.range(0, 26)), cy = 8 - 48 * tier + vrng.range(-8, 8), rho = vrng.range(32, 46);
        const a0 = vrng.range(0, 6.283), span = vrng.range(2.9, 4.2) * (vrng.chance(0.5) ? 1 : -1), zf = vrng.range(118, 138), zn = vrng.range(80, 96);
        for (let i = 0; i < nW; i++) {
          const t = (i + vrng.range(-0.2, 0.2)) / nW, a = a0 + span * t;
          putVapour(cx + Math.cos(a) * rho * 1.15 + vrng.gauss() * 1.4, cy + Math.sin(a) * rho * 0.7 + vrng.gauss() * 1.4, zf + (zn - zf) * t + vrng.gauss() * 1.5, vrng.range(1.2, 2.2));
        }
      }
      await ctx.yield();
      const nS = Math.max(12, Math.round(46 * kq));
      for (let k = 0; k < (thick ? 5 : 3); k++) {                    // files streaming up and away over the brink toward the growing edges
        const x0 = vrng.range(-150, 150), x1 = x0 * 0.5 + vrng.range(-60, 60), y1 = vrng.range(150, 210), z1 = vrng.range(420, 520);
        for (let i = 0; i < nS; i++) {
          const t = (i + vrng.range(-0.25, 0.25)) / nS, tt = t * t;
          putVapour(x0 + (x1 - x0) * t + vrng.gauss() * 2, 58 + 8 * t + (y1 - 66) * tt + vrng.gauss() * 2, 104 + (z1 - 104) * t, vrng.range(1.2, 2.6), true);
        }
      }
      await ctx.yield();
      const nH = Math.round(190 * kq);
      for (let i = 0; i < nH; i++) { putVapour(vrng.range(-190, 190), vrng.range(60, 118), vrng.range(96, 146), vrng.range(1.5, 3.5)); if ((i & 63) === 63) await ctx.yield(); }
    }
    const nVeil = Math.round(110 * (thick ? 2.4 : 1) * detail * dens);
    for (let i = 0; i < nVeil; i++) {
      const right = i % 4 !== 3;                                   // most of it over the right-hand side, a little far out on the left, high
      const vx = right ? vrng.range(-150, -34) : vrng.range(118, 160) + (rare ? 90 : 0), vy = right ? vrng.range(-14, 40) : vrng.range(26, 60) + (rare ? 50 : 0), vz = vrng.range(520, 900);   // (in the screw's edition the left ones stand off behind the hill)
      putVapour(vx, vy, right ? vz : 520 + (vz - 520) * 0.45, vrng.range(1.2, 3.5));   // the few on the left stay behind the fork
    }
    await ctx.yield();

    // ---- the guests: dumbbells of two Prussian-blue balls on one brass rod, turning in their cages
    const grng = rng.fork ? rng.fork('guests') : rng;
    const guest = (xl, yl, zl, range = 3) => {
      if (batch.guest) { batch.guest(xl, yl, zl, grng() * 97, range); return; }
      const dock = [9999, grng() * 97, 0.5, 0], len = 3.3;
      batch.ball(xl, yl, zl, 0, 0, len, 1.9, dock, 6, 0, 4, 1);
      batch.ball(xl, yl, zl, 0, 0, -len, 1.9, dock, 6, 0, 1, 1);
      batch.link(xl, yl, zl, 0, 0, len, 0, dock, 9999, 0);
      batch.link(xl, yl, zl, 0, 0, -len, 0, dock, 9999, 0);
    };
    { // the one beside the shaft at half way, in the next channel up and to the left: two Prussian-blue balls the size of
      // a little larger than an oxygen on one brass rod, turning and tapping (the darkest thing this world owns, large in its cage at u 0.34 to 0.36)
      const gd = [8500, 3.06 + 0 * grng(), 1.0, 0], hx = 3.3;      // (this seed's turning axis is the eye's line to the cage: the pair turns like a propeller, always broadside)
      const gD = new THREE.Vector3(0, 1, 0).cross(gDir).normalize();
      for (const sg of [1, -1]) {
        batch.ball(GUEST.x, GUEST.y, GUEST.z, gD.x * hx * sg, gD.y * hx * sg, gD.z * hx * sg, 2.3, gd, 6, 1, sg > 0 ? 4 : 1, 1);
        batch.link(GUEST.x, GUEST.y, GUEST.z, gD.x * hx * sg, gD.y * hx * sg, gD.z * hx * sg, 0, gd, 9999, 0);
      }
    }
    guest(-2 * DX, Y_SHAFT, 198 - OFF.z); guest(2 * DX, Y_SHAFT, 246 - OFF.z);   // (FIX 7: two channels off, not next to the flown one: no blue pair is cut by the frame as we pass)
    for (let i = 0, put = 0; i < 80 && put < 18; i++) {
      const ci = grng.int(-8, 8), cj = grng.int(-6, 4), x = ci * DX, y = ci * LAYER + cj * A_LAT, r = Math.hypot(x, y - Y_SHAFT);
      if (r < 20 || y > YB1 - 12 || y < YB0 + 12 || Math.abs(x) > XF - 12) continue;
      if (put % 3 === 0 || r > RT - 12) guest(x, y, zc0 + grng.range(9, 26)); else guest(x, y, grng.range(zc0 + 30, zE0 - 14));   // never in the open bay: a guest is caged
      put++;
    }
    // ---- ROUND 13: one column of the arm's own honeycomb left standing on the terrace, close on the right of the
    // course (PART.buildColumn: whole cells on the floor, on the first berth of its list that this visit's loose
    // molecules, course and ring leave clear; where none is clear, no column). It goes into this batch: no draw call and
    // no material of its own. The lines to the ring are read from world z 440 on (a point the course has on the
    // shaft's axis in every edition, short of the break-out).
    if (hero) {
      const course = [];
      for (let d = 0; d <= path.length; d += 0.5) { path.posAtDist(d, pv); course.push(pv.x - OFF.x, pv.y - OFF.y, pv.z - OFF.z); }
      await ctx.yield();
      await PART.buildColumn(ctx, batch, style, { course, ring: ringW.clone().sub(OFF), floorY: HA.floorY, sightZ: 440 - OFF.z, loose: [hero.loose, batch.loose], floor: hero.sprung });
      await ctx.yield();
    }
    const meshes = await batch.build(style, ctx);
    model.add(meshes.balls, meshes.links);
    await ctx.yield();

    // ---- the rest of the cliff, flat: one plane just behind the face ring (naves, deeper rings, the discs of sky),
    // which also draws the face itself beyond the built lattice
    const zFace = zc0 + 7.8, zWall = zc0 + 12.4;
    const RC = RT - 6;                                              // cells nearer the flown shaft than this are real to the far end
    const slabU = { ...U, uOff: { value: OFF }, uSlab: { value: new THREE.Vector4(zFace, RC, Y_SHAFT, 1e6) }, uFade: { value: new THREE.Vector3(1, 48, 104) }, uMode: { value: 0 } };
    const slabMat = new THREE.ShaderMaterial({ uniforms: slabU, vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    // inside that radius the same plane hides the real lattice from the hollow and lifts like haze as we come to the
    // mouth (a blended plane: its alpha is a uniform, nothing is switched); only the flown shaft is open from the start
    const deepU = { ...U, uOff: { value: OFF }, uSlab: { value: new THREE.Vector4(zFace, 1, Y_SHAFT, RC) }, uFade: { value: new THREE.Vector3(1, -2, -1) }, uMode: { value: 2 } };
    const deepMat = new THREE.ShaderMaterial({ uniforms: deepU, vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const zDeep = zWall;
    const deepGeo = new THREE.BufferGeometry();
    deepGeo.setAttribute('position', new THREE.Float32BufferAttribute([-90, Y_SHAFT - 90, zDeep, 90, Y_SHAFT - 90, zDeep, 90, Y_SHAFT + 90, zDeep, -90, Y_SHAFT - 90, zDeep, 90, Y_SHAFT + 90, zDeep, -90, Y_SHAFT + 90, zDeep], 3));
    deepGeo.setAttribute('aFace', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 1));
    const deep = new THREE.Mesh(deepGeo, deepMat); deep.frustumCulled = false; deep.renderOrder = 2; model.add(deep);
    // and deep inside, behind six real rings, the same painting once more as a backdrop: when the near plane has lifted
    // the eye looks into real naves and still never out through the far side of the built block (it goes like haze
    // itself as we come within 150 m of it, and is gone before the mouth fills the frame)
    const backU = { ...U, uOff: { value: OFF }, uSlab: { value: new THREE.Vector4(zFace, 1, Y_SHAFT, 1e6) }, uFade: { value: new THREE.Vector3(1, -2, -1) }, uMode: { value: 1 } };
    const backMat = new THREE.ShaderMaterial({ uniforms: backU, vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const zBack = zc0 + 86, BW = 250;
    const backGeo = new THREE.BufferGeometry();
    backGeo.setAttribute('position', new THREE.Float32BufferAttribute([-BW, Y_SHAFT - BW, zBack, BW, Y_SHAFT - BW, zBack, BW, Y_SHAFT + BW, zBack, -BW, Y_SHAFT - BW, zBack, BW, Y_SHAFT + BW, zBack, -BW, Y_SHAFT + BW, zBack], 3));
    backGeo.setAttribute('aFace', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 1));
    const back = new THREE.Mesh(backGeo, backMat); back.frustumCulled = false; back.renderOrder = 1; back.name = 'cliff backdrop'; model.add(back);
    const quads = [], qFace = [];
    const quad = (x0, x1, y0, y1, face) => { quads.push(x0, y0, zWall, x1, y0, zWall, x1, y1, zWall, x0, y0, zWall, x1, y1, zWall, x0, y1, zWall); for (let i = 0; i < 6; i++) qFace.push(face); };
    const YLO = -450 - OFF.y;
    quad(-420, -XF, YLO, YB1, 1); quad(XF, 420, YLO, YB1, 1); quad(-XF, XF, YLO, YB0, 1);
    quad(-XF, XF, YB0, YB1, 0);
    const slabGeo = new THREE.BufferGeometry();
    slabGeo.setAttribute('position', new THREE.Float32BufferAttribute(quads, 3));
    slabGeo.setAttribute('aFace', new THREE.Float32BufferAttribute(qFace, 1));
    const slab = new THREE.Mesh(slabGeo, slabMat); slab.frustumCulled = false; slab.renderOrder = 1; model.add(slab);

    // ---- the rampart round the shaft: a liner beyond the built rings, from behind the cliff's own depth to the root
    const linerCut = { value: zE2 };
    {
      const RL = (RT + 6) / 0.866, z0 = zc0 + 56, z1 = zE2, lp = [], lc = [];
      // a hexagonal tube, its top cut flat just under the brink
      const yT = YB1 - 3 - Y_SHAFT, xT = RL - yT / (RL * 0.866) * RL * 0.5;
      const TP = [[RL, 0], [xT, yT], [-xT, yT], [-RL, 0], [-RL / 2, -RL * 0.866], [RL / 2, -RL * 0.866]];
      for (let i = 0; i < 6; i++) {
        const x0 = TP[i][0], y0 = Y_SHAFT + TP[i][1], x1 = TP[(i + 1) % 6][0], y1 = Y_SHAFT + TP[(i + 1) % 6][1];
        lp.push(x0, y0, z0, x1, y1, z0, x1, y1, z1, x0, y0, z0, x1, y1, z1, x0, y0, z1); lc.push(0, 0, 0, 0, 0, 0);
      }
      // and a cap across the cliff's whole built width at the liner's near end, open only where the liner is: seen from
      // the mouth, what stands behind the real rings at the edges of the frame is the rampart's dim interior, not sky
      { const xa = XF + 160, ya = YB0 - 40, yb = YB1 - 3; lp.push(-xa, ya, z0, xa, ya, z0, xa, yb, z0, -xa, ya, z0, xa, yb, z0, -xa, yb, z0); lc.push(1, 1, 1, 1, 1, 1);
        // and a lid under the cliff's top layer, from behind the face ring to the cap: from inside, the eye never looks up and out through the top of the built block
        const zl = zc0 + 14, yl = yb - 11; lp.push(-xa, yl, zl, xa, yl, zl, xa, yl, z0, -xa, yl, zl, xa, yl, z0, -xa, yl, z0); lc.push(2, 2, 2, 2, 2, 2); }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aCap', new THREE.Float32BufferAttribute(lc, 1));
      const liner = new THREE.Mesh(lg, new THREE.ShaderMaterial({ uniforms: { ...U, uAxisY: { value: Y_SHAFT }, uRootZ: { value: zE2 + 14 }, uRL: { value: RL * 0.866 - 0.5 }, uTop: { value: YB1 - 3 - Y_SHAFT - 0.4 }, uCut: linerCut, uEye: skyU.uEye, uGap: { value: new THREE.Vector3(0.5236 * 64.171, (GUEST.z + 68) * 0.6124, 1) } }, vertexShader: LINER_VERT, fragmentShader: LINER_FRAG, side: THREE.DoubleSide }));
      liner.frustumCulled = false; liner.name = 'rampart liner'; model.add(liner);
    }
    // ---- the far arms of the crystal. They STAND: each is a flat plate on a snow crystal's plan (a 120 degree point,
    // side branches leaving at 60 degrees, growth steps as nested outlines), leaning back a little, flat rose with a
    // paler honeycomb, strongest at its point and gone into the haze before it reaches the horizon seam. Two rise
    // from one hub far beyond the ring, to either side of it; one more lies low, seen from above past the point.
    await ctx.yield();
    const aPos = [], aPl = [], aK = [];
    const tri = (pts, map, k, cs = 1) => { for (let i = 1; i < pts.length - 1; i++) for (const p of [pts[0], pts[i], pts[i + 1]]) { const w = map(p[0], p[1]); aPos.push(w[0], w[1], w[2]); aPl.push(p[0] * cs, p[1] * cs); aK.push(k[0] * (k[4] ? 1 - 0.2 * Math.pow(Math.min(1, Math.max(0, p[1] / k[4])), 1.5) : 1), k[1], k[2], k[3]); } };   // (an arm pales toward its tip)
    // one arm in its own plane: s along it from the hub, w across; nested outlines lie a few metres apart toward the eye
    // (a stellar dendrite: the arm tapers to its 120 degree point, side branches leave it at 60 degrees in pairs, shorter
    // toward the tip and each tapering to a point, the longer ones with branchlets at 60 degrees again; one growth step
    // is a nested outline in the plate's own plane, a little paler)
    let armCs = 1;
    const armPlan = (L, W, map, k, cs = armCs) => {
      [[1, 1, 1], [0.95, 0.66, 0.88]].forEach(([fl, fw, fk]) => {
        const l = L * fl, w = W * fw, kk = [k[0] * fk, k[1], k[2], k[3], k[4] || 0], push = (pts) => tri(pts, (x, sv) => map(sv, x, 0), kk, cs);
        push([[-w, 0], [-w * 0.45, l * 0.9], [0, l], [w * 0.45, l * 0.9], [w, 0]]);
        for (const side of [1, -1]) for (let j = 0; j < 7; j++) {
          const at = 0.2 + j * 0.105, s0 = L * at, lb = L * (0.30 * (1 - at) + 0.035) * fl * (j % 2 ? 0.74 : 1), wb = W * 0.36 * (1 - 0.5 * at) * fw;
          const Q = (u, v) => [side * (u * 0.866 + v * 0.5), s0 + u * 0.5 - v * 0.866];
          push([Q(0, -wb), Q(lb * 0.86, -wb * 0.42), Q(lb, 0), Q(lb * 0.86, wb * 0.42), Q(0, wb)]);
          if (j % 2 === 0 && j < 5) {
            const B = Q(lb * 0.5, 0), l2 = lb * 0.34, w2 = wb * 0.5;
            for (const e of [[0, 1], [side * 0.866, -0.5]]) {
              const n = [-e[1], e[0]], P = (u, v) => [B[0] + e[0] * u + n[0] * v, B[1] + e[1] * u + n[1] * v];
              push([P(0, -w2), P(l2 * 0.84, -w2 * 0.42), P(l2, 0), P(l2 * 0.84, w2 * 0.42), P(0, w2)]);
            }
          }
        }
      });
    };
    // a standing arm: hub (world), the horizontal direction from it toward the eye (fx, fz), lean back and roll in its plane
    const standArm = (hx, hy, hz, fx, fz, lean, roll, L, W, strength, yFoot, yTop, late) => {
      const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      const R = [fz, 0, -fx], Uv = [-fx * Math.sin(lean), Math.cos(lean), -fz * Math.sin(lean)];
      const es = [0, 1, 2].map((i) => Uv[i] * Math.cos(roll) + R[i] * Math.sin(roll)), ew = [0, 1, 2].map((i) => R[i] * Math.cos(roll) - Uv[i] * Math.sin(roll));
      armPlan(L, W, (s, w, lift) => [hx + es[0] * s + ew[0] * w + fx * lift, hy + es[1] * s + ew[1] * w, hz + es[2] * s + ew[2] * w + fz * lift], [strength, yFoot, yTop, late, L]);
    };
    const few = dens * detail < 0.6, jz = rng.range(-150, 150), jx = rng.range(-120, 120), hh = rng.range(0.95, 1.1);
    // four stand round the hollow, kilometres off and kilometres tall, each fainter than the one before it, their feet
    // lost in the seam of blue-white over rose; the ring stands in the clear sky between the two nearest
    // (FIX 6: each is a silhouette with weight: flat rose a plain step darker than the sky beside it, its honeycomb large enough to read small)
    armCs = 0.5;
    standArm(1250 + jx, -1400, 3900 + jz, -0.3, -1, 0.14, -0.2, 3000 * hh, 420, 1, -50, 300, 1);        // the nearest, to the left of the ring
    standArm(-1900 - jx, -1700, 5200 - jz, 0.35, -1, 0.14, 0.27, 3600 * hh, 480, 0.84, -50, 340, 1);       // the next, to the right, further off
    await ctx.yield();
    if (!few) { standArm(-3400, -1500, 3300, 0.72, -0.7, 0.14, 0.12, 2400 * hh, 380, 0.5, -50, 380, 1);    // and two more far out to either side
      standArm(3300, -1600, 4300, -0.6, -0.8, 0.14, -0.1, 2800 * hh, 400, 0.5, -50, 380, 1); }
    // and two nearer and smaller, the strongest, directly behind the upright ring to either side of it: the ring stands framed between them
    armCs = 1;
    standArm(70 + jx * 0.3, -1000, 2600 + jz * 0.4, 0, -1, 0.14, -0.30, 1500 * hh, 190, 1, -60, 250, 1);
    standArm(-160 - jx * 0.3, -1150, 3100 - jz * 0.4, 0, -1, 0.14, 0.33, 1850 * hh, 215, 0.94, -60, 290, 1);
    armCs = 2.1;
    await ctx.yield();
    // the low arm lies flat, 300 to 500 m below, running out from under the point
    { const ax = 0.6, az = 0.8;
      armPlan(2300, 250, (s, w, lift) => [-900 + jx + ax * s - az * w, -330 + lift * 4, 1250 + jz + az * s + ax * w], [0.66, -1e5, -1e5 + 1, 0], 2.1);
      // and a second, lower still, crossing under it the other way: the hollow below the point is never an empty wash
      if (!few) armPlan(2100, 230, (s, w, lift) => [520 - jx - 0.75 * s - 0.66 * w, -430 + lift * 4, 1080 - jz + 0.66 * s - 0.75 * w], [0.5, -1e5, -1e5 + 1, 0], 2.1); }
    await ctx.yield();
    const farGeo = new THREE.BufferGeometry();
    farGeo.setAttribute('position', new THREE.Float32BufferAttribute(aPos, 3));
    farGeo.setAttribute('aPl', new THREE.Float32BufferAttribute(aPl, 2));
    farGeo.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 4));
    const farU = { ...U, uEye: skyU.uEye, uFar: { value: 1 } };
    const farMat = new THREE.ShaderMaterial({ uniforms: farU, vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, side: THREE.DoubleSide, depthWrite: false });
    const far = new THREE.Mesh(farGeo, farMat); far.frustumCulled = false; far.renderOrder = -5; far.name = 'far arms'; scene.add(far);
    await ctx.yield();

    // ---- the nearest springs as real wound wire (a pool that follows the eye)
    const pool = await makeHelixPool(style, ctx, Math.round(230 * (detail < 0.7 ? 0.6 : 1)));
    model.add(pool.mesh);
    await ctx.yield();

    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // (it lingers twice in the Shaft: beside the guest's cage, and as the nave's last ring frames the terrace)
    const pace = (u) => 0.6 + 0.6 * ss(0, 0.15, u) + 0.3 * ss(0.14, 0.24, u) - 0.7 * ss(0.29, 0.325, u) * (1 - ss(0.35, 0.385, u)) - 0.5 * ss(0.395, 0.425, u) * (1 - ss(0.445, 0.475, u)) - 0.75 * ss(0.56, 0.66, u) + 0.25 * ss(0.8, 0.9, u);
    // the zip clock (keyed to u): the first step's kink runs 27 m ahead of the eye while we fly low beside it, draws
    // ahead to 57 m as it reaches the corners so that both kinks of the fork stand in front of us, runs on to the end of
    // its row by u 0.83, and then the clock comes to the ring's own moment (HA.ringClock) at u 0.925, when the ring
    // stands over a quarter of the frame high
    const RC_T = HA.ringClock ?? 22, L3 = (Z_ROOT + 16 * RC_T - zAt(0.925) - 43) / ss(0.84, 0.94, 0.925);
    const lead = (u) => (rare ? 48 + 12 * ss(0.72, 0.8, u) : 27 + 22 * (1 - ss(0.56, 0.66, u)) + 40 * ss(0.665, 0.72, u) - 24 * ss(0.72, 0.8, u)) + L3 * ss(0.84, 0.94, u);   // (the screw's edition keeps one steady clock through the pass: its three kinks are timed to it)   // (from u 0.72 the clock lags a little: the ring's last molecule, 160 m out, flies 20 to 30 m ahead of the eye at u 0.79)
    const clockOf = (u) => HA.clockForCameraZ ? HA.clockForCameraZ(zAt(u) - OFF.z, lead(u)) : (zAt(u) + lead(u) - Z_ROOT) / 16;
    const tAt = new Float32Array(257);
    { let acc = 0; for (let i = 1; i <= 256; i++) { acc += 1 / Math.min(2.5, Math.max(0.35, pace((i - 0.5) / 256))); tAt[i] = acc; } for (let i = 1; i <= 256; i++) tAt[i] *= 42 / acc; }
    const timeAt = (u) => { const f = Math.min(1, Math.max(0, u)) * 256, i = Math.min(255, Math.floor(f)); return tAt[i] + (tAt[i + 1] - tAt[i]) * (f - i); };
    // the bars of daylight walk toward us at 2.5 m/s; one stands on the guest's cage at its beat (u 0.355)
    const BAR = U.uBar.value, barBase = 0.26 * BAR.w - (GUEST.x * BAR.x + GUEST.y * BAR.y + GUEST.z * BAR.z) - 2.5 * timeAt(0.34);
    // the relay runs up the right wall at 45 m/s: its hopping balls are 26 m ahead of the eye at u 0.25, having come from behind
    const relBase = (zAt(0.25) + 19 - OFF.z - U.uRelay.value.x) / Math.max(U.uRelay.value.y, 1) + 1.7 + 0.17 - timeAt(0.25);
    const kink = new THREE.Vector3(), kinkB = new THREE.Vector3(), gz1 = new THREE.Vector3(), gz2 = new THREE.Vector3();
    const pois = [
      // the entry looks up to the brink and the sky over it; by u 0.08 the gaze is level, into the mouth on the axis
      { at: new THREE.Vector3(0, 62, Z_CLIFF), from: 0, to: 0.075, weight: 0.5 },
      // in the nave the gaze goes to the right wall as the relay overtakes us there, then up and left to the guest in its cage
      // (the gaze swings right, along the wall in raking perspective, and holds the relay; then left to the guest, which it
      // follows as we come by, never further round than 45 degrees; then back down the axis for the window)
      { at: (time, u) => gz1.set(-RING, -0.5, zAt(u) + 15), from: 0.195, to: 0.299, weight: 0.93, fade: 0.385 },   // (each swing takes about 1.2 s, u 0.195 to 0.235 and 0.259 to 0.299, and the look back from the guest about 1 s: nothing over 45 degrees a second as flown)
      { at: (time, u) => gz2.set(GUEST.x + OFF.x, GUEST.y + OFF.y - 1.0, Math.max(GUEST.z + OFF.z, zAt(u) + 17)), from: 0.3, to: 0.385, weight: 0.76, fade: 0.29 },   // (FIX 7: a smaller turn: the far mouth stays whole in the frame beside the cage)
      { at: ringW.clone(), from: 0.53, to: 0.68, weight: 0.5 },   // coming down out of the rampart the gaze stays on the arm ahead, not on the floor
      { at: (time, u) => {
        const ck = clockOf(u);
        if (rare && HA.kink && HA.kinkB) { HA.kink(ck, kink).add(OFF); HA.kinkB(ck, kinkB).add(OFF); kink.lerp(kinkB, 0.4); kink.y += 3; return kink; }   // the screw: the gaze goes to the nearest turn's kink and the one above it
        if (!HA.kink) return kink.set(15, -25, ringW.z * u + 48);
        HA.kink(ck, kink).add(OFF);
        if (HA.kinkB) { HA.kinkB(ck, kinkB).add(OFF); kink.lerp(kinkB, 0.75 * ss(0.68, 0.715, u) * (1 - ss(0.75, 0.8, u))); }
        kink.y += 5 * ss(0.665, 0.705, u) * (1 - ss(0.76, 0.82, u));   // (over the row the gaze lifts a little: the fork and the far arm behind it, not the balls under the eye)
        return kink;
      }, from: rare ? 0.5 : 0.455, to: 0.86, weight: 0.6 },
      { at: ringW.clone(), from: 0.84, to: 1, weight: 0.3 },
    ];

    const size = new THREE.Vector2(), eye = new THREE.Vector3();
    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 34, sway: 0.35, bank: 0.25 },
      pois,
      // (the opening, while no next world shows in it, is the nave's own plum: the ring is one more cell of the wall; the look is held to the last 25 m)
      portal: { shape: 'circle', radius: 7, color: L[1], glow: 0, veil: '#' + new THREE.Color(L[2]).multiply(new THREE.Color().setRGB(0.10, 0.045, 0.085)).getHexString(), revealDistance: 280, tilt: false, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        U.uTime.value = time;
        U.uClock.value = clockOf(u);
        ctx.renderer.getDrawingBufferSize(size); U.uPxH.value = Math.max(100, size.y * 0.5);
        if (hero && hero.setClock) hero.setClock(U.uClock.value);
        if (hero && hero.update) hero.update(dt, time, camera, u);
        const me = camera.matrixWorld.elements;
        const pe = camera.projectionMatrix.elements;
        pool.update(eye.set(me[12] - OFF.x, me[13] - OFF.y, me[14] - OFF.z), me, 1 / Math.max(pe[0], 0.05), 1 / Math.max(pe[5], 0.05));
        // the bars of daylight are seen from inside the nave: they come up once the mouth's ring is behind us, and are gone again before the last ring frames the terrace
        U.uBarK.value.set(ss(Z_CLIFF + 6, Z_CLIFF + 46, me[14]) * (1 - ss(zE0 + OFF.z - 52, zE0 + OFF.z - 24, me[14])), barBase + 2.5 * timeAt(u));
        // the pool of daylight on the cliff draws in round the flown mouth as we come to it; the face beyond it steps a tone back
        U.uMouth.value.set(0.45 * ss(0.03, 0.075, u), 120 - 92.5 * ss(0.03, 0.078, u) - 15.5 * ss(0.125, 0.155, u), Y_SHAFT, 34 - 29 * ss(0.03, 0.078, u) + ss(0.125, 0.155, u));   // (the pool holds the mouth and its six neighbours, a rosette of seven, until the mouth beat)
        U.uRT.value = relBase + timeAt(u);
        // inside the nave no ball swells into a corner of the frame: within 17 m of the lens they draw in to nothing (not at the mouth's ring of six, not at the burst)
        const nk = ss(Z_CLIFF + 8, Z_CLIFF + 28, me[14]) * (1 - ss(Z_ROOT - 78, Z_ROOT - 44, me[14]));
        U.uNear.value.set(-2 + 12 * nk, -1 + 17 * nk);
        // close to the cliff the painted plane lifts altogether: at the mouth nothing flat stands at the edges of the frame
        const lift = 150 * (1 - ss(18, 74, zWall + OFF.z - me[14]));
        slabU.uFade.value.set(1, 48 + lift, 104 + lift);
        linerCut.value = zE2 - 40 * ss(Z_ROOT - 118, Z_ROOT - 78, me[14]);
        farU.uFar.value = ss(0.33, 0.42, u);                        // the far arms stand out as we come out along the point
        deepU.uFade.value.x = ss(72, 132, zFace - eye.z);
        backU.uFade.value.x = ss(104, 152, zBack - eye.z);
        U.uTime.value = time;
      },
      dispose() { if (hero && hero.dispose) hero.dispose(); },
      heroError,
    };
  },
};
