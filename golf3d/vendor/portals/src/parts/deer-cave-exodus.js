// Hero set piece for "deer-cave-exodus" (Three Million Wings): THE ROPE.
// One unbroken river of wrinkle-lipped bats with a source: it streams out of the dark behind the cave
// mouth, squeezes under the lip's stalactites, and corkscrews away over the forest to the notch where
// the exit ring stands. Far off it is smoke (a soft tube with travelling density waves), nearer it is
// tens of thousands of flickering impostors, nearer still a few thousand beating bats, and round the lens a squadron of 60
// fully modelled bats (two-joint wings, finger bones, ears, tail). Three bat hawks stoop through it,
// each opening a hole that heals behind it and flicking a kink down the rope.
//
// LOCAL SPACE  origin = centre of the cave floor in the mouth plane, +Y up, the rope LEAVES toward +Z
//   (cave interior is z < 0). Flying +Z, left is +X and the afterglow is on the right (-X).
//   Size: the rope runs z -400 .. +700 (about 1.2 km); the mouth is 95 m wide, 120 m high.
//   radius/height returned are a viewing volume round the mouth (the viewer orbits that), not the rope.
//
// OPTS
//   palette   7 hex strings (brief order: dark, deep jade, jade, apricot, mist, forest, bat umber)
//   hour      'afterglow' (default) | 'day' | 'golden' | 'night'   (rim/skin colours, night thins the rope)
//   density   0.6 .. 1.3 (default 1) scales the drawn bats; ctx.quality.detail thins mid and far tiers
//   form      'rope' (default) | 'braid' (two ropes wound round each other) | 'pulses' (separate rings)
//   hawks     2 .. 3 (default 3)
//   coil      corkscrew radius outside in metres (default 16), pitch (default 150)
//   coilV     how tall the corkscrew is against its width (default 0.8); thickness: rope diameter in metres (15)
//   lift      metres the rope arches higher over the forest between the mouth and the ridge (default 0). The
//             camera line (anchors.flyThrough) is not lifted, so with a lift the rope is seen from below
//   line      [[x,y,z],...] your own centre line in local space (replaces the default one)
//   mouth     false to leave out the rock mouth frame, its stalactites and lianas (default true)
//   lipDark   0..1 darkens the lip edge too (for a world that only ever sees the mouth from inside; default 0)
//   squadron  false to leave out the 60 near bats that hold station round the camera
//   mistFloor false to leave out the stand-in mist sea at y 44 (the world's own canopy and mist replace it)
//   seat      [x,y,z] where the exit ring stands (default 80,92,520); coilEnd [z0,z1] where the corkscrew dies away
//   With a line of your own: ramp (metres over which the rope fattens from its source, default 190), flare (how
//             much it spreads as it climbs away, 0), tail (metres over which its far end dissolves, 60)
//   window    metres of rope round the lens that carry the beating mid bats (default 340)
//   far, mid  bat counts of the two tiers before density (23000, 4200); maxFar, maxMid cap them (26000, 4000)
//   Night (hour 'night') draws the rope at full thickness, dark on a moonlit sky.
//   seatYaw   degrees left of +Z of the final heading into the ring (default 20)
//   coilStart [z0, z1] over which the corkscrew of a line grows in (default 105, 230)
//   farWindow metres of rope that carry the far bats, kept round the lens like the mid window (default: all of it);
//             farLead: how far ahead of the mid window's centre the far window is centred (0)
//   farScale  [k, cap, pow]: far bats are never drawn smaller than about k x 2.4 px, grown at most cap times, and
//             fade as 1 / growth^pow (default 1, 2.6, 1.1); midScale [k, cap] likewise for the mid tier (1, 2.2)
//   lensClear metres round the lens that the rope's bats keep clear of (default 1.3)
//   tubeNear  1: outside, the smoke body only comes in from 110 to 400 m, so the near rope is bats alone (default 0)
//   coilNear  { r, v, z: [z0, z1], node: [x,y,z], end: [x,y,z] } a second corkscrew for the first pass of a line that
//             loops out and comes back (coil, coilStart and coilEnd then shape the leg that returns): see buildLine
//
// ANCHORS (local space)
//   mouth          { position, width, height, normal }   centre of the opening
//   mouthOutline   Vector3[] the authored keyhole outline in the plane z = 0 (match your cave tube to it)
//   lipTipY        lowest stalactite tip over the flight line (the line passes >= 8 m under it)
//   flyThrough     Vector3[] ordered camera line, 900 m: starts 380 m inside, level; one 9 m corkscrew
//                  round the rope's core; out through the mouth at y 100; left flank of the rope; back
//                  into it; last 96 m straight, rising 3 degrees, into portalSeat. >= 7 m from all rock.
//   portalSeat     { position, facing (unit, toward the arriving camera), direction, radius: 7, tiltDeg: 3 }
//   notchLeft / notchRight   where the two blades should stand (10 m either side of the ring centre)
//   viewpoints     { keyhole, corkscrew, threshold, flank, notch } good still positions
//   strikes        [{ at, dir, u }] where each hawk crosses the rope (same Vector3s as hero.strikes)
//   ropeSource, ropeEnd, glowDir
//
// HOOKS
//   hero.setProgress(u)   path progress 0..1: hawks stoop at u 0.44, 0.48, 0.53 (windows of 0.045).
//                         Until it is called the hawks loop on time so the piece is alive on its own.
//   hero.strikes[i].at / .dir   mutable Vector3s: re-seat a strike on your own path (7-11 m ahead of the lens)
//   hero.setPark(p, f)    park the squadron round point p, heading f (a world's path start), for the frames in which
//                         the world is seen through the previous portal; setPark(null) lets it ride with the lens again.
//                         The squadron is 60: eight near ones, 3.5 to 6 m, clear of the middle of the view; 32 in a loose
//                         flock 7 to 19 m out; and twenty close ones for the cave (stations 1.2 to 4.5 m, set a little
//                         further out by the clear space round the lens), two of them with a wingtip across a lower corner
//                         of the frame; outside the cave those twenty fall back into the flock, 8 to 16 m out.
//   hero.setSway(up, side, s0, grow)  the rope's slow undulation outside the cave (metres, station where it begins, metres to grow in)
//   hero.setKeyThin(z0, z1, share, die)  while the lens is inside (setLight's inside), the far bats beyond z0..z1 are thinned
//                         to `share` at the mouth plane and die away over `die` metres outside it; the smoke body likewise
//   hero.setLight({ glowDir, glowColor, skyColor, ambient, open })  rim direction/colour, skin tint,
//                         open = 0 inside the cave (rim only toward glowDir), 1 outside
//   hero.setWindow(metres) centre the mid window (and the far one, farLead ahead of it) on this station of the rope
//                         instead of the station nearest the lens; give a smooth function of path progress. null frees it.
//                         A second argument centres the far window on a station of its own (metres) instead of farLead ahead.
//   hero.setLeg(a, b, k)  a line that loops far out and comes back: the rope between stations a and b (metres) is not
//                         drawn, and what lies beyond b is drawn k strong (0..1). setLight's follow (0..1, default 0.75) is how
//                         far the squadron's stations ride with the view and not with the heading.
//                         setLight's phase (radians, a smooth function of path progress) turns the squadron's slow
//                         wander, so its arrangement in the frame differs from place to place on the path.
//   hero.setMouthVisible(v) show or hide the rock mouth (meshes only; no light is among them).
//   hero.setSquadHeading(v) the squadron flies this heading (a world's path tangent) instead of the rope's; null frees it.
//                         setLight also takes spread (0..1): outside, the eight axis bats move off the axis and lower.
//   hero.centerAt(s01, out), hero.stationNear(pos) -> s01, hero.ropeRadiusAt(s01), hero.length
//   hero.setCut(stationMetres, halfWidthMetres)   rare event: cut a gap out of the rope (0 width = none)
//   strikes[i] also carries w (window in u), span (metres crossed over the window), fwd/speed/secs (the travel of
//   a moving strike frame: set .at every frame and the hawk is drawn flying with it), home (fixed point to circle
//   over between stoops) and hole: 'wake' (a healing wake along its line) | 'view' (a window of sky round the hawk
//   as seen from the lens). setLight also takes rim and through (rim strength, light through the wing skin).
//   setLight also takes batAmb and batAmbOut (Colors: the light of the air on the near and mid bats, the cave's warm
//   bounce on those inside the mouth plane, the night sky on those outside), dif (how strongly the glow lights the side turned to it) and inside (1 in the cave, 0 out).
//   A 'view' hole is a cone from the lens through the hawk: holeTan (tangent of its half angle, default 0.23) and
//   holeLen (metres, default 85) size it; bats in it are piled on its rim and the smoke is cleared (holeF). A
//   strike may also carry aim (the heading the hawk is drawn with), bank (0..1, its back rolled to the lens so
//   the planform shows) and foldMax (how far the wings fold in the stoop, default 0.72).
//
// COST  about 143k triangles, 8 draw calls (mouth off: 131k, 6), build ~170 ms, no lights of its own. Bats are drawn
//   1.4x life (0.45 m span) and the hawks likewise (1.6 m), so both survive the distances in the brief.
// LIGHT  bats, hawks and smoke are self-shaded from the uniforms above (sky is the only light); the rock
//   mouth is a MeshStandardMaterial and takes the scene's hemisphere/directional light. Scene fog is honoured.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PAL = ['#06090A', '#17424E', '#62B9A1', '#F3A869', '#BCD6CC', '#143322', '#2B1D17'];
const NS = 512;                     // centre-line samples in the data texture
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);

// ---------------------------------------------------------------------------------------------------
// Centre line: base spline (cave -> mouth -> notch -> beyond) plus a corkscrew offset outside.
function buildLine(rng, opts) {
  const sag = rng.range(-3, 3), jx = rng.range(-8, 8), hand = rng.chance(0.5) ? 1 : -1;
  const sy = (opts.seatYaw ?? 20) * Math.PI / 180, dir = V3(Math.sin(sy), Math.tan(3 * Math.PI / 180), Math.cos(sy)).normalize();
  const seat = opts.seat ? V3(opts.seat[0], opts.seat[1], opts.seat[2]) : V3(80, 92, 520), pre = seat.clone().addScaledVector(dir, -96), post = seat.clone().addScaledVector(dir, 190);
  // opts.lift: the rope arches this many metres higher over the forest (the camera line does not follow it, so the
  // rope is seen from below, a river in the sky)
  const lift = opts.lift ?? 0, mk = (L) => [
    V3(jx * 1.5, 95, -400), V3(jx, 96, -270), V3(jx * 0.4, 98, -130), V3(0, 100, 0), V3(1, 97.5 + 0.4 * L, 95),
    V3(10, 89 + sag + L, 200), V3(27, 85 + sag + L, 310), pre, seat, post];
  const pts = opts.line ? opts.line.map((p) => V3(p[0], p[1], p[2])) : mk(lift);
  const base = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const NB = 700, bp = base.getSpacedPoints(NB), bt = [];
  for (let i = 0; i <= NB; i++) bt.push(bp[Math.min(NB, i + 1)].clone().sub(bp[Math.max(0, i - 1)]).normalize());
  let bp0 = bp, bt0 = bt;                               // the unlifted line, which the camera line is built on
  if (lift && !opts.line) {
    bp0 = new THREE.CatmullRomCurve3(mk(0), false, 'centripetal').getSpacedPoints(NB); bt0 = [];
    for (let i = 0; i <= NB; i++) bt0.push(bp0[Math.min(NB, i + 1)].clone().sub(bp0[Math.max(0, i - 1)]).normalize());
  }
  const baseLen = base.getLength(), coilR = opts.coil ?? 16, pitch = opts.pitch ?? 150, ph0 = rng.range(0, 6.28);
  const z0 = pts[0].z, z1 = pts[pts.length - 1].z, coilEnd = opts.coilEnd || [330, 425], coilStart = opts.coilStart || [105, 230], flare = opts.flare ?? 0;
  // opts.coilNear (a line of a world's own that loops far out and comes back): the corkscrew of its first pass, from
  // outside the mouth to where the loop goes out of sight. { r, v, z: [z0, z1], node: [x, y, z], end: [x, y, z] }:
  // radius, height against width, the z over which it grows in beyond the mouth, a place on the line where the
  // coil passes level with its own axis on the side away from the mouth, arching up just upstream of it and
  // dipping just downstream (so a world knows where the rope stands there), and a place on the loop by which it has
  // given way to the coil above.
  const cn = opts.coilNear || null, nearA = (q) => { let bi = 0, bd = Infinity; for (let i = 0; i <= NB; i++) { const d = bp[i].distanceToSquared(q); if (d < bd) { bd = d; bi = i; } } return (bi / NB) * baseLen; };
  const aNode = cn ? nearA(V3(cn.node[0], cn.node[1], cn.node[2])) : 0, aEnd = cn ? nearA(V3(cn.end[0], cn.end[1], cn.end[2])) : -1e9;
  // coiled polyline
  const cp = [], n = V3(), b = V3();
  for (let i = 0; i <= NB; i++) {
    const p = bp[i], t = bt[i], a = (i / NB) * baseLen;
    n.crossVectors(UP, t).normalize(); b.crossVectors(t, n);
    const env = coilR * smoothstep(coilStart[0], coilStart[1], p.z) * (1 - smoothstep(coilEnd[0], coilEnd[1], p.z)) + 2.5 * smoothstep(z0, z0 + 150, p.z) * (1 - smoothstep(-90, -20, p.z));
    const ph = hand * (a / pitch) * Math.PI * 2 + ph0;
    const q = p.clone();
    if (cn) {
      const w = smoothstep(aEnd - 250, aEnd, a), envN = cn.r * smoothstep(cn.z[0], cn.z[1], p.z) * (1 - w), phN = Math.PI + ((a - aNode) / pitch) * Math.PI * 2;
      const cave = 2.5 * smoothstep(z0, z0 + 150, p.z) * (1 - smoothstep(-90, -20, p.z));        // the small wander inside the cave is the line's own, on either pass
      q.addScaledVector(n, Math.cos(phN) * envN + Math.cos(ph) * (env - cave) * w + Math.cos(ph) * cave).addScaledVector(b, Math.sin(phN) * envN * (cn.v ?? 0.75) + Math.sin(ph) * ((env - cave) * w + cave) * (opts.coilV ?? 0.8));
    } else q.addScaledVector(n, Math.cos(ph) * env).addScaledVector(b, Math.sin(ph) * env * (opts.coilV ?? 0.8));
    cp.push(q);
  }
  const arc = [0]; for (let i = 1; i <= NB; i++) arc.push(arc[i - 1] + cp[i].distanceTo(cp[i - 1]));
  const length = arc[NB], R0 = (opts.thickness ?? 15) / 2;
  const data = new Float32Array(NS * 4);
  let j = 0;
  for (let k = 0; k < NS; k++) {
    const a = (k / (NS - 1)) * length; while (j < NB - 1 && arc[j + 1] < a) j++;
    const f = clamp((a - arc[j]) / Math.max(1e-4, arc[j + 1] - arc[j]), 0, 1);
    const x = lerp(cp[j].x, cp[j + 1].x, f), y = lerp(cp[j].y, cp[j + 1].y, f), z = lerp(cp[j].z, cp[j + 1].z, f);
    const zn = (z - z0) / (z1 - z0);
    let r = R0 * (0.35 + 0.65 * (opts.line ? smoothstep(z0, z0 + (opts.ramp ?? 190), z) : smoothstep(0.0, 0.16, zn)));   // thin at the source
    r *= 1 - 0.22 * Math.exp(-((z / 45) ** 2));                               // squeezed under the lip
    if (opts.line) r *= 1 + flare * smoothstep(260, 1000, z);                 // a world's own line: the column spreads as it climbs away
    else r *= 1 - 0.34 * smoothstep(seat.z - 150, seat.z - 40, z);            // narrows to 10 m for the ring
    data[k * 4] = x; data[k * 4 + 1] = y; data[k * 4 + 2] = z; data[k * 4 + 3] = r;
  }
  const tex = new THREE.DataTexture(data, NS, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const centerAt = (s, out = V3()) => {
    const f = clamp(s, 0, 1) * (NS - 1), i = Math.min(NS - 2, Math.floor(f)), fr = f - i;
    return out.set(lerp(data[i * 4], data[i * 4 + 4], fr), lerp(data[i * 4 + 1], data[i * 4 + 5], fr), lerp(data[i * 4 + 2], data[i * 4 + 6], fr));
  };
  const radiusAt = (s) => data[Math.round(clamp(s, 0, 1) * (NS - 1)) * 4 + 3];
  const stationNear = (p) => {
    let best = 0, bd = Infinity;
    for (let k = 0; k < NS; k++) { const dx = data[k * 4] - p.x, dy = data[k * 4 + 1] - p.y, dz = data[k * 4 + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = k; } }
    let s = best / (NS - 1); const q = V3();     // refine between neighbours
    let lo = Math.max(0, s - 1 / (NS - 1)), hi = Math.min(1, s + 1 / (NS - 1));
    for (let it = 0; it < 6; it++) { const a = lo + (hi - lo) / 3, c = hi - (hi - lo) / 3; if (centerAt(a, q).distanceToSquared(p) < centerAt(c, q).distanceToSquared(p)) hi = c; else lo = a; }
    return (lo + hi) / 2;
  };
  // base line by z (for the camera line, which does not follow the corkscrew)
  const baseAtZ = (z, out = V3(), tan = null) => {
    let i = 0; while (i < NB - 1 && bp0[i + 1].z < z) i++;
    const f = clamp((z - bp0[i].z) / Math.max(1e-4, bp0[i + 1].z - bp0[i].z), 0, 1);
    if (tan) tan.copy(bt0[i]).lerp(bt0[i + 1], f).normalize();
    return out.copy(bp0[i]).lerp(bp0[i + 1], f);
  };
  return { tex, data, length, centerAt, radiusAt, stationNear, baseAtZ, seat, dir, hand, R0, z0, z1 };
}

// Camera line of the brief (900 m), built on the base line with authored offsets.
function buildFlyThrough(L) {
  const out = [], p = V3(), t = V3(), n = V3(), b = V3();
  const zs = [-380, -350, -310, -272, -252, -232, -212, -192, -172, -152, -130, -108, -80, -45, 0, 45, 90, 130, 175, 220, 265, 310, 350, 390];
  for (const z of zs) {
    L.baseAtZ(z, p, t); n.crossVectors(UP, t).normalize(); b.crossVectors(t, n);
    let ox = 0, oy = 0;
    if (z < 0) {
      const k = smoothstep(-272, -108, z), turn = (z > -272 && z < -108) ? (z + 272) / 164 : (z <= -272 ? 0 : 1);
      const rad = lerp(4, 9, Math.sin(Math.PI * clamp(turn, 0, 1))) * (1 - smoothstep(-108, -10, z));
      const ang = -Math.PI / 2 + turn * Math.PI * 2 * L.hand;
      ox = Math.cos(ang) * rad; oy = Math.sin(ang) * rad; void k;
    } else {
      const fl = smoothstep(68, 132, z) * (1 - smoothstep(300, 395, z));
      ox = 20 * fl; oy = -5 * fl;
    }
    out.push(p.clone().addScaledVector(n, ox).addScaledVector(b, oy));
  }
  out.push(L.seat.clone().addScaledVector(L.dir, -96), L.seat.clone().addScaledVector(L.dir, -48), L.seat.clone());
  return out;
}

// ---------------------------------------------------------------------------------------------------
// GLSL shared by every tier: the one function that places a bat on the rope.
const ROPE_GLSL = /* glsl */`
uniform sampler2D uLine; uniform float uLen, uTime, uTwist, uSpin, uBraid, uSpeed, uTail;
uniform vec4 uCapA[4]; uniform vec4 uCapB[4]; uniform vec4 uKink[3]; uniform vec3 uKinkDir[3];
uniform vec3 uLens; uniform vec2 uCut; uniform vec3 uLeg; uniform vec4 uSway;
// a world's own line may loop far out and come back: between the stations uLeg.x and uLeg.y (metres) the rope is not
// drawn at all, and what lies beyond uLeg.y (the leg that comes back) is drawn uLeg.z strong (0..1)
float legGate(float sM){ return 1. - smoothstep(uLeg.x, uLeg.x + 200., sM) + smoothstep(uLeg.y - 200., uLeg.y, sM) * uLeg.z; }
// rare event: a gap cut out of the rope (centre station in metres, half width; 0 = none)
float cutF(float sM){ return 1. - step(.5, uCut.y) * (1. - smoothstep(uCut.y * .55, max(uCut.y, 1.), abs(sM - uCut.x))); }
vec4 lineAt(float s){
  float f = clamp(s, 0., 1.) * ${NS - 1}.; float i = floor(f);
  vec4 a = textureLod(uLine, vec2((i + .5) / ${NS}., .5), 0.);
  vec4 b = textureLod(uLine, vec2((min(i + 1., ${NS - 1}.) + .5) / ${NS}., .5), 0.);
  return mix(a, b, f - i);
}
float braidEnv(float z){ return smoothstep(70., 210., z) * (1. - smoothstep(400., 490., z)); }
// Compression waves travel down the whole rope. On the first pass, seen from near, two of them, 140 m and 57 m long.
// legW is 1 on the leg that comes back (beyond uLeg.y), which is seen from half a kilometre: there a wave 57 m long
// with a threefold swing of density reads as a string of beads, so the two short waves give way (to a fifth) to
// one long slow one, 350 m from crest to crest and travelling at 22 m/s, under which the bats stand between 0.70
// and 1.74 of their mean density: a continuous body that swells and thins as the wave slides along it.
float legW(float sM){ return smoothstep(uLeg.y - 300., uLeg.y, sM); }
float waveS(float sM){
  float lw = legW(sM);
  return sM + (1. - .8 * lw) * (5. * sin(.045 * sM - .9 * uTime) + 2.5 * sin(.11 * sM - 1.7 * uTime + 2.)) + lw * 18. * sin(.018 * sM - .4 * uTime + 1.);
}
// outside the cave the whole rope undulates slowly, a ribbon in moving air: uSway = (metres up and down, metres from
// side to side, the station where it begins, 1 / the metres over which it grows). Two long waves that travel down it.
vec3 swayOff(float w, vec3 N, vec3 B){
  float g = clamp((w - uSway.z) * uSway.w, 0., 1.); g = g * g * (3. - 2. * g);
  return (B * (uSway.x * sin(w * .0205 - uTime * .62)) + N * (uSway.y * sin(w * .0131 - uTime * .41 + 1.7))) * g;
}
vec3 kinkOff(float w){
  vec3 o = vec3(0.);
  for (int i = 0; i < 3; i++) { float x = (w - uKink[i].x) / max(uKink[i].z, 1.); o += uKinkDir[i] * (uKink[i].y * 2.33 * x * exp(-x * x)); }
  return o;
}
vec3 pushCaps(vec3 p){
  for (int i = 0; i < 4; i++) {
    vec3 ab = uCapB[i].xyz - uCapA[i].xyz;
    float h = clamp(dot(p - uCapA[i].xyz, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
    vec3 q = uCapA[i].xyz + ab * h; vec3 d = p - q + vec3(1e-3, 2e-3, 0.);
    float l = length(d); float R = mix(uCapA[i].w, uCapB[i].w, h);
    float ln = i < 3 ? max(l, R + l * .2857) : sqrt(l * l + R * R);      // hawk holes pile the bats they clear into a rim
    p = q + d * (ln / max(l, 1e-3));
  }
  return p;
}
float holeF(vec3 p){
  float f = 1.;
  for (int i = 0; i < 3; i++) {
    vec3 ab = uCapB[i].xyz - uCapA[i].xyz;
    float h = clamp(dot(p - uCapA[i].xyz, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
    float R = mix(uCapA[i].w, uCapB[i].w, h), l = length(p - (uCapA[i].xyz + ab * h));
    f *= mix(1., smoothstep(R * .75, R * 1.25 + .01, l), step(.05, R));
  }
  return f;
}
void ropeFrame(float w, out vec4 c, out vec3 T, out vec3 N, out vec3 B){
  float s = w / uLen; c = lineAt(s);
  T = normalize(lineAt(s + .004).xyz - lineAt(s - .004).xyz + vec3(0., 0., 1e-4));
  N = normalize(cross(vec3(0., 1., 0.), T) + vec3(1e-4, 0., 0.)); B = cross(T, N);
}
// sM: station in metres; rf: radius fraction; th: angle; returns local position, F = heading
vec3 batPos(float sM, float rf, float th, float rnd, float strand, out vec3 F){
  float w = waveS(sM); vec4 c; vec3 T, N, B; ropeFrame(w, c, T, N, B);
  float a = th + uTwist * w + uSpin * uTime;
  float r = c.w * rf * (1. + .18 * sin(.03 * w - .6 * uTime + rnd * 3.));
  vec3 rad = N * cos(a) + B * sin(a), tang = -N * sin(a) + B * cos(a);
  vec3 p = c.xyz + rad * r;
  float bp = w * .057 + strand * 3.14159; p += (N * cos(bp) + B * sin(bp)) * (uBraid * braidEnv(c.z));
  p += N * (sin(uTime * 1.3 + rnd * 40.) * .5) + B * (cos(uTime * 1.7 + rnd * 70.) * .5);
  p += kinkOff(w) + swayOff(w, N, B);
  vec3 q = pushCaps(p);
  F = normalize(T + tang * (r * (uTwist + uSpin / uSpeed)) + (q - p) * .15);
  return q;
}`;

const BAT_VERT = /* glsl */`
attribute vec4 aSeed; attribute vec3 aSeed2; attribute vec2 aWing;
#ifdef SQUAD
attribute vec3 aOut;
uniform vec3 uGlowDir;
#endif
uniform float uWin, uCamS, uPxK, uSize, uVar;
uniform vec3 uSqF, uSqP, uSqV; uniform float uPark, uSpread, uSqPh; uniform vec2 uMidK;
varying vec2 vWing; varying vec3 vN, vPos; varying float vRnd;
#include <fog_pars_vertex>
${ROPE_GLSL}
void main(){
  float rnd = aSeed.w, fade = 1.; vec3 F, p;
#ifdef SQUAD
  // the squadron holds its stations in the frame of the view (uSqV: mostly where the lens looks), so each bat keeps
  // its place in the picture, whole and off the middle; it flies the path's heading (uSqF), each a little its own way
  vec3 T = normalize(uSqF + vec3(0., 0., 1e-4)), Tv = normalize(uSqV + vec3(0., 0., 1e-4));
  vec3 R0 = normalize(cross(vec3(0., 1., 0.), Tv) + vec3(1e-4, 0., 0.)), U0 = cross(Tv, R0);
  vec3 wob = vec3(sin(uTime * .9 + rnd * 30.), sin(uTime * 1.2 + rnd * 50.), sin(uTime * .7 + rnd * 70.)) * (.16 + .03 * aSeed.z);
  // inside the cave each holds its cave station (aSeed.xyz); outside (uSpread 1) its open-air one (aOut), the nearest
  // four 2.5 to 3.3 m from the lens, one in each quarter of the frame, and every one wanders slowly round its place
  vec3 o = mix(aSeed.xyz, aOut, uSpread);
  float od = length(o);
  // (uSqPh, set from the path, turns the same wander, so two places on the path never show the same arrangement)
  float sqA = uSqPh * (.6 + .8 * fract(rnd * 13.7)), sqB = uSqPh * (.5 + .9 * fract(rnd * 29.3));
  o.xy += od * uSpread * vec2(.17 * sin(uTime * .37 + sqA + rnd * 40.) + .05 * sin(uTime * .83 + rnd * 17.), .1 * sin(uTime * .29 + sqB + rnd * 70.) + .03 * sin(uTime * .71 + rnd * 23.));
  o = normalize(o + vec3(0., 0., 1e-4)) * od + wob;
  // outside none sits in front of the moon: one whose place would is turned out to a moon's breadth beside it
  vec3 dW = R0 * o.x + U0 * o.y + Tv * o.z, dn = normalize(dW + vec3(0., 0., 1e-4));
  float mc = dot(dn, uGlowDir);
  dW += normalize(dn - uGlowDir * mc + U0 * .02) * (od * .2 * smoothstep(.962, .985, mc) * uSpread);
  p = uSqP + dW;
  fade = mix(1., step(.6, o.z), uPark);                    // parked at the path's first point while the world is seen through a portal: only those ahead of it
  vec3 Rt = normalize(cross(vec3(0., 1., 0.), T) + vec3(1e-4, 0., 0.)), Ut = cross(T, Rt);
  F = normalize(T + Rt * (.10 * cos(uTime * .9 + rnd * 30.) + .34 * (aSeed2.x - .5)) + Ut * (.08 * cos(uTime * 1.2 + rnd * 50.) + .22 * (fract(rnd * 7.31) - .5)));
  { vec3 dl = p - uLens + vec3(1e-3, 2e-3, 0.); float l = length(dl), Rl = uCapA[3].w * (1. - uSpread); p = uLens + dl * (sqrt(l * l + Rl * Rl) / max(l, 1e-3)); }      // in the cave it keeps the rope's clear space round the lens; outside its stations are its own
#else
  float spd = uSpeed * (1. - .5 * uVar + uVar * rnd);
  float sAbs = aSeed.x * uWin + uTime * spd;
  float sM = uCamS + mod(sAbs - uCamS + .5 * uWin, uWin) - .5 * uWin;
  fade = (1. - smoothstep(.40 * uWin, .5 * uWin, abs(sM - uCamS))) * smoothstep(0., 30., sM) * (1. - smoothstep(uLen - uTail, uLen, sM)) * cutF(sM) * legGate(sM);
  p = batPos(sM, aSeed.y, aSeed.z, rnd, aSeed2.z, F);
#endif
  float dist = length(p - uLens);
  fade *= smoothstep(1.0, 1.7, dist);
  vec3 Ub = normalize(vec3(0., 1., 0.) + cross(vec3(0., 1., 0.), F) * (.4 * sin(uTime * 1.1 + rnd * 30.)));
  vec3 Rb = normalize(cross(Ub, F) + vec3(1e-4, 0., 0.)); Ub = cross(F, Rb);
  // wing beat: 9 per second, own phase, with glides; two joints (shoulder, wrist), the hand folds on the upstroke, and
  // the whole wing twists about its leading edge (edge down on the downstroke, up on the upstroke; the hand more than
  // the arm), so that from behind a wing is a surface that opens and closes, never only a line
  float ph = uTime * 56.5 * (.9 + .2 * aSeed2.x) + rnd * 62.8;
  float amp = 1. - .8 * smoothstep(.8, .97, sin(uTime * .8 + rnd * 50.));
  vec3 lp = position, ln = normal;
  float side = lp.x < 0. ? -1. : 1., d = abs(lp.x);
  if (aWing.x >= 0.) {
    float A1 = amp * (.12 + .78 * sin(ph)), A2 = A1 + amp * (-.25 + .65 * sin(ph - 1.1));
    float up = max(cos(ph), 0.) * amp;
    float uu = aWing.x, le = uu < .42 ? mix(.10, .24, uu / .42) : mix(.24, -.10, (uu - .42) / .58);
    float tw = -cos(ph) * amp * (.24 + .46 * uu) + .1 * (1. - amp), c = le - lp.z;
    float d1 = clamp(d - .06, 0., .395), d2 = max(d - .455, 0.) * (1. - .32 * up);
    float A = mix(A1, A2, step(.455, d)), ty = c * sin(tw);
    lp.x = side * (.06 + cos(A1) * d1 + cos(A2) * d2 - sin(A) * ty);
    lp.y += sin(A1) * d1 + sin(A2) * d2 + cos(A) * ty;
    lp.z = le - c * cos(tw) - d2 * .3 * up;
    ln = normalize(vec3(-side * sin(A) * cos(tw), cos(A) * cos(tw), sin(tw)));
  } else { lp.y -= .035 * sin(ph) * amp; }
  float sc = uSize * (.85 + .3 * aSeed2.x) * fade * clamp(dist * uPxK * uMidK.x, 1., uMidK.y);
#ifdef SQUAD
  sc = uSize * 1.36 * (.92 + .16 * aSeed2.x) * fade;
#endif
  vec3 lpos = p + (Rb * lp.x + Ub * lp.y + F * lp.z) * sc;
  vN = Rb * ln.x + Ub * ln.y + F * ln.z; vPos = lpos; vWing = aWing; vRnd = rnd;
  vec4 mvPosition = modelViewMatrix * vec4(lpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// A bat is a dark animal: soot-brown fur, wing skin a shade lighter than the fur between darker finger bones. It is
// lit three ways and never outlined: by the air round it (uBatAmb: the warm grey bounce of the cave; uBatAmbOut: the
// night sky outside), softly on the side turned to the glow (the keyhole inside, the moon outside), and through the wing skin
// where the far side of a wing is turned to the glow or the wing stands in front of it, which is when the bones show
// dark in warm brown skin. fuzz (0..1) is where fur or a wing's arm turns away from the eye: it takes a dim rim in
// the glow's own colour, only where the surface also faces the glow, and only within a few metres of the lens.
const LIGHT_GLSL = /* glsl */`
uniform vec3 uBatCol, uFurCol, uBatAmb, uBatAmbOut, uGlowCol, uSkyCol, uGlowDir, uLens; uniform float uAmb, uOpen, uRim, uThru, uDif;
vec3 shadeBat(vec3 N, vec3 V, float skin, float alb, float fuzz, float dist, float inK){
  float ndl = dot(N, uGlowDir), wrap = .5 + .5 * ndl, w3 = wrap * wrap * wrap;
  float gL = dot(uGlowCol, vec3(.3333)); vec3 gC = mix(uGlowCol, vec3(gL), .25);
  vec3 base = uFurCol * alb;
  vec3 col = base * mix(uBatAmbOut, uBatAmb, inK) * (.78 + .22 * N.y) + base * gC * (w3 * uDif);      // a bat still inside the cave takes its bounce light, one already out the night sky's
  float th = max(dot(-V, uGlowDir), 0.); th *= th; th *= th; th *= th; th *= th; th *= th;        // the wing stands in front of the glow itself (within about 12 degrees)
  col += skin * mix(vec3(.27, .2, .155), vec3(.21, .195, .185), uOpen) * (gL * uThru * (.1 * max(-ndl, 0.) + th));      // warm brown skin by the keyhole's light, slate by the moon's
  col += gC * (fuzz * uRim * w3 * (1. - smoothstep(6., 14., dist)));
  return col;
}`;

const BAT_FRAG = /* glsl */`
varying vec2 vWing; varying vec3 vN, vPos; varying float vRnd;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  vec3 toL = uLens - vPos; float dist = length(toL); vec3 V = toL / max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N, V) < 0.) N = -N;
  float ndv = abs(dot(N, V)), fres = 1. - ndv; fres *= fres;
  float skin = 0., alb = .72, fuzz = fres * .9, nearK = 1. - smoothstep(9., 22., dist);
  if (vWing.x >= 0.) {
    float u = vWing.x, v = vWing.y;
    float f = u < .42 ? u / .42 : fract((u - .42) / .1934);
    float scal = 1. - (u < .42 ? .32 : .25) * sin(3.14159 * clamp(f, 0., 1.));
    if (v > scal) discard;                                   // scalloped trailing edge between the fingers
    float wv = .015 + .015 * v;
    float bone = 1. - smoothstep(.03, .07, v);               // arm and leading finger
    bone = max(bone, 1. - smoothstep(wv, wv * 2.2, abs(u - .42)));
    bone = max(bone, 1. - smoothstep(wv, wv * 2.2, abs(u - (.42 + .1934 * v))));
    bone = max(bone, 1. - smoothstep(wv, wv * 2.2, abs(u - (.42 + .3868 * v))));
    bone = max(bone, (1. - smoothstep(wv, wv * 2.2, abs(u - .21 * v))) * step(u, .3) * .6);
    bone *= .35 + .65 * nearK;                               // far off the bones go into the skin's tone
    skin = 1. - bone;
    float mem = mix(.86, 1.12, smoothstep(.08, .9, u)) * (1. - .12 * nearK * sin(u * 43. + v * 6.) * sin(u * 43. + v * 6.));   // thinner, paler skin toward the hand; faint creases
    alb = mix(.5, mem, skin);
    fuzz = fres * (1. - smoothstep(0., .3, v)) * .45;        // only the arm and the leading finger catch a rim
  } else if (vWing.x < -1.5) { skin = .55; alb = .95; fuzz = fres * .5; }                // ears: thin skin
  gl_FragColor = vec4(shadeBat(N, V, skin, alb * (.84 + .32 * vRnd), fuzz, dist, 1. - smoothstep(-30., 18., vPos.z)), 1.);
  #include <fog_fragment>
}`;

// Unit bat: half-span 1 along +-X, nose toward +Z. detail 1 = near (about 250 triangles), 0 = mid (16). The body is
// a stout furred spindle (head, neck, deep chest, rump, thin free tail), the near one with broad ears.
function batGeometry(detail) {
  const pos = [], nor = [], wing = [], idx = [];
  const vert = (x, y, z, nx, ny, nz, u, v) => { pos.push(x, y, z); nor.push(nx, ny, nz); wing.push(u, v); return pos.length / 3 - 1; };
  // body + head + tail as one lathe
  const prof = detail ? [[0.33, 0.006], [0.30, 0.05], [0.235, 0.092], [0.17, 0.086], [0.125, 0.074], [0.05, 0.128], [-0.07, 0.132], [-0.19, 0.098], [-0.28, 0.05], [-0.33, 0.016], [-0.56, 0.006]]
    : [[0.32, 0.006], [0.05, 0.125], [-0.54, 0.006]];
  const sides = detail ? 8 : 3, rings = [];
  for (const [z, r] of prof) {
    const ring = [];
    for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2 + Math.PI / sides, c = Math.cos(a), s = Math.sin(a); ring.push(vert(c * r, s * r * 0.82 + (z > 0.12 && z < 0.31 ? 0.014 : 0), z, c, s, 0, -1, (0.33 - z) / 0.89)); }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) {
    const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % sides];
    if (i > 0 || detail) idx.push(a, c, b); idx.push(b, c, d);
    if (i === 0 && !detail) idx.push(a, c, b);
  }
  if (detail) for (const sx of [-1, 1]) {            // ears: broad, set forward, tips out
    const a = vert(sx * 0.02, 0.07, 0.275, sx, 0.5, 0.2, -2, 0), b = vert(sx * 0.105, 0.05, 0.215, sx, 0.5, 0.2, -2, 0), c = vert(sx * 0.03, 0.075, 0.165, sx, 0.5, 0.2, -2, 0), t = vert(sx * 0.125, 0.185, 0.235, sx, 1, 0.2, -2, 0);
    idx.push(a, b, t, b, c, t, c, a, t);
  }
  const us = detail ? [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.85, 1] : [0, 0.42, 1], vs = detail ? [0, 0.33, 0.66, 1] : [0, 1];
  for (const sx of [-1, 1]) {
    const grid = [];
    for (const u of us) {
      const le = u < 0.42 ? lerp(0.10, 0.24, u / 0.42) : lerp(0.24, -0.10, (u - 0.42) / 0.58);
      const te = u < 0.42 ? lerp(-0.36, -0.31, u / 0.42) : lerp(-0.31, -0.17, Math.pow((u - 0.42) / 0.58, 1.6));
      const col = [];
      for (const v of vs) col.push(vert(sx * lerp(0.06, 1, u), 0.02 + (detail ? 0.045 * Math.sin(Math.PI * v) * (1 - u) : 0), lerp(le, te, v), 0, 1, 0, u, v));
      grid.push(col);
    }
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < vs.length - 1; j++) idx.push(grid[i][j], grid[i + 1][j], grid[i][j + 1], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 2));
  g.setIndex(idx);
  return g;
}

// Far tier: two-triangle impostors. Each is the bat PROJECTED: the quad spans the wing axis and the screen axis
// across it, and the fragment shader draws the beating wing line as it would be seen from that side: from behind
// a thin M or V stroke, from above the plan chevron. Never thinner than about a pixel, never inflated past 2.6x.
// BAT_STROKE_GLSL is exported so a world can draw the same far bat on its own formation (the rare ring).
export const BAT_STROKE_GLSL = /* glsl */`
// q: quad coords (x along the span, -1..1; y across it, -1..1); W: sin/cos of the two wing joints;
// S: (bat up . quad up, heading . quad up, minimum half thickness in quad units). Returns (wing, body).
vec2 batStroke(vec2 q, vec4 W, vec3 S){
  float ax = abs(q.x) / max(.62 + .38 * W.z, .3);
  float x1 = min(ax, .45), x2 = max(ax - .45, 0.);
  float fh = W.x * x1 + W.y * x2;                                        // height of the wing line, bat space
  float k1 = clamp(ax / .42, 0., 1.), k2 = clamp((ax - .42) / .58, 0., 1.);
  float cc = mix(-.13, -.035, k1) - .10 * k2;                            // centre of the chord, bat space (along the heading)
  float hc = mix(.23, .275, k1) * (1. - .87 * k2);                       // half chord
  float yc = S.x * fh + S.y * cc;
  float th = max(abs(S.y) * hc, S.z), e = S.z * .8 + .012;
  float wing = (1. - smoothstep(th - e, th + e, abs(q.y - yc))) * (1. - smoothstep(.9, 1., ax));
  vec2 bq = vec2(q.x, q.y + S.y * .05) / vec2(.085 + S.z * .6, max(.34 * abs(S.y), .10) + S.z * .6);
  float body = 1. - smoothstep(.6, 1., dot(bq, bq));
  return vec2(wing, body);
}`;
const FAR_VERT = /* glsl */`
attribute vec4 aSeed; attribute vec3 aSeed2;
uniform float uPxK, uSize, uVar, uWinF, uFarS, uWinFade, uIn; uniform vec3 uFarK; uniform vec4 uKeyThin;
varying vec2 vQ; varying vec4 vW; varying vec3 vS; varying float vA, vRnd, vThrough, vIn;
#include <fog_pars_vertex>
${ROPE_GLSL}
uniform vec3 uGlowDir;
void main(){
  float rnd = aSeed.w; vec3 F;
  float sAbs = aSeed.x * uWinF + uTime * uSpeed * (1. - .5 * uVar + uVar * rnd);
  float sM = uFarS + mod(sAbs - uFarS + .5 * uWinF, uWinF) - .5 * uWinF;                // kept in a window of rope round the lens: a bat wraps from one end to the other, where it is faded out
  float fade = smoothstep(0., 30., sM) * (1. - smoothstep(uLen - uTail, uLen, sM)) * cutF(sM) * legGate(sM) * mix(1., 1. - smoothstep(.42 * uWinF, .5 * uWinF, abs(sM - uFarS)), uWinFade);
  vec3 p = batPos(sM, aSeed.y, aSeed.z, rnd, aSeed2.z, F);
  vec3 toL = uLens - p; float dist = length(toL); vec3 Vd = toL / max(dist, 1e-3);
  // From deep inside the cave the rope is seen end on where it runs out through the keyhole: hundreds of metres of
  // it pile up on a few degrees of sky. So while the lens is inside (uIn), of the bats that cross the keyhole or
  // have left it only a share is drawn, smaller the further out they are (uKeyThin = z where the thinning begins,
  // z where it is complete, the share kept at the mouth plane, the metres over which that share dies away outside),
  // each of them a little larger: a ragged thread of separate animals on the sky, not a clot that shuts the opening.
  float kh = uIn * smoothstep(uKeyThin.x, uKeyThin.y, p.z) * smoothstep(28., 105., dist);
  float keep = mix(1., uKeyThin.z * exp(-max(p.z, 0.) / max(uKeyThin.w, 1.)) + .003, kh);
  // Outside, where the rope runs toward the lens or away from it (the near side of a turn of the corkscrew, the leg
  // where it comes straight on), a long stretch of it stands on a small patch of sky and its bats would pile into
  // a clot. So beyond 90 m the share of the far bats that is drawn falls with the sine of the angle between the
  // rope and the line of sight: every stretch puts about the same number of bats on a degree of sky, and a turn
  // seen end-on stays a swarm of separate animals.
  keep *= mix(1., clamp(length(cross(F, Vd)) * 1.25, .22, 1.), (1. - uIn) * smoothstep(90., 220., dist));
  fade *= smoothstep(.7, 1.3, keep / max(fract(rnd * 91.7 + aSeed2.x * 3.3), 1e-3));
  vec3 Rb = normalize(cross(vec3(0., 1., 0.), F) + vec3(1e-4, 0., 0.)), Ub = cross(F, Rb);
  vec3 A2 = normalize(cross(Vd, Rb) + vec3(0., 1e-3, 0.)); if (dot(A2, Ub) < 0.) A2 = -A2;
  float k = clamp(dist * uPxK * uFarK.x, 1., uFarK.y * (1. + .7 * kh));
  float hs = uSize * 1.1 * (.85 + .3 * aSeed2.x) * k;
  vec3 lpos = p + (Rb * position.x + A2 * position.y) * hs;
  float ph = uTime * 56.5 * (.9 + .2 * aSeed2.x) + rnd * 62.8;
  float amp = 1. - .8 * smoothstep(.8, .97, sin(uTime * .8 + rnd * 50.));
  float a1 = amp * (.12 + .78 * sin(ph)), a2 = a1 + amp * (-.25 + .65 * sin(ph - 1.1));
  vQ = position.xy; vRnd = rnd; vW = vec4(sin(a1), sin(a2), cos(a1), cos(a2));
  vS = vec3(dot(Ub, A2), dot(F, A2), clamp(.6 * dist * uPxK / (4.889 * hs), .03, .5));
  vA = fade * smoothstep(24., 58., dist) / pow(k, uFarK.z);                  // the mid tier carries the nearest 25 m
  float th = max(dot(-Vd, uGlowDir), 0.); th *= th; th *= th; vThrough = th * th; vIn = 1. - smoothstep(-30., 18., p.z);
  vec4 mvPosition = modelViewMatrix * vec4(lpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FAR_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vW; varying vec3 vS; varying float vA, vRnd, vThrough, vIn;
uniform vec3 uBatCol, uFurCol, uBatAmb, uGlowCol, uSkyCol; uniform float uAmb, uOpen, uFarLit, uThruFar, uIn;
#include <fog_pars_fragment>
${BAT_STROKE_GLSL}
void main(){
  vec2 wb = batStroke(vQ, vW, vS);
  float a = max(wb.x, wb.y) * vA;
  if (a < .012) discard;
  vec3 base = uBatCol * (.75 + .5 * vRnd);
  vec3 col = base * uSkyCol * (uAmb * .45 * uOpen) + base * uGlowCol * .12 + uGlowCol * (wb.x * (1. - wb.y) * (.002 + uThruFar * vThrough) + uFarLit * uOpen);      // dark on the sky: no pale wing skin, or a flock on the moon reads as stars
  col += uFurCol * uBatAmb * (uIn * vIn * (.22 + .25 * vRnd));          // in the cave: the same soot-brown as the near bats, by the cave's bounce light
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// Smoke body: what the rope is when it is too far to be wings: a soft dark tube with strands winding round it,
// speck grain at middle distance and the same compression waves. Fades in from 22 m, a full body past 250 m.
const TUBE_VERT = /* glsl */`
attribute float aS, aAng, aStr; uniform float uIn; uniform vec4 uKeyThin;
varying vec3 vN, vPos; varying vec2 vSA; varying float vDen, vLeg;
#include <fog_pars_vertex>
${ROPE_GLSL}
void main(){
  float w = aS * uLen; vec4 c; vec3 T, N, B; ropeFrame(w, c, T, N, B);
  vec3 rad = N * cos(aAng) + B * sin(aAng);
  float lw = legW(w);
  // the smoke is thickest where the waves draw the bats apart, so the body carries the stretches the bats thin in
  float comp = 1. - (1. - .8 * lw) * (.225 * cos(.045 * w - .9 * uTime) + .275 * cos(.11 * w - 1.7 * uTime + 2.)) - lw * .324 * cos(.018 * w - .4 * uTime + 1.);
  float be = braidEnv(c.z), thin = step(.5, uBraid) * be;
  float r = c.w * mix(1.12, .78, thin) * (1. + .10 * sin(.03 * w - .6 * uTime) + .12 * sin(aAng * 3. + w * .09));
  float bp = w * .057 + aStr * 3.14159;
  vec3 lpos = c.xyz + (N * cos(bp) + B * sin(bp)) * (uBraid * be) + kinkOff(w) + swayOff(w, N, B) + rad * r;
  vN = rad; vPos = lpos; vSA = vec2(w, aAng); vLeg = lw;
  vDen = cutF(w) * legGate(w) * holeF(lpos) / max(comp, .4) * (1. - uIn * smoothstep(uKeyThin.x - 30., uKeyThin.y - 30., c.z));      // from inside, no smoke hangs in the keyhole
  vec4 mvPosition = modelViewMatrix * vec4(lpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TUBE_FRAG = /* glsl */`
varying vec3 vN, vPos; varying vec2 vSA; varying float vDen, vLeg;
uniform vec3 uBatCol, uGlowCol, uSkyCol, uGlowDir, uLens; uniform float uAmb, uOpen, uSmoke, uLen, uTime, uSpeed, uPulse, uFarLit, uTail, uTubeNear;
#include <fog_pars_fragment>
float h21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 toL = uLens - vPos; float dist = length(toL); vec3 V = toL / max(dist, 1e-3);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float ndv = abs(dot(N, V));
  float sc = vSA.x - uTime * uSpeed;
  float n = vnoise(vec2(sc * .05, vSA.y * 1.5 + sc * .03)) * .6 + vnoise(vec2(sc * .13, vSA.y * 3. - sc * .05)) * .4;   // long strands that wind round it
  float far = smoothstep(40., 190., dist);
  float grain = vnoise(vec2(sc * 1.3, vSA.y * 11.)) * .6 + vnoise(vec2(sc * 3.1 + 5., vSA.y * 23.)) * .4;            // speck grain at middle distance
  float den = ndv * ndv * (.5 + .9 * n) * vDen * mix(.5 + 1.1 * grain, .7 + .6 * vnoise(vec2(sc * .45, vSA.y * 6.)), smoothstep(110., 380., dist));
  float legK = clamp(vLeg, 0., 1.);
  den = mix(den, max(den, ndv * (.62 + .3 * n) * min(vDen, 1.)), legK);       // the leg that comes back has no thin places: one ribbon, ragged only at its edges
  // a haze behind the wings near, a body far; outside (uTubeNear) the near rope is bats alone, and on the leg that
  // comes back the body begins nearer (from 300 m), so it carries the stretches where the long wave thins the bats
  den *= mix(smoothstep(20., 64., dist), mix(smoothstep(380., 760., dist), smoothstep(300., 640., dist), legK), uOpen * uTubeNear) * mix(.85, 1.25, far) *
     smoothstep(0., 60., vSA.x) * (1. - smoothstep(uLen - uTail - 50., uLen - 10., vSA.x));
  if (uPulse > .5) den *= smoothstep(.35, .7, .5 + .5 * cos(6.28318 * uPulse * sc / uLen));
  float st = vnoise(vec2(sc * .8, vSA.y * 9.));
  den *= mix(1., .3 + 1.4 * st, (1. - ndv) * far);                        // far off its edge breaks into stipple, a swarm and not a cloud
  float a = clamp(den * uSmoke, 0., mix(.86, .94, smoothstep(300., 800., dist)));
  float sp = smoothstep(.3, .7, vnoise(vec2(sc * 2.3, vSA.y * 17.)) * .6 + vnoise(vec2(sc * 5.1 + 3., vSA.y * 37.)) * .4);
  a *= mix(1., mix(.25, .5, legK) + mix(.75, .5, legK) * sp, uOpen * uTubeNear * (1. - smoothstep(450., 1000., dist)));      // outside, at middle distance, the body is a speckle of bats with sky between, not a cloud
  if (a < .01) discard;
  float wrap = .5 + .5 * dot(N, uGlowDir);
  vec3 col = uBatCol * uSkyCol * (uAmb * .8 * uOpen) + uBatCol * uGlowCol * (.08 + .26 * wrap * wrap);
  col = col * .6 + uGlowCol * (uFarLit * uOpen * .6 * wrap);
  gl_FragColor = vec4(col, a);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1. - exp(-fogDensity * fogDensity * dist * dist);
    #else
      float ff = smoothstep(fogNear, fogFar, dist);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(ff, 0., 1.));
  #endif
}`;

// Bat hawks: three instances driven by uniform arrays (position + fold, heading + wing phase).
const HAWK_VERT = /* glsl */`
attribute float aI; attribute vec2 aWing; attribute float aWhite;
uniform vec4 uHawk[3]; uniform vec4 uHawkF[3]; uniform vec3 uHawkU[3]; uniform vec3 uLens; uniform float uPxK;
varying vec3 vN, vPos; varying float vWhite; varying vec2 vWing;
#include <fog_pars_vertex>
void main(){
  int i = int(aI + .5);
  vec3 P = uHawk[i].xyz; float fold = uHawk[i].w; vec3 F = normalize(uHawkF[i].xyz + vec3(0., 0., 1e-4)); float ph = uHawkF[i].w;
  vec3 Rb = normalize(cross(uHawkU[i], F) + vec3(1e-4, 0., 0.)), Ub = cross(F, Rb);          // banked: the world rolls its back toward the lens
  vec3 lp = position, ln = normal; float side = lp.x < 0. ? -1. : 1., d = abs(lp.x);
  if (aWing.x >= 0.) {
    float A1 = (1. - fold) * (.1 + .55 * sin(ph)) - fold * .25, A2 = A1 + (1. - fold) * .4 * sin(ph - 1.) - fold * .35;
    float d1 = clamp(d - .08, 0., .37), d2 = max(d - .45, 0.);
    float sw = fold * .8;                                   // hand swept back into a crescent
    lp.x = side * (.08 + cos(A1) * d1 + cos(A2) * d2 * cos(sw));
    lp.y += sin(A1) * d1 + sin(A2) * d2;
    lp.z -= d2 * sin(sw) + fold * d1 * .25;
    float A = mix(A1, A2, step(.45, d)); ln = vec3(-side * sin(A), cos(A), 0.);
  }
  float dist = length(P - uLens);
  vec3 lpos = P + (Rb * lp.x + Ub * lp.y + F * lp.z) * (.95 * clamp(dist * uPxK * 1.2, 1., 3.));
  vN = Rb * ln.x + Ub * ln.y + F * ln.z; vPos = lpos; vWhite = aWhite; vWing = aWing;
  vec4 mvPosition = modelViewMatrix * vec4(lpos, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const HAWK_FRAG = /* glsl */`
varying vec3 vN, vPos; varying float vWhite; varying vec2 vWing;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  vec3 V = normalize(uLens - vPos + vec3(1e-4, 0., 0.));
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N, V) < 0.) N = -N;
  float ndv = abs(dot(N, V)), fres = 1. - ndv; fres *= fres * fres;
  float wrap = .5 + .5 * dot(N, uGlowDir);
  vec3 amb = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.333))), .5) * uAmb;
  vec3 col = vec3(.011, .011, .013) * amb * (.5 + .5 * N.y) * (.25 + .75 * uOpen) + uGlowCol * (fres * smoothstep(.02, .3, ndv) * wrap * wrap * .09);   // black, a thin rim toward the glow
  // the pale flashes that read from behind: the white throat wrapping round as a collar, and a grey bar across the base of the primaries
  float bar = step(0., vWing.x) * smoothstep(.43, .5, vWing.x) * (1. - smoothstep(.6, .68, vWing.x)) * smoothstep(.06, .25, vWing.y) * (1. - smoothstep(.7, .95, vWing.y));
  float pale = max(smoothstep(.3, .7, vWhite), .6 * bar);
  col += pale * vec3(.62, .64, .6) * (amb * (.10 * (.3 + .7 * uOpen)) + uGlowCol * (.10 + .25 * wrap));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function hawkGeometry() {
  const pos = [], nor = [], wing = [], white = [], idx = [];
  const vert = (x, y, z, nx, ny, nz, u, v, w = 0) => { pos.push(x, y, z); nor.push(nx, ny, nz); wing.push(u, v); white.push(w); return pos.length / 3 - 1; };
  const prof = [[0.40, 0.004], [0.345, 0.03], [0.28, 0.062], [0.20, 0.058], [0.08, 0.092], [-0.12, 0.086], [-0.28, 0.05], [-0.36, 0.022]], sides = 6, rings = [];
  for (const [z, r] of prof) {
    const ring = [];
    for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2 + Math.PI / sides, c = Math.cos(a), s = Math.sin(a); ring.push(vert(c * r, s * r * 0.9, z, c, s, 0, -1, 0, ((s < 0.6 && z > 0.10 && z < 0.34) || (z > 0.24 && z < 0.32)) ? 1 : 0)); }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < sides; k++) { const a = rings[i][k], b = rings[i][(k + 1) % sides], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % sides]; idx.push(a, c, b, b, c, d); }
  // tail: a short square-ended fan
  const t = [vert(-0.05, 0.01, -0.28, 0, 1, 0, -1, 0), vert(0.05, 0.01, -0.28, 0, 1, 0, -1, 0), vert(-0.18, 0.0, -0.68, 0, 1, 0, -1, 0), vert(0, 0.012, -0.74, 0, 1, 0, -1, 0), vert(0.18, 0.0, -0.68, 0, 1, 0, -1, 0)];
  idx.push(t[0], t[2], t[3], t[0], t[3], t[1], t[1], t[3], t[4]);
  const us = [0, 0.2, 0.4, 0.58, 0.76, 0.9, 1], vs = [0, 0.5, 1];
  for (const sx of [-1, 1]) {
    const grid = [];
    for (const u of us) {
      const le = 0.14 + 0.10 * Math.sin(u * 2.2) - 0.42 * u * u, ch = 0.30 * Math.pow(1 - u, 0.75) + 0.02;
      const col = []; for (const v of vs) col.push(vert(sx * lerp(0.08, 1, u), 0.02 + 0.03 * Math.sin(Math.PI * v) * (1 - u), le - ch * v, 0, 1, 0, u, v));
      grid.push(col);
    }
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < vs.length - 1; j++) idx.push(grid[i][j], grid[i + 1][j], grid[i][j + 1], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 2));
  g.setAttribute('aWhite', new THREE.Float32BufferAttribute(white, 1));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------
// The source: an authored keyhole mouth (95 x 120 m) in a slab of limestone, its right edge (-X, the
// right hand when flying out) stepped into overhangs, its lip hung with stalactites that lean to the light.
function mouthOutline(noise) {
  const raw = [], hw = (y) => 47.5 * (0.60 + 0.40 * smoothstep(-5, 62, y));
  const bump = (y, c, h, a) => a * smoothstep(c - h, c, y) * (1 - smoothstep(c, c + 0.22 * h, y));       // shelf with an undercut above
  const steps = (y) => bump(y, 96, 15, 5.5) + bump(y, 80, 13, 9.5) + bump(y, 63, 9, 4.5) + bump(y, 51, 12, 7) + bump(y, 30, 16, 4);
  for (let i = 0; i <= 16; i++) { const y = lerp(-14, 72, i / 16); raw.push([hw(y), y]); }
  for (let i = 1; i < 44; i++) { const a = (i / 44) * Math.PI; raw.push([47.5 * Math.cos(a) * (1 + 0.05 * Math.sin(a * 2)), 72 + 48 * Math.sin(a)]); }
  for (let i = 0; i <= 16; i++) { const y = lerp(72, -14, i / 16); raw.push([-hw(y), y]); }
  for (const p of raw) if (p[0] < 0) p[0] += steps(p[1]) * smoothstep(0, -12, p[0]);
  // resample evenly, add slow lumpiness
  const arc = [0]; for (let i = 1; i < raw.length; i++) arc.push(arc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const NA = 200, out = []; let j = 0;
  for (let k = 0; k <= NA; k++) {
    const a = (k / NA) * arc[arc.length - 1]; while (j < raw.length - 2 && arc[j + 1] < a) j++;
    const f = clamp((a - arc[j]) / Math.max(1e-4, arc[j + 1] - arc[j]), 0, 1);
    const x = lerp(raw[j][0], raw[j + 1][0], f), y = lerp(raw[j][1], raw[j + 1][1], f);
    const l = Math.hypot(x, y - 55) || 1, w = noise.fbm2(x * 0.035 + 7, y * 0.035, 3) * 2.6 * smoothstep(-14, 10, y);
    out.push(V3(x + (x / l) * w, Math.min(120.5, y + ((y - 55) / l) * w), 0));
  }
  return out;
}

async function buildMouth(ctx, pal, shared, lipDark = 0) {
  const { rng, noise } = ctx, group = new THREE.Group();
  const outline = mouthOutline(noise), NA = outline.length - 1;
  const cRock = new THREE.Color(pal[4]).multiplyScalar(0.34), cDeep = new THREE.Color(pal[1]).multiplyScalar(0.42), cDark = new THREE.Color(pal[0]).multiplyScalar(2.2),
    cMoss = new THREE.Color(pal[5]).multiplyScalar(1.5), cWarm = new THREE.Color(pal[6]).multiplyScalar(1.6), tmp = new THREE.Color();
  // ring profile through the rock: [offset along outward normal, z]
  const prof = [[4, -36], [2.2, -22], [0.6, -8], [0, 0], [3.5, 3.2], [9, 2.2], [17, -1], [27, -3.5], [39, -6.5], [53, -10], [68, -14], [82, -19], [88, -36], [4, -36]];
  const skyY = (x) => 152 + 24 * noise.fbm2(x * 0.011, 1.7, 3) + 9 * noise.fbm2(x * 0.06, 8.1, 2) - 0.0016 * x * x;
  const NR = prof.length, pos = new Float32Array((NA + 1) * NR * 3), col = new Float32Array((NA + 1) * NR * 3), idx = [];
  const nrm = [];
  for (let a = 0; a <= NA; a++) { const p = outline[Math.max(0, a - 2)], q = outline[Math.min(NA, a + 2)]; const tx = q.x - p.x, ty = q.y - p.y, l = Math.hypot(tx, ty) || 1; nrm.push([-ty / l, tx / l]); }
  // the outline runs from +X base over the top to -X base, so (-ty, tx) points outward? check with the first point
  const sgn = (nrm[0][0] * outline[0].x) > 0 ? 1 : -1;
  for (let a = 0; a <= NA; a++) {
    await ctx.yield?.();
    const o = outline[a], nx = nrm[a][0] * sgn, ny = nrm[a][1] * sgn;
    for (let r = 0; r < NR; r++) {
      let [off, z] = prof[r];
      const far = smoothstep(20, 80, off);
      // near the lip the rings follow the outline; further out they run to a wall with a ragged skyline
      const dx0 = o.x, dy0 = o.y - 48, dl = Math.hypot(dx0, dy0) || 1, ux = dx0 / dl, uy = dy0 / dl;
      const wx = 122 + 16 * noise.fbm2(a * 0.045, 3.3, 3), tOut = Math.min(wx / Math.max(Math.abs(ux), 1e-3), uy > 0.05 ? 140 / uy : 1e6);
      const ex = ux * tOut, ey = Math.min(48 + uy * tOut, skyY(ex)), f2 = Math.max(0, (off - 12) / 76), on = Math.min(off, 12);
      let x = o.x + nx * on * (1 - f2) + (ex - o.x) * f2, y = o.y + ny * on * (1 - f2) + (ey - o.y) * f2;
      if (o.y > 78 && r >= 2 && r <= 5) z += 5.5 * smoothstep(78, 112, o.y) * (r === 3 || r === 4 ? 1 : 0.5);     // the brow overhangs
      const big = noise.fbm3(x * 0.022, y * 0.022, z * 0.03 + 5, 4), strata = Math.abs(((y * 0.11 + big * 1.6) % 1 + 1) % 1 - 0.5) * 2;
      const amp = r === 3 ? 0.5 : lerp(1.3, 2.6, far);
      const ledge = smoothstep(0.30, 0.42, strata), flute = Math.abs(Math.sin(x * 0.19 + big * 2.2));
      const dz = (r > 3 && r < NR - 2) ? big * amp * 1.4 + (ledge - 0.5) * 2.2 * smoothstep(3, 14, off) + flute * 1.2 * far : 0;
      x += nx * big * amp * 0.7; y += ny * big * amp * 0.7; z += dz;
      if (r < NR - 1) y = Math.max(y, -14);
      const i3 = (a * NR + r) * 3; pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
      // colour: pale limestone, deep jade-grey flowstone streaks down the face, moss on ledges and the crown, dark throat
      const streak = smoothstep(0.05, 0.55, noise.fbm2(x * 0.09 + 30, y * 0.012, 3) * 0.5 + 0.5);
      tmp.copy(cRock).lerp(cDeep, streak * 0.8).lerp(cWarm, smoothstep(0.2, 0.7, noise.n3(x * 0.03, y * 0.03, 9)) * 0.25);
      tmp.lerp(cMoss, smoothstep(0.45, 0.95, strata) * 0.55 * smoothstep(2, 14, off) + far * 0.5 * smoothstep(0.1, 0.9, ny));
      tmp.multiplyScalar(0.78 + 0.4 * (big * 0.5 + 0.5));
      if (r < 3 || r === NR - 1) tmp.multiplyScalar(r === 2 ? 0.05 : 0.02);     // the throat is a dark frame; the world's cave tube meets it here
      else if (r === 3 && lipDark > 0) tmp.lerp(cDark, lipDark);
      col[i3] = tmp.r; col[i3 + 1] = tmp.g; col[i3 + 2] = tmp.b;
    }
  }
  for (let a = 0; a < NA; a++) for (let r = 0; r < NR - 1; r++) { const i0 = a * NR + r, i1 = i0 + NR; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
  await ctx.yield?.();
  // make sure the faces point out of the rock: the summed face normal at one lip vertex (ring 6) must face +Z
  {
    const kv = Math.floor(NA / 2) * NR + 6; let nz = 0;
    for (let i = 0; i < idx.length; i += 3) {
      const ia = idx[i], ib = idx[i + 1], ic = idx[i + 2]; if (ia !== kv && ib !== kv && ic !== kv) continue;
      const cx = pos[ic * 3] - pos[ib * 3], cy = pos[ic * 3 + 1] - pos[ib * 3 + 1], ax = pos[ia * 3] - pos[ib * 3], ay = pos[ia * 3 + 1] - pos[ib * 3 + 1];
      nz += cx * ay - cy * ax;
    }
    if (nz < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  }
  // crisp limestone facets: one flat normal per triangle, written out in slices so the page never stalls
  const rock = new THREE.BufferGeometry();
  {
    const nT = idx.length / 3, fp = new Float32Array(nT * 9), fc = new Float32Array(nT * 9), fn = new Float32Array(nT * 9);
    for (let t = 0; t < nT; t++) {
      if ((t & 2047) === 2047) await ctx.yield?.();
      const ia = idx[t * 3] * 3, ib = idx[t * 3 + 1] * 3, ic = idx[t * 3 + 2] * 3, o = t * 9;
      for (let k = 0; k < 3; k++) { fp[o + k] = pos[ia + k]; fp[o + 3 + k] = pos[ib + k]; fp[o + 6 + k] = pos[ic + k]; fc[o + k] = col[ia + k]; fc[o + 3 + k] = col[ib + k]; fc[o + 6 + k] = col[ic + k]; }
      const cx = pos[ic] - pos[ib], cy = pos[ic + 1] - pos[ib + 1], cz = pos[ic + 2] - pos[ib + 2], ax = pos[ia] - pos[ib], ay = pos[ia + 1] - pos[ib + 1], az = pos[ia + 2] - pos[ib + 2];
      let nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (let k = 0; k < 9; k += 3) { fn[o + k] = nx; fn[o + k + 1] = ny; fn[o + k + 2] = nz; }
    }
    rock.setAttribute('position', new THREE.BufferAttribute(fp, 3)); rock.setAttribute('color', new THREE.BufferAttribute(fc, 3)); rock.setAttribute('normal', new THREE.BufferAttribute(fn, 3));
  }
  await ctx.yield?.();

  // stalactites: carrot-shaped, ribbed, leaning toward the light (+Z); tips never below y 108.6 over the flight line
  const parts = [rock], stGeo = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V3();
  let lipTipY = 200; const roots = [];
  const lipIdx = []; for (let a = 0; a <= NA; a++) if (outline[a].y > 74) lipIdx.push(a);
  const NST = 118;
  for (let i = 0; i < NST; i++) {
    if ((i & 3) === 3) await ctx.yield?.();
    const a = lipIdx[Math.floor(rng() * lipIdx.length)], o = outline[a], ny = nrm[a][1] * sgn, nx = nrm[a][0] * sgn;
    const depth = rng() < 0.45 ? rng.range(2.5, 8.5) : rng.range(-30, 1);              // on the brow, or back up the throat
    const zz = depth > 0 ? depth : depth, back = depth < 0 ? (-depth / 40) : 0;
    const top = smoothstep(0.1, 0.95, ny);
    let len = lerp(2.2, 12, Math.pow(rng(), 1.7)) * (0.35 + 0.65 * top);
    const px = o.x + nx * (0.8 + back * 3.2), py = o.y + ny * (0.8 + back * 3.2) + 0.6;
    if (Math.abs(px) < 17) len = Math.min(len, py - 109.2);
    if (len < 1.2) continue;
    const g = new THREE.CylinderGeometry(1, 0.02, 1, 6, 4, true), gp = g.attributes.position, seedA = rng.range(0, 6.28);
    for (let v = 0; v < gp.count; v++) {
      const y = gp.getY(v), t = 0.5 - y, ang = Math.atan2(gp.getZ(v), gp.getX(v));          // t: 0 root .. 1 tip
      const rr = (Math.pow(1 - t, 1.5) * 0.9 + 0.1 * (1 - t)) * (1 + 0.22 * Math.sin(ang * 3 + seedA) + 0.12 * Math.sin(t * 17 + seedA));
      gp.setXYZ(v, Math.cos(ang) * rr, y - 0.5, Math.sin(ang) * rr);
    }
    const w = len * rng.range(0.07, 0.12) + 0.25;
    e.set(-rng.range(0.10, 0.26), rng.range(0, 6.28), rng.range(-0.06, 0.06), 'XYZ'); q.setFromEuler(e); sc.set(w, len, w);
    m4.compose(V3(px, py, zz), q, sc); g.applyMatrix4(m4);
    const cc = new Float32Array(gp.count * 3), wet = rng.range(0.7, 1.25);
    for (let v = 0; v < gp.count; v++) { const t = clamp((py - gp.getY(v)) / len, 0, 1); tmp.copy(cRock).lerp(cDeep, 0.35 + 0.5 * t).multiplyScalar(wet * (depth < 0 ? 0.55 : 1)); cc[v * 3] = tmp.r; cc[v * 3 + 1] = tmp.g; cc[v * 3 + 2] = tmp.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.deleteAttribute('uv');
    const gn = g.toNonIndexed(); gn.computeVertexNormals(); stGeo.push(gn);
    if (Math.abs(px) < 17) lipTipY = Math.min(lipTipY, py - len);
  }
  for (let i = 0; i < 40; i++) {                                                           // liana and fig-root roots on the lip
    const a = lipIdx[Math.floor(rng() * lipIdx.length)], o = outline[a];
    let len = rng.range(10, 25); if (Math.abs(o.x) < 18) len = Math.min(len, o.y - 109.5);
    if (len > 2.5) roots.push({ x: o.x, y: o.y + 1.5, z: rng.range(4, 9) + 5.5 * smoothstep(78, 112, o.y), len });
  }
  await ctx.yield?.();
  const geo = mergeGeometries(parts.concat(stGeo), false);
  await ctx.yield?.();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; group.add(mesh);

  // lianas: ribbons that never go thinner than ~1.5 px, swinging from the lip
  const SEG = 12, lp = [], la = [], li = [];
  roots.forEach((r, k) => {
    const ph = rng.range(0, 6.28), bow = rng.range(-1, 1);
    for (let s = 0; s <= SEG; s++) for (const sd of [-1, 1]) { lp.push(r.x, r.y, r.z); la.push(s / SEG, sd, r.len, ph + bow * 0.001); }
    for (let s = 0; s < SEG; s++) { const b = k * (SEG + 1) * 2 + s * 2; li.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  });
  if (roots.length) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aL', new THREE.Float32BufferAttribute(la, 4)); lg.setIndex(li);
    const lm = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: shared.uTime, uLens: shared.uLens, uPxK: shared.uPxK, uGlowCol: shared.uGlowCol, uSkyCol: shared.uSkyCol, uAmb: shared.uAmb,
        uCol: { value: new THREE.Color(pal[5]).lerp(new THREE.Color(pal[6]), 0.5) } },
      vertexShader: /* glsl */`
        attribute vec4 aL; uniform float uTime, uPxK; uniform vec3 uLens; varying float vT;
        #include <fog_pars_vertex>
        void main(){
          float t = aL.x, len = aL.z, ph = aL.w; float sw = t * t * len;
          vec3 p = position + vec3(sin(uTime * .55 + ph) * .075 * sw + sin(t * 7. + ph) * .35, -t * len, cos(uTime * .41 + ph * 1.7) * .06 * sw + cos(t * 5. + ph) * .3);
          vec3 toL = uLens - p; float dist = length(toL);
          vec3 sd = normalize(cross(toL / max(dist, 1e-3), vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.));
          p += sd * aL.y * max(.07 * (1.6 - t), dist * uPxK * .16);
          vT = t;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol, uGlowCol, uSkyCol; uniform float uAmb; varying float vT;
        #include <fog_pars_fragment>
        void main(){ vec3 col = uCol * (uSkyCol * uAmb * .5 + uGlowCol * .5) * (.7 + .5 * sin(vT * 40.) * sin(vT * 40.)); gl_FragColor = vec4(col, 1.); 
          #include <fog_fragment>
        }`,
    });
    const lm2 = new THREE.Mesh(lg, lm); lm2.frustumCulled = false; group.add(lm2);
  }
  return { group, outline, lipTipY: Math.min(lipTipY, 119) };
}

// ---------------------------------------------------------------------------------------------------
const HOURS = {
  afterglow: { glow: null, glowI: 1.5, sky: null, amb: 3.2, thin: 1 },
  day: { glow: '#ff9a52', glowI: 3.2, sky: '#8fb6e8', amb: 4.5, thin: 1 },
  golden: { glow: '#ff8a3c', glowI: 3.4, sky: '#86a8dc', amb: 4.0, thin: 1, farLit: 0.05 },      // farLit: the low sun lights the rope's body copper down its glow side
  night: { glow: '#c8d6f4', glowI: 1.2, sky: '#3a548a', amb: 1.25, thin: 1, farLit: 0.002, thruFar: 0.012, bat: '#30313a' },    // full moon: the rope at full strength, dark on the moonlit sky, wing skin silver against the moon
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('rope') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PAL;
  const hour = HOURS[opts.hour] || HOURS.afterglow, form = opts.form || 'rope';
  const detail = ctx.quality?.detail ?? 1, dens = clamp(opts.density ?? 1, 0.5, 1.3) * hour.thin;
  const object = new THREE.Group(); object.name = 'deer-cave-exodus-rope';

  const L = buildLine(rng, opts), len = L.length, WIN = Math.min(len / 2, opts.window ?? 340), WINF = Math.min(len, opts.farWindow ?? len), farLead = opts.farLead ?? 0;
  await ctx.yield?.();
  const fly = buildFlyThrough(L);
  await ctx.yield?.();

  const spinHand = rng.chance(0.5) ? 1 : -1, K = form === 'pulses' ? 8 : 0;
  const glowDir = V3(-0.91, 0.07, 0.40).normalize();
  const capA = [0, 1, 2, 3].map(() => new THREE.Vector4(0, -999, 0, 0)), capB = [0, 1, 2, 3].map(() => new THREE.Vector4(0, -999, 0, 0));
  const U = {
    uLine: { value: L.tex }, uLen: { value: len }, uTime: { value: 0 }, uSpeed: { value: 16 }, uVar: { value: K ? 0.02 : 0.3 },
    uTwist: { value: spinHand * (Math.PI * 2 / rng.range(120, 170)) }, uSpin: { value: spinHand * rng.range(0.18, 0.3) },
    uBraid: { value: form === 'braid' ? 8.5 : 0 }, uPulse: { value: K },
    uCapA: { value: capA }, uCapB: { value: capB },
    uKink: { value: [0, 1, 2].map(() => new THREE.Vector4(-999, 0, 22, 0)) }, uKinkDir: { value: [0, 1, 2].map(() => V3(1, 0, 0)) },
    uLens: { value: V3(0, 96, -380) }, uCut: { value: new THREE.Vector2(0, 0) }, uLeg: { value: V3(1e9, 1e9, 1) }, uSway: { value: new THREE.Vector4(0, 0, 0, 0) }, uKeyThin: { value: new THREE.Vector4(-140, -30, 1, 1e6) }, uWin: { value: WIN }, uCamS: { value: WIN / 2 }, uPxK: { value: 0.013 }, uSize: { value: 0.225 },
    uSqF: { value: V3(0, 0, 1) }, uSqV: { value: V3(0, 0, 1) }, uSqP: { value: V3(0, 96, -380) }, uPark: { value: 0 }, uSpread: { value: 0 }, uSqPh: { value: 0 },
    uFurCol: { value: new THREE.Color().setRGB(0.051, 0.0465, 0.043) }, uBatAmb: { value: new THREE.Color(0.95, 0.93, 0.92) }, uBatAmbOut: { value: new THREE.Color(0.3, 0.34, 0.5) }, uDif: { value: 0.5 }, uIn: { value: 0 },      // near and mid bats: soot-brown fur, the light of the air round them
    uWinF: { value: WINF }, uFarS: { value: WINF / 2 }, uWinFade: { value: WINF < len - 1 ? 1 : 0 }, uFarK: { value: V3(...(opts.farScale || [1, 2.6, 1.1])) }, uMidK: { value: new THREE.Vector2(...(opts.midScale || [1, 2.2])) }, uTubeNear: { value: opts.tubeNear ? 1 : 0 },
    uBatCol: { value: new THREE.Color(pal[6]).lerp(new THREE.Color(hour.bat || pal[6]), hour.bat ? 0.7 : 0) },      // by moonlight the umber goes to slate: no rust on a wing seen edge-on
    uGlowCol: { value: new THREE.Color(hour.glow || pal[3]).multiplyScalar(hour.glowI) },
    uSkyCol: { value: new THREE.Color(hour.sky || pal[2]) }, uGlowDir: { value: glowDir.clone() },
    uAmb: { value: hour.amb }, uOpen: { value: 1 }, uRim: { value: 0.2 }, uThru: { value: 0.05 }, uFarLit: { value: hour.farLit || 0 }, uThruFar: { value: hour.thruFar ?? 0.02 }, uSmoke: { value: 0.95 * Math.min(1, dens * 1.1) }, uTail: { value: opts.tail ?? 60 },
    uHawk: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 300, 0, 0)) }, uHawkF: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 0)) }, uHawkU: { value: [0, 1, 2].map(() => V3(0, 1, 0)) },
  };
  const mk = (vertexShader, fragmentShader, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader, fragmentShader, fog: true, ...extra });
  const add = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; object.add(m); return m; };
  const inst = (g, n, fill) => {
    const a = new Float32Array(n * 4), b = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) fill(i, a, b);
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aSeed2', new THREE.InstancedBufferAttribute(b, 3));
    g.instanceCount = n; return g;
  };
  // one rule for every bat on the rope: station, radius fraction (dense core, ragged edge), angle
  const seedBat = (kPulse) => (i, a, b) => {
    const strand = form === 'braid' ? (rng() < 0.5 ? 0 : 1) : 0;
    let s0 = rng(), rf = Math.sqrt(rng()) * (0.70 + 0.62 * Math.pow(rng(), 3)), th = rng() * Math.PI * 2;
    if (kPulse) { const c = Math.floor(rng() * kPulse); s0 = (c + 0.5 + 0.13 * rng.gauss()) / kPulse; rf = 0.82 + 0.3 * rng(); if (c % 2) th = rng() * 3.6; }
    if (form === 'braid') rf *= 0.68;
    a[i * 4] = ((s0 % 1) + 1) % 1; a[i * 4 + 1] = rf; a[i * 4 + 2] = th; a[i * 4 + 3] = rng();
    b[i * 3] = rng(); b[i * 3 + 1] = 0; b[i * 3 + 2] = strand;
  };

  // far tier
  const nFar = Math.min(opts.maxFar ?? 26000, Math.round((opts.far ?? 23000) * dens * detail)), nMid = Math.min(opts.maxMid ?? 4000, Math.round((opts.mid ?? 4200) * dens * detail));
  const fq = new THREE.InstancedBufferGeometry();
  fq.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); fq.setIndex([0, 1, 2, 0, 2, 3]);
  inst(fq, nFar, seedBat(K));
  add(fq, mk(FAR_VERT, FAR_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 3);
  await ctx.yield?.();
  // mid tier (kept in a window of rope round the camera, fading to nothing at its ends, so nothing pops)
  add(inst(batGeometry(0), nMid, seedBat(K / 2)), mk(BAT_VERT, BAT_FRAG, { side: THREE.DoubleSide }), 1);
  // near tier: the squadron round the lens (60 bats holding stations in the view)
  if (opts.squadron !== false) {
    // Stations in the frame of the view: [degrees left, degrees up, metres]. Eight near ones, 8 to 15% of the frame
    // across, placed whole inside the picture and clear of its middle (where the keyhole, the moon and the ring stand);
    // the rest a loose flock 7 to 19 m out, all inside the frame, none within 9 degrees of its middle.
    const DG = Math.PI / 180, nearSt = [[-15, 7, 3.5], [18, -8, 4.1], [-28, -11, 4.9], [27, 10, 5.3], [6, 16, 4.6], [-9, -16, 5.1], [-34, 13, 6.1], [35, -14, 5.9]];
    // Outside the cave the same eight take open-air stations: four of them 2.5 to 3.3 m off, one in each quarter of
    // the frame (9 to 12% of its height, whole inside it, clear of the middle where the moon and the ring stand),
    // four more at 4.4 to 5.6 m; the loose flock closes up by a fifth.
    const outSt = [[-23, 12, 2.7], [24, -13, 2.5], [-27, -14, 3.3], [26, 14, 3.1], [-12, 20, 4.8], [9, -19, 4.4], [-33, 3, 5.6], [32, -3, 5.3]], NSQ = 60, aOut = new Float32Array(NSQ * 3);
    // Twenty more that beat close round the lens in the cave, 1.2 to 4.5 m by their stations (the clear space the rope
    // keeps round the lens sets them a little further out), all of them off the middle of the view where the keyhole
    // stands, each whole in the frame but the last two, whose wingtips cross its lower corners. Outside the cave they
    // fall back into the loose flock, 8 to 16 m out.
    const closeSt = [[-27, 6, 2.9], [29, -5, 3.2], [-38, -9, 2.4], [40, 8, 2.7], [-23, 22, 3.6], [24, -23, 3.3], [-36, 21, 4.2], [37, -21, 4.0], [-44, 2, 3.5], [45, -3, 3.8],
      [-30, -22, 3.0], [31, 23, 3.1], [-12, 26, 4.4], [13, -27, 4.1], [-41, 24, 4.5], [42, -25, 4.3], [-25, -15, 3.9], [26, 15, 4.2], [-44, -28.5, 1.9], [44.5, -28, 2.1]];
    const g = inst(batGeometry(1), NSQ, (i, a, b) => {
      let az, el, d;
      if (i < nearSt.length) [az, el, d] = nearSt[i];
      else if (i >= 40) [az, el, d] = closeSt[i - 40];
      else { do { az = rng.range(-40, 40); el = rng.range(-21, 24); } while (Math.hypot(az, el) < 9); d = lerp(7, 19, Math.pow(rng(), 1.3)); }
      const x = Math.sin(az * DG) * Math.cos(el * DG) * d, y = Math.sin(el * DG) * d, z = Math.cos(az * DG) * Math.cos(el * DG) * d;
      a[i * 4] = x; a[i * 4 + 1] = y; a[i * 4 + 2] = z; a[i * 4 + 3] = rng();
      b[i * 3] = rng(); b[i * 3 + 1] = (i < 2 || i === 4 || i === 5) ? 1 : 0; b[i * 3 + 2] = 0;
      if (i < outSt.length) { const [oa, oe, od] = outSt[i]; aOut[i * 3] = Math.sin(oa * DG) * Math.cos(oe * DG) * od; aOut[i * 3 + 1] = Math.sin(oe * DG) * od; aOut[i * 3 + 2] = Math.cos(oa * DG) * Math.cos(oe * DG) * od; }
      else if (i >= 40) {
        const oa = az * 0.8 + rng.range(-5, 5), oe = Math.max(el * 0.7, -12) + rng.range(-3, 5), od = rng.range(8, 16);
        aOut[i * 3] = Math.sin(oa * DG) * Math.cos(oe * DG) * od; aOut[i * 3 + 1] = Math.sin(oe * DG) * od; aOut[i * 3 + 2] = Math.cos(oa * DG) * Math.cos(oe * DG) * od;
      } else { aOut[i * 3] = x * 0.8; aOut[i * 3 + 1] = y * 0.8; aOut[i * 3 + 2] = z * 0.8; }
    });
    g.setAttribute('aOut', new THREE.InstancedBufferAttribute(aOut, 3));
    add(g, mk(BAT_VERT, BAT_FRAG, { side: THREE.DoubleSide, defines: { SQUAD: 1 } }), 1);
  }
  await ctx.yield?.();
  // smoke body
  {
    const NSTR = form === 'braid' ? 2 : 1, SL = form === 'braid' ? 240 : 340, SR = 12, s = [], a = [], st = [], ix = [], p = [];
    for (let k = 0; k < NSTR; k++) {
      const o = k * (SL + 1) * (SR + 1);
      for (let i = 0; i <= SL; i++) for (let j = 0; j <= SR; j++) { s.push(i / SL); a.push((j / SR) * Math.PI * 2); st.push(k); p.push(0, 0, 0); }
      for (let i = 0; i < SL; i++) for (let j = 0; j < SR; j++) { const b = o + i * (SR + 1) + j; ix.push(b, b + SR + 1, b + 1, b + 1, b + SR + 1, b + SR + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1)); g.setAttribute('aAng', new THREE.Float32BufferAttribute(a, 1)); g.setAttribute('aStr', new THREE.Float32BufferAttribute(st, 1)); g.setIndex(ix);
    add(g, mk(TUBE_VERT, TUBE_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), 2);
  }
  // hawks
  const nHawk = clamp(Math.round(opts.hawks ?? 3), 0, 3);
  if (nHawk) { const g = hawkGeometry(); g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2]), 1)); g.instanceCount = nHawk; add(g, mk(HAWK_VERT, HAWK_FRAG, { side: THREE.DoubleSide }), 1); }
  await ctx.yield?.();

  // the mouth
  let mouth = null;
  if (opts.mouth !== false) { mouth = await buildMouth(ctx, pal, U, opts.lipDark ?? 0); object.add(mouth.group); }
  const outline = mouth ? mouth.outline : mouthOutline(ctx.noise);
  await ctx.yield?.();

  // mist floor: a stand-in for the steaming canopy so the rope reads dark on pale (the world replaces it)
  if (opts.mistFloor !== false) {
    const g = new THREE.PlaneGeometry(1, 1, 1, 1); g.rotateX(-Math.PI / 2);
    const m = add(g, new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uGlowCol: U.uGlowCol, uGlowDir: U.uGlowDir, uMist: { value: new THREE.Color(pal[4]) }, uDeep: { value: new THREE.Color(pal[5]) } },
      vertexShader: /* glsl */`
        varying vec2 vQ; varying vec3 vL;
        #include <fog_pars_vertex>
        void main(){ vQ = position.xz; vL = (modelMatrix * vec4(position, 1.)).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec3 vL; uniform float uTime; uniform vec3 uGlowCol, uGlowDir, uMist, uDeep;
        #include <fog_pars_fragment>
        float h21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main(){
          float r = length(vQ) * 2.;
          vec2 q = vL.xz * .011 + vec2(uTime * .012, uTime * .007);
          float n = vn(q) * .5 + vn(q * 2.3 + 7.) * .3 + vn(q * 5.1 - uTime * .02) * .2;
          float bank = smoothstep(.28, .72, n);
          vec3 col = mix(uDeep * .55, uMist * .6, bank) + uGlowCol * (.10 * bank * (.5 - .5 * normalize(vL + vec3(1e-3)).x));
          gl_FragColor = vec4(col, 1. - smoothstep(.55, 1., r));
          #include <fog_fragment>
        }`,
    }), 0);
    m.scale.set(2600, 1, 2600); m.position.set(40, 44, 150);
  }

  // strikes: where each hawk goes through the rope, by path progress
  const flyArc = [0]; for (let i = 1; i < fly.length; i++) flyArc.push(flyArc[i - 1] + fly[i].distanceTo(fly[i - 1]));
  const flyAt = (u, out = V3(), tan = null) => {
    const a = clamp(u, 0, 1) * flyArc[fly.length - 1]; let i = 0; while (i < fly.length - 2 && flyArc[i + 1] < a) i++;
    if (tan) tan.copy(fly[i + 1]).sub(fly[i]).normalize();
    return out.copy(fly[i]).lerp(fly[i + 1], clamp((a - flyArc[i]) / Math.max(1e-4, flyArc[i + 1] - flyArc[i]), 0, 1));
  };
  const strikeSpec = [[0.44, 7, 0.85, 0.42, -0.28, 0], [0.48, 10, -0.62, 0.5, -0.6, 0], [0.53, 11, -0.8, 0.52, 0.22, -4]];
  const strikes = strikeSpec.map(([u, ahead, l, f, up, dy]) => {
    const t = V3(), at = flyAt(u, V3(), t).addScaledVector(t, ahead); at.y += dy;
    const left = V3().crossVectors(UP, t).normalize();
    return { u, at, dir: V3().addScaledVector(left, l).addScaledVector(t, f).addScaledVector(UP, up).normalize(), w: 0.045, span: 110, fwd: null, speed: 22, secs: 2.7, home: null, hole: 'wake', holeR: 4.3, pitch: 0 };
  });
  const hawkState = strikes.map((s, i) => ({ k: 0, lastK: 0, tKink: -1e6, sKink: 0, prev: V3(0, 300, 0), F: V3(0, 0, 1), circ: rng.range(0, 6.28) + i * 2.1 }));
  let progress = null, parkP = null, parkF = null, winS = null, winF = null, sqHead = null, sqFollow = 0.75;
  const lensClear = opts.lensClear ?? 1.3;                // metres round the lens kept clear of the rope's bats
  const tA = V3(), tB = V3(), tC = V3(), side = V3(), hU = V3();
  const stoop = (i, k, out) => {
    const s = strikes[i]; side.crossVectors(s.dir, UP).normalize();
    const hi = smoothstep(0.6, 1, k), q = 0.25 + 0.75 * s.span / 110;
    return out.copy(s.at).addScaledVector(s.dir, (k - 0.45) * s.span).addScaledVector(UP, (hi * hi * 22 + (1 - smoothstep(0, 0.3, k)) * 14) * q)
      .addScaledVector(side, Math.sin(k * 9) * (1 - smoothstep(0.05, 0.3, k)) * 16 * q);
  };

  const inv = new THREE.Matrix4(), res = new THREE.Vector2(), lens = U.uLens.value, camF = V3(0, 0, 1);
  function update(dt, time, camera) {
    U.uTime.value = time;
    object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
    if (camera) {
      lens.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      const ce = camera.matrixWorld.elements; camF.set(-ce[8], -ce[9], -ce[10]).transformDirection(inv);
      ctx.renderer?.getDrawingBufferSize(res);
      const resY = res.y > 8 ? res.y : 720, p11 = camera.projectionMatrix.elements[5] || 1.6;
      U.uPxK.value = 4.4 / (resY * p11 * 0.45);
    }
    const sN = L.stationNear(lens);
    const cs = winS !== null ? winS : sN * len;
    U.uCamS.value = clamp(cs, WIN / 2 - 40, len - WIN / 2 + 40);
    U.uFarS.value = clamp(winS !== null && winF !== null ? winF : cs + farLead, Math.min(len / 2, WINF / 2 - 60), Math.max(len / 2, len - WINF / 2 + 60));
    if (sqHead) U.uSqF.value.copy(sqHead);
    else { L.centerAt(sN + 0.004, tA).sub(L.centerAt(sN - 0.004, tB)); if (tA.lengthSq() > 1e-6) U.uSqF.value.copy(tA.normalize()); }
    if (parkP) { U.uSqP.value.copy(parkP); U.uSqF.value.copy(parkF); U.uSqV.value.copy(parkF); U.uPark.value = 1; }
    else { U.uSqP.value.copy(lens); U.uPark.value = 0; U.uSqV.value.copy(U.uSqF.value).lerp(camF, sqFollow).normalize(); }      // stations ride with the view, three parts in four (setLight's follow)
    capA[3].set(lens.x, lens.y, lens.z, lensClear); capB[3].set(lens.x, lens.y, lens.z, 0);
    for (let i = 0; i < 3; i++) {
      const h = hawkState[i], s = strikes[i];
      let k;
      if (progress !== null) k = clamp((progress - (s.u - 0.45 * s.w)) / s.w, 0, 1);
      else { const c = ((time + 7.1 + i * 3) / 9) % 1; k = clamp(c * 4.1, 0, 1); }
      if (i >= nHawk) k = 0;
      if (k >= 0.45 && h.lastK < 0.45) { h.tKink = time; h.sKink = L.stationNear(s.at) * len; }
      if (k < 0.45 && h.lastK >= 0.45 && progress !== null) h.tKink = -1e6;
      h.lastK = k; h.k = k;
      // circling high between strikes, blending into the stoop line and out of the flare
      const ca = time * 0.22 + h.circ, blend = smoothstep(0, 0.12, k) * (1 - smoothstep(0.9, 1, k));
      const hm = s.home || s.at;
      tA.set(hm.x + Math.cos(ca) * 46, hm.y + 46 + 6 * Math.sin(ca * 2.3), hm.z + 30 + Math.sin(ca) * 46);
      stoop(i, k, tB); tA.lerp(tB, blend);
      tC.copy(tA).sub(h.prev); if (dt > 0 && tC.lengthSq() > 1e-8) h.F.lerp(tC.normalize(), 1 - Math.pow(0.5, dt * 60)).normalize();      // eased by the clock step (half the way in a sixtieth of a second), so it turns alike on any screen and holds while the clock stands
      if (blend > 0.6) {
        stoop(i, k + 0.01, tC).sub(tB);                                   // the crossing, in the strike's own frame
        if (s.fwd) tC.multiplyScalar(100 / Math.max(s.secs, 0.5)).addScaledVector(s.fwd, s.speed);     // plus that frame's travel
        if (tC.lengthSq() > 1e-8) h.F.copy(tC.normalize());
        if (s.pitch) { h.F.y += lerp(-s.pitch, s.pitch * 0.7, smoothstep(0.56, 0.8, k)); h.F.normalize(); }      // nose down in the stoop, up in the flare
        if (s.aim) h.F.copy(s.aim).normalize();                                                                  // the world aims it (a heading in the lens's own frame)
      }
      h.prev.copy(tA);
      const fold = (s.foldMax ?? 0.72) * smoothstep(0.1, 0.28, k) * (1 - smoothstep(0.56, 0.72, k));
      U.uHawk.value[i].set(tA.x, i < nHawk ? tA.y : -9999, tA.z, fold); U.uHawkF.value[i].set(h.F.x, h.F.y, h.F.z, time * 11 + i * 2);
      // bank: roll its back toward the lens while it is in front of it, so the crescent of the planform shows
      tC.copy(lens).sub(tA).normalize(); hU.set(0, 1, 0).lerp(tC, clamp((s.bank || 0) * blend, 0, 1));
      hU.addScaledVector(h.F, -hU.dot(h.F)); if (hU.lengthSq() < 1e-4) hU.set(0, 1, 0);
      U.uHawkU.value[i].copy(hU.normalize());
      // the hole: a capsule from just ahead of the hawk back along its line, tapering to nothing (the wake heals)
      const R = s.holeR * smoothstep(0.22, 0.38, k) * (1 - smoothstep(0.72, 0.98, k));
      if (s.hole === 'view') {                                             // a window of sky round the hawk, as seen from the lens
        // a cone from the lens through the hawk and on through the rope behind it: everything in it bursts aside
        tC.copy(tA).sub(lens); const dl = tC.length() || 1; tC.multiplyScalar(1 / dl);
        const ta = (s.holeTan ?? 0.23) * smoothstep(0.22, 0.38, k) * (1 - smoothstep(0.72, 0.98, k)), n0 = Math.min(2.2, dl * 0.4), n1 = s.holeLen ?? 85;
        capA[i].set(lens.x + tC.x * n0, lens.y + tC.y * n0, lens.z + tC.z * n0, ta * n0);
        capB[i].set(lens.x + tC.x * n1, lens.y + tC.y * n1, lens.z + tC.z * n1, ta * n1);
      } else {
        stoop(i, Math.min(k + 0.03, 1), tB); capA[i].set(tB.x, tB.y, tB.z, R);
        stoop(i, Math.max(k - 0.42, 0.18), tB); capB[i].set(tB.x, tB.y, tB.z, R * 0.15);
      }
      // the kink it leaves: launched at the strike, running down the rope like a flicked whip, dying over a few seconds
      const age = time - h.tKink, kv = U.uKink.value[i];
      if (age >= 0 && age < 14) { kv.set(h.sKink + 58 * age, 7.5 * smoothstep(0, 0.3, age) * Math.exp(-age / 2.6), 20 + 3 * age, 0); U.uKinkDir.value[i].copy(s.dir); }
      else kv.set(-999, 0, 22, 0);
    }
  }
  update(0, 0, null);

  const seat = L.seat, left = V3().crossVectors(UP, L.dir).normalize();
  const hero = {
    object, radius: 46, height: 60, center: V3(0, 93, 125),
    anchors: {
      mouth: { position: V3(0, 60, 0), width: 95, height: 120, normal: V3(0, 0, 1) },
      mouthOutline: outline, lipTipY: mouth ? mouth.lipTipY : 108.6,
      flyThrough: fly,
      portalSeat: { position: seat.clone(), facing: L.dir.clone().negate(), direction: L.dir.clone(), radius: 7, tiltDeg: 3 },
      notchLeft: seat.clone().addScaledVector(left, 10), notchRight: seat.clone().addScaledVector(left, -10),
      viewpoints: { keyhole: fly[0].clone(), corkscrew: fly[7].clone(), threshold: fly[14].clone(), flank: fly[19].clone(), notch: seat.clone().addScaledVector(L.dir, -60) },
      strikes, ropeSource: L.centerAt(0), ropeEnd: L.centerAt(1), glowDir: glowDir.clone(),
    },
    strikes, uniforms: U, length: len, form,
    centerAt: L.centerAt, stationNear: L.stationNear, ropeRadiusAt: L.radiusAt,
    setCut(station, halfWidth) { U.uCut.value.set(station, halfWidth); },      // metres along the rope; halfWidth 0 = whole
    // park the squadron round a fixed point and heading (a world does this while it is seen through a portal, u = 0); null frees it
    setPark(p, f) { parkP = p || null; parkF = f || null; },
    setWindow(s, farS) { winS = (s === null || s === undefined) ? null : s; winF = (farS === null || farS === undefined) ? null : farS; },
    setMouthVisible(v) { if (mouth) mouth.group.visible = !!v; },      // the rock frame, its stalactites and lianas: a world hides them once the lens has left the cave and looks away
    setSway(up, side, s0, grow) { U.uSway.value.set(up, side, s0, 1 / Math.max(grow, 1)); },      // the rope's slow undulation outside: metres up and down, metres side to side, from station s0 (metres), grown in over `grow` metres
    setKeyThin(z0, z1, share, die) { U.uKeyThin.value.set(z0, z1, share, die); },                  // seen from inside the cave: the far bats that cross the keyhole (z0..z1 and beyond) are thinned to `share` at the mouth plane, dying away over `die` metres outside
    setLeg(a, b, k) { U.uLeg.value.set(a, b, k); },      // stations (metres) between which the rope is not drawn, and the strength (0..1) of what lies beyond the second
    setSquadHeading(v) { sqHead = v || null; },
    setProgress(u) { progress = (u === null || u === undefined) ? null : clamp(u, 0, 1); },
    setLight(o = {}) {
      if (o.glowDir) U.uGlowDir.value.copy(o.glowDir).normalize();
      if (o.glowColor) U.uGlowCol.value.copy(o.glowColor);
      if (o.skyColor) U.uSkyCol.value.copy(o.skyColor);
      if (o.ambient !== undefined) U.uAmb.value = o.ambient;
      if (o.open !== undefined) U.uOpen.value = o.open;
      if (o.rim !== undefined) U.uRim.value = o.rim;
      if (o.through !== undefined) U.uThru.value = o.through;
      if (o.spread !== undefined) U.uSpread.value = o.spread;
      if (o.batAmb) U.uBatAmb.value.copy(o.batAmb);
      if (o.batAmbOut) U.uBatAmbOut.value.copy(o.batAmbOut);
      if (o.dif !== undefined) U.uDif.value = o.dif;
      if (o.inside !== undefined) U.uIn.value = o.inside;
      if (o.follow !== undefined) sqFollow = o.follow;
      if (o.phase !== undefined) U.uSqPh.value = o.phase;
    },
    update,
    dispose() { L.tex.dispose(); },
    ground: false, groundY: 0,
  };
  object.userData.api = hero;
  return hero;
}
