// THE GREAT REFRACTOR hero set piece: "the roof as a machine".
//
// WHAT IT IS (everything 12 times life size, for a moth-sized camera)
//   DOME     a boarded timber hemisphere, radius 160, centre 150 m above the lowered floor, on 48 ribs and 17 purlin
//            rings, standing on a riveted base ring that rides 36 flanged wheels (5 m) on a rail. It turns as one group;
//            the wheels roll, twin boarded shutters slide apart on a 112 m slit that runs from the rail to past the crown,
//            two chain strands travel across the slit's foot, and an endless hauling rope runs and sways through 24 brass
//            sheaves under the wall head (the still curb, rail and sheaves are part of the piece; the brick drum is not).
//   TELESCOPE a white-enamelled riveted tube 204 m long (20 m at the tail, 24 m at the lens cell) with bolted flanges,
//            brass lens cell and dew cap, brass tail with a 15 m opening, a hinged eyepiece turret, two finders, two 6 m
//            focusing handwheels, three clamp rods on stand-offs, a saddle with a 14 m graduated declination circle, a
//            declination axis with a stack of counterweights, a polar housing with its hour circle. Inside: blackened
//            riveted wall and eleven baffle rings (15 m openings, 17 m apart), each with a thin starlit rim.
//   PIER     tapered, chamfered riveted iron (36 x 18 m foot, 140 m tall) with belt courses and a ladder; on its west face
//            the driving clock in an open-fronted case: flyball governor (3.6 m balls), bevel pair, gear train, winding
//            drum, falling weights on wire ropes, a turning worm and a toothed sector; ruby safelights.
//   FLOOR    the rising timber deck (radius 125): radial boards in rings, brass meridian strip, a curb round the pier's
//            hole, twelve ruby lanterns on stands. opts.floor = false leaves it out.
//
// SPACE   origin = centre of the dome on the LOWERED floor (y = 0), +Y up, front = +Z = SOUTH (the settled slit).
//   East = +X. The tube's pivot is on the dome axis at (0,150,0); the pier stands 22 m WEST of it at (-22, y, -6) (a real
//   German mount: the tube cannot sit over its own pier), clock case on the pier's west face (x -30..-44, y 52..84).
//   Settled tube axis = (0, sin 50, cos 50): tail (0,80.3,-58.5), lens (0,236.6,72.6). radius ~162, height ~313.
//
// OPTS    palette   7 hex strings in the brief's order [night, dome blue-grey, enamel white, starlight, ruby, green, brass]
//         fittings  'brass' | 'nickel' (default: by seed)      domeTurn  degrees the dome starts away from south (+-30 by seed)
//         star, starLow  starlight strength after / before the eye adapts (1.9 / 0.85)      fill  slit sky fill (0.2)
//         beam (0.0009 visible shaft), rim (0.55), frost (0..1), lampGain (3.5), floor (true), floorRise (50), progress (0.62)
//         track  degrees the dome keeps creeping after it has settled, u 0.30-1 (6; the slit stays over the tube)
//   By seed: fittings, dome paint hue, which way the dome turns, the park pose, 2 or 3 governor balls, 3-5 counterweights,
//   gear tooth counts, finder length, handwheel spokes, enamel warmth.
//
// PROGRESS  setProgress(u) every frame with the path's u. All four great motions are pure functions of u:
//   shutters u 0.02-0.28 (a 22.4 m blade at u 0), dome turn 0-0.30, tube slew 0.05-0.30 with one small overshoot (settled by
//   0.322), floor rise 0.06-0.45 (floorY()), starlight up 0.22-0.31, clock engages 0.19-0.25, turret swings 0.48-0.56.
//   Until it is called the piece shows u = 0.62 (settled, open, turret aside). Ambient motion (gears, governor, rope,
//   baffle rims) runs on the clock passed to update().
//   Other hooks: setStar(k) (cloud across the slit), setStarColor, setAmbient, setFill, setBeam, setRim, setFrost(k) (winter),
//   setFlash(k, hex) (the green fireball: k 0..1, ease it yourself), setLamp(i, pos, hex, range, gain) (slot 7 is free for
//   the green desk lamp; slots 0-6 hold the piece's ruby lamps unless overridden), tubePose(), slitOpen(), domeAngle().
//
// ANCHORS (local, settled pose)
//   portalSeat  { position: on the axis 112.5 m from the pivot, at the heart of the 22 m lens (a ring of glass round it shows the
//               sky magnified), facing: back down the tube, radius 6, shape 'circle', tilt true }   (the path's last 205 m run straight up the axis at 50 degrees)
//   flyThrough  ordered points for the brief's circuit: in from the north west of the pier, past the clock case 12 m off,
//               round the south, north down the tube's east flank 15 m from its skin, a left turn behind the tail, into
//               the tail opening and up the axis. At least 6 m from everything in the settled pose (7.5 m inside the tube).
//   tail, lens, pivot, axis, tailApproach (24 m behind the tail on the axis), viewpoints { entry, clockPass, linger, rail,
//   flank, tailTurn, inTube }, clockCase, governor, pierTop, counterweights, domeCentre, slitCentre, slitFoot, crown,
//   rail { y, radius }, rope { y, radius }, wallHead { y, radius } (top of the brick drum the world builds),
//   floor { radius, rise, hole }, desk (suggested), lamps [{ position, ridesFloor }].
//
// LIGHT   No three.js lights. Every surface runs one in-shader rig (hero.lit: uniforms, GLSL, makeMaterial, Geo, kinds), so
//   the world's wall, desk and ladder can use the same: (a) eight lamp points with a 30 m reach, (b) starlight from the slit
//   as a strip of sky, masked by an analytic test of whether the point sees the open slit along the tube's axis (this is
//   the bar of light that slides and widens), with the tube's and the pier's shadows, (c) a thin rim toward the slit,
//   (d) the slit reflected as a cold streak in brass and enamel (the great tube's enamel is plated: seams that hold at a distance, a tone and a
//   set to every plate, blue shade on the side turned from the sky, a sheen and a long highlight; brass above the rail stays gold with one thin blue line of sky down it), (e) starlight scattered in the air between eye and
//   surface (the shaft). Linear HDR, scene fog honoured. Wants a thin blue-black fog, bloom ~0.4 at threshold ~1, stars
//   in the slit from the world's sky, and nothing warm. kinds: 0 painted iron (riveted where uv is in metres), 1 brass,
//   2 enamel, 3 painted timber, 4 black, 5 glow, 6 steel, 8 floor boards, 10 rope, 12 brickwork, 13 stone flags (both need uv in metres).
//   The room's ambient is shared out per surface (setAmbientShare(deck, walls, dome, fill): the deck and the brick stay near black so
//   the bar of starlight carries the picture, the dome keeps its readable blue-grey); the floor's twelve lanterns light whatever is
//   near them as one analytic ring (uRing, uRingCol), so each throws its own red pool; opts.deckColor paints the boards.
//   The dome's own timber: opts.domeBase (0.17: a floor of slit light all round the hull), opts.domeSlit (0.32: the gain in the bays beside the
//   opening), opts.domeShadow (1: the shadows ribs and purlins throw on the boards); uniforms uDomeL, uDomeWarm (lamp warmth above the rail),
//   uDomeCol (set by setStarColor(hex, domeHex)).
//   More hooks: opts.clockAt [u0, u1] (when the driving clock engages), setLampGlow(glass, gain) (turn the ruby safelights
//   down), opts.creep (degrees the dome sways about its place on the clock, so it never stands still), opts.creepRate, opts.cloud (0-1: shadows of racing cloud cross the bar of starlight),
//   opts.flicker (0..1, the oil flames behind the ruby glass), floorGroup (the rising deck's group: parent things to it), domeGroup (the turning dome's group).
//
// COST    ~111k triangles, 8 draw calls (skin, shutters, slit air, dome frame, wheels, rope, machine, deck), 5 shader
//   programs, no textures, no lights; build ~150-230 ms in the software harness. update() writes uniforms and the bone matrices (NB of them; three are the hands of the observer's dial).
import * as THREE from 'three';

// ---------------------------------------------------------------- dimensions (metres, hero-local)
const R = 160, CY = 150;                    // dome radius, height of its centre (= rail level) above the lowered floor
const SLIT_W = 56, SLIT_ZMIN = -30;         // slit half width (widened three times from the brief's 22 so the sky reads as the brightest thing in the hall), how far past the crown it runs (dome-local z)
const PIER_X = -22, PIER_Z = -6;            // pier centre (the tube hangs east of it, on the dome axis)
const ELEV = 50 * Math.PI / 180;
const DY = Math.sin(ELEV), DZ = Math.cos(ELEV);   // settled tube axis (0, DY, DZ), also the starlight direction
const TAIL = 91, LENS = 113;                // pivot to tail plate / to lens cell, along the axis
const NB = 23;                              // rigid bones in the machine mesh (19 is free for the world: a pendulum on the deck; 20 to 22 are the hands of the observer's dial)
// THE IRIS in the tube, behind the fourth baffle ring from the tail: IRIS_N blackened leaves, each an arc of plate from IRIS_R0 to IRIS_R1
// off the axis and IRIS_ARC long, pivoted at its first end (on the radius IRIS_RP) and swung in its own plane; open (swing 0) they stand
// wholly behind the ring, whose lip is at 8.46 m; swung by IRIS_SHUT they leave an eye of 3.2 m radius. The leaves are stacked as a helix
// (each rises IRIS_RISE toward the lens along its arc), so they lie over one another in one order all the way round and never touch:
// shut, two plates over one place are 7.7 mm apart at the least, and a lip dips 3 mm. The arc is 145 degrees because the far outer corner
// of a longer leaf swings beyond IRIS_R1, into the tube's wall, when shut; the stack is 0.2 m deep and 0.05 m behind the ring so that the
// open leaves stay in the lip's shadow from every place on the route.
// All are authored as leaf 0; a leaf's vertices carry the bone number NB + its index, which the vertex shader reads as: swing, then turn
// to its place round the axis, then the tube's own bone (2). No bone matrix is spent on them.
const IRIS_N = 24, IRIS_S = -29.75, IRIS_R0 = 8.71, IRIS_R1 = 10.05, IRIS_RP = 9.38, IRIS_ARC = 145 * Math.PI / 180, IRIS_RISE = 0.2, IRIS_SHUT = 34 * Math.PI / 180;

// ---------------------------------------------------------------- GLSL: the one light rig every surface shares
const LIGHT = /* glsl */`
uniform vec3 uCtr; uniform vec4 uSlit; uniform vec2 uDomeCS; uniform vec3 uKeyDir; uniform vec3 uStarCol; uniform float uStar;
uniform vec3 uAmbSky; uniform vec3 uAmbGnd; uniform vec4 uLampPos[8]; uniform vec3 uLampCol[8];
uniform vec3 uTubeA; uniform vec3 uTubeB; uniform float uTubeR; uniform vec4 uFlash; uniform float uFrost; uniform float uBeam;
uniform float uTime; uniform vec3 uCamL; uniform float uFill; uniform float uRim; uniform float uGlow; uniform float uLampGlow; uniform vec4 uHole; uniform float uCloudK;
uniform vec4 uAmbK; uniform vec4 uRing; uniform vec3 uRingCol; uniform vec4 uDomeL; uniform vec3 uDomeWarm; uniform vec3 uDomeCol;
uniform vec4 uShaft; uniform vec3 uDomeK; uniform float uSlitGlow; uniform float uDeckKey; uniform vec4 uTube; uniform vec4 uTube2; uniform vec4 uRing2; uniform vec3 uRing2Col; uniform vec3 uWarm; uniform vec4 uWin; uniform vec3 uWinCol; uniform vec4 uBounce;      // shaft: strength, 1/e radius, lower and upper end along the axis; dome: darkest share far from the slit, falloff in metres, rib rim
float gAmb = 1.0; float gFill = 1.0; float gKey = 1.0; float gBeam = 1.0; float gSpec = 1.0; float gSoft = 1.0; float gWrap = 0.0; float gTint = 0.0;      // per-surface share of the room's ambient, of the slit's sky fill and of the direct starlight (set in main before shadeAll)
float hash31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z); }
// 1 where the point can see the open slit along the starlight direction (this makes the bar of light)
float slitMaskS(vec3 P, float soft){
  vec3 p = P - uCtr; float b = dot(p, uKeyDir); float c = dot(p, p) - uSlit.w * uSlit.w;
  float t = -b + sqrt(max(b * b - c, 0.0));
  vec3 h = p + uKeyDir * t;
  float hx = uDomeCS.x * h.x - uDomeCS.y * h.z, hz = uDomeCS.y * h.x + uDomeCS.x * h.z;
  float w = uSlit.x, s = min(uSlit.z * soft, w * 0.6 + 0.02);
  return (1.0 - smoothstep(w - s, w + s, abs(hx))) * smoothstep(uSlit.y - 3.0 * soft, uSlit.y + 3.0 * soft, hz) * smoothstep(0.0, 6.0 * soft, h.y);
}
float slitMask(vec3 P){ return slitMaskS(P, 1.0); }
// how near a point of the dome is to the open slit: 1 at its edge, falling away round the skin
float slitNear(vec3 P){
  vec3 p = P - uCtr; float hx = uDomeCS.x * p.x - uDomeCS.y * p.z, hz = uDomeCS.y * p.x + uDomeCS.x * p.z;
  float dx = max(abs(hx) - uSlit.x, 0.0), dz = max(uSlit.y - hz, 0.0);
  return exp(-sqrt(dx * dx + dz * dz + 1e-4) / max(uDomeK.y, 1.0));
}
float erfA(float x){ float x2 = x * x; float t = 1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)); return sign(x) * sqrt(max(t, 0.0)); }
// inside the tube: haze lit by the lens, a soft cone round the axis, integrated along the view ray in closed form
float tubeHaze(vec3 P){
  vec3 rd = P - uCamL; float len = length(rd); rd = rd / max(len, 1e-3);
  vec3 oc = uCamL - uCtr; float ra = dot(rd, uKeyDir), oa = dot(oc, uKeyDir);
  vec3 rp = rd - uKeyDir * ra, op = oc - uKeyDir * oa;
  float a = max(dot(rp, rp), 1e-5), b = dot(op, rp), c = dot(op, op), w = 4.6, sa = sqrt(a);
  float core = exp(-max(c - b * b / a, 0.0) / (w * w)); float t0 = min(uTube2.x, len);      // the air right round the eye does not glow: it would veil the whole picture
  return max(core * (0.8862 * w / sa) * (erfA(sa * (len + b / a) / w) - erfA(sa * (t0 + b / a) / w)), 0.0);
}
// the two colours the lens throws down the tube (blue focuses short, gold long): rings that creep toward the tail
vec3 tubeRings(float s, float ang){
  float f1 = 0.5 + 0.5 * sin(s * 1.05 - uTime * 0.55 + 0.5 * sin(ang * 2.0 + uTime * 0.2));
  float f2 = 0.5 + 0.5 * sin(s * 0.66 - uTime * 0.33 + 2.0 + 0.5 * sin(ang * 3.0 - uTime * 0.15));
  return vec3(0.2, 0.42, 1.0) * (f1 * f1 * f1 * 1.3) + vec3(1.0, 0.58, 0.16) * (f2 * f2 * f2 * 1.1) + uStarCol * 0.08;
}
// light on a surface inside the tube. Each bay between two baffles takes one colour of the lens's fringe, blue then gold, from the
// tail on; it falls off into a dark root under the baffle at either end, thin rings of the other colour creep down it toward the
// tail, and rivets and seams catch it at a glance. fs = how many metres of the axis one pixel covers here (fine rings fade out)
vec3 tubeLight(vec3 P, vec3 N, vec3 Ng, vec3 V, float fs){
  vec3 pa = P - uCtr; float s = dot(pa, uKeyDir); vec3 qa = pa - uKeyDir * s; float rq = max(length(qa), 1e-3);
  float gs = smoothstep(-100.0, 112.0, s); float g = uTube2.y + (1.0 - uTube2.y) * gs * sqrt(gs);
  vec3 Ld = uCtr + uKeyDir * 113.0 - P; Ld = Ld / max(length(Ld), 1e-3);
  float ang = atan(qa.y * uKeyDir.z - qa.z * uKeyDir.y, qa.x + (abs(qa.x) < 1e-4 ? 2e-4 : 0.0));
  float back = smoothstep(0.5, 0.9, -dot(Ng, uKeyDir));
  float bay = (s + 81.0) / 17.0; float bi = floor(bay), bf = bay - bi; float odd = mod(bi, 2.0);
  float up = smoothstep(0.03, 0.93, bf); float prof = mix(0.015, 1.35, up * up) * (1.0 - 0.5 * smoothstep(0.955, 1.0, bf));      // each bay runs from full colour to near black under the next baffle, so that baffle's lip stands against the dark
  vec3 cb = vec3(0.14, 0.38, 1.0), cg = vec3(1.5, 0.74, 0.13);
  // the gold bay the eye is passing reads as polished bronze: no pale wash, a warm band of highlight down its length and the
  // slit's blue along its top (further up the tube the bays keep their soft colour)
  float nearB = odd * (1.0 - smoothstep(26.0, 54.0, s - dot(uCamL - uCtr, uKeyDir))) * (1.0 - back);
  float c1 = 0.5 + 0.5 * sin(s * 1.1 - uTime * 0.8 + 0.7 * sin(ang * 2.0 + uTime * 0.2)); c1 *= c1; c1 *= c1; c1 *= c1 * (1.0 - smoothstep(0.35, 1.2, fs));
  float br = 0.82 + 0.18 * sin(uTime * 0.7 + bi * 2.1 + 0.6 * sin(ang * 3.0 - uTime * 0.15));
  vec3 rings = mix(mix(cb, cg, odd), mix(vec3(0.8, 0.88, 1.0), vec3(1.5, 0.7, 0.13), nearB), 0.34 * up * up) * mix(vec3(1.0), vec3(0.72, 0.6, 0.5), nearB) * (prof * br) + mix(cg, cb, odd) * (0.3 * c1 * prof) + uStarCol * 0.03;
  float nl = max(dot(N, Ld), 0.0);
  vec3 Hh = normalize(Ld + V + vec3(0.0, 1e-4, 0.0)); float sp = pow(max(dot(N, Hh), 0.0), 40.0);
  vec3 L = rings * (uTube.x * g * (mix(0.78, 0.12, gs) + 4.5 * nl * nl + 0.2 * sp) * mix(1.0, 0.07, back));      // by the lens the wall is dark and its rivets catch the light
  vec3 airC = mix(uStarCol, vec3(1.25, 0.66, 0.16) * dot(uStarCol, vec3(0.3, 0.55, 0.15)), nearB);
  L += airC * (0.15 * uTube.y * (0.35 + 0.65 * gs) * max(dot(N, qa) / -rq, 0.0));      // the glowing air down the axis lights the wall that faces it
  { float wb = 0.5 + 0.5 * cos(ang + 0.34 - 0.12 * sin(uTime * 0.23)); wb *= wb; wb *= wb; wb *= wb; wb *= wb; wb *= wb;
    float wb2 = 0.5 + 0.5 * cos(ang - 3.46 + 0.1 * sin(uTime * 0.17)); wb2 *= wb2; wb2 *= wb2; wb2 *= wb2; wb2 *= wb2; wb2 *= wb2;
    float tb = 0.5 + 0.5 * sin(ang); tb *= tb; tb = tb * tb * tb;
    float run = (0.3 + 0.7 * up) * (0.85 + 0.3 * vnoise(vec3(s * 0.9, ang * 5.0, 3.0)));
    L += (vec3(1.7, 0.95, 0.3) * (1.25 * wb + 0.8 * wb2) + vec3(0.14, 0.4, 1.0) * (0.85 * tb)) * (nearB * run * uTube.x * g * br); }
  vec3 Lt = uCtr - uKeyDir * 96.0 - P; float dt = length(Lt); Lt = Lt / max(dt, 1e-3);
  L += (uAmbSky * 1.1 + uWarm * 0.5) * (uTube.w * 0.6 * (0.25 + 0.75 * max(dot(N, Lt), 0.0)) * exp(-dt * 0.045));
  return L;
}
// the shaft: starlight in dusty air round the telescope's settled axis (a soft round beam), integrated along the view ray in closed form
float shaftScatter(vec3 P){
  vec3 rd = P - uCamL; float len = length(rd); rd = rd / max(len, 1e-3);
  vec3 oc = uCamL - uCtr; float ra = dot(rd, uKeyDir), oa = dot(oc, uKeyDir);
  vec3 rp = rd - uKeyDir * ra, op = oc - uKeyDir * oa;
  float a = max(dot(rp, rp), 1e-4), b = dot(op, rp), c = dot(op, op), w = max(uShaft.y, 1.0), sa = sqrt(a);
  float tm = clamp(-b / a, 0.0, len); float s = oa + ra * tm;
  float along = smoothstep(uShaft.z, uShaft.z + 30.0, s) * (1.0 - smoothstep(uShaft.w - 14.0, uShaft.w + 4.0, s)) * (0.5 + 0.5 * smoothstep(-95.0, 70.0, s));
  float core = exp(-max(c - b * b / a, 0.0) / (w * w));
  float I = core * (0.8862 * w / sa) * (erfA(sa * (len + b / a) / w) - erfA(sa * (b / a) / w));
  return max(I, 0.0) * along;
}
// soft shadow of the telescope tube (a capsule A-B) on everything else
float tubeShadow(vec3 P){
  vec3 ab = uTubeB - uTubeA, ap = P - uTubeA;
  float abL = dot(ab, uKeyDir), apL = dot(ap, uKeyDir);
  vec3 ab2 = ab - uKeyDir * abL, ap2 = ap - uKeyDir * apL;
  float l2 = dot(ab2, ab2);
  float s = clamp(dot(ap2, ab2) / max(l2, 1e-3), 0.0, 1.0);
  s = mix(step(0.0, abL), s, smoothstep(0.0, 9.0, l2));
  float d = length(ap2 - ab2 * s);
  float t = abL * s - apL;
  float pen = 1.2 + 0.03 * max(t, 0.0);
  return 1.0 - (1.0 - smoothstep(uTubeR - pen, uTubeR + pen, d)) * smoothstep(-2.0, 4.0, t) * 0.9;
}
// starlight scattered by dusty air between the eye and the surface: the visible shaft
float beamScatter(vec3 P, vec2 frag){
  vec3 rd = P - uCamL; float len = length(rd); rd = rd / max(len, 1e-3); len = min(len, 460.0);
  float j = fract(52.9829189 * fract(dot(frag, vec2(0.06711056, 0.00583715))));
  float dt = len / float(BEAM_STEPS), acc = 0.0;
  for (int i = 0; i < BEAM_STEPS; i++) {
    vec3 q = uCamL + rd * dt * (float(i) + j); vec3 qc = q - uCtr;
    acc += slitMask(q) * step(dot(qc, qc), uSlit.w * uSlit.w) * smoothstep(-150.0, -100.0, qc.y);
  }
  return acc * dt;
}
vec3 shadeAll(vec3 P, vec3 N, vec3 V, vec3 alb, float metal, float gloss, float ao, float key, vec3 emis, vec2 frag, float rimK){
  float nv = max(dot(N, V), 0.0);
  float fres = (1.0 - nv); fres = fres * fres * fres * fres;
  vec3 amb = mix(uAmbGnd, uAmbSky, N.y * 0.5 + 0.5) * (ao * gAmb);
  float ndl = dot(N, uKeyDir);
  // the slit is a long strip of sky, not a point: take the best of five directions along it, plus its width
  float nxd = uDomeCS.x * N.x - uDomeCS.y * N.z, nzd = uDomeCS.y * N.x + uDomeCS.x * N.z;
  float arc = max(max(nzd, 0.906 * nzd + 0.423 * N.y), max(0.643 * nzd + 0.766 * N.y, max(0.259 * nzd + 0.966 * N.y, -0.174 * nzd + 0.985 * N.y)));
  // across the slit: near the meridian light comes from both sides, far from it only from the slit's side
  vec3 pd = P - uCtr; float wx = clamp(-(uDomeCS.x * pd.x - uDomeCS.y * pd.z) / 70.0, -1.0, 1.0);
  arc = clamp(max(arc, 0.0) + 0.45 * mix(abs(nxd), max(nxd * sign(wx), 0.0) * 1.6, abs(wx)), 0.0, 1.0);
  float diff = (arc + 0.1) / 1.1;
  float openK = smoothstep(0.0, 22.0, uSlit.x);
  // racing cloud (uCloudK > 0): its shadows cross the bar of light, measured across the starlight direction
  vec3 pc = P - uKeyDir * dot(P, uKeyDir);
  key *= mix(1.0, 0.07 + 0.93 * smoothstep(0.4, 0.58, 0.75 * vnoise(pc * 0.022 + vec3(uTime * 0.2, 0.0, uTime * 0.09)) + 0.25 * vnoise(pc * 0.07 + vec3(uTime * 0.34, 3.0, uTime * 0.14))), uCloudK);
  vec3 keyC = uStarCol * (uStar * (key * gKey + (1.0 - key) * uFill * gFill * openK));
  vec3 H = normalize(uKeyDir + V + vec3(0.0, 1e-4, 0.0));
  float sp = pow(max(dot(N, H), 0.0), 6.0 + gloss * 110.0) * (0.15 + gloss * 1.6) * step(0.0, ndl);
  float bk = step(1.5, gSpec);
  vec3 dsum = amb + keyC * diff;
  vec3 ssum = keyC * sp; vec3 msum = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    vec3 d = uLampPos[i].xyz - P; float r2 = dot(d, d); float rr = uLampPos[i].w;
    float att = max(1.0 - r2 / max(rr * rr, 1.0), 0.0); att = att * att / (1.0 + r2 * 10.8 / max(rr * rr, 1.0));     // a 30 m lamp falls as before; a longer reach throws a wider pool
    vec3 dn = d * inversesqrt(max(r2, 1e-3));
    // the desk lamp (slot 7) has moths round it: their shadows flit over everything it lights; its shade keeps most of it off what hangs overhead
    if (i == 7) att *= (1.0 - 0.7 * smoothstep(0.52, 0.66, vnoise(dn * 6.5 + vec3(uTime * 1.7, uTime * 1.1, -uTime * 1.4)))) * mix(0.1, 1.0, smoothstep(-0.6, -0.25, dn.y));
    else if (i >= 3) att *= 1.0 - 0.55 * smoothstep(0.55, 0.68, vnoise(dn * 5.0 + vec3(uTime * 1.3 + float(i) * 3.7, uTime * 0.9, -uTime * 1.1)));      // the deck's lanterns have a moth or two each
    float nl = max(dot(N, dn), 0.0);
    vec3 hh = normalize(dn + V + vec3(0.0, 1e-4, 0.0));
    vec3 lc = mix(uLampCol[i], vec3(1.0, 0.96, 0.9) * dot(uLampCol[i], vec3(0.3, 0.55, 0.15)), gTint);      // (gTint: a surface that keeps its own colour under a coloured lamp and takes only a tint of it)
    dsum += lc * (att * nl); msum += lc * (att * (0.3 + 0.7 * nl));
    ssum += lc * (att * pow(max(dot(N, hh), 0.0), 8.0 + gloss * 60.0) * (0.3 + gloss * 2.0) * step(1e-4, nl));
  }
  {
    // the ring of ruby lanterns on the rising floor: only the nearest one matters at any point
    float seg = 6.2832 / max(uRing.w, 1.0); float la = floor(atan(P.x, P.z + (abs(P.z) < 1e-4 ? 2e-4 : 0.0)) / seg + 0.5) * seg;
    vec3 d = vec3(sin(la) * uRing.x, uRing.y, cos(la) * uRing.x) - P; float r2 = dot(d, d);
    float att = max(1.0 - r2 / max(uRing.z * uRing.z, 1.0), 0.0); att = att * att / (1.0 + r2 * 0.0065);
    vec3 dn = d * inversesqrt(max(r2, 1e-3)); float nl = max(dot(N, dn), 0.0);
    att *= 1.0 - 0.55 * smoothstep(0.55, 0.68, vnoise(dn * 5.0 + vec3(uTime * 1.3 + la * 3.1, uTime * 0.9, -uTime * 1.1)));      // moth shadows cross each pool
    att *= 0.8 + 0.42 * vnoise(vec3(uTime * 1.7, la * 7.3, 1.5)) + 0.05 * sin(uTime * 7.3 + la * 5.3);      // oil flames: each lantern breathes on its own
    vec3 rc = mix(uRingCol, vec3(1.0, 0.96, 0.9) * dot(uRingCol, vec3(0.3, 0.55, 0.15)), gTint);
    dsum += rc * (att * nl); msum += rc * (att * (0.3 + 0.7 * nl));
    // the sconces on the drum wall, between the lanterns: they warm the brick and the balcony under them
    la = (floor(atan(P.x, P.z + (abs(P.z) < 1e-4 ? 2e-4 : 0.0)) / seg) + 0.5) * seg;
    d = vec3(sin(la) * uRing2.x, uRing2.y, cos(la) * uRing2.x) - P; r2 = dot(d, d);
    att = max(1.0 - r2 / max(uRing2.z * uRing2.z, 1.0), 0.0); att = att * att / (1.0 + r2 * 0.012);
    dn = d * inversesqrt(max(r2, 1e-3)); nl = max(dot(N, dn), 0.0);
    att *= 0.84 + 0.34 * vnoise(vec3(uTime * 1.4, la * 5.1, 7.5));
    dsum += uRing2Col * (att * (0.15 + 0.85 * nl)); msum += uRing2Col * (att * (0.3 + 0.7 * nl));
    // the shuttered windows leak the night's blue onto the brick round them, the balcony under them and the gallery over them
    float segW = 6.2832 / max(uWin.w, 1.0); la = (floor(atan(P.x, P.z + (abs(P.z) < 1e-4 ? 2e-4 : 0.0)) / segW) + 0.5) * segW;
    d = vec3(sin(la) * uWin.x, uWin.y, cos(la) * uWin.x) - P; d.y *= 0.5; r2 = dot(d, d);
    att = max(1.0 - r2 / max(uWin.z * uWin.z, 1.0), 0.0); att = att * att / (1.0 + r2 * 0.01);
    dn = d * inversesqrt(max(r2, 1e-3)); nl = max(dot(N, dn), 0.0);
    dsum += uWinCol * (att * (0.4 + 0.6 * nl)); msum += uWinCol * (att * 0.5);
    // lamp light thrown back up off the deck: it warms the underside of everything that hangs over it and dies away up the dome
    float hb = max(P.y - uBounce.w, 0.0); float upK = clamp(0.3 - 0.7 * N.y, 0.0, 1.0);
    vec3 bnc = uBounce.rgb * (upK * exp(-hb / 105.0) * gBeam); dsum += bnc; msum += bnc * 0.6;
  }
  {
    // the first blade of sky lays a bar of cold light down the wall beneath it and across the floor toward the pier
    vec3 pb = P - uCtr; float bx = uDomeCS.x * pb.x - uDomeCS.y * pb.z, bz = uDomeCS.y * pb.x + uDomeCS.x * pb.z; float wb = uSlit.x + 5.0;
    float shim = 0.72 + 0.5 * vnoise(vec3(pb.y * 0.045 - uTime * 0.55, bz * 0.03 + uTime * 0.2, uTime * 0.3));      // dust drifting through it
    float bar = uSlitGlow * 5.0 * shim * (exp(-bx * bx / (wb * wb)) + 1.3 * exp(-bx * bx / (wb * wb * 0.1))) * smoothstep(-30.0, 150.0, bz) * (0.35 + 0.65 * smoothstep(-160.0, 0.0, pb.y));
    bar = bar < 1.0 ? bar : 1.0 + 1.6 * (1.0 - exp(-(bar - 1.0) / 1.6));      // held on a soft knee: the brightest thing on that wall, and the brick courses, the windows and the gallery still read through it
    dsum += mix(uStarCol, vec3(0.78, 0.88, 1.0), 0.45) * bar;
  }
  ssum *= gSpec;
  vec3 Rv = reflect(-V, N);
  vec3 env = mix(uAmbGnd * 1.4, uAmbSky * 1.5, smoothstep(-0.4, 0.6, Rv.y));
  env = mix(env, mix(uAmbGnd * 0.45, uAmbSky * 2.3, smoothstep(-0.12, 0.3, Rv.y)), metal);   // polished metal: a darker floor, a brighter roof
  // the open slit seen in polished things: a long cold streak; a little ruby from the floor lamps below
  float sxr = uDomeCS.x * Rv.x - uDomeCS.y * Rv.z, szr = uDomeCS.y * Rv.x + uDomeCS.x * Rv.z;
  float strip = exp(-sxr * sxr * 45.0) * smoothstep(-0.25, 0.1, szr + Rv.y * 0.4) * smoothstep(-0.05, 0.15, Rv.y);
  env *= mix(0.2, 1.0, gBeam);                                              // (inside the tube nothing mirrors the hall)
  env *= mix(1.0, 0.3 + 1.5 * smoothstep(0.3, 0.72, 0.5 + 0.5 * sin(Rv.y * 7.0 + Rv.x * 4.0 + Rv.z * 3.0)), bk);      // brass: dark and bright reflections in turn round every turned surface
  env += uStarCol * (uStar * strip * (1.3 + 1.7 * bk) * gBeam * smoothstep(0.0, 8.0, uSlit.x));
  env *= 1.0 + 0.35 * sin(Rv.x * 23.0 + Rv.z * 11.0) * smoothstep(0.0, 0.4, Rv.y);
  env += (vec3(0.05, 0.004, 0.008) + uWarm) * (1.0 - smoothstep(-0.8, -0.2, Rv.y)) + uWarm * (0.6 * metal);      // polished things keep a little of the lamps wherever they stand
  vec3 col = alb * dsum * (1.0 - metal * 0.88);
  col += mix(vec3(0.04), alb, metal) * (ssum + msum * (metal * mix(0.4, 0.26, bk)) + env * (metal * 0.9 + 0.08 * gloss + fres * 0.25));
  // thin rim toward the slit so nothing sinks into the wall behind it
  vec3 toS = uCtr + uKeyDir * uSlit.w - P; toS = toS / max(length(toS), 1e-3);
  float rimF = smoothstep(-0.15, 0.85, dot(N, toS)); rimF = max(rimF, 0.42 * gWrap * smoothstep(0.6, 1.4, uRim));      // (on the white enamel and on timber a raised rim wraps round: an edge that looks away from the slit still stands off what is behind it)
  col += uStarCol * mix(vec3(1.0), vec3(0.62, 0.8, 1.1), smoothstep(0.6, 1.4, uRim)) * (uRim * rimK * fres * rimF * (0.25 + 0.75 * uStar) * (0.35 + 0.65 * ao));
  col += emis;
  // the shaft: dust in the starlight drifts slowly, so the beam is never quite still
  float dust = 0.7 + 0.6 * vnoise(mix(uCamL, P, 0.6) * 0.045 + vec3(uTime * 0.06, -uTime * 0.1, uTime * 0.045));
  // (not inside the tube: its wall shuts the hall's beam out, and it has its own haze)
  col += uStarCol * (uStar * 0.13 * gBeam * (1.0 - exp(-6.0 * uBeam * dust * beamScatter(P, frag))));
  col += uStarCol * (uStar * uShaft.x * gBeam * (1.0 - exp(-0.036 * dust * shaftScatter(P))));
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  col = mix(col, uFlash.rgb * (lum * 1.7 + 0.05 * dot(alb, vec3(0.333))), uFlash.a);
  return col;
}
`;

// ---------------------------------------------------------------- the great lens, seen from inside the tube: the sky brought to a focus
const LENS_VERT = /* glsl */`
varying vec3 vQ; varying vec3 vP;
void main(){ vQ = position; vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LENS_FRAG = /* glsl */`
uniform vec3 uCtr; uniform vec3 uKeyDir; uniform vec3 uCamL; uniform float uTime; uniform vec4 uTube; uniform vec4 uTube2; uniform vec4 uLensLook; uniform vec4 uLensLook2; uniform vec3 uStarCol; uniform float uStar; uniform vec4 uLensR;
varying vec3 vQ; varying vec3 vP;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm2(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
float erfL(float x){ float x2 = x * x; float t = 1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)); return sign(x) * sqrt(max(t, 0.0)); }
vec3 spectrum(float t){ t = clamp(t, 0.0, 1.0);       // red at 0 through gold, green and blue to violet at 1
  vec3 c = clamp(vec3(1.6 - 3.2 * t, 1.5 - abs(t - 0.42) * 4.2, 3.4 * t - 1.5), 0.0, 1.0); c.r += 0.5 * smoothstep(0.82, 1.0, t); return c; }
vec3 starLayer(vec2 p, float sc, float pix, float seed, float boost, float kmin){
  vec2 g = p * sc; vec2 id = floor(g); vec2 f = g - id - 0.5;
  float h = h21(id + seed);
  vec2 o = (vec2(h21(id + seed + 11.3), h21(id + seed + 23.7)) - 0.5) * 0.7;
  float r0 = 0.045 + 0.1 * h * h; float r = max(r0, 1.3 * pix * sc); float k = max(r0 / r, kmin);
  float dd = length(f - o);
  float tw = 0.7 + 0.3 * sin(uTime * (2.0 + 4.0 * h) + h * 90.0);
  float c = 1.0 - smoothstep(0.0, r, dd);
  float hc = h21(id + seed + 5.0);
  vec3 tint = mix(vec3(0.66, 0.8, 1.0), vec3(1.0, 0.8, 0.5), step(0.7, hc)); tint = mix(tint, vec3(1.0, 0.5, 0.38), step(0.93, hc));
  return tint * (h * h * h * boost * tw * c * c * k * k);
}
void main(){
  vec3 e1 = vec3(1.0, 0.0, 0.0); vec3 e2 = vec3(0.0, uKeyDir.z, -uKeyDir.y);
  vec3 rel = vQ - uCtr; vec2 q = vec2(dot(rel, e1), dot(rel, e2)) / uLensR.x; float r = length(q);
  vec3 Vd = vP - uCamL; float dist = length(Vd); Vd = Vd / max(dist, 1e-3);
  vec2 vq = vec2(dot(Vd, e1), dot(Vd, e2));
  // the image stands at infinity: it leans with the eye, and the glass bends it harder toward the rim
  vec2 im = q * (0.4 + 0.2 * r * r) + vq * 1.5 + vec2(uTime * 0.0022, uTime * 0.0006);
  float pix = max(length(dFdx(im)), length(dFdy(im)));
  // the Milky Way across the glass, mottled, with dust lanes
  vec2 bn = vec2(0.5, 0.866); vec2 bt = vec2(0.866, -0.5);
  float b = dot(im, bn) + 0.05 + 0.06 * sin(dot(im, bt) * 5.0);
  float band = exp(-b * b * 17.0);
  float cl = fbm2(im * 4.2 + 2.0); float cl2 = fbm2(im * 9.0 + vec2(5.0, 1.0));
  float lane = smoothstep(0.36, 0.6, cl2 + abs(b) * 1.5);
  float cl5 = cl * cl; cl5 = cl5 * cl5 * cl;
  float mw = band * (0.015 + 7.0 * cl5) * mix(0.03, 1.0, lane);      // star clouds in knots with black between them, not a veil
  vec3 col = vec3(0.004, 0.008, 0.022);
  col += mix(vec3(0.26, 0.46, 1.0), vec3(1.0, 0.72, 0.4), smoothstep(0.4, 0.7, cl2)) * (0.2 * uLensLook.x * mw);
  vec2 cq = im - bt * 0.24; float core = exp(-dot(cq, cq) * 6.0);
  col += vec3(1.0, 0.68, 0.32) * (core * band * lane * (0.3 + 0.7 * uLensLook2.x) * (0.3 + 1.4 * cl * cl));
  // nebulae: rose knots strung along the band, a thin green-blue veil beside them
  float nb = smoothstep(0.52, 0.8, fbm2(im * 6.5 + vec2(9.0, 3.0))) * smoothstep(0.25, 0.9, band);
  float nt = smoothstep(0.5, 0.85, fbm2(im * 5.0 + vec2(1.0, 17.0))) * smoothstep(0.05, 0.6, band) * (1.0 - nb);
  col += (vec3(1.0, 0.16, 0.4) * (nb * 0.95) + vec3(0.06, 0.8, 0.68) * (nt * 0.42)) * uLensLook.x;
  { float n3 = fbm2(im * 7.0 + vec2(3.0, 11.0)), n4 = fbm2(im * 3.6 + vec2(21.0, 5.0));
    col += mix(vec3(1.0, 0.2, 0.42), mix(vec3(0.1, 0.72, 0.8), vec3(0.45, 0.3, 1.0), smoothstep(0.55, 0.75, n4)), smoothstep(0.38, 0.56, n4)) * (smoothstep(0.4, 0.72, n3) * 0.5 * (0.5 + 0.5 * uLensLook.x)); }
  // the Large Cloud, with its one bright rose knot
  vec2 lc = im - vec2(-0.2, 0.2) + bt * 0.02; float l1 = exp(-dot(lc, lc) * 40.0);
  vec2 lk = lc - vec2(0.05, -0.03);
  col += (vec3(0.5, 0.68, 1.0) * (l1 * (0.1 + 0.55 * fbm2(im * 24.0))) + vec3(1.0, 0.3, 0.46) * (0.9 * exp(-dot(lk, lk) * 2600.0))) * uLensLook.y;
  // stars, crowded along the band
  float dens = 1.0 + 2.6 * band * uLensLook.x + 2.0 * l1 * uLensLook.y;
  vec3 st = starLayer(im, 22.0, pix, 0.0, 22.0, 0.55) + starLayer(im, 52.0, pix, 40.0, 13.0 * dens, 0.25) + starLayer(im, 120.0, pix, 80.0, 6.0 * dens, 0.0);
  // the hour before dawn: the field shades to teal; a comet stands in it with its tail up
  float el = smoothstep(-0.45, 0.45, dot(im, vec2(0.0, 1.0)));
  col = mix(col, mix(vec3(0.012, 0.1, 0.11), vec3(0.006, 0.022, 0.07), el) + col * 0.7, uLensLook.w);
  st *= mix(1.0, mix(0.3, 1.0, el), uLensLook.w);
  vec2 cm = im - vec2(0.16, -0.08); float ct = dot(cm, vec2(-0.26, 0.966)); float cs = length(cm - vec2(-0.26, 0.966) * ct);
  float cw = 0.006 + 0.16 * max(ct, 0.0);
  col += vec3(0.6, 0.94, 1.0) * (uLensLook2.y * (exp(-dot(cm, cm) * 9000.0) * 6.0 + exp(-dot(cm, cm) * 500.0) * 0.6 + exp(-cs * cs / (cw * cw)) * exp(-max(ct, 0.0) * 5.0) * smoothstep(0.0, 0.02, ct) * 0.9));
  col += st;
  // racing cloud under the moon: silver-edged rags cross the glass
  vec2 cp = im * 2.4 + vec2(uTime * 0.05, uTime * 0.012); float cn = fbm2(cp) + 0.12 * (vn2(cp * 5.0) - 0.5);
  float cc = smoothstep(0.49, 0.53, cn) * uLensLook.z;
  float cm2 = fbm2(cp + vec2(0.1, 0.12)) + 0.12 * (vn2((cp + vec2(0.1, 0.12)) * 5.0) - 0.5);
  float edge = smoothstep(0.478, 0.495, cn) * (1.0 - smoothstep(0.5, 0.535, cn)) * clamp((cn - cm2) * 9.0, 0.0, 1.0) * uLensLook.z;
  col = mix(col, vec3(0.006, 0.008, 0.016), cc * 0.9) + vec3(0.62, 0.72, 0.9) * (edge * 0.45);
  col *= uTube.z * uLensR.y;
  // the glass itself: colour fringes at the rim, a seat of light round the opening at its heart, a faint sheen and rings of interference
  float ang = atan(q.y, q.x + (abs(q.x) < 1e-5 ? 1e-4 : 0.0));
  float fr = smoothstep(0.845, 0.875, r) * (1.0 - smoothstep(0.955, 0.972, r));
  float shim = 0.55 + 0.45 * sin(ang * 5.0 + uTime * 0.6 + 3.0 * sin(ang * 2.0 - uTime * 0.23));
  col = col * (1.0 - 0.55 * fr) + spectrum((r - 0.86) / 0.1) * (fr * uTube.z * (0.5 + 0.45 * shim + 1.2 * dot(col, vec3(0.3, 0.5, 0.2))));
  float ri = uLensR.w / uLensR.x; float inner = exp(-(r - ri) * (r - ri) * 500.0);
  col += (uStarCol * 0.5 + spectrum(0.5 + 6.0 * (r - ri)) * 0.4) * (inner * uTube.z * 0.3);
  col += uStarCol * (0.012 * uTube.z * (0.5 + 0.5 * sin(r * r * 70.0 - uTime * 0.4)) + 0.03 * uTube.z * exp(-dot(q - vec2(-0.45, 0.5), q - vec2(-0.45, 0.5)) * 9.0));
  // haze in the tube between the eye and the glass
  vec3 oc = uCamL - uCtr; float ra = dot(Vd, uKeyDir), oa = dot(oc, uKeyDir);
  vec3 rp = Vd - uKeyDir * ra, op = oc - uKeyDir * oa;
  float a = max(dot(rp, rp), 1e-5), bb = dot(op, rp), c2 = dot(op, op), sa = sqrt(a);
  float t0 = min(uTube2.x, dist);
  float hz = max(exp(-max(c2 - bb * bb / a, 0.0) / 21.16) * (4.0765 / sa) * (erfL(sa * (dist + bb / a) / 4.6) - erfL(sa * (t0 + bb / a) / 4.6)), 0.0);
  col += uStarCol * (0.06 * uTube.y * (1.0 - exp(-0.0065 * hz)));
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = /* glsl */`
attribute vec4 aK;
uniform mat4 uBone[${NB}]; uniform mat4 uHeroInv; uniform float uSpin; uniform float uShut; uniform float uTime;
uniform vec4 uIrisA; uniform vec3 uIrisC; uniform vec3 uIrisP;      // the iris: the tube's axis and the leaves' swing; a point of the axis; leaf 0's pivot (all in the machine's rest frame)
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec2 vUv; varying vec4 vK;
#include <fog_pars_vertex>
vec3 turnAbout(vec3 v, vec3 a, float ang){ float c = cos(ang), s = sin(ang); return v * c + cross(a, v) * s + a * (dot(a, v) * (1.0 - c)); }
void main(){
  vec3 p = position, n = normal;
  #ifdef SPIN
    float cs = cos(uSpin), sn = sin(uSpin);
    p.xy = vec2(cs * p.x - sn * p.y, sn * p.x + cs * p.y); n.xy = vec2(cs * n.x - sn * n.y, sn * n.x + cs * n.y);
  #endif
  #ifdef SHUT
    // the leaves ride the dome's curve as they part: each point is slid along x as before and kept on a sphere 0.9 m larger than its
    // own distance from the dome's centre, so a leaf stays between the skin (160 m; its skirt 160.4) and the sky in the slit (163.6 m)
    // at every opening: the lip's foot stands about 0.2 m outside the skirt, the boards 0.2 m inside the sky's facets. Slid flat, a
    // leaf stood outside that sky from part way along itself (wholly, past half open), the sky hid it, and sky showed through the
    // closed part of the cut. The slide is no rigid turn, so a normal goes by the slide's own law: a wall of constant x keeps facing
    // along x, a board keeps facing the dome's centre.
    float sr = length(p), sq = max(length(p.yz), 1e-3), sx = p.x + uShut * sign(aK.z - 0.5), sr1 = sr + 0.9, sq1 = sqrt(max(sr1 * sr1 - sx * sx, 1.0));
    vec3 se = vec3(0.0, p.yz / sq); float snr = dot(n, se), sB = sr1 * sq / (sr * sq1), sA = (sr1 * p.x / sr - sx) / sq1;
    n = normalize(vec3(n.x - sA / sB * snr, 0.0, 0.0) + se * (snr / sB) + (n - vec3(n.x, 0.0, 0.0) - se * snr) * (sq / sq1));
    p = vec3(sx, p.yz * (sq1 / sq));
  #endif
  #ifdef ROPE
    float rw = sin(3.14159 * fract(uv.x / ROPE_SPAN)); rw *= rw;
    p.y += sin(uTime * 0.9 + uv.x * 0.031) * 0.5 * rw; p.xz *= 1.0 + sin(uTime * 0.63 + uv.x * 0.017) * 0.002 * rw;
  #endif
  vL = p;
  float bi = aK.x;
  if (bi > ${(NB - 0.5).toFixed(1)}) {
    // a leaf of the iris (all authored as leaf 0): swung in its own plane about its pivot, turned to its place round the axis, then the tube's bone
    float ph = (bi - ${NB.toFixed(1)}) * ${(2 * Math.PI / IRIS_N).toFixed(8)};
    p = uIrisP + turnAbout(p - uIrisP, uIrisA.xyz, uIrisA.w); p = uIrisC + turnAbout(p - uIrisC, uIrisA.xyz, ph);
    n = turnAbout(turnAbout(n, uIrisA.xyz, uIrisA.w), uIrisA.xyz, ph);
    bi = 2.0;
  }
  mat4 bm = uBone[int(bi + 0.5)];
  vec4 lp = bm * vec4(p, 1.0); vec3 ln = mat3(bm) * n;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; ln = mat3(instanceMatrix) * ln;
  #endif
  vec4 wp = modelMatrix * lp; vec3 wn = mat3(modelMatrix) * ln;
  vP = (uHeroInv * wp).xyz; vN = mat3(uHeroInv) * wn;
  vC = color; vUv = uv; vK = aK;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAG = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec2 vUv; varying vec4 vK;
uniform vec2 uRun; uniform vec3 uBrass;
#include <fog_pars_fragment>
${LIGHT}
float aaLine(float d, float w, float aa){ aa = max(aa, 1e-4); return (1.0 - smoothstep(w - aa, w + aa, d)) * min(1.0, w / aa + 0.15); }
float plateRivets(vec2 uv, float PL, float PV, out float seam){
  float su = uv.x / PL; float du = (su - floor(su + 0.5)) * PL;
  vec2 c1 = vec2(abs(du) - 0.5, mod(uv.y, 1.1) - 0.55);
  float row = floor(su); float vv = uv.y + row * PV * 0.37;
  float dv = (fract(vv / PV + 0.5) - 0.5) * PV;
  vec2 c2 = vec2(abs(dv) - 0.5, mod(uv.x, 1.1) - 0.55);
  seam = min(abs(du), abs(dv));
  return min(length(c1), length(c2));
}
float pierShadow(vec3 P){
  vec3 d = uKeyDir; d = mix(d, vec3(1e-4), step(abs(d), vec3(1e-4)));
  vec3 t0 = (vec3(${(PIER_X - 7.5).toFixed(1)}, -60.0, ${(PIER_Z - 15).toFixed(1)}) - P) / d, t1 = (vec3(${(PIER_X + 7.5).toFixed(1)}, 140.0, ${(PIER_Z + 15).toFixed(1)}) - P) / d;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  float tn = max(max(tmin.x, tmin.y), tmin.z), tf = min(min(tmax.x, tmax.y), tmax.z);
  return 1.0 - 0.85 * smoothstep(0.0, 5.0, tf - max(tn, 0.0));
}
// contact shadows on the deck: whoever stands things on the rising floor hands their footprints (A: centre x, z and the cosine and
// sine of the turn; B: half sizes, softness in metres, strength). A soft dark foot under each; none handed, nothing changes.
uniform vec4 uFootA[24]; uniform vec4 uFootB[24]; uniform float uFootN;
float footShade(vec2 q){
  float s = 1.0;
  for (int i = 0; i < 24; i++) {
    if (float(i) >= uFootN) break;
    vec4 a = uFootA[i], b = uFootB[i]; vec2 d = q - a.xy;
    vec2 l = abs(vec2(d.x * a.z - d.y * a.w, d.x * a.w + d.y * a.z)) - b.xy;
    float dist = length(max(l, 0.0)) + min(max(l.x, l.y), 0.0);
    s *= 1.0 - b.w * (1.0 - smoothstep(-0.5 * b.z, b.z, dist));
  }
  return max(s, 0.3);      // (feet that overlap never go to black)
}
// the iris's leaves are lit only where they stand in the lens's cone of light, which the baffles' openings follow (7.5 m at the lowest
// ring, 0.0188 m wider for each metre up the axis): behind their ring, open, they are blackened plate in the dark
float irisLit(vec3 P){ vec3 pa = P - uCtr; float s = dot(pa, uKeyDir); float r = length(pa - uKeyDir * s); float ri = 7.5 + (s + 81.0) * 0.0188; return 1.0 - smoothstep(ri - 0.05, ri + 0.2, r); }
// the painted sky on the dome's boards: the stars dealt to the bay i round the hull (of 48) and m up it (purlin to purlin): k 0 the
// bay's own star (two bays in three have one: a few large, most small), k 1 a lesser one (every other bay). xy: its place off the
// bay's middle (bays across, metres up); z: its radius in metres (0: none); w: how much of its leaf is left
vec4 domeStar(float i, float m, float bayM, float k){ vec3 sid = vec3(mod(i, 48.0), m, 21.0 + 40.0 * k); float mag = hash31(sid); mag *= mag;
  float r = max(min(min(mix(mix(1.3, 5.0, mag), mix(0.9, 2.0, mag), k), 0.27 * bayM), 0.5 * bayM - 0.9), 0.0) * step(mix(0.34, 0.5, k), hash31(sid + 5.0));
  // (no star reaches a rib, 0.8 m to either side of the bay's edge, or a purlin; toward the crown, where the bays narrow, they shrink away)
  return vec4((hash31(sid + 11.0) - 0.5) * 2.0 * max(min(0.44, 0.5 - 0.9 / bayM) - r / bayM, 0.0), (hash31(sid + 17.0) - 0.5) * 2.0 * max(6.2 - r, 0.0), r, 0.55 + 0.45 * hash31(sid + 23.0)); }
// an eight-pointed star of radius sr about the origin of sp (metres on the boards), 1 inside it; saa: metres under a pixel
float domeStarInk(vec2 sp, float sr, float saa){
  float sk = abs(fract(atan(sp.y, sp.x + (abs(sp.x) < 1e-4 ? 2e-4 : 0.0)) * 1.2732395 + 0.5) - 0.5) * 2.0;      // 0 on a point, 1 between two of the eight
  float er = sr * 0.34 / (0.34 + 0.66 * sk);
  return (1.0 - smoothstep(er - saa, er + saa, length(sp))) * min(1.0, sr / (1.6 * saa)) * smoothstep(0.5, 0.9, sr); }
void main(){
  float kind = floor(vK.y + 0.5);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = uCamL - vP; V = V / max(length(V), 1e-3);
  vec3 alb = vC; float metal = 0.0, gloss = 0.25, ao = vK.w, h = 0.0; vec3 emis = vec3(0.0);
  float pixW = max(max(fwidth(vP.x), fwidth(vP.y)), fwidth(vP.z));          // metres per pixel here
  float lodA = 1.0 - smoothstep(0.1, 0.34, pixW), lodB = 1.0 - smoothstep(0.3, 1.0, pixW);   // fine (0.5 m) and middling (2 m) detail
  float n1 = vnoise(vP * 0.31 + vK.z * 7.0), n2 = mix(0.5, vnoise(vP * 2.3 + 3.1), lodA);
  float domeK = smoothstep(${(CY - 12).toFixed(1)}, ${(CY + 2).toFixed(1)}, vP.y);
  float pat = step(-5000.0, vUv.x);
  float fw = max(fwidth(vUv.x), fwidth(vUv.y));
  float near = 1.0 - smoothstep(0.1, 0.45, fw);
  float fwx = fwidth(vUv.x); float fwb = fwidth(vUv.y); float pixR = max(fwidth(vP.x), fwidth(vP.z)); float rimK = 1.0;
  float key = 1.0; float tubeIn = 0.0; float tubeLit = 0.0; float cellIn = 0.0; float cellLobe = 0.0; float cellAng = 0.0;
  float sAxF = fwidth(dot(vP - uCtr, uKeyDir));          // metres of the tube's axis under one pixel
  if (kind < 0.5 || (kind > 2.5 && kind < 3.5)) gTint = 0.72 * (1.0 - step(0.002, abs(vK.z - 0.5625)));      // the observing ladder (the world tags it): timber and iron in their own colours
  float enK = 0.0; vec3 enSet = vec3(0.0); float enA = 1.0;              // the white enamel of the great tube: its plates, and the set of each
  #ifdef SLITWIN
    if (abs(vL.x) > uSlit.x) discard;
    float dustW = 0.7 + 0.6 * vnoise(mix(uCamL, vP, 0.6) * 0.045 + vec3(uTime * 0.06, -uTime * 0.1, uTime * 0.045));
    vec3 air = uStarCol * (uStar * 0.16 * (1.0 - exp(-6.0 * uBeam * beamScatter(vP, gl_FragCoord.xy))));
    air += uStarCol * (uStar * uShaft.x * (1.0 - exp(-0.036 * dustW * shaftScatter(vP))));
    air += uStarCol * (uSlitGlow * (1.0 - smoothstep(0.5, 1.0, abs(vL.x) / max(uSlit.x, 0.5))));     // the first blade of sky: a faint bright seam
    gl_FragColor = vec4(air, 1.0);
  #else
  if (kind < 2.5) {
    // 0 painted iron, 1 brass, 2 white enamel: riveted plate where the part carries plate coordinates
    float albM0 = max(alb.r, max(alb.g, alb.b));
    if (pat > 0.5) {
      float seam; float d = plateRivets(vUv, kind > 1.5 ? 8.5 : 6.5, kind > 1.5 ? 15.7 : 11.0, seam);
      float riv = (1.0 - smoothstep(0.13, 0.25, d)) * near;
      float ring = smoothstep(0.18, 0.26, d) * (1.0 - smoothstep(0.26, 0.42, d)) * near;
      float groove = aaLine(seam, 0.05, fw);
      h = riv * 0.09 - groove * 0.05 * near;
      alb *= 1.0 - 0.2 * ring - 0.28 * groove + 0.05 * riv;
      if (kind > 1.5) {
        // the great tube is plated: from across the hall its seams stay a pixel wide and the rivet rows beside them read as one soft
        // line; every plate has a tone of its own, lies a little proud of its seams and is set a hair off its neighbours, so the gloss
        // breaks from plate to plate
        float prow = floor(vUv.x / 8.5); vec3 pid = vec3(prow, floor((vUv.y + prow * 15.7 * 0.37) / 15.7 + 0.5), 2.0);
        float far = 1.0 - near;
        float grooveF = aaLine(seam, max(0.05, 0.62 * fw), fw);
        float rows = 1.0 - smoothstep(0.55, 1.15, seam);
        alb *= 1.0 - 0.3 * max(grooveF - groove, 0.0) - 0.085 * rows * far;
        alb *= 1.0 + 0.09 * aaLine(abs(seam - max(0.16, 1.5 * fw)), max(0.05, 0.5 * fw), fw);
        float pt = hash31(pid), pc = hash31(pid + 7.3);
        alb *= (0.87 + 0.18 * pt) * mix(vec3(0.965, 0.985, 1.01), vec3(1.01, 0.99, 0.96), pc);      // (hardly a plate brighter than the plain enamel was: the tube throws no more glow on the hall than before it was plated)
        h -= 0.11 * exp(-seam / 0.8);
        enK = 1.0; enSet = (vec3(pc, hash31(pid + 13.1), hash31(pid + 29.7)) - 0.5) * 0.055;
      } else if (kind < 0.5) {
        // painted iron is plated as the tube is: from across the hall its seams stay a pixel wide and the rivet rows beside them read
        // as one soft line; every plate has a tone of its own that ends at its own seams and lies a little proud of them, so a far
        // face of the pier or of the mount still reads as built of plates
        float prow = floor(vUv.x / 6.5); vec3 pid = vec3(prow, floor((vUv.y + prow * 11.0 * 0.37) / 11.0), 0.0);
        float far = 1.0 - near;
        float grooveF = aaLine(seam, max(0.05, 0.62 * fw), fw);
        float rows = 1.0 - smoothstep(0.55, 1.15, seam);
        alb *= 1.0 - 0.28 * max(grooveF - groove, 0.0) - 0.1 * rows * far;
        alb *= 1.0 + 0.12 * aaLine(abs(seam - max(0.16, 1.5 * fw)), max(0.05, 0.5 * fw), fw);
        alb *= 0.84 + 0.26 * hash31(pid);
        h -= 0.08 * exp(-seam / 0.8);
      } else alb *= 0.9 + 0.13 * hash31(vec3(floor(vUv.x / 6.5), floor(vUv.y / 11.0), kind));
    }
    float streak = mix(0.5, vnoise(vec3(vP.x * 1.3, vP.y * 0.11, vP.z * 1.3)), lodB);
    if (kind < 0.5) { gloss = 0.3; alb *= 0.8 + 0.25 * n1 + 0.12 * (streak - 0.5) + 0.06 * (n2 - 0.5); gAmb = mix(uAmbK.y, uAmbK.z * 0.85, domeK); gFill = mix(uAmbK.w, 1.0, domeK); }
    else if (kind < 1.5) { gAmb = mix(0.75, 1.0, domeK); metal = 1.0; gloss = 0.8 - 0.22 * n1; gSpec = 2.4; alb = min(uBrass * (dot(vC, vec3(0.333)) * 3.4) * (0.8 + 0.25 * n1 + 0.2 * (streak - 0.5)), vec3(0.95)); h += (n2 - 0.5) * 0.01;
      // the retaining ring round the lens cell's bore, seen from inside the tube: a glint that wanders round it as stars cross the cell
      float sAx = dot(vP - uCtr, uKeyDir); vec3 qa = vP - uCtr - uKeyDir * sAx; float ra2 = dot(qa, qa);
      float cellK = smoothstep(101.5, 103.0, sAx) * (1.0 - smoothstep(136.0, 146.0, ra2)) * step(sAx, 114.2);
      float ang = atan(qa.y * uKeyDir.z - qa.z * uKeyDir.y, qa.x + (abs(qa.x) < 1e-4 ? 2e-4 : 0.0));
      float lobe = 0.5 + 0.5 * cos(ang * 2.0 - uTime * 0.35); lobe *= lobe; lobe *= lobe;
      emis += tubeRings(sAx, ang) * (0.04 * cellK * uTube.z); tubeIn = cellK; cellIn = cellK; cellLobe = lobe; cellAng = ang; gSpec = 2.4; key *= 1.0 - cellK; gFill *= 1.0 - cellK; }
    else { gloss = 0.78; alb *= 0.86 + 0.13 * n1 + 0.1 * (streak - 0.5); gWrap = 1.0;
      enA = clamp(max(alb.r, max(alb.g, alb.b)) / max(albM0 * 1.04, 1e-3), 0.3, 1.0); }      // (how much of the plain enamel's white this plate, seam or rivet keeps: its own tone, for the knee below)
  } else if (kind < 3.5) {
    // 3 painted timber (ribs, purlins)
    float g = pat > 0.5 ? mix(0.5, vnoise(vec3(vUv.x * 0.35, vUv.y * 5.0, vK.z * 31.0)), lodA) : n2;
    alb *= 0.78 + 0.3 * g + 0.14 * (n1 - 0.5); gloss = 0.2; rimK = mix(1.0, 0.2, domeK); gWrap = 1.0 - domeK;
    gAmb = mix(uAmbK.y, uAmbK.z, domeK); gFill = mix(uAmbK.w, 1.0, domeK);
  } else if (kind < 4.5) {
    alb *= 0.7 + 0.6 * n1; gloss = 0.35; rimK = 0.0; key = 0.0; gFill = 0.0; gAmb = 0.4; tubeIn = 1.0; tubeLit = 1.0;          // 4 blackened interior: lit by the lens from one end and the hall from the other
    if (vK.x > ${(NB - 0.5).toFixed(1)}) {      // a leaf of the iris: the light of its own lip (the ring's own colour and breath, as the lips below reckon it) spills a little way across the plate
      float sI = dot(vP - uCtr, uKeyDir); float rkI = floor((sI + 81.0) / 17.0 + 0.5);
      vec3 lipI = mix(vec3(0.6, 0.76, 1.0), mix(vec3(0.34, 0.6, 1.0), vec3(1.0, 0.66, 0.24), mod(rkI, 2.0)) * 1.25, 0.8 * smoothstep(-70.0, 30.0, sI)) * (uTube2.w * (1.5 + 0.35 * smoothstep(-100.0, 112.0, sI)));
      emis += lipI * ((0.84 + 0.24 * sin(uTime * (0.8 + 0.13 * rkI) + rkI * 2.4) + 0.08 * sin(uTime * 3.1 + rkI)) * 0.2 * exp(-vUv.y / 0.3) * irisLit(vP)) * mix(vec3(1.0), vec3(1.5, 0.74, 0.2), 0.9); }      // the spill takes the bronze of the bay the leaves stand in
    if (pat > 0.5) { float seam; float d = plateRivets(vUv, 8.5, 15.7, seam); float riv = (1.0 - smoothstep(0.13, 0.25, d)) * near; h = riv * 0.12 - aaLine(seam, 0.06, fw) * 0.05 * near; alb *= 1.0 + 1.0 * riv - 0.55 * aaLine(seam, 0.06, fw); alb *= 0.8 + 0.4 * hash31(vec3(floor(vUv.x / 8.5), floor(vUv.y / 15.7), 4.0));
      { float sT = dot(vP - uCtr, uKeyDir); float nb = mod(floor((sT + 81.0) / 17.0), 2.0) * (1.0 - smoothstep(26.0, 54.0, sT - dot(uCamL - uCtr, uKeyDir))) * near;      // the gold bay beside the eye: plate seams with a dark line and a bright edge
        alb *= 1.0 + nb * (1.1 * aaLine(abs(seam - 0.2), 0.07, fw) - 0.35 * aaLine(seam, 0.09, fw) + 0.7 * riv); } }
  } else if (kind < 5.5) {
    float glowK = uLampGlow; vec3 lipC = vC; float lipG = 8.0;                       // 5 lamp glass, baffle lips
    if (vK.z > 0.5) { float sAx = dot(vP - uCtr, uKeyDir); float rk = floor((sAx + 81.0) / 17.0 + 0.5);      // each baffle's rim breathes on its own clock
      glowK = 0.84 + 0.24 * sin(uTime * (0.8 + 0.13 * rk) + rk * 2.4) + 0.08 * sin(uTime * 3.1 + rk);
      float gl = smoothstep(-100.0, 112.0, sAx);
      // pale rings from the tail on; toward the lens they take its two colours in turn
      lipC = mix(vec3(0.6, 0.76, 1.0), mix(vec3(0.34, 0.6, 1.0), vec3(1.0, 0.66, 0.24), mod(rk, 2.0)) * 1.25, 0.8 * smoothstep(-70.0, 30.0, sAx)) * (uTube2.w * (1.5 + 0.35 * gl)); tubeIn = 1.0;
      if (vK.x > ${(NB - 0.5).toFixed(1)}) lipC *= irisLit(vP);      // (a leaf's lip, not a ring's)
      lipG = 1.0 / max(vK.w, 0.05); }
    emis = lipC * (vK.w * lipG) * glowK; alb = vec3(0.02); ao = 1.0;
  } else if (kind < 6.5) {
    metal = 0.85; gloss = 0.5; alb *= 0.8 + 0.4 * n1;           // 6 bright steel
  } else if (kind < 7.5 || (kind > 8.5 && kind < 9.5)) {
    // 7 dome boards (slit cut away), 9 shutter boards
    if (kind < 7.5 && abs(vL.x) < ${SLIT_W.toFixed(1)} && vL.z > ${SLIT_ZMIN.toFixed(1)}) discard;
    vec2 bu = vUv.yx;
    float bw = 2.6; float bi = floor(bu.y / bw); float bf = fract(bu.y / bw);
    float bay = floor(bu.x * 0.5 + 0.5 * mod(bi, 2.0)); float jf = fract(bu.x * 0.5 + 0.5 * mod(bi, 2.0));
    float id = hash31(vec3(bi, bay, 3.0));
    float gap = clamp(aaLine(min(bf, 1.0 - bf) * bw, 0.17, fwx) + aaLine(min(jf, 1.0 - jf), 0.006, fwb * 0.5), 0.0, 1.0);
    float bfade = 1.0 - smoothstep(0.15, 0.6, fwx); rimK = 0.12;
    float grain = mix(0.5, vnoise(vec3(bu.x * 9.0, bu.y * 1.6, id * 40.0)), lodA);
    float panel = hash31(vec3(floor(vUv.y + 0.5), floor(vUv.x / 14.0 + 0.5), 7.0));       // each bay between two ribs and two purlins is its own batch of boards
    float stain = vnoise(vec3(vUv.y * 2.3, vUv.x * 0.05, 5.0)) * 0.6 + vnoise(vec3(vUv.y * 0.7, vUv.x * 0.021, 9.0)) * 0.4;      // weather run down the meridians
    alb *= (1.0 + (0.5 * id - 0.25) * (0.3 + 0.7 * bfade) * (0.35 + 0.65 * lodB)) * (0.9 + 0.2 * grain) * (1.0 - 0.6 * gap * (0.4 + 0.6 * bfade)) * (0.82 + 0.36 * n1);
    alb *= (0.88 + 0.24 * panel) * (0.72 + 0.56 * stain);
    // a painted sky: the boards of dome and shutters are painted a night blue, and in each bay between two ribs and two purlins
    // the dome's boards carry stars in worn gold leaf, dealt by the bay: its own star in two bays of three (a few large, most
    // small) and a lesser one in every other bay, each where the deal sets it between the timbers, each with more or less of its
    // leaf left. It is paint: it takes the light the boards take
    alb *= vec3(0.7, 0.8, 1.06);
    if (kind < 7.5) {
      float sbi = floor(vUv.y + 0.5), smi = floor(vUv.x / 14.0);
      float bayM = 0.1309 * max(length(vL.xz), 1.0);                                  // the bay's width here, metres
      float saa = max(max(fwx, fwb * bayM), 0.03), gilt = 0.0;
      for (int k = 0; k < 2; k++) {
        vec4 st = domeStar(sbi, smi, bayM, float(k));
        gilt = max(gilt, st.w * domeStarInk(vec2((vUv.y - sbi - st.x) * bayM, vUv.x - 14.0 * (smi + 0.5) - st.y), st.z, saa));
      }
      gilt *= (0.62 + 0.38 * vnoise(vec3((vUv.y - sbi) * bayM * 1.1, vUv.x * 1.1, id * 30.0 + sbi))) * (1.0 - 0.45 * gap * bfade);      // leaf worn thin in patches, lost in the joints between boards
      alb = mix(alb, vec3(1.0, 0.76, 0.32) * (0.8 + 0.2 * grain), gilt);
    }
    h = -gap * 0.12 * bfade; gloss = 0.22;
    gAmb = uAmbK.z; gFill = 1.0; gKey = 0.6;
  } else if (kind < 8.5) {
    // 8 the rising floor: radial boards in rings, brass meridian strip, the pier's hole
    vec2 q = vP.xz; vec2 hq = abs(q - uHole.xy) - uHole.zw;
    if (max(hq.x, hq.y) < 0.0) discard;
    float holeD = length(max(hq, 0.0));
    float r = length(q); float ringW = 12.5; float ri = floor(r / ringW); float rf = fract(r / ringW);
    float cnt = max(floor(6.2832 * (ri + 0.5) * ringW / 2.6), 6.0);
    float an = atan(q.y, q.x + (abs(q.x) < 1e-4 ? 3e-4 : 0.0)) / 6.2832 + 0.5; float ai = floor(an * cnt + ri * 0.37); float af = fract(an * cnt + ri * 0.37);
    float id = hash31(vec3(ai, ri, 9.0));
    float pix = pixR;
    float gap = aaLine(min(af, 1.0 - af) * 2.6, 0.08, pix); float ffade = 1.0 - smoothstep(0.15, 0.6, pix); rimK = 0.12;
    float curb = aaLine(min(rf, 1.0 - rf) * ringW, 0.22, pix);
    float grain = mix(0.5, vnoise(vec3(q * mat2(0.8, 0.6, -0.6, 0.8) * vec2(0.5, 5.0) * 0.6, id * 20.0)), lodA);
    alb *= (1.0 + (0.5 * id - 0.25) * (0.3 + 0.7 * ffade) * lodB) * (0.85 + 0.3 * grain) * (1.0 - 0.55 * gap * (0.3 + 0.7 * ffade)) * (0.85 + 0.3 * n1);
    gAmb = uAmbK.x; gFill = uAmbK.w; gKey = uDeckKey; gSoft = 5.0;       // boards take the bar of starlight at part strength: the white tube stays the brightest thing
    alb = mix(alb, vec3(0.05, 0.055, 0.07), curb * 0.8);
    float strip = 1.0 - smoothstep(0.55, 0.75, abs(q.x));
    alb *= 1.0 + 0.16 * (mod(ri, 2.0) - 0.5) * lodB;                      // the rings of boards alternate a tone
    // brass let into the boards: the meridian, a finer east-west line, and an azimuth circle graduated in ticks
    strip = max(strip, (1.0 - smoothstep(0.3, 0.45, abs(q.y))) * 0.85);
    float dr = r - 103.0; float tk = an * 360.0; float tf = abs(fract(tk + 0.5) - 0.5) / 360.0 * 6.2832 * r;
    float t10 = step(abs(fract(tk / 10.0 + 0.5) - 0.5), 0.051);
    float tick = aaLine(tf, 0.11 + 0.09 * t10, pix) * step(0.0, dr) * step(dr, 1.6 + 2.2 * t10);
    strip = max(strip, max(aaLine(abs(dr + 0.6), 0.28, pix), max(aaLine(abs(dr - 4.6), 0.14, pix), tick * ffade)));
    alb = mix(alb, uBrass * 0.9, strip); metal = strip; gloss = mix(0.3, 0.6, strip);
    ao *= 0.35 + 0.65 * smoothstep(0.0, 14.0, holeD);
    h = -gap * 0.08 * ffade; key = pierShadow(vP);
    { float fs = footShade(q); alb *= fs; }      // the astronomers' things stand on the boards: a soft dark foot under each
    { vec3 pdk = vP - uCtr; float hxp = uDomeCS.x * pdk.x - uDomeCS.y * pdk.z; key *= mix(0.45, 1.0, exp(-hxp * hxp / 420.0)); }      // the bar is brightest down its middle: a band, not a floodlit floor
  } else if (kind > 13.5) {
    // 14 a knotted rug (uv 0..1 across and along): ruby border, night-blue field, a pale medallion, small lozenges
    vec2 c = abs(vUv - 0.5) * 2.0; float edge = max(c.x, c.y);
    vec2 g = vUv * vec2(14.0, 22.0); vec2 gf = abs(fract(g) - 0.5);
    float pf = 1.0 - smoothstep(0.012, 0.05, fw);
    float loz = mix(0.3, 1.0 - smoothstep(0.26, 0.3, gf.x + gf.y), pf);
    float med = 1.0 - smoothstep(0.52, 0.56, length((vUv - 0.5) * vec2(1.0, 1.55)) * 2.4 + 0.07 * sin(atan(vUv.y - 0.5, vUv.x - 0.5 + (abs(vUv.x - 0.5) < 1e-4 ? 2e-4 : 0.0)) * 8.0));
    float b1 = step(0.8, edge) * (1.0 - step(0.93, edge)), b2 = step(0.93, edge);
    vec3 field = mix(vec3(0.035, 0.06, 0.16), vec3(0.36, 0.3, 0.18), loz * 0.8);
    field = mix(field, mix(vec3(0.42, 0.37, 0.27), vec3(0.4, 0.045, 0.07), loz), med);
    vec3 border = mix(vec3(0.42, 0.04, 0.07), vec3(0.42, 0.36, 0.24), mix(0.12, step(0.35, gf.x + gf.y) * (1.0 - step(0.42, gf.x + gf.y)), pf));
    alb = mix(field, border, b1); alb = mix(alb, vec3(0.05, 0.07, 0.15), b2);
    float weave = mix(0.5, hash31(vec3(floor(vUv * vec2(140.0, 220.0)), 2.0)), lodA);
    alb *= (0.8 + 0.4 * weave) * (0.85 + 0.3 * n1); gloss = 0.05; rimK = 0.1;
    gAmb = uAmbK.x * 1.3; gFill = uAmbK.w; gKey = uDeckKey; gSoft = 5.0; key = pierShadow(vP);
    { float fs = footShade(vP.xz); alb *= fs; }      // and on a rug, as on the boards
  } else if (kind > 11.5) {
    // 12 brickwork, 13 stone flags (uv in metres: x up the wall or across the floor, y along it)
    vec2 bu = vUv.yx; float big = step(12.5, kind);
    vec2 sz = mix(vec2(2.7, 0.9), vec2(7.2, 6.4), big);
    float row = floor(bu.y / sz.y); float bx = bu.x / sz.x + mix(0.5, 0.37, big) * mod(row, 2.0) + 0.13 * hash31(vec3(row, 2.0, big)) * big;
    float bi = floor(bx); vec2 f = vec2(fract(bx), fract(bu.y / sz.y));
    float id = hash31(vec3(bi, row, 5.0 + big));
    float mort = clamp(aaLine(min(f.x, 1.0 - f.x) * sz.x, 0.09 + 0.05 * big, fwb) + aaLine(min(f.y, 1.0 - f.y) * sz.y, 0.09 + 0.05 * big, fwx), 0.0, 1.0);
    float bfade = 1.0 - smoothstep(0.2, 0.9, fw);
    float damp = vnoise(vec3(vUv.y * 0.045, vUv.x * 0.014, 3.0 + big));
    alb *= (1.0 + (0.56 * id - 0.28) * (0.2 + 0.8 * bfade) * lodB) * (0.8 + 0.32 * n1) * (0.92 + 0.16 * n2 * bfade) * (0.7 + 0.5 * damp);
    alb = mix(alb, vec3(0.3, 0.32, 0.36) * (0.55 + 0.45 * n1), mort * mix(0.7, 0.5, big) * (0.25 + 0.75 * bfade));
    gAmb = uAmbK.y * 0.9; gFill = uAmbK.w; gKey = 0.5;
    h = -mort * 0.1 * bfade + (id - 0.5) * 0.03 * bfade * big; gloss = mix(0.08, 0.3, big); rimK = 0.22;
  } else {
    // 10 hauling rope (laid strands, running), 11 chain (links, travelling)
    rimK = 1.5; gAmb = mix(uAmbK.y, 1.2, domeK); gFill = mix(uAmbK.w, 1.0, domeK);
    if (kind < 10.5) { float s = fract((vUv.x + uRun.x) * 0.55 + vUv.y * 3.0); alb *= 0.55 + 0.75 * smoothstep(0.0, 0.5, s) * (1.0 - smoothstep(0.5, 1.0, s)) * 2.0; gloss = 0.15; }
    else { float s = fract((vUv.x + uRun.y * (vK.z * 2.0 - 1.0)) / 2.4); float lk = smoothstep(0.0, 0.12, s) * (1.0 - smoothstep(0.78, 0.9, s)); alb *= 0.25 + 0.9 * lk; metal = 0.7; gloss = 0.5; }
  }
  // the dome's share of ambient and sky fill falls away from the slit: near-black far from it, the readable slate only round the opening
  float sNear = slitNear(vP); float dk = mix(uDomeK.x, 1.0, sNear);
  bool isSkin = (kind > 6.5 && kind < 7.5) || (kind > 8.5 && kind < 9.5); bool isRib = kind > 2.5 && kind < 3.5 && domeK > 0.5;
  if (isSkin) { gAmb *= dk; gFill *= dk; }
  else if (kind < 0.5 || (kind > 2.5 && kind < 3.5) || (kind > 9.5 && kind < 11.5)) { float dm = mix(1.0, dk, domeK); gAmb *= dm; gFill *= dm; }
  vec3 domeLit = vec3(0.0);
  if (isSkin || isRib) {
    // the dome's timber is lit by the slit as by a long lamp: brightest in the bays beside the opening, falling away round the hull.
    // Ribs and purlins take it on the face that looks at the slit and throw a shadow on the boards behind them.
    vec3 pd = vP - uCtr; vec3 pl = vec3(uDomeCS.x * pd.x - uDomeCS.y * pd.z, pd.y, uDomeCS.y * pd.x + uDomeCS.x * pd.z);
    float sAng = clamp(atan(pl.y, pl.z + (abs(pl.z) < 1e-4 ? 2e-4 : 0.0)), 0.06, 1.72);
    vec3 q = vec3(clamp(pl.x, -uSlit.x, uSlit.x) * 0.7, sin(sAng) * 0.88 * uSlit.w, cos(sAng) * 0.88 * uSlit.w);
    vec3 Ls = q - pl; Ls = Ls / max(length(Ls), 1e-3);
    float ddx = max(abs(pl.x) - uSlit.x, 0.0), ddz = max(uSlit.y - pl.z, 0.0); float dS = sqrt(ddx * ddx + ddz * ddz + 1e-4);
    float G = (0.55 * exp(-dS / 36.0) + 0.45 * exp(-dS / 150.0)) * smoothstep(0.0, 22.0, uSlit.x);
    float rho = max(length(pl.xz), 1.0); float plen = max(length(pl), 1.0);
    vec3 tH = vec3(pl.z, 0.0, -pl.x) / rho; vec3 tM = vec3(-pl.x / rho * pl.y / plen, rho / plen, -pl.z / rho * pl.y / plen);
    float cT = dot(Ls, tH), cM = dot(Ls, tM);
    vec3 cold = uDomeCol * uStar;
    if (isSkin) {
      float sh = 1.0, occ = 1.0, lift = 1.0;
      if (kind < 7.5) {
        float bayW = 0.1309 * rho; float sR = (fract(vUv.y) - 0.5) * bayW;          // metres from the nearest rib
        float sT = -sign(cT) * sR; float wT = min(1.5 + 7.0 * abs(cT), 0.42 * bayW);
        float shT = (1.0 - smoothstep(0.5, 0.8 + wT, sT)) * step(0.0, sT) * min(abs(cT) * 2.2, 1.0);
        float fm = vUv.x / 14.0; fm = (fm - floor(fm + 0.5)) * 14.0;                   // metres from the nearest purlin ring
        float sM = -sign(cM) * fm; float wM = 1.2 + 4.0 * abs(cM);
        float shM = (1.0 - smoothstep(0.4, 0.6 + wM, sM)) * step(0.0, sM) * min(abs(cM) * 2.2, 1.0);
        sh = 1.0 - uDomeL.w * 0.62 * max(shT, shM);
        occ = 1.0 - 0.3 * max(exp(-abs(sR) / 1.3), exp(-abs(fm) / 1.0));
        lift = 1.0 + 0.4 * ((1.0 - step(0.0, sT)) * exp(-abs(sR) / 3.0) * abs(cT) + (1.0 - step(0.0, sM)) * exp(-abs(fm) / 2.5) * abs(cM));
      }
      domeLit = cold * ((uDomeL.x + uDomeL.y * G) * sh * occ * lift); ao *= sh * occ;
    } else {
      vec3 Ng0 = normalize(vN + vec3(0.0, 1e-5, 0.0)); vec3 Nl = vec3(uDomeCS.x * Ng0.x - uDomeCS.y * Ng0.z, Ng0.y, uDomeCS.y * Ng0.x + uDomeCS.x * Ng0.z);
      float nl = dot(Nl, Ls);
      domeLit = cold * (uDomeL.x * mix(0.4, 1.1, smoothstep(-0.4, 0.5, nl)) + uDomeL.y * G * (0.2 + 2.3 * max(nl, 0.0)));
      ao *= mix(0.5, 1.0, smoothstep(-0.3, 0.3, nl));
    }
    domeLit += uDomeWarm * exp(-max(pd.y, 0.0) / 26.0);
  }
  if (kind > 2.5 && kind < 3.5 && pat > 0.5 && domeK > 0.5) {
    // every rib carries a thin rim of starlight on the edge that faces the slit
    float rho = max(length(vL.xz), 1.0); float fi = atan(vL.x, vL.z + (abs(vL.z) < 1e-4 ? 2e-4 : 0.0)) * 7.6394373 - 0.5;
    float lat = (fi - floor(fi + 0.5)) * 0.1308997 * rho;
    float rr = smoothstep(0.1, 0.62, -lat * sign(vL.x));
    emis += uStarCol * (uStar * uDomeK.z * 0.45 * rr * (0.28 + 0.72 * sNear) * smoothstep(0.0, 9.0, uSlit.x));
  }
  #ifdef SPIN
    rimK = max(rimK, 2.4); gAmb = max(gAmb, 1.25); gFill = 1.0; metal *= 0.6;     // the dome's wheels: a starlight rim lifts them off the wall
  #endif
  // frost (winter look): white bloom on what faces up and on fine relief
  float pixP = max(pixR, fwidth(vP.y));
  float fz = mix(0.55, clamp(vnoise(vP * 5.0) * vnoise(vP * 17.0 + 5.0) * 4.0, 0.0, 1.0), 1.0 - smoothstep(0.04, 0.25, pixP));
  float frK = (kind > 3.5 && kind < 5.5) ? 0.0 : uFrost * ((kind > 7.5 && kind < 8.5) ? 0.45 : ((kind > 0.5 && kind < 1.5) || (kind > 5.5 && kind < 6.5)) ? 1.35 : 1.0);      // little on the deck's boards: the room is cold, not snowed in
  float fr = frK * fz * smoothstep(0.36, 0.86, (0.6 * vnoise(vP * 0.21 + 11.0) + 0.4 * vnoise(vP.zxy * 0.57 + 3.0)) * 0.8 + 0.3 * max(N.y, 0.0) + h * 3.0);
  alb = mix(alb, vec3(0.66, 0.74, 0.86), min(fr * 0.75, 1.0)); metal *= 1.0 - min(fr, 1.0) * 0.7; gloss = mix(gloss, 0.3, min(fr, 1.0));
  { vec3 gc = floor(vP * 2.6); float gh = hash31(gc + 17.0);      // glitter: crystals that flash as the eye moves past them
    float gt = 0.5 + 0.5 * sin(uTime * (1.5 + 4.0 * gh) + gh * 60.0 + dot(V, vec3(31.0, 17.0, 23.0))); gt *= gt; gt *= gt;
    emis += vec3(0.6, 0.78, 1.0) * (step(0.9, gh) * gt * min(fr, 1.0) * 2.2 * (1.0 - smoothstep(0.08, 0.3, pixP))); }
  // relief from the height field
  vec3 dpx = dFdx(vP), dpy = dFdy(vP); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 grad = (hx * r1 + hy * r2) * (sign(det) / max(abs(det), 1e-6));
  N = normalize(N - clamp(grad, vec3(-2.0), vec3(2.0)) + enSet + vec3(0.0, 1e-5, 0.0));
  if (tubeLit > 0.5) emis += (alb * uTube2.z + 0.012) * tubeLight(vP, N, normalize(vN + vec3(0.0, 1e-5, 0.0)), V, sAxF);
  if (cellIn > 0.01) {
    // the brass counter-cell under the glass: lit by the lens beside it, with a glint that wanders round as stars cross the cell
    vec3 Lc = uCtr + uKeyDir * 113.0 - vP; Lc = Lc / max(length(Lc), 1e-3);
    float nl = clamp(dot(N, Lc) * 0.7 + 0.3, 0.0, 1.0);
    vec3 Hc = normalize(Lc + V + vec3(0.0, 1e-4, 0.0)); float spc = pow(max(dot(N, Hc), 0.0), 26.0);
    float g1 = max(cos(cellAng - 0.95 + 0.12 * sin(uTime * 0.31)), 0.0), g2 = max(cos(cellAng + 2.25 - 0.1 * sin(uTime * 0.23)), 0.0);
    g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2; g2 *= g2 * g2;
    float gleam = (g1 + 0.6 * g2) * (0.45 + 0.55 * nl);                  // two bright streaks across the turned brass, where the glass throws the sky back on it
    emis += (alb * vec3(1.2, 0.84, 0.5) * (0.03 + 0.34 * nl * (0.22 + 1.6 * cellLobe)) + vec3(1.0, 0.8, 0.5) * (0.5 * spc) + vec3(1.0, 0.9, 0.7) * (1.05 * gleam)) * (cellIn * uTube.z * (0.8 + 0.2 * uGlow));
  }
  emis += alb * domeLit;
  key *= slitMaskS(vP, gSoft) * mix(tubeShadow(vP), 1.0, step(1.5, vK.x));
  gBeam = 1.0 - tubeIn;
  vec3 col = shadeAll(vP, N, V, alb, metal, gloss, ao, key, emis, gl_FragCoord.xy, rimK);
  {
    // the slit mirrored in glossy things. On the white enamel: blue shade on the side turned from the sky, a soft sheen of the sky's
    // colour where the plates look up at it and a long cold highlight down the tube. On brass above the rail: thin blue glints.
    vec3 Rs = reflect(-V, N);
    float sxs = uDomeCS.x * Rs.x - uDomeCS.y * Rs.z, szs = uDomeCS.y * Rs.x + uDomeCS.x * Rs.z;
    float seen = smoothstep(-0.05, 0.25, Rs.y) * smoothstep(-0.35, 0.1, szs + Rs.y * 0.4) * smoothstep(0.0, 22.0, uSlit.x) * key * gBeam;
    float nvs = clamp(1.0 - dot(N, V), 0.0, 1.0); float frs = nvs * nvs; frs *= frs;
    float flk = 1.0 - uFlash.a;
    if (enK > 0.5) {
      float under = smoothstep(0.1, -0.5, dot(N, normalize(vec3(uDomeCS.y * 0.25, 0.97, uDomeCS.x * 0.25))));
      col *= mix(vec3(1.0), vec3(0.6, 0.74, 1.0), 0.85 * under * flk);
      // where the starlight takes the enamel over white, the LIGHT is held on a soft knee and each plate's own tone, its seams and its
      // rivets stay on top of it: the tube is still the brightest thing in the hall and still reads as built of plates. Under the knee
      // nothing changes.
      // (a long shoulder, so the tube keeps its roundness up to its brightest side; and in that light a plate's tone tells a little more)
      { float mb = max(col.r, max(col.g, col.b)), L = mb / enA;
        if (L > 0.5) col *= (0.5 + 0.48 * (1.0 - exp(-(L - 0.5) / 0.48))) * enA / max(mb, 1e-4) * pow(enA, 0.35 * smoothstep(0.5, 1.2, L)); }
      vec3 skyC = mix(uStarCol, vec3(0.4, 0.6, 1.0), 0.45);
      // (the sheen and the highlight fill what room the enamel has left under white and stop there: where the starlight already
      // has it at full white they add nothing, so the tube throws no more glow on the hall than its paint alone)
      vec3 add = (skyC * (0.1 * exp(-sxs * sxs * 7.0)) + mix(uStarCol, vec3(0.86, 0.93, 1.0), 0.5) * (0.3 * exp(-sxs * sxs * 60.0))) * (uStar * seen * flk * (0.7 + 1.5 * frs) * (1.0 - 0.6 * min(fr, 1.0)));
      float room = max(0.97 * min(enA * 1.06, 1.0) - max(col.r, max(col.g, col.b)), 0.0);      // (the room is each plate's own: the sheen does not wash the plates out again)
      col += add * min(room / max(max(add.r, max(add.g, add.b)), 1e-4), 1.0);
    }
    if (kind > 0.5 && kind < 1.5) {
      // brass above the rail keeps its gold: the wide streak of the slit in it is held under white in the metal's own colour (a soft
      // knee on its brightest channel), and the sky lays one thin hard blue line down each turned ring, a faint blue edge beside it
      float up = domeK * gBeam * flk;
      col = mix(col, uBrass * (dot(col, vec3(0.3, 0.55, 0.15)) / max(dot(uBrass, vec3(0.3, 0.55, 0.15)), 1e-3)), 0.6 * up);      // (cold starlight greys brass: give it back the metal's hue at the same brightness)
      float mb = max(col.r, max(col.g, col.b));
      float kn = mb < 0.55 ? mb : 0.55 + 0.37 * (1.0 - exp(-(mb - 0.55) / 0.37));
      col *= mix(1.0, kn / max(mb, 1e-4), up);
      float gk = seen * flk * domeK * (1.0 - 0.6 * min(fr, 1.0));
      col = mix(col, vec3(0.2, 0.46, 1.0) * min(0.42 * uStar, 0.97), min(0.9 * gk * exp(-sxs * sxs * 420.0), 1.0));
      col += vec3(0.16, 0.42, 1.0) * (uStar * gk * 0.07 * frs * smoothstep(0.0, 0.6, N.y + 0.3));
    }
  }
  if (tubeIn > 0.01) { float dz = 0.75 + 0.5 * vnoise(vP * 0.12 + vec3(0.0, -uTime * 0.2, uTime * 0.07)); vec3 hzC = uStarCol;
    if (tubeLit > 0.5) { float sT = dot(vP - uCtr, uKeyDir); float nb = mod(floor((sT + 81.0) / 17.0), 2.0) * (1.0 - smoothstep(26.0, 54.0, sT - dot(uCamL - uCtr, uKeyDir)));
      hzC = mix(uStarCol, vec3(1.2, 0.7, 0.24) * dot(uStarCol, vec3(0.3, 0.55, 0.15)), 0.8 * nb); }
    col += hzC * (tubeIn * 0.6 * uTube.y * (1.0 - exp(-0.0065 * dz * tubeHaze(vP)))); }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #endif
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- geometry builder (typed arrays, one merged mesh per call site)
class Geo {
  constructor(cap = 40000) {
    this.cap = cap; this.nv = 0; this.ni = 0; this.icap = cap * 4;
    this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3);
    this.U = new Float32Array(cap * 2); this.K = new Float32Array(cap * 4); this.I = new Uint32Array(this.icap);
    this.m = new THREE.Matrix4(); this.stack = []; this.bone = 0; this.kind = 0; this.rand = 0; this.col = [0.5, 0.5, 0.5]; this.ao = 1; this.uvOn = false;
  }
  _grow() {
    const g = (a, n) => { const b = new a.constructor(n); b.set(a); return b; };
    this.cap *= 2; this.P = g(this.P, this.cap * 3); this.N = g(this.N, this.cap * 3); this.C = g(this.C, this.cap * 3); this.U = g(this.U, this.cap * 2); this.K = g(this.K, this.cap * 4);
  }
  push() { this.stack.push(this.m.clone()); return this; }
  pop() { this.m.copy(this.stack.pop()); return this; }
  move(x, y, z) { this.m.multiply(_m4.makeTranslation(x, y, z)); return this; }
  rotX(a) { this.m.multiply(_m4.makeRotationX(a)); return this; }
  rotY(a) { this.m.multiply(_m4.makeRotationY(a)); return this; }
  rotZ(a) { this.m.multiply(_m4.makeRotationZ(a)); return this; }
  set(kind, col, k = 1) { this.kind = kind; this.col = [col.r * k, col.g * k, col.b * k]; return this; }
  v(x, y, z, nx, ny, nz, u = -1e4, w = 0, ao = 1) {
    if (this.nv >= this.cap) this._grow();
    const e = this.m.elements, i = this.nv, i3 = i * 3;
    this.P[i3] = e[0] * x + e[4] * y + e[8] * z + e[12]; this.P[i3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; this.P[i3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    let a = e[0] * nx + e[4] * ny + e[8] * nz, b = e[1] * nx + e[5] * ny + e[9] * nz, c = e[2] * nx + e[6] * ny + e[10] * nz;
    const l = Math.hypot(a, b, c) || 1; this.N[i3] = a / l; this.N[i3 + 1] = b / l; this.N[i3 + 2] = c / l;
    this.C[i3] = this.col[0]; this.C[i3 + 1] = this.col[1]; this.C[i3 + 2] = this.col[2];
    this.U[i * 2] = this.uvOn ? u : -1e4; this.U[i * 2 + 1] = w;
    const i4 = i * 4; this.K[i4] = this.bone; this.K[i4 + 1] = this.kind; this.K[i4 + 2] = this.rand; this.K[i4 + 3] = this.ao * ao;
    return this.nv++;
  }
  tri(a, b, c) {
    if (this.ni + 3 > this.icap) { this.icap *= 2; const n = new Uint32Array(this.icap); n.set(this.I); this.I = n; }
    this.I[this.ni++] = a; this.I[this.ni++] = b; this.I[this.ni++] = c;
  }
  // flat polygon (fan), wound to face the normal n; uvs optional [[u,v],...]
  poly(pts, n, uvs, aos) {
    const a = pts[0], b = pts[1], c = pts[2];
    const cx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), cy = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), cz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    const id = [];
    for (let k = 0; k < pts.length; k++) { const p = pts[k]; id.push(this.v(p[0], p[1], p[2], n[0], n[1], n[2], uvs ? uvs[k][0] : -1e4, uvs ? uvs[k][1] : 0, aos ? aos[k] : 1)); }
    for (let k = 1; k < pts.length - 1; k++) { if (flip) this.tri(id[0], id[k + 1], id[k]); else this.tri(id[0], id[k], id[k + 1]); }
  }
  // surface of revolution about local Y. profile: [[r, y, ao?], ...]; o: { inward, smooth, a0, a1, u0, rRef }
  lathe(prof, segs, o = {}) {
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2, inw = o.inward ? -1 : 1, rRef = o.rRef ?? 1, np = prof.length;
    const sn = [];
    for (let i = 0; i < np - 1; i++) { const dr = prof[i + 1][0] - prof[i][0], dy = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dy) || 1; sn.push([dy / l, -dr / l]); }
    const pn = (i, s) => {
      if (!o.smooth) return sn[s];
      const a = sn[Math.max(0, i - 1)], b = sn[Math.min(np - 2, i)]; const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1; return [x / l, y / l];
    };
    let u = o.u0 ?? 0;
    for (let s = 0; s < np - 1; s++) {
      const p = prof[s], q = prof[s + 1], n0 = pn(s, s), n1 = pn(s + 1, s), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const base = this.nv;
      for (let j = 0; j <= segs; j++) {
        const th = a0 + (a1 - a0) * j / segs, sx = Math.sin(th), cz = Math.cos(th);
        this.v(p[0] * sx, p[1], p[0] * cz, n0[0] * sx * inw, n0[1] * inw, n0[0] * cz * inw, u, th * rRef, p[2] ?? 1);
        this.v(q[0] * sx, q[1], q[0] * cz, n1[0] * sx * inw, n1[1] * inw, n1[0] * cz * inw, u + len, th * rRef, q[2] ?? 1);
      }
      for (let j = 0; j < segs; j++) {
        const a = base + j * 2, b = a + 2, c = a + 1, d = a + 3;
        if (inw > 0) { this.tri(a, b, c); this.tri(b, d, c); } else { this.tri(a, c, b); this.tri(b, c, d); }
      }
      u += len;
    }
    return this;
  }
  // chamfered box centred on the local origin
  box(hx, hy, hz, bev = 0) {
    const h = [hx, hy, hz], b = Math.min(bev, hx * 0.45, hy * 0.45, hz * 0.45);
    const fv = (a, sa, b1, sb, c, sc) => { const p = [0, 0, 0]; p[a] = sa * h[a]; p[b1] = sb * (h[b1] - b); p[c] = sc * (h[c] - b); return p; };
    const uvq = (a, pts) => (this.uvOn ? pts.map((p) => [p[a === 1 ? 0 : 1] + 60, p[a === 2 ? 0 : 2] + 60]) : null);
    for (let a = 0; a < 3; a++) {
      const b1 = (a + 1) % 3, c = (a + 2) % 3;
      for (const sa of [-1, 1]) {
        const n = [0, 0, 0]; n[a] = sa;
        const pts = [fv(a, sa, b1, -1, c, -1), fv(a, sa, b1, 1, c, -1), fv(a, sa, b1, 1, c, 1), fv(a, sa, b1, -1, c, 1)];
        this.poly(pts, n, uvq(a, pts));
        if (b > 0) for (const sb of [-1, 1]) {
          const ne = [0, 0, 0]; ne[a] = sa * 0.7071; ne[b1] = sb * 0.7071;
          this.poly([fv(a, sa, b1, sb, c, -1), fv(a, sa, b1, sb, c, 1), fv(b1, sb, c, 1, a, sa), fv(b1, sb, c, -1, a, sa)], ne);
        }
      }
    }
    if (b > 0) for (const sa of [-1, 1]) for (const sb of [-1, 1]) for (const sc of [-1, 1])
      this.poly([fv(0, sa, 1, sb, 2, sc), fv(1, sb, 2, sc, 0, sa), fv(2, sc, 0, sa, 1, sb)], [sa * 0.577, sb * 0.577, sc * 0.577]);
    return this;
  }
  // round bar swept along points; rad: number or (t)=>number; uv: u = metres along (+u0), v = turn 0..1
  tube(pts, rad, sides = 6, o = {}) {
    const n = pts.length, closed = !!o.closed; let u = o.u0 ?? 0;
    const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion();
    const P = (i) => pts[(i + n) % n];
    const tan = (i, out) => { const a = closed ? P(i - 1) : pts[Math.max(0, i - 1)], b = closed ? P(i + 1) : pts[Math.min(n - 1, i + 1)]; return out.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); };
    tan(0, T); Nn.set(0, 1, 0); if (Math.abs(T.y) > 0.9) Nn.set(1, 0, 0); Nn.addScaledVector(T, -Nn.dot(T)).normalize();
    const rows = closed ? n + 1 : n, base = this.nv, uvWas = this.uvOn, ends = []; this.uvOn = true;
    for (let i = 0; i < rows; i++) {
      const p = P(i);
      if (i > 0) { prevT.copy(T); tan(i, T); q.setFromUnitVectors(prevT, T); Nn.applyQuaternion(q); const a = P(i - 1); u += Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]); }
      B.crossVectors(T, Nn);
      const r = typeof rad === 'function' ? rad(i / (rows - 1)) : rad;
      // an open bar's end ring, for its cap (not on a rope or a chain, kinds 10 and 11: a flat lid there would take one value of the running strands and blink)
      const ring = !closed && (i === 0 || i === rows - 1) && (this.kind < 9.5 || this.kind > 11.5) ? [] : null;
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), nx = Nn.x * c + B.x * s, ny = Nn.y * c + B.y * s, nz = Nn.z * c + B.z * s;
        this.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, u, j / sides, p[3] ?? 1);
        if (ring && j < sides) ring.push([p[0] + nx * r, p[1] + ny * r, p[2] + nz * r]);
      }
      if (ring) ends.push([ring, i ? [T.x, T.y, T.z] : [-T.x, -T.y, -T.z], p[3] ?? 1]);
    }
    this.uvOn = uvWas;
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < sides; j++) {
      const a = base + i * (sides + 1) + j, b = a + 1, c = a + sides + 1, d = c + 1;
      this.tri(a, b, c); this.tri(b, d, c);      // wound to face out, as the bar's normals do
    }
    for (const [ring, nrm, ao] of ends) this.poly(ring, nrm, null, ring.map(() => ao));      // a flat cap on each end of an open bar: no solid bar's end is a hole
    return this;
  }
  ball(r, segs = 16, rings = 10) { const pr = []; for (let i = 0; i <= rings; i++) { const a = i / rings * Math.PI; pr.push([r * Math.sin(a) + 1e-4, -r * Math.cos(a)]); } return this.lathe(pr, segs, { smooth: true }); }
  torus(Rr, r, segs = 32, sides = 8) { const pr = []; for (let i = 0; i <= sides; i++) { const a = i / sides * Math.PI * 2; pr.push([Rr + r * Math.cos(a), r * Math.sin(a)]); } return this.lathe(pr, segs, { smooth: true }); }
  build() {
    const g = new THREE.BufferGeometry(), n = this.nv;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(this.U.slice(0, n * 2), 2));
    g.setAttribute('aK', new THREE.BufferAttribute(this.K.slice(0, n * 4), 4));
    g.setIndex(new THREE.BufferAttribute(this.I.slice(0, this.ni), 1));
    return g;
  }
}
const _m4 = new THREE.Matrix4();

// spur / bevel gear in the local XY plane, axis Z. o: { toothH, ri (rim inner), hub, spokes, cone (scale of the +z face) }
function gear(g, ro, teeth, th, o = {}) {
  const tH = o.toothH ?? ro * 0.09, rr = ro - tH, ri = o.ri ?? rr * 0.82, k = o.cone ?? 1, hz = th / 2, n = teeth * 4;
  const fr = [0.0, 0.2, 0.5, 0.7], rad = [rr, ro, ro, rr];
  const out = [], inn = [];
  for (let t = 0; t < teeth; t++) for (let q = 0; q < 4; q++) {
    const a = (t + fr[q]) / teeth * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    out.push([c * rad[q], s * rad[q]]); inn.push([c * ri, s * ri]);
  }
  for (let i = 0; i < n; i++) {
    const a = out[i], b = out[(i + 1) % n], ia = inn[i], ib = inn[(i + 1) % n];
    const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
    g.poly([[a[0], a[1], -hz], [b[0], b[1], -hz], [b[0] * k, b[1] * k, hz], [a[0] * k, a[1] * k, hz]], [ey / l, -ex / l, 0]);
    g.poly([[a[0] * k, a[1] * k, hz], [b[0] * k, b[1] * k, hz], [ib[0] * k, ib[1] * k, hz], [ia[0] * k, ia[1] * k, hz]], [0, 0, 1]);
    g.poly([[a[0], a[1], -hz], [b[0], b[1], -hz], [ib[0], ib[1], -hz], [ia[0], ia[1], -hz]], [0, 0, -1]);
    if ((i & 1) === 0) { const ic = inn[(i + 2) % n]; g.poly([[ia[0], ia[1], -hz], [ic[0], ic[1], -hz], [ic[0] * k, ic[1] * k, hz], [ia[0] * k, ia[1] * k, hz]], [-(ia[0] + ic[0]) / (2 * ri), -(ia[1] + ic[1]) / (2 * ri), 0]); }
  }
  const hub = o.hub ?? ro * 0.2, sp = o.spokes ?? 6;
  g.push().rotX(Math.PI / 2);
  if (k === 1) {
    const a = ri * 0.99, b = Math.min(ri * 1.07, rr * 0.985), sg = Math.min(48, teeth);
    g.lathe([[b, hz], [b, hz * 1.4], [a, hz * 1.4], [a, hz]], sg); g.lathe([[a, -hz], [a, -hz * 1.4], [b, -hz * 1.4], [b, -hz]], sg);
  }
  g.lathe([[hub * 0.45, -hz * 1.5], [hub, -hz * 1.5], [hub, hz * 1.5], [hub * 0.45, hz * 1.5]], 14);
  g.pop();
  for (let i = 0; i < sp; i++) {
    g.push().rotZ((i + 0.5) / sp * Math.PI * 2).move((hub + ri) / 2, 0, 0);
    g.box((ri - hub) / 2 + 0.05, Math.min(ro * 0.07, hub * 0.5), hz * 0.55, hz * 0.2);
    g.pop();
  }
}

const DEFAULT_PALETTE = ['#0A1020', '#3A4B66', '#EEF2F6', '#A9C6F2', '#D8263A', '#3FBF7A', '#B08A4A'];
const ease = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * t * (t * (t * 6 - 15) + 10); };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-refractor-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const tick = async () => { if (ctx.yield) await ctx.yield(); };
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  // ---- per-seed cast
  const fittingsRoll = rng.chance(0.5) ? 'brass' : 'nickel', fittings = opts.fittings ?? fittingsRoll;
  const domeTurn = (opts.domeTurn ?? (rng.chance(0.5) ? 30 : -30)) * Math.PI / 180;
  const parkHA = rng.range(14, 24) * Math.PI / 180, parkEl = rng.range(76, 84) * Math.PI / 180;
  const nWeights = rng.int(3, 5), nBalls = rng.chance(0.65) ? 2 : 3, hwSpokes = rng.pick([6, 8]), finderLen = rng.range(26, 34);
  const hueShift = rng.range(-0.07, 0.06), enamelWarm = rng.range(-1, 1), teethA = rng.int(26, 34), teethB = rng.int(44, 60);
  const starLow = opts.starLow ?? 0.85, starHigh = opts.star ?? 1.65;

  const brassCol = fittings === 'nickel' ? new THREE.Color('#828b92') : pal[6].clone();
  // the dome's paint is a warm grey: under the blue starlight and the night's ambient it lands on the brief's blue-grey
  // without going cobalt; the ribs are a tone darker than the boards so the frame reads as shade, not as bright lines
  const domeHue = pal[1].clone().offsetHSL(hueShift * 0.5, -0.06, 0).multiplyScalar(3.1);
  const domePaint = domeHue.clone().lerp(new THREE.Color(0.243, 0.245, 0.21), 0.6);
  const ribPaint = domeHue.clone().lerp(new THREE.Color(0.243, 0.245, 0.21), 0.6).multiplyScalar(0.74);
  const ironDome = domeHue.clone().lerp(new THREE.Color(0.2, 0.2, 0.19), 0.75).multiplyScalar(0.75);
  const pierPaint = new THREE.Color('#9aa3ad').lerp(pal[1], 0.18);
  const enamel = pal[2].clone().multiplyScalar(0.66); enamel.r *= 1 + 0.03 * enamelWarm; enamel.b *= 1 - 0.03 * enamelWarm;
  const black = new THREE.Color(0.03, 0.033, 0.043), steel = new THREE.Color(0.42, 0.45, 0.5), brassV = new THREE.Color(0.46, 0.46, 0.46);
  const ruby = pal[4].clone(), green = pal[5].clone(), starC = pal[3].clone();

  // ---- the shared uniform block
  const bones = []; for (let i = 0; i < NB; i++) bones.push(new THREE.Matrix4());
  const lampPos = [], lampCol = []; for (let i = 0; i < 8; i++) { lampPos.push(new THREE.Vector4(0, -999, 0, 1)); lampCol.push(new THREE.Vector3()); }
  const U = {
    uBone: { value: bones }, uHeroInv: { value: new THREE.Matrix4() }, uSpin: { value: 0 }, uShut: { value: 0 },
    uCtr: { value: new THREE.Vector3(0, CY, 0) }, uSlit: { value: new THREE.Vector4(SLIT_W, SLIT_ZMIN, 2.2, R) }, uDomeCS: { value: new THREE.Vector2(1, 0) },
    uKeyDir: { value: new THREE.Vector3(0, DY, DZ) }, uStarCol: { value: new THREE.Vector3(starC.r, starC.g, starC.b) }, uStar: { value: starHigh },
    uAmbSky: { value: new THREE.Vector3(0.23, 0.27, 0.36) }, uAmbGnd: { value: new THREE.Vector3(0.075, 0.082, 0.12) },
    uLampPos: { value: lampPos }, uLampCol: { value: lampCol },
    uTubeA: { value: new THREE.Vector3() }, uTubeB: { value: new THREE.Vector3() }, uTubeR: { value: 10.8 },
    uFlash: { value: new THREE.Vector4(0.25, 1.0, 0.45, 0) }, uFrost: { value: opts.frost ?? 0 }, uBeam: { value: opts.beam ?? 0.0009 },
    uTime: { value: 0 }, uCamL: { value: new THREE.Vector3() }, uFill: { value: opts.fill ?? 0.2 }, uRim: { value: opts.rim ?? 0.55 }, uGlow: { value: 1 }, uLampGlow: { value: 1 }, uCloudK: { value: opts.cloud ?? 0 },
    uHole: { value: new THREE.Vector4(PIER_X, PIER_Z, 11.5, 20.5) }, uRun: { value: new THREE.Vector2() },
    uFootA: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uFootB: { value: Array.from({ length: 24 }, () => new THREE.Vector4(1, 1, 1, 0)) }, uFootN: { value: 0 },      // footprints of what stands on the deck (the world's to fill)
    uAmbK: { value: new THREE.Vector4(0.3, 0.4, 1, 0.3) },          // ambient share: deck, walls and ironwork, dome; w = share of the slit's sky fill below the dome
    uRing: { value: new THREE.Vector4(116, -999, 38, 12) }, uRingCol: { value: new THREE.Vector3() },   // the floor's ring of lanterns: radius, height, reach, count
    uBrass: { value: new THREE.Vector3(brassCol.r, brassCol.g, brassCol.b) },
    uShaft: { value: new THREE.Vector4(opts.shaft ?? 0, opts.shaftRadius ?? 16, -150, 158) }, uDomeK: { value: new THREE.Vector3(opts.domeDark ?? 0.16, opts.domeFall ?? 42, opts.ribRim ?? 0.2) },
    uDomeL: { value: new THREE.Vector4(opts.domeBase ?? 0.17, opts.domeSlit ?? 0.32, 0, opts.domeShadow ?? 1) }, uDomeWarm: { value: new THREE.Vector3() }, uDomeCol: { value: new THREE.Vector3(starC.r, starC.g, starC.b) },
    uSlitGlow: { value: 0 }, uDeckKey: { value: opts.deckKey ?? 0.36 },
    uTube: { value: new THREE.Vector4(1, 1, 1, 1) },                  // inside the tube: lens light on wall and lips, haze, the lens's own gain, the hall's light through the tail
    uIrisA: { value: new THREE.Vector4(0, 1, 0, 0) }, uIrisC: { value: new THREE.Vector3() }, uIrisP: { value: new THREE.Vector3() },      // the iris (set once the tube's frame is known; w is the leaves' swing, 0 open)
    uTube2: { value: new THREE.Vector4(0, 0.5, 5.2, 0.55) },               // haze starts this far from the eye, the wall light's floor at the tail, its gain, the baffle lips' gain
    uRing2: { value: new THREE.Vector4(R - 1.8, 58, opts.sconceReach ?? 36, 12) }, uRing2Col: { value: new THREE.Vector3() }, uWarm: { value: new THREE.Vector3() },
    uWin: { value: new THREE.Vector4(R - 0.8, 80, 36, 24) }, uWinCol: { value: new THREE.Vector3() }, uBounce: { value: new THREE.Vector4(0, 0, 0, 0) },   // the world's shuttered windows (radius, height, reach, count) and the lamp light thrown up off the deck (rgb, deck height)
  };
  const LENS_R = 11.0, PORTAL_R = opts.portalRadius ?? 6;
  const lensU = { uCtr: U.uCtr, uKeyDir: U.uKeyDir, uCamL: U.uCamL, uTime: U.uTime, uTube: U.uTube, uTube2: U.uTube2, uStarCol: U.uStarCol, uStar: U.uStar,
    uLensLook: { value: new THREE.Vector4(1, 1, 0, 0) }, uLensLook2: { value: new THREE.Vector4(0, 0, 0, 0) }, uLensR: { value: new THREE.Vector4(LENS_R, 1, 0, PORTAL_R + 0.25) } };
  const BEAM_STEPS = Math.max(4, Math.round(8 * detail));
  const materials = [];
  const mkMat = (defines = {}, extra = {}) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...(extra.uniforms || {}) },
      vertexShader: VERT, fragmentShader: FRAG, vertexColors: true, fog: extra.fog ?? true, defines: { BEAM_STEPS, ...defines },
    });
    if (extra.additive) { m.transparent = true; m.blending = THREE.AdditiveBlending; m.depthWrite = false; }
    materials.push(m); return m;
  };
  const matMain = mkMat(), matShut = mkMat({ SHUT: '' });
  const matWheel = mkMat({ SPIN: '' }, { uniforms: { uSpin: { value: 0 } } });
  const matWin = mkMat({ SLITWIN: '' }, { additive: true, fog: false });

  const object = new THREE.Group(); object.name = 'great-refractor';
  const dome = new THREE.Group(); dome.position.y = CY; object.add(dome);
  const addMesh = (parent, geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; parent.add(m); return m; };
  const inSlit = (x, z, pad = 1.5) => Math.abs(x) < SLIT_W + pad && z > SLIT_ZMIN - pad;
  const sph = (th, ph, r) => [r * Math.sin(th) * Math.sin(ph), r * Math.cos(th), r * Math.sin(th) * Math.cos(ph)];

  // =============================================================== DOME (dome-local: origin at the dome centre)
  {
    // boarded skin: inner face of the hemisphere plus a short skirt behind the wheels
    const g = new Geo(8000); g.uvOn = true; g.set(7, domePaint);
    const pr = []; for (let i = 0; i <= 26; i++) { const e = i / 26 * (Math.PI / 2 - 0.004); pr.push([R * Math.cos(e), R * Math.sin(e)]); }
    g.lathe(pr, 96, { inward: true, smooth: true, rRef: 48 / (Math.PI * 2) });
    g.uvOn = false; g.set(0, ironDome, 0.5); g.lathe([[R + 0.4, -7.5], [R + 0.4, 0]], 96, { inward: true });
    addMesh(dome, g.build(), matMain, 'skin');
  }
  await tick();
  const aEnd = Math.PI / 2 + Math.asin((-SLIT_ZMIN + 3) / R);
  {
    // twin shutters: boarded shells outside the skin, battens on their inner faces; they slide apart in the vertex shader
    const g = new Geo(6000), Rs = R + 2.2, rows = 34, cols = 5, half = SLIT_W + 2.5;
    for (const s of [-1, 1]) {
      g.rand = s > 0 ? 1 : 0;
      const pt = (ix, a, lift = 0) => { const x = s * half * ix / cols, rho = Math.sqrt(Rs * Rs - x * x) - lift; return [x, rho * Math.sin(a), rho * Math.cos(a)]; };
      const al = (j) => -0.03 + (aEnd + 0.03) * j / rows;
      g.uvOn = true; g.set(9, domePaint, 0.92);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const p = [pt(i, al(j)), pt(i + 1, al(j)), pt(i + 1, al(j + 1)), pt(i, al(j + 1))], c = pt(i + 0.5, al(j + 0.5));
        const uv = [[al(j) * Rs, p[0][0] * 0.1], [al(j) * Rs, p[1][0] * 0.1], [al(j + 1) * Rs, p[2][0] * 0.1], [al(j + 1) * Rs, p[3][0] * 0.1]];
        g.poly(p, [-c[0] / Rs, -c[1] / Rs, -c[2] / Rs], uv);
      }
      // meeting edge and battens
      g.uvOn = false; g.set(3, ribPaint, 0.9);
      for (let j = 0; j < rows; j++) {
        const a0 = al(j), a1 = al(j + 1);
        g.poly([pt(0, a0), pt(0, a1), pt(0, a1, 2.4), pt(0, a0, 2.4)], [-s, 0, 0]);
        g.poly([pt(0, a0, 2.4), pt(0, a1, 2.4), pt(0.35, a1, 2.4), pt(0.35, a0, 2.4)], [0, -Math.sin((a0 + a1) / 2), -Math.cos((a0 + a1) / 2)]);
        g.poly([pt(0.35, a0, 2.4), pt(0.35, a1, 2.4), pt(0.35, a1), pt(0.35, a0)], [s, 0, 0]);
        if (j % 3 === 1) {
          const am = (a0 + a1) / 2, d = 0.006, n1 = [0, -Math.sin(am - 0.5), -Math.cos(am - 0.5)], n2 = [0, -Math.sin(am + 0.5), -Math.cos(am + 0.5)];
          for (let i = 0; i < cols; i++) {
            g.poly([pt(i, am - d), pt(i + 1, am - d), pt(i + 1, am, 1.1), pt(i, am, 1.1)], n1);
            g.poly([pt(i, am, 1.1), pt(i + 1, am, 1.1), pt(i + 1, am + d), pt(i, am + d)], n2);
          }
        }
      }
    }
    addMesh(dome, g.build(), matShut, 'shutters');
    // the slit's own patch of air: starlight scattered on rays that leave through the opening
    const w = new Geo(600); w.rand = 0.5;
    for (let j = 0; j < 20; j++) for (let i = -3; i < 3; i++) {
      const pt = (ix, jj) => { const x = SLIT_W * ix / 3, a = aEnd * jj / 20, rho = Math.sqrt((R + 1) * (R + 1) - x * x); return [x, rho * Math.sin(a), rho * Math.cos(a)]; };
      const c = pt(i + 0.5, j + 0.5);
      w.poly([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], [-c[0] / R, -c[1] / R, -c[2] / R]);
    }
    const win = addMesh(dome, w.build(), matWin, 'slit-air'); win.renderOrder = 5;
  }
  await tick();
  {
    // ribs, purlins, slit curbs, base ring, wheel forks, shutter chains: one mesh that turns with the dome
    const g = new Geo(60000);
    const NR = 48, RSEG = 18, th0 = 0.05;
    // a rib or a purlin ends INSIDE a curb or the cross beam: each face of it is cut at the upright planes 1.4 m outside the cut (the
    // middle of a curb's 2 m; 1.4 m behind the head of the cut, inside the beam), so its end is a plane cut hidden in the heavier
    // member (at the beam all but its top 0.15 m, which stands in the slot between the beam's top and the skin, out of sight from
    // the hall). A face with no corner inside those planes goes in as it was. Kept or dropped whole by its middle, as they were,
    // ribs and purlins stood up to 1.9 m into the 112 m cut or stopped up to 2.8 m short of a curb.
    const XP = SLIT_W + 1.4, ZP = SLIT_ZMIN - 1.4;
    const clipTo = (P, f) => {      // the part of polygon P (points [x, y, z, u, v, ao]) where f is not negative
      const out = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
        if (fa >= 0) out.push(a);
        if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push(a.map((v, q) => v + (b[q] - v) * t)); }
      }
      return out;
    };
    const polyOut = (pts, n, uvs, aos) => {
      if (!pts.some((p) => inSlit(p[0], p[2], 1.4))) { g.poly(pts, n, uvs, aos); return; }
      const P = pts.map((p, q) => [p[0], p[1], p[2], uvs ? uvs[q][0] : 0, uvs ? uvs[q][1] : 0, aos ? aos[q] : 1]), N = clipTo(P, (p) => p[2] - ZP);
      for (const part of [clipTo(P, (p) => ZP - p[2]), clipTo(N, (p) => p[0] - XP), clipTo(N, (p) => -XP - p[0])]) {
        if (part.length >= 3) g.poly(part, n, uvs ? part.map((p) => [p[3], p[4]]) : null, part.map((p) => p[5]));
      }
    };
    for (let i = 0; i < NR; i++) {
      const ph = (i + 0.5) / NR * Math.PI * 2, tx = Math.cos(ph), tz = -Math.sin(ph), hw = 0.8;
      g.rand = rng(); g.set(3, ribPaint, 0.85 + 0.3 * g.rand); g.uvOn = true;
      for (let k = 0; k < RSEG; k++) {
        const a = th0 + (Math.PI / 2 - th0) * k / RSEG, b = th0 + (Math.PI / 2 - th0) * (k + 1) / RSEG, m = sph((a + b) / 2, ph, 1);
        const pa = sph(a, ph, R - 3.6), pb = sph(b, ph, R - 3.6), qa = sph(a, ph, R - 0.05), qb = sph(b, ph, R - 0.05), ua = a * R, ub = b * R;
        const off = (p, s) => [p[0] + tx * hw * s, p[1], p[2] + tz * hw * s];
        polyOut([off(pa, -1), off(pa, 1), off(pb, 1), off(pb, -1)], [-m[0], -m[1], -m[2]], [[ua, 0], [ua, 1.6], [ub, 1.6], [ub, 0]]);
        for (const s of [-1, 1]) polyOut([off(pa, s), off(qa, s), off(qb, s), off(pb, s)], [tx * s, 0, tz * s], [[ua, 0], [ua, 3.6], [ub, 3.6], [ub, 0]], [1, 0.45, 0.45, 1]);
      }
      if ((i & 7) === 7) await tick();
    }
    // purlin rings every 14 m of arc
    g.uvOn = false;
    for (let k = 1; k <= 17; k++) {
      const th = Math.PI / 2 - k * 14 / R, dth = 0.65 / R, S = 96; g.rand = rng(); g.set(3, ribPaint, 0.7 + 0.2 * g.rand);
      for (let j = 0; j < S; j++) {
        const p0 = j / S * Math.PI * 2, p1 = (j + 1) / S * Math.PI * 2, m = sph(th, (p0 + p1) / 2, R);
        const ri = R - 2.2, ro = R - 0.05;
        const A = sph(th - dth, p0, ri), B = sph(th - dth, p1, ri), C = sph(th + dth, p1, ri), D = sph(th + dth, p0, ri);
        const A2 = sph(th - dth, p0, ro), B2 = sph(th - dth, p1, ro), C2 = sph(th + dth, p1, ro), D2 = sph(th + dth, p0, ro);
        const up = [-Math.cos(th) * m[0] / (R * Math.sin(th) + 1e-6), Math.sin(th), -Math.cos(th) * m[2] / (R * Math.sin(th) + 1e-6)];
        polyOut([A, B, C, D], [-m[0] / R, -m[1] / R, -m[2] / R]);
        polyOut([A, B, B2, A2], up, null, [1, 1, 0.45, 0.45]);
        polyOut([D, C, C2, D2], [-up[0], -up[1], -up[2]], null, [1, 1, 0.45, 0.45]);
      }
      if ((k & 3) === 3) await tick();
    }
    // slit curbs (heavier arcs each side of the opening) and the cross beam past the crown
    g.set(3, ribPaint, 1.15); g.rand = 0.3;
    for (const s of [-1, 1]) {
      const x0 = s * (SLIT_W + 0.4), x1 = s * (SLIT_W + 2.4), N = 40;
      const pt = (x, a, d) => { const rho = Math.sqrt(R * R - x * x) - d; return [x, rho * Math.sin(a), rho * Math.cos(a)]; };
      for (let j = 0; j < N; j++) {
        const a = aEnd * j / N, b = aEnd * (j + 1) / N, am = (a + b) / 2, ni = [0, -Math.sin(am), -Math.cos(am)];
        g.poly([pt(x0, a, 4.2), pt(x1, a, 4.2), pt(x1, b, 4.2), pt(x0, b, 4.2)], ni);
        g.poly([pt(x0, a, 4.2), pt(x0, b, 4.2), pt(x0, b, 0), pt(x0, a, 0)], [-s, 0, 0], null, [1, 1, 0.5, 0.5]);
        g.poly([pt(x1, a, 4.2), pt(x1, b, 4.2), pt(x1, b, 0), pt(x1, a, 0)], [s, 0, 0], null, [1, 1, 0.5, 0.5]);
      }
    }
    {
      // the cross beam follows the skin: a bent beam of the old section (2.6 m along the shell, from 0.2 to 4.6 m under it), its centre
      // line 2 m behind the head of the cut all the way out past both curbs. The straight box it was left the shell 39 m out: its
      // ends stood outside the skin, where the leaves ride.
      const N = 24, X = SLIT_W + 3, zc = SLIT_ZMIN - 2;
      const pt = (x, w, d) => { const rho = Math.sqrt(R * R - x * x), a = Math.acos(zc / rho) + w / rho; return [x, (rho - d) * Math.sin(a), (rho - d) * Math.cos(a)]; };
      for (let j = 0; j < N; j++) {
        const xa = -X + 2 * X * j / N, xb = -X + 2 * X * (j + 1) / N, xm = (xa + xb) / 2, rm = Math.sqrt(R * R - xm * xm), am = Math.acos(zc / rm);
        for (const d of [4.6, 0.2]) { const k = d > 1 ? -1 : 1; g.poly([pt(xa, -1.3, d), pt(xb, -1.3, d), pt(xb, 1.3, d), pt(xa, 1.3, d)], [k * xm / R, k * rm / R * Math.sin(am), k * rm / R * Math.cos(am)]); }
        for (const w of [-1.3, 1.3]) g.poly([pt(xa, w, 4.6), pt(xb, w, 4.6), pt(xb, w, 0.2), pt(xa, w, 0.2)], [0, Math.sign(w) * Math.cos(am), -Math.sign(w) * Math.sin(am)], null, [1, 1, 0.5, 0.5]);
      }
      for (const s of [-1, 1]) g.poly([pt(s * X, -1.3, 4.6), pt(s * X, 1.3, 4.6), pt(s * X, 1.3, 0.2), pt(s * X, -1.3, 0.2)], [s, 0, 0], null, [1, 1, 0.5, 0.5]);
    }
    await tick();
    // base ring girder (riveted iron) and the 36 wheel forks
    g.uvOn = true; g.set(0, ironDome, 1.9); g.rand = 0.6;
    g.lathe([[R, 1.8], [R - 4.2, 1.8], [R - 4.2, 0.9], [R - 1.6, 0.7], [R - 1.6, -0.5], [R - 4.2, -0.7], [R - 4.2, -1.5], [R, -1.5]], 96, { rRef: R - 3 });
    g.uvOn = false;
    for (let i = 0; i < 36; i++) {
      const ph = (i + 0.75) / 36 * Math.PI * 2;
      g.push().rotY(ph).move(0, 0, R - 3);
      g.set(0, ironDome, 1.7);
      for (const s of [-1, 1]) { g.push().move(0, -2.9, s * 1.05); g.box(0.55, 1.7, 0.16, 0.06); g.pop(); }
      g.push().move(0, -1.75, 0); g.box(2.6, 0.3, 1.3, 0.1); g.pop();
      g.set(6, steel, 0.9); g.push().move(0, -3.6, 0).rotX(Math.PI / 2); g.lathe([[0.3, -1.45], [0.45, -1.35], [0.45, 1.35], [0.3, 1.45]], 8); g.pop();
      g.pop();
      if ((i & 15) === 15) await tick();
    }
    // the shutter chains: two strands across the foot of the slit, travelling opposite ways, to a sheave 10 m outside the cut each side
    const chainA = Math.asin((SLIT_W + 10) / (R - 5.4));
    for (const up of [0, 1]) {
      const pts = []; for (let j = 0; j <= 28; j++) { const a = (j / 28 - 0.5) * 2 * chainA; pts.push([Math.sin(a) * (R - 5.4), 3.0 + up * 1.0 + 0.25 * Math.cos(j / 28 * Math.PI * 2 * 3) * (up ? 0.3 : 1), Math.cos(a) * (R - 5.4)]); }
      g.rand = up; g.set(11, steel, 0.8); g.tube(pts, 0.3, 5);
    }
    g.set(1, brassV); g.rand = 0.4;
    for (const s of [-1, 1]) { const a = s * chainA; g.push().move(Math.sin(a) * (R - 5.4), 3.5, Math.cos(a) * (R - 5.4)).rotY(a).rotX(Math.PI / 2); g.lathe([[0.3, -0.5], [1.5, -0.4], [1.2, 0], [1.5, 0.4], [0.3, 0.5]], 14); g.pop(); }
    await tick();      // the frame's arrays are copied in one go: give the page a turn first
    addMesh(dome, g.build(), matMain, 'dome-frame');
  }
  await tick();
  let wheelMesh;
  {
    // 36 flanged wheels, 5 m across; they spin in the vertex shader as the dome turns
    const g = new Geo(1200); g.set(6, steel, 1.1); g.rand = 0.2;
    g.push().rotX(Math.PI / 2);
    g.lathe([[2.05, -0.45], [2.5, -0.45], [2.5, 0.25], [2.78, 0.3], [2.78, 0.55], [2.05, 0.55], [2.05, -0.45]], 20);
    g.set(1, brassV, 1.0); g.lathe([[0.01, -0.95], [0.5, -0.85], [0.85, -0.6], [0.85, 0.7], [0.5, 0.85]], 10);
    g.pop();
    g.set(0, ironDome, 2.0);
    for (let i = 0; i < 6; i++) { g.push().rotZ(i / 6 * Math.PI * 2).move(1.4, 0, 0.05); g.box(0.72, 0.26, 0.2, 0.06); g.pop(); }
    wheelMesh = new THREE.InstancedMesh(g.build(), matWheel, 36); wheelMesh.name = 'wheels'; wheelMesh.frustumCulled = false;
    const m = new THREE.Matrix4();
    for (let i = 0; i < 36; i++) { const ph = (i + 0.75) / 36 * Math.PI * 2; m.makeRotationY(ph).multiply(_m4.makeTranslation(0, -3.6, R - 3)); wheelMesh.setMatrixAt(i, m); }
    dome.add(wheelMesh);
  }
  await tick();

  // =============================================================== THE MACHINE (hero-local; rigid bones move its parts)
  const M = new Geo(90000);
  const lampList = [];           // { pos:[x,y,z], color } safelights that belong to the piece
  const lantern = (G, x, y, z, nx, nz, rides = false) => {
    // a small ruby safelight on an iron bracket
    G.push().move(x, y, z); G.uvOn = false;
    G.set(0, pierPaint, 0.5); G.push().move(-nx * 0.5, 0, -nz * 0.5); G.box(0.25 + Math.abs(nx) * 0.5, 0.18, 0.25 + Math.abs(nz) * 0.5, 0.05); G.pop();
    G.push().move(nx * 0.4, -0.2, nz * 0.4);
    G.set(1, brassV); G.lathe([[0.1, 0], [0.75, 0.1], [0.75, 0.3], [0.5, 0.42]], 10); G.lathe([[0.5, 1.9], [0.8, 2.0], [0.55, 2.4], [0.12, 2.75], [0.01, 2.8]], 10);
    G.set(5, ruby, 1); G.ao = 0.75; G.rand = 0; G.lathe([[0.5, 0.42], [0.62, 1.15], [0.5, 1.9]], 10, { smooth: true }); G.ao = 1;
    G.pop(); G.pop();
    lampList.push({ pos: [x + nx * 0.4, y + 1.0, z + nz * 0.4], color: ruby, rides });
  };
  {
    // the still ring on the wall head: curb, rail, rope sheaves
    M.bone = 0; M.rand = 0.5; M.uvOn = true; M.set(0, pierPaint, 0.8);
    M.lathe([[R, CY - 7.2], [R - 7, CY - 7.2], [R - 7, CY - 8.6], [R - 6, CY - 9.6], [R - 6, CY - 13], [R - 4.8, CY - 14.2], [R - 0.2, CY - 14.2]], 96, { rRef: R - 6 });
    M.uvOn = false; M.set(6, steel, 0.95);
    M.lathe([[R - 2.55, CY - 7.2], [R - 2.55, CY - 6.5], [R - 2.7, CY - 6.1], [R - 3.3, CY - 6.1], [R - 3.45, CY - 6.5], [R - 3.45, CY - 7.2]], 96);
    for (let i = 0; i < 24; i++) {
      const ph = (i + 0.5) / 24 * Math.PI * 2;
      M.push().rotY(ph).move(0, CY - 17, R - 2);
      M.set(0, pierPaint, 0.5); M.push().move(0, 1.6, 0); M.box(0.35, 1.3, 0.35, 0.08); M.pop();
      M.push().move(0, 0.2, 1.1); M.box(0.3, 0.3, 1.1, 0.08); M.pop();
      M.set(1, brassV); M.lathe([[0.25, -0.5], [1.5, -0.42], [1.5, -0.3], [1.15, 0], [1.5, 0.3], [1.5, 0.42], [0.25, 0.5]], 14);
      M.pop();
    }
  }
  await tick();
  let ropeMesh;
  {
    // the endless hauling rope, sagging between its sheaves; strands run and the bights sway in the shader
    const g = new Geo(2200), pts = [], rr = R - 3.5, span = 2 * Math.PI * rr / 24;
    for (let i = 0; i < 24; i++) for (let k = 0; k < 6; k++) { const f = k / 6, ph = (i + 0.5 + f) / 24 * Math.PI * 2; pts.push([Math.sin(ph) * rr, CY - 17 - 4 * f * (1 - f) * 1.3, Math.cos(ph) * rr]); }
    g.set(10, new THREE.Color('#8f8468'), 0.6); g.rand = 0.3; g.tube(pts, 0.45, 5, { closed: true });
    ropeMesh = addMesh(object, g.build(), mkMat({ ROPE: '', ROPE_SPAN: span.toFixed(3) }), 'rope');
  }
  await tick();
  // ---- pier: tapered, chamfered, riveted iron with belt courses under brass beads, braced bays, a ladder and the head casting
  const pierHalf = (y) => { const t = Math.min(1, Math.max(0, y / 140)); return [9 - 3 * t, 18 - 6 * t]; };
  const pierRing = (y, out = 0, ch = 1.1) => { const [hx, hz] = pierHalf(y), a = hx + out, b = hz + out; return [[a - ch, b], [a, b - ch], [a, -b + ch], [a - ch, -b], [-a + ch, -b], [-a, -b + ch], [-a, b - ch], [-a + ch, b]].map((p) => [PIER_X + p[0], y, PIER_Z + p[1]]); };
  const ringBand = (y0, y1, o0, o1, uv) => {
    const A = pierRing(y0, o0), B = pierRing(y1, o1); let run = 0;
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8, ex = A[j][0] - A[i][0], ez = A[j][2] - A[i][2], l = Math.hypot(ex, ez), sl = (o0 - o1 + (pierHalf(y0)[0] - pierHalf(y1)[0])) / Math.max(y1 - y0, 0.01);
      const n = [-ez / l, sl, ex / l], nl = Math.hypot(n[0], n[1], n[2]);
      M.poly([A[i], A[j], B[j], B[i]], [n[0] / nl, n[1] / nl, n[2] / nl], uv ? [[y0, run], [y0, run + l], [y1, run + l], [y1, run]] : null);
      run += l;
    }
  };
  {
    M.bone = 0; M.rand = 0.15; M.uvOn = true; M.set(0, pierPaint, 1);
    const belts = [-70, 0, 28, 52, 84, 112, 136];
    for (let i = 0; i < belts.length - 1; i++) ringBand(belts[i] + (i ? 1.6 : 0), belts[i + 1], 0, 0, true);
    M.uvOn = false; M.set(0, pierPaint, 1.12);
    for (let i = 1; i < belts.length - 1; i++) { const y = belts[i]; ringBand(y - 0.5, y, 0, 0.7); ringBand(y, y + 1.1, 0.7, 0.7); ringBand(y + 1.1, y + 1.6, 0.7, 0); }
    ringBand(136, 137, 0, 1.4); ringBand(137, 139.2, 1.4, 1.4); ringBand(139.2, 140, 1.4, 0.2);
    // a brass bead round every belt course and round the head, standing a hand proud of the iron
    M.set(1, brassV, 0.95);
    const bead = (y, o) => { ringBand(y, y + 0.07, o, o + 0.1); ringBand(y + 0.07, y + 0.37, o + 0.1, o + 0.1); ringBand(y + 0.37, y + 0.44, o + 0.1, o); };
    for (let i = 1; i < belts.length - 1; i++) bead(belts[i] + 0.33, 0.7);
    bead(138.45, 1.4);
    // the bare bays above the floor are braced: a St Andrew's cross of two flat bars standing proud of the plates, with an iron ring and
    // a brass boss where they cross, on the east face in every such bay and on the west and north faces in the bays the clock case and
    // the dial leave free (the south face keeps its ladder and its lantern)
    const brace = (e, y0, y1, turn) => {
      const A = pierRing(y0), B = pierRing(y1), j = (e + 1) % 8, sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
      const P = (s, t) => mix3(mix3(A[e], A[j], s), mix3(B[e], B[j], s), t);
      let n = unit(cross(sub(A[j], A[e]), sub(B[e], A[e]))); if (n[0] * (A[e][0] + A[j][0] - 2 * PIER_X) + n[2] * (A[e][2] + A[j][2] - 2 * PIER_Z) < 0) n = [-n[0], -n[1], -n[2]];
      const ms = 1.2 / Math.hypot(A[j][0] - A[e][0], A[j][2] - A[e][2]), mt = 1.2 / (y1 - y0);
      M.set(0, pierPaint, 1.16);
      [[P(ms, mt), P(1 - ms, 1 - mt), 0.4], [P(1 - ms, mt), P(ms, 1 - mt), 0.38]].forEach(([p0, p1, h]) => {
        const d = unit(sub(p1, p0)), sd = unit(cross(n, d)), w = 0.8, at = (p, k, up) => [p[0] + sd[0] * k + n[0] * up, p[1] + sd[1] * k + n[1] * up, p[2] + sd[2] * k + n[2] * up];
        M.poly([at(p0, -w, h), at(p1, -w, h), at(p1, w, h), at(p0, w, h)], n);
        M.poly([at(p0, -w, 0), at(p1, -w, 0), at(p1, -w, h), at(p0, -w, h)], [-sd[0], -sd[1], -sd[2]]);
        M.poly([at(p0, w, 0), at(p1, w, 0), at(p1, w, h), at(p0, w, h)], sd);
        M.poly([at(p0, -w, 0), at(p0, w, 0), at(p0, w, h), at(p0, -w, h)], [-d[0], -d[1], -d[2]]);
        M.poly([at(p1, -w, 0), at(p1, w, 0), at(p1, w, h), at(p1, -w, h)], d);
      });
      const c = P(0.5, 0.5);
      M.push().move(c[0], c[1], c[2]); turn();
      M.lathe([[2.5, -0.15], [2.5, 0.45], [2.2, 0.62], [1.7, 0.62], [1.55, 0.48]], 24);
      M.set(1, brassV, 0.95); M.lathe([[1.55, 0.44], [1.4, 0.7], [0.8, 0.92], [0.01, 0.98]], 16);
      M.pop();
    };
    for (let i = 1; i < belts.length - 1; i++) {
      const y0 = belts[i] + 1.6, y1 = belts[i + 1] - (i < belts.length - 2 ? 0.5 : 0);
      brace(1, y0, y1, () => M.rotZ(-Math.PI / 2 + Math.atan(3 / 140)));      // each boss stands square to its leaning face
      if (belts[i] !== 52) { brace(5, y0, y1, () => M.rotZ(Math.PI / 2 - Math.atan(3 / 140))); brace(3, y0, y1, () => M.rotX(-Math.PI / 2 + Math.atan(6 / 140))); }
    }
    M.set(0, pierPaint, 1.12);
    M.push().move(PIER_X, 140, PIER_Z); M.poly([[-6.4, 0, -12.4], [6.4, 0, -12.4], [6.4, 0, 12.4], [-6.4, 0, 12.4]], [0, 1, 0]); M.pop();
    // ladder up the south face
    const zf = (y) => PIER_Z + pierHalf(y)[1] + 1.3;
    for (const s of [-1, 1]) { const pts = []; for (let y = 0; y <= 140; y += 14) pts.push([PIER_X + s * 1.5, y, zf(y)]); M.set(6, steel, 0.6); M.tube(pts, 0.24, 5); }
    for (let y = 2; y < 139; y += 3.4) { M.tube([[PIER_X - 1.5, y, zf(y)], [PIER_X + 1.5, y, zf(y)]], 0.17, 4); if (Math.round(y / 3.4) % 5 === 0) for (const s of [-1, 1]) M.tube([[PIER_X + s * 1.5, y, zf(y)], [PIER_X + s * 1.5, y, zf(y) - 1.3]], 0.14, 4); }
  }
  // ---- the observer's dial on the pier's north face, toward the observing chair and the eyepiece: ruby glass lit from behind, a brass
  // bezel, twelve bars and forty-eight ticks without numerals, three black hands (bones 20 to 22) that update() turns by the piece's
  // clock, the seconds hand a step a second. It glows like the safelights and throws no light (the rig's eight slots stay as they are).
  const DIAL_Y = 68, DIAL_R = 4.7, DIAL_TILT = Math.atan(6 / 140);
  const dial = { C: new THREE.Vector3(PIER_X, DIAL_Y, PIER_Z - pierHalf(DIAL_Y)[1]), ax: new THREE.Vector3(0, -Math.sin(DIAL_TILT), Math.cos(DIAL_TILT)), t0: 6720 };      // 1 h 52 min 0 s at the world's clock 0: its seconds agree with the desk chronometer's
  {
    M.bone = 0; M.uvOn = false; M.rand = 0.3;
    M.push().move(dial.C.x, dial.C.y, dial.C.z).rotX(-Math.PI / 2 + DIAL_TILT);      // local +y stands out of the face, +z runs up it, -x is to the right of someone facing it
    M.set(1, brassV, 1.05); M.lathe([[DIAL_R + 0.75, 0], [DIAL_R + 0.75, 0.45], [DIAL_R + 0.55, 0.7], [DIAL_R + 0.25, 0.7], [DIAL_R, 0.5], [DIAL_R, 0.3]], 48);
    M.lathe([[0.55, 0.3], [0.55, 0.86], [0.35, 0.96], [0.01, 0.96]], 12);
    M.set(5, ruby, 1); M.ao = 0.085; M.rand = 0; M.lathe([[DIAL_R, 0.3, 0.35], [DIAL_R * 0.72, 0.3, 0.55], [DIAL_R * 0.36, 0.3, 0.82], [0.01, 0.3, 1]], 48); M.ao = 1;
    M.set(0, black); M.rand = 0.2;
    for (let k = 0; k < 60; k++) { const big = k % 5 === 0, w = big ? 0.09 : 0.04, z0 = big ? 3.75 : 4.1; M.push().rotY(k / 60 * Math.PI * 2); M.poly([[-w, 0.42, z0], [w, 0.42, z0], [w, 0.42, 4.5], [-w, 0.42, 4.5]], [0, 1, 0]); M.pop(); }      // flat plates: sixty ticks, every fifth longer
    const hand = (y, tail, w0, wm, zm, tip) => { M.poly([[0, y, -tail], [-w0, y, 0], [w0, y, 0]], [0, 1, 0]); M.poly([[-w0, y, 0], [-wm, y, zm], [0, y, tip], [wm, y, zm], [w0, y, 0]], [0, 1, 0]); };
    M.bone = 20; hand(0.5, 0.7, 0.16, 0.34, 1.9, 2.8);            // the hour hand, a spade
    M.bone = 21; hand(0.62, 0.9, 0.13, 0.07, 3.6, 4.15);          // the minute hand, a long taper
    M.bone = 22; M.poly([[-0.035, 0.77, -1.2], [0.035, 0.77, -1.2], [0.035, 0.77, 4.3], [-0.035, 0.77, 4.3]], [0, 1, 0]); M.push().move(0, 0.74, -0.85); M.lathe([[0.3, 0.03], [0.01, 0.03]], 10); M.pop();      // the seconds hand, a needle with a small round tail
    M.bone = 0; M.pop();
  }
  await tick();
  // ---- the driving clock in its open-fronted case on the pier's west face
  const ZC = PIER_Z, YF = 52, XB = -30.4, XG = -38, ZG = ZC + 5.8;
  const clock = { spindle: [XG, 0, ZG], g1: [0, YF + 5.2, ZG], g2: [0, YF + 9.9, ZC - 0.8], g3: [0, YF + 12.1, ZC - 9.0], worm: [-35.5, 0, ZC - 9.0], sector: [0, YF + 21, ZC + 0.5], hinge: [], armLen: 4.0 };
  {
    M.bone = 0; M.uvOn = false; M.rand = 0.7;
    // case: back panel, floor, roof with cornice, side cheeks, corner posts, brackets
    // (the back panel and the roof are built of riveted plates, a tone to each, as the pier's own faces are: they carry plate coordinates)
    M.uvOn = true; M.set(0, pal[1], 1.1); M.push().move(XB - 0.15, YF + 15, ZC); M.box(0.15, 15, 12, 0.05); M.pop();
    M.uvOn = false; M.set(0, pierPaint, 0.9);
    M.push().move(XB - 6.8, YF - 0.5, ZC); M.box(6.8, 0.5, 12.4, 0.2); M.pop();
    M.uvOn = true;
    M.push().move(XB - 6.9, YF + 30.6, ZC); M.box(7.1, 0.6, 12.8, 0.25); M.pop();
    M.push().move(XB - 7.0, YF + 31.6, ZC); M.box(7.5, 0.4, 13.3, 0.2); M.pop();
    M.uvOn = false;
    for (const s of [-1, 1]) {
      M.set(0, pierPaint, 0.8); M.push().move(XB - 1.7, YF + 15, ZC + s * 12.1); M.box(1.7, 15, 0.3, 0.12); M.pop();
      M.set(1, brassV); M.push().move(XB - 13.2, YF, ZC + s * 12.0); M.lathe([[0.5, 0], [0.5, 0.5], [0.3, 0.8], [0.3, 29.2], [0.5, 29.5], [0.5, 30]], 8); M.pop();
      M.set(0, pierPaint, 0.75); M.push().move(XB - 3.4, YF - 2.6, ZC + s * 9); M.rotZ(0.55); M.box(3.6, 0.35, 0.3, 0.1); M.pop();
    }
    M.set(1, brassV); M.push().move(XB - 13.4, YF + 0.7, ZC); M.rotX(Math.PI / 2); M.lathe([[0.22, -12], [0.22, 12]], 6); M.pop();
    // governor pedestal (static) and spindle (bone 5) with bevel A
    M.set(1, brassV); M.push().move(XG, YF, ZG); M.lathe([[2.2, 0], [2.2, 0.5], [1.5, 0.9], [1.1, 1.6], [1.1, 2.0]], 16); M.pop();
    M.bone = 5; M.push().move(XG, YF, ZG);
    M.lathe([[0.42, 2.0], [0.42, 12.2], [0.7, 12.5], [0.95, 13.6], [0.95, 14.4], [1.25, 14.5], [1.25, 15.1], [0.5, 15.4], [0.4, 17.2], [0.7, 17.5], [0.5, 18.2], [0.01, 18.4]], 12);
    M.lathe([[0.85, 7.2], [1.15, 7.4], [1.15, 8.6], [0.85, 8.8]], 12);
    M.push().move(0, 3.2, 0).rotX(-Math.PI / 2); gear(M, 2.4, 24, 0.7, { cone: 0.82, hub: 0.9, spokes: 4, toothH: 0.3 }); M.pop();
    M.pop();
    await tick();
    // governor arms and balls (bones 6..8): built hanging straight down from hinges on the collar
    for (let i = 0; i < nBalls; i++) {
      const a = i / nBalls * Math.PI * 2, hx = XG + Math.cos(a) * 0.95, hz = ZG + Math.sin(a) * 0.95, hy = YF + 14.8;
      clock.hinge.push([hx, hy, hz, a]); M.bone = 6 + i;
      M.set(6, steel, 0.8); M.tube([[hx, hy, hz], [hx, hy - clock.armLen + 1.2, hz]], 0.2, 6);
      M.set(1, brassV, 1.15); M.push().move(hx, hy - clock.armLen, hz); M.ball(1.8, 18, 12); M.lathe([[0.45, 1.6], [0.45, 2.1], [0.3, 2.2]], 8); M.pop();
    }
    // gear train on arbors that point out of the pier (bones 9, 10, 14), winding drum, ropes and weights (bone 12)
    const arbor = (c, x0, x1, r) => { M.set(6, steel, 0.7); M.push().move((x0 + x1) / 2, c[1], c[2]).rotZ(Math.PI / 2); M.lathe([[r, -(x0 - x1) / 2], [r, (x0 - x1) / 2], [0.01, (x0 - x1) / 2 + 0.3]], 8); M.pop(); };
    M.bone = 9; arbor(clock.g1, XB, XG + 2.3, 0.4);
    M.set(1, brassV, 1.05); M.push().move(XB - 1.1, clock.g1[1], clock.g1[2]).rotY(Math.PI / 2); gear(M, 1.9, Math.round(teethA / 2), 0.8, { hub: 0.7, spokes: 4, toothH: 0.34 }); M.pop();
    M.push().move(XG + 2.4, clock.g1[1], clock.g1[2]).rotY(-Math.PI / 2); gear(M, 2.0, 20, 0.7, { cone: 0.8, hub: 0.8, spokes: 4, toothH: 0.3 }); M.pop();
    M.bone = 10; arbor(clock.g2, XB, XB - 4.2, 0.5);
    M.set(1, brassV, 0.95); M.push().move(XB - 1.1, clock.g2[1], clock.g2[2]).rotY(Math.PI / 2); gear(M, 6.5, teethB, 0.8, { hub: 1.2, spokes: 6, toothH: 0.36, ri: 5.4 }); M.pop();
    M.set(6, steel, 0.55); M.push().move(XB - 2.9, clock.g2[1], clock.g2[2]).rotZ(Math.PI / 2); M.lathe([[2.3, -1.1], [2.3, -0.95], [2.0, -0.9], [2.0, 0.9], [2.3, 0.95], [2.3, 1.1]], 16); M.pop();
    M.bone = 14; arbor(clock.g3, XB, XB - 2.4, 0.35);
    M.set(1, brassV, 1.1); M.push().move(XB - 1.1, clock.g3[1], clock.g3[2]).rotY(Math.PI / 2); gear(M, 2.0, 16, 0.8, { hub: 0.7, spokes: 4, toothH: 0.34 }); M.pop();
    for (let i = 0; i < 2; i++) {
      const z = clock.g2[2] + (i ? 2.0 : -2.0), x = XB - 2.5 - i * 0.8, yTop = 44;
      M.bone = 15; M.set(6, steel, 0.5); M.tube([[x, yTop, z], [x, YF + 9.9, z]], 0.16, 4);
      M.bone = 12; M.set(0, new THREE.Color(0.1, 0.105, 0.12)); M.push().move(x, yTop - 5, z); M.lathe([[0.01, 5.3], [0.35, 5.2], [0.5, 4.6], [0.95, 4.4], [1.0, 0.3], [0.8, 0], [0.01, 0]], 12); M.pop();
    }
    await tick();
    // worm (bone 11): a real helix so its turning shows; the sector (bone 13) it drives; the drive rod up the pier
    M.bone = 11; M.set(6, steel, 0.8); M.push().move(clock.worm[0], YF, clock.worm[2]);
    M.lathe([[0.45, 12.5], [0.45, 26.5], [0.01, 26.8]], 8); M.lathe([[0.8, 16.4], [0.8, 16.9], [0.45, 17.1]], 8);
    { const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60, a = t * Math.PI * 2 * 5; pts.push([Math.cos(a) * 0.95, 17.4 + t * 7.2, Math.sin(a) * 0.95]); } M.set(1, brassV, 1.1); M.tube(pts, 0.42, 5); }
    M.pop();
    M.bone = 0; M.set(0, pierPaint, 0.8);
    for (const y of [YF + 13.2, YF + 26]) { M.push().move((XB + clock.worm[0]) / 2, y, clock.worm[2]); M.box((XB - clock.worm[0]) / 2 + 0.6, 0.35, 0.7, 0.12); M.pop(); }
    M.push().move((XB + clock.worm[0]) / 2 - 0.3, clock.sector[1], clock.sector[2]); M.box((XB - clock.worm[0]) / 2 + 0.9, 0.5, 0.5, 0.15); M.pop();
    M.bone = 13; M.set(1, brassV, 1.0); M.push().move(clock.worm[0], clock.sector[1], clock.sector[2]).rotY(Math.PI / 2);
    {
      // toothed arc: axis = local Z (world X); teeth on the rim toward -z of the world (local +x after rotY)
      const r0 = 7.9, r1 = 8.6, hz = 0.35, n = 44, a0 = -0.66, a1 = 0.66;
      for (let k = 0; k < n; k++) {
        const a = a0 + (a1 - a0) * k / n, b = a0 + (a1 - a0) * (k + 1) / n, rt = r1 + (k & 1 ? 0.32 : 0);
        const P = (r, an, z) => [Math.cos(an) * r, Math.sin(an) * r, z];
        M.poly([P(r0, a, hz), P(rt, a, hz), P(rt, b, hz), P(r0, b, hz)], [0, 0, 1]); M.poly([P(r0, a, -hz), P(rt, a, -hz), P(rt, b, -hz), P(r0, b, -hz)], [0, 0, -1]);
        M.poly([P(rt, a, -hz), P(rt, b, -hz), P(rt, b, hz), P(rt, a, hz)], [Math.cos((a + b) / 2), Math.sin((a + b) / 2), 0]);
        M.poly([P(r0, a, -hz), P(r0, b, -hz), P(r0, b, hz), P(r0, a, hz)], [-Math.cos((a + b) / 2), -Math.sin((a + b) / 2), 0]);
        if (k > 0) { const rp = r1 + (k & 1 ? 0 : 0.32); M.poly([P(r1, a, -hz), P(r1 + 0.32, a, -hz), P(r1 + 0.32, a, hz), P(r1, a, hz)], [k & 1 ? -Math.sin(a) : Math.sin(a), k & 1 ? Math.cos(a) : -Math.cos(a), 0]); void rp; }
      }
      for (const a of [a0 + 0.04, 0, a1 - 0.04]) { M.push().rotZ(a).move(4.2, 0, 0); M.box(3.9, 0.32, 0.22, 0.08); M.pop(); }
      M.push().rotX(Math.PI / 2); M.lathe([[0.4, -0.9], [1.1, -0.7], [1.1, 0.7], [0.4, 0.9]], 12); M.pop();
    }
    M.pop();
    M.bone = 0; M.set(6, steel, 0.6);
    { const pts = []; for (let y = YF + 32; y <= 136; y += 13) pts.push([PIER_X - pierHalf(y)[0] - 1.2, y, ZC - 9]); M.tube(pts, 0.28, 5); }
    for (let y = YF + 40.7; y < 134; y += 13) { M.push().move(PIER_X - pierHalf(y)[0] - 0.6, y, ZC - 9); M.box(0.7, 0.3, 0.45, 0.1); M.pop(); }      // (each bracket stands on the plate clear of the braces' bars)
    lantern(M, XB - 13.3, YF + 20, ZC - 12.0, -1, 0); lantern(M, XB - 6, YF + 27.4, ZC + 4, 0, 0); lantern(M, PIER_X + 2.5, 96, PIER_Z + pierHalf(96)[1] + 0.9, 0, 1);
  }
  await tick();
  // graduated setting circle, 14 m across, in a frame whose +Y is its face normal
  const settingCircle = (r) => {
    M.set(1, brassV, 1.1); M.lathe([[r - 1.5, 0], [r, 0], [r, 0.5], [r - 1.5, 0.5], [r - 1.5, 0]], 48);
    for (let i = 0; i < 4; i++) { M.push().rotY(i / 4 * Math.PI * 2 + 0.4).move((r - 1.5 + 1.2) / 2, 0.25, 0); M.box((r - 1.5 - 1.2) / 2 + 0.1, 0.18, 0.3, 0.08); M.pop(); }
    M.lathe([[1.3, 0], [1.3, 0.8], [0.7, 1.2], [0.01, 1.25]], 12);
    M.set(6, new THREE.Color(0.05, 0.055, 0.07));
    for (let i = 0; i < 72; i++) { const len = i % 6 === 0 ? 1.1 : (i % 2 === 0 ? 0.7 : 0.42); M.push().rotY(i / 72 * Math.PI * 2).move(r - 0.12 - len / 2, 0.52, 0); M.box(len / 2, 0.03, 0.055, 0); M.pop(); }
  };
  // ---- the mount: head casting (static), polar housing and declination axis with counterweights (bone 1), hour circle (bone 4)
  {
    M.bone = 0; M.uvOn = false; M.rand = 0.35; M.set(0, pierPaint, 0.92);
    M.push().move(PIER_X, 141.0, -15.2); M.box(5.6, 1.0, 3.2, 0.3); M.pop();
    M.push().move(PIER_X, 143.6, -1.2); M.box(5.2, 3.6, 2.6, 0.4); M.pop();
    for (const s of [-1, 1]) { M.push().move(PIER_X + s * 4.4, 142.4, -7.6).rotX(-0.5); M.box(0.35, 0.5, 5.6, 0.12); M.pop(); }
    M.push().move(PIER_X, CY, 0).rotX(Math.PI / 3);
    M.push().move(0, -9.5, 6.3); M.box(3.8, 8.6, 0.5, 0.2); M.pop();
    M.bone = 1; M.uvOn = true; M.set(0, pierPaint, 1.0);
    M.lathe([[3.6, -20], [5.4, -19.2], [5.4, -16.5], [4.9, -16], [4.9, -6.5], [6.2, -6], [6.2, 6], [5, 6.8], [3, 7.4], [0.01, 7.6]], 28, { rRef: 5.4 });
    M.uvOn = false; M.set(1, brassV); M.lathe([[5.55, -18.4], [5.75, -18.2], [5.75, -17.4], [5.55, -17.2]], 28); M.lathe([[6.35, -5.2], [6.5, -5], [6.5, 5], [6.35, 5.2]], 28, { a0: 0, a1: Math.PI * 2 });
    M.bone = 4; M.push().move(0, -20.2, 0).rotX(Math.PI); settingCircle(7); M.pop();
    M.pop();
    // declination axis: housing through the polar head, shaft and the stack of counterweights out to the west
    M.bone = 1; M.push().move(0, CY, 0).rotZ(Math.PI / 2);     // local +Y = world -X (west)
    M.uvOn = true; M.set(0, pierPaint, 1.0);
    M.lathe([[4.4, 16], [5.6, 16.4], [5.6, 17.4], [5.2, 17.8], [5.2, 26.4], [5.6, 26.8], [5.6, 28.2], [4.2, 29], [2.0, 29.6]], 28, { rRef: 5.2 });
    M.uvOn = false; M.set(6, steel, 0.7); M.lathe([[1.7, 29.4], [1.7, 31 + nWeights * 2.6], [1.2, 31.4 + nWeights * 2.6], [0.01, 31.6 + nWeights * 2.6]], 14);
    // the counterweights are cast wheels with a brass band round each; the outermost shows its face to the hall: a raised rim under a
    // brass ring with twelve dark studs, a sunk web with six ribs and a hub round the shaft
    const castIron = new THREE.Color(0.2, 0.21, 0.235);
    for (let i = 0; i < nWeights; i++) {
      const y0 = 31 + i * 2.6, r = 7.4 - i * 0.45, last = i === nWeights - 1, hub = Math.min(3.6, r * 0.52);
      M.set(0, castIron, 1); M.rand = 0.2 + i * 0.13;
      M.lathe(last
        ? [[1.7, y0], [r - 0.5, y0], [r, y0 + 0.35], [r, y0 + 1.95], [r - 0.5, y0 + 2.3], [r - 1.3, y0 + 2.3], [r - 1.5, y0 + 2.1], [hub, y0 + 2.1], [hub - 0.3, y0 + 2.45], [1.7, y0 + 2.45]]
        : [[1.7, y0], [r - 0.5, y0], [r, y0 + 0.35], [r, y0 + 1.95], [r - 0.5, y0 + 2.3], [1.7, y0 + 2.3]], 32);
      if (last) for (let k = 0; k < 6; k++) { M.push().rotY(k / 6 * Math.PI * 2).move(0, y0 + 2.19, (hub + r - 1.5) / 2); M.box(0.17, 0.1, (r - 1.4 - hub) / 2, 0.04); M.pop(); }
      M.set(1, brassV, 0.95); M.lathe([[r + 0.01, y0 + 0.9], [r + 0.09, y0 + 0.98], [r + 0.09, y0 + 1.32], [r + 0.01, y0 + 1.4]], 32);
      if (last) {
        M.lathe([[r - 0.55, y0 + 2.3], [r - 0.58, y0 + 2.34], [r - 1.22, y0 + 2.34], [r - 1.25, y0 + 2.3]], 32);
        M.set(6, steel, 0.5);
        for (let k = 0; k < 12; k++) { M.push().rotY((k + 0.5) / 12 * Math.PI * 2).move(0, y0 + 2.34, r - 0.9); M.lathe([[0.26, 0], [0.26, 0.2], [0.16, 0.3], [0.01, 0.3]], 6); M.pop(); }
      }
    }
    M.set(1, brassV); M.lathe([[2.4, 31.2 + nWeights * 2.6], [2.9, 31.4 + nWeights * 2.6], [2.9, 32.2 + nWeights * 2.6], [2.4, 32.4 + nWeights * 2.6]], 14);
    M.pop();
  }
  await tick();
  // ---- the tube (bone 2), authored in its own frame: +Y along the axis toward the lens, +X east, -Z the upper side
  const tubeR = (s) => 10 + 2 * (s + TAIL) / (TAIL + LENS);
  const hingeL = [-10.05, -91.4, -5.8];
  M.push().move(0, CY, 0).rotX(Math.PI / 2 - ELEV);
  const tubeFrame = M.m.clone();
  {
    M.bone = 2; M.rand = 0.5; M.uvOn = true; M.set(2, enamel, 1);
    const pr = [[tubeR(-83), -83]];
    for (const s of [-57, -23, 45, 79]) { const r = tubeR(s); pr.push([r, s - 0.55], [r + 0.75, s - 0.55], [r + 0.75, s + 0.55], [r, s + 0.55]); }
    pr.push([tubeR(104), 104]);
    M.lathe(pr, 48, { rRef: 10.9 });
    const boltRing = (r, y, n, up) => {
      for (let i = 0; i < n; i++) { M.push().rotY((i + 0.5) / n * Math.PI * 2).move(0, y, r); if (!up) M.rotX(Math.PI); M.lathe([[0.36, 0], [0.36, 0.3], [0.22, 0.44], [0.01, 0.44]], 6); M.pop(); }
    };
    M.uvOn = false; M.set(1, brassV, 0.9);
    for (const s of [-57, -23, 45, 79]) { boltRing(tubeR(s) + 0.4, s + 0.55, 28, true); boltRing(tubeR(s) + 0.4, s - 0.55, 28, false); }
    boltRing(11.78, 11, 32, true); boltRing(11.78, -11, 32, false);
    M.uvOn = true;
    // saddle band and the stub of the declination axis
    M.set(0, pierPaint, 1.05); M.lathe([[11.2, -11], [12.3, -11], [12.3, -9.5], [11.9, -9], [11.9, 9], [12.3, 9.5], [12.3, 11], [11.2, 11]], 48, { rRef: 12 });
    M.push().rotZ(Math.PI / 2); M.lathe([[6.0, 11.4], [5.2, 12.6], [4.6, 16]], 28, { rRef: 5 }); M.pop();
    M.uvOn = false;
    // inside: blackened wall, eleven baffle rings with a thin starlit rim on the edge the camera sees
    M.uvOn = true; M.set(4, black, 1); M.lathe([[tubeR(-90.5) - 0.5, -90.5], [tubeR(111) - 0.5, 111]], 48, { inward: true, rRef: 10 });
    // the baffles' openings follow the cone of light: 15 m at the tail, nearly the full bore at the lens, so from anywhere on the
    // axis the whole lens shows and the far wall between the rings is in view. Each has a dark riveted back and a bevelled lip.
    for (let k = 0; k < 11; k++) {
      const s = -81 + 17 * k, ro = tubeR(s) - 0.5, ri = 7.5 + (s + 81) * 0.0188;
      M.set(4, black, 1.2); M.rand = 0.1 * k; M.lathe([[ri + 0.3, s - 0.2], [ro, s - 0.2]], 48, { rRef: 10 }); M.lathe([[ro, s + 0.2], [ri, s + 0.2]], 48, { rRef: 10 });
      M.set(5, starC, 1); M.ao = 0.16; M.rand = 1; M.lathe([[ri, s + 0.2], [ri + 0.3, s - 0.2]], 48); M.ao = 1;
    }
    M.uvOn = false;
    // THE IRIS behind the fourth ring: each leaf a helical arc of blackened plate facing the tail, with a bevelled lit lip (the baffles' own
    // kind) along its inner edge. Wound as the lathe winds a face that looks down the axis toward the tail.
    {
      const seg = 60, lipW = 0.18, lipD = 0.003;
      for (let i = 0; i < IRIS_N; i++) {
        M.bone = NB + i;
        const strip = (ra, ya, rb, yb, nr, ny) => {      // (the second uv of a vertex: its distance from the lip, in metres, for the lip's spill on the plate)
          let a0 = -1, b0 = -1;
          for (let j = 0; j <= seg; j++) {
            const be = IRIS_ARC * j / seg, sx = Math.sin(be), cz = Math.cos(be), y = IRIS_S + IRIS_RISE * j / seg;
            const a = M.v(ra * sx, y + ya, ra * cz, nr * sx, ny, nr * cz, -1e4, 0), b = M.v(rb * sx, y + yb, rb * cz, nr * sx, ny, nr * cz, -1e4, Math.max(0, rb - IRIS_R0 - lipW));
            if (j) { M.tri(a0, a, b0); M.tri(a, b, b0); }
            a0 = a; b0 = b;
          }
        };
        M.set(4, black, 1.2); M.rand = 0.37; M.ao = 1; strip(IRIS_R0 + lipW, 0, IRIS_R1, 0, 0, -1);
        const ll = Math.hypot(lipW, lipD); M.set(5, starC, 1); M.ao = 0.16; M.rand = 1; strip(IRIS_R0, lipD, IRIS_R0 + lipW, 0, -lipD / ll, -lipW / ll); M.ao = 1;
      }
      M.bone = 2;
    }
    M.rand = 0.5;
    // brass lens cell and dew cap (the glass and the portal's seat are a mesh of their own, below)
    M.set(1, brassV, 1.05);
    M.lathe([[12.0, 104], [12.6, 104.3], [12.6, 106], [12.95, 106.4], [12.95, 108.5], [12.5, 109], [12.5, 112], [13.2, 112.4], [13.2, 113.6], [12.75, 114], [12.75, 122.2], [13.0, 122.6], [13.0, 123.4],
      [12.3, 123.4], [12.3, 113.3], [11.0, 113.3], [11.0, 112.4], [11.2, 112.1], [11.2, 111.3], [11.35, 111.0], [11.5, 111.0]], 48);
    for (let i = 0; i < 16; i++) { M.push().rotY((i + 0.5) / 16 * Math.PI * 2).move(0, 113, 13.25); M.rotX(Math.PI / 2); M.lathe([[0.01, 0.55], [0.4, 0.5], [0.45, 0], [0.01, 0]].reverse(), 6); M.pop(); }
    // the counter-cell inside the tube: a coned, moulded brass ring nine metres deep with a circle of bolt heads, the first thing
    // the lens lights; from down the axis it stands as a gleaming band round the glass
    M.set(1, brassV, 1.1);
    M.lathe([[11.46, 103.2], [11.25, 103.2], [11.12, 103.5], [11.12, 104.3], [10.96, 104.6], [10.93, 108.4], [11.06, 108.7], [11.06, 109.4], [10.8, 109.8], [10.64, 112.6], [10.64, 112.95]], 48, { inward: true });
    M.set(1, brassV, 1.25);
    for (let i = 0; i < 24; i++) { M.push().rotY((i + 0.5) / 24 * Math.PI * 2).move(0, 106.6, 10.94); M.rotX(-Math.PI / 2); M.lathe([[0.01, 0], [0.42, 0], [0.36, 0.34], [0.01, 0.42]], 6); M.pop(); }
    M.set(1, brassV, 1.05);
    // brass tail: plate with the 15 m opening, moulded collar
    M.lathe([[7.5, -89.5], [7.5, -91], [8.1, -91], [8.25, -91.3], [9.65, -91.3], [9.8, -91], [10.5, -91], [10.5, -89], [10.95, -88.5], [10.95, -86.4], [10.6, -86], [10.6, -83.4], [tubeR(-83), -83]], 48);
    M.uvOn = false; M.set(6, steel, 0.8); boltRing(8.95, -91.3, 20, false); M.set(1, brassV, 1.05);
    await tick();
    // clamp and slow-motion rods up the flank, on stand-offs, with handles at the tail
    const rodAz = [[0.94, 0.34], [-0.94, 0.34], [0.5, 0.866]];
    for (const [ax, az] of rodAz) {
      const pts = []; for (let s = -88; s <= -12; s += 9.5) { const r = tubeR(s) + 1.15; pts.push([ax * r, s, az * r]); }
      M.set(6, steel, 0.85); M.tube(pts, 0.3, 6);
      for (let s = -78.5; s <= -14; s += 19) { const r = tubeR(s) + 0.5; M.set(1, brassV); M.push().move(ax * r, s, az * r).rotY(Math.atan2(ax, az)); M.box(0.3, 0.5, 0.75, 0.1); M.pop(); }
      M.set(1, brassV, 1.1); M.push().move(ax * (tubeR(-88) + 1.15), -89.6, az * (tubeR(-88) + 1.15)); M.lathe([[0.3, 1.6], [0.75, 1.2], [0.75, 0.4], [0.45, 0], [0.01, -0.1]].reverse(), 8); M.pop();
    }
    // the keeper's ladder up the upper line of the tube, saddle to lens cell, in the pier ladder's own measures but of brass, as the cell and
    // the wheels are: two rails three metres apart that turn in to the skin at both ends, a rung every 3.4 m, at every fifth a pair of
    // turned stanchions; under the cell a brass foot rail round the upper 110 degrees of the tube, on four stanchions, its ends turned in
    // to the skin, where the keeper stands to uncap the glass at whatever height it is set. The whole ends below 101.5 m, short of the
    // cell's inner light; every sunk end and foot stops inside the wall's half metre, short of the tube's inner wall. (A bar carries
    // no plate coordinates here: brass with them draws plate rivets.)
    {
      const lz = (s) => -(tubeR(s) + 1.3), S0 = 12.6, S1 = 100.2, SF = 97.3, rf = tubeR(SF) + 1.3;
      const bar = (pts, r, n) => { const v0 = M.nv; M.tube(pts, r, n); for (let i = v0; i < M.nv; i++) { M.U[i * 2] = -1e4; M.U[i * 2 + 1] = 0; } };
      const post = () => { M.rotX(-Math.PI / 2); M.lathe([[0.45, 0], [0.45, 0.24], [0.2, 0.44], [0.16, 1.55]], 8); M.pop(); };
      M.set(1, brassV, 0.9);
      for (const sx of [-1, 1]) {
        const pts = [[sx * 1.5, S0 - 1.0, lz(S0) + 1.65], [sx * 1.5, S0 - 1.0, lz(S0) + 0.95], [sx * 1.5, S0 - 0.55, lz(S0) + 0.35], [sx * 1.5, S0, lz(S0)]];
        for (let s = 21; s < S1 - 4; s += 9) pts.push([sx * 1.5, s, lz(s)]);
        pts.push([sx * 1.5, S1, lz(S1)], [sx * 1.5, S1 + 0.55, lz(S1) + 0.35], [sx * 1.5, S1 + 1.0, lz(S1) + 0.95], [sx * 1.5, S1 + 1.0, lz(S1) + 1.65]);
        bar(pts, 0.24, 5);
      }
      for (let k = 0, s = 14; s < S1; k++, s += 3.4) {
        bar([[-1.5, s, lz(s)], [1.5, s, lz(s)]], 0.17, 4);
        if (k % 5 === 0) for (const sx of [-1, 1]) { M.push().move(sx * 1.5, s, lz(s) + 1.55); post(); }
      }
      const arc = [], ap = (a, r) => arc.push([r * Math.sin(a), SF, -r * Math.cos(a)]);
      ap(-1.036, rf - 1.55); ap(-1.036, rf - 0.95); ap(-1.002, rf - 0.35); for (let i = -7; i <= 7; i++) ap(i / 7 * 0.96, rf); ap(1.002, rf - 0.35); ap(1.036, rf - 0.95); ap(1.036, rf - 1.55);
      bar(arc, 0.26, 6);
      for (const a of [-0.96, -0.5, 0.5, 0.96]) { M.push().rotY(-a).move(0, SF, -(rf - 1.45)); post(); }
    }
    await tick();
    // two finder telescopes on the upper flanks
    for (const sx of [-1, 1]) {
      const ax = sx * 0.643, az = -0.766, rr = 13.9;
      M.push().move(ax * rr, -86, az * rr);
      M.set(2, enamel, 0.95); M.lathe([[1.25, 2], [1.35, finderLen - 2]], 14);
      M.set(1, brassV); M.lathe([[1.35, finderLen - 2], [1.65, finderLen - 1.6], [1.65, finderLen + 0.6], [1.4, finderLen + 0.6]], 14);
      M.lathe([[0.45, -5.5], [0.7, -5.2], [0.7, -3], [1.0, -2.6], [1.0, 0], [1.35, 0.4], [1.35, 2], [1.25, 2]], 14);
      M.set(0, pierPaint, 0.9);
      for (const s of [4, finderLen - 6]) { M.push().move(-ax * 1.9, s, -az * 1.9).rotY(Math.atan2(ax, az)); M.box(0.3, 0.45, 2.0, 0.1); M.pop(); M.lathe([[1.45, s - 0.5], [1.6, s - 0.4], [1.6, s + 0.4], [1.45, s + 0.5]], 14); }
      M.pop();
    }
    // focusing handwheels, 6 m across, on bosses either side above the collar
    for (const sx of [-1, 1]) {
      M.push().move(sx * tubeR(-79), -79, 0).rotZ(-sx * Math.PI / 2);
      M.set(1, brassV); M.lathe([[1.3, -0.2], [1.3, 0.5], [0.8, 0.9], [0.4, 1.0], [0.4, 3.0], [0.75, 3.1], [0.75, 3.7], [0.01, 3.9]], 12);
      M.bone = sx < 0 ? 17 : 18;                    // the wheel itself turns on its boss (someone is always focusing)
      M.push().move(0, 3.3, 0); M.torus(3.0, 0.24, 36, 8);
      for (let i = 0; i < hwSpokes; i++) { const a = i / hwSpokes * Math.PI * 2; M.tube([[0.5 * Math.sin(a), 0, 0.5 * Math.cos(a)], [3.0 * Math.sin(a), 0, 3.0 * Math.cos(a)]], 0.14, 5); }
      M.set(1, brassV, 1.2); M.push().move(2.2, 0.5, 0); M.lathe([[0.26, -0.3], [0.3, 0.5], [0.22, 0.9], [0.01, 1.0]], 8); M.pop();
      M.pop(); M.pop(); M.bone = 2;
    }
    // declination circle on the east face of the saddle, with its reading arm
    M.push().move(12.2, 0, 0).rotZ(-Math.PI / 2); M.set(0, pierPaint, 1); M.lathe([[2.2, 0], [1.9, 1.0], [1.9, 1.3]], 14); M.push().move(0, 1.0, 0); M.bone = 16; settingCircle(7); M.bone = 2; M.pop(); M.pop();
    M.set(1, brassV); M.push().move(13.9, 8.4, 0); M.box(0.25, 1.6, 0.3, 0.08); M.pop(); M.push().move(14.4, 7.0, 0).rotZ(-Math.PI / 2); M.lathe([[0.7, -0.2], [0.7, 1.4], [0.45, 1.8]], 10); M.pop();
    await tick();
    // hinged eyepiece turret (bone 3): closed over the tail opening until it swings aside
    M.bone = 3; M.rand = 0.8;
    M.set(1, brassV, 1.0); M.lathe([[0.01, -92.6], [8.6, -92.6], [8.9, -92.3], [8.9, -91.7], [8.6, -91.4]], 40);
    M.push().move(0, -92.6, 0).rotX(Math.PI);
    M.lathe([[2.3, 0], [2.3, 2.2], [2.6, 2.4], [2.6, 3.1], [1.9, 3.3], [1.9, 5.4], [2.15, 5.6], [2.15, 6.3], [1.2, 6.5], [0.9, 6.3], [0.01, 6.3]], 16);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.6, r = 1.0 + 0.2 * ((i * 7) % 3), L = 2.4 + i * 0.7; M.push().move(Math.cos(a) * 5.6, 0, Math.sin(a) * 5.6); M.lathe([[r + 0.25, 0], [r + 0.25, 0.5], [r, 0.7], [r, L], [r * 0.6, L + 0.3], [0.01, L + 0.3]], 12); M.pop(); }
    M.pop();
    M.set(1, brassV, 0.9); M.push().move(hingeL[0] * 0.55, -92.0, hingeL[2] * 0.55).rotY(Math.atan2(hingeL[0], hingeL[2])); M.box(1.1, 0.45, 5.6, 0.2); M.pop();
    M.push().move(hingeL[0], 0, hingeL[2]); M.lathe([[0.01, -93.6], [0.9, -93.5], [0.9, -89.2], [0.01, -89.1]], 10);
    M.bone = 2; M.lathe([[1.25, -90.9], [1.25, -89.0], [0.9, -88.6]], 10); M.push().move(-hingeL[0] * 0.07, -89.6, -hingeL[2] * 0.07); M.box(0.9, 0.5, 0.9, 0.15); M.pop();
    M.pop();
  }
  M.pop();
  await tick();
  const machine = addMesh(object, M.build(), matMain, 'machine');
  // the lens: a ring of glass round the portal's seat, set in the cell; it rides the tube (its matrix is the tube's bone)
  const lensGeo = new THREE.RingGeometry(PORTAL_R - 0.6, LENS_R, 72, 1);
  lensGeo.applyMatrix4(new THREE.Matrix4().copy(tubeFrame).multiply(_m4.makeTranslation(0, 113.0, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  const lensMat = new THREE.ShaderMaterial({ uniforms: lensU, vertexShader: LENS_VERT, fragmentShader: LENS_FRAG, side: THREE.DoubleSide, fog: false });
  materials.push(lensMat);
  const lensMesh = addMesh(object, lensGeo, lensMat, 'lens'); lensMesh.matrixAutoUpdate = false;
  await tick();
  // =============================================================== THE RISING FLOOR (its own group; y is set from progress)
  const floor = new THREE.Group(); floor.name = 'floor'; object.add(floor);
  const FLOOR_R = 125, FLOOR_RISE = opts.floorRise ?? 50;
  if (opts.floor !== false) {
    const g = new Geo(9000); g.rand = 0.4; g.set(8, new THREE.Color(opts.deckColor ?? '#8a7b6c'), 1.0);
    g.lathe([[FLOOR_R, 0], [100, 0], [75, 0], [50, 0], [25, 0], [0.01, 0]], 72);
    g.set(0, pierPaint, 0.6); g.lathe([[FLOOR_R - 0.8, -3.4], [FLOOR_R + 0.3, -3.0], [FLOOR_R + 0.3, 0], [FLOOR_R, 0]], 72);
    g.set(1, brassV, 0.9); g.lathe([[FLOOR_R - 1.2, 0.02], [FLOOR_R - 1.2, 0.3], [FLOOR_R - 1.9, 0.3], [FLOOR_R - 1.9, 0.02]].reverse(), 72);
    // iron curb round the pier's hole
    const hx = U.uHole.value.z, hz = U.uHole.value.w;
    g.set(0, pierPaint, 0.7);
    for (const s of [-1, 1]) {
      g.push().move(PIER_X + s * (hx + 0.5), 0.6, PIER_Z); g.box(0.5, 0.6, hz + 1, 0.15); g.pop();
      g.push().move(PIER_X, 0.6, PIER_Z + s * (hz + 0.5)); g.box(hx + 1, 0.6, 0.5, 0.15); g.pop();
    }
    { const wasUv = g.uvOn; g.uvOn = true; g.set(12, new THREE.Color(0.5, 0.4, 0.39), 1.5); const D = 30, ao = [0.95, 0.95, 0.12, 0.12];
      for (const sg of [-1, 1]) {
        const X = PIER_X + sg * (hx + 0.02), Z = PIER_Z + sg * (hz + 0.02);
        g.poly([[X, -0.1, PIER_Z - hz], [X, -0.1, PIER_Z + hz], [X, -D, PIER_Z + hz], [X, -D, PIER_Z - hz]], [-sg, 0, 0], [[D, 0], [D, 2 * hz], [0, 2 * hz], [0, 0]], ao);
        g.poly([[PIER_X - hx, -0.1, Z], [PIER_X + hx, -0.1, Z], [PIER_X + hx, -D, Z], [PIER_X - hx, -D, Z]], [0, 0, -sg], [[D, 50], [D, 50 + 2 * hx], [0, 50 + 2 * hx], [0, 50]], ao);
      }
      g.uvOn = wasUv; }
    // a dozen ruby lanterns on iron stands round the rim
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.sin(a) * 116, z = Math.cos(a) * 116;
      g.set(0, pierPaint, 0.45); g.push().move(x, 0, z); g.lathe([[1.3, 0], [1.3, 0.3], [0.5, 0.7], [0.3, 1.2], [0.3, 5.4], [0.55, 5.6], [0.55, 6.0]], 8); g.pop();
      lantern(g, x, 6.1, z, 0, 0, true);
    }
    addMesh(floor, g.build(), matMain, 'deck');
  }
  await tick();

  // =============================================================== anchors (local space, settled pose)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const axis = V3(0, DY, DZ), pivot = V3(0, CY, 0);
  const onAxis = (s) => pivot.clone().addScaledVector(axis, s);
  const hingeW = V3(hingeL[0], 0, hingeL[2]).applyMatrix4(tubeFrame);
  U.uIrisA.value.set(axis.x, axis.y, axis.z, 0); U.uIrisC.value.copy(V3(0, IRIS_S, 0).applyMatrix4(tubeFrame)); U.uIrisP.value.copy(V3(0, IRIS_S, IRIS_RP).applyMatrix4(tubeFrame));
  const hwC = [V3(-(tubeR(-79) + 3.3), -79, 0).applyMatrix4(tubeFrame), V3(tubeR(-79) + 3.3, -79, 0).applyMatrix4(tubeFrame)];
  const polarQ = V3(PIER_X, CY, 0), polarAxis = V3(0, 0.5, Math.sqrt(0.75));
  const anchors = {
    pivot, axis: axis.clone(), tail: onAxis(-TAIL), lens: onAxis(LENS), tailApproach: onAxis(-TAIL - 24), irisS: IRIS_S,
    portalSeat: { position: onAxis(112.5), facing: axis.clone().negate(), radius: PORTAL_R, shape: 'circle', tilt: true },
    flyThrough: [[-44, 16, -150], [-46, 16, -112], [-50, 30, -74], [-55, 48, -36], [-56, 60, -8], [-58, 70, 22], [-46, 84, 46], [-20, 100, 60], [12, 120, 56], [32, 136, 34], [27, 138, 6],
      [26, 104, -30], [26, 72, -62], [26, 66, -76], [13, 63, -89], [1, 61.5, -79]].map((p) => V3(p[0], p[1], p[2])).concat([onAxis(-TAIL - 24), onAxis(-TAIL), onAxis(0), onAxis(112.5)]),
    viewpoints: { entry: V3(-44, 16, -150), clockPass: V3(-56, 60, -8), linger: V3(-52, 78, 36), rail: V3(0, 118, 58), flank: V3(26, 104, -30), tailTurn: V3(13, 63, -89), inTube: onAxis(0) },
    clockCase: V3(XB - 7, YF + 14, ZC), governor: V3(XG, YF + 12, ZG), pierTop: V3(PIER_X, 140, PIER_Z), counterweights: V3(-38, CY, 0),
    domeCentre: V3(0, CY, 0), slitCentre: V3(0, CY, 0).addScaledVector(axis, R), slitFoot: V3(0, CY + 6, R - 2), crown: V3(0, CY + R, 0),
    rail: { y: CY - 6.1, radius: R - 3 }, rope: { y: CY - 17, radius: R - 3.5 }, wallHead: { y: CY - 14.2, radius: R },
    floor: { radius: FLOOR_R, rise: FLOOR_RISE, hole: [PIER_X, PIER_Z, U.uHole.value.z, U.uHole.value.w] }, desk: V3(-48, 0, -112),
    lamps: lampList.map((l) => ({ position: V3(l.pos[0], l.pos[1], l.pos[2]), ridesFloor: l.rides })),
  };

  // =============================================================== motion
  const st = { u: opts.progress ?? 0.62, set: false, clockT: -1, starMul: 1, flash: 0, floorY: 0, open: 1, domeAngle: 0, userLamps: {} };
  const heroInv = new THREE.Matrix4(), tA = new THREE.Matrix4(), tB = new THREE.Matrix4(), tC = new THREE.Matrix4(), v = new THREE.Vector3(), X = V3(1, 0, 0), Y = V3(0, 1, 0);
  const rotAbout = (out, p, ax, ang) => out.makeTranslation(p.x, p.y, p.z).multiply(tA.makeRotationAxis(ax, ang)).multiply(tB.makeTranslation(-p.x, -p.y, -p.z));
  const pt = (a) => v.set(a[0], a[1], a[2]);
  const tubeA0 = onAxis(-TAIL), tubeB0 = onAxis(LENS + 10);
  // which lamps feed the light rig: the piece's own first (clock case, pier), then the floor lanterns nearest the west and south
  const rigLamps = lampList.filter((l) => !l.rides).slice(0, 7);
  const hasRing = lampList.some((l) => l.rides);
  const clockAt = opts.clockAt ?? [0.19, 0.25], creep = (opts.creep ?? 0) * Math.PI / 180, creepRate = opts.creepRate ?? 0.09, flick = opts.flicker ?? 0;
  let lampGain = opts.lampGain ?? 3.5; const track = (opts.track ?? 6) * Math.PI / 180;

  function update(dt, time, camera) {
    const u = st.u;
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    object.updateMatrixWorld(); heroInv.copy(object.matrixWorld).invert(); U.uHeroInv.value.copy(heroInv);
    if (camera) { camera.getWorldPosition(v); U.uCamL.value.copy(v.applyMatrix4(heroInv)); }
    U.uTime.value = time;
    // shutters and dome
    const open = st.open = 0.2 + 0.8 * ease(0.02, 0.28, u);
    // the leaves' edges stand 0.6 m times open outside the blade of light, as they did, and run on 3.4 m over the last tenth of the opening:
    // they park 4 m clear of the cut. Riding the shell they stand beside it, and parked nearer they showed past its far edge.
    U.uSlit.value.x = SLIT_W * open; U.uShut.value = (SLIT_W + 0.6) * open + 3.4 * sm(0.9, 1, open);
    const da = st.domeAngle = domeTurn * (1 - (opts.domeEase === 'cubic' ? sm(0, 0.30, u) : ease(0, 0.30, u))) - Math.sign(domeTurn) * track * Math.max(0, (u - 0.30) / 0.7) + creep * (opts.creepEarly ? 1 + opts.creepEarly * (1 - sm(0.04, 0.24, u)) : 1) * Math.sin(time * creepRate - 1.1);
    dome.rotation.y = da; U.uDomeCS.value.set(Math.cos(da), Math.sin(da));
    matWheel.uniforms.uSpin.value = -da * (R - 3) / 2.5;
    U.uRun.value.set(da * (R - 3.5) + time * 0.9, open * SLIT_W);
    // starlight, floor
    U.uStar.value = (starLow + (starHigh - starLow) * sm(0.22, 0.31, u)) * st.starMul;
    U.uFlash.value.w = st.flash;
    st.floorY = FLOOR_RISE * ease(0.06, 0.45, u); floor.position.y = st.floorY;
    U.uGlow.value = 0.78 + 0.22 * Math.sin(time * 1.3) + 0.1 * Math.sin(time * 3.1 + 1);
    // the telescope: polar then declination, with one small overshoot as it settles
    const b = Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.262) / 0.06)));
    const q = ease(0.05, 0.30, u) + 0.03 * b * b;
    const ha = parkHA * (1 - q), el = parkEl + (ELEV - parkEl) * q;
    rotAbout(bones[1], polarQ, polarAxis, ha);
    rotAbout(tC, pivot, X, -(el - ELEV)); bones[2].multiplyMatrices(bones[1], tC);
    rotAbout(tC, hingeW, axis, (110 * Math.PI / 180) * ease(0.48, 0.56, u)); bones[3].multiplyMatrices(bones[2], tC);
    U.uTubeA.value.copy(tubeA0).applyMatrix4(bones[2]); U.uTubeB.value.copy(tubeB0).applyMatrix4(bones[2]);
    lensMesh.matrix.copy(bones[2]);
    // inside the tube the light builds toward the lens: the wall's rings, the haze and the glass all come up as we climb
    { const c = U.uCamL.value, sC = (c.x - pivot.x) * axis.x + (c.y - pivot.y) * axis.y + (c.z - pivot.z) * axis.z, k = sm(-95, 100, sC), k2 = k * k;
      U.uTube.value.set(1.0 + 0.15 * sm(-90, 40, sC), 1.0 - 0.6 * sm(-40, 70, sC), 1.05 + 0.6 * k2, 1.0 - 0.6 * k);
      U.uTube2.value.x = 36 * sm(-120, -93, sC) * (1 - 0.6 * sm(20, 100, sC)); }
    // the driving clock: engages at u 0.19, up to speed by 0.25
    const run = ease(clockAt[0], clockAt[1], u);
    if (st.clockT < 0) st.clockT = time * run; else st.clockT += Math.min(dt || 0, 0.1) * run;
    const ct = st.clockT, gov = ct * 2.6, a1 = -gov * 24 / 20, a2 = -a1 * Math.round(teethA / 2) / teethB, a3 = -a2 * teethB / 16;
    rotAbout(bones[4], polarQ, polarAxis, ha + ct * 0.012);
    rotAbout(tC, pivot, X, ct * 0.05); bones[16].multiplyMatrices(bones[2], tC);
    for (let k = 0; k < 2; k++) { rotAbout(tC, hwC[k], X, (k ? 1 : -1) * (1.5 * Math.sin(time * 0.42 + k * 2.1) + 0.5 * Math.sin(time * 1.13 + k))); bones[17 + k].multiplyMatrices(bones[2], tC); }
    rotAbout(bones[5], pt(clock.spindle), Y, gov);
    const spread = 0.24 + 0.63 * run + 0.02 * Math.sin(time * 2.3) * run;
    for (let i = 0; i < clock.hinge.length; i++) {
      const h = clock.hinge[i]; v.set(-Math.sin(h[3]), 0, Math.cos(h[3]));
      tC.makeTranslation(h[0], h[1], h[2]).multiply(tA.makeRotationAxis(v, spread)).multiply(tB.makeTranslation(-h[0], -h[1], -h[2]));
      bones[6 + i].multiplyMatrices(bones[5], tC);
    }
    rotAbout(bones[9], pt(clock.g1), X, a1); rotAbout(bones[10], pt(clock.g2), X, a2); rotAbout(bones[14], pt(clock.g3), X, a3);
    rotAbout(bones[11], pt(clock.worm), Y, ct * 1.9);
    rotAbout(bones[13], pt(clock.sector), X, 0.22 - Math.min(ct * 0.011, 0.5));
    const fall = Math.min(ct * 0.22, 16), y0 = YF + 9.9, k = (y0 - 44 + fall) / (y0 - 44);
    bones[12].makeTranslation(0, -fall, 0);
    bones[15].makeTranslation(0, y0, 0).multiply(tA.makeScale(1, k, 1)).multiply(tB.makeTranslation(0, -y0, 0));
    { const ts = dial.t0 + time, sN = Math.floor(ts), sec = sN + sm(0, 0.12, ts - sN), T = Math.PI * 2;      // the observer's dial: clockwise for someone facing the pier's north face; the seconds hand steps with the desk chronometer's
      rotAbout(bones[20], dial.C, dial.ax, ts / 43200 * T); rotAbout(bones[21], dial.C, dial.ax, ts / 3600 * T); rotAbout(bones[22], dial.C, dial.ax, sec / 60 * T); }
    U.uRing.value.y = st.floorY + 7.1;
    { const g = hasRing ? lampGain * (1 + flick * 0.35 * Math.sin(time * 5.3)) : 0; U.uRingCol.value.set(ruby.r * g, ruby.g * g, ruby.b * g); }
    // lamps for the light rig (slot 7 and any slot the world overrides are left alone)
    for (let i = 0; i < 8; i++) {
      const ul = st.userLamps[i], l = rigLamps[i];
      if (ul) { const f = ul.flick ? 1 + ul.flick * (0.5 * Math.sin(time * 4.3 + i * 2.3) * Math.sin(time * 1.9 + i) + 0.3 * Math.sin(time * 7.9 + i * 3.1) + 0.2 * Math.sin(time * 2.7 + i * 1.3)) : 1; lampPos[i].set(ul.x, ul.y, ul.z, ul.range); lampCol[i].set(ul.r * f, ul.g * f, ul.b * f); }
      else if (l && i < 7) {
        const g = lampGain * (1 + flick * (0.5 * Math.sin(time * 6.1 + i * 1.7) + 0.3 * Math.sin(time * 10.7 + i * 3.1) + 0.2 * Math.sin(time * 3.3 + i)));
        lampPos[i].set(l.pos[0], l.pos[1] + (l.rides ? st.floorY : 0), l.pos[2], 30); lampCol[i].set(l.color.r * g, l.color.g * g, l.color.b * g);
      }
      else { lampPos[i].set(0, -999, 0, 1); lampCol[i].set(0, 0, 0); }
    }
  }
  update(0, 0, null);

  const api = {
    object, radius: R + 2, height: CY + R + 3, center: V3(0, CY - 20, 0), anchors, update, ground: false, groundY: 0,
    dispose() { for (const m of materials) m.dispose(); },
    // --- hooks for the world
    setProgress(u) { st.u = Math.min(1, Math.max(0, u)); st.set = true; },
    setIris(k) { U.uIrisA.value.w = IRIS_SHUT * Math.min(1, Math.max(0, k)); },      // 1 closed (an eye of 3.2 m), 0 open (the leaves behind their ring); the world keys it to u
    setStar(k) { st.starMul = k; },                                   // multiplies the starlight key (cloud across the slit, dawn)
    setStarColor(hex, domeHex) { const c = new THREE.Color(hex); U.uStarCol.value.set(c.r, c.g, c.b); const d = new THREE.Color(domeHex ?? hex); U.uDomeCol.value.set(d.r, d.g, d.b); },      // domeHex: the light the dome's own timber takes from the slit (default: the starlight)
    setAmbient(sky, ground) { const a = new THREE.Color(sky), b = new THREE.Color(ground); U.uAmbSky.value.set(a.r, a.g, a.b); U.uAmbGnd.value.set(b.r, b.g, b.b); },
    setFlash(k, hex) { st.flash = Math.min(1, Math.max(0, k)); if (hex) { const c = new THREE.Color(hex); U.uFlash.value.set(c.r, c.g, c.b, st.flash); } },
    setFrost(k) { U.uFrost.value = k; }, setAmbientShare(deck, walls, dome, fill) { U.uAmbK.value.set(deck, walls, dome, fill); }, setLampGlow(glass, gain) { U.uLampGlow.value = glass; if (gain != null) lampGain = gain; }, setFill(k) { U.uFill.value = k; }, setBeam(k) { U.uBeam.value = k; }, setRim(k) { U.uRim.value = k; },
    setLamp(i, position, hex, range = 30, gain = 5, flick = 0) { if (!position) { delete st.userLamps[i]; return; } const c = new THREE.Color(hex); st.userLamps[i] = { x: position.x, y: position.y, z: position.z, range, r: c.r * gain, g: c.g * gain, b: c.b * gain, flick }; },
    // the light rig, for surfaces the world adds round the piece (wall, desk, ladder) so they sit in the same light
    lit: { uniforms: U, vertexShader: VERT, fragmentShader: FRAG, lightGLSL: LIGHT, makeMaterial: (defines) => mkMat(defines), Geo, kinds: { paint: 0, brass: 1, enamel: 2, timber: 3, black: 4, glow: 5, steel: 6, floor: 8, rope: 10, brick: 12, flags: 13 } },
    state: st, cast: { fittings, domeTurnDeg: domeTurn * 180 / Math.PI, parkHA, parkEl, nWeights, nBalls },
    lens: { uniforms: lensU, mesh: lensMesh }, floorGroup: floor, domeGroup: dome, floorY: () => st.floorY, slitOpen: () => st.open, domeAngle: () => st.domeAngle,
    tubePose(out = {}) { out.tail = tubeA0.clone().applyMatrix4(bones[2]); out.lens = onAxis(LENS).applyMatrix4(bones[2]); return out; },
  };
  object.userData.hero = api;
  void machine; void ropeMesh; void green; void wheelMesh;
  return api;
}
