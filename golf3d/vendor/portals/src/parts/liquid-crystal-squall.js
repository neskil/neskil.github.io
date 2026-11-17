// The Liquid-Crystal Squall: the hero (a five-masted barque standing seven times over) and the STYLE KIT.
//
// THE FAINT STANDING SHAPES ARE THE GLASS'S OWN UNLIT SEGMENTS, EVERY STATION STANDING FOR GOOD. A segment is
// dark by the world's clock (the time given to update()) and by its own place (its station in its chain), and
// by nothing else: not u, not the lens, not a seed, not a wall clock. The device is our own invention, after
// no product, maker, game or character; nothing is lettered; nothing is carried with the camera.
// Built on our older engine and kit as they are (this file imports nothing from the kit).
// THE UNLIT TONE IS A WHISPER, and of the large shapes that stand against the sky (her leaves, the wheel's wedges, trees, ring,
// the birds) the faintest the glass has: one per cent under the ground, with no darkened neighbour.
//
// ---- makeStyle(ctx, opts) : read this first, everything in the world is made with it ------------------------
//   opts.palette  seven hex strings [ground, dark, ghost, shadow, teal, orange, yellow] (the brief's order).
//   returns {
//     palette   { ground, dark, ghost, ghostFar, shadow, teal, orange, yellow, inks:[..3] }  linear THREE.Color,
//               shown exactly (the world returns post flat 1, bloom 0, no vignette, no grain).
//     uniforms  { uTime, uCast, uBack, ... } shared by every material. uCast = the shadow's fixed WORLD vector
//               (0.17 toward +X, 0.17 down); uBack = 0.2 m along the shape's own back vector (aShadow): the
//               copy hugs its shape as a thin drop shadow and is never a second shape beside it.
//     update(dt, time)   sets uTime = time. NOTHING ELSE. It ignores any camera or u passed to it.
//     segments(geometry, max, o)  ONE SHADER DOES ALL SEGMENTS. Returns a batch { group, add(matrix, spec),
//               finish() }. spec = { chain:[i, n, r, p], dark:[m, mode], gate:[sail, kind], tone, back:[x,y,z] }
//                 chain  station index i of n in its chain, r steps a second (negative runs the other way),
//                        p phase in steps (a formula of the station's place, e.g. dot(pos, waveDir)/wavelength)
//                 dark   m = every m-th station is dark (n/k); mode 0 cyclic, 1 one dark there-and-back,
//                        2 dark for good (strata, scrub, bands), 3 as 1 but switching in a thousandth of a second (her leaves:
//                        so large a shape is not left standing in mid-fade)
//                 gate   [-1,0] none; the barque's sails use [sail number, 0 set | 1 furled] (47 s cycle: each
//                        sail is furled for 3 s of it, the sails' turns spread evenly over the whole cycle)
//                 tone   0 over the ground, 1 teal, 2 orange, 3 yellow pane behind it (ghost = ink at 97.7 %,
//                        shadow = ink at 78 %); add 4 for a far thing or a large one against the sky (ghost one
//                        per cent under the ground, and no darkened neighbour).
//                        THE UNLIT TONE IS A WHISPER: about 2 % under whatever it stands on, 1 % with the 4.
//                 back   the shape's back vector in ITS OWN space (default [0,0,-1]); the shadow copy goes
//                        uBack along it in world space, plus uCast. [0,0,0] = no push back.
//               GHOSTS AND SHADOWS NEVER HOLE THE INK: a free-standing batch's ghost pass and shadow pass are
//               drawn UNDER the printed panes (renderOrder 0.5 and 0.6: before the sea at 0.9 and the ink at 1,
//               so both cover them, each kind a hair after the kind made before it, so that the order among
//               kinds is the build's order at every draw), so a
//               ghost or a shadow copy with ink behind it is simply covered by the ink; pass o.over = true for
//               a batch that hangs ON a pane (ghost = its ink at 97.7 %, shadow = its ink at 78 %; orders 10, 11).
//               back is used at its own length (times uBack): a unit vector for the plain 0.2 m push.
//               The batch is three InstancedMeshes on the same buffers: ghost pass (renderOrder 0.5 or 10, no depth
//               write), shadow pass (0.6 or 11, the copy moved by the fixed vector, no depth write), dark pass (12,
//               writes depth). Each pass collapses the stations not its own BY THE CLOCK ALONE, so every
//               station is always drawn by exactly one pass, dark wins over any ghost, and no shadow covers
//               a dark shape. Darkness: 1 if the station is one of the dark, eased over 0.125 s, 0.05 if
//               next to one (nought for a tone with the 4), else 0; colour = mix(ghost, dark, darkness), flat.
//               Any attribute may instead be given per vertex on the geometry itself (the barque does this
//               for gate and back): the batch only adds the ones the geometry lacks.
//     shape(pts, holes)   flat BufferGeometry in the XY plane from an outline [[x,y],..] (z = 0, normal +Z)
//     chevron(w, h, t), lozenge(w, h), bar(w, h)   the standard segment shapes
//     panes()   builder for printed panes: { quad(a,b,c,d, color), poly(pts3, color), build() } -> one merged
//               unlit mesh (renderOrder 1, polygon offset), flat ink, never shaded.
//     sea(size) THE SEA, PRINTED WHOLE in the first ink: one flat tone, a pane (renderOrder 0.9, after the
//               free-standing ghost and shadow passes, so it covers every one of them that has water behind it).
//     RO        { under:0.5, underShadow:0.6, sea:0.9, pane:1, ghost:10, shadow:11, dark:12 }
//   }
//   Widths are the world's to fix by place; the kit never widens, fades, hides or scales anything by the
//   lens. No fog, no lights.
//
// ---- buildHero(ctx, opts) : the barque ----------------------------------------------------------------------
//   LOCAL FRAME: origin at midships on the keel line at sea level; +Y up; BOW TOWARD +Z; port is +X,
//   starboard -X. She is 110 m long (stern z -54, stem z +56), bowsprit tip at (0, 17, 79), trucks 70 m up.
//   Built seven times over: ONE merged ship geometry, seven instances rolled -30..+30 degrees about the keel
//   line (the z axis at y 0). The dark steps through the fan and back, one angle every half second, a whole leaf
//   switching at once, in a thousandth of a second (so large a shape is never left standing in mid-fade). THE FURL
//   GOES THROUGH HER RIG AS A RIPPLE: each of her twenty sails is furled for 3 s of a 47 s cycle of the clock (it
//   comes and goes in 0.04 s), and the sails' turns are spread evenly over the whole cycle by each sail's own
//   number, 2.35 s apart: at every value of the clock at most two of the twenty are furled, so she never stands
//   bare and looks the same in kind at any clock. One whole ship is dark at all times.
//   HER SAILS ARE DRAWN IN CLOTHS with SEAM m of ground between them, and each square sail's foot is an arc about
//   the keel line RING_GAP m clear of the yard below: the seven leaves' tiers leave rings of ground, so the ghost
//   fan is ribs and bands (six more ships), never one filled disc, and a dark leaf seen along her length is a
//   stack of separate sails. Her yards are braced on one fixed tack (broad from her port bow, edge-on from the
//   lane's approach on her port quarter).
//   In the world: object.position = (-50, 0, -334), object.rotation.y = 25 degrees (bow toward the entry and
//   25 degrees to its right); mirror the world by scale.x = -1 on the world's root, not on her.
//   opts: palette (7 hex), detail (0.6-1: thins only the part's own stage, the ship is cheap), style (the
//         world's one makeStyle instance; when it is given no stage is built), stage (true/false: the
//         part's own sea, crests and backdrop for when it stands alone; default only when no style is passed).
//   returns { object, radius 80, height 70, center, anchors, clearancePoints(matrixWorld, leaf), meshes, update, dispose }
//   anchors (local): midships, stem, bowspritTip, sternTip, mastFeet[5], trucks[5], rollAxis,
//     lane { center (0,17,-32.4), dir (-1,0,0), halfWidth 9, floor 11.5 }  the gap between the fourth and
//       fifth fans; with the yards braced 35 degrees the fourth mast's yard arms reach z -26 and a rolled
//       leaf's deck stands 6.4 m from the fly-through; kept for the part's own page, not flown by the world,
//     flyThrough [..] port quarter -> lane -> starboard side (the world's route rounds her stern instead),
//     viewpoints { reveal, bow, abreast, quarter }, portalSeat { position, facing } (a seat off her
//       starboard quarter for the part's own page: the world's ring is its own thing on its last leg).
//   clearancePoints(m4, leaf) -> Float32Array of world xyz of every corner of ONE leaf (0..6) AND of its shadow
//     copy, for the world's clearance table (law 3): the world asks leaf by leaf, yielding between.
//   meshes: the leaves' three instanced meshes (dispose() frees their own buffers).
//   COST: about 2,000 triangles a ship; 7 ships x 3 passes = 42k triangles in 3 draw calls; build ~15 ms.
//   No lights, no textures, no pass of its own. Assumes post flat 1, bloom 0, grade neutral.
import * as THREE from 'three';

export const LCS_PALETTE = ['#B7C2A4', '#1F2A22', '#ABB79A', '#9AA78C', '#2E8C8A', '#E8792B', '#F1C93B'];

const hexMix = (ha, hb, t) => {                  // a printed tone t of the way from one to another, in the printer's own (sRGB) numbers
  const a = parseInt(ha.slice(1), 16), b = parseInt(hb.slice(1), 16), ch = (s) => (((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t) / 255;
  return new THREE.Color().setRGB(ch(16), ch(8), ch(0), THREE.SRGBColorSpace);
};
const hexMul = (hex, f) => {                     // scale a printed tone in the printer's own (sRGB) numbers
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Color().setRGB(((n >> 16) & 255) / 255 * f, ((n >> 8) & 255) / 255 * f, (n & 255) / 255 * f, THREE.SRGBColorSpace);
};

const SEG_VERT = /* glsl */`
attribute vec4 aChain; attribute vec2 aDark; attribute vec2 aGate; attribute float aTone; attribute vec3 aShadow;
uniform float uTime, uBack; uniform vec3 uCast, uDarkCol, uGhostTone[8], uShadowTone[4], uBaseTone[4];
varying vec3 vCol;
float onAt(float i, float n, float m, float mode, float h) {
  if (i < -0.5 || i > n - 0.5) return 0.;
  if (mode > 1.5 && mode < 2.5) return 1.;
  if (mode > 0.5) { float per = max(2. * (n - 1.), 1.); float t = mod(h, per); float pos = t < n - 0.5 ? t : per - t; return abs(i - pos) < 0.5 ? 1. : 0.; }
  return mod(i - h + 0.5, max(m, 1.)) < 1. ? 1. : 0.;
}
float levelAt(float i, float n, float m, float mode, float h, float nk) {
  float on = onAt(i, n, m, mode, h);
  float nb = max(onAt(i - 1., n, m, mode, h), onAt(i + 1., n, m, mode, h));
  return max(on, nk * nb);
}
float ss(float a, float b, float x) { float t = clamp((x - a) / max(b - a, 1e-4), 0., 1.); return t * t * (3. - 2. * t); }
void main() {
  float hh = uTime * aChain.z + aChain.w;
  float h = floor(hh), f = hh - h;
  // the eighth of a second: the one coming comes in its first half, the one going goes in its second, so a
  // chain keeps its count dark at every value of the clock (one whole ship is always dark)
  float wd = (aDark.y > 2.5 ? 0.001 : 0.125) * abs(aChain.z);     // mode 3 (her leaves): a whole ship switches at once (a thousandth of a second), so no value of the clock shows her half dark
  float nk = aTone > 3.5 ? 0. : 0.05;      // the darkened neighbour: none for a far thing or a large one against the sky (a tone with the 4)
  float l0 = levelAt(aChain.x, aChain.y, aDark.x, aDark.y, h - 1., nk), l1 = levelAt(aChain.x, aChain.y, aDark.x, aDark.y, h, nk);
  float e = l1 > l0 ? ss(0., 0.5 * wd, f) : ss(0.5 * wd, wd, f);
  float d = mix(l0, l1, e);
  if (aGate.x > -0.5) {
    // THE FURL IS A RIPPLE THROUGH HER RIG: each sail is furled for 3 s of a 47 s cycle of the clock, and the sails'
    // turns are spread evenly over the whole cycle by each sail's own number (2.35 s apart), so at every value of the
    // clock at most two of her twenty sails are furled and she never stands bare
    float T = mod(uTime - aGate.x * 2.35, 47.);
    float fu = ss(0., 0.04, T) * (1. - ss(3., 3.04, T));
    d *= aGate.y > 0.5 ? fu : 1. - fu;
  }
  float ink = mod(aTone, 4.);
  int ti = clamp(int(ink + 0.5), 0, 3), gi = clamp(int(aTone + 0.5), 0, 7);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
#if PASS == 1
  vec3 bk = mat3(modelMatrix) * (mat3(instanceMatrix) * aShadow);
  wp.xyz += uCast + bk * uBack;
  vCol = mix(uBaseTone[ti], uShadowTone[ti], ss(0.5, 0.9, d));
  bool mine = d >= 0.5;
#else
  vCol = mix(uGhostTone[gi], uDarkCol, d);
  #if PASS == 0
  bool mine = d < 0.5;
  #else
  bool mine = d >= 0.5;
  #endif
#endif
  gl_Position = mine ? projectionMatrix * viewMatrix * wp : vec4(2., 2., 2., 1.);
}`;
const SEG_FRAG = /* glsl */`
varying vec3 vCol;
void main() { gl_FragColor = vec4(vCol, 1.); }`;

const PANE_VERT = /* glsl */`
attribute vec3 color; varying vec3 vCol;
void main() { vCol = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SEA_VERT = /* glsl */`
varying vec2 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SEA_FRAG = /* glsl */`
uniform vec3 uSea; varying vec2 vW;
void main() {
  // THE SEA IS PRINTED WHOLE in the sea's ink: one flat tone from the nearest water to the sea line. What lies on
  // it (foam streaks of the ground tone) is the world's own printed panes.
  gl_FragColor = vec4(uSea, 1.);
}`;

const SEG_ATTRS = { aChain: 4, aDark: 2, aGate: 2, aTone: 1, aShadow: 3 };

const GHOST = 1 - 0.07 / 3, GHOST_FAR = 0.99;      // an unlit segment: 2.3 % under its ground (a far one, or a large one against the sky, 1 %)
// the shadow copy hugs its shape as a thin drop shadow: CAST m toward +X and down, BACK m along the shape's back vector
const CAST = 0.17, BACK = 0.2;
export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7) ? opts.palette : LCS_PALETTE;
  const C = (h) => new THREE.Color(h);
  const std = hex[0].toUpperCase() === LCS_PALETTE[0];      // a different ground keeps ghost 2.3 % and shadow 15 % under it
  const palette = {
    ground: C(hex[0]), dark: C(hex[1]),
    // THE UNLIT TONE IS A WHISPER: two thirds of the way from the brief's ghost to the ground it stands on: about
    // 2 % under the standard ground (a mix of the brief's ghost), 2.3 % under any other and on every ink (GHOST of
    // the tone; GHOST_FAR, 1 %, for a far thing or a large one against the sky)
    ghost: std ? hexMix(hex[2], hex[0], 2 / 3) : hexMul(hex[0], GHOST), ghostFar: hexMul(hex[0], GHOST_FAR),
    shadow: std ? C(hex[3]) : hexMul(hex[0], 0.85),
    teal: C(hex[4]), orange: C(hex[5]), yellow: C(hex[6]),
  };
  palette.inks = [palette.teal, palette.orange, palette.yellow];
  const inkHex = [hex[4], hex[5], hex[6]];
  const ghostTone = [palette.ghost, ...inkHex.map((h) => hexMul(h, GHOST)), palette.ghostFar, ...inkHex.map((h) => hexMul(h, GHOST_FAR))];
  const shadowTone = [palette.shadow, ...inkHex.map((h) => hexMul(h, 0.78))];
  const baseTone = [palette.ground, ...palette.inks];
  const uniforms = {
    uTime: { value: 0 }, uBack: { value: BACK }, uCast: { value: new THREE.Vector3(CAST, -CAST, 0) },
    uDarkCol: { value: palette.dark }, uGhostTone: { value: ghostTone }, uShadowTone: { value: shadowTone },
    uBaseTone: { value: baseTone }, uGround: { value: palette.ground }, uSea: { value: palette.teal },
  };
  const RO = { under: 0.5, underShadow: 0.6, sea: 0.9, pane: 1, ghost: 10, shadow: 11, dark: 12 };   // the sea is a printed pane: it covers every free-standing ghost and shadow copy that has water behind it
  const segMat = (pass) => new THREE.ShaderMaterial({
    uniforms, vertexShader: SEG_VERT, fragmentShader: SEG_FRAG, defines: { PASS: pass },
    side: THREE.DoubleSide, depthTest: true, depthWrite: pass === 2, fog: false, toneMapped: false,
  });
  const materials = { ghost: segMat(0), shadow: segMat(1), dark: segMat(2) };
  materials.pane = new THREE.ShaderMaterial({
    vertexShader: PANE_VERT, fragmentShader: SEG_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2,
  });
  materials.sea = new THREE.ShaderMaterial({
    uniforms, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, fog: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4,
  });

  // ---- shapes: flat outlines in the XY plane, normal +Z ---------------------------------------------------
  function shape(pts, holes = []) {
    const v2 = (a) => a.map((p) => new THREE.Vector2(p[0], p[1]));
    const con = v2(pts), hs = holes.map(v2);
    const tris = THREE.ShapeUtils.triangulateShape(con, hs);
    const all = con.concat(...hs), pos = new Float32Array(all.length * 3);
    all.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(tris.flat());
    return g;
  }
  // a crest: a chevron w wide, h tall at the peak, limbs t thick (measured up the page), feet at y 0
  const chevron = (w = 4.5, h = 1.3, t = 0.55) => shape([[-w / 2, 0], [0, h - t], [w / 2, 0], [w / 2, t], [0, h], [-w / 2, t]]);
  // a lozenge: a bar with pointed ends, w long and h deep, centred
  const lozenge = (w = 1.8, h = 0.5) => { const a = w / 2, b = h / 2, c = Math.max(a - b, 0); return shape([[-a, 0], [-c, -b], [c, -b], [a, 0], [c, b], [-c, b]]); };
  const bar = (w = 1, h = 1) => shape([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);

  // ---- segments: one geometry, many stations, three passes on the same buffers ----------------------------
  let batches = 0;                                 // a counter of batches: the under passes of each batch are drawn a hair after those of the batch before
  function segments(geometry, max, o = {}) {
    const hair = (batches++) * 1e-4;
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = geometry.index;
    for (const k in geometry.attributes) geo.setAttribute(k, geometry.attributes[k]);
    const inst = {};
    for (const k in SEG_ATTRS) {
      if (geometry.attributes[k]) continue;
      inst[k] = new THREE.InstancedBufferAttribute(new Float32Array(max * SEG_ATTRS[k]), SEG_ATTRS[k]);
      geo.setAttribute(k, inst[k]);
    }
    const group = new THREE.Group(); group.name = o.name || 'segments';
    const meshes = ['ghost', 'shadow', 'dark'].map((p) => {
      const m = new THREE.InstancedMesh(geo, materials[p], max);
      m.renderOrder = o.over || p === 'dark' ? RO[p] : (p === 'ghost' ? RO.under : RO.underShadow) + hair; m.name = group.name + ':' + p; m.matrixAutoUpdate = true;
      group.add(m); return m;
    });
    meshes[1].instanceMatrix = meshes[0].instanceMatrix; meshes[2].instanceMatrix = meshes[0].instanceMatrix;
    let n = 0;
    const DEF = { chain: [0, 1, 0, 0], dark: [1, 2], gate: [-1, 0], back: [0, 0, -1] };
    function add(matrix, s = {}) {
      if (n >= max) return -1;
      meshes[0].setMatrixAt(n, matrix);
      const ch = s.chain || DEF.chain, dk = s.dark || DEF.dark, gt = s.gate || DEF.gate, bk = s.back || DEF.back;
      if (inst.aChain) inst.aChain.setXYZW(n, ch[0], ch[1], ch[2], ch[3]);
      if (inst.aDark) inst.aDark.setXY(n, dk[0], dk[1]);
      if (inst.aGate) inst.aGate.setXY(n, gt[0], gt[1]);
      if (inst.aTone) inst.aTone.setX(n, s.tone || 0);
      if (inst.aShadow) inst.aShadow.setXYZ(n, bk[0], bk[1], bk[2]);
      return n++;
    }
    function finish() {
      geo.instanceCount = n;
      for (const m of meshes) { m.count = n; }
      meshes[0].computeBoundingSphere();
      const bs = meshes[0].boundingSphere; bs.radius += 2;          // room for the shadow copy
      meshes[1].boundingSphere = bs; meshes[2].boundingSphere = bs;
      return group;
    }
    return { group, meshes, add, finish, get count() { return n; } };
  }

  // ---- panes: printed ink, one merged unlit mesh ----------------------------------------------------------
  function panes(name = 'panes') {
    const pos = [], col = [], idx = [];
    const push = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); };
    const api = {
      quad(a, b, c, d, color) { const o = pos.length / 3; push(a, color); push(b, color); push(c, color); push(d, color); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); return api; },
      // a flat polygon given as 3D points in order (convex, or star-shaped about its first point)
      poly(pts, color) { const o = pos.length / 3; for (const p of pts) push(p, color); for (let i = 1; i < pts.length - 1; i++) idx.push(o, o + i, o + i + 1); return api; },
      build() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
        g.setIndex(idx);
        const m = new THREE.Mesh(g, materials.pane); m.renderOrder = RO.pane; m.name = name;
        return m;
      },
    };
    return api;
  }
  function sea(size = 4000) {
    const g = new THREE.PlaneGeometry(size, size); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, materials.sea); m.renderOrder = RO.sea; m.name = 'sea';
    return m;
  }
  return {
    palette, uniforms, materials, RO, shape, chevron, lozenge, bar, segments, panes, sea,
    update(dt, time) { uniforms.uTime.value = time; },      // the world's clock, and nothing else
  };
}

// ============================================================================================================
// THE BARQUE. One ship is drawn as flat outlines in two kinds of plane: the keel plane (local YZ, written
// as [z, y]) and planes across her (local XY at a station z, turned by the brace angle about the mast).
// Every part carries, per vertex, its gate (sail number, set or furled) and its back vector (to starboard
// for shapes in the keel plane, aft for shapes across her), so ONE geometry holds the whole ship and seven
// instances rolled about the keel line make the seven leaves.
// ============================================================================================================
const MASTS = [                 // z of the foot, height of the truck, lower-yard length (0 = fore-and-aft rigged)
  { z: 42, top: 66, yard: 28 }, { z: 22, top: 70, yard: 28 }, { z: 2, top: 70, yard: 28 },
  { z: -18, top: 67, yard: 28 }, { z: -42, top: 58, yard: 0 },
];
const BRACE = 35 * Math.PI / 180;       // braced sharp up: broad from her port bow, nearly edge-on from her port quarter
const RING_GAP = 2.6, SEAM = 1.7;      // metres of ground between her sail tiers (as rings in the fan) and between cloths
const STEM_Z = 56, STERN_Z = -54, TIP = [79, 17];     // [z, y]
const sheer = (z) => 9 + 1.3 * Math.pow(Math.max(0, (z - 20) / 36), 2) + 0.5 * Math.pow(Math.max(0, (-z - 30) / 24), 2);

function shipPen(style) {
  const pos = [], gate = [], back = [], idx = [];
  // keel-plane part: pts [[z, y], ...]; back = to starboard (-X)
  function keel(pts, holes = [], g = [-1, 0], x = 0) {
    const geo = style.shape(pts, holes), p = geo.attributes.position, o = pos.length / 3;
    for (let i = 0; i < p.count; i++) { pos.push(x, p.getY(i), p.getX(i)); gate.push(g[0], g[1]); back.push(-1, 0, 0); }
    const ix = geo.index.array; for (let i = 0; i < ix.length; i++) idx.push(o + ix[i]);
    geo.dispose();
  }
  // across part: pts [[x, y], ...] in a plane through (0, *, z0) turned by ang about the vertical; back = aft
  function across(pts, z0, ang = 0, holes = [], g = [-1, 0]) {
    const geo = style.shape(pts, holes), p = geo.attributes.position, o = pos.length / 3;
    const c = Math.cos(ang), s = Math.sin(ang);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); pos.push(x * c, p.getY(i), z0 + x * s); gate.push(g[0], g[1]); back.push(s, 0, -c); }
    const ix = geo.index.array; for (let i = 0; i < ix.length; i++) idx.push(o + ix[i]);
    geo.dispose();
  }
  // level part (the deck): pts [[x, z], ...] at height y; back = none ([0,0,0]: the copy is moved by the cast alone)
  function level(pts, y, holes = []) {
    const geo = style.shape(pts, holes), p = geo.attributes.position, o = pos.length / 3;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), y, p.getY(i)); gate.push(-1, 0); back.push(0, 0, 0); }
    const ix = geo.index.array; for (let i = 0; i < ix.length; i++) idx.push(o + ix[i]);
    geo.dispose();
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aGate', new THREE.BufferAttribute(new Float32Array(gate), 2));
    g.setAttribute('aShadow', new THREE.BufferAttribute(new Float32Array(back), 3));
    g.setIndex(idx);
    return g;
  }
  return { keel, across, level, geometry, pos, back };
}

const stemZ = (y) => 51.5 + 4.5 * Math.pow(Math.max(y, 0) / 10, 1.6);          // a clipper stem, hollow below
const sternZ = (y) => -47 - 7 * Math.pow(Math.max(y, 0) / 9.5, 0.7);           // a counter stern
const spritY = (z) => 10 + 7 * (z - STEM_Z) / (TIP[0] - STEM_Z);               // the bowsprit's centre line

function drawHull(pen, ed) {
  // a strake: a band of the profile between two height functions, ends following stem and stern
  const strake = (yb, yt, holes = []) => {
    const pts = [], N = 26;
    const zb0 = sternZ(yb(-50)), zb1 = stemZ(yb(54)), zt0 = sternZ(yt(-50)), zt1 = stemZ(yt(54));
    for (let i = 0; i <= N; i++) { const z = zb0 + (zb1 - zb0) * i / N; pts.push([z, yb(z)]); }
    for (let i = 1; i < 4; i++) { const y = yb(54) + (yt(54) - yb(54)) * i / 4; pts.push([stemZ(y), y]); }
    for (let i = N; i >= 0; i--) { const z = zt0 + (zt1 - zt0) * i / N; pts.push([z, yt(z)]); }
    for (let i = 3; i > 0; i--) { const y = yb(-50) + (yt(-50) - yb(-50)) * i / 4; pts.push([sternZ(y), y]); }
    pen.keel(pts, holes);
  };
  const butts = [];                                                             // the boot is laid in plates: butts 0.7 m wide
  for (let z = -37; z <= 47; z += 12) butts.push([[z - 0.35, 0.55], [z + 0.35, 0.55], [z + 0.35, 2.5], [z - 0.35, 2.5]]);
  strake(() => 0, () => 3.0, butts);                                            // the boot
  const ports = [];                                                             // painted ports: holes in the glass
  if (ed.ports) for (let z = -44; z <= 46; z += 5) { const y = 4.6 + (sheer(z) - 9) * 0.45; ports.push([[z - 0.9, y], [z + 0.9, y], [z + 0.9, y + 1.15], [z - 0.9, y + 1.15]]); }
  if (ed.ports) strake(() => 4.0, (z) => sheer(z) - 2.7, ports);               // the port strake
  else { strake(() => 4.0, () => 4.85); strake(() => 5.5, (z) => sheer(z) - 2.7); }   // or two plain strakes
  strake((z) => sheer(z) - 1.7, (z) => sheer(z) - 0.95);                       // the bulwark, and over it,
  strake((z) => sheer(z) - 0.45, (z) => sheer(z));                             // with glass between, the rail
  // houses on deck, in the keel plane, each with windows; none in the lane (z -41.4 .. -23.4)
  const house = (z0, z1, h, nw) => {
    const y0 = sheer((z0 + z1) / 2) + 0.35, wh = [];
    for (let i = 0; i < nw; i++) { const zc = z0 + (z1 - z0) * (i + 0.5) / nw; wh.push([[zc - 0.7, y0 + h - 1.6], [zc + 0.7, y0 + h - 1.6], [zc + 0.7, y0 + h - 0.6], [zc - 0.7, y0 + h - 0.6]]); }
    pen.keel([[z0, y0], [z1, y0], [z1, y0 + h], [z0 + 0.6, y0 + h], [z0, y0 + h - 0.6]], wh);
  };
  house(27, 37, 3.0, 3); house(7, 17, 3.0, 3); house(-13, -3, 3.0, 3); house(-52, -45, 2.6, 2);
  // a boat on skids abaft each of the first two houses
  for (const z of [20.2, 0.2]) { const y = sheer(z) + 1.6; pen.keel([[z + 3, y + 1.1], [z + 6.6, y + 1.1], [z + 6, y], [z + 3.6, y]]); }
  // bowsprit, tapering to the tip, and the dolphin striker under it
  pen.keel([[STEM_Z - 3, 9.2], [TIP[0], TIP[1] - 0.3], [TIP[0], TIP[1] + 0.3], [STEM_Z - 3, 10.6]]);
  pen.keel([[66.2, spritY(66.2)], [67.0, spritY(67)], [67.4, spritY(67) - 4.6], [66.8, spritY(67) - 4.6]]);
  // the deck sheet, 14 m wide, with three hatches, and nine ribs across her
  const beam = (z) => 7 * Math.min(1, Math.pow(Math.max(0, (53.5 - z) / 26), 0.7), 0.5 + 0.5 * Math.min(1, Math.max(0, (z + 52) / 8)));
  const deck = [];
  for (let i = 0; i <= 24; i++) { const z = -52 + 105.5 * i / 24; deck.push([-beam(z), z]); }
  for (let i = 23; i >= 0; i--) { const z = -52 + 105.5 * i / 24; deck.push([beam(z), z]); }
  // the sheet is laid in five strakes of planking 2.16 m wide with 0.8 m of glass between them, the middle one
  // open at three hatches: seen from above a dark leaf's deck is a drawing of planks and never one flat dark sheet
  const plank = (a, b, z0, z1) => {
    const L = [], R = [], N = Math.max(2, Math.ceil((z1 - z0) / 3));
    for (let i = 0; i <= N; i++) {
      const z = z0 + (z1 - z0) * i / N, bm = beam(z), l = Math.max(a, -bm), r = Math.min(b, bm);
      if (r - l < 0.5) continue;
      L.push([l, z]); R.push([r, z]);
    }
    if (L.length > 1) pen.level(L.concat(R.reverse()), 8.2);
  };
  // each strake is laid in planks 8.4 m long with 0.8 m of glass at the butts, the butts stepped from strake to
  // strake, so a dark leaf's deck seen from above is a drawing of planking and never five long bars
  const laid = (a, z0, z1, j) => { for (let z = z0 - ((j * 3.7) % 9.2); z < z1; z += 9.2) { const p0 = Math.max(z, z0), p1 = Math.min(z + 8.4, z1); if (p1 - p0 > 1.5) plank(a, a + 2.16, p0, p1); } };
  [-7, -4.04, 1.88, 4.84].forEach((a, j) => laid(a, -52, 53.5, j));
  for (const [z0, z1] of [[-52, -10.5], [-5.5, 9.5], [14.5, 29.5], [34.5, 53.5]]) laid(-1.08, z0, z1, 4);
  for (let k = -4; k <= 4; k++) {
    const z = k * 11, b = beam(z), pts = [], xo = (y) => b * Math.pow(y / 8.2, 0.45);
    for (let i = 0; i <= 7; i++) { const y = 8.2 * (1 - i / 7); pts.push([-xo(y), y]); }
    for (let i = 6; i >= 0; i--) { const y = 8.2 * (1 - i / 7); pts.push([xo(y), y]); }
    for (let i = 0; i <= 6; i++) { const y = 8.2 - (8.2 - 1.2) * i / 6; pts.push([Math.max(xo(y) - 0.9, 0.3), y]); }
    for (let i = 6; i >= 0; i--) { const y = 8.2 - (8.2 - 1.2) * i / 6; pts.push([-Math.max(xo(y) - 0.9, 0.3), y]); }
    pen.across(pts, z, 0);
  }
}

// a seam: a slit w m wide cut in a sheet from a toward b (the glass shows through), stopping short of both edges
function slit(a, b, t0 = 0.1, t1 = 0.9, w = 0.6) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.max(Math.hypot(dx, dy), 1e-3), nx = -dy / l * w / 2, ny = dx / l * w / 2;
  const p = [a[0] + dx * t0, a[1] + dy * t0], q = [a[0] + dx * t1, a[1] + dy * t1];
  return [[p[0] - nx, p[1] - ny], [q[0] - nx, q[1] - ny], [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]];
}

function drawRig(pen, ed) {
  const BR = BRACE * ed.tack;
  const YARD_Y = [26, 40, 52, 62], YARD_L = [28, 25, 21, 17];
  MASTS.forEach((m, mi) => {
    // the mast: two crossed strips 1.0 m wide at the foot, tapering above the topgallant yard, with a truck on top
    const T = m.top, strip = [[-0.5, 7.6], [0.5, 7.6], [0.42, T * 0.72], [0.3, T - 0.8], [0.9, T - 0.4], [0, T], [-0.9, T - 0.4], [-0.3, T - 0.8], [-0.42, T * 0.72]];
    pen.keel(strip.map((p) => [m.z + p[0], p[1]]));
    pen.across(strip, m.z, 0);
    if (!m.yard) return;
    const s = T / 70;
    for (let t = 0; t < 4; t++) {
      const y = YARD_Y[t] * s, L = YARD_L[t] * (m.yard / 28), hw = L / 2 - 0.9, sail = ed.byMast ? mi * 4 + (3 - t) : (3 - t) * 4 + mi;
      // the yard: a spar with pointed arms, dark with the ship
      pen.across([[-L / 2, y], [-L / 2 + 1.6, y - 0.4], [L / 2 - 1.6, y - 0.4], [L / 2, y], [L / 2 - 1.6, y + 0.4], [-L / 2 + 1.6, y + 0.4]], m.z, BR);
      // set: a wide shallow sheet in cloths. THE FOOT IS AN ARC ABOUT THE KEEL LINE, RING_GAP m clear above the reach
      // of the yard below: so the tiers of all seven leaves, rolled about that line, leave rings of ground
      // between them and the fan reads as ribs (masts) and bands (tiers), never as one filled disc
      const yb = t === 0 ? 0 : YARD_Y[t - 1] * s, Lb = t === 0 ? 0 : YARD_L[t - 1] * (m.yard / 28);
      const Rf = Math.hypot(yb + 0.4, Lb / 2) + RING_GAP, hb = t === 0 ? hw + 0.3 : Math.min(Lb / 2 - 0.9, hw + 1.6);
      const foot = (x) => (t === 0 ? 15.6 + 1.5 * (1 - (x / hb) * (x / hb)) : Math.sqrt(Math.max(Rf * Rf - x * x, 1)));
      const yf = foot(hb);
      const set = [[-hw, y - 0.75], [-(hw + hb) / 2 + 0.25, (y + yf) / 2]];
      for (let i = 0; i <= 8; i++) { const x = -hb + 2 * hb * i / 8; set.push([x, foot(x)]); }
      set.push([(hw + hb) / 2 - 0.25, (y + yf) / 2], [hw, y - 0.75]);
      const seams = [], NC = Math.max(3, Math.round(L / 4.2));        // cloths: seams from head to foot, SEAM m of glass
      for (let j = 1; j < NC; j++) { const u = j / NC, x = -hb + 2 * hb * u; seams.push(slit([-hw + 2 * hw * u, y - 0.75], [x, foot(x)], 0.08, 0.88, SEAM)); }
      pen.across(set, m.z, BR, seams, [sail, 0]);
      // furled: a bar on its yard, gathered in four bunts
      const fur = [[-hw, y - 0.75]];
      for (let i = 0; i <= 16; i++) { const u = i / 16; fur.push([-hw + 2 * hw * u, y - 0.95 - 1.25 * Math.abs(Math.sin(Math.PI * 4 * u))]); }
      fur.push([hw, y - 0.75]);
      pen.across(fur, m.z, BR, [], [sail, 1]);
    }
  });
  // head stays (0.5 m strips) and the two jibs in the keel plane, set and furled
  const stay = (a, b) => pen.keel([[a[0], a[1] - 0.25], [b[0], b[1] - 0.25], [b[0], b[1] + 0.25], [a[0], a[1] + 0.25]]);
  stay([42.4, 51], [78.6, 17.3]); stay([42.4, 39.5], [66.5, 13.6]);
  pen.keel([[77.0, 18.2], [63.5, 31.6], [50.6, 44.4], [53.6, 34.6], [58.6, 25.8], [67.5, 21.2]], [slit([58.6, 25.8], [63.5, 31.6], 0.14, 0.86)], [16, 0]);          // outer jib
  pen.keel([[65.2, 14.4], [45.0, 37.0], [45.6, 25], [46.2, 14.8], [55.5, 13.9]], [slit([46.2, 14.8], [55.1, 25.7], 0.12, 0.88)], [17, 0]);                            // inner jib
  const onSprit = (z0, z1) => { const p = [[z0, spritY(z0) + 0.5]]; for (let i = 0; i <= 8; i++) { const z = z0 + (z1 - z0) * i / 8; p.push([z, spritY(z) + 0.7 + 1.0 * Math.abs(Math.sin(Math.PI * 2 * i / 8))]); } p.push([z1, spritY(z1) + 0.5]); return p.reverse(); };
  pen.keel(onSprit(68.5, 77.5), [], [16, 1]);
  pen.keel(onSprit(58.5, 66.5), [], [17, 1]);
  // the fifth mast: boom, gaff, spanker and gaff topsail, set and brailed to the mast
  const z5 = MASTS[4].z - 0.6;
  // (boom and gaff begin 0.8 m abaft the brail line, the set sails 1.8 m: a hairline of ground, so the sail is its own shape)
  pen.keel([[z5 - 0.8, 13.2], [z5 - 0.8, 13.9], [-63, 15.0], [-63.6, 14.6], [-63, 14.3]]);                                            // boom
  pen.keel([[z5 - 0.8, 35.6], [z5 - 0.8, 36.3], [-58.4, 43.6], [-59, 43.1], [-58.4, 42.8]]);                                          // gaff
  // spanker: one sheet in five cloths, four seams 0.9 m wide from the foot toward the gaff that stop short of both,
  // so its whole outline (luff, gaff, slanting leech, boom) is one sail and never a blank sheet nor a row of bars
  pen.keel([[z5 - 1.8, 15.0], [-52, 15.3], [-62, 15.9], [-60, 29], [-57.4, 41.6], [z5 - 1.8, 35.0]],
    [-47.3, -50.2, -53.1, -56.0].map((z) => slit([z, 15.0 + 0.05 * (z5 - 1.8 - z)], [z - 0.4, 35.0 + 0.5 * (z5 - 1.8 - z)], 0.08, 0.9, 0.9)), [19, 0]);
  pen.keel([[z5 - 1.8, 37.4], [-56.6, 44.0], [-50.5, 49], [z5 - 1.8, 55]], [slit([-48.2, 39.6], [-45.6, 52.6], 0.14, 0.86, 1.0), slit([-52.6, 42.4], [-49.6, 48.4], 0.14, 0.8, 1.0)], [18, 0]);                                       // gaff topsail
  const brail = (y0, y1, w) => { const p = [[z5, y0]]; for (let i = 0; i <= 8; i++) { const y = y0 + (y1 - y0) * i / 8; p.push([z5 - 0.5 - w * Math.abs(Math.sin(Math.PI * 2 * i / 8)), y]); } p.push([z5, y1]); return p; };
  pen.keel(brail(15, 35, 1.5), [], [19, 1]);
  pen.keel(brail(37.4, 52, 1.1), [], [18, 1]);
}

const ROLLS = [-30, -20, -10, 0, 10, 20, 30];

export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  const rng = ctx.rng;
  const object = new THREE.Group(); object.name = 'liquid-crystal-squall:barque';

  // ---- one ship, drawn once ---------------------------------------------------------------------------------
  const pen = shipPen(style);
  // the edition, chosen once at build: whether her ports are painted. The order her sails furl in is fixed, mast
  // by mast from forward, and so is the tack; the draws are still made
  const er = rng.fork('barque');                    // one draw from ctx.rng; no branch on the seed's own value
  // (her yards are braced on the one tack that shows the sails broad from her port bow, where the route comes
  // from, and nearly edge-on from her port quarter, which the route rounds: the draw is still made)
  const ed = { drawn: (er() < 0.5 ? -1 : 1), tack: -1, byMast: (er.chance(0.4), true), ports: er.chance(0.7) };
  drawHull(pen, ed);
  await ctx.yield();
  drawRig(pen, ed);
  await ctx.yield();
  const shipGeo = pen.geometry();
  // ---- seven leaves: the same ship rolled about her keel line; one dark, stepping there and back ------------
  const leaves = style.segments(shipGeo, 7, { name: 'barque' });
  const M = new THREE.Matrix4(), rolls = [];
  for (let i = 0; i < 7; i++) {
    M.makeRotationZ(ROLLS[i] * Math.PI / 180); rolls.push(M.clone());
    leaves.add(M, { chain: [i, 7, 2, 0.23], dark: [7, 3], tone: 4 });      // tone 4: her unlit leaves are the faintest the glass has, with no darkened neighbour
  }
  object.add(leaves.finish());
  await ctx.yield();

  // ---- sample points for the world's clearance table: corners, and edges cut every 3 m ----------------------
  const P = pen.pos, B = pen.back, ix = shipGeo.index.array, samp = [], seen = new Set();
  for (let i = 0; i < P.length; i += 3) samp.push(P[i], P[i + 1], P[i + 2], B[i], B[i + 1], B[i + 2]);
  for (let t = 0; t < ix.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = ix[t + e], b = ix[t + (e + 1) % 3], key = a < b ? a * 65536 + b : b * 65536 + a;
      if (seen.has(key)) continue; seen.add(key);
      const dx = P[b * 3] - P[a * 3], dy = P[b * 3 + 1] - P[a * 3 + 1], dz = P[b * 3 + 2] - P[a * 3 + 2];
      const n = Math.floor(Math.hypot(dx, dy, dz) / 3);
      for (let k = 1; k <= n; k++) { const f = k / (n + 1); samp.push(P[a * 3] + dx * f, P[a * 3 + 1] + dy * f, P[a * 3 + 2] + dz * f, B[a * 3], B[a * 3 + 1], B[a * 3 + 2]); }
    }
    if (t % 1500 === 0) await ctx.yield();
  }
  const nS = samp.length / 6;
  function clearancePoints(matrixWorld, leaf) {             // one leaf at a time (0..6)
    const out = new Float32Array(nS * 6), v = new THREE.Vector3(), w = new THREE.Vector3(), m = new THREE.Matrix4();
    const cast = style.uniforms.uCast.value, backLen = style.uniforms.uBack.value;
    let o = 0;
    {
      const r = Math.min(6, Math.max(0, leaf | 0));
      m.multiplyMatrices(matrixWorld, rolls[r]);
      for (let i = 0; i < nS; i++) {
        v.set(samp[i * 6], samp[i * 6 + 1], samp[i * 6 + 2]).applyMatrix4(m);
        w.set(samp[i * 6 + 3], samp[i * 6 + 4], samp[i * 6 + 5]).transformDirection(m).multiplyScalar(backLen);
        out[o++] = v.x; out[o++] = v.y; out[o++] = v.z;
        out[o++] = v.x + cast.x + w.x; out[o++] = v.y + cast.y + w.y; out[o++] = v.z + cast.z + w.z;
      }
    }
    return out;
  }

  // ---- the part's own stage (never built when the world passes its own style) -------------------------------
  let stage = null;
  if (opts.stage ?? !opts.style) stage = await buildStage(ctx, style, detail, object);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    midships: V(0, 0, 0), stem: V(0, 10, STEM_Z), bowspritTip: V(0, TIP[1], TIP[0]), sternTip: V(0, 9.5, STERN_Z),
    rollAxis: { point: V(0, 0, 0), dir: V(0, 0, 1) },
    mastFeet: MASTS.map((m) => V(0, 9, m.z)), trucks: MASTS.map((m) => V(0, m.top, m.z)),
    lane: { center: V(0, 17, -32.4), dir: V(-1, 0, 0), halfWidth: 9, floor: 11.5, zAft: -41.4, zFore: -23.4 },
    flyThrough: [V(52, 15, -58), V(42, 16.5, -40), V(29.5, 17, -32.4), V(0, 17, -32.4), V(-24.6, 17, -32.4), V(-48, 15, -30)],
    viewpoints: { reveal: V(-18, 7, 156), bow: V(-2, 7, 123), abreast: V(18, 7, 79), quarter: V(29.5, 17, -32.4) },
    portalSeat: { position: V(-80, 9, -32.4), facing: V(1, 0, 0) },
  };
  return {
    object, radius: 80, height: 70, center: V(0, 30, 6), anchors, style, clearancePoints,
    sailCycle: 47, sailFurled: 3, rollStep: 0.5, edition: ed, meshes: leaves.meshes,
    ground: false, groundY: 0,
    update(dt, time) { style.update(dt, time); },      // the clock only: no u, no camera
    dispose() { if (stage) stage.dispose(); for (const m of leaves.meshes) m.dispose(); },
  };
}

// ---- the part's own stage: a little sea, foam, crests and rain made with the same kit, for when it stands alone.
// The world builds its own sea, foam, crests and rain and never calls this. ------------------------------------
async function buildStage(ctx, style, detail, object) {
  const g = new THREE.Group(); g.name = 'stage';
  const back = new THREE.Mesh(new THREE.SphereGeometry(2600, 16, 8), new THREE.ShaderMaterial({
    uniforms: style.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uGround; void main(){ gl_FragColor = vec4(uGround, 1.); }' }));
  back.renderOrder = -0.5; back.frustumCulled = false; g.add(back);
  g.add(style.sea(5200));
  const pn = style.panes('stage-foam'), foam = style.palette.ground;
  for (let z = -322; z <= 322; z += 28) {        // foam streaks of the ground tone on the printed sea: level dashes 1.6 m wide every 28 m
    const o = 60 * Math.sin(z * 1.7);
    for (let x = -420 + o; x < 400; x += 150) pn.quad([x, 0.15, z], [x + 70, 0.15, z], [x + 70, 0.15, z + 1.6], [x, 0.15, z + 1.6], foam);
  }
  g.add(pn.build());
  // crest columns: five stations, one dark, twice a second; the phase is a formula of the place, so the dark
  // crests travel as wave lines. None within 12 m of her keel.
  const R = 150 + 60 * detail, cols = [];
  for (let iz = -24; iz <= 24; iz++) for (let ix = -30; ix <= 30; ix++) {
    const x = ix * 9 + (iz & 1) * 4.5, z = iz * 12 + 3;
    if (x * x + z * z > R * R) continue;
    if (Math.abs(x) < 12 + 2.25 && z > STERN_Z - 14 && z < TIP[0] + 14) continue;
    cols.push([x, z]);
  }
  const crests = style.segments(style.chevron(4.5, 1.3, 0.55), cols.length * 5, { name: 'stage-crests' });
  const M = new THREE.Matrix4();
  for (let c = 0; c < cols.length; c++) {
    const [x, z] = cols[c], sq = Math.max(0, 1 - Math.hypot(x / 150, z / 100)), gap = 0.6 + 1.2 * sq;
    const p = Math.floor((x * 0.5 + z * 0.86) / 12);            // wave lines 12 m apart, 30 degrees off the course
    for (let i = 0; i < 5; i++) { M.makeTranslation(x, 1.2 + i * gap, z); crests.add(M, { chain: [i, 5, 2, p], dark: [5, 0] }); }
    if (c % 100 === 99) await ctx.yield();
  }
  g.add(crests.finish());
  // rain columns: nine lozenges 1.8 by 0.5 m standing 2.4 m apart from 2 to 21 m up, falling one station
  // three times a second; one, two or three dark by distance from the squall's centre
  const rcols = [];
  for (let iz = -9; iz <= 9; iz++) for (let ix = -9; ix <= 9; ix++) {
    const x = ix * 14 + (iz & 1) * 7 + 3, z = iz * 14, d = Math.hypot(x / 150, z / 100);
    if (d > 1 || Math.abs(x) < 16 || ((ix * 7 + iz * 13) & 3) === 0) continue;
    rcols.push([x, z, d]);
  }
  const loz = style.lozenge(1.8, 0.5); loz.rotateZ(Math.PI / 2);
  const rain = style.segments(loz, rcols.length * 9, { name: 'stage-rain' });
  for (let c = 0; c < rcols.length; c++) {
    const [x, z, d] = rcols[c], k = d < 0.35 ? 3 : d < 0.7 ? 2 : 1, p = x * 0.37 + z * 0.61;
    for (let i = 0; i < 9; i++) { M.makeTranslation(x, 2 + i * 2.4, z); rain.add(M, { chain: [i, 9, -3, p], dark: [9 / k, 0] }); }
  }
  g.add(rain.finish());
  object.add(g);
  return { dispose() { for (const b of [crests, rain]) for (const m of b.meshes) m.dispose(); } };
}
