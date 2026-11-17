// THE SHAKEN GLOBE: hero set piece. "The carousel in the eye of the blizzard."
//
// A blue-and-white porcelain music-box carousel on an island in a ring pond of clear ice, the brass
// music-box cylinder and steel comb turning under the ice, a toroidal glitter vortex around it and the
// silver air bubble (the exit portal's seat) pressed against the top of the globe.
//
//   LOCAL SPACE  origin = centre of the pond at ice level (y = 0), +Y up, front (chapel door, comb) = +Z,
//                which is also the window / sun side of the brief.
//   SIZE         carousel + pond + snow bank: radius 36.5 m, spire tip at y = 40 m.
//                Flake vortex: radius ~76 m, y 0..74 m. Air bubble: 18 m across on the dome (centre
//                (0,20,0), radius 80) 25 degrees off the zenith toward -Z by default.
//                The mechanism pit goes down to y = -15: world terrain needs a hole of radius 23.2 m
//                (or simply stop terrain at the bank, r < 36 m; the bank's outer edge is at y ~ -0.6).
//   COST         ~122k triangles (48k of them the 24k flakes), 9 draw calls, no lights, one 1024x512
//                canvas texture, no render targets. Build ~200 ms warm (up to ~450 ms cold on the shared test box).
//   LIGHTING     Self-lit: every material is a custom ShaderMaterial that ignores scene lights and uses
//                its own sun / sky / bounce uniforms (defaults = the brief: pale-gold sun from +Z, 22
//                degrees up, blue sky fill, white sill bounce). Call hero.setSun(dirWorld, colorHex) to
//                change it. Scene fog (Fog or FogExp2) is honoured. Surfaces peak around 0.85; only the
//                sun glint on glaze, gilt, glass stars, mylar flakes and the bubble rim go HDR (3..8).
//
//   opts  palette   [white, paleBlue, skyBlue, cobalt, pineGreen, paleGold, red] hex strings (brief default)
//         flakes    number of flakes (default 24000; brief allows 40000, weak GPUs 15000)
//         duration  seconds the world lasts, used by setProgress (default 40)
//         bubble    false to leave the air bubble out
//         bubbleDir THREE.Vector3 from the dome centre to the bubble (default 25 deg off zenith toward -Z)
//         bubblesAt [[x, z], ...] extra clusters of small bubbles rising from those spots
//   hero.uniforms.uCaK (caustic gain on glaze, default 1), uTsTop (0..1, how much of the fake tilt-shift the top of the frame keeps).
//   Pines: a material made with kit.mat(vert, kit.GLAZE_FRAG, { defines: { PINE: '' } }) must write varying vec4 vBr
//   (local x, local z, 0 trunk .. 1 rim, tier index or -1) and gets bristles and a white glaze lip painted from it.
//   The mirror under the bubble shows a stylised rosette of the village (village() in BUBBLE_FRAG), magnified 2.3x.
//
//   hero.setProgress(u)   u = 0..1 along the world's path. Drives the three acts of the vortex
//                         (streaks -> spiral galaxy -> calm snowfall, swirl strength s = exp(-40u/11)).
//                         Until it is first called the piece idles in the spiral act and drifts with time.
//   hero.setSun(dir, hex) sun direction (world space, toward the sun) and colour.
//   hero.setBubbleDir(v)  slide the bubble over the dome (unit vector from the dome centre, local space);
//                         anchors.portalSeat is recomputed. Use it for the opening tilt.
//   hero.uniforms.uOpen   radius (m) of the iris hole in the bubble's mirror underside (0 = closed; the world opens it to
//                         ~5.7 on approach so the portal, seated 0.5 m behind the mirror, shows through). uEntry (0..1) calms
//                         the flakes for the entry view and clears a tube from the eye to uAim (the spire).
//   hero.parts            { platform, crown, cylinder, skaters, flakes, bubble, ice } Object3Ds; hero.uniforms = shared uniforms.
//
//   anchors (all local space)
//     portalSeat  { position, normal, direction, radius: 7 }  centre of the bubble's meniscus ring; `direction`
//                 is the way the camera should be travelling when it arrives (65 degrees up), normal = -direction.
//     finalLine   { from, to }  straight run into the portal along `direction` (36 m, clear of everything).
//     (the world flies its own, closer helix: two turns at r 18.5 -> 13 and a 39 m straight run; flyThrough is the roomier default)
//     flyThrough  ordered Vector3 list: one level orbit at r = 18, y = 13 beside the reindeer, a 1.5 turn helix (r 18 -> 17 -> 7) up
//                 past the canopy, geese and stars, over the spire tip, then finalLine. >= 6 m from all solids
//                 (flakes are not solids). Canopy eave is r = 11.6 at y = 17.5; geese reach r = 10.6 at y 27..32.
//     viewpoints  { front, ice, reindeer, crown } nice camera positions (look at `center`).
//     pond        { inner: 8.3, outer: 23.1, y: 0 }   bank { radius: 36.5 }   eyeRadius 8
//     tiers       { skaters: 0, platform: 10, canopy: 17.5, crown: 26.5, tip: 40 } heights
//     stars       { count: 12, radius, y, spin } the hanging glass stars (for sun spots on the village)
//     dome        { center, radius: 80 }   bubble { center, radius: 9 }
//
//   STYLE (for the world coder to match): thick white enamel = vertex colour (white, pooled pale blue in
//   creases) x a wrapped sun term + sky/bounce ambient, plus a clearcoat: Fresnel reflection of a tiny
//   procedural room (sky gradient + one window-shaped highlight around the sun) and one hard sun glint.
//   Cobalt brushwork comes from a 4-row canvas atlas (vines, scallops, lattice, sprigs) drawn with stamped
//   wobbly strokes, sampled by uv (uv.y < 0 = unpainted). Gilt = metal branch of the same shader.
//   Geometry is lathe-turned with a low-frequency vertex wobble so nothing looks machined. The caustic net
//   is a two-octave animated Voronoi projected along the sun. See GLAZE_FRAG / makeBrushAtlas / wobble().
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DEFAULT_PALETTE = ['#f7f4ee', '#cfe4f5', '#8fb8e6', '#2f5fb3', '#1f5a4a', '#ffe2a0', '#d6263a'];
const TAU = Math.PI * 2;
const M4 = () => new THREE.Matrix4();
const _c = new THREE.Color();

// ---------- geometry helpers ----------
// Gives a geometry the attributes every glaze mesh shares and bakes a transform.
//   o.col  THREE.Color or (x,y,z,u,v,out)=>void     o.mat 0 glaze | 1 metal | 2 glass
//   o.amp / o.phase / o.kind  vertex animation (0 bob, 1 flap, 2 tine shiver, 3 swing); amp may be (x,y,z)=>n
//   o.row  brush atlas row (0 vine, 1 scallop, 2 lattice, 3 sprigs), o.rep / o.vrep repeats; o.flat facets
function prep(geo, o = {}) {
  const pos = geo.attributes.position, n = pos.count, uv = geo.attributes.uv;
  const col = new Float32Array(n * 3), fx = new Float32Array(n * 4), uvo = new Float32Array(n * 2);
  const fn = typeof o.col === 'function', af = typeof o.amp === 'function';
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), u = uv ? uv.getX(i) : 0, v = uv ? uv.getY(i) : 0;
    if (fn) o.col(x, y, z, u, v, _c); else _c.copy(o.col);
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
    fx[i * 4] = o.mat || 0; fx[i * 4 + 1] = af ? o.amp(x, y, z) : (o.amp || 0); fx[i * 4 + 2] = o.phase || 0; fx[i * 4 + 3] = o.kind || 0;
    if (o.row != null) {
      uvo[i * 2] = u * (o.rep || 1); uvo[i * 2 + 1] = o.row * 16 + Math.min(15.99, v * (o.vrep || 1));    // row and repeats, unwrapped in the shader
    } else { uvo[i * 2] = 0; uvo[i * 2 + 1] = -1; }
  }
  for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
  geo.setAttribute('uv', new THREE.BufferAttribute(uvo, 2));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aFx', new THREE.BufferAttribute(fx, 4));
  if (o.m) geo.applyMatrix4(o.m);
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (o.flat) g.computeVertexNormals();
  return g;
}
const place = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1, sy = s, sz = s) =>
  M4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, sy, sz));
// lathe from [[r,y],...]
const lathe = (pts, seg = 32) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 0.0001), p[1])), seg);
// crease amount (0..1) along a lathe profile: concave corners collect glaze
function creases(pts) {
  const out = pts.map(() => 0);
  for (let i = 1; i < pts.length - 1; i++) {
    const ax = pts[i][0] - pts[i - 1][0], ay = pts[i][1] - pts[i - 1][1], bx = pts[i + 1][0] - pts[i][0], by = pts[i + 1][1] - pts[i][1];
    const cr = (ax * by - ay * bx) / (Math.hypot(ax, ay) * Math.hypot(bx, by) + 1e-6);
    out[i] = Math.min(1, Math.max(0, cr * 1.4));
  }
  return out;
}
// lathe with pooled-glaze colour: base colour darkens toward `pool` in concave corners
function glazedLathe(pts, seg, base, pool, o = {}) {
  const cr = creases(pts), n = pts.length - 1, tmp = new THREE.Color(), lg = lathe(pts, seg);
  if (o.pre) o.pre(lg);
  return prep(lg, {
    ...o, col: (x, y, z, u, v, out) => {
      const f = v * n, i = Math.min(n - 1, Math.floor(f)), k = cr[i] + (cr[i + 1] - cr[i]) * (f - i);
      if (o.tint) { o.tint(x, y, z, u, v, tmp); out.copy(tmp); } else out.copy(base);
      out.lerp(pool, k * 0.85);
    },
  });
}
// low-frequency wobble so nothing looks machined (continuous field: seams stay closed)
function wobble(geo, noise, amp, freq = 0.33) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setXYZ(i, x + Math.sin(y * freq * 2.3 + z * freq * 1.7 + 1.3) * amp, y + Math.sin(x * freq * 1.9 - z * freq * 2.1) * amp * 0.6, z + Math.sin(x * freq * 2.2 + y * freq * 1.6 + 4.0) * amp);
  }
  return geo;
}
// Replicates a prepped (non-indexed) template under several matrices in one pass; patch(out, vertsPerInstance)
// may then rewrite per-instance attributes (animation phase and the like).
function instances(tpl, mats, patch) {
  const n = tpl.attributes.position.count, out = new THREE.BufferGeometry(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const name of Object.keys(tpl.attributes)) {
    const src = tpl.attributes[name], sz = src.itemSize, arr = new Float32Array(n * sz * mats.length), isP = name === 'position', isN = name === 'normal';
    for (let i = 0; i < mats.length; i++) {
      const off = i * n * sz;
      if (isP || isN) {
        if (isN) nm.getNormalMatrix(mats[i]);
        for (let k = 0; k < n; k++) {
          v.fromBufferAttribute(src, k); if (isN) v.applyMatrix3(nm).normalize(); else v.applyMatrix4(mats[i]);
          arr[off + k * 3] = v.x; arr[off + k * 3 + 1] = v.y; arr[off + k * 3 + 2] = v.z;
        }
      } else arr.set(src.array, off);
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, sz));
  }
  if (patch) patch(out, n);
  return out;
}
function tube(points, radius, tubular = 6, radial = 5) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), tubular, radius, radial, false);
}

// ---------- brush atlas: cobalt brushwork masks, 4 rows of 128 px, each tileable in U ----------
function* makeBrushAtlas(rng) {      // a generator: it yields after each row so the build can hand the frame back
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round';
  const tile = document.createElement('canvas'); tile.width = 256; tile.height = 128; const t = tile.getContext('2d');
  // a stamped stroke through 3 points with pressure: thick in the middle, a dry tail
  const dab = (x0, y0, x1, y1, x2, y2, w0, w1) => {
    for (let i = 0; i <= 22; i++) {
      const s = i / 22, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s;
      const r = (w0 + (w1 - w0) * s) * (0.55 + 0.6 * Math.sin(s * Math.PI));
      t.globalAlpha = 0.7 + 0.3 * rng(); t.beginPath(); t.arc(a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2, Math.max(0.8, r), 0, TAU); t.fill();
    }
  };
  const border = (y, w) => { for (let x = 0; x < 256; x += 2) { t.globalAlpha = 0.75 + 0.25 * rng(); t.beginPath(); t.arc(x, y + Math.sin(x * TAU / 64) * 0.8, w * (0.8 + 0.3 * Math.sin(x * TAU / 128)), 0, TAU); t.fill(); } };
  const begin = () => { t.globalAlpha = 1; t.fillStyle = '#000'; t.fillRect(0, 0, 256, 128); t.fillStyle = '#fff'; t.strokeStyle = '#fff'; t.lineCap = 'round'; };
  const end = (row) => { g.globalAlpha = 1; for (let k = 0; k < 4; k++) g.drawImage(tile, k * 256, row * 128); };
  yield;
  // row 0: scrolling vine with leaves and curls
  begin(); border(9, 3.2); border(119, 3.2); border(17, 1.2); border(111, 1.2);
  for (let x = 0; x < 256; x += 2) { t.globalAlpha = 0.9; t.beginPath(); t.arc(x, 64 + 24 * Math.sin(x * TAU / 256), 2.6 + Math.sin(x * 0.2) * 0.6, 0, TAU); t.fill(); }
  for (let k = 0; k < 8; k++) {
    const x = 16 + k * 32, y = 64 + 24 * Math.sin(x * TAU / 256), up = k % 2 ? 1 : -1, l = 20 + rng() * 8;
    dab(x, y, x + 8, y - up * l * 0.7, x + 20 + rng() * 6, y - up * l, 3.5, 9.5);
    dab(x, y, x - 7, y + up * l * 0.5, x - 16, y + up * l * 0.85, 3, 7);
    t.globalAlpha = 0.9; t.beginPath(); t.arc(x + 12, y + up * 15, 3.2, 0, TAU); t.fill();
  }
  end(0);
  yield;
  // row 1: scallops (roof tiles, feathers)
  begin(); t.lineWidth = 5;
  for (let j = 0; j < 5; j++) for (let k = -1; k < 5; k++) {
    const cx = k * 64 + (j % 2) * 32 + 32, cy = j * 30 - 6;
    t.globalAlpha = 0.8 + 0.2 * rng(); t.lineWidth = 4 + rng() * 2.5; t.beginPath(); t.arc(cx, cy, 30, 0.12, Math.PI - 0.12); t.stroke();
    t.lineWidth = 2; t.globalAlpha = 0.7; t.beginPath(); t.moveTo(cx, cy + 12); t.lineTo(cx, cy + 22); t.stroke();
  }
  end(1);
  yield;
  // row 2: lattice with dots
  begin(); border(8, 3.5); border(120, 3.5); t.lineWidth = 3;
  for (let k = -4; k < 12; k++) {
    t.globalAlpha = 0.75 + 0.25 * rng(); t.lineWidth = 2.4 + rng() * 1.4;
    t.beginPath(); t.moveTo(k * 32, 16); t.lineTo(k * 32 + 96, 112); t.stroke();
    t.beginPath(); t.moveTo(k * 32 + 96, 16); t.lineTo(k * 32, 112); t.stroke();
  }
  for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++) { t.globalAlpha = 0.95; t.beginPath(); t.arc(k * 32 + 16 + (j % 2) * 16 - 8, 32 + j * 32, 3.6, 0, TAU); t.fill(); }
  end(2);
  yield;
  // row 3: flower sprigs
  begin();
  for (let f = 0; f < 2; f++) {
    const cx = 64 + f * 128, cy = f ? 74 : 54;
    for (let p = 0; p < 6; p++) { const a = p * TAU / 6 + f * 0.5, r = 19; dab(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, cx + Math.cos(a + 0.3) * r * 0.6, cy + Math.sin(a + 0.3) * r * 0.6, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 6.5); }
    t.globalAlpha = 1; t.fillStyle = '#000'; t.beginPath(); t.arc(cx, cy, 3.4, 0, TAU); t.fill(); t.fillStyle = '#fff';
    const d = f ? -1 : 1;
    dab(cx, cy + d * 22, cx + 18, cy + d * 34, cx + 40, cy + d * 30, 1.8, 5); dab(cx, cy + d * 22, cx - 18, cy + d * 36, cx - 38, cy + d * 28, 1.8, 5);
    dab(cx, cy + d * 20, cx + 2, cy + d * 36, cx - 4, cy + d * 46, 1.6, 2.2);
    for (let k = 0; k < 5; k++) { t.globalAlpha = 0.9; t.beginPath(); t.arc(cx + 44 + (k % 2) * 10 - 64 * (k > 2), cy - d * (14 + k * 7), 2.6, 0, TAU); t.fill(); }
  }
  end(3);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4;
  return tex;
}

// ---------- the porcelain shader ----------
const GLSL_COMMON = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uHorizon;
  uniform float uTime, uCrown;
  vec2 hash22(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
  // the room reflected in the clearcoat: sky gradient, white sill below, one tall window around the sun
  vec3 roomEnv(vec3 r){
    vec3 c = mix(uHorizon, uSkyCol, smoothstep(0.0, 0.75, r.y));
    c = mix(c, uBounce * 0.7, smoothstep(0.02, -0.35, r.y));
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), uSunDir)), up = cross(uSunDir, rt);
    float z = dot(r, uSunDir);
    vec2 q = vec2(dot(r, rt), dot(r, up)) / max(z, 0.05);
    float pane = smoothstep(0.62, 0.5, abs(q.x)) * smoothstep(-0.42, -0.3, q.y) * smoothstep(0.95, 0.8, q.y) * step(0.0, z);
    pane *= 0.35 + 0.65 * smoothstep(0.03, 0.07, abs(q.x)) * smoothstep(0.03, 0.07, abs(q.y - 0.28));
    return c + uSunCol * pane * 1.5;
  }
  float vor(vec2 p){
    vec2 i = floor(p), f = fract(p); float d1 = 1.5, d2 = 1.5;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y)); vec2 o = 0.5 + 0.42 * sin(uTime * 0.7 + 6.2831 * hash22(i + g));
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return d2 - d1;
  }
  // caustic net: bright where cells meet, two octaves drifting against each other
  float caustic(vec2 p){
    float a = vor(p * 0.19 + vec2(uTime * 0.03, 0.0)), b = vor(p * 0.37 - vec2(0.0, uTime * 0.05) + 9.0);
    return pow(1.0 - min(a * 1.5, 1.0), 5.0) * 1.3 + pow(1.0 - min(b * 1.5, 1.0), 5.0) * 0.7;
  }
  // sun spots thrown by the 12 glass stars of the crown: one soft disc per 30 degree sector, sweeping with the crown
  float sunSpots(vec2 p){
    float r = length(p), s = (atan(p.x, p.y + 1e-4) - uCrown * 0.35) * 1.9098593, i = floor(s), f = (fract(s) - 0.5) * 0.5236;
    float h = fract(sin(mod(i, 12.0) * 127.1 + 3.3) * 43758.5453), rad = 1.6 + 1.5 * h;
    float l = length(vec2(r * sin(f), r * cos(f) - 34.0 - 30.0 * h));
    return smoothstep(rad, rad * 0.5, l) * (0.75 + 0.25 * sin(uTime * 5.0 + h * 40.0));
  }
`;
const GLAZE_VERT = /* glsl */`
  attribute vec3 aCol; attribute vec4 aFx;
  #ifdef ORBIT
  attribute vec4 aOrb;   // radius, start angle, angular velocity, weave phase
  #endif
  uniform float uTime;
  varying vec3 vCol, vN, vW; varying vec2 vUv, vYW; varying float vMat;
  #include <fog_pars_vertex>
  void main(){
    vec3 p = position, n = normal; float k = aFx.w;
    if (k < 0.5) p.y += aFx.y * sin(uTime * 1.5708 + aFx.z);
    else if (k < 1.5) p.y += aFx.y * sin(uTime * 4.2 + aFx.z);
    else if (k < 2.5) { float ph = fract(uTime * 0.8 + aFx.z); p.y += aFx.y * sin(uTime * 47.0 + aFx.z * 9.0) * exp(-ph * 4.5); }
    else p.x += aFx.y * sin(uTime * 1.2 + aFx.z);
    #ifdef ORBIT
      float ang = aOrb.y + aOrb.z * uTime;
      float wv = sin(ang * 3.0 + aOrb.w);
      float r = aOrb.x + 1.9 * wv;
      float yaw = ang + 1.5708 + (aOrb.z < 0.0 ? 3.14159 : 0.0) - 0.35 * cos(ang * 3.0 + aOrb.w) * sign(aOrb.z);
      float cy = cos(yaw), sy = sin(yaw);
      p.x += p.y * 0.1 * wv;                                  // lean into the weave
      p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
      n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
      p.xz += vec2(sin(ang), cos(ang)) * r;
    #endif
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vCol = aCol; vUv = uv; vMat = aFx.x;
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition; vYW = gl_Position.yw;
    #include <fog_vertex>
  }
`;
const GLAZE_FRAG = /* glsl */`
  uniform vec3 uCobalt, uDeep, uWarm, uTarget; uniform sampler2D uBrush; uniform float uBaseY, uCaK, uTsTop, uGlow;
  varying vec3 vCol, vN, vW; varying vec2 vUv, vYW; varying float vMat;
  #ifdef PINE
  varying vec4 vBr;      // local x, local z, 0 (trunk side) .. 1 (rim) along the tier, tier index (-1 = not a tier)
  #endif
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  void main(){
    vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
    if (dot(N, V) < 0.0) N = -N;
    vec3 L = uSunDir, R = reflect(-V, N);
    float ndl = dot(N, L), ndv = max(dot(N, V), 0.0);
    // fake tilt-shift: the top and bottom fifths of the frame lose their fine detail and sink into the haze
    float ts = smoothstep(0.56, 1.0, abs(vYW.x / max(vYW.y, 1e-3))) * mix(1.0, uTsTop, step(0.0, vYW.x));
    float ca = caustic(vW.xz - L.xz / max(L.y, 0.2) * vW.y) * (1.0 - 0.75 * ts);
    float dif = smoothstep(-0.25, 1.0, ndl);
    // (polish) value: a cooler, lower ambient so the shade is a clear blue and the sunlit side a clean white,
    // and the carousel's own lamps: a warm glow from under the canopy that falls on the deck, the ice and the near snow
    vec3 amb = mix(uBounce * 0.2 + uSkyCol * 0.08, uSkyCol * vec3(0.37, 0.48, 0.66), N.y * 0.5 + 0.5);
    vec3 sun = uSunCol * dif * dif * (0.86 + 0.6 * uCaK * ca * smoothstep(-0.1, 0.5, ndl));
    {
      vec3 lv = vec3(0.0, uBaseY + 15.0, 0.0) - vW; float ld = length(lv);
      float lk = 1.0 / (1.0 + ld * ld * 0.0034);
      amb += uWarm * lk * (0.35 + 0.65 * max(dot(N, lv / max(ld, 1e-3)), 0.0)) * smoothstep(52.0, 16.0, ld);
      lv = uTarget - vW; ld = length(lv);                    // and the mirror's own warm light on whatever rises toward it
      amb += uWarm * (1.1 / (1.0 + ld * ld * 0.01)) * (0.3 + 0.7 * max(dot(N, lv / max(ld, 1e-3)), 0.0)) * smoothstep(34.0, 8.0, ld);
    }
    sun += mix(uSunCol, vec3(1.0), 0.3) * 1.25 * sunSpots(vW.xz) * smoothstep(-0.1, 0.45, N.y) * (1.0 - 0.5 * ts);
    vec3 base = vCol, col;
    #ifdef PINE
    if (vBr.w > -0.5) {      // bottle-brush bristles: twisted radial strokes, a thick serrated lip of white glaze on each tier
      float ang = atan(vBr.x, vBr.y + 1e-5), near = smoothstep(150.0, 60.0, length(cameraPosition - vW)) * (1.0 - 0.6 * ts);
      float st = sin(ang * 13.0 + vBr.z * 5.0 + vBr.w * 1.9), st2 = sin(ang * 29.0 - vBr.z * 9.0 + vBr.w * 4.1);
      float br = smoothstep(-0.3, 0.5, st) * (0.78 + 0.22 * smoothstep(-0.2, 0.6, st2));
      base *= mix(1.0, 0.6 + 0.52 * br, near);
      base *= 0.56 + 0.44 * smoothstep(0.08, 0.72, vBr.z);                                    // dark in toward the wire trunk, under the tier above
      float lipAt = 0.8 - 0.03 * vBr.w;                                                         // the upper tiers carry more glaze, the top one a cap
      float gl = smoothstep(lipAt, lipAt + 0.08, vBr.z + (0.06 * st + 0.035 * st2) * near);
      if (vBr.w > 4.5) gl = max(gl, smoothstep(0.3, 0.18, vBr.z + 0.06 * st * near));       // and a cap of glaze on the very tip
      base = mix(base, vec3(0.8, 0.79, 0.76) * (0.93 + 0.07 * br), gl * 0.97);
    }
    #endif
    float rdl = max(dot(R, L), 0.0);
    if (vMat < 0.5) {
      if (vUv.y >= 0.0) {
        float row = floor(vUv.y / 16.0), vv = fract(vUv.y - row * 16.0);
        float m = texture2D(uBrush, vec2(vUv.x, 1.0 - (row + 0.05 + 0.9 * (1.0 - vv)) * 0.25)).r; m = mix(m, 0.3, ts * 0.3); base = mix(base, uCobalt * (0.62 + 0.42 * hash22(floor(vUv * 37.0)).x), m * 0.96); }
      float fr = 0.045 + 0.95 * pow(1.0 - ndv, 5.0);
      col = base * (amb + sun) * (1.0 - fr * 0.45) + roomEnv(R) * (fr * 0.62 + 0.045);
      col += uSunCol * (pow(rdl, 900.0) * 7.0 * (1.0 - 0.8 * ts) + pow(rdl, 60.0) * (0.12 + 0.3 * ts));
    } else if (vMat < 1.5) {
      vec3 e = roomEnv(R);
      col = base * (e * 0.75 + amb * 0.5 + sun * 0.7 + uWarm * 0.12) * (0.5 + 0.5 * smoothstep(-0.3, 0.85, N.y)) + base * uSunCol * (pow(rdl, 140.0) * 6.0 + pow(rdl, 12.0) * 0.7);
    } else {
      vec3 e = roomEnv(R) + roomEnv(refract(-V, N, 0.75)) * 0.6;
      float tw = 0.6 + 0.4 * sin(uTime * 3.0 + vW.x * 2.0 + vW.y * 3.0);
      col = base * e * 0.7 + uSunCol * (pow(rdl, 50.0) * 8.0 * tw + pow(1.0 - ndv, 3.0) * 0.5);
    }
    {   // the carousel's own shade: blue under the canopy, deepest toward the axis, and under the deck's soffit
      float ry = vW.y - uBaseY, rc = length(vW.xz);
      float inC = smoothstep(12.4, 9.6, rc) * smoothstep(10.1, 11.6, ry) * smoothstep(24.6, 23.0, ry) * mix(smoothstep(0.1, -0.25, N.y), 1.0, smoothstep(17.7, 16.5, ry));
      float ao = inC * (0.14 + 0.3 * smoothstep(11.6, 3.0, rc) + 0.24 * smoothstep(12.5, 18.0, ry));
      ao += smoothstep(11.7, 10.6, rc) * smoothstep(9.75, 9.3, ry) * smoothstep(8.2, 8.6, ry) * smoothstep(0.0, -0.3, N.y) * (0.16 + 0.26 * smoothstep(11.0, 3.0, rc));
      col *= mix(vec3(1.0), vec3(0.46, 0.6, 0.92), min(ao, 0.75));
      // (polish 3) the ring of bulbs under the deck's rim (10.5 m from the axis): their glow on the deck's underside round them,
      // in the lamps' own colour and as strong as the bulbs burn; a glow added over the glaze, the same at every clock
      col += uWarm * (0.065 * uGlow) * smoothstep(9.75, 9.3, ry) * smoothstep(8.2, 8.6, ry) * smoothstep(0.0, -0.3, N.y) * exp(-(rc - 10.5) * (rc - 10.5) * 0.3);
    }
    float deep = smoothstep(0.0, -13.0, vW.y - uBaseY);       // sunk in the pit under the ice
    col = mix(col, col * uDeep * 1.6 + uDeep * 0.08, deep * 0.85);
    col = mix(col, uHorizon * 0.8, ts * 0.07);
    if (vMat > 2.5) col = vCol * uGlow * (0.86 + 0.14 * sin(uTime * 2.3 + vW.x * 1.7 + vW.z * 2.3));      // lit windows, lamps and bulbs: their own light
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

// ---------- static porcelain: pit, snow bank, island, chapel, spire, comb ----------
function archShape(w, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0);
  return s;
}
function starGeo(points, len, wid) {     // stellated glass / gilt star: long spikes on the axes, short ones between
  const out = [], dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  if (points > 6) for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) dirs.push([a, b, c]);
  const up = new THREE.Vector3(0, 1, 0);
  dirs.forEach((d, i) => {
    const l = i < 6 ? len * (i === 3 ? 1.35 : 1) : len * 0.55, g = new THREE.ConeGeometry(wid * (i < 6 ? 1 : 0.8), l, 4, 1, true);
    g.translate(0, l / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(d[0], d[1], d[2]).normalize()));
    out.push(g);
  });
  return mergeGeometries(out);
}

function* buildStatic(K) {
  const { rng, noise, C } = K, G = [], tmp = new THREE.Color();
  // the pit under the ice
  G.push(glazedLathe([[0.01, -15], [20.5, -15], [22.6, -13.8], [23.25, -11], [23.25, -0.3]], 64, C.basin, C.deep, { row: 2, rep: 20 }));
  yield G.splice(0);
  // snow bank with soft hills
  const hill = (x, z) => { const r = Math.hypot(x, z); return (noise.fbm2(x * 0.085 + 3, z * 0.085, 3) * 1.25 + 0.55) * THREE.MathUtils.smoothstep(r, 23.6, 28) * (1 - THREE.MathUtils.smoothstep(r, 30.5, 36.5)); };
  G.push(glazedLathe([[23.1, -0.4], [23.3, 0.4], [23.9, 0.95], [25.4, 1.35], [27.5, 1.5], [30, 1.2], [32.5, 0.7], [34.8, 0.1], [36.5, -0.7], [35.5, -3.5], [24.5, -16]], 96, C.white, C.pool, {
    pre: (g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + hill(p.getX(i), p.getZ(i))); g.computeVertexNormals(); },
    tint: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, THREE.MathUtils.clamp(0.42 - hill(x, z) * 0.3 + noise.n2(x * 0.3, z * 0.3) * 0.12, 0, 0.7)),
  }));
  yield G.splice(0);
  // island
  G.push(glazedLathe([[8.75, -0.5], [8.65, 0.3], [8.2, 0.8], [7.0, 1.3], [5.6, 1.72], [4.4, 1.9]], 48, C.white, C.pool));
  yield G.splice(0);
  const rail = new THREE.TorusGeometry(7.7, 0.075, 5, 72); rail.rotateX(Math.PI / 2); rail.translate(0, 2.18, 0); G.push(prep(rail, { col: C.gold, mat: 1 }));
  yield G.splice(0);
  const post = [[0.2, 0], [0.24, 0.1], [0.13, 0.3], [0.21, 0.62], [0.1, 0.95], [0.16, 1.05], [0.18, 1.14], [0.02, 1.24]];
  const postM = []; for (let i = 0; i < 18; i++) { const a = (i + 0.5) / 18 * TAU; postM.push(place(Math.sin(a) * 7.7, 1.0, Math.cos(a) * 7.7)); }
  G.push(instances(mergeGeometries([glazedLathe(post, 7, C.white, C.pool), prep(new THREE.SphereGeometry(0.15, 7, 5), { col: C.gold, mat: 1, m: place(0, 1.3, 0) })]), postM));
  yield G.splice(0);
  // chapel drum under the carousel
  G.push(glazedLathe([[4.4, 1.6], [4.7, 1.9], [4.72, 2.3], [4.35, 2.6], [4.2, 2.9]], 40, C.white, C.pool));
  yield G.splice(0);
  G.push(glazedLathe([[4.2, 2.9], [4.2, 6.4]], 40, C.white, C.pool, { row: K.wallRow, rep: 6 }));
  G.push(glazedLathe([[4.2, 6.4], [4.45, 6.6], [4.75, 6.95], [4.65, 7.3], [3.9, 7.85], [2.7, 8.3], [2.1, 8.7], [2.0, 10.6]], 40, C.white, C.pool));
  const band = new THREE.TorusGeometry(4.72, 0.09, 5, 48); band.rotateX(Math.PI / 2); band.translate(0, 7.02, 0); G.push(prep(band, { col: C.gold, mat: 1 }));
  for (let i = 0; i < 6; i++) {
    yield G.splice(0);
    const a = i / 6 * TAU, door = i === 0, w = door ? 1.7 : 1.05, h = door ? 2.9 : 2.0, y0 = door ? 2.75 : 3.6;
    const ex = new THREE.ExtrudeGeometry(archShape(w, h), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1, curveSegments: 5 });
    G.push(prep(ex, door ? { col: (x, y, z, u, v, out) => out.copy(C.cobalt).lerp(C.deep, 0.55 * (1 - y / h)), m: place(Math.sin(a) * 4.1, y0, Math.cos(a) * 4.1, a) }
      : { col: (x, y, z, u, v, out) => out.copy(C.lamp).multiplyScalar(0.55 + 0.45 * y / h), mat: 3, m: place(Math.sin(a) * 4.1, y0, Math.cos(a) * 4.1, a) }));
    const fr = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * Math.PI; fr.push([Math.cos(t) * w * 0.56, h - w / 2 + Math.sin(t) * w * 0.56, 0.3]); }
    fr.unshift([w * 0.56, 0, 0.3]); fr.push([-w * 0.56, 0, 0.3]);
    G.push(prep(tube(fr, 0.075, 14, 5), { col: C.gold, mat: 1, m: place(Math.sin(a) * 4.1, y0, Math.cos(a) * 4.1, a) }));
    if (door) {   // holly wreath with red berries
      const wr = new THREE.TorusGeometry(0.5, 0.15, 6, 16);
      G.push(prep(wr, { col: (x, y, z, u, v, out) => out.copy(C.green).multiplyScalar(0.7 + 0.5 * Math.abs(Math.sin(u * 40))), m: place(0, y0 + 1.75, 4.1 + 0.36) }));
      for (let k = 0; k < 9; k++) { const b = k / 9 * TAU + rng() * 0.3; G.push(prep(new THREE.SphereGeometry(0.085, 6, 4), { col: C.red, m: place(Math.cos(b) * 0.5, y0 + 1.75 + Math.sin(b) * 0.5, 4.1 + 0.5) })); }
      G.push(prep(new THREE.SphereGeometry(0.09, 6, 4), { col: C.gold, mat: 1, m: place(0.5, y0 + 1.0, 4.1 + 0.3) }));
    }
  }
  yield G.splice(0);
  // the axle: a twisted barber-pole column up through the tiers
  const colPts = []; for (let y = 10.6; y <= 25.61; y += 0.5) { const t = (y - 10.6) / 15; colPts.push([1.75 - 0.6 * t + 0.11 * Math.sin(y * 2.1), y]); }
  const tw = K.twist, flutes = K.flutes, stripe = (x, y, z) => Math.sin(Math.atan2(x, z) * flutes + y * tw);
  G.push(glazedLathe(colPts, 30, C.white, C.pool, {
    pre: (g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = 1 + 0.075 * stripe(x, y, z); p.setX(i, x * s); p.setZ(i, z * s); } g.computeVertexNormals(); },
    tint: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, THREE.MathUtils.smoothstep(stripe(x, y, z), -0.75, -0.35) * 0.92),
  }));
  yield G.splice(0);
  // upper spire: neck, onion bulb with painted scales, finial
  G.push(glazedLathe([[1.15, 25.6], [1.45, 25.95], [1.45, 27.0], [1.05, 27.35], [0.88, 28.6], [0.8, 30.0], [1.02, 30.5]], 20, C.white, C.pool));
  const bh = K.bulb;  // per-seed bulb fatness
  G.push(glazedLathe([[1.02, 30.5], [1.5 * bh, 31.1], [2.0 * bh, 31.9], [2.25 * bh, 32.8], [2.05 * bh, 33.8], [1.45 * bh, 34.6], [0.95, 35.2], [0.72, 35.6]], 28, C.white, C.pool, K.bulbRow === 1
    ? { tint: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, THREE.MathUtils.smoothstep(Math.sin(Math.atan2(x, z) * flutes - y * tw * 2.4), -0.2, 0.2) * 0.94) }
    : { row: K.bulbRow, rep: 8 }));
  yield G.splice(0);
  G.push(glazedLathe([[0.72, 35.6], [0.6, 36.7], [0.9, 37.0], [0.95, 37.25], [0.5, 37.6], [0.34, 38.5]], 16, C.white, C.pool, { tint: (x, y, z, u, v, out) => out.copy(y > 36.9 && y < 37.4 ? C.cobalt : C.white) }));
  for (const [r, y, tr] of [[1.1, 30.45, 0.13], [0.82, 35.55, 0.12], [1.5, 26.5, 0.1], [2.33 * bh, 32.8, 0.07]]) { const t = new THREE.TorusGeometry(r, tr, 6, 28); t.rotateX(Math.PI / 2); t.translate(0, y, 0); G.push(prep(t, { col: C.gold, mat: 1 })); }
  G.push(prep(new THREE.SphereGeometry(0.55, 12, 8), { col: C.gold, mat: 1, m: place(0, 38.85, 0, 0, 0, 0, 1, 1.15, 1) }));
  G.push(prep(starGeo(K.finialPoints, 1.25, 0.24), { col: C.gold, mat: 1, flat: true, m: place(0, 40.3, 0, rng() * 3) }));

  yield G.splice(0);
  // steel comb under the ice (front side), 30 tines that shiver as the pins pluck them
  const tineCol = (x, y, z, u, v, out) => out.copy(C.steel).multiplyScalar(0.8 + 0.3 * noise.n2(x * 6, z * 0.4));
  for (let i = 0; i < 30; i++) {
    const x = -18.1 + i * 1.248, len = 9.0 - i * 0.17 - (i % 2) * 0.12, zt = 4.7;
    const g = new RoundedBoxGeometry(0.92, 0.3, len, 1, 0.08);
    // taper toward the tip (local -Z end) and bake a per-vertex shiver amplitude growing to the tip
    const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const t = 0.5 - p.getZ(k) / len; p.setY(k, p.getY(k) * (1.25 - 0.6 * t)); }
    G.push(prep(g, { col: tineCol, mat: 1, kind: 2, phase: (i * 0.377 + rng() * 0.2) % 1, amp: (px, py, pz) => { const t = 0.5 - pz / len; return 0.2 * t * t; }, m: place(x, -3.0, zt + len / 2) }));
    if (i % 3 === 2) yield G.splice(0);
  }
  // the comb's back plate runs diagonally because the tines shorten; brass screws on it
  const plate = new RoundedBoxGeometry(38.6, 0.7, 3.4, 1, 0.12); plate.rotateY(Math.atan2(4.9, 36.2)); G.push(prep(plate, { col: tineCol, mat: 1, m: place(0, -2.9, 12.3) }));
  for (let i = 0; i < 9; i++) { const x = -17 + i * 4.25; G.push(prep(new THREE.CylinderGeometry(0.42, 0.5, 0.35, 8), { col: C.brass, mat: 1, m: place(x, -2.45, 12.4 - x * 0.135) })); }
  // bearing blocks for the cylinder
  yield G.splice(0);
  for (const s of [-1, 1]) G.push(prep(new RoundedBoxGeometry(2.2, 9, 5, 2, 0.4), { col: C.brass, mat: 1, m: place(s * 21.6, -11, 0) }));
  yield G.splice(0);
}

// the brass music-box cylinder (axis X, built around its own centre)
function* buildCylinder(K) {
  const { rng, noise, C } = K, G = [];
  const body = new THREE.CylinderGeometry(6, 6, 38, 56, 12, false); body.rotateZ(Math.PI / 2);
  G.push(prep(body, { col: (x, y, z, u, v, out) => out.copy(C.brass).multiplyScalar(0.5 + 0.45 * Math.pow(Math.abs(Math.sin((x + 18.1) / 1.248 * Math.PI)), 0.6) + 0.1 * noise.n2(x * 0.8, Math.atan2(y, z) * 2)), mat: 1 }));
  yield G.splice(0);
  const pinM = [], toothM = [];
  for (let i = 0; i < 30; i++) {
    const x = -18.1 + i * 1.248, n = 12 + rng.int(0, 3);
    for (let k = 0; k < n; k++) { const th = (k + rng()) / n * TAU; pinM.push(place(x, Math.cos(th) * 6.45, Math.sin(th) * 6.45, 0, th)); }
  }
  for (let i = 0; i < pinM.length; i += 100) { G.push(instances(prep(new THREE.ConeGeometry(0.3, 1.1, 5, 1, true), { col: C.steel, mat: 1 }), pinM.slice(i, i + 100))); yield G.splice(0); }
  for (const s of [-1, 1]) {
    const fl = lathe([[1.3, 0], [6.9, 0], [7.0, 0.25], [6.9, 0.7], [6.0, 0.8], [1.3, 1.6]], 40); fl.rotateZ(-s * Math.PI / 2);
    G.push(prep(fl, { col: C.brass, mat: 1, m: place(s * 19.0, 0, 0) }));
    for (let k = 0; k < 30; k++) { const th = k / 30 * TAU; toothM.push(place(s * 19.35, Math.cos(th) * 7.2, Math.sin(th) * 7.2, 0, th)); }
  }
  yield G.splice(0);
  G.push(instances(prep(new THREE.BoxGeometry(0.7, 0.9, 0.75), { col: C.brass, mat: 1 }), toothM));
  const axle = new THREE.CylinderGeometry(1.3, 1.3, 43, 14); axle.rotateZ(Math.PI / 2); G.push(prep(axle, { col: C.steel, mat: 1 }));
  yield G.splice(0);
}

// ---------- tier 2: the reindeer platform and its canopy (turns as one) ----------
function reindeer(K) {
  const { rng, C } = K, g = rng.range(0.7, 1.2), bob = { amp: 0.9, phase: 0, kind: 0 }, G = [];
  const P = (geo, o, local) => G.push(prep(geo, { ...o, ...bob, m: local }));
  const body = new THREE.SphereGeometry(1, 14, 10);
  { const p = body.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, p.getY(i) * (1 + 0.14 * z) + 0.05 * z * z); } body.computeVertexNormals(); }
  P(body, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, THREE.MathUtils.clamp(-y * 0.55, 0, 0.6)), row: 3, rep: 3 }, place(0, 0, 0, 0, 0, 0, 0.56, 0.64, 1.3));
  P(new THREE.CylinderGeometry(0.26, 0.42, 1.4, 8), { col: C.white }, place(0, 0.78, 1.0, 0, 0.62));
  P(new THREE.SphereGeometry(1, 10, 8), { col: C.white }, place(0, 1.47, 1.55, 0, 0.28, 0, 0.3, 0.33, 0.5));
  P(new THREE.SphereGeometry(1, 8, 6), { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, 0.35) }, place(0, 1.33, 1.98, 0, 0.3, 0, 0.19, 0.18, 0.27));
  for (const s of [-1, 1]) {
    P(new THREE.ConeGeometry(0.09, 0.34, 5), { col: C.white }, place(s * 0.25, 1.8, 1.33, 0, -0.3, -s * 0.8));
    P(new THREE.SphereGeometry(0.055, 5, 4), { col: C.deep }, place(s * 0.24, 1.56, 1.78));
    // gilt antlers: a main beam and three tines
    P(tube([[s * 0.15, 1.7, 1.42], [s * 0.42, 2.2, 1.22], [s * 0.78, 2.66, 1.2], [s * 0.92, 3.12, 1.48]], 0.07, 6, 5), { col: C.gold, mat: 1 });
    P(tube([[s * 0.42, 2.2, 1.22], [s * 0.46, 2.52, 1.7]], 0.055, 2, 4), { col: C.gold, mat: 1 });
    P(tube([[s * 0.78, 2.66, 1.2], [s * 1.14, 2.94, 0.98]], 0.055, 2, 4), { col: C.gold, mat: 1 });
    P(tube([[s * 0.6, 2.44, 1.2], [s * 0.7, 2.82, 1.62]], 0.05, 2, 4), { col: C.gold, mat: 1 });
    // legs in a gallop: front reaching, hind trailing
    const leg = (hy, hz, a1, a2) => {
      const d1 = [-Math.cos(a1), -Math.sin(a1)], kn = [hy + 0.85 * d1[0], hz + 0.85 * d1[1]], d2 = [-Math.cos(a2), -Math.sin(a2)], ft = [kn[0] + 0.82 * d2[0], kn[1] + 0.82 * d2[1]];
      P(new THREE.CylinderGeometry(0.2, 0.13, 0.9, 6), { col: C.white }, place(s * 0.3, hy + 0.42 * d1[0], hz + 0.42 * d1[1], 0, a1));
      P(new THREE.CylinderGeometry(0.12, 0.08, 0.84, 6), { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, y < -0.1 ? 0.85 : 0) }, place(s * 0.3, kn[0] + 0.41 * d2[0], kn[1] + 0.41 * d2[1], 0, a2));
      P(new THREE.CylinderGeometry(0.1, 0.15, 0.18, 6), { col: C.gold, mat: 1 }, place(s * 0.3, ft[0], ft[1], 0, a2));
    };
    leg(-0.32, 0.82, -0.75 * g + s * 0.12, 0.45 * g);
    leg(-0.28, -0.85, 0.5 * g + s * 0.12, 0.95 * g);
  }
  P(new THREE.SphereGeometry(0.15, 6, 5), { col: C.white }, place(0, 0.3, -1.32));
  const girth = new THREE.TorusGeometry(0.61, 0.055, 5, 16); P(girth, { col: C.gold, mat: 1 }, place(0, 0.02, 0.12, 0, 0, 0, 1, 1.07, 1));
  P(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, 1.2), { col: (x, y, z, u, v, out) => out.copy(C.cobalt).lerp(C.gold, y < 0.42 ? 1 : 0), }, place(0, 0.06, -0.05, 0, 0, 0, 0.6, 0.66, 0.62));
  const collar = new THREE.TorusGeometry(0.39, 0.06, 5, 12); P(collar, { col: C.gold, mat: 1 }, place(0, 0.52, 0.84, 0, -(Math.PI / 2 - 0.62)));
  P(new THREE.SphereGeometry(0.1, 6, 5), { col: C.gold, mat: 1 }, place(0, 0.3, 1.22));
  return mergeGeometries(G);
}

function* buildPlatform(K) {
  const { rng, noise, C } = K, G = [], S = K.scallops;
  // the soffit, painted like the underside of a plate: pale blue gores, scallops, a cobalt band, gilt ribs every 30 degrees
  const gore = (x, z) => THREE.MathUtils.smoothstep(Math.cos(Math.atan2(x, z) * 6), -0.14, 0.14);
  G.push(glazedLathe([[2.25, 8.8], [3.6, 8.62], [6.6, 8.7], [9.6, 8.8], [10.9, 9.15], [11.3, 9.45]], 72, C.white, C.pool, { row: 1, rep: 12, vrep: 3,
    tint: (x, y, z, u, v, out) => { const r = Math.hypot(x, z); out.copy(C.white).lerp(C.sky, 0.7 * gore(x, z)).lerp(C.cobalt, 0.9 * Math.max(THREE.MathUtils.smoothstep(r, 10.2, 10.7), 1 - THREE.MathUtils.smoothstep(r, 3.5, 4.0))); } }));
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU, sx = Math.sin(a), cz = Math.cos(a); G.push(prep(tube([[sx * 3.7, 8.55, cz * 3.7], [sx * 6.6, 8.62, cz * 6.6], [sx * 9.6, 8.72, cz * 9.6], [sx * 10.85, 9.05, cz * 10.85]], 0.065, 4, 5), { col: C.gold, mat: 1 })); }
  { const t = new THREE.TorusGeometry(3.75, 0.08, 5, 36); t.rotateX(Math.PI / 2); t.translate(0, 8.55, 0); G.push(prep(t, { col: C.gold, mat: 1 })); }
  G.push(glazedLathe([[11.3, 9.45], [11.3, 9.92]], 64, C.cobalt, C.deep));
  G.push(glazedLathe([[11.3, 9.92], [11.15, 10.02], [10.9, 10.02]], 64, C.white, C.pool));
  G.push(glazedLathe([[10.9, 10.02], [8.1, 10.02], [5.3, 10.02], [2.6, 10.02]], 64, C.white, C.pool, { row: K.deckRow, rep: 10, vrep: 3 }));
  for (const y of [9.42, 9.95]) { const t = new THREE.TorusGeometry(11.33, 0.1, 5, 72); t.rotateX(Math.PI / 2); t.translate(0, y, 0); G.push(prep(t, { col: C.gold, mat: 1 })); }
  // painted centre drum with gilt rings
  G.push(glazedLathe([[2.6, 10.02], [2.9, 10.2], [2.9, 10.7], [2.6, 11.0]], 28, C.white, C.pool));
  G.push(glazedLathe([[2.6, 11.0], [2.6, 16.2]], 28, C.white, C.pool, { row: 3, rep: 6, vrep: 2 }));
  G.push(glazedLathe([[2.6, 16.2], [2.95, 16.5], [3.3, 17.2], [3.0, 17.9], [2.2, 18.4]], 28, C.white, C.pool));
  for (const y of [10.95, 16.25]) { const t = new THREE.TorusGeometry(2.66, 0.09, 5, 28); t.rotateX(Math.PI / 2); t.translate(0, y, 0); G.push(prep(t, { col: C.gold, mat: 1 })); }
  yield G.splice(0);
  // canopy: an umbrella of gores with a scalloped eave
  const sc = (x, z) => Math.cos(Math.atan2(x, z) * S);
  const cpre = (g) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), c = sc(x, z), k = 1 + 0.04 * c * THREE.MathUtils.smoothstep(r, 2.5, 6);
      p.setXYZ(i, x * k, p.getY(i) - 0.6 * (0.5 + 0.5 * c) * THREE.MathUtils.smoothstep(r, 10.4, 11.6) + 0.22 * c * Math.sin(Math.min(1, (r - 2) / 9.6) * Math.PI), z * k);
    }
    g.computeVertexNormals();
  };
  const canopyPts = [[11.6, 17.5], [11.3, 17.85], [9.6, 18.65], [7.2, 19.6], [4.8, 20.75], [2.9, 22.0], [2.0, 23.1], [1.85, 24.0]];
  if (K.canopyStyle === 0) {
    G.push(glazedLathe(canopyPts, S * 8, C.white, C.pool, { pre: cpre, tint: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, THREE.MathUtils.smoothstep(Math.cos(Math.atan2(x, z) * S / 2), -0.12, 0.12) * 0.94) }));
  } else G.push(glazedLathe(canopyPts, S * 8, C.white, C.pool, { pre: cpre, row: 1, rep: S * 2, vrep: 4, tint: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.sky, 0.7 * THREE.MathUtils.smoothstep(-sc(x, z), 0.1, 0.9)) }));   // glaze pooled pale blue in the creases
  // gilt ribs in the creases between the gores: they show from above and, from under the canopy, against its blue shade
  for (let i = 0; i < S; i++) {
    const a = (2 * i + 1) * Math.PI / S, sx = Math.sin(a), cz = Math.cos(a), rp = [];
    for (const [r, y] of [[11.35, 17.8], [9.6, 18.65], [7.2, 19.6], [4.8, 20.75], [2.9, 22.0]]) { const k = 1 - 0.04 * THREE.MathUtils.smoothstep(r, 2.5, 6); rp.push([sx * r * k, y - 0.22 * Math.sin(Math.min(1, (r - 2) / 9.6) * Math.PI) - 0.02, cz * r * k]); }
    G.push(prep(tube(rp, 0.06, 5, 5), { col: C.gold, mat: 1 }));
  }
  const val = new THREE.CylinderGeometry(11.55, 11.55, 1.15, S * 8, 2, true);
  { const p = val.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.5) p.setY(i, p.getY(i) - 0.5 * (0.5 + 0.5 * sc(p.getX(i), p.getZ(i)))); }
  G.push(prep(val, { col: C.white, row: 2, rep: S * 2, m: place(0, 17.0, 0) }));
  for (let i = 0; i < S; i++) { const a = (2 * i + 1) * Math.PI / S; G.push(prep(new THREE.SphereGeometry(0.24, 8, 6), { col: C.gold, mat: 1, m: place(Math.sin(a) * 11.2, 17.45, Math.cos(a) * 11.2) })); }
  yield G.splice(0);
  {   // (polish) lit bulbs: one on every scallop point of the eave and between, a ring under the canopy over the reindeer, a ring round the drum's head
    const bulb = prep(new THREE.SphereGeometry(0.2, 7, 5), { col: C.lamp, mat: 3 }), BM = [];
    for (let i = 0; i < S * 2; i++) { const a = i * Math.PI / S; BM.push(place(Math.sin(a) * 11.78, 16.72 - (i % 2 ? 0 : 0.42), Math.cos(a) * 11.78, 0, 0, 0, i % 2 ? 0.85 : 1.15)); }
    for (let i = 0; i < S * 2; i++) { const a = (i + 0.5) * Math.PI / S; BM.push(place(Math.sin(a) * 9.7, 17.95, Math.cos(a) * 9.7, 0, 0, 0, 0.9)); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; BM.push(place(Math.sin(a) * 3.45, 17.1, Math.cos(a) * 3.45, 0, 0, 0, 0.9)); }
    // (polish 3) the deck is lit from under as well: a ring of 24 bulbs set in the cobalt band of its underside, two to a gore,
    // between the gilt ribs (24 in all; they turn with the deck)
    for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * TAU; BM.push(place(Math.sin(a) * 10.5, 8.9, Math.cos(a) * 10.5, 0, 0, 0, 0.9)); }
    G.push(instances(bulb, BM)); bulb.dispose();
  }
  yield G.splice(0);
  const tc = new THREE.TorusGeometry(1.95, 0.13, 6, 24); tc.rotateX(Math.PI / 2); tc.translate(0, 24.0, 0); G.push(prep(tc, { col: C.gold, mat: 1 }));
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; G.push(prep(new THREE.ConeGeometry(0.16, 0.7, 5), { col: C.gold, mat: 1, m: place(Math.sin(a) * 1.95, 24.4, Math.cos(a) * 1.95, a, 0.25) })); }
  yield G.splice(0);
  // eight gilt poles and their reindeer
  const red = rng.int(0, 7), deer = [reindeer(K)], deerM = [[], []], deerPh = [[], []];
  yield [];
  deer.push(reindeer(K));
  yield [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU, x = Math.sin(a) * 8.3, z = Math.cos(a) * 8.3;
    const pole = new THREE.CylinderGeometry(0.11, 0.11, 7.9, 6, 16);
    { const p = pole.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k), t = y * 3.0, px = p.getX(k), pz = p.getZ(k), s = 1 + 0.35 * Math.sin(y * 9); p.setX(k, (px * Math.cos(t) - pz * Math.sin(t)) * s); p.setZ(k, (px * Math.sin(t) + pz * Math.cos(t)) * s); } pole.computeVertexNormals(); }
    G.push(prep(pole, { col: C.gold, mat: 1, m: place(x, 13.95, z) }));
    for (const y of [10.12, 17.6]) G.push(prep(new THREE.SphereGeometry(0.24, 7, 5), { col: C.gold, mat: 1, m: place(x, y, z) }));
    const M = place(x, 13.6, z, a + Math.PI / 2, 0, 0, 1.25), ph = i * Math.PI * 0.75 + rng() * 0.4;
    deerM[i % 2].push(M); deerPh[i % 2].push(ph);
    G.push(prep(new THREE.SphereGeometry(0.1, 6, 5), { col: i === red ? C.red : C.cobalt, amp: 0.9, phase: ph, kind: 0, m: M.clone().multiply(place(0, 1.3, 2.25)) }));
  }
  yield G.splice(0);
  for (let v = 0; v < 2; v++) { G.push(instances(deer[v], deerM[v], (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < deerM[v].length; i++) for (let k = 0; k < n; k++) fx[(i * n + k) * 4 + 2] = deerPh[v][i]; })); yield G.splice(0); }
}

// ---------- tier 3: the counter-turning crown of geese and glass stars ----------
function goose(K) {
  const { C } = K, G = [];
  const P = (geo, o, local) => G.push(prep(geo, { ...o, m: local }));
  P(new THREE.SphereGeometry(1, 10, 8), { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, THREE.MathUtils.clamp(-y * 0.5, 0, 0.5)) }, place(0, 0, 0, 0, 0, 0, 0.42, 0.37, 0.92));
  P(tube([[0, 0.08, 0.72], [0, 0.3, 1.25], [0, 0.44, 1.78]], 0.115, 5, 6), { col: C.white });
  P(new THREE.SphereGeometry(0.18, 8, 6), { col: C.white }, place(0, 0.46, 1.92, 0, 0, 0, 1, 1, 1.3));
  P(new THREE.ConeGeometry(0.085, 0.36, 5), { col: C.gold, mat: 1 }, place(0, 0.44, 2.24, 0, Math.PI / 2));
  for (const s of [-1, 1]) P(new THREE.SphereGeometry(0.04, 5, 4), { col: C.deep }, place(s * 0.14, 0.52, 2.0));
  P(new THREE.ConeGeometry(0.3, 0.7, 6), { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, y > 0.1 ? 0.8 : 0) }, place(0, 0.06, -1.05, 0, -Math.PI / 2, 0, 1, 1, 0.3));
  for (const s of [-1, 1]) {
    const w = new THREE.BoxGeometry(1.75, 0.07, 0.8, 5, 1, 2), p = w.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getX(i) + 0.875) / 1.75;
      p.setXYZ(i, s * (0.28 + t * 1.75), p.getY(i) * (1 - 0.5 * t) + 0.24 * Math.sin(t * Math.PI) + 0.1, p.getZ(i) * (1 - 0.68 * t) - 0.55 * t * t + 0.1);
    }
    w.computeVertexNormals();
    P(w, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, Math.abs(x) > 1.55 ? 0.85 : 0), row: 1, rep: 3, kind: 1, amp: (x) => (Math.abs(x) - 0.28) * 0.42 });
  }
  return mergeGeometries(G);
}

function* buildCrown(K) {
  const { rng, noise, C } = K, G = [], N = 12;
  G.push(prep(lathe([[1.55, 25.85], [1.78, 26.05], [1.78, 26.95], [1.55, 27.15]], 20), { col: C.gold, mat: 1 }));
  const band = new THREE.CylinderGeometry(5.0, 5.0, 1.3, 96, 2, true);
  { const p = band.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.5) { const c = Math.max(0, Math.cos(Math.atan2(p.getX(i), p.getZ(i)) * N)); p.setY(i, p.getY(i) + 1.0 * c * c * c); } band.computeVertexNormals(); }
  G.push(prep(band, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, 0.25), row: K.crownRow, rep: 12, m: place(0, 26.65, 0) }));
  for (const y of [26.0, 27.3]) { const t = new THREE.TorusGeometry(5.03, 0.1, 5, 60); t.rotateX(Math.PI / 2); t.translate(0, y, 0); G.push(prep(t, { col: C.gold, mat: 1 })); }
  const phi = rng() * TAU, gooseM = [], goosePh = [], starM = [], starTop = [], starPh = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU, sx = Math.sin(a), cz = Math.cos(a);
    G.push(prep(new THREE.SphereGeometry(0.2, 7, 5), { col: C.gold, mat: 1, m: place(sx * 5, 28.45, cz * 5) }));
    G.push(prep(new THREE.SphereGeometry(0.17, 6, 4), { col: C.lamp, mat: 3, m: place(Math.sin(a + Math.PI / N) * 5.08, 26.65, Math.cos(a + Math.PI / N) * 5.08) }));
    G.push(prep(tube([[sx * 1.7, 26.5, cz * 1.7], [sx * 3.4, 26.85, cz * 3.4], [sx * 5, 26.5, cz * 5]], 0.075, 4, 5), { col: C.gold, mat: 1 }));
    // goose on a brass wire, flying against the platform's turn
    const gy = 29.0 + 1.5 * Math.sin(a * 2 + phi) + rng.range(-0.3, 0.3), gr = 7.6;
    G.push(prep(tube([[sx * 5, 27.3, cz * 5], [sx * 6.2, gy + 0.1, cz * 6.2], [sx * gr, gy - 0.45, cz * gr]], 0.07, 6, 5), { col: C.brass, mat: 1 }));
    gooseM.push(place(sx * gr, gy, cz * gr, a - Math.PI / 2, 0, 0, 1.45)); goosePh.push(rng() * TAU);
    // hanging glass star
    const b = a + Math.PI / N, inner = i % 2 === 1, sr = inner ? 3.4 : 5.0, top = inner ? 26.75 : 26.0, drop = inner ? rng.range(1.2, 2.1) : rng.range(1.9, 3.2);
    const px = Math.sin(b) * sr, pz = Math.cos(b) * sr, ph = rng() * TAU, amp = (x, y) => (top - y) * 0.07;
    const wire = new THREE.CylinderGeometry(0.045, 0.045, drop, 4, 3); wire.translate(px, top - drop / 2, pz);
    G.push(prep(wire, { col: C.gold, mat: 1, kind: 3, phase: ph, amp }));
    starM.push(place(px, top - drop - 0.2, pz, rng() * 3)); starTop.push(top); starPh.push(ph);
    if (i % 3 === 2) yield G.splice(0);
  }
  const gooseTpl = goose(K);
  yield [];
  G.push(instances(gooseTpl, gooseM, (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < N; i++) for (let k = 0; k < n; k++) fx[(i * n + k) * 4 + 2] = goosePh[i]; }));
  yield G.splice(0);
  G.push(instances(prep(starGeo(K.starPoints, 1.15, 0.26), { col: C.glass, mat: 2, flat: true, kind: 3 }), starM, (out, n) => {
    const fx = out.attributes.aFx.array, pos = out.attributes.position;
    for (let i = 0; i < N; i++) for (let k = 0; k < n; k++) { const j = i * n + k; fx[j * 4 + 1] = (starTop[i] - pos.getY(j)) * 0.07; fx[j * 4 + 2] = starPh[i]; }
  }));
  yield G.splice(0);
}

// ---------- tier 1: 24 painted skaters; their orbit and weave run in the vertex shader ----------
function* buildSkaters(K) {
  const { rng, C } = K, all = [];
  const coats = [C.cobalt, C.white, C.sky, C.cobalt, C.green, C.white];
  const tpls = [];
  for (let t = 0; t < 8; t++) {
    {
      const G = [], coat = rng.pick(coats), white = coat === C.white, S = 1.3 * rng.range(0.9, 1.08), accent = rng.chance(0.14) ? C.red : rng.pick([C.gold, C.cobalt, C.sky]);
      G.push(glazedLathe([[0.3, 0.42], [0.56, 0.5], [0.5, 0.76], [0.3, 1.15], [0.27, 1.3], [0.34, 1.5], [0.2, 1.68], [0.1, 1.74]], 10, coat, white ? C.pool : C.deep, white ? { row: 3, rep: 2 } : {}));
      const kick = rng.range(0.2, 1.0);
      G.push(prep(new THREE.CylinderGeometry(0.075, 0.06, 0.5, 5), { col: C.white, m: place(0.12, 0.25, 0.02) }));
      G.push(prep(new THREE.CylinderGeometry(0.075, 0.06, 0.55, 5), { col: C.white, m: place(-0.12, 0.3 + kick * 0.12, -0.12 - kick * 0.22, 0, kick) }));
      G.push(prep(new THREE.BoxGeometry(0.06, 0.07, 0.46), { col: C.gold, mat: 1, m: place(0.12, 0.035, 0.05) }));
      G.push(prep(new THREE.BoxGeometry(0.06, 0.07, 0.46), { col: C.gold, mat: 1, m: place(-0.12, 0.1 + kick * 0.3, -0.3 - kick * 0.35, 0, kick) }));
      G.push(prep(new THREE.SphereGeometry(0.2, 8, 6), { col: C.skin, m: place(0, 1.9, 0.02) }));
      if (rng.chance(0.6)) { G.push(prep(new THREE.ConeGeometry(0.21, 0.42, 7), { col: accent, m: place(0, 2.2, -0.03, 0, -0.25) })); G.push(prep(new THREE.SphereGeometry(0.075, 5, 4), { col: C.gold, mat: 1, m: place(0, 2.42, -0.1) })); }
      else G.push(prep(new THREE.SphereGeometry(0.23, 8, 5, 0, TAU, 0, 1.7), { col: accent, m: place(0, 1.93, -0.04, 0, -0.5) }));
      const pose = rng.int(0, 2);
      for (const s of [-1, 1]) {
        const rz = pose === 0 ? s * 1.1 : pose === 1 ? s * 0.25 : s * 0.35, rx = pose === 1 ? s * 0.9 : pose === 2 ? 0.7 : 0.1;
        const arm = new THREE.CylinderGeometry(0.075, 0.055, 0.62, 5); arm.translate(0, -0.31, 0);
        G.push(prep(arm, { col: coat, m: place(s * 0.27, 1.56, 0, 0, rx, rz) }));
      }
      G.push(prep(new THREE.BoxGeometry(0.16, 0.05, 0.8), { col: accent, m: place(0.08, 1.62, -0.48, 0.2, 0.35) }));
      const one = mergeGeometries(G); one.applyMatrix4(place(0, 0, 0, 0, 0.14, 0, S)); tpls.push(one);
    }
    if (t % 2 === 1) yield [];
  }
  for (let j = 0; j < 12; j++) {
    const r0 = 11.9 + (j % 4) * 2.45 + rng.range(-0.3, 0.3), dir = j % 4 === 2 ? -1 : 1, a0 = j / 12 * TAU * 2.4 + rng(), wp = rng() * TAU, sp = dir * rng.range(3.2, 4.6) / r0;
    for (let k = 0; k < 2; k++) {
      const one = tpls[(j * 2 + k * 3 + (j >> 2)) % 8].clone();
      const n = one.attributes.position.count, orb = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { orb[i * 4] = r0; orb[i * 4 + 1] = a0 + k * (2.6 / r0) * dir; orb[i * 4 + 2] = sp; orb[i * 4 + 3] = wp + k * Math.PI; }
      one.setAttribute('aOrb', new THREE.BufferAttribute(orb, 4));
      all.push(one);
    }
    if (j % 4 === 3) yield all.splice(0);
  }
}

// ---------- ice, flakes, bubble shaders ----------
const ICE_VERT = /* glsl */`
  varying vec3 vW, vL;
  #include <fog_pars_vertex>
  void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const ICE_FRAG = /* glsl */`
  uniform vec3 uIce; varying vec3 vW, vL;
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  void main(){
    vec3 V = normalize(cameraPosition - vW);
    float r = length(vL.xz), a = atan(vL.x, vL.z);
    vec3 N = normalize(vec3(0.03 * sin(vL.x * 0.9 + vL.z * 0.4), 1.0, 0.03 * sin(vL.z * 1.1 - vL.x * 0.3)));
    float ndv = max(dot(N, V), 0.0), fr = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
    vec3 R = reflect(-V, N);
    float sc = 0.0;                                         // skate tracks: the same weave the skaters follow
    for (int k = 0; k < 3; k++) {
      float fk = float(k), q = (r - 1.9 * sin(a * 3.0 + fk * 1.7)) * (0.31 + 0.13 * fk) + fk * 0.37;
      float l = abs(fract(q) - 0.5), w = fwidth(q) * 1.2 + 0.012;
      sc += smoothstep(w, 0.0, l) * (0.5 + 0.5 * sin(a * 7.0 + fk * 2.0));
    }
    float ca = caustic(vW.xz);
    vec3 col = uIce * 0.3 + roomEnv(R) * fr + vec3(0.85, 0.92, 1.0) * sc * 0.1 + uSunCol * ca * 0.22 + uSunCol * pow(max(dot(R, uSunDir), 0.0), 500.0) * 6.0;
    float alpha = clamp(0.12 + fr * 0.9 + sc * 0.1 + ca * 0.12, 0.0, 0.95);
    float rim = smoothstep(21.2, 23.1, r) + smoothstep(10.2, 8.5, r);    // frosted where it meets the snow
    col = mix(col, vec3(0.72, 0.8, 0.9) * (0.75 + 0.3 * ca), rim * 0.75); alpha = mix(alpha, 0.93, rim * 0.85);
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }`;

const FLAKE_VERT = /* glsl */`
  attribute vec4 aSeed;
  uniform float uTime, uSwirl, uS, uFall, uEntry; uniform vec3 uSunDir, uDome, uAim;
  varying vec2 vQ; varying vec4 vInfo; varying float vHex;
  #include <fog_pars_vertex>
  void main(){
    float h1 = aSeed.x, h2 = aSeed.y, h3 = aSeed.z, h4 = aSeed.w;
    // poloidal disc around the torus core, rolling while the swirl lasts
    float rho = 35.0 * sqrt(h1), phi = h2 * 6.2832 + uSwirl * 0.16 * (0.6 + 0.8 * h4);
    float r = 41.0 + rho * cos(phi), y = 37.0 + rho * sin(phi) * 1.03;
    y = mod(y - uFall * (0.75 + 0.5 * h3), 74.0);
    r = sqrt(r * r + 72.0);                                   // the clear eye
    float w = 34.0 / (r + 8.0);
    float arm = floor(h3 * 3.0) / 3.0 + 0.11 * (fract(h3 * 3.0) - 0.5) * (1.0 + 3.0 * step(0.62, h4) * 1.5);
    float ang = arm * 6.2832 + w * uSwirl;
    vec3 c = vec3(sin(ang) * r, y, cos(ang) * r);
    c += 0.4 * vec3(sin(uTime * 1.3 + h1 * 40.0), 0.6 * sin(uTime * 1.7 + h2 * 40.0), cos(uTime * 1.1 + h4 * 40.0));
    vec3 vel = vec3(cos(ang), 0.0, -sin(ang)) * w * r * uS + vec3(0.0, -1.2 * (1.0 - uS), 0.0);
    vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.0);
    float dist = length(mv.xyz);
    vHex = step(0.75, fract(h4 * 7.31));
    float size = mix(0.13, 0.22, vHex);
    size = max(size, dist * 0.00095) * smoothstep(4.0, 22.0, dist) * step(length(c - uDome), 77.0) * step(0.2, c.y);
    // entry: a clean tube from the eye to the spire so the hero's silhouette reads, and thinner far streaks
    vec3 wc = (modelMatrix * vec4(c, 1.0)).xyz - cameraPosition, ab = uAim - cameraPosition;
    float dl = length(wc - ab * clamp(dot(wc, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0));
    size *= mix(1.0, smoothstep(7.0, 12.5, dl) * (0.3 + 0.7 * smoothstep(95.0, 38.0, dist)) * step(0.35, fract(h2 * 13.7 + h1 * 5.3)), uEntry);
    vec2 vv = (viewMatrix * modelMatrix * vec4(vel, 0.0)).xy;
    float k = smoothstep(0.35, 0.65, uS);
    float tum = uTime * (0.6 + 1.6 * h2) + h1 * 30.0;
    vec2 ax = normalize(mix(vec2(cos(tum), sin(tum)), vv / (length(vv) + 0.001), k) + vec2(0.0001, 0.0));
    float stretch = 1.0 + (3.5 - 1.5 * uEntry) * k * clamp(length(vv) * 0.1, 0.0, 1.0);
    float flat_ = mix(0.3 + 0.7 * abs(sin(tum * 1.7 + h3 * 9.0)), 0.28, k);
    mv.xy += (ax * position.x * stretch + vec2(-ax.y, ax.x) * position.y * flat_) * size;
    // sparkle: a tumbling facet normal against the sun/view half vector
    vec3 wp = (modelMatrix * vec4(c, 1.0)).xyz;
    float t1 = uTime * (1.3 + 2.2 * h1) + h2 * 50.0, t2 = uTime * (0.9 + 1.7 * h3) + h4 * 50.0;
    vec3 n = vec3(sin(t1) * cos(t2), cos(t1), sin(t1) * sin(t2));
    vec3 H = normalize(uSunDir + normalize(cameraPosition - wp));
    float sp = pow(abs(dot(n, H)), 70.0);
    // a third of the mylar hexagons catch the sun outright now and then: a short, bright, coloured flash
    float fl = step(0.7, fract(h1 * 91.7 + h3 * 3.1)) * pow(max(sin(uTime * (1.6 + 2.6 * h2) + h4 * 80.0), 0.0), 24.0);
    vInfo = vec4(sp, 0.5 + 0.5 * n.y, h1 + h3, fl * vHex);
    vQ = position.xy;
    vec4 mvPosition = mv;
    gl_Position = projectionMatrix * mv;
    #include <fog_vertex>
  }`;
const FLAKE_FRAG = /* glsl */`
  uniform vec3 uWhite, uSkyCol, uSunCol;
  varying vec2 vQ; varying vec4 vInfo; varying float vHex;
  #include <fog_pars_fragment>
  void main(){
    vec2 q = abs(vQ);
    float d = vHex > 0.5 ? max(q.x * 0.866 + q.y * 0.5, q.y) * 1.12 : length(vQ);
    if (d > 1.0) discard;
    vec3 col = uWhite * mix(vec3(1.0), uSkyCol, 0.22) * (0.7 + 0.16 * vInfo.y);          // white snow, a breath of the sky in it
    if (vHex > 0.5) {
      vec3 iri = 0.6 + 0.4 * cos(6.2832 * (vInfo.z * 1.7 + vInfo.y * 0.8 + vec3(0.0, 0.33, 0.67)));
      col = mix(col * 0.94, iri * 0.85, 0.14) + mix(vec3(1.0), iri, 0.6) * (vInfo.x * 7.0 + vInfo.w * 5.5);
    } else col += uSunCol * vInfo.x * 2.6;
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }`;

const BUBBLE_VERT = /* glsl */`
  #ifdef RISE
  attribute vec4 aB; uniform vec3 uTarget;
  #endif
  uniform float uTime;
  varying vec3 vW, vN;
  #include <fog_pars_vertex>
  void main(){
    vec3 p = position, n = normal;
    #ifdef RISE
      float span = uTarget.y - 3.0, f = fract(aB.z + uTime * aB.w / span), wob = sin(uTime * 3.1 + aB.z * 40.0);
      p.xz *= 1.0 + 0.1 * wob; p.y *= 1.0 - 0.12 * wob;
      float k = smoothstep(0.4, 1.0, f);
      vec2 c = mix(aB.xy, uTarget.xz + aB.xy * 0.2, k) + 0.8 * vec2(sin(uTime * 0.9 + f * 20.0 + aB.z * 9.0), cos(uTime * 0.7 + f * 17.0));
      p *= smoothstep(0.0, 0.04, f) * (1.0 - smoothstep(0.95, 1.0, f));
      p += vec3(c.x, 3.0 + f * span, c.y);
    #else
      p += n * 0.1 * sin(uTime * 1.7 + p.x * 0.7 + p.z * 0.5);
    #endif
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const BUBBLE_FRAG = /* glsl */`
  uniform mat4 uInv; uniform vec3 uWhite, uPool, uCobalt, uGold, uGreen, uIce, uBrass, uDome, uTarget; uniform float uGores, uOpen;
  varying vec3 vW, vN;
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  // the village as the mirror holds it: a painted-plate rosette (canopy gores, the pond over its brass cylinder, two rings
  // of cobalt roofs with gilt ridges, the pine rim). p is in rosette units: canopy 11.6, pond to 19.5, roofs to 33.
  vec3 village(vec2 p){
    float r = length(p), a = atan(p.x, p.y + 1e-5); vec3 wh = min(uWhite, vec3(0.8));
    vec3 c = mix(wh * 0.75, uPool * 0.78, 0.2 + 0.14 * sin(p.x * 0.31) * cos(p.y * 0.27));
    float k1 = a * 1.9098593, k2 = a * 2.8647890 + 0.5;                       // 12 and 18 roofs
    float w1 = step(abs(fract(k1) - 0.5), 0.34) * step(abs(r - 24.3), 2.5) * step(0.12, hash22(vec2(floor(k1), 3.0)).x);
    float w2 = step(abs(fract(k2) - 0.5), 0.33) * step(abs(r - 30.6), 2.1) * step(0.2, hash22(vec2(floor(k2), 9.0)).x);
    c = mix(c, uCobalt * (0.8 + 0.3 * step(0.5, fract(k1 * 0.5))), w1); c = mix(c, uCobalt * 0.82, w2);
    c = mix(c, uGold * 1.15, max(w1 * step(abs(r - 24.3), 0.4), w2 * step(abs(r - 30.6), 0.36)));
    float k3 = a * 5.7295780;                                                 // 36 pines on the rim
    c = mix(c, uGreen * 1.5, step(length(vec2((fract(k3) - 0.5) * 1.3, (r - 35.3) * 0.3)), 0.46) * step(0.25, hash22(vec2(floor(k3), 5.0)).x));
    c = mix(c, uCobalt * 0.55, smoothstep(37.2, 38.2, r));                    // a cobalt border: the lens keeps a dark edge against the ceiling
    c = mix(c, wh * 0.98, smoothstep(21.4, 21.0, r));                     // the snow bank, the brightest white
    vec3 pond = mix(uCobalt * 0.6, uBrass * 1.05, step(abs(p.y), 3.3) * step(abs(p.x), 17.6));
    pond = mix(pond, uCobalt * 0.36, step(abs(abs(p.y) - 3.3), 0.3) * step(abs(p.x), 17.6));
    c = mix(c, pond, smoothstep(19.6, 19.2, r));
    c = mix(c, mix(wh, uCobalt * 0.95, step(0.0, cos(a * uGores * 0.5))), smoothstep(11.9, 11.5, r));
    c = mix(c, uGold * 1.15, smoothstep(0.55, 0.3, abs(r - 11.7)));
    c = mix(c, wh, smoothstep(4.4, 4.0, r));
    return mix(c, uGold * 1.15, smoothstep(2.3, 1.9, r));
  }
  void main(){
    vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
    if (dot(N, V) < 0.0) N = -N;
    float ndv = max(dot(N, V), 0.0), lip = 0.0, under = 0.0;
    vec3 Nm = N;
    #ifndef RISE
      // the underside is a convex mirror (so it holds the whole village) that opens like an iris for the portal
      vec3 ax = normalize(uTarget - uDome + vec3(0.0, 1e-4, 0.0)), rel = vW - uTarget;
      float t = dot(rel, ax); vec3 rad = rel - ax * t; float rr = length(rad);
      under = step(t, 2.6);
      if (under > 0.5 && rr < uOpen) discard;
      lip = smoothstep(0.6, 0.0, rr - uOpen) * step(0.01, uOpen) * under;
      Nm = normalize(N + rad * 0.036 * under);
    #endif
    vec3 R = reflect(-V, Nm);
    vec3 Pl = (uInv * vec4(vW, 1.0)).xyz, Rl = normalize(mat3(uInv) * R);
    vec3 col = roomEnv(R);
    if (Rl.y < -0.01) {
      vec2 h = Pl.xz + Rl.xz * (-Pl.y / Rl.y);
      #ifdef RISE
        vec3 vc = mix(min(uWhite, vec3(0.8)) * 0.9, uPool * 0.8, 0.3 + 0.2 * sin(h.x * 0.13) * cos(h.y * 0.11));
      #else
        // centred on where the lens's own axis meets the ground, and magnified so the carousel fills two fifths of the disc
        vec3 P0 = (uInv * vec4(uTarget, 1.0)).xyz, A0 = normalize(mat3(uInv) * ax);
        vec2 h0 = P0.xz - A0.xz * (P0.y / max(A0.y, 0.2));
        vec3 vc = village((h - h0) / 2.3) * (0.95 + 0.1 * caustic(h * 0.5)) * mix(1.0, 1.25, under);
      #endif
      col = mix(col, vc, smoothstep(-0.01, -0.1, Rl.y));
    }
    float rim = pow(1.0 - ndv, 4.0), edge = smoothstep(0.35, 0.85, 1.0 - ndv);
    col = col * mix(mix(vec3(0.5, 0.6, 0.8), vec3(0.9, 0.94, 1.0), under), vec3(0.9), rim);
    col = mix(col, col * vec3(0.16, 0.24, 0.44), edge * 0.85 * (1.0 - under * 0.6));                    // dark Fresnel edge: the lens has a silhouette
    col += mix(vec3(0.6, 0.8, 1.0), vec3(1.0, 0.82, 0.7), smoothstep(0.35, 0.9, rim)) * rim * 0.68
         + uSunCol * (pow(max(dot(R, uSunDir), 0.0), 300.0) * 8.0 + 6.0 * pow(1.0 - ndv, 7.0) * smoothstep(-0.2, 0.6, dot(N, uSunDir)))
         + vec3(1.5, 1.75, 2.2) * lip;
    gl_FragColor = vec4(col, 1.0);
    #ifdef RISE
    #include <fog_fragment>
    #endif
  }`;

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('shaken-globe-hero'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hsl = (c, dh, ds, dl) => c.clone().offsetHSL(dh, ds, dl);
  const white = pal[0].clone().multiplyScalar(0.84), cobalt = hsl(pal[3], rng.range(-0.025, 0.025), 0, rng.range(-0.03, 0.03));
  const C = {
    white, pool: pal[1].clone().lerp(pal[2], 0.45).multiplyScalar(0.82), sky: pal[2].clone().multiplyScalar(0.85), cobalt,
    deep: cobalt.clone().multiplyScalar(0.42), basin: pal[2].clone().lerp(cobalt, 0.45).multiplyScalar(0.8), green: pal[4].clone(), red: pal[6].clone(),
    gold: pal[5].clone().multiply(new THREE.Color(1.12, 0.84, 0.44)), lamp: new THREE.Color(1.0, 0.66, 0.28), brass: pal[5].clone().multiply(new THREE.Color(0.8, 0.68, 0.5)),
    steel: new THREE.Color(0.74, 0.79, 0.86), skin: pal[0].clone().lerp(pal[5], 0.25).multiplyScalar(0.84), glass: pal[1].clone().lerp(new THREE.Color(1, 1, 1), 0.3),
  };
  const K = {
    rng, noise, C,
    twist: rng.sign() * rng.range(0.55, 0.95), flutes: rng.int(5, 8), bulb: rng.range(0.86, 1.2),
    wallRow: rng.pick([0, 3, 0]), bulbRow: rng.pick([1, 1, 2, 0]), deckRow: rng.pick([3, 2]), crownRow: rng.pick([2, 0]),
    scallops: rng.pick([10, 12, 12, 14]), canopyStyle: rng.chance(0.7) ? 0 : 1, finialPoints: rng.pick([6, 14]), starPoints: rng.pick([6, 14, 14]),
  };
  const duration = opts.duration ?? 40, nFlakes = Math.max(0, Math.floor(opts.flakes ?? 24000));
  const domeC = new THREE.Vector3(0, 20, 0), domeR = 80;

  let brush; { const it = makeBrushAtlas(rng); let r; while (!(r = it.next()).done) await ctx.yield(); brush = r.value; }
  await ctx.yield();

  // shared uniforms
  const U = {
    uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, Math.sin(22 * Math.PI / 180), Math.cos(22 * Math.PI / 180)) },
    uSunCol: { value: pal[5].clone().lerp(new THREE.Color(1, 1, 1), 0.45) }, uSkyCol: { value: pal[2].clone().lerp(new THREE.Color(1, 1, 1), 0.32) },
    uBounce: { value: pal[0].clone() }, uHorizon: { value: pal[0].clone().lerp(pal[1], 0.3) }, uCobalt: { value: cobalt }, uDeep: { value: pal[2].clone().lerp(cobalt, 0.55) },
    uBaseY: { value: 0 }, uBrush: { value: brush },
    uSwirl: { value: 0 }, uS: { value: 0.3 }, uFall: { value: 0 }, uDome: { value: domeC },
    uWhite: { value: white }, uPool: { value: C.pool }, uGold: { value: C.gold }, uGreen: { value: C.green }, uBrass: { value: C.brass },
    uIce: { value: pal[1].clone().lerp(pal[2], 0.5) }, uInv: { value: new THREE.Matrix4() }, uGores: { value: K.scallops }, uTarget: { value: new THREE.Vector3() },
    uCrown: { value: 0 }, uEntry: { value: 0 }, uAim: { value: new THREE.Vector3(0, 30, 0) }, uOpen: { value: 0 }, uCaK: { value: 1 }, uTsTop: { value: 1 },
    uWarm: { value: new THREE.Color(1.0, 0.62, 0.26).multiplyScalar(1.15) }, uGlow: { value: 3.2 },
  };
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...extra });
  const glaze = mat(GLAZE_VERT, GLAZE_FRAG), glazeOrbit = mat(GLAZE_VERT, GLAZE_FRAG, { defines: { ORBIT: '' } });

  const object = new THREE.Group(); object.name = 'shaken-globe-hero';
  const add = (geo, m, parent = object) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; parent.add(me); return me; };

  await ctx.yield();
  const staged = async (gen, amp, freq) => {      // build a piece stage by stage, handing the frame back between stages
    const parts = []; for (const part of gen) { parts.push(...part); await ctx.yield(); }
    const g = mergeGeometries(parts); await ctx.yield();
    if (amp) { wobble(g, noise, amp, freq); await ctx.yield(); }
    return g;
  };
  await ctx.yield();
  // the first lathe, the first prep and the first glazed lathe each cost a first-call compile: take them in steps of their own
  { const w = lathe([[1, 0], [1.2, 0.5], [1, 1]], 6); await ctx.yield(); const q = prep(w, { col: C.white }); await ctx.yield(); w.dispose(); q.dispose();
    glazedLathe([[1, 0], [1.2, 0.5], [1, 1]], 6, C.white, C.pool, { row: 0, rep: 1 }).dispose(); await ctx.yield(); }
  add(await staged(buildStatic(K), 0.07), glaze);
  const cylinder = add(await staged(buildCylinder(K), 0), glaze); cylinder.position.set(0, -7.6, 0); await ctx.yield();
  const platform = add(await staged(buildPlatform(K), 0.045, 0.4), glaze); await ctx.yield();
  const crown = add(await staged(buildCrown(K), 0.03, 0.5), glaze); await ctx.yield();
  const skaters = add(await staged(buildSkaters(K), 0), glazeOrbit); await ctx.yield();

  // ice
  const iceGeo = new THREE.RingGeometry(8.4, 23.15, 96, 4); iceGeo.rotateX(-Math.PI / 2);
  const ice = add(iceGeo, mat(ICE_VERT, ICE_FRAG, { transparent: true, depthWrite: false })); ice.renderOrder = 2;

  // flakes: one instanced quad, positions analytic in the vertex shader
  let flakes = null;
  if (nFlakes > 0) {
    const fg = new THREE.InstancedBufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    fg.setIndex([0, 1, 2, 0, 2, 3]);
    await ctx.yield();
    const seeds = new Float32Array(nFlakes * 4); for (let i = 0; i < seeds.length; i++) { seeds[i] = rng(); if ((i & 16383) === 16383) await ctx.yield(); }
    await ctx.yield();
    fg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); fg.instanceCount = nFlakes;
    flakes = add(fg, mat(FLAKE_VERT, FLAKE_FRAG));
  }
  await ctx.yield();

  // the air bubble on the dome, and the small bubbles that rise to join it
  const bubbleDir = new THREE.Vector3(0, Math.cos(25 * Math.PI / 180), -Math.sin(25 * Math.PI / 180));
  const bubble = new THREE.Group(); bubble.name = 'air-bubble';
  const seat = { position: new THREE.Vector3(), normal: new THREE.Vector3(), direction: new THREE.Vector3(), radius: 7 };
  const finalLine = { from: new THREE.Vector3(), to: new THREE.Vector3() }, flyThrough = [];
  const bubbleInfo = { center: new THREE.Vector3(), radius: 9 };
  const up = new THREE.Vector3(0, 1, 0);
  function setBubbleDir(v) {
    bubbleDir.copy(v).normalize();
    bubble.position.copy(domeC).addScaledVector(bubbleDir, domeR);
    bubble.quaternion.setFromUnitVectors(up, bubbleDir);
    seat.position.copy(domeC).addScaledVector(bubbleDir, domeR - 5.7); seat.direction.copy(bubbleDir); seat.normal.copy(bubbleDir).negate();
    bubbleInfo.center.copy(domeC).addScaledVector(bubbleDir, domeR - 3);
    U.uTarget.value.copy(domeC).addScaledVector(bubbleDir, domeR - 7);
    finalLine.to.copy(seat.position); finalLine.from.copy(domeC).addScaledVector(bubbleDir, domeR - 5.7 - 36);
    // camera line: a level orbit beside the reindeer, a 1.5 turn helix over the spire, then the straight run
    const hx = bubbleDir.x, hz = bubbleDir.z, aEnd = Math.hypot(hx, hz) > 1e-3 ? Math.atan2(-hz, hx) : Math.PI / 2;
    flyThrough.length = 0;
    const a0 = aEnd - 2.5 * TAU;
    for (let i = 0; i < 8; i++) { const a = a0 + i / 8 * TAU; flyThrough.push(new THREE.Vector3(Math.sin(a) * 18, 13, Math.cos(a) * 18)); }
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, a = a0 + TAU + t * 1.5 * TAU, y = 13 + 34 * t;
      const r = y < 19 ? 18 : y < 25 ? 18 - 1.0 * (y - 19) / 6 : y < 33 ? 17 : 17 - 10 * (y - 33) / 14;
      flyThrough.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r));
    }
    flyThrough.push(finalLine.from.clone(), finalLine.to.clone());
  }
  if (opts.bubble !== false) {
    const prof = []; for (let i = 0; i <= 14; i++) { const r = 9 * Math.sin(i / 14 * Math.PI / 2); prof.push([r, -6 + 5.3 * Math.pow(r / 9, 8)]); }
    for (let i = 1; i <= 8; i++) { const r = 9 * Math.cos(i / 8 * Math.PI / 2); prof.push([r, -0.7 * (r / 9) * (r / 9) + 0.0]); }
    const bg = [lathe(prof, 48)];
    for (const g of bg) g.deleteAttribute('uv');
    add(mergeGeometries(bg), mat(BUBBLE_VERT, BUBBLE_FRAG), bubble);
    await ctx.yield();
    // the meniscus the portal sits in: a gilt rim with a beaded silver-gilt ring outside it (opts.rim = its radius)
    const rr = opts.rim ?? 5.8, rg = [], t1 = new THREE.TorusGeometry(rr, 0.2, 8, 72), t2 = new THREE.TorusGeometry(rr + 0.75, 0.09, 6, 72);
    for (const t of [t1, t2]) { t.rotateX(Math.PI / 2); t.translate(0, -6.06, 0); rg.push(prep(t, { col: C.gold, mat: 1 })); }
    for (let k = 0; k < 24; k++) rg.push(prep(new THREE.SphereGeometry(0.17, 6, 4), { col: C.gold, mat: 1, m: place(Math.sin(k / 24 * TAU) * (rr + 0.38), -6.08, Math.cos(k / 24 * TAU) * (rr + 0.38)) }));
    add(mergeGeometries(rg), glaze, bubble); for (const g of rg) g.dispose();
    object.add(bubble);
    await ctx.yield();
    // rising clusters
    const sg = [], brng = rng.fork('bubbles');
    for (let c = 0; c < 12; c++) {
      if (c % 3 === 2) await ctx.yield();
      const big = c >= 7, ca = brng() * TAU, cr = big ? brng.range(27, 36) : brng.range(23, 36), n = brng.int(5, 9), seed = big ? (c - 7 + brng()) / 5 : brng(), speed = brng.range(2.2, 3.6);
      for (let i = 0; i < n; i++) {
        const rad = big ? brng.range(0.3, 1.1) : brng.range(0.15, 0.6), g = new THREE.IcosahedronGeometry(rad, 1); g.deleteAttribute('uv');
        g.translate(brng.range(-1.6, 1.6), brng.range(-2, 2), brng.range(-1.6, 1.6));
        const nv = g.attributes.position.count, ab = new Float32Array(nv * 4);
        for (let k = 0; k < nv; k++) { ab[k * 4] = Math.sin(ca) * cr; ab[k * 4 + 1] = Math.cos(ca) * cr; ab[k * 4 + 2] = seed + i * 0.004; ab[k * 4 + 3] = speed; }
        g.setAttribute('aB', new THREE.BufferAttribute(ab, 4)); sg.push(g);
      }
    }
    (opts.bubblesAt || []).forEach((at, c) => {
      const n = brng.int(5, 8), seed = (c + brng()) / Math.max(1, opts.bubblesAt.length), speed = brng.range(1.5, 2.3);
      for (let i = 0; i < n; i++) {
        const g = new THREE.IcosahedronGeometry(brng.range(0.25, 0.8), 1); g.deleteAttribute('uv');
        g.translate(brng.range(-1.8, 1.8), brng.range(-2.4, 2.4), brng.range(-1.8, 1.8));
        const nv = g.attributes.position.count, ab = new Float32Array(nv * 4);
        for (let k = 0; k < nv; k++) { ab[k * 4] = at[0]; ab[k * 4 + 1] = at[1]; ab[k * 4 + 2] = seed + i * 0.004; ab[k * 4 + 3] = speed; }
        g.setAttribute('aB', new THREE.BufferAttribute(ab, 4)); sg.push(g);
      }
    });
    await ctx.yield();
    add(mergeGeometries(sg), mat(BUBBLE_VERT, BUBBLE_FRAG, { defines: { RISE: '' } }));
    await ctx.yield();
  }
  setBubbleDir(opts.bubbleDir || bubbleDir.clone());

  // progress: the three acts of the vortex
  let progress = -1, idleSwirl = 6.2, idleFall = 0;
  const _p = new THREE.Vector3();
  function applyProgress() {
    if (progress < 0) return;
    const t = progress * duration, e = 11 * (1 - Math.exp(-t / 11));
    U.uS.value = Math.exp(-t / 11); U.uSwirl.value = e; U.uFall.value = 1.2 * (t - e);
  }
  const hero = {
    object, radius: 30, height: 42, center: new THREE.Vector3(0, 17, 0), ground: false, groundY: 0,
    anchors: {
      portalSeat: seat, finalLine, flyThrough,
      viewpoints: { front: new THREE.Vector3(0, 16, 62), ice: new THREE.Vector3(17, 3.2, 15), reindeer: new THREE.Vector3(0, 13, 18), crown: new THREE.Vector3(12, 31, 12) },
      pond: { inner: 8.3, outer: 23.1, y: 0 }, bank: { radius: 36.5 }, eyeRadius: 8,
      tiers: { skaters: 0, platform: 10, canopy: 17.5, crown: 26.5, tip: 40 },
      stars: { count: 12, radius: 4.2, y: 23.5, spin: -TAU / 11 },
      dome: { center: domeC, radius: domeR }, bubble: bubbleInfo,
    },
    parts: { platform, crown, cylinder, skaters, flakes, bubble, ice },
    uniforms: U,
    // for the world coder: the same helpers, colours and porcelain shader the hero is made of
    kit: { prep, place, lathe, glazedLathe, instances, wobble, tube, archShape, starGeo, goose: () => goose(K), mat, glaze, C, K, GLAZE_FRAG, GLSL_COMMON },
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); applyProgress(); },
    setSun(dir, color) { U.uSunDir.value.copy(dir).normalize(); if (color != null) U.uSunCol.value.set(color); },
    setBubbleDir,
    update(dt, time) {
      U.uTime.value = time;
      platform.rotation.y = time * TAU / 16; crown.rotation.y = -time * TAU / 11; cylinder.rotation.x = time * TAU / 20;
      U.uCrown.value = crown.rotation.y;
      if (progress < 0) {      // idle: hold the spiral act and let it drift
        const s = 0.3; idleSwirl += dt * s; idleFall += dt * 1.2 * (1 - s);
        U.uS.value = s; U.uSwirl.value = idleSwirl; U.uFall.value = idleFall;
      }
      object.updateWorldMatrix(true, false);
      U.uBaseY.value = _p.setFromMatrixPosition(object.matrixWorld).y;
      U.uInv.value.copy(object.matrixWorld).invert();
    },
    dispose() { U.uBrush.value.dispose(); },
  };
  return hero;
}
