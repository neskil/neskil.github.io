// GALIMOTO: a swept red-earth yard at fifty times life size, full of bent-wire toys, and the low sun
// drawing them all as one line frieze on a whitewashed wall. We ride above the steering rod of a
// wire bus. Bent-wire style: flat ShaderMaterials only, no lights, no fog, exact colours (post flat).
//
// OUTLINE OF THIS FILE
//   1. LOOKS      three seeded looks (late afternoon, early morning with mist, full moon)
//   2. FLATS      one small CPU-transformed batch of flat solid shapes (swallows, mango leaves, the rare
//                 hen and chicks) drawn three times: itself, its ground shadow, its wall shadow
//   3. SHAPES     2D outlines of those things
//   4. SKY        a flat dome (field, one paler band, a few fixed stars at night) and the far ground
//   5. BEYOND     flat swaying silhouettes past the wall: mango crown, thatch ridge, pawpaw, maize
//   6. MARKS      bare footprints, chalk drawings and toy tracks on the earth, dust puffs behind the bus wheels,
//                 the dawn mist band
//   7. build()    hero (src/parts/galimoto-yard.js) at the origin, path from its anchors, pois, update
//
// SPACE  x east, z south, y up, earth at y 0, wall face at x = 160 (lit side toward -x).
// ROUTE  the rut (hero.anchors.flyThrough, marks in anchors.marks): 170 m straight at the wall; a right-hand bend to
//        due south (bicycle, then windmill); a left-hand bend that swings the eye and the bus round to head STRAIGHT
//        AT THE WALL from about 100 m (the frieze face-on); a right-hand bend away; a long straight closing on the wall
//        from 45 m to 30 m; 80 m to the portal. So the street is seen far off and raking, then face-on, then close and
//        raking, and a steady camera (weak pois) gets the face-on view from the route itself.
// PARADE (in the hero) one file of six toys on one lane, placed by how far the eye has come along the rut. They wait
//        beyond the bicycle (the big cow broadside, grazing); as we come under the top tube they set off, and through
//        the first bend and down the short line the cow keeps ahead of us on the open side with clear earth round it
//        and the file beyond it. Down the street we draw level with the file, 60 m off. Nothing else stands within
//        45 m of the rut on the open side. The windmill stands 85 m left of the rut.
// GIANTS (in the hero) a wire giraffe and a wire elephant stand on the wall side of the two bends. What each does is
//        set going by an EVENT OF THE YARD: the eye within a whole number of halves of the animal's frame distance
//        (the distance at which it is as tall as the frame) of its stand, or level with a stand. The giraffe leaves
//        its tree at 8 halves, is at its stand, side-on, by 5, turns away from 3 and goes back once we are level with
//        it; the elephant lifts its trunk from 8 to 6 halves, lowers it from 5 to 4 and walks off from 4. hero.events
//        gives the arc lengths at which these fall (worked out in the hero from the rut and each animal's own height).
// GAZE   through the two bends the site's two plain pulls: one of weight 0.4 from u 0.165, toward the cow and, as the
//        giraffe walks out to its stand, over to the giant (0.85 times the share of that walk done); one of weight 0.5
//        on the giant from the giraffe's reaching its stand. Both end at the elephant's event of 3 halves. Then the
//        wall almost abeam while the rut heads at it; then down the street; then, from u 0.765 until the bus is let go
//        (the bus's own state), the wall beside our own bus and, as it steers away, the bus itself. Path, pace and
//        the 45 s are as they were.
//        A flock of six larger birds wheels in the sky over the bends; buildChalk() lays chalk drawings (hopscotch,
//        suns, a snail, a bus, a bawo board, a house, stars) and the crimped tracks of pushed toys.
// THE WAY THROUGH (u is the share of the rut flown; the rut is 731 m)
//        u 0 wall band, bicycle and windmill on the axis; a hidden wheel's long spoke shadow turns across the foreground;
//        0.005-0.07 the bus rolls in under us; from then on it slides, tail out, showing one whole
//        side (hero.busYaw), at the end of a 53 m rod of doubled wire that runs up to the handle ring under the eye;
//        0.04-0.16 four hens on the open side of the straight; 0.20-0.24 under the big bicycle; 0.22-0.44 THE COW AND
//        THE FILE on the right (three hens left of the bend, against the far street); THE GIANTS by the events above;
//        0.49-0.60 THE FRIEZE FACE-ON (slowest here: pace 0.64): four line-drawn houses side by side, power line,
//        whirligig, smoke spirals, chameleon on the wall top, the bus small below;
//        0.60-0.72 the flyer lifts from the open side as the gaze swings back, crosses high over the rut far ahead and
//        runs down the street above the wall top, its shadow on the whitewash beside it, to the end;
//        0.64-0.78 the street close and raking: house fronts and their drawings left, ox cart, bowling hoop, a bus and
//        a car circling and two far houses on the open side; 0.67-0.89 the big hoop rolls in round the portal;
//        0.78-0.93 THE STREET'S FAR END AND OUR OWN DRAWING: the street runs on to the portal (hung aeroplane, a flat
//        wire tree, the fish, the gate, a second tree, hung hoops, a last house front, and the tall drawing of a
//        radio's aerial from the open side). Past z 470 the bus goes over to the wall's foot and the sun lays its side
//        among those drawings (window loops, roof bundles, the rod's long line running back toward us). When its
//        front axle is 62 m short of the portal it steers right, across the rut; it is held to a stand, its axle
//        16.6 m short of the portal and 22 m right of the rut; the handle is let go and drops, and we fly on over the
//        rod and pass the bus on our right about 23 m short of the portal (u 0.97). From there it is the portal in the hoop, the flyer
//        and three swallows that keep ahead of us in the sky all the way.
//        RARE (ctx.vary.rare): a real hen 37 m tall with five pale chicks at her feet. She pecks in the street in
//        front of the house fronts where the rut heads at the wall (her filled shadow on the whitewash beside her),
//        runs past the bus as we turn down the street and on ahead of us, her flank turned toward the eye, faster and
//        faster, past the portal's side and out of sight round the wall's far end. We never come near her.
// LIGHT  the sun stands a little south of west in every look (direction z > 0), so a shadow on the wall falls
//        north of its toy, toward the eye, and is seen apart from the wire that casts it.
// VARY   hour picks the look; density thins or thickens swallows, footprints, dust, pebbles and the birds on the
//        power line; rare stages the hen. Seeded swaps (in the hero): helicopter or aeroplane, hens or guinea fowl,
//        six or eight windmill blades. ctx.keepLines (offline previews only) returns _debug.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/galimoto-yard.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- 1. LOOKS
// palette in the brief's order: earth, earth mark and ground shadow, wall, sky, wire, glint, wall shadow
const LOOKS = {
  afternoon: { name: 'Galimoto', palette: ['#B5432A', '#8C2F1F', '#F3EBDD', '#5B5FA8', '#1B1512', '#E08A3C', '#3A2E4F'],
    sun: [-0.93, 0.26, 0.25], band: '#8A8DC6', sil: '#3A2E4F', star: 0, mist: null, portal: '#E08A3C' },
  morning: { name: 'Galimoto, Early', palette: ['#BC8F8A', '#8F5F66', '#F7F2CB', '#86CFC6', '#1B1512', '#F0BE5E', '#46587F'],
    sun: [-0.955, 0.174, 0.2], band: '#C4EADF', sil: '#4E7F88', star: 0, mist: '#DDE9D6', portal: '#F0BE5E' },
  moon: { name: 'Galimoto by Moonlight', palette: ['#5F6D8E', '#3C4767', '#DCE6F5', '#1F2254', '#0E1018', '#CBD6EA', '#2B3C7E'],
    sun: [-0.90, 0.37, 0.24], band: '#2E3470', sil: '#12143A', star: 1, mist: null, portal: '#CBD6EA' },
};

// ---------------------------------------------------------------- 2. FLATS
// 2D outline -> triangle list (xyz triples). plane 'xy' (upright), 'xz' (lying), sx/sy scale.
function polyTris(pts, plane = 'xy', k = 1) {
  let c = pts.map((p) => new THREE.Vector2(p[0] * k, p[1] * k));
  if (THREE.ShapeUtils.isClockWise(c)) c = c.reverse();
  const f = THREE.ShapeUtils.triangulateShape(c, []), out = [];
  for (const tri of f) for (const i of tri) { const p = c[i]; if (plane === 'xy') out.push(p.x, p.y, 0); else out.push(p.x, 0, p.y); }
  return out;
}

const VS_FLAT = /* glsl */`
attribute vec3 color; varying vec3 vC;
void main() { vC = color; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
const FS_FLAT = /* glsl */`
varying vec3 vC;
void main() { gl_FragColor = vec4(vC, 1.); }`;
const vsFlatShadow = (cast, wallPass) => /* glsl */`
varying vec2 vClip;
${cast}
void main() {
  vec3 c = position;
  ${wallPass
    ? 'vec3 p = castW(c); vClip = vec2(min(min(p.y, uWallX - c.x), 685. - p.z), uWallH - p.y); p.x -= 0.09;'
    : 'vec3 p = castG(c); vClip = vec2(uWallX - p.x, c.y + 0.5); p.y += 0.09;'}
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const FS_FLAT_SHADOW = /* glsl */`
uniform vec3 uCol; varying vec2 vClip;
void main() { if (min(vClip.x, vClip.y) < 0.) discard; gl_FragColor = vec4(uCol, 1.); }`;

function makeFlats(U, glslCast) {
  const parts = []; let nVert = 0;
  const api = {
    object: new THREE.Group(), parts,
    // tris: xyz triples in the part's own space; returns the part (set part.m, part.on each frame)
    add(tris, color, shadow = true) {
      const p = { src: Float32Array.from(tris), at: nVert, m: new THREE.Matrix4(), on: true, color: new THREE.Color(color), shadow };
      nVert += p.src.length / 3; parts.push(p); return p;
    },
    finish() {
      // parts that cast no shadow go last, outside the shadow passes' draw range
      const order = parts.filter((p) => p.shadow).concat(parts.filter((p) => !p.shadow)); let at = 0, nSh = 0;
      for (const p of order) { p.at = at; at += p.src.length / 3; if (p.shadow) nSh = at; }
      const pos = new Float32Array(nVert * 3), col = new Float32Array(nVert * 3);
      for (const p of parts) for (let i = 0; i < p.src.length / 3; i++) { col[(p.at + i) * 3] = p.color.r; col[(p.at + i) * 3 + 1] = p.color.g; col[(p.at + i) * 3 + 2] = p.color.b; }
      const geo = new THREE.BufferGeometry();
      const pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', pa); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const gsh = new THREE.BufferGeometry(); gsh.setAttribute('position', pa); gsh.setDrawRange(0, nSh);
      const sh = { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, side: THREE.DoubleSide };
      const cu = (c) => ({ uSun: U.uSun, uWallX: U.uWallX, uWallH: U.uWallH, uCol: c });
      const body = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VS_FLAT, fragmentShader: FS_FLAT, side: THREE.DoubleSide }));
      const g = new THREE.Mesh(gsh, new THREE.ShaderMaterial({ vertexShader: vsFlatShadow(glslCast, false), fragmentShader: FS_FLAT_SHADOW, uniforms: cu(U.uMark), ...sh }));
      const w = new THREE.Mesh(gsh, new THREE.ShaderMaterial({ vertexShader: vsFlatShadow(glslCast, true), fragmentShader: FS_FLAT_SHADOW, uniforms: cu(U.uInk), ...sh }));
      body.renderOrder = 2; g.renderOrder = 1; w.renderOrder = 1;
      for (const m of [body, g, w]) { m.frustumCulled = false; api.object.add(m); }
      api.pos = pa; api.triangles = nVert;
    },
    update() {
      const a = api.pos.array;
      for (let k = 0; k < parts.length; k++) {
        const p = parts[k], s = p.src, e = p.m.elements, n = s.length; let o = p.at * 3;
        if (!p.on) { for (let i = 0; i < n; i++) a[o + i] = 0; continue; }
        for (let i = 0; i < n; i += 3, o += 3) {
          const x = s[i], y = s[i + 1], z = s[i + 2];
          a[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; a[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; a[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        }
      }
      api.pos.needsUpdate = true;
    },
  };
  return api;
}

// ---------------------------------------------------------------- 3. SHAPES
// swallow, 6 m across: x forward, z across (lying shapes), plus an upright keel so it never vanishes edge-on
const SW_BODY = [[1.7, 0], [0.9, 0.36], [-0.8, 0.3], [-1.2, 0.16], [-3.0, 0.95], [-1.7, 0], [-3.0, -0.95], [-1.2, -0.16], [-0.8, -0.3], [0.9, -0.36]];
const SW_KEEL = [[1.7, 0], [0.7, 0.42], [-1.2, 0.22], [-1.6, 0], [-1.2, -0.3], [0.6, -0.4]];
const SW_WING = [[0.95, 0.15], [0.35, 1.2], [-0.75, 2.5], [-1.45, 3.05], [-0.95, 2.1], [-0.5, 1.0], [-0.6, 0.15]];
// hen, 20 m tall, walking toward +x; the leg hangs from its hip at the origin
const HEN_BODY = [[-9.2, 17.2], [-7.6, 17.8], [-6.2, 14.6], [-2, 13.2], [1.5, 13.6], [3.2, 15.5], [3.6, 18], [4.2, 19.2], [4.6, 20.7], [5.2, 19.6], [5.8, 20.5], [6.3, 19.3],
  [7.0, 18.9], [8.6, 18.1], [7.0, 17.5], [6.6, 16.6], [7.1, 15.4], [6.3, 15.6], [6.4, 12.5], [5, 9.2], [2, 7], [-2, 6.6], [-5.5, 8.2], [-7.5, 11], [-10.2, 13.2]];
const HEN_LEG = [[-0.55, 0.6], [0.55, 0.6], [0.45, -6.5], [2.4, -7.1], [2.4, -7.6], [-1.3, -7.6], [-1.3, -7.15], [-0.45, -6.7]];
const CHICK_BODY = [[-3.2, 4.4], [-2.2, 4.6], [-1.2, 3.9], [0.2, 4.2], [0.6, 5.2], [1.4, 5.7], [2.2, 5.3], [3.1, 5.0], [2.3, 4.6], [2.2, 3.4], [1.3, 2.3], [-0.6, 1.9], [-2.3, 2.5]];
const CHICK_LEG = [[-0.22, 0.3], [0.22, 0.3], [0.2, -1.75], [0.95, -1.95], [0.95, -2.2], [-0.5, -2.2], [-0.2, -1.9]];
// a curled mango leaf, 9 m long: two halves folded along the midrib, both ends lifting off the earth
function leafTris(half) {
  const out = [], N = 9, at = (i, w) => { const t = i / N, x = (t - 0.5) * 9, wd = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 1.5) * 1.3 * w;
    return [x, 0.12 + 7 * (t - 0.45) * (t - 0.45) + Math.abs(wd) * 0.75, wd * half]; };
  for (let i = 0; i < N; i++) { const a = at(i, 0), b = at(i + 1, 0), c = at(i + 1, 1), d = at(i, 1); out.push(...a, ...b, ...c, ...a, ...c, ...d); }
  return out;
}
// a bare footprint, 12 m long, toes toward +x, lying on the earth (xz); side = +1 right foot, -1 left
function footTris(side) {
  const out = [], sole = [[-5.6, 0.2], [-5.2, 1.6], [-3.8, 2.2], [-1.6, 1.7], [0.6, 2.3], [2.6, 3.0], [3.9, 2.4], [4.2, 0.6], [4.0, -1.4], [3.0, -2.6], [1.0, -2.5], [-1.4, -1.5], [-3.6, -2.0], [-5.0, -1.5]];
  out.push(...polyTris(sole.map((p) => [p[0], p[1] * side]), 'xz'));
  const toes = [[5.6, 1.9, 1.05], [5.9, 0.2, 0.8], [5.6, -1.1, 0.7], [5.1, -2.2, 0.62], [4.4, -3.2, 0.55]];
  for (const [tx, tz, r] of toes) for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.2832, b = ((i + 1) / 8) * 6.2832;
    out.push(tx, 0, tz * side, tx + Math.cos(a) * r * 1.15, 0, tz * side + Math.sin(a) * r, tx + Math.cos(b) * r * 1.15, 0, tz * side + Math.sin(b) * r); }
  return out;
}

// ---------------------------------------------------------------- 4. SKY
const VS_SKY = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const FS_SKY = /* glsl */`
uniform vec3 uSky; uniform vec3 uBand; uniform vec3 uGround; uniform vec3 uStar; uniform float uStars;
varying vec3 vDir;
float h21(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  float e = d.y, fw = fwidth(e) + 1e-5;
  vec3 col = mix(uBand, uSky, smoothstep(0.062 - fw, 0.062 + fw, e));          // one paler band, a hand's breadth deep
  col = mix(uGround, col, smoothstep(-fw, fw, e + 0.002));
  // a few fixed stars: hard discs, one tone
  float az = atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x);
  vec2 g = vec2(az * 7., e * 11.), id = floor(g), f = fract(g);
  vec2 sp = 0.22 + 0.56 * vec2(h21(id + 3.7), h21(id + 9.2));
  float r = 0.035 + 0.03 * h21(id + 1.3);
  vec2 q = (f - sp) * vec2(max(sqrt(max(1. - e * e, 0.)), 0.2) * 11. / 7., 1.);
  float star = step(0.80, h21(id)) * step(length(q), r) * step(0.12, e) * uStars;
  gl_FragColor = vec4(mix(col, uStar, star), 1.);
}`;
function makeSky(look, groundCol) {
  const C = (h) => new THREE.Color(h);
  const mat = new THREE.ShaderMaterial({ vertexShader: VS_SKY, fragmentShader: FS_SKY, side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { uSky: { value: C(look.palette[3]) }, uBand: { value: C(look.band) }, uGround: { value: groundCol }, uStar: { value: C(look.palette[2]) }, uStars: { value: look.star } } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- 5. BEYOND THE WALL
// Flat shapes that sway: position, aSw (base y, height range, phase), aDir (sway vector in xz, metres at the top).
const VS_SIL = /* glsl */`
attribute vec3 aSw; attribute vec2 aDir; uniform float uTime;
void main() {
  float k = clamp((position.y - aSw.x) / max(aSw.y, 1.), 0., 1.);
  float s = k * k * sin(uTime * 0.55 + aSw.z) + 0.3 * k * sin(uTime * 1.45 + aSw.z * 2.7 + position.y * 0.04);
  vec3 p = position + vec3(aDir.x, 0., aDir.y) * s;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const FS_SIL = /* glsl */`
uniform vec3 uCol;
void main() { gl_FragColor = vec4(uCol, 1.); }`;

async function buildBeyond(rng, look, uTime, pause) {
  const pos = [], sw = [], dir = [];
  // a sheet: local (a, y) -> world; `put` adds one triangle list of [a, y] pairs with one sway setting
  const sheet = (ox, oz, ax, az) => (pts, base, range, phase, amp) => {
    for (const p of pts) { pos.push(ox + ax * p[0], p[1], oz + az * p[0]); sw.push(base, range, phase); dir.push(ax * amp, az * amp); }
  };
  const fan = (c, ring) => { const o = []; for (let i = 0; i < ring.length; i++) o.push(c, ring[i], ring[(i + 1) % ring.length]); return o; };
  const lump = (a, y, r, n, rough) => { const ring = [], ph = rng.range(0, 6.28);
    for (let i = 0; i < n; i++) { const t = (i / n) * 6.2832, rr = r * (1 + rough * (Math.sin(t * 3 + ph) * 0.5 + Math.sin(t * 7 + ph * 2) * 0.35 + rng.range(-0.25, 0.25)));
      ring.push([a + Math.cos(t) * rr * 1.15, y + Math.sin(t) * rr * 0.85]); }
    return fan([a, y], ring); };
  const quad = (a0, y0, a1, y1, w0, w1) => { const dx = a1 - a0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const A = [a0 + nx * w0, y0 + ny * w0], B = [a0 - nx * w0, y0 - ny * w0], C2 = [a1 - nx * w1, y1 - ny * w1], D = [a1 + nx * w1, y1 + ny * w1]; return [A, B, C2, A, C2, D]; };
  const blade = (a0, y0, ang, len, w, droop) => { const o = []; let pa = a0, py = y0, an = ang; const N = 4;
    for (let i = 0; i < N; i++) { const na = pa + Math.cos(an) * len / N, ny = py + Math.sin(an) * len / N; o.push(...quad(pa, py, na, ny, w * (1 - i / N), w * (1 - (i + 1) / N))); pa = na; py = ny; an -= droop * Math.sign(Math.cos(ang) || 1); }
    return o; };

  // the mango crown, far right of the opening axis
  { const put = sheet(470, 0, 0, 1), cz = 648, by = 120;
    put(quad(cz + 10, 0, cz - 6, 170, 17, 11), 0, 400, 0.4, 3);
    put(quad(cz - 6, 150, cz - 90, 230, 9, 5), 0, 400, 0.9, 5); put(quad(cz - 4, 160, cz + 85, 240, 9, 5), 0, 400, 0.2, 5);
    for (let i = 0; i < 15; i++) { const t = i / 14, a = cz + (t - 0.5) * 270 + rng.range(-16, 16), y = 235 + Math.sin(t * Math.PI) * 60 * (i % 2 ? 1 : 0.35) + rng.range(-25, 25), r = rng.range(52, 80);
      put(lump(a, y, r, 16, 0.2), by, 260, rng.range(0, 6.28), rng.range(12, 19)); }
    for (let i = 0; i < 46; i++) { const t = rng.range(0, 1), a = cz + (t - 0.5) * 390, top = rng.chance(0.6), y = top ? 300 + Math.sin(t * Math.PI) * 78 + rng.range(-12, 22) : 150 + rng.range(-12, 30);
      put(blade(a, y, top ? rng.range(0.5, 2.6) : rng.range(3.6, 5.8), rng.range(26, 40), 4.6, 0.22), by, 260, rng.range(0, 6.28), rng.range(16, 24)); } }
  await pause();
  // the thatched ridge, left of the axis: a long roof with ragged tufts along its top
  { const put = sheet(520, 0, 0, 1), o = [], z0 = -150, z1 = 150, n = 40;
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, top = (t) => 96 + 82 * Math.min(1, Math.min(t / 0.16, (1 - t) / 0.16)) + Math.sin(t * 40) * 1.2;
      const a0 = lerp(z0, z1, t0), a1 = lerp(z0, z1, t1); o.push([a0, -2], [a1, -2], [a1, top(t1)], [a0, -2], [a1, top(t1)], [a0, top(t0)]);
      if (t0 > 0.15 && t0 < 0.85) put(blade(a0 + rng.range(0, 6), top(t0) - 1, rng.range(1.0, 2.1), rng.range(7, 13), 1.5, 0.15), 176, 12, rng.range(0, 6.28), 2.2); }
    put(o, 0, 1000, 0, 0);
    put(quad(-4, 170, -4, 196, 5, 4), 0, 1000, 0, 0); }                                  // a smoke-hole post
  await pause();
  // the pawpaw: a bare trunk and a crown of hand-shaped leaves
  { const put = sheet(380, 0, 0, 1), cz = 206, top = 168;
    put(quad(cz + 6, 0, cz, top, 6, 3.4), 0, 170, 1.1, 4);
    for (let i = 0; i < 9; i++) { const an = lerp(-0.45, Math.PI + 0.45, i / 8) + rng.range(-0.1, 0.1), L = rng.range(34, 46), ha = cz + Math.cos(an) * L, hy = top + Math.sin(an) * L * 0.8 - 4, ph = rng.range(0, 6.28);
      put(quad(cz, top - 2, ha, hy, 1.5, 1.1), 150, 80, ph, 11);
      const ring = []; for (let k = 0; k < 14; k++) { const t = an + Math.PI + 0.45 + (k / 14) * 6.2832, rr = k % 2 ? 5 : rng.range(17, 22); ring.push([ha + Math.cos(t) * rr, hy + Math.sin(t) * rr]); }
      put(fan([ha, hy], ring), 150, 80, ph, 11); }
    for (let i = 0; i < 5; i++) put(lump(cz + rng.range(-7, 7), top - 14 - i * 5, 5.5, 8, 0.1), 0, 170, 1.1, 4); }      // fruit under the crown
  // maize: a row of stalks whose tassels show over the wall top, bending in a travelling wave
  const maize = (put, a0, a1, step, h0, h1, wst) => { for (let a = a0; a < a1; a += step * rng.range(0.7, 1.3)) { const h = rng.range(h0, h1), ph = a * 0.021 + rng.range(-0.3, 0.3), amp = rng.range(8, 12);
      put(quad(a, 0, a + rng.range(-3, 3), h, wst, wst * 0.6), 0, h1, ph, amp);
      for (let k = 0; k < 4; k++) put(blade(a, h * (0.5 + k * 0.11), k % 2 ? rng.range(0.4, 0.9) : rng.range(2.2, 2.8), rng.range(20, 30), wst * 1.15, 0.36), 0, h1, ph, amp);
      for (let k = 0; k < 5; k++) put(blade(a, h - 2, 1.57 + (k - 2) * 0.33 + rng.range(-0.08, 0.08), rng.range(13, 19), wst * 0.5, 0.05), 0, h1, ph, amp * 1.2); } };
  await pause();
  maize(sheet(318, 0, 0, 1), 292, 478, 19, 104, 122, 1.6);
  await pause();
  // far to the south: a hedge line, more maize and two crowns on the horizon
  { const put = sheet(0, 1750, 1, 0), o = []; let a = -1700, y = 30;
    while (a < 900) { const na = a + rng.range(18, 44), ny = lerp(y, rng.range(22, 70), 0.6); o.push([a, -2], [na, -2], [na, ny], [a, -2], [na, ny], [a, y]); a = na; y = ny; }
    put(o, 0, 1000, 0, 0);
    maize(put, -520, -160, 34, 110, 150, 3.4);
    for (const [ca, cy, r] of [[230, 150, 80], [330, 120, 60], [-900, 130, 70]]) { put(quad(ca, 0, ca + 6, cy, 9, 6), 0, 300, 0.5, 4);
      for (let i = 0; i < 5; i++) put(lump(ca + rng.range(-r, r), cy + rng.range(-25, 35), r * rng.range(0.55, 0.8), 12, 0.2), 60, 180, rng.range(0, 6.28), rng.range(5, 9)); } }

  await pause();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSw', new THREE.Float32BufferAttribute(sw, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 2));
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VS_SIL, fragmentShader: FS_SIL, side: THREE.DoubleSide,
    uniforms: { uTime, uCol: { value: new THREE.Color(look.sil) } } }));
  mesh.frustumCulled = false; mesh.renderOrder = -5;
  return mesh;
}

// ---------------------------------------------------------------- 6. MARKS
// bare footprints: flat marks in the earth's second red, drawn after the earth and before the shadows
function buildFootprints(trails, colour) {
  const pos = [], R = footTris(1), L = footTris(-1);
  for (const [x0, z0, x1, z1, n] of trails) {
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), hx = dx / l, hz = dz / l;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, t = (i + 0.5) / n, cx = x0 + dx * t - hz * side * 6.5, cz = z0 + dz * t + hx * side * 6.5;
      const an = Math.atan2(hz, hx) + side * 0.13, c = Math.cos(an), s = Math.sin(an), src = side > 0 ? R : L;
      for (let k = 0; k < src.length; k += 3) pos.push(cx + src[k] * c - src[k + 2] * s, 0.05, cz + src[k] * s + src[k + 2] * c);
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.); }', uniforms: { uCol: colour },
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.renderOrder = 0.5;
  return mesh;
}

// CHALK AND TREAD: what children draw on a swept yard (a hopscotch, a sun, a snail, a bawo board, a house, a star)
// in the whitewash's pale tone, and the crimped tracks of pushed toys in the earth's second red. Flat ribbons lying on
// the earth, one mesh, drawn after the earth and before the shadows.
function buildChalk(lanePts, pale, mark) {
  const pos = [], col = [];
  const quad = (ax, az, bx, bz, w, c) => { const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w, nz = dx / l * w, ex = dx / l * w * 0.5, ez = dz / l * w * 0.5;
    const A = [ax + nx - ex, az + nz - ez], B = [ax - nx - ex, az - nz - ez], C2 = [bx - nx + ex, bz - nz + ez], D = [bx + nx + ex, bz + nz + ez];
    for (const q of [A, B, C2, A, C2, D]) { pos.push(q[0], 0.07, q[1]); col.push(c.r, c.g, c.b); } };
  // a drawing: polylines in its own metres, set down at (ox, oz), turned by `an`, scaled by k
  const draw = (lines, ox, oz, an, k = 1, w = 0.55) => { const c = Math.cos(an), sn = Math.sin(an);
    for (const L of lines) for (let i = 0; i + 1 < L.length; i++) quad(ox + (L[i][0] * c - L[i][1] * sn) * k, oz + (L[i][0] * sn + L[i][1] * c) * k, ox + (L[i + 1][0] * c - L[i + 1][1] * sn) * k, oz + (L[i + 1][0] * sn + L[i + 1][1] * c) * k, w, pale); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  const circ = (cx, cy, r, n = 16, a0 = 0, a1 = 6.2832) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  const hop = [rect(0, -2.6, 5.2, 2.6), rect(5.2, -2.6, 10.4, 2.6), rect(10.4, -2.6, 15.6, 2.6), rect(15.6, -5.2, 20.8, 0), rect(15.6, 0, 20.8, 5.2), rect(20.8, -2.6, 26, 2.6), rect(26, -5.2, 31.2, 0), rect(26, 0, 31.2, 5.2), circ(31.2, 0, 5.2, 12, -1.5708, 1.5708)];
  const sun = [circ(0, 0, 5.5, 20)]; for (let i = 0; i < 11; i++) { const a = i / 11 * 6.2832; sun.push([[Math.cos(a) * 7, Math.sin(a) * 7], [Math.cos(a) * (i & 1 ? 10 : 11.5), Math.sin(a) * (i & 1 ? 10 : 11.5)]]); }
  const snail = [[]]; for (let i = 0; i <= 44; i++) { const a = i * 0.42, r = 0.8 + i * 0.17; snail[0].push([Math.cos(a) * r, Math.sin(a) * r]); }
  snail.push([[8.4, 0.5], [12.5, -1], [14.5, -4.5]], [[12.5, -1], [15.5, -1.5]]);
  const bawo = [rect(-15.5, -8, 15.5, 8)]; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) bawo.push(circ(-12.95 + i * 3.7, -5.55 + j * 3.7, 1.35, 9));
  const house = [rect(-6, 0, 6, 9), [[-7.5, 9], [0, 16], [7.5, 9]], rect(-1.6, 0, 1.6, 5), rect(2.8, 4, 5, 6.4), [[2.6, 12.4], [2.6, 15.4], [4.4, 15.4], [4.4, 11.2]], circ(5.5, 18.5, 1.2, 8), circ(7.5, 21.5, 1.7, 8)];
  const star = [[]]; for (let i = 0; i <= 10; i++) { const a = i / 10 * 6.2832 - 1.5708, r = i & 1 ? 3.4 : 8; star[0].push([Math.cos(a) * r, Math.sin(a) * r]); }
  const bus = [rect(-9, 2, 9, 9), circ(-5.5, 1.6, 1.9, 10), circ(5.5, 1.6, 1.9, 10), rect(-7.6, 5.4, -4.6, 8), rect(-3.4, 5.4, -0.4, 8), rect(0.8, 5.4, 3.8, 8), rect(5, 5.4, 8, 8), [[9, 6], [11.5, 6], [11.5, 2], [9, 2]]];
  draw(hop, -21, 196, 1.42, 1); draw(sun, -5, 279, 0.3, 1); draw(snail, -25, 287, 2.2, 1); draw(bus, -27, 262, 1.75, 1.1);
  draw(bawo, 57, 351, 0.32, 1); draw(house, 67, 326, 2.0, 1.05); draw(star, 21, 322, 0.4, 1); draw(star, -31, 236, 1.1, 0.7); draw(sun, 24, 352, 1.0, 0.8);
  // tread: two lines of short crimp marks, 6.4 m apart, along a line the toys were pushed
  const tread = (pts, gauge = 3.2) => { let acc = 0, k = 0;
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, hx = dx / l, hz = dz / l;
      for (; acc < l; acc += 1.7, k++) { const cx = a[0] + hx * acc, cz = a[1] + hz * acc;
        for (const sd of [-1, 1]) { const mx = cx - hz * gauge * sd, mz = cz + hx * gauge * sd, t = 0.9 + 0.25 * ((k * 7 + (sd > 0 ? 3 : 0)) % 4 === 0 ? -1 : 0);
          quad(mx - hz * t, mz + hx * t, mx + hz * t, mz - hx * t, 0.3, mark); } }
      acc -= l; } };
  tread(lanePts.filter((q) => q[1] < 520));
  const cv = new THREE.CatmullRomCurve3([[-70, 168], [-36, 186], [-12, 216], [-16, 252], [-36, 284], [-22, 318], [8, 338], [40, 328], [66, 342], [84, 376], [70, 414]].map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal');
  tread(cv.getSpacedPoints(150).map((v) => [v.x, v.z]), 2.5);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VS_FLAT, fragmentShader: FS_FLAT, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.renderOrder = 0.5;
  return mesh;
}

// dust: flat discs that face the eye, one instance each (xyz, radius), rewritten every frame
function buildDust(count, colour) {
  const base = new THREE.CircleGeometry(1, 10), geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(base.getIndex()); geo.setAttribute('position', base.getAttribute('position'));
  const data = new Float32Array(count * 4), at = new THREE.InstancedBufferAttribute(data, 4); at.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPR', at); geo.instanceCount = count;
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
attribute vec4 iPR;
void main() { vec4 mv = viewMatrix * vec4(iPR.xyz, 1.); mv.xy += position.xy * iPR.w; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.); }', uniforms: { uCol: colour } }));
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, data, at, count, base };
}

// the dawn mist: a flat pale band and a thin streak above it, lying across the far yard round the eye
function buildMist(colour, uTime) {
  const N = 120, pos = [], idx = [];
  for (let b = 0; b < 2; b++) for (let i = 0; i <= N; i++) { const a = (i / N) * 6.2832; pos.push(a, 0, b, a, 1, b); }
  for (let b = 0; b < 2; b++) for (let i = 0; i < N; i++) { const o = (b * (N + 1) + i) * 2; idx.push(o, o + 1, o + 3, o, o + 3, o + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    vertexShader: /* glsl */`
uniform float uTime; uniform vec3 uEye;
void main() {
  float a = position.x + uTime * 0.004 * (1. - 2.6 * position.z), top = position.y, band = position.z;
  float lo = mix(0., 18.5 + 1.2 * sin(position.x * 9.), band);
  float hi = mix(11. + 3.2 * sin(position.x * 5. + uTime * 0.05) + 1.6 * sin(position.x * 13. - uTime * 0.08), 21.5 + 1.2 * sin(position.x * 9.) + 0.9 * sin(position.x * 4. + uTime * 0.06), band);
  float r = mix(340., 300., band);
  vec3 p = vec3(uEye.x + cos(a) * r, mix(lo, hi, top), uEye.z + sin(a) * r);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
    fragmentShader: 'uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.); }',
    uniforms: { uTime, uCol: { value: new THREE.Color(colour) }, uEye: { value: new THREE.Vector3() } }, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- 7. THE WORLD
export default {
  id: 'galimoto-yard',
  name: 'Galimoto',
  category: 'domestic',
  weirdness: 0.45,
  media: ['tiny', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const hour = vary.hour || 'any', mood = vary.mood ?? rng();
    const key = hour === 'dawn' ? 'morning' : hour === 'night' ? 'moon' : (hour === 'golden' || hour === 'day') ? 'afternoon'
      : mood < 0.5 ? 'afternoon' : mood < 0.78 ? 'morning' : 'moon';
    const look = LOOKS[key], rare = !!vary.rare;
    const scene = new THREE.Scene();
    const uTime = { value: 0 };

    // ---- the hero: wire town, shadow frieze, earth, wall and the bus we ride
    const hero = await buildHero(ctx, { palette: look.palette, sun: look.sun, keepLines: !!ctx.keepLines, density: dens });
    scene.add(hero.object);
    const carried = hero.carried, A = hero.anchors, U = hero.uniforms, LEN = A.pathLength, MK = A.marks;
    await ctx.yield();

    // ---- sky, the ground out to the horizon, and what stands beyond the wall
    const groundCol = U.uEarth.value.clone().lerp(U.uMark.value, 0.11);
    const sky = makeSky(look, groundCol); scene.add(sky);
    { const g = new THREE.PlaneGeometry(14000, 14000); g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.); }', uniforms: { uCol: { value: groundCol } } }));
      m.position.y = -1.5; m.renderOrder = -6; m.frustumCulled = false; scene.add(m); }
    await ctx.yield();
    scene.add(await buildBeyond(rng.fork('beyond'), look, uTime, () => ctx.yield()));
    await ctx.yield();

    // ---- the route: the rut, exactly
    const path = makePath(A.flyThrough);
    const side = (s, off, out = {}) => { hero.pathAt(s, out); const h = out.heading; out.x -= Math.sin(h) * off; out.z += Math.cos(h) * off; return out; };   // off > 0 = right

    // ---- footprints beside the rut
    { const a = side(20, 34), b = side(200, 60), c = side(MK.sF + 10, -19), d = side(MK.s4, -15), e = side(MK.sF + 50, 33), f = side(MK.s4 + 20, 36);
      const n = (k) => Math.max(3, Math.round(k * dens));
      // (two more trails on the last stretch, both on the open side, BESIDE the rut and never on it. The rut is 20 m
      //  wide; a print reaches REACH = 10.5 m from its trail's line (6.5 m to the side, the foot's half width and its
      //  toe-out). So a line NEAR = 10 + 10.5 + 3.5 = 24 m from the rut's centre line leaves 3.5 m of swept earth
      //  between the rut's edge and the nearest print. The first starts where the last print of the old trail f-e ends
      //  (REACH beyond f) and keeps NEAR the rut down the last straight and past the portal's side. The second lies
      //  along the long line where it did, but outside the old trail f-e, whose own prints reach 36 + REACH from the
      //  centre line: FAR = 36 + 2 * REACH + 1 = 58 m.)
      const REACH = 10.5, NEAR = 10 + REACH + 3.5, FAR = 36 + 2 * REACH + 1;
      const g0 = side(MK.s4 + 20 + REACH, NEAR), g1 = side(LEN + REACH, NEAR + REACH), h0 = side(MK.sF + 16, FAR), h1 = side(MK.sF + 118, FAR);
      scene.add(buildFootprints([[a.x, a.z, b.x, b.z, n(6)], [c.x, c.z, d.x, d.z, n(8)], [f.x, f.z, e.x, e.z, n(9)],
        [g0.x, g0.z, g1.x, g1.z, n(5)], [h0.x, h0.z, h1.x, h1.z, n(6)]], U.uMark)); }
    await ctx.yield();

    // ---- chalk drawings and toy tracks on the earth beside the two bends
    scene.add(buildChalk(A.lane, U.uEarth.value.clone().lerp(U.uWall.value, 0.6), U.uEarth.value.clone().lerp(U.uMark.value, 0.8)));
    await ctx.yield();

    // ---- flats: swallows, mango leaves and (rare) the hen with her chicks
    const flats = makeFlats(U, hero.glslCast), ink = look.palette[6], dark = look.palette[4];
    const frng = rng.fork('flats');
    const swallows = [];
    { const K = 1.25, body = polyTris(SW_BODY, 'xz', K).concat(polyTris(SW_KEEL, 'xy', K)), wr = polyTris(SW_WING, 'xz', K), wl = polyTris(SW_WING.map((p) => [p[0], -p[1]]), 'xz', K);
      const homes = [side(125, 22), side(MK.sB + 30, -34), side(MK.sF + 90, 28), side(70, -30)], nSw = Math.round(12 * dens);
      for (let i = 0; i < nSw; i++) { const h = homes[i % 4];
        swallows.push({ body: flats.add(body, ink), wr: flats.add(wr, ink), wl: flats.add(wl, ink), cx: h.x + frng.range(-25, 25), cz: h.z + frng.range(-25, 25),
          ax: frng.range(55, 95), az: frng.range(80, 130), w1: frng.range(0.24, 0.38) * (frng.chance(0.5) ? 1 : -1), w2: frng.range(0.17, 0.29), w3: frng.range(0.3, 0.6),
          p1: frng.range(0, 6.28), p2: frng.range(0, 6.28), p3: frng.range(0, 6.28), y0: frng.range(11, 17) - (i % 4 === 2 ? 3 : 0) }); }
      // three more hawk higher, ahead of the eye on the open side all the way down the yard: they are the birds in the
      // sky half of the frame, and their shadows flick over the earth and up the whitewash beside us
      const K2 = 1.75, body2 = polyTris(SW_BODY, 'xz', K2).concat(polyTris(SW_KEEL, 'xy', K2)), wr2 = polyTris(SW_WING, 'xz', K2), wl2 = polyTris(SW_WING.map((p) => [p[0], -p[1]]), 'xz', K2);
      for (let i = 0; i < 3; i++) swallows.push({ body: flats.add(body2, ink), wr: flats.add(wr2, ink), wl: flats.add(wl2, ink), cx: 0, cz: 0, ahead: 0.105 + i * 0.022, off: 20 + i * 9,
        ax: 24 + i * 7, az: 30 + i * 9, w1: (0.34 + i * 0.07) * (i === 1 ? -1 : 1), w2: 0.27 + i * 0.05, w3: 0.42 + i * 0.1, p1: i * 2.1 + 0.4, p2: i * 1.3 + 2.0, p3: i * 2.9, y0: 37 + i * 5 }); }
    await ctx.yield();
    const leaves = [];
    for (const [s, off] of [[78, 17], [MK.sA + 8, -19], [MK.sF + 72, 15]]) { const p = side(s, off);
      leaves.push({ a: flats.add(leafTris(1), ink), b: flats.add(leafTris(-1), dark), x: p.x, z: p.z, yaw: frng.range(0, 6.28), ph: frng.range(0, 6.28) }); }
    // the hen stands 37 m tall. She pecks in the street, in front of the house fronts, where the rut heads straight
    // at the wall (so she and her solid shadow on the whitewash are seen with the frieze face-on), then strides off down
    // the street ahead of us. The chicks are in the whitewash tone (the palette's pale), so that they read against the red
    // earth and the red skirt and are not taken for shadows; their own shadows are ink like every other.
    let hen = null; const chicks = [], HS = 1.8, CS = 2.0, HIP = 7.6 * HS, CHIP = 2.2 * CS;
    if (rare) {
      const col = look.palette[1], pale = look.palette[2];
      hen = { body: flats.add(polyTris(HEN_BODY, 'xy', HS), col), la: flats.add(polyTris(HEN_LEG, 'xy', HS), col), lb: flats.add(polyTris(HEN_LEG, 'xy', HS), col) };
      for (let j = 0; j < 5; j++) chicks.push({ body: flats.add(polyTris(CHICK_BODY, 'xy', CS), pale), la: flats.add(polyTris(CHICK_LEG, 'xy', CS), pale), lb: flats.add(polyTris(CHICK_LEG, 'xy', CS), pale),
        back: -7 + j * 6.5 + frng.range(-1.5, 1.5), x: (j % 2 ? 2.5 : -1.6), ph: frng.range(0, 6.28) });        // round her feet: one runs ahead, the rest close behind
    }
    // a flock of larger birds that comes in from the open yard as we leave the bicycle, wheels in the sky over the two
    // bends (u 0.29-0.47, the sky half of the frame beside the giants) and goes back the way it came
    { const xr = rng.fork('flock'), K3 = 2.3, body3 = polyTris(SW_BODY, 'xz', K3).concat(polyTris(SW_KEEL, 'xy', K3)), wr3 = polyTris(SW_WING, 'xz', K3), wl3 = polyTris(SW_WING.map((p) => [p[0], -p[1]]), 'xz', K3);
      for (let i = 0; i < 6; i++) swallows.push({ body: flats.add(body3, ink), wr: flats.add(wr3, ink), wl: flats.add(wl3, ink), cx: 0, cz: 0, flock: true, ox: xr.range(-26, 26), oz: xr.range(-30, 30),
        ax: xr.range(22, 40), az: xr.range(26, 46), w1: xr.range(0.3, 0.46) * (i & 1 ? 1 : -1), w2: xr.range(0.24, 0.36), w3: xr.range(0.3, 0.6), p1: xr.range(0, 6.28), p2: xr.range(0, 6.28), p3: xr.range(0, 6.28), y0: 44 + i * 4.5 }); }
    flats.finish(); scene.add(flats.object);
    await ctx.yield();

    // ---- dust behind the bus wheels, and the morning mist
    const dust = buildDust(Math.max(16, Math.round(64 * detail * dens)), { value: U.uEarth.value.clone().lerp(U.uWall.value, 0.22) }); scene.add(dust.mesh);
    const mist = look.mist ? buildMist(look.mist, uTime) : null; if (mist) scene.add(mist);
    await ctx.yield();

    // ---- driving it (update() only moves, shows and hides what was made above)
    const eye = new THREE.Vector3(), M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), po = {}, pv = new THREE.Vector3();
    const AXX = new THREE.Vector3(0, 0, 1), AXY = new THREE.Vector3(0, 1, 0), AXZ = new THREE.Vector3(-1, 0, 0);
    const swXZ = (b, t, o) => { let x = b.cx + b.ax * Math.sin(b.w1 * t + b.p1); if (x > 138) x = 138 + 13 * Math.tanh((x - 138) / 13);
      o.x = x; o.z = b.cz + b.az * Math.sin(b.w2 * t + b.p2); return o; };
    const q0 = {}, q1 = {}, q2 = {}, q3 = {};
    function driveSwallows(t, u) {
      for (let i = 0; i < swallows.length; i++) {
        const b = swallows[i];
        if (b.ahead) { hero.pathAt(Math.min(u + b.ahead, 1.04) * LEN, po); b.cx = po.x - Math.sin(po.heading) * b.off; b.cz = po.z + Math.cos(po.heading) * b.off; }
        if (b.flock) { const k = sstep(0.245, 0.305, u) * (1 - sstep(0.47, 0.54, u)); hero.pathAt(Math.min(u + 0.11, 1) * LEN, po);
          b.cx = lerp(-150, po.x - Math.sin(po.heading) * 26, k) + b.ox; b.cz = lerp(330, po.z + Math.cos(po.heading) * 26, k) + b.oz; }
        swXZ(b, t, q0); swXZ(b, t + 0.06, q1); swXZ(b, t + 0.30, q2); swXZ(b, t + 0.36, q3);
        if (b.ahead) { const vx = Math.cos(po.heading) * 15, vz = Math.sin(po.heading) * 15;       // they travel with us: head along the true line of flight
          q1.x += vx * 0.06; q1.z += vz * 0.06; q2.x += vx * 0.30; q2.z += vz * 0.30; q3.x += vx * 0.36; q3.z += vz * 0.36; }
        const h0 = Math.atan2(q1.z - q0.z, q1.x - q0.x), h1 = Math.atan2(q3.z - q2.z, q3.x - q2.x);
        const turn = Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0)), bank = Math.max(-1.1, Math.min(1.1, turn * 2.4));
        let y = b.y0 + 6 * Math.sin(b.w3 * t + b.p3);
        const d = b.ahead || b.flock ? 99 : path.nearestXZ(q0.x, q0.z).dist; y = lerp(y, Math.max(y, 34), sstep(36, 18, d));          // over the rut they keep above the eye
        const climb = 0.5 * Math.cos(b.w3 * t + b.p3) * b.w3;
        M.makeRotationY(-h0); M2.makeRotationZ(climb); M.multiply(M2); M2.makeRotationX(bank); M.multiply(M2); M.setPosition(q0.x, y, q0.z);
        b.body.m.copy(M);
        // flap in bursts, glide between them
        const burst = sstep(-0.2, 0.3, Math.sin(t * 0.9 + i * 2.1)), a = 0.16 + burst * 0.62 * Math.sin(t * 13 + i * 1.7);
        M2.makeRotationX(-a); b.wr.m.multiplyMatrices(M, M2); M2.makeRotationX(a); b.wl.m.multiplyMatrices(M, M2);
      }
    }
    function driveLeaves(t) {
      for (const l of leaves) {
        M.makeRotationY(l.yaw + 0.05 * Math.sin(t * 0.7 + l.ph)); M2.makeRotationX(0.24 * Math.sin(t * 1.3 + l.ph) + 0.09 * Math.sin(t * 3.1 + l.ph * 2)); M.multiply(M2);
        M.setPosition(l.x, 0, l.z); l.a.m.copy(M); l.b.m.copy(M);
      }
    }
    // an upright flat card. Its own space: x forward, y up, z to its left. `yaw` turns its forward from due south (0)
    // toward the wall (+); (fx, sd) shift it in its own space; `ang` tips it about a pivot `py` above its origin
    const M3 = new THREE.Matrix4();
    const card = (m, ox, oy, oz, yaw, fx, sd, ang, py) => { const s = Math.sin(ang), c = Math.cos(ang);
      m.makeRotationZ(ang); m.setPosition(fx + s * py, py - c * py, sd);
      M2.makeRotationY(yaw); M3.makeBasis(AXX, AXY, AXZ); M2.multiply(M3); M2.setPosition(ox, oy, oz); return m.premultiply(M2); };
    // HER LINE: down the street between the rut and the house fronts (never behind a front, a pole or the stick, 17 m
    // from the rut while the bus is near), on past the last house fronts along the wall, close in past the portal's
    // side, and round the wall's far end, where she and the chicks go out of sight behind it. `q` is the distance along
    // that line (it is z as far as the wall's end).
    // (Past z 478 she keeps 4 m out, no more, and is never pushed toward the wall: the street's last toys stand in that
    //  strip now. She is a tall flat card that turns her flank to the eye: 6.5 m and then 5 m more out and pushed 7 m
    //  wallward, her card would pass through the second flat wire tree (156, 543), 3.5 m beyond its forward foot, and
    //  through the last house front (151, 582), 9 m behind its line. As it is she passes 3.8 m and 1.6 m clear of them.)
    const pF = hero.pathAt(MK.sF, {}), rutX = (z) => Math.min(A.portalSeat.position[0], pF.x + Math.max(0, z - pF.z) / Math.tan(A.rutAngle));
    const henX = (z) => Math.min(rutX(z) + 17, 136.5) + 4 * sstep(478, 504, z);
    const END_Q = 706, TURN = 22, hq = {}, cq = {};
    const henLine = (q, o) => {
      if (q <= END_Q) { o.x = henX(q); o.z = q; o.h = 0; return o; }
      const a = Math.min((q - END_Q) / TURN, 1.5708);
      o.x = henX(END_Q) + TURN * (1 - Math.cos(a)) + Math.max(0, q - END_Q - TURN * 1.5708); o.z = END_Q + TURN * Math.sin(a); o.h = a; return o;
    };
    // She pecks where the face-on picture has her (to u 0.575), runs past the bus as we turn down the street, and from
    // 0.665 draws away from us faster and faster: 92 m ahead at 0.70, level with the portal at 0.77, gone round the
    // wall's end by 0.80. She is a flat card, so once we look along the street she turns her flank toward the eye (up
    // to 34 degrees): from the rut she is always a whole bird in profile, never an edge-on sliver, and we never come
    // within two of her heights of her.
    function driveHen(t, u) {
      path.pointAt(u, pv);
      const lead = Math.min(1.25, Math.max(0, (u - 0.665) / 0.135));
      const q = Math.min(840, lerp(356, pv.z + 88, sstep(0.575, 0.665, u)) + 236 * Math.pow(lead, 3.2));
      henLine(q, hq);
      const mv = sstep(0.575, 0.59, u), ph = q * 0.18, bob = 0.8 * mv * Math.abs(Math.sin(ph));
      const bear = Math.atan2(hq.x - eye.x, Math.max(1, hq.z - eye.z));
      const psi = 0.6 * (1 - sstep(0.2, 0.85, bear)) * sstep(0.60, 0.66, u), yaw = Math.max(hq.h, psi), push = 0;
      const pk = Math.max(0, Math.sin(t * 1.3)), peck = (1 - mv) * pk * pk * 0.5;
      const hx = hq.x + push, hz = hq.z;
      card(hen.body.m, hx, bob, hz, yaw, 0, 0, -peck - 0.035 * mv * Math.sin(ph * 2), HIP);
      card(hen.la.m, hx, HIP + bob, hz, yaw, 1.5, 0.15, 0.5 * mv * Math.sin(ph), 0);
      card(hen.lb.m, hx, HIP + bob, hz, yaw, -1.9, -0.15, -0.5 * mv * Math.sin(ph), 0);
      for (let j = 0; j < chicks.length; j++) {
        const c = chicks[j], sc = t * 10 + c.ph;
        henLine(q - c.back + 2.0 * Math.sin(t * 1.25 + c.ph), cq);
        // each chick runs with small hops and, every few seconds, one fluttering jump that throws its shadow up the whitewash
        const jp = Math.max(0, Math.sin(t * 0.8 + c.ph * 2.3)), hop = 0.3 * Math.abs(Math.sin(sc)) + 5.5 * jp * jp * jp * jp;
        const cp = Math.max(0, Math.sin(t * 0.9 + c.ph * 3)), cyaw = Math.max(cq.h, psi);
        const cx = cq.x + push + c.x * Math.cos(cq.h), cz = cq.z - c.x * Math.sin(cq.h);
        card(c.body.m, cx, hop, cz, cyaw, 0, 0, 0.08 * Math.sin(t * 7 + c.ph) - (1 - mv) * cp * cp * 0.6, CHIP);
        card(c.la.m, cx, CHIP + hop, cz, cyaw, 0.5, 0.1, 0.6 * Math.sin(sc), 0);
        card(c.lb.m, cx, CHIP + hop, cz, cyaw, -0.7, -0.1, -0.6 * Math.sin(sc), 0);
      }
    }
    const fr = (x) => x - Math.floor(x);
    function driveDust(t, u) {
      const B = hero.busPose, pres = sstep(0.05, 0.09, u) * B.go, d = dust.data;       // none while it rolls in under us, none once it is held back to a stand (the bus's own state)
      hero.pathAt(u * LEN + 55, po); const tx = Math.cos(po.heading), tz = Math.sin(po.heading);       // puffs are left behind along the line of travel
      for (let i = 0; i < dust.count; i++) {
        const k = i & 3, a = fr(t * 0.7 + i * 0.618), fx = (k < 2 ? -1 : 1) * B.wx, fz = (k & 1 ? 1 : -1) * B.track * (1 + 0.25 * a) + 1.2 * Math.sin(i * 12.9);
        d[i * 4] = B.x + B.dx * fx - B.dz * fz - tx * 19 * a; d[i * 4 + 1] = 0.5 + 8.5 * a * (0.5 + 0.5 * fr(i * 0.37)); d[i * 4 + 2] = B.z + B.dz * fx + B.dx * fz - tz * 19 * a;
        d[i * 4 + 3] = (0.2 + 0.62 * Math.sqrt(a)) * (1 - a * a * a) * pres * (0.55 + 0.6 * fr(i * 0.73));
      }
      dust.at.needsUpdate = true;
    }

    const pq = {}, pg = {}, poiGiant = new THREE.Vector3(), EV = hero.events, GZK = 0.85, GZW = 0.5;
    const poiFace = new THREE.Vector3(), poiStreet = new THREE.Vector3(), poiDraw = new THREE.Vector3(), poiLead = new THREE.Vector3(), poiTmp = new THREE.Vector3(), FACE_Z = 14;
    // in a tall, narrow frame the gaze keeps nearer the bus, so that the whole of it stays inside the frame's width
    const toBus = (v) => { const n = hero.busPose.narrow || 0; return n > 0 ? v.lerp(poiTmp.set(hero.busPose.x, 8, hero.busPose.z), 0.8 * n) : v; };
    return {
      scene, path, duration: 45, title: look.name,
      // a little quicker through the first bend, slowest where the wall stands face-on, unhurried down the street
      pace: (u) => 1 + 0.08 * sstep(0.22, 0.27, u) * (1 - sstep(0.34, 0.40, u)) - 0.36 * sstep(0.44, 0.50, u) * (1 - sstep(0.585, 0.65, u)) - 0.1 * sstep(0.62, 0.68, u) * (1 - sstep(0.80, 0.89, u)) - 0.16 * sstep(0.775, 0.815, u) * (1 - sstep(0.865, 0.9, u)),
      camera: { fov: 62, near: 1, far: 4200, lookAhead: 34, sway: 0.5, bank: 0.4 },
      pois: [
        // through the first bend and down the short line the gaze turns to the open side: the last of the parade, the big
        // cow that keeps ahead of us there, stands whole right of the bus with the file beyond it
        // (as the giraffe walks from its tree to its stand the same gaze goes over to the wall side, to the giant: k is
        //  0.85 times the share of that walk done; giantAt is the giraffe, then the elephant inside the left-hand bend.
        //  It ends at the elephant's event e3: the elephant, were it still at its stand, two thirds of the frame high
        //  and abeam, too large to hold whole; its trunk is down by then and it is walking off.)
        { at: (time, u) => { hero.leadAt(u, pq); hero.giantAt(u, pg); const k = GZK * hero.walkOut(u);
            return toBus(poiLead.set(lerp(pq.x, pg.x, k), lerp(9, 20, k), lerp(pq.z, pg.z, k))); }, from: 0.165, to: EV.e3 / LEN, weight: 0.4, fade: 0.15 },
        // ... held on the giant from the giraffe's reaching its stand (its event g5) until the same e3
        { at: (time, u) => { hero.giantAt(u, pg); return poiGiant.set(pg.x, 20, pg.z); }, from: EV.g5 / LEN, to: EV.e3 / LEN, weight: GZW, fade: 0.3 },
        // ... then the wall almost abeam, held while the rut heads straight at it and on into the bend away: the frieze face-on
        { at: (time, u) => { path.pointAt(u, pv); return poiFace.set(A.wallX, 36, pv.z + FACE_Z); }, from: 0.455, to: 0.635, weight: 0.6, fade: 0.28 },
        // ... and down the street again for the flyer and the hoop
        { at: (time, u) => { path.pointAt(u, pv); return poiStreet.set(A.wallX - 8, 30, Math.min(pv.z + 125, 610)); }, from: 0.61, to: 0.84, weight: 0.4 },
        // ... and the wall beside our own bus: its drawing and the rod's line among the street's on the whitewash; as the
        // bus leaves the wall's foot the gaze goes with it (b.gone), and the pull ends where the bus is let go: where
        // its own state `go` first falls below 1 (hero.busLetGo, an arc length found in build from the bus's own rule)
        { at: (time, u) => { path.pointAt(u, pv); const b = hero.busPose, k = b.gone; return poiDraw.set(lerp(A.wallX, b.x, k), lerp(18, 28, k), Math.max(b.z - 4, pv.z + 26)); },
          from: 0.765, to: hero.busLetGo / LEN, weight: 0.6, fade: 0.24 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.5, revealDistance: 330 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      _belt: ctx.keepLines ? hero.belt : undefined,
      _debug: ctx.keepLines ? { ...hero.debugLines, uniforms: U, sky: look.palette[3], flats: flats.parts, marks: MK } : undefined,
      update(dt, t, camera, u) {
        uTime.value = t;
        eye.setFromMatrixPosition(camera.matrixWorld);
        sky.position.copy(eye);
        hero.setProgress(u); hero.update(dt, t, camera);
        carried.visible = u > 0;                       // never carried while seen through the previous portal
        if (mist) mist.material.uniforms.uEye.value.copy(eye);
        driveSwallows(t, u); driveLeaves(t); if (hen) driveHen(t, u);
        flats.update();
        driveDust(t, u);
      },
      dispose() { hero.dispose(); dust.base.dispose(); },
    };
  },
};
