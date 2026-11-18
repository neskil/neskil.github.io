// THE WISTERIA STACK: a five-deck motorway interchange a century after people, every parapet trailing lilac
// wisteria, ribbon waterfalls from scuppers and broken joints, a bead curtain of water across the fly line.
// Own frame: origin at the water under the portal seat, +Y up, front +Z (the arrival comes down +Z toward 0).
// Exports: buildHero(ctx, opts) with opts { rng, density, light, fallLight, concrete, sunLocal, litAt(x, y, z), tintAt(x, y, z), mixed,
//   flora: { material } | false }; it returns { object, anchors, piers, fallList, wisteria, falls, update, ... }.
// DECKS, deckShade(x, y, z, sun) and deckUniforms() give the world the same closed-form deck shadow on the CPU and in GLSL;
// makeFallSet(items, light) draws wall sheets (kind 0), mist (1), the bead veil (2), drizzle off a deck's edge (7: ragged curtains), stepped cascades (3: an
// escalator's treads; 8: mossed ledges 1.5 m high; both are braids of white water over a glassy sheet on wet stone), free columns of falling
// water (4: turned to the eye about the vertical only, thrown clear of the lip, torn into strands), rings on the pond (5) and crowns
// of spray at a fall's foot (6), each item with its own share of sunlight (lit); makeWisteria(inst, light) takes a second colour cast (phase + 1) and a sunlight share per card.
// makeNearDeer(o) is the near herd: smooth-skinned spotted sika (stags in velvet) posed in the vertex shader, with their mirror copies,
//   shadows, wakes, hoof splashes and widening hoof rings; the world places each animal every frame with set(i, x, y, z, heading, pitch,
//   air, stand, rack) and commit(): stand 1 poses the animal standing (legs under it, head up and lifting, tail flicking), rack scales a
//   stag's antlers up (the stag on the world's bridge end). Option rimK scales the rim light (moonlit herds); in shade the coat stays
//   chestnut and spots and rump are shaded with it (one colour response with the kit herd beside it).
// The view glides between the decks and sees the lower ones from above, so the carriageways are dressed: old asphalt with ghosts of lane paint, shrubs and ferns along the
//   kerbs (drawn from their own generator, 'deck-tops:' + seed, so the stack's layout is as it was), no lamp masts or tall plants under
//   the view's line. addFall(deck, t, side, width, r, pad): a negative pad places a fall by hand, clear of the fly line by -pad metres;
//   every fall leaves a broken notch in the parapet over a short chute ('fall-chutes') and lands in mist, rings and a crown of spray.
// Wisteria cards near the eye (within 60 m) show florets in staggered rows and leaf sprays with a ragged outline; cards more than 110 m
//   off the fly line are a second mesh of one-row cards sharing the material (makeWisteria(inst, light, { rows, share })).
//   flyX(z) and deckPoint(d, t, out) are exported so that the world can dress the deck tops along the fly line.
import * as THREE from 'three';
import * as flora from '../kit/flora.js';
import { makeRng } from '../kit/core.js';

const TAU = Math.PI * 2;
export const FLY = [[60, 3, 390], [34, 3, 333], [15, 3, 273], [4, 3, 212], [0, 3, 150], [0, 3, 0]];
export function flyX(z) {
  if (z <= 150) return 0;
  for (let i = 0; i < 4; i++) {
    const a = FLY[i], b = FLY[i + 1];
    if (z <= a[2] && z >= b[2]) return b[0] + (a[0] - b[0]) * (z - b[2]) / (a[2] - b[2]);
  }
  return 60 + (z - 390) * 0.45;
}
// soffit height, width, and three plan points (x, z) the centre line passes through at t = 0, 0.5, 1
const DECKS = [
  { y: 13, w: 26, a: [-300, 4], m: [0, 4], b: [300, 4], len: [3.2, 6.4] },
  { y: 21, w: 22, a: [-300, -10], m: [0, 85], b: [300, 240], len: [4.5, 9] },
  { y: 29, w: 24, a: [-300, 260], m: [0, 150], b: [300, 120], len: [4.5, 9] },
  { y: 37, w: 24, a: [-300, 420], m: [18, 285], b: [300, 200], len: [4.5, 9] },
  { y: 45, w: 22, a: [-300, 150], m: [4, 215], b: [300, 330], len: [4.5, 9] },
];
export function deckPoint(d, t, out) {
  const cx = 2 * d.m[0] - (d.a[0] + d.b[0]) / 2, cz = 2 * d.m[1] - (d.a[1] + d.b[1]) / 2, k = 1 - t;
  out.x = k * k * d.a[0] + 2 * t * k * cx + t * t * d.b[0];
  out.z = k * k * d.a[1] + 2 * t * k * cz + t * t * d.b[1];
  let tx = 2 * k * (cx - d.a[0]) + 2 * t * (d.b[0] - cx), tz = 2 * k * (cz - d.a[1]) + 2 * t * (d.b[1] - cz);
  const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  out.tx = tx; out.tz = tz; out.nx = -tz; out.nz = tx;      // n: +Z-ish side for decks running along +X
  return out;
}
export { DECKS };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// distance in plan from a point of the stack frame to a deck's centre line (closed form; the world's GLSL twin is deckDist)
export function deckDist(d, x, z) {
  const c = 2 * d.m[0], cz = 2 * d.m[1] - (d.a[1] + d.b[1]) / 2, xs = Math.min(600, Math.max(0, x + 300));
  const t = xs / ((c + 300) + Math.sqrt(Math.max((c + 300) * (c + 300) - 2 * c * xs, 1))), k = 1 - t;
  const zc = k * k * d.a[1] + 2 * t * k * cz + t * t * d.b[1], dz = 2 * k * (cz - d.a[1]) + 2 * t * (d.b[1] - cz), dx = 2 * k * (c + 300) + 2 * t * (300 - c);
  return Math.abs(z - zc) * dx / Math.hypot(dx, dz) + Math.max(Math.abs(x) - 300, 0);
}
// share of sunlight (0..1) that reaches a point of the stack frame past the five decks; sun = unit vector toward the sun, same frame
export function deckShade(x, y, z, sun) {
  let s = 1;
  for (const d of DECKS) {
    const dy = d.y + 1.2 - y; if (dy < 0.6) continue;
    const k = dy / Math.max(sun[1], 0.08), soft = 1 + dy * 0.06;
    s *= 1 - 0.92 * (1 - sm(d.w / 2 - soft, d.w / 2 + soft, deckDist(d, x + sun[0] * k, z + sun[2] * k))) * sm(0.6, 2.6, dy);
  }
  return s;
}
// the decks as two vec4 per deck for the world's shaders: (a.z, control z, b.z, control x) and (soffit y, half width, 0, 0)
export function deckUniforms() {
  return { a: DECKS.map((d) => new THREE.Vector4(d.a[1], 2 * d.m[1] - (d.a[1] + d.b[1]) / 2, d.b[1], 2 * d.m[0])), b: DECKS.map((d) => new THREE.Vector4(d.y, d.w / 2, 0, 0)) };
}

// ---------- tiny vertex-colour geometry builder ----------
export class GB {
  constructor() { this.p = []; this.c = []; }
  quad(a, b, c, d, col, col2) {
    const p = this.p, k = this.c, e = col2 || col;
    p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    k.push(col.r, col.g, col.b, col.r, col.g, col.b, e.r, e.g, e.b, col.r, col.g, col.b, e.r, e.g, e.b, e.r, e.g, e.b);
  }
  // box with axes: u = (ux, uz) horizontal unit vector, v = perpendicular; half sizes hu, hv; y0..y1
  box(cx, cz, ux, uz, hu, hv, y0, y1, side, top, bottom) {
    const vx = -uz, vz = ux;
    const P = (su, sv, y) => [cx + ux * hu * su + vx * hv * sv, y, cz + uz * hu * su + vz * hv * sv];
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4];
      this.quad(P(a[0], a[1], y0), P(b[0], b[1], y0), P(b[0], b[1], y1), P(a[0], a[1], y1), bottom || side, side);
    }
    this.quad(P(-1, -1, y1), P(1, -1, y1), P(1, 1, y1), P(-1, 1, y1), top || side);
    if (bottom) this.quad(P(-1, -1, y0), P(1, -1, y0), P(1, 1, y0), P(-1, 1, y0), bottom);
  }
  // box between two points in space (a beam): half width hw (horizontal), depth h hanging below the line
  beam(a, b, hw, h, side, top) {
    const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw;
    const A = [a[0] - nx, a[1], a[2] - nz], B = [a[0] + nx, a[1], a[2] + nz], C = [b[0] + nx, b[1], b[2] + nz], D = [b[0] - nx, b[1], b[2] - nz];
    const lo = (p) => [p[0], p[1] - h, p[2]];
    this.quad(A, B, C, D, top || side);
    this.quad(lo(A), lo(B), lo(C), lo(D), side);
    this.quad(A, D, lo(D), lo(A), side); this.quad(B, C, lo(C), lo(B), side);
    this.quad(A, B, lo(B), lo(A), side); this.quad(D, C, lo(C), lo(D), side);
  }
  prism(cx, cz, ux, uz, ru, rv, y0, y1, c0, c1, sides = 8) {
    const vx = -uz, vz = ux;
    for (let i = 0; i < sides; i++) {
      const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU;
      const x0 = cx + ux * Math.cos(a0) * ru + vx * Math.sin(a0) * rv, z0 = cz + uz * Math.cos(a0) * ru + vz * Math.sin(a0) * rv;
      const x1 = cx + ux * Math.cos(a1) * ru + vx * Math.sin(a1) * rv, z1 = cz + uz * Math.cos(a1) * ru + vz * Math.sin(a1) * rv;
      this.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], c0, c1);
    }
  }
  cone(cx, y0, cz, r, h, col, tip) {
    for (let i = 0; i < 5; i++) {
      const a0 = i / 5 * TAU, a1 = (i + 1) / 5 * TAU;
      this.quad([cx + Math.cos(a0) * r, y0, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y0, cz + Math.sin(a1) * r], [cx, y0 + h, cz], [cx, y0 + h, cz], col, tip || col);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeVertexNormals();
    return g;
  }
}

const GLSL_N = /* glsl */`
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
`;

// ---------- falling water: sheets on a wall (kind 0), foot mist billboards (kind 1), bead veil (kind 2), stepped cascade (kind 3),
// free-falling columns that turn about the vertical to face the eye (kind 4: width at the lip, height), rings on the water round a
// foot (kind 5: width = radius) and the crown of spray thrown up there (kind 6: width, height) ----------
// item: { top: [x, y, z], width, height, yaw, kind, phase, lit }   lit: share of sunlight on it (0..1, default 1)
export function makeFallSet(items, light = {}) {
  const base = new THREE.PlaneGeometry(1, 1, 1, 10); base.translate(0, -0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position')); g.setAttribute('uv', base.getAttribute('uv'));
  const n = items.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), Cc = new Float32Array(n);
  items.forEach((it, i) => {
    A.set([it.top[0], it.top[1], it.top[2], it.width], i * 4);
    B.set([it.height, it.yaw || 0, it.kind || 0, it.phase ?? (i * 0.37)], i * 4);
    Cc[i] = it.lit ?? 1;
  });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(Cc, 1));
  g.instanceCount = n;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uLit: { value: new THREE.Color(light.lit || '#fff4dc').multiplyScalar(light.gain || 1.5) },
    uShade: { value: new THREE.Color(light.shade || '#8fa0c0').multiplyScalar(light.shadeK ?? 0.75) }, uFade: { value: 1 }, uPulse: { value: 0 }, uVeil: { value: light.veil ?? 1 }, uDrizzle: { value: light.drizzle ?? 1 },
  }]);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute float iC; uniform float uTime, uPulse;
      varying vec2 vUv; varying vec4 vP; varying float vLit; varying vec3 vWp; varying float vXm;
      #include <fog_pars_vertex>
      void main(){
        float kind = iB.z, w = iA.w, h = iB.x; vUv = uv; vP = vec4(w, h, kind, iB.w); vLit = iC;
        float v = -position.y;                         // 0 at the lip, 1 at the foot
        vXm = position.x * w * (kind < 0.5 ? (1.0 + 0.5 * v) : 1.0);   // metres across the sheet from its centre line: linear over the mesh, where uv.x is not once the sheet flares
        vec3 right = vec3(cos(iB.y), 0.0, -sin(iB.y)), outw = vec3(sin(iB.y), 0.0, cos(iB.y));
        vec3 wp;
        vec4 mvPosition;
        if (kind > 7.5) {
          wp = iA.xyz + right * (position.x * w) + outw * (v * h * 0.3667) + vec3(0.0, -v * h, 0.0);      // a cascade down ledges 1.5 m high and 0.55 m deep
          mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        } else if (kind > 6.5) {
          wp = iA.xyz + right * (position.x * w) + vec3(0.0, -v * h, 0.0);          // drizzle off a deck's edge: a plain hanging sheet
          mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        } else if (kind > 3.5) {
          // what falls free of a wall is a column: its card turns about the vertical axis to face the eye and never leans
          vec3 camL = (cameraPosition - modelMatrix[3].xyz) * mat3(modelMatrix);
          vec2 dc = camL.xz - iA.xz; dc /= max(length(dc), 1e-3); vec3 rc = vec3(dc.y, 0.0, -dc.x);
          if (kind < 4.5) {
            float flare = 1.0 + 0.6 * v; vXm = position.x * w * flare;
            float thrown = (0.3 + 0.2 * sqrt(max(h, 0.0))) * sqrt(max(v, 0.0)) + sin(uTime * 0.6 + iB.w * 9.0 + v * 2.0) * 0.006 * h * v * v;
            wp = iA.xyz + rc * vXm + outw * thrown + vec3(0.0, -v * h, 0.0);
          } else if (kind < 5.5) {
            wp = iA.xyz + vec3(position.x * 2.0 * w, 0.0, (position.y + 0.5) * 2.0 * w);        // rings lying on the pond round a fall's foot
          } else {
            float pulse = iB.w > 50.0 ? (0.5 + 0.5 * sin(uTime * 1.3 + iB.w)) : 1.0;            // the crown of spray thrown up at a foot (a phase above 50: a trunk shower that comes and goes)
            wp = iA.xyz + rc * (position.x * w) + vec3(0.0, (position.y + 1.0) * h * pulse, 0.0);
          }
          mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        } else if (kind > 0.5 && kind < 1.5) {                // mist puff at the foot, camera facing; a phase above 50 marks a puff that pulses (a trunk shower)
          float pulse = iB.w > 50.0 ? (0.55 + 0.45 * sin(uTime * 1.3 + iB.w)) : 1.0;
          vec3 c = iA.xyz + vec3(0.0, w * 0.32 * pulse, 0.0);
          mvPosition = viewMatrix * modelMatrix * vec4(c, 1.0);
          float s = w * (1.0 + 0.12 * sin(uTime * 0.7 + iB.w * 5.0)) * mix(0.6, 1.0, pulse) * mix(1.0, 0.62, smoothstep(10.0, 26.0, cameraPosition.y));   // seen from the air a foot's mist is a boil of spray, not a wide disc
          mvPosition.xy += vec2(position.x, position.y + 0.5) * s;
          wp = c;
        } else {
          float sway = sin(uTime * 0.6 + iB.w * 9.0 + v * 2.0) * 0.012 * h * v * v;
          float arc = kind < 0.5 ? (mix(0.03, 0.25, smoothstep(10.0, 24.0, h)) + 1.6 * sqrt(max(v, 0.0)) + 0.02 * h * v) : 0.0;   // a short sheet leaves its lip at the wall
          float flare = kind < 0.5 ? (1.0 + 0.5 * v) : 1.0;
          wp = iA.xyz + right * (position.x * w * flare + sway) + outw * arc + vec3(0.0, -v * h, 0.0);
          if (kind > 2.5) wp = iA.xyz + right * (position.x * w) + outw * (v * iB.w) + vec3(0.0, -v * h, 0.0);      // (kinds above 3.5 never get here)
          mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        }
        vWp = (modelMatrix * vec4(wp, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFade, uVeil, uDrizzle; uniform vec3 uLit, uShade; varying vec2 vUv; varying vec4 vP; varying float vLit; varying vec3 vWp; varying float vXm;
      ${GLSL_N}
      #include <fog_pars_fragment>
      void main(){
        float w = vP.x, h = vP.y, kind = vP.z, ph = vP.w, v = 1.0 - vUv.y, a; vec3 col = uLit;
        vec3 lit = mix(uShade, uLit, 0.12 + 0.88 * vLit);
        if (kind > 7.5 || (kind > 2.5 && kind < 3.5)) {
          // A CASCADE OVER STEPS (kind 3: an escalator's 0.4 m treads; kind 8: mossed ledges 1.5 m high). Dark wet stone shows through a
          // thin glassy sheet; white water only where it goes over a lip and where it lands, in runs of uneven width and reach that
          // wander, break, join and part round bare stone: never a ruled stripe, never a white pane.
          float led = step(7.5, kind), stepH = mix(0.4, 1.5, led), steps = max(floor(h / stepH), 1.0), xm = vUv.x * w, sd = fract(ph * 0.618) * 53.0 + w * 3.0;
          float wob = (vn(vec2(xm * 0.5 + sd, 2.0)) - 0.5) * mix(1.1, 0.8, led) + (vn(vec2(xm * 2.1 + sd, 9.0)) - 0.5) * mix(0.45, 0.3, led);
          float sv = v * steps + wob, st = fract(sv), row = floor(sv), ym = v * h;
          // (round 15, second pass) the white water runs in BRAIDS that wander a metre or two sideways on their way down, join and part,
          // with a glassy sheet of moving water over the wet stone between them; the steps only swell and thin the foam, they never rule
          // it into stripes; the sides of a run are ragged; nothing in it is finer than a hand's width, so it never sparkles into a barcode
          float wx = xm + (vn(vec2(ym * 0.22 + sd, 4.0)) - 0.5) * 2.8 + (vn(vec2(ym * 0.9 + sd, 11.0)) - 0.5) * 0.7;
          float sdw = sd + (vWp.x - xm) * 1.37;                                                        // (each fall its own braids, wherever it stands)
          float run = smoothstep(0.4, 0.66, vn(vec2(wx * 0.55 + sdw, ym * 0.06 + sd)) * 0.6 + vn(vec2(wx * 1.7 + sdw * 2.0, ym * 0.21)) * 0.4 + 0.05);
          float n1 = vn(vec2(xm * 2.4 + sd, sv * 0.7 - uTime * 2.2)), n2 = vn(vec2(xm * 3.6 + sd, ym * 1.1 - uTime * 3.0 + row * 3.1));
          float n3 = vn(vec2(xm * 8.5 + sd, ym * 2.2 - uTime * 4.6));
          float reach = 0.16 + 0.5 * vn(vec2(xm * 1.2 + row * 5.7, sd * 2.0));                         // how far the white water reaches from a lip
          // treads: foam gathers toward the lip and boils just under it; ledges: torn strands down the drop, a boil where they land
          float lipT = smoothstep(1.0 - reach, 1.0 - reach * 0.3, st) + (1.0 - smoothstep(0.0, 0.1 + 0.25 * reach, st)) * 0.7;
          float lipL = smoothstep(0.02, 0.2, st) * (0.5 + 0.5 * smoothstep(0.75, 1.0, st)) + smoothstep(0.8, 1.0, st) * 0.5;
          float lipK = mix(0.55 + 0.45 * min(lipT, 1.0), 0.72 + 0.28 * min(lipL, 1.0), led);
          float white = run * lipK * smoothstep(0.24, 0.66, n2 * 0.6 + n3 * 0.4 + 0.2 * reach) * (0.65 + 0.35 * n1);
          float ux2 = vUv.x + (vn(vec2(ym * 0.6 + sd, 3.0)) - 0.5) * 0.2 + (vn(vec2(ym * 2.3 + sd, 6.0)) - 0.5) * 0.06, edge = smoothstep(0.0, 0.12, ux2) * smoothstep(1.0, 0.88, ux2);
          float body = (0.3 + 0.22 * n1) * (0.55 + 0.45 * run);                                       // the glassy sheet: wet stone seen through moving water
          a = clamp(body + white * 0.9, 0.0, 1.0) * edge * smoothstep(0.0, 0.01, v);
          vec3 glass = mix(uShade * 0.6, lit * vec3(0.45, 0.62, 0.6), 0.3 + 0.3 * n1);
          col = mix(glass, lit * (0.7 + 0.3 * n3), clamp(white * 1.1, 0.0, 1.0));                     // (the foam has greys in it: never one flat white)
        } else if (kind > 6.5) {
          // drizzle off a deck's edge after the rain: long soft threads of drops, each with its own brightness, gathered in slow shafts that
          // drift along the edge; several such sheets stand one behind the other under the decks. Nothing of it within 14 m of the eye.
          // (round 15) a ragged curtain, not a pane: it hangs in separate lengths of the edge with open gaps between, every length ending
          // at its own height in a torn hem; nothing of it where no thread falls
          float xm = vXm + 0.5 * w, yv = v * h, dist = length(cameraPosition - vWp);
          float colK = smoothstep(0.4, 0.58, vn(vec2(xm * 0.06 + ph * 17.0, 3.0)) * 0.7 + vn(vec2(xm * 0.23 + ph * 5.0, 8.0)) * 0.3);
          float hemY = 0.3 + 0.7 * vn(vec2(xm * 0.14 + ph * 9.0, 7.0)) + 0.1 * (vn(vec2(xm * 1.1 + ph, 2.0)) - 0.5);
          float rag = colK * (1.0 - smoothstep(hemY - 0.18, hemY, v));
          float shaft = smoothstep(0.3, 0.75, vn(vec2(xm * 0.11 + ph * 13.0 + uTime * 0.03, yv * 0.012 + ph * 5.0)));
          float th1 = vn(vec2(xm * 1.7 + ph * 31.0, yv * 0.045 - uTime * 0.9)), th2 = vn(vec2(xm * 4.6 + ph * 7.0, yv * 0.11 - uTime * 2.1));
          float bead = 0.3 + 0.7 * smoothstep(0.3, 0.72, vn(vec2(xm * 2.3 + ph * 3.0, yv * 0.24 - uTime * 3.4)));     // each thread is a run of drops, not a string
          float thread = smoothstep(0.55, 0.95, th1 * 0.6 + th2 * 0.4 + 0.2 * shaft) * (0.35 + 0.65 * shaft) * bead;
          a = thread * 0.17 * rag * uDrizzle * smoothstep(0.0, 0.1, v) * (1.0 - smoothstep(0.82, 1.0, v)) * smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x)
            * smoothstep(14.0, 34.0, dist) * (1.0 - 0.5 * smoothstep(120.0, 260.0, dist));
          col = mix(uShade, lit, 0.55 + 0.35 * th2);
        } else if (kind < 0.5) {
          float sp = 3.0 + 0.9 * sqrt(h), xm = vXm + 0.5 * w, ux = clamp(vXm / (w * (1.0 + 0.5 * v)) + 0.5, 0.0, 1.0);
          float vs = 1.0 + 3.0 * (1.0 - smoothstep(10.0, 24.0, h));          // a short sheet seen from close by: rounder foam, or its long streaks break into chevrons
          float n1 = vn(vec2(xm * 2.2 / (0.5 + 0.5 * vs) + ph * 17.0, v * h * 0.22 * vs - uTime * sp * 0.22));
          float n2 = vn(vec2(xm * 6.0 / (0.5 + 0.5 * vs) + ph * 5.0, v * h * 0.6 * vs - uTime * sp * 0.55));
          float shortK = 1.0 - smoothstep(10.0, 24.0, h);
          // a short sheet is seen from close by and from above: its sides wander and feather out, its lip dips and breaks along the rim
          float uxw = ux + (vn(vec2(v * h * 0.6 + ph * 13.0, ph * 29.0)) - 0.5) * 0.16 * shortK;
          float edge = smoothstep(0.0, 0.22, uxw) * smoothstep(1.0, 0.78, uxw);
          float tall = mix(0.75, 1.0, smoothstep(10.0, 24.0, h));           // a short sheet is torn water too, a little calmer than a long one
          float tear = mix(0.95, 0.5, v) + (n1 * 0.7 + n2 * 0.5 - 0.6) * mix(0.6, 1.3, v) * tall;
          float lipN = vn(vec2(xm * 1.5 + ph * 23.0, 1.7)), dip = shortK * (0.06 + 0.42 * lipN);
          float lip = (1.0 - smoothstep(0.25, 0.9, v * h)) * mix(smoothstep(0.0, 0.06, ux) * smoothstep(1.0, 0.94, ux), smoothstep(0.0, 0.18, 0.5 - abs(uxw - 0.5)) * (0.35 + 0.65 * smoothstep(0.35, 0.7, vn(vec2(xm * 2.3 + ph * 7.0, 5.1)))), shortK);   // the glassy bend over the lip, then foam
          a = max(clamp(tear, 0.0, 1.0) * smoothstep(0.15, 0.5, tear) * edge, lip) * smoothstep(0.0, 0.01, v) * (0.8 + 0.2 * smoothstep(10.0, 24.0, h));   // holes where it tears: the wall shows between the white streaks
          a *= mix(1.0, smoothstep(dip - 0.05, dip + 0.12, v * h), shortK);
          // and it comes down in strands of uneven width, the wet wall showing between them: never one pane
          a *= mix(1.0, 0.12 + 0.88 * smoothstep(0.3, 0.58, vn(vec2(xm * 0.85 + ph * 31.0, v * h * 0.07 + ph * 3.0)) + 0.25 * (vn(vec2(xm * 2.9 + ph * 9.0, v * h * 0.25 - uTime * 0.15)) - 0.5)), (1.0 - smoothstep(12.2, 13.6, h)) * smoothstep(0.02, 0.12, v));
          // fine falling streaks with the wall showing between them
          float fine = smoothstep(0.3, 0.75, vn(vec2(xm * 9.0 + ph * 3.0, v * h * 0.8 - uTime * sp * 0.7)) * 0.6 + vn(vec2(xm * 21.0 + ph * 8.0, v * h * 0.3 - uTime * sp * 0.5)) * 0.4);
          a *= mix(1.0, 0.25 + 0.9 * fine, shortK * (1.0 - lip));
          col = mix(uShade, lit, 0.45 + 0.55 * mix(0.5, n2, tall)) * (0.8 + 0.5 * mix(0.5, n1, tall)) + lit * lip * 0.35;
          col = mix(col, lit * 1.08, fine * 0.5 * shortK);
          // white water in falling threads on every sheet, so that a short one reads as water too and not as a pane of glass
          // (where the threads are is one-dimensional noise across the sheet; a second, rounder noise breaks them along their fall: no chevrons)
          float thr = smoothstep(0.5, 0.78, vn(vec2(xm * 3.1 + ph * 11.0, 4.7))) * smoothstep(0.3, 0.65, vn(vec2(xm * 0.9 + ph * 5.0, v * h * 0.45 - uTime * sp * 0.5))) * edge * smoothstep(0.03, 0.2, v);
          a = max(a, thr * 0.9); col = mix(col, lit * 1.05, thr * 0.7);
        } else if (kind > 5.5) {
          // the crown at a fall's foot: spray thrown up and outward in torn plumes, densest low in the middle
          float x = vUv.x * 2.0 - 1.0, up = vUv.y, dome = 1.0 - smoothstep(0.15, 1.0, length(vec2(x, up * 1.04)));
          float n1 = vn(vec2(x * 3.0 + ph * 9.0, up * 3.4 - uTime * 1.7)), n2 = vn(vec2(x * 8.0 + ph * 3.0, up * 7.0 - uTime * 2.6));
          float plume = smoothstep(0.4, 0.78, n1 * 0.6 + n2 * 0.4 + dome * 0.5 - 0.22 * up);
          a = clamp(dome * plume * 0.85 + exp(-(x * x * 7.0 + up * up * 20.0)) * 0.45, 0.0, 1.0) * (0.35 + 0.65 * min(vLit + 0.4, 1.0));
          col = mix(uShade, lit, 0.4 + 0.6 * n1);
        } else if (kind > 4.5) {
          // rings on the pond: white churn where the water goes in, crests running outward in broken arcs and dying away
          vec2 q = vUv * 2.0 - 1.0; float r = length(q), ang = atan(q.y, q.x + 1e-5), tr = uTime * 0.55 + ph * 7.0;
          float churn = (1.0 - smoothstep(0.06, 0.36, r)) * (0.4 + 0.6 * vn(q * 9.0 + vec2(ph * 7.0, -uTime * 1.3)));
          float rr = fract(r * w / 2.4 - tr), crest = smoothstep(0.3, 0.5, rr) * smoothstep(0.72, 0.5, rr);
          float arcs = smoothstep(0.3, 0.62, vn(vec2(ang * 2.4 + ph * 9.0, r * 3.0 - tr * 0.5)));
          a = churn * 0.8 + crest * arcs * 0.42 * smoothstep(0.16, 0.36, r) * (1.0 - smoothstep(0.5, 1.0, r));
          col = mix(uShade * 0.85, lit, 0.45 + 0.55 * churn);
        } else if (kind > 3.5) {
          // a free fall: glassy over the lip, then strands of uneven width that wander, part and tear into drops and veil as they gather
          // speed; a ragged outline that never comes to a straight edge; thin water is blue shade, the cores are white
          // (round 15) no two falls alike: each has its own habit from its phase (fine or coarse strands, how soon it tears, how much veil
          // it trails; one in three comes down as two columns that part below the lip), and a broad one is a body of white water
          float W = w * (1.0 + 0.6 * v), xn = clamp(vXm / max(0.5 * W, 1e-3), -1.0, 1.0), yv = v * h, sp = 2.2 + 0.5 * sqrt(h);
          float st1 = fract(ph * 7.31 + 0.13), st2 = fract(ph * 13.7 + 0.61), thick = smoothstep(5.5, 7.5, w);
          float tallF = smoothstep(60.0, 150.0, h); thick *= 1.0 - tallF;      // a fall the height of a tower is strands of white water with the wall dark between them: it trails little veil, and is never a pale pane over the tower
          float fl = sqrt(yv + 0.5) * 3.0 - uTime * sp * 0.5;
          float sx = vXm * 2.4 * mix(0.6, 1.7, st1) / (0.6 + 0.2 * w) + ph * 31.0 + 0.5 * sin(yv * 0.17 + ph * 9.0);
          float s1 = vn(vec2(sx, yv * 0.035 + ph * 3.0)), s2 = vn(vec2(sx * 2.9 + 5.0, yv * 0.09 + ph * 7.0));
          float strand = smoothstep(0.3 + 0.2 * v, 0.56 + 0.16 * v, s1 * 0.62 + s2 * 0.38 + 0.3 * (1.0 - v) * (1.0 - v) + (st2 - 0.5) * 0.14 + 0.2 * thick);
          float p1 = vn(vec2(sx * 1.1, fl * 1.1 + ph * 5.0)), p2 = vn(vec2(sx * 3.7 + 3.0, fl * 2.6));
          float tear = smoothstep(0.2 + 0.3 * v, 0.55 + 0.3 * v, p1 * 0.6 + p2 * 0.4 + 0.3 * (1.0 - v) + (st1 - 0.5) * 0.22 + 0.25 * thick);
          float en = vn(vec2(yv * 0.3 + ph * 13.0, ph * 29.0)) * 0.4 + vn(vec2(yv * 1.1 + ph * 3.0, fl * 0.4)) * 0.2;
          float edge = 1.0 - smoothstep(0.5 - 0.5 * en, 0.98 - 0.3 * en, abs(xn));
          edge *= 1.0 - step(0.64, st2) * (1.0 - thick) * (1.0 - smoothstep(0.04, 0.3, abs(xn + (en - 0.2) * 0.6))) * smoothstep(0.02, 0.22, v);
          float core = strand * tear * (0.55 + 0.45 * (1.0 - abs(xn)));
          core = max(core, thick * (0.4 + 0.5 * p1) * (0.5 + 0.5 * smoothstep(0.25, 0.6, s2)));
          float veil = (0.08 + 0.34 * v * v) * (0.4 + 0.6 * p2) * mix(0.5, 1.7, st1) * mix(1.0, 0.3, tallF);
          float lip = (1.0 - smoothstep(0.3, 1.3, yv)) * (1.0 - smoothstep(0.7, 1.0, abs(xn)));
          a = max(edge * (core * 0.95 + veil), lip * 0.9) * smoothstep(0.0, 0.006, v) * (1.0 - 0.55 * smoothstep(0.93, 1.0, v));
          col = mix(mix(uShade, lit, 0.3), lit * 1.05, clamp(core + lip * 0.6, 0.0, 1.0)) * (0.8 + 0.3 * p2);
        } else if (kind < 1.5) {
          vec2 q = vUv * 2.0 - 1.0; float r2 = dot(q, q);
          // (two octaves on turned axes: one octave of value noise shows its square cells, and the puff reads as a pale box on the water)
          float n1 = 0.55 * vn(q * 2.2 + vec2(ph * 9.0, -uTime * 0.5)) + 0.45 * vn(vec2(q.x * 0.8 - q.y * 0.6, q.x * 0.6 + q.y * 0.8) * 3.9 + vec2(ph * 5.0, uTime * 0.3));
          a = exp(-r2 * 4.2) * (0.3 + 0.5 * n1) * (1.0 - smoothstep(0.55, 1.0, r2)) * min(h, 1.0);   // a mist item's height is its opacity
          a *= mix(1.0, 1.3 * smoothstep(0.22, 0.6, n1), smoothstep(10.0, 26.0, cameraPosition.y));    // torn into shreds when looked down on
          a *= smoothstep(0.15, 0.42, vUv.y);                                                          // and gone before the card meets the water: no level line at a fall's foot
          col = mix(uShade, lit, 0.6) * 0.8 * (1.0 + 0.5 * max(h - 1.0, 0.0));                          // (a height above 1 is a brighter plume)
        } else {
          // the bead veil: strands of drops at wandering spacing, half of them missing (three in four where the eye passes through), each
          // strand with its own brightness, its own bead spacing and its own length; a third of the beads are petals, lilac in the same light
          float cx = vUv.x * w * 3.4 + 1.5 * vn(vec2(vUv.x * w * 0.8, ph)), id = floor(cx), fx = fract(cx) - 0.5, r = h21(vec2(id, ph)), r2 = h21(vec2(id * 2.3 + 1.0, ph + 5.0));
          float dist = length(cameraPosition - vWp), nearV = 1.0 - smoothstep(10.0, 25.0, dist);
          float keep = step(0.5 + 0.25 * nearV, h21(vec2(id * 1.7 + 3.0, ph + 2.0)));
          float len = 0.4 + 0.6 * h21(vec2(id * 3.3 + 7.0, ph + 1.0));
          float row = v * h * (0.5 + 0.55 * r2) - uTime * (2.2 + 1.6 * r) + r * 7.0, fr = fract(row) - 0.5;
          float bead = (1.0 - smoothstep(0.1, 0.42, length(vec2(fx * 2.3 + (r - 0.5) * 0.6, fr * (0.8 + 0.6 * r2))))) * step(0.42, h21(vec2(id, floor(row))));
          float thread = (1.0 - smoothstep(0.0, 0.08, abs(fx + (r - 0.5) * 0.3))) * 0.012;
          float train = smoothstep(0.42, 0.66, vn(vec2(id * 3.7 + ph * 9.0, row * 0.13)));   // drops fall in trains with long gaps between, never a full string
          float petal = step(0.7, h21(vec2(id * 3.1, floor(row) + 2.0)));
          a = (bead * train + thread) * keep * (0.25 + 0.75 * r2 * r2) * smoothstep(0.0, 0.03, v) * (1.0 - smoothstep(len - 0.15, len, v)) * mix(0.7, 0.25, nearV) * smoothstep(1.5, 6.0, dist) * mix(1.0, 0.6, smoothstep(40.0, 120.0, dist));
          col = mix(lit * 0.9, vec3(0.7, 0.52, 1.0) * dot(lit, vec3(0.36)), petal * 0.85) * uVeil;
        }
        a *= uFade;
        if (a < 0.004) discard;
        gl_FragColor = vec4(max(col, vec3(0.0)), clamp(a, 0.0, 1.0));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, uniforms, material: mat };
}

// ---------- wisteria: instanced hanging cards, each drawing three racemes of floret beads; pendulum sway with travelling gusts ----------
// inst.B = (yaw, phase 0..1 (+1 = the second colour cast), share of sunlight 0..1, arc length along the parapet)
// o.rows: rows of each of the two crossed quads (4 near the fly line, where the sway's bend shows; 1 far off); o.share: an earlier
// result whose material (and so its uniforms) this mesh uses too.
// Seen from a few metres (the view climbs past the parapets): the leaf mass has a ragged top, sides and lower edge and is made of
// leaflet-sized pieces, lit bronze-green outside and dark within; a raceme is rows of florets, pale-lipped, with shade between them.
export function makeWisteria(inst, light = {}, o = {}) {
  // two crossed quads; position.x across, y 0 (top) .. -1 (tip); the second quad is turned 90 degrees
  const pos = [], uv = [], idx = [], R = o.rows || 4;
  for (let q = 0; q < 2; q++) for (let r = 0; r <= R; r++) for (let s = 0; s < 2; s++) {
    const x = s - 0.5, y = -r / R;
    pos.push(q === 0 ? x : 0, y, q === 0 ? 0 : x * 0.7); uv.push(s + q * 2, r / R);
  }
  for (let q = 0; q < 2; q++) for (let r = 0; r < R; r++) { const k = q * (R + 1) * 2 + r * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(inst.A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(inst.B, 4));
  g.instanceCount = inst.count;
  if (o.share) { const mesh = new THREE.Mesh(g, o.share.material); mesh.frustumCulled = false; return { mesh, uniforms: o.share.uniforms, material: o.share.material }; }
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uGust: { value: light.gust ?? 1 },
    uFlower: { value: new THREE.Color(light.flower || '#9a78d8') }, uTip: { value: new THREE.Color(light.tip || '#e6dafa') },
    uFlower2: { value: new THREE.Color(light.flower2 || light.flower || '#9a78d8') }, uTip2: { value: new THREE.Color(light.tip2 || light.tip || '#e6dafa') },
    uLeaf: { value: new THREE.Color(light.leaf || '#6b7a34') },
    uSun: { value: new THREE.Color(light.sun || '#FFE4B5').multiplyScalar(light.sunK ?? 1.5) },
    uAmb: { value: new THREE.Color(light.amb || '#6a76a0').multiplyScalar(light.ambK ?? 0.75) },
  }]);
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; uniform float uTime, uGust;
      varying vec2 vUv; varying vec4 vI; varying float vDist;
      #include <fog_pars_vertex>
      void main(){
        float len = iA.w, yaw = iB.x, ph = fract(iB.y), v = -position.y; vUv = uv; vI = vec4(len, ph, iB.z, step(1.0, iB.y));
        float c = cos(yaw), s = sin(yaw);
        vec3 lp = vec3(position.x * 1.7, position.y * len, position.z * 1.7);
        vec3 wp = iA.xyz + vec3(lp.x * c + lp.z * s, lp.y, -lp.x * s + lp.z * c);
        float gust = sin(uTime * 0.55 - iB.w * 0.045) * 0.5 + 0.5;       // travels along the parapet
        float sw = (sin(uTime * 1.5 + ph * 6.28) * 0.35 + sin(uTime * 0.83 + ph * 17.0) * 0.25) * (0.35 + gust) * uGust;
        float b = v * v * len * 0.11 * sw;
        wp += vec3(s, 0.0, c) * b + vec3(c, 0.0, -s) * b * 0.4; wp.y += abs(b) * 0.25;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.0);
        vDist = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFlower, uTip, uFlower2, uTip2, uLeaf, uSun, uAmb; varying vec2 vUv; varying vec4 vI; varying float vDist;
      ${GLSL_N}
      #include <fog_pars_fragment>
      void main(){
        float len = vI.x, ph = vI.y, q = floor(vUv.x * 0.5), u = fract(vUv.x * 0.999), v = vUv.y;
        float k = u * 3.0, id = floor(k) + q * 3.0;
        float r = h21(vec2(id + 1.0, ph * 91.0)), r2 = h21(vec2(id + 7.0, ph * 53.0));
        float fu = fract(k) - 0.5 + (r2 - 0.5) * 0.3;                      // racemes hang at uneven spacing
        float rl = 0.35 + 0.65 * r, vv = v / rl;                           // each its own length, 0.35 to 1 of the card
        float nearK = 1.0 - smoothstep(20.0, 60.0, vDist), ym = v * len;   // ym: metres down the card
        float bead = vn(vec2(fu * 9.0 + id * 3.0, vv * len * rl * mix(3.4, 5.0, nearK) + ph * 31.0));
        float wd = (0.3 + 0.3 * r2) * (1.0 - 0.62 * vv) * (0.6 + 0.6 * bead) * step(vv, 1.0) * mix(1.0, 1.35, nearK);   // and its own width, tapering to the tip
        // florets: a staggered lattice of round beads 8 cm across down the raceme
        vec2 fq = vec2(fu * 7.2 + id * 0.37, ym * 12.0 + r * 5.0); fq.x += 0.5 * mod(floor(fq.y), 2.0);
        vec2 fi = floor(fq), ff = fract(fq) - 0.5; float fh = h21(fi + vec2(id * 7.0, ph * 19.0));
        float floret = 1.0 - smoothstep(0.24, 0.52, length(ff - (vec2(fh, h21(fi + 3.3 + ph)) - 0.5) * 0.28));
        float rim = smoothstep(0.55, 1.0, abs(fu) / max(wd, 1e-3));          // toward the raceme's edge only whole florets stay: a beaded outline
        float fl = step(abs(fu), wd) * step(0.06, vv) * step(rim * nearK * 0.75, floret + 0.2);
        // the leaf mass: ragged at the top, at both sides and along its lower edge, in leaflet-sized pieces (coarser pieces far off)
        float edge = abs(u - 0.5) * 2.0, lz = vn(vec2(vUv.x * 5.0 + ph * 29.0, 3.0));
        float lnN = vn(vec2(vUv.x * 23.0 + ph * 13.0, ym * 9.0)) * 0.6 + vn(vec2(vUv.x * 61.0 + ph * 7.0, ym * 24.0)) * 0.4;
        float lnF = vn(vec2(vUv.x * 7.0 + ph * 13.0, ym * 2.6)) * 0.65 + vn(vec2(vUv.x * 19.0 + ph * 7.0, ym * 7.0)) * 0.35;
        float ln = mix(lnF, lnN, nearK);
        float top = 0.08 + 0.5 * vn(vec2(vUv.x * 3.1 + ph * 41.0, 9.0)) + 0.22 * vn(vec2(vUv.x * 11.0 + ph * 3.0, 4.0));          // metres: the top line wanders
        float leafZone = (1.0 - smoothstep(0.10 + 0.14 * lz, 0.20 + 0.22 * lz, v)) * smoothstep(top - 0.12, top + 0.05, ym + 0.3 * (ln - 0.5));
        float leaf = leafZone * step(0.36 + 0.35 * edge * edge + 0.25 * smoothstep(0.08, 0.25, v), ln + 0.12 * (1.0 - nearK));
        if (fl + leaf < 0.5) discard;
        vec3 flower = mix(mix(uFlower, uFlower2, vI.w), mix(uTip, uTip2, vI.w), smoothstep(0.45, 1.0, vv) * 0.35 + 0.3 * fh * nearK) * (0.7 + 0.5 * bead);
        flower *= mix(1.0, 0.5 + 0.75 * floret, nearK);                      // shade between the florets
        vec3 lcol = mix(uLeaf * 0.45, uLeaf * 1.25 + vec3(0.05, 0.04, 0.0), ln) * (0.7 + 0.5 * step(0.5, fract(ln * 7.0)));
        vec3 alb = mix(flower, lcol, step(0.5, leaf) * step(fl * (1.0 - leafZone), 0.5));
        float sun = vI.z * (0.75 + 0.35 * r);
        gl_FragColor = vec4(max(alb * (uAmb * 0.8 + uSun * sun * 0.7), vec3(0.0)), 1.0);
        #ifdef FOG_EXP2
          // (the lilac carries through the haze: at the far end of the boulevard the stack's fringes are a clear band of colour, not grey)
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, (1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * mix(0.55, 1.0, smoothstep(0.002, 0.004, fogDensity)));
        #endif
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { mesh, uniforms, material: mat };
}

// opts: { rng, density, light, fallLight, concrete (material for the decks and piers), sunLocal ([x, y, z] toward the sun in this frame),
//         litAt(x, y, z) -> 0..1 share of sunlight at a point of this frame, tintAt(x, y, z) -> [r, g, b] multiplier for plants,
//         mixed (true: white and lilac wisteria in patches), flora: { material } (a kit windMaterial to share) }
export async function buildHero(ctx, opts = {}) {
  const rng = (opts.rng || ctx.rng).fork('wisteria-stack');
  const detail = ctx.quality?.detail ?? 1, density = opts.density ?? 1;
  const C = (h) => new THREE.Color(h);
  const conc = C('#b3ab9a'), concWarm = C('#c2b8a2'), concDark = C('#55545a'), soffit = C('#5a5a62'), moss = C('#5c7a3c'), mossDark = C('#3E6B33'),
    green = C('#6f9a3e'), rust = C('#8a5a3a'), road = C('#6e6a60'), paint = C('#cfc8b0');
  const xr = makeRng('deck-tops:' + (ctx.seed ?? 0));          // everything this version adds draws from here, so the stack's own layout stays as it was
  const sunL = opts.sunLocal || [-0.03, 0.44, 0.9];
  const litAt = opts.litAt || ((x, y, z) => deckShade(x, y, z, sunL));
  const object = new THREE.Group(); object.name = 'wisteria-stack';
  const gb = new GB(), P = {};
  const N = 72;
  // sample every centre line once (for pier rejection)
  const samples = DECKS.map((d) => { const a = []; for (let i = 0; i <= 48; i++) { deckPoint(d, i / 48, P); a.push(P.x, P.z); } return a; });
  const nearDeck = (j, x, z) => { const a = samples[j]; let m = 1e9; for (let i = 0; i < a.length; i += 2) m = Math.min(m, Math.hypot(a[i] - x, a[i + 1] - z)); return m; };
  const inCorridor = (x, z, pad) => (z > -30 && z < 420 && Math.abs(x - flyX(z)) < pad) || (z > 150 && z < 420 && x > -12 && x < 12 + 0.17 * (z - 150));
  const piers = [], plants = [];                           // plants: { x, y, z, s, rot, v, d, u } for the kit scatter
  const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const innerFoot = mossDark.clone().lerp(concDark, 0.45), innerTop = [moss.clone().lerp(conc, 0.3), mossDark.clone().lerp(conc, 0.25), green.clone().lerp(conc, 0.45)];

  // decks: box girder with parapets
  for (let di = 0; di < DECKS.length; di++) {
    const d = DECKS[di], yT = d.y + 2.4, hw = d.w / 2;
    const prof = [[-hw, yT + 1.5], [-hw + 0.5, yT + 1.5], [-hw + 0.5, yT], [hw - 0.5, yT], [hw - 0.5, yT + 1.5], [hw, yT + 1.5], [hw, yT - 0.8], [hw * 0.55, d.y], [-hw * 0.55, d.y], [-hw, yT - 0.8], [-hw, yT + 1.5]];
    const cols = [moss, conc, road, conc, moss, concWarm, conc, soffit, conc, concWarm];       // the carriageway: old asphalt, mossed over in patches by the shader
    let prev = null, pc = null;
    for (let i = 0; i <= N; i++) {
      deckPoint(d, i / N, P);
      // ghosts of lane paint: a broken centre line and two edge lines, seen when the view is above the decks
      if (pc) {
        const yp = yT + 0.07, L2 = (o, w, k0, k1) => { const ax = pc[0] + (P.x - pc[0]) * k0, az = pc[1] + (P.z - pc[1]) * k0, bx = pc[0] + (P.x - pc[0]) * k1, bz = pc[1] + (P.z - pc[1]) * k1;
          gb.quad([ax + P.nx * (o - w), yp, az + P.nz * (o - w)], [ax + P.nx * (o + w), yp, az + P.nz * (o + w)], [bx + P.nx * (o + w), yp, bz + P.nz * (o + w)], [bx + P.nx * (o - w), yp, bz + P.nz * (o - w)], paint); };
        if (i % 2) L2(0, 0.13, 0.1, 0.62);
        if ((i * 13 + di * 5) % 7 > 1) L2(hw - 2.2, 0.11, 0, 1); if ((i * 11 + di * 3) % 7 > 1) L2(-hw + 2.2, 0.11, 0, 1);
      }
      // (round 15) THE SOFFIT IS BUILT, not a slab: a cross rib at every section and two girders running between the ribs, each rib in
      // its own stain (rust, damp moss, pale lime) by hash; within 120 m of the view's line (the girders within 90 m)
      if (Math.abs(P.x - flyX(P.z)) < 120) {
        const hr = hsh(i * 3.7 + di * 11.3), ribC = hr > 0.7 ? rust.clone().lerp(soffit, 0.5) : hr > 0.42 ? mossDark.clone().lerp(soffit, 0.55) : soffit.clone().lerp(conc, 0.25 + 0.5 * hr);
        gb.box(P.x, P.z, P.nx, P.nz, hw * 0.56, 0.34, d.y - 0.66, d.y + 0.03, ribC, ribC, ribC.clone().multiplyScalar(0.72));
        if (pc && Math.abs(P.x - flyX(P.z)) < 90) for (const o of [-0.3, 0.3]) gb.beam([pc[0] + P.nx * hw * o, d.y + 0.02, pc[1] + P.nz * hw * o], [P.x + P.nx * hw * o, d.y + 0.02, P.z + P.nz * hw * o], 0.45, 0.42, soffit.clone().lerp(conc, 0.2 + 0.3 * hsh(i * 9.1 + o * 5)));
      }
      pc = [P.x, P.z];
      const ring = prof.map((q) => [P.x + P.nx * q[0], q[1], P.z + P.nz * q[0]]);
      if (prev) for (let k = 0; k < 10; k++) {
        let col = cols[k], col2;
        const hp = hsh(i * 17.3 + di * 5.1 + k * 3.7), nearFly = Math.abs(P.x - flyX(P.z)) < 70;
        if ((k === 5 || k === 9) && ((i * 7 + di * 3) % 5 === 0 || (nearFly && hp > 0.34))) col = hp > 0.72 ? moss.clone().lerp(concWarm, 0.55) : hp > 0.5 ? concDark.clone().lerp(concWarm, 0.6) : rust.clone().lerp(concWarm, 0.72);       // lime, rust and moss streaked panels
        // the parapets' inner faces (seen from over the decks): damp and dark at the kerb, moss and lichen up to the coping, no two panels alike
        if (k === 1) { col = innerTop[Math.floor(hp * 3) % 3]; col2 = innerFoot; } else if (k === 3) { col = innerFoot; col2 = innerTop[Math.floor(hp * 3) % 3]; }
        gb.quad(prev[k], ring[k], ring[k + 1], prev[k + 1], col, col2);
      }
      prev = ring;
      if (i % 12 === 11) await ctx.yield();
    }
    await ctx.yield();
    // piers under this deck
    const count = 13;
    for (let i = 0; i < count; i++) {
      deckPoint(d, (i + 0.5) / count, P);
      if (inCorridor(P.x, P.z, 15)) continue;
      let blocked = false;
      for (let j = 0; j < di; j++) if (nearDeck(j, P.x, P.z) < DECKS[j].w / 2 + 5) blocked = true;
      if (blocked) continue;
      gb.prism(P.x, P.z, P.tx, P.tz, 2, 3, -1.5, 6, mossDark, moss.clone().lerp(conc, 0.6), 12);
      gb.prism(P.x, P.z, P.tx, P.tz, 2, 3, 6, d.y - 1.6, moss.clone().lerp(conc, 0.6), conc, 12);
      gb.box(P.x, P.z, P.nx, P.nz, d.w * 0.34, 1.9, d.y - 1.6, d.y, concWarm, green, concDark);              // hammerhead
      piers.push([P.x, P.z, d.y - 1.6, P.tx, P.tz]);
      for (const e of [-1, 1]) plants.push({ x: P.x + P.nx * e * d.w * 0.31, y: d.y - 0.05, z: P.z + P.nz * e * d.w * 0.31, s: rng.range(1.3, 2.3), rot: rng.range(0, TAU), v: 4, d: 0, u: 0 });   // ferns on the bearing shelf
    }
    // saplings, shrubs and bamboo on the deck top
    const tops = Math.round(26 * density);
    for (let i = 0; i < tops; i++) {
      deckPoint(d, rng.range(0.03, 0.97), P);
      const o = rng.range(-hw + 2.4, hw - 2.4), x = P.x + P.nx * o, z = P.z + P.nz * o, r = rng(), v = r < 0.42 ? (rng() < 0.5 ? 0 : 1) : r < 0.7 ? 2 : 3;
      const low = di === 4 && Math.abs(x - flyX(z)) < 16, sz = v < 2 ? rng.range(0.9, 1.9) : v === 2 ? rng.range(0.4, 0.75) : rng.range(0.3, 0.6);      // nothing tall under the view's line over the top deck
      const rotP = rng.range(0, TAU);
      if (Math.abs(x - flyX(z)) < 120 || i % 2 === 0) plants.push({ x, y: yT, z, s: low ? Math.min(sz, 1.1) : sz, rot: rotP, v: low && v > 1 ? 0 : v, d: 0, u: 0 });      // far from the view's line: every other one
    }
    // more green on the carriageway where the view looks down on it: bushes and ferns in drifts along the kerbs and in the cracks
    for (let i = 0, ne = di === 4 || di === 2 ? 20 : 6; i < ne; i++) {          // (the two decks the view looked down on in earlier versions: fewer now that it passes under them)
      deckPoint(d, i < 18 ? xr.range(0.28, 0.72) : xr.range(0.4, 0.6), P);        // most of them within 60 m of the view's line
      const kerb = xr() < 0.6, o = (kerb ? (xr() < 0.5 ? -1 : 1) * xr.range(hw - 3.6, hw - 1.2) : xr.range(-hw + 3, hw - 3)), x = P.x + P.nx * o, z = P.z + P.nz * o, fern = xr() < 0.5;
      const low = di === 4 && Math.abs(x - flyX(z)) < 16;
      plants.push({ x, y: yT, z, s: fern ? xr.range(1.0, low ? 1.3 : 2.2) : xr.range(0.5, low ? 1.0 : 2.2), rot: xr.range(0, TAU), v: fern ? 4 : (xr() < 0.5 ? 0 : 1), d: 0, u: 0 });
    }
    for (let i = 0; i < 7; i++) {
      deckPoint(d, (i + 0.3) / 7, P);
      const s = i % 2 ? 1 : -1, x = P.x + P.nx * s * (hw - 0.9), z = P.z + P.nz * s * (hw - 0.9), lean = rng.range(-0.8, 0.8);
      if ((di === 4 && Math.abs(x - flyX(z)) < 26) || (di === 0 && Math.abs(x) < 40)) continue;      // (none beside the ring's axis on the lowest deck: it stood against the sky as a flat dark L)
      gb.beam([x - P.nx * 0.14, yT + 1.5, z - P.nz * 0.14], [x + lean - P.nx * 0.14 + 0.28 * P.nx, yT + 1.5, z + 0.28 * P.nz - P.nz * 0.14], 0.14, -0.01, moss);
      gb.box(x, z, P.tx, P.tz, 0.16, 0.16, yT + 1.5, yT + 10, mossDark, green);
      gb.box(x - P.nx * s * 1.4, z - P.nz * s * 1.4, P.nx, P.nz, 1.5, 0.14, yT + 9.7, yT + 10, mossDark, green);
    }
    await ctx.yield();
  }
  // the merged concrete, one attribute at a time with a yield between: the same arrays and normals as gb.build(), in three short steps
  const stackGeo = new THREE.BufferGeometry();
  stackGeo.setAttribute('position', new THREE.Float32BufferAttribute(gb.p, 3));
  await ctx.yield();
  stackGeo.setAttribute('color', new THREE.Float32BufferAttribute(gb.c, 3));
  await ctx.yield();
  stackGeo.computeVertexNormals();
  await ctx.yield();
  const stack = new THREE.Mesh(stackGeo, opts.concrete || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }));
  stack.name = 'stack-concrete'; object.add(stack);
  await ctx.yield();

  // living things rooted in the concrete: shrubs, bamboo and fig saplings on the deck tops, ferns on the pier shelves (kit flora, one scatter)
  let green3 = null;
  if (opts.flora !== false) {
    const fr = rng.fork('deck-flora'), material = opts.flora?.material || flora.windMaterial({ wind: flora.makeWind({ direction: [0.6, 0.8] }) });
    await ctx.yield();
    const variants = [];
    variants.push(flora.bushGeometry({ rng: fr, detail: 0 })); variants.push(flora.bushGeometry({ rng: fr, detail: 0, leaf: '#5c8a34' }));
    await ctx.yield();
    variants.push(flora.bambooGeometry({ rng: fr, detail: 0, height: 11 }));
    await ctx.yield();
    variants.push(flora.oakGeometry({ rng: fr, detail: 0, height: 11, leaf: '#4f7f30', leafLight: '#a9c45a' }));
    await ctx.yield();
    variants.push(flora.fernGeometry({ rng: fr, size: 1.2 }));
    const tintAt = opts.tintAt;
    green3 = flora.makeScatter({ rng: fr, variants, points: plants, material, sink: 0.01, tilt: 0.06, groundColor: tintAt ? (x, z, y) => tintAt(x, y + 2, z) : undefined });
    green3.object.name = 'deck-flora'; object.add(green3.object);
    await ctx.yield();
  }

  // wisteria along every parapet, both sides
  const step = 0.95, Wa = [], Wb = [], Fa = [], Fb = [];      // (near the view's line, and beyond 110 m of it: those are drawn with one row a quad)
  for (let di = 0; di < DECKS.length; di++) {
    const d = DECKS[di], yT = d.y + 2.4, hw = d.w / 2;
    let px = 0, pz = 0, acc = 0, arc = 0;
    for (let i = 0; i <= 700; i++) {
      if (i % 175 === 174) await ctx.yield();
      deckPoint(d, i / 700, P);
      if (i > 0) { const dl = Math.hypot(P.x - px, P.z - pz); acc += dl; arc += dl; }
      px = P.x; pz = P.z;
      if (acc < step) continue;
      acc = 0;
      const far = Math.abs(P.x - flyX(P.z)) > 140, far1 = Math.abs(P.x - flyX(P.z)) > 110;
      if (far && detail < 1 && rng() > detail) { rng(); rng(); rng(); rng(); rng(); rng(); continue; }
      const pale = opts.mixed && Math.sin(arc * 0.019 + di * 1.7) + 0.5 * Math.sin(arc * 0.047 + di) > 0.25 ? 1 : 0;
      for (let s = -1; s <= 1; s += 2) {
        const gap = rng() < 0.06;                                       // broken stretches
        let len = rng.range(d.len[0], d.len[1]) * (far ? 1.15 : 1); const ph = rng();
        if (di === 0 && Math.abs(P.x) < 13) len = Math.min(len, 5.2);                 // nothing hangs into the ring
        if (di === 2 && Math.abs(P.x - flyX(P.z)) < 13) len = Math.min(len, 5.6);       // the stoop passes 3 m under these tips
        if (gap) continue;
        const x = P.x + P.nx * s * (hw + 0.25), z = P.z + P.nz * s * (hw + 0.25);
        const sunny = (s * P.nz > 0 ? 1 : 0.4) * (0.12 + 0.88 * litAt(x + P.nx * s * 0.6, yT + 1.75 - len * 0.5, z + P.nz * s * 0.6));   // the +Z parapet faces the sun astern
        (far1 ? Fa : Wa).push(x, yT + 1.75, z, len);
        (far1 ? Fb : Wb).push(Math.atan2(-P.tz, P.tx), Math.min(ph, 0.999) + pale, sunny, arc + di * 131);
      }
    }
    await ctx.yield();
  }
  // THE WISTERIA VEIL: where the bead curtain falls off the outer flyover, old runners of the wisteria hang down out of the same parapet,
  // each ending in a tuft of leaf and a bunch of racemes. Over the view's line no tip hangs lower than 2.5 m above the eye (the eye
  // passes at 9.7 m); either side of it they come down to eye height and brush past. Their own rng: nothing else moves.
  const lianas = [];
  {
    const lr = makeRng('lianas:' + (ctx.seed ?? 0)), d = DECKS[3], Q = {};
    // (round 15) they hang in six uneven clusters of two to four runners with open gaps between, each runner its own length, thick as
    // a wrist, pale-barked and catching the light, racemes all down it and a bunch at its end: never a row of single tassels on strings
    const raceme = (x, y, z, len, k) => { Wa.push(x, y, z, len); Wb.push(lr.range(0, TAU), lr() * 0.999 + (opts.mixed && lr() < 0.4 ? 1 : 0), 0.3 + 0.7 * litAt(x, y, z), x * 3 + k); };
    for (let c = 0; c < 6; c++) {
      const c0 = -20 + c * 7.4 + lr.range(-1.7, 1.7), nr = 2 + Math.floor(lr() * 3);
      for (let q = 0; q < nr; q++) {
        deckPoint(d, 0.512 + (c0 + (q - (nr - 1) / 2) * lr.range(0.5, 1.2)) / 660, Q);
        const cs2 = Q.nz > 0 ? 1 : -1, x = Q.x + Q.nx * cs2 * (d.w / 2 + 0.35), z = Q.z + Q.nz * cs2 * (d.w / 2 + 0.35), lat = Math.abs(x - flyX(z));
        const y0 = d.y + 3.7, yEnd = lat < 6.5 ? lr.range(16.2, 19.5) : lr.range(8.2, 17), jx = lr.range(-1.3, 1.3), jz = lr.range(0.2, 1.8), n = 3 + Math.floor(lr() * 4);
        lianas.push([[x, y0, z], [x + jx, yEnd, z + jz]]);
        for (let k = 0; k < n; k++) raceme(x + jx + lr.range(-0.45, 0.45), yEnd + 0.45 + lr.range(-0.15, 0.4), z + jz + lr.range(-0.45, 0.45), lat < 6.5 ? lr.range(1.9, 2.6) : lr.range(2.4, 4.0), k);
        for (let k = 0; k < 4; k++) { const f = lr.range(0.2, 0.9), ok = lr() < 0.75; if (ok) raceme(x + jx * f + lr.range(-0.2, 0.2), y0 + (yEnd - y0) * f + 0.2, z + jz * f + lr.range(-0.2, 0.2), lr.range(1.2, 2.3), k + 9); }
      }
    }
    // ROOTS UNDER THE DECKS (round 15): from the ribs of every soffit near the view's line hang short aerial roots and stray racemes, so a
    // deck seen from beneath is grown through like the rest; under the lowest deck nothing comes lower than 11.6 m on the ring's axis, 9.5 m beside it
    const roots = [];
    for (let di = 0; di < DECKS.length; di++) {
      const dd = DECKS[di];
      for (let i = 0; i < 32; i++) {
        deckPoint(dd, 0.5 + (hsh(i * 7.9 + di * 3.3) - 0.5) * 0.36, Q);
        const o = (hsh(i * 2.7 + di * 9.1) - 0.5) * dd.w * 1.0, x = Q.x + Q.nx * o, z = Q.z + Q.nz * o, lat = Math.abs(x - flyX(z));
        if (lat > 60) continue;
        const yTop = dd.y + 0.15 + 1.6 * Math.max(0, (Math.abs(o) - 0.275 * dd.w) / (0.225 * dd.w)), len = Math.min((1.2 + 3.6 * hsh(i * 5.3 + di)) * (lat < 5 ? 0.6 : 1), di === 0 ? (Math.abs(x) < 13 ? 1.2 : 3.2) : 9);
        roots.push([[x, yTop, z], [x + (hsh(i * 1.3 + di) - 0.5) * 0.5, yTop - len, z + (hsh(i * 4.1 + di) - 0.5) * 0.5]]);
        if (hsh(i * 6.1 + di * 2.9) < 0.6 && !(di === 0 && Math.abs(x) < 13)) raceme(x, yTop - len * 0.6, z, 1.0 + 1.1 * hsh(i * 8.7 + di), i);
      }
    }
    // CLIMBERS ON THE PIERS (round 15): up every pier within 46 m of the view's line two or three old stems wind from the water to the
    // hammerhead, in leaf, with racemes hanging off them: a pier the view passes close to is a grown thing, not a plain shaft
    const climbers = [];
    piers.forEach((pr, pi) => {
      if (Math.abs(pr[0] - flyX(pr[1])) > 46) return;
      for (let c = 0, nc = 2 + (hsh(pi * 3.9) > 0.5 ? 1 : 0); c < nc; c++) {
        const a0 = hsh(pi * 7.1 + c * 2.3) * TAU, turn = (hsh(pi * 1.7 + c) > 0.5 ? 1 : -1) * (0.5 + 0.4 * hsh(pi + c * 5.1)), top = pr[2] - 0.4 - 3 * hsh(pi * 2.9 + c), ns = Math.max(3, Math.round(top / 4.5));
        let prev = null;
        for (let k = 0; k <= ns; k++) {
          const a = a0 + k * turn, y = -0.2 + (top + 0.2) * k / ns, cu = Math.cos(a) * 2.2, cv = Math.sin(a) * 3.3, q = [pr[0] + pr[3] * cu - pr[4] * cv, y, pr[1] + pr[4] * cu + pr[3] * cv];
          if (prev) { climbers.push([prev, q]); if (hsh(pi * 9.3 + c * 4.7 + k) < 0.5 && y > 4) raceme(q[0], y, q[2], 1.0 + 1.4 * hsh(pi + c + k * 3.1), k); }
          prev = q;
        }
      }
    });
    if (opts.flora !== false && opts.flora?.material) {
      const lv = flora.makeVines({ rng: makeRng('liana-vines:' + (ctx.seed ?? 0)), material: opts.flora.material, spans: lianas, sag: 0.05, thickness: 0.2, hangers: 0.5, leaves: 1.2, stem: '#8f7c5e', flower: (opts.light || {}).flower || '#B59AE0' });
      lv.object.name = 'wisteria-runners'; lv.object.frustumCulled = false; object.add(lv.object);
      await ctx.yield();
      const rv = flora.makeVines({ rng: makeRng('soffit-roots:' + (ctx.seed ?? 0)), material: opts.flora.material, spans: roots, sag: 0.02, thickness: 0.09, hangers: 0, leaves: 0.45, stem: '#7d6c54' });
      rv.object.name = 'soffit-roots'; rv.object.frustumCulled = false; object.add(rv.object);
      await ctx.yield();
      const cv2 = flora.makeVines({ rng: makeRng('pier-climbers:' + (ctx.seed ?? 0)), material: opts.flora.material, spans: climbers, sag: 0.015, thickness: 0.15, hangers: 0.25, leaves: 1.3, stem: '#7a6a50' });
      cv2.object.name = 'pier-climbers'; cv2.object.frustumCulled = false; object.add(cv2.object);
      await ctx.yield();
    }
  }
  const wist = makeWisteria({ A: new Float32Array(Wa), B: new Float32Array(Wb), count: Wa.length / 4 }, opts.light || {});
  wist.mesh.name = 'wisteria'; object.add(wist.mesh);
  await ctx.yield();
  const wistFar = makeWisteria({ A: new Float32Array(Fa), B: new Float32Array(Fb), count: Fa.length / 4 }, opts.light || {}, { rows: 1, share: wist });
  wistFar.mesh.name = 'wisteria-far'; object.add(wistFar.mesh);
  await ctx.yield();

  // twenty deck falls + mist at each foot + the bead curtain off D4
  // Every deck fall is a free column (kind 4: its card turns about the vertical to face the eye) that leaves the carriageway through a
  // breach in the parapet over a mossed chute, is thrown outward as it drops, and goes into the pond in a crown of spray (6) with
  // rings running out from it (5) and a small drift of mist (1).
  const falls = [], feet = [], fallList = [], spout = new GB(), voidC = new THREE.Color(0.016, 0.024, 0.022), wetC = new THREE.Color(0.03, 0.045, 0.04), chuteC = concDark.clone().lerp(mossDark, 0.45);
  const addFall = (di, t, side, width, r = rng, pad = 13, list = true) => {
    const d = DECKS[di]; deckPoint(d, t, P);
    const hw = d.w / 2, ox = P.nx * side, oz = P.nz * side, ex = P.x + ox * hw, ez = P.z + oz * hw, x = ex + ox * 1.05, z = ez + oz * 1.05, yT = d.y + 2.4;
    if (pad > 0 ? inCorridor(x, z, pad) : Math.abs(x - flyX(z)) < -pad) return false;
    const yaw = Math.atan2(ox, oz), h = yT + 0.05, thrown = 0.3 + 0.2 * Math.sqrt(h + 0.3);      // (the shader's own throw: the foot is where the column lands)
    const fx = x + ox * thrown, fz = z + oz * thrown;
    const lit = Math.max(litAt(fx, h * 0.55, fz), 0.6 * litAt(fx, 2, fz)), lf = litAt(fx, 3, fz), ph = hsh(fx * 3.1 + fz * 1.7);
    falls.push({ top: [x, h, z], width, height: h + 0.3, yaw, kind: 4, phase: r(), lit });
    feet.push([fx, 0, fz]); if (list) fallList.push([fx, fz, h, width]);
    falls.push({ top: [fx, 0, fz], width: 4 + width * 1.2 + h * 0.1, height: 0.7, yaw: 0, kind: 1, phase: r(), lit: lf });
    falls.push({ top: [fx, 0.07, fz], width: 4.5 + width * 1.3 + h * 0.06, height: 1, kind: 5, phase: ph, lit: lf });
    falls.push({ top: [fx, -0.1, fz], width: 3 + width * 1.5, height: 1.6 + 0.09 * h, kind: 6, phase: ph * 0.9, lit: lf });
    spout.box(ex + ox * 0.5, ez + oz * 0.5, ox, oz, 0.62, width / 2 + 0.3, yT - 0.32, yT + 0.03, chuteC, wetC, concDark);
    spout.box(ex + ox * 0.04, ez + oz * 0.04, ox, oz, 0.07, width / 2 + 0.12, yT + 0.03, yT + 1.52, voidC, voidC);
    return true;
  };
  // D1: five into the pond, two of them flanking the ring 20 m either side (front parapet)
  const tOfX = (x) => (x + 300) / 600;
  addFall(0, tOfX(-20), 1, 2.6); addFall(0, tOfX(20), 1, 2.2); addFall(0, tOfX(-74), 1, 4.2); addFall(0, tOfX(96), 1, 3.4); addFall(0, tOfX(150), -1, 2);
  const want = [[1, 4], [2, 3], [3, 4], [4, 4]];
  for (const [di, n] of want) {
    let made = 0, guard = 0;
    while (made < n && guard++ < 40) {
      const t = rng.range(0.22, 0.8), side = rng() < 0.7 ? 1 : -1, w0 = rng.range(1.5, 5), w = w0 < 2.5 ? w0 * 0.5 : w0 > 4 ? w0 * 1.45 : w0;      // (round 15: threads, columns and broad falls: the same draws, a wider spread of widths)
      if (addFall(di, t, side, w, rng, di > 2 ? 30 : 13)) made++;      // the two high decks' falls stand well off the view's line: seen whole, lip to foot
    }
  }
  // four tall ones placed by hand: off both edges of the outer flyover, 27 m left of the climb as the view rises through the veil, and off
  // the third deck either side of the place where the stoop goes under its fringe; clear of the view's line by 14 m, not of the sight fan
  // (round 15) THE GREAT FALL beside the climb through the veil: off the outer flyover's edge, broad and white, landing 27 m left of
  // the line in a boil of spray that stands 9 m high with a bright plume over it; its neighbour off the other edge is a thread
  if (addFall(3, 0.452, -1, 7.2, xr, -27)) {
    const f = feet[feet.length - 1], lf = Math.max(litAt(f[0], 4, f[2]), 0.5);
    falls.push({ top: [f[0], -0.1, f[2]], width: 17, height: 9, kind: 6, phase: 0.37, lit: lf }, { top: [f[0], -0.1, f[2]], width: 11, height: 5, kind: 6, phase: 0.81, lit: lf },
      { top: [f[0], 2.5, f[2]], width: 12, height: 1.35, kind: 1, phase: 0.23, lit: lf }, { top: [f[0], 0.07, f[2]], width: 16, height: 1, kind: 5, phase: 0.44, lit: lf });
  }
  addFall(3, 0.444, 1, 1.9, xr, -27);
  addFall(2, 0.474, 1, 5, xr, -13.5); addFall(2, 0.532, 1, 3.4, xr, -13.5);      // (the two beside the level run to the ring stay as they were)
  // and two off the top deck's far edge, 47 m down into the water, 30 m and more either side of the view's line as it glides under that deck
  addFall(4, 0.445, -1, 5.6, xr, -30); addFall(4, 0.56, -1, 1.5, xr, -30);
  // and two off the second deck's near edge, which stand either side of the level run to the ring
  addFall(1, 0.47, 1, 3.6, xr, -14); addFall(1, 0.535, 1, 3, xr, -14);
  // THREE FALLS THAT LAND ON A LOWER DECK AND SPILL ON (the brief: 'three land on a lower deck and spill on'): each leaves its deck through
  // a breach, comes down on the carriageway of the deck below in a boil of spray, and goes on over that deck's own edge into the pond.
  // [upper deck, t, side, lower deck, width, the lower deck's t and side where it spills]; hashes only, and the deck-tops rng after its last use
  const spills = [];
  for (const [du, t, side, dl, w, tl, sl] of [[2, 0.620, -1, 1, 3.8, 0.627, 1], [4, 0.672, 1, 3, 3.4, 0.647, 1], [4, 0.352, -1, 2, 3.2, 0.367, 1]]) {
    const U = DECKS[du], Lw = DECKS[dl]; deckPoint(U, t, P);
    const hw = U.w / 2, ox = P.nx * side, oz = P.nz * side, ex = P.x + ox * hw, ez = P.z + oz * hw, x = ex + ox * 1.05, z = ez + oz * 1.05, yT = U.y + 2.4, yL = Lw.y + 2.4, drop = yT - yL;
    const thrown = 0.3 + 0.2 * Math.sqrt(drop + 0.35), fx = x + ox * thrown, fz = z + oz * thrown, lit = Math.max(litAt(fx, yL + drop * 0.5, fz), 0.5), lf = Math.max(litAt(fx, yL + 1.5, fz), 0.4), ph = hsh(fx * 3.1 + fz * 1.7);
    falls.push({ top: [x, yT + 0.05, z], width: w, height: drop + 0.05, yaw: Math.atan2(ox, oz), kind: 4, phase: ph, lit });
    falls.push({ top: [fx, yL, fz], width: 6 + w, height: 0.85, yaw: 0, kind: 1, phase: ph * 0.7 + 0.1, lit: lf }, { top: [fx, yL + 0.09, fz], width: 3.2 + w, height: 1, kind: 5, phase: ph, lit: lf },
      { top: [fx, yL - 0.05, fz], width: 3 + w * 1.3, height: 2.4 + 0.1 * drop, kind: 6, phase: ph * 0.9, lit: lf });
    spout.box(ex + ox * 0.5, ez + oz * 0.5, ox, oz, 0.62, w / 2 + 0.3, yT - 0.32, yT + 0.03, chuteC, wetC, concDark);
    spout.box(ex + ox * 0.04, ez + oz * 0.04, ox, oz, 0.07, w / 2 + 0.12, yT + 0.03, yT + 1.52, voidC, voidC);
    addFall(dl, tl, sl, w * 0.85, xr, -24, false);
    spills.push([fx, yL, fz]);
  }
  // the bead curtain: hangs from D4's near (+Z) edge across the fly line
  deckPoint(DECKS[3], 0.5 + 0.012, P);
  const cs = P.nz > 0 ? 1 : -1, ccx = P.x + P.nx * cs * (DECKS[3].w / 2 + 0.6), ccz = P.z + P.nz * cs * (DECKS[3].w / 2 + 0.6);
  falls.push({ top: [ccx, 37.2, ccz], width: 44, height: 37.4, yaw: Math.atan2(P.nx * cs, P.nz * cs), kind: 2, phase: 0.31, lit: 1 });
  // (and the drops that fall from the wisteria runners hanging in it: a second, lower veil from the height of their tips)
  falls.push({ top: [ccx, 13.4, ccz + 0.7], width: 40, height: 13.5, yaw: Math.atan2(P.nx * cs, P.nz * cs), kind: 2, phase: 0.67, lit: 1 });
  // drizzle (kind 7): after the rain the decks drip from their edges; three faint sheets of it stand one behind the other across the view's
  // line under the two highest decks (the outer flyover's far edge, both edges of the top deck), pale against the soffits and the slate
  for (const [di, t, sd, w, ph] of [[3, 0.5, -1, 72, 0.17], [4, 0.5, 1, 64, 0.52], [4, 0.52, -1, 60, 0.81]]) {
    const d = DECKS[di]; deckPoint(d, t, P); const s2 = (P.nz > 0 ? 1 : -1) * sd;
    falls.push({ top: [P.x + P.nx * s2 * (d.w / 2 + 0.4), d.y + 0.5, P.z + P.nz * s2 * (d.w / 2 + 0.4)], width: w, height: d.y + 0.5, yaw: Math.atan2(P.nx * s2, P.nz * s2), kind: 7, phase: ph, lit: 0.9 });
  }
  const fallSet = makeFallSet(falls, opts.fallLight || {});
  fallSet.mesh.name = 'deck-falls'; object.add(fallSet.mesh);
  await ctx.yield();
  const spouts = new THREE.Mesh(spout.build(), stack.material); spouts.name = 'fall-chutes'; object.add(spouts);
  await ctx.yield();

  const anchors = {
    portalSeat: new THREE.Vector3(0, 3, 0), flyLine: FLY.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    curtain: new THREE.Vector3(ccx, 3, ccz), pondCentre: new THREE.Vector3(0, 0, 60), fallFeet: feet.map((f) => new THREE.Vector3(f[0], f[1], f[2])),
  };
  return {
    object, radius: 330, height: 58, center: new THREE.Vector3(0, 24, 140), anchors, wisteria: wist, falls: fallSet, piers, fallList, stack, spills, lianas,
    update(dt, time, camera) { wist.uniforms.uTime.value = time; fallSet.uniforms.uTime.value = time; if (green3) green3.update(dt, time, camera); },
    dispose() {}, ground: true, groundY: 0,
  };
}

// ---------- the near herd: the deer that run beside the rider, 6 to 35 m from the eye ----------
// A sika deer as one smooth skin (trunk, neck and head lofted along the spine; four legs with a haunch or shoulder running into the
// trunk, a hock or knee, cannon and hoof; ears, tail, and half-grown velvet antlers on the stags), about 1250 triangles. Model frame:
// forward +Z, up +Y, hooves at y 0, back at 1.75 m. Every vertex carries its joints (aJ: pivot y, pivot z, knee y, knee z) and
// weights (aW: part, pivot weight, knee weight, the z it rides the spine at), and the gallop is posed in the vertex shader.
export function deerGeometry() {
  const P = [], N = [], J = [], W = [], I = [];
  const loft = (rings, S) => {
    const base = P.length / 3;
    for (const r of rings) for (let k = 0; k < S; k++) {
      const a = k / S * TAU, cs = Math.cos(a), sn = Math.sin(a), ru = Math.max(r.ru, 1e-3), rv = Math.max(r.rv, 1e-3);
      P.push(r.c[0] + r.u[0] * cs * ru + r.v[0] * sn * rv, r.c[1] + r.u[1] * cs * ru + r.v[1] * sn * rv, r.c[2] + r.u[2] * cs * ru + r.v[2] * sn * rv);
      let nx = r.u[0] * cs / ru + r.v[0] * sn / rv, ny = r.u[1] * cs / ru + r.v[1] * sn / rv, nz = r.u[2] * cs / ru + r.v[2] * sn / rv;
      if (r.n) { nx = r.n[0]; ny = r.n[1]; nz = r.n[2]; }
      const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l);
      J.push(r.j[0], r.j[1], r.j[2], r.j[3]); W.push(r.w[0], r.w[1], r.w[2], r.w[3]);
    }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < S; k++) {
      const a = base + i * S + k, b = base + i * S + (k + 1) % S, c = a + S, d = b + S;
      I.push(a, b, d, a, d, c);
    }
  };
  // trunk, neck and head: stations [z, centre y, half width, half height] along the spine
  const ST = [[-1.05, 1.5, 0.02, 0.03], [-0.99, 1.48, 0.15, 0.19], [-0.85, 1.44, 0.25, 0.3], [-0.62, 1.42, 0.3, 0.35], [-0.3, 1.43, 0.28, 0.31], [0.05, 1.38, 0.31, 0.37],
    [0.38, 1.34, 0.31, 0.42], [0.62, 1.38, 0.27, 0.4], [0.8, 1.5, 0.2, 0.33], [0.93, 1.72, 0.14, 0.24], [1.03, 1.98, 0.105, 0.17], [1.1, 2.22, 0.095, 0.14],
    [1.15, 2.4, 0.1, 0.125], [1.27, 2.47, 0.105, 0.115], [1.42, 2.43, 0.085, 0.095], [1.57, 2.36, 0.055, 0.06], [1.66, 2.32, 0.038, 0.042], [1.69, 2.31, 0.006, 0.008]];
  const NECK = [1.62, 0.86], neckW = (i) => [0, 0.3, 0.6, 0.85][i - 8] ?? (i < 8 ? 0 : 1);
  const body = ST.map((s, i) => {
    const a = ST[Math.max(0, i - 1)], b = ST[Math.min(ST.length - 1, i + 1)]; let ty = b[1] - a[1], tz = b[0] - a[0]; const l = Math.hypot(ty, tz) || 1; ty /= l; tz /= l;
    return { c: [0, s[1], s[0]], u: [1, 0, 0], v: [0, tz, -ty], ru: s[2], rv: s[3], j: [NECK[0], NECK[1], 0, 0], w: [0, neckW(i), 0, Math.min(s[0], NECK[1])] };
  });
  body[0].n = [0, 0, -1]; body[ST.length - 1].n = [0, -0.3, 1];
  loft(body, 10);
  // legs: rings [y, z, half width, half depth, pivot weight, knee weight]; parts 1, 2 hind (left, right), 3, 4 fore
  const HIND = [[1.52, -0.68, 0.15, 0.25, 0, 0], [1.3, -0.66, 0.14, 0.23, 0.5, 0], [1.06, -0.62, 0.1, 0.16, 1, 0], [0.86, -0.72, 0.062, 0.09, 1, 0], [0.7, -0.86, 0.046, 0.062, 1, 0.5],
    [0.52, -0.845, 0.034, 0.038, 1, 1], [0.17, -0.8, 0.031, 0.033, 1, 1], [0.1, -0.79, 0.042, 0.046, 1, 1], [0.03, -0.77, 0.05, 0.055, 1, 1], [0, -0.76, 0.03, 0.035, 1, 1]];
  const FORE = [[1.44, 0.52, 0.14, 0.2, 0, 0], [1.22, 0.55, 0.12, 0.17, 0.55, 0], [1.02, 0.56, 0.082, 0.11, 1, 0], [0.84, 0.56, 0.058, 0.07, 1, 0], [0.67, 0.57, 0.048, 0.054, 1, 0.5],
    [0.52, 0.57, 0.034, 0.037, 1, 1], [0.17, 0.575, 0.031, 0.033, 1, 1], [0.1, 0.585, 0.042, 0.046, 1, 1], [0.03, 0.6, 0.05, 0.055, 1, 1], [0, 0.61, 0.03, 0.035, 1, 1]];
  for (let leg = 0; leg < 4; leg++) {
    const fore = leg > 1, sx = leg % 2 ? 1 : -1, R = fore ? FORE : HIND, hip = fore ? [1.3, 0.55] : [1.36, -0.68], knee = fore ? [0.67, 0.57] : [0.7, -0.86];
    loft(R.map((r) => ({ c: [sx * (0.13 + 0.07 * Math.min(1, r[0] / 1.3)), r[0], r[1]], u: [1, 0, 0], v: [0, 0, 1], ru: r[2], rv: r[3], j: [hip[0], hip[1], knee[0], knee[1]], w: [leg + 1, r[4], r[5], hip[1]] })), 6);
  }
  // tail (part 7): a short white flag
  loft([[1.56, -1.0, 0.045, 0], [1.5, -1.05, 0.055, 0.4], [1.44, -1.08, 0.045, 0.8], [1.39, -1.09, 0.012, 1]].map((r) => ({ c: [0, r[0], r[1]], u: [1, 0, 0], v: [0, 0.35, 0.94], ru: r[2], rv: r[2] * 0.6, j: [1.56, -1.0, 0, 0], w: [7, r[3], 0, -1.0] })), 5);
  // ears (part 5, rigid with the head): a cupped leaf each
  const headJ = [NECK[0], NECK[1], 0, 0];
  for (const sx of [-1, 1]) {
    const o = P.length / 3, B = [sx * 0.1, 2.52, 1.19], d = [sx * 0.74, 0.58, -0.34], wd = [sx * -0.2, 0.5, 0.84], nr = [d[1] * wd[2] - d[2] * wd[1], d[2] * wd[0] - d[0] * wd[2], d[0] * wd[1] - d[1] * wd[0]];
    for (const [t, s, cup] of [[0, 0, 0], [0.42, -1, 0.02], [0.42, 1, 0.02], [0.5, 0, -0.03], [1, 0, 0]]) {
      P.push(B[0] + d[0] * t * 0.27 + wd[0] * s * 0.062 + nr[0] * cup, B[1] + d[1] * t * 0.27 + wd[1] * s * 0.062 + nr[1] * cup, B[2] + d[2] * t * 0.27 + wd[2] * s * 0.062 + nr[2] * cup);
      const l = Math.hypot(nr[0], nr[1], nr[2]) || 1; N.push(nr[0] / l, nr[1] / l, nr[2] / l); J.push(...headJ); W.push(5, 1, 0, NECK[1]);
    }
    I.push(o, o + 1, o + 3, o, o + 3, o + 2, o + 1, o + 4, o + 3, o + 3, o + 4, o + 2);
  }
  // antlers (part 6): beam, brow tine, trez tine and a forked top, swelling into velvet clubs; hinds fold them away in the shader
  const tube = (pts, r0, r1, M, S, club) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), fr = curve.computeFrenetFrames(M, false), rings = [];
    for (let i = 0; i <= M + 1; i++) {
      const t = Math.min(1, i / M), f = Math.min(i, M), c = curve.getPointAt(t), tg = fr.tangents[f];
      const r = i > M ? 0.004 : (r0 + (r1 - r0) * t) * (1 + club * sm(0.6, 0.95, t)), ext = i > M ? r1 * (1 + club) * 0.8 : 0;
      rings.push({ c: [c.x + tg.x * ext, c.y + tg.y * ext, c.z + tg.z * ext], u: fr.normals[f].toArray(), v: fr.binormals[f].toArray(), ru: r, rv: r, j: headJ, w: [6, 1, 0, NECK[1]], n: i > M ? tg.toArray() : null });
    }
    loft(rings, S);
  };
  for (const sx of [-1, 1]) {
    const X = (p) => [sx * p[0], p[1], p[2]], k = sx > 0 ? 0.02 : 0;
    tube([[0.065, 2.52, 1.2], [0.15, 2.76, 1.1], [0.26 + k, 3.02, 1.04], [0.3, 3.26, 1.12 + k], [0.27, 3.44, 1.24]].map(X), 0.036, 0.023, 5, 6, 0.45);
    tube([[0.085, 2.6, 1.2], [0.12, 2.7, 1.36], [0.15, 2.84 + k, 1.46]].map(X), 0.026, 0.018, 2, 4, 0.4);
    tube([[0.235, 2.96, 1.05], [0.3, 3.06, 1.2], [0.33 + k, 3.2, 1.29]].map(X), 0.024, 0.017, 2, 4, 0.4);
    tube([[0.295, 3.24, 1.11], [0.36, 3.37, 1.0], [0.385, 3.5 - k, 0.96]].map(X), 0.023, 0.017, 2, 4, 0.4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aJ', new THREE.Float32BufferAttribute(J, 4)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setIndex(I);
  return g;
}

const DEER_POSE = /* glsl */`
  vec2 rt(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.y * c + v.x * s); }
  // where a leg is in the stride: hind pair first, the fore pair half a stride later, left a little ahead of right (a rotary gallop)
  float legPhase(float leg, float ph){ return ph + step(2.5, leg) * 3.3 + step(0.5, mod(leg, 2.0)) * 0.6; }
`;
const DEER_VERT = /* glsl */`
  attribute vec4 aJ; attribute vec4 aW; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
  uniform float uTime, uStride;
  varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vN0; varying vec4 vK; varying float vFy; varying float vRim;
  #include <fog_pars_vertex>
  ${DEER_POSE}
  void main(){
    float sr = uStride * (0.9 + 0.22 * fract(iB.w * 5.3));                                // (round 15) every animal has its own stride rate
    float part = aW.x, ph = (uTime * sr + iB.x) * 6.2832, air = iC.y, st = iC.z;      // st 1: the animal stands
    vec3 p = position, n = normal; vP = position; vN0 = normal;
    if (part > 0.5 && part < 4.5) {
      // a leg swings from hip or shoulder and folds at hock or knee while it comes forward; in the air the fore legs tuck and the hind legs trail
      float fore = step(2.5, part), th = legPhase(part, ph), fold = max(0.0, -cos(th)); fold = fold * (2.0 - fold);
      float a1 = mix(mix(mix(0.1, -0.12, fore) + mix(0.72, 0.8, fore) * sin(th), mix(0.95, -1.0, fore), air), mix(-0.07, 0.05, fore) + 0.05 * (mod(part, 2.0) - 0.5), st);
      float a2 = mix(mix(-1.2, 1.55, fore) * fold, mix(-0.25, 1.5, fore), air) * (1.0 - st);
      p.yz = aJ.zw + rt(p.yz - aJ.zw, a2 * aW.z); n.yz = rt(n.yz, a2 * aW.z);
      p.yz = aJ.xy + rt(p.yz - aJ.xy, a1 * aW.y); n.yz = rt(n.yz, a1 * aW.y);
    } else if (part > 6.5) {
      float fl = mix(0.5 + 0.2 * sin(ph * 2.0 + iB.w * 9.0), 0.12 + 0.3 * max(sin(uTime * 2.1 + iB.w * 9.0), 0.0), st) * aW.y;      // the tail hangs a little below the back line and flicks
      p.yz = aJ.xy + rt(p.yz - aJ.xy, fl); n.yz = rt(n.yz, fl);
    } else {
      // (a standing stag carries a full rack, iC.w more than the herd's half-grown one, scaled about the crown of the head)
      if (part > 5.5) { p = vec3(0.0, 2.5, 1.2) + (p - vec3(0.0, 2.5, 1.2)) * (1.0 + iC.w); p.x *= 1.0 + 0.55 * (fract(iB.w * 9.7 + 0.25) - 0.3); }      // (and its own spread of antler)
      float nod = (mix(0.09 * sin(ph + 0.9) - 0.12 * air, -0.1 + 0.05 * sin(uTime * 0.45 + iB.w * 5.0), st) + iD.z) * aW.y;      // neck and head reach forward with every stride; standing, the head is up and lifts slowly
      p.yz = aJ.xy + rt(p.yz - aJ.xy, nod); n.yz = rt(n.yz, nod);
      // the head turns: neck and head swing about the vertical through the base of the neck (iD.x, radians; positive toward the animal's right)
      float yw = iD.x * aW.y; p.xz = vec2(0.0, 0.86) + rt(p.xz - vec2(0.0, 0.86), yw); n.xz = rt(n.xz, yw);
      if (part > 5.5 && iB.z < 0.5) p = vec3(0.0, 2.44, 1.22);                           // a hind carries no antlers
    }
    // the spine: the back arches as the legs gather under it and stretches as they reach
    float s1 = sin(ph + 0.3), fa = (0.13 * smoothstep(0.1, -0.8, aW.w) - 0.07 * smoothstep(0.1, 0.8, aW.w)) * s1 * (1.0 - 0.6 * air) * (1.0 - st);
    p.yz = vec2(1.42, 0.1) + rt(p.yz - vec2(1.42, 0.1), fa); n.yz = rt(n.yz, fa);
    float pitch = 0.06 * sin(ph + 1.5) * (1.0 - air) * (1.0 - st) + iC.x;
    p.yz = vec2(1.3, 0.0) + rt(p.yz - vec2(1.3, 0.0), pitch); n.yz = rt(n.yz, pitch);
    p.y += (0.1 * sin(ph + 2.2) + 0.03) * (1.0 - air) * (1.0 - st);
    p *= iB.y;
    float ch = cos(iA.w), sh = sin(iA.w);
    vec3 wp = vec3(p.x * ch + p.z * sh, p.y, p.z * ch - p.x * sh) + iA.xyz;
    vW = wp; vN = vec3(n.x * ch + n.z * sh, n.y, n.z * ch - n.x * sh); vK = vec4(part, iB.z, iB.w, iB.y); vRim = iD.y;
    #ifdef MIRROR
      wp.y = -wp.y; wp.xz += vec2(sin(uTime * 2.3 + wp.y * 2.6 + wp.x), cos(uTime * 1.9 + wp.y * 3.1 + wp.z)) * 0.06 * clamp(-wp.y, 0.0, 2.0);
    #endif
    vFy = wp.y;
    vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
// the coat: chestnut with rows of pale spots along back and flanks, a dark stripe down the spine, cream belly, throat and inner legs,
// the white rump patch in its dark frame, dark shanks and hooves, a dark nose and eye; lit by the world's sun mask where the animal is
const deerFrag = (common) => /* glsl */`
  ${common}
  uniform vec3 uCoat, uCoatDk, uPale, uVelvet; uniform float uRimK, uPads;
  varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vN0; varying vec4 vK; varying float vFy; varying float vRim;
  #include <fog_pars_fragment>
  float spots(vec2 q, float seed){
    vec2 id = floor(q), f = fract(q) - 0.5 - (vec2(h21(id + seed), h21(id + seed + 3.7)) - 0.5) * 0.36;
    return smoothstep(0.3, 0.19, length(f)) * step(0.22, h21(id + seed + 9.1));
  }
  #ifdef MIRROR
  // where a lily pad lies (the water sheet's own pad field, cell for cell): a leaf gives back no stag
  float padAt(vec2 w){
    vec2 lp = stackXZ(w); float pond = 1.0 - smoothstep(0.75, 1.0, length((lp - vec2(0.0, 60.0)) / vec2(78.0, 68.0)));
    vec2 lc = floor(lp / 1.7), lf = fract(lp / 1.7) - 0.5; float lh = h21(lc + 11.0), rad = 0.36 * (0.5 + 0.9 * h21(lc + 0.7));
    vec2 off = (vec2(h21(lc + 2.3), h21(lc + 5.9)) - 0.5) * (0.96 - 2.0 * rad), ld = lf - off + vec2(sin(uTime * 0.7 + lh * 20.0), cos(uTime * 0.6 + lh * 9.0)) * 0.012;
    float lpatch = smoothstep(0.3, 0.52, vn(lp * 0.045 + 3.0));
    lpatch = max(lpatch, 0.62 * (1.0 - smoothstep(9.0, 24.0, abs(lp.x))) * smoothstep(-4.0, 10.0, lp.y) * (1.0 - smoothstep(120.0, 160.0, lp.y)) * smoothstep(0.25, 0.5, vn(lp * 0.21 + 7.0) + 0.25));
    float band2 = (1.0 - smoothstep(30.0, 62.0, abs(lp.x - 4.0))) * smoothstep(150.0, 168.0, lp.y) * (1.0 - smoothstep(205.0, 228.0, lp.y)) * smoothstep(0.3, 0.55, vn(lp * 0.13 + 5.0) * 0.6 + vn(lp * 0.37) * 0.4 + 0.12);
    float want = step(1.0 - max((0.66 * pond + 0.12) * lpatch, 0.6 * band2) * uPads * step(length(lp - vec2(0.0, 80.0)), 190.0), lh);
    float rn = length(ld) / max(rad, 1e-3), la = atan(ld.y, ld.x + 1e-5) + lh * 40.0;
    return want * (1.0 - smoothstep(0.94, 1.04, rn)) * (1.0 - smoothstep(0.9, 0.96, cos(la)) * step(0.12, rn));
  }
  #endif
  void main(){
    #ifdef MIRROR
      if (vFy > 0.0) discard;
      float kY = cameraPosition.y / max(cameraPosition.y - vFy, 1e-3); vec2 hx = mix(cameraPosition.xz, vW.xz, kY);
      if ((hx.x > -32.0 && hx.x < 18.0 && hx.y > 48.0 && hx.y < 62.0) || (hx.x > -2.0 && hx.x < 14.0 && hx.y > 20.0 && hx.y <= 48.0)) discard;
    #endif
    float part = vK.x, seed = vK.z; vec3 p = vP, n0 = normalize(vN0 + vec3(0.0, 1e-5, 0.0));
    vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)); vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
    if (dot(n, V) < 0.0) n = -n;
    float fz = vn(p.zy * 38.0 + p.x * 21.0), fz2 = vn(p.zy * 7.0 + seed * 17.0);
    // (round 15) every animal its own coat: tone from dark to pale, a lean toward red or toward grey, spots bold on some and nearly gone on others
    float tn1 = fract(seed * 7.3), tn2 = fract(seed * 13.1), spotK = mix(0.25, 1.0, smoothstep(0.12, 0.5, fract(seed * 3.71))), spotS = 6.2 + 2.6 * fract(seed * 5.3);
    vec3 coat = mix(uCoatDk, uCoat, 0.4 + 0.6 * fz2) * (0.86 + 0.28 * fz) * (0.7 + 0.55 * tn1) * mix(vec3(1.0), tn2 > 0.5 ? vec3(1.14, 0.9, 0.74) : vec3(0.88, 0.94, 1.0), abs(tn2 - 0.5) * 1.3), alb = coat;
    float ao = 1.0, sheen = 0.5, keep = 0.0, glint = 0.0;
    if (part < 0.5) {
      vec2 ar = n0.xy; if (dot(ar, ar) < 1e-6) ar = vec2(0.0, 1.0);
      float trunk = 1.0 - smoothstep(0.72, 0.92, p.z), around = atan(ar.x, ar.y), aa = abs(around);
      float sp = spotK * spots(vec2(p.z * spotS, around * 2.7 * spotS / 7.2), seed * 31.0) * smoothstep(0.16, 0.34, aa) * (1.0 - smoothstep(1.45, 1.95, aa)) * smoothstep(-0.97, -0.82, p.z) * trunk;
      float row = smoothstep(0.3, 0.19, length(vec2(fract(p.z * 7.2 + 0.5) - 0.5, (aa - 0.27) * 2.7))) * trunk * smoothstep(-0.9, -0.75, p.z);   // the row beside the spine
      alb = mix(alb, uPale * 1.12, max(sp, row) * 0.8);
      alb = mix(alb, uCoatDk * 0.42, (1.0 - smoothstep(0.07, 0.17, aa)) * smoothstep(-0.95, -0.8, p.z) * (1.0 - smoothstep(2.2, 2.45, p.y)) * 0.85);   // dorsal stripe, up the nape
      alb = mix(alb, uPale, smoothstep(-0.25, -0.75, n0.y) * trunk);                                                                                  // belly
      alb = mix(alb, uPale * 0.92, (1.0 - trunk) * smoothstep(0.15, 0.7, n0.z - n0.y * 0.6) * (1.0 - smoothstep(2.05, 2.3, p.y)) * 0.55);            // throat
      float rump = smoothstep(-0.1, -0.85, n0.z) * step(p.z, -0.6) * smoothstep(1.05, 1.3, p.y) * (1.0 - 0.6 * smoothstep(1.48, 1.62, p.y)) * (0.75 + 0.25 * fz2);
      alb = mix(alb, uCoatDk * 0.4, smoothstep(-0.05, -0.3, n0.z) * step(p.z, -0.6) * (1.0 - rump) * 0.7);
      alb = mix(alb, vec3(0.8, 0.76, 0.68), rump); keep = max(rump, max(sp, row));
      alb = mix(alb, uPale, smoothstep(-0.2, -0.7, n0.y) * step(1.2, p.z) * 0.7);                                                                    // chin
      alb = mix(alb, vec3(0.025, 0.02, 0.02), smoothstep(1.585, 1.64, p.z));                                                                         // nose
      float eyeD = length(vec3((abs(p.x) - 0.094) * 0.6, p.y - 2.485, p.z - 1.315)), eye = 1.0 - smoothstep(0.03, 0.04, eyeD);
      alb = mix(alb, uPale * 1.05, (1.0 - smoothstep(0.05, 0.075, eyeD)) * 0.6);                                                                     // the pale ring round the eye
      alb = mix(alb, uPale * 0.95, smoothstep(1.47, 1.53, p.z) * (1.0 - smoothstep(1.56, 1.6, p.z)) * 0.6);                                          // the pale band behind the nose
      alb = mix(alb, uCoatDk * 0.5, (1.0 - smoothstep(0.02, 0.06, abs(p.x))) * smoothstep(1.2, 1.3, p.z) * smoothstep(0.2, 0.7, n0.y) * 0.6);        // a dark blaze down the brow
      alb = mix(alb, vec3(0.012), eye); sheen = mix(sheen, 3.0, eye);
      glint = eye * (1.0 - smoothstep(0.006, 0.014, length(vec2(p.y - 2.497, p.z - 1.325))));
      ao = mix(0.6, 1.0, smoothstep(-0.95, 0.1, n0.y));
    } else if (part < 4.5) {
      float inner = smoothstep(0.15, 0.7, -n0.x * sign(p.x));
      alb = mix(alb, uPale * 1.12, spots(vec2(p.z * 7.2, p.y * 7.2), seed * 31.0 + 5.0) * smoothstep(1.05, 1.25, p.y) * (1.0 - inner) * 0.8);
      alb = mix(alb, uPale, inner * 0.65 * smoothstep(0.55, 1.0, p.y));
      alb = mix(alb, uCoatDk * 0.6, (1.0 - smoothstep(0.3, 0.8, p.y)) * 0.7);
      alb = mix(alb, vec3(0.05), 1.0 - smoothstep(0.07, 0.11, p.y));
      ao = mix(0.72, 1.0, smoothstep(0.5, 1.5, p.y) * (1.0 - 0.5 * inner));
    } else if (part < 5.5) {
      alb = coat * 0.86;
    } else if (part < 6.5) {
      alb = uVelvet * (0.8 + 0.4 * fz); sheen = 1.4;
    } else {
      alb = mix(vec3(0.78, 0.74, 0.66), uCoatDk * 0.5, max(smoothstep(0.1, 0.7, n0.y), 1.0 - smoothstep(0.0, 0.03, abs(p.x))));      // a dark line down its middle
    }
    alb *= mix(0.62, 1.0, smoothstep(0.15, 0.7, vW.y));                                       // wet to the knees
    float lit = max(sunMask(vec3(vW.x, max(vW.y, 0.1), vW.z)), 0.06), wrap0 = 0.0;
    alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(0.98, 0.97, 1.02), 0.2 * (1.0 - lit));          // in shade the chestnut cools a little, as the kit herd's does beside it
    alb *= 1.0 - 0.45 * (1.0 - lit) * keep;                                                   // spots and rump are shaded with the coat: no dots that glow in a deck's shadow
    float wrap = clamp(dot(n, uSunDir) * 0.62 + 0.38, 0.0, 1.0);
    vec3 sky = uAmbCol * (0.72 + 0.43 * n.y) + (uAmbCol * 0.3 + uSunCol * 0.14 * lit) * vec3(0.72, 0.86, 0.76) * clamp(-n.y, 0.0, 1.0);   // and the light off the water
    vec3 skyD = mix(sky, vec3(dot(sky, vec3(0.333))), 0.4 * (1.0 - lit));                                   // a less violet ambient in shade
    vec3 col = alb * (skyD * ao * (1.0 + 1.4 * (1.0 - lit)) + uSunCol * wrap * wrap * lit);
    float rim = pow(max(1.0 - abs(dot(n, V)), 0.0), 2.4);
    col += (uAmbCol * 0.2 + uSunCol * 0.3 * lit) * rim * (0.35 + 0.65 * fz) * sheen * vec3(1.0, 0.86, 0.72) * uRimK * (1.0 + 1.6 * vRim);      // the coat's nap against the light
    col += uSunCol * vec3(1.0, 0.9, 0.78) * 0.34 * vRim * pow(max(1.0 - abs(dot(n, V)), 0.0), 3.2) * (0.3 + 0.7 * lit) * smoothstep(-0.5, 0.3, n.y);      // the hero's outline burns: a rim of low sun along back, neck and antlers
    col += (uAmbCol * 1.2 + uSunCol * 0.9 * lit) * glint;                                                                                                   // the light in its eye
    float alpha = 1.0;
    #ifdef MIRROR
      // how much of the animal the water gives back: little looking down beside us, nearly all of it toward grazing
      float gz = 1.0 - clamp(cameraPosition.y / max(length(cameraPosition - vec3(hx.x, 0.0, hx.y)), 1e-3), 0.0, 1.0);
      alpha = mix(0.32, 0.9, gz * gz * gz) * (1.0 - 0.94 * padAt(hx)); col *= vec3(0.66, 0.72, 0.8);
    #endif
    gl_FragColor = vec4(max(col, vec3(0.0)), alpha);
    #include <fog_fragment>
  }`;

// o: { count, common (the world's GLSL: sunMask and its uniforms), shared (those uniforms), fogU(), sizes, stags, phases, seeds, strideLen,
//      shadowK, coat, coatDark, pale, velvet }. The world places every animal each frame: set(i, x, y, z, heading, pitch, air), then commit().
// Three draws: the animals, the same animals flipped under the water sheet (drawn straight after it, only where they lie behind it), and
// per animal a shadow thrown ahead along the sun ray, a torn V of foam behind it and a short splash left at each hoof strike.
export function makeNearDeer(o) {
  const n = o.count, g = o.geometry || deerGeometry(), C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);      // o.geometry: a deerGeometry() the world built in a step of its own
  const iA = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), iB = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), iC = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  const iD = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  iA.setUsage(THREE.DynamicDrawUsage); iC.setUsage(THREE.DynamicDrawUsage); iD.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < n; i++) { iB.setXYZW(i, o.phases[i], o.sizes[i], o.stags[i] ? 1 : 0, o.seeds[i]); iA.setXYZW(i, 0, -50, 0, 0); }
  g.setAttribute('iA', iA); g.setAttribute('iB', iB); g.setAttribute('iC', iC); g.setAttribute('iD', iD); g.instanceCount = n;
  const uniforms = { uShMin: { value: 0.5 }, ...o.fogU(), ...o.shared, uStride: { value: 2.6 }, uStrideLen: { value: o.strideLen ?? 8.8 }, uShadowK: { value: o.shadowK ?? 0.5 }, uRimK: { value: o.rimK ?? 1 }, uPads: o.padsU || { value: 1 },
    uCoat: { value: C(o.coat || '#9c6038') }, uCoatDk: { value: C(o.coatDark || '#684028') }, uPale: { value: C(o.pale || '#e2d2b4') }, uVelvet: { value: C(o.velvet || '#8A6A58') } };
  const frag = deerFrag(o.common);
  const mat = new THREE.ShaderMaterial({ uniforms, fog: true, side: THREE.DoubleSide, vertexShader: DEER_VERT, fragmentShader: frag });
  // (the mirror stays in the opaque pass, straight after the sheet, and blends there: later in the frame it would paint over what stands in front)
  const matM = new THREE.ShaderMaterial({ uniforms, fog: true, side: THREE.DoubleSide, defines: { MIRROR: 1 }, depthFunc: THREE.GreaterDepth, depthWrite: false, vertexShader: DEER_VERT, fragmentShader: frag,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation });
  const deer = new THREE.Mesh(g, mat); deer.frustumCulled = false; deer.name = 'near-deer';
  const mirror = new THREE.Mesh(g, matM); mirror.frustumCulled = false; mirror.renderOrder = -0.3; mirror.name = 'near-deer-mirror';
  // shadow (aK 2), wake (0) and four hoof splashes (3..6)
  const wp = [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 1, 0, 1, -1, 0, 1], wk = [2, 2, 2, 2, 0, 0, 0, 0], wi = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
  for (let l = 0; l < 4; l++) { const b = wp.length / 3; wp.push(-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0); wk.push(3 + l, 3 + l, 3 + l, 3 + l); wi.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  for (let l = 0; l < 6; l++) { const b = wp.length / 3; wp.push(-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1); wk.push(7 + l, 7 + l, 7 + l, 7 + l); wi.push(b, b + 1, b + 2, b, b + 2, b + 3); }      // hoof rings (7..12)
  const wg = new THREE.InstancedBufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('aK', new THREE.Float32BufferAttribute(wk, 1)); wg.setIndex(wi);
  wg.setAttribute('iA', iA); wg.setAttribute('iB', iB); wg.setAttribute('iC', iC); wg.setAttribute('iD', iD); wg.instanceCount = n;
  const wmat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD; attribute float aK;
      uniform float uTime, uStride, uStrideLen, uShMin; uniform vec3 uSunDir;
      varying vec2 vQ; varying float vK; varying vec3 vW; varying float vSeed; varying float vT;
      #include <fog_pars_vertex>
      ${DEER_POSE}
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 Fw = vec2(sin(iA.w), cos(iA.w)), X = vec2(-Fw.y, Fw.x); vec3 P = iA.xyz; float sz = iB.y;
        float sr = uStride * (0.9 + 0.22 * fract(iB.w * 5.3));
        float wet = 1.0 - smoothstep(-0.1, 0.5, P.y), ph = (uTime * sr + iB.x) * 6.2832;      // no foam while the animal is in the air
        vK = aK; vSeed = iB.w; vT = 1.0; vec4 mvPosition;
        if (aK > 1.5 && aK < 2.5) {
          // the shadow: from under the animal to where its back and head fall, drawn out by a low sun, sliding ahead as it leaps
          float sl = length(uSunDir.xz), body = sz * 1.5, lift = max(P.y, 0.0) + 0.25, tanE = max(uSunDir.y / max(sl, 1e-3), max(uShMin, 0.1)), reach = body * 0.8 / tanE;      // (uShMin: how long a low sun may draw a shadow out)
          vec2 sd = sl > 1e-3 ? -uSunDir.xz / sl : vec2(0.0, -1.0), sx = vec2(sd.y, -sd.x);
          vQ = position.xz; vT = 1.0 - 0.5 * smoothstep(0.5, 3.0, lift);
          vec2 xz = P.xz + sd * (lift / tanE + reach * 0.5 + position.z * (reach * 0.5 + body * 0.75)) + sx * position.x * body * 0.6;
          vW = vec3(xz.x, 0.04, xz.y); mvPosition = viewMatrix * vec4(vW, 1.0);
        } else if (aK < 0.5) {
          vQ = position.xz; float sc = sz * wet, airW = smoothstep(4.5, 12.0, cameraPosition.y);      // (from the air the wake is drawn out long and white)
          vec2 xz = P.xz - Fw * (position.z * 3.6 * (1.0 + 0.7 * airW) - 0.8) * sc + X * position.x * (0.55 + position.z * 0.75) * (1.0 + 0.3 * airW) * sc;      // (a short churned patch: the long V it used to draw lay across the legs of the animal behind as white streaks)
          vW = vec3(xz.x, 0.05, xz.y); mvPosition = viewMatrix * vec4(vW, 1.0);
        } else if (aK > 6.5) {
          // hoof rings: two are born with every stride where the hooves went in and stay there, widening, while the animal runs on;
          // six are on the water behind each animal at any moment
          float gi = aK - 7.0, age = fract((uTime * sr * 2.0 + gi) / 6.0 + iB.x), back = uStrideLen * 3.0 * age;      // a ring lives three strides
          vec2 c = P.xz - Fw * back + X * (h21(vec2(gi + 1.0, floor((uTime * sr * 2.0 + gi) / 6.0 + iB.x) + iB.w * 9.0)) - 0.5) * 0.7 * sz;
          float r = sz * (0.2 + 1.45 * pow(age, 0.7)) * wet * (0.75 + 0.5 * h21(vec2(gi + 3.0, iB.w * 17.0)));
          vQ = position.xz * 1.12; vT = age; vW = vec3(c.x + position.x * r * 1.12, 0.045, c.y + position.z * r * 1.12);
          mvPosition = viewMatrix * vec4(vW, 1.0);
        } else {
          // a hoof strikes when its leg is furthest forward; the splash stays where the hoof went in while the animal runs on
          float leg = aK - 2.0, fore = step(2.5, leg), tau = fract(legPhase(leg, ph) / 6.2832 - 0.75);
          vec2 base = P.xz + Fw * (mix(-0.05, 1.25, fore) * sz - uStrideLen * tau) + X * (mod(leg, 2.0) < 0.5 ? -0.17 : 0.17) * sz;
          vQ = position.xy; vT = tau / 0.46; vW = vec3(base.x, 0.0, base.y);
          float s = sz * (1.0 + 0.7 * iD.y) * wet * (0.5 + 0.8 * sqrt(min(vT, 1.0))) * step(tau, 0.46);      // (the great stag throws a taller sheet: iD.y)                           // (no higher than the hock: a splash never crosses the body)
          mvPosition = viewMatrix * vec4(vW, 1.0); mvPosition.xy += vec2(position.x * 0.72, position.y * 0.62) * s;
        }
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${o.common}
      uniform float uShadowK;
      varying vec2 vQ; varying float vK; varying vec3 vW; varying float vSeed; varying float vT;
      #include <fog_pars_fragment>
      void main(){
        float a, u = vQ.x, v = vQ.y, lit = sunMask(vW);
        if (vK > 1.5 && vK < 2.5) {
          if ((vW.x > -32.5 && vW.x < 18.5 && vW.z > 47.5 && vW.z < 62.5) || (vW.x > -2.5 && vW.x < 14.5 && vW.z > 19.5 && vW.z <= 48.0)) discard;
          a = (1.0 - smoothstep(0.25, 1.0, length(vQ))) * uShadowK * lit * vT;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(0.03, 0.05, 0.09) * uAmbCol * 2.0, a);
          #include <fog_fragment>
          return;
        }
        if (vK < 0.5) {
          // the wake: two torn arms of foam opening behind the animal and a churned patch between them
          // (a churned patch of foam behind the hooves that breaks into flecks as it falls astern: round cells, no drawn lines)
          float churn = exp(-(u * u * 3.2 + (v - 0.42) * (v - 0.42) * 8.0));
          float n = vn(vW.xz * 4.6 + vec2(0.0, uTime * 1.1)) * 0.55 + vn(vW.xz * 11.0 - uTime * 0.7) * 0.45;
          a = clamp(churn * (0.2 + 1.5 * smoothstep(0.4, 0.72, n)) - 0.2 + 0.2 * churn * smoothstep(4.5, 12.0, cameraPosition.y), 0.0, 1.0) * (1.0 - v) * (0.5 + 0.5 * lit) * 0.8;
        } else if (vK > 6.5) {
          // a hoof ring: a pale crest with a dark trough inside it and a fainter ring within, fading as it widens; broken round its rim
          if ((vW.x > -32.5 && vW.x < 18.5 && vW.z > 47.5 && vW.z < 62.5) || (vW.x > -2.5 && vW.x < 14.5 && vW.z > 19.5 && vW.z <= 48.0)) discard;
          float rn = length(vQ), ang = atan(u, v + 1e-4), fade = (1.0 - vT) * sqrt(1.0 - vT) * smoothstep(0.0, 0.06, vT) * (0.15 + 0.85 * smoothstep(0.25, 0.7, vn(vec2(ang * 2.2 + vSeed * 9.0, vT * 3.0 + vSeed * 5.0))));      // arcs of a ring, never a drawn circle
          float c1 = (rn - 1.0) / 0.05, c2 = (rn - 0.62) / 0.045, t1 = (rn - 0.9) / 0.06;
          float crest = exp(-c1 * c1) + 0.45 * exp(-c2 * c2), trough = exp(-t1 * t1);
          a = clamp(crest * 0.42 + trough * 0.26, 0.0, 1.0) * fade;
          if (a < 0.01) discard;
          gl_FragColor = vec4(mix(vec3(0.03, 0.05, 0.08) * uAmbCol * 2.0, uAmbCol * 0.85 + uSunCol * 0.55 * lit, clamp(crest * 0.42 / max(crest * 0.42 + trough * 0.26, 1e-3), 0.0, 1.0)), a);
          #include <fog_fragment>
          return;
        } else {
          // the splash: a crown of water thrown up and outward that tears into drops as it ages; never beads on spokes
          // a short sheet of water thrown up where the hoof went in, torn along its top, and round drops flung out beyond it on their
          // own arcs, each catching the light: never rays drawn across the animal
          float k = clamp(vT, 0.0, 1.0), r = length(vec2(u, v * 1.2)), ang = atan(u, v + 1e-3), rn = r / (0.32 + 0.68 * sqrt(k));
          float crown = smoothstep(0.08, 0.2, rn) * (1.0 - smoothstep(0.4, 0.6, rn)) * (1.0 - smoothstep(0.7, 1.25, abs(ang)));
          float torn = smoothstep(0.3 + 0.3 * k, 0.6 + 0.3 * k, vn(vec2(ang * 4.0 + vSeed * 31.0, rn * 3.0 - k * 2.0)));
          vec2 dq = vec2(ang * 4.2 + vSeed * 13.0, rn * 5.5 - k * 2.4), di = floor(dq), df = fract(dq) - 0.5; float dh = h21(di + vSeed * 7.0);
          float drop = (1.0 - smoothstep(0.1, 0.25, length(df - (vec2(dh, h21(di + 3.1)) - 0.5) * 0.5))) * step(0.42, dh) * smoothstep(0.34, 0.52, rn) * (1.0 - smoothstep(0.9, 1.04, rn)) * (1.0 - smoothstep(0.9, 1.4, abs(ang)));
          a = min((crown * torn * 0.8 * (1.0 - k) + drop * 0.95 + exp(-r * r * 22.0) * 0.5 * (1.0 - k)) * (1.0 - k * k), 1.0);
        }
        if (a < 0.01) discard;
        vec3 col = mix(uAmbCol * 0.95, uAmbCol * 0.65 + uSunCol * 1.05, lit);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const wake = new THREE.Mesh(wg, wmat); wake.frustumCulled = false; wake.renderOrder = 2; wake.name = 'near-deer-wake';
  const object = new THREE.Group(); object.name = 'near-herd'; object.add(mirror, deer, wake);
  return {
    object, count: n, uniforms, triangles: g.index.count / 3 * n,
    set(i, x, y, z, heading, pitch, air, stand = 0, rack = 0) { iA.setXYZW(i, x, y, z, heading); iC.setXYZW(i, pitch, air, stand, rack); },
    setHead(i, yaw, rim, toss = 0) { iD.setXYZW(i, yaw, rim, toss, 0); },      // toss: the head thrown up (radians, negative = up)      // the head's turn (radians, positive toward the animal's right) and the hero's rim of light
    commit() { iA.needsUpdate = true; iC.needsUpdate = true; iD.needsUpdate = true; },
  };
}
