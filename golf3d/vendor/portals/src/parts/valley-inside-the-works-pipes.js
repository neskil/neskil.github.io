// valley-inside-the-works: THE PIPES (the world builder's; design, sections 2 and 3: they are OURS).
// A rank of seven slim glass process pipes, 0.9 m across and 1.6 m apart, centred on x = 24, built as real glass
// pipework is: THE GLASS IS NEVER BENT. Each pipe is two straight glass lengths, a plumb riser and a level run. THE
// RISER STANDS IN A CAST-IRON SHOE on a low round stone pad in the pool at z = -22, like a column in its base (a
// bolted base ring, a short tapered boot, a drip edge round its neck: …-pipes-feet.js, which also gives the pads'
// places and radii to whoever draws the liquid round them); it draws the pool's liquid in under its pad. What turns
// the pipes is bare steel: a short mitred elbow at the riser's top, a bolted flange on each end, from which the run
// goes on level up the valley to the head wall at z = -230; and, for the three outermost, a dog-leg of two such
// bends after the last cross-beam, which brings them down to their ports, clear of the round window's iron ring
// (the plan's pipePortY), and over the head gallery's rail.
// A STEPPED RANK (the plan's pipeRunY): the pipe nearest the nave runs highest (40.8) and each next one 0.8 m
// lower (the outermost at 36), so that from the nave the seven are seen as seven, never as one bundle edge-on, and
// the seven elbows stand in a stair over the first cross-beam.
// THE GREAT PIPE (the plan's GREAT_PIPE: one wide glass pipe that comes down from the roof into the lower river
// and draws it up in slugs, with clear lengths between them) is built here with the rank: its iron in the iron's
// mesh; its liquid and its glass two meshes of their own. What it is stands in …-pipes-great.js, its shaders in
// …-pipes-great-glsl.js.
// GLASS: a clear shell with one long clean highlight and, along both edges, the grey-green band of its own wall
// seen edge on; inside it the chocolate, a core visibly narrower than the pipe: THE RIVER'S OWN BROWN, lit by the
// river's law and put out along the river's own line of brown for the dealt hour (the chocolate part's table HOLD,
// read here, never changed here), so that pipe and river are one stuff in every hour: never red, maroon or mauve.
// In the rank it is RACING along the pipe (up, and then away from us) at 6 m a second, shown by streaks a shade or
// two lighter than the brown. The pipes carry liquid only: no shape, bulge or blockage in one, ever.
// IRON (…-pipes-iron.js): the steel fittings; flanged joints every 6 m of glass; a riveted lattice cross-beam at
// every column row from z -20 to z -220 (its top at PIPES.beam), on which every pipe sits in a steel saddle clamp
// on an iron post of its own height; painted a worn sage green, the green that the shed's columns come out as.
// FIVE DRAW CALLS: the rank's chocolate, the iron, the rank's glass shells (blended, after the solid things), and
// the great pipe's two (its chocolate; its glass, blended, last of all).
// What reads the eye: the glass's highlight and the iron's gloss (a sheen, a reflection), the band of the glass's
// wall (which lies along the pipe's edges as seen), and the pixel's footprint, by which the fine streaks, the bolts
// and the rivets fade out where a pixel is too coarse for them.
// Nothing else. The stream goes by the world's clock and is a pattern carried along the pipe, so it looks right
// from any starting clock; WHERE IN IT A VISIT BEGINS IS DEALT by the seed's stream 'pipe-streams', so that the
// great pipe's slugs and clear lengths (which its stream deals by its own places) come in another order on every
// deal. Lit by the world's two lights' own numbers (o.L) and crossed by the plan's bars of light (LIGHT_BAR_GLSL)
// like everything else in the hall.
// CLEAR AIR, counted in build with the plan's routeDistance (returned as clear, clearPipes and clearGreat for the
// checks; nothing in the world reads them): of the rank, the nearest of the pipes, fittings, joints and posts to
// the flown line is the innermost riser where the climb passes it, over 11 m off, and the nearest thing of all is
// the foot of the first beam's bracket on its column, over 8 m off. The great pipe is meant to be passed close:
// the rim of its lowest joint is 6.5 m off, its glass 6.8 m.
import * as P from './valley-inside-the-works-plan.js';
import { ironMaker, addJoint, addBend, addSaddle, addRiserClamp, addBeam, addRake } from './valley-inside-the-works-pipes-iron.js';
import { CORE_VERT, CORE_FRAG, SHELL_VERT, SHELL_FRAG, IRON_VERT, IRON_FRAG } from './valley-inside-the-works-pipes-glsl.js';
import { buildGreat, addGreatIron, greatClear } from './valley-inside-the-works-pipes-great.js';
import { SHOE, PIPE_PADS, addFeet } from './valley-inside-the-works-pipes-feet.js';
import { HOLD } from './valley-inside-the-works-chocolate-glsl.js';

const RP = P.PIPES.across / 2;          // the glass's outer radius
const CORE = 0.69;                      // the liquid's radius as a share of it: the glass wall is the rest, seen as a band
const RS = RP + 0.05;                   // the steel fittings' outer radius
const ELBOW = 1.35;                     // a steel bend's radius on its centre line: one and a half pipe widths
const CUTS = 3;                         // the mitre cuts (welds) in one bend
const NECK_END = P.SHED.zHead + 1.1;    // where a dog-leg is level again, a metre before the head wall
const SPEED = 6;                        // metres a second
const JOINT = 6;                        // a flanged joint every 6 m of glass
const SIDES = 10;                       // faces round a tube

// The corners of a mitred bend of radius ELBOW and angle th about the centre (cy, cz), in the plane of a pipe (y, z):
// it begins at the centre plus ELBOW times the unit (ey, ez), heading along the unit (fy, fz); between its two ends
// its CUTS corners stand where the tangents of the arc's equal parts cross.
function bend(cy, cz, ey, ez, fy, fz, th) {
  const d = th / CUTS, out = [];
  const at = (a, rho) => out.push([cy + rho * (Math.cos(a) * ey + Math.sin(a) * fy), cz + rho * (Math.cos(a) * ez + Math.sin(a) * fz)]);
  at(0, ELBOW);
  for (let k = 0; k < CUTS; k++) at((k + 0.5) * d, ELBOW / Math.cos(d / 2));
  at(th, ELBOW);
  return out;
}
// Pipe i, in the plane x = pipeX(i), from the pool to the head wall. Its GLASS is two straight lengths, the plumb
// riser and the level run (the plan's pipeRunY: a stepped rank), each a pair of rings { y, z, ty, tz (unit tangent),
// s (metres of pipe from where the glass leaves its shoe, for the stream) }. Its STEEL is the corners of the elbow between them
// and, for the three outermost, whose port (the plan's pipePortY) lies under their run, of the dog-leg after the last
// cross-beam: a bend down and an equal bend level again, ending at NECK_END at the port's height and running on
// into the wall (with a plumb piece between the two bends if ever the drop were more than two radii).
function pipeLine(i) {
  const yS = P.liquidY(P.PIPES.riseZ), z0 = P.PIPES.riseZ, run = P.pipeRunY(i), port = P.pipePortY(i), drop = run - port;
  const foot = yS + SHOE.glass, top = run - ELBOW, zRun0 = z0 - ELBOW, zWall = P.SHED.zHead - 0.6;
  const elbow = bend(top, zRun0, 0, 1, 1, 0, Math.PI / 2);
  let zRun1 = zWall, leg = null;
  if (drop > 0.01) {
    const th = Math.acos(Math.max(0, 1 - drop / (2 * ELBOW)));
    zRun1 = NECK_END + 2 * ELBOW * Math.sin(th);
    const down = bend(run - ELBOW, zRun1, 1, 0, 0, -1, th), level = bend(port + ELBOW, NECK_END, -1, 0, 0, 1, th).reverse();
    leg = down.concat(level).filter((q, j, all) => j === 0 || Math.hypot(q[0] - all[j - 1][0], q[1] - all[j - 1][1]) > 1e-6);
    leg[leg.length - 1] = [port, zWall];
  }
  const sRun0 = top - foot + ELBOW * Math.PI / 2;
  const glass = [
    [{ y: foot, z: z0, ty: 1, tz: 0, s: 0 }, { y: top, z: z0, ty: 1, tz: 0, s: top - foot }],
    [{ y: run, z: zRun0, ty: 0, tz: -1, s: sRun0 }, { y: run, z: zRun1, ty: 0, tz: -1, s: sRun0 + zRun0 - zRun1 }],
  ];
  return { i, glass, elbow, leg, yS, foot, top, run, zRun0, zRun1 };
}

// One mesh of tubes. A tube is { x, r, sides, which, share, rings }: its centre line lies in the plane x, r is its
// radius, and its rings are { y, z, ty, tz (unit tangent), s (metres of pipe, for the stream) }. A glass tube
// carries aAxis (the pipe's direction there, for its highlight, and the liquid's share of its radius, for the band
// of its wall); a tube of chocolate carries aFlow (metres of pipe, the place round the bore, which pipe: for its
// stream).
function tubesGeometry(THREE, tubes, glass) {
  const pos = [], nor = [], axis = [], flow = [], idx = [];
  for (const t of tubes) {
    const base = pos.length / 3, n = t.sides;
    for (const g of t.rings) for (let q = 0; q <= n; q++) {
      const f = (q / n) * Math.PI * 2, cf = Math.cos(f), sf = Math.sin(f);
      // across the pipe: e1 = +x, e2 = T x e1 = (0, tz, -ty)
      const ry = sf * g.tz, rz = -sf * g.ty;
      pos.push(t.x + t.r * cf, g.y + t.r * ry, g.z + t.r * rz);
      nor.push(cf, ry, rz);
      axis.push(0, g.ty, g.tz, t.share);
      flow.push(g.s, cf, sf, t.which);
    }
    for (let k = 0; k + 1 < t.rings.length; k++) for (let q = 0; q < n; q++) {
      const a = base + k * (n + 1) + q, b = a + 1, c = a + n + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (glass) g.setAttribute('aAxis', new THREE.Float32BufferAttribute(axis, 4));
  else g.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
// the rank's tubes at radius r: each pipe's two straight lengths
const rankTubes = (lines, r) => lines.flatMap((line) => line.glass.map((rings) => ({ x: P.pipeX(line.i), r, sides: SIDES, which: line.i, share: CORE, rings })));

// All the iron as one mesh, made in short steps.
async function ironGeometry(ctx, THREE, lines) {
  const M = ironMaker(), n = lines.length;
  for (let p = 0; p < n; p++) {
    const line = lines[p], x = P.pipeX(p), z0 = P.PIPES.riseZ;
    // THE STEEL: the elbow that turns the riser into the run (a flange on each end), and for the three outermost the
    // dog-leg down to the port (flanged where the glass run ends; its far end runs on into the wall)
    addBend(M, x, line.elbow, RS, [0, 1]);
    if (line.leg) addBend(M, x, line.leg, RS, [0]);
    // THE RISER'S JOINTS: one every 6 m down from the elbow's flange, none within 1.5 m of the shoe's collar. As the
    // rank is stepped, each pipe's joints sit 0.8 m lower than its inner neighbour's: the rings of two neighbours
    // never meet.
    for (let y = line.top - JOINT; y >= line.foot + 1.5; y -= JOINT) addJoint(M, [x, y, z0], [0, 1, 0]);
    // THE RUN'S JOINTS: one every 6 m from the elbow's flange (every other pipe 2 m out of step, as on a real pipe
    // rack), none within 2.5 m of the run's end. The elbow's flange stands 3.35 m up the valley from a column row
    // and the rows are 20 m apart, so no joint's middle comes nearer than 0.65 m to a cross-beam's saddle.
    for (let z = line.zRun0 - (p % 2 ? 2 : JOINT); z > line.zRun1 + 2.5; z -= JOINT) addJoint(M, [x, line.run, z], [0, 0, -1]);
    await ctx.yield();
  }
  // a cross-beam at every column row from z -20 to z -220 (its top at PIPES.beam). On it every pipe sits in its own
  // saddle on an iron post of its own height (1 m for the outermost pipe, 5.8 m for the innermost), and one raking
  // tie runs through the posts' heads; at the first beam the risers, which pass 1.25 m behind it, are clamped to
  // the beam's back instead, half a metre under its top: between the highest riser joint (pipe 0's, 6 m under its
  // elbow) and the lowest elbow's flange (pipe 6's).
  const yGirder = P.SHED.roofValley - 4, head = (p) => P.pipeRunY(p) - RP - 0.36;
  for (let zb = -20; zb >= -220; zb -= P.SHED.bay) {
    addBeam(M, zb, P.PIPES.beam, P.COLUMN_X[2], P.PIPES.beamEnd, yGirder);
    const level = zb < lines[0].zRun0;
    for (let p = 0; p < n; p++) {
      if (level) addSaddle(M, P.pipeX(p), P.pipeRunY(p), zb, P.PIPES.beam, RP);
      else addRiserClamp(M, P.pipeX(p), P.PIPES.beam - 0.5, P.PIPES.riseZ, zb - 0.3, RP);
    }
    if (level) addRake(M, zb, P.pipeX(0) - 0.15, head(0) + 0.075, P.pipeX(n - 1) + 0.15, head(n - 1) - 0.075);
    await ctx.yield();
  }
  // THE RANK'S FEET (…-pipes-feet.js): each pipe's iron shoe and the stone pad it stands on in the pool
  addFeet(M);
  await ctx.yield();
  // THE GREAT PIPE'S IRON (…-pipes-great.js): its joints, its two stays to the columns, its collar in the roof
  addGreatIron(M);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  // (packed one array at a step, so that no step of the build is long)
  for (const [name, list] of [['position', M.pos], ['normal', M.nor], ['aColor', M.col], ['aPaint', M.paint]]) {
    g.setAttribute(name, new THREE.Float32BufferAttribute(list, 3));
    await ctx.yield();
  }
  g.setIndex(M.idx);
  await ctx.yield();
  g.computeBoundingSphere();
  await ctx.yield();
  return g;
}

export async function buildPipes(ctx, o) {
  const THREE = o.THREE, L = o.L, object = new THREE.Group();
  const lines = [];
  for (let p = 0; p < P.PIPES.count; p++) lines.push(pipeLine(p));
  // the rank's liquid and the rank's glass
  const coreG = tubesGeometry(THREE, rankTubes(lines, RP * CORE), false), shellG = tubesGeometry(THREE, rankTubes(lines, RP), true);
  await ctx.yield();
  const ironG = await ironGeometry(ctx, THREE, lines);
  await ctx.yield();

  // ---- the light, by the world's own numbers: the sun through the roof glass and the sky's fill
  const sunC = new THREE.Color(L.sun).multiplyScalar(L.sunPower), skyC = new THREE.Color(L.sky).multiplyScalar(L.fill), groundC = new THREE.Color(L.shade).multiplyScalar(L.fill);
  // the streams' clock: the world's, from a start dealt by the seed (up to ten minutes on in the streams)
  const lead = o.rngFor('pipe-streams')() * 600, time = { value: lead };
  const lit = () => ({ uSun: { value: sunC }, uSky: { value: skyC }, uGround: { value: groundC }, uLightDir: { value: o.lightDir } });
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  // THE LIQUID, in the rank and in the great pipe: uChoc is the river's own body colour, as the chocolate part's
  // material has it, and the shader lights it by the river's law; uBrown is the river's own line of brown for the
  // dealt hour, the chocolate part's table HOLD (three linear colours, put out as they stand), along which the
  // liquid is put out by its own brightness, so that pipe and river are one stuff in every hour
  // (o.body: the river's body colour, which the world file reads from the chocolate part's material as built; without
  // it, the middle of the river's own line of brown. No colour of the liquid is typed in this file.)
  const hold = HOLD[o.look && o.look.hour] || HOLD.day, brown = hold.map((k) => new THREE.Vector3(k[0], k[1], k[2]));
  const choc = o.body ? o.body.clone() : new THREE.Color(hold[1][0], hold[1][1], hold[1][2]);
  const liquid = { uChoc: { value: choc }, uBrown: { value: brown } }, glass = new THREE.Color('#a8beb4');
  const coreM = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...lit(), ...liquid, uSpeed: { value: SPEED }, uTime: time }, vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, fog: true,
  });
  const ironM = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...lit() }, vertexShader: IRON_VERT, fragmentShader: IRON_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const shellM = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...lit(), uGlass: { value: glass } },
    vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
  });
  const core = new THREE.Mesh(coreG, coreM), iron = new THREE.Mesh(ironG, ironM), shell = new THREE.Mesh(shellG, shellM);
  shell.renderOrder = 2;
  // THE GREAT PIPE's two meshes (…-pipes-great.js): its liquid, and its glass, which is drawn after the rank's
  // glass (the great pipe can only ever stand in front of the rank: so the two blend rightly)
  const great = buildGreat(THREE, { fog: fogU, lit, liquid, time, glass });
  object.add(core, iron, shell, ...great.meshes);
  await ctx.yield();

  // ---- clear air, counted with the plan's routeDistance: the nearest any of this comes to the flown line (the
  // skins, not the centre lines): every pipe's glass along its whole length (with its joints' rings), its steel
  // fittings' corners and its pad, every post's head and foot, and every beam with its bracket down to the column
  let clear = 1e9, clearPipes = 1e9;
  const near = (x, y, z, r) => { clearPipes = Math.min(clearPipes, P.routeDistance(x, y, z) - r); };
  for (const line of lines) {
    const x = P.pipeX(line.i);
    for (const [a, b] of line.glass) { const n = Math.ceil(Math.hypot(b.y - a.y, b.z - a.z) / 2); for (let k = 0; k <= n; k++) near(x, a.y + (b.y - a.y) * k / n, a.z + (b.z - a.z) * k / n, 0.8); }
    for (const q of line.elbow.concat(line.leg || [])) near(x, q[0], q[1], 0.9);          // (a fitting's flange and its bolts)
    near(x, line.yS, P.PIPES.riseZ, PIPE_PADS[line.i].r);                                  // (the pad it stands on)
  }
  for (let zb = -40; zb >= -220; zb -= P.SHED.bay) for (let p = 0; p < lines.length; p++) for (const y of [P.PIPES.beam, P.pipeRunY(p)]) near(P.pipeX(p), y, zb, 0.8);
  clear = clearPipes;
  await ctx.yield();
  for (let zb = -20; zb >= -220; zb -= P.SHED.bay) for (let x = P.COLUMN_X[2]; x <= P.PIPES.beamEnd; x += 1) for (const y of [P.PIPES.beam - 6.2, P.PIPES.beam - 1.6, P.PIPES.beam]) clear = Math.min(clear, P.routeDistance(x, y, zb) - 0.4);
  const triangles = (coreG.index.count + shellG.index.count + ironG.index.count) / 3 + great.triangles;
  return {
    object, triangles, drawCalls: 3 + great.drawCalls, clear, clearPipes, clearGreat: greatClear(),
    update(dt, t) { time.value = t + lead; },
    dispose() { for (const made of [coreG, shellG, ironG, coreM, ironM, shellM]) made.dispose(); great.dispose(); },
  };
}
