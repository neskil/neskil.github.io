// Hero set piece for "blue-city-holi" (The Colour Run): THE STANDING COLOUR.
//
// The market square at the moment everything goes up at once: a triple-arched sandstone gate with
// cusped arches, jharokha balconies and four domed kiosks; a 34 m clock tower with four live dials;
// a ring of awning stalls heaped with cones of powder; a crowd; pigeons; marigold garlands and
// bunting; and, over all of it, standing columns of magenta, saffron and green powder that rise out
// of the shade, ignite where they meet the sun, are cut into slanting shafts, lean downwind, burst
// at their feet every second or two and draw aside left and right to show the gate.
//
// Local space: origin = centre of the square floor, +Y up, front = +Z (the camera arrives from +Z
// heading -Z). The gate stands at z = -60, the clock tower at (-26, 0, 10). Brief axes map 1:1
// (X east, Z south), so place the object at the world origin unrotated.
//
// opts
//   palette      7 hex strings [indigo, cobalt, white, sandstone, magenta, saffron, green] (brief default)
//   sunDir       [x,y,z] direction TOWARD the sun. If omitted the piece reads the first
//                DirectionalLight it finds in its scene on the first update(), else brief sun (E, 32 deg up).
//   plumes       extra plumes for the rest of the city, drawn in the same single draw call:
//                [{ x, y, z, height (15-30), radius (2-4), color (0 magenta | 1 saffron | 2 green), roofY }]
//                roofY = local height at which the sun reaches the powder (the roofline of that lane).
//   outerPlumes  how many lane plumes the piece invents round the square itself (default 10; 0 if you pass plumes)
//   parting      initial parting 0..1 (default 0.7, a half-drawn curtain that reads well standing alone)
//   crowd        number of figures in the square (default 750, scaled by ctx.quality.detail), pressed along the centre and round the plume feet
//   partFrom / partTo, eruptFrom / eruptTo   path-u windows used by setProgress (0.80/0.90, 0.60/0.76)
//   lean         how far the plumes lie over downwind (0.03 still air .. 0.3 breeze .. 0.7 banners); default by seed
//   windAngle    wind heading in radians (default: west, give or take, by seed)
//   extraColors  up to two more powder colours (hex) for a five-colour year; plume color may then be 3 or 4
//   plumes[].count  sprites in that plume (default 60; 0 for a bare emitter); plumes[].bursts  groups of thrown handfuls at its foot (default 3)
//   plumes[].handful  true: the handfuls are small and fly 6 to 10 m (thrown by a figure the viewer can see);
//   plumes[].burstS   metres along the world's path at which that emitter throws (set hero.uniforms.uS each frame); 0 = always
//   ranks        more lane plumes in the same draw, [{ x, y, z, height, radius, color, roofY, count }]: the world's ranks of colour to the
//                cliff. Their sprites draw from a stream of their own (made from ctx.seed), so passing them changes nothing else.
//   figures      [{ x, y, z, ry, s, color | c, pose }] extra people (the crowd's program, one more draw, a finer figure with a waist and bent
//                arms since they are seen from a few metres), throwing from the start: roofs, and the lane the world's camera runs
//
// The square's own plumes never close over the gate: their lean is capped, their sprites are thinner on the
// centre line and thinner again along the camera's sight line to the portal seat. No sprite is wider than 9 m or than a
// eighth of the view, and lane plumes fade within 20 m of the camera, so a cloud is many small puffs and never a sheet.
//
// Progress hooks (never wall-clock):
//   hero.setProgress(u)   world path progress 0..1: the square erupts over eruptFrom..eruptTo and the
//                         cloud parts over partFrom..partTo.
//   hero.setParting(k), hero.setEruption(k)   drive either directly (0..1). hero.setCrowd(k): the square's crowd, 0 = not drawn.
//   hero.uniforms         { uTime, uPart, uErupt, uSun, uWind, uPow (3 colours, solids) } for anything else, and the
//                         powder's look: uPow5 (5 powder colours), uLitCol / uShadeCol (sunlit and shaded gain),
//                         uGate (metres added to the height where the sun reaches the powder: first light),
//                         uFire / uFireCol (bonfire eve: smoke lit from its foot, thrown handfuls become sparks),
//                         uStainK (0..1, how strongly the paving is stained with trodden powder; default 1).
//
// anchors (local space)
//   portalSeat   { position (0, 9, -60), facing (0,0,1), radius 7, tilt 9 deg } centre arch, 15 x 17 m
//   flyThrough   ordered points of the last straight run: (0,33,90) -> (0,9,-60), >= 6 m clear all the way
//   gateCenter, gateTop, clockTower (top), clockDial, fortSightline (direction to look for the fort)
//   viewpoints   reveal / finale camera positions with what they look at
//   plumeFeet    [{ position, color, height }] for god rays, tint volumes, pigeons to wheel through
//   kiosks       tops of the four domed kiosks (pigeon perches)
//   stalls       [{ position, rotationY }] of every awning stall (langur routes, extra props)
//   tintClouds   [{ center, radius, color }] three clouds the final descent sinks through (fog tint)
//
// Cost: about 90k triangles in 6 or 7 draw calls (stone, cloth, dials, powder, crowd, roof figures, pigeons), ~200 ms build in short steps.
// Size: radius 50 for the gate, tower and the square's own cloud (hero.extent = 72 with the stalls'
// corners and the invented lane plumes), height 36. No lights, no textures.
// Lighting expected: one warm DirectionalLight (3-4) from the east about 32 deg up plus a blue
// HemisphereLight (1-2); scene fog is honoured by every material. Solids cast and receive shadows.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#27348B', '#3E6FD6', '#E8EEF7', '#C98F58', '#E6178A', '#FF9A1E', '#2FBF6B'];
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const GLSL_NOISE = /* glsl */`
float hh21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hh21(i), hh21(i + vec2(1., 0.)), f.x), mix(hh21(i + vec2(0., 1.)), hh21(i + vec2(1., 1.)), f.x), f.y); }
float fb2(vec2 p){ return vn2(p) * .5 + vn2(p * 2.07 + 11.3) * .3 + vn2(p * 4.3 + 37.1) * .2; }
`;

// ---------- a small geometry accumulator: flat quads with outward hints, smooth lathes, tubes ----------
function makeGeo() {
  const P = [], N = [], C = [], A = [];
  const m = new THREE.Matrix4(), nm = new THREE.Matrix3(), stack = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0);
  const G = { aux: [0, 0], count: 0 };
  const put = (p, nn, c) => {
    v.set(p[0], p[1], p[2]).applyMatrix4(m); n.set(nn[0], nn[1], nn[2]).applyMatrix3(nm).normalize();
    P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); A.push(G.aux[0], G.aux[1]); G.count++;
  };
  G.set = (x = 0, y = 0, z = 0, ry = 0, s = 1, rx = 0, rz = 0) => {
    q.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); nm.getNormalMatrix(m);
  };
  G.put = put;
  G.push = () => stack.push(m.clone());
  G.pop = () => { m.copy(stack.pop()); nm.getNormalMatrix(m); };
  G.tri = (a, b, c, ca, na, nb, nc, cb, cc) => { put(a, na, ca); put(b, nb, cb || ca); put(c, nc, cc || ca); };
  // a,b = first edge, c,d = opposite edge (a-b-c-d round the quad). hint = rough outward direction.
  G.quad = (a, b, c, d, ca, cb, hint) => {
    e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    if (e1.lengthSq() < 1e-10) e1.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    e1.cross(e2); if (e1.lengthSq() < 1e-12) return; e1.normalize();
    let nn = [e1.x, e1.y, e1.z]; cb = cb || ca;
    if (hint && nn[0] * hint[0] + nn[1] * hint[1] + nn[2] * hint[2] < 0) {
      nn = [-nn[0], -nn[1], -nn[2]];
      put(a, nn, ca); put(c, nn, cb); put(b, nn, ca); put(a, nn, ca); put(d, nn, cb); put(c, nn, cb);
    } else {
      put(a, nn, ca); put(b, nn, ca); put(c, nn, cb); put(a, nn, ca); put(c, nn, cb); put(d, nn, cb);
    }
  };
  // box standing on y: centre (cx, cz), base y, size (sx, sy, sz); o.t tapers the top, o.g darkens the foot
  G.box = (cx, y, cz, sx, sy, sz, col, o = {}) => {
    const t = o.t ?? 1, hx = sx / 2, hz = sz / 2, tx = hx * t, tz = hz * (o.tz ?? t), y1 = y + sy;
    const c0 = mul(col, o.g ?? 0.86), c1 = col;
    const b = [[cx - hx, y, cz - hz], [cx + hx, y, cz - hz], [cx + hx, y, cz + hz], [cx - hx, y, cz + hz]];
    const u = [[cx - tx, y1, cz - tz], [cx + tx, y1, cz - tz], [cx + tx, y1, cz + tz], [cx - tx, y1, cz + tz]];
    G.quad(b[3], b[2], u[2], u[3], c0, c1, [0, 0, 1]); G.quad(b[1], b[0], u[0], u[1], c0, c1, [0, 0, -1]);
    G.quad(b[2], b[1], u[1], u[2], c0, c1, [1, 0, 0]); G.quad(b[0], b[3], u[3], u[0], c0, c1, [-1, 0, 0]);
    if (!o.noTop) G.quad(u[3], u[2], u[1], u[0], c1, c1, [0, 1, 0]);
    if (o.bottom) G.quad(b[0], b[1], b[2], b[3], c0, c0, [0, -1, 0]);
  };
  // lathe round the y axis at (cx, cz): prof = [[r, y], ...] bottom to top; col = colour or (i, k) => colour
  G.lathe = (cx, y, cz, prof, seg, col, o = {}) => {
    const rot = o.rot ?? 0, sx = o.sx ?? 1, sz = o.sz ?? 1, arc = o.arc ?? Math.PI * 2, flat = o.flat;
    const cf = typeof col === 'function' ? col : () => col;
    for (let i = 0; i < prof.length - 1; i++) {
      const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
      const pr = prof[Math.max(0, i - 1)], nx = prof[Math.min(prof.length - 1, i + 2)];
      const n0 = [(y1 - pr[1]), -(r1 - pr[0])], n1 = [(nx[1] - y0), -(nx[0] - r0)];
      const nf = [(y1 - y0), -(r1 - r0)];
      for (let k = 0; k < seg; k++) {
        const a0 = rot + (k / seg) * arc, a1 = rot + ((k + 1) / seg) * arc;
        const s0 = Math.sin(a0), c0 = Math.cos(a0), s1 = Math.sin(a1), c1 = Math.cos(a1);
        const pa = [cx + r0 * s0 * sx, y + y0, cz + r0 * c0 * sz], pb = [cx + r0 * s1 * sx, y + y0, cz + r0 * c1 * sz];
        const pc = [cx + r1 * s1 * sx, y + y1, cz + r1 * c1 * sz], pd = [cx + r1 * s0 * sx, y + y1, cz + r1 * c0 * sz];
        const ca = cf(i, k), cb = cf(i + 1, k);
        if (flat) { const am = (a0 + a1) / 2; G.quad(pa, pb, pc, pd, ca, cb, [Math.sin(am) * (Math.abs(nf[0]) + 0.01), nf[1], Math.cos(am) * (Math.abs(nf[0]) + 0.01)]); continue; }
        const na = [n0[0] * s0, n0[1], n0[0] * c0], nb = [n0[0] * s1, n0[1], n0[0] * c1];
        const nc = [n1[0] * s1, n1[1], n1[0] * c1], nd = [n1[0] * s0, n1[1], n1[0] * c0];
        if (r0 > 1e-4) G.tri(pa, pb, pc, ca, na, nb, nc, ca, cb);
        if (r1 > 1e-4) G.tri(pa, pc, pd, ca, na, nc, nd, cb, cb);
      }
    }
  };
  // tube through points (array of [x,y,z]); col = colour or (i) => colour
  G.tube = (pts, r, sides, col, o = {}) => {
    const cf = typeof col === 'function' ? col : () => col, rf = typeof r === 'function' ? r : () => r;
    const rings = [], T = new THREE.Vector3(), B = new THREE.Vector3(), Nn = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(T.y) > 0.92) up.set(1, 0, 0);
      B.crossVectors(T, up).normalize(); Nn.crossVectors(B, T).normalize();
      const ring = [], rr = rf(i);
      for (let k = 0; k < sides; k++) {
        const an = (k / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
        const d = [B.x * cs + Nn.x * sn, B.y * cs + Nn.y * sn, B.z * cs + Nn.z * sn];
        ring.push({ p: [pts[i][0] + d[0] * rr, pts[i][1] + d[1] * rr, pts[i][2] + d[2] * rr], n: d });
      }
      rings.push(ring);
    }
    for (let i = 0; i < rings.length - 1; i++) {
      if (o.auxAt) G.aux = o.auxAt(i);
      const c0 = cf(i), c1 = cf(i + 1);
      for (let k = 0; k < sides; k++) {
        const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][(k + 1) % sides], d = rings[i + 1][k];
        G.tri(a.p, c.p, b.p, c0, a.n, c.n, b.n, c1, c0); G.tri(a.p, d.p, c.p, c0, a.n, d.n, c.n, c1, c1);
      }
    }
  };
  // brk (optional) hands the page back between the four attribute copies, so a big merge is never one long step
  G.build = async (brk) => {
    const g = new THREE.BufferGeometry(), pa = new Float32Array(P);
    g.setAttribute('position', new THREE.BufferAttribute(pa, 3)); if (brk) await brk();
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3)); if (brk) await brk();
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); if (brk) await brk();
    g.setAttribute('aux', new THREE.BufferAttribute(new Float32Array(A), 2));
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < pa.length; i += 3) { const x = pa[i], y = pa[i + 1], z = pa[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    if (!pa.length) { x0 = y0 = z0 = x1 = y1 = z1 = 0; }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0));
    return g;
  };
  G.set();
  return G;
}

// ---------- materials ----------
const STONE_FRAG = /* glsl */`
{
  float md = vAux.x; vec3 lp = vLp; vec3 an = abs(vLn);
  float wallU = an.x > an.z ? lp.z : lp.x;
  vec2 wuv = vec2(wallU, lp.y);
  float vert = 1. - smoothstep(.55, .8, an.y);
  float blot = fb2(wuv * .33 + 3.1), fine = vn2(wuv * 5.5 + lp.zx * 2.1);
  vec3 dc = diffuseColor.rgb;
  float fw = fwidth(lp.y) + fwidth(wallU);
  float sel = vn2(vec2(wallU, lp.z + lp.x) * .09 + 5.) * 3.;
  vec3 pc = sel < 1. ? uPow[0] : (sel < 2. ? uPow[1] : uPow[2]);
  if (md < .5) {                      // dressed sandstone: courses, blocks, streaks, powder thrown at its foot
    float course = lp.y / .46, row = floor(course);
    float bu = wallU / .98 + hh21(vec2(row, 7.));
    float blk = hh21(vec2(floor(bu), row));
    float dj = min(min(fract(course), 1. - fract(course)) * .46, min(fract(bu), 1. - fract(bu)) * .98);
    float joint = (1. - smoothstep(.008, .028 + fw, dj)) / (1. + fw * 14.);
    dc *= mix(1., .78, joint * vert);
    dc *= .93 + .13 * blk * vert / (1. + fw * 4.);
    dc *= .78 + .44 * blot;
    dc *= 1. - .26 * smoothstep(.5, .9, vn2(vec2(wallU * 1.7, lp.y * .07 + 2.))) * vert;
    dc = mix(dc, dc * vec3(1.08, 1.0, .9), fine * .35);
    float st = smoothstep(.42, .7, fb2(wuv * .5 + 9.)) * (1. - smoothstep(.3, 6.5, lp.y)) * vert;
    dc = mix(dc, pc * .8, st * .62);
  } else if (md < 1.5) {              // limewash and paint: blotches and rain streaks
    dc *= .8 + .36 * blot;
    dc *= 1. - .2 * smoothstep(.5, .9, vn2(vec2(wallU * 2.3, lp.y * .09 + 4.))) * vert;
    float st = smoothstep(.5, .75, fb2(wuv * .6 + 19.)) * (1. - smoothstep(.3, 4., lp.y)) * vert;
    dc = mix(dc, pc * .8, st * .5);
  } else if (md < 2.5) {              // brass
    dc *= .8 + .4 * fine;
    hEmis = dc * (.35 + .9 * smoothstep(.72, .95, fine));
    hBrass = 1.;
  } else if (md < 3.5) {              // paving: flags, worn tones, drifts of trodden powder
    vec2 fl = lp.xz / vec2(1.7, 1.1); fl.x += floor(fl.y) * .37;
    vec2 ff = fract(fl); float tone = hh21(floor(fl));
    float pf = fwidth(lp.x) + fwidth(lp.z);
    float dj = min(min(ff.x, 1. - ff.x) * 1.7, min(ff.y, 1. - ff.y) * 1.1);
    float jn = (1. - smoothstep(.015, .06 + pf, dj)) / (1. + pf * 5.);
    dc *= mix(1., .5, jn);
    dc *= (.8 + .34 * tone / (1. + pf * 2.)) * (.8 + .34 * fb2(lp.xz * .21));
    float s0 = smoothstep(.47, .68, fb2(lp.xz * .05 + 1.7)), s1 = smoothstep(.49, .7, fb2(lp.xz * .052 + 31.3)), s2 = smoothstep(.49, .7, fb2(lp.xz * .048 + 77.1));
    float gr = .55 + .45 * fb2(lp.xz * .9 + 5.);
    dc = mix(dc, uPow[0] * .8, s0 * .55 * gr * uStainK); dc = mix(dc, uPow[1] * .8, s1 * .5 * gr * uStainK); dc = mix(dc, uPow[2] * .8, s2 * .5 * gr * uStainK);
    float rg = fb2(lp.xz * .33 + 21.);
    for (int i = 0; i < 16; i++) {
      vec4 ft = uFeet[i];
      float fd = length(lp.xz - ft.xy) / max(ft.w, .1) + (rg - .5) * .7;
      vec3 fc = ft.z < .5 ? uPow[0] : (ft.z < 1.5 ? uPow[1] : uPow[2]);
      dc = mix(dc, fc * (.62 + .3 * gr), (1. - smoothstep(.2, 1., fd)) * .82 * mix(.75, 1., uStainK) * smoothstep(0., .3, uStainK));
    }
    dc *= mix(1., .8, jn * .6);
    float sp = smoothstep(.66, .84, fb2(lp.xz * .7 + 50.));
    dc = mix(dc, pc, sp * .4);
  } else if (md < 4.5) {              // heaped powder
    dc *= .8 + .35 * fine; hEmis = dc * .22;
  }
  diffuseColor.rgb = dc;
}
`;

function makeStoneMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uPow = U.uPow; sh.uniforms.uFeet = U.uFeet; sh.uniforms.uStainK = U.uStainK;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aux; varying vec3 vLp; varying vec3 vLn; varying vec2 vAux;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position; vLn = normal; vAux = aux;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLp; varying vec3 vLn; varying vec2 vAux; uniform vec3 uPow[3]; uniform vec4 uFeet[16]; uniform float uStainK;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', '#include <color_fragment>\nfloat hBrass = 0.; vec3 hEmis = vec3(0.);\n' + STONE_FRAG)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .34, hBrass);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, .45, hBrass);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += hEmis;');
  };
  mat.customProgramCacheKey = () => 'holi-stone3';
  return mat;
}

// cloth, garlands, bunting, pennants: aux = (wind amplitude in metres, phase)
export function makeClothMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = U.uWind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aux; uniform float uTime; uniform vec3 uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float cw = sin(uTime * 2.1 + aux.y + position.x * .8 + position.z * .6) * .6 + sin(uTime * 3.9 + aux.y * 1.7 + position.y * 1.4 + position.x * .5) * .4;
        float cg = .5 + .5 * sin(uTime * .43 + position.x * .05 + position.z * .04);
        transformed += (vec3(uWind.x, 0., uWind.z) * (cw * .7 + cg * .9) + vec3(0., cw * .35, 0.)) * aux.x;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .1;');
  };
  mat.customProgramCacheKey = () => 'holi-cloth';
  return mat;
}

// ---------- shared ornaments ----------
// domed kiosk (chhatri) standing on y; about 6.3 m tall at s = 1. Returns nothing; draws into G.
function chhatri(G, x, y, z, s, K, ribbed, cols = 4) {
  G.push(); G.set(x, y, z, 0, s);
  G.aux = [0, 0];
  G.box(0, 0, 0, 3.7, 0.22, 3.7, K.stoneD); G.box(0, 0.22, 0, 3.3, 0.2, 3.3, K.stone);
  const colProf = [[0.24, 0], [0.26, 0.12], [0.17, 0.3], [0.15, 1.75], [0.2, 1.86], [0.15, 1.95], [0.27, 2.12], [0.3, 2.2]];
  for (let i = 0; i < cols; i++) {
    const a = Math.PI / 4 + (i / cols) * Math.PI * 2, r = cols === 4 ? 1.9 : 1.55;
    G.lathe(Math.sin(a) * r, 0.42, Math.cos(a) * r, colProf, 6, (j) => (j === 2 || j === 3 ? K.stoneL : K.stone));
  }
  G.box(0, 2.62, 0, 3.1, 0.34, 3.1, K.stone, { g: 0.7 });
  // drooping square eave: underside then top
  G.lathe(0, 0, 0, [[2.1, 2.9], [3.5, 2.5], [3.56, 2.6], [2.2, 3.12]], 4, (j) => (j < 2 ? K.stoneD : K.stoneL), { rot: Math.PI / 4, flat: true });
  G.lathe(0, 0, 0, [[1.55, 3.05], [1.55, 3.38], [1.68, 3.44], [1.68, 3.56], [1.5, 3.6]], 8, K.stone, { flat: true, rot: Math.PI / 8 });
  const dome = [];
  for (let k = 0; k <= 9; k++) { const a = (k / 9) * Math.PI / 2; dome.push([1.56 * Math.pow(Math.cos(a), 0.8) * (1 + 0.1 * Math.sin(2 * a)), 3.6 + 1.62 * Math.sin(a)]); }
  dome[9][0] = 0.16;
  G.aux = [1, 0];
  G.lathe(0, 0, 0, dome, 14, (j, k) => mul(K.dome, (ribbed && k % 2 ? 0.86 : 1) * (0.84 + 0.16 * j / 9)));
  G.aux = [0, 0];
  G.lathe(0, 0, 0, [[0.16, 5.2], [0.42, 5.26], [0.2, 5.4], [0.12, 5.44]], 8, K.stoneL);
  G.aux = [2, 0];
  G.lathe(0, 0, 0, [[0.1, 5.44], [0.3, 5.6], [0.1, 5.78], [0.2, 5.9], [0.05, 6.02], [0.03, 6.4], [0, 6.45]], 8, K.brass);
  G.aux = [0, 0];
  G.pop();
}

// sloped stone eave (chajja) on brackets, along x from x0 to x1 at height y, on the face z, projecting dir (+1/-1)
function eave(G, x0, x1, y, z, dir, proj, K) {
  const zo = z + dir * proj, yo = y - proj * 0.32;
  G.quad([x0, y, z], [x1, y, z], [x1, yo, zo], [x0, yo, zo], K.stoneL, K.stone, [0, 1, dir * 0.3]);
  G.quad([x0, y - 0.22, z], [x1, y - 0.22, z], [x1, yo - 0.14, zo], [x0, yo - 0.14, zo], K.stoneD, mul(K.stoneD, 0.8), [0, -1, 0]);
  G.quad([x0, yo - 0.14, zo], [x1, yo - 0.14, zo], [x1, yo, zo], [x0, yo, zo], K.stone, K.stone, [0, 0, dir]);
  G.quad([x0, y - 0.22, z], [x0, yo - 0.14, zo], [x0, yo, zo], [x0, y, z], K.stone, K.stone, [-1, 0, 0]);
  G.quad([x1, y - 0.22, z], [x1, yo - 0.14, zo], [x1, yo, zo], [x1, y, z], K.stone, K.stone, [1, 0, 0]);
  const n = Math.max(2, Math.round((x1 - x0) / 1.5));
  for (let i = 0; i <= n; i++) {
    const x = x0 + 0.2 + (i / n) * (x1 - x0 - 0.4);
    G.box(x, y - 0.95, z + dir * proj * 0.28, 0.24, 0.72, proj * 0.56, K.stoneD, { g: 0.7 });
    G.box(x, y - 0.5, z + dir * proj * 0.48, 0.2, 0.3, proj * 0.9, K.stone, { g: 0.75 });
  }
}

// parapet of leaf-shaped merlons along x
function merlons(G, x0, x1, y, z, K, rng) {
  const n = Math.max(1, Math.round((x1 - x0) / 1.02)), w = (x1 - x0) / n;
  G.box((x0 + x1) / 2, y, z, x1 - x0, 0.42, 0.5, K.stone);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * w, c = mul(K.stone, 0.9 + rng() * 0.2);
    if (rng() < 0.04) continue;                               // a merlon lost to time
    G.box(x, y + 0.42, z, w * 0.8, 0.5, 0.4, c, { g: 0.92, noTop: true });
    G.box(x, y + 0.92, z, w * 0.8, 0.52, 0.4, c, { t: 0.1, tz: 1, g: 1 });
  }
}

// projecting balcony window (jharokha) on a wall face z, facing dir
function jharokha(G, x, y, z, w, dir, K) {
  const zc = z + dir * 0.75;
  G.aux = [0, 0];
  G.box(x, y - 1.1, z + dir * 0.3, w * 0.5, 0.5, 0.6, K.stoneD, { g: 0.7 });
  G.box(x, y - 0.6, z + dir * 0.5, w * 0.8, 0.4, 1.0, K.stone, { g: 0.72 });
  G.box(x, y - 0.2, zc, w + 0.3, 0.22, 1.6, K.stoneL, { g: 0.8, bottom: true });
  G.box(x, y, z + dir * 1.38, w, 0.75, 0.14, K.stone);                          // pierced rail
  G.aux = [5, 0]; G.box(x, y, z + dir * 0.06, w - 0.5, 2.3, 0.1, K.dark, { g: 1 });
  G.aux = [1, 0];
  G.box(x - w * 0.2, y + 0.1, z + dir * 0.14, w * 0.3, 1.9, 0.08, K.indigo); G.box(x + w * 0.22, y + 0.1, z + dir * 0.2, w * 0.3, 1.9, 0.08, K.cobalt);
  G.aux = [0, 0];
  const cp = [[0.13, 0], [0.09, 0.2], [0.08, 1.75], [0.15, 1.95], [0.17, 2.05]];
  for (const cx of [-0.5, -0.17, 0.17, 0.5]) G.lathe(x + cx * w * 0.96, y + 0.02, z + dir * 1.36, cp, 5, K.stoneL);
  G.box(x, y + 2.07, zc, w + 0.1, 0.2, 1.55, K.stone, { g: 0.75 });
  // bangla roof: a drooping half-vault
  G.lathe(x, y + 2.27, z, [[1.3, -0.1], [1.34, -0.04], [1.08, 0.36], [0.6, 0.66], [0.08, 0.8]], 10, (j) => mul(K.stoneL, 0.82 + j * 0.05),
    { arc: Math.PI, rot: dir > 0 ? -Math.PI / 2 : Math.PI / 2, sx: (w / 2 + 0.45) / 1.3, sz: 1.75 / 1.3 });
  G.aux = [2, 0]; G.lathe(x, y + 3.05, z + dir * 0.12, [[0.06, 0], [0.16, 0.12], [0.05, 0.26], [0, 0.5]], 6, K.brass); G.aux = [0, 0];
}

// marigold swag between a and b (cloth geometry): beads alternate orange and gold, sways from its ends
function swag(CG, a, b, sag, r, K, rng, n = 12) {
  const pts = [], ph = rng() * 6.28;
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = 4 * t * (1 - t);
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * k, a[2] + (b[2] - a[2]) * t]);
  }
  CG.tube(pts, (i) => r * (i % 2 ? 1.15 : 0.8), 5, (i) => (i % 3 === 0 ? K.gold : K.marigold),
    { auxAt: (i) => { const t = (i + 0.5) / n; return [0.32 * sag * 4 * t * (1 - t), ph]; } });
}
// hanging garland string from p straight down by len
function strand(CG, p, len, r, K, rng) {
  const pts = [], ph = rng() * 6.28, n = 8;
  for (let i = 0; i <= n; i++) pts.push([p[0], p[1] - len * i / n, p[2]]);
  CG.tube(pts, (i) => r * (i % 2 ? 1.15 : 0.8), 5, (i) => (i % 3 === 1 ? K.gold : K.marigold),
    { auxAt: (i) => [0.5 * len * Math.pow((i + 0.5) / n, 1.6) * 0.3, ph] });
}
// rope with triangular cloth flags between a and b
function bunting(CG, a, b, sag, K, rng, cols) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(4, Math.round(len / 0.95));
  const ph = rng() * 6.28, pts = [];
  const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  for (let i = 0; i <= n; i++) pts.push(at(i / n));
  CG.aux = [0, 0];
  CG.tube(pts, 0.035, 3, K.rope, { auxAt: (i) => [0.1 * sag * 4 * ((i + 0.5) / n) * (1 - (i + 0.5) / n), ph] });
  const dx = b[0] - a[0], dz = b[2] - a[2], dl = Math.hypot(dx, dz) || 1, nn = [-dz / dl, 0.2, dx / dl];
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.12) / n, t1 = (i + 0.88) / n, tm = (t0 + t1) / 2;
    const p0 = at(t0), p1 = at(t1), pm = at(tm), c = cols[(i + Math.floor(rng() * 2)) % cols.length];
    const sw = 0.1 * sag * 4 * tm * (1 - tm), drop = 0.62 + rng() * 0.14;
    CG.aux = [sw, ph]; CG.put(p0, nn, c); CG.put(p1, nn, c);
    CG.aux = [sw + 0.3, ph + i * 0.9]; CG.put([pm[0], pm[1] - drop, pm[2]], nn, mul(c, 0.82));
  }
  CG.aux = [0, 0];
}
// a length of cloth hung out to air: pinned along its top edge, free below
function drape(CG, x, y, z, w, len, col, edge, rng, nrm) {
  const ph = rng() * 6.28, n = 7, skew = rng.range(-0.25, 0.25);
  const at = (u, t) => [x + (u - 0.5) * w + skew * t * t, y - len * t, z + nrm * 0.05 * Math.sin(t * 5 + ph)];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
    const t0 = i / n, t1 = (i + 1) / n, u0 = k / 3, u1 = (k + 1) / 3;
    const c = (i === n - 1 || k === 0) ? edge : mul(col, 0.85 + 0.15 * rng());
    for (const [u, t] of [[u0, t0], [u1, t0], [u1, t1], [u0, t0], [u1, t1], [u0, t1]]) { CG.aux = [0.5 * Math.pow(t, 1.5) * Math.min(1, len / 4), ph + u * 1.2]; CG.put(at(u, t), [0, 0.15, nrm], c); }
  }
  CG.aux = [0, 0];
}
// pennant on a brass pole
function pennant(G, CG, x, y, z, h, K, wind, rng, col) {
  G.aux = [2, 0]; G.tube([[x, y, z], [x, y + h, z]], 0.05, 5, K.brass); G.aux = [0, 0];
  const L = 2.3, n = 6, ph = rng() * 6.28, nn = [-wind[1], 0.1, wind[0]];
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, hw0 = 0.55 * (1 - t0), hw1 = 0.55 * (1 - t1), yc = y + h - 0.6;
    const P0 = (t, s) => [x + wind[0] * L * t, yc + s - t * 0.25, z + wind[1] * L * t];
    const a0 = [0.9 * t0 * t0 + 0.05 * t0, ph - t0 * 4], a1 = [0.9 * t1 * t1 + 0.05 * t1, ph - t1 * 4];
    const c0 = mul(col, 1 - t0 * 0.15), c1 = mul(col, 1 - t1 * 0.15);
    CG.aux = a0; CG.put(P0(t0, -hw0), nn, c0); CG.aux = a1; CG.put(P0(t1, -hw1), nn, c1); CG.put(P0(t1, hw1), nn, c1);
    CG.aux = a0; CG.put(P0(t0, -hw0), nn, c0); CG.aux = a1; CG.put(P0(t1, hw1), nn, c1); CG.aux = a0; CG.put(P0(t0, hw0), nn, c0);
  }
  CG.aux = [0, 0];
}

// ---------- the gate: three cusped arches, jharokhas, eaves, merlons, bastions, four domed kiosks ----------
async function buildGate(G, CG, K, rng, P) {
  const brk = P.yield || (() => undefined);
  const zc = P.z, D = 9, zf = zc + D / 2, zb = zc - D / 2;
  const topAt = (x) => (Math.abs(x) < 11.5 ? 23 : 19.8);
  const arches = [{ x: 0, w: 15, h: 17, n: P.lobes, c: 0.62 }, { x: -15.5, w: 8, h: 11, n: P.lobes - 2, c: 0.42 }, { x: 15.5, w: 8, h: 11, n: P.lobes - 2, c: 0.42 }];
  const wallCol = (y) => mul(K.stone, 0.78 + 0.24 * sstep(0, 16, y));
  const profile = (A) => {
    const out = [], tm = 1.12, nj = 5, nh = A.n * 8, ths = [];
    const H = (th) => {
      const t = Math.abs(Math.sin(th));
      let h = A.h * (0.84 * Math.pow(Math.max(0, 1 - Math.pow(t, 6)), 1 / 6) + 0.16 * Math.pow(Math.max(0, 1 - t), 1.5));
      if (Math.abs(th) <= tm + 1e-6) h -= A.c * (1 - Math.abs(Math.sin(A.n * Math.PI * (th + tm) / (2 * tm))));
      return Math.max(0, h);
    };
    for (let i = 0; i < nj; i++) ths.push(-Math.PI / 2 + (i / nj) * (Math.PI / 2 - tm));
    for (let i = 0; i <= nh; i++) ths.push(-tm + (i / nh) * 2 * tm);
    for (let i = 1; i <= nj; i++) ths.push(tm + (i / nj) * (Math.PI / 2 - tm));
    for (const th of ths) out.push([A.x + (A.w / 2) * Math.sin(th), H(th)]);
    out[0][1] = 0; out[out.length - 1][1] = 0;
    return out;
  };
  G.aux = [0, 0];
  for (const A of arches) {
    const pr = profile(A), T = topAt(A.x), cT = wallCol(T), cIn = mul(K.stoneD, 0.8);
    for (let i = 0; i < pr.length - 1; i++) {
      const [x0, h0] = pr[i], [x1, h1] = pr[i + 1], c0 = wallCol((h0 + h1) / 2);
      G.quad([x0, h0, zf], [x1, h1, zf], [x1, T, zf], [x0, T, zf], c0, cT, [0, 0, 1]);
      G.quad([x0, h0, zb], [x1, h1, zb], [x1, T, zb], [x0, T, zb], c0, cT, [0, 0, -1]);
      G.quad([x0, h0, zf], [x1, h1, zf], [x1, h1, zb], [x0, h0, zb], cIn, cIn, [A.x - (x0 + x1) / 2, A.h * 0.45 - (h0 + h1) / 2, 0]);
    }
    // alfiz frame, rosettes and garlands on both faces
    for (const dir of [1, -1]) {
      const z = dir > 0 ? zf : zb;
      for (const sg of [-1, 1]) {
        G.box(A.x + sg * (A.w / 2 + 0.6), 1.3, z + dir * 0.18, 0.72, A.h - 0.4, 0.5, K.stoneL, { g: 0.8 });
        G.push(); G.set(A.x + sg * A.w * 0.4, A.h * 0.935, z + dir * 0.01, 0, A.w * 0.06, dir * Math.PI / 2);
        G.lathe(0, 0, 0, [[1, 0], [0.92, 0.22], [0.6, 0.12], [0.34, 0.3], [0, 0.36]], 10, (j, k) => (k % 2 ? K.stoneL : K.stone));
        G.pop();
      }
      G.box(A.x, A.h + 0.9, z + dir * 0.2, A.w + 2.6, 0.5, 0.56, K.stoneL, { g: 0.8, bottom: true });
      G.box(A.x, A.h + 1.4, z + dir * 0.12, A.w + 2.2, 0.16, 0.36, K.stone, { g: 0.9 });
      const ns = A.w > 10 ? 3 : 2, gy = A.h + 0.85, gz = z + dir * 0.62, x0 = A.x - A.w / 2 - 0.6, sw = (A.w + 1.2) / ns;
      for (let i = 0; i < ns; i++) swag(CG, [x0 + i * sw, gy, gz], [x0 + (i + 1) * sw, gy, gz], A.w > 10 ? 1.25 : 1.0, 0.13, K, rng);
      for (let i = 0; i <= ns; i += ns) strand(CG, [x0 + i * sw, gy, gz], A.w > 10 ? 6 : 4, 0.12, K, rng);
    }
    await brk();
  }
  // piers, plinths, tops
  for (const [xa, xb] of [[-23, -19.5], [-11.5, -7.5], [7.5, 11.5], [19.5, 23]]) {
    const T = topAt((xa + xb) / 2 * 0.98);
    G.quad([xa, 0, zf], [xb, 0, zf], [xb, T, zf], [xa, T, zf], wallCol(0), wallCol(T), [0, 0, 1]);
    G.quad([xa, 0, zb], [xb, 0, zb], [xb, T, zb], [xa, T, zb], wallCol(0), wallCol(T), [0, 0, -1]);
    G.box((xa + xb) / 2, 0, zc, xb - xa, 1.3, D + 0.8, K.stoneL, { g: 0.8 });
    G.box((xa + xb) / 2, 1.3, zc, xb - xa, 0.25, D + 0.5, K.stone, { g: 0.9, t: 0.97 });
  }
  for (const sg of [-1, 1]) {
    G.quad([sg * 11.5, 19.8, zf], [sg * 11.5, 19.8, zb], [sg * 11.5, 23, zb], [sg * 11.5, 23, zf], wallCol(19), wallCol(23), [sg, 0, 0]);
    G.quad([sg * 11.5, 19.8, zf], [sg * 23, 19.8, zf], [sg * 23, 19.8, zb], [sg * 11.5, 19.8, zb], K.stoneD, K.stoneD, [0, 1, 0]);
  }
  G.quad([-11.5, 23, zf], [11.5, 23, zf], [11.5, 23, zb], [-11.5, 23, zb], K.stoneD, K.stoneD, [0, 1, 0]);
  for (const dir of [1, -1]) {
    await brk();
    const z = dir > 0 ? zf : zb;
    // centre block: a row of blind niches with painted shutters, string course, eave, merlons
    G.box(0, 18.75, z + dir * 0.1, 23.4, 0.3, 0.3, K.stoneL, { g: 0.85, bottom: true });
    for (let i = -3; i <= 3; i++) {
      const x = i * 2.9;
      G.aux = [5, 0]; G.box(x, 19.35, z + dir * 0.03, 1.25, 1.9, 0.08, K.dark, { g: 1 });
      G.aux = [1, 0]; if ((i + 3 + P.shut) % 3) G.box(x + 0.3, 19.4, z + dir * 0.08, 0.56, 1.8, 0.06, (i + P.shut) % 2 ? K.indigo : K.cobalt);
      G.aux = [0, 0];
      G.box(x, 19.12, z + dir * 0.16, 1.7, 0.16, 0.36, K.stoneL, { bottom: true });
      G.box(x, 21.25, z + dir * 0.14, 1.6, 0.34, 0.3, K.stoneL, { t: 0.2, tz: 1, bottom: true });
    }
    eave(G, -11.6, 11.6, 22.5, z, dir, 1.35, K);
    merlons(G, -11.5, 11.5, 23, z - dir * 0.26, K, rng);
    for (const sg of [-1, 1]) {
      const xw = sg * 15.5;
      jharokha(G, xw, 14.2, z, 3.5, dir, K);
      G.box(xw, 17.9, z + dir * 0.1, 8.6, 0.26, 0.3, K.stoneL, { g: 0.85, bottom: true });
      for (const o of [-3, 3]) {
        G.aux = [5, 0]; G.box(xw + o, 14.3, z + dir * 0.03, 0.9, 1.7, 0.08, K.dark, { g: 1 });
        G.aux = [1, 0]; G.box(xw + o - 0.2, 14.34, z + dir * 0.08, 0.42, 1.6, 0.06, K.indigo);
        G.aux = [0, 0]; G.box(xw + o, 16.0, z + dir * 0.12, 1.25, 0.3, 0.28, K.stoneL, { t: 0.2, tz: 1, bottom: true });
      }
      eave(G, sg > 0 ? 11.6 : -19.6, sg > 0 ? 19.6 : -11.6, 19.35, z, dir, 1.15, K);
      merlons(G, sg > 0 ? 11.9 : -19.4, sg > 0 ? 19.4 : -11.9, 19.8, z - dir * 0.26, K, rng);
      for (let i = 0, nd = dir > 0 ? 2 : 1; i < nd; i++) {
        const dx = xw + (i ? 1 : -1) * rng.range(1.6, 3.2) + (nd === 1 ? rng.range(-1, 1) : 0);
        drape(CG, dx, 18.92, z + dir * 1.22, rng.range(1.0, 1.4), rng.range(3.2, 5.2), rng.pick(P.cloths), rng.pick(P.edges), rng, dir);
      }
      strand(CG, [xw - 1.9, 14.0, z + dir * 1.5], 2.6, 0.1, K, rng); strand(CG, [xw + 1.9, 14.0, z + dir * 1.5], 2.6, 0.1, K, rng);
      swag(CG, [xw - 1.9, 14.0, z + dir * 1.5], [xw + 1.9, 14.0, z + dir * 1.5], 0.8, 0.11, K, rng, 9);
    }
  }
  // door leaves folded back inside the side arches: blue paint, brass straps
  for (const A of arches.slice(1)) for (const sg of [-1, 1]) {
    G.push(); G.set(A.x + sg * 3.72, 0, zc + 1.9, sg * -0.16);
    G.aux = [1, 0]; G.box(0, 0.15, -1.9, 0.2, 8.9, 3.7, sg * A.x > 0 ? K.indigo : K.cobalt, { g: 0.7 });
    G.aux = [2, 0]; for (const yb of [1.6, 4.4, 7.2]) G.box(0, yb, -1.9, 0.26, 0.2, 3.5, K.brass);
    G.aux = [0, 0]; G.pop();
  }
  // octagonal end bastions
  const kiosks = [];
  for (const sg of [-1, 1]) {
    await brk();
    const bx = sg * 23.6;
    G.lathe(bx, 0, zc, [[5.0, 0], [5.0, 1.3], [4.5, 1.75], [4.3, 12.0], [4.5, 12.25], [4.5, 12.6], [4.28, 12.85], [4.22, 20.3], [4.7, 20.8], [4.7, 21.5], [4.85, 21.6], [4.85, 22.5], [4.4, 22.5], [4.4, 21.9], [0, 21.9]],
      8, (j) => (j < 2 ? K.stoneL : j === 4 || j === 5 || j >= 8 ? K.stoneL : mul(K.stone, 0.8 + 0.2 * Math.min(1, j / 7))), { flat: true, rot: Math.PI / 8 });
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, r = 4.26 * Math.cos(Math.PI / 8) + 0.02;
      if (Math.abs(Math.sin(a)) > 0.9 && Math.sin(a) * sg < 0) continue;
      G.push(); G.set(bx + Math.sin(a) * r, 0, zc + Math.cos(a) * r, a);
      G.aux = [5, 0]; G.box(0, 15.2, 0, 0.5, 2.1, 0.08, K.dark, { g: 1 }); G.box(0, 7.4, 0, 0.45, 1.8, 0.08, K.dark, { g: 1 });
      G.aux = [0, 0]; G.box(0, 17.3, 0.06, 0.95, 0.26, 0.3, K.stoneL, { t: 0.2, tz: 1, bottom: true });
      G.pop();
    }
    chhatri(G, bx, 21.9, zc, 1.14, K, P.ribbed, 8); kiosks.push([bx, 21.9 + 6.45 * 1.14, zc]);
    await brk();
    chhatri(G, sg * 8.6, 23, zc, 0.98, K, P.ribbed, 4); kiosks.push([sg * 8.6, 23 + 6.45 * 0.98, zc]);
    pennant(G, CG, bx, 21.9 + 6.3 * 1.14, zc, 3.2, K, P.wind, rng, K.saffronCloth);
    pennant(G, CG, sg * 8.6, 23 + 6.3 * 0.98, zc, 2.8, K, P.wind, rng, K.saffronCloth);
  }
  return { kiosks, zf, zb };
}

// ---------- the clock tower: 34 m, four live dials, balcony, domed cupola ----------
function buildTower(G, CG, K, rng, cx, cz, P) {
  G.aux = [0, 0];
  G.box(cx, 0, cz, 9.4, 0.5, 9.4, K.stoneL, { g: 0.8 }); G.box(cx, 0.5, cz, 8.4, 0.5, 8.4, K.stone, { g: 0.85 }); G.box(cx, 1.0, cz, 7.4, 0.6, 7.4, K.stoneL, { g: 0.85 });
  G.box(cx, 1.6, cz, 6.2, 6.0, 6.2, K.stone, { g: 0.78, t: 0.97 });
  G.box(cx, 7.6, cz, 6.7, 0.4, 6.7, K.stoneL, { g: 0.8, bottom: true }); G.box(cx, 8.0, cz, 5.6, 0.3, 5.6, K.stone);
  G.box(cx, 8.3, cz, 4.7, 12.7, 4.7, K.stone, { g: 0.8 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.box(cx + sx * 2.3, 8.3, cz + sz * 2.3, 0.62, 12.7, 0.62, K.stoneL, { g: 0.8 });
  for (const yb of [12.4, 16.7]) G.box(cx, yb, cz, 5.25, 0.3, 5.25, K.stoneL, { g: 0.8, bottom: true });
  for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2, sn = Math.sin(a), cs = Math.cos(a);
    G.push(); G.set(cx + sn * 3.02, 0, cz + cs * 3.02, a);                 // base storey: arched door niche
    G.aux = [5, 0]; G.box(0, 1.7, 0, 2.0, 3.6, 0.1, K.dark, { g: 1 }); G.box(0, 5.3, 0, 2.0, 0.8, 0.1, K.dark, { t: 0.1, tz: 1, g: 1 });
    G.aux = [1, 0]; G.box(f % 2 ? 0.48 : -0.48, 1.75, 0.07, 0.96, 3.4, 0.08, f === P.door ? K.cobalt : K.indigo, { g: 0.75 });
    G.aux = [0, 0];
    for (const sx of [-1, 1]) G.box(sx * 1.25, 1.6, 0.14, 0.4, 4.9, 0.3, K.stoneL, { g: 0.8 });
    G.box(0, 6.5, 0.14, 3.2, 0.34, 0.34, K.stoneL, { bottom: true });
    G.pop();
    G.push(); G.set(cx + sn * 2.36, 0, cz + cs * 2.36, a);                 // shaft: slit windows with hoods
    for (const yw of [9.4, 13.6, 17.8]) {
      G.aux = [5, 0]; G.box(0, yw, 0, 0.9, 2.0, 0.1, K.dark, { g: 1 });
      G.aux = [1, 0]; if ((f + Math.round(yw)) % 3) G.box(0.22, yw + 0.05, 0.06, 0.42, 1.9, 0.06, K.indigo);
      G.aux = [0, 0];
      G.box(0, yw - 0.22, 0.12, 1.4, 0.2, 0.34, K.stoneL, { bottom: true });
      G.box(0, yw + 2.0, 0.12, 1.5, 0.42, 0.3, K.stoneL, { t: 0.15, tz: 1, bottom: true });
    }
    G.pop();
    G.push(); G.set(cx + sn * 3.35, 0, cz + cs * 3.35, a);                 // balcony rail and brackets
    G.box(0, 21.3, 0, 6.9, 0.14, 0.14, K.stoneL); G.box(0, 22.15, 0, 6.9, 0.16, 0.2, K.stoneL);
    for (let i = -5; i <= 5; i++) G.box(i * 0.66, 21.4, 0, 0.14, 0.78, 0.14, i % 5 === 0 ? K.stoneL : K.stone);
    for (const bxo of [-1.7, 0, 1.7]) { G.box(bxo, 20.1, -0.75, 0.34, 0.9, 0.5, K.stoneD, { g: 0.7, bottom: true }); G.box(bxo, 20.55, -0.4, 0.28, 0.45, 1.0, K.stone, { g: 0.7, bottom: true }); }
    G.pop();
    // dial frame: raised stone ring
    G.push(); G.set(cx + sn * 2.33, 24.1, cz + cs * 2.33, a, 1, Math.PI / 2);
    G.lathe(0, 0, 0, [[2.05, 0], [2.05, 0.2], [1.8, 0.26], [1.72, 0.06]], 20, (j) => (j === 1 ? K.stoneL : K.stone));
    G.pop();
    strand(CG, [cx + sn * 3.4 + cs * 2.6, 21.3, cz + cs * 3.4 - sn * 2.6], 3.2, 0.1, K, rng);
    swag(CG, [cx + sn * 3.45 - cs * 3.3, 21.25, cz + cs * 3.45 + sn * 3.3], [cx + sn * 3.45 + cs * 3.3, 21.25, cz + cs * 3.45 - sn * 3.3], 1.1, 0.12, K, rng);
  }
  G.box(cx, 21.0, cz, 6.9, 0.3, 6.9, K.stoneL, { g: 0.72, bottom: true });
  G.box(cx, 21.3, cz, 4.6, 5.4, 4.6, K.stone, { g: 0.85 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.box(cx + sx * 2.22, 21.3, cz + sz * 2.22, 0.5, 5.4, 0.5, K.stoneL, { g: 0.85 });
  G.box(cx, 26.7, cz, 5.3, 0.36, 5.3, K.stoneL, { g: 0.8, bottom: true });
  G.lathe(cx, 0, cz, [[3.3, 27.0], [4.75, 26.55], [4.82, 26.66], [3.4, 27.25]], 4, (j) => (j < 2 ? K.stoneD : K.stoneL), { rot: Math.PI / 4, flat: true });
  chhatri(G, cx, 27.15, cz, 1.05, K, !P.ribbed, 8);
  pennant(G, CG, cx, 27.15 + 6.3 * 1.05, cz, 2.6, K, P.wind, rng, K.saffronCloth);
  // dial quads for the clock shader
  const pos = [], uv = [], nor = [];
  for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2, n = [Math.sin(a), 0, Math.cos(a)], r = [Math.cos(a), 0, -Math.sin(a)], c = [cx + n[0] * 2.42, 24.1, cz + n[2] * 2.42], s = 1.76;
    const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    for (const [u, v] of q) { pos.push(c[0] + r[0] * u * s, c[1] + v * s, c[2] + r[2] * u * s); uv.push(u, v); nor.push(n[0], n[1], n[2]); }
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  dg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return dg;
}

function makeDialMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN;
      #include <fog_pars_fragment>
      float seg(vec2 p, float ang, float len, float w){ vec2 d = vec2(sin(ang), cos(ang)); float t = clamp(dot(p, d), -.12, len); return length(p - d * t) - w; }
      void main(){
        vec2 p = vUv; float r = length(p); if (r > 1.) discard;
        float aa = fwidth(r) * 1.5 + .004;
        vec2 pa = r > .01 ? p : vec2(0., 1.); float ang = atan(pa.x, pa.y);
        vec3 col = mix(vec3(.72, .69, .6), vec3(.62, .57, .46), smoothstep(.2, 1., r));
        float t12 = abs(fract(ang / 6.2831853 * 12. + .5) - .5) / 12. * 6.2831853 * r;
        float t60 = abs(fract(ang / 6.2831853 * 60. + .5) - .5) / 60. * 6.2831853 * r;
        float tick = (1. - smoothstep(.022, .022 + aa, t12)) * smoothstep(.70, .70 + aa, r) * (1. - smoothstep(.9, .9 + aa, r));
        tick = max(tick, (1. - smoothstep(.008, .008 + aa, t60)) * smoothstep(.83, .83 + aa, r) * (1. - smoothstep(.9, .9 + aa, r)));
        tick = max(tick, smoothstep(.93, .93 + aa, r) * (1. - smoothstep(.975, .975 + aa, r)));
        float mins = 2.0 + uTime / 90.;                        // a quarter turn every 22 s: visibly alive
        float hm = seg(p, mins * 6.2831853, .78, .028), hh = seg(p, (9. + fract(mins)) / 12. * 6.2831853, .5, .045);
        float hands = 1. - smoothstep(0., aa, min(min(hm, hh), r - .07));
        col = mix(col, vec3(.035, .04, .06), max(tick, hands));
        float l = max(dot(normalize(vN), normalize(uSun)), 0.);
        gl_FragColor = vec4(col * (vec3(.30, .36, .50) + vec3(1.05, .95, .78) * l), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------- an awning stall heaped with cones of powder ----------
function buildStall(G, CG, K, rng, x, z, ry, pal) {
  G.push(); CG.push(); G.set(x, 0, z, ry); CG.set(x, 0, z, ry);
  const w = rng.range(2.7, 3.7), d = 2.5, hb = rng.range(2.75, 3.15), hf = hb - rng.range(0.5, 0.85);
  G.aux = [1, 0];
  for (const [px, pz, h] of [[-w / 2, -d / 2, hb], [w / 2, -d / 2, hb], [-w / 2, d / 2, hf], [w / 2, d / 2, hf]])
    G.tube([[px * 1.05 + rng.range(-0.05, 0.05), 0, pz * 1.05], [px, h * 0.5, pz], [px, h + 0.18, pz]], 0.05, 4, (i) => mul(K.bamboo, 0.8 + i * 0.15));
  const nx = 6, nz = 4, ph = rng() * 6.28, sag = rng.range(0.12, 0.3), nn = [0, 1, 0.22];
  const ap = (u, v) => [(u - 0.5) * w * 1.1, hb + (hf - hb) * v - sag * 4 * u * (1 - u) * (0.35 + 2.4 * v * (1 - v)), (v - 0.5) * d * 1.16];
  const aw = (u, v) => [0.05 + 0.5 * u * (1 - u) * (0.3 + v), ph];
  const stripe = rng.int(1, 3);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const u0 = i / nx, u1 = (i + 1) / nx, v0 = j / nz, v1 = (j + 1) / nz, c = mul(Math.floor(i / stripe) % 2 ? pal[0] : pal[1], 0.86 + 0.14 * rng());
    for (const [u, v] of [[u0, v0], [u0, v1], [u1, v1], [u0, v0], [u1, v1], [u1, v0]]) { CG.aux = aw(u, v); CG.put(ap(u, v), nn, c); }
  }
  for (let i = 0; i < nx; i++) {                               // scalloped valance
    const u0 = i / nx, u1 = (i + 1) / nx, um = (u0 + u1) / 2, pm = ap(um, 1), c = mul(Math.floor(i / stripe) % 2 ? pal[0] : pal[1], 0.74);
    CG.aux = aw(u0, 1); CG.put(ap(u0, 1), [0, 0.3, 1], c); CG.aux = aw(u1, 1); CG.put(ap(u1, 1), [0, 0.3, 1], c);
    CG.aux = [0.24, ph + i]; CG.put([pm[0], pm[1] - 0.42, pm[2] + 0.03], [0, 0.3, 1], c);
  }
  CG.aux = [0, 0];
  const tc = mixc(K.white, pal[1], 0.25);
  G.aux = [1, 0]; G.box(0, 0, 0.15, w * 0.82, 0.78, 1.35, tc, { t: 0.95, g: 0.6 });
  const nc = rng.int(5, 7), c0 = rng.int(0, 2);
  for (let i = 0; i < nc; i++) {
    const cxn = (i / (nc - 1) - 0.5) * w * 0.66, czn = 0.15 + (i % 2 ? 0.28 : -0.24), r = rng.range(0.2, 0.28), h = rng.range(0.42, 0.62), pc = K.pow[(c0 + i) % 3];
    G.aux = [2, 0]; G.lathe(cxn, 0.78, czn, [[r + 0.12, 0], [r + 0.13, 0.05], [0, 0.05]], 6, K.brass);
    G.aux = [4, 0]; G.lathe(cxn, 0.8, czn, [[r, 0.02], [r * 0.56, h * 0.5], [0, h]], 6, (j) => mul(pc, 0.78 + j * 0.13));
  }
  for (const sx of [-1, 1]) if (rng() < 0.7) {                   // open sacks of powder beside the stall
    const pc = K.pow[rng.int(0, 2)], sxp = sx * (w * 0.5 + 0.55), szp = rng.range(0.2, 1.0);
    G.aux = [1, 0]; G.lathe(sxp, 0, szp, [[0.3, 0], [0.42, 0.34], [0.33, 0.6], [0.37, 0.64]], 6, (j) => mul(K.burlap, 0.75 + j * 0.08));
    G.aux = [4, 0]; G.lathe(sxp, 0, szp, [[0.34, 0.58], [0.2, 0.74], [0, 0.8]], 6, pc);
  }
  G.aux = [0, 0];
  G.pop(); CG.pop();
}

// ---------- the powder: every plume, burst and settling speck in one instanced draw ----------
// iA = origin xyz, height   iB = seed, colour id, type (0 plume, 1 burst, 2 speck), roofY   iC = radius, lean, square flag, rate
function makePowder(U, list) {
  const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { iA.set(list[i].a, i * 4); iB.set(list[i].b, i * 4); iC.set(list[i].c, i * 4); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      attribute vec4 iA, iB, iC;
      uniform float uTime, uPart, uErupt, uFire, uS; uniform vec3 uWind, uSun; uniform vec4 uLaneP[10], uLaneK;
      varying vec2 vUv; varying vec4 vB, vLane; varying vec3 vWp; varying float vAlpha, vLy, vShaft, vSide, vFoot, vSize;
      #include <fog_pars_vertex>
      float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      void main(){
        float seed = iB.x, type = iB.z, H = iA.w, sq = iC.z;
        vec3 o = iA.xyz, c; float size, alpha, hh = 0., hand = 0.; vSide = 0.;
        float er = mix(1., mix(.36, 1., uErupt), sq);
        if (type < .5) {
          float a = fract(uTime * iC.w + seed);
          hh = pow(a, .85);
          float fs = fract(seed * 7.13);
          float ang = h1(fs * 3.1) * 6.2831853 + uTime * .06 * (h1(fs * 9.7) - .5);
          float rr = sqrt(h1(fs * 5.3));
          vec2 off = vec2(cos(ang), sin(ang)) * (iC.x * (.35 + .5 * hh + 1.1 * hh * hh * hh) * rr);   // a column that opens only near its top
          c = o + vec3(off.x, H * hh * er, off.y);
          c.x += sin(uTime * .31 + fs * 40. + c.y * .21) * (.2 + 1.5 * hh);
          c.z += cos(uTime * .27 + fs * 31. + c.y * .17) * (.2 + 1.5 * hh);
          c.xz += uWind.xz * (iC.y * uWind.y * H * pow(hh, 2.2) * er);
          size = iC.x * (.8 + .9 * hh + 1.35 * hh * hh * hh) * mix(.75, 1.3, h1(fs * 7.7));
          alpha = smoothstep(0., .05, a) * (1. - smoothstep(.5, 1., a)) * mix(.7, 1., er) * (1. - .7 * hh) * .58;
          vSide = dot(normalize(off + vec2(1e-4, 0.)), normalize(uSun.xz + vec2(1e-4, 0.))) * rr;
        } else if (type < 1.5) {
          float grp = floor(seed), fs = fract(seed);
          float per = 1.4 + h1(grp * 1.7) * 1.3;
          float tt = uTime / per + h1(grp * 2.3), b = fract(tt), k = floor(tt);
          float ang = h1(grp * .73 + k * .37) * 6.2831853;
          vec3 dir = normalize(vec3(cos(ang) * .5 + (h1(fs * 91.) - .5) * .55, 1., sin(ang) * .5 + (h1(fs * 57.) - .5) * .55));
          hand = iC.w;                                             // 1: a handful thrown by someone we can see (crowd, roof)
          float reach = mix(3. + 5. * h1(fs * 13.), 6. + 4. * h1(fs * 13.), hand) * (1. - exp(-3.2 * b)) * mix(.7, 1.25, er);
          vec3 foot = o + vec3(cos(grp * 2.4 + k) * iC.x, 1.3, sin(grp * 2.4 + k) * iC.x);
          c = foot + dir * reach - vec3(0., 1.8 * b * b, 0.);
          c.xz += uWind.xz * (b * 1.6);
          hh = c.y / max(H, 1.) * .3;
          size = mix(.45 + 2.6 * b, .3 + 1.4 * b, hand); alpha = smoothstep(0., .06, b) * pow(1. - b, 1.3) * mix(.8, .95, hand);
          // roof handfuls near the route fly as the camera arrives (iC.y = metres along the path); the crowd's come in with the eruption
          if (iC.y > .5) alpha *= smoothstep(iC.y - 85., iC.y - 55., uS) * (1. - smoothstep(iC.y + 30., iC.y + 60., uS));
          float eg = .08 + .6 * h1(grp * .31);
          alpha *= mix(1., smoothstep(eg, eg + .25, uErupt), hand * sq);
        } else {
          float fall = .3 + .5 * h1(seed * 3.);
          c = o; c.y = mod(o.y - uTime * fall, H);
          c.x += sin(uTime * .5 + seed * 50.) * .7 + uWind.x * (H - c.y) * .06;
          c.z += cos(uTime * .43 + seed * 23.) * .7 + uWind.z * (H - c.y) * .06;
          size = .045 + .06 * h1(seed * 11.); alpha = .8 * smoothstep(0., 1.5, c.y) * (1. - smoothstep(H - 3., H, c.y));
        }
        // the parting: the square's cloud leans away from the centre line, more with height
        float sgn = o.x < 0. ? -1. : 1.;
        c.x += sq * (1. - hand) * sgn * uPart * (5. + 13. * hh) * exp(-abs(o.x) / 24.);
        vec3 wc = (modelMatrix * vec4(c, 1.)).xyz;
        vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        float dcam = length(cameraPosition - wc);
        // many small puffs, never a sheet: no sprite wider than 9 m, nor than an eighth of the view
        if (type < 1.5) size = min(min(size, 4.5), max(dcam * .12, .3));
        // bonfire eve: thrown handfuls become small bright sparks
        if (type > .5 && type < 1.5) size = mix(size, max(.05 + .07 * h1(seed * 3.3), dcam * .0021), uFire);
        vec3 wp = wc + (cr * position.x + cu * position.y) * size;
        alpha *= type > 1.5 ? smoothstep(2.5, 9., dcam) : (type > .5 ? smoothstep(3.5, 11., dcam) : mix(smoothstep(7., 20., dcam), smoothstep(9., 28., dcam), sq));   // nothing soft against the lens
        // the square's cloud never closes over the gate: thinner on the centre line, and thinner still along the sight line to the portal
        vec3 pp = (modelMatrix * vec4(0., 9., -60., 1.)).xyz - cameraPosition; float pl = max(length(pp), 1e-3); pp /= pl;
        vec3 ts = wc - cameraPosition; float al = dot(ts, pp), perp = length(ts - pp * al);
        float clear = max(smoothstep(4.5, 10. + size * .8, perp), step(pl, al));
        alpha *= mix(1., mix(.5, 1., smoothstep(5., 15., abs(c.x))) * mix(.22, 1., clear), sq * (1. - step(1.5, type)));
        vUv = position.xy; vB = iB; vWp = wp; vAlpha = alpha; vLy = c.y + cu.y * position.y * size; vFoot = vLy - o.y;
        vShaft = mix(.36, .3, sq); vSize = size;
        // the lane the camera runs: how far this corner stands across it (signed) and along it from the crossing, whether its walls
        // stand here at all, and the height they stand to (a handful thrown from a roof clears its own parapet)
        float ld = 1e9, lx = 0., ls = 0., lt = 0.;
        for (int i = 0; i < 9; i++) {
          vec4 la = uLaneP[i], lb = uLaneP[i + 1];
          vec2 ab = lb.xy - la.xy, ap = wp.xz - la.xy;
          float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
          vec2 e = ap - ab * t;
          float d = dot(e, e);
          if (d < ld) { ld = d; lx = (ab.x * ap.y - ab.y * ap.x < 0. ? -1. : 1.) * sqrt(d + 1e-6); ls = mix(la.z, lb.z, t); lt = mix(la.w, lb.w, t); }
        }
        float oy = (modelMatrix * vec4(o, 1.)).y;
        vLane = vec4(lx, ls - uLaneK.x, type > 1.5 ? 0. : smoothstep(uLaneK.z, uLaneK.z + 4., ls) * (1. - smoothstep(uLaneK.w - 4., uLaneK.w, ls)), oy > lt - 3.4 ? min(oy + .5, lt) : lt);
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol[5]; uniform vec3 uSun, uLitCol, uShadeCol, uFireCol; uniform float uTime, uGate, uFire; uniform vec4 uLaneK;
      varying vec2 vUv; varying vec4 vB, vLane; varying vec3 vWp; varying float vAlpha, vLy, vShaft, vSide, vFoot, vSize;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
        float soft = 1. - r2;
        vec3 base = vB.y < .5 ? uCol[0] : (vB.y < 1.5 ? uCol[1] : (vB.y < 2.5 ? uCol[2] : (vB.y < 3.5 ? uCol[3] : uCol[4])));
        // a puff, not a disc: a soft billowing edge broken by lumps, fine grain that stays on the puff close up, and (for thrown
        // handfuls) loose specks flung off the rim
        float a = soft * soft; vec2 lump = vec2(0.);
        // every puff turns its noise by its own angle (the sprites all face the camera: unturned, their noise cells line up into a
        // grid across the plume), and the fine octaves fade out before a cell is smaller than a few pixels
        float ra = vB.x * 17.3, rc = cos(ra), rs = sin(ra);
        mat2 rm = mat2(rc, -rs, rs, rc);
        vec2 ru = rm * vUv;
        float fu = fwidth(vUv.x);
        vec2 gq = ru * vSize * 9., gw = fwidth(gq);
        if (vB.z < 1.5) {
          float hand = step(.5, vB.z);
          vec2 q = ru * 2.6 + vB.x * 37.;
          float b = fb2(q), b2 = fb2(ru * 6.5 + vB.x * 91. - vec2(0., uTime * .08));
          float b3 = fb2(ru * 15. + vB.x * 53.);
          float k2 = 1. - smoothstep(.15, .4, fu * 6.5), k3 = 1. - smoothstep(.1, .25, fu * 15.);
          a = smoothstep(.1, .74, soft * (.3 + 1.5 * b) - .22 * mix(.5, b2, k2) - .16 * mix(.5, b3, k3));
          // the lumps that catch the light come from the broad octave only, turned back into the sprite's own axes
          lump = (vec2(vn2(q + vec2(.25, 0.)), vn2(q + vec2(0., .25))) - vn2(q)) * rm;
          float gk = 1. / (1. + 3. * dot(gw, gw));
          float g = hh21(floor(gq) + floor(vB.x * 64.));
          a *= mix(1., mix(.88, .64, hand) + mix(.24, .72, hand) * g, gk);
          a = max(a, hand * step(.8, g) * smoothstep(.02, .22, soft) * (1. - smoothstep(.3, .52, soft)) * .5 * gk);
        }
        float wisp = fb2(vec2(vWp.x + vWp.z * .7, vWp.y * .8 - uTime * .22) * .42 + floor(vB.x) * 1.3);
        if (vB.z < 1.5) a *= .66 + .68 * wisp;
        float spark = (vB.z > .5 && vB.z < 1.5) ? uFire : 0.;
        a = mix(a, soft, spark);
        // in the lane the powder thins to nothing before it meets a house wall (the lane itself, or its cross street): no wall
        // cuts a puff along a straight line
        float dw = max(3.45 - abs(vLane.x), uLaneK.y - .05 - abs(vLane.y));
        float wk = vLane.z * (1. - smoothstep(9.5, 10.5, abs(vLane.x))) * (1. - smoothstep(vLane.w, vLane.w + 1., vWp.y));
        a *= mix(1., smoothstep(0., 1., dw), wk);
        a *= vAlpha; if (a < .003) discard;
        vec3 sun = normalize(uSun);
        vec3 N = normalize(vec3(vUv - lump * 4., sqrt(max(soft, 0.)) + .3));
        vec3 Lv = normalize((viewMatrix * vec4(sun, 0.)).xyz);
        float nl = dot(N, Lv);
        float lit = smoothstep(vB.w - 2. + uGate, vB.w + 3.5 + uGate, vLy);
        // shafts: sheets of shadow thrown by the roofline, constant along the sun direction
        vec3 p2 = normalize(cross(vec3(0., 1., 0.), sun) + vec3(1e-4, 0., 0.)), p1 = normalize(cross(sun, p2));
        float sv = vn2(vec2(dot(vWp, p1) * .45 + uTime * .03, dot(vWp, p2) * .03) + floor(vB.x) * 3.7);
        float sv2 = vn2(vec2(dot(vWp, p1) * 1.1 - uTime * .02, dot(vWp, p2) * .05) + 17.);
        float shaftAmt = vShaft * (1. - smoothstep(vB.w + 9., vB.w + 20., vLy));
        float sh = mix(1., smoothstep(.41, .55, sv * .72 + sv2 * .28), shaftAmt);
        float sunAmt = lit * sh * max(.3, .56 + .44 * vSide);
        vec3 airy = mix(base, vec3(1.), .1);
        // a lit side and a shadowed side of different hue: warm and airy toward the sun, deeper and bluer away from it
        // (powder in the sun is bright all through: a puff's own far side is dimmed, never dark)
        float lk = sunAmt * mix(.3, 1., smoothstep(-.25, .6, nl));
        vec3 col = mix(base * uShadeCol * vec3(.66, .7, 1.) + uShadeCol * vec3(.03, .042, .075), mix(airy, vec3(1.), .17 * lk * lk) * uLitCol * 1.12, lk);
        float fwd = max(dot(normalize(vWp - cameraPosition), sun), 0.);
        col += airy * sunAmt * fwd * fwd * r2 * .9 * min(uLitCol.g, 1.);
        // bonfire eve: smoke lit from its foot, sparks in place of thrown handfuls
        col += uFireCol * uFire * (spark > .5 ? 3.2 : (vB.z < .5 ? .42 * exp(-max(vFoot, 0.) / 4.5) * soft : 0.));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
        gl_FragColor.rgb = max(gl_FragColor.rgb, 0.) * clamp(gl_FragColor.a, 0., 1.);
      }`,
  });
  mat.uniforms.uTime = U.uTime; mat.uniforms.uPart = U.uPart; mat.uniforms.uErupt = U.uErupt; mat.uniforms.uS = U.uS;
  mat.uniforms.uWind = U.uWind; mat.uniforms.uSun = U.uSun; mat.uniforms.uCol = U.uPow5; mat.uniforms.uLaneP = U.uLaneP; mat.uniforms.uLaneK = U.uLaneK;
  mat.uniforms.uLitCol = U.uLitCol; mat.uniforms.uShadeCol = U.uShadeCol; mat.uniforms.uFireCol = U.uFireCol; mat.uniforms.uGate = U.uGate; mat.uniforms.uFire = U.uFire;
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}

// ---------- pigeons: instanced, orbiting and flapping in the vertex shader ----------
// iO = orbit centre xyz, radius   iP = angular speed, phase, bob height, powder tint id (-1 none)
function makePigeons(U, list) {
  const n = list.length, iO = new Float32Array(n * 4), iP = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { iO.set(list[i].o, i * 4); iP.set(list[i].p, i * 4); }
  const g = new THREE.InstancedBufferGeometry();
  // body diamond + two wings; z forward; aW = 1 on wing tips
  const P = [0, 0, 0.3, -0.09, 0, 0, 0.09, 0, 0, -0.09, 0, 0, 0, 0, -0.34, 0.09, 0, 0,
    -0.07, 0.01, 0.14, -0.62, 0.01, -0.02, -0.07, 0.01, -0.14, 0.07, 0.01, 0.14, 0.07, 0.01, -0.14, 0.62, 0.01, -0.02];
  const W = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 1));
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 4));
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      attribute float aW; attribute vec4 iO, iP;
      uniform float uTime; varying vec3 vCol; varying float vTint, vUp;
      #include <fog_pars_vertex>
      void main(){
        float an = iP.y + uTime * iP.x, dirn = iP.x < 0. ? -1. : 1.;
        float rr = iO.w * (1. + .16 * sin(an * 1.7 + iP.y * 3.));
        vec3 c = iO.xyz + vec3(cos(an) * rr, sin(an * 2.3 + iP.y * 5.) * iP.z, sin(an) * rr);
        vec3 fw = vec3(-sin(an), 0., cos(an)) * dirn, rt = vec3(fw.z, 0., -fw.x);
        float beat = sin(uTime * 15. + iP.y * 9.), glide = smoothstep(.55, .9, sin(uTime * .7 + iP.y * 4.));
        float flap = mix(beat * .85, .22, glide);
        vec3 p = position * 1.7;
        p.y += aW * flap * abs(p.x) ; p.x *= 1. - aW * abs(flap) * .28;
        float bank = .35 * dirn;
        vec3 l = rt * (p.x * cos(bank)) + vec3(0., 1., 0.) * (p.y + p.x * sin(bank)) + fw * p.z;
        float nearK = smoothstep(3., 8., distance(cameraPosition, (modelMatrix * vec4(c, 1.)).xyz));   // never a flat shape against the lens
        l *= nearK;
        vec4 wp = modelMatrix * vec4(c + l, 1.);
        vCol = mix(vec3(.27, .29, .34), vec3(.62, .64, .68), aW * (.5 + .5 * beat));
        vTint = iP.w; vUp = aW;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol[3]; varying vec3 vCol; varying float vTint, vUp;
      #include <fog_pars_fragment>
      void main(){
        vec3 col = vCol;
        vec3 tc = vTint < .5 ? uCol[0] : (vTint < 1.5 ? uCol[1] : uCol[2]);
        col = mix(col, tc, vTint < -.5 ? 0. : .55);
        gl_FragColor = vec4(col * 1.25, 1.);
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uTime = U.uTime; mat.uniforms.uCol = U.uPow;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------- the crowd: one instanced figure, arms up, hopping; tinted by the powder it stands in ----------
async function makeCrowd(U, people, fine) {
  const G = makeGeo(), skin = [0.42, 0.27, 0.17], cloth = [0.86, 0.86, 0.86], hair = [0.06, 0.05, 0.05];
  if (fine) {                                                    // seen from a few metres (the roofs, the lane): a waist, a skirt of a second tone, bent arms, hair
    G.lathe(0, 0, 0, [[0.16, 0], [0.2, 0.5], [0.14, 0.96], [0.21, 1.32], [0.07, 1.5]], 4, (j) => (j < 2 ? mul(cloth, 0.6) : cloth), { rot: Math.PI / 4 });
    G.lathe(0, 0, 0, [[0.07, 1.47], [0.12, 1.6], [0.1, 1.73], [0, 1.8]], 4, (j) => (j > 1 ? hair : skin));
    G.aux = [1, 0];                                              // aux.x = 1 on the arms (the vertex shader swings only those)
    for (const s of [-1, 1]) G.tube([[s * 0.2, 1.36, 0], [s * 0.31, 1.68, 0.07], [s * 0.3, 2.02, 0.1]], (i) => 0.056 - i * 0.008, 3, (i) => (i > 0 ? skin : cloth));
  } else {
    G.lathe(0, 0, 0, [[0.13, 0], [0.24, 1.22], [0.08, 1.5]], 4, (j) => (j === 0 ? mul(cloth, 0.45) : cloth));
    G.lathe(0, 0, 0, [[0.08, 1.48], [0.125, 1.62], [0, 1.8]], 4, (j) => (j > 1 ? hair : skin));
    G.aux = [1, 0];
    for (const s of [-1, 1]) G.tube([[s * 0.2, 1.36, 0], [s * 0.33, 2.0, 0.1]], 0.05, 3, (i) => (i > 0 ? skin : cloth));
  }
  G.aux = [0, 0];
  const geo = await G.build();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  // iPose = (pose: 0 both arms up, 1 one arm throwing, 2 crouched over the powder; 1 if it throws whatever uErupt says; phase)
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uErupt = U.uErupt; sh.uniforms.uCrowd = U.uCrowd;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uErupt; uniform float uCrowd; attribute vec3 iPose; attribute vec2 aux;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float cph = iPose.z * 6.2831853, pose = iPose.x, er = max(uErupt, iPose.y);
        float spd = 2. + fract(iPose.z * 7.31) * 2.6;
        float hop = abs(sin(uTime * spd + cph));
        float arm = aux.x * smoothstep(1.42, 2.0, position.y), rightArm = step(0., position.x);
        float one = step(.5, pose) * step(pose, 1.5), crouch = step(1.5, pose);
        float hang = arm * max(1. - er, one * (1. - rightArm));                      // arms that are not in the air hang at the side
        float sw = sin(uTime * spd * 1.25 + cph * 2.);
        transformed.y += hop * hop * (.1 + .2 * er) * (1. - .7 * crouch) - hang * 1.05 - arm * crouch * .55 * (1. - hang);
        transformed.x += (sin(uTime * 5.3 + cph * 3.) * .14 * (1. - one) - sign(position.x) * .09 * hang) * arm + sin(uTime * 1.7 + cph) * .05 * position.y;
        transformed.z += cos(uTime * 4.1 + cph * 2.) * .1 * arm * (1. - one) + (sw * .42 * one * rightArm + .32 * crouch) * arm * (1. - hang);
        transformed.y -= (.5 - .5 * sw) * .3 * one * rightArm * arm * (1. - hang);
        transformed.y *= 1. - .3 * crouch;
        transformed *= max(uCrowd, iPose.y);`);
  };
  mat.customProgramCacheKey = () => 'holi-crowd4';
  const mesh = new THREE.InstancedMesh(geo, mat, people.length), poses = new Float32Array(people.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), yA = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  for (let i = 0; i < people.length; i++) {
    const p = people[i], h = Math.sin(p.x * 12.9898 + p.z * 78.233 + i * 0.37) * 43758.5453;
    m.compose(new THREE.Vector3(p.x, p.y || 0, p.z), q.setFromAxisAngle(yA, p.ry), new THREE.Vector3(p.s, p.s, p.s));
    mesh.setMatrixAt(i, m); mesh.setColorAt(i, col.setRGB(p.c[0], p.c[1], p.c[2]));
    poses[i * 3] = p.pose || 0; poses[i * 3 + 1] = p.always ? 1 : 0; poses[i * 3 + 2] = h - Math.floor(h);
  }
  geo.setAttribute('iPose', new THREE.InstancedBufferAttribute(poses, 3));
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('standing-colour') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group(); root.name = 'blue-city-holi-hero';

  // per-seed character
  const perm = rng.shuffle([0, 1, 2]);                          // which colour stands left, centre, right
  const windRoll = Math.PI + rng.range(-0.3, 0.3);              // the breeze blows west, give or take
  const windA = opts.windAngle ?? windRoll;
  const wind = [Math.cos(windA), Math.sin(windA)];
  const leanRoll = rng.chance(0.2) ? rng.range(0.03, 0.08) : rng.range(0.14, 0.3);   // one morning in five the air is still
  const leanK = opts.lean ?? leanRoll;
  const lobes = rng.pick([9, 11]), ribbed = rng.chance(0.5), whiteDomes = rng.chance(0.6);
  let stone = pal[3];
  stone = mixc(mixc(stone, [0.6, 0.47, 0.34], 0.38), rng.chance(0.5) ? [0.6, 0.3, 0.2] : [0.62, 0.44, 0.2], rng.range(0, 0.35));
  const K = {
    stone, stoneL: mixc(stone, [0.8, 0.72, 0.6], 0.34), stoneD: mul(stone, 0.6),
    white: mul(pal[2], 0.84), indigo: pal[0], cobalt: pal[1], dark: [0.03, 0.035, 0.06],
    brass: [0.8, 0.52, 0.14], marigold: mul(pal[5], 0.95), gold: [0.9, 0.6, 0.06], rope: [0.3, 0.25, 0.18],
    bamboo: [0.5, 0.4, 0.22], burlap: [0.42, 0.33, 0.2], saffronCloth: mul(pal[5], 0.95), pow: [pal[4], pal[5], pal[6]],
  };
  K.dome = whiteDomes ? K.white : K.stoneL;
  const sunInit = opts.sunDir ? V3(opts.sunDir[0], opts.sunDir[1], opts.sunDir[2]).normalize() : V3(0.845, 0.53, 0.074);
  const U = {
    uTime: { value: 0 }, uPart: { value: opts.parting ?? 0.7 }, uErupt: { value: 1 },
    uSun: { value: sunInit }, uWind: { value: V3(wind[0], 1, wind[1]) },
    uPow: { value: K.pow.map((c) => new THREE.Color().setRGB(c[0], c[1], c[2])) },
    uLitCol: { value: V3(1.75, 1.58, 1.3) }, uShadeCol: { value: V3(0.33, 0.35, 0.5) }, uFireCol: { value: V3(1.0, 0.42, 0.12) },
    uFeet: { value: Array.from({ length: 16 }, () => new THREE.Vector4(9999, 9999, 0, 0.1)) },
    uGate: { value: 0 }, uFire: { value: 0 }, uStainK: { value: 1 }, uS: { value: 0 }, uCrowd: { value: 1 },
  };
  // powder colours 0..2 are the brief's three; opts.extraColors adds up to two more for a five-colour year
  const extra = (opts.extraColors || []).map(lin);
  U.uPow5 = { value: [0, 1, 2, 3, 4].map((i) => { const c = i < 3 ? K.pow[i] : (extra[i - 3] || K.pow[i - 3]); return new THREE.Color().setRGB(c[0], c[1], c[2]); }) };
  // opts.lane: a walled lane the powder must not be cut by: { pts: ten of [x, z, metres along, wall top], cross: metres along of its
  // cross street, half: that street's half width, from, to: metres along between which the walls stand }. Without it: no lane.
  const ln = opts.lane, lnP = ln && Array.isArray(ln.pts) && ln.pts.length === 10 ? ln.pts : null;
  U.uLaneP = { value: Array.from({ length: 10 }, (_, i) => (lnP ? new THREE.Vector4(lnP[i][0], lnP[i][1], lnP[i][2], lnP[i][3]) : new THREE.Vector4(9e5 + i * 10, 9e5, i * 10, 0))) };
  U.uLaneK = { value: lnP ? new THREE.Vector4(ln.cross ?? 0, ln.half ?? 0, ln.from ?? 0, ln.to ?? 0) : new THREE.Vector4(0, 0, 9e5, -9e5) };

  // ---- solids ----
  const G = makeGeo(), CG = makeGeo();
  // paving with a kerb skirt
  G.aux = [3, 0];
  const pave = mul(mixc(K.stone, [0.5, 0.47, 0.44], 0.55), 0.82), S = 66, NP = 12;
  const pcol = (z) => mul(pave, 0.9 + 0.14 * ctx.noise.n2(z * 0.05, 3.3));
  for (let i = 0; i < NP; i++) for (let j = 0; j < NP; j++) {
    const x0 = -S + (i / NP) * 2 * S, x1 = -S + ((i + 1) / NP) * 2 * S, z0 = -S + (j / NP) * 2 * S, z1 = -S + ((j + 1) / NP) * 2 * S;
    G.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], pcol(z1), pcol(z0), [0, 1, 0]);
  }
  for (const [ax, az, bx, bz, hx, hz] of [[-S, S, S, S, 0, 1], [S, -S, -S, -S, 0, -1], [S, S, S, -S, 1, 0], [-S, -S, -S, S, -1, 0]])
    G.quad([ax, -0.7, az], [bx, -0.7, bz], [bx, 0, bz], [ax, 0, az], mul(pave, 0.6), pave, [hx, 0, hz]);
  G.aux = [0, 0];
  const gate = await buildGate(G, CG, K, rng, { yield: () => ctx.yield?.(), z: -60, lobes, shut: rng.int(0, 2), ribbed, wind, cloths: [K.white, K.white, mul(pal[0], 1.3), pal[1], mul(pal[2], 0.7)], edges: [mul(pal[5], 0.9), mul(pal[0], 1.2), mul(pal[4], 0.85)] });
  await ctx.yield?.();
  const TX = -26, TZ = 10;
  const dialGeo = buildTower(G, CG, K, rng, TX, TZ, { door: rng.int(0, 3), ribbed, wind });
  await ctx.yield?.();

  // stalls round the edge of the square
  const awnings = [[K.white, mul(pal[0], 1.25)], [K.white, mul(pal[1], 0.95)], [[0.7, 0.6, 0.44], K.white], [K.white, mul(pal[5], 0.8)], [mul(pal[1], 0.9), mul(pal[0], 1.2)]];
  const stalls = [];
  const sideN = rng.int(10, 12);
  for (let i = 0; i < sideN; i++) {
    const z = -46 + (i / (sideN - 1)) * 92;
    stalls.push([-54, z, Math.PI / 2], [54, z, -Math.PI / 2]);
  }
  for (const x of [34, 43.5]) stalls.push([x, -53, 0], [-x, -53, 0]);
  for (const x of [15, 24.5, 34, 43.5]) stalls.push([x, 55, Math.PI], [-x, 55, Math.PI]);
  const stallAnchors = [];
  let stallN = 0;
  for (const s of stalls) {
    if (++stallN % 2 === 0) await ctx.yield?.();
    if (rng() < 0.06) continue;                                  // a gap where someone has not set up
    const x = s[0] + rng.range(-0.7, 0.7), z = s[1] + rng.range(-0.7, 0.7), ry = s[2] + rng.range(-0.14, 0.14);
    buildStall(G, CG, K, rng, x, z, ry, rng.pick(awnings));
    stallAnchors.push({ position: V3(x, 0, z), rotationY: ry });
  }
  await ctx.yield?.();

  // masts and bunting, kept clear of the centre line
  const flagCols = [K.white, K.saffronCloth, mul(pal[0], 1.3), K.white, pal[1], mul(pal[4], 0.9), K.white, mul(pal[6], 0.9)];
  const masts = [[-37, -27], [37, -27], [-39, 33], [39, 33]].map(([x, z]) => [x + rng.range(-2, 2), 10.5 + rng.range(0, 2), z + rng.range(-2, 2)]);
  for (const [mx, mh, mz] of masts) {
    G.aux = [0, 0]; G.box(mx, 0, mz, 1.1, 0.7, 1.1, K.stoneL, { t: 0.8 });
    G.aux = [1, 0]; G.tube([[mx, 0.6, mz], [mx + 0.06, mh * 0.5, mz], [mx, mh, mz]], (i) => 0.11 - i * 0.025, 6, (i) => mul(K.bamboo, 0.75 + i * 0.12));
    G.aux = [2, 0]; G.lathe(mx, mh, mz, [[0.05, 0], [0.16, 0.12], [0.05, 0.28], [0, 0.45]], 6, K.brass); G.aux = [0, 0];
  }
  const top = (i) => [masts[i][0], masts[i][1] - 0.2, masts[i][2]];
  bunting(CG, top(0), [TX + 3.3, 21.4, TZ - 3.3], 2.2, K, rng, flagCols);
  bunting(CG, top(2), [TX - 3.3, 21.4, TZ + 3.3], 1.8, K, rng, flagCols);
  bunting(CG, top(0), [-20.5, 17.6, gate.zf + 0.3], 1.6, K, rng, flagCols);
  bunting(CG, top(1), [20.5, 17.6, gate.zf + 0.3], 1.6, K, rng, flagCols);
  bunting(CG, top(0), top(2), 2.6, K, rng, flagCols);
  bunting(CG, top(1), top(3), 2.6, K, rng, flagCols);
  bunting(CG, top(1), [53.5, 3.2, -30 + rng.range(-6, 6)], 1.2, K, rng, flagCols);
  bunting(CG, top(3), [53.5, 3.2, 30 + rng.range(-6, 6)], 1.2, K, rng, flagCols);
  bunting(CG, top(2), [-53.5, 3.2, 36 + rng.range(-6, 6)], 1.2, K, rng, flagCols);
  bunting(CG, top(3), [30 + rng.range(-4, 4), 3.2, 54.5], 1.4, K, rng, flagCols);
  bunting(CG, top(2), [-30 + rng.range(-4, 4), 3.2, 54.5], 1.4, K, rng, flagCols);

  await ctx.yield?.();
  const stoneMesh = new THREE.Mesh(await G.build(() => ctx.yield?.()), makeStoneMaterial(U));
  stoneMesh.castShadow = true; stoneMesh.receiveShadow = true; root.add(stoneMesh);
  await ctx.yield?.();
  const clothMesh = new THREE.Mesh(await CG.build(() => ctx.yield?.()), makeClothMaterial(U));
  clothMesh.castShadow = true; clothMesh.frustumCulled = false; root.add(clothMesh);
  const dialMat = makeDialMaterial(U); dialMat.uniforms.uTime = U.uTime; dialMat.uniforms.uSun = U.uSun;
  root.add(new THREE.Mesh(dialGeo, dialMat));
  await ctx.yield?.();

  // ---- the standing colour ----
  const [cA, cB, cC] = perm, j = () => rng.range(-3, 3);
  const plumes = [];
  const sqp = (x, z, col) => plumes.push({ x: x + j() * (Math.abs(x) < 10 ? 0.3 : 1), y: 0, z: z + j(), h: rng.range(21, 30), R: rng.range(1.6, 2.4), col, roofY: rng.range(3.5, 5.5), sq: 1, lean: Math.min(leanK, 0.22), rate: 1 / rng.range(11, 15), n: 120 });
  sqp(-7, -36, cA); sqp(7, -31, cC); sqp(-6, -13, cB); sqp(6.5, -9, cA);
  // none near the side edges of the approach: the blue ring of houses stays in the picture
  const flank = rng.shuffle([[-20, -41, cA], [-35, -19, cB], [-17, 32, cB], [-13, 6, cA], [22, -42, cC], [36, -15, cB], [19, 8, cC], [21, 35, cC]]);
  for (let i = 0, nf = rng.int(5, 6); i < nf; i++) sqp(flank[i][0], flank[i][1], [cA, cB, cC][(i + 1) % 3]);   // round-robin: no colour holds more than four of the square's plumes
  const nOuter = opts.outerPlumes ?? (opts.plumes ? 0 : 10);
  for (let i = 0; i < nOuter; i++) {
    const a = 0.45 + ((i + rng.range(0.1, 0.9)) / nOuter) * (Math.PI * 2 - 0.9), R = rng.range(63, 71);   // none on the approach line
    plumes.push({ x: Math.sin(a) * R, y: 0, z: Math.cos(a) * R, h: rng.range(16, 27), R: rng.range(1.8, 2.6), col: (i + perm[0]) % 3, roofY: rng.range(6, 9.5), sq: 0, lean: leanK * 1.15, rate: 1 / rng.range(12, 17), n: 60 });
  }
  for (const p of opts.plumes || []) plumes.push({ x: p.x, y: p.y ?? 0, z: p.z, h: p.height ?? 22, R: p.radius ?? 2.8, col: p.color ?? 0, roofY: p.roofY ?? ((p.y ?? 0) + 8), sq: 0, lean: leanK * 1.15, rate: 1 / rng.range(12, 17), n: p.count ?? 60, nb: p.bursts ?? 3, bs: p.burstS ?? 0, hf: p.handful ? 1 : 0 });
  plumes.sort((a, b) => a.z - b.z);                              // far ones first for the approach from +Z
  const list = [], starts = []; let gid = 0;
  plumes.forEach((pl, idx) => {
    starts.push(list.length);
    for (let k = 0; k < pl.n; k++) list.push({ a: [pl.x, pl.y, pl.z, pl.h], b: [idx + rng() * 0.999, pl.col, 0, pl.roofY], c: [pl.R, pl.lean, pl.sq, pl.rate * rng.range(0.85, 1.15)] });
    for (let g2 = 0; g2 < (pl.nb ?? 3); g2++) { const grp = gid++; for (let k = 0, nk = pl.hf ? 14 : 11; k < nk; k++) list.push({ a: [pl.x, pl.y, pl.z, pl.h], b: [grp + rng() * 0.999, pl.col, 1, pl.roofY], c: [pl.R * 0.7, pl.bs || 0, pl.sq, pl.hf || 0] }); }
  });
  // opts.ranks: more plumes of the same kind ([{ x, y, z, height, radius, color, roofY, count }]), each with one group of thrown handfuls.
  // Everything random about their sprites comes from a stream of their own, their plume and group numbers lie past the ones above, and
  // their sprites are set into the draw by z among the others (far ones first), so the plumes above keep their numbers and their draws.
  if (opts.ranks && opts.ranks.length && ctx.core) {
    const rk = ctx.core.makeRng(ctx.core.hashSeed('holi-rank-sprites:' + ctx.seed));
    const blocks = plumes.map((pl, i) => ({ z: pl.z, items: list.slice(starts[i], i + 1 < plumes.length ? starts[i + 1] : list.length) }));
    opts.ranks.forEach((p, k) => {
      const y = p.y ?? 0, h = p.height ?? 22, R = p.radius ?? 2.8, col = p.color ?? 0, roofY = p.roofY ?? (y + 8), rate = 1 / rk.range(12, 17), items = [];
      for (let q = 0, n = p.count ?? 80; q < n; q++) items.push({ a: [p.x, y, p.z, h], b: [plumes.length + k + rk() * 0.999, col, 0, roofY], c: [R, leanK * 1.15, 0, rate * rk.range(0.85, 1.15)] });
      for (let q = 0; q < 11; q++) items.push({ a: [p.x, y, p.z, h], b: [512 + k + rk() * 0.999, col, 1, roofY], c: [R * 0.7, 0, 0, 0] });
      blocks.push({ z: p.z, items });
    });
    blocks.sort((a, b) => a.z - b.z);
    list.length = 0;
    for (const bl of blocks) for (const it of bl.items) list.push(it);
  }
  // ---- where the crowd stands: tight knots round the plume feet and in front of a few stalls, trodden lanes between ----
  const sqPl = plumes.filter((p) => p.sq), knots = sqPl.map((pl) => ({ x: pl.x, z: pl.z, col: pl.col, r0: pl.R * 0.6 + 0.8 }));
  for (let i = 0, tries = 0; i < 2 && tries < 40 && stallAnchors.length; tries++) {
    const st = rng.pick(stallAnchors), x = st.position.x * 0.84, z = st.position.z * 0.84;
    if (Math.abs(x) < 8 || knots.some((k) => Math.hypot(k.x - x, k.z - z) < 11) || Math.hypot(x + 26, z - 10) < 9) continue;
    knots.push({ x, z, col: rng.int(0, 2), r0: 0.4 }); i++;
  }
  // the crowd's own handfuls: small bursts thrown up out of the knots as the square erupts
  // (they go last in the draw: until the square erupts they are not there at all, and are not drawn)
  const handfuls = [];
  for (let g2 = 0, nb = Math.round(46 * Math.max(0.7, detail)); g2 < nb; g2++) {
    const kn = knots[g2 % knots.length], grp = gid++, bx = kn.x + rng.gauss() * 2.6, bz = kn.z + rng.gauss() * 2.6, col = rng() < 0.7 ? kn.col : rng.int(0, 2);
    for (let k = 0; k < 24; k++) handfuls.push({ a: [bx, 0, bz, 24], b: [grp + rng() * 0.999, col, 1, 2.6], c: [0.5, 0, 1, 1] });
  }
  const nSpeck = Math.round(900 * detail);
  for (let i = 0; i < nSpeck; i++) list.push({ a: [rng.range(-62, 62), rng.range(0, 32), rng.range(-62, 62), 32], b: [rng() * 100, rng.int(0, 2), 2, 0], c: [0, 0, 0, 0] });
  const nQuiet = list.length;
  for (let i = 0; i < handfuls.length; i++) list.push(handfuls[i]);
  await ctx.yield?.();
  const powder = makePowder(U, list); root.add(powder);
  const erupt = (k) => { U.uErupt.value = k; powder.geometry.instanceCount = k > 0 ? list.length : nQuiet; };
  await ctx.yield?.();

  // ---- crowd ----
  const people = [], nPeople = Math.round((opts.crowd ?? 750) * detail);
  sqPl.slice(0, 16).forEach((pl, i) => U.uFeet.value[i].set(pl.x, pl.z, pl.col, pl.R * 2.3 + 3.2));
  const okSpot = (x, z) => Math.abs(x) < 49 && z > -53 && z < 49 && Math.hypot(x - TX, z - TZ) > 6.6;
  for (let guard = 0; people.length < nPeople && guard < nPeople * 30; guard++) {
    let x, z, ry, ci;
    const roll = rng();
    if (roll < 0.7) {                                            // pressed into a knot, facing its middle
      const kn = rng.pick(knots), a = rng() * 6.283, r = kn.r0 + Math.abs(rng.gauss()) * 2.5;
      x = kn.x + Math.cos(a) * r; z = kn.z + Math.sin(a) * r; ry = Math.atan2(kn.x - x, kn.z - z) + rng.range(-0.5, 0.5); ci = kn.col;
    } else if (roll < 0.95) {                                    // strung out between the knots, on their way from one to the next
      const ka = rng.pick(knots), kb = rng.pick(knots), t = rng.range(0.15, 0.85);
      x = ka.x + (kb.x - ka.x) * t + rng.gauss() * 1.3; z = ka.z + (kb.z - ka.z) * t + rng.gauss() * 1.3; ry = Math.atan2(kb.x - ka.x, kb.z - ka.z) + rng.range(-0.4, 0.4) + (rng() < 0.5 ? Math.PI : 0); ci = rng() < 0.5 ? ka.col : kb.col;
    } else { x = rng.range(-48, 48); z = rng.range(-52, 48); ry = rng() * 6.283; ci = rng.int(0, 2); }
    if (!okSpot(x, z)) continue;
    const base = rng() < 0.72 ? [0.8, 0.8, 0.78] : rng.pick([mul(pal[1], 1.1), mixc(pal[0], [1, 1, 1], 0.3), [0.7, 0.55, 0.36]]);
    const pr = rng(), child = rng() < 0.16;
    people.push({ x, y: 0, z, ry, s: child ? rng.range(0.56, 0.74) : rng.range(0.9, 1.12), c: mixc(base, K.pow[rng() < 0.75 ? ci : rng.int(0, 2)], rng.range(0.2, 0.8)),
      pose: pr < 0.36 ? 1 : pr < 0.5 ? 2 : 0, always: 0 });
  }
  // people the world stands on its roofs: the same figure and program, throwing from the first frame; a mesh of their own, so
  // the square's crowd can be culled as one body (it is in no shadow box until the camera reaches the square)
  const roofPeople = [];
  for (const f of opts.figures || []) roofPeople.push({ x: f.x, y: f.y ?? 0, z: f.z, ry: f.ry ?? 0, s: f.s ?? 1, c: f.c || mixc([0.8, 0.8, 0.78], K.pow[(f.color ?? 0) % 3], 0.5), pose: f.pose ?? 1, always: 1 });
  await ctx.yield?.();
  const crowd = await makeCrowd(U, people); crowd.castShadow = true; crowd.frustumCulled = true; crowd.computeBoundingSphere(); crowd.boundingSphere.radius += 3; root.add(crowd);
  let roofMesh = null;
  if (roofPeople.length) { roofMesh = await makeCrowd(U, roofPeople, true); roofMesh.castShadow = true; root.add(roofMesh); }
  await ctx.yield?.();

  // ---- pigeons ----
  const birds = [], dirT = rng.sign();
  for (let i = 0; i < 26; i++) birds.push({ o: [TX, 29 + rng.range(-2.5, 4), TZ, rng.range(6.5, 12)], p: [dirT * rng.range(0.5, 0.75), rng() * 6.283, rng.range(0.4, 1.4), rng() < 0.25 ? rng.int(0, 2) : -1] });
  for (let i = 0; i < 22; i++) birds.push({ o: [rng.range(-6, 6), 31 + rng.range(-1, 5), -60 + rng.range(-3, 3), rng.range(11, 24)], p: [-dirT * rng.range(0.28, 0.45), rng() * 6.283, rng.range(0.6, 2.2), rng() < 0.3 ? rng.int(0, 2) : -1] });
  for (let i = 0; i < 20; i++) birds.push({ o: [rng.range(-10, 10), 40 + 0.5 * rng.range(-5, 8), rng.range(-20, 10), rng.range(24, 42)], p: [dirT * rng.range(0.16, 0.26), rng() * 6.283, rng.range(1, 3), rng() < 0.6 ? rng.int(0, 2) : -1] });
  root.add(makePigeons(U, birds));

  // ---- contract ----
  const eF = opts.eruptFrom ?? 0.6, eT = opts.eruptTo ?? 0.76, pF = opts.partFrom ?? 0.8, pT = opts.partTo ?? 0.9;
  let sunFound = !!opts.sunDir;
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const hero = {
    object: root, radius: 50, extent: 72, height: 36, center: V3(0, 12, -16), ground: true, groundY: -0.5,
    uniforms: U, triangles: (G.count + CG.count) / 3 + list.length * 2 + (people.length + roofPeople.length) * 40 + birds.length * 4,
    anchors: {
      portalSeat: { position: V3(0, 9, -60), facing: V3(0, 0, 1), radius: 7, tiltDeg: 9 },
      flyThrough: [V3(0, 33, 90), V3(0, 27.3, 54), V3(0, 21.6, 18), V3(0, 15.9, -18), V3(0, 11.2, -46), V3(0, 9, -60)],
      gateCenter: V3(0, 9, -60), gateTop: V3(0, 24, -60), clockTower: V3(TX, 34, TZ), clockDial: V3(TX, 24.1, TZ + 2.4),
      fortSightline: V3(0, 0.25, -1).normalize(),
      viewpoints: [
        { name: 'reveal', position: V3(0, 33, 90), lookAt: V3(0, 13, -60) },
        { name: 'descent', position: V3(0, 21.6, 18), lookAt: V3(0, 10, -60) },
        { name: 'finale', position: V3(0, 13.6, -31), lookAt: V3(0, 9, -60) },
      ],
      plumeFeet: plumes.map((p) => ({ position: V3(p.x, p.y, p.z), color: p.col, height: p.h, radius: p.R, square: !!p.sq })),
      kiosks: gate.kiosks.map((k) => V3(k[0], k[1], k[2])),
      stalls: stallAnchors,
      masts: masts.map((m) => V3(m[0], m[1], m[2])),
      tintClouds: [{ center: V3(0, 27, 52), radius: 20, color: cA }, { center: V3(0, 22.5, 24), radius: 20, color: cB }, { center: V3(0, 18, -4), radius: 20, color: cC }],
      windDir: V3(wind[0], 0, wind[1]),
    },
    setProgress(u) { erupt(sstep(eF, eT, u)); U.uPart.value = sstep(pF, pT, u); },
    setParting(k) { U.uPart.value = Math.min(1, Math.max(0, k)); },
    setEruption(k) { erupt(Math.min(1, Math.max(0, k))); },
    // 0..1: the square's crowd grows out of the paving (0 = not drawn at all, for the long approach when it is a few pixels and 30k triangles)
    setCrowd(k) { U.uCrowd.value = Math.min(1, Math.max(0, k)); crowd.visible = k > 0.002 || !roofMesh; },   // (the roof figures keep the program warm)
    update(dt, time) {
      U.uTime.value = time;
      if (!sunFound && root.parent) {
        let top2 = root; while (top2.parent) top2 = top2.parent;
        top2.traverse((o) => {
          if (sunFound || !o.isDirectionalLight) return;
          o.getWorldPosition(tmpA); o.target.getWorldPosition(tmpB); tmpA.sub(tmpB);
          if (tmpA.lengthSq() > 1e-6) { U.uSun.value.copy(tmpA.normalize()); }
          sunFound = true;
        });
        sunFound = true;
      }
    },
    dispose() {},
  };
  return hero;
}
