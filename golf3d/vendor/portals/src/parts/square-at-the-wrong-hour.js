// HERO of "The Square at the Wrong Hour" (after Giorgio de Chirico): THE CUBE OF A HUNDRED ARCHES.
//
// WHAT IT IS.  A white shell 2 m thick round one room painted green-black: front face (+Z, the face the camera comes at)
// 120 m square, back face 84 m square, 120 m deep, so flanks and roofline plunge to a point of its own while every
// vertical stays plumb.  Five tiers of five arches on each face, each with reveal, three-step impost, stepped base, string
// courses, cornice and corner pilasters.  An arch is solid black until the sight line also passes an arch of a far wall,
// when it holds one or two small clean arches of sky (the far walls' arches are smaller than the front's, on purpose).
// Inside: a black room, rows of yellow and green arches, ruled tongues of ochre light that creep with u.
// Also in the piece: the cube's cast shadow, nobody's shadow (lying square to the facade and standing plumb up a pier by
// the central arch: head and shoulders on the white), a flock of 36 bird
// shadows that run up the front piers and go out in the arches, and (only when shown alone) an ochre apron and the sky.
//
// SIZE AND COST.  radius 92, height 120.  About 32k triangles, 4 draw calls (cube, shadows + tongues, two flocks) + apron and
// sky when shown alone.  Build about 150 ms in steps under 35 ms.  No lights, no textures, no full-screen pass.
//
// PLACING IT.  Origin = centre of the base, +Y up, front toward +Z: turn it half round (rotation.y = PI) in a world whose
// course runs +Z.  Local y 0 is the ground it is set on; its black floor and ochre thresholds stand 0.25 m above that, so
// the world's ground may run straight under it.  Central ground arch: 16 m wide, 19.5 m high (front), 11.2 x 13.7 (back).
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, style, sky, flock, update, setProgress, setFlock, ... }
//   opts.style        a style from makeStyle() to share with the world (default: makes its own from opts.palette)
//   opts.palette      the brief's seven hex strings, in the brief's order
//   opts.detail       0.6..1: fewer arc segments and birds
//   opts.apron        false: no ochre floor disc (the world has its own ground)          opts.sky     false: no sky dome
//   opts.shadow       false: no cast shadow of the cube (add it yourself with addCubeShadow on a tipped floor)
//   opts.shadowAngle  radians off the axis (default 0.3..0.4, the side by seed)          opts.shadowLength (235)
//   opts.figure       false: no figure's shadow at the threshold                          opts.flock   false: no birds
//   opts.flockRun     metres in front of the cube where the birds start (150)
//   opts.flockSize    multiplies the birds' size (1: 2.3 to 2.9 m across)
//   opts.flockLoop    true: the flock is a stream that never stops (each bird comes round again every hero.flockLength metres)
//   opts.tongueGate   u at which the tongues of light appear (0.6), so no arch shows a lit floor from far outside
//   opts.blind        false: open the ground row of the back and flanks too (default: niches, except the back's middle)
// hero.setProgress(u)  the hour: every shadow and tongue creeps, swings and gates by it.  Shown alone it drifts by itself.
// hero.setFlock(m)     metres the flock's leader has run (0 = start, hero.flockLength = all gone); -1 hides it.
//                      Shown alone it loops at 40 m/s.  Wings beat by style.uniforms.uTime (2 a second).
// hero.setRoomFlock(m)  the same for the 22 birds that cross the black room (seen only on the tongues of light).
// hero.update(dt, time, camera)   sets uTime, follows the camera with the sky if it has one.
//
// ANCHORS (local space; see the end of buildHero)
//   frontArch, backArch   { position (sill centre), width, height, facing }
//   flyThrough            six points down the axis at y 7: in by the front arch, out by the back; 8 m to the jambs at the
//                         front, 5.6 m at the back arch (it is 11.2 m wide: keep the line straight there)
//   portalSeat            where the brief puts the end wall's lit arch: 100 m behind the back face, facing the cube
//   viewpoints            reveal (the end arch of arcade A), chase, threshold (the closest pass), room
//   shadowAngle, sun      what the seed chose;  footprint: the four ground corners
//   figurePier            local x of the pier that carries nobody's shadow (+12 or -12; 0 = no figure): send no bird up it
//
// THE STYLE, AND WHAT TO SHADE THE WORLD WITH.  Flat pigment: return post: POST from the world.  Nothing is lit.
//   makeStyle(palette)        -> style: shared uniforms (uU hour, uTime, uAgree + uSunAll + uAgreeAng for "the hour agrees",
//                                the eight pigment uniforms) and the factories below.  Make ONE and pass it as opts.style.
//   style.masonryMaterial({ course: [h, len], line })   (1) every wall.  Two flat tones split by a step on the normal against
//                                the false sun stored per vertex; green-black 0.15 m line on ruled edges and half the arch rim,
//                                never under 1.5 px; a 4 cm ochre hair beside it near to; 3 cm joints on shade faces within
//                                60 m; dry-brush flecks of the other tone, 2 to 4 pixels high at any distance, flat chalk by 28 m.  style.masonry = the cube's own.
//   makeMasonryBuilder()      geometry for it, drawn in face space and pushed through b.xf (bake each building's shear and
//                                taper there); b.sun, b.tone (0 white, 1 red, 2 green-black, 3 ochre), b.swap (u of a lit /
//                                shade swap); b.quad, b.box, b.build.  archCell() = one bay with reveal and inside face,
//                                steppedBand() = impost or base.
//   style.flatMaterial(name)  (2) one pigment: 'uOchre' the ground, 'uInk', 'uRed' ...
//   style.shadowMaterial() + makeShadowBuilder()   (3) cast shadows and tongues of light: opaque, one colour, each vertex
//                                thrown from its own foot along its own angle; swing, stretch and gate by uU in the vertex
//                                shader; an optional fold line carries it up a wall or down a ramp (sb.own = true keeps a
//                                shadow out of "the hour agrees"; the material's uFloorFold tips its floor).  addCubeShadow,
//                                addFigure, addTongue are ready-made shapes.  style.shadow = the cube's own.
//   makeFlock(style, birds, o)  (4) bird shadows on a floor and up one wall, cut by that wall's arches.
//   style.makeSky({ band, low, high })   the two-band dome with the interlocking dry-brush streaks; call sky.follow(camera).
//   STYLE_GLSL, PALETTE, POST, cubeScaleAt(z)
// ADDED BY THE WORLD CODER (all default to the old behaviour)
//   style.uniforms.uHour      what the shadows and tongues creep and swing by (uU still gates them and swaps lit and shade);
//                             setProgress(u, hour = u) sets both
//   makeFlock o.floorFold     [nx, nz, d, slope]: beyond dot(n, xz) > d the floor drops `slope` per metre (a ramp); buildHero
//                             passes opts.floorFold to its own flock.  o.wallUp: the wall's up when it is not the object's +Y.
//                             o.loop: metres after which every bird comes round again (ambient loops)
//   style.makeSky o.line, o.lineColor   a flat line of a third colour on the horizon, degrees tall (the night edition)
//   masonry aArch.w < 0       no ruled joints on this vertex's face (turned and plaster things)
//   masonry aArch = 0,0,0,2   a free-standing solid with joints (builder state b.solid): the solids' short flecks
//   (superseded: tone 4 is now always green-black; tone 5 is an interior's ruled line, painted uDeep, which the world eases from
//    green-black to style.deep = white in shade (#959586) once the camera is inside.  No colour outside the palette.)
//   masonry tone 4, uDeep     THE DRAWN INTERIOR (outside reviewers saw the insides as black panes).  A face of tone 4 is painted
//                             the material's own uDeep, with the ruled line and faint joints.  uDeep starts as green-black (so from
//                             outside every arch is still solid black); the world eases it to style.deep (green-black 73, ochre 27,
//                             the one new mix) once the camera is inside.  b.innerTone = 4 gives archCell's inside face that tone
//                             and draws blind arches as black niches inside too.  The cube's room carries ruled bands, pilasters
//                             and a boarded floor in green-black on it.  Shown alone the room stays green-black (uDeep untouched).
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------------
// STYLE.  Flat pigment: the world returns post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1,
// contrast: 1, vignette: 0, grain: 0 } }, so a hex written is the hex shown.  No inverse tone map anywhere.
// ---------------------------------------------------------------------------------------------------------------
export const PALETTE = ['#1F5A4A', '#E9C75A', '#D9A441', '#E9E2CC', '#17211C', '#B5361E', '#9A4A2C'];
//                       0 green    1 yellow   2 ochre    3 white    4 ink      5 red      6 sienna
export const POST = { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } };

// Shared GLSL: the seven pigments (+ the one mix), a hash for the dry-brush flecks, the ruled-line helper.
export const STYLE_GLSL = /* glsl */`
uniform vec3 uGreen, uYellow, uOchre, uWhite, uWhiteSh, uInk, uRed, uRedSh;
uniform float uU, uTime, uAgree;      // uU: journey progress 0..1 (the hour).  uAgree: 0..1, every false sun swings to uSunAll
uniform vec3 uSunAll;
float sqHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// coverage of a ruled line: d = distance in metres from the ruled edge, w = its width in metres; never under 1.5 pixels
// one layer of dry-brush drag: flecks FIXED TO THE WALL (cells of "cell" metres; a share dens of them, in loose runs along
// some of the rows, hold a fleck 0.35 to 0.9 of the cell long and a quarter of it high).  On screen a fleck is never over
// 2.5 pixels high or 12 long (it is drawn thinner, in its place, as we come close) and fades to flat chalk where it would
// be under a pixel high or 4 long: height is measured by fw.y and length by fw.x, so an oblique face carries no chips.
float sqDrag(vec2 uv, vec2 fw, vec2 cell, float dens){
  vec2 q = uv / cell; float row = floor(q.y);
  float rh = sqHash(vec2(row, 7. + cell.y * 91.)); q.x += rh * 19.;
  float cx = floor(q.x); vec2 f = vec2(fract(q.x), fract(q.y)) - .5;
  float h = sqHash(vec2(cx, row) + cell.x * 3.1), len = .35 + .55 * sqHash(vec2(cx, row) + 3.7);
  float run = sqHash(vec2(floor(q.x / 6. + rh * 3.), floor(row / 2.)) + 5.3);          // runs: six cells long, two rows deep
  float on = step(h, dens * (.25 + 2.4 * step(.62, run)) * step(.3, rh));
  float pxH = .5 * cell.y / fw.y, pxL = len * cell.x / fw.x;
  float halfH = min(.25 * cell.y, 1.25 * fw.y), halfL = min(.5 * len * cell.x, 6. * fw.x);
  float cov = clamp((halfH - abs(f.y) * cell.y) / fw.y + .5, 0., 1.) * clamp((halfL - abs(f.x) * cell.x) / fw.x + .5, 0., 1.);
  return on * cov * smoothstep(.8, 1.5, pxH) * smoothstep(3., 5., pxL);
}
// THE DRY BRUSH ON A FREE-STANDING SOLID (the balls, the cones, the blocks, the plinths): short flecks measured on the thing's
// own surface (uv in metres on it): each 2 to 6 cm long and a centimetre and a half high, lying anywhere in a cell of its
// own, no runs and no rows; a share dens of the cells hold one.  True size at any distance: where a fleck is under a pixel
// it counts for the share of the pixel it covers, so far off the field is flat.
float sqFleck(vec2 uv, vec2 fw, vec2 cell, float dens){
  vec2 q = uv / cell; float row = floor(q.y);
  q.x += sqHash(vec2(row, 3. + cell.y * 57.)) * 23.;
  vec2 id = vec2(floor(q.x), row);
  float on = step(sqHash(id + cell.x * 5.3), dens), len = .31 + .54 * sqHash(id + 1.9);
  vec2 hf = vec2(.5 * len, .225) * cell;
  vec2 jit = (vec2(sqHash(id + 8.1), sqHash(id + 4.4)) - .5) * (cell - 2. * hf);
  vec2 d = abs((fract(q) - .5) * cell - jit);
  vec2 cov = clamp((hf - d) / fw + .5, 0., 1.) * min(2. * hf / fw, 1.);
  return on * cov.x * cov.y;
}
float sqRule(float d, float w, float aa){ float lw = max(w, 1.5 * aa); return 1. - smoothstep(lw - .5 * aa, lw + .5 * aa, d); }
`;

const MASONRY_VERT = /* glsl */`
attribute vec3 aSun;      // this building's own false sun (object space, need not be unit)
attribute vec2 aTone;     // x: 0 white, 1 red, 2 interior green-black, 3 ochre (a threshold);  y: value of u at which lit and shade swap (2 = never)
attribute vec2 aUV;       // metres on the face (for joints, flecks)
attribute vec4 aArch;     // metres from the arch centre at springing (x, y), half width (sign = which half of the rim is ruled), rise;  z = 0: no arch
attribute vec4 aEdge;     // metres to the ruled edge on the left, right, bottom, top of this quad (1e3 = that edge is not ruled)
uniform vec3 uSunAll; uniform float uAgree, uU;
varying float vLit, vDist, vTone; varying vec2 vUV; varying vec4 vArch, vEdge;
void main(){
  vec3 sun = mix(aSun, uSunAll * max(length(aSun), 1e-3), uAgree);
  float l = dot(normal, sun);
  vLit = (uU >= aTone.y) ? -l : l;
  vTone = aTone.x; vUV = aUV; vArch = aArch; vEdge = aEdge;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const MASONRY_FRAG = /* glsl */`
${STYLE_GLSL}
uniform vec2 uCourse;     // course height, stone length (m)
uniform float uLineW;     // 0.15
uniform vec3 uDeep;       // tone 5: an interior's ruled lines: white in shade once we are inside it, green-black from outside
varying float vLit, vDist, vTone; varying vec2 vUV; varying vec4 vArch, vEdge;
void main(){
  if (vTone > 1.5 && vTone < 3.5) { gl_FragColor = vec4(vTone > 2.5 ? uOchre : uInk, 1.); return; }
  if (vTone > 4.5) { gl_FragColor = vec4(uDeep, 1.); return; }      // tone 5: an interior's ruled line (green-black from outside, white in shade once we are inside)
  float deep = step(3.5, vTone);
  float lit = step(0., vLit) * (1. - deep);
  vec3 cl = vTone > .5 ? uRed : uWhite, cs = vTone > .5 ? uRedSh : uWhiteSh;
  if (deep > .5) { cl = uInk; cs = uInk; }
  vec3 field = mix(cs, cl, lit), other = mix(cl, cs, lit);
  vec2 fw = fwidth(vUV); float aa = max(max(fw.x, fw.y), 1e-5);
  // dry-brush flecks of the other tone: the field dragged dry.  Three layers of flecks fixed to the wall (1, 2.5 and 6.5 cm
  // high), each 1 to 2.5 pixels high and 4 to 12 long on screen, in loose horizontal runs, denser beside a ruled line, flat
  // chalk by 28 m; nothing moves on the wall as the camera does
  // (a free-standing solid, aArch.w < 0 or 2, is dragged in short flecks instead: two sheets of cells 7 and 6.6 cm long, 11.5 in
  // a hundred of each holding a fleck a quarter of its cell: 6 per cent of the field, within 12 m of the lens, none by 14 m)
  float fade = 1. - smoothstep(13., 28., vDist);
  float solid = max(step(vArch.w, -.5), step(1.5, vArch.w) * step(abs(vArch.z), 1e-4));
  if (solid > .5) {
    float share = .115 * (1. - smoothstep(12., 14., vDist));
    vec2 fwc = max(fw, vec2(1e-5));
    if (share > 0.) field = mix(field, other, max(sqFleck(vUV, fwc, vec2(.07, .035), share), sqFleck(vUV + 7.31, fwc, vec2(.066, .031), share)));
  } else if (fade > 0.) {
    float dE0 = min(min(vEdge.x, vEdge.y), min(vEdge.z, vEdge.w));
    float dens = (.2 + .35 * (1. - smoothstep(.1, 1.6, dE0))) * fade;
    vec2 fwc = max(fw, vec2(1e-5));
    float fl = max(sqDrag(vUV, fwc, vec2(.1, .02), dens), max(sqDrag(vUV, fwc, vec2(.26, .05), dens), sqDrag(vUV, fwc, vec2(.7, .13), dens)));
    field = mix(field, other, fl);
  }
  // ruled joints, 3 cm, on shade faces only, gone by 60 m
  float jf = (1. - lit) * (1. - smoothstep(26., 60., vDist)) * step(0., vArch.w);      // (aArch.w < 0: no joints, a turned or plaster thing)
  if (jf > 0.) {
    float cy = vUV.y / uCourse.x, r = floor(cy);
    float dy = abs(fract(cy) - .5) * uCourse.x;                       // distance from the middle of the course
    float cx = vUV.x / uCourse.y + .5 * mod(r, 2.) + .13 * r;
    float dx = (.5 - abs(fract(cx) - .5)) * uCourse.y;
    float j = max(sqRule(.5 * uCourse.x - dy, .03, max(fw.y, 1e-5)), sqRule(dx, .03, max(fw.x, 1e-5)));
    field = mix(field, uInk, j * jf * (.8 - .42 * deep));      // (fainter on the half-dark of an interior)
  }
  // the line: green-black, 0.15 m, on the ruled edges only; a 4 cm hair of ochre underpaint between field and line
  float dE = min(min(vEdge.x, vEdge.y), min(vEdge.z, vEdge.w));
  float da = max(fwidth(dE), 1e-5);
  float line = sqRule(dE, uLineW, da);
  float hair = sqRule(dE, max(uLineW, 1.5 * da) + .04, da) * (1. - smoothstep(.02, .05, da));
  float hw = abs(vArch.z), hwS = max(hw, 1e-3);
  vec2 p = vArch.xy; float k = length(p / vec2(hwS, max(vArch.w, 1e-3)));
  float dA = max(p.y < 0. ? abs(p.x) - hwS : (k - 1.) * hwS, 0.);
  float dAa = max(fwidth(dA), 1e-5);
  float half_ = step(-.06 * hwS, p.x * sign(vArch.z)) * step(-1.5 * hwS, p.y) * step(1e-3, hw);
  line = max(line, sqRule(dA, uLineW, dAa) * half_);
  hair = max(hair, sqRule(dA, max(uLineW, 1.5 * dAa) + .04, dAa) * (1. - smoothstep(.02, .05, dAa)) * half_);
  field = mix(field, uOchre, hair * (1. - deep));
  field = mix(field, uInk, line);
  gl_FragColor = vec4(field, 1.);
}`;

// makeStyle(palette): one set of shared uniforms and the four materials of the town.  Shade the whole world with it.
export function makeStyle(palette = PALETTE) {
  const P = PALETTE.map((d, i) => new THREE.Color(palette && palette[i] ? palette[i] : d));
  const whiteSh = P[3].clone().lerp(P[4], 0.4);                   // the one mix: white 60, green-black 40 (in display space)
  { const a = new THREE.Color(), b = new THREE.Color(); a.copy(P[3]).convertLinearToSRGB(); b.copy(P[4]).convertLinearToSRGB(); a.lerp(b, 0.4).convertSRGBToLinear(); whiteSh.copy(a); }
  const uniforms = {
    uGreen: { value: P[0] }, uYellow: { value: P[1] }, uOchre: { value: P[2] }, uWhite: { value: P[3] }, uWhiteSh: { value: whiteSh },
    uInk: { value: P[4] }, uRed: { value: P[5] }, uRedSh: { value: P[6] },
    uU: { value: 0 }, uTime: { value: 0 }, uAgree: { value: 0 }, uSunAll: { value: new THREE.Vector3(-0.5, 0.6, 0.62).normalize() },
  };
  const deep = whiteSh.clone();      // an interior's ruled lines once we are inside it: white in shade, the brief's one mix (no other colour)
  const style = { palette: P, whiteSh, uniforms, deep, ink: P[4] };      // deep: green-black 73, ochre 27 (the underpaint showing through): interiors seen from inside
  // (1) MASONRY.  course = [course height, stone length] in metres.  Geometry comes from makeMasonryBuilder().
  style.masonryMaterial = (o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uDeep: { value: P[4].clone() }, uCourse: { value: new THREE.Vector2(...(o.course || [1.0, 2.6])) }, uLineW: { value: o.line ?? 0.15 } },
    vertexShader: MASONRY_VERT, fragmentShader: MASONRY_FRAG, side: o.side ?? THREE.FrontSide,   // (no polygon offset here: on faces seen edge-on it punches them through the wall in front)
  });
  addFlatSkyShadow(style);
  style.setProgress = (u, hour = u) => { uniforms.uU.value = u; uniforms.uHour.value = hour; };
  return style;
}

// ---------------------------------------------------------------------------------------------------------------
// MASONRY BUILDER.  Everything is drawn in FACE SPACE (a = along the wall, b = up, e = out of the wall, metres) and
// pushed through b.xf(a, b, e) -> [x, y, z], which is where each building's own shear and taper are baked.  State:
// b.sun ([x,y,z] false sun), b.tone (0 white, 1 red, 2 green-black), b.swap (u at which lit and shade swap, 2 = never).
// ---------------------------------------------------------------------------------------------------------------
export function makeMasonryBuilder() {
  const pos = [], nor = [], sun = [], tone = [], uv = [], arch = [], edge = [], idx = [];
  const b = { xf: (a, bb, e) => [a, bb, e], sun: [-0.5, 0.6, 0.62], tone: 0, swap: 2, count: 0, innerTone: 2 };      // innerTone: 2 green-black, 4 the drawn interior
  const NOARCH = [0, 0, 0, 1], SOLID = [0, 0, 0, 2];      // (b.solid: a free-standing solid; its faces carry the solids' short flecks)
  // quad: four corners in face space, n = face-space normal [na, nb, ne] (fixes the winding and picks the uv axes).
  // o.edge = [left, right, bottom, top] booleans: which sides of the quad carry the ruled line.
  // o.arch = [aCentre, bSpring, halfWidth (signed), rise]: the arch whose rim this quad touches.  o.tone overrides.
  b.quad = (c0, c1, c2, c3, n, o = {}) => {
    let cs = [c0, c1, c2, c3];
    const ux = c1[0] - c0[0], uy = c1[1] - c0[1], uz = c1[2] - c0[2], vx = c3[0] - c0[0], vy = c3[1] - c0[1], vz = c3[2] - c0[2];
    const d = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    if (d < 0) cs = [c0, c3, c2, c1];
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    const iu = az >= ax && az >= ay ? 0 : (ax >= ay ? 2 : 0), iv = az >= ax && az >= ay ? 1 : (ax >= ay ? 1 : 2);
    const w = cs.map((c) => b.xf(c[0], c[1], c[2]));
    const e1x = w[1][0] - w[0][0], e1y = w[1][1] - w[0][1], e1z = w[1][2] - w[0][2], e2x = w[3][0] - w[0][0], e2y = w[3][1] - w[0][1], e2z = w[3][2] - w[0][2];
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const c of cs) { u0 = Math.min(u0, c[iu]); u1 = Math.max(u1, c[iu]); v0 = Math.min(v0, c[iv]); v1 = Math.max(v1, c[iv]); }
    const E = o.edge || [0, 0, 0, 0], A = o.arch || (b.solid ? SOLID : NOARCH), T = o.tone ?? b.tone, base = pos.length / 3;
    for (let i = 0; i < 4; i++) {
      const c = cs[i];
      pos.push(w[i][0], w[i][1], w[i][2]); nor.push(nx, ny, nz); sun.push(b.sun[0], b.sun[1], b.sun[2]); tone.push(T, b.swap);
      uv.push(c[iu] + (o.uo || 0), c[iv]);
      arch.push(c[0] - A[0], c[1] - A[1], A[2], A[3]);
      edge.push(E[0] ? c[iu] - u0 : 1e3, E[1] ? u1 - c[iu] : 1e3, E[2] ? c[iv] - v0 : 1e3, E[3] ? v1 - c[iv] : 1e3);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3); b.count += 2;
  };
  // box in face space: a0..a1, b0..b1, e0..e1 (e1 outward).  Faces: front (+e), left, right, top, bottom (o.back adds -e).
  // o.rule: which of the front's sides carry the line, default bottom and right; o.skip = { left, right, top, bottom }.
  b.box = (a0, a1, b0, b1, e0, e1, o = {}) => {
    const sk = o.skip || {}, r = o.rule || [0, 1, 1, 0];
    if (!o.noFront) b.quad([a0, b0, e1], [a1, b0, e1], [a1, b1, e1], [a0, b1, e1], [0, 0, 1], { edge: r, tone: o.tone });
    if (!sk.left) b.quad([a0, b0, e0], [a0, b0, e1], [a0, b1, e1], [a0, b1, e0], [-1, 0, 0], { tone: o.tone, edge: [0, 0, r[2], 0] });
    if (!sk.right) b.quad([a1, b0, e0], [a1, b0, e1], [a1, b1, e1], [a1, b1, e0], [1, 0, 0], { tone: o.tone, edge: [0, 0, r[2], 0] });
    if (!sk.top) b.quad([a0, b1, e0], [a1, b1, e0], [a1, b1, e1], [a0, b1, e1], [0, 1, 0], { tone: o.tone });
    if (!sk.bottom) b.quad([a0, b0, e0], [a1, b0, e0], [a1, b0, e1], [a0, b0, e1], [0, -1, 0], { tone: o.tone });
    if (o.back) b.quad([a0, b0, e0], [a1, b0, e0], [a1, b1, e0], [a0, b1, e0], [0, 0, -1], { tone: o.tone });
  };
  b.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aSun', new THREE.Float32BufferAttribute(sun, 3)); g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 2));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aArch', new THREE.Float32BufferAttribute(arch, 4));
    g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 4));
    g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  };
  return b;
}

// One bay of arcade wall in face space: a cell a0..a0+w by b0..b0+h pierced by a round arch struck a little flat.
// hw = half width of the opening, jamb = height of the springing above b0, rise = height of the arch above the springing
// (rise < hw: "struck flat"), T = wall thickness, seg = segments of the arc, side = +1 / -1: which half of the rim is ruled,
// sill = true adds the floor of the opening (upper storeys), inner = true adds the green-black inside face.
export function archCell(b, a0, b0, w, h, hw, jamb, rise, T, seg, side, sill, inner = true, blind = false, thresh = 0) {
  const ac = a0 + w * 0.5, bs = b0 + jamb, a1 = a0 + w, b1 = b0 + h, A = [ac, bs, hw * side, rise], aL = ac - hw, aR = ac + hw;
  const P = [];
  for (let i = 0; i <= seg; i++) { const t = Math.PI * (1 - i / seg); P.push([ac + hw * Math.cos(t), bs + rise * Math.sin(t), Math.cos(t), Math.sin(t)]); }
  P[0][0] = aL; P[seg][0] = aR; P[0][1] = P[seg][1] = bs;
  // every edge is shared whole with its neighbour (no T-junctions: they leak dots of whatever is behind)
  for (let pass = 0; pass < (inner ? 2 : 1); pass++) {
    const e = pass ? -T : 0, n = [0, 0, pass ? -1 : 1], o = pass ? { tone: b.innerTone, arch: [ac, bs, -hw * side, rise] } : { arch: A };
    for (const [x0, x1] of [[a0, aL], [aR, a1]]) for (const [y0, y1] of [[b0, bs], [bs, b1]]) b.quad([x0, y0, e], [x1, y0, e], [x1, y1, e], [x0, y1, e], n, o);
    if (pass && blind) {      // a blind arch: from inside, plain black wall
      b.quad([aL, b0, e], [aR, b0, e], [aR, bs, e], [aL, bs, e], n, o); b.quad([aL, bs, e], [aR, bs, e], [aR, b1, e], [aL, b1, e], n, o);
      // (drawn interior: the niche shows inside too, as the same solid black arch)
      if (b.innerTone === 4) for (let i = 0; i < seg; i++) b.quad([P[i][0], b0, e - 0.03], [P[i + 1][0], b0, e - 0.03], [P[i + 1][0], P[i + 1][1], e - 0.03], [P[i][0], P[i][1], e - 0.03], n, { tone: 2 });
    } else for (let i = 0; i < seg; i++) b.quad([P[i][0], P[i][1], e], [P[i + 1][0], P[i + 1][1], e], [P[i + 1][0], b1, e], [P[i][0], b1, e], n, o);
  }
  // ... and from outside a niche painted green-black: the same solid black arch as its neighbours
  const Tr = blind ? T - 0.5 : T;      // (the niche stops short of the inner face: nothing pale may touch the black wall from behind)
  if (blind) b.quad([aL, b0, -Tr], [aR, b0, -Tr], [aR, b1, -Tr], [aL, b1, -Tr], [0, 0, 1], { tone: 2 });
  // the reveal: jambs, soffit, sill; on the ground an ochre threshold `thresh` above the ground, with its riser
  b.quad([aL, b0, -Tr], [aL, b0, 0], [aL, bs, 0], [aL, bs, -Tr], [1, 0, 0], {});
  b.quad([aR, b0, -Tr], [aR, b0, 0], [aR, bs, 0], [aR, bs, -Tr], [-1, 0, 0], {});
  for (let i = 0; i < seg; i++) {
    const m = [-(P[i][2] + P[i + 1][2]) * 0.5, -(P[i][3] + P[i + 1][3]) * 0.5, 0], x0 = P[i][0], x1 = P[i + 1][0];
    b.quad([x0, P[i][1], -Tr], [x0, P[i][1], 0], [x1, P[i + 1][1], 0], [x1, P[i + 1][1], -Tr], m, { uo: i * 0.37 });
    if (sill) b.quad([x0, b0, -Tr], [x1, b0, -Tr], [x1, b0, 0], [x0, b0, 0], [0, 1, 0], {});
    if (thresh > 0) {
      b.quad([x0, b0 + thresh, -Tr], [x1, b0 + thresh, -Tr], [x1, b0 + thresh, 0], [x0, b0 + thresh, 0], [0, 1, 0], { tone: 3 });
      b.quad([x0, b0, 0], [x1, b0, 0], [x1, b0 + thresh, 0], [x0, b0 + thresh, 0], [0, 0, 1], { tone: 3 });
    }
  }
}

// A three-step impost (or any stepped band) wrapped round a pier: steps = [[height, projection], ...] bottom to top.
// It runs a0..a1 on the face and returns into the openings on both sides, half way through the wall thickness T.
// Nothing of it lies hidden inside the wall (o.noLeft / o.noRight: no opening on that side).
export function steppedBand(b, a0, a1, b0, T, steps, o = {}) {
  let y = b0;
  for (const [hh, pr] of steps) {
    const l = a0 - (o.noLeft ? 0 : pr), r = a1 + (o.noRight ? 0 : pr);
    b.box(l, r, y, y + hh, 0, pr, { rule: [0, 0, 1, 0], skip: { left: o.noLeft, right: o.noRight } });
    if (!o.noLeft) b.box(l, a0, y, y + hh, -T * 0.5, 0, { skip: { right: true }, back: true, noFront: true });
    if (!o.noRight) b.box(a1, r, y, y + hh, -T * 0.5, 0, { skip: { left: true }, back: true, noFront: true });
    y += hh;
  }
  return y;
}

// ---------------------------------------------------------------------------------------------------------------
// THE CUBE.  Front face (+Z, the face the camera comes at) F m square; back face F * K; depth F.  Verticals plumb, the base
// level, flanks and roofline plunging to a point of the cube's own.  Tiers x tiers arches a face, shell T thick.
// ---------------------------------------------------------------------------------------------------------------
const CUBE = { F: 120, K: 0.7, T: 2, N: 5 };
const FLOOR_Y = 0.25;      // the black floor and the ochre thresholds stand this far above the ground the cube is set on
// s(z): the cube's scale at depth z (1 at the front face z = +F/2, K at the back).  Exported for the world coder.
export function cubeScaleAt(z) { return 1 - (1 - CUBE.K) * (CUBE.F * 0.5 - z) / CUBE.F; }

// the arch of face fi (0 front, 1 back, 2 starboard, 3 port), tier j: { hw, jamb, rise } in face metres (true size * scale there)
function cubeArch(v, fi, j) {
  return fi === 0 || (fi === 1 && j === 0) ? { hw: v.archHalf, jamb: v.jamb, rise: v.rise } : { hw: v.archHalf * v.narrow, jamb: v.jamb - 1.2, rise: v.rise * v.narrow };
}
function cubeFaces() {
  const { F, K } = CUBE, H = F * 0.5, kap = -Math.log(K) / F;            // on the flanks s = exp(-kap * distance run in face space)
  const zOf = (run) => H - (1 - Math.exp(-kap * run)) * F / (1 - K);       // run 0..F in face space -> z, so bays shrink with s
  return [
    { name: 'front', stretch: 1, xf: (a, b, e) => [a, b, H + e] },
    { name: 'back', stretch: 1, xf: (a, b, e) => [-a * K, b * K, -H - e] },
    { name: 'starboard', stretch: kap * F / (1 - K), xf: (a, b, e) => { const z = zOf(a + H), s = cubeScaleAt(z); return [(H + e) * s, b * s, z]; } },
    { name: 'port', stretch: kap * F / (1 - K), xf: (a, b, e) => { const z = zOf(H - a), s = cubeScaleAt(z); return [-(H + e) * s, b * s, z]; } },
  ];
}

async function buildCubeGeometry(ctx, v) {
  const { F, T, N } = CUBE, H = F * 0.5, cell = F / N, b = makeMasonryBuilder();
  b.sun = v.sun; b.innerTone = 4;      // the room is drawn: a second shadow tone ruled in green-black (shown only from inside)
  const faces = cubeFaces();
  for (let fi = 0; fi < 4; fi++) {
    const f = faces[fi]; b.xf = f.xf;
    const side = v.ruleSide[fi];
    for (let j = 0; j < N; j++) {
      // the front's arches are wide; the other three walls' are smaller, so that through a black arch of the front the far
      // wall shows as one or two clean small arches of sky, not as a lattice.  The back's ground row keeps the full size.
      const fp = cubeArch(v, fi, j), hw = fp.hw / f.stretch, b0 = j * cell;
      for (let i = 0; i < N; i++) archCell(b, -H + i * cell, b0, cell, cell, hw, fp.jamb, fp.rise, T, fi === 0 ? v.segFront : v.seg, side, j > 0, true, v.blind[fi][j * N + i], j === 0 ? FLOOR_Y : 0);
      await ctx.yield();
      // imposts on every pier, bases on the ground piers
      const ip = v.impost;
      for (let p = 0; p <= N; p++) {
        const pa0 = p === 0 ? -H : -H + (p - 0.5) * cell + hw, pa1 = p === N ? H : -H + (p + 0.5) * cell - hw, end0 = p === 0, end1 = p === N;
        steppedBand(b, pa0 - (end0 ? ip * 3 : 0), pa1 + (end1 ? ip * 3 : 0), b0 + fp.jamb - v.impostH * 3, T, [[v.impostH, ip], [v.impostH, ip * 2], [v.impostH, ip * 3]], { noLeft: end0, noRight: end1 });
        if (j === 0) steppedBand(b, pa0 - (end0 ? 0.5 : 0), pa1 + (end1 ? 0.5 : 0), 0, T, [[0.9, 0.5], [0.5, 0.28], [0.3, 0.12]], { noLeft: end0, noRight: end1 });
      }
      await ctx.yield();
    }
    // THE ROOM'S OWN DRAWING, on the inner face (green-black on the half-dark; from outside all of it is green-black):
    // a ruled band under every tier, a pilaster of two ruled lines up every pier with a ruled bar at each springing
    {
      const ei = -T - 0.04, nI = [0, 0, -1], ink = { tone: 5 }, hw0 = cubeArch(v, fi, 1).hw / f.stretch, off = Math.min(2.7, (cell * 0.5 - hw0) * 0.55), lw = 0.3;
      for (let j = 1; j < N; j++) b.quad([-H, j * cell - 1.1, ei], [H, j * cell - 1.1, ei], [H, j * cell - 0.6, ei], [-H, j * cell - 0.6, ei], nI, ink);
      for (let p = 1; p < 0; p++) {
        const ac = -H + p * cell;
        for (const sg of [-1, 1]) b.quad([ac + sg * off - lw * 0.5, FLOOR_Y, ei], [ac + sg * off + lw * 0.5, FLOOR_Y, ei], [ac + sg * off + lw * 0.5, F - T, ei], [ac + sg * off - lw * 0.5, F - T, ei], nI, ink);
        for (let j = 0; j < N; j++) { const y = j * cell + cubeArch(v, fi, j).jamb; b.quad([ac - off - 0.9, y - 0.5, ei - 0.02], [ac + off + 0.9, y - 0.5, ei - 0.02], [ac + off + 0.9, y, ei - 0.02], [ac - off - 0.9, y, ei - 0.02], nI, ink); }
      }
      await ctx.yield();
    }
    // corner pilasters, ruled down the arris the false sun does not reach, running a little past the base and the cornice
    const rl = [side < 0 ? 1 : 0, side > 0 ? 1 : 0, 0, 0];
    b.box(-H - 0.12, -H + 2.6, -0.02, F - 3.0 + 0.25, 0, 0.12, { rule: rl, skip: { top: true, bottom: true } });
    b.box(H - 2.6, H + 0.12, -0.02, F - 3.0 + 0.25, 0, 0.12, { rule: rl, skip: { top: true, bottom: true } });
    for (let j = 1; j < N; j++) {
      b.box(-H - 0.25, H + 0.25, j * cell - 1.5, j * cell - 0.9, 0, 0.25, { rule: [0, 0, 1, 0] });
      b.box(-H - 0.55, H + 0.55, j * cell - 0.9, j * cell, 0, 0.55, { rule: [0, 0, 1, 0] });
    }
    b.box(-H - 0.4, H + 0.4, F - 3.0, F - 2.2, 0, 0.4, { rule: [0, 0, 1, 0] });
    b.box(-H - 0.9, H + 0.9, F - 2.2, F - 1.0, 0, 0.9, { rule: [0, 0, 1, 0] });
    b.box(-H - 1.5, H + 1.5, F - 1.0, F, 0, 1.5, { rule: [0, 0, 1, 0] });
    await ctx.yield();
  }
  // roof (outside white, inside green-black) and the black floor of the room, 3 cm proud of the ground
  b.xf = (a, bb, e) => { const s = cubeScaleAt(-a); return [e * s, bb * s, -a]; };       // a: front (-H) to back (+H); e: across
  const R = 12;
  for (let i = 0; i < R; i++) {
    const a0 = -H + (i / R) * F, a1 = -H + ((i + 1) / R) * F;
    b.quad([a0, F, -H - 1.5], [a1, F, -H - 1.5], [a1, F, H + 1.5], [a0, F, H + 1.5], [0, 1, 0], {});
    b.quad([a0, F - T, -H], [a1, F - T, -H], [a1, F - T, H], [a0, F - T, H], [0, -1, 0], { tone: 2 });
    const c0 = Math.max(a0, -H + T), c1 = Math.min(a1, H - T);
    b.xf = (a, bb, e) => { const s = cubeScaleAt(-a); return [e * s, bb, -a]; };
    b.quad([c0, FLOOR_Y, -H + T], [c1, FLOOR_Y, -H + T], [c1, FLOOR_Y, H - T], [c0, FLOOR_Y, H - T], [0, 1, 0], { tone: 4 });
    // the floor is boarded: ruled lines that run to the room's own point (they lie under the tongues of light)
    for (let k = -7; k <= 7; k++) b.quad([c0, FLOOR_Y + 0.02, k * 8 - 0.12], [c1, FLOOR_Y + 0.02, k * 8 - 0.12], [c1, FLOOR_Y + 0.02, k * 8 + 0.12], [c0, FLOOR_Y + 0.02, k * 8 + 0.12], [0, 1, 0], { tone: 5 });
    b.xf = (a, bb, e) => { const s = cubeScaleAt(-a); return [e * s, bb * s, -a]; };
  }
  await ctx.yield();
  const g = b.build();
  await ctx.yield();
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// (2) GROUND, SKY, (3) SHADOWS AND TONGUES: the rest of the style, hung on the style object by makeStyle().
// ---------------------------------------------------------------------------------------------------------------
const SHADOW_VERT = /* glsl */`
attribute vec3 aFoot;     // where this vertex stands on the floor at the caster's base (object space)
attribute vec2 aOff;      // metres along the shadow from the foot, metres across (in the shadow's own swinging frame)
attribute vec4 aAng;      // angle at u = 0 (rad, 0 = +Z, toward +X), swing over the flight (rad), stretch over the flight (fraction), gate u
attribute vec4 aFold;     // fold line: beyond dot(n, xz) > d (n = xy, d = z) the shadow leaves the floor;  w = 1 active, 0 none; 2 active and 3 none, and it keeps its own angle when the hour agrees
attribute vec3 aFoldDir;  // ... and runs on in this direction (straight up a wall = 0,1,0; down a ramp, and so on)
attribute float aKind;    // 0 cast shadow (green-black), 1 tongue of light (ochre)
uniform float uU, uHour, uAgree, uAgreeAng;
uniform vec4 uFloorFold;  // the floor this material's shadows lie on tips away beyond dot(xy, p.xz) > z by w per metre (0: level)
varying float vKind;
#ifdef FACE_BOUND
varying vec3 vFlat; varying vec4 vFold;      // where this vertex lies before the fold (flat), and its fold line (w: 1 folded, 0 not)
#endif
void main(){
  float g = step(aAng.w, uU);
  float ang = mix(aAng.x + aAng.y * uHour, uAgreeAng, uAgree * (1. - step(1.5, aFold.w)));
  float sc = (1. + aAng.z * uHour) * g;
  vec2 d = vec2(sin(ang), cos(ang));
  vec3 p = aFoot + vec3(d.x, 0., d.y) * (aOff.x * sc) + vec3(d.y, 0., -d.x) * (aOff.y * g);
  p.y -= uFloorFold.w * max(dot(uFloorFold.xy, p.xz) - uFloorFold.z, 0.);
  float ex = max(dot(aFold.xy, p.xz) - aFold.z, 0.) * step(.5, aFold.w) * (1. - step(2.5, aFold.w));
#ifdef FACE_BOUND
  vFlat = p; vFold = vec4(aFold.xyz, step(.5, aFold.w) * (1. - step(2.5, aFold.w)));
#endif
  p.xz -= aFold.xy * ex; p += aFoldDir * ex;
  vKind = aKind;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uInk, uOchre; varying float vKind;
#ifdef FACE_BOUND
// A SHADOW CLIMBS ONLY WHERE A FACE STANDS.  A material that defines FACE_BOUND names the one arcade front its folded shadows
// climb, in the front's own terms (the numbers it was built from): uFaceO = its first corner (x, z) and the unit direction of its
// run (x, z); uFaceS = (how much smaller it grows per metre of run, the length of its run in its own metres, one bay, the
// segments of an arch); uFaceA = (an arch's half width, the height of its springing, its rise, the height of the string course).
// A fragment that lies past the fold line is drawn only where that front's face stands behind it: on a pier, on the wall over
// an arch.  Over an open mouth, past either end and above the string course it is not drawn: the shadow ends at the threshold.
uniform vec4 uFaceO, uFaceS, uFaceA;
varying vec3 vFlat; varying vec4 vFold;
#endif
void main(){
#ifdef FACE_BOUND
  float ex = (dot(vFold.xy, vFlat.xz) - vFold.z) * vFold.w;
  if (ex > 0. && uFaceS.y > 0.) {
    vec2 w = vFlat.xz - vFold.xy * ex;
    float dA = dot(w - uFaceO.xy, uFaceO.zw), s = max(1. - dA * uFaceS.x, 1e-4), run = uFaceS.x > 0. ? -log(s) / uFaceS.x : dA;
    float b = (vFlat.y + ex) / s, x = mod(run, uFaceS.z) - .5 * uFaceS.z, hw = uFaceA.x, n = uFaceS.w;
    float k = clamp(floor((1. - acos(clamp(x / hw, -1., 1.)) / 3.14159265) * n), 0., n - 1.);
    vec2 t = 3.14159265 * (1. - vec2(k, k + 1.) / n), ax = hw * cos(t), ay = uFaceA.z * sin(t);
    float arch = uFaceA.y + mix(ay.x, ay.y, clamp((x - ax.x) / (ax.y - ax.x), 0., 1.));
    if ((abs(x) < hw && b < arch) || run < 0. || run > uFaceS.y || b > uFaceA.w) discard;
  }
#endif
  gl_FragColor = vec4(vKind > .5 ? uOchre : uInk, 1.);
}`;

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
${STYLE_GLSL}
uniform vec2 uBand;       // degrees: the low colour up to x, the high colour from y; between them the streaks interlock
uniform vec3 uSkyLow, uSkyHigh, uLineCol; uniform float uLine;      // uLine: degrees of a flat line of uLineCol on the horizon (0 = none)
varying vec3 vDir;
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = atan(d.x, d.z + 1e-6 * step(abs(d.x) + abs(d.z), 0.));
  float t = (el - uBand.x) / max(uBand.y - uBand.x, 1e-3);
  float hi = step(1., t);
  if (t > 0. && t < 1.) {
    // 10 rows of dry-brush streaks fixed to the dome: about 40 of each colour all the way round, longer low down
    float rows = 10., r = floor(t * rows), fy = fract(t * rows);
    float n = 34. + 9. * sqHash(vec2(r, 3.));
    float x = az / 6.2831853 * n + sqHash(vec2(r, 11.)) * 7.;
    float c = floor(x), fx = fract(x);
    float h = sqHash(vec2(mod(c, n), r));
    float endT = max(abs(fx - .5) * 2. - .62, 0.) / .38;             // the streak thins toward its two ends
    float thr = (r + .5) / rows;
    float body = step(abs(fy - .5) * 2., 1. - endT * endT);
    float green = step(h, thr * 1.25 - .12);
    hi = green > .5 ? mix(step(.5, thr), 1., body) : mix(step(.5, thr), 0., body);
  }
  vec3 col = mix(uSkyLow, uSkyHigh, hi);
  if (el < uLine) col = uLineCol;
  gl_FragColor = vec4(col, 1.);
}`;

function addFlatSkyShadow(style) {
  const U = style.uniforms;
  // flat pigment for anything that is one colour: style.flatMaterial('uOchre') is the ground, 'uInk' a void
  style.flatMaterial = (name = 'uOchre', o = {}) => new THREE.ShaderMaterial({
    uniforms: { uC: U[name] }, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.); }', side: o.side ?? THREE.FrontSide,
  });
  U.uAgreeAng = { value: 0 }; U.uHour = { value: 0 }; U.uFloorFold = { value: new THREE.Vector4(0, 0, 0, 0) };      // uHour: what the shadows creep by (the world may let it run a little with the clock); uU gates and swaps
  style.shadowMaterial = () => new THREE.ShaderMaterial({
    uniforms: U, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
  // the sky: one dome that follows the camera (call sky.follow(camera) every frame).  band = [low, high] degrees.
  style.makeSky = (o = {}) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uBand: { value: new THREE.Vector2(...(o.band || [14, 18])) }, uSkyLow: { value: o.low || U.uYellow.value }, uSkyHigh: { value: o.high || U.uGreen.value }, uLine: { value: o.line || 0 }, uLineCol: { value: o.lineColor || U.uYellow.value } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthFunc: THREE.LessEqualDepth,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), m);
    sky.renderOrder = -1; sky.frustumCulled = false;
    const tmp = new THREE.Vector3();
    sky.follow = (camera) => { tmp.setFromMatrixPosition(camera.matrixWorld); if (sky.parent) sky.parent.worldToLocal(tmp); sky.position.copy(tmp); };
    return sky;
  };
}

// SHADOW BUILDER.  State: sb.angle (rad at u 0; 0 = +Z, positive toward +X), sb.swing (rad over the flight), sb.stretch
// (fraction over the flight: 0.3 = 30 percent longer at u 1, negative shortens), sb.gate (u at which it appears),
// sb.kind (0 shadow, 1 tongue), sb.fold = [nx, nz, d] or null, sb.foldDir = [x, y, z].  Lift: sb.lift metres above the floor.
export function makeShadowBuilder() {
  const foot = [], off = [], ang = [], fold = [], fdir = [], kind = [], idx = [];
  const sb = { angle: 0, swing: 0, stretch: 0, gate: 0, kind: 0, fold: null, foldDir: [0, 1, 0], lift: 0.04, count: 0, own: false };      // own: it keeps its own angle when the hour agrees
  sb.vert = (x, y, z, along, across = 0) => {
    foot.push(x, y + sb.lift, z); off.push(along, across); ang.push(sb.angle, sb.swing, sb.stretch, sb.gate);
    if (sb.fold) fold.push(sb.fold[0], sb.fold[1], sb.fold[2], sb.own ? 2 : 1); else fold.push(0, 0, 0, sb.own ? 3 : 0);
    fdir.push(sb.foldDir[0], sb.foldDir[1], sb.foldDir[2]); kind.push(sb.kind);
    return foot.length / 3 - 1;
  };
  sb.tri = (a, b, c) => { idx.push(a, b, c); sb.count++; };
  // thrown: a base polyline on the floor, each point [x, y, z, near, far]: the shadow (or tongue) of that point runs from
  // `near` to `far` metres along the angle.  div = segments along (use 8 or more where a fold line is set).
  sb.thrown = (base, div = 1) => {
    const rows = [];
    for (const p of base) { const r = []; for (let k = 0; k <= div; k++) r.push(sb.vert(p[0], p[1], p[2], p[3] + (p[4] - p[3]) * (k / div))); rows.push(r); }
    for (let i = 0; i + 1 < rows.length; i++) for (let k = 0; k < div; k++) { sb.tri(rows[i][k], rows[i + 1][k], rows[i + 1][k + 1]); sb.tri(rows[i][k], rows[i + 1][k + 1], rows[i][k + 1]); }
  };
  // shape: a rigid ruled figure swinging about one foot: rows of [along, acrossLeft, acrossRight], joined as a strip.
  sb.shape = (f, rows) => {
    const v = rows.map((r) => [sb.vert(f[0], f[1], f[2], r[0], r[1]), sb.vert(f[0], f[1], f[2], r[0], r[2])]);
    for (let i = 0; i + 1 < v.length; i++) { sb.tri(v[i][0], v[i + 1][0], v[i + 1][1]); sb.tri(v[i][0], v[i + 1][1], v[i][1]); }
  };
  sb.build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(foot, 3)); g.setAttribute('aFoot', new THREE.Float32BufferAttribute(foot, 3));
    g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 2)); g.setAttribute('aAng', new THREE.Float32BufferAttribute(ang, 4));
    g.setAttribute('aFold', new THREE.Float32BufferAttribute(fold, 4)); g.setAttribute('aFoldDir', new THREE.Float32BufferAttribute(fdir, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setIndex(idx);
    return g;
  };
  return sb;
}

// The cube's own cast shadow, thrown from its base toward `angle` (0 = straight out of the front, +Z), `len` metres for
// the front roofline.  It shortens over the flight (stretch < 0).  The world coder calls this with its own builder,
// sets sb.fold / sb.foldDir first if the floor tips away in front of the cube, and y0 = the level the cube stands on.
export function addCubeShadow(sb, angle, len, o = {}) {
  const { F, K } = CUBE, H = F * 0.5, y = o.y ?? 0, div = o.div ?? 12;
  sb.kind = 0; sb.angle = angle; sb.swing = o.swing ?? -0.1; sb.stretch = o.stretch ?? -0.18; sb.gate = 0;
  const m = 0.42;
  sb.thrown([[-H - m, y, H + m, 0, len], [H + m, y, H + m, 0, len]], div);
  sb.thrown([[H + m, y, H + m, 0, len], [H * K, y, -H, 0, len * K]], div);
  sb.thrown([[-H - m, y, H + m, 0, len], [-H * K, y, -H, 0, len * K]], div);
}

// A person's shadow, `len` metres from foot to crown, as ONE ruled silhouette: two legs, a body like a long coat that is
// widest at the shoulders, shoulders that slope into the neck (no separate bar), a short neck, a round head, and (unless
// the caller swings one of its own) one arm that hangs away from the coat.  Rows every o.step metres, so it can fold up
// a wall.  Set sb.angle, sb.fold and so on first.  All widths are fractions of len, all stations fractions of len / pre.
//   o.arm false: no arm (the caller adds a ribbon that swings)      o.armSide +1 / -1
//   o.shoulders, o.hem, o.neckW: half widths (0.095, 0.062, 0.024)      o.wide: multiplies every width
//   o.bt: station of the shoulder line (0.7)      o.slope, o.neck: lengths of the sloping shoulders and of the neck
//   o.head: [half length, half width] (0.062, 0.048)      o.tilt: the head and neck lean this far across per metre along
//   o.legs: station where the coat's hem is (0.2; 0 = a coat to the ground)
//   o.seated: a figure sitting on a block: the block, a short torso wider than the block is deep, shoulders, head
//   o.pre: the stretch at which it is in true proportion (a shadow that will be stretched by 1 + stretch * hour is drawn
//          1 / pre long so that it is right at that hour)
export function addFigure(sb, foot, len = 40, o = {}) {
  const wd = o.wide ?? 1, k = len * wd, al = len / (o.pre || 1), step = o.step ?? 0.8;
  const sw = o.shoulders ?? 0.095, hem = o.hem ?? (o.seated ? 0.088 : 0.062), nw = o.neckW ?? 0.024;
  const bt = o.bt ?? (o.seated ? 0.6 : 0.7), sl = o.slope ?? 0.05, nk = o.neck ?? 0.028, [hr, hwd] = o.head || [0.062, 0.048];
  const lg = o.seated ? 0.16 : (o.legs ?? 0.2), tilt = o.tilt ?? 0, n0 = bt + sl;
  const lean = (t) => tilt * Math.max(t - n0, 0) * al;                 // metres across, at station t
  // rows between stations, never more than `step` metres apart, as [station, half width, centre]
  const strip = (pts) => {
    const rows = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [t0, w0, c0 = 0] = pts[i], [t1, w1, c1 = 0] = pts[i + 1], n = Math.max(1, Math.ceil(Math.abs(t1 - t0) * al / step));
      for (let j = i ? 1 : 0; j <= n; j++) { const f = j / n, t = t0 + (t1 - t0) * f, c = c0 + (c1 - c0) * f, w = w0 + (w1 - w0) * f; rows.push([t * al, (c - w) * k + lean(t), (c + w) * k + lean(t)]); }
    }
    sb.shape(foot, rows);
  };
  if (o.seated) strip([[0, 0.125], [lg, 0.125]]);                      // the block it sits on
  else if (lg > 0) for (const sg of [-1, 1]) strip([[0, hem * 0.3, sg * hem * (o.stance ?? 0.52)], [lg, hem * 0.49, sg * hem * 0.5]]);      // two legs (o.stance: how far apart the feet stand)
  // the coat, the sloping shoulders and the neck: one strip
  strip([[lg, hem], [bt, sw], [bt + sl * 0.3, sw * 0.84], [n0, nw], [n0 + nk + hr * 0.3, nw]]);
  // the head: struck round (an ellipse in the shadow's own frame), overlapping the top of the neck
  const head = [], hc = n0 + nk + hr, hn = Math.max(8, Math.ceil(2 * hr * al / step));
  for (let i = 0; i <= hn; i++) { const t = -1 + 2 * i / hn, w = hwd * Math.sqrt(Math.max(1 - t * t, 0)) * k, st = hc + hr * t; head.push([st * al, -w + lean(st), w + lean(st)]); }
  sb.shape(foot, head);
  // the arm: it leaves the end of the shoulder and hangs back toward the feet and away from the coat, a hand's taper at its end
  if (o.arm !== false) {
    const side = o.armSide ?? 1, aw = (o.armW ?? nw) * 1.08, L = o.armLen ?? 0.26, out = o.armOut ?? 0.42, pts = [];
    const c0 = sw * 0.9, cOf = (t) => side * (c0 + (bt - 0.012 - t) * (al / k) * out);
    pts.push([bt - 0.012, aw, cOf(bt - 0.012)], [bt - 0.012 - L * 0.82, aw * 0.9, cOf(bt - 0.012 - L * 0.82)], [bt - 0.012 - L, aw * 0.3, cOf(bt - 0.012 - L)]);
    strip(pts.reverse());
  }
}

// A tongue of light through an arch onto the black floor: the arch's outline thrown along the angle, k metres of floor
// for every metre of height.  footOf(a) gives the floor point under the wall at face coordinate a and the wall's scale
// there ([x, y, z, s]); b0 = sill height (0: a tongue from the threshold; above: an arch of light lying out on the floor).
export function addTongue(sb, footOf, ac, hw, b0, jamb, rise, k, seg = 12, clip = null) {
  const base = [];
  for (let i = 0; i <= seg; i++) {
    const t = Math.PI * (1 - i / seg), a = ac + hw * Math.cos(t), top = b0 + jamb + rise * Math.sin(t), f = footOf(a);
    const far = clip ? clip(f, top * f[3] * k) : top * f[3] * k;
    base.push([f[0], f[1], f[2], Math.min(b0 * f[3] * k, far), far]);
  }
  sb.kind = 1; sb.thrown(base, 1);
}

// ---------------------------------------------------------------------------------------------------------------
// (o.tipK, o.foldK, o.long: how far the wing tips shear, how far the wings fold, how long the shadow is thrown along its
// flight; o.top: the wall's height, above which nothing is cast; o.paceK [ramp, wall]: the share of the run's rate at which
// the shadow moves over the tipped floor and up the wall (default 1, 1; over level floor it moves at the run's own rate).)
// (4) THE FLOCK: bird shadows and nothing else.  Each bird is 16 triangles laid along its own path: a straight run over
// the floor from `start` on `heading`, a fold at the wall foot `fold` metres on, `climb` metres straight up a pier, then a
// turn to one side into an arch, where it goes out (the fragment is cut by the arch's own outline).  The wall is one
// plane per flock: o.wallOrigin (its bottom left corner as seen from outside), o.wallT (unit, along it), o.wallN (unit,
// out of it), o.cell [bay, tier], o.arch [half width, springing height, rise].  Move it with flock.setRun(metres).
// ---------------------------------------------------------------------------------------------------------------
const FLOCK_VERT = /* glsl */`
attribute vec3 aStart; attribute vec4 aPath; attribute vec3 aBird; attribute vec2 aLocal;
uniform float uRun, uTime, uBeat, uTipK, uFoldK, uLong, uNear; uniform vec3 uWallO, uWallT, uWallN, uWallUp; uniform vec4 uFloorFold; uniform float uLoop; uniform vec2 uPaceK;
varying vec2 vWall;
void main(){
  float sB = uRun - aBird.x, size = aBird.z;
  if (uLoop > 0.) sB = mod(sB, uLoop);      // o.loop: every bird comes round again every o.loop metres of run
  // o.paceK: the shadow's speed is a function of where IT is: uPaceK.x of the run's rate over the tipped floor (the part of its
  // floor run beyond the floor's fold line: the ramp), the run's own rate over level floor, uPaceK.y of it up the wall
  // (1, 1: the run is metres everywhere, as before)
  vec2 d0 = vec2(sin(aPath.x), cos(aPath.x));
  float toLine = dot(uFloorFold.xy, d0);
  float sR = (uFloorFold.w > 0. && toLine < -1e-4) ? clamp((uFloorFold.z - dot(uFloorFold.xy, aStart.xz)) / toLine, 0., aPath.y) : 0.;
  sB = min(sB * uPaceK.x, sR) + clamp(sB - sR / uPaceK.x, 0., aPath.y - sR) + max(sB - sR / uPaceK.x - (aPath.y - sR), 0.) * uPaceK.y;
  // near the lens a bird's shadow is nearer its true size (uNear of the size it has far off, where it is drawn large to be seen at
  // all): under us it is a bird, not a splintered blot; it grows as it flies on, as everything here lies about distance
  vec3 cen = aStart + vec3(d0.x, 0., d0.y) * clamp(sB, 0., aPath.y);
  cen.y -= uFloorFold.w * max(dot(uFloorFold.xy, cen.xz) - uFloorFold.z, 0.);
  size *= mix(uNear, 1., smoothstep(6., 22., length((modelViewMatrix * vec4(cen, 1.)).xyz)));
  float ph = uTime * uBeat * 6.2831853 + aBird.y;
  float span = (1. - uFoldK) + uFoldK * cos(ph), tip = abs(aLocal.y) * 2.;
  float s = sB + (aLocal.x * uLong + tip * tip * uTipK * sin(ph)) * size, lat = aLocal.y * span * size;
  float alive = step(0., sB) * step(sB, aPath.y + aPath.z + 11.);
  s = mix(sB, s, alive); lat *= alive;
  vec2 d = vec2(sin(aPath.x), cos(aPath.x));
  float onFloor = min(s, aPath.y), up = max(s - aPath.y, 0.), drift = max(up - aPath.z, 0.) * aPath.w;
  vec3 p = aStart + vec3(d.x, 0., d.y) * onFloor + uWallT * (lat + drift);
  p.y -= uFloorFold.w * max(dot(uFloorFold.xy, p.xz) - uFloorFold.z, 0.);      // the floor tips away beyond this line
  p += uWallUp * up + uWallN * (.05 * step(1e-4, up));
  p.y += .05;
  vWall = vec2(dot(p - uWallO, uWallT), s - aPath.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const FLOCK_FRAG = /* glsl */`
uniform vec3 uInk; uniform vec2 uCell; uniform vec3 uArch; uniform float uTop;      // uTop: the wall's height (nothing is cast on the air above it)
varying vec2 vWall;
void main(){
  if (vWall.y > uTop) discard;
  if (vWall.y > 0.) {
    vec2 q = mod(vWall, max(uCell, vec2(1e-3)));
    vec2 p = vec2(q.x - .5 * uCell.x, q.y - uArch.y);
    float k = length(p / max(uArch.xz, vec2(1e-3)));
    if (p.y < 0. ? abs(p.x) < uArch.x : k < 1.) discard;
  }
  gl_FragColor = vec4(uInk, 1.);
}`;
const BIRD = (() => {      // one bird, unit span: [along, across] triangles
  const t = [], tri = (a, b, c) => t.push(a, b, c);
  tri([0.3, 0], [0.02, 0.07], [0.02, -0.07]); tri([0.02, 0.07], [-0.24, 0], [0.02, -0.07]);            // head and body
  tri([-0.2, 0], [-0.4, 0.09], [-0.4, -0.09]);                                                             // tail
  const ax = [0.05, 0.2, 0.36, 0.5], lead = [0.13, 0.2, 0.13, -0.05], trail = [-0.1, -0.03, -0.05, -0.09];
  for (const sg of [1, -1]) for (let i = 0; i < 3; i++) {
    tri([lead[i], ax[i] * sg], [lead[i + 1], ax[i + 1] * sg], [trail[i + 1], ax[i + 1] * sg]);
    tri([lead[i], ax[i] * sg], [trail[i + 1], ax[i + 1] * sg], [trail[i], ax[i] * sg]);
  }
  tri([0.13, 0.05], [0.13, -0.05], [-0.1, 0]);
  return t;
})();
// birds: [{ start: [x, y, z], heading (rad, 0 = +Z, toward +X), fold, climb, side (+1 / -1), delay (m), phase, size (m across) }]
export function makeFlock(style, birds, o = {}) {
  const start = [], path = [], bird = [], local = [];
  for (const b of birds) for (const vtx of BIRD) {
    start.push(b.start[0], b.start[1], b.start[2]); path.push(b.heading, b.fold, b.climb, b.side);
    bird.push(b.delay || 0, b.phase || 0, b.size || 2.6); local.push(vtx[0], vtx[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(start, 3)); g.setAttribute('aStart', new THREE.Float32BufferAttribute(start, 3));
  g.setAttribute('aPath', new THREE.Float32BufferAttribute(path, 4)); g.setAttribute('aBird', new THREE.Float32BufferAttribute(bird, 3));
  g.setAttribute('aLocal', new THREE.Float32BufferAttribute(local, 2));
  const U = style.uniforms, uRun = { value: -1 };
  const m = new THREE.ShaderMaterial({
    uniforms: { uInk: U.uInk, uTime: U.uTime, uRun, uBeat: { value: o.beat ?? 2 }, uTipK: { value: o.tipK ?? 0.16 }, uFoldK: { value: o.foldK ?? 0.4 }, uLong: { value: o.long ?? 1 }, uNear: { value: o.near ?? 0.45 }, uTop: { value: o.top ?? 1e5 },
      uWallO: { value: new THREE.Vector3(...(o.wallOrigin || [0, 0, 0])) }, uWallT: { value: new THREE.Vector3(...(o.wallT || [1, 0, 0])) }, uWallN: { value: new THREE.Vector3(...(o.wallN || [0, 0, 1])) },
      uWallUp: { value: new THREE.Vector3(...(o.wallUp || [0, 1, 0])) }, uFloorFold: { value: new THREE.Vector4(...(o.floorFold || [0, 0, 0, 0])) }, uLoop: { value: o.loop || 0 }, uPaceK: { value: new THREE.Vector2(...(o.paceK || [1, 1])) },
      uCell: { value: new THREE.Vector2(...(o.cell || [24, 24])) }, uArch: { value: new THREE.Vector3(...(o.arch || [8, 12, 7.5])) } },
    vertexShader: FLOCK_VERT, fragmentShader: FLOCK_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'flock';
  mesh.setRun = (metres) => { uRun.value = metres; };
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// buildHero
// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyle(opts.palette || PALETTE);
  const { F, K, T, N } = CUBE, H = F * 0.5;
  // per-seed: the cube's false sun (the front is always lit), how flat the arches are struck, the impost, the shadow's side
  const sx = rng.chance(0.5) ? 1 : -1, sunAz = rng.range(0.35, 0.75) * sx, sunEl = rng.range(0.45, 0.8);
  const v = {
    sun: [Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl)],
    archHalf: 8, jamb: 12, narrow: rng.range(0.58, 0.66), rise: rng.range(7.35, 7.7), seg: detail < 0.8 ? 12 : 16, segFront: detail < 0.8 ? 18 : 26,
    impost: rng.range(0.22, 0.34), impostH: rng.range(0.42, 0.6),
    ruleSide: [-sx, sx, 1, -1],
  };
  // blind arches (niches painted black): the ground row of the back and both flanks except the back's middle arch, so the only thing seen through the
  // cube at ground level is the last court through the central arch; opts.blind = false opens them all
  v.blind = [0, 1, 2, 3].map((fi) => { const m = new Array(N * N).fill(false); if (fi >= 1 && opts.blind !== false) for (let i = 0; i < N; i++) m[i] = !(fi === 1 && i === 2); return m; });
  v.ruleSide[2] = rng.chance(0.5) ? 1 : -1; v.ruleSide[3] = rng.chance(0.5) ? 1 : -1;
  const shadowAngle = (opts.shadowAngle ?? rng.range(0.3, 0.4)) * (rng.chance(0.5) ? 1 : -1);
  const tongueGate = opts.tongueGate ?? 0.6;
  const object = new THREE.Group(); object.name = 'cube-of-a-hundred-arches';

  const geo = await buildCubeGeometry(ctx, v);
  await ctx.yield();
  const masonry = style.masonry || (style.masonry = style.masonryMaterial({ course: [1.0, 2.6] }));
  const cube = new THREE.Mesh(geo, masonry); cube.name = 'cube'; object.add(cube);

  // shadows and tongues: one geometry, one draw call
  const sb = makeShadowBuilder(), faces = cubeFaces();
  if (opts.shadow !== false) addCubeShadow(sb, shadowAngle, opts.shadowLength ?? 235, { y: 0 });
  const inward = [Math.PI, 0, -Math.PI / 2, Math.PI / 2], picks = [], rich = opts.roomLight !== false;
  for (let fi = 0; fi < 4; fi++) for (let j = 0; j < 3; j++) for (let i = 0; i < N; i++) {
    const centre = j === 0 && i === 2 && fi < 2, r = rng(), lean = rng.range(0.14, 0.62) * (rng.chance(0.5) ? 1 : -1);
    const k = j === 0 ? (centre ? rng.range(2.4, 3.3) : rng.range(0.9, 2.1)) : rng.range(0.5, 1.1);
    const swing = rng.range(0.05, 0.14) * (rng.chance(0.67) ? 1 : -1), stretch = rng.range(0.12, 0.34);
    if (v.blind[fi][j * N + i]) continue;
    if (centre || r < (j === 0 ? (rich ? 1 : 0.3) : (rich ? 0.5 : 0.2))) picks.push({ fi, i, j, lean: centre ? lean * 0.6 : lean, k: k * (rich ? (j === 0 ? 1.5 : 1.8) : 1), swing, stretch });
  }
  // THE ROOM'S LIGHT (opts.roomLight, on by default): every open ground arch and half of those above throw a ruled tongue, long,
  // and a tongue that reaches the back wall or a flank climbs it: the arch's own head stands on the black wall as an arch of
  // ochre light, leaning, and slides along it with the room's hour.  It climbs no higher than the blind ground tier and keeps
  // clear of the back arch, so no light ever lies across an opening.
  const q = H - T, bx = q * (1 - K) / F, ax = q * (1 - (1 - K) * 0.5), nl = Math.hypot(1, bx);
  const walls = [      // inner faces as n . (x, z) = d, n pointing out of the room
    { n: [0, -1], d: q, fold: true, back: true }, { n: [0, 1], d: q, fold: false },
    { n: [1 / nl, -bx / nl], d: ax / nl, fold: true }, { n: [-1 / nl, -bx / nl], d: ax / nl, fold: true },
  ];
  const CLIMB = 21.5 * K; let nFold = 0;
  // ONE SUN FOR THE FRONT WALL: the room's floor carries the front's own arches as ranks of arches of light, tier beyond tier
  // (what an arcade's shadow is on the squares outside, in negative), thrown just far enough for the heads of the fourth tier
  // to stand on the back wall beside the back arch; and one tongue the other way from the back arch.  Ranks, so no two
  // lights ever run together into a shapeless one.
  if (rich) {
    const back = picks.find((p) => p.fi === 1 && p.j === 0 && p.i === 2), l0 = picks.length ? picks[0].lean : 0.3;
    const leanF = (l0 < 0 ? -1 : 1) * (0.015 + Math.abs(l0) * 0.04), stF = 0.035, kFront = (2 * q + 0.9 * CLIMB) / ((3 * (F / N) + v.jamb + v.rise) * (1 + stF));
    picks.length = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < N; i++) picks.push({ fi: 0, i, j, lean: leanF, k: kFront, swing: -leanF * 0.5 / 2.2, stretch: stF / 1.6, fixed: true });
    if (back) picks.push({ ...back, k: 1.25 });
  }
  let pc = 0;
  for (const p of picks) {
    if (pc++ % 4 === 3) await ctx.yield();
    const f = faces[p.fi], fp = cubeArch(v, p.fi, p.j), hw = fp.hw / f.stretch, ac = -H + (p.i + 0.5) * (F / N);
    sb.angle = inward[p.fi] + p.lean; sb.swing = p.swing * 2.2; sb.stretch = p.stretch * 1.6; sb.gate = tongueGate; sb.lift = 0.04;      // (the room's hour runs while we cross it: they slide as we watch)
    const footOf = (a) => { const w = f.xf(a, 0, -T - 0.05); return [w[0], FLOOR_Y, w[2], p.fi === 0 ? 1 : cubeScaleAt(w[2])]; };
    // the wall its middle ray meets at mid hour (the front wall is all open arches: nothing climbs it)
    const c0 = footOf(ac), am = sb.angle + sb.swing * 0.5, dm = [Math.sin(am), Math.cos(am)];
    let W = null, best = 1e9;
    for (const w of walls) { const den = w.n[0] * dm[0] + w.n[1] * dm[1]; if (den < 1e-3) continue; const t = (w.d - w.n[0] * c0[0] - w.n[1] * c0[2]) / den; if (t > 0.5 && t < best) { best = t; W = w; } }
    if (!rich || !W || !W.fold || (p.fixed && !W.back)) W = null;
    sb.fold = W ? [W.n[0], W.n[1], W.d - 0.09] : null; sb.foldDir = [0, 1, 0];
    const okAt = (f0, L, u) => {
      const an = sb.angle + sb.swing * u, l = L * (1 + sb.stretch * u); let x = f0[0] + Math.sin(an) * l, z = f0[2] + Math.cos(an) * l;
      if (W) { const ex = W.n[0] * x + W.n[1] * z - W.d; if (ex > CLIMB) return false; if (ex > -0.4) { x -= W.n[0] * (ex + 0.4); z -= W.n[1] * (ex + 0.4); if (W.back && Math.abs(x) < 9.6) return false; } }
      for (const w of walls) { if (w === W) continue; if (w.n[0] * x + w.n[1] * z - w.d > -(W ? 1.6 : 0.4)) return false; }
      return true;
    };
    // no light leaves the room: each ray is cut where it would, at either end of the room's hour
    const clip = (f0, far) => { let L = far; for (let it = 0; it < 700 && L > 0; it++) { if (okAt(f0, L, 0) && okAt(f0, L, 1)) break; L -= 0.25; } return Math.max(L, 0); };
    const seg = 12, M = 8, b0 = p.j * (F / N), pts = [];
    for (let i = 0; i <= seg; i++) { const t = Math.PI * (1 - i / seg), a = ac + hw * Math.cos(t); pts.push([footOf(a), b0 + fp.jamb + fp.rise * Math.sin(t)]); }
    // a tongue that climbs is thrown just far enough for the arch's crown to stand near the top of the blind tier at the end of
    // the room's hour, whole (never cut): it hardly lengthens, it slides.  One that cannot stand whole stays on the floor.
    let kF = 0;
    if (W) {
      const st0 = sb.stretch, sw0 = sb.swing; if (!p.fixed) sb.stretch = 0.07;
      for (const sk of p.fixed ? [1] : [1, 0.5, 0.25]) {
        sb.swing = sw0 * sk;
        const an = sb.angle + sb.swing, den = W.n[0] * Math.sin(an) + W.n[1] * Math.cos(an), top = b0 + fp.jamb + fp.rise;
        if (den < 0.2) continue;
        let k1 = p.fixed ? p.k : ((W.d - W.n[0] * c0[0] - W.n[1] * c0[2]) / den + 0.92 * CLIMB / den) / (top * c0[3] * (1 + sb.stretch));
        for (let it = 0; it < (p.fixed ? 1 : 10) && !kF; it++, k1 *= 0.975) {
          if (k1 > 8.5) continue;
          let ok = true; for (const [f0, tp] of pts) for (const u of [0, 0.5, 1]) if (!okAt(f0, tp * f0[3] * k1, u)) ok = false;
          if (ok) kF = k1;
        }
        if (kF) break;
      }
      if (!kF) { W = null; sb.fold = null; sb.stretch = st0; sb.swing = sw0; }
    }
    if (!W) { addTongue(sb, footOf, ac, hw, b0, fp.jamb, fp.rise, p.k, 12, clip); continue; }
    // rows crowd round the fold, so the strip turns the corner within a hand's breadth at every hour
    const cols = [];
    for (const [f0, tp] of pts) {
      const far = tp * f0[3] * kF, near = Math.min(b0 * f0[3] * kF, far);
      let w0 = 1e9, w1 = -1e9;
      for (const u of [0, 0.5, 1]) { const an = sb.angle + sb.swing * u, den = W.n[0] * Math.sin(an) + W.n[1] * Math.cos(an); if (den < 1e-3) continue; const dd = (W.d - 0.09 - W.n[0] * f0[0] - W.n[1] * f0[2]) / den / (1 + sb.stretch * u); w0 = Math.min(w0, dd); w1 = Math.max(w1, dd); }
      if (w0 > w1) { w0 = far; w1 = far; }
      const st = [near]; for (let m = 0; m <= M; m++) st.push(Math.min(Math.max(w0 - 0.25 + (w1 - w0 + 0.5) * m / M, near), far)); st.push(far);
      cols.push(st.map((al) => sb.vert(f0[0], f0[1], f0[2], al)));
    }
    nFold++;
    sb.kind = 1;
    for (let i = 0; i < seg; i++) for (let m = 0; m + 1 < cols[i].length; m++) { sb.tri(cols[i][m], cols[i + 1][m], cols[i + 1][m + 1]); sb.tri(cols[i][m], cols[i + 1][m + 1], cols[i][m + 1]); }
  }
  sb.fold = null; sb.foldDir = [0, 1, 0]; sb.lift = 0.04;
  if (opts.debug) console.log('room tongues', picks.length, 'climbing', nFold);
  // nobody's shadow: a standing figure 40 m long, five ruled shapes, lying across the threshold and folded up the pier
  // beside the central arch (opts.figure = false leaves it out).  Its caster is nowhere.
  let figurePier = 0;      // x of the pier that carries nobody's shadow (0: none); no bird's shadow climbs it
  if (opts.figure !== false) {
    // It lies square to the facade, down the ramp in front of the pier, and stands plumb on the pier's face: legs and coat on
    // the ochre, the shoulder line just above the pier's base, neck and round head upright on the white (3.6 m of an 8 m pier).
    // It keeps its own angle when the hour agrees (a folded shadow swung round would be thrown across the arches in pieces).
    const fs = rng.chance(0.5) ? 1 : -1; rng.range(1.92, 2.08); rng.range(28, 31);
    figurePier = -fs * 12;
    const px = -fs * 12 + rng.range(-1.5, 1.5) * 0.3, FL = 34.5, foot = [px, 0, H + 0.07 + 25];
    sb.kind = 0; sb.angle = Math.PI; sb.swing = 0; sb.stretch = 0.045; sb.gate = 0; sb.lift = 0.05; sb.own = true;
    sb.fold = [0, -1, -(H + 0.07)]; sb.foldDir = [0, 1, 0];
    addFigure(sb, foot, FL, { armSide: -fs, bt: 0.79, slope: 0.05, neck: 0.026, head: [0.058, 0.052], shoulders: 0.094, step: 0.5 });
    sb.own = false;     sb.fold = null; sb.foldDir = [0, 1, 0]; sb.lift = 0.04;
  }
  await ctx.yield();
  const shadows = new THREE.Mesh(sb.build(), style.shadow || (style.shadow = style.shadowMaterial()));
  shadows.frustumCulled = false; shadows.name = 'shadows-and-tongues'; object.add(shadows);

  // the flock that runs up the front piers and goes out in the arches (opts.flock = false: the world brings its own)
  let flock = null, flockLen = 1, flockSet = false;
  if (opts.flock !== false) {
    const birds = [], nb = Math.round(36 * (detail < 0.8 ? 0.7 : 1)), run0 = opts.flockRun ?? 150;
    const piers = [-56.6, -36, -12, 12, 36, 56.6];
    for (let i = 0; i < nb; i++) {
      // (the birds for the two piers of the central arch keep to their own side of the camera's line: none passes under the lens)
      const pi0 = rng.int(0, 5), pi = figurePier && piers[pi0] === figurePier ? (pi0 === 2 ? 1 : 4) : pi0, px = piers[pi] + rng.range(-1.6, 1.6), raw = px * rng.range(0.25, 0.8) + rng.range(-10, 10);
      const sx0 = pi === 3 && raw < 14 ? 14 + (14 - raw) * 0.4 : pi === 2 && raw > -3 ? -3 - (raw + 3) * 0.4 : raw;
      const dz = run0 + rng.range(-12, 12), heading = Math.atan2(px - sx0, -dz), fold = Math.hypot(px - sx0, dz);
      const tier = rng.int(0, 3), climb = tier * (F / N) + v.jamb + rng.range(-5, 0.5);
      const side = pi === 0 ? 1 : pi === 5 ? -1 : (rng.chance(0.5) ? 1 : -1);
      birds.push({ start: [sx0, 0, H + dz], heading, fold, climb, side, delay: rng.range(0, 70) + (i % 3) * 14, phase: rng.range(0, 6.28), size: rng.range(2.3, 2.9) * (opts.flockSize ?? 1) });
      flockLen = Math.max(flockLen, fold + climb + 11 + 112);
    }
    // opts.flockLoop: a stream that never stops; the birds are spaced evenly round one loop and each comes round again
    if (opts.flockLoop) { flockLen -= 82; for (let i = 0; i < nb; i++) birds[i].delay = (((i * 7) % nb) + birds[i].delay / 98 * 0.7) * flockLen / nb; }
    flock = makeFlock(style, birds, { floorFold: opts.floorFold, wallOrigin: [-H, 0, H], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [F / N, F / N], arch: [v.archHalf, v.jamb, v.rise], loop: opts.flockLoop ? flockLen : 0 });
    object.add(flock);
  }

  // ... and the same flock crossing the black room: its shadows show only where they cross a tongue of light
  let roomFlock = null, roomLen = 1, roomSet = false;
  if (opts.flock !== false) {
    const rb = [], nr = Math.round(22 * (detail < 0.8 ? 0.7 : 1)), q = H - T - 0.6;
    for (let i = 0; i < nr; i++) {
      const x0 = rng.range(-44, 44), heading = Math.PI + rng.range(-0.3, 0.3), dx = Math.sin(heading), dz = Math.cos(heading);
      let fold = 0; while (fold < 130) { const x = x0 + dx * (fold + 1), z = q + dz * (fold + 1); if (z < -q || Math.abs(x) > q * cubeScaleAt(z)) break; fold += 1; }
      const delay = rng.range(0, 110);
      rb.push({ start: [x0, FLOOR_Y, q], heading, fold, climb: 0, side: 1, delay, phase: rng.range(0, 6.28), size: rng.range(2.3, 2.9) });
      roomLen = Math.max(roomLen, fold + delay + 12);
    }
    roomFlock = makeFlock(style, rb, { wallOrigin: [0, 0, 0], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [1, 1], arch: [0, 0, 0] });
    roomFlock.name = 'room-flock'; object.add(roomFlock);
  }

  // what stands round it only when the piece is shown alone: an ochre floor and the two-band sky
  let sky = null;
  if (opts.apron !== false) {
    const apron = new THREE.Mesh(new THREE.CircleGeometry(2600, 48), style.flatMaterial('uOchre'));
    apron.rotation.x = -Math.PI / 2; apron.name = 'apron'; object.add(apron);
  }
  if (opts.sky !== false) { sky = style.makeSky(); object.add(sky); }
  await ctx.yield();

  let progressSet = false;
  const hero = {
    object, radius: 92, height: F, center: new THREE.Vector3(0, 52, 0), style, sky, ground: false, groundY: 0,
    anchors: {
      frontArch: { position: new THREE.Vector3(0, 0, H), width: 16, height: v.jamb + v.rise, facing: new THREE.Vector3(0, 0, 1) },
      backArch: { position: new THREE.Vector3(0, 0, -H), width: 16 * K, height: (v.jamb + v.rise) * K, facing: new THREE.Vector3(0, 0, -1) },
      flyThrough: [[0, 7, 300], [0, 7, 150], [0, 7, H + 8], [0, 7, 0], [0, 7, -H - 8], [0, 7, -160]].map((p) => new THREE.Vector3(...p)),
      portalSeat: { position: new THREE.Vector3(0, 0, -H - 100), facing: new THREE.Vector3(0, 0, 1) },
      viewpoints: { reveal: new THREE.Vector3(-14, -8.5, 308), chase: new THREE.Vector3(0, 2, 120), threshold: new THREE.Vector3(0, 7, H + 6), room: new THREE.Vector3(0, 7, 20) },
      shadowAngle, sun: new THREE.Vector3(...v.sun), figurePier,
      smallArch: { ...cubeArch(v, 2, 1), stretch: cubeFaces()[2].stretch },      // the arches of the flanks and of the back's upper tiers (true size at scale 1); stretch: the flanks' face metres per true metre

      footprint: [[-H, 0, H], [H, 0, H], [H * K, 0, -H], [-H * K, 0, -H]].map((p) => new THREE.Vector3(...p)),
    },
    setProgress(u, hour = u) { progressSet = true; style.uniforms.uU.value = u; style.uniforms.uHour.value = hour; },
    // setFlock(m): metres the flock's leader has run from its start (150 m in front of the cube); -1 hides it.
    setFlock(m) { flockSet = true; if (flock) flock.setRun(m); }, flockLength: 0,
    // setRoomFlock(m): the same for the birds that cross the room from the front wall to the back (hero.roomFlockLength).
    setRoomFlock(m) { roomSet = true; if (roomFlock) roomFlock.setRun(m); }, roomFlockLength: 0,
    update(dt, time, camera) {
      style.uniforms.uTime.value = time;
      if (!progressSet) style.uniforms.uHour.value = style.uniforms.uU.value = 0.5 + 0.48 * Math.sin(time * 0.45);   // shown alone: the hour drifts by itself
      if (flock && !flockSet) flock.setRun((time * 40) % flockLen);
      if (roomFlock && !roomSet) roomFlock.setRun((time * 40) % roomLen);
      if (sky && camera) sky.follow(camera);
    },
    dispose() {},
  };
  hero.flockLength = flockLen; hero.flock = flock; hero.roomFlockLength = roomLen; hero.roomFlock = roomFlock;
  return hero;
}
