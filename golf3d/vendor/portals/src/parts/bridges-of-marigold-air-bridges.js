// bridges-of-marigold, the air: THE THREE PETAL BRIDGES (design, section 3; the film's sign).
// Each bridge is a broad arch whose whole body is a bed of marigold petals about 3 m deep under the plan's deck
// line. It is built of three things:
//   THE CORE: a lens-shaped body (heaped top, bellied underside) drawn as a close bed of petals lying over a hot
//     gold glow, brightest along the bridge's middle; its heaps are real relief (up to 0.9 m).
//   THE BED'S PETALS: tens of thousands of single petals (two triangles each, cut to a petal's outline) lying on
//     and standing out of the core's top, ragged past its edges, hanging from the canyon bridge's underside.
//     Density is BY PLACE: thickest where the plan's flown line passes within 45 m of the deck.
//   THE SHED PETALS: streams that leave the edges and drift down and away, tumbling (a medium: they thin by true
//     distance near the lens).
// THE CANYON BRIDGE, the one seen from below, is a BAND OF LOOSE PETALS: its core a third as deep, broadest at the
// middle and narrowing to each end, where it runs 9 m on in under a tower's houses; its rims scalloped; gaps in it
// by place (few along the middle, more toward the rims, where it frays out to nothing), with the sky seen through;
// its petals lying out past the rims and hanging under it, and drawn whole to 62 m from the eye.
// Slow rings of brighter glow travel along each bridge by the world's clock, and lift the petals they pass.
// THE TOPS: the heaps' tops lie 0.5 m under the plan's deck line; a petal stands at most 0.3 m over its heap and a
// passing ring lifts its tip at most 0.2 m more: within LOD metres of the eye nothing of the bed stands over the
// plan's deck line, so the bed lies 6 m and more under the flown line wherever the plan's deck does. (A far petal,
// grown to cover for those not drawn, may stand 0.4 m over that line at the most; it is LOD metres and more away.)
// LEVEL OF DETAIL (the one thing here that reads the eye, as the laws allow): the bed's petals are kept in chunks
// along each bridge; a chunk out of the picture is not drawn, and a far chunk draws a share of its petals (each
// petal has a rank; the share falls with the eye's distance, and a petal shrinks away before its rank is cut, so
// nothing pops). Shares, never places: every petal stands where the seed put it.
import { GREAT_BRIDGE, HIGH_BRIDGE, CANYON_BRIDGE, greatDeck, highDeck, canyonBridge, routeDistance, MIST } from './bridges-of-marigold-plan.js';
import { CANYON_LINE, NOISE, PETAL, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';

export const TOP_UNDER = 0.5;          // the heaps' highest tops lie this far under the plan's deck line
export const PETAL_STAND = 0.30;       // a petal's highest point over the heap it lies on, at most

// The three bridges, each as a straight line on the ground plan: start (x, z), unit heading (dx, dz), length L in
// metres from a = 0, the deck height at a, the width, and how far the bed runs on past each end (into the mist, or
// in under a terrace's edge).
export function layBridges() {
  const g = GREAT_BRIDGE, h = HIGH_BRIDGE, c = CANYON_BRIDGE, cl = CANYON_LINE;
  return [
    { name: 'great', x: g.x, z: g.z0, dx: 0, dz: -1, L: g.z0 - g.z1, w: g.width, pre: 14, post: 0, deck: (a) => greatDeck(g.z0 - a), rings: 3, ringSpeed: 4.6, under: false },
    { name: 'high', x: h.x, z: h.z0, dx: 0, dz: 1, L: h.z1 - h.z0, w: h.width, pre: 0, post: 12, deck: (a) => highDeck(h.z0 + a), rings: 3, ringSpeed: -4.2, under: false },
    { name: 'canyon', x: cl.x0, z: cl.z0, dx: (cl.x1 - cl.x0) / cl.length, dz: (cl.z1 - cl.z0) / cl.length, L: cl.length, w: c.width, pre: 9, post: 9,
      deck: (a) => canyonBridge(Math.min(1, Math.max(0, a / cl.length)))[1], rings: 1, ringSpeed: 3.4, under: true },
  ];
}

// The bed's shape. noise is a seeded simplex (n2). For a place of bridge b (a metres along, c metres across):
//   half(a)        the core's half width there (ragged along its length)
//   heap(a, c)     0..1, how high the heap stands there
//   top(a, c)      the height of the core's top;  bottom(a, c)  the height of its underside
export function bedShape(b, noise, salt) {
  // (the canyon bridge, the one seen from below, is a band of loose petals: broadest at its middle, narrowing to
  // each end where it runs in under a tower's houses, its rims scalloped deep, its body a third as deep)
  const span = (a) => { const t = (a + b.pre) / (b.L + b.pre + b.post) * 2 - 1; return 0.5 + 0.5 * Math.pow(Math.max(0, 1 - t * t), 0.55); };
  const half = b.under
    ? (a) => b.w / 2 * span(a) * (0.9 + 0.2 * noise.n2(a / 9 + salt, 3.3) + 0.13 * noise.n2(a / 2.7 + salt, 7.1))
    : (a) => b.w / 2 * (0.9 + 0.075 * noise.n2(a / 9 + salt, 3.3) + 0.045 * noise.n2(a / 2.7 + salt, 7.1));
  const deep = b.under ? 1.0 : 2.6;
  const heap = (a, c) => Math.min(1, Math.max(0, 0.5 + 0.42 * noise.n2(a / 4.6 + salt, c / 3.9) + 0.2 * noise.n2(a / 1.5 + 9.2, c / 1.3 + salt)));
  const edge = (a, c) => Math.min(1.35, Math.abs(c) / half(a));
  const top = (a, c) => { const e = edge(a, c); return b.deck(a) - TOP_UNDER - 0.62 * (1 - heap(a, c)) - 0.95 * e * e * e * e; };
  const bottom = (a, c) => { const e = Math.min(1, edge(a, c)); return top(a, c) - 0.15 - deep * Math.pow(1 - e * e, 0.6); };
  const point = (a, c, y) => [b.x + b.dx * a - b.dz * c, y, b.z + b.dz * a + b.dx * c];
  // how thick the bed's petals lie at a (petals per square metre), by the plan's flown line
  const dense = (a, near, far) => { const p = point(a, 0, b.deck(a)), d = routeDistance(p[0], p[1], p[2]), k = Math.min(1, Math.max(0, (75 - d) / 30)); return far + (near - far) * k * k * (3 - 2 * k); };
  return { half, heap, edge, top, bottom, point, dense, mistTop: MIST };
}

// ---------------------------------------------------------------- shaders
// The rings of brighter glow: uRing = (length of a ring's course in metres, metres a second, how many, phase).
// A ring is a circle of light 6 m wide on the bed with a smaller one inside it, its middle on the bridge's middle
// line; it enters 20 m before the bed's first metre and leaves 20 m after its last.
const RINGS = /* glsl */`
uniform vec4 uRing; uniform float uTime;
float mgRings(vec2 q){
  float s = 0.;
  for(int k = 0; k < 3; k++){
    float on = step(float(k) + 0.5, uRing.z);
    float ar = mod(uTime*uRing.y + uRing.w + uRing.x*float(k)/max(uRing.z, 1.), uRing.x) - 20.;
    float d = length(q - vec2(ar, 0.)), x0 = (d - 6.0)/1.1, x1 = (d - 3.1)/0.8;
    s += on*(exp(-x0*x0) + 0.55*exp(-x1*x1));
  }
  return s; }
`;
const CORE_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec4 aBed; attribute float aHeap; varying vec4 vBed; varying float vHeap;
void main(){ vBed = aBed; vHeap = aHeap; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
// The core's skin: two petals dealt to every cell of the bed (the topmost one that covers a place is seen), over
// the hot gold of the glow between them. Far off, where a pixel covers more than a cell, the bed is its own mean.
const CORE_FRAG = /* glsl */`
${NOISE}${PETAL}${RINGS}${FOG_FRAG_PARS}
uniform vec3 uHot; uniform float uCell, uGain, uHoles; varying vec4 vBed; varying float vHeap;
void main(){
  // (a band of loose petals has gaps, by place on the bed: few along its middle, more and more toward its rims, where it frays out)
  // (the footprint is taken first: no derivative is asked for after a fragment has been thrown away)
  vec2 q = vBed.xy/uCell; vec2 fw = fwidth(q); float foot = max(fw.x, fw.y);
  float gap = 0.62*vnoise(vBed.xy*0.5 + 3.1) + 0.38*vnoise(vBed.xy*1.6 + 11.), fray = abs(vBed.z);
  if(uHoles > 0.5 && gap < 0.24 + 0.5*fray*fray*fray) discard;
  vec2 ci = floor(q), cf = fract(q); float best = -1., rim = 0., hue = 0.;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++) for(int n = 0; n < 2; n++){
    vec2 g = vec2(float(i), float(j)), id = ci + g + float(n)*37.7;
    vec2 r2 = hash22(id + 3.7); float ang = hash12(id*1.31 + 7.9)*6.2832, hgt = hash12(id + 21.3);
    vec2 d = cf - (g + 0.15 + 0.7*r2); float cs = cos(ang), sn = sin(ang);
    vec2 l = vec2(cs*d.x + sn*d.y, -sn*d.x + cs*d.y);
    float s = mgPetal(vec2(l.x/0.5, l.y/1.25 + 0.5));
    if(s > 0. && hgt > best){ best = hgt; rim = s; hue = hash12(id + 5.5); }
  }
  float mid = clamp(1. - vBed.z*vBed.z, 0., 1.), prof = 0.36 + 0.72*mid*sqrt(mid);
  vec3 petal = mgPetalHue(hue)*(0.60 + 0.34*best)*(1.3 - 0.5*smoothstep(0.0, 0.2, rim));
  vec3 col = best < 0. ? uHot : petal;
  col = mix(col, mgPetalHue(0.5)*0.8 + uHot*0.1, smoothstep(0.3, 1.0, foot));
  col *= prof*(1.2 - 0.42*vHeap)*(1. + 1.1*mgRings(vBed.xy))*uGain*(vBed.w < 0. ? 1.15 : 1.);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;
// One petal of the bed: a square cut to the petal's outline, laid by its own yaw, pitch and roll.
//   aP (x, y, z, length)   aO (yaw, pitch, roll, rank)   aD (hue, metres across, metres along, how high in the heap)
const PETAL_VERT = /* glsl */`
${FOG_VERT_PARS}${RINGS}
attribute vec4 aP, aO, aD; uniform float uLod, uHalf, uGain; varying vec2 vQ; varying float vHue, vShade;
void main(){
  vec3 c = aP.xyz; float dist = max(length(c - cameraPosition), 1e-3);
  float f = dist <= uLod ? 1. : pow(uLod/dist, 1.6);
  float keep = clamp((f - aO.w)/(0.2*f + 0.01), 0., 1.), grow = min(pow(1./f, 0.3), 2.2);
  float ring = mgRings(aD.zy);
  float yaw = aO.x, pit = aO.y + 0.55*ring*(0.4 + 0.6*aD.w) + 0.07*sin(uTime*1.9 + aD.x*40.)*aD.w, rol = aO.z;
  vec3 Y = vec3(cos(yaw), 0., sin(yaw)), X = vec3(-Y.z, 0., Y.x), N = vec3(0., 1., 0.);
  vec3 Yp = Y*cos(pit) + N*sin(pit), Np = N*cos(pit) - Y*sin(pit), Xp = X*cos(rol) + Np*sin(rol);
  float len = aP.w*keep*grow;
  vec3 w = c + Xp*(position.x*len*0.66) + Yp*((position.y - 0.4)*len);
  vQ = vec2(position.x*2., position.y); vHue = aD.x;
  float e = aD.y/uHalf, mid = clamp(1. - e*e, 0., 1.);
  vShade = (0.36 + 0.72*mid*sqrt(mid))*(1.12 - 0.34*aD.w)*(0.78 + 0.4*fract(aD.x*7.31))*(1. + 1.1*ring)*uGain;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const PETAL_FRAG = /* glsl */`
${PETAL}${FOG_FRAG_PARS}
varying vec2 vQ; varying float vHue, vShade;
void main(){
  float s = mgPetal(vQ);
  vec3 col = mgPetalHue(vHue)*(1.32 - 0.5*smoothstep(0., 0.22, s))*(0.82 + 0.3*vQ.y)*(1. - 0.14*exp(-abs(vQ.x)*14.))*vShade;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
  if(s < 0.) discard;
}`;

// ---------------------------------------------------------------- the core's mesh: top and underside as two grids
// Rows stand 1.25 m apart where the bed's petals lie thick (where the flight passes near), 3 m apart elsewhere.
function coreGeometry(THREE, b, sh) {
  const rows = []; for (let a = -b.pre; a < b.L + b.post; a += sh.dense(a, 1, 0) > 0.5 ? 1.5 : 3) rows.push(a); rows.push(b.L + b.post);
  const pos = [], bed = [], heap = [], idx = [];
  const endK = (a) => { const t = Math.min(a + b.pre, b.L + b.post - a) / 4; return 0.55 + 0.45 * Math.min(1, Math.max(0, t)); };
  const grid = (cols, side) => {
    const base = pos.length / 3;
    for (const a of rows) for (let j = 0; j <= cols; j++) {
      const e = (j / cols) * 2 - 1, c = e * sh.half(a) * endK(a), y = side > 0 ? sh.top(a, c) : sh.bottom(a, c), p = sh.point(a, c, y);
      pos.push(p[0], p[1], p[2]); bed.push(a, c, e, side); heap.push(side > 0 ? sh.heap(a, c) : 0.5);
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < cols; j++) {
      const p0 = base + i * (cols + 1) + j, p1 = p0 + 1, p2 = p0 + cols + 1, p3 = p2 + 1;
      if (side > 0) idx.push(p0, p1, p2, p1, p3, p2); else idx.push(p0, p2, p1, p1, p2, p3);
    }
  };
  grid(14, 1); grid(b.under ? 8 : 5, -1);         // (only the canyon bridge's underside is ever seen near)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBed', new THREE.Float32BufferAttribute(bed, 4));
  g.setAttribute('aHeap', new THREE.Float32BufferAttribute(heap, 1)); g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- the bed's petals, dealt in chunks along a bridge
// Every die of a petal is cast before anything is worked out from it. Returns the chunk's three attribute arrays.
function dealChunk(b, sh, rng, a0, a1, perM2, underPerM2) {
  const area = (a1 - a0) * b.w * 1.16, n = Math.round(area * (perM2 + underPerM2)), share = underPerM2 / (perM2 + underPerM2);
  const P = new Float32Array(n * 4), O = new Float32Array(n * 4), D = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const ra = rng(), rc = rng(), lie = rng(), stand = rng(), yaw0 = rng(), roll = rng(), rl = rng(), hue = rng(), up = rng(), ru = rng();
    const a = a0 + ra * (a1 - a0), ce = b.under ? Math.sign(rc - 0.5) * Math.pow(Math.abs(rc * 2 - 1), 0.75) * 1.34 : (rc * 2 - 1) * 1.16, c = ce * sh.half(a), e = Math.abs(ce), len = 0.38 + 0.32 * rl, under = ru < share;
    let y, pit, yaw = yaw0 * Math.PI * 2, lift = up * up * 0.6;
    if (under) { y = sh.bottom(a, Math.min(1, e) * Math.sign(ce) * sh.half(a)) - 0.04; pit = -(0.7 + 0.8 * lie); lift = 0.3; }
    else {
      y = sh.top(a, c) + 0.03 + lift * PETAL_STAND * 0.6;
      if (e > 0.92) { pit = -(0.25 + 0.95 * lie); yaw = Math.atan2(b.dx * Math.sign(ce), -b.dz * Math.sign(ce)) + (yaw0 - 0.5) * 1.4; }   // the ragged edge: tips droop outward
      else {
        pit = stand < 0.16 ? 0.5 + 0.7 * lie : 0.04 + 0.3 * lie * lie;
        const room = PETAL_STAND - 0.03 - lift * PETAL_STAND * 0.6;                    // keep the tip under the standing height
        pit = Math.min(pit, Math.asin(Math.min(1, room / (0.6 * len))));
      }
    }
    const p = sh.point(a, c, y);
    P[i * 4] = p[0]; P[i * 4 + 1] = p[1]; P[i * 4 + 2] = p[2]; P[i * 4 + 3] = len;
    O[i * 4] = yaw; O[i * 4 + 1] = pit; O[i * 4 + 2] = (roll - 0.5) * 0.8; O[i * 4 + 3] = (i + 0.5) / n;   // rank: the order dealt
    D[i * 4] = hue; D[i * 4 + 1] = c; D[i * 4 + 2] = a; D[i * 4 + 3] = lift;
  }
  return { n, P, O, D };
}

const LOD = 28;                        // metres from the eye within which a chunk draws every petal
const LOD_UNDER = 62;                  // the same for the canyon bridge, which is looked at from below from far off
export async function buildBridges(ctx, o) {
  const { THREE, look, U, S } = o, group = new THREE.Group(), made = [], chunks = [];
  const noise = S.heaps;                                             // (the heaps' own seeded noise field)
  const hot = look.glow.clone().lerp(new THREE.Color('#ffb648'), 0.5).multiplyScalar(1.45);
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0); made.push(quad);          // x -0.5..0.5, y 0..1
  const bridges = layBridges(), shapes = [];
  let triangles = 0, coreTris = 0;
  for (let k = 0; k < bridges.length; k++) {
    const b = bridges[k], sh = bedShape(b, noise, 11.7 * (k + 1)); shapes.push(sh);
    const span = b.L + b.pre + b.post + 40;
    const ring = { value: new THREE.Vector4(span, b.ringSpeed, b.rings, S.rings() * span) };
    // the core
    const cg = coreGeometry(THREE, b, sh); made.push(cg);
    const cm = new THREE.ShaderMaterial({ fog: true, vertexShader: CORE_VERT, fragmentShader: CORE_FRAG,
      uniforms: { ...fogUniforms(), uTime: U.uTime, uRing: ring, uHot: { value: hot }, uCell: { value: 0.42 }, uGain: { value: 0.8 }, uHoles: { value: b.under ? 1 : 0 } } });
    made.push(cm);
    const core = new THREE.Mesh(cg, cm); group.add(core); coreTris += cg.index.count / 3;
    await ctx.yield();
    // the bed's petals, chunk by chunk
    const pm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: PETAL_VERT, fragmentShader: PETAL_FRAG,
      uniforms: { ...fogUniforms(), uTime: U.uTime, uRing: ring, uLod: { value: b.under ? LOD_UNDER : LOD }, uHalf: { value: b.w / 2 }, uGain: { value: 0.84 } } });
    made.push(pm);
    let a = -b.pre;
    while (a < b.L + b.post - 0.01) {
      const near = sh.dense(a + 6, 1, 0), len = near > 0.5 ? 12.5 : 45, a1 = Math.min(b.L + b.post, a + len);
      const per = (b.under ? 4.6 : 2.6 + 7.4 * sh.dense((a + a1) / 2, 1, 0)) * Math.min(1, 0.4 + 0.6 * look.detail);
      const c = dealChunk(b, sh, S.bed, a, a1, per, b.under ? per : 0);
      const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(c.P, 4)); g.setAttribute('aO', new THREE.InstancedBufferAttribute(c.O, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(c.D, 4));
      g.instanceCount = c.n;
      const am = (a + a1) / 2, mid = sh.point(am, 0, b.deck(am) - 1.5), rad = Math.hypot((a1 - a) / 2, b.w * 0.62) + 4 + Math.abs(b.deck(a) - b.deck(a1)) / 2;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(mid[0], mid[1], mid[2]), rad);
      made.push(g);
      const m = new THREE.Mesh(g, pm); group.add(m); chunks.push({ g, n: c.n, at: g.boundingSphere.center, rad, lod: b.under ? LOD_UNDER : LOD });
      a = a1;
      await ctx.yield();
    }
  }
  const eye = new THREE.Vector3();
  return {
    object: group, bridges, shapes, drawCalls: bridges.length + chunks.length,
    get triangles() { return coreTris + triangles; },
    update(dt, time, camera) {
      eye.setFromMatrixPosition(camera.matrixWorld); triangles = 0;
      for (const c of chunks) {
        const d = Math.max(0, eye.distanceTo(c.at) - c.rad), f = d <= c.lod ? 1 : Math.pow(c.lod / d, 1.6);
        c.g.instanceCount = Math.min(c.n, Math.ceil(c.n * f + 1));
        triangles += c.g.instanceCount * 2;
      }
    },
    dispose() { for (const x of made) x.dispose(); },
  };
}
