// THE REEF SEWN IN LAYERS (mola-reef): a Caribbean reef sewn as a Guna mola. The camera leaves a black
// surge channel, crosses a sand bowl under a hawksbill, drops into the master groove of the brain coral
// (src/parts/mola-reef.js), rides it to the crown and climbs at 50 degrees into a ring under a dugout.
//
// MAP OF THIS FILE (in order)
//   1. helpers: mkGeo (grid patches with the style's aE attribute), terrace (stepped profiles), cardMat (the world's one
//      instanced "cut cloth" shader: dashes, shoal, grass, worms, fans, beads), wallMat (the channel walls' own cloth:
//      four risers with friezes laid out in true metres, see its comment)
//   2. build(): SEEDED MOODS first (livery noon/dawn/night from ctx.vary.hour, else the visit's own rng draw; weather
//      calm/surge/squall from ctx.vary.mood; cast: the pace fish's kind and the school's kind, a third each by rng.int),
//      then the STREAMS (the reef heads keep the fork 'mola-cards'; every card kind and every cast member has a stream of
//      its own made from the seed and its name: dash, sand, grass, shoal, fans, beads, climb, worms, pace, turtle, angels,
//      school, octopus), then the HERO (buildHero at the origin, never moved), then the PATH (channel on +Z, a bowl leg
//      straight at the dome, hero.anchors.flyThrough, portal = anchors.portalSeat), then sky sphere, ceiling (wave bands
//      flanking the hull, sun patch, diamond lattice, the hull's MEDALLION: a second sawtooth, red on orange, sewn round
//      the hull 7 to 13 m outside its echo shells, paddle rings, the hull's violet shadow, a black patch above the hull,
//      the far border), THE ULU (three nested spindle shells under the ceiling) and its PADDLE, reef heads,
//      CHANNEL WALLS (four risers that stand down one after another toward the mouth, z 105 to 80), sand in 8 strips (to
//      z 178, contoured round walls, heads, dome and the outer crest; typed arrays, a yield every three rows, the two
//      end strips at half the count), cards (sea fans on the reef heads, the channel lips, two in the channel, seven on
//      the outer crest and the TWO that flank the mouth; worms in pairs on the slot's lips; about 100 big dashes round
//      the climb line), turtle, pace fish (three cuts: parrot, angel, trunk in black with yellow dots), five angelfish
//      (all at sea fans), octopus (mantle clear above the OUTER rim of the slot at anchors.octopusGate, 72% along it,
//      two arms arched over it as banded tubes).
//   3. THE CAST'S COURSES (fishAt, shoalAt: pure functions of our metres along the slot and the world clock), the PACE
//      (and uAtSec: the place the flight reaches at a design second, through the engine's own pace table), POIS: trench
//      (ONE pull at a point 8.5 m ahead on the groove, the whole slot long, weight 0.9: 0.315 for the steady camera), the
//      school's centre down the first stretch of the slot, a hard look out and down over the moat at the first window
//      (gzCrest, weight 0.72; the hero lifts the eye line there), a glance at the second, dome (channel and bowl), turtle
//      (bowl), octopus (the 25 m before the gate), portal (the hook's pull, then the last pull, at full weight from the
//      place the flight reaches at 33 s). Every moving target is computed from u inside its own pull.
//   4. POST: flat 1, bloom 0, no grade: exact palette colours. No scene fog: depth is the style's own
//      mix toward shared.uniforms.uDepthCol (set per livery) plus the stepped sky cloth.
//   5. update(): the turtle is keyed to u (its TK knots); the slot's cast flies courses of its own by metres flown.
//      STAGING, one subject per stretch, as the design orders them: the TURTLE crosses the channel 46 m ahead at the
//      entry, leads us over the bowl, peels off, swims low in the moat and rises over it along the FIRST WINDOW, 7 m
//      out and 2 m under the eye line, clear of the outer crest's tiers, swimming our way at a third of our speed (ahead,
//      abeam, astern), then sinks astern and swims on round the moat and out over the bowl; the WORMS close on the lips
//      by distance to the lens; the PACE FISH comes over the dome and down the flank on a course of its own, slips over
//      the bank into the slot at the first fork after the first window, leads 8 m ahead by metres flown in a slow slalom
//      and goes off by a fork 10.5 m short of the OCTOPUS's gate, over the outer wall and down the flank; the SHOAL (900)
//      rides the water above the slot ahead of us, 5 m over the lips and 7 m to the downhill side, closed up to half its
//      ring (uShK); we overhaul it along the slot, and at the SECOND WINDOW it bursts across the slot and runs on down
//      the flank; the ANGELFISH hang at sea fans. Nothing is scaled away, sunk or parked, and nothing reads the lens
//      but the worms' closing and the school's parting round us.
//      Also: the turtle's echo (on the dome and the crest only in the bowl: SU.uEchoDome goes to 0 for the drop), the
//      paddle, octopus bands (octoMat.uBand.x). Nothing is allocated per frame.
//      Echo bands: hero.setEcho slots 0 turtle, 1 pace fish (the only one drawn on the slot's walls), 2 octopus, 3 shoal.
//   Uniforms: shared.uniforms (uTime, uPal, uLight, uDepthCol, uEcho*), card uniforms uCam, uShoal, uShK (the
//   school's ring scale), uSurge, uRise (rare coral spawn), uExit/uExitD (the exit line), sky/ceiling uniforms uT and the livery colours.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, styleMaterial, molaGLSL, PAL } from '../parts/mola-reef.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- geometry accumulator: grid patches carrying aE (metres to the cut edge) and uv in metres
function mkGeo() {
  const P = [], U = [], E = [], I = [];
  return {
    grid(nu, nv, fn) {
      const b = P.length / 3;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const r = fn(i / nu, j / nv, i, j); P.push(r[0], r[1], r[2]); E.push(r[3]); U.push(r[4] ?? r[0], r[5] ?? r[2]); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, c = a + nu + 1; I.push(a, c, a + 1, a + 1, c, c + 1); }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 1));
      g.setIndex(I); g.computeVertexNormals(); return g;
    },
  };
}
// terraced profile: layers of riser + tread; returns rings [out, height, aE] for band width w
function terrace(steps, w) {
  const R = []; let y = 0;
  for (let k = 0; k < steps.length; k++) {
    const [a0, h, a2] = steps[k], sg = Math.sign(a2 - a0), a = a0;
    R.push([a, y, k * w + w * 0.45], [a, y + h - 0.25, k * w + w * 0.8], [a + 0.12 * sg, y + h - 0.06, k * w + w - 0.03], [a + 0.3 * sg, y + h, k * w + w - 0.012]);
    y += h; R.push([a2, y, k * w + 0.04]);
  }
  return R;
}

// ---- the instanced cut-cloth card shader (one program, a uK switch per mesh)
function cardMat(shared, K, kind, aspect) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...shared.uniforms, uCam: K.uCam, uShoal: K.uShoal, uSurge: K.uSurge, uRise: K.uRise, uExit: K.uExit, uExitD: K.uExitD, uShK: K.uShK, uK: { value: kind }, uAsp: { value: new THREE.Vector2(aspect[0], aspect[1]) } },
    vertexShader: /* glsl */`
attribute vec3 iPos; attribute vec3 iDir; attribute vec4 iDat; attribute vec3 iCol;
uniform float uTime, uK, uSurge, uRise, uShK; uniform vec3 uCam, uShoal, uExit, uExitD; uniform vec2 uAsp;
varying vec2 vUv; varying vec3 vCol; varying float vDist;
void main(){
  vec3 p = iPos; vec3 f = iDir; float sz = iDat.x, ph = iDat.y, sc = 1.0, root = 0.0;
  if (uK < 0.5) {
    vec3 B = vec3(120.0, 64.0, 120.0);
    p = uCam + mod(iPos - uCam + 0.5 * B, B) - 0.5 * B;
    float dc = length(p - uCam);
    sc = smoothstep(5.0, 11.0, dc) * (1.0 - smoothstep(48.0, 58.0, dc)) * step(1.2, p.y) * step(p.y, 80.0) * step(22.0, length(p - vec3(0.0, -2.0, 0.0)));
    f = normalize(f + vec3(0.0, 0.4 * uSurge * sin(uTime * 0.9 + ph + p.x * 0.08), 0.0));
  } else if (uK < 1.5) {
    float a = ph + uTime * 0.3 * iDat.z, r = iPos.x * uShK;                 // uShK: the school closes up (0.5) in the water over the slot
    p = uShoal + vec3(cos(a) * r, iPos.y * uShK + 0.6 * sin(uTime * 1.3 + ph * 3.0), sin(a) * r * 0.7);
    f = normalize(vec3(-sin(a), 0.15 * cos(uTime * 1.3 + ph * 3.0), cos(a) * 0.7) * iDat.z);
    vec3 d = p - uCam; float dl = max(length(d), 1e-3); p += d / dl * max(0.0, 8.0 - dl) * 0.9;
  } else if (uK < 2.5) {
    root = 1.0; f = normalize(vec3(0.32 * uSurge * sin(uTime * 1.3 + p.z * 0.12 + ph * 0.3), 1.0, 0.12 * uSurge * cos(uTime * 1.1 + p.x)));
  } else if (uK < 3.5) {
    root = 1.0; sc = 0.06 + 0.94 * smoothstep(3.5, 6.0, length(iPos - uCam));
  } else if (uK < 4.5) {
    root = 1.0; f = normalize(f + vec3(0.12 * uSurge * sin(uTime * 1.3 + ph - 1.57), 0.0, 0.06 * sin(uTime * 0.8 + ph)));
  } else if (uK > 5.5) {
    p.y = mod(iPos.y + uTime * 1.2, 72.0) + 1.0; p.x += sin(uTime * 0.6 + ph) * 0.6; sc = uRise * smoothstep(3.0, 6.0, length(p - uCam));
  }
  if (uK < 0.5 || uK > 5.5) { vec3 ex = p - uExit; sc *= smoothstep(8.5, 12.0, length(cross(ex, uExitD))); }
  if (uK > 0.5 && uK < 1.5) { vec3 ex = p - uExit; sz *= smoothstep(9.0, 12.5, length(cross(ex, uExitD))); }   // no fish in front of the ring
  vec3 s = cross(f, uCam - p); float sl = length(s); s = sl > 1e-4 ? s / sl : vec3(1.0, 0.0, 0.0);
  vec3 wp = p + f * ((uv.x + root) * sz * uAsp.x * (root > 0.5 ? sc : 1.0) * (uK < 0.5 || uK > 5.5 ? sc : 1.0)) + s * (uv.y * sz * uAsp.y * (uK < 0.5 || uK > 5.5 ? sc : 1.0));
  vUv = uv; vCol = iCol;
  vec4 mv = viewMatrix * vec4(wp, 1.0); vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */`
varying vec2 vUv; varying vec3 vCol; varying float vDist; uniform float uK;
` + molaGLSL(shared.nEcho) + /* glsl */`
void main(){
  vec3 A = uPal[int(clamp(vCol.x, 0.0, 8.0) + 0.5)], B = uPal[int(clamp(vCol.y, 0.0, 8.0) + 0.5)], C = uPal[int(clamp(vCol.z, 0.0, 8.0) + 0.5)];
  vec3 wht = vec3(0.93, 0.94, 0.9);                  // index 9: the silversides' white cloth
  if (vCol.x > 8.5) A = wht; if (vCol.y > 8.5) B = wht; if (vCol.z > 8.5) C = wht;
  float x = vUv.x, y = vUv.y, d = 0.0;
  float fe = max(fwidth(x) + fwidth(y), 1e-4);
  vec2 q = vec2(x * 0.5 + 0.5, y * 0.62); float r = length(q), an = atan(q.y, max(q.x, 1e-3));
  vec2 g = vec2(an * 9.0, r * 14.0); float fg = max(max(fwidth(g.x), fwidth(g.y)), 1e-4);
  vec3 c = A;
  if (uK < 0.5 || (uK > 4.5 && uK < 5.5)) {
    d = 1.0 - abs(x) - abs(y); if (d < 0.0) discard;
    c = mix(A, B, molaAA(d - 0.42, fe));
  } else if (uK < 1.5) {
    d = 1.0 - abs((x - 0.2) / 0.8) - abs(y) / 0.9;
    float tl = -0.4 - x; bool tail = tl > 0.0 && abs(y) < tl * 1.5 && abs(y) > (tl - 0.28) * 1.5;
    if (d < 0.0 && !tail) discard;
    c = d >= 0.0 ? mix(A, B, molaAA(d - 0.45, fe)) : C;
  } else if (uK < 2.5) {
    float t = q.x, w = 1.0 - t * t; d = w - abs(y); if (d < 0.0) discard;
    c = mix(A, B, molaAA(d - 0.62 * w, fe));
  } else if (uK < 3.5) {
    float t = q.x, w = (1.0 - t) * 0.9 + 0.05; d = w - abs(y); if (d < 0.0) discard;
    float sp = fract(t * 4.0 + abs(y) * 1.3 - uTime * 0.15);
    c = mix(A, B, molaAA(sp - 0.5, fe * 4.0)); c = mix(C, c, molaAA(d - 0.1, fe));
  } else if (uK < 4.5) {
    float edge = (0.8 + 0.14 * cos(an * 7.0)) * (1.0 - smoothstep(0.95, 1.3, abs(an)));
    d = edge - r; bool stem = q.x < 0.25 && abs(y) < 0.045;
    if (d < 0.0 && !stem) discard;
    vec2 fr = abs(fract(g) - 0.5);
    float slit = molaAA(0.3 - fr.x, fg) * molaAA(0.34 - fr.y, fg) * (1.0 - smoothstep(0.25, 0.7, fg));
    c = mix(A, B, slit * step(0.07, d)); c = mix(C, c, step(0.03, d));
  } else {
    float rr = length(vUv); if (rr > 1.0) discard;
    c = rr > 0.62 ? A : (rr > 0.3 ? B : A);
  }
  c *= mix(0.86, 1.05, clamp(0.5 + 0.5 * y, 0.0, 1.0));
  gl_FragColor = vec4(molaDepth(c, vDist), 1.0);
}`,
  });
}
function cardMesh(shared, K, kind, aspect, list) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(n * 3), b = new Float32Array(n * 3), c = new Float32Array(n * 4), d = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const o = list[i]; a.set(o.p, i * 3); b.set(o.f, i * 3); c.set(o.d, i * 4); d.set(o.c, i * 3); }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(a, 3)); g.setAttribute('iDir', new THREE.InstancedBufferAttribute(b, 3));
  g.setAttribute('iDat', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(d, 3));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, cardMat(shared, K, kind, aspect)); m.frustumCulled = false; return m;
}

// ---- the channel wall cloth: four real risers (deep violet quilt with a frieze of appliqué fish and medallions, a green
// band with a zigzag, a magenta band with stepped crosses, a violet top band with lozenges), each motif cut through
// nested cloths and laid out in TRUE metres up its riser (aW = z, metres up, layer, riser height here), so where the
// walls step down toward the mouth a motif is left out, never squashed. Hems carry a rim line and stitches of light.
function wallMat(shared, base, idx, acc) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...shared.uniforms, uWB: { value: new THREE.Color(base) }, uWI: { value: new THREE.Vector4(idx[0], idx[1], idx[2], idx[3]) }, uWJ: { value: new THREE.Vector4(acc[0], acc[1], acc[2], acc[3]) } },
    vertexShader: /* glsl */`
attribute vec4 aW; varying vec4 vA; varying vec3 vW; varying float vDist;
void main(){ vA = aW; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
varying vec4 vA; varying vec3 vW; varying float vDist; uniform vec3 uWB; uniform vec4 uWI, uWJ;
` + molaGLSL(shared.nEcho) + /* glsl */`
float loz(float x, float y, float hx, float hy){ return 1.0 - (abs(x) / hx + abs(y) / hy); }
vec3 pal(float i){ return uPal[int(clamp(i, 0.0, 8.0) + 0.5)]; }
// nested cuts: three cloths 0.15 m apart inside the outline d = 0, then the ground again
vec3 nest(vec3 c, float d, float w, vec3 a, vec3 b, vec3 e, vec3 g){
  c = mix(c, a, molaAA(d, w)); c = mix(c, b, molaAA(d - 0.15, w)); c = mix(c, e, molaAA(d - 0.3, w)); c = mix(c, g, molaAA(d - 0.45, w));
  float into = d < 0.15 ? d : d < 0.3 ? d - 0.15 : d < 0.45 ? d - 0.3 : d - 0.45;
  return c * (1.0 - 0.3 * step(0.0, d) * (1.0 - molaAA(into - 0.035, w)));
}
void main(){
  float fw = max(length(fwidth(vW)), 1e-4);
  float z = vA.x, ym = vA.y, lay = floor(vA.z + 0.5), Ht = vA.w, dT = Ht - ym;
  float fy = max(fwidth(vA.y), 1e-4), fz = max(fwidth(z), 1e-4), wd = max(fy, fz * 0.6), nearK = 1.0 - smoothstep(0.03, 0.09, fw);
  vec3 nn = cross(dFdx(vW), dFdy(vW));
  vec3 n = dot(nn, nn) > 1e-16 ? normalize(nn) : vec3(0.0, 1.0, 0.0);
  if (dot(n, vW - cameraPosition) > 0.0) n = -n;
  vec3 cB = pal(uWI.x), cC = pal(uWI.y), a1 = pal(uWJ.x), a2 = pal(uWJ.y), blk = uPal[3];
  // quilting on the violet ground: puffed diamonds 1.5 m across with a dark seam
  vec2 qv = abs(fract(vec2(z + ym, z - ym) / 1.5) - 0.5); float qm = max(qv.x, qv.y);
  float puff = 0.74 + 0.62 * (1.0 - 2.0 * qm), seam = molaAA((qm - 0.478) * 1.5, wd);
  vec3 ground = mix(uWB * puff, blk, seam * 0.8);
  vec3 c = ground; float hemK = 1.0, rise = 1.0;
  if (lay < 0.5) {                                   // the violet quilt: fish and medallions, a zigzag hem, a lozenge row at the foot
    float cz = z / 5.6, id = floor(cz), x = (fract(cz) - 0.5) * 5.6, y = ym - (Ht - 1.6), odd = mod(id, 2.0);
    float body = 0.62 * loz(x + 0.4, y, 1.6, 0.62), tail = min(min(x - 0.7, 2.05 - x), (x - 0.7) * 0.6 - abs(y));
    float dF = max(body, min(tail, 0.2 + abs(y) * 0.9 - (x - 1.45)));        // forked tail
    float dM = 0.8 * loz(x, y, 1.25, 0.8);
    float d = mix(dF, dM, odd) * step(2.9, Ht);
    c = nest(c, d - 1.0 + step(2.9, Ht), wd, a1, a2, cC, mix(uWB * 1.3, a1, odd));
    c = mix(c, uWB * 0.6, (1.0 - odd) * step(2.9, Ht) * molaAA(0.1 - length(vec2(x + 1.3, y - 0.1)), wd));   // the eye
    float zz = 0.06 - abs(dT - 0.42 - 0.13 * (4.0 * abs(fract(z / 0.9) - 0.5) - 1.0)) * 0.8;
    c = mix(c, cB, molaAA(zz, max(fy, fz * 0.5)) * step(1.3, Ht));
    float lx = (fract(z / 1.4) - 0.5) * 1.4, l1 = 0.11 * loz(lx, ym - 0.36, 0.3, 0.11);
    c = mix(c, mod(floor(z / 1.4), 2.0) < 0.5 ? cC : a1, molaAA(l1, max(fy, fz * 0.4)) * step(1.0, Ht));
  } else if (lay < 1.5) {                            // the first band: a broad zigzag with lozenges in its bays
    c = cB;
    float tz = 4.0 * abs(fract(z / 2.4) - 0.5) - 1.0, y = ym - Ht * 0.5, full = step(1.9, Ht);
    float d = (0.2 - abs(y - 0.42 * tz) * 0.82) * full - 1.0 + full;
    c = mix(c, cC, molaAA(d, max(fy, fz * 0.6))); c = mix(c, uWB, molaAA(d - 0.12, max(fy, fz * 0.6)));
    float bx = (fract(z / 2.4 + 0.5 * step(y, 0.0)) - 0.5) * 2.4, l1 = 0.13 * loz(bx, abs(y) - 0.72, 0.36, 0.13);
    c = mix(c, a2, molaAA(l1, max(fy, fz * 0.4)) * full);
    float l0 = 0.13 * loz((fract(z / 1.2) - 0.5) * 1.2, y, 0.34, min(0.13, Ht * 0.3));
    c = mix(c, uWB, molaAA(l0, max(fy, fz * 0.4)) * (1.0 - full) * step(0.5, Ht));
  } else if (lay < 2.5) {                            // the second band: stepped crosses with a lozenge between
    c = cC;
    float cz = z / 2.2, x = (fract(cz) - 0.5) * 2.2, y = ym - Ht * 0.5, full = step(1.5, Ht), ax = abs(x), ay = abs(y);
    float d = max(max(min(0.78 - ax, 0.13 - ay), min(0.24 - ax, 0.52 - ay)), min(0.5 - ax, 0.31 - ay)) * full - 1.0 + full;
    c = mix(c, a2, molaAA(d, wd)); c = mix(c, uWB, molaAA(d - 0.11, wd));
    float l1 = 0.12 * loz(abs(x) - 1.1, y, 0.2, min(0.12, Ht * 0.3));
    c = mix(c, a1, molaAA(l1, max(fy, fz * 0.6)) * step(0.5, Ht));
  } else if (lay < 3.5) {                            // the top band: violet again, a lozenge row, the rim light on its hem
    float x = (fract(z / 1.5) - 0.5) * 1.5, y = ym - Ht * 0.45, hy = min(0.2, Ht * 0.28), d = hy * loz(x, y, 0.42 * hy / 0.2, hy);
    c = mix(c, a1, molaAA(d, max(fy, fz * 0.5)) * step(0.5, Ht)); c = mix(c, cC, molaAA(d - 0.08, max(fy, fz * 0.5)) * step(0.9, Ht));
    hemK = 2.0;
  } else if (lay < 6.5) {                            // a tread: the band's own cloth, lit, with the next riser's shadow on it
    float k = lay - 4.0; c = k < 0.5 ? uWB * 1.5 : k < 1.5 ? cB : cC;
    c = molaShadow(c * 1.12, (1.0 - molaAA(0.72 - ym, fy)) * 0.8); rise = 0.0;
  } else {                                           // the top of the reef: violet quilt with slits, a lit hem at its edge
    vec2 g = vec2(z / 2.6, ym / 1.3 + 0.5 * mod(floor(z / 2.6), 2.0)), gi = floor(g), gf = fract(g) - 0.5;
    float h = molaHash(gi + 7.0), l1 = 0.16 * loz(gf.x * 2.6, gf.y * 1.3, 0.55, 0.16);
    c = mix(c, h > 0.75 ? cC : (h > 0.55 ? cB : a1), molaAA(l1, wd) * step(0.4, h) * step(0.6, ym));
    c = mix(c, a1, 1.0 - molaAA(ym - 0.14, fy)); rise = 0.0;
  }
  if (rise > 0.5) {                                  // every riser: rolled hem with a rim line, stitches of light, contact shadow at the foot
    float some = step(0.3, Ht), rim = (1.0 - molaAA(dT - 0.1, fy)) * some;
    c = mix(c, mix(c * 1.25 + uWB * 0.5, uPal[6], 0.5 * (hemK - 1.0)), rim);
    float st = (1.0 - smoothstep(0.0, 0.02, abs(dT - 0.19))) * step(0.0, sin(z * 31.4)) * nearK * some;
    c = mix(c, uLightCol, st * (0.3 + 0.6 * (1.0 - smoothstep(70.0, 150.0, z))));
    c = molaShadow(c, (1.0 - molaAA(ym - 0.12, fy)) * 0.7 * some);
  }
  c *= molaWeave(vec2(z, ym), fw) * molaPuff(n);                    // no echo bands on the walls: they would cut across the friezes
  c = molaDepth(molaLight(c, vW, n, fw), vDist);
  gl_FragColor = vec4(c, 1.0);
}`,
  });
}

const LIV = {
  noon: { water: ['#1B4FA8', '#16398A', '#10245E', '#141012'], depth: '#10245E', ceil: '#14A6A0', sand: [3, 1, 2, 6], wall: [3, 7, 5, 3], wallB: '#281D55', wallA: [2, 1], head: [3, 5, 1, 2], dash: [[6, 2], [8, 6], [2, 6]], turtle: [4, 1, 3, 0] },
  dawn: { water: ['#14A6A0', '#1B4FA8', '#C4247C', '#141012'], depth: '#7A1E6E', ceil: '#14A6A0', sand: [3, 5, 2, 6], wall: [3, 7, 1, 3], wallB: '#3A1A52', wallA: [2, 5], head: [3, 6, 5, 1], dash: [[2, 4], [6, 2], [5, 1]], turtle: [4, 1, 3, 5] },
  night: { water: ['#10245E', '#0C1A44', '#141012', '#141012'], depth: '#141012', ceil: '#10245E', sand: [2, 3, 3, 3], wall: [3, 2, 5, 3], wallB: '#1C1740', wallA: [5, 1], head: [5, 3, 2, 3], dash: [[3, 2], [3, 2], [3, 5]], turtle: [4, 3, 1, 4] },
};

export default {
  id: 'mola-reef',
  name: 'The Reef Sewn in Layers',
  category: 'ocean',
  weirdness: 0.7,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    // ---- SEEDED MOODS (all draws before the hero's own)
    const hour = vary.hour || 'any';
    const drawn = rng.pick(['noon', 'noon', 'dawn', 'night']);
    const livery = hour === 'night' ? 'night' : (hour === 'dawn' || hour === 'golden') ? 'dawn' : hour === 'day' ? 'noon' : drawn;
    const drawnW = rng.pick(['surge', 'surge', 'calm', 'squall']);
    const weather = Number.isFinite(vary.mood) ? (vary.mood < 0.25 ? 'calm' : vary.mood < 0.78 ? 'surge' : 'squall') : drawnW;   // vary.mood picks the weather
    const paceKind = rng.int(0, 2), shoalKind = rng.int(0, 2), rare = !!vary.rare;
    const cr = rng.fork ? rng.fork('mola-cards') : rng;   // the reef heads' stream (its first draws; nothing else draws on it now)
    // ONE STREAM PER CARD KIND AND PER CAST MEMBER, each made from the world's seed and its own name (it draws nothing from
    // any parent, so a count that changes in one kind re-deals nothing else): the list is fixed here
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed('mola-' + name + ':' + ctx.seed));
    const rDash = own('dash'), rSand = own('sand'), rGrass = own('grass'), rShoal = own('shoal'), rFans = own('fans'), rBeads = own('beads'), rClimb = own('climb'), rWorm = own('worms'), rPace = own('pace'), rTurtle = own('turtle'), rAngel = own('angels');
    const LV = LIV[livery];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(LV.water[0]);

    // ---- HERO (origin; channel on +Z)
    const hero = await buildHero(ctx, { livery, echoes: 8, demo: false });
    scene.add(hero.object);
    await ctx.yield();
    const shared = hero.shared, SU = shared.uniforms, A = hero.anchors;
    SU.uDepthCol.value.set(LV.depth);
    if (weather === 'calm') SU.uLight.value.set(0.35, 0.35, 8.0); else if (weather === 'squall') SU.uLight.value.set(0.12, 1.2, 5.0);
    if (livery === 'night') SU.uLight.value.x = 0.5;
    const K = { uCam: { value: V(0, 2.5, 138) }, uShoal: { value: V(0, 9, 40) }, uSurge: { value: weather === 'calm' ? 0.25 : 1 }, uRise: { value: 0 }, uShK: { value: 1 }, uExit: { value: V(0, 70, -68) }, uExitD: { value: V(0, 0.77, -0.64) } };
    const mat = (o) => styleMaterial({ shared, ...o });

    // ---- PATH: channel, bowl, the hero's flyThrough (slot, crown, pull-up), portal
    const fly = A.flyThrough, f0 = fly[0], portalP = A.portalSeat.position, exitDir = A.exitHeading;
    // the bowl leg runs almost straight at the dome (fly[0] is 29 m from its axis), so the dome grows in the middle of the frame
    const pts = [V(0, 2.5, 138), V(0, 2.5, 116), V(0, 2.5, 94), V(0, 2.5, 72), V(f0.x * 0.16, 3.4, 59.5), V(f0.x * 0.62, 5.7, 45)];
    const iFly = pts.length;
    for (let i = 0; i < fly.length - 1; i++) pts.push(fly[i].clone());
    pts.push(portalP.clone().addScaledVector(exitDir, -30), portalP.clone());
    const path = makePath(pts);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const uOf = (i) => cum[i] / cum[cum.length - 1];
    const uS0 = uOf(iFly + A.slotRange[0]), uS1 = uOf(iFly + A.slotRange[1]), LANE = hero.lane.length, uBowl = uOf(3), uArc = uOf(iFly);
    const sOf = (u) => 1.5 + clamp((u - uS0) / (uS1 - uS0), -0.2, 1.2) * (LANE - 2.5);
    const uWin = A.windows.map((w) => uS0 + ((w.s0 + w.s1) * 0.5 - 1.5) / (LANE - 2.5) * (uS1 - uS0));
    K.uExit.value.copy(portalP); K.uExitD.value.copy(exitDir).normalize();
    await ctx.yield();

    // ---- SKY: stepped scalloped water cloth on a sphere that follows the camera
    const wc = LV.water.map((h) => new THREE.Color(h));
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uC: { value: wc }, uT: SU.uTime },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
varying vec3 vD; uniform vec3 uC[4]; uniform float uT;
void main(){
  vec3 d = normalize(vD); float az = atan(d.z, abs(d.x) < 1e-4 ? 1e-4 : d.x);
  float h = abs(d.y + 0.01), fw = max(fwidth(h), 1e-5) ;
  float s1 = 0.016 * abs(sin(az * 30.0 + 0.4)), s2 = 0.02 * abs(sin(az * 19.0 + uT * 0.02)), s3 = 0.026 * abs(sin(az * 12.0 + 2.0));
  vec3 c = uC[3];
  c = mix(c, uC[2], clamp((h - 0.03 - s1) / fw + 0.5, 0.0, 1.0));
  c = mix(c, uC[1], clamp((h - 0.085 - s2) / fw + 0.5, 0.0, 1.0));
  c = mix(c, uC[0], clamp((h - 0.16 - s3) / fw + 0.5, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

    // ---- CEILING: surface cloth 84 m up with the diamond lattice, sawtooth border, the ulu and its paddle rings
    const hE = V(exitDir.x, 0, exitDir.z).normalize(), hullC = portalP.clone().addScaledVector(hE, (84 - portalP.y) / Math.tan(A.portalSeat.tilt)); hullC.y = 84;
    const P3 = (i) => SU.uPal.value[i];
    const ceilMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uT: SU.uTime, uBase: { value: new THREE.Color(LV.ceil) }, uYel: { value: livery === 'night' ? P3(6) : livery === 'dawn' ? P3(1) : P3(4) }, uSaw: { value: livery === 'night' ? P3(5) : P3(1) }, uRed: { value: P3(0) }, uBlk: { value: P3(3) }, uCob: { value: livery === 'night' ? P3(2) : P3(6) }, uMag: { value: P3(5) },
        uDeep: SU.uDepthCol, uHull: { value: new THREE.Vector4(hullC.x, hullC.z, hE.x, hE.z) }, uSq: { value: weather === 'squall' ? 1 : 0 } },
      vertexShader: 'varying vec3 vW; varying float vDist; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: /* glsl */`
varying vec3 vW; varying float vDist; uniform float uT, uSq; uniform vec3 uBase, uYel, uSaw, uRed, uBlk, uCob, uMag, uDeep; uniform vec4 uHull;
float aa(float x, float w){ return clamp(x / max(w, 1e-5) + 0.5, 0.0, 1.0); }
float molaAA(float x, float w){ return aa(x, w); }
float hh(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
void main(){
  vec2 p = vW.xz; float fw = max(length(fwidth(p)), 1e-4);
  vec3 c = uBase;
  vec2 gq = vec2(p.x + p.y, p.x - p.y) * 0.05 + vec2(uT * 0.012, 0.0); vec2 id = floor(gq), f = fract(gq) - 0.5;
  float hs = hh(id);
  float dm = 0.25 + 0.08 * sin(uT * 0.5 + hs * 6.283) - (abs(f.x) + abs(f.y) * 1.5);
  float rg = abs(length(f) - fract(uT * 0.25 + hs) * 0.5) ;
  float lat = mix(aa(dm * 20.0, fw), (1.0 - aa((rg - 0.035) * 20.0, fw)) * step(0.3, hs), uSq);
  vec2 q = p - uHull.xy; float al = dot(q, uHull.zw), ac = dot(q, vec2(-uHull.w, uHull.z));
  // the surface is a sewn cloth: broad appliqué wave bands (a scalloped band of the second cloth 15 m wide with a
  // piping line, every 76 m, the nearest two flanking the hull like a wake), then the lattice of light over everything
  float wq = al / 76.0 + 0.03 * sin(ac * 0.05), wf = fract(wq) - 0.5, sc = 0.03 * abs(sin(ac * 0.2 + floor(wq) * 1.7));
  float wb = (0.1 + sc - abs(wf)) * 76.0;
  c = mix(c, uCob, molaAA(wb, fw)); c = mix(c, uMag, molaAA(wb - 1.6, fw) * (1.0 - molaAA(wb - 2.5, fw)));
  // the sun patch: where the noon light falls through, the diamonds swell and a scalloped ring of light lies round them
  float sd = length(q - vec2(-34.0, -52.0));
  float sun = 1.0 - smoothstep(14.0, 30.0, sd);
  dm += 0.13 * sun; lat = mix(molaAA(dm * 20.0, fw), lat, uSq);
  c = mix(c, uYel, lat * (1.0 - smoothstep(0.6, 2.0, fw * 0.5)));
  // the hull's own medallion (an amendment of the brief): a second sawtooth sewn on the surface cloth 7 to 13 m OUTSIDE
  // the hull's two echo bands (the cobalt and the magenta shell), clear ground cloth between; red teeth on orange
  // (magenta at night), never yellow: near the ring yellow is the ring's alone. 44 teeth 5.5 m tall (the far border's
  // are 12 m) marching slowly round; the paddle's rings spread across it every 3 s
  float hq0 = sqrt(max(al * al / 225.0 + ac * ac / 1936.0, 1e-6)), hd0 = (hq0 - 1.0) * 15.0;
  float hta = fract(atan(ac / 44.0, abs(al) < 1e-4 ? 1e-4 : al / 15.0) * 7.0028 + uT * 0.02);
  float zt = aa(5.5 * (1.0 - abs(2.0 * hta - 1.0)) - (hd0 - 7.0), fw);
  c = mix(c, mix(uSaw, uRed, zt), aa(hd0 - 7.0, fw) * (1.0 - aa(hd0 - 13.0, fw)));
  c = mix(c, uBlk, aa(0.3 - abs(hd0 - 13.3), fw) * (1.0 - smoothstep(0.3, 0.9, fw)));
  vec2 pd = vec2(al - 15.5, ac - 20.0); float pr = length(pd);
  for (int k = 0; k < 3; k++) {
    float x = pr - (mod(uT, 3.0) + 3.0 * float(k)) * 8.0;
    if (x < 0.0 && x > -9.0) c = x > -3.0 ? uCob : (x > -6.0 ? uMag : uSaw);
  }
  float hq = sqrt(max(al * al / 225.0 + ac * ac / 1936.0, 1e-6)); float hd = (hq - 1.0) * 15.0;
  // the hull's shadow: a violet shade lying off it away from the sun (no hem line: a dashed ring round the portal read as an overlay)
  float hq2 = sqrt(max((al + 3.0) * (al + 3.0) / 361.0 + (ac + 4.0) * (ac + 4.0) / 2304.0, 1e-6)), hsd = (hq2 - 1.0) * 19.0;
  c = mix(c, c * vec3(0.5, 0.42, 0.72), 1.0 - aa(hsd, fw));
  c = mix(c, uBlk, 1.0 - aa(hd + 1.0, fw));                // the surface cloth is black above the hull's shells
  float R = length(p), ta = fract(atan(p.y, abs(p.x) < 1e-4 ? 1e-4 : p.x) * 25.0);
  float tooth = aa(12.0 * (1.0 - abs(2.0 * ta - 1.0)) - (R - 300.0), fw);
  c = mix(c, mix(uYel, uRed, tooth), aa(R - 300.0, fw)); c = mix(c, uBlk, aa(R - 312.0, fw));
  gl_FragColor = vec4(mix(c, uDeep, 0.3 * smoothstep(90.0, 340.0, length(vW - cameraPosition))), 1.0);   // per fragment: the plane is two huge triangles
}`,
    });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.y = 84; scene.add(ceil);
    await ctx.yield();
    // ---- THE ULU seen from beneath: three nested spindle shells hanging under the surface cloth, broadside to the climb
    // (black keel with a red strake and an orange keel line, then a cobalt and a magenta shell 1.5 to 2.5 m above it, so
    // they slide against each other as we rise), and a paddle that dips beside it in time with the rings on the ceiling
    const hAx = V(-hE.z, 0, hE.x);
    const hullShell = (Lh, Wh, D, stack, bandW) => {
      const g = mkGeo();
      g.grid(48, 10, (u, v) => {
        const l = (2 * u - 1) * Lh, k = Math.max(1 - (l / Lh) * (l / Lh), 0), w = Wh * Math.pow(k, 0.55), d = D * Math.pow(k, 0.4), th = v * Math.PI, st = Math.sin(th), a = w * Math.cos(th);
        return [hullC.x + hAx.x * l + hE.x * a, 83.96 - d * st, hullC.z + hAx.z * l + hE.z * a, d * st, l, a];
      });
      const m = new THREE.Mesh(g.build(), mat({ stack, bandW, hem: 0.1 })); m.frustumCulled = false; scene.add(m);
    };
    const nightL = livery === 'night';
    hullShell(38, 9, 5, nightL ? [3, 2, 3, 3] : [3, 0, 3, 3], 1.1);
    hullShell(41, 12, 2.6, nightL ? [6, 2, 6, 6] : [6, 8, 6, 6], 0.9);
    hullShell(44, 15, 1.0, [5, 1, 5, 5], 0.5);
    const gp = mkGeo();
    gp.grid(24, 5, (u, v) => { const th = u * 6.283, x = 2.1 * v * Math.cos(th), y = -6.5 + 5 * v * Math.sin(th) * (1 - 0.25 * Math.sin(th)); return [x, y, 0.2 * (1 - v * v), (1 - v) * 2.1, x, y]; });
    gp.grid(2, 6, (u, v) => [(u - 0.5) * 0.8, -3 + v * 14, 0.05, 0.4 - Math.abs(u - 0.5) * 0.8 + 0.02, u, v * 14]);
    const paddle = new THREE.Mesh(gp.build(), mat({ stack: nightL ? [2, 3, 5, 2] : [3, 1, 0, 1], bandW: 0.5, hem: 0.08 }));
    const padP = hullC.clone().addScaledVector(hE, 15.5).addScaledVector(hAx, 20); paddle.frustumCulled = false;
    paddle.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(hAx, V(0, 1, 0), new THREE.Vector3().crossVectors(hAx, V(0, 1, 0))));
    const padQ = paddle.quaternion.clone(), padR = new THREE.Quaternion(), padAx = V(0, 0, 1);
    scene.add(paddle);
    await ctx.yield();

    // ---- REEF HEADS (terraced lathes) and CHANNEL WALLS (terraced sweep), then the SAND contoured round them
    const heads = [];
    for (let i = 0; i < 22; i++) {
      const a = 0.3 + (i + cr.range(-0.3, 0.3)) / 22 * (Math.PI * 2 - 0.6), rad = cr.range(54, 66), R = cr.range(6, 11), H = cr.range(6, 16);
      heads.push({ x: Math.sin(a) * rad, z: 5 + Math.cos(a) * rad, R, H, ph: cr.range(0, 6.28), l: cr.range(0.1, 0.2) });
    }
    heads.push({ x: -20, z: 63, R: 7, H: 7, ph: 1, l: 0.12 }, { x: 20, z: 63, R: 7, H: 7, ph: 4, l: 0.12 });
    const gh = mkGeo();
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i]; if (!path.isClear(h.x, h.H * 0.5, h.z, h.R * 1.25, 7)) { h.R = 0; continue; }
      const prof = terrace([[h.R, h.H * 0.34, h.R * 0.74], [h.R * 0.74, h.H * 0.26, h.R * 0.5], [h.R * 0.5, h.H * 0.22, h.R * 0.28], [h.R * 0.28, h.H * 0.18, 0]], 1);
      gh.grid(28, prof.length - 1, (u, v, ii, j) => {
        const th = u * Math.PI * 2, lob = 1 + h.l * Math.sin(3 * th + h.ph) + 0.08 * Math.sin(5 * th + h.ph * 2), r = prof[j][0] * lob;
        return [h.x + Math.cos(th) * r, prof[j][1] + (j === prof.length - 1 ? 0.5 : 0), h.z + Math.sin(th) * r, prof[j][2], th * h.R, prof[j][1]];
      });
      await ctx.yield();
    }
    scene.add(new THREE.Mesh(gh.build(), mat({ stack: LV.head, bandW: 1, hem: 0.08 })));
    await ctx.yield();
    // CHANNEL WALLS: four risers (3.4, 2.2, 2.0 and 1.4 m, setbacks 0.35 m) and the reef top out to 18 m. Toward the
    // mouth the risers stand down one after another (the top one from z 105, the lowest to 1.5 m by z 80): the walls fall away
    const WR = [[3.4, 80, 88, 0.44], [2.2, 86, 93, 0], [2.0, 92, 99, 0], [1.4, 98, 105, 0]];
    const wallH = (k, z) => WR[k][0] * (WR[k][3] + (1 - WR[k][3]) * smoothstep(WR[k][1], WR[k][2], z));
    const wallTop = (z) => wallH(0, z) + wallH(1, z) + wallH(2, z) + wallH(3, z);
    const wP = [], wA = [], wI = [], NZ = 114, NS = 16;
    for (const sd of [-1, 1]) {
      const b0 = wP.length / 3;
      for (let i = 0; i <= NZ; i++) {
        const z = 64 + i, wob = noise.n2(z * 0.07, sd * 7); let y = 0;
        const put = (x, yy, a, l, h) => { wP.push(sd * x, yy, z); wA.push(z, a, l, h); };
        for (let k = 0; k < 4; k++) {
          const h = wallH(k, z), x = 4 + 0.35 * k + wob * (0.3 + 0.15 * k), x1 = 4 + 0.35 * (k + 1) + wob * (0.3 + 0.15 * (k + 1));
          put(x, y, 0, k, h); put(x, y + h, h, k, h); y += h;
          if (k < 3) { put(x, y, 0, 4 + k, 1); put(x1, y, 1, 4 + k, 1); } else { put(x, y, 0, 7, 1); put(18, y, 18 - x, 7, 1); }
        }
      }
      for (let i = 0; i < NZ; i++) for (let k = 0; k < NS; k += 2) { const a = b0 + i * NS + k, c = a + NS; wI.push(a, c, a + 1, a + 1, c, c + 1); }
      await ctx.yield();
    }
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wP, 3)); wallGeo.setAttribute('aW', new THREE.Float32BufferAttribute(wA, 4)); wallGeo.setIndex(wI);
    wallGeo.boundingSphere = new THREE.Sphere(V(0, 4, 121), 62);
    scene.add(new THREE.Mesh(wallGeo, wallMat(shared, LV.wallB, [LV.wall[1], LV.wall[2], 0, 0], [LV.wallA[0], LV.wallA[1], 0, 0])));
    await ctx.yield();
    const live = heads.filter((h) => h.R > 0), sx0 = A.flyThrough[0].x >= 0 ? 1 : -1;
    const crest = A.crest;
    // (written straight into typed arrays with a yield every three rows; a strip is 144 x 18 cells, the two end strips,
    // more than 85 m from the dome and behind the entry, 72 x 9)
    const SDIM = (strip) => (strip === 0 || strip === 7 ? [72, 9] : [144, 18]);
    let sVn = 0, sIn = 0; for (let strip = 0; strip < 8; strip++) { const [nu, nv] = SDIM(strip); sVn += (nu + 1) * (nv + 1); sIn += nu * nv * 6; }
    const sPos = new Float32Array(sVn * 3), sNor = new Float32Array(sVn * 3), sUv = new Float32Array(sVn * 2), sE = new Float32Array(sVn), sRoad = new Float32Array(sVn), sIx = new Uint16Array(sIn);
    let sv = 0, si = 0;
    for (let strip = 0; strip < 8; strip++) {
      const [SNU, SNV] = SDIM(strip), SROW = SNU + 1, b0 = sv;
      for (let j = 0; j <= SNV; j++) {
        const z = -125 + (strip + j / SNV) * 38;
        for (let i = 0; i <= SNU; i++) {
          const x = -135 + (i / SNU) * 270, ax = Math.abs(x);
          let e = Math.hypot(Math.max(4 - ax, ax - 18, 0), Math.max(64 - z, 0));
          if (ax < 4 && z >= 64) e = 4 - ax;
          e = Math.min(e, Math.abs(Math.hypot(x, z) - 21.6));
          if (x * x + z * z < 1850) e = Math.min(e, Math.abs(crest.edge(x, z)));
          for (let k = 0; k < live.length; k++) { const h = live[k], dx = x - h.x, dz = z - h.z, rr = e + h.R * 1.05; if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue; const d = Math.hypot(dx, dz) - h.R * 1.05; if (d < e) e = d; }
          sPos[sv * 3] = x; sPos[sv * 3 + 2] = z; sNor[sv * 3 + 1] = 1; sUv[sv * 2] = x; sUv[sv * 2 + 1] = z; sE[sv] = Math.max(e, 0) + 0.15 * noise.n2(x * 0.05, z * 0.05); sRoad[sv] = ax < 4 && z >= 64 ? 1 : 0; sv++;
        }
        if (j % 3 === 2) await ctx.yield();
      }
      for (let j = 0; j < SNV; j++) for (let i = 0; i < SNU; i++) { const a = b0 + j * SROW + i, c = a + SROW; sIx[si++] = a; sIx[si++] = c; sIx[si++] = a + 1; sIx[si++] = a + 1; sIx[si++] = c; sIx[si++] = c + 1; }
      await ctx.yield();
    }
    const sandGeo = new THREE.BufferGeometry();
    sandGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sandGeo.setAttribute('normal', new THREE.BufferAttribute(sNor, 3));
    sandGeo.setAttribute('uv', new THREE.BufferAttribute(sUv, 2)); sandGeo.setAttribute('aE', new THREE.BufferAttribute(sE, 1)); sandGeo.setIndex(new THREE.BufferAttribute(sIx, 1));
    // THE ROAD: the channel's floor, the sand cloth between the two walls (the vertices with |x| < 4 and z >= 64, the very
    // ones whose bands are laid by 4 - |x| above), carries aRoad = 1: on that cloth, and only there, an echo's black band
    // is not drawn (the road's rule in the cloth's own shader, parts file: molaEcho under MOLA_ROAD; by the designers'
    // ruling of 7 October 14:03, an amendment of the brief). The flag is a vertex's own; between a road vertex and its
    // neighbour the cloth changes at the half-way line: 0.4 to 1.0 m behind the walls' feet as the feet wander (1.6 m in
    // the last strip, z over 141) and 6 cm outside the channel's mouth.
    sandGeo.setAttribute('aRoad', new THREE.BufferAttribute(sRoad, 1));
    scene.add(new THREE.Mesh(sandGeo, mat({ stack: LV.sand, bandW: 1.7, hem: 0.12, side: THREE.FrontSide, road: true })));
    await ctx.yield();

    // ---- CARDS: water dashes, sand and wall dashes, grass, shoal, worms, fans, spawn beads
    const R3 = (r) => { const a = r.range(0, 6.283); return [Math.cos(a), r.range(-0.2, 0.2), Math.sin(a)]; };
    const dashes = [], nD = Math.round((livery === 'night' ? 1300 : 2400) * detail * dens);
    for (let i = 0; i < nD; i++) { const c = rDash.pick(LV.dash); dashes.push({ p: [rDash.range(0, 120), rDash.range(0, 64), rDash.range(0, 120)], f: R3(rDash), d: [rDash.range(0.35, 0.75), rDash.range(0, 6.28), 0, 0], c: [c[0], c[1], 0] }); }
    scene.add(cardMesh(shared, K, 0, [1, 0.3], dashes));
    await ctx.yield();
    const stat = [], sc2 = LV.sand;
    for (let i = 0; i < Math.round(1700 * detail); i++) {
      const a = rSand.range(0, 6.283), r = 23 + 50 * Math.sqrt(rSand()), x = Math.sin(a) * r, z = 5 + Math.cos(a) * r, f = R3(rSand);
      stat.push({ p: [x, 0.14, z], f: [f[0], 0, f[2]], d: [rSand.range(0.45, 0.95), 0, 0, 0], c: [sc2[rSand.int(0, 2)], rSand.pick([4, 1, 5]), 0] });
    }
    // THE CHANNEL FLOOR'S 500 DASHES, ONE TO A CELL (no plain floor in the channel): dealt freely over the floor they fell
    // in clumps and left patches of it bare, black ones beside the road's bands among them. The floor (7.4 m across,
    // which is clear of both walls wherever they wander, z 64 to 144) is ruled into 10 x 50 cells of 0.74 x 1.6 m and
    // dash i is sewn in cell i, anywhere in the middle seven eighths of it each way. A patch of the floor wider than
    // 1.39 m and longer than 3 m therefore always holds the whole middle of one cell, and so a dash: none wider than
    // 1.5 m and longer than 3 m is left without a sewn mark. Same stream and the same draws in the same order (a place
    // across, a place along, tilt, size, two cloths): the count, the sizes and the cloths are what they were.
    for (let i = 0; i < 500; i++) { const cx = -3.7 + 0.74 * (i % 10), cz = 64 + 1.6 * Math.floor(i / 10); stat.push({ p: [rSand.range(cx + 0.04625, cx + 0.69375), 0.14, rSand.range(cz + 0.1, cz + 1.5)], f: [rSand.range(-0.3, 0.3), 0, 1], d: [rSand.range(0.3, 0.6), 0, 0, 0], c: [sc2[rSand.int(1, 3)], rSand.pick([4, 5]), 0] }); }
    scene.add(cardMesh(shared, K, 5, [1, 0.3], stat));
    const grass = [];
    for (let i = 0; i < Math.round(800 * detail); i++) { const sd = rGrass.chance(0.5) ? 1 : -1; grass.push({ p: [sd * rGrass.range(2.0, 3.8), 0, rGrass.range(60, 144)], f: [0, 1, 0], d: [rGrass.range(0.7, 1.15), rGrass.range(0, 6.28), 0, 0], c: [7, livery === 'night' ? 2 : 4, 0] }); }
    scene.add(cardMesh(shared, K, 2, [1, 0.075], grass));
    await ctx.yield();
    // the school's three liveries, each in the palette's own cloths (lozenge, inner cut, tail): turquoise with a cobalt
    // cut, yellow with a cobalt cut, or turquoise with a yellow cut, the tail black in all three
    const SHC = [[2, 6, 3], [4, 6, 3], [2, 4, 3]][shoalKind], shoal = [];
    for (let i = 0; i < Math.round(900 * detail * dens); i++) shoal.push({ p: [rShoal.range(6, 19), rShoal.range(-4, 4), 0], f: [1, 0, 0], d: [rShoal.range(0.36, 0.48), rShoal.range(0, 6.283), 1, 0], c: SHC });
    scene.add(cardMesh(shared, K, 1, [1, 0.45], shoal));
    await ctx.yield();
    // CHRISTMAS TREE WORMS: the hero seats a pair every 2.5 m on alternate lips for the whole length of the slot (a rule of
    // the lane); each twin spiral stands 1.6 to 1.9 m (the design's 1.5 m and its hole's collar; size and colour from the worms' own stream)
    // and snaps shut by its own distance from the lens: open beyond 6 m, shut at 3.5 m
    const wormC = [[4, 5, 3], [5, 4, 3], [6, 2, 3]], worms = [];
    for (let i = 0; i < A.wormSeats.length; i += 2) { const c = rWorm.pick(wormC), sz = rWorm.range(0.8, 0.95), ph = rWorm.range(0, 6.283); for (let j = 0; j < 2 && i + j < A.wormSeats.length; j++) { const w = A.wormSeats[i + j]; worms.push({ p: w.position.toArray(), f: w.up.toArray(), d: [sz * (j ? 0.86 : 1), ph + j * 1.7, 0, 0], c }); } }
    scene.add(cardMesh(shared, K, 3, [1, 0.5], worms));
    const fanC = livery === 'night' ? [5, 2, 3] : [5, 1, 3], fans = A.fanSeats.map((s, i) => ({ p: s.position.toArray(), f: [0, 1, 0], d: [s.uphill ? 3.6 : 6.6, i * 2, 0, 0], c: fanC }));
    for (const h of live) for (let k = 0; k < 2; k++) { const a = rFans.range(0, 6.28); fans.push({ p: [h.x + Math.cos(a) * h.R * 0.35, h.H * (k ? 0.6 : 0.95), h.z + Math.sin(a) * h.R * 0.35], f: [0, 1, 0], d: [rFans.range(5, 10), rFans.range(0, 6), 0, 0], c: fanC }); }
    for (let z = 69; z < 176; z += 8.5) for (const sd of [-1, 1]) fans.push({ p: [sd * (5.7 + rFans.range(0, 1.6)), wallTop(z) - 0.15, z + rFans.range(-2, 2)], f: [0, 1, 0], d: [rFans.range(3.6, 6.4) * (z < 90 ? 0.75 : 1), rFans.range(0, 6), 0, 0], c: fanC });
    fans.push({ p: [-2.9 * sx0, 0, 100.5], f: [0, 1, 0], d: [3.7, 1.3, 0, 0], c: fanC }, { p: [3.0 * sx0, 0, 88], f: [0, 1, 0], d: [2.9, 4.1, 0, 0], c: fanC });
    for (const [ca, cr2, sz] of [[-25, 1, 4.8], [-17, 2.5, 5.8], [-9, 4, 4.6], [-1, 1.5, 6.2], [8, 3.5, 5.0], [17, 1.5, 5.8], [26, 2, 4.6]]) { const q = crest.point(ca, cr2, V(0, 0, 0)); fans.push({ p: [q.x, crest.heightAt(ca, cr2) - 0.25, q.z], f: [0, 1, 0], d: [sz, ca, 0, 0], c: fanC }); }   // on the outer crest, beyond its ridge line
    scene.add(cardMesh(shared, K, 4, [0.5, 0.42], fans));
    await ctx.yield();
    const beads = [];
    for (let i = 0; i < 1400; i++) { const a = rBeads.range(0, 6.283), r = 22 * Math.sqrt(rBeads()), t = rBeads() < 0.3 ? rBeads() : 0; beads.push({ p: [Math.cos(a) * r + portalP.x * t, rBeads.range(0, 72), Math.sin(a) * r + portalP.z * t], f: [0, 1, 0], d: [0.2, rBeads.range(0, 6.28), 0, 0], c: [rBeads.chance(0.5) ? 5 : 4, rBeads.chance(0.5) ? 4 : 5, 0] }); }
    const beadMesh = cardMesh(shared, K, 6, [1, 1], beads); beadMesh.visible = rare; scene.add(beadMesh);
    await ctx.yield();
    // big two-tone dashes in a tube 12 to 25 m round the climb line: something streams past all the way up to the ring
    const exD = [], e1 = hAx, e2 = new THREE.Vector3().crossVectors(exitDir, hAx).normalize(), exC = nightL ? [[3, 5], [3, 2], [2, 3]] : [[5, 1], [3, 1], [6, 2], [5, 4]];
    for (let i = 0; i < 120; i++) {
      const t = rClimb.range(-105, 6), a = rClimb.range(0, 6.283), r = rClimb.range(11, 24), c = rClimb.pick(exC), f = R3(rClimb);
      const q = portalP.clone().addScaledVector(exitDir, t).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r);
      if (q.y > 80 || q.y < 16) continue;
      exD.push({ p: q.toArray(), f, d: [rClimb.range(0.8, 1.4), 0, 0, 0], c: [c[0], c[1], 0] });
    }
    scene.add(cardMesh(shared, K, 5, [1, 0.3], exD));
    await ctx.yield();

    // ---- THE HAWKSBILL: carapace with Voronoi scutes, plastron, head, four flippers
    const sc = [];
    for (let i = 0; i < 5; i++) sc.push([0, -0.62 + i * 0.31]);
    for (let i = 0; i < 4; i++) sc.push([0.48, -0.5 + i * 0.33], [-0.48, -0.5 + i * 0.33]);
    for (let i = 0; i < 24; i++) sc.push([Math.cos(i / 24 * 6.283 + 0.13) * 0.93, Math.sin(i / 24 * 6.283 + 0.13) * 0.93]);
    const scute = (x, z) => { let d1 = 81, d2 = 81; for (let k = 0; k < sc.length; k++) { const ax = x - sc[k][0], az = z - sc[k][1], d = ax * ax + az * az; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } return (Math.sqrt(d2) - Math.sqrt(d1)) * 1.45; };   // squared distances: no Math.hypot in the inner loop
    const gt = mkGeo();
    for (const top of [1, -1]) {
      gt.grid(80, 22, (u, v) => {
        const th = u * 6.283, s = Math.sin(th), c = Math.cos(th), r = v * (1 + (s < 0 ? 0.035 * Math.abs(Math.sin(th * 12)) : 0)), k = Math.pow(Math.max(1 - v * v, 0), top > 0 ? 0.7 : 0.5);
        const x = 2.5 * r * c * (1 - 0.16 * Math.max(0, -s)), z = 3.2 * r * s;
        return [x, top > 0 ? 1.1 * k : -0.5 * k, z, v > 0.995 ? 0 : scute(v * c, v * s), x, z];
      });
      await ctx.yield();
    }
    gt.grid(18, 10, (u, v) => { const th = u * 6.283, ph = v * Math.PI, sp = Math.sin(ph); return [0.62 * sp * Math.cos(th), 0.15 + 0.55 * sp * Math.sin(th), 3.75 - 1.05 * Math.cos(ph) * (Math.cos(ph) < 0 ? 1.25 : 1), 0.7 * sp, th * 0.6, v * 2]; });
    await ctx.yield();
    const turtleMat = mat({ stack: LV.turtle, bandW: 0.1, hem: 0.03 });   // every scute steps through all four cloths
    const turtle = new THREE.Group(); turtle.add(new THREE.Mesh(gt.build(), turtleMat));
    const gf = mkGeo();
    gf.grid(36, 6, (u, v) => { const th = u * 6.283, x = 1.5 + 1.5 * v * Math.cos(th), z = 0.62 * v * Math.sin(th) * (1.2 - 0.25 * Math.cos(th)) - 0.12 * x * x; return [x, 0.13 * Math.sqrt(Math.max(1 - v * v, 0)), z, (1 - v) * 0.62, x, z]; });
    const flipGeo = gf.build(), flips = [];
    for (const [sx, px, pz, s, ry] of [[1, 1.9, 1.7, 1, -0.25], [-1, -1.9, 1.7, 1, 0.25], [1, 1.5, -2.5, 0.55, -1.0], [-1, -1.5, -2.5, 0.55, 1.0]]) {
      const f = new THREE.Mesh(flipGeo, turtleMat); f.position.set(px, 0, pz); f.scale.set(sx * s, s, s); f.rotation.y = ry; turtle.add(f); flips.push(f);
    }
    turtle.name = 'turtle'; scene.add(turtle);
    await ctx.yield();
    // turtle track (u-keyed knots): at the entry it is 46 m ahead, crossing the channel broadside above the lowered walls;
    // it turns for the dome, then LEADS us 9 m ahead and 3.4 m above the path across the bowl (plastron overhead, its bands
    // on the dome below), peels off round the front of the dome over the mouth and swims LOW in the moat outside the
    // rampart (never under 2.2 m off the sand), then rises over the moat: along the first window it is 7 m out and 1.9 m
    // under the eye line (the outer crest's inner tiers begin 8 m out and 4 m lower: body and flippers stay clear of them),
    // swimming the way we go at a third of our speed: 10 m ahead as the wall comes down, abeam past the middle, astern as
    // the wall stands up again, so the line of sight to it always crosses the lowered stretch and we look down on its
    // carapace; it banks into its turns (see update); then it sinks back into the moat, falls astern and swims on (the last knots).
    const w0 = A.windows[0], wOut = w0.outward.clone().setY(0).normalize(), sx = f0.x >= 0 ? 1 : -1;
    const lead = (u, up) => path.pointAt(u + 0.027).add(V(0, up, 0));
    const escL = hero.lane.at(0), esc = (u, out, up, ahead = 10) => { hero.lane.at(sOf(u) + ahead, escL); return escL.top.clone().addScaledVector(escL.right, escL.outer * out).add(V(0, up, 0)); };
    const kPeel = lead(uArc + 0.035, 8.0);
    { const r = Math.hypot(kPeel.x, kPeel.z) || 1, k = Math.max(25, r) / r; kPeel.x *= k; kPeel.z *= k; }      // clear of the dome's front flank
    const escY = (u, out, up, ahead) => { const q = esc(u, out, up, ahead); q.y = Math.max(q.y, 2.2); return q; };
    // the same by metres of lane (s), out from the lane's centre, with a run along its tangent
    const sT = sOf(uWin[0] + 0.1) - 21, escS = (s, out, up, along) => { hero.lane.at(clamp(s, 0, LANE - 14), escL); const q = escL.top.clone().addScaledVector(escL.right, escL.outer * out).addScaledVector(escL.tangent, along).add(V(0, up, 0)); q.y = Math.max(q.y, 2.2); return q; };
    const tPh = rTurtle.range(0, 6.283);                // the phase of its stroke and its bob: its own
    const TK = [[0, V(-14 * sx, 9.5, 92)], [0.055, V(-5 * sx, 7.5, 88.5)], [0.11, V(5 * sx, 6, 84)], [0.155, V(5.5 * sx, 7.5, 68)], [uBowl, V(3.5 * sx, 8.8, 53)],
      [uBowl + 0.06, lead(uBowl + 0.06, 3.4)], [uArc - 0.03, lead(uArc - 0.03, 3.4)], [uArc + 0.035, kPeel],
      [uS0 + 0.02, escY(uS0 + 0.02, 7.5, -4.6, 12)], [uWin[0] - 0.065, escY(uWin[0] - 0.065, 7, -2.1, 16)], [uWin[0] - 0.028, escY(uWin[0] - 0.028, 7, -2.1, 10.5)], [uWin[0], escY(uWin[0], 7, -2.1, 4.2)], [uWin[0] + 0.026, escY(uWin[0] + 0.026, 7, -2.2, -1.8)],
      [uWin[0] + 0.06, escY(uWin[0] + 0.06, 7, -4.2, -10)], [uWin[0] + 0.1, escS(sT, 7, -4.4, 0)],
      // it does not stop there: it swims on round the moat the way it was going, low under the rampart, at about 3 m/s
      // (14 m of lane for every tenth of the flight), and then out from the dome over the bowl, to the end of the flight
      [uWin[0] + 0.2, escS(sT + 14, 7.5, -4.6, 0)], [uWin[0] + 0.3, escS(sT + 28, 9, -5, 0)], [1, escS(sT + 34, 30, -5, 12)]];
    const tCurve = new THREE.CatmullRomCurve3(TK.map((k) => k[1]), false, 'centripetal');
    const tAt = (u, out) => { let i = 0; while (i < TK.length - 2 && u > TK[i + 1][0]) i++; const f = clamp((u - TK[i][0]) / (TK[i + 1][0] - TK[i][0]), 0, 1); return tCurve.getPoint((i + f) / (TK.length - 1), out); };

    // ---- FISH: the pace fish (leads through the slot above the lips) and the queen angelfish at the sea fans.
    // Each kind of pace fish wears its own cut (cut 1, 2 or 0):
    //   1 PARROT: cloth bands H/5 wide, so the flank is NOT a bullseye of rings: one outline band round the edge, then the
    //     back in the second cloth and the belly in the third (split along the lateral line), a gill bar across the flank
    //     behind the eye, a pectoral fin panel behind the bar, and a three-ring eye well forward
    //   2 TRUNK: the spotted trunkfish "in black with yellow dots": a deep black body, three staggered rows of yellow
    //     dots sewn on each flank and a fourth of four under them toward the keel, a yellow-ringed eye, and its three fins
    //     in yellow cloth hemmed with black (it swims above the eye line: its yellow is where it is seen from)
    //   0 ANGEL: a tall disc cut in concentric bands, like the angelfish at the fans
    const fishGeo = (L, H, cut) => {
      const g = mkGeo(), parrot = cut > 0;
      for (const sg of [1, -1]) g.grid(40, 9, (u, v, i, j) => { const th = u * 6.283, c = Math.cos(th), z = L * 0.5 * v * c, y = H * 0.5 * v * Math.sin(th) * (0.8 + 0.2 * c); return [sg * 0.2 * H * Math.sqrt(Math.max(1 - v * v, 0)) * (0.55 + 0.45 * c), y, z, !parrot || j >= 8 ? (1 - v) * H * 0.5 : (cut === 2 || Math.sin(th) <= -1e-6 ? 0.5 : 0.3) * H, z, y]; });   // (parrot: the outline band is the outer ninth only, so the flank is cloth, not outline)
      // a point on the flank at length z and height yn (-1 belly .. 1 back), lifted off the cloth
      const flank = (z, yn, lift) => { const k = 2 * z / L, v = Math.abs(k) + (0.96 - Math.abs(k)) * Math.abs(yn), c = v > 1e-6 ? k / v : 0, sn = Math.sign(yn) * Math.sqrt(Math.max(1 - c * c, 0)); return [0.2 * H * Math.sqrt(Math.max(1 - v * v, 0)) * (0.55 + 0.45 * c) + lift, H * 0.5 * v * sn * (0.8 + 0.2 * c)]; };
      if (cut === 2) {
        for (const sg of [1, -1]) for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) {
          const z0 = (c * 0.125 + (r ? 0 : 0.0625) - 0.03) * L, y0 = r * 0.19 * H, rd = 0.07 * H;
          g.grid(8, 1, (u, v) => { const th = u * 6.283, z = z0 + rd * v * Math.cos(th), y = y0 + rd * v * Math.sin(th), ka = 2 * z / L, kb = 2 * y / (0.9 * H), kv = Math.max(Math.hypot(ka, kb), 1e-4); return [sg * (0.2 * H * Math.sqrt(Math.max(1 - kv * kv, 0)) * (0.55 + 0.45 * ka / kv) + 0.04), y, z, 0.3 * H, u, v]; });
        }
        // THE BELLY ROW: the same dots (size, spacing along the row, stagger) under the lowest flank row, toward the keel.
        // Between that row and the keel the body has a third of a metre of cloth at its deepest and a dot is 0.31 m across,
        // so ONE more row is all the belly holds: it lies 0.093 H under the lowest row (its dots 2.5 cm clear of that row's),
        // each dot on the body's true surface (bodyX) and lifted as the others are; a dot the keel would cut is left out
        const keelY = (z) => { const k = clamp(2 * z / L, -1, 1); return H * 0.5 * Math.sqrt(1 - k * k) * (0.8 + 0.2 * k); };
        const bodyX = (z, y) => { const k = 2 * z / L; let lo = Math.abs(k), hi = 1; for (let i = 0; i < 26; i++) { const v = (lo + hi) / 2; if (H * 0.5 * Math.sqrt(Math.max(v * v - k * k, 0)) * (0.8 + 0.2 * k / v) < Math.abs(y)) lo = v; else hi = v; } return 0.2 * H * Math.sqrt(Math.max(1 - hi * hi, 0)) * (0.55 + 0.45 * k / hi); };
        for (const sg of [1, -1]) for (let c = -2; c <= 2; c++) {
          const z0 = (c * 0.125 + 0.0325) * L, y0 = -0.283 * H, rd = 0.07 * H; let overKeel = false;
          for (let i = 0; i < 8; i++) { const th = i / 8 * 6.283; if (rd * Math.sin(th) + y0 < 0.03 - keelY(z0 + rd * Math.cos(th))) overKeel = true; }
          if (overKeel) continue;
          g.grid(8, 1, (u, v) => { const th = u * 6.283, z = z0 + rd * v * Math.cos(th), y = y0 + rd * v * Math.sin(th); return [sg * (bodyX(z, y) + 0.04), y, z, 0.3 * H, u, v]; });
        }
      }
      if (cut === 1) {
        for (const sg of [1, -1]) {
          g.grid(1, 14, (u, v) => { const yn = v * 2 - 1, z = (lerp(0.25, 0.19, u) - 0.035 * (1 - yn * yn)) * L, q = flank(z, yn, 0.025); return [sg * q[0], q[1], z, 0.05 * H, u, v]; });
          g.grid(14, 3, (u, v) => { const th = u * 6.283; return [sg * (0.2 * H + 0.05), -0.07 * H + 0.1 * H * v * Math.sin(th), (0.085 + 0.085 * v * Math.cos(th) - 0.03 * v * v) * L, (1 - v) * 0.45 * H, th, v]; });
        }
      }
      // a forked tail, a dorsal and an anal fin swept back, and a ringed eye on each flank: it has to read as a fish
      // (the trunkfish's three fins are yellow cloth with a black hem at the outer edge: finE takes the metres in from that
      // edge and sets them so that the first 7 cm are the outline's black and all within is the second cloth, the cloth
      // bands being H/5 wide; the parrot's and the angel's fins keep their own cut)
      const finE = (d) => H / 5 - 0.07 + Math.min(d, 0.4);
      g.grid(10, 3, (u, v) => { const a = u * 2 - 1; return [0, a * v * 0.5 * H, -L * 0.5 + 0.25 - v * 0.34 * L * (0.62 + 0.38 * Math.abs(a)), cut === 2 ? finE(Math.min((1 - Math.abs(a)) * v * 0.39 * H, (1 - v) * 0.34 * L * (0.62 + 0.38 * Math.abs(a)))) : (1 - Math.abs(a)) * v * H * 0.3 + 0.02, a, v]; });
      const top = (z0) => { const c = clamp(2 * z0 / L, -1, 1); return H * 0.5 * Math.sqrt(1 - c * c) * (0.8 + 0.2 * c); };
      for (const sg of [1, -1]) g.grid(8, 2, (u, v) => { const z0 = lerp(0.2, -0.32, u) * L, hf = (sg > 0 ? 0.26 : 0.17) * H * Math.sqrt(Math.sin(Math.PI * Math.min(u * 1.15, 1))); return [0, sg * (top(z0) - 0.06 + v * hf), z0 - v * 0.1 * L, cut === 2 ? finE((1 - v) * hf) : (1 - v) * 0.2 * H + 0.02, u, v]; });
      for (const sg of [1, -1]) g.grid(12, 3, (u, v) => { const th = u * 6.283, r = (parrot ? 0.095 : 0.11) * H * v; return [sg * ((parrot ? 0.165 : 0.185) * H - 0.03 * v * v), 0.09 * H + r * Math.sin(th), (parrot ? 0.335 : 0.27) * L + r * Math.cos(th), (1 - v) * (parrot ? 0.5 : 0.23) * H, th, v]; });
      return g.build();
    };
    // outline cloths chosen against the ceiling: magenta, cobalt or black, never the ceiling's own turquoise; the BELLY
    // (third cloth) is what we see, since the fish always swims above the eye line: orange or red, never the ceiling's
    // turquoise nor the outline's black (a black belly under a black outline made the whole fish a black hole); the
    // trunkfish is the design's black fish, its third cloth black, so it carries its yellow in its dots, belly row and fins
    // the three kinds: stoplight parrotfish (4.6 m, 5.75 at its 1.25 scale: an amendment of the brief), queen angelfish, spotted trunkfish
    const PK = [[4.6, 1.8, [5, 4, 1, 5], 1, 1.8 / 5], [3.5, 3.1, [6, 4, 1, 4], 0, 0.36], [4.0, 2.2, [3, 4, 3, 4], 2, 2.2 / 5]][paceKind], PKC = [PK[2][0], PK[2][1], PK[2][2]];
    const paceFish = new THREE.Group(), paceBody = new THREE.Mesh(fishGeo(PK[0], PK[1], PK[3]), mat({ stack: PK[2], bandW: PK[4], hem: 0.04, echoOnly: 99 })); paceFish.add(paceBody); paceFish.scale.setScalar(1.25); paceFish.name = 'pace'; scene.add(paceFish);
    // QUEEN ANGELFISH hang at sea fans, and only there: two at the mouth's fans, one over the bowl, two at fans on the
    // outer crest across the moat (none over the crown: nothing swims above it). Each bobs and turns on its own phase.
    const angelGeo = fishGeo(3, 3, 0), angelMat = mat({ stack: [6, 4, 2, 4], bandW: 0.36, hem: 0.04 }), angels = [], aPh = [];
    const aSpots = [A.fanSeats[0].position.clone().add(V(0, 5.5, 3)), A.fanSeats[1].position.clone().add(V(0, 7.5, 3.5)), path.pointAt(uBowl + 0.02).add(V(-10 * sx, 3.5, -6))];
    for (const [ca, cr2] of [[-9, 4], [8, 3.5]]) { const q = crest.point(ca, cr2, V(0, 0, 0)); q.y = crest.heightAt(ca, cr2) + 4.6; aSpots.push(q); }
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(angelGeo, angelMat); m.position.copy(aSpots[i]); m.name = 'angel' + i; scene.add(m); angels.push(m); aPh.push(rAngel.range(0, 6.283)); }
    await ctx.yield();

    // ---- THE OCTOPUS: mantle on the OUTER rim (open water behind it), two fat arms arched over the slot as a gate,
    // two along the shoulder, two down the rampart's outer face, two on the top step; two ringed eyes face the camera
    const OG = A.octopusGate, oUp = OG.up.clone().normalize(), oAc = OG.across.clone().normalize(), oT = new THREE.Vector3().crossVectors(oUp, oAc).normalize();
    const oSide = OG.outer >= 0 ? 1 : -1, go = mkGeo(), OW = livery === 'noon' ? 0.16 : 0.22, lnT = hero.lane.at(OG.s);
    const L3 = (x, y, z) => V(0, 0, 0).addScaledVector(oAc, x * oSide).addScaledVector(oUp, y).addScaledVector(oT, z);
    const RL = (ds, lat, h) => { hero.lane.at(OG.s + ds, lnT); return lnT.top.clone().addScaledVector(lnT.right, lat * lnT.outer).addScaledVector(lnT.up, h).sub(OG.position); };
    const mC = L3(2.0, 2.55, 0);                        // the mantle stands 0.85 m clear above the outer lip, both eyes with it
    go.grid(22, 18, (u, v, i, j) => { const th = u * 6.283, ph = v * Math.PI, sp = Math.sin(ph), st = Math.sin(th), q = L3(1.6 * sp * Math.cos(th) * (1 + 0.07 * Math.sin(3 * ph + 0.6)), 1.7 * Math.cos(ph), 2.1 * sp * st * (st > 0 ? 1.3 : 1)).add(mC); return [q.x, q.y, q.z, OW * 2.3 * Math.abs(((j / 3) % 2) - 1), th, v * 4]; });
    const armDefs = [
      [L3(1.2, 1.9, -0.9), L3(-0.5, 3.9, -1.3), L3(-2.05, 0.22, -2.0), 0.5, 0.2],
      [L3(1.2, 1.9, 0.9), L3(-0.5, 3.9, 1.3), L3(-2.05, 0.22, 2.0), 0.5, 0.2],
      [L3(2.0, 1.6, 1.4), RL(2.4, 2.0, 1.6), RL(4.8, 1.95, 0.3), 0.45, 0.09],
      [L3(2.0, 1.6, -1.4), RL(-2.4, 2.0, 1.6), RL(-4.8, 1.95, 0.3), 0.45, 0.09],
      [L3(2.8, 1.8, 1.0), L3(3.9, 1.2, 1.7), L3(3.05, -2.7, 2.7), 0.42, 0.09],
      [L3(2.8, 1.8, -1.0), L3(3.9, 1.2, -1.7), L3(3.05, -2.7, -2.7), 0.42, 0.09],
      [L3(1.5, 1.5, 1.5), L3(1.2, 1.4, 2.9), L3(1.7, -0.5, 4.0), 0.36, 0.1],
      [L3(1.5, 1.5, -1.5), L3(1.2, 1.4, -2.9), L3(1.7, -0.5, -4.0), 0.36, 0.1],
    ];
    for (const [p0, p1, p2, r0, r1] of armDefs) {
      const cv = new THREE.QuadraticBezierCurve3(p0, p1, p2), fr = cv.computeFrenetFrames(24, false), pp = new THREE.Vector3();
      go.grid(10, 24, (u, v, i, j) => { cv.getPointAt(v, pp); const r = lerp(r0, r1, v), a = u * 6.283; pp.addScaledVector(fr.normals[j], Math.cos(a) * r).addScaledVector(fr.binormals[j], Math.sin(a) * r); return [pp.x, pp.y, pp.z, OW * 4 * Math.abs(((j / 2) % 2) - 1), a * 0.3, v * 6]; });   // ring bands: eight cloth bands to every four rings of the tube, so an arm reads as a banded tube and not as slabs
    }
    const octoMat = mat({ stack: livery === 'night' ? [5, 2, 4, 6] : [5, 1, 3, 2], bandW: OW, hem: 0.03 });   // mantle: magenta and orange with a black pin-stripe
    const octo = new THREE.Mesh(go.build(), octoMat); octo.position.copy(OG.position); octo.name = 'octopus'; scene.add(octo);
    const ge = mkGeo();
    for (const sd of [-1, 1]) {
      const ec = L3(0.72 * sd, 0.5, -1.72).add(mC), ax = L3(0.35 * sd, -0.12, -1).normalize(), e1 = new THREE.Vector3().crossVectors(ax, oUp).normalize(), e2 = new THREE.Vector3().crossVectors(e1, ax);
      ge.grid(14, 7, (u, v) => { const th = u * 6.283, ph = (1 - v) * 1.75, sp = Math.sin(ph) * 0.5, q = ec.clone().addScaledVector(ax, Math.cos(ph) * 0.5).addScaledVector(e1, Math.cos(th) * sp).addScaledVector(e2, Math.sin(th) * sp); return [q.x, q.y, q.z, v * 0.56, th * 0.2, v]; });
    }
    octo.add(new THREE.Mesh(ge.build(), mat({ stack: [3, 1, 1, 3], bandW: 0.13, hem: 0.03 })));
    const octoPos = OG.position.clone().add(mC), uGate = uS0 + (OG.s - 1.5) / (LANE - 2.5) * (uS1 - uS0);
    await ctx.yield();

    // ---- THE SLOT'S CAST (their courses), POIS, PACE
    const win1 = A.windows[1] || A.windows[0], sA = path.pointAt(uBowl + 0.07).add(V(-15 * sx, 1.5, 4));
    // places along the slot, in metres of lane: the two windows, the octopus's gate, and the two forks of the pace fish
    const W0a = w0.s0, W0b = w0.s1, W1a = win1.s0, W1c = (win1.s0 + win1.s1) / 2;
    const bDir = win1.outward.clone().setY(0).normalize();
    const lnA = hero.lane.at(5), lnB = hero.lane.at(11), lnS = hero.lane.at(8), ln = hero.lane.at(8);
    const sA0 = sA.clone().add(V(-30 * sx, nightL ? 16 : 6, -14));   // at night it waits higher, so the dome is clear in the channel mouth
    const uW1 = uWin[1] ?? uWin[0];
    const tp = V(-9 * sx, 7, 60), tq = new THREE.Vector3(), tq2 = new THREE.Vector3(), th = new THREE.Vector3(), cam = new THREE.Vector3(), m4 = new THREE.Matrix4(), Y = V(0, 1, 0), O = V(0, 0, 0), fp = new THREE.Vector3(), fq = new THREE.Vector3(), bx = new THREE.Vector3(), by = new THREE.Vector3(), sh = new THREE.Vector3();
    const TC = livery === 'night' ? [4, 2, 5] : [4, 1, 3], OC = [5, 2, 1];
    const scOf = (u) => 1.5 + (u - uS0) / (uS1 - uS0) * (LANE - 2.5);       // our metres along the slot, running on past both ends
    // the ground under a swimmer anywhere round the hill: the dome with its rampart, the outer crest, or the sand
    const cq = crest.point(0, 0, V(0, 0, 0)), cl = Math.hypot(cq.x, cq.z) || 1, ccx = cq.x / cl, ccz = cq.z / cl;
    // (hero.heightAt is the dome's own grid, which is cut away under the bench and the trench: so also the natural cap,
    // into which the bank is cut, and the rampart of the master groove: its lip level out to 5 m either side of the lane,
    // falling away beyond at 1 in 1, kept on a 1 m grid)
    const GN = 60, lipG = new Float32Array(GN * GN), capR = 18.6, capY = A.crown.y - capR, lnQ = hero.lane.at(0);
    for (let s = 0; s <= LANE - 0.5; s += 1) {
      hero.lane.at(s, lnQ); const cx = lnQ.top.x + GN / 2, cz = lnQ.top.z + GN / 2;
      for (let j = Math.max(Math.floor(cz - 13), 0); j <= Math.min(Math.ceil(cz + 13), GN - 1); j++) for (let i = Math.max(Math.floor(cx - 13), 0); i <= Math.min(Math.ceil(cx + 13), GN - 1); i++) {
        const h = lnQ.top.y - Math.max(Math.hypot(i - cx, j - cz) - 5, 0); if (h > lipG[j * GN + i]) lipG[j * GN + i] = h;
      }
    }
    const lipAt = (x, z) => {
      const gx = clamp(x + GN / 2, 0, GN - 1.001), gz = clamp(z + GN / 2, 0, GN - 1.001), i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j, o = j * GN + i;
      return lerp(lerp(lipG[o], lipG[o + 1], fx), lerp(lipG[o + GN], lipG[o + GN + 1], fx), fz);
    };
    const groundY = (x, z) => { const r2 = x * x + z * z; return Math.max(hero.heightAt(x, z), r2 < capR * capR ? Math.sqrt(capR * capR - r2) + capY : 0, lipAt(x, z), crest.heightAt(Math.atan2(z * ccx - x * ccz, x * ccx + z * ccz) * crest.radius, Math.hypot(x, z) - crest.radius), 0); };
    // THE PACE FISH (the world's declared pacing for it): it keeps a station 8 m ahead of us by METRES FLOWN (of the
    // route: measured from the eye the gap is 8.8 to 9.9 m while it is on station), on a course
    // of its own that is a fixed curve of the world. Until the fork sJ its course lies up the hill from the slot, half a
    // metre nearer the crown for every metre short of the fork (never nearer the axis than 5 m): while we cross the
    // channel and the bowl it swims round the crown, then it winds down the flank ahead of us and slips over the bank
    // into the slot at THE FIRST FORK AFTER THE FIRST WINDOW (sJ: where the eye line is back down, 8 m past the window's
    // end, plus its 8 m lead). From there it leads above the lips in a slow slalom (its own phase), on the outside of
    // each bend, until THE OCTOPUS'S GATE, where it goes off by the fork: out over the outer wall and down the flank at a
    // third more than our pace, and away. Its leaving begins at sK, 10.5 m short of the gate's own metre: begun at the
    // gate itself this same law takes the fish through the arch and the mantle, and 10.5 m is the least lead by which
    // the law's own offset carries it out past the octopus's arms 1.5 m clear of them.
    const sJ = W0b + 16, sK = OG.s - 10.5, fPh = rPace.range(0, 6.283), fishK = { on: 0, yaw: 0 };
    const l0 = hero.lane.at(0), l5 = hero.lane.at(5), lapS = Math.sign(l0.top.z * l5.top.x - l0.top.x * l5.top.z) || 1;   // which way the lane goes round the hill
    const fishAt = (l, time, out) => {
      const s = clamp(l, 0, sK); hero.lane.at(s, ln); hero.lane.at(Math.max(s - 3, 0), lnA); hero.lane.at(Math.min(s + 3, LANE - 0.5), lnB);
      const bendS = clamp(((lnB.tangent.x - lnA.tangent.x) * ln.right.x + (lnB.tangent.y - lnA.tangent.y) * ln.right.y + (lnB.tangent.z - lnA.tangent.z) * ln.right.z) / 0.5, -1, 1);
      const rl = Math.hypot(ln.top.x, ln.top.z) || 1, G = Math.max(rl - 5, 1), dIn = Math.max(sJ - l, 0), off = G * (1 - Math.exp(-0.5 * (Math.sqrt(dIn * dIn + 16) - 4) / G));
      const p = Math.max(l - sK, 0), offOut = 1.1 * p * p / (p + 5), oS = ln.outer || 1;
      const on = (1 - smoothstep(0, 5, off)) * (1 - smoothstep(0, 4, offOut)), ph = time * 1.15 + fPh;
      out.copy(ln.eye).addScaledVector(ln.up, 3.0).addScaledVector(ln.right, (1.2 * Math.sin(ph) - 1.3 * bendS) * on + oS * offOut).addScaledVector(ln.tangent, 0.75 * p);
      if (off > 0) {                                   // up the hill: toward the axis; before the lane begins, back round the hill the way the lane comes
        const a = Math.min(l, 0) / 21 * lapS, ca = Math.cos(a), sa = Math.sin(a), k = 1 - off / rl, x = out.x * k, z = out.z * k;
        out.x = x * ca + z * sa; out.z = z * ca - x * sa;
      }
      const w = Math.max(smoothstep(1.5, 6, off), smoothstep(2, 12, offOut));
      if (w > 0) {                                     // off the lane it swims 3 m over the hill, and never nearer than its own depth to anything it crosses
        const g = groundY(out.x, out.z);
        out.y = Math.max(lerp(out.y, Math.max(g + 3, 3.2), w), g + lerp(1.5, 2.4, smoothstep(0.8, 2.5, off + offOut)));
      }
      fishK.on = on; fishK.yaw = 0.7 * Math.cos(ph) * on;       // it leans into each leg of the slalom, so a flank shows
      return out;
    };
    // THE SHOAL: one school on one course. In the bowl it waits beside the channel mouth and parts round us; as we drop in
    // it takes the water above the slot, 5 m over the lips and 7 m to the downhill side (clear of the hill), 16 m ahead of
    // us. It swims slower than we fly from the first window's end on, so we overhaul it along the slot (its lead closes
    // from 16 m to nothing at the second window); nearing the gate its course comes in over the slot itself; at THE
    // SECOND WINDOW it bursts across the slot and out, opening up, and runs on down the flank at 2.2 times our pace.
    const sPh = own('school').range(0, 6.283), oPh = own('octopus').range(0, 6.283);
    const shoalAt = (u, time, out) => {
      const l = scOf(u), lead = 16 * (1 - smoothstep(W0b, W1a + 3, l)), sx2 = l + lead, sS = W1c - 4 * Math.log(1 + Math.exp(clamp((W1c - sx2) / 4, -20, 20)));
      hero.lane.at(Math.max(sS, 1), lnS);
      const b = Math.max(l - (W1a - 6), 0), acr = 2.2 * b * b / (b + 3);
      out.copy(lnS.top).addScaledVector(lnS.right, (lnS.outer || 1) * 7 * (1 - smoothstep(OG.s - 12, OG.s + 2, sS))).addScaledVector(bDir, acr);
      out.y = Math.max(out.y + 5 - 0.42 * Math.max(acr - 6, 0), 6);
      sh.copy(sA0).lerp(sA, smoothstep(nightL ? 0.2 : 0.12, uBowl + (nightL ? 0.06 : 0.02), u));
      out.lerpVectors(sh, out, smoothstep(-26, 3, l)); out.y += Math.sin(time * 0.4 + sPh) * 0.8;
      return out;
    };
    const uGaze = uS0 + 0.74 * (uS1 - uS0);
    const lnG = hero.lane.at(0), gz = new THREE.Vector3(), gzW = A.windows.map((w, i) => i ? w.position.clone().addScaledVector(w.outward.clone().setY(0).normalize(), 13).add(V(0, -3.5, 0)) : null);
    const gzC = V(0, 0, 0), gzL = hero.lane.at(0);   // the first window looks out at the crest's flank, a little ahead of abeam
    const gzCrest = (time, u) => { hero.lane.at(sOf(u) + 3, gzL); gzC.copy(gzL.top).addScaledVector(gzL.right, gzL.outer * 11); gzC.y -= 5.6; return gzC; };
    const gzS = V(0, 0, 0), gzT = V(0, 0, 0);
    // THE PACE and the place the flight reaches at a design second: the engine's own table (65 samples, clamped, scaled)
    const pace = (u) => 1.22 - 0.58 * smoothstep(uBowl - 0.03, uBowl + 0.06, u) * (1 - smoothstep(uArc - 0.01, uS0, u)) - 0.2 * smoothstep(0.82, 0.92, u);
    const DUR = 46, uAtSec = (S) => {
      const N = 64, pv = [], ct = [0]; for (let i = 0; i <= N; i++) pv.push(clamp(pace(i / N), 0.35, 2.5));
      for (let i = 0; i < N; i++) ct.push(ct[i] + 2 / (pv[i] + pv[i + 1]));
      const tg = clamp(S / DUR, 0, 1) * ct[N]; let i = 0; while (i < N - 1 && ct[i + 1] < tg) i++;
      return (i + clamp((tg - ct[i]) / (ct[i + 1] - ct[i]), 0, 1)) / N;
    };
    // THE RING IS HELD FROM 33 s: the last portal pull is at its full weight at the place the flight reaches at 33 s (or
    // at the slot's end if that comes first), having risen over the very stretch the hook's pull falls away on, so the
    // two never leave the ring unheld between them
    const u33 = uAtSec(33), pFall = 0.45 * (uS1 - uGaze), pFrom = Math.min(uS1, u33) - pFall;
    const pois = [
      // down the trench, 8.5 m ahead on the groove's own line, the whole slot long: ONE pull (in the sweeping camera it
      // agrees with lookAhead 10; the steady camera looks 34 m ahead and takes it at a third)
      { at: (time, u) => gz.copy(hero.lane.at(sOf(u) + 8.5, lnG).eye), from: uS0 + 0.012, to: uS1 - 0.015, weight: 0.9, fade: 0.08 },
      { at: (time, u) => shoalAt(u, time, gzS), from: uS0 + 0.01, to: uWin[0] - 0.03, weight: 0.26, fade: 0.25 },    // the school in the water over the slot ahead
      { at: gzCrest, from: uWin[0] - 0.04, to: uWin[0] + 0.035, weight: 0.72, fade: 0.3 },   // out over the moat at the crest's maze, with the turtle alongside
      { at: gzW[gzW.length - 1], from: uW1 - 0.03, to: uW1 + 0.02, weight: 0.22, fade: 0.4 },
      { at: V(0, 7.5, 0), from: 0.0, to: uArc + 0.03, weight: 0.3, fade: 0.2 },          // the dome, all the way across the bowl
      { at: V(0, 7.5, 0), from: uBowl - 0.03, to: uArc, weight: 0.2, fade: 0.3 },
      { at: (time, u) => tAt(u, gzT), from: uBowl - 0.01, to: uArc - 0.01, weight: 0.3 },   // the turtle leading us
      { at: octoPos, from: uGate - 0.075, to: uGate + 0.004, weight: 0.5, fade: 0.35 },    // the octopus gate
      { at: portalP.clone(), from: uGaze, to: uS1, weight: 0.45, fade: 0.45 },             // leans up to the ring as the hook turns toward it
      { at: portalP.clone(), from: pFrom, to: 1, weight: 0.5, fade: Math.min(pFall / (1 - pFrom), 0.5) },
    ];

    function update(dt, time, camera, u) {
      hero.update(dt, time, camera);
      cam.setFromMatrixPosition(camera.matrixWorld); K.uCam.value.copy(cam); sky.position.copy(cam);
      K.uRise.value = rare ? smoothstep(0.38, 0.5, u) : 0;
      // turtle: its u-keyed track (TK), on the flight's own clock
      tAt(u, tp); tAt(clamp(u + 0.004, 0, 1), tq); th.subVectors(tq, tp);
      if (th.lengthSq() < 1e-8) th.set(1, 0, 0); th.normalize();
      tp.y += Math.sin(time * 0.7 + tPh) * 0.25;
      turtle.position.copy(tp); m4.lookAt(th, O, Y); turtle.quaternion.setFromRotationMatrix(m4);
      // it banks into its turns: the roll follows how far its heading swings over the next 0.02 of the flight (0.5 rad at most)
      tAt(clamp(u + 0.02, 0, 1), tq2); tAt(clamp(u + 0.024, 0, 1), tq); tq.sub(tq2); const hl2 = Math.hypot(tq.x, tq.z) || 1, hl1 = Math.hypot(th.x, th.z) || 1;
      turtle.rotateZ(clamp(-3 * (th.z * tq.x - th.x * tq.z) / (hl1 * hl2), -0.5, 0.5));
      const fl = Math.sin(time * 1.7 + tPh);
      flips[0].rotation.z = fl * 0.55; flips[1].rotation.z = -fl * 0.55; flips[2].rotation.z = -fl * 0.2; flips[3].rotation.z = fl * 0.2;
      // the turtle's bands: on the dome only while it passes overhead in the bowl; for the drop they pull in to the sand and
      // the apron (reach 17 -> 9 m, and the dome's own shader lets go of source 0) so the red maze reads clean
      SU.uEchoDome.value = 1 - smoothstep(uArc - 0.03, uArc - 0.004, u);
      hero.setEcho(0, tp, th, 3.0, TC, 0.95, lerp(17, 9, smoothstep(uArc - 0.04, uS0 + 0.02, u)));
      // the paddle: dips on the same 3 s beat as the rings on the ceiling
      const pb = (time % 3) / 3 * 6.283;
      paddle.position.copy(padP); paddle.position.y = 84 + 4.5 - 6 * Math.cos(pb - 0.5);
      paddle.quaternion.copy(padQ).multiply(padR.setFromAxisAngle(padAx, 0.5 * Math.sin(pb - 0.5)));
      // THE PACE FISH: on its own course (fishAt), 8 m ahead of us by metres flown; its heading is its course's own
      // direction, its body leans into each leg of the slalom and its tail beats; its bands show on the slot's walls
      // only while it is over the slot
      const scU = scOf(u);
      fishAt(scU + 8.6, time, fq); fishAt(scU + 8, time, fp); fq.sub(fp);
      if (fq.lengthSq() < 1e-6) fq.copy(ln.tangent); fq.normalize();
      bx.crossVectors(Y, fq); if (bx.lengthSq() < 1e-6) bx.set(1, 0, 0); bx.normalize(); by.crossVectors(fq, bx);
      m4.makeBasis(bx, by, fq); paceFish.quaternion.setFromRotationMatrix(m4); paceFish.position.copy(fp);
      paceBody.rotation.y = -fishK.yaw + Math.sin(time * 5.5 + fPh) * 0.1;
      hero.setEcho(1, fp, fq, 1.1, PKC, 0.66 * fishK.on, 6);
      // octopus: bands breathe and slide; mantle pulses
      octoMat.uniforms.uBand.value.x = OW * (1 + 0.32 * Math.sin(time * 1.9 + oPh));
      const br = 1 + 0.03 * Math.sin(time * 1.3 + oPh); octo.scale.set(br, 1 / br, br);
      hero.setEcho(2, octoPos, oT, 1.9, OC, 0.7, 4.5);
      // THE SHOAL on its course (shoalAt); the school is closed up to half its ring over the slot and opens out at the burst
      K.uShK.value = 1 - 0.5 * smoothstep(-14, 3, scU) * (1 - smoothstep(W1a - 9, W1a + 3, scU));
      shoalAt(u, time, K.uShoal.value);
      hero.setEcho(3, K.uShoal.value, Y, 3.5, SHC, 0.8, 9);
      for (let i = 0; i < 5; i++) { const a = angels[i]; a.position.y = aSpots[i].y + Math.sin(time * 0.8 + aPh[i]) * 0.5; a.rotation.y = 1.2 + i * 1.9 + Math.sin(time * 0.35 + aPh[i] * 1.7) * 0.5; }
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(0, 2.5, 138) }, 0);

    return {
      scene, path, duration: DUR,
      pace,
      camera: { fov: 62, near: 0.12, far: 2400, lookAhead: 10, sway: 0.1, bank: 1 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F4C62A', glow: 0.6, revealDistance: 220, tilt: true },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
