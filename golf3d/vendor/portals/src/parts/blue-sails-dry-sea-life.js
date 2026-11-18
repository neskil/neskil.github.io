// BLUE SAILS ON A DRY SEA: what lives in the town. The wine-dark water of canal and basin (with the rill in the
// house floor and the thread that falls down the stairs), lamps and their moths, flower boats, fountains, the
// crystal house (pillars, screens, turning vanes, golden fruit, chimes, falling mist), the crystal arch round
// the portal, creeper, trees in tubs and the townsfolk.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { BS_NOISE, BS_COMMON, lin, makeAcc, vtx, quad, loft, tube, box, ball, finish, litMaterial, makeFigures, instanced } from './blue-sails-dry-sea.js';
import { WATER_Y, QUAY_Y, FLOOR_Y, BASIN, BRIDGES, LAMP_ROW, AVENUE_LAMPS, RING_LAMPS, TIER_LAMPS, STAIR_LAMPS, WALL_LAMPS, STAIRS, stairZ, lathe, profileRadius } from './blue-sails-dry-sea-town.js';

export { LAMP_ROW };
export const JETS = { x: 11.5, z0: -715, dz: 12, n: 6 };          // two rows of six tall jets, 11.5 m either side of our line over the basin

// ---------------------------------------------------------------- water
// One sheet over the canal and the basin, cut to their outline in the shader. It is translucent: what shows
// through it is the built mirror (the upside-down towers, bridges, lamps) and, where nothing stands, the sky's
// horizon colour. Its own colour is wine-dark; on top lie the moons' glitter and the long reflections of the lamps.
const WATER_FS = (rill) => /* glsl */`
${BS_COMMON}
${BS_NOISE}
uniform vec3 uWine, uMoonA, uMoonB, uMoonColA, uMoonColB;
uniform vec4 uLampRow, uJets; uniform float uLampN, uJetN, uJetPh[12];
varying vec3 vW;
float rip(vec2 p, float t){ return bsN(p*0.5 + vec2(t*0.10, -t*0.07)) + 0.5*bsN(p*1.6 + vec2(-t*0.19, t*0.15)) + 0.26*bsN(p*4.3 + vec2(t*0.33, t*0.28)) + 0.1*bsN(p*9.7 + vec2(-t*0.5, t*0.41)); }
void main(){
  vec2 p = vW.xz; float t = uTime;
  ${rill ? 'p.y += t*1.1; p *= 2.2;' : /* glsl */`
  float inCanal = step(abs(p.x), 7.0)*step(-746.0, p.y);
  float rb = length(p - vec2(${BASIN.x.toFixed(1)}, ${BASIN.z.toFixed(1)}));
  if (inCanal < 0.5 && rb > ${BASIN.r.toFixed(1)}) discard;`}
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  float fp = max(length(dFdx(vW.xz)), length(dFdy(vW.xz)));
  float e = 0.14, h0 = rip(p, t), hx = rip(p + vec2(e, 0.0), t), hz = rip(p + vec2(0.0, e), t);
  float amp = ${rill ? '0.16' : '0.075'}*(1.0 - smoothstep(0.5, 4.0, fp));
  vec2 sl = vec2(hx - h0, hz - h0)/e*amp;
  ${rill ? '' : /* glsl */`
  // rings run out from the foot of every fountain jet
  for (int s = 0; s < 2; s++) for (int j = 0; j < 6; j++) {
    vec2 c = vec2(s == 0 ? -uJets.x : uJets.x, uJets.y - uJets.w*float(j));
    vec2 q = vW.xz - c; float r = length(q) + 1e-3;
    float w = sin(r*2.4 - t*3.2 + uJetPh[s*6 + j])*exp(-r*0.16)*smoothstep(0.3, 1.5, r);
    sl += q/r*w*0.05*(1.0 - smoothstep(1.0, 4.0, fp));
  }`}
  vec3 N = normalize(vec3(-sl.x, 1.0, -sl.y));
  vec3 R = reflect(-V, N);
  float nv = clamp(dot(N, V), 0.0, 1.0), om = 1.0 - nv, F = 0.03 + 0.97*om*om*om*om*om;
  float Fr = clamp(F*1.25, ${rill ? '0.22, 0.6' : '0.05, 0.66'})*(0.82 + 0.3*(h0 - 0.85));
  // the canals run with wine: its own deep colour under a plain pale light (the blue of the dusk would turn it navy)
  vec3 wl = vec3(0.30) + uKeyCol*0.14 + uMoonCol*0.22;
  vec3 body = uWine*wl*(0.62 + 0.3*h0);
  vec3 col = body*(1.0 - Fr) + uWine*wl*0.5*Fr;
  // the moons lie on the water as broken paths of light
  float ma = clamp(dot(R, uMoonA), 0.0, 1.0), mb = clamp(dot(R, uMoonB), 0.0, 1.0);
  float xa = 1.0 - ma, xb = 1.0 - mb;                                 // exp of the small angle keeps its precision where pow of a number near one does not
  col += uMoonColA*(exp(-2600.0*xa)*1.5 + exp(-220.0*xa)*0.035) + uMoonColB*(exp(-3200.0*xb)*1.2 + exp(-260.0*xb)*0.025);
  ${rill ? /* glsl */`
  // the rill is clear running water over pale stone: it carries the dusk, the moons and the gold of the fruit as moving light
  col = vec3(0.50, 0.55, 0.80)*bsLight(vec3(0.0, 1.0, 0.0))*(0.42 + 0.4*h0)*(1.0 - Fr);
  col += mix(uFog.rgb*1.3 + uKeyCol*0.3, uSkyCol*1.2, clamp(R.y*1.4, 0.0, 1.0))*Fr;
  float run1 = smoothstep(0.62, 0.92, bsN(p*vec2(3.0, 0.45))), run2 = smoothstep(0.7, 0.96, bsN(p*vec2(5.0, 0.8) + 7.0));
  col += ((uMoonCol + uKeyCol*0.7)*0.9*run1 + uGold*1.1*run2)*(1.0 - smoothstep(0.6, 3.0, fp));` : /* glsl */`
  // the lamps: each lays a long wavering path toward the eye
  float kf = floor((uLampRow.z - vW.z)/uLampRow.w), wsum = 0.0;
  vec3 Nw = normalize(vec3(-sl.x*1.5, 1.0, -sl.y*1.5));
  for (int s = 0; s < 2; s++) for (int j = 0; j < 6; j++) {
    float k = kf + float(j), ok = step(-0.5, k)*step(k, uLampN - 0.5);
    vec3 L = vec3(s == 0 ? -uLampRow.x : uLampRow.x, uLampRow.y, uLampRow.z - uLampRow.w*k) - vW;
    float dl = max(length(L), 1e-3); L /= dl;
    float nh = clamp(dot(Nw, normalize(L + V)), 0.0, 1.0);
    nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh;      // a highlight as tight as a lamp is small
    wsum += ok*nh/(1.0 + dl*0.03);
  }
  col += uGold*1.2*min(wsum, 1.4);
  // darker along the walls, a pale line where the water meets the stone
  float edge = max(inCanal*(7.0 - abs(vW.x)), ${BASIN.r.toFixed(1)} - rb);
  col *= 0.7 + 0.3*smoothstep(0.0, 1.6, edge);
  col += (uSkyCol*0.6 + uKeyCol*0.2)*0.25*(1.0 - smoothstep(0.0, 0.12 + 0.1*h0, edge));
  // one water: the canal's sheet lets the built mirror under it show; over its last 30 m before the basin (metres
  // along the canal, none across) that share falls to a quarter, and the whole basin has that quarter. What the
  // sheet no longer lets through it gives back on its ripples: the low sky, in the wine's own colour
  float thru = 0.25 + 0.75*smoothstep(${(BASIN.z + BASIN.r).toFixed(1)}, ${(BASIN.z + BASIN.r + 30).toFixed(1)}, vW.z);
  float glint = 1.0 - smoothstep(0.0, 0.4, abs(R.y - 0.08));
  col += uWine/max(max(uWine.r, max(uWine.g, uWine.b)), 0.02)*dot(uFog.rgb, vec3(0.3333))*(1.0 - thru)*Fr*(0.12 + 0.6*glint);
  // and a few pale glints ride its ripples from bank to bank, as the moons' do down the middle
  float spark = smoothstep(0.83, 0.96, bsN(p*3.7 + vec2(t*0.45, -t*0.38)))*smoothstep(0.5, 0.9, bsN(p*8.9 + vec2(-t*0.6, t*0.5)))*(1.0 - smoothstep(0.6, 3.0, fp));
  col += (uMoonCol*0.5 + uSkyCol*0.25)*0.6*spark*(1.0 - thru);`}
  float fg = bsFogF(d);
  col = mix(col, uFog.rgb, fg);
  gl_FragColor = vec4(col, 1.0 - 0.6*Fr*(1.0 - fg)${rill ? '*0.0' : '*thru'});
}`;
export function makeWater(SH, o = {}) {
  const uniforms = {
    ...SH, uWine: { value: new THREE.Color(o.color ?? '#6A45A0') },
    uMoonA: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, uMoonB: { value: new THREE.Vector3(0, 0.4, -1).normalize() },
    uMoonColA: { value: new THREE.Color('#FFF1D8') }, uMoonColB: { value: new THREE.Color('#CFE0FF') },
    uLampRow: { value: new THREE.Vector4(LAMP_ROW.x, LAMP_ROW.y, LAMP_ROW.z0, LAMP_ROW.dz) }, uLampN: { value: LAMP_ROW.n },
    uJets: { value: new THREE.Vector4(JETS.x, JETS.z0, 0, JETS.dz) }, uJetN: { value: JETS.n },
    uJetPh: { value: Array.from({ length: 12 }, () => (o.phases ? o.phases() * 6.283 : 0)) },       // where the rings round each jet start
  };
  const VS = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
  const group = new THREE.Group();
  const sheet = (x0, x1, z0, z1, y0, y1, rill) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, z0, x1, y0, z0, x1, y1, z1, x0, y1, z1], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: WATER_FS(rill), transparent: !rill, premultipliedAlpha: true, depthWrite: rill }));
    m.frustumCulled = false; if (!rill) m.renderOrder = 2; group.add(m); return m;
  };
  sheet(-BASIN.r - 1, BASIN.r + 1, -515, BASIN.z - BASIN.r - 1, WATER_Y, WATER_Y, false);
  sheet(-1, 1, -430.2, -516.7, 8.6, 8.72, true);                    // (wound to face up: z runs the other way from the canal's sheet; it runs out over the spout of the quay head)
  // the thread of water that falls from the rill's lip down the channel of the stairs
  const pts = [[8.2, -430.3]];
  for (let i = STAIRS.n - 1; i >= 0; i--) { const y = Math.max(0.3 * i - 0.6, 0.0) + 0.05, z = stairZ(i); pts.push([y, stairZ(i + 1) + 0.1], [y, z - 0.04]); if (i > 0) pts.push([Math.max(0.3 * (i - 1) - 0.6, 0.0) + 0.08, z + 0.1]); }
  pts.push([0.04, -397.5]);
  const tp = [], tu = [], ti = []; let len = 0;
  pts.forEach((q, i) => { if (i) len += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]); tp.push(-0.5, q[0], q[1], 0.5, q[0], q[1]); tu.push(0, len, 1, len); if (i) { const a = (i - 1) * 2; ti.push(a, a + 1, a + 3, a, a + 3, a + 2); } });
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(tu, 2)); tg.setIndex(ti);
  const thread = new THREE.Mesh(tg, new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
varying vec2 vUv; varying vec3 vW;
void main(){
  float x = vUv.x - 0.5, t = uTime;
  float w = 0.26 + 0.12*bsN(vec2(vUv.y*0.7 - t*0.8, 3.0)) + 0.05*sin(vUv.y*5.0 - t*6.0);
  float a = 1.0 - smoothstep(w*0.5, w, abs(x + 0.08*sin(vUv.y*1.3 - t*1.4)));
  float streak = 0.5 + 0.5*bsN(vec2(x*14.0, vUv.y*2.2 - t*5.5));
  float glint = smoothstep(0.72, 0.95, bsN(vec2(x*9.0 + 3.0, vUv.y*3.1 - t*7.0)));
  vec3 c = (uSkyCol*0.9 + uMoonCol*0.9 + uKeyCol*0.5)*(0.25 + 0.5*streak) + (uMoonCol + uKeyCol)*1.6*glint;
  a *= 0.55 + 0.45*streak;
  float d = length(cameraPosition - vW);
  gl_FragColor = vec4(bsFog(c, d)*a, a*0.85);
}`,
  }));
  thread.frustumCulled = false; thread.renderOrder = 3; group.add(thread);
  // the same falling water where the rill leaves the spout of the quay head (z -516.7): 2 m wide, over the lip, down
  // the 0.3 m to the canal and 0.9 m out on it
  const fq = [[8.74, -516.3], [8.72, -516.72], [8.58, -516.86], [WATER_Y + 0.03, -516.95], [WATER_Y + 0.03, -517.85]], fp = [], fu = [], fi = []; let fl = 0;
  fq.forEach((q, i) => { if (i) fl += Math.hypot(q[0] - fq[i - 1][0], q[1] - fq[i - 1][1]); fp.push(-1, q[0], q[1], 1, q[0], q[1]); fu.push(0, fl, 1, fl); if (i) { const a = (i - 1) * 2; fi.push(a, a + 1, a + 3, a, a + 3, a + 2); } });
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2)); fg.setIndex(fi);
  const fall = new THREE.Mesh(fg, thread.material); fall.frustumCulled = false; fall.renderOrder = 3; group.add(fall);
  return { object: group, uniforms };
}

// ---------------------------------------------------------------- lamps, their glows, the mirror of the glows, moths
const BRONZE = lin('#8C6B3E'), GOLD = lin('#FFC46A');
const k7 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export function lampPlaces() {
  const P = [];
  for (const s of [-1, 1]) for (let k = 0; k < LAMP_ROW.n; k++) P.push({ x: s * LAMP_ROW.x, y: QUAY_Y, z: LAMP_ROW.z0 - LAMP_ROW.dz * k, mirror: true });
  for (let i = 0; i < 14; i++) {                                     // round the basin, leaving the canal mouth and the aisle open
    const a = (i + 0.5) / RING_LAMPS.n * Math.PI * 2, x = Math.sin(a) * RING_LAMPS.r, z = BASIN.z - Math.cos(a) * RING_LAMPS.r;
    if (Math.abs(x) < RING_LAMPS.gap) continue;
    P.push({ x, y: QUAY_Y, z, mirror: true });
  }
  for (const s of [-1, 1]) { for (let k = 0; k < AVENUE_LAMPS.n; k++) P.push({ x: s * AVENUE_LAMPS.x, y: QUAY_Y, z: AVENUE_LAMPS.z0 - AVENUE_LAMPS.dz * k }); P.push({ x: s * 16, y: FLOOR_Y, z: -438 }, { x: s * 11.2, y: QUAY_Y, z: BASIN.z - Math.sqrt(RING_LAMPS.r * RING_LAMPS.r - 11.2 * 11.2), mirror: true }); }
  // standards up the water stairs and along the sea wall
  for (const s of [-1, 1]) {
    for (let k = 0; k < STAIR_LAMPS.n; k++) P.push({ x: s * STAIR_LAMPS.x, y: STAIR_LAMPS.y0 + STAIR_LAMPS.dy * k, z: STAIR_LAMPS.z0 - STAIR_LAMPS.dz * k });
    for (let k = 0; k < WALL_LAMPS.n; k++) P.push({ x: s * (WALL_LAMPS.x0 + WALL_LAMPS.dx * k), y: QUAY_Y, z: WALL_LAMPS.z, s: WALL_LAMPS.s });
  }
  // small lamps among the seats of the tiers: one on every fourth row, a quarter radian apart, the rows staggered
  const TL = TIER_LAMPS;
  for (let m = 0; m < TL.rows; m++) for (let k = -8; k <= 8; k++) {
    const a = (k + 0.5 - 0.5 * (m % 2)) * TL.da, r = TL.r0 + TL.dr * m, x = Math.sin(a) * r;
    if (Math.abs(a) > TL.amax || Math.abs(x) < TL.clear) continue;
    P.push({ x, y: TL.y0 + TL.dy * m, z: BASIN.z - Math.cos(a) * r, s: TL.s, mirror: m < 2 });
  }
  return P;
}
export function makeLamps(SH, places, time, rng, ph) {
  const A = makeAcc(), group = new THREE.Group();
  // a lamp of this town has no post: a globe of gold fire hangs in the air over a small bronze cup, and a few
  // sparks climb from the cup to it
  lathe(A, [[0.34, 0], [0.34, 0.05], [0.08, 0.12], [0.06, 0.42], [0.2, 0.5], [0.46, 0.72], [0.5, 0.78], [0.44, 0.78], [0.2, 0.6], [0, 0.58]], 0, 0, 0, 8, (j) => k7(BRONZE, 0.7 + 0.05 * j));
  ball(A, 0, 0.74, 0, 0.1, GOLD, 2.2, 3);
  for (const [y, r] of [[1.7, 0.035], [2.7, 0.045], [3.7, 0.06]]) ball(A, 0.04 * Math.sin(y * 3), y, 0.04 * Math.cos(y * 3), r, GOLD, 2.6, 3);
  ball(A, 0, 5.0, 0, 0.38, GOLD, 3.4, 6, 1.18);
  const im = new THREE.InstancedMesh(finish(A), litMaterial(SH, { sheen: 0.9 }), places.length), m4 = new THREE.Matrix4();
  places.forEach((q, i) => { const k = q.s ?? 1; m4.makeScale(k, k, k).setPosition(q.x, q.y, q.z); im.setMatrixAt(i, m4); });
  im.frustumCulled = false; group.add(im);
  const tops = places.map((q) => [q.x, q.y + 5.0 * (q.s ?? 1), q.z]), gs = (q) => 0.35 + 0.65 * (q.s ?? 1);
  const glow = fx.makeGlows({ positions: tops, sizes: places.map(gs), color: '#FFC46A', size: 3.0, intensity: 1.45, flicker: 0.12, time, renderOrder: 4, rng: ph });
  const mp = places.filter((q) => q.mirror);
  const mir = fx.makeGlows({ positions: mp.map((q) => [q.x, 2 * WATER_Y - (q.y + 5.0 * (q.s ?? 1)), q.z]), sizes: mp.map(gs), color: '#FFB860', size: 3.0, intensity: 1.5, flicker: 0.35, time, renderOrder: 1, rng: ph });
  group.add(glow.object, mir.object);
  // moths: gold motes that circle every lamp
  const NM = 6, n = places.length * NM, P = new Float32Array(n * 4), S = new Float32Array(n * 4);
  // (each moth sets out from a place on its round and at a rate of its own, drawn from the moths' stream)
  for (let i = 0; i < n; i++) { const q = places[Math.floor(i / NM)], k = q.s ?? 1, h = rng(), h2 = rng(); P.set([q.x, q.y + 5.0 * k, q.z, h * 6.28], i * 4); S.set([(0.45 + 1.0 * h2) * (0.4 + 0.6 * k), 1.4 + 2.2 * h, h2 * 6.28, 0.6 + 0.8 * ((h * 7.3) % 1)], i * 4); }
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const moths = new THREE.Mesh(instanced(qg, n, [['iP', P, 4], ['iS', S, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iS; varying vec2 vQ; varying float vA;
void main(){
  float th = uTime*iS.y + iP.w, r = iS.x*(0.75 + 0.25*sin(uTime*0.7 + iS.z));
  vec3 wp = iP.xyz + vec3(cos(th)*r, 0.35*sin(th*1.7 + iS.z) + 0.25*sin(uTime*0.9 + iP.w), sin(th)*r);
  vec4 mv = viewMatrix*vec4(wp, 1.0);
  float sz = max(0.05*iS.w, 1.1*uPx*(-mv.z));
  mv.xy += position.xy*sz;
  vQ = position.xy; vA = (0.6 + 0.4*sin(uTime*9.0 + iP.w*5.0))*min(1.0, 0.05*iS.w/sz)*(1.0 - bsFogF(-mv.z));
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vQ; varying float vA;
void main(){ float g = clamp(1.0 - dot(vQ, vQ), 0.0, 1.0); gl_FragColor = vec4(uGold*2.6*g*g*clamp(vA, 0.0, 1.0), 1.0); }`,
  }));
  moths.frustumCulled = false; moths.renderOrder = 5; group.add(moths);
  return { object: group, update(dt, t, camera) { glow.update(dt, t, camera); mir.update(dt, t, camera); } };
}

// ---------------------------------------------------------------- flower boats: bronze petals curled up round a seat and a lamp
function boatGeometry() {
  const A = makeAcc(), mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const inner = k7(BRONZE, 0.45), rim = lin('#E0B070');
  const petal = (ang, len, wid, lift, curl) => {
    const rings = [], n = 7, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i <= n; i++) {
      const t = i / n, rho = 0.25 + len * (t - curl * t * t * t), y = 0.12 + lift * Math.pow(t, 2.1), w = wid * Math.pow(Math.sin(Math.PI * (0.12 + 0.86 * t)), 0.75);
      const c = mixc(k7(BRONZE, 0.85), rim, Math.pow(t, 3)), ring = [];
      for (const [q, dy] of [[-1, 0.16], [-0.5, 0.03], [0, -0.03], [0.5, 0.03], [1, 0.16]]) {
        const lx = q * w, lz = rho;                                    // petal space: z outward, x across
        ring.push([lx * ca + lz * sa, y + dy * w * 1.4, -lx * sa + lz * ca, Math.abs(q) > 0.9 ? mixc(c, rim, 0.5) : c]);
      }
      rings.push(ring);
    }
    loft(A, rings, false, false);
  };
  petal(0, 2.6, 0.55, 1.5, 0.3); petal(Math.PI, 2.3, 0.6, 1.25, 0.34);                                  // bow and stern
  for (const s of [-1, 1]) { petal(s * 0.62, 1.9, 0.5, 0.95, 0.42); petal(s * 1.45, 1.25, 0.6, 0.8, 0.5); petal(s * 2.35, 1.8, 0.5, 0.95, 0.42); }
  // the cup they spring from, a seat, and the lamp on its stalk
  const cup = []; for (let j = 0; j <= 3; j++) { const v = j / 3, ring = []; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; ring.push([Math.sin(a) * 0.75 * (0.3 + 0.7 * v), -0.12 + 0.3 * v * v, Math.cos(a) * 1.5 * (0.3 + 0.7 * v), inner]); } cup.push(ring); }
  loft(A, cup, true, false);
  box(A, 0, 0.3, 0.2, 0.7, 0.14, 0.6, lin('#cfc6b4'));
  tube(A, [[0, 0.15, -1.1], [0, 1.2, -1.25], [0, 2.0, -0.85], [0, 2.2, -0.3]], [0.05, 0.04, 0.035, 0.03], 4, k7(BRONZE, 0.9));
  ball(A, 0, 2.06, -0.3, 0.17, GOLD, 3.6, 4);
  return finish(A);
}
// boats: [{ x, z, ph }] drift and turn slowly on the clock; lamp glows and their mirror follow
export function makeBoats(SH, boats, time, ph) {
  const group = new THREE.Group(), n = boats.length;
  const im = new THREE.InstancedMesh(boatGeometry(), litMaterial(SH, { sheen: 1.0 }), n); im.frustumCulled = false; group.add(im);
  const glow = fx.makeGlows({ positions: boats.map((b) => [b.x, WATER_Y + 2.1, b.z]), color: '#FFC46A', size: 2.4, intensity: 1.8, flicker: 0.2, time, rng: ph });
  const mir = fx.makeGlows({ positions: boats.map((b) => [b.x, WATER_Y - 2.1, b.z]), color: '#FFB860', size: 2.2, intensity: 1.4, flicker: 0.4, time, renderOrder: 1, rng: ph });
  group.add(glow.object, mir.object);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), lp = new THREE.Vector3();
  function update(dt, t, camera) {
    for (let i = 0; i < n; i++) {
      const b = boats[i];
      v.set(b.x + 0.4 * Math.sin(t * 0.11 + b.ph * 2), WATER_Y + 0.04 * Math.sin(t * 1.1 + b.ph), b.z + 3.5 * Math.sin(t * 0.06 + b.ph));
      e.set(0.03 * Math.sin(t * 0.9 + b.ph), b.ph + 0.55 * Math.sin(t * 0.08 + b.ph * 3), 0.05 * Math.sin(t * 0.7 + b.ph * 1.3));
      m4.compose(v, q.setFromEuler(e), one); im.setMatrixAt(i, m4);
      lp.set(0, 2.06, -0.3).applyMatrix4(m4);
      glow.setPosition(i, lp.x, lp.y, lp.z); mir.setPosition(i, lp.x, 2 * WATER_Y - lp.y, lp.z);
    }
    im.instanceMatrix.needsUpdate = true;
    glow.update(dt, t, camera); mir.update(dt, t, camera);
  }
  return { object: group, update };
}

// ---------------------------------------------------------------- fountains: twelve jets that rise and fall out of step
const JET_H = 19;                                                  // a tall jet breathes between 8.5 and 19 m
export function makeFountains(SH, rng) {
  // twelve tall jets in two rows beside the path, and a ring of low jets that arch in from the basin's rim
  // (all round it but the canal mouth and the landing before the portal)
  const NJ = JETS.n * 2, ND = 230, RIM = [], NR = 60;
  for (let i = 0; i < 26; i++) { const a = (i + 0.5) / 26 * Math.PI * 2, x = Math.sin(a) * 36.6; if (Math.abs(x) < 9.5) continue; RIM.push([x, BASIN.z - Math.cos(a) * 36.6, a]); }
  const n = NJ * ND + RIM.length * NR, P = new Float32Array(n * 4), S = new Float32Array(n * 4), D = new Float32Array(n * 4);
  // (every jet breathes from a moment of its own, drawn from the fountains' stream)
  const jph = Array.from({ length: NJ + RIM.length }, () => rng() * 6.283);
  for (let i = 0; i < n; i++) {
    const h = (i * 0.61803) % 1, h2 = (i * 0.7548) % 1;
    if (i < NJ * ND) {
      const j = Math.floor(i / ND), s = j < JETS.n ? -1 : 1, k = j % JETS.n;
      P.set([s * JETS.x, WATER_Y, JETS.z0 - JETS.dz * k, jph[j]], i * 4); S.set([(i % ND) / ND + 0.02 * h, h * 6.28, h2, (i % 17 === 0) ? -1 : 0.6 + 0.8 * ((h * 5.3) % 1)], i * 4);
      D.set([0, 0, JET_H, 1], i * 4);
    } else {
      const q = i - NJ * ND, j = Math.floor(q / NR), r = RIM[j];
      P.set([r[0], WATER_Y + 0.9, r[1], jph[NJ + j]], i * 4); S.set([(q % NR) / NR + 0.02 * h, h * 6.28, h2 * 0.45, 0.5 + 0.6 * ((h * 5.3) % 1)], i * 4);
      D.set([-Math.sin(r[2]) * 8.5, Math.cos(r[2]) * 8.5, 3.6, 0], i * 4);
    }
  }
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(instanced(qg, n, [['iP', P, 4], ['iS', S, 4], ['iD', D, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iS, iD; varying vec2 vQ; varying float vA, vT;
void main(){
  float H = iD.z*(0.45 + 0.55*(0.5 + 0.5*sin(uTime*0.45 + iP.w)*sin(uTime*0.17 + iP.w*2.3)));      // each tall jet breathes between about 9 and 19 m
  float a = fract(uTime*0.36 + iS.x);
  // every drop is thrown up and a little outward, and falls back in an arc; one in seventeen is a soft puff of spray
  float up = 4.0*a*(1.0 - a), spread = 0.25 + 2.1*iS.z*iS.z;
  vec2 dir = vec2(cos(iS.y), sin(iS.y));
  vec3 wp = iP.xyz + vec3(dir.x*spread*a + iD.x*a, H*up*(0.82 + 0.18*iS.z) - 0.9*a*(1.0 - iD.w), dir.y*spread*a + iD.y*a);
  wp.x += uWind.x*0.9*a*a;
  vec4 mv = viewMatrix*vec4(wp, 1.0);
  float puff = step(iS.w, 0.0), px = uPx*(-mv.z);
  float sz = mix(max(0.045*abs(iS.w), 0.75*px), 0.7 + 1.5*a, puff);
  mv.x += position.x*sz; mv.y += position.y*sz*mix(1.0 + 1.6*abs(1.0 - 2.0*a), 1.2, puff);
  vQ = position.xy; vT = a;
  vA = mix(min(1.0, 0.045*abs(iS.w)/max(0.75*px, 1e-4))*0.95, 0.045*sin(3.1416*a), puff)*smoothstep(0.0, 0.04, a)*(1.0 - smoothstep(0.95, 1.0, a))*(1.0 - bsFogF(-mv.z));
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vQ; varying float vA, vT;
void main(){
  float g = clamp(1.0 - dot(vQ, vQ), 0.0, 1.0); g *= g;
  vec3 c = (uSkyCol*1.5 + uMoonCol*2.2 + uKeyCol*0.9 + uGold*0.35)*(0.8 + 0.5*clamp(1.0 - vT, 0.0, 1.0));
  float a = clamp(vA, 0.0, 1.0)*g;
  gl_FragColor = vec4(c*a, a*0.5);
}`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 5;
  // the body of each tall jet: a slender column of white water that widens as it climbs and breaks at the top
  const NC = 10, cp = [], ci = [], CP = new Float32Array(NJ * 4);
  for (let i = 0; i <= NC; i++) cp.push(i / NC, -1, 0, i / NC, 1, 0);
  for (let i = 0; i < NC; i++) { const a = i * 2; ci.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  for (let j = 0; j < NJ; j++) CP.set([(j < JETS.n ? -1 : 1) * JETS.x, WATER_Y, JETS.z0 - JETS.dz * (j % JETS.n), jph[j]], j * 4);
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
  const cols = new THREE.Mesh(instanced(cg, NJ, [['iP', CP, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP; varying vec2 vUv; varying float vA;
void main(){
  float H = ${JET_H.toFixed(1)}*(0.45 + 0.55*(0.5 + 0.5*sin(uTime*0.45 + iP.w)*sin(uTime*0.17 + iP.w*2.3)));
  float s = position.x;
  vec3 wp = iP.xyz + vec3(uWind.x*0.35*s*s, H*0.94*s, 0.0);
  vec3 Vv = cameraPosition - wp; float d = length(Vv);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), Vv) + vec3(1e-4, 0.0, 0.0));
  wp += side*position.y*(0.2 + 0.55*s*s);
  vUv = vec2(position.y, s*H); vA = smoothstep(0.0, 0.04, s)*(1.0 - smoothstep(0.7, 1.0, s))*(1.0 - bsFogF(d));
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
varying vec2 vUv; varying float vA;
void main(){
  float x = clamp(vUv.x, -1.0, 1.0), core = 1.0 - smoothstep(0.15, 1.0, abs(x));
  float streak = 0.55 + 0.45*bsN(vec2(x*3.0, vUv.y*1.3 - uTime*9.0));
  float a = core*streak*clamp(vA, 0.0, 1.0)*0.6;
  vec3 c = uSkyCol*1.5 + uMoonCol*2.2 + uKeyCol*0.9 + uGold*0.35;
  gl_FragColor = vec4(c*a, a*0.6);
}`,
  }));
  cols.frustumCulled = false; cols.renderOrder = 5;
  const group = new THREE.Group(); group.add(cols, mesh);
  return { object: group };
}

// ---------------------------------------------------------------- crystal
// Clear crystal, shaded per facet: each face shows a bent piece of the dusk behind it (zenith blue, the lavender
// horizon, the rose of the afterglow, the pale floor) and mirrors another, so a pillar is a stack of small skies.
const CR_ENV = /* glsl */`
uniform vec3 uCZen, uCHor, uCFloor;
vec3 crEnv(vec3 d){
  float up = clamp(d.y, 0.0, 1.0);
  vec3 sky = mix(uCHor, uCZen, sqrt(up));
  float west = clamp(dot(normalize(d.xz + vec2(1e-4, 0.0)), normalize(uKeyDir.xz)), 0.0, 1.0);
  float low = 1.0 - up; low *= low; low *= low;
  sky += uKeyCol*0.6*west*west*low;
  float mo = clamp(dot(d, uMoonDir), 0.0, 1.0); mo *= mo; mo *= mo; mo *= mo; mo *= mo;
  sky += uMoonCol*1.4*mo*mo;
  vec3 gnd = uCFloor*(0.55 + 0.45*clamp(-d.y*3.0, 0.0, 1.0));
  return mix(gnd, sky, smoothstep(-0.25, 0.25, d.y));       // (floor and sky meet in a facet as a gradual sheen, not on a line)
}`;
function crystalUniforms(SH, o = {}) {
  return { ...SH, uCZen: { value: new THREE.Color(o.zenith ?? '#1A1F4E') }, uCHor: { value: new THREE.Color(o.horizon ?? '#7C6BB8') }, uCFloor: { value: new THREE.Color(o.floor ?? '#6E6A9C') },
    uTint: { value: new THREE.Color(o.tint ?? '#a8c4ff') }, uGlowCol: { value: new THREE.Color(o.glowColor ?? '#8fb8ff') }, uGlow: { value: o.glow ?? 0.12 }, uFleck: { value: o.fleck ?? 0 }, uBody: { value: o.body ?? 0.6 } };
}
function crystalMat(SH, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: crystalUniforms(SH, o), side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec2 aQ; varying vec2 vQ;
varying vec3 vW, vL;
void main(){
  vQ = aQ;
  vec3 lp = position;
  #ifdef USE_INSTANCING
  lp = (instanceMatrix*vec4(lp, 1.0)).xyz;
  #endif
  vec4 wp = modelMatrix*vec4(lp, 1.0); vW = wp.xyz; vL = position;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
${CR_ENV}
uniform vec3 uTint, uGlowCol; uniform float uGlow, uFleck, uBody;
varying vec3 vW, vL; varying vec2 vQ;
void main(){
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0.0, 1e-7, 0.0)); if (dot(N, V) < 0.0) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0), om = 1.0 - nv, F = 0.06 + 0.94*om*om*om*om;
  vec3 R = reflect(-V, N);
  vec3 T = normalize(refract(-V, N, 0.7) + R*1e-3);
  vec3 T2 = reflect(T, normalize(N + vec3(0.35, 0.5, -0.25)));
  vec3 thru = crEnv(T)*0.55 + crEnv(T2)*0.45;
  vec3 c = thru*uTint*uBody*(1.0 - F) + crEnv(R)*F*1.1;
  // a pale light inside, in slow veins
  float vein = bsN(vec2(vL.x*1.3 + vL.z*1.7, vL.y*0.35 - uTime*0.09)); vein *= vein;
  c += uGlowCol*uGlow*(0.15 + 2.2*vein)*(0.3 + 0.7*nv);
  // facets that throw the afterglow into the eye
  float kg = clamp(dot(R, uKeyDir), 0.0, 1.0); kg *= kg; kg *= kg; kg *= kg; kg *= kg;
  c += uKeyCol*1.5*kg*kg;
  // the arrises between facets catch the light as thin bright lines
  vec2 fq = clamp(vQ, 0.0, 1.0);                                      // (a varying runs past its range at an antialiased edge)
  vec2 eq = min(fq, 1.0 - fq), ew = fwidth(vQ)*1.2 + 1e-4;
  float edge = (1.0 - smoothstep(0.0, ew.x, eq.x))*(0.25 + 0.75*bsN(vec2(vL.y*0.8, vL.x*3.0 + vL.z*2.0) + 2.0));
  c += (crEnv(vec3(R.x, abs(R.y) + 0.3, R.z))*0.4 + uMoonCol*0.3 + uKeyCol*0.15)*edge*0.6*(1.0 - smoothstep(30.0, 110.0, d));
  // no two facets alike: each passes a little more or less of the light behind it
  float fid = dot(floor(N.xz*5.0 + 0.5), vec2(7.0, 13.0));
  c *= 0.72 + 0.56*bsN(vec2(fid*1.37, vL.y*0.45));
  // and now and then one flashes as the vanes turn the last light through it
  float tw = bsH(vec2(fid, floor(vL.y*0.7)));
  c += (uMoonCol*0.45 + uKeyCol*0.3)*smoothstep(0.8, 1.0, sin(uTime*(0.7 + 1.9*tw) + tw*50.0))*step(0.72, tw)*(1.0 - abs(2.0*fq.x - 1.0))*(1.0 - abs(2.0*fq.y - 1.0))*(1.0 - abs(2.0*fract(vL.y*0.7) - 1.0))*(1.0 - smoothstep(40.0, 120.0, d));       // (the flash dies toward the ends of its stretch of the facet: a sheen, no pale rectangle)
  // gold flecks deep in the crystal where the fruit's light is caught
  float fl = bsN(vec2(vL.x*4.0 + vL.z*5.0, vL.y*2.2) + 9.0);
  c += uGold*uFleck*smoothstep(0.74, 0.92, fl)*(0.5 + 0.5*sin(uTime*1.3 + vL.y*2.0))*(0.3 + 0.7*nv);
  gl_FragColor = vec4(bsFog(max(c, 0.0), d), 1.0);
}`,
  });
}
// a wall of the same crystal between the outer pillars: cut in tall lozenge facets, each leaning its own way and
// showing its own piece of the dusk; half clear, with a pale light inside and the gold of the fruit that grow from it
function screenMat(SH, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: crystalUniforms(SH, o), side: THREE.DoubleSide, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
varying vec3 vW, vN;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; vN = normal; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
${CR_ENV}
varying vec3 vW, vN;
void main(){
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  vec2 fq = vec2(vW.z*0.42 + vW.y*0.21, vW.y*0.42 - vW.z*0.21), fi = floor(fq), ff = abs(fract(fq) - 0.5);
  float fh = bsH(fi + 3.0), fh2 = bsH(fi + 11.0);
  vec3 N = normalize(vN + vec3(0.0, (fh - 0.5)*0.5, (fh2 - 0.5)*0.5) + vec3(1e-5, 0.0, 0.0)); if (dot(N, V) < 0.0) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0), om = 1.0 - nv, F = 0.06 + 0.94*om*om*om*om;
  vec3 R = reflect(-V, N);
  vec3 T = normalize(refract(-V, N, 0.75) + R*1e-3);
  float edge = smoothstep(0.43, 0.5, max(ff.x, ff.y))*(1.0 - smoothstep(25.0, 90.0, d));
  float vein = bsN(vec2(vW.z*1.3, vW.y*0.35 - uTime*0.07)); vein *= vein;
  vec3 c = crEnv(T)*vec3(0.62, 0.74, 1.0)*0.6*(0.65 + 0.7*fh) + crEnv(R)*F*1.1;
  c += vec3(0.5, 0.65, 1.0)*0.16*(0.5 + 1.6*vein);                    // (the pane has body: a soft sheen in slow veins)
  c += (uMoonCol*0.5 + uKeyCol*0.25)*edge*0.14;                       // (and its cut lines are faint in it, never bare)
  float gl = bsN(vec2(vW.z*0.8, vW.y*0.8) + 5.0); gl *= gl;
  c += uGold*0.3*gl;
  float a = clamp(0.64 + 0.3*F + 0.06*edge, 0.0, 0.92);
  gl_FragColor = vec4(bsFog(max(c, 0.0), d)*a, a);
}`,
  });
}

// ---------------------------------------------------------------- the crystal house
export const PILLARS = (() => {
  const P = []; for (const x of [-20, -9, 9, 20]) for (let i = 0; i < 10; i++) P.push({ x, y: FLOOR_Y, z: -448.5 - 7 * i, inner: Math.abs(x) < 10 });
  // the same crystal stands in two ranks up the tiers, one pillar on every fifth row either side of the aisle to the portal
  // (these stand half as tall again, 12 m either side of our line, and hold the last view)
  for (const row of [1, 6, 11, 16]) for (const s of [-1, 1]) { const r = 48 + 1.6 * (row + 0.5); P.push({ x: s * 12, y: QUAY_Y + row + 1, z: BASIN.z - Math.sqrt(r * r - 12 * 12), inner: false, avenue: true, k: 1.5 }); }
  return P;
})();
// lofted, flat-shaded crystal: every quad carries its own (0..1, 0..1) so the shader can find the facet edges
function facetQuads(geo) {
  const n = geo.attributes.position.count, q = new Float32Array(n * 2), pat = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  for (let i = 0; i < n; i++) { q[i * 2] = pat[(i % 6) * 2]; q[i * 2 + 1] = pat[(i % 6) * 2 + 1]; }
  geo.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2));
  return geo;
}
function crystalColumn(r, h, sides, flare = 1) {
  const A = makeAcc(), c = [1, 1, 1], rings = [], prof = [[1.16, 0], [1.16, 0.035], [1.0, 0.06], [0.93, 0.5], [0.9, 0.86], [1.0 + 0.36 * flare, 0.94], [0.86 + 0.2 * flare, 0.966], [0.5, 0.992], [0.02, 1.0]];
  prof.forEach((q, j) => { const ring = []; for (let k = 0; k < sides; k++) { const a = (k + 0.12 * j) / sides * 6.283; ring.push([Math.sin(a) * q[0] * r, q[1] * h, Math.cos(a) * q[0] * r, c]); } rings.push(ring); });
  loft(A, rings, true, false);
  return facetQuads(finish(A, true));
}
export async function makeHouse(ctx, SH, env, o = {}) {
  const rng = o.rng, group = new THREE.Group(), time = SH.uTime, m4 = new THREE.Matrix4(), vS = new THREE.Vector3();
  // forty pillars, 2.2 m thick and 16 m tall
  const cmat = crystalMat(SH, { ...o.sky, glow: 0.14 });
  const pil = new THREE.InstancedMesh(crystalColumn(1.1, 16, 10), cmat, PILLARS.length);
  PILLARS.forEach((p, i) => { const k = p.k ?? 1; m4.makeRotationY(i * 0.7).scale(vS.set(k, k, k)).setPosition(p.x, p.y, p.z); pil.setMatrixAt(i, m4); });
  pil.frustumCulled = false; group.add(pil);
  await ctx.yield();
  // crystal screens between the outer pillars
  const sp = [], sn = [], si = []; let sv = 0;
  for (const x of [-20, 20]) for (let i = 0; i < 9; i++) {
    const z0 = -448.5 - 7 * i - 1.2, z1 = z0 - 4.6, y0 = FLOOR_Y + 0.4, y1 = FLOOR_Y + 12.5 + 1.5 * Math.sin(i * 1.9);
    sp.push(x, y0, z0, x, y0, z1, x, y1, z1, x, y1, z0); for (let q = 0; q < 4; q++) sn.push(-Math.sign(x), 0, 0);
    si.push(sv, sv + 1, sv + 2, sv, sv + 2, sv + 3); sv += 4;
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(sn, 3)); sg.setIndex(si);
  const screens = new THREE.Mesh(sg, screenMat(SH, o.sky)); screens.renderOrder = 3; group.add(screens);
  await ctx.yield();
  // every pillar head opens in a capital of six broad round-ended petals, like a flower; the flowers turn slowly
  // after the last light
  const V = makeAcc();
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * 6.283, ca = Math.cos(a), sa = Math.sin(a), rings = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, r = 0.85 + 2.5 * t, y = 1.25 * Math.sin(t * 1.9) - 0.5 * t * t, w = 1.05 * Math.pow(Math.sin(Math.PI * (0.08 + 0.86 * t)), 0.6) + 0.08;
      const pt = (q, dy) => [ca * r - sa * q * w, y + dy, sa * r + ca * q * w, [1, 1, 1]];
      rings.push([pt(-1, 0.24 * w), pt(0, 0), pt(1, 0.24 * w)]);
    }
    loft(V, rings, false, false);
  }
  const vanes = new THREE.InstancedMesh(facetQuads(finish(V, true)), crystalMat(SH, { ...o.sky, glow: 0.16 }), PILLARS.length);
  vanes.frustumCulled = false; group.add(vanes);
  await ctx.yield();
  // golden fruit, 320 of them, on short glassy stems out of the screens and the pillars; they nod in the draught
  const F = makeAcc(), fgold = lin('#FFC46A'), stem = lin('#cfe0ff');
  const stemC = [stem[0] * 0.5, stem[1] * 0.5, stem[2] * 0.5];
  tube(F, [[0, 0, -0.03], [0, 0, 0.05]], [0.12, 0.035], 5, [[0.05, 0.08, 0.2], [0.3, 0.4, 0.7]]);       // the dimple it grows from
  tube(F, [[0, 0, 0], [0, -0.03, 0.2], [0, -0.1, 0.34]], [0.024, 0.02, 0.014], 3, stemC);
  ball(F, 0, -0.2, 0.42, 0.175, fgold, 1, 4, 1.12);
  tube(F, [[0, -0.02, 0.14], [0.17, -0.2, 0.3]], [0.016, 0.01], 3, stemC);   // and a smaller one beside it on the same stalk
  ball(F, 0.2, -0.29, 0.33, 0.115, fgold, 0.85, 3, 1.1);
  const NF0 = 320, HP = PILLARS.filter((p) => !p.avenue), AP = PILLARS.filter((p) => p.avenue), NF = NF0 + AP.length * 6, FP = new Float32Array(NF * 4), FS = new Float32Array(NF * 4), ra = o.rng2;
  for (let i = NF0; i < NF; i++) {                                 // six on each pillar of the avenue up the tiers
    const p = AP[(i - NF0) % AP.length], a = ra() * 6.283;
    FP.set([p.x + Math.sin(a) * 1.52, p.y + 3.5 + ra() * 15, p.z + Math.cos(a) * 1.52, a], i * 4); FS.set([ra() * 6.283, 0.8 + 0.5 * ra(), ra(), ra()], i * 4);
  }
  for (let i = 0; i < NF0; i++) {
    let x, y, z, a;
    if (i % 5 < 3) { const s = rng() < 0.5 ? -1 : 1, inward = rng() < 0.8; x = s * 20 + (inward ? -s : s) * 0.02; z = -448.5 - 7 * rng.int(0, 8) - 1.4 - rng() * 4.2; y = FLOOR_Y + 1.2 + rng() * 10.5; a = (inward ? -s : s) * Math.PI / 2; }
    else { const p = HP[rng.int(0, HP.length - 1)]; a = rng() * 6.283; y = p.y + 2.5 + rng() * 10; x = p.x + Math.sin(a) * 1.0; z = p.z + Math.cos(a) * 1.0; }
    FP.set([x, y, z, a], i * 4); FS.set([rng() * 6.283, 0.8 + 0.5 * rng(), rng(), rng()], i * 4);
  }
  const fruit = new THREE.Mesh(instanced(finish(F), NF, [['iP', FP, 4], ['iS', FS, 4]]), new THREE.ShaderMaterial({
    uniforms: SH,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec3 color; attribute float aGlow; attribute vec4 iP, iS;
varying vec3 vC, vN, vW; varying float vG;
void main(){
  vec3 p = position*iS.y*1.45, n = normal;                             // (a fruit is as big as two fists)
  float nod = 0.22*sin(uTime*(0.9 + 0.5*iS.z) + iS.x) + 0.1*sin(uTime*2.3 + iS.x*3.0);       // swing about the stem's root
  float w = clamp(p.z/0.6, 0.0, 1.0);
  p.x += nod*w*0.3; p.y -= abs(nod)*w*0.06;
  float ca = cos(iP.w), sa = sin(iP.w);
  p = vec3(p.x*ca + p.z*sa, p.y, -p.x*sa + p.z*ca); n = vec3(n.x*ca + n.z*sa, n.y, -n.x*sa + n.z*ca);
  vec3 wp = iP.xyz + p; vW = wp; vN = n; vC = color; vG = aGlow*(0.8 + 0.2*sin(uTime*0.8 + iS.x*2.0))*(0.75 + 0.5*iS.w);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vC, vN, vW; varying float vG;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  float nv = clamp(dot(N, V), 0.0, 1.0);
  vec3 c = vC*bsLight(N)*0.5 + vC*max(vG, 0.0)*(0.5 + 1.25*nv*nv)*vec3(1.0, 0.9, 0.75);         // lit from inside: brighter at the heart, a round rim
  gl_FragColor = vec4(bsFog(max(c, 0.0), d), 1.0);
}`,
  }));
  fruit.frustumCulled = false; group.add(fruit);
  const fglow = fx.makeGlows({ positions: Array.from({ length: NF }, (_, i) => [FP[i * 4] + Math.sin(FP[i * 4 + 3]) * 0.5, FP[i * 4 + 1] - 0.2, FP[i * 4 + 2] + Math.cos(FP[i * 4 + 3]) * 0.5]), color: '#FFC46A', size: 1.5, intensity: 0.2, flicker: 0.12, time, renderOrder: 4, rng: o.phases });
  group.add(fglow.object);
  await ctx.yield();
  // chime strands hang from the vane rings of the inner pillars; fine mist falls from every pillar head
  const NC = 4, inner = PILLARS.filter((p) => p.inner), nc = inner.length * NC, CP = new Float32Array(nc * 4), CS = new Float32Array(nc * 4);
  for (let i = 0; i < nc; i++) { const p = inner[Math.floor(i / NC)], a = rng() * 6.283, r = 1.9 + rng() * 1.2; CP.set([p.x + Math.sin(a) * r, FLOOR_Y + 15.6 + rng() * 0.8, p.z + Math.cos(a) * r, 2.6 + rng() * 2.6], i * 4); CS.set([rng() * 6.283, 0.6 + rng() * 0.8, rng(), rng()], i * 4); }
  const cp = [], ci = []; for (let i = 0; i <= 10; i++) cp.push(i / 10, -1, 0, i / 10, 1, 0); for (let i = 0; i < 10; i++) { const a = i * 2; ci.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
  const chimes = new THREE.Mesh(instanced(cg, nc, [['iP', CP, 4], ['iS', CS, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iS; varying vec2 vUv; varying float vA, vPh;
void main(){
  float s = position.x, sw = 0.16*iS.y*sin(uTime*(0.8 + 0.5*iS.z) + iS.x), sw2 = 0.12*iS.y*sin(uTime*0.6 + iS.x*2.0);
  vec3 wp = iP.xyz + vec3(sin(sw)*s*iP.w, -cos(sw)*s*iP.w, sin(sw2)*s*iP.w);
  vec3 Vv = cameraPosition - wp; float d = length(Vv);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), Vv/max(d, 1e-3)) + vec3(1e-4, 0.0, 0.0));
  float w = max(0.035, 0.8*uPx*d);
  wp += side*position.y*w;
  vUv = vec2(s*iP.w, position.y); vA = min(1.0, 0.035/w)*smoothstep(1.0, 4.0, d)*(1.0 - bsFogF(d)); vPh = iS.x;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vUv; varying float vA, vPh;
void main(){
  float bead = smoothstep(0.55, 0.95, sin(vUv.x*10.0 + vPh));                               // crystal beads along the strand
  float glint = bead*smoothstep(0.5, 1.0, sin(uTime*2.1 + vUv.x*3.0 + vPh*5.0));
  vec3 c = vec3(0.45, 0.6, 1.0)*0.8 + (uMoonCol + uKeyCol*0.5)*1.1*bead + uGold*2.6*glint;
  gl_FragColor = vec4(c*clamp(vA, 0.0, 1.0)*clamp(1.0 - 0.5*abs(vUv.y), 0.0, 1.0), 1.0);
}`,
  }));
  chimes.frustumCulled = false; chimes.renderOrder = 5; group.add(chimes);
  const NM = 10, nm = PILLARS.length * NM, MP = new Float32Array(nm * 4), MY = new Float32Array(nm);
  for (let i = 0; i < nm; i++) { const p = PILLARS[Math.floor(i / NM)]; MP.set([p.x, p.z, rng(), rng() * 6.283], i * 4); MY[i] = p.y; }
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const mist = new THREE.Mesh(instanced(qg, nm, [['iP', MP, 4], ['iY', MY, 1]]), new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP; attribute float iY; varying vec2 vQ; varying float vA;
void main(){
  float a = fract(uTime*0.11 + iP.z);
  vec3 wp = vec3(iP.x + cos(iP.w)*(1.4 + 1.2*a) + uWind.x*a*1.5, iY + 15.8 - 14.5*a*(0.4 + 0.6*a), iP.y + sin(iP.w)*(1.4 + 1.2*a));
  vec4 mv = viewMatrix*vec4(wp, 1.0);
  float sz = 1.3 + 2.4*a;
  mv.x += position.x*sz; mv.y += position.y*sz*1.5;
  vQ = position.xy; vA = 0.05*sin(3.1416*a)*smoothstep(2.5, 9.0, -mv.z)*(1.0 - bsFogF(-mv.z));
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vQ; varying float vA;
void main(){ float g = clamp(1.0 - dot(vQ, vQ), 0.0, 1.0); g *= g; float a = clamp(vA, 0.0, 1.0)*g; gl_FragColor = vec4((uSkyCol*1.2 + uMoonCol + uKeyCol*0.5 + uGold*0.12)*a, a); }`,
  }));
  mist.frustumCulled = false; mist.renderOrder = 6; group.add(mist);
  const e = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  // (each flower sways from a moment of its own, drawn last from the house's stream)
  const vph = PILLARS.map(() => rng() * 6.283);
  function update(dt, t, camera) {
    if (camera) fglow.update(dt, t, camera);
    // the vanes follow the last light in the west-north-west, each a little behind or ahead of its neighbours
    for (let i = 0; i < PILLARS.length; i++) {
      const p = PILLARS[i];
      e.set(0.16 + 0.05 * Math.sin(t * 0.21 + vph[i]), -1.05 + 0.5 * Math.sin(t * 0.13 + vph[i] * 0.9) + 0.12 * Math.sin(t * 0.41 + vph[i] * 2.1), 0.1 * Math.sin(t * 0.17 + vph[i] * 1.3), 'YXZ');
      const k = p.k ?? 1; m4.compose(v.set(p.x, p.y + 15.0 * k, p.z), q.setFromEuler(e), vS.set(k, k, k)); vanes.setMatrixAt(i, m4);
    }
    vanes.instanceMatrix.needsUpdate = true;
  }
  update(0, 0, null);
  return { object: group, update };
}

// ---------------------------------------------------------------- the crystal arch round the portal (16 m opening)
// (the jambs' six faces are turned 20 degrees from square to our line: square on, the two faces toward us stood
// exactly on a seam of the crystal's facet pattern and broke into a sparkle of small square blocks)
function makeArch(SH, sky, at) {
  const A = makeAcc(), c = [1, 1, 1], R = 9.2, r = 1.15, pts = [];
  for (const s of [-1, 1]) {
    const rings = []; for (const [k, y] of [[1.3, 0], [1.3, 0.5], [1.0, 0.9], [1.0, at.y - QUAY_Y]]) { const ring = []; for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283 + 0.35; ring.push([s * R + Math.sin(a) * r * k, QUAY_Y + y, at.z + Math.cos(a) * r * k, c]); } rings.push(ring); }
    loft(A, rings, true, false);
  }
  for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI; pts.push([Math.cos(a) * R, at.y + Math.sin(a) * R, at.z]); }
  tube(A, pts, r, 6, c);
  return new THREE.Mesh(facetQuads(finish(A, true)), crystalMat(SH, { ...sky, glow: 0.4, glowColor: '#CFE0FF', body: 0.8 }));
}

// ---------------------------------------------------------------- hanging plants of the quays, the bridges and the sea wall
// Real strands: each tuft is rooted in a mat of leaves on a ledge (the quay's lip, a bridge's edge, the wall's
// coping) and lets four leafy strands down, one before another, that swing in the air; by the water they trail
// into it. Silver-green leaves, pale gold at the tips, a few small blue flowers. A second, flipped draw lies under
// the water as their reflection.
function creeperGeometry(rng) {
  const P = [], C = [], V = [], I = []; let n = 0;
  const leaf = [0.2, 0.36, 0.29], pale = [0.36, 0.52, 0.43], gold = [0.7, 0.6, 0.33], stemC = [0.17, 0.3, 0.25], blue = [0.4, 0.56, 1.0];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // aV: how far down its strand (0 to 1), kind (0 stem, 1 leaf, 2 flower, 3 the mat on the ledge), phase, and where
  // along the ledge its strand is rooted (the tuft spreads by its roots; a leaf keeps its own shape)
  const v = (x, y, z, c, down, kind, ph, root) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); V.push(down, kind, ph, root); return n++; };
  // a leaf: a pointed oval (two triangles, folded along its rib), rooted at (x, -d, z), pointing out at yaw, drooping
  const addLeaf = (x, d, z, yaw, droop, len, c, ph, kind, root) => {
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cd = Math.cos(droop), sd = Math.sin(droop);
    const fx = sa * cd, fy = -sd, fz = ca * cd, sx = ca, sz = -sa, w = len * 0.36;
    const a0 = v(x, -d, z, mixc(c, stemC, 0.3), d, kind, ph, root), a1 = v(x + fx * len * 0.45 + sx * w, -d + fy * len * 0.45 + 0.04 * len, z + fz * len * 0.45 + sz * w, c, d, kind, ph, root);
    const a2 = v(x + fx * len, -d + fy * len, z + fz * len, mixc(c, gold, 0.3), d, kind, ph, root), a3 = v(x + fx * len * 0.45 - sx * w, -d + fy * len * 0.45 + 0.04 * len, z + fz * len * 0.45 - sz * w, c, d, kind, ph, root);
    I.push(a0, a1, a2, a0, a2, a3);
  };
  // the mat on the ledge: leaves lying back over the stone and forward over the lip
  for (let k = 0; k < 5; k++) { const x = (k / 4 - 0.5) * 0.9; addLeaf(x, -0.03, -0.1 - 0.08 * (k % 2), Math.PI + (rng() - 0.5) * 1.6 + (k % 2 ? 0 : Math.PI), 0.1, 0.24 + 0.1 * rng(), mixc(leaf, pale, rng()), rng() * 6.283, 3, x); }
  // six strands of unequal length, rooted unevenly along the ledge; each wanders as it hangs (the shader bends it),
  // and its leaves hang to either side by turns, drooping, the lowest the smallest and the yellowest
  for (let j = 0; j < 6; j++) {
    const x = (rng() - 0.5) * 1.0, z = 0.05 + 0.3 * rng(), len = j === 0 ? 1 : 0.35 + 0.6 * rng(), ph = rng() * 6.283, NS = 3;
    for (let i = 0; i < NS; i++) {
      const d0 = len * i / NS, d1 = len * (i + 1) / NS;
      const b = v(x - 0.011, -d0, z, stemC, d0, 0, ph, x), c = v(x + 0.011, -d0, z, stemC, d0, 0, ph, x), e = v(x + 0.011, -d1, z, stemC, d1, 0, ph, x), f = v(x - 0.011, -d1, z, stemC, d1, 0, ph, x);
      I.push(b, f, e, b, e, c);
    }
    const NL = 5, side0 = rng() < 0.5 ? 1 : -1;
    for (let k = 0; k < NL; k++) {
      const d = len * (k + 0.3 + 0.6 * rng()) / NL, tip = d / len, fl = j % 3 === 0 && k === 3;
      if (fl) addLeaf(x, d, z + 0.02, rng() * 6.283, 0.1, 0.12, blue, ph, 2, x);
      else addLeaf(x, d, z, (k % 2 ? 1 : -1) * side0 * (Math.PI / 2 - 0.5 + rng() * 0.8), 0.75 + 0.55 * rng(), (0.3 + 0.2 * rng()) * (1 - 0.35 * tip), mixc(mixc(leaf, pale, rng()), gold, 0.7 * tip * tip * tip), ph, 1, x);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 4)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
function makeCreeper(SH, rng, rng2, rng3) {
  const L = [];                                                      // x, y, z, length | facing angle of the ledge's outward normal, width, phase, tone
  const push = (x, y, z, len, face, w) => L.push([x, y, z, len, face, w, rng() * 6.283, rng()]);
  // (facing: the way the strands hang out from the stone: +x or -x off the quay walls, +z or -z off a bridge's edges)
  for (const s of [-1, 1]) for (let z = -519; z > -705; z -= 1.5 + rng() * 2.2) { if (rng() < 0.35) { z -= 6 * rng(); continue; } push(s * 7.0, QUAY_Y, z, 1.25 + rng() * 0.5, s < 0 ? Math.PI / 2 : -Math.PI / 2, 1.2 + rng() * 1.6); }
  for (let i = 0; i < 46; i++) { const a = rng() * 6.283, x = Math.sin(a) * 38.0, z = BASIN.z - Math.cos(a) * 38.0; if (Math.abs(x) < 8 && z > BASIN.z) continue; push(x, QUAY_Y, z, 1.25 + rng() * 0.45, a + Math.PI, 1.2 + rng()); }
  const overWater = L.length;
  for (const z of BRIDGES) for (const e of [-1.52, 1.52]) for (let x = -15; x < 15; x += 0.8 + rng() * 1.4) {
    if (rng() < 0.3) continue;
    const q = Math.abs(x) / 21, y = QUAY_Y + 11.4 * (1 - q * q);
    push(x, y, z + e * 1.08, Math.min(1.6 + rng() * 3.2, y - 15.8), e > 0 ? 0 : Math.PI, 0.7 + rng() * 0.8);
  }
  const r2 = rng2, push2 = (x, y, z, len, face, w) => L.push([x, y, z, len, face, w, r2() * 6.283, r2()]);
  for (const s of [-1, 1]) for (let x = 24; x < 230; x += 3.2 + r2() * 4.0) {                        // down the face of the sea wall from its string course, in long patches
    if (r2() < 0.12) { x += 10 + 26 * r2(); continue; }
    push2(s * x, QUAY_Y - 1.25, -429.55, 1.4 + r2() * 3.4, 0, 2.2 + r2() * 2.2);
  }
  const n = L.length, P = new Float32Array(n * 4), S = new Float32Array(n * 4);
  L.forEach((q, i) => { P.set(q.slice(0, 4), i * 4); S.set(q.slice(4), i * 4); });
  const base = creeperGeometry(rng3), geo = instanced(base, n, [['iP', P, 4], ['iS', S, 4]]);
  const geoW = instanced(base, overWater, [['iP', P.slice(0, overWater * 4), 4], ['iS', S.slice(0, overWater * 4), 4]]);
  const mat = (flip) => new THREE.ShaderMaterial({
    uniforms: SH, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec3 color; attribute vec4 aV, iP, iS;
varying vec3 vC, vN, vW; varying float vGl;
void main(){
  float down = aV.x, kind = aV.y, ph = aV.z + iS.z;
  float ca = cos(iS.x), sa = sin(iS.x);
  // the tuft is as wide as its place on the ledge; a strand is as long as that place lets it hang
  vec3 lp = vec3(aV.w*iS.y + (position.x - aV.w)*1.2, position.y, position.z);
  float len = iP.w, hang = down*len;
  // (down the strand, leaves keep their own size; the strand wanders from side to side as it hangs)
  lp.y = position.y + down - hang;
  lp.x += step(kind, 2.5)*0.11*sin(hang*2.6 + ph)*smoothstep(0.0, 0.5, hang);
  float lo = step(kind, 2.5);                                          // the mat on the ledge does not swing
  float sw = lo*hang*hang*0.045*(sin(uTime*(0.8 + 0.3*iS.w) + ph + hang*0.9) + 0.5*sin(uTime*1.7 + ph*2.0 + hang*2.0));
  float fl = lo*step(0.5, kind)*0.05*sin(uTime*2.6 + ph*3.0 + down*17.0);
  lp.x += sw*0.8 + fl; lp.z += sw*0.6 + abs(sw)*0.3 + fl*0.6;
  vec3 wp = iP.xyz + vec3(lp.x*ca + lp.z*sa, lp.y, -lp.x*sa + lp.z*ca);
  vec3 n = vec3(normal.x*ca + normal.z*sa, normal.y, -normal.x*sa + normal.z*ca);
  ${flip ? `wp.y = 2.0*${WATER_Y.toFixed(2)} - wp.y; n.y = -n.y; wp.x += 0.06*sin(wp.y*2.3 + uTime*1.7 + wp.z*0.4);` : ''}
  vC = color*(0.8 + 0.4*iS.w); vN = n; vW = wp; vGl = step(1.5, kind)*step(kind, 2.5);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vC, vN, vW; varying float vGl;
void main(){
  ${flip ? `if (vW.y > ${WATER_Y.toFixed(2)}) discard;` : ''}
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  float d = length(cameraPosition - vW);
  vec3 alb = max(vC, 0.0);
  // a leaf is thin: it takes the light on both faces, and the lamps' gold from below
  vec3 c = alb*(bsLight(N)*0.75 + bsLight(-N)*0.35 + uGold*0.22) + alb*clamp(vGl, 0.0, 1.0)*1.3;
  ${flip ? 'c *= vec3(0.42, 0.36, 0.46);' : ''}
  gl_FragColor = vec4(bsFog(max(c, 0.0), d), 1.0);
}`,
  });
  const group = new THREE.Group(), up = new THREE.Mesh(geo, mat(false)), under = new THREE.Mesh(geoW, mat(true));
  up.frustumCulled = false; under.frustumCulled = false; group.add(up, under);
  return group;
}

// ---------------------------------------------------------------- fallen leaves of the silver trees
// They blow over the forecourt and the floor of the crystal house, tumbling and hopping downwind, and come round again.
function makeLeaves(SH, rng, n) {
  const P = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) P.set([rng(), rng(), rng(), 0.09 + 0.1 * rng()], i * 4);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 0, -0.45, 0, 1, 0, 0, 0, 0.45, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(instanced(g, n, [['iP', P, 4]]), new THREE.ShaderMaterial({
    uniforms: SH, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP; varying vec3 vC, vW;
void main(){
  float h = iP.z, spd = 0.9 + 1.6*fract(h*7.3);
  vec2 lo = vec2(-21.5, -516.0), sz = vec2(43.0, 86.0);
  vec2 q = lo + mod(iP.xy*sz + uWind*uTime*spd + vec2(sin(uTime*0.31 + h*40.0), 0.0)*1.5, sz);
  float edge = smoothstep(0.0, 3.0, q.y - lo.y)*smoothstep(0.0, 3.0, lo.y + sz.y - q.y)*smoothstep(0.0, 1.5, q.x - lo.x)*smoothstep(0.0, 1.5, lo.x + sz.x - q.x)*smoothstep(1.0, 1.6, abs(q.x));
  float hop = abs(sin(uTime*(1.1 + 1.7*fract(h*3.1)) + h*20.0)); hop *= hop; hop *= hop;
  float a = uTime*(1.5 + 3.0*fract(h*5.7))*(0.3 + 0.7*hop) + h*40.0;
  vec3 ax = vec3(cos(a), 0.5*sin(a*0.7), sin(a)), ay = normalize(cross(ax, vec3(0.3, 1.0, 0.2)));
  vec3 wp = vec3(q.x, ${FLOOR_Y.toFixed(1)} + 0.04 + 0.5*hop, q.y) + (ax*position.x + ay*position.y)*iP.w*edge;
  vec3 N = normalize(cross(ax, ay) + vec3(0.0, 1e-4, 0.0)); N.y = abs(N.y);
  vC = mix(vec3(0.62, 0.58, 0.80), vec3(0.86, 0.80, 0.92), fract(h*11.0))*(bsLight(N) + uGold*0.12);
  vW = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vC, vW;
void main(){ gl_FragColor = vec4(bsFog(max(vC, 0.0), length(cameraPosition - vW)), 1.0); }`,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- townsfolk: where they walk, stand and sit
function townsfolk(rng, towers, tiers, rng2) {
  const F = [], PI = Math.PI;
  for (let i = 0; i < 40; i++) {                                    // strolling the avenues beside the canal
    const s = i % 2 ? 1 : -1, x = s * (12.2 + rng() * 6.3), z = -522 - rng() * 176, dir = rng() < 0.5 ? 1 : -1;
    F.push({ x, y: QUAY_Y, z, heading: dir > 0 ? 0 : PI, dx: 0, dz: dir, len: rng() < 0.3 ? 0 : 8 + rng() * 22, phase: rng() * 40, arm: rng() < 0.2 ? 1 : 0 });
  }
  for (const z of BRIDGES) for (let j = 0; j < 4; j++) {            // on the bridges, well out from the middle
    const x = (j % 2 ? 1 : -1) * (11.5 + rng() * 5), q = Math.abs(x) / 21;
    F.push({ x, y: QUAY_Y + 11.4 * (1 - q * q), z: z + (rng() - 0.5) * 1.6, heading: rng() < 0.5 ? 0 : PI, phase: rng() * 40, arm: rng() < 0.35 ? 1 : 0 });
  }
  const LEDGE = { 0: [0.7, 0.96], 2: [0.38, 0.84], 5: [0.84, 0.9] };   // which profiles have a ring balcony, and where
  for (const tw of towers) {
    const led = LEDGE[tw.kind]; if (!led || F.length > 92) continue;
    for (let j = 0; j < 2; j++) { const a = rng() * 6.283, r = tw.r * led[1]; F.push({ x: tw.x + Math.sin(a) * r, y: tw.y + tw.h * led[0], z: tw.z - Math.cos(a) * r, heading: Math.PI - a, phase: rng() * 40, arm: rng() < 0.3 ? 1 : 0 }); }
  }
  for (let i = 0; i < 30; i++) {                                    // seated on the tiers, clear of the aisle
    const row = 1 + rng.int(0, 13), r = tiers.r0 + tiers.dr * (row + 0.55); let a = (rng() - 0.5) * 2.9; if (Math.abs(Math.sin(a) * r) < 14) a = Math.sign(a || 1) * (Math.asin(14 / r) + rng() * 0.3);
    F.push({ x: Math.sin(a) * r, y: QUAY_Y + row + 1 - 0.5, z: BASIN.z - Math.cos(a) * r, heading: -a, phase: rng() * 40, arm: rng() < 0.15 ? 1 : 0 });
  }
  for (const x of [-103, -45, 45, 103]) F.push({ x: x + 1, y: 9.5, z: -375, heading: 0, phase: rng() * 40, arm: 1 });       // on the jetty heads, greeting the fleet
  for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1; F.push({ x: s * (14 + rng() * 190), y: i < 4 ? FLOOR_Y : QUAY_Y, z: -433.5 - rng() * 2, heading: (rng() - 0.5) * 0.8, phase: rng() * 40, arm: rng() < 0.5 ? 1 : 0 }); if (i < 4) F[F.length - 1].x = s * (13 + rng() * 7); }
  for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const a = s * (0.33 + j * 0.06), r = 42.5 + (j % 2) * 1.5; F.push({ x: Math.sin(a) * r, y: QUAY_Y, z: BASIN.z - Math.cos(a) * r, heading: -a, phase: rng() * 40, arm: j === 1 ? 1 : 0 }); }   // by the landing before the portal
  // ---- later additions, from a stream of their own
  const r2 = rng2;
  for (let made = 0; made < 100;) {                                 // the rest of the evening's audience on the tiers, in twos and threes
    const row = 1 + r2.int(0, 16), r = tiers.r0 + tiers.dr * (row + 0.55); let a = (r2() - 0.5) * 2.9; if (Math.abs(Math.sin(a) * r) < 16) a = Math.sign(a || 1) * (Math.asin(16 / r) + r2() * 0.3);
    const group = 1 + r2.int(0, 2);
    for (let j = 0; j < group; j++, made++) { const aj = a + j * 0.95 / r; F.push({ x: Math.sin(aj) * r, y: QUAY_Y + row + 1 - 0.5, z: BASIN.z - Math.cos(aj) * r, heading: -aj + (r2() - 0.5) * 0.5, phase: r2() * 40, arm: r2() < 0.15 ? 1 : 0 }); }
  }
  for (let i = 0; i < 18; i++) {                                    // on the water stairs, coming down to meet the fleet or standing to watch it
    const s = i % 2 ? 1 : -1, st = 1 + r2.int(0, 20), walk = r2() < 0.4;
    F.push({ x: s * (10 + r2() * 6), y: STAIRS.rise * (st + 1), z: stairZ(st) - 0.38, heading: walk ? s * PI / 2 : (r2() - 0.5) * 1.2, dx: s, dz: 0, len: walk ? 2 + r2() * 1.5 : 0, phase: r2() * 40, arm: r2() < 0.4 ? 1 : 0 });
  }
  for (let i = 0; i < 14; i++) {                                    // in the side aisles of the crystal house, between the pillar rows
    const s = i % 2 ? 1 : -1, dir = r2() < 0.5 ? 1 : -1;
    F.push({ x: s * (12.6 + r2() * 4.4), y: FLOOR_Y, z: -447 - r2() * 62, heading: dir > 0 ? 0 : PI, dx: 0, dz: dir, len: r2() < 0.4 ? 0 : 6 + r2() * 12, phase: r2() * 40, arm: r2() < 0.25 ? 1 : 0 });
  }
  return F;
}

// ---------------------------------------------------------------- assembly
export async function makeLife(ctx, SH, town, o = {}) {
  // (o.streams: the world's streams, one per kind of thing; nothing here forks)
  const St = o.streams, rng = St.boats, group = new THREE.Group(), time = SH.uTime, detail = ctx.quality?.detail ?? 1;
  const env = null;
  const water = makeWater(SH, { color: o.water, phases: o.phases }); group.add(water.object);
  await ctx.yield();
  const lamps = makeLamps(SH, lampPlaces(), time, St.moths, o.phases); group.add(lamps.object);
  await ctx.yield();
  const boats = [];
  for (let i = 0; i < (o.boats ?? 9); i++) { const inBasin = i >= (o.boats ?? 9) - 2; boats.push(inBasin ? { x: (i % 2 ? 1 : -1) * (4.6 + rng() * 3.4), z: BASIN.z + 8 - rng() * 28, ph: rng() * 6.283 } : { x: (i % 2 ? 1 : -1) * (4.7 + rng() * 0.6), z: -540 - (i + rng() * 0.6) * (150 / Math.max((o.boats ?? 9) - 2, 1)), ph: rng() * 6.283 }); }
  const fleetB = makeBoats(SH, boats, time, o.phases); group.add(fleetB.object);
  await ctx.yield();
  group.add(makeFountains(SH, St.fountains).object);
  await ctx.yield();
  const house = await makeHouse(ctx, SH, env, { rng: St.house, rng2: St.avenue, sky: o.sky, phases: o.phases }); group.add(house.object);
  await ctx.yield();
  const houseMist = fx.makeMist({ rng: St.houseMist, count: Math.round(26 * detail), area: [38, 3, 64], center: [0, FLOOR_Y + 1.6, -480], size: [6, 12], color: '#b4bcec', opacity: 0.05, drift: [0.25, 0, 0.5], time });
  group.add(houseMist.object);
  group.add(makeArch(SH, o.sky, { y: 17, z: -810.6 }));
  await ctx.yield();
  group.add(makeCreeper(SH, St.creeper, St.creeperWall, St.creeperLeaves));
  await ctx.yield();
  group.add(makeLeaves(SH, St.leaves, Math.round(300 * detail)));
  await ctx.yield();
  // 28 slender trees with silver-lavender crowns in stone tubs: along the avenues, on the forecourt, round the basin, along the top of the tiers
  const spots = [];
  for (const s of [-1, 1]) { for (let k = 0; k < 5; k++) spots.push([s * 15.6, QUAY_Y, -539 - 32 * k]); spots.push([s * 17.5, FLOOR_Y, -440], [s * 13.5, FLOOR_Y, -519.5]); }
  for (let i = 0; i < 6; i++) { const a = (i < 3 ? -1 : 1) * (0.55 + (i % 3) * 0.62), r = 45.2; spots.push([Math.sin(a) * r, QUAY_Y, BASIN.z + Math.cos(a) * r]); }
  for (let i = 0; i < 8; i++) { const a = (i < 4 ? -1 : 1) * (0.32 + (i % 4) * 0.33), r = 78.4; spots.push([Math.sin(a) * r, town.tiers.yTop, BASIN.z - Math.cos(a) * r]); }
  const T = makeAcc(), tubC = k7(lin('#E6E0D6'), 0.7);
  for (const p of spots) lathe(T, [[0.85, 0], [1.05, 0.45], [1.0, 0.85], [0.8, 0.85], [0.8, 0.7]], p[0], p[1], p[2], 10, () => tubC);
  group.add(new THREE.Mesh(finish(T), town.stone));
  await ctx.yield();
  const wind = flora.makeWind({ direction: [SH.uWind.value.x, SH.uWind.value.y], strength: 0.7, speed: 0.8 });
  const matOpt = { wind, backlight: 0.5, backlightTint: '#f0d8f0', ambient: 2.6, leafAmbient: 3.0, emissive: '#8478b8', emissiveIntensity: 0.3 };
  await flora.prepareLeafTexture(matOpt, ctx.yield);
  const tmat = flora.windMaterial(matOpt);
  await ctx.yield();
  const tgeo = [];
  for (let i = 0; i < 3; i++) { tgeo.push(flora.birchGeometry({ rng: [St.treeA, St.treeB, St.treeC][i], height: 6.4 + i * 0.5, detail: 1, leaf: '#b4acd4', leafLight: '#ece4f6', leafDark: '#7a70a8', bark: '#d8d2cc' })); await ctx.yield(); }
  const trees = flora.makeScatter({ rng: St.trees, variants: tgeo, material: tmat, tint: 0.08, hue: 0.02, sink: 0, tilt: 0.02, stretch: 0.1,
    points: spots.map((p, i) => ({ x: p[0], y: p[1] + 0.7, z: p[2], s: 0.95 + 0.2 * ((i * 0.618) % 1), rot: i * 2.4, d: 0, u: 0, v: i })) });
  group.add(trees.object);
  await ctx.yield();
  const folk = makeFigures(SH, townsfolk(St.folk, town.towers, town.tiers, St.folkStairs)); group.add(folk);
  await ctx.yield();
  return {
    object: group, water, env,
    update(dt, t, camera) { lamps.update(dt, t, camera); fleetB.update(dt, t, camera); house.update(dt, t, camera); houseMist.update(dt, t, camera); trees.update(dt, t, camera); },
  };
}
