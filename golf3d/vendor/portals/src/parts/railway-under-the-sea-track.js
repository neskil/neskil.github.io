// railway-under-the-sea: the TRACK (film worlds D; part 7a of the design). One single narrow line lying UNDER a
// sea a hand deep: a pale ballast bank, dark tarred sleepers and two steel rails (all under water: noMirror), and,
// standing IN the sea beside it, a row of pricken (the tidal flats' own way marks: young birches set in the bed
// with their twigs left on), two still semaphore posts and short white marker posts (all carried straight down
// through the water to y = -0.6; mirrored by the world). No pole, no cross-arm, no wire anywhere.
// Every number of place is read from the law of the line (railway-under-the-sea-line.js); the sizes of the things
// themselves (a sleeper, a rail, a pricke) are the design's and are named once below.
// Said at the head:
// - Nothing here moves and nothing is lettered. The semaphore arm is fixed at rest; its one lit glass is steady.
// - Filtering by a pixel's footprint (the one use made of the eye): the sleepers' stripes melt into their own mean
//   colour where a pixel covers more than the gap between two sleepers, the rails and the twigs are never drawn
//   under about a pixel and a half wide (they pale instead), and the gravel's grain fades with its footprint.
// - Within 30 m of the ring (level distance) no pricke and no marker post stands. The row of pricken ends before
//   the halt: from there to the ring nothing upright runs beside the line.
// - Draw order for the world's joiner: the three under-water meshes write NO depth and are laid one over the other
//   in the see-through pass (bank -3, sleepers -2, rails -1: after the bed, before the sea), so that the sea is
//   never tested against a thing a few centimetres under it (across a sea plane of two great triangles the
//   software renderer's depth is out by decimetres in places, and the track came up through the water there).
//   The twigs are see-through ribbons drawn after the sea (renderOrder 10).
import * as THREE from 'three';
import { LEVEL, GAUGE, BANK, LINE, PRICKEN, SEMAPHORES, RING, lineX, lineSlope, lineHeading, beside } from './railway-under-the-sea-line.js';

const STEP = 2;                                            // metres of line per step of the sweep (the S reads smooth)
const PITCH = 0.65;                                        // one sleeper every 0.65 m
const SLEEPER = { length: 2.3, width: 0.24, thick: 0.14 };
const RAIL = { head: 0.07, tall: LEVEL.railHead - LEVEL.sleeperTop, foot: 0.11 };
const FOOT = -0.6;                                         // every standing thing is carried down to here, under the bed
const MARKER = { off: -2.6, z0: -50, z1: -1350, spacing: 50, tall: 0.75 };   // the first stands 50 m beyond the entry: none in or behind the entry's tube
const RING_CLEAR = 30;                                     // nothing of this part stands nearer the ring than this
const col = (hex) => new THREE.Color(hex);                 // linear working colour

// ---- a small gatherer of lit, vertex-coloured forms (turned forms and box-section beams), under one matrix
function makeAcc() {
  const P = [], N = [], C = [], I = [];
  const m = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3(), w = new THREE.Vector3();
  const vert = (x, y, z, nx, ny, nz, c) => {
    v.set(x, y, z).applyMatrix4(m); w.set(nx, ny, nz).applyMatrix3(nm);
    const l = w.length() || 1;
    P.push(v.x, v.y, v.z); N.push(w.x / l, w.y / l, w.z / l); C.push(c.r, c.g, c.b);
    return P.length / 3 - 1;
  };
  const face = (p0, p1, p2, p3, n, c) => {                 // a flat four-sided face, wound to its normal
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    const flip = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0;
    const a = vert(p0[0], p0[1], p0[2], n[0], n[1], n[2], c), b = vert(p1[0], p1[1], p1[2], n[0], n[1], n[2], c);
    const d = vert(p2[0], p2[1], p2[2], n[0], n[1], n[2], c), e = vert(p3[0], p3[1], p3[2], n[0], n[1], n[2], c);
    if (flip) I.push(a, e, d, a, d, b); else I.push(a, b, d, a, d, e);
  };
  return {
    setMatrix(mat) { m.copy(mat); nm.getNormalMatrix(m); },
    point(x, y, z) { v.set(x, y, z).applyMatrix4(m); return [v.x, v.y, v.z]; },
    // a turned form about the upright through (x0, z0): rings of [y, radius, colour], bottom to top
    lathe(x0, z0, rings, sides, flat = false, turn = 0) {
      for (let k = 0; k < rings.length - 1; k++) {
        const [y0, r0, c0] = rings[k], [y1, r1, c1] = rings[k + 1], dy = y1 - y0, dr = r1 - r0;
        if (Math.abs(dy) < 1e-6 && Math.abs(dr) < 1e-6) continue;
        for (let j = 0; j < sides; j++) {
          const a0 = turn + (j / sides) * Math.PI * 2, a1 = turn + ((j + 1) / sides) * Math.PI * 2, am = (a0 + a1) / 2;
          const n0 = flat ? am : a0, n1 = flat ? am : a1;
          const A = vert(x0 + r0 * Math.cos(a0), y0, z0 + r0 * Math.sin(a0), Math.cos(n0) * dy, -dr, Math.sin(n0) * dy, c0);
          const B = vert(x0 + r0 * Math.cos(a1), y0, z0 + r0 * Math.sin(a1), Math.cos(n1) * dy, -dr, Math.sin(n1) * dy, c0);
          const Cc = vert(x0 + r1 * Math.cos(a1), y1, z0 + r1 * Math.sin(a1), Math.cos(n1) * dy, -dr, Math.sin(n1) * dy, c1);
          const D = vert(x0 + r1 * Math.cos(a0), y1, z0 + r1 * Math.sin(a0), Math.cos(n0) * dy, -dr, Math.sin(n0) * dy, c1);
          if (r1 > 1e-6) I.push(A, D, Cc);
          if (r0 > 1e-6) I.push(A, Cc, B);
        }
      }
    },
    // a box-section beam from a to b (the centres of its end faces): wd across, hd deep (for a level beam hd is its height)
    beam(a, b, wd, hd, c, ends = true) {
      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      let ux, uy, uz;
      if (Math.abs(dy) > 0.999) { ux = 1; uy = 0; uz = 0; } else { ux = dz; uy = 0; uz = -dx; const ul = Math.hypot(ux, uz); ux /= ul; uz /= ul; }
      const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
      const hw = wd / 2, hh = hd / 2;
      const at = (p, su, sv) => [p[0] + ux * hw * su + vx * hh * sv, p[1] + uy * hw * su + vy * hh * sv, p[2] + uz * hw * su + vz * hh * sv];
      face(at(a, 1, -1), at(a, 1, 1), at(b, 1, 1), at(b, 1, -1), [ux, uy, uz], c);
      face(at(a, -1, -1), at(a, -1, 1), at(b, -1, 1), at(b, -1, -1), [-ux, -uy, -uz], c);
      face(at(a, -1, 1), at(a, 1, 1), at(b, 1, 1), at(b, -1, 1), [vx, vy, vz], c);
      face(at(a, -1, -1), at(a, 1, -1), at(b, 1, -1), at(b, -1, -1), [-vx, -vy, -vz], c);
      if (ends) {
        face(at(b, -1, -1), at(b, 1, -1), at(b, 1, 1), at(b, -1, 1), [dx, dy, dz], c);
        face(at(a, -1, -1), at(a, 1, -1), at(a, 1, 1), at(a, -1, 1), [-dx, -dy, -dz], c);
      }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setIndex(I); g.computeBoundingSphere();
      return g;
    },
  };
}

// ---- GLSL shared by the under-water materials: a value noise, and the footprint of a pixel along the track
const NOISE_GLSL = /* glsl */`
  float dH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float dN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(dH(i), dH(i + vec2(1.0, 0.0)), f.x), mix(dH(i + vec2(0.0, 1.0)), dH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
// share of the sleepers' stripes lost to the pixel: d = metres from the eye, h = metres the eye stands over the track
const MELT_GLSL = /* glsl */`
  float dMelt(float d, float h){ return smoothstep(0.25, 0.75, d * d * uPixAng / (${PITCH.toFixed(3)} * max(h, 0.5))); }`;

export async function buildTrack(ctx, opts = {}) {
  const core = ctx.core, streamOf = (name) => core.makeRng(core.hashSeed('track:' + name + ':' + ctx.seed));
  const object = new THREE.Group(); object.name = 'railway-under-the-sea-track';
  const geos = [], mats = [];
  // radians one pixel covers: read from the camera that draws (the view or the mirror's), just before each draw
  const uPixAng = { value: 2 / (1.664 * 1080) }, size = new THREE.Vector2();
  const readPixel = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(size).y;
    uPixAng.value = 2 / (Math.max(0.05, camera.projectionMatrix.elements[5]) * Math.max(1, h));
  };
  const add = (mesh, underWater, order) => {
    if (underWater) mesh.userData.noMirror = true;
    if (order !== undefined) mesh.renderOrder = order;
    mesh.onBeforeRender = readPixel; geos.push(mesh.geometry); object.add(mesh); return mesh;
  };

  // ---- the line, stepped (every STEP metres through the S, twice that on the two straights): centre, the unit
  // square to it toward the east, metres run
  const L = [];
  for (let z = LINE.z0, arc = 0, guard = 0; guard < 4000; guard++) {
    const s = lineSlope(z), k = 1 / Math.sqrt(1 + s * s), x = lineX(z);
    if (L.length) arc += Math.hypot(x - L[L.length - 1].x, z - L[L.length - 1].z);
    L.push({ z, x, ex: k, ez: -s * k, arc });
    if (z <= LINE.zEnd) break;
    const inBend = z <= LINE.zBend0 + 2 * STEP && z > LINE.zBend1;
    z = Math.max(LINE.zEnd, z - (inBend ? STEP : STEP * 2));
  }
  const steps = L.length - 1;

  // ---- THE BANK: top flat at bankTop, shoulders falling to the bed; the gravel thins out raggedly down the slope
  {
    const rng = streamOf('bank'), ph = [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)];
    const P = new Float32Array((steps + 1) * 12), N = new Float32Array((steps + 1) * 12), T = new Float32Array((steps + 1) * 12), I = [];
    const top = BANK.topWidth / 2, foot = BANK.footWidth / 2, rise = LEVEL.bankTop - LEVEL.bed, run = foot - top, nl = Math.hypot(rise, run);
    for (let i = 0; i <= steps; i++) {
      const c = L[i];
      const wW = foot + 0.11 * Math.sin(c.arc * 0.19 + ph[0]) + 0.07 * Math.sin(c.arc * 0.61 + ph[1]);
      const wE = foot + 0.11 * Math.sin(c.arc * 0.23 + ph[2]) + 0.07 * Math.sin(c.arc * 0.53 + ph[3]);
      const offs = [-wW, -top, top, wE], ys = [LEVEL.bed, LEVEL.bankTop, LEVEL.bankTop, LEVEL.bed];
      for (let j = 0; j < 4; j++) {
        const o = (i * 4 + j) * 3, side = j === 0 ? -1 : j === 3 ? 1 : 0;
        P[o] = c.x + c.ex * offs[j]; P[o + 1] = ys[j]; P[o + 2] = c.z + c.ez * offs[j];
        N[o] = side * c.ex * rise / nl; N[o + 1] = side ? run / nl : 1; N[o + 2] = side * c.ez * rise / nl;
        T[o] = offs[j]; T[o + 1] = c.arc; T[o + 2] = side ? 1 : 0;
      }
      if (i < steps) for (let j = 0; j < 3; j++) { const a = i * 4 + j, b = a + 1, d = a + 4, e = d + 1; I.push(a, b, e, a, e, d); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(T, 3)); g.setIndex(I); g.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, metalness: 0, transparent: true, depthWrite: false });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uPixAng = uPixAng;
      sh.uniforms.uBankA = { value: col('#57534c') }; sh.uniforms.uBankB = { value: col('#a29d92') };   // wet ballast: grey-brown, darker than the sand
      sh.uniforms.uStain = { value: col('#75685a') }; sh.uniforms.uSleeper = { value: col('#2c2622') };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 aT; varying vec3 vT; varying vec3 vWp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvT = aT; vWp = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uPixAng; uniform vec3 uBankA, uBankB, uStain, uSleeper; varying vec3 vT; varying vec3 vWp;' + NOISE_GLSL + MELT_GLSL)
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          vec2 q = vWp.xz; float fw = max(fwidth(q.x), fwidth(q.y));
          vec2 gq = vec2(vT.x, mod(vT.y, 64.0));
          float tone = (dN(q * 0.45) - 0.5) * 0.75 + (dN(q * 2.1 + 17.0) - 0.5) * 0.5 * clamp(1.0 - fw * 2.0, 0.0, 1.0);
          float grain = (dN(gq * 30.0) - 0.5) * clamp(1.0 - fw * 26.0, 0.0, 1.0);
          vec3 c = mix(uBankA, uBankB, clamp(0.5 + tone + grain * 0.7, 0.0, 1.0));
          float shell = smoothstep(0.86, 0.93, dN(gq * 11.0 + 40.0)) * clamp(1.0 - fw * 10.0, 0.0, 1.0);
          c = mix(c, vec3(0.93, 0.91, 0.86), shell * 0.7);                       // pale shell flecks, near only
          float lat = abs(vT.x);
          float stain = (1.0 - smoothstep(0.05, 0.34, abs(lat - ${(GAUGE / 2).toFixed(3)}))) * 0.3 + (1.0 - smoothstep(0.4, 1.3, lat)) * 0.1;
          c = mix(c, uStain, stain);                                             // rust and tar beside the rails
          float bw = max(fwidth(vT.x), 0.004), hl = ${(SLEEPER.length / 2).toFixed(3)};
          float band = 1.0 - smoothstep(hl - bw, hl + bw, lat);
          float melt = dMelt(distance(cameraPosition, vWp), cameraPosition.y - vWp.y);
          c = mix(c, mix(c, uSleeper, ${(SLEEPER.width / PITCH).toFixed(3)}), melt * band);   // far off: the sleepers' mean
          diffuseColor.rgb = c;
          float rag = (dN(q * 1.3 + 5.0) - 0.5) * 0.9 + (dN(q * 6.0 + 9.0) - 0.5) * 0.4 * clamp(1.0 - fw * 5.0, 0.0, 1.0);
          float v = vT.z + rag * 4.0 * vT.z * (1.0 - vT.z);
          diffuseColor.a *= 1.0 - smoothstep(0.25, 0.9, v);                      // the gravel thins out into the sand
        }`);
    };
    mat.customProgramCacheKey = () => 'd-track-bank';
    mats.push(mat); add(new THREE.Mesh(g, mat), true, -3);
  }
  await ctx.yield();

  // ---- THE SLEEPERS: dark tarred timber, square to the line, one every PITCH metres run; a few paler or a hair askew
  {
    // only what stands out of the ballast is drawn (the rest of the timber's 0.14 m is bedded in it); top face last
    const rng = streamOf('sleepers'), hx = SLEEPER.length / 2, hz = SLEEPER.width / 2, t = Math.min(SLEEPER.thick, LEVEL.sleeperTop - LEVEL.bankTop);
    const P = [], N = [], I = [];
    const quad = (pts, n) => { const b = P.length / 3; for (const q of pts) { P.push(q[0], q[1], q[2]); N.push(n[0], n[1], n[2]); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    quad([[-hx, -t, hz], [hx, -t, hz], [hx, 0, hz], [-hx, 0, hz]], [0, 0, 1]);                 // the two long sides
    quad([[hx, -t, -hz], [-hx, -t, -hz], [-hx, 0, -hz], [hx, 0, -hz]], [0, 0, -1]);
    quad([[hx, -t, hz], [hx, -t, -hz], [hx, 0, -hz], [hx, 0, hz]], [1, 0, 0]);                 // the two ends
    quad([[-hx, -t, -hz], [-hx, -t, hz], [-hx, 0, hz], [-hx, 0, -hz]], [-1, 0, 0]);
    quad([[-hx, 0, hz], [hx, 0, hz], [hx, 0, -hz], [-hx, 0, -hz]], [0, 1, 0]);                 // top
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
    const at = [];
    for (let z = LINE.z0 - PITCH / 2, guard = 0; z > LINE.zEnd && guard < 4000; guard++) { at.push(z); const s = lineSlope(z); z -= PITCH / Math.sqrt(1 + s * s); }
    at.reverse();                                            // laid from the far end back: the way of the flight draws far before near
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0, transparent: true, depthWrite: false });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uPixAng = uPixAng; sh.uniforms.uBallast = { value: col('#aea99d') };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uPixAng; varying float vMelt;' + MELT_GLSL)
        .replace('#include <beginnormal_vertex>', /* glsl */`
          vec4 dC = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vMelt = dMelt(distance(cameraPosition, dC.xyz), cameraPosition.y - dC.y);
          #include <beginnormal_vertex>
          objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), vMelt));`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uBallast; varying float vMelt;')
        .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, mix(uBallast, diffuseColor.rgb, ${(SLEEPER.width / PITCH).toFixed(3)}), vMelt);`);
    };
    mat.customProgramCacheKey = () => 'd-track-sleepers';
    const mesh = new THREE.InstancedMesh(g, mat, at.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    const dark = col('#2c2622'), pale = col('#5d554b'), c = new THREE.Color();
    for (let i = 0; i < at.length; i++) {
      const z = at[i], d0 = rng(), d1 = rng(), d2 = rng(), d3 = rng(), d4 = rng();       // all the dice, then the tests
      const skew = d0 < 0.06 ? (d1 - 0.5) * 0.05 : (d1 - 0.5) * 0.009, shift = (d2 - 0.5) * 0.05;
      const [x, zz] = beside(z, shift);
      pos.set(x, LEVEL.sleeperTop, zz); q.setFromAxisAngle(up, lineHeading(z) + skew);
      mesh.setMatrixAt(i, M.compose(pos, q, one));
      c.copy(dark).lerp(pale, d3 < 0.09 ? 0.55 + 0.45 * d4 : 0.22 * d4).multiplyScalar(0.86 + 0.28 * d4);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
    mats.push(mat); add(mesh, true, -2);
  }
  await ctx.yield();

  // ---- THE RAILS: two continuous steel rails swept along the line: a worn bright head over a dark web and a rusty foot
  {
    const hw = RAIL.head / 2, fw = RAIL.foot / 2, tall = RAIL.tall;
    // the section, west to east over the top: foot, web under the head, head side, HEAD, head side, web, foot
    const prof = [[-fw, 0.004], [-0.011, 0.02], [-hw, tall - 0.032], [-hw + 0.004, tall], [hw - 0.004, tall], [hw, tall - 0.032], [0.011, 0.02], [fw, 0.004]];
    const rust = col('#5b3d2b'), web = col('#231914'), flank = col('#6b4a35'), head = col('#cbd2d4');
    const tint = [rust, web, flank, head, flank, web, rust], order = [0, 6, 1, 5, 2, 4, 3];   // drawn from the foot up: the head last
    const faces = 7, per = faces * 2, rings = steps + 1, count = rings * per * 2;
    const P = new Float32Array(count * 3), N = new Float32Array(count * 3), C = new Float32Array(count * 3), A = new Float32Array(count * 2), I = [];
    let o = 0;
    for (const sd of [-1, 1]) for (let i = 0; i < rings; i++) {
      const c = L[i], base = o;
      for (let k = 0; k < faces; k++) {
        const du = prof[k + 1][0] - prof[k][0], dh = prof[k + 1][1] - prof[k][1], dl = Math.hypot(du, dh), nu = -dh / dl, nh = du / dl;
        for (let e = 0; e < 2; e++, o++) {
          const u = prof[k + e][0], off = sd * GAUGE / 2 + u;
          P[o * 3] = c.x + c.ex * off; P[o * 3 + 1] = LEVEL.sleeperTop + prof[k + e][1]; P[o * 3 + 2] = c.z + c.ez * off;
          N[o * 3] = c.ex * nu; N[o * 3 + 1] = nh; N[o * 3 + 2] = c.ez * nu;
          C[o * 3] = tint[k].r; C[o * 3 + 1] = tint[k].g; C[o * 3 + 2] = tint[k].b;
          A[o * 2] = c.ex * u; A[o * 2 + 1] = c.ez * u;
        }
      }
      if (i < rings - 1) for (const k of order) { const a = base + k * 2, b = a + 1, d = a + per, e2 = d + 1; I.push(a, b, e2, a, e2, d); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('aLat', new THREE.BufferAttribute(A, 2)); g.setIndex(I); g.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.1, transparent: true, depthWrite: false });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uPixAng = uPixAng;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uPixAng; attribute vec2 aLat; varying float vAl;')
        .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
          float dD = distance(cameraPosition, (modelMatrix * vec4(transformed, 1.0)).xyz);
          float kW = max(1.0, 1.6 * dD * uPixAng / ${RAIL.head.toFixed(3)});   // never under a pixel and a half: it pales instead
          transformed.xz += aLat * (kW - 1.0); vAl = 1.0 / kW;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAl;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vAl;');
    };
    mat.customProgramCacheKey = () => 'd-track-rails';
    mats.push(mat); add(new THREE.Mesh(g, mat), true, -1);
  }
  await ctx.yield();

  // ---- ABOVE THE WATER: one mesh of timber, iron and paint (pricken stems, marker posts, semaphore posts), one of twigs
  const acc = makeAcc(), M = new THREE.Matrix4(), M2 = new THREE.Matrix4();
  const ringDist = (x, z) => Math.hypot(x - RING.x, z - RING.z);
  // a frame standing in the sea beside the line at z: +x square to the line toward the east, +z back up the line
  // (toward the traffic that comes); a lean turns it about its foot on the bed
  const stand = (z, off, leanX = 0, leanZ = 0) => {
    const [x, zz] = beside(z, off);
    M.makeTranslation(x, 0, zz).multiply(M2.makeRotationY(lineHeading(z)));
    if (leanX || leanZ) M.multiply(M2.makeTranslation(0, LEVEL.bed, 0)).multiply(M2.makeRotationZ(leanX)).multiply(M2.makeRotationX(leanZ)).multiply(M2.makeTranslation(0, -LEVEL.bed, 0));
    acc.setMatrix(M);
  };
  const weedDark = col('#1d2218'), weed = col('#2c3521'), tarLow = col('#27231f'), tar = col('#38312b'), grey = col('#5f574e');
  const iron = col('#34373a'), porcelain = col('#ece8dc'), white = col('#e4e0d2'), whiteLow = col('#9aa087');
  const WP = [], WT = [], WS = [], WI = [];
  const twig = (pts) => {                                    // a twig as a ribbon through its points
    const seg = pts.length - 1, base = WP.length / 3;
    for (let k = 0; k <= seg; k++) {
      const p = pts[Math.max(0, k - 1)], q = pts[Math.min(seg, k + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) || 1;
      for (const sd of [-1, 1]) { WP.push(pts[k][0], pts[k][1], pts[k][2]); WT.push((q[0] - p[0]) / l, (q[1] - p[1]) / l, (q[2] - p[2]) / l); WS.push(sd); }
      if (k < seg) { const i0 = base + k * 2; WI.push(i0, i0 + 1, i0 + 3, i0, i0 + 3, i0 + 2); }
    }
  };

  // ---- THE PRICKEN: the tidal flats' own way marks, young birches set in the bed with their twigs left on. No pole,
  // no arm, no wire. They stand east of the line at uneven steps, lean as the tides have left them, one in eight is
  // gone, and the row ends before the halt.
  {
    const rng = streamOf('pricken'), bark = col('#5f574f'), barkHi = col('#8d867c');
    for (let z = PRICKEN.z0, n = 0; z >= PRICKEN.z1 - 0.01; z -= PRICKEN.spacing, n++) {
      const d = []; for (let k = 0; k < 8; k++) d.push(rng());                               // all the dice, then the tests
      if (d[0] < 0.12) continue;
      const zz = z + (d[1] - 0.5) * 14, off = PRICKEN.offset + (d[2] - 0.5) * 1.6;
      const [px, pz] = beside(zz, off);
      if (ringDist(px, pz) < RING_CLEAR) continue;
      stand(zz, off, (d[3] - 0.5) * 0.2, (d[4] - 0.5) * 0.16);
      const H = 3.3 + 1.9 * d[5];
      acc.lathe(0, 0, [[FOOT, 0.052, weedDark], [0.18, 0.05, weed], [0.5, 0.046, bark], [H * 0.55, 0.034, bark], [H, 0.017, barkHi], [H, 0, barkHi]], 5, false, d[6] * 6.28);
      const tr = streamOf('twigs ' + n), count = 20 + Math.floor(d[7] * 12);
      const at = (p, az, rise, l) => [p[0] + Math.cos(az) * Math.cos(rise) * l, p[1] + Math.sin(rise) * l, p[2] + Math.sin(az) * Math.cos(rise) * l];
      const W = (p) => acc.point(p[0], p[1], p[2]);
      twig([W([0, H - 0.05, 0]), W([(tr() - 0.5) * 0.25, H + 0.55 + 0.4 * tr(), (tr() - 0.5) * 0.25])]);    // the leader
      for (let j = 0; j < count; j++) {
        const f = (j + tr()) / count, h = H * (0.36 + 0.62 * f), az = tr() * 6.2832, rise = 0.78 + 0.42 * tr();
        const len = (2.1 - 1.2 * f) * (0.7 + 0.5 * tr());
        const p0 = [0, h, 0], p1 = at(p0, az, rise, len * 0.5), p2 = at(p1, az + (tr() - 0.5) * 0.5, Math.min(1.45, rise + 0.3), len * 0.5);
        twig([W(p0), W(p1), W(p2)]);
        const p3 = at(p1, az + (tr() < 0.5 ? -0.8 : 0.8), rise + 0.12, len * 0.42); twig([W(p1), W(p3)]);
        const p4 = at(p2, az + (tr() - 0.5) * 1.6, 1.2, len * 0.3), p5 = at(p2, az + (tr() - 0.5) * 1.6, 1.0, len * 0.26); twig([W(p2), W(p4)]); twig([W(p2), W(p5)]);
        if (tr() < 0.6) { const q0 = at(p0, az, rise, len * 0.26), q1 = at(q0, az + (tr() < 0.5 ? -0.9 : 0.9), rise + 0.2, len * 0.3); twig([W(q0), W(q1)]); }
      }
    }
  }
  await ctx.yield();

  // ---- THE MARKER POSTS: stout short posts west of the line, white with a tarred cap; nothing written on them
  {
    const rng = streamOf('markers'), T = MARKER.tall, shade = new THREE.Color();
    for (let z = MARKER.z0; z >= MARKER.z1 - 0.01; z -= MARKER.spacing) {
      const d0 = rng(), d1 = rng(), d2 = rng();
      const [mx, mz] = beside(z, MARKER.off);
      if (ringDist(mx, mz) < RING_CLEAR) continue;
      stand(z, MARKER.off, (d0 - 0.5) * 0.05, (d1 - 0.5) * 0.05);
      shade.copy(white).multiplyScalar(0.84 + 0.16 * d2);
      acc.lathe(0, 0, [[FOOT, 0.12, weedDark], [0.13, 0.118, weed], [0.27, 0.117, whiteLow], [0.4, 0.116, shade.clone()], [T - 0.18, 0.115, shade.clone()],
        [T - 0.18, 0.126, tarLow], [T - 0.05, 0.122, tar], [T, 0, tar]], 8, false, d2 * 6.28);
    }
  }

  // ---- THE TWO SEMAPHORE POSTS: a white timber post with a tarred foot, a ladder, ONE arm fixed level (red, a white
  // band), a spectacle of two glasses before a small lamp case, a balance lever. Still: nothing here ever moves.
  const glass = makeAcc();
  {
    const red = col('#b3261b'), zinc = col('#6f7578'), black = col('#1e1d1c'), green = col('#1d6f68');
    const H = 6.5, ya = 5.7, zf = 0.15, q = Math.PI / 4;
    const disc = (to, cx, cy, z0, z1, r, c, sides) => {      // a round form lying along the line's own direction
      to.setMatrix(M2.copy(M).multiply(new THREE.Matrix4().makeTranslation(cx, cy, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
      to.lathe(0, 0, [[z0, 0, c], [z0, r, c], [z1, r, c], [z1, 0, c]], sides);
    };
    for (const sp of SEMAPHORES) {
      stand(sp.z, sp.off);
      acc.lathe(0, 0, [[FOOT, 0.19, weedDark], [0.2, 0.188, weed], [0.55, 0.185, black], [1.25, 0.18, black], [1.25, 0.18, white], [H, 0.125, white]], 4, true, q);
      acc.lathe(0, 0, [[H, 0.12, zinc], [H, 0.15, zinc], [H + 0.04, 0.15, zinc], [H + 0.04, 0.07, zinc], [H + 0.3, 0.016, zinc], [H + 0.3, 0, zinc]], 4, true, q);
      acc.beam([0.1, ya, zf], [-0.95, ya, zf], 0.03, 0.25, red);                              // the arm, toward the line
      acc.beam([-0.95, ya, zf], [-1.15, ya, zf], 0.03, 0.25, white, false);
      acc.beam([-1.15, ya, zf], [-1.4, ya, zf], 0.03, 0.25, red);
      acc.beam([0.1, ya + 0.02, zf], [0.62, ya + 0.02, zf], 0.026, 0.4, black);               // the spectacle plate
      acc.beam([0.26, ya - 0.04, 0], [0.26, ya + 0.24, 0], 0.2, 0.22, black);                 // the lamp case and its cowl
      acc.lathe(0.26, 0, [[ya + 0.24, 0.16, zinc], [ya + 0.33, 0.045, zinc], [ya + 0.39, 0.045, zinc], [ya + 0.39, 0, zinc]], 4, true, q);
      acc.beam([0.095, ya - 0.07, 0], [0.3, ya - 0.07, 0], 0.05, 0.03, iron);
      acc.beam([0.14, ya - 0.2, zf], [0.14, 1.5, zf], 0.018, 0.018, iron);                    // the down rod and the balance lever
      acc.beam([-0.24, 1.45, zf], [0.42, 1.45, zf], 0.022, 0.05, iron);
      acc.beam([0, 1.45, 0.125], [0, 1.45, zf + 0.02], 0.06, 0.06, iron);
      for (const sx of [-1, 1]) {                                                              // the ladder, up the back
        acc.beam([sx * 0.17, FOOT, -0.3], [sx * 0.17, 5.95, -0.3], 0.03, 0.05, iron);
        for (const y of [2.0, 4.0, 5.9]) acc.beam([sx * 0.17, y, -0.3], [sx * 0.05, y, -0.7071 * (0.18 - 0.055 * (y - 1.25) / 5.25) - 0.004], 0.02, 0.03, iron);
      }
      for (let y = 0.45; y < 5.9; y += 0.3) acc.beam([-0.17, y, -0.3], [0.17, y, -0.3], 0.02, 0.02, iron, false);
      disc(acc, 0, ya, 0.095, 0.185, 0.045, iron, 8);                                          // the pivot
      disc(acc, 0.4, 1.45, zf + 0.012, zf + 0.07, 0.1, black, 10);                            // the balance weight
      disc(acc, 0.47, ya - 0.05, zf - 0.03, zf + 0.03, 0.085, green, 10);                     // the glass that is not before the lamp
      disc(glass, 0.26, ya + 0.09, zf - 0.03, zf + 0.03, 0.085, red, 10);                     // the glass before the lamp: steady
    }
  }
  await ctx.yield();

  const timberMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#70100b', emissive: '#f0220e', emissiveIntensity: 0.3, roughness: 0.35, metalness: 0 });
  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(WP, 3)); wireGeo.setAttribute('aTan', new THREE.Float32BufferAttribute(WT, 3));
  wireGeo.setAttribute('aSide', new THREE.Float32BufferAttribute(WS, 1)); wireGeo.setIndex(WI); wireGeo.computeBoundingSphere();
  // the twigs: ribbons turned to the eye, never under about two pixels across their soft profile (they pale instead)
  const wireMat = new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uPixAng, uColor: { value: col('#1b1613') } }),
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uPixAng; attribute vec3 aTan; attribute float aSide; varying float vA; varying float vS;
      #include <fog_pars_vertex>
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 tv = (modelViewMatrix * vec4(aTan, 0.0)).xyz;
        vec3 sd = cross(tv, mvPosition.xyz); float sl = length(sd);
        sd = sl > 1e-6 ? sd / sl : vec3(1.0, 0.0, 0.0);
        float dist = length(mvPosition.xyz), px = max(dist, 0.05) * uPixAng;
        float hw = max(0.012, 1.1 * px);
        vA = max(0.012 / hw, 0.34) * (1.0 - smoothstep(420.0, 800.0, dist)); vS = aSide;
        mvPosition.xyz += sd * (aSide * hw);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vA; varying float vS;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(uColor, vA * (1.0 - vS * vS));
        #include <fog_fragment>
      }`,
  });
  mats.push(timberMat, glassMat, wireMat);
  add(new THREE.Mesh(acc.geometry(), timberMat), false);
  add(new THREE.Mesh(glass.geometry(), glassMat), false);
  add(new THREE.Mesh(wireGeo, wireMat), false, 10);

  return {
    object,
    setNight(n) { glassMat.emissiveIntensity = 0.3 + 0.9 * Math.min(1, Math.max(0, n)); },   // the lamp behind the red glass, a little
    dispose() { object.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); },
  };
}

