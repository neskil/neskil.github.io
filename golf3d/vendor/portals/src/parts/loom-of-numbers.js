// The Loom of Numbers, the part: the Mill's works (the hero) and the laws every material of the house shares.
//
// THE CARRY'S WAVE, in this builder's own words. A Mill column is a stack of brass wheels on one axis. Beside it
// stands a steel spindle. EACH SPINDLE STANDS STILL AND NEVER TURNS. Its fingers stand in ONE STRAIGHT ROW up it, one
// exactly over another, one to a wheel and at that wheel's height. Each finger is tripped by the wheel below it and
// pushes on the wheel at its own height by one scallop; so a wave climbs the column, wheel after wheel. NEVER arms
// set in a spiral or a helix round a turning axis. The form comes from this law of the wave and from plain
// mechanics alone; no film, picture, plan or model of any built or drawn engine was looked at for it.
//
// ONE WHEEL FORM (wheelStackGeometry): a ring with ten scallops, drawn many times by instancing; every wheel of the
// house (the Store's and the Mill's) is this form. ONE LAW OF TURNING (WHEEL_GLSL: wheelTurn, carrySince) is read by
// the wheels' shader and by the fingers' shader alike, so that a finger and its wheel can never disagree; waveBegins
// and wavesWithin are the wave's clock on the processor, for counts without a picture. A thing with no spindle
// carries no wave BY RULE: its wave period is NO_WAVE, which every reader of the law reads as no carry.
// Every mover here keeps its own time by the world's clock (uTime) and its own draws. Nothing reads the metres flown, the
// eye's place, a seed number or a clock value; nothing begins, stops or quickens because anyone comes.
//
// THE SUN'S SHADE BY PLACE (LIGHT_GLSL: sunAt and what it calls) is one law for every material of the house: the
// glazing bars' shade; the vault's ribs and the webs under them as bands of shade across the floor and down the
// columns (ribShade: where the line from a place to the seed's sun leaves the vault, by geometry, and how near a
// rib's plane it leaves; fixed in the world for a seed, the piers' broad shade at the walls with it); the flywheel's
// own turning shade north of its plane (wheelShade: rim, spokes and hub, by the world's clock and the wheel's dealt
// phase uWheel: the one phase the wheel, its shade and its belt all turn by); the cloth's coloured light through the
// three east windows (loomSun, clothLight). THE FILL (fillAt) is by place too: fullest at the Store's west glass and
// deeper toward the crossing, warm among the ranks of brass, the floor's bounce following the ribs' bands (strong
// on what stands low over a sunlit floor under glass: the Store, its crossing and the two links), a side light
// under things in the Cards and the Loom hall. THE MILL'S LIGHT (millLight) is by place: the lantern's warm
// daylight (lanternCol), the clerestory's blue, the fans' own glow. A wheel the carry has just thrown is held under
// white (KNOT_TOP), by the wave's own clock. None of it reads the eye, the metres flown or a seed's number.
//
// WHAT READS THE PICTURE'S GRAIN OR THE EYE in this file's shaders. Each is a law of drawing only: no thing's place,
// form, clock or number is taken from it.
// A FILTER BY A PIXEL'S FOOTPRINT (fwidth; this file has no dFdx and no dFdy):
//  - toothBand (SHADE_GLSL): the teeth and courses painted on rack bars, the dome's courses and the bolts of cloth fade
//    to their mean tone before they are finer than the grain (used by the plain material for every painted bar);
//  - the grain of iron, oak and brick (GRAIN_GLSL: lineAt, grainAt): plate joints, rivet rows, board joints and
//    brick courses fade to the face's even tone before they are finer than the grain; so does the drum wall's
//    raised frame about each sunk panel (its rails and stiles, the lit ledge on a rail's top, the lit arris at a
//    stile's edge, the band of shade under a rail and beside a stile);
//  - a pier's lit arris and sunk panel (the plain material's paint 12: pilasters, jambs, link posts, and the
//    bridges' legs, posts, hangers, straps and rods, which are bars of flat sides painted the same): the arris
//    fades before the grain is coarser than it is broad, the panel likewise; its course lines by lineAt; on a
//    broad pier (a jamb) the quirk and the bead inside the arris, and the rails across the panel with their lit
//    top edge and the shade under them, each fade the same way;
//  - a pile of cards (the plain material's paint 13): the folds' lines, the lighter head of each bundle between two
//    folds, the cards' courses (lineAt) and the lace knots go to their mean before they are finer than the grain;
//  - the great barrels (makeBarrelMaterial): the studs' marks and the small shade under each, the hoops and the
//    head rim go to their mean before they are finer than the grain.
// A SHADING BY THE DIRECTION FROM A THING TO THE EYE (cameraPosition, in shadeMetal, shadeDull and hazed of SHADE_GLSL,
// in the wheels' material and in the barrels'):
//  - the mirror picture on brass and steel (what a polished face shows of the glass roof, the walls and the floor),
//    the sun's glint on it, and the pale edge of the roof's sky on dark iron and oak (a fresnel edge);
//  - a wheel stack as a round: the broad highlight down it where it turns between the sun and the eye, and its
//    darker edge where it turns away from the eye;
//  - a great barrel as a round of steel: the long highlight up its lit flank and the pale edge at either limb (its
//    lit and shaded flanks are by the sun and the face's own bearing in the world, not by the eye);
//  - the haze between a thing and the eye (the house's air: one law, the same on every seed and at every place).
// NOTHING IS TURNED OR CENTRED BY THE EYE'S PLACE in this file.
// ONE TEXTURE OF THE PART'S OWN (uStuds, a DataTexture of bytes, STUD_N by three times STUD_ROWS, no float): where
// the studs stand on the three barrels, one texel a place, written at build from the very draws that set the studs
// (the mill stream; no draw is added or moved). The barrels' material reads it to lay each stud's shade on the
// drum. Nothing else in either file is a texture.
import * as THREE from 'three';

// ---------------------------------------------------------------- the house's measures (metres; +x east, +z south, y up)
export const PLAN = {
  // the Store
  storeX0: -40, storeX1: 240, storeHalf: 30, storeCrown: 48, rankZ: [9, 16, 23], colStep: 6, colX0: -37, colN: 46,
  storeWheels: 40, storeR: 0.9, storeFoot: 2, storeBand: 0.6,
  // the crossing at the Store's east end, with the engine wing on its north side: from the nave's end (storeX1, the
  // wing's west wall) to the crossing's east wall (crossX1, the wing's east wall). The Drive's flywheel in it: its
  // hub's place, its radius, the seconds of one turn; its face in the plane z = fly.z
  // (ribDeep: the depth of the web under each of the vault's ribs)
  ribDeep: 2.5, crossX1: 300, fly: { x: 270, y: 9, z: -28, R: 13, rim: 2.3, hub: 1.7, turn: 9 },
  // the Mill
  cx: 420, cz: 0, drumR: 75, archW: 345, archE: 495, lanternY: 72, lanternR: 15, clerY: 43,
  millWheels: 50, millR: 1.2, millFoot: 6, millBand: 0.6, ribR: [21, 27, 33], spindleOff: 1.9,
  ribBearings: [42, 66, 90, 114, 138, 222, 246, 270, 294, 318],
  barrelZ: [-11, 0, 11], barrelR: 4, barrelTop: [48, 56, 48], barrelFoot: 4,
  // the comb post's ring; the ribs' hangers from the dome, every hangStep metres outward; the feet that meet the
  // bare floor (their radii at the floor): a column's, a spindle's, a comb post's, a barrel's footstep, and the
  // middle barrel's two comb posts (their distance from the centre along z)
  postR: 17.5, hangStep: 8, footCol: 1.56, footSpindle: 0.45, footPost: 0.8, footBarrel: 4.7, midPostZ: 5.5,
  // the Cards
  cardX0: 540, cardX1: 740, cardHalf: 20, cardHigh: 56, galY: [8, 17, 26, 35, 44], galDeep: 4,
  // the Loom
  // (the cloth hangs from the fell at y 52 down to the roller; the gate stands on the floor under the roller, between the two foot posts)
  // (the hall's east end, loomX1, is the oak end wall the loom stands against: its west face 2.2 m behind the loom's
  // plane, where the loom's side posts and head beam end; its one opening is the window behind the cloth)
  loomX0: 740, loomX1: 942.2, loomHalf: 40, loomHigh: 74, loomX: 940, fellY: 52, beamY: 62, warpTop: 60.5, rollY: 25.5, warpHalf: 23,
  gateW: 16, gateH: 20, postZ: 10.8, postHalf: 1.2, breastTop: 22,
  // THE CLOTH DRAWN OFF: beside each foot post, outside it, the finished cloth leaves the roller and falls to a
  // take-up roll on the floor: fallZ (its breadth, from the middle line), fallTop (where it leaves the roller's
  // guide), fallX (its plane, before the breast). THE END WALL'S OUTER LENGTHS: between each side post of the loom
  // and the hall's side wall a finished length hangs before a window of its own (outerZ, outerY), which it covers
  outerZ: [31.6, 39.4], outerY: [5, 67], fallZ: [12.3, 24.8], fallTop: 24.2, fallX: 937.6,
};

// ---------------------------------------------------------------- the uniforms every material of the house shares
export function makeShared(o = {}) {
  const c = (h) => new THREE.Color(h);
  return {
    uTime: { value: 0 },
    uSunDir: { value: (o.sunDir || new THREE.Vector3(0.807, 0.407, 0.429)).clone().normalize() },
    uSunCol: { value: c(o.sunColor || '#fff1cf').multiplyScalar(o.sunPower ?? 3) },
    uSkyCol: { value: c(o.sky || '#cfdcec') },
    uFloorCol: { value: c(o.bounce || '#5a4a38') },
    uFogCol: { value: c(o.fog || '#c9d3dc') },
    uFogDen: { value: o.fogDensity ?? 0.0011 },
    uRanks: { value: o.ranks ?? 3 },
    // the cloth's colours: its ground, its two flower colours and its leaf
    uClothA: { value: c(o.clothA || '#1c2f5e') },
    uClothB: { value: c(o.clothB || '#d9a520') },
    uClothC: { value: c(o.clothC || '#b3202e') },
    uClothD: { value: c(o.clothD || '#1f6b5a') },
    uTempo: { value: o.tempo ?? 1 },
    // the Cards: for every place a loop can hang (four curtains, six abreast) its chain's own step (period, phase,
    // backed); and how many loops hang abreast on this visit. The sun's dots through the holes step by these.
    // the flywheel's dealt phase (seconds of its turn): its turning shade reads it
    uWheel: { value: o.wheel ?? 0 },
    uDots: { value: Array.from({ length: 24 }, () => new THREE.Vector3(1.2, 0, 0)) },
    uAbreast: { value: o.abreast ?? 5 },
  };
}

// ---------------------------------------------------------------- light by place: one law for every material
// sunAt(p) is the sun that reaches a place through the house's glass: it reads the place alone (and the standing sun).
// The Store: the south wall's glass with its bars and ribs, and the shadows of the south ranks of columns.
// The Mill: no sun; the lantern's round of daylight and the clerestory's band (millLight).
// The Cards: the south windows between the galleries, and the shade of the hung chains with their holes.
// The Loom: the south wall's glass and the roof's ridge strip; from the east only what passes the loom's cloth
// (the end wall is oak, its one opening the window behind the cloth).
const f1 = (v) => (Number.isInteger(v) ? v + '.' : String(v));
// a chain's step takes STEP_LEN seconds of its period
export const STEP_LEN = 0.35;
export const LIGHT_GLSL = /* glsl */`
uniform float uTime, uFogDen, uRanks, uTempo;
uniform vec3 uSunDir, uSunCol, uSkyCol, uFloorCol, uFogCol, uClothA, uClothB, uClothC, uClothD;
uniform vec3 uDots[24]; uniform float uAbreast, uWheel;
const vec2 MILL_C = vec2(${f1(PLAN.cx)}, ${f1(PLAN.cz)});
float gap(float v, float period, float halfBar){
  float d = abs(fract(v/period) - .5)*period;
  return smoothstep(halfBar, halfBar + .22, d);
}
float hash11(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
float hash21(vec2 v){ return fract(sin(dot(v, vec2(127.1, 311.7)))*43758.5453); }
// A CHAIN'S STEP at clock t: x = how far through the step (0..1, signed by its sense), y = the count of cards gone by,
// z = seconds since the step began. backed 0: the chain runs on. backed b >= 1: it goes back four steps in every
// twelve and runs them again, and its round of twelve is counted from its own dealt number b - 1 (0 to 11).
vec3 chainStep(float t, float period, float phase, float backed){
  float tau = t + phase, n = floor(tau/period), f = tau - n*period;
  float isB = step(.5, backed), m = n + max(backed - 1., 0.);
  float r = mod(m, 12.), q = floor(m/12.);
  float dir = mix(1., r < 8. ? 1. : -1., isB);
  float gone = mix(n, 4.*q + (r <= 8. ? r : 16. - r), isB);
  return vec3(dir*smoothstep(0., ${f1(STEP_LEN)}, f), gone, f);
}
// THE CLOTH'S LIGHT as it lies on a face (w: metres across the cloth and up it): the ground's colour, with soft
// patches of the two flower colours, a row to about every five metres of cloth (the cloth's own repeat), going down
// with the weave as it creeps (the world's clock, the cloth's own creep)
vec3 clothLight(vec2 w){
  float t = uTime*uTempo*.3;
  float a = .5 + .5*sin(w.x*.61 + 2.*sin(w.y*.17 + 1.))*cos((w.y + t)*1.2);
  float b = .5 + .5*sin(w.x*.47 + 2.3 + 2.*sin(w.y*.13))*cos((w.y + t)*1.05 + 2.);
  return uClothA*3.6 + uClothB*1.1*smoothstep(.55, .95, a) + uClothC*1.1*smoothstep(.6, 1., b) + .02;
}
float inDrum(vec3 p){ return 1. - smoothstep(75.7, 77.7, length(p.xz - MILL_C)); }
float millDark(vec3 p){ return 1. - smoothstep(75.7, 79.5, length(p.xz - MILL_C)); }
float rankShade(vec3 p, float zr){
  float t = (zr - p.z)/max(uSunDir.z, .08);
  vec3 q = p + uSunDir*t;
  float dx = abs(fract((q.x - ${f1(PLAN.colX0)})/6. + .5) - .5)*6.;
  float hit = (1. - smoothstep(.72, 1.02, dx))*step(1.3, t)*step(q.y, 26.3)*step(${f1(PLAN.colX0 - 1)}, q.x)*step(q.x, 234.);
  return 1. - hit;
}
// THE FLYWHEEL'S SHADE: the wheel stands in the sun in its own plane; north of it the sun is cut by its rim, its hub
// and its eight spokes, which turn with the wheel (the wheel's own dealt phase, on the world's clock): a great
// turning shade on the bay's floor and back wall. Its edge is the softer the farther the shade falls.
float wheelShade(vec3 p){
  float back = ${f1(PLAN.fly.z)} - p.z, t = back/max(uSunDir.z, .08);
  vec2 d = (p + uSunDir*t).xy - vec2(${f1(PLAN.fly.x)}, ${f1(PLAN.fly.y)});
  float r = length(d), w = .15 + .02*t, R = ${f1(PLAN.fly.R)}, ri = ${f1(PLAN.fly.R - PLAN.fly.rim)};
  float ang = atan(d.y, d.x + 1e-5) - 6.2831853*(uTime*uTempo + uWheel)/${f1(PLAN.fly.turn)};
  float off = abs(fract(ang/.7853982 + .5) - .5)*.7853982*r;
  float rim = smoothstep(ri - w, ri + w, r)*(1. - smoothstep(R - w, R + w, r));
  float spoke = (1. - smoothstep(.5 - w, .5 + w, off))*(1. - smoothstep(ri - w, ri + w, r));
  float hub = 1. - smoothstep(${f1(PLAN.fly.hub)} - w, ${f1(PLAN.fly.hub)} + w, r);
  return 1. - max(rim, max(spoke, hub))*step(2., back);
}
// THE RIBS' SHADE. Every rib of the Store's vault is an iron arch with a web ${f1(PLAN.ribDeep)} m deep under the glass, on a pier
// a metre deep, fourteen metres from the next. The morning sun comes slanting along the nave, so the ribs cut it as
// the slats of a blind do: where the ray from a place to the sun leaves the vault within a rib's depth of the rib
// behind it, the place is in that rib's shade. The shade lies in bands across the floor, one to a rib, and in bands
// down every column (the lower the sun, the deeper the bands); it stands still in the world. A ray that leaves by
// the south wall under the vault's foot is cut by the rib's pier instead, as broad along the hall as the sun's
// slant makes a metre of depth.
float ribShade(vec3 p){
  if (p.z > 29.5) return 1.;
  float sx = max(uSunDir.x, .05), a = uSunDir.y/sx, b = max(uSunDir.z, .02)/sx;
  float sw = (30. - p.z)/b;
  if (p.y + a*sw < 30.) {
    float c = p.x + sw - .5/b, d = abs(fract((c + 3.5)/14.) - .5)*14.;
    return smoothstep(.55 + .5/b, 1.45 + .5/b, d);
  }
  float py = p.y - 30.;
  float A = a*a/324. + b*b/900., B = py*a/324. + p.z*b/900., C = py*py/324. + p.z*p.z/900. - 1.;
  float s = (-B + sqrt(max(B*B - A*C, 0.)))/A, ze = p.z + b*s;
  // how fast the ray closes on the vault as it goes (metres of depth to a metre along the hall)
  float g = max(a + .02*ze/sqrt(max(1. - ze*ze/900., .02))*b, .06), D = ${f1(PLAN.ribDeep)}/g, e = .3 + .12*D;
  float w = fract((p.x + s + 38.5)/14.)*14.;
  return 1. - clamp(1. - smoothstep(D - e, D + e, w) + smoothstep(13.2, 13.8, w), 0., 1.);
}
float storeSun(vec3 p){
  float t = (30. - p.z)/max(uSunDir.z, .08);
  vec3 e = p + uSunDir*t;
  float m = gap(e.x, 7., .2)*gap(e.x + 3.5, 14., .65)*gap(e.y, 6., .16)*smoothstep(5.6, 6.2, e.y)*ribShade(p);
  m *= rankShade(p, 9.)*rankShade(p, 16.)*mix(1., rankShade(p, 23.), step(2.5, uRanks));
  return m*wheelShade(p);
}
float cardSun(vec3 p){
  float t = (20. - p.z)/max(uSunDir.z, .08);
  vec3 e = p + uSunDir*t;
  float gy = mod(e.y - 8., 9.);
  float drop = 4.*uSunDir.y/max(uSunDir.z, .08);
  float win = gap(e.x, 5., .28)*smoothstep(max(1.3, drop), max(1.3, drop) + .3, gy)*(1. - smoothstep(7.5, 7.8, gy))*step(8., e.y);
  win = mix(win, gap(e.x, 5., .2), smoothstep(55., 57., e.y));
  // the hung chains between the windows and this place: ribbons of cards three metres broad, a metre apart, and
  // the sun through their holes; the holes are dealt by a hash and step on with the step of the very chain that
  // hangs there (its own dealt period and phase; a backed chain's dots go back with it)
  float h = 31. - p.y;
  float xs = p.x + h*uSunDir.x/max(uSunDir.y, .1), zs = p.z + h*uSunDir.z/max(uSunDir.y, .1);
  float curtain = floor((xs - 560.)/40.), o = (xs - 560. - curtain*40. - 20.)/4. + uAbreast*.5, slot = floor(o);
  float zone = step(0., curtain)*step(curtain, 3.5)*step(0., slot)*step(slot, uAbreast - .5)*step(0., h)*step(abs(zs), 15.);
  float onCard = step(.125, fract(o))*step(fract(o), .875);
  vec3 ch = uDots[int(clamp(curtain*6. + slot, 0., 23.))];
  float stepN = floor(chainStep(uTime*uTempo, ch.x, ch.y, ch.z).y + .5);
  float rib = curtain*6. + slot;
  vec2 cell = vec2(floor(xs/.5), floor(zs/.5) + stepN);
  vec2 cf = vec2(fract(xs/.5), fract(zs/.5)) - .5;
  float hole = step(.45, hash21(cell + rib*17.))*(1. - smoothstep(.2, .3, length(cf)));
  return win*mix(1., mix(1., .16 + .84*hole, onCard), zone);
}
vec3 loomSun(vec3 p){
  // the south wall: glass from its plinth to y 72 between oak posts sixteen metres apart, barred every eight
  float t2 = (40. - p.z)/max(uSunDir.z, .08);
  vec3 e2 = p + uSunDir*t2;
  float south = step(742., e2.x)*step(e2.x, ${f1(PLAN.loomX1 - 1.2)})*smoothstep(6., 6.4, e2.y)*(1. - smoothstep(71.6, 72., e2.y))
    *gap(e2.x - 736., 16., .55)*gap(e2.x - 740., 8., .22)*gap(e2.y - 6., 11., .2);
  // the roof's ridge strip of glass, sixteen metres broad: its bars every eight metres, a roof beam every sixteen
  float t3 = (${f1(PLAN.loomHigh)} - p.y)/max(uSunDir.y, .1);
  vec3 e3 = p + uSunDir*t3;
  float ridge = step(742., e3.x)*step(e3.x, ${f1(PLAN.loomX1 - 1.2)})*step(abs(e3.z), 8.)*gap(e3.x, 8., .25)*gap(e3.z, 8., .25)*gap(e3.x - 736., 16., .5);
  // THE END WALL IS OAK: its one opening is the window behind the loom's cloth, so the only sun from the east is what
  // has passed the silk. It is soft (silk scatters it): it lies in the cloth's colours on the polished floor, the
  // ground's with the figures' colour coming and going, and is a faint warmth on whatever stands higher.
  // (the same for the two outer lengths that hang before their own windows beside the loom)
  vec3 q = p + uSunDir*((${f1(PLAN.loomX)} - p.x)/max(uSunDir.x, .2));
  float qz = abs(q.z);
  float inLoom = step(qz, ${f1(PLAN.warpHalf)})*step(${f1(PLAN.rollY + 1.2)}, q.y)*step(q.y, ${f1(PLAN.fellY)});
  float inOuter = step(${f1(PLAN.outerZ[0])}, qz)*step(qz, ${f1(PLAN.outerZ[1])})*step(${f1(PLAN.outerY[0])}, q.y)*step(q.y, ${f1(PLAN.outerY[1])});
  float inCloth = max(inLoom, inOuter)*step(p.x, ${f1(PLAN.loomX - 0.6)});
  vec3 through = clothLight(q.zy)*mix(1., .2, smoothstep(0., 3., p.y));
  return vec3(min(south + ridge, 1.)) + inCloth*through;
}
// the two glazed links beside the Mill (30 m broad, 44 m high): the sun through a link's south wall and roof of
// glass, and through the east link's open end from the Cards' own windows; none inside the drum
float linkSun(vec3 p){
  float x0 = p.x < 420. ? 300. : 494.6, x1 = p.x < 420. ? 345.4 : 540.;
  float t = (15. - p.z)/max(uSunDir.z, .08);
  vec3 e = p + uSunDir*t;
  float m = step(x0, e.x)*step(e.x, x1)*step(6.2, e.y)*step(e.y, 44.)*gap(e.x - x0 - 3.75, 7.5, .38)*gap(e.y - 6., 9.5, .2);
  float t2 = (44. - p.y)/max(uSunDir.y, .1);
  vec3 r = p + uSunDir*t2;
  m += step(x0, r.x)*step(r.x, x1)*step(abs(r.z), 15.)*gap(r.x - x0 - 3.75, 7.5, .38)*gap(r.z, 7.5, .2);
  vec3 q = p + uSunDir*((540. - p.x)/max(uSunDir.x, .2));
  m += step(420., p.x)*step(abs(q.z), 15.)*step(q.y, 44.)*cardSun(vec3(540.5, q.y, q.z));
  return clamp(m, 0., 1.)*(1. - inDrum(p));
}
vec3 sunAt(vec3 p){
  if (p.x < 300.) return vec3(storeSun(p));
  if (p.x < 540.) return vec3(linkSun(p));
  if (p.x < 740.) return vec3(cardSun(p));
  return loomSun(p);
}
`;

// ---------------------------------------------------------------- shading: brass, steel, iron, timber, card and silk
// shadeMetal and shadeDull read the direction from the thing to the eye (named at this file's head).
export const SHADE_GLSL = /* glsl */`
// THE FILL: the sky's light from the glass overhead (the more of it the higher a thing stands), and the floor's warm
// bounce (the stronger the nearer the floor, on upright and downward faces); an upright face's last metre and a half
// over the floor stands in its own foot's shade
vec3 fillAt(vec3 N, vec3 p){
  // (the Store and its crossing stand under a whole vault of glass: the sky's fill is the fuller there, and its floor
  // lies in the sun from wall to wall, so what the floor sends back is the stronger: most on the upright faces of
  // whatever stands low over it, one law for the whole Store as far as its vault goes, to the crossing's east wall;
  // it dies away inside the west link's first thirty metres)
  float store = 1. - smoothstep(300., 330., p.x);
  // THE NAVE IS DEEPER TOWARD THE CROSSING: its west end is a whole wall of glass under the vault's own line, and the
  // sky's fill is fullest there; it falls along the nave to the crossing, whose east end is the Mill's dark arch
  float west = 1. - smoothstep(${f1(PLAN.storeX0)}, ${f1(PLAN.storeX1)}, p.x);
  float k = mix(1., .72, millDark(p))*(1. + store*(.2 + .45*west));
  float upright = 1. - abs(N.y), low = 1. - smoothstep(0., 20., p.y);
  vec3 sky = uSkyCol*(.5 + .5*N.y)*(.86 + .3*smoothstep(0., 40., p.y));
  // AMONG THE RANKS the sky's light reaches a face only after glancing off the brass about it: it is the warmer and
  // the deeper there (from the innermost rank outward to the outermost that stands on this visit, under the beds)
  float az = abs(p.z), zOut = uRanks > 2.5 ? ${f1(PLAN.rankZ[2] + 1.5)} : ${f1(PLAN.rankZ[1] + 1.5)};
  float among = smoothstep(${f1(PLAN.rankZ[0] - 3.5)}, ${f1(PLAN.rankZ[0] - 1)}, az)*(1. - smoothstep(zOut, zOut + 2.5, az))*(1. - smoothstep(26., 30., p.y))*(1. - smoothstep(${f1(PLAN.storeX1 - 5)}, ${f1(PLAN.storeX1 - 1)}, p.x));
  sky *= mix(vec3(1.), vec3(.95, .7, .42), .7*among);
  // (the Cards' floor lies in the south windows' sun from end to end: what it sends up to a face turned downward,
  // a loop's underside or a gallery's, is the stronger there)
  // and the hall's long south wall of windows lights such a face from the side with the sky's own colour
  float cards = smoothstep(536., 544., p.x)*(1. - smoothstep(736., 744., p.x));
  // (the two links are tunnels of glass too, their floors in the sun from wall to wall: what the floor sends back
  // onto the upright faces low over it, the plinths under the glass and the legs that stand there, is as the Store's)
  float links = (1. - smoothstep(15.5, 17., abs(p.z)))*(smoothstep(${f1(PLAN.crossX1 - 4)}, ${f1(PLAN.crossX1)}, p.x)*(1. - smoothstep(${f1(PLAN.archW)}, ${f1(PLAN.archW + 4)}, p.x))
    + smoothstep(${f1(PLAN.archE - 4)}, ${f1(PLAN.archE)}, p.x)*(1. - smoothstep(${f1(PLAN.cardX0)}, ${f1(PLAN.cardX0 + 4)}, p.x)));
  vec3 bounce = uFloorCol*((.5 - .5*N.y)*.8*(1. + 3.5*store + 1.2*cards) + .5*low*upright*(1. + 13.5*max(store, links)))
    + uSkyCol*(.5 - .5*N.y)*.3*cards;
  // (what the Store's floor sends up comes from the floor about a thing's own foot: where that floor lies in a
  // rib's band of shade the bounce is the less, so a column in a band stands in soft shade beside its lit neighbours)
  bounce *= mix(1., mix(.35, 1., ribShade(vec3(p.x, 0., p.z))), store);
  float foot = mix(1., mix(.62, 1., smoothstep(0., 1.6, p.y)), upright);
  // (the Loom hall's south wall is glass from its plinth to its eaves: it lights the hall's downward faces, the
  // roof's boards and the galleries' undersides, from the side with the sky's own colour)
  bounce += uSkyCol*(.5 - .5*N.y)*.3*smoothstep(736., 744., p.x);
  return (sky + bounce)*k*.82*foot;
}
// THE LANTERN'S DAYLIGHT IS MORNING LIGHT: sunlit glass, most of it the sun's own colour and a little the sky's
vec3 lanternCol(){ return uSkyCol*.15 + uSunCol*.31; }
vec3 millLight(vec3 p, vec3 N){
  vec2 d = p.xz - MILL_C; float r = length(d);
  vec3 toL = vec3(MILL_C.x, ${f1(PLAN.lanternY)}, MILL_C.y) - p; float dl = max(length(toL), 1.); toL /= dl;
  float shaft = exp(-r*r/(21.*21.));
  float lant = (710.*max(toL.y, 0.)/(dl*dl))*(.25 + .75*max(dot(N, toL), 0.))*7.2 + shaft*(.3 + .7*max(dot(N, toL), 0.))*1.9;
  vec3 toC = vec3(d/max(r, 1.)*(75. - r), ${f1(PLAN.clerY)} - p.y); float dc = max(length(toC), 1.); toC /= dc;
  float cler = (.2 + .8*max(dot(N, toC), 0.))*clamp(34./dc, .3, 1.6)*1.75;
  // what the lit floor under the lantern sends back up to the dome and the beds' undersides
  float pool = max(-N.y, 0.)*(.2 + .6*exp(-r*r/(45.*45.)))*.6;
  // the lantern's daylight is the one warm light of the room (lanternCol); the clerestory's is the sky's own blue
  // the brass's own bounce: among the fans the air is a little warm with what thirty lit columns send to one another
  float among = exp(-(r - 27.)*(r - 27.)/(14.*14.))*(1. - smoothstep(30., 44., p.y))*(1. - abs(N.y)*.6);
  return (lanternCol()*(lant + pool) + uSkyCol*cler + vec3(.95, .66, .28)*among*.3)*inDrum(p);
}
vec3 envAt(vec3 R, vec3 p){
  vec3 roof = uSkyCol*mix(1.75, 1.3, smoothstep(250., 300., p.x))*(.5 + .5*gap(p.x + R.x/max(R.y, .15)*30., 7., 1.3));
  // (the Store's walls are glass to the floor's plinth: a face turned level shows the bright glass, not a dark wall)
  float glassy = 1. - smoothstep(250., 300., p.x);
  vec3 wall = mix(uFloorCol*.85, uSkyCol*(.85 + .25*glassy), smoothstep(-.1 - .15*glassy, .3 - .25*glassy, R.y));
  vec3 lit = mix(wall, roof, smoothstep(.3, .62, R.y));
  lit = mix(lit, (uFloorCol*.5 + uSkyCol*.2)*(1. + 4.6*glassy), smoothstep(-.05, -.5, R.y));
  float r = length(p.xz - MILL_C);
  vec3 mill = mix(vec3(.07, .084, .105), vec3(.24, .18, .09), exp(-(r - 27.)*(r - 27.)/(16.*16.)));
  mill += uSkyCol*.95*smoothstep(.06, .16, R.y)*(1. - smoothstep(.34, .5, R.y));
  mill += uSkyCol*1.7*smoothstep(.8, .93, R.y)*exp(-r*r/(46.*46.));
  mill = mix(mill, uFloorCol*.2 + uSkyCol*.07, smoothstep(0., -.4, R.y));
  return mix(lit, mill, millDark(p));
}
// the gate's lamp: a standing light of the place about the gate's own middle under the loom, the same at every clock
// and from every place; it falls on the foot posts' inner faces, the roller's underside and the floor before the gate
vec3 ringLamp(vec3 p, vec3 N){
  vec3 to = vec3(${f1(PLAN.loomX)}, ${f1(PLAN.gateH / 2)}, 0.) - p; float d = length(to);
  return vec3(1., .86, .62)*(max(dot(N, to/max(d, .5)), 0.)*.75 + .25)*2.6/(1. + d*d/150.)*(1. - smoothstep(34., 46., d));
}
// the sun that reaches the place last shaded (kept for a material that adds to it: the wheels' broad highlight)
vec3 gSun = vec3(0.);
vec3 lightWith(vec3 N, vec3 p, vec3 sun){
  return fillAt(N, p) + sun*max(dot(N, uSunDir), 0.) + millLight(p, N) + ringLamp(p, N);
}
vec3 lightAt(vec3 N, vec3 p){
  gSun = uSunCol*sunAt(p);
  return lightWith(N, p, gSun);
}
vec3 shadeMetal(vec3 F0, vec3 N, vec3 p, float polish){
  vec3 V = normalize(cameraPosition - p);
  vec3 R = reflect(-V, N);
  float glint = pow(clamp(dot(R, uSunDir), 0., 1.), 48.)*3.;
  float edge = pow(clamp(1. - dot(N, V), 0., 1.), 4.);
  gSun = uSunCol*sunAt(p);
  vec3 c = F0*(lightWith(N, p, gSun)*(.62 - .3*polish) + envAt(R, p)*(.38 + .5*polish) + gSun*glint*polish);
  return c + envAt(R, p)*edge*.22;
}
vec3 shadeDull(vec3 alb, vec3 N, vec3 p, float gloss){
  vec3 V = normalize(cameraPosition - p);
  vec3 R = reflect(-V, N);
  float edge = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
  return alb*lightAt(N, p) + envAt(R, p)*(.07 + .42*edge)*gloss;
}
vec3 hazed(vec3 c, vec3 p){
  float d = distance(cameraPosition, p)*uFogDen;
  vec3 air = mix(uFogCol, uFogCol*.42, millDark(p)*.6);
  return mix(c, air, 1. - exp(-d*d));
}
// teeth painted along a bar: they fade to their mean tone before they are finer than the picture's grain
float toothBand(float v, float period){
  float w = fwidth(v)/period;
  return mix(step(.5, fract(v/period)), .5, smoothstep(.3, .7, w));
}
`;

// ---------------------------------------------------------------- the one law of turning (wheels and fingers read it)
// A column's draws: col = (run period, run phase, wave period, wave phase), all seconds of the world's clock; seed is
// the column's own number; nW its count of wheels; k a wheel's place in the stack, 0 at the foot.
// THE RUN: every run period the wheels turn together for RUN_LEN seconds, each from the place it stood at to a new
// place of its own (an odd count of scallops), the start passing up the stack in RUN_PASS seconds.
// THE WAVE: every wave period a carry climbs from the foot, WAVE_STEP seconds a wheel; as it reaches a wheel the
// wheel jumps ONE scallop (a quick turn with a little overshoot that settles). Every fourth wave stops part way up.
// A THING WITH NO SPINDLE CARRIES NO WAVE, by rule: its wave period is NO_WAVE (0), and every reader of the law
// below (carrySince and wheelTurn in the shaders; stopOf, waveBegins and wavesWithin on the processor) reads a
// period of 0 as no carry at all: reach 0, cPrev 0, no wave counted. So it is for the Store's columns, for a
// pinion at a rack and for a wheel on a turning shaft (LONG_AGO: the seconds since a carry that never came).
export const WAVE_STEP = 0.03, RUN_LEN = 0.9, RUN_PASS = 0.6, JUMP_RATE = 40, WAVE_SHARE = 0.8, NO_WAVE = 0, LONG_AGO = 1e3;
// the light of a wheel the carry has just thrown is held at this much (white is 1)
const KNOT_TOP = 0.85;
export const WHEEL_GLSL = /* glsl */`
float restAt(float n, float k, float seed){
  return 2.*floor(5.*hash21(vec2(n*1.37 + seed*9.17, k*2.11 + seed))) + mod(n, 2.);
}
// how high wave m of a column climbs: every fourth wave of a column stops part way up (at three tenths to nine tenths
// of the stack), the others go over the top. Which round of four is a column's short one goes by its part of the
// period (so a rib's three columns never stop short in the same round); how high, by plain arithmetic on the wave's
// count and the column's own number (on a grid of eighths). The processor counts the same waves (stopOf below).
float stopOf(float m, vec4 col, float seed, float nW){
  float q = floor(seed*8. + .5), part = floor(col.w/max(col.z, 1e-3)*15.);
  float h = fract((m*13. + q*7.)/29.);
  return mod(m + part, 4.) < .5 ? floor(nW*(.3 + .6*h) + .5) : nW + 1.;
}
// seconds since the carry last reached wheel k; reach is 1 when that wave came as high as k (a column with no
// spindle, wave period 0: reach 0, and the carry is long ago)
float carrySince(vec4 col, float seed, float nW, float k, float t, out float reach){
  float lag = k*${f1(WAVE_STEP)}, has = step(1e-3, col.z), P = max(col.z, 1e-3);
  float m = floor((t + col.w - lag)/P);
  reach = has*step(k + .5, stopOf(m, col, seed, nW));
  return has > .5 ? t - (m*P - col.w + lag) : ${f1(LONG_AGO)};
}
// where wheel k stands at clock t, in scallops (a tenth of a turn each); act is 1 at the jump and dies away
float wheelTurn(vec4 col, float seed, float nW, float k, float t, out float act){
  float Pr = col.x, rlag = k/nW*${f1(RUN_PASS)}, lag = k*${f1(WAVE_STEP)};
  float tr = t + col.y - rlag;
  float n = floor(tr/Pr), s = tr - n*Pr, Sn = t - s;
  float has = step(1e-3, col.z), P = max(col.z, 1e-3);
  float mPrev = ceil((Sn - Pr + col.w - lag)/P);
  float aPrev = mPrev*P - col.w + lag;
  float cPrev = has*step(aPrev, Sn - 1e-4)*step(k + .5, stopOf(mPrev, col, seed, nW));
  float a0 = restAt(n - 1., k, seed) + cPrev;
  float delta = mod(restAt(n, k, seed) - a0, 10.);
  float e = smoothstep(0., 1., clamp(s/${f1(RUN_LEN)}, 0., 1.));
  float reach;
  float since = carrySince(col, seed, nW, k, t, reach);
  float cNow = reach*step(Sn, t - since);
  float jump = 1. - exp(-since*${f1(JUMP_RATE)})*cos(since*55.);
  act = cNow*exp(-since*7.);
  return a0 + delta*e + cNow*jump;
}
`;
// the same law of the wave on the processor, for counts without a picture: how high wave m climbs, when it begins at
// its column's foot, and whether a wave is climbing (or begins) inside a span of the clock
export function stopOf(m, col, seed, nW) {
  if (!(col[2] > NO_WAVE)) return 0;
  const q = Math.floor(Math.fround(seed) * 8 + 0.5), part = Math.floor(Math.fround(col[3]) / Math.fround(col[2]) * 15), x = (m * 13 + q * 7) / 29, h = x - Math.floor(x);
  return ((m + part) % 4 + 4) % 4 < 0.5 ? Math.floor(nW * (0.3 + 0.6 * h) + 0.5) : nW + 1;
}
export function waveBegins(col, m) { return col[2] > NO_WAVE ? m * col[2] - col[3] : Infinity; }
export function wavesWithin(col, nW, t0, t1) {
  if (!(col[2] > NO_WAVE)) return 0;
  // a wave that began at b is on the column until b + nW*WAVE_STEP at the most (a short one for a third of that or more)
  const first = Math.ceil((t0 - nW * WAVE_STEP * 0.3 + col[3]) / col[2]), last = Math.floor((t1 + col[3]) / col[2]);
  return Math.max(0, last - first + 1);
}

// ---------------------------------------------------------------- plain geometry: a small mesher (flat faces, hard edges)
// position, normal, color (linear rgb), aSurf (metal 0 or 1, polish 0..1), aPaint (what the shader paints on the face)
export function makeMesher() {
  const P = [], N = [], C = [], S = [], Q = [];
  const NOQ = [0, 0, 0, 0];
  // o.dress: the paint every face takes that names none of its own (a hall's own grain: plates, boards, brick)
  const o = { count: 0, dress: NOQ };
  const put = (p, n, c, s, q) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); S.push(s[0], s[1]); Q.push(q[0], q[1], q[2], q[3]); };
  o.tri = (a, b, c, col, surf, q = o.dress, nrm = null) => {
    let n = nrm; q = q || o.dress;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
    // (q may be three paints, one a corner: a paint that runs across a face, as a pier's lit arris does)
    const qa = Array.isArray(q[0]) ? q : [q, q, q];
    if (!n) { n = [nx / l, ny / l, nz / l]; n = [n, n, n]; }
    // a face given its normals is wound to agree with them, so that its front is the side its normals name
    else if (nx * n[0][0] + ny * n[0][1] + nz * n[0][2] < 0) { put(a, n[0], col, surf, qa[0]); put(c, n[2], col, surf, qa[2]); put(b, n[1], col, surf, qa[1]); o.count++; return; }
    put(a, n[0], col, surf, qa[0]); put(b, n[1], col, surf, qa[1]); put(c, n[2], col, surf, qa[2]); o.count++;
  };
  o.quad = (a, b, c, d, col, surf, q = o.dress, nrm = null) => {
    const four = q && Array.isArray(q[0]);
    o.tri(a, b, c, col, surf, four ? [q[0], q[1], q[2]] : q, nrm && [nrm[0], nrm[1], nrm[2]]); o.tri(a, c, d, col, surf, four ? [q[0], q[2], q[3]] : q, nrm && [nrm[0], nrm[2], nrm[3]]);
  };
  // a box of full sizes sx, sy, sz about (cx, cy, cz), turned ry about the upright
  o.box = (cx, cy, cz, sx, sy, sz, col, surf, opt = {}) => {
    const ry = opt.ry || 0, cs = Math.cos(ry), sn = Math.sin(ry), q = opt.paint || o.dress, skip = opt.skip || '';
    const w = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    // opt.arris: an upright pier: each upright face is painted as a sunk panel between two lit arrises (aPaint 12,
    // the face's breadth in metres, and a measure that runs from -1 at one upright edge to 1 at the other)
    const f = (a, b, c, d) => {
      if (!opt.arris || a[1] === b[1] && b[1] === c[1] && c[1] === d[1]) return o.quad(w(...a), w(...b), w(...c), w(...d), col, surf, q);
      const br = Math.hypot(b[0] - a[0], b[2] - a[2]);
      o.quad(w(...a), w(...b), w(...c), w(...d), col, surf, [[12, 0, br, -1], [12, 0, br, 1], [12, 0, br, 1], [12, 0, br, -1]]);
    };
    if (!skip.includes('+x')) f([hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]);
    if (!skip.includes('-x')) f([-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]);
    if (!skip.includes('+y')) f([-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]);
    if (!skip.includes('-y')) f([-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]);
    if (!skip.includes('+z')) f([-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]);
    if (!skip.includes('-z')) f([hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]);
  };
  // a round bar or drum from a to b (any direction), radius r (r2 at b), smooth sides, flat ends where asked
  // (opt.arris, on a bar of flat sides: each side is painted as a pier's face is, with a lit arris at either edge)
  o.rod = (a, b, r, segs, col, surf, opt = {}) => {
    const r2 = opt.r2 ?? r, q = opt.paint || o.dress;
    const ax = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = ax.length(); ax.divideScalar(len || 1);
    const u = new THREE.Vector3(0, 1, 0); if (Math.abs(ax.y) > 0.9) u.set(1, 0, 0);
    const e1 = new THREE.Vector3().crossVectors(ax, u).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1).normalize();
    const ring = (base, rad, i) => { const t = (i / segs) * Math.PI * 2 + (opt.twist || 0), c = Math.cos(t), s = Math.sin(t); return [[base[0] + (e1.x * c + e2.x * s) * rad, base[1] + (e1.y * c + e2.y * s) * rad, base[2] + (e1.z * c + e2.z * s) * rad], [e1.x * c + e2.x * s, e1.y * c + e2.y * s, e1.z * c + e2.z * s]]; };
    for (let i = 0; i < segs; i++) {
      const [a0, n0] = ring(a, r, i), [a1, n1] = ring(a, r, i + 1), [b0] = ring(b, r2, i), [b1] = ring(b, r2, i + 1);
      const flat = opt.flat ? null : [n0, n1, n1, n0];
      if (opt.arris && opt.flat) { const br = Math.hypot(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]); o.quad(a0, a1, b1, b0, col, surf, [[12, 0, br, -1], [12, 0, br, 1], [12, 0, br, 1], [12, 0, br, -1]], flat); }
      else o.quad(a0, a1, b1, b0, col, surf, q, flat);
      if (opt.capA) o.tri(a, a1, a0, col, surf, q);
      if (opt.capB) o.tri(b, b0, b1, col, surf, q);
    }
  };
  o.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    g.setAttribute('aSurf', new THREE.BufferAttribute(new Float32Array(S), 2));
    g.setAttribute('aPaint', new THREE.BufferAttribute(new Float32Array(Q), 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  return o;
}
export const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// ---------------------------------------------------------------- THE ONE WHEEL FORM
// A wheel is a broad ring: ten flat crests on the full radius with ten notches (scallops) cut between them. One crest
// of each wheel is faced with blue steel, so that a turn is seen. No figure is cut on any wheel.
// The outline of one scallop, as angles (degrees from the scallop's own start) and radii (a share of R):
//   segs 3: crest from -7 to +7 at R, the notch's floor at 18 at R - depth;  segs 2: a crest point at 0, the floor at 18.
export function wheelOutline(R, depth, segs) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const a0 = i * 36;
    if (segs === 3) out.push([a0 - 7, R, i], [a0 + 7, R, i], [a0 + 18, R - depth, i]);
    else out.push([a0, R, i], [a0 + 18, R - depth, i]);
  }
  return out.map(([deg, r, i]) => ({ x: Math.cos(deg * Math.PI / 180) * r, z: Math.sin(deg * Math.PI / 180) * r, r, i, crest: r >= R - 1e-6 }));
}
// A column: an iron foot, a still steel core (seen as the collar between wheels), the wheels, a plain cap.
// o: { wheels, R, depth, pitch, thick, segs, capped, foot, y0 (first wheel's underside), topRod (the axis on above the cap) }
// Attributes: aBand (the wheel's place in the stack, -1 for what stands still), aRim (0 notch floor .. 1 crest),
// aFace (0 brass, 1 the blue steel crest, 2 steel, 3 iron).
export function wheelStackGeometry(o) {
  const P = [], N = [], B = [], Rm = [], F = [];
  const put = (p, n, band, rim, face) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); B.push(band); Rm.push(rim); F.push(face); };
  const tri = (a, b, c, band, rims, face, nrm) => {
    let n = nrm;
    if (!n) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      n = [nx / l, ny / l, nz / l]; n = [n, n, n];
    }
    put(a, n[0], band, rims[0], face); put(b, n[1], band, rims[1], face); put(c, n[2], band, rims[2], face);
  };
  const ol = wheelOutline(o.R, o.depth, o.segs), n = ol.length;
  for (let k = 0; k < o.wheels; k++) {
    const ya = o.y0 + k * o.pitch, yb = ya + o.thick;
    for (let j = 0; j < n; j++) {
      const p = ol[j], q = ol[(j + 1) % n];
      // a face belongs to the scallop of its first corner; the blue steel is scallop 0's crest face
      const face = o.segs === 3 ? (p.i === 0 && p.crest && q.crest ? 1 : 0) : (p.i === 0 && p.crest ? 1 : 0);
      const ra = p.crest ? 1 : 0, rb = q.crest ? 1 : 0;
      const A = [p.x, ya, p.z], Bq = [q.x, ya, q.z], Cq = [q.x, yb, q.z], D = [p.x, yb, p.z];
      tri(A, Cq, Bq, k, [ra, rb, rb], face); tri(A, D, Cq, k, [ra, ra, rb], face);
    }
    if (o.capped) for (let i = 0; i < 10; i++) {
      // the crest's upper and under faces, from the notch floors on either hand
      const c0 = ol[(i * 3) % n], c1 = ol[(i * 3 + 1) % n], h1 = ol[(i * 3 + 2) % n], h0 = ol[(i * 3 - 1 + n) % n];
      for (const [y, up] of [[yb, 1], [ya, 0]]) {
        const a = [h0.x, y, h0.z], b = [c0.x, y, c0.z], c = [c1.x, y, c1.z], d = [h1.x, y, h1.z], nn = [0, up ? 1 : -1, 0], n3 = [nn, nn, nn];
        if (up) { tri(a, c, b, k, [0, 1, 1], 0, n3); tri(a, d, c, k, [0, 0, 1], 0, n3); } else { tri(a, b, c, k, [0, 1, 1], 0, n3); tri(a, c, d, k, [0, 1, 0], 0, n3); }
      }
    }
  }
  const ring = (y0, y1, r0, r1, segs, face, capTop, capBot) => {
    for (let i = 0; i < segs; i++) {
      const t0 = (i / segs) * Math.PI * 2, t1 = ((i + 1) / segs) * Math.PI * 2, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      const a = [c0 * r0, y0, s0 * r0], b = [c1 * r0, y0, s1 * r0], c = [c1 * r1, y1, s1 * r1], d = [c0 * r1, y1, s0 * r1];
      const n0 = [c0, 0, s0], n1 = [c1, 0, s1];
      tri(a, c, b, -1, [0.5, 0.5, 0.5], face, [n0, n1, n1]); tri(a, d, c, -1, [0.5, 0.5, 0.5], face, [n0, n0, n1]);
      if (capTop) tri([0, y1, 0], c, d, -1, [0.5, 0.5, 0.5], face, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      if (capBot) tri([0, y0, 0], a, b, -1, [0.5, 0.5, 0.5], face, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
  };
  const top = o.y0 + o.wheels * o.pitch;
  if (!o.bare) {
    ring(o.foot * 0.5, top, o.R - o.depth - 0.012, o.R - o.depth - 0.012, 12, 2, false, false);
    ring(0, o.foot * 0.55, o.R * 1.3, o.R * 1.18, 12, 3, true, false);
    ring(o.foot * 0.55, o.y0 - 0.06, o.R * 0.86, o.R * 0.8, 12, 3, true, false);
    ring(top - 0.1, top + (o.cap ?? 1.2), o.R * 0.82, o.R * 0.6, 12, 3, true, false);
    if (o.topRod) ring(top + (o.cap ?? 1.2), top + (o.cap ?? 1.2) + o.topRod, 0.16, 0.16, 6, 2, false, false);
  } else ring(0.02, o.thick - 0.02, o.R - o.depth - 0.012, o.R - o.depth - 0.012, 10, 2, true, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('aBand', new THREE.BufferAttribute(new Float32Array(B), 1));
  g.setAttribute('aRim', new THREE.BufferAttribute(new Float32Array(Rm), 1));
  g.setAttribute('aFace', new THREE.BufferAttribute(new Float32Array(F), 1));
  g.userData = { wheels: o.wheels, R: o.R, top: top + (o.cap ?? 1.2) + (o.topRod || 0), triangles: P.length / 9 };
  return g;
}

// ---------------------------------------------------------------- racks: the toothed bars' slide, a habit of each bar
// a bar goes out by 3 to 5 m and back within 1.7 s of every period of its own (2.6 to 4.2 s); its pinions turn with it
export const RACK_GLSL = /* glsl */`
float rackSlide(float seed, float t){
  float P = 2.6 + 1.6*hash11(seed*3.1 + .7), amp = 3. + 2.*hash11(seed*1.3 + 2.);
  float s = mod(t + hash11(seed*7.7)*P, P);
  float x = sin(3.14159265*clamp(s/1.7, 0., 1.));
  return amp*x*x;
}
`;
// ---------------------------------------------------------------- the grain of iron, oak and brick (painted on a face)
// A face's own measure is taken from its place and its facing (the two axes of the world it lies along). Every joint,
// rivet and board fades to the face's mean tone before it is finer than the picture's grain (fwidth, named at the head).
// aPaint.x: 6 iron plates (aPaint.y broad, aPaint.z high) with rivet rows; 7 oak boards (aPaint.y broad; aPaint.w 0 lying,
// 1 upright); 8 brick (courses aPaint.y high); 9 iron plates on the Mill's round wall (measured round the centre).
// the Mill's round wall: a frame's rail is WALL_RAIL to either hand of a level joint; a stile reaches WALL_STILE
// from an upright joint (beside a bay's rack, beside a pilaster); the frame stands at WALL_FRAME of the wall's tone
const WALL_RAIL = 0.32, WALL_STILE = [1.32, 0.82], WALL_FRAME = 1.28;
export const GRAIN_GLSL = /* glsl */`
float lineAt(float v, float halfW){
  float w = fwidth(v);
  return (1. - smoothstep(halfW - w, halfW + w, abs(fract(v) - .5)))*clamp(halfW*2./max(w, 1e-4), 0., 1.);
}
vec3 grainAt(vec4 q, vec3 p, vec3 N){
  vec2 f = abs(N.y) > .7 ? p.xz : (abs(N.x) > abs(N.z) ? p.zy : p.xy);
  if (q.x > 8.5) { vec2 d = p.xz - MILL_C; f = vec2(atan(d.y, d.x + 1e-4)*length(d), p.y); }
  if (q.x < 6.5 || q.x > 8.5) {
    // plates: a dark joint, a paler chamfer beside it, a row of rivets inside every joint
    vec2 size = vec2(max(q.y, .5), max(q.z, .5)), g = f/size + .5, id = floor(g), w = fwidth(g);
    float joint = max(lineAt(g.x, .012), lineAt(g.y, .012));
    vec2 e = (abs(fract(g) - .5))*size;
    float nearEdge = min(e.x, e.y);
    vec2 rv = vec2(fract(f.x/.6) - .5, fract(f.y/.6) - .5)*.6;
    float along = e.x < e.y ? abs(rv.y) : abs(rv.x);
    float fineness = clamp(max(w.x*size.x, w.y*size.y)/.09, 0., 1.);
    float rivet = (1. - smoothstep(.05, .09, length(vec2(nearEdge - .22, along))))*(1. - fineness);
    float tone = .9 + .2*hash21(id*1.7 + 3.1);
    // (on the Mill's round wall each plate is a SUNK PANEL IN A RAISED FRAME: a rail WALL_RAIL to either hand of
    // every level joint, a stile beside every upright one (the joints stand behind a pilaster or a bay's rack by
    // turns: the stile is what shows beside each). The frame is the lighter iron; the panel's field is lighter
    // toward its head, where the light comes from; the lower rail's top edge and the stiles' edges catch the light
    // as lit arrises, and the upper rail keeps a band of shade under it. Each goes to its mean before the grain
    // is coarser than it.)
    if (q.x > 8.5) {
      float atPilaster = mod(floor(f.x/size.x + .5), 2.), stile = mix(${f1(WALL_STILE[0])}, ${f1(WALL_STILE[1])}, atPilaster);
      float wx = max(w.x*size.x, 1e-4), wy = max(w.y*size.y, 1e-4), seenX = clamp(.2/wx, 0., 1.), seenY = clamp(.2/wy, 0., 1.);
      float up = fract(g.y + .5), yIn = up*size.y, dx = e.x - stile;
      float inX = smoothstep(-wx, wx, dx), inY = smoothstep(-wy, wy, e.y - ${f1(WALL_RAIL)}), field = inX*inY;
      tone = mix(1., tone, field)*mix(${f1(WALL_FRAME)}, .74 + .5*up, field);
      // the lower rail's top edge (the light falls on it) and the shade under the upper rail
      float ledge = (1. - smoothstep(.1 - wy, .1 + wy, abs(yIn - ${f1(WALL_RAIL)})))*inX*seenY;
      float under = (1. - smoothstep(0., .9, size.y - ${f1(WALL_RAIL)} - yIn))*field*seenY;
      // a stile's edge is a lit arris, and the field beside it lies a hand in its shade
      float arris = (1. - smoothstep(.07 - wx, .07 + wx, abs(dx)))*inY*seenX;
      float beside = (1. - smoothstep(0., .35, dx))*field*seenX;
      tone *= (1. + 1.1*ledge + .8*arris)*(1. - .38*under)*(1. - .22*beside);
    }
    return vec3(tone*(1. - .5*joint)*(1. + .5*rivet)*(1. - .12*smoothstep(.5, .1, nearEdge)*(1. - fineness)));
  }
  if (q.x < 7.5) {
    // boards: lying (along the face's first axis) or upright; each its own tone, butt joints staggered, a long streak
    vec2 b = q.w > .5 ? f.yx : f;
    float wB = max(q.y, .1), row = floor(b.y/wB), jx = b.x/7. + hash11(row*1.3)*5.;
    float joint = max(lineAt(b.y/wB + .5, .03), lineAt(jx + .5, .004)*step(fwidth(b.y/wB), .5));
    float tone = .82 + .36*hash21(vec2(row, floor(jx))*1.9 + 7.);
    float fine = clamp(fwidth(b.y/wB)/.6, 0., 1.);
    float streak = .94 + .12*sin(b.x*1.7 + row*2.1 + 2.*sin(b.x*.31 + row))*(1. - fine);
    return vec3(mix(tone, 1., fine)*streak*(1. - .45*joint));
  }
  // brick: courses in running bond, each brick its own tone, pale joints
  float hC = max(q.y, .2), course = floor(f.y/hC), bx = f.x/(hC*3.) + .5*mod(course, 2.);
  float joint = max(lineAt(f.y/hC + .5, .05), lineAt(bx + .5, .017)*step(fwidth(f.y/hC), .5));
  float fine = clamp(fwidth(f.y/hC)/.6, 0., 1.);
  float tone = mix(.78 + .44*hash21(vec2(floor(bx), course)*1.3 + 2.), 1., fine);
  return vec3(tone) + vec3(.35, .32, .28)*joint;
}
`;
const v3 = (hex, k = 1) => { const c = lin(hex, k); return `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})`; };
const COLOURS_GLSL = /* glsl */`
const vec3 BRASS = ${v3('#c9a04a')}; const vec3 BRASS_EDGE = ${v3('#f0d48a')}; const vec3 BRASS_DARK = ${v3('#6e5320')};
const vec3 BLUE_STEEL = ${v3('#3d5f8f')}; const vec3 STEEL = ${v3('#8e9cae')}; const vec3 IRON = ${v3('#16191f')};
const vec3 IRON_EDGE = ${v3('#5c6a7c')};
`;
// ---------------------------------------------------------------- the wheels' material (the Store's and the Mill's)
// y0: the height of the first wheel's underside in the column's own frame (the wheel's pitch is 0.6, its thickness 0.5).
export function makeWheelMaterial(shared, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uY0: { value: o.y0 ?? 2 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aBand, aRim, aFace;
      attribute vec4 aCol; attribute vec2 aMeta;
      uniform float uY0;
      varying vec3 vW, vN, vRad; varying float vRim, vFace, vAct, vTint, vEdge;
      ${LIGHT_GLSL}
      ${WHEEL_GLSL}
      ${RACK_GLSL}
      void main(){
        vec3 p = position, n = normal; float act = 0., tint = 1., edge = 0., pin = 0.;
        if (aBand > -.5) {
          float turn = wheelTurn(aCol, aMeta.x, max(aMeta.y, 1.), aBand, uTime*uTempo, act);
          // a pinion (a single wheel at a rack; its count of wheels is given as -1) turns as its rack slides past it
          pin = step(aMeta.y, 0.);
          turn = mix(turn, rackSlide(aMeta.x, uTime*uTempo)*aCol.x, pin); act *= 1. - pin;
          // a wheel on a turning shaft (its count given as -2) turns steadily, aCol.x scallops a second
          turn = mix(turn, uTime*uTempo*aCol.x + aCol.y, step(aMeta.y, -1.5));
          float a = turn*.62831853, c = cos(a), s = sin(a);
          p.xz = vec2(c*p.x - s*p.z, s*p.x + c*p.z);
          n.xz = vec2(c*n.x - s*n.z, s*n.x + c*n.z);
          tint = .86 + .28*hash21(vec2(aBand*1.7, aMeta.x*3.3));
          edge = (position.y - uY0 - aBand*.6)*4. - 1.;
        }
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n);
        vRad = mat3(modelMatrix)*mat3(instanceMatrix)*vec3(position.x, 0., position.z);
        // (a pinion is seen on its face: its face is as bright as a worn rim)
        vRim = mix(aRim, max(aRim, .62), pin); vFace = aFace; vAct = act; vTint = tint; vEdge = edge;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vRad; varying float vRim, vFace, vAct, vTint, vEdge;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${COLOURS_GLSL}
      void main(){
        vec3 N = normalize(vN); float back = gl_FrontFacing ? 0. : 1.;
        N = mix(N, -N, back);
        vec3 col;
        if (vFace < 1.5) {
          float worn = smoothstep(.8, 1., clamp(abs(vEdge), 0., 1.));
          float wear = clamp(vRim*.7 + worn*.45, 0., 1.);
          vec3 F0 = mix(mix(BRASS_DARK, BRASS, .4), BRASS, smoothstep(0., .55, wear));
          F0 = mix(F0, BRASS_EDGE, smoothstep(.72, 1.1, wear));
          F0 = mix(F0*vTint, BLUE_STEEL*1.5, step(.5, vFace));
          col = shadeMetal(F0, N, vW, .5 + .35*wear);
          // THE STACK AS A ROUND: by the stack's own radial direction (not a scallop's), a broad soft highlight down
          // it where it turns between the sun and the eye, and a darker edge where it turns away from the eye
          vec3 Nr = normalize(vRad + vec3(1e-4, 0., 0.)), V = normalize(cameraPosition - vW);
          float facing = clamp(dot(Nr, V), 0., 1.);
          float broad = pow(clamp(dot(Nr, normalize(uSunDir + V)), 0., 1.), 5.);
          col = col*mix(.5, 1.08, smoothstep(.05, .7, facing)) + F0*gSun*broad*.55*vRim;
          // a wheel's rim stands in the shade of the wheel over it: darker toward its under edge
          col *= mix(.5, 1., smoothstep(0., .7, vRim))*mix(1., .3, back)*mix(.8, 1.12, smoothstep(-1., .6, vEdge));
          // THE WAVE'S KNOT: a wheel the carry has just thrown stands bright, its rim taking the lantern's light full
          // and its marked tooth flashing as it goes round; the glow dies in a fifth of a second (six wheels of climb).
          // THE KNOT STAYS BRASS: a thrown wheel's light is held under white (its strongest colour at KNOT_TOP and
          // the others in their measure), so it stands as bright gold; a wheel at rest is not touched.
          float act = clamp(vAct, 0., 1.);
          vec3 knot = col*(1. + 2.2*act) + mix(BRASS_EDGE, vec3(.75, .86, 1.), step(.5, vFace))*(uSkyCol*.5 + uSunCol*.14)*act*mix(1.2, 3.2, step(.5, vFace))*vRim;
          col = knot/max(1., mix(1., max(knot.r, max(knot.g, knot.b))/${f1(KNOT_TOP)}, smoothstep(0., .1, act)));
        } else if (vFace < 2.5) col = shadeMetal(STEEL, N, vW, .6)*.7;
        else col = shadeDull(IRON, N, vW, 1.) + IRON_EDGE*.04;
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// columns: [{ x, y, z, col: [run period, run phase, wave period (NO_WAVE: none), wave phase], seed }]; one form, many times
export function makeWheelColumn(geometry, material, columns) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'aBand', 'aRim', 'aFace']) g.setAttribute(k, geometry.getAttribute(k));
  const n = columns.length, col = new Float32Array(n * 4), meta = new Float32Array(n * 2);
  const mesh = new THREE.InstancedMesh(g, material, n), m = new THREE.Matrix4();
  columns.forEach((c, i) => {
    col.set(c.col, i * 4); meta[i * 2] = c.seed; meta[i * 2 + 1] = geometry.userData.wheels;
    mesh.setMatrixAt(i, m.makeTranslation(c.x, c.y || 0, c.z));
  });
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 4));
  g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 2));
  g.userData = { ...geometry.userData };
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere(); mesh.computeBoundingBox();
  // for counts by place: wheels turn about their own axes, so each column's body is its own drum, whatever the clock
  mesh.userData = { kind: 'wheels', R: geometry.userData.R * 1.3, top: geometry.userData.top, columns };
  return mesh;
}

// ---------------------------------------------------------------- pasteboard under white (cards and their piles)
// PASTEBOARD KEEPS ITS TONE IN THE FULL SUN. A lit face's colour goes over a soft shoulder from its knee up toward a
// top it never reaches (its hue kept: every channel by the one factor). IVORY: PASTE.knee to PASTE.top. A DYED
// pasteboard is a deep tone and stays one in the sun: its knee and top are PASTE.dyeKnee and PASTE.dyeTop of its own
// tone's value (its brightest channel), so a deep dye stays deep. PASTE.roof: an ivory card under the Loom hall's
// ridge of glass keeps the knee and top it has there.
export const PASTE = { knee: 0.64, top: 0.9, dyeKnee: 0.68, dyeTop: 1.04, roof: [0.72, 1.02] };
export const PASTE_GLSL = /* glsl */`
vec3 underTop(vec3 col, float knee, float top){
  float m = max(col.r, max(col.g, col.b)), over = max(m - knee, 0.);
  return col*((min(m, knee) + (top - knee)*(1. - exp(-over/(top - knee))))/max(m, 1e-4));
}
`;
// ---------------------------------------------------------------- the plain material: iron, steel, timber, pasteboard
// aPaint.x: 0 nothing; 1 teeth along x; 2 teeth along the distance from the Mill's centre; 3 teeth round the Mill's
// centre (72 m out); 4 soft courses up the height; 5 teeth up the height. aPaint.y the teeth's period in metres,
// aPaint.z the bar's own number, aPaint.w how far it slides (0..1).
// aPaint.x 13: A PILE OF CARDS, a folded stack (aPaint.y a card's course in metres; aPaint.z the pile's middle along
// its long axis; aPaint.w a sum: 1 the long axis lies along z (else along x), 2 its laces are ivory (else crimson),
// 4 its pasteboard is dyed). FOLD_N courses lie between two folds of the chain.
// a pier's lit arris is ARRIS broad; the Mill's round wall takes WALL_FOOT of its tone at the floor, WALL_HEAD at its head
const ARRIS = 0.11, WALL_FOOT = 0.7, WALL_HEAD = 1.6, FOLD_N = 6;
// a moulded pier: its quirk and its bead, the face's breadth over which a pier is moulded, its rails' step up the
// pier, and its tone at its foot and at its head inside the Mill
const QUIRK = 0.07, BEAD = 0.12, PIER_BROAD = 1.2, PIER_RAIL = 3.75, PIER_FOOT = 0.9, PIER_HEAD = 1.5;
export function makePlainMaterial(shared, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    side: o.side ?? THREE.FrontSide,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 aSurf; attribute vec4 aPaint;
      varying vec3 vW, vN, vC; varying vec2 vS; varying vec4 vQ;
      void main(){
        vec4 lp = vec4(position, 1.); vec3 ln = normal;
        #ifdef USE_INSTANCING
        lp = instanceMatrix*lp; ln = mat3(instanceMatrix)*ln;
        #endif
        vec4 w = modelMatrix*lp;
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*ln); vC = color; vS = aSurf; vQ = aPaint;
        #ifdef USE_INSTANCING_COLOR
        vC *= instanceColor;
        #endif
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vC; varying vec2 vS; varying vec4 vQ;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${RACK_GLSL}
      ${GRAIN_GLSL}
      ${PASTE_GLSL}
      void main(){
        vec3 N = normalize(vN); N = gl_FrontFacing ? N : -N;
        vec2 d = vW.xz - MILL_C;
        vec3 alb = vC;
        float pile = step(12.5, vQ.x);
        if (pile > .5) {
          // A PILE OF CARDS (aPaint 13): the chain lies folded on itself. On the pile's upright faces every card's
          // edge is a fine course, and every FOLD_N courses a deeper line stands where the chain turns back; the
          // bundle between two folds is lighter at its head than at its foot. On its two long faces stand the two
          // rows of lace knots, a knot to a course (the laces lie 1.25 m to either hand of a card's middle). Each
          // goes to its mean before it is finer than the grain.
          float up = 1. - smoothstep(.3, .7, abs(N.y));
          float c = vW.y/max(vQ.y, .02), b = c/${f1(FOLD_N)}, wb = fwidth(b), fb = fract(b);
          float fold = (1. - smoothstep(.02, .1 + wb, min(fb, 1. - fb)))*clamp(.3/max(wb, 1e-4), 0., 1.);
          float bundle = mix(1., .78 + .34*fb, clamp(.5/max(wb, 1e-4), 0., 1.));
          alb *= mix(1., (1. - .3*lineAt(c, .14))*(1. - .55*fold)*bundle, up);
          float isZ = mod(vQ.w, 2.), ivoryLace = step(1.5, mod(vQ.w, 4.));
          float along = abs(mix(vW.x, vW.z, isZ) - vQ.z), wa = fwidth(along);
          float knot = (1. - smoothstep(.07, .07 + wa, abs(along - 1.25)))*(1. - smoothstep(.2, .3 + fwidth(c), abs(fract(c) - .5)))*clamp(.14/max(wa, 1e-4), 0., 1.);
          alb = mix(alb, mix(vec3(.6, .03, .05), vec3(.807, .738, .565), ivoryLace), knot*up*mix(abs(N.z), abs(N.x), isZ));
        }
        else if (vQ.x > 11.5) {
          // A PIER (aPaint 12): a sunk panel between two lit arrises. vQ.w runs from -1 to 1 across the face, vQ.z is
          // the face's breadth: the arris is ARRIS broad whatever the pier's size, and fades before the grain is coarser.
          // A BROAD PIER (a jamb of the Mill's arches: its face over PIER_BROAD) IS MOULDED: inside the arris a quirk
          // (a line of shade, QUIRK broad) and a bead (a second lit roll, BEAD broad), and its sunk panel is crossed
          // every PIER_RAIL metres by a raised rail whose top edge catches the light and which keeps a band of shade
          // under it. Inside the Mill a pier stands in the clerestory's light, which falls down it: its head is
          // brighter than its foot (PIER_FOOT to PIER_HEAD of its tone).
          float hb = max(vQ.z, .05)*.5, edge = (1. - abs(vQ.w))*hb, wE = max(fwidth(vQ.w)*hb, 1e-4), seen = clamp(${f1(ARRIS)}/wE, 0., 1.);
          float arris = (1. - smoothstep(${f1(ARRIS)} - wE, ${f1(ARRIS)} + wE, edge))*seen;
          float broad = smoothstep(${f1(PIER_BROAD)} - .1, ${f1(PIER_BROAD)}, hb*2.);
          float quirk = smoothstep(${f1(ARRIS)} - wE, ${f1(ARRIS)} + wE, edge)*(1. - smoothstep(${f1(ARRIS + QUIRK)} - wE, ${f1(ARRIS + QUIRK)} + wE, edge))*seen*broad;
          float bead = smoothstep(${f1(ARRIS + QUIRK)} - wE, ${f1(ARRIS + QUIRK)} + wE, edge)*(1. - smoothstep(${f1(ARRIS + QUIRK + BEAD)} - wE, ${f1(ARRIS + QUIRK + BEAD)} + wE, edge))*seen*broad;
          float inner = mix(${f1(ARRIS)}, ${f1(ARRIS + QUIRK + BEAD)}, broad);
          float sunk = smoothstep(inner, inner + ${f1(ARRIS * 1.2)} + wE, edge)*clamp(hb/(4.*wE), 0., 1.);
          float ym = (fract(vW.y/${f1(PIER_RAIL)} + .5) - .5)*${f1(PIER_RAIL)}, wy = max(fwidth(vW.y), 1e-4), seenY = clamp(.16/wy, 0., 1.);
          float rail = (1. - smoothstep(.16 - wy, .16 + wy, abs(ym)))*broad*seenY;
          float ledge = (1. - smoothstep(.05 - wy, .05 + wy, abs(ym - .16)))*broad*seenY;
          float under = smoothstep(-.8, -.16, ym)*(1. - smoothstep(-.16 - wy, -.16 + wy, ym))*broad*seenY;
          sunk *= 1. - rail;
          alb *= (1. + 1.5*arris + 1.1*bead + 1.2*ledge*sunk)*(1. - .4*quirk)*(1. - mix(.34, .26, broad)*sunk)*(1. - .34*under*sunk)*(1. - .4*lineAt(vW.y/3.75 + .5, .012)*(1. - broad));
          alb *= mix(1., mix(${f1(PIER_FOOT)}, ${f1(PIER_HEAD)}, smoothstep(2., 40., vW.y)), inDrum(vW));
        }
        else if (vQ.x > 5.5) {
          alb *= grainAt(vQ, vW, N);
          // THE MILL'S ROUND WALL (aPaint 9) in the clerestory's light, which falls down it: its head is brighter
          // than its foot
          if (vQ.x > 8.5) alb *= mix(${f1(WALL_FOOT)}, ${f1(WALL_HEAD)}, smoothstep(2., 40., vW.y));
        }
        else if (vQ.x > .5) {
          float along = vQ.x < 1.5 ? vW.x : (vQ.x < 2.5 ? length(d) : (vQ.x < 3.5 ? atan(d.y, d.x + 1e-4)*72. : vW.y));
          // (a bar's number lies on a grid of eighths: rounded back to it here, no smear across a face reaches the slide)
          float tb = toothBand(along - rackSlide(floor(vQ.z*8. + .5)/8., uTime*uTempo)*vQ.w, max(vQ.y, .05));
          float soft = step(3.5, vQ.x)*(1. - step(4.5, vQ.x));
          alb *= mix(mix(.25, .74, soft), mix(1.3, 1.05, soft), tb);
        }
        vec3 col = vS.x > .5 ? shadeMetal(alb, N, vW, vS.y) : shadeDull(alb, N, vW, vS.y);
        // (a pile is pasteboard: its lit faces stay under white as its chain's cards do, a dyed pile under its own top)
        if (pile > .5) { float dyed = step(3.5, vQ.w), pv = max(vC.r, max(vC.g, vC.b)); col = underTop(col, mix(${f1(PASTE.knee)}, ${f1(PASTE.dyeKnee)}*pv, dyed), mix(${f1(PASTE.top)}, ${f1(PASTE.dyeTop)}*pv, dyed)); }
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// ---------------------------------------------------------------- the barrels' material (the three great drums and their studs)
// A BARREL READS AS A BARREL BY ITS LIGHT, not by a new colour. aPaint.x 10: the drum's own face (aPaint.y the
// barrel's number, aPaint.z its head's height); 11: a stud; anything else is shaded as the plain material shades it.
//  - THE FLANKS: the lantern's daylight leans from the sun's side of the sky, so the flank turned toward the seed's
//    sun is the lit one and the flank turned from it the shaded one (BARREL_LEE to BARREL_LIT of the light, by the
//    face's own bearing about the barrel's axis: the world's, whatever the barrel's step);
//  - THE HOOPS AND THE HEAD RIM: a steel hoop every HOOP_STEP metres between two rows of studs and a rim at the
//    head, each with its lit upper edge and the line of shade under it;
//  - A STUD IS A RAISED PEG: its upper faces take the light, its under faces are in its own shade, and on the drum
//    under every stud lies the small shade it casts (the places are read from the same deal that sets the studs:
//    uStuds, one texel a place);
//  - the steel's long highlight up the lit flank and a pale edge at either limb (by the direction to the eye), which
//    stand the metal off from the dark wall behind.
// Every painted line fades to its mean before it is finer than the picture's grain (fwidth).
export const STUD_STEP = 1.1, STUD_N = 36, STUD_ROWS = 48, HOOP_STEP = 11, BARREL_LEE = 0.42, BARREL_LIT = 1.45;
export function makeBarrelMaterial(shared, studs) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uStuds: { value: studs } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 aSurf; attribute vec4 aPaint;
      varying vec3 vW, vN, vC, vL; varying vec2 vS, vAxis; varying vec4 vQ;
      void main(){
        vec4 lp = vec4(position, 1.); vec3 ln = normal;
        #ifdef USE_INSTANCING
        lp = instanceMatrix*lp; ln = mat3(instanceMatrix)*ln;
        #endif
        vec4 w = modelMatrix*lp;
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*ln); vC = color; vS = aSurf; vQ = aPaint; vL = lp.xyz;
        vAxis = (modelMatrix*vec4(0., 0., 0., 1.)).xz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vC, vL; varying vec2 vS, vAxis; varying vec4 vQ;
      uniform sampler2D uStuds;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${COLOURS_GLSL}
      void main(){
        vec3 N = normalize(vN), alb = vC, V = normalize(cameraPosition - vW);
        float drum = step(9.5, vQ.x)*(1. - step(10.5, vQ.x)), stud = step(10.5, vQ.x), upright = 1. - smoothstep(.3, .7, abs(N.y))*drum;
        // the drum's own measure: metres round it and up it, and the stud's place nearest
        float ang = atan(-vL.z, vL.x), cellA = ang*${f1(STUD_N / (2 * Math.PI))}, i = floor(cellA + .5);
        float fx = (cellA - i)*${f1(2 * Math.PI * PLAN.barrelR / STUD_N)}, row = (vL.y - ${f1(PLAN.barrelFoot + 1)})/${f1(STUD_STEP)}, k = floor(row + .5), fy = (row - k)*${f1(STUD_STEP)};
        float grain = max(fwidth(vL.y), fwidth(cellA)*${f1(2 * Math.PI * PLAN.barrelR / STUD_N)});
        float has = step(.5, texture2D(uStuds, (vec2(mod(i + ${f1(STUD_N)}, ${f1(STUD_N)}), vQ.y*${f1(STUD_ROWS)} + clamp(k, 0., ${f1(STUD_ROWS - 1)})) + .5)/vec2(${f1(STUD_N)}, ${f1(3 * STUD_ROWS)})).r)*step(-.5, k);
        float shed = has*(1. - smoothstep(.1, .34, abs(fx)))*smoothstep(-.8, -.5, fy)*(1. - smoothstep(-.2, -.05, fy))*(1. - clamp(grain/.3, 0., 1.));
        // the hoops and the head rim
        float hv = (vL.y - ${f1(PLAN.barrelFoot + 1 - STUD_STEP / 2)})/${f1(HOOP_STEP)}, hd = (fract(hv + .5) - .5)*${f1(HOOP_STEP)}, hw = fwidth(vL.y);
        float hoop = (1. - smoothstep(.3 - hw, .3 + hw, abs(hd)))*clamp(.6/max(hw, 1e-4), 0., 1.);
        float rd = vL.y - (vQ.z - .3), rim = (1. - smoothstep(.3 - hw, .3 + hw, abs(rd)))*clamp(.6/max(hw, 1e-4), 0., 1.);
        float band = max(hoop, rim)*drum*upright, bd = mix(hd/.3, rd/.3, step(hoop, rim));
        float under = max((1. - smoothstep(.0, .28, abs(hd + .5)))*clamp(.4/max(hw, 1e-4), 0., 1.), (1. - smoothstep(.0, .28, abs(rd + .5)))*clamp(.4/max(hw, 1e-4), 0., 1.))*(1. - band);
        alb = mix(alb, STEEL*(.7 + .35*bd), band);
        alb *= 1. - drum*upright*(.5*shed + .5*under);
        vec3 col = vS.x > .5 ? shadeMetal(alb, N, vW, vS.y) : shadeDull(alb, N, vW, vS.y);
        // the flanks: lit toward the sun's side, shaded on the lee
        vec2 S = normalize(uSunDir.xz), radial = normalize(vW.xz - vAxis + vec2(1e-4, 0.));
        float flank = mix(${f1(BARREL_LEE)}, ${f1(BARREL_LIT)}, smoothstep(-.7, .7, dot(radial, S)));
        col *= mix(1., flank, max(drum*upright, stud));
        // a stud's own light: its upper faces lit, its under faces in its own shade
        col *= mix(1., mix(.42, 1.7, smoothstep(-.35, .35, N.y)), stud);
        // the steel's long highlight on the lit flank and the pale edge at either limb
        vec2 H = normalize(S + V.xz/max(length(V.xz), 1e-3) + vec2(1e-4, 0.));
        float streak = pow(clamp(dot(radial, H), 0., 1.), 40.), limb = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
        col += drum*upright*(uSkyCol*.55 + uSunCol*.08)*inDrum(vW)*(streak*.5 + limb*.28)*(1. - .6*band);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// the iron and the steel of the house, as the mesher takes them: [colour, [metal, polish]]
export const MATTER = {
  iron: [lin('#16191f', 2.4), [0, 1]], ironLit: [lin('#2c343f', 1.5), [0, 1]], steel: [lin('#8e9cae'), [1, 0.6]], blueSteel: [lin('#3d5f8f', 1.4), [1, 0.7]],
  brass: [lin('#c9a04a'), [1, 0.6]], brassEdge: [lin('#f0d48a'), [1, 0.8]], timber: [lin('#b98a55'), [0, 0.25]], oak: [lin('#4a3524'), [0, 0.5]],
  ivory: [lin('#e9dfc6'), [0, 0.15]], crimson: [lin('#b3202e'), [0, 0.2]],
};

// ---------------------------------------------------------------- the carry spindle's fingers
// A finger is a flat steel blade 0.6 m long, hinged on the still spindle, with a small brass roller at its tip. It
// rests 20 degrees off the wheel; as the wave reaches its wheel it flicks in against the rim and back in 0.12 s.
// Its own frame: the hinge at the origin, +x toward the wheel's axis, y up. roller: false leaves the roller out.
export function fingerGeometry(roller = true) {
  const m = makeMesher(), st = [0.56, 0.61, 0.68], br = [0.79, 0.63, 0.29];
  m.box(0.33, 0, 0, 0.54, 0.26, 0.09, st, [0, 0], { skip: '-x' });
  if (roller) m.rod([0.63, -0.15, 0], [0.63, 0.15, 0], 0.075, 6, br, [1, 0], { capB: true });
  const g = m.build();
  g.setAttribute('aPart', g.getAttribute('aSurf'));
  return g;
}
const REST = 20 * Math.PI / 180;
export function makeFingerMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec2 aPart; attribute vec4 aCol; attribute vec3 aMeta;
      varying vec3 vW, vN; varying float vFlick, vBrass;
      ${LIGHT_GLSL}
      ${WHEEL_GLSL}
      void main(){
        float reach;
        float since = carrySince(aCol, aMeta.x, aMeta.y, aMeta.z, uTime*uTempo + .02, reach);
        float flick = reach*smoothstep(0., .035, since)*(1. - smoothstep(.06, .12, since));
        float a = ${f1(REST)}*(1. - flick), c = cos(a), s = sin(a);
        vec3 p = position, n = normal;
        p.xz = vec2(c*p.x - s*p.z, s*p.x + c*p.z);
        n.xz = vec2(c*n.x - s*n.z, s*n.x + c*n.z);
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n);
        vFlick = flick + reach*exp(-max(since, 0.)*9.)*.6; vBrass = aPart.x;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vFlick, vBrass;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${COLOURS_GLSL}
      void main(){
        vec3 N = normalize(vN);
        vec3 F0 = mix(STEEL*1.2, BRASS_EDGE, step(.5, vBrass));
        vec3 col = shadeMetal(F0, N, vW, .9);
        // the blade turns its bright face to the lantern as it flicks: a glint of the place's own light
        col += F0*(uSkyCol*.7 + uSunCol*.2)*clamp(vFlick, 0., 1.6)*6.;
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// fingers: [{ x, y, z, yaw (the blade's +x toward the wheel's axis), col, seed, nW, k }]
export function makeFingers(geometry, material, fingers) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'aPart']) g.setAttribute(k, geometry.getAttribute(k));
  const n = fingers.length, col = new Float32Array(n * 4), meta = new Float32Array(n * 3);
  const mesh = new THREE.InstancedMesh(g, material, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  fingers.forEach((f, i) => {
    col.set(f.col, i * 4); meta[i * 3] = f.seed; meta[i * 3 + 1] = f.nW; meta[i * 3 + 2] = f.k;
    mesh.setMatrixAt(i, m.compose(pos.set(f.x, f.y, f.z), q.setFromAxisAngle(up, f.yaw), one));
  });
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 4));
  g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 3));
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.computeBoundingBox();
  // for counts by place: a finger swings 20 degrees about its hinge; no point of it moves more than 0.25 m
  mesh.userData = { kind: 'instanced', reach: 0.25 };
  return mesh;
}

// ---------------------------------------------------------------- the barrels' step and the combs' levers
// A barrel turns a twelfth of a turn in 1.2 s and rests 1.8 s: a round of 3 s of the world's clock. A lever is an arm
// pivoted on its post; at each step of its barrel it rocks 6 degrees and back, each lever 0.1 s after the one above.
export const BARREL_ROUND = 3, BARREL_TURN = 1.2;
export function barrelAngle(t, phase, dir) {
  const c = (t + phase) / BARREL_ROUND, n = Math.floor(c), s = (c - n) * BARREL_ROUND, x = Math.min(1, s / BARREL_TURN);
  return dir * (Math.PI / 6) * (n + x * x * (3 - 2 * x));
}
// an arm in its own frame: the pivot at the origin, the arm along +x for one unit of length (the shader gives it its
// true length), a block at its tip (the stud's follower, or the pawl at the column)
export function leverGeometry() {
  const m = makeMesher(), st = MATTER.steel;
  m.box(0.5, 0, 0, 1, 0.34, 0.16, st[0], st[1], { skip: '-x+x' });
  const g = m.build();
  return g;
}
export function makeLeverMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: /* glsl */`
      attribute vec4 aLev;
      varying vec3 vW, vN; varying float vX;
      ${LIGHT_GLSL}
      void main(){
        // aLev: the arm's length, its barrel's phase and its own lag, the sense of its rocking, its tip block's size
        float s = mod(uTime*uTempo + aLev.y, ${f1(BARREL_ROUND)});
        float rock = sin(3.14159265*clamp(s/.6, 0., 1.));
        float a = .1047*rock*rock*aLev.z, c = cos(a), sn = sin(a);
        vec3 p = position, n = normal;
        p.x *= aLev.x; p.y *= 1. + aLev.w*smoothstep(.8, 1., position.x);
        p.xy = vec2(c*p.x - sn*p.y, sn*p.x + c*p.y);
        n.xy = vec2(c*n.x - sn*n.y, sn*n.x + c*n.y);
        vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n); vX = position.x*aLev.x;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying float vX;
      ${LIGHT_GLSL}
      ${SHADE_GLSL}
      ${COLOURS_GLSL}
      void main(){
        vec3 N = normalize(vN);
        vec3 col = shadeMetal(STEEL*1.1, N, vW, .8);
        gl_FragColor = vec4(hazed(col, vW), 1.);
      }`,
  });
}
// levers: [{ x, y, z, yaw, len, phase, sense }]
export function makeLevers(geometry, material, levers) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) g.setAttribute(k, geometry.getAttribute(k));
  const n = levers.length, lev = new Float32Array(n * 4);
  const mesh = new THREE.InstancedMesh(g, material, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
  let longest = 0;
  levers.forEach((f, i) => {
    lev.set([f.len, f.phase, f.sense, 1.2], i * 4); longest = Math.max(longest, f.len);
    mesh.setMatrixAt(i, m.compose(pos.set(f.x, f.y, f.z), q.setFromAxisAngle(up, f.yaw), one));
  });
  g.setAttribute('aLev', new THREE.InstancedBufferAttribute(lev, 4));
  mesh.instanceMatrix.needsUpdate = true;
  // the instances' bounds are taken with the arms at their true lengths (the built form is one unit long)
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(PLAN.cx, 22, PLAN.cz), 40);
  mesh.userData = { kind: 'levers', levers, reach: longest * 0.11 };
  return mesh;
}

// ---------------------------------------------------------------- the Mill's order (ours; no plan holds it)
// Three great barrels in one row across the house's axis. On the south side five ribs spread like a fan, and five
// more on the north side; a rib is a straight rank of three columns. No wheel at the centre, no wheel that links columns, no ring of columns, no hub, no mast.
// Bearings are counted at the centre from +x (east) toward +z (south).
export function millLayout() {
  const ribs = PLAN.ribBearings.map((deg, j) => {
    const b = deg * Math.PI / 180, dx = Math.cos(b), dz = Math.sin(b), south = deg < 180;
    const columns = PLAN.ribR.map((r, c) => ({ x: PLAN.cx + dx * r, z: PLAN.cz + dz * r, r, c, rib: j, south,
      spindle: [PLAN.cx + dx * (r + PLAN.spindleOff), PLAN.cz + dz * (r + PLAN.spindleOff)] }));
    const barrel = south ? 2 : 0, post = [PLAN.cx + dx * PLAN.postR, PLAN.cz + dz * PLAN.postR];
    const toB = [PLAN.cx - post[0], PLAN.cz + PLAN.barrelZ[barrel] - post[1]], dB = Math.hypot(toB[0], toB[1]);
    return { rib: j, deg, b, dx, dz, south, columns, post, barrel, armDir: [toB[0] / dB, toB[1] / dB], armLen: dB - PLAN.barrelR - 0.3 };
  });
  return { ribs };
}
// the thirty columns' draws, from the Mill's own stream. ONE WAVE PERIOD for all thirty (WAVE_SHARE of the stream's
// 3.0 to 3.7 s: 2.4 to 3.0 s, so a climb of 1.5 s fills half of it and more). The phases: a fan's fifteen columns
// share the period out in fifteen equal parts, one column to a part: a rib's three columns stand a third of the
// period apart (parts 0, 5, 10 from its inner column outward) and each rib two parts on from the rib before; each
// column at its own dealt place within its part. So at every clock one column and more of EVERY rib carries a
// climbing wave, and from any place of the round several knots stand in the picture at once.
// rare: the same parts, but the ribs follow one another in order round each fan (rib r one part on from rib r - 1),
// so that the waves are seen to pass from rib to rib across the Mill.
export function millDraws(rng, rare) {
  const one = rng.range(3.0, 3.7), out = [];
  for (let i = 0; i < 30; i++) {
    // (a column's draws, each read: its run's period and phase, its place within its part (on the rare visit every
    // column stands at its part's middle and no place is drawn), its own number)
    const pr = rng.range(2.5, 4), ph = rng.range(0, pr), place = rare ? 0.5 : rng(), seed = rng.range(1, 90);
    const rib = Math.floor((i % 15) / 3), c = i % 3, part = (5 * c + (rare ? rib : 2 * rib)) % 15, P = one * WAVE_SHARE;
    out.push({ col: [pr, ph, P, ((part + 0.05 + 0.9 * place) / 15) * P], seed });
  }
  return out;
}

// ---------------------------------------------------------------- the hero: the Mill's works, built in the house's own
// coordinates (the Mill's centre is PLAN.cx, PLAN.cz), so that the light by place falls on it as it does in the house
export async function buildHero(ctx, opts = {}) {
  const shared = opts.shared || makeShared();
  const rng = opts.rng || ctx.rng.fork('mill');
  const rare = opts.rare ?? false;
  const group = new THREE.Group();
  const lay = millLayout(), draws = millDraws(rng, rare);
  const phase0 = rng.range(0, BARREL_ROUND);
  const NW = PLAN.millWheels, Y0 = PLAN.millFoot;
  // the columns: the south fan (beside the line) in the full form with its crests' faces; the north fan lighter
  const stack = { wheels: NW, R: PLAN.millR, depth: 0.25, pitch: PLAN.millBand, thick: 0.5, foot: Y0, y0: Y0, cap: 2, topRod: 2 };
  const gFull = wheelStackGeometry({ ...stack, segs: 3, capped: (opts.detail ?? 1) >= 1 }), gFar = wheelStackGeometry({ ...stack, segs: 2, capped: false });
  const wheelMat = opts.wheelMaterial || makeWheelMaterial(shared, { y0: Y0 });
  const cols = [];
  lay.ribs.forEach((rib) => rib.columns.forEach((c) => { const d = draws[rib.rib * 3 + c.c]; cols.push({ ...c, col: d.col, seed: d.seed }); }));
  const south = cols.filter((c) => c.south), north = cols.filter((c) => !c.south);
  const mS = makeWheelColumn(gFull, wheelMat, south), mN = makeWheelColumn(gFar, wheelMat, north);
  group.add(mS, mN);
  await ctx.yield();
  // the still spindles and their fingers: one straight row up each spindle, a finger to a wheel at that wheel's height
  const iron = makeMesher(), st = MATTER.steel, ir = MATTER.iron;
  const fS = [], fN = [];
  for (const c of cols) {
    const [sx, sz] = c.spindle;
    iron.rod([sx, 0.6, sz], [sx, Y0 + NW * PLAN.millBand + 1.2, sz], 0.15, 8, st[0], st[1], { capB: true });
    iron.rod([sx, 0, sz], [sx, 0.6, sz], PLAN.footSpindle, 8, ir[0], ir[1], { capB: true, r2: 0.3 });
    const yaw = Math.atan2(-(c.z - sz), c.x - sx);
    for (let k = 0; k < NW; k++) (c.south ? fS : fN).push({ x: sx, y: Y0 + k * PLAN.millBand + 0.25, z: sz, yaw, col: c.col, seed: c.seed, nW: NW, k });
  }
  const fingerMat = makeFingerMaterial(shared);
  group.add(makeFingers(fingerGeometry(true), fingerMat, fS), makeFingers(fingerGeometry(false), fingerMat, fN));
  await ctx.yield();
  // the three great barrels: each a drum of blue steel on an iron footstep, set with brass studs in rows; which
  // places of a row carry a stud is dealt by the stream and stands for nothing
  const plain = opts.plainMaterial || makePlainMaterial(shared);
  const barrels = [], studM = makeMesher(), be = MATTER.brass;
  { const a = [0, -0.2, -0.2], b = [0, -0.2, 0.2], c = [0, 0.2, 0.2], d = [0, 0.2, -0.2], e = [0.36, 0, 0];
    const peg = [11, 0, 0, 0];
    studM.tri(a, e, b, be[0], be[1], peg); studM.tri(b, e, c, be[0], be[1], peg); studM.tri(c, e, d, be[0], be[1], peg); studM.tri(d, e, a, be[0], be[1], peg); }
  // where the studs stand, as the barrels' material reads it: one texel a place (a row of the texture a row of
  // studs, the three barrels one over another), filled by the same deal that sets the studs
  const studAt = new Uint8Array(STUD_N * 3 * STUD_ROWS), studTex = new THREE.DataTexture(studAt, STUD_N, 3 * STUD_ROWS, THREE.RedFormat, THREE.UnsignedByteType);
  studTex.magFilter = studTex.minFilter = THREE.NearestFilter; studTex.generateMipmaps = false;
  const barrelMat = makeBarrelMaterial(shared, studTex);
  const studGeo = studM.build(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  for (let b = 0; b < 3; b++) {
    const top = PLAN.barrelTop[b], R = PLAN.barrelR, g = new THREE.Group(); g.position.set(PLAN.cx, 0, PLAN.cz + PLAN.barrelZ[b]);
    const bm = makeMesher(), bs = [lin('#3d5f8f', 0.55), [1, 0.5]];
    bm.rod([0, PLAN.barrelFoot, 0], [0, top, 0], R, 32, bs[0], bs[1], { capB: true, paint: [10, b, top, 0] });
    bm.rod([0, top, 0], [0, top + 1.5, 0], 0.5, 8, st[0], st[1], { capB: true });
    g.add(new THREE.Mesh(bm.build(), barrelMat));
    const places = [];
    for (let y = PLAN.barrelFoot + 1, k = 0; y < top - 0.5; y += STUD_STEP, k++) for (let i = 0; i < STUD_N; i++) if (rng() < 0.6) { places.push([y, (i / STUD_N) * Math.PI * 2]); studAt[(b * STUD_ROWS + k) * STUD_N + i] = 255; }
    const studs = new THREE.InstancedMesh(studGeo, barrelMat, places.length);
    places.forEach(([y, a], i) => studs.setMatrixAt(i, m4.compose(v.set(Math.cos(a) * R, y, -Math.sin(a) * R), q4.setFromAxisAngle(up, a), one)));
    studs.instanceMatrix.needsUpdate = true; studs.computeBoundingSphere();
    // for counts by place: the barrel turns about its own axis, so its body is its own drum whatever the clock
    g.add(studs); g.userData = { kind: 'spin', R: R + 0.45, y0: PLAN.barrelFoot, y1: top + 1.5 };
    for (const part of g.children) part.userData = g.userData;
    iron.rod([g.position.x, 0, g.position.z], [g.position.x, PLAN.barrelFoot, g.position.z], PLAN.footBarrel, 16, ir[0], ir[1], { capB: true, r2: R + 0.25 });
    group.add(g); barrels.push({ group: g, phase: phase0 + b, dir: b === 1 ? -1 : 1 });
    studTex.needsUpdate = true;
    if (b % 2 === 0) await ctx.yield();
  }
  // WHAT THE WORKS STAND ON: the bare floor. Every column, every spindle and every comb post stands on its own foot
  // with bare floor between (as in the Store), and each barrel on its own footstep: no plate, no plinth, no kerb, no
  // frame about a rib. A foot is the thing's own form splayed where it meets the floor; the floor's own contact shade
  // under it (the world file's floor, by place) is what keeps it from hovering.
  // the combs: a post on each rib's bearing with twelve levers one over another; the middle barrel's two short combs
  const levers = [], lagOf = (j) => 0.1 * j;
  const arm = (x, y, z, dir, len, phase, sense) => levers.push({ x, y, z, yaw: Math.atan2(-dir[1], dir[0]), len, phase, sense });
  for (const rib of lay.ribs) {
    const [px, pz] = rib.post;
    iron.box(px, 19.7, pz, 0.7, 39.4, 0.7, ir[0], ir[1], { ry: -rib.b, skip: '-y' });
    iron.rod([px, 0, pz], [px, 1.1, pz], PLAN.footPost, 4, ir[0], ir[1], { flat: true, r2: 0.5, twist: Math.PI / 4 - rib.b });
    for (let j = 0; j < 12; j++) {
      const y = 35.5 - 2.5 * j, ph = barrels[rib.barrel].phase - lagOf(j) + BARREL_ROUND;
      arm(px, y, pz, rib.armDir, rib.armLen, ph, 1); arm(px, y, pz, [rib.dx, rib.dz], 2.3, ph, -1);
    }
  }
  for (const zs of [-PLAN.midPostZ, PLAN.midPostZ]) {
    iron.box(PLAN.cx, 19, PLAN.cz + zs, 0.5, 38, 0.5, ir[0], ir[1], { skip: '-y' });
    iron.rod([PLAN.cx, 0, PLAN.cz + zs], [PLAN.cx, 0.9, PLAN.cz + zs], 0.6, 4, ir[0], ir[1], { flat: true, r2: 0.36, twist: Math.PI / 4 });
    for (let j = 0; j < 12; j++) {
      const y = 35.5 - 2.5 * j, ph = barrels[1].phase - lagOf(j) + BARREL_ROUND;
      arm(PLAN.cx, y, PLAN.cz + zs, [0, 1], 1.4, ph, 1); arm(PLAN.cx, y, PLAN.cz + zs, [0, -1], 1.4, ph, -1);
    }
  }
  group.add(makeLevers(leverGeometry(), makeLeverMaterial(shared), levers));
  await ctx.yield();
  // the ribs' rack beds: each from its comb's post (which carries its inner end) over the three heads and out to the
  // wall bed, hung from the dome by a rod every hangStep metres between; the wall bed round the drum from jamb to jamb
  // on each side (never across an arch); a pinion under the bed at every column's head, turning as its bar slides
  const domeAt = (r) => (r > 56 ? 46 + 11 * (75 - r) / 19 : 57 + 9 * (56 - r) / 20);
  const pinGeo = wheelStackGeometry({ wheels: 1, R: 0.8, depth: 0.2, pitch: 0.6, thick: 0.5, segs: 3, capped: true, bare: true, foot: 0, y0: 0 });
  const salt = opts.rackSalt || 0, pins = [], teeth = (kind, id) => [kind, 0.5, id + salt, 1];
  for (const rib of lay.ribs) {
    const r0 = PLAN.postR - 0.6, r1 = 71, mid = (r0 + r1) / 2, len = r1 - r0, cx = PLAN.cx + rib.dx * mid, cz = PLAN.cz + rib.dz * mid;
    iron.box(cx, 40.2, cz, len, 1.6, 1.5, ir[0], ir[1], { ry: -rib.b });
    for (let r = PLAN.ribR[2] + PLAN.hangStep; r < r1 - 3; r += PLAN.hangStep) iron.rod([PLAN.cx + rib.dx * r, 41, PLAN.cz + rib.dz * r], [PLAN.cx + rib.dx * r, domeAt(r) - 0.2, PLAN.cz + rib.dz * r], 0.13, 4, ir[0], ir[1], { flat: true });
    for (const side of [-1, 1]) iron.box(cx - rib.dz * side * 0.95, 39.55, cz + rib.dx * side * 0.95, len, 0.5, 0.4, st[0], st[1], { ry: -rib.b, paint: teeth(2, 40 + rib.rib) });
    for (const c of rib.columns) pins.push({ x: c.x, y: 38.45, z: c.z, col: [1 / (0.8 * 0.6283), 0, NO_WAVE, 0], seed: 40 + rib.rib + salt });
  }
  for (const [a0, a1] of [[26, 154], [206, 334]]) for (let a = a0; a < a1 - 0.01; a += 4) {
    const am = (a + 2) * Math.PI / 180, x = PLAN.cx + Math.cos(am) * 72, z = PLAN.cz + Math.sin(am) * 72, chord = 2 * 72 * Math.sin(2 * Math.PI / 180) + 0.12;
    iron.box(x, 40.2, z, 1.5, 1.6, chord, ir[0], ir[1], { ry: -am });
    iron.box(x - Math.cos(am) * 0.95, 39.55, z - Math.sin(am) * 0.95, 0.4, 0.5, chord, st[0], st[1], { ry: -am, paint: teeth(3, a0 > 180 ? 61 : 60) });
  }
  const pinMat = opts.pinionMaterial || makeWheelMaterial(shared, { y0: 0 });
  const pinMesh = makeWheelColumn(pinGeo, pinMat, pins);
  pinMesh.geometry.getAttribute('aMeta').array.forEach((_, i, arr) => { if (i % 2 === 1) arr[i] = -1; });
  group.add(pinMesh);
  const still = new THREE.Mesh(iron.build(), plain);
  still.userData = { kind: 'still' };
  group.add(still);
  const tempo = shared.uTempo;
  return {
    object: group, radius: 40, height: 58, center: new THREE.Vector3(PLAN.cx, 24, PLAN.cz), ground: true, groundY: 0,
    shared, layout: lay, columns: cols, barrels,
    anchors: { centre: new THREE.Vector3(PLAN.cx, 0, PLAN.cz) },
    update(dt, time) {
      if (!opts.shared) shared.uTime.value = time;
      for (const b of barrels) b.group.rotation.y = barrelAngle(time * tempo.value, b.phase, b.dir);
    },
    dispose() {},
  };
}
