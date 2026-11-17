// HERO SET PIECE for "ice-arcade" (The Glass Birches): THE ARCADE AND ITS RELEASE.
//
// WHAT IT IS
//   A 305 m arcade of ~102 paper birches bowed by an ice storm until their crowns cross 8-10 m over a sled track:
//   white stems with black chevrons leaning in like ribs, a vault of glazed twig sprays and icicle combs. Ahead of
//   the light front it is a blue nave with only its ridge lit rose. When the front reaches a tree, 0.8 s later the
//   sheath bursts base to tip, a curtain of glitter and angular shards falls (1.4 s to the snow, one bounce, then
//   litter), and the stem whips to three-quarters upright in 0.9 s and rocks at 0.6 Hz for four seconds. Two heralds
//   let go early; the last pair (10 m past the arcade) never lets go and frames the portal.
//
// LOCAL SPACE  +Y up. The mouth is toward +Z, travel runs toward -Z, the right of travel is +X (sun side by default).
//   Arcade distance "arc": 0 at the mouth, info.extent.length at the portal pair. The default centre line is the
//   brief's S (left 15 deg by arc 75, right 33 deg by arc 165, then straight), bends scaled per seed, bounding box
//   centred on the origin. Supply opts.centerline to put it on the world's own track.
//
// OPTS (all optional)
//   palette      7 hex strings in brief order [snow/bark white, rose, gold, shade blue, deep blue, ice/sky pale, red]
//   centerline   [[x,y,z]...] local ground points of the track (mouth -> portal seat); arcade = its length - 10 m
//   groundAt     (x, z) => y local; trees, floor, shards and anchors sit on it (default flat 0)
//   length 305   arcade length when no centerline is given;  mirror: flip the default bends
//   hour         'rose' (default; 'dawn'/'day' alias) | 'golden' (copper sun on the LEFT) | 'night' (moon, no ridge shadow)
//   load/season  'normal' | 'heavy' (deeper bows, thicker glaze, slower wave) | 'light' (half the trees barely bowed, faster)
//   weather      'clear' | 'dust' | 'shower' (more / larger sifting crystal)
//   sunDir       Vector3 TO the sun, local (default: 7 deg up, abeam on the right, a little behind); sunSide +-1;
//                sunColor, sunIntensity; ridgeShadow (bool: the rising shadow edge ahead of the front); ridgeHeight 7.4
//   pathLength 440, arcadeStart 125, passAt 125, frontFactor 1.6   the brief's timeline numbers used by setProgress
//   floor true   build the snow ribbon (track, grooves, paw prints, sparkle, shadow bars, sliding light edge);
//                false when the world's terrain does it (then sample anchors.shadow and uniforms.uFront yourself)
//   floorWidth 46 (half width, edges fade out)   wind 1   glint 1
//   extraTrees   [{x, z, y?, dir:[dx,dz] | yaw, bow, scale, variant, release (timeline s) | omit = never, arc?, light, corr}]
//                more birches of the same build and shaders for the world's arches and open wood; light: true = the
//                420-triangle flank build for trees 12 m and further off; corr = metres from the foot to the sled's
//                corridor along the lean (worked out from the centre line when omitted): no glass hangs into it
//   releaseAt    (arc) => timeline second at which the light front reaches that arcade distance (default arc / 16);
//   frontAt      (T) => arc, its inverse; timeAtCamArc (arc) => T when the sled is there (heralds use it);
//                with these the world can hold the wave beside the sled and then let it run. shardBoost (arc) => x
//   heraldArc [75, 100], heraldCam [25, 55]   where the two heralds stand, and where the sled is when each bursts
//                extraTrees take clear: the height (m, default 4.8) its glass is lifted to over its corridor
//   skip         (arc, sunSide) => true to leave out a rib there (sunSide +1: the sun's side of the trail): gaps to fly through
//   curtain 1    strength of the falling sheets (uniforms.uCurt), so a world that watches the wave from near can thin it
//   full 0       uniforms.uFull, 0..1, for the world to drive: 1 while the eye stands outside the arcade and sees the wave from the
//                side: every curtain is then a full, ragged, strand-hung fall like a herald's (sun-lit), not the thin sheet of the vault
//   shadowLat 48 metres of ground across the trail that the baked trunk shadows cover (anchors.shadow.latSpan)
//   extraTrees also take whip (seconds the stem waits under its falling ice) and rag (seconds its burst takes to run from
//                base to tip beyond the usual 0.35: it sheds slowly, in separate falls, while its outer half still hangs with ice)
//   view         [arc, radius, centreHeight, height] of the viewing vignette
//   lead 0       with a centerline: metres of track BEFORE the arcade mouth that the line also covers (the world's open
//                wood and pond); shadow bars, extra trees and the floor then reach back over it, and it is always sunlit
//   preLit       arcade distance where the always-sunlit approach ends (default: off without lead, 4 with it)
//
// RETURNS (besides the contract fields)
//   setProgress(u)    world path u -> timeline with the brief's numbers. THE PROGRESS HOOK: call every frame.
//   setCameraArc(a)   same, from the sled's arcade distance (a = arcOf(x, z).arc of the camera's local position):
//                     the wave overtakes the sled at arc = passAt and runs ahead at frontFactor x sled speed.
//   setTime(T)        raw timeline seconds: light front at arc 16 T; a tree at arc a bursts at a / 16 + 0.8.
//                     Until one of these is called the piece demo-loops on time (27 s) so it lives on its own.
//   arcOf(x,z) -> {arc, lat}; pointAt(arc, lat, h) -> Vector3; frontArc(); getTime(); releaseTimeAt(arc)
//   setLight({ sun, sunColor, sky, deep, glint, litAll }); uniforms (shared block); info (triangles, extent...)
//
// ANCHORS (local space)
//   flyThrough   eye points 1.7 m over the track every 12.5 m from 30 m before the mouth to the portal seat. No stem
//                within 5.5 m of this line; no glass below 4.8 m over it (clamped in the vertex shader).
//   mouth        { position, facing }  first pair, on the snow, facing = direction of travel
//   portalSeat   { position (foot, on the snow), center (4.5 m up), facing (back along the track), width 9, height 9 }
//   heralds      [{ root, crown, curtain, arc, side, time }] the two early trees (right, then left); time = burst
//                (timeline s); curtain = the middle of the falling sheet (a gaze target). They burst when the sled is at
//                arc 25 and arc 55, hold a second under their own ice, then whip up; their ice carries its own pale light
//   owlPerch, owlLiftTime   the left herald's bowed crown (or the crown nearest opts.owlArc) and the moment the herald's stem begins to stir (burst + 1 s)
//   trees        [{ x, y, z, arc, side, release, portal, herald }] every foot (keep creatures and props off them)
//   viewpoints   { nave, waveBeside, lookBack, outside, exit } each { position, gaze }
//   shadow       { texture, span, latSpan } baked trunk shadow bars: u = (arc + 30) / span, v = lateral / latSpan + 0.5
//   sun, arcLength, total
//
// SIZE   true extent in info.extent: ~315 m long, stems 6-7 m either side, vault 9-11 m high, floor +-46 m. The reported
//        radius / height / center are a VIEWING vignette on the track near arc 118 so the part viewer flies the nave.
// COST   ~190k triangles alone (108 trees x ~1,400: kinked tapered stem, 5 limbs + 10 lesser limbs, ~150 twig-spray
//        cards, 30 icicle combs, two curtain sheets; ~15k instanced chips = shards + litter + diamond dust; floor
//        3.6k), up to 12 draw calls (3 near + 2 flank variants x bark and glass, chips, floor), one R8 shadow texture,
//        no lights, ~200-250 ms build. Uniform scale only.
// RELEASE  0.8 s after the light touches a tree the sheath bursts base to tip; the stem lets go slowly then whips
//        (0.7 s) and rocks. The curtain sheets show, at every point, the ice that is passing there: plates and chips
//        that keep their size as they speed up (square glitter cells when sub-pixel), a veil of dust, powder where
//        they land; thinned over the track, near the eye and far down the avenue so nothing whites out.
// LIGHT  Self-lit ShaderMaterials (scene lights ignored, scene fog honoured, linear HDR). Key = low rose-gold sun
//        abeam from +X; fill = sky blue (palette[3]) so shade is blue, never grey. Glints reach HDR 4-12 and want a
//        tight bloom (threshold ~0.9). Give it a blue-to-peach sky and thin blue-violet haze.
// STYLE  Naturalism under a strict two-temperature grade: every surface = albedo x (uSunCol x lit + sky-blue fill),
//        lit = litAt(arc, height) from the sliding front. Glaze is shading: a dark twig core inside a clear sheath
//        with fwidth-antialiased lines, beads of specular fire that crawl with the view, averaged when sub-pixel.
import * as THREE from 'three';

const DEF_PALETTE = ['#FBF6F1', '#F6C3CC', '#FFD79A', '#5E86C4', '#243F7A', '#BCE3F4', '#C8202A'];
const THETA_MAX = 2.1;          // stem tip angle from vertical (radians) at bow = 1
const FRONT_SPEED = 16;         // m of arcade the light front crosses per timeline second
const lin = (hex) => new THREE.Color(hex);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// stem centre line in tree-local space (bend toward +X): the same integral the vertex shaders run
function stemPoint(t, theta, len, out) {
  let x = 0, y = 0; const dt = t / 6;
  for (let i = 0; i < 6; i++) { const s = (i + 0.5) * dt, ph = theta * s * (0.45 + 0.55 * s); x += Math.sin(ph); y += Math.cos(ph); }
  out.x = x * dt * len; out.y = y * dt * len; return out;
}

// ------------------------------------------------------------------------------------------------
// one birch, modelled straight; every vertex carries what the bend shader needs
//   aAtt   stem parameter 0..1 of the point of the stem it hangs from
//   aLimb  offset from that stem point, turned rigidly with the stem's frame
//   aTwig  extra offset in the bare pose (turned with the stem); aHang: extra offset under ice (hangs in world space)
// ------------------------------------------------------------------------------------------------
// lod 0: the near build (arcade, arches): 8-sided tapered kinked trunk, 5 limbs each with 2 second-order limbs,
//        ~150 twig-spray cards from the shoulder of the stem up, icicle combs, two curtain sheets (~1,400 triangles)
// lod 1: the flank build for trees 12 m and further off: fewer, wider cards and one sheet (~420 triangles)
function buildBirch(rng, vi, lod = 0) {
  const L = [16.2, 15.2, 17.0][vi % 3] * rng.range(0.98, 1.02);
  const r0 = rng.range(0.15, 0.185);
  const radAt = (t) => r0 * (Math.pow(Math.max(0.02, 1 - 0.93 * t), 1.15) + 0.5 * Math.exp(-t * 20)) + 0.012;
  const B = { pos: [], att: [], limb: [], hang: [], nrm: [], tone: [], idx: [] };
  const G = { pos: [], att: [], limb: [], twig: [], hang: [], card: [], kind: [], idx: [] };
  const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const Y = v3(0, 1, 0);
  // the stem is never a pipe: it wanders, and kinks once where an old leader died
  const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), p3 = rng.range(0, 6.28), tk = rng.range(0.3, 0.55), kx = rng.range(-0.5, 0.5), kz = rng.range(-0.5, 0.5);
  const wob = (t, o = v3()) => { const k = Math.max(0, t - tk); return o.set(0.11 * Math.sin(t * 7.3 + p1) * t + 0.045 * Math.sin(t * 19 + p2) * t + kx * k, 0, 0.11 * Math.cos(t * 6.1 + p3) * t + 0.045 * Math.cos(t * 17 + p1) * t + kz * k); };

  // ---- trunk, rings crowded toward the top where the bend is tightest
  const SIDES = lod ? 6 : 8, RINGS = lod ? 9 : 14, w0 = v3();
  for (let i = 0; i < RINGS; i++) {
    const t = Math.pow(i / (RINGS - 1), 0.85), r = radAt(t) * (i === RINGS - 1 ? 0.5 : 1);
    wob(t, w0);
    for (let j = 0; j < SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2 + i * 0.22, k = 1 + 0.12 * Math.sin(j * 2.4 + i * 1.7) + (i === 0 ? 0.25 * Math.sin(j * 1.9 + vi) : 0);
      const nx = Math.cos(a), nz = Math.sin(a);
      B.pos.push(nx * r * k + w0.x, t * L, nz * r * k + w0.z); B.att.push(t); B.limb.push(nx * r * k + w0.x, 0, nz * r * k + w0.z);
      B.hang.push(0, 0, 0); B.nrm.push(nx, 0.1, nz); B.tone.push(t > 0.93 ? 0.6 : (i === 0 ? 0.35 : 0));
    }
    if (i) for (let j = 0; j < SIDES; j++) {
      const a = (i - 1) * SIDES + j, b = (i - 1) * SIDES + (j + 1) % SIDES, c = i * SIDES + j, d = i * SIDES + (j + 1) % SIDES;
      B.idx.push(a, c, b, b, c, d);
    }
  }

  // ---- limbs: rising steeply as birch limbs do; under ice they sag. Each main limb carries two lesser ones.
  const mkBranch = (t, base, baseSag, d0, len, az, rb, sagK) => ({
    t, len, rb, az,
    at(s, o = v3()) { return o.copy(d0).multiplyScalar(s * len).addScaledVector(Y, 0.1 * len * s * s).add(base); },
    dirAt(s, o = v3()) { return o.copy(d0).addScaledVector(Y, 0.2 * s).normalize(); },
    sag(s, o = v3()) { return o.set(Math.cos(az) * 0.12 * len * s * s, -sagK * len * s * s, Math.sin(az) * 0.12 * len * s * s).add(baseSag); },
  });
  const tubeBranch = (br, sides, rings, tone0) => {
    const d0 = br.dirAt(0), base = B.pos.length / 3, side = v3().crossVectors(d0, Y).normalize(), up = v3().crossVectors(side, d0).normalize();
    const p = v3(), sg = v3();
    for (let i = 0; i < rings; i++) {
      const s = i / (rings - 1), r = br.rb * (1 - 0.88 * s) + 0.007;
      br.at(s, p); br.sag(s, sg);
      for (let j = 0; j < sides; j++) {
        const a = j * Math.PI * 2 / sides + 0.6, nx = side.x * Math.cos(a) + up.x * Math.sin(a), ny = side.y * Math.cos(a) + up.y * Math.sin(a), nz = side.z * Math.cos(a) + up.z * Math.sin(a);
        B.pos.push(p.x + nx * r, br.t * L + p.y + ny * r, p.z + nz * r); B.att.push(br.t); B.limb.push(p.x + nx * r, p.y + ny * r, p.z + nz * r);
        B.hang.push(sg.x, sg.y, sg.z); B.nrm.push(nx, ny, nz); B.tone.push(Math.min(1, tone0 + (1 - tone0) * Math.min(1, s * 1.6)));
      }
      if (i) for (let j = 0; j < sides; j++) {
        const a = base + (i - 1) * sides + j, b = base + (i - 1) * sides + (j + 1) % sides, c = base + i * sides + j, d = base + i * sides + (j + 1) % sides;
        B.idx.push(a, c, b, b, c, d);
      }
    }
  };
  const limbs = [], subs = [];
  const NL = lod ? 4 : 5, az0 = rng.range(0, 6.28);
  for (let li = 0; li < NL; li++) {
    const t = 0.38 + 0.52 * (li + rng.range(0.1, 0.9)) / NL;
    const az = az0 + li * 2.4 + rng.range(-0.4, 0.4), el = rng.range(0.5, 0.9);
    const len = (5.6 - 3.0 * (t - 0.38) / 0.52) * rng.range(0.85, 1.15);
    const d0 = v3(Math.cos(az) * Math.sin(el), Math.cos(el), Math.sin(az) * Math.sin(el));
    const lim = mkBranch(t, wob(t), v3(), d0, len, az, radAt(t) * 0.55, rng.range(0.34, 0.5));
    limbs.push(lim); tubeBranch(lim, lod ? 3 : 4, lod ? 4 : 5, 0.25);
    if (lod) continue;
    for (let k = 0; k < 2; k++) {
      const s0 = 0.3 + 0.3 * k + rng.range(0, 0.12), a2 = az + (k ? 1 : -1) * rng.range(0.6, 1.2), e2 = rng.range(0.45, 1.05);
      const d1 = v3(Math.cos(a2) * Math.sin(e2), Math.cos(e2), Math.sin(a2) * Math.sin(e2));
      const sub = mkBranch(t, lim.at(s0), lim.sag(s0), d1, len * rng.range(0.4, 0.55) * (1 - 0.4 * s0), a2, lim.rb * (1 - 0.8 * s0) * 0.75, rng.range(0.4, 0.6));
      subs.push(sub); tubeBranch(sub, 3, 3, 0.7);
    }
  }

  // ---- twig sprays: a 2- or 3-segment card each; the fragment shader draws a twig with side shoots inside it
  const gv = (att, limb, twig, hang, card, kind) => {
    G.pos.push(limb.x + twig.x, att * L + limb.y + twig.y, limb.z + twig.z); G.att.push(att);
    G.limb.push(limb.x, limb.y, limb.z); G.twig.push(twig.x, twig.y, twig.z); G.hang.push(hang.x, hang.y, hang.z);
    G.card.push(card[0], card[1], card[2], card[3]); G.kind.push(kind);
    return G.pos.length / 3 - 1;
  };
  const A = v3(), sagA = v3(), db = v3(), wB = v3(), wH = v3(), hOut = v3(), tw = v3(), hg = v3(), tmp = v3();
  const wK = lod ? 1.5 : 1;
  const spray = (att, A, sagA, hostDir, lenK, segs) => {
    const len = rng.range(1.5, 2.9) * lenK, hw = (0.4 + 0.09 * len) * wK, seed = rng.range(0, 100);
    tmp.set(rng.gauss(), rng.gauss() * 0.6 + 0.35, rng.gauss()).normalize();
    db.copy(hostDir).multiplyScalar(0.55).addScaledVector(tmp, 0.9).normalize();
    wB.set(rng.gauss(), rng.gauss(), rng.gauss()).cross(db).normalize();
    const ha = rng.range(0, 6.28); hOut.set(Math.cos(ha), 0, Math.sin(ha)); wH.set(-hOut.z, 0, hOut.x);
    if (rng.chance(0.5)) wH.copy(hOut).multiplyScalar(-1);            // half the cards turn edge-on to their lean: fuller from every side
    const lean = rng.range(0.12, 0.4);
    let prev = -1;
    for (let i = 0; i <= segs; i++) {
      const s = i / segs;
      tw.copy(db).multiplyScalar(s * len).addScaledVector(Y, -0.1 * len * s * s);
      hg.copy(hOut).multiplyScalar(lean * len * (1 - (1 - s) * (1 - s))).addScaledVector(Y, -len * s * (0.5 + 0.42 * s)).add(sagA);
      const a = gv(att, A, tmp.copy(tw).addScaledVector(wB, -hw), v3().copy(hg).addScaledVector(wH, -hw), [-hw, s * len, len, seed], 1);
      gv(att, A, tmp.copy(tw).addScaledVector(wB, hw), v3().copy(hg).addScaledVector(wH, hw), [hw, s * len, len, seed], 1);
      if (prev >= 0) G.idx.push(prev, prev + 1, a, prev + 1, a + 1, a);
      prev = a;
    }
  };
  const perLimb = lod ? 10 : 14;
  for (const lim of limbs) for (let k = 0; k < perLimb; k++) {
    const s = 0.15 + 0.85 * Math.pow((k + rng()) / perLimb, 0.8);
    spray(lim.t, lim.at(s, A), lim.sag(s, sagA), lim.dirAt(s, tmp.clone()), (1 - 0.25 * s) * (lod ? 1.3 : 1), lod ? 2 : 3);
  }
  for (const sub of subs) for (let k = 0; k < 5; k++) {
    const s = 0.2 + 0.8 * (k + rng()) / 5;
    spray(sub.t, sub.at(s, A), sub.sag(s, sagA), sub.dirAt(s, tmp.clone()), 0.85 - 0.2 * s, 2);
  }
  const nStem = lod ? 14 : 30;                                           // the stem from its shoulder to the leader carries its own
  for (let k = 0; k < nStem; k++) {
    const t = 0.27 + 0.73 * Math.pow((k + rng()) / nStem, 0.75);
    spray(t, wob(t, A), sagA.set(0, 0, 0), Y, (0.8 + 0.2 * (1 - t)) * (lod ? 1.3 : 1), lod ? 2 : 3);
  }

  // ---- icicle combs: cards hanging under limbs and under the bowed stem (top edge follows the host)
  const comb = (attA, PA, sA, attB, PB, sB, span) => {
    const h = rng.range(0.2, 0.36), seed = rng.range(0, 100), z = v3();
    const a = gv(attA, PA, z, sA, [0, 0, h, seed], 2);
    gv(attB, PB, z, sB, [span, 0, h, seed], 2);
    gv(attA, PA, z, v3(sA.x, sA.y - h, sA.z), [0, 1, h, seed], 2);
    gv(attB, PB, z, v3(sB.x, sB.y - h, sB.z), [span, 1, h, seed], 2);
    G.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  };
  if (!lod) for (const lim of limbs) for (let k = 0; k < 4; k++) {
    const s1 = 0.08 + k * 0.22 + rng.range(0, 0.04), s2 = s1 + 0.2;
    comb(lim.t, lim.at(s1), lim.sag(s1), lim.t, lim.at(s2), lim.sag(s2), 0.2 * lim.len);
  }
  for (let k = 0; k < (lod ? 5 : 10); k++) {
    const t1 = 0.2 + (lod ? 0.15 : 0.075) * k + rng.range(0, 0.01), t2 = t1 + (lod ? 0.14 : 0.07), r1 = radAt(t1) * 0.7, r2 = radAt(t2) * 0.7;
    comb(t1, wob(t1).add(v3(r1, 0, 0)), v3(), t2, wob(t2).add(v3(r2, 0, 0)), v3(), (t2 - t1) * L);
  }

  // ---- the curtain sheets: strips from the bowed stem to the snow that the shader fills with falling chips of ice.
  //      Two a metre apart on the near build, so the curtain has depth as the sled passes it.
  for (const zo of (lod ? [0] : [-0.35, 0.95])) {
    let prev = -1; const z = v3(), off = v3(0, 0, zo), n = lod ? 6 : 11;
    for (let i = 0; i <= n; i++) {
      const t = 0.08 + 0.92 * i / n, seed = vi * 7.3 + 1.7 + zo * 13.1;
      const a = gv(t, off, z, z, [t * L, 0, 0, seed], 3);
      gv(t, off, z, z, [t * L, 1, 0, seed], 3);
      if (prev >= 0) G.idx.push(prev, prev + 1, a, prev + 1, a + 1, a);
      prev = a;
    }
  }

  const f32 = (a) => new THREE.Float32BufferAttribute(a, 3);
  const bark = new THREE.BufferGeometry();
  bark.setAttribute('position', f32(B.pos)); bark.setAttribute('aAtt', new THREE.Float32BufferAttribute(B.att, 1));
  bark.setAttribute('aLimb', f32(B.limb)); bark.setAttribute('aHang', f32(B.hang)); bark.setAttribute('normal', f32(B.nrm));
  bark.setAttribute('aTone', new THREE.Float32BufferAttribute(B.tone, 1)); bark.setIndex(B.idx);
  const glass = new THREE.BufferGeometry();
  glass.setAttribute('position', f32(G.pos)); glass.setAttribute('aAtt', new THREE.Float32BufferAttribute(G.att, 1));
  glass.setAttribute('aLimb', f32(G.limb)); glass.setAttribute('aTwig', f32(G.twig)); glass.setAttribute('aHang', f32(G.hang));
  glass.setAttribute('aCard', new THREE.Float32BufferAttribute(G.card, 4)); glass.setAttribute('aKind', new THREE.Float32BufferAttribute(G.kind, 1));
  glass.setIndex(G.idx);
  return { L, bark, glass, limbs, cardW: wK, tris: (B.idx.length + G.idx.length) / 3 };
}

// ------------------------------------------------------------------------------------------------
// GLSL shared by every material of the piece
// ------------------------------------------------------------------------------------------------
const GL_COMMON = /* glsl */`
  uniform float uT, uTime, uFront, uRidge, uWind, uLitAll, uSkew, uPre, uA0;
  uniform vec3 uSun, uSunCol, uSkyCol, uDeep;
  float hash1(float n) { return fract(sin(n * 12.9898 + 1.37) * 43758.5453); }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  // how much direct sun reaches height h above the snow at arcade distance arc: the ridge shadow's edge
  // rises ahead of the light front, so the vault's ridge is lit long before the floor is
  float litAt(float arc, float h) {
    float hs = min((arc - uFront) * 0.45, uRidge);
    return max(max(smoothstep(hs - 1.6, hs + 1.6, h), uLitAll), 1.0 - smoothstep(uPre - 22.0, uPre, arc));
  }
`;
const GL_FOG_V = /* glsl */`
  #include <fog_pars_vertex>
`;
const GL_FOG_F = /* glsl */`
  #include <fog_pars_fragment>
  float fogAmt() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }
  vec3 fogCol() {
    #ifdef USE_FOG
      return fogColor;
    #else
      return vec3(0.0);
    #endif
  }
`;
// the bend: stem point by a 6-step integral of an angle that tightens toward the top; age drives the release
const GL_TREE_V = /* glsl */`
  attribute float aAtt;
  attribute vec3 aLimb, aHang;
  attribute vec4 aInst;                      // bow, time the light touches it, arcade distance, seed
  attribute vec4 aInst2;                     // distance from the foot to the sled's corridor along the bend, clearance height (tree units), seconds the whip waits (heralds),
                                             // w: seconds the burst takes to run from base to tip beyond the usual 0.35 (> 0: a tree that sheds slowly, in separate falls)
  uniform float uLen, uThetaMax;
  vec2 stemPoint(float t, float th) {
    vec2 p = vec2(0.0); float dt = t / 6.0;
    for (int i = 0; i < 6; i++) { float s = (float(i) + 0.5) * dt; float ph = th * s * (0.45 + 0.55 * s); p += vec2(sin(ph), cos(ph)); }
    return p * dt * uLen;
  }
  // the sheath bursts base to tip 0.8 s after the light arrives; the stem then springs to 3/4 upright and rocks at 0.6 Hz
  float treeTheta(float age) {
    float qs = max(age - 0.95 - aInst2.z, 0.0);
    float settle = exp(-qs * qs * 5.5);                                      // lets go slowly, then whips: mid-whip lasts 0.7 s
    float rock = 0.19 * sin(3.77 * qs) * exp(-qs * 0.5) * smoothstep(0.25, 0.8, qs);
    float sway = uWind * (0.022 * sin(uTime * 0.9 + aInst.w * 6.28) + 0.012 * sin(uTime * 1.73 + aInst.z * 0.13));
    return uThetaMax * aInst.x * (0.25 + 0.75 * settle - rock) + sway * (1.0 + 3.2 * (1.0 - settle));
  }
  float hangK(float qb) {                    // 1 = hanging under ice, 0 = sprung back (with a little overshoot)
    float q = max(qb, 0.0);
    return clamp(exp(-q * 3.6) * cos(q * 8.0), -0.22, 1.0);
  }
  vec3 turnZ(vec3 v, float c, float s) { return vec3(v.x * c + v.y * s, -v.x * s + v.y * c, v.z); }
`;

const BARK_V = GL_COMMON + GL_TREE_V + GL_FOG_V + /* glsl */`
  attribute float aTone;
  varying vec3 vN, vW, vObj;
  varying float vTone, vIce, vArc, vH;
  void main() {
    float age = uT - aInst.y;
    float qb = age - 0.8 - (0.35 + aInst2.w) * aAtt;
    float th = treeTheta(age);
    float ph = th * aAtt * (0.45 + 0.55 * aAtt), c = cos(ph), s = sin(ph);
    vec3 P = vec3(stemPoint(aAtt, th), 0.0) + turnZ(aLimb, c, s) + aHang * hangK(qb);
    vec4 ip = instanceMatrix * vec4(P, 1.0);
    vec4 wp = modelMatrix * ip;
    vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * turnZ(normal, c, s)));
    vW = wp.xyz; vObj = position; vTone = aTone; vArc = aInst.z;
    vIce = 1.0 - smoothstep(0.0, 0.07, qb);
    vH = ip.y - instanceMatrix[3].y;
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    #ifdef USE_FOG
      vFogDepth = -mv.z;
    #endif
  }
`;
const BARK_F = GL_COMMON + GL_FOG_F + /* glsl */`
  uniform vec3 uBark, uTwigCol;
  varying vec3 vN, vW, vObj;
  varying float vTone, vIce, vArc, vH;
  void main() {
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
    vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
    // paper-birch bark: chalk white, fine lenticel dashes, black chevrons at old branch scars, a darker rough foot
    float ang = atan(vObj.z, vObj.x + 1e-5) * 0.159155 + 0.5;
    float y = vObj.y;
    vec2 lc = vec2(ang * 9.0, y * 26.0); vec2 li = floor(lc), lf = fract(lc);
    float dash = step(0.62, hash2(li)) * (1.0 - smoothstep(0.36, 0.5, abs(lf.y - 0.5) * 2.2 + 0.2 * step(0.9, abs(lf.x - 0.5) * 2.0)));
    vec2 cc = vec2(ang * 3.0 + floor(y * 0.9) * 0.37, y * 0.9); vec2 ci = floor(cc), cf = fract(cc) - 0.5;
    float hv = hash2(ci + 7.3);
    float chev = step(0.42, hv) * (1.0 - smoothstep(0.03, 0.075, abs(cf.y - 0.1 + abs(cf.x) * 0.55))) * (1.0 - smoothstep(0.25, 0.42, abs(cf.x)));
    float eye = step(0.42, hv) * (1.0 - smoothstep(0.03, 0.1, length(cf * vec2(1.0, 2.2) - vec2(0.0, 0.3))));
    float foot = (1.0 - smoothstep(0.0, 1.6, y)) * (0.45 + 0.55 * hash2(floor(vec2(ang * 14.0, y * 5.0))));
    float ptch = 0.5 + 0.5 * sin(y * 1.7 + ang * 6.28 + sin(y * 0.6) * 2.0);
    vec3 alb = uBark * (0.86 + 0.14 * ptch);
    alb = mix(alb, uBark * vec3(1.0, 0.9, 0.84), 0.25 * (1.0 - ptch));           // peeled, pinker underbark
    // peeling curls: a strip of paper lifting, its lip bright, a thin shadow under it
    vec2 qc = vec2(ang * 5.0 + floor(y * 3.1) * 0.61, y * 3.1); vec2 qi = floor(qc), qf = fract(qc);
    float hq = hash2(qi + 2.7);
    float curlOn = step(0.5, hq) * smoothstep(0.06, 0.2, qf.x) * (1.0 - smoothstep(0.55 + 0.3 * hq, 0.95, qf.x)) * (1.0 - vTone);
    float cdy = (qf.y - 0.3 - 0.4 * hq) / 3.1 + 0.02 * sin(qf.x * 9.0 + hq * 20.0);
    alb = mix(alb, vec3(0.05, 0.045, 0.06), curlOn * (1.0 - smoothstep(0.0, 0.016, abs(cdy + 0.014))) * 0.75);
    alb += uBark * vec3(0.22, 0.16, 0.12) * curlOn * (1.0 - smoothstep(0.0, 0.012, abs(cdy - 0.004)));
    alb = mix(alb, vec3(0.035, 0.03, 0.04), max(max(chev, eye), max(dash * 0.55, foot * 0.6)) * (1.0 - vTone));
    alb = mix(alb, uTwigCol, vTone);
    float lit = litAt(vArc, vH);
    float ndl = dot(N, uSun);
    float wrap = clamp(ndl * 0.85 + 0.15, 0.0, 1.0);
    float ao = 0.55 + 0.45 * smoothstep(0.0, 4.0, vH);
    vec3 fill = mix(uDeep * 1.5, uSkyCol, (0.35 + 0.65 * (N.y * 0.5 + 0.5)) * ao);
    vec3 col = alb * (uSunCol * lit * wrap * mix(1.0, 0.62, vIce) + fill);
    float mark = max(max(chev, eye), max(dash * 0.55, foot * 0.6)) * (1.0 - vTone);
    // the glaze: a clear coat with one hard line of sun, a sky rim, and fire along the edge when back-lit
    vec3 Hh = normalize(uSun + V + vec3(0.0, 1e-4, 0.0));
    float ndh = max(dot(N, Hh), 0.0);
    float fres = 1.0 - max(dot(N, V), 0.0); fres = fres * fres * fres;
    float back = max(dot(-V, uSun), 0.0);
    float glaze = vIce;
    col *= mix(1.0, 0.8, glaze);                                                    // wet-dark under clear ice
    col += glaze * (uSunCol * lit * (pow(ndh, 220.0) * 6.0 + pow(ndh, 28.0) * 0.07 * (1.0 - mark) + min(fres * back * back * 2.5, 0.7)) + uSkyCol * fres * 1.3 * (1.0 - 0.6 * mark));
    col += (1.0 - glaze) * alb * uSunCol * lit * 0.12;                              // freed bark is chalk-bright
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), 1.0);
  }
`;

// twig sprays (kind 1), icicle combs (kind 2) and the falling-glitter sheet (kind 3): premultiplied alpha, no depth write
const GLASS_V = GL_COMMON + GL_TREE_V + GL_FOG_V + /* glsl */`
  attribute vec3 aTwig;
  attribute vec4 aCard;
  attribute float aKind;
  varying vec3 vW;
  varying vec4 vCard;
  varying vec4 vS;                          // kind, ice (0..1), age, drop below the stem (sheet)
  varying vec3 vA;                          // arcade distance, height above the snow, column height (sheet)
  varying float vCz;                        // sheet: metres from the middle of the sled's corridor
  varying float vRag;                       // sheet: this tree sheds slowly, in separate falls (seconds from base to tip)
  void main() {
    vCz = 9.0; vRag = aInst2.w;
    float age = uT - aInst.y;
    float qb = age - 0.8 - (0.35 + aInst2.w) * aAtt;
    vec3 P; float drop = 0.0, colH = 0.0;
    if (aKind > 2.5) {                       // the sheet hangs from where the stem WAS when it let go
      vec2 C = stemPoint(aAtt, uThetaMax * aInst.x);
      colH = C.y; drop = aCard.y * C.y;
      P = vec3(C.x, C.y - drop, aLimb.z);
      vCz = C.x - aInst2.x;
    } else {
      float th = treeTheta(age);
      float ph = th * aAtt * (0.45 + 0.55 * aAtt), c = cos(ph), s = sin(ph);
      float hk = hangK(qb);
      float along = aCard.y * step(aKind, 1.5);
      vec3 sway = vec3(sin(uTime * 1.3 + aCard.w + along * 0.7), 0.0, cos(uTime * 1.07 + aCard.w * 1.7 + along * 0.5)) * (0.035 * uWind * along);
      P = vec3(stemPoint(aAtt, th), 0.0) + turnZ(aLimb, c, s) + mix(turnZ(aTwig, c, s), aHang, hk) + sway;
      // nothing of glass may hang into the sled's corridor (the eye passes 5.5 to 7.5 m from the foot, 1.7 m up)
      float cz = smoothstep(aInst2.x - 4.1, aInst2.x - 2.9, P.x) * (1.0 - smoothstep(aInst2.x + 3.3, aInst2.x + 4.5, P.x));
      P.y = max(P.y, mix(-60.0, aInst2.y, cz));
    }
    vec4 ip = instanceMatrix * vec4(P, 1.0);
    vec4 wp = modelMatrix * ip;
    vW = wp.xyz; vCard = aCard;
    float iceOn = 1.0 - smoothstep(0.0, 0.07, qb);
    vS = vec4(aKind, iceOn, age, drop);
    vA = vec3(aInst.z, ip.y - instanceMatrix[3].y, colH);
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    #ifdef USE_FOG
      vFogDepth = -mv.z;
    #endif
  }
`;
const GLASS_F = GL_COMMON + GL_FOG_F + /* glsl */`
  uniform vec3 uTwigCol, uIceTint;
  uniform float uGlaze, uGlint, uLen, uCardW, uCurt, uFull;
  varying vec3 vW;
  varying vec4 vCard;
  varying vec4 vS;
  varying vec3 vA;
  varying float vCz;
  varying float vRag;
  // one layer of falling ice. p = (metres along the stem, seconds after the burst that this ice let go), v = its speed
  // here, px = metres per pixel. Chips keep their size in metres whatever the speed; returns (cover, flash).
  vec2 chipLayer(vec2 p, float v, float px, float cw, float dr, float fill, float s0, float s1, float seed) {
    float row = floor(p.y / dr);
    p.x += hash1(row * 7.1 + seed) * cw;
    vec2 g = vec2(p.x / cw, p.y / dr), id = floor(g), f = fract(g) - 0.5;
    float h = hash2(id + seed), h2 = hash2(id * 1.7 + seed + 3.1);
    vec2 cell = vec2(cw, dr * v);
    vec2 m = f * cell - (vec2(hash1(h * 31.0), hash1(h * 57.0)) - 0.5) * cell * 0.5;
    float sz = mix(s0, s1, h2 * h2);
    float a0 = h * 40.0 + uT * (3.0 + 8.0 * h2) * (h > 0.5 ? 1.0 : -1.0);
    float d = dot(m, vec2(cos(a0), sin(a0))) - sz * 0.42;
    d = max(d, dot(m, vec2(cos(a0 + 2.3), sin(a0 + 2.3))) - sz * 0.5);
    d = max(d, dot(m, vec2(cos(a0 + 4.1), sin(a0 + 4.1))) - sz * 0.34);
    float aa = max(px, 0.004);
    float cov = (1.0 - smoothstep(-aa, aa, d)) * step(h, fill);
    float avg = fill * clamp(sz * sz * 0.8 / max(cell.x * cell.y, 1e-4), 0.0, 1.0);
    float farK = smoothstep(0.45, 1.4, px / sz);
    cov = mix(cov, avg, farK);                                                 // sub-pixel: the same light, spread
    float tw = hash2(id * 1.37 + floor(uT * 12.0 + h * 8.0));
    // far off the glitter is drawn in square cells of its own (a tall falling cell would flash as a vertical dash)
    float sub = floor((f.y + 0.5) * max(1.0, floor(cell.y / cell.x + 0.5)));
    float tw2 = hash2(id * 1.37 + sub * 3.7 + floor(uT * 12.0 + h * 8.0 + sub * 1.3));
    tw = mix(tw, tw2, farK);
    tw *= tw; tw *= tw; tw *= tw;
    return vec2(cov, cov * tw * mix(1.0, 2.4, farK));
  }
  void main() {
    vec3 Vv = cameraPosition - vW;
    float dist = length(Vv);
    vec3 V = Vv / max(dist, 1e-3);
    float lit = litAt(vA.x, vA.y);
    float back = max(dot(-V, uSun), 0.0);
    float fa = fogAmt();
    vec3 rgb = vec3(0.0); float alpha = 0.0;
    vec2 c = vCard.xy;
    vec2 dx = dFdx(c), dy = dFdy(c);
    vec3 Px = dFdx(vW), Py = dFdy(vW);
    if (vS.x < 1.5) {
      // ---------------- twig spray: a dark twig with side shoots inside a clear sheath; bare and red-brown once freed
      float len = vCard.z, seed = vCard.w, iceOn = vS.y, bare = 1.0 - iceOn, ice = mix(0.5, 1.0, iceOn);
      float mpp = max(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))) + 1e-5;
      float det = dx.x * dy.y - dx.y * dy.x; det = abs(det) < 1e-9 ? 1e-9 : det;
      vec3 T = (Py * dx.x - Px * dy.x) / det; T = T / max(length(T), 1e-5);
      vec3 S = (Px * dy.y - Py * dx.y) / det; S = S / max(length(S), 1e-5);
      float covC = 0.0, covS = 0.0, sAcr = 1.0, slope = 0.0;
      float kq = c.y / max(len, 0.1);
      float ax = 0.05 * sin(c.y * 2.1 + seed) * kq;
      float thick = 1.0 + 0.8 * bare;
      {
        float rc = mix(0.009, 0.004, kq) * thick, rs = rc + uGlaze * ice;
        float d = abs(c.x - ax);
        float hwC = max(rc, 0.62 * mpp), hwS = max(rs, 0.75 * mpp);
        covC = clamp((hwC - d) / mpp + 0.5, 0.0, 1.0) * max(rc / hwC, mix(0.3, 0.6, bare));
        covS = clamp((hwS - d) / mpp + 0.5, 0.0, 1.0) * (rs / hwS);
        sAcr = (c.x - ax) / hwS;
      }
      for (int i = 0; i < 9; i++) {
        float fi = float(i);
        float h1 = hash1(seed + fi * 3.1), h2 = hash1(seed * 1.7 + fi * 5.3);
        float yk = len * (0.05 + 0.095 * fi + 0.05 * h1);
        float sg = hash1(seed * 2.3 + fi * 7.7) > 0.5 ? 1.0 : -1.0;
        float m = sg * (0.16 + 0.42 * h2) * uCardW;
        float lk = (0.25 + 1.0 * h2 * h2 + 0.3 * h1) * min(1.0, len * 0.5);
        float yy = c.y - yk;
        float inside = step(0.0, yy) * step(yy, lk);
        float xl = 0.05 * sin(yk * 2.1 + seed) * yk / max(len, 0.1) + m * yy * (1.0 - 0.45 * yy / max(lk, 0.05));
        float d = abs(c.x - xl) / sqrt(1.0 + m * m * 0.5) + (1.0 - inside) * 10.0;
        float rc = mix(0.005, 0.0025, yy / max(lk, 0.05)) * thick, rs = rc + uGlaze * 0.8 * ice;
        float hwC = max(rc, 0.62 * mpp), hwS = max(rs, 0.75 * mpp);
        covC = max(covC, clamp((hwC - d) / mpp + 0.5, 0.0, 1.0) * max(rc / hwC, mix(0.2, 0.45, bare)));
        float cs = clamp((hwS - d) / mpp + 0.5, 0.0, 1.0) * (rs / hwS);
        if (cs > covS) { covS = cs; sAcr = (c.x - xl) / hwS; slope = m * 0.6; }
      }
      covS *= ice;
      // the finest twigs, too thin to draw one by one: a streaked haze that fills the crown from a distance
      float hwc = (0.4 + 0.09 * len) * uCardW;
      float fan = (1.0 - smoothstep(0.3, 1.0, abs(c.x) / (hwc * (0.3 + 0.7 * kq)))) * smoothstep(0.03, 0.22, kq) * (1.0 - smoothstep(0.72, 1.0, kq));
      float fine = 0.5 + 0.5 * sin(c.x / (0.05 + 0.12 * c.y) * 9.0 + seed * 5.0);
      fine = mix(0.25 + 0.75 * fine, 0.62, smoothstep(0.03, 0.09, mpp));
      float wash = fan * fine * smoothstep(0.01, 0.04, mpp) * mix(0.1, 0.27, bare);
      if (covC + covS + wash < 0.004) discard;
      vec3 Tl = T + S * slope; Tl = Tl / max(length(Tl), 1e-4);
      vec3 Hh = normalize(uSun + V + vec3(0.0, 1e-4, 0.0));
      float th = dot(Tl, Hh);
      float kk = pow(sqrt(max(1.0 - th * th, 0.0)), 46.0);                  // highlight ring of a thin cylinder
      float resolved = clamp(uGlaze / mpp - 0.6, 0.0, 1.0);
      float s0 = 0.45 * (dot(S, uSun) > 0.0 ? 1.0 : -1.0);
      float sa = clamp(sAcr, -1.0, 1.0);
      float prof = mix(0.3, 2.2 * exp(-(sa - s0) * (sa - s0) * 22.0), resolved);
      float rim = smoothstep(0.45, 1.0, abs(sa)) * resolved;
      float wav = 0.5 + 0.5 * sin(c.y * 31.0 + 2.6 * sin(c.y * 8.3 + seed * 1.7 + slope * 9.0) + seed * 3.0 + slope * 40.0 + dot(V, Tl) * 55.0 + uTime * 0.7);
      wav *= wav; wav *= wav; wav *= wav;
      float spk = mix(wav * 4.2, 0.62, smoothstep(0.03, 0.09, mpp));                 // beads of fire that crawl as the eye moves; averaged far off
      vec3 amb = mix(uDeep * 1.4, uSkyCol, 0.75);
      vec3 coreCol = uTwigCol * (amb + uSunCol * lit * mix(0.4, 0.75, bare));
      vec3 body = uIceTint * (uSkyCol * (0.45 + 0.8 * rim) + uSunCol * lit * (0.06 + 0.4 * rim * back));
      float aB = 0.1 + 0.42 * rim + 0.08 * (1.0 - resolved);
      float gK = uGlint * mix(1.2, 1.0, iceOn) * mix(0.34, 1.0, smoothstep(4.0, 17.0, dist));   // a crown passed at arm's length glitters, it does not white out the frame                                      // half the sheath is left: the freed crown still glitters
      vec3 glint = uSunCol * lit * gK * (kk * prof * (0.3 + 1.1 * spk) + back * back * back * (0.3 + 0.6 * rim + 0.6 * spk) * mix(0.4, 1.0, smoothstep(8.0, 30.0, dist)))
                 + uSkyCol * kk * prof * 0.35;
      rgb = coreCol * covC + (body * aB + glint) * covS * (1.0 - 0.85 * covC);
      alpha = covC + covS * aB * (1.0 - covC);
      vec3 washCol = mix(uIceTint * (uSkyCol * 0.55 + uSunCol * lit * (0.12 + 0.3 * back)), uTwigCol * (amb + uSunCol * lit * 0.6), 0.35 + 0.65 * bare);
      rgb += washCol * wash * (1.0 - alpha);
      alpha += wash * (1.0 - alpha);
      vec2 gcell = floor(c * 24.0);                                                  // beads of glaze still clinging: points of fire in the crown
      float gsp = step(0.972, hash2(gcell + seed + floor(dot(V, vec3(19.0, 7.0, 13.0)) * 5.0 + hash2(gcell) * 6.0)));
      rgb += uSunCol * lit * uGlint * gsp * fan * (0.5 + 1.6 * back * back) * (0.35 + 0.65 * bare) * (1.0 - smoothstep(0.05, 0.11, mpp));
      rgb = mix(rgb, fogCol() * alpha, fa);
    } else if (vS.x < 2.5) {
      // ---------------- icicle comb: a row of tapered clear teeth
      float n = c.x * 21.0;
      float fw = (abs(dx.x) + abs(dy.x)) * 21.0 + 1e-4;
      float id = floor(n), f = fract(n) - 0.5;
      float tl = 0.22 + 0.78 * hash1(id * 1.3 + vCard.w);
      float w = 0.36 * clamp(1.0 - c.y / tl, 0.0, 1.0);
      float cov = clamp((w - abs(f)) / fw + 0.5, 0.0, 1.0) * step(c.y, tl) * min(1.0, 0.7 / fw + 0.3);
      cov = max(cov, (1.0 - smoothstep(0.0, 0.1, c.y)) * 0.8) * vS.y;                 // the glazed underside they hang from
      if (cov < 0.004) discard;
      float edge = smoothstep(0.3, 1.0, abs(f) / max(w, 0.02));
      float core = exp(-f * f / max(w * w * 0.12, 1e-4));
      vec3 body = uIceTint * (uSkyCol * (0.6 + 0.7 * edge) + uSunCol * lit * 0.2);
      vec3 gl = uSunCol * lit * uGlint * (core * (0.5 + 1.6 * back * back) + edge * back * 0.8);
      float aB = 0.3 + 0.4 * edge;
      rgb = (body * aB + gl) * cov; alpha = cov * aB;
      rgb = mix(rgb, fogCol() * alpha, fa);
    } else {
      // ---------------- curtain: at every point of the sheet, the ice that let go (r) seconds after the burst is passing.
      // Plates and chips that keep their size as they speed up, a veil of ice dust behind them, powder where they land.
      float sT = c.x / max(uLen, 1.0);
      float q = vS.z - 0.8 - (0.35 + vRag) * sT;                                // seconds since this part of the stem burst
      float drop = max(vS.w, 0.0);
      float tau = sqrt(drop * 0.2174);                                         // fall time from the stem to here, g = 9.2
      float colJ = hash1(floor(c.x * 2.6) * 1.7 + vCard.w);                     // every foot of stem lets go at its own moment
      float own = smoothstep(1.0, 10.0, vA.x - uFront);
      float slow = step(0.01, vRag);
      // full: a curtain that is there to be looked at: a herald's, a slow tree's, and every tree's while the eye stands
      // outside the arcade and sees the wave from the side (uFull). Inside the vault the sheets stay thin.
      float seen = max(slow, uFull) * (1.0 - own);
      float full = max(own, seen);
      float hk = full * (1.1 - 0.6 * slow) * hash1(floor(c.x * 0.9 + 0.37 * vCard.w) * 5.3 + vCard.w * 1.3);   // hanks a metre wide, each let go at its own moment: a jagged top, never a slab
      float r = q - tau - 0.3 * colJ - hk;
      if (r < 0.0 || r > 3.4) discard;
      float v = 9.2 * tau + 0.7;
      // a herald lets go ahead of the light front, in the blue of the nave: its ice keeps coming for two seconds and
      // falls as one pale hanging curtain, lit by the sky and by the ice dust itself, rose only above the shadow line
      float rate = smoothstep(0.0, 0.05, r) * (1.0 - smoothstep(mix(mix(0.32, 0.7, full), 1.2, slow), mix(mix(1.0, 1.55, full), 2.8, slow), r)) + 0.045 * (1.0 - smoothstep(1.0, 3.4, r));
      // such a sheet is ragged: it falls in separate hanks with the wood showing between them, never as one slab
      float hank = 0.5 + 0.5 * sin(c.x * 1.7 + vCard.w * 3.0) * sin(c.x * 0.73 + vCard.w * 7.0 + 1.0) + 0.3 * (hash1(floor(c.x * 1.1) * 3.7 + vCard.w) - 0.5);
      float rag = mix(1.0, smoothstep(0.4 + 0.1 * seen, 0.66 + 0.06 * seen, hank + 0.12 * sin(drop * 1.9 + c.x * 2.3)), full);
      float px = max(length(Px), length(Py)) + 1e-4;
      vec3 nS = cross(Px, Py);
      float facing = abs(dot(nS / max(length(nS), 1e-9), V));                   // a sheet seen edge-on would be a rack of vertical dashes: it fades out instead
      vec2 pc = vec2(c.x, r);
      // seen whole from outside the ribs the fall is plates of ice a hand and more across, leading; the dust only trails them
      vec2 c1 = chipLayer(pc, v, px, mix(0.26, 0.46, seen), mix(0.034, 0.06, seen), 0.62, mix(0.07, 0.15, seen), mix(0.17, 0.38, seen), vCard.w);
      vec2 c2 = chipLayer(pc + vec2(0.13, 0.011), v, px, 0.11, 0.019, 0.74, 0.03, mix(0.075, 0.1, seen), vCard.w + 5.7);
      float lead = 1.0 - smoothstep(0.25, 1.1, r);                              // the big plates come first
      float cA = clamp(c1.x * mix(1.0, 0.45 + 0.75 * lead, seen) + c2.x * (1.0 - c1.x), 0.0, 1.0) * rate * mix(0.6, mix(0.85, 1.0, seen), full) * (0.35 + 0.65 * rag);
      float fl = (c1.y + c2.y * 0.8) * rate * smoothstep(0.3, 0.7, facing) * (1.0 - 0.6 * seen);
      float vn = 0.5 + 0.5 * sin(c.x * 3.1 + r * 9.0 + vCard.w) * sin(c.x * 7.7 - r * 4.0 + 1.3);
      float veil = rate * (0.04 + 0.05 * vn) * (1.0 - 0.45 * smoothstep(0.0, 9.0, drop)) * (1.0 - 0.5 * seen);
      float strand = 0.5 + 0.5 * sin(c.x * 17.0 + 2.6 * sin(c.x * 4.3 + vCard.w) + r * 2.5);          // the curtain hangs in strands
      float gr = hash2(floor(vec2(c.x * 5.0, drop * 5.0 - uT * 23.0)) + vCard.w);                     // falling grains, a hand across
      veil += full * rate * rag * (0.12 + 0.5 * strand * (0.45 + 0.55 * vn)) * (0.4 + 1.2 * gr * gr) * mix(1.0, 0.05 + 0.1 * smoothstep(0.5, 1.6, r), seen);          // fine ice fills each hank between the stem and the chips (from outside: a thin trail behind the plates)
      float foot = mix(1.0, smoothstep(0.0, 0.75 + 0.5 * vn, vA.y), full);      // its foot dissolves: no straight line on the snow, the burst carries the landing
      // a slow tree's ice comes down in three or four separate falls a stride wide, bare stem between them
      float falls = mix(1.0, smoothstep(0.42, 0.62, 0.5 + 0.5 * sin(c.x * 2.6 + 0.6) + 0.1 * sin(drop * 1.3 + c.x * 5.0)), slow);
      cA *= foot * falls; veil *= foot * falls; fl *= falls * (1.0 - 0.5 * slow);
      float pg = q - sqrt(max(vA.z, 0.0) * 0.2174) - 0.3 * colJ - hk;                 // seconds since the first ice reached the snow below
      float burst = exp(-max(vA.y, 0.0) * 1.3) * smoothstep(0.0, 0.15, pg) * exp(-max(pg, 0.0) * 0.9) * (0.55 + 0.45 * vn);
      float aV = clamp(veil + 0.4 * burst * (1.0 - 0.35 * full) * (1.0 - 0.5 * seen), 0.0, mix(0.5 + 0.12 * full, 0.13, seen));   // from outside: no gauze, the plates carry the fall
      // a full curtain thins as the flight comes up to it: its sparkle never fills a side of the frame (a herald from 19 m,
      // the wave seen from outside from 14 m, the slow tree the flight passes under from 8 m)
      float nfLo = mix(mix(2.0, mix(4.0, 5.0, own), full), 2.5, slow), nfHi = mix(mix(7.5, mix(14.0, 19.0, own), full), 8.0, slow);
      float nearFade = smoothstep(nfLo, nfHi, dist);
      float ends = smoothstep(mix(mix(0.08, 0.05, full), 0.03, slow), mix(mix(0.2, 0.45, full), 0.16, slow), sT) * (1.0 - smoothstep(mix(mix(0.93, 0.68, full), 0.82, slow), 1.0, sT));
      // thin over the track itself (the way ahead stays open; a slow tree drops nothing at all on the flight line under it), thin far off (sheets pile up down the avenue), thin on the flank trees
      float k = mix(mix(uCurt, 1.0, smoothstep(16.0, 40.0, dist)), 1.0, full) * nearFade * ends * (1.0 - fa) * mix(mix(mix(0.3, 0.8, full), 0.0, slow), 1.0, smoothstep(1.3 + 0.1 * slow, 3.8 - 0.6 * slow, abs(vCz))) / (1.0 + dist * 0.022 * (1.0 - 0.6 * full)) * (uCardW > 1.2 ? 0.4 : 1.0)
              * smoothstep(0.12, 0.45, facing) * (1.0 - 0.65 * seen * smoothstep(38.0, 80.0, dist));
      vec3 Ls = uSunCol * lit * mix(vec3(1.0), vec3(1.06, 0.76, 0.58), seen);          // seen whole, the falling plates are the warmest thing in the frame
      // seen from the sun's side the falling ice takes the sun's colour and stands brighter than the snow behind it
      vec3 bodyC = uIceTint * (uSkyCol * mix(0.85, 0.2, seen) + Ls * (mix(0.12, 0.5, seen) + 0.3 * back * (1.0 - 0.5 * seen)));
      vec3 dustC = uSkyCol * mix(0.75, 0.16, seen) + Ls * (mix(0.3, 0.5, seen) + 0.4 * back * (1.0 - 0.6 * seen));
      vec3 flashC = Ls * (3.2 + 7.0 * back * (1.0 - 0.7 * seen)) + uSkyCol * 1.4 * (1.0 - 0.6 * seen);
      vec3 pale = uIceTint * (uSkyCol * 0.5 + 0.62) * own * (1.0 - 0.5 * lit) * (1.0 - 0.4 * uLitAll);
      bodyC += pale; dustC += pale; flashC += pale * 6.0;
      alpha = (cA + aV * (1.0 - cA)) * k;
      rgb = (bodyC * cA + dustC * aV * (1.0 - cA) + flashC * fl * uGlint) * k;
    }
    gl_FragColor = vec4(rgb, alpha);
  }
`;
// shards (falling, bouncing, lying as litter) and diamond dust: one draw of instanced camera-facing chips
const SHARD_V = GL_COMMON + GL_FOG_V + /* glsl */`
  attribute vec4 aP0;                        // start point (local), w = snow height where it lands
  attribute vec4 aV;                         // drift x, drift z, release time, seed
  attribute vec4 aM;                         // arcade distance, size (m), restitution (< 0: diamond dust), spin
  uniform float uPx;                         // metres per pixel at 1 m
  varying vec2 vUv;
  varying vec4 vP;                           // spin angle, seed, lit, energy
  varying vec3 vNv;                          // facet normal (world)
  varying vec3 vW;
  varying float vOwn;                        // ice in flight ahead of the light front (a herald's): pale of its own
  void main() {
    float seed = aV.w;
    float q = clamp(uT - aV.z, -1.0, 60.0);
    vec3 p = aP0.xyz; float show = step(0.0, q), ang, hAbove;
    if (aM.z < 0.0) {                        // diamond dust: sifts down for ever, thicker once the ice has let go
      float fall = uTime * (0.25 + 0.3 * seed);
      float span = 10.5;
      hAbove = mod(aP0.y - aP0.w - fall, span);
      p.y = aP0.w + hAbove + 0.2;
      p.x += sin(uTime * 0.6 + seed * 40.0) * 0.35; p.z += cos(uTime * 0.47 + seed * 23.0) * 0.35;
      show = (0.3 + 0.7 * smoothstep(0.0, 2.5, uT - aV.z) * (1.0 - 0.6 * smoothstep(8.0, 20.0, uT - aV.z))) * smoothstep(0.0, 0.8, hAbove) * (1.0 - smoothstep(span - 1.5, span, hAbove));
      ang = uTime * (1.5 + aM.w) + seed * 50.0;
    } else {
      float g = 9.2, h = max(aP0.y - aP0.w, 0.02), tI = sqrt(2.0 * h / g);
      float qa = min(q, tI);
      p.xz += aV.xy * qa; p.y -= 0.5 * g * qa * qa;
      float q2 = max(q - tI, 0.0);
      float vy = min(aM.z * g * tI, 3.2), tb = 2.0 * vy / g, qb = min(q2, tb);
      vec2 skid = aV.xy * 1.3 + (vec2(hash1(seed * 91.0), hash1(seed * 57.0)) - 0.5) * 2.6;
      p.xz += skid * (1.0 - exp(-2.4 * q2)) / 2.4;
      p.y = max(p.y, aP0.w) + vy * qb - 0.5 * g * qb * qb + 0.02 * step(tI, q);
      hAbove = p.y - aP0.w;
      ang = seed * 40.0 + aM.w * min(q, tI + tb);
    }
    float b = seed * 17.0;
    vec3 n = vec3(sin(ang) * cos(b), cos(ang), sin(ang) * sin(b));
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec4 mv = viewMatrix * wp;
    float d = max(-mv.z, 0.3);
    float size = aM.y, minSize = 1.7 * uPx * d;
    float k = max(size, minSize);
    float energy = clamp(size / k, 0.0, 1.0); energy *= energy;
    mv.xy += position.xy * k * show;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy; vW = wp.xyz; vNv = mat3(modelMatrix) * n;
    vP = vec4(ang * 0.37 + seed * 9.0, seed, litAt(aM.x, hAbove), max(energy, 0.03) * show * (aM.z < 0.0 ? 1.0 : smoothstep(1.2, 4.5, d)));
    vOwn = smoothstep(1.0, 10.0, aM.x - uFront) * step(0.0, aM.z) * (1.0 - smoothstep(2.0, 4.0, q)) * step(0.0, q);
    #ifdef USE_FOG
      vFogDepth = -mv.z;
    #endif
  }
`;
const SHARD_F = GL_COMMON + GL_FOG_F + /* glsl */`
  uniform vec3 uIceTint;
  uniform float uGlint;
  varying vec2 vUv;
  varying vec4 vP;
  varying vec3 vNv;
  varying vec3 vW;
  varying float vOwn;
  void main() {
    float a0 = vP.x, seed = vP.y;
    // an angular chip: three cuts at uneven angles, turned by the spin
    float d = -1.0;
    for (int i = 0; i < 3; i++) {
      float a = a0 + float(i) * 2.094 + (hash1(seed * 13.0 + float(i)) - 0.5) * 0.9;
      d = max(d, dot(vUv, vec2(cos(a), sin(a))) - (0.15 + 0.1 * hash1(seed * 7.0 + float(i))));
    }
    float shape = (1.0 - smoothstep(-0.03, 0.03, d));
    if (shape * vP.w < 0.003) discard;
    vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
    vec3 Hh = normalize(uSun + V + vec3(0.0, 1e-4, 0.0));
    vec3 N = normalize(vNv + vec3(0.0, 1e-4, 0.0));
    float sp = abs(dot(N, Hh)); sp = sp * sp; sp = sp * sp; sp = sp * sp; sp = sp * sp;
    float back = max(dot(-V, uSun), 0.0);
    float lit = vP.z;
    float edge = smoothstep(-0.07, -0.01, d);                                  // a bright bevel round a clear middle
    vec3 body = uIceTint * (uSkyCol * (0.55 + 0.5 * edge) + uSunCol * lit * (0.08 + 0.3 * edge));
    vec3 gl = uSunCol * lit * uGlint * (sp * 4.5 + 0.06 + back * back * back * 1.0) + uSkyCol * sp * 0.8;
    vec3 pale = uIceTint * (uSkyCol * 0.5 + 0.62) * vOwn * (1.0 - 0.5 * lit);
    body += pale * (0.6 + 0.6 * edge); gl += pale * (sp * 3.5 + 0.3);
    float fa = fogAmt();
    float aB = (0.26 + 0.34 * edge) * (1.0 + 0.7 * vOwn) * shape * vP.w;
    gl_FragColor = vec4(mix(body * aB, fogCol() * aB, fa) + gl * shape * vP.w * (1.0 - fa), aB);
  }
`;

// the snow of the arcade floor: packed track, runner grooves, paw prints, sastrugi, sparkle, sliding light front, trunk shadow bars
const FLOOR_V = GL_COMMON + GL_FOG_V + /* glsl */`
  attribute vec2 aUV;
  varying vec2 vUV;
  varying vec3 vW;
  void main() {
    vUV = aUV;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    #ifdef USE_FOG
      vFogDepth = -mv.z;
    #endif
  }
`;
const FLOOR_F = GL_COMMON + GL_FOG_F + /* glsl */`
  uniform sampler2D uShadow;
  uniform vec3 uSnow;
  uniform vec4 uFloor;                       // total length, half width, shadow lateral span, bar contrast
  varying vec2 vUV;
  varying vec3 vW;
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float relief(vec2 p) { return vnoise(p * vec2(0.9, 0.28)) * 0.7 + vnoise(p * vec2(3.1, 1.3) + 9.0) * 0.3; }
  void main() {
    float a = vUV.x, l = vUV.y;
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
    float track = 1.0 - smoothstep(1.25, 1.9, abs(l));
    vec2 p = vW.xz;
    float e = 0.12;
    float h0 = relief(p), hx = relief(p + vec2(e, 0.0)), hz = relief(p + vec2(0.0, e));
    float bump = (1.0 - 0.75 * track) * 0.34;
    vec3 N = normalize(vec3(-(hx - h0) / e * bump, 1.0, -(hz - h0) / e * bump));
    float groove = (1.0 - smoothstep(0.02, 0.07, abs(abs(l) - 0.26))) * 0.5;
    vec2 pc = vec2(a / 0.62, l / 0.24); vec2 pi = floor(pc), pf = fract(pc) - 0.5;
    float paw = (1.0 - smoothstep(0.2, 0.42, length(pf * vec2(1.0, 0.9)))) * step(0.45, hash2(pi)) * step(abs(pi.y + 0.5), 2.6) * (1.0 - smoothstep(0.1, 0.2, abs(abs(l) - 0.26) - 0.02) * 0.0);
    float dent = max(groove, paw * 0.4) * track;
    float bars = texture2D(uShadow, vec2((a + uA0) / uFloor.x, l / uFloor.z + 0.5)).r;
    float age = (uFront - a) / 12.0 - 1.2;
    float canopy = mix(0.5, 0.16, smoothstep(0.0, 1.5, age)) * (0.55 + 0.45 * vnoise(p * 0.23 + 3.0)) * (1.0 - smoothstep(5.0, 13.0, abs(l)));
    float lit = litAt(a - l * uSkew, 0.0) * (1.0 - uFloor.w * bars) * (1.0 - canopy);
    vec3 alb = uSnow * (1.0 - 0.07 * track - 0.22 * dent);
    float ndl = max(dot(N, uSun), 0.0);
    float rl = clamp(0.5 + (N.x + N.z) * 1.6, 0.0, 1.0);
    vec3 fill = mix(uDeep * 1.6, uSkyCol, 0.3 + 0.3 * h0 + 0.4 * rl) * (1.0 - 0.25 * dent);
    vec3 col = alb * (uSunCol * lit * (0.25 + 0.6 * min(ndl, 0.5)) + fill * (0.8 - 0.4 * lit));
    // sparkle: facets that flash as the eye moves; only near, so it never shimmers far off
    vec2 sc = floor(p * 26.0);
    float fl = hash2(sc + floor(dot(V, vec3(31.0, 17.0, 23.0)) + hash2(sc) * 6.0));
    col += (uSunCol * lit * 2.2 + uSkyCol * 0.5) * step(0.993, fl) * (1.0 - smoothstep(6.0, 26.0, dist)) * (0.4 + 0.6 * hash2(sc + 3.0));
    float edge = (1.0 - smoothstep(0.6, 1.0, abs(l) / uFloor.y)) * smoothstep(0.0, 14.0, a + uA0) * (1.0 - smoothstep(uFloor.x - uA0 - 20.0, uFloor.x - uA0, a));
    gl_FragColor = vec4(mix(col, fogCol(), fogAmt()), edge);
  }
`;

// the shared GLSL (uniform block with litAt, fog helpers) for world shaders that must take the same light: use with hero.uniforms
export const HERO_GLSL = { common: GL_COMMON, fogV: GL_FOG_V, fogF: GL_FOG_F };

// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEF_PALETTE).map(lin);
  const hour = { dawn: 'rose', day: 'rose' }[opts.hour] || opts.hour || 'rose';
  const load = opts.load ?? opts.season ?? 'normal';
  const weather = opts.weather || 'clear';
  const LOAD = { normal: { bow: 1, glaze: 0.014, ff: 1.6, shards: 60 }, heavy: { bow: 1.1, glaze: 0.021, ff: 1.25, shards: 70 }, light: { bow: 0.86, glaze: 0.009, ff: 2.0, shards: 44 } }[load] || { bow: 1, glaze: 0.014, ff: 1.6, shards: 60 };
  const side = opts.sunSide ?? (hour === 'golden' ? -1 : 1);                    // +1: sun on the right of travel
  const sunLocal = opts.sunDir ? new THREE.Vector3().copy(opts.sunDir).normalize()
    : hour === 'night' ? new THREE.Vector3(0.78 * side, 0.5, 0.36).normalize()
      : new THREE.Vector3(0.975 * side, hour === 'golden' ? 0.16 : 0.125, 0.19).normalize();
  const sunCol = hour === 'night' ? new THREE.Color('#C9D6FF').multiplyScalar(0.85)
    : hour === 'golden' ? new THREE.Color('#FFB066').multiplyScalar(2.7)
      : pal[1].clone().lerp(pal[2], 0.42).multiplyScalar(2.5);
  const skyCol = pal[3].clone().multiplyScalar(hour === 'night' ? 0.42 : 1.22);
  const deepCol = pal[4].clone().multiplyScalar(hour === 'night' ? 0.45 : 1);
  if (opts.sunColor) sunCol.set(opts.sunColor).multiplyScalar(opts.sunIntensity ?? 2.5);
  const ridgeShadow = opts.ridgeShadow ?? (hour === 'rose');

  // ---- the track's centre line, sampled every metre; a = arcade distance (0 at the mouth)
  const lead = Math.max(0, opts.centerline ? (opts.lead ?? 0) : 0), PAD = 60 + lead, A0 = 30 + lead;
  let arcLen = opts.length ?? 305;
  const TAIL = 10;                                                             // the portal pair stands this far past the last arcade pair
  let cx, cz, total;
  if (opts.centerline && opts.centerline.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(opts.centerline.map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1] || 0, p[2]))), false, 'centripetal');
    curve.arcLengthDivisions = 600; const len = curve.getLength(); arcLen = Math.max(40, len - lead - TAIL); total = Math.round(arcLen + TAIL);
    const n = total + 2 * PAD + 1; cx = new Float32Array(n); cz = new Float32Array(n);
    const p = new THREE.Vector3(), t0 = curve.getTangentAt(0), t1 = curve.getTangentAt(1), p0 = curve.getPointAt(0), p1 = curve.getPointAt(1);
    for (let i = 0; i < n; i++) {
      const a = i - 60;                                                        // distance along the supplied line
      if (a <= 0) p.copy(p0).addScaledVector(t0, a); else if (a >= len) p.copy(p1).addScaledVector(t1, a - len); else curve.getPointAt(a / len, p);
      cx[i] = p.x; cz[i] = p.z;
    }
  } else {
    total = Math.round(arcLen + TAIL);
    const n = total + 2 * PAD + 1; cx = new Float32Array(n); cz = new Float32Array(n);
    const A1 = THREE.MathUtils.degToRad(15) * rng.range(0.6, 1.25) * (opts.mirror ? -1 : 1), A2 = THREE.MathUtils.degToRad(18) * rng.range(0.6, 1.25) * (opts.mirror ? -1 : 1);
    const k = arcLen / 305;
    const head = (a) => -A1 * sstep(8 * k, 75 * k, a) + (A1 + A2) * sstep(75 * k, 165 * k, a);
    let x = 0, z = 0, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = PAD; i < n; i++) { cx[i] = x; cz[i] = z; const h = head(i - PAD + 0.5); x += Math.sin(h); z -= Math.cos(h); }
    for (let i = PAD - 1; i >= 0; i--) { cx[i] = cx[i + 1]; cz[i] = cz[i + 1] + 1; }
    for (let i = PAD; i <= PAD + total; i++) { minX = Math.min(minX, cx[i]); maxX = Math.max(maxX, cx[i]); minZ = Math.min(minZ, cz[i]); maxZ = Math.max(maxZ, cz[i]); }
    const ox = (minX + maxX) / 2, oz = (minZ + maxZ) / 2;
    for (let i = 0; i < n; i++) { cx[i] -= ox; cz[i] -= oz; }
  }
  const NS = cx.length;
  const groundAt = opts.groundAt || (() => 0);
  // point on the line at arcade distance a, shifted lat metres to the right of travel
  const lineAt = (a, lat = 0, out = {}) => {
    const f = Math.min(NS - 1.001, Math.max(0, a + PAD)), i = Math.floor(f), k = f - i;
    let tx = cx[i + 1] - cx[i], tz = cz[i + 1] - cz[i]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    out.x = cx[i] + (cx[i + 1] - cx[i]) * k - tz * lat; out.z = cz[i] + (cz[i + 1] - cz[i]) * k + tx * lat;
    out.tx = tx; out.tz = tz; out.y = groundAt(out.x, out.z);
    return out;
  };
  // arcade distance and signed offset (right of travel positive) of a local point
  const arcOf = (x, z, hint = -1, span = NS) => {
    let best = 1e18, bi = 0;
    const i0 = hint < 0 ? 0 : Math.max(0, Math.floor(hint + PAD - span)), i1 = hint < 0 ? NS - 1 : Math.min(NS - 1, Math.ceil(hint + PAD + span));
    for (let i = i0; i <= i1; i++) { const dx = cx[i] - x, dz = cz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    const j = Math.min(NS - 2, bi), tx = cx[j + 1] - cx[j], tz = cz[j + 1] - cz[j];
    const along = (x - cx[bi]) * tx + (z - cz[bi]) * tz;
    return { arc: bi - PAD + along, lat: -(x - cx[bi]) * tz + (z - cz[bi]) * tx };
  };

  // ---- the timeline. T = seconds; the light front stands at arcade distance 16 T.
  const ff = opts.frontFactor ?? LOAD.ff;                                      // front speed / sled speed
  const passAt = opts.passAt ?? 125 * (arcLen / 305);                          // arcade distance where the wave overtakes the sled
  const pathLength = opts.pathLength ?? 440, arcadeStart = opts.arcadeStart ?? 125;
  // The world may bend the timeline: releaseAt(arc) = the moment the light front reaches that arcade distance,
  // frontAt(T) = its inverse, timeAtCamArc(arc) = the moment the sled is there. Defaults: the brief's straight numbers.
  const relOf = opts.releaseAt || ((a) => a / FRONT_SPEED);
  const frontAt = opts.frontAt || ((t) => FRONT_SPEED * t);
  const timeAtCamArc = opts.timeAtCamArc || ((camA) => (passAt + ff * (camA - passAt)) / FRONT_SPEED);
  const shardBoost = opts.shardBoost || (() => 1);

  // ---- trees
  const variants = [];
  for (let v = 0; v < 5; v++) { variants.push(buildBirch(rng, v, v < 3 ? 0 : 1)); await ctx.yield(); }
  const trees = [];
  const nSt = Math.max(4, Math.round(arcLen / 6.1) + 1);
  const P = {};
  for (let k = 0; k < nSt; k++) for (const sd of [1, -1]) {
    const a = 3 + (k / (nSt - 1)) * (arcLen - 6) + rng.range(-1.5, 1.5), lat = sd * rng.range(6.0, 7.0);
    lineAt(a, lat, P);
    const yaw = rng.gauss() * 0.32 + (sd > 0 ? 0.08 : -0.08);                  // lean a little along the trail as well as across it
    const bx = -sd * -P.tz, bz = -sd * P.tx;                                   // toward the centre line
    const dx = bx * Math.cos(yaw) - bz * Math.sin(yaw), dz = bx * Math.sin(yaw) + bz * Math.cos(yaw);
    let bow = LOAD.bow * rng.range(0.7, 1.08);                                   // ribs of uneven height and lean
    if (load === 'light' && rng.chance(0.5)) bow *= 0.45;
    const tree = { a, lat, side: sd, x: P.x, y: P.y, z: P.z, dx, dz, bow, scale: rng.range(0.84, 1.14), v: rng.int(0, 2), rel: relOf(a) + rng.range(-0.15, 0.15), seed: rng(), corr: Math.abs(lat) };
    if (opts.skip && opts.skip(a, sd * side)) continue;                          // the world's gaps: where its flight leaves and re-enters the arcade
    trees.push(tree);
  }
  // two heralds let go early, ahead of the sled: one on the right, then one on the left (the owl's tree)
  const heralds = [];
  // Each bursts when the sled reaches a fixed place (arc 25 and arc 55), so the tree stands 26 to 36 m ahead while its
  // curtain hangs; the stem holds a second under the falling ice (aInst2.z) and then whips up through the vault.
  const hArc = opts.heraldArc || [75, 100], hCam = opts.heraldCam || [25, 55];
  for (const [sd0, a0, camA, whip] of [[1, hArc[0], hCam[0], 1.0], [-1, hArc[1], hCam[1], 0.85]]) {
    const sd = sd0 * side;
    const want = (a0 + rng.range(-6, 6) * 0.3) * (arcLen / 305);
    let bt = null; for (const t of trees) if (t.side === sd && (!bt || Math.abs(t.a - want) < Math.abs(bt.a - want))) bt = t;
    bt.bow = Math.max(bt.bow, LOAD.bow * 1.02); bt.herald = true; bt.whip = whip; bt.scale = Math.max(bt.scale, 1.0);
    bt.rel = timeAtCamArc(camA * (arcLen / 305)) - 0.8;
    heralds.push(bt);
  }
  // the last pair: bowed over the portal, in the spruces' shade, never released
  // (a gate of two pairs, the outer one a third taller, so the arch stands a quarter of the frame high from 45 m)
  for (const [back, lt, sc, bw] of [[0, 6.4, 1.62, 1.05], [7.5, 6.0, 1.2, 1.0]]) for (const sd of [1, -1]) {
    lineAt(arcLen + TAIL - back, sd * lt, P);
    trees.push({ a: arcLen + TAIL - back, lat: sd * lt, side: sd, x: P.x, y: P.y, z: P.z, dx: -sd * -P.tz, dz: -sd * P.tx, bow: bw, scale: sc, v: (sd > 0 ? 0 : 2) + (back ? 1 : 0) * (sd > 0 ? 1 : -1), rel: 1e6, seed: rng(), portal: true, corr: lt });
  }
  for (const e of opts.extraTrees || []) {                                     // the world's own birches of the same build (arches, open wood)
    const ao = arcOf(e.x, e.z), d = e.dir || [Math.cos(e.yaw || 0), Math.sin(e.yaw || 0)];
    lineAt(ao.arc, 0, P);
    const sgn = Math.sign(ao.lat) || 1, cosA = (d[0] * P.tz - d[1] * P.tx) * sgn;      // how squarely it leans toward the track
    const corr = e.corr ?? (cosA > 0.2 ? Math.abs(ao.lat) / cosA : 1e3);
    trees.push({ a: e.arc ?? ao.arc, lat: ao.lat, side: sgn, x: e.x, y: e.y ?? groundAt(e.x, e.z), z: e.z, dx: d[0], dz: d[1], bow: e.bow ?? 0.9, scale: e.scale ?? 1, v: e.light ? 3 + rng.int(0, 1) : (e.variant ?? rng.int(0, 2)), rel: e.release ?? 1e6, seed: rng(), extra: true, light: !!e.light, corr, clear: e.clear, whip: e.whip || 0, rag: e.rag || 0 });
  }
  await ctx.yield();

  // ---- uniforms shared by every material
  const U = {
    uT: { value: 0 }, uTime: { value: 0 }, uFront: { value: 0 }, uRidge: { value: opts.ridgeHeight ?? 7.4 }, uWind: { value: opts.wind ?? 1 },
    uLitAll: { value: ridgeShadow ? 0 : 1 }, uSkew: { value: 0.35 * side }, uPre: { value: opts.preLit ?? (lead > 0 ? 4 : -1e5) }, uA0: { value: A0 },
    uSun: { value: sunLocal.clone() }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol }, uDeep: { value: deepCol },
    uThetaMax: { value: THETA_MAX }, uGlaze: { value: LOAD.glaze }, uGlint: { value: opts.glint ?? 1 },
    uBark: { value: pal[0].clone().multiplyScalar(0.72) }, uTwigCol: { value: new THREE.Color('#47352f').lerp(pal[4], 0.1) },
    uIceTint: { value: pal[5].clone().lerp(new THREE.Color('#ffffff'), 0.45) }, uSnow: { value: pal[0].clone().multiplyScalar(0.8) },
    uPx: { value: 0.002 }, uCurt: { value: opts.curtain ?? 1 }, uFull: { value: opts.full ?? 0 }, uShadow: { value: null }, uFloor: { value: new THREE.Vector4(total + 30 + A0, opts.floorWidth ?? 46, opts.shadowLat ?? 48, 0.62) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });
  const PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };

  const root = new THREE.Group(); root.name = 'ice-arcade';
  const m4 = new THREE.Matrix4(), qY = new THREE.Quaternion(), vP = new THREE.Vector3(), vS = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let triangles = 0;
  for (let v = 0; v < 5; v++) {
    const list = trees.filter((t) => t.v === v); if (!list.length) continue;
    await ctx.yield();
    const V = variants[v], n = list.length, inst = new Float32Array(n * 4), inst2 = new Float32Array(n * 4);
    const bark = new THREE.InstancedMesh(V.bark, mat(BARK_V, BARK_F, { uLen: { value: V.L } }), n);
    const glass = new THREE.InstancedMesh(V.glass, mat(GLASS_V, GLASS_F, { uLen: { value: V.L }, uCardW: { value: V.cardW } }, { ...PREMULT, side: THREE.DoubleSide }), n);
    list.forEach((t, i) => {
      qY.setFromAxisAngle(up, Math.atan2(-t.dz, t.dx));
      m4.compose(vP.set(t.x, t.y, t.z), qY, vS.setScalar(t.scale));
      bark.setMatrixAt(i, m4); glass.setMatrixAt(i, m4);
      inst.set([t.bow, t.rel, t.a - t.lat * 0.35 * side, t.seed], i * 4); t.L = V.L;
      inst2.set([(t.corr ?? 1e3) / t.scale, (t.clear ?? 4.8) / t.scale, t.whip || 0, t.rag || 0], i * 4);
    });
    const ia = new THREE.InstancedBufferAttribute(inst, 4), ia2 = new THREE.InstancedBufferAttribute(inst2, 4);
    V.bark.setAttribute('aInst', ia); V.glass.setAttribute('aInst', ia); V.bark.setAttribute('aInst2', ia2); V.glass.setAttribute('aInst2', ia2);
    for (const m of [bark, glass]) { m.frustumCulled = false; m.instanceMatrix.needsUpdate = true; root.add(m); }
    glass.renderOrder = 2;
    triangles += V.tris * n;
  }
  await ctx.yield();

  // tree-local point (bend plane x, height y, across z) -> hero space
  const treeToLocal = (t, lx, ly, lz, out) => out.set(t.x + (lx * t.dx - lz * t.dz) * t.scale, t.y + ly * t.scale, t.z + (lx * t.dz + lz * t.dx) * t.scale);
  const sp = { x: 0, y: 0 };

  // ---- shards owned by each tree, litter already on the track, diamond dust
  {
    const perTree = Math.round(LOAD.shards * detail), nLit = Math.round(3600 * detail);
    const nDust = Math.round((weather === 'clear' ? 1500 : 2600) * detail);
    const rel = trees.filter((t) => t.rel < 1e5);
    let nSh = 0;
    // (a herald's extra chips draw from their own generator, so the main sequence of random draws is as it was)
    const rngH = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(((ctx.seed | 0) * 31 + 977) >>> 0) : rng;
    for (const t of rel) { t.boost = t.rag ? 1.7 : t.light ? 0.35 : shardBoost(t.a); t.nSh = Math.round(perTree * t.boost); t.nEx = t.herald ? Math.max(0, Math.round(perTree * 3) - t.nSh) : 0; nSh += t.nSh + t.nEx; }
    const N = nSh + nLit + nDust;
    const p0 = new Float32Array(N * 4), av = new Float32Array(N * 4), am = new Float32Array(N * 4);
    let k = 0; const w = new THREE.Vector3();
    let ti = 0;
    for (const t of rel) {
      if ((++ti & 1) === 0) await ctx.yield();
      const big = t.herald ? 1.25 : t.boost > 1.2 ? 1.15 : 0.9;
      for (let i = 0; i < t.nSh + t.nEx; i++, k++) {
        const R = i < t.nSh ? rng : rngH;
        const s = 0.12 + 0.88 * Math.pow(R(), 0.7);
        stemPoint(s, THETA_MAX * t.bow, t.L, sp);
        const crown = sstep(0.4, 0.8, s);
        treeToLocal(t, sp.x + R.gauss() * 0.25 * crown, Math.max(0.4, sp.y - R() * R() * 3.2 * crown), R.gauss() * (0.12 + 1.5 * crown), w);
        p0.set([w.x, w.y, w.z, groundAt(w.x, w.z)], k * 4);
        av.set([R.gauss() * 0.5 + t.dx * 0.3, R.gauss() * 0.5 + t.dz * 0.3, t.rel + 0.8 + (0.35 + (t.rag || 0)) * s + R() * R() * (t.herald ? 1.5 : 0.6), R()], k * 4);
        am.set([t.a - t.lat * 0.35 * side, R.range(0.05, 0.14) * big * (load === 'heavy' ? 1.25 : 1), R.range(0.16, 0.4), R.range(5, 19) * R.sign()], k * 4);
      }
    }
    await ctx.yield();
    for (let i = 0; i < nLit; i++, k++) {
      if ((i & 127) === 127) await ctx.yield();
      const a = rng.range(-4, arcLen + 4); lineAt(a, rng.gauss() * 3.6, P);
      p0.set([P.x, P.y + 0.02, P.z, P.y], k * 4); av.set([0, 0, -100, rng()], k * 4);
      am.set([a, rng.range(0.035, 0.11), 0.2, 0], k * 4);
    }
    await ctx.yield();
    for (let i = 0; i < nDust; i++, k++) {
      if ((i & 127) === 127) await ctx.yield();
      const a = rng.range(-10, arcLen + 12); lineAt(a, rng.range(-10, 10), P);
      p0.set([P.x, P.y + rng.range(0, 10.5), P.z, P.y], k * 4); av.set([0, 0, relOf(a) + 0.8, rng()], k * 4);
      am.set([a, weather === 'shower' ? 0.03 : 0.014, -1, rng.range(0, 3)], k * 4);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aP0', new THREE.InstancedBufferAttribute(p0, 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(av, 4)); g.setAttribute('aM', new THREE.InstancedBufferAttribute(am, 4));
    g.instanceCount = N;
    const shards = new THREE.Mesh(g, mat(SHARD_V, SHARD_F, {}, PREMULT));
    shards.frustumCulled = false; shards.renderOrder = 3; root.add(shards);
    triangles += N * 2;
  }
  await ctx.yield();

  // ---- the floor ribbon and its baked trunk-shadow bars (red = shadow), in (arcade distance, lateral) space
  const latSpan = opts.shadowLat ?? 48, TW = lead > 0 ? 4096 : 2048, TH = Math.max(32, Math.round(128 * latSpan / 48)), span = total + 30 + A0;
  const sh = new Uint8Array(TW * TH);
  {
    // Every tree throws the shadow of its own stem as it stands under the ice (a bowed rib's is a long line that curls over
    // toward its lean), widening over the far half of the throw into the soft lobe of its crown: bars half a metre to four
    // metres wide and sixty long, which is what a sun seven degrees up does to a wood.
    const sl = Math.hypot(sunLocal.x, sunLocal.z) || 1, sx = -sunLocal.x / sl, sz = -sunLocal.z / sl, tanE = Math.max(0.06, sunLocal.y / sl);
    const reach = Math.min(62, 9.5 / tanE), du = span / TW, dv = latSpan / TH;        // metres a texel, along and across
    const dab = (x, z, hint, R, str) => {                                            // a soft round brush of radius R metres
      const o = arcOf(x, z, hint, 75);
      const u = (o.arc + A0) / span * TW, v = (o.lat / latSpan + 0.5) * TH - 0.5;
      const ru = Math.max(R / du, 1.3), rv = Math.max(R / dv, 1.0);
      const i0 = Math.max(0, Math.floor(u - ru)), i1 = Math.min(TW - 1, Math.ceil(u + ru)), j0 = Math.max(0, Math.floor(v - rv)), j1 = Math.min(TH - 1, Math.ceil(v + rv));
      for (let j = j0; j <= j1; j++) {
        const fy = (j - v) / rv;
        for (let i = i0; i <= i1; i++) {
          const fx = (i - u) / ru, q = fx * fx + fy * fy; if (q >= 1) continue;
          const f = 1 - q, val = str * f * (2 - f); if (val > sh[j * TW + i]) sh[j * TW + i] = val;
        }
      }
    };
    for (const t of trees) {
      const th = THETA_MAX * t.bow, Ls = t.L * t.scale, n = Math.ceil(Math.min(Ls / tanE, reach + Ls) / 0.33);
      for (let k = 1; k <= n; k++) {
        const s = k / n; stemPoint(s, th, t.L, sp);
        const g = sp.y * t.scale / tanE; if (g > reach) break;
        const x = t.x + t.dx * sp.x * t.scale + sx * g, z = t.z + t.dz * sp.x * t.scale + sz * g, far = g / reach;
        dab(x, z, t.a, 0.17 * (1 - 0.6 * s) + 0.012 * g, 255 * (1 - 0.4 * far));
        if (far > 0.45 && (k & 3) === 0) dab(x, z, t.a, (0.5 + 2.6 * (far - 0.45)) * t.scale, 175 * sstep(0.45, 0.62, far) * (1 - sstep(0.9, 1.0, far)));
      }
      await ctx.yield();
    }
  }
  const shadowTex = new THREE.DataTexture(sh, TW, TH, THREE.RedFormat, THREE.UnsignedByteType);
  shadowTex.magFilter = shadowTex.minFilter = THREE.LinearFilter; shadowTex.needsUpdate = true;
  U.uShadow.value = shadowTex;
  let floor = null;
  if (opts.floor !== false) {
    const hw = U.uFloor.value.y, rows = Math.ceil(span / 2.5), cols = 12, pos = [], uv = [], idx = [];
    for (let r = 0; r <= rows; r++) {
      const a = -A0 + (r / rows) * span;
      for (let c = 0; c <= cols; c++) {
        const f = (c / cols) * 2 - 1, lat = Math.sign(f) * Math.pow(Math.abs(f), 1.6) * hw;
        lineAt(a, lat, P); pos.push(P.x, P.y, P.z); uv.push(a, lat);
        if (r && c) { const i = r * (cols + 1) + c; idx.push(i - cols - 2, i - 1, i - cols - 1, i - cols - 1, i - 1, i); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    floor = new THREE.Mesh(g, mat(FLOOR_V, FLOOR_F, {}, { transparent: true, side: THREE.DoubleSide }));
    floor.frustumCulled = false; floor.renderOrder = -0.5; root.add(floor);
    triangles += idx.length / 3;
  }
  await ctx.yield();

  // ---- anchors
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const eyeAt = (a, h = 1.7, lat = 0) => { lineAt(a, lat, P); return V3(P.x, P.y + h, P.z); };
  const dirAt = (a) => { lineAt(a, 0, P); return V3(P.tx, 0, P.tz); };
  const flyThrough = [];
  for (let a = -30; a < total - 1; a += 12.5) flyThrough.push(eyeAt(a));
  flyThrough.push(eyeAt(total));
  const crownOf = (t, s = 0.86) => { stemPoint(s, THETA_MAX * t.bow, t.L, sp); return treeToLocal(t, sp.x, sp.y, 0, V3()); };
  const seat = lineAt(total, 0, {});
  let owlTree = heralds[1];
  if (opts.owlArc) { let bd = 1e9; for (const t of trees) { const dA = Math.abs(t.a - opts.owlArc); if (!t.extra && !t.portal && !t.herald && t.side === heralds[1].side && t.bow > 0.6 && dA < bd) { bd = dA; owlTree = t; } } }
  const anchors = {
    flyThrough,
    mouth: { position: eyeAt(0, 0), facing: dirAt(0) },
    portalSeat: { position: V3(seat.x, seat.y, seat.z), center: V3(seat.x, seat.y + 4.5, seat.z), facing: V3(-seat.tx, 0, -seat.tz), width: 9, height: 9,
      note: 'foot of the portal on the snow under the last bowed pair (never released); three black spruce belong 8-12 m to its right (sun side)' },
    heralds: heralds.map((t) => ({ root: V3(t.x, t.y, t.z), crown: crownOf(t), curtain: crownOf(t, 0.55).setY(t.y + 4.2), arc: t.a, side: t.side, time: t.rel + 0.8 })),
    // the owl's perch: the far herald's crown, or (opts.owlArc) the bowed crown nearest that arc on the herald's side
    owlPerch: crownOf(owlTree, 0.8).add(V3(0, 0.35, 0)),
    owlLiftTime: heralds[1].rel + 0.8 + 1.0,              // as the herald's stem begins to stir
    trees: trees.map((t) => ({ x: t.x, y: t.y, z: t.z, arc: t.a, side: t.side, release: t.rel, portal: !!t.portal, herald: !!t.herald })),
    viewpoints: {
      nave: { position: eyeAt(passAt - 60), gaze: eyeAt(passAt - 20, 4) },
      waveBeside: { position: eyeAt(passAt), gaze: eyeAt(passAt + 30, 3.5) },
      lookBack: { position: eyeAt(Math.min(arcLen - 20, passAt + 70), 2.2), gaze: eyeAt(passAt + 30, 4) },
      outside: { position: eyeAt(passAt, 3, 26 * side), gaze: eyeAt(passAt + 10, 5) },
      exit: { position: eyeAt(total - 60), gaze: eyeAt(total, 4) },
    },
    sun: sunLocal.clone(), arcLength: arcLen, total,
    shadow: { texture: shadowTex, span, latSpan, start: A0, note: 'red = trunk shadow; u = (arc + start) / span, v = lateral / latSpan + 0.5' },
  };

  // ---- drive
  let driven = false, T = -3;
  const setTime = (t) => { driven = true; T = t; };
  const v2 = new THREE.Vector2();
  const info = {
    triangles: Math.round(triangles), trees: trees.length, shardsPerTree: Math.round(LOAD.shards * detail),
    stemAt: (t, bow, len) => { stemPoint(t, THETA_MAX * bow, len, sp); return [sp.x, sp.y]; },
    extent: { length: total, width: 2 * (opts.floorWidth ?? 46), height: 12 }, hour, load, weather, frontSpeed: FRONT_SPEED, frontFactor: ff, passAt,
  };
  const view = opts.view || [Math.min(arcLen - 30, 118 * (arcLen / 305)), 9, 3.2, -3];
  const vc = lineAt(view[0], 0, {});
  const hero = {
    object: root,
    radius: view[1], height: view[3], center: V3(vc.x, vc.y + view[2], vc.z),      // a VIEWING vignette; true size is info.extent
    anchors, info, uniforms: U, ground: false, groundY: 0,
    // world path u -> timeline, with the brief's numbers by default (opts.pathLength, arcadeStart, passAt, frontFactor)
    setProgress(u) { setTime(timeAtCamArc(pathLength * u - arcadeStart)); },
    setCameraArc(a) { setTime(timeAtCamArc(a)); },                              // arcade distance of the sled (see arcOf)
    setTime, timeAtCamArc,
    getTime: () => T, frontArc: () => frontAt(T),
    arcOf: (x, z) => arcOf(x, z), pointAt: (a, lat = 0, h = 0) => eyeAt(a, h, lat),
    releaseTimeAt: (a) => relOf(a) + 0.8,
    setLight(l = {}) {
      if (l.sun) sunLocal.copy(l.sun).normalize();
      if (l.sunColor) sunCol.copy(l.sunColor); if (l.sky) skyCol.copy(l.sky); if (l.deep) deepCol.copy(l.deep);
      if (l.glint != null) U.uGlint.value = l.glint; if (l.litAll != null) U.uLitAll.value = l.litAll;
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) T = -3 + ((time * 1.0) % 27);                // demo loop until the world drives it
      U.uT.value = T; U.uFront.value = frontAt(T);
      root.updateWorldMatrix(true, false);
      U.uSun.value.copy(sunLocal).transformDirection(root.matrixWorld);
      if (camera && ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(v2);
        U.uPx.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * Math.max(1, v2.y));
      }
    },
    dispose() { shadowTex.dispose(); },
  };
  return hero;
}
