// OLD LIGHT ARRIVING, the life of the country: lamps and held globes (one sprite program), boats, houses, people, second shadows.
// Everything here stands in the unmirrored frame under the world group. Things on boats take their place from the boat's own course.
import * as THREE from 'three';
import { clamp, smoothstep } from '../kit/core.js';
import { LIGHT_GLSL, TOWN_LIT_GLSL, STAR_DIR, TAN_EL, groundH, starLit, southH, waterD, southG, terraceK, QUAY_Z, CREST_Z, BOWL, AXIS, bowlXZ, DEG, RIVER } from './old-light-arriving-common.js';

// ---- where a boat is. Lying still (s.y = 1): place m.xy, heading m.z. Under way (s.y = 0): on the fleet's course, which is the RIVER'S
// own: out of the arm that lies east behind the right bank below the entry, round that bend, up the lower river in the lane x = m.x,
// round the inside of the upper bend, west along the reach and the cut beyond it, round the cut's corner and south into the mooring pool
// behind the left bank's upland. m.y is the boat's start along that course, m.z its speed. The fleet goes one way, so its course has
// two ends, and each lies inside a BOAT HALL (walls and a roof, built in the country part): one over the arm's north half, out of whose
// mouth the boats come, and one over the whole mooring pool, into which they go. The course wraps from the far end of the one to the
// far end of the other, under roofs. No boat is ever scaled, faded or hidden by any other means. m.w is the phase of its rocking.
// p: a point of the boat's own frame, bow toward -Z.
const V = RIVER, f1 = (v) => v.toFixed(1);
export const BOAT_GLSL = /* glsl */`
vec3 fleetCourse(float o, float d, out float hd){
  float Rp = 120. - o, R = max(120. + o, 1.), B = Rp*1.5708, D = R*1.5708;
  if (d < ${f1(V.ARM)}) { hd = 1.5708; return vec3(${f1(120 + V.ARM)} - d, 0., ${f1(V.ZB)} + Rp); } d -= ${f1(V.ARM)};
  if (d < B) { float f = d/Rp; hd = 1.5708 - f; return vec3(120. - Rp*sin(f), 0., ${f1(V.ZB)} + Rp*cos(f)); } d -= B;
  if (d < ${f1(V.ZB + 40)}) { hd = 0.; return vec3(o, 0., ${f1(V.ZB)} - d); } d -= ${f1(V.ZB + 40)};
  if (d < D) { float th = d/R; hd = th; return vec3(-120. + R*cos(th), 0., -40. - R*sin(th)); } d -= D;
  if (d < ${f1(V.XK - 120)}) { hd = 1.5708; return vec3(-120. - d, 0., -40. - R); } d -= ${f1(V.XK - 120)};
  if (d < D) { float ps = d/R; hd = 1.5708 + ps; return vec3(-${f1(V.XK)} - R*sin(ps), 0., -40. - R*cos(ps)); } d -= D;
  hd = 3.14159265; return vec3(-${f1(V.XK)} - R, 0., -40. + d);
}
float fleetLen(float o){ return ${f1(V.ARM + V.ZB + 40 + V.XK - 120 + V.ZE + 40)} + 1.5708*(360. + o); }
vec3 boatPoint(vec3 p, vec4 m, vec4 s){
  vec3 c; float hd;
  if (s.y > .5) { c = vec3(m.x, 0., m.y); hd = m.z; }
  else { c = fleetCourse(m.x, mod(m.y + m.z*uTime, fleetLen(m.x)), hd); }
  p *= s.x;
  float ph = m.w, k = step(.5, s.z);                                                               // s.z = 1: it floats (rocks); 0: it stands on land
  p.y += k * (p.x*.022*sin(uTime*.7 + ph) + p.z*.012*sin(uTime*.53 + ph*1.7) + .06*sin(uTime*.9 + ph));
  float ch = cos(hd), sh = sin(hd);
  return c + vec3(p.x*ch + p.z*sh, p.y, -p.x*sh + p.z*ch);
}`;
// the length of the course in lane o, and where a boat is d metres along it: [x, z, heading] (the same arithmetic as the shader's)
export const fleetLength = (o) => V.ARM + V.ZB + 40 + V.XK - 120 + V.ZE + 40 + (Math.PI / 2) * (360 + o);
export function fleetAt(o, d) {
  const Rp = 120 - o, R = Math.max(120 + o, 1), B = Rp * Math.PI / 2, D = R * Math.PI / 2;
  if (d < V.ARM) return [120 + V.ARM - d, V.ZB + Rp, Math.PI / 2]; d -= V.ARM;
  if (d < B) { const f = d / Rp; return [120 - Rp * Math.sin(f), V.ZB + Rp * Math.cos(f), Math.PI / 2 - f]; } d -= B;
  if (d < V.ZB + 40) return [o, V.ZB - d, 0]; d -= V.ZB + 40;
  if (d < D) { const th = d / R; return [-120 + R * Math.cos(th), -40 - R * Math.sin(th), th]; } d -= D;
  if (d < V.XK - 120) return [-120 - d, -40 - R, Math.PI / 2]; d -= V.XK - 120;
  if (d < D) { const ps = d / R; return [-V.XK - R * Math.sin(ps), -40 - R * Math.cos(ps), Math.PI / 2 + ps]; } d -= D;
  return [-V.XK - R, -40 + d, Math.PI];
}

// ---- lamps and held lights: instanced cards that turn to the eye's place. TWO KINDS OF LIGHT, ONE LAW OF SIZE, declared once here.
// A FLAME (a lamp on a post, a mast, a line, a brazier; the cores of the lamp floats; the fliers' lamps) is a small body LAMP_TRUE (120)
// times brighter than the picture can show. A HELD LIGHT (what a watcher holds low in the lap or the hands) is a PLAIN SMALL AMBER GLOBE,
// HELD times the layout's size in radius (a hand's breadth to a forearm across), its skin GLOBE_SKIN times the item's strength: a
// thing of true size at every distance, seen close to as a glowing ball, brightest at its middle and amber toward its limb.
// THE LAW OF SIZE, for both: a card is never drawn smaller than a pixel and a half across (antialiasing); where it is widened its light
// is cut by EXACTLY the square of the ratio, so every light gives its true light at every distance, a far crowd is the true mean of its
// lights, and no light gains by distance. The picture shows no more than LAMP_LIMIT of any light. Nothing here is held or switched by
// distance or by size.
export const LAMP_TRUE = 120, LAMP_LIMIT = 3.5, FLAME = 0.55;      // FLAME: a flame's own size, as a share of the lamp sizes the layout gives
export const HELD = 2, GLOBE_SKIN = 10;
export const LAMP_GLSL = /* glsl */`
// r2: the square of the distance from the light's middle in units of its (widened) radius; light: its strength times the share of the
// card's area that is the light itself; halo: the glass and the air round it; globe: 1 for a held globe, 0 for a flame
vec3 lampLight(float r2, float light, float halo, float globe){
  float q = clamp(r2, 0., 60.), flame = light * ${LAMP_TRUE}. * exp(-q*1.6);
  float lm = clamp(1. - q, 0., 1.), skin = light * ${GLOBE_SKIN}. * lm * sqrt(lm);                          // brightest at its middle, amber toward its limb
  float x = mix(flame, skin, globe);
  return vec3(1., .44, .095) * (${LAMP_LIMIT} * (1. - exp(-x/${LAMP_LIMIT})) + halo * light * exp(-q*.42));
}`;
// items: [{ p: [x,y,z] (own frame), size, bright, ph, m: [..4], s: [scale, still, floats, 0], sway }]
// opts: { mirror: the image in the water (y -> -y, drawn long and broken by the ripples; its light spread over its length), gain }
export const ONE_TRI = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
export function makeSprites(LU, RU, items, opts = {}) {
  const n = items.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(ONE_TRI, 3));      // (one triangle that holds the card's square: a light's card is dark outside its round, so the corners cost nothing to see and half the triangles)
  const aP = new Float32Array(n * 4), aQ = new Float32Array(n * 4), aM = new Float32Array(n * 4), aS = new Float32Array(n * 4);
  // (a held globe's radius is its own: between 0.8 and 1.2 of the kind's, by the item's own phase)
  items.forEach((it, i) => { aP.set([it.p[0], it.p[1], it.p[2], it.size >= 0.15 ? it.size * FLAME : it.size * HELD * (0.8 + 0.4 * (((it.ph || 0) * 3.7) % 1))], i * 4); aQ.set([it.bright, it.ph || 0, it.sway || 0, it.size >= 0.15 ? 1 : 0], i * 4); aM.set(it.m || [0, 0, 0, 0], i * 4); aS.set(it.s || [1, 1, 0, 0], i * 4); });
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4));
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = n;
  const LONG = 5;      // the image in the water is drawn this many times longer than wide
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uRes: RU.uRes, uGain: { value: opts.gain ?? 1 }, uHalo: RU.uHalo || { value: 0.1 } }, defines: opts.mirror ? { MIRROR: 1 } : {}, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`attribute vec4 aP, aQ, aM, aS; uniform vec2 uRes; uniform float uGain; varying vec2 vQ; varying float vB, vD, vPh, vGlobe; ${LIGHT_GLSL} ${opts.pointGLSL || BOAT_GLSL}
      void main(){ vec3 p = boatPoint(aP.xyz, aM, aS);
        // a lamp on a line or a tether sways with the wind (aQ.z metres at most)
        p.xz += aQ.z * vec2(sin(uTime*.9 + aQ.y) + .4*sin(uTime*2.3 + aQ.y*1.7), .6*sin(uTime*.7 + aQ.y*2.1));
        vec4 w = modelMatrix*vec4(p, 1.); float sy = 1.;
        #ifdef MIRROR
          w.y = -w.y; sy = ${LONG}.;
        #endif
        vec4 mv = viewMatrix*w; float px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5);   // metres under one pixel there
        float size = aP.w * aS.x; vec2 least = olaLeast(size, px); float rad = least.x, share = least.y / sy;      // (the one law of the least pixel, in the common part)
        vQ = position.xy; float flame = aQ.w; vGlobe = 1. - flame;                                          // a lamp's flame gutters; a held globe is a steady light
        vB = aQ.x * share * uGain * (1. - flame*.22 + (.06 + .2*flame)*sin(uTime*(3.+3.*fract(aQ.y)) + aQ.y*7.) * (.6 + .4*sin(uTime*1.3 + aQ.y*3.))); vD = -mv.z; vPh = aQ.y;
        mv.xy += position.xy * rad * 3. * vec2(1., sy);
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`uniform float uHalo; varying vec2 vQ; varying float vB, vD, vPh, vGlobe; ${LIGHT_GLSL} ${LAMP_GLSL}
      void main(){ vec2 q = vQ*3.;
        #ifdef MIRROR
          float yy = q.y*${LONG}.;                                                                  // along the image, in card units
          q.x += .45*sin(yy*1.7 + uTime*2.1 + vPh) * smoothstep(0., 2., abs(yy));                   // the water breaks the lamp's image into a wobbling streak
          float brk = .25 + .75*smoothstep(-.3, .5, sin(yy*2.6 - uTime*2.7 + vPh*3.) + .6*sin(yy*.9 + uTime*1.1 + vPh));      // and into pieces
          float r2 = q.x*q.x + q.y*q.y; vec3 c = lampLight(r2, vB * brk, 0., vGlobe) * .45;
        #else
          float r2 = dot(q, q); vec3 c = lampLight(r2, vB, uHalo, vGlobe);
        #endif
        if (max(abs(vQ.x), abs(vQ.y)) > 1.) discard;
        c *= (1. - smoothstep(5., 9., r2));
        gl_FragColor = vec4(c * exp(-vD*vD*uFogDen*uFogDen*.5), 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = opts.mirror ? 2 : 3;
  if (opts.sphere) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(opts.sphere[0], opts.sphere[1], opts.sphere[2]), opts.sphere[3]); else mesh.frustumCulled = false;
  return { object: mesh, material: mat, count: n };
}

// ---- boats. Three hulls, each one merged geometry: vertices carry a colour and a part (0 hull, 1 deck, 2 cloth that billows, 3 a lit strip).
function loft(G, stations, part) {      // stations: [{ z, half, deck, keel }]: a hull lofted bow to stern with sheer and a darker waterline
  const { P, N, C, K, I } = G, HULL = [0.115, 0.11, 0.12], WL = [0.045, 0.045, 0.055], DECK = [0.2, 0.17, 0.135]; let prev = null;
  for (const st of stations) { const row = [];
    for (const [x, y, c, nx, ny, pt] of [[-st.half, st.deck, DECK, 0, 1, 1], [-st.half, st.deck, HULL, -1, 0.2, 0], [-st.half * 0.86, 0.35, WL, -1, 0.1, 0], [-st.half * 0.7, -0.3, WL, -0.8, -0.5, 0],
      [st.half * 0.7, -0.3, WL, 0.8, -0.5, 0], [st.half * 0.86, 0.35, WL, 1, 0.1, 0], [st.half, st.deck, HULL, 1, 0.2, 0], [st.half, st.deck, DECK, 0, 1, 1]]) {
      P.push(x, y, st.z); N.push(nx, ny, 0); C.push(c[0], c[1], c[2]); K.push(pt === 1 ? part : 0); row.push(P.length / 3 - 1); }
    if (prev) { for (const k of [1, 2, 4, 5]) I.push(prev[k], prev[k + 1], row[k], prev[k + 1], row[k + 1], row[k]); I.push(prev[0], row[0], prev[7], row[0], row[7], prev[7]); }      // (wound with the normals stored above: see woundAgainst)
    prev = row; }
}
function box(G, x0, x1, y0, y1, z0, z1, col, part = 0) {
  const { P, N, C, K, I } = G, f = (pts, n) => { const b = P.length / 3; for (const p of pts) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); K.push(part); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  f([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]); f([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
  f([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]); f([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
  f([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]);
}
function sheet(G, nx, nz, at, col, part) {      // a cloth: at(u, v) -> [x, y, z]
  const { P, N, C, K, I } = G, b = P.length / 3;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const p = at(i / nx, j / nz); P.push(p[0], p[1], p[2]); N.push(0, 1, 0); C.push(col[0], col[1], col[2]); K.push(part); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i; I.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }      // (a level cloth's upper side is its front)
}
const newG = () => ({ P: [], N: [], C: [], K: [], I: [] });
// A SOLID IS WOUND WITH ITS NORMALS. Both solid shaders turn the stored normal over on a face seen from its back (so that a thin cloth
// is lit on both of its sides); a triangle wound against the normal it stores is therefore lit as its own far side: a deck as a
// ceiling, a hull on the flank turned from the star. Every builder below winds with its normals, and every geometry the builders
// finish is counted here: build() THROWS if one triangle is wound against the normal it stores. (A cloth that stands on edge stores
// an upward normal, which its triangles are neither with nor against: only a triangle more than a quarter against its normal counts.)
export function woundAgainst(P, N, I) { let bad = 0;
  for (let i = 0; i < I.length; i += 3) { const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx, gl = Math.hypot(gx, gy, gz);
    const nx = N[a] + N[b] + N[c], ny = N[a + 1] + N[b + 1] + N[c + 1], nz = N[a + 2] + N[b + 2] + N[c + 2], nl = Math.hypot(nx, ny, nz);
    if (gl > 1e-9 && nl > 1e-9 && gx * nx + gy * ny + gz * nz < -0.25 * gl * nl) bad++; }
  return bad; }
export function assertWound(P, N, I, what) { const bad = woundAgainst(P, N, I);
  if (bad) throw new Error(`old-light-arriving: ${bad} of ${I.length / 3} triangles of ${what} are wound against the normals they store`); }
const toGeo = (G, what = 'a solid') => { assertWound(G.P, G.N, G.I, what); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(G.C, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(G.K, 1)); g.setIndex(G.I); return g; };
const CLOTH = [0.21, 0.22, 0.27], TIMBER = [0.06, 0.05, 0.05];
// a river barge, 44 m by 9 (scaled 0.7 to 1.35): low, with a cloth canopy on posts and one short mast for its lamp strings
function bargeGeometry() {
  const G = newG(), st = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10, z = -22 + 44 * t, e = Math.abs(2 * t - 1); st.push({ z, half: 4.5 * Math.pow(Math.max(1 - Math.pow(e, 3.2), 0.02), 0.6), deck: 1.5 + 1.1 * Math.pow(e, 2.4) * (t < 0.5 ? 1 : 0.6) }); }
  loft(G, st, 1);
  for (const z of [-7, 1, 9]) for (const x of [-3.6, 3.6]) box(G, x - 0.12, x + 0.12, 1.5, 4.4, z - 0.12, z + 0.12, TIMBER);
  sheet(G, 4, 5, (u, v) => [-4.1 + 8.2 * u, 4.4 + 0.9 * Math.sin(Math.PI * u), -8 + 18 * v], CLOTH, 2);
  box(G, -0.16, 0.16, 1.5, 12, -13.2, -12.8, TIMBER);
  box(G, -1.6, 1.6, 1.5, 3.4, 13, 18, [0.13, 0.12, 0.12]);
  return toGeo(G);
}
// a small sailing boat, 10 m: one soft sail and a masthead lamp
function sailGeometry() {
  const G = newG(), st = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7, z = -5 + 10 * t, e = Math.abs(2 * t - 1); st.push({ z, half: 1.5 * Math.pow(Math.max(1 - Math.pow(e, 2.6), 0.02), 0.6), deck: 0.8 + 0.5 * Math.pow(e, 2.2) }); }
  loft(G, st, 1);
  box(G, -0.07, 0.07, 0.8, 9.4, -1.1, -0.9, TIMBER);
  sheet(G, 3, 4, (u, v) => [0.05 + 0.5 * Math.sin(Math.PI * v) * Math.sin(Math.PI * u), 2 + 6.6 * v, -0.8 + (4.6 - 3.4 * v) * u], [0.3, 0.31, 0.36], 2.5);
  return toGeo(G);
}
// the great barge, 90 m, of three lit decks, lying at the quay
function greatGeometry() {
  const G = newG(), st = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, z = -45 + 90 * t, e = Math.abs(2 * t - 1); st.push({ z, half: 9 * Math.pow(Math.max(1 - Math.pow(e, 4), 0.02), 0.6), deck: 2.4 + 1.4 * Math.pow(e, 2.6) }); }
  loft(G, st, 1);
  const PALE = [0.3, 0.3, 0.34];
  for (const [w, z0, z1, y] of [[7.4, -34, 34, 2.4], [6.2, -27, 27, 6.2], [5, -19, 20, 10]]) {
    box(G, -w, w, y, y + 0.5, z0, z1, PALE); box(G, -w + 0.3, w - 0.3, y + 0.5, y + 3.1, z0 + 0.5, z1 - 0.5, [1, 1, 1], 3); box(G, -w - 0.9, w + 0.9, y + 3.1, y + 3.5, z0 - 1.2, z1 + 1.2, [0.11, 0.1, 0.11]);
  }
  box(G, -0.25, 0.25, 13.5, 24, -6.3, -5.7, TIMBER);
  return toGeo(G);
}
export const BOATS = { barge: { len: 44, beam: 9, top: 12 }, sail: { len: 10, beam: 3, top: 9.4 }, great: { len: 90, beam: 18, top: 24 } };
export const boatGeometry = (kind) => (kind === 'barge' ? bargeGeometry() : kind === 'sail' ? sailGeometry() : greatGeometry());
// one draw for all craft (boats, houses) of one geometry: items [{ m: [..4], s: [scale, still, floats, tint], lit: star's light on it 0..1, y: its foot's height }]
export function makeCraft(LU, geo, items, sphere, pointGLSL, opts = {}) {
  const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; for (const k of ['position', 'normal', 'color', 'aPart']) g.setAttribute(k, geo.getAttribute(k));
  const aM = new Float32Array(items.length * 4), aS = new Float32Array(items.length * 4); items.forEach((it, i) => { aM.set(it.m, i * 4); aS.set(it.s, i * 4); });
  const aL = new Float32Array(items.length * 2); items.forEach((it, i) => { aL[i * 2] = it.lit || 0; aL[i * 2 + 1] = it.y || 0; });
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aL', new THREE.InstancedBufferAttribute(aL, 2)); g.instanceCount = items.length;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU }, side: THREE.DoubleSide, defines: opts.house ? { HOUSE: 1 } : {},
    vertexShader: /* glsl */`attribute vec3 color; attribute float aPart; attribute vec4 aM, aS; attribute vec2 aL; varying vec3 vW, vN, vCol, vL, vNL; varying float vPart, vTint, vLit; ${LIGHT_GLSL} ${TOWN_LIT_GLSL} ${pointGLSL || BOAT_GLSL}
      void main(){ vec3 p = position; float cloth = step(1.5, aPart) * step(aPart, 2.7), skin = step(5.5, aPart);
        p += skin * normal * .12 * sin(uTime*.8 + p.z*.21 + aM.w) * sin(p.z*.07 + 1.);                 // a sewn envelope breathes a little
        p.y += cloth * (.16*sin(uTime*1.7 + p.z*.9 + aM.w) + .1*sin(uTime*2.9 + p.x*1.3)) * (aPart > 2.2 ? 0. : 1.);      // the canopy lifts and falls
        p.x += step(2.2, aPart) * step(aPart, 2.7) * .35*sin(uTime*1.3 + p.y*.7 + aM.w) * smoothstep(2., 6., p.y);       // the sail breathes
        vec3 a = boatPoint(p, aM, aS), b = boatPoint(p + normal, aM, aS); a.y += aL.y; b.y += aL.y;
        vLit = aS.y > .5 ? aL.x : olaTownLit(boatPoint(vec3(0.), aM, aS));      // (a craft that stands or lies still carries the star's light found at its place in the build; one under way finds it where it is: the town's hill's shade law)
        vec4 w = modelMatrix*vec4(a, 1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*(b - a)); vCol = color; vL = position; vNL = normal; vPart = aPart; vTint = aS.w;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN, vCol, vL, vNL; varying float vPart, vTint, vLit; ${LIGHT_GLSL}
      void main(){ if (vW.y < -.02) discard;
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 alb = vCol * (.8 + .4*vTint);
        float fwX = fwidth(vL.x), fwY = fwidth(vL.y), fwZ = fwidth(vL.z);                              // (every derivative is taken here, before any branch)
        float deck = step(.5, vPart) * step(vPart, 1.5), fine = clamp(1.3 - 3.*fwX, 0., 1.);
        alb *= 1. - .25*deck*fine*step(.86, fract(vL.x*2.2));                                      // deck planks
        float roof = step(3.5, vPart) * step(vPart, 4.5), wall = step(4.5, vPart);
        float fineR = clamp(1.2 - 4.*(fwX + fwZ), 0., 1.);
        alb *= 1. - .16*roof*fineR*step(.8, fract((abs(vNL.x) > .3 ? vL.z : vL.x)*1.25));            // roof ribs, down the slope
        alb *= 1. - .1*roof*clamp(1.2 - 5.*fwY, 0., 1.)*step(.82, fract(vL.y*3.1));                   // and the tiles' courses across it
        alb = mix(alb, vec3(.5,.54,.62), uSnow * roof * step(.3, n.y));                             // snow on the roofs
        vec3 Ve = olaW(cameraPosition) - vW, Vn = Ve / max(length(Ve), 1e-3);
        float rim = 1. - abs(dot(n, Vn)); rim *= rim*rim;                                           // the turn of a hull, a roof's edge, an envelope's flank
        vec3 c = alb * olaLight(n, vLit) + alb * (uBandCol*.9 + uStarCol*vLit*.8) * rim;              // (a faint cool rim from the far side's light and the star's)
        #ifdef HOUSE
          c += vCol * vec3(1., .44, .095) * .55 * step(n.y, -.5) * (1. - roof) * (1. - wall);       // the eaves' undersides take the windows' and the lamps' amber
          c += vCol * vec3(1., .44, .095) * .1 * step(.5, n.y) * (1. - roof) * (1. - wall);         // and the plinth before the door
        #else
          c += vCol * vec3(1., .44, .095) * .35 * deck;                                             // a deck lies in its own lamps' light
        #endif
        if (vPart > 2.7 && vPart < 3.5) {                                                                         // the lit decks: wide amber openings between posts
          float bayD = floor(vL.z/3.4), post = step(.12, fract(vL.z/3.4)), sill = smoothstep(.0, .25, fract((vL.y - .4)/3.8));
          float bay = .55 + .45*sin(3.14159*clamp((fract(vL.z/3.4) - .12)/.88, 0., 1.));           // (the lamps hang in the middle of each bay: its light falls off toward the posts)
          c = vec3(1., .44, .095) * 1.3 * bay * post * sill * (.82 + .18*sin(uTime*3.1 + 6.2832*olaHash(vec2(bayD, floor(vTint*997.) + step(0., vL.x)*31.))));      // (the one amber, no brighter than a boat's lamp; each opening gutters at its own seeded phase)
        }
        c += vCol * step(1.5, vPart) * step(vPart, 2.7) * vec3(1., .44, .095) * .06;               // cloth takes a little of the lamps under it
        if (vPart > 5.5) {                                                                         // an airship's cloth: sewn in gores, the seams show
          // (the gore a point lies in is found from its place round the hull without an arc tangent: sixteen gores, by the signs and the
          // ratio of its two coordinates; the seam's width is given in metres from the footprint of a pixel on the hull's own coordinates)
          vec2 hq = vL.xy; float hr = max(length(hq), 1e-3); vec2 hu = hq / hr;
          float c4 = abs(hu.x*hu.x - hu.y*hu.y), s4 = abs(2.*hu.x*hu.y), c8 = abs(c4*c4 - s4*s4), s8 = abs(2.*c4*s4);      // the angle folded four times: sixteen equal gores
          float foldA = min(c8, s8) / max(max(c8, s8), 1e-3);                                      // 0 on a seam line, 1 between two seams
          float pxh = max(fwX + fwY, 1e-4), seamW = clamp(.14 + 4.8*pxh/hr, .14, .8);
          float seam = (1. - smoothstep(0., seamW, foldA)) * clamp(1.4 - pxh/(hr*.2), 0., 1.);
          float hoop = 1. - smoothstep(0., .25 + fwZ, abs(fract(vL.z/9. + .5) - .5)*9.);
          float pan = .93 + .07*olaHash(vec2(floor(4.*step(0., hu.x) + 2.*step(0., hu.y) + step(abs(hu.y), abs(hu.x))), floor(vL.z/9. + .5)));           // each panel takes the light a little differently
          c = vCol * pan * (1. - .3*max(seam, hoop*.6)) * (olaLight(n, vLit) + (uBandCol*.9 + uStarCol*vLit*.8) * rim);
          c += vCol * vec3(1., .44, .095) * .05 * (1. - smoothstep(-.9, .2, n.y));                           // its belly takes a little of the gondola's lamps
        }
        if (wall > .5 && vPart < 5.5) {                                                            // a house wall: pale stone between dark timber posts, and openings that are not alike
          float u = abs(vNL.z) > .5 ? vL.x : vL.z + 31.7, seed = floor(vTint*997.), bw = 2.1 + 1.3*fract(vTint*7.31);      // each house has its own bay
          float fy = mod(vL.y - .35, 3.1), bay = floor(u/bw), flo = floor((vL.y - .35)/3.1), fu = fract(u/bw);
          float aa = clamp((abs(vNL.z) > .5 ? fwX : fwZ)/bw*.6, 0., .2), ay = clamp(fwY*.9, 0., .6);
          float kind = olaHash(vec2(bay + flo*17., seed));                                         // what this opening is tonight: dark, a low window, a room lit low, or wide open
          float between = smoothstep(.07 - aa, .09 + aa, fu) * (1. - smoothstep(.91 - aa, .93 + aa, fu));
          float hi = kind < .36 ? 1.3 : 2.6, lo = kind < .36 ? .8 : .75;
          float open = between * smoothstep(lo - ay, lo + .1 + ay, fy) * (1. - smoothstep(hi - ay, hi + .1 + ay, fy)) * step(.22, kind);
          float dimmed = step(.36, kind) * step(kind, .62);                                        // a room lit low: the same opening, less light
          // an opening is a room seen into: brightest about its middle, falling off toward the frame; a pale stone sill under it; one
          // timber post down the middle of a wide one
          float pu = (fu - .5)/.42, pv = (fy - (lo + hi)*.5)/max((hi - lo)*.5 + .05, .1), pane = 1. - .62*clamp(pu*pu*.75 + pv*pv*.55, 0., 1.);
          float mull = 1. - .85*(1. - smoothstep(.014 + aa, .03 + aa, abs(fu - .5))) * step(.62, kind);
          float sill = between * smoothstep(lo - .2 - ay, lo - .16 + ay, fy) * (1. - smoothstep(lo - .02 - ay, lo + .02 + ay, fy)) * step(.22, kind);
          float bright = mix(1., .42, dimmed) * (.6 + .4*olaHash(vec2(bay*3.1 + flo, seed + 3.)));
          float post = 1. - between, beam = max(1. - smoothstep(.1, .16, fy), smoothstep(2.82, 2.9, fy));
          vec3 wallC = mix(mix(vec3(.31,.31,.34) * (.9 + .2*olaHash(vec2(bay, flo + seed))), vec3(.42,.43,.47), sill), vec3(.085,.07,.065), max(post, beam)) * (olaLight(n, vLit) + vec3(1., .44, .095)*.12);
          c = mix(wallC, vec3(1., .44, .095) * .95 * pane * mull * bright * (.86 + .14*sin(uTime*2.3 + 6.2832*olaHash(vec2(bay + flo*13., seed + 5.)))), open);
        }
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat);
  if (sphere) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(sphere[0], sphere[1], sphere[2]), sphere[3]); else mesh.frustumCulled = false;
  return { object: mesh, material: mat };
}

// ---- plain made things that stand still (stages, posts, poles): one merged mesh; colour and the star's light on it are per vertex
export function solidBuilder() {
  const G = { P: [], N: [], C: [], K: [], I: [] };
  return { G, box: (x0, x1, y0, y1, z0, z1, col, lit = 0) => box(G, x0, x1, y0, y1, z0, z1, col, lit),
    // an upright or leaning pole of square section from a to b
    pole: (a, b, w, col, lit = 0) => { const { P, N, C, K, I } = G, dx = b[0] - a[0], dz = b[2] - a[2], hl = Math.hypot(dx, dz), ux = hl > 1e-3 ? dx / hl : 1, uz = hl > 1e-3 ? dz / hl : 0;
      for (const [sx, sz] of [[ux, uz], [-uz, ux], [-ux, -uz], [uz, -ux]]) { const tx = -sz, tz = sx, s = P.length / 3;
        for (const [q, e] of [[a, -1], [a, 1], [b, 1], [b, -1]]) { P.push(q[0] + sx * w + tx * w * e, q[1], q[2] + sz * w + tz * w * e); N.push(sx, 0, sz); C.push(col[0], col[1], col[2]); K.push(lit); }
        I.push(s, s + 2, s + 1, s, s + 3, s + 2); } },
    // a soft mass (a far tree's crown): twenty faces with the normals of a ball. sway 1..7: it leans and comes back with the wind, at its own beat
    blob: (c, r, h, col, lit = 0, sway = 0) => { const { P, N, C, K, I } = G, b = P.length / 3, src = ICO.getAttribute('position');
      for (let i = 0; i < src.count; i++) { const x = src.getX(i), y = src.getY(i), z = src.getZ(i), f = 1 + 0.24 * Math.sin(x * 7.1 + y * 3.3 + z * 5.7 + c[0] * 1.3 + c[2] * 0.7);      // (no two crowns one shape: each corner stands in or out by the crown's own place)
        P.push(c[0] + x * r * f, c[1] + y * h * (0.85 + 0.15 * f), c[2] + z * r * f); N.push(x, y * 0.8 + 0.2, z); const k = 0.62 + 0.38 * (y * 0.5 + 0.5); C.push(col[0] * k, col[1] * k, col[2] * k); K.push(lit + 2 * sway); }
      for (let i = 0; i < src.count; i++) I.push(b + i); },
    geometry: () => toGeo(G) };
}
const ICO = new THREE.IcosahedronGeometry(1, 0);
export function makeSolid(LU, geo, wind = [0.9, -0.44]) {
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uWind: { value: new THREE.Vector2(wind[0], wind[1]).normalize() } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 color; attribute float aPart; uniform vec2 uWind; varying vec3 vW, vN, vCol; varying float vLit, vCrown; ${LIGHT_GLSL}
      void main(){ float sw = floor(aPart*.5 + .001); vLit = aPart - 2.*sw; vec3 p = position; vCrown = step(.5, sw);
        if (sw > .5) { float wt = .3 + .7*clamp((normal.y + .6)/1.6, 0., 1.);      // a crown in the wind: its top goes farthest
          p.xz += uWind * (.38*sin(uTime*1.1 + sw*1.3 + p.x*.05) + .16*sin(uTime*2.7 + sw*2.9 + p.z*.07)) * wt; }
        vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*normal); vCol = color; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN, vCol; varying float vLit, vCrown; ${LIGHT_GLSL}
      void main(){ if (vW.y < -.02) discard; vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        // a crown is leaves in clumps, not a smooth ball: lighter and darker masses, the snow lying on the upper clumps unevenly
        float leaf = olaNoise(vW.xz*.75 + vW.y*.6)*.6 + olaNoise(vW.xz*2.1 - vW.y*1.7)*.4, cr = step(.5, vCrown);
        vec3 alb = mix(vCol * mix(1., .62 + .8*leaf, cr), vec3(.5,.54,.62), uSnow * smoothstep(.45, .8, n.y + cr*.5*(leaf - .5)));
        vec3 Ve = olaW(cameraPosition) - vW, Vn = Ve / max(length(Ve), 1e-3); float rim = 1. - abs(dot(n, Vn));
        // (a crown has no outline of straight edges: toward its turning edge the leaves thin out raggedly, by the same clumps; only where
        // a clump is wider than a pixel)
        float nearC = clamp(1.6 - 1.2*(fwidth(vW.x) + fwidth(vW.z)), 0., 1.);
        if (cr > .5 && rim > mix(1.1, .34 + .7*olaNoise(vW.xz*.75 + vW.y*.6), nearC)) discard;
        rim *= rim;      // a crown's turning edge takes the far side's pearl, and the star's cold light where it is lit
        vec3 c = alb * (olaLight(n, vLit * olaBands(vW.xz)) + (uBandCol*1.1 + uStarCol*vLit) * rim + vec3(1., .44, .095) * .07 * (1. - smoothstep(-.6, .3, n.y)));      // (and from below a little of the lamps)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  return { object: new THREE.Mesh(geo, mat), material: mat };
}

// A PERSON IN OUTLINE, one law for every watcher of the world, on the tiers and off them (declared once). q: metres from the person's middle line and metres over the
// ground they sit or stand on; k: (size, 1 if standing, lean). A coat that widens downward, sloped shoulders, a hood: no face, no arms
// raised, nothing held up. Returns 1 inside.
export const PERSON_GLSL = /* glsl */`
float olaPerson(vec2 q, vec3 k){
  float sc = max(k.x, .3), x = abs(q.x - k.z*q.y) / sc, y = q.y / sc;
  float top = mix(.98, 1.62, k.y), sh = top - .3, hem = mix(.37, .25, k.y), shw = mix(.26, .215, k.y);
  float body = step(x, mix(hem, shw, smoothstep(.05, sh - .08, y)) * sqrt(clamp((sh + .04 - y)/.1, 0., 1.))) * step(0., y);
  float hood = step(x, mix(.2, .1, clamp((y - (sh - .06))/.2, 0., 1.))) * step(sh - .06, y) * step(y, top - .12);
  vec2 hc = vec2(x, y - (top - .14)); float head = step(dot(hc, hc), .0182);
  return max(body, max(hood, head)); }`;
// ---- people off the tiers (the rim walk, the notch's terraces, the hill, the country's terraces and quays, the decks): each is TWO
// UPRIGHT CARDS crossed on the person's own middle line, cut to the outline above: one across the bearing the person faces (breast and
// back), one along it (the profile, narrower). Everyone faces the one bearing every watcher faces (opts.face, on the map of the
// frame they stand in: the new star's). Winter cloth in five quiet colours; lit cold from the sky and the star, and warm by the globe
// the person holds, if they hold one (item.lamp), by the metres from it. No one moves: there is no time term here at all.
// items: [{ p: [x,y,z], h: height (over 1.4: standing), lit: the star's light on it, tint: 0..4, lamp: holds a globe, ph, m, s }]
export const CLOTHS = [[0.19, 0.2, 0.25], [0.23, 0.19, 0.2], [0.15, 0.18, 0.225], [0.25, 0.225, 0.22], [0.18, 0.21, 0.2]];
// the town's and the river's people (opts.cloths): slates and cool plums only, each with more blue in it than red; nothing warm, no border, no mark
export const TOWN_CLOTHS = [[0.19, 0.2, 0.25], [0.15, 0.18, 0.225], [0.17, 0.185, 0.23], [0.205, 0.18, 0.24], [0.185, 0.16, 0.215]];
// where the globe a person holds is: low at one side (which side, by the item's own phase), in the person's own frame
export const HELD_OUT = 0.3;
export const heldAt = (p, h, ph, face = [0, -1]) => { const sd = ((ph || 0) * 2.3) % 1 < 0.5 ? -1 : 1; return [p[0] - face[1] * sd * HELD_OUT, p[1] + (h > 1.4 ? 0.78 : 0.38), p[2] + face[0] * sd * HELD_OUT]; };
export function makeFigures(LU, items, opts = {}) {
  const P = [], I = [], face = opts.face || [0, -1];
  for (let c = 0; c < 2; c++) { const b = P.length / 3; P.push(-0.5, 0, c, 0.5, 0, c, 0.5, 1, c, -0.5, 1, c); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const n = items.length, aP = new Float32Array(n * 4), aC = new Float32Array(n * 4), aM = new Float32Array(n * 4), aS = new Float32Array(n * 4);
  const cloths = opts.cloths || CLOTHS;
  items.forEach((it, i) => { const col = cloths[it.tint % cloths.length], sd = ((it.ph || 0) * 2.3) % 1 < 0.5 ? -1 : 1; aP.set([it.p[0], it.p[1], it.p[2], it.h], i * 4); aC.set([col[0], col[1], col[2], it.lit ?? 0], i * 4); aM.set(it.m || [0, 0, 0, 0], i * 4);
    const s = it.s || [1, 1, 0, 0]; aS.set([s[0], s[1], s[2], it.lamp ? sd : 0], i * 4); });      // (the fourth: which hand holds a globe; 0: none)
  for (const [k, arr] of [['aP', aP], ['aC', aC], ['aM', aM], ['aS', aS]]) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uFace: { value: new THREE.Vector2(face[0], face[1]).normalize() } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aP, aC, aM, aS; uniform vec2 uFace; varying vec3 vW, vN, vT, vCol, vL; varying vec4 vK; varying vec2 vQ; varying float vWho; ${LIGHT_GLSL} ${BOAT_GLSL}
      void main(){ float h = aP.w, stand = step(1.4, h), sc = h / mix(.98, 1.62, stand), prof = position.z;
        vec2 ax = mix(vec2(-uFace.y, uFace.x), uFace, prof);                                       // the card's own direction on the map
        float wide = .94 * sc * mix(1., .72, prof); vQ = vec2(position.x * .94 * sc, position.y * h * 1.03);
        vec3 q = aP.xyz + vec3(ax.x, 0., ax.y) * position.x * wide + vec3(0., position.y * h * 1.03, 0.);
        vec3 a = boatPoint(q, aM, aS), b = boatPoint(q + vec3(-ax.y, 0., ax.x), aM, aS), t = boatPoint(q + vec3(ax.x, 0., ax.y), aM, aS);
        vec4 w = modelMatrix*vec4(a, 1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*(b - a)); vT = olaW(mat3(modelMatrix)*(t - a));
        vCol = aC.rgb; vL = q; vK = vec4(sc, stand, aS.w * (1. - prof), aC.a); vWho = olaHash(aP.xz*3.7 + aP.y); gl_Position = projectionMatrix*viewMatrix*w; }`,      // (vWho: who it is, by the person's own place)
    fragmentShader: /* glsl */`varying vec3 vW, vN, vT, vCol, vL; varying vec4 vK; varying vec2 vQ; varying float vWho; ${LIGHT_GLSL} ${PERSON_GLSL} ${opts.litGLSL || ''}
      void main(){ float fw = fwidth(vQ.x), seen = clamp(1.6 - 5.*fw, 0., 1.), stand = step(.5, vK.y);      // 1 where a person is wider than a few pixels
        float who = vWho, sc = vK.x * (who < .125 ? .72 : 1.);              // (a child one in eight)
        float inside = mix(step(abs(vQ.x), .17*sc) * step(vQ.y, mix(.9, 1.5, stand)*sc), olaPerson(vQ, vec3(sc, stand, (who - .5)*.08)), seen);
        if (inside < .5) discard;
        vec3 Ve = olaW(cameraPosition) - vW, n = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(n, Ve) < 0.) n = -n;
        n = normalize(n + normalize(vT + vec3(1e-4, 0., 0.)) * (vQ.x/(.3*sc)) * .8 * seen + vec3(0., .25, 0.));      // round the body a little
        float lit = ${opts.litGLSL ? 'bowlLit(vL)' : 'vK.w'};
        vec3 cl = vCol * (1. + .18 * seen * step(mix(.68, 1.32, stand)*sc, vQ.y));                    // (the hood a tone lighter)
        // the held globe's warm light, by the metres from it (it hangs low at one side; on the profile card it is beside the body)
        float hold = abs(vK.z), gy = vQ.y - mix(.38, .78, stand), gx = vQ.x - vK.z*${HELD_OUT};
        float warm = mix(.16 * hold, hold * 1.1/(1. + (gx*gx + gy*gy)/.06), seen);                    // (far off: the mean of a lit body)
        vec3 c = cl * (olaLight(n, lit) + vec3(1., .44, .095) * (.06 + warm));
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat);
  if (opts.sphere) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(opts.sphere[0], opts.sphere[1], opts.sphere[2]), opts.sphere[3]); else mesh.frustumCulled = false;
  return { object: mesh, material: mat, count: n };
}

// ---- wakes: the water a boat under way has just left. A wake is laid ALONG THE BOAT'S OWN COURSE (each station of it is the place the
// boat's stern was so many metres ago, so it bends where the course bends and is never a straight ray), it is broken into wavelets,
// and it dies away to nothing within WAKE metres astern. Its arms are bodies with a width: where an arm is thinner than the picture's
// grain it is drawn at the grain with its light cut by the ratio (its mean), never a bright wire.
// items: [{ m, s, stern: metres from the boat's middle to its stern }]
const WAKE = 52;
export function makeWakes(LU, items) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 1, 1, 8); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
  const n = items.length, aM = new Float32Array(n * 4), aS = new Float32Array(n * 4);
  items.forEach((it, i) => { aM.set(it.m, i * 4); aS.set([it.s[0], it.s[1], 0, it.stern], i * 4); });
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`attribute vec4 aM, aS; varying vec2 vQ; varying float vOn; varying vec3 vW; ${LIGHT_GLSL} ${BOAT_GLSL}
      void main(){ float u = (position.y + .5) * ${WAKE}., hd; vQ = vec2(position.x * (2.5 + .36*u), u);
        float d0 = mod(aM.y + aM.z*uTime, fleetLen(aM.x)), astern = (aS.w + u) * aS.x;               // metres of course behind the boat's middle
        vec3 p = fleetCourse(aM.x, max(d0 - astern, 0.), hd); vOn = step(astern, d0);                 // (a boat just come onto its course has laid no wake yet)
        p += vec3(cos(hd), 0., -sin(hd)) * vQ.x * aS.x; p.y = .04;
        vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vOn; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ float fx = fwidth(vQ.x), u = clamp(vQ.y, 0., ${WAKE}.), x = min(abs(vQ.x), 60.), e = 1.2 + .28*u, wd = .4 + .035*u, wide = max(wd, .75*fx), d = clamp((x - e)/wide, -8., 8.);
        float arm = exp(-d*d) * wd/wide * (.45 + .55*sin(u*1.7 - uTime*2.4 + x*.6)), inside = 1. - smoothstep(e*.55, e, x);
        float rip = .5 + .5*sin(u*1.15 - uTime*2.2 + x*.9);
        float a = (max(arm, 0.)*.5 + inside*rip*.2*exp(-u*.05) + inside*.45*exp(-u*.16)) * exp(-u*.055) * smoothstep(0., 2.5, u) * (1. - smoothstep(${(WAKE * 0.5).toFixed(1)}, ${WAKE}., u)) * vOn;
        float dist = length(vW - olaW(cameraPosition)), f = exp(-min(dist*dist*uFogDen*uFogDen, 60.));
        gl_FragColor = vec4((uHemiSky*.55 + uBandCol*.3) * a * f, 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 0.5;
  return { object: mesh, material: mat };
}

// ---- second shadows: soft-ended blades laid on the ground at the foot of uprights, all on one bearing (away from the star), each as
// long as its upright's top carried down the star's ray reaches. Three stations (foot, middle, tip) lie on the ground itself.
// items: [{ a: [x,y,z], b: [x,y,z], c: [x,y,z], w: half width at the foot, w1: half width at the tip, k: darkness 0..1 }]
export function makeBlades(LU, items, opts = {}) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 1, 1, 2); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
  const n = items.length, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4);
  items.forEach((it, i) => { aA.set([it.a[0], it.a[1], it.a[2], it.w], i * 4); aB.set([it.b[0], it.b[1], it.b[2], it.w1 ?? it.w], i * 4); aC.set([it.c[0], it.c[1], it.c[2], it.k ?? 1], i * 4); });
  for (const [k, arr] of [['aA', aA], ['aB', aB], ['aC', aC]]) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
  const side = opts.side ? new THREE.Vector3(opts.side[0], opts.side[1], opts.side[2]) : new THREE.Vector3(-STAR_DIR.z, 0, STAR_DIR.x).normalize();
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uSide: { value: side } }, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`attribute vec4 aA, aB, aC; uniform vec3 uSide; varying vec2 vQ; varying float vK; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ float s = position.y + .5; vec3 c = s < .25 ? aA.xyz : (s < .75 ? aB.xyz : aC.xyz);
        float hw = mix(aA.w, aB.w, s) * 1.6; c += uSide * position.x * hw; c.y += .07;
        vQ = vec2(position.x, s); vK = aC.w; vec4 w = modelMatrix*vec4(c, 1.); vW = olaW(w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vK; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ float soft = mix(.25, .9, vQ.y), e = 1. - smoothstep(1. - soft, 1., abs(vQ.x));      // the edge softens with the blade's length, as a moon shadow's does
        float a = .6 * uStar * vK * e * (1. - smoothstep(.6, 1., vQ.y)) * smoothstep(0., .02, vQ.y);
        float dist = length(vW - olaW(cameraPosition)); a *= exp(-dist*dist*uFogDen*uFogDen);
        gl_FragColor = vec4(vec3(.012, .018, .042), a); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { object: mesh, material: mat, count: n };
}

// ---- houses: broad low pavilions of pale stone and dark timber under plain shallow roofs with deep straight eaves. Four kinds, unlike in
// outline: a pavilion, a pavilion of two floors with a skirt roof between them, a broad pavilion with a small belvedere on its roof, a
// long hall. Front toward -Z. Parts: 0 stone and timber, 4 roof, 5 a wall of openings (drawn in the craft shader).
const PALE = [0.33, 0.335, 0.365], ROOF = [0.225, 0.235, 0.285], EAVE = [0.27, 0.28, 0.32], UNDER = [0.11, 0.095, 0.085];
const HOUSE_KINDS = [{ w: 13, d: 8, floors: 1 }, { w: 11, d: 8, floors: 2, skirt: true }, { w: 15, d: 8.4, floors: 1, bel: [6, 4.4] }, { w: 24, d: 7.5, floors: 1 }];
export function houseGeometry(v) {
  const G = newG(), K = HOUSE_KINDS[v], hw = K.w / 2, hd = K.d / 2, top = 0.35 + 3.1 * K.floors, { P, N, C, K: KK, I } = G;
  const face = (pts, col, part) => { const b = P.length / 3, a = pts[0], q = pts[1], r = pts[2], ux = q[0] - a[0], uy = q[1] - a[1], uz = q[2] - a[2], vx = r[0] - a[0], vy = r[1] - a[1], vz = r[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1, sg = (part === 4 ? ny < 0 : ny > 0) ? -1 : 1; nx *= sg / l; ny *= sg / l; nz *= sg / l;
    for (const p of pts) { P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); KK.push(part); }
    for (let i = 1; i < pts.length - 1; i++) { if (sg > 0) I.push(b, b + i, b + i + 1); else I.push(b, b + i + 1, b + i); } };      // (wound to agree with the normal it carries: the shader turns the normal of a face seen from behind)
  // a roof over a rectangle: the slab's pale edge, a dark underside, four plain slopes to a level ridge with its ridge stone
  const roof = (ex, ez, y0, pitch) => { const y1 = y0 + 0.28, yr = y1 + pitch * ez, rx = Math.max(ex - ez, 0.5);
    box(G, -ex, ex, y0, y1, -ez, ez, EAVE, 0);
    face([[-ex, y1, -ez], [ex, y1, -ez], [rx, yr, 0], [-rx, yr, 0]], ROOF, 4); face([[ex, y1, ez], [-ex, y1, ez], [-rx, yr, 0], [rx, yr, 0]], ROOF, 4);
    face([[-ex, y1, ez], [-ex, y1, -ez], [-rx, yr, 0]], ROOF, 4); face([[ex, y1, -ez], [ex, y1, ez], [rx, yr, 0]], ROOF, 4);
    face([[-ex, y0, -ez], [ex, y0, -ez], [ex, y0, ez], [-ex, y0, ez]], UNDER, 0);
    box(G, -rx - 0.3, rx + 0.3, yr - 0.05, yr + 0.2, -0.22, 0.22, EAVE, 0); return yr + 0.2; };
  box(G, -hw - 1.6, hw + 1.6, -2.5, 0.35, -hd - 2.4, hd + 1.2, PALE);                                    // the plinth (carried into the ground)
  box(G, -hw, hw, 0.35, top, -hd, hd, [0.5, 0.5, 0.5], 5);
  for (let x = -hw - 1.1; x <= hw + 1.11; x += (2 * hw + 2.2) / Math.round((2 * hw + 2.2) / 4.2)) box(G, x - 0.11, x + 0.11, 0.35, K.skirt ? 3.45 : top, -hd - 1.95, -hd - 1.73, TIMBER);      // the porch's posts
  if (K.skirt) { const y0 = 3.45, ex = hw + 2.3, ez = hd + 2.5, ix = hw + 0.05, iz = hd + 0.05, y1 = y0 + 0.24, yi = y0 + 1.0;      // a skirt roof round the house between its floors
    for (const [a, b, c, d] of [[[-ex, y1, -ez], [ex, y1, -ez], [ix, yi, -iz], [-ix, yi, -iz]], [[ex, y1, ez], [-ex, y1, ez], [-ix, yi, iz], [ix, yi, iz]], [[-ex, y1, ez], [-ex, y1, -ez], [-ix, yi, -iz], [-ix, yi, iz]], [[ex, y1, -ez], [ex, y1, ez], [ix, yi, iz], [ix, yi, -iz]]]) face([a, b, c, d], ROOF, 4);
    for (const [a, b, c, d] of [[[-ex, y0, -ez], [ex, y0, -ez], [ix, y0, -iz], [-ix, y0, -iz]], [[ex, y0, ez], [-ex, y0, ez], [-ix, y0, iz], [ix, y0, iz]], [[-ex, y0, ez], [-ex, y0, -ez], [-ix, y0, -iz], [-ix, y0, iz]], [[ex, y0, -ez], [ex, y0, ez], [ix, y0, iz], [ix, y0, -iz]]]) face([a, b, c, d], UNDER, 0);
    box(G, -ex, ex, y0, y1, -ez, -ez + 0.2, EAVE, 0); box(G, -ex, ex, y0, y1, ez - 0.2, ez, EAVE, 0); box(G, -ex, -ex + 0.2, y0, y1, -ez, ez, EAVE, 0); box(G, ex - 0.2, ex, y0, y1, -ez, ez, EAVE, 0); }
  let peak = roof(hw + (K.skirt ? 1.5 : 2.3), hd + (K.skirt ? 1.7 : 2.5), top, K.bel ? 0.12 : 0.2);
  if (K.bel) { const bw = K.bel[0] / 2, bd = K.bel[1] / 2, y0 = top + 0.28 + 0.12 * (hd + 2.5) * 0.45;      // the belvedere: a small lit room on the roof
    box(G, -bw, bw, y0 - 0.9, y0 + 2.75, -bd, bd, [0.5, 0.5, 0.5], 5);
    peak = roof(bw + 1.5, bd + 1.6, y0 + 2.75, 0.22); }
  G.top = peak;
  return Object.assign(toGeo(G), { userData: { top: peak } });
}
export const HOUSES = HOUSE_KINDS.map((K) => ({ w: K.w, d: K.d, top: 0.35 + 3.1 * K.floors + 0.28 + (K.bel ? 0.12 * (K.d / 2 + 2.5) * 0.45 + 2.75 + 0.28 + 0.22 * (K.bel[1] / 2 + 1.6) : 0.2 * (K.d / 2 + (K.skirt ? 1.7 : 2.5))) + 0.2 }));

// ---- thin things (lamp strings, sling lines, mooring lines): bands between two points that keep a pixel and a half, thinner in
// light where they are widened. items: [{ a: [x,y,z], b: [x,y,z], w: half width m, sag: m, m, s }]; both ends ride the craft they belong to.
export function makeLines(LU, RU, items, opts = {}) {
  const n = items.length, q = new THREE.PlaneGeometry(1, 1, 6, 1), g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
  const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aM = new Float32Array(n * 4), aS = new Float32Array(n * 4);
  items.forEach((it, i) => { aA.set([it.a[0], it.a[1], it.a[2], it.w ?? 0.03], i * 4); aB.set([it.b[0], it.b[1], it.b[2], it.sag ?? 0], i * 4); aM.set(it.m || [0, 0, 0, 0], i * 4); aS.set(it.s || [1, 1, 0, 0], i * 4); });
  for (const [k, arr] of [['aA', aA], ['aB', aB], ['aM', aM], ['aS', aS]]) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
  const col = opts.color || [0.11, 0.105, 0.11];
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uRes: RU.uRes }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aA, aB, aM, aS; uniform vec2 uRes; varying float vA; varying vec3 vW; ${LIGHT_GLSL} ${opts.pointGLSL || BOAT_GLSL}
      vec4 clipAt(float t, out vec3 wp){ vec3 a = boatPoint(aA.xyz, aM, aS), b = boatPoint(aB.xyz, aM, aS), p = mix(a, b, t); p.y -= aB.w * aS.x * 4.*t*(1.-t);
        p.xz += .25*aB.w * sin(uTime*.8 + aM.w + aA.x) * 4.*t*(1.-t); vec4 w = modelMatrix*vec4(p, 1.); wp = w.xyz; return projectionMatrix*viewMatrix*w; }
      void main(){ float t = position.x + .5; vec3 wp, w2; vec4 c0 = clipAt(t, wp), c1 = clipAt(t + .04, w2); vW = olaW(wp);
        vec2 d = (c1.xy/max(c1.w, 1e-3) - c0.xy/max(c0.w, 1e-3)) * uRes; d = normalize(d + vec2(1e-5, 0.)); vec2 nrm = vec2(-d.y, d.x);
        float px = max(c0.w * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5), hw = max(aA.w * aS.x, .75*px); vA = aA.w * aS.x / hw;      // (the divisor has a floor: a vertex in the eye's own plane)
        c0.xy += nrm * position.y * 2. * hw / px * 2. / uRes * c0.w; gl_Position = c0; }`,
    fragmentShader: /* glsl */`varying float vA; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ vec3 c = vec3(${col[0]}, ${col[1]}, ${col[2]}) * olaLight(vec3(0., 1., 0.), 0.);
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), clamp(vA, 0., 1.)); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1.5;
  return { object: mesh, material: mat, count: n };
}

// ---- reed beds: tufts of three tall blades each, bending in the one wind. items: [{ x, z, h, ph }] (they stand in the shallows)
export function makeReeds(LU, items, wind) {
  const P = [], K = [], I = [];
  for (let b = 0; b < 3; b++) { const a = b * Math.PI / 3 + 0.3, cx = Math.cos(a), sz = Math.sin(a), lean = 0.22 * (b - 1), s = P.length / 3;
    P.push(-0.16 * cx, 0, -0.16 * sz, 0.16 * cx, 0, 0.16 * sz, lean * sz * 0.5, 0.55, -lean * cx * 0.5, lean * sz, 1, -lean * cx); K.push(0, 0, 0.55, 1); I.push(s, s + 1, s + 2, s + 2, s + 1, s + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setIndex(I);
  const n = items.length, aR = new Float32Array(n * 4); items.forEach((it, i) => aR.set([it.x, it.z, it.h, it.ph], i * 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uWind: { value: new THREE.Vector2(wind[0], wind[1]).normalize() } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aK; attribute vec4 aR; uniform vec2 uWind; varying vec3 vW; varying float vK; ${LIGHT_GLSL}
      void main(){ float c = cos(aR.w*7.), s = sin(aR.w*7.); vec3 p = vec3(position.x*c + position.z*s, position.y, -position.x*s + position.z*c) * vec3(1.3, aR.z, 1.3);
        float bend = aK*aK * aR.z * (.16 + .1*sin(uTime*1.1 + aR.w + aR.x*.07 + aR.y*.05) + .05*sin(uTime*2.7 + aR.w*3.));
        p.xz += uWind * bend; p.y -= bend*bend*.2; p += vec3(aR.x, -.25, aR.y);
        vK = aK; vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying float vK; ${LIGHT_GLSL}
      void main(){ if (vW.y < -.02) discard; vec3 c = mix(vec3(.045,.075,.05), vec3(.15,.17,.11), vK) * olaLight(vec3(0., 1., 0.), 0.);
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { object: mesh, count: n };
}

