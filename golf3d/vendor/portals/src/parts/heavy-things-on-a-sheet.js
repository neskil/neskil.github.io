// HEAVY THINGS ON A SHEET: hero set piece (the great well, the bowling ball, the marble ring, the golf ball that falls in)
// and the STYLE KIT the whole world is made from. Flat switch on: post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1,
// contrast: 1, vignette: 0, grain: 0 } }; every colour written is the hex on screen, nothing exceeds 1, no lights, no fog.
//
// STYLE KIT   const style = makeStyle(ctx, { palette, hour: 'four'|'golden'|'dawn'|'night', lightDir })
//   style.palette        { cloth, shade, ballpoint, plum, red, orange, brass }  linear THREE.Color
//   style.uniforms       shared by reference in every material: uWell[16] (x, z, depth D, a), uWellB[16] (pull, seated ball R,
//                        seated ball centre y), uBall[12] (shadow casters: centre, R), uL (toward the window), uPatch (x, z, half
//                        size, angle), uSeam (z, on), uWin (window patch on the wall), uTime
//   style.setWell(i, x, z, D, a, pull?, ballR?, ballY?)   a dip h = D a^2/(r^2+a^2); pull = metres of cloth drawn in (lines bend
//                        toward it and slide when it changes). Move it every frame and the ruling stretches under the ball.
//   style.setBall(i, x, y, z, R)   one long soft shadow + contact smudge on the cloth for a large ball (R 0 = off)
//   style.heightAt(x, z), style.normalAt(x, z, out)        the same cloth in JS, to seat and roll things
//   style.makeSheet({ radius, rings, sectors })  THE CLOTH: radial mesh (default 3 km, 120k tris), lifted in the vertex shader by
//                        the wells; ruling (0.8 m ballpoint every 40 m, every fifth 1.7 m, a half rule and a quarter rule seen close and gated by uHalfK, pale core, wobble, pen skips, no pencil;
//                        dots, wash under six pixels a cell), TWO FLAT TONES cut to an edge a pixel and a half wide (sheetShade:
//                        each ball's long shadow as one lozenge, each dip's crescent of shade from the cloth's own normal, no
//                        march and no penumbra), smudges, tension creases (thin strokes of shade tone), seam and patch are all
//                        drawn in its material from world x,z. Keep it under the camera.
//   style.makeRoom()     THE SKY: flat shade and the window's light, 40 degrees by 14, crossed by its bars (far-plane box; add
//                        once, it needs no placing; uWin = azimuth, elevation, lean, creep). No frame, no sill: shade and light only.
//                        (round classroom) THE ROOM IS THE CLASSROOM: on the same flat wall, drawn flat in the kit's own colours, a
//                        wainscot under a rail, the demonstrator's blackboard with its chalk drawings (left of the second window's
//                        light), a shelf of spare balls and a wall clock at the hour (either side of the first window's light).
//                        They stand still on the wall; only the light creeps and the clock's second hand goes round.
//   style.ballMaterial({ lit, shade, edge, body, post, gloss, side, aux })   two-tone unlit ink for every made thing; body/post
//                        are GLSL hooks (tone, lit, shd, col; vP, vN, vO, V, N); gloss: true adds sheetHit/sheetCol/windowQuad
//   style.makeMarbles(n) glass marbles (back shell + vane + rim + smudge strip): { group, set(i, x, y, z, R, quat), commit() }
//   style.glsl.common    sheetH, sheetN, sheetM, sheetInk, sheetShade (signed, for an fwidth edge), sheetLit for any further
//                        material (style.mk(vs, fs, extra, params))
//   style.update(dt, time, camera)   call once a frame if you own the style (buildHero does when it made its own)
//   Also exported: carvedSphere(R, wSeg, hSeg, fn, latPow, tick) and golfGeometry(wSeg, hSeg, tick) for further made balls.
//   The bowling ball is a MIRROR: its gloss shows the ruled sheet as a bent net of whole cells crossing both ways (the
//   reflected ray marched to the cloth, the ruling read there with most of the well's pull let out, lines never under two
//   pixels, the net stopping where a cell falls under five), the brass hoop as one thin line, the window, the marbles'
//   orange vanes (hero.setMirror(x, y, z, R) adds the world's own marble) and, close by, a rim of reflected light; never a
//   tone for the lit sheet (no level band). Glass marbles carry one thin limb line all the way round and a tone of their
//   own, so they read as balls on white cloth. The marble ring: an inner lane of small glass between the lens and the
//   ball, an outer lane that swings up the wall round the points given to setAvoid. uWellB[i].w (0..1, set after setWell)
//   draws long folds of shade down that well's wall; opts.lodgeTurn curls the falling ball's track round the well.
//   style.setRipple(dx, dz, offset, height)   one straight ripple in the cloth (the rare flick): crest where dot(xz, d) = offset;
//                        heightAt follows it and the cloth shades its lee side. uniforms.uOrg (vec2) places the ruling's origin.
//
// HERO   const hero = await buildHero(ctx, { style, sheet: false, room: false, detail, palette, marbles: 40, wellIndex: 0,
//          ballIndex: 0, golfStart: [x, z], lodgeTurn: 0, eventU: [0.5, 0.72] })
//   Local axes = world axes, origin on the well's axis at the rest plane; place it by object.position only (no rotation, no scale).
//   It uses wells wellIndex, wellIndex+1 and shadow balls ballIndex, ballIndex+1 of the style. Lip radius 280, well 150 m deep
//   (185 sunk), ball R 90 with its crown 40 m above the plane (5 m below when sunk). Stand-alone it brings its own sheet and room.
//   hero.setEvent(e)     0..0.65 the golf ball rolls from anchors.golfStart straight down the wall and lodges; 0.65..1 the well
//                        takes the weight (throat -35 m, ball -45 m, 55 m more cloth drawn in: every line slides downhill, the
//                        lip's shadow advances, the marble ring pulls in and quickens). hero.setProgress(u) maps eventU to e.
//                        Until one of them is called the piece loops the event by itself (the stand-alone viewer).
//   anchors (local)      lip, startAngle (where the course meets the lip), flyThrough (26 points: left spiral 100 degrees
//                        down to r 118, whip 130 degrees at r 118, flung out; 6 m off the cloth, heights for the well's depth
//                        at that point of the event), corridor (marble-free lane r 110..126), golfStart, golfLodged, ballCentre,
//                        ballCentreSunk, viewpoints { reveal, whip, crest }, portalSeat (the empty funnel's throat, for reference).
//   hero.clothAt(x, z, s) height of the great well alone, local, s = sink 0..1.
//   hero.setAvoid([x, z, radius, ...])   world plan points the marble ring steps aside for (the lens, the marble it follows).
//   hero.stepAside(x, y, z, R, dt, time) after update, in the same frame: the ring's marbles part for a body on the cloth (its centre
//                                        and radius as it stands), so that none stands inside it. See THE RING PARTS FOR A BODY.
//   wayRound(...)                        the bearing a marble that gives way takes round a body (shared with the world's whirlpool).
//   The marble ring is a closed form of time (no dt), so it is alive in a held frame and identical on every replay.
//   Cost: 128k triangles with its own sheet (79k without), 25 draw calls (23 without sheet and room), no lights, no textures,
//   build about 70 ms in steps under 30 ms, update 0.15 ms.
import * as THREE from 'three';

// THE WAY ROUND (the cure of our marble through the ring and the whirlpool). A marble that gives way to a body stands at a
// BEARING from it (a plan angle about the turning point: the body's place carried to the marble's own point on the cloth). With
// no memory that bearing is the marble's own bearing from the body, and a marble whose own place passes through the body's
// place would jump from one side of it to the other in one frame. So the bearing is KEPT (st, four numbers a marble: the
// bearing, whether it was in reach (2: on the floor's edge), its own offset last frame) and turns toward the marble's own bearing by at most
// max(TURNV/rho, pi*v/Dw) radians a second (TURNV metres a second round the body at the distance rho: under that the kept
// bearing IS the marble's own; v the speed of its own place past the body, counted to PASSV at most: enough to go half
// round while it passes),
// integrated with dt: dt 0 turns nothing. A marble not in reach last frame, or the first frame after the clock is set
// (fresh), takes its own bearing. THE FLOOR: a marble is never stood nearer the axis (cx, cz from the turning point) than
// rF. Along its bearing it stands where the two are D' apart, but no further than the floor's near edge (it gives up some
// of the margin there) and, with the turning point itself under the floor, no nearer than the floor's far edge (the
// caller: THE PLACE ALONG A BEARING). So that neither costs the clearance or a long way out, the bearing keeps off the
// floor: bearings within al of the bearing to the axis are those that lie under the floor at the plan distance rhoA: with
// the turning point outside the floor, the distance at which the two centres stand the two radii and FLOOR_AIR apart (at
// their heights as they are); with it under the floor, the whole reach Dw (going over to that across FLOOR_IN metres of
// depth). The kept bearing never enters that arc (it keeps to the arc's edge: when the arc first comes over a marble
// that was free, the edge on the side its own place is; after that the edge it is on) and never turns through it (it
// goes the other way round, outside the body). An arc under FLOOR_GAP wide at that distance is no arc (holding to the
// near edge inside it costs centimetres of air), and a marble on the far side of its floor from the body has none.
// Toward the edge of the reach (D from Dc to Dw) the bearing returns to the marble's OWN bearing (not the arc's edge), so
// that it is where it always was, to the bit, at Dw. Reads the two places, dt and nothing else.
const TURNV = 110, PASSV = 250, FLOOR_AIR = 2, FLOOR_GAP = 4, FLOOR_IN = 8, wrapA = (a) => a - Math.PI*2*Math.round(a/(Math.PI*2));
// THE SWING (the cure of the leap in the two lens rules: the ring's here, the whirlpool's in the world). Each rule pushes a marble
// near the lens's point along its own radius, to the side of that point its own radius lies on. When the point crossed a pushed
// marble's radius the side changed and the marble LEAPT to the other side of the point in one frame (the ring up to 134 m, the
// whirlpool up to 290 m). A marble cannot keep its side of a point that crosses its lane at up to 47 m a second at the visitor's
// pace 1 (kept so, it is carried off its lane with the point), so it changes side, but no longer in one frame: SWINGV is the most, in metres a second,
// that the swing itself adds along a marble's lane, the most its push from the point's radius changes while it is OUT, and the
// most it moves along its radius ACROSS and HOME (metres along the cloth; the way round's own turning speed), reached over
// SWING_UP seconds from its start; it eases in at 6 a second, never slower than 20 m a second. OUT it never comes toward the
// point's radius faster than that, but it gives way before the point as fast as the point comes. What the lane's own turning
// moves a marble is the lane's as ever. On a fresh frame (a still, a jump of the clock) there is no swing: every marble stands
// where the rule puts it, to the bit. SWINGA is the most, in metres a second each second, that the step of a swinging whirlpool marble's
// CENTRE changes from one frame to the next (4 m in a frame at 60 a second; the fourteenth counted it along its radius): it does not stop dead. A side change
// that moves a marble under SWING_MIN metres along its radius begins no swing: the marble takes the rule's place as ever. The
// visitor's pace moves the point faster or slower, and THE SWING'S SPEEDS FOLLOW IT (the fifteenth): the world reckons the pace
// (setPace; 1 at the visitor's pace 1; the slider's 0.4 comes as 0.455 and its 2.5 as 2.31, see the world's reckoning) and the
// swing's clock, its speeds and its easings run that many times as fast as at pace 1.
export const SWINGV = 110, SWING_UP = 0.25, SWINGA = 14400, SWING_MIN = 2;
// (THE SWING) which way along its lane a ring marble goes OUT: the way that takes it lim (half the rule's reach) past the point's
// bearing soonest (a reckoning: the swing itself goes no faster than SWINGV along the lane, so the way the lane carries is rated a
// little too soon), by the lane's own travel past that bearing (v, metres of chord a second) and what the swing may add (SWINGV, less
// where the lane's own turning, ol metres a second, already runs that way). way is the way it has (1 or -1), keep how many
// times sooner the other way must be before it turns (1 at the start of a swing, 2 once it is under way).
export function swingWay(way, keep, v, ol, tS, lim, sv = SWINGV) {
  const f = (s) => v*s + (ol*s > 0 ? Math.max(0, sv - Math.abs(ol)) : sv), ra = f(way), rb = f(-way);
  const ta = ra > 1 ? Math.max(0, lim - tS*way)/ra : Infinity, tb = rb > 1 ? Math.max(0, lim + tS*way)/rb : Infinity;
  return tb*keep < ta ? -way : way;
}
export function wayRound(st, k, ox, oz, pl, cx, cz, rF, R2, Dc, Dw, D, dt, fresh) {
  const Lc = Math.hypot(cx, cz), ac = Lc > 1e-3 ? Math.atan2(cz, cx) : 0, kept = st[k + 1] >= 1 && !fresh, onArc = kept && st[k + 1] === 2;
  const ad = pl > 1e-3 ? Math.atan2(oz, ox) : kept ? st[k] : ac + Math.PI;
  const rho = Math.max(pl, Dc), hard = R2 + FLOOR_AIR, rhoH = Math.sqrt(Math.max(0, hard*hard - D*D + pl*pl));   // R2: the two radii
  const ti = Math.min(1, Math.max(0, (rF - Lc)/FLOOR_IN)), rhoA = rhoH + (Math.max(Dw, rhoH) - rhoH)*ti*ti*(3 - 2*ti);
  let al = 0; if (Lc > 1e-3 && rhoA > 1e-3 && !(Lc > rF && pl*pl > Lc*Lc - rF*rF)) { const kap = (rhoA*rhoA + Lc*Lc - rF*rF)/(2*rhoA*Lc); al = kap >= 1 ? 0 : Math.acos(Math.max(-1, kap)); if (al > Math.PI - 0.05) al = Math.PI - 0.05; if (2*rhoA*Math.sin(Math.min(al, Math.PI/2)) < FLOOR_GAP) al = 0; }
  const fd = wrapA(ad - ac), base = Math.abs(fd) < al ? (fd >= 0 ? 1 : -1)*al : fd;   // where it would stand with no memory: its own bearing, or the floor's edge on its own side
  let fn = kept ? wrapA(st[k] - ac) : base;
  if (Math.abs(fn) < al) fn = !onArc && Math.abs(fd) < al ? base : (fn > 0 || (fn === 0 && fd >= 0) ? 1 : -1)*al;   // the floor's arc has come over the kept bearing: a marble that was free takes its own side's edge, one already on an edge keeps it
  const way = (a, b) => { let d = wrapA(b - a); if (al > 0 && (a >= 0) !== (b >= 0) && Math.abs(a) + Math.abs(b) < Math.PI) d -= (d >= 0 ? 1 : -1)*Math.PI*2; return d; };   // from a to b, never through the arc
  if (kept && dt > 0) { const lim = Math.max(TURNV/rho, Math.PI*Math.min(Math.hypot(ox - st[k + 2], oz - st[k + 3])/dt, PASSV)/Dw)*dt, d = way(fn, base);
    fn = wrapA(fn + Math.max(-lim, Math.min(lim, d))); if (Math.abs(fn) < al) fn = (fn >= 0 ? 1 : -1)*al; }
  st[k] = ac + fn; st[k + 1] = al > 0 && Math.abs(fn) < al + 1e-6 ? 2 : 1; st[k + 2] = ox; st[k + 3] = oz;
  const t = Math.min(1, Math.max(0, (D - Dc)/(Dw - Dc))), w = 1 - t*t*(3 - 2*t);
  return ac + fd + w*(wrapA(base - fd) + way(base, fn));
}

export const PALETTE = ['#F2F0EA', '#C9D2DE', '#2B55C8', '#2A1B3D', '#A11D1D', '#E8552D', '#C9A227'];
const NW = 16, NB = 12;

// ---------------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the world. World space throughout: plan position is world xz.
//   sheetH(p)      height of the cloth at plan p: minus the sum of the wells, draped under any seated ball
//   sheetM(p)      MATERIAL coordinate of the cloth at plan p (cloth is drawn toward each well: lines bend and slide)
//   sheetMG(p, g)  the same, with g = how hard the ruling is squeezed or gathered across each family of lines there; the
//                  cloth passes it to sheetInk(m, fw, g) so a stroke keeps one width on the cloth however far it is stretched
//   sheetInk(m,fw) ballpoint coverage 0..1 of the ruling at material coordinate m with pixel footprint fw (metres)
//   sheetLit(P)    1 lit .. 0 shade for a point P on (or above) the cloth: ball shadows + the cloth's own lip shadow
// ---------------------------------------------------------------------------------------------------------------
const GLSL_COMMON = /* glsl */`
#define NW ${NW}
#define NB ${NB}
uniform vec4 uWell[NW];   // x, z, depth D, half-width a   (h = D a^2 / (r^2 + a^2))
uniform vec4 uWellB[NW];  // pull (m of cloth drawn in), seated ball radius (0 none), seated ball centre y, folds 0..1
uniform vec4 uBall[NB];   // shadow casters: centre xyz, radius (0 = off)
uniform vec3 uL;          // unit vector toward the window
uniform vec4 uPatch;      // sewn patch: centre x, z, half size, grid angle (rad)
uniform vec2 uSeam;       // seam: plan z of the seam, 1 = on
uniform float uTime;
uniform vec2 uOrg;      // where the ruling's origin lies on the cloth
uniform vec4 uRip;      // the flick: direction x, z, offset along it (m), height (m)
uniform vec4 uHalfK;    // how much of the half rule (xy) and the quarter rule (zw) each family of lines shows (x, z: lines running along z; y, w: along x); the world turns down the family we cross at speed
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float sheetH(vec2 p){
  float rd = dot(p, uRip.xy) - uRip.z; float y = uRip.w*exp(-rd*rd*.0014);
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec2 d = p - w.xy; float a2 = w.w*w.w; y -= w.z*a2/(dot(d,d)+a2+1e-3); }
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec4 b = uWellB[i]; vec2 d = p - w.xy; float q = b.y*b.y - dot(d,d);
    if (q > 0.) y = min(y, b.z - sqrt(q) - .15); }
  return y;
}
vec3 sheetN(vec2 p){ float e = .6; float hx = sheetH(p+vec2(e,0.)) - sheetH(p-vec2(e,0.)); float hz = sheetH(p+vec2(0.,e)) - sheetH(p-vec2(0.,e));
  return normalize(vec3(-hx, 2.*e, -hz)); }
vec2 sheetM(vec2 p){
  vec2 m = p - uOrg;
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec2 d = p - w.xy; float r = length(d); float a = max(w.w, 1.);
    m += d/max(r, 1e-3) * uWellB[i].x * (1.5708 - atan(r/a)); }
  return m;
}
// the same, and g: how many metres of ruling pass per metre of cloth across each family of lines (under 1 where a well has
// drawn the cloth out, over 1 where it has gathered it), so the pen keeps ONE width on the cloth however far it is stretched
vec2 sheetMG(vec2 p, out vec2 g){
  vec2 m = p - uOrg; vec2 r0 = vec2(1., 0.), r1 = vec2(0., 1.);
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec2 d = p - w.xy; float r = max(length(d), 1e-3); float a = max(w.w, 1.); vec2 n = d/r;
    float f = uWellB[i].x*(1.5708 - atan(r/a)); float fr = f/r, fp = -uWellB[i].x*a/(r*r + a*a);
    m += n*f; float k = fp - fr;
    r0 += vec2(fr + k*n.x*n.x, k*n.x*n.y); r1 += vec2(k*n.x*n.y, fr + k*n.y*n.y); }
  g = vec2(length(r0), length(r1)); return m;
}
// one family of ruled lines: u across the lines, v along them. half = how much of the half rule (a thinner line
// midway between two ruled ones, so a cell is 20 m where the cloth is seen close) is drawn here
float ruleAxis(float u, float v, float fw, float seed, float half_, float quart, float g, float gv){
  g = clamp(g, .08, 3.);                                                                 // the stroke's width is a width on the cloth, not in the stretched ruling
  float j = floor(u/40. + .5);
  float id = j*7.31 + seed;
  float wob = (vn(vec2(v*.011 + id, id*1.7)) - .5)*.7 + (vn(vec2(v*.09, id)) - .5)*.12 + (h11(id) - .5)*.5;
  wob *= min(g, 1.);
  float du = u - j*40. + wob;
  float heavy = 1. - step(.25, abs(mod(j + .5, 5.) - .5));
  float w = mix(.8, 1.7, heavy)*g;
  float f = max(fw, 1e-3);
  float wv = max(w, f*mix(1.7, 2.6, heavy));                                             // never thinner than a pixel and a half
  float cov = clamp((min(du + .5*f, .5*wv) - max(du - .5*f, -.5*wv))/f, 0., 1.)*max(mix(.9, .96, heavy), w/wv);   // box filter
  float core = 1. - .3*(1. - smoothstep(.12*w, .34*w, abs(du)))*(1. - smoothstep(.1*w, .5*w, f));   // pale core, dark edges
  float along = smoothstep(.5, .75, gv);                                                  // (no skips where the cloth is drawn out along the line: a skip would stretch into a loose lozenge)
  float skip = smoothstep(.82, .86, vn(vec2(v*.1 + id*3.1, id)))*(1. - smoothstep(.5, 3., f/g))*along;     // the pen skipped
  float press = .9 + .1*vn(vec2(v*.02 - id, id*.3));
  cov *= core*(1. - skip)*press;
  // the half rule
  float j2 = floor(u/40.); float id2 = j2*5.17 + seed + 3.3;
  float du2 = u - j2*40. - 20. + ((vn(vec2(v*.013 + id2, id2*1.3)) - .5)*.8 + (h11(id2) - .5)*.6)*min(g, 1.);
  float wv2 = max(.5*g, f*1.5);
  float cov2 = clamp((min(du2 + .5*f, .5*wv2) - max(du2 - .5*f, -.5*wv2))/f, 0., 1.)*max(.85, .5*g/wv2);
  cov2 *= (1. - smoothstep(.84, .88, vn(vec2(v*.1 + id2*3.1, id2)))*(1. - smoothstep(.5, 3., f/g))*along)*half_;
  cov = max(cov, cov2);
  // the quarter rule: a hair of the same pen every 10 m, seen only from very close
  float j3 = floor(u/20.); float id3 = j3*3.71 + seed + 9.1;
  float du3 = u - j3*20. - 10. + ((vn(vec2(v*.017 + id3, id3*1.1)) - .5)*.6 + (h11(id3) - .5)*.5)*min(g, 1.);
  float wv3 = max(.3*g, f*1.3);
  float cov3 = clamp((min(du3 + .5*f, .5*wv3) - max(du3 - .5*f, -.5*wv3))/f, 0., 1.)*max(.7, .3*g/wv3)*.8;
  cov = max(cov, cov3*quart*(1. - smoothstep(.8, .86, vn(vec2(v*.13 + id3*2.3, id3)))*along));
  float k = 1. + heavy;                                                                  // heavy lines survive twice as far
  return mix(cov, mix(.2, .34, heavy), smoothstep(40./12.*k, 40./6.*k, f));                         // under six pixels a cell: even wash
}
// xy: ink coverage, (pencil dots: none; the demonstrator's pencil is rubbed out)
vec2 sheetInk(vec2 m, vec2 fw, vec2 g){
  float half_ = 1. - smoothstep(.34, .72, sqrt(max(fw.x*fw.y, 1e-6)));    // the half rule shows where a 20 m cell is seen large
  float quart = 1. - smoothstep(.11, .27, sqrt(max(fw.x*fw.y, 1e-6)));
  float ax = ruleAxis(m.x, m.y, fw.x, 0., half_*uHalfK.x, quart*uHalfK.z, g.x, g.y);
  float az = ruleAxis(m.y, m.x, fw.y, 51.7, half_*uHalfK.y, quart*uHalfK.w, g.y, g.x);
  return vec2(1. - (1. - ax)*(1. - az), 0.);
}
vec2 sheetInk(vec2 m, vec2 fw){ return sheetInk(m, fw, vec2(1.)); }
// TWO FLAT TONES. sheetShade is signed: above 0 lit, below 0 shade, about a metre per unit, so a material that has
// derivatives can cut it to an edge a pixel and a half wide however far a shadow has run (the cloth does), and one that has
// none uses sheetLit (a fixed edge of 0.6 m). Ball shadows: the ray to the window against each sphere, one long lozenge per
// ball that bends into any dip it crosses. The cloth's own shade is the side of a dip turned from the window, from the
// surface normal: the light stands low for a shallow dip, so each has its crescent, and higher down in a deep well, so
// the great well is a crescent too and never a pit of shade. No march, no penumbra.
float sheetSelf(vec3 P){
  vec3 n = sheetN(P.xz);
  vec2 lh = normalize(uL.xz + vec2(1e-5, 0.));
  float rise = -dot(n.xz, lh)/max(n.y, .05);                       // metres the cloth climbs per metre toward the window
  // a ball's own dip keeps its crescent wherever it sits, also on the wall of a great well (where the light stands higher):
  // the part of the climb that belongs to the great wells (half-width 65 m and over) is taken off before the low threshold
  float big = 0.;
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec2 d = P.xz - w.xy; float a2 = w.w*w.w, q = dot(d, d) + a2;
    big += step(65., w.w)*2.*w.z*a2*dot(d, lh)/(q*q); }
  return min(mix(.15, .45, smoothstep(8., 70., -P.y)) - rise, .15 - (rise - max(big, 0.)));
}
float sheetShade(vec3 P, float selfShadow){
  float v = 1e3;
  for (int i = 0; i < NB; i++){ vec4 b = uBall[i]; vec3 oc = b.xyz - P; float t = dot(oc, uL);
    float d = sqrt(max(dot(oc,oc) - t*t, 0.));
    v = min(v, mix(1e3, max(d - b.w*1.16, -t), step(.5, b.w))); }
  if (selfShadow > .5) v = min(v, sheetSelf(P)*40.);
  return v;
}
float sheetLit(vec3 P, float selfShadow){ return clamp(.5 + sheetShade(P, selfShadow)/.6, 0., 1.); }
`;

const SHEET_VERT = /* glsl */`
${GLSL_COMMON}
varying vec3 vP;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  wp.y += sheetH(wp.xz);
  vP = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const SHEET_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 cCloth, cShade, cInk, cPlum;
varying vec3 vP;
void main(){
  vec2 p = vP.xz;
  vec2 gm; vec2 m = sheetMG(p, gm);
  // the sewn patch: its own ruling, a few degrees off true
  vec2 pd = m - uPatch.xy; float inPatch = step(max(abs(pd.x), abs(pd.y)), uPatch.z)*step(.5, uPatch.z);
  float ca = cos(uPatch.w), sa = sin(uPatch.w);
  vec2 mr = mix(m, uPatch.xy + mat2(ca, -sa, sa, ca)*pd + vec2(13., 7.), inPatch);
  vec2 fw = fwidth(m) * 1.0;
  float edgeD = abs(max(abs(pd.x), abs(pd.y)) - uPatch.z);            // distance to the patch hem
  float fwm = max(fw.x, fw.y);
  vec2 ink = sheetInk(mr, fw, gm);
  // two flat tones and one edge, a pixel and a half wide
  float sv = sheetShade(vP, 1.);
  // the flick: the whole side of the ripple turned from the window is in shade, one straight band crossing the sheet
  float rdd = dot(p, uRip.xy) - uRip.z;
  float rsl = -uRip.w*exp(-rdd*rdd*.0014)*rdd*.0028*dot(uRip.xy, normalize(uL.xz + vec2(1e-5, 0.)));
  sv = min(sv, (.02 - rsl)*300.);
  float lit = clamp(.5 + sv/(1.5*fwidth(sv) + 1e-4), 0., 1.);
  vec3 cSh = clamp(cShade + (cShade - cCloth)*.42, 0., 1.);       // shade on the cloth: a step deeper than the room's tone
  vec3 tone = mix(cSh, cCloth, lit);
  // tension creases running downhill on every slope: thin strokes of shade tone, crisp on one side, each its own length;
  // no fixed period (their places round a dip are jittered and they never quite settle)
  float fwp = max(length(dFdx(vP)), length(dFdy(vP))) + 1e-4;         // metres a pixel covers here
  float wr = 0., fold = 0.;
  for (int i = 0; i < NW; i++){ vec4 w = uWell[i]; vec2 d = p - w.xy + vec2(1e-3, 0.); float r2 = dot(d,d); float r = sqrt(r2); float a2 = w.w*w.w;
    float slope = 2.*w.z*a2*r/((r2+a2)*(r2+a2) + 1.);
    float nc = 2.*floor(9. + w.w*.16);
    float ang = atan(d.y, d.x)/6.2832;
    float t = ang*nc + float(i)*.37;
    float c = floor(t); float hs = h11(c + float(i)*17.3), hl = h11(c*3.1 + float(i)*5.9);
    float dm = (t - c - .5 - (hs - .5)*.55 - .05*sin(uTime*.7 + c*1.9))*6.2832/nc*r;      // metres from the crease
    float hw = max(.16, .9*fwp);
    float line = (1. - smoothstep(hw, hw + fwp, dm))*smoothstep(-hw - .35*fwp, -hw, dm);
    float thr = mix(.07, .22, hl);
    wr = max(wr, line*smoothstep(thr, thr*1.2, slope)*step(.45, h11(c*5.7 + float(i)*1.3))*step(uWellB[i].y + 1., r));
    // pulled folds: a well that has just taken more weight (uWellB.w) draws a few long tapered wedges of shade down its wall
    float tf = ang*13. + float(i)*.61; float cf = floor(tf); float hf = h11(cf*2.3 + float(i)*7.1);
    float dmf = (tf - cf - .5 - (hf - .5)*.5)*6.2832/13.*r;
    float wf = (1.6 + 1.6*hf)*smoothstep(w.w*1.08, w.w*1.5, r)*(1. - smoothstep(w.w*(1.7 + .6*hf), w.w*(2.5 + hf), r))*uWellB[i].w;
    fold = max(fold, (1. - smoothstep(wf - fwp, wf + fwp, abs(dmf) + (1. - step(.02, wf))*1e3))); }
  tone = mix(tone, cSh, wr*lit*(1. - smoothstep(1.2, 2.6, fwp)));
  tone = mix(tone, cSh, fold*lit);
  // contact smudge under every large ball
  float sm = 0.;
  for (int i = 0; i < NB; i++){ vec4 b = uBall[i]; float g = length(vP - b.xyz) - b.w;
    sm = max(sm, (1. - smoothstep(0., .3*b.w + .01, g))*step(.5, b.w)); }
  tone = mix(tone, cPlum, sm*sm*.5);
  // the seam: a double row of thread stitches; the patch hem
  float sz = abs(abs(m.y - uSeam.x) - 5.);
  float dash = step(.42, fract(m.x/7. + .3*vn(vec2(m.x*.02, 3.))));
  float st = (1. - smoothstep(.22, .22 + fwm + .05, sz))*dash*uSeam.y*(1. - smoothstep(1., 4., fwm));
  float hemDash = step(.4, fract((pd.x + pd.y)/5.));
  st = max(st, (1. - smoothstep(.25, .3 + fwm, abs(edgeD - 1.6)))*hemDash*step(.5, uPatch.z)*step(max(abs(pd.x), abs(pd.y)), uPatch.z)*(1. - smoothstep(1., 4., fwm)));
  tone = mix(tone, mix(cShade, cPlum, .1), (1. - smoothstep(.0, .5 + fwm, edgeD))*.6*step(.5, uPatch.z));   // hem's thin shadow
  tone = mix(tone, mix(cCloth, cShade, lit*.9 + .0)*.97, st*.75);
  // pencil dots, then ballpoint on top: shadow never darkens the ballpoint
  vec3 col = mix(tone, cInk, clamp(ink.x, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;

const ROOM_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
// The room: one flat field of shade tone, and on the wall to the right of the course (-X) the window's light.
// (round classroom) On that wall, flat and still, the classroom's things: wainscot, blackboard, shelf of balls, clock.
const ROOM_FRAG = /* glsl */`
uniform vec3 cCloth, cShade, cPlum, cWhite, cOrange, cRed, cBrass, uL; uniform float uClock, uTime;   // (uClock: the hour the clock's hands show; uTime sweeps its second hand)
uniform vec4 uWin, uWin2;   // azimuth of patch centre (rad, 0 = -X wall, + toward +Z), elevation, lean, creep (uWin2: a second window's light, .w = how many times taller, 0 = none)
varying vec3 vD;
vec2 winUV(vec3 d, vec4 wn, float hs){
  float az0 = wn.x + wn.w, el0 = wn.y - wn.w*.35;
  float ca = cos(az0), sa = sin(az0), ce = cos(el0), se = sin(el0);
  vec3 c = vec3(-ca*ce, se, sa*ce), r = vec3(sa, 0., ca), up = vec3(ca*se, ce, -sa*se);
  float f = dot(d, c); vec2 q = vec2(dot(d, r), dot(d, up))/max(f, .05);
  return f > .05 ? vec2((q.x - wn.z*q.y)/.365, q.y/(.1226*hs)) : vec2(9.);    // 40 degrees wide, 14 tall, leaning
}
float panes(vec2 w, vec2 f){
  float inside = (1. - smoothstep(1. - f.x, 1. + f.x, abs(w.x)))*(1. - smoothstep(1. - f.y, 1. + f.y, abs(w.y)));
  // glazing bars in shade tone: three upright, two across
  float bu = min(min(abs(w.x + .5), abs(w.x)), abs(w.x - .5));
  float bv = min(abs(w.y + .333), abs(w.y - .333));
  float bars = max(1. - smoothstep(.022, .022 + 2.*f.x, bu), 1. - smoothstep(.05, .05 + 2.*f.y, bv));
  return inside*(1. - bars);
}
// (round classroom) a thing on the wall at azimuth az and elevation el lies in its own flat plane, as the window's light does:
// xy = its plane's coordinates (x toward greater azimuth, y up), z = 1 where the plane is in front of us
vec3 wallQ(vec3 d, float az, float el, out vec3 c, out vec3 r, out vec3 up){
  float ca = cos(az), sa = sin(az), ce = cos(el), se = sin(el);
  c = vec3(-ca*ce, se, sa*ce); r = vec3(sa, 0., ca); up = vec3(ca*se, ce, -sa*se);
  float f = dot(d, c); return vec3(vec2(dot(d, r), dot(d, up))/max(f, .05), step(.05, f));
}
float chalk(float dist, float w, float fw){ return 1. - smoothstep(w - fw, w + fw, dist); }
float slab(vec2 p, vec2 b, float fw){ vec2 a = abs(p) - b; return 1. - smoothstep(-fw, fw, max(a.x, a.y)); }
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0., 1.)); }
// a spare ball on the shelf: a flat disc in its two tones, lit from where the cloth's light comes
vec3 spare(vec3 col, vec2 sp, float fw, vec3 c, vec3 r, vec3 up, float x, float rad, vec3 lit, float on){
  vec2 o = (sp - vec2(x, rad))/rad; float m = (1. - smoothstep(1. - fw/rad, 1. + fw/rad, length(o)))*on;
  vec3 n = o.x*r + o.y*up - sqrt(max(1. - dot(o, o), 0.))*c;
  return mix(col, mix(mix(lit, cPlum, .55), lit, smoothstep(-.05, .05, dot(n, uL))), m);
}
void main(){
  vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
  // each a flat leaning parallelogram on the wall: its edges and bars are straight lines (derivatives taken here, outside any branch)
  vec2 w1 = winUV(d, uWin, 1.), w2 = winUV(d, vec4(uWin2.xyz, uWin.w), max(uWin2.w, .1));
  vec2 f1 = min(fwidth(w1), vec2(.2)) + 1e-4, f2 = min(fwidth(w2), vec2(.2)) + 1e-4;      // (the clamp keeps the seam far behind clean)
  float lightK = max(panes(w1, f1), panes(w2, f2)*step(.05, uWin2.w));
  // (round classroom) every coordinate and its derivative is taken here, outside any branch; below, each thing is drawn only
  // inside its own box on the wall (outside that box every one of its terms is nought), so most pixels do none of its work
  vec3 bc, br, bu, sc, sr, su, kc, kr, ku;
  vec3 bq = wallQ(d, uWin2.x + .65, .166, bc, br, bu);       // the blackboard: 37 degrees left of the second window's light, its tray lying over the rail
  vec3 sq = wallQ(d, uWin.x - .75, .1, sc, sr, su);          // the shelf: 43 degrees right of the first window's light
  vec3 kq = wallQ(d, uWin.x + .52, .135, kc, kr, ku);        // the clock: 30 degrees left of it, low on the wall
  vec2 bp = bq.xy/.1, sp = sq.xy, kp = kq.xy/.045;          // (the board's half sizes are 2.35 by 1 in bp; the clock's face is the unit disc in kp)
  float bf = min(length(fwidth(bp)), .3)*.7 + 1e-4, sf = min(length(fwidth(sp)), .05)*.7 + 1e-5, kf = min(length(fwidth(kp)), .5)*.7 + 1e-4;
  float ef = min(fwidth(d.y), .02) + 1e-5;
  vec3 lineC = mix(cShade, cPlum, .24), col = cShade;
  // the wainscot: a darker band along the foot of the wall, under its rail
  col = mix(col, mix(cShade, cPlum, .15), 1. - smoothstep(.046 - ef, .046 + ef, d.y));
  col = mix(col, lineC, chalk(abs(d.y - .049), .003, ef));
  // the blackboard: plum-black in a brass frame, a tray under it with two chalks and the felt
  float onB = bq.z;
  if (onB > .5 && abs(bp.x) < 2.9 && bp.y > -1.5 && bp.y < 1.4) {
  col = mix(col, cBrass, slab(bp, vec2(2.43, 1.08), bf)*onB);
  vec3 boardC = mix(cPlum, cShade, .1);
  col = mix(col, boardC, slab(bp, vec2(2.35, 1.), bf)*onB);
  col = mix(col, lineC, slab(bp - vec2(0., -1.17), vec2(2.55, .05), bf)*onB);
  col = mix(col, cWhite, max(slab(bp - vec2(1.0, -1.085), vec2(.1, .03), bf), slab(bp - vec2(.62, -1.085), vec2(.07, .03), bf))*onB);
  col = mix(col, mix(cShade, cPlum, .5), slab(bp - vec2(-1.3, -1.07), vec2(.17, .05), bf)*onB);
  // the chalk: the well from above (rings, spokes, the heavy ball, one marble on its way round: a still dot), the sheet in section with the
  // ball in its dip over the dashed line where the cloth lay, an orbit, and three lines of the teacher's hand (no letter)
  float ch = 0., w = .024;
  { vec2 q = bp - vec2(1.28, .0); float ra = length(q), th = atan(q.y, q.x), dl = mod(th + .3927, .7854) - .3927;
    ch = max(ch, max(max(chalk(abs(ra - .2), w, bf), chalk(abs(ra - .46), w, bf)), chalk(abs(ra - .76), w, bf)));
    ch = max(ch, chalk(ra*abs(sin(dl)), w*.8, bf)*step(.2, ra)*(1. - step(.76, ra)));
    ch = max(ch, chalk(ra, .075, bf));
    ch = max(ch, chalk(length(q - .46*vec2(cos(2.2), sin(2.2))), .06, bf)); }
  { float x = bp.x + 1.22, tt = x/.3, ys = .46 - .98/(1. + tt*tt), sl = .98*2.*tt/(.3*(1. + tt*tt)*(1. + tt*tt));
    float inX = 1. - smoothstep(.86 - bf, .86 + bf, abs(x));
    ch = max(ch, chalk(abs(bp.y - ys)/sqrt(1. + sl*sl), w, bf)*inX);
    ch = max(ch, chalk(abs(bp.y - .46), w*.7, bf)*inX*step(.45, fract(x*3.5 + .2))*.8);
    ch = max(ch, chalk(length(vec2(x, bp.y + .33)), .185, bf)); }
  { vec2 q = (bp - vec2(.02, -.5))/vec2(.5, .26);
    ch = max(ch, chalk(abs(length(q) - 1.)*.26, w, bf));
    ch = max(ch, chalk(length(bp - vec2(-.2, -.5)), .06, bf));
    ch = max(ch, chalk(length(bp - vec2(.02 + .5*cos(.9), -.5 + .26*sin(.9))), .045, bf));
    ch = max(ch, chalk(abs(bp.y - .62 - .035*sin(bp.x*36.)), w*.75, bf)*slab(bp - vec2(.03, .62), vec2(.45, .2), bf));
    ch = max(ch, chalk(abs(bp.y - .36 - .035*sin(bp.x*33. + 2.)), w*.75, bf)*slab(bp - vec2(-.05, .36), vec2(.37, .2), bf));
    ch = max(ch, chalk(abs(bp.y - .1 - .035*sin(bp.x*39. + 4.)), w*.75, bf)*slab(bp - vec2(.11, .1), vec2(.27, .2), bf)); }
  col = mix(col, cWhite, ch*.9*slab(bp, vec2(2.3, .96), bf)*onB);
  }
  // the shelf of spare balls: a plank on two brackets, and the kit's balls on it, each in its own two tones
  float onS = sq.z;
  if (onS > .5 && abs(sp.x) < .33 && sp.y > -.08 && sp.y < .13) {
  col = mix(col, lineC, max(slab(sp - vec2(0., -.005), vec2(.27, .005), sf), max(slab(sp - vec2(.17, -.022), vec2(.005, .013), sf), slab(sp - vec2(-.17, -.022), vec2(.005, .013), sf)))*onS);
  col = spare(col, sp, sf, sc, sr, su, -.215, .036, cRed, onS);
  col = spare(col, sp, sf, sc, sr, su, -.145, .02, cWhite, onS);
  col = spare(col, sp, sf, sc, sr, su, -.085, .029, cOrange, onS);
  col = spare(col, sp, sf, sc, sr, su, -.005, .042, mix(cPlum, cShade, .12), onS);
  col = spare(col, sp, sf, sc, sr, su, .065, .019, cBrass, onS);
  col = spare(col, sp, sf, sc, sr, su, .125, .031, cWhite, onS);
  col = spare(col, sp, sf, sc, sr, su, .2, .024, cOrange, onS);
  }
  // the clock: a face of the kit's white in a rim, twelve marks, two hands at the hour and a second hand in the kit's ball colour (red; navy on biro)
  // going round (screen right is toward lesser azimuth)
  float onK = kq.z;
  if (onK > .5 && dot(kp, kp) < 2.6) {
  float kr0 = length(kp), ka = atan(-kp.x, kp.y);
  col = mix(col, lineC, chalk(kr0, 1.14, kf)*onK);
  col = mix(col, cWhite, chalk(kr0, 1., kf)*onK);
  { float tk = abs(fract(ka*1.9099 + .5) - .5)*.5236*kr0;
    col = mix(col, lineC, chalk(tk, .035, kf)*step(.78, kr0)*(1. - step(.93, kr0))*onK);
    float ah = uClock*.5236, am = fract(uClock)*6.2832;
    col = mix(col, cPlum, max(chalk(seg(kp, vec2(0.), .5*vec2(-sin(ah), cos(ah))), .07, kf), chalk(seg(kp, vec2(0.), .8*vec2(-sin(am), cos(am))), .045, kf))*onK);
    float as = uTime*.10472;
    col = mix(col, cRed, chalk(seg(kp, .18*vec2(sin(as), -cos(as)), .84*vec2(-sin(as), cos(as))), .022, kf)*onK);
    col = mix(col, cPlum, chalk(kr0, .09, kf)*onK); }
  }
  gl_FragColor = vec4(mix(col, cCloth, lightK), 1.);
}`;

// Gloss and glass see the cloth analytically: a short march against sheetH, then the same ruling function there.
const GLSL_GLOSS = /* glsl */`
uniform vec3 cCloth, cShade, cInk, cPlum, cWhite;
float sheetHit(vec3 o, vec3 d){
  float t = 3., tp = 0., hp = max(o.y - sheetH(o.xz), 0.);
  for (int k = 0; k < 16; k++){ vec3 q = o + d*t; float h = q.y - sheetH(q.xz);
    if (h < 0.) return mix(tp, t, hp/max(hp - h, 1e-4));
    tp = t; hp = h; t *= 1.42; }
  return -1.;
}
vec3 sheetCol(vec3 q, float fw){
  vec2 ink = sheetInk(sheetM(q.xz), vec2(fw));
  float lit = clamp(.5 + sheetShade(q, 1.)/max(1.5*fw, .3), 0., 1.);
  return mix(mix(clamp(cShade + (cShade - cCloth)*.42, 0., 1.), cCloth, lit), cInk, clamp(ink.x, 0., 1.));
}
float windowQuad(vec3 d){
  vec3 r = normalize(cross(vec3(0., 1., 0.), uL)); vec3 u = cross(uL, r);
  float f = dot(d, uL); vec2 q = vec2(dot(d, r), dot(d, u))/max(f, 1e-3);
  q.x += q.y*.25; q /= vec2(.36, .22);
  float inside = step(.05, f)*(1. - smoothstep(.93, 1., abs(q.x)))*(1. - smoothstep(.9, 1., abs(q.y)));
  float bars = max(1. - smoothstep(.05, .09, min(min(abs(q.x + .5), abs(q.x)), abs(q.x - .5))),
                   1. - smoothstep(.08, .14, min(abs(q.y + .333), abs(q.y - .333))));
  return inside*(1. - bars);
}
// the window's light lying on the wall of the room (the same patch the room draws), for the gloss and the glass
uniform vec4 uWin, uWin2;
vec2 winUV(vec3 d, vec4 wn, float hs){
  float az0 = wn.x + wn.w, el0 = wn.y - wn.w*.35;
  float ca = cos(az0), sa = sin(az0), ce = cos(el0), se = sin(el0);
  vec3 c = vec3(-ca*ce, se, sa*ce), r = vec3(sa, 0., ca), up = vec3(ca*se, ce, -sa*se);
  float f = dot(d, c); vec2 q = vec2(dot(d, r), dot(d, up))/max(f, .05);
  return f > .05 ? vec2((q.x - wn.z*q.y)/.365, q.y/(.1226*hs)) : vec2(9.);    // 40 degrees wide, 14 tall, leaning
}
float wallPatch1(vec3 d, vec4 wn, float hs){
  vec2 wuv = winUV(d, wn, hs); float u = wuv.x, v = wuv.y;
  float inside = (1. - smoothstep(.97, 1.03, abs(u)))*(1. - smoothstep(.94, 1.06, abs(v)));
  float bu = min(min(abs(u + .5), abs(u)), abs(u - .5)), bv = min(abs(v + .333), abs(v - .333));
  return inside*(1. - max(1. - smoothstep(.022, .05, bu), 1. - smoothstep(.05, .1, bv)));
}
float wallPatch(vec3 d){ return max(wallPatch1(d, uWin, 1.), wallPatch1(d, vec4(uWin2.xyz, uWin.w), max(uWin2.w, .1))*step(.05, uWin2.w)); }
vec3 roomCol(vec3 d){ return mix(cShade, cWhite, max(windowQuad(d), wallPatch(d))); }
`;

// Two-tone unlit ink for every made thing (leather, stitches, brass, vane). 'body' may alter: float tone (1 lit, 0 shade),
// vec3 lit, vec3 shd, vec3 col (after "col = mix(shd, lit, tone)" use the 'post' hook). Available: vP (world), vN (world), vO (object).
const BALL_VERT = /* glsl */`
varying vec3 vP, vN, vO;
void main(){
  vO = position; vec4 wp = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix*wp; n = mat3(instanceMatrix)*n;
  #endif
  wp = modelMatrix*wp; vP = wp.xyz; vN = mat3(modelMatrix)*n;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const ballFrag = (body = '', post = '', gloss = false, pre = '') => /* glsl */`
${GLSL_COMMON}
${gloss ? GLSL_GLOSS : ''}
${pre}
uniform vec3 cLit, cShd; uniform float uEdge; uniform vec4 uAux;
varying vec3 vP, vN, vO;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vP - cameraPosition + vec3(0., 1e-6, 0.));
  float tone = smoothstep(-uEdge, uEdge, dot(N, uL));
  vec3 lit = cLit, shd = cShd;
  ${body}
  vec3 col = mix(shd, lit, clamp(tone, 0., 1.));
  ${post}
  gl_FragColor = vec4(col, 1.);
}`;

// The bowling ball: plum swirl from domain-warped noise, real finger pits, and the gloss carrying the ruled well and the window.
const BOWL_BODY = /* glsl */`
  vec3 o = vO/90.;
  vec2 sw = vec2(o.x + o.y*.6, o.z - o.y*.4)*2.2 + uAux.xy;
  sw += 1.6*vec2(vn(sw*1.3 + 4.), vn(sw*1.3 + 17.));
  sw += .8*vec2(vn(sw*2.1 + 31.), vn(sw*2.1 + 9.));
  float sv = vn(sw*1.4); float sf = fwidth(sv) + 1e-4;
  float swirl = smoothstep(.5 - sf, .5 + sf, sv);                     // marbling: a flat second plum with a crisp edge
  float pit = 1. - smoothstep(87.6, 89.2, length(vO));                    // inside a finger pit
  lit = mix(cLit, cLit*1.3, swirl*(1. - pit));
  shd = mix(cShd, cShd*1.4, swirl*(1. - pit));
  vec3 fwR3 = fwidth(V) + fwidth(N)*2.;
  float fwR = max(max(fwR3.x, fwR3.y), fwR3.z);
`;
const NMIR = 10;
const BOWL_PRE = /* glsl */`
#define NMIR ${NMIR}
uniform vec3 cOrange, cBrass;
uniform vec4 uMar[NMIR];   // glass marbles the mirror shows: centre xyz, radius (0 = none)
`;
// THE MIRROR. The gloss shows the ruled sheet as a bent net of whole cells crossing both ways: the reflected ray is marched
// to the cloth (down into the throat, level and rising to the wall behind us), and the ruling is read there with most of the
// well's pull let out, so the cells stay four-sided instead of the hundred-metre kites of the throat (one cross line with
// ticks under it: a grin). Lines never thinner than two pixels; where a cell falls under five pixels the net simply stops,
// so no level band lies across the ball. It carries no tone for the lit sheet. Then the marbles' orange, the window, and
// close by a rim of reflected light.
const bowlPost = (wi) => /* glsl */`
  vec3 R = reflect(V, N);
  float th = sheetHit(vP + N*.3, R);
  float gl = 1. - pit;
  vec3 bc = vec3(uWell[${wi}].x, uWellB[${wi}].z, uWell[${wi}].y);
  vec3 toCam = cameraPosition - bc;
  float high = smoothstep(150., 255., length(toCam));
  // (no branch round the derivatives: a ray that misses reads the cloth at the ball and is masked out)
  float hitW = step(0., th);
  vec3 q = vP + R*max(th, 0.);
  float graze = smoothstep(.04, .16, -dot(R, sheetN(q.xz)));   // where the reflected ray only grazes the cloth (the lip, far flat cloth) the net fades out: one clean soft end
  vec2 m = mix(q.xz - uOrg, sheetM(q.xz), .3);
  vec2 f = clamp(max(fwidth(m), vec2(fwR*max(th, 0.))), vec2(.05), vec2(60.));
  vec2 d = abs(fract(m/40. + .5) - .5)*40.;
  vec2 jl = floor(m/40. + .5);
  vec2 hv = vec2(1. - step(.25, abs(mod(jl.x + .5, 5.) - .5)), 1. - step(.25, abs(mod(jl.y + .5, 5.) - .5)));   // every fifth line heavier, as on the cloth
  vec2 hw = max(vec2(.3) + .3*hv, f*(.55 + .2*hv));
  vec2 ln = (1. - smoothstep(hw, hw + f, d))*(1. - smoothstep(vec2(3.5), vec2(8.) + 3.*hv, f));
  float net = max(ln.x, ln.y)*hitW*graze;
  col = mix(col, mix(cInk, cShade, .2), net*.92*gl);
  // the brass hoop: one thin line where the reflected sheet ends
  float fy = fwidth(R.y) + 1e-4;
  col = mix(col, cBrass, (1. - smoothstep(max(.004, fy), max(.004, fy) + fy, abs(R.y - .006)))*(1. - hitW)*gl*.85);
  // the marbles' orange passing across the gloss: a thin limb of glass and the twisted vane, never a ringed disc
  float msd = 9., mt = 0., mr = 1., mk = 0.; vec3 mo = vec3(0., 1., 0.);
  for (int i = 0; i < NMIR; i++){ vec4 mb = uMar[i]; vec3 oc = mb.xyz - vP; float tc = dot(oc, R);
    float sd = sqrt(max(dot(oc, oc) - tc*tc, 0.))/max(mb.w, 1e-3);
    if (mb.w > .01 && tc > 0. && sd < msd){ msd = sd; mt = tc; mo = oc - tc*R; mr = mb.w; mk = fract(mb.w*7.31)*10.; } }
  float mfw = min(fwidth(msd), .3) + 1e-3;
  float seen = (1. - smoothstep(1. - mfw, 1. + mfw, msd))*step(mt, mix(1e5, th + 12., hitW))*gl;
  vec3 e1 = normalize(cross(R, vec3(.31, .9, .3)) + vec3(1e-5, 0., 0.)), e2 = cross(R, e1);
  float va = mk*2.4 + uTime*.6; vec2 vq = vec2(dot(mo, e1), dot(mo, e2))/max(mr, 1e-3);
  vq = mat2(cos(va), -sin(va), sin(va), cos(va))*vq;
  float vane = (1. - smoothstep(.3 - mfw, .3 + mfw, abs(vq.y - .34*sin(vq.x*3.4 + mk))*(1. + .7*vq.x*vq.x)))*(1. - smoothstep(.8 - mfw, .8 + mfw, abs(vq.x)));
  float limb = smoothstep(.9 - mfw, .9 + mfw, msd)*smoothstep(-.2, .2, dot(normalize(mo + vec3(0., 1e-4, 0.)), uL));   // only the window-side crescent of its rim, never a ring
  col = mix(col, cWhite, seen*limb*.7);
  col = mix(col, cOrange, seen*vane);
  col = mix(col, cWhite, max(windowQuad(R), wallPatch(R)*.9)*(1. - hitW)*(1. - seen)*gl);
  float rimE = 1. - abs(dot(N, V)); float rimF = fwidth(rimE) + 1e-4;
  col = mix(col, cLit*1.6 + .004, smoothstep(.8 - rimF, .8 + rimF, rimE)*(1. - tone)*(1. - high)*gl);   // reflected light along the shaded limb
  col = mix(col, cShd*.8, pit*(1. - tone)*.6);
`;

// Glass marbles (instanced): the sphere is solved from the view ray, so one shader serves the back shell (opaque, behind the
// vane) and, with RIM defined, the front pass that lays the cloth-white rim and the window quad over the vane.
const GLASS_VERT = /* glsl */`
varying vec3 vP, vC; varying float vR;
void main(){
  mat4 im = mat4(1.);
  #ifdef USE_INSTANCING
    im = instanceMatrix;
  #endif
  vec4 wp = modelMatrix*im*vec4(position, 1.);
  vP = wp.xyz; vC = (modelMatrix*im*vec4(0., 0., 0., 1.)).xyz; vR = length((modelMatrix*im*vec4(1., 0., 0., 0.)).xyz);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const GLASS_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_GLOSS}
uniform vec3 cLimb; uniform vec4 cTint;
varying vec3 vP, vC; varying float vR;
void main(){
  vec3 V = normalize(vP - cameraPosition + vec3(0., 1e-6, 0.));
  vec3 oc = cameraPosition - vC; float b = dot(oc, V);
  float tF = -b - sqrt(max(b*b - dot(oc, oc) + vR*vR, 0.));
  vec3 Nf = normalize(cameraPosition + V*tF - vC + vec3(0., 1e-5, 0.));
  vec3 perp = Nf - dot(Nf, V)*V; float rim = length(perp);
  float fr = fwidth(rim) + 1e-4;
  float lt = smoothstep(-.03, .03, dot(Nf, uL));
  float ring = smoothstep(.85 - fr, .85 + fr, rim);
  float wq = windowQuad(reflect(V, Nf));
  vec3 rimCol = mix(cShade, cWhite, max(lt, wq));
  // a drawn ball on any ground: one thin limb line all the way round, the window-side crescent of white inside it
  float limb = smoothstep(.955 - fr, .955 + fr, rim)*(1. - wq);
  rimCol = mix(rimCol, cLimb, limb);
  #ifdef RIM
    float al = max(ring, wq);
    if (al < .02) discard;
    gl_FragColor = vec4(rimCol, al);
  #else
    vec3 D = normalize(V - 2.1*perp);                         // glass inverts what is behind it: the room as a cap in its lower third
    vec3 fD3 = fwidth(D); float fD = max(max(fD3.x, fD3.y), fD3.z);
    float th = sheetHit(vC, D);
    vec3 col = roomCol(D);
    if (th > 0.) col = sheetCol(vC + D*th, clamp(fD*th*1.5, .5, 40.));
    col = mix(col, cTint.rgb, cTint.a);                       // the glass holds a tone of its own, a little under the lit cloth
    col = mix(col, rimCol, max(ring, wq));
    gl_FragColor = vec4(col, 1.);
  #endif
}`;

// Contact smudge + long soft shadow + the small warm spot of focused light under a marble: an instanced strip laid on the
// cloth in the vertex shader (it follows dips), re-drawing the ballpoint so shadow never darkens the ruling.
const SMUDGE_VERT = /* glsl */`
${GLSL_COMMON}
varying vec2 vUv; varying vec3 vW; varying float vR;
void main(){
  mat4 im = mat4(1.);
  #ifdef USE_INSTANCING
    im = instanceMatrix;
  #endif
  vec3 c = (modelMatrix*im*vec4(0., 0., 0., 1.)).xyz; float R = length((modelMatrix*im*vec4(1., 0., 0., 0.)).xyz);
  vec2 s = -normalize(uL.xz + vec2(1e-5, 0.)); vec2 t = vec2(-s.y, s.x);
  vec2 xz = c.xz + s*(position.x + .4)*R*7.5 + t*position.y*R*2.8;
  vec3 wp = vec3(xz.x, sheetH(xz) + .12, xz.y);
  vUv = position.xy; vW = wp; vR = R;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const SMUDGE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 cCloth, cShade, cInk, cPlum, cOrange;
varying vec2 vUv; varying vec3 vW; varying float vR;
void main(){
  float a = (vUv.x + .4)*7.5, b = vUv.y*2.8;                    // in marble radii: along the shadow, across it
  float sl = length(vec2((a - 2.6)/3.3, b*1.1)); float se = 1.5*fwidth(sl) + 1e-4;
  float sh = 1. - smoothstep(1. - se, 1. + se, sl);
  float sv = sheetShade(vW, 1.); float facing = clamp(.5 + sv/(1.5*fwidth(sv) + 1e-4), 0., 1.);   // only lit cloth takes a shadow
  float contact = 1. - smoothstep(.15, 1.1, length(vec2(a, b)));
  float spot = (1. - smoothstep(.5, 1., length(vec2((a - 3.1)/.9, b/.42))))*facing;
  vec3 col = mix(clamp(cShade + (cShade - cCloth)*.42, 0., 1.), cPlum, contact*contact*.5);
  col = mix(col, mix(cCloth, cOrange, .3), spot);
  float al = max(sh*facing, contact*.9);
  vec2 m = sheetM(vW.xz); vec2 ink = sheetInk(m, fwidth(m));
  col = mix(col, cInk, clamp(ink.x, 0., 1.));
  if (al < .01) discard;
  gl_FragColor = vec4(col, al);
}`;

// ---------------------------------------------------------------------------------------------------------------
// THE STYLE KIT
// ---------------------------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const C = (h) => new THREE.Color(h);
  const palette = { cloth: C(hex[0]), shade: C(hex[1]), ballpoint: C(hex[2]), plum: C(hex[3]), red: C(hex[4]), orange: C(hex[5]), brass: C(hex[6]) };
  const hour = opts.hour || 'four';                         // 'four' | 'golden' | 'dawn' | 'night'
  const elev = (hour === 'golden' ? 11 : 18)*Math.PI/180, side = hour === 'dawn' ? -1 : 1;
  // from the left and a little from ahead (dawn: from the right and a little from behind), so the bowling ball's shadow lies
  // behind us as we come into the whip and the well's crescent of shade is met at its far end
  const L = new THREE.Vector3(side*Math.cos(elev)*0.97, Math.sin(elev), Math.cos(elev)*(side > 0 ? 0.171 : -0.243)).normalize();
  if (opts.lightDir) L.copy(opts.lightDir).normalize();
  if (hour === 'night') palette.cloth = palette.shade.clone().lerp(palette.cloth, 0.12);
  palette.white = opts.white ? C(opts.white) : palette.cloth;       // what "white" is: the cloth's own, or chalk on black lycra
  palette.whiteShade = opts.white ? palette.white.clone().lerp(palette.plum, 0.5) : palette.shade.clone().lerp(palette.plum, 0.2);
  const V4 = (n) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, 0, 1));
  // shared uniforms: the SAME objects go into every material, so one write moves the whole world
  const U = {
    uWell: { value: V4(NW) }, uWellB: { value: V4(NW) }, uBall: { value: V4(NB) },
    uL: { value: L }, uPatch: { value: new THREE.Vector4(0, 0, 0, 0.07) }, uSeam: { value: new THREE.Vector2(0, 0) }, uTime: { value: 0 }, uRip: { value: new THREE.Vector4(1, 0, 0, 0) }, uHalfK: { value: new THREE.Vector4(1, 1, 1, 1) }, uOrg: { value: new THREE.Vector2(0, 0) },
    cCloth: { value: palette.cloth }, cShade: { value: palette.shade }, cInk: { value: palette.ballpoint },
    cPlum: { value: palette.plum }, cOrange: { value: palette.orange }, cWhite: { value: palette.white },
    uWin: { value: new THREE.Vector4(0.45, 0.27, 0.55, 0) }, uWin2: { value: new THREE.Vector4(-0.8, 0.27, 0.55, 0) },
  };
  for (let i = 0; i < NW; i++) { U.uWell.value[i].set(0, 0, 0, 1); U.uWellB.value[i].set(0, 0, 0, 0); }
  for (let i = 0; i < NB; i++) U.uBall.value[i].set(0, -1e4, 0, 0);
  const shared = (extra = {}) => ({ ...U, ...extra });
  const mk = (vs, fs, extra, params = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: shared(extra), ...params });

  // wells and shadow casters -------------------------------------------------------------------------------------
  // well i: centre (x, z), depth D, half-width a; pull = metres of cloth drawn in (default 0.66 D); ballR/ballY drape the
  // cloth under a seated ball of that radius whose centre is at height ballY.
  const setWell = (i, x, z, D, a, pull = 0.66*D, ballR = 0, ballY = 0) => { U.uWell.value[i].set(x, z, D, Math.max(a, 1)); U.uWellB.value[i].set(pull, ballR, ballY, 0); };
  const setBall = (i, x, y, z, R) => U.uBall.value[i].set(x, y, z, R);      // shadow + contact smudge of a large ball (R 0 = off)
  const heightAt = (x, z) => {
    const rp = U.uRip.value, rd = x*rp.x + z*rp.y - rp.z; let y = rp.w*Math.exp(-rd*rd*0.0014); const W = U.uWell.value, B = U.uWellB.value;
    for (let i = 0; i < NW; i++) { const w = W[i], dx = x - w.x, dz = z - w.y, a2 = w.w*w.w; y -= w.z*a2/(dx*dx + dz*dz + a2 + 1e-3); }
    for (let i = 0; i < NW; i++) { const w = W[i], b = B[i], dx = x - w.x, dz = z - w.y, q = b.y*b.y - dx*dx - dz*dz; if (q > 0) y = Math.min(y, b.z - Math.sqrt(q) - 0.15); }
    return y;
  };
  const normalAt = (x, z, out = new THREE.Vector3()) => { const e = 0.6; return out.set(heightAt(x - e, z) - heightAt(x + e, z), 2*e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(); };

  // the cloth -----------------------------------------------------------------------------------------------------
  const sheetMaterial = mk(SHEET_VERT, SHEET_FRAG, {}, { side: THREE.DoubleSide });
  // radial mesh, rings dense near the middle; keep it centred under the camera (or under a well). y comes from the wells.
  const makeSheet = (o = {}) => {
    const R = o.radius ?? 3000, rings = o.rings ?? 200, sectors = o.sectors ?? 300, n = (rings + 1)*sectors;
    const pos = new Float32Array(n*3), idx = new Uint32Array(rings*sectors*6);
    for (let i = 0, k = 0; i <= rings; i++) { const t = i/rings, r = R*(0.04*t + 0.96*Math.pow(t, 3.2));
      for (let j = 0; j < sectors; j++, k += 3) { const a = (j + (i & 1)*0.5)/sectors*Math.PI*2; pos[k] = Math.cos(a)*r; pos[k + 2] = Math.sin(a)*r; } }
    for (let i = 0, k = 0; i < rings; i++) for (let j = 0; j < sectors; j++, k += 6) {
      const a = i*sectors + j, b = i*sectors + (j + 1) % sectors, c = a + sectors, d = b + sectors;
      if (i & 1) { idx[k] = a; idx[k + 1] = c; idx[k + 2] = b; idx[k + 3] = b; idx[k + 4] = c; idx[k + 5] = d; }
      else { idx[k] = a; idx[k + 1] = d; idx[k + 2] = b; idx[k + 3] = a; idx[k + 4] = c; idx[k + 5] = d; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(g, sheetMaterial); mesh.frustumCulled = false; mesh.name = 'sheet'; return mesh;
  };
  // the room: flat shade and the window's patch on the wall right of the course. Add it to the scene once; it needs no placing.
  const roomMaterial = mk(ROOM_VERT, ROOM_FRAG, { cRed: { value: palette.red }, cBrass: { value: palette.brass },   // (round classroom) the spare balls' and the board frame's colours; the clock's hour
    uClock: { value: hour === 'golden' ? 5.75 : hour === 'dawn' ? 6.5 : hour === 'night' ? 8.5 : 4 } }, { side: THREE.BackSide, depthWrite: false });
  const makeRoom = () => { const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), roomMaterial); m.frustumCulled = false; m.renderOrder = -0.5; m.name = 'room'; return m; };

  // two-tone ink for made things: ballMaterial({ lit, shade, edge, body, post, gloss, side })
  const ballMaterial = (o = {}) => mk(BALL_VERT, ballFrag(o.body || '', o.post || '', !!o.gloss, o.pre || ''), {
    ...(o.uniforms || {}),
    cLit: { value: o.lit || palette.red }, cShd: { value: o.shade || (o.lit || palette.red).clone().lerp(palette.plum, 0.55) },
    uEdge: { value: o.edge ?? 0.05 }, uAux: { value: o.aux || new THREE.Vector4() } }, { side: o.side ?? THREE.FrontSide });

  const style = { palette, uniforms: U, lightDir: L, glsl: { common: GLSL_COMMON, gloss: GLSL_GLOSS }, setWell, setBall, heightAt, normalAt,
    sheetMaterial, makeSheet, roomMaterial, makeRoom, ballMaterial, shared, mk,
    update(dt, time) { U.uTime.value = time; U.uWin.value.w = Math.min(time/42, 1.5)*0.01745; } };
  style.makeMarbles = (count) => makeMarbles(style, count);
  style.setRipple = (dx, dz, off, amp) => U.uRip.value.set(dx, dz, off, amp);
  return style;
}

// Glass marbles in the style's hand: back shell + twisted orange vane + rim/window pass + smudge strip, four instanced draws
// sharing one instance matrix. set(i, x, y, z, R, quat) then commit(). The world makes "our marble" with style.makeMarbles(1).
function makeMarbles(style, count) {
  const P = style.palette, group = new THREE.Group(); group.name = 'marbles';
  const sph = new THREE.SphereGeometry(1, 20, 12);
  // the vane: a blade twisted through 1.4 turns of pi, widest in the middle
  const NS = 28, vp = [], vi = [];
  for (let i = 0; i <= NS; i++) { const s = i/NS*2 - 1, th = s*Math.PI*0.85, w = 0.56*Math.sqrt(Math.max(1 - s*s*0.92, 0));
    for (let v = -1; v <= 1; v++) vp.push(s*0.74, Math.cos(th)*w*v, Math.sin(th)*w*v); }
  for (let i = 0; i < NS; i++) for (let v = 0; v < 2; v++) { const a = i*3 + v, b = a + 3; vi.push(a, b, a + 1, a + 1, b, b + 1); }
  const vane = new THREE.BufferGeometry(); vane.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); vane.setIndex(vi); vane.computeVertexNormals();
  const strip = new THREE.PlaneGeometry(1, 1, 10, 2);
  // the limb: a thin blue-grey line on cloth (chalk white on black lycra, where the rim already stands out); the glass's own tone
  const chalk = P.white !== P.cloth, cLimb = { value: chalk ? P.white : P.shade.clone().lerp(P.plum, 0.3) };
  const cTint = { value: chalk ? new THREE.Vector4(P.cloth.r, P.cloth.g, P.cloth.b, 0.1) : new THREE.Vector4(P.shade.r, P.shade.g, P.shade.b, 0.32) };
  const mats = [
    style.mk(GLASS_VERT, GLASS_FRAG, { cLimb, cTint }, { side: THREE.BackSide }),
    style.ballMaterial({ lit: P.orange, shade: P.orange.clone().lerp(P.plum, 0.32), edge: 0.08, side: THREE.DoubleSide }),
    style.mk(GLASS_VERT, GLASS_FRAG, { cLimb, cTint }, { side: THREE.FrontSide, transparent: true, depthWrite: false, defines: { RIM: 1 } }),
    style.mk(SMUDGE_VERT, SMUDGE_FRAG, {}, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  ];
  const geos = [sph, vane, sph, strip], meshes = geos.map((g, k) => new THREE.InstancedMesh(g, mats[k], count));
  const im = meshes[0].instanceMatrix; im.setUsage(THREE.DynamicDrawUsage);
  meshes.forEach((m, k) => { m.instanceMatrix = im; m.frustumCulled = false; m.renderOrder = [0, 0, 3, 1][k]; group.add(m); });
  const M = new THREE.Matrix4(), S = new THREE.Vector3(), T = new THREE.Vector3(), Q0 = new THREE.Quaternion();
  for (let i = 0; i < count; i++) { M.compose(T.set(0, -1e4, 0), Q0, S.set(1, 1, 1)); M.toArray(im.array, i*16); }
  return { group, count, meshes,
    set(i, x, y, z, R, q) { M.compose(T.set(x, y, z), q || Q0, S.set(R, R, R)); M.toArray(im.array, i*16); },
    commit() { im.needsUpdate = true; } };
}

// smooth vertex normals for an indexed geometry, as computeVertexNormals makes them, but in short steps with a yield between
export async function chunkedNormals(g, tick = null) {
  const p = g.attributes.position.array, ix = g.index.array, n = new Float32Array(p.length);
  for (let t = 0; t < ix.length; t += 3) {
    const a = ix[t]*3, b = ix[t + 1]*3, c = ix[t + 2]*3;
    const ux = p[c] - p[b], uy = p[c + 1] - p[b + 1], uz = p[c + 2] - p[b + 2], vx = p[a] - p[b], vy = p[a + 1] - p[b + 1], vz = p[a + 2] - p[b + 2];
    const nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    if (tick && t % 6000 === 5997) await tick();
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
}

// a UV sphere whose radius is altered per direction by fn(nx, ny, nz) -> metres inward; smooth normals, seam welded.
export async function carvedSphere(R, wSeg, hSeg, fn, latPow = 1, tick = null) {
  // the same vertex grid and triangles as THREE.SphereGeometry(R, wSeg, hSeg), built straight into typed arrays in short
  // steps (the library builds it in one go: a stall of tens of milliseconds for the 10k-vertex bowling ball)
  const n = (wSeg + 1)*(hSeg + 1), g = new THREE.BufferGeometry(), p = new THREE.BufferAttribute(new Float32Array(n*3), 3);
  const idx = new Uint32Array(wSeg*(2*hSeg - 2)*3);
  for (let iy = 0, k = 0; iy < hSeg; iy++) {
    for (let ix = 0; ix < wSeg; ix++) { const a = iy*(wSeg + 1) + ix + 1, b = a - 1, c = b + wSeg + 1, d = c + 1;
      if (iy !== 0) { idx[k++] = a; idx[k++] = b; idx[k++] = d; }
      if (iy !== hSeg - 1) { idx[k++] = b; idx[k++] = c; idx[k++] = d; } }
    if (tick && iy % 16 === 15) await tick();
  }
  g.setAttribute('position', p); g.setIndex(new THREE.BufferAttribute(idx, 1));
  if (tick) await tick();
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i/(wSeg + 1)), col = i % (wSeg + 1);
    const ph = Math.PI*Math.pow(row/hSeg, latPow), th = col/wSeg*Math.PI*2;
    const nx = -Math.cos(th)*Math.sin(ph), ny = Math.cos(ph), nz = Math.sin(th)*Math.sin(ph), r = R - fn(nx, ny, nz);
    p.setXYZ(i, nx*r, ny*r, nz*r);
    if (tick && i % 800 === 799) await tick();
  }
  if (tick) await tick();
  await chunkedNormals(g, tick);
  if (tick) await tick();
  const nr = g.attributes.normal;
  for (let row = 0; row <= hSeg; row++) { const a = row*(wSeg + 1), b = a + wSeg;
    const x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1;
    nr.setXYZ(a, x/l, y/l, z/l); nr.setXYZ(b, x/l, y/l, z/l); }
  g.computeBoundingSphere();
  return g;
}

// a golf ball 40 m across with 120 real dimples (the world makes a lighter one for the balls that are never near)
export async function golfGeometry(wSeg, hSeg, tick = null) {
  const GR = 20, dim = [];
  for (let i = 0; i < 120; i++) { const y = 1 - (i + 0.5)/60, r = Math.sqrt(1 - y*y), a = i*2.39996; dim.push(Math.cos(a)*r, y, Math.sin(a)*r); }
  const cosLim = Math.cos(2.6/GR);
  return carvedSphere(GR, wSeg, hSeg, (x, y, z) => {
    let best = -1; for (let k = 0; k < 360; k += 3) { const c = x*dim[k] + y*dim[k + 1] + z*dim[k + 2]; if (c > best) best = c; }
    if (best < cosLim) return 0; const ang = Math.acos(Math.min(1, best))*GR/2.6; return 0.95*(1 - ang*ang);
  }, 1, tick);
}

// ---------------------------------------------------------------------------------------------------------------
// THE HERO: the great well, the bowling ball seated in it, the marble ring, and the golf ball that falls in.
// ---------------------------------------------------------------------------------------------------------------
const WELL = { D: 150, a: 110, sink: 35, pull: 99, pullSink: 55, ballR: 90, ballY: -50, ballDrop: 45, lip: 280 };
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const ownStyle = !opts.style, style = opts.style || makeStyle(ctx, opts), P = style.palette;
  const wi = opts.wellIndex ?? 0, bi = opts.ballIndex ?? 0;           // this piece uses wells wi, wi+1 and shadow balls bi, bi+1
  const object = new THREE.Group(); object.name = 'great-well';
  const tick = () => ctx.yield ? ctx.yield() : Promise.resolve();
  style.setWell(wi, 0, 0, WELL.D, WELL.a, WELL.pull, WELL.ballR, WELL.ballY);
  style.setBall(bi, 0, WELL.ballY, 0, WELL.ballR);

  // per-seed variety
  const yaw0 = rng.range(0, Math.PI*2), swirl = new THREE.Vector4(rng.range(0, 40), rng.range(0, 40), 0, 0);
  const startAng = Math.atan2(-160, 230) + rng.range(-0.06, 0.06);     // where the course meets the lip (local plan angle)
  const golfAng = opts.golfStart ? Math.atan2(opts.golfStart[1], opts.golfStart[0]) : startAng + 0.12;
  const golfR0 = opts.golfStart ? Math.hypot(opts.golfStart[0], opts.golfStart[1]) : 305;

  // stand-alone: the piece brings its own cloth and room; the world passes sheet: false, room: false and builds its own
  if (opts.sheet !== false) { object.add(style.makeSheet({ radius: 3000, rings: 110, sectors: 224 })); await tick(); }
  if (opts.room !== false) object.add(style.makeRoom());

  // the bowling ball: three real finger pits on the crown, rings packed toward the top so their rims are round
  const pits = [[0.24, 0.55, 9.5], [0.24, -0.55, 9.5], [0.31, Math.PI, 11.5]].map(([pol, az, r]) => ({
    x: Math.sin(pol)*Math.cos(az), y: Math.cos(pol), z: Math.sin(pol)*Math.sin(az), r }));
  const bowlGeo = await carvedSphere(WELL.ballR, 128, 80, (x, y, z) => {
    let d = 0;
    for (const p of pits) { const ang = Math.acos(Math.min(1, x*p.x + y*p.y + z*p.z))*WELL.ballR; if (ang < p.r*1.15) d = Math.max(d, 15*(1 - ctx.core.smoothstep(p.r*0.72, p.r*1.02, ang))); }
    return d;
  }, 1.5, tick);
  await tick();
  const mirror = Array.from({ length: NMIR }, () => new THREE.Vector4(0, -1e4, 0, 0));   // marbles shown in the gloss: slot 0 is the world's (setMirror), the rest the ring's nearest
  const bowlMat = style.ballMaterial({ lit: P.plum.clone().multiplyScalar(1.75), shade: P.plum.clone().multiplyScalar(0.62), edge: 0.09, body: BOWL_BODY, post: bowlPost(wi), pre: BOWL_PRE, gloss: true, aux: swirl, uniforms: { uMar: { value: mirror }, cBrass: { value: P.brass } } });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat); bowl.name = 'bowling-ball'; bowl.rotation.order = 'YXZ'; object.add(bowl);
  await tick();

  // the golf ball that falls in: 120 real dimples, so its outline is scalloped
  const GR = 20;
  const golfGeo = await golfGeometry(120, 72, tick);
  await tick();
  const golfShd = P.whiteShade, golfDim = opts.white || P.white !== P.cloth ? P.white.clone().lerp(P.plum, 0.28) : P.cloth.clone().lerp(P.shade, 0.85);
  const golfMat = style.ballMaterial({ lit: P.white, shade: golfShd, edge: 0.06, aux: new THREE.Vector4(golfDim.r, golfDim.g, golfDim.b, 0),
    body: 'float dp = 1. - smoothstep(19.5, 19.86, length(vO)); lit = mix(lit, uAux.rgb, dp); shd = mix(shd, shd*.86, dp);' });   // dimples hold a second tone in the light
  const golf = new THREE.Mesh(golfGeo, golfMat); golf.name = 'golf-ball'; golf.scale.setScalar(1e-5); object.add(golf);   // always drawn so its program compiles with the rest
  await tick();

  // the marble ring: two lanes, leaving the corridor r 110..126 clear for the camera
  const NM = Math.max(12, Math.round((opts.marbles ?? 40)*detail));
  const marbles = style.makeMarbles(NM); object.add(marbles.group);
  const mb = [], nb = rng.int(2, 4), bunch = rng.range(0.3, 0.9), ph0 = rng.range(0, 6.28);   // the ring bunches differently every visit
  for (let i = 0; i < NM; i++) {
    const inner = rng.chance(0.45);
    mb.push({ inner, r: inner ? rng.range(100, 103.5) : rng.range(139, 150), th: (i + rng.range(-0.38, 0.38))/NM*Math.PI*2 + bunch*0.5*Math.sin((i/NM)*Math.PI*2*nb + ph0)/nb, R: rng.range(5.4, 6.4)*(inner ? 0.62 : 0.88),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28))), k: rng.range(0.94, 1.06) });
  }
  await tick();

  // ---- the event: e 0..0.65 the golf ball takes the short way down the wall and lodges; e 0.65..1 the well takes the weight
  const sm = ctx.core.smoothstep, clamp01 = (x) => Math.min(1, Math.max(0, x));
  const W = new THREE.Vector3(), Nn = new THREE.Vector3(), ax = new THREE.Vector3(), dq = new THREE.Quaternion(), qq = new THREE.Quaternion();
  const GOLF_END = 121.5, lodgeTurn = opts.lodgeTurn ?? 0;            // the falling ball's track curls a little round the well (radians by the time it lodges)
  let gdx = Math.cos(golfAng), gdz = Math.sin(golfAng), gAng = golfAng;
  let ev = 0, manual = false; const avoid = [];
  // (the cure of the lens rule's leap) each outer marble's swing round the first point: 0 its side last frame, 1 the swing's
  // part (1 OUT, 2 ACROSS, 3 HOME), 2 its angle off its own place along the lane, 3 which way it goes, 4 the side it was on,
  // 5 pushed last frame, 6 its chord from the point's bearing last frame, 7 OUT: its push from the point's radius, else its radius less the rule's place (what is still to close), 8 seconds swung,
  // 9 its radius last frame, 10 what its angle does next frame (over 0: on, and by how many metres it is short of where it runs on to; 0 held; -1 back), 11 how fast its chord changed by the lane's own travel, 12 how steep the cloth stood under it (its normal's upright share), 13 the rule's push last frame; and what the last frame stood on
  const llf = new Float64Array(NM); let pk = 1;   // (the fifteenth) llf: how far a swinging marble is lifted round the lodged ball; pk: the visitor's pace
  const lsw = new Float64Array(NM*14), lswA = []; let lswT = NaN, lswE = NaN, lswQ = 0;
  const mpos = new Float32Array(NM*4), mdist = new Float32Array(NM);
  // (the cure of our marble through the ring) what stepAside starts from, kept as update lays it: each ring marble's point on the
  // cloth in plan and the nearest the axis it may be pushed (mplan), its centre (mlive), its turn (mquat), where it is now (mcur)
  const mplan = new Float64Array(NM*3), mlive = new Float64Array(NM*3), mcur = new Float64Array(NM*2), mquat = Array.from({ length: NM }, () => new THREE.Quaternion()), pushed = new Uint8Array(NM);
  const RCLR = 3, RSOFT = 12, side3 = [0, 0, 0, 0, 0, 0, 0, 0, 0], rway = new Float64Array(NM*4); let rwayT = NaN, rwayX = NaN, rwayY = NaN, rwayZ = NaN;
  // the gloss shows the ring marbles nearest the lens
  const gloss = () => { for (let k = 1; k < NMIR; k++) {
      let bi2 = -1, bd = 1e9; for (let i = 0; i < NM; i++) if (mdist[i] < bd) { bd = mdist[i]; bi2 = i; }
      if (bi2 < 0) { mirror[k].set(0, -1e4, 0, 0); continue; }
      mirror[k].set(mpos[bi2*4], mpos[bi2*4 + 1], mpos[bi2*4 + 2], mpos[bi2*4 + 3]); mdist[bi2] = 1e9;
    } };
  const wrap = (a) => a - Math.PI*2*Math.round(a/(Math.PI*2));
  function apply(e, dt, time) {
    const f = clamp01(e/0.65), s = sm(0.65, 1, e), present = sm(0, 0.03, e);
    let lfresh = !(Math.abs(time - lswT - dt) < 1e-4) || lswA.length !== avoid.length || (dt === 0 && e !== lswE);   // a fresh frame (THE SWING): the clock did not run on from the last one, or it is held and the event or a point has moved
    for (let k = 0; k < avoid.length; k++) { if (dt === 0 && lswA[k] !== avoid[k]) lfresh = true; lswA[k] = avoid[k]; } lswA.length = avoid.length; lswT = time; lswE = e;
    if (lfresh) { lsw.fill(0); llf.fill(0); }
    const dtq = lfresh ? 0 : time + 2.6*s - lswQ; lswQ = time + 2.6*s;   // (THE SWING) how far the ring's own clock ran this frame
    const by = WELL.ballY - WELL.ballDrop*s;
    object.updateWorldMatrix(true, false); W.setFromMatrixPosition(object.matrixWorld);
    style.setWell(wi, W.x, W.z, WELL.D + WELL.sink*s, WELL.a, WELL.pull + WELL.pullSink*s, WELL.ballR, W.y + by);
    style.setBall(bi, W.x, W.y + by, W.z, WELL.ballR);
    bowl.position.set(0, by, 0); bowl.rotation.set(0.06*Math.sin(Math.PI*s), yaw0 + time*0.012, 0);
    // golf ball: carries its dip, its smudge and its shadow with it
    gAng = golfAng + lodgeTurn*f*f; gdx = Math.cos(gAng); gdz = Math.sin(gAng);
    const rg = golfR0 - (golfR0 - GOLF_END)*Math.pow(f, 1.9), gx = W.x + gdx*rg, gz = W.z + gdz*rg;
    style.setWell(wi + 1, gx, gz, 14*present, 30);
    style.normalAt(gx, gz, Nn); const gh = style.heightAt(gx, gz);
    const gOn = e > 0.001; golf.scale.setScalar(gOn ? 1 : 1e-5);
    golf.position.set(gdx*rg + Nn.x*GR, gh + Nn.y*GR - W.y, gdz*rg + Nn.z*GR);
    golf.quaternion.setFromAxisAngle(ax.set(-gdz, 0, gdx).normalize(), (golfR0 - rg)/GR);
    style.setBall(bi + 1, gx + Nn.x*GR, gh + Nn.y*GR, gz + Nn.z*GR, gOn ? GR : 0);
    // marbles: faster the lower they ride; the ring pulls in and quickens as the well sinks; they ride round the lodged ball
    const near = present*sm(185, 150, rg);
    for (let i = 0; i < NM; i++) {
      const m = mb[i];
      let r = m.r*(1 - 0.04*s);
      const w0 = 54*m.k*Math.sqrt(120/m.r)/m.r, tq = time + 2.6*s;      // closed form in time; the ring quickens while the well sinks
      let th = m.th - w0*tq;
      const j = i*14, a0 = lsw[j + 2]; let ph = lsw[j + 1];
      if (ph && dt > 0) {                                             // (THE SWING) its own step along the lane
        lsw[j + 8] += dt*pk; const rl = Math.max(lsw[j + 9], 1), wS = SWINGV*pk*Math.min(1, lsw[j + 8]/SWING_UP)*dt/rl;   // (the swing's own clock and speeds run at the visitor's pace: pk)
        if (lsw[j + 10] > 0) { const full = SWINGV*pk*dt/rl, nat = lsw[j + 3]*lsw[j + 11]*dt/rl;                  // on: its chord from the point's bearing grows by the lane's own travel where that lies between the swing's speed as it comes up and SWINGV, else toward the nearer of the two, by SWINGV of its own at most
          const lo = Math.min(wS, lsw[j + 10]*6*pk*dt/rl);                // (it eases to a stand where it is nearly as far past the bearing as it runs on to: 6 a second of what it is short)
          let add = Math.max(-full, Math.min(full, nat < lo ? lo - nat : nat > full ? full - nat : 0)); const own = -w0*dtq*lsw[j + 3];
          if (add*own > 0) add = Math.sign(add)*Math.min(Math.abs(add), Math.max(0, full - Math.abs(own)));   // (it adds nothing along the lane where the lane's own turning already runs that way at SWINGV or more)
          lsw[j + 2] += lsw[j + 3]*add; }
        else if (lsw[j + 10] < 0) { const a = lsw[j + 2]; let st = Math.min(wS, Math.max(Math.abs(a)*6, 20/rl)*pk*dt);   // back: no faster past the point, while the rule pushes it, than SWINGV with the lane's own travel
          if (lsw[j + 5]) st = Math.min(st, Math.max(0, wS + Math.sign(a)*lsw[j + 11]*dt/rl)); lsw[j + 2] = Math.abs(a) <= st ? 0 : a - Math.sign(a)*st; }
      }
      th += lsw[j + 2];
      const dA = wrap(th - gAng);
      r += Math.max(0, rg + 33 - r)*Math.exp(-(dA*dA)/(0.36*0.36))*near;
      const c = Math.cos(th), sn = Math.sin(th);
      for (let k = m.inner ? avoid.length : 0; k < avoid.length; k += 3) {      // the outer lane swings up the wall round the lens and round the marble it follows
        const ax0 = avoid[k] - W.x, az0 = avoid[k + 1] - W.z, d = Math.hypot(c*r - ax0, sn*r - az0), lim = avoid[k + 2];
        if (k !== 0) { if (d < lim) { const side = r >= Math.hypot(ax0, az0) ? 1 : -1, t = 1 - d/lim; r += side*lim*t*t*(3 - 2*t); } continue; }
        // (the cure of the lens rule's leap) THE SWING ROUND THE LENS'S POINT. Where the point crosses a pushed marble's radius the
        // marble no longer leaps to the other side of it. OUT: it stays on the side it was on, at the point's own radius and the
        // rule's push from it (the rule's own curve, by its chord from the point's bearing), and runs on along the lane, the way
        // that is soonest (swingWay), until it stands HALF the rule's reach past the point's bearing THE WAY IT GOES (a marble the
        // point is overtaking goes through the bearing first, on its own side of the point's radius; at half the reach the rule's own
        // push is half the reach, and the rule's own marbles stand about as near the point). ACROSS: from there it makes for the rule's
        // place along its own radius at the swing's speed, whatever the rule's place does meanwhile, and runs on along the lane,
        // easing to a stand, while it is short of that half. HOME: it comes back along the lane to its own place and follows the
        // rule's place along its radius (at the swing's speed at most).
        // If the point crosses back meanwhile it turns for home from where it is. Every part begins from where the marble stood,
        // so no part begins with a step. Outside a swing the marble is where the rule puts it, to the bit.
        const rA = Math.hypot(ax0, az0), side = r >= rA ? 1 : -1, pu = d < lim, tS = 2*rA*Math.sin(wrap(th - Math.atan2(az0, ax0))/2), aT = Math.abs(tS);
        const ny = Math.max(0.25, lsw[j + 12] || 1);                    // (the swing's metres are metres along the cloth: on a steep wall fewer in plan)
        let rp = r, base = false; if (pu) { const t = 1 - d/lim; rp += side*lim*t*t*(3 - 2*t); } const pP = Math.abs(rp - r);
        if (!lfresh && dt > 0) {
          if (ph === 0 || ph === 3) { if (side !== lsw[j] && lsw[j] !== 0 && (pu || lsw[j + 5]) && (ph === 3 || pP + lsw[j + 13] > SWING_MIN)) {
            if (ph === 0) { lsw[j + 3] = swingWay(tS >= 0 ? 1 : -1, 1, (tS - lsw[j + 6])/dt, -w0*dtq/dt*r, tS, lim*0.5, SWINGV*pk); lsw[j + 8] = 0; lsw[j + 2] = 0; }
            else lsw[j + 3] = swingWay(lsw[j + 3], 1, lsw[j + 11], -w0*dtq/dt*r, tS, lim*0.5, SWINGV*pk);
            lsw[j + 4] = lsw[j]; ph = 1; base = true; } }
          else if (ph === 1) { if (side === lsw[j + 4]) { ph = 3; base = true; } else if (tS*lsw[j + 3] >= lim*0.5) { ph = 2; base = true; } }
          else if (side === lsw[j + 4]) { ph = 3; base = true; }
        }
        if (ph === 1) {                                                // OUT: slot 7 is the push it stands at, from the point's radius, on the side it was on
          const o = lsw[j + 4], t = Math.max(0, 1 - aT/lim), pt = lim*t*t*(3 - 2*t);
          if (base) lsw[j + 7] = o*(lsw[j + 9] - rA);
          else if (dt > 0) { lsw[j + 3] = swingWay(lsw[j + 3], 2, lsw[j + 11], -w0*dtq/dt*r, tS, lim*0.5, SWINGV*pk);   // (it turns the other way if that has become twice as soon)
            const lm = SWINGV*pk*dt*ny; let ps = lsw[j + 7]; ps += Math.max(-lm, Math.min(lm, pt - ps));   // its push follows the rule's curve at SWINGV along the cloth at most
            const rc = rA + o*ps; lsw[j + 7] = o*((o > 0 ? Math.max(rc, lsw[j + 9] - lm) : Math.min(rc, lsw[j + 9] + lm)) - rA); }   // and it comes in toward the point's radius no faster (it gives way before the point as fast as the point comes)
          r = rA + o*lsw[j + 7]; lsw[j + 10] = lim;
        } else if (ph) {                                               // ACROSS and HOME: it makes for the rule's place from its radius last frame; slot 7 is what is still to close
          const tg = rp;
          if (base) lsw[j + 7] = lsw[j + 9] - tg;
          else if (dt > 0) { const q = lsw[j + 9] - tg, st = Math.min(SWINGV*Math.min(1, lsw[j + 8]/SWING_UP), Math.max(Math.abs(q)*6, 20))*pk*dt*ny; lsw[j + 7] = Math.abs(q) <= st ? 0 : q - Math.sign(q)*st; }
          if (ph === 2 && lsw[j + 7] === 0) ph = 3;
          if (ph === 3 && lsw[j + 7] === 0 && lsw[j + 2] === 0) ph = 0;
          r = tg + lsw[j + 7]; lsw[j + 10] = ph === 2 ? Math.max(0, lim*0.5 - tS*lsw[j + 3]) : ph === 3 ? -1 : 0;
        } else r = rp;
        if (dt > 0) lsw[j + 11] = lsw[j] !== 0 ? (tS - lsw[j + 6])/dt - (lsw[j + 2] - a0)*rA/dt : 0;
        lsw[j] = side; lsw[j + 1] = ph; lsw[j + 5] = pu ? 1 : 0; lsw[j + 6] = tS; lsw[j + 13] = pP;
      }
      if (!m.inner) { r = Math.max(r, 98 + m.R); lsw[j + 9] = r; }                        // never pushed in under the ball
      // (the fifteenth) A SWINGING MARBLE RIDES ROUND THE LODGED BALL. The swing sets a marble's radius from the lens's point and
      // the rule's place and took no account of the lodged golf ball: going ACROSS at the faster paces a marble went through
      // it along its radius. While it swings a marble stands no nearer the axis than the innermost lane's own way round the
      // ball (the rule's own curve for a marble on the floor of the lanes, which clears the ball by metres at every bearing):
      // llf is how far it is lifted to that, coming up at twice the swing's speed at most (a marble whose swing begins under
      // that curve, where the lens's rule had pushed it in, does not step up to it) and going down the same way once the
      // swing is over. The swing's own radius (slot 9) is kept without the lift.
      if (!m.inner) { const G = 98 + m.R + Math.max(0, rg + 33 - 98 - m.R)*Math.exp(-(dA*dA)/(0.36*0.36))*near, want = ph ? Math.max(0, G - r) : 0, lm = 2*SWINGV*pk*dt, lf = llf[i];
        if (dt > 0) llf[i] = want > lf ? lf + Math.min(want - lf, lm) : ph ? want : Math.max(want, lf - lm);
        r += llf[i]; }
      const x = W.x + c*r, z = W.z + sn*r;
      style.normalAt(x, z, Nn); const h = style.heightAt(x, z); lsw[j + 12] = Nn.y;
      dq.setFromAxisAngle(ax.set(0, 1, 0), w0*tq);                      // carried round with the orbit, rolling about the radius
      qq.setFromAxisAngle(ax.set(-c, 0, -sn), (w0*tq*m.r/m.R) % (Math.PI*2)).multiply(dq).multiply(m.q);
      marbles.set(i, c*r + Nn.x*m.R, h + Nn.y*m.R - W.y, sn*r + Nn.z*m.R, m.R, qq);
      mpos[i*4] = x + Nn.x*m.R; mpos[i*4 + 1] = h + Nn.y*m.R; mpos[i*4 + 2] = z + Nn.z*m.R; mpos[i*4 + 3] = m.R;
      mdist[i] = avoid.length >= 2 ? Math.hypot(x - avoid[0], z - avoid[1]) : i;
      mplan[i*3] = mcur[i*2] = x; mplan[i*3 + 1] = mcur[i*2 + 1] = z; mplan[i*3 + 2] = Math.min(r, m.inner ? m.r*(1 - 0.04*s) : 98 + m.R);
      mlive[i*3] = x + Nn.x*m.R; mlive[i*3 + 1] = h + Nn.y*m.R; mlive[i*3 + 2] = z + Nn.z*m.R; mquat[i].copy(qq); pushed[i] = 0;
    }
    marbles.commit();
    gloss();
  }
  // (stepAside) where ring marble i's centre stands with its point on the cloth at (x, z): what update laid, carried by the
  // difference of the two seats on the cloth as it lies now. side3: 0..2 that centre, 3..5 the seat at its own point,
  // 6..8 the body. Returns the distance of the two centres.
  const centreAt = (i, x, z) => { const R = mb[i].R; style.normalAt(x, z, Nn); const h = style.heightAt(x, z);
    side3[0] = mlive[i*3] + x + Nn.x*R - side3[3]; side3[1] = mlive[i*3 + 1] + h + Nn.y*R - side3[4]; side3[2] = mlive[i*3 + 2] + z + Nn.z*R - side3[5];
    return Math.hypot(side3[0] - side3[6], side3[1] - side3[7], side3[2] - side3[8]); };
  apply(0, 0, 0);

  // ---- anchors (local space = world axes; the piece must not be rotated or scaled). Heights are for the well at rest.
  const clothAt = (x, z, s = 0) => -(WELL.D + WELL.sink*s)*WELL.a*WELL.a/(x*x + z*z + WELL.a*WELL.a);
  const above = (th, r, lift = 6, s = 0) => { const x = Math.cos(th)*r, z = Math.sin(th)*r, e = 0.5;
    const n = new THREE.Vector3(clothAt(x - e, z, s) - clothAt(x + e, z, s), 2*e, clothAt(x, z - e, s) - clothAt(x, z + e, s)).normalize();
    return new THREE.Vector3(x, clothAt(x, z, s), z).addScaledVector(n, lift); };
  const D2R = Math.PI/180, fly = [];
  fly.push(above(startAng + 0.10, 345));
  for (let i = 0; i <= 10; i++) { const t = i/10; fly.push(above(startAng - t*100*D2R, 280 - 162*sm(0, 1, t))); }           // the left spiral down the wall
  for (let i = 1; i <= 8; i++) { const t = i/8; fly.push(above(startAng - (100 + t*130)*D2R, 118, 6, sm(0.1, 0.9, t))); }      // the whip (well sinking)
  for (let i = 1; i <= 6; i++) { const t = i/6; fly.push(above(startAng - (230 + t*38)*D2R, 118 + 190*t*t*(1.2 - 0.2*t), 6, 1)); }   // flung up and out
  const exitAx = new THREE.Vector3(400, 0, -150), exitDir = new THREE.Vector3(0.936*0.5, -0.866, -0.351*0.5).normalize();
  const anchors = {
    lip: above(startAng, WELL.lip, 6), startAngle: startAng, flyThrough: fly,
    corridor: { rMin: 110, rMax: 126 },                         // marble-free lane round the ball (camera rides r 118)
    golfStart: new THREE.Vector3(gdx*golfR0, clothAt(gdx*golfR0, gdz*golfR0) + GR, gdz*golfR0),
    golfLodged: new THREE.Vector3(Math.cos(golfAng + lodgeTurn)*111, -60, Math.sin(golfAng + lodgeTurn)*111),
    ballCentre: new THREE.Vector3(0, WELL.ballY, 0), ballCentreSunk: new THREE.Vector3(0, WELL.ballY - WELL.ballDrop, 0),
    viewpoints: { reveal: above(startAng, WELL.lip + 14, 9), whip: above(startAng - 165*D2R, 118, 6, 0.5), crest: fly[fly.length - 1] },
    portalSeat: { position: exitAx.clone().setY(-66), facing: exitDir.clone().negate(), note: 'throat of the empty funnel (world-built), 60 degrees down' },
  };

  return {
    object, radius: opts.viewRadius ?? 200, height: 120, center: new THREE.Vector3(0, 30, 0), anchors, style,
    lipRadius: WELL.lip, clothAt,
    // e in 0..1: 0..0.65 the golf ball rolls down and lodges, 0.65..1 the well sinks. Once called, the stand-alone demo loop stops.
    setEvent(e) { manual = true; ev = clamp01(e); },
    // world plan points the marble ring steps aside for: setAvoid([x, z, radius, x, z, radius, ...])
    setAvoid(list) { avoid.length = 0; for (let i = 0; i < list.length; i++) avoid.push(list[i]); },
    // (the fifteenth) the visitor's pace as the world reckons it (1 at pace 1): THE SWING's speeds follow it
    setPace(k) { pk = k > 0 ? k : 1; },
    // (the cure of our marble through the ring) THE RING PARTS FOR A BODY ON THE CLOTH, BY PLACE. The world's own marble rolled
    // straight through the ring's marbles (up to 10 m inside one, on every flight). hero.stepAside(x, y, z, R, dt, time) is
    // called after update, in the same frame, with the body's centre and radius as it stands. Each ring marble within reach
    // then stands at a bearing from the body (wayRound, above), its point on the cloth far enough along that bearing for the two
    // centres to stand D' apart: D' = Dc + RSOFT*(D/(Dc + RSOFT))^((Dc + RSOFT)/RSOFT), D their distance as update laid them, Dc
    // the two radii and RCLR (the law by which the world's marble keeps off the lodged ball). So D' is never under Dc, the
    // push comes on with no step and no kink RSOFT beyond Dc, and a ring marble further off is where update laid it, to the
    // bit. No ring marble stands nearer the well's axis than its lane lies (an outer one never under the ball): one held there
    // keeps the two radii and 2 m at the least (wayRound's floor). It starts from
    // what update laid; it reads the two places, dt and the clock handed in (only to know a frame that does not follow the
    // last): no lens, no seed, no position on the route.
    stepAside(bx, by, bz, R, dt = 0, time = 0) { let any = false; side3[6] = bx; side3[7] = by; side3[8] = bz;
      const fresh = !(Math.abs(time - rwayT - dt) < 1e-4) || (dt === 0 && (bx !== rwayX || by !== rwayY || bz !== rwayZ)); rwayT = time; rwayX = bx; rwayY = by; rwayZ = bz;
      for (let i = 0; i < NM; i++) { const m = mb[i], Dc = R + m.R + RCLR, Dw = Dc + RSOFT, lx = mlive[i*3], ly = mlive[i*3 + 1], lz = mlive[i*3 + 2];
        const D = Math.hypot(lx - bx, ly - by, lz - bz);
        if (D >= Dw) { rway[i*4 + 1] = 0; if (pushed[i]) { marbles.set(i, lx - W.x, ly - W.y, lz - W.z, m.R, mquat[i]); mpos[i*4] = lx; mpos[i*4 + 1] = ly; mpos[i*4 + 2] = lz; mcur[i*2] = mplan[i*3]; mcur[i*2 + 1] = mplan[i*3 + 1]; pushed[i] = 0; any = true; } continue; }
        const ox = lx - bx, oz = lz - bz, pl = Math.hypot(ox, oz), want = Dc + RSOFT*Math.pow(D/Dw, Dw/RSOFT), rF = mplan[i*3 + 2], x0 = mplan[i*3], z0 = mplan[i*3 + 1];
        const qx = x0 - ox, qz = z0 - oz, cx = W.x - qx, cz = W.z - qz;      // the turning point, and from it to the well's axis
        style.normalAt(x0, z0, Nn); const h0 = style.heightAt(x0, z0); side3[3] = x0 + Nn.x*m.R; side3[4] = h0 + Nn.y*m.R; side3[5] = z0 + Nn.z*m.R;
        const be = wayRound(rway, i*4, ox, oz, pl, cx, cz, rF, R + m.R, Dc, Dw, D, dt, fresh), cb = Math.cos(be), sb = Math.sin(be);
        // THE PLACE ALONG A BEARING: the first place the two stand D' apart (stepped to, then halved), but no further than the
        // lane's near edge and, where the turning point is itself under the lane, no nearer than its far edge
        let lo = 0, hi = 0;
        if (centreAt(i, qx + cb*pl, qz + sb*pl) < want) { const st = (want + 8)/12;
          for (hi = st; hi < want + 8 && centreAt(i, qx + cb*(pl + hi), qz + sb*(pl + hi)) < want; hi += st) lo = hi;
          for (let k = 0; k < 12; k++) { const mid = (lo + hi)/2; if (centreAt(i, qx + cb*(pl + mid), qz + sb*(pl + mid)) < want) lo = mid; else hi = mid; } }
        let rho = pl + hi;
        { const mc = cb*cx + sb*cz, L2 = cx*cx + cz*cz, disc = mc*mc - L2 + rF*rF;
          if (disc > 0) { const sq = Math.sqrt(disc), r1 = mc - sq, r2 = mc + sq;
            if (L2 < rF*rF) rho = Math.max(rho, r2);
            else if (rho > r1 && rho < r2) rho = pl*pl > L2 - rF*rF ? r2 : Math.max(r1, 0); } }   // (a marble beyond the floor from the body, past the tangent, stays beyond it)
        let x = qx + cb*rho, z = qz + sb*rho;
        if (centreAt(i, x, z) < R + m.R + 2) {                            // held at its lane with under 2 m of air: along the lane, away from the body, to 2 m
          const a0 = Math.atan2(z - W.z, x - W.x), rl = Math.max(Math.hypot(x - W.x, z - W.z), rF), sg = (x - qx)*-Math.sin(a0) + (z - qz)*Math.cos(a0) >= 0 ? 1 : -1;
          lo = 0; hi = (R + m.R + 10)/rl;
          for (let k = 0; k < 14; k++) { const mid = (lo + hi)/2, a = a0 + sg*mid; if (centreAt(i, W.x + Math.cos(a)*rl, W.z + Math.sin(a)*rl) < R + m.R + 2) lo = mid; else hi = mid; }
          x = W.x + Math.cos(a0 + sg*hi)*rl; z = W.z + Math.sin(a0 + sg*hi)*rl; }
        centreAt(i, x, z);
        marbles.set(i, side3[0] - W.x, side3[1] - W.y, side3[2] - W.z, m.R, mquat[i]); mpos[i*4] = side3[0]; mpos[i*4 + 1] = side3[1]; mpos[i*4 + 2] = side3[2]; mcur[i*2] = x; mcur[i*2 + 1] = z; pushed[i] = 1; any = true; }
      if (any) { marbles.commit(); for (let i = 0; i < NM; i++) mdist[i] = avoid.length >= 2 ? Math.hypot(mcur[i*2] - avoid[0], mcur[i*2 + 1] - avoid[1]) : i; gloss(); } },
    // one more glass marble for the bowling ball's gloss to show (the world's own): world centre and radius
    setMirror(x, y, z, R) { mirror[0].set(x, y, z, R); },
    // u = the world's path progress; the event runs over opts.eventU = [u0, u1] (default [0.5, 0.72])
    setProgress(u) { const [a, b] = opts.eventU || [0.5, 0.72]; manual = true; ev = clamp01((u - a)/Math.max(b - a, 1e-4)); },
    update(dt, time, camera) {
      if (!manual) { const t = time % 22; ev = t < 3 ? 0 : t < 14 ? (t - 3)/11 : t < 19 ? 1 : 1 - sm(19, 22, t); }
      if (ownStyle) style.update(dt, time, camera);
      apply(ev, Math.min(dt, 0.1), time);
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
