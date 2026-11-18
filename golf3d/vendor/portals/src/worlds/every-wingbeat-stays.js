// EVERY WINGBEAT STAYS: a Futurist painting of motion that you fly inside.
// Over chevron megadunes nothing that moves can leave its past behind: a great bird climbs round a needle of rock and
// its last ninety wingbeats stand in the air as a spiral arcade of wings. Runners leave colonnades of legs, swifts
// leave fans of bodies, falling kite leaves leave dotted arcs. Colour is time: yellow now, ultramarine long ago.
// STYLE (returns style 'none'): only flat opaque unlit triangles with ink edges; depth as tone steps; no fog, no
// bloom, no lights, no textures, no blending. Every mover is one instanced mesh drawn N+1 times; the vertex shader
// evaluates its whole motion at the quantised time te of each past self, so echoes are fixed in world space.
// THE APPROACH (u 0-0.28) is four pictures: the avenue of kite trees with great leaves drawing arcs either side (u 0.02);
// the pale windward face as a road to the needle (u 0.08); the runners' crest beside us to starboard, each living runner
// coming at us with its selves standing behind it, the stair whole and half the frame high (u 0.16); the bow flock's
// dense swirl of selves round the needle (u 0.25). THE CLIMB (u 0.30-0.50) looks at the stair itself, not the shaft:
// whole blue birds, then magenta, then vermilion. Only the living bird wears the colour of now: its selves of the first
// band stand a step toward the next (parts file, uYoung). No lines of force (they read as stray wire).
// LENS: fov 50, a long lens, so the Gyre is nearly half the frame at the entry. THE PASS (parts file, LEG_E) is three
// pictures: out of the arcade looking back along the living bird and its newest selves (u 0.70); abeam of it, 66 m outside the helix and
// 19 m under its keel, whole against the sky (u 0.75-0.82); then swung wide to 90 m, where bird, ring and the lower turn
// of the stair are one picture (u 0.85-0.90). The detour lets the bird reach the ring before us, so on the last straight
// one whole self stands over the ring and the living bird flies on beyond it. Six stacked pois hold the aim (a steady
// camera takes a third of each); the aim slides from the bird to the ring over u 0.80-0.94. pace(u) follows the world clock.
// SKY: 64 rays fanning from the sun round to the point opposite, cut into shards, toned by angle from the sun alone.
// GROUND: a chevron about the avenue: slip faces look east to port and west to starboard, so ridges stack on both hands.
// CLOCKS: the Gyre runs on the world clock wt = T(u) (+ a little slack when the camera is held still), so every
// meeting with the bird is exact; ambient movers (leaves, runners, far flocks, dunes, sun wedges, squall) run on time.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, flightPlan, makeTone, GLSL_COLOUR, GLSL_INK, GYRE } from '../parts/every-wingbeat-stays.js';

const TAU = Math.PI * 2;

// three looks, each a whole key: sky steps (sunward -> cool horizon), dunes, echo run [now, .., oldest], accents
const MOODS = {
  noon: {
    sky: ['#F2E7D0', '#EBD9A8', '#BFD6C8', '#8FBFB0', '#4F9F92', '#1E8C72', '#1B5E73'], sun: '#FBF3DC', wedge: ['#F7EBC9', '#EBCB86'],
    dune: ['#E3D2A6', '#D6C28F', '#5B4A86', '#4A3C74', '#1E8C72', '#2C9C80'], rock: '#E9DDC2', warm: '#EBD9A8', cool: '#4F9F92',
    pal: ['#F3C52E', '#E24A2A', '#B5347C', '#2747A8', '#1E8C72', '#F2E7D0', '#221F2A'], leaf: ['#1E8C72', '#5B4A86', '#2C6E8C'], rod: '#BFD6C8', ring: '#FFF2CF',
  },
  evening: {
    sky: ['#FBE6C4', '#F6C9A2', '#EDA59A', '#D0839F', '#A56BA6', '#75559A', '#46407A'], sun: '#FFF1D2', wedge: ['#FDE3B8', '#F3B98A'],
    dune: ['#F0C8A0', '#E4B088', '#5A3F7A', '#472F66', '#8A5E8E', '#9A6C98'], rock: '#F3DCC4', warm: '#F6C9A2', cool: '#75559A',
    pal: ['#FFF0C4', '#F07E2A', '#C4264E', '#5C2670', '#3E7F8C', '#F8E8CE', '#2A1F33'], leaf: ['#3E7F8C', '#5A3F7A', '#7A4E86'], rod: '#EDA59A', ring: '#FFF0D8',
  },
  // blue hour: a rose afterglow round the sun, lilac overhead, dusk blue on the cool side; dunes a mid to deep blue-violet
  // under it, so the white bird of 'now' is the lightest thing in the frame and its mid faces are ice blue, not grey
  blue: {
    sky: ['#FBEEDC', '#EBCBD8', '#B9AEE4', '#8E90D4', '#6472BC', '#43549C', '#273772'], sun: '#FFFFFF', wedge: ['#FCEFE2', '#F0CFD6'],
    dune: ['#746CB2', '#655DA4', '#2E2B64', '#262354', '#4565AA', '#5173B6'], rock: '#E8E3F0', warm: '#D9C6E6', cool: '#5A6AB4',
    pal: ['#FBF9F0', '#7FE0BE', '#2B55C8', '#20244E', '#2E8C8C', '#F1EEF6', '#1C1D33'], mids: ['#C4D3F4', '#8FD6CC', null, null, '#343C7C'],
    comps: ['#384A94', '#34609E', '#2A4FA8', '#C6BCEC', '#8E92DA'],      // every pair stays inside blue: ink keeps a lilac partner, never olive
    leaf: ['#3FA8A0', '#B9AEE4', '#8FB0E0'], rod: '#B9AEE4', ring: '#FFFFFF',
  },
};

// monotone cubic through (x_i, y_i), Fritsch-Carlson: the u -> world-clock map
function monotone(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(xs[i + 1] - xs[i], 1e-6));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  return (x) => {
    x = clamp(x, xs[0], xs[n - 1]); let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / Math.max(h, 1e-6), t2 = t * t, t3 = t2 * t;
    return ys[i] * (2 * t3 - 3 * t2 + 1) + m[i] * h * (t3 - 2 * t2 + t) + ys[i + 1] * (-2 * t3 + 3 * t2) + m[i + 1] * h * (t3 - t2);
  };
}

// the crest line of megadune 0 (x as a function of z): straight under the entry run, then stepping 15 to 37 m to
// starboard, so from u 0.05 to 0.25 we fly over its pale windward face (a pale road leading the eye to the needle, never
// the dark slip face under the lens) and the runners' crest runs beside us to starboard, their friezes side on
const CREST = [[2600, 150], [1900, -130], [1400, 90], [1000, -70], [700, 0], [520, 0], [455, 15], [270, 37], [120, -40], [-160, 50], [-520, -80], [-900, 70], [-1400, -110], [-1900, 100], [-2600, -90]];
function crestX(z) {
  for (let i = 0; i < CREST.length - 1; i++) {
    const a = CREST[i], b = CREST[i + 1];
    if (z <= a[0] && z >= b[0]) return lerp(a[1], b[1], (a[0] - z) / (a[0] - b[0]));
  }
  return z > 0 ? CREST[0][1] : CREST[CREST.length - 1][1];
}
const DUNE_W = 220;
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// triangle soup for still things: flat colour per face, barycentrics with hidden diagonals, per-face centroid
function soup() {
  const P = [], B = [], C = [], CEN = [];
  const push = (a, b, c, col, hide) => {
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const hx = hide === 3 ? 1 : 0, hy = hide === 1 ? 1 : 0, hz = hide === 2 ? 1 : 0;
    B.push(1, hy, hz, hx, 1, hz, hx, hy, 1);
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
    for (let i = 0; i < 3; i++) { C.push(col.r, col.g, col.b); CEN.push(cx, cy, cz); }
  };
  return {
    tri(a, b, c, col) { push(a, b, c, col, 0); },
    quad(a, b, c, d, col, col2 = col, show = false) { push(a, b, c, col, show ? 0 : 1); push(a, c, d, col2, show ? 0 : 2); },
    count: () => P.length / 9,
    geometry(instanced) {
      const g = instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aColor', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aCen', new THREE.Float32BufferAttribute(CEN, 3));
      return g;
    },
  };
}

// ---- shaders for still things (ground, trees, fallen triangles): the hero's colour family and ink edge
const VERT_STILL = /* glsl */`
  attribute vec3 aBary, aColor, aCen; uniform float uNearPlain;
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_COLOUR}
  void main(){
    vec4 cw = modelMatrix * vec4(aCen, 1.);
    float dc = distance(cw.xyz, cameraPosition), st = depthSteps(dc);
    vSky = skyTone(cw.xyz - cameraPosition); vLight = 0.16*st;
    // the ground right under the lens is plain cut paper: its ink lines begin 45 m out (a line on a facet seen at a
    // grazing angle from a few metres is a heavy black bar across the foreground)
    vCol = mix(aColor, vSky, vLight); vBary = mix(aBary, vec3(1.), uNearPlain*(1. - smoothstep(45., 110., dc)));
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  }
`;
const FRAG_FLAT = /* glsl */`
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_INK}
  void main(){ gl_FragColor = vec4(inked(vCol, vBary, vLight, vSky), 1.); }
`;
const VERT_SKY = /* glsl */`
  attribute vec3 aColor; varying vec3 vCol; uniform float uSpin; uniform vec3 uAxis;
  void main(){
    vec3 p = position;
    #ifdef WEDGE
      float c = cos(uSpin), s = sin(uSpin);
      p = p*c + cross(uAxis, p)*s + uAxis*dot(uAxis, p)*(1. - c);     // the fan turns about the sun's own axis
    #endif
    vCol = aColor;
    vec4 mv = viewMatrix * vec4(mat3(modelMatrix) * p + cameraPosition, 1.);
    vec4 cp = projectionMatrix * mv;
    if (abs(cp.w) < 1e-4) cp.w = 1e-4;                                 // a vertex exactly beside a level camera
    gl_Position = cp.xyww;                                             // at the far plane, behind everything
  }
`;
const FRAG_SKY = /* glsl */`varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }`;

// megadune profile: s = metres east of a crest (0..220). Slip face 0..40, floor 40..85, windward 85..220.
const FORE_H = 17;
// facing class of a strip at s in cell i: 0 windward, 1 slip, 2 floor
function classOf(i, s) { if (i <= -1) return s < 40 ? 1 : s < 85 ? 2 : 0; if (i >= 1) return s > 180 ? 1 : s > 135 ? 2 : 0; return s < 40 || s > 180 ? 1 : s < 70 || s > 165 ? 2 : s < 95 ? 1 : 0; }
function profile(s) { return s < 40 ? 1 - s / 40 : s < 85 ? 0 : Math.pow((s - 85) / 135, 1.12); }

function makeGroundFn(noise, path) {
  const crestH = (i, z) => {
    let H = 37 + 8 * noise.n2(i * 3.7 + 11, z / 260);
    if (i >= -1 && i <= 1) H = lerp(H, 43 - 2 * Math.abs(i) - (i < 0 ? 1 : 0), smoothstep(150, 240, z) * (1 - smoothstep(760, 900, z)));   // level crests for the runners
    // away from the avenue the ridges step up into ranges, so crests break the horizon on both sides of the entry view
    const far = Math.min(Math.abs(i) - 1, 4);
    if (far > 0) H *= 1 + 0.65 * far;
    return H;
  };
  const basin = (x, z) => lerp(0.3, 1, smoothstep(215, 350, Math.hypot(x, z)));
  const lo = { n: 0, px: [], py: [], pz: [], x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }, _p = new THREE.Vector3();
  for (let k = 0; k <= 260; k++) {
    path.pointAt(k / 260 * 0.5, _p); if (_p.y > 120) break;
    lo.px.push(_p.x); lo.py.push(_p.y); lo.pz.push(_p.z); lo.n++;
    lo.x0 = Math.min(lo.x0, _p.x - 62); lo.x1 = Math.max(lo.x1, _p.x + 62); lo.z0 = Math.min(lo.z0, _p.z - 62); lo.z1 = Math.max(lo.z1, _p.z + 62);
  }
  // raw height from the ridge index i and s (so mesh rows land exactly on crests), then basin and carve
  const raw = (i, s, z) => {
    const x = crestX(z) + i * DUNE_W + s;
    // a chevron about the avenue: to port the slip faces look east, to starboard they are mirrored and look west, so
    // from the crest we ride every ridge on either hand shows its dark face and its crest line, stepping back to the horizon
    let h;
    if (i <= -1) h = (s < 62 ? crestH(i, z) : crestH(i + 1, z)) * profile(s);
    else if (i >= 1) h = (s < 158 ? crestH(i, z) : crestH(i + 1, z)) * profile(220 - s);
    else h = s < 40 ? crestH(0, z) * (1 - s / 40) : s > 180 ? crestH(1, z) * (s - 180) / 40                      // our own slip face; the next ridge's
      : s < 70 || s > 165 ? 0 : FORE_H * (s < 95 ? (s - 70) / 25 : Math.pow((165 - s) / 70, 1.12));                // and a foredune between them
    let y = h * basin(x, z);
    if (y > 30 && x > lo.x0 && x < lo.x1 && z > lo.z0 && z < lo.z1) {   // only the low legs of the flight can touch the dunes
      let best = 1e9, by = 0;
      for (let k = 0; k < lo.n; k++) { const dx = lo.px[k] - x, dz = lo.pz[k] - z, d = dx * dx + dz * dz; if (d < best) { best = d; by = lo.py[k]; } }
      const dist = Math.sqrt(best);
      if (dist < 60) y = Math.min(y, by - 12 + Math.max(0, dist - 5) * 0.9);
    }
    return y;
  };
  const at = (x, z) => { const q = x - crestX(z), i = Math.floor(q / DUNE_W); return raw(i, q - i * DUNE_W, z); };
  return { raw, at, crestH, basin };
}

// one band of ridges i0..i1: tensor grid of z columns and s rows, flat-coloured by facing class
async function buildDunes(S, G, tone, mood, zs, i0, i1, rowsFor, far, tick) {
  const cols = mood.dune.map((h) => tone(h)), straw3 = tone(mood.sky[0], 0.94);
  // the lip: a band of violet-grey just under every crest on its windward side (not on the avenue's own crest), so
  // ridges seen from behind their slip faces still stack back as crest after crest
  const mixHex = (a, b, t) => tone(new THREE.Color(a).lerp(new THREE.Color(b), t)), lips = [mixHex(mood.dune[0], mood.dune[2], 0.42), mixHex(mood.dune[0], mood.dune[2], 0.58), mixHex(mood.dune[0], mood.dune[2], 0.3)];
  const rows = [];                                       // each: { i, s } with s from 62 (floor) up through the next crest to 62 again
  for (let i = i0; i <= i1; i++) {
    const list = rowsFor(i);
    for (let r = 0; r < list.length - (i < i1 ? 1 : 0); r++) rows.push({ i: list[r] >= 220 ? i + 1 : i, s: list[r] >= 220 ? list[r] - 220 : list[r], key: i * 400 + list[r] });
  }
  const nz = zs.length, V = new Array(rows.length);
  for (let r = 0; r < rows.length; r++) {
    if (r % 6 === 5) await tick();
    const row = rows[r], edge = r === 0 || r === rows.length - 1, arr = V[r] = new Array(nz);
    for (let c = 0; c < nz; c++) {
      const step = c < nz - 1 ? Math.abs(zs[c + 1] - zs[c]) : 50;
      const jz = edge ? 0 : (hash1(row.key * 1.31 + c * 7.7) - 0.5) * Math.min(step * 0.5, 14);
      const z = zs[c] + jz, onCrest = row.s === 0;
      const jx = edge ? 0 : (hash1(row.key * 2.17 + c * 3.3) - 0.5) * (onCrest ? (Math.abs(row.i) <= 1 && z > 120 && z < 800 ? 1.0 : 3.2) : Math.min(step * 0.45, 9));
      let y = G.raw(row.i, row.s + jx * (onCrest ? 0 : 1), z);
      const level = Math.abs(row.i) <= 1 && z > 120 && z < 800;            // the runners' crests stay true
      if (onCrest && !level) y *= 1 - 0.1 * hash1(c * 5.1 + row.i);        // knife crest: every facet a little different
      if (edge && far) y -= 0.35;
      arr[c] = [crestX(z) + row.i * DUNE_W + row.s + jx, y, z];
    }
  }
  for (let r = 0; r < rows.length - 1; r++) {
    const sA = rows[r].s, sm = rows[r + 1].s === 0 ? 219 : (sA + 0.5) % 220;
    const cell = rows[r].i, cls = classOf(cell, sm);     // 0 windward, 1 slip, 2 floor
    const ridge = rows[r + 1].s === 0 ? rows[r + 1].i : rows[r].i + (sA >= 62 ? 1 : 0);
    const lip = cls === 0 && (cell >= 1 ? sA < 22 : cell === 0 ? sA < 108 : ridge !== 0 && (rows[r + 1].s === 0 || (sA >= 196 && sA < 220)));
    const band = cls === 0 && !lip && (rows[r].i === 0 || rows[r].i === -1) && sA >= 132 && sA < 148;   // a stratum half way up the two windward faces beside the avenue
    if (r % 8 === 7) await tick();
    for (let c = 0; c < nz - 1; c++) {
      const a = V[r][c], b = V[r + 1][c], d = V[r][c + 1], e = V[r + 1][c + 1];
      const h = hash1(rows[r].key * 0.731 + Math.floor(c / (far ? 1 : 2)) * 13.7), h2 = hash1(rows[r].key * 1.9 + c * 3.1);
      const c1 = band ? lips[2] : lip ? lips[h > 0.55 ? 1 : 0] : cls === 0 && h2 > 0.9 ? straw3 : cols[cls * 2 + (h > 0.55 ? 1 : 0)], c2 = band ? (h2 > 0.5 ? lips[2] : lips[0]) : lip ? lips[h2 > 0.62 ? 1 : 0] : cols[cls * 2 + (h2 > 0.62 ? 1 : 0)];
      // wound to face up (x grows with r, z falls with c); diagonals alternate so the facets read as cut planes
      if ((r + c) % 2) S.quad(a, b, e, d, c1, cls === 2 ? c1 : c2); else S.quad(b, e, d, a, c1, cls === 2 ? c1 : c2);
    }
  }
}

// ---- the sky: cut paper that reads as sky. Sixty-four rays fan from the sun right round the dome to the point opposite
// it, each ray cut across into shards 8 to 15 degrees long; a shard's tone is set by its angle from the sun alone (cream at
// the sun, through straw, celadon and sea to the deepest tone opposite), neighbouring rays a third of a step apart, so the
// whole dome is one ordered run from light to dark with no pane wider than a twelfth of the frame. Abeam of the sun the
// rays cross the view as slanting bands; toward the exit they converge behind the ring. A decagon sun and turning wedges.
function buildSky(rng, tone, mood, sunDir) {
  const group = new THREE.Group();
  const e1 = new THREE.Vector3(0, 1, 0).cross(sunDir).normalize(), e2 = new THREE.Vector3().crossVectors(sunDir, e1);
  const P = [], C = [], tones = mood.sky.map((h) => tone(h)), tmp = new THREE.Color();
  const at = (th, ph) => { const st = Math.sin(th), ct = Math.cos(th), a = st * Math.cos(ph), b = st * Math.sin(ph); return [sunDir.x * ct + e1.x * a + e2.x * b, sunDir.y * ct + e1.y * a + e2.y * b, sunDir.z * ct + e1.z * a + e2.z * b]; };
  const NR = 64, phis = [], off = rng.range(0, TAU);
  for (let j = 0; j < NR; j++) phis.push(off + (j + rng.range(-0.38, 0.38)) / NR * TAU);
  for (let j = 0; j < NR; j++) {
    const p0 = phis[j], p1 = phis[(j + 1) % NR] + (j === NR - 1 ? TAU : 0);
    let th = 0.035 + rng.range(0, 0.1), k = 0;
    while (th < Math.PI - 0.02) {
      const th2 = Math.min(th + rng.range(0.15, 0.3), Math.PI - 0.02), mid = (th + th2) * 0.5 * 57.296;
      // tone by angle from the sun, in thirds of a step; odd rays sit a third of a step off the even ones
      let c = clamp(mid / 27.5 + (j % 2 ? 0.2 : -0.2) + (hash1(j * 7.3 + k * 3.1) - 0.5) * 0.3, 0, 6);
      c = Math.round(c * 3) / 3;
      const i0 = Math.min(Math.floor(c), 5); tmp.copy(tones[i0]).lerp(tones[i0 + 1], c - i0);
      const a = at(th, p0), b = at(th, p1), d = at(th2, p0), e = at(th2, p1);
      P.push(...a, ...d, ...e, ...a, ...e, ...b); for (let i = 0; i < 6; i++) C.push(tmp.r, tmp.g, tmp.b);
      th = th2; k++;
    }
    const a = at(0.14, p0), b = at(0.14, p1), col = tones[0];                 // the cap round the sun
    P.push(sunDir.x, sunDir.y, sunDir.z, ...a, ...b); for (let i = 0; i < 3; i++) C.push(col.r, col.g, col.b);
  }
  const mk = (pos, colr, defines) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.Float32BufferAttribute(colr, 3));
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uSpin: { value: 0 }, uAxis: { value: sunDir.clone() } }, defines, vertexShader: VERT_SKY, fragmentShader: FRAG_SKY, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    m.frustumCulled = false; group.add(m); return m;
  };
  mk(P, C, {}).renderOrder = -30;
  // the fan: twenty opaque wedges 35..70 degrees long in two alternating tones, none wider than a tenth of the frame, and the decagon sun
  const dir = (phi, rho) => [sunDir.x + (e1.x * Math.cos(phi) + e2.x * Math.sin(phi)) * rho, sunDir.y + (e1.y * Math.cos(phi) + e2.y * Math.sin(phi)) * rho, sunDir.z + (e1.z * Math.cos(phi) + e2.z * Math.sin(phi)) * rho];
  const WP = [], WC = [], w2 = mood.wedge.map((h) => tone(h));
  for (let j = 0; j < 20; j++) {
    const phi = j / 20 * TAU, L = Math.tan((35 + 35 * hash1(j * 3.3 + rng.range(0, 1))) / 57.296), hw = 0.055 + 0.018 * (j % 3), col = w2[j % 2];
    WP.push(...dir(phi, 0.03), ...dir(phi - hw, L), ...dir(phi + hw, L)); for (let i = 0; i < 3; i++) WC.push(col.r, col.g, col.b);
  }
  const wedges = mk(WP, WC, { WEDGE: 1 }); wedges.renderOrder = -29;
  const SP = [], SC = [], sc = tone(mood.sun);
  for (let j = 0; j < 10; j++) { SP.push(...dir(0, 0), ...dir(j / 10 * TAU, 0.0437), ...dir((j + 1) / 10 * TAU, 0.0437)); for (let i = 0; i < 3; i++) SC.push(sc.r, sc.g, sc.b); }
  mk(SP, SC, {}).renderOrder = -28;
  return { group, update(time) { wedges.material.uniforms.uSpin.value = time * 0.01745; } };
}

// ---- echo movers: one instanced mesh per kind, drawn N+1 times per mover. aI = 0 is the living one; self aI sits
// at te = (floor((t + o) / D) - aI) * D - o, which only changes when the slot hands over, so an echo never moves.
const ECHO_HEAD = /* glsl */`
  attribute vec3 aBary; attribute vec4 aInfo;            // aInfo: role, part, extra, extra
  attribute float aI; attribute vec4 aM, aM2;            // per mover
  uniform float uT, uN, uD, uPx; uniform float uBand[4];
  varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_COLOUR}
  const float TAU = 6.2831853;
  float echoTime(float t, float o){ return aI < 0.5 ? t : (floor((t + o)/uD) - (aI - 1.))*uD - o; }
  // colour is time: life 0 (now) .. 1 (oldest self); each border is crossed softly, in under half a second
  vec3 lifeColour(float life, float role){
    float w = 0.45/max(uN*uD, 0.5);
    float k1 = smoothstep(uBand[0], uBand[0]+w, life), k2 = smoothstep(uBand[1], uBand[1]+w, life);
    float k3 = smoothstep(uBand[2], uBand[2]+w, life), k4 = smoothstep(uBand[3], uBand[3]+w, life);
    vec3 h = mix(mix(mix(mix(uHue[0], uHue[1], k1), uHue[2], k2), uHue[3], k3), uHue[4], k4);
    vec3 m = mix(mix(mix(mix(uMid[0], uMid[1], k1), uMid[2], k2), uMid[3], k3), uMid[4], k4);
    vec3 c = mix(mix(mix(mix(uComp[0], uComp[1], k1), uComp[2], k2), uComp[3], k3), uComp[4], k4);
    return role < 0.5 ? h : role < 1.5 ? m : role < 2.5 ? c : role < 3.5 ? uCream : uInk;
  }
  // small things keep a floor of a few pixels and shrink to nothing far away; the last three selves shrink away
  float sizeFloor(vec3 centre, float size, float age){
    float d = distance(centre, cameraPosition), px = size*uPx/max(d, 1.);
    return max(1., 3./max(px, 0.01)) * (1. - smoothstep(560., 720., d)) * (1. - smoothstep(uN - 3., uN, age/uD));
  }
  void finish(vec3 P, vec3 centre, float age, float role){
    float st = depthSteps(distance(centre, cameraPosition));
    vSky = skyTone(centre - cameraPosition); vLight = 0.16*st;
    vCol = mix(lifeColour(clamp(age/(uN*uD), 0., 1.), role), vSky, vLight); vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
  }
`;
// a falling kite leaf: lets go, swings down 14 m in 5 s on a pendulum arc 8 m wide, then waits for its next turn
const VERT_LEAF = /* glsl */`
  ${ECHO_HEAD}
  void main(){
    float te = echoTime(uT, aM.w), age = uT - te;
    float tau = mod(te + aM.w*7.31 + 40., aM2.x), cyc = floor((te + aM.w*7.31 + 40.)/aM2.x);
    float f = clamp(tau/5., 0., 1.), sw = TAU*tau/6.4 + aM2.z;       // one slow sweep in a fall: twelve selves draw a single arc, not a zigzag
    float yaw = aM2.y + 0.6*sin(cyc*2.3 + aM.w);
    vec3 dir = vec3(cos(yaw), 0., sin(yaw));
    float big = step(1.9, aM2.w);                                    // the four great leaves by the entry
    float amp = aM2.w > 1.9 ? 14. : aM2.w > 1.6 ? 6.5 : 4.;          // they swing arcs a quarter of the frame wide
    // a great leaf crosses its arc at one even speed (end to end in 4 s), sagging 4 m in the middle like a pendulum: its
    // twelve selves stand 2.4 m apart all along the curve, never bunched at the ends
    float sg = 1. - 4.*abs(fract(tau/7.) - 0.5);
    vec3 c = aM.xyz + dir*(amp*mix(sin(sw)*smoothstep(0., 0.15, f), sg, big)) + vec3(0., -14.*f + mix(0.9*sin(sw)*sin(sw), -4.*(1. - sg*sg), big), 0.);
    float live = step(tau, 5.) * smoothstep(0., 0.04, f) * (1. - smoothstep(0.93, 1., f));
    float roll = mix(0.95, 0.3, big)*cos(sw), cr = cos(roll), sr = sin(roll);   // a great leaf barely rolls: its selves keep one size
    // a great leaf keeps all twelve selves whole to the blue tail (only the very last shrinks away)
    float sf = mix(sizeFloor(c, 1.4*aM2.w, age), (1. - smoothstep(560., 720., distance(c, cameraPosition))) * (1. - smoothstep(uN - 0.7, uN, age/uD)), big);
    vec3 q = position * aM2.w * live * sf;
    vec3 l = vec3(q.x*cr - q.y*sr, q.x*sr + q.y*cr, q.z);          // bank into the swing
    vec3 side = vec3(-dir.z, 0., dir.x);
    // a great leaf stands upright in the plane of its swing, facing the entry axis, its tip leaning the way it goes:
    // every self shows its whole kite (a small leaf lies flat and banks)
    float lean = 0.45*(1. - 2.*smoothstep(3.3, 3.7, tau)), cl = cos(lean), sl = sin(lean);
    vec3 P0 = c + dir*l.x + vec3(0., l.y, 0.) + side*l.z;
    vec3 P1 = c + dir*(q.x*cl + q.z*sl) + vec3(0., q.z*cl - q.x*sl, 0.) + side*q.y;
    finish(mix(P0, P1, big), c, age, aInfo.x);
  }
`;

// a stilt-legged runner loping along a crest: the track is the crest line sampled into two uniform arrays
const VERT_RUNNER = /* glsl */`
  ${ECHO_HEAD}
  uniform float uTrX[64], uTrY[64], uZA, uZB, uZ0;
  vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c); }
  float trX(float z){ float f = clamp((uZA - z)/(uZA - uZB), 0., 1.)*63.; int i = int(floor(f)); return mix(uTrX[i], uTrX[min(i + 1, 63)], fract(f)); }
  float trY(float z){ float f = clamp((uZA - z)/(uZA - uZB), 0., 1.)*63.; int i = int(floor(f)); return mix(uTrY[i], uTrY[min(i + 1, 63)], fract(f)); }
  void main(){
    float te = echoTime(uT, aM.w), age = uT - te;
    float zs = aM2.w > 0.5 ? uZA : uZ0;                  // lane 0 begins where the crest has stepped clear of the path
    float span = zs - aM2.z, dist = aM2.x*te + aM.z, south = 1. - step(0.5, aM2.w);    // lane 0 runs south, toward the lens: the living runner leads, its past recedes
    float z = mix(zs - mod(dist, max(span, 1.)), aM2.z + mod(dist, max(span, 1.)), south);
    float flat0 = step(0.5, aM2.w);
    vec3 c = vec3(trX(z) + aM.x, mix(trY(z), 43., flat0) + aM.y - 0.25, z);
    vec3 fwd = normalize(vec3(trX(z - 1.5) - trX(z + 1.5), 0., -3.)) * (1. - 2.*south);
    vec3 side = vec3(-fwd.z, 0., fwd.x);
    float ph = TAU*dist/6.4, part = aInfo.y;
    vec3 p = position;
    if (part > 0.5 && part < 8.5) {                       // legs: hip swing, knee folding on the recovery
      float l = part > 4.5 ? part - 4. : part;
      float off = l < 1.5 ? 0. : l < 2.5 ? 0.55 : l < 3.5 ? 3.3 : 3.85;
      vec3 hip = vec3(aInfo.z, 3.6, aInfo.w);
      float th = 0.6*sin(ph + off), kn = 1.05*max(0., sin(ph + off + 1.9));
      if (part > 4.5) { vec3 knee = hip - vec3(0., 1.8, 0.); p = knee + rotX(p - knee, kn); }
      p = hip + rotX(p - hip, th);
    } else if (part > 8.5) { vec3 nb = vec3(0., 4.35, 1.1); p = nb + rotX(p - nb, 0.16*sin(ph + 0.7)); }
    p.y += 0.2*sin(2.*ph) - 0.12;
    float sc = aM2.y * smoothstep(aM2.z, aM2.z + 22., z) * (1. - smoothstep(zs - 20., zs, z)) * (1. - smoothstep(uN - 3., uN, age/uD));
    p *= sc;
    finish(c + side*p.x + vec3(0., p.y, 0.) + fwd*p.z, c + vec3(0., 3., 0.), age, aInfo.x);
  }
`;
// swifts (or slow kite gliders): flocks streaming round circles; a turning flock draws a fan of bodies
const VERT_SWIFT = /* glsl */`
  ${ECHO_HEAD}
  uniform float uTs, uFlap, uStretch, uGrow; uniform vec4 uFA[6], uFB[6];
  void main(){
    int f = int(aM2.x + 0.5);
    float t = f == 0 ? uTs : uT;
    float te = echoTime(t, aM.w), age = t - te, tl = te - aM2.w;
    vec4 A = uFA[f], B = uFB[f];
    float th = B.x*tl + B.y, cs = cos(th), sn = sin(th);
    float wob = sin(tl*1.3 + aM2.y);
    vec3 c = vec3(A.x + (A.w + aM.x + 2.*wob)*cs, A.y + B.z*(1. - cos(th - B.w)) + aM.y + 1.2*cos(tl*1.7 + aM2.y), A.z + (A.w + aM.x + 2.*wob)*sn);
    float sg = B.x < 0. ? -1. : 1.;
    vec3 fwd = normalize(vec3(-sn*sg, B.z*sin(th - B.w)*sg/max(A.w, 1.), cs*sg));
    vec3 right = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(right, fwd);
    float bank = 0.55*sg; right = right*cos(bank) + up*sin(bank); up = cross(right, fwd);
    vec3 p = position;
    if (aInfo.y > 0.5) { float a = (0.15 + 0.75*sin(TAU*5.*te + aM2.y*3.))*uFlap*(p.x > 0. ? 1. : -1.); float ca = cos(a), sa = sin(a); p = vec3(p.x*ca - p.y*sa, p.x*sa + p.y*ca, p.z); }
    // far off a self is a few pixels and sixteen of them are sixteen dots: each one draws out along its own track
    // until it meets the next, so a distant flock is a sheaf of fine strokes running from now to long ago
    float far = smoothstep(110., 300., distance(c, cameraPosition)) * (f == 0 ? 0. : 1.);
    p.z *= 1. + uStretch*far; p.x *= 1. - 0.4*far;
    float life = clamp(age/(uN*uD), 0., 1.), self = step(0.5, aI);
    // each comb of selves tapers from the bird to its oldest self; in the bow flock a self is a dart a third as wide as
    // its bird, so a comb is a fine line with a whole bird at its head
    // (the bow flock is a dense swirl of whole selves, its living birds half as large again as their newest selves)
    float taper = f == 0 ? mix(1.45, mix(1.15, 0.5, life), self) * uGrow : mix(1.3, 0.5, life);
    p *= aM2.z * sizeFloor(c, 2.6*aM2.z, age) * taper * (f == 0 ? 1. : 1. - smoothstep(240., 340., distance(c, cameraPosition)));
    finish(c + right*p.x + up*p.y + fwd*p.z, c, age, aInfo.x);
  }
`;

// a small dune that jumps 5 m every 6 s; its three older selves keep only the slip face: ghost crests
const VERT_DUNE = /* glsl */`
  ${ECHO_HEAD}
  void main(){
    float te = echoTime(uT, aM.w), age = uT - te;
    float q = (te + aM.w)/uD + 0.0005, n = floor(q), fr = q - n;
    float hop = aI < 0.5 ? smoothstep(0., 0.12, fr) : 0.;
    float idx = mod(n + aM2.w, 14.), along = (idx - 1. + hop) * 5.;
    vec3 dir = vec3(sin(aM.z), 0., cos(aM.z)), side = vec3(dir.z, 0., -dir.x);
    vec3 c = vec3(aM.x, aM2.y + aM2.z*along, aM.y) + dir*along;
    c.y += aI < 0.5 ? 3.2*sin(3.14159*clamp(fr/0.12, 0., 1.)) : 0.;
    float sc = aM2.x * smoothstep(0.2, 1.6, idx + hop) * (1. - smoothstep(11.5, 13., idx + hop));
    vec3 p = position * sc;
    if (aI > 0.5 && aInfo.y < 0.5) p = vec3(0., -1., 0.);          // ghosts: the windward body folds away
    finish(c + side*p.x + vec3(0., p.y, 0.) + dir*p.z, c, age, aInfo.x);
  }
`;
// squall rods: streak down the slant, stand a second where they land, then drop
const VERT_ROD = /* glsl */`
  attribute vec3 aBary; attribute vec4 aM, aM2; attribute vec3 aColor;
  uniform float uT; varying vec3 vBary, vCol, vSky; varying float vLight;
  ${GLSL_COLOUR}
  void main(){
    float tau = fract((uT + aM.w)/aM2.x)*aM2.x, len = aM.z;
    float off = tau < 0.45 ? 300.*(1. - tau/0.45)*(1. - tau/0.45) : tau < 1.45 ? 0. : -len*min((tau - 1.45)/0.5, 1.)*min((tau - 1.45)/0.5, 1.);
    float live = step(tau, 1.95);
    vec3 axis = normalize(vec3(aM2.y, 1., aM2.z)), foot = vec3(aM.x, aM2.w, aM.y);
    vec3 mid = foot + axis*(off + 0.5*len);
    float w = max(0.7, distance(mid, cameraPosition)*0.0055) * live;      // slats of rain with weight, never hair lines
    vec3 P = foot + axis*max(off + position.y*len, -2.) + vec3(position.x, 0., position.z)*w;
    float st = depthSteps(distance(foot, cameraPosition));
    vSky = skyTone(foot - cameraPosition); vLight = 0.16*st;
    vCol = mix(aColor, vSky, vLight); vBary = aBary;
    gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
  }
`;

function echoMaterial(shared, vs, N, D, clock) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uT: clock, uN: { value: N }, uD: { value: D }, uPx: shared.uPx, uBand: { value: [0.09, 0.16, 0.495, 0.77] } },
    vertexShader: vs, fragmentShader: FRAG_FLAT, side: THREE.DoubleSide, fog: false, toneMapped: false,
  });
}
// movers: geometry is a list of faces { p: [a, b, c], role, part, hide, x, y }; instances: N+1 selves of each mover
function echoMesh(faces, movers, N, mat, name) {
  const g = new THREE.InstancedBufferGeometry(), P = [], B = [], I = [];
  for (const f of faces) {
    P.push(...f.p[0], ...f.p[1], ...f.p[2]);
    const h = f.hide || 0, hx = h === 3 ? 1 : 0, hy = h === 1 ? 1 : 0, hz = h === 2 ? 1 : 0;
    B.push(1, hy, hz, hx, 1, hz, hx, hy, 1);
    for (let k = 0; k < 3; k++) I.push(f.role, f.part || 0, f.x || 0, f.y || 0);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4));
  const n = movers.length * (N + 1), aI = new Float32Array(n), aM = new Float32Array(n * 4), aM2 = new Float32Array(n * 4);
  movers.forEach((m, j) => { for (let i = 0; i <= N; i++) { const k = j * (N + 1) + i; aI[k] = i; aM.set(m.a, k * 4); aM2.set(m.b, k * 4); } });
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 1));
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4));
  g.setAttribute('aM2', new THREE.InstancedBufferAttribute(aM2, 4));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, mat); mesh.name = name; mesh.frustumCulled = false;
  return mesh;
}

function zColumns() {
  const knots = CREST.map((k) => k[0]), fine = [2250, 1650, 1200, 900];
  for (let z = 875; z > 700; z -= 25) fine.push(z);
  for (let z = 693; z > 240; z -= 7) fine.push(z);
  for (let z = 240; z > -300; z -= 16) fine.push(z);
  fine.push(-330, -365, -410, -465, -600, -700, -800, -1050, -1200, -1650, -2250);
  const coarse = [2250, 1650, 1200, 850, 610, 380, 195, 45, -65, -250, -340, -430, -640, -770, -1050, -1200, -1650, -2250];
  const merge = (list) => [...knots, ...list.filter((z) => knots.every((k) => Math.abs(k - z) > 3))].sort((a, b) => b - a);
  return { fine: merge(fine), coarse: merge(coarse) };
}
const ROWS_FINE = (() => { const r = [62, 73, 85]; for (let s = 93; s < 216; s += 8) r.push(s); r.push(220, 227, 234, 241, 248, 254, 260, 271, 282); return r; })();
const ROWS_MID = [62, 85, 112, 139, 166, 193, 220, 233, 246, 260, 282];
const ROWS_FAR = [62, 85, 130, 175, 198, 220, 240, 260, 282];
// east of the avenue (mirrored cells): cell 0 from its floor over the foredune to the next ridge's west-looking slip face
const ROWS_E0 = [62, 70, 79, 87, 95, 108, 122, 136, 150, 165, 180, 190, 200, 210, 220, 242, 275, 310, 355, 378];
const ROWS_E = [158, 180, 193, 207, 220, 242, 275, 310, 355, 378], ROWS_EFAR = [158, 180, 200, 220, 242, 290, 355, 378];

export default {
  id: 'every-wingbeat-stays',
  name: 'Every Wingbeat Stays',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- which visit is this: the key, the bird, the weather, the cast
    const m01 = vary.mood ?? rng();
    const hour = vary.hour || 'any';
    const moodId = hour === 'day' ? 'noon' : hour === 'golden' || hour === 'dawn' ? 'evening' : hour === 'night' ? 'blue' : m01 < 0.2 ? 'blue' : m01 < 0.38 ? 'evening' : 'noon';
    const mood = MOODS[moodId];
    const vr = rng.fork('visit');
    const variant = vr.pick(['crane', 'crane', 'crane', 'condor', 'frigate']);
    const squallNear = vr.chance(0.3), gliders = vr.chance(0.35), nRunners = Math.round(clamp(40 * density, 24, 56));
    const rare = !!vary.rare;
    const tone = makeTone(1);
    scene.background = tone(mood.sky[2]);
    const sunDir = new THREE.Vector3(-Math.cos(0.489), Math.sin(0.489), 0);

    // ---- the Gyre, and the flight laid along its anchors
    // the foot comes apart early: the last blue band begins at shell 62 and from shell 68 the faces let go, so on the climb
    // (u 0.36) the half turn to port runs from whole shells through gapped ones to a loose cloud of falling triangles
    const hero = await buildHero(ctx, { palette: mood.pal, mids: mood.mids, comps: mood.comps, variant, detail, exposure: 1, depthK: 0.1, ribbons: false, crumble: 12, blueFrom: 0.69 });   // no lines of force: at this scale they read as stray wire
    hero.setSky(mood.warm, mood.cool, sunDir);
    scene.add(hero.object);
    await ctx.yield();
    const BIG = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 6000);                 // nothing here is culled: spare the bounds pass
    const noBounds = (root) => root.traverse((o) => { if (o.geometry) o.geometry.boundingSphere = BIG.clone(); });
    const HU = hero.uniforms;
    const plan = flightPlan(hero);
    const path = makePath(plan.map((q) => q.p));
    const lens = path.curve.getLengths(path.curve.arcLengthDivisions), nDiv = lens.length - 1;
    const kx = [], kt = [];
    plan.forEach((q, j) => { if (q.t !== null) { kx.push(lens[Math.round(j / (plan.length - 1) * nDiv)] / path.length); kt.push(q.t); } });
    const clockOf = monotone(kx, kt);
    await ctx.yield();

    const shared = { uSkyWarm: HU.uSkyWarm, uSkyCool: HU.uSkyCool, uSunDir: HU.uSunDir, uInkF: HU.uInkF, uLineW: HU.uLineW, uBack: HU.uBack, uHue: HU.uHue, uMid: HU.uMid, uComp: HU.uComp, uCream: HU.uCream, uInk: HU.uInk, uAges: HU.uAges };
    const stillMat = (plain) => new THREE.ShaderMaterial({ uniforms: { ...shared, uNearPlain: { value: plain ? 1 : 0 } }, vertexShader: VERT_STILL, fragmentShader: FRAG_FLAT, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const addStill = (S, name) => { const m = new THREE.Mesh(S.geometry(false), stillMat(name === 'dunes')); m.geometry.boundingSphere = BIG.clone(); m.name = name; m.frustumCulled = false; scene.add(m); return m; };

    // ---- sky
    const sky = buildSky(rng.fork('sky'), tone, mood, sunDir);
    scene.add(sky.group);
    await ctx.yield();

    // ---- ground: three bands of chevron megadunes joined along flat floors
    const G = makeGroundFn(noise, path), zc = zColumns();
    {
      const S = soup();
      const tick = () => ctx.yield();
      await buildDunes(S, G, tone, mood, zc.fine, -3, 2, (i) => (i === -1 ? ROWS_FINE : i === 0 ? ROWS_E0 : i > 0 ? ROWS_E : ROWS_MID), false, tick);
      await ctx.yield();
      await buildDunes(S, G, tone, mood, zc.coarse, -15, -4, () => ROWS_FAR, true, tick);
      await buildDunes(S, G, tone, mood, zc.coarse, 3, 14, () => ROWS_EFAR, true, tick);
      await ctx.yield();
      addStill(S, 'dunes');
      await ctx.yield();
    }

    await ctx.yield();
    const updaters = [];
    const uTime = { value: 0 }, uWt = { value: 0 };
    shared.uPx = { value: 400 };
    const pal = mood.pal;

    // ---- kite trees (rigid masts with a fan of flat kite leaves) and the litter of fallen triangles in the basin
    const trees = [];
    {
      const S = soup(), tr = rng.fork('trees');
      const leafCols = mood.leaf.map((h) => tone(h)), cream = tone(pal[5]), inkC = tone(pal[6]), mastC = tone(mood.dune[3]);
      const tree = (x, z, top, yaw, near) => {
        const y0 = G.at(x, z) - 0.5, h = clamp(top - y0, 9, 22), lean = [tr.range(-0.6, 0.6), tr.range(-0.6, 0.6)];
        const at = (t) => [x + lean[0] * t * t, y0 + h * t, z + lean[1] * t * t];
        const cy = Math.cos(yaw), sy = Math.sin(yaw), base = at(0), tp = at(1), w = 0.34;
        for (let k = 0; k < 3; k++) {
          const a0 = k / 3 * TAU, a1 = (k + 1) / 3 * TAU;
          S.quad([base[0] + Math.cos(a0) * w, base[1], base[2] + Math.sin(a0) * w], [base[0] + Math.cos(a1) * w, base[1], base[2] + Math.sin(a1) * w], [tp[0] + Math.cos(a1) * 0.07, tp[1], tp[2] + Math.sin(a1) * 0.07], [tp[0] + Math.cos(a0) * 0.07, tp[1], tp[2] + Math.sin(a0) * 0.07], k === 0 ? inkC : mastC);
        }
        for (let j = 0; j < 20; j++) {
          const t = 0.26 + 0.74 * (j / 19), r = at(t), sd = j % 2 ? 1 : -1, up = lerp(0.15, 1.25, t) + tr.range(-0.12, 0.12), L = lerp(5.2, 2.4, t) * (near ? 1.1 : 1) * tr.range(0.85, 1.1), wd = L * 0.2;
          const d = [cy * Math.cos(up) * sd, Math.sin(up), sy * Math.cos(up) * sd], n = [-cy * Math.sin(up) * sd, Math.cos(up), -sy * Math.sin(up) * sd], tw = tr.range(-0.5, 0.5);
          const o = [-sy * tw, 0, cy * tw];                                   // a little twist out of the fan's plane
          const pt = (a, b) => [r[0] + d[0] * a + (n[0] + o[0]) * b, r[1] + d[1] * a + n[1] * b, r[2] + d[2] * a + (n[2] + o[2]) * b];
          const root = pt(0.1, 0), lft = pt(L * 0.42, wd), tip = pt(L, 0), rgt = pt(L * 0.42, -wd), col = leafCols[(j + (j >> 2)) % 3];
          S.tri(root, lft, tip, col); S.tri(root, tip, rgt, j % 3 ? cream : leafCols[(j + 1) % 3]);
        }
        trees.push({ x, z, y0, h, near });
      };
      // the avenue: masts 11 m to either side of the entry run; port side only where the runners' crest is to starboard
      for (let z = 668, k = 0; z > 262; z -= 20.5, k++) {
        const n = path.nearestXZ(0, z), px = path.pointAt(n.u).x;
        if (z > 505 || k % 2 === 0) tree(px - 11 - (k % 3) * 1.2, z, n.y - 1 + (k % 3) * -2.2, 1.57 + tr.range(-0.5, 0.5), true);
        if (z > 505) tree(px + 11 + (k % 2) * 1.5, z - 10, n.y - 4 - (k % 3) * 2, 1.57 + tr.range(-0.5, 0.5), true);
      }
      for (let k = 0; k < 6; k++) {                              // masts down the windward face to starboard of the entry run
        const z = 628 - k * 44, x = crestX(z) + 96 + (k % 3) * 22;
        tree(x, z, G.at(x, z) + 13 + (k % 2) * 3, 1.57 + tr.range(-0.5, 0.5), true);
      }
      await ctx.yield();
      const nFar = Math.round(118 * detail * density);
      for (let k = 0, tries = 0; k < nFar && tries < 4000; tries++) {
        const i = tr.int(-4, 4), z = tr.range(-420, 980), x = crestX(z) + i * DUNE_W + tr.range(-5, 3);
        if (Math.hypot(x, z) < 265 || path.nearestXZ(x, z).dist < 30) continue;
        tree(x, z, G.at(x, z) + tr.range(10, 16), tr.range(0, TAU), false); k++;
        if (k % 16 === 15) await ctx.yield();
      }
      await ctx.yield();
      // fallen triangles: what is left of wingbeats older than ninety
      const old = [tone(pal[3]), tone(pal[3], 0.72), tone(mood.dune[3]), tone(mood.dune[2])];
      const nLit = Math.round(420 * detail);
      for (let k = 0; k < nLit; k++) {
        const a = tr.range(0, TAU), r = 110 + tr.gauss() * 20; if (r < 30 || r > 250) continue;   // a ring of shards under the helix, not a scatter
        const x = Math.cos(a) * r, z = Math.sin(a) * r, y = G.at(x, z) + 0.25, sz = tr.range(1.6, 5.5), yaw = tr.range(0, TAU);
        const v = [0, 1, 2].map((q) => { const an = yaw + q * 2.094 + tr.range(-0.5, 0.5), rr = sz * tr.range(0.5, 1); return [x + Math.cos(an) * rr, y + (q === 0 ? tr.range(0, sz * 0.5) : 0), z + Math.sin(an) * rr]; });
        S.tri(v[0], v[2], v[1], old[k % 4]);
        if (k % 400 === 399) await ctx.yield();
      }
      // the ring: a plain faceted hoop of 14 m hung under the helix where the newest wing will be laid
      {
        const seat = hero.anchors.portalSeat.position, c1 = tone(pal[5]), c2 = tone(mood.sky[1]), c3 = tone(mood.dune[2]);
        const pt = (k, r, dx) => { const a = k / 14 * TAU + 0.224; return [seat.x + dx, seat.y + Math.sin(a) * r, seat.z + Math.cos(a) * r]; };
        for (let k = 0; k < 14; k++) {
          S.quad(pt(k, 7.35, 0.15), pt(k, 9.1, -0.5), pt(k + 1, 9.1, -0.5), pt(k + 1, 7.35, 0.15), k % 2 ? c1 : c2);
          S.quad(pt(k, 9.1, -0.5), pt(k, 8.3, 1.6), pt(k + 1, 8.3, 1.6), pt(k + 1, 9.1, -0.5), c3);
        }
      }
      await ctx.yield();
      addStill(S, 'trees');
    }
    await ctx.yield();

    // ---- falling leaves: each one a dotted arc of 12 selves, yellow at the leaf, blue at its tail
    {
      const lr = rng.fork('leaves'), faces = [], c = [0, 0.06, 0], L = 0.75, W = 0.36;
      const root = [0, 0, -L], lft = [-W, 0, 0.05], tip = [0, 0, L], rgt = [W, 0, 0.05];
      faces.push({ p: [root, c, lft], role: 0 }, { p: [lft, c, tip], role: 0 }, { p: [tip, c, rgt], role: 1 }, { p: [rgt, c, root], role: 1 });   // hue and mid only: the run of colour along an arc is the picture
      const near = trees.filter((t) => t.near), all = trees.filter((t) => !t.near && t.z > -100 && Math.abs(t.x) < 520), movers = [];
      const nAll = Math.round(340 * detail * density);
      // four great leaves by the entry, two on either hand, released 36 m out from the avenue over the open slopes (clear
      // of the fronds) and 60 to 100 m ahead of the first frame: each an arc a quarter of the frame wide across the lower
      // third, in a plane that faces the entry axis, begun at its outer end; the pair on a side fall half a cycle apart
      for (let k = 0; k < 4; k++) {
        const sd = k % 2 ? 1 : -1, far = k >> 1;
        movers.push({ a: [sd * (29 + 8 * far), 55 - 2 * far, 566 - 30 * far - (k % 2) * 6, far * 0.36 + (k % 2) * 0.17 + lr.range(0, 0.02)], b: [5.2 + 0.1 * k, sd > 0 ? 0 : Math.PI, -1.57, 2.6] });
      }
      const nNear = Math.round(26 * Math.max(detail, 0.8));        // (54 of them were the confetti of the entry frame)
      for (let k = 0; k < nNear + nAll; k++) {
        const t = k < nNear ? near[k % near.length] : (all.length ? lr.pick(all) : near[0]);
        const yaw = t.near ? (lr.chance(0.5) ? 0 : Math.PI) + lr.range(-0.45, 0.45) : lr.range(0, TAU);   // near arcs swing across the avenue, side on to the entry view
        movers.push({ a: [t.x, t.y0 + t.h * lr.range(0.7, 1.02), t.z, lr.range(0, 9)], b: [lr.range(5.6, 9), yaw, lr.range(0, TAU), t.near ? lr.range(1.3, 1.7) : lr.range(1.1, 1.5)] });
      }
      const leafMat = echoMaterial(shared, VERT_LEAF, 12, 0.3, uTime);
      leafMat.uniforms.uBand = { value: [0.1, 0.26, 0.5, 0.74] };     // twelve selves: two of now, two orange, two vermilion, three magenta, the last four blue
      scene.add(echoMesh(faces, movers, 12, leafMat, 'leaves'));
    }
    await ctx.yield();

    let wt = 0, slack = 0, prevTime = null, prevU = 0;
    const uGrow = { value: 0 };                                   // the bow flock grows from nothing as we near it: no knot of selves at the needle's foot in the entry view
    const flockAim = new THREE.Vector3();
    // helpers for mover anatomy: a quad as two faces with the diagonal hidden, a three-sided tapered limb
    const fq = (F, a, b, c, d, role, o = {}) => { F.push({ p: [a, b, c], role, hide: 1, ...o }, { p: [a, c, d], role: o.role2 ?? role, hide: 2, ...o }); };
    const limb = (F, p0, p1, r0, r1, roles, o) => {
      for (let k = 0; k < 3; k++) {
        const a0 = k / 3 * TAU + 0.5, a1 = (k + 1) / 3 * TAU + 0.5;
        fq(F, [p0[0] + Math.cos(a0) * r0, p0[1], p0[2] + Math.sin(a0) * r0], [p0[0] + Math.cos(a1) * r0, p0[1], p0[2] + Math.sin(a1) * r0], [p1[0] + Math.cos(a1) * r1, p1[1], p1[2] + Math.sin(a1) * r1], [p1[0] + Math.cos(a0) * r1, p1[1], p1[2] + Math.sin(a0) * r1], roles[k % roles.length], o);
      }
    };

    // ---- runners: stilt-legged grazers loping north along the crests, each a frieze of 14 selves
    {
      const rr = rng.fork('runners'), F = [];
      const CT = [0, 4.6, 1.25], CL = [-0.52, 3.75, 1.2], CR = [0.52, 3.75, 1.2], RT = [0, 4.2, -1.3], RL = [-0.3, 3.6, -1.3], RR = [0.3, 3.6, -1.3], CK = [0, 3.35, 1.55];
      fq(F, CT, CL, RL, RT, 0); fq(F, CT, RT, RR, CR, 1); fq(F, CL, CR, RR, RL, 2);
      F.push({ p: [CT, CL, CK], role: 3 }, { p: [CT, CK, CR], role: 1 }, { p: [CL, CR, CK], role: 2 }, { p: [RT, RL, RR], role: 2 });
      F.push({ p: [RT, [0, 5.0, -2.8], [0, 3.9, -2.3]], role: 2 }, { p: [[0, 4.5, -0.2], [0, 5.3, -1.1], [0, 4.3, -1.0]], role: 3 });
      const nt = [0, 5.8, 2.4];
      limb(F, [0, 4.3, 1.05], nt, 0.3, 0.14, [0, 1, 2], { part: 9 });
      F.push({ p: [[-0.16, 5.86, 2.3], [0.16, 5.86, 2.3], [0, 5.62, 3.3]], role: 3, part: 9 }, { p: [[-0.16, 5.86, 2.3], [0, 5.62, 3.3], [0, 5.55, 2.35]], role: 0, part: 9 }, { p: [[0.16, 5.86, 2.3], [0, 5.62, 3.3], [0, 5.55, 2.35]], role: 1, part: 9 });
      F.push({ p: [[0, 5.0, 1.6], [0, 6.2, 1.3], [0, 5.7, 2.2]], role: 2, part: 9 });
      [[-0.4, 0.95], [0.4, 0.95], [-0.32, -0.95], [0.32, -0.95]].forEach(([hx, hz], l) => {
        const o1 = { part: l + 1, x: hx, y: hz }, o2 = { part: l + 5, x: hx, y: hz };
        limb(F, [hx, 3.7, hz], [hx, 1.8, hz], 0.24, 0.13, [0, 1, 0], o1);
        limb(F, [hx, 1.8, hz], [hx, 0.05, hz], 0.13, 0.08, [2, 2, 1], o2);
        F.push({ p: [[hx - 0.16, 0.02, hz - 0.1], [hx + 0.16, 0.02, hz - 0.1], [hx, 0.12, hz + 0.5]], role: 3, ...o2 });
      });
      const zA = 720, zB = 130, Z0 = 515, trX = [], trY = [];
      for (let k = 0; k < 64; k++) { const z = zA - k * (zA - zB) / 63; trX.push(crestX(z)); trY.push(G.raw(0, 0, z)); }
      const movers = [];
      for (let j = 0; j < nRunners; j++) {
        // lanes: our own crest (from where it steps to starboard), the two neighbouring ridges, and the foredune 95 m
        // to starboard, whose friezes the entry view sees at an angle
        const lane = j % 5 === 1 || j % 10 === 2 ? 2 : j % 5 === 0 ? 0 : j % 5 === 3 || j % 10 === 7 ? -1 : 1, zEnd = lane === 2 ? 340 : lane ? 262 : zB;
        const off = lane === 2 ? 95 : lane * DUNE_W, dy = lane === 2 ? FORE_H - 43.4 : lane ? -2 - (lane < 0 ? 1 : 0) : 0;
        const r1 = rr.range(-0.3, 0.3), r2 = rr.range(0, (lane ? zA : Z0) - zEnd), r3 = rr.range(0, 0.2), r4 = rr.range(11, 13), r5 = rr.range(0.9, 1.12);
        // lane 0 (the crest beside us to starboard): one runner in five, at one speed and even spacing, a third larger than
        // the rest, running SOUTH toward the lens: each living runner comes at us in the colour of now, the largest figure
        // of its frieze, and its fourteen selves stand behind it stepping away up the crest through every band
        const n0 = Math.ceil(nRunners / 5), k0 = Math.floor(j / 5);
        movers.push({ a: [off + r1, dy, lane === 0 ? (k0 + 0.5) / n0 * (Z0 - zB) + (r3 - 0.1) * 40 : r2, r3], b: [lane === 0 ? 12 : r4, r5 * (lane === 0 ? 1.3 : 1), zEnd, lane === 2 ? 2 : lane ? 1 : 0] });
      }
      const mat = echoMaterial(shared, VERT_RUNNER, 14, 0.2, uTime);
      Object.assign(mat.uniforms, { uTrX: { value: trX }, uTrY: { value: trY }, uZA: { value: zA }, uZB: { value: zB }, uZ0: { value: Z0 } });
      scene.add(echoMesh(F, movers, 14, mat, 'runners'));
    }
    await ctx.yield();

    // ---- swifts in six flocks (or slow kite gliders): flock 0 turns across the bow at u 0.25, on the world clock
    {
      const sr = rng.fork('swifts'), F = [];
      if (!gliders) {
        const nose = [0, 0, 0.62], back = [0, 0.13, 0.05], tail = [0, 0, -0.6], lf = [-0.2, 0, 0], rt = [0.2, 0, 0];
        F.push({ p: [nose, lf, back], role: 0 }, { p: [nose, back, rt], role: 1 }, { p: [back, lf, tail], role: 1 }, { p: [back, tail, rt], role: 0 });
        F.push({ p: [tail, [-0.28, 0, -1.05], [-0.04, 0, -0.75]], role: 4 }, { p: [tail, [0.28, 0, -1.05], [0.04, 0, -0.75]], role: 4 });
        for (const sx of [1, -1]) {
          // a sickle with enough blade to read as a wing from 70 m: arm, hand and a trailing vane
          const root = [sx * 0.12, 0.02, 0.3], elbow = [sx * 0.62, 0.02, 0.52], tip = [sx * 1.8, 0.02, -0.8], inner = [sx * 0.62, 0.02, 0.08], rear = [sx * 0.12, 0.02, -0.2];
          F.push({ p: [root, elbow, inner], role: 0, part: 1 }, { p: [elbow, tip, inner], role: 2, part: 1 }, { p: [root, inner, rear], role: 1, part: 1 });
        }
      } else {
        const nose = [0, 0, 0.9], tail = [0, 0, -1.1], c = [0, 0.16, 0.15];
        for (const sx of [1, -1]) { const w = [sx * 1.5, 0, 0.1]; F.push({ p: [nose, w, c], role: sx > 0 ? 0 : 1, part: 1 }, { p: [w, tail, c], role: sx > 0 ? 2 : 3, part: 1 }); }
        F.push({ p: [tail, [0.12, 0, -2.4], [-0.12, 0, -2.4]], role: 4 });
      }
      const sp = gliders ? 0.42 : 1, N = 16, D = gliders ? 0.5 : 0.25;
      // flock 0 wheels across the bow at u 0.252: a circle 62 m ahead, tilted so that we see it from below (its high
      // side toward us, 13 m clear over the path), the birds sweeping round its far side from starboard to port with
      // their selves strung out behind them over 135 degrees of the turn: one curved fan in the upper middle of the frame
      const u25 = 0.25, T25 = clockOf(0.252), pc = path.pointAt(u25).addScaledVector(path.tangentAt(u25), 62), R0 = 24, w0 = -2.36 / (N * D);
      flockAim.set(pc.x, pc.y + 9 + 0.35 * 13, pc.z - 0.4 * R0);
      // (FIX2) the circle itself stands 36 m to starboard of that aim and 5 m higher: the fan turns in the open sky to the right
      // of the needle instead of across it
      const fA = [new THREE.Vector4(pc.x, pc.y + 9, pc.z, R0)], fB = [new THREE.Vector4(w0, -0.85 * Math.PI - w0 * (T25 - 0.3), 13, -Math.PI / 2)];
      const ring = (x, y, z, R, dirn, h) => { fA.push(new THREE.Vector4(x, y, z, R)); fB.push(new THREE.Vector4(dirn * 22 * sp / R, sr.range(0, TAU), h, sr.range(0, TAU))); };
      // (no flock round the needle's top any more: nothing but sky behind the living bird on the pass beside it)
      ring(-270, 92, 240, 64, -1, 8); ring(0, 232, 0, rare ? 27 : 54, 1, 5); ring(-95, 78, 600, 60, 1, 9); ring(0, 96, 0, 236, -1, 10); ring(250, 84, 380, 85, -1, 12);
      const movers = [], per = Math.round(48 * detail);
      // the bow flock: fourteen birds in open order on concentric arcs 2.6 m apart, so each bird's comb of sixteen selves is
      // its own fine stroke with sky between it and the next, and the whole flock is one fan
      for (let k = 0; k < 36; k++) movers.push({ a: [sr.range(-10, 10), sr.range(0, 7), 0, sr.range(0, D)], b: [0, sr.range(0, TAU), sr.range(0.85, 1.2) * (gliders ? 1.25 : 1) * 1.9, sr.range(0, 0.7)] });
      for (let f = 1; f < 6; f++) for (let k = 0; k < per; k++) {
        movers.push({ a: [sr.range(-6, 6), sr.range(0, 5.5), 0, sr.range(0, D)], b: [f, sr.range(0, TAU), sr.range(0.85, 1.2) * (gliders ? 1.25 : 1), sr.range(0, 2.6)] });
      }
      const mat = echoMaterial(shared, VERT_SWIFT, N, D, uTime);
      Object.assign(mat.uniforms, { uTs: uWt, uFlap: { value: gliders ? 0.12 : 1 }, uStretch: { value: gliders ? 0.3 : 2.3 }, uGrow: uGrow, uFA: { value: fA }, uFB: { value: fB } });
      scene.add(echoMesh(F, movers, N, mat, 'swifts'));
    }
    await ctx.yield();

    // ---- sixty small dunes that jump across the basin, each with three ghost crests behind it
    {
      const dr = rng.fork('jump'), F = [], n = 6;
      const C = (a) => [a * 7, 3.6 * (1 - a * a) + 0.35, -1.5 + 5.5 * a * a], W = (a) => [a * 8.6, 0, -9.5 + 7 * a * a], Sl = (a) => [a * 6.2, 0, 0.8 + 4.6 * a * a];
      for (let k = 0; k < n; k++) {
        const a0 = -1 + 2 * k / n, a1 = -1 + 2 * (k + 1) / n;
        fq(F, W(a0), C(a0), C(a1), W(a1), 1, { role2: 1 });
        fq(F, C(a0), Sl(a0), Sl(a1), C(a1), 2, { part: 1, role2: 2 });
      }
      const movers = [];
      for (let k = 0, tries = 0; k < 60 && tries < 3000; tries++) {
        const a = dr.range(0, TAU), r = dr.range(48, 242), x = Math.cos(a) * r, z = Math.sin(a) * r;
        const sgn = dr.chance(0.5) ? 1 : -1, slope = (crestX(z - 20) - crestX(z + 20)) / -40, ang = Math.atan2(slope * sgn, sgn);
        const ex = x + Math.sin(ang) * 60, ez = z + Math.cos(ang) * 60;
        if (Math.hypot(ex, ez) < 40 || Math.hypot(x + Math.sin(ang) * 30, z + Math.cos(ang) * 30) < 40) continue;
        const y0 = G.at(x, z), y1 = G.at(ex, ez); if (Math.abs(y1 - y0) > 5) continue;
        movers.push({ a: [x, z, ang, dr.range(0, 6)], b: [dr.range(0.8, 1.5), y0 - 0.5, (y1 - y0) / 60, dr.int(0, 13)] }); k++;
      }
      scene.add(echoMesh(F, movers, 3, echoMaterial(shared, VERT_DUNE, 3, 6, uTime), 'jumping-dunes'));
    }
    await ctx.yield();

    // ---- the squall: slanting rods far to port; on some visits it crosses the path and stands all round us
    {
      const qr = rng.fork('squall'), g = new THREE.InstancedBufferGeometry(), P = [], B = [];
      for (let k = 0; k < 3; k++) {
        const a0 = k / 3 * TAU, a1 = (k + 1) / 3 * TAU, p = (a, y) => [Math.cos(a), y, Math.sin(a)];
        P.push(...p(a0, 0), ...p(a1, 0), ...p(a1, 1), ...p(a0, 0), ...p(a1, 1), ...p(a0, 1)); B.push(1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1);
      }
      P.push(1, 1, 0, -0.5, 1, 0.866, -0.5, 1, -0.866); B.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
      const aM = [], aM2 = [], aC = [], cols = [tone(mood.rod), tone(mood.rod, 0.86), tone(mood.sky[3])];
      const sl = [qr.range(0.22, 0.34), qr.range(-0.12, 0.12)];
      const rod = (x, z) => { const c = cols[aM.length / 4 % 3 | 0]; aM.push(x, z, qr.range(70, 130), qr.range(0, 4)); aM2.push(qr.range(2.6, 4.2), sl[0] + qr.range(-0.03, 0.03), sl[1], G.at(x, z) - 1); aC.push(c.r, c.g, c.b); };
      const nFar = Math.round(280 * detail);
      for (let k = 0; k < nFar; k++) { const a = qr.range(0, TAU), r = Math.sqrt(qr()) * 240; rod(-540 + Math.cos(a) * r, 40 + Math.sin(a) * r * 1.3); }
      if (squallNear) for (let k = 0, tries = 0, nNear = Math.round(300 * detail); k < nNear && tries < 3000; tries++) {
        const a = qr.range(0, TAU), r = Math.sqrt(qr()) * 300, x = Math.cos(a) * r - 20, z = 500 + Math.sin(a) * r;
        if (path.nearestXZ(x, z).dist < 26 || path.nearestXZ(x + sl[0] * 40, z + sl[1] * 40).dist < 26 || path.nearestXZ(x + sl[0] * 90, z + sl[1] * 90).dist < 26) continue;
        rod(x, z); k++;
      }
      g.setAttribute('aM', new THREE.InstancedBufferAttribute(new Float32Array(aM), 4)); g.setAttribute('aM2', new THREE.InstancedBufferAttribute(new Float32Array(aM2), 4));
      g.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aC), 3)); g.instanceCount = aM.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...shared, uT: uTime }, vertexShader: VERT_ROD, fragmentShader: FRAG_FLAT, side: THREE.DoubleSide, fog: false, toneMapped: false }));
      m.name = 'squall'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- rare: a second, smaller bird spirals down the needle the other way, its trail running blue to yellow;
    // inside the great arcade its own turns cross it in a lattice
    let second = null;
    if (rare) {
      const p2 = [pal[3], pal[2], pal[1], pal[0], pal[4], pal[5], pal[6]];
      // a tight stair of 40 larger shells and no lines of force, round the needle's foot below the great arcade, where the
      // run in and the climb look straight at it (u 0-0.45); its trail runs from blue at the bird through magenta and vermilion
      // to the colour of now within eighteen shells, so above the bird it is a bright stair inside the crumbling blue
      // foot of the great one: time run backwards, and unmistakably another bird
      const SC = 0.7;
      second = await buildHero({ ...ctx, rng: rng.fork('second') }, { palette: p2, comps: mood.comps ? [...mood.comps].reverse() : undefined, variant: variant === 'frigate' ? 'crane' : 'frigate', detail, needle: false, swifts: false, ribbons: false, shells: 40, crumble: 8, bands: [0.1, 0.18, 0.3, 0.45], climb: -1, y0: 58 / SC, phase: 2.2, depthK: 0.1, farHue: 0.5 });
      second.setSky(mood.warm, mood.cool, sunDir);
      second.object.scale.set(SC, SC, -SC);
      scene.add(second.object);
      await ctx.yield();
    }

    noBounds(scene);
    await ctx.yield();
    // on the climb (u 0.30-0.48) the gaze leaves the needle's axis for the stair itself, half a radian ahead of us round
    // the helix and some 40 m above us: whole birds of one colour fill the frame (blue, then magenta) and the shaft
    // stands slim at the left; by u 0.5 it is back on the axis
    const climbAim = (v, u, dy) => {
      path.pointAt(u, v); const y = v.y, az = Math.atan2(v.z, v.x) - lerp(0.62, 0.44, smoothstep(0.34, 0.42, u)), k = smoothstep(0.29, 0.34, u) * (1 - smoothstep(0.44, 0.5, u));
      return v.set(lerp(0, 110 * Math.cos(az), k), y + lerp(dy, 32, k), lerp(0, 110 * Math.sin(az), k));
    };
    const seatV = hero.anchors.portalSeat.position.clone();
    const birdAim = (v, u) => {
      hero.birdAt(wt - 0.6 * (1 - smoothstep(0.7, 0.77, u)), v); v.y += 5 * bell(u, 0.66, 0.84, 0.3) + 12 * (1 - smoothstep(0.7, 0.77, u)) - 3 * smoothstep(0.8, 0.88, u);
      _seatLow.copy(seatV); _seatLow.y += lerp(-9, 7, smoothstep(0.885, 0.935, u)) * bell(u, 0.86, 0.995, 0.3); _seatLow.z += 12 * bell(u, 0.86, 0.995, 0.3);     // a little under the ring: the stair below it fills the lower frame
      return v.lerp(_seatLow, 0.42 * smoothstep(0.8, 0.87, u) + 0.58 * smoothstep(0.88, 0.94, u));
    };
    // the camera's speed follows the world clock: where the route asks for many metres in a clock second (out of the
    // arcade, abeam of the bird at 1.6 times its radius) we fly faster, under the arcade and on the last straight slower,
    // so the bird beats and climbs at one even rate all the way
    const T0 = clockOf(0), T1 = clockOf(1);
    const paceOf = (u) => { const a = Math.max(u - 0.012, 0), b = Math.min(u + 0.012, 1); return clamp(Math.pow((T1 - T0) * (b - a) / Math.max(clockOf(b) - clockOf(a), 1e-3), 0.85), 0.62, 1.75); };
    return {
      scene, path, duration: 46.5,
      pace: paceOf,
      camera: { fov: 50, near: 0.3, far: 5000, lookAhead: 30, sway: 0.3, bank: 0.6 },   // a long lens: the Gyre and the living bird fill the frame
      pois: [
        { at: (time, u) => _poi0.set(0, 185 + 55 * smoothstep(0.09, 0.16, u) - 125 * smoothstep(0.165, 0.22, u), 0), from: 0.0, to: 0.3, weight: 0.5 },   // the gaze lifts as the stair grows to half the frame (its top turn stays inside), then drops for the flock
        // u 0.17-0.23: the gaze swings a little to starboard and down to the runners' crest 60 m ahead, so their friezes
        // cross the lower frame at a slant with the stair to the left
        { at: (time, u) => { path.pointAt(u, _poi9); const z = _poi9.z - 60; return _poi9.set(crestX(z), 46, z); }, from: 0.165, to: 0.235, weight: 0.55, fade: 0.35 },
        { at: flockAim, from: 0.2, to: 0.3, weight: 0.6, fade: 0.4 },                                           // up to the flock wheeling across the bow
        { at: (time, u) => climbAim(_poi2, u, -14), from: 0.27, to: 0.58, weight: 0.62 },
        { at: (time, u) => climbAim(_poi6, u, 4), from: 0.28, to: 0.41, weight: 0.55, fade: 0.3 },
        // the living bird, four times over (a steady camera takes a third of each weight and the route runs at right
        // angles to the gaze): centred for the pass abeam, then the aim slides half way to the ring and drops, so the wide
        // leg frames bird, ring and the lower turn of the stair together, and comes to rest on the ring for the last straight
        { at: (time, u) => birdAim(_poi, u), from: 0.63, to: 0.97, weight: 0.86, fade: 0.25 },
        { at: (time, u) => birdAim(_poi3, u), from: 0.655, to: 0.95, weight: 0.9, fade: 0.2 },
        { at: (time, u) => birdAim(_poi4, u), from: 0.655, to: 0.94, weight: 0.9, fade: 0.2 },
        { at: (time, u) => birdAim(_poi5, u), from: 0.66, to: 0.94, weight: 0.9, fade: 0.2 },
        { at: (time, u) => birdAim(_poi7, u), from: 0.665, to: 0.92, weight: 0.9, fade: 0.2 },
        { at: (time, u) => birdAim(_poi8, u), from: 0.665, to: 0.92, weight: 0.9, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: mood.ring, glow: 0.6, revealDistance: 500 },
      post: { exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 4 }, grade: { saturation: 1.1, contrast: 1.05, vignette: 0.1, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        // world clock: T(u), plus slack that grows while the camera is held still so nothing ever freezes
        const base = clockOf(u);
        if (prevTime !== null) {
          const dT = time - prevTime, dU = u - prevU;
          if (dT < 0 || dT > 20 || Math.abs(dU) > 0.03) slack = 0;
          else if (dU <= 1e-7) slack = Math.min(slack + dT * Math.max(0.15, 1 - slack / 8), 10);   // held still (or seen through a portal): eases off, never stops dead
          else slack = Math.max(0, slack - 0.5 * dT);                                              // flying again: the bird idles at half speed until the clocks agree
        }
        prevTime = time; prevU = u; wt = base + slack;
        hero.setClock(wt); hero.update(dt, time, camera);
        if (second) { second.setClock(wt); second.update(dt, time, camera); }
        sky.update(time);
        uTime.value = time; uWt.value = wt; uGrow.value = smoothstep(0.05, 0.13, u) * (1 - smoothstep(0.34, 0.4, u));
        ctx.renderer.getDrawingBufferSize(_size); shared.uPx.value = _size.y * 0.5 * camera.projectionMatrix.elements[5];
        for (const f of updaters) f(dt, time, camera, u, wt);
      },
      dispose() { hero.dispose(); if (second) second.dispose(); },
    };
  },
};
const _poi9 = new THREE.Vector3(), _poi4 = new THREE.Vector3(), _poi5 = new THREE.Vector3(), _poi6 = new THREE.Vector3(), _seatLow = new THREE.Vector3(), _poi7 = new THREE.Vector3(), _poi8 = new THREE.Vector3();
const _poi = new THREE.Vector3(), _poi0 = new THREE.Vector3(), _poi2 = new THREE.Vector3(), _poi3 = new THREE.Vector3(), _size = new THREE.Vector2();
