// The Temple of Artemis at Ephesus, the later temple, whole, about 150 BC: the hero part of the world temple-of-artemis.
// Procedural geometry only, built from the words and measures of design/sw/briefs/temple-of-artemis.json.
// VERSION 63 (by the crew's own count of versions; live's file carries no number).
// ROUND r11, IN ONE LINE: THE BYTES ARE LIVE'S (world md5 372e25a8ccabb8c8a62d46bcf42b672b, part md5 7ebbbd3fb74fec7f933ffbbc297dcd1e) AND FROM ROUND r10u (world md5 931076f136dc07d50016e6f8d084483b, part md5 298f43712b482e8115e6c56a2c1c9108) CAME THREE THINGS BY PLACE AND NOTHING ELSE: THE ALTAR COURT as rebuilt and THE FORECOURT (its many-sided paving; the knots of people before the court's open side), both in the world's file, and THE FLOOR'S LIGHT UNDER THE ROOF, on the floor alone, in this file.
// NO GEOMETRY LINE DIFFERS FROM LIVE'S: the great door, its leaves and studs, the sixteen shields, the walls, the roof
// and every built array are live's to the last bit. What differs: in the marble's shader (MARBLE_F3) one new line that makes the floor's factor and the three lines that take it (the gain, new; the two companion lines, each changed in one term), its program cache key, and these words.
// THE FLOOR'S LIGHT UNDER THE ROOF (r10u's one law, ours): the sun's own light on the temple's floor under the roof counts 2.2 times, eased in over the first 3 m inside the
// eaves' line (no light is added: the sun's light on the floor is scaled where the sun's map lets it fall), and the floor takes none of its own thrown light (the lanes'
// warm light and the bounce under the roof): its shadows lie cool and deep between the bands of sun.
// THE BOUND, IN ONE SENTENCE: each of the three lines takes one factor, aFl, which is exactly 1 on the temple's floor (the only thing built with kind 3 and roughness 0.4, level at 2.88 m) and exactly 0 on every other face, so that on every other face (the plinths' tops, the bases' mouldings, the shafts, the door's leaves, studs, ledges, shoe and sill, the walls, the ceilings) the shader's arithmetic is live's term for term.
// THE AISLES' FLOOR CHANGES TOO (one floor, one law): the temple's floor under the roof, the aisles' with the porch's, takes this light with its easing and its two companion lines, bounded to the floor's own kind and level; every other face under the roof keeps live's arithmetic term for term.
// The law goes by the place and the face alone: nothing in it asks the camera, the seed, the clock or a picture. OURS, typed figures, in no caption: the gain's 2.2, its 3 m of easing and the two companion lines.
// OF THE THINGS ROUND r10u NAMED INVENTED AT THIS FILE'S HEAD (its nine shields, its walls' coping course and coursed joints, its great door's leaves, its ring handle) NONE COMES: this file's door, shields and walls are live's.
// Seam: design/sw/notes/artemis-interface.md. Origin: on the forecourt (y 0), on the long axis, under the centres of the
// FRONT row of columns; +X from the front to the back, +Z to the right hand of one walking in, +Y up.
// The temple NEVER VARIES: it is the same on every seed. The part draws NOTHING from ctx.rng; what it deals (which
// figure stands where on the carved feet; where within a hand's breadth an offering of the second row or the wall
// row stands in the court and what lies on it; the leaves of the boughs) comes from fixed named streams:
// 'artemis-carved-feet', 'artemis-court-<kind>', 'artemis-court-branch-<n>', 'artemis-court-shields',
// 'artemis-court-hangings'.
// Nothing is chosen by the quality's detail, and nothing by where the camera is.
// opts: sunDir, sunColor (the world's sun), fill (scales the part's own soft sky light; in the court it scales the
// sky's share only, not the sun's light thrown back there),
// well (scales THE LIGHT IN THE WELL, the open court's own shade by place: the sky its mouth leaves, the walls' faint
// light to one another, warm light thrown back from its sunlit wall, its blade and the shrine's front; 0 switches it
// off; the sun's own edge in the well is always taken from the rim), glow ({ at: [x, y, z], color, reach: metres,
// strength: { value } }: a light of the world's in the court that the sun's shade does not touch; the world sets
// strength.value; info.glow says the part takes it), roofed (the share of the sky under the roof, 0.45), shadowSoft (the width in metres of
// the soft edge the world's sun map gives a shadow, 0.3: the door leaves' caster keeps that far outside the door's
// opening). opts {} works.
// SHADOWS: the detailed meshes only RECEIVE; plain forms set a little inside the true surfaces (drawn with no colour
// and no depth written) CAST. So a low sun cannot stripe the shafts, and the shadow pass costs few triangles.
import * as THREE from 'three';

// ---------- the fixed measures (design: "temple") ----------
const FLOOR = 2.88, COURT = 0.18, EAVES = 23.9, RIDGE = 31.7, HALF = 25.5, SLOPE = (RIDGE - EAVES) / HALF;
// the column: 17.65 m from the floor to the top of the capital; plinth 2.62 by 0.40; shaft 1.84 at the foot, 1.46 at the top
const COL_H = 17.65, PLINTH_HALF = 1.31, PLINTH_H = 0.40, R_FOOT = 0.92, R_TOP = 0.73, FLUTES = 24;
// the carved feet: a cube pedestal 1.83 high and 1.85 wide on the plinth, a drum 1.83 high and 1.84 across on the cube
const PED_HALF = 0.925, PED_TOP = PLINTH_H + 1.83, DRUM_TOP = PED_TOP + 1.83;
// the platform, the steps, the walls, the door, the court, the shrine
const TOP = [-5.3, 106.9, -28.63, 28.63], FOOT = [-12.9, 114.5, -36.5, 36.5], NSTEP = 14, RISE = FLOOR / NSTEP;
const WALL_Z = 11.55, WALL_T = 1.95, WALL_IN = WALL_Z - WALL_T / 2, WALL_OUT = WALL_Z + WALL_T / 2, WALL_X0 = 12.0, WALL_X1 = 90.16;
const DOOR_X0 = 31.86, DOOR_X1 = 33.82, DOOR_HALF = 3.1, DOOR_TOP = FLOOR + 14.0;
const CRT_X0 = 33.82, CRT_X1 = 80.46, CRT_HALF = 10.57, CRT_TOP = 27.9;
const STAIR_X1 = 40.1, STAIR_HALF = 6.0;
const SHRINE = { x: 58.8, z: 0, halfX: 2.485, halfZ: 2.97, eaves: 5.38, ridge: 6.78 };
// the roof's outline (as roofY has it) and the upper work: 3.37 m from the capitals' tops to the gutter's lip
const ROOF_X0 = -1.5, CAP_TOP = FLOOR + COL_H, BEAM_H = 1.17;

function columnList() {
  const xs = [0, 6, 12]; for (let i = 1; i <= 15; i++) xs.push(12 + 5.2107 * i); xs.push(96.16, 102.16);
  const zf = [-23.895, -17.735, -11.575, -4.375, 4.375, 11.575, 17.735, 23.895];
  const zb = [-23.895, -17.735, -11.823, -5.912, 0, 5.912, 11.823, 17.735, 23.895];
  const seen = new Set(), out = [];
  const put = (x, z, r, carved) => { const k = x.toFixed(2) + '/' + z.toFixed(2); if (seen.has(k)) return; seen.add(k); out.push([x, z, r, carved]); };
  for (const z of zf) { put(0, z, 0.92, true); put(6, z, 0.92, true); }
  for (const x of [12, 17.2107, 22.4214, 27.6321]) for (const z of [-4.375, 4.375]) put(x, z, 0.92, true);
  for (const x of xs.slice(2, -2)) for (const z of [-23.895, -17.735, 17.735, 23.895]) put(x, z, 0.92, false);
  for (const z of zb) { put(102.16, z, 0.92, false); put(96.16, z, 0.92, false); }
  return out;
}

function roofY(x, z) {
  const az = Math.abs(z), plane = EAVES + (HALF - az) * SLOPE;
  if (x < -1.5 || x > 104 || az > HALF) return -1;
  if (x > 33.82 && x < 80.46 && az < 10.57) return -1;
  return plane;
}

// ---------- a small geometry builder: flat arrays, linear vertex colours, a joint attribute for the marble shader ----------
// jt = (kind, course height, block length, roughness): kind 0 plain, 1 ashlar on upright faces and slabs on level ones,
// 2 drum joints (level joints only)
function makeG() {
  const P = [], N = [], C = [], J = [], I = [], T2 = [];
  let n = 0, col = [1, 1, 1], jt = [0, 0, 0, 0.7], tu = 0, tv = 0;
  const g = {
    col(c) { col = c; return g; },
    jt(k, h, l, r) { jt = [k, h, l, r]; return g; },
    uv(u, v) { tu = u; tv = v; return g; },
    get count() { return n; }, get triangles() { return I.length / 3; },
    v(x, y, z, nx, ny, nz, c) { const cc = c || col; P.push(x, y, z); N.push(nx, ny, nz); C.push(cc[0], cc[1], cc[2]); J.push(jt[0], jt[1], jt[2], jt[3]); T2.push(tu, tv); return n++; },
    tri(a, b, c) { I.push(a, b, c); },
    // a flat four-sided face, corners counter-clockwise as seen from outside
    quad(a, b, c, d, ca, cb, cc, cd) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i = g.v(a[0], a[1], a[2], nx, ny, nz, ca); g.v(b[0], b[1], b[2], nx, ny, nz, cb || ca); g.v(c[0], c[1], c[2], nx, ny, nz, cc || ca); g.v(d[0], d[1], d[2], nx, ny, nz, cd || ca);
      I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    },
    tri3(a, b, c) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i = g.v(a[0], a[1], a[2], nx, ny, nz); g.v(b[0], b[1], b[2], nx, ny, nz); g.v(c[0], c[1], c[2], nx, ny, nz); I.push(i, i + 1, i + 2);
    },
    // an upright box; faces: any of x X y Y z Z (small letter: the face at the low end of that axis)
    box(x0, y0, z0, x1, y1, z1, faces = 'xXyYzZ', inv = false) {
      const q = inv ? (a, b, c, d) => g.quad(a, d, c, b) : (a, b, c, d) => g.quad(a, b, c, d);
      if (faces.includes('X')) q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
      if (faces.includes('x')) q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      if (faces.includes('Y')) q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
      if (faces.includes('y')) q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      if (faces.includes('Z')) q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
      if (faces.includes('z')) q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
      return g;
    },
    // a profile [(out, y), ...] from the bottom up, swept round a rectangle [x0, x1, z0, z1] with mitred corners.
    // dir +1: the faces look outward and "out" widens the rectangle; dir -1: they look inward (the walls of a well).
    // sides: any of W E N S (low x, high x, low z, high z). smooth: round the profile's normals.
    ring(rect, prof, o = {}) {
      const dir = o.dir || 1, sides = o.sides || 'WENS', sm = !!o.smooth, m = prof.length, pn = [];
      for (let i = 0; i < m; i++) {
        let ax = 0, ay = 0;
        for (const k of [i - 1, i]) { if (k < 0 || k >= m - 1) continue; const dx = prof[k + 1][0] - prof[k][0], dy = prof[k + 1][1] - prof[k][1], l = Math.hypot(dx, dy) || 1; ax += dy / l; ay += -dx / l; }
        const l = Math.hypot(ax, ay) || 1; pn.push([ax / l, ay / l]);
      }
      const [x0, x1, z0, z1] = rect;
      const pt = (s, e, i) => { const q = prof[i][0] * dir, y = prof[i][1];
        if (s === 'W') return [x0 - q, y, e ? z1 + q : z0 - q]; if (s === 'E') return [x1 + q, y, e ? z1 + q : z0 - q];
        if (s === 'N') return [e ? x1 + q : x0 - q, y, z0 - q]; return [e ? x1 + q : x0 - q, y, z1 + q]; };
      const nr = (s, i) => { const a = pn[i][0] * dir, b = pn[i][1]; return s === 'W' ? [-a, b, 0] : s === 'E' ? [a, b, 0] : s === 'N' ? [0, b, -a] : [0, b, a]; };
      for (const s of sides) {
        const flip = ((s === 'W' || s === 'S') ? 1 : -1) * dir;
        for (let i = 0; i < m - 1; i++) {
          const A0 = pt(s, 0, i), B0 = pt(s, 1, i), A1 = pt(s, 0, i + 1), B1 = pt(s, 1, i + 1);
          if (!sm) { if (flip > 0) g.quad(A0, B0, B1, A1); else g.quad(B0, A0, A1, B1); continue; }
          const n0 = nr(s, i), n1 = nr(s, i + 1);
          const a = g.v(A0[0], A0[1], A0[2], n0[0], n0[1], n0[2]), b = g.v(B0[0], B0[1], B0[2], n0[0], n0[1], n0[2]);
          const c = g.v(B1[0], B1[1], B1[2], n1[0], n1[1], n1[2]), d = g.v(A1[0], A1[1], A1[2], n1[0], n1[1], n1[2]);
          if (flip > 0) I.push(a, b, c, a, c, d); else I.push(b, a, d, b, d, c);
        }
      }
      return g;
    },
    build(o = {}) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
      geo.setAttribute('jt', new THREE.BufferAttribute(new Float32Array(J), 4));
      if (o.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(T2), 2));
      geo.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(I), 1) : new THREE.BufferAttribute(new Uint16Array(I), 1));
      return geo;
    },
  };
  return g;
}

// ---------- the marble: one patched standard material for every stone surface ----------
// White with a bluish cast. Fine joints (ashlar courses, floor slabs, the drums of a shaft) drawn from the place of the
// face itself, a tone of its own for every block, a faint cloud and thin grey veins; flutes by shading on the far
// shafts; a soft light from the bright sky round the sun and a cool one from the sky away from it, so that shafts
// in shade keep their form. In the open court: walls of laid blocks, an old floor of worn slabs of two stones, the
// sun where the rim lets it in and the well's own shade (see MARBLE_F1, MARBLE_F3). All of it reads the part's own
// coordinates only.
const MARBLE_V0 = `
attribute vec4 jt; uniform float uTime;
varying vec4 vJt; varying vec3 vLP; varying vec3 vOP; varying vec3 vLN; varying vec2 vInst; varying vec3 vRad;
#ifdef ARTEMIS_RELIEF
attribute vec3 aRel; varying vec2 vRc; varying vec2 vRm;
#endif
`;
const MARBLE_V1 = `
// kind 11: wool and leaves that hang; they stir a little, jt.y says how far (nothing where the thing is fastened)
if (jt.x > 10.5 && jt.x < 11.5) {
  // a closed motion: every term comes round again after eight seconds
  transformed.x += jt.y * (0.055 * sin(uTime * 0.7854 + position.z * 1.9 + position.x * 1.3 + position.y * 0.7) + 0.022 * sin(uTime * 1.5708 + position.z * 4.3 + position.x * 2.9 + 1.3));
  transformed.z += jt.y * 0.018 * sin(uTime * 2.3562 + position.y * 2.1 + position.x * 0.9);
}
vOP = position; vJt = jt;
vec4 aLP = vec4(transformed, 1.0); vec3 aLN = normal; vInst = vec2(0.0);
#ifdef USE_INSTANCING
aLP = instanceMatrix * aLP; aLN = mat3(instanceMatrix) * aLN; vInst = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
#endif
vLP = aLP.xyz; vLN = aLN;
// a shaft's plain round normal (the flutes forgotten), for where a flute is thinner than a pixel
vec3 aRd = vec3(position.x, 0.02 * length(position.xz), position.z);
#ifdef USE_INSTANCING
aRd = mat3(instanceMatrix) * aRd;
#endif
vRad = normalMatrix * aRd;
#ifdef ARTEMIS_RELIEF
vRc = vec2(uv.x + aRel.x, uv.y); vRm = aRel.yz;
#endif
`;
const MARBLE_F0 = `
varying vec4 vJt; varying vec3 vLP; varying vec3 vOP; varying vec3 vLN; varying vec2 vInst; varying vec3 vRad;
uniform vec3 uSunDir; uniform vec3 uWarm; uniform vec3 uCool; uniform vec3 uSheen; uniform vec3 uBounce;
uniform vec4 uWell; uniform vec3 uWellAmb; uniform vec3 uWellAt; uniform vec4 uBlade; uniform vec3 uBladeC; uniform vec3 uShrC; uniform vec3 uBandC; uniform vec3 uLaneC; uniform vec2 uLaneX; uniform float uRoofed;
#ifdef ARTEMIS_GLOW
uniform vec3 uGlowAt; uniform vec3 uGlowCol; uniform float uGlowR; uniform float uGlowK;
#endif
#ifdef ARTEMIS_RELIEF
uniform sampler2D uRelief; varying vec2 vRc; varying vec2 vRm;
// where a point of a carved field lies in the sheet. rc: across in fields (a drum's round is two, a pedestal's four
// faces are four) and up (0 to 1); ped, db: 1 on a pedestal, 1 on the second drum; mir: -1 where the field is mirrored
vec2 aRelUv(vec2 rc, float ped, float db, float mir) {
  float cell = floor(rc.x), fr = rc.x - cell, e = mix(0.0015, 0.003, ped);
  fr = mir < 0. ? 1. - fr : fr;
  return vec2(db * 0.5 + (mod(cell, mix(1., 4., ped)) + clamp(fr, e, 1. - e)) * mix(0.5, 0.25, ped), ped * 0.5 + clamp(rc.y, 0.003, 0.997) * 0.5);
}
#endif
float aH2(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float aH3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float aN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(aH3(i), aH3(i + vec3(1,0,0)), f.x), mix(aH3(i + vec3(0,1,0)), aH3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(aH3(i + vec3(0,0,1)), aH3(i + vec3(1,0,1)), f.x), mix(aH3(i + vec3(0,1,1)), aH3(i + vec3(1,1,1)), f.x), f.y), f.z); }
vec3 aNrm(vec3 v){ return v / max(length(v), 1e-6); }
float aLine(float d, float aa, float w){ aa = max(aa, 1e-5); return (1. - smoothstep(w, w + aa, d)) * clamp(2.5 * w / aa, 0.12, 1.); }
// THE PAINTED CHAIN under the court's crown (ours, by the custom of the order: nothing is known of this wall's top):
// a palmette of seven leaves and a lotus by turns on one running stem, a fillet over them and a line under them.
// p: along and up, in the band's heights (one palmette and one lotus take 1.6 of them); aa: a pixel in that measure.
// Gives how far the point is covered by dark blue, by red and by gilt
vec3 aChain(vec2 p, float aa) {
  float x = fract(p.x / 1.6) * 1.6, y = p.y, s = clamp(aa * 22., 0.06, 1.), t = clamp(aa, 0.008, 0.2);
  vec2 d = vec2(x - 0.4, y - 0.2); float r = length(d), th = atan(d.x, d.y), kf = clamp(floor(th / 0.5 + 0.5), -3., 3.), R = 0.62 - 0.07 * abs(kf);
  float e = (r - 0.09 - 0.5 * R) / (0.5 * R), w = (th - kf * 0.5) * r / 0.094, leaf = 1. - smoothstep(1. - s, 1. + s, e * e + w * w), odd = mod(kf + 4., 2.);
  vec2 l = vec2(x - 1.2, y); float ax = abs(l.x);
  float bud = 1. - smoothstep(1. - s, 1. + s, (l.x * l.x) / 0.0105 + (l.y - 0.5) * (l.y - 0.5) / 0.09);
  float sep = (1. - smoothstep(0.06 - t, 0.06 + t, abs(length(vec2(ax - 0.36, l.y - 0.24)) - 0.33))) * step(0.24, l.y) * step(ax, 0.36);
  float stem = 1. - smoothstep(0.028 - t, 0.028 + t, abs(y - 0.13 + 0.05 * cos(7.853982 * x)));
  float hearts = 1. - smoothstep(0.085 - t, 0.085 + t, min(r, length(vec2(l.x, l.y - 0.2))));
  float top = (1. - smoothstep(0.04 - t, 0.04 + t, abs(y - 0.925))), foot = (1. - smoothstep(0.03 - t, 0.03 + t, abs(y - 0.045)));
  vec3 c = vec3(max(max(leaf * odd, sep), max(stem, foot)), max(max(leaf * (1. - odd), bud), top), 0.);
  c = mix(c, vec3(0., 0., 1.), hearts);
  // (where a leaf is thinner than a pixel the band is its mean tone)
  return mix(c, vec3(0.27, 0.2, 0.02), smoothstep(0.07, 0.2, aa));
}
`;
// THE WAY'S ROW (ours): the great bronzes that flank the middle way on the old floor, one in the middle of each of the
// floor's bands from the first band past the stair's foot to the last before the shrine's steps, and four more on
// the same line behind the shrine, in every second band to the east wall; WAY_Z from the long axis on either side:
// [x, kind, height over the old floor]. The marble's shader throws their shadows from these same measures
// (wayShade): what stands and what is shaded are one thing.
const WAY_Z = 2.9, WAY = [[42.55, 'tripod', 2.7], [44.85, 'incense', 2.3], [47.15, 'tripod', 2.7], [49.45, 'incense', 2.3], [51.75, 'tripod', 2.7],
  [63.25, 'jar', 1.95], [67.85, 'incense', 2.5], [72.45, 'tripod', 2.6], [77.05, 'tripod', 2.9]];
// Their turned profiles, [radius, height, 1 where the inside is dark, 2 in a hollow where the green stands, 3 on a
// level lip that hands have worn bright].
// A great tripod's cauldron (H: the top of its two ring handles; the rim is 0.3 m lower); its three legs stand
// WAY_LEG[0] from its middle at the floor and WAY_LEG[1] at their heads, 4 cm under the rim.
const WAY_LEG = [0.62, 0.57];
const wayBowl = (H) => { const r = H - 0.3; return [[0.05, r - 0.57], [0.26, r - 0.51], [0.42, r - 0.39], [0.52, r - 0.21], [0.55, r - 0.07], [0.535, r - 0.035, 2], [0.58, r, 3], [0.53, r, 3], [0.47, r - 0.09, 1], [0.2, r - 0.32, 1]]; };
// a tall incense stand: a spreading foot, a stem with two knops, a dish, a pointed lid
const wayStand = (H) => [[0.36, 0], [0.36, 0.05], [0.2, 0.12], [0.085, 0.3, 2], [0.055, 0.5], [0.05, H * 0.4 - 0.05], [0.105, H * 0.4], [0.05, H * 0.4 + 0.05], [0.045, H * 0.64 - 0.05], [0.095, H * 0.64], [0.045, H * 0.64 + 0.05], [0.04, H - 0.55, 2], [0.08, H - 0.48], [0.27, H - 0.36], [0.31, H - 0.3, 3], [0.31, H - 0.27, 3], [0.23, H - 0.26, 1], [0.18, H - 0.15], [0.075, H - 0.06], [0.09, H - 0.03], [0, H]];
// a great bronze jar with a wide mouth, on a square plinth of old stone WAY_PLINTH high (H: the lip)
const WAY_PLINTH = 0.25;
const wayJar = (H) => [[0.3, 0], [0.3, 0.04], [0.2, 0.09], [0.16, 0.17, 2], [0.21, 0.25], [0.3, 0.37], [0.45, 0.61], [0.52, 0.85], [0.5, 1.05], [0.4, 1.25], [0.34, 1.33, 2], [0.335, 1.47, 2], [0.42, 1.62], [0.5, 1.7], [0.44, 1.7], [0.3, 1.53, 1]].map((p) => [p[0], WAY_PLINTH + p[1] * (H - WAY_PLINTH) / 1.7, p[2]]);
// a number as the shader reads it
const gl = (v) => { const t = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(t) ? t : t + '.'; };
// the shader's lines for the row's shadows: for each thing, its half width at each height (from its profile as far as
// the profile rises; a tripod's stretchers as a bar across, its legs as lines)
function wayShade() {
  let out = '';
  for (const [x, kind, H] of WAY) {
    const rim = H - 0.3, hm = 0.42 * rim, lean = (WAY_LEG[0] - WAY_LEG[1]) / (rim - 0.04), wide = 0.866 * (WAY_LEG[0] - lean * hm);
    const prof = kind === 'tripod' ? [[-1, 0], [-1, hm - 0.03], [wide, hm - 0.02], [wide, hm + 0.02], [-1, hm + 0.03], [-1, rim - 0.58], ...wayBowl(H)] : kind === 'jar' ? [[0.45, 0], [0.45, WAY_PLINTH], ...wayJar(H)] : wayStand(H);
    let chain = '', last = prof[0];
    for (let i = 1; i < prof.length && prof[i][1] >= last[1]; i++) { const p = prof[i];
      if (p[1] - last[1] > 1e-4) chain += `${chain ? 'else ' : ''}if (h < ${gl(p[1])}) r = ${gl(last[0])} + ${gl((p[0] - last[0]) / (p[1] - last[1]))} * (h - ${gl(last[1])}); `;
      last = p; }
    out += `    if (vLP.x > ${gl(x + 0.75)}) { float t = (${gl(x)} - vLP.x) / sx; vec3 q = vLP + s * t; float dz = abs(abs(q.z) - ${gl(WAY_Z)}), h = q.y - ${gl(COURT)};
      if (dz < 0.9 && h < ${gl(last[1] + 0.4)}) { float fz = max(fq, 1e-4) + 0.0093 * t, r = ${gl(last[0])}; ${chain}
        float sh = clamp(0.5 + (r - dz) / fz, 0., 1.) * min(1., 2. * max(r, 0.) / fz);` + (kind === 'tripod' ? `
        sh = max(sh, step(h, ${gl(rim - 0.04)}) * min(1., 0.07 / fz) * max(clamp(0.5 + (0.035 - dz) / fz, 0., 1.), clamp(0.5 + (0.035 - abs(dz - ${gl(0.866 * WAY_LEG[0])} + ${gl(0.866 * lean)} * h)) / fz, 0., 1.)));` : '') + `
        aSun *= 1. - sh * (1. - smoothstep(-1., 1., (h - ${gl(last[1])}) / (0.75 * max(fh, 1e-4) + 0.0047 * t))); } }
`;
  }
  return out;
}
// after color_fragment: joints, the block's own tone, cloud and veins
// THE SHIELDS on the court's long walls (ours): the first one's place along the wall, the step from one to the next,
// how many, their middle's height. The marble's shader lays each one's soft shade on the wall by these same measures
const SH_X0 = 37.61, SH_DX = 5.58, SH_N = 8, SH_Y = 7.45;
const MARBLE_F1 = `
// the size of a pixel on this face, in metres, whichever way the face is turned (from screen derivatives only)
vec3 aVd = aNrm(vViewPosition), aDv = dFdx(vViewPosition);
float pix = length(aDv - aVd * dot(aDv, aVd));
// how far a shaft's flutes (0.2 m wide) have sunk under the pixel: 0 seen whole, 1 gone
float aFar = smoothstep(0.035, 0.11, pix);
// the open court, a well between four walls: 1 inside it, by the part's own measures; aOld: 1 on its old floor
float aWell = step(33.8, vLP.x) * step(vLP.x, 80.48) * step(abs(vLP.z), 10.59), aOld = 0.0;
// aFine: 1 on the faces of the court's own walls; aBand: how far above the rim's shade line this point stands (0 at the line, 1 from 3 m over it)
float aFine = 0.0, aBand = 0.0, aGlow = 0.0;
// THE SUN IN THE WELL, from the building's own measures and the sun's direction alone. Does the straight line from this
// point toward the sun clear the court's rim (the lips of the long walls' cornices at 28.2, the raking copings of the
// two gable walls), or pass out through the great door's clear opening and under the front beam? 1: the sun reaches
// this point, 0: it stands in shade; the edge between is as sharp as a pixel.
// (aRim: 1 where it comes over the rim, so that no column can stand between)
float aSun = 1.0, aRim = 0.0;
// (The block below runs for EVERY picture element, in the well or not, and its results are taken by aWell at its
// end: its screen derivatives (of m, msh and of the place) so stand in plain flow. Taken inside a branch on the
// place they are not settled along an edge where the next element lies outside the well, and one render of the
// same still could differ from the next by an element there)
{
  vec3 s = uSunDir; float sx = abs(s.x) < 1e-4 ? 1e-4 : s.x, sz = abs(s.z) < 1e-4 ? 1e-4 : s.z;
  // (a sun on the long axis comes over the west or the east rim and over neither long wall's)
  float tx = max(((sx < 0. ? 34.42 : 79.86) - vLP.x) / sx, 0.), tz = abs(s.z) < 2e-3 ? 1e9 : max(((sz > 0. ? 9.77 : -9.77) - vLP.z) / sz, 0.);
  vec3 e = vLP + s * min(tx, tz);
  float clr = e.y + 0.03 - (tx < tz ? 23.92 + (25.5 - min(abs(e.z), 10.57)) * 0.30588 : 28.2);
  vec3 d1 = vLP + s * ((33.82 - vLP.x) / sx), d2 = vLP + s * ((31.86 - vLP.x) / sx);
  float dr = min(min(3.1 - abs(d1.z), 3.1 - abs(d2.z)), min(min(d1.y - 2.91, 16.88 - d2.y), 20.53 - (vLP.y + s.y * (-0.74 - vLP.x) / sx)));
  // (a point within the 0.8 m that a long wall's cornice stands into the court: the line toward the sun runs under
  // that cornice as long as it stays within that width; if it has risen to the cornice's underside, at 27.36, before
  // it comes out from under it or passes the west rim, it ends there: so the east wall's two edges stand in shade)
  float un = abs(vLP.z) - 9.77, cl2 = un > 0. ? min(clr, 27.36 - vLP.y - s.y * min(un / max(-s.z * sign(vLP.z), 1e-4), tx)) : clr;
  float m = max(cl2, sx < 0. ? dr : -1.);
  aSun = smoothstep(-1., 1., m / max(fwidth(m) * 0.75, 1e-4)); aRim = clamp(cl2 * 4.0, 0., 1.); aBand = smoothstep(0., 3.0, clr); aGlow = exp(min(clr, 0.) / 5.0);
  // the old shrine stands in the blade and throws its own shadow behind it: the line toward the sun at three places
  // within the shrine's length behind its curtain, against its section (its width, its two roof slopes)
  if (sx < 0.) {
    float xe = min(vLP.x - 0.3, 61.285), msh = -1.;
    for (int k = 0; k < 3; k++) {
      vec3 q = vLP + s * ((mix(56.9, xe, float(k) * 0.5) - vLP.x) / sx);
      msh = max(msh, min(3.17 - abs(q.z), 6.78 - abs(q.z) * 0.4416 - q.y));
    }
    aSun *= 1. - step(57.2, vLP.x) * smoothstep(-1., 1., msh / max(fwidth(msh) * 0.75, 1e-4));
  }
  // THE WAY'S ROW of great bronzes (tripods, incense stands and great jars on either side of the middle way) stands
  // in the width of the door's light and throws long shadows down the blade, on the shrine's steps, on one another
  // and, behind the shrine where the sun comes over its roof, on the east wall's foot: where the line toward the sun
  // passes a thing's place, is it within the thing's section there? The edge softens with the distance from the
  // thing, as the sun's own width makes it.
  if (sx < 0.) {
    vec3 fw = fwidth(vLP); float fq = fw.z + abs(s.z / sx) * fw.x, fh = fw.y + abs(s.y / sx) * fw.x;
${wayShade()}  }
  aSun = mix(1., aSun, aWell); aRim *= aWell; aBand *= aWell; aGlow *= aWell;
}
// THE DOOR LEAVES' HEEL POSTS shade the door wall's face close behind them (the leaves' caster sheet leaves the posts
// and each leaf's first stretch out). A point of the stone beside a jamb, outside the opening, stands in shade where
// the line from it toward the sun passes through the post's round (0.16 m about 31.70, 3.26 from the axis) or the
// leaf's first stretch beyond it (a round of 0.14 m a hand's breadth along the leaf). By the leaf's own measures.
// (The jamb's own face, turned to the axis, is not behind the post and is left out.)
float aPost = 0.0;
if (vJt.x < 9.5 && abs(vLP.x - 31.6) < 0.4 && abs(abs(vLP.z) - 3.45) < 0.36 && vLP.y < 16.9 && abs(vLN.z) < 0.7 * length(vLN)) {
  vec2 sp = vec2(uSunDir.x, uSunDir.z * sign(vLP.z)) / max(length(uSunDir.xz), 1e-4), c1 = vec2(31.70, 3.26) - vec2(vLP.x, abs(vLP.z)), c2 = c1 + vec2(-0.168, 0.109);
  // (the shade's edge is a finger soft and lies behind the post; the post's round is taken a finger wider than it
  // is, 0.18 m, so that the wall's arris at the jamb, which the post touches, is not left as a lit thread)
  float fp = 0.012;
  aPost = max(step(0., dot(c1, sp)) * clamp(0.5 + (0.18 - abs(c1.x * sp.y - c1.y * sp.x)) / fp, 0., 1.), step(0., dot(c2, sp)) * clamp(0.5 + (0.14 - abs(c2.x * sp.y - c2.y * sp.x)) / fp, 0., 1.));
}
{
  float kind = vJt.x; vec3 p = vLP; vec3 an = abs(aNrm(vLN));
  float ch = max(vJt.y, 0.05), bl = max(vJt.z, 0.05);
  vec3 fwp3 = fwidth(p);
  float sideX = step(an.z, an.x), runW = mix(p.x, p.z, sideX), frW = mix(fwp3.x, fwp3.z, sideX);
  float joint = 0.0, ground = 0.0, lift = 0.0, ashlar = 0.0, draft = 0.0, blkFar = 0.0; vec2 blk = vec2(0.0); vec3 paint = vec3(0.0);
  // old work (the small shrine): low courses of a rougher stone; the court's fine walls: high courses inside the well
  float oldK = step(0.5, kind) * (1. - step(1.5, kind)) * (1. - step(0.5, ch)) * step(0.7, vJt.w);
  if (kind > 0.5 && kind < 1.5) {
    // every course has blocks of its own length (two thirds of bl to the whole of it) and its own start: the upright
    // joints break from course to course
    // (the court's own walls, cwK: between their moulded foot and the string course stands one course of upright
    // slabs, 1.74 m high and 1.22 m wide, with no level joint in it)
    // (and under the crown, from the string course at 24.96 to the crown's band at 26.28, one plain band of tall
    // slabs 1.86 m wide, with no level joint in it either)
    float cwK = aWell * step(0.5, ch), orth = cwK * step(0.79, p.y) * step(p.y, 2.55) * step(an.y, 0.7), tall = cwK * step(24.96, p.y) * step(p.y, 26.28) * step(an.y, 0.7);
    float a = p.y / ch, row = mix(mix(floor(a), -7.0, orth), -9.0, tall), bw = mix(mix(bl * (0.66 + 0.34 * aH2(vec2(row, 11.0))), 1.22, orth), 1.86, tall), b = runW / bw + 0.5 * mod(row, 2.0) + aH2(vec2(row, 3.0));
    float da = mix(min(fract(a), 1. - fract(a)) * ch, 1.0, max(orth, tall)), db = min(fract(b), 1. - fract(b)) * bw, jw = mix(0.0045, 0.006, oldK);
    // a fine joint, and along it the soft narrow shade of the two blocks' eased edges, which carries the joint where it
    // is thinner than a pixel (level joints show on upright faces only: a level face lies in one course). In the well
    // that shade widens with the pixel's footprint (to 3.6 cm) and is a little deeper: the courses read across the court
    float sw = 0.018 + cwK * clamp(1.1 * max(fwp3.y, frW), 0., 0.018), sk = 0.3 - 0.16 * cwK;
    joint = max(max(aLine(da, fwp3.y, jw), sk * aLine(da, fwp3.y, sw)) * step(an.y, 0.7), max(aLine(db, frW, jw), sk * aLine(db, frW, sw)));
    blk = vec2(row, floor(b) + 31.0 * sideX); ashlar = 1.0;
    // THE COURT'S WALLS ARE DRAFTED: each block's face stands a finger proud of a smooth margin round it. Under a
    // level joint the lower block's eased edge is turned up to the sky and is lighter; over it the upper block's
    // eased edge is turned down and is darker; beside an upright joint the margin is a little lighter than the face.
    // These lines are as wide as the pixel's footprint asks (to 7 and 8 cm) and fade where they would be thinner
    // than a pixel; where a block is smaller than a pixel the wall keeps its courses' tones alone (blkFar)
    if (cwK > 0.5) {
      float fa = fract(a), wB = clamp(1.3 * fwp3.y, 0.014, 0.07), kB = clamp(0.07 / max(1.3 * fwp3.y, 1e-4), 0., 1.) * (1. - max(orth, tall)) * step(an.y, 0.7);
      float wM = clamp(1.3 * frW, 0.02, 0.08), kM = clamp(0.08 / max(1.3 * frW, 1e-4), 0., 1.);
      draft = kB * (0.1 * (1. - smoothstep(0.4 * wB, wB, (1. - fa) * ch - jw)) - 0.13 * (1. - smoothstep(0.4 * wB, wB, fa * ch - jw))) + 0.045 * kM * (1. - smoothstep(0.5 * wM, wM, db - jw));
      blkFar = smoothstep(0.6, 1.5, frW / bw);
      // (the band of tall slabs under the crown carries the painted chain)
      if (tall > 0.5) paint = aChain(vec2(runW, p.y - 24.96) / 1.32, max(frW, fwp3.y) / 1.32);
      // (a round shield hangs before the long wall at every ${SH_DX} m: the wall close round it and under it is shaded)
      vec2 sc = vec2(runW - ${SH_X0} - ${SH_DX} * clamp(floor((runW - ${SH_X0}) / ${SH_DX} + 0.5), 0., ${SH_N - 1}.), p.y - ${SH_Y - 0.08});
      draft -= (1. - sideX) * 0.3 * (1. - smoothstep(0.44, 0.86, length(sc)));
    }
  } else if (kind > 1.5 && kind < 2.5) {
    float a = p.y / ch + aH2(vInst * 0.37 + 2.0), row = floor(a);
    // (beside the fine joint the soft shade of the two drums' eased edges; it widens with the pixel's footprint, to 4 cm,
    // and carries the joint where the joint is thinner than a pixel)
    float dj = min(fract(a), 1. - fract(a)) * ch;
    joint = max(aLine(dj, fwp3.y, 0.0035), 0.5 * aLine(dj, fwp3.y, clamp(1.1 * fwp3.y, 0.012, 0.04)));
    blk = vec2(row, 7.0 + vInst.x * 3.1 + vInst.y * 1.7);
  } else if (kind > 2.5 && kind < 3.5 && vJt.w > 0.75) {
    // the court's old floor: worn slabs of several sizes in bands across the court, grey white marble and a warmer
    // limestone side by side; their edges worn round, a few sunk a finger's breadth, a few cracked across
    vec2 g = vec2(p.x / ch, p.z / bl + aH2(vec2(floor(p.x / ch), 5.0))), ci = floor(g), cf = g - ci;
    float hs = aH2(ci + 17.0);
    vec2 sub = hs < 0.2 ? vec2(1., 1.) : hs < 0.45 ? vec2(2., 1.) : hs < 0.68 ? vec2(1., 2.) : hs < 0.82 ? vec2(2., 2.) : (cf.x < 0.5 ? vec2(2., 1.) : vec2(2., 2.));
    vec2 sg = cf * sub, si = floor(sg), sf = sg - si, sz = vec2(ch, bl) / sub;
    blk = ci * 3.0 + si + vec2(41.0, 7.0) + sub * 0.37; aOld = 1.0;
    float da = min(sf.x, 1. - sf.x) * sz.x, db = min(sf.y, 1. - sf.y) * sz.y, hk = aH2(blk * 2.3 + 4.5), fwf = max(fwp3.x, fwp3.z);
    // (the joints are chipped: wider here, closer there)
    float jv = 0.003 + 0.008 * aN3(vec3(p.x * 2.3, 6.0, p.z * 2.3));
    joint = 0.8 * max(aLine(da, fwp3.x, jv), aLine(db, fwp3.z, jv));
    // a sunk slab: lower all over, and a line of shade under its west and south neighbours' edges
    float sunk = step(hk, 0.14);
    lift = -0.16 * (1. - smoothstep(0.0, 0.09, min(da, db))) - sunk * (0.22 + 0.5 * max(aLine(sf.x * sz.x, fwp3.x, 0.03), aLine((1. - sf.y) * sz.y, fwp3.z, 0.03)));
    // a crack: one wandering line across the slab
    float cw = (sf.y - 0.5 - 0.3 * (aN3(vec3(sf.x * 2.6 + blk.x, blk.y, 1.5)) - 0.5) - 0.5 * (hk - 0.2) * (sf.x - 0.5)) * sz.y;
    joint = max(joint, 0.8 * step(0.14, hk) * step(hk, 0.27) * aLine(abs(cw), fwf, 0.004));
  } else if (kind > 2.5 && kind < 5.5) {
    float isZ = step(4.5, kind), isFloor = 1. - step(3.5, kind);
    float cross = mix(p.y - 0.5 * ch, p.z, isFloor), run = mix(p.x, p.z, isZ), fr = mix(fwp3.x, fwp3.z, isZ);
    float a = cross / ch, row = floor(a), b = run / bl + 0.5 * mod(row, 2.0) + 0.37 * aH2(vec2(row, 3.0));
    float da = min(fract(a), 1. - fract(a)) * ch, db = min(fract(b), 1. - fract(b)) * bl;
    joint = max(aLine(db, fr, 0.004), isFloor * aLine(da, fwp3.z, 0.004));
    blk = vec2(row, floor(b) + 31.0 * isZ);
    // (the court's own stair: each tread's front edge is worn smooth by feet and is lighter; its back, under the
    // next riser, lies in that riser's shade)
    if (aWell > 0.5 && kind > 4.5) {
      float xs = fract((p.x - 33.82) / ${((STAIR_X1 - CRT_X0) / 14).toFixed(5)}) * ${((STAIR_X1 - CRT_X0) / 14).toFixed(5)}, wn = clamp(1.3 * fwp3.x, 0.03, 0.12);
      lift = 1.3 * clamp(0.12 / max(1.3 * fwp3.x, 1e-4), 0., 1.) * (1. - smoothstep(0.5 * wn, wn, ${((STAIR_X1 - CRT_X0) / 14).toFixed(5)} - xs)) - 0.9 * (1. - smoothstep(0.03, 0.14, xs));
    }
  } else if (kind > 5.5 && kind < 6.5) {
    // an egg moulding: eggs of bare marble on a blue ground, a thin dart between them
    float u = fract(runW / ch) - 0.5, v = clamp((p.y - vJt.z) / max(vJt.w, 0.01), 0., 1.);
    float e = (u * u) / 0.13 + ((v - 0.56) * (v - 0.56)) / 0.25, aa = frW / ch * 5.0 + 0.03;
    float egg = 1. - smoothstep(1. - aa, 1. + aa, e), dart = 1. - smoothstep(0.035, 0.035 + aa * 0.25, 0.5 - abs(u));
    ground = 1. - max(egg, dart); lift = egg * (0.5 - 0.5 * e);
  } else if (kind > 13.5) {
    // kind 14: a painted bead and reel (jt.y: from bead to bead, jt.z: the band's foot, jt.w: its height): beads of
    // bare marble and gilt reels between them on a dark blue ground; far off, one tone
    float u = fract(runW / ch) - 0.5, v = (p.y - vJt.z) / max(vJt.w, 0.01) - 0.5, aa = max(frW, fwp3.y) / ch, sb = clamp(aa * 14., 0.06, 1.);
    float bead = 1. - smoothstep(1. - sb, 1. + sb, u * u / 0.085 + v * v / 0.12), ur = abs(abs(u) - 0.42);
    float reel = 1. - smoothstep(1. - sb, 1. + sb, ur * ur / 0.0016 + v * v / 0.14);
    paint = mix(vec3((1. - max(bead, reel)) * (1. - smoothstep(0.4, 0.44, abs(v))), 0., reel), vec3(0.42, 0., 0.06), smoothstep(0.06, 0.2, aa));
  } else if (kind > 6.5 && kind < 7.5) {
    // the gutter's face: a running scroll of bare marble on a blue ground (jt.z: the face's foot; below 0 on the two
    // gables' raking gutters, where the foot runs so far under the roof's own plane)
    float hh = max(vJt.w, 0.01), u = fract(runW / ch), v = clamp((p.y - (vJt.z < 0. ? 23.9 + (25.5 - abs(p.z)) * 0.30588 + vJt.z : vJt.z)) / hh, 0., 1.), aa = frW / ch * 4.0 + 0.03;
    float wave = abs(v - 0.5 - 0.27 * sin(6.2831853 * u));
    vec2 c1 = vec2((u - 0.25) * ch / hh, v - 0.66), c2 = vec2((u - 0.75) * ch / hh, v - 0.34);
    float curl = min(abs(length(c1) - 0.17), abs(length(c2) - 0.17));
    float sc = 1. - smoothstep(0.07, 0.07 + aa, min(wave, curl));
    float edge = 1. - smoothstep(0.06, 0.06 + aa, min(v, 1. - v));
    ground = 1. - max(sc, edge); lift = sc * 0.3;
  } else if (kind > 7.5 && kind < 8.5) {
    // marble roof tiles: courses up the slope, each tile its own tone, a thin shade under each course's edge
    float a = (25.5 - abs(p.z)) * 1.0457 / ch, row = floor(a), fa = fract(a);
    joint = aLine(min(fa, 1. - fa) * ch, fwp3.z * 1.05, 0.012) * 0.8;
    lift = -0.22 * (1. - smoothstep(0.0, 0.16, fa)) * (1. - smoothstep(0.02, 0.12, fwp3.z));
    blk = vec2(row, floor(p.x / bl));
  } else if (kind < 0.5 && vJt.y > 0.5) {
    // the upper work's blocks (jt.y is the course's number). Course 1 is the beam: each block reaches from one column's
    // axis to the next (on the long sides 6 m in the two end bays and 5.2107 m between; on the fronts the axes stand
    // 4.375, 11.575 and 17.735 m from the middle). The other courses' blocks are jt.z long
    float b = runW / bl + 0.37 * vJt.y, dj = min(fract(b), 1. - fract(b)) * bl;
    if (vJt.y < 1.5) {
      float az = abs(p.z), xr = p.x < 12. ? p.x : p.x < 90.16 ? p.x - 12. : p.x - 90.16, xl = (p.x < 12. || p.x > 90.16) ? 6. : 5.2107;
      float bx = (p.x < 12. ? 0. : p.x < 90.16 ? 2. : 17.) + xr / xl;
      b = mix(bx, sign(p.z) * (step(4.375, az) + step(11.575, az) + step(17.735, az)) + 0.5, sideX);
      dj = mix(min(fract(bx), 1. - fract(bx)) * xl, min(min(abs(az - 4.375), abs(az - 11.575)), abs(az - 17.735)), sideX);
    }
    joint = max(aLine(dj, frW, 0.004), 0.3 * aLine(dj, frW, 0.018)) * step(an.y, 0.7);
    blk = vec2(vJt.y * 7.0 + 3.0, floor(b) + 31.0 * sideX);
  }
  // fine: 1 on the faces of the court's own walls
  float hb = aH2(blk + 0.5), hb2 = aH2(blk * 1.7 + 9.5), wallK = ashlar * step(0.5, ch), fine = wallK * aWell * (1. - oldK), orthK = fine * step(0.79, p.y) * step(p.y, 2.55);
  aFine = fine;
  vec3 q = p * 0.42 + vec3(hb, hb2, hb) * 23.0;
  float cloud = aN3(q * 0.45), w1 = aN3(q * vec3(1.0, 1.6, 1.0) + 2.6 * aN3(q * 0.7 + 5.0));
  float vein = smoothstep(0.40, 0.5, w1) * (1. - smoothstep(0.5, 0.60, w1));
  // the roof's tiles differ more from one to the next than wall blocks do; where a tile is smaller than a pixel they are one tone
  float tk = (kind > 7.5 && kind < 8.5) ? 1.0 + 0.9 * (1. - smoothstep(0.25, 1.0, fwp3.x + fwp3.z)) : 1.0;
  tk -= 0.35 * aOld;
  // a wall's block differs from the next in tone, a little in hue, and has its own veins
  float hasB = max(step(0.5, kind), step(0.5, vJt.y) * step(kind, 0.5)), outK = step(kind, 5.5) * (1. - aOld) * (1. - ashlar);
  float tone = 1.0 + (hb - 0.5) * (0.085 + 0.055 * outK + 0.02 * ashlar + 0.02 * wallK + 0.012 * fine) * (1. - blkFar) * (1. - 0.5 * orthK) * tk * hasB + (cloud - 0.5) * (0.10 - 0.04 * fine) * tk - vein * (0.05 + 0.03 * wallK) * aN3(q * 0.3 + 11.0) + lift * 0.25;
  vec3 hue = vec3(1.0 + (hb2 - 0.5) * (0.03 + 0.02 * wallK + 0.012 * fine) * (1. - blkFar), 1.0, 1.0 - (hb2 - 0.5) * (0.04 + 0.03 * wallK + 0.015 * fine) * (1. - blkFar));
  // old stone: blocks that differ more, warm stains, worn patches
  tone += oldK * ((hb - 0.5) * 0.07 - 0.12 * smoothstep(0.42, 0.78, aN3(p * vec3(1.1, 0.6, 1.1) + 3.0)));
  hue *= mix(vec3(1.0), vec3(1.035, 1.0, 0.935), oldK * (0.4 + 0.6 * aN3(p * 0.8 + 7.0)));
  // the old floor's slabs: pale warm greys (limestone) and whites (marble), worn and stained in broad soft patches
  if (aOld > 0.5) {
    diffuseColor.rgb = mix(vec3(0.5, 0.468, 0.415), vec3(0.525, 0.535, 0.55), step(0.42, hb2));
    // worn paler where feet have gone (broad soft fields), stained in others
    hue = vec3(1.0); tone += (aN3(vec3(p.x * 0.33, 1.0, p.z * 0.33)) - 0.5) * 0.2 + (aN3(vec3(p.x * 1.7, 4.0, p.z * 1.7)) - 0.5) * 0.12 + ((aN3(vec3(p.x * 9.0, 2.0, p.z * 9.0)) - 0.5) * 0.09 + (aN3(vec3(p.x * 41.0, 8.0, p.z * 41.0)) - 0.5) * 0.08 * (1. - smoothstep(0.004, 0.02, pix))) * (1. - smoothstep(0.01, 0.06, pix));
  }
  // kinds 10 and 11: wood, bronze, gold, wool and leaves: no stone in them; jt.z 1 gives the grain of polished wood;
  // jt.z 2 is tended bronze: its brown a little uneven from hand to hand, a dull green come up here and there
  if (kind > 9.5 && kind < 13.5) { hue = vec3(1.0); tone = 1.0 + step(0.5, vJt.z) * step(vJt.z, 1.5) * ((aN3(vec3(p.x * 7.0, p.y * 0.9, p.z * 7.0)) - 0.5) * 0.3 + (aN3(vec3(p.x * 45.0, p.y * 2.5, p.z * 45.0)) - 0.5) * 0.14);
    if (vJt.z > 1.5) { tone = 0.9 + 0.2 * aN3(p * vec3(5., 3., 5.)); hue = mix(vec3(1.), vec3(0.66, 1.06, 1.1), 0.3 * smoothstep(0.52, 0.8, aN3(p * vec3(11., 7., 11.) + 3.))); } }
  // long faint weather streaks down the block walls
  tone -= wallK * (0.05 + 0.09 * smoothstep(5.0, 27.0, p.y)) * smoothstep(0.4, 0.8, aN3(vec3(runW * 0.7, p.y * 0.05, 7.0))) * (0.5 + 0.5 * aN3(vec3(runW * 3.1, p.y * 0.3, 2.0)));
  // the court's walls: broad soft fields of weather; dark runs down from under the crowning moulding; and the soft
  // shade that gathers under the crown, under the string course at the temple's floor level and over the moulded foot
  tone += fine * ((aN3(vec3(runW * 0.09, p.y * 0.07, 3.0)) - 0.5) * 0.065 + (aN3(vec3(runW * 0.31, p.y * 0.12, 8.0)) - 0.5) * 0.035);
  tone -= fine * 0.16 * smoothstep(20.5, 26.2, p.y) * smoothstep(0.3, 0.75, aN3(vec3(runW * 1.1, p.y * 0.07, 5.0))) * (0.45 + 0.55 * aN3(vec3(runW * 4.3, p.y * 0.4, 9.0)));
  tone *= 1. - fine * (0.16 * step(p.y, 26.3) * (1. - smoothstep(0.0, 0.5, 26.28 - p.y)) + 0.2 * step(p.y, 24.6) * (1. - smoothstep(0.0, 0.45, 24.54 - p.y)) + 0.2 * step(p.y, 2.6) * (1. - smoothstep(0.0, 0.55, 2.58 - p.y)) + 0.12 * (1. - smoothstep(0.0, 0.35, p.y - 0.8)));
  // the upright slabs at the foot and the plain band under the crown are a finer, paler stone than the courses between them
  tone += 0.085 * orthK + fine * (0.05 * step(24.96, p.y) * step(p.y, 26.28) + draft);
  // each course its own tone; the foot of the court's walls is damp and darker (only they reach down to the old floor)
  tone += wallK * (aH2(vec2(blk.x, 9.0)) - 0.5) * (0.05 + 0.015 * fine);
  tone -= wallK * 0.1 * (1. - smoothstep(0.5, 2.2, p.y - 0.4 * aN3(vec3(runW * 0.9, 0.0, 4.0))));
  // a real flute's hollow is darker than its fillet: far off the shaft is one tone
  if (kind > 1.5 && kind < 2.5 && vJt.z < 0.01) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.506, 0.523, 0.558), aFar);
  // the tooth blocks and the blue band behind them. The band paints a block wherever one stands (0.24 wide every 0.4 m),
  // so that beyond the west third, where no blocks are made, it reads the same; far off, one tone between the two
  if (kind > 12.5 && kind < 13.5) {
    float tu = abs(fract(runW / 0.4 + 0.5 - 0.5 * sideX) - 0.5), taa = frW / 0.4 + 0.02;
    float tooth = (1. - smoothstep(0.3 - taa, 0.3 + taa, tu)) * step(an.y, 0.5);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.553, 0.572, 0.61), tooth * step(0.1, diffuseColor.b - diffuseColor.r));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.368, 0.414, 0.572), smoothstep(0.05, 0.16, pix));
  }
  diffuseColor.rgb *= tone * hue * (1.0 - (0.52 - 0.2 * fine) * joint);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.13, 0.5) * (0.85 + 0.3 * cloud), ground * 0.94);
  // the court's painted bands: dark blue, red and a little gilt on the marble, a little worn
  diffuseColor.rgb = mix(mix(mix(diffuseColor.rgb, vec3(0.08, 0.18, 0.44), 0.92 * paint.x), vec3(0.42, 0.075, 0.05), 0.92 * paint.y), vec3(0.72, 0.5, 0.15), paint.z);
}
#ifdef ARTEMIS_RELIEF
// the carved field: marble figures on a marble ground of the same stone, in low relief; no coloured field. The relief
// is read by light and shade: each figure is a raised form with a soft edge, and a line of shade lies under it and
// close beside it where the ground meets it. Colour is only picked out and worn: a faint blue is left in the
// ground's hollows close round the figures, and one thin even line of dark red runs round the field
float aRk = step(8.5, vJt.x) * step(vJt.x, 9.5), aRsh = 0.0, aPed = step(1.5, vRm.x), aDb = step(0.5, vRm.x) * (1. - aPed);
vec2 aRs = aRelUv(vRc, aPed, aDb, vRm.y), aRg = vec2(vRm.y * mix(0.5, 0.25, aPed), 0.5);
vec4 aRt = textureGrad(uRelief, aRs, dFdx(vRc) * aRg, dFdy(vRc) * aRg);
{
  float hg = aRt.a, fwh = fwidth(hg) * 0.7 + 0.02, fig = smoothstep(0.07 - fwh, 0.07 + fwh, hg), aNear = 1. - smoothstep(0.012, 0.04, pix);
  // the height two fingers round about: where it stands over this point the point lies in a hollow or at a figure's
  // edge; and the height a little way up: where that stands over this point, the point lies under a form's lower edge
  float hb = textureLod(uRelief, aRs, 2.5).a, hollow = clamp((hb - hg) * 4.5, 0., 1.) * aNear;
  float under = smoothstep(0.05, 0.3, textureLod(uRelief, aRelUv(vRc + vec2(0., 0.022 / max(vJt.z, 0.1)), aPed, aDb, vRm.y), 1.).a - hg) * aNear;
  // the field's edge: 1.3 cm in, along its upper and lower edge, on a pedestal's face along its sides too
  vec2 eg = vec2(min(fract(vRc.x), 1. - fract(vRc.x)) * vJt.y + (1. - aPed), min(vRc.y, 1. - vRc.y) * vJt.z);
  float ed = min(eg.x, eg.y), line = (1. - smoothstep(0.012, 0.012 + max(pix, 0.002), ed)) * (1. - fig);
  vec3 groundC = diffuseColor.rgb * 0.96 * mix(vec3(1.), vec3(0.8, 0.87, 0.98), 0.7 * hollow) * (1. - 0.36 * under);
  vec3 figC = diffuseColor.rgb * vec3(1.02, 1.0, 0.97) * mix(0.9, 1.05, smoothstep(0.1, 0.55, hg)) * (1. - 0.3 * hollow) * (1. - 0.38 * under);
  groundC = mix(groundC, vec3(0.36, 0.16, 0.13), line * 0.45);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(groundC, figC, fig), aRk);
  // the shade a figure throws on the ground beside it: one look at the height a little way toward the sun
  vec3 nL = aNrm(vLN), tL = vec3(-nL.z, 0., nL.x);
  float ln = dot(uSunDir, nL), lu = dot(uSunDir, tL), lv = uSunDir.y;
  vec2 off = vec2(lu / max(vJt.y, 0.1), lv / max(vJt.z, 0.1)) * (0.028 / max(ln, 0.2));
  float h2 = textureLod(uRelief, aRelUv(vRc + off, aPed, aDb, vRm.y), 0.).a;
  aRsh = aRk * step(0.0, ln) * smoothstep(0.1, 0.45, h2 - hg);
  // the carving's own soft form in the sky's light, so that it shows in shade too: its faces turned to the sun's side
  // and up to the sky are a little lighter, those turned away and down a little darker
  vec2 sl = (aRt.rg - 0.498) * vec2(vRm.y, 1.) * 2.0;
  diffuseColor.rgb *= mix(1., clamp(1. - 0.95 * sl.x * lu - 0.6 * sl.y, 0.62, 1.26), aRk);
}
#endif
`;
// after normal_fragment_maps: flutes by shading where the shaft's own geometry has none (jt.z carries their strength)
const MARBLE_F2 = `
{
  float rr = max(length(vOP.xz), 0.05);
  float fwa = (length(dFdx(vOP.xz)) + length(dFdy(vOP.xz))) / rr * 3.82;
  if (vJt.x > 1.5 && vJt.x < 2.5 && vJt.z < 0.01) normal = aNrm(mix(normal, aNrm(vRad), aFar));
  // the roof's rounded cover tiles: where their sides are thinner than a pixel they take the slope's own light,
  // so that the far rows do not shimmer
  if (vJt.x > 7.5 && vJt.x < 8.5) {
    vec3 slopeN = aNrm((viewMatrix * vec4(0., 1., sign(vLP.z) * 0.3057, 0.)).xyz);
    normal = aNrm(mix(normal, slopeN, smoothstep(0.03, 0.13, pix)));
  }
  // THE STEPS ROUND THE TEMPLE (outside the top step's edge, below the floor): where a whole step, its tread and its
  // riser together, is only a few pixels, each of the two takes the light of both, by the share of the picture each
  // one fills from this side: far steps are one even tone, near steps keep their edges
  // (so and the two screen derivatives of the place that the blend uses are taken here, in plain flow above its
  // branches, for every picture element: taken inside the branches on the place they would not be settled at an edge)
  vec2 so = vec2(max(${TOP[0]} - vLP.x, vLP.x - ${TOP[1]}), abs(vLP.z) - ${TOP[3]});
  float aSc = so.x > so.y ? vLP.x : vLP.z, aSfw = fwidth(aSc), aSfy = fwidth(vLP.y);
  if (vLP.y < 2.9 && ((vJt.x > 3.5 && vJt.x < 5.5) || (vJt.x > 0.5 && vJt.x < 1.5 && vJt.y < 0.25))) {
    if (max(so.x, so.y) > -0.01) {
      vec3 hn = so.x > so.y ? vec3(vLP.x < 50. ? -1. : 1., 0., 0.) : vec3(0., 0., sign(vLP.z));
      vec3 nr = aNrm((viewMatrix * vec4(hn, 0.)).xyz), nt = aNrm((viewMatrix * vec4(0., 1., 0., 0.)).xyz), vv = aNrm(vViewPosition);
      float ar = max(dot(vv, nr), 0.) * ${RISE.toFixed(4)}, at = max(dot(vv, nt), 0.) * ${((FOOT[3] - TOP[3]) / NSTEP).toFixed(4)};
      float spx = vJt.x > 3.5 ? ${((FOOT[3] - TOP[3]) / NSTEP).toFixed(4)} / max(aSfw, 1e-5) * (1. + ar / max(at, 1e-4)) : ${RISE.toFixed(4)} / max(aSfy, 1e-5) * (1. + at / max(ar, 1e-4));
      normal = mix(normal, (ar * nr + at * nt) / max(ar + at, 1e-5), 1. - smoothstep(2.0, 8.0, spx));
    }
  }
  if (vJt.x > 1.5 && vJt.x < 2.5 && vJt.z > 0.01) {
    float ph = atan(vOP.z, abs(vOP.x) < 1e-6 ? 1e-6 : vOP.x) * (24.0 / 6.2831853), f = fract(ph);
    float k = vJt.z * (1. - smoothstep(0.12, 0.42, fwa));
    float t = clamp((f - 0.2) / 0.8, 0., 1.), inH = step(0.2, f);
    float th = 1.05 * (1. - 2. * t) * inH * k;
    vec3 upV = aNrm((viewMatrix * vec4(0., 1., 0., 0.)).xyz);
    vec3 tg = cross(upV, normal); float tl = length(tg);
    if (tl > 1e-4) normal = aNrm(normal * cos(th) - (tg / tl) * sin(th));
    diffuseColor.rgb *= 1. - 0.2 * inH * sin(3.14159 * t) * k - 0.07 * (vJt.z - k);
  }
}
#ifdef ARTEMIS_RELIEF
{
  vec2 gr = (aRt.rg - 0.498) * vec2(vRm.y, 1.) * 7.0 * aRk;
  vec3 upR = aNrm((viewMatrix * vec4(0., 1., 0., 0.)).xyz);
  vec3 tR = cross(normal, upR); float lR = length(tR);
  if (lR > 1e-4) normal = aNrm(normal - (tR / lR) * gr.x - upR * gr.y);
}
#endif
`;
// before aomap_fragment: the sky's two sides, and a sheen of the bright sky on level slabs
const MARBLE_F3 = `
#ifdef ARTEMIS_RELIEF
reflectedLight.directDiffuse *= 1. - 0.8 * aRsh; reflectedLight.directSpecular *= 1. - 0.8 * aRsh;
#endif
{
  vec3 nW = inverseTransformDirection(normal, viewMatrix);
  float sd = 0.5 + 0.5 * dot(nW, uSunDir), up = max(nW.y, 0.), wS = 1.0; vec3 back = vec3(0.), wTint = vec3(1.);
  // THE TEMPLE'S FLOOR BY ITS OWN KIND AND LEVEL (round r11: the bound of the floor's three lines below). aFl is exactly 1 on the temple's floor, the only thing built with
  // kind 3 and roughness 0.4, level at 2.88 m (the court's old floor is kind 3 with 0.82 and lies at 0.18 m), and exactly 0 on every other face
  float aFl = step(2.5, vJt.x) * step(vJt.x, 3.5) * step(abs(vJt.w - 0.4), 0.02) * step(abs(vLP.y - 2.88), 0.02);
  // THE SHADE UNDER THE ROOF, by the place alone. A point under the roof ring or the porch's roof (inside the eaves'
  // line, outside the open court, below the ceilings) has only a share of the sky (uRoofed); the share eases to the
  // whole over the outermost five metres behind the outer columns' line, where the sky looks in between the columns,
  // and reaches further in on faces turned outward. The floor, the shafts, the carved feet, the walls and the
  // ceilings all take it; what the sunlit floor throws up reaches every face under the roof a little, but the temple's floor itself (aFl, below).
  vec3 rdd = vec3(vLP.x + 1.5, 103.66 - vLP.x, 25.4 - abs(vLP.z));
  float rIn = (1. - aWell) * smoothstep(0., 0.6, min(min(rdd.x, rdd.y), rdd.z)) * (1. - smoothstep(22.2, 22.5, vLP.y));
  vec3 rEase = 1.3 - rdd * 0.2 + 0.45 * max(vec3(-nW.x, nW.x, nW.z * sign(vLP.z)), 0.);
  wS = mix(1., mix(uRoofed, 1., clamp(max(max(rEase.x, rEase.y), rEase.z), 0., 1.)), rIn);
  // (under the roof the faces turned from the sun's side and the high parts under the ceilings have less of it still)
  wS *= 1. - rIn * (0.3 * smoothstep(9., 20.5, vLP.y) + 0.35 * max(-dot(nW.xz, uSunDir.xz) / max(length(uSunDir.xz), 1e-4), 0.));
  // THE SUN'S LANES UNDER THE ROOF, by the place: with the sun on the long axis it lies in long lanes on the floor
  // between the rows of columns, as far in as the front beam lets it. That sunlit stone throws warm light back on
  // what stands near it: most on faces turned across the lanes, less with every metre over the floor (to a third
  // 5 m up), a little on every face but the floor itself: the floor cannot take the floor's own thrown light, so in a
  // column's shadow it has the sky's light alone and the shadow lies cool and deep between the bands of sun
  // (the factor of the face's turn: on the temple's floor, aFl, the whole of it; on every other face 0.7 of it, as it was)
  back = uLaneC * (rIn * (1. - smoothstep(0.82, 1.0, (vLP.x - uLaneX.x) * uLaneX.y)) * exp(-max(vLP.y - 2.88, 0.) / 4.5) * (0.22 + 0.78 * abs(nW.z)) * (1. - (aFl > 0.5 ? 1. : 0.7) * up));
  reflectedLight.indirectDiffuse *= wS;
  // THE BANDS OF SUN ON THE TEMPLE'S FLOOR UNDER THE ROOF. A sun 12.5 to 13 degrees high gives a level face only 0.22 of its
  // strength by the plain cosine law, and the sunlit floor is then a dull brown beside its own shadows. Worked stone
  // lying level under so low a sun gives back more of it than that (the court's old floor has this in the well, below):
  // 2.2 times, ON THE TEMPLE'S FLOOR ALONE (aFl: no other face under the roof takes it, level or not). The law eases in
  // over the first three metres inside the eaves' line (the open margin of the platform, which the rain reaches, keeps
  // the plain law). No light is added: the sun's own light on the floor is scaled, where the sun's map lets it fall,
  // and nowhere else
  if (aFl > 0.5) reflectedLight.directDiffuse *= 1. + 1.2 * up * (1. - aWell) * smoothstep(0., 3., min(min(rdd.x, rdd.y), rdd.z)) * (1. - smoothstep(22.2, 22.5, vLP.y));
  // (the wall close behind a door leaf's heel post stands in the post's shade)
  reflectedLight.directDiffuse *= 1. - aPost; reflectedLight.directSpecular *= 1. - aPost;
  // THE LIGHT IN THE WELL, by the place alone. The sun reaches what the rim lets it reach (aSun). The rest stands in
  // open shade: it has the sky that the well's mouth leaves it (most high up, least low in the corners: each of the
  // four walls takes its share by the angle it stands up at from this place), cool; the walls' own faint light to
  // one another; and the warm light thrown back by the sunlit wall and by the door's blade of sun on the floor, to
  // what is near them and faces them.
  if (aWell > 0.5) {
    // (worn stone lying level under a low sun gives back more of it than a smooth face would: its grain stands up
    // into the light)
    reflectedLight.directDiffuse *= aSun * (1. + 1.2 * up * uWell.a); reflectedLight.directSpecular *= aSun;
    float hS = max(28.2 - vLP.y, 0.), hG = max(30.0 - vLP.y, 0.);
    vec4 dd = max(vec4(vLP.z + 10.57, 10.57 - vLP.z, vLP.x - 33.82, 80.46 - vLP.x), 0.), hh = vec4(hS, hS, hG, hG);
    vec4 op = 0.5 + 0.5 * dd / sqrt(dd * dd + hh * hh + 1e-3);
    // (the share runs from an eighth of the sky low in a corner to nearly the whole of it high on a wall; things
    // of bronze, wood, wool and leaves keep six tenths at the least, so that nothing dark goes darker)
    float deep = 1. - clamp((op.x * op.y * op.z * op.w * (1.0 + 0.3 * up) - 0.15) / 0.34, 0., 1.);
    // (and the white walls give the sky's light on to one another: six tenths more of it than the mouth alone gives)
    wS = mix(1., 1.6 * max(1. - 0.88 * deep, 0.62 * step(9.5, vJt.x) * step(vJt.x, 12.5)), uWell.a);
    // (what is turned down, the undersides of the string courses and of the crown, has the floor's shade for its light)
    wS *= 1. - 0.5 * uWell.a * max(-nW.y, 0.);
    // (where the sun lies full on a wall of the well the sky's cool light counts for little beside it: the wall is gold)
    wS *= 1. - 0.6 * uWell.a * aRim * clamp(2. * dot(nW, uSunDir), 0., 1.);
    // (the sky's light on a level face is the bluest light there is: in the well it comes mixed with the walls' own)
    reflectedLight.indirectDiffuse *= wS * mix(vec3(1.), vec3(1.0 + 0.25 * up, 1.0 + 0.04 * up, 1.04 - 0.2 * up), uWell.a);
    // (an upright face in the well's open shade has the blue sky for its light and little else: white marble is soft
    // blue there, deeper toward the floor)
    // (dyed wool is a deep, matt colour: it takes four tenths of that blue only and keeps its own hue in the shade)
    wTint = mix(vec3(1.), mix(vec3(0.66, 0.95, 1.42), vec3(0.5, 0.86, 1.52), deep), uWell.a * (1. - 0.6 * up) * (1. - 0.7 * aBand) * (1. - 0.6 * step(10.5, vJt.x) * step(vJt.x, 11.5) * step(vJt.z, 0.5)));
    reflectedLight.indirectDiffuse *= wTint;
    vec3 toL = uWellAt - vLP; float d2 = dot(toL, toL);
    back = uWell.rgb * ((0.1 + 0.9 * max(dot(nW, toL / max(sqrt(d2), 1e-3)), 0.)) / (1. + d2 / 320.)) + uWellAmb;
    // THE BAND OF GOLD ALONG THE TOPS: where the sun stands over the rim, the bright sky round it (a broad light, not
    // a point) lies on the faces the sun itself only grazes: the long walls above the west roof's shade line
    // (and under the shade line the same broad light still finds the upright faces, less with every metre under it:
    // three tenths of the band's at the line, a third of that 5 m under it)
    back += uBandC * (aBand * (1. - clamp(2. * dot(nW, uSunDir), 0., 1.)) * (1. - 0.6 * up) + 0.3 * aGlow * (1. - aBand) * (1. - up));
    // the warm light the door's blade of sun throws back from the old floor (the nearest place within the blade's
    // width), and the light the shrine's sunlit front throws back toward the door
    vec2 bab = uBlade.zw - uBlade.xy, bc = uBlade.xy + bab * clamp(dot(vLP.xz - uBlade.xy, bab) / max(dot(bab, bab), 1e-3), 0., 1.), bo = vLP.xz - bc;
    float bl = length(bo); bc += bo * (min(bl, 2.6) / max(bl, 1e-3));
    vec3 toB = vec3(bc.x, 0.18, bc.y) - vLP, toS = vec3(56.0, 3.6, 0.) - vLP; float b2 = dot(toB, toB), s2 = dot(toS, toS);
    vec3 ts = toS / max(sqrt(s2), 1e-3);
    // (each falls off as exp(-d / R) with the distance d from the lit stone: R is 3.8 m for the blade, 6 m for the
    // shrine's front)
    b2 = sqrt(b2);
    back += uBladeC * ((0.3 + 0.7 * max(dot(nW, toB / max(b2, 1e-3)), 0.)) * exp(-b2 / 3.8)) + uShrC * ((0.15 + 0.85 * max(dot(nW, ts), 0.)) * max(ts.x, 0.) * exp(-sqrt(s2) / 6.0));
  }
#ifdef ARTEMIS_GLOW
  // THE WORLD'S GLOW (opts.glow): a light of the world's at one place over the court, of its colour, its strength now
  // and its reach; it lies on whatever in the court is turned to it, in the sun's shade as in the sun, and falls
  // off as (1 - d / reach)^2
  vec3 gL = uGlowAt - vLP; float gD = length(gL), gF = 1. - min(gD / max(uGlowR, 1e-3), 1.); gF *= gF * uGlowK * aWell; gL /= max(gD, 1e-3);
  reflectedLight.indirectDiffuse += material.diffuseColor * RECIPROCAL_PI * uGlowCol * (gF * max(dot(nW, gL), 0.));
#endif
  // outside the well: the glow of the bright sky round the sun on what is turned to it, the blue sky's light on what
  // is turned away, and on undersides the light thrown up from the sunlit floor (in the well the floor lies in shade;
  // under the roof a little of it reaches every face but the temple's floor itself, aFl)
  vec3 fill = (uWarm * sd * sd + uCool * (1.2 - 0.5 * sd - 0.3 * sd * sd * sd * sd)) * wS * wTint + uBounce * (max(-nW.y, 0.) + (aFl > 0.5 ? 0.12 * rIn * (1. - up) : 0.12 * rIn)) * (1. - 0.8 * aWell * uWell.a) + back;
  reflectedLight.indirectDiffuse += material.diffuseColor * RECIPROCAL_PI * fill * (1. - 0.45 * up);
  // worked marble's low soft sheen where the sun's light glances off a face: by the face's turn between the sun's
  // line and the line of sight (its angle only); strongest where the sun grazes; the old floor is nearly matt
  if (vJt.x < 9.5) {
    float nl = max(dot(nW, uSunDir), 0.), gs = clamp(dot(nW, aNrm(inverseTransformDirection(aNrm(vViewPosition), viewMatrix) + uSunDir)), 0., 1.);
    gs *= gs; gs *= gs; gs *= gs;
    reflectedLight.directSpecular += reflectedLight.directDiffuse * (0.26 * gs / max(nl, 0.25)) * (1. - 0.85 * aOld);
  }
  if (vJt.x > 2.5) {
    vec3 vW = inverseTransformDirection(aNrm(vViewPosition), viewMatrix);
    float fr = clamp(1. - dot(nW, vW), 0., 1.); fr = fr * fr * fr * fr;
    vec3 rW = reflect(-vW, nW);
    float g = clamp(dot(aNrm(rW * vec3(1., 0.35, 1.)), aNrm(uSunDir * vec3(1., 0.35, 1.))), 0., 1.);
    // (wool and leaves are matt; the old floor nearly so)
    reflectedLight.indirectSpecular += uSheen * fr * (0.25 + 0.75 * g * g * g) * (1. - 0.85 * aOld) * (1. - step(10.5, vJt.x) * step(vJt.x, 11.5));
    // polished wood, bronze and gold (kind 10; jt.y is the polish) give the sky back in their own colour
    // (in the well only what is turned up to the open sky gives it back, and most what gives back the sky straight
    // overhead, the brightest the well's mouth shows: a bowl's level rim; and where a polished face turns the lit
    // wall's light to the eye it gleams with that, dimly, in its own colour)
    if (vJt.x > 9.5 && vJt.x < 10.5) {
      reflectedLight.indirectSpecular += uSheen * vJt.y * mix(vec3(1.), material.diffuseColor * 4.0, 0.75) * (0.35 + 0.65 * g * g) * mix(1., clamp(0.15 + 1.4 * rW.y, 0., 1.) * (1. + 2.5 * smoothstep(0.35, 0.9, rW.y)), aWell);
      float gw = clamp(dot(rW, aNrm(uWellAt - vLP)), 0., 1.); gw *= gw; gw *= gw;
      reflectedLight.indirectSpecular += aWell * uWell.rgb * vJt.y * material.diffuseColor * (7.0 * gw);
      // (under the roof a polished face gives back the lit porch before it, the sunlit floor and the bright sky
      // between the columns, in its own colour: most where it turns that light toward the sun's side)
      reflectedLight.indirectSpecular += (uBounce + 2.0 * uWarm) * material.diffuseColor * (rIn * vJt.y * (0.3 + 0.7 * g * g));
#ifdef ARTEMIS_GLOW
      // (and the world's glow, where a polished face turns it to the eye)
      float gG = clamp(dot(rW, gL), 0., 1.); gG *= gG; gG *= gG;
      reflectedLight.indirectSpecular += uGlowCol * material.diffuseColor * (gF * vJt.y * 1.5 * gG);
#endif
    }
  }
  // kind 12: a small flame shows by its own colour (jt.y: how bright) and takes no light
  if (vJt.x > 11.5 && vJt.x < 12.5) {
    reflectedLight.directDiffuse = vec3(0.); reflectedLight.directSpecular = vec3(0.); reflectedLight.indirectDiffuse = vec3(0.); reflectedLight.indirectSpecular = vec3(0.);
    totalEmissiveRadiance += vColor * vJt.y;
  }
}
`;
function makeMarble(U, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.7, metalness: 0 });
  // the sheet is also a plain property of the material, so that the engine's clearing sees it; the part's dispose frees it too
  if (o.relief) { mat.defines = { ARTEMIS_RELIEF: '' }; mat.reliefSheet = o.relief; }
  if (U.uGlowK) mat.defines = { ...(mat.defines || {}), ARTEMIS_GLOW: '' };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSunDir = U.uSunDir; sh.uniforms.uTime = U.uTime; sh.uniforms.uWarm = U.uWarm; sh.uniforms.uCool = U.uCool; sh.uniforms.uSheen = U.uSheen; sh.uniforms.uBounce = U.uBounce; sh.uniforms.uWell = U.uWell; sh.uniforms.uWellAmb = U.uWellAmb; sh.uniforms.uWellAt = U.uWellAt; sh.uniforms.uBlade = U.uBlade; sh.uniforms.uBladeC = U.uBladeC; sh.uniforms.uShrC = U.uShrC; sh.uniforms.uBandC = U.uBandC; sh.uniforms.uLaneC = U.uLaneC; sh.uniforms.uLaneX = U.uLaneX; sh.uniforms.uRoofed = U.uRoofed;
    if (o.relief) sh.uniforms.uRelief = { value: o.relief };
    if (U.uGlowK) { sh.uniforms.uGlowAt = U.uGlowAt; sh.uniforms.uGlowCol = U.uGlowCol; sh.uniforms.uGlowR = U.uGlowR; sh.uniforms.uGlowK = U.uGlowK; }
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + MARBLE_V0).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + MARBLE_V1);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + MARBLE_F0)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + MARBLE_F1)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + MARBLE_F2)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = (vJt.x > 5.5 && vJt.x < 7.5) ? 0.62 : clamp(vJt.w, 0.08, 1.0);')
      .replace('#include <aomap_fragment>', MARBLE_F3 + '\n#include <aomap_fragment>');
  };
  mat.customProgramCacheKey = () => (o.relief ? 'artemis-marble-relief-11' : 'artemis-marble-11') + (U.uGlowK ? '-glow' : '');
  return mat;
}

// ---------- turned forms ----------
// a profile [(r, y), ...] from the bottom up, turned round the Y axis; a point written twice makes a crease
function lathe(g, prof, around, o = {}) {
  const m = prof.length, cx = o.x || 0, cz = o.z || 0, y0 = o.y || 0, pn = [], first = g.count;
  for (let i = 0; i < m; i++) {
    let ax = 0, ay = 0;
    for (const k of [i - 1, i]) { if (k < 0 || k >= m - 1) continue; const dx = prof[k + 1][0] - prof[k][0], dy = prof[k + 1][1] - prof[k][1], l = Math.hypot(dx, dy); if (l < 1e-6) continue; ax += dy / l; ay += -dx / l; }
    const l = Math.hypot(ax, ay) || 1; pn.push([ax / l, ay / l]);
  }
  for (let i = 0; i < m; i++) for (let j = 0; j < around; j++) {
    const a = (j / around) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), mod = o.mod ? o.mod(i, j) : null;
    const r = prof[i][0] + (mod ? mod[0] : 0);
    g.v(cx + c * r, y0 + prof[i][1], cz + s * r, c * pn[i][0], pn[i][1], s * pn[i][0], (mod && mod[1]) || prof[i][2]);
  }
  for (let i = 0; i < m - 1; i++) {
    if (Math.hypot(prof[i + 1][0] - prof[i][0], prof[i + 1][1] - prof[i][1]) < 1e-6) continue;
    for (let j = 0; j < around; j++) { const a = first + i * around + j, b = first + i * around + (j + 1) % around, c = b + around, d = a + around; g.tri(a, d, c); g.tri(a, c, b); }
  }
  return g;
}

// ---------- the shaft ----------
const MARBLE = [0.585, 0.605, 0.645], shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// the court's fine walls: a paler, warmer white than the weathered outside
const COURT_WHITE = [0.672, 0.648, 0.598];
// radius of a shaft at t (0 foot, 1 top): the taper with a gentle swelling
const shaftR = (t) => R_FOOT + (R_TOP - R_FOOT) * t + 0.013 * Math.sin(Math.PI * t);
// A shaft of length L standing on y 0. real: 24 flutes as geometry (hs segments across a hollow, flat fillets between,
// rounded ends); else a round shaft of `around` sides whose flutes the marble shader draws (jt.z carries their strength).
function makeShaft(L, o = {}) {
  const g = makeG(), K = o.run || 3, D = 0.36, FIL = 0.2, yb = 0.13, yt = L - 0.12, hEnd = 0.1;
  const rAt = (y) => shaftR(y / L);
  // the rings: [y, s (how open the flute is, 0 to 1), radius]
  const rings = [[0, 0, rAt(0) + 0.055], [yb, o.plain ? 1 : 0, rAt(yb) + 0.003]];
  const ends = [[0.3, 0.71], [1, 1]], endsTop = o.plainTop ? [[1, 1]] : ends;
  if (o.real) for (const [u, s] of ends) rings.push([yb + hEnd * u, s, 0]);
  else if (!o.plain) rings.push([yb + hEnd, 1, 0]);
  if (!o.plain) for (let k = 1; k < K; k++) rings.push([yb + hEnd + (yt - yb - 2 * hEnd) * k / K, 1, 0]);
  if (o.real) for (const [u, s] of endsTop.slice().reverse()) rings.push([yt - hEnd * u, s, 0]);
  else if (!o.plain) rings.push([yt - hEnd, 1, 0]);
  rings.push([yt, o.plain ? 1 : 0, rAt(yt) + 0.002], [L, 0, rAt(L) + 0.022]);
  for (const r of rings) if (!r[2]) r[2] = rAt(r[0]);
  const nr = rings.length;
  if (!o.real) {
    const A = o.around || 16;
    for (let i = 0; i < nr; i++) {
      const [y, s, r] = rings[i], slope = i === 0 ? 0.45 : i === nr - 1 ? -0.18 : (R_FOOT - R_TOP) / L;
      g.jt(2, 1.72, s, 0.62);
      for (let j = 0; j < A; j++) { const a = (j / A) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), l = Math.hypot(1, slope); g.v(c * r, y, sn * r, c / l, slope / l, sn / l, MARBLE); }
    }
    for (let i = 0; i < nr - 1; i++) for (let j = 0; j < A; j++) { const a = i * A + j, b = i * A + (j + 1) % A, c = b + A, d = a + A; g.tri(a, d, c); g.tri(a, c, b); }
    return g.build();
  }
  const hs = o.hs || 3, per = 2 + hs + 1, alpha = 2 * Math.atan(2 * D), dl = (Math.PI * 2) / FLUTES, hollowC = shade(MARBLE, 0.78);
  g.jt(2, 1.72, 0, 0.62);
  for (let i = 0; i < nr; i++) {
    const [y, s, r] = rings[i], slope = i === 0 ? 0.45 : i === nr - 1 ? -0.18 : (R_FOOT - R_TOP) / L;
    // how steeply the flute's end curves out of the shaft at this ring (0 in the run)
    const u = i < nr / 2 ? 1 - (y - yb) / hEnd : 1 - (yt - y) / hEnd, uu = Math.min(0.93, Math.max(0, u));
    const psi = s > 0 && s < 1 ? Math.atan(0.74 * uu / Math.sqrt(1 - uu * uu)) * (i < nr / 2 ? 1 : -1) : 0;
    for (let k = 0; k < FLUTES; k++) {
      const mid = (k + FIL + (1 - FIL) / 2) * dl, half = (1 - FIL) / 2 * dl * s, a0 = (k - 1 + FIL + (1 - FIL) / 2) * dl + (1 - FIL) / 2 * dl * s, a1 = mid - half;
      // the fillet: from the end of the hollow before to the start of this one
      for (const a of [a0, a1]) { const c = Math.cos(a), sn = Math.sin(a), l = Math.hypot(1, slope); g.v(c * r, y, sn * r, c / l, slope / l, sn / l, MARBLE); }
      // the hollow: an arc of a circle seen from above, hs segments
      const chord = 2 * r * Math.sin(half), Ra = chord / (2 * Math.sin(alpha));
      for (let h = 0; h <= hs; h++) {
        const th = -alpha + (2 * alpha * h) / hs, lat = Ra * Math.sin(th), dep = Ra * (Math.cos(th) - Math.cos(alpha));
        const c = Math.cos(mid), sn = Math.sin(mid);
        // across the hollow: along the tangent at its middle; in: toward the axis
        const px = c * (r * Math.cos(half) - dep) - sn * lat, pz = sn * (r * Math.cos(half) - dep) + c * lat;
        const tilt = th * Math.min(1, s * 2.5), ct = Math.cos(tilt), st = Math.sin(tilt), fr = Math.cos(th) > Math.cos(alpha) ? (Math.cos(th) - Math.cos(alpha)) / (1 - Math.cos(alpha)) : 0;
        let nx = c * ct + sn * st, nz = sn * ct - c * st, ny = slope * 0.5 + Math.sin(psi * fr); const hl = Math.cos(psi * fr);
        nx *= hl; nz *= hl; const l = Math.hypot(nx, ny, nz) || 1;
        g.v(px, y, pz, nx / l, ny / l, nz / l, s > 0 ? [MARBLE[0] + (hollowC[0] - MARBLE[0]) * fr * s, MARBLE[1] + (hollowC[1] - MARBLE[1]) * fr * s, MARBLE[2] + (hollowC[2] - MARBLE[2]) * fr * s] : MARBLE);
      }
    }
  }
  const ringN = FLUTES * per;
  for (let i = 0; i < nr - 1; i++) for (let k = 0; k < FLUTES; k++) {
    const o0 = i * ringN + k * per;
    const q = (j0, j1) => { const a = o0 + j0, b = o0 + j1, c = b + ringN, d = a + ringN; g.tri(a, d, c); g.tri(a, c, b); };
    q(0, 1);
    for (let h = 0; h < hs; h++) q(2 + h, 3 + h);
  }
  return g.build();
}

// ---------- the base ----------
const BLUE = [0.035, 0.13, 0.5], RED = [0.4, 0.055, 0.04], GOLD = [0.75, 0.52, 0.16];
const mixC = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const HOLLOW_RED = mixC(MARBLE, RED, 0.75);
// a cushion moulding with level flutes: nf hollows across its bulge
function torusPts(rc, yc, a, b, nf, dep) {
  const out = [];
  for (let i = 0; i <= 2 * nf; i++) { const ph = (-80 + (160 * i) / (2 * nf)) * Math.PI / 180; out.push([rc + a * Math.cos(ph) - (i % 2 ? dep : 0), yc + b * Math.sin(ph), i % 2 ? shade(MARBLE, 0.76) : MARBLE]); }
  return out;
}
const bead = (r, y, h, n) => { const out = []; for (let k = 0; k < n; k++) out.push([r, y + (h * k) / n], [r + 0.03, y + (h * (k + 0.5)) / n]); out.push([r, y + h]); return out; };
const scotia = (r0, y0, r1, y1, deep, n) => { const out = [[r0, y0], [r0, y0]];
  for (let k = 1; k < n; k++) { const t = k / n; out.push([r0 + (r1 - r0) * t - deep * Math.sin(Math.PI * t) - 0.02, y0 + (y1 - y0) * t, HOLLOW_RED]); }
  out.push([r1, y1], [r1, y1]); return out; };
// the Ionic base of this temple: two hollows between rings, then a cushion with level flutes; 0.98 m on the plinth
function baseProfile(lod) {
  if (lod === 0) return [[1.2, 0], ...bead(1.215, 0, 0.1, 1), ...scotia(1.2, 0.1, 1.17, 0.25, 0.05, 3), ...bead(1.165, 0.25, 0.1, 1),
    ...scotia(1.15, 0.35, 1.115, 0.5, 0.05, 3), ...bead(1.115, 0.5, 0.05, 1), [1.02, 0.55], ...torusPts(1.0, 0.75, 0.185, 0.2, 5, 0.036), [0.99, 0.95], [0.985, 0.98]];
  if (lod === 1) return [[1.215, 0], [1.245, 0.05], [1.2, 0.1], [1.115, 0.175, HOLLOW_RED], [1.17, 0.25], [1.195, 0.3], [1.15, 0.35], [1.065, 0.425, HOLLOW_RED],
    [1.115, 0.5], [1.145, 0.525], [1.03, 0.56], [1.15, 0.65], [1.185, 0.75], [1.15, 0.85], [1.03, 0.94], [0.985, 0.98]];
  return [[1.23, 0], [1.2, 0.1], [1.1, 0.3], [1.185, 0.75], [0.985, 0.98]];
}
// the smaller moulding between a carved drum and its shaft: 0.37 m
const upperBaseProfile = () => [[0.9, 0], ...bead(0.935, 0, 0.06, 1), [0.93, 0.06], [0.9, 0.105, HOLLOW_RED], [0.915, 0.15], ...bead(0.915, 0.15, 0.05, 1),
  [0.93, 0.2], ...torusPts(0.86, 0.275, 0.14, 0.075, 2, 0.022), [0.94, 0.35], [0.977, 0.37]];
const BASE_H = 0.98, UPPER_H = 0.37;
function makeBase(prof, around) { const g = makeG(); g.jt(0, 0, 0, 0.6).col(MARBLE); lathe(g, prof, around); return g.build(); }

// ---------- the capital: two scrolls joined by a cushion, an egg moulding between them, a thin moulded slab ----------
// Its own axes: the scrolls spread along X, the two faces look along +Z and -Z; y 0 is the top of the shaft.
const CAP_H = 0.82, EYE_S = 0.853, EYE_Y = 0.22, VOL_F = 0.845, VOL_R0 = 0.5, VOL_RE = 0.07;
function makeCapital(o) {
  const g = makeG(), N = o.n, turns = 2.5, M = Math.round(N * turns), w = 0.05, d = 0.04;
  const floorC = mixC(MARBLE, BLUE, 0.92), eyeC = mixC(MARBLE, RED, 0.9), rimC = MARBLE;
  g.jt(0, 0, 0, 0.6).col(MARBLE);
  const oq = (a, b, c, e, ref, ca, cb) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2];
    const dot = (uy * vz - uz * vy) * ref[0] + (uz * vx - ux * vz) * ref[1] + (ux * vy - uy * vx) * ref[2];
    if (dot >= 0) g.quad(a, b, c, e, ca, ca, cb || ca, cb || ca); else g.quad(e, c, b, a, cb || ca, cb || ca, ca, ca); };
  const rOf = (th) => VOL_R0 - (VOL_R0 - VOL_RE) * th / (turns * Math.PI * 2);
  for (const ss of [-1, 1]) for (const sf of [-1, 1]) {
    const ref = [0, 0, sf], P = (th, r, dep) => [ss * (EYE_S + r * Math.sin(th)), EYE_Y + r * Math.cos(th), sf * dep];
    if (!o.spiral) {
      // far form: a round face with a raised rim and a painted eye
      const A = o.n;
      for (let i = 0; i < A; i++) { const t0 = (i / A) * Math.PI * 2, t1 = ((i + 1) / A) * Math.PI * 2, R = 0.455, yo = 0.04;
        const Q = (t, r, dep) => [ss * (EYE_S + r * Math.sin(t)), EYE_Y + yo + r * Math.cos(t), sf * dep];
        // the plain form: a rim and a sunk middle only
        if (o.plain) { oq(Q(t0, R, VOL_F), Q(t1, R, VOL_F), Q(t1, R * 0.62, VOL_F), Q(t0, R * 0.62, VOL_F), ref, rimC, floorC); oq(Q(t0, R * 0.62, VOL_F), Q(t1, R * 0.62, VOL_F), Q(t1, 0.001, VOL_F), Q(t0, 0.001, VOL_F), ref, floorC, RED); continue; }
        oq(Q(t0, R, VOL_F), Q(t1, R, VOL_F), Q(t1, R * 0.8, VOL_F), Q(t0, R * 0.8, VOL_F), ref, rimC);
        oq(Q(t0, R * 0.8, VOL_F), Q(t1, R * 0.8, VOL_F), Q(t1, R * 0.52, VOL_F - d), Q(t0, R * 0.52, VOL_F - d), ref, floorC);
        oq(Q(t0, R * 0.52, VOL_F - d), Q(t1, R * 0.52, VOL_F - d), Q(t1, R * 0.4, VOL_F), Q(t0, R * 0.4, VOL_F), ref, rimC);
        oq(Q(t0, R * 0.4, VOL_F), Q(t1, R * 0.4, VOL_F), Q(t1, 0.001, VOL_F), Q(t0, 0.001, VOL_F), ref, rimC, RED); }
      continue;
    }
    for (let i = 0; i < M; i++) {
      const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2, r0 = rOf(t0), r1 = rOf(t1), last = i >= M - N;
      const n0 = last ? VOL_RE : rOf(t0 + Math.PI * 2), n1 = last ? VOL_RE : rOf(t1 + Math.PI * 2);
      oq(P(t0, r0, VOL_F), P(t1, r1, VOL_F), P(t1, r1 - w, VOL_F), P(t0, r0 - w, VOL_F), ref, rimC);
      oq(P(t0, r0 - w, VOL_F), P(t1, r1 - w, VOL_F), P(t1, r1 - w - 0.02, VOL_F - d), P(t0, r0 - w - 0.02, VOL_F - d), ref, rimC, last ? eyeC : floorC);
      if (o.quads > 3) {
        oq(P(t0, r0 - w - 0.02, VOL_F - d), P(t1, r1 - w - 0.02, VOL_F - d), P(t1, n1 + 0.018, VOL_F - d), P(t0, n0 + 0.018, VOL_F - d), ref, floorC);
        oq(P(t0, n0 + 0.018, VOL_F - d), P(t1, n1 + 0.018, VOL_F - d), P(t1, n1, last ? VOL_F - d : VOL_F), P(t0, n0, last ? VOL_F - d : VOL_F), ref, floorC, last ? floorC : rimC);
      } else oq(P(t0, r0 - w - 0.02, VOL_F - d), P(t1, r1 - w - 0.02, VOL_F - d), P(t1, n1, last ? VOL_F - d : VOL_F), P(t0, n0, last ? VOL_F - d : VOL_F), ref, last ? eyeC : floorC, last ? eyeC : rimC);
    }
    // the eye: a small boss, red with a gilt middle
    for (let i = 0; i < 6; i++) { const t0 = (i / 6) * Math.PI * 2, t1 = ((i + 1) / 6) * Math.PI * 2;
      oq(P(t0, VOL_RE, VOL_F - d), P(t1, VOL_RE, VOL_F - d), P(t1, VOL_RE * 0.8, VOL_F + 0.01), P(t0, VOL_RE * 0.8, VOL_F + 0.01), ref, RED);
      oq(P(t0, VOL_RE * 0.8, VOL_F + 0.01), P(t1, VOL_RE * 0.8, VOL_F + 0.01), P(t1, 0.001, VOL_F + 0.01), P(t0, 0.001, VOL_F + 0.01), ref, RED, GOLD); }
  }
  // the rolls that join the front scroll to the back one on each side, drawn in at the middle
  const nb = o.roll || 10, nfz = o.rollF || 4;
  for (const ss of [-1, 1]) for (let i = 0; i < nb; i++) for (let k = 0; k < nfz; k++) {
    const th = (i) => (-0.06 + (0.9 * i) / nb) * Math.PI * 2, fz = (k) => -VOL_F + (2 * VOL_F * k) / nfz;
    const waist = (f) => 0.74 + 0.26 * Math.pow(Math.abs(f) / VOL_F, 1.6);
    const B = (i, k) => { const t = th(i), f = fz(k), r = (o.spiral ? rOf(Math.max(0, t)) : 0.455) * waist(f) + (o.spiral ? 0 : 0); return [ss * (EYE_S + r * Math.sin(t)), EYE_Y + (o.spiral ? 0 : 0.04) + r * Math.cos(t), f]; };
    const tm = th(i + 0.5);
    oq(B(i, k), B(i + 1, k), B(i + 1, k + 1), B(i, k + 1), [ss * Math.sin(tm), Math.cos(tm), 0], MARBLE);
  }
  // the egg moulding on the shaft's top, with a bead under it: eggs white on a blue ground
  const A = o.eggs, egg = shade(MARBLE, 1.0);
  if (o.plain) lathe(g, [[0.74, 0, MARBLE], [0.955, 0.24], [0.9, 0.335, MARBLE]], A, { mod: (i, j) => (i === 1 ? (j % 2 ? [-0.022, [0.13, 0.26, 0.56]] : [0.012, egg]) : null) });
  else {
    lathe(g, [[0.7, 0], [0.757, 0], [0.787, 0.03], [0.757, 0.06]], 12);
    lathe(g, [[0.772, 0.06, MARBLE], [0.85, 0.14], [0.955, 0.24], [0.985, 0.31, MARBLE], [0.9, 0.335, MARBLE]], A, {
      mod: (i, j) => (i === 1 || i === 2 ? (j % 2 ? [-0.022, [0.13, 0.26, 0.56]] : [0.012, egg]) : null) });
  }
  // the cushion between the scrolls: a band with a fillet above and below and a hollow between, set a little behind the scrolls' faces
  const cf = VOL_F - 0.05, bandC = mixC(MARBLE, BLUE, o.paint || 0);
  for (const sf of [-1, 1]) {
    const ref = [0, 0, sf], X = EYE_S, Q = (x, y, dep) => [x, y, sf * dep];
    if (o.plain) { oq(Q(-X, 0.335, cf), Q(X, 0.335, cf), Q(X, 0.72, cf), Q(-X, 0.72, cf), ref, bandC); continue; }
    oq(Q(-X, 0.675, cf), Q(X, 0.675, cf), Q(X, 0.72, cf), Q(-X, 0.72, cf), ref, MARBLE);
    oq(Q(-X, 0.645, cf - 0.03), Q(X, 0.645, cf - 0.03), Q(X, 0.675, cf), Q(-X, 0.675, cf), ref, bandC, MARBLE);
    oq(Q(-X, 0.43, cf - 0.03), Q(X, 0.43, cf - 0.03), Q(X, 0.645, cf - 0.03), Q(-X, 0.645, cf - 0.03), ref, bandC);
    oq(Q(-X, 0.4, cf), Q(X, 0.4, cf), Q(X, 0.43, cf - 0.03), Q(-X, 0.43, cf - 0.03), ref, MARBLE, bandC);
    oq(Q(-X, 0.335, cf), Q(X, 0.335, cf), Q(X, 0.4, cf), Q(-X, 0.4, cf), ref, MARBLE);
  }
  // its underside between the rolls, and the slab on top: a small swelling moulding
  g.col(shade(MARBLE, 0.9)); g.quad([-EYE_S, 0.335, -cf], [EYE_S, 0.335, -cf], [EYE_S, 0.335, cf], [-EYE_S, 0.335, cf]);
  // (the slab's top lies under the beam and is not made)
  g.col(MARBLE);
  // (the slab's edge is painted red)
  if (o.plain) g.col(mixC(MARBLE, RED, 0.85)).ring([-0.86, 0.86, -0.85, 0.85], [[0.07, 0.72], [0.07, CAP_H]]);
  else g.col(mixC(MARBLE, RED, 0.85)).ring([-0.86, 0.86, -0.85, 0.85], [[0, 0.72], [0.045, 0.75], [0.07, 0.79], [0.07, CAP_H]], { smooth: true });
  g.col(MARBLE);
  g.quad([-0.93, 0.72, -0.92], [0.93, 0.72, -0.92], [0.93, 0.72, 0.92], [-0.93, 0.72, 0.92]);
  return g.build();
}

// ---------- the carved feet: OUR OWN standing draped figures in low relief ----------
// One sheet, 2048 by 1024: its first 512 rows hold two drum fields side by side, each HALF of a
// drum's round (the half is carved twice round a drum: the two halves are never seen together); its last 512 rows hold
// four pedestal faces. Every figure is built here from plain rules: a rounded body under cloth, the weight on one
// leg, fine folds that follow the body, round arms, a small plain head on a neck (NO face). Eight kinds that differ
// in outline: a robed woman with an overfold and a belt; a veiled one with a hand at her veil; one with an arm
// raised; a taller one in a mantle on a slant, the head turned; a walker seen from the side; a youth in a knee tunic;
// one leaning on a plain staff; a woman and a youth half before her as a pair. No scene, nothing copied, nothing
// carried but the staff. They are dealt by ONE fixed stream: the temple never varies.
// The sheet stores, per texel: the slope of the relief across and up (for the light), where a breath of old colour
// lies (1: dark red on a belt, a hem or a mantle's edge; one half: red ochre on hair), and the height.
const REL_W = 2048, REL_H = 1024, REL_MAX = 0.055, DRUM_TILE = [Math.PI * 0.865, 1.63], PED_FIELD = [1.61, 1.59];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bell = (v) => { const a = 1 - v * v; return a > 0 ? a * a : 0; };
const tab = (T, t) => { if (t <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (t <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (t - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; };
const FIG_W = {
  robe: [[0, 0.13], [0.05, 0.134], [0.3, 0.12], [0.5, 0.115], [0.63, 0.094], [0.74, 0.108], [0.8, 0.122]],
  man: [[0, 0.116], [0.05, 0.12], [0.3, 0.112], [0.5, 0.11], [0.63, 0.1], [0.74, 0.118], [0.8, 0.135]],
  veil: [[0.56, 0.1], [0.62, 0.128], [0.8, 0.134], [0.86, 0.09], [0.93, 0.08], [0.985, 0.05], [1.012, 0]],
  youth: [[0.4, 0.125], [0.55, 0.108], [0.64, 0.094], [0.78, 0.116]],
  front: [[0, 0.17], [0.06, 0.165], [0.3, 0.1], [0.5, 0.072], [0.63, 0.062], [0.72, 0.08], [0.8, 0.07]],
  back: [[0, 0.118], [0.06, 0.114], [0.3, 0.086], [0.5, 0.076], [0.63, 0.058], [0.8, 0.066]],
  deep: [[0, 0.72], [0.3, 0.9], [0.5, 1], [0.76, 1], [0.86, 0.82]],
};
// the arms of a figure, as chains of round limbs: points in shares of the figure's height, from the shoulder
const ARM = {
  down: [[0.105, 0.8], [0.126, 0.62], [0.118, 0.47]], fold: [[0.105, 0.8], [0.132, 0.63], [0.1, 0.5]], waist: [[0.105, 0.8], [0.13, 0.62], [0.02, 0.635]],
  chest: [[0.105, 0.8], [0.136, 0.63], [0.05, 0.79]], raised: [[0.105, 0.805], [0.2, 0.745], [0.215, 0.93]], hip: [[0.105, 0.8], [0.19, 0.66], [0.1, 0.565]],
  staff: [[0.105, 0.8], [0.15, 0.66], [0.2, 0.76]], forward: [[0, 0.8], [0.02, 0.63], [0.17, 0.665]], under: [[0.105, 0.8], [0.128, 0.64], [0.06, 0.66]],
};
// the seven kinds: which arms, what is worn
// every kind has the same fields, so that the drawing code meets one shape of object only
const figKind = (arms, f = {}) => ({ arms, over: !!f.over, belt: !!f.belt, veil: !!f.veil, mantle: !!f.mantle, turned: !!f.turned, side: !!f.side, youth: !!f.youth, tall: f.tall || 1, hip: f.hip || 1 });
// 0 a robed woman with an overfold and a belt, 1 a veiled woman, 2 one arm raised, 3 a mantle drawn across on a slant and
// the head turned, 4 a walker seen from the side, 5 a youth in a short tunic, 6 a man leaning on a plain staff
const FIG_KIND = [
  figKind(['down', 'fold'], { over: 1, belt: 1 }), figKind(['chest', 'under'], { veil: 1 }), figKind(['raised', 'waist'], { over: 1 }),
  figKind(['under', 'down'], { mantle: 1, turned: 1, tall: 1.04 }), figKind(['forward'], { side: 1 }), figKind(['down', 'waist'], { youth: 1, belt: 1, tall: 0.7 }),
  figKind(['staff', 'hip'], { belt: 1, hip: 1.9 }),
];
const FOLD = new Float32Array(256), WAVE = new Float32Array(256), ROW_H = new Float32Array(1024), ROW_M = new Uint8Array(1024);
for (let i = 0; i < 256; i++) { const c = 0.5 + 0.5 * Math.cos(i * 0.02454369); WAVE[i] = c; FOLD[i] = c * c * c * c; }
// the middle line of a figure at the height t (0 the ground, 1 the crown), in parts of its height
function figMid(o, K, t) {
  if (K.side) return o.side * 0.012 * sstep(0.5, 0.9, t);
  return o.side * (0.016 * K.hip * bell((t - 0.5) / 0.26) - 0.01 * bell((t - 0.8) / 0.2)) + o.lean * (t - 0.4);
}
// the round limbs of one figure as chains of points [x, y, radius]: [points, lift, plain, x0, x1, y0, y1], and its head
function figParts(o) {
  const K = FIG_KIND[o.kind], T = o.T, sd = o.side, G = 0.035, side = K.side, youth = K.youth, veil = K.veil;
  const m8 = figMid(o, K, 0.8) * T, m0 = figMid(o, K, 0.02) * T, under = [], over = [];
  const chain = (list, pts, lift, plain) => {
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const p of pts) { x0 = Math.min(x0, p[0] - p[2]); x1 = Math.max(x1, p[0] + p[2]); y0 = Math.min(y0, p[1] - p[2]); y1 = Math.max(y1, p[1] + p[2]); }
    list.push([pts, lift, plain, x0, x1, y0, y1]);
  };
  // the feet under the hem (a youth's legs with them); they lie under the cloth
  const foot = (x, to, len, y) => chain(under, [[x, G + y * T, 0.019 * T], [x + to * len * T, G + (y - 0.004) * T, 0.015 * T]], 0.009, 0.006);
  if (side) { foot(m0 + sd * 0.1 * T, sd, 0.085, 0.017); foot(m0 - sd * 0.1 * T, sd, 0.075, 0.019); }
  else if (youth) for (const s of [-1, 1]) chain(under, [[m0 + s * 0.046 * T, G + 0.43 * T, 0.04 * T], [m0 + s * 0.05 * T, G + 0.27 * T, 0.03 * T], [m0 + s * 0.052 * T, G + 0.19 * T, 0.033 * T], [m0 + s * 0.054 * T, G + 0.05 * T, 0.021 * T], [m0 + s * 0.06 * T, G + 0.02 * T, 0.02 * T], [m0 + s * 0.1 * T, G + 0.016 * T, 0.016 * T]], 0.013, 0.008);
  else { foot(m0 + sd * 0.035 * T, sd * 0.25, 0.05, 0.02); foot(m0 - sd * 0.05 * T, -sd, 0.07, 0.018); }
  // the head on its neck
  const turned = K.turned ? o.turn : side ? sd : 0, hx = side ? m8 + sd * 0.03 * T : m8 + turned * 0.012 * T, hy = G + (youth ? 0.928 : 0.935) * T;
  const hrx = (turned ? 0.06 : youth ? 0.06 : veil ? 0.062 : 0.053) * T, hry = (youth ? 0.074 : veil ? 0.078 : 0.07) * T;
  if (!veil) chain(over, [[side ? m8 + sd * 0.012 * T : m8, G + 0.815 * T, 0.036 * T], [hx - turned * 0.01 * T, hy - hry * 0.9, 0.027 * T]], 0.011, 0.012);
  // a plain staff, then the arms (the hand lies on the staff)
  K.arms.forEach((name, i) => {
    const s = i ? -sd : sd, P = ARM[name], X = (p) => m8 + s * p[0] * T;
    if (name === 'staff') chain(over, [[X(P[2]) + s * 0.004 * T, G, 0.011 * T], [X(P[2]) + s * 0.004 * T, G + 0.99 * T, 0.0105 * T]], 0.011, 0.004);
  });
  K.arms.forEach((name, i) => {
    const s = i ? -sd : sd, P = ARM[name], X = (p) => m8 + s * p[0] * T, Y = (p) => G + p[1] * T, ex = X(P[2]) - X(P[1]), ey = Y(P[2]) - Y(P[1]), el = Math.sqrt(ex * ex + ey * ey) || 1;
    chain(over, [[X(P[0]), Y(P[0]), 0.034 * T], [X(P[1]), Y(P[1]), 0.0245 * T], [X(P[2]), Y(P[2]), 0.018 * T], [X(P[2]) + ex / el * 0.04 * T, Y(P[2]) + ey / el * 0.04 * T, 0.0215 * T], [X(P[2]) + ex / el * 0.062 * T, Y(P[2]) + ey / el * 0.062 * T, 0.014 * T]], name === 'under' ? 0.005 : 0.011, 0);
  });
  return { K, G, under, over, m8, turned, hx, hy, hrx, hry, bun: [hx - turned * 0.058 * T, hy + 0.006 * T, turned ? 0.026 * T : 0] };
}
// lays one chain into the row buffer over the pixels px0 to px1 of the row at the height y
function chainRow(C, y, cx, sx, px0, px1) {
  const pts = C[0], lift = C[1], plain = C[2], a = Math.max(px0, Math.floor((cx + C[3]) * sx)), b = Math.min(px1, Math.ceil((cx + C[4]) * sx));
  for (let px = a; px <= b; px++) {
    const x = (px + 0.5) / sx - cx; let best = 1;
    for (let k = 1; k < pts.length; k++) {
      const A = pts[k - 1], B = pts[k], bx = B[0] - A[0], by = B[1] - A[1];
      let tt = ((x - A[0]) * bx + (y - A[1]) * by) / (bx * bx + by * by + 1e-9); tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      const ex = x - A[0] - bx * tt, ey = y - A[1] - by * tt, r = A[2] + (B[2] - A[2]) * tt, d2 = (ex * ex + ey * ey) / (r * r);
      if (d2 < best) best = d2;
    }
    if (best >= 1) continue;
    const h0 = ROW_H[px], hl = (plain > 0 ? plain : h0 > 0.006 ? h0 * 0.92 + 0.004 : 0.011) + lift * Math.sqrt(1 - best);
    if (hl > h0) { ROW_H[px] = hl; ROW_M[px] = 0; }
  }
}
// draws the rows r0 to r1 - 1 of one figure into the height field Hf (metres) and the colour mask Rf (1 ochre, 2 red).
// reg: { x0, y0, w, h (texels), sx, sy (texels per metre), pad }; cx: the figure's middle in the field, metres;
// o: { kind, T (its height), side (the side its weight is on, or the way a walker faces), lean, turn, nf, ph, red, low };
// P: its figParts; ext: for each row of the sheet and each block of 512 texels the first and last texel written
function drawFigure(Hf, Rf, ext, reg, cx, o, P, r0, r1) {
  const K = P.K, T = o.T, sd = o.side, G = P.G, side = K.side, youth = K.youth, veil = K.veil, mantle = K.mantle, low = o.low, sx = reg.sx, red1 = o.red === 1, red2 = o.red === 2;
  const Hb = 0.031, tS = youth ? 0.78 : 0.8, kph = o.nf * 128, ph0 = o.ph * 40.74 + 4096, hemT = youth ? 0.4 : 0.02, ilk = 1 / (0.05 * T), turned = P.turned;
  const px0 = Math.max(reg.pad, Math.floor((cx - 0.3 * T) * sx)), px1 = Math.min(reg.w - 1 - reg.pad, Math.ceil((cx + 0.3 * T) * sx));
  const rowTop = Math.min(reg.h - 2, Math.ceil((G + 1.03 * T) * reg.sy)), hA = Math.max(px0, Math.floor((cx + P.hx - P.hrx) * sx)), hB = Math.min(px1, Math.ceil((cx + P.hx + P.hrx) * sx));
  for (let py = Math.max(r0, 1); py < r1 && py <= rowTop; py++) {
    const y = (py + 0.5) / reg.sy, t = (y - G) / T, m = figMid(o, K, t) * T, deep = tab(FIG_W.deep, t);
    // the body's half widths to the left and to the right of its middle line
    let wl = 0, wr = 0;
    if (t >= (youth ? 0.38 : 0) && t < tS + 0.045) {
      const q = (t - tS) / 0.045, sh = t < tS ? 1 : Math.sqrt(1 - q * q);
      if (side) { const f = t < tS ? tab(FIG_W.front, t) : 0.07 * sh, b = t < tS ? tab(FIG_W.back, t) : 0.066 * sh; if (sd > 0) { wr = f; wl = b; } else { wl = f; wr = b; } }
      else { const W = youth ? FIG_W.youth : mantle ? FIG_W.man : FIG_W.robe; wl = wr = t < tS ? tab(W, t) : W[W.length - 1][1] * sh; }
    }
    if (veil && t > 0.56 && t < 1.012) { const wv = tab(FIG_W.veil, t); if (wv > wl) wl = wr = wv; }
    if (mantle && t > 0.33 && t < 0.8) { const pnl = 0.034 * sstep(0.33, 0.4, t) * (1 - sstep(0.74, 0.8, t)); if (sd > 0) wl += pnl; else wr += pnl; }
    wl *= T; wr *= T;
    ROW_H.fill(0, px0, px1 + 1); ROW_M.fill(0, px0, px1 + 1);
    for (const C of P.under) if (y >= C[5] && y <= C[6]) chainRow(C, y, cx, sx, px0, px1);
    if (wl + wr > 0) {
      // this row's cloth: fold depth, the free leg's line (or a walker's forward leg), the lines of belt and overfold
      const amp = youth ? 0.005 : 0.0078 - 0.004 * sstep(0.05, 0.6, t), legOn = side ? sstep(0.04, 0.12, t) * (1 - sstep(0.42, 0.5, t)) : youth ? 0 : sstep(0.06, 0.16, t) * (1 - sstep(0.46, 0.56, t));
      const xk = side ? m + sd * (0.02 + 0.2 * (0.5 - t)) * T : m - sd * (0.045 + 0.03 * bell((t - 0.29) / 0.25)) * T, kneeK = 0.0055 * (0.6 + 0.4 * bell((t - 0.29) / 0.12)), slant = side ? sd * 0.5 * (0.5 - t) : 0;
      const beltB = K.belt ? bell((t - 0.635) / 0.011) : 0, upper = !mantle && !veil && t > 0.65, iwl = wl > 0 ? 1 / wl : 1e9, iwr = wr > 0 ? 1 / wr : 1e9, hb = Hb * deep, over = K.over;
      const a = Math.max(px0, Math.ceil((cx + m - wl) * sx - 0.5)), b = Math.min(px1, Math.floor((cx + m + wr) * sx - 0.5));
      for (let px = a; px <= b; px++) {
        const x = (px + 0.5) / sx - cx, dx = x - m, u = dx < 0 ? dx * iwl : dx * iwr, e = 1 - u * u;
        if (e <= 0) continue;
        const se = Math.sqrt(e), ip = (kph * (u + slant) + ph0) & 255;
        if (t < hemT + 0.012 * WAVE[ip]) continue;
        // (rounded right across, not a flat slab with a rim: half a circle's bow, half a parabola's)
        let h = hb * (0.3 + 0.35 * se + 0.35 * e), red = 0;
        const tM = mantle ? 0.6 - sd * 0.17 * u : 9, tO = over ? 0.565 + 0.011 * WAVE[(u * 384 + ph0 * 1.7) & 255] : veil ? 0.6 + 0.012 * WAVE[(u * 640 + 4137) & 255] : 0.63;
        if (t < tM && t < tO) {
          // the skirt: upright folds as fine grooves; the cloth lies smooth over the free leg
          let lm = 0;
          if (legOn > 0) { const v = (x - xk) * ilk, a2 = 1 - v * v; if (a2 > 0) lm = legOn * a2 * a2; }
          h += kneeK * lm - amp * FOLD[ip] * (0.35 + 0.65 * se) * (1 - 0.85 * lm);
          if (red2 && t < hemT + 0.045) red = 2;
        } else if (t >= tM) {
          // the mantle drawn across on a slant: a rolled edge, folds that run with it
          const dm = t - tM, q = (dm - 0.012) / 0.014, q2 = 1 - q * q;
          h += 0.0045 * (dm < 0.014 ? dm / 0.014 : 1) + (q2 > 0 ? 0.0035 * q2 * q2 : 0);
          if (dm > 0.03) h -= 0.0028 * FOLD[(dm * 6095 + u * 61 + 4096) & 255] * se;
          if (red1 && dm > 0.005 && dm < 0.019) red = 2;
        } else if (veil) h += 0.004 * (t - tO < 0.012 ? (t - tO) / 0.012 : 1) - (t > 0.62 && t < 0.9 ? 0.003 * FOLD[(u * 640 + 4137) & 255] * se : 0);
        else if (over) h += 0.0035 * (t - tO < 0.012 ? (t - tO) / 0.012 : 1);
        if (upper) h -= 0.0012 * FOLD[((0.8 - t) * 3657 - 300 * u * u + 4096) & 255] * se;
        if (beltB > 0) { h += 0.003 * beltB; if (red1 && beltB > 0.3) red = 2; }
        if (h > ROW_H[px]) { ROW_H[px] = h; ROW_M[px] = red; }
      }
    }
    for (const C of P.over) if (y >= C[5] && y <= C[6]) chainRow(C, y, cx, sx, px0, px1);
    const uy = (y - P.hy) / P.hry;
    if (uy > -1 && uy < 1) for (let px = hA; px <= hB; px++) {
      const x = (px + 0.5) / sx - cx, ux = (x - P.hx) / P.hrx, d2 = ux * ux + uy * uy;
      if (d2 >= 1) continue;
      let hh = (veil ? 0.035 : 0.04) * (0.25 + 0.75 * Math.sqrt(1 - d2));
      if (hh < ROW_H[px]) continue;
      let mk = 0;
      if (veil) { const fx = (x - P.hx) / (0.036 * T), fy = (y - P.hy + 0.006 * T) / (0.05 * T), f2 = fx * fx + fy * fy; if (f2 < 1) hh -= 0.004 * Math.min(1, (1 - f2) * 2.5); }
      else if (uy > 0.25 + 0.35 * ux * ux || ux * turned < -0.3 || (!turned && (ux > 0.8 || ux < -0.8) && uy > -0.3)) mk = 1;
      ROW_H[px] = hh; ROW_M[px] = mk;
    }
    const B = P.bun;
    if (B[2] > 0) { const by = (y - B[1]) / B[2];
      if (by > -1 && by < 1) for (let px = Math.max(px0, Math.floor((cx + B[0] - B[2]) * sx)); px <= Math.min(px1, Math.ceil((cx + B[0] + B[2]) * sx)); px++) {
        const bx = ((px + 0.5) / sx - cx - B[0]) / B[2], b2 = bx * bx + by * by;
        if (b2 < 1) { const hh = 0.03 * (0.3 + 0.7 * Math.sqrt(1 - b2)); if (hh > ROW_H[px]) { ROW_H[px] = hh; ROW_M[px] = 1; } }
      } }
    let lo = -1, hi = -1; const row = (reg.y0 + py) * REL_W + reg.x0;
    for (let px = px0; px <= px1; px++) { let h = ROW_H[px]; if (h <= 0) continue; h *= low; if (lo < 0) lo = px; hi = px; if (h > Hf[row + px]) { Hf[row + px] = h < REL_MAX ? h : REL_MAX; Rf[row + px] = ROW_M[px]; } }
    if (lo >= 0) for (let blk = (reg.x0 + lo) >> 9; blk <= (reg.x0 + hi) >> 9; blk++) { const e = ((reg.y0 + py) * 4 + blk) * 2, a = Math.max(reg.x0 + lo, blk << 9), b = Math.min(reg.x0 + hi, (blk << 9) + 511); if (a < ext[e]) ext[e] = a; if (b > ext[e + 1]) ext[e + 1] = b; }
  }
}
// packs the rows y0 to y1 - 1 of the sheet: slope across, slope up, the colour mask, the height
function packRows(bytes, Hf, Rf, ext, y0, y1) {
  const GS = 1.6;
  for (let y = y0; y < y1; y++) {
    const drum = y < 512, sx = (drum ? 1024 / DRUM_TILE[0] : 512 / PED_FIELD[0]) * 0.5 * 127.5 / GS, sy = (512 / (drum ? DRUM_TILE[1] : PED_FIELD[1])) * 0.5 * 127.5 / GS;
    const r = y * REL_W, u = (y > 0 ? y - 1 : 0) * REL_W, d = (y < REL_H - 1 ? y + 1 : y) * REL_W, hk = 255 / REL_MAX;
    for (let blk = 0; blk < 4; blk++) {
      // a row's own span and its neighbours' above and below (their heights make this row's slope)
      let a = 32767, b = -1;
      for (let k = y > 0 ? y - 1 : 0; k <= (y < REL_H - 1 ? y + 1 : y); k++) { const e = (k * 4 + blk) * 2; if (ext[e] < a) a = ext[e]; if (ext[e + 1] > b) b = ext[e + 1]; }
      for (let x = a - 1; x <= b + 1; x++) {
        const o = (r + x) * 4;
        bytes[o] = 127.5 + (Hf[r + x + 1] - Hf[r + x - 1]) * sx; bytes[o + 1] = 127.5 + (Hf[d + x] - Hf[u + x]) * sy;
        bytes[o + 2] = Rf[r + x] * 127.5; bytes[o + 3] = Hf[r + x] * hk;
      }
    }
  }
}
// deals the figures and bakes the sheet; rng: the part's one fixed stream for the carved feet.
// The sheet: rows 0 to 511 hold two drum fields side by side, each HALF a drum's round (it is carved twice round the
// drum; the two halves are never seen together); rows 512 to 1023 hold four pedestal faces.
// Each texel: slope across, slope up, the colour mask (1 red, one half ochre), the height.
async function makeReliefSheet(rng, ctx) {
  const N = REL_W * REL_H, Hf = new Float32Array(N), Rf = new Uint8Array(N);
  await ctx.yield();
  // kinds 0 to 6 are single figures (FIG_KIND); 7 is a pair: a robed woman and a youth half before her
  const deal = (n, used, ok) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      let best = [], low = 99;
      for (let k = 0; k < 8; k++) {
        if (!ok(i, k) || k === out[i - 1] || k === out[i - 2] || (i >= n - 2 && k === out[0]) || (i === n - 1 && k === out[1])) continue;
        if (used[k] < low) { low = used[k]; best = [k]; } else if (used[k] === low) best.push(k);
      }
      const k = best[Math.floor(rng() * best.length)]; out.push(k); used[k]++;
    }
    return out;
  };
  const jobs = [];
  const place = (reg, kind, cx, Tb) => {
    const side = rng() < 0.5 ? -1 : 1, lean = (rng() - 0.5) * 0.03, turn = rng() < 0.5 ? -1 : 1, nf = 5 + Math.floor(rng() * 3), ph = rng() * 6.28, r = rng(), tv = 0.96 + rng() * 0.05;
    const red = r < 0.3 ? 1 : r < 0.5 ? 2 : 0;
    if (kind === 7) {
      jobs.push([reg, cx - side * 0.1, { kind: 0, T: Tb * tv, side, lean, turn, nf, ph, red: 0, low: 0.82 }]);
      jobs.push([reg, cx + side * 0.12, { kind: 5, T: Tb * 0.7 * tv, side: -side, lean, turn, nf: 4, ph, red, low: 1 }]);
    } else jobs.push([reg, cx, { kind, T: Tb * tv * FIG_KIND[kind].tall, side, lean, turn, nf, ph, red, low: 1 }]);
  };
  // the two drum fields: four figures in the first, three in the second, all of different kinds
  const usedD = new Array(8).fill(0);
  for (let d = 0; d < 2; d++) {
    const n = d === 0 ? 4 : 3, reg = { x0: d * 1024, y0: 0, w: 1024, h: 512, sx: 1024 / DRUM_TILE[0], sy: 512 / DRUM_TILE[1], pad: 3 };
    const kinds = deal(n, usedD, (i, k) => d === 1 || k !== 7);
    // (a figure stands on a ground line 3.5 cm up and its crown or veil reaches 1.2 in a hundred over its height: with
    // these heights the tallest ends 2 cm under the field's upper edge; a grown figure is 1.42 to 1.555 m here)
    kinds.forEach((k, i) => place(reg, k, ((i + 0.5 + (rng() - 0.5) * 0.08) * DRUM_TILE[0]) / n, 1.48));
  }
  // the four pedestal faces: two figures, three, two, three; no pair where three stand
  const usedP = new Array(8).fill(0), faceOf = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3], kindsP = deal(10, usedP, (i, k) => k !== 7 || (faceOf[i] & 1) === 0);
  for (let i = 0, f = -1, j = 0; i < 10; i++) {
    if (faceOf[i] !== f) { f = faceOf[i]; j = 0; }
    const n = f & 1 ? 3 : 2, reg = { x0: f * 512, y0: 512, w: 512, h: 512, sx: 512 / PED_FIELD[0], sy: 512 / PED_FIELD[1], pad: 3 };
    place(reg, kindsP[i], ((j++ + 0.5 + (rng() - 0.5) * 0.06) * PED_FIELD[0]) / n, n === 2 ? 1.44 : 1.4);
  }
  // a rehearsal: every kind once each way, small and coarse, on a corner of the sheet that is wiped after. The browser
  // then makes its fast code for the drawing once, with every case seen, and the real figures do not wait on it
  const ext = new Int16Array(REL_H * 8), trial = { x0: 0, y0: 0, w: 64, h: 64, sx: 20, sy: 40, pad: 1 };
  for (let k = 0; k < 14; k++) { const o = { kind: k >> 1, T: 1.42, side: k & 1 ? 1 : -1, lean: 0.01, turn: k & 1 ? -1 : 1, nf: 5 + (k % 3), ph: k * 0.9, red: k % 3, low: k & 1 ? 1 : 0.82 }; for (let r0 = 0; r0 < 64; r0 += 32) { drawFigure(Hf, Rf, ext, trial, 1.3, o, figParts(o), r0, r0 + 32); await ctx.yield(); } }
  Hf.fill(0, 0, 64 * REL_W); Rf.fill(0, 0, 64 * REL_W);
  for (let i = 0; i < ext.length; i += 2) { ext[i] = 32767; ext[i + 1] = -1; }
  for (const [reg, cx, o] of jobs) { const P = figParts(o); for (let r0 = 0; r0 < reg.h; r0 += 24) { drawFigure(Hf, Rf, ext, reg, cx, o, P, r0, r0 + 24); await ctx.yield(); } }
  // pack: the bare ground everywhere first, then only where figures stand, in bands of rows so that no step is long
  const bytes = new Uint8ClampedArray(N * 4);
  new Uint32Array(bytes.buffer).fill(0x00007f7f);
  await ctx.yield();
  for (let y0 = 0; y0 < REL_H; y0 += 8) { packRows(bytes, Hf, Rf, ext, y0, y0 + 8); await ctx.yield(); }
  const data = new Uint8Array(bytes.buffer);
  return data;
}

// ---------- which column gets which form ----------
// A rule of the TEMPLE, the same on both sides of its long axis: the full form (flutes as geometry, the modelled base,
// the scrolls) on the two west rows, the porch and the first four columns of each of the four flank rows; a middle
// form on the next three columns of each flank row (the rest of the west third); a plain form beyond. No form is
// chosen while the world runs.
function columnPlan(cols) {
  return cols.map(([x, z, r, carved]) => {
    const flank = x > 6.5 && x < 96 && Math.abs(z) > 17;
    const inner = (Math.abs(Math.abs(z) - 17.735) < 0.01 && x > 5 && x < 97) || ((Math.abs(x - 6) < 0.01 || Math.abs(x - 96.16) < 0.01) && Math.abs(z) < 17.8);
    const lod = carved || x < 28 ? 0 : x < 43.5 ? 1 : 2;
    return { x, z, carved, lod, rot: flank ? 0 : Math.PI / 2, thin: inner ? 1.75 / 1.84 : 1 };
  });
}

export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group(); object.name = 'temple-of-artemis';
  // (with no sunDir given: the sun the court is built for, low over the front on the long axis, 12.75 degrees high)
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.9753, 0.2207, 0)).normalize();
  const sunColor = new THREE.Color(opts.sunColor !== undefined ? opts.sunColor : '#fff0d2');
  const fillK = opts.fill !== undefined ? opts.fill : 1, wellK = opts.well !== undefined ? opts.well : 1;
  // the light in the well: where the sun, coming over the roof, lies on the court's upper walls. On the wall the light
  // travels toward (east, by the design) it lies above the west roof's shadow; the middle of that lit field, drawn a
  // little toward the side wall the sun also reaches, is the place the warm light comes back from.
  const sunH = Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), sunTan = sunDir.y / sunH, wellSide = sunDir.z > 0 ? -1 : 1, wellEast = sunDir.x < 0;
  const wellEdge = RIDGE - SLOPE * Math.abs(4 * wellSide + (CRT_X1 - CRT_X0) * sunDir.z / Math.max(1e-3, Math.abs(sunDir.x))) - ((CRT_X1 - CRT_X0) / Math.max(1e-3, Math.abs(sunDir.x) / sunH)) * sunTan;
  const wellAt = new THREE.Vector3(wellEast ? CRT_X1 - 2.5 : CRT_X0 + 2.5, (Math.min(RIDGE - 2, Math.max(6, wellEdge)) + RIDGE - 1) / 2, 4 * wellSide);
  // THE BLADE: the sun through the great door. Its foot is where the line over the sill's court edge comes down on
  // the old floor; it runs on along the sun's line to the shrine's steps (or to a side wall). bladeK: how much of a
  // blade lies on the floor (by its length); shrK: how much of the shrine's front stands in it (the line under the
  // front beam's underside, the blade's sideways walk at the shrine).
  const bladeOn = sunDir.x < -0.05, bladeT = (FLOOR + 0.03 - COURT) / Math.max(1e-3, sunDir.y), bsl = bladeOn ? sunDir.z / sunDir.x : 0;
  const bladeA = [CRT_X0 - sunDir.x * bladeT, -sunDir.z * bladeT], bladeBx = Math.min(55.05, bladeA[0] + Math.max(0, (CRT_HALF - 1 - Math.abs(bladeA[1])) / Math.max(1e-3, Math.abs(bsl))));
  const bladeB = [bladeBx, bladeA[1] + (bladeBx - bladeA[0]) * bsl];
  const bladeK = bladeOn && Math.abs(bladeA[1]) < CRT_HALF - 1 ? Math.min(1.3, Math.max(0, bladeBx - bladeA[0]) / 8) : 0;
  const shrTop = bladeOn ? CAP_TOP - (56.3 + 0.75) * sunDir.y / -sunDir.x : 0;
  const shrK = bladeOn ? Math.min(1, Math.max(0, (shrTop - 0.9) / 6)) * Math.min(1, Math.max(0, 1.5 - Math.abs((56.3 - 32.84) * bsl) / 2.5)) : 0;
  const bladeC = new THREE.Color(0.1 + 0.9 * sunColor.r, 0.1 + 0.9 * sunColor.g, 0.1 + 0.9 * sunColor.b);
  const U = {
    uSunDir: { value: sunDir }, uTime: { value: 0 },
    // (the part's own soft sky light; opts.fill scales these three and nothing in the well but the sky's own share)
    uWarm: { value: new THREE.Color(0.2, 0.18, 0.15).multiply(sunColor).multiplyScalar(fillK) },
    uCool: { value: new THREE.Color(0.34, 0.43, 0.6).multiplyScalar(fillK) },
    uSheen: { value: new THREE.Color(0.5, 0.56, 0.66).multiplyScalar(0.3) },
    uBounce: { value: new THREE.Color(0.7, 0.62, 0.5).multiplyScalar(fillK) },
    // the warm light thrown back in the well (the sun's colour paled by the marble it comes from), how far the well
    // shuts out the sky (0 to 1), the walls' own faint light to one another, the place the warm light comes back from
    // on the sunlit wall, and the place where the door's blade of sun lies on the old floor
    uWell: { value: new THREE.Vector4(0.34 * (0.4 + 0.6 * sunColor.r), 0.34 * (0.4 + 0.6 * sunColor.g), 0.34 * (0.4 + 0.6 * sunColor.b), 0).multiplyScalar(wellK).setW(Math.min(1, Math.max(0, wellK))) },
    uWellAmb: { value: new THREE.Color(0.05, 0.075, 0.13).multiplyScalar(wellK) },
    uWellAt: { value: wellAt },
    // the blade's foot and end on the old floor (x, z, x, z), the warm light it throws back, the shrine front's
    uBlade: { value: new THREE.Vector4(bladeA[0], bladeA[1], bladeB[0], bladeB[1]) },
    uBladeC: { value: bladeC.clone().multiplyScalar(12.5 * Math.max(0, sunDir.y) * bladeK * wellK) },
    uShrC: { value: bladeC.clone().multiplyScalar(4.2 * shrK * wellK) },
    // the band of gold along the well's tops: the bright sky round the sun
    uBandC: { value: new THREE.Color(1.36 * (0.4 + 0.6 * sunColor.r) + 2.6 * sunColor.r, 1.36 * (0.4 + 0.6 * sunColor.g) + 2.34 * sunColor.g, 1.36 * (0.4 + 0.6 * sunColor.b) + 1.95 * sunColor.b).multiplyScalar(wellK) },
    // the sun's lanes on the floor under the roof: the warm light they throw back (none unless the sun stands near
    // the long axis), the end the sun comes in at and one over the length it reaches under the front beam
    uLaneC: { value: bladeC.clone().multiplyScalar(3.2 * Math.max(0, sunDir.y) * Math.max(0, 1 - 8 * Math.abs(sunDir.z))) },
    uLaneX: { value: new THREE.Vector2(sunDir.x < 0 ? 0 : 102.16, (sunDir.x < 0 ? 1 : -1) / Math.max(1, (CAP_TOP - FLOOR) * Math.abs(sunDir.x) / Math.max(1e-3, sunDir.y))) },
    // the share of the sky that reaches under the roof
    uRoofed: { value: Math.min(1, Math.max(0, opts.roofed !== undefined ? opts.roofed : 0.45)) },
  };
  // the world's glow in the court, if the world hands one: its place, colour and reach are read here once; its
  // strength is the world's own object, which the world sets (the part never writes it)
  const glow = opts.glow && opts.glow.strength && typeof opts.glow.strength.value === 'number' && Array.isArray(opts.glow.at) ? opts.glow : null;
  if (glow) { U.uGlowAt = { value: new THREE.Vector3(glow.at[0], glow.at[1], glow.at[2]) }; U.uGlowCol = { value: new THREE.Color(glow.color !== undefined ? glow.color : '#ffffff') };
    U.uGlowR = { value: glow.reach > 0 ? glow.reach : 40 }; U.uGlowK = glow.strength; }
  // offeringsAt: where the court's things stand; shades: [x, z, radius, how dark] of the contact shades on the old
  // floor; threads: [x, y, z, height] of the threads of incense smoke
  const textures = [], marble = makeMarble(U), offeringsAt = [], shades = [], threads = [];
  const cols = columnList(), plan = columnPlan(cols), cornerCol = plan.reduce((a, c) => (c.x + c.z < a.x + a.z ? c : a));
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0);
  // one mesh of a form, drawn at many places: list entries are [x, y, z, turn about Y, scale across]
  const inst = (geo, mat, list, name) => {
    if (!list.length) { geo.dispose(); return null; }
    const m = new THREE.InstancedMesh(geo, mat, list.length); m.name = name;
    list.forEach((e, i) => { Q.setFromAxisAngle(YAX, e[3] || 0); m.setMatrixAt(i, M4.compose(V.set(e[0], e[1], e[2]), Q, S.set(e[4] || 1, 1, e[4] || 1))); });
    m.instanceMatrix.needsUpdate = true; m.receiveShadow = true; m.castShadow = false; m.computeBoundingSphere(); object.add(m); return m;
  };
  const tally = {};
  const count = (name, geo, n) => { tally[name] = Math.round((geo.index ? geo.index.count : geo.attributes.position.count) / 3) * n; };

  // ----- the columns: shafts, bases, capitals -----
  const L_PLAIN = COL_H - CAP_H - PLINTH_H - BASE_H, L_CARVED = COL_H - CAP_H - DRUM_TOP - UPPER_H;
  const pick = (f) => plan.filter(f);
  const shaftSets = [
    ['shaft full', () => makeShaft(L_PLAIN, { real: true, hs: 2, run: 2, plainTop: true }), (c) => !c.carved && c.lod === 0, FLOOR + PLINTH_H + BASE_H],
    ['shaft full carved', () => makeShaft(L_CARVED, { real: true, hs: 3, run: 2, plainTop: true }), (c) => c.carved, FLOOR + DRUM_TOP + UPPER_H],
    ['shaft mid', () => makeShaft(L_PLAIN, { around: 24, run: 2 }), (c) => c.lod === 1, FLOOR + PLINTH_H + BASE_H],
    ['shaft far', () => makeShaft(L_PLAIN, { around: 10, plain: true }), (c) => c.lod === 2, FLOOR + PLINTH_H + BASE_H],
  ];
  for (const [name, make, f, y] of shaftSets) { const geo = make(), list = pick(f).map((c) => [c.x, y, c.z, 0, c.thin]); count(name, geo, list.length); inst(geo, marble, list, name); await ctx.yield(); }
  const baseSets = [
    ['base full', () => makeBase(baseProfile(0), 20), (c) => !c.carved && c.lod === 0, FLOOR + PLINTH_H],
    ['base mid', () => makeBase(baseProfile(1), 16), (c) => c.lod === 1, FLOOR + PLINTH_H],
    ['base far', () => makeBase(baseProfile(2), 10), (c) => c.lod === 2, FLOOR + PLINTH_H],
    ['base upper', () => makeBase(upperBaseProfile(), 24), (c) => c.carved, FLOOR + DRUM_TOP],
  ];
  for (const [name, make, f, y] of baseSets) { const geo = make(), list = pick(f).map((c) => [c.x, y, c.z, 0, c.thin]); count(name, geo, list.length); inst(geo, marble, list, name); await ctx.yield(); }
  const capSets = [
    ['capital full', () => makeCapital({ spiral: true, n: 8, quads: 3, eggs: 36, roll: 8, rollF: 3, paint: 0.92 }), (c) => c.lod === 0],
    ['capital mid', () => makeCapital({ spiral: false, n: 10, eggs: 16, roll: 6, rollF: 2, paint: 0.92 }), (c) => c.lod === 1],
    ['capital far', () => makeCapital({ spiral: false, plain: true, n: 5, eggs: 6, roll: 3, rollF: 1, paint: 0.92 }), (c) => c.lod === 2],
  ];
  // the plain form's scrolls are drawn a little narrow: it is set wider so that every capital is 2.62 m across
  for (const [name, make, f] of capSets) { const geo = make(), wide = name === 'capital far' ? 1.0505 : 1, list = pick(f).map((c) => [c.x, FLOOR + COL_H - CAP_H, c.z, c.rot, wide]); count(name, geo, list.length); inst(geo, marble, list, name); await ctx.yield(); }

  // ----- the carved feet of the 24 columns of the two west rows and the porch: a cube pedestal, a drum on it -----
  // The figures are dealt by one fixed stream of their own: the same figures stand on the same faces on every visit.
  const feetRng = ctx.core.makeRng(ctx.core.hashSeed('artemis-carved-feet'));
  const sheet = await makeReliefSheet(feetRng, ctx);
  const relTex = new THREE.DataTexture(sheet, REL_W, REL_H, THREE.RGBAFormat);
  relTex.wrapS = relTex.wrapT = THREE.ClampToEdgeWrapping; relTex.magFilter = THREE.LinearFilter; relTex.minFilter = THREE.LinearMipmapLinearFilter;
  relTex.generateMipmaps = true; relTex.anisotropy = 4; relTex.needsUpdate = true; textures.push(relTex);
  const carvedMat = makeMarble(U, { relief: relTex }), carvedCols = pick((c) => c.carved);
  {
    // the drum: 1.83 m high, 1.84 across its rims; the field between them is sunk 5.5 cm and carries the relief
    const dr = makeG(), DA = 32, RF = 0.865;
    dr.col(MARBLE).jt(0, 0, 0, 0.62);
    lathe(dr, [[0.92, 0], [0.92, 0.06], [0.92, 0.06], [RF, 0.1]], DA);
    lathe(dr, [[RF, 1.73], [0.92, 1.77], [0.92, 1.77], [0.92, 1.83], [0.92, 1.83], [0.6, 1.83]], DA);
    // the field: jt carries its width and height in metres; across, a drum's round is two fields
    dr.jt(9, DRUM_TILE[0], DRUM_TILE[1], 0.62); const f0 = dr.count;
    for (let j = 0; j <= DA; j++) { const a = (j / DA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); dr.uv(2 * j / DA, 0).v(c * RF, 0.1, s * RF, c, 0, s); dr.uv(2 * j / DA, 1).v(c * RF, 1.73, s * RF, c, 0, s); }
    for (let j = 0; j < DA; j++) { const a = f0 + 2 * j, b = a + 2, c = b + 1, d = a + 1; dr.tri(a, d, c); dr.tri(a, c, b); }
    // which of the two drum fields a drum carries, and whether mirrored: by the column's place in the list, so that
    // no two neighbours are alike; how it is turned on its foot: by the fixed stream
    const geo = dr.build({ uv: true }), rel = new Float32Array(carvedCols.length * 3);
    const list = carvedCols.map((c, i) => { rel[i * 3] = 0; rel[i * 3 + 1] = i & 1; rel[i * 3 + 2] = (i >> 1) & 1 ? -1 : 1; return [c.x, FLOOR + PED_TOP, c.z, feetRng() * Math.PI * 2, 1]; });
    geo.setAttribute('aRel', new THREE.InstancedBufferAttribute(rel, 3)); count('drums', geo, list.length); inst(geo, carvedMat, list, 'carved drums');
  }
  {
    // the pedestal: a cube 1.85 wide and 1.83 high; each face a sunk field in a plain frame with a dark red inner edge
    const pd = makeG(), HP = PED_HALF, DF = 0.87, H = 1.83;
    for (let f = 0; f < 4; f++) {
      const nx = Math.round(Math.cos(f * Math.PI / 2)), nz = Math.round(Math.sin(f * Math.PI / 2)), tx = -nz, tz = nx;
      const P = (a, y, d) => [nx * d + tx * a, y, nz * d + tz * a];
      const q = (a0, y0, d0, a1, y1, d1, a2, y2, d2, a3, y3, d3) => { const A = P(a0, y0, d0), B = P(a1, y1, d1), C = P(a2, y2, d2), D = P(a3, y3, d3);
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
        if ((uy * vz - uz * vy) * nx + (ux * vy - uy * vx) * nz >= 0) return [A, B, C, D]; return [D, C, B, A]; };
      pd.col(MARBLE).jt(0, 0, 0, 0.62).uv(0, 0);
      pd.quad(...q(-HP, 0, HP, HP, 0, HP, HP, 0.07, HP, -HP, 0.07, HP)); pd.quad(...q(-HP, H - 0.07, HP, HP, H - 0.07, HP, HP, H, HP, -HP, H, HP));
      pd.quad(...q(-HP, 0.07, HP, -HP + 0.07, 0.07, HP, -HP + 0.07, H - 0.07, HP, -HP, H - 0.07, HP)); pd.quad(...q(HP - 0.07, 0.07, HP, HP, 0.07, HP, HP, H - 0.07, HP, HP - 0.07, H - 0.07, HP));
      const a0 = -HP + 0.07, a1 = HP - 0.07, b0 = -HP + 0.12, b1 = HP - 0.12;
      pd.quad(...q(a0, 0.07, HP, a1, 0.07, HP, b1, 0.12, DF, b0, 0.12, DF)); pd.quad(...q(b0, H - 0.12, DF, b1, H - 0.12, DF, a1, H - 0.07, HP, a0, H - 0.07, HP));
      pd.quad(...q(a0, 0.07, HP, b0, 0.12, DF, b0, H - 0.12, DF, a0, H - 0.07, HP)); pd.quad(...q(b1, 0.12, DF, a1, 0.07, HP, a1, H - 0.07, HP, b1, H - 0.12, DF));
      // the field: jt carries its width and height in metres; across, each face is one field of the sheet's four
      pd.jt(9, PED_FIELD[0], PED_FIELD[1], 0.62);
      const F = [[b0, 0.12, 0, 0], [b1, 0.12, 1, 0], [b1, H - 0.12, 1, 1], [b0, H - 0.12, 0, 1]], i0 = pd.count;
      for (const [a, y, u, v] of F) { const p = P(a, y, DF); pd.uv(f + u, v).v(p[0], p[1], p[2], nx, 0, nz); }
      const pa = P(b0, 0.12, DF), pb = P(b1, 0.12, DF), pc = P(b0, H - 0.12, DF);
      const fw = ((pb[1] - pa[1]) * (pc[2] - pa[2]) - (pb[2] - pa[2]) * (pc[1] - pa[1])) * nx + ((pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0])) * nz >= 0;
      if (fw) { pd.tri(i0, i0 + 1, i0 + 2); pd.tri(i0, i0 + 2, i0 + 3); } else { pd.tri(i0, i0 + 2, i0 + 1); pd.tri(i0, i0 + 3, i0 + 2); }
    }
    pd.col(MARBLE).jt(0, 0, 0, 0.62).uv(0, 0).quad([-HP, H, -HP], [-HP, H, HP], [HP, H, HP], [HP, H, -HP]);
    // which of the four fields stands on which face, and whether mirrored: by the column's place in the list
    // (eight looks, and neighbours never show the same one on the same side)
    const geo = pd.build({ uv: true }), rel = new Float32Array(carvedCols.length * 3);
    const list = carvedCols.map((c, i) => { const v = (i * 3) % 8; rel[i * 3] = v & 3; rel[i * 3 + 1] = 2; rel[i * 3 + 2] = v > 3 ? -1 : 1; return [c.x, FLOOR + PLINTH_H, c.z, 0, 1]; });
    geo.setAttribute('aRel', new THREE.InstancedBufferAttribute(rel, 3)); count('pedestals', geo, list.length); inst(geo, carvedMat, list, 'carved pedestals');
  }
  await ctx.yield();

  // ----- the steps, the platform, the plinths, the walls, the court, the stair: one mesh of marble blocks -----
  const st = makeG(), lerpR = (k) => FOOT.map((v, i) => v + (TOP[i] - v) * k);
  st.col(MARBLE);
  for (let k = 0; k < NSTEP; k++) {
    const a = lerpR(k / (NSTEP - 1)), y0 = k * RISE, y1 = (k + 1) * RISE;
    st.jt(1, RISE, 1.9, 0.62).ring(a, [[0, y0], [0, y1]]);
    if (k === NSTEP - 1) break;
    const b = lerpR((k + 1) / (NSTEP - 1));
    st.jt(5, RISE, 1.9, 0.5);
    st.quad([a[0], y1, a[2]], [a[0], y1, a[3]], [b[0], y1, b[3]], [b[0], y1, b[2]]);
    st.quad([a[1], y1, a[3]], [a[1], y1, a[2]], [b[1], y1, b[2]], [b[1], y1, b[3]]);
    st.jt(4, RISE, 1.9, 0.5);
    st.quad([a[1], y1, a[2]], [a[0], y1, a[2]], [b[0], y1, b[2]], [b[1], y1, b[2]]);
    st.quad([a[0], y1, a[3]], [a[1], y1, a[3]], [b[1], y1, b[3]], [b[0], y1, b[3]]);
  }
  // a stone drain channel 0.4 m wide round the foot of the steps: a dark floor a finger above the ground, a low kerb outside it
  st.jt(0, 0, 0, 0.7).col(shade(MARBLE, 0.92)).ring(FOOT, [[0.55, 0], [0.55, 0.09], [0.4, 0.09], [0.4, 0.025]]);
  st.col([0.4, 0.4, 0.41]).ring(FOOT, [[0.4, 0.025], [0, 0.025]]);
  st.col(MARBLE);
  // (the floor itself is laid with the fittings, in slabs: see the floors there)
  const lvl = (x0, z0, x1, z1, y) => st.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]);
  // the plinths
  st.jt(0, 0, 0, 0.6);
  for (const c of plan) st.box(c.x - PLINTH_HALF, FLOOR, c.z - PLINTH_HALF, c.x + PLINTH_HALF, FLOOR + PLINTH_H, c.z + PLINTH_HALF, 'xXYzZ');
  await ctx.yield();
  // the inner building's walls: blocks in level courses
  const CEIL = CAP_TOP + BEAM_H, planeY = (z) => EAVES + (HALF - Math.abs(z)) * SLOPE;
  st.jt(1, 0.62, 1.86, 0.66);
  for (const s of [-1, 1]) {
    const zo = s * WALL_OUT, zi = s * WALL_IN, face = s > 0 ? 'Z' : 'z', inner = s > 0 ? 'z' : 'Z';
    st.box(WALL_X0, FLOOR, Math.min(zo, zi), WALL_X1, CEIL, Math.max(zo, zi), face + 'x');
    // toward the porch, and toward the court (down to the old floor, up to the wall's top)
    st.box(WALL_X0, FLOOR, Math.min(zo, zi), DOOR_X0, CEIL, Math.max(zo, zi), inner);
    st.col(COURT_WHITE).box(CRT_X0, COURT, Math.min(zo, zi), CRT_X1, CRT_TOP, Math.max(zo, zi), inner + 'Y').col(MARBLE);
  }
  // the door wall with its opening; its court side rises as a gable under the west roof
  for (const s of [-1, 1]) {
    const z0 = s > 0 ? DOOR_HALF : -WALL_IN, z1 = s > 0 ? WALL_IN : -DOOR_HALF;
    st.box(DOOR_X0, FLOOR, z0, DOOR_X1, CEIL, z1, 'x' + (s > 0 ? 'z' : 'Z'));
    st.col(COURT_WHITE).box(DOOR_X0, COURT, z0, DOOR_X1, DOOR_TOP, z1, 'X');
    // above the door's top on the court side: up to the roof
    st.quad([DOOR_X1, DOOR_TOP, s > 0 ? WALL_IN : 0], [DOOR_X1, DOOR_TOP, s > 0 ? 0 : -WALL_IN], [DOOR_X1, planeY(s > 0 ? 0 : WALL_IN) - 0.05, s > 0 ? 0 : -WALL_IN], [DOOR_X1, planeY(s > 0 ? WALL_IN : 0) - 0.05, s > 0 ? WALL_IN : 0]);
    st.col(MARBLE);
  }
  st.box(DOOR_X0, DOOR_TOP, -DOOR_HALF, DOOR_X1, CEIL, DOOR_HALF, 'xy');
  // the court's east wall (a gable too), the back room's blind wall
  st.col(COURT_WHITE);
  st.quad([CRT_X1, COURT, -WALL_IN], [CRT_X1, COURT, 0], [CRT_X1, planeY(0) - 0.05, 0], [CRT_X1, planeY(WALL_IN) - 0.05, -WALL_IN]);
  st.quad([CRT_X1, COURT, 0], [CRT_X1, COURT, WALL_IN], [CRT_X1, planeY(WALL_IN) - 0.05, WALL_IN], [CRT_X1, planeY(0) - 0.05, 0]);
  st.col(MARBLE).box(WALL_X1 - WALL_T, FLOOR, -WALL_OUT, WALL_X1, CEIL, WALL_OUT, 'X');
  // the stair of fourteen steps down to the court's old floor between two plain blocks
  st.col(MARBLE);
  const SR = (FLOOR - COURT) / 14, SD = (STAIR_X1 - CRT_X0) / 14;
  for (let i = 0; i < 14; i++) {
    const x = CRT_X0 + i * SD, yT = FLOOR - i * SR, yB = yT - SR;
    st.jt(1, SR, 1.7, 0.6).quad([x, yB, STAIR_HALF], [x, yB, -STAIR_HALF], [x, yT, -STAIR_HALF], [x, yT, STAIR_HALF]);
    if (i < 13) { st.jt(5, SR, 1.7, 0.5); lvl(x, -STAIR_HALF, x + SD, STAIR_HALF, yB); }
  }
  st.jt(1, 0.62, 1.86, 0.66);
  // (each block in two lengths, so that its top and its two long faces are not single faces 6.3 m long)
  for (const s of [-1, 1]) for (const [xa, xb, faces] of [[CRT_X0, (CRT_X0 + STAIR_X1) / 2, 'YzZ'], [(CRT_X0 + STAIR_X1) / 2, STAIR_X1, 'XYzZ']])
    st.box(xa, COURT, s > 0 ? STAIR_HALF : -STAIR_HALF - 1.3, xb, FLOOR + 0.35, s > 0 ? STAIR_HALF + 1.3 : -STAIR_HALF, faces);
  // the walls' moulded foot and their crowning egg moulding under the ceilings; a plain band round the court at the
  // temple's floor level and a crowning moulding on its two long walls
  const outer = [WALL_X0, WALL_X1, -WALL_OUT, WALL_OUT], porchIn = [WALL_X0, DOOR_X0, -WALL_IN, WALL_IN], courtIn = [CRT_X0, CRT_X1, -CRT_HALF, CRT_HALF];
  const footP = [[0.15, FLOOR], [0.15, FLOOR + 0.3], [0.1, FLOOR + 0.36], [0.1, FLOOR + 0.44], [0.03, FLOOR + 0.56], [0, FLOOR + 0.6]];
  const crownA = [[0, CAP_TOP - 0.86], [0.05, CAP_TOP - 0.82], [0.05, CAP_TOP - 0.5]], crownB = [[0.05, CAP_TOP - 0.5], [0.1, CAP_TOP - 0.34], [0.16, CAP_TOP - 0.12]], crownC = [[0.16, CAP_TOP - 0.12], [0.2, CAP_TOP - 0.1], [0.2, CAP_TOP]];
  for (const [rect, dir, sides] of [[outer, 1, 'NSE'], [porchIn, -1, 'NSE']]) {
    st.jt(0, 0, 0, 0.6).ring(rect, footP, { dir, sides: dir < 0 ? 'NS' : sides });
    st.ring(rect, crownA, { dir, sides }).ring(rect, crownC, { dir, sides });
    st.jt(6, 0.26, CAP_TOP - 0.5, 0.38).ring(rect, crownB, { dir, sides, smooth: true });
  }
  // the door wall's foot toward the porch: from each corner to the door's frame and no further (the doorway is a
  // floor one walks through), with a closed end at the frame
  for (const s of [-1, 1]) {
    const zj = s * (DOOR_HALF + 0.66), C = (i) => [DOOR_X0 - footP[i][0], footP[i][1], s * (WALL_IN - footP[i][0])], J = (i) => [DOOR_X0 - footP[i][0], footP[i][1], zj];
    st.col(MARBLE).jt(0, 0, 0, 0.6);
    for (let i = 0; i < footP.length - 1; i++) {
      if (s > 0) st.quad(J(i), C(i), C(i + 1), J(i + 1)); else st.quad(C(i), J(i), J(i + 1), C(i + 1));
      const a = [DOOR_X0, FLOOR, zj];
      if (s > 0) st.tri3(a, J(i), J(i + 1)); else st.tri3(a, J(i + 1), J(i));
    }
  }
  // the court's string course at the temple's floor level: a bead, a flat band, a rounded moulding and a fillet over it
  // (it stands over the course of upright slabs and 0.26 m into the court: its top takes the sky, its underside shade)
  // (ours, the eye-level ornament of the court: its flat band is painted with a bead and reel, bare marble beads
  // and gilt reels on dark blue, and the fillet over it is red)
  st.col(COURT_WHITE).jt(0, 0, 0, 0.6).ring(courtIn, [[0.06, FLOOR - 0.34], [0.11, FLOOR - 0.3], [0.11, FLOOR - 0.24], [0.16, FLOOR - 0.2]], { dir: -1, sides: 'NSE' });
  st.jt(14, 0.44, FLOOR - 0.2, 0.32).ring(courtIn, [[0.16, FLOOR - 0.2], [0.16, FLOOR + 0.12]], { dir: -1, sides: 'NSE' });
  st.jt(0, 0, 0, 0.6).ring(courtIn, [[0.16, FLOOR + 0.12], [0.2, FLOOR + 0.16], [0.26, FLOOR + 0.27]], { dir: -1, sides: 'NSE' });
  st.col(mixC(MARBLE, RED, 0.82)).ring(courtIn, [[0.26, FLOOR + 0.27], [0.26, FLOOR + 0.33]], { dir: -1, sides: 'NSE' });
  st.col(COURT_WHITE).ring(courtIn, [[0.26, FLOOR + 0.33], [0, FLOOR + 0.37]], { dir: -1, sides: 'NSE' });
  // the court's crown, round all four walls (under the two gables it is their string course): a band, an egg moulding,
  // a row of tooth blocks on a blue bed, and a cornice that stands 0.8 m into the court with a plain gutter's lip at
  // 28.2: the open sky is framed by it (the marble's shader takes the sun's edge in the well from this lip: MARBLE_F1)
  const CT = CRT_TOP;
  st.ring(courtIn, [[0, CT - 1.62], [0.05, CT - 1.57], [0.05, CT - 1.3]], { dir: -1 });
  st.jt(6, 0.26, CT - 1.3, 0.3).ring(courtIn, [[0.05, CT - 1.3], [0.115, CT - 1.16], [0.17, CT - 1.0]], { dir: -1, smooth: true });
  st.jt(0, 0, 0, 0.6).ring(courtIn, [[0.17, CT - 1.0], [0.2, CT - 0.98]], { dir: -1 });
  st.col(mixC(MARBLE, BLUE, 0.9)).jt(13, 0, 0, 0.62).ring(courtIn, [[0.2, CT - 0.98], [0.2, CT - 0.56]], { dir: -1 });
  st.col(COURT_WHITE).jt(0, 0, 0, 0.6).ring(courtIn, [[0.2, CT - 0.56], [0.8, CT - 0.52], [0.8, CT - 0.08], [0.76, CT - 0.05]], { dir: -1 });
  // (ours: the lip's face is a gutter's face, painted with the order's running scroll on blue; on the two long walls
  // a row of antefixes stands on it against the sky, one over every third block of the wall's longest: plain upright
  // leaves of marble, 0.42 m wide and 0.6 m high)
  st.jt(7, 0.93, CT - 0.05, 0.35).ring(courtIn, [[0.76, CT - 0.05], [0.8, CT + 0.3]], { dir: -1 });
  st.jt(0, 0, 0, 0.6).ring(courtIn, [[0.8, CT + 0.3], [0, CT + 0.34], [0, CT]], { dir: -1 });
  // a string course 3 m under the walls' top, round all four walls (ours: a wall's own dress): a fillet, a hollow
  // in dark red, a rounded moulding; between it and the crown's band stands one plain band of tall slabs (the
  // marble's shader draws their upright joints: MARBLE_F1)
  st.ring(courtIn, [[0, CT - 3.36], [0.07, CT - 3.3], [0.07, CT - 3.22]], { dir: -1 });
  st.col(HOLLOW_RED).ring(courtIn, [[0.07, CT - 3.22], [0.05, CT - 3.17], [0.07, CT - 3.11]], { dir: -1, smooth: true });
  st.col(COURT_WHITE).ring(courtIn, [[0.07, CT - 3.11], [0.12, CT - 3.08], [0.135, CT - 3.03], [0.12, CT - 2.98], [0, CT - 2.94]], { dir: -1, smooth: true });
  // the court walls' moulded foot, and over it a course of upright slabs 1.74 m high, 6 cm proud of the wall above
  // (the marble's shader draws their upright joints and no level one: MARBLE_F1)
  st.ring(courtIn, [[0.24, COURT], [0.24, COURT + 0.34], [0.16, COURT + 0.42], [0.16, COURT + 0.5], [0.06, COURT + 0.62]], { dir: -1, sides: 'NSE' });
  st.jt(1, 0.62, 1.86, 0.66).ring(courtIn, [[0.06, COURT + 0.62], [0.06, FLOOR - 0.34]], { dir: -1, sides: 'NSE' });
  // a raking cornice up each slope of the court's two gables, against the sky
  for (const e of [0, 1]) for (const s of [-1, 1]) {
    const x = e ? CRT_X1 : CRT_X0, dx = e ? -1 : 1, zA = s * WALL_IN, P = (o, dy, z) => [x + dx * o, planeY(z) - 0.05 + dy, z];
    const face = (a, b, c, d, want) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      if ((uy * vz - uz * vy) * want[0] + (uz * vx - ux * vz) * want[1] + (ux * vy - uy * vx) * want[2] >= 0) st.quad(a, b, c, d); else st.quad(d, c, b, a); };
    // a bed band, the cornice's underside, and its face up to the coping's edge 0.6 m out from the wall
    face(P(0, -1.25, zA), P(0, -1.25, 0), P(0.08, -1.25, 0), P(0.08, -1.25, zA), [0, -1, 0]);
    face(P(0.08, -1.25, zA), P(0.08, -1.25, 0), P(0.08, -0.8, 0), P(0.08, -0.8, zA), [dx, 0, 0]);
    face(P(0.08, -0.8, zA), P(0.08, -0.8, 0), P(0.6, -0.75, 0), P(0.6, -0.75, zA), [0, -1, 0]);
    face(P(0.6, -0.75, zA), P(0.6, -0.75, 0), P(0.6, 0.07, 0), P(0.6, 0.07, zA), [dx, 0, 0]);
  }
  st.col(MARBLE);
  // the wall ends at x 12: square piers a little wider than the wall, each with a moulded foot and a moulded capital
  for (const s of [-1, 1]) {
    const pier = [WALL_X0 - 0.08, WALL_X0 + 2.2, s * WALL_Z - 1.1, s * WALL_Z + 1.1];
    st.jt(1, 0.62, 2.28, 0.66).ring(pier, [[0, FLOOR], [0, CAP_TOP]]);
    st.jt(0, 0, 0, 0.6).ring(pier, [[0.17, FLOOR], [0.17, FLOOR + 0.3], [0.1, FLOOR + 0.38], [0.12, FLOOR + 0.5], [0.03, FLOOR + 0.62], [0, FLOOR + 0.66]]);
    st.ring(pier, [[0, CAP_TOP - 1.25], [0.05, CAP_TOP - 1.2], [0.05, CAP_TOP - 0.86]]);
    st.jt(6, 0.26, CAP_TOP - 0.86, 0.4).ring(pier, [[0.05, CAP_TOP - 0.86], [0.11, CAP_TOP - 0.68], [0.17, CAP_TOP - 0.46]], { smooth: true });
    st.jt(0, 0, 0, 0.6).ring(pier, [[0.17, CAP_TOP - 0.46], [0.2, CAP_TOP - 0.42], [0.2, CAP_TOP - 0.28], [0.27, CAP_TOP - 0.2], [0.27, CAP_TOP]]);
  }
  const stone = new THREE.Mesh(st.build(), marble); stone.name = 'stone'; stone.receiveShadow = true; stone.castShadow = true; object.add(stone);
  tally.stone = st.triangles;
  await ctx.yield();

  // ----- the upper work: beam in three bands, egg moulding, tooth blocks' bed, cornice, gutter (3.37 m in all) -----
  const up = makeG(), OUT = [0, 102.16, -23.895, 23.895], Y0 = CAP_TOP, TYMP = 0.55, YB = Y0 + 2.7;
  const PANEL = mixC(shade(MARBLE, 0.9), BLUE, 0.1), BED = mixC(MARBLE, BLUE, 0.9), LINE_GOLD = [0.62, 0.41, 0.12], LINE_RED = mixC(MARBLE, RED, 0.8);
  up.col(MARBLE).jt(0, 1, 0, 0.62);
  up.ring(OUT, [[0.74, Y0], [0.74, Y0 + 0.34], [0.775, Y0 + 0.34], [0.775, Y0 + 0.7], [0.81, Y0 + 0.7], [0.81, Y0 + 1.07]]);
  // (the colour picked out up here: a line of gold on the beam's crowning bead, a red line on the cornice's top fillet,
  // the blue grounds of the egg moulding and of the tooth blocks' bed)
  up.col(LINE_GOLD).jt(10, 0.45, 0, 0.62).ring(OUT, [[0.81, Y0 + 1.07], [0.86, Y0 + 1.12], [0.86, Y0 + 1.17]]);
  up.col(MARBLE).jt(0, 0, 0, 0.62);
  // the beam's underside with its sunk panel, and its inner face
  up.ring(OUT, [[-0.75, Y0], [-0.3, Y0]]).ring(OUT, [[0.3, Y0], [0.74, Y0]]);
  up.col(PANEL).ring(OUT, [[-0.3, Y0], [-0.26, Y0 + 0.06], [0.26, Y0 + 0.06], [0.3, Y0]]);
  // (its inner face stands where the ceilings' bays begin: no slit is left between them)
  up.col(MARBLE).ring(OUT, [[-0.75, Y0 + BEAM_H], [-0.75, Y0]]);
  up.jt(6, 0.3, Y0 + 1.17, 0.34).ring(OUT, [[0.86, Y0 + 1.17], [0.93, Y0 + 1.25], [1.0, Y0 + 1.38], [1.02, Y0 + 1.47], [1.02, Y0 + 1.51]], { smooth: true });
  up.jt(0, 0, 0, 0.62).ring(OUT, [[1.02, Y0 + 1.51], [0.9, Y0 + 1.51]]);
  up.col(BED).jt(13, 0, 0, 0.62).ring(OUT, [[0.9, Y0 + 1.51], [0.9, Y0 + 1.97]]);
  up.col(MARBLE).jt(0, 2, 1.74, 0.62).ring(OUT, [[0.9, Y0 + 1.97], [1.18, Y0 + 1.97], [1.21, Y0 + 2.07], [1.44, Y0 + 2.1], [1.44, Y0 + 2.48]]);
  up.col(LINE_RED).ring(OUT, [[1.44, Y0 + 2.48], [1.5, Y0 + 2.58], [1.5, YB]]);
  up.col(MARBLE);
  // on the long sides the gutter: a carved face with a running scroll; on the ends the cornice's top as a ledge under the gable
  up.jt(7, 1.8, Y0 + 2.72, 0.62).ring(OUT, [[1.46, YB], [1.47, Y0 + 2.82], [1.54, Y0 + 3.08], [1.605, Y0 + 3.3], [1.605, EAVES]], { smooth: true, sides: 'NS' });
  up.jt(0, 0, 0, 0.62).ring(OUT, [[1.605, EAVES], [1.5, EAVES], [1.47, EAVES - 0.12]], { sides: 'NS' });
  up.ring(OUT, [[1.5, YB], [TYMP, YB]], { sides: 'WE' });
  await ctx.yield();
  // the two gables: a plain wall of blocks with three upright openings, dark inside; no sculpture
  const DARK = [0.012, 0.014, 0.02], OPEN = [[0, 1.2, 4.6], [-6.6, 0.8, 3.2], [6.6, 0.8, 3.2]];
  const topY = (z) => planeY(z) - 1.05, ZT = HALF - (YB + 1.05 - EAVES) / SLOPE;
  for (const e of [0, 1]) {
    const X = (o) => (e ? 102.16 + o : -o), fq = (a, b, c, d) => (e ? up.quad(a, b, c, d) : up.quad(b, a, d, c));
    // the wall in upright strips between the openings' sides
    const cuts = [-ZT, -7.4, -5.8, -1.2, 0, 1.2, 5.8, 7.4, ZT], xt = X(TYMP);
    up.col(MARBLE).jt(1, 0.6, 1.8, 0.66);
    for (let i = 0; i < cuts.length - 1; i++) {
      const za = cuts[i], zb = cuts[i + 1], zm = (za + zb) / 2, op = OPEN.find((o) => Math.abs(zm - o[0]) < o[1]);
      // the two end strips run out to a point under the slope: three corners, not four
      if (i === 0 || i === cuts.length - 2) { const A = [xt, YB, zb], B = [xt, YB, za], C = i === 0 ? [xt, topY(zb), zb] : [xt, topY(za), za]; if (e) up.tri3(A, B, C); else up.tri3(B, A, C); continue; }
      if (!op) { fq([xt, YB, zb], [xt, YB, za], [xt, topY(za), za], [xt, topY(zb), zb]); continue; }
      fq([xt, YB, zb], [xt, YB, za], [xt, YB + 0.4, za], [xt, YB + 0.4, zb]);
      fq([xt, YB + op[2], zb], [xt, YB + op[2], za], [xt, topY(za), za], [xt, topY(zb), zb]);
    }
    for (const [zc, hw, top] of OPEN) {
      const x1 = X(TYMP), x2 = X(TYMP - 0.7), xa = Math.min(x1, x2), xb = Math.max(x1, x2);
      up.col(shade(MARBLE, 0.7)).jt(0, 0, 0, 0.7).box(xa, YB + 0.4, zc - hw, xb, YB + top, zc + hw, 'yYzZ', true);
      // the dark behind: a plane that stands for the unlit roof space (a sun straight in on the axis falls on the loft's
      // floor, not on this plane), so its normal looks down, away from every sun
      up.col(DARK);
      { const za = e ? zc + hw : zc - hw, zb = e ? zc - hw : zc + hw, i = up.v(x2, YB + 0.4, za, 0, -1, 0); up.v(x2, YB + 0.4, zb, 0, -1, 0); up.v(x2, YB + top, zb, 0, -1, 0); up.v(x2, YB + top, za, 0, -1, 0); up.tri(i, i + 1, i + 2); up.tri(i, i + 2, i + 3); }
      // a plain frame and a small cornice over each opening
      const p1 = X(TYMP + 0.07), fa = Math.min(x1, p1), fb = Math.max(x1, p1), ff = e ? 'XyYzZ' : 'xyYzZ';
      up.col(MARBLE).jt(0, 0, 0, 0.62);
      up.box(fa, YB + 0.4, zc - hw - 0.22, fb, YB + top + 0.22, zc - hw, ff).box(fa, YB + 0.4, zc + hw, fb, YB + top + 0.22, zc + hw + 0.22, ff).box(fa, YB + top, zc - hw, fb, YB + top + 0.22, zc + hw, ff);
      const p2 = X(TYMP + 0.2); up.box(Math.min(x1, p2), YB + top + 0.22, zc - hw - 0.34, Math.max(x1, p2), YB + top + 0.4, zc + hw + 0.34, ff);
    }
    // the raking cornice and its gutter up both slopes, with the sloped underside back to the wall
    for (const s of [-1, 1]) {
      const z0 = s * HALF, P = (o, dy, z) => [X(o), planeY(z) + dy, z], w = (a, b, c, d) => ((s > 0) === !!e ? up.quad(a, b, c, d) : up.quad(b, a, d, c));
      up.col(MARBLE).jt(0, 0, 0, 0.62);
      w(P(1.46, -1.05, z0), P(1.46, -1.05, 0), P(1.46, -0.74, 0), P(1.46, -0.74, z0));
      // (picked out as on the long sides: a red line on the cornice's top fillet, the gutter's scroll on a blue ground)
      up.col(LINE_RED); w(P(1.46, -0.74, z0), P(1.46, -0.74, 0), P(1.46, -0.62, 0), P(1.46, -0.62, z0));
      up.col(MARBLE); w(P(1.46, -0.62, z0), P(1.46, -0.62, 0), P(1.5, -0.62, 0), P(1.5, -0.62, z0));
      up.jt(7, 1.8, -0.62, 0.62); w(P(1.5, -0.62, z0), P(1.5, -0.62, 0), P(1.56, 0, 0), P(1.56, 0, z0));
      up.jt(0, 0, 0, 0.62); w(P(1.56, 0, z0), P(1.56, 0, 0), P(1.4, 0, 0), P(1.4, 0, z0));
      up.col(shade(MARBLE, 0.9)); w(P(TYMP, -1.05, z0), P(TYMP, -1.05, 0), P(1.46, -1.05, 0), P(1.46, -1.05, z0));
    }
  }
  const upper = new THREE.Mesh(up.build(), marble); upper.name = 'upper work'; upper.receiveShadow = true; upper.castShadow = true; object.add(upper);
  tally.upper = up.triangles;
  await ctx.yield();

  // ----- the roof: marble tiles 1.2 m wide in long straight rows at 17 degrees, a ring round the open court -----
  const rf = makeG(), ZG = HALF - 0.125, PAN = 0.08, X1R = 102.16 + 1.5;
  rf.col(shade(MARBLE, 0.97)).jt(8, 0.78, 1.2, 0.5);
  const zones = [[ROOF_X0 + 0.1, CRT_X0, 0], [CRT_X1, X1R - 0.1, 0], [CRT_X0, CRT_X1, WALL_OUT]];
  for (const [x0, x1, zin] of zones) for (const s of [-1, 1]) {
    const a = [x0, planeY(ZG) - PAN, s * ZG], b = [x1, planeY(ZG) - PAN, s * ZG], c = [x1, planeY(zin) - PAN, s * zin], d = [x0, planeY(zin) - PAN, s * zin];
    if (s > 0) rf.quad(a, b, c, d); else rf.quad(b, a, d, c);
  }
  // (the roof's upper side lies above the eaves, higher than the court's rim and every floor: its tiles are drawn by
  // the marble's shader on the plain slopes; no cover tiles and no ridge tiles are made)
  const cover = makeG(); cover.col(MARBLE).jt(0, 0, 0, 0.62);
  // the verges over the court's two end walls: a plain coping that closes the roof's edge and covers the raking
  // cornice out to its lip
  for (const [xa, xb] of [[CRT_X0 - 0.25, CRT_X0 + 0.6], [CRT_X1 - 0.6, CRT_X1 + 0.25]]) for (const s of [-1, 1]) {
    const P = (x, dy, z) => [x, planeY(z) + dy, s * z], w = (a, b, c, d) => (s > 0 ? cover.quad(a, b, c, d) : cover.quad(b, a, d, c));
    w(P(xa, 0.02, WALL_IN), P(xb, 0.02, WALL_IN), P(xb, 0.02, 0), P(xa, 0.02, 0));
  }
  const roof = new THREE.Mesh(rf.build(), marble); roof.name = 'roof'; roof.receiveShadow = true; object.add(roof);
  const covers = new THREE.Mesh(cover.build(), marble); covers.name = 'court copings'; covers.receiveShadow = true; object.add(covers);
  tally.roof = rf.triangles + cover.triangles;
  await ctx.yield();

  // ----- the ceilings: marble beams from column to column and to the walls, deep coffers between them -----
  const cl = makeG(), HB = 0.75, COFY = CEIL + 0.45, GROUND = [0.045, 0.095, 0.27], RIBC = MARBLE, RIBD = shade(MARBLE, 0.74);
  const xsAll = [...new Set(cols.map((c) => +c[0].toFixed(4)))].sort((a, b) => a - b), xsFlank = xsAll.filter((x) => x > 11 && x < 91);
  const zFront = [-23.895, -17.735, -11.575, -4.375, 4.375, 11.575, 17.735, 23.895], zBack = [-23.895, -17.735, -11.823, -5.912, 0, 5.912, 11.823, 17.735, 23.895];
  // a beam along x or along z between two ends; t0, t1: how far its underside stops short of each end (a crossing beam's half width, or 0 at a wall)
  const beam = (x0, z0, x1, z1, t0 = HB, t1 = HB) => {
    const alongX = Math.abs(z1 - z0) < 1e-6;
    cl.jt(0, 0, 0, 0.62);
    if (alongX) {
      cl.col(RIBC).box(x0, Y0, z0 - HB, x1, CEIL, z0 + HB, 'zZ');
      cl.box(x0 + t0, Y0, z0 - HB, x1 - t1, CEIL, z0 - 0.3, 'y').box(x0 + t0, Y0, z0 + 0.3, x1 - t1, CEIL, z0 + HB, 'y');
      cl.col(PANEL).box(x0 + t0, Y0 + 0.001, z0 - 0.3, x1 - t1, CEIL, z0 + 0.3, 'y');
    } else {
      cl.col(RIBC).box(x0 - HB, Y0, z0, x0 + HB, CEIL, z1, 'xX');
      cl.box(x0 - HB, Y0, z0 + t0, x0 - 0.3, CEIL, z1 - t1, 'y').box(x0 + 0.3, Y0, z0 + t0, x0 + HB, CEIL, z1 - t1, 'y');
      cl.col(PANEL).box(x0 - 0.3, Y0 + 0.001, z0 + t0, x0 + 0.3, CEIL, z1 - t1, 'y');
    }
  };
  // a bay between beams and walls (already its clear size): a blue ground, a lattice of ribs hanging under it, a gilt flower in every coffer
  const bay = (x0, z0, x1, z1) => {
    const plainBay = x0 > 44, w = x1 - x0, d = z1 - z0, nx = Math.max(1, Math.round(w / 1.6)), nz = Math.max(1, Math.round(d / 1.6)), rw = 0.14;
    cl.jt(0, 0, 0, 0.7).col(GROUND).quad([x0, COFY, z0], [x1, COFY, z0], [x1, COFY, z1], [x0, COFY, z1]);
    cl.col(RIBD).box(x0, CEIL, z0, x1, COFY, z1, 'xXzZ', true);
    for (let i = 1; i < nx; i++) { const x = x0 + (w * i) / nx; cl.col(RIBC).box(x - rw, CEIL, z0, x + rw, COFY, z1, 'y'); if (!plainBay) cl.col(RIBD).box(x - rw, CEIL, z0, x + rw, COFY, z1, 'xX'); }
    for (let k = 1; k < nz; k++) { const z = z0 + (d * k) / nz; cl.col(RIBC).box(x0, CEIL, z - rw, x1, COFY, z + rw, 'y'); if (!plainBay) cl.col(RIBD).box(x0, CEIL, z - rw, x1, COFY, z + rw, 'zZ'); }
    if (plainBay) return;
    cl.col(GOLD);
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const cx = x0 + (w * (i + 0.5)) / nx, cz = z0 + (d * (k + 0.5)) / nz, r = Math.min(w / nx, d / nz) * 0.34, q = r * 0.34, y = COFY - 0.02;
      cl.quad([cx - r, y, cz], [cx, y, cz - q], [cx + r, y, cz], [cx, y, cz + q]); cl.quad([cx, y, cz - r], [cx + q, y, cz], [cx, y, cz + r], [cx - q, y, cz]);
    }
  };
  // the rows of beams and bays, zone by zone
  for (const s of [-1, 1]) {
    beam(6, s * 17.735, 96.16, s * 17.735, 0, 0);
    for (let i = 0; i < xsFlank.length; i++) {
      const x = xsFlank[i];
      beam(x, s > 0 ? 17.735 : -23.895, x, s > 0 ? 23.895 : -17.735);
      beam(x, s > 0 ? WALL_OUT : -17.735, x, s > 0 ? 17.735 : -WALL_OUT, s > 0 ? 0 : HB, s > 0 ? HB : 0);
    }
    const xl = [6, ...xsFlank, 96.16];
    for (let i = 0; i < xl.length - 1; i++) {
      const a = xl[i] + HB, b = xl[i + 1] - HB, zin = xl[i] < 11 ? 11.575 + HB : xl[i] > 90 ? 11.823 + HB : WALL_OUT;
      bay(a, s > 0 ? 17.735 + HB : -23.895 + HB, b, s > 0 ? 23.895 - HB : -17.735 - HB);
      bay(a, s > 0 ? zin : -17.735 + HB, b, s > 0 ? 17.735 - HB : -zin);
    }
  }
  await ctx.yield();
  // the west end: the two front aisles, then the porch between the walls
  beam(6, -23.895, 6, 23.895, 0, 0); beam(96.16, -23.895, 96.16, 23.895, 0, 0);
  for (const z of zFront.slice(1, -1)) beam(0, z, 6, z);
  for (const z of [-11.575, 11.575]) beam(6, z, WALL_X0, z, HB, 0);
  // (over each wall end's pier the cross beam runs on through the wall's thickness: the ceiling is closed there too)
  for (const s of [-1, 1]) beam(12, s > 0 ? WALL_IN : -WALL_OUT, 12, s > 0 ? WALL_OUT : -WALL_IN, 0, 0);
  for (const z of [-4.375, 4.375]) beam(6, z, DOOR_X0, z, HB, 0);
  for (const x of [12, 17.2107, 22.4214, 27.6321]) { beam(x, -WALL_IN, x, -4.375, 0, HB); beam(x, -4.375, x, 4.375); beam(x, 4.375, x, WALL_IN, HB, 0); }
  for (let i = 0; i < zFront.length - 1; i++) bay(HB, zFront[i] + HB, 6 - HB, zFront[i + 1] - HB);
  for (let i = 1; i < zFront.length - 2; i++) bay(6 + HB, zFront[i] + HB, 12 - HB, zFront[i + 1] - HB);
  const xp = [12, 17.2107, 22.4214, 27.6321, DOOR_X0 + HB], zp = [-WALL_IN - HB, -4.375, 4.375, WALL_IN + HB];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) bay(xp[i] + HB, zp[k] + HB, xp[i + 1] - HB, zp[k + 1] - HB);
  // the east end: the two back aisles
  for (const z of zBack.slice(1, -1)) beam(96.16, z, 102.16, z);
  for (const z of zBack.slice(2, -2)) beam(WALL_X1, z, 96.16, z, 0, HB);
  for (let i = 0; i < zBack.length - 1; i++) bay(96.16 + HB, zBack[i] + HB, 102.16 - HB, zBack[i + 1] - HB);
  for (let i = 1; i < zBack.length - 2; i++) bay(WALL_X1 + (i === 1 || i === zBack.length - 3 ? HB : 0), zBack[i] + HB, 96.16 - HB, zBack[i + 1] - HB);
  const ceiling = new THREE.Mesh(cl.build(), marble); ceiling.name = 'ceiling'; ceiling.receiveShadow = true; object.add(ceiling);
  tally.ceiling = cl.triangles;
  await ctx.yield();
  // the tooth blocks under the cornice, all round
  const dg = makeG(); dg.col(MARBLE).jt(13, 0, 0, 0.62).box(-0.12, 0, 0, 0.12, 0.4, 0.26, 'xXyZ');
  const teeth = [];
  for (let x = -0.8; x < 45; x += 0.4) { teeth.push([x, Y0 + 1.54, 23.895 + 0.9, 0, 1], [x, Y0 + 1.54, -23.895 - 0.9, Math.PI, 1]); }
  for (let z = -24.6; z < 24.7; z += 0.4) teeth.push([-0.9, Y0 + 1.54, z, -Math.PI / 2, 1]);
  // and under the court's own cornice, round all four walls: a mesh of their own, so that neither row is drawn where
  // only the other can be seen
  const teethC = [];
  for (let x = 34.4; x < CRT_X1 - 0.3; x += 0.4) teethC.push([x, CRT_TOP - 0.97, -CRT_HALF + 0.2, 0, 1], [x, CRT_TOP - 0.97, CRT_HALF - 0.2, Math.PI, 1]);
  for (let z = -9.8; z < 10; z += 0.4) teethC.push([CRT_X0 + 0.2, CRT_TOP - 0.97, z, Math.PI / 2, 1], [CRT_X1 - 0.2, CRT_TOP - 0.97, z, -Math.PI / 2, 1]);
  const dGeo = dg.build(); count('tooth blocks', dGeo, teeth.length); inst(dGeo, marble, teeth, 'tooth blocks');
  count('court tooth blocks', dGeo, teethC.length); inst(dGeo, marble, teethC, 'court tooth blocks');
  await ctx.yield();

  // ----- the great door: 6.2 m wide and 14 m high in the clear; a moulded frame, a cornice on two scroll brackets,
  // two leaves of polished dark cypress with bronze bosses and bands, standing open into the porch -----
  const dq = makeG(), XW = DOOR_X0, BRONZE = [0.36, 0.285, 0.14];
  // THE FLOORS, laid in slabs on shared lines: the temple's floor (large slabs, smooth enough to take the sky's
  // sheen) round the sunk court, and the court's old floor. No slab is longer than 6 m; in the west porch, the
  // deep porch before the door and the court's west half they are of about 3 m and less (a renderer's sums are
  // less exact on a very great triangle than on small ones). A level floor turned up to the sun casts nothing,
  // so they are of this mesh, which is not in the shadow's pass.
  {
    const cuts = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => (i === n ? b : a + ((b - a) * i) / n));
    const slabs = (xs, zs, y, well) => {
      for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
        if (well && xs[i] >= CRT_X0 && xs[i + 1] <= CRT_X1 && zs[j] >= -CRT_HALF && zs[j + 1] <= CRT_HALF) continue;
        dq.quad([xs[i], y, zs[j]], [xs[i], y, zs[j + 1]], [xs[i + 1], y, zs[j + 1]], [xs[i + 1], y, zs[j]]);
      }
    };
    // the temple's floor. Lines across the building: six slabs to the walls' ends, eight to the door wall's inner
    // face, eight beside the court, five behind it. Lines along it: six rows north of the court's line, seven
    // between its two lines (on the paving's own joints, rows of 1.46 m), three south of it.
    const FX = [...cuts(TOP[0], WALL_X0, 6), ...cuts(WALL_X0, CRT_X0, 8).slice(1), ...cuts(CRT_X0, CRT_X1, 8).slice(1), ...cuts(CRT_X1, TOP[1], 5).slice(1)];
    const FZ = [...cuts(TOP[2], -CRT_HALF, 6), -7.3, -4.38, -1.46, 1.46, 4.38, 7.3, ...cuts(CRT_HALF, TOP[3], 3)];
    dq.col(MARBLE).jt(3, 1.46, 2.92, 0.4); slabs(FX, FZ, FLOOR, true);
    // the court's old floor. Lines across the court on its bands' joints (bands of 2.3 m): every band to 50.6,
    // every second one east of it; four rows.
    const OX = [CRT_X0, ...cuts(36.8, 50.6, 6), ...cuts(55.2, 78.2, 5), CRT_X1], OZ = cuts(-CRT_HALF, CRT_HALF, 4);
    dq.jt(3, 2.3, 2.1, 0.82); slabs(OX, OZ, COURT, false);
    tally.floors = dq.triangles;
  }
  dq.col(MARBLE).jt(0, 0, 0, 0.6);
  // the frame: three bands, each a little prouder than the one inside it, round the two sides and the top
  for (const [w0, w1, pr] of [[0, 0.2, 0.05], [0.2, 0.42, 0.085], [0.42, 0.66, 0.125]]) {
    for (const s of [-1, 1]) { const za = s * (DOOR_HALF + w0), zb = s * (DOOR_HALF + w1); dq.box(XW - pr, FLOOR, Math.min(za, zb), XW, DOOR_TOP + w1, Math.max(za, zb), 'x' + (s > 0 ? 'Z' : 'z') + 'Y'); }
    dq.box(XW - pr, DOOR_TOP + w0, -DOOR_HALF - w0, XW, DOOR_TOP + w1, DOOR_HALF + w0, 'xY');
  }
  // over it a plain band, an egg moulding, and the cornice
  const DC = DOOR_TOP + 0.66, drect = [XW, XW + 1, -DOOR_HALF - 0.75, DOOR_HALF + 0.75];
  dq.ring(drect, [[0.05, DC], [0.05, DC + 0.4]], { sides: 'W' });
  dq.jt(6, 0.22, DC + 0.4, 0.2).ring(drect, [[0.05, DC + 0.4], [0.11, DC + 0.48], [0.15, DC + 0.6]], { sides: 'W', smooth: true });
  dq.jt(0, 0, 0, 0.6).ring([XW, XW + 1, -DOOR_HALF - 1.0, DOOR_HALF + 1.0], [[0.15, DC + 0.6], [0.56, DC + 0.62], [0.56, DC + 0.86], [0.64, DC + 0.95], [0.64, DC + 1.04], [0, DC + 1.04]], { sides: 'W' });
  // the two scroll brackets: a large roll above, a small one below, a web between
  for (const s of [-1, 1]) {
    const zc = s * (DOOR_HALF + 0.88), hw = 0.17, yt = DC + 0.6, rolls = [[XW - 0.33, yt - 0.33, 0.31], [XW - 0.17, yt - 1.62, 0.17]];
    for (const [cx, cy, r] of rolls) {
      const n = 12, ring = (k) => { const a = (k / n) * Math.PI * 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
      for (let k = 0; k < n; k++) { const p = ring(k), q = ring(k + 1);
        dq.col(MARBLE).quad([q[0], q[1], zc - hw], [p[0], p[1], zc - hw], [p[0], p[1], zc + hw], [q[0], q[1], zc + hw]);
        for (const e of [-1, 1]) { const z = zc + e * hw, c = [cx, cy, z + e * 0.02], a = [p[0], p[1], z], b = [q[0], q[1], z]; dq.col(MARBLE); if (e > 0) dq.tri3(a, b, c); else dq.tri3(b, a, c); } }
    }
    dq.col(MARBLE).box(XW - 0.2, yt - 1.62, zc - hw, XW, yt - 0.3, zc + hw, 'xzZ');
  }
  // the sill: one worn slab through the doorway, 3 cm over the floor, paler where feet have gone
  {
    const SY = FLOOR + 0.03, SILL = [0.56, 0.55, 0.52], WORN = [0.66, 0.655, 0.64], zs = [-DOOR_HALF, -1.9, -0.6, 0.6, 1.9, DOOR_HALF], cs = [SILL, WORN, WORN, WORN, WORN, SILL];
    dq.jt(0, 0, 0, 0.5);
    for (let i = 0; i < 5; i++) for (const [xa, xb] of [[XW - 0.34, XW + 0.8], [XW + 0.8, DOOR_X1]])
      dq.quad([xa, SY, zs[i]], [xa, SY, zs[i + 1]], [xb, SY, zs[i + 1]], [xb, SY, zs[i]], cs[i], cs[i + 1], cs[i + 1], cs[i]);
    dq.col(SILL).box(XW - 0.34, FLOOR, -DOOR_HALF, DOOR_X1, SY, DOOR_HALF, 'xX');
  }
  // the leaves: great doors of cypress, their frame (stiles, middle post, rails, heel post) clad in bronze plate, the
  // sunk panels bare oiled cypress. Each hangs on a round heel post that turns in a bronze shoe on the sill and
  // a bronze socket under the lintel, close against the jamb, and stands open into the porch 33 degrees past the
  // square: its free end (studs and all) stands 4 cm clear of the plinth of the porch's nearest column (the plinth's
  // corner is at x 28.94, 3.065 m from the axis; at the square a leaf 3.1 m wide would stand in it). Framed: two stiles and a middle post, five rails, eight sunk panels to a leaf; bronze studs on the frame.
  const SPL = 33 * Math.PI / 180, LW = 3.1, LT = 0.28, LH = 13.9, PR = 0.16, CLAD = [0.15, 0.115, 0.062], CYP2 = [0.2, 0.138, 0.07], CYP3 = [0.176, 0.12, 0.062];
  for (const s of [-1, 1]) {
    const hx = XW - PR, hz = s * (DOOR_HALF + PR), ax = -Math.cos(SPL), az = s * Math.sin(SPL), nx = -az * s, nz = ax * s;
    // a point of the leaf: a metres from the pivot along the leaf, y above its foot, d out of its face (+: toward the axis)
    const L = (a, y, d) => [hx + ax * a - nx * d * s, FLOOR + 0.05 + y, hz + az * a - nz * d * s];
    const slab = (a0, a1, y0, y1, d0, d1, c, under) => { dq.col(c);
      const P = [L(a0, y0, d0), L(a1, y0, d0), L(a1, y1, d0), L(a0, y1, d0), L(a0, y0, d1), L(a1, y0, d1), L(a1, y1, d1), L(a0, y1, d1)];
      const f = (i, j, k, l) => dq.quad(P[i], P[j], P[k], P[l]);
      f(0, 1, 2, 3); f(5, 4, 7, 6); f(1, 5, 6, 2); f(4, 0, 3, 7); f(3, 2, 6, 7); if (under) f(4, 5, 1, 0); };
    const MID = LW / 2, VERT = [[0, 0.36], [MID - 0.13, MID + 0.13], [LW - 0.34, LW]], RAIL = [[0, 0.62], [3.52, 3.92], [6.75, 7.15], [9.98, 10.38], [LH - 0.5, LH]];
    dq.jt(10, 0.8, 2, 0.4);
    for (const [a0, a1] of VERT) slab(a0, a1, 0, LH, -LT / 2, LT / 2, CLAD);
    for (const [y0, y1] of RAIL) for (const [a0, a1] of [[0.36, MID - 0.13], [MID + 0.13, LW - 0.34]]) slab(a0, a1, y0, y1, -LT / 2, LT / 2, CLAD, y0 > 0);
    // the sunk panels: cypress, two tones by turns
    dq.jt(10, 0.62, 1, 0.42);
    for (let k = 0; k < 4; k++) for (const [a0, a1] of [[0.36, MID - 0.13], [MID + 0.13, LW - 0.34]]) slab(a0, a1, RAIL[k][1], RAIL[k + 1][0], -0.05, 0.05, k & 1 ? CYP2 : CYP3);
    // the heel post
    dq.jt(10, 0.8, 2, 0.4);
    lathe(dq, [[PR, 0.12, CLAD], [PR, LH - 0.1, CLAD]], 8, { x: hx, z: hz, y: FLOOR + 0.05 });
    // brighter bronze: the post's shoe and socket, a kick band on the bottom rail, studs on the rails and the uprights
    dq.jt(10, 1, 0, 0.36);
    lathe(dq, [[PR + 0.07, -0.02, BRONZE], [PR + 0.07, 0.07, BRONZE], [PR + 0.02, 0.14, BRONZE], [PR + 0.02, 0.2, BRONZE]], 8, { x: hx, z: hz, y: FLOOR + 0.05 });
    lathe(dq, [[PR + 0.02, LH - 0.16, BRONZE], [PR + 0.02, LH - 0.1, BRONZE], [PR + 0.07, LH - 0.03, BRONZE], [PR + 0.07, LH + 0.03, BRONZE]], 8, { x: hx, z: hz, y: FLOOR + 0.05 });
    slab(0.03, LW - 0.03, 0.05, 0.4, -LT / 2 - 0.025, LT / 2 + 0.025, BRONZE);
    const boss = (a, y, face) => { const d = face * (LT / 2), c = L(a, y, d + face * 0.075), r = 0.095, n = 6; dq.col(BRONZE);
      for (let k = 0; k < n; k++) { const t0 = (k / n) * Math.PI * 2, t1 = ((k + 1) / n) * Math.PI * 2, p = L(a + r * Math.cos(t0), y + r * Math.sin(t0), d), q = L(a + r * Math.cos(t1), y + r * Math.sin(t1), d); if (face < 0) dq.tri3(p, q, c); else dq.tri3(q, p, c); } };
    for (const face of [-1, 1]) {
      for (const y of [0.51, 3.72, 6.95, 10.18, LH - 0.25]) for (let i = 0; i < 7; i++) boss(0.24 + (i * (LW - 0.41)) / 6, y, face);
      for (const a of [0.24, MID, LW - 0.17]) for (let k = 0; k < 4; k++) for (const t of [1 / 3, 2 / 3]) boss(a, RAIL[k][1] + (RAIL[k + 1][0] - RAIL[k][1]) * t, face);
    }
  }
  tally.door = dq.triangles - tally.floors;
  await ctx.yield();
  // ----- the old small shrine in the court: a plain marble house on a low podium, facing west toward the door -----
  // (built into the same mesh as the door: one draw for all the fittings)
  const SX0 = SHRINE.x - SHRINE.halfX, SX1 = SHRINE.x + SHRINE.halfX, SZ = SHRINE.halfZ, PY = COURT + 0.7, SWY = SHRINE.eaves - 0.3;
  // THREE NUMBERS OF THE SHRINE'S LOOK, each in this one place. SHRINE_GOLD: the gilding's tone and polish on the
  // opening's frame and the gable ornaments (1: as built; less: dimmer; the curtain's rod is bronze, not gilt: only
  // its polish goes with this number). FANS_GILT: are the gable ornaments gilded (false: plain old stone).
  // LAMP_FLAME: how bright the small flames of the shrine's two lamps show (0: unlit, no flame built).
  const SHRINE_GOLD = 1, FANS_GILT = true, LAMP_FLAME = 3.2;
  // the curtain's place: its plane's middle, its foot on the sill and its top at the rod
  const CURT_X = SX0 + 0.24, CURT_Y0 = PY, CURT_Y1 = 4.47;
  const OLD = [0.6, 0.565, 0.5], PURPLE = [0.4, 0.05, 0.16], WOVEN = [0.6, 0.41, 0.13], WOOLW = [0.74, 0.72, 0.66], WOOLY = [0.66, 0.43, 0.085], LEAF = [0.2, 0.25, 0.14], BLOOM = [0.8, 0.76, 0.6];
  dq.col(OLD).jt(1, 0.35, 1.05, 0.72);
  // the podium: a moulded foot and a moulded upper edge; three steps with a nosing up to it at the front
  dq.ring([SX0 - 0.25, SX1 + 0.25, -SZ - 0.25, SZ + 0.25], [[0.1, COURT], [0.1, COURT + 0.11], [0.03, COURT + 0.19], [0, COURT + 0.22], [0, PY - 0.15], [0.06, PY - 0.09], [0.06, PY]]);
  dq.quad([SX0 - 0.31, PY, -SZ - 0.31], [SX0 - 0.31, PY, SZ + 0.31], [SX1 + 0.31, PY, SZ + 0.31], [SX1 + 0.31, PY, -SZ - 0.31]);
  for (let k = 0; k < 3; k++) { const xa = SX0 - 0.31 - 0.32 * (3 - k), yt = COURT + 0.175 * (k + 1);
    dq.box(xa, COURT, -2.3, SX0 - 0.31, yt - 0.045, 2.3, 'xzZ'); dq.box(xa - 0.03, yt - 0.045, -2.33, SX0 - 0.31, yt, 2.33, 'xzZYy'); }
  // side walls, back wall, the two wall ends at the front and the lintel over the opening
  for (const s of [-1, 1]) {
    dq.box(SX0, PY, s > 0 ? SZ - 0.32 : -SZ, SX1, SWY, s > 0 ? SZ : -SZ + 0.32, 'xXzZ');
    dq.box(SX0, PY, s > 0 ? 2.47 : -SZ + 0.32, SX0 + 0.5, SWY, s > 0 ? SZ - 0.32 : -2.47, 'xXzZ');
  }
  dq.box(SX1 - 0.32, PY, -SZ + 0.32, SX1, SWY, SZ - 0.32, 'X');
  dq.box(SX0, 4.5, -2.47, SX0 + 0.5, SWY, 2.47, 'x'); dq.col(shade(OLD, 0.3)).box(SX0, 4.5, -2.47, SX0 + 0.5, SWY, 2.47, 'y').col(OLD);
  // nothing behind the curtain: a dark sheet a little way inside the opening
  dq.col(DARK).jt(0, 0, 0, 0.95).quad([SX0 + 0.46, PY, -2.47], [SX0 + 0.46, PY, 2.47], [SX0 + 0.46, 4.5, 2.47], [SX0 + 0.46, 4.5, -2.47]);
  // the eaves moulding, the two low gables and the roof of small marble tiles
  const srect = [SX0, SX1, -SZ, SZ], SEV = SHRINE.eaves, SRD = SHRINE.ridge, OV = 0.2;
  dq.col(OLD).jt(0, 0, 0, 0.7).ring(srect, [[0, SWY], [0.05, SWY + 0.08], [0.09, SWY + 0.2], [OV, SWY + 0.24], [OV, SEV]], {});
  for (const e of [0, 1]) {
    const x = e ? SX1 + 0.06 : SX0 - 0.06, a = [x, SEV, -SZ - 0.06], b = [x, SEV, SZ + 0.06], c = [x, SRD - 0.08, 0];
    dq.jt(1, 0.35, 1.05, 0.72);
    if (e) dq.tri3(b, a, c); else dq.tri3(a, b, c);
    dq.jt(0, 0, 0, 0.7);
    // the verge: the roof's own edge over the gable
    for (const s of [-1, 1]) { const x2 = e ? SX1 + OV : SX0 - OV, p = [x2, SEV + 0.02, s * (SZ + OV)], q = [x2, SRD + 0.02, 0], p2 = [x2, SEV - 0.16, s * (SZ + OV)], q2 = [x2, SRD - 0.16, 0];
      if ((s > 0) === !!e) dq.quad(p, p2, q2, q); else dq.quad(p2, p, q, q2); }
  }
  dq.jt(8, 0.42, 0.6, 0.6);
  for (const s of [-1, 1]) { const a = [SX0 - OV, SEV + 0.02, s * (SZ + OV)], b = [SX1 + OV, SEV + 0.02, s * (SZ + OV)], c = [SX1 + OV, SRD + 0.02, 0], d = [SX0 - OV, SRD + 0.02, 0];
    if (s > 0) dq.quad(a, b, c, d); else dq.quad(b, a, d, c); }
  // the shrine's roof stands open to the court above it: raised cover tiles down both slopes every 0.6 m, each ending
  // in a small upright leaf at the eaves, and a ridge roll (everything on it is under y 7.5)
  {
    const run = SZ + OV, rise = SRD - SEV, L = Math.hypot(run, rise), ny = run / L, nzk = rise / L, RB = 0.065, RH = 0.07;
    dq.col(OLD).jt(0, 0, 0, 0.7);
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
      const x = SHRINE.x + (i - 4) * 0.6, e = [0, SEV + 0.02, s * run], r = [0, SRD + 0.02, 0];
      const P = (dx, up, at) => [x + dx, at[1] + up * ny, at[2] + s * up * nzk];
      const a = P(-RB, 0, e), b = P(RB, 0, e), t = P(0, RH, e), a2 = P(-RB, 0, r), b2 = P(RB, 0, r), t2 = P(0, RH, r);
      if (s > 0) { dq.quad(a, t, t2, a2); dq.quad(t, b, b2, t2); } else { dq.quad(t, a, a2, t2); dq.quad(b, t, t2, b2); }
      // the leaf at the eaves: a small upright plate, pointed
      const f0 = [x - 0.1, SEV - 0.03, s * (run + 0.01)], f1 = [x + 0.1, SEV - 0.03, s * (run + 0.01)], f2 = [x, SEV + 0.23, s * (run + 0.01)];
      if (s > 0) { dq.tri3(f0, f1, f2); dq.tri3(f1, f0, [x, SEV + 0.23, s * (run - 0.03)]); } else { dq.tri3(f1, f0, f2); dq.tri3(f0, f1, [x, SEV + 0.23, s * (run - 0.03)]); }
    }
    const xa = SX0 - OV, xb = SX1 + OV, yr = SRD + 0.02;
    dq.quad([xa, yr - 0.02, 0.11], [xb, yr - 0.02, 0.11], [xb, yr + 0.09, 0], [xa, yr + 0.09, 0]); dq.quad([xb, yr - 0.02, -0.11], [xa, yr - 0.02, -0.11], [xa, yr + 0.09, 0], [xb, yr + 0.09, 0]);
  }
  // a fan of leaves standing on a block: the plain ornament of the gables' tops and corners (large in marble on the
  // temple, small in gold on the shrine). It stands in the plane across the long axis.
  const palmette = (g, x, y, z, h, c) => {
    g.col(c); g.box(x - 0.09 * h, y, z - 0.2 * h, x + 0.09 * h, y + 0.16 * h, z + 0.2 * h, 'xXzZY');
    const y0 = y + 0.14 * h;
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.36, len = h * (1 - 0.1 * i * i * 0.36), wd = h * 0.085, dz = Math.sin(a), dy = Math.cos(a);
      const base = [0, 0], tip = [dz * len, dy * len], mid = [dz * len * 0.62, dy * len * 0.62], l = [mid[0] - dy * wd, mid[1] + dz * wd], r = [mid[0] + dy * wd, mid[1] - dz * wd];
      for (const f of [-1, 1]) { const t = f * 0.07 * h, B = [x + t * 0.4, y0 + base[1], z + base[0]], T = [x + t * 0.4, y0 + tip[1], z + tip[0]], Mx = [x + t, y0 + mid[1], z + mid[0]], Lp = [x, y0 + l[1], z + l[0]], Rp = [x, y0 + r[1], z + r[0]];
        if (f < 0) { g.tri3(B, Mx, Lp); g.tri3(Lp, Mx, T); g.tri3(B, Rp, Mx); g.tri3(Rp, T, Mx); } else { g.tri3(B, Lp, Mx); g.tri3(Lp, T, Mx); g.tri3(B, Mx, Rp); g.tri3(Rp, Mx, T); } }
    }
  };
  // gold: the opening's frame and the ornaments of the gables, and nowhere else on the shrine (the curtain's rod is
  // bronze). Old gilding: deep in tone, it lives by its gleam
  const GILT = [0.56 * SHRINE_GOLD, 0.37 * SHRINE_GOLD, 0.11 * SHRINE_GOLD];
  dq.jt(10, Math.min(1, SHRINE_GOLD), 0, 0.36).col(GILT);
  {
    // the frame's mouldings: a flat band, a hollow, a bead, each strip a face of its own so that each takes the light its own way
    const prof = [[0.18, 0], [0.18, 0.05], [0.12, 0.05], [0.065, 0.018], [0.05, 0.05], [0.02, 0.055], [0, 0.03], [0, -0.03]];
    // (a strip between two points of the section; W: the way its face must look)
    const fq = (a, b, c, e, W) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2];
      if ((uy * vz - uz * vy) * W[0] + (uz * vx - ux * vz) * W[1] + (ux * vy - uy * vx) * W[2] >= 0) dq.quad(a, b, c, e); else dq.quad(e, c, b, a); };
    for (let i = 0; i < prof.length - 1; i++) {
      const [o0, p0] = prof[i], [o1, p1] = prof[i + 1], x0 = SX0 - p0, x1 = SX0 - p1, y0 = 4.5 + o0, y1 = 4.5 + o1, z0 = 2.47 + o0, z1 = 2.47 + o1, edge = Math.abs(o0 - o1) < 1e-9, k = p1 > p0 ? 1 : -1;
      for (const s of [-1, 1]) fq([x0, PY, s * z0], [x1, PY, s * z1], [x1, y1, s * z1], [x0, y0, s * z0], edge ? [0, 0, s * k] : [-1, 0, 0]);
      fq([x0, y0, -z0], [x1, y1, -z1], [x1, y1, z1], [x0, y0, z0], edge ? [0, k, 0] : [-1, 0, 0]);
    }
    // the frame's own reveal, from its face to the curtain, is gilded with it
    for (const s of [-1, 1]) fq([SX0 + 0.02, PY, s * 2.468], [CURT_X + 0.02, PY, s * 2.468], [CURT_X + 0.02, 4.5, s * 2.468], [SX0 + 0.02, 4.5, s * 2.468], [0, 0, -s]);
  }
  dq.col([0.3, 0.19, 0.085]).box(SX0 + 0.1, 4.44, -2.52, SX0 + 0.17, 4.51, 2.52, 'xyY').col(GILT);
  if (!FANS_GILT) dq.jt(0, 0, 0, 0.7);
  palmette(dq, SX0 - OV + 0.06, SRD, 0, 0.5, FANS_GILT ? GILT : OLD);
  for (const s of [-1, 1]) palmette(dq, SX0 - OV + 0.06, SEV + 0.02, s * (SZ + 0.02), 0.42, FANS_GILT ? GILT : OLD);
  palmette(dq, SX1 + OV - 0.06, SRD, 0, 0.62, FANS_GILT ? GILT : OLD);
  await ctx.yield();
  // THE CURTAIN: plain cloth: ONE heavy wool of one colour, a deep sea purple, from the rod to the sill, in deep upright folds;
  // only the folds (their hollows darker) and the light shade it. Nothing is woven or painted on it; it has no band,
  // no border, no heading or hem of another tone. It is SHUT and fills the opening from jamb to jamb and from the rod
  // to the sill; it is fastened at the rod, at the sill and at both edges and stirs only in its middle (a hand's
  // breadth at the most), so that no gap can open. Nothing is behind it but the dark sheet.
  {
    const CX = CURT_X, CY0 = CURT_Y0, CH = CURT_Y1 - CY0, NC = 68, ZH = 2.465, DEEP = [0.112, 0.017, 0.132];
    // (the folds die out at the two edges, where the cloth lies against the frame's reveal)
    const held = (z) => Math.min(1, (ZH - Math.abs(z)) / 0.35), fold = (z) => held(z) * (0.085 * Math.sin(z * 15.1) + 0.03 * Math.sin(z * 30.2 + 0.9) + 0.012 * Math.sin(z * 7.0 + 2.0));
    const dfold = (z) => held(z) * (1.2835 * Math.cos(z * 15.1) + 0.906 * Math.cos(z * 30.2 + 0.9) + 0.084 * Math.cos(z * 7.0 + 2.0));
    // (four rows up its height, 68 strips across: the cloth bends at them when it stirs)
    for (const [ya, yb] of [[0, 0.14], [0.14, CH / 2], [CH / 2, CH - 0.1], [CH - 0.1, CH]]) for (let i = 0; i < NC; i++) {
      const za = -ZH + (i / NC) * 2 * ZH, zb = -ZH + ((i + 1) / NC) * 2 * ZH;
      const vtx = (z, y) => { const dd = dfold(z), l = Math.hypot(1, dd), k = 0.32 + 0.68 * Math.min(1, Math.max(0, 0.5 - fold(z) / 0.2)); dq.jt(11, 0.5 * Math.sin(Math.PI * y / CH) * held(z), 0, 0.9); return dq.v(CX + fold(z), CY0 + y, z, -1 / l, 0, dd / l, [DEEP[0] * k, DEEP[1] * k, DEEP[2] * k]); };
      const p = vtx(zb, ya), q = vtx(za, ya), cq = vtx(za, yb), e = vtx(zb, yb);
      dq.tri(p, cq, q); dq.tri(p, e, cq);
    }
  }
  // wool fillets, white (undyed) and saffron yellow, hanging from pegs on the wall ends and under the garlands; they stir at their free ends
  // (a fillet: a narrow band knotted at even spaces, the knots as swellings of its outline, a tassel at its end)
  const band = (x, y, z, len, c, wd) => { const n = 7, W = [1, 2.3, 1, 2.3, 1, 2.3, 1, 2];
    for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, w0 = wd * W[k], w1 = wd * W[k + 1];
      const vt = (zz, t) => { dq.jt(11, 0.45 * t, 0, 0.9); return dq.v(x - 0.012 * t, y - len * t, zz, -1, 0, 0, c); };
      const a = vt(z + w0, t0), b = vt(z - w0, t0), cq = vt(z - w1, t1), d = vt(z + w1, t1); dq.tri(a, b, cq); dq.tri(a, cq, d); } };
  for (const s of [-1, 1]) { band(SX0 - 0.03, 4.05, s * 2.72, 1.7, WOOLW, 0.024); band(SX0 - 0.03, 4.05, s * 2.81, 2.15, WOOLY, 0.024); band(SX0 - 0.03, 4.05, s * 2.9, 1.45, WOOLW, 0.024); }
  // garlands: swags of olive leaves from peg to peg across the lintel and along the side walls; ragged in outline
  // (their rings fat and thin by turns), two grey greens, small pale flowers worked in
  const LEAF2 = [0.33, 0.385, 0.25];
  const swag = (p0, p1, sag, r, n = 10) => { const m = 5, first = dq.count, along = [p1[0] - p0[0], p1[2] - p0[2]], al = Math.hypot(along[0], along[1]) || 1, nx = -along[1] / al, nz = along[0] / al;
    for (let i = 0; i <= n; i++) { const t = i / n, k = 4 * t * (1 - t), cx = p0[0] + along[0] * t, cy = p0[1] - sag * k, cz = p0[2] + along[1] * t, rr = r * (0.6 + 0.5 * k) * (i & 1 ? 1.3 : 0.74);
      for (let j = 0; j < m; j++) { const a = ((j + 0.5 * (i & 1)) / m) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); dq.jt(11, 0.3 * k, 1, 0.85); dq.v(cx + nx * c * rr, cy + sn * rr, cz + nz * c * rr, nx * c, sn, nz * c, (i * 3 + j * 2) % 7 === 0 ? BLOOM : (i + j) & 1 ? LEAF : LEAF2); } }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = first + i * m + j, b = first + i * m + (j + 1) % m, c = b + m, d = a + m; dq.tri(a, c, d); dq.tri(a, b, c); } };
  for (let i = 0; i < 3; i++) { const za = -2.7 + i * 1.8; swag([SX0 - 0.09, 4.98, za], [SX0 - 0.09, 4.98, za + 1.8], 0.36, 0.085); }
  for (let i = 0; i < 4; i++) { const z = -2.7 + i * 1.8; band(SX0 - 0.1, 4.98, z - 0.04, 0.75, WOOLY, 0.02); band(SX0 - 0.1, 4.98, z + 0.04, 0.6, WOOLW, 0.02); }
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const xa = SX0 + 0.35 + i * 2.1; swag([xa, 4.4, s * (SZ + 0.09)], [xa + 2.1, 4.4, s * (SZ + 0.09)], 0.4, 0.075); }
  // bronze (a tended bronze, a dark warm brown with an olive cast, plainly another metal than the shrine's gilt: BR2;
  // its own colour is nearly as green as it is red, so that a low golden sun makes it a golden brown and not an
  // orange; a dull green stands in its hollows: PATINA): THE TWO LAMPS: two lamp stands at the corners of the front, each with a small steady flame
  // (LAMP_FLAME). They are the only two flames the part has. Nothing stands on the long axis before the steps.
  const BR2 = [0.115, 0.108, 0.07], PATINA = [0.085, 0.112, 0.08];
  dq.jt(10, 0.6, 2, 0.46);
  for (const s of [-1, 1]) lathe(dq, [[0.22, 0, BR2], [0.22, 0.04, BR2], [0.07, 0.12, BR2], [0.03, 0.26, BR2], [0.03, 0.9, BR2], [0.055, 0.94, BR2], [0.03, 0.98, BR2], [0.026, 1.72, BR2], [0.06, 1.76, BR2], [0.15, 1.8, BR2], [0.15, 1.83, BR2], [0.11, 1.83, BR2], [0.03, 1.8, [0.062, 0.054, 0.038]]], 8, { x: SX0 - 0.95, z: s * 3.75, y: COURT });
  // (kind 12: a small steady flame; it shows by its own colour and lights nothing)
  dq.jt(12, LAMP_FLAME, 0, 1);
  if (LAMP_FLAME > 0) for (const s of [-1, 1]) lathe(dq, [[0.012, 0, [1, 0.8, 0.42]], [0.036, 0.035, [1, 0.72, 0.3]], [0.03, 0.08, [1, 0.6, 0.18]], [0.013, 0.13, [1, 0.45, 0.1]], [0.0, 0.17, [0.9, 0.32, 0.06]]], 5, { x: SX0 - 0.95, z: s * 3.75, y: COURT + 1.815 });
  shades.push([SX0 - 0.95, 3.75, 0.46, 0.55], [SX0 - 0.95, -3.75, 0.46, 0.55]);
  // ----- THE COURT'S DRESSING OF THE DAY (ours; no feast is named): leafy garlands in swags along both side walls and
  // the east wall at the band at the temple's floor level, a white and a saffron ribbon at every peg; tall plain
  // hangings of wool under the upper string course, five down the east wall with great swags between them and three
  // on each long wall; and on the old floor what people
  // have brought, in rows laid by a rule of the place (told below, at WHAT STANDS IN THE COURT): great bronze
  // tripods, tall incense stands and great jars flanking the middle way, a second row of basins, tripods, garlanded
  // altars, incense stands and great clay jars, and smaller things along the walls (small altars of old stone,
  // stands with a dish, lamp stands (unlit), clay jars, boughs in jars, low benches); on the altars and in the
  // dishes a plain offering (fruit, a wreath, a bowl, a folded cloth). No figures, no lettering; none on the stair,
  // none within 2.28 m of the long axis from the stair's foot to the shrine's steps: the middle way is open. Behind
  // the shrine one great bronze bowl stands on the axis before the east wall. -----
  {
    const GREEN = [0.17, 0.225, 0.12], GREEN2 = [0.31, 0.37, 0.24], RIBW = [0.8, 0.77, 0.7], RIBY = [0.68, 0.44, 0.085], FRUIT = [[0.55, 0.1, 0.07], [0.62, 0.42, 0.1], [0.45, 0.33, 0.1]];
    const NSW = 15, XA = CRT_X0 + 0.45, SPAN = (CRT_X1 - CRT_X0 - 0.9) / NSW, GY = FLOOR + 0.2, BRD = [0.062, 0.054, 0.038], WORN = [0.25, 0.215, 0.125];
    // a ribbon's tail hanging before a side wall (s: +1 the south wall, -1 the north); it stirs at its free end
    const tail = (x, y, z, len, c, wd, s) => { for (let q = 0; q < 3; q++) { const t0 = q / 3, t1 = (q + 1) / 3, w0 = wd * (1 + 0.5 * t0 * t0), w1 = wd * (1 + 0.5 * t1 * t1);
      const vt = (xx, t) => { dq.jt(11, 0.5 * t, 0, 0.9); return dq.v(xx, y - len * t, z - s * 0.012 * t, 0, 0, -s, c); };
      const a = vt(x + w0, t0), b = vt(x - w0, t0), cq = vt(x - w1, t1), d = vt(x + w1, t1); if (s > 0) { dq.tri(a, cq, b); dq.tri(a, d, cq); } else { dq.tri(a, b, cq); dq.tri(a, cq, d); } } };
    const fruit = (x, y, z, r, c) => { dq.jt(0, 0, 0, 0.55); lathe(dq, [[0.004, 0, c], [r, r, c], [0.004, 2 * r, c]], 5, { x, z, y }); };
    // what lies on an altar or in a stand's dish (k: which)
    const offering = (k, x, y, z, s) => {
      if (k === 0 || k === 3) { for (let i = 0; i < 4; i++) fruit(x + 0.085 * Math.cos(i * 1.571 + 0.5), y, z + 0.085 * Math.sin(i * 1.571 + 0.5), 0.062, FRUIT[i % 3]); fruit(x, y + 0.085, z, 0.062, FRUIT[(k + 1) % 3]); }
      else if (k === 1 || k === 4) {
        // a wreath of leaves lying flat, a saffron ribbon's two tails over the edge toward the court
        dq.jt(11, 0, 1, 0.85); lathe(dq, [[0.17, 0, GREEN], [0.225, 0.05, GREEN2], [0.17, 0.1, GREEN], [0.115, 0.05, GREEN2], [0.17, 0, GREEN]], 8, { x, z, y, mod: (i, j) => [(i + j) & 1 ? 0.02 : -0.012, null] });
        if (k === 1) { tail(x - 0.04, y + 0.02, z - s * 0.335, 0.34, RIBY, 0.03, s); tail(x + 0.05, y + 0.02, z - s * 0.335, 0.26, RIBY, 0.03, s); }
      } else if (k === 2) {
        dq.jt(10, 0.6, 2, 0.46); lathe(dq, [[0.05, 0, BR2], [0.06, 0.02, BR2], [0.17, 0.1, BR2], [0.18, 0.115, BR2], [0.155, 0.115, BR2], [0.04, 0.04, BRD]], 6, { x, z, y });
        for (let i = 0; i < 3; i++) fruit(x + 0.06 * Math.cos(i * 2.094), y + 0.035, z + 0.06 * Math.sin(i * 2.094), 0.055, FRUIT[i]);
      } else {
        // a folded cloth, purple with a woven edge, and two fruits on it
        dq.jt(0, 0, 0, 0.9).col(PURPLE).box(x - 0.17, y, z - 0.12, x + 0.17, y + 0.05, z + 0.12, 'xXzZY'); dq.col(WOVEN).box(x - 0.175, y + 0.015, z - 0.125, x + 0.175, y + 0.03, z + 0.125, 'xXzZ');
        fruit(x - 0.05, y + 0.05, z, 0.055, FRUIT[1]); fruit(x + 0.06, y + 0.05, z + 0.02, 0.055, FRUIT[0]);
      }
    };
    // WHAT STANDS IN THE COURT (ours), LAID BY A RULE OF THE PLACE; the two sides of the long axis are mirrors.
    // (1) THE WAY'S ROW, 2.9 m from the axis (WAY, at the module's head): a great thing in the middle of each of the old
    //     floor's bands from the first past the stair's foot to the last before the shrine's steps: three tripods
    //     2.7 m high and between each two a tall incense stand of 2.3 m (by these heights and the bands' step every
    //     bowl and every dish stands whole in the sun: no head's shadow lies on the next head); and on the same line
    //     behind the shrine, in every second band from 63.25 to 77.05: a great jar 1.95 m, an incense stand, two tripods.
    //     Their nearest parts to the axis: the tripods' feet at the floor 2.28 m from it, their rims and ring
    //     handles 2.32 m.
    // (2) THE SECOND ROW, 6.0 m from the axis: on every second joint of the floor's bands from 41.4 (1.3 m past the
    //     stair's foot) to 78.2, by turns a basin on a stone stand, a tripod of 2 m, a garlanded altar, an incense
    //     stand, great clay jars.
    // (3) THE WALL ROW, 0.85 m before each side wall's face: one smaller thing under the middle of every garland swag
    //     from the stair's foot to the shrine's back, then under every second swag to the east wall; and 0.85 m before
    //     the east wall's face, under the middle of each of its swags but the middle one: a lamp stand, a great clay
    //     jar 1.9 m high, boughs in a jar.
    // (4) BEFORE THE EAST WALL, on the long axis behind the shrine, in the middle of the band at 74.75: one great bronze
    //     bowl 2.5 m across, 1.5 m high.
    // The kinds go by turns along the second row and the wall row. Each kind has a stream of its own name; it deals
    // where within a hand's breadth of its place a thing stands, and what lies on it. Nothing is lettered; nothing
    // names a rite. Every lamp stand is unlit.
    const KINDS = {}; for (const k of ['tripod', 'incense', 'jars', 'greatjars', 'basin', 'garlanded', 'altar', 'stand', 'bench', 'boughs', 'lamp', 'pithos']) KINDS[k] = ctx.core.makeRng(ctx.core.hashSeed('artemis-court-' + k));
    const laid = [], lay = (kind, x, az, slack) => { const r = KINDS[kind]; laid.push([kind, x + (r() - 0.5) * 2 * slack, az, r()]); };
    const WALL_ROW = ['altar', 'boughs', 'stand', 'lamp', 'jars', 'bench'], ROW2 = ['basin', 'tripod', 'garlanded', 'incense', 'greatjars'];
    for (let k = 0, i = 0; k < NSW; k++) { const x = XA + (k + 0.5) * SPAN; if (x > STAIR_X1 + 0.5 && (x < SX1 || (k & 1) === 1)) lay(WALL_ROW[i++ % WALL_ROW.length], x, CRT_HALF - 0.85, 0.3); }
    for (let x = 41.4, i = 0; x < CRT_X1 - 2; x += 4.6, i++) lay(ROW2[i % ROW2.length], x, 6.0, 0.1);
    lay('lamp', CRT_X1 - 0.85, 2.89, 0); lay('pithos', CRT_X1 - 0.95, 5.78, 0); lay('boughs', CRT_X1 - 0.85, 8.67, 0);
    const JAR = [0.36, 0.212, 0.128], JAR2 = [0.31, 0.205, 0.138], TWIG = [0.2, 0.15, 0.09];
    // a face of four corners turned the way W looks
    const quadW = (a, b, c, e, W) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2];
      if ((uy * vz - uz * vy) * W[0] + (uz * vx - ux * vz) * W[1] + (ux * vy - uy * vx) * W[2] >= 0) dq.quad(a, b, c, e); else dq.quad(e, c, b, a); };
    // a square bar from A to B, w its half thickness
    const bar = (A, B, w) => { const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, e = Math.abs(d[1]) / l > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let u = [d[1] * e[2] - d[2] * e[1], d[2] * e[0] - d[0] * e[2], d[0] * e[1] - d[1] * e[0]]; const ul = Math.hypot(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
      const v = [(d[1] * u[2] - d[2] * u[1]) / l, (d[2] * u[0] - d[0] * u[2]) / l, (d[0] * u[1] - d[1] * u[0]) / l];
      for (const [n, t] of [[u, v], [v, u.map((q) => -q)], [u.map((q) => -q), v.map((q) => -q)], [v.map((q) => -q), u]]) {
        const P = (Q, k) => [Q[0] + (n[0] + k * t[0]) * w, Q[1] + (n[1] + k * t[1]) * w, Q[2] + (n[2] + k * t[2]) * w];
        quadW(P(A, -1), P(A, 1), P(B, 1), P(B, -1), n); } };
    // a skin over a grid of points, each with its own normal and colour (pt(i, j): [place, normal, colour]; ni rows
    // of nj): every face is turned the way its normals look; wi, wj: the grid closes on itself along i, along j
    const skin = (pt, ni, nj, wi, wj) => { const first = dq.count, Q = [];
      for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) { const [q, n, c] = pt(i, j); Q.push(q, n); dq.v(q[0], q[1], q[2], n[0], n[1], n[2], c); }
      for (let i = 0; i < (wi ? ni : ni - 1); i++) for (let j = 0; j < (wj ? nj : nj - 1); j++) {
        const ia = i * nj + j, ib = i * nj + (j + 1) % nj, ic = ((i + 1) % ni) * nj + (j + 1) % nj, id = ((i + 1) % ni) * nj + j, A = Q[2 * ia], B = Q[2 * ib], D = Q[2 * id], n = Q[2 * ia + 1];
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
        if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] >= 0) { dq.tri(first + ia, first + ib, first + ic); dq.tri(first + ia, first + ic, first + id); }
        else { dq.tri(first + ia, first + ic, first + ib); dq.tri(first + ia, first + id, first + ic); } } };
    // a round rod through the points C with the radii R, n corners round (its ends are not made)
    const rod = (C, R, n, c) => { const m = C.length - 1, d = [C[m][0] - C[0][0], C[m][1] - C[0][1], C[m][2] - C[0][2]], l = Math.hypot(d[0], d[1], d[2]) || 1, e = Math.abs(d[1]) / l > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let u = [d[1] * e[2] - d[2] * e[1], d[2] * e[0] - d[0] * e[2], d[0] * e[1] - d[1] * e[0]]; const ul = Math.hypot(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
      const v = [(d[1] * u[2] - d[2] * u[1]) / l, (d[2] * u[0] - d[0] * u[2]) / l, (d[0] * u[1] - d[1] * u[0]) / l];
      skin((i, j) => { const a = (j / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), q = [u[0] * ca + v[0] * sa, u[1] * ca + v[1] * sa, u[2] * ca + v[2] * sa];
        return [[C[i][0] + q[0] * R[i], C[i][1] + q[1] * R[i], C[i][2] + q[2] * R[i]], q, c]; }, m + 1, n, false, true); };
    // a tall bronze tripod: three legs, three stretchers, a deep bowl
    const tripod = (x, z, h) => { dq.jt(10, 0.6, 2, 0.46).col(BR2); const y = COURT, F = [], M = [];
      for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.5, c = Math.cos(a), sn = Math.sin(a); F.push([x + c * 0.4, y, z + sn * 0.4]); M.push([x + c * 0.31, y + h * 0.42, z + sn * 0.31]); bar(F[k], [x + c * 0.25, y + h - 0.3, z + sn * 0.25], 0.024); }
      for (let k = 0; k < 3; k++) bar(M[k], M[(k + 1) % 3], 0.016);
      lathe(dq, [[0.05, h - 0.46, BR2], [0.2, h - 0.4, BR2], [0.31, h - 0.24, BR2], [0.34, h - 0.04, BR2], [0.37, h, BR2], [0.32, h, BR2], [0.29, h - 0.05, BRD]], 8, { x, z, y }); };
    // a tall bronze incense stand: a spreading foot, a slender stem with two knops, a dish, a pierced pointed lid
    const thurible = (x, z) => { dq.jt(10, 0.6, 2, 0.46);
      lathe(dq, [[0.21, 0, BR2], [0.21, 0.04, BR2], [0.1, 0.1, BR2], [0.04, 0.22, BR2], [0.034, 0.74, BR2], [0.07, 0.78, BR2], [0.034, 0.82, BR2], [0.03, 1.28, BR2], [0.06, 1.33, BR2], [0.17, 1.42, BR2], [0.18, 1.46, BR2], [0.13, 1.47, BRD], [0.1, 1.56, BR2], [0.035, 1.63, BR2], [0.05, 1.66, BR2], [0.0, 1.69, BR2]], 6, { x, z, y: COURT }); };
    // a clay jar
    const jar = (x, z, h, c, n) => { const r = h * 0.3; dq.jt(0, 0, 0, 0.62);
      lathe(dq, [[r * 0.42, 0, c], [r * 0.95, h * 0.33, c], [r, h * 0.52, c], [r * 0.82, h * 0.72, c], [r * 0.42, h * 0.86, c], [r * 0.4, h * 0.94, c], [r * 0.56, h, c], [r * 0.3, h * 0.97, [0.04, 0.025, 0.02]]], n, { x, z, y: COURT }); };
    // THE WAY'S GREAT BRONZES, by the profiles at the module's head (bright outside, dark within)
    const bronze = (prof) => prof.map((p) => [p[0], p[1], p[2] === 1 ? BRD : p[2] === 3 ? WORN : p[2] ? PATINA : BR2]);
    // a great tripod: a deep cauldron on three straight legs with feet, three stretchers between the legs, two ring
    // handles standing upright on the rim, fore and aft of nothing: they stand over the rim's two sides (H: their top).
    // fine (the bowl's sides round, 0 for the plain make): the legs round on plain paws, the stretchers round, the
    // handles smooth rings: the make of the six that stand before the shrine, beside the middle way
    const greatTripod = (x, z, H, fine) => { const y = COURT, rim = H - 0.3, hm = 0.42 * rim, top = rim - 0.04, P = [], lean = (WAY_LEG[0] - WAY_LEG[1]) / top;
      dq.jt(10, 0.6, 2, 0.46).col(BR2); lathe(dq, bronze(wayBowl(H)), fine || 16, { x, z, y });
      for (let k = 0; k < 3; k++) { const a = k * 2.0944, c = Math.cos(a), sn = Math.sin(a), at = (r, h) => [x + c * r, y + h, z + sn * r];
        if (fine) rod([at(WAY_LEG[0] + 0.02, 0), at(WAY_LEG[0] + 0.016, 0.075), at(WAY_LEG[0] - lean * 0.2, 0.2), at(WAY_LEG[1], top)], [0.058, 0.06, 0.036, 0.03], 6, BR2);
        else { bar(at(WAY_LEG[0], 0), at(WAY_LEG[1], top), 0.034); bar(at(WAY_LEG[0] + 0.03, 0), at(WAY_LEG[0], 0.14), 0.056); }
        P.push(at(WAY_LEG[0] - lean * hm, hm)); }
      for (let k = 0; k < 3; k++) { if (fine) rod([P[k], P[(k + 1) % 3]], [0.021, 0.021], 5, BR2); else bar(P[k], P[(k + 1) % 3], 0.02); }
      for (const e of [-1, 1]) { const R = 0.15, yc = y + rim + 0.14, zc = z + e * 0.555;
        if (fine) skin((i, j) => { const a = i * 0.44880, b = j * 1.25664, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
          return [[x + (R + 0.022 * cb) * ca, yc + (R + 0.022 * cb) * sa, zc + 0.022 * sb], [cb * ca, cb * sa, sb], BR2]; }, 14, 5, true, true);
        else for (let i = 0; i < 10; i++) { const a0 = i * 0.62832, a1 = a0 + 0.62832;
          bar([x + R * Math.cos(a0), yc + R * Math.sin(a0), zc], [x + R * Math.cos(a1), yc + R * Math.sin(a1), zc], 0.02); } } };
    // a tall incense stand (H: the lid's point)
    const tallStand = (x, z, H) => { dq.jt(10, 0.6, 2, 0.46); lathe(dq, bronze(wayStand(H)), 12, { x, z, y: COURT }); };
    // a great bronze jar on a square plinth of old stone, a handle fore and aft from the shoulder to the neck (H: the lip)
    const greatJar = (x, z, H) => { const y = COURT, k = (H - WAY_PLINTH) / 1.7, yp = y + WAY_PLINTH;
      dq.col(OLD).jt(0, 0, 0, 0.78).box(x - 0.45, y, z - 0.45, x + 0.45, yp, z + 0.45, 'xXzZY');
      dq.jt(10, 0.6, 2, 0.46).col(BR2); lathe(dq, bronze(wayJar(H)), 16, { x, z, y });
      for (const e of [-1, 1]) { const B = [x + e * 0.64, yp + 1.36 * k, z]; bar([x + e * 0.49, yp + 1.08 * k, z], B, 0.028); bar(B, [x + e * 0.36, yp + 1.45 * k, z], 0.028); } };
    // a bronze basin on a turned stand of old stone
    const basin = (x, z) => { const y = COURT;
      dq.jt(0, 0, 0, 0.78); lathe(dq, [[0.36, 0], [0.36, 0.07], [0.27, 0.13], [0.17, 0.3], [0.15, 0.62], [0.17, 0.95], [0.24, 1.03], [0.27, 1.07]].map((p) => [p[0], p[1], OLD]), 10, { x, z, y });
      dq.jt(10, 0.6, 2, 0.46); lathe(dq, bronze([[0.1, 1.07], [0.34, 1.13], [0.5, 1.25], [0.54, 1.33], [0.56, 1.36, 3], [0.52, 1.36, 3], [0.44, 1.28, 1], [0.1, 1.18, 1]]), 12, { x, z, y }); };
    // a small altar of old stone
    const altar = (x, z, w, h) => { const y = COURT;
      dq.col(OLD).jt(0, 0, 0, 0.78).ring([x - w, x + w, z - w, z + w], [[0.08, y], [0.08, y + 0.1], [0.02, y + 0.17], [0, y + 0.22], [0, y + h - 0.16], [0.03, y + h - 0.12], [0.08, y + h - 0.08], [0.08, y + h]]);
      dq.quad([x - w - 0.08, y + h, z - w - 0.08], [x - w - 0.08, y + h, z + w + 0.08], [x + w + 0.08, y + h, z + w + 0.08], [x + w + 0.08, y + h, z - w - 0.08]); };
    // a bronze stand with a dish
    const dish = (x, z) => { dq.jt(10, 0.6, 2, 0.46);
      lathe(dq, [[0.24, 0, BR2], [0.24, 0.03, BR2], [0.07, 0.1, BR2], [0.03, 0.24, BR2], [0.03, 0.5, BR2], [0.055, 0.54, BR2], [0.03, 0.58, BR2], [0.03, 0.84, BR2], [0.09, 0.9, BR2], [0.27, 0.97, BR2], [0.29, 1.0, BR2], [0.25, 1.0, BR2], [0.05, 0.94, BRD]], 6, { x, z, y: COURT }); };
    // a bronze lamp stand, UNLIT: its dish is empty and dark. (The only flames in the court are the two of the
    // shrine's own lamps.)
    const lamp = (x, z, h) => { dq.jt(10, 0.6, 2, 0.46);
      lathe(dq, [[0.2, 0, BR2], [0.2, 0.04, BR2], [0.065, 0.11, BR2], [0.028, 0.24, BR2], [0.028, h * 0.5, BR2], [0.05, h * 0.5 + 0.04, BR2], [0.028, h * 0.5 + 0.08, BR2], [0.025, h - 0.1, BR2], [0.055, h - 0.06, BR2], [0.14, h - 0.02, BR2], [0.14, h, BR2], [0.1, h, BR2], [0.03, h - 0.03, BRD]], 6, { x, z, y: COURT }); };
    // a low stone bench against the wall with folded cloths and a wreath on it
    const bench = (x, z, s) => { const y = COURT, Y = y + 0.52;
      dq.col(OLD).jt(0, 0, 0, 0.78).box(x - 0.7, y + 0.42, z - 0.25, x + 0.7, Y, z + 0.25, 'xXyYzZ');
      for (const e of [-1, 1]) dq.box(x + e * 0.5 - 0.09, y, z - 0.2, x + e * 0.5 + 0.09, y + 0.42, z + 0.2, 'xXzZ');
      dq.jt(0, 0, 0, 0.9).col(PURPLE).box(x - 0.55, Y, z - 0.16, x - 0.12, Y + 0.06, z + 0.16, 'xXzZY'); dq.col(WOVEN).box(x - 0.555, Y + 0.02, z - 0.165, x - 0.115, Y + 0.035, z + 0.165, 'xXzZ');
      dq.col(WOOLW).box(x - 0.5, Y + 0.06, z - 0.13, x - 0.17, Y + 0.11, z + 0.13, 'xXzZY');
      offering(4, x + 0.34, Y, z, s); };
    // leafy cut branches standing in a jar: four forked twigs of uneven length and lean, each with many small leaves
    // set by turns to either side (dealt from the branches' own stream, named by the jar's own number: the two sides
    // of the court are mirrors); they stir
    const boughs = (x, y, z, s, v) => { const r = ctx.core.makeRng(ctx.core.hashSeed('artemis-court-branch-' + Math.floor(v * 1e6)));
      // both sides of a flat three or four cornered piece
      const both = (ids) => { for (let i = 1; i < ids.length - 1; i++) { dq.tri(ids[0], ids[i], ids[i + 1]); dq.tri(ids[i + 1], ids[i], ids[0]); } };
      const twig = (B, a, lean, len, leaves, t0) => { const ca = Math.cos(a), sa = Math.sin(a);
        const T = (t) => { const out = lean * len * t * (0.5 + 0.5 * t); return [B[0] + ca * out, B[1] + len * t * (1 - 0.12 * t), B[2] + s * sa * out]; };
        const V = (p, t, c) => { dq.jt(11, Math.min(1, t0 + 0.5 * t), 1, 0.85); return dq.v(p[0], p[1], p[2], ca * 0.7, 0.6, s * sa * 0.7, c); };
        for (let i = 0; i < 2; i++) { const p = T(i / 2), q = T((i + 1) / 2), w = 0.011;
          both([V([p[0] - sa * w, p[1], p[2] + s * ca * w], i / 2, TWIG), V([p[0] + sa * w, p[1], p[2] - s * ca * w], i / 2, TWIG), V([q[0] + sa * w, q[1], q[2] - s * ca * w], (i + 1) / 2, TWIG), V([q[0] - sa * w, q[1], q[2] + s * ca * w], (i + 1) / 2, TWIG)]); }
        for (let j = 0; j < leaves; j++) { const t = 0.22 + 0.78 * (j + 0.6 * r()) / leaves, p = T(Math.min(1, t)), e = j & 1 ? 1 : -1, l = 0.13 + 0.09 * r(), w = 0.3 * l, up = 0.25 + 0.5 * r();
          const d = [(-sa * e * 0.85 + ca * 0.35) * l, up * l, s * (ca * e * 0.85 + sa * 0.35) * l], m = [p[0] + d[0] * 0.5, p[1] + d[1] * 0.5, p[2] + d[2] * 0.5];
          const wv = j % 3 === 0 ? [0, w, 0] : [ca * w, 0.3 * w, s * sa * w], c = (j + leaves) % 3 === 0 ? GREEN2 : j & 1 ? GREEN : LEAF;
          both([V(p, t, c), V([m[0] + wv[0], m[1] + wv[1], m[2] + wv[2]], t, c), V([p[0] + d[0], p[1] + d[1], p[2] + d[2]], t, c), V([m[0] - wv[0], m[1] - wv[1], m[2] - wv[2]], t, c)]); }
        return T; };
      for (let k = 0; k < 4; k++) { const a = k * 1.5708 + 0.5 + 0.9 * r(), lean = 0.22 + 0.3 * r(), len = 0.75 + 0.6 * r();
        const T = twig([x, y, z], a, lean, len, 7, 0); twig(T(0.45 + 0.2 * r()), a + (r() < 0.5 ? -1 : 1) * (0.6 + 0.5 * r()), 0.5 + 0.3 * r(), len * (0.35 + 0.2 * r()), 4, 0.3); } };
    // a garland from peg to peg: three faces of a ragged tube (the side against the wall is not made), its rings fat
    // and thin by turns, two grey greens of olive leaves, small pale flowers worked in. at(t, out): the place t of the
    // way along it and out from the wall; nrm(m): the level part of a normal that looks m out from the wall; Y: the
    // pegs' height, SAG: how far it hangs down in its middle, RR: its thickness, n: its rings
    const garland = (k, at, nrm, flip, Y = GY - 0.08, SAG = 0.55, RR = 0.14, n = 12) => { const first = dq.count;
      for (let i = 0; i <= n; i++) {
        const t = i / n, sag = 4 * t * (1 - t), y = Y - SAG * sag, r = RR * (i & 1 ? 1.3 : 0.78) * (0.6 + 0.4 * sag);
        [[0.0, 0.55], [0.5, 1.0], [1.15, 0.05], [0.35, -1.0]].forEach(([o, h], j) => {
          const c = (i * 7 + j * 3 + k) % 9 === 0 ? BLOOM : (i * 5 + j * 2 + k) % 17 === 0 ? RIBW : (i + j) & 1 ? GREEN : GREEN2, l = Math.hypot(o - 0.4, h) || 1, p = at(t, 0.05 + o * r), q = nrm((o - 0.4) / l);
          dq.jt(11, 0.25 * sag, 1, 0.85); dq.v(p[0], y + h * r, p[1], q[0], h / l, q[1], c); });
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const a = first + i * 4 + j, b = a + 1, c = b + 4, d = a + 4; if (flip) { dq.tri(a, c, b); dq.tri(a, d, c); } else { dq.tri(a, b, c); dq.tri(a, c, d); } } };
    // along the east wall's foot band: seven swags, at every peg a knot, a white and a saffron wool band
    { const NE = 7, ZA = CRT_HALF - 0.45, SPE = 2 * ZA / NE, xw = CRT_X1 - 0.17;
      for (let k = 0; k < NE; k++) garland(k, (t, out) => [xw - out, ZA - (k + t) * SPE], (m) => [-m, 0], true);
      for (let k = 0; k <= NE; k++) { const z = ZA - k * SPE;
        dq.col(RIBW).jt(11, 0, 0, 0.9).box(xw - 0.2, GY - 0.14, z - 0.07, xw, GY + 0.03, z + 0.07, 'zZyYx');
        band(xw - 0.205, GY - 0.12, z - 0.045, 0.95 + 0.07 * ((k * 3) % 4), RIBW, 0.03); band(xw - 0.21, GY - 0.12, z + 0.05, 0.66 + 0.1 * ((k * 5) % 3), RIBY, 0.03); } }
    // THE WALLS DRESSED FOR THE DAY (ours: a wall's own dress, no member of the building): TALL PLAIN HANGINGS OF WOOL,
    // each one length of cloth of one colour (sea purple, saffron, undyed white; nothing woven or painted on it),
    // its head round a bronze rod that lies on two bronze pegs under the upper string course; it falls in three
    // folds, a little narrower toward its foot; the foot is free and stirs slowly. at(s, out): the place s across it
    // and out from the wall; nrm(o, a): the level part of a normal that looks o out from the wall and a along it
    const SEA = [0.38, 0.075, 0.36], SAFFRON = [0.8, 0.43, 0.065], HEAD = CRT_TOP - 3.5;
    const hangRng = ctx.core.makeRng(ctx.core.hashSeed('artemis-court-hangings'));
    const hanging = (at, nrm, w, y1, c, cols) => { const A = 0.14, RY = HEAD - 0.1, RO = 0.36, RR = 0.055, PH = 8 * Math.PI, Y = [RY + RR + 0.006, RY, 0.3, 0.58, 0.82, y1 + 0.2, y1 + 0.17, y1];
      // the cloth: over the rod, then down in four folds, each of its own width and depth, that wander a little on
      // the way down (their hollows darker); a darker hem at its foot, lower under the folds' ridges
      // (SHD: how dark a fold's hollow is: undyed white wool throws light into its own folds)
      const p1 = hangRng() * 6.28, p2 = hangRng() * 6.28, p3 = hangRng() * 6.28, SHD = c[1] > 0.6 ? 0.36 : 0.62;
      const phase = (u, t) => u * PH + 1.0 * Math.sin(u * 9.4 + p1) + 0.8 * t * Math.sin(u * 5.0 + p2 + 2.2 * t);
      const depth = (u, t, deep) => A * deep * (0.72 + 0.28 * Math.sin(u * 11.0 + p3)) * (0.5 - 0.5 * Math.cos(phase(u, t)));
      const fold = (u, t, deep) => { const f = depth(u, t, deep), df = (depth(u + 0.01, t, deep) - depth(u - 0.01, t, deep)) / (0.02 * w), l = Math.hypot(1, df);
        return [RO + RR + 0.008 + f - 0.5 * A * deep, nrm(1 / l, -df / l), 1 - SHD * deep * (0.5 + 0.5 * Math.cos(phase(u, t)))]; };
      const wide = (t) => w * (1 - 0.07 * t + 0.016 * Math.sin(7.0 * t + p1));
      skin((i, j) => { const u = j / cols, y0 = Y[i] < 1 ? RY - (RY - y1) * Y[i] : Y[i], t = (RY - Math.min(y0, RY)) / (RY - y1), [out, m, k0] = fold(u, t, i < 2 ? 0 : Math.min(1, 0.25 + 3 * t));
        const y = y0 - (i > 4 ? 0.07 * (1 - k0) / SHD : 0), q = at((u - 0.5) * wide(t), i ? out : RO), k = k0 * (i > 5 ? 0.76 : 1);
        dq.jt(11, 1.6 * t * t, 0, 0.9); return [[q[0], y, q[1]], i ? [m[0], 0, m[1]] : [0, 1, 0], [c[0] * k, c[1] * k * (i > 5 ? 0.92 : 1), c[2] * k]]; }, Y.length, cols + 1, false, false);
      // the fringe: a tassel under every span of the hem, 0.28 m long
      for (let j = 0; j < cols; j++) { const first = dq.count, u = (j + 0.5) / cols, [out, m, k0] = fold(u, 1, 1), k = 0.55 + 0.4 * k0, yh = y1 - 0.07 * (1 - k0) / SHD;
        [[-0.3, -0.03, 1.6], [0.3, -0.03, 1.6], [0.16, 0.28, 1.9], [-0.16, 0.28, 1.9]].forEach(([du, dy, st]) => { const q = at((u + du / cols - 0.5) * wide(1), out);
          dq.jt(11, st, 0, 0.9); dq.v(q[0], yh - dy, q[1], m[0], 0, m[1], [c[0] * k, c[1] * k, c[2] * k]); });
        const A0 = at(0, 0), A1 = at(1, 0), N0 = nrm(1, 0), fl = (A1[0] - A0[0]) * N0[1] - (A1[1] - A0[1]) * N0[0] < 0;
        if (fl) { dq.tri(first, first + 1, first + 2); dq.tri(first, first + 2, first + 3); } else { dq.tri(first, first + 2, first + 1); dq.tri(first, first + 3, first + 2); } }
      // the bronze rod with a knob at each end, on two brackets: an arm out from the wall, a strut under it, a stop
      dq.jt(10, 0.6, 2, 0.46).col(BR2); const E = 0.5 * w + 0.24, P = (sx, out, y) => { const q = at(sx, out); return [q[0], y, q[1]]; };
      rod([P(-E, RO, RY), P(E, RO, RY)], [RR, RR], 8, BR2);
      for (const e of [-1, 1]) { rod([P(e * E, RO, RY), P(e * (E + 0.06), RO, RY), P(e * (E + 0.13), RO, RY)], [RR, RR * 1.7, 0.012], 6, BR2);
        const sb = e * (0.5 * w + 0.11), ya = RY - RR - 0.03;
        bar(P(sb, 0, ya), P(sb, RO + 0.12, ya), 0.03); bar(P(sb, 0, RY - 0.55), P(sb, RO - 0.02, ya - 0.03), 0.022); bar(P(sb, RO + 0.12, ya), P(sb, RO + 0.12, ya + 0.1), 0.022); } };
    // down the east wall behind the shrine: five hangings, the middle one sea purple; in each space between two a
    // great swag of the garland from peg to peg, and a second lower down between two pegs of its own, a wool band at each
    { const xw = CRT_X1, HZ = [0, 4.3, 8.6], HW = 1.7;
      for (const e of [-1, 1]) for (let k = e < 0 ? 1 : 0; k < 3; k++) hanging((sx, out) => [xw - out, e * HZ[k] + sx], (o, al) => [-o, al], HW, 4.6 + 0.4 * (k & 1), [SEA, SAFFRON, RIBW][k], 20);
      for (const e of [-1, 1]) for (let k = 0; k < 2; k++) { const za = HZ[k] + HW / 2 + 0.06, zb = HZ[k + 1] - HW / 2 - 0.06;
        garland(k + 3, (t, out) => [xw - out, e * (za + (zb - za) * t)], (m) => [-m, 0], e < 0, HEAD - 0.06, 1.0, 0.27, 12);
        garland(k + 5, (t, out) => [xw - out, e * (za + (zb - za) * t)], (m) => [-m, 0], e < 0, 15.2, 1.0, 0.27, 12);
        dq.jt(10, 0.6, 2, 0.46); for (const z of [za, zb]) { rod([[xw, 15.2, e * z], [xw - 0.3, 15.22, e * z]], [0.03, 0.022], 3, BR2); }
        band(xw - 0.31, 15.14, e * za, 2.6, RIBW, 0.07); band(xw - 0.31, 15.14, e * zb, 2.1, SAFFRON, 0.07); } }
    await ctx.yield();
    // DEDICATED ARMS (ours, by the custom of hanging arms taken in war on a sanctuary's walls; nothing is known of
    // this court's walls): on each long wall a row of eight plain round bronze shields, 1.1 m across, each hung from a
    // bronze peg in the level joint at 8.06 m, three of the wall's longest blocks from one to the next: a domed face,
    // a flat rim, a middle boss, nothing on it. Most are polished bronze, a few gilt, a few dull and green with age
    { const shRng = ctx.core.makeRng(ctx.core.hashSeed('artemis-court-shields')), NS = 14;
      const SP = [[[0.012, 0.235], [0.08, 0.21], [0.125, 0.145]], [[0.125, 0.138], [0.265, 0.122], [0.385, 0.092], [0.462, 0.05]], [[0.462, 0.044], [0.55, 0.036]], [[0.55, 0.036], [0.55, 0]]];
      for (const e of [-1, 1]) for (let k = 0; k < SH_N; k++) { const cx = SH_X0 + k * SH_DX, zw = e * CRT_HALF, u = shRng();
        const c = u < 0.2 ? [0.62, 0.43, 0.13] : u < 0.45 ? [0.15, 0.22, 0.17] : [0.34, 0.245, 0.115];
        dq.jt(10, u < 0.2 ? 1 : u < 0.45 ? 0.15 : 0.85, u < 0.2 ? 0 : 2, u < 0.45 && u >= 0.2 ? 0.8 : 0.36);
        for (const S of SP) skin((i, j) => { const a = (j / NS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), i0 = Math.max(0, i - 1), i1 = Math.min(S.length - 1, i + 1);
          const dr = S[i1][0] - S[i0][0], dh = S[i1][1] - S[i0][1], l = Math.hypot(dr, dh) || 1, nr = -dh / l, no = dr / l;
          return [[cx + ca * S[i][0], SH_Y + sa * S[i][0], zw - e * (0.03 + S[i][1])], [ca * nr, sa * nr, -e * no], c]; }, S.length, NS, false, true);
        dq.jt(10, 0.6, 2, 0.46); rod([[cx, SH_Y + 0.61, zw], [cx, SH_Y + 0.62, zw - e * 0.14]], [0.03, 0.022], 4, BR2);
        dq.col([0.1, 0.07, 0.05]).jt(10, 0.1, 0, 0.8); bar([cx, SH_Y + 0.61, zw - e * 0.1], [cx, SH_Y + 0.35, zw - e * 0.05], 0.018); dq.col(BR2); }
    }
    // THE ANTEFIXES on the lips of the long walls' cornices (ours; they throw no shadow into the court: the sun
    // comes over the west gable)
    dq.col(COURT_WHITE).jt(0, 0, 0, 0.6);
    for (const s of [-1, 1]) for (let k = 0; k < 37; k++) { const x = CRT_X0 + 0.92 + k * 1.2444, zf = s * (CRT_HALF - 0.8), zb = s * (CRT_HALF - 0.68), y = CRT_TOP + 0.3;
      const O = [[-0.21, 0], [-0.21, 0.3], [0, 0.6], [0.21, 0.3], [0.21, 0]], F = O.map(([dx, dy]) => [x + dx, y + dy, zf]), B = O.map(([dx, dy]) => [x + dx, y + dy, zb]);
      const tri = (a, b, c) => (s > 0 ? dq.tri3(a, c, b) : dq.tri3(a, b, c));
      for (let i = 1; i < 4; i++) { tri(F[0], F[i + 1], F[i]); tri(B[0], B[i], B[i + 1]); }
      for (let i = 0; i < 4; i++) { tri(F[i], F[i + 1], B[i + 1]); tri(F[i], B[i + 1], B[i]); } }
    // BEFORE THE EAST WALL, behind the shrine, on the long axis in the middle of a band of the old floor (the middle way
    // ends at the shrine's steps): a great bronze bowl 2.5 m across on a low foot, its broad level rim open to the sky
    dq.jt(10, 0.6, 2, 0.46); lathe(dq, bronze([[0.5, 0], [0.5, 0.06], [0.24, 0.2, 2], [0.24, 0.5], [0.85, 0.98], [1.2, 1.4], [1.25, 1.5, 3], [1.1, 1.5, 3], [1.0, 1.38, 1], [0.3, 1.0, 1], [0, 0.98, 1]]), 20, { x: 74.75, z: 0, y: COURT });
    offeringsAt.push([74.75, 0]); shades.push([74.75, 0, 1.5, 0.5]);
    await ctx.yield();
    for (const s of [-1, 1]) {
      const zw = s * (CRT_HALF - 0.17);
      for (let k = 0; k < NSW; k++) garland(k, (t, out) => [XA + (k + t) * SPAN, zw - s * out], (m) => [0, -s * m], s > 0);
      // at every peg a knot and two tails of unequal length
      for (let k = 0; k <= NSW; k++) {
        const x = XA + k * SPAN;
        dq.col(RIBW).jt(11, 0, 0, 0.9).box(x - 0.07, GY - 0.14, Math.min(zw, zw - s * 0.2), x + 0.07, GY + 0.03, Math.max(zw, zw - s * 0.2), 'xXyY' + (s > 0 ? 'z' : 'Z'));
        tail(x - 0.045, GY - 0.12, zw - s * 0.205, 0.95 + 0.07 * ((k * 3) % 4), RIBW, 0.042, s); tail(x + 0.05, GY - 0.12, zw - s * 0.21, 0.66 + 0.1 * ((k * 5) % 3), RIBY, 0.042, s);
      }
      await ctx.yield();
      // the way's row on this side of the long axis
      for (const [x, kind, H] of WAY) { const z = s * WAY_Z; offeringsAt.push([x, z]);
        if (kind === 'tripod') { greatTripod(x, z, H, x < 50 ? 32 : x < SX0 ? 24 : 0); shades.push([x, z, 0.8, 0.5]); }
        else if (kind === 'incense') { tallStand(x, z, H); shades.push([x, z, 0.5, 0.5]); threads.push([x, COURT + H - 0.02, z, 4.8]); }
        else { greatJar(x, z, H); shades.push([x, z, 0.75, 0.45]); } }
      // what else stands in the court on this side (the other side is its mirror); v: the kind's own deal
      for (const [kind, x, az, v] of laid) {
        const z = s * az; offeringsAt.push([x, z]);
        if (kind === 'tripod') { tripod(x, z, 2.0 + 0.2 * v); shades.push([x, z, 0.62, 0.5]); }
        else if (kind === 'incense') { thurible(x, z); shades.push([x, z, 0.42, 0.5]); threads.push([x, COURT + 1.68, z, 4.8]); }
        else if (kind === 'basin') { basin(x, z); shades.push([x, z, 0.6, 0.5]); }
        else if (kind === 'jars') { jar(x, z, 0.9 + 0.24 * v, JAR, 8); jar(x + 0.62, z + s * 0.2, 0.58, JAR2, 6); jar(x + 0.2, z - s * 0.55, 0.44, JAR, 6); shades.push([x, z, 0.62, 0.5], [x + 0.62, z + s * 0.2, 0.36, 0.6], [x + 0.2, z - s * 0.55, 0.3, 0.6]); }
        else if (kind === 'greatjars') { jar(x, z, 1.35 + 0.2 * v, JAR, 10); jar(x + 0.85, z + s * 0.25, 0.92, JAR2, 8); jar(x + 0.25, z - s * 0.78, 0.68, JAR, 8); shades.push([x, z, 0.8, 0.5], [x + 0.85, z + s * 0.25, 0.5, 0.55], [x + 0.25, z - s * 0.78, 0.4, 0.6]); }
        else if (kind === 'garlanded') { altar(x, z, 0.4, 1.05); swag([x - 0.49, COURT + 0.93, z - 0.44], [x - 0.49, COURT + 0.93, z + 0.44], 0.24, 0.07, 6);
          band(x - 0.5, COURT + 0.93, z - 0.44, 0.6, WOOLY, 0.024); band(x - 0.5, COURT + 0.93, z + 0.44, 0.5, WOOLW, 0.024); offering(v < 0.5 ? 0 : 2, x, COURT + 1.05, z, s); shades.push([x, z, 0.95, 0.5]); }
        else if (kind === 'altar') { altar(x, z, 0.25, 0.9); offering(Math.floor(v * 5), x, COURT + 0.9, z, s); shades.push([x, z, 0.72, 0.5]); }
        else if (kind === 'stand') { dish(x, z); offering(v < 0.5 ? 4 : 3, x, COURT + 0.945, z, s); shades.push([x, z, 0.46, 0.55]); }
        else if (kind === 'bench') { bench(x, z, s); shades.push([x, z, 0.75, 0.55]); }
        else if (kind === 'boughs') { jar(x, z, 0.7, JAR2, 8); boughs(x, COURT + 0.66, z, s, v); shades.push([x, z, 0.46, 0.55]); }
        else if (kind === 'lamp') { lamp(x, z, 1.5 + 0.3 * v); shades.push([x, z, 0.42, 0.55]); }
        else if (kind === 'pithos') { jar(x, z, 1.9, JAR, 12); shades.push([x, z, 0.8, 0.5]); }
      }
      await ctx.yield();
    }
  }
  // plain fans of leaves on the two outer gables: one on each top, one on each corner
  dq.jt(0, 0, 0, 0.6);
  for (const x of [ROOF_X0 + 0.12, 103.54]) { palmette(dq, x, RIDGE + 0.1, 0, 1.7, MARBLE); for (const s of [-1, 1]) palmette(dq, x, EAVES, s * (HALF - 0.25), 1.15, MARBLE); }
  const fitMesh = new THREE.Mesh(dq.build(), marble); fitMesh.name = 'door and shrine'; fitMesh.receiveShadow = true; object.add(fitMesh);
  tally.shrine = dq.triangles - tally.door - tally.floors;
  await ctx.yield();
  // CONTACT SHADES: where a thing stands on the old floor the floor is darker close round its foot. One thin sheet a
  // finger over the floor that only darkens what lies under it (white at each patch's rim: nothing changes there);
  // round the shrine's podium and steps a band.
  {
    const cg = makeG(), y = COURT + 0.012, W = [1, 1, 1];
    for (const [x, z, r0, k0] of shades) { const n = 8, first = cg.count, r = r0 * 1.5, k = k0 - 0.12, mid = k + (1 - k) * 0.45;
      cg.v(x, y, z, 0, 1, 0, [k, k, k]);
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); cg.v(x + c * r * 0.55, y, z + sn * r * 0.55, 0, 1, 0, [mid, mid, mid]); cg.v(x + c * r, y, z + sn * r, 0, 1, 0, W); }
      for (let i = 0; i < n; i++) { const a = first + 1 + 2 * i, b = first + 1 + 2 * ((i + 1) % n); cg.tri(first, b, a); cg.tri(a, b, b + 1); cg.tri(a, b + 1, a + 1); } }
    const R = [SX0 - 1.3, SX1 + 0.35, -SZ - 0.35, SZ + 0.35], o = 0.95, K = [0.5, 0.5, 0.5];
    const C = [[R[0], R[2]], [R[1], R[2]], [R[1], R[3]], [R[0], R[3]]], D = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4;
      const a = cg.v(C[i][0], y, C[i][1], 0, 1, 0, K), b = cg.v(C[j][0], y, C[j][1], 0, 1, 0, K), c = cg.v(C[j][0] + D[j][0] * o, y, C[j][1] + D[j][1] * o, 0, 1, 0, W), d = cg.v(C[i][0] + D[i][0] * o, y, C[i][1] + D[i][1] * o, 0, 1, 0, W);
      cg.tri(a, b, c); cg.tri(a, c, d); }
    const shadeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.MultiplyBlending, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    shadeMat.name = 'contact shades';
    const sh = new THREE.Mesh(cg.build(), shadeMat); sh.name = 'contact shades'; sh.renderOrder = 1; object.add(sh);
    tally.shades = cg.triangles;
  }
  // THE THREADS OF SMOKE from the incense stands: each is two crossed soft ribbons that rise SMH metres (about 5),
  // thin at the bowl, widening to 1.2 m, curling more the higher they are, drifting in wisps that climb, and thinning
  // away to nothing at the top; soft at the edges. Where a thread stands in the door's blade of sun (by the door's
  // opening and the sun's direction alone) it is lit warm; elsewhere it is the shade's blue grey. On the clock.
  {
    const sg = makeG(), n = 22;
    threads.forEach(([SMX, SMY, SMZ, SMH], k) => { for (const [ax, az] of [[1, 0], [0, 1]]) for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, w0 = 0.025 + 0.58 * Math.pow(t0, 1.3), w1 = 0.025 + 0.58 * Math.pow(t1, 1.3);
      // (per corner: across the ribbon 0 to 1, up the thread 0 to 1, the thread's own phase)
      const vt = (side, t, w) => sg.v(SMX + ax * side * w, SMY + t * SMH, SMZ + az * side * w, 0, 1, 0, [side * 0.5 + 0.5, t, (k * 0.381966) % 1]);
      const a = vt(-1, t0, w0), b = vt(1, t0, w0), c = vt(1, t1, w1), d = vt(-1, t1, w1); sg.tri(a, b, c); sg.tri(a, c, d);
    } });
    const smoke = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }); smoke.name = 'incense smoke';
    const smokeLit = { value: new THREE.Color(0.45 + 0.55 * sunColor.r, 0.45 + 0.55 * sunColor.g, 0.45 + 0.55 * sunColor.b) };
    smoke.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uSunDir = U.uSunDir; sh.uniforms.uSmokeLit = smokeLit;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; varying vec3 vSP;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
{ float t = color.y, a = 0.3 * t + 0.7 * t * t, ph = color.z * 6.2832;
  transformed.x += a * (0.5 * sin(t * 6.4 - uTime * 0.55 + ph) + 0.2 * sin(t * 13.5 - uTime * 1.2 + ph * 1.7)) + 0.35 * t * t;
  transformed.z += a * (0.44 * sin(t * 5.6 - uTime * 0.46 + ph * 2.3 + 1.7) + 0.18 * sin(t * 11.3 - uTime * 0.95 + ph));
  vSP = transformed; }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec3 uSunDir; uniform vec3 uSmokeLit; varying vec3 vSP;')
        .replace('#include <color_fragment>', `#include <color_fragment>
{ float ac = clamp(1. - abs(vColor.x * 2. - 1.), 0., 1.), t = clamp(vColor.y, 0., 1.), ph = vColor.z * 40.;
  // (wisps that climb, and filaments along the thread that drift across it; no bright core: the thread is even across
  // its middle and soft toward both edges)
  float wisp = (0.62 + 0.38 * sin(t * 21. - uTime * 1.2 + ph + (vColor.x - 0.5) * 6.) * sin(t * 8. - uTime * 0.5 + vColor.x * 9. + ph * 0.3)) * (0.6 + 0.4 * sin(vColor.x * 14. + t * 9. - uTime * 0.7 + ph) * smoothstep(0.1, 0.5, t));
  // in the door's blade: the line from here toward the sun passes out through the great door's clear opening
  float lit = 0.;
  if (uSunDir.x < -0.05) {
    vec3 d1 = vSP + uSunDir * ((33.82 - vSP.x) / uSunDir.x), d2 = vSP + uSunDir * ((31.86 - vSP.x) / uSunDir.x);
    lit = smoothstep(0., 0.3, min(min(3.1 - abs(d1.z), 3.1 - abs(d2.z)), min(min(d1.y - 2.91, 16.88 - d2.y), 20.53 - (vSP.y + uSunDir.y * (-0.74 - vSP.x) / uSunDir.x))));
  }
  diffuseColor = vec4(mix(vec3(0.5, 0.56, 0.68), uSmokeLit, lit), smoothstep(0., 0.7, ac) * smoothstep(0., 0.04, t) * pow(1. - t, 1.3) * mix(1., 0.45, smoothstep(0., 0.35, t)) * wisp * (0.4 + 0.3 * lit)); }`);
    };
    smoke.customProgramCacheKey = () => 'artemis-smoke-4';
    const sm = new THREE.Mesh(sg.build(), smoke); sm.name = 'incense smoke'; sm.renderOrder = 2; object.add(sm);
    tally.smoke = sg.triangles;
  }
  // the gutter's lion heads, plain marble, nearly 0.6 m across, one every 1.8 m along the two flanks
  {
    const lg = makeG(), prof = [[0.29, 0], [0.24, 0.12], [0.145, 0.18], [0.123, 0.31], [0.0, 0.35]], m = 5, list = [];
    lg.col(MARBLE).jt(0, 0, 0, 0.6);
    for (let i = 0; i < prof.length; i++) for (let j = 0; j < m; j++) { const a = (j / m) * Math.PI * 2 + 0.52, r = prof[i][0], k = Math.min(i + 1, prof.length - 1), q = Math.max(i - 1, 0);
      const sl = Math.atan2(prof[q][0] - prof[k][0], prof[k][1] - prof[q][1]), cs = Math.cos(sl), sn = Math.sin(sl);
      lg.v(Math.cos(a) * r, Math.sin(a) * r * 1.08, prof[i][1], Math.cos(a) * cs, Math.sin(a) * cs, sn, i === 4 ? [0.2, 0.15, 0.13] : null); }
    for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < m; j++) { const a = i * m + j, b = i * m + (j + 1) % m, c = b + m, d = a + m; lg.tri(a, b, c); lg.tri(a, c, d); }
    const n = Math.floor(104 / 1.8);
    for (let i = 0; i <= n; i++) for (const s of [-1, 1]) list.push([-0.9 + i * 1.8, EAVES - 0.32, s * (HALF - 0.02), s > 0 ? 0 : Math.PI]);
    const geo = lg.build(); count('lion heads', geo, list.length); inst(geo, marble, list, 'lion heads');
  }
  await ctx.yield();

  // ----- what casts the shadows: plain forms a little inside the true surfaces, drawn with no colour and no depth -----
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); ghost.name = 'shadow caster';
  // both sides cast: the roof's caster is a sheet whose upper side faces the sun
  ghost.shadowSide = THREE.DoubleSide;
  const proxy = (carved, far) => {
    const g = makeG(), cyl = (r0, r1, y0, y1, n) => lathe(g, [[r0, y0], [r1, y1]], n);
    g.box(-1.27, 0, -1.27, 1.27, PLINTH_H - 0.02, 1.27, 'xXYzZ');
    if (far) { cyl(R_FOOT - 0.1, R_TOP - 0.1, PLINTH_H, COL_H - CAP_H + 0.1, 6); g.box(-1.24, COL_H - CAP_H - 0.12, -0.8, 1.24, COL_H - 0.02, 0.8, 'xXyzZ'); return g.build(); }
    if (carved) { g.box(-0.8, PLINTH_H, -0.8, 0.8, PED_TOP, 0.8, 'xXYzZ'); cyl(0.78, 0.78, PED_TOP, DRUM_TOP, 10); cyl(0.9, 0.86, DRUM_TOP, DRUM_TOP + UPPER_H, 10); cyl(0.8, R_TOP - 0.1, DRUM_TOP + UPPER_H, COL_H - CAP_H + 0.1, 12); }
    else { cyl(1.12, 1.0, PLINTH_H, PLINTH_H + BASE_H, 10); cyl(R_FOOT - 0.12, R_TOP - 0.1, PLINTH_H + BASE_H, COL_H - CAP_H + 0.1, 12); }
    g.box(-1.24, COL_H - CAP_H - 0.12, -0.8, 1.24, COL_H - 0.02, 0.8, 'xXyzZ');
    return g.build();
  };
  // the roof's caster lies 0.45 m under the tiles: a sun as low as the slope itself cannot stripe them
  {
    const g = makeG();
    for (const [x0, x1, zin] of zones) for (const s of [-1, 1]) {
      const a = [x0, planeY(ZG) - 0.45, s * ZG], b = [x1, planeY(ZG) - 0.45, s * ZG], c = [x1, planeY(zin) - 0.45, s * zin], d = [x0, planeY(zin) - 0.45, s * zin];
      if (s > 0) g.quad(a, b, c, d); else g.quad(b, a, d, c);
    }
    // THE DOOR LEAVES' SHADE: the leaves' own mesh does not cast (the fittings' mesh does not: the shrine stands in the
    // walls' shade). One plain upright sheet casts for each leaf, WHERE THE LEAF IS DRAWN: in the leaf's middle plane,
    // 33 degrees past the square, of the leaf's height, out to the leaf's free end (4.95 m from the axis). Its shade
    // lies behind the leaf, on the porch floor and on the door wall's face beside the jamb; the leaf's inner face,
    // turned to the sun, has the sun as far as the shade of the porch's columns.
    // THE RULE OF THE SHEET'S INNER END: the sheet begins where the leaf stands opts.shadowSoft outside the door's
    // opening (the opening's edge is DOOR_HALF from the axis). shadowSoft is the width in metres of the soft edge
    // that the world's sun map gives a shadow: its texel on the ground times the reach of its filter. If the world
    // hands none it is 0.3 m: three texels of a map whose texel is 0.1 m. A caster nearer the opening than that
    // lays the faint half of its edge through the opening on the sill. The rule keeps only the map's soft edge off
    // the sill; it does not keep the leaf's shade out of the court: with the sun off the long axis the leaf's shade
    // may fall through the opening, and that is then true.
    // What the sheet leaves out (the heel post and the leaf's first stretch) shades only the door wall's face close
    // behind it; the marble's shader gives that shade from the post's own place (aPost).
    // (by the drawn leaf's own measures: XW, PR, SPL, LW, LH)
    const SOFT = opts.shadowSoft === undefined ? 0.3 : Math.max(0, opts.shadowSoft), FROM = Math.min(LW - 0.5, Math.max(0, (SOFT - PR) / Math.sin(SPL)));
    for (const s of [-1, 1]) { const ax = -Math.cos(SPL), az = s * Math.sin(SPL), hx = XW - PR + ax * FROM, hz = s * (DOOR_HALF + PR) + az * FROM, fx = XW - PR + ax * LW, fz = s * (DOOR_HALF + PR) + az * LW, y0 = FLOOR + 0.05, y1 = y0 + LH;
      g.quad([hx, y0, hz], [fx, y0, fz], [fx, y1, fz], [hx, y1, hz]); }
    const m = new THREE.Mesh(g.build(), ghost); m.name = 'shadow roof'; m.castShadow = true; object.add(m);
  }
  for (const kind of [0, 1, 2]) {
    const m = inst(proxy(kind === 1, kind === 2), ghost, pick((c) => (kind === 1 ? c.carved : kind === 2 ? c.lod === 2 : !c.carved && c.lod < 2)).map((c) => [c.x, FLOOR, c.z, c.rot, 1]), ['shadow plain', 'shadow carved', 'shadow far'][kind]);
    m.castShadow = true; m.receiveShadow = false;
  }
  await ctx.yield();


  let total = 0; for (const k in tally) total += tally[k];
  return {
    object, radius: 75, height: RIDGE, center: new THREE.Vector3(51, 12, 0),
    info: { floor: FLOOR, courtFloor: COURT, eaves: EAVES, ridge: RIDGE, columns: cols, plinthHalf: 1.31, plinthTop: 0.4, pedestalHalf: 0.925, pedestalTop: 2.23, drumTop: 4.06,
      door: { x: 32.84, halfWidth: 3.1, top: 14.0, wallX0: 31.86, wallX1: 33.82 }, stair: { x0: 33.82, x1: 40.1, halfWidth: 6.0 },
      court: { x0: 33.82, x1: 80.46, halfWidth: 10.57, wallTop: 27.9, gableTop: 31.7 },
      shrine: { x: 58.8, z: 0, halfX: 2.485, halfZ: 2.97, eaves: 5.38, ridge: 6.78 }, roofY,
      steps: { foot: [-12.9, 114.5, -36.5, 36.5], top: [-5.3, 106.9, -28.63, 28.63] },
      // look points, each from the thing's own measures: the middle of the north west corner column's carved drum;
      // the middle of the shrine's curtain
      looks: { cornerFoot: [cornerCol.x, FLOOR + (PED_TOP + DRUM_TOP) / 2, cornerCol.z], shrine: [CURT_X, (CURT_Y0 + CURT_Y1) / 2, 0] },
      // where the threads of incense rise: the top of each incense stand [x, y, z]
      incense: threads.map((t) => [t[0], t[1], t[2]]),
      offerings: offeringsAt, triangles: total, tally, glow: true },
    update(dt, time) { U.uTime.value = time; },
    dispose() { for (const t of textures) t.dispose(); },
  };
}

