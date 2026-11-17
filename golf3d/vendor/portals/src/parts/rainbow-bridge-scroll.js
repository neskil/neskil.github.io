// THE SCROLL AT RAINBOW BRIDGE: hero set piece "The Rainbow Bridge with our mast still up".
//
// One woven-timber arch with no pier, drawn as a Song ruled-line painting (jiehua): flat unlit washes and one
// warm black ink line of constant screen width. Five bundles of round logs in two interlocked polygons (a
// three-segment and a four-segment chain) lashed with ruled rope to five transverse tie logs whose ends
// stand out of both faces; four heavy squared beams with stepped bracket ends carry the soffit; plank deck,
// lattice rails, stone abutments with mooring posts, steps and wind-vane poles. On the deck a double row of
// stalls and 40 parasols leave a 6 m lane jammed with dab-figures, a sedan chair meeting a donkey train at
// the crown, and 300 dabs lean on the upstream rail and surge to the middle as the barge comes. The barge
// (25 m, bipod mast in a tabernacle with a striped pennant at its head, mat cabin, crutch, rudder, poles) is part of the piece: its mast drops
// forward in three checked falls and clears the first beam by a metre, a rope uncoils from the rail, poles
// fend off the abutment and an upstream barge sheers away.
//
// AXES     Origin = water level under the crown. +Y up. FRONT = +Z = UPSTREAM (the camera arrives from +Z
//          and travels toward -Z). +X = right bank. To seat it in the brief's world frame (X downstream):
//          hero.object.position.set(161, 0, 0); hero.object.rotation.y = -Math.PI / 2.
// SIZE     radius ~36 m (deck and ramps x -33..33, quays z -22..22), height ~18 m (vane poles), clear
//          span 40 m, deck 14 m wide, soffit 9.0 m above water at the crown, deck crown 11.0 m,
//          embankments 3 m above water. Everything is the brief's 1.8x enlargement (a dab is 2.8 m tall).
// COST     ~23k triangles, 9 draw calls (static bridge 1, crowd 1, our barge 2, sheering barge 2, skiff 1,
//          ink ribbons 1, silk underlay 1 when on), build ~100-170 ms, no lights, no textures.
// SEED     stall kinds and order, parasols, banners, cloths over the rails, slung baskets, which quay has the
//          steps and ladders, vane pole heights, which side the upstream barge sheers to, and on about half
//          the seeds a string of plain pennants across each bridge head.
// LIGHTING none. Every material is an unlit ShaderMaterial that writes the palette hexes as linear colour:
//          it wants post { flat: 1, bloom 0, saturation 1, contrast 1, vignette 0, grain 0 } and silk around
//          it. The notional light (upper left on the approach: -X +Y +Z) is baked: faces turned from it take
//          the grey wash, others ochre or bare silk. Scene fog is honoured (fog chunks); in addition the
//          lines and washes fade to bare silk between opts.fadeNear and opts.fadeFar (160 / 220 m).
// OPTS     palette   7 hex strings in the brief's order (silk, pale silk, ink, grey wash, ochre, green, vermilion)
//          underlay  true (default): include the hero's own patch of aged silk: river with sliding ruled flow
//                    lines and whorls at the abutments, bank tops, one stamped collector's seal. Pass false
//                    in the world (its own silk ribbon draws the river).
//          barge     true (default): include our barge, driven by progress. hero.barge.object can be
//                    re-parented to the camera frame; pass false if the world builds its own.
//          progress  initial progress (default: demo loop on time until setProgress is first called)
//          linePx    ink line width in pixels at 720p (default 1.9; scaled with the drawing buffer)
//          fadeNear, fadeFar  distance fade to silk (default 160, 220)
// PROGRESS hero.setProgress(p), p 0..1 = the barge's run through the piece: the barge (and camera) centre is at
//          local z = 62 - 107 p (anchors.progressAt(z) inverts it). 0.18-0.40 the mast falls in three
//          checked drops to 22 degrees, 13 degrees to port; 0.15-0.55 the rail crowd surges to the middle
//          and parasols tilt; 0.20-0.40 the rope uncoils from the rail; 0.42-0.62 the poles fend off;
//          0.47 the mast head passes the first beam; 0.58 the barge is under the crown; from 0.62 half the
//          rail crowd crosses the deck to watch it leave; 0.8-1 the mast is laid flat, 30 degrees to port, into the
//          low crutch on the port rail (the world does this earlier, under the crown). Ambient
//          motion (flow lines, crowd drift, awnings, bow nod, vanes, dust) runs on time.
//          hero.setMast(angleRad | null, yawRad | null) overrides the mast elevation and its yaw to port (null
//          returns each to the progress curve). hero.setSink(m) lowers the barge.
// ANCHORS  (local space)
//          flyThrough   ordered Vector3 list: the barge line under the arch at eye height 4.2 m, from 70 m
//                       upstream to 64 m downstream. Lateral clearance 19 m; overhead 4.8 m at the crown by
//                       the brief's design (soffit 9.0), everything else >= 6 m.
//          portalSeat   { position, normal, radius }: where a 14 m portal could stand on the water axis
//                       60 m downstream, framed by the arch as seen from flyThrough. In this world the
//                       portal sits on the far seal instead: see sealSight.
//          sealSight    { eye, through, target }: the sight line that puts the far seal dead centre under
//                       the arch: from the eye at 46 m upstream, 0.8 m under the crown soffit, to the
//                       seal at local (0, 26, -168).
//          viewpoints   { approach, mastFrame, under, deck, downstream }: camera positions for the brief's frames.
//          crown, soffit, firstBeam, beamsZ, railUp, railDown, ropeFrom, mooring[], abutments[], vanePoles[],
//          bargeAt(p) -> { position, yaw }, mastHeadAt(p), progressAt(z), deckY(x).
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#B79C70', '#DCCBA6', '#2B241C', '#8E8573', '#C6A568', '#A7A57C', '#C2371F'];
const HALF_W = 7, SPAN = 20, BANK_Y = 3.0, RAMP_L = 31, LOG_R = 0.29;
const LIGHT = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();
// the ink that deepens a wash where a face is turned to the ground (soffits, eave undersides, the bellies of logs and hulls)
const INK_WASH = new THREE.Color('#2B241C');

// deck top profile (also in GLSL below): crown 11 m, easing onto the 3 m embankments at |x| = 31
const deckY = (x) => { const t = Math.pow(Math.min(Math.abs(x) / RAMP_L, 1), 1.5); return BANK_Y + 4 * (1 + Math.cos(Math.PI * t)); };
const deckSlope = (x) => (deckY(x + 0.05) - deckY(x - 0.05)) / 0.1;
// the two interlocked log polygons (centre lines, x y) and the heavy beams' line
const POLY_A = [[-21.2, 2.2], [-8, 9.75], [8, 9.75], [21.2, 2.2]];
const POLY_B = [[-21.0, 3.2], [-14.5, 7.5], [0, 10.25], [14.5, 7.5], [21.0, 3.2]];
const polyY = (poly, x) => { for (let i = 0; i < poly.length - 1; i++) { const a = poly[i], b = poly[i + 1]; if (x <= b[0] || i === poly.length - 2) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return 0; };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// pattern ids understood by the ruledInk fragment shader
const PAT = { none: 0, planks: 1, courses: 2, lattice: 3, rope: 4, ticks: 5, stripes: 6, weave: 7, tiles: 8, whip: 9, brocade: 10 };

// ---------------------------------------------------------------------------------------------------------
// Geometry accumulator: everything static goes into one buffer with per-vertex wash colour, pattern
// coordinates in metres (aUv), face-edge coordinates for the ruled outline (aEdge), pattern description
// (aPat: id, period u, period v, round flag) and an animation pivot (aAnim: pivot xyz, kind).
function makeAcc(rng) {
  const P = [], N = [], C = [], U = [], E = [], T = [], A = [], I = [];
  let n = 0, anim = [0, 0, 0, 0];
  const xf = new THREE.Matrix4(), nm = new THREE.Matrix3(), tv = new THREE.Vector3(), tn = new THREE.Vector3();
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const acc = {
    get count() { return I.length / 3; },
    setXf(m) { if (m) xf.copy(m); else xf.identity(); nm.getNormalMatrix(xf); },
    // pieces added after a world was tuned draw their pattern offsets from a fixed stream, so the seeded layout stays as it was
    setRng(f) { rng = f; },
    setAnim(px, py, pz, kind) { anim = kind ? [px, py, pz, kind] : [0, 0, 0, 0]; },
    // two-tone jiehua wash: faces turned from the notional light take `shade`, the rest `lit`
    // and whatever looks down at the ground takes a deeper ink wash still (flat, like the others)
    tone(mat, nrm) {
      if (nrm.y < -0.35) return mat.under || (mat.under = mat.shade.clone().lerp(INK_WASH, 0.45));
      return nrm.dot(LIGHT) > 0.02 || nrm.y > 0.75 ? mat.lit : mat.shade;
    },
    vert(p, nrm, col, u, v, eu, ev, pat, round) {
      tv.copy(p).applyMatrix4(xf); tn.copy(nrm).applyMatrix3(nm).normalize();
      P.push(tv.x, tv.y, tv.z); N.push(tn.x, tn.y, tn.z); C.push(col.r, col.g, col.b); U.push(u, v); E.push(eu, ev);
      T.push(pat[0], pat[1] || 1, pat[2] || 1, round ? 1 : 0); A.push(anim[0], anim[1], anim[2], anim[3]);
      return n++;
    },
    tri(a, b, c) { I.push(a, b, c); },
    // quad a b c d counter-clockwise seen from its front; edges = [u0, u1, v0, v1] outline switches
    quad(a, b, c, d, mat, pat = [0], o = {}) {
      const nrm = v2.copy(v0.subVectors(b, a)).cross(v1.subVectors(d, a)).normalize().clone();
      tn.copy(nrm).applyMatrix3(nm).normalize();
      const col = o.col || acc.tone(mat, tn);
      const lu = o.lu ?? a.distanceTo(b), lv = o.lv ?? a.distanceTo(d), u0 = o.u0 || 0, w0 = o.v0 || 0, e = o.edges || [1, 1, 1, 1];
      const e0 = e[0] ? 0 : 0.5, e1 = e[1] ? 1 : 0.5, f0 = e[2] ? 0 : 0.5, f1 = e[3] ? 1 : 0.5;
      const i0 = acc.vert(a, nrm, col, u0, w0, e0, f0, pat), i1 = acc.vert(b, nrm, col, u0 + lu, w0, e1, f0, pat);
      const i2 = acc.vert(c, nrm, col, u0 + lu, w0 + lv, e1, f1, pat), i3 = acc.vert(d, nrm, col, u0, w0 + lv, e0, f1, pat);
      I.push(i0, i1, i2, i0, i2, i3);
      if (o.double) I.push(i0, i2, i1, i0, i3, i2);
    },
    // oriented beam from a to b, section w (sideways) x h (up); pattern u runs along the length
    beam(a, b, w, h, mat, pat = [0], o = {}) {
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length(); dir.normalize();
      const side = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3().crossVectors(side, dir).normalize();
      if (o.roll) { side.applyAxisAngle(dir, o.roll); up.applyAxisAngle(dir, o.roll); }
      const c = (t, s, u) => new THREE.Vector3().copy(a).addScaledVector(dir, t * len).addScaledVector(side, s * w / 2).addScaledVector(up, u * h / 2);
      const q = { u0: o.u0 || rng() * 7, lu: len };
      acc.quad(c(0, 1, -1), c(1, 1, -1), c(1, 1, 1), c(0, 1, 1), mat, pat, q);          // +side
      acc.quad(c(1, -1, -1), c(0, -1, -1), c(0, -1, 1), c(1, -1, 1), mat, pat, q);      // -side
      acc.quad(c(0, 1, 1), c(1, 1, 1), c(1, -1, 1), c(0, -1, 1), mat, o.patTop || pat, q); // top
      if (!o.noBottom) acc.quad(c(0, -1, -1), c(1, -1, -1), c(1, 1, -1), c(0, 1, -1), mat, pat, q);
      if (!o.noEnds) {
        acc.quad(c(0, -1, -1), c(0, 1, -1), c(0, 1, 1), c(0, -1, 1), mat, [0]);
        acc.quad(c(1, 1, -1), c(1, -1, -1), c(1, -1, 1), c(1, 1, 1), mat, [0]);
      }
    },
    // axis-aligned box centred at (x, y, z) with optional yaw; pattern u horizontal, v vertical
    box(x, y, z, sx, sy, sz, mat, pat = [0], o = {}) {
      const ry = o.ry || 0, cs = Math.cos(ry), sn = Math.sin(ry), tp = o.taper ?? 1;
      const c = (i, j, k) => { const t = j > 0 ? tp : 1, lx = i * sx / 2 * t, lz = k * sz / 2 * t; return new THREE.Vector3(x + lx * cs + lz * sn, y + j * sy / 2, z - lx * sn + lz * cs); };
      const q = { u0: o.u0 ?? rng() * 5, v0: o.v0 || 0 };
      acc.quad(c(-1, -1, 1), c(1, -1, 1), c(1, 1, 1), c(-1, 1, 1), mat, pat, q);
      acc.quad(c(1, -1, -1), c(-1, -1, -1), c(-1, 1, -1), c(1, 1, -1), mat, pat, q);
      acc.quad(c(1, -1, 1), c(1, -1, -1), c(1, 1, -1), c(1, 1, 1), mat, pat, q);
      acc.quad(c(-1, -1, -1), c(-1, -1, 1), c(-1, 1, 1), c(-1, 1, -1), mat, pat, q);
      if (!o.noTop) acc.quad(c(-1, 1, 1), c(1, 1, 1), c(1, 1, -1), c(-1, 1, -1), mat, o.patTop || [0], q);
      if (o.bottom) acc.quad(c(-1, -1, -1), c(1, -1, -1), c(1, -1, 1), c(-1, -1, 1), mat, [0], q);
    },
    // round timber from a to b (radius r0 to r1): smooth normals, silhouette line from the view angle
    tube(a, b, r0, r1, mat, pat = [0], o = {}) {
      const sides = o.sides || 8, dir = new THREE.Vector3().subVectors(b, a), len = dir.length(); dir.normalize();
      const s = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
      const t = new THREE.Vector3().crossVectors(s, dir).normalize(), u0 = rng() * 5, ring = [];
      for (let k = 0; k <= sides; k++) {
        const an = (k / sides) * Math.PI * 2, nrm = new THREE.Vector3().addScaledVector(s, Math.cos(an)).addScaledVector(t, Math.sin(an));
        tn.copy(nrm).applyMatrix3(nm).normalize(); const col = acc.tone(mat, tn);
        const pa = new THREE.Vector3().copy(a).addScaledVector(nrm, r0), pb = new THREE.Vector3().copy(b).addScaledVector(nrm, r1);
        const uu = (k / sides) * Math.PI * 2 * r0;
        ring.push([acc.vert(pa, nrm, col, u0, uu, 0.5, o.noRing ? 0.5 : 0, pat, true), acc.vert(pb, nrm, col, u0 + len, uu, 0.5, o.noRing ? 0.5 : 1, pat, true), pa, pb]);
      }
      for (let k = 0; k < sides; k++) I.push(ring[k][0], ring[k][1], ring[k + 1][1], ring[k][0], ring[k + 1][1], ring[k + 1][0]);
      for (const end of o.caps === false ? [] : [0, 1]) {            // end grain discs with a rim line
        const cp = end ? b : a, nrm = end ? dir : dir.clone().negate(); tn.copy(nrm).applyMatrix3(nm).normalize();
        const col = o.capCol || acc.tone(mat, tn), ci = acc.vert(cp, nrm, col, 0, 0, 0.5, 0.5, [0]);
        const rim = []; for (let k = 0; k <= sides; k++) rim.push(acc.vert(ring[k][2 + end], nrm, col, 0, 0, 0.5, 1, [0]));
        for (let k = 0; k < sides; k++) end ? I.push(ci, rim[k + 1], rim[k]) : I.push(ci, rim[k], rim[k + 1]);
      }
    },
    // ribbed cone or disc (parasols, hats, coiled rope): each sector rules its own leading rib
    cone(cx, cy, cz, r, h, sides, mat, o = {}) {
      const apex = new THREE.Vector3(cx, cy + h, cz), ph = o.phase || 0;
      for (let k = 0; k < sides; k++) {
        const a0 = ph + (k / sides) * Math.PI * 2, a1 = ph + ((k + 1) / sides) * Math.PI * 2, rr = r * (o.scallop ? 1 : 1);
        const p0 = new THREE.Vector3(cx + Math.cos(a0) * rr, cy, cz + Math.sin(a0) * rr), p1 = new THREE.Vector3(cx + Math.cos(a1) * rr, cy, cz + Math.sin(a1) * rr);
        const nrm = new THREE.Vector3(Math.cos((a0 + a1) / 2) * h, r, Math.sin((a0 + a1) / 2) * h).normalize(); tn.copy(nrm).applyMatrix3(nm).normalize();
        const col = o.col || acc.tone(mat, tn), pat = o.pat || [0];
        const ia = acc.vert(apex, nrm, col, 0, 0, 0, 0.5, pat), i0 = acc.vert(p0, nrm, col, 0, r, 0, 1, pat), i1 = acc.vert(p1, nrm, col, 1, r, 1, 1, pat);
        I.push(ia, i1, i0); if (o.double !== false) I.push(ia, i0, i1);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 2)); g.setAttribute('aPat', new THREE.Float32BufferAttribute(T, 4));
      g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere(); return g;
    },
    // the same buffer, made in short steps: y is the build's yield
    async buildAsync(y) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      await y();
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(E, 2));
      await y();
      g.setAttribute('aPat', new THREE.Float32BufferAttribute(T, 4));
      await y();
      g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      await y();
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere(); return g;
    },
  };
  acc.setXf(null);
  return acc;
}

// ---------------------------------------------------------------------------------------------------------
// Shaders. All unlit, linear, fog-aware, and written to be safe on Direct3D (no derivatives in loops, no
// undefined pow / normalize / division).
const GLSL_COMMON = /* glsl */`
  float h11(float x) { return fract(sin(x * 127.1 + 3.7) * 43758.5453); }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float deckY(float x) { float t = pow(min(abs(x) / 31.0, 1.0), 1.5); return 3.0 + 4.0 * (1.0 + cos(3.14159265 * t)); }
  // ink coverage of a line whose centre is d (pattern units) away, where one pixel is fw pattern units
  float inkLine(float d, float fw, float px) { return 1.0 - smoothstep(px * 0.5 - 0.5, px * 0.5 + 0.5, d / max(fw, 1e-6)); }
  // repeating ruled lines every period; omitted (never smeared) once they crowd under ~4 px
  float ruled(float x, float period, float fw, float px) {
    float d = abs(fract(x / period - 0.5) - 0.5) * period;
    return inkLine(d, fw, px) * smoothstep(2.6, 5.0, period / max(fw, 1e-6));
  }
`;
// mist is omission: low drifting bands where the painter left the silk bare (uMist: amount, drift, near, far;
// uMistBand: the band's two edges, 0.56 / 0.9 by default, lower for wider bands, and the two heights between which
// it thins out behind the first row of roofs, 5 / 15 m by default)
const GLSL_MIST = /* glsl */`
  uniform vec4 uMist; uniform vec4 uMistBand; uniform vec4 uClip;
  // uClip (nx, nz, d, on): while on, whatever stands beyond the plane nx x + nz z + d = 0 is not drawn (see the world)
  bool clipped(vec3 w) { return uClip.w > 0.5 && dot(w.xz, uClip.xy) + uClip.z > 0.0; }
  float mistAt(vec3 w, float dist) {
    float b = 0.5 + 0.5 * sin(w.x * 0.066 + w.z * 0.013 - uMist.y) + 0.22 * sin(w.x * 0.021 - w.z * 0.031 + 1.7 + uMist.y * 0.4);
    b = smoothstep(uMistBand.x, uMistBand.y, b);
    // over the river and the first row the band lies low (5 to 15 m); behind the first row it may stand higher
    float back = smoothstep(28.0, 42.0, abs(w.z));
    float low = 1.0 - smoothstep(mix(5.0, uMistBand.z, back), mix(15.0, uMistBand.w, back), w.y);
    return uMist.x * b * low * smoothstep(uMist.z, uMist.w, dist);
  }
`;
// the single ripple that runs the length of the silk when the collector stamps it (uRipple: x, amplitude, width)
const GLSL_RIPPLE = /* glsl */`
  uniform vec3 uRipple;
  float rippleY(float x) { float d = (x - uRipple.x) / max(uRipple.z, 1.0); return uRipple.y * exp(-d * d); }
`;

const INK_VERT = /* glsl */`
  attribute vec3 aCol; attribute vec2 aUv; attribute vec2 aEdge; attribute vec4 aPat; attribute vec4 aAnim;
  uniform float uTime, uSurge;
  varying vec3 vCol; varying vec2 vUv; varying vec2 vEdge; varying vec4 vPat; varying vec3 vN; varying vec3 vV;
  #include <fog_pars_vertex>
  ${GLSL_RIPPLE}
  void main() {
    vec3 p = position;
    float kind = aAnim.w;
    if (kind > 0.5) {
      float ph = fract(sin(dot(aAnim.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
      #ifdef USE_INSTANCING
        ph += instanceMatrix[3][0] * 0.37 + instanceMatrix[3][2] * 0.23;
      #endif
      vec3 r = p - aAnim.xyz;
      if (kind < 1.5) {                       // parasol: tilts upstream with the surge, nods a little always
        float ang = uSurge * 0.34 * (0.55 + 0.45 * sin(ph * 3.0)) + 0.04 * sin(uTime * 1.3 + ph);
        float c = cos(ang), s = sin(ang);
        r = vec3(r.x, c * r.y - s * r.z, s * r.y + c * r.z);
        p = aAnim.xyz + r;
      } else if (kind < 2.5) {                // cloth hanging below its pivot: awning valances, banners, laundry
        float w = clamp(-r.y, 0.0, 2.5);
        p.z += sin(uTime * 2.1 + ph + p.x * 0.9) * 0.13 * w;
        p.x += sin(uTime * 1.7 + ph * 2.0 + p.y) * 0.05 * w;
      } else if (kind < 3.5) {                // carried things bob
        p.y += sin(uTime * 3.2 + ph) * 0.09;
      } else {                                // wind vane swings about its pole
        float ang = 0.7 * sin(uTime * 0.31 + ph) + 0.15 * sin(uTime * 1.9 + ph * 3.0);
        float c = cos(ang), s = sin(ang);
        p = aAnim.xyz + vec3(c * r.x + s * r.z, r.y, -s * r.x + c * r.z);
      }
    }
    #ifdef USE_INSTANCING
      vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
      vN = mat3(modelMatrix) * (mat3(instanceMatrix) * normal);
    #else
      vec4 wp = modelMatrix * vec4(p, 1.0);
      vN = mat3(modelMatrix) * normal;
    #endif
    wp.y += rippleY(wp.x);
    vV = cameraPosition - wp.xyz;
    vCol = aCol; vUv = aUv; vEdge = aEdge; vPat = aPat;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const INK_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk, uGrey, uPale, uGold; uniform float uLinePx; uniform vec2 uFade;
  varying vec3 vCol; varying vec2 vUv; varying vec2 vEdge; varying vec4 vPat; varying vec3 vN; varying vec3 vV;
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  ${GLSL_MIST}
  void main() {
    float px = uLinePx;
    vec2 fwU = vec2(length(vec2(dFdx(vUv.x), dFdy(vUv.x))), length(vec2(dFdx(vUv.y), dFdy(vUv.y))));
    vec2 fwE = vec2(length(vec2(dFdx(vEdge.x), dFdy(vEdge.x))), length(vec2(dFdx(vEdge.y), dFdy(vEdge.y))));
    vec2 e = min(vEdge, 1.0 - vEdge);
    float line = max(inkLine(e.x, fwE.x, px * 1.45), inkLine(e.y, fwE.y, px * 1.45));
    float dist = length(vV);
    // round timber: rule the silhouette (the derivative is taken outside the branch: Direct3D)
    float sil = abs(dot(normalize(vN + vec3(0.0, 1e-5, 0.0)), vV / max(dist, 1e-4)));
    float fs = length(vec2(dFdx(sil), dFdy(sil)));
    if (vPat.w > 0.5) line = max(line, inkLine(sil, fs, px * 2.0) * step(sil, 0.55));
    vec3 col = vCol;
    float id = floor(vPat.x + 0.5), pu = max(vPat.y, 1e-3), pv = max(vPat.z, 1e-3), u = vUv.x, v = vUv.y;
    bool cut = false;
    if (id == 1.0) {                          // planks: long seams, staggered butt joints
      float row = floor(v / pv);
      float l = ruled(v, pv, fwU.y, px);
      float j = ruled(u + h11(row) * pu, pu, fwU.x, px) * smoothstep(2.6, 5.0, pv / max(fwU.y, 1e-6));
      line = max(line, max(l, j * 0.9));
      col = mix(col, uGrey, 0.10 * step(0.72, h11(row + 31.0)));
    } else if (id == 2.0) {                   // masonry: ruled courses, staggered joints
      float row = floor(v / pv);
      float l = ruled(v, pv, fwU.y, px);
      float j = ruled(u + h11(row) * pu, pu, fwU.x, px) * smoothstep(2.6, 5.0, pv / max(fwU.y, 1e-6));
      line = max(line, max(l, j));
      col = mix(col, uGrey, 0.22 * step(0.8, h21(vec2(row, floor((u + h11(row) * pu) / pu)))));
    } else if (id == 3.0) {                   // open lattice
      float fw = max(fwU.x, fwU.y);
      float l = max(ruled(u + v, pu, fw * 1.41, px), ruled(u - v, pu, fw * 1.41, px));
      float open = smoothstep(2.6, 5.0, pu / max(fw * 1.41, 1e-6));
      if (open > 0.5 && max(l, line) < 0.35) cut = true;
      col = mix(col, uGrey, 0.35 * (1.0 - open));
      line = max(line, l);
    } else if (id == 4.0) {                   // rope: ruled diagonal turns
      float fw = max(fwU.x, fwU.y);
      line = max(line, ruled(u + v * 0.6, pu, fw, px));
    } else if (id == 5.0) {                   // thatch / mat ticks
      vec2 c = vec2(u / pu, v / pv), f = fract(c), ci = floor(c);
      float h = h21(ci);
      float t = inkLine(abs(f.x - 0.25 - 0.5 * h) * pu, fwU.x, px) * step(0.12, f.y) * step(f.y, 0.55 + 0.35 * h);
      line = max(line, t * smoothstep(3.0, 6.0, pu / max(fwU.x, 1e-6)) * smoothstep(3.0, 6.0, pv / max(fwU.y, 1e-6)));
    } else if (id == 6.0) {                   // plain striped cloth: grey bands, or (pv 2) a mineral wash with pale bands
      float band = mod(floor(u / pu), 2.0);
      col = pv > 1.5 ? mix(col, uPale, 0.82 * band) : mix(col, uGrey, 0.55 * band);
      line = max(line, ruled(u, pu, fwU.x, px));
    } else if (id == 7.0) {                   // woven mat: ruled both ways
      line = max(line, max(ruled(u, pu, fwU.x, px), ruled(v, pv, fwU.y, px) * 0.85));
    } else if (id == 8.0) {                   // roof tiles: ruled down the slope, a greyer tint inside
      line = max(line, ruled(v, pv, fwU.y, px));
      col = mix(col, uGrey, 0.14);
    } else if (id == 9.0) {                   // willow whip: one hair line, alternate leaf ticks, a faint stain; the rest is bare silk
      float c = u - 0.5 * pu, fw = max(fwU.x, fwU.y);
      float sg = v / pv, fv = fract(sg), sd = mod(floor(sg), 2.0) * 2.0 - 1.0;
      float l = inkLine(abs(c), fwU.x, px * 0.9);
      float tk = inkLine(abs(c - sd * (fv - 0.15) * 0.9 * pu), fw, px * 0.9) * step(0.15, fv) * step(fv, 0.6) * step(pv, 40.0) * smoothstep(3.0, 6.0, pv / max(fwU.y, 1e-6));
      line = max(l, tk) * 0.78;
      if (line < 0.3 && (abs(c) > 0.2 * pu || pv > 40.0)) cut = true;
    } else if (id == 10.0) {                  // brocade: a lozenge lattice ruled in gold, a gold dot in every cell
      float fw = max(fwU.x, fwU.y) * 1.41, a = u + v, b = u - v;
      float l = max(ruled(a, pu, fw, px * 1.3), ruled(b, pu, fw, px * 1.3));
      vec2 c = (vec2(fract(a / pu), fract(b / pu)) - 0.5) * pu;
      float dt = (1.0 - smoothstep(0.13 * pu - fw, 0.13 * pu + fw, length(c))) * smoothstep(2.6, 5.0, pu / max(fw, 1e-6));
      col = mix(col, uGold, 0.85 * max(l, dt));
    }
    if (cut || clipped(cameraPosition - vV)) discard;
    col = mix(col, uInk, clamp(line, 0.0, 1.0));
    col = mix(col, uSilk, max(smoothstep(uFade.x, uFade.y, dist), mistAt(cameraPosition - vV, dist)));   // distance and mist are omission
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

// dab-figures: one instanced card each, a head dot and a robe wedge, turned to the camera about Y
const DAB_VERT = /* glsl */`
  attribute vec4 aHome; attribute vec4 aInfo; attribute vec3 aCol;
  uniform float uTime, uSurge, uProgress; uniform vec4 uBarge;
  varying vec2 vQ; varying vec3 vCol; varying float vHat; varying float vDist; varying vec3 vW;
  #include <fog_pars_vertex>
  ${GLSL_COMMON}
  ${GLSL_RIPPLE}
  void main() {
    float kind = aInfo.x, ph = aHome.w, lean = aInfo.z;
    vec3 base = aHome.xyz;
    if (kind < 0.5) {                         // the lane: two streams shuffling past each other
      float dir = ph > 3.1416 ? 1.0 : -1.0;
      float x = mod(base.x + 29.0 + dir * uTime * (0.45 + 0.3 * fract(ph * 7.0)), 58.0) - 29.0;
      base.x = x; base.z += 0.45 * sin(uTime * 0.4 + ph * 5.0); base.y = deckY(x) + 0.03 * sin(uTime * 5.0 + ph * 9.0);
    } else if (kind < 1.5) {                  // the rail: surge to the middle, then half cross to watch us leave
      float f = fract(ph * 3.7);
      float squeeze = mix(1.0, 0.42 + 0.25 * f, uSurge);
      base.x *= squeeze;
      base.z -= uSurge * 0.9 * floor(f * 2.99) * 0.8;
      float cr = smoothstep(0.60 + f * 0.12, 0.70 + f * 0.16, uProgress) * step(0.42, f);
      base.z = mix(base.z, -base.z, cr); lean = mix(lean, -lean, cr);
      base.y = deckY(base.x) + 0.16 * uSurge * abs(sin(uTime * 2.3 + ph * 4.0));
    } else if (kind > 2.5) {                  // crew: rides the barge
      float c = cos(uBarge.w), s = sin(uBarge.w);
      base = uBarge.xyz + vec3(c * base.x + s * base.z, base.y, -s * base.x + c * base.z);
    }
    float h = aInfo.y;
    vec3 loc = base + vec3(0.0, position.y * h, lean * position.y);
    vec4 wp = modelMatrix * vec4(loc, 1.0);
    vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
    wp.xyz += right * position.x * h * 0.46;
    wp.y += rippleY(wp.x); vW = wp.xyz;
    vQ = vec2(position.x * 0.46, position.y); vCol = aCol; vHat = aInfo.w;
    vec4 mvPosition = viewMatrix * wp;
    vDist = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const DAB_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk; uniform float uLinePx; uniform vec2 uFade;
  varying vec2 vQ; varying vec3 vCol; varying float vHat; varying float vDist; varying vec3 vW;
  #include <fog_pars_fragment>
  ${GLSL_MIST}
  void main() {
    float fw = max(length(vec2(dFdx(vQ.y), dFdy(vQ.y))), 1e-6), px = uLinePx;
    float y = clamp(vQ.y / 0.76, 0.0, 1.0);
    float robe = max(abs(vQ.x) - (0.045 + 0.125 * pow(1.0 - y, 0.75)), max(-vQ.y, vQ.y - 0.76));
    float head = length(vQ - vec2(0.0, 0.85)) - 0.094;
    float hat = max(abs(vQ.x) - 0.17, abs(vQ.y - 0.93 + abs(vQ.x) * 0.35) - 0.012);
    float ink = 1.0 - smoothstep(-0.5, 0.5, head / fw);
    if (vHat > 0.5 && vHat < 1.5) ink = max(ink, 1.0 - smoothstep(px * 0.3 - 0.5, px * 0.3 + 0.5, hat / fw));
    float yoke = max(abs(vQ.x) - 0.225, abs(vQ.y - 0.73) - 0.006);                          // a shoulder pole and its two baskets
    float bsk = max(abs(abs(vQ.x) - 0.19) - 0.036, abs(vQ.y - 0.5) - 0.06);
    float cord = max(abs(abs(vQ.x) - 0.19) - 0.004, abs(vQ.y - 0.64) - 0.09);
    if (vHat > 1.5) ink = max(ink, max(1.0 - smoothstep(px * 0.3 - 0.5, px * 0.3 + 0.5, min(yoke, cord) / fw), 0.8 * (1.0 - smoothstep(-0.5, 0.5, bsk / fw))));
    float edge = 1.0 - smoothstep(px * 0.38 - 0.5, px * 0.38 + 0.5, abs(robe) / fw);
    float body = 1.0 - smoothstep(-0.5, 0.5, robe / fw);
    float a = max(body, max(edge, ink));
    if (a < 0.5 || clipped(vW)) discard;
    vec3 col = mix(vCol, uInk, max(edge, ink));
    col = mix(col, uSilk, max(smoothstep(uFade.x, uFade.y, vDist), mistAt(vW, vDist)));
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

// ink ribbons (ropes, stays, poles' lines): quads turned to the screen and held at the ink line width
const RIB_VERT = /* glsl */`
  attribute vec3 aDir; attribute float aSide;
  uniform vec2 uRes; uniform float uLinePx;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 c0 = projectionMatrix * mvPosition;
    vec4 mv1 = modelViewMatrix * vec4(position + aDir * 0.25, 1.0);
    vec4 c1 = projectionMatrix * mv1;                 // the same arithmetic as c0, so a joining vertex (aDir = 0) has exactly no width
    vec2 s0 = c0.xy / max(abs(c0.w), 1e-4), s1 = c1.xy / max(abs(c1.w), 1e-4);
    vec2 d = (s1 - s0) * uRes; d = d / max(length(d), 1e-5);
    c0.xy += vec2(-d.y, d.x) * aSide * (uLinePx * 1.15) / uRes * c0.w * step(1e-6, dot(aDir, aDir));
    gl_Position = c0;
    #include <fog_vertex>
  }
`;
const RIB_FRAG = /* glsl */`
  uniform vec3 uInk;
  #include <fog_pars_fragment>
  void main() {
    gl_FragColor = vec4(uInk, 1.0);
    #include <fog_fragment>
  }
`;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BEAMS_Z = [-5.25, -1.75, 1.75, 5.25];
const TIES_X = [-14.5, -8, 0, 8, 14.5];
const tieY = (x) => (Math.abs(x) > 10 ? polyY(POLY_B, x) - LOG_R - 0.27 : polyY(POLY_A, x) - LOG_R - 0.24);

// ---------------------------------------------------------------------------------------------------------
// The woven arch: five bundles of logs in two interlocked polygons, four heavy beams, five tie logs, lashings
async function buildArch(acc, rng, M, pause) {
  const bundles = [[-6.62, -6.0], [-4.55, -3.85, -3.15, -2.45], [-1.05, -0.35, 0.35, 1.05], [2.45, 3.15, 3.85, 4.55], [6.0, 6.62]];
  let k = 0;
  for (const bundle of bundles) for (const z0 of bundle) {
    if (k % 3 === 0) await pause();
    const poly = (k++ % 2) ? POLY_B : POLY_A, r = LOG_R * rng.range(0.88, 1.06), dz = rng.range(-0.04, 0.04);
    for (let i = 0; i < poly.length - 1; i++) {
      const a = V(poly[i][0], poly[i][1], z0 + dz), b = V(poly[i + 1][0], poly[i + 1][1], z0 + dz), d = b.clone().sub(a).normalize();
      // logs run past each joint so their butt ends stand proud of the weave
      if (i > 0) a.addScaledVector(d, -rng.range(0.7, 1.25));
      if (i < poly.length - 2) b.addScaledVector(d, rng.range(0.7, 1.25));
      acc.tube(a, b, r, r * rng.range(0.86, 0.98), M.log, [PAT.none], { sides: 8, capCol: M.endGrain });
    }
    // rope lashing where the rib crosses each tie
    for (const tx of TIES_X) {
      const y = polyY(poly, tx), s = (polyY(poly, tx + 0.3) - polyY(poly, tx - 0.3)) / 0.6, joint = poly.some((p) => Math.abs(p[0] - tx) < 0.1);
      const hl = joint ? 0.62 : 0.4, d = V(1, s, 0).normalize();
      acc.tube(V(tx, y, z0 + dz).addScaledVector(d, -hl), V(tx, y, z0 + dz).addScaledVector(d, hl), r + 0.075, r + 0.075, M.rope, [PAT.rope, 0.16, 1], { sides: 8, caps: false });
    }
  }
  await pause();
  // four heavy squared beams along the three-segment line; their undersides are the 9.0 m soffit
  for (const z of BEAMS_Z) {
    for (let i = 0; i < 3; i++) {
      const a = V(POLY_A[i][0], POLY_A[i][1] - 0.36, z), b = V(POLY_A[i + 1][0], POLY_A[i + 1][1] - 0.36, z);
      if (i === 1) { a.x -= 0.5; b.x += 0.5; }
      acc.beam(a, b, 0.62, 0.78, M.beam, [PAT.planks, 9, 0.39], { noEnds: i !== 1 });
    }
    for (const sg of [-1, 1]) {
      // scarf joint straps at the knees
      for (const dx of [-0.75, 0.75]) acc.box(sg * 8 + dx, 9.39, z, 0.16, 0.9, 0.74, M.rope, [PAT.rope, 0.12, 1], { bottom: true });
      // stepped bracket ends corbelled out of the abutment under each beam
      for (let j = 0; j < 3; j++) {
        const len = 3.0 - j * 0.85, x = sg * (20.5 - len / 2), yb = polyY(POLY_A, sg * (20.4 - len)) - 0.75 - 0.12;
        acc.box(x, Math.min(yb, 3.3 - j * 0.5) - 0.24 + j * 0.0, z, len, 0.48, 0.74 - j * 0.06, M.beam, [PAT.none], { bottom: true });
      }
    }
  }
  await pause();
  // five transverse tie logs: heads stand out of both faces, each with a squared collar and a wedge
  for (const tx of TIES_X) {
    const y = tieY(tx), r = Math.abs(tx) > 10 ? 0.27 : 0.24;
    acc.tube(V(tx, y, -8.05), V(tx, y, 8.05), r, r, M.log, [PAT.none], { sides: 8, capCol: M.endGrain });
    for (const sg of [-1, 1]) {
      acc.box(tx, y, sg * 7.45, 0.78, 0.78, 0.3, M.beam, [PAT.none], { bottom: true });
      acc.beam(V(tx - 0.5, y + 0.32, sg * 7.72), V(tx + 0.45, y + 0.36, sg * 7.72), 0.1, 0.16, M.timber);
    }
  }
  // spandrel struts between the four-segment polygon and the deck, on both faces
  for (const zf of [-6.62, 6.62]) for (const sg of [-1, 1]) for (let x = 9.6; x < 20; x += 1.55) {
    const yb = polyY(POLY_B, sg * x) + LOG_R * 0.8, yt = deckY(x) - 0.34;
    if (yt - yb > 0.25) acc.tube(V(sg * x, yb, zf), V(sg * x, yt, zf), 0.13, 0.11, M.log, [PAT.none], { sides: 6, caps: false });
  }
}

// plank deck, fascia boards and the two lattice rails
function buildDeck(acc, rng, M) {
  const W = 7.2, X0 = -33, X1 = 33, step = 1.5; let s = 0;
  for (let x = X0; x < X1 - 1e-3; x += step) {
    const x1 = x + step, y0 = deckY(x), y1 = deckY(x1), ds = Math.hypot(step, y1 - y0);
    acc.quad(V(x, y0, -W), V(x, y0, W), V(x1, y1, W), V(x1, y1, -W), M.deck, [PAT.planks, 5.2, 0.52], { u0: 0, v0: s, lv: ds, edges: [1, 1, 0, 0] });
    if (Math.abs(x + step / 2) < 21) acc.quad(V(x, y0 - 0.34, W), V(x, y0 - 0.34, -W), V(x1, y1 - 0.34, -W), V(x1, y1 - 0.34, W), M.under, [PAT.planks, 5.2, 0.52], { u0: 0, v0: s, lv: ds, edges: [1, 1, 0, 0] });
    for (const sg of [-1, 1]) {         // fascia boards on both faces
      const a = V(sg > 0 ? x : x1, (sg > 0 ? y0 : y1) - 0.62, sg * W), b = V(sg > 0 ? x1 : x, (sg > 0 ? y1 : y0) - 0.62, sg * W);
      acc.quad(a, b, V(b.x, b.y + 0.62, b.z), V(a.x, a.y + 0.62, a.z), M.timber, [PAT.planks, 4.1, 0.31], { u0: sg > 0 ? s : -s - ds, edges: [0, 0, 1, 1] });
    }
    s += ds;
  }
  for (const zr of [-6.92, 6.92]) {
    const posts = [];
    for (let x = -31.9; x <= 31.91; x += 2.2) posts.push(x);
    for (let i = 0; i < posts.length; i++) {
      const x = posts[i], y = deckY(x), big = i === 0 || i === posts.length - 1 || Math.abs(x) < 0.2;
      acc.box(x, y + (big ? 1.05 : 0.85), zr, big ? 0.36 : 0.24, big ? 2.1 : 1.7, big ? 0.36 : 0.24, M.timber, [PAT.none]);
      acc.box(x, y + (big ? 2.2 : 1.78), zr, big ? 0.5 : 0.34, 0.16, big ? 0.5 : 0.34, M.beam, [PAT.none], { bottom: true });
      if (i === posts.length - 1) break;
      const xb = posts[i + 1], yb = deckY(xb);
      for (const h of [1.5, 0.3]) acc.beam(V(x, y + h, zr), V(xb, yb + h, zr), 0.14, 0.18, M.timber, [PAT.none], { noEnds: true });
      const face = zr > 0 ? [V(x, y + 0.38, zr), V(xb, yb + 0.38, zr), V(xb, yb + 1.42, zr), V(x, y + 1.42, zr)] : [V(xb, yb + 0.38, zr), V(x, y + 0.38, zr), V(x, y + 1.42, zr), V(xb, yb + 1.42, zr)];
      acc.quad(face[0], face[1], face[2], face[3], M.rail, [PAT.lattice, 0.47, 1], { u0: i * 2.2, lu: 2.2, lv: 1.04, edges: [0, 0, 0, 0], double: true });
    }
  }
}

// stone abutments, quay walls, steps, mooring posts, newels and wind-vane poles
function buildBanks(acc, rng, M, opts, anchors) {
  const course = [PAT.courses, 1.55, 0.52];
  for (const sg of [-1, 1]) {
    const X = (x) => sg * x;
    const q = (a, b, c, d, mat, pat, o) => (sg > 0 ? acc.quad(b, a, d, c, mat, pat, o) : acc.quad(a, b, c, d, mat, pat, o));
    // lower pier: battered block standing 2.6 m into the river
    const zb = 9.3, zt = 9.0, x0b = 19.2, x0t = 19.75, yb = -0.8, ym = BANK_Y;
    q(V(X(x0b), yb, zb), V(X(x0b), yb, -zb), V(X(x0t), ym, -zt), V(X(x0t), ym, zt), M.stone, course, { u0: 0 });
    q(V(X(22.2), yb, zb), V(X(x0b), yb, zb), V(X(x0t), ym, zt), V(X(22.2), ym, zt), M.stone, course, { u0: 3 });
    q(V(X(x0b), yb, -zb), V(X(22.2), yb, -zb), V(X(22.2), ym, -zt), V(X(x0t), ym, -zt), M.stone, course, { u0: 7 });
    q(V(X(x0t), ym, zt), V(X(x0t), ym, -zt), V(X(22.2), ym, -zt), V(X(22.2), ym, zt), M.stoneTop, [PAT.courses, 1.9, 1.1], {});
    // upper pier under the ramp: its top follows the deck
    const xu = 20.55, zu = 8.1, yu0 = deckY(xu) - 0.34, xe = 28.5, yu1 = deckY(xe) - 0.3;
    q(V(X(xu), ym, zu), V(X(xu), ym, -zu), V(X(xu), yu0, -zu), V(X(xu), yu0, zu), M.stone, course, { u0: 1 });
    q(V(X(xe), ym, zu), V(X(xu), ym, zu), V(X(xu), yu0, zu), V(X(xe), yu1, zu), M.stone, course, { u0: 2, lv: yu0 - ym });
    q(V(X(xu), ym, -zu), V(X(xe), ym, -zu), V(X(xe), yu1, -zu), V(X(xu), yu0, -zu), M.stone, course, { u0: 5, lv: yu0 - ym });
    q(V(X(xu), yu0, zu), V(X(xu), yu0, -zu), V(X(xe), yu1, -zu), V(X(xe), yu1, zu), M.stoneTop, [PAT.none], {});
    // string course and coping
    acc.box(X(x0t + 0.05), ym + 0.14, 0, 0.5, 0.28, zt * 2 + 0.3, M.stoneTop, [PAT.none], { bottom: true });
    // quay walls up and downstream, with coping
    for (const zs of [-1, 1]) {
      const za = zs * zt, zq = zs * 22, a = V(X(22), yb, zs > 0 ? zq : za), b = V(X(22), yb, zs > 0 ? za : zq);
      q(a, b, V(b.x, ym, b.z), V(a.x, ym, a.z), M.stone, course, { u0: zs * 11 });
      acc.box(X(22.15), ym + 0.13, (za + zq) / 2, 0.7, 0.26, Math.abs(zq - za), M.stoneTop, [PAT.courses, 30, 1.7], { bottom: true, patTop: [PAT.courses, 0.7, 1.7] });
      // mooring posts with rope turns
      for (const zp of [12.5, 17.5, 21]) {
        const px = X(22.9), pz = zs * (zp + rng.range(-0.6, 0.6)), lean = rng.range(-0.08, 0.08);
        acc.tube(V(px, ym, pz), V(px + lean, ym + 1.7, pz + lean), 0.3, 0.24, M.log, [PAT.none], { sides: 7, capCol: M.endGrain });
        acc.tube(V(px, ym + 0.75, pz), V(px + lean * 0.6, ym + 1.15, pz + lean * 0.6), 0.36, 0.34, M.rope, [PAT.rope, 0.13, 1], { sides: 7, caps: false });
        anchors.mooring.push(V(px, ym + 1.0, pz));
      }
    }
    // mooring posts and iron ring on the pier nose itself
    for (const zp of [-7.4, 7.4]) {
      acc.tube(V(X(20.3), ym + 0.28, zp), V(X(20.3), ym + 1.75, zp), 0.3, 0.25, M.log, [PAT.none], { sides: 7, capCol: M.endGrain });
      anchors.mooring.push(V(X(20.3), ym + 1.0, zp));
    }
    // a flight of steps down to the water on the upstream or downstream quay (per seed)
    const zs = rng.chance(0.5) ? 1 : -1;
    for (let i = 0; i < 9; i++) acc.box(X(21.3), ym - 0.2 - i * 0.37, zs * (11.2 + i * 0.72), 1.5, 0.4, 0.74, M.stoneTop, [PAT.none], {});
    // newel posts at the foot of the ramps
    for (const zp of [-7.25, 7.25]) {
      acc.box(X(33.1), BANK_Y + 1.35, zp, 0.62, 2.7, 0.62, M.stone, [PAT.courses, 9, 0.68], {});
      acc.box(X(33.1), BANK_Y + 2.85, zp, 0.86, 0.3, 0.86, M.stoneTop, [PAT.none], { bottom: true });
      acc.box(X(33.1), BANK_Y + 3.3, zp, 0.5, 0.6, 0.5, M.stone, [PAT.none], { taper: 0.35 });
    }
    // wind-vane poles (a crane on a cross-tree) at the bridge heads
    for (const zp of [-10.2, 10.2]) {
      const px = X(29.6 + rng.range(-0.8, 0.8)), top = BANK_Y + rng.range(13.2, 15.4), lean = rng.range(-0.12, 0.12);
      acc.tube(V(px, BANK_Y, zp), V(px + lean, top, zp), 0.26, 0.11, M.log, [PAT.none], { sides: 7 });
      for (const br of [-1, 1]) acc.tube(V(px + br * 1.5, BANK_Y, zp + br * 0.5), V(px + lean * 0.2, BANK_Y + 3.4, zp), 0.12, 0.1, M.log, [PAT.none], { sides: 5, caps: false });
      acc.tube(V(px, BANK_Y + 2.6, zp), V(px + lean * 0.24, BANK_Y + 3.6, zp), 0.33, 0.31, M.rope, [PAT.rope, 0.13, 1], { sides: 7, caps: false });
      (anchors.vanePoles = anchors.vanePoles || []).push({ base: V(px, BANK_Y, zp), top: V(px + lean, top, zp) });
      acc.setAnim(px + lean, top, zp, 4);
      acc.beam(V(px + lean - 1.5, top - 1.3, zp), V(px + lean + 1.5, top - 1.3, zp), 0.12, 0.14, M.timber);
      for (const e of [-1.5, 1.5]) acc.beam(V(px + lean + e, top - 1.3, zp), V(px + lean + e * 0.2, top - 0.2, zp), 0.07, 0.07, M.timber, [PAT.none], { noEnds: true });
      // the crane: body, neck and beak, tail, two trailing legs: flat cards with ruled edges
      const cx = px + lean, cy = top + 0.32, o = { double: true, col: M.cloth.lit }, C = (dx, dy) => V(cx + dx * 0.62, cy + dy * 0.62, zp);
      acc.quad(C(-0.9, 0), C(0.2, -0.38), C(0.95, 0.12), C(-0.1, 0.42), M.cloth, [PAT.none], o);
      acc.quad(C(0.7, 0.02), C(1.75, 0.74), C(2.35, 0.7), C(0.8, 0.2), M.cloth, [PAT.none], o);
      acc.quad(C(-1.7, -0.3), C(-0.8, -0.06), C(-0.75, 0.2), C(-1.55, 0.02), M.cloth, [PAT.none], { ...o, col: M.beam.shade });
      acc.setAnim(0, 0, 0, 0);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------
// Life on the deck: a double row of stalls, 40 parasols, a sedan chair meeting a donkey train at the crown.
// Returns the static dab-figures (stall keepers, bearers, drovers) for the crowd builder.
async function buildDeckLife(acc, rng, M, dabs, nParasols = 40, pause = async () => {}) {
  const stripes = () => [PAT.stripes, rng.range(0.42, 0.7), 1];
  const parasol = (x, z, y, r, poleH, kindCol) => {
    acc.setAnim(x, y, z, 1);
    acc.tube(V(x, y, z), V(x, y + poleH, z), 0.065, 0.05, M.timber, [PAT.none], { sides: 5, caps: false });
    const mat = kindCol < 0.36 ? M.cloth : kindCol < 0.56 ? M.oiled : kindCol < 0.78 ? M.red : kindCol < 0.9 ? M.blue : M.greyCloth;
    acc.cone(x, y + poleH - 0.12, z, r, r * rng.range(0.26, 0.4), 12, mat, { phase: rng() * 6 });
    acc.box(x, y + poleH + r * 0.36, z, 0.16, 0.22, 0.16, M.beam, [PAT.none], { taper: 0.4 });
    acc.setAnim(0, 0, 0, 0);
  };
  let parasols = 0, booths = 0;
  for (const side of [-1, 1]) {
    let x = -27.5 + rng.range(0, 1.5);
    while (x < 26) {
      await pause();
      const len = rng.range(3.0, 4.3), xc = x + len / 2, zc = side * 4.5, y = deckY(xc), ylo = Math.min(deckY(x), deckY(x + len)), type = rng();
      const zl = zc - side * 1.3, zb = zc + side * 1.25;      // lane edge and back (rail side) edge
      if (Math.abs(xc) < 2.6 && side > 0) { x += len; continue; }   // keep the crown's upstream rail clear for the crowd
      if (type < 0.5) {
        // awning booth: four poles, a striped cloth pitched to the lane, a valance that lifts in the air
        const hF = rng.range(4.1, 4.7), hB = hF + rng.range(0.6, 1.1);
        for (const [px, pz, h] of [[x + 0.15, zl, hF], [x + len - 0.15, zl, hF], [x + 0.15, zb, hB], [x + len - 0.15, zb, hB]]) acc.tube(V(px, deckY(px), pz), V(px, ylo + h, pz), 0.085, 0.07, M.timber, [PAT.none], { sides: 5, caps: false });
        const a = V(x - 0.25, ylo + hF, zl - side * 0.5), b = V(x + len + 0.25, ylo + hF, zl - side * 0.5), c = V(x + len + 0.25, ylo + hB, zb), d = V(x - 0.25, ylo + hB, zb), st = stripes();
        const cm = booths % 3 === 0 ? M.blue : booths % 3 === 1 ? M.cloth : M.red; booths++;
        if (cm !== M.cloth) st[2] = 2;
        side > 0 ? acc.quad(b, a, d, c, cm, st, { double: true, u0: 0 }) : acc.quad(a, b, c, d, cm, st, { double: true, u0: 0 });
        acc.setAnim(xc, ylo + hF, zl - side * 0.5, 2);
        acc.quad(V(a.x, a.y - 0.6, a.z), V(b.x, b.y - 0.6, b.z), b, a, cm, st, { double: true, u0: 0, col: cm.lit });
        acc.setAnim(0, 0, 0, 0);
      } else if (type < 0.82) {
        // mat-roofed shed: plank back, pitched woven roof on a ridge pole
        const h = rng.range(3.8, 4.3), hr = h + 1.1;
        for (const px of [x + 0.15, x + len - 0.15]) for (const pz of [zl, zb]) acc.tube(V(px, deckY(px), pz), V(px, ylo + h, pz), 0.1, 0.085, M.timber, [PAT.none], { sides: 5, caps: false });
        const r0 = V(x - 0.3, ylo + hr, zc), r1 = V(x + len + 0.3, ylo + hr, zc), wv = [PAT.weave, 0.34, 0.34];
        acc.quad(V(x - 0.3, ylo + h - 0.15, zc + 1.75), V(x + len + 0.3, ylo + h - 0.15, zc + 1.75), r1, r0, M.mat, wv, { double: true });
        acc.quad(V(x + len + 0.3, ylo + h - 0.15, zc - 1.75), V(x - 0.3, ylo + h - 0.15, zc - 1.75), r0, r1, M.mat, wv, { double: true });
        acc.tube(r0.clone().setX(r0.x - 0.2), r1.clone().setX(r1.x + 0.2), 0.09, 0.09, M.log, [PAT.none], { sides: 5 });
        acc.box(xc, ylo + 1.2, zb, len - 0.3, 2.4, 0.08, M.timber, [PAT.planks, 2.7, 0.4], { u0: 0 });
      } else {
        // open pitch under a big parasol
        parasol(xc, zc, y, rng.range(2.1, 2.7), rng.range(4.3, 5.0), rng()); parasols++;
      }
      // counter and wares
      const cw = len * rng.range(0.55, 0.8), ty = y + 1.25;
      acc.box(xc, ty, zl + side * 0.45, cw, 0.12, 0.95, M.timber, [PAT.planks, 2.2, 0.32], { bottom: true, patTop: [PAT.planks, 2.2, 0.32] });
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) acc.box(xc + lx * (cw / 2 - 0.1), ty - 0.66, zl + side * 0.45 + lz * 0.38, 0.1, 1.2, 0.1, M.timber, [PAT.none], { noTop: true });
      const nw = rng.int(3, 6);
      for (let i = 0; i < nw; i++) {
        const wx = xc + (i / (nw - 1) - 0.5) * (cw - 0.6), wz = zl + side * (0.45 + rng.range(-0.2, 0.2)), k = rng();
        if (k < 0.4) acc.tube(V(wx, ty + 0.06, wz), V(wx, ty + rng.range(0.4, 0.7), wz), 0.2, 0.27, M.mat, [PAT.weave, 0.11, 0.11], { sides: 7, capCol: M.cloth.lit });          // basket
        else if (k < 0.7) { acc.tube(V(wx, ty + 0.06, wz), V(wx, ty + 0.6, wz), 0.16, 0.24, M.stone, [PAT.none], { sides: 7 }); acc.tube(V(wx, ty + 0.6, wz), V(wx, ty + 0.82, wz), 0.24, 0.1, M.stone, [PAT.none], { sides: 7 }); } // jar
        else acc.box(wx, ty + 0.3, wz, 0.5, 0.45, 0.5, M.timber, [PAT.planks, 1, 0.15], { patTop: [PAT.none] });                                                              // crate
      }
      // sacks or a tub on the deck behind, and a keeper
      if (rng.chance(0.7)) for (let i = 0; i < 3; i++) acc.box(x + 0.6 + i * 0.55, deckY(x + 0.6) + 0.3 + (i === 1 ? 0.5 : 0), zb - side * 0.5, 0.9, 0.5, 0.6, M.cloth, [PAT.none], { taper: 0.8, ry: rng.range(-0.3, 0.3) });
      dabs.push({ x: xc + rng.range(-0.8, 0.8), y, z: zc + side * 0.35, kind: 2, lean: -side * 0.12 });
      // a parasol at the stall's corner, or a pole with a plain striped banner
      if (parasols < 26 && rng.chance(0.62)) { parasol(x + len + 0.5, zl - side * rng.range(0.0, 0.5), deckY(x + len + 0.5), rng.range(1.6, 2.2), rng.range(4.2, 5.2), rng()); parasols++; }
      else if (rng.chance(0.5)) {
        const bx = x + len + 0.45, by = deckY(bx), bh = rng.range(6.5, 8.2);
        acc.tube(V(bx, by, zb), V(bx, by + bh, zb), 0.09, 0.06, M.log, [PAT.none], { sides: 5 });
        acc.beam(V(bx - 0.1, by + bh - 0.3, zb), V(bx + 1.5, by + bh - 0.3, zb), 0.07, 0.07, M.timber);
        acc.setAnim(bx, by + bh - 0.3, zb, 2);
        acc.quad(V(bx + 0.2, by + bh - 3.4, zb), V(bx + 1.35, by + bh - 3.4, zb), V(bx + 1.35, by + bh - 0.35, zb), V(bx + 0.2, by + bh - 0.35, zb), M.cloth, [PAT.stripes, 0.5, 2], { double: true, lu: 1, lv: 3, u0: 0, col: parasols % 2 ? M.red.lit : M.blue.lit });
        acc.setAnim(0, 0, 0, 0);
      }
      x += len + rng.range(0.9, 2.2);
    }
  }
  await pause();
  // the rest of the 40 parasols are carried: in the lane and over the rail crowd
  while (parasols < nParasols) {
    if (parasols % 8 === 0) await pause();
    const rail = rng.chance(0.55), x = rng.range(-24, 24), z = rail ? rng.range(5.9, 6.4) * (rng.chance(0.8) ? 1 : -1) : rng.range(-2.4, 2.4);
    parasol(x, z, deckY(x) + 0.2, rng.range(1.15, 1.6), rng.range(3.3, 3.9), rng()); parasols++;
    dabs.push({ x: x + 0.35, y: deckY(x), z, kind: 2, lean: 0 });
  }
  // sedan chair coming down from the right bank, meeting the donkey train at the crown
  {
    const x = 2.6, z = rng.range(-0.5, 0.5), y = deckY(x) + 1.05;
    acc.setAnim(x, y, z, 3);
    acc.box(x, y + 0.95, z, 1.7, 1.9, 1.5, M.cloth, [PAT.lattice, 0.3, 1], { bottom: true, u0: 0 });
    acc.cone(x, y + 1.9, z, 1.45, 0.75, 4, M.greyCloth, { phase: Math.PI / 4 });
    acc.box(x, y + 2.72, z, 0.2, 0.26, 0.2, M.beam, [PAT.none], { taper: 0.3 });
    for (const pz of [-0.82, 0.82]) acc.tube(V(x - 3.4, y + 0.55, z + pz), V(x + 3.4, y + 0.55, z + pz), 0.07, 0.07, M.timber, [PAT.none], { sides: 5 });
    acc.setAnim(0, 0, 0, 0);
    for (const dx of [-3.0, 3.0]) for (const pz of [-0.5, 0.5]) dabs.push({ x: x + dx, y: deckY(x + dx), z: z + pz, kind: 2, lean: 0 });
  }
  const dz = rng.range(-0.6, 0.6);
  for (let i = 0; i < 5; i++) {
    const x = -3.2 - i * 3.0 + rng.range(-0.3, 0.3), z = dz + rng.range(-0.35, 0.35), y = deckY(x), sl = Math.atan(deckSlope(x));
    const m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationZ(sl));
    acc.setXf(m); acc.setAnim(x, y, z, 3);
    acc.box(0, 1.55, 0, 2.0, 0.85, 0.72, M.greyCloth, [PAT.none], { bottom: true, taper: 0.9 });                 // body
    for (const lx of [-0.75, 0.7]) for (const lz of [-0.22, 0.22]) acc.box(lx, 0.6, lz, 0.13, 1.2, 0.13, M.greyCloth, [PAT.none], { noTop: true });
    acc.beam(V(0.85, 1.75, 0), V(1.55, 2.45, 0), 0.34, 0.42, M.greyCloth);                                        // neck
    acc.beam(V(1.4, 2.5, 0), V(2.2, 2.2, 0), 0.3, 0.36, M.greyCloth);                                             // head
    for (const lz of [-0.1, 0.1]) acc.beam(V(1.5, 2.6, lz), V(1.4, 3.2, lz * 2.2), 0.06, 0.14, M.greyCloth);      // long ears
    acc.beam(V(-1.0, 1.7, 0), V(-1.25, 1.0, 0), 0.07, 0.07, M.beam);                                              // tail
    for (const lz of [-1, 1]) acc.box(-0.1, 1.75, lz * 0.62, 1.25, 1.0, 0.5, M.charcoal, [PAT.ticks, 0.12, 0.3], { bottom: true, taper: 0.85, patTop: [PAT.ticks, 0.12, 0.3] });
    acc.setXf(null); acc.setAnim(0, 0, 0, 0);
    if (i % 2 === 0) dabs.push({ x: x - 1.6, y: deckY(x - 1.6), z: z + 1.0, kind: 2, lean: 0, hat: 1 });
  }
}

// ---------------------------------------------------------------------------------------------------------
// The grain barge. Local frame: bow toward -Z, 25 m long, 5.5 m beam, origin on the waterline amidships.
const BARGE = { len: 25, deck: 1.55, mastZ: -5.2, mastY: 2.4, mastLen: 15, crutch: new THREE.Vector3(-2.1, 2.7, -8.85) };
const bargeHalfBeam = (t) => 2.75 * (1 - 0.52 * Math.pow(Math.abs(t), 3));
const bargeSheer = (t) => BARGE.deck + (t < 0 ? 0.75 * t * t : 1.55 * t * t);
// the forestay's foot: a cleat on the port rail, more than 55 degrees off the bow from the eye, so the stay stays out at the frame's edge
const FORE_FOOT = new THREE.Vector3(-1.75, bargeSheer(-0.848) + 0.3, -10.6);
function buildBargeHull(rng, M) {
  const acc = makeAcc(rng), N = 12, st = [];
  for (let i = 0; i <= N; i++) { const t = -1 + (2 * i) / N; st.push({ z: t * 12.5, hb: bargeHalfBeam(t), sh: bargeSheer(t), kb: -0.55 + 0.75 * Math.pow(Math.abs(t), 2.5) }); }
  const strake = [PAT.planks, 3.4, 0.4];
  for (let i = 0; i < N; i++) {
    const a = st[i], b = st[i + 1], u0 = a.z + 12.5;
    for (const sg of [-1, 1]) {
      const p0 = V(sg * a.hb * 0.78, a.kb, a.z), p1 = V(sg * b.hb * 0.78, b.kb, b.z), p2 = V(sg * b.hb, b.sh, b.z), p3 = V(sg * a.hb, a.sh, a.z);
      const o = { u0, lu: b.z - a.z, lv: 2.2, edges: [i === 0 ? 1 : 0, i === N - 1 ? 1 : 0, 0, 1] };
      sg > 0 ? acc.quad(p1, p0, p3, p2, M.hull, strake, { ...o, edges: [o.edges[1], o.edges[0], 0, 1] }) : acc.quad(p0, p1, p2, p3, M.hull, strake, o);
      // wale along the sheer and a rubbing strake below it
      acc.beam(V(sg * (a.hb + 0.05), a.sh + 0.1, a.z), V(sg * (b.hb + 0.05), b.sh + 0.1, b.z), 0.22, 0.26, M.beam, [PAT.none], { noEnds: i > 0 && i < N - 1 });
    }
    // the foredeck (in the frame for most of the flight) is ruled closer, with a faint grey tint
    acc.quad(V(a.hb, a.sh, a.z), V(-a.hb, a.sh, a.z), V(-b.hb, b.sh, b.z), V(b.hb, b.sh, b.z), M.deck, [PAT.planks, i < 2 ? 2.5 : 5, 0.38], { v0: u0, lu: 5, edges: [0, 0, 0, 0], col: i < 2 ? M.deck.lit.clone().lerp(M.under.lit, 0.3) : undefined });
  }
  const bw = st[0], sn = st[N];
  acc.quad(V(bw.hb, bw.kb, bw.z), V(-bw.hb, bw.kb, bw.z), V(-bw.hb, bw.sh, bw.z), V(bw.hb, bw.sh, bw.z), M.hull, [PAT.planks, 9, 0.4], { u0: 0 });          // square bow
  acc.quad(V(-sn.hb, sn.kb, sn.z), V(sn.hb, sn.kb, sn.z), V(sn.hb, sn.sh, sn.z), V(-sn.hb, sn.sh, sn.z), M.hull, [PAT.planks, 9, 0.4], { u0: 0 });         // transom
  acc.beam(V(-bw.hb - 0.2, bw.sh + 0.1, bw.z), V(bw.hb + 0.2, bw.sh + 0.1, bw.z), 0.3, 0.3, M.beam);
  // arched mat cabin aft of the mast, with plank ends and a door
  const cz0 = 1.2, cz1 = 9.2, cr = 2.25, ch = 2.3, cy = bargeSheer(0.4) - 0.05, seg = 9;
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI, a1 = ((k + 1) / seg) * Math.PI, e = (a) => [Math.cos(a) * cr, cy + 0.5 + Math.sin(a) * (ch - 0.5)];
    const [x0, y0] = e(a0), [x1, y1] = e(a1);
    acc.quad(V(x0, y0, cz1), V(x0, y0, cz0), V(x1, y1, cz0), V(x1, y1, cz1), M.mat, [PAT.weave, 0.36, 0.36], { u0: 0, v0: k * 0.75, lv: 0.75, edges: [1, 1, 0, 0] });
    for (const [zc, f] of [[cz0, 1], [cz1, -1]]) {
      const p = [V(x0, cy, zc), V(x1, cy, zc), V(x1, y1, zc), V(x0, y0, zc)];
      f > 0 ? acc.quad(p[0], p[1], p[2], p[3], M.timber, [PAT.planks, 9, 0.36], { u0: x0 + 3, lu: x1 - x0, edges: [0, 0, 1, 1] }) : acc.quad(p[1], p[0], p[3], p[2], M.timber, [PAT.planks, 9, 0.36], { u0: x0 + 3, lu: x1 - x0, edges: [0, 0, 1, 1] });
    }
  }
  for (const sg of [-1, 1]) acc.box(sg * cr, cy + 0.25, (cz0 + cz1) / 2, 0.12, 0.5, cz1 - cz0, M.timber, [PAT.planks, 3, 0.25], {});
  for (const z of [cz0 + 1.2, (cz0 + cz1) / 2, cz1 - 1.2]) for (const sg of [-1, 1]) acc.beam(V(sg * 0.2, cy + ch + 0.04, z), V(sg * 2.2, cy + 0.75, z), 0.1, 0.06, M.beam, [PAT.none], { noEnds: true }); // roof battens
  acc.box(0, cy + 0.95, cz0 - 0.03, 1.0, 1.7, 0.06, M.charcoal, [PAT.none], {});
  // grain sacks stacked forward of the cabin under a mat
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let l = 0; l < (r === 0 || r === 3 ? 1 : 2); l++) {
    acc.box(-1.45 + c * 0.97 + rng.range(-0.06, 0.06), BARGE.deck + 0.3 + l * 0.52, -3.2 + r * 0.95, 0.9, 0.5, 0.86, M.cloth, [PAT.none], { taper: 0.82, ry: rng.range(-0.12, 0.12) });
  }
  // tabernacle: two cheeks and a pin
  for (const sg of [-1, 1]) acc.box(sg * 0.82, BARGE.deck + 0.95, BARGE.mastZ, 0.3, 2.3, 0.6, M.beam, [PAT.none], {});
  acc.tube(V(-1.15, BARGE.mastY, BARGE.mastZ), V(1.15, BARGE.mastY, BARGE.mastZ), 0.11, 0.11, M.log, [PAT.none], { sides: 6 });
  // forked crutch on the port rail at the bow, its fork below the eye and square to a mast laid 30 degrees to port
  const cx = BARGE.crutch;
  acc.tube(V(cx.x, bargeSheer(cx.z / 12.5) - 0.3, cx.z), V(cx.x, cx.y - 0.7, cx.z), 0.16, 0.13, M.log, [PAT.none], { sides: 6, caps: false });
  for (const sg of [-1, 1]) acc.tube(V(cx.x, cx.y - 0.75, cx.z), V(cx.x + sg * 0.69, cx.y + 0.05, cx.z - sg * 0.4), 0.12, 0.08, M.log, [PAT.none], { sides: 6 });
  // the bow as the eye sees it: the coiled tow rope between two rope-wrapped bitts, a second rope flaked down
  // beside it, a king plank and a breast beam, the two fending poles and the boat-hook lashed along the port rail
  // (flat washes only: every face of the coil, the wraps and the finials is one flat quad in the lit or the shaded wash,
  // ruled with rope turns; nothing here is shaded by interpolating between two vertex colours)
  const fy = bargeSheer(-0.9);
  const prism = (x, z, y0, y1, r0, r1, n, mat, pat) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      acc.quad(V(x + Math.cos(a1) * r0, y0, z + Math.sin(a1) * r0), V(x + Math.cos(a0) * r0, y0, z + Math.sin(a0) * r0), V(x + Math.cos(a0) * r1, y1, z + Math.sin(a0) * r1), V(x + Math.cos(a1) * r1, y1, z + Math.sin(a1) * r1), mat, pat, { u0: k * 0.37, edges: [0, 0, 1, 1] });
    }
  };
  // a flat lid ruled in rings: each sector's pattern coordinate runs out from the centre
  const lid = (x, z, y, r, n, col, period) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, c = V(x, y, z);
      acc.quad(c, V(x + Math.cos(a0) * r, y, z + Math.sin(a0) * r), V(x + Math.cos(a1) * r, y, z + Math.sin(a1) * r), c.clone(), M.rope, [PAT.rope, period, 1], { u0: 0, lu: r, edges: [0, 0, 0, 0], col, double: true });
    }
  };
  // the tow rope: three low flat turns, each ruled with its lay and its rings
  for (let i = 0; i < 3; i++) {
    const r = 0.74 - i * 0.15, y0 = fy + 0.02 + i * 0.11;
    prism(0.15, -11.1, y0, y0 + 0.11, r, r - 0.03, 12, M.rope, [PAT.rope, 0.14, 1]);
    lid(0.15, -11.1, y0 + 0.11, r - 0.03, 12, i === 2 ? M.rope.shade : M.rope.lit, 0.16);
    rng();
  }
  acc.tube(V(0.15, fy + 0.3, -11.1), V(0.6, fy + 0.42, -11.55), 0.08, 0.08, M.rope, [PAT.rope, 0.1, 1], { sides: 5 });
  // two low bitts: a square post, rope turns, and a turned finial (timber, one cinnabar band, a gold ring)
  for (const sg of [-1, 1]) {
    const by = bargeSheer(-0.95), bx = sg * 0.95, bz = -11.75;
    acc.box(bx, by + 0.11, bz, 0.26, 0.22, 0.26, M.beam, [PAT.none], { noTop: true });
    prism(bx, bz, by + 0.02, by + 0.2, 0.2, 0.2, 8, M.rope, [PAT.rope, 0.11, 1]);
    prism(bx, bz, by + 0.2, by + 0.28, 0.225, 0.2, 8, M.red, [PAT.none]);
    prism(bx, bz, by + 0.28, by + 0.4, 0.2, 0.14, 8, M.timber, [PAT.none]);
    acc.tube(V(bx, by + 0.4, bz), V(bx, by + 0.44, bz), 0.16, 0.15, { lit: M.gold.lit, shade: M.gold.lit }, [PAT.none], { sides: 8, capCol: M.gold.lit });
    rng();
  }
  acc.box(FORE_FOOT.x, FORE_FOOT.y - 0.12, FORE_FOOT.z, 0.5, 0.16, 0.2, M.beam, [PAT.none], { u0: 0, bottom: true });        // the forestay's cleat on the port rail
  acc.beam(V(-1.42, bargeSheer(-0.975) + 0.12, -12.18), V(1.42, bargeSheer(-0.975) + 0.12, -12.18), 0.2, 0.22, M.timber, [PAT.none]);     // breast beam
  for (let k = 0; k < 5; k++) {                                         // a rope flaked down in bights on the starboard side
    const z0 = -12.0 + k * 0.26, z1 = z0 + 0.26, x0 = k % 2 ? 1.28 : 0.42, x1 = k % 2 ? 0.42 : 1.28;
    acc.tube(V(x0 * (k === 0 ? 0.9 : 1), fy + 0.09, z0), V(x1, fy + 0.09, z1), 0.075, 0.075, M.rope, [PAT.rope, 0.1, 1], { sides: 5 });
  }
  const pole = (x0, z0, x1, z1, dy, r, mat) => acc.tube(V(x0, bargeSheer(z0 / 12.5) + 0.07 + dy, z0), V(x1, bargeSheer(z1 / 12.5) + 0.07 + dy, z1), r, r * 0.8, mat, [PAT.none], { sides: 6, capCol: M.endGrain });
  pole(-1.12, -12.45, -2.38, -7.1, 0, 0.07, M.log); pole(-1.25, -12.25, -2.5, -7.0, 0.01, 0.07, M.timber); pole(-1.18, -12.8, -2.42, -7.4, 0.13, 0.055, M.log);
  acc.quad(V(-1.16, bargeSheer(-1) + 0.2, -12.86), V(-1.0, bargeSheer(-1) + 0.2, -12.74), V(-0.98, bargeSheer(-1) + 0.46, -12.78), V(-1.14, bargeSheer(-1) + 0.4, -12.9), M.charcoal, [PAT.none], { double: true });   // the hook
  for (const lz of [-11.2, -8.4]) { const lx = -1.12 + (-2.38 + 1.12) * (lz + 12.45) / 5.35 - 0.06; acc.tube(V(lx - 0.02, bargeSheer(lz / 12.5) + 0.02, lz - 0.1), V(lx - 0.04, bargeSheer(lz / 12.5) + 0.02, lz + 0.14), 0.19, 0.19, M.rope, [PAT.rope, 0.09, 1], { sides: 7, caps: false }); }
  // big balanced rudder with its tiller over the stern, and a sculling sweep
  const ry = bargeSheer(1);
  acc.quad(V(0, -0.5, 12.6), V(0, -0.5, 15.3), V(0, ry - 0.9, 14.7), V(0, ry - 0.9, 12.6), M.hull, [PAT.planks, 9, 0.42], { double: true, u0: 0 });
  acc.tube(V(0, 0.2, 12.75), V(0, ry + 1.5, 12.75), 0.16, 0.14, M.log, [PAT.none], { sides: 6 });
  acc.beam(V(0, ry + 1.3, 12.75), V(0.4, ry + 0.9, 9.0), 0.14, 0.16, M.timber);
  acc.tube(V(2.1, ry + 1.5, 9.5), V(3.4, -0.3, 16.5), 0.08, 0.06, M.timber, [PAT.none], { sides: 5 });
  acc.quad(V(3.3, 0.6, 15.9), V(3.45, -0.5, 16.6), V(3.75, -0.4, 16.5), V(3.55, 0.7, 15.8), M.timber, [PAT.none], { double: true });
  return acc.build();
}
// bipod mast: built upright from its pivot (origin), +Y to the head
function buildMast(rng, M) {
  const acc = makeAcc(rng), L = BARGE.mastLen;
  for (const sg of [-1, 1]) acc.tube(V(sg * 0.55, 0, 0), V(sg * 0.1, L, 0), 0.19, 0.11, M.log, [PAT.planks, 9, 0.5], { sides: 7, capCol: M.endGrain });
  for (let i = 1; i <= 6; i++) { const y = (i / 7) * L, w = 0.55 - 0.45 * (i / 7) + 0.2; acc.beam(V(-w, y, 0), V(w, y, 0), 0.1, 0.12, M.timber); }
  acc.box(0, L - 0.5, 0, 0.6, 0.7, 0.36, M.beam, [PAT.none], { bottom: true });            // masthead block
  acc.tube(V(0, L - 1.6, 0), V(0, L - 1.0, 0), 0.26, 0.26, M.rope, [PAT.rope, 0.12, 1], { sides: 7, caps: false });
  acc.box(0, -0.9, 0, 0.5, 1.2, 0.3, M.beam, [PAT.none], { bottom: true });                // heel below the pin
  // rope lashings where every second rung meets a leg (the laid mast passes close under the eye)
  let k = 0; acc.setRng(() => ((k++ * 0.618034) % 1));
  for (const i of [2, 4, 6]) for (const sg of [-1, 1]) {
    const y = (i / 7) * L, f = y / L, x = sg * (0.55 - 0.45 * f), r = 0.19 - 0.08 * f + 0.05, dx = -sg * 0.45 * 0.25 / L;
    acc.tube(V(x - dx, y - 0.25, 0), V(x + dx, y + 0.25, 0), r, r, M.rope, [PAT.rope, 0.11, 1], { sides: 7, caps: false });
  }
  return acc.build();
}
const BARGE_CREW = [[1.6, 1.75, -10.6, 0.15], [-1.5, 1.75, -9.6, -0.15], [0.9, 1.6, -6.4, 0], [-1.2, 1.6, -4.2, 0], [1.9, 1.6, -0.6, 0], [0.5, 3.85, 6.5, 0], [1.9, 3.1, 10.6, 0]];

// ink ribbon set: polylines rebuilt on the CPU each frame (a few hundred vertices)
function makeRibbons(maxPts, mat) {
  const pos = new Float32Array(maxPts * 2 * 3), dir = new Float32Array(maxPts * 2 * 3), side = new Float32Array(maxPts * 2), idx = [];
  for (let i = 0; i < maxPts; i++) { side[i * 2] = -1; side[i * 2 + 1] = 1; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3).setUsage(THREE.DynamicDrawUsage));
  const sideAttr = new THREE.BufferAttribute(side, 1).setUsage(THREE.DynamicDrawUsage); g.setAttribute('aSide', sideAttr);
  for (let i = 0; i < maxPts - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  const index = new THREE.Uint16BufferAttribute(idx, 1); g.setIndex(index);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  let n = 0;
  return {
    mesh,
    begin() { n = 0; },
    // add a polyline; consecutive polylines are joined by a degenerate (zero-width) bridge
    line(pts, wide = 1) {
      if (n + pts.length + 2 > maxPts) return;
      for (let i = -1; i <= pts.length; i++) {
        const k = Math.min(pts.length - 1, Math.max(0, i)), p = pts[k], a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
        const deg = i < 0 || i >= pts.length ? 0 : 1;
        let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
        for (let s = 0; s < 2; s++) { const o = (n * 2 + s) * 3; pos[o] = p.x; pos[o + 1] = p.y; pos[o + 2] = p.z; dir[o] = dx * deg; dir[o + 1] = dy * deg; dir[o + 2] = dz * deg; }
        side[n * 2] = -wide; side[n * 2 + 1] = wide;
        n++;
      }
    },
    end() { for (let o = n * 6; o < pos.length; o++) { pos[o] = 0; dir[o] = 0; } g.attributes.position.needsUpdate = true; g.attributes.aDir.needsUpdate = true; sideAttr.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------------------------------------------------
// Crowd: one instanced card per dab-figure
function buildCrowd(list, mat) {
  const n = list.length, home = new Float32Array(n * 4), info = new Float32Array(n * 4), col = new Float32Array(n * 3);
  list.forEach((d, i) => {
    home.set([d.x, d.y || 0, d.z, d.ph], i * 4); info.set([d.kind, d.h, d.lean || 0, d.hat ? 1 : 0], i * 4); col.set([d.col.r, d.col.g, d.col.b], i * 3);
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// the hero's own patch of aged silk: bare-silk river with sliding ruled flow lines, whorls, bank tops, a seal
const SILK_VERT = /* glsl */`
  varying vec3 vP; varying vec3 vW;
  #include <fog_pars_vertex>
  void main() {
    vP = position;
    vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const SILK_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk, uPale, uGrey, uSeal; uniform float uLinePx, uTime; uniform vec4 uBarge; uniform vec4 uSealAt;
  varying vec3 vP; varying vec3 vW;
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main() {
    vec2 p = vP.xz; float px = uLinePx;
    float gx = max(length(vec2(dFdx(p.x), dFdy(p.x))), 1e-6), gz = max(length(vec2(dFdx(p.y), dFdy(p.y))), 1e-6);
    float fwp = max(gx, gz);
    vec2 pdx = dFdx(p), pdy = dFdy(p);
    float rad = length(p);
    vec3 col = uSilk;
    // foxing, long creases, pale repair patches, weave
    float fox = smoothstep(0.58, 0.86, vnoise(p * 0.045 + 3.0) * 0.7 + vnoise(p * 0.13) * 0.3);
    col = mix(col, uSilk * 0.9, fox * 0.55);
    vec2 pc = floor((p + vec2(37.0, 11.0)) / vec2(64.0, 46.0));
    vec2 pf = fract((p + vec2(37.0, 11.0)) / vec2(64.0, 46.0));
    float mend = step(0.72, h21(pc)) * step(0.2, pf.x) * step(pf.x, 0.55) * step(0.3, pf.y) * step(pf.y, 0.62);
    col = mix(col, mix(uSilk, uPale, 0.4), mend * 0.28);
    float crease = 1.0 - smoothstep(0.0, 0.5 + fwp, abs(fract((p.x * 0.22 + p.y) / 190.0 + 0.3) - 0.5) * 190.0);
    col = mix(col, uSilk * 0.86, crease * 0.5);
    float wv = (1.0 - smoothstep(0.012, 0.035, fwp)) * sin(p.x * 52.0) * sin(p.y * 52.0);
    col *= 1.0 + 0.035 * wv;
    float line = 0.0;
    float fade = 1.0 - smoothstep(95.0, 150.0, rad);
    if (vP.y < 1.0) {
      // the river: long ruled flow lines sliding downstream (-z), pinched and quickened under the bridge
      float pinch = exp(-p.y * p.y / 420.0);
      float cx = p.x * (1.0 + 0.14 * pinch) + 0.7 * sin(p.y * 0.043 + 1.3) + 0.3 * sin(p.y * 0.11);
      // the barge parts the lines
      vec2 bd = p - uBarge.xz; float bw = exp(-bd.x * bd.x / 30.0) * (1.0 - smoothstep(10.0, 22.0, abs(bd.y)));
      cx += sign(bd.x + 1e-4) * 1.6 * bw * (1.0 - smoothstep(0.0, 4.0, abs(bd.x)) * 0.5);
      float period = 2.7, lid = floor(cx / period), hh = h11(lid);
      float len = 38.0 + 30.0 * hh;
      float seg = fract((p.y + uTime * (3.0 + 1.6 * hh)) / len + hh * 9.0);
      float on = smoothstep(0.0, 0.02, seg) * (1.0 - smoothstep(0.42 + 0.3 * h11(lid + 5.0), 0.46 + 0.3 * h11(lid + 5.0), seg)) * step(0.42, h11(lid + 17.0));
      float fwc = max(length(vec2(dFdx(cx), dFdy(cx))), 1e-6);
      float water = 1.0 - smoothstep(21.0, 21.6, abs(p.x));
      line = ruled(cx, period, fwc, px * 0.85) * on * water * fade * (1.0 - 0.9 * bw);
      // whorls: ruled arcs turning in the lee of the pier noses and astern of the barge
      float c4 = cos(uBarge.w), s4 = sin(uBarge.w);
      for (int i = 0; i < 6; i++) {
        vec2 q = i == 0 ? vec2(-18.2, -10.6) : i == 1 ? vec2(18.2, -10.6) : i == 2 ? vec2(-18.4, 10.4) : i == 3 ? vec2(18.4, 10.4)
               : uBarge.xz + vec2(c4 * (i == 4 ? -2.2 : 2.2) + s4 * 14.5, c4 * 14.5 - s4 * (i == 4 ? -2.2 : 2.2));
        vec2 d = p - q; float r = length(d) + 1e-4;
        float ang = atan(d.y, d.x + 1e-5) + uTime * (i < 2 ? 0.7 : -0.6) * (mod(float(i), 2.0) < 0.5 ? 1.0 : -1.0) + r * 1.1;
        float arc = smoothstep(0.1, 0.5, sin(ang)) * (1.0 - smoothstep(2.2, 3.1, r)) * smoothstep(0.25, 0.5, r);
        vec2 dn = d / r; float fr = max(length(vec2(dot(pdx, dn), dot(pdy, dn))), 1e-6);
        line = max(line, ruled(r, 0.62, fr, px) * arc * water);
      }
    } else {
      // bank tops: one ruled edge where the embankment meets the water
      line = inkLine(abs(abs(p.x) - 22.0), gx, px * 1.2) * step(21.0, abs(p.y)) * step(2.9, vP.y) * fade;
    }
    col = mix(col, uInk, clamp(line, 0.0, 1.0));
    // a collector's seal stamped flat: square, abstract fret, four-fold symmetric, uneven ink
    vec2 sq = (p - uSealAt.xy) / uSealAt.z; float cs = cos(uSealAt.w), sn = sin(uSealAt.w);
    sq = vec2(cs * sq.x - sn * sq.y, sn * sq.x + cs * sq.y);
    vec2 aq = abs(sq); float dd = max(aq.x, aq.y), mn = min(aq.x, aq.y);
    float fs = fwp / uSealAt.z;
    float ink = smoothstep(0.80 - fs, 0.80 + fs, dd);                                                 // border
    ink = max(ink, smoothstep(0.50 - fs, 0.50 + fs, dd) * (1.0 - smoothstep(0.64 - fs, 0.64 + fs, dd)) * smoothstep(0.10 - fs, 0.10 + fs, mn));
    ink = max(ink, smoothstep(0.22 - fs, 0.22 + fs, dd) * (1.0 - smoothstep(0.36 - fs, 0.36 + fs, dd)) * smoothstep(0.07 - fs, 0.07 + fs, abs(aq.x - aq.y)));
    ink = max(ink, (1.0 - smoothstep(0.08 - fs, 0.08 + fs, dd)));
    ink = max(ink, (1.0 - smoothstep(0.045 - fs, 0.045 + fs, mn)) * smoothstep(0.36, 0.38, dd) * (1.0 - smoothstep(0.5, 0.52, dd)));
    ink *= 1.0 - smoothstep(1.0 - fs, 1.0 + fs, dd);
    float press = 0.72 + 0.28 * smoothstep(0.25, 0.6, vnoise(p * 2.3 + 9.0));
    col = mix(col, uSeal, ink * press);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;
function buildUnderlay(mat) {
  const P = [], I = []; let n = 0;
  const quad = (x0, z0, x1, z1, y) => { P.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1); I.push(n, n + 2, n + 1, n, n + 3, n + 2); n += 4; };
  const R = 700;
  quad(-22, -R, 22, R, 0);                                              // river
  for (const sg of [-1, 1]) {                                           // bank tops and the bank face beyond the quays
    quad(sg > 0 ? 22 : -R, -R, sg > 0 ? R : -22, R, BANK_Y - 0.004);
    const x = sg * 22, a = n; P.push(x, -1, -R, x, -1, R, x, BANK_Y, R, x, BANK_Y, -R);
    sg > 0 ? I.push(a, a + 1, a + 2, a, a + 2, a + 3) : I.push(a, a + 2, a + 1, a, a + 3, a + 2); n += 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -0.5;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// progress curves (all pure functions of p so the world can ask for them ahead of time)
const bargeX = (p) => (p < 0.5 ? 2.2 * (1 - sstep(0.0, 0.5, p)) : -4 * sstep(0.5, 1.0, p));
const bargeAt = (p) => {
  const dx = bargeX(p + 0.01) - bargeX(p - 0.01), dz = -107 * 0.02;
  return { position: new THREE.Vector3(bargeX(p), 0, 62 - 107 * p), yaw: Math.atan2(-dx, -dz) };   // yaw about +Y; the bow is local -Z
};
const DEG = Math.PI / 180;
const mastElevation = (p) => {
  // three checked drops, each a fall that fetches up short with a small bounce, then the settle onto the crutch
  const drop = (a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (1.0 + 0.12 * Math.sin(Math.min(1, Math.max(0, (p - b) / 0.02)) * Math.PI)); };
  let e = 86 - 24 * Math.min(1.06, drop(0.03, 0.082)) - 22 * Math.min(1.06, drop(0.11, 0.16)) - 18 * Math.min(1.06, drop(0.19, 0.243));
  e -= 20 * sstep(0.8, 0.95, p);
  return e * DEG;
};
const mastYaw = (p) => (13 * sstep(0.03, 0.245, p) + 17 * sstep(0.8, 0.95, p)) * DEG;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [silk, pale, ink, grey, ochre, green, verm] = pal;
  const mx = (a, b, t) => a.clone().lerp(b, t), two = (lit, shade) => ({ lit, shade });
  // the mineral colours of the blue-green manner, laid as thin flat washes: malachite, azurite, gold (cinnabar is the seal's red)
  const mn = opts.minerals || {}, mal = new THREE.Color(mn.mal || '#3F8F74'), azu = new THREE.Color(mn.azu || '#2E5E94'), gold = new THREE.Color(mn.gold || '#C9A227');
  const M = {
    red: two(verm.clone(), mx(verm, ink, 0.22)), blue: two(azu.clone(), mx(azu, ink, 0.25)),
    green: two(mal.clone(), mx(mal, ink, 0.25)), gold: two(gold.clone(), mx(gold, ochre, 0.4)),
    log: two(mx(pale, ochre, 0.25), mx(grey, silk, 0.15)), endGrain: pale.clone(),
    beam: two(mx(ochre, silk, 0.15), mx(grey, ink, 0.2)), timber: two(mx(pale, ochre, 0.45), mx(grey, silk, 0.2)),
    rope: two(pale.clone(), mx(ochre, grey, 0.4)), deck: two(mx(pale, silk, 0.2), mx(grey, silk, 0.4)),
    under: two(mx(grey, silk, 0.35), mx(grey, silk, 0.35)), rail: two(mx(pale, silk, 0.3), mx(pale, silk, 0.3)),
    stone: two(pale.clone(), mx(grey, pale, 0.2)), stoneTop: two(pale.clone(), pale.clone()),
    cloth: two(pale.clone(), mx(pale, grey, 0.45)), oiled: two(ochre.clone(), mx(ochre, grey, 0.5)),
    greyCloth: two(mx(grey, pale, 0.35), grey.clone()), mat: two(mx(ochre, silk, 0.4), mx(grey, silk, 0.35)),
    charcoal: two(mx(grey, ink, 0.35), mx(grey, ink, 0.5)), hull: two(mx(ochre, pale, 0.3), mx(grey, silk, 0.1)),
  };
  if (opts.snow) { M.deck = two(pale.clone(), mx(pale, grey, 0.2)); M.mat = two(pale.clone(), mx(pale, grey, 0.3)); M.stoneTop = two(pale.clone(), pale.clone()); }
  if (opts.litShift) for (const k in M) if (M[k].lit) M[k] = two(mx(M[k].lit, grey, opts.litShift), M[k].shade);
  // the deck soffit (the only thing drawn in M.under that looks down): a deep flat ink wash, so the arch is a dark mouth
  M.under.under = M.under.shade.clone().lerp(INK_WASH, 0.6);
  const root = new THREE.Group(); root.name = 'rainbow-bridge';
  const anchors = { mooring: [] };

  // shared uniforms: every material sees the same ink, silk, line width, time and progress
  const S = {
    uInk: { value: ink }, uSilk: { value: silk }, uPale: { value: pale }, uGrey: { value: grey }, uSeal: { value: verm }, uGold: { value: gold.clone() }, uAzur: { value: azu }, uMal: { value: mal },
    uLinePx: { value: opts.linePx ?? 1.9 }, uTime: { value: 0 }, uSurge: { value: 0 }, uProgress: { value: 0 },
    uFade: { value: new THREE.Vector2(opts.fadeNear ?? 160, opts.fadeFar ?? 220) }, uBarge: { value: new THREE.Vector4(0, 0, 400, 0) },
    uRes: { value: new THREE.Vector2(1280, 720) }, uMist: { value: new THREE.Vector4(0, 0, 45, 95) }, uMistBand: { value: new THREE.Vector4(0.56, 0.9, 5, 15) }, uClip: { value: new THREE.Vector4(0, 0, 0, 0) }, uRipple: { value: new THREE.Vector3(0, 0, 30) }, uSealAt: { value: new THREE.Vector4(-12.5, 31 + rng.range(-3, 6), 1.7, rng.range(-0.2, 0.2)) },
  };
  const mk = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...S }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const inkMat = mk(INK_VERT, INK_FRAG), dabMat = mk(DAB_VERT, DAB_FRAG, { side: THREE.DoubleSide }), ribMat = mk(RIB_VERT, RIB_FRAG, { side: THREE.DoubleSide });

  // ---- static bridge: one buffer, one draw call
  const acc = makeAcc(rng), dabs = [], pause = async () => { await ctx.yield?.(); };
  await pause();
  await buildArch(acc, rng, M, pause);
  await pause();
  buildDeck(acc, rng, M);
  await ctx.yield?.();
  buildBanks(acc, rng, M, opts, anchors);
  await ctx.yield?.();
  await buildDeckLife(acc, rng, M, dabs, opts.parasols ?? 40, pause);
  await pause();
  const staticLines = [], variant = { festoon: rng.chance(0.5), drapes: rng.int(5, 11) };
  buildExtras(acc, rng, M, anchors, staticLines, variant);
  await ctx.yield?.();
  const bridge = new THREE.Mesh(await acc.buildAsync(pause), inkMat); bridge.name = 'bridge'; root.add(bridge);
  await ctx.yield?.();

  // ---- barges
  const hasBarge = opts.barge !== false, hullGeo = buildBargeHull(rng, M);
  await ctx.yield?.();
  const mastGeo = buildMast(rng, M);
  const barge = new THREE.Group(), mast = new THREE.Mesh(mastGeo, inkMat);
  barge.add(new THREE.Mesh(hullGeo, inkMat), mast); mast.position.set(0, BARGE.mastY, BARGE.mastZ); mast.rotation.order = 'YXZ';
  // a striped cinnabar pennant on a short yard at our mast head: it hangs plumb whatever the mast does, so that the
  // spar coming down into the frame reads at once as a mast (it is drawn up short as the mast is laid in its crutch)
  const pa = makeAcc(() => 0.5);
  pa.beam(V(-0.2, 0, 0), V(1.0, 0, 0), 0.08, 0.08, M.timber, [PAT.none], { u0: 1 });
  pa.setAnim(0.45, 0, 0, 2);
  for (let k = 0; k < 3; k++) pa.quad(V(0.8, -0.06 - k * 0.75, 0), V(0.8, -0.06 - (k + 1) * 0.75, 0), V(0.1, -0.06 - (k + 1) * 0.75, 0), V(0.1, -0.06 - k * 0.75, 0), M.red, [PAT.stripes, 0.5, 2], { double: true, u0: k * 0.75, col: M.red.lit, edges: [k === 0 ? 1 : 0, 0, 1, 1] });
  pa.quad(V(0.1, -2.31, 0), V(0.1, -3.0, 0), V(0.3, -2.62, 0), V(0.45, -2.31, 0), M.red, [PAT.none], { double: true, col: M.red.lit });
  pa.quad(V(0.45, -2.31, 0), V(0.6, -2.62, 0), V(0.8, -3.0, 0), V(0.8, -2.31, 0), M.red, [PAT.none], { double: true, col: M.red.lit });
  pa.setAnim(0, 0, 0, 0);
  const pennant = new THREE.Mesh(pa.build(), inkMat); pennant.name = 'pennant'; barge.add(pennant);
  barge.visible = hasBarge; root.add(barge);
  const s2 = rng.chance(0.5) ? 1 : -1, barge2 = new THREE.Group(), mast2 = new THREE.Mesh(mastGeo, inkMat);
  barge2.add(new THREE.Mesh(hullGeo, inkMat), mast2); mast2.position.set(0, BARGE.mastY, BARGE.mastZ); mast2.rotation.set(-0.06, 0, 0.02);
  barge2.position.set(s2 * rng.range(11.5, 13.5), 0, rng.range(37, 43)); S.uSealAt.value.x = -s2 * rng.range(11, 14); barge2.rotation.y = -s2 * rng.range(0.34, 0.5); root.add(barge2);
  const skiff = new THREE.Mesh(hullGeo, inkMat); skiff.scale.set(0.42, 0.5, 0.36); skiff.position.set(-s2 * 20.2, -0.1, -15.5 - rng.range(0, 3)); skiff.rotation.y = rng.range(-0.08, 0.08) + Math.PI; root.add(skiff);
  barge2.updateMatrix(); skiff.updateMatrix();
  await ctx.yield?.();

  // ---- crowd
  const robes = [pale, mx(pale, ochre, 0.6), ochre, mx(grey, pale, 0.45), grey, mx(silk, pale, 0.4), mx(green, pale, 0.2), mx(grey, ink, 0.35), azu.clone(), mx(azu, pale, 0.3), mal.clone(), verm.clone()];
  const robeW = [3, 4, 4, 4, 4, 3, 1, 2, 4, 4, 3, 4], robeSum = robeW.reduce((a, b) => a + b, 0);
  const robe = () => { let r = rng() * robeSum; for (let i = 0; i < robes.length; i++) { r -= robeW[i]; if (r <= 0) return robes[i]; } return robes[0]; };
  for (let i = 0; i < 300; i++) dabs.push({ x: rng.range(-26, 26), z: 6.45 + rng.range(-0.1, 0.1), kind: 1, lean: rng.range(0.6, 0.95) });
  for (let i = 0; i < Math.round(240 * detail); i++) dabs.push({ x: rng.range(-29, 29), z: rng.range(-2.7, 2.7), kind: 0 });
  for (let i = 0; i < 46; i++) { const x = rng.range(-25, 25); dabs.push({ x, y: deckY(x), z: -6.45 + rng.range(-0.1, 0.1), kind: 2, lean: -rng.range(0.5, 0.8) }); }
  for (let i = 0; i < Math.round(44 * detail); i++) {       // watchers on the quays and at the bridge heads
    const sg = rng.chance(0.5) ? 1 : -1, zs = rng.chance(0.7) ? 1 : -1;
    dabs.push({ x: sg * rng.range(23.6, 26.5), y: BANK_Y, z: zs * rng.range(10, 21.5), kind: 2, lean: 0, hat: rng.chance(0.3) });
  }
  for (const c of BARGE_CREW) {
    if (hasBarge && c[2] > -7) dabs.push({ x: c[0], y: c[1], z: c[2], kind: 3, lean: c[3], hat: true });   // nobody stands in front of the eye at the bow
    const w = V(c[0], c[1], c[2]).applyMatrix4(barge2.matrix); dabs.push({ x: w.x, y: w.y, z: w.z, kind: 2, lean: 0, hat: true });
  }
  for (const d of dabs) { d.ph = rng() * Math.PI * 2; d.h = d.h || rng.range(2.35, 2.85); d.col = d.col || robe(); if (d.hat === undefined) d.hat = rng.chance(0.22); }
  await ctx.yield?.();
  const crowd = buildCrowd(dabs, dabMat); crowd.name = 'crowd'; root.add(crowd);
  await ctx.yield?.();

  // ---- ink ribbons (stays, halyard, thrown rope, fending poles, mooring lines, dust)
  const rib = makeRibbons(640, ribMat); rib.mesh.name = 'ropes'; root.add(rib.mesh);
  const ropeMat = new THREE.ShaderMaterial({ uniforms: { ...ribMat.uniforms, uInk: { value: mx(ochre, pale, 0.55) } }, vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, fog: true, side: THREE.DoubleSide });
  const rope2 = makeRibbons(32, ropeMat); rope2.mesh.name = 'thrown-rope'; rope2.mesh.renderOrder = 1; root.add(rope2.mesh);
  const ropeFrom = V(rng.range(-2.5, -0.5), deckY(1.5) + 1.6, 7.05);
  const steam = dabs.filter((d) => d.kind === 2 && d.lean).slice(0, 12).filter((d, i) => i % 4 === 1).map((d) => V(d.x + 0.5, d.y + 1.75, d.z - Math.sign(d.z) * 1.2));
  const dust = []; for (let i = 0; i < 16; i++) dust.push([rng.range(-9, 9), rng.range(-6.5, 6.5), rng(), rng.range(0.25, 0.5)]);
  const moorPost = anchors.mooring.reduce((best, m) => (m.distanceTo(barge2.position) < best.distanceTo(barge2.position) ? m : best), anchors.mooring[0]);
  const skiffPost = anchors.mooring.reduce((best, m) => (m.distanceTo(skiff.position) < best.distanceTo(skiff.position) ? m : best), anchors.mooring[0]);

  // ---- silk underlay
  let underlay = null;
  if (opts.underlay !== false) { underlay = buildUnderlay(mk(SILK_VERT, SILK_FRAG)); underlay.name = 'silk'; root.add(underlay); }

  // ---- motion
  let progress = opts.progress ?? null, mastOverride = null, yawOverride = null, lastP = 0, pose = null, carried = true, sink = 0;
  const L = BARGE.mastLen, bufSize = new THREE.Vector2(), linePx0 = S.uLinePx.value;
  const bowBitt = FORE_FOOT.clone(), backL = V(-2.65, bargeSheer(0.05) + 0.25, 0.6), backR = V(2.65, bargeSheer(0.05) + 0.25, 0.6), heel = V(0, 3.5, BARGE.mastZ + 0.7);
  const mastPoint = (y) => V(0, y, 0).applyMatrix4(mast.matrix);
  const setMastPose = (elev, yaw) => { mast.rotation.set(-(Math.PI / 2 - elev), yaw, 0); mast.updateMatrix(); };
  setMastPose(86 * DEG, 0);
  const restFore = mastPoint(L - 1.3).distanceTo(bowBitt) + 0.05, restHal = mastPoint(L - 0.5).distanceTo(heel) + 0.4;
  const tmp = [], scr = [], scr2 = [], pool = []; let pi = 0;
  const PV = (x, y, z) => { const v = pool[pi] || (pool[pi] = new THREE.Vector3()); pi++; return v.set(x, y, z); };
  const sagLine = (a, b, rest, n = 9) => {
    const d = a.distanceTo(b), sag = Math.min(4.5, Math.sqrt(Math.max(0, (rest - d) * d * 0.375)), Math.max(0.15, (a.y + b.y) / 2 - 0.45));   // never dips under the water
    tmp.length = 0; for (let i = 0; i <= n; i++) { const t = i / n; tmp.push(PV(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 4 * sag * t * (1 - t), a.z + (b.z - a.z) * t)); }
    return tmp;
  };
  const b2bow = V(0, bargeSheer(-1) + 0.4, -12.4).applyMatrix4(barge2.matrix), skBow = V(0, bargeSheer(-1) + 0.4, -12.4).applyMatrix4(skiff.matrix);

  function apply(p, time) {
    lastP = p;
    S.uTime.value = time; S.uProgress.value = p;
    S.uSurge.value = sstep(0.15, 0.5, p) * (1 - 0.55 * sstep(0.64, 0.84, p));
    // our barge: along the fly line, bow nodding
    let byaw;
    if (pose) { barge.position.set(pose.x, 0, pose.z); byaw = pose.yaw; } else { const bp = bargeAt(p); barge.position.copy(bp.position); byaw = bp.yaw; }
    barge.position.y = 0.06 * Math.sin(time * 0.8) - sink;
    barge.rotation.set(0.014 * Math.sin(time * 0.9 + 1.0), byaw, 0.01 * Math.sin(time * 0.6)); barge.updateMatrix();
    barge.visible = hasBarge && carried;
    setMastPose(mastOverride ?? mastElevation(p), yawOverride ?? mastYaw(p));
    pennant.position.set(0, L + 0.12, 0).applyMatrix4(mast.matrix); pennant.scale.y = Math.min(1, Math.max(0.16, (pennant.position.y - 2.2) / 3.2));
    S.uBarge.value.set(barge.position.x, carried ? barge.position.y : -500, hasBarge ? barge.position.z : 400, byaw);
    barge2.rotation.z = 0.012 * Math.sin(time * 0.5 + 2.0); barge2.rotation.x = 0.008 * Math.sin(time * 0.7);
    skiff.rotation.z = 0.03 * Math.sin(time * 0.9);
    // ribbons (scratch vectors from a pool: nothing is allocated per frame once it has filled)
    pi = 0;
    rib.begin();
    const W = (v) => v.applyMatrix4(barge.matrix);
    if (hasBarge && carried) {
      const head = W(PV(0, L - 1.3, 0).applyMatrix4(mast.matrix)), top = W(PV(0, L - 0.5, 0).applyMatrix4(mast.matrix));
      // the forestay: as the mast comes down into the frame it is cast off the bitt and gathered in along the mast to the
      // tabernacle, so that no line hangs from the mast head across the arch
      const elv = mastOverride ?? mastElevation(p), fk = 1 - sstep(44 * DEG, 66 * DEG, elv);
      const fore = W(PV(0, 0, 0).copy(bowBitt).lerp(PV(0.3, 1.2, 0).applyMatrix4(mast.matrix), fk));
      rib.line(sagLine(head, fore, restFore + (head.distanceTo(fore) + 0.05 - restFore) * fk));
      rib.line(sagLine(head, W(PV(0, 0, 0).copy(backL)), 0)); rib.line(sagLine(head, W(PV(0, 0, 0).copy(backR)), 0));
      rib.line(sagLine(top, W(PV(0, 0, 0).copy(heel)), restHal, 7));
      const act = sstep(0.36, 0.44, p) * (1 - sstep(0.62, 0.7, p));
      if (act > 0.01) for (let sg = -1; sg <= 1; sg += 2) {            // fending poles: stowed out of sight until they are wanted
        const s = (time * 0.22 + (sg > 0 ? 0.5 : 0)) % 1, hand = PV(sg * 1.75, 3.0, -10.4);
        const tip = PV(sg * 2.3, 2.3, -3.0).lerp(PV(sg * 6.6, -0.4 + 2.2 * sstep(0.8, 1, s), -15.5 + 7 * s), act);
        const butt = PV(0, 0, 0).copy(hand).sub(tip).multiplyScalar(0.28).add(hand);
        scr.length = 0; scr.push(W(butt), W(hand), W(tip)); rib.line(scr, 2);
      }
    }
    // the rope thrown from the rail: uncoils as it falls, later hauled back up
    // (it comes down ahead of the bow, in front of the dark arch: a pale ochre line three widths wide inside an
    // ink outline, with the last of the coil still turning at its end)
    const e = sstep(0.2, 0.4, p), haul = sstep(0.74, 0.95, p), len = 10.5 * e * (1 - 0.85 * haul);
    rope2.begin();
    if (len > 0.05) {
      scr.length = 0; scr2.length = 0;
      let lx = 0, ly = 0, lz = 0;
      for (let i = 0; i <= 15; i++) {
        const s = i / 15, c = 0.6 * (1 - e) * s + 0.12 * s;
        lx = ropeFrom.x + Math.sin(s * 9 + time * 1.6) * c + 0.25 * Math.sin(time * 0.8) * s * s; ly = ropeFrom.y - s * len; lz = ropeFrom.z + 0.25 + Math.cos(s * 9 + time * 1.6) * c + 1.1 * s * (1 - 0.5 * s);
        scr.push(PV(lx, ly, lz)); scr2.push(PV(lx, ly, lz + 0.12));
      }
      const cr = 0.5 * (1 - 0.6 * haul) * (1 - 0.45 * sstep(0.4, 0.5, p));
      for (let i = 1; i <= 11; i++) {                         // the coil: a turn and a half, hanging under the end
        const a = i * 0.86 + time * 1.2, r = cr * (1 - 0.035 * i), x = lx + Math.sin(a) * r, y = ly - cr + Math.cos(a) * r, z = lz + 0.02 * i;
        scr.push(PV(x, y, z)); scr2.push(PV(x, y, z + 0.12));
      }
      rib.line(scr, 3.5); rope2.line(scr2, 2.3);
    }
    rope2.end();
    rib.line(sagLine(b2bow, moorPost, b2bow.distanceTo(moorPost) + 1.2 + 0.4 * Math.sin(time * 0.5)));
    rib.line(sagLine(skBow, skiffPost, skBow.distanceTo(skiffPost) + 0.5));
    for (let k = 0; k < staticLines.length; k++) rib.line(staticLines[k]);
    for (let k = 0; k < steam.length; k++) for (let j = 0; j < 3; j++) {       // kettle steam: three curling ruled lines
      const q = steam[k]; scr.length = 0;
      for (let i = 0; i <= 8; i++) { const a = i * 0.75 - time * 1.4 + j * 2.1 + k; scr.push(PV(q.x + (j - 1) * 0.22 + Math.sin(a) * 0.05 * i, q.y + i * 0.3, q.z + Math.cos(a * 0.8) * 0.05 * i)); }
      rib.line(scr);
    }
    for (let k = 0; k < dust.length; k++) {                  // dust sifting from the planks under the crown
      const d = dust[k], f = (time * d[3] * 0.6 + d[2]) % 1, y = deckY(d[0]) - 0.5 - f * 3.4;
      scr.length = 0; scr.push(PV(d[0], y, d[1]), PV(d[0], y - 0.3 - 0.3 * d[2], d[1])); rib.line(scr);
    }
    rib.end();
  }
  await ctx.yield?.();
  apply(progress ?? 0.34, 12);
  await ctx.yield?.();

  // ---- anchors (local space)
  const railY = (x) => deckY(x) + 1.55;
  Object.assign(anchors, {
    flyThrough: [[2.2, 70], [1.9, 50], [1.1, 28], [0.3, 12], [0, 0], [-0.4, -12], [-1.6, -30], [-3.3, -48], [-4, -64]].map(([x, z]) => V(x, 4.2, z)),
    portalSeat: { position: V(0, 7.5, -60), normal: V(0, 0, 1), radius: 7 },
    sealSight: { eye: V(0, 4.2, 46), through: V(0, 8.2, 7), target: V(0, 26, -168) },
    viewpoints: { approach: V(2, 4.2, 62), mastFrame: V(1.5, 4.2, 34), under: V(0, 4.2, 3), deck: V(-6, 13.5, 0.5), downstream: V(-4, 4.2, -40) },
    crown: V(0, 11, 0), soffit: V(0, 9, 0), firstBeam: V(0, 9, BEAMS_Z[3]), beamsZ: BEAMS_Z.slice().reverse(),
    railUp: [V(-26, railY(26), 6.92), V(0, railY(0), 6.92), V(26, railY(26), 6.92)], railDown: [V(-26, railY(26), -6.92), V(0, railY(0), -6.92), V(26, railY(26), -6.92)],
    ropeFrom, abutments: [V(-19.2, 0, 0), V(19.2, 0, 0)],
    bargeAt, progressAt: (z) => (62 - z) / 107, deckY,
    mastHeadAt: (p) => { const b = bargeAt(p), el = mastElevation(p), yw = mastYaw(p) + b.yaw; return V(b.position.x - Math.sin(yw) * Math.cos(el) * L, BARGE.mastY + Math.sin(el) * L, b.position.z + BARGE.mastZ - Math.cos(yw) * Math.cos(el) * L); },
  });

  return {
    object: root, radius: 30, height: 18.5, center: V(0, 6.5, 0), anchors,
    ground: false, groundY: 0,
    barge: { object: barge, mast, crutch: BARGE.crutch.clone(), eye: V(2, 4.2, -8.5) },
    uniforms: S, mats: { ink: inkMat, dab: dabMat, rib: ribMat }, tones: M, geo: { hull: hullGeo, mast: mastGeo },
    // the world steers the barge itself: local x, z and yaw (bow toward local -Z at yaw 0); null returns it to the fly line
    setBargePose(x, z, yaw) { if (x === null) pose = null; else { pose = pose || { x: 0, z: 0, yaw: 0 }; pose.x = x; pose.z = z; pose.yaw = yaw; } },
    // false while the world is drawn through the previous portal: the barge, its rigging and its crew are not shown
    setCarried(v) { carried = !!v; },
    // metres the barge is lowered by (the world lets the bow sink out of frame as the camera lifts off it)
    setSink(v) { sink = v || 0; },
    setProgress(u) { progress = Math.min(1, Math.max(0, u)); },
    setMast(a, yaw = null) { mastOverride = a; yawOverride = yaw; },
    get progress() { return lastP; },
    update(dt, time, camera) {
      void dt; void camera;
      if (ctx.renderer?.getDrawingBufferSize) {
        ctx.renderer.getDrawingBufferSize(bufSize);
        if (bufSize.y > 0) { S.uRes.value.copy(bufSize); S.uLinePx.value = linePx0 * Math.min(2.2, Math.max(0.85, bufSize.y / 720)); }
      }
      // until the world calls setProgress the piece plays itself on a 40 s loop
      apply(progress ?? ((time / 40 + 0.04) % 1), time);
    },
    dispose() {},
  };
}

// things hung, leaned and strung on the bridge: cloths over the rails, ladders on the pier noses, baskets
// slung from the tie-log heads, and (on some seeds) a string of plain pennants across each bridge head
function buildExtras(acc, rng, M, anchors, lines, variant) {
  for (let i = 0; i < variant.drapes; i++) {
    const sg = rng.chance(0.5) ? 1 : -1, x = rng.range(-24, 24), w = rng.range(1.0, 1.9), h = rng.range(0.9, 1.5), z = sg * 7.06;
    const y0 = deckY(x) + 1.56, y1 = deckY(x + w) + 1.56, striped = rng.chance(0.5);
    acc.setAnim(x + w / 2, (y0 + y1) / 2, z, 2);
    acc.quad(V(x, y0 - h, z), V(x + w, y1 - h, z), V(x + w, y1, z), V(x, y0, z), M.cloth, striped ? [PAT.stripes, 0.24, 1] : [PAT.none], { double: true, u0: 0, col: rng.chance(0.5) ? M.cloth.lit : i % 2 ? M.red.lit : M.blue.lit });
    acc.setAnim(0, 0, 0, 0);
  }
  for (const sg of [-1, 1]) {
    // ladder from the water to the pier ledge, leaning on the upstream or downstream nose
    const zs = rng.chance(0.5) ? 1 : -1, lx = sg * 19.05, z0 = zs * rng.range(3.0, 6.0);
    for (const dz of [-0.42, 0.42]) acc.beam(V(lx - sg * 0.55, -0.3, z0 + dz), V(lx + sg * 0.75, BANK_Y + 0.9, z0 + dz), 0.1, 0.12, M.timber, [PAT.none]);
    for (let r = 0; r < 7; r++) { const t = (r + 0.7) / 7.6; acc.beam(V(lx - sg * 0.55 + sg * 1.3 * t, -0.3 + (BANK_Y + 1.2) * t, z0 - 0.42), V(lx - sg * 0.55 + sg * 1.3 * t, -0.3 + (BANK_Y + 1.2) * t, z0 + 0.42), 0.07, 0.07, M.timber, [PAT.none], { noEnds: true }); }
    // rope fender coils slung on the pier face
    for (let k = 0; k < 2; k++) {
      const z = rng.range(-8, 8), y = rng.range(1.1, 2.1), x = sg * (19.2 + 0.55 * (y + 0.8) / 3.8) - sg * 0.22;
      acc.tube(V(x - sg * 0.12, y, z), V(x + sg * 0.12, y, z), 0.5, 0.5, M.rope, [PAT.rope, 0.14, 1], { sides: 10, capCol: M.rope.shade });
      lines.push([V(x, y + 0.45, z), V(sg * 19.8, BANK_Y + 0.2, z)]);
    }
  }
  // baskets and a lantern-shaped fish trap slung from tie-log heads
  for (const tx of TIES_X) for (const sg of [-1, 1]) {
    if (!rng.chance(0.42)) continue;
    const y = tieY(tx), z = sg * 7.85, drop = rng.range(1.0, 2.2);
    lines.push([V(tx, y - 0.2, z), V(tx, y - drop, z)]);
    acc.setAnim(tx, y, z, 2);
    acc.tube(V(tx, y - drop - 0.7, z), V(tx, y - drop, z), 0.24, 0.36, M.mat, [PAT.weave, 0.12, 0.12], { sides: 7, capCol: M.cloth.shade });
    acc.setAnim(0, 0, 0, 0);
  }
  // under the two downstream beams, either side of the barge's line: baskets, a coil of rope and a fish trap on short
  // lines, so that what comes in at the top of the frame as we pass under the crown reads as the bridge's own gear
  acc.setRng(() => 0.37);
  for (const [bx, bz, drop, kind] of [[-4.6, -5.25, 1.5, 0], [-1.4, -5.25, 2.1, 1], [5.4, -5.25, 1.7, 0], [7.2, -5.25, 1.1, 2], [-6.2, -1.75, 1.2, 2], [4.3, -1.75, 1.6, 1]]) {
    const y = 9.0;
    lines.push([V(bx, y, bz), V(bx, y - drop, bz)]);
    acc.setAnim(bx, y, bz, 2);
    if (kind === 0) acc.tube(V(bx, y - drop - 0.7, bz), V(bx, y - drop, bz), 0.24, 0.36, M.mat, [PAT.weave, 0.12, 0.12], { sides: 7, capCol: M.cloth.shade });
    else if (kind === 1) { acc.tube(V(bx, y - drop - 1.0, bz), V(bx, y - drop - 0.5, bz), 0.12, 0.34, M.mat, [PAT.weave, 0.1, 0.1], { sides: 7, capCol: M.cloth.shade }); acc.tube(V(bx, y - drop - 0.5, bz), V(bx, y - drop, bz), 0.34, 0.1, M.mat, [PAT.weave, 0.1, 0.1], { sides: 7, capCol: M.cloth.shade }); }
    else acc.tube(V(bx - 0.09, y - drop - 0.42, bz), V(bx + 0.09, y - drop - 0.42, bz), 0.42, 0.42, M.rope, [PAT.rope, 0.13, 1], { sides: 10, capCol: M.rope.shade });
    acc.setAnim(0, 0, 0, 0);
  }
  if (variant.festoon && anchors.vanePoles) {
    for (let k = 0; k + 1 < anchors.vanePoles.length; k += 2) {
      const a = anchors.vanePoles[k].top.clone().lerp(anchors.vanePoles[k].base, 0.42), b = anchors.vanePoles[k + 1].top.clone().lerp(anchors.vanePoles[k + 1].base, 0.42), n = 13, pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push(V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 5.2 * t * (1 - t), a.z + (b.z - a.z) * t)); }
      lines.push(pts);
      for (let i = 1; i < n; i++) {
        const q = pts[i], hw = 0.42, len = rng.range(1.0, 1.5);
        acc.setAnim(q.x, q.y, q.z, 2);
        acc.quad(V(q.x, q.y - len, q.z - 0.06), V(q.x, q.y - len, q.z + 0.06), V(q.x, q.y, q.z + hw), V(q.x, q.y, q.z - hw), M.cloth, [PAT.none], { double: true, col: [M.cloth.lit, M.blue.lit, M.red.lit, M.gold.lit][i % 4] });
        acc.setAnim(0, 0, 0, 0);
      }
    }
  }
}

export { makeAcc, PAT, GLSL_COMMON, GLSL_MIST, GLSL_RIPPLE, DAB_FRAG, buildCrowd, makeRibbons };
