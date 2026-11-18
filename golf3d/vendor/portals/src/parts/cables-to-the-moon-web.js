// CABLES TO THE MOON: everything spun.
//   makeCables()   the main cable and the others, each a rope of twisted strands tied into the ring; the main one's
//                  foot splays into seven great roots that grip the hill's crown; their roots follow
//                  the forest as it falls away, the rest is fixed; the main one dips and thrums under the climber's
//                  hands; the others hang slack, each by its own amount, and sway out of step
//   makeHub()      the ring, pulled out of round toward every cable tied into it and knotted there, and inside it
//                  the orb of web (drawn in a fragment shader: spokes, ONE spiral, a torn sector, beads, caught fluff)
//   makeStrands()  guys at the cable's foot, the strands that run on from the ring and twist into one hair that
//                  reaches the Moon, loose web adrift in the air
//   makeCableHair() seed-hair and moss hanging under the main cable and under the others where they come in to the ring
import * as THREE from 'three';
import { cmStream, CM_GLSL, CM_RIBBON, DIP_GLSL, withShared, Geo, bound, CABLE_L, CABLE_FALL, cableRadius, peakH, C, clamp, lerp, sstep, ROPE_BARK } from './cables-to-the-moon-common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z), TAU = Math.PI * 2;

// ---------------------------------------------------------------- rope
// position: a point on the centre line; normal: the direction of this vertex round it.
// aK: how much of the forest's fall this point shares, radius, sway (m), s on the main cable (or -1)
// aT: length along (m), angle round, phase.   aAx: the direction of the rope here.
const ROPE_VERT = /* glsl */`
attribute vec4 aK; attribute vec3 aT, aAx; attribute vec2 aD;
uniform vec3 uCN, uLay;
varying vec3 vW, vN, vAround, vT; varying vec2 vRf;
${CM_GLSL}
${DIP_GLSL}
void main(){
  vec3 c = position;
  c.y -= cmDrop(c.xz)*aK.x;
  vec3 sw = cross(aAx, vec3(0.0, 1.0, 0.0)); sw /= max(length(sw), 1e-4);
  c += sw*aK.z*sin(uTime*0.31 + aT.z*6.2831853)*(0.6 + 0.4*sin(uTime*0.13 + aT.z*40.0));
  // (aD.x: how much of the cable's dip a point is spared: 0 on the cable, 1 on a root out on the hill)
  if (aK.w >= 0.0) c += uCN*cmCableDip(aK.w)*(1.0 - aD.x);
  vec4 mv = viewMatrix*vec4(c, 1.0);
  // A ROPE IS SOLID ALONG ITS WHOLE LENGTH: it is never drawn narrower than 1.6 pixels (0.8 of a pixel to each
  // side of its middle), and it is NOT dimmed toward the air behind it: where it grows thin far off its surface
  // goes to its own mean colour by the pixel's footprint (cmPx, in the fragment), never paler than itself
  float r = max(aK.y, uPx*0.8*max(-mv.z, 0.1));
  // THE STRANDS STAND ROUND in the rope's own outline where its mesh follows the lay (aD.y: how deep the
  // grooves between them are cut, as a share of the radius)
  float lay = fract(aT.y/6.2831853*uLay.x + aT.x/uLay.y + uLay.x/6.2831853*(0.2*sin(aT.y*2.0 + 1.0) + 0.1*sin(aT.y*3.0 + 4.0)));
  r *= 1.0 - aD.y*(1.0 - sqrt(clamp(lay*(1.0 - lay)*4.0, 0.0, 1.0)));
  vW = c + normal*r; vN = normal; vAround = cross(aAx, normal); vT = aT; vRf = vec2(aK.y, aK.x);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
// THE ROPE'S SURFACE, mapped in the rope's own metres along it and round it (a strand's width is its share of the
// rope's own girth there), so nothing stretches: strands as thick as trees side by side in a long twist, a deep
// dark groove between them; each strand a twist of yarns, each yarn fibre; moss in the grooves, a creeper
// winding up it against the lay with leaves on it (low down: to uLow.x metres up the rope), and the fine white
// threads wound on it higher up (from uLow.y metres up). It takes the sun and the sky's light as the body does.
const ROPE_FRAG = /* glsl */`
#define CM_FOLLOW vRf.y
uniform vec3 uRopeA, uRopeB, uRopeMoss; uniform vec3 uLay;     // strands, metres per turn, how much old pale web is wrapped on it
uniform vec2 uLow;
varying vec3 vW, vN, vAround, vT; varying vec2 vRf;
${CM_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  float l = vT.x, th = vT.y, rad = max(vRf.x, 0.05), px = cmPx(vW);      // the pixel's footprint on the rope (antialiasing)
  float lod = 1.0 - smoothstep(0.2, 1.2, px);                              // the strands' relief, grooves and glint go to their mean under it
  vec3 q3 = vec3(l, cos(th)*rad, sin(th)*rad);                 // the point in the rope's own metres
  // the lay: which strand, and where across it
  // (THE STRANDS ARE OF UNLIKE THICKNESS: round the rope they are from a third to five thirds of the common one)
  float layv = th/6.2831853*uLay.x + l/uLay.y + uLay.x/6.2831853*(0.2*sin(th*2.0 + 1.0) + 0.1*sin(th*3.0 + 4.0)), lay = fract(layv), ks = floor(layv);
  float sw = 6.2831853*rad/max(uLay.x, 1.0);
  vec2 sm = vec2(l, (lay - 0.5)*sw);
  float round_ = sqrt(clamp(lay*(1.0 - lay)*4.0, 0.0, 1.0)), groove = clamp(1.0 - round_, 0.0, 1.0);
  // yarns 0.8 m thick twisted the other way in each strand, and fibre in each yarn: each is there while it is
  // more than a pixel or two across
  float wY = 1.0 - smoothstep(0.25, 0.9, px/0.8), wF = 1.0 - smoothstep(0.25, 0.9, px/0.25);
  float yarn = fract(sm.y/0.8 - sm.x/5.5 + ks*0.37), yRound = sqrt(clamp(yarn*(1.0 - yarn)*4.0, 0.0, 1.0));
  float fib = 0.6*cmN(vec2(sm.x*0.35 + ks*7.3, sm.y*5.0 + ks*3.1)) + 0.4*cmN(vec2(sm.x*1.3 + ks*1.7, sm.y*17.0));
  // (round Q, R6 a: THE ROPE CLOSE TO. Beside it the finest thing was a fibre a quarter of a metre across and
  // metres long, so from 18 m it was soft streaks. Now each yarn is hair-fine fibre as well, 6 cm and 2 cm
  // across, in lengths of one to three metres, raised and furrowed: there while a pixel is under a few
  // centimetres of the rope, at its mean beyond)
  float wH = 1.0 - smoothstep(0.25, 0.9, px/0.07);
  float hairF = 0.6*cmN(vec2(sm.x*0.9 + ks*2.3, sm.y*48.0 + ks*5.7)) + 0.4*cmN(vec2(sm.x*2.7 + ks*9.1, sm.y*150.0));
  vec3 n = normalize(vN + vAround*((0.5 - lay)*1.9*lod + (0.5 - yarn)*0.9*wY + (hairF - 0.5)*0.9*wH));
  // old patches, pale web wrapped round and round
  float patch_ = smoothstep(0.5, 0.7, cmN3(q3*vec3(0.035, 0.09, 0.09) + 3.0));
  float wrap = smoothstep(0.42, 0.62, cmN3(q3*vec3(0.09, 0.06, 0.06) + 21.0))*uLay.z;
  float wline = 0.86 + 0.14*sin(l*7.0 + th*3.0 + 11.0*cmN(vec2(l*0.5, 2.0)));
  float lowK = uLow.x > 0.0 ? 1.0 - smoothstep(0.3*uLow.x, uLow.x, l) : 0.0;
  float highK = uLow.y > 0.0 ? smoothstep(uLow.y, 2.2*uLow.y, l) : 0.0;
  float under = smoothstep(-0.1, 0.7, -n.y);
  float moss = clamp(under*smoothstep(0.3, 0.7, cmN3(q3*0.11 + 5.0) + 0.25*under)
    + lowK*smoothstep(0.25, 0.8, groove + 0.6*cmN3(q3*0.23 + 9.0) - 0.15), 0.0, 1.0);
  vec3 alb = mix(uRopeA, uRopeB, patch_*0.7);
  alb *= (0.45 + 0.8*mix(0.5, fib, wF))*(1.0 + 0.7*(hairF - 0.5)*wH);
  alb *= 0.8 + 0.4*cmN3(q3*vec3(0.05, 0.2, 0.2) + 1.0);
  alb = mix(alb, mix(uRopeMoss, vec3(0.2, 0.4, 0.1), lowK)*(0.6 + 0.8*cmN3(q3*0.8)), moss*0.8*(1.0 - wrap));
  alb = mix(alb, vec3(0.5, 0.54, 0.44)*wline, wrap*0.16);                 // (old web on it: a faint paler tone, never bands)
  // the creeper: three stems as thick as an arm winding up against the lay, in leaf
  float cv = th/6.2831853*3.0 - l/23.0 + 0.3*cmN(vec2(l*0.11, 3.0));
  float dvn = abs(fract(cv) - 0.5)*6.2831853*rad/3.0;          // metres from the nearest stem
  float stem = (1.0 - smoothstep(0.16, 0.2 + px, dvn))*lowK;
  float leafy = (1.0 - smoothstep(0.5, 1.5 + px, dvn))*smoothstep(0.42, 0.56, cmN3(q3*0.75 + 13.0))*lowK;
  alb = mix(alb, vec3(0.26, 0.52, 0.12)*(0.6 + 0.9*cmN3(q3*2.6)), leafy*0.9);
  alb = mix(alb, vec3(0.1, 0.12, 0.06), stem*0.9);
  // the white threads: a few strays, each wandering its own way up the rope, in lengths (never a regular hatch)
  float tv = th/6.2831853*3.0 + l/7.3 + 1.3*cmN(vec2(l*0.09, 5.0)) + 0.4*cmN(vec2(l*0.31, th + 9.0));
  float thread = 1.0 - smoothstep(0.02, 0.03 + px/1.7, abs(fract(tv) - 0.5));
  thread = mix(thread, 0.1, smoothstep(0.15, 0.6, px/1.7))*smoothstep(0.46, 0.66, cmN3(q3*vec3(0.045, 0.12, 0.12) + 40.0))*highK;
  alb = mix(alb, vec3(0.6, 0.66, 0.52), thread*0.6);
  float ndl = dot(n, uSunDir), diff = clamp((ndl + 0.3)/1.3, 0.0, 1.0);
  // lit by the sun on one side, by the sky's colour at its own height, and from below by the bright roof of the
  // forest: a lit side and a shadow side, never a black bar against the sky
  vec3 bounce = cmBounceL*vec3(0.42, 0.47, 0.3)*dot(uSunCol, vec3(0.33))*0.8*clamp(0.6 - 0.4*n.y, 0.0, 1.0);
  // (under the footprint the grooves' shade and the yarns' go to their own means, 0.315 and 0.903: a far rope
  // has the light of a near one)
  float ao = (1.0 - 0.85*mix(0.315, smoothstep(0.0, 0.6, groove), lod)*(1.0 - wrap))*mix(0.903, 0.55 + 0.45*yRound, wY)*(1.0 - 0.35*leafy*(1.0 - stem));
  vec3 col = alb*0.72*(cmSunL*cmLitL(ndl)*0.75 + cmAmb(n)*0.6 + bounce)*ao;
  // sap: it glistens where it has run down the grooves
  vec3 h = uSunDir + v; h /= max(length(h), 1e-3);
  // (under the footprint the glint goes to its mean over the strands' own turn: a fifth of it, as broad as they turn)
  float wet = smoothstep(0.45, 0.8, cmN3(q3*vec3(0.07, 0.12, 0.12) + 11.0))*(0.3 + 0.7*mix(0.215, groove, lod));
  col += cmSunL*mix(0.2*pow(clamp(dot(normalize(vN), h), 0.0, 1.0), 5.0), pow(clamp(dot(n, h), 0.0, 1.0), 70.0), lod)*wet*0.35;
  // seed-hair stands off the fibre and catches the low sun: along the edge, and all over a rope that lies toward
  // the sun from us (a far web is fine bright lines there)
  float toward = clamp(dot(-v, uSunDir), 0.0, 1.0);
  // (mend T, T3: THE RIM IS LIGHT CAUGHT IN THE SEED-HAIR, THIN, BROKEN, UNEVEN, and by the sun's direction:
  // where the rope stands toward the sun from the eye, and a tenth of that on its sun side elsewhere; in
  // lengths of a metre or two (the hair's own pattern, at its mean under the footprint); never an even
  // pale edge down both sides of a rope, which it was (half of it at every bearing))
  float hairB = 2.0*mix(0.45, smoothstep(0.3, 0.75, cmN3(q3*vec3(0.35, 1.1, 1.1) + 23.0)), lod);
  float rim = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 3.0)*(0.1*clamp(ndl + 0.5, 0.0, 1.0) + 0.8*toward*toward)*hairB;
  col += cmSunL*vec3(0.75, 0.8, 0.55)*(rim*(0.16 + 0.04*wrap) + 0.022*pow(toward, 6.0) + thread*0.08*toward*toward);
  col = cmDeepL(col, 0.8 + 0.25*ao);              // (mend T, T3: never a flat black bar; the common part)
  col = cmAir(col, vW);
  gl_FragColor = vec4(col, 1.0);
}`;

// a rope along a list of centre points [{ p: Vector3, r, follow, sway, s, l, nodip }]: pushed into G. twist: radians
// a metre by which the rings turn so that the mesh follows the lay; lobe: how deep the grooves are cut
function pushRope(G, pts, sides, phase, closed = false, twist = 0, lobe = 0) {
  const n = pts.length, base = G.count, ax = V(0, 0, 0), up = V(0, 1, 0), a = V(0, 0, 0), b = V(0, 0, 0), ref = V(0, 0, 0);
  for (let i = 0; i < n; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)].p, p1 = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)].p;
    ax.subVectors(p1, p0).normalize();
    // a frame that does not twist: carry the first reference along
    if (i === 0) { ref.copy(Math.abs(ax.y) > 0.9 ? V(1, 0, 0) : up); if (pts[0].ref) ref.copy(pts[0].ref); }
    a.crossVectors(ax, ref).normalize(); b.crossVectors(a, ax).normalize(); ref.copy(b);
    const q = pts[i];
    for (let k = 0; k <= sides; k++) {
      const th = (k / sides) * TAU - twist * q.l, c = Math.cos(th), s = Math.sin(th);
      G.set('aK', q.follow ?? 0, q.r, q.sway ?? 0, q.s ?? -1); G.set('aT', q.l, th, phase); G.set('aAx', ax.x, ax.y, ax.z); G.set('aD', q.nodip ?? 0, lobe);
      G.v(q.p.x, q.p.y, q.p.z, a.x * c + b.x * s, a.y * c + b.y * s, a.z * c + b.z * s);
    }
  }
  G.stitch(base, n, sides);
  if (closed) { const last = base + (n - 1) * (sides + 1); for (let k = 0; k < sides; k++) { const A = last + k, B = base + k; G.i.push(A, B, A + 1, A + 1, B, B + 1); } }
}

// THE RING IS NOT ROUND. Every cable tied into it pulls it out toward itself: ties = [{ ang, pull }] (the angle of
// the tie round the ring, and how far out it is drawn, as a share of the radius). The ring's radius at an angle:
export function ringRadius(R, ties, ang) {
  let k = 1;
  for (const t of ties) { let d = ang - t.ang; d -= TAU * Math.round(d / TAU); k += t.pull * Math.exp(-d * d / 0.05); }
  return R * k;
}
export const ringPoint = (CABLE, ties, ang, out = V(0, 0, 0)) => { const HUB = CABLE.hub, r = ringRadius(HUB.R, ties, ang); return out.copy(HUB.H).addScaledVector(CABLE.X, Math.cos(ang) * r).addScaledVector(CABLE.n, Math.sin(ang) * r); };

// the great roots of the cable's foot (see makeCables): the points of each, dealt from the stream rr. cut: how
// many go under the hill short of their length for the road's keep-clear; least: the nearest any comes to the road
export function footRoots(CABLE, pk, path, rr, KEEP) {
  const roots = { list: [], made: 0, cut: 0, least: Infinity };
  for (let k = 0; k < 7; k++) {
    const phi = ((k + rr.range(-0.3, 0.3)) / 7) * TAU, sk = rr.range(5, 19), len = rr.range(34, 66), thick = rr.range(0.85, 1.15), wig = rr.range(-0.7, 0.7), kink = rr.range(0, TAU);
    const hd = V(Math.cos(phi), 0, Math.sin(phi)), rad = hd.clone().addScaledVector(CABLE.d, -hd.dot(CABLE.d)).normalize(), R0 = CABLE.radius(sk), f0 = CABLE.fall(sk), pts = [];
    pts.push({ p: CABLE.at(sk + 9, 0, 0).addScaledVector(rad, R0 * 0.4), r: 1.3 * thick, follow: f0, s: sk + 9, l: 0 });
    pts.push({ p: CABLE.at(sk + 3, 0, 0).addScaledVector(rad, R0 * 0.8), r: 2.3 * thick, follow: f0, s: sk + 3, l: 6 });
    pts.push({ p: CABLE.at(sk - 3, 0, 0).addScaledVector(rad, R0), r: 2.8 * thick, follow: f0, s: sk - 3, l: 12 });
    let lm = 12, last = pts[2].p;
    for (let j = 0; j <= 12; j++) {
      const q = j / 12, rho = 9 + q * len, a = phi + wig * q * q + 0.14 * Math.sin(q * 7 + kink), x = pk.x + Math.cos(a) * rho, z = pk.z + Math.sin(a) * rho;
      const r = (3.0 * (1 - 0.82 * q) * (1 + 0.14 * Math.sin(q * 13 + k * 2)) + 0.3) * thick, y = peakH(pk, x, z) + r * 0.3 - 3 * q * q, gap = path ? path.distanceTo(x, y, z) - r : Infinity;
      if (gap < KEEP) { roots.cut++; break; }
      roots.least = Math.min(roots.least, gap);
      const p = V(x, y, z); lm += p.distanceTo(last); last = p;
      pts.push({ p, r, follow: 1, s: 0, l: lm, nodip: Math.min(1, (j + 1) / 3) });
    }
    // its end goes under the hill
    const e = pts[pts.length - 1], dn = e.p.clone().sub(pts[pts.length - 2].p).normalize().multiplyScalar(3); dn.y = -(e.r + 5);
    pts.push({ p: e.p.clone().add(dn), r: e.r * 0.8, follow: e.follow, s: e.s, l: lm + 6, nodip: e.nodip ?? 0 });
    roots.list.push(pts); roots.made++;
  }
  return roots;
}
// peaks: [{ x, z, h, r, p, thick }] (the first is ours). grips: the uniform array the climber writes. rng: its stream
// rootRng, path, keep: the great roots of the foot, their stream, the road and its one keep-clear on the hill
const LAY = [7, 19, 0.25];                     // strands, metres to one strand's turn, old web
// THE OTHER CABLES' DEAL (stream 'cables'), apart from their meshes so that the report's sweep can deal another
// visit's cables without building them: where each is tied into the ring and how hard it pulls (ours first: it
// meets the rim at the upper right), its thickness, how slack it hangs, how far it sways.
export function dealCables(CABLE, peaks, rng) {
  const HUB = CABLE.hub, ties = [{ ang: Math.atan2(-HUB.m, -HUB.x), pull: 0.09 }], others = [];
  for (let c = 1; c < peaks.length; c++) {
    const pk = peaks[c], T = V(pk.x, pk.h, pk.z), rel = V(0, 0, 0).subVectors(T, HUB.H);
    // no two alike: its thickness, how slack it hangs, how far it sways, how hard it pulls on the ring
    const k = { T, ang: Math.atan2(rel.dot(CABLE.n), rel.dot(CABLE.X)), thick: (pk.thick ?? 7) * rng.range(0.55, 1.35), slack: rng.range(0.035, 0.085), amp: rng.range(2, 5), phase: rng(), pull: rng.range(0.03, 0.11) };
    others.push(k); ties.push({ ang: k.ang, pull: k.pull });
  }
  for (const k of others) { k.E = ringPoint(CABLE, ties, k.ang); k.len = k.T.distanceTo(k.E); k.sag = k.len * k.slack; }
  return { ties, others };
}
// a point of another cable as it hangs in still air, q 0 (its hill) .. 1 (the ring); near the ring the land's
// fall has no part in it (it follows the forest only over its lower 60 percent)
export const cableStill = (k, q, out = V(0, 0, 0)) => { out.lerpVectors(k.T, k.E, q); out.y -= k.sag * 4 * q * (1 - q); return out; };
export function makeCables(ctx, shared, o) {
  const G = new Geo({ aK: 4, aT: 3, aAx: 3, aD: 2 }), rng = cmStream(shared, o.rng, 'cables', ctx, !!o.quiet), CABLE = shared.cable, HUB = CABLE.hub;
  const { ties, others } = dealCables(CABLE, o.peaks, rng);
  // ---- the main cable: from the rim of the ring down to the hill's top, where it turns down into the hill (its
  // last 30 m, below its foot: the course above the foot is the frame's); its first 15 percent follows the
  // forest. Its mesh follows the lay (56 round: eight to a strand), so the strands stand round in its outline.
  // (Q2: ITS FIRST STRETCH FROM THE ROOT IS BUILT FINE, by the rope's own place: a ring every 1.5 m from its end
  // under the hill to 90 m up it, where it bends and is thickest, then every 10 m; 56 sides, eight to a strand)
  // (mend V, V1: ITS RINGS, ITS COURSE, ITS GIRTH AND ITS SHARE OF THE LAND'S FALL ARE THE FRAME'S (the common part's
  // makeFrame: stations, course, girth, fall), said there once, so that the hands that hold it stand by the same
  // sums: the same rings and numbers as before, to the digit)
  { const pts = [];
    for (const s of CABLE.stations) pts.push({ p: CABLE.course(s), r: CABLE.girth(s), follow: CABLE.fall(s), sway: 0, s: Math.max(s, 0), l: s });
    pts[0].ref = CABLE.n; pushRope(G, pts, 56, 0, false, TAU / (LAY[0] * LAY[1]), 0.2); }
  // ---- THE FOOT IS A ROOT. Seven great strands leave the lay of the rope over its first 20 m, each on the side
  // of it that faces its own bearing round the hill (a seventh of the round apart, give or take), come down on
  // the hill's crown and grip it, running out 34 to 66 m down the slope and going under the leaves: what holds
  // the web to the world. Each is 5 to 6 m thick where it leaves the rope. The road's one rule on the hill: no
  // root comes nearer it than o.keep (22 m): one that would goes into the hill short of that. No root has an
  // end in the open: every one ends under the hill's surface.
  // (the viewer's bare rope, o.quiet, has no hill and no roots; every other caller's roots take the stream 'collar')
  const roots = o.quiet ? { list: [], made: 0, cut: 0, least: Infinity } : footRoots(CABLE, o.peaks[0], o.path, cmStream(shared, o.rootRng, 'collar', ctx), o.keep ?? 22);
  // (G3 b: a root is ROUND and has no elbow: its mesh follows a smooth curve through its dealt points, three
  // rings to each stretch, 14 sides; the dealt points and the road's keep-clear are as they were)
  const smooth = (pts) => { const out = [], n = pts.length, P = (i) => pts[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < 3; j++) { const u = j / 3, a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2), u2 = u * u, u3 = u2 * u;
      const w0 = -0.5 * u3 + u2 - 0.5 * u, w1 = 1.5 * u3 - 2.5 * u2 + 1, w2 = -1.5 * u3 + 2 * u2 + 0.5 * u, w3 = 0.5 * u3 - 0.5 * u2;
      const p = V(0, 0, 0).addScaledVector(a.p, w0).addScaledVector(b.p, w1).addScaledVector(c.p, w2).addScaledVector(d.p, w3);
      out.push({ p, r: lerp(b.r, c.r, u), follow: lerp(b.follow, c.follow, u), s: lerp(b.s, c.s, u), l: lerp(b.l, c.l, u), nodip: lerp(b.nodip ?? 0, c.nodip ?? 0, u) }); }
    out.push(pts[n - 1]); return out; };
  roots.list.forEach((pts, k) => pushRope(G, smooth(pts), 14, 0.1 * k));
  // where the climber's new strand is made fast: three turns of it round the cable (o.strandS metres up)
  if (o.strandS !== undefined) for (let w = 0; w < 3; w++) {
    const s = o.strandS + (w - 1) * 0.9, r = CABLE.radius(s) + 0.3, pts = [];
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; pts.push({ p: CABLE.at(s + 0.3 * Math.sin(a * 2 + w), Math.cos(a) * r, Math.sin(a) * r), r: 0.45, follow: CABLE.fall(s), sway: 0, s, l: i * 2.2 }); }
    pushRope(G, pts, 6, 0.3 + w * 0.2, true);
  }
  // ---- the others: from their hills to the ring, hanging slack, swaying out of step (still where they come in
  // to the ring); the lower 60 percent follows the forest
  const ends = [], up = V(0, 1, 0);
  for (const k of others) {
    const T = k.T, E = ringPoint(CABLE, ties, k.ang), len = T.distanceTo(E), N = 72, pts = [], r0 = k.thick / 2, sag = len * k.slack;
    const env = (t) => Math.sin(Math.PI * t) * (1 - sstep(0.7, 0.85, t)), swv = V(0, 0, 0).subVectors(E, T).cross(up).normalize();
    // (mend U, U1) fall: THE SHARE OF THE LAND'S FALL the rope takes at q (0 its hill .. 1 the ring), said ONCE: the
    // rope's mesh, the curve its riders ride and the riders' own light all read this one function.
    const fall = (q) => 1 - sstep(0, 0.6, q);
    // (mend W, W1) radius: THE ROPE'S GIRTH at q, said ONCE: its mesh and whatever holds the rope read this one
    // function. (round Q, R4 b: EVERY CABLE HAS A ROOTED FOOT. Over its first 40 m from its hill's top it swells
    // to 2.6 times its thickness, as a trunk does into its roots, and goes into the crown of the hill)
    const radius = (q) => lerp(r0, r0 * 0.55, q) * (1 + 0.5 * sstep(0.985, 1, q)) * (1 + 1.6 * Math.pow(1 - sstep(0, 40, q * len), 2));
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = V(0, 0, 0).lerpVectors(T, E, t); p.y -= sag * 4 * t * (1 - t);
      pts.push({ p, r: radius(t), follow: fall(t), sway: k.amp * env(t), s: -1, l: t * len });
    }
    // (mend W, W1) where this rope lies in the mesh (its first vertex, its rings, the vertices to a ring): the
    // world's test of the hands that hold it reads the rope from the mesh's own rings
    const v0 = G.count;
    pushRope(G, pts, 8, k.phase);
    // the same curve for whatever rides the cable: q 0..1 along it at world time t
    const at = (q, t, out) => { out.lerpVectors(T, E, q); out.y -= sag * 4 * q * (1 - q); out.y -= shared.drop(out.x, out.z) * fall(q);
      return out.addScaledVector(swv, k.amp * env(q) * Math.sin(t * 0.31 + k.phase * TAU) * (0.6 + 0.4 * Math.sin(t * 0.13 + k.phase * 40))); };
    ends.push({ T, E, len, r0, sag, at, fall, radius, k, mesh: { v0, rings: N + 1, ring: 9 } });
  }
  const geo = bound(G.geometry(), 0, 200, -1000, 4200);
  const own = { uCN: { value: CABLE.n.clone() }, uGr: { value: o.grips }, uRopeA: { value: C(ROPE_BARK) }, uRopeB: { value: C('#6E7660') }, uRopeMoss: { value: C('#566644') }, uLay: { value: new THREE.Vector3(LAY[0], LAY[1], LAY[2]) },
    uLow: { value: new THREE.Vector2(150, 110) } };
  const mat = new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: ROPE_VERT, fragmentShader: ROPE_FRAG, fog: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'cables'; mesh.frustumCulled = false;
  return { object: mesh, material: mat, ends, ties, roots, triangles: G.triangles };
}

// ---------------------------------------------------------------- the ring, and the orb of web in it
const ORB_VERT = /* glsl */`
varying vec2 vP; varying vec3 vW;
void main(){ vP = position.xy; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
// One spiral thread, never circles: the turn a point lies on is (radius in turns) minus (its angle in turns), so
// going once round carries the thread one pitch outward. Between spokes the thread hangs slack (downward, each
// span by its own amount); spans are missing here and there; in one sector the web is torn: the spiral is gone
// from part-way out and some spokes have parted and hang short. Nothing here shines of itself: a thread is dull
// until it lies square to the half-way direction between the sun and the eye, and then it glints.
const ORB_FRAG = /* glsl */`
uniform vec3 uNetCol, uSap, uWX, uWN; uniform vec4 uOrb, uTear;     // inner radius, ring radius, spokes, turns; tear: angle, half width, from radius, seed
uniform vec2 uTies[10];
varying vec2 vP; varying vec3 vW;
${CM_GLSL}
float cover(float d, float w, float px){ return clamp((min(d + 0.5*px, 0.5*w) - max(d - 0.5*px, -0.5*w))/px, 0.0, 1.0); }
float wrapA(float d){ return d - 6.2831853*floor(d/6.2831853 + 0.5); }
float jitOf(float i){ return (cmH(vec2(mod(i + uOrb.z, uOrb.z), 3.1 + uTear.w)) - 0.5)*0.34; }
float ringR(float a){ float k = 1.0; for (int i = 0; i < 10; i++) { float d = wrapA(a - uTies[i].x); k += uTies[i].y*exp(-d*d/0.05); } return uOrb.y*k; }
void main(){
  float px = max(length(dFdx(vP)), length(dFdy(vP))) + 1e-5;
  // the whole web trembles
  vec2 p = vP + 0.10*vec2(sin(uTime*2.3 + vP.y*0.31), sin(uTime*1.9 + vP.x*0.27))*smoothstep(uOrb.x - 2.0, uOrb.x + 6.0, length(vP));
  float r = max(length(p), 1e-3), a = atan(p.y, p.x);
  float inner = uOrb.x, NS = uOrb.z, turns = uOrb.w, rim = ringR(a) - 1.2;
  float r0 = inner + 1.6, r1 = uOrb.y - 2.4, pitch = (r1 - r0)/turns;
  // ---- spokes, each a little out of true; in the torn sector some have parted and hang short.
  // The span we are in lies between the spoke below (sLo) and the spoke above (sHi), in spokes round the web.
  float sa = a/6.2831853*NS, i0 = floor(sa), sLo = i0 + jitOf(i0), sHi = i0 + 1.0 + jitOf(i0 + 1.0);
  if (sa < sLo) { sHi = sLo; i0 -= 1.0; sLo = i0 + jitOf(i0); } else if (sa > sHi) { sLo = sHi; i0 += 1.0; sHi = i0 + 1.0 + jitOf(i0 + 1.0); }
  float sec = mod(i0 + NS, NS), fs = clamp((sa - sLo)/max(sHi - sLo, 1e-3), 0.0, 1.0);
  float nearHi = step(sHi - sa, sa - sLo), sAt = mix(sLo, sHi, nearHi), si = i0 + nearHi, sid = mod(si + NS, NS);
  float ds = abs(sa - sAt)*6.2831853*r/NS;
  float sAng = sAt/NS*6.2831853, luck = cmH(vec2(sid, 9.7 + uTear.w));
  float parted = step(abs(wrapA(sAng - uTear.x)), uTear.y)*step(0.4, luck);
  float sEnd = mix(rim + 1.4, inner + (rim - inner)*(0.2 + 0.5*cmH(vec2(sid, 4.4))), parted);
  float spoke = cover(ds, 0.06, px)*step(inner, r)*step(r, sEnd);
  // ---- the one spiral
  float t0 = (r - r0)/pitch - a/6.2831853, k0 = floor(t0 + 0.5);
  float slack = pitch*(0.10 + 0.45*cmH(vec2(k0, sec) + uTear.w));
  float hang = slack*sin(3.14159*fs)*(-p.y/r);                       // the span sags downward
  float rs = (r - hang - r0)/pitch - a/6.2831853, ri = floor(rs + 0.5);
  float dr = abs(rs - ri)*pitch;
  float turn = ri + a/6.2831853;                                      // how many turns out along the thread this is
  float gone = step(cmH(vec2(ri, sec) + 3.3 + uTear.w), 0.08);
  float tornK = step(abs(wrapA(a - uTear.x)) + 0.10*cmH(vec2(ri, 7.0)), uTear.y)*step(uTear.z + 1.5*cmH(vec2(sec, 2.0)), r);
  float inSp = step(-0.5, turn)*step(turn, turns - 0.5)*step(r0 - 0.5, r)*(1.0 - gone)*(1.0 - tornK);
  float spiral = cover(dr, 0.045, px)*inSp;
  // the rim of the opening: a doubled thread
  float hole = max(cover(abs(r - inner), 0.09, px), 0.6*cover(abs(r - inner - 0.5), 0.05, px));
  // beads of sap on the spiral: they catch the sun in turn
  vec2 bc = vec2(ri, floor(fs*3.0) + sec*3.0); float bid = cmH(bc + 17.0);
  float bfs = (floor(fs*3.0) + 0.5)/3.0, ba = mix(sLo, sHi, bfs)/NS*6.2831853;
  float brr = r0 + (ri + ba/6.2831853)*pitch + slack*sin(3.14159*bfs)*(-sin(ba));
  vec2 bp = vec2(cos(ba), sin(ba))*brr;
  float bd = length(p - bp), bsz = 0.15*(0.6 + 0.8*fract(bid*7.7));
  float bead = (1.0 - smoothstep(max(bsz - px, 0.0), bsz + px, bd))*step(0.62, bid)*inSp*min(1.0, bsz*2.0/px);
  float flash = pow(clamp(0.5 + 0.5*sin(uTime*(1.1 + 2.0*fract(bid*3.3)) + bid*50.0), 0.0, 1.0), 10.0);
  // caught fluff: a few soft pale tufts
  vec2 fc = floor(p/3.1); float fid = cmH(fc + 5.0); vec2 fo = (fc + 0.3 + 0.4*cmH2(fc))*3.1;
  float fluff = (1.0 - smoothstep(0.0, 0.5, length(p - fo)))*step(0.86, fid)*step(inner + 0.5, r)*step(r, r1)*(1.0 - tornK);
  // ---- light: dull thread, and a glint where a thread lies square to the half-way direction
  vec3 v = normalize(cameraPosition - vW);
  vec3 hv = uSunDir + v; hv /= max(length(hv), 1e-3);
  vec2 hp = vec2(dot(hv, uWX), dot(hv, uWN)), rh = p/r;
  float gs = dot(rh, hp), gt = dot(vec2(-rh.y, rh.x), hp);
  float sparkle = 0.55 + 0.45*sin(r*2.3 - uTime*1.3 + si*2.1 + uTear.w);
  float toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 sunL = uSunCol*0.3, dull = (cmAmb(vec3(0.0, -0.4, 0.0)) + vec3(0.10, 0.12, 0.06))*0.55;
  vec3 col = uNetCol*(spoke*(dull + sunL*1.5*exp(-gs*gs*30.0)*sparkle) + spiral*(dull*0.8 + sunL*1.3*exp(-gt*gt*30.0)*sparkle) + hole*(dull + sunL*0.5*toward));
  col += uSap*sunL*bead*(0.15 + 2.4*flash*(0.3 + 0.7*toward));
  col += vec3(0.8, 0.82, 0.66)*(dull + sunL*0.4*toward)*fluff*0.6;
  float al = clamp((spoke + spiral + hole)*0.9 + bead + fluff*0.6, 0.0, 1.0);
  float x = uFog.x*length(cameraPosition - vW)*0.4, f = 1.0 - exp(-x*x);
  col = mix(col, uFogCol*al, f);
  gl_FragColor = vec4(col, al);
}`;
// o: { rng, grips, ties (from makeCables), inner, spokes, turns }
export function makeHub(ctx, shared, o = {}) {
  const group = new THREE.Group(); group.name = 'hub'; const CABLE = shared.cable, HUB = shared.hub, rng = cmStream(shared, o.rng, 'ring', ctx);
  const ties = o.ties || [{ ang: Math.atan2(-HUB.m, -HUB.x), pull: 0.09 }];
  // the ring: three ropes braided round a hoop that every cable has pulled out of round; lumpy, thicker at the ties
  const G = new Geo({ aK: 4, aT: 3, aAx: 3, aD: 2 }), NR = 180, l1 = rng.range(0, TAU), l2 = rng.range(0, TAU), l3 = rng.range(0, TAU);
  const near = (ph) => { let k = 0; for (const t of ties) { let d = ph - t.ang; d -= TAU * Math.round(d / TAU); k += Math.exp(-d * d / 0.012); } return Math.min(k, 1); };
  for (let b = 0; b < 3; b++) {
    const pts = [];
    for (let i = 0; i < NR; i++) {
      // nine crossings round the ring
      const ph = (i / NR) * TAU, w = ph * 9 + (b * TAU) / 3, tie = near(ph), lump = 0.7 * Math.sin(ph * 5 + l1) + 0.45 * Math.sin(ph * 11 + l2);
      const rr = ringRadius(HUB.R, ties, ph) + lump + Math.cos(w) * 1.25 * (1 - 0.5 * tie), off = Math.sin(w) * 1.25 * (1 - 0.5 * tie) + 0.5 * Math.sin(ph * 7 + l3);
      const p = V(0, 0, 0).copy(HUB.H).addScaledVector(CABLE.X, Math.cos(ph) * rr).addScaledVector(CABLE.n, Math.sin(ph) * rr).addScaledVector(CABLE.d, off);
      pts.push({ p, r: 1.45 * (1 + 0.5 * tie) * (1 + 0.16 * Math.sin(ph * 13 + l1 + b)), follow: 0, sway: 0, s: -1, l: ph * HUB.R });
    }
    pushRope(G, pts, 9, b * 0.33, true);
  }
  // the knots: at every tie, turns of rope round the ring itself, each a little askew
  for (const t of ties) {
    const c = ringPoint(CABLE, ties, t.ang), rad = V(0, 0, 0).subVectors(c, HUB.H).normalize(), tan = V(0, 0, 0).crossVectors(CABLE.d, rad).normalize(), turnsN = 2 + Math.floor(rng() * 3);
    for (let w = 0; w < turnsN; w++) {
      const sh = (w - (turnsN - 1) / 2) * 1.5 + rng.range(-0.3, 0.3), skew = rng.range(-0.35, 0.35), R2 = rng.range(3.1, 3.9), pts = [];
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; pts.push({ p: V(0, 0, 0).copy(c).addScaledVector(tan, sh + skew * R2 * Math.cos(a)).addScaledVector(rad, Math.cos(a) * R2).addScaledVector(CABLE.d, Math.sin(a) * R2), r: rng.range(0.7, 1.0), follow: 0, sway: 0, s: -1, l: i * 1.3 }); }
      pushRope(G, pts, 6, rng(), true);
    }
  }
  const geo = bound(G.geometry(), HUB.H.x, HUB.H.y, HUB.H.z, HUB.R + 10);
  const own = { uCN: { value: CABLE.n.clone() }, uGr: { value: o.grips }, uRopeA: { value: C('#7F8C6C') }, uRopeB: { value: C('#B4BA9E') }, uRopeMoss: { value: C('#5C6C48') }, uLay: { value: new THREE.Vector3(3, 9, 0.9) }, uLow: { value: new THREE.Vector2(0, 0) } };
  const ring = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: ROPE_VERT, fragmentShader: ROPE_FRAG, fog: false }));
  ring.name = 'hub-ring'; group.add(ring);
  // the orb: one annulus in the plane of the ring
  const inner = o.inner ?? 8;
  const orbGeo = new THREE.RingGeometry(inner - 0.6, HUB.R * 1.16, 64, 1);
  const tiesU = []; for (let i = 0; i < 10; i++) tiesU.push(new THREE.Vector2(ties[i]?.ang ?? 0, ties[i]?.pull ?? 0));
  // where the web is torn: its own stream says at what angle, how wide (32 to 52 degrees) and from how far out
  const tear = new THREE.Vector4(rng.range(0, TAU), rng.range(0.28, 0.45), inner + (HUB.R - inner) * rng.range(0.2, 0.5), rng.range(0, 50));
  const orbU = { uNetCol: { value: C('#C6DCBA') }, uSap: { value: C('#F0C870') }, uOrb: { value: new THREE.Vector4(inner, HUB.R, o.spokes ?? 32, o.turns ?? 14) }, uTear: { value: tear }, uTies: { value: tiesU },
    uWX: { value: CABLE.X.clone() }, uWN: { value: CABLE.n.clone() } };
  const orb = new THREE.Mesh(orbGeo, new THREE.ShaderMaterial({ uniforms: withShared(shared.U, orbU), vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  orb.matrixAutoUpdate = false; CABLE.matrix(HUB.s, orb.matrix); orb.matrix.setPosition(HUB.H); orb.name = 'orb-web'; orb.renderOrder = 2;
  group.add(orb);
  return { object: group, ring, orb, tear, triangles: G.triangles + 128 };
}

// ---------------------------------------------------------------- thread: ribbons that face the eye
// position: a point on the thread (for loose web: relative to its origin aO).  aTan: its direction there.
// aR: side -1/+1, half width (m), q 0..1 along, phase.   aF: share of the forest's fall, wave (m), drift 0/1, brightness
// (0.5 to 1.1 for a strand; 2 marks THE HAIR, forty strands twisted into one: it is lit as a rope is; 3 the
// threads of the Moon's net that meet it at its knot).
// aM: metres along the thread.
const THREAD_VERT = /* glsl */`
attribute vec3 aTan, aO; attribute vec4 aR, aF; attribute float aM;
uniform vec4 uBox;                       // loose web drifts across a box: centre x, width, wind m/s, -
varying vec4 vR; varying vec3 vW; varying vec3 vA; varying float vFol, vSun;
${CM_GLSL}
${CM_RIBBON}
void main(){
  vec3 o = aO; float al = 1.0; vFol = aF.x;
  if (aF.z > 0.5) {
    // (mend T, T4: ABOVE THE AIR NOTHING DRIFTS ON A WIND. A loose thread is carried by the wind as far as the
    // air at its own height carries anything (the air's one thinning at its own level, cmThin): whole at
    // the leaves, a twentieth of it at the height of the ring's rim and above, where it hangs and turns.)
    float W = uBox.y, x = mod(aO.x - uBox.x + uTime*uBox.z*(0.6 + 0.8*aR.w)*mix(1.0, 0.05, cmThin(aO.y)) + 0.5*W, W) - 0.5*W;
    al = smoothstep(0.5*W, 0.38*W, abs(x)); o.x = uBox.x + x;
    o.y += 4.0*sin(uTime*0.11 + aR.w*30.0);
  }
  vec3 c = o + position;
  c.y -= cmDrop(c.xz)*aF.x;
  vec3 wv = cross(aTan, vec3(0.0, 1.0, 0.0)); wv /= max(length(wv), 1e-4);
  float env = sin(3.14159*clamp(aR.z, 0.0, 1.0));
  c += (wv*sin(uTime*0.6 + aR.z*7.0 + aR.w*40.0) + vec3(0.0, 0.35, 0.0)*sin(uTime*0.43 + aR.z*5.0 + aR.w*19.0))*aF.y*mix(env, 1.0, aF.z);
  float k, hw = aR.y;
  // (mend T, T2) THE HAIR RUNS ON TO THE MOON, 400 km of it: a point of it farther than 8.6 km from the eye is
  // drawn on its own ray at 8.6 km, its width in the same measure, so the picture is the true one and it lies
  // inside the far plane (as the sun, the Moon and the air on the world's edge are drawn at the far plane)
  if (aF.w > 1.5) { vec3 rel = c - cameraPosition; float pull = min(1.0, 8600.0/max(length(rel), 1.0)); c = cameraPosition + rel*pull; hw *= pull; }
  vec4 mv = cmRibbon(c, aTan, aR.x, hw, k);
  // which way across the ribbon the sun stands (the ribbon's own side, in the world)
  vec3 sdW = cross(aTan, c - cameraPosition); vSun = dot(sdW/max(length(sdW), 1e-5), uSunDir);
  vW = c; vR = vec4(aR.x, aR.z, aR.w, aF.w); vA = vec3(k, al, aM);
  gl_Position = projectionMatrix*mv;
}`;
const THREAD_FRAG = /* glsl */`
#define CM_FOLLOW vFol
uniform vec3 uNetCol; uniform float uHairLit;
varying vec4 vR; varying vec3 vW; varying vec3 vA; varying float vFol, vSun;
${CM_GLSL}
void main(){
  float s = abs(vR.x), fw = fwidth(vR.x) + 1e-4;
  float e = 1.0 - smoothstep(max(1.0 - fw*1.5, 0.0), 1.0, s);
  vec3 v = normalize(cameraPosition - vW);
  float toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  // nothing here shines of itself: dull thread under the sky and over the bright forest; glints of sun slide
  // down it; beads of dew and sap sit on it every metre or two and flash in turn
  float g = pow(clamp(0.5 + 0.5*sin(vR.y*38.0 - uTime*1.6 + vR.z*50.0), 0.0, 1.0), 14.0);
  float m = vA.z/1.7 + vR.z*9.0, cell = floor(m), mw = fwidth(vA.z) + 1e-4;
  float bid = cmH(vec2(cell, vR.z*91.0));
  float bead = (1.0 - smoothstep(0.05, 0.09 + mw*0.3, abs(fract(m) - 0.5)))*step(0.45, bid)*(1.0 - smoothstep(0.2, 0.7, mw));
  float flash = pow(clamp(0.5 + 0.5*sin(uTime*(0.9 + 2.0*bid) + bid*40.0), 0.0, 1.0), 8.0);
  // (mend P, Q5: a GREAT DROP hangs every 11 m or so on one stretch in two. Mend R, V1: A DROP IS A BEAD, NEVER
  // A STREAK ALONG ITS STRAND: the great drop is a third of a metre long (it was a metre and more, and seen from
  // farther off than the small beads: near the eye it was a white-hot run on the thread) and it goes to nothing
  // under the pixel's footprint exactly as the small beads do: a few pixels across near to, nothing far off)
  float m2 = vA.z/11.0 + vR.z*5.0, mw2 = mw*(1.7/11.0), bid2 = cmH(vec2(floor(m2), vR.z*57.0));
  float drop = (1.0 - smoothstep(0.011, 0.016 + mw2*0.3, abs(fract(m2) - 0.5)))*step(0.5, bid2)*(1.0 - smoothstep(0.2, 0.7, mw));
  if (drop > bead) { bead = drop; flash = pow(clamp(0.5 + 0.5*sin(uTime*(0.9 + 2.0*bid2) + bid2*40.0), 0.0, 1.0), 8.0); }
  // (mend R, V1) A THREAD IS NEVER BRIGHTER THAN THE LIT ROPE BESIDE IT, AT ANY HEIGHT, AND IT IS NEVER WHITE: the
  // thread's one law of light (the common part: cmThreadDull, cmThreadSun, cmThreadCap). What it catches of the
  // sun it gives back in its own pale green-silver (the glints and the beads the same), as bright at one end
  // of it as along it; high up it is seen by the sky's light and the roof's alone.
  float hT = vW.y + vFol*cmDrop(vW.xz), sunY = cmThreadSun(hT);
  vec3 col = cmThreadCap(uNetCol*(vR.w*(cmThreadDull(hT) + sunY*(0.3*toward*toward + 2.2*g*(0.3 + 0.7*toward))) + sunY*bead*(0.4 + 2.4*flash)*(0.4 + 0.6*toward)), hT);
  // (mend S, the guard's G4) THE HAIR FROM THE RING TO THE MOON IS A ROPE OF FORTY STRANDS, AND THE SUN IS ON IT
  // as it is on the cable beside us: it has the lit rope's own brightness at its height (the cap of V1's law
  // itself: as bright as the lit rope and never brighter) in the thread's pale green-silver. By V1's law for
  // a single strand it caught nothing of the sun above the ring's rim and could not be seen; so the title's
  // cable is seen to go on to the Moon, one fine pale line.
  // (mend T, T2: it takes the sun on the same side as everything else: the side of it turned from the sun has
  // 0.6 of the lit side's light; where it is under two pixels across that is one even tone)
  if (vR.w > 1.5) col = cmThreadCap(uNetCol*8.0, hT)*mix(0.6, 1.0, clamp(0.5 + 0.9*vR.x*vSun, 0.0, 1.0));
  float kpx = clamp(vA.x, 0.0, 1.0);                     // the strand's share of a pixel's width (cmRibbon)
  // (mend P, Q5: THE THREAD fades by the power 1.5 of that share (was the share itself), so a strand too thin
  // to see goes into nothing sooner instead of scratching the sky; A BEAD is a drop broader than its thread and
  // fades by the share itself, so the beads still catch the sun in turn along a strand too fine to see)
  // (mend T, T2: THE HAIR IS A CABLE ARRIVING. It is one breadth from end to end (0.9 m: forty strands), so it
  // is broader toward the ring only as distance makes it so; it is drawn by its true share of a pixel and
  // never fainter than a hair: 0.55 of a line 1.6 pixels wide where it leaves the gathered strands, down to
  // 0.3 where it meets the Moon's limb (vR.y: 0 at the gather, 1 at the limb). No beads on it. It ENDS at
  // the limb, at a KNOT: the threads of the net that meet it there (vR.w 3) are as faint, broader at the
  // knot, and go to nothing along their own length. uHairLit: how lit the limb is that it reaches; toward an
  // unlit limb the hair goes into the dark over its last fifth and the knot is not seen. (Mend U: THAT ARM
  // DOES NOT ACT ON THE DEALT RANGES: uHairLit is 1 on every deal, the limb turned to the ring being the
  // sun's. It is left in.)
  float hairAl = vR.w > 2.5 ? max(kpx, 0.3)*(1.0 - smoothstep(0.45, 1.0, vR.y))*uHairLit
    : max(kpx, mix(0.55, 0.3, smoothstep(0.0, 1.0, vR.y)))*mix(1.0 - smoothstep(0.8, 0.95, vR.y), 1.0, uHairLit);
  float al = e*vA.y*clamp(vR.w > 1.5 ? hairAl : kpx*sqrt(kpx)*(0.55*vR.w + 0.3) + kpx*bead, 0.0, 1.0);
  // (round Q: A THREAD GOES OUT WITHIN 12 M OF THE EYE'S PLACE, the one opacity by the eye's nearness that the
  // rules allow, declared in the world file's list. The climb now runs beside the cable, through the air where
  // loose threads drift: one adrift a metre from the eye was a broad pale bar across the whole picture.)
  al *= smoothstep(3.0, 12.0, length(cameraPosition - vW));
  // (mend T, T2: the hair runs far above the air: it stands in the air that lies along the ray to it, by the
  // air's one law (cmHaze), never in the eye's own air for the whole of its length: that drew its far part in
  // the horizon's colour, a dark line on the night sky)
  if (vR.w > 1.5) col = cmHaze(col, vW, 1.0);
  else { float x = uFog.x*length(cameraPosition - vW)*0.5; col = mix(col, uFogCol, 1.0 - exp(-x*x)); }
  gl_FragColor = vec4(col*al, al);
}`;
function threadGeo() { return new Geo({ aTan: 3, aO: 3, aR: 4, aF: 4, aM: 1 }); }
// one thread through points [Vector3] (relative to origin o), half width w(q), into G
function pushThread(G, pts, o, w, phase, follow, wave, drift, bright) {
  const n = pts.length, base = G.count, t = V(0, 0, 0); let len = 0;
  for (let i = 0; i < n; i++) {
    if (i) len += pts[i].distanceTo(pts[i - 1]);
    t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    const q = i / (n - 1), fl = typeof follow === 'function' ? follow(q) : follow, hw = typeof w === 'function' ? w(q) : w;
    for (const side of [-1, 1]) {
      G.set('aTan', t.x, t.y, t.z); G.set('aO', o.x, o.y, o.z); G.set('aR', side, hw, q, phase); G.set('aF', fl, wave, drift, bright); G.set('aM', len);
      G.v(pts[i].x, pts[i].y, pts[i].z);
    }
  }
  for (let i = 0; i < n - 1; i++) { const a = base + i * 2; G.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
}
// o: { forks: { guys, strands, loose, far }, farLines (how many), cableBearings (the ropes' bearings from the ring), peaks, peakHeight, path, moonDir, moonRadius (degrees), moonPhase, ties, sunRadius (degrees), ties }
export function makeStrands(ctx, shared, o) {
  const fr = o.forks || {}, fork = (k) => cmStream(shared, fr[k], k, ctx), group = new THREE.Group(); group.name = 'strands'; const CABLE = shared.cable, HUB = shared.hub;
  const mk = (G, name, own, cx, cy, cz, r) => {
    const m = new THREE.Mesh(bound(G.geometry(), cx, cy, cz, r), new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.name = name; m.renderOrder = 1; m.frustumCulled = false; group.add(m); return m;
  };
  const netCol = { value: C('#C6DCBA') }, O0 = V(0, 0, 0), still = { value: new THREE.Vector4(0, 1, 0, 0) }, hairLit = { value: 1 };
  let tris = 0; const farLines = [], hairFact = { lengthKm: 400, breadthM: 0.9, sagDeg: 0.6, knotThreads: 0, limbLit: 1 };
  // ---- guys: from the cable's first 70 m down into the crowns all round the hill. Each hangs in a deep slack
  // curve (a tenth to a sixth of its length), is made fast at both ends in a fan of three threads, and glints.
  // No guy passes within 14 m of the route (tried at every point of the thread).
  { const G = threadGeo(), rng = fork('guys'), pk = o.peaks[0], NG = o.guys ?? 12; let made = 0;
    for (let tries = 0; made < NG && tries < NG * 12; tries++) {
      const s = rng.range(8, 70), ang = rng.range(0, TAU), rr = rng.range(70, 165), slack = rng.range(0.1, 0.17), ph = rng(), spread = rng.range(1.8, 3.2);
      const dirH = V(Math.cos(ang), 0, Math.sin(ang)), A = CABLE.at(s, 0, 0).addScaledVector(dirH, CABLE.radius(s) * 0.8);
      const bx = pk.x + Math.cos(ang) * rr, bz = pk.z + Math.sin(ang) * rr, B = V(bx, o.peakHeight(bx, bz) - 0.5, bz), len = A.distanceTo(B);
      const fA = CABLE.fall(s), pts = [];
      for (let i = 0; i <= 16; i++) { const q = i / 16, p = V(0, 0, 0).lerpVectors(A, B, q); p.y -= slack * len * Math.sin(Math.PI * q); pts.push(p); }
      if (o.path && pts.some((p) => o.path.distanceTo(p.x, p.y, p.z) < 14)) continue;
      const fol = (q) => lerp(fA, 1, q);
      pushThread(G, pts, O0, (q) => lerp(0.14, 0.07, q), ph, fol, 0.4, 0, 0.6);
      // the fans: two more threads from the cable either side of the tie, joining the guy 2 points down; and
      // two from the guy's last points into the leaves either side of its foot
      const side = V(0, 0, 0).crossVectors(dirH, V(0, 1, 0));
      for (const sd of [-1, 1]) {
        pushThread(G, [CABLE.at(s + sd * spread, 0, 0).addScaledVector(dirH, CABLE.radius(s) * 0.8), pts[1].clone().lerp(pts[2], 0.5), pts[2]], O0, 0.07, ph, (q) => lerp(fA, fol(2 / 16), q), 0.2, 0, 0.5);
        pushThread(G, [pts[14], pts[15].clone().addScaledVector(side, sd * spread * 0.6), B.clone().addScaledVector(side, sd * spread * 1.6)], O0, 0.05, ph, 1, 0.2, 0, 0.5);
      }
      made++;
    }
    tris += G.triangles; mk(G, 'guys', { uNetCol: netCol, uBox: still, uHairLit: hairLit }, pk.x, 50, pk.z, 900); }
  // ---- beyond the ring: forty strands leave it all round, slack and unequal, lean over toward the Moon and twist
  // into one hair 520 m out; the hair runs on to the Moon
  // (mend T, T2) THE HAIR ARRIVES AT THE MOON'S LIMB, AT A KNOT, AND NO LINE RUNS ON ACROSS THE FACE. It runs
  // to the point of the limb that is turned to the ring (the Moon's own direction leant its own radius toward
  // the cable's line), 400 km of it, so from every place beside the cable it comes to that one point of the
  // limb from outside the disc. It hangs in a slight sag (0.6 of a degree at its deepest, 1.2 km out, seen
  // from the ring; a first trial, 1.2 degrees at 3.5 km, drew a hook under the limb). At its end three to five threads of the Moon's net meet it (the stream's draw): short, bent,
  // unequal, fanned over the limb toward the face, each 0.07 to 0.2 of the Moon's radius long, broadest at
  // the knot: a small uneven thickening, never a star of straight lines.
  { const G = threadGeo(), rng = fork('strands'), NS = o.beyond ?? 40, Mc = (o.moonDir || CABLE.d).clone().normalize(), GATHER = 520, LEN = 400000, ties = o.ties || [];
    const rho = (o.moonRadius ?? 0) * Math.PI / 180, eR = CABLE.d.clone().addScaledVector(Mc, -CABLE.d.dot(Mc));
    if (eR.lengthSq() < 1e-6) eR.set(0, -1, 0).addScaledVector(Mc, Mc.y); eR.normalize();
    const M = Mc.clone().multiplyScalar(Math.cos(rho)).addScaledVector(eR, Math.sin(rho)).normalize();
    // (how lit that point of the limb is: the Moon's own sum, the sky part's: the sun's bearing round the disc
    // times how far the lit side is turned from us)
    { const sP = shared.sunDir.clone().addScaledVector(Mc, -shared.sunDir.dot(Mc)), ph = o.moonPhase ?? 0.55; if (sP.lengthSq() > 1e-8) sP.normalize();
      hairLit.value = sstep(-0.08, 0.3, Math.sqrt(Math.max(1 - ph * ph, 0)) * eR.dot(sP)); }
    const axis = (L, out) => out.copy(HUB.H).addScaledVector(M, 1.5 + L);
    for (let j = 0; j < NS; j++) {
      const a0 = (j / NS) * TAU + rng.range(-0.06, 0.06), tw = rng.range(1.5, 3.2) * rng.sign(), sagK = rng.range(0.004, 0.02), w0 = rng.range(0.07, 0.2), br = rng.range(0.5, 1), ph = rng(), pts = [];
      const R0 = ringRadius(HUB.R, ties, a0);
      for (let i = 0; i <= 30; i++) {
        const q = i / 30, rad = R0 * Math.pow(1 - q, 2.2) * (1 + 0.12 * Math.sin(q * 9 + j)) + 0.2 * q, a = a0 + tw * q, p = axis(q * GATHER, V(0, 0, 0)).addScaledVector(CABLE.X, Math.cos(a) * rad).addScaledVector(CABLE.n, Math.sin(a) * rad);
        p.y -= sagK * GATHER * Math.sin(Math.PI * q); pts.push(p);
      }
      pushThread(G, pts, O0, (q) => lerp(w0, 0.16, q), ph, 0, 0.5, 0, br);
    }
    const sv = V(0, -1, 0).addScaledVector(M, M.y).normalize(), SAG = 0.6 * Math.PI / 180;
    const hairAt = (L) => { const x = (L - GATHER) / (L - GATHER + 700); return axis(L, V(0, 0, 0)).addScaledVector(sv, L * SAG * 4 * x * (1 - x)); };
    const hair = []; for (let i = 0; i <= 40; i++) hair.push(hairAt(GATHER * Math.pow(LEN / GATHER, i / 40)));
    pushThread(G, hair, O0, 0.45, rng(), 0, 0, 0, 2);
    // the knot: the limb's own frame there (inward: toward the Moon's middle; along: round the limb)
    if (rho > 0) { const K = hair[40], inw = eR.clone().multiplyScalar(-Math.cos(rho)).addScaledVector(Mc, Math.sin(rho)).normalize(), alongL = V(0, 0, 0).crossVectors(M, inw).normalize(), RL = Math.tan(rho) * LEN;
      const NK = 3 + Math.floor(rng() * 3); hairFact.knotThreads = NK; hairFact.limbLit = Math.round(hairLit.value * 1000) / 1000;
      for (let j = 0; j < NK; j++) {
        const a = (((j + 0.5) / NK) * 2 - 1) * 1.15 + rng.range(-0.18, 0.18), len = RL * rng.range(0.07, 0.2), bend = rng.range(-0.35, 0.35) * len, w0 = RL * rng.range(0.007, 0.012), pts = [];
        const dir = inw.clone().multiplyScalar(Math.cos(a)).addScaledVector(alongL, Math.sin(a)), off = V(0, 0, 0).crossVectors(M, dir).normalize();
        for (let i = 0; i <= 8; i++) { const q = i / 8; pts.push(K.clone().addScaledVector(dir, q * len).addScaledVector(off, bend * Math.sin(Math.PI * q * 0.5) * q)); }
        pushThread(G, pts, O0, (q) => lerp(w0, RL * 0.002, Math.sqrt(q)), rng(), 0, 0, 0, 3);
      } }
    // (mend T, T4) FAR CABLES FROM OTHER HILLS, AS THREADS. With the ropes that come to the ring there are UP TO
    // a dozen cables in sight (o.farLines: the number the world ASKS for; a line is tried up to 20 times to
    // each line asked and fewer are made where the rules below turn every try away: by the code reader's
    // count on seeds 1 to 200, on five visits; seed 15 has 2 of 3, seeds 87, 110 and 144 have 5 of 6, seed
    // 70 has 1 of 2): the rest rise from hills too far to see, 3.2 to
    // 6.5 km out, at bearings of their own stream's dealing (no two lines of the ring nearer than 9 degrees
    // in bearing, none within 25 degrees of our own cable's line back to its hill). THE 60 M FROM THE ROAD IS
    // A GUARD THAT DOES NOT ACT ON THE DEALT RANGES (mend U): the test below skips the line's first point (on
    // the rim, where the road itself comes in) and tries the other 24, the first of them 133 to 271 m out
    // by the dealt reach; by the reader's count it refuses none of 6,631 tries on 200 visits (the nearest a
    // line comes to the road is 152 m). It is left in. Each line hangs in its own sag (0.012 to 0.03 of its length), each made fast on the ring's rim
    // where its own bearing meets it: they gather at the ring and nowhere else. Each is a thread 0.6 m
    // across (3.2 m was tried: beside the ring it was a broad pale bar), drawn as the hair to the Moon is (the lit rope's light, the air's own law along the ray,
    // never fainter than a hair), paling into the air toward its foot; its lower six tenths follow the
    // forest as the ropes' do. lines: the same curves, for what rides them.
    { const fl = cmStream(shared, fr.far, 'far-lines', ctx), NF = o.farLines ?? 0, used = (o.cableBearings || []).slice(), own = Math.atan2(-CABLE.d.z, -CABLE.d.x);
      // (mend T, T2 and T4) THE HAIR IS THE ONLY LINE TOWARD THE MOON, AND NO FAR LINE STANDS ON THE SUN'S DISC: a
      // far line is not made if, from ANY place on the road (every 6 m of it, the whole of it alike), any
      // part of it would lie within 1.25 radii of the Moon's middle or of the sun's. (A line leaves the ring
      // and falls away to its hill: seen from under the ring it is a long stroke over a third of the sky.)
      // clear[]: for each line made, the least of those distances over the whole road, in radii (the facts).
      const road = [], discs = [[o.moonDir, o.moonRadius], [shared.sunDir, o.sunRadius]].filter((d) => d[0] && d[1]).map((d) => [d[0].clone().normalize(), d[1] * Math.PI / 180]);
      if (o.path) for (let d = 0; d <= o.path.length; d += 6) road.push(o.path.posAtDist(d, V(0, 0, 0)));
      // (plain numbers, no vector made: the least angle between the direction m and the arc from a to b, all
      // three of length one; a line that fails is left at the first place that fails it)
      const ang = (ax, ay, az, m) => Math.acos(clamp(ax * m.x + ay * m.y + az * m.z, -1, 1));
      const arcGap = (ax, ay, az, bx, by, bz, m) => {
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const ln = Math.hypot(nx, ny, nz);
        if (ln < 1e-9) return ang(ax, ay, az, m);
        nx /= ln; ny /= ln; nz /= ln; const mn = m.x * nx + m.y * ny + m.z * nz, tx = m.x - nx * mn, ty = m.y - ny * mn, tz = m.z - nz * mn;
        const inA = nx * (ay * tz - az * ty) + ny * (az * tx - ax * tz) + nz * (ax * ty - ay * tx), inB = nx * (ty * bz - tz * by) + ny * (tz * bx - tx * bz) + nz * (tx * by - ty * bx);
        return inA >= 0 && inB >= 0 ? Math.abs(Math.asin(clamp(mn, -1, 1))) : Math.min(ang(ax, ay, az, m), ang(bx, by, bz, m)); };
      const discGap = (pts) => { const g = discs.map(() => 9);
        for (const e of road) { let ax = 0, ay = 0, az = 0;
          for (let i = 0; i < pts.length; i++) { let bx = pts[i].x - e.x, by = pts[i].y - e.y, bz = pts[i].z - e.z; const l = Math.hypot(bx, by, bz) || 1; bx /= l; by /= l; bz /= l;
            if (i > 0) for (let k = 0; k < discs.length; k++) { g[k] = Math.min(g[k], arcGap(ax, ay, az, bx, by, bz, discs[k][0]) / discs[k][1]); if (g[k] < 1.25) return null; }
            ax = bx; ay = by; az = bz; } }
        return g; };
      const gap = (a, b) => { let d = a - b; d -= TAU * Math.round(d / TAU); return Math.abs(d); };
      // (mend U, U1) fall: THE SHARE OF THE LAND'S FALL a far line takes at q (0 the ring .. 1 its hill), said ONCE:
      // the thread's mesh, the curve its climber rides and the climber's own light all read this one function.
      const fall = (q) => 1 - sstep(0, 0.6, 1 - q);
      for (let made = 0, tries = 0; made < NF && tries < NF * 20; tries++) {
        const bear = fl.range(0, TAU), dist = fl.range(3200, 6500), slack = fl.range(0.012, 0.03), ph = fl();
        if (gap(bear, own) < 25 * Math.PI / 180 || used.some((u) => gap(bear, u) < 9 * Math.PI / 180)) continue;
        const F = V(HUB.H.x + Math.cos(bear) * dist, shared.roof(HUB.H.x + Math.cos(bear) * dist, HUB.H.z + Math.sin(bear) * dist), HUB.H.z + Math.sin(bear) * dist);
        const dF = F.clone().sub(HUB.H), A = ringPoint(CABLE, ties, Math.atan2(dF.dot(CABLE.n), dF.dot(CABLE.X))), len = A.distanceTo(F), sag = slack * len;
        const at = (q, out) => { out.lerpVectors(A, F, q); out.y -= sag * 4 * q * (1 - q); return out; }, pts = [];
        for (let i = 0; i <= 24; i++) pts.push(at(i / 24, V(0, 0, 0)));
        if (o.path && pts.some((p, i) => i > 0 && o.path.distanceTo(p.x, p.y, p.z) < 60)) continue;
        const clear = discGap(pts); if (!clear) continue;
        pushThread(G, pts, O0, 0.3, ph, fall, 0, 0, 2);
        // (for what rides it: the same curve with the forest's fall its lower six tenths take)
        const ride = (q, out) => { at(q, out); out.y -= shared.drop(out.x, out.z) * fall(q); return out; };
        used.push(bear); farLines.push({ at: ride, fall, len, bearing: bear, footKm: dist / 1000, clear }); made++;
      } }
    tris += G.triangles; mk(G, 'strands-beyond', { uNetCol: netCol, uBox: still, uHairLit: hairLit }, HUB.H.x, HUB.H.y + 500, HUB.H.z - 1200, 3600); }
  // ---- loose web: long threads adrift in the air round the upper cable, wrapping across a box as the wind carries them
  { const G = threadGeo(), rng = cmStream(shared, fr.loose, 'loose-web', ctx), NL = o.loose ?? 44, W = 300;
    for (let j = 0; j < NL; j++) {
      const s = rng.range(90, 720), org = CABLE.at(s, rng.range(-W / 2, W / 2), rng.range(-120, 50));
      const len = rng.range(30, 95), dir = V(rng.range(-1, 1), rng.range(-0.9, 0.2), rng.range(-0.6, 0.6)).normalize(), bend = V(rng.range(-1, 1), rng.range(-1, 0.4), rng.range(-1, 1)).multiplyScalar(len * 0.22), pts = [];
      const kink = rng.range(0.8, 1.6);
      for (let i = 0; i <= 12; i++) { const q = i / 12; pts.push(V(0, 0, 0).addScaledVector(dir, (q - 0.5) * len).addScaledVector(bend, Math.sin(q * Math.PI * kink))); }
      pushThread(G, pts, org, (q) => 0.045 + 0.03 * Math.sin(Math.PI * q), rng(), 0, 1.6, 1, rng.range(0.6, 1.1));
    }
    tris += G.triangles; mk(G, 'loose-web', { uNetCol: netCol, uHairLit: hairLit, uBox: { value: new THREE.Vector4(-20 * CABLE.mx, W, 1.6, 0) } }, 0, 250, -750, 700); }
  return { object: group, triangles: tris, hair: hairFact, farLines };
}

// ---------------------------------------------------------------- seed-hair and moss hanging under the cables
// aH: s on the main cable, angle round its underside, length (m), phase.  aRt: for a tuft on another cable, its
// root in the world (w = 1); the main cable's are found from s (w = 0), so they ride its dips.
// position.x: q 0..1 down the tuft, position.z: side
const HAIR_VERT = /* glsl */`
attribute vec4 aH, aRt;
uniform vec3 uCP, uCD, uCN, uCX;
varying vec3 vW; varying vec4 vR; varying vec2 vA; varying float vFol;
${CM_GLSL}
${DIP_GLSL}
${CM_RIBBON}
void main(){
  float s = aH.x, q = position.x, t = clamp(s/${CABLE_L.toFixed(1)}, 0.0, 1.0);
  float rad = s < 300.0 ? mix(7.0, 4.5, clamp(s/300.0, 0.0, 1.0)) : mix(4.5, 3.0, clamp((s - 300.0)/400.0, 0.0, 1.0));
  vec3 out_ = uCX*sin(aH.y) - uCN*cos(aH.y);
  vec3 root = uCP + uCD*s + uCN*cmCableDip(s) + out_*rad*0.92;
  root.y -= cmDrop(root.xz)*(1.0 - smoothstep(0.0, ${CABLE_FALL.toFixed(2)}, t));
  vFol = 1.0 - smoothstep(0.0, ${CABLE_FALL.toFixed(2)}, t);
  if (aRt.w > 0.5) { root = aRt.xyz; vFol = 0.0; }
  // it hangs straight down and streams a little with the air
  // (round Q: the climb looks along the cable, and its hair is in the wind that comes up it: a hair swings a
  // third of its length to either side, where it swung an eighth)
  vec3 hang = vec3(0.3*sin(uTime*0.7 + aH.w*30.0), -1.0, 0.22*sin(uTime*0.5 + aH.w*17.0) + 0.18);
  vec3 c = root + (hang*q + out_*0.25*q*(1.0 - q))*aH.z;
  float k; vec4 mv = cmRibbon(c, normalize(hang), position.z, (0.9 + aH.z*0.14)*(1.0 - 0.3*q), k);
  vW = c; vR = vec4(position.z, q, aH.w, 1.0); vA = vec2(k, 1.0);
  gl_Position = projectionMatrix*mv;
}`;
const HAIR_FRAG = /* glsl */`
#define CM_FOLLOW vFol
varying vec3 vW; varying vec4 vR; varying vec2 vA; varying float vFol;
${CM_GLSL}
void main(){
  float s = abs(vR.x), q = clamp(vR.y, 0.0, 1.0);
  // many hairs in one ribbon: streaks of floss with gaps, thinning to nothing at the tip
  float fine = cmN(vec2(vR.x*19.0 + vR.z*23.0, q*4.0));
  float cx = vR.x*4.5 + vR.z*50.0 + 0.22*sin(q*5.0 + vR.z*70.0), id = floor(cx), f = fract(cx);
  float own = 0.3 + 0.7*cmH(vec2(id, floor(vR.z*977.0)));                       // each hair ends where it ends
  float aa = fwidth(cx);
  float line = 1.0 - smoothstep(0.16, 0.3 + aa, abs(f - 0.5));
  line = mix(line, 0.45, smoothstep(0.35, 1.2, aa));                            // too far to tell hairs apart: floss
  float e = line*(1.0 - smoothstep(own*0.7, own, q));
  vec3 v = normalize(cameraPosition - vW);
  float toward = clamp(dot(-v, uSunDir)*0.5 + 0.5, 0.0, 1.0);
  // grey-green moss and old seed-hair: dark against the sky from below, bright only where the sun is behind it
  vec3 light = cmAmb(vec3(0.0, -0.3, 0.0))*0.55 + vec3(0.06, 0.08, 0.04) + cmSunL*(0.05 + 0.4*toward*toward*toward*toward);
  vec3 col = mix(vec3(0.09, 0.12, 0.06), vec3(0.2, 0.24, 0.15), q)*(0.6 + 0.4*fine)*light;
  float al = e*(1.0 - 0.6*q)*clamp(vA.x, 0.0, 1.0)*0.7;
  col = cmAir(col, vW);
  gl_FragColor = vec4(col*al, al);
}`;
// o: { rng, grips, count, ends (the other cables, from makeCables) }
export function makeCableHair(ctx, shared, o) {
  const rng = cmStream(shared, o.rng, 'cable-hair', ctx), NM = o.count ?? 620, ends = o.ends || [], EACH = 44, N = NM + ends.length * EACH, SEG = 4, CABLE = shared.cable;
  const g = new THREE.InstancedBufferGeometry(); g.instanceCount = N;
  const p = [], idx = [];
  for (let i = 0; i <= SEG; i++) for (const sd of [-1, 1]) p.push(i / SEG, 0, sd);
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx);
  const aH = new Float32Array(N * 4), aRt = new Float32Array(N * 4), q3 = new THREE.Vector3();
  // under the main cable, thickest low down, in beards with barer lengths between; it stops 45 m short of the ring
  // (the web there is kept clean)
  const ph0 = rng.range(0, TAU), ph1 = rng.range(0, TAU);
  for (let i = 0; i < NM; i++) { const s = Math.pow(rng(), 0.8) * (CABLE.L - 45); aH.set([s, rng.gauss() * 0.8, rng.range(1.2, 5) * (0.35 + 1.5 * sstep(-0.5, 0.6, Math.sin(s * 0.043 + ph0) + 0.6 * Math.sin(s * 0.117 + ph1))), rng()], i * 4); }
  // under each other cable over its last 15 percent, where it comes in to the ring and holds still
  ends.forEach((e, c) => { for (let j = 0; j < EACH; j++) {
    const i = NM + c * EACH + j, q = rng.range(0.85, 0.985), ang = rng.gauss() * 0.7, r = lerp(e.r0, e.r0 * 0.55, q) * 0.9;
    e.at(q, 0, q3); aRt.set([q3.x + Math.sin(ang) * r * CABLE.mx, q3.y - Math.cos(ang) * r, q3.z, 1], i * 4);
    aH.set([0, ang, rng.range(1.2, 5) * (rng() < 0.12 ? 2 : 1), rng()], i * 4);
  } });
  g.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 4)); g.setAttribute('aRt', new THREE.InstancedBufferAttribute(aRt, 4));
  bound(g, 0, 240, -720, 900);
  const own = { uCP: { value: CABLE.P.clone() }, uCD: { value: CABLE.d.clone() }, uCN: { value: CABLE.n.clone() }, uCX: { value: CABLE.X.clone() }, uGr: { value: o.grips } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: HAIR_VERT, fragmentShader: HAIR_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.name = 'cable-hair'; m.renderOrder = 1; m.frustumCulled = false;
  return { object: m, triangles: N * SEG * 2 };
}
