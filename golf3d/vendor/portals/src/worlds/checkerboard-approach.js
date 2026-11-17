// CHECKERBOARD APPROACH: Kowloon in the 1990s from under the left wing of a landing jumbo. We come out of the scud low over the roofs with the orange and white
// checkerboard hill large ahead in a shaft of storm light, bank hard right round it (the board passes close under the right wing, the eye follows it), cross a floodlit
// playground and the walled city, roll out between tower blocks taller than we are and ride the running strobes down to a portal standing on the runway threshold
// inside a ring of its own light caught in the rain, a wide-body holding short beside it, the far shore's towers and the harbour beyond.
//
// Layout: the hero's space is the world's space (origin = runway threshold, +Z = landing heading, street level and
// runway at y 0, harbour at y -4). The route is the hero's own approach line (anchors.flyLine).
// The vehicle (round thirteen): the left wing, whole, and nothing else. It is tied to the bank itself: it comes down into the top of the frame as the roll builds
// (the fuselage's flank at the left edge, both engines under it, flaps out, the winglet and its lamp near the middle) and leaves by the top edge as the roll comes
// off; in level flight nothing of the airframe is in the frame. The undercarriage is not drawn: two struts with no body over them read as a fault, and no body can
// stand over them without hiding the runway. Every light that used to follow a place on the route (the strobes' gain, the shaft and the halo on the board, the
// rainbow, the rain's gain, the landing lights on the stopway) follows where the eye is: its distance from the board, the threshold or the entry, its height. Round nine also stands a landmark in
// the avenue: the hero's beacon tower, 222 m of uplit amber stone 44 m left of the centre line, a crown of tall lit windows on its middle tier (round eleven: the hill's is the one checkerboard), a lantern with
// two turning beams (the gaze leans to it as it comes up the avenue, for as long as the whole tower stands inside the frame: leanTo, from the route), and the moon stands low over the runway's line. Round eight gave the middle of the flight a moving subject: a
// freighter climbing out of the airfield toward us, a light beside the ring through the bank, coming up the avenue head-on and over our left wing where the approach rolls out of its turn (round eleven:
// its place is tied to the route, see the hero's placeFly) (the hero's second moving aircraft; the first taxis up behind the one that holds short of the runway). The parts are placed from the camera every frame, tremble with speed, and stand far away while the world is only seen through
// a portal. The aircraft's landing lights run ahead of it over the stopway (the hero's field shader, from the camera's place).
// The final (round seven) is flown over a working airfield: a paved, wet stopway under the approach lights with amber edge lights, an apron either side with parked
// wide-bodies under floodlight masts, service traffic, the island's towers close behind the runway, and a gate of two rings of lit rain 108 and 223 m across round a 40 m
// portal, all of it mirrored in the wet pavement and in the harbour.
// The checkerboard is the focal point from the first frame: a halo of lit wet air stands on it (fx.makeGlow, by day the foot of the storm shaft, after dark the floodlights' haze).
// Looks by seed: storm (the brief), golden (the squall has passed), dusk (neon and afterglow over the harbour),
// night (the sea of lights); ctx.vary.hour picks among them (and adds dawn). The rare event is a rainbow standing
// over the checkerboard (by day; it forms as the scud falls behind) or a thunderstorm over the harbour (after dark).
// ctx.vary: hour picks the look, rare the event, density the roof clutter, trees, traffic and birds, mood how heavy
// the squalls hang and how thick the scud is. After dark the checkerboard is floodlit (the hero's dusk / night hours).
// Round eleven: the board is crisp and evenly lit at every hour (after dark by lamps of its own on its kerb wall: clean squares, warm pools on its rim, a glow on the
// slope and the trees); the lit rooms of the city are grouped (whole floors, flats, stairs, dark floors, warm blocks and cool blocks); neon is unlit in the afternoon
// looks; nothing in this file or the hero's is placed or timed for a review tool's clock or positions (the lightning's phase is drawn from the world's random stream).
// Round fourteen (a clean-up): nothing here is built and thrown away, or drawn and dropped, to hold an earlier version's deal (the pine that kept the stream 'trees'
// running is gone). The lights' thresholds are measures of places in round metres (the board's width, the roll-out point, the last break-out rag, the scud's base and
// the roof line, the airfield's fence). The gaze's keys that are places are found on the route by walking it in two-metre steps: where the board is abeam (the hard
// pull at the board lets go there and the playground takes the look there), where the playground is passed (the lean to the beacon tower begins there), where the
// tower's top would leave the frame (the lean ends there); the avenue's look-ahead is a distance flown (twice the camera's own), the rags' clock is metres flown down
// the straight run-in. The helicopter works beside the board, off its face; the wing's roll, height and reach follow how far round its turn the aircraft is.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import { buildHero } from '../parts/checkerboard-approach.js';

const TAU = Math.PI * 2;
const SPEED = 72;                                    // m/s the airframe feels (rain, wash, tremble)

// ---------------------------------------------------------------- the looks
// under the floodlights' warm light the board's own orange went to signal red and its white to paper: after dark the paint is a yellower orange and a bone white
// (round eleven: the board has lamps of its own on its kerb wall, whiter than the street's sodium: a clean orange and a warm white)
const NIGHT_BOARD = [undefined, undefined, undefined, undefined, undefined, '#e9631a', '#e8e2d2'];
const LOOKS = {
  storm: {
    // the plasters pulled toward wet concrete: under the squall the checkerboard's orange is the one saturated colour
    title: 'Checkerboard Approach', hero: { hour: 'storm', wet: 0.85, shaft: 1, palette: ['#a9a498', '#93a39a', '#b39c93', '#b9ae94', '#8f9ca6', undefined, undefined, undefined, '#6a4a40', '#66747c'] }, sunEl: 25, sunAz: -62, night: 0,
    sky: { preset: 'storm', zenith: '#34404b', mid: '#57646e', horizon: '#9ba7a9', ground: '#3d464c', scatterColor: '#e8debd', scatter: 0.6, scatterPow: 5, scatterHigh: 0.08,
      sunGlow: 0.4, lightning: 0, cloudLit: '#8c969c', cloudShade: '#48525c', clouds: { coverage: 0.78, lit: '#c1c7c8', shade: '#3e4953' }, clouds2: { lit: '#7d888f', shade: '#343d46' },
      lightElevationMin: 22, lightColor: '#e6dcc4', lightIntensity: 2.1, ambientColor: '#95a2b0', groundLight: '#57544c', ambientIntensity: 1.5 },
    fog: '#919da0', density: 0.00062, rig: { intensity: 1, ambient: 1, bounce: 0.3 }, exposure: 1.16,
    bloom: { strength: 0.42, radius: 0.62, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.12, tint: '#f3f7f5', shadowTint: '#0a1116', vignette: 0.34, grain: 0.03 },
    sea: { preset: 'breeze', deep: '#263a42', scatter: '#638a8e', height: 0.5 }, rain: 0.8, veil: 0.8, veilCol: '#6f7c84', rainCol: '#cfd8dc',
    lamps: 0.5, win: '#1d262c', portal: '#d9ecff', strobe: 1.2, skyline: '#6f7c84', rays: 0.3, rayCol: '#ffe6b8', halo: ['#ffd2a0', 0.2],
  },
  golden: {
    title: 'Checkerboard Approach, after the squall', hero: { hour: 'golden', wet: 0.9, shaft: 0.75 }, sunEl: 9, sunAz: -62, night: 0.08,
    sky: { preset: 'goldenHour', zenith: '#284f8c', mid: '#6f8fc2', horizon: '#f0bc80', ground: '#7d6e66', scatter: 0.75,
      clouds: { coverage: 0.64, lit: '#ffd6a6', shade: '#5c5878', silver: 1.6 }, clouds2: { lit: '#ffe3c0', shade: '#a98fa0', opacity: 0.4 },
      lightColor: '#ffc27e', lightIntensity: 2.4, ambientColor: '#9db0dc', groundLight: '#7a6450', ambientIntensity: 1.6 },
    fog: '#c9b0a4', density: 0.00037, rig: { intensity: 1, ambient: 1, bounce: 0.3 }, exposure: 0.9,
    bloom: { strength: 0.46, radius: 0.65, threshold: 0.9 }, grade: { saturation: 1.14, contrast: 1.1, tint: '#fff6ea', shadowTint: '#0a1026', vignette: 0.34, grain: 0.025 },
    sea: { preset: 'breeze', deep: '#2b4652', scatter: '#86a69c', height: 0.45 }, rain: 0.4, veil: 0.45, veilCol: '#e9b77c', rainCol: '#ffd9a0',
    lamps: 0.6, win: '#2a2a2c', portal: '#fff0d8', strobe: 1.1, skyline: '#b9937a', rays: 0.2, rayCol: '#ffc98a', halo: ['#ffc080', 0.12],
  },
  dawn: {
    // peach light on a blue-violet city: the haze is lavender, not pink, so the warm key and the first lit windows have something cool to stand against
    title: 'Checkerboard Approach, first arrival', hero: { hour: 'dawn', wet: 0.8, shaft: 0.8 }, sunEl: 6, sunAz: -62, night: 0.15,
    sky: { preset: 'dawn', zenith: '#22407e', mid: '#7481bc', horizon: '#f4b59c', clouds: { coverage: 0.52, lit: '#ffc9ae', shade: '#565a8c', silver: 1.5 }, clouds2: { lit: '#ffd9c8', shade: '#9a8ab0', opacity: 0.4 },
      lightElevationMin: 13, lightColor: '#ffb890', lightIntensity: 2.6, ambientIntensity: 1.55 },
    fog: '#a99cc0', density: 0.00042, rig: { intensity: 1, ambient: 1, bounce: 0.3 }, exposure: 1.0,
    bloom: { strength: 0.46, radius: 0.65, threshold: 0.9 }, grade: { saturation: 1.12, contrast: 1.1, tint: '#fff4ee', shadowTint: '#0a0c22', vignette: 0.34, grain: 0.025 },
    sea: { preset: 'breeze', deep: '#2c405a', scatter: '#8a9cae', height: 0.4 }, rain: 0.15, veil: 0.4, veilCol: '#b9a0bc', rainCol: '#ffd6cc',
    lamps: 0.8, win: '#2a2a30', portal: '#ffe6e0', strobe: 1.2, skyline: '#a98f9c', rays: 0.2, rayCol: '#ffd0c0', halo: ['#ffb898', 0.14],
  },
  dusk: {
    title: 'Checkerboard Approach, last light', hero: { hour: 'dusk', wet: 0.85, shaft: 0.8, palette: NIGHT_BOARD }, sunEl: -1.5, sunAz: 205, night: 0.75,
    sky: { preset: 'sunset', zenith: '#0e1b46', clouds: { coverage: 0.56 }, lightIntensity: 1.35, ambientIntensity: 2.1 },
    fog: '#6d5a78', density: 0.00042, rig: { intensity: 1, ambient: 1, bounce: 0.25 }, exposure: 1.12,
    bloom: { strength: 0.55, radius: 0.7, threshold: 0.88 }, grade: { saturation: 1.12, contrast: 1.07, tint: '#fff2f4', shadowTint: '#080a20', vignette: 0.36, grain: 0.03 },
    sea: { preset: 'breeze', deep: '#1b2a46', scatter: '#55648a', height: 0.4 }, rain: 0.22, veil: 0.3, veilCol: '#5a4868', rainCol: '#ffb890',
    lamps: 1.5, win: '#ffc680', winGain: 1.6, portal: '#ffd9c0', strobe: 1.5, skyline: '#3a3458', glow: '#4a3628', vap: 1.15, halo: ['#ff8848', 0.22],
  },
  night: {
    title: 'Checkerboard Approach, the midnight freighter', hero: { hour: 'night', wet: 0.85, shaft: 0.8, palette: NIGHT_BOARD }, sunEl: -35, sunAz: 160, night: 1,       // no sky bake: with bake on, makeSky alone is a 50 to 95 ms step (46 at bakeSize 256)
    sky: { preset: 'night', zenith: '#050a18', mid: '#10182e', horizon: '#3a3040', ground: '#0a0c14', bodyOverrides: { 0: { elevation: 6.4, azimuth: 180.4, size: 2.4 } },          // the moon stands right of the runway: its glitter lies on the harbour beside the final
      clouds: { coverage: 0.42, scale: 0.72, softness: 0.42, lit: '#8f8cab', shade: '#201f34', silver: 0.9 }, cloudLit: '#a3a0bd', cloudShade: '#2c2a40', lightIntensity: 1.3, ambientIntensity: 2.3 },          // moonlit lavender over the warm city (brown clouds read as murk)
    fog: '#1d1f33', density: 0.0004, rig: { intensity: 1, ambient: 1, bounce: 0.2 }, exposure: 1.15,
    bloom: { strength: 0.6, radius: 0.7, threshold: 0.86 }, grade: { saturation: 1.12, contrast: 1.06, tint: '#f4f4ff', shadowTint: '#05081a', vignette: 0.38, grain: 0.03 },
    sea: { preset: 'breeze', deep: '#0d1728', scatter: '#33466a', height: 0.4, ambient: '#5a6c98' }, rain: 0.25, veil: 0, veilCol: '#1d1f33', rainCol: '#b9c8ff',
    lamps: 2, win: '#ffc680', winGain: 2.2, portal: '#cfe0ff', strobe: 1.6, skyline: '#1a1c30', glow: '#5a4030', vap: 0.4, halo: ['#ff8848', 0.28],
  },
};

// ---------------------------------------------------------------- a small geometry builder
const Z2 = [0, 0];
class PB {
  constructor() { this.p = []; this.c = []; this.w = []; this.s = []; this.i = []; }
  get n() { return this.p.length / 3; }
  // rows[j][i] = [x, y, z]; col: Color | (j, i, q) => Color; wob(j, i, q) => [phase, weight]; spin: [cy, cz] | null
  grid(rows, col, wob = null, spin = null) {
    const o = this.n, nu = rows[0].length;
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < nu; i++) {
      const q = rows[j][i], c = typeof col === 'function' ? col(j, i, q) : col, wb = wob ? wob(j, i, q) : Z2;
      this.p.push(q[0], q[1], q[2]); this.c.push(c.r, c.g, c.b); this.w.push(wb[0], wb[1]);
      this.s.push(spin ? spin[0] : 0, spin ? spin[1] : 0, spin ? 1 : 0);
    }
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = o + j * nu + i, b = a + 1, c2 = a + nu, d = c2 + 1; this.i.push(a, c2, b, b, c2, d); }
  }
  quad(a, b, c, d, col, wob = null) { this.grid([[a, b], [d, c]], col, wob); }
  box(x0, x1, y0, y1, z0, z1, col, wob = null, top = col) {
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, wob); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, wob);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, wob); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, wob);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top, wob); this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, wob);
  }
  // open tube from a to b
  tube(a, b, r0, r1, seg, col, wob = null) {
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], l = Math.hypot(ax, ay, az) || 1, dx = ax / l, dy = ay / l, dz = az / l;
    let ux = -dz, uy = 0, uz = dx; if (Math.abs(dy) > 0.9) { ux = 1; uy = 0; uz = 0; }
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    const ring = (p, r) => { const o = []; for (let i = 0; i <= seg; i++) { const t = (i / seg) * TAU, c = Math.cos(t) * r, s = Math.sin(t) * r; o.push([p[0] + ux * c + vx * s, p[1] + uy * c + vy * s, p[2] + uz * c + vz * s]); } return o; };
    this.grid([ring(a, r0), ring(b, r1)], col, wob);
  }
  // rings round the Z axis through (cx, cy): profile = [[z, r, Color], ...]
  latheZ(cx, cy, profile, seg, a0 = 0) {
    const rows = profile.map((q) => { const o = []; for (let i = 0; i <= seg; i++) { const t = a0 + (i / seg) * TAU; o.push([cx + Math.cos(t) * q[1], cy + Math.sin(t) * q[1], q[0]]); } return o; });
    this.grid(rows, (j) => profile[j][2]);
  }
  // a wheel: rings round the X axis through (cy, cz); profile = [[x, r, Color, Color2?], ...]; it spins in the shader
  wheel(cx, cy, cz, profile, seg) {
    const rows = profile.map((q) => { const o = []; for (let i = 0; i <= seg; i++) { const t = (i / seg) * TAU; o.push([cx + q[0], cy + Math.cos(t) * q[1], cz + Math.sin(t) * q[1]]); } return o; });
    this.grid(rows, (j, i) => (profile[j][3] && (i % 6) < 3 ? profile[j][3] : profile[j][2]), null, [cy, cz]);
  }
  build(plain = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (!plain) { g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 2)); g.setAttribute('aSpin', new THREE.Float32BufferAttribute(this.s, 3)); }
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
}
const H = (h) => new THREE.Color(h);

// ---------------------------------------------------------------- the airframe round the camera
// Camera space: x right, y up, -z ahead. The outer wing seen whole to its tip (flaps out, the outboard engine on its pylon, a winglet) across the top left of the frame
// through the bank (round thirteen: nothing else; the undercarriage is no longer drawn). craft.update brings it in and out with the roll.
const PAINT_VERT = /* glsl */`
attribute vec3 color; attribute vec2 aW; attribute vec3 aSpin;
uniform float uTime, uShake, uSpin;
varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vWp;
void main() {
  vec3 p = position, n = normal;
  if (aSpin.z > 0.5) {
    float c = cos(uSpin), s = sin(uSpin); vec2 d = p.yz - aSpin.xy;
    p.yz = aSpin.xy + vec2(c*d.x - s*d.y, s*d.x + c*d.y);
    n.yz = vec2(c*n.y - s*n.z, s*n.y + c*n.z);
  }
  vL = position; vC = color;
  float wob = (sin(uTime*21.0 + aW.x*17.0)*0.5 + sin(uTime*8.3 + aW.x*5.3) + 0.6*sin(uTime*2.9 + aW.x*3.1))*aW.y*uShake;
  p += normal*(wob*0.018);
  vN = mat3(modelMatrix)*n;
  vec4 wp = modelMatrix*vec4(p, 1.0); vWp = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const PAINT_FRAG = /* glsl */`
uniform vec3 uHemiSky, uHemiGround, uKeyCol, uKeyDir, uBeaconCol, uBeaconPos; uniform float uBeacon, uHot;
varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vWp;
void main() {
  vec3 n = vN/max(length(vN), 1e-5); if (!gl_FrontFacing) n = -n;
  vec3 v = cameraPosition - vWp; v /= max(length(v), 1e-5);
  vec3 q = vL*vec3(0.36, 1.3, 0.31); vec3 fw = fwidth(q) + 1e-4; vec3 f = abs(fract(q) - 0.5);          // skin panels three metres by three: a wing, not a tiled ceiling
  vec3 d = (0.5 - f)/(fw*1.2); float ln = clamp(min(min(d.x, d.y), d.z), 0.0, 1.0);
  ln = mix(ln, 1.0, smoothstep(0.15, 0.5, max(max(fw.x, fw.y), fw.z)));
  float grime = 0.86 + 0.14*sin(vL.z*2.3 + sin(vL.x*1.7 + vL.y*2.1)*1.9);
  float hot = step(1.01, vC.r);
  vec3 alb = min(vC, vec3(1.0))*grime*mix(0.8, 1.0, ln)*mix(1.0, 0.1, hot);
  vec3 hemi = mix(uHemiGround, uHemiSky, n.y*0.5 + 0.5);
  vec3 col = alb*(hemi + uKeyCol*max(dot(n, uKeyDir), 0.0));
  float fr = 1.0 - abs(dot(n, v)); fr = fr*fr*fr;
  col += fr*mix(uHemiGround, uHemiSky, 0.6)*0.45;
  vec3 bl = uBeaconPos - vWp; float bd = max(length(bl), 0.5);
  col += (alb + 0.05)*uBeaconCol*uBeacon*max(dot(n, bl/bd), 0.0)*(9.0/(bd*bd + 6.0));
  col += max(vC - vec3(1.0), 0.0)*uHot;          // a vertex colour above one glows by the excess (the core nozzle's throat)
  gl_FragColor = vec4(col, 1.0);
}`;

// Built in slices (a yield between the wing's skin, its flaps, the nacelle, the two merged geometries and the gear's wheels): in one piece it was a step of 11 to 24 ms, 99 on a busy machine.
// It draws nothing from any random stream.
async function buildAircraft(trimHex, vapCol, ctx) {
  const cWhite = H('#b4b9bd'), cGrey = H('#8a9095'), cMetal = H('#c3c7ca'), cDark = H('#3a3d42'), cTyre = H('#141518'), cHub = H('#a2a7ab'), cHub2 = H('#5d6166'), cSteel = H('#6c7177'), cTrim = H(trimHex), cDoor = cWhite.clone().lerp(cTrim, 0.22);
  const U = {
    uTime: { value: 0 }, uShake: { value: 1 }, uSpin: { value: 0 }, uBeacon: { value: 0 }, uHot: { value: 1 },
    uHemiSky: { value: new THREE.Color(0.3, 0.3, 0.3) }, uHemiGround: { value: new THREE.Color(0.1, 0.1, 0.1) }, uKeyCol: { value: new THREE.Color(0.3, 0.3, 0.3) },
    uKeyDir: { value: new THREE.Vector3(0, 1, 0) }, uBeaconCol: { value: new THREE.Color(2.6, 0.12, 0.08) }, uBeaconPos: { value: new THREE.Vector3() },
  };
  const paint = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PAINT_VERT, fragmentShader: PAINT_FRAG, side: THREE.DoubleSide });
  const mesh = (pb) => { const m = new THREE.Mesh(pb.build(), paint); m.frustumCulled = false; return m; };

  // ---- round seven: the outer wing as a whole thing. It is seen from behind and a little below, running in from the left edge of the frame to its tip: the trailing-edge
  // flaps hanging open, the outboard engine on its pylon (a dark nozzle with a hot throat), flap-track fairings, an upturned winglet in the trim colour, a green lamp and a
  // strobe at the tip, vapour streaming from it. The inboard engine is modelled too but stands outside the frame. Local origin = the middle of the inboard fan cowl; x < 0 is
  // outboard. (The world mirrors the group, so the tip points right.) It draws nothing from any random stream.
  const WY = 3.2, zLE = (x) => 0.3 - (x > 0 ? 0.28 : 0.25) * x, yW = (x) => WY + Math.max(0, -x) * 0.08, chord = (x) => (x > 0 ? 1 + 0.02 * x : Math.max(0.36, 1 + x * 0.0213));
  const TIPX = -30, tipY = yW(TIPX), tipZ = zLE(TIPX), tipC = chord(TIPX) * 9;
  const wb = new PB();
  { const prof = [[9, 0.02], [4, 0], [1.6, -0.03], [0.5, 0], [0.14, 0.1], [0, 0.33], [0.16, 0.62], [0.7, 0.86], [2.2, 1.12]], rows = [];
    for (let x = TIPX; x <= 26.01; x += 2) { const c = chord(x); rows.push(prof.map((q) => [x, yW(x) + q[1] * c, zLE(x) + q[0] * c])); }
    wb.grid(rows, (j, i) => (i >= 3 && i <= 6 ? cMetal : cWhite));
    // round nine: the wing is carried inboard to the fuselage (its lower flank: white, a line of the trim colour, the grey belly), so that no open end shows on a wide screen
    { const fx = 30.3, fy = WY + 1.7, fr = 3.35, frows = [];
      for (const z of [-50, -24, 2, 28, 46]) { const row = []; for (let i = 0; i <= 12; i++) { const t = Math.PI * (0.42 + 1.16 * i / 12); row.push([fx + Math.cos(t) * fr, fy + Math.sin(t) * fr, z]); } frows.push(row); }
      wb.grid(frows, (j, i) => (i < 6 ? cWhite : i === 6 ? cTrim : cGrey)); }
    // the tip: a cap over the open end and the winglet standing on it
    wb.grid([[[TIPX, tipY + 0.02, tipZ + tipC], [TIPX, tipY + 0.1, tipZ]], [[TIPX - 0.5, tipY + 0.3, tipZ + tipC], [TIPX - 0.5, tipY + 0.3, tipZ + 0.6]]], cWhite);
    wb.grid([[[TIPX - 0.3, tipY + 0.25, tipZ + 0.9], [TIPX - 0.3, tipY + 0.25, tipZ + tipC]], [[TIPX - 1.4, tipY + 2.7, tipZ + 2.5], [TIPX - 1.4, tipY + 2.7, tipZ + tipC + 0.7]]], (j) => (j ? cTrim : cDoor));
    await ctx.yield();
    // Krueger flaps hanging open in front of the leading edge, either side of the pylons; they tremble
    const panels = [[-27.4, -24.6], [-24.3, -21.5], [-21.2, -18.4], [-15.6, -12.8], [-12.4, -9.6], [-9.3, -6.5], [-6.2, -3.4], [-3.1, -0.7], [0.7, 3.3], [3.6, 6.4], [6.7, 9.5]];
    panels.forEach(([xa, xb], k) => {
      const rws = [];
      for (let j = 0; j <= 5; j++) { const s = j / 5, row = []; for (let i = 0; i <= 2; i++) { const x = lerp(xa, xb, i / 2); row.push([x, yW(x) - 0.14 - 0.5 * s + 0.1 * Math.sin(Math.PI * s), zLE(x) + 0.1 - 0.85 * s]); } rws.push(row); }
      wb.grid(rws, (j) => (j === 0 || j === 5 ? cGrey : cMetal), (j) => [k * 1.7 + 0.3, j / 5]);
    });
    await ctx.yield();
    // the trailing-edge flaps, run out and down for landing: from behind they are the face of the wing. They tremble in the wash.
    const flap = (xa, xb, drop, k) => {
      const rws = [];
      for (let j = 0; j <= 4; j++) { const s = j / 4, row = []; for (let i = 0; i <= 4; i++) { const x = lerp(xa, xb, i / 4), c = chord(x); row.push([x, yW(x) - 0.05 - drop * (0.35 * s + 0.65 * s * s) * c, zLE(x) + (8.7 + 3.1 * s) * c]); } rws.push(row); }
      wb.grid(rws, (j) => (j === 0 ? cGrey : j === 2 ? cMetal : cWhite), (j) => [k * 1.3 + 0.7, 0.2 + 0.5 * j / 4]);
    };
    flap(-15.3, -1.7, 1.9, 0); flap(1.7, 11.6, 1.9, 1); flap(-26.5, -18.7, 0.7, 2);
    // flap-track fairings under the wing
    for (const fx of [-23, -11.5, -5, 4.2]) { const c = chord(fx); wb.latheZ(fx, yW(fx) - 0.42 * c, [[zLE(fx) + 3.4 * c, 0.03, cGrey], [zLE(fx) + 4.4 * c, 0.36 * c, cWhite], [zLE(fx) + 7.5 * c, 0.44 * c, cWhite], [zLE(fx) + 10.4 * c, 0.2 * c, cGrey]], 10); }
  }
  await ctx.yield();
  // the nacelles: a plain cowl, bright lip, and from behind what an engine is: the fan duct's dark mouth under the cowl's trailing edge, the core cowl coming out of it,
  // a DARK core nozzle whose throat glows inside it (the hot colour sits on the inner wall and the turbine's annulus, never on the lip), the plug
  const cBlack = H('#090a0c'), cHot = new THREE.Color(2.6, 1.45, 0.95), cSoot = H('#1c1d20');
  const nacelle = async (cx) => {
    const cy = yW(cx) - WY, dz = zLE(cx) - zLE(0);
    wb.latheZ(cx, cy, [[-3.3, 1.0, cDark], [-3.56, 1.12, cMetal], [-3.5, 1.27, cMetal], [-3.2, 1.37, cMetal], [-2.95, 1.42, cWhite], [-2.05, 1.47, cWhite],
      [0.2, 1.44, cWhite], [1.5, 1.32, cWhite], [1.9, 1.2, cMetal], [1.92, 1.12, cDark], [1.1, 1.0, cBlack], [1.1, 0.86, cBlack], [1.9, 0.84, cSteel], [3.0, 0.64, cSteel],
      [3.14, 0.6, cSoot], [3.14, 0.53, cSoot], [2.72, 0.47, cSoot], [2.45, 0.43, cHot], [2.45, 0.3, cBlack], [4.3, 0.03, cSteel]].map(([z, r, c]) => [z + dz, r, c]), 24, Math.PI);
    wb.grid([[[cx - 0.2, cy + 1.2, dz - 2.3], [cx + 0.2, cy + 1.2, dz - 2.3], [cx + 0.2, cy + 1.2, dz + 2.4], [cx - 0.2, cy + 1.2, dz + 2.4], [cx - 0.2, cy + 1.2, dz - 2.3]],
      [[cx - 0.26, yW(cx), dz + 0.4], [cx + 0.26, yW(cx), dz + 0.4], [cx + 0.26, yW(cx), dz + 3.9], [cx - 0.26, yW(cx), dz + 3.9], [cx - 0.26, yW(cx), dz + 0.4]]], cWhite);
    wb.quad([cx + 1.36, cy + 0.55, dz - 2.4], [cx + 1.78, cy + 0.76, dz - 1.9], [cx + 1.74, cy + 0.74, dz - 0.9], [cx + 1.4, cy + 0.56, dz - 0.8], cGrey);
    await ctx.yield();
  };
  await nacelle(0); await nacelle(-17);
  const wingMesh = mesh(wb);
  await ctx.yield();
  // the vortex the wingtip sheds in wet air: a ribbon streaming back from the winglet
  const vg = new THREE.BufferGeometry();
  { const P = [], UV = [], I = [], n = 12;
    for (let i = 0; i <= n; i++) { const t = i / n, w = 0.1 + 0.5 * t, x = TIPX - 0.9 - 0.3 * t, y = tipY + 1.5 + 0.5 * t, z = tipZ + tipC + 6.5 * t; P.push(x, y - w, z, x + 0.25 * w, y + w, z); UV.push(0, t, 1, t); if (i < n) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    vg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); vg.setIndex(I); }
  const VU = { uTime: U.uTime, uVap: { value: 0.2 }, uCol: { value: vapCol } };       // the look's haze pulled toward white: lighter than the sky behind it
  const vapour = new THREE.Mesh(vg, new THREE.ShaderMaterial({
    uniforms: VU, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uVap; uniform vec3 uCol; varying vec2 vUv;
      void main() {
        float across = 1.0 - abs(vUv.x*2.0 - 1.0);
        float n1 = 0.55 + 0.45*sin(vUv.y*19.0 - uTime*31.0 + sin(vUv.y*7.0 - uTime*9.0)*1.7);
        float n2 = 0.6 + 0.4*sin(vUv.y*5.3 - uTime*13.0 + 1.3);
        float a = across*across*smoothstep(0.0, 0.12, vUv.y)*(1.0 - smoothstep(0.5, 1.0, vUv.y))*n1*n2*uVap;
        gl_FragColor = vec4(uCol*a, a*0.25);
      }`,
  }));
  vapour.frustumCulled = false; vapour.renderOrder = 6;
  // lamps that face the eye: one material each, a soft glow with a hot core (the gear's landing lamps, the wingtip's navigation lamp and strobe)
  const glowPlane = (size, r, g, b, order) => {
    const GU = { uGlow: { value: 0 }, uCol: { value: new THREE.Vector3(r, g, b) } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShaderMaterial({
      uniforms: GU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = uv*2.0 - 1.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uGlow; uniform vec3 uCol; varying vec2 vQ;
        void main() { float r2 = dot(vQ, vQ); float I = (exp(-r2*9.0)*0.45 + exp(-r2*70.0)*3.2)*(1.0 - smoothstep(0.6, 1.0, r2)); gl_FragColor = vec4(uCol*I*uGlow, 1.0); }`,
    }));
    m.frustumCulled = false; m.renderOrder = order;
    return { mesh: m, U: GU };
  };
  const tipLamp = glowPlane(1.9, 0.12, 1.0, 0.36, 7), tipStrobe = glowPlane(3.4, 1.0, 1.0, 1.0, 7);
  const strobePh = makeRng(hashSeed('cb-strobe:' + (ctx?.seed ?? 0)))();          // where in its 1.25 s the strobe stands when the world starts: a draw of its own
  tipLamp.mesh.position.set(TIPX - 0.8, tipY + 0.4, tipZ + 1.2); tipStrobe.mesh.position.set(TIPX - 1.2, tipY + 1.6, tipZ + tipC);
  const wing = new THREE.Group(); wing.add(wingMesh, vapour, tipLamp.mesh, tipStrobe.mesh); wing.scale.x = -1;
  await ctx.yield();

  const group = new THREE.Group(); group.name = 'cb-airframe'; group.matrixAutoUpdate = false; group.frustumCulled = false;
  group.add(wing);
  const local = new THREE.Matrix4();
  let triangles = 0; group.traverse((o) => { if (o.geometry) triangles += o.geometry.index.count / 3; });
  return {
    group, uniforms: U, triangles,
    // rise 0 = parked far away (the world is only seen through a portal). Round thirteen: the wing belongs to the bank. kW is how far the aircraft is rolled into its
    // turn, read by the world from the route's own curvature: as it rolls in the whole wing comes down, level, out of the frame's top edge (both engines under it, flaps
    // out, the winglet and its lamp near the middle), rides there for as long as the turn lasts and goes back up as the turn rolls out. At every bank, by the bank alone.
    update(camera, time, rise, turnK, flyK, beacon, kW = 0, lampK = 1, arcF = 0.5) {
      U.uHot.value = lampK * lampK;
      if (rise <= 0) { group.matrix.makeTranslation(0, -30000, 0); group.matrixWorldNeedsUpdate = true; return; }
      const at = Math.abs(turnK), buff = 0.45 + 0.55 * flyK + 0.6 * at;
      U.uTime.value = time; U.uShake.value = buff; U.uBeacon.value = beacon * 0.35 * kW;
      VU.uVap.value = (0.25 + 0.75 * at) * kW;
      local.makeTranslation(Math.sin(time * 31) * 0.003 * buff, (Math.sin(time * 43 + 1) * 0.004 + Math.sin(time * 1.9) * 0.012) * buff, 0);
      group.matrix.multiplyMatrices(camera.matrixWorld, local); group.matrixWorldNeedsUpdate = true;
      const hide = 1 - kW;
      // the whole wing along the top of the frame, 42 m ahead of the eye: the fuselage's flank beyond the left edge, both engines hanging under it in the upper left, the
      // tip with its winglet and lamp just right of the middle. It leaves straight up through the top edge (no corner holds a piece of it), and it breathes in the gusts.
      // Round fourteen: the wing shows the bank, not only that there is one. arcF is how far round its turn the aircraft is (0 rolling in, 1 rolling out, from the
      // heading it has turned through): the wing rolls deepest and rides lowest in the middle of the turn, sits higher and flatter as it rolls in and out, and slides
      // six metres outboard from the first of the turn to the last. The ride's own attitude, by where the aircraft is in its turn.
      const deep = Math.sin(Math.PI * arcF);
      wing.position.set(-33 + 6 * arcF + Math.sin(time * 3.1) * 0.03 * buff + Math.sin(time * 0.43 + 1) * 0.5, 15.2 + 2.4 * (1 - deep) + hide * 31 + Math.sin(time * 2.3) * 0.06 * buff + Math.sin(time * 7.7) * 0.012 + Math.sin(time * 0.61) * 0.45, -42);
      wing.rotation.set(0.05 + Math.sin(time * 2.7) * 0.006 * buff, Math.sin(time * 3.9) * 0.004 * buff, -0.14 - 0.13 * deep - turnK * 0.015 + Math.sin(time * 1.3) * 0.008 * buff + Math.sin(time * 0.52) * 0.012);
      tipLamp.U.uGlow.value = kW * (0.5 + 0.5 * lampK);
      { const sp = (time / 1.25 + strobePh) % 1; tipStrobe.U.uGlow.value = kW * lampK * 1.6 * smoothstep(0, 0.08, sp) * (1 - smoothstep(0.08, 0.36, sp)); }          // one eased flash every 1.25 s
      U.uBeaconPos.value.set(0, -1.2, -9).applyMatrix4(camera.matrixWorld);
    },
  };
}

// ---------------------------------------------------------------- rain: streaks in camera space along the relative wind
function buildRain(rng, n, colour) {
  const pos = new Float32Array(n * 12), cor = new Float32Array(n * 8), rnd = new Float32Array(n * 4), idx = new Uint32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const x = rng(), y = rng(), z = rng(), r = rng();
    for (let k = 0; k < 4; k++) { const o = i * 4 + k; pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z; rnd[o] = r; cor[o * 2] = k === 1 || k === 2 ? 1 : 0; cor[o * 2 + 1] = k < 2 ? -1 : 1; }
    const a = i * 4, o = i * 6; idx[o] = a; idx[o + 1] = a + 1; idx[o + 2] = a + 2; idx[o + 3] = a; idx[o + 4] = a + 2; idx[o + 5] = a + 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2)); g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  const U = { uOff: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(40, 26, 46) }, uStreak: { value: new THREE.Vector3(0, -0.4, 0) },
    uRes: { value: new THREE.Vector2(800, 450) }, uOpacity: { value: 0 }, uCol: { value: H(colour) }, uLand: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aCorner; attribute float aRnd;
      uniform vec3 uOff, uBox, uStreak; uniform vec2 uRes; uniform float uOpacity, uLand;
      varying float vA; varying float vT; varying float vL;
      void main() {
        vec3 p = (fract(position + uOff) - 0.5)*uBox; p.z -= uBox.z*0.5 + 1.5;
        vec3 tail = p - uStreak*(0.5 + aRnd); tail.z = min(tail.z, -0.6);
        vec4 ca = projectionMatrix*vec4(p, 1.0), cb = projectionMatrix*vec4(tail, 1.0);
        vec2 d = (ca.xy/ca.w - cb.xy/cb.w)*uRes; float dl = max(length(d), 1e-3); vec2 nr = vec2(-d.y, d.x)/dl;
        vec4 c = mix(ca, cb, aCorner.x);
        c.xy += nr*aCorner.y*(0.6 + 0.5*aRnd)/uRes*c.w;
        float depth = -p.z;
        vA = uOpacity*(0.3 + 0.7*aRnd)*smoothstep(1.2, 4.0, depth)*(1.0 - smoothstep(uBox.z*0.55, uBox.z, depth));
        // round nine: on the last of the final the rain ahead of and below the eye falls through our own landing lights and burns white in them
        vL = uLand*exp(-p.x*p.x/55.0)*(1.0 - smoothstep(-7.0, -0.5, p.y))*smoothstep(4.0, 10.0, depth)*(1.0 - smoothstep(28.0, 44.0, depth));
        vA *= 1.0 + 9.0*vL;
        vT = aCorner.x;
        gl_Position = c;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying float vA; varying float vT; varying float vL;
      void main() { gl_FragColor = vec4(mix(uCol, vec3(1.0, 0.95, 0.84), clamp(vL*1.5, 0.0, 1.0))*vA*(1.0 - 0.85*vT), 0.0); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  const off = U.uOff.value, box = U.uBox.value;
  return {
    object: mesh, uniforms: U,
    // v: velocity of the rain relative to the camera, world space
    update(camera, dt, v, opacity, renderer) {
      const e = camera.matrixWorld.elements;
      const vx = v.x * e[0] + v.y * e[1] + v.z * e[2], vy = v.x * e[4] + v.y * e[5] + v.z * e[6], vz = v.x * e[8] + v.y * e[9] + v.z * e[10];
      off.x += vx * dt / box.x; off.y += vy * dt / box.y; off.z += vz * dt / box.z;
      off.x -= Math.floor(off.x); off.y -= Math.floor(off.y); off.z -= Math.floor(off.z);
      const sp = Math.max(1e-3, Math.hypot(vx, vy, vz)), len = Math.max(sp * 0.018, 0.3) / sp;
      U.uStreak.value.set(vx * len, vy * len, vz * len);
      U.uOpacity.value = opacity;
      if (renderer) renderer.getDrawingBufferSize(U.uRes.value);
    },
  };
}

// ---------------------------------------------------------------- squalls: curtains of rain hanging from the cloud base
function buildSqualls(list, colour, time) {
  const n = list.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), par = new Float32Array(n * 16), idx = [];
  list.forEach((q, i) => {
    for (let k = 0; k < 4; k++) { const o = i * 4 + k; pos[o * 3] = q.x; pos[o * 3 + 1] = q.top; pos[o * 3 + 2] = q.z; uv[o * 2] = k === 1 || k === 2 ? 0.5 : -0.5; uv[o * 2 + 1] = k < 2 ? 0 : 1; par[o * 4] = q.width; par[o * 4 + 1] = q.top + 6; par[o * 4 + 2] = q.phase; par[o * 4 + 3] = q.strength; }
    const a = i * 4; idx.push(a, a + 1, a + 2, a, a + 2, a + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aS', new THREE.BufferAttribute(par, 4)); g.setIndex(idx);
  const U = { uTime: time, uWind: { value: new THREE.Vector2(0.6, 0.8) }, uCol: { value: H(colour) }, uGain: { value: 1 }, uGlow: { value: new THREE.Color(0, 0, 0) }, uBody: { value: new THREE.Color(0, 0, 0) }, uTrace: { value: 0.1 } };          // uGlow: the light under the foot of a squall whose phase is 1 or more (the glow of the city beyond it); uBody: the light that squall's own rain catches (the moon's, after dark)
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aUv; attribute vec4 aS; uniform float uTime; uniform vec2 uWind;
      varying vec2 vUv; varying float vStr; varying float vDist; varying float vPh;
      void main() {
        vec3 c = position; c.xz += uWind*(sin(uTime*0.011 + aS.z*6.2832)*150.0 + uTime*1.2);
        vec2 t = vec2(cameraPosition.z - c.z, c.x - cameraPosition.x); t /= max(length(t), 1e-3);
        vec3 wp = c + vec3(t.x, 0.0, t.y)*(aUv.x*aS.x) + vec3(uWind.x, 0.0, uWind.y)*((1.0 - aUv.y)*aS.y*0.2);
        wp.y = c.y + (aUv.y - 1.0)*aS.y;
        vUv = vec2(aUv.x + 0.5, aUv.y); vStr = aS.w; vPh = aS.z;
        vec4 mv = viewMatrix*vec4(wp, 1.0); vDist = length(mv.xyz);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol, uGlow, uBody; uniform float uTime, uGain, uTrace;
      varying vec2 vUv; varying float vStr; varying float vDist; varying float vPh;
      void main() {
        float edge = smoothstep(0.0, 0.42, vUv.x)*(1.0 - smoothstep(0.58, 1.0, vUv.x));
        float top = 1.0 - smoothstep(0.7, 1.0, vUv.y), foot = 0.5 + 0.5*smoothstep(0.0, 0.2, vUv.y);
        float st = 0.64 + 0.36*sin(vUv.x*46.0 + vPh*40.0 + sin(vUv.y*4.0 + vUv.x*9.0)*1.5);
        st *= 0.82 + 0.18*sin(vUv.y*9.0 + uTime*1.3 + vUv.x*30.0);
        float df = uGain*smoothstep(250.0, 800.0, vDist)*(1.0 - smoothstep(4200.0, 6000.0, vDist));
        float a = edge*top*foot*st*vStr*df;
        // (a squall with a glow under it: a low haze of light on the water at its foot, its top broken by the curtain's own streaks, a trace of it up the rain
        // by day (uTrace) and none after dark, and what the rain itself catches of the moon)
        float sm = step(1.0, vPh)*edge*edge*df*vStr;
        gl_FragColor = vec4(uCol*a + uBody*sm*top*foot*0.7 + uGlow*sm*((1.0 - smoothstep(0.0, 0.04 + 0.11*st, vUv.y))*0.6*(0.65 + 0.35*st) + uTrace*top), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { object: mesh, uniforms: U };
}

// ---------------------------------------------------------------- harbour traffic: double-ended ferries, freighters at anchor, wakes
function ferryGeometry(K) {
  const hull = H('#1f4a39'), white = H('#dedbd0'), deck = H('#6f6a60'), roof = H('#a9a598'), buff = H('#cfa844'), black = H('#1b1c1e');
  const b = new PB(), zs = [-17, -13, -7, 0, 7, 13, 17], hb = [0.3, 2.9, 4.1, 4.3, 4.1, 2.9, 0.3];
  b.grid(zs.map((z, k) => { const w = hb[k]; return [[-w, 2.3, z], [-w * 0.92, 0.4, z], [-w * 0.6, -0.9, z], [w * 0.6, -0.9, z], [w * 0.92, 0.4, z], [w, 2.3, z]]; }), hull);
  b.grid(zs.map((z, k) => [[-hb[k], 2.3, z], [hb[k], 2.3, z]]), deck);
  b.box(-3.6, 3.6, 2.3, 4.5, -12.5, 12.5, white); b.box(-3.4, 3.4, 4.5, 6.7, -10.5, 10.5, white); b.box(-3.75, 3.75, 6.7, 6.95, -11.5, 11.5, roof);
  for (const s of [-1, 1]) b.box(-1.6, 1.6, 6.95, 8.6, s * 9.3 - 1.2, s * 9.3 + 1.2, white, null, roof);
  b.tube([0, 6.95, 0], [0, 10.4, 0], 1.0, 0.9, 10, buff); b.tube([0, 10.4, 0], [0, 11.1, 0], 0.93, 0.93, 10, black);
  const w = new PB(), glass = H('#ffffff');
  for (const s of [-1, 1]) { w.quad([s * 3.63, 2.9, -12], [s * 3.63, 2.9, 12], [s * 3.63, 3.9, 12], [s * 3.63, 3.9, -12], glass); w.quad([s * 3.43, 5.1, -10], [s * 3.43, 5.1, 10], [s * 3.43, 6.1, 10], [s * 3.43, 6.1, -10], glass);
    w.quad([-1.4, 7.5, s * 10.55], [1.4, 7.5, s * 10.55], [1.4, 8.3, s * 10.55], [-1.4, 8.3, s * 10.55], glass); }
  const g = b.build(true), gw = w.build(true); g.scale(K, K, K); gw.scale(K, K, K);
  return { hull: g, windows: gw };
}
// the lit windows of a freighter's house: three decks, on all four faces (one mesh, instanced with the hulls)
function freighterWindows() {
  const w = new PB(), g = H('#ffffff');
  for (const y of [8.2, 10.9, 13.4]) {
    for (let i = 0; i < 5; i++) {
      const x0 = -5.6 + i * 2.35, z0 = 31 + i * 2.6;
      w.quad([x0, y, 44.08], [x0 + 1.7, y, 44.08], [x0 + 1.7, y + 1, 44.08], [x0, y + 1, 44.08], g); w.quad([x0 + 1.7, y, 29.92], [x0, y, 29.92], [x0, y + 1, 29.92], [x0 + 1.7, y + 1, 29.92], g);
      for (const sx of [-1, 1]) w.quad([sx * 6.58, y, z0], [sx * 6.58, y, z0 + 1.8], [sx * 6.58, y + 1, z0 + 1.8], [sx * 6.58, y + 1, z0], g);
    }
  }
  return w.build(true);
}
function freighterGeometry(rng, trim, grey = 0) {
  const hull = H('#2a2e35'), boot = H('#6b2b23'), deck = H('#5c4c42'), white = H('#d2d0c8'), mast = H('#b9a13c');
  const toGrey = (c) => { const l = c.r * 0.3 + c.g * 0.6 + c.b * 0.1; c.r += (l - c.r) * grey; c.g += (l - c.g) * grey; c.b += (l - c.b) * grey; return c; };          // round nine: under the squall the boxes go half way to their own grey
  const boxes = ['#8a3a2a', '#2f5f8a', '#3d7a5a', '#8f9296', '#c8742a', '#5a3a6a'].map(H).map(toGrey); toGrey(boot); toGrey(mast);
  const b = new PB(), zs = [-55, -48, -30, 0, 35, 50, 55], hb = [0.5, 5, 8, 8.2, 8, 5.5, 3], top = [9, 7.5, 6, 6, 6, 6.5, 7];
  b.grid(zs.map((z, k) => { const w = hb[k]; return [[-w, top[k], z], [-w * 0.96, 1.2, z], [-w * 0.8, -2.5, z], [w * 0.8, -2.5, z], [w * 0.96, 1.2, z], [w, top[k], z]]; }), (j, i) => (i === 0 || i === 5 ? hull : i === 1 || i === 4 ? hull : boot));
  b.grid(zs.map((z, k) => [[-hb[k], top[k], z], [hb[k], top[k], z]]), deck);
  b.box(-6.5, 6.5, 6, 17, 30, 44, white); b.box(-8.5, 8.5, 14, 17, 34, 40, white); b.box(-2.2, 2.2, 17, 22.5, 39, 44, toGrey(H(trim)));
  for (let k = 0; k < 5; k++) { const z0 = -42 + k * 13.5, n = 1 + Math.floor(rng() * 3); b.box(-7, 7, 6, 6 + 2.6 * n, z0, z0 + 11.5, boxes[Math.floor(rng() * boxes.length)]); if (rng() < 0.5) b.box(-7, 0, 6 + 2.6 * n, 8.6 + 2.6 * n, z0, z0 + 11.5, boxes[Math.floor(rng() * boxes.length)]); }
  for (const z of [-47, 26]) b.tube([0, 6, z], [0, 21, z], 0.45, 0.3, 6, mast);
  return b.build(true);
}
const WAKE_VERT = /* glsl */`
varying vec2 vUv; varying float vStr;
${fx.GLSL_FOG_PARS_VERT}
void main() {
  vUv = uv; vStr = length(instanceMatrix[1].xyz);
  vec4 mvPosition = modelViewMatrix*instanceMatrix*vec4(position.x, 0.0, position.z, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const WAKE_FRAG = /* glsl */`
uniform vec3 uFoam; uniform float uTime; varying vec2 vUv; varying float vStr;
${fx.GLSL_FOG_PARS_FRAG}
void main() {
  float v = vUv.y, x = vUv.x*2.0 - 1.0, w = 0.1 + 0.9*v;
  float ar = (abs(x) - w*0.9)/(0.05 + 0.07*v); float arm = exp(-ar*ar);
  float core = exp(-x*x/(0.02 + 0.5*v*v))*(1.0 - smoothstep(0.0, 0.6, v));
  float rip = 0.65 + 0.35*sin(v*70.0 - uTime*3.0 + abs(x)*14.0);
  float a = (arm*0.75*rip + core)*(1.0 - v)*(1.0 - v)*smoothstep(0.0, 0.03, v)*clamp(vStr, 0.0, 1.0)*step(abs(x), w);
  a *= 1.0 - fxFog();
  gl_FragColor = vec4(uFoam*a, a);
}`;

// ---------------------------------------------------------------- the scud's noise texture, made in slices
// The same texture as the kit's own cloud noise (makeNoiseTexture in src/kit/sky.js): two channels of four-octave
// tileable value noise and two shifted copies. Built here so that the work can be cut up with yields.
function cloudNoiseTexture(size = 256) {
  const tex = new THREE.DataTexture(new Uint8Array(size * size * 4), size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
// The two inner loops are plain functions called a band of rows at a time: the async function below only hands out the bands, with a yield after each, so the hot loops keep
// their compiled code from one band to the next (a loop inside an async function starts again in the interpreter after every yield) and no band is more than a millisecond or two.
function cloudNoiseRows(acc, lat, per, amp, ix0, ix1, wx, size, y0, y1) {
  for (let y = y0; y < y1; y++) {
    const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
    for (let x = 0, p = y * size; x < size; x++, p++) {
      const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
      acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
    }
  }
}
function cloudNoisePack(data, f0, f1, size, norm, y0, y1) {
  const m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f0[p]); data[p * 4 + 1] = px(f1[p]); data[p * 4 + 2] = px(f0[s]); data[p * 4 + 3] = px(f0[s2]);
    }
  }
}
async function fillCloudNoise(tex, rng, ctx) {
  const size = tex.image.width, data = tex.image.data, N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y0 = 0; y0 < size; y0 += 16) { cloudNoiseRows(acc, lat, per, amp, ix0, ix1, wx, size, y0, Math.min(size, y0 + 16)); await ctx.yield(); }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3);
  for (let y0 = 0; y0 < size; y0 += 16) { cloudNoisePack(data, f[0], f[1], size, norm, y0, Math.min(size, y0 + 16)); await ctx.yield(); }
  tex.needsUpdate = true;
}

// ---------------------------------------------------------------- the sky dome's noise texture, made in bands
// The same texels as the kit's own (makeSkyNoise in src/kit/sky.js: a fixed xorshift stream, no seed, G = R shifted by (37, 17)), handed to makeSky as noiseTexture,
// so that the dome's first step does not carry the 131072 draws and the shifted copy in one piece. It draws nothing from any random stream of the world's.
function skyNoiseDraw(d, a, i0, i1) {
  for (let i = i0; i < i1; i++) {
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5; d[i * 4] = (a >>> 0) & 255;
    a ^= a << 13; a ^= a >>> 17; a ^= a << 5; d[i * 4 + 2] = (a >>> 0) & 255;
    d[i * 4 + 3] = 255;
  }
  return a;
}
function skyNoiseShift(d, S, y0, y1) {
  for (let y = y0; y < y1; y++) for (let x = 0; x < S; x++) d[(y * S + x) * 4 + 1] = d[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4];
}
async function skyNoiseTexture(ctx) {
  const S = 256, d = new Uint8Array(S * S * 4); let a = 0x2545f491;
  for (let y = 0; y < S; y += 32) { a = skyNoiseDraw(d, a, y * S, (y + 32) * S); await ctx.yield(); }
  for (let y = 0; y < S; y += 64) { skyNoiseShift(d, S, y, y + 64); await ctx.yield(); }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'checkerboard-approach',
  name: 'Checkerboard Approach',
  category: 'city',
  media: ['air'],
  weirdness: 0.05,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, moodK = clamp(vary.mood ?? 0.5, 0, 1), detail = ctx.quality?.detail ?? 1, thin = Math.max(0.6, detail), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- what this visit is: every draw that decides the look, up front and in a fixed order
    const vr = rng.fork('cb-look');
    const lookPick = vr(), squall = vr.range(0.65, 1), trim = vr.pick(['#b3261e', '#1f4e8c', '#1e6b4f', '#c98a1a', '#7a2a5a']), scudK = vr.range(0.8, 1.2), ferryPh = vr();
    const hour = vary.hour || 'any';
    const lookId = hour === 'dawn' ? 'dawn' : hour === 'day' ? 'storm' : hour === 'golden' ? 'golden' : hour === 'night' ? 'night'
      : lookPick < 0.28 ? 'storm' : lookPick < 0.5 ? 'golden' : lookPick < 0.8 ? 'dusk' : 'night';
    const look = LOOKS[lookId], rare = !!vary.rare, dark = look.night > 0.5, duration = 40, storming = rare && dark;
    // new furniture (the second stand of trees, the grass, the thunderstorm's rain) draws from a stream of its own: every older random draw stays where it was
    const xr = makeRng(hashSeed('cb-world-polish:' + ctx.seed));
    const scene = new THREE.Scene();
    const T = { value: 0 };

    // ---- sky, fog, light (2 lights: hemisphere + key)
    await ctx.yield();
    const skyOpts = storming ? { ...look.sky, clouds: { ...look.sky.clouds, coverage: 0.8 } } : look.sky;          // on the rare night the deck closes over: the bolts fall out of cloud, not out of stars
    const skyNoise = await skyNoiseTexture(ctx);
    const sky = makeSky({ rng, ...skyOpts, sunElevation: look.sunEl, sunAzimuth: look.sunAz, renderer: ctx.renderer, bake: !!look.bake, noiseTexture: skyNoise });      // no random sheet lightning: on the rare night the bolts over the harbour light the clouds (update)
    await ctx.yield();
    scene.add(sky.object);
    await ctx.yield();
    const fogCol = H(look.fog);
    scene.fog = new THREE.FogExp2(fogCol, look.density);
    const rig = makeLightRig(sky, look.rig); scene.add(rig.object);
    await ctx.yield();

    // ---- the hero: Kowloon, the hill, the runway
    const sd = sky.keyDirection.clone(); if (sd.y < 0.22) { sd.y = 0.22; sd.normalize(); }
    const hero = await buildHero(ctx, { ...look.hero, sunDir: [sd.x, sd.y, sd.z], density });
    scene.add(hero.object);
    const A = hero.anchors, WY = A.waterY, board = A.hill.board, seat = A.portalSeat.position;
    await ctx.yield();

    // ---- the route is the hero's approach: straight at the hill, the 47 degree right turn, the final
    // The kit's makePath is one stretch of 10 to 47 ms on a cold start (4750 points of a centripetal spline, most of them walked before the browser has compiled the curve's code).
    // Three throwaway paths first, of 8, 16 and 32 points with a yield after each, pay for that cold start in slices: they draw nothing from any random stream and nothing of
    // them is kept, and the real path below is then built by warm code in a few milliseconds.
    const flyPts = A.flyLine(64);
    for (const k of [8, 16, 32]) { makePath(flyPts.slice(0, k), { samples: k * 14 }); await ctx.yield(); }
    const path = makePath(flyPts, { samples: 900 });
    const L = path.length;
    await ctx.yield();

    // ---- harbour
    const ocean = Water.makeOcean({ rng: rng.fork('sea'), light: Water.waterLight(sky), level: WY, radius: 3600, glint: lookId === 'night' ? 0.7 : dark ? 0.5 : 0.35, ...look.sea });
    scene.add(ocean.object);
    await ctx.yield();

    // ---- far layers: the hills behind Kowloon and the island's towers across the water
    // (a throwaway single layer first, from a random stream of its own and never added to the scene, pays for the kit function's cold start)
    makeHorizonRidges({ rng: makeRng(4), fog: scene.fog, layers: 1, radius: [3600, 4600], height: [150, 400] });
    await ctx.yield();
    const ridges = makeHorizonRidges({ rng: rng.fork('ridges'), fog: scene.fog, layers: 3, radius: [3600, 4600], height: dark ? [70, 190] : [150, 400], base: -40, coverage: 0.72,          // round nine: after dark the ridges are low, so the island's towers reach the water line instead of standing cut along a ridge
      colorNear: dark ? '#10131f' : lookId === 'storm' ? '#3a4a50' : lookId === 'golden' ? '#454c70' : '#4a4458', ambient: sky.ambientColor.clone().multiplyScalar(dark ? 0.45 : 0.9),
      sunDir: sky.lightDirection, sunColor: sky.lightColor, sunIntensity: dark ? 0.25 : 0.8, rim: 0.3 });
    scene.add(ridges.object);
    await ctx.yield();
    const mats = S.makeMaterials({ night: look.night, streetY: 0 });
    mats.setSky({ top: sky.zenithColor, horizon: fogCol, sun: sky.sunColor, sunDir: sky.lightDirection });
    await ctx.yield();
    // by day the island's towers stand in the haze (their own colour pulled halfway to the fog) and no taller than the ridges behind them
    // Three calls of a third of the arc each with a yield after every one (the single call of 130 towers was a 32 to 98 ms step), after a throwaway call that pays for the kit
    // function's cold start: two towers from a random stream of its own, nothing added to the scene, nothing drawn from ctx.rng.
    S.makeSkyline({ rng: makeRng(3), mats, radius: 3300, count: 2, layers: 1 });
    await ctx.yield();
    // round seven: the island stands close behind the runway and beside the portal: towers twice as tall in the frame and a third more of them
    const skyOpt = { mats, radius: 3300, count: 58, layers: 3, baseY: -12, clusters: 2, ...(dark ? { maxHeight: 320, hazeAmount: [0.62, 0.9] } : { maxHeight: 290, color: fogCol.clone().lerp(H(look.skyline), 0.5), hazeAmount: [0.6, 0.92] }) };
    const skylines = [];
    for (const [label, arc] of [['island', [1.2, 2.0]], ['island2', [2.0, 2.8]], ['island3', [2.8, 3.6]]]) {
      const sl = S.makeSkyline({ rng: rng.fork(label), arc, ...skyOpt });
      scene.add(sl.object); skylines.push(sl);
      await ctx.yield();
    }

    // ---- scud: a broken ceiling just above the approach, wisps beside the entry, low rags over the harbour
    const scudAt = [];
    let scudBase = 1e9, ragOut = 0;          // the height of the lowest wisp over the run-in (the scud's base), and how far ahead of the entry the last of the break-out rags hangs
    { const cr = rng.fork('scud'), n = Math.round(12 * scudK * thin);
      for (let i = 0, tries = 0; i < n && tries < 240; tries++) {
        const x = cr.range(-2600, 2200), z = cr.range(-3600, 3400), w = cr.range(240, 480), y = cr.range(210, 264);
        const nr = path.nearestXZ(x, z); if (nr.dist < w * 0.6 && y < nr.y + 60) continue;
        scudAt.push([x, y, z, w]); i++;
      }
      const e0 = path.pointAt(0), d0 = path.tangentAt(0), rx = -d0.z, rz = d0.x;
      const wisp = (ahead, side, y, w) => { scudBase = Math.min(scudBase, y); scudAt.push([e0.x + d0.x * ahead + rx * side, y, e0.z + d0.z * ahead + rz * side, w]); };
      wisp(110, -78, 198, 46); wisp(190, -100, 192, 55);          // the last rags of the scud just above the entry axis: they slide off the top of the frame and the lit hill is left
      wisp(250, -150, 190, 80); wisp(420, -170, 196, 110); wisp(700, -60, 196, 170); wisp(130, -135, 184, 70); wisp(980, -220, 184, 200);          // round nine: all of them above the eye's own height: the rag that hung below the horizon in front of the city on the left edge read as a pasted sprite
      scudAt.push([-900, 95, 600, 300], [-1500, 120, 1500, 380], [520, 110, 1900, 340], [760, 150, -640, 330], [-1300, 130, -500, 300]);
      if (storming) scudAt.push([-640, 300, 1400, 520], [-900, 285, 1750, 440], [-380, 310, 1100, 420], [-700, 330, 2100, 480], [-1250, 300, 900, 460], [-150, 320, 2300, 440]); }          // the storm cell the bolts fall from, over the harbour right of the runway
    await ctx.yield();
    // The kit bakes the field's 256 px noise texture inside makeCloudField, which makes that one call a 45 to 80 ms step.
    // The field is handed an empty texture instead, and the noise is filled in afterwards in slices from the field's own
    // random stream, at the point where the kit would have drawn it: the same texels without the stall.
    let scudRng = null;
    const scudSrc = rng.fork('scud-field'), scudNoise = cloudNoiseTexture();
    const scud = makeCloudField({ rng: { fork: (label) => (scudRng = scudSrc.fork(label)) }, sky, mode: 'cumulus', at: scudAt, height: 0.32, puffs: Math.round(26 * thin * (0.85 + 0.3 * moodK)), wind: [2.2, 0, 2.6], opacity: 0.78, noiseTexture: scudNoise });
    scene.add(scud.object);
    await ctx.yield();
    await fillCloudNoise(scudNoise, scudRng || scudSrc, ctx);
    await ctx.yield();
    // The break-out: four rags of scud close to the entry axis, left and right of the line, a wisp below it and one high on the right. For the first second they hang in the corners of the frame
    // with the lit board under them; by u 0.05 they are behind us. A small field of its own (the same noise texture), moved by progress, not by the clock: the world's clock
    // has already run for an unknown time while it was seen through the portal, and the wind would have carried them anywhere.
    const ragAt = [];
    { const e0 = path.pointAt(0).clone(), d0 = path.tangentAt(0).clone(), rx = -d0.z, rz = d0.x;
      const rag = (ahead, side, y, w) => ragAt.push([e0.x + d0.x * ahead + rx * side, y, e0.z + d0.z * ahead + rz * side, w]);
      for (const [ahead, side, up, w] of [[72, -21, 4, 42], [98, 27, 5, 50], [96, -44, 13, 34], [150, 40, 20, 62]]) { rag(ahead, side, e0.y + up, w); ragOut = Math.max(ragOut, ahead); }
      // round thirteen: the scud does not end at the first second. Eight more rags hang beside the straight run at the board, left and right in turn every 40 m or so,
      // 9 to 14 m over the line and 34 to 50 m off it: one of them is always sliding out through an upper corner of the frame until the bank begins (above the eye:
      // never across the board)
      for (const [ahead, side, up, w] of [[182, 31, 7, 40], [215, -28, 6, 40], [258, 32, 8, 42], [300, -34, 8, 46], [345, 40, 10, 42], [390, -46, 10, 44], [430, 44, 12, 46], [470, -50, 14, 52]]) rag(ahead, side, path.nearestXZ(e0.x + d0.x * ahead, e0.z + d0.z * ahead).y + up, w); }          // round seven: lower and nearer the line: for the first second cloud stands in the upper corners of the frame and slides past the eye, and by u 0.06 it is behind us
    const rags = makeCloudField({ rng: makeRng(hashSeed('cb-rags:' + ctx.seed)), sky, mode: 'cumulus', at: ragAt, height: 0.32, puffs: Math.round(14 * thin), wind: [6, 0, 7], opacity: 0.72, noiseTexture: scudNoise });
    scene.add(rags.object);
    await ctx.yield();

    // ---- squalls and the rain on the lens of the eye
    const sr = rng.fork('squall');
    const squallList = [[900, -650, 900], [1500, 300, 1100], [-1300, 700, 1000], [-700, 1900, 1200], [300, 2900, 1300], [-1900, -1200, 1000], [1700, -1800, 900]].map((q) => ({
      x: q[0] + sr.range(-150, 150), z: q[1] + sr.range(-150, 150), top: 330, width: q[2] * sr.range(0.8, 1.2), phase: sr(), strength: sr.range(0.5, 0.85) * (storming ? 0.5 : look.veil) * squall * (0.7 + 0.6 * moodK) }));
    // one more, in every look and from a stream of its own: a squall standing over the harbour west of the runway's arm, between the airfield and the island, with the
    // island's glow under its foot (after dark the city's lamps, by day the pale light of the open sky beyond it). It drifts on the wind with the rest.
    { const q = makeRng(hashSeed('cb-harbour-squall:' + ctx.seed)); squallList.push({ x: -850 + q.range(-100, 100), z: 2100 + q.range(-150, 150), top: 330, width: 820 * q.range(0.9, 1.15), phase: 1 + q() * 0.99, strength: q.range(0.5, 0.64) }); }
    const squalls = buildSqualls(squallList, storming ? '#2c3350' : look.veilCol, T);
    squalls.uniforms.uGlow.value.copy(dark ? H('#ffc890').multiplyScalar(lookId === 'night' ? 0.8 : 0.7) : H(look.veilCol).lerp(H('#ffffff'), 0.5).multiplyScalar(0.5));
    squalls.uniforms.uTrace.value = dark ? 0 : 0.1;
    if (dark) squalls.uniforms.uBody.value.copy(H('#8f9cc8')).multiplyScalar(lookId === 'night' ? 0.3 : 0.2);
    scene.add(squalls.object);
    const rain = buildRain(rng.fork('rain'), Math.round(1600 * thin), look.rainCol);
    scene.add(rain.object);
    await ctx.yield();

    // ---- harbour traffic
    const fr = rng.fork('fleet');
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
    const FG = ferryGeometry(1.5);
    await ctx.yield();
    const routes = [[-215, 215, -430, 1500], [-230, 150, -1250, 900], [-300, 1100, -1500, 250], [-200, 700, -1100, 2000], [-1600, 1500, -400, 2300], [-250, 350, -900, 60], [310, 540, 305, 1470]];
    const NF = routes.length, ferryState = routes.map((r, i) => { const dx = r[2] - r[0], dz = r[3] - r[1], len = Math.hypot(dx, dz); return { yaw: Math.atan2(dx, dz), tx: dx / len, tz: dz / len, period: (len / fr.range(7, 10)) * 2, ph: (ferryPh + i * 0.37 + fr.range(0, 0.2)) % 1, roll: fr.range(0, 6) }; });
    // three more ferries, on runs close along both sides of the runway's arm: one down the west sea wall toward the city, one across the west harbour from the wall
    // to the island, one up the basin on the east side. From a stream of their own (the fleet's stream is not drawn from); their lamps are the last in the list.
    const NF0 = NF, fr2 = makeRng(hashSeed('cb-ferries-arm:' + ctx.seed));
    for (const r of [[-176, 1250, -184, 250], [-210, 560, -980, 820], [362, 1420, 362, 580]]) { const dx = r[2] - r[0], dz = r[3] - r[1], len = Math.hypot(dx, dz); routes.push(r); ferryState.push({ yaw: Math.atan2(dx, dz), tx: dx / len, tz: dz / len, period: (len / fr2.range(7, 10)) * 2, ph: fr2(), roll: fr2.range(0, 6) }); }
    const NF2 = routes.length;
    const ferries = new THREE.InstancedMesh(FG.hull, boatMat, NF2); ferries.frustumCulled = false; ferries.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const ferryWin = new THREE.InstancedMesh(FG.windows, new THREE.MeshBasicMaterial({ color: H(look.win).multiplyScalar(look.winGain || 1) }), NF2);
    ferryWin.frustumCulled = false; ferryWin.instanceMatrix = ferries.instanceMatrix;
    const anchored = [[-820, 250, 0.4], [-1350, 1250, -0.5], [-560, 1750, 0.9], [760, 1760, 0.2], [-1500, 2500, 1.3], [-330, 420, 1.25], [-150, 60, Math.PI, 1.4]];          // the sixth lies broadside off the sea wall; the last, a bigger ship, is moored close under the threshold on the harbour side, her lit house toward the approach
    await ctx.yield();
    const freighterGeo = freighterGeometry(fr, trim, lookId === 'storm' ? 0.55 : 0);
    await ctx.yield();
    const freighters = new THREE.InstancedMesh(freighterGeo, boatMat, anchored.length); freighters.frustumCulled = false;
    const m4 = new THREE.Matrix4(), m4b = new THREE.Matrix4(), v3 = new THREE.Vector3();
    anchored.forEach((q, i) => { m4.makeRotationY(q[2]); if (q[3]) m4.scale(v3.set(q[3], q[3], q[3])); m4.setPosition(q[0], WY + 0.4, q[1]); freighters.setMatrixAt(i, m4); });
    await ctx.yield();
    const freighterWinGeo = freighterWindows();
    await ctx.yield();
    const freighterWin = new THREE.InstancedMesh(freighterWinGeo, ferryWin.material, anchored.length); freighterWin.frustumCulled = false; freighterWin.instanceMatrix = freighters.instanceMatrix;
    await ctx.yield();
    const wakeGeo = new THREE.BufferGeometry();
    wakeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 1, -0.5, 0, 1], 3));
    wakeGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); wakeGeo.setIndex([0, 2, 1, 0, 3, 2]);
    const wakeMat = new THREE.ShaderMaterial({ uniforms: { ...fx.fogUniforms(), uTime: T, uFoam: { value: sky.ambientColor.clone().multiplyScalar(dark ? 0.5 : 0.75).lerp(H('#ffffff'), 0.25) } },
      vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide });
    const wakes = new THREE.InstancedMesh(wakeGeo, wakeMat, NF2); wakes.frustumCulled = false; wakes.renderOrder = 2; wakes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(ferries, ferryWin, freighters, freighterWin, wakes);
    await ctx.yield();
    // masthead and deck lamps: two a ferry, two a freighter
    const lampPos = [], lampCol = [];
    for (let i = 0; i < NF; i++) { lampPos.push([0, 0, 0], [0, 0, 0]); lampCol.push('#fff2d8', '#ffc27a'); }
    anchored.forEach((q) => { if (q[3]) return; const c = Math.cos(q[2]), s = Math.sin(q[2]); lampPos.push([q[0] + s * 38, WY + 27, q[1] + c * 38], [q[0] - s * 47, WY + 25, q[1] - c * 47]); lampCol.push('#fff2d8', '#ffd9a0'); });
    { const q = anchored[anchored.length - 1], k = q[3];          // the moored ship's mast, deck and bridge lamps (she lies bow to seaward: local x and z reversed)
      for (const [x, y, z, c] of [[0, 21.5, -47, '#fff2d8'], [0, 21.5, 26, '#fff2d8'], [7.4, 9.6, -36, '#ffc27a'], [-7.4, 9.6, -22, '#ffc27a'], [7.4, 9.6, -9, '#ffc27a'], [-7.4, 9.6, 5, '#ffc27a'], [7.4, 9.6, 18, '#ffc27a'],
        [0, 23.6, 41.5, '#fff2d8'], [-8.6, 17.6, 37, '#ffd9a0'], [8.6, 17.6, 37, '#ffd9a0']]) { lampPos.push([q[0] - x * k, WY + 0.4 + y * k, q[1] - z * k]); lampCol.push(c); } }
    const LAMP2 = lampPos.length;          // the lamps of the three ferries along the runway's arm
    for (let i = NF0; i < NF2; i++) { lampPos.push([0, 0, 0], [0, 0, 0]); lampCol.push('#fff2d8', '#ffc27a'); }
    const ferryAt = []; for (let i = 0; i < 10; i++) ferryAt.push(new THREE.Vector3(0, -1e5, 0));          // where every ferry is (x, z) and how brightly she is lit: the harbour's mirror sheet reads it
    const ferryLit = dark ? 0.55 : 0.1;
    await ctx.yield();
    const lamps = fx.makeGlows({ rng: rng.fork('lamps'), positions: lampPos, colors: lampCol, size: 7, intensity: 1.5 * look.lamps, flicker: 0.12, time: T, fogAmount: 0.6 });
    scene.add(lamps.object);
    await ctx.yield();
    const placeFleet = (time) => {
      for (let i = 0; i < NF2; i++) {
        const r = routes[i], f = ferryState[i], li = i < NF0 ? i * 2 : LAMP2 + (i - NF0) * 2, ph = (time / f.period + f.ph) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2, s = tri * tri * (3 - 2 * tri), sp = 6 * tri * (1 - tri), dir = ph < 0.5 ? 1 : -1;
        const x = r[0] + (r[2] - r[0]) * s, z = r[1] + (r[3] - r[1]) * s, y = WY + 0.25 + (ocean.heightAt(x, z, time) - WY) * 0.4;
        m4.makeRotationY(f.yaw); m4b.makeRotationZ(Math.sin(time * 0.8 + f.roll) * 0.02); m4.multiply(m4b); m4.setPosition(x, y, z); ferries.setMatrixAt(i, m4);
        m4.makeRotationY(f.yaw + (dir > 0 ? Math.PI : 0)); m4.scale(v3.set(34, Math.max(0.001, Math.min(1, sp)), 190)); m4.setPosition(x - f.tx * dir * 18, WY + 0.36, z - f.tz * dir * 18); wakes.setMatrixAt(i, m4);
        lamps.setPosition(li, x, y + 18.5, z); lamps.setPosition(li + 1, x + f.tx * 14, y + 9.5, z + f.tz * 14);
        if (i < 10) ferryAt[i].set(x, z, ferryLit);
      }
      ferries.instanceMatrix.needsUpdate = true; wakes.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();
    const inHarbour = (x, z) => (x < -125 && x > -1700 && z > 10 && z < 2900 && !(x > -186 && x < -114 && z > -40 && z < 165)) || (x > 250 && x < 375 && z > 520 && z < 1470) || (x > 250 && z > 1560 && z < 2900);
    // two calls of one variant each (four junks apiece) with a yield between: the kit builds a hull per variant, and both in one call was a 22 to 31 ms step
    const junkAt = [[-205, 0, 30], [-240, 0, 150], [-430, 0, 540], [-280, 0, 850], [-570, 0, 180], [-200, 0, 1360], [340, 0, 700], [270, 0, 1050]];
    const junkOpts = { mats, types: ['junk'], variants: 1, moving: true, speed: 2.4, lit: Math.max(0.3, look.night), heightAt: (x, z, t) => ocean.heightAt(x, z, t), y: WY, clear: inHarbour };
    // The first call into the kit's boat builder also pays for the builder's cold start: one step of 14 to 18 ms on a quiet machine, 49 to 117 ms on a busy one.
    // Two empty fleets first (no positions, a random stream of their own, nothing added to the scene, nothing uploaded) run the hull and rig code once,
    // a rowboat and then a junk, with a yield after each: the real fleets below are then built by warm code. They draw nothing from ctx.rng.
    S.makeBoats({ rng: makeRng(1), mats, types: ['rowboat'], variants: 1, positions: [], lit: junkOpts.lit });
    await ctx.yield();
    S.makeBoats({ rng: makeRng(2), mats, types: ['junk'], variants: 1, positions: [], lit: junkOpts.lit });
    await ctx.yield();
    const junks = S.makeBoats({ rng: rng.fork('junks'), positions: junkAt.slice(0, 4), ...junkOpts });
    scene.add(junks.object);
    await ctx.yield();
    const junks2 = S.makeBoats({ rng: rng.fork('junks2'), positions: junkAt.slice(4), ...junkOpts });
    scene.add(junks2.object);
    await ctx.yield();

    // ---- trees on the hill (the board itself and the streets stay bare)
    const wind = flora.makeWind({ direction: [0.6, 0.8], strength: 1.4 });
    flora.makeLeafTexture({ size: 64 }).dispose();                      // a thumbnail first: it takes the kit function's cold start (8 ms) out of the next step
    await ctx.yield();
    const leafMap = flora.makeLeafTexture({ size: 256 });               // the kit's full 1024 px atlas is one 50 to 85 ms step, 512 px 22 to 32 ms and 384 px 15 to 30 ms (tried, too close to the limit); the hill's trees are small in the frame
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap, backlight: dark ? 0.15 : lookId === 'storm' ? 0.3 : 0.32, backlightTint: '#c2d48a' });     // the kit's default tint is a neon yellow-green: too loud on a shaded slope
    await ctx.yield();
    const hc = A.hill.centre, hd = A.hill.heading, hillH = A.hill.heightAt, tr = rng.fork('trees');
    const bA0 = A.hill.boardAlong[0] - A.hill.boardAlong[1] - 24, bA1 = A.hill.boardAlong[0] + A.hill.boardAlong[1] + 24, bHalf = A.hill.boardHalf + 22;          // the board and a margin round it stay bare
    // dark wet bark (the kit's pine bark turns orange under the wind material's wood ambient); under the squall the leaves are pulled toward grey-green
    const stormy = lookId === 'storm', BARK = { bark: '#3d332b', barkDark: '#241e19' };
    // one tree geometry a step, after a throwaway oak that pays for the kit builder's cold start (a random stream of its own): the three in one stretch read 122 ms on a busy machine
    flora.oakGeometry({ rng: makeRng(5), detail: 0, height: 6 }).dispose();
    await ctx.yield();
    const tk0 = flora.oakGeometry({ rng: tr, detail: 0, height: 11, leaf: stormy ? '#34543a' : '#3f6a34', leafLight: stormy ? '#566f3c' : '#6f8f3e', ...BARK });
    await ctx.yield();
    const tk1 = flora.oakGeometry({ rng: tr, detail: 0, height: 14, fullness: 1.2, leaf: stormy ? '#2f4c38' : '#35603a', ...(stormy ? { leafLight: '#4f6a3c' } : {}), ...BARK });
    await ctx.yield();
    // round eleven: the kit's detail-0 pine is out of ALL the hill's trees (its flat windswept pads lay on the slope as stray polygons: a flat green triangle beside the eye
    // on the close pass, black squares round the board after dark); a third oak, tall and slim, from a stream of its own takes its place. (Round fourteen: the pine is
    // no longer built and thrown away to hold the stream 'tr'. Round sixteen: the far oaks' scatter below draws from a stream of its own, so the hill's far oaks are dealt anew once.)
    const tk2 = flora.oakGeometry({ rng: makeRng(hashSeed('cb-oak3:' + ctx.seed)), detail: 0, height: 16, fullness: 0.9, leaf: stormy ? '#31503a' : '#3a6536', leafLight: stormy ? '#52703c' : '#688a3c', ...BARK });
    const treeKinds = [tk0, tk1, tk2];
    await ctx.yield();
    // The shaft of storm light (by day) or the floodlights (after dark) stand on the board, and the hill's ground shader is lit by that pool: what grows inside it takes the same light,
    // instance by instance, or the trees round the board would stand black on a glowing slope.
    const poolR = dark ? 112 : 160, poolK = dark ? 0.8 : (look.hero.shaft ?? 1) * 1.25, poolC = [board[0] - hd[0] * 6, board[2] - hd[1] * 6], litCol = [1, 1, 1], glowK = lookId === 'night' ? 1.7 : dark ? 1.5 : 1.35, gW = dark ? [1, 0.86, 0.8] : [1, 1, 1];        // after dark the leaves take the glow of the city, as the slope under them does
    // (round eight: after dark the floodlit board throws its orange onto the leaves nearest it, as the hill's ground shader lays it on the slope; by day what grows under
    // the close pass, within 240 m of the line, takes more of the sky's fill, as the slope under it does: the nearest foliage of the flight is not a black mass)
    const flyXZ = A.flyLine(40), gardens = (A.parks || []).filter((q) => q[4] === 2);
    const nearLine = (x, z) => { let bd = 1e18; for (let i = 0; i < flyXZ.length - 1; i++) { const a = flyXZ[i], b = flyXZ[i + 1], ex = b[0] - a[0], ez = b[2] - a[2]; let t = ((x - a[0]) * ex + (z - a[2]) * ez) / (ex * ex + ez * ez); t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - a[0] - ex * t, dz = z - a[2] - ez * t, d = dx * dx + dz * dz; if (d < bd) bd = d; } return Math.sqrt(bd); };
    const nearK = dark ? 0.5 : lookId === 'storm' ? 0.95 : 0.6;          // round thirteen: after dark too (it was 0: the trees of the close pass were a black mass): half, in the moon's blue
    const nearC = dark ? [0.7, 0.9, 1.5] : [1, 1, 0.8];
    const offTerrace = (x, z) => { if (A.hill.laneDist(x, z) < 2.8) return 0; for (const q of A.hill.huts) if (Math.abs(x - q[0]) < q[2] / 2 + 1.6 && Math.abs(z - q[1]) < q[3] / 2 + 1.6) return 0; return 1; };          // nothing grows on the squatters' lane or through their roofs
    const spillK = dark ? 1 : 0, bAl = A.hill.boardAlong, bHf = A.hill.boardHalf;
    const litBy = (x, z) => { const dx = (x - poolC[0]) / poolR, dz = (z - poolC[1]) / poolR, q = dx * dx + dz * dz, w = poolK * Math.exp(-q * q * 1.3);
      const ex = x - hc[0], ez = z - hc[2], a = -(ex * hd[0] + ez * hd[1]), b = ex * hd[1] - ez * hd[0], sp = spillK * Math.exp(-Math.hypot(Math.max(Math.abs(b) - bHf, 0), Math.max(Math.abs(a - bAl[0]) - bAl[1], 0) * bHf / bAl[1]) / 30);
      const nb = nearK ? nearK * (1 - smoothstep(110, 250, nearLine(x, z))) : 0;
      litCol[0] = glowK * gW[0] + 1.7 * w + 4.2 * sp + nb * nearC[0]; litCol[1] = glowK * gW[1] + 1.5 * w + 1.5 * sp + nb * nearC[1]; litCol[2] = glowK * gW[2] + 0.9 * w + 0.2 * sp + nb * nearC[2]; return litCol; };          // after dark the leaves take the sodium glow of the streets, not a green of their own
    const trees = flora.makeScatter({ rng: makeRng(hashSeed('cb-far-oaks:' + ctx.seed)), variants: treeKinds, material: leafMat, count: Math.round(170 * Math.min(density, 1.1) * thin), bounds: [hc[0] - 270, hc[2] - 270, hc[0] + 270, hc[2] + 270],
      heightAt: hillH, spacing: 4.5, scale: [0.75, 1.6], falloff: 0, groundColor: litBy,
      density: (x, z) => { const dx = x - hc[0], dz = z - hc[2], a = -(dx * hd[0] + dz * hd[1]), b = dx * hd[1] - dz * hd[0]; if (a > bA0 - 9 && a < bA1 + 9 && Math.abs(b) < bHalf + 9) return 0; const h = hillH(x, z); return h > 9 ? (h > 70 ? 0.5 : 1) * smoothstep(55, 95, nearLine(x, z)) * offTerrace(x, z) : 0; } });          // round nine: none of these far-distance trees within 55 m of the line: the stand of full-detail oaks below has that ground
    scene.add(trees.object);
    await ctx.yield();
    // ---- the close pass: where the turn carries us over the hill's shoulder the slope is the nearest thing in the whole flight.
    // A second stand of bigger trees there and in the gardens at the hill's foot, shrubs (ferns grown large) and clumps of tall grass between them.
    const onBoard = (x, z) => { const dx = x - hc[0], dz = z - hc[2], a = -(dx * hd[0] + dz * hd[1]), b = dx * hd[1] - dz * hd[0]; return a > bA0 - 2 && a < bA1 + 2 && Math.abs(b) < bHalf + 2; };
    const inGarden = (x, z) => { for (const q of gardens) if (x > q[0] + 3.5 && x < q[1] - 3.5 && z > q[2] + 3.5 && z < q[3] - 3.5) return Math.hypot(x - (q[0] + q[1]) / 2, z - (q[2] + q[3]) / 2) > 7; return false; };
    const shoulder = (x, z, reach) => { if (onBoard(x, z) || !offTerrace(x, z)) return 0; const h = hillH(x, z); if (h > 5) return nearLine(x, z) < reach ? 1 : 0; return 0; };
    const slopeH = (x, z) => Math.max(hillH(x, z), A.parkY || 0);
    let sb = [1e9, 1e9, -1e9, -1e9];          // the box that holds the shoulder: every candidate the scatter draws has a fair chance of landing on it
    for (let x = hc[0] - 290; x <= hc[0] + 290; x += 24) for (let z = hc[2] - 290; z <= hc[2] + 290; z += 24) if (shoulder(x, z, 300)) sb = [Math.min(sb[0], x - 12), Math.min(sb[1], z - 12), Math.max(sb[2], x + 12), Math.max(sb[3], z + 12)];
    for (const q of gardens) sb = [Math.min(sb[0], q[0]), Math.min(sb[1], q[2]), Math.max(sb[2], q[1]), Math.max(sb[3], q[3])];
    await ctx.yield();
    // round nine: the nearest trees of the flight are no longer the far-distance oaks (leaf cards a metre or two across at 40 m): the stand has an oak of its own at the
    // kit's full detail, from a stream of its own (every older draw stays where it was)
    const nearOak = flora.oakGeometry({ rng: makeRng(hashSeed('cb-near-oak:' + ctx.seed)), detail: 1, height: 12, fullness: 1.2, leaf: stormy ? '#34543a' : '#3f6a34', leafLight: stormy ? '#566f3c' : '#6f8f3e', ...BARK });
    await ctx.yield();
    // (round fourteen: 74 of these full-detail oaks, 1360 triangles each, where there were 96, and the far oaks above no thicker than at density 1.1: a dense visit
    // stood at 506 thousand triangles over the first third of the flight, over the budget; it now stands near 465)
    // The kit's makeScatter is two things, the placement (scatterPoints) and the instancing: done here as two steps with a yield between them (the one call read 57 ms on a
    // busy machine). The placement draws from the same fork of the same stream, with the same clearance, as the kit's own call would: the same trees in the same places.
    const standRng = makeRng(xr() * 1e9), standOpts = { variants: [nearOak, nearOak, nearOak], material: leafMat, count: Math.round(74 * thin), bounds: sb, heightAt: slopeH, spacing: 5, scale: [1.1, 1.9], falloff: 0, groundColor: litBy,
      density: (x, z) => { if (inGarden(x, z)) return 1; const dx = x - hc[0], dz = z - hc[2], a = -(dx * hd[0] + dz * hd[1]), b = dx * hd[1] - dz * hd[0]; if (a > bA0 - 15 && a < bA1 + 15 && Math.abs(b) < bHalf + 15) return 0; return shoulder(x, z, 300) * (nearLine(x, z) < 100 ? 1 : 0.4); } };          // no crown stands in front of the board's edge
    const standPts = flora.scatterPoints({ ...standOpts, rng: standRng.fork('pts'), clear: (nearOak.userData.radius || 1) * 0.75 });
    await ctx.yield();
    const stand = flora.makeScatter({ ...standOpts, rng: standRng, points: standPts });
    scene.add(stand.object);
    await ctx.yield();
    const scrubC = stormy ? ['#4e7242', '#86a25c'] : dark ? ['#52803e', '#8aa650'] : ['#5a8a3c', '#9ab456'];          // round seven: at the slope's own value, not darker than the trees over them
    const shrubKinds = [flora.fernGeometry({ rng: makeRng(xr() * 1e9), detail: 0, size: 1.2, fronds: 11, leaf: scrubC[0], leafLight: scrubC[1] }),
      flora.grassTuftGeometry({ rng: makeRng(xr() * 1e9), cards: 3, width: 1.3, height: 1.0, root: '#7c8458' })];
    await ctx.yield();
    const shrubs = flora.makeScatter({ rng: makeRng(xr() * 1e9), variants: [shrubKinds[0]], material: leafMat, count: Math.round(420 * thin), bounds: sb, heightAt: slopeH, spacing: 1.2, scale: [1.4, 2.6], falloff: 0, sink: 0.22, groundColor: litBy,
      density: (x, z) => shoulder(x, z, 240) * smoothstep(0.35, 0.6, ctx.noise.fbm2(x * 0.03, z * 0.03, 2) * 0.5 + 0.5) });          // in drifts, sunk into the ground
    scene.add(shrubs.object);
    await ctx.yield();
    const clumps = flora.makeScatter({ rng: makeRng(xr() * 1e9), variants: [shrubKinds[1]], material: leafMat, count: Math.round(520 * thin), bounds: sb, heightAt: slopeH, spacing: 0.8, scale: [1.2, 2.2], falloff: 0, groundColor: litBy,
      density: (x, z) => { const dx = x - hc[0], dz = z - hc[2], a = -(dx * hd[0] + dz * hd[1]), b = dx * hd[1] - dz * hd[0]; if (a > bA0 - 14 && a < bA1 + 14 && Math.abs(b) < bHalf + 14) return 0; return shoulder(x, z, 220); } });          // off the pale margin of the board
    scene.add(clumps.object);
    await ctx.yield();
    // ---- the village's margin of trees: a row down each side of the board and along its head, between the paint and the village's lanes and houses (where each stands
    // is the hero's: A.hill.village.trees). The tall slim oak, small; after dark they take no light from the board's lamps, which point at the paint: the board
    // stands against something dark. From a stream of their own.
    const vtR = makeRng(hashSeed('cb-village-trees:' + ctx.seed)), vtDark = [0.8, 0.85, 1.0];
    const villageTrees = flora.makeScatter({ rng: vtR, variants: [tk2], material: leafMat, falloff: 0, groundColor: dark ? () => vtDark : litBy, tilt: 0.03,
      points: ((A.hill.village && A.hill.village.trees) || []).map((q) => ({ x: q[0], y: hillH(q[0], q[1]), z: q[1], s: q[2], rot: vtR() * 6.2832, d: 0, u: 0, v: 0 })) });
    scene.add(villageTrees.object);
    await ctx.yield();
    // ---- scrub and creeper over the board's kerb, where the hill's growth has reached it (where each shrub stands is the hero's: A.hill.creepers; the hill's ground
    // shader lays the mat of leaves under it). The slope's own fern, grown large; after dark it stands in the kerb lamps' warm light. From a stream of their own.
    const crR = makeRng(hashSeed('cb-creeper:' + ctx.seed)), crLit = [2.3, 1.9, 1.25];
    const creepers = flora.makeScatter({ rng: crR, variants: [shrubKinds[0]], material: leafMat, falloff: 0, sink: 0.3, tilt: 0.25, groundColor: dark ? () => crLit : litBy,
      points: (A.hill.creepers || []).map((q) => ({ x: q[0], y: q[1], z: q[2], s: q[3] * 2.4, rot: crR() * 6.2832, d: 0, u: 0, v: 0 })) });
    scene.add(creepers.object);
    await ctx.yield();
    // ---- the undershoot is paved now (round seven); tussocks stand on the two strips of grass left between the stopway and the aprons (they sway; the wheels pass 10 to 30 m over them)
    const tuftsOK = (x, z) => { const ax = Math.abs(x); if (ax < 39.5 || ax > 49.5) return 0; if (Math.hypot(x - 47, z + 118) < 3 || (x > 39.5 && z > -249 && z < -238)) return 0; return smoothstep(-312, -296, z) * (1 - smoothstep(-92, -76, z)); };
    const ff = A.fieldFill || [0, 0, 0], tfk = dark ? 1.5 : 1, tuftFill = new THREE.Color(ff[0] * 0.2 * tfk + (dark ? 0.03 : 0), ff[1] * 0.24 * tfk + (dark ? 0.024 : 0), ff[2] * 0.13 * tfk + (dark ? 0.012 : 0));        // the field's own fill light on the tussocks' mean colour, and after dark the sodium light of the lamps beside them
    const tussocks = await flora.makeGrassAsync({ rng: makeRng(xr() * 1e9), bounds: [-50, -312, 50, -76], count: Math.round(1700 * thin), heightAt: () => 0, density: tuftsOK, width: [1.0, 1.9], height: [0.5, 1.05], wind, map: leafMap,
      root: stormy ? '#6a7a50' : dark ? '#66785a' : '#74875a', dry: '#a39a62', dryAmount: 0.3, flowers: 0, chunks: 1, fade: [170, 250], materialOptions: { leafAmbient: 1.7, ambient: 1.7, backlight: 0.25, emissive: tuftFill, emissiveIntensity: 1 } }, ctx.yield);
    let tuftMat = null; tussocks.object.traverse((o) => { if (o.material && 'emissiveIntensity' in o.material) tuftMat = o.material; });
    scene.add(tussocks.object);
    await ctx.yield();

    // ---- wildlife: black kites soaring over the hill, gulls at the sea wall, a skein crossing the final
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const sm = A.hill.summit;
    fauna.add(F.makeFlock({ rng: rng.fork('kites'), species: 'eagles', count: 6, size: 1.6, center: [sm[0] + 60, 168, sm[2] - 14], radius: 90, body: '#3a2a20', wingC: '#2c2018', belly: '#5a4634', head: '#4a382a', tip: '#17110d' }));
    await ctx.yield();
    { // a flock wheeling between the eye and the hill over the opening seconds: movement at the scale of the high view (a random stream of its own)
      // round sixteen: its place is the low quarter at the hill's foot: over the middle of it (A.hill.lowQuarter, metres out from the hill's centre along the hill's own axis),
      // half its own radius above the board's level
      const lq = A.hill.lowQuarter, hcF = A.hill.centre, aM = (lq[0] + lq[1]) / 2;
      fauna.add(F.makeFlock({ rng: makeRng(hashSeed('cb-flock:' + ctx.seed)), species: 'gulls', lod: 'low', count: Math.max(20, Math.round(36 * density)), size: 1.6, center: [hcF[0] - hd[0] * aM, board[1] + 55, hcF[2] - hd[1] * aM], radius: 110 })); }
    await ctx.yield();
    // round sixteen: and a second, smaller one over the outer edge of that low quarter, half its own radius above the board's level
    // (a stream of its own)
    { const lq = A.hill.lowQuarter, hcF = A.hill.centre;
      fauna.add(F.makeFlock({ rng: makeRng(hashSeed('cb-flock2:' + ctx.seed)), species: 'gulls', lod: 'low', count: Math.max(14, Math.round(24 * density)), size: 1.8, center: [hcF[0] - hd[0] * lq[1], board[1] + 31, hcF[2] - hd[1] * lq[1]], radius: 62 })); }
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.max(8, Math.round(20 * density)), center: [-190, 24, -30], radius: 110, lod: 'low', size: 1.5 }));
    fauna.add(F.makeFlock({ rng: rng.fork('skein'), species: 'gulls', count: Math.max(6, Math.round(12 * density)), lod: 'low', size: 1.7, duration, cross: { path, u: makeRng(hashSeed('cb-skein:' + ctx.seed)).range(0.62, 0.9), lead: 150, angle: 70, side: -1, height: 16, span: 520, duration } }));
    await ctx.yield();

    // ---- a helicopter works a circle beside the board, all flight long (round thirteen; round fourteen: off the board's face. Its circle of 60 m is centred over the
    // roofs at the hill's foot on the board's far side from the approach line, 70 m out from the board's edge, 38 m over the highest ground under
    // the circle (that ground is the hill's flank): it works beside the board, its beam on the kerb wall and the slope, and never crosses the paint as seen from the line). A pale hull with a dark canopy and
    // a waist band in the aircraft's trim colour, a red beacon, an eased strobe on the fin, the blades turning, and after dark a searchlight that swings over the roofs
    // at the hill's foot. Where it is when the world starts: a stream of its own.
    const heli = (() => {
      const g = new THREE.Group(), ph = makeRng(hashSeed('cb-heli:' + ctx.seed))() * 6.2832;
      const hull = new THREE.MeshStandardMaterial({ color: '#c9ced2', roughness: 0.45, metalness: 0.2, emissive: dark ? '#1a1e24' : '#10151a' });
      const glass = new THREE.MeshStandardMaterial({ color: '#141b22', roughness: 0.25, metalness: 0.5, emissive: dark ? '#0c1218' : '#05080b' });
      const band = new THREE.MeshStandardMaterial({ color: trim, roughness: 0.5, metalness: 0.1, emissive: dark ? '#120a08' : '#000000' });
      const part = (geo, x, y, z, m = hull) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
      const ball = new THREE.SphereGeometry(1.5, 12, 8);
      part(ball, 0, 0, 0.6).scale.set(1.05, 1.1, 2.3);
      part(ball, 0, 0.42, 2.1, glass).scale.set(0.93, 0.8, 1.25);          // the canopy
      part(ball, 0, -0.25, 0.6, band).scale.set(1.09, 0.13, 2.26);        // the waist band
      part(new THREE.CylinderGeometry(0.2, 0.55, 7, 6), 0, 0.5, -5.4).rotation.x = -Math.PI / 2;
      part(new THREE.BoxGeometry(0.16, 2.2, 1.1), 0, 1.3, -8.6, band);
      part(new THREE.BoxGeometry(0.14, 0.14, 4.4), -1.25, -1.9, 0.5, glass); part(new THREE.BoxGeometry(0.14, 0.14, 4.4), 1.25, -1.9, 0.5, glass);
      const discMat = new THREE.MeshBasicMaterial({ color: dark ? '#aab4c0' : '#39424a', transparent: true, opacity: dark ? 0.09 : 0.1, depthWrite: false, side: THREE.DoubleSide });
      part(new THREE.CircleGeometry(6.2, 24), 0, 2.15, 0.4, discMat).rotation.x = -Math.PI / 2;
      part(new THREE.CircleGeometry(1.15, 14), 0.25, 1.5, -8.7, discMat).rotation.y = Math.PI / 2;
      const blades = part(new THREE.BoxGeometry(12.4, 0.06, 0.42), 0, 2.2, 0.4, glass);
      const N = 32, px = new Uint8Array(N * N * 4);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = Math.max(0, 1 - Math.hypot(i - 15.5, j - 15.5) / 15.5), a = Math.round(255 * v * v * (0.3 + 0.7 * v * v)), k = (j * N + i) * 4; px[k] = px[k + 1] = px[k + 2] = a; px[k + 3] = 255; }
      const tex = new THREE.DataTexture(px, N, N); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
      const lamp = (rr, gg, bb, s, x, y, z) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(rr, gg, bb), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); sp.scale.set(s, s, 1); sp.position.set(x, y, z); g.add(sp); return sp; };
      const red = lamp(5, 0.45, 0.2, 4.2, 0, -1.9, -1), strobe = lamp(3.6, 3.6, 4, 4.6, 0, 2.6, -8.6), spot = lamp(dark ? 5 : 2.2, dark ? 4.6 : 2, dark ? 3.8 : 1.7, dark ? 5.2 : 3, 0, -1.7, 2.6);
      // the searchlight's cone: lit air, brightest where the eye looks through its middle and gone at its silhouette (the facing term), fading down its length
      const cg = new THREE.ConeGeometry(11, 84, 20, 1, true); cg.translate(0, -42, 0);
      const beam = new THREE.Mesh(cg, new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying float vK;
          void main() { vec4 mv = modelViewMatrix*vec4(position, 1.0); vN = normalMatrix*normal; vV = -mv.xyz; float t = 1.0 + position.y/84.0; vK = 0.1 + 0.9*t*t; gl_Position = projectionMatrix*mv; }`,
        fragmentShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying float vK;
          void main() { float f = abs(dot(vN/max(length(vN), 1e-5), vV/max(length(vV), 1e-5))); gl_FragColor = vec4(vec3(1.0, 0.95, 0.82)*(0.2*f*f*vK), 1.0); }`,
      }));
      beam.position.set(0, -1.7, 2.6); beam.visible = dark; g.add(beam);
      const hh = A.hill.heading, far = A.hill.boardHalf + 70, cx = board[0] - hh[1] * far, cz = board[2] + hh[0] * far, R = 60, W = 6.2832 / 26;
      let gTop = board[1]; for (let k = 0; k < 72; k++) gTop = Math.max(gTop, A.hill.heightAt(cx + R * Math.cos(k * 6.2832 / 72), cz + R * Math.sin(k * 6.2832 / 72)));
      const y0 = gTop + 38;          // (38 m over the highest ground under its circle, wherever the hill stands under it: the tallest oak is 26 m, and a rotor's width of air)
      g.scale.setScalar(1.5);
      g.traverse((o) => { o.frustumCulled = false; });
      return { object: g, update(time) {
        const a = ph + time * W, ca = Math.cos(a), sa = Math.sin(a);
        g.position.set(cx + R * ca, y0 + 3 * Math.sin(time * 0.31 + ph), cz + R * sa);
        g.rotation.set(0.1, Math.atan2(-sa, ca), 0.2, 'YXZ');
        blades.rotation.y = time * 31;
        const t = ((time * 0.8 + ph) % 1) / 0.8;          // seconds into its 1.25 s: two flashes 0.12 s apart, each a 0.03 s rise and a 0.07 s decay
        const fl = (q) => (q < 0 ? 0 : Math.min(1, q / 0.03) * Math.exp(-Math.max(0, q - 0.03) / 0.07));
        red.material.opacity = 0.15 + 0.85 * Math.pow(Math.max(0, Math.sin(time * 4.2 + ph)), 6);
        strobe.material.opacity = 0.02 + 0.98 * Math.max(fl(t), fl(t - 0.12));
        beam.rotation.set(-0.45 + 0.2 * Math.sin(time * 0.37 + ph), 0, 0.5 * Math.sin(time * 0.61));
      } };
    })();
    scene.add(heli.object);
    await ctx.yield();

    // ---- steam off two roofs, mist lying on the harbour
    const set = fx.fxGroup(); scene.add(set.object);
    const steamCol = fogCol.clone().lerp(H('#ffffff'), dark ? 0.45 : 0.4), steamShade = fogCol.clone().multiplyScalar(dark ? 0.8 : 0.55);        // after dark the plumes are lit by the sky's ambient, not by the afterglow: pale wisps, not brown balls
    for (const [k, p] of [[-420, 30, -760], [230, 28, -820]].entries())
      set.add(fx.makeSmokeColumn({ rng: rng.fork('steam' + k), time: T, position: p, height: 90, radius: [2, 16], size: dark ? [10, 34] : [6, 26], color: steamCol, colorTop: steamCol, shadowColor: steamShade, opacity: dark ? 0.26 : 0.5, wind: [3, 0, 4], sunDir: sky.lightDirection, sunColor: dark ? sky.ambientColor : sky.lightColor }));
    await ctx.yield();
    for (const [k, p] of (A.stacks || []).entries())          // round thirteen: the two stacks of the power station inside the turn (the hero's anchors.stacks)
      set.add(fx.makeSmokeColumn({ rng: makeRng(hashSeed('cb-stack' + k + ':' + ctx.seed)), time: T, position: p, height: 80, radius: [3, 15], size: dark ? [10, 32] : [7, 26], color: steamCol, colorTop: steamCol, shadowColor: steamShade, opacity: dark ? 0.3 : 0.55, wind: [3, 0, 4], sunDir: sky.lightDirection, sunColor: dark ? sky.ambientColor : sky.lightColor }));
    await ctx.yield();
    { // round thirteen: thin mist drifts over the squatters' terraces on the hill's flank (hill coordinates 60 m past the summit, 75 m toward the approach line, 12 m over the slope): the shaft by day and the lane's lamps after dark catch it
      const hc0 = A.hill.centre, hd0 = A.hill.heading, x = hc0[0] + 60 * hd0[0] + 75 * hd0[1], z = hc0[2] + 60 * hd0[1] - 75 * hd0[0];
      set.add(fx.makeMist({ rng: makeRng(hashSeed('cb-hill-mist:' + ctx.seed)), time: T, count: Math.round(12 * thin), area: [150, 12, 110], center: [x, A.hill.heightAt(x, z) + 12, z], size: [26, 60], color: fogCol.clone().lerp(H(dark ? '#ffcf9a' : '#ffffff'), dark ? 0.3 : 0.45), opacity: 0.11, drift: [1.6, 0, 2.0] })); }
    await ctx.yield();
    set.add(fx.makeMist({ rng: rng.fork('mist'), time: T, count: Math.round(46 * thin), area: [1500, 8, 2400], center: [-950, WY + 5, 1100], size: [70, 160], color: fogCol.clone().lerp(H('#ffffff'), dark ? 0.05 : 0.25), opacity: 0.14, drift: [1.2, 0, 1.6] }));
    await ctx.yield();

    // ---- the shaft of storm light standing on the checkerboard (we fly through its edge in the turn)
    if (look.rays) set.add(fx.makeGodRays({ rng: rng.fork('rays'), time: T, position: [board[0] + sd.x * 520, board[1] + sd.y * 520, board[2] + sd.z * 520], direction: [-sd.x, -sd.y, -sd.z],
      radius: 110, count: 14, length: 600, width: [14, 46], color: look.rayCol, intensity: look.rays, speed: 0.6 }));
    await ctx.yield();

    // ---- lit wet air round the checkerboard: by day the foot of the shaft of storm light, after dark the haze over the floodlights. From the scud, 1.7 km out, the board is
    // 25 pixels wide; the halo is what the eye finds first. It fades with distance to the camera (gone inside 200 m) and breathes with the drifting rain.
    const haloK = look.halo ? look.halo[1] : 0;
    const halo = fx.makeGlow({ rng: rng.fork('halo'), position: [board[0] - hd[0] * 14, board[1] + 16, board[2] - hd[1] * 14], color: look.halo ? look.halo[0] : '#ffd2a0', size: 210, intensity: haloK, core: 0, halo: 2.4, near: [1.3, 2.8], fogAmount: 0.35, depthBias: 0.2, minAngle: 0, time: T });
    scene.add(halo.object);
    await ctx.yield();

    // ---- the rare event: a rainbow standing over the checkerboard by day, a thunderstorm over the harbour after dark
    let rainbow = null, bolt = null;
    if (rare && !dark) { rainbow = fx.makeRainbow({ sunDir: sky.sunDirection, intensity: 0.38, width: 1.25, radius: 2600 }); scene.add(rainbow.object); }
    // The bolts come down out of the scud onto the harbour 1.2 to 2 km ahead of the final, 11 to 36 degrees right of the runway: inside the frame, clear of the portal and of the gear door.
    // They fall every 2 to 6 seconds; where in that rhythm the flight begins is a phase drawn from the world's own random stream, as for every seed.
    if (storming) {
      bolt = fx.makeLightning({ rng: rng.fork('bolt'), from: [0, 390, 0], to: [40, -4, 30], position: [-640, 0, 1400], area: 500, interval: 4.2, width: 1.5, intensity: 7, glow: 0.3, lightIntensity: 700, lightDistance: 1500 });
      bolt.uniforms.uMinAngle.value = 0.0028;                  // never thinner than a pixel and a half at 1080p from two kilometres away
      bolt.offset += rng.fork('bolt-phase')() * 4.2;
      scene.add(bolt.object);
    }
    await ctx.yield();

    // ---- the gate: the portal's light caught in the rain as two rings standing on the threshold, as a halo stands round the sun, with rays of lit rain between them
    // (their lower parts are under the runway). We fly through the middle. The wet stopway and the harbour carry the reflection.
    const portalCol = H(look.portal);
    hero.setLook({ portal: portalCol.clone().multiplyScalar(dark ? 1 : 0.6) });
    const GU = { ...fx.fogUniforms(), uTime: T, uCol: { value: portalCol.clone().multiplyScalar(dark ? 0.9 : 0.55) }, uGain: { value: 1 } };
    // round seven: the gate is nearly twice the size (rings of 54 and 112 m radius round a 40 m portal). The wide ring fills three quarters of the frame's height four seconds
    // out and stands outside the frame's top in the last second; the bright one is three quarters of the frame's height there. Their lower parts are under the ground, and the
    // wet stopway carries their reflection (the hero's field shader mirrors exactly these radii).
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(256, 256), new THREE.ShaderMaterial({
      uniforms: GU, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec2 vQ; varying float vNear;
        ${fx.GLSL_FOG_PARS_VERT}
        void main() {
          vQ = position.xy;
          vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
          vNear = smoothstep(14.0, 70.0, -mvPosition.z);
          gl_Position = projectionMatrix*mvPosition;
          ${fx.GLSL_FOG_VERT}
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; uniform float uTime, uGain; varying vec2 vQ; varying float vNear;
        ${fx.GLSL_FOG_PARS_FRAG}
        void main() {
          float r = length(vQ), a = atan(vQ.y, vQ.x + (abs(vQ.x) + abs(vQ.y) < 1e-3 ? 1.0 : 0.0));          // never atan(0, 0)
          float d = r - 54.0, d2 = r - 111.6;
          float ring = exp(-d*d/4.6), soft = exp(-d*d/150.0);
          float ring2 = exp(-d2*d2/9.0), soft2 = exp(-d2*d2/520.0);
          float rays = 0.72 + 0.28*sin(a*74.0 + sin(a*9.0 + uTime*0.7)*2.0 - uTime*1.1);
          float rays2 = 0.82 + 0.18*sin(a*113.0 - sin(a*13.0 - uTime*0.5)*2.0 + uTime*0.8);
          float sp = 0.5 + 0.5*sin(a*37.0 + sin(a*5.0 - uTime*0.4)*1.5 + uTime*0.25);
          float sp2 = 0.5 + 0.5*sin(a*61.0 - sin(a*7.0 + uTime*0.3)*1.7 - uTime*0.2);
          float between = smoothstep(56.0, 67.0, r)*(1.0 - smoothstep(70.0, 111.6, r));
          float inner = smoothstep(21.0, 27.0, r)*(1.0 - smoothstep(30.0, 54.0, r));
          float fill = (1.0 - smoothstep(30.0, 54.0, r))*smoothstep(20.0, 27.0, r)*0.07;
          // round thirteen: the gate's plane stands in the runway, and where the two met the lit air ended in a hard horizontal line across the frame. The haze between and
          // round the rings now thins out over the last 26 m above the pavement, the rings themselves over their last 5 m (vQ.y = -21 is the runway).
          float gnd = smoothstep(-21.0, 5.0, vQ.y), gndR = smoothstep(-21.0, -16.0, vQ.y);
          vec3 c = uCol*((ring*0.85*rays + ring2*0.5*rays2)*gndR + (soft*0.22 + fill + soft2*0.1 + between*sp*sp*sp*0.1 + inner*sp2*sp2*sp2*0.09)*gnd*gnd);
          c += (vec3(1.0, 0.5, 0.26)*(exp(-(d + 2.6)*(d + 2.6)/3.2)*0.22 + exp(-(d2 + 3.8)*(d2 + 3.8)/7.0)*0.11) + vec3(0.35, 0.55, 1.0)*(exp(-(d - 2.6)*(d - 2.6)/3.2)*0.2 + exp(-(d2 - 3.8)*(d2 - 3.8)/7.0)*0.1))*gndR;
          c *= uGain*vNear*(1.0 - fxFog()*0.8)*(1.0 - smoothstep(119.0, 126.0, r));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    gate.position.set(seat[0], seat[1], seat[2] + 2.5); gate.frustumCulled = false; gate.renderOrder = 3;
    scene.add(gate);
    await ctx.yield();

    // ---- the harbour's reflections (round seven). The kit's sea mirrors the sky and the moon; this sheet, laid just over it, adds what stands on its far side: after dark the
    // island's towers as columns of broken light reaching toward the eye (the kit's skyline is scenery at infinity that follows the camera, so its mirror image is a function
    // of bearing alone: a column per fraction of a degree, tall towers reaching further, warm with a few in neon colours), and at every hour the gate's rings and the portal's
    // disc, mirrored exactly as the wet stopway mirrors them. Land, sea walls and hulls hide it through the depth buffer. One draw call, two triangles, no texture.
    // (and two things of the water's own: under every ferry the column of broken light her lamps and lit decks lay on the water toward the eye, as long as her
    // lamps' height and the eye's make it; and along the airfield's sea wall and the city's waterfront the swell breaking on the rocks, a band of foam that runs in
    // and out with each wave, pale in the sky's light)
    const RU = { uTime: T, uPortal: { value: portalCol.clone().multiplyScalar(dark ? 1 : 0.6) }, uCity: { value: dark ? (lookId === 'night' ? 1 : 0.8) : 0 }, uWY: { value: WY + 0.7 }, uFerry: { value: ferryAt },
      uSurf: { value: sky.ambientColor.clone().multiplyScalar(dark ? 0.5 : 0.75).lerp(H('#ffffff'), 0.25).multiplyScalar(dark ? 0.55 : 0.4) } };
    const mirrorGeo = new THREE.BufferGeometry();
    mirrorGeo.setAttribute('position', new THREE.Float32BufferAttribute([-2400, WY + 0.7, -110, 1500, WY + 0.7, -110, 1500, WY + 0.7, 3600, -2400, WY + 0.7, 3600], 3)); mirrorGeo.setIndex([0, 2, 1, 0, 3, 2]);
    const mirror = new THREE.Mesh(mirrorGeo, new THREE.ShaderMaterial({
      uniforms: RU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uCity, uWY; uniform vec3 uPortal, uSurf; uniform vec3 uFerry[10]; varying vec3 vW;
        float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0)); }
        float h11(float p) { p = fract(p*0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
        float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
        void main() {
          vec2 dv = vW.xz - cameraPosition.xz; float dist = max(length(dv), 1.0), hc = max(cameraPosition.y - uWY, 0.5);
          float dep = hc/dist;                                         // how far below the horizon this piece of water lies (tangent of the angle)
          float th = atan(dv.x, dv.y + (abs(dv.x) + abs(dv.y) < 1e-3 ? 1.0 : 0.0));          // never atan(0, 0)
          // wind on the water: the picture is broken into dashes that crawl
          float chop = vn(vW.xz*vec2(0.09, 0.022) + vec2(uTime*0.08, uTime*0.21)), chop2 = vn(vW.xz*vec2(0.31, 0.07) - vec2(0.0, uTime*0.5));
          float dash = smoothstep(0.25, 0.75, chop*0.6 + chop2*0.4);
          // the island's towers
          float cf = th*240.0, ci = floor(cf), cx = abs(fract(cf) - 0.5);
          float tall = h11(ci*1.37 + 3.0), on = step(0.38, h11(ci*0.73 + 11.0));
          float mass = smoothstep(0.3, 0.7, vn(vec2(th*7.0, 2.5)))*0.75 + 0.25;                 // where the towers stand thick
          float inArc = smoothstep(-2.05, -1.85, th)*(1.0 - smoothstep(0.2, 0.42, th));          // the arc of the horizon the skyline fills
          float reach = 0.035 + 0.19*tall*mass;
          float col = on*(1.0 - smoothstep(0.18, 0.5, cx))*(1.0 - smoothstep(reach*0.25, reach, dep))*smoothstep(0.0, 0.004, dep);
          float hue = h11(ci*2.11 + 7.0);
          vec3 lamp = hue < 0.72 ? vec3(1.0, 0.72, 0.4) : hue < 0.8 ? vec3(1.0, 0.2, 0.35) : hue < 0.88 ? vec3(0.2, 0.9, 0.75) : hue < 0.94 ? vec3(0.35, 0.6, 1.0) : vec3(1.0, 0.9, 0.75);
          vec3 c = lamp*col*inArc*mass*(0.35 + 0.65*dash)*0.3*uCity*(1.0 - smoothstep(2600.0, 3400.0, dist));
          // the gate and the portal: the eye's ray carried on through the water to the gate's plane and read at its mirrored height
          float den = max(vW.z - cameraPosition.z, 0.5), gt = (2.5 - cameraPosition.z)/den;
          float gx = cameraPosition.x + (vW.x - cameraPosition.x)*gt, gy = hc*(gt - 1.0)*(0.75 + 0.5*chop2) + uWY;
          float gr = length(vec2(gx, gy - 21.0)), gw = 6.0 + 0.03*max(2.5 - vW.z, 0.0);
          float d1 = gr - 54.0, d2 = gr - 111.6;
          float g = (exp(-d1*d1/(gw*gw))*0.6 + exp(-d2*d2/(2.0*gw*gw))*0.32 + (1.0 - smoothstep(18.0, 23.0, gr))*0.8)*step(vW.z, 2.4)*step(cameraPosition.z + 0.5, vW.z)*smoothstep(uWY, uWY + 5.0, gy);
          c += uPortal*g*(0.4 + 0.6*dash)*0.6;
          // the ferries' lights on the water
          for (int i = 0; i < 10; i++) {
            vec2 fv = vW.xz - uFerry[i].xy, fd = cameraPosition.xz - uFerry[i].xy; float fl = max(length(fd), 1.0); fd /= fl;
            float al = dot(fv, fd), ac = fv.x*fd.y - fv.y*fd.x, fr = fl*18.5/(hc + 18.5)*1.25;
            c += vec3(1.0, 0.8, 0.52)*exp(-ac*ac/(9.0 + 0.00001*fl*fl))*smoothstep(5.0, 16.0, al)*(1.0 - smoothstep(fr*0.3, fr, al))*(0.25 + 0.75*dash)*uFerry[i].z;
          }
          // the surf along the sea wall (the shore's own line: the city's waterfront, the airfield's west wall, the runway's end, its east wall, the basin)
          vec2 sp = vW.xz;
          float sd = min(min(min(seg(sp, vec2(-1700.0, -95.0), vec2(-110.0, -95.0)), seg(sp, vec2(-110.0, -95.0), vec2(-62.0, -40.0))), min(seg(sp, vec2(-62.0, -40.0), vec2(-62.0, 3340.0)), seg(sp, vec2(-62.0, 3340.0), vec2(215.0, 3340.0)))),
            min(min(seg(sp, vec2(215.0, 3340.0), vec2(215.0, 470.0)), seg(sp, vec2(215.0, 470.0), vec2(300.0, 380.0))), min(seg(sp, vec2(360.0, 380.0), vec2(400.0, 430.0)), seg(sp, vec2(400.0, 430.0), vec2(400.0, 1500.0)))));
          float swl = 0.5 + 0.5*sin(uTime*0.55 + vn(sp*0.021)*9.0), sn = vn(sp*0.16 + vec2(uTime*0.22, -uTime*0.17));
          float foam = smoothstep(3.6, 5.2, sd)*(1.0 - smoothstep(6.0 + 7.0*swl, 9.0 + 9.0*swl, sd + 3.0*sn))*(0.45 + 0.55*smoothstep(0.3, 0.7, vn(sp*0.6 - vec2(0.0, uTime*0.4))));
          c += uSurf*foam*(1.0 - smoothstep(1500.0, 2600.0, dist));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    mirror.frustumCulled = false; mirror.renderOrder = 2;
    scene.add(mirror);
    await ctx.yield();

    // ---- the airframe
    const craft = await buildAircraft(trim, fogCol.clone().lerp(H('#ffffff'), 0.5).multiplyScalar(look.vap ?? 1.6), ctx); scene.add(craft.group);
    const CU = craft.uniforms, INV_PI = 1 / Math.PI, cityGlow = H(look.glow || '#000000').multiplyScalar(1.5);
    await ctx.yield();

    // ---- flight
    const tA = new THREE.Vector3(), tB = new THREE.Vector3(), vRel = new THREE.Vector3(), poiV = new THREE.Vector3(), eye = new THREE.Vector3(), entryAt = path.pointAt(0).clone(), playAt = [A.playground[0], 10, A.playground[2]];
    const lookNow = { strobe: 0, shaft: 0 };
    const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), T0 = path.tangentAtDist(0).clone(), TURN_ANG = A.turn.degrees * Math.PI / 180;
    const BW = 2 * A.hill.boardHalf, D_ROLL = dist3(A.turn.to, seat), ROOF_LINE = 50, STRAIGHT = dist3(A.flyThrough[0], A.turn.from);          // the board's width; the roll-out point's distance from the seat; sixteen storeys of tenement; the straight run-in's length
    const WX = 3.2, WZ = 4.2, BK = A.bank;
    const landHead = [0, 1], BANK_TAN = SPEED * SPEED / (9.81 * A.turn.radius);          // the bank of a balanced turn of that radius at the airframe's speed (its tangent)
    function update(dt, time, camera, u) {
      T.value = time;
      const onPath = u > 0, fly = onPath ? smoothstep(0, 0.012, u) : 0, d = u * L;
      // signed turn: 1 in the middle of the right-hand bank
      path.tangentAtDist(d - BK.half, tA); path.tangentAtDist(d + BK.half, tB);          // (the bank's measure: A.bank, which the freighter's pass point reads too)
      const turnK = clamp((tA.x * tB.z - tA.z * tB.x) * (800 / (2 * BK.half)), -1.2, 1.2) * fly;

      sky.update(dt, time, camera);
      if (bolt) {
        // one eased pulse per strike (0.1 s up, 0.3 s down), a pure function of time: it lights the cloud deck, lifts the ambient light through the rig and the city's sky fill
        bolt.update(dt, time, camera);
        const ts = bolt.nextStrike(time - 1.5), ds = time - ts, env = ds >= 0 ? smoothstep(0, 0.1, ds) * Math.exp(-Math.max(ds - 0.1, 0) / 0.3) : 0;
        sky.flash = env * 0.3; if (sky.uniforms && sky.uniforms.uFlash) sky.uniforms.uFlash.value = env * 0.22;
        lookNow.flash = env;
      }
      rig.update(dt, time, camera); ocean.update(dt, time, camera); scud.update(dt, time, camera); rags.update(dt, Math.min(d, STRAIGHT) / (L / duration), camera);          // the rags' own clock: metres flown down the straight run-in (never further than its end), at the flight's mean speed
      ridges.update(dt, time, camera); skylines[0].update(dt, time, camera); skylines[1].update(dt, time, camera); skylines[2].update(dt, time, camera); junks.update(dt, time); junks2.update(dt, time); trees.update(dt, time, camera);
      stand.update(dt, time, camera); shrubs.update(dt, time, camera); clumps.update(dt, time, camera); villageTrees.update(dt, time, camera); creepers.update(dt, time, camera); tussocks.update(dt, time, camera);
      fauna.update(dt, time, camera, u); set.update(dt, time, camera); lamps.update(dt, time, camera); halo.update(dt, time, camera);
      if (rainbow) rainbow.update(dt, time, camera);
      hero.update(dt, time, camera); heli.update(time);
      // What the lights do follows the eye itself: its distance from the board (dB), from the threshold's seat (dT), from the entry (dE), its height (hEye). Round fourteen:
      // every measure is a place's own, in round metres: the board's width (BW), the roll-out point where the eye comes onto the line the lead-in masts stand on (D_ROLL
      // from the seat), the last of the break-out rags (ragOut ahead of the entry), the scud's base and the tenements' roof line, the airfield's fence.
      eye.setFromMatrixPosition(camera.matrixWorld);
      const dB = Math.hypot(eye.x - board[0], eye.y - board[1], eye.z - board[2]), dT = Math.hypot(eye.x - seat[0], eye.y - seat[1], eye.z - seat[2]), dE = eye.distanceTo(entryAt), hEye = eye.y;
      path.tangentAtDist(d, tB); { const hl = Math.hypot(tB.x, tB.z) || 1; landHead[0] = tB.x / hl; landHead[1] = tB.z / hl; }
      lookNow.heading = landHead; lookNow.bank = turnK * BANK_TAN;          // the airframe's heading and bank: where its landing lamps' pool lies (the hero's cbLand)
      lookNow.u = u; lookNow.strobe = look.strobe * (1.3 - 0.6 * smoothstep(D_ROLL, D_ROLL + 300, dT));          // the running strobes burn at full from the roll-out on, where the eye is on their own line; across the turn they are softer, coming up over its last 300 m
      const farB = smoothstep(2 * BW, 5 * BW, dB);          // 0 within two board widths of the board, 1 from five widths out
      lookNow.shaft = look.hero.shaft * lerp(1, dark ? 1.06 : 1.25, farB);          // the board burns brightest from far off, where it is small
      halo.uniforms.uIntensity.value = haloK * (0.8 + 0.5 * farB) * smoothstep(2 * BW, 4 * BW, dB) * (0.93 + 0.07 * Math.sin(time * 0.6));          // the lit air round the board: gone inside two board widths (the board itself is crisp there)
      hero.setLook(lookNow);
      if (tuftMat) tuftMat.emissiveIntensity = 1 + 2.5 * (lookNow.flash || 0);          // a uniform: the tussocks take the lightning as the field does
      if (rainbow) rainbow.uniforms.uIntensity.value = 0.38 * smoothstep(ragOut, ragOut + 200, dE);          // the bow forms once the last of the break-out rags is behind the eye, over the next 200 m
      placeFleet(time);

      // rain: heavy as we leave the scud, thinning between the squalls on the final, always gusting
      path.tangentAtDist(d, tA);
      vRel.set(WX - tA.x * SPEED * fly, -8.5 - tA.y * SPEED * fly, WZ - tA.z * SPEED * fly);
      const gust = 0.72 + 0.28 * Math.sin(time * 0.37 + 1.3) * Math.sin(time * 0.23);
      rain.update(camera, dt, vRel, 0.28 * (storming ? 0.6 : look.rain) * squall * gust * (0.55 + 0.45 * smoothstep(ROOF_LINE, scudBase, hEye)), ctx.renderer);          // heaviest under the scud's base, thinnest down at the tenements' roof line
      rain.uniforms.uLand.value = (dark ? 1 : 0.5) * smoothstep(A.fenceZ - 150, A.fenceZ, eye.z) * (onPath ? 1 : 0);          // over the last 150 m before the airfield's fence the city's light falls behind, and the rain ahead falls through our own landing lights

      // the airframe: lit by the rig, a red beacon under the belly once every 1.25 s
      const hs = rig.hemi, sn = rig.sun;
      CU.uHemiSky.value.copy(hs.color).multiplyScalar(hs.intensity * INV_PI);
      CU.uHemiGround.value.copy(hs.groundColor).multiplyScalar(hs.intensity * INV_PI).add(cityGlow);
      { const hg = CU.uHemiGround.value, hk = CU.uHemiSky.value; hg.r += hk.r * 0.42; hg.g += hk.g * 0.42; hg.b += hk.b * 0.42; }          // the haze under the aircraft is bright: its underside is grey, not black
      const kW = smoothstep(BK.off, 0.7, Math.abs(turnK));          // the wing's presence is the bank itself (it comes down with the roll in a third of a second: 18 m of the route)
      if (dark) {          // after dark the airframe would be navy on a navy sky: the wing takes the city's glow and its own inspection lamps on its underside, for as long as it is there
        const hg = CU.uHemiGround.value, hk = CU.uHemiSky.value;
        hg.r += 0.46 * kW; hg.g += 0.39 * kW; hg.b += 0.33 * kW;
        hk.r += 0.1 * kW; hk.g += 0.09 * kW; hk.b += 0.1 * kW;
      }
      CU.uKeyCol.value.copy(sn.color).multiplyScalar(sn.intensity * INV_PI); CU.uKeyDir.value.copy(sky.lightDirection);
      const bp = (time / 1.25) % 1, beacon = smoothstep(0, 0.08, bp) * (1 - smoothstep(0.08, 0.42, bp));
      // how far round the turn the aircraft is: the heading it has turned through since the entry, over the turn's own angle
      const arcF = clamp(Math.acos(clamp((tA.x * T0.x + tA.z * T0.z) / Math.max(1e-6, Math.hypot(tA.x, tA.z) * Math.hypot(T0.x, T0.z)), -1, 1)) / TURN_ANG, 0, 1);
      craft.update(camera, time, fly, turnK, fly, beacon, kW, dark ? 1 : 0.3, arcF);
      GU.uGain.value = 0.85 + 0.15 * Math.sin(time * 0.9);
    }
    placeFleet(0);
    await ctx.yield();
    // ---- the gaze's keys that are places (round fourteen): each is found on the route itself, by walking it in steps of two metres (path.posAtDist), never typed.
    // U_BOARD: where the checkerboard is abeam (the route's nearest point to the board's centre, in plan). The hard pull at the board lets go from there, and the
    // playground under the turn takes the look from there.
    // U_PLAY: where the route passes the playground. With the playground under the nose the gaze is free, and from there it begins to lean to the beacon tower.
    // leanTo: the lean lasts exactly as long as the whole tower, mast lamp and all, stands inside the frame: the first point after U_PLAY from which the tower's top
    // stands more than nine tenths of half the field of view above the line of sight to the portal's seat (the gaze's resting line down the final).
    const FOV = 60, LOOK_AHEAD = 120, twr = A.beaconTower, STEP = 2;
    const abeamU = (x, z) => { const q = new THREE.Vector3(); let bd = 1e18, at = 0; for (let m = 0; m <= L; m += STEP) { path.posAtDist(m, q); const dd = (q.x - x) * (q.x - x) + (q.z - z) * (q.z - z); if (dd < bd) { bd = dd; at = m; } } return at / L; };
    const U_BOARD = abeamU(board[0], board[2]);
    await ctx.yield();
    const U_PLAY = abeamU(playAt[0], playAt[2]);
    await ctx.yield();
    let leanTo = U_PLAY;
    { const q = new THREE.Vector3(), el = (x, y, z) => Math.atan2(y - q.y, Math.hypot(x - q.x, z - q.z));
      for (let m = U_PLAY * L; m < L; m += STEP) { path.posAtDist(m, q); leanTo = m / L; if (q.z > twr.position[2] || el(twr.position[0], twr.height, twr.position[2]) - el(seat[0], seat[1], seat[2]) > 0.9 * FOV * Math.PI / 360) break; } }
    // a bell's fall begins at to - (to - from)*fade: the `to` for which a pull from `from` begins to let go exactly at the place uAt
    const toB = U_BOARD + A.hill.boardHalf / L, fadeB = (toB - U_BOARD) / (toB - 0.15);          // the hard pull at the board lets go where the board is abeam and is gone half a board's width flown past it
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      title: look.title,
      // linger where the bank carries us round the board and over the roofs, a brisk first half of the final, an unhurried last tenth
      pace: (u) => 1.08 - 0.3 * smoothstep(0.1, 0.2, u) * (1 - smoothstep(0.42, 0.54, u)) - 0.06 * smoothstep(0.5, 0.58, u) * (1 - smoothstep(0.68, 0.76, u)),          // round nine: the avenue is no longer hurried (it was 0.12 faster from u 0.55 to 0.8): the beacon tower stands in it
      ride: 'none',
      camera: { fov: FOV, near: 0.5, far: 9000, lookAhead: LOOK_AHEAD, sway: 0.7, bank: 5.4 },
      pois: [
        // The opening: out of the scud the eye looks along the line (the horizon near mid-frame, cloud in the upper corners, the lit board in the right third), then swings
        // down onto the board by u 0.13 and stays on it as it passes close on the right.
        { at: board, from: 0, to: 0.33, weight: 0.3, fade: 0.2 },
        // round seven: then a look at where we are going, over the whole of it: the harbour under the moon, the runway and its ring on the horizon, the board left of centre
        { at: [-200, 70, 100], from: 0, to: 0.132, weight: 0.72, fade: 0.36 },
        { at: board, from: 0.095, to: 0.33, weight: 0.46, fade: 0.12 },
        { at: board, from: 0.15, to: toB, weight: 0.5, fade: fadeB },          // and harder through the close pass, held until the board is abeam: it lets go from there (U_BOARD, from the route)
        { at: playAt, from: U_BOARD, to: 0.375, weight: 0.8, fade: 0.3 },        // the last third of the bank has a subject: the floodlit playground under the turn, from where the board is abeam
        { at: (time, u) => path.posAtDist(u * L + 2 * LOOK_AHEAD, poiV).setY(24), from: 0.35, to: 0.56, weight: 0.5 },          // then the avenue, the ring near the middle of the frame: a point twice the camera's own look-ahead down the route (metres flown), at roof height
        { at: seat, from: 0.52, to: 1, weight: 0.5 },
        { at: twr.position.map((v, i) => (i === 1 ? 125 : v)), from: U_PLAY, to: leanTo, weight: 0.34, fade: 0.3 },          // round nine: the gaze leans to the beacon tower as it comes up on the left, from over the playground, and is back on the ring before the tower's top reaches the frame's upper edge (leanTo, above)
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: look.portal, glow: 1, revealDistance: 1400 },
      post: { exposure: look.exposure, bloom: look.bloom, grade: { aberration: 0, ...look.grade } },
      update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
