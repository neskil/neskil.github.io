// CABLES TO THE MOON: the life on the roof. Almost none of it is an animal: these are plants that took the animals'
// trades. Everything here stands on the forest, so everything rides cmRoof() (the swells and the crowns on
// them, the same at every distance: nothing here moves because the eye came near) and cmDrop() (the roof falling
// away as we climb). Patterns go to their mean by the pixel's footprint (cmPx); the air is cmHaze.
//   makeRooted()   one mesh: knuckles of bough between the leaves, the bough of the hill's top crown with the six
//                  small green figures on it and one pod beside them, the sap-suckers drinking on the boughs
//   makeTraps()    snap-traps: two great green jaw-leaves with a red-brown throat and pale thorn teeth on a swollen
//                  stalk, few and unlike in size. (mend W, W4) EVERY TRAP HUNTS ON A ROUND OF ITS OWN, on the
//                  world's clock, from a phase its stream drew, whether or not anyone comes: one without a covey
//                  opens slowly and snaps once a round (11 to 19 s); one with a covey waits wide open while the
//                  covey rests, the covey stirs and rises, the jaws snap on the bird over them, stay shut 9 s
//                  and open again, the covey comes down, another bird comes in from the air: once in COVEY.rounds
//                  of the trap's rounds (see COVEY). No moment is written by the eye
//   makeKites()    kite-plants fishing the air on thread stalks, each with a tail of seed pods
//   makeBirds()    seed-birds: flocks of gliding seeds between two leaf wings
import * as THREE from 'three';
import { cmStream, CM_GLSL, CM_RIBBON, withShared, Geo, bound, peakH, hump, ROOF_Y, C, clamp, lerp, sstep } from './cables-to-the-moon-common.js';

const TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
// (mend W, W4) THE ROUND OF A TRAP THAT HAS A COVEY, said ONCE (the traps' program, the birds' program and the deal
// read these): its round lasts `rounds` of the trap's own gaping rounds (11 to 19 s each, its stream's); `snap`
// seconds after the covey stirs the jaws shut (in 0.13 s) and stay shut `shut` seconds, then open over 0.7 of
// the trap's gaping round; the covey is all in the air 1.3 s after it stirs and comes down 14 to 22 s after.
// keep: no bird of a covey comes nearer the road than this, at any point of its round (metres); the deal
// refuses a bird whose line, tried at its coarser points, comes within keep + dealOver.
export const COVEY = { rounds: 3, snap: 2, shut: 9, keep: 12, dealOver: 1.5 };
const CV_GLSL = `const float CV_ROUNDS = ${COVEY.rounds.toFixed(1)}, CV_SNAP = ${COVEY.snap.toFixed(1)}, CV_SHUT = ${COVEY.shut.toFixed(1)};`;

// ---------------------------------------------------------------- things rooted on the roof (one draw)
// position: metres from the thing's base.  aBase: base x, lift over the roof, base z, how much of the swell it rides.
// aAn: a pivot or centre (same space as position) and what moves: 0 nothing, 1 an arm (lifts about its shoulder),
//      2 a bladder (swells about its centre), 3 a whole figure (shifts its weight about its feet).
// aCol: colour.  aPh: phase, and the surface: 0 bark, 1 skin, 2 bladder, 3 amber sap or pod.  aUv: metres along a
// bough or root, and the angle round it.
const ROOT_VERT = /* glsl */`
attribute vec4 aBase, aAn; attribute vec3 aCol; attribute vec2 aPh, aUv;
varying vec3 vW, vN, vC, vL; varying vec2 vK, vUv;
${CM_GLSL}
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c); }
void main(){
  vec3 p = position, n = normal; float kind = aAn.w, ph = aPh.x;
  if (kind > 0.5 && kind < 1.5) {                       // an arm goes up to point, and comes down again
    float lift = smoothstep(0.35, 0.8, sin(uTime*0.23 + ph*40.0))*2.3;
    p = aAn.xyz + rotX(p - aAn.xyz, -lift); n = rotX(n, -lift);
  }
  // the whole figure shifts its weight: a lean from the feet (an arm's pivot is its shoulder, 0.84 m up)
  float lean = 0.07*sin(uTime*0.6 + ph*17.0);
  if (kind > 2.5) p.x += lean*(p.y - aAn.y);
  else if (kind > 0.5 && kind < 1.5) p.x += lean*(0.84 + p.y - aAn.y);
  if (kind > 1.5 && kind < 2.5) {                       // a bladder fills as it drinks and sinks again
    float b = sin(uTime*1.1 + ph*6.2831853);
    p = aAn.xyz + (p - aAn.xyz)*vec3(1.0 + 0.16*b, 1.0 + 0.10*b*b, 1.0 + 0.16*b);
  }
  vec2 xz = aBase.xz + p.xz;
  float y = aBase.w*cmRoof(aBase.xz, uTime) + aBase.y + p.y - cmDrop(xz);
  vW = vec3(xz.x, y, xz.y); vN = n; vC = aCol; vL = position; vK = vec2(aPh.y, ph); vUv = aUv;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
const ROOT_FRAG = /* glsl */`
#define CM_FOLLOW 1.0
varying vec3 vW, vN, vC, vL; varying vec2 vK, vUv;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  vec3 n = normalize(vN); float surf = vK.x;
  float lod = 1.0 - smoothstep(0.07, 0.44, cmPx(vW));     // footprint fade of the bark's cracks and grain (taken before the branch below)
  float ndl = dot(n, uSunDir), toward = clamp(dot(-v, uSunDir), 0.0, 1.0);
  vec3 alb = vC, col;
  if (surf < 0.5) {
    // bark: fibres, cracks, moss on every upper side
    float len = vUv.x, th = vUv.y + vK.y*20.0;
    // long ridges of fibre down the length, fine grain, cracks across it, lichen, moss on every upper side
    float ridge = cmN(vec2(th*5.0 + 0.5*sin(len*0.3), len*0.16));
    float fine = cmN(vec2(th*17.0, len*1.1)), grain = cmN(vec2(th*46.0, len*3.5));
    // (the cracks and the grain go to their own means under the footprint: 0.86 of the light; half)
    float crack = mix(0.86, smoothstep(0.0, 0.18, abs(cmN(vec2(th*2.2, len*0.7 + 7.0)) - 0.5)*2.0), lod);
    float h = mix(0.5, 0.55*ridge + 0.3*fine + 0.15*grain, lod)*crack;
    alb *= 0.35 + 1.25*h;
    alb = mix(alb, vec3(0.42, 0.44, 0.30), smoothstep(0.62, 0.8, cmN(vec2(th*1.6 + 9.0, len*0.2)))*0.45);
    alb = mix(alb, vec3(0.08, 0.16, 0.04)*(0.6 + 0.8*fine), smoothstep(0.05, 0.75, n.y)*smoothstep(0.25, 0.6, cmN(vec2(th*2.0 + 3.0, len*0.13)))*0.9);
    col = alb*(cmSunL*clamp(ndl*0.8 + 0.2, 0.0, 1.0)*0.5 + cmAmb(n)*1.0)*(0.75 + 0.25*crack);
    col += cmSunL*vec3(0.5, 0.42, 0.2)*pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 3.0)*toward*toward*0.3;      // the sun behind it lights its edge
  } else if (surf < 1.5) {
    // green skin: a small dark figure, the sun on its shoulder
    col = alb*(cmSunL*clamp(ndl*0.7 + 0.3, 0.0, 1.0)*0.55 + cmAmb(n)*0.6);
    col += cmSunL*vec3(0.6, 0.8, 0.4)*pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 3.0)*0.12*(0.3 + 0.7*toward);
  } else if (surf < 2.5) {
    // a bladder: pale, veined, the light in its skin
    float vein = 1.0 - smoothstep(0.0, 0.14, abs(cmN(vL.xy*2.6 + vL.z*1.7 + vK.y*30.0) - 0.5)*2.0);
    float thru = pow(clamp(1.0 - abs(dot(n, v)), 0.0, 1.0), 1.5)*(0.35 + 0.65*toward) + 0.35*clamp(-ndl, 0.0, 1.0);
    col = alb*(cmSunL*clamp((ndl + 0.5)/1.5, 0.0, 1.0)*0.5 + cmAmb(n)*0.8)*(1.0 - 0.4*vein) + alb*vec3(1.1, 1.0, 0.45)*cmSunL*thru*0.24;
  } else {
    // amber: sap beads and the pod, the sun coming through
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
    col = alb*(cmAmb(n)*0.55 + cmSunL*(0.14 + 0.5*toward*toward + 0.25*clamp(-ndl, 0.0, 1.0)));
    col += cmSunL*pow(clamp(dot(n, h), 0.0, 1.0), 60.0)*0.8;
  }
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

function rootedGeo() { return new Geo({ aBase: 4, aAn: 4, aCol: 3, aPh: 2, aUv: 2 }); }
// a tube through points [{ p: Vector3, r }], `sides` round; normals outward
function pushTube(G, pts, sides) {
  const n = pts.length, base = G.count, ax = V(0, 0, 0), a = V(0, 0, 0), b = V(0, 0, 0), ref = V(0, 1, 0), uv = 'aUv' in G.a;
  let len = 0;
  for (let i = 0; i < n; i++) {
    if (i) len += pts[i].p.distanceTo(pts[i - 1].p);
    ax.subVectors(pts[Math.min(n - 1, i + 1)].p, pts[Math.max(0, i - 1)].p).normalize();
    if (i === 0 && Math.abs(ax.y) > 0.9) ref.set(1, 0, 0);
    a.crossVectors(ax, ref).normalize(); b.crossVectors(a, ax).normalize(); ref.copy(b);
    for (let k = 0; k <= sides; k++) {
      const th = (k / sides) * TAU, c = Math.cos(th), s = Math.sin(th), q = pts[i];
      if (uv) G.set('aUv', len, th);
      G.v(q.p.x + (a.x * c + b.x * s) * q.r, q.p.y + (a.y * c + b.y * s) * q.r, q.p.z + (a.z * c + b.z * s) * q.r, a.x * c + b.x * s, a.y * c + b.y * s, a.z * c + b.z * s);
    }
  }
  G.stitch(base, n, sides);
}
// an ellipsoid at c with half axes (rx, ry, rz)
function pushBall(G, c, rx, ry, rz, seg = 8, rings = 5) {
  const base = G.count;
  for (let j = 0; j <= rings; j++) {
    const ph = (j / rings) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
    for (let k = 0; k <= seg; k++) {
      const th = (k / seg) * TAU, x = Math.cos(th) * sp, z = Math.sin(th) * sp, nx = x / rx, ny = cp / ry, nz = z / rz, l = Math.hypot(nx, ny, nz) || 1;
      G.v(c.x + x * rx, c.y + cp * ry, c.z + z * rz, nx / l, ny / l, nz / l);
    }
  }
  G.stitch(base, rings + 1, seg, true);
}

// o: { forks: { boughs, suckers, watchers }, path, crowns (the roof's built crowns), peak (ours), keep (the road's one keep-clear on the hill) }
export async function makeRooted(ctx, shared, o) {
  const fr = o.forks || {}, fork = (k) => cmStream(shared, fr[k], k, ctx), G = rootedGeo(), CABLE = shared.cable, pk = o.peak;
  let rng = fork('boughs');
  const BARK = C('#4F4A38'), SKIN = [C('#3F7A3A'), C('#4E8A3C'), C('#356B38')], HAIR = C('#152410'), BLAD = C('#C9D6A4'), AMBER = C('#F0962A'), POD = C('#C9D27A', 0.8);
  const set = (base, lift, follow, an, col, ph, surf) => { G.set('aBase', base.x, lift, base.z, follow); G.set('aAn', an[0], an[1], an[2], an[3]); G.set('aCol', col.r, col.g, col.b); G.set('aPh', ph, surf); };
  // ---- knuckles of bough between the crowns: arches of old wood 2 m thick. THE PATTERN'S RULE: a bough lies in
  // the gap between a built crown and the crown nearest it (half way between their middles, along the line that
  // parts them, give or take 0.5 rad), and one such gap in three has one (stream 'boughs'), over the whole area
  // in which crowns are built (o.crowns: the roof's built crowns). The one thing the road asks: nothing so thick
  // within 16 m of the eye (such a bough is not there).
  const boughs = [], seen = new Set();
  for (let i = 0, ci = 0; ci < (o.crowns || []).length; ci++) {
    const c = o.crowns[ci], has = rng.chance(1 / 3), len = rng.range(9, 24), turn = rng.range(-0.5, 0.5), r0 = rng.range(0.7, 1.25), rise = rng.range(1.2, 2.6), bendK = rng.range(-0.25, 0.25), ph0 = rng();
    const x = (c.x + c.nx) / 2, z = (c.z + c.nz) / 2, key = Math.round(x) + ':' + Math.round(z);
    if (!has || seen.has(key)) continue; seen.add(key);
    if (peakH(pk, x, z) > 2 || o.path.distanceTo(x, shared.hump(x, z, 0), z) < 16) continue;
    const yaw = Math.atan2(c.nz - c.z, c.nx - c.x) + Math.PI / 2 + turn, base = V(x, 0, z), pts = [];
    const dx = Math.cos(yaw), dz = Math.sin(yaw);
    for (let k = 0; k <= 9; k++) {
      const q = k / 9, t = (q - 0.5) * len, side = bendK * len * (q - 0.5) * (q - 0.5) * 2;
      pts.push({ p: V(dx * t - dz * side, -1.9 + rise * 1.9 * Math.sin(Math.PI * q) + 0.25 * Math.sin(q * 11 + i), dz * t + dx * side), r: r0 * (0.75 + 0.35 * Math.sin(Math.PI * q) + 0.18 * Math.sin(q * 17 + i * 3)) });
    }
    set(base, 0, 1, [0, 0, 0, 0], BARK, ph0, 0); pushTube(G, pts, 7);
    boughs.push({ base, pts, r0 }); i++;
    if (i % 12 === 0) await ctx.yield();
  }
  // ---- sap-suckers: pale bladders 2 m tall, snout sunk in a bough, amber beading at the join
  const NSk = o.suckers ?? 40; rng = fork('suckers');
  for (let i = 0; i < NSk && boughs.length; i++) {
    const b = boughs[Math.floor(rng() * boughs.length)], k = 2 + Math.floor(rng() * 6), q = b.pts[k], h = rng.range(1.5, 2.3), w = h * rng.range(0.34, 0.46), ph = rng();
    const foot = V(q.p.x + rng.range(-0.3, 0.3), q.p.y + q.r * 0.8, q.p.z + rng.range(-0.3, 0.3)), c = V(foot.x, foot.y + h * 0.52, foot.z);
    set(b.base, 0, 1, [foot.x, foot.y, foot.z, 2], BLAD, ph, 2); pushBall(G, c, w, h * 0.55, w, 8, 5);
    set(b.base, 0, 1, [0, 0, 0, 0], BLAD.clone().multiplyScalar(0.7), ph, 2);
    pushTube(G, [{ p: V(foot.x, foot.y + 0.25, foot.z), r: w * 0.32 }, { p: V(foot.x, foot.y - 0.3, foot.z), r: w * 0.2 }, { p: V(foot.x, foot.y - 0.7, foot.z), r: 0.05 }], 6);
    for (let d = 0; d < 3; d++) { const a = rng.range(0, TAU), rr = rng.range(0.1, 0.2); set(b.base, 0, 1, [0, 0, 0, 0], AMBER, ph, 3); pushBall(G, V(foot.x + Math.cos(a) * w * 0.4, foot.y - 0.05 - 0.12 * d, foot.z + Math.sin(a) * w * 0.4), rr, rr * 1.3, rr, 5, 3); }
  }
  await ctx.yield();
  // (the great roots of the cable's foot are the rope's own strands: see makeCables in the web file)
  const origin = V(pk.x, 0, pk.z);
  // ---- THE WATCHERS. They stand on the bough of the hill's top crown on the SUN'S side of the cable's foot (the
  // side they can watch the climber from with the light on it; mirrored with the visit as the sun is): it leaves
  // the foot along the sun's bearing turned by as much as its own stream says (up to 35 degrees either way) and
  // runs out level above the slope for the length that stream says (20 to 34 m). Where it then stands, it
  // stands; the road only keeps it clear by the hill's one plain number (o.keep, 22 m: it is shortened by half
  // metres while any of it would come nearer). The six stand along its end, heads back to watch the
  // climber go, and the pod they carried up lies on the bough beside them.
  rng = fork('watchers');
  const NF = o.figures ?? 6, limb = (a, b, r) => pushTube(G, [{ p: a, r }, { p: b, r: r * 0.8 }], 4), stand = [];
  const bx = shared.sunDir.x, bz = shared.sunDir.z, bl = Math.hypot(bx, bz) || 1, wth = rng.range(-0.6, 0.6);
  const ux = (bx * Math.cos(wth) + bz * Math.sin(wth)) / bl, uz = (-bx * Math.sin(wth) + bz * Math.cos(wth)) / bl;
  let wLen = rng.range(20, 34);
  const wy = (q) => pk.h - 3.5 + 2.2 * Math.sin(q * 2.2) + 0.3 * Math.sin(q * 9);
  const wNear = (L) => { let d = Infinity; for (let k = 0; k <= 6; k++) { const q = k / 6, rr = 2 + q * L; d = Math.min(d, o.path.distanceTo(pk.x + ux * rr, wy(q) + 1, pk.z + uz * rr) - 2.4); } return d; };
  while (wLen > 6 && wNear(wLen) < (o.keep ?? 22)) wLen -= 0.5;
  const wpts = [];
  for (let k = 0; k <= 12; k++) { const q = k / 12, rr = 2 + q * wLen; wpts.push({ p: V(ux * rr, wy(q), uz * rr), r: lerp(1.9, 0.85, q) * (1 + 0.12 * Math.sin(q * 13)) }); }
  set(origin, 0, 0, [0, 0, 0, 0], BARK, rng(), 0); pushTube(G, wpts, 9);
  const wAt = (m) => { const q = clamp(1 - m / wLen, 0, 1), k = Math.min(11, Math.floor(q * 12)), f = q * 12 - k, a = wpts[k], b = wpts[k + 1]; return { x: lerp(a.p.x, b.p.x, f), y: lerp(a.p.y + a.r, b.p.y + b.r, f) - 0.06, z: lerp(a.p.z, b.p.z, f) }; };
  for (let i = 0; i < NF; i++) {
    const w = wAt(0.8 + i * 1.6 + rng.range(-0.2, 0.2)), ph = rng(), yaw = rng.range(-0.45, 0.45), s = rng.range(1.15, 1.38), sk = SKIN[i % 3];
    const foot = V(w.x, w.y, w.z);
    stand.push(foot);
    const at = (x, y, z) => V(foot.x + (x * Math.cos(yaw) - z * Math.sin(yaw)) * s, foot.y + y * s, foot.z + (x * Math.sin(yaw) + z * Math.cos(yaw)) * s);
    const pivot = [foot.x, foot.y, foot.z, 3];
    set(origin, 0, 0, pivot, sk, ph, 1);
    limb(at(-0.09, 0.0, 0), at(-0.08, 0.5, 0), 0.06); limb(at(0.09, 0.0, 0), at(0.08, 0.5, 0), 0.06);          // legs
    pushTube(G, [{ p: at(0, 0.46, 0), r: 0.12 }, { p: at(0, 0.7, 0.01), r: 0.13 }, { p: at(0, 0.88, 0.03), r: 0.09 }], 5);   // trunk
    pushBall(G, at(0, 1.0, 0.07), 0.095 * s, 0.11 * s, 0.1 * s, 6, 4);                                           // head, tipped back
    limb(at(-0.15, 0.84, 0.02), at(-0.19, 0.5, 0.05), 0.04);                                                     // one arm hangs
    set(origin, 0, 0, pivot, HAIR, ph, 1); pushBall(G, at(0, 1.04, 0.0), 0.1 * s, 0.09 * s, 0.11 * s, 6, 3);
    const sh = at(0.15, 0.84, 0.02);
    set(origin, 0, 0, [sh.x, sh.y, sh.z, 1], sk, ph, 1); limb(sh, at(0.19, 0.5, 0.05), 0.04);                    // the other points, now and then
  }
  // the pod, on the bough just inside of them
  { const wq = wAt(0.8 + NF * 1.6 + 2.4), c = V(wq.x, wq.y + 0.5, wq.z);
    set(origin, 0, 0, [0, 0, 0, 0], POD, 0.3, 3);
    const base = G.count, ax = V(ux, 0.05, uz).normalize(), u = V(0, 1, 0), w = V(0, 0, 0).crossVectors(ax, u).normalize(); u.crossVectors(w, ax);
    for (let j = 0; j <= 7; j++) { const ph = (j / 7) * Math.PI, sp = Math.pow(Math.sin(ph), 1.3), cp = Math.cos(ph); for (let k = 0; k <= 8; k++) { const th = (k / 8) * TAU, ct = Math.cos(th), st = Math.sin(th);
      G.v(c.x + ax.x * cp * 1.6 + (u.x * ct + w.x * st) * sp * 0.62, c.y + ax.y * cp * 1.6 + (u.y * ct + w.y * st) * sp * 0.62, c.z + ax.z * cp * 1.6 + (u.z * ct + w.z * st) * sp * 0.62, u.x * ct + w.x * st, u.y * ct + w.y * st, u.z * ct + w.z * st); } }
    G.stitch(base, 8, 8, true); }
  const geo = bound(G.geometry(), pk.x, 20, pk.z, 1400);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: withShared(shared.U), vertexShader: ROOT_VERT, fragmentShader: ROOT_FRAG, side: THREE.DoubleSide, fog: false }));
  mesh.name = 'rooted'; mesh.frustumCulled = false;
  const wEnd = V(pk.x + ux * (2 + wLen), wy(1) + 2, pk.z + uz * (2 + wLen));
  return { object: mesh, triangles: G.triangles, boughs, figures: stand, watch: { turn: wth, length: wLen, fromRoute: o.path.distanceTo(wEnd.x, wEnd.y, wEnd.z), least: wNear(wLen) } };
}

// ---------------------------------------------------------------- snap-traps (one draw, instanced)
// One shape: a swollen stalk and two jaw-leaves hinged on its top. position: stalk vertices are in metres; jaw
// vertices are (u 0..1 along the jaw, 0, s -1..1 across).  aT: which jaw (-1, +1; 0 = stalk), tooth tip 0/1.
// aI0: x, lift over the roof, z, yaw.   aI1: size, seconds for one round of gaping, phase, 1 if a covey of
// seed-birds rests round it.   aI2: how far it leans to the light.
const TRAP_VERT = /* glsl */`
attribute vec2 aT; attribute vec4 aI0, aI1; attribute float aI2;
varying vec3 vW, vN, vIn; varying vec4 vUv;
${CM_GLSL}
${CV_GLSL}
void main(){
  float jaw = aT.x, size = aI1.x;
  // how wide it gapes, 0 shut .. 1 wide. A trap without a covey opens slowly and snaps on a round of its own.
  float tt = fract(uTime/aI1.y + aI1.z);
  float own = smoothstep(0.0, 0.7, tt)*(1.0 - smoothstep(0.86, 0.872, tt));
  // (mend W, W4) ONE WITH A COVEY resting round it waits wide open for them to stir, AND THEY STIR ON ITS ROUND: cs is
  // the seconds since its covey last stirred (its round: CV_ROUNDS of its gaping rounds, from its own phase,
  // on the world's clock). CV_SNAP seconds after the stir the jaws are shut in 0.13 s, stay shut CV_SHUT
  // seconds, and open again over 0.7 of the trap's gaping round: the numbers a sprung trap had when the eye
  // sprang it. NOTHING HERE IS BY THE EYE (before this mend aSp, a moment written when the eye first came within
  // 62 m, shut any trap once, and a trap with a covey otherwise waited open for ever).
  float cs = fract(uTime/(CV_ROUNDS*aI1.y) + aI1.z)*CV_ROUNDS*aI1.y;
  float shut = smoothstep(CV_SNAP, CV_SNAP + 0.13, cs) - smoothstep(CV_SNAP + CV_SHUT, CV_SNAP + CV_SHUT + 0.7*aI1.y, cs);
  float gape = mix(own, (0.86 + 0.14*sin(uTime*0.7 + aI1.z*20.0))*(1.0 - shut), step(0.5, aI1.w));
  float g = mix(0.07, 1.22, gape) + 0.02*sin(uTime*2.1 + aI1.z*50.0)*gape;     // it trembles a little while it waits
  vec3 p, n, nin = vec3(0.0, 0.0, -jaw);
  vec2 uv = vec2(0.0);
  if (abs(jaw) < 0.5) {
    // the stalk: slightly bent, each its own way (its top, where the jaws hinge, stays where it is)
    float by = position.y - 2.4, ba = aI1.z*40.0;
    p = (position + vec3(cos(ba), 0.0, sin(ba))*0.8*sin(by*0.42 + aI1.z*9.0)*smoothstep(0.0, -3.5, by))*size; n = normal;
    uv = vec2(atan(position.z, position.x), position.y); nin = vec3(0.0, 0.3 + aI1.z, 0.0);
  }
  else {
    float u = position.x, s = position.z;
    // a jaw is a great leaf: narrow at the hinge, broad in the middle, round at the lip, deeply cupped
    float uc = clamp(u, 0.0, 1.0);
    float w = 0.7 + 3.4*pow(max(sin(3.14159*clamp(0.06 + 0.86*uc, 0.0, 1.0)), 0.0), 0.75);
    float cup = 1.9*(1.0 - s*s)*sin(3.14159*pow(uc, 0.8));
    vec3 q = vec3(s*w, 2.4 + u*12.0, jaw*(0.25 + cup));
    q.z -= jaw*aT.y*2.6;                                   // a long thorn stands in from the rim
    vec3 nq = normalize(vec3(s*0.9, 0.0, jaw));               // outward: the back of the jaw
    // swing about the hinge (the stalk's top, the x axis)
    float a = jaw*g, c = cos(a), sn = sin(a);
    q.y -= 2.4; q = vec3(q.x, q.y*c - q.z*sn, q.y*sn + q.z*c); q.y += 2.4;
    nq = vec3(nq.x, nq.y*c - nq.z*sn, nq.y*sn + nq.z*c);
    nin = vec3(0.0, jaw*sn, -jaw*c);                          // the way its lining faces
    p = q*size; n = nq; uv = vec2(u, s);
  }
  float cy = cos(aI0.w), sy = sin(aI0.w);
  p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy); n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy); nin = vec3(nin.x*cy + nin.z*sy, nin.y, -nin.x*sy + nin.z*cy);
  // the whole plant leans toward the light, each by its own amount (about the line across the sun's bearing)
  vec2 sh = uSunDir.xz/max(length(uSunDir.xz), 1e-3); vec3 ax = vec3(sh.y, 0.0, -sh.x);
  float ct = cos(aI2), st = sin(aI2);
  p = p*ct + cross(ax, p)*st + ax*dot(ax, p)*(1.0 - ct); n = n*ct + cross(ax, n)*st + ax*dot(ax, n)*(1.0 - ct); nin = nin*ct + cross(ax, nin)*st + ax*dot(ax, nin)*(1.0 - ct);
  vec2 xz = aI0.xz + p.xz;
  vW = vec3(xz.x, cmRoof(aI0.xz, uTime) + aI0.y + p.y - cmDrop(xz), xz.y);
  vN = n; vIn = nin; vUv = vec4(uv, jaw, aT.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
const TRAP_FRAG = /* glsl */`
#define CM_FOLLOW 1.0
varying vec3 vW, vN, vIn; varying vec4 vUv;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  float jaw = vUv.z, u = vUv.x, s = vUv.y;
  vec3 col;
  if (abs(jaw) < 0.5) {
    // the stalk: a tapering green-brown stem, fibred along its length, with a few NODES at uneven heights (each a
    // dark crease under a paler swelling, tilted; in the stalk's own units, each trap its own), on a spreading
    // foot of buttress roots that grips the crown it stands on (browner, a shade paler than the leaves round it)
    float ndl = dot(n, uSunDir), ang = u, hy = s, own = length(vIn)*37.0;
    float nd = cmN(vec2(hy*0.8 + 0.25*sin(ang + own), own));
    float node = 1.0 - smoothstep(0.0, 0.05, abs(nd - 0.5)), swell = 1.0 - smoothstep(0.0, 0.16, abs(nd - 0.56));
    float fibre = cmN(vec2(ang*7.0 + own, hy*0.35)), foot = 1.0 - smoothstep(-5.0, -1.5, hy);
    float butt = 0.5 + 0.5*cos(ang*5.0 + 1.3*cmN(vec2(ang*1.5, hy*0.3)));
    vec3 alb = mix(vec3(0.15, 0.2, 0.08), vec3(0.3, 0.33, 0.15), fibre)*(1.0 + 0.25*swell)*(1.0 - 0.55*node);
    alb = mix(alb, mix(vec3(0.2, 0.2, 0.1), vec3(0.4, 0.35, 0.2), fibre)*(0.7 + 0.3*butt), foot);
    col = alb*(cmSunL*clamp(ndl*0.7 + 0.3, 0.0, 1.0)*0.5 + cmAmb(n)*0.75);
  } else {
    float inside = step(0.0, dot(normalize(vIn), v));
    float rib = 1.0 - smoothstep(0.03, 0.10, abs(s));
    // outside: a jaw is green, a leaf's plain back with a midrib (G3 f: no stripes), red-brown along its rim
    vec3 nI = dot(n, v) < 0.0 ? -n : n;
    float ndl = dot(nI, uSunDir);
    vec3 back = mix(vec3(0.13, 0.32, 0.07), vec3(0.3, 0.52, 0.13), cmN(vec2(s*4.0, u*6.0)))*(1.0 - 0.3*rib);
    back = mix(back, vec3(0.4, 0.17, 0.08), smoothstep(0.7, 1.0, abs(s))*0.7);
    vec3 outer = back*(cmSunL*clamp(ndl*0.8 + 0.2, 0.0, 1.0)*0.42 + cmAmb(nI)*0.6);
    // inside: the throat, wet red-brown, darkest at the hinge, mottled paler toward the lip
    // (one material for every trap: no veins or stripes in it, and it takes the sun weakly, as wet dark flesh)
    vec3 lining = mix(vec3(0.13, 0.042, 0.028), vec3(0.25, 0.1, 0.06), smoothstep(0.0, 0.9, u))*(0.8 + 0.4*cmN(vec2(u*7.0, s*3.0)));
    vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
    vec3 inner = lining*(cmSunL*clamp(ndl*0.8 + 0.2, 0.0, 1.0)*0.3 + cmAmb(nI)*0.7) + cmSunL*pow(clamp(dot(nI, h), 0.0, 1.0), 40.0)*0.06;
    col = mix(outer, inner, inside);
    // teeth: thorns the colour of horn (never white: dull, a shade paler at the root than at the point)
    col = mix(col, mix(vec3(0.5, 0.43, 0.27), vec3(0.36, 0.28, 0.16), smoothstep(0.6, 1.0, vUv.w))*(cmSunL*0.2 + cmAmb(n)*0.7), smoothstep(0.1, 0.45, vUv.w));
  }
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
// o: { rng, coveyRng, path, peak, count }
export async function makeTraps(ctx, shared, o) {
  const rng = cmStream(shared, o.rng, 'traps', ctx), cr = cmStream(shared, o.coveyRng, 'coveys', ctx), G = new Geo({ aT: 2 }), N = o.count ?? 80;
  // the stalk
  // (its foot spreads from 2 m to 4.6 m for each unit of the trap's size as it goes down into the crown: the roof
  // cuts it 2 to 5 units down, so every trap is seen to stand on a wide pale foot under its jaws)
  { const prof = [[4.6, -9.0], [3.7, -6.0], [2.7, -3.8], [2.05, -2.0], [1.75, -0.6], [1.65, 0.4], [1.5, 1.4], [1.2, 2.2], [0.8, 2.6]], base = G.count; G.set('aT', 0, 0);
    for (const [r, y] of prof) for (let k = 0; k <= 12; k++) { const th = (k / 12) * TAU; G.v(Math.cos(th) * r, y, Math.sin(th) * r, Math.cos(th), y < -1 ? 0.6 : 0.2, Math.sin(th)); }
    G.stitch(base, prof.length, 12, true); }
  // the two jaws, and their teeth
  for (const jaw of [-1, 1]) {
    const NU = 8, NS = 4, base = G.count; G.set('aT', jaw, 0);
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NS; j++) G.v(i / NU, 0, (j / NS) * 2 - 1);
    G.stitch(base, NU + 1, NS);
    for (const sd of [-1, 1]) for (let t = 0; t < 10; t++) {
      const u0 = 0.12 + 0.086 * t;
      G.set('aT', jaw, 0); const a = G.v(u0 - 0.034, 0, sd), b = G.v(u0 + 0.034, 0, sd);
      G.set('aT', jaw, 1); const c = G.v(u0, 0, sd * 0.93);
      G.tri(a, b, c);
    }
  }
  const g0 = G.geometry(), g = new THREE.InstancedBufferGeometry(); g.instanceCount = N;
  g.setAttribute('position', g0.getAttribute('position')); g.setAttribute('normal', g0.getAttribute('normal')); g.setAttribute('aT', g0.getAttribute('aT')); g.setIndex(g0.getIndex());
  const i0 = new Float32Array(N * 4), i1 = new Float32Array(N * 4), i2 = new Float32Array(N), sites = [], pk = o.peak;
  // WHERE THEY GROW (the roof's rule alone, in the world's own metres). Traps stand in the open roof round the
  // hill, where the seed-birds come down to rest: anywhere from 12 m outside the hill's foot to 520 m from its
  // top, never nearer one another than 44 m. THE DENSITY AND ITS REASON: 80 traps on that 800,000 m2 of roof,
  // one to about 10,000 m2 (mend O: sixteen more, the same streams carried on, so that the roof's hunters are
  // met oftener on the way in): a trap is a great hunter with a wide beat (few of them, and no two alike in size:
  // 0.6 to 1.6 of the mean, jaws 7 to 19 m long), so a straight line across the roof passes within 62 m of a
  // trap's mouth about once in every 80 m (1 / (density x 124 m)), whatever line it is; ours is one such line.
  // Which way a trap's hinge lies is its own affair, and each leans toward the light by its own amount (6 to 26
  // degrees). The one thing the road asks: no trap's mouth is within 8 m and 10 m for each unit of its size of it
  // (14 to 24 m: its jaws reach 6 m for each unit of size from the mouth; nothing of a trap is within 8 m of the
  // eye). A covey of seed-birds rests round one trap in two (the coveys' stream says which). Which traps the
  // road passes near is the visit's deal.
  let n = 0;
  // THE BELT: seed-birds rest where the roof rises to the hill, so the first 12 traps stand in a belt round the
  // hill's skirt, 12 to 70 m outside its foot (stream 'trap-belt'): one to about 4,600 m2 there, thicker than the
  // open roof's, because that is where the birds are; the rest are scattered as said above.
  const NB = Math.min(o.belt ?? 12, N), br = cmStream(shared, o.beltRng, 'trap-belt', ctx);
  for (let tries = 0; n < N && tries < N * 30 + 400; tries++) {
    const belt = n < NB, r = belt ? br : rng, a = r.range(0, TAU), rr = belt ? Math.sqrt(r.range((pk.r + 12) * (pk.r + 12), (pk.r + 70) * (pk.r + 70))) : Math.sqrt(r.range((pk.r + 12) * (pk.r + 12), 520 * 520)), x = pk.x + Math.cos(a) * rr, z = pk.z + Math.sin(a) * rr;
    const yaw = r.range(0, TAU), lean = r.range(0.1, 0.45), size = r.range(0.6, 1.6), round = r.range(11, 19), ph = r(), off = o.path.distanceTo(x, shared.roof(x, z) + 3.2 + 8 * size, z);
    if (tries % 12 === 11) await ctx.yield();                 // (the build hands back between tries: each one measures its way to the road)
    if (off < 8 + 10 * size || sites.some((q) => Math.hypot(q.x - x, q.z - z) < 44)) continue;
    sites.push({ x, z, round, ph, covey: false, off });
    i0.set([x, 3.2, z, yaw], n * 4); i1.set([size, round, ph, 0], n * 4); i2[n] = lean; n++;
  }
  for (let i = 0; i < n; i++) { sites[i].covey = cr.chance(1 / 2); i1[i * 4 + 3] = sites[i].covey ? 1 : 0; }
  g.instanceCount = n;
  g.setAttribute('aI0', new THREE.InstancedBufferAttribute(i0, 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(i1, 4)); g.setAttribute('aI2', new THREE.InstancedBufferAttribute(i2, 1));
  bound(g, pk.x, 0, pk.z, 700);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(shared.U), vertexShader: TRAP_VERT, fragmentShader: TRAP_FRAG, side: THREE.DoubleSide, fog: false }));
  mesh.name = 'traps'; mesh.frustumCulled = false;
  // (mend W, W4: NO MOMENT IS WRITTEN HERE. Before this mend a trap was sprung, and its covey put up, the first time
  // the eye came near, once: the one event that followed the flight. Every trap now keeps its own round on
  // the world's clock: TRAP_VERT and BIRD_VERT, from the trap's own round and phase.)
  for (let i = 0; i < n; i++) sites[i].size = i1[i * 4];
  return { object: mesh, triangles: G.triangles * n, sites };
}

// ---------------------------------------------------------------- kite-plants (one draw, instanced)
// aKp: part (0 the thread stalk, 1 the kite leaf, 2 the tail thread, 3 a seed pod on the tail), then two numbers:
//      stalk and tail: q 0..1 along, side -1/+1;  kite and pods: x, y in the leaf's own plane (m).  aKq: place of a pod down the tail.
// aI0: where the kite flies (x, height over the roof, z) and its phase.  aI1: size, lean downwind, how far it swings, tone.
const KITE_VERT = /* glsl */`
attribute vec3 aKp; attribute float aKq; attribute vec4 aI0, aI1;
uniform vec3 uWind;
varying vec3 vW, vN; varying vec4 vK; varying vec2 vA;
${CM_GLSL}
${CM_RIBBON}
void main(){
  float part = aKp.x, ph = aI0.w, size = aI1.x, h = aI0.y;
  vec3 up = vec3(0.0, 1.0, 0.0), wind = normalize(uWind), right = cross(up, wind);
  float gust = cmGust(aI0.xz, uTime);
  // the kite tugs and swings on its stalk
  vec3 sw = vec3(sin(uTime*0.5 + ph*20.0), 0.3*sin(uTime*0.8 + ph*31.0), cos(uTime*0.37 + ph*11.0))*aI1.z*(0.7 + 0.6*gust);
  float roofA = cmRoof(aI0.xz, uTime);
  vec3 kite = vec3(aI0.x, roofA + h*(1.0 + 0.03*sin(uTime*1.7 + ph*50.0)), aI0.z) + sw;
  vec3 foot = vec3(aI0.x, roofA - 0.5, aI0.z) - wind*aI1.y*h;
  // the leaf's own frame: it lies back on the wind, and rolls as it swings
  float roll = 0.3*sin(uTime*0.5 + ph*20.0 + 1.2) + 0.12*sin(uTime*2.3 + ph*70.0)*gust;
  vec3 nrm = normalize(wind*0.55 + up*0.84 + right*roll), kr = normalize(cross(nrm, wind)), ku = cross(kr, nrm);
  vec3 c, n = nrm; float k = 1.0; vec4 mv; bool ribbon = false; vec3 tng = up; float side = 0.0, wdt = 0.0;
  if (part < 0.5) {                                   // the stalk: a thread that bellies downwind
    float q = aKp.y; ribbon = true; side = aKp.z; wdt = 0.035*size;
    c = mix(foot, kite, q) + wind*(0.3*h*sin(3.14159*q)) - up*(0.12*h*sin(3.14159*q));          // slack: it bellies down the wind
    tng = normalize(kite - foot + (wind*0.3 - up*0.12)*(h*3.14159*cos(3.14159*q)));
  } else if (part < 1.5) {                            // the leaf: a diamond with a keel
    c = kite + (kr*aKp.y + ku*aKp.z)*size + nrm*aKq*size;
  } else {
    // the tail streams from the lower corner, down the wind, and wags
    float q = part < 2.5 ? aKp.y : aKq;
    vec3 from = kite - ku*1.9*size;
    vec3 tp = from + (wind*0.75 - up*0.65)*(5.5*size*q) + kr*0.5*size*sin(uTime*1.9 + ph*40.0 - q*5.0)*q;
    if (part < 2.5) { ribbon = true; side = aKp.z; wdt = 0.03*size; c = tp; tng = normalize(wind*0.75 - up*0.65); }
    else c = tp + (kr*aKp.y + ku*aKp.z)*size;
  }
  c.y -= cmDrop(c.xz);
  if (ribbon) { mv = cmRibbon(c, tng, side, wdt, k); } else mv = viewMatrix*vec4(c, 1.0);
  vW = c; vN = n; vK = vec4(part, aKp.y, aKp.z, aI1.w); vA = vec2(k, side);
  gl_Position = projectionMatrix*mv;
}`;
const KITE_FRAG = /* glsl */`
#define CM_FOLLOW 1.0
varying vec3 vW, vN; varying vec4 vK; varying vec2 vA;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  float part = vK.x, toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 col; float al = 1.0;
  if (part < 0.5 || (part > 1.5 && part < 2.5)) {
    float e = 1.0 - smoothstep(0.5, 1.0, abs(vA.y));
    al = e*clamp(vA.x, 0.0, 1.0);
    al *= 0.75;
    col = vec3(0.55, 0.66, 0.45)*(cmAmb(vec3(0.0, 0.3, 0.0))*0.4 + cmSunL*(0.05 + 0.3*toward*toward*toward));
  } else if (part < 1.5) {
    // a leaf stretched like a sail: a keel, veins raking back from it, the sun through it
    // its outline is a leaf's, not a toy's: lobed, ragged, torn in from the rim, browned at the edge
    float od = abs(vK.y)/1.5 + abs(vK.z + 0.15)/1.75, ang = atan(vK.z + 0.15, vK.y);
    float rim = 0.8 + 0.1*sin(ang*5.0 + vK.w*40.0) + 0.14*cmN(vec2(ang*4.0 + vK.w*90.0, vK.w*17.0));
    float tear = smoothstep(0.74, 0.8, cmN(vec2(vK.y*1.7 + vK.w*31.0, vK.z*0.6 + vK.w*13.0)))*smoothstep(0.35, 0.6, od);
    if (od > rim || tear > 0.5) discard;
    float rib = 1.0 - smoothstep(0.02, 0.07, abs(vK.y)), sv = 1.0 - smoothstep(0.06, 0.2, abs(fract(vK.z*1.6 + abs(vK.y)*1.1) - 0.5));
    float vein = max(rib, 0.5*sv);
    // a pale sail: a bleached leaf as thin as paper, the light in it whichever side the sun is on
    col = cmLeaf(n, v, vK.w, 1.0 - 0.5*vein, 0.95, 0.5);
    col = mix(col, vec3(0.9, 0.87, 0.64)*(cmAmb(n)*0.6 + cmSunL*(0.14 + 0.4*toward*toward)), 0.8)*(1.0 - 0.25*vein);
    col = mix(col, col*vec3(1.0, 0.72, 0.42), smoothstep(rim - 0.22, rim, od)*0.6);
  } else {
    col = vec3(0.34, 0.22, 0.08)*(cmSunL*(0.2 + 0.4*toward*toward) + cmAmb(n)*0.7);
  }
  col = cmHaze(col, vW, 0.6);
  if (al < 0.01) discard;
  gl_FragColor = vec4(col*al, al);
}`;
// o: { rng, path, peak, traps (their sites), mist: [bottom, top of the air the kites fish, metres over the roof], wind: [x, y, z] }
// (a kite is a pale sail of bleached leaf 3 m across on a thread, a tail of seed pods under it; one rides downwind
// of each trap that has a covey: see below)
export function makeKites(ctx, shared, o) {
  const rng = cmStream(shared, o.rng, 'kites', ctx), N = o.count ?? 140, G = new Geo({ aKp: 3, aKq: 1 });
  const strip = (part, seg) => { const b = G.count; for (let i = 0; i <= seg; i++) for (const sd of [-1, 1]) { G.set('aKp', part, i / seg, sd); G.v(0, 0, 0); } for (let i = 0; i < seg; i++) { const a = b + i * 2; G.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  G.set('aKq', 0); strip(0, 12);
  { G.set('aKp', 1, 0, 0); G.set('aKq', 0.07); const c = G.v(0, 0, 0); G.set('aKq', 0);
    const cor = [[0, 1.6], [1.5, 0.15], [0, -1.9], [-1.5, 0.15]].map(([x, y]) => { G.set('aKp', 1, x, y); return G.v(0, 0, 0); });
    for (let i = 0; i < 4; i++) G.tri(c, cor[i], cor[(i + 1) % 4]); }
  strip(2, 6);
  for (let p = 0; p < 4; p++) { G.set('aKq', 0.3 + 0.22 * p); const q = [[0, 0.3], [0.16, 0], [0, -0.3], [-0.16, 0]].map(([x, y]) => { G.set('aKp', 3, x, y); return G.v(0, 0, 0); }); G.quad(q[0], q[1], q[2], q[3]); }
  const g0 = G.geometry(), g = new THREE.InstancedBufferGeometry(); g.instanceCount = N;
  for (const nm of ['position', 'normal', 'aKp', 'aKq']) g.setAttribute(nm, g0.getAttribute(nm)); g.setIndex(g0.getIndex());
  const i0 = new Float32Array(N * 4), i1 = new Float32Array(N * 4), p = V(0, 0, 0);
  const t = V(0, 0, 0), wn = V(...(o.wind ?? [1, 0, 0.3])).normalize();
  // WHERE THEY FLY (a rule of the roof; nothing of it reads the road): a kite fishes where there is something to
  // fish. One rides on its thread downwind of each trap that has a covey, 20 to 40 m from it, in the air the
  // seeds drift in (9.5 to 14.5 m up; never less than 6 m over the roof under it); its lean and the play of its
  // thread are its stream's. The road glides in over them (mend P), so the kites ride under the eye, and near
  // the road where a trap with a covey is. The one thing the road asks: a kite keeps 16 m from it
  // and its thread 13 m (tried at five places from its foot to the kite); one that cannot is not there.
  const mist = o.mist || [9.5, 14.5], coveyTraps = (o.traps || []).filter((q) => q.covey);
  let i = 0;
  for (const q of coveyTraps) {
    if (i >= N) break;
    const dist = rng.range(20, 40), yAbs = rng.range(mist[0], mist[1]), lean = rng.range(0.25, 0.6), ph = rng(), sz = rng.range(0.8, 1.25), sw = rng.range(0.8, 2.6), tn = rng();
    const x = q.x + wn.x * dist, z = q.z + wn.z * dist, y0 = shared.roof(x, z), h = Math.max(yAbs - y0, 6);
    let ok = o.path.distanceTo(x, y0 + h, z) > 16;
    for (let k = 0; k <= 4 && ok; k++) { const f = k / 4; ok = o.path.distanceTo(x - wn.x * lean * h * (1 - f) + wn.x * 0.3 * h * Math.sin(Math.PI * f), y0 + h * f, z - wn.z * lean * h * (1 - f) + wn.z * 0.3 * h * Math.sin(Math.PI * f)) > 13; }
    if (!ok || peakH(o.peak, x, z) > h - 8) continue;
    i0.set([x, h, z, ph], i * 4); i1.set([sz, lean, sw, tn], i * 4); i++;
  }
  g.instanceCount = i;
  g.setAttribute('aI0', new THREE.InstancedBufferAttribute(i0, 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(i1, 4));
  bound(g, 0, 20, -250, 1200);
  const own = { uWind: { value: new THREE.Vector3(...(o.wind ?? [1, 0, 0.3])) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: KITE_VERT, fragmentShader: KITE_FRAG, transparent: true, premultipliedAlpha: true, side: THREE.DoubleSide, fog: false }));
  mesh.name = 'kites'; mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { object: mesh, triangles: G.triangles * N };
}

// ---------------------------------------------------------------- seed-birds (one draw, instanced)
// A fat seed a metre long between two leaf wings; it sails and tilts and never flaps hard.
// position: the bird's own shape (x right, y up, z back).  aWg: wing side (-1, +1; 0 = the seed), distance out along the wing 0..1.
// aB0: its place in the flock (x, y, z) and phase.  aB1: the flock's round: centre x, centre z, radius, radians a second.
// aB2: height, the angle it starts at, 0 or how much larger a HIGH GLIDER is (mend T: it does not sink with the land), how flat the round is.
// A covey (aB2.w = -1, -2) is a handful of birds resting on the crowns round a trap: aB1 is then the trap's x, z,
// the seconds of the covey's round and the trap's phase. (mend W, W4) THEY STIR AND RISE ON THEIR TRAP'S ROUND, on
// the world's clock, whether or not anyone comes (which is what the trap is waiting for). A glider (aB2.w = -3) wheels
// about a trap that keeps its own round (aB1: the trap's x, z, the seconds of its round, its phase) and is in the
// gape when it shuts: the rule of the traps.
const BIRD_VERT = /* glsl */`
attribute vec2 aWg; attribute vec4 aB0, aB1, aB2;
varying vec3 vW, vN; varying vec3 vK; varying float vFol;
${CM_GLSL}
${CV_GLSL}
// where a bird is at world time t
vec3 birdAt(float t){
  float ph = aB0.w;
  if (aB2.w < -2.5) {
    float tt = fract(t/aB1.z + aB1.w), in_ = smoothstep(0.5, 0.86, tt), a = ph*6.2831853 + t*0.45;
    vec3 c = vec3(aB1.x, cmRoof(aB1.xy, uTime) + 11.0, aB1.y);
    return c + vec3(cos(a), 0.0, sin(a))*mix(20.0, 0.0, in_) + vec3(0.0, mix(10.0 + 3.0*sin(a*1.7), 0.0, in_), 0.0);
  }
  if (aB2.w < 0.0) {
    // (mend W, W4) A covey resting round a trap STIRS AND RISES ON ITS TRAP'S ROUND, again and again: since is the
    // seconds since it last stirred (aB1.z: the seconds of its round; aB1.w: its trap's phase; the world's
    // clock). The birds are all in the air 1.3 s after (the jaws go at CV_SNAP) and come down again 14 to 22 s
    // after they rose. One of each covey (aB2.w = -2) veers over the gape and hangs there, and THE JAWS TAKE IT
    // when they shut; WHEN THEY OPEN AGAIN ANOTHER COMES IN FROM THE AIR to the taken one's place on the crowns:
    // from 20 m out and 10 m up (where a lone glider wheels), down over the 0.7 of the trap's gaping round
    // its jaws take to open. (Before this mend the covey was put up once, by the eye's coming within 100 m.)
    float roof = cmRoof(aB1.xy, uTime);
    vec3 mouth = vec3(aB1.x, roof + 11.0, aB1.y);
    float since = fract(t/aB1.z + aB1.w)*aB1.z;
    float f = smoothstep(0.0, 1.3, since)*(1.0 - smoothstep(14.0, 22.0, since));
    vec2 d = aB0.xz/max(length(aB0.xz), 1e-3);
    vec3 rest = vec3(aB1.x + aB0.x, roof + 3.6, aB1.y + aB0.z);
    if (aB2.w < -1.5) {
      // (half way through the jaws' shut time, while there is no bird to see, its place goes over to the newcomer's)
      if (since > CV_SNAP + 0.5*CV_SHUT) return rest + vec3(d.x*20.0, 10.0, d.y*20.0)*(1.0 - smoothstep(CV_SNAP + CV_SHUT, CV_SNAP + CV_SHUT + 0.7*aB1.z/CV_ROUNDS, since));
      return mix(rest, mouth + vec3(d.x, 0.2, d.y)*1.5*sin(t*0.9 + ph*30.0), f);
    }
    return rest + vec3(aB0.x, 0.0, aB0.z)*2.6*f + vec3(0.0, (13.0 + 3.0*aB0.y)*f*(2.0 - f), 0.0)
         + vec3(d.x, 0.15, d.y)*sin(t*0.45 + ph*30.0)*3.0*f;
  }
  // a flock on its round, on the world clock
  float a = aB2.y + aB1.w*t;
  vec3 f = vec3(aB1.x + cos(a)*aB1.z, aB2.x + 3.0*sin(a*2.0 + aB2.y), aB1.y + sin(a)*aB1.z*aB2.w);
  vec3 wander = vec3(sin(t*0.31 + ph*20.0)*6.0, sin(t*0.5 + ph*33.0)*2.2, cos(t*0.27 + ph*12.0)*6.0);
  return f + aB0.xyz + wander;
}
void main(){
  vec3 c = birdAt(uTime), c2 = birdAt(uTime + 0.15);
  vec3 fwd = c2 - c; float fl = length(fwd); fwd = fl > 1e-4 ? fwd/fl : vec3(0.0, 0.0, -1.0);
  if (aB2.w < 0.0 && aB2.w > -2.5) { vec2 d = aB0.xz/max(length(aB0.xz), 1e-3); fwd = normalize(mix(fwd, vec3(d.x, 0.25, d.y), 0.7) + vec3(1e-3, 0.0, 0.0)); }
  vec3 rt = cross(fwd, vec3(0.0, 1.0, 0.0)); rt /= max(length(rt), 1e-3);
  vec3 upv = cross(rt, fwd);
  // it tilts as it sails; the wings flex a little on the air
  float roll = 0.38*sin(uTime*0.7 + aB0.w*40.0), cr = cos(roll), sr = sin(roll);
  float sz = (0.8 + 0.5*aB0.w)*(1.0 + aB2.z);
  // the one that goes into the jaws is gone once they shut (and another comes in from the air when they open again)
  if (aB2.w < -2.5) { float tt = fract(uTime/aB1.z + aB1.w); sz *= smoothstep(0.0, 0.08, tt)*(1.0 - smoothstep(0.86, 0.872, tt)); }
  // (mend W, W4) the one over the gape is gone as the jaws shut (0.13 s), and the newcomer is there 1.2 s after they begin to open
  else if (aB2.w < -1.5) { float cs = fract(uTime/aB1.z + aB1.w)*aB1.z; sz *= 1.0 - smoothstep(CV_SNAP, CV_SNAP + 0.13, cs) + smoothstep(CV_SNAP + CV_SHUT, CV_SNAP + CV_SHUT + 1.2, cs); }
  vec3 p = position*sz, n = normal;
  if (abs(aWg.x) > 0.5) { float fx = (0.16 + 0.07*(aB2.z > 0.5 ? 0.3 : 1.0)*sin(uTime*2.3 + aB0.w*60.0))*aWg.y; p.y += abs(p.x)*fx; }
  p = vec3(p.x*cr - p.y*sr, p.x*sr + p.y*cr, p.z); n = vec3(n.x*cr - n.y*sr, n.x*sr + n.y*cr, n.z);
  vec3 w = c + rt*p.x + upv*p.y - fwd*p.z;
  // (mend U, U1) THE SHARE OF THE LAND'S FALL THIS BIRD TAKES, said ONCE: none for a high glider (it keeps the
  // cable's height), all of it for the rest (they sink with the land). The same number moves it here and
  // tells its light its own height (BIRD_FRAG's CM_FOLLOW): the two cannot part.
  vFol = aB2.z > 0.5 ? 0.0 : 1.0;
  w.y -= cmDrop(w.xz)*vFol;
  vW = w; vN = normalize(rt*n.x + upv*n.y - fwd*n.z); vK = vec3(aWg, aB0.w);
  gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.0);
}`;
const BIRD_FRAG = /* glsl */`
#define CM_FOLLOW vFol
varying vec3 vW, vN; varying vec3 vK; varying float vFol;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW), n = normalize(vN);
  vec3 col;
  if (abs(vK.x) > 0.5) col = cmLeaf(n, v, 0.35 + 0.4*fract(vK.z*7.0), 0.9, 0.95, 0.4);       // leaf wings, lit through
  else {
    float ndl = dot(n, uSunDir);
    col = vec3(0.30, 0.20, 0.09)*(cmSunL*clamp(ndl*0.7 + 0.3, 0.0, 1.0)*0.55 + cmAmb(n)*0.7);
  }
  col = cmHaze(col, vW, 0.6);
  gl_FragColor = vec4(col, 1.0);
}`;
// o: { rng (the flocks), coveyRng, highRng, high (rounds of high gliders), moonDir, moonRadius and sunRadius (degrees), path, peak, flocks, each, traps: every trap [{ x, z, round, ph, covey, off }],
//      roadTable: { road: [x, y, z ...], bends: [the land's bend, four numbers ...] }: the road's places every 2 m and
//        the land's bend as the flight has it at each (mend W: for the coveys' keep; the world file works it) }
export function makeBirds(ctx, shared, o) {
  const rng = cmStream(shared, o.rng, 'flocks', ctx), cr = cmStream(shared, o.coveyRng, 'covey-birds', ctx), NFl = o.flocks ?? 6, EACH = o.each ?? 60, NC = 9, pk = o.peak, G = new Geo({ aWg: 2 });
  // a covey rests round each trap that has one; one in three of the others has a glider about it
  const coveys = (o.traps ?? []).filter((q) => q.covey), gr = cmStream(shared, o.gliderRng, 'gliders', ctx), lone = (o.traps ?? []).filter((q) => { const has = gr.chance(1 / 3); return has && !q.covey; });
  // (mend T, T4) THE PLANT BIRDS HIGHER THAN THE ROOF: A LOOSE SCATTER OF GLIDERS BESIDE THE LOWER CABLE (stream
  // 'high-gliders'). Three rounds of fourteen (o.high), each a level round 25 to 45 m in radius whose middle
  // lies 110 to 330 m to one side of the cable's line or the other (dealt), one round to each third of the
  // cable's stretch from its 90th to its 520th metre, 30 to 130 m UNDER the cable there and never less than
  // 60 m over the roof or the hill under any part of it: over the roof's own flocks, well within the air.
  // A glider is two and a half times a seed-bird (a spindle 2 to 3 m long between two leaf wings 5 to 8 m
  // across): no beak, no eye, no tail; it sails and tilts and its wings barely flex. They are scattered
  // over a disc 22 m in radius and half a radian along the round, each wandering 6 m more: never a V, never
  // a ribbon. TWO CLEARANCES, both of the whole road. (1) No point of a round is nearer than 70 m to the
  // road or to the cable's line (48 points of the round tried against both). (Mend U: by that rule alone a
  // glider could come within 34 m of the eye, 33 to 37 with its room over and under the round; by the
  // code reader's count on seeds 1 to 200 the nearest comes 43.4 m. THE TWO HALVES OF THE 70 M TEST ARE NOT
  // ALIKE (made true in mend V; the code reader's counts on those 200 visits, not counted again by the
  // builder): the half against the CABLE'S LINE refuses no try on the dealt ranges: that half is a guard,
  // left in. The half against the ROAD does act: it refuses about one try in four (1,138 of 4,841 tries).)
  // (2) NO GLIDER STANDS ON THE MOON'S DISC OR THE SUN'S: a round is not laid where, from
  // ANY place on the road (every 6 m of it, the whole of it alike), a glider of it could stand within 1.15
  // radii of the Moon's middle or of the sun's (onDisc: all the room a round's gliders have, 36 m about
  // the round and 15 m over and under it, against the two discs' cones). The road runs under the sun and
  // the Moon for most of its length, so that rule leaves the rounds little room: nearly all that are laid
  // lie on the road's own side of the cable, farther out than the road and under it (mend U, the reader's
  // count on seeds 1 to 200: 563 of 589 rounds; 26 lie on the other side of the cable; on 11 visits the
  // third round is not laid) (a first trial of rounds 45 to 80 m wide at the cable's
  // own height, 110 to 230 m from it, could not be laid under the rule on any of three visits). A round
  // that cannot be laid in 40 tries is not made and draws nothing.
  const roadE = [], hDiscs = [[o.moonDir, o.moonRadius], [shared.sunDir, o.sunRadius]].filter((d) => d[0] && d[1]).map(([d, r]) => { const m = d.clone().normalize(); return { x: m.x, y: m.y, z: m.z, rho: 1.15 * r * Math.PI / 180, tr: Math.tan(1.15 * r * Math.PI / 180) }; });
  if (o.path) { const e = new THREE.Vector3(); for (let d = 0; d <= o.path.length; d += 6) { o.path.posAtDist(d, e); roadE.push(e.x, e.y, e.z); } }
  // (plain numbers: along a disc's middle ray from a place of the road, is the gliders' room nearer than the
  // disc is wide there?)
  const onDisc = (cx, cz, h, R) => { const Rg = R + 36, Rb = Rg + 20;
    for (const D of hDiscs) for (let i = 0; i < roadE.length; i += 3) {
      const ex = roadE[i], ey = roadE[i + 1], ez = roadE[i + 2], dx = cx - ex, dy = h - ey, dz = cz - ez, dist = Math.hypot(dx, dy, dz);
      if (dist > Rb && Math.acos(clamp((dx * D.x + dy * D.y + dz * D.z) / dist, -1, 1)) > D.rho + Math.asin(Rb / dist)) continue;
      for (let t = Math.max(0, dist - Rb); t <= dist + Rb; t += 10) {
        const gh = Math.max(0, Math.hypot(ex + t * D.x - cx, ez + t * D.z - cz) - Rg), gv = Math.max(0, Math.abs(ey + t * D.y - h) - 15);
        if (Math.hypot(gh, gv) < t * D.tr + 5) return true; } }
    return false; };
  const hg = cmStream(shared, o.highRng, 'high-gliders', ctx), HIGH = o.high ?? 0, HEACH = 14, CB = shared.cable, highRounds = [];
  for (let f = 0; f < HIGH; f++) for (let tries = 0; tries < 40; tries++) {
    const s = hg.range(90 + 430 * f / HIGH, 90 + 430 * (f + 1) / HIGH), side = hg.sign() * hg.range(110, 330), R = hg.range(25, 45), flat = hg.range(0.6, 0.95), up = hg.range(-130, -30), c = CB.at(s, side, 0), h = c.y + up;
    let ok = true; const q = new THREE.Vector3();
    for (let k = 0; k < 48 && ok; k++) { const a = (k / 48) * TAU; q.set(c.x + Math.cos(a) * R, h, c.z + Math.sin(a) * R * flat);
      const t = clamp(q.clone().sub(CB.P).dot(CB.d), 0, CB.L), toLine = q.distanceTo(CB.at(t, 0, 0));
      ok = toLine >= 70 && (!o.path || o.path.distanceTo(q.x, q.y, q.z) >= 70) && h - 60 > ROOF_Y + peakH(pk, c.x + Math.cos(a) * (R + 36), c.z + Math.sin(a) * (R + 36)); }
    if (!ok || onDisc(c.x, c.z, h, R)) continue;
    highRounds.push({ x: c.x, z: c.z, R, h, flat, w: hg.sign() * hg.range(7, 11) / R, a0: hg.range(0, TAU), upCable: s, side }); break;
  }
  // (mend W, W4) THE COVEYS' BIRDS ARE DEALT CLEAR OF THE ROAD AT EVERY POINT OF THEIR ROUND. A covey now rises on its
  // trap's round whether or not anyone comes, so its birds may be anywhere on their lines when the eye passes:
  // a bird's line is from its place on the crowns (9 to 24 m from its trap, 3.6 m over the roof there) out to
  // 3.6 times as far and 10 to 16 m up, wandering 3 m; the one the jaws take goes from its place to over the
  // mouth, and the newcomer comes down to that place from 20 m farther out and 10 m up. THE RULE (COVEY.keep):
  // NO BIRD OF A COVEY COMES NEARER THE EYE THAN COVEY.keep METRES AT ANY POINT OF ITS ROUND, at any place of the
  // road, the land fallen as the flight has it at that place (o.roadTable) and the roof under the trap at the
  // top and the bottom of its swell. A dealt bird whose line, tried at 9 states of its rise and 3 of its
  // wander against every 4 m of the road, comes within COVEY.keep + COVEY.dealOver is not there (the same
  // four draws are taken for it, so every other bird is as its stream dealt it before this mend). The first
  // bird of a covey that can keep the rule on the way over the mouth is the one the jaws take. The world's
  // test walks every bird that IS there, from the mesh, at finer points, and throws under COVEY.keep.
  const cvBirds = [], cvFacts = { coveys: coveys.length, nearRoad: 0, dealt: 0, refused: 0, noneToTake: 0, dealLeast: Infinity };
  { const road = [], bends = [], e = new THREE.Vector3(), B = shared.U.uBend.value, bend0 = B.clone(), near = [], pts = [];
    if (o.roadTable) { const R = o.roadTable; for (let i = 0; i * 3 < R.road.length; i += 2) { road.push(R.road[i * 3], R.road[i * 3 + 1], R.road[i * 3 + 2]); bends.push(R.bends[i * 4], R.bends[i * 4 + 1], R.bends[i * 4 + 2], R.bends[i * 4 + 3]); } }
    // the least distance from the points of a line (x, height over the roof at the trap, z; from the trap) to the eye on the road
    // (a place of the road is passed over only when it lies farther on the map from the straight line the bird
    // keeps to (out from its trap along (ax, az); its span is taken from the points themselves) than the least
    // already found for this line, or than both the deal's bound and the least dealt so far: every answer
    // the deal takes from it, and the least dealt, are the same)
    let ax = 1, az = 0;
    const gap = (cv, lo, hi) => { let best = Infinity, s0 = Infinity, s1 = -Infinity, wide = 0, first = near[0], firstAt = Infinity;
      for (let k = 0; k < pts.length; k += 3) { const s = pts[k] * ax + pts[k + 2] * az; s0 = Math.min(s0, s); s1 = Math.max(s1, s); wide = Math.max(wide, Math.abs(pts[k] * az - pts[k + 2] * ax)); }
      const lower = (i) => { const qx = road[i * 3] - cv.x, qz = road[i * 3 + 2] - cv.z, s = clamp(qx * ax + qz * az, s0, s1); return Math.hypot(qx - s * ax, qz - s * az) - wide; };
      for (const i of near) { const l = lower(i); if (l < firstAt) { firstAt = l; first = i; } }
      const far = Math.max(COVEY.keep + COVEY.dealOver, cvFacts.dealLeast);
      for (let n = -1; n < near.length; n++) { const i = n < 0 ? first : near[n]; if (n >= 0 && (i === first || lower(i) >= Math.min(Math.sqrt(best), far))) continue;
        B.set(bends[i * 4], bends[i * 4 + 1], bends[i * 4 + 2], bends[i * 4 + 3]); const rx = road[i * 3], ry = road[i * 3 + 1], rz = road[i * 3 + 2];
        for (let k = 0; k < pts.length; k += 3) { const x = cv.x + pts[k], z = cv.z + pts[k + 2], sink = shared.drop(x, z), dx = x - rx, dz = z - rz, h2 = dx * dx + dz * dz;
          for (const roof of [lo, hi]) { const dy = roof + pts[k + 1] - sink - ry, d2 = h2 + dy * dy; if (d2 < best) best = d2; } } }
      return Math.sqrt(best); };
    const line = (b, taken) => { const dl = Math.hypot(b.x, b.z) || 1, dx = b.x / dl, dz = b.z / dl; pts.length = 0; ax = dx; az = dz;
      for (let i = 0; i <= 8; i++) for (let w = -1; w <= 1; w++) { const f = i / 8;
        if (taken) pts.push(b.x + (dx * 1.5 * w - b.x) * f, 3.6 + (11 + 0.3 * w - 3.6) * f, b.z + (dz * 1.5 * w - b.z) * f);
        else pts.push(b.x * (1 + 2.6 * f) + dx * 3 * w * f, 3.6 + (13 + 3 * b.y) * f * (2 - f) + 0.45 * w * f, b.z * (1 + 2.6 * f) + dz * 3 * w * f); }
      if (taken) for (let i = 0; i <= 8; i++) pts.push(b.x + dx * 20 * (i / 8), 3.6 + 10 * (i / 8), b.z + dz * 20 * (i / 8)); };
    coveys.forEach((cv) => { let take = true, lo = 0, hi = 0; near.length = 0;
      // (only a covey whose trap stands within 150 m of the road is tried: a bird is never more than 90 m from its trap)
      if (cv.off < 150) { for (let i = 0; i * 3 < road.length; i++) if (Math.hypot(road[i * 3] - cv.x, road[i * 3 + 2] - cv.z) < 125) near.push(i);
        lo = Infinity; hi = -Infinity; for (let k = 0; k < 12; k++) { const y = shared.roof(cv.x, cv.z, k * 1.9); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
      if (near.length) cvFacts.nearRoad++;
      for (let i = 0; i < NC; i++) { const a = cr.range(0, TAU), r = cr.range(9, 24), b = { cv, x: Math.cos(a) * r, y: cr.range(-1, 1), z: Math.sin(a) * r, ph: cr(), taken: false }; cvFacts.dealt++;
        if (near.length) { let g = Infinity;
          if (take) { line(b, true); g = gap(cv, lo, hi); b.taken = g >= COVEY.keep + COVEY.dealOver; }
          if (!b.taken) { line(b, false); g = gap(cv, lo, hi); if (g < COVEY.keep + COVEY.dealOver) { cvFacts.refused++; continue; } }
          cvFacts.dealLeast = Math.min(cvFacts.dealLeast, g); }
        else b.taken = take;
        if (b.taken) take = false; cvBirds.push(b); }
      if (take) cvFacts.noneToTake++; });
    B.copy(bend0); cvFacts.dealLeast = Math.round(cvFacts.dealLeast * 100) / 100; }
  const N = NFl * EACH + cvBirds.length + lone.length + highRounds.length * HEACH;
  // the seed: a spindle; the wings: two pointed blades
  // (round Q: the seed is a spindle of four rings, four round: 30 triangles a bird with its wings, where it was
  // 54. A seed is a metre long and is never seen nearer than the road's clearances; the triangles go to the
  // second of the climber's kind)
  { const prof = [[0, -0.5], [0.17, -0.17], [0.17, 0.2], [0, 0.5]], base = G.count; G.set('aWg', 0, 0);
    for (const [r, z] of prof) for (let k = 0; k <= 4; k++) { const th = (k / 4) * TAU; G.v(Math.cos(th) * r, Math.sin(th) * r * 0.85, z, Math.cos(th), Math.sin(th), 0); }
    G.stitch(base, prof.length, 4, true); }
  for (const sd of [-1, 1]) {
    const pts = [[0.1, -0.22, 0], [0.75, -0.3, 0.6], [1.3, 0.05, 1], [0.7, 0.28, 0.6], [0.1, 0.2, 0]].map(([x, z, d]) => { G.set('aWg', sd, d); return G.v(sd * x, 0.05, z, 0, 1, 0); });
    G.tri(pts[0], pts[1], pts[4]); G.tri(pts[1], pts[3], pts[4]); G.tri(pts[1], pts[2], pts[3]);
  }
  const g0 = G.geometry(), g = new THREE.InstancedBufferGeometry(); g.instanceCount = N;
  for (const nm of ['position', 'normal', 'aWg']) g.setAttribute(nm, g0.getAttribute(nm)); g.setIndex(g0.getIndex());
  const b0 = new Float32Array(N * 4), b1 = new Float32Array(N * 4), b2 = new Float32Array(N * 4), rounds = [];
  // WHERE THE FLOCKS GO ROUND (the roof's rule, in the world's own metres). Each flock sails a wide round of its
  // own over the open roof. The middle of the round lies where the flock's stream says, at any bearing from the
  // hill and far enough out that the round stays 30 m clear of the hill's foot, up to 900 m from its top. The
  // flock keeps 18 to 26 m over the roof (mend P: UNDER THE GLIDE, which is never lower than 38 m before the
  // hill's foot, so a flock wheels below the eye and never through it), goes round at 11 to 16 m/s one
  // way or the other, and starts on its round where its stream says.
  for (let f = 0; f < NFl; f++) {
    const R = rng.range(150, 260), flat = rng.range(0.6, 0.95), bearing = rng.range(0, TAU), dist = rng.range(R + pk.r + 30, 900), cx = pk.x + Math.cos(bearing) * dist, cz = pk.z + Math.sin(bearing) * dist;
    const w = rng.sign() * rng.range(11, 16) / R, h = ROOF_Y + rng.range(18, 26), a0 = rng.range(0, TAU);
    rounds.push({ x: cx, z: cz, R, h });
    for (let i = 0; i < EACH; i++) {
      const k = (f * EACH + i) * 4;
      b0.set([rng.gauss() * 20, rng.gauss() * 2.5, rng.gauss() * 20, rng()], k); b1.set([cx, cz, R, w], k); b2.set([h, a0, 0, flat], k);
    }
  }
  // (a covey's bird: its trap's place, the seconds of the covey's round and the trap's own phase: see COVEY)
  cvBirds.forEach((b, j) => { const k = (NFl * EACH + j) * 4; b0.set([b.x, b.y, b.z, b.ph], k); b1.set([b.cv.x, b.cv.z, COVEY.rounds * b.cv.round, b.cv.ph], k); b2.set([0, 0, 0, b.taken ? -2 : -1], k); });
  lone.forEach((q, j) => { const k = (NFl * EACH + cvBirds.length + j) * 4; b0.set([0, 0, 0, gr()], k); b1.set([q.x, q.z, q.round, q.ph], k); b2.set([0, 0, 0, -3], k); });
  highRounds.forEach((hr, j) => { for (let i = 0; i < HEACH; i++) {
    const k = (NFl * EACH + cvBirds.length + lone.length + j * HEACH + i) * 4, a = hg.range(0, TAU), r = 22 * Math.sqrt(hg());
    b0.set([Math.cos(a) * r, hg.range(-8, 8), Math.sin(a) * r, hg()], k); b1.set([hr.x, hr.z, hr.R, hr.w], k); b2.set([hr.h, hr.a0 + hg.range(-0.5, 0.5), 1.5, hr.flat], k);
  } });
  g.setAttribute('aB0', new THREE.InstancedBufferAttribute(b0, 4)); g.setAttribute('aB1', new THREE.InstancedBufferAttribute(b1, 4)); g.setAttribute('aB2', new THREE.InstancedBufferAttribute(b2, 4));
  bound(g, 0, 30, -250, 1400);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(shared.U), vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide, fog: false }));
  mesh.name = 'seed-birds'; mesh.frustumCulled = false;
  // (mend W, W4: nothing is written after the build: a covey's round is its trap's, on the world's clock)
  return { object: mesh, triangles: G.triangles * N, rounds, highRounds, coveys: cvFacts, first: { covey: NFl * EACH, coveyBirds: cvBirds.length } };
}
