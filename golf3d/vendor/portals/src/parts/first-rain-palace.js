// PALACE OF THE FIRST RAIN (first-rain-palace): hero set piece "The rain front striking".
//
// WHAT     A white marble island palace painted as a Mewar court miniature, and the monsoon front that swallows it.
//          Palace: 160 m square on a lotus-moulded plinth, four wings round a tiled court, octagonal corner towers,
//          about fifty bracketed and domed jharokha balconies (22 on the front, the close-pass face), three rows of
//          cusped lamp niches drawn in the shader on every wall (their flames light as the front passes), kangura
//          parapets, chhatris to 38 m, a central pavilion with a bulbous dome and gold finial, a frontispiece with
//          three through-arches (fountains in the court show through them) under a loggia terrace that holds the
//          canopied swing on gold chains with its trailing scarf, saffron and vermilion awnings on gold poles,
//          swallow-tailed pennants, marigold garlands, saris over the balustrades, landing steps with brass pots,
//          painted mango trees on the roof, and a water-gate (pierced screens, 13 m cusped arch, bastion kiosk) off
//          the far front corner. Weather: the FRONT is a plane across local X that travels toward +X: a wall of
//          ruled, slanting pearl strokes (sheets every 60-110 m behind it, strokes re-ruled by distance so rows stay
//          countable from 2 km to 4 m), camera-following ruled strokes on the wet side, a dark band of lake pocked
//          with rings, a scalloped spray line at its foot, basket-weave ripple lines that tighten behind the wind
//          line, water falling from the eaves in dotted lines after the hit, one gold lightning snake, and a flat
//          sky page (the ground colour, and behind ONE straight leading edge a slate-indigo carpet band, a paler band and the flat pearl
//          rain-sky, 400 m up, leading the front; no scallops, curls or volutes). The rain is drawn after everything solid and writes no
//          depth; a sheet seen edge-on is not drawn, and far off only the front wall stands. The snakes (leaf-gold ribbons over a dark
//          ink line twice as wide) are drawn after the rain. opts.bolt0X/bolt0Jit/bolt0Dz/bolt0End/bolt0Wide place and shape the first
//          snake for a world that starts it somewhere of its own; hero.boltMeshes hands over the meshes so the world can carry it.
//          uniforms.uTop is the height of the rain cards (default 400): the world lowers it to hang the wall from the scroll's edge.
// STYLE    One unlit gouache shader: palette colour per vertex, ONE hard cool step on faces turned from the key,
//          umber hairlines (face borders and silhouettes, fwidth-sized), paper tooth. Only gold leaf is above 1.0.
// SIZE     Local metres, origin at the centre of the palace on the water (y 0), +Y up, the detailed FRONT faces +Z
//          (the brief's south face). Plinth face at |x|,|z| = 80, walls at 78.8, roof terrace 26, chhatris to 38,
//          crown domes to 39, the central dome's finial 49. `radius` 78, `height` 38 and `center` are ORBIT HINTS
//          for the part viewer; true extents: anchors.bounds.
// PASS     opts.pass 'left' (default): the camera travels local +X along z = 88, so in three.js the palace is on its
//          LEFT and the open lake, kiosks and lightning on its right, as the brief's prose and evaluator frames say;
//          the front then travels toward -X and the wet side is x > front. Place with rotation.y = -PI/2 at
//          (0,0,460) and run the path on world x = -88 (the brief's x mirrored; a camera heading +Z has +X on its
//          left). opts.pass 'right': everything mirrored for the brief's literal coordinates (rotation.y = +PI/2,
//          path on world x = +88, palace on the camera's right). anchors.placement carries the chosen one.
// ANCHORS  (all local)  placement {position, rotationY, pathX}; flyThrough: the brief's path in local space, entry
//          to portal, 5.5 m clear of all masonry (the close pass runs z = 88; awnings and pennants come within 4 m);
//          portalSeat {position, facing, radius}: where the 14 m portal stands, 78 m beyond the water-gate (the
//          world's lake pavilion goes round it); hit: where the front meets the barge at u 0.45; faceLook: the
//          point of interest on the face; swing; waterGate {position, width, height, axis}; peacockPerches (front
//          side, ordered along the pass; the piece already seats a peacock on each), allPerches, gardenSpots (roof),
//          kiosks, pennants, lightning, frontAxis (the way the front travels), side, keyDir, lampRows, bounds.
// OPTS     palette  7 hex strings in the brief's order (yellow, indigo, marble, slate, vermilion, malachite, gold)
//          pass     'left' | 'right' (above);   keyDir [x,y,z] local key direction (default WSW sun, 50 degrees up)
//          water    false: omit the lake apron (weave, band, rings, spray) when the world draws its own lake
//          sky      false: omit the sky page;   lightning false: omit the gold snake;   rain false: no sheets/strokes
//          waterGate, kiosks, peacocks: false omits each
//          bolt0Z, bolt0Y: where the head of the first snake stands (local z out from the palace's axis, default 600; height, default 405)
// PROGRESS setProgress(u): the brief's timetable (front from the far shore, across the level lake at 30 m/s, the
//          hit at u 0.45, lightning one from u 0.31); setFront(x) puts the front at a local x directly;
//          setLightning(p) 0..1 draws, holds (a glint running along it) and thins the snake away. Lamps light, eaves
//          pour, pennants snap round and cloth gusts as the front (and the wind line 60 m ahead of it) passes each
//          thing; peacocks raise and shiver their fans as the camera comes level (keyed to camera position, not time).
//          Until one of the setters is called the piece runs a VIEWER DEMO: the front sweeps with the orbiting
//          camera's azimuth and the snake loops. Shared uniforms: hero.uniforms. setCloud(x) places the leading cloud
//          roll on its own; setLightning(p, i) drives bolt i (0 before the hit, 1 beyond the pavilion).
//          More opts for the world's looks: skyGround, cloud, cloudEdge (hex), stars, lampAll (0..1), wash (hex), cool.
//          `gouache` (exported) hands the world the accumulator, the shaders and the building blocks.
//          The lake: two flat tones (uniforms uLake, uLakeHi; opts.lake, opts.lakeDeep) and a painted mirror of lens-shaped strokes, one
//          flat colour each, under the palace and under every box given to reflBox (uReflWet: how far the rain thins it).
// COST     about 86k triangles, 10 draw calls (palace 1, cloth 1, lake 1, sheets 1, strokes 1, two snakes each with a halo 4, sky 1),
//          about 350 ms to build, no lights, no textures. Expects flat post ({ flat: 1 }, bloom threshold above 1 so
//          only gold blooms), no fog (scene fog is honoured if present), no shadows. Marble is the exact palette
//          white (albedo 0.88), kept under the default bloom threshold.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PALETTE = ['#F0A81E', '#1F2A5C', '#F6F1E3', '#4F5D6B', '#D8341F', '#2F8F5B', '#E9B949'];
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const WALL = 78.8, PLINTH = 80, ROOF = 26, ROWS = [4.3, 13.6, 22.6], NICHE_W = 2.6667;
// material ids (aMat): +0.5 switches the face-border hairline off
const M_PLAIN = 0, M_WALL = 1, M_JALI = 2, M_LOTUS = 3, M_GOLD = 4, M_KANG = 5, M_STRIPE = 6, M_PIER = 7, M_TILE = 8, M_DOME = 9, M_DASH = 10, M_BEAD = 11, M_DRIP = 12, M_LEAF = 13, M_FEATHER = 14;

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
// cusped (multifoil) arch: height of the opening edge at s = |x| / halfWidth. The same formula is in the shader.
const archY = (s, spring, rise) => { s = Math.min(1, Math.abs(s)); return spring + rise * Math.sqrt(Math.max(0, 1 - s * s)) * (1 - 0.16 * (1 - Math.abs(Math.cos(9.42478 * s)))) + rise * 0.22 * Math.max(0, 1 - 5 * s); };

// ---------- geometry accumulator (indexed quads, own attributes) ----------
function makeAcc(cloth) {
  const P = [], N = [], C = [], U = [], M = [], A = [], K = [], I = [];
  let nv = 0, m = new THREE.Matrix4(), piv = [0, 0, 0, 0], kind = 0;
  const nm = new THREE.Matrix3(), stack = [], v = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Quaternion(), t = new THREE.Matrix4(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const acc = {
    get tris() { return I.length / 3; },
    push(x, y, z, ry = 0, s = 1) { stack.push(m.clone()); t.compose(p3.set(x, y, z), q.setFromAxisAngle(Y_AXIS, ry), s3.set(s, s, s)); m.multiply(t); nm.getNormalMatrix(m); return acc; },
    pop() { m = stack.pop(); nm.getNormalMatrix(m); return acc; },
    world(x, y, z) { v.set(x, y, z).applyMatrix4(m); return [v.x, v.y, v.z]; },
    anim(k, x, y, z, ph) { kind = k; v.set(x, y, z).applyMatrix4(m); piv = [v.x, v.y, v.z, ph]; },
    vert(px, py, pz, nx, ny, nz, c, u0, u1, u2, u3, mat, w = 0) {
      v.set(px, py, pz).applyMatrix4(m); n.set(nx, ny, nz).applyMatrix3(nm).normalize();
      P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c[0], c[1], c[2]); U.push(u0, u1, u2, u3); M.push(mat);
      if (cloth) { A.push(piv[0], piv[1], piv[2], piv[3]); K.push(kind, w); }
      return nv++;
    },
    tri(a, b, c) { I.push(a, b, c); },
    // a,b,c,d counter-clockwise seen from outside (a bottom-left). o: { u0, v0, wt: [4 cloth weights], cols: [4 colours] }
    quad(a, b, c, d, col, mat = 0, o = {}) {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const w = Math.hypot(e1[0], e1[1], e1[2]), h = Math.hypot(e2[0], e2[1], e2[2]), u0 = o.u0 || 0, v0 = o.v0 || 0, wt = o.wt || [0, 0, 0, 0];
      const i0 = acc.vert(a[0], a[1], a[2], nx, ny, nz, col, u0, v0, w, h, mat, wt[0]);
      const i1 = acc.vert(b[0], b[1], b[2], nx, ny, nz, col, u0 + w, v0, w, h, mat, wt[1]);
      const i2 = acc.vert(c[0], c[1], c[2], nx, ny, nz, col, u0 + w, v0 + h, w, h, mat, wt[2]);
      const i3 = acc.vert(d[0], d[1], d[2], nx, ny, nz, col, u0, v0 + h, w, h, mat, wt[3]);
      I.push(i0, i1, i2, i0, i2, i3);
    },
    // box standing on y; o: { t / tx / tz: top scale (taper), cap: top colour, bottom: true, capMat }
    box(x, y, z, sx, sy, sz, col, mat = 0, o = {}) {
      const tx = o.tx ?? o.t ?? 1, tz = o.tz ?? o.t ?? 1, hx = sx / 2, hz = sz / 2, y1 = y + sy;
      const b = [[x - hx, y, z + hz], [x + hx, y, z + hz], [x + hx, y, z - hz], [x - hx, y, z - hz]];
      const tp = [[x - hx * tx, y1, z + hz * tz], [x + hx * tx, y1, z + hz * tz], [x + hx * tx, y1, z - hz * tz], [x - hx * tx, y1, z - hz * tz]];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; acc.quad(b[i], b[j], tp[j], tp[i], col, mat, o); }
      acc.quad(tp[0], tp[1], tp[2], tp[3], o.cap || col, o.capMat ?? mat);
      if (o.bottom) acc.quad(b[3], b[2], b[1], b[0], col, mat);
    },
    // n-sided prism or frustum with flat faces; u runs round it so wall patterns continue
    ngon(nSides, r0, r1, y0, y1, col, mat = 0, o = {}) {
      const rot = o.rot ?? Math.PI / nSides, pt = (i, r, y) => { const a = rot + (i / nSides) * Math.PI * 2; return [Math.sin(a) * r, y, Math.cos(a) * r]; };
      const side = 2 * r0 * Math.sin(Math.PI / nSides);
      for (let i = 0; i < nSides; i++) acc.quad(pt(i, r0, y0), pt(i + 1, r0, y0), pt(i + 1, r1, y1), pt(i, r1, y1), col, mat, o.wrap ? { u0: i * side, v0: y0 } : {});
      if (o.cap !== false && r1 > 0.01) for (let i = 1; i < nSides - 1; i += 2) acc.quad(pt(0, r1, y1), pt(i, r1, y1), pt(i + 1, r1, y1), pt(Math.min(i + 2, nSides - 1), r1, y1), o.capCol || col, (o.capMat ?? M_PLAIN) + 0.5);
    },
    // smooth surface of revolution; prof = [[r, y], ...] bottom to top; uv = (angle, 0..1 up the profile), outline by view angle
    lathe(prof, seg, col, mat = 0, o = {}) {
      const np = prof.length, base = nv, sq = o.squash || 1;
      for (let j = 0; j < np; j++) {
        const a0 = prof[Math.max(0, j - 1)], a1 = prof[Math.min(np - 1, j + 1)]; let dr = a1[0] - a0[0], dy = a1[1] - a0[1]; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
        const c = o.cols ? o.cols[j] : col;
        for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a); acc.vert(cs * prof[j][0], prof[j][1], sn * prof[j][0] * sq, cs * dy, -dr, sn * dy, c, a, j / (np - 1), -1, 0, mat); }
      }
      for (let j = 0; j < np - 1; j++) for (let i = 0; i < seg; i++) { const p0 = base + j * (seg + 1) + i, p1 = p0 + 1, p2 = p0 + seg + 1, p3 = p2 + 1; I.push(p1, p0, p2, p1, p2, p3); }
    },
    // plate with a cusped arch cut out of its lower edge, in the z=0 plane facing +Z, centred on x; hairline along the cusps
    archPlate(w, spring, rise, top, col, o = {}) {
      const segs = o.segs || 14, hw = w / 2, z = o.z || 0, shade = o.shade || mulc(col, 0.82);
      for (let i = 0; i < segs; i++) {
        const xa = -hw + (i / segs) * w, xb = -hw + ((i + 1) / segs) * w, ya = archY(xa / hw, spring, rise), yb = archY(xb / hw, spring, rise);
        const i0 = acc.vert(xa, ya, z, 0, 0, 1, col, 500 + xa, 0, 1e4, 1e4, M_PLAIN), i1 = acc.vert(xb, yb, z, 0, 0, 1, col, 500 + xb, 0, 1e4, 1e4, M_PLAIN);
        const i2 = acc.vert(xb, top, z, 0, 0, 1, col, 500 + xb, top - yb, 1e4, 1e4, M_PLAIN), i3 = acc.vert(xa, top, z, 0, 0, 1, col, 500 + xa, top - ya, 1e4, 1e4, M_PLAIN);
        I.push(i0, i1, i2, i0, i2, i3);
        if (o.depth) acc.quad([xa, ya, z], [xa, ya, z - o.depth], [xb, yb, z - o.depth], [xb, yb, z], shade, M_PLAIN + 0.5);
      }
    },
    // the same, one attribute at a time with a pause between (big meshes must not hold the page)
    async toGeometryAsync(Y) {
      const g = new THREE.BufferGeometry(), f = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);
      g.setAttribute('position', f(P, 3)); await Y(); g.setAttribute('normal', f(N, 3)); await Y(); g.setAttribute('color', f(C, 3)); await Y(); g.setAttribute('aUv', f(U, 4)); await Y(); g.setAttribute('aMat', f(M, 1)); await Y();
      if (cloth) { g.setAttribute('aAnim', f(A, 4)); await Y(); g.setAttribute('aK', f(K, 2)); await Y(); }
      g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(I), 1) : new THREE.BufferAttribute(new Uint16Array(I), 1)); await Y();
      g.computeBoundingSphere(); return g;
    },
    toGeometry() {
      const g = new THREE.BufferGeometry(), f = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);
      g.setAttribute('position', f(P, 3)); g.setAttribute('normal', f(N, 3)); g.setAttribute('color', f(C, 3)); g.setAttribute('aUv', f(U, 4)); g.setAttribute('aMat', f(M, 1));
      if (cloth) { g.setAttribute('aAnim', f(A, 4)); g.setAttribute('aK', f(K, 2)); }
      g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(I), 1) : new THREE.BufferAttribute(new Uint16Array(I), 1));
      g.computeBoundingSphere(); return g;
    },
  };
  return acc;
}

// ---------- the gouache shader (palace and cloth) ----------
// Metres behind the front at a local x (below 0: the front has not reached it yet). ONE text, put into both halves of the gouache shader:
// the lamps in the niches, the eave drips and the rain-dancing peacocks all call it.
const BEHIND_FRONT = /* glsl */`float behindFront(float x) { return (uFrontX - x) * uSide; }`;
// The near boat's track (cloth kind 15), named once so that the shader text and a world that must know where such a hull goes use the
// same numbers: it rows `reach` metres to and fro along local x with a nod of `nod` on each stroke, and `slant` of that along local z.
const NEAR_BOAT = { reach: 16, nod: 0.25, slant: 0.45 };
const GOUACHE_VERT = /* glsl */`
attribute vec4 aUv; attribute float aMat;
#ifdef CLOTH
attribute vec4 aAnim; attribute vec2 aK; uniform float uWindX, uSide, uFrontX, uFrontRun;
${BEHIND_FRONT}
#endif
uniform float uTime; uniform vec3 uCamL;
varying vec3 vP, vN, vC, vV; varying vec4 vUv; varying float vMat, vFold;
#include <fog_pars_vertex>
void main() {
  vec3 p = position, n = normal; vFold = 0.;
  #ifdef CLOTH
  float wet = smoothstep(-14., 14., (uWindX - aAnim.x) * uSide), g = mix(1., 2.4, wet), ph = aAnim.w, k = aK.x, w = aK.y;
  vec3 r = p - aAnim.xyz;
  if (k < 1.5) {            // pennant: swings round its pole with the wind line, droops in the calm, cracks in the gust
    float l = r.x, th = mix(2.75 + 0.22 * sin(uTime * 0.8 + ph), 0.14 * sin(uTime * 3.1 + ph), wet) + 0.3 * sin(wet * 3.14159) * sin(uTime * 9. + ph);
    float arg = l * 2.4 - uTime * (4.5 + 7. * wet) + ph, wave = sin(arg) * (0.09 + 0.15 * wet) * l * 0.5;
    vec3 d = vec3(cos(th) * uSide, 0., sin(th)), s = vec3(-sin(th), 0., cos(th) * uSide);
    p = aAnim.xyz + d * l + vec3(0., r.y - mix(0.45, 0.05, wet) * l + wave * 0.3, 0.) + s * wave; n = s; vFold = cos(arg);
  } else if (k < 2.5) {     // awning: billows, harder in the gust
    float arg = uTime * 2.1 * g + ph + (p.x + p.z) * 0.7; p.y += (sin(arg) * 0.2 + sin(uTime * 5.3 + ph * 2. + (p.x + p.z) * 2.1) * 0.05 * g) * w * g * 0.6; vFold = cos(arg) * w;
  } else if (k < 3.5) {     // swing: pendulum about its beam; the scarf (w > 0) lags and flutters
    float a = 0.42 * sin(uTime * 1.45 + ph - w * 0.8) * (1. + w * 0.6), c = cos(a), s = sin(a);
    p = aAnim.xyz + vec3(r.x + w * sin(uTime * 3. + r.y * 2.) * 0.15, r.y * c - r.z * s, r.y * s + r.z * c); vFold = w * sin(uTime * 3. + r.y * 4.);
  } else if (k < 5.5) {     // garlands, fringes, saris: sway along the normal
    float arg = uTime * (1.3 + 0.5 * k) * sqrt(g) + ph + (p.x + p.z) * 1.3; p += n * (sin(arg) * 0.2 * w * g); vFold = cos(arg) * step(4.5, k) * w;
  } else if (k < 6.5) {     // peacock train: lies folded behind the bird, rises into a fan and shivers as the eye comes level
    float s = smoothstep(36., 14., abs(aAnim.x - uCamL.x)), len = length(r) + 1e-4;
    vec3 off = normalize(mix(vec3(r.x * 0.15, -0.42 * len, -0.9 * len), r, s) + vec3(0., 1e-5, 0.)) * len;
    off.x += sin(uTime * 24. + ph + r.y * 3.) * 0.03 * len * step(0.7, s); p = aAnim.xyz + off;
  } else if (k < 7.5) {     // oar: beats about its lock every 1.5 s, the blade in the water on the way back
    float sg = aAnim.x < 0. ? -1. : 1., cy = uTime * 4.18879 + ph, sw = 0.5 * sin(cy) * sg, lf = (0.2 * max(0., cos(cy)) + 0.01) * sg;
    float c = cos(sw), s = sin(sw); vec3 q = vec3(r.x * c + r.z * s, r.y, -r.x * s + r.z * c);
    c = cos(lf); s = sin(lf); p = aAnim.xyz + vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z);
  } else if (k < 8.5) {     // comma splash where a blade goes in: swells and is left behind
    float f = fract((uTime * 4.18879 + ph - 1.5708) / 6.28318), sc = f < 0.45 ? sin(f * 6.98) : 0.;
    p = aAnim.xyz + r * sc + vec3(0., 0., f * 2.4);
  } else if (k < 9.5) {     // lotus pad or flower: rocks, flips pale side up as the wind line crosses it, bounces under the rain
    float fl = sin(wet * 3.14159) * 2.7 * w + 0.07 * sin(uTime * 1.7 + ph), c = cos(fl), s = sin(fl);
    float rainy = step(0., (uWindX - aAnim.x) * uSide - 60.);
    p = aAnim.xyz + vec3(r.x, r.y * c - r.z * s, r.y * s + r.z * c) + vec3(0., abs(sin(uTime * 8. + ph * 3.)) * 0.11 * rainy + 0.25 * sin(wet * 3.14159) * w, 0.);
  } else if (k < 10.5) {    // parasol: twirls, then tilts and is drawn in under the roof as the rain arrives
    float t = smoothstep(-70., 10., (uWindX - aAnim.x) * uSide - 60.), a = 0.12 * sin(uTime * 0.9 + ph) + 1.0 * t, c = cos(a), s = sin(a);
    p = aAnim.xyz + vec3(r.x * c - r.y * s, r.x * s + r.y * c, r.z) * (1. - 0.85 * t) - vec3(0., 3.2 * t, 0.);
  } else if (k < 11.5) {    // shelduck: paddles off to the side as the prow comes up
    float fl = smoothstep(75., 12., aAnim.x - uCamL.x) * step(-30., aAnim.x - uCamL.x);
    p += vec3(fl * 5., sin(uTime * 3.3 + ph) * 0.05, (ph > 3.14159 ? 1. : -1.) * fl * 9.) + vec3(sin(uTime * 0.6 + ph) * 0.5, 0., 0.);
  } else if (k < 12.5) {    // frog: one leap off its pad when the rain reaches it
    float t = clamp(((uWindX - aAnim.x) * uSide - 60.) / 22., 0., 1.);
    p = aAnim.xyz + r * step(t, 0.995) + vec3(cos(ph) * 2.6 * t, 5.2 * t * (1. - t), sin(ph) * 2.6 * t);
  } else if (k < 13.5) {    // far boat: rows slowly back and forth across the page, further at page scale
    float sc = 1. + max(aAnim.x - 300., 0.) / 600.; p += vec3(0., sin(uTime * 1.3 + ph) * 0.12 * sc, 55. * sc * sin(uTime * 0.07 + ph));
  } else if (k < 14.5) {    // langur: runs along the cornice for cover when the wind line passes
    float t = clamp(((uWindX - aAnim.x) * uSide) / 240., 0., 1.);
    p += vec3((ph > 3.14159 ? 1. : -1.) * 46. * t, abs(sin(t * 70. + ph)) * 0.6 * step(0.001, t) * step(t, 0.999), 0.);
  } else if (k < 15.5) {    // near boat: rows to and fro along the line of travel (never across it: the lake crossing runs 0.45 across per metre up the page), nodding on each stroke
    float cy = uTime * 2.1 + ph, m = ${NEAR_BOAT.reach.toFixed(1)} * sin(uTime * 0.06 + ph) + ${NEAR_BOAT.nod} * sin(cy); p += vec3(m, 0.05 * sin(cy), ${NEAR_BOAT.slant} * m);
  } else {                  // rain-dancing peacock (16: its train, 17: its body)
    // It dances when the rain has reached ITS OWN place. RIDING, named: the fan's rise s reads the front at the bird's own pivot by
    // behindFront(), the one function live's niche lamps and eave drips call; it rises over one second of the front's travel
    // (uFrontRun, which the world sets from its own two numbers, the front's run a share of the flight over the flight's seconds).
    // The rise reads nothing of the eye and nothing of the share of the flight. The slow turn on its feet and the fan's shiver run
    // on the clock (uTime), rate and phase from each bird's own drawn phase. Before the rain the train trails closed along the wall
    // beside the bird.
    float s = smoothstep(0., uFrontRun, behindFront(aAnim.x)), a = 0.22 * s * sin(uTime * (0.35 + 0.2 * fract(ph * 1.618)) + ph * 2.3), c = cos(a), sn = sin(a);
    vec3 off = r;
    if (k < 16.5) {
      float len = length(r) + 1e-4; vec3 nh = normalize(vec3(n.x, 0., n.z) + vec3(0., 0., 1e-5)), th = vec3(nh.z, 0., -nh.x);
      off = normalize(mix(th * (0.97 * len) + vec3(0., 0.03 * len + 0.12 * r.y + 1e-5, 0.), r, s)) * len;
      off += th * (sin(uTime * 24. + ph + r.y * 3.) * 0.03 * len * step(0.7, s));
    }
    p = aAnim.xyz + vec3(off.x * c + off.z * sn, off.y, -off.x * sn + off.z * c); n = vec3(n.x * c + n.z * sn, n.y, -n.x * sn + n.z * c);
  }
  #endif
  vP = p; vN = n; vC = color; vUv = aUv; vMat = aMat; vV = uCamL - p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const GOUACHE_FRAG = /* glsl */`
uniform vec3 uKey, uCool, uUmber, uGold, uInk, uVerm, uYellow, uPearl, uRows, uWash;
uniform float uTime, uFrontX, uLamp, uSide, uLampAll;
${BEHIND_FRONT}
varying vec3 vP, vN, vC, vV; varying vec4 vUv; varying float vMat, vFold;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cusp(vec2 q, float hw, float spring, float rise) {
  float s = clamp(abs(q.x) / hw, 0., 1.);
  float top = spring + rise * sqrt(max(1. - s * s, 0.)) * (1. - 0.16 * (1. - abs(cos(9.42478 * s)))) + rise * 0.22 * max(0., 1. - 5. * s);
  return min(min(hw - abs(q.x), q.y), top - q.y);
}
float aaLine(float d, float fw) { return 1. - smoothstep(0.7 * fw, 1.5 * fw, abs(d)); }
// A rain streak on a wall: dx metres across from its middle, d metres below its head, w0 wide at the head, L long. ONE FLAT TINT over the
// whole mark (this page has no gradients): only its shape tapers, to half its width at the foot; head and foot are hard. fx, fy: the
// pixel's footprint along and up the wall (the streak is box-filtered across over fx, its head and its foot are eased over fy and over
// nothing more), so it is drawn as the thing at every distance.
float streak(float dx, float d, float w0, float L, float fx, float fy) {
  float t = clamp(d / L, 0., 1.), hw = 0.5 * w0 * (1. - 0.5 * t);
  float cov = clamp((min(dx + 0.5 * fx, hw) - max(dx - 0.5 * fx, -hw)) / fx, 0., 1.);
  return cov * smoothstep(0., fy, d) * smoothstep(0., fy, L - d);
}
void main() {
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vV + vec3(0., 1e-5, 0.));
  float id = floor(vMat + 0.25), line = 0., glow = 0.;
  bool edges = fract(vMat + 0.25) < 0.5, smoothS = vUv.z < 0.;
  vec3 col = vC; vec2 uv = vUv.xy, fw = max(fwidth(uv), vec2(1e-5));
  if (id == 1. || id == 7.) {                       // marble wall: rain streaks, repair patches, course lines, cusped lamp niches (7: a pier, one niche centred on its face)
    float wu = vP.x * N.z - vP.z * N.x, ff = max(fwidth(wu), fwidth(vP.y)) + 1e-5, fx = fwidth(wu) + 1e-5, fy = fwidth(vP.y) + 1e-5;
    bool pier = id == 7., upright = abs(N.y) < 0.5;
    // the niche cell this fragment lies in: its number and the metres across from its middle (a pier's one cell is centred on its face)
    float ncell = floor(wu / 2.6667), nq = (fract(wu / 2.6667) - 0.5) * 2.6667;
    if (pier) { nq = uv.x - 0.5 * vUv.z; ncell = floor((wu - nq) / 2.6667); }
    // rain streaks: one under a course line in 45 of 100 of the wall's 0.9 m columns, one under half the niche sills at a foot of the opening
    if (upright) {
      float kc = ceil((vP.y - 1.875) / 3.75), cc = floor(wu / 0.9), st = 0.; vec2 hc = vec2(cc, kc);
      if (hash(hc + 31.) > 0.55) st = streak(wu - (cc + 0.5 + (hash(hc + 7.3) - 0.5) * 0.5) * 0.9, 1.875 + 3.75 * kc - vP.y, 0.15 + 0.3 * hash(hc + 13.1), 1.2 + 2. * hash(hc + 19.7), fx, fy);
      vec3 ds = uRows + 0.03 - vP.y; float d2 = -1., rw = 0.;
      if (ds.x > 0. && ds.x < 2.) d2 = ds.x; else if (ds.y > 0. && ds.y < 2.) { d2 = ds.y; rw = 1.; } else if (ds.z > 0. && ds.z < 2.) { d2 = ds.z; rw = 2.; }
      if (pier && (rw > 0.5 || vUv.z < 2.5)) d2 = -1.;
      vec2 hn = vec2(ncell, rw * 5. + 2.);
      if (d2 > 0. && hash(hn) > 0.5) st = max(st, streak(nq - (hash(hn + 3.7) > 0.5 ? 0.62 : -0.62), d2, 0.15 + 0.2 * hash(hn + 5.9), 0.8 + 1.2 * hash(hn + 8.3), fx, fy));
      col *= mix(vec3(1.), vec3(0.9, 0.925, 0.95), st * (1. - smoothstep(0.3, 0.6, fx)));
    }
    // repair patches: the old cells and tone, the step eased over the pixel's footprint, a ruled hairline round each (the neighbour cell
    // across the nearest edge is asked whether it is a patch too, so the line is drawn from both sides and not between two patches)
    vec2 pc = vec2(wu / 5.3, vP.y / 3.1), pi = floor(pc), pf = fract(pc), pn = pi + vec2(pf.x > 0.5 ? 1. : -1., pf.y > 0.5 ? 1. : -1.);
    float p0 = step(0.94, hash(pi + vec2(0., 9.))), pX = step(0.94, hash(vec2(pn.x, pi.y + 9.))), pY = step(0.94, hash(vec2(pi.x, pn.y + 9.)));
    float dX = min(pf.x, 1. - pf.x) * 5.3, dY = min(pf.y, 1. - pf.y) * 3.1, eX = smoothstep(-0.5 * fx, 0.5 * fx, dX), eY = smoothstep(-0.5 * fy, 0.5 * fy, dY);
    float pcov = p0 > 0.5 ? mix(eX, 1., pX) * mix(eY, 1., pY) : max(pX * (1. - eX), pY * (1. - eY));
    col *= mix(vec3(1.), vec3(1., 0.965, 0.9), pcov);
    if (upright) line = max(line, 0.4 * max(abs(p0 - pX) * aaLine(dX, fx), abs(p0 - pY) * aaLine(dY, fy)));
    line = max(line, 0.3 * aaLine(fract(vP.y / 3.75) - 0.5, ff / 3.75) * step(abs(N.y), 0.5));
    vec3 dr = vP.y - uRows; float ry = -1.;
    if (dr.x > 0. && dr.x < 1.9) ry = dr.x; else if (dr.y > 0. && dr.y < 1.9) ry = dr.y; else if (dr.z > 0. && dr.z < 1.9) ry = dr.z;
    if (pier && (dr.x <= 0. || dr.x >= 1.9 || vUv.z < 2.5)) ry = -1.;
    if (ry >= 0. && abs(N.y) < 0.5) {
      float cell = ncell; vec2 q = vec2(nq, ry - 0.12);
      float f = cusp(q, 0.62, 0.8, 0.62), inside = smoothstep(-0.5 * ff, 0.5 * ff, f);
      col = mix(col, uInk, inside); line = max(line, aaLine(f, ff));
      line = max(line, 0.4 * aaLine(min(ry - 0.03, 1.87 - ry), ff));
      float loz = 0.13 - abs(abs(q.x) - 1.3333) - abs(q.y - 0.72) * 0.7; col = mix(col, uVerm, smoothstep(-0.5 * ff, 0.5 * ff, loz) * 0.85);
      float lit = max(step(4. + hash(vec2(cell, floor(vP.y))) * 20., behindFront(vP.x)), step(hash(vec2(cell, floor(vP.y) + 3.)), uLampAll)) * uLamp, big = 1. + clamp(ff * 9., 0., 2.2);
      vec2 fp = (q - vec2(0., 0.14)) / big;
      if (abs(fp.x) < 0.17 && abs(fp.y) < 0.035) col = mix(col, uGold * 0.7, inside);
      float lean = 0.12 * sin(uTime * 7. + cell * 1.7) + 0.06, tl = (fp.y - 0.04) / 0.42;
      if (tl > 0. && tl < 1. && lit > 0.5) {
        float hwid = 0.286 * sqrt(tl) * (1. - tl) * (0.9 + 0.1 * sin(uTime * 13. + cell)), fl = hwid - abs(fp.x - lean * tl * tl * 0.5);
        if (fl > 0.) { col = fl > 0.45 * hwid ? uGold * 3.2 : uVerm; glow = 1.; line = 0.; }
      }
    }
  } else if (id == 2.) {                            // pierced jali screen
    vec2 q = uv / 0.4, fq = max(fwidth(q), vec2(1e-5)), c = fract(q) - 0.5; float fm = max(fq.x, fq.y), fade = 1. - smoothstep(0.25, 0.6, fm);
    float alt = mod(floor(q.x) + floor(q.y), 2.), hole = mix(length(c) - 0.31, abs(c.x) + abs(c.y) - 0.37, alt);
    float border = step(0.17, min(min(uv.x, vUv.z - uv.x), min(uv.y, vUv.w - uv.y)));
    col = mix(col, uInk, mix(0.4, 1. - smoothstep(-fm, fm, hole), fade) * border); line = max(line, 0.5 * aaLine(hole, fm) * fade * border);
  } else if (id == 3.) {                            // lotus-petal moulding
    float h = vUv.w, s = abs(fract(uv.x / 0.8) - 0.5) * 2., pt = h * (0.95 - 0.75 * s * s), fl = fw.y + fw.x * h * 1.5;
    col = mix(mix(col, uVerm, 0.7), col, smoothstep(-fl, fl, pt - uv.y));
    line = max(line, aaLine(pt - uv.y, fl)); line = max(line, 0.45 * aaLine(pt * 0.55 - uv.y, fl) * step(s, 0.6));
  } else if (id == 4.) {                            // gold leaf: the only thing above 1.0, with a leaf shimmer that follows the eye
    float hsh = hash(floor(vP.xy * 40. + vP.z * 23.)), s = 0.5 + 0.5 * sin(dot(V, vec3(13., 7., 11.)) * 5. + hsh * 6.283 + uTime * 1.3);
    col = mix(uGold, vec3(1.0, 0.9, 0.55), 0.6 * s * s * s) * 1.12; glow = 1.;
    if (!smoothS) {                                 // an umber hairline round gold beams wide enough to carry one
      vec2 gd = min(uv, vUv.zw - uv) / fw; float gs = min(vUv.z / fw.x, vUv.w / fw.y);
      col = mix(col, uUmber, 0.4 * (1. - smoothstep(0.65, 1.45, min(gd.x, gd.y))) * clamp((gs - 6.) / 3., 0., 1.));
    }
  } else if (id == 5.) {                            // kangura parapet
    float h = vUv.w, s = abs(fract(uv.x / 1.25) - 0.5) * 2., top = h * (0.42 + 0.58 * sqrt(max(1. - s * s * 1.2, 0.)));
    if (uv.y > top) discard;
    line = max(line, aaLine(top - uv.y, fw.y + fw.x * 1.5));
  } else if (id == 6.) {                            // striped cloth
    float sx = uv.x / 0.55, st = smoothstep(0.5 - fw.x * 2., 0.5 + fw.x * 2., abs(fract(sx) - 0.5) * 2.);
    col = mix(col, uYellow, st * 0.9); if (vFold > 0.25) col *= uCool;
  } else if (id == 8.) {                            // chequered marble paving
    vec2 q = vP.xz / 2.5; float fq = max(fwidth(q.x), fwidth(q.y)), ch = mod(floor(q.x) + floor(q.y), 2.);
    col *= mix(vec3(1.), vec3(0.86, 0.89, 0.94), mix(0.5, ch, 1. - smoothstep(0.2, 0.6, fq)));
  } else if (id == 9.) {                            // dome: gores and a lotus collar
    float gr = abs(sin(uv.x * 8.)), yb = 0.82 + 0.07 * gr, fy = max(fwidth(uv.y), 1e-5);
    line = max(line, 0.45 * aaLine(gr, max(fwidth(gr), 1e-4)) * step(uv.y, yb));
    col = mix(col, mix(col, uVerm, 0.45), smoothstep(-fy, fy, uv.y - yb)); line = max(line, aaLine(uv.y - yb, fy)); line = max(line, 0.6 * aaLine(uv.y - 0.07, fy));
  } else if (id == 10. || id == 12.) {              // dotted water: fountain arcs, and eave drips once the front has passed
    if (fract(uv.y / 0.9 - uTime * 2.4 + hash(vec2(vUv.w, 2.))) > 0.5) discard;
    if (id == 12. && behindFront(vP.x) < 3.) discard;
    col = uPearl; glow = 1.;
  } else if (id == 11.) {                           // marigold garland beads
    float b = floor(uv.x / 0.28); col = mod(b, 3.) < 1. ? uVerm : col; line = max(line, 0.5 * aaLine(fract(uv.x / 0.28) - 0.5, fw.x / 0.28 * 0.8));
  } else if (id == 14.) {                           // peacock feather: gold-ringed indigo eye, a rachis line
    float d = length((uv - vec2(vUv.z * 0.5, vUv.w * 0.8)) / vec2(vUv.z * 0.42, vUv.w * 0.15));
    if (d < 1.) col = d < 0.5 ? uInk : uGold * 0.9;
    line = max(line, 0.5 * aaLine(uv.x - vUv.z * 0.5, fw.x));
  } else if (id == 15.) {                           // far house: a white cube with a few dark windows and a door
    float rows = clamp(floor(vUv.w / max(vUv.z, 1e-3) * 2.2 + 0.5), 1., 4.), ch = vUv.w / rows, cols = max(1., floor(vUv.z / ch + 0.5));
    vec2 q = vec2(uv.x / vUv.z * cols, uv.y / ch), c = fract(q) - vec2(0.5, 0.45), fq = max(fwidth(q), vec2(1e-5));
    float hh = hash(floor(q) + floor(vP.xz * 0.02)), wd = max(abs(c.x) - 0.16, abs(c.y) - 0.24 + 0.1 * step(0.6, hh));
    if (abs(N.y) < 0.5 && hh > 0.22) { col = mix(col, hh > 0.9 ? uVerm : uInk, 1. - smoothstep(-fq.y, fq.y, wd)); }
    line = max(line, 0.35 * aaLine(fract(q.y) - 0.02, fq.y) * step(abs(N.y), 0.5));
  } else if (id == 17.) {                           // painted ground and hills: rows of darker tufts
    vec2 q = uv / vUv.z; q.x += 0.5 * mod(floor(q.y), 2.); vec2 c = fract(q) - 0.5; float fq = max(max(fwidth(q.x), fwidth(q.y)), 1e-4);
    float tuft = (1. - smoothstep(0.2, 0.2 + fq * 1.5, length(c * vec2(1., 1.7)))) * (1. - smoothstep(0.3, 0.8, fq));
    col *= mix(1., 0.78, tuft * step(0.25, hash(floor(q))));
  } else if (id == 18.) {                           // lotus pad: a notched disc, pale underneath
    vec2 c = uv / max(vUv.zw, vec2(1e-4)) - 0.5; float r = length(c), fr = max(fwidth(r), 1e-4);
    if (r > 0.5 || (c.x > 0.03 && abs(c.y) < c.x * 0.22)) discard;
    if (!gl_FrontFacing) col = mix(col, uPearl, 0.62);
    line = max(line, aaLine(r - 0.48, fr)); line = max(line, 0.35 * aaLine(abs(c.y) - abs(c.x) * 0.9, fr) * step(r, 0.4));
  } else if (id == 19.) {                           // lotus flower: a fan of pink petals
    vec2 c = vec2(uv.x / max(vUv.z, 1e-4) - 0.5, uv.y / max(vUv.w, 1e-4)); float r = length(c), a = atan(c.x, c.y + 1e-4), fr = max(fwidth(r), 1e-4);
    float edge = 0.5 + 0.45 * abs(cos(a * 2.6)); if (r > edge) discard;
    col = mix(mix(uVerm, uPearl, 0.5), uPearl, smoothstep(0.35, 0.95, r)); line = max(line, 0.8 * aaLine(r - edge + fr, fr));
  } else if (id == 20.) {                           // canopy valance: scalloped lower edge with a gold band
    float s = abs(fract(uv.x / 0.8) - 0.5) * 2., low = 0.42 * (1. - sqrt(max(1. - s * s, 0.)));
    if (uv.y < low) discard;
    if (uv.y < low + 0.09) { col = uGold * 1.12; glow = 1.; } else line = max(line, aaLine(uv.y - low - 0.13, fw.y));
  } else if (id == 13.) {                           // painted foliage: darker leaf rosettes
    vec2 q = vec2(uv.x * 2.9, uv.y * 7.); q.x += 0.5 * mod(floor(q.y), 2.); vec2 c = fract(q) - 0.5; float fq = max(fwidth(uv.y) * 7., 1e-4);
    col *= mix(1., 0.66, (1. - smoothstep(0.26, 0.26 + fq, length(c))) * (1. - smoothstep(0.25, 0.7, fq)));
  }
  if (id != 6. && vFold > 0.25) col *= uCool;       // drawn folds in cloth
  if (smoothS) {
    float ndv = abs(dot(N, V)), fn = max(fwidth(ndv), 1e-4);
    line = max(line, (1. - smoothstep(0.9, 1.9, ndv / fn)) * (1. - smoothstep(0.25, 0.6, fn)));
  } else if (edges) {
    vec2 d2 = min(uv, vUv.zw - uv) / fw; float sz = min(vUv.z / fw.x, vUv.w / fw.y);
    line = max(line, (1. - smoothstep(0.65, 1.45, min(d2.x, d2.y))) * clamp((sz - 2.) / 3., 0., 1.));
  }
  if (glow < 0.5) {
    col = mix(col * uCool, col, step(0., dot(N, uKey)));                   // one hard cool step, no gradient
    col *= 0.975 + 0.04 * hash(floor(gl_FragCoord.xy * 0.5));               // paper tooth
    col = mix(col, uUmber, line * 0.9) * uWash;
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------- weather shaders: lake apron, rain sheets, rain strokes, lightning, sky page ----------
const LAKE_VERT = /* glsl */`varying vec3 vP;
#include <fog_pars_vertex>
void main() { vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LAKE_FRAG = /* glsl */`
uniform vec3 uSlate, uLake, uLakeHi, uIndigo, uPearl, uCamL, uWash, uVerm, uYellow, uInk, uRBc[22], uRBh[22], uRBk[22];
uniform vec3 uFwd; uniform float uTime, uFrontX, uWindX, uSide, uPx, uRefl, uReflWet;
varying vec3 vP;
#include <fog_pars_fragment>
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
// THE PAINTED MIRROR: what a ray leaving the water at o along d (d.y > 0) meets, as one flat colour: the island palace and the boxes the
// world hands over (gate, kiosks, garden island, pavilion, court walls, the portal). w says how thickly it is dabbed (0: nothing there, the
// water keeps its own colour); the foot of a thing is mirrored thickly and its top thinly, so a reflection thins out toward the eye.
vec3 mirror(vec3 o, vec3 d, out float w) {
  vec3 ds = d + (1. - step(1e-5, abs(d))) * 1e-5, c = uLake; w = 0.;
  float tb = 1e9, pw = 0.; vec3 kb = vec3(0.);
  for (int i = 0; i < 22; i++) {
    vec3 t1 = (uRBc[i] - uRBh[i] - o) / ds, t2 = (uRBc[i] + uRBh[i] - o) / ds, lo = min(t1, t2), hi = max(t1, t2);
    float tn = max(max(lo.x, lo.y), lo.z), tx = min(min(hi.x, hi.y), hi.z);
    if (uRBh[i].x > 0. && tx > max(tn, 0.) && tn < tb) { tb = max(tn, 0.); kb = uRBk[i]; pw = 0.92 * (1. - 0.45 * clamp((o.y + d.y * tb) / max(2. * uRBh[i].y, 0.1), 0., 1.)); }
  }
  vec3 t1 = (vec3(-80., 0., -80.) - o) / ds, t2 = (vec3(80., 27.5, 80.) - o) / ds, lo = min(t1, t2), hi = max(t1, t2);
  float tn = max(max(lo.x, lo.y), lo.z), tx = min(min(hi.x, hi.y), hi.z);
  if (tx > max(tn, 0.) && tn < tb) {      // the island palace: marble, its niche rows as ink dabs, blinds and awnings as vermilion and saffron flecks
    vec3 hp = o + d * max(tn, 0.), dr = hp.y - vec3(4.3, 13.6, 22.6); float wu = (abs(abs(hp.x) - 80.) < 0.5 ? hp.z : hp.x) / 2.6667, hh = hash(vec2(floor(wu), floor(hp.y / 3.)));
    bool row = (dr.x > 0.2 && dr.x < 1.7) || (dr.y > 0.2 && dr.y < 1.7) || (dr.z > 0.2 && dr.z < 1.7);
    tb = max(tn, 0.); kb = row && abs(fract(wu) - 0.5) < 0.25 ? uInk : hh > 0.84 && hp.y > 6. && hp.y < 21. ? (hh > 0.92 ? uVerm : uYellow) : uPearl; pw = 0.94 * (1. - 0.55 * clamp(hp.y / 27.5, 0., 1.));
  }
  if (tb < 1e8) { c = kb; w = pw; }
  return c;
}
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float weave(vec2 q, vec2 fq) {
  vec2 f = fract(q); float fl = fq.y * 3.; if (mod(floor(q.x) + floor(q.y), 2.) > 0.5) { f = f.yx; fl = fq.x * 3.; }
  return (1. - smoothstep(0.35 * fl, 0.95 * fl, abs(fract(f.y * 3.) - 0.5))) * step(0.1, f.x) * step(f.x, 0.9) * (1. - smoothstep(0.22, 0.45, fl));
}
void main() {
  vec2 p = vP.xz; float behind = (uFrontX - p.x) * uSide, wet = step(0., behind), wind = smoothstep(-16., 16., (uWindX - p.x) * uSide);
  float kd = 1. + length(vP - uCamL) / 170.;                                   // far features drawn larger so they survive
  float band = wet * step(behind, (52. + 7. * abs(sin(p.y * 0.21))) * min(kd, 4.));
  // the water itself: a flat jade-teal with broad drifting pools of a deeper tone (two flat tones, one hard edge)
  float pn = vnoise(p / vec2(34., 21.) + vec2(uTime * 0.013, 0.)) + 0.5 * vnoise(p / vec2(13., 8.) - vec2(0., uTime * 0.02)), pf = max(fwidth(pn), 1e-4);
  vec3 col = mix(uLake, uLakeHi, smoothstep(-pf, pf, pn - 0.9));
  col = mix(col, uLake * 0.6 + uIndigo * 0.25, band);
  // basket-weave ripple lines: blocks of three strokes, alternately along and across; tighter and faster behind the wind line
  vec2 q = p / mix(5.2, 2.9, step(0.5, wind)) + vec2(uTime * 0.11, uTime * 0.05) * (1. + 2.5 * wind);
  vec2 fq2 = fwidth(q), jx = dFdx(q), jy = dFdy(q); float fq = 2. * sqrt(abs(jx.x * jy.y - jx.y * jy.x) + 1e-12), lod = max(log2(fq * 30.), -1.), l0 = exp2(floor(lod));   // re-ruled by footprint; lines too close to rule fade
  float wl = mix(weave(q / l0, fq2 / l0), weave(q / (l0 * 2.), fq2 / (l0 * 2.)), fract(lod));
  // the painted mirror: level rows of lens-shaped strokes (the rows are ruled across the line of travel and grow toward the eye), each row
  // slipped sideways by the ripples. A stroke is ONE flat colour, taken where the mirrored ray from its middle lands, so it tapers at both
  // ends and is never cut; strokes lie only under the things they mirror. Calm water carries them thickly, the wind line chops them and the
  // rain thins them. Far off, where a row is thinner than two pixels, the mirror is one thin wash.
  vec3 vd = vP - uCamL; float hl = length(vd.xz) + 1e-4, el = atan(-vd.y, hl);
  if (el > 0.002 && vP.y < 0.3 && uRefl > 0.) {
    // a row is never thinner than about three pixels where the palace stands, whatever the size of the picture
    float hgt = max(-vd.y, 1e-3), k = clamp(0.6 * sqrt(max(uPx, 1e-6)), 0.018, 0.03), kk = 2. * k * k, g = sqrt(atan(hgt, max(dot(vd.xz, uFwd.xz), 0.05))) / k, ri = floor(g), fr = fract(g), ppr = kk * max(g, 0.5) / max(uPx, 1e-6), hr = hash(vec2(ri, 3.7));
    float az = atan(vd.z, vd.x + (abs(vd.x) + abs(vd.z) < 1e-5 ? 1e-5 : 0.)), wa = kk * (ri + 0.5) * 9.;
    float slip = hr * 37. + 0.3 * sin(uTime * (0.5 + hr) + hr * 40.) * (1. + wind), qx = az / wa + slip, cj = floor(qx), fx = fract(qx);
    float h2 = hash(vec2(cj, ri)), h3 = hash(vec2(cj + 17., ri + 5.)), lens = 0.;
    float azc = (cj + 0.5 - slip) * wa, thc = min(k * (ri + 0.5) * k * (ri + 0.5), 1.5), wgt = 0.;
    vec2 dc = vec2(cos(azc), sin(azc)); float hlc = hgt / max(tan(thc), 1e-4) / max(dot(dc, uFwd.xz), 0.05);
    vec3 rc = mirror(vec3(uCamL.x + dc.x * hlc, 0., uCamL.z + dc.y * hlc), normalize(vec3(dc.x * hlc, hgt, dc.y * hlc)), wgt);
    // a stroke is a thin lens, shorter the higher up its thing the mirrored ray lands (a reflection tapers toward the eye)
    float ln = 0.5 + 0.55 * wgt; lens = 1. - (2. * fx - 1.) * (2. * fx - 1.) / (ln * ln);
    float dd = (0.17 + 0.09 * h2) * sqrt(max(lens, 0.)) - abs(fr - 0.5), dab = smoothstep(-0.5 / ppr, 0.5 / ppr, dd) * step(0., lens);
    float cover = wgt * (1. - 0.3 * wind) * (1. - uReflWet * wet) * (1. - 0.75 * smoothstep(0.1, 0.4, el)) * uRefl, m = mix(cover * 0.45, dab * step(h3, cover), smoothstep(1.4, 2.6, ppr));
    col = mix(col, mix(rc, uLake, 0.46), m * 0.92);
  }
  col = mix(col, mix(uLake, uPearl, 0.34), wl * 0.62);
  // rings where the drops land: every cell under the band, some of them behind it
  vec2 rq = p / 3.4; float fr = fwidth(rq.x) + fwidth(rq.y); vec2 rc = floor(rq), rf = fract(rq) - 0.5; float h = hash(rc), ph = fract(uTime * 0.9 + h * 7.);
  rf -= (vec2(hash(rc + 1.3), hash(rc + 2.7)) - 0.5) * 0.36;
  float ring = (1. - smoothstep(0.5 * fr, 1.1 * fr, abs(length(rf) - (0.07 + 0.3 * ph)))) * step(ph, 0.8) * step(0.45 - band, h) * wet, rfade = 1. - smoothstep(0.12, 0.3, fr);
  col = mix(col, uPearl, ring * rfade + (1. - rfade) * wet * 0.1);
  // scalloped spray line at the foot of the front, and a row of thrown drops ahead of it
  float a = -behind / kd, sc = abs(sin(p.y * 3.14159 / (7. * kd)));
  float spray = step(-1.5, a) * step(a, 0.5 + 3.2 * sc);
  vec2 dq = vec2(a - 5.2, mod(p.y / kd, 3.5) - 1.75); spray = max(spray, step(length(dq), 0.5));
  col = mix(col, uPearl, spray);
  col *= (0.975 + 0.04 * hash(floor(gl_FragCoord.xy * 0.5))) * uWash;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// Rain sheets: aS = (type, value). type 0: a card across the front, `value` metres behind it; type 1: a card along X at z = value, ending at the front;
// type 2: the same with half-size cells (the card that runs 3.4 m from the eye). The cards are uTop tall: the world hangs them from the scroll's edge.
const SHEET_VERT = /* glsl */`
attribute vec2 aS; uniform vec3 uCamL; uniform float uFrontX, uSide, uLift, uTop; varying vec3 vP; varying vec2 vH; varying float vWall, vCs;
#include <fog_pars_vertex>
void main() {
  vec3 p; float y = position.y * uTop;
  if (aS.x < 0.5) { p = vec3(uFrontX - aS.y * uSide, y + uLift, (position.x * 2. - 1.) * 1100.); vH = vec2(p.z, y); }
  else { p = vec3(uFrontX - position.x * 1700. * uSide, y, aS.y); vH = vec2(p.x * uSide, y); }
  vWall = aS.x < 0.5 && aS.y < 1. ? 1. : 0.; vCs = aS.x > 1.5 ? 0.5 : mix(1., 0.72, vWall);
  // far off the front is ONE ruled wall: the cards behind it and the cards along the line only stand once it is within 600 m
  if (vWall < 0.5 && (uCamL.x - uFrontX) * uSide > 600.) p = vec3(uCamL.x, -900., uCamL.z);
  vP = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHEET_FRAG = /* glsl */`
uniform vec3 uPearl, uSlate, uCamL; uniform float uTime, uTop; varying vec3 vP; varying vec2 vH; varying float vWall, vCs;
#include <fog_pars_fragment>
void main() {
  // ruled rows of slanted strokes, re-ruled by distance: each doubling keeps every other row and column and lets the rest shrink away
  vec2 hv = vec2(vH.x + vH.y * 0.364, vH.y + uTime * 9.); float px = max(fwidth(hv.x), fwidth(hv.y)) + 1e-5;
  // a card seen edge-on would pile its strokes into shards: it is not drawn there at all
  float an = fwidth(hv.x) / max(fwidth(hv.y), 1e-5); if (an > 2.5 || an < 0.4) discard;
  float lod = max(log2(px * 30. / 3.), 0.), l0 = floor(lod), f = lod - l0;      // a cell never narrower than about 30 pixels
  vec2 cs = vec2(3.0, 2.6) * exp2(l0) * vCs, g = hv / cs, i = floor(g), fr = fract(g) - 0.5;
  float keep = step(mod(i.x, 2.), 0.5) * step(mod(i.y, 2.), 0.5), size = mix(1. - f, 1. + f, keep);
  float hw = max(0.8 * px, 0.011) * min(size * 3., 1.), ax = abs(fr.x) * cs.x, ay = abs(fr.y) * cs.y;
  float len = step(ay, 0.2 * cs.y * size) * step(0.02, size) * (1. - smoothstep(0.82 * uTop, uTop, vH.y));
  float a = (1. - smoothstep(hw - 0.5 * px, hw + 0.5 * px, ax)) * len, rim = (1. - smoothstep(1.8 * hw - 0.5 * px, 1.8 * hw + 0.5 * px, ax)) * len;
  if (rim < 0.35) discard;
  gl_FragColor = vec4(a < 0.35 ? mix(uSlate, uPearl, 0.3) : uPearl, 1.);
  #include <fog_fragment>
}`;

// Camera-following ruled strokes (instanced ribbons on a lattice that wraps round the eye), only on the wet side of the front.
const STROKE_VERT = /* glsl */`
attribute vec3 aCell; uniform vec3 uCamL; uniform float uTime, uFrontX, uPx, uSide, uRainAmt; varying float vX;
#include <fog_pars_vertex>
void main() {
  vec3 box = vec3(54., 36., 54.), base = aCell * vec3(4.5, 4., 4.5);
  base.y -= uTime * 9.; base.x += uTime * 9. * 0.364 * uSide;
  vec3 rel = mod(base - uCamL + box * 0.5, box) - box * 0.5, p = uCamL + rel;
  vec3 axis = vec3(0.342 * uSide, -0.94, 0.), side = normalize(cross(axis, rel) + vec3(1e-5, 0., 0.));
  float dist = length(rel), fade = smoothstep(27., 19., max(abs(rel.x), abs(rel.z))) * smoothstep(18., 13., abs(rel.y));
  float on = step(0., (uFrontX - p.x) * uSide) * step(1.3, p.y) * step(2.5, dist) * step(fract(sin(dot(aCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453), uRainAmt);
  p += axis * (position.y * 1.05 * clamp(dist / 9., 0.3, 1.) * fade * on) + side      // shorter close to the eye: no stroke is drawn much over 60 pixels long
    * (position.x * max(0.016, dist * uPx * 1.3) * on); vX = position.x;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STROKE_FRAG = /* glsl */`uniform vec3 uPearl, uSlate; varying float vX;
#include <fog_pars_fragment>
void main() { gl_FragColor = vec4(abs(vX) > 0.5 ? mix(uSlate, uPearl, 0.3) : uPearl, 1.);   // a slate rim, so a stroke also reads on white marble
  #include <fog_fragment>
}`;

// Gold lightning: a camera-facing ribbon drawn by uDraw, with a glint travelling along it; it lights nothing.
const BOLT_VERT = /* glsl */`
attribute vec3 aDir; attribute vec2 aT; uniform vec3 uCamL; uniform float uPx, uFade, uWide; varying float vT, vS;
void main() {
  vec3 rel = position - uCamL, side = normalize(cross(aDir, rel) + vec3(0., 1e-5, 0.));
  vec3 p = position + side * (aT.y * max(2.6, length(rel) * uPx * 3.2) * uFade * uWide);
  vT = aT.x; vS = sign(aT.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
// uHalo 0: the leaf itself (kept leaf gold: under flat post anything brighter clips to lemon); uHalo 1: the same ribbon twice as wide in
// dark indigo, drawn first: the ink line under the leaf, so the snake reads on the ground colour, on the indigo and on the pearl rain-sky alike
const BOLT_FRAG = /* glsl */`uniform vec3 uGold, uDark; uniform float uDraw, uGlint, uHalo; varying float vT, vS;
void main() { if (vT > uDraw) discard; float g = (vT - uGlint) * 16., e = exp(-g * g);
  gl_FragColor = vec4(mix(uGold * (1.15 + 0.6 * e), uDark, uHalo), 1.); }`;

// Sky page: a flat ground colour, and behind one straight leading edge an indigo carpet band and the flat pearl rain-sky (400 m up, leading the front).
const SKY_VERT = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uGround, uCloud, uEdge, uGold, uCamL, uLake, uWash, uRainSky; uniform float uCloudX, uTime, uSide, uStars, uPx; varying vec3 vD;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 d = normalize(vD + vec3(0., 1e-6, 0.)); float dy = max(d.y, 0.012), t = (400. - uCamL.y) / dy;
  // over the far ramp the rain-sky follows the slope of the page, 400 m above it
  float den = dy + 0.2493 * uSide * d.x;
  if (-uSide * (uCamL.x + d.x * t) > 340.) t = den > 0.004 ? (400. + 0.2493 * (-uSide * uCamL.x - 340.) - uCamL.y) / den : 1e5;
  vec2 c = uCamL.xz + d.xz * t; float e = (uCloudX - c.x) * uSide / 230., fe = fwidth(e) + 1e-5;
  // behind the one straight leading edge: a slate-indigo carpet (the indigo herd walks on it and still reads against it), one paler flat
  // tone, then the flat pearl rain-sky.
  // The bands are measured on the picture (e over its own change per pixel, times a pixel's angle), so the carpet is a band about a
  // degree and a half thick wherever the edge stands: far up the page under the herd's feet, or straight overhead
  float ang = max(e, 0.) / fe * uPx, aa = 1.5 * uPx;
  vec3 col = uGround;
  // gold dot stars on a night ground
  vec2 sq = vec2(atan(d.z, d.x + 1e-5) * 9., d.y * 16.), sf = fract(sq) - 0.5; float sh = hash(floor(sq));
  col = mix(col, uGold * 1.6, uStars * step(0.72, sh) * step(length(sf + (vec2(hash(floor(sq) + 2.), hash(floor(sq) + 5.)) - 0.5) * 0.5), 0.05 + 0.03 * sin(uTime * (1. + sh) + sh * 40.)));
  vec3 cl = mix(mix(uCloud, uRainSky, 0.42), mix(uCloud, uRainSky, 0.74), smoothstep(0.026, 0.026 + aa, ang)); cl = mix(cl, uRainSky, smoothstep(0.046, 0.046 + aa, ang));
  if (t > 9e4) cl = uRainSky;
  col = mix(col, cl, smoothstep(-fe, fe, e));
  col = mix(col, uEdge, 1. - smoothstep(0.7 * fe, 1.6 * fe, abs(e)));
  if (d.y < 0.) col = uLake * uWash;      // below the horizon there is only lake: whatever the page does not cover reads as water
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- building blocks ----------
const DOME_PROF = [[0.86, 0], [0.98, 0.14], [1.0, 0.32], [0.93, 0.52], [0.76, 0.72], [0.52, 0.9], [0.28, 1.03], [0.1, 1.12], [0.0, 1.16]];
const scaleProf = (p, s) => p.map(([r, y]) => [r * s, y * s]);

// thin square beam between two points (poles, chains, posts)
function beam(acc, a, b, r, col, mat = M_PLAIN) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), u = new THREE.Vector3(1, 0, 0);
  if (Math.abs(d.x) > 0.9) u.set(0, 0, 1);
  const s = new THREE.Vector3().crossVectors(d, u).normalize().multiplyScalar(r), t = new THREE.Vector3().crossVectors(d, s).normalize().multiplyScalar(r);
  const o = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => [s.x * i + t.x * j, s.y * i + t.y * j, s.z * i + t.z * j]);
  for (let i = 0; i < 4; i++) { const p = o[i], q = o[(i + 1) % 4]; acc.quad([a[0] + p[0], a[1] + p[1], a[2] + p[2]], [a[0] + q[0], a[1] + q[1], a[2] + q[2]], [b[0] + q[0], b[1] + q[1], b[2] + q[2]], [b[0] + p[0], b[1] + p[1], b[2] + p[2]], col, mat + 0.5); }
}

function finial(acc, col, s) { acc.lathe(scaleProf([[0.02, 0], [0.3, 0.04], [0.36, 0.22], [0.22, 0.4], [0.07, 0.48], [0.07, 0.66], [0.17, 0.78], [0.06, 0.9], [0.015, 1.2]], s), 6, col.gold, M_GOLD); }

// chhatri: slab, columns with capitals, cusped arches, sloping eave, ribbed dome, gold finial. About 5.1 s tall.
function chhatri(acc, col, s, sides = 4, arches = true) {
  const R = 1.25 * s, mb = col.marble;
  acc.ngon(sides, R * 1.3, R * 1.24, 0, 0.3 * s, mb);
  for (let i = 0; i < sides; i++) {
    const a = Math.PI / sides + (i / sides) * Math.PI * 2;
    acc.push(Math.sin(a) * R, 0.3 * s, Math.cos(a) * R); acc.ngon(6, 0.12 * s, 0.1 * s, 0, 1.75 * s, mb, M_PLAIN, { cap: false }); acc.box(0, 1.75 * s, 0, 0.36 * s, 0.15 * s, 0.36 * s, mb); acc.pop();
    if (arches) { const am = a + Math.PI / sides, dd = R * Math.cos(Math.PI / sides); acc.push(Math.sin(am) * dd, 0.3 * s, Math.cos(am) * dd, am); acc.archPlate(2 * R * Math.sin(Math.PI / sides) - 0.2 * s, 1.3 * s, 0.42 * s, 1.92 * s, mb, { segs: sides > 4 ? 8 : 10 }); acc.pop(); }
  }
  acc.ngon(sides, R * 1.12, R * 1.12, 2.2 * s, 2.42 * s, mb);
  acc.ngon(sides, R * 1.85, R * 1.2, 2.34 * s, 2.62 * s, col.marbleB, M_PLAIN, { capCol: mb });
  acc.push(0, 2.62 * s, 0, 0, R * 0.98); acc.lathe(DOME_PROF, 10, mb, M_DOME); acc.pop();
  acc.push(0, 2.62 * s + 1.14 * R * 0.98, 0); finial(acc, col, 0.9 * s); acc.pop();
}

// jharokha: stepped brackets, slab, jali balustrade, slim columns, cusped arches, dark room, vermilion blind, eave, dome or bangla roof
function jharokha(acc, col, w, d, rng) {
  const hw = w / 2, H = 2.7, mb = col.marble;
  // three carved brackets: a cyma (S) profile from the wall to the slab edge, hairlined along the curve, a gold lotus bud hanging at the tip
  const BD = d - 0.3, bn = 7, cy = (t) => -1.4 * (1 - t) - 0.2 * Math.sin(6.2832 * t) * (1 - 0.3 * t), BIG = 1e4;
  for (const bx of [-hw + 0.3, 0, hw - 0.3]) {
    for (let i = 0; i < bn; i++) {
      const t0 = i / bn, t1 = (i + 1) / bn, z0 = BD * t0, z1 = BD * t1, y0 = cy(t0), y1 = cy(t1);
      acc.quad([bx - 0.18, y0, z0], [bx + 0.18, y0, z0], [bx + 0.18, y1, z1], [bx - 0.18, y1, z1], col.marbleB, M_PLAIN + 0.5);
      for (const sx of [-1, 1]) {
        const x = bx + sx * 0.18, i0 = acc.vert(x, y0, z0, sx, 0, 0, mb, 500 + z0, 0, BIG, BIG, M_PLAIN), i1 = acc.vert(x, y1, z1, sx, 0, 0, mb, 500 + z1, 0, BIG, BIG, M_PLAIN);
        const i2 = acc.vert(x, 0, z1, sx, 0, 0, mb, 500 + z1, -y1, BIG, BIG, M_PLAIN), i3 = acc.vert(x, 0, z0, sx, 0, 0, mb, 500 + z0, -y0, BIG, BIG, M_PLAIN);
        if (sx > 0) { acc.tri(i0, i2, i1); acc.tri(i0, i3, i2); } else { acc.tri(i0, i1, i2); acc.tri(i0, i2, i3); }
      }
    }
    acc.push(bx, -0.42, BD - 0.05); acc.lathe([[0.0, 0], [0.1, 0.1], [0.12, 0.24], [0.0, 0.42]], 5, col.gold, M_GOLD); acc.pop();
  }
  acc.quad([-hw - 0.15, -0.32, d - 0.22], [hw + 0.15, -0.32, d - 0.22], [hw + 0.15, 0, d + 0.075], [-hw - 0.15, 0, d + 0.075], mb, M_LOTUS + 0.5);
  acc.box(0, 0, d / 2, w + 0.3, 0.22, d + 0.15, mb);
  acc.quad([-hw, 0.22, d], [hw, 0.22, d], [hw, 1.1, d], [-hw, 1.1, d], mb, M_JALI);
  acc.quad([hw, 0.22, d], [hw, 0.22, 0], [hw, 1.1, 0], [hw, 1.1, d], mb, M_JALI);
  acc.quad([-hw, 0.22, 0], [-hw, 0.22, d], [-hw, 1.1, d], [-hw, 1.1, 0], mb, M_JALI);
  for (const [cx, cz] of [[-hw + 0.12, d - 0.12], [hw - 0.12, d - 0.12], [-hw + 0.12, 0.15], [hw - 0.12, 0.15]]) { acc.push(cx, 0.22, cz); acc.ngon(6, 0.11, 0.09, 0, H - 0.22, mb, M_PLAIN, { cap: false }); acc.pop(); }
  acc.push(0, 0.22, d - 0.12); acc.archPlate(w - 0.24, 1.7, 0.62, H + 0.03, mb, { segs: 12 }); acc.pop();
  acc.push(hw - 0.12, 0.22, d / 2, Math.PI / 2); acc.archPlate(d - 0.3, 1.85, 0.45, H + 0.03, mb, { segs: 8 }); acc.pop();
  acc.push(-hw + 0.12, 0.22, d / 2, -Math.PI / 2); acc.archPlate(d - 0.3, 1.85, 0.45, H + 0.03, mb, { segs: 8 }); acc.pop();
  acc.quad([-hw + 0.4, 0.22, 0.04], [hw - 0.4, 0.22, 0.04], [hw - 0.4, H - 0.1, 0.04], [-hw + 0.4, H - 0.1, 0.04], col.ink);
  const bl = rng.range(0.5, 1.5); acc.quad([-hw + 0.25, H - bl, d - 0.3], [hw - 0.25, H - bl, d - 0.3], [hw - 0.25, H + 0.2, d - 0.3], [-hw + 0.25, H + 0.2, d - 0.3], col.verm, M_STRIPE);
  const y = H + 0.25;
  acc.box(0, y, d / 2 - 0.1, w + 1.5, 0.28, d + 1.0, col.marbleB, M_PLAIN, { tx: (w + 0.3) / (w + 1.5), tz: (d + 0.2) / (d + 1.0), cap: mb });
  if (rng.chance(0.62)) {
    const r = Math.min(w * 0.5, d * 0.62) * 0.9;
    acc.push(0, y + 0.28, d / 2 - 0.1, 0, r); acc.lathe(DOME_PROF, 10, mb, M_DOME, { squash: Math.min(1, (d * 0.56) / r) }); acc.pop();
    acc.push(0, y + 0.28 + 1.14 * r, d / 2 - 0.1); finial(acc, col, 0.62); acc.pop();
  } else {                  // bangla roof: a ridge with drooping ends
    const zf = d + 0.1, zb = -0.0, zc = d / 2, n = 6, ridge = (x) => y + 1.25 - 0.55 * (x / hw) * (x / hw), eave = (x) => y + 0.28 + 0.25 - 0.3 * (x / hw) * (x / hw), xe = hw + 0.15;
    for (let i = 0; i < n; i++) {
      const x0 = -xe + (i / n) * 2 * xe, x1 = -xe + ((i + 1) / n) * 2 * xe;
      acc.quad([x0, eave(x0), zf], [x1, eave(x1), zf], [x1, ridge(x1), zc], [x0, ridge(x0), zc], mb, M_PLAIN + 0.5);
      acc.quad([x1, eave(x1), zb], [x0, eave(x0), zb], [x0, ridge(x0), zc], [x1, ridge(x1), zc], mb, M_PLAIN + 0.5);
    }
    acc.quad([xe, eave(xe), zf], [xe, eave(xe), zb], [xe, ridge(xe), zc], [xe, ridge(xe), zc], col.marbleB); acc.quad([-xe, eave(xe), zb], [-xe, eave(xe), zf], [-xe, ridge(xe), zc], [-xe, ridge(xe), zc], col.marbleB);
    for (const fx of [-hw * 0.45, hw * 0.45]) { acc.push(fx, ridge(fx) - 0.05, zc); finial(acc, col, 0.5); acc.pop(); }
  }
}

// painted tree: thin umber trunk, a round or flame-shaped malachite mass with darker leaf rosettes
function tree(acc, col, s, flame) {
  acc.ngon(5, 0.16 * s, 0.11 * s, 0, 1.3 * s, col.umber, M_PLAIN, { cap: false });
  const prof = flame ? [[0.02, 0], [0.55, 0.3], [0.8, 0.8], [0.7, 1.4], [0.42, 2.0], [0.16, 2.5], [0.0, 2.8]] : [[0.02, 0], [0.7, 0.2], [1.0, 0.6], [1.0, 1.05], [0.72, 1.5], [0.3, 1.78], [0.0, 1.85]];
  acc.push(0, 1.1 * s, 0, 0, s); acc.lathe(prof, 9, col.mala, M_LEAF); acc.pop();
}

// peacock facing +Z: egg body, neck, head, gold crest (static), and a 13-feather train on the cloth mesh (kind 6)
// kind: the train's cloth kind (6: fans as the eye comes level; 16: fans when the rain reaches the bird's own place)
function peacock(acc, cl, col, p, s, ph, kind = 6) {
  const body = mixc(col.indigo, col.mala, 0.45);
  acc.push(p[0], p[1], p[2], 0, s);
  acc.lathe([[0.02, 0], [0.2, 0.08], [0.27, 0.3], [0.22, 0.55], [0.1, 0.72], [0.06, 0.8]], 7, body, M_PLAIN, { squash: 1.25 });
  acc.push(0, 0.72, 0.1); acc.ngon(5, 0.075, 0.05, 0, 0.52, col.mala, M_PLAIN, { cap: false }); acc.pop();
  acc.push(0, 1.2, 0.12); acc.lathe([[0.01, 0], [0.08, 0.05], [0.09, 0.12], [0.05, 0.2], [0.0, 0.22]], 6, col.mala, M_PLAIN, { squash: 1.3 }); acc.pop();
  beam(acc, [0, 1.3, 0.2], [0, 1.27, 0.36], 0.02, col.saffron);
  for (const cx of [-0.07, 0, 0.07]) beam(acc, [0, 1.4, 0.1], [cx, 1.64, 0.06], 0.014, col.gold, M_GOLD);
  acc.pop();
  cl.push(p[0], p[1], p[2], 0, s); cl.anim(kind, 0, 0.3, -0.14, ph);
  const n = 13, L = 1.55;
  for (let i = 0; i < n; i++) {
    const a = (-84 + (168 * i) / (n - 1)) * Math.PI / 180, dx = Math.sin(a), dy = Math.cos(a), px = dy, py = -dx, z = -0.2 - (i % 2) * 0.012, len = L * (0.9 + 0.1 * Math.cos(a * 2.2)), wb = 0.05, wt = 0.17;
    cl.quad([-px * wb, 0.3 - py * wb, z], [px * wb, 0.3 + py * wb, z], [dx * len + px * wt, 0.3 + dy * len + py * wt, z], [dx * len - px * wt, 0.3 + dy * len - py * wt, z], col.mala, M_FEATHER);
  }
  cl.pop();
}

function pot(acc, col, s) { acc.lathe(scaleProf([[0.12, 0], [0.3, 0.12], [0.34, 0.3], [0.22, 0.46], [0.14, 0.52], [0.2, 0.6]], s), 7, col.brass); }

// fountain: octagonal basin, stem, a tall centre jet and a ring of dotted arcs
function fountain(acc, col, s, jets) {
  acc.ngon(8, 2.6 * s, 2.45 * s, 0, 0.6 * s, col.marble, M_PLAIN, { capCol: col.slate });
  acc.ngon(6, 0.3 * s, 0.18 * s, 0.6 * s, 1.5 * s, col.marble); acc.ngon(8, 0.8 * s, 0.9 * s, 1.5 * s, 1.7 * s, col.marbleB, M_PLAIN, { capCol: col.slate });
  acc.quad([-0.09, 1.7 * s, 0], [0.09, 1.7 * s, 0], [0.09, 5.6 * s, 0], [-0.09, 5.6 * s, 0], col.pearl, M_DASH + 0.5);
  acc.quad([0, 1.7 * s, -0.09], [0, 1.7 * s, 0.09], [0, 5.6 * s, 0.09], [0, 5.6 * s, -0.09], col.pearl, M_DASH + 0.5);
  for (let j = 0; j < jets; j++) {
    const a = (j / jets) * Math.PI * 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a), n = 7, pt = (t) => { const r = 0.3 + 2.0 * s * t, y = 1.7 * s + 2.6 * s * 4 * t * (1 - t) - 1.1 * s * t; return [ca * r, y, sa * r]; };
    for (let i = 0; i < n; i++) { const p = pt(i / n), q = pt((i + 1) / n); acc.quad([p[0], p[1] - 0.12, p[2]], [q[0], q[1] - 0.12, q[2]], [q[0], q[1] + 0.12, q[2]], [p[0], p[1] + 0.12, p[2]], col.pearl, M_DASH + 0.5); }
  }
}

// swallow-tailed pennant laid along +X from its pole; the shader swings it round the pole with the wind
function pennant(cl, piv, L, h, col, ph) {
  cl.anim(1, piv[0], piv[1], piv[2], ph); const n = 6, hh = (t) => (h * (1 - 0.3 * t)) / 2, o = { wt: [0, 0, 0, 0] };
  for (let i = 0; i < n - 1; i++) { const l0 = (i / n) * L, l1 = ((i + 1) / n) * L, h0 = hh(i / n), h1 = hh((i + 1) / n); cl.quad([piv[0] + l0, piv[1] - h0, piv[2]], [piv[0] + l1, piv[1] - h1, piv[2]], [piv[0] + l1, piv[1] + h1, piv[2]], [piv[0] + l0, piv[1] + h0, piv[2]], col, M_PLAIN + 0.5, o); }
  const l5 = ((n - 1) / n) * L, h5 = hh((n - 1) / n);
  cl.quad([piv[0] + l5, piv[1], piv[2]], [piv[0] + L, piv[1] + h5 * 0.75, piv[2]], [piv[0] + L, piv[1] + h5 * 0.75, piv[2]], [piv[0] + l5, piv[1] + h5, piv[2]], col, M_PLAIN + 0.5, o);
  cl.quad([piv[0] + l5, piv[1] - h5, piv[2]], [piv[0] + L, piv[1] - h5 * 0.75, piv[2]], [piv[0] + L, piv[1] - h5 * 0.75, piv[2]], [piv[0] + l5, piv[1], piv[2]], col, M_PLAIN + 0.5, o);
}

// awning: striped cloth sloping off the wall to two slanted gold poles, with a hanging fringe. Built in the face frame at (x, y, z0).
function awning(acc, cl, col, x, y, z0, w, out, drop, cloth, ph) {
  const nx = 4, nz = 3, hw = w / 2;
  cl.anim(2, x, y, z0, ph);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const xa = x - hw + (i / nx) * w, xb = x - hw + ((i + 1) / nx) * w, t0 = j / nz, t1 = (j + 1) / nz;
    cl.quad([xa, y - drop * t1, z0 + out * t1], [xb, y - drop * t1, z0 + out * t1], [xb, y - drop * t0, z0 + out * t0], [xa, y - drop * t0, z0 + out * t0], cloth, M_STRIPE + 0.5, { wt: [t1, t1, t0, t0] });
  }
  cl.anim(5, x, y, z0, ph + 1.7);
  for (let i = 0; i < nx * 2; i++) { const xa = x - hw + (i / (nx * 2)) * w, xb = xa + w / (nx * 2), yy = y - drop, zz = z0 + out; cl.quad([xa, yy - 0.5, zz], [xb, yy - 0.5, zz], [xb, yy, zz], [xa, yy, zz], i % 2 ? col.saffron : col.verm, M_PLAIN, { wt: [1, 1, 0.3, 0.3] }); }
  for (const sx of [-1, 1]) beam(acc, [x + sx * (hw - 0.1), y - drop - 2.3, z0 + 0.5], [x + sx * (hw - 0.1), y - drop + 0.05, z0 + out - 0.05], 0.05, col.gold, M_GOLD);
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('first-rain-palace') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map(lin);
  const col = {
    saffron: pal[0], indigo: pal[1], marble: pal[2], slate: pal[3], verm: pal[4], mala: pal[5], gold: pal[6],
    marbleB: [pal[2][0] * 0.95, pal[2][1] * 0.92, pal[2][2] * 0.86], pearl: pal[2], ink: mixc(pal[1], pal[3], 0.35), brass: mulc(pal[6], 0.7), umber: lin('#4a2b14'),
  };
  const side = opts.pass === 'right' ? 1 : -1;      // +1: the front travels toward +X and the camera toward -X; -1 (default): the reverse, palace on the camera's left
  const acc = makeAcc(false), cl = makeAcc(true);
  const pennantPoles = [], perches = [], gardens = [], pierFeet = [], landingPots = [], towerFeet = [];
  const W = WALL, FZ = PLINTH, FH = 18, Y0 = 3.85, PI = Math.PI;
  const clothCols = [col.verm, col.saffron, col.mala, col.verm, col.indigo, col.saffron];

  const Y = async () => { if (ctx.yield) await ctx.yield(); };
  async function face(k) {
    const front = k === 0, rich = k !== 2, fr = rng.fork ? rng.fork('face' + k) : rng;
    acc.push(0, 0, 0, k * PI / 2); cl.push(0, 0, 0, k * PI / 2);
    // plinth, lotus moulding, ledge
    acc.quad([-PLINTH, 0, PLINTH], [PLINTH, 0, PLINTH], [PLINTH, 3, PLINTH], [-PLINTH, 3, PLINTH], col.marble, M_WALL + 0.5);
    acc.quad([-PLINTH, 3, PLINTH], [PLINTH, 3, PLINTH], [PLINTH, Y0, 79.2], [-PLINTH, Y0, 79.2], col.marble, M_LOTUS + 0.5);
    acc.quad([-PLINTH, Y0, 79.2], [PLINTH, Y0, 79.2], [PLINTH, Y0, W], [-PLINTH, Y0, W], col.marbleB, M_PLAIN + 0.5);
    // the two wall runs either side of the frontispiece
    const lower = [], upper = [];
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? FH : -PLINTH, x1 = s > 0 ? PLINTH : -FH, xc = (x0 + x1) / 2, len = x1 - x0;
      acc.quad([x0, Y0, W], [x1, Y0, W], [x1, ROOF, W], [x0, ROOF, W], col.marble, M_WALL + 0.5);
      acc.box(xc, 11.0, W + 0.12, len, 0.3, 0.3, col.marbleB); acc.box(xc, 19.6, W + 0.12, len, 0.3, 0.3, col.marbleB);
      acc.box(xc, ROOF - 0.3, W + 0.55, len, 0.3, 1.5, col.marbleB, M_PLAIN, { tz: 0.4, cap: col.marble });
      acc.quad([x0, ROOF, W + 0.05], [x1, ROOF, W + 0.05], [x1, ROOF + 1.7, W + 0.05], [x0, ROOF + 1.7, W + 0.05], col.marble, M_KANG + 0.5);
      for (let x = x0 + 2; x < x1 - 2; x += fr.range(2.6, 4.4)) { const yb = fr.pick([20.2, 20.2, 14.5, 11.6]); acc.quad([x - 0.07, yb, W + 1.3], [x + 0.07, yb, W + 1.3], [x + 0.07, ROOF - 0.3, W + 1.3], [x - 0.07, ROOF - 0.3, W + 1.3], col.pearl, M_DRIP + 0.5); }
      for (let i = 0; i < 5; i++) if (rich || fr.chance(0.6)) lower.push(s * (24.5 + 11 * i) + fr.range(-0.5, 0.5));
      for (let i = 0; i < 4; i++) {
        const x = s * (30 + 11 * i) + fr.range(-0.4, 0.4);
        if (rich || fr.chance(0.5)) upper.push(x);
        // ground-storey doorway under each upper bay, with an awning on the rich faces
        const door = fr.chance(0.5) ? col.ink : col.verm;
        acc.quad([x - 1.5, Y0, W + 0.03], [x + 1.5, Y0, W + 0.03], [x + 1.5, 7.1, W + 0.03], [x - 1.5, 7.1, W + 0.03], door, door === col.verm ? M_STRIPE : M_PLAIN);
        acc.push(x, Y0, W + 0.14); acc.archPlate(3.0, 2.2, 0.85, 3.6, col.marble, { segs: 10 }); acc.pop();
        acc.box(x, Y0, W + 0.35, 3.6, 0.25, 0.7, col.marbleB);
        if (rich || fr.chance(0.4)) awning(acc, cl, col, x, 7.6, W + 0.1, 4.4, 3.2, 1.5, fr.pick([col.saffron, col.verm, col.saffron]), fr.range(0, 6.28));
        if (i === 1) await Y();
      }
      await Y();
      // parapet chhatris, pennant poles, peacock perches
      for (const px of [27, 52]) { acc.push(s * px, ROOF, W - 2.4); chhatri(acc, col, fr.range(1.45, 1.8), 4, rich); acc.pop(); perches.push({ k, p: acc.world(s * (px + 6.5), ROOF + 1.75, W) }); }
      for (let i = 0; i < 6; i++) if (rich ? (front || i < 4) : (i === 1 || i === 4)) { const x = s * (21 + 9.2 * i), h = fr.range(5.6, 7.2); beam(acc, [x, ROOF, W - 0.4], [x, ROOF + h, W - 0.4], 0.06, col.gold, M_GOLD); pennantPoles.push(acc.world(x, ROOF + h - 0.5, W - 0.4)); }
    }
    await Y();
    for (const x of lower) {
      await Y();
      const w = fr.range(4.0, 5.0), d = fr.range(3.0, 3.4);
      acc.push(x, 7.6, W); jharokha(acc, col, w, d, fr);
      for (const sx of [-1, 1]) acc.quad([sx * (w / 2 + 0.6) - 0.06, -2.2 - fr.range(0, 2), d + 0.4], [sx * (w / 2 + 0.6) + 0.06, -2.2, d + 0.4], [sx * (w / 2 + 0.6) + 0.06, 3.0, d + 0.4], [sx * (w / 2 + 0.6) - 0.06, 3.0, d + 0.4], col.pearl, M_DRIP + 0.5);
      acc.pop();
      if (fr.chance(rich ? 0.55 : 0.25)) {        // a sari hung over the balustrade to dry, caught by the rain
        const sx = x + fr.range(-0.8, 0.8), sw = fr.range(0.9, 1.5), z = W + d + 0.07, c = fr.pick(clothCols); cl.anim(5, sx, 8.75, z, fr.range(0, 6.28));
        for (let j = 0; j < 2; j++) cl.quad([sx - sw / 2, 8.75 - 0.9 * (j + 1), z], [sx + sw / 2, 8.75 - 0.9 * (j + 1), z], [sx + sw / 2, 8.75 - 0.9 * j, z], [sx - sw / 2, 8.75 - 0.9 * j, z], c, M_STRIPE, { wt: [(j + 1) / 2, (j + 1) / 2, j / 2, j / 2] });
      }
    }
    for (const x of upper) { await Y(); acc.push(x, 17.2, W); jharokha(acc, col, fr.range(3.8, 4.6), fr.range(2.6, 3.0), fr); acc.pop(); }
    // marigold garlands swagged from balcony to balcony
    if (rich) { const ls = lower.slice().sort((a, b) => a - b); for (let i = 0; i < ls.length - 1; i++) if (ls[i + 1] - ls[i] < 12.5) {
      const xa = ls[i] + 2.2, xb = ls[i + 1] - 2.2, n = 7, z = W + 2.9; cl.anim(4, (xa + xb) / 2, 7.5, z, fr.range(0, 6.28));
      for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, s0 = Math.sin(t0 * PI), s1 = Math.sin(t1 * PI), xA = lerp(xa, xb, t0), xB = lerp(xa, xb, t1), yA = 7.5 - 1.1 * s0, yB = 7.5 - 1.1 * s1;
        cl.quad([xA, yA - 0.14, z], [xB, yB - 0.14, z], [xB, yB + 0.14, z], [xA, yA + 0.14, z], col.saffron, M_BEAD + 0.5, { wt: [s0, s1, s1, s0] }); }
    } }

    await Y();
    // ----- frontispiece: three cusped arches, a loggia terrace, an upper storey with balconies, two chhatris -----
    const mb = col.marble;
    acc.quad([FH, Y0, FZ], [FH, Y0, W - 4], [FH, 29.5, W - 4], [FH, 29.5, FZ], mb, M_WALL + 0.5); acc.quad([-FH, Y0, W - 4], [-FH, Y0, FZ], [-FH, 29.5, FZ], [-FH, 29.5, W - 4], mb, M_WALL + 0.5);
    for (const px of [-15.625, 15.625]) { acc.box(px, Y0, FZ - 0.9, 4.75, 5.75, 1.8, mb, M_PIER); pierFeet.push([k, px]); }
    for (const px of [-4.75, 4.75]) acc.box(px, Y0, FZ - 0.9, 2.0, 5.75, 1.8, mb, M_WALL);
    for (const cx of [-9.5, 0, 9.5]) { acc.push(cx, Y0, FZ + 0.01); acc.archPlate(7.5, 3.3, 1.9, 5.75, mb, { segs: 16, depth: 1.8 }); acc.pop(); }
    if (front) {            // through-passage to the court
      acc.quad([13.25, Y0, 60], [13.25, Y0, FZ - 1.8], [13.25, 9.6, FZ - 1.8], [13.25, 9.6, 60], mb, M_WALL + 0.5); acc.quad([-13.25, Y0, FZ - 1.8], [-13.25, Y0, 60], [-13.25, 9.6, 60], [-13.25, 9.6, FZ - 1.8], mb, M_WALL + 0.5);
      acc.quad([-13.25, 9.6, 60], [13.25, 9.6, 60], [13.25, 9.6, FZ], [-13.25, 9.6, FZ], col.marbleB, M_TILE + 0.5);
      for (const s of [-1, 1]) acc.quad([s * 13.2, Y0, s > 0 ? 60 : FZ - 1.8], [s * 13.2, Y0, s > 0 ? FZ - 1.8 : 60], [s * 13.2, Y0 + 0.42, s > 0 ? FZ - 1.8 : 60], [s * 13.2, Y0 + 0.42, s > 0 ? 60 : FZ - 1.8], col.verm, M_PLAIN + 0.5);
      acc.quad([-13.25, Y0 + 0.01, FZ], [13.25, Y0 + 0.01, FZ], [13.25, Y0 + 0.01, 60], [-13.25, Y0 + 0.01, 60], mb, M_TILE + 0.5);
      for (const px of [-4.75, 4.75]) { acc.box(px, Y0, 70, 1.4, 5.75, 1.4, mb); acc.box(px, Y0, 60.6, 2.0, 5.75, 1.2, mb); }
      for (const cx of [-9.5, 0, 9.5]) { acc.push(cx, Y0, 60, PI); acc.archPlate(7.5, 3.3, 1.9, 5.75, mb, { segs: 14, depth: 1.2 }); acc.pop(); }
    } else {
      acc.quad([-13.25, Y0, FZ - 1.7], [13.25, Y0, FZ - 1.7], [13.25, 9.6, FZ - 1.7], [-13.25, 9.6, FZ - 1.7], col.ink, M_PLAIN + 0.5);
      for (const cx of [-9.5, 0, 9.5]) acc.quad([cx - 2.2, Y0, FZ - 1.6], [cx + 2.2, Y0, FZ - 1.6], [cx + 2.2, 8.0, FZ - 1.6], [cx - 2.2, 8.0, FZ - 1.6], col.verm, M_STRIPE);
    }
    acc.box(0, 9.6, FZ - 2.7, 2 * FH + 0.8, 0.3, 7.8, col.marbleB, M_PLAIN, { cap: mb, capMat: M_TILE + 0.5, bottom: true });
    for (const s of [-1, 1]) {
      acc.quad([s > 0 ? 14 : -FH, 9.9, FZ], [s > 0 ? FH : -14, 9.9, FZ], [s > 0 ? FH : -14, 17.8, FZ], [s > 0 ? 14 : -FH, 17.8, FZ], mb, M_WALL + 0.5);
      if (s > 0) acc.quad([14, 9.9, FZ - 6], [14, 9.9, FZ], [14, 17.8, FZ], [14, 17.8, FZ - 6], mb, M_WALL + 0.5); else acc.quad([-14, 9.9, FZ], [-14, 9.9, FZ - 6], [-14, 17.8, FZ - 6], [-14, 17.8, FZ], mb, M_WALL + 0.5);
      for (const cx of [4.7, 14]) { acc.push(s * cx, 9.9, FZ - 0.35); acc.ngon(8, 0.34, 0.27, 0, 5.3, mb, M_PLAIN, { cap: false }); acc.box(0, 5.3, 0, 0.9, 0.3, 0.9, col.marbleB); acc.pop(); }
      acc.push(s * 12, 29.5, FZ - 2.6); chhatri(acc, col, 1.7, 4, true); acc.pop();
      for (const jx of [5.6, 13.3]) { acc.push(s * jx, 20.3, FZ); jharokha(acc, col, 4.2, 2.7, fr); acc.pop(); }
      beam(acc, [s * 17, 29.5, FZ - 0.5], [s * 17, 36.5, FZ - 0.5], 0.07, col.gold, M_GOLD); pennantPoles.push(acc.world(s * 17, 36.0, FZ - 0.5));
      perches.push({ k, p: acc.world(s * 6, 31.25, FZ) });
    }
    await Y();
    for (const cx of [-9.35, 0, 9.35]) { acc.push(cx, 9.9, FZ); acc.archPlate(9.0, 5.3, 1.7, 7.9, mb, { segs: 18, depth: 0.7 }); acc.pop(); }
    acc.quad([-14, 9.9, FZ - 6], [14, 9.9, FZ - 6], [14, 17.8, FZ - 6], [-14, 17.8, FZ - 6], mb, M_WALL + 0.5);
    acc.quad([-14, 17.8, FZ - 6], [14, 17.8, FZ - 6], [14, 17.8, FZ], [-14, 17.8, FZ], col.marbleB, M_PLAIN + 0.5);
    // the loggia is looked up into from the barge: a beamed ceiling with painted panels, three doorways and a lotus dado on its back wall
    const rosy = mixc(col.verm, col.marble, 0.7), skyP = mixc(col.indigo, col.marble, 0.78);
    for (let i = 0; i < 12; i++) {
      const xa = -14 + (i / 12) * 28, xb = xa + 28 / 12;
      acc.quad([xa + 0.2, 17.7, FZ - 5.9], [xb - 0.2, 17.7, FZ - 5.9], [xb - 0.2, 17.7, FZ - 0.75], [xa + 0.2, 17.7, FZ - 0.75], i % 2 ? skyP : rosy, M_PLAIN);
      if (i) acc.box(xa, 17.3, FZ - 3.3, 0.36, 0.5, 5.4, col.marble, M_PLAIN, { bottom: true });
    }
    acc.quad([-14, 9.92, FZ - 5.96], [14, 9.92, FZ - 5.96], [14, 11.3, FZ - 5.7], [-14, 11.3, FZ - 5.7], col.marble, M_LOTUS + 0.5);
    for (const cx of [-9.35, 0, 9.35]) {
      acc.quad([cx - 1.5, 11.3, FZ - 5.9], [cx + 1.5, 11.3, FZ - 5.9], [cx + 1.5, 15.4, FZ - 5.9], [cx - 1.5, 15.4, FZ - 5.9], col.ink, M_PLAIN + 0.5);
      acc.quad([cx - 1.4, 14.0, FZ - 5.82], [cx + 1.4, 14.0, FZ - 5.82], [cx + 1.4, 15.4, FZ - 5.82], [cx - 1.4, 15.4, FZ - 5.82], cx === 0 ? col.saffron : col.verm, M_STRIPE);
      acc.push(cx, 11.3, FZ - 5.74); acc.archPlate(3.2, 2.9, 0.9, 4.6, mb, { segs: 10 }); acc.pop();
      for (const jx of [-3.4, 3.4]) acc.quad([cx + jx - 0.9, 11.55, FZ - 5.9], [cx + jx + 0.9, 11.55, FZ - 5.9], [cx + jx + 0.9, 13.4, FZ - 5.9], [cx + jx - 0.9, 13.4, FZ - 5.9], mb, M_JALI);
    }
    for (let i = 0; i < 4; i++) acc.quad([-FH + i * 9, 9.9, FZ + 1.0], [-FH + (i + 1) * 9, 9.9, FZ + 1.0], [-FH + (i + 1) * 9, 10.9, FZ + 1.0], [-FH + i * 9, 10.9, FZ + 1.0], mb, M_JALI);
    acc.quad([-FH, 17.8, FZ], [FH, 17.8, FZ], [FH, 29.5, FZ], [-FH, 29.5, FZ], mb, M_WALL + 0.5);
    acc.box(0, 17.6, FZ + 0.15, 2 * FH + 0.4, 0.35, 0.4, col.marbleB);
    acc.quad([-FH, 29.5, FZ], [FH, 29.5, FZ], [FH, 29.5, W - 4], [-FH, 29.5, W - 4], mb, M_TILE + 0.5);
    acc.quad([FH, ROOF, W - 4], [-FH, ROOF, W - 4], [-FH, 29.5, W - 4], [FH, 29.5, W - 4], mb, M_WALL + 0.5);
    acc.box(0, 29.2, FZ + 0.5, 2 * FH + 1.4, 0.3, 1.4, col.marbleB, M_PLAIN, { tz: 0.45, cap: mb });
    acc.quad([-FH, 29.5, FZ + 0.05], [FH, 29.5, FZ + 0.05], [FH, 31.3, FZ + 0.05], [-FH, 31.3, FZ + 0.05], mb, M_KANG + 0.5);
    acc.push(0, 29.5, FZ - 3.2); acc.ngon(8, 3.5, 3.4, 0, 2.2, mb, M_PLAIN, { cap: false }); acc.ngon(8, 4.2, 3.5, 2.0, 2.4, col.marbleB, M_PLAIN, { capCol: mb });
    acc.push(0, 2.4, 0, 0, 3.6); acc.lathe(DOME_PROF, 16, mb, M_DOME); acc.pop(); acc.push(0, 2.4 + 1.13 * 3.6, 0); finial(acc, col, 2.3); acc.pop(); acc.pop();

    await Y();
    if (rich) {             // landing steps, brass pots, saris laid out, mooring posts
      for (let i = 0; i < 4; i++) acc.box(0, 0, FZ + 0.3 + i * 0.6, 26, 3.0 - i * 0.7, 0.6, i % 2 ? col.marbleB : mb, M_PLAIN, { cap: mb });
      for (let i = 0; i < 6; i++) { const st = fr.int(0, 3), px = fr.range(-11.5, 11.5); if (front) landingPots.push([px, st]); acc.push(px, 3.0 - st * 0.7, FZ + 0.3 + st * 0.6, 0, fr.range(0.75, 1.2)); pot(acc, col, 1); acc.pop(); }
      for (let i = 0; i < 3; i++) { const st = fr.int(1, 3), x = fr.range(-10, 8), y = 3.0 - st * 0.7 + 0.02, z = FZ + st * 0.6, w = fr.range(2.2, 3.4); acc.quad([x, y, z + 0.58], [x + w, y, z + 0.58], [x + w, y, z + 0.04], [x, y, z + 0.04], fr.pick(clothCols), M_STRIPE); }
      for (const s of [-1, 1]) { acc.push(s * 14.4, 0, FZ + 1.5); acc.ngon(6, 0.17, 0.14, 0, 4.3, col.verm, M_PLAIN, { cap: false }); acc.push(0, 4.3, 0); finial(acc, col, 0.55); acc.pop(); acc.pop(); }
    }
    if (front) {            // the swing on gold chains in the left loggia bay, under a vermilion canopy, trailing a scarf
      const cx = -9.35 * side, pz = FZ - 3.0, py = 16.5, ph = fr.range(0, 6.28);
      beam(acc, [cx - 2.4, py, pz], [cx + 2.4, py, pz], 0.09, col.gold, M_GOLD);
      cl.anim(3, cx, py, pz, ph);
      cl.box(cx, 10.95, pz, 2.6, 0.16, 0.95, col.gold, M_GOLD); cl.box(cx, 11.11, pz, 2.3, 0.2, 0.8, col.verm, M_PLAIN);
      cl.quad([cx - 1.25, 11.1, pz - 0.45], [cx + 1.25, 11.1, pz - 0.45], [cx + 1.25, 11.95, pz - 0.5], [cx - 1.25, 11.95, pz - 0.5], col.saffron, M_STRIPE);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) beam(cl, [cx + sx * 1.22, 11.0, pz + sz * 0.42], [cx + sx * 1.22, py, pz], 0.04, col.gold, M_GOLD);
      for (let j = 0; j < 6; j++) { const x0 = cx + 0.9 + j * 0.62, x1 = x0 + 0.62, w0 = 0.15 + j * 0.17, w1 = w0 + 0.17, y0 = 11.45 - j * 0.07, y1 = y0 - 0.07;
        cl.quad([x0, y0 - 0.26, pz + 0.3], [x1, y1 - 0.26, pz + 0.3], [x1, y1 + 0.26, pz + 0.3], [x0, y0 + 0.26, pz + 0.3], col.pearl, M_STRIPE + 0.5, { wt: [w0, w1, w1, w0] }); }
      awning(acc, cl, col, cx, 17.7, FZ + 0.1, 8.8, 3.0, 1.2, col.verm, ph + 2);
      anchors.swing = acc.world(cx, 11.1, pz);
    }
    acc.pop(); cl.pop();
  }

  const anchors = {};
  for (let k = 0; k < 4; k++) { await face(k); await Y(); }

  // ----- court walls, roof terraces, court floor -----
  for (let k = 0; k < 4; k++) {
    await Y();
    acc.push(0, 0, 0, k * PI / 2); cl.push(0, 0, 0, k * PI / 2);
    const segs = k === 0 ? [[-60, -13.25, Y0], [13.25, 60, Y0], [-13.25, 13.25, 9.6]] : [[-60, 60, Y0]];
    for (const [xa, xb, yb] of segs) acc.quad([xb, yb, 60], [xa, yb, 60], [xa, ROOF, 60], [xb, ROOF, 60], col.marble, M_WALL + 0.5);
    acc.quad([60, ROOF, 59.95], [-60, ROOF, 59.95], [-60, ROOF + 1.5, 59.95], [60, ROOF + 1.5, 59.95], col.marble, M_KANG + 0.5);
    acc.quad([-W, ROOF, W], [W, ROOF, W], [60, ROOF, 60], [-60, ROOF, 60], col.marble, M_TILE + 0.5);
    for (const x of [-36, 36]) { acc.push(x + rng.range(-3, 3), 12, 60, PI); jharokha(acc, col, 4.4, 2.8, rng); acc.pop(); }
    awning(acc, cl, col, rng.range(-8, 8), 12.6, -14.05 - 0, 6.5, -3.0, 1.3, rng.pick([col.saffron, col.verm]), rng.range(0, 6.28));
    // roof garden: painted mangoes and cypresses; spare spots go to the world as anchors
    for (const x of [-66, -40, 40, 66]) { const p = [x + rng.range(-2, 2), ROOF, 69 + rng.range(-1.5, 1.5)]; gardens.push(acc.world(p[0], p[1], p[2])); if (rng.chance(0.6)) { acc.push(p[0], p[1], p[2], rng.range(0, 6), rng.range(2.0, 3.0)); tree(acc, col, 1, rng.chance(0.3)); acc.pop(); } }
    acc.pop(); cl.pop();
  }
  acc.quad([-60, Y0, 60], [60, Y0, 60], [60, Y0, -60], [-60, Y0, -60], col.marble, M_TILE + 0.5);

  // ----- corner towers -----
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    await Y();
    acc.push(sx * 77, 0, sz * 77);
    // the tower's foot (the middle of its octagon at the water), handed over as a place: anchors.towerFeet
    towerFeet.push(acc.world(0, 0, 0));
    acc.ngon(8, 6.3, 5.5, 0, Y0, col.marble, M_WALL, { cap: false }); acc.ngon(8, 5.5, 5.4, Y0, 28.6, col.marble, M_WALL, { cap: false });
    acc.ngon(8, 5.85, 5.85, 10.9, 11.3, col.marbleB, M_PLAIN, { cap: false }); acc.ngon(8, 5.8, 5.8, 19.5, 19.9, col.marbleB, M_PLAIN, { cap: false });
    acc.ngon(8, 6.8, 5.6, 28.3, 28.9, col.marbleB, M_PLAIN, { capCol: col.marble }); acc.ngon(8, 5.55, 5.55, 28.9, 30.4, col.marble, M_KANG, { cap: false });
    acc.push(0, 28.9, 0); chhatri(acc, col, 1.78, 8, true); acc.pop();
    // between the niche rows every face carries a pierced window on a sill under a small striped hood, and a jali band under the cornice
    for (let i = 0; i < 8; i++) {
      const am = PI / 8 + (i + 0.5) * PI / 4;
      for (const [y0, hh, d] of [[7.5, 2.0, 5.17], [16.3, 1.8, 5.14]]) {
        acc.push(Math.sin(am) * d, y0, Math.cos(am) * d, am);
        acc.quad([-1.1, 0, 0], [1.1, 0, 0], [1.1, hh, 0], [-1.1, hh, 0], col.marble, M_JALI);
        acc.box(0, -0.3, 0.12, 2.9, 0.3, 0.5, col.marbleB, M_PLAIN, { cap: col.marble });
        acc.quad([-1.45, hh + 0.05, 0.75], [1.45, hh + 0.05, 0.75], [1.45, hh + 0.65, 0.02], [-1.45, hh + 0.65, 0.02], (i + (y0 > 10 ? 1 : 0)) % 2 ? col.saffron : col.verm, M_STRIPE);
        acc.pop();
      }
      acc.push(Math.sin(am) * 5.1, 25.3, Math.cos(am) * 5.1, am); acc.quad([-1.5, 0, 0], [1.5, 0, 0], [1.5, 1.5, 0], [-1.5, 1.5, 0], col.marble, M_JALI); acc.pop();
      // the battered foot stands at the barge's eye level and passes close: a striped dado, a pierced panel or a feather panel in a gold rule,
      // a lotus moulding under the ledge, and a marigold swag below the windows
      const ap = (y) => (6.3 - 0.2078 * y) * 0.9239 + 0.05, tq = (hw, ya, yb, c, mat, dz = 0) => acc.quad([-hw, ya, ap(ya)], [hw, ya, ap(ya)], [hw, yb, ap(yb) + dz], [-hw, yb, ap(yb) + dz], c, mat);
      acc.push(0, 0, 0, am); cl.push(sx * 77, 0, sz * 77, am);
      tq(2.0, 0.3, 1.0, col.verm, M_STRIPE); tq(2.05, 2.95, 3.8, col.marble, M_LOTUS + 0.5, 0.26);
      if (i % 2) tq(1.25, 1.35, 2.7, col.marble, M_JALI);
      else {
        tq(0.85, 1.4, 2.65, (i / 2) % 2 ? col.saffron : col.verm, M_FEATHER);
        for (const [a, b] of [[[-0.98, 1.28], [0.98, 1.28]], [[0.98, 1.28], [0.98, 2.78]], [[0.98, 2.78], [-0.98, 2.78]], [[-0.98, 2.78], [-0.98, 1.28]]]) beam(acc, [a[0], a[1], ap(a[1]) + 0.04], [b[0], b[1], ap(b[1]) + 0.04], 0.045, col.gold, M_GOLD);
      }
      { const n = 6, zs = 5.36, y = 7.05; cl.anim(4, 0, y, zs, i * 1.7 + sx + sz * 2);
        for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, s0 = Math.sin(t0 * PI), s1 = Math.sin(t1 * PI), xA = lerp(-1.9, 1.9, t0), xB = lerp(-1.9, 1.9, t1), yA = y - 0.75 * s0, yB = y - 0.75 * s1;
          cl.quad([xA, yA - 0.14, zs], [xB, yB - 0.14, zs], [xB, yB + 0.14, zs], [xA, yA + 0.14, zs], col.saffron, M_BEAD + 0.5, { wt: [s0, s1, s1, s0] }); } }
      acc.pop(); cl.pop();
    }
    perches.push({ k: sz > 0 ? 0 : 2, p: acc.world(sx * 3.2, 30.45, sz * 4.4) });
    acc.pop();
  }
  await ctx.yield?.();

  // ----- central pavilion: arcaded block, drum, bulbous dome, the great gold finial -----
  const domeR = rng.range(8.6, 9.6);
  acc.box(0, Y0, 0, 28, 20.2, 28, col.marble, M_WALL, { capMat: M_TILE + 0.5 });
  for (let k = 0; k < 4; k++) {
    await Y();
    acc.push(0, 0, 0, k * PI / 2);
    for (const cx of [-8.5, 0, 8.5]) { acc.quad([cx - 3, Y0, 14.03], [cx + 3, Y0, 14.03], [cx + 3, Y0 + 6.3, 14.03], [cx - 3, Y0 + 6.3, 14.03], cx === 0 ? col.verm : col.ink, cx === 0 ? M_STRIPE : M_PLAIN); acc.push(cx, Y0, 14.14); acc.archPlate(6.4, 4.0, 1.7, 6.6, col.marble, { segs: 14 }); acc.pop(); }
    acc.box(0, 23.75, 14.4, 29.6, 0.3, 1.2, col.marbleB, M_PLAIN, { tz: 0.4, cap: col.marble }); acc.box(0, 11.4, 14.1, 28.2, 0.3, 0.3, col.marbleB);
    acc.quad([-14, 24.05, 14.02], [14, 24.05, 14.02], [14, 25.6, 14.02], [-14, 25.6, 14.02], col.marble, M_KANG + 0.5);
    acc.push(11.4, 24.05, 11.4); chhatri(acc, col, 1.5, 4, true); acc.pop();
    acc.pop();
  }
  acc.push(0, 24.05, 0); acc.ngon(8, 8.9, 8.6, 0, 6.0, col.marble, M_WALL, { cap: false }); acc.ngon(8, 10.2, 8.9, 5.8, 6.3, col.marbleB, M_PLAIN, { capCol: col.marble });
  acc.push(0, 6.3, 0, 0, domeR); acc.lathe(DOME_PROF, 24, col.marble, M_DOME); acc.pop();
  acc.push(0, 6.3 + 1.13 * domeR, 0); finial(acc, col, 6.4); acc.pop(); acc.pop();

  await Y();
  // ----- malachite beds (the white arcs read against them), fountains (three line up with the through-arches), court trees -----
  for (const [bx, bz, bw, bd] of [[0, 43, 46, 24], [-40, -40, 26, 26], [40, -40, 26, 26], [-41, 36, 22, 26], [41, 36, 22, 26], [0, -40, 30, 20]]) { acc.quad([bx - bw / 2, Y0 + 0.03, bz + bd / 2], [bx + bw / 2, Y0 + 0.03, bz + bd / 2], [bx + bw / 2, Y0 + 0.03, bz - bd / 2], [bx - bw / 2, Y0 + 0.03, bz - bd / 2], mulc(col.mala, 0.92), M_PLAIN); }
  for (const [fx, fz, s, jets] of [[-9.5, 66, 0.8, 6], [0, 66, 0.9, 6], [9.5, 66, 0.8, 6], [-40, -40, 1.25, 8], [40, -40, 1.25, 8], [-40, 36, 1.2, 8], [40, 36, 1.2, 8]]) { acc.push(fx, Y0, fz); fountain(acc, col, s, jets); acc.pop(); }
  for (const tx of [-11.6, -7.2, -2.2, 2.3, 7.4, 11.5]) { acc.push(tx, Y0, 54.5 - Math.abs(tx % 2), tx * 1.7, 2.3 + 0.25 * Math.abs(tx % 3)); tree(acc, col, 1, Math.abs(tx) > 5 && Math.abs(tx) < 9); acc.pop(); }
  for (const [tx, tz] of [[-27, 47], [27, 47], [-47, -22], [47, -22], [-24, -47], [24, -47], [-47, 12], [47, 12]]) if (rng.chance(0.8)) { acc.push(tx + rng.range(-2, 2), Y0, tz + rng.range(-2, 2), rng.range(0, 6), rng.range(2.6, 3.8)); tree(acc, col, 1, rng.chance(0.4)); acc.pop(); }

  await Y();
  // ----- kiosks standing in the water off the front -----
  anchors.kiosks = [];
  if (opts.kiosks !== false) for (const kx of [60, 20, -20, -60]) {
    acc.push(kx, 0, opts.kioskZ ?? 102); acc.ngon(8, 3.3, 3.0, 0, 2.4, col.marble, M_PLAIN, { cap: false }); acc.ngon(8, 3.3, 3.3, 2.4, 2.75, col.marbleB);
    acc.push(0, 2.75, 0); chhatri(acc, col, 1.45, 8, true); acc.pop(); anchors.kiosks.push(acc.world(0, 0, 0)); perches.push({ k: 0, p: acc.world(0, 2.75, -2.85) }); acc.pop();
  }

  await Y();
  // ----- water-gate: link screen from the far front corner, the gate across the path, a screen out to the bastion -----
  if (opts.waterGate !== false) {
    // a pierced screen: plinth, a low jali, a band of lamp niches (the niche row at y 4.3), a tall jali, parapet; a pilaster with a
    // gold finial about every 6 m and a marigold swag between each pair. `ph` only seeds the swags.
    const screen = (x0, x1, z, h, ph) => { const xc = (x0 + x1) / 2, len = Math.abs(x1 - x0), nb = Math.max(2, Math.round(len / 6));
      acc.box(xc, 0, z, len, 2.4, 0.9, col.marble, M_PLAIN);
      acc.quad([x0, 2.4, z], [x1, 2.4, z], [x1, 4.15, z], [x0, 4.15, z], col.marble, M_JALI);
      acc.quad([x0, 4.15, z], [x1, 4.15, z], [x1, 6.35, z], [x0, 6.35, z], col.marble, M_WALL + 0.5);
      acc.quad([x0, 6.35, z], [x1, 6.35, z], [x1, h, z], [x0, h, z], col.marble, M_JALI);
      acc.box(xc, 4.05, z, len, 0.14, 0.24, col.marbleB); acc.box(xc, 6.3, z, len, 0.14, 0.24, col.marbleB);
      acc.box(xc, h, z, len, 0.3, 0.6, col.marbleB); acc.quad([x0, h + 0.3, z], [x1, h + 0.3, z], [x1, h + 1.6, z], [x0, h + 1.6, z], col.marble, M_KANG + 0.5);
      for (let i = 0; i <= nb; i++) { const px = lerp(x0, x1, i / nb); acc.box(px, 0, z, 0.9, h + 0.9, 1.1, col.marbleB, M_PLAIN, { cap: col.marble }); acc.push(px, h + 0.9, z); finial(acc, col, 0.85); acc.pop(); }
      for (let i = 0; i < nb; i++) { const xa = lerp(x0, x1, i / nb) + 0.6, xb = lerp(x0, x1, (i + 1) / nb) - 0.6, n = 7; for (const zz of [z + 0.62, z - 0.62]) { cl.anim(4, (xa + xb) / 2, 8.1, zz, ph + i * 1.9);
        for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, s0 = Math.sin(t0 * PI), s1 = Math.sin(t1 * PI), xA = lerp(xa, xb, t0), xB = lerp(xa, xb, t1), yA = 8.1 - 1.0 * s0, yB = 8.1 - 1.0 * s1;
          cl.quad([xA, yA - 0.15, zz], [xB, yB - 0.15, zz], [xB, yB + 0.15, zz], [xA, yA + 0.15, zz], col.saffron, M_BEAD + 0.5, { wt: [s0, s1, s1, s0] }); } } } };
    screen(side > 0 ? -110.7 : 82.3, side > 0 ? -82.3 : 110.7, 77, 8.6, 0.7);
    await Y();
    acc.push(-112 * side, 0, 88, -PI / 2); cl.push(-112 * side, 0, 88, -PI / 2);   // gate frame: x' runs along local +Z, the arch is centred on the path
    for (const s of [-1, 1]) { acc.box(s * 7.75, 0, 0, 2.5, 15, 2.6, col.marble, M_WALL); acc.push(s * 7.75, 15.5, 0); chhatri(acc, col, 1.0, 4, true); acc.pop(); }
    acc.push(0, 0, 1.3); acc.archPlate(13, 7.2, 4.4, 15, col.marble, { segs: 22, depth: 1.3 }); acc.pop();
    acc.push(0, 0, -1.3, PI); acc.archPlate(13, 7.2, 4.4, 15, col.marble, { segs: 22, depth: 1.3 }); acc.pop();
    acc.box(0, 15, 0, 18.6, 0.5, 3.3, col.marbleB, M_PLAIN, { cap: col.marble });
    for (const zz of [-1.5, 1.5]) acc.quad([-9, 15.5, zz], [9, 15.5, zz], [9, 17, zz], [-9, 17, zz], col.marble, M_KANG + 0.5);
    acc.push(0, 15.5, 0); chhatri(acc, col, 1.35, 4, true); acc.pop();
    // both faces of the gate are dressed, so no marble plate is left bare: pierced windows and a striped frieze over the arch, a gold-ruled
    // vermilion lozenge in each spandrel, a marigold swag across the opening; on the piers a lotus foot, a pierced panel under a saffron
    // awning, a feather panel in a gold rule and a small balcony; the jambs carry a striped band, a lotus foot and a pierced panel
    const wr = rng.fork ? rng.fork('water-gate') : rng;
    const rect = (x0, x1, y0, y1, z, c, mat) => acc.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], c, mat);
    const ruled = (x0, x1, y0, y1, z) => { for (const [a, b] of [[[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]], [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]]]) beam(acc, [a[0], a[1], z], [b[0], b[1], z], 0.05, col.gold, M_GOLD); };
    const swag = (xa, xb, y, z, sag, ph) => { const n = 9; cl.anim(4, (xa + xb) / 2, y, z, ph);
      for (let j = 0; j < n; j++) { const t0 = j / n, t1 = (j + 1) / n, s0 = Math.sin(t0 * PI), s1 = Math.sin(t1 * PI), xA = lerp(xa, xb, t0), xB = lerp(xa, xb, t1), yA = y - sag * s0, yB = y - sag * s1;
        cl.quad([xA, yA - 0.17, z], [xB, yB - 0.17, z], [xB, yB + 0.17, z], [xA, yA + 0.17, z], col.saffron, M_BEAD + 0.5, { wt: [s0, s1, s1, s0] }); } };
    for (const [fz, fr, fk] of [[1.3, 0, 0], [-1.3, PI, 1]]) {
      acc.push(0, 0, fz, fr); cl.push(0, 0, fz, fr);
      for (const jx of [-4.3, 0, 4.3]) { rect(jx - 1.25, jx + 1.25, jx === 0 ? 12.95 : 12.4, 14.2, 0.05, col.marble, M_JALI); }
      for (const jx of [-2.15, 2.15]) rect(jx - 0.3, jx + 0.3, 12.9, 14.1, 0.06, col.gold, M_GOLD);
      rect(-9, 9, 14.3, 15, 0.06, col.verm, M_STRIPE); acc.box(0, 12.15, 0.12, 13.4, 0.16, 0.24, col.marbleB);
      for (const sx of [-1, 1]) {
        const lx = sx * 5.25, ly = 11.0, lw = 0.75, lh = 0.95;
        acc.quad([lx, ly - lh, 0.05], [lx + lw, ly, 0.05], [lx, ly + lh, 0.05], [lx - lw, ly, 0.05], col.verm, M_PLAIN + 0.5);
        for (const [a, b] of [[[0, -lh], [lw, 0]], [[lw, 0], [0, lh]], [[0, lh], [-lw, 0]], [[-lw, 0], [0, -lh]]]) beam(acc, [lx + a[0], ly + a[1], 0.09], [lx + b[0], ly + b[1], 0.09], 0.045, col.gold, M_GOLD);
        // the pier's face
        const x0 = sx > 0 ? 6.5 : -9, x1 = sx > 0 ? 9 : -6.5, xc = sx * 7.75;
        rect(x0, x1, 0.25, 1.05, 0.05, col.verm, M_STRIPE); acc.quad([x0, 1.2, 0.3], [x1, 1.2, 0.3], [x1, 2.4, 0.05], [x0, 2.4, 0.05], col.marble, M_LOTUS + 0.5);
        rect(xc - 0.95, xc + 0.95, 2.8, 6.0, 0.05, col.marble, M_JALI);
        rect(xc - 0.85, xc + 0.85, 7.1, 9.2, 0.05, (sx > 0) === (fk === 0) ? col.verm : col.saffron, M_FEATHER); ruled(xc - 0.95, xc + 0.95, 7.0, 9.3, 0.09);
        acc.push(xc, 10.6, 0); jharokha(acc, col, 2.2, 1.4, wr); acc.pop();
        awning(acc, cl, col, xc, 6.75, 0.08, 2.3, 1.5, 0.75, col.saffron, 1.3 + sx + fk * 2.2);
      }
      swag(-5.7, 5.7, 11.5, 0.42, 1.6, 0.9 + fk * 2.4);
      acc.pop(); cl.pop();
      await Y();
    }
    for (const sx of [-1, 1]) {
      acc.push(sx * 6.5, 0, 0, -sx * PI / 2);
      rect(-1.25, 1.25, 0.25, 1.05, 0.04, col.verm, M_STRIPE); acc.quad([-1.3, 1.2, 0.2], [1.3, 1.2, 0.2], [1.3, 2.4, 0.04], [-1.3, 2.4, 0.04], col.marble, M_LOTUS + 0.5);
      rect(-0.9, 0.9, 2.65, 4.05, 0.04, col.marble, M_JALI); rect(-0.8, 0.8, 6.5, 7.1, 0.04, sx > 0 ? col.saffron : col.verm, M_STRIPE);
      acc.pop();
    }
    // a gold lamp hanging at the crown of the arch
    beam(acc, [0, 12.5, 0], [0, 11.2, 0], 0.03, col.gold, M_GOLD); acc.push(0, 10.35, 0); acc.lathe([[0.0, 0], [0.3, 0.14], [0.4, 0.42], [0.18, 0.74], [0.0, 0.86]], 6, col.gold, M_GOLD); acc.pop();
    screen(9, 23.5, 0, 8.6, 2.9); anchors.screenPerch = acc.world(13.375, 10.2, 0);
    acc.push(27, 0, 0); acc.ngon(8, 4.6, 4.1, 0, 11, col.marble, M_WALL, { cap: false }); acc.ngon(8, 5.0, 4.2, 10.6, 11.1, col.marbleB, M_PLAIN, { capCol: col.marble }); acc.ngon(8, 4.15, 4.15, 11.1, 12.5, col.marble, M_KANG, { cap: false });
    acc.push(0, 11.1, 0); chhatri(acc, col, 1.45, 8, true); acc.pop(); perches.push({ k: 0, p: acc.world(0, 12.55, 3.6) }); acc.pop();
    beam(acc, [-8.9, 17, 0], [-8.9, 23, 0], 0.07, col.gold, M_GOLD); pennantPoles.push(acc.world(-8.9, 22.5, 0)); perches.push({ k: 0, p: acc.world(5.2, 15.5, 0) });
    acc.pop(); cl.pop();
  }

  await Y();
  // ----- peacocks on the front-side perches (parapet, frontispiece, towers, kiosks, gate, bastion) -----
  if (opts.peacocks !== false) for (const q of perches) if (q.k === 0) peacock(acc, cl, col, q.p, rng.range(1.5, 1.9), rng.range(0, 6.28));

  // ----- pennants -----
  for (const p of pennantPoles) pennant(cl, p, rng.range(4.6, 6.8), rng.range(1.2, 1.7), rng.pick([col.verm, col.saffron, col.verm, col.mala]), rng.range(0, 6.28));
  // one more peacock on the parapet of the screen to the right of the water-gate, turned to face the barge coming up the wall
  if (anchors.screenPerch && opts.peacocks !== false) { const q = anchors.screenPerch; acc.push(q[0], q[1], q[2], side * PI / 2); cl.push(q[0], q[1], q[2], side * PI / 2); peacock(acc, cl, col, [0, 0, 0], 1.75, 2.1); acc.pop(); cl.pop(); }
  // a string course across the foot of each frontispiece end pier, at the plinth's top (laid after everything else of the palace mesh,
  // proud of the pier's face as the wall's own courses are of the wall)
  for (const [k, px] of pierFeet) { acc.push(0, 0, 0, k * PI / 2); acc.box(px, Y0, FZ + 0.12, 4.75, 0.3, 0.3, col.marbleB); acc.pop(); }
  await ctx.yield?.();

  // ---------- materials and meshes ----------
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const key = v3(opts.keyDir || [0.59 * side, 0.766, 0.25]).normalize();
  const U = {
    uTime: { value: 0 }, uCamL: { value: new THREE.Vector3(0, 30, 300) }, uFrontX: { value: -400 }, uFrontRun: { value: 1 }, uWindX: { value: -340 }, uLamp: { value: 1 }, uPx: { value: 0.001 }, uSide: { value: side },
    uDraw: { value: 0 }, uGlint: { value: 0 }, uFade: { value: 1 }, uLift: { value: 0 }, uTop: { value: 400 }, uLampAll: { value: opts.lampAll || 0 }, uCloudX: { value: -640 }, uRainAmt: { value: 1 }, uRainSky: { value: v3(mulc(mixc([0.78, 0.86, 1.08].map((t, i) => t * lerp(pal[2][i], pal[3][i], 0.45)), lin(opts.cloud || '#1F2A5C'), 0.1), opts.rainSky ?? 1)) }, uStars: { value: opts.stars || 0 }, uWash: { value: v3(lin(opts.wash || '#ffffff')) },
    uGround: { value: v3(lin(opts.skyGround || '#F0A81E')) }, uCloud: { value: v3(lin(opts.cloud || '#1F2A5C')) }, uCloudHi: { value: v3(mixc(lin(opts.cloud || '#1F2A5C'), pal[2], 0.3)) }, uEdge: { value: v3(lin(opts.cloudEdge || '#F6F1E3')) }, uKey: { value: key }, uCool: { value: v3(opts.cool || [0.8, 0.86, 0.97]) }, uRows: { value: new THREE.Vector3(ROWS[0], ROWS[1], ROWS[2]) },
    uUmber: { value: v3(col.umber) }, uGold: { value: v3(col.gold) }, uInk: { value: v3(col.ink) }, uVerm: { value: v3(col.verm) }, uYellow: { value: v3(col.saffron) },
    uPearl: { value: v3(col.pearl) }, uSlate: { value: v3(col.slate) }, uIndigo: { value: v3(col.indigo) },
    // the lake's own two flat tones (the world may repaint them) and how far the rain thins the painted mirror
    uLake: { value: v3(opts.lake ? lin(opts.lake) : col.slate) }, uLakeHi: { value: v3(opts.lakeDeep ? lin(opts.lakeDeep) : mixc(col.slate, col.indigo, 0.2)) }, uReflWet: { value: 0.5 },
    // the painted mirror on the lake: the herd's place (x, feet y, z, scale; scale 0: none), and up to 22 boxes (centre, half size, colour) in local space
    uMala: { value: v3(col.mala) }, uFwd: { value: new THREE.Vector3(-side, 0, 0) }, uHerd: { value: new THREE.Vector4(0, 0, 0, 0) }, uHerdGap: { value: 690 }, uHerdRare: { value: 0 }, uRefl: { value: opts.reflections ?? 1 },
    uRBc: { value: Array.from({ length: 22 }, () => new THREE.Vector3()) }, uRBh: { value: Array.from({ length: 22 }, () => new THREE.Vector3()) }, uRBk: { value: Array.from({ length: 22 }, () => new THREE.Vector3()) },
  };
  let nRB = 0;
  const reflBox = (cx, cy, cz, hx, hy, hz, c) => { if (nRB >= 22) return false; U.uRBc.value[nRB].set(cx, cy, cz); U.uRBh.value[nRB].set(hx, hy, hz); U.uRBk.value[nRB].set(c[0], c[1], c[2]); nRB++; return true; };
  for (const k of anchors.kiosks) reflBox(k[0], 5.2, k[2], 3.3, 5.2, 3.3, col.marble);
  const mk = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const object = new THREE.Group(); object.name = 'first-rain-palace';
  const palace = new THREE.Mesh(await acc.toGeometryAsync(Y), mk(GOUACHE_VERT, GOUACHE_FRAG, { vertexColors: true, side: THREE.DoubleSide }));
  const cloth = new THREE.Mesh(await cl.toGeometryAsync(Y), mk(GOUACHE_VERT, GOUACHE_FRAG, { vertexColors: true, side: THREE.DoubleSide, defines: { CLOTH: 1 } }));
  cloth.frustumCulled = false; object.add(palace, cloth);
  let triangles = acc.tris + cl.tris;

  if (opts.water !== false) {
    const g = new THREE.CircleGeometry(1700, 72); g.rotateX(-PI / 2);
    const lake = new THREE.Mesh(g, mk(LAKE_VERT, LAKE_FRAG)); lake.position.y = 0.04; lake.frustumCulled = false; object.add(lake); triangles += 72;
  }
  if (opts.rain !== false) {
    // sheets: cards across the front (metres behind it) and cards along X at fixed z, all ending at the front
    const cards = [[0, 340], [0, 170], [0, 60], [0, 0], [1, -180], [1, -96], [1, 330], [1, 200], [2, 90.6]];      // far to near: they write no depth
    const sp = [], ss = [], si = [];
    cards.forEach(([t, val], n) => { for (const [x, y] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { sp.push(x, y, 0); ss.push(t, val); } si.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3); });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 2)); sg.setIndex(si);
    // the rain is drawn after everything solid (and after the portal's window, order 5) and writes no depth, so the gold snake, drawn
    // after it, is hidden by masonry but never chopped by strokes
    const sheets = new THREE.Mesh(sg, mk(SHEET_VERT, SHEET_FRAG, { side: THREE.DoubleSide, depthWrite: false })); sheets.frustumCulled = false; sheets.renderOrder = 8; object.add(sheets); triangles += cards.length * 2;
    // strokes round the eye: a 12 x 9 x 12 lattice of ribbons
    const ig = new THREE.InstancedBufferGeometry(); ig.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); ig.setIndex([0, 1, 2, 0, 2, 3]);
    const cells = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) for (let k = 0; k < 12; k++) cells.push(i, j, k);
    ig.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cells), 3)); ig.instanceCount = cells.length / 3;
    const strokes = new THREE.Mesh(ig, mk(STROKE_VERT, STROKE_FRAG, { side: THREE.DoubleSide, depthWrite: false })); strokes.frustumCulled = false; strokes.renderOrder = 8.1; object.add(strokes); triangles += (cells.length / 3) * 2;
  }
  const bolts = [];
  if (opts.lightning !== false) {
    // gold snakes with three forks, to the right of the travel (local +Z), on the indigo: one before the hit (opts.bolt0Z, opts.bolt0Y
    // place its head: default 600 m out and 405 m up), one beyond the pavilion, low enough to clear a vehicle's canopy
    const lr = rng.fork ? rng.fork('bolt') : rng;
    for (let bn = 0; bn < 2; bn++) {
      const bp = [], bd = [], bt = [], bi = []; let nv = 0;
      const ribbon = (pts, t0, t1, wid) => {
        for (let i = 0; i < pts.length; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), t = lerp(t0, t1, i / (pts.length - 1)), w = wid * (1 - 0.6 * (i / (pts.length - 1)));
          for (const sg of [-1, 1]) { bp.push(pts[i][0], pts[i][1], pts[i][2]); bd.push(d.x, d.y, d.z); bt.push(t, sg * w); }
          if (i) bi.push(nv - 2, nv - 1, nv, nv - 1, nv + 1, nv); nv += 2;
        }
      };
      const jit = bn === 0 ? (opts.bolt0Jit ?? 1) : 1, fixed = bn === 0 && opts.bolt0X !== undefined;
      const main = [], S = bn === 0 ? [fixed ? opts.bolt0X + 0 * lr.range(-60, 60) : side * (-560 + lr.range(-60, 60)), opts.bolt0Y ?? 405, (opts.bolt0Z ?? 600) + (fixed ? 0 : 1) * lr.range(-80, 80)] : [side * (-760 + lr.range(-50, 50)), 300, 330 + lr.range(-40, 40)], E = [S[0] + side * lr.range(20, 90) * jit, bn === 0 ? (opts.bolt0End ?? 80) : 85, S[2] + (fixed ? (opts.bolt0Dz ?? 0) : 0) - lr.range(20, 90) * jit], n = 22;
      for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 ? 0 : 1; main.push([lerp(S[0], E[0], t) + lr.range(-16, 16) * j * (fixed ? 0.2 : 1), lerp(S[1], E[1], t), lerp(S[2], E[2], t) + lr.range(-16, 16) * j * jit]); }
      ribbon(main, 0, 1, 1);
      for (const f of [5, 10, 15]) { const b = [main[f]], dir = lr.sign(); for (let i = 1; i <= 6; i++) { const p = b[i - 1]; b.push([p[0] + lr.range(-8, 8), p[1] - lr.range(8, 16) * jit, p[2] + dir * lr.range(10, 22) * jit]); } ribbon(b, f / n, f / n + 0.3, 0.6); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aDir', new THREE.Float32BufferAttribute(bd, 3)); bg.setAttribute('aT', new THREE.Float32BufferAttribute(bt, 2)); bg.setIndex(bi);
      const wide0 = bn === 0 ? (opts.bolt0Wide ?? 1) : 1, bu = { uCamL: U.uCamL, uPx: U.uPx, uGold: U.uGold, uDark: { value: v3(mixc(lin(opts.cloud || '#1F2A5C'), col.umber, 0.35)) }, uDraw: { value: 0 }, uGlint: { value: 0 }, uFade: { value: 0 }, uWide: { value: wide0 }, uHalo: { value: 0 } };
      const bolt = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: bu, vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG, side: THREE.DoubleSide })); bolt.frustumCulled = false; bolt.renderOrder = 9; object.add(bolt);
      const halo = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: { ...bu, uWide: { value: 1.75 * wide0 }, uHalo: { value: 1 } }, vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG, side: THREE.DoubleSide, depthWrite: false }));
      halo.frustumCulled = false; halo.renderOrder = 8.9; object.add(halo); triangles += (bi.length / 3) * 2;
      bolts.push({ u: bu, p: 0, meshes: [bolt, halo] });
      if (bn === 0) anchors.lightning = main[Math.floor(n / 2)]; else anchors.lightning2 = main[Math.floor(n / 2)];
    }
  }
  let sky = null;
  if (opts.sky !== false) {
    sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -0.5; sky.frustumCulled = false; object.add(sky); triangles += 960;
  }

  // ---------- anchors (local space) ----------
  const along = (p) => -p[0] * side;                // order perches along the pass
  const sx3 = (p) => [p[0] * side, p[1], p[2]];
  Object.assign(anchors, {
    placement: { position: [0, 0, 460], rotationY: side * PI / 2, pathX: side * 88 },
    flyThrough: [[460, 2.6, 0], [400, 2.6, 0], [270, 2.6, 34], [140, 2.6, 70], [80, 2.6, 88], [-80, 2.6, 88], [-112, 2.6, 88], [-190, 2.6, 88]].map(sx3),
    portalSeat: { position: [-190 * side, 2.6, 88], facing: [side, 0, 0], radius: 7 },
    hit: [170 * side, 2.6, 62], faceLook: [0, 12, PLINTH], waterGate: { position: [-112 * side, 2.6, 88], width: 13, height: 12, axis: [1, 0, 0] },
    peacockPerches: perches.filter((q) => q.k === 0).sort((a, b) => along(a.p) - along(b.p)).map((q) => q.p).slice(0, 14), allPerches: perches.map((q) => q.p),
    gardenSpots: gardens, landingPots, towerFeet, pennants: pennantPoles, frontAxis: [side, 0, 0], side, keyDir: [key.x, key.y, key.z], lampRows: ROWS,
    bounds: { min: [-117, 0, -84], max: [84, 50, 121] },
  });

  // ---------- progress ----------
  let frontX = -400, cloudX = null, driven = false;
  const frontOfU = (u) => side * (u < 0.12 ? lerp(-1440, -240, u / 0.12) : u < 0.45 ? lerp(-240, 170, (u - 0.12) / 0.33) : 170 + (u - 0.45) * 1320);
  const setFront = (x) => { driven = true; frontX = x; };
  const setCloud = (x) => { cloudX = x; };          // local x of the leading cloud roll; left alone it leads the front by 240 m
  const setLightning = (p, i = 0) => { driven = true; if (bolts[i]) bolts[i].p = clamp(p, 0, 1); };
  const setProgress = (u) => { driven = true; frontX = frontOfU(clamp(u, 0, 1)); setLightning((u - 0.31) / 0.12, 0); setLightning((u - 0.84) / 0.13, 1); };
  const inv = new THREE.Matrix4(), camL = new THREE.Vector3(), fwd = new THREE.Vector3(), size = new THREE.Vector2(1920, 1080);

  return {
    object, radius: 78, height: 38, center: new THREE.Vector3(0, 14, 0), anchors, uniforms: U, triangles, makeMaterial: mk, colors: col,
    setProgress, setFront, setCloud, setLightning, frontOfU, reflBox, boltMeshes: bolts.map((b) => b.meshes),
    update(dt, time, camera) {
      object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert(); camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      U.uCamL.value.copy(camL); U.uTime.value = time;
      fwd.set(0, 0, -1).transformDirection(camera.matrixWorld).transformDirection(inv); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(-side, 0, 0); U.uFwd.value.copy(fwd.normalize());
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) ctx.renderer.getDrawingBufferSize(size);
      U.uPx.value = (2 * Math.tan(((camera.fov || 60) * PI) / 360)) / Math.max(size.y, 1);
      if (!driven) {        // viewer demo: the front sweeps across as the orbiting camera goes round; the snake loops
        let a = Math.atan2(camL.x, camL.z); if (a < -0.8) a += PI * 2;
        frontX = side * lerp(-330, 300, clamp((a + 0.3) / 4.7, 0, 1)); if (bolts[0]) bolts[0].p = (time % 8) / 8;
      }
      U.uFrontX.value = frontX; U.uWindX.value = frontX + 60 * side; U.uCloudX.value = cloudX === null ? frontX + 240 * side : cloudX;
      for (let i = 0; i < bolts.length; i++) { const b = bolts[i], bp = b.p; b.u.uDraw.value = clamp(bp / 0.23, 0, 1); b.u.uGlint.value = bp < 0.23 ? 2 : ((bp - 0.23) / 0.2) % 1.3; b.u.uFade.value = bp <= 0 ? 0 : 1 - smoothstep(0.62, 1, bp); }
      if (sky) { sky.position.copy(camL); sky.scale.setScalar((camera.far || 6000) * 0.9); }
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}

// The world builds the rest of the page (gate, ghats, pavilion, far shore, barge) with the same tools and the same shader.
export const gouache = { makeAcc, NEAR_BOAT, GOUACHE_VERT, GOUACHE_FRAG, LAKE_VERT, LAKE_FRAG, DOME_PROF, scaleProf, archY, lin, mixc, mulc, beam, finial, chhatri, jharokha, tree, peacock, pot, fountain, pennant, awning,
  M: { PLAIN: M_PLAIN, WALL: M_WALL, JALI: M_JALI, LOTUS: M_LOTUS, GOLD: M_GOLD, KANG: M_KANG, STRIPE: M_STRIPE, TILE: M_TILE, DOME: M_DOME, DASH: M_DASH, BEAD: M_BEAD, DRIP: M_DRIP, LEAF: M_LEAF, FEATHER: M_FEATHER, HOUSE: 15, HILL: 17, PAD: 18, FLOWER: 19, SCALLOP: 20 } };
