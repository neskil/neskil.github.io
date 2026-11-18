// THE CYCLONE OF WINGS: hero set piece for the world "manta-cyclone" (procedural; imports three only).
//
// WHAT     A hollow, turning column of reef mantas seen from inside its eye: three lanes (an inner lane packed nose to
//          tail in 8-10 tiers of thirteen, a middle lane of 60, a loose outer lane), ~200 animals, plus a 28-animal
//          chain that arrives from open water on the +z side and merges with the outer lane (it runs on the clock),
//          ONE animal looping back-somersaults beside the top of the gold column (its loop stands in the upright
//          plane through the funnel's axis and runs on the world clock from its own seeded phase; its wing tips are
//          lifted, so nose-on or edge-on it is a shallow V), one that can breach the ceiling (setBreach),
//          3,400 fusiliers (round spindle bodies under 28 cm with a forked tail and a dorsal fin, drawn at every
//          distance as the live ribbon's fish are: cobalt on top, a silver flank that flashes as the fish rolls, a
//          short gold tail stripe) in TEN SCHOOLS THAT LIVE IN THE WORLD: each circles the funnel
//          on the world clock at its own seeded height (spread from 5 to 20 m above the sand), distance inside the
//          eye wall and speed (3-4.6 m/s, twice the mantas', with the turn), rising and sinking once a turn, and each
//          has a shape: a teardrop 9-14 m long (crowded behind a rounded head 3 m thick, thinning down a tapering
//          tail), a slender arc 14-18 m round the wall, or a ball; no haze lies under them (the designers: nothing blue but the fish's backs) and a tenth of
//          the fish are stragglers behind them; within 15 m of the ring a whole school dips under its 7 m sphere. The whale shark has a school of its own, 430 more fish that live in
//          its frame (setBow: snout, heading, scale): a dense ball ahead of the snout that splits round the head and
//          streams back along both cheeks; remoras (0.65-1 m, slate with a bone
//          stripe) under bellies, and one under the chin of whichever animals are dealt the full model;
//          a cone of motes pouring into every mouth, eight narrow sun beams that sweep the
//          eye from the first second (BEAM_GLSL: every shader lights itself where a beam crosses it), a broad sun shaft
//          that stands down the eye when asked (a leaning column of lit water with a pale skin that fades out before
//          its own rim, a gold core threaded with drifting rays and a bright spine, cut analytically by every shader:
//          see SHAFT_FN_GLSL; the narrow beams' ribbons fade near the lens and where the view runs up them; bellies flare
//          gold inside it, backs stay black and carry thin gold caustic lines), and soft wing shadows on the sand.
//          Backs are never flat cut-outs: a faint sheen of the water's blue along the leading edge and where the skin
//          turns away, thin crawling caustic lines within 15 m (only on skin seen from above), feathered grey shoulder
//          marks near the lens that are drawn plainer with distance (from 5 to 13 m they become a soft pale-grey wedge
//          on each shoulder, broadest beside the spine, a pale wing tip and a hair of pale trailing edge: MANTA_FRAG
//          farK). No manta is drawn above
//          the surface (y > 28.02: the breach passes out of sight there; a world's ceiling need not write depth).
//          Every manta is one modelled animal (thick diamond disc, open rectangular mouth with rust-striped gill plates
//          inside, two cephalic scoops (on the full model each is a rolled lobe, C-shaped in section, pale lips and a
//          shaded hollow), eyes, dorsal fin, a dark whip tail that hangs in a visible bend and sways)
//          placed and animated in the vertex shader: wings beat as a travelling wave (root to tip, leading edge to
//          trailing edge, tips curling half a beat late), animals bank into the turn and bob. Full-detail models are
//          dealt out every frame to the 18 inner- and middle-lane animals nearest the lens (pickNear), so whatever
//          comes at the camera on its climb is the detailed animal; the rest use the low model.
//          A second body can be kept clear: setCapsule(nose, tail, radius) parts mantas and fusiliers round the
//          world's whale shark (no animal's centre comes nearer its axis than 0.72 of the radius) and lets them close
//          behind it; setBow(point, heading, scale) carries the shark's own 430 fusiliers.
// SIZE     Local space: origin on the sand under the axis, +Y up, sea surface at y = 28 (so the world places the
//          object at world y = -28). Column y 2..26, eye radius 9 m at the bottom widening to 13 m at the top,
//          outer lane radius ~21-23. radius 23, height 28, center (0, 13, 0). The chain reaches out to (-34, 10.5, 74).
//          Seen from above the column turns anticlockwise (opts.turn = -1 mirrors the whole object in z:
//          anchors stay valid in local space, so always convert them with hero.object.localToWorld).
// OPTS     palette   7 hex strings in the brief's order: water, deep shadow, sun gold, belly bone, back black,
//                    slate cloud, fusilier cobalt.
//          turn      +1 (default) anticlockwise seen from above, -1 clockwise (mirrors the object in z).
//          tiers     8..10 inner-lane tiers (default: seeded).      melanistic  share of all-black morphs 0..0.33 (seeded)
//          chain     (true) build the 28-animal chain.              ribbon      (true) fusilier ribbon
//          shaft     (true) broad sun shaft mesh.                   beams       (true) the eight narrow beams' ribbons
//          shadows   (true) wing shadows at y = 0.05.               remoras     (true) remoras on bellies and chins
//          bio       (0) night bioluminescence 0..1: wing edges and the ribbon shed blue-green sparks (never as a
//                    block: they fade out inside 2.5-7 m of the lens).
// PER SEED tiers (8-10), share of melanistic animals, every belly blotch pattern and shoulder mark, animal sizes
//          (3.5-4.5 m), beat rates and phases, lane populations, every school's height, radius, speed, length and
//          shape, the somersaulter's phase,
//          bank angle, phase of the whole wheel, where the eight beams stand and how they wander.
//          (No draw is burnt any more: the cast drawn after the wheel's bank, animals, fish, motes, remoras, beams, is dealt anew on every seed.)
// CONTROLS hero.setShaft(0..1) the broad shaft (or hero.setProgress(u): in over u 0.488-0.545 when setShaft is never
//          called); hero.setBeams(k, color) strength and colour of the narrow beams; hero.setShaftTint(Color);
//          hero.setLight({ sunDir, sunColor, keyColor, ambientUp, ambientDown, water, sun, caustic });
//          hero.setBio(0..1); hero.setShadow(k); hero.setFogTint(up, down): colour multipliers on the scene fog for
//          things seen looking up / looking down; hero.setFogFar(Color, k): the colour the water takes far from the
//          lens (waterFog in LIGHT_PARS_GLSL; k 0 = off).
//          Keep-outs: the camera passed to update() pushes animals away inside 4.5 m of the lens (setPush);
//          setClear(Vector3 local, radius) keeps a sphere clear (7 m round portalSeat by default);
//          setCapsule(a, b, radius) a capsule (radius 0 = none); setThrough(true) while the world is seen through
//          the previous portal hides every animal and fish between the entry plane and the viewer.
//          hero.setBreach(k): k 0..1 drives one manta up through the ceiling at hero.breachHole (-3.3, 28, -8: over the
//          west side of the mouth, 16 m from the ring) and back with a plume of bubbles; below 0 parks it.
//          Exports ORBIT_GLSL, NOISE_GLSL, LIGHT_PARS_GLSL, FOG_FADE_GLSL, SHAFT_FN_GLSL, BEAM_GLSL for the world's
//          own shaders: its sand, ceiling, reef and whale shark call shaftGlow() and beamAt() too.
// ANCHORS  (local space, y above the sand)
//          portalSeat   { position (-8, 21.5, 3.5), normal, radius 4.5 }: the ring under the ceiling
//          flyThrough   the brief's camera line: the floor of the eye, then one climb up the funnel against the turn
//          entry        (2, 1.5, -3.5), on the sand inside the eye;  entryDir +z
//          eye          (0, 6.5, 0);  eyeRadius(y) -> clear radius of the funnel at height y
//          eyeLook      a point on the axis at y 22;  columnMid (0, 13, 0);  surfaceY 28
//          somersault   centre of the 2.5 m back-somersault loop beside the column's head
//          shaftTop / shaftFoot   the broad shaft's axis (it leans toward the sun, -z);  shaftRadius 4.5
//          chainPath / chainLength   the chain's spline (open water -> outer lane)
//          viewpoints   [{ position, target }] composed views (floor, low orbit, the well, the ring)
// LIGHTING Self-lit shaders: they do NOT read scene lights. Key (sun through the surface, pale gold, toward -z) and
//          the blue water fill are uniforms (setLight). Scene fog is honoured (FogExp2 or Fog). Three tones are held:
//          backs albedo 0.03, bellies capped at 0.72, water between; the shaft adds gold to the water and to bellies,
//          and only its pale skin to the animals' veil: never gold over black backs, never white. Tails fade toward
//          a darker tone than the water behind them, never lighter.
//          Bloom only on fusilier flanks (up to ~1.6). Every additive layer (motes, shaft, beams, bubbles) has
//          renderOrder 9.
// COST     ~302k triangles at detail 1, 13 draw calls with the shaft, 12 where a world passes shaft: false (mantas x3: the low herd, the 18 full-detail slots with the
//          somersaulter and the breach animal, the chain; motes x3, remoras x2, ribbon, shaft, beams,
//          bubbles, shadows), no lights, no textures. update() rewrites three small instance attributes (the 18 full-detail slots) and nothing else.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#2F8062', '#0B2E2A', '#D8C56A', '#EDF1E4', '#0A1013', '#B9D2C8', '#2E8FD8'];
const SURFACE_Y = 28;

// ------------------------------------------------------------------------------------------------------------
// The animal. Rest pose: nose +Z, back +Y, right wing +X, 4 m across (scaled per instance).
// aUV.x = side (1 back, 0 belly, 0.5 on the rim), aUV.y = chord 0..1 (skin) / depth (mouth) / length (scoop, tail)
// aPart: 0 skin, 2 mouth lining, 3 scoop, 4 eye, 5 tail and fin
// ------------------------------------------------------------------------------------------------------------
const lipMask = (a) => { const t = Math.min(1, Math.max(0, (a - 0.2) / 0.1)); return 1 - t * t * (3 - 2 * t); };
function zLE(a) {
  if (a < 0.21) return 0.93 + 0.02 * (1 - (a / 0.21) * (a / 0.21));
  const b = (a - 0.21) / 0.79;
  return 0.93 - 0.42 * b - 0.55 * Math.pow(b, 2.2) - 0.36 * Math.pow(b, 6);
}
const zTE = (a) => -1.10 + 0.20 * a + 0.42 * a * a + 0.08 * Math.pow(a, 6);
const bodyHalf = (a) => 0.21 * Math.exp(-(a / 0.2) * (a / 0.2)) + 0.085 * Math.exp(-(a / 0.5) * (a / 0.5)) + 0.035 * (1 - a) + 0.004;
const chordProf = (c) => 2.75 * Math.sqrt(c) * Math.pow(1 - c, 1.2);
const LIP_T = 0.115, LIP_B = 0.105;

function buildMantaGeometry(hero) {
  const side = hero
    ? [0, 0.07, 0.14, 0.21, 0.255, 0.30, 0.36, 0.42, 0.49, 0.56, 0.63, 0.70, 0.77, 0.83, 0.89, 0.94, 0.975, 1]
    : [0, 0.21, 0.30, 0.45, 0.62, 0.80, 0.93, 1];
  const stations = [];
  for (let i = side.length - 1; i > 0; i--) stations.push(-side[i]);
  for (let i = 0; i < side.length; i++) stations.push(side[i]);
  const nv = hero ? 12 : 5;
  const P = [], UV = [], PART = [], IDX = [];
  const vert = (x, y, z, sd, aux, part) => { P.push(x, y, z); UV.push(sd, aux); PART.push(part); return P.length / 3 - 1; };
  // adds the triangles of a section, flipping the winding so that normals point away from (sgn>0) or toward `hint`
  const section = (tris, hint, sgn) => {
    let s = 0;
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t] * 3, b = tris[t + 1] * 3, c = tris[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      s += nx * ((P[a] + P[b] + P[c]) / 3 - hint[0]) + ny * ((P[a + 1] + P[b + 1] + P[c + 1]) / 3 - hint[1]) + nz * ((P[a + 2] + P[b + 2] + P[c + 2]) / 3 - hint[2]);
    }
    const flip = s * sgn < 0;
    for (let t = 0; t < tris.length; t += 3) IDX.push(tris[t], flip ? tris[t + 2] : tris[t + 1], flip ? tris[t + 1] : tris[t + 2]);
  };
  const grid = (rows, cols, at) => { // rows x cols vertices -> index of first, triangles
    const first = P.length / 3, tris = [];
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) at(i, j);
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
      const a = first + i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      tris.push(a, c, b, b, c, d);
    }
    return { first, tris };
  };

  // --- disc: one ring of 2nv+1 vertices per span station (back from leading to trailing edge, then belly back)
  const ring = 2 * nv + 1, seam = [];
  const disc = grid(stations.length, ring, (i, j) => {
    const s = stations[i], a = Math.abs(s), top = j <= nv;
    const c = Math.pow((top ? j : 2 * nv - j) / nv, 1.5);
    const le = zLE(a), te = zTE(a), lip = lipMask(a), k = Math.pow(1 - c, 4);
    const th = bodyHalf(a) * chordProf(c) * (a > 0.999 ? 0 : 1);
    let y = top ? th * 1.1 + LIP_T * lip * k : -th * 0.8 - LIP_B * lip * k;
    // a faint spine ridge on the back and a slight droop of the wing toward the tip at rest
    if (top) y += 0.012 * Math.exp(-(a / 0.05) * (a / 0.05)) * Math.sin(Math.PI * c);
    y -= 0.05 * a * a;
    const sd = j === nv ? 0.5 : (j === 0 ? 0.5 + 0.5 * lip : (j === 2 * nv ? 0.5 - 0.5 * lip : (top ? 1 : 0)));
    vert(2 * s, y, le + (te - le) * c, sd, c, 0);
    if (j === 2 * nv && lip < 0.001) seam.push(P.length / 3 - 1 - 2 * nv, P.length / 3 - 1);
  });
  section(disc.tris, [0, 0, -0.1], 1);

  // --- mouth: roof, floor and back wall of the cavity, sharing the lip line of the disc
  const mouthSt = stations.filter((s) => Math.abs(s) <= 0.3001), D = hero ? 3 : 2, DEPTH = 0.55;
  const mcols = 2 * D + 2;
  const mouth = grid(mouthSt.length, mcols, (i, j) => {
    const s = mouthSt[i], a = Math.abs(s), lip = lipMask(a);
    const roof = j <= D, d = (roof ? j : 2 * D + 1 - j) / D;
    const shrink = 1 - 0.45 * d;
    const y = (roof ? LIP_T : -LIP_B) * lip * shrink - 0.05 * a * a;
    vert(2 * s * (1 - 0.12 * d), y, zLE(a) - DEPTH * d, roof ? 1 : 0, d, 2);
  });
  section(mouth.tris, [0, 0, 0.72], -1);
  return { P, UV, PART, IDX, vert, section, grid, seam, hero };
}

function finishMantaGeometry(g) {
  const { P, UV, PART, IDX, vert, section, grid, seam, hero } = g;
  // --- cephalic scoops: two curved paddles either side of the mouth, cupped inward
  // The full model's scoop is a rolled lobe: nine spans of a C-shaped section (seven points round the outer face, seven
  // back round the inner one, 2 cm of flesh between), open toward the mouth, its lower lip curling in under it. aUV.x
  // runs 0 on the outer face, about 0.5 on the lips and 1 in the depth of the roll (the shader shades it by that);
  // aPart 3.2 tells the shader this is the rolled lobe (the far model keeps the flat paddle, aPart 3).
  if (hero) for (const sx of [-1, 1]) {
    const LS = 9, NA = 7, KS = 2 * NA;
    const lobe = grid(LS, KS + 1, (i, j) => {
      const t = i / (LS - 1), jj = j % KS, outer = jj < NA, f = outer ? jj / (NA - 1) : 1 - (jj - NA) / (NA - 1);
      const prof = Math.pow(Math.sin(Math.PI * (0.22 + 0.78 * t)), 0.7) * (t > 0.999 ? 0.03 : 1);
      const flesh = outer ? 0 : 0.02 * Math.min(1, prof * 1.5);
      const ry = 0.17 * prof - flesh, rx = (0.085 - 0.03 * t) * Math.min(1, prof * 1.3) - flesh;
      const th = (f - 0.5) * 4.1, sn = Math.sin(th), cs = Math.cos(th), low = Math.max(-sn, 0), e = Math.abs(2 * f - 1);
      const cx = sx * (0.5 + 0.05 * t * t), cy = -0.015 - 0.07 * t, cz = 0.84 + 0.56 * t;
      vert(cx + sx * (rx * cs - 0.075 * low * low * (0.35 + 0.65 * t) * (1 - 0.6 * e * e * e)), cy + ry * sn, cz - 0.05 * Math.abs(sn),
        outer ? 0.46 * e * e * e : 0.54 + 0.46 * (1 - e * e), t, 3.2);
    });
    section(lobe.tris, [sx * 0.52, -0.08, 1.14], 1);
  }
  const L = 3, K = 4;
  if (!hero) for (const sx of [-1, 1]) {
    const lobe = grid(L, K + 1, (i, j) => {
      const t = i / (L - 1), ph = (j / K) * Math.PI * 2;
      const h = 0.17 * Math.pow(Math.sin(Math.PI * (0.22 + 0.78 * t)), 0.7) * (t > 0.999 ? 0.02 : 1);
      const cx = sx * (0.475 + 0.05 * t * t), cy = -0.015 - 0.07 * t, cz = 0.84 + 0.56 * t;
      const sn = Math.sin(ph), cs = Math.cos(ph);
      const ox = sx * cs * 0.036 * (1 - 0.5 * t) - sx * (sn < 0 ? 0.15 : 0.04) * sn * sn * (0.35 + 0.65 * t); // cupped: the lower edge curls in under the mouth
      vert(cx + ox, cy + sn * h, cz - 0.05 * Math.abs(sn), cs < 0 ? 1 : 0, t, 3);
    });
    section(lobe.tris, [sx * 0.52, -0.08, 1.14], 1);
  }
  // --- eyes (hero only; the far animals get theirs painted)
  if (hero) for (const sx of [-1, 1]) {
    const eye = grid(5, 7, (i, j) => {
      const th = (i / 4) * Math.PI, ph = (j / 6) * Math.PI * 2, r = 0.05;
      vert(sx * 0.535 + r * Math.sin(th) * Math.cos(ph), 0.0 + r * Math.cos(th), 0.775 + r * Math.sin(th) * Math.sin(ph), 0.5, 0, 4);
    });
    section(eye.tris, [sx * 0.535, 0.0, 0.775], 1);
  }
  // --- whip tail: tapered tube; aUV.y = 0 at the root .. 1 at the tip
  const TS = hero ? 9 : 4, TK = hero ? 5 : 3;
  const tail = grid(TS, TK + 1, (i, j) => {
    const t = i / (TS - 1), ph = (j / TK) * Math.PI * 2, r = (0.03 * (1 - t) + 0.006) * (1 + 1.1 * Math.exp(-t * 12));
    vert(Math.cos(ph) * r, 0.02 + Math.sin(ph) * r * 0.8 - 0.05 * t, -1.02 - 1.3 * t, 0.5, t, 5);
  });
  section(tail.tris, [0, 0, 30], 1);
  // --- dorsal fin: a small raked blade just ahead of the tail root (both faces)
  const f0 = vert(0, 0.035, -0.80, 1, 0, 5), f1 = vert(0, 0.03, -1.07, 1, 0, 5), f2 = vert(0, 0.21, -1.05, 1, 0, 5), f3 = vert(0, 0.15, -0.93, 1, 0, 5);
  IDX.push(f0, f1, f3, f3, f1, f2, f0, f3, f1, f3, f2, f1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aUV', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(PART, 1));
  geo.setIndex(IDX);
  geo.computeVertexNormals();
  // smooth the rim: the back's and the belly's leading-edge vertices coincide outside the mouth
  const N = geo.attributes.normal.array;
  for (let i = 0; i < seam.length; i += 2) {
    const a = seam[i] * 3, b = seam[i + 1] * 3;
    let x = N[a] + N[b], y = N[a + 1] + N[b + 1], z = N[a + 2] + N[b + 2];
    const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    N[a] = N[b] = x; N[a + 1] = N[b + 1] = y; N[a + 2] = N[b + 2] = z;
  }
  // the fin is flat: give both faces a sideways normal that the shader can light softly
  for (const f of [f0, f1, f2, f3]) { N[f * 3] = 0; N[f * 3 + 1] = 0.6; N[f * 3 + 2] = -0.2; }
  return geo;
}

// ------------------------------------------------------------------------------------------------------------
// Shared GLSL: where an animal is. One function places every manta (and the motes and shadows that ride with it).
// slot = (lane radius, tier height, phase angle, angular speed)   rnd = (seed 0..1, size scale, morph, mode)
// mode 0: on the wheel.  mode 1: back-somersault loop about the slot.  mode 2: free (slot = x, y, z, yaw).
// ------------------------------------------------------------------------------------------------------------
const ORBIT_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uCam;
uniform float uPushR;
uniform vec4 uClear;
uniform vec4 uCapA;      // the whale shark's keep-out capsule: nose end (xyz) and radius (0.01 = off)
uniform vec3 uCapB;      // tail end
uniform vec4 uThru;      // entry point (xyz) and 1 while the world is seen through the previous portal
uniform float uBank;
struct Frame { vec3 p; vec3 f; vec3 u; vec3 r; };
vec3 pushFrom(vec3 p, vec3 c, float R) {
  vec3 d = p - c; float l = length(d); float k = max(R - l, 0.0);
  return p + (d / max(l, 1e-3)) * (0.8 * k * k / max(R, 1e-3));
}
// the capsule: animals slide round the nearest point of the shark's body axis, most of them over or under it
vec3 pushCapsule(vec3 p) {
  vec3 ab = uCapB - uCapA.xyz;
  vec3 c = uCapA.xyz + ab * clamp(dot(p - uCapA.xyz, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  // (by a margin: an animal's centre is never nearer the axis than 0.72 of the radius; it is moved out along a line
  // tipped toward the vertical, by just as far as brings it there, and not at all at the capsule's own skin)
  vec3 e = p - c; float l = length(e), R = uCapA.w;
  if (l >= R) return p;
  vec3 d = e; d.y *= 1.8; d = d / max(length(d), 1e-3) + vec3(0.0, 1e-4, 0.0);
  float want = R * (0.72 + 0.28 * l / max(R, 1e-3)), b = dot(e, d) / dot(d, d);
  return p + d * (-b + sqrt(max(b * b + (want * want - l * l) / dot(d, d), 0.0)));
}
// seen through the previous portal the lens stands behind the entry, outside the wall: whatever swims between it and
// the entry plane is sent under the sand, so the opening shows the floor of the eye
vec3 thruHide(vec3 p) { p.y -= 400.0 * uThru.w * step(p.z - uThru.z, -1.5); return p; }
Frame orbitFrame(vec4 slot, vec4 rnd, vec2 att) {
  Frame F; float sd = rnd.x; vec3 Y = vec3(0.0, 1.0, 0.0);
  if (rnd.w < 0.5) {
    float ang = slot.z + slot.w * uTime;
    float bobT = uTime * 0.43 + sd * 61.0;
    float r = slot.x + 0.45 * sin(uTime * 0.21 + sd * 40.0);
    vec3 o = vec3(cos(ang), 0.0, -sin(ang));
    F.p = o * r + Y * (slot.y + 0.4 * sin(bobT));
    F.f = normalize(vec3(-sin(ang), 0.09 * cos(bobT), -cos(ang)));
    float b = uBank * (0.75 + 0.5 * fract(sd * 17.3)) + 0.06 * sin(uTime * 0.31 + sd * 23.0);
    vec3 up = Y * cos(b) - o * sin(b);
    F.r = normalize(cross(up, F.f)); F.u = cross(F.f, F.r);
  } else if (rnd.w < 1.5) {
    vec3 o = vec3(cos(slot.z), 0.0, -sin(slot.z));
    // (the loop stands in the upright plane through the funnel's axis and its own centre: it climbs on the wall's side
    // and comes down on the eye's; it runs on the world clock from the animal's own seeded phase, one loop in 11.4 s)
    vec3 T = o;
    float th = uTime * 0.55 + sd * 6.283;
    float cs = cos(th), sn = sin(th);
    F.p = o * slot.x + Y * slot.y + 2.5 * (T * sn - Y * cs);
    F.f = T * cs + Y * sn;
    F.u = Y * cs - T * sn;
    F.r = cross(F.u, F.f);
  } else {
    float cy = cos(slot.w), sy = sin(slot.w), cp = cos(att.x), sp = sin(att.x);
    F.p = slot.xyz;
    F.f = vec3(sy * cp, sp, cy * cp);
    vec3 r0 = vec3(cy, 0.0, -sy);
    vec3 u0 = cross(F.f, r0);
    float cr = cos(att.y), sr = sin(att.y);
    F.r = r0 * cr + u0 * sr; F.u = cross(F.f, F.r);
  }
  F.p = pushFrom(F.p, uClear.xyz, uClear.w);
  F.p = pushCapsule(F.p);
  if (rnd.w < 1.5) F.p = pushFrom(F.p, uCam, uPushR);
  F.p = thruHide(F.p);
  return F;
}
`;

const NOISE_GLSL = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float spots(vec2 p, float sd) {
  vec2 ip = floor(p), fp = fract(p); float m = 0.0;
  float nb = vn(p * 2.9 + sd * 3.0 + 5.0) - 0.5, nc = vn(p * 7.3 - sd * 2.0) - 0.5;      // breaks the edge of every blotch
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 id = ip + g + sd;
    vec2 c = g + vec2(h21(id), h21(id + 17.3)) * 0.8 + 0.1 - fp;
    float rad = 0.17 + 0.27 * h21(id + 5.7);
    float on = step(0.42, h21(id + 31.1));
    m = max(m, on * (1.0 - smoothstep(rad * 0.55, rad * 1.05, length(c * vec2(1.0, 1.3)) + (nb * 0.5 + nc * 0.3) * rad)));
  }
  return m;
}
float caustic(vec2 p, float t) {
  p *= 0.55;
  float a = sin(p.x * 1.7 + sin(p.y * 1.3 + t * 0.9) * 1.4 + t * 0.6);
  float b = sin(p.y * 2.1 + sin(p.x * 1.1 - t * 0.7) * 1.6 - t * 0.5);
  float c = sin((p.x + p.y) * 1.4 + sin((p.x - p.y) * 0.9 + t * 0.4) * 1.2);
  float v = 1.0 - abs(a + b + c) / 3.0;
  return v * v * v * 2.2;
}
`;

const MANTA_VERT = /* glsl */`
attribute vec2 aUV;
attribute float aPart;
attribute vec4 iSlot;
attribute vec4 iRnd;
attribute vec4 iBeat;
uniform float uBeatAmp;
varying vec3 vRest;
varying vec3 vN;
varying vec3 vP;
varying vec4 vInfo;
varying vec3 vMorph;
varying float vLoop;
#include <fog_pars_vertex>
${ORBIT_GLSL}
void main() {
  vec3 q = position;
  vec3 n = normal;
  vRest = position;
  float a = clamp(abs(q.x) * 0.5, 0.0, 1.0);
  float sx = q.x < 0.0 ? -1.0 : 1.0;
  float base = iBeat.x * uTime + iBeat.y;
  // travelling wave: lags from the root out and from the leading edge back, so tips curl up and over late
  float ph = base - 1.6 * a + 1.0 * q.z;
  float sn = sin(ph), cn = cos(ph);
  // span^2.2: the inner wing stays an arc and only the outer third curls (1.6 folded the wing like a tent)
  float pa = pow(max(a, 1e-4), 2.2);
  float A = 0.85 * uBeatAmp;
  // a chain animal meeting the lens (mode 2 + show) spreads its wings and lifts the tips: the wave rides on an upward bias
  // (so does the animal that loops, mode 1: nose-on or edge-on it is a shallow V with curling tips, never a flat bar)
  float up = clamp(iRnd.w - 2.0, 0.0, 1.0) + 0.55 * step(0.5, iRnd.w) * step(iRnd.w, 1.5);
  float wv = sn * (1.0 - 0.5 * up) + 0.1 + 0.75 * up, cw = cn * (1.0 - 0.5 * up);
  float lift = A * pa * wv;
  float Lx = sx * A * 0.5 * (2.2 * pow(max(a, 1e-4), 1.2) * wv - 1.6 * pa * cw);
  float Lz = A * pa * cw;
  q.y += lift - 0.05 * sin(base) * (1.0 - a);
  q.x -= sx * 0.2 * lift * lift * a;
  n = normalize(vec3(n.x - Lx * n.y, n.y, n.z - Lz * n.y) + vec3(0.0, 1e-5, 0.0));
  if (aPart > 4.5) {            // tail: a whip that hangs in its own curve (one per animal) and sways slowly, never a straight spike
    float k = max(-1.02 - position.z, 0.0), ts = iRnd.x * 43.0;
    q.x += k * k * (0.30 * sin(base * 0.5 - k * 1.3) + 0.7 * sin(uTime * 0.37 + ts) + 0.3 * sin(ts * 3.1));
    q.y += k * k * (0.12 * sin(base - k * 0.9) + 0.5 * sin(uTime * 0.29 + ts * 1.7) - 0.2);
  } else if (aPart > 2.5 && aPart < 3.5) {   // scoops flex open and shut a little
    q.x += sx * 0.05 * aUV.y * sin(uTime * 0.7 + iRnd.x * 30.0);
  }
  q *= iRnd.y;
  Frame F = orbitFrame(iSlot, iRnd, iBeat.zw);
  vec3 P = F.p + F.r * q.x + F.u * q.y + F.f * q.z;
  vec3 N = F.r * n.x + F.u * n.y + F.f * n.z;
  if (aPart > 4.5 && aUV.x < 0.75) P += N * max(length(uCam - P) * 0.0007 - 0.008, 0.0);   // keep the whip a pixel wide
  vN = N; vP = P;
  vInfo = vec4(aUV.x, aUV.y, aPart, iRnd.x);
  vMorph = vec3(iRnd.z, lift, cn * pa);
  vLoop = step(0.5, iRnd.w) * step(iRnd.w, 1.5);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// The sun shaft as light in the water: shaftGlow(c, p, warm) is the sunlight scattered toward the lens between the lens c
// and a point p (both in the hero's local space). The lit water is a leaning cylinder about uShaftA..uShaftB with a
// faint skin (radius uShaftR) and a brighter core (three nested radii, 0.4 to 0.76 uShaftR), each of even density, so
// the column has a shoulder that reads; the ray is cut analytically, so a thing in front of the column takes none of it, one inside it takes only
// the water between it and the lens, and what lies behind is seen through the whole chord. Sand, ceiling and reef add
// all of it after their fog (warm = 1: the gold core with its rays); the animals add an eighth of the pale skin only
// (warm = 0: a gold veil turns black backs brown, a full one khaki), so the far wall stays
// crisp against the lit water; the 'shaft' mesh adds it where nothing opaque was drawn. Needs uShaft, uShaftA, uShaftB, uShaftR,
// uShaftCol and (after fog_pars_fragment) the scene fog.
const SHAFT_FN_GLSL = /* glsl */`
#ifdef FOG_EXP2
  #define SHAFT_DENS fogDensity
#else
  #define SHAFT_DENS 0.02
#endif
// thickness of a cylinder of radius^2 R2 along the part [0, tmax] of a ray, measured ACROSS the column (the chord
// times the sine of the angle to the axis), so that looking up along the shaft does not pile it into a hard-edged slab
float shaftSlab(float A, float B, float C, float R2, float tmax) {
  float s = sqrt(max(B * B - A * (C - R2), 0.0));
  return max(min((-B + s) / A, tmax) - max((-B - s) / A, 0.0), 0.0) * sqrt(A);
}
uniform vec3 uShaftWarm;      // the gold of the core (uShaftCol is the pale skin of sunlit water round it)
uniform float uShaftT;        // seconds: the rays inside the column drift
vec3 shaftGlow(vec3 c, vec3 p, float warm) {
  vec3 d = p - c; float tmax = length(d); d /= max(tmax, 1e-4);
  vec3 ax = normalize(uShaftA - uShaftB + vec3(0.0, 1e-4, 0.0));
  vec3 oc = c - uShaftB;
  vec3 dp = d - ax * dot(d, ax), op = oc - ax * dot(oc, ax);
  float A = max(dot(dp, dp), 1e-4), B = dot(dp, op), C = dot(op, op), R2 = uShaftR * uShaftR;
  // a core of three nested radii (a shoulder, not a seam) inside a faint skin of two
  float core = shaftSlab(A, B, C, 0.16 * R2, tmax) + shaftSlab(A, B, C, 0.34 * R2, tmax) + shaftSlab(A, B, C, 0.58 * R2, tmax);
  float skin = shaftSlab(A, B, C, 0.9 * R2, tmax) + shaftSlab(A, B, C, 1.25 * R2, tmax);
  // the skin fades with the ray's nearest approach to the axis and is gone before its own rim: no silhouette, even
  // against black water at night
  skin *= 1.0 - smoothstep(0.45 * uShaftR, 1.08 * uShaftR, sqrt(max(C - B * B / A, 0.0)));
  float sO = sqrt(max(B * B - A * (C - R2), 0.0));
  float tm = 0.5 * (max((-B - sO) / A, 0.0) + min((-B + sO) / A, tmax));
  vec3 pm = c + d * tm;
  float h = clamp(pm.y / 28.0, 0.0, 1.0);
  vec3 w = pm - uShaftB; w -= ax * dot(w, ax);
  // rays: bright and dark threads that run the length of the column (w is the place ACROSS it) and drift slowly
  float rays = 0.62 + 0.38 * sin(w.x * 2.3 + 1.7 * sin(w.z * 1.1 + 2.0 + uShaftT * 0.11)) * sin(w.z * 2.1 - 1.3 * sin(w.x * 0.9) - uShaftT * 0.09);
  rays += 0.24 * sin(w.x * 6.1 - w.z * 4.3 + uShaftT * 0.23) * sin(w.z * 5.2 + w.x * 1.7 + uShaftT * 0.17);
  rays = max(rays, 0.04); rays *= rays * 0.85;
  float fd = SHAFT_DENS * tm;
  // a lens that stands inside the column sees less of it (on the final rise the ring must hang on dark water, not on a veil)
  float lens = mix(0.2, 1.0, smoothstep(0.3 * uShaftR, 1.8 * uShaftR, sqrt(max(C, 0.0))));
  // the spine: the innermost third of the column is brighter than its shoulders
  float spine = shaftSlab(A, B, C, 0.05 * R2, tmax);
  vec3 lit = uShaftCol * (1.0 - exp(-(0.03 * core + 0.014 * skin))) * (0.7 + 0.3 * rays)
           + uShaftWarm * (warm * ((1.0 - exp(-0.06 * core)) * rays + 0.55 * (1.0 - exp(-0.3 * spine)) * (0.5 + 0.5 * rays)));
  return lit * (uShaft * lens * smoothstep(0.0, 0.2, h) * (0.45 + 0.55 * h) * exp(-fd * fd));
}
`;

// The eight narrow sun beams that sweep the eye: uBeam[i] = (foot x, foot z on the sand, radius, strength), all leaning
// the same way (uBeamLean = metres of x and z per metre of height). beamAt(p) is their light at a point of the hero's
// local space (y above the sand): a gold flash on whatever a beam crosses, coins on the sand.
const BEAM_GLSL = /* glsl */`
uniform vec4 uBeam[8];
uniform vec2 uBeamLean;
float beamAt(vec3 p) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) {
    vec2 d = p.xz - uBeam[i].xy - uBeamLean * p.y;
    float r = max(uBeam[i].z, 0.05);
    s += uBeam[i].w * exp(-dot(d, d) / (r * r));
  }
  return s;
}
`;

const LIGHT_PARS_GLSL = /* glsl */`
uniform vec3 uWater;
uniform vec3 uGold;
uniform vec3 uAmbUp;
uniform vec3 uAmbDown;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uKeyCol;
uniform float uSun;
uniform float uShaft;
uniform float uCaustic;
uniform vec3 uShaftA;
uniform vec3 uShaftB;
uniform float uShaftR;
uniform vec3 uFogUp;
uniform vec3 uFogDn;
// the water a thing fades into is paler looking up and darker looking down (both 1,1,1 = plain scene fog)
vec3 fogTint(float h) { return mix(vec3(1.0), uFogUp, smoothstep(0.0, 0.5, h)) * mix(vec3(1.0), uFogDn, smoothstep(0.0, 0.5, -h)); }
uniform vec3 uFogFar;
uniform float uFogFarK;
// the water a thing fades into: the scene fog colour near the lens, cooler and bluer with distance (uFogFarK 0 = plain fog)
vec3 waterFog(vec3 fogCol, float h, float f) { return mix(fogCol, uFogFar, uFogFarK * smoothstep(0.3, 1.0, f)) * fogTint(h); }
float shaftAxisDist(vec3 p) {
  vec3 ab = uShaftB - uShaftA;
  float t = clamp(dot(p - uShaftA, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  return length(p - (uShaftA + ab * t));
}
float inShaft(vec3 p) {
  float d = shaftAxisDist(p);
  // full inside the column; outside it the light it scatters sideways and the gold pool it throws on the sand still
  // reach the inner lane (about half strength 7 m out) and die away before the outer lanes
  float inside = 1.0 - smoothstep(uShaftR * 0.7, uShaftR * 1.05, d);
  return max(inside, 0.8 * (1.0 - smoothstep(uShaftR, uShaftR + 15.0, d))) * uShaft;
}
// 1 inside the gold core of the column, 0 at its skin
float inCore(vec3 p) { return (1.0 - smoothstep(uShaftR * 0.45, uShaftR * 1.1, shaftAxisDist(p))) * uShaft; }
uniform vec3 uShaftCol;
${SHAFT_FN_GLSL}
${BEAM_GLSL}
`;

const MANTA_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uCam;
uniform vec3 uBack;
uniform vec3 uBelly;
uniform vec3 uPale;
uniform vec3 uBioCol;
uniform float uBio;
varying vec3 vRest;
varying vec3 vN;
varying vec3 vP;
varying vec4 vInfo;
varying vec3 vMorph;
varying float vLoop;
#include <fog_pars_fragment>
${LIGHT_PARS_GLSL}
${NOISE_GLSL}
void main() {
  if (vP.y > 28.02) discard;      // above the sea surface (the breach): the world's ceiling writes no depth
  float side = vInfo.x, aux = vInfo.y, part = vInfo.z, seed = vInfo.w;
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(uCam - vP + vec3(0.0, 1e-5, 0.0));
  float x = vRest.x, z = vRest.z, ax = abs(x), a = clamp(ax * 0.5, 0.0, 1.0);
  float fwz = fwidth(z);
  vec2 sp = vec2(x, z) + seed * vec2(37.1, 91.7);
  float n1 = vn(sp * 2.4), n2 = vn(sp * 6.3 + 11.0), n3 = vn(sp * 17.0 + 3.0);
  float s7 = fract(seed * 7.3), s13 = fract(seed * 13.7);

  // ---- back: black with the pale Y on each shoulder and a pale smudge at the wingtip
  float curve = 0.40 - 0.26 * ax - 0.12 * ax * ax + (n1 - 0.5) * 0.12;
  // (feathered: each mark is densest along its spine and breaks into mottle toward its edge, four times as far out
  // as its core is wide; a hard-edged patch reads as cut paper)
  float bd = abs(z - curve) + (n2 - 0.5) * 0.11 + (n3 - 0.5) * 0.05;
  float band = 1.0 - smoothstep(0.0, 0.27 + 0.1 * s13, bd);
  band *= band * smoothstep(0.05, 0.3, ax) * (1.0 - smoothstep(0.5 + 0.3 * s7, 1.0 + 0.3 * s7, ax));
  float ad = abs(ax - 0.36 - (z - 0.3) * 0.55 + (n2 - 0.5) * 0.08) + (n3 - 0.5) * 0.04;
  float arm = 1.0 - smoothstep(0.0, 0.27, ad);
  arm *= arm * smoothstep(0.2, 0.4, z) * (1.0 - smoothstep(0.46, 0.7, z));
  // no two animals carry the same mark: each shoulder has its own strength, about half the shoulders have no arm (so many
  // marks are one-armed or a bare bar), the bar runs 0.5-1.3 of its length, and a quarter of the animals show only a smudge
  float sideK = fract(seed * (x < 0.0 ? 23.1 : 29.7) + 0.13), s5 = fract(seed * 5.9 + 0.31);
  band *= (0.4 + 0.6 * step(0.3, fract(sideK * 3.7))) * (1.0 - smoothstep(0.5 + 0.8 * s13, 0.75 + 0.9 * s13, ax / (0.55 + 0.3 * s7)));
  arm *= step(0.5, sideK);
  float smudge = (1.0 - smoothstep(0.05, 0.5, length(vec2(ax - 0.42 - 0.2 * s7, (z - 0.28) * 1.7)) + (n1 - 0.5) * 0.35)) * 0.55;
  float mark = clamp(max(band, arm * 0.85), 0.0, 1.0) * (0.4 + 0.6 * s13) * (0.6 + 0.6 * n2) * (0.85 + 0.3 * n3);
  mark = mix(mark, smudge * (0.5 + 0.5 * sideK), step(s5, 0.27));
  mark = max(mark, smoothstep(0.84, 1.0, a) * 0.35 * n1);
  // from 6 m out the feathered mottle is lost and a back would be a plain dark shape: with distance every animal's
  // marks are drawn as what they read as from above, a clean pale-grey flash across each shoulder (every animal has
  // both, parted by the black of the spine), the outer quarter of each wing pale and a thin pale trailing edge; the
  // all-black morph keeps a ghost of them. The back's blue sheen and its gloss fall away with them: far off it is black
  float camD = length(uCam - vP);
  // (the same holds, from 3 m, for a back looked DOWN on from 30 degrees or steeper: down the funnel every back below
  // the lens is a black diamond with its two flashes and pale tips, whatever its distance)
  float farK = max(smoothstep(5.0, 13.0, camD), smoothstep(0.42, 0.72, V.y) * smoothstep(2.5, 5.0, camD));
  // (each flash is a wedge: broadest and palest beside the spine, narrowing and fading out along the wing, its edge
  // soft; the wing's last tenth is pale and so is a hair of the trailing edge. Grey, a quarter as bright as a belly)
  float flw = mix(0.2, 0.05, smoothstep(0.25, 1.0, ax));
  float fl = (1.0 - smoothstep(flw * 0.6, flw + 0.05, abs(z - curve - 0.03) + (n2 - 0.5) * 0.04)) * smoothstep(0.2, 0.32, ax) * (1.0 - smoothstep(0.6 + 0.25 * s7, 1.05 + 0.25 * s7, ax));
  fl *= 1.0 - 0.35 * smoothstep(0.3, 0.95, ax);
  float rimP = max(0.85 * smoothstep(0.74, 0.93, a + (n1 - 0.5) * 0.05), 0.45 * smoothstep(0.92, 1.0, aux) * smoothstep(0.3, 0.6, a));
  float markFar = max(fl * (0.9 + 0.1 * sideK), rimP * (0.7 + 0.3 * n1));
  // (the animal that loops shows its back from every side in turn, tail-on and nose-on too: it carries the clean
  // flashes, pale wing ends and pale trailing edge at any distance, in the near tone)
  mark = mix(mark, max(mark * 0.6, markFar), max(farK, step(0.5, vLoop))) * (1.0 - 0.62 * vMorph.x);
  vec3 backCol = mix(uBack * (0.7 + 0.6 * n2), mix(uPale * (0.58 + 0.24 * n3), vec3(0.275, 0.285, 0.295) * (0.9 + 0.2 * n3), farK), mark);      // greyer than the bellies

  // ---- belly: white, grey wing margins, black blotches unique to the animal, five gill slits a side
  float margin = smoothstep(0.62, 1.05, a * 0.55 + aux * 0.62 + (n1 - 0.5) * 0.10);
  vec2 wp = sp + (vec2(n1, n2) - 0.5) * 0.22;
  float blot = spots(wp * 4.4, 0.0) * (1.0 - smoothstep(0.1, 0.42, z)) * smoothstep(-1.0, -0.72, z) * (1.0 - smoothstep(0.65, 1.25, ax));
  blot = max(blot, spots(wp * 2.6 + 9.0, 4.0) * smoothstep(0.5, 0.9, ax) * (1.0 - smoothstep(1.25, 1.7, ax)) * step(0.45, fract(seed * 3.1)));
  float gz = (0.52 - z - 0.25 * (ax - 0.4)) / 0.105;
  float gi = floor(gz);
  float gd = abs(fract(gz) - 0.5) * 0.105;
  float gw = 0.011 + 0.006 * sin(uTime * 1.5 + seed * 40.0);
  float slit = (1.0 - smoothstep(gw * 0.3, gw + fwz + 0.022, gd)) * step(-0.5, gi) * step(gi, 4.5)
             * (1.0 - smoothstep(0.065 - 0.012 * gi, 0.14 - 0.012 * gi, abs(ax - 0.40 + 0.022 * gi) + (n2 - 0.5) * 0.03));
  vec3 bellyCol = uBelly * (1.0 - 0.7 * margin) * (0.9 + 0.1 * n3) * (1.0 - 0.16 * smoothstep(0.45, 0.8, n1 * 0.6 + n2 * 0.5));
  float whiteHeart = 1.0 - smoothstep(0.2, 0.5, length(vec2(x * 0.8, z + 0.3)) + (n1 - 0.5) * 0.3);
  float mel = vMorph.x * (1.0 - 0.8 * whiteHeart);
  bellyCol = mix(bellyCol, uBack * 1.3, clamp(max(blot, mel), 0.0, 1.0));
  bellyCol = mix(bellyCol, bellyCol * 0.35 + uBack * 0.5, slit * 0.8);       // soft grey creases, not black dashes

  float back = smoothstep(0.42, 0.58, side);
  vec3 albedo = mix(bellyCol, backCol, back);
  float gloss = 0.12 + 0.1 * back;
  float occl = 1.0;
  // painted eye for the far animals (the hero animals carry a modelled one)
  albedo = mix(albedo, uBack * 0.5, (1.0 - smoothstep(0.035, 0.06, length(vec2(ax - 0.535, z - 0.775)))) * step(part, 0.5));
  if (part > 1.5 && part < 2.5) {          // mouth lining: pale lip, rust-barred gill plates, dark throat
    float bars = smoothstep(0.2, 0.5, abs(fract(aux * 5.0 + 0.25) - 0.5) * 2.0);
    float fine = smoothstep(0.25, 0.75, 0.5 + 0.5 * sin(x * 42.0));
    // (rust plates ruled with pale lines, dark gaps between them; they keep a fifth of the light at the back of the
    // mouth, so the stripes show from any front quarter, not only down the throat)
    vec3 plate = mix(vec3(0.42, 0.12, 0.035), uPale * 1.25, fine * 0.55);
    albedo = mix(uPale * 1.0, plate, bars * smoothstep(0.05, 0.14, aux));
    albedo = mix(albedo, uBack, (1.0 - bars) * smoothstep(0.1, 0.3, aux) * 0.85);
    occl = mix(1.0, 0.2, smoothstep(0.1, 1.0, aux));
    gloss = 0.05;
  } else if (part > 2.5 && part < 3.5) {   // scoops: white inside, black outside, dark tip
    if (part > 3.1) {
      // the full model's scoop is a rolled lobe, a C in section: side runs 0 on the outer face, 0.5 on the lips,
      // 1 in the depth of the roll. Black outside, pale lips, and the hollow falls into its own shade
      albedo = mix(uBack * (0.7 + 0.6 * n2), uBelly * 0.92, smoothstep(0.28, 0.5, side));
      occl = mix(1.0, 0.2, smoothstep(0.58, 1.0, side) * (0.55 + 0.45 * aux));
    } else {
      float lowFace = 1.0 - smoothstep(-0.03, 0.05, vRest.y + 0.015 + 0.07 * aux);
      albedo = mix(uBack * (0.7 + 0.6 * n2), uBelly * 0.92, max(smoothstep(0.25, 0.6, side), lowFace));
    }
    albedo = mix(albedo, uBack, smoothstep(0.9, 1.0, aux) * 0.5);
    albedo *= mix(0.5, 1.0, smoothstep(0.0, 0.7, aux));        // it rolls out of the shadow of the head
  } else if (part > 3.5 && part < 4.5) {   // eye
    albedo = uBack * 0.35; gloss = 0.9;
  } else if (part > 4.5) {
    albedo = uBack * 0.8; gloss = 0.1;
  }

  // ---- light: gold key from above through the surface, green water from every side, deep green below
  float hemi = N.y * 0.5 + 0.5;
  float ndv = abs(dot(N, V));
  float sh = inShaft(vP);
  float cauRaw = caustic(vP.xz + vP.y * 0.3, uTime);
  float cau = mix(1.0, cauRaw, uCaustic);
  // form: surfaces that face the sand take the darker, greener light from below; the belly is brightest at its
  // centre, greys under the wing roots (soft occlusion along the body-wing junction) and toward the margins, and
  // light bounced off the rippled sand crawls across it
  float under = (1.0 - back) * step(part, 0.5);
  vec3 amb = mix(uAmbDown, uAmbUp, smoothstep(0.0, 1.0, hemi));
  float rootAO = exp(-(ax - 0.5) * (ax - 0.5) / 0.022) * (1.0 - smoothstep(0.2, 0.75, z)) * smoothstep(-1.0, -0.5, z);
  float heart = 1.0 - smoothstep(0.0, 1.15, length(vec2(ax * 0.75, z + 0.05)));
  float form = mix(0.76, 1.45, heart) * (1.0 - 0.32 * rootAO) * (0.84 + 0.16 * ndv) * (0.86 + 0.28 * mix(1.0, cauRaw, 0.4));
  amb *= mix(vec3(1.0), form * mix(vec3(0.82, 0.94, 0.9), vec3(1.0), heart), under);
  float ndl = max(dot(N, uSunDir) * 0.85 + 0.15, 0.0);
  vec3 sun = ndl * uKeyCol * uSun * cau;
  // the shaft: bellies, scoops and lips near the column flare bone-gold whichever way they face (light scattered out
  // of it and thrown back up off the sand); backs take a sixth of that and stay black. Once the sun is out every back
  // carries thin gold caustic lines instead, brightest beside the column
  float lit = mix(1.0, 0.16, back);
  float shc = inCore(vP);
  vec3 flare = mix(uSunCol * 0.55 + vec3(0.14), uShaftWarm * 2.6 + vec3(0.04), shc) * (sh * lit * (0.7 + 0.3 * min(cauRaw, 1.6)) * (0.8 + 0.2 * ndv));
  // a narrow beam crossing the animal: a gold flash, on bellies and (a fifth as strong, as a sheen) on backs
  float beam = beamAt(vP) * step(part, 3.5);
  amb = amb * (1.0 - 0.3 * sh * (1.0 - back)) + flare + uSunCol * beam * (0.55 * (1.0 - back) + 0.12);
  vec3 col = albedo * (amb + sun) * occl;
  // (a finer, faster net than the one on the sand, kept to its brightest filaments: at the sand's scale one cell
  // covers a whole back and washes it khaki)
  float net = caustic((vP.xz + vP.y * 0.3) * 4.2, uTime * 1.4);
  // (the lines lie on skin that faces the sky and are seen from above it: a back looked at from below carries none)
  float above = smoothstep(-0.05, 0.25, V.y) * smoothstep(0.0, 0.3, N.y);
  col += uSunCol * ((0.35 * uShaft + 0.65 * sh + 1.5 * beam) * back * smoothstep(1.8, 2.2, net) * 0.045 * step(part, 0.5) * (1.0 - smoothstep(12.0, 26.0, camD)) * above);
  col += uSunCol * beam * back * 0.035 * (0.4 + hemi);
  // backs stay black, but never a flat cut-out: the wet skin carries the blue of the water above it (most along the
  // leading edge and where it turns away from the lens: still darker than the water behind it), and within 15 m thin
  // lines of caustic light crawl over it in every mood
  float skin = step(part, 0.5), body = step(part, 4.5);
  float le = (1.0 - smoothstep(0.0, 0.25, aux)) * skin;
  float lobe = max(dot(N, normalize(uSunDir + vec3(0.0, 0.7, 0.0))), 0.0);
  float fr3 = pow(max(1.0 - ndv, 0.0), 2.5);
  col += uWater * (back * body * (0.012 - 0.006 * farK + (0.06 * lobe * lobe + 0.15 * fr3) * (1.0 - 0.85 * farK) + 0.09 * le * (0.4 + 0.6 * hemi) * (1.0 - 0.75 * farK)) * occl * (0.7 + 0.6 * n2));
  col += uKeyCol * (uSun * back * skin * smoothstep(1.75, 2.15, net) * 0.045 * max(N.y, 0.0) * (1.0 - smoothstep(7.0, 15.0, camD)) * above);
  col *= mix(1.0, 0.55 + 0.45 * ndv, step(2.5, part) * step(part, 3.5));     // scoops: rolled paddles, darker where they turn away
  float fr = pow(max(1.0 - ndv, 0.0), 4.0);
  // (the outer wing and its curling tip catch a pale rim where they turn edge-on: an animal seen along its own plane is a
  // thin winged line with lit tips, not a dark lump)
  col += (uAmbUp * 0.5 + uKeyCol * uSun * 0.25) * (pow(max(1.0 - ndv, 0.0), 2.5) * smoothstep(0.5, 0.95, a) * skin * occl * 0.5);
  col += uWater * fr * (0.12 + 0.26 * hemi) * occl * (1.0 - (0.45 + 0.47 * farK) * back);                       // water-coloured rim: never a flat cut-out
  vec3 H = normalize(uSunDir + V + vec3(0.0, 1e-5, 0.0));
  float spec = pow(max(dot(N, H), 0.0), 28.0) * gloss * (1.0 - 0.8 * farK * back);
  col += spec * (uKeyCol * uSun * 0.6 + uSunCol * sh * 0.45 * (1.0 - back)) + uAmbUp * gloss * 0.2 * fr;
  // night: blue-green sparks shed along the beating wing margins
  float edge = max(smoothstep(0.35, 1.0, a) * smoothstep(0.3, 1.0, aux), smoothstep(0.86, 1.0, aux) * 0.6) * step(part, 0.5);
  float spark = smoothstep(0.72, 0.9, vn(sp * 9.0 + vec2(0.0, uTime * 1.3))) * (0.3 + abs(vMorph.z) * 2.5);
  // (a spark cell never fills a block of the screen: within 7 m of the lens it fades to a fine glimmer)
  col += uBioCol * uBio * (edge * min(spark * 8.0, 2.0) * smoothstep(2.5, 7.0, camD) + edge * 0.1 + fr * 0.12);
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    // the whip tail thins away into the water toward its tip
    float tailK = step(4.5, part) * step(side, 0.75);
    fogF = max(fogF, smoothstep(0.35, 1.0, aux) * 0.6 * tailK);
    vec3 fogDir = normalize(vP - uCam + vec3(0.0, 1e-5, 0.0));
    // (the whip fades into the level-gaze water colour, darkened: seen from below it must never turn paler than the water behind it)
    vec3 fogTo = mix(waterFog(fogColor, fogDir.y, fogF), waterFog(fogColor, 0.0, fogF) * 0.45, tailK);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogTo, fogF);
  #endif
  gl_FragColor.rgb += shaftGlow(uCam, vP, 0.0) * 0.12;      // a thin veil only: an animal behind the column stays a clean three-tone shape
}
`;

// fog for additive and alpha-blended layers: they fade out with distance instead of mixing toward the fog colour
const FOG_FADE_GLSL = /* glsl */`
float fogFade() {
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 1.0;
#endif
}
`;

// ---- fusiliers. SCHOOLS LIVE IN THE WORLD: each of the ten circles the funnel on the world clock at its own seeded
// height, distance inside the eye wall and speed (3-4.6 m/s, with the turn), rising and sinking once a turn, and has a
// shape of its own (teardrop, curved arc or ball). iFish = (school + place along it: 0 head .. 1 tail, cross offset,
// cross offset, seed); a value of 100 or more marks the whale shark's own fish, which never leave its head.
// HELIX_GLSL is the fish's own line (a school's haze band used it too; the band is not drawn any more)
const SCHOOLS = 10;
const HELIX_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uCam;
uniform vec4 uClear;
uniform vec4 uCapA;
uniform vec3 uCapB;
uniform vec4 uThru;
uniform vec4 uBow;        // the whale shark's snout (xyz) and its own scale (0..1): its school is as large as it is
uniform vec3 uBowF;       // its heading
uniform vec4 uSch[${SCHOOLS}];     // per school: metres inside the eye wall, height, phase, turn rate (radians a second)
uniform vec4 uSchB[${SCHOOLS}];    // rise and fall (m), its phase, length (m), spare
uniform vec2 uRibbon;     // thickness, phase of the weave
vec3 helix(float sx, vec2 off, float lead) {
  int i = int(clamp(floor(sx), 0.0, ${SCHOOLS - 1}.0));
  vec4 A = uSch[i], B = uSchB[i];
  float t = clamp(sx - float(i), 0.0, 1.0);
  float r0 = 9.0 + 4.0 * clamp((A.y - 2.0) / 24.0, 0.0, 1.0) - 0.35 - A.x;
  float ang = A.z + A.w * uTime - t * B.z / max(r0, 2.0) + lead;
  float y = clamp(A.y + B.x * sin(ang + B.y), 2.6, 25.4);
  // (a school never swims through the ring's sphere and is not squeezed against it either: within 15 m of the ring,
  // measured level, the whole school dips under a bell that clears the sphere by 2 m and more, in its own shape,
  // and comes up again behind)
  vec2 lq = vec2(cos(ang), -sin(ang)) * r0 - uClear.xz;
  float hq = length(lq) / 15.0;
  float dip = max(y - (uClear.y - (uClear.w + 2.0) * (1.0 - hq * hq)), 0.0) * (1.0 - smoothstep(0.53, 1.0, hq));
  // (each fish's offset already holds the shape of its school, see SCHOOLS in buildHero; a school spreads into the
  // eye more than toward the wall, and the whole line weaves a little)
  float r = 9.0 + 4.0 * clamp((y - 2.0) / 24.0, 0.0, 1.0) - 0.35 - A.x + off.x * uRibbon.x * (off.x > 0.0 ? 0.55 : 1.25)
          + 0.3 * sin(t * 9.0 - uTime * 1.4 + uRibbon.y + A.z);
  y += off.y * uRibbon.x * 1.3 + 0.4 * sin(t * 6.0 + uTime * 1.1 + A.z * 3.0) + 0.2 * sin(t * 14.0 - uTime * 0.8) - dip;
  return vec3(cos(ang) * r, y, -sin(ang) * r);
}
vec3 keepOut(vec3 c) {
  vec3 d = c - uClear.xyz; float l = length(d); float k = max(uClear.w - l, 0.0);
  c += (d / max(l, 1e-3)) * (0.8 * k * k / max(uClear.w, 1e-3));
  vec3 ab = uCapB - uCapA.xyz;
  vec3 cc = uCapA.xyz + ab * clamp(dot(c - uCapA.xyz, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  d = c - cc; l = length(d); k = max(uCapA.w * 0.55 - l, 0.0);      // the ribbon pours round the whale shark
  c += (d / max(l, 1e-3)) * k;
  d = c - uCam; l = length(d); k = max(2.2 - l, 0.0);               // the school opens round the lens
  c += (d / max(l, 1e-3)) * (0.8 * k * k / 2.2);
  c.y -= 400.0 * uThru.w * step(c.z - uThru.z, -1.5);
  return c;
}
`;
const FISH_VERT = /* glsl */`
attribute vec4 iFish;
varying vec3 vN;
varying vec3 vP;
varying vec4 vFish;       // body z, seed, fade, flash
#include <fog_pars_vertex>
${HELIX_GLSL}
void main() {
  float rider = step(50.0, iFish.x), p = rider > 0.5 ? 0.0 : iFish.x;
  vec2 off = iFish.yz + 0.25 * vec2(sin(uTime * 0.9 + iFish.w * 50.0), cos(uTime * 0.7 + iFish.w * 31.0));
  vec3 c = helix(p, off, 0.0);
  vec3 c2 = helix(p, off, 0.03);
  vec3 f = normalize(c2 - c + vec3(1e-5, 0.0, 0.0));
  c = keepOut(c);
  // the whale shark's own school (setBow: its snout, its heading, its scale) lives in the shark's frame: a dense ball
  // of fish 2 m ahead of the snout that rolls slowly, and two streams that split from the ball and run back along
  // either cheek as far as the gills; the ball opens round the lens like a school does
  vec3 bf = normalize(uBowF + vec3(0.0, 0.0, 1e-5)), br = normalize(cross(vec3(0.0, 1.0, 0.0), bf) + vec3(1e-5, 0.0, 0.0)), bu = cross(bf, br);
  float rl = fract(iFish.w * 211.0), rb = fract(iFish.w * 577.0), rc = fract(iFish.w * 331.0);
  float ra = iFish.w * 937.0 + uTime * (0.25 + 0.3 * rc) + 0.5 * sin(uTime * 0.7 + iFish.w * 300.0);
  float bt = clamp(rl / 0.62, 0.0, 1.0), cp = 2.0 * rb - 1.0, sp2 = sqrt(max(1.0 - cp * cp, 0.0)), brad = 1.75 * sqrt(bt);
  vec3 ball = bf * (2.1 + 1.25 * brad * cp + 0.25 * sin(uTime * 1.3 + iFish.w * 170.0)) + (br * cos(ra) + bu * sin(ra)) * (brad * sp2) + bu * 0.15;
  float st = clamp((rl - 0.62) / 0.38, 0.0, 1.0);
  vec3 cheek = bf * (0.7 - 3.9 * st + 0.3 * sin(uTime * 1.3 + iFish.w * 170.0)) + br * ((rb < 0.5 ? -1.0 : 1.0) * (1.25 + 0.55 * rc + 0.25 * st))
             + bu * ((fract(iFish.w * 733.0) - 0.5) * 1.5 + 0.1 + 0.15 * sin(uTime * 0.9 + iFish.w * 90.0));
  vec3 bo = mix(ball, cheek, step(0.62, rl));
  // (nothing swims through the head: behind the snout's tip the fish stand off its axis)
  float along = dot(bo, bf); vec3 bro = bo - bf * along; float brl = length(bro);
  bo += (bro / max(brl, 1e-3)) * (max(1.2 - brl, 0.0) * (1.0 - smoothstep(0.1, 0.7, along)));
  vec3 bow = uBow.xyz + bo;
  vec3 dl = bow - uCam; float ll = length(dl);
  bow += (dl / max(ll, 1e-3)) * max(2.4 - ll, 0.0);
  c = mix(c, bow, rider);
  f = normalize(mix(f, bf, rider) + vec3(1e-5, 0.0, 0.0));
  vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f) + vec3(0.0, 0.0, 1e-5));
  vec3 u = cross(f, r);
  float fade = mix(1.0, uBow.w, rider);
  float dist = length(uCam - c);
  // none longer than 28 cm near the lens (they are only drawn larger beyond 14 m, to stay visible); a rider shrinks
  // away inside 2.6 m of the lens
  float sc = (0.8 + 0.3 * fract(iFish.w * 9.1)) * max(1.0, dist * 0.07) * fade * mix(1.0, smoothstep(1.2, 2.6, dist), rider);
  vec3 q = position;
  q.x += 0.03 * sin(uTime * 11.0 + iFish.w * 80.0 + q.z * 14.0) * (0.125 - q.z) * 4.0;   // tail beat
  q *= sc;
  vec3 P = c + r * q.x + u * q.y + f * q.z;
  vN = r * normal.x + u * normal.y + f * normal.z;
  vP = P;
  float fl = 0.5 + 0.5 * sin(uTime * 4.5 + iFish.w * 60.0 + p * 37.0);
  float flash = fl * fl; flash *= flash; flash *= flash;
  vFish = vec4(position.z, iFish.w, fade, flash);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FISH_FRAG = /* glsl */`
uniform vec3 uCam;
uniform vec3 uCobalt;
uniform vec3 uSilver;
uniform vec3 uBioCol;
uniform float uBio;
varying vec3 vN;
varying vec3 vP;
varying vec4 vFish;
#include <fog_pars_fragment>
${LIGHT_PARS_GLSL}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  float top = smoothstep(-0.15, 0.4, N.y);
  float sh = inShaft(vP);
  float beam = beamAt(vP);
  vec3 amb = mix(uAmbDown, uAmbUp, N.y * 0.5 + 0.5) + uGold * (sh * 0.3 + beam * 0.6);
  vec3 flank = uSilver * (0.4 + 1.5 * vFish.w * (1.0 + 1.5 * sh + 1.5 * beam));
  vec3 alb = mix(flank, uCobalt * 2.4, top);
  alb = mix(alb, uGold * 1.5, (1.0 - smoothstep(-0.08, -0.045, vFish.x)) * (1.0 - top * 0.4));   // yellow tail stripe
  vec3 col = alb * (amb * 1.25 + (uKeyCol * uSun + uSunCol * sh * 2.0) * max(dot(N, uSunDir), 0.0));
  // night: flanks shed blue-green light, but only at a distance: close to the lens a fish keeps its own colours
  float farK = 1.0;
  #ifdef USE_FOG
    farK = smoothstep(3.0, 11.0, vFogDepth);
  #endif
  col += uBioCol * uBio * (0.2 + 1.0 * vFish.w) * (0.12 + 0.88 * farK);
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    vec3 fogDir = normalize(vP - uCam + vec3(0.0, 1e-5, 0.0));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, waterFog(fogColor, fogDir.y, fogF), fogF);
  #endif
  gl_FragColor.rgb += shaftGlow(uCam, vP, 0.0) * 0.12;      // a thin veil only: an animal behind the column stays a clean three-tone shape
}
`;

// ---- feed cones: motes streaming into each mouth (instanced points riding the same orbit function)
const MOTE_VERT = /* glsl */`
attribute vec3 aMote;     // phase, angle, radial
attribute vec4 iSlot;
attribute vec4 iRnd;
attribute vec4 iBeat;
uniform float uPx;
varying float vA;
#include <fog_pars_vertex>
${ORBIT_GLSL}
void main() {
  float ph = fract(aMote.x + iRnd.x * 7.0 + uTime * 0.33);
  float s = 1.0 - ph;                                  // 1 far ahead .. 0 at the lips
  float ang = aMote.y * 6.2831853 + iRnd.x * 20.0 + s * 1.5;
  float rad = (0.05 + 0.85 * s * s) * (0.25 + 0.75 * aMote.z);
  vec3 q = vec3(cos(ang) * rad * 1.25, sin(ang) * rad * 0.6 - 0.04 * s, 0.86 + 2.7 * s) * iRnd.y;
  Frame F = orbitFrame(iSlot, iRnd, iBeat.zw);
  vec3 P = F.p + F.r * q.x + F.u * q.y + F.f * q.z;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float dist = max(-mvPosition.z, 0.1);
  float px = 0.05 * uPx * 0.83 / dist;
  gl_PointSize = clamp(px, 1.6, 12.0);
  vA = smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.75, 1.0, s)) * min(px / 1.6, 1.0) * (1.0 - smoothstep(0.0, 0.8, 0.4 / dist));
  #include <fog_vertex>
}
`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uMote;
varying float vA;
#include <fog_pars_fragment>
${FOG_FADE_GLSL}
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = 1.0 - smoothstep(0.1, 0.5, length(d));
  gl_FragColor = vec4(uMote * a * vA * fogFade(), 1.0);
}
`;

// ---- the sun shaft where no animal, sand or ceiling was drawn: a tube round the lit column, pushed to the far plane
// so it only fills pixels that are still empty; its fragments cut the same analytic column as every opaque shader
const SHAFT_VERT = /* glsl */`
uniform vec3 uShaftA;
uniform vec3 uShaftB;
uniform float uShaftR;
varying vec3 vP;
#include <fog_pars_vertex>
void main() {
  vec3 c = mix(uShaftB, uShaftA, position.y * 1.3 - 0.15);      // 0 foot .. 1 top, overshooting both ends
  vec3 P = c + vec3(position.x, 0.0, position.z) * uShaftR * 1.3;
  vP = P;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  if (abs(gl_Position.w) < 1e-4) gl_Position.w = 1e-4;
  gl_Position.z = gl_Position.w * 0.999995;
  #include <fog_vertex>
}
`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uCam;
uniform float uShaft;
uniform vec3 uShaftA;
uniform vec3 uShaftB;
uniform float uShaftR;
uniform vec3 uShaftCol;
varying vec3 vP;
#include <fog_pars_fragment>
${SHAFT_FN_GLSL}
void main() {
  vec3 d = normalize(vP - uCam + vec3(0.0, 1e-5, 0.0));
  gl_FragColor = vec4(shaftGlow(uCam, uCam + d * 400.0, 1.0), 1.0);
}
`;

// ---- wing shadows on the sand under the lowest animals
const SHADOW_VERT = /* glsl */`
attribute vec4 iSlot;
attribute vec4 iRnd;
attribute vec4 iBeat;
uniform vec3 uSunDir;
varying vec2 vQ;
varying float vH;
#include <fog_pars_vertex>
${ORBIT_GLSL}
void main() {
  Frame F = orbitFrame(iSlot, iRnd, iBeat.zw);
  float h = max(F.p.y, 0.0);
  vec2 foot = F.p.xz - uSunDir.xz / max(uSunDir.y, 0.2) * h;
  vec2 f2 = normalize(F.f.xz + vec2(1e-5, 0.0));
  vec2 r2 = vec2(f2.y, -f2.x);
  float grow = 1.0 + h * 0.06;
  float beat = 1.0 - 0.14 * (0.5 + 0.5 * sin(iBeat.x * uTime + iBeat.y - 1.2));
  vec2 xz = foot + (r2 * position.x * beat + f2 * position.z) * iRnd.y * grow;
  vQ = position.xz; vH = h;
  if (F.p.y < -100.0) xz = foot;                 // hidden with its animal (seen through the previous portal)
  vec4 mvPosition = modelViewMatrix * vec4(xz.x, 0.05, xz.y, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uShadowCol;
uniform float uShadow;
varying vec2 vQ;
varying float vH;
#include <fog_pars_fragment>
${FOG_FADE_GLSL}
void main() {
  float d = abs(vQ.x) / 2.3 + abs(vQ.y + 0.1) / 1.25 + 0.25 * vQ.y * vQ.y;     // the diamond
  float soft = 0.18 + vH * 0.03;
  float a = (1.0 - smoothstep(1.0 - soft, 1.0 + soft, d)) * uShadow / (1.0 + vH * 0.10) * fogFade();
  gl_FragColor = vec4(uShadowCol, a);
}
`;

// ------------------------------------------------------------------------------------------------------------
const eyeRadius = (y) => 9 + 4 * Math.min(1, Math.max(0, (y - 2) / 24));
const PORTAL = new THREE.Vector3(-8, 21.5, 3.5);         // the ring: in the mouth of the funnel, 5.5 m inside the top of the wall
const SOMERSAULT = new THREE.Vector3(-5.5, 23, -6.5);    // centre of the 2.5 m back-somersault loop, beside the top of the gold column
const ENTRY = new THREE.Vector3(2, 1.5, -3.5);           // the camera arrives here, on the floor of the eye, heading +z
const CHAIN_SPACING = 5.2;
const SHAFT_R = 4.5;
const NEAR = 18;                                         // full-detail animals: the ones nearest the lens, re-chosen every frame
// the camera line of the brief (local space, y above the sand): the floor, the low orbit, the chord beside the whale
// shark, the wall pass, the well, the run at the gold column, the top circuit, the straight to the ring. The world
// resamples and smooths it before use. The low orbit runs IN the bottom tier's lane (radius 10.8 against the lane's
// 11.3, half a metre under it), so its animals come at the lens mouth first and slide round its keep-out; the turn
// onto it is short and the east side after it runs tight (radius 6). The line is what these points give.
const FLY = [[2, 1.5, -3.5], [2.1, 1.5, -0.6], [2, 1.5, 1.4], [0.5, 1.55, 3.3], [-2.2, 1.7, 4.6], [-5.2, 1.9, 5.6], [-8, 2.2, 5.7], [-9.95, 2.5, 4], [-10.9, 2.7, 0.6], [-10.4, 2.75, -3.3],
  [-7.9, 2.85, -7.4], [-4.3, 3.4, -8.2], [-0.7, 4.2, -7.3], [3.88, 5.2, -5.31], [5.26, 5.7, -3.01], [5.8, 6.05, -0.59], [5.57, 6.35, 1.75], [5.07, 6.6, 3.71], [4.42, 6.75, 4.98], [3.15, 6.9, 5.7],
  [0.2, 7.4, 5.7], [-2.7, 7.9, 5.7], [-4.8, 8.3, 5.7], [-7.1, 8.8, 5], [-8.6, 9.3, 3], [-9.1, 10, -0.6], [-8.1, 10.8, -3.95], [-5.6, 11.6, -6.4], [-2.25, 12.3, -7.35], [0.95, 13, -6.75],
  [3.3, 13.6, -4.75], [4.5, 14.1, -2.1], [4.6, 14.5, 0.5], [3.75, 14.8, 2.8], [1.65, 15.1, 4.05], [-0.8, 15.4, 3.6], [-2.4, 15.7, 1.75], [-2.4, 16.05, -0.75], [-1.5, 16.6, -3.15], [-0.6, 17.1, -5.65],
  [0.8, 17.6, -7.7], [3.05, 18.1, -8.8], [5.55, 18.6, -8.7], [7.7, 19, -7.35], [9.3, 19.3, -5.25], [10.3, 19.55, -2.8], [10.15, 19.75, 0.2], [8.35, 19.9, 2.6], [5.5, 20, 3.5], [1, 20.5, 3.5],
  [-3.5, 21, 3.5], [-8, 21.5, 3.5]];
// the rare breach: a manta leaves the top tier, drives up through the ceiling and falls back (k, x, y, z). The hole is
// over the west side of the mouth, 25 degrees left of the exit ring as the lens comes round onto it, and the animal
// falls back toward the north wall, 16 m clear of the ring
const BREACH = [[0, -9.5, 23.5, -11], [0.15, -6.6, 25, -9.4], [0.3, -3.3, 28.3, -8.0], [0.42, -2.0, 30.3, -7.6], [0.55, -2.0, 28, -7.2], [0.7, -1.5, 25.6, -8.8], [0.85, -3.2, 24.6, -10.6], [1, -6.0, 24.3, -12.5]];

function fishGeometry() {
  // a 25 cm fusilier: a spindle of three six-sided rings, taller than wide, between the nose and the tail root (smooth
  // normals: a round body, not a dart), a forked tail and a low dorsal fin as blades (both faces, neutral normals)
  const P = [0, 0, 0.125], I = [], RINGS = [[0.088, 0.02, 0.011], [0.035, 0.036, 0.018], [-0.03, 0.026, 0.012]];
  for (const [z, h, w] of RINGS) for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; P.push(Math.sin(a) * w, Math.cos(a) * h + 0.002, z); }
  P.push(0, 0, -0.085);
  for (let j = 0; j < 6; j++) {
    const k = (j + 1) % 6;
    I.push(0, 1 + k, 1 + j, 19, 13 + j, 13 + k);
    for (let r = 0; r < 2; r++) { const a = 1 + r * 6, b = a + 6; I.push(a + j, b + k, b + j, b + k, a + j, a + k); }
  }
  const first = P.length / 3;
  P.push(0, 0, -0.078, 0, 0.046, -0.132, 0, 0, -0.106, 0, -0.046, -0.132, 0, 0.034, 0.05, 0, 0.053, 0.004, 0, 0.026, -0.03);
  for (const [a, b, c] of [[0, 1, 2], [0, 2, 3], [4, 5, 6]]) I.push(first + a, first + b, first + c, first + a, first + c, first + b);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  g.computeVertexNormals();
  const N = g.attributes.normal.array;
  for (let v = first; v < first + 7; v++) { N[v * 3] = 0; N[v * 3 + 1] = 0.3; N[v * 3 + 2] = 0; }
  return g;
}

// ---- remoras: one or two per host animal, placed in the host's own frame by the same orbit function
const REMORA_VERT = /* glsl */`
attribute vec2 aRm;       // which fish of the pair, 0 nose .. 1 tail
attribute vec4 iSlot;
attribute vec4 iRnd;
attribute vec4 iBeat;
attribute vec4 iRem;      // station x, station z, seed, length (0 = none; below 0 = a chin rider only, on a full-detail animal that has none of its own)
uniform float uRemK;      // 1.3 on the full-detail animals (0.65-1 m: they must read as fish under a chin), 1 on the far ones
varying vec3 vN;
varying vec3 vP;
varying vec3 vR;
#include <fog_pars_vertex>
${ORBIT_GLSL}
void main() {
  float second = step(0.5, aRm.x);
  float sd = iRem.z + second * 0.37;
  vec3 q = position;
  q.x += 0.07 * sin(uTime * 4.0 + sd * 40.0 - aRm.y * 4.0) * aRm.y * aRm.y;       // sculling tail
  float len = abs(iRem.w) * uRemK;
  q *= len * (1.0 - 0.2 * second) * clamp(iRnd.y * 1.5 - 0.5, 0.0, 1.0);
  vec3 st = mix(vec3(iRem.x + 0.10 * sin(uTime * 0.21 + sd * 17.0), 0.0, iRem.y + 0.22 * sin(uTime * 0.13 + sd * 29.0)),
                vec3(-iRem.x * 0.6 + 0.08 * sin(uTime * 0.17 + sd * 11.0), 0.0, 0.42 + 0.12 * sin(uTime * 0.11 + sd * 5.0)), second);
  st.y = -(0.30 - 0.32 * abs(st.x)) * (1.0 - 0.5 * smoothstep(0.2, 0.9, abs(st.z - 0.1))) - 0.075 * len;
  float yaw = 0.25 * sin(uTime * 0.19 + sd * 23.0);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 l = st * iRnd.y + vec3(q.x * cy + q.z * sy, -q.y, q.z * cy - q.x * sy);
  vec3 n = vec3(normal.x * cy + normal.z * sy, -normal.y, normal.z * cy - normal.x * sy);
  Frame F = orbitFrame(iSlot, iRnd, iBeat.zw);
  // a chin rider grows in as its host comes within 10 m of the lens (its host only wears the full model about there)
  if (iRem.w < 0.0) l = mix(st * iRnd.y, l, second * (1.0 - smoothstep(6.0, 10.0, length(uCam - F.p))));
  vec3 P = F.p + F.r * l.x + F.u * l.y + F.f * l.z;
  vN = F.r * n.x + F.u * n.y + F.f * n.z;
  vP = P; vR = position;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const REMORA_FRAG = /* glsl */`
uniform vec3 uCam;
varying vec3 vN;
varying vec3 vP;
varying vec3 vR;
#include <fog_pars_fragment>
${LIGHT_PARS_GLSL}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(uCam - vP + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = -N;
  vec3 amb = mix(uAmbDown, uAmbUp, N.y * 0.5 + 0.5) + uGold * inShaft(vP) * 0.3;
  float stripe = 1.0 - smoothstep(0.013, 0.034, abs(vR.y + 0.004));                // the pale line along the flank
  vec3 alb = mix(vec3(0.1, 0.11, 0.12), vec3(0.56, 0.58, 0.5), stripe * 0.9);       // slate with a bone stripe: a fish, not one more black blotch
  alb = mix(alb, vec3(0.02), smoothstep(0.3, 0.5, vR.z) * step(0.0, vR.y) * 0.6);   // the sucker plate on the crown
  vec3 col = alb * (amb + uKeyCol * uSun * max(dot(N, uSunDir), 0.0));
  col += uWater * pow(max(1.0 - abs(dot(N, V)), 0.0), 3.0) * 0.14;
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, waterFog(fogColor, -V.y, fogF), fogF);
  #endif
  gl_FragColor.rgb += shaftGlow(uCam, vP, 0.0) * 0.12;      // a thin veil only: an animal behind the column stays a clean three-tone shape
}
`;
// a remora 1 m long (scaled per instance), nose +Z: lofted body with a flat crown, tail fan, pectoral and dorsal blades
function remoraGeometry(sections, sides, pair) {
  const P = [], RM = [], IDX = [];
  const zs = [0.5, 0.44, 0.33, 0.14, -0.08, -0.28, -0.42], rs = [0.008, 0.038, 0.056, 0.06, 0.048, 0.028, 0.012];
  for (let w = 0; w < pair; w++) {
    const first = P.length / 3;
    for (let i = 0; i < sections; i++) {
      const f = (i / (sections - 1)) * (zs.length - 1), i0 = Math.min(zs.length - 2, Math.floor(f)), t = f - i0;
      const z = zs[i0] + (zs[i0 + 1] - zs[i0]) * t, r = rs[i0] + (rs[i0 + 1] - rs[i0]) * t;
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        let y = Math.cos(a) * r * 0.9;
        if (z > 0.2) y = Math.min(y, r * 0.5);                 // the flat sucker crown
        P.push(Math.sin(a) * r * (z > 0.2 ? 1.15 : 0.8), y, z); RM.push(w, 0.5 - z);
      }
    }
    for (let i = 0; i < sections - 1; i++) for (let j = 0; j < sides; j++) {
      const a = first + i * sides + j, b = first + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      IDX.push(a, c, b, b, c, d);
    }
    const v = (x, y, z) => { P.push(x, y, z); RM.push(w, 0.5 - z); return P.length / 3 - 1; };
    const t0 = v(0, 0, -0.4), t1 = v(0, 0.07, -0.52), t2 = v(0, -0.07, -0.52), t3 = v(0, 0, -0.47);
    IDX.push(t0, t1, t3, t0, t3, t2);
    if (sides > 3) {
      for (const sx of [-1, 1]) { const a = v(sx * 0.05, -0.005, 0.26), b = v(sx * 0.15, -0.02, 0.14), c = v(sx * 0.05, -0.005, 0.16); IDX.push(a, b, c); }
      const d0 = v(0, 0.045, -0.05), d1 = v(0, 0.085, -0.2), d2 = v(0, 0.03, -0.34); IDX.push(d0, d1, d2);
      const e0 = v(0, -0.045, -0.05), e1 = v(0, -0.08, -0.2), e2 = v(0, -0.03, -0.34); IDX.push(e0, e1, e2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aRm', new THREE.Float32BufferAttribute(RM, 2));
  g.setIndex(IDX);
  g.computeVertexNormals();
  return g;
}

// ---- the narrow sun beams as light in the water: one soft ribbon per beam, turned to face the lens about the beam's own
// axis; a Gaussian across (it reaches zero before the ribbon's edge), broken along its length, faded at both ends and
// near the lens, so no straight edge shows anywhere
const BEAMS_VERT = /* glsl */`
attribute float aIdx;
uniform vec3 uCam;
uniform vec4 uThru;
varying vec4 vB;          // across -1..1, along 0 foot .. 1 ceiling, strength, index
varying float vAx;        // how nearly the view runs along the beam (1 = straight up it)
#include <fog_pars_vertex>
${BEAM_GLSL}
void main() {
  vec4 b = uBeam[int(aIdx + 0.5)];
  float t = position.y;
  vec3 c = vec3(b.x + uBeamLean.x * 28.0 * t, 28.0 * t, b.y + uBeamLean.y * 28.0 * t);
  vec3 ax = normalize(vec3(uBeamLean.x, 1.0, uBeamLean.y));
  vec3 side = normalize(cross(ax, uCam - c) + vec3(1e-5, 0.0, 0.0));
  vec3 P = c + side * (position.x * b.z * 1.8 * (0.75 + 0.5 * t));
  vB = vec4(position.x, t, b.w * (1.0 - uThru.w * step(b.y - uThru.z, -1.5)), aIdx);
  vAx = abs(dot(normalize(P - uCam + vec3(0.0, 1e-4, 0.0)), ax));
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const BEAMS_FRAG = /* glsl */`
uniform float uTime;
uniform vec3 uBeamCol;
varying vec4 vB;
varying float vAx;
#include <fog_pars_fragment>
${FOG_FADE_GLSL}
${NOISE_GLSL}
void main() {
  float x = vB.x, k = 1.0 - x * x;
  float prof = exp(-x * x * 4.5) * k * k;
  float n = 0.2 + 1.0 * vn(vec2(vB.y * 7.0 - uTime * 0.25, vB.w * 3.7)) * (0.6 + 0.8 * vn(vec2(x * 3.0 + vB.w, vB.y * 2.6 + uTime * 0.1)));
  float ends = smoothstep(0.0, 0.1, vB.y) * (1.0 - smoothstep(0.8, 1.0, vB.y)) * (0.35 + 0.65 * vB.y);
  // a beam close to the lens, or one looked up along toward the sun, would stand in the frame as a broad pale bar: both fade
  float bar = smoothstep(1.5, 8.0, vFogDepth) * (1.0 - 0.85 * smoothstep(0.62, 0.93, vAx));
  gl_FragColor = vec4(uBeamCol * (prof * n * ends * vB.z * fogFade() * bar), 1.0);
}
`;
// ---- the breach's bubbles: a crown where the animal bursts through the ceiling and a plume 3 m deep where it falls back
const BUBBLE_VERT = /* glsl */`
attribute vec4 aB;        // angle, radial, depth, seed
uniform vec4 uBreach;     // the hole (xyz) and the breach's progress k (below 0: parked)
uniform float uTime;
uniform float uPx;
varying float vA;
#include <fog_pars_vertex>
void main() {
  float k = uBreach.w, crown = step(aB.w, 0.4);
  float a1 = clamp((k - 0.27) / 0.3, 0.0, 1.0), a2 = clamp((k - 0.52) / 0.48, 0.0, 1.0);
  float ang = aB.x * 6.2831853 + 0.4 * sin(uTime * 1.7 + aB.w * 40.0);
  // the crown: a ring that opens on the ceiling; the plume: a column driven down, then rising and spreading
  float rr = mix((1.2 + 1.5 * a1) * (0.8 + 0.4 * aB.y), (0.25 + 1.3 * aB.y) * (0.5 + 0.9 * a2), 1.0 - crown);
  float sink = mix(0.1 + 0.35 * aB.z * sin(3.1416 * a1), 3.2 * aB.z * sin(3.1416 * min(a2 * 1.7, 1.0) * 0.5) * (1.0 - 0.85 * smoothstep(0.35, 1.0, a2)), 1.0 - crown);
  vec3 P = uBreach.xyz + vec3(cos(ang) * rr, -sink, sin(ang) * rr);
  float life = mix(sin(3.1416 * a1), sin(3.1416 * a2), 1.0 - crown);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float dist = max(-mvPosition.z, 0.1);
  float px = (0.05 + 0.09 * fract(aB.w * 17.0)) * uPx * 0.83 / dist;
  gl_PointSize = clamp(px, 1.5, 14.0);
  vA = max(life, 0.0) * step(0.0, k) * min(px / 1.5, 1.0);
  #include <fog_vertex>
}
`;
const BUBBLE_FRAG = /* glsl */`
uniform vec3 uBubble;
varying float vA;
#include <fog_pars_fragment>
${FOG_FADE_GLSL}
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.3, 0.5, d)) * (0.35 + 0.65 * smoothstep(0.15, 0.42, d));     // a bright rim round a dimmer heart
  gl_FragColor = vec4(uBubble * a * vA * fogFade(), 1.0);
}
`;

export { ORBIT_GLSL, NOISE_GLSL, LIGHT_PARS_GLSL, FOG_FADE_GLSL, SHAFT_FN_GLSL, BEAM_GLSL };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('manta-cyclone-hero');      // one draw from ctx.rng; everything below is our own stream
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cWater, cDeep, cGold, cBone, cBlack, cSlate, cCobalt] = pal;
  const turn = opts.turn === -1 ? -1 : 1;
  const group = new THREE.Group();
  group.name = 'manta-cyclone';
  if (turn < 0) group.scale.z = -1;

  // ---------------- cast (all random draws happen here, from this part's own stream, before anything is built) ----------------
  const tiers = Math.min(10, Math.max(8, Math.round(opts.tiers ?? rng.int(8, 10))));
  const melShare = Math.min(0.34, Math.max(0, opts.melanistic ?? rng.pick([0, 0.05, 0.085, 0.085, 0.14, 0.22, 0.33])));
  const wheelPhase = rng() * Math.PI * 2;
  const bank = rng.range(0.27, 0.42);
  const ribThick = rng.range(0.5, 0.75), ribPhase = rng() * Math.PI * 2;
  const beatAmp = rng.range(0.9, 1.08);
  const animal = (mode) => ({
    seed: rng(), size: rng.range(3.5, 4.5) / 4, mel: rng() < melShare ? 1 : 0, mode,
    freq: rng.range(0.3, 0.4) * Math.PI * 2, phase: rng() * Math.PI * 2,
  });
  const low = [];
  const LANE_N = 13;                 // inner lane: thirteen to a tier, each tier a quarter-gap out of step with the next, so the wall comes round without a gap
  for (let k = 0; k < tiers; k++) {
    const y = 3.2 + k * (20.8 / (tiers - 1)), r = eyeRadius(y) + 2.1;
    for (let i = 0; i < LANE_N; i++) {
      const a = animal(0);
      a.slot = [r + rng.range(-0.25, 0.25), y + rng.range(-0.2, 0.2), wheelPhase + ((i + 0.25 * k) / LANE_N) * Math.PI * 2 + rng.range(-0.04, 0.04), 2.0 / r];
      low.push(a);
    }
  }
  for (let k = 0; k < 6; k++) {
    const y = 4.6 + k * 3.6;
    for (let i = 0; i < 10; i++) {
      const a = animal(0), yy = y + rng.range(-0.7, 0.7), r = 15.8 + 2.8 * ((yy - 2) / 24) + rng.range(-0.6, 0.6);
      a.slot = [r, yy, wheelPhase * 1.7 + ((i + 0.37 * k) / 10) * Math.PI * 2 + rng.range(-0.16, 0.16), 1.8 / r];
      low.push(a);
    }
  }
  const candN = low.length;                                 // inner and middle lanes: the animals that can come near the lens
  const outerN = Math.max(16, 192 - tiers * 12 - 60);      // 24 at nine tiers
  for (let i = 0; i < outerN; i++) {
    const a = animal(0), yy = rng.range(4, 23.5), r = 21 + 1.8 * ((yy - 2) / 24) + rng.range(-1.0, 1.6);
    a.slot = [r, yy, ((i + rng.range(-0.3, 0.3)) / outerN) * Math.PI * 2, 1.6 / r];
    low.push(a);
  }
  // the full-detail herd: NEAR slots that take over whichever animals are nearest the lens, then the somersaulter
  // (looping beside the top of the gold column) and the animal of the rare breach
  const special = [];
  for (let i = 0; i < NEAR; i++) { const a = animal(0); a.slot = [50, -60, 0, 0]; a.size = 0.0001; special.push(a); }
  {
    const a = animal(1);
    a.slot = [Math.hypot(SOMERSAULT.x, SOMERSAULT.z), SOMERSAULT.y, Math.atan2(-SOMERSAULT.z, SOMERSAULT.x), 0];
    a.mel = 0; special.push(a);
    const b = animal(2); b.slot = [0, -60, 0, 0]; b.mel = 0; b.size = 1.1; special.push(b);
  }
  // the chain: 28 animals arriving from open water on the +z side and merging with the outer lane
  const chainOn = opts.chain !== false;
  const chain = [];
  if (chainOn) for (let i = 0; i < 28; i++) {
    const a = animal(2); a.slot = [0, -50, 0, 0]; a.jit = rng.range(-0.8, 0.8); a.side = rng.range(-1.6, 1.6); a.lift = rng.range(-0.9, 0.9);
    chain.push(a);
  }
  // (2,400 fish from this part's own stream, as ever, and 1,000 more from a stream of their own)
  const baseN = opts.ribbon === false ? 0 : Math.round(2400 * detail), fishN = baseN + (baseN > 0 ? Math.round(1000 * detail) : 0);
  const fish = new Float32Array(Math.max(1, fishN) * 4);
  for (let i = 0; i < baseN; i++) {
    fish[i * 4 + 1] = rng.gauss() * 0.75; fish[i * 4 + 2] = rng.gauss() * 0.75; fish[i * 4 + 3] = rng();
    if (i % 400 === 399) await ctx.yield();        // (rng is this part's own stream: a pause cannot reorder its draws)
  }
  // SCHOOLS (each fish draws two cross offsets and a seed above, all read here: its school and its place along it
  // come from that seed, its offsets are scaled to its school's girth). Nine fish in ten swim in one of
  // SCHOOLS schools: iFish.x = school + place along it (0 the head, crowded; 1 the end of the tail), iFish.yz = the
  // offset already scaled by the school's girth there. The rest are stragglers strung out behind a school, wide of it.
  // The schools themselves (srng: a stream of their own, dealt on every seed) each get a height (spread over the
  // funnel from 5 to 20 m above the sand, so one is near the lens's own height nearly all the way up), a distance inside the
  // eye wall, a speed, a rise and fall, a length and a shape: teardrop (a rounded head 3 m thick and a tapering tail),
  // curved arc (even, slender, 14-18 m round the wall) or ball (5-6 m long, half as thick again).
  {
    const frng = ctx.core.makeRng(ctx.core.hashSeed('manta-school-fish:' + ctx.seed));
    for (let i = baseN; i < fishN; i++) { fish[i * 4 + 1] = frng.gauss() * 0.75; fish[i * 4 + 2] = frng.gauss() * 0.75; fish[i * 4 + 3] = frng(); }
  }
  const srng = ctx.core.makeRng(ctx.core.hashSeed('manta-schools:' + ctx.seed));
  const schools = [];
  for (let k = 0; k < SCHOOLS; k++) {
    const y = 5 + ((k + srng.range(0.15, 0.85)) / SCHOOLS) * 15, inset = srng.range(0.4, 3.2), speed = srng.range(3.0, 4.6);
    const kind = (k + srng.int(0, 2)) % 3, len = kind === 2 ? srng.range(5, 6.5) : kind === 1 ? srng.range(14, 18) : srng.range(9, 14);
    schools.push({ y, inset, rate: speed / (eyeRadius(y) - 0.35 - inset), phase: srng() * Math.PI * 2, rise: srng.range(0.7, 2.0), risePhase: srng() * Math.PI * 2, len, kind });
  }
  for (let i = 0; i < fishN; i++) {
    const o = i * 4, w = fish[o + 3], h1 = (w * 113.3) % 1, h2 = (w * 71.7) % 1;
    const sc = Math.min(SCHOOLS - 1, Math.floor(((w * 37.7) % 1) * SCHOOLS)), kind = schools[sc].kind;
    if (h2 < 0.9) {
      const t = kind === 1 ? 0.04 + 0.92 * h1 : Math.pow(h1, 1.7);
      const girth = kind === 1 ? 0.5 * Math.sqrt(Math.sin(Math.PI * t)) + 0.1 : (Math.min(1, Math.sqrt(t * 9)) * Math.pow(1 - t, 0.7) + 0.12) * (kind === 2 ? 1.5 : 1);
      fish[o] = sc + 0.999 * t;
      fish[o + 1] *= 2.0 * girth; fish[o + 2] *= 2.0 * girth;
    } else { fish[o] = sc + 0.3 + 0.699 * h1; fish[o + 1] *= 3.6; fish[o + 2] *= 2.6; }
  }
  // the whale shark's own school: 430 more fish (their own stream too) that live in the shark's frame and never
  // leave its head; iFish.x = 100 marks them
  const ownN = fishN > 0 ? Math.round(430 * detail) : 0;
  const fishAll = new Float32Array(Math.max(1, fishN + ownN) * 4);
  fishAll.set(fish.subarray(0, fishN * 4));
  {
    const orng = ctx.core.makeRng(ctx.core.hashSeed('manta-shark-school:' + ctx.seed));
    for (let i = 0; i < ownN; i++) { const o = (fishN + i) * 4; fishAll[o] = 100; fishAll[o + 1] = 0; fishAll[o + 2] = 0; fishAll[o + 3] = orng(); }
  }
  const moteN = Math.max(6, Math.round(14 * detail));
  const motes = new Float32Array(moteN * 3);
  for (let i = 0; i < moteN; i++) { motes[i * 3] = (i + rng()) / moteN; motes[i * 3 + 1] = rng(); motes[i * 3 + 2] = Math.sqrt(rng()); }
  // remoras: iRem = (station x, station z, seed, length in metres; 0 = this animal carries none). About 60 hosts.
  const remLow = new Float32Array(low.length * 4);
  for (let i = 0; i < low.length; i++) {
    const on = rng() < 0.3;
    remLow[i * 4] = rng.range(0.1, 0.34) * (rng() < 0.5 ? -1 : 1); remLow[i * 4 + 1] = rng.range(-0.45, 0.15); remLow[i * 4 + 2] = rng();
    remLow[i * 4 + 3] = on ? rng.range(0.5, 0.75) : 0;
  }
  const remNear = new Float32Array(special.length * 4);
  remNear.set([0.2, -0.2, rng(), 0.6], NEAR * 4);            // the somersaulter carries one
  // the eight narrow beams: where each stands on the sand, how far and how fast it sweeps
  const beams = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rng.range(-0.3, 0.3), r = rng.range(1.5, 6.5);
    beams.push({ cx: Math.cos(a) * r + 0.5, cz: Math.sin(a) * r + 5.5, ax: rng.range(3.5, 6.5), az: rng.range(3, 6), w: (Math.PI * 2) / rng.range(9, 17), ph: rng() * 6.283, ph2: rng() * 6.283,
      rad: rng.range(0.25, 0.7), k: rng.range(0.7, 1.2) });
  }
  const bub = new Float32Array(260 * 4);
  for (let i = 0; i < bub.length; i++) bub[i] = rng();
  await ctx.yield();

  // ---------------- uniforms shared by every material (one object per uniform, so one write reaches all) -----
  const lin = (c, k = 1) => new THREE.Color(c.r * k, c.g * k, c.b * k);
  const norm = (c, peak) => { const m = Math.max(c.r, c.g, c.b, 1e-4); return lin(c, peak / m); };
  const sunDir = new THREE.Vector3(0, Math.cos(0.436), -Math.sin(0.436));
  // the broad shaft leans toward the sun (-z): its foot is the gold pool on the sand under the eye, and from y 19 up it
  // cuts through the inner lane on the sun's side, where the top tiers swim through it and their bellies flare
  const shaftA = new THREE.Vector3(-0.3, SURFACE_Y - 0.4, -13.5), shaftB0 = new THREE.Vector3(0.4, 0, 4.0);
  const S = {
    uTime: { value: 0 }, uCam: { value: new THREE.Vector3(0, 1e4, 0) }, uPushR: { value: 4.5 },
    uClear: { value: new THREE.Vector4(PORTAL.x, PORTAL.y, PORTAL.z, 7) }, uBank: { value: bank },
    uCapA: { value: new THREE.Vector4(0, -500, 0, 0.01) }, uCapB: { value: new THREE.Vector3(0, -500, 1) },
    uThru: { value: new THREE.Vector4(ENTRY.x, ENTRY.y, ENTRY.z, 0) },
    uBow: { value: new THREE.Vector4(0, -500, 0, 0) }, uBowF: { value: new THREE.Vector3(1, 0, 0) },
    uBeam: { value: beams.map(() => new THREE.Vector4(0, 0, 0.4, 0)) }, uBeamLean: { value: new THREE.Vector2(0, -Math.tan(0.436)) },
    uWater: { value: lin(cWater) }, uGold: { value: lin(cGold) },
    uAmbUp: { value: lin(cWater, 0.9).add(lin(cSlate, 0.35)) },
    uAmbDown: { value: lin(cWater, 0.8).add(lin(cBone, 0.38)) },
    uSunDir: { value: sunDir }, uSunCol: { value: lin(cGold, 2.0) }, uKeyCol: { value: lin(cSlate, 1.0).add(lin(cGold, 0.45)) }, uSun: { value: 0.5 },
    uShaft: { value: 0 }, uCaustic: { value: 0.35 },
    uShaftA: { value: shaftA }, uShaftB: { value: shaftB0.clone() }, uShaftR: { value: SHAFT_R },
    uShaftWarm: { value: new THREE.Color(cGold.r * 1.15, cGold.g * 1.2, cGold.b * 0.45) }, uShaftT: { value: 0 },
    uFogFar: { value: new THREE.Color(0, 0, 0) }, uFogFarK: { value: 0 },
    uFogUp: { value: new THREE.Color(1, 1, 1) }, uFogDn: { value: new THREE.Color(1, 1, 1) },
    // the lit column's skin is the colour of sunlit water, pale gold-blue: never orange, which turns black backs brown
    uShaftCol: { value: lin(cGold, 0.5).add(lin(cWater, 0.6)) },
    uBio: { value: Math.min(1, Math.max(0, opts.bio ?? 0)) }, uBioCol: { value: new THREE.Color(0.12, 0.85, 0.7) },
  };
  const shaftBase = S.uShaftCol.value.clone(), warmBase = S.uShaftWarm.value.clone();
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mantaMat = new THREE.ShaderMaterial({
    name: 'manta', fog: true, vertexShader: MANTA_VERT, fragmentShader: MANTA_FRAG,
    uniforms: { ...fogU(), ...S, uBeatAmp: { value: beatAmp }, uBack: { value: norm(cBlack, 0.034) }, uBelly: { value: norm(cBone, 0.72) }, uPale: { value: lin(cBone, 0.42) } },
  });
  // (the far model beats with the same amplitude as the near one, so an animal changing model does not change its pose)
  const mantaLowMat = new THREE.ShaderMaterial({
    name: 'manta-far', fog: true, vertexShader: MANTA_VERT, fragmentShader: MANTA_FRAG,
    uniforms: { ...fogU(), ...S, uBeatAmp: mantaMat.uniforms.uBeatAmp, uBack: mantaMat.uniforms.uBack, uBelly: mantaMat.uniforms.uBelly, uPale: mantaMat.uniforms.uPale },
  });
  const moteMat = new THREE.ShaderMaterial({
    name: 'manta-motes', fog: true, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { ...fogU(), ...S, uPx: { value: 900 }, uMote: { value: lin(cGold, 0.3).add(lin(cSlate, 0.2)) } },
  });
  await ctx.yield();

  // ---------------- the two models ----------------
  const gLowHalf = buildMantaGeometry(false);
  await ctx.yield();
  const gLow = finishMantaGeometry(gLowHalf);
  await ctx.yield();
  const gHeroHalf = buildMantaGeometry(true);
  await ctx.yield();
  const gHero = finishMantaGeometry(gHeroHalf);
  await ctx.yield();
  const motePos = new THREE.Float32BufferAttribute(new Float32Array(moteN * 3), 3);
  const moteAttr = new THREE.Float32BufferAttribute(motes, 3);

  const herd = (base, list, dynamic, name) => {
    if (!list.length) return null;
    const n = list.length;
    const slot = new Float32Array(n * 4), rnd = new Float32Array(n * 4), beat = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = list[i];
      slot.set(a.slot, i * 4);
      rnd.set([a.seed, a.size, a.mel, a.mode], i * 4);
      beat.set([a.freq, a.phase, a.att || 0, a.loop || 0], i * 4);
    }
    const iSlot = new THREE.InstancedBufferAttribute(slot, 4), iRnd = new THREE.InstancedBufferAttribute(rnd, 4), iBeat = new THREE.InstancedBufferAttribute(beat, 4);
    if (dynamic) { iSlot.setUsage(THREE.DynamicDrawUsage); iBeat.setUsage(THREE.DynamicDrawUsage); }
    iRnd.setUsage(THREE.DynamicDrawUsage);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(base.index);
    for (const k of ['position', 'normal', 'aUV', 'aPart']) g.setAttribute(k, base.attributes[k]);
    g.setAttribute('iSlot', iSlot); g.setAttribute('iRnd', iRnd); g.setAttribute('iBeat', iBeat);
    g.instanceCount = n;
    const mesh = new THREE.Mesh(g, base === gLow ? mantaLowMat : mantaMat);
    mesh.frustumCulled = false; mesh.name = name;
    group.add(mesh);
    const mg = new THREE.InstancedBufferGeometry();
    mg.setAttribute('position', motePos); mg.setAttribute('aMote', moteAttr);
    mg.setAttribute('iSlot', iSlot); mg.setAttribute('iRnd', iRnd); mg.setAttribute('iBeat', iBeat);
    mg.instanceCount = n;
    const pts = new THREE.Points(mg, moteMat);
    pts.frustumCulled = false; pts.name = name + '-motes'; pts.renderOrder = 9;
    group.add(pts);
    return { list, slot, beat, rnd, iSlot, iBeat, iRnd, mesh, pts };
  };
  const herdLow = herd(gLow, low, false, 'mantas');
  await ctx.yield();
  const herdNear = herd(gHero, special, true, 'mantas-near');
  const herdChain = herd(gLow, chain, true, 'chain');
  await ctx.yield();

  // ---------------- remoras: riding bellies and chins, shifting station (they share their host's instance data) ----
  let iRemNear = null;
  if (opts.remoras !== false) {
    const remMaker = (k) => new THREE.ShaderMaterial({
      name: 'manta-remoras', fog: true, vertexShader: REMORA_VERT, fragmentShader: REMORA_FRAG, side: THREE.DoubleSide, uniforms: { ...fogU(), ...S, uRemK: { value: k } },
    });
    const remMat = remMaker(1), remMatNear = remMaker(1.3);
    const gNear = remoraGeometry(7, 6, 2), gFar = remoraGeometry(4, 3, 1);
    for (const [h, rem, base, name] of [[herdNear, remNear, gNear, 'remoras-near'], [herdLow, remLow, gFar, 'remoras']]) {
      const g = new THREE.InstancedBufferGeometry();
      g.setIndex(base.index);
      for (const k of ['position', 'normal', 'aRm']) g.setAttribute(k, base.attributes[k]);
      g.setAttribute('iSlot', h.iSlot); g.setAttribute('iRnd', h.iRnd); g.setAttribute('iBeat', h.iBeat);
      const ir = new THREE.InstancedBufferAttribute(rem, 4);
      if (h === herdNear) { ir.setUsage(THREE.DynamicDrawUsage); iRemNear = ir; }
      g.setAttribute('iRem', ir);
      g.instanceCount = h.list.length;
      const m = new THREE.Mesh(g, h === herdNear ? remMatNear : remMat); m.frustumCulled = false; m.name = name; group.add(m);
    }
  }
  await ctx.yield();

  // ---------------- fusilier ribbon ----------------
  if (fishN > 0) {
    const fg = fishGeometry(), g = new THREE.InstancedBufferGeometry();
    g.setIndex(fg.index); g.setAttribute('position', fg.attributes.position); g.setAttribute('normal', fg.attributes.normal);
    g.setAttribute('iFish', new THREE.InstancedBufferAttribute(fishAll, 4));
    g.instanceCount = fishN + ownN;
    const mat = new THREE.ShaderMaterial({
      name: 'manta-fusiliers', fog: true, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG,
      uniforms: { ...fogU(), ...S, uSch: { value: schools.map((c) => new THREE.Vector4(c.inset, c.y, c.phase, c.rate)) }, uSchB: { value: schools.map((c) => new THREE.Vector4(c.rise, c.risePhase, c.len, 0)) }, uRibbon: { value: new THREE.Vector2(ribThick, ribPhase) },
        uCobalt: { value: lin(cCobalt) }, uSilver: { value: lin(cSlate, 0.9).add(lin(cBone, 0.25)) } },
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'fusiliers'; group.add(m);
  }
  await ctx.yield();

  // ---------------- the broad sun shaft where nothing opaque was drawn (opts.shaft: a world that draws a backdrop of
  // its own, carrying shaftGlow, turns this off) ----------------
  if (opts.shaft !== false) {
    const g = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true); g.translate(0, 0.5, 0);
    const mat = new THREE.ShaderMaterial({
      name: 'manta-shaft', fog: true, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.BackSide, uniforms: { ...fogU(), ...S },
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'shaft'; m.renderOrder = 9; group.add(m);
  }

  // ---------------- the eight narrow beams ----------------
  const beamCol = { value: lin(cGold, 0.5).add(lin(cWater, 0.25)) };
  let beamK = opts.beams === false ? 0 : 0.35;
  if (opts.beams !== false) {
    const SEGS = 10, P = [], IDX = [], I = [];
    for (let b = 0; b < 8; b++) {
      const first = P.length / 3;
      for (let i = 0; i <= SEGS; i++) { P.push(-1, i / SEGS, 0, 1, i / SEGS, 0); IDX.push(b, b); }
      for (let i = 0; i < SEGS; i++) { const a = first + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIdx', new THREE.Float32BufferAttribute(IDX, 1)); g.setIndex(I);
    const mat = new THREE.ShaderMaterial({
      name: 'manta-beams', fog: true, vertexShader: BEAMS_VERT, fragmentShader: BEAMS_FRAG, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...fogU(), ...S, uBeamCol: beamCol },
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'beams'; m.renderOrder = 9; group.add(m);
  }

  // ---------------- the breach's bubbles (parked until hero.setBreach is given a progress) ----------------
  const breachU = { uBreach: { value: new THREE.Vector4(BREACH[2][1], SURFACE_Y - 0.15, BREACH[2][3], -1) }, uPx: moteMat.uniforms.uPx, uBubble: { value: lin(cSlate, 0.9).add(lin(cBone, 0.3)) } };
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(260 * 3), 3));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(bub, 4));
    const mat = new THREE.ShaderMaterial({
      name: 'manta-breach-bubbles', fog: true, vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, uniforms: { ...fogU(), uTime: S.uTime, ...breachU },
    });
    const m = new THREE.Points(g, mat); m.frustumCulled = false; m.name = 'breach-bubbles'; m.renderOrder = 9; group.add(m);
  }

  // ---------------- wing shadows on the sand under the lowest animals ----------------
  const shadowU = { uShadowCol: { value: lin(cDeep, 0.35) }, uShadow: { value: 0.42 } };
  if (opts.shadows !== false) {
    const under = low.filter((a) => a.slot[1] < 8.6);
    const n = under.length, slot = new Float32Array(n * 4), rnd = new Float32Array(n * 4), beat = new Float32Array(n * 4);
    under.forEach((a, i) => { slot.set(a.slot, i * 4); rnd.set([a.seed, a.size, a.mel, 0], i * 4); beat.set([a.freq, a.phase, 0, 0], i * 4); });
    const q = new THREE.PlaneGeometry(6.4, 4.6, 1, 1); q.rotateX(-Math.PI / 2); q.translate(0, 0, -0.1);
    const g = new THREE.InstancedBufferGeometry();
    g.setIndex(q.index); g.setAttribute('position', q.attributes.position);
    g.setAttribute('iSlot', new THREE.InstancedBufferAttribute(slot, 4)); g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(rnd, 4)); g.setAttribute('iBeat', new THREE.InstancedBufferAttribute(beat, 4));
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      name: 'manta-shadows', fog: true, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, uniforms: { ...fogU(), ...S, ...shadowU },
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'wing-shadows'; m.renderOrder = 1; group.add(m);
  }
  await ctx.yield();

  // ---------------- the chain's road: in from open water on the +z side, then a third of the way round the outer lane ----
  const chainPts = [new THREE.Vector3(-34, 10.5, 74), new THREE.Vector3(-25, 11, 55), new THREE.Vector3(-14, 11.8, 37), new THREE.Vector3(-5, 12.5, 25.5)];
  for (let d = -90; d <= 30; d += 30) { const a = (d * Math.PI) / 180; chainPts.push(new THREE.Vector3(Math.cos(a) * 22.2, 13 + (d + 90) / 150, -Math.sin(a) * 22.2)); }
  const TAB = 200, tab = new Float32Array((TAB + 1) * 3);
  let chainLen = 1;
  {
    const curve = new THREE.CatmullRomCurve3(chainPts, false, 'centripetal');
    const sp = curve.getSpacedPoints(TAB);
    chainLen = curve.getLength();
    for (let i = 0; i <= TAB; i++) { tab[i * 3] = sp[i].x; tab[i * 3 + 1] = sp[i].y; tab[i * 3 + 2] = sp[i].z; }
  }
  const tabAt = (d, out) => {
    const f = Math.min(0.99999, Math.max(0, d / chainLen)) * TAB, i = Math.floor(f), t = f - i, a = i * 3;
    out.set(tab[a] + (tab[a + 3] - tab[a]) * t, tab[a + 1] + (tab[a + 4] - tab[a + 1]) * t, tab[a + 2] + (tab[a + 5] - tab[a + 2]) * t);
    return out;
  };
  // the breach's line (see BREACH)
  const breachCurve = new THREE.CatmullRomCurve3(BREACH.map((k) => new THREE.Vector3(k[1], k[2], k[3])), false, 'centripetal');
  const breachAt = (k, out) => {
    let i = 0; while (i < BREACH.length - 2 && k > BREACH[i + 1][0]) i++;
    const t = Math.min(1, Math.max(0, (k - BREACH[i][0]) / (BREACH[i + 1][0] - BREACH[i][0])));
    return breachCurve.getPoint((i + t) / (BREACH.length - 1), out);
  };
  await ctx.yield();

  // ---------------- driving it ----------------
  let progress = null, shaftSet = null, breachK = -1;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), size2 = new THREE.Vector2();
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // the chain swims its road on the clock (1.8 m/s) and loops; animals grow in at the far end and shrink out in the lane
  const layChain = (time) => {
    const h = herdChain; if (!h) return;
    for (let i = 0; i < h.list.length; i++) {
      const a = h.list[i];
      let d = time * 1.8 + i * CHAIN_SPACING + a.jit;
      d = ((d % chainLen) + chainLen) % chainLen;
      tabAt(d, v1); tabAt(d + 1.5, v2); tabAt(d + 4.5, v3);
      const yaw = Math.atan2(v2.x - v1.x, v2.z - v1.z), yaw2 = Math.atan2(v3.x - v2.x, v3.z - v2.z);
      const flat = Math.hypot(v2.x - v1.x, v2.z - v1.z) || 1;
      const o = i * 4;
      h.slot[o] = v1.x + Math.cos(yaw) * a.side; h.slot[o + 1] = v1.y + a.lift + 0.3 * Math.sin(time * 0.4 + a.seed * 30); h.slot[o + 2] = v1.z - Math.sin(yaw) * a.side; h.slot[o + 3] = yaw;
      h.beat[o + 2] = Math.atan2(v2.y - v1.y, flat) + 0.05 * Math.cos(time * 0.4 + a.seed * 30);
      h.beat[o + 3] = Math.min(0.5, Math.max(-0.5, -wrapPi(yaw2 - yaw) * 2.4));
      h.rnd[o + 1] = a.size * Math.max(0.001, sstep(0, 9, d) * (1 - sstep(chainLen - 9, chainLen - 0.5, d)));
    }
    h.iSlot.needsUpdate = true; h.iBeat.needsUpdate = true; h.iRnd.needsUpdate = true;
  };
  // the full-detail slots: each frame the NEAR animals nearest the lens wear the full model (and their far model is
  // scaled away); an animal keeps its slot until five others are nearer, so the set does not flicker
  const nearIdx = new Int32Array(NEAR).fill(-1), inSet = new Uint8Array(low.length), dist2 = new Float32Array(candN), rank = new Int16Array(candN);
  const order = []; for (let i = 0; i < candN; i++) order.push(i);
  const byDist = (a, b) => dist2[a] - dist2[b];
  const pickNear = (time) => {
    const cam = S.uCam.value, L = herdLow, N = herdNear;
    for (let i = 0; i < candN; i++) {
      const sl = low[i].slot, ang = sl[2] + sl[3] * time, dx = Math.cos(ang) * sl[0] - cam.x, dy = sl[1] - cam.y, dz = -Math.sin(ang) * sl[0] - cam.z;
      dist2[i] = dx * dx + dy * dy + dz * dz;
    }
    order.sort(byDist);
    for (let r = 0; r < candN; r++) rank[order[r]] = r;
    let changed = false, r = 0;
    for (let s = 0; s < NEAR; s++) {
      const cur = nearIdx[s];
      if (cur >= 0 && rank[cur] < NEAR + 5) continue;
      if (cur >= 0) { L.rnd[cur * 4 + 1] = low[cur].size; inSet[cur] = 0; nearIdx[s] = -1; N.rnd[s * 4 + 1] = 0.0001; changed = true; }
      while (r < candN && inSet[order[r]]) r++;
      if (r >= candN || r >= NEAR + 5) continue;
      const i = order[r], o = s * 4, q = i * 4;
      for (let k = 0; k < 4; k++) { N.slot[o + k] = L.slot[q + k]; N.rnd[o + k] = L.rnd[q + k]; N.beat[o + k] = L.beat[q + k]; remNear[o + k] = remLow[q + k]; }
      if (remNear[o + 3] === 0) remNear[o + 3] = -(0.55 + 0.2 * low[i].seed);       // every full-detail animal has a remora under its chin
      N.rnd[o + 1] = low[i].size; L.rnd[q + 1] = 0.0001; inSet[i] = 1; nearIdx[s] = i; changed = true;
    }
    if (changed) { L.iRnd.needsUpdate = true; N.iSlot.needsUpdate = true; N.iBeat.needsUpdate = true; if (iRemNear) iRemNear.needsUpdate = true; }
    return changed;
  };
  // the breach animal (slot NEAR + 1 of the full-detail herd): placed along its line by k, parked under the sand otherwise
  const layBreach = () => {
    const N = herdNear, o = (NEAR + 1) * 4;
    if (breachK < 0) { N.slot[o + 1] = -60; N.rnd[o + 1] = 0.0001; return; }
    breachAt(breachK, v1); breachAt(Math.min(1, breachK + 0.02), v2);
    const flat = Math.hypot(v2.x - v1.x, v2.z - v1.z) || 1;
    N.slot[o] = v1.x; N.slot[o + 1] = v1.y; N.slot[o + 2] = v1.z; N.slot[o + 3] = Math.atan2(v2.x - v1.x, v2.z - v1.z);
    N.beat[o + 2] = Math.atan2(v2.y - v1.y, flat); N.beat[o + 3] = 0.5 * Math.sin(breachK * 9.0);
    N.rnd[o + 1] = 1.1 * sstep(0, 0.07, breachK) * (1 - sstep(0.88, 1, breachK)) + 0.0001;
  };
  const layBeams = (time) => {
    for (let i = 0; i < 8; i++) {
      const b = beams[i];
      S.uBeam.value[i].set(b.cx + b.ax * Math.sin(time * b.w + b.ph), b.cz + b.az * Math.sin(time * b.w * 0.83 + b.ph2), b.rad, beamK * b.k * (0.75 + 0.25 * Math.sin(time * 0.9 + b.ph * 3)));
    }
  };
  layChain(0); pickNear(0); layBreach(); layBeams(0);

  const hero = {
    object: group,
    radius: 23, height: SURFACE_Y, center: new THREE.Vector3(0, 13, 0),
    ground: true, groundY: 0,
    uniforms: S,
    info: { wheelPhase, bottomRate: 2.0 / (eyeRadius(3.2) + 2.1), tiers, laneN: LANE_N, melanistic: melShare, turn, schools: SCHOOLS, animals: low.length + chain.length + 1, fish: fishN + ownN },
    setProgress(u) {
      progress = Math.min(1, Math.max(0, u));
      if (shaftSet === null) { const s = sstep(0.488, 0.545, progress); S.uShaft.value = s; S.uCaustic.value = 0.35 + 0.65 * s; }
    },
    setShaft(s) { shaftSet = Math.min(1, Math.max(0, s)); S.uShaft.value = shaftSet; S.uCaustic.value = 0.35 + 0.65 * shaftSet; },
    setBeams(k, color) { beamK = Math.max(0, k); if (color) beamCol.value.copy(color); },       // strength of the eight narrow beams (0.35), their colour in the water
    setBio(b) { S.uBio.value = Math.min(1, Math.max(0, b)); },
    setPush(r) { S.uPushR.value = Math.max(0.01, r); },
    setClear(p, r) { S.uClear.value.set(p.x, p.y, p.z, Math.max(0.01, r)); },
    // the whale shark: its keep-out capsule (nose and tail ends of the body axis, local space; radius 0 = none), and its
    // own school of 430 fusiliers (its snout, its heading, its scale 0..1: they are with it for as long as it is there)
    setCapsule(a, b, r) { S.uCapA.value.set(a.x, a.y, a.z, Math.max(0.01, r)); S.uCapB.value.copy(b); },
    setBow(p, f, on) { S.uBow.value.set(p.x, p.y, p.z, Math.min(1, Math.max(0, on))); S.uBowF.value.copy(f); },
    setThrough(on) { S.uThru.value.w = on ? 1 : 0; },          // true while the world is seen through the previous portal
    setBreach(k) { breachK = k; breachU.uBreach.value.w = k; },                              // 0..1 through the breach; below 0 parks it
    breachHole: new THREE.Vector3(BREACH[2][1], SURFACE_Y, BREACH[2][3]),
    setFogTint(up, down) { if (up) S.uFogUp.value.copy(up); if (down) S.uFogDn.value.copy(down); },
    setShadow(s) { shadowU.uShadow.value = s; },
    setShaftTint(c) { S.uShaftCol.value.copy(shaftBase).multiply(c); S.uShaftWarm.value.copy(warmBase).multiply(c); },      // multiplies the column's colours (moonlight, dawn)
    setFogFar(c, k = 1) { S.uFogFar.value.copy(c); S.uFogFarK.value = k; },      // the colour the water takes far from the lens (see waterFog)
    // all colours linear THREE.Color; sunDir a unit Vector3 TOWARD the sun in the hero's local space
    setLight(l = {}) {
      if (l.sunDir) S.uSunDir.value.copy(l.sunDir).normalize();
      if (l.sunColor) S.uSunCol.value.copy(l.sunColor);
      if (l.keyColor) S.uKeyCol.value.copy(l.keyColor);
      if (l.ambientUp) S.uAmbUp.value.copy(l.ambientUp);
      if (l.ambientDown) S.uAmbDown.value.copy(l.ambientDown);
      if (l.water) S.uWater.value.copy(l.water);
      if (l.sun !== undefined) S.uSun.value = l.sun;
      if (l.caustic !== undefined) S.uCaustic.value = l.caustic;
    },
    update(dt, time, camera) {
      S.uTime.value = time; S.uShaftT.value = time;
      if (camera) {
        group.updateWorldMatrix(true, false);
        camera.getWorldPosition(v1);
        S.uCam.value.copy(group.worldToLocal(v1));
      }
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) moteMat.uniforms.uPx.value = ctx.renderer.getDrawingBufferSize(size2).y;
      S.uShaftB.value.set(shaftB0.x + Math.sin(time * 0.13) * 0.9, 0, shaftB0.z + Math.cos(time * 0.17) * 0.9);   // the shaft wanders
      layChain(time); pickNear(time); layBreach(); layBeams(time);
      herdNear.iSlot.needsUpdate = true; herdNear.iBeat.needsUpdate = true; herdNear.iRnd.needsUpdate = true;
    },
    dispose() { gLow.dispose(); gHero.dispose(); },
  };

  // ---------------- anchors (local space, y above the sand) ----------------
  hero.anchors = {
    portalSeat: { position: PORTAL.clone(), normal: new THREE.Vector3(0.994, -0.11, 0), radius: 4.5 },
    flyThrough: FLY.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    entry: ENTRY.clone(), entryDir: new THREE.Vector3(0, 0, 1),
    eye: new THREE.Vector3(0, 6.5, 0), eyeRadius, eyeLook: new THREE.Vector3(0, 22, 0), columnMid: new THREE.Vector3(0, 13, 0),
    somersault: SOMERSAULT.clone(),
    shaftTop: shaftA.clone(), shaftFoot: shaftB0.clone(), shaftRadius: SHAFT_R,
    chainPath: chainPts.map((p) => p.clone()), chainLength: chainLen,
    surfaceY: SURFACE_Y,
    viewpoints: [
      { position: new THREE.Vector3(2, 1.5, -3.5), target: new THREE.Vector3(1, 6, 9) },          // the floor of the eye
      { position: new THREE.Vector3(-7.7, 2.3, 2), target: new THREE.Vector3(-7, 3.2, -8) },      // the low orbit, mouths coming on
      { position: new THREE.Vector3(3.5, 14.5, 1.5), target: new THREE.Vector3(0, 0, 3) },        // the well
      { position: new THREE.Vector3(5.5, 20, 3.5), target: PORTAL.clone() },                      // the ring across the mouth
    ],
  };
  return hero;
}
