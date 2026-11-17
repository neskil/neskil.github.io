// THE GRAND INTERCHANGE (hero of octilinear-city, "The City That Is Only Its Map")
// A transit diagram ruled in the air: an octagonal well 400 m across flats and 130 m deep through the white sheet, in which
// nine flat ink ribbons arrive on different faces, drop or climb the rim on 45 degree ramps and run part of an octagon each
// on nine levels 24 m apart (y -120 ... +72), every corner in plan or section the same 40 m radius. One giant black-ringed
// white capsule stands up the north-east face with nine keylined landings reaching out to the lines; ringed pins with
// keylined stems bind lines that cross; dashes (trains) slide, dwell and release in files; passenger dots stream; one line
// rules itself on with a black ruling point. In the hollow middle hangs the terminus: a black-ringed white circle on edge.
//
// SPACE. Local space = the brief's world space minus the well centre: place hero.object at (230, 0, 600), no rotation.
//   y = 0 is the sheet, the floor is y = -130, +Z is north (the course), +X east. Our line (index 0) enters at
//   (-100, 48, -253), tips over the rim at z = -183, lands on level 3 (y = -72), runs the west and north-west sides of the
//   100 m octagon, turns right and ends at the terminus (20, -69.6, -30). Extent 290 m (line stubs end 70 m outside the rim at
//   their suburb level y = 8k); `radius` (85) is only the framing radius for the part viewer.
// OPTS. palette (brief order: sheet, key black, our ink, coral, teal, cobalt, darkest zone grey), inks (nine hex, overrides),
//   detail 0.6-1 (thins dots and queued dashes, never the lines), exposure (unused: the world runs post.flat = 1),
//   standalone (default true: adds the zone-stepped sheet round the well and a sheet-white dome; a world passes false and
//   cuts the octagon r = 200 out of its own ground), wellWidth (ribbon width inside the well, default 5, the world passes 7.5: the centre is drawn
//   larger; 3 m at and beyond the rim), ruling (line index to rule on, false for none; default seeded), backing (white disc
//   0.35 m behind the portal ring, default true), ownTrains (dashes on our own line, default = standalone: the world
//   rides its own dash there), style (a createStyle() result to share; default: the hero makes one), trains (how busy the
//   timetable is, default 1; the world passes 1.6 at rush hour), correction (the world's rare event: the line a level over
//   ours takes the plum ink and gets a second route a level higher as line 9, hidden until ruled with style.setDrawn(9, m);
//   returned as hero.correction { line, index, alt, level, keep, length, altLength }).
//   Round two of polish: ourY (height of our own line in the suburbs, default 48; the world passes 104 and rides a viaduct, so
//   our ramp falls ourY + 72 m), capsuleTop (y of the giant capsule's top, default 96; the world passes 190 so it stands over
//   the horizon from the suburbs), clearOver (how far over our own line another line must pass, default 10; the world's eye
//   rides 8 m up and passes 17), ourWidth (width of our own ribbon in the well, default wellWidth), dashPeriod (ruling dash
//   period in metres for the end faces, default 12; set style.uniforms.uRule = (ruling length, period, black end) to match).
// RETURNS the contract plus: style (shade the whole world with it), lines (filleted centre lines, with widths), routes,
//   track, extent, stats, setProgress(u) (world path progress: the rush wave fills the well by u 0.46 and the ruled line
//   completes by u 0.8; without it the rush is on and the ruling loops every 40 s), setRush(0..1), setRule(line, fraction).
// ANCHORS (local): portalSeat { position, normal (0,0,1): the camera arrives heading -Z, radius 7 } ; flyThrough (camera line
//   2.4 m over our ribbon every 10 m, >= 6 m clear of every other line, dash, pin and landing, ending in the portal centre);
//   rampTop / rampFoot; wellCenter (the poi); rim, floorY; capsule { position, normal, length, width }; lineEnds[i] { ink,
//   hex, wellLevel, suburbLevel, apothem, in: { p, dir }, out: { p, dir } | null } (join the suburb network to these);
//   ruledLine; pins; viewpoints.
// (Pass three: the least thickness of a mark depends on distance, minPx(w): 1.45 x in the middle distance, 0.6 x far off; a tick on
//   a line being ruled appears only where the line is solid; a far keyline is two pixels; the world adds a round ruling point.)
// (Pass two: dashes carry two black riders; dots have a size and vanish under ~2 px instead of fusing to grey; ink marks keep
//   a band's thickness (minPx) at any distance; the giant capsule is 32 m wide with four files of large dots; landings have a keel.)
// COST. About 80k triangles at rush, 4 draw calls (5 standalone), one 1024 x 27 half-float texture, no lights, ~150 ms build in
//   yielded steps. update(dt, time, camera) only sets uniforms. Per seed: which ink runs on which level, entry faces, turn
//   direction, how many sides each line runs, suburb levels, apothems, train directions and clocks, pins, the ruled line.
// EXPORTS FOR THE WORLD (the style is geometry + four unlit ShaderMaterials, nothing else):
//   createStyle({ palette, inks, exposure }) -> { colors (paper, key, zone[3], river, park, patch, crease, inks[9]), ink(hex),
//       uniforms (uTime, uRes, uDrawn[16], uRush, uFront (rush as a wave front: centre xz, radius; off below 0), uTT, uKey, uPaper), flatMaterial(), trainMaterial(track), dotMaterial(),
//       domeMaterial(), update(time, renderer), setDrawn(line, metres), dispose() }
//   STYLE_GLSL (pxSize, growMark: marks never thinner than 1.5 px), TIMETABLE_GLSL (dwell-and-ease hop clock)
//   filletLine(corners, R = 40, seg = 8), lineAt(line, s), setWidths(line, fn)      ruled polyline -> one-radius centre line
//   MarkBuffer: v, quad, prism, band, ribbon(line, index, ink), geometry()          every static mark in one mesh
//   stadium(len, w, seg)       capsule outline;   makeTrack(lines, info)   arc-length texture + per-line uniform
//   trainGeometry(), setTrains(geo, list), dotGeometry(list)                        instanced dashes and passenger dots
// EXPECTS AROUND IT: sheet-white everywhere (no fog, no lights, bloom 0, saturation and contrast 1), the world's ground with an
//   octagonal hole of apothem 200 here, and the suburb lines joined to lineEnds at their suburb levels.
import * as THREE from 'three';
import { clamp } from '../kit/core.js';

// EXACT COLOUR: the world returns post.flat = 1 (no tone map), so every ink is written as its own linear colour and
// reaches the screen as its hex. No inverse tone map anywhere.
export const DEFAULT_PALETTE = ['#F7F6F1', '#17181A', '#F2B50C', '#E8553D', '#0E8C86', '#2C56C6', '#D5D7D7'];
// the nine inks in line order (0 is always "ours", the brightest); palette[2..5] override 0, 1, 2 and 5
export const DEFAULT_INKS = ['#F2B50C', '#E8553D', '#0E8C86', '#7B2D6E', '#6FAE3B', '#2C56C6', '#E98BAB', '#9B5B2F', '#9A8FD6'];
const MAXL = 16;                       // most lines one style (one ribbon / train material) can carry

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the style
// ---------------------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
  uniform vec2 uRes;            // drawing buffer size in pixels
  uniform float uTime;
  // metres covered by one pixel at this clip position
  float pxSize(vec4 clip){ return max(clip.w, 0.05)*2./max(projectionMatrix[1][1]*uRes.y, 1.); }
  // the least thickness of an ink mark in pixels at a distance (w: clip w, metres): a bold band through the middle distance,
  // a clear thread far off, so the far network stays separate lines with paper between and never fuses into a stack
  float minPx(float w){ return max(1.5, uRes.y/150.*mix(1.45, 0.6, smoothstep(240., 800., w))); }
  // a mark that never thins below 1.5 px: g.xyz is the direction (and share) a vertex moves, g.w the mark's true size in metres
  vec3 growMark(vec3 p, vec4 g, float cap){
    vec4 c = projectionMatrix*modelViewMatrix*vec4(p, 1.);
    return p + g.xyz*clamp(1.5*pxSize(c) - g.w, 0., cap);
  }
`;

// timetable: metres travelled by a dash at time t. It dwells uTT.y of every hop of uTT.x seconds, then eases to the next stop.
export const TIMETABLE_GLSL = /* glsl */`
  uniform vec2 uTT;             // hop time in seconds, dwell fraction
  float hopEase(float x){ float n = floor(x), m = clamp((x - n - uTT.y)/max(1. - uTT.y, 1e-3), 0., 1.); return n + m*m*(3. - 2.*m); }
  float hopFrac(float x){ return x - floor(x); }
`;

const FLAT_VS = /* glsl */`
  ${STYLE_GLSL}
  uniform float uDrawn[${MAXL}]; uniform vec3 uPaper;
  attribute vec3 color; attribute vec4 aGrow; attribute vec3 aRule;    // aRule: line index (or -1), arc length, 1 = ink / 0 = casing
  varying vec3 vCol; varying vec3 vRule;
  void main(){
    float li = clamp(aRule.x, 0., ${MAXL - 1}.);
    vRule = vec3(aRule.x < -0.5 ? 1e6 : uDrawn[int(li + 0.5)], aRule.y, aRule.z);
    vec4 c0 = projectionMatrix*modelViewMatrix*vec4(position, 1.); float px = pxSize(c0);
    vec3 p = position;
    if (aRule.z < 0.5) {
      // casing: one thin white strip wider than the ink, laid on whichever face of the slab is turned away from the eye,
      // so it shows beside the ink from above and from below and never as a white thread through an edge-on line
      vec3 wp = (modelMatrix*vec4(position, 1.)).xyz;
      float sd = dot(cameraPosition - wp, mat3(modelMatrix)*color) > 0. ? -1. : 1.;
      p += color*sd*(0.3 + 0.5*clamp(minPx(c0.w)*px - 0.6, 0., 40.)) + aGrow.xyz*clamp(1.5*px - aGrow.w, 0., 2.5);
      vCol = uPaper;
    } else { p += aGrow.xyz*clamp(minPx(c0.w)*px - aGrow.w, 0., 40.); vCol = color; }
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
  }`;
const FLAT_FS = /* glsl */`
  uniform vec3 uKey; uniform vec4 uRule;                 // uRule: length of the ruling end in metres, dash period (half ink, half paper), length of the black end, least paper between two dashes in pixels
  varying vec3 vCol; varying vec3 vRule;
  void main(){
    float left = vRule.x - vRule.y;                       // metres of drawn line still ahead of this point
    float gapPx = 0.5*uRule.y/max(fwidth(vRule.y), 1e-4); // the paper between two dashes, in pixels: under uRule.w the stretch is drawn solid, never a chain of fused links or a ladder of rungs
    if (left < 0.) discard;
    if (vRule.z > 1.5 && left < uRule.x + 4.) discard;    // a symbol on the line (a station tick) drops in only where the line is already solid
    if (vRule.z < 0.5 && left < uRule.x) discard;         // and the part still being ruled is plain dashes of ink: its white casing comes with the solid line
    vec3 c = vCol;
    if (left < uRule.x && vRule.z < 1.5) {                // the ruling end (aRule.z = 2: a symbol on the line, it only drops in): plain dashes, a black ruling point at the tip
      if (left > uRule.z && gapPx >= uRule.w && fract(vRule.y/max(uRule.y, 1.)) > 0.5) discard;
      if (left <= uRule.z) { if (vRule.z < 0.5) discard; c = uKey; }
    }
    gl_FragColor = vec4(c, 1.);
  }`;

const TRAIN_VS = /* glsl */`
  ${STYLE_GLSL}
  ${TIMETABLE_GLSL}
  uniform sampler2D tTrack; uniform vec2 uTrackSize;      // 1024 x (3 rows per line): position hi, position lo, tangent
  uniform vec4 uLine[${MAXL}];                            // length, stop spacing, direction (+1/-1), clock offset in hops
  uniform float uRush; uniform float uDrawn[16]; uniform vec3 uFront; uniform vec4 uRule;       // uFront: centre xz and radius of the rush front (radius < 0: off)
  attribute vec4 aGrow;                                   // keyline: outward direction in the lozenge's own plane (x, z), size
  attribute vec4 iA;                                      // line, start metres, lag in seconds, rush flag
  attribute vec3 iCol; attribute float aKey; uniform vec3 uPaper; uniform vec3 uKey;
  varying vec3 vCol;
  vec3 trackAt(float line, float s, float L, out vec3 tang){
    float f = clamp(s/max(L, 1.), 0., 1.)*(uTrackSize.x - 1.), i0 = floor(f), i1 = min(i0 + 1., uTrackSize.x - 1.), fr = f - i0;
    float r = line*3.;
    vec2 a = (vec2(i0, r) + 0.5)/uTrackSize, b = (vec2(i1, r) + 0.5)/uTrackSize, dv = vec2(0., 1./uTrackSize.y);
    vec3 pa = textureLod(tTrack, a, 0.).xyz + textureLod(tTrack, a + dv, 0.).xyz;
    vec3 pb = textureLod(tTrack, b, 0.).xyz + textureLod(tTrack, b + dv, 0.).xyz;
    tang = mix(textureLod(tTrack, a + 2.*dv, 0.).xyz, textureLod(tTrack, b + 2.*dv, 0.).xyz, fr);
    return mix(pa, pb, fr);
  }
  void main(){
    float line = clamp(floor(iA.x + 0.5), 0., ${MAXL - 1}.);
    vec4 ln = uLine[int(line)];
    float s = mod(iA.y + ln.y*hopEase((uTime - iA.z)/uTT.x + ln.w), ln.x);
    float sc = smoothstep(0., 24., s)*(1. - smoothstep(ln.x - 24., ln.x, s));           // drawn in and out at the line's ends
    if (ln.z < 0.) s = ln.x - s;
    float rush = smoothstep(0.46, 0.54, uRush*1.3 - 0.3*floor(fract(iA.y*0.137)*4.)/4.);     // rush dashes come on a quarter at a time, each at its full size: never a half-grown lozenge standing in service
    if (uFront.z >= 0.) {                                                               // the rush as a wave front closing on a centre
      vec3 t0; vec3 P0 = trackAt(line, s, ln.x, t0);
      rush = smoothstep(-40., 40., length(P0.xz - uFront.xy) - uFront.z);
    }
    sc *= mix(1., rush, step(0.5, iA.w));
    sc *= smoothstep(uRule.x + 4., uRule.x + 20., uDrawn[int(line)] - s);                                 // no train on the part still being ruled: only the plain 6 m dashes and the ruling point
    float on = step(0.01, sc);
    // the line's width here (the centre of the map is drawn larger): the dash is scaled with it
    float ws = textureLod(tTrack, vec2((clamp(s/max(ln.x, 1.), 0., 1.)*(uTrackSize.x - 1.) + 0.5)/uTrackSize.x, (line*3. + 2.5)/uTrackSize.y), 0.).w;
    float wl = (0.5 + 0.5*max(ws, 0.2))*sc; ws = max(ws, 0.2)*sc;                       // length swells half as much as width
    float fwd = ln.z < 0. ? -1. : 1.;                                                   // the riders sit toward the nose
    vec3 tg; vec3 P = trackAt(line, s + position.z*wl*fwd, ln.x, tg);
    float tl = length(tg); vec3 T = tl > 1e-3 ? tg/tl : vec3(0., 0., 1.);
    vec3 Rr = cross(T, vec3(0., 1., 0.)); float rl = length(Rr); vec3 R = rl > 1e-3 ? Rr/rl : vec3(1., 0., 0.);
    vec3 U = cross(R, T);
    vec3 p = P + R*(position.x*ws);
    vec4 cp = projectionMatrix*modelViewMatrix*vec4(p, 1.);
    float px = pxSize(cp);
    float gy = 0.5*clamp(minPx(cp.w)*px - 0.6, 0., 40.);                                        // grows exactly as its ribbon does
    if (aKey > 1.5) {
      // a rider: a round black dot on the deck, a little off the ink so it never fights it; gone where it would be under ~2 px
      float rr = 0.52*max(ws, 0.2*sc); rr *= smoothstep(0.7, 1.2, rr/max(px, 1e-4));
      p += (R*aGrow.x + T*aGrow.z*fwd)*rr*on + U*(position.y + aGrow.y*2.*(gy + 0.45*px) + sign(position.y)*(0.08 + 0.4*px))*on;
    } else if (aKey > 0.5) {
      // keyline: a thin white lozenge a little larger than the ink one, slipped between the ribbon's face and the dash's face
      // on the side the eye is on, so it rings the dash even over its own line; edge-on it draws back inside the ink
      vec3 wp = (modelMatrix*vec4(p, 1.)).xyz, vd = cameraPosition - wp, Uw = mat3(modelMatrix)*U;
      float ct = dot(vd, Uw)/max(length(vd)*max(length(Uw), 1e-4), 1e-4), f = smoothstep(0.02, 0.1, abs(ct));
      float out2 = clamp(2.2*px - aGrow.w*ws, 0., 3.)*f - aGrow.w*ws*(1. - f);        // far off the keyline is two pixels, never a blob round the dash
      p += U*(ct > 0. ? 1. : -1.)*(0.4 + gy + 0.3*px)*on + (R*aGrow.x + T*aGrow.z*fwd)*out2*on;
    } else p += U*(position.y + aGrow.y*2.*(gy + 0.45*px))*on;
    vCol = aKey > 1.5 ? uKey : mix(iCol, uPaper, aKey);
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
  }`;
const PLAIN_FS = /* glsl */`
  varying vec3 vCol;
  void main(){ gl_FragColor = vec4(vCol, 1.); }`;

// passenger dots: flat key-black discs lying on their surface, filing along a short line and back to its start
const DOT_VS = /* glsl */`
  ${STYLE_GLSL}
  ${TIMETABLE_GLSL}
  uniform vec3 uKey; uniform float uRush;
  attribute vec3 iP; attribute vec4 iD; attribute vec4 iC; attribute vec3 iN;   // start; direction and run length; phase m, speed m/s, gate, clock; surface normal
  varying vec3 vCol;
  void main(){
    float run = max(iD.w, 0.01);
    float along = mod(iC.x + uTime*iC.y, run);
    float sc = iC.y != 0. ? smoothstep(0., 1.5, along)*(1. - smoothstep(run - 1.5, run, along)) : 1.;
    if (iC.z > 0.5) {                                      // a waiting file: steps on while its dash dwells, gathers again after
      float k = iC.z - 1.;                                // k 0..1 = place in the file
      float f2 = hopFrac(uTime/uTT.x + iC.w);
      sc = smoothstep(0.34 + 0.4*k, 0.42 + 0.4*k, f2) + (1. - smoothstep(0.03 + 0.14*k, 0.07 + 0.14*k, f2));
      sc = min(sc, 1.);
    }
    float size = max(length(iN), 1e-3);
    vec3 n = iN/size, a = abs(n.y) > 0.9 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
    vec3 b1 = normalize(cross(a, n)), b2 = cross(n, b1);
    vec3 c0 = iP + iD.xyz*along;
    vec4 cc = projectionMatrix*modelViewMatrix*vec4(c0, 1.);
    float r0 = 0.35*size; float r = r0*sc*smoothstep(0.75, 1.25, r0/max(pxSize(cc), 1e-4));     // under ~2 px across a dot is gone: paper, not stipple
    vec3 p = c0 + (b1*position.x + b2*position.y)*r;
    vCol = uKey;
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
  }`;

const DOME_VS = /* glsl */`
  varying vec3 vDir;
  void main(){ vDir = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FS = /* glsl */`
  uniform vec3 uPaper;
  void main(){ gl_FragColor = vec4(uPaper, 1.); }`;

// ---------------------------------------------------------------------------------------------------------
// THE STYLE: one object that owns the shared uniforms and hands out the materials
// ---------------------------------------------------------------------------------------------------------
export function createStyle(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE, exposure = opts.exposure ?? 1;
  const inksHex = (opts.inks || DEFAULT_INKS).slice();
  if (!opts.inks) { inksHex[0] = pal[2]; inksHex[1] = pal[3]; inksHex[2] = pal[4]; inksHex[5] = pal[5]; }
  const cache = new Map();
  const ink = (hex) => { let c = cache.get(hex); if (!c) { c = new THREE.Color(hex); cache.set(hex, c); } return c; };
  const C = { paper: ink(pal[0]), key: ink(pal[1]), zone: [ink('#ECECE9'), ink('#E1E2E0'), ink(pal[6])], river: ink('#BFE1EE'), park: ink('#DCEBCB'),
    patch: ink('#F3EDD3'), crease: ink('#E1E2E0'), inks: inksHex.map(ink) };
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1280, 720) }, uDrawn: { value: new Float32Array(MAXL).fill(1e6) },
    uRush: { value: 1 }, uFront: { value: new THREE.Vector3(0, 0, -1) }, uTT: { value: new THREE.Vector2(5.6, 0.25) }, uKey: { value: C.key }, uPaper: { value: C.paper },
    uRule: { value: new THREE.Vector4(80, 12, 3, 3) },        // the ruling end: its length, the dash period, the black end (a world with fat lines and its own ruling points changes them)
  };
  const mats = [];
  const mk = (p) => { const m = new THREE.ShaderMaterial(p); mats.push(m); return m; };
  const _sz = new THREE.Vector2();
  return {
    palette: pal, inksHex, colors: C, uniforms, ink,
    // unlit vertex-colour material for every static thing: ribbons, casings, symbols, walls. Geometry needs position,
    // color (scene values from ink()), aGrow (vec4, zeros if the mark is never thin) and aRule (vec3, x = -1 if not a ruled line)
    flatMaterial(side = THREE.DoubleSide) {
      return mk({ vertexShader: FLAT_VS, fragmentShader: FLAT_FS, side,
        uniforms: { uTime: uniforms.uTime, uRes: uniforms.uRes, uDrawn: uniforms.uDrawn, uKey: uniforms.uKey, uPaper: uniforms.uPaper, uRule: uniforms.uRule } });
    },
    // dashes: an InstancedBufferGeometry from trainGeometry() + instance attributes iA (line, start m, lag s, rush flag) and iCol
    trainMaterial(track) {
      return mk({ vertexShader: TRAIN_VS, fragmentShader: PLAIN_FS, side: THREE.DoubleSide,
        uniforms: { uTime: uniforms.uTime, uRes: uniforms.uRes, uTT: uniforms.uTT, uRush: uniforms.uRush, uFront: uniforms.uFront, uPaper: uniforms.uPaper, uKey: uniforms.uKey, uDrawn: uniforms.uDrawn, uRule: uniforms.uRule,
          tTrack: { value: track.texture }, uTrackSize: { value: new THREE.Vector2(track.width, track.rows) }, uLine: { value: track.lineUniform } } });
    },
    // passenger dots: an InstancedBufferGeometry from dotGeometry() + iP, iD, iC, iN
    dotMaterial() {
      return mk({ vertexShader: DOT_VS, fragmentShader: PLAIN_FS, side: THREE.DoubleSide,
        uniforms: { uTime: uniforms.uTime, uRes: uniforms.uRes, uTT: uniforms.uTT, uRush: uniforms.uRush, uKey: uniforms.uKey } });
    },
    // the sheet-white dome (no horizon): follow the camera every frame, renderOrder -1, frustumCulled false
    domeMaterial() { return mk({ vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uPaper: uniforms.uPaper } }); },
    // call once a frame (the hero's update() does it when the hero owns the style)
    update(time, renderer) {
      uniforms.uTime.value = time;
      if (renderer) { renderer.getDrawingBufferSize(_sz); if (_sz.y > 0) uniforms.uRes.value.copy(_sz); }
    },
    setDrawn(line, metres) { uniforms.uDrawn.value[clamp(line | 0, 0, MAXL - 1)] = metres; },
    dispose() { for (const m of mats) m.dispose(); },
  };
}

// ---------------------------------------------------------------------------------------------------------
// GEOMETRY OF THE STYLE
// ---------------------------------------------------------------------------------------------------------
const add3 = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const crs3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// The one radius: turns a ruled polyline (corners at 45 or 90 degrees in plan or in section) into a centre line whose
// every corner is an arc of radius R in `seg` pieces (R may be a function of the corner index: stripes that turn abreast
// share one centre, so the inner one turns tighter). Returns { pts: [[x,y,z]...], arc: [metres...], length }.
export function filletLine(corners, R = 40, seg = 8) {
  const pts = [corners[0].slice()];
  for (let i = 1; i < corners.length - 1; i++) {
    const P = corners[i], d1 = nrm3(sub3(P, corners[i - 1])), d2 = nrm3(sub3(corners[i + 1], P));
    const cs = clamp(dot3(d1, d2), -1, 1), th = Math.acos(cs);
    if (th < 0.02) { pts.push(P.slice()); continue; }
    const room = Math.min(len3(sub3(P, corners[i - 1])), len3(sub3(corners[i + 1], P))) * 0.49;
    const Ri = typeof R === 'function' ? R(i) : R, t = Math.min(Ri * Math.tan(th / 2), room), r = t / Math.tan(th / 2);
    const A = add3(P, d1, -t), bis = nrm3(sub3(d2, d1)), O = add3(P, bis, r / Math.cos(th / 2));
    const u = sub3(A, O), w = nrm3(crs3(crs3(u, d1), u));          // w: in the plane of the turn, perpendicular to u, along travel
    for (let k = 0; k <= seg; k++) { const a = th * k / seg; pts.push(add3(add3(O, u, Math.cos(a)), w, Math.sin(a) * r)); }
  }
  pts.push(corners[corners.length - 1].slice());
  const arc = [0];
  for (let i = 1; i < pts.length; i++) arc.push(arc[i - 1] + len3(sub3(pts[i], pts[i - 1])));
  return { pts, arc, length: arc[arc.length - 1] };
}
// position and unit tangent at arc length s on a filleted line
export function lineAt(line, s) {
  const { pts, arc } = line; s = clamp(s, 0, line.length);
  let lo = 0, hi = arc.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arc[m] <= s) lo = m; else hi = m; }
  const d = sub3(pts[hi], pts[lo]), l = Math.max(arc[hi] - arc[lo], 1e-6), f = (s - arc[lo]) / l;
  return { p: add3(pts[lo], d, f), t: [d[0] / l, d[1] / l, d[2] / l], w: line.w ? line.w[lo] + (line.w[hi] - line.w[lo]) * f : 3 };
}

// Collects every static mark into one indexed geometry for flatMaterial().
export class MarkBuffer {
  constructor() { this.pos = []; this.col = []; this.grow = []; this.rule = []; this.idx = []; this.n = 0; }
  v(p, c, g, r) {
    this.pos.push(p[0], p[1], p[2]); this.col.push(c.r, c.g, c.b);
    if (g) this.grow.push(g[0], g[1], g[2], g[3]); else this.grow.push(0, 0, 0, 0);
    if (r) this.rule.push(r[0], r[1], r[2]); else this.rule.push(-1, 0, 1);
    return this.n++;
  }
  quad(a, b, c, d, col) { const i = this.v(a, col), j = this.v(b, col), k = this.v(c, col), l = this.v(d, col); this.idx.push(i, j, k, i, k, l); }
  // a flat prism: convex outline [[x,y]...] in the plane (o; ex, ey), from -h/2 to +h/2 along ez
  prism(outline, o, ex, ey, ez, h, col, rule) {
    const n = outline.length, P = (q, s) => add3(add3(add3(o, ex, q[0]), ey, q[1]), ez, s * h / 2);
    for (const s of [1, -1]) { const c0 = this.v(P([0, 0], s), col, null, rule), b = this.n; for (const q of outline) this.v(P(q, s), col, null, rule); for (let i = 0; i < n; i++) this.idx.push(c0, b + i, b + (i + 1) % n); }
    const b = this.n; for (const q of outline) { this.v(P(q, 1), col, null, rule); this.v(P(q, -1), col, null, rule); }
    for (let i = 0; i < n; i++) { const a = b + 2 * i, c = b + 2 * ((i + 1) % n); this.idx.push(a, a + 1, c + 1, a, c + 1, c); }
  }
  // the band between two outlines with the same number of points (a keyline ring), same thickness
  band(outer, inner, o, ex, ey, ez, h, col, rule) {
    const n = outer.length, P = (q, s) => add3(add3(add3(o, ex, q[0]), ey, q[1]), ez, s * h / 2);
    for (const s of [1, -1]) { const b = this.n; for (let i = 0; i < n; i++) { this.v(P(outer[i], s), col, null, rule); this.v(P(inner[i], s), col, null, rule); }
      for (let i = 0; i < n; i++) { const a = b + 2 * i, c = b + 2 * ((i + 1) % n); this.idx.push(a, a + 1, c + 1, a, c + 1, c); } }
    for (const ring of [outer, inner]) { const b = this.n; for (const q of ring) { this.v(P(q, 1), col, null, rule); this.v(P(q, -1), col, null, rule); }
      for (let i = 0; i < n; i++) { const a = b + 2 * i, c = b + 2 * ((i + 1) % n); this.idx.push(a, a + 1, c + 1, a, c + 1, c); } }
  }
  // a line of the map: an ink slab (line.w or 3 m wide, 0.6 m deep) and a flat white casing strip 0.5 m wider each side,
  // which the shader lays on the face turned away from the eye. Edges keep
  // 1.5 px (aGrow); aRule carries line index and arc length so uDrawn can rule it on.
  ribbon(line, index, inkCol, s0 = 0, s1 = Infinity) {
    const { pts, arc } = line, n = pts.length, ring = [];
    for (let i = 0; i < n; i++) {
      const T = nrm3(sub3(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)])), hw = (line.w ? line.w[i] : 3) / 2;
      const R = nrm3(crs3(T, [0, 1, 0])), U = crs3(R, T), s = clamp(arc[i], s0, s1), q = pts[i], Uc = { r: U[0], g: U[1], b: U[2] };
      const at = (x, y) => add3(add3(q, R, x), U, y), gu = (k) => [U[0] * 0.5 * k, U[1] * 0.5 * k, U[2] * 0.5 * k, 0.6], gr = (k) => [R[0] * k, R[1] * k, R[2] * k, 0.5];
      const b = this.n;
      this.v(at(-hw, 0.3), inkCol, gu(1), [index, s, 1]); this.v(at(hw, 0.3), inkCol, gu(1), [index, s, 1]);
      this.v(at(hw, -0.3), inkCol, gu(-1), [index, s, 1]); this.v(at(-hw, -0.3), inkCol, gu(-1), [index, s, 1]);
      this.v(at(-hw - 0.5, 0), Uc, gr(-1), [index, s, 0]); this.v(at(hw + 0.5, 0), Uc, gr(1), [index, s, 0]);   // casing: colour slot carries the slab's up vector
      ring.push(b);
    }
    for (let i = 0; i < n - 1; i++) {
      if (arc[i + 1] <= s0 || arc[i] >= s1) continue;
      const a = ring[i], c = ring[i + 1];
      for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; this.idx.push(a + k, c + k, c + k2, a + k, c + k2, a + k2); }
      this.idx.push(a + 4, c + 4, c + 5, a + 4, c + 5, a + 5);
    }
    for (const e of [ring[0], ring[n - 1]]) this.idx.push(e, e + 1, e + 2, e, e + 2, e + 3);
  }
  // end faces for the 6 m dashes of a line that is being ruled: a cross wall of ink just inside each end of every dash (the
  // dash pattern is cut in the fragment shader, so without them a dash is an open tube and the paper shows through it end-on).
  // Inside the solid line they are hidden in the slab.
  caps(line, index, inkCol, s0 = 0, s1 = Infinity, period = 12) {
    const end = Math.min(s1, line.length);
    for (let s = Math.ceil(s0 / period) * period; s < end; s += period) for (const sc of [s + 0.06, s + period / 2 - 0.06]) {
      const f = lineAt(line, sc), T = f.t, hw = f.w / 2, R = nrm3(crs3(T, [0, 1, 0])), U = crs3(R, T);
      const at = (x, y) => add3(add3(f.p, R, x), U, y), gu = (k) => [U[0] * 0.5 * k, U[1] * 0.5 * k, U[2] * 0.5 * k, 0.6], r = [index, sc, 1];
      const a = this.v(at(-hw, 0.3), inkCol, gu(1), r), b = this.v(at(hw, 0.3), inkCol, gu(1), r), c = this.v(at(hw, -0.3), inkCol, gu(-1), r), d = this.v(at(-hw, -0.3), inkCol, gu(-1), r);
      this.idx.push(a, b, c, a, c, d);
    }
  }
  // the same geometry, built in five short steps (a big buffer of marks converted in one go can hold the page for tens of ms)
  async geometryYield(ctx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); await ctx.yield();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); await ctx.yield();
    g.setAttribute('aGrow', new THREE.Float32BufferAttribute(this.grow, 4)); await ctx.yield();
    g.setAttribute('aRule', new THREE.Float32BufferAttribute(this.rule, 3)); await ctx.yield();
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1)); await ctx.yield();
    return g;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aGrow', new THREE.Float32BufferAttribute(this.grow, 4));
    g.setAttribute('aRule', new THREE.Float32BufferAttribute(this.rule, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    return g;
  }
}
// give a filleted line a width at every point (fn(point) -> metres); ribbons, ticks and dashes follow it
export function setWidths(line, fn) { line.w = line.pts.map(fn); return line; }
// outline of a capsule (stadium) of total length len along x and width w, centred; `seg` pieces per round end
export function stadium(len, w, seg = 8) {
  const r = w / 2, h = Math.max(len / 2 - r, 0), o = [];
  for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + Math.PI * i / seg; o.push([h + Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i <= seg; i++) { const a = Math.PI / 2 + Math.PI * i / seg; o.push([-h + Math.cos(a) * r, Math.sin(a) * r]); }
  return o;
}

// Positions and headings of every line by arc length, for the train shader: a 1024 x 3n half-float texture (rows per line:
// position rounded to whole metres, the remainder, unit tangent; two rows because a half float alone is 0.25 m coarse at 300 m).
// info[i] = { spacing: metres between stops, dir: +1/-1, clock: offset in hops }.
const trackRow = (data, W, lineUniform, ln, li, info) => {
  const H = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < W; i++) {
    const { p, t, w } = lineAt(ln, ln.length * i / (W - 1));
    for (let k = 0; k < 3; k++) {
      const hi = Math.round(p[k]);
      data[((li * 3) * W + i) * 4 + k] = H(hi); data[((li * 3 + 1) * W + i) * 4 + k] = H(p[k] - hi); data[((li * 3 + 2) * W + i) * 4 + k] = H(t[k]);
    }
    data[((li * 3 + 2) * W + i) * 4 + 3] = H((w || 3) / 3);
  }
  const nf = info[li] || {}, stops = Math.max(1, Math.round(ln.length / (nf.spacing || 96)));
  if (li < MAXL) lineUniform[li].set(ln.length, ln.length / stops, nf.dir ?? 1, nf.clock ?? 0);
};
const trackTexture = (data, W, rows, lineUniform, lines) => {
  const texture = new THREE.DataTexture(data, W, rows, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
  return { texture, width: W, rows, lineUniform, lines };
};
export function makeTrack(lines, info = []) {
  const W = 1024, rows = lines.length * 3, data = new Uint16Array(W * rows * 4);
  const lineUniform = []; for (let i = 0; i < MAXL; i++) lineUniform.push(new THREE.Vector4(1, 1, 1, 0));
  lines.forEach((ln, li) => trackRow(data, W, lineUniform, ln, li, info));
  return trackTexture(data, W, rows, lineUniform, lines);
}
// the same, one line per step (a world builds while the previous one is on screen)
export async function makeTrackYield(lines, info, ctx) {
  const W = 1024, rows = lines.length * 3, data = new Uint16Array(W * rows * 4);
  const lineUniform = []; for (let i = 0; i < MAXL; i++) lineUniform.push(new THREE.Vector4(1, 1, 1, 0));
  for (let li = 0; li < lines.length; li++) { trackRow(data, W, lineUniform, lines[li], li, info || []); await ctx.yield(); }
  return trackTexture(data, W, rows, lineUniform, lines);
}

// A dash: a lozenge (len x w x 0.5 m) in the instance's ink with a white keyline `key` wide all round. Its length runs
// along local z and every vertex is laid on the track by its own arc length, so it bends round the one radius and over ramp feet.
export function trainGeometry(len = 16, w = 4, key = 0.36, arcSeg = 5, midSeg = 6) {
  const pos = [], grow = [], keyA = [], idx = [];
  const slab = (H, r, th, isKey) => {
    const st = [];
    for (let i = arcSeg; i >= 0; i--) { const a = (Math.PI / 2) * i / arcSeg; st.push([-(H - r) - r * Math.sin(a), r * Math.cos(a), -Math.sin(a), Math.cos(a)]); }
    for (let i = 1; i < midSeg; i++) st.push([-(H - r) + 2 * (H - r) * i / midSeg, r, 0, 1]);
    for (let i = 0; i <= arcSeg; i++) { const a = (Math.PI / 2) * i / arcSeg; st.push([(H - r) + r * Math.sin(a), r * Math.cos(a), Math.sin(a), Math.cos(a)]); }
    const base = pos.length / 3;
    for (const [z, hw, nz, nx] of st) {
      for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
        pos.push(sx * hw, sy * th / 2, z); keyA.push(isKey ? 1 : 0);
        if (isKey) grow.push(sx * nx, 0, nz, key); else grow.push(0, sy * 0.5, 0, th);
      }
    }
    for (let i = 0; i < st.length - 1; i++) { const a = base + i * 4, c = a + 4;
      for (let k = 0; k < (isKey ? 1 : 4); k++) { const k2 = (k + 1) % 4; idx.push(a + k, c + k, c + k2, a + k, c + k2, a + k2); } }   // the keyline is one flat sheet
  };
  slab(len / 2, w / 2, 1.0, false);
  slab(len / 2 + key, w / 2 + key, 0, true);
  // the riders: aKey = 2; position = the dot's centre on the deck (y = +-0.5), aGrow.xz = this corner's place on the unit circle
  for (const [cx, cz] of [[-0.62, len * 0.33], [0.6, len * 0.24]]) for (const sy of [1, -1]) {
    const base = pos.length / 3, n = 10;
    for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2; pos.push(cx, sy * 0.5, cz); grow.push(Math.cos(a), sy * 0.5, Math.sin(a), 0); keyA.push(2); }
    for (let i = 1; i < n - 1; i++) idx.push(base, base + i, base + i + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aGrow', new THREE.Float32BufferAttribute(grow, 4));
  g.setAttribute('aKey', new THREE.Float32BufferAttribute(keyA, 1));
  g.setIndex(idx);
  return g;
}
// fill a trainGeometry() with dashes: list of { line, start (m), lag (s), rush (0/1), color (THREE.Color from style.ink) }
export function setTrains(geo, list) {
  const iA = new Float32Array(list.length * 4), iCol = new Float32Array(list.length * 3);
  list.forEach((t, i) => { iA.set([t.line, t.start, t.lag || 0, t.rush ? 1 : 0], i * 4); iCol.set([t.color.r, t.color.g, t.color.b], i * 3); });
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); geo.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  geo.instanceCount = list.length;
  return geo;
}

// Passenger dots: flat discs 0.7 m across times `size` (default 1; the centre of the map is drawn larger), each lying on a
// surface with normal n; a dot that would be under about 2 px across is not drawn at all (paper, never grey stipple).
// list of { p: [x,y,z] start, d: [x,y,z] unit direction, run: metres, phase: metres, speed: m/s, gate: 0 or 1 + place 0..1, clock, n: normal }
export function dotGeometry(list) {
  const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) * Math.PI / 6; pos.push(Math.cos(a), Math.sin(a), 0); }
  for (let i = 1; i < 11; i++) idx.push(0, i, i + 1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const iP = new Float32Array(list.length * 3), iD = new Float32Array(list.length * 4), iC = new Float32Array(list.length * 4), iN = new Float32Array(list.length * 3);
  list.forEach((d, i) => { iP.set(d.p, i * 3); iD.set([d.d[0], d.d[1], d.d[2], d.run || 1], i * 4); iC.set([d.phase || 0, d.speed || 0, d.gate || 0, d.clock || 0], i * 4); iN.set([d.n[0] * (d.size || 1), d.n[1] * (d.size || 1), d.n[2] * (d.size || 1)], i * 3); });
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 3)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(iD, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iN', new THREE.InstancedBufferAttribute(iN, 3));
  g.instanceCount = list.length;
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// THE WELL: its measures, and the seeded routing of the nine lines through it
// ---------------------------------------------------------------------------------------------------------
const RIM = 200, KRIM = RIM * Math.SQRT2, T8 = Math.tan(Math.PI / 8), FLOOR = -130, STUB = 70, CAPD = 172;
const levelY = (k) => -120 + 24 * (k - 1);            // well level 1..9
const NE = [Math.SQRT1_2, 0, Math.SQRT1_2], NET = [-Math.SQRT1_2, 0, Math.SQRT1_2];
const sideN = (j) => [Math.cos(j * Math.PI / 4), 0, Math.sin(j * Math.PI / 4)];
const sideH = (j, s) => [-s * Math.sin(j * Math.PI / 4), 0, s * Math.cos(j * Math.PI / 4)];

function routeLine(r) {               // r: { level, a, s, j0, n, sub } -> ruled corners
  const yW = levelY(r.level), yS = 8 * r.sub, dy = Math.abs(yW - yS), c = [];
  const at = (j, t, y) => { const n = sideN(j), h = sideH(j, r.s); return [n[0] * r.a + h[0] * t, y, n[2] * r.a + h[2] * t]; };
  c.push(at(r.j0, -(KRIM - r.a) - STUB, yS)); c.push(at(r.j0, -(KRIM - r.a), yS));
  if (dy > 0.5) c.push(at(r.j0, -(KRIM - r.a) + dy, yW));
  let j = r.j0;
  for (let i = 0; i < r.n - 1; i++) { c.push(at(j, r.a * T8, yW)); j = (j + r.s + 8) % 8; }
  if (r.spur) { for (const p of r.spur) c.push(p); return c; }
  if (dy > 0.5) c.push(at(j, (KRIM - r.a) - dy, yW));
  c.push(at(j, KRIM - r.a, yS)); c.push(at(j, KRIM - r.a + STUB, yS));
  r.jOut = j;
  return c;
}
const sampleLine = (ln, step) => { const o = []; for (let s = 0; s <= ln.length; s += step) o.push(lineAt(ln, s).p); return o; };

// how badly a set of routed lines collides: ribbons through ribbons, through the giant capsule or a landing, or too near our own camera line
async function clashes(ctx, lines, routes, over = 10) {      // over: how far above our own line another line must pass (the world's eye rides high)
  const S = [], grid = new Map(), CELL = 10; let bad = 0;
  for (const l of lines) { S.push(sampleLine(l, 5)); await ctx.yield(); }
  // every sample goes into a 10 m plan grid: a pair of lines is compared cell by cell, not point by point
  for (let i = 0; i < S.length; i++) { for (const p of S[i]) { const key = (Math.floor(p[0] / CELL) + 512) * 1024 + Math.floor(p[2] / CELL) + 512; let c = grid.get(key); if (!c) grid.set(key, c = []); c.push(i, p[0], p[1], p[2]); }
    await ctx.yield(); }
  for (let i = 0; i < S.length; i++) {
    for (const p of S[i]) {
      const d = p[0] * NE[0] + p[2] * NE[2], t = p[0] * NET[0] + p[2] * NET[2];
      if (Math.abs(d - CAPD) < 5 && Math.abs(t) < 18 && p[1] < 100) bad++;
      if (Math.abs(t) < 9) for (let k = 0; k < routes.length; k++) if (k !== i && d > routes[k].a - 6 && d < CAPD && p[1] - levelY(routes[k].level) + 0.9 < 3 && p[1] - levelY(routes[k].level) + 0.9 > -10) bad++;
      const cx = Math.floor(p[0] / CELL) + 512, cz = Math.floor(p[2] / CELL) + 512;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const c = grid.get((cx + a) * 1024 + cz + b); if (!c) continue;
        for (let j = 0; j < c.length; j += 4) {
          if (c[j] <= i) continue;
          const dy = Math.abs(p[1] - c[j + 2]); if (dy > over) continue;
          const dh = Math.hypot(p[0] - c[j + 1], p[2] - c[j + 3]), up = c[j + 2] - p[1];
          if (i === 0 ? (dh < 10 && up > -5 && up < over) : (dh < 7 && dy < 4)) bad += i === 0 && up < 10 ? 6 : 1;     // a line close over our own is the worst clash: the eye rides there
        }
      }
    }
    await ctx.yield();
  }
  return bad;
}

async function layoutInterchange(ctx, rng, ourSub = 6, over = 10) {
  const baseA = { 1: 64, 2: 84, 4: 106, 5: 74, 6: 118, 7: 130, 8: 142, 9: 152 };
  let best = null;
  for (let attempt = 0; attempt < 32; attempt++) {
    const routes = [{ level: 3, a: 100, s: -1, j0: 4, n: 3, sub: ourSub, spur: [[20, -72, 100], [20, -72, -30]] }];
    const levels = rng.shuffle([1, 2, 4, 5, 6, 7, 8, 9]);                 // which ink runs on which level
    let subs = null;
    for (let t = 0; t < 60 && !subs; t++) {                                // suburb levels whose ramps fit before the first corner
      const cand = rng.shuffle([1, 2, 3, 4, 5, 7, 8, 9]); let ok = true;
      for (let i = 0; i < 8 && ok; i++) { const a = baseA[levels[i]]; ok = Math.abs(levelY(levels[i]) - 8 * cand[i]) <= (KRIM - a) - a * T8 - 34; }
      if (ok) subs = cand;
    }
    if (!subs) subs = levels.map((k) => clamp(Math.round((levelY(k) + 60) / 16), 1, 9));
    const bundle = rng.int(2, 3);                                          // lines that arrive beside ours on the west side
    for (let i = 0; i < 8; i++) {
      const a = baseA[levels[i]] + rng.int(-3, 3); let s, j0, need;
      if (i < bundle) { s = -1; j0 = 4; need = 4; }
      else if (rng.chance(0.3)) { s = -1; j0 = rng.pick([3, 5, 2]); need = j0 === 5 ? 5 : 3; }
      else { s = 1; j0 = rng.pick([6, 7, 7, 0, 0, 1]); need = Math.max(3, ((1 - j0 + 8) % 8) + 1); }
      routes.push({ level: levels[i], a, s, j0, n: Math.min(Math.max(need + rng.int(1, 3), 5), 7), sub: subs[i] });
    }
    const lines = routes.map((r) => filletLine(routeLine(r)));
    const bad = await clashes(ctx, lines, routes, over);
    if (!best || bad < best.bad) best = { routes, lines, bad };
    await ctx.yield();
    if (bad === 0) break;
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------------
// THE HERO
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('grand-interchange') : ctx.rng;
  const detail = clamp(opts.detail ?? 1, 0.6, 1), standalone = opts.standalone ?? true;
  const style = opts.style || createStyle({ palette: opts.palette, inks: opts.inks, exposure: opts.exposure });
  const C = style.colors, root = new THREE.Group(); root.name = 'grand-interchange';
  await ctx.yield();

  // ---- the nine lines ----
  const ourY = opts.ourY ?? 48, capTop = opts.capsuleTop ?? 96;     // our line's height in the suburbs (the world may ride high over the sheet); the giant capsule's top
  const lay = await layoutInterchange(ctx, rng, ourY / 8, opts.clearOver ?? 10), routes = lay.routes, lines = lay.lines;
  const inkOf = [0].concat(rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8]));         // line i is drawn in ink inkOf[i]; ours is always ink 0
  // a line that rules itself on: seeded, never ours
  let ruled = opts.ruling === false ? -1 : (opts.ruling ?? rng.int(1, lines.length - 1));
  // opts.correction (the world's rare event): the plum line gets a second route a level higher, drawn as line 9 and hidden
  // until the world rules it on (setDrawn); the plum line is then the ruled one and the world drives both
  let corr = null;
  if (opts.correction) {
    // the line re-ruled is the one a level or two over our own (in view from our ring); it is given the plum ink
    let li = 1; for (const want of [4, 5, 6, 7, 2]) { const k = routes.findIndex((q, i) => i > 0 && q.level === want); if (k > 0) { li = k; break; } }
    { const j = inkOf.indexOf(3), t = inkOf[li]; if (j > 0) { inkOf[li] = 3; inkOf[j] = t; } }
    const r = routes[li]; let bestBad = 1e9;
    for (const dl of [1, 0.5, -1, -0.5, 1.5]) {
      const r2 = { ...r, level: r.level + dl };
      if (Math.abs(levelY(r2.level) - 8 * r.sub) > (KRIM - r.a) - r.a * T8 - 34) continue;
      const alt = filletLine(routeLine(r2)), set = lines.slice(); set[li] = alt;
      const bad = await clashes(ctx, set, routes.map((q, i) => (i === li ? r2 : q)), opts.clearOver ?? 10);
      if (bad < bestBad) { bestBad = bad; corr = { line: li, index: 9, alt, level: r2.level, keep: STUB + 14, length: lines[li].length, altLength: alt.length }; }
      if (bad === 0) break;
    }
    if (corr) ruled = corr.line;
  }
  const M = new MarkBuffer();
  // the centre is drawn larger: 3 m ribbons at the rim swell to `wellWidth` inside the well
  const wellW = opts.wellWidth ?? 5;
  lines.forEach((ln, i) => setWidths(ln, (p) => { const t = clamp((RIM + 30 - Math.hypot(p[0], p[2])) / 70, 0, 1); return 3 + ((i === 0 ? opts.ourWidth ?? wellW : wellW) - 3) * t * t * (3 - 2 * t); }));
  for (let i = 0; i < lines.length; i++) { M.ribbon(lines[i], i, C.inks[inkOf[i]]); await ctx.yield(); }
  if (ruled >= 0 && lines[ruled]) M.caps(lines[ruled], ruled, C.inks[inkOf[ruled]], 0, Infinity, opts.dashPeriod ?? 12);
  if (corr) { setWidths(corr.alt, (p) => { const t = clamp((RIM + 30 - Math.hypot(p[0], p[2])) / 70, 0, 1); return 3 + (wellW - 3) * t * t * (3 - 2 * t); });
    M.ribbon(corr.alt, 9, C.inks[inkOf[corr.line]]); M.caps(corr.alt, 9, C.inks[inkOf[corr.line]], 0, Infinity, opts.dashPeriod ?? 12); style.setDrawn(9, 0); }
  await ctx.yield();

  // ---- the well: eight banded faces, a stepped floor, the white lip, and (standalone) the sheet around it ----
  const octPt = (j, r, y) => { const a = (j + 0.5) * Math.PI / 4, rr = r / Math.cos(Math.PI / 8); return [Math.cos(a) * rr, y, Math.sin(a) * rr]; };
  const bandsY = [FLOOR, -108, -84, -60, -36, -12, 0];
  for (let j = 0; j < 8; j++) for (let b = 0; b < bandsY.length - 1; b++)
    M.quad(octPt(j, RIM, bandsY[b]), octPt(j + 1, RIM, bandsY[b]), octPt(j + 1, RIM, bandsY[b + 1]), octPt(j, RIM, bandsY[b + 1]), C.zone[(b + 1) % 2]);
  const octRing = (r0, r1, y, col) => { for (let j = 0; j < 8; j++) M.quad(octPt(j, r0, y), octPt(j + 1, r0, y), octPt(j + 1, r1, y), octPt(j, r1, y), col); };
  octRing(0.01, 58, FLOOR, C.zone[0]); octRing(58, 132, FLOOR, C.zone[1]); octRing(132, RIM, FLOOR, C.zone[2]);
  octRing(RIM, RIM + 3.5, 0.06, C.paper);                                   // the casing of the hole itself
  if (standalone) { octRing(RIM + 3.5, 330, 0, C.zone[2]); octRing(330, 520, 0, C.zone[1]); octRing(520, 760, 0, C.zone[0]); octRing(760, 2400, 0, C.paper); }
  await ctx.yield();

  // ---- the giant capsule up the north-east face, and its nine landings ----
  const CAPW = 32, capO = [NE[0] * CAPD, (FLOOR + capTop) / 2, NE[2] * CAPD], capLen = capTop - FLOOR, UP = [0, 1, 0];
  M.prism(stadium(capLen - 5.2, CAPW - 5.2, 12), capO, UP, NET, NE, 1.2, C.paper);
  M.band(stadium(capLen, CAPW, 12), stadium(capLen - 5.2, CAPW - 5.2, 12), capO, UP, NET, NE, 1.3, C.key);
  const landing = [];                                                       // per level: inner reach (apothem) and height
  for (let k = 1; k <= 9; k++) {
    const r = routes.find((q) => q.level === k), onNE = r && !r.spur, d0 = (onNE ? r.a : 112) - 5, y = levelY(k) - 0.9;
    const mid = (d0 + CAPD + 5) / 2, len = CAPD + 5 - d0, o = [NE[0] * mid, y, NE[2] * mid];
    M.prism(stadium(len - 2.8, 9.2, 6), o, NE, NET, UP, 0.5, C.paper);
    M.band(stadium(len, 12, 6), stadium(len - 2.8, 9.2, 6), o, NE, NET, UP, 0.56, C.key);
    // the same tongue stood on edge under it: seen from the side a landing is still a black-ringed white tongue, never a thorn
    { const o2 = [o[0], o[1] - 4.2, o[2]];
      M.prism(stadium(len - 2.8, 5.2, 6), o2, NE, UP, NET, 0.5, C.paper);
      M.band(stadium(len, 8, 6), stadium(len - 2.8, 5.2, 6), o2, NE, UP, NET, 0.56, C.key); }
    landing.push({ k, d0, y, len });
  }
  await ctx.yield();

  // ---- the terminus: a black-ringed white circle stood on edge at the end of our line (the 14 m portal sits in its ring) ----
  const TERM = [20, -72 + 2.4, -30];
  { const circ = (r, n = 40) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
    const ex = [1, 0, 0], ey = [0, 1, 0], ez = [0, 0, 1];
    M.band(circ(8.6), circ(7), TERM, ex, ey, ez, 0.5, C.key);
    M.band(circ(12), circ(8.6), TERM, ex, ey, ez, 0.4, C.paper);
    if (opts.backing ?? true) M.prism(circ(7.05), add3(TERM, ez, -0.35), ex, ey, ez, 0.1, C.paper); }
  await ctx.yield();

  // ---- stations: white ticks, the timetable of each line, waiting files of dots ----
  const dots = [], trains = [], info = [], stations = [], tMul = opts.trains ?? 1;   // opts.trains: how busy the timetable is (1 = the default rush)
  const nearestS = (ln, q) => { let b = 0, bd = 1e9; for (let s = 0; s <= ln.length; s += 1) { const p = lineAt(ln, s).p, d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); if (d < bd) { bd = d; b = s; } } return b; };
  const nLines = lines.length, allLines = corr ? lines.concat([corr.alt]) : lines;
  for (let i = 0; i < allLines.length; i++) {
    const isAlt = i >= nLines, ln = allLines[i], r = isAlt ? { ...routes[corr.line], level: corr.level } : routes[i], stops = Math.max(1, Math.round(ln.length / 96)), D = ln.length / stops;
    const dir = i === 0 ? 1 : isAlt ? info[corr.line].dir : (rng.chance(0.5) ? 1 : -1), clock = isAlt ? info[corr.line].clock : rng();
    const sSt = nearestS(ln, r.spur ? [-100, -72, 0] : [NE[0] * r.a, levelY(r.level), NE[2] * r.a]) % D;
    info.push({ spacing: 96, dir, clock }); stations.push({ D, sSt, stops });
    for (let m = 0; m < stops; m++) {
      const s = sSt + m * D, f = lineAt(ln, s), T = f.t, flat = Math.abs(T[1]) < 0.05 && s > 6 && s < ln.length - 6;
      if (flat) {
        let R = nrm3(crs3(T, [0, 1, 0])); if (dot3(R, f.p) < 0) R = [-R[0], -R[1], -R[2]];
        const hw = f.w / 2, kk = f.w / 3;
        M.prism([[-0.5 * kk, -hw], [0.5 * kk, -hw], [0.5 * kk, hw + 1.5 * kk], [-0.5 * kk, hw + 1.5 * kk]], f.p, T, R, [0, 1, 0], 0.74, C.paper, [i, s, 2]);
        const nd = (i === ruled || isAlt) ? 0 : Math.round(6 * detail);
        for (let n = 0; n < nd; n++) dots.push({ p: add3(add3(add3(f.p, R, hw + 1.25), T, 1.3 * kk + n * 1.05), [0, 1, 0], 0.32), d: [0, 0, 1], run: 1, gate: 1 + 0.99 * n / nd, clock, n: [0, 1, 0] });
      }
      const base = dir > 0 ? sSt : ((ln.length - sSt) % D + D) % D, col = C.inks[inkOf[isAlt ? corr.line : i]];
      const keep = isAlt ? 0 : rng(), q1 = isAlt ? 0.2 : rng(), q2 = isAlt ? 0.5 : rng();
      if (keep < (tMul < 1 ? 0.9 * tMul : 0.9) && (i > 0 || (opts.ownTrains ?? standalone))) {
        trains.push({ line: i, start: base + m * D, lag: 0, rush: 0, color: col });
        if (i > 0 && q1 < 0.62 * detail * tMul) trains.push({ line: i, start: base + m * D - 31, lag: 0.45, rush: 1, color: col });
        if (i > 0 && q1 < 0.62 * detail * tMul && q2 < 0.42 * tMul) trains.push({ line: i, start: base + m * D - 62, lag: 0.9, rush: 1, color: col });
      }
    }
    await ctx.yield();
  }

  // ---- passengers streaming on the giant capsule (two counter-flowing pairs of files) and along every landing ----
  const gap = 4.6 / detail, inner = [-NE[0], 0, -NE[2]], capDot = opts.capsuleDot ?? 4.2;
  for (const [off, v] of [[-9.4, 7], [-3.6, 5.6], [3.6, -5.6], [9.4, -7]]) {
    const run = capLen - 28, p0 = add3(add3(add3(capO, UP, -run / 2), NET, off), inner, 0.72);
    for (let s = 0; s < run - 0.1; s += 1.6 * gap) dots.push({ p: p0, d: UP, run, phase: s + off * 0.37, speed: v, n: NE, size: capDot });
  }
  for (const L of landing) {
    const run = CAPD - L.d0 - 4;
    for (const [off, v] of [[-2.3, 3.4], [2.3, -3.4]]) for (const side of [1, -1]) {
      const p0 = add3(add3([NE[0] * (L.d0 + 2.5), L.y + side * 0.31, NE[2] * (L.d0 + 2.5)], NET, off), UP, 0);
      for (let s = 0; s < run - 0.1; s += gap) dots.push({ p: p0, d: NE, run, phase: s + off, speed: v, n: UP, size: 2 });
    }
    // and a file each way on the two faces of its keel, which is the side of a landing we mostly see
    for (const side of [1, -1]) {
      const p0 = add3([NE[0] * (L.d0 + 3), L.y - 4.2, NE[2] * (L.d0 + 3)], NET, side * 0.31);
      for (let s = 0; s < run - 1.1; s += 1.25 * gap) dots.push({ p: p0, d: NE, run: run - 1, phase: s + side, speed: 3.8 * side, n: [NET[0] * side, 0, NET[2] * side], size: 2.5 });
    }
  }
  await ctx.yield();

  // ---- pins: where two lines cross in plan a level or two apart, a ringed white capsule on each and a keylined stem between ----
  const S5 = lines.map((l) => { const o = []; for (let s = 0; s <= l.length; s += 4) { const f = lineAt(l, s); o.push([f.p[0], f.p[1], f.p[2], Math.abs(f.t[1]) < 0.02 ? 1 : 0]); } return o; });
  const cand = [];
  for (let i = 0; i < S5.length; i++) for (let k = i + 1; k < S5.length; k++) for (const p of S5[i]) { if (!p[3] || i === ruled || k === ruled) continue; for (const q of S5[k]) {
    if (!q[3] || Math.hypot(p[0] - q[0], p[2] - q[2]) > 2.1) continue;
    const dy = Math.abs(p[1] - q[1]), d = p[0] * NE[0] + p[2] * NE[2], lo = p[1] < q[1] ? p : q, hi = p[1] < q[1] ? q : p;
    if (dy < 20 || dy > 50 || Math.hypot(p[0], p[2]) > RIM - 12 || (d > 60 && Math.abs(p[0] * NET[0] + p[2] * NET[2]) < 16)) continue;
    let ok = (lo !== S5[0].find((y) => y === lo));           // never a stem rising from our own line
    for (const y of S5[0]) if (Math.hypot(y[0] - p[0], y[2] - p[2]) < 10 && y[1] + 9 > lo[1] && y[1] - 3 < hi[1] && !(i === 0 && hi === p) ) ok = false;
    if (ok) cand.push({ x: (p[0] + q[0]) / 2, z: (p[2] + q[2]) / 2, y0: lo[1], y1: hi[1] });
  } await ctx.yield(); }
  rng.shuffle(cand); const pins = [];
  const disc = (r, n = 20) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
  for (const c of cand) {
    if (pins.length >= 9 || pins.some((p) => Math.hypot(p.x - c.x, p.z - c.z) < 34)) continue;
    pins.push(c);
    for (const y of [c.y0, c.y1]) { const o = [c.x, y - 0.9, c.z];
      M.prism(disc(2.6), o, [1, 0, 0], [0, 0, 1], UP, 0.5, C.paper); M.band(disc(3.5), disc(2.6), o, [1, 0, 0], [0, 0, 1], UP, 0.56, C.key); }
    const mid = [c.x, (c.y0 + c.y1) / 2 - 0.9, c.z], h = (c.y1 - c.y0) / 2 - 0.3, rect = (w) => [[-h, -w], [h, -w], [h, w], [-h, w]];
    for (const ey of [[1, 0, 0], [0, 0, 1]]) { const ez = ey[0] ? [0, 0, 1] : [1, 0, 0];
      M.prism(rect(0.7), mid, UP, ey, ez, 0.3, C.paper); M.band(rect(1.1), rect(0.7), mid, UP, ey, ez, 0.34, C.key);
      for (const sd of [1, -1]) for (let s2 = 0; s2 < 2 * h - 2; s2 += 3 / detail)
        dots.push({ p: add3(add3(mid, UP, -h + 1), ez, sd * 0.19), d: UP, run: 2 * h - 2, phase: s2, speed: sd * (ey[0] ? 3.6 : -3.6), n: ez, size: 1.7 }); }
  }
  await ctx.yield();

  // ---- meshes: four draw calls (five with the standalone dome) ----
  await ctx.yield();
  const mesh = new THREE.Mesh(await M.geometryYield(ctx), style.flatMaterial()); mesh.frustumCulled = false; root.add(mesh);
  await ctx.yield();
  const track = await makeTrackYield(allLines, info, ctx);
  await ctx.yield();
  const trainMesh = new THREE.Mesh(setTrains(trainGeometry(16, 4.7, 0.56), trains), style.trainMaterial(track)); trainMesh.frustumCulled = false; root.add(trainMesh);
  await ctx.yield();
  const dotMesh = new THREE.Mesh(dotGeometry(dots), style.dotMaterial()); dotMesh.frustumCulled = false; root.add(dotMesh);
  let dome = null;
  if (standalone) { dome = new THREE.Mesh(new THREE.SphereGeometry(900, 16, 8), style.domeMaterial()); dome.renderOrder = -1; dome.frustumCulled = false; root.add(dome); }
  await ctx.yield();

  // ---- the ruled line's drawn length follows setProgress(u) once the world calls it, else a slow loop ----
  let progress = -1;
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const ruleAt = (time) => {
    if (ruled < 0 || corr) return;
    const L = lines[ruled].length, from = STUB + 10;
    let f;
    if (progress >= 0) f = ease((progress - 0.3) / 0.5);
    else { const c = (time % 40) / 40; f = c < 0.7 ? c / 0.7 : c < 0.88 ? 1 : 1 - ease((c - 0.88) / 0.12); }
    style.setDrawn(ruled, f >= 1 ? 1e6 : from + (L + 4 - from) * f);
  };

  // ---- anchors (local space = the brief's world space minus the well centre (230, 0, 600)) ----
  const fly = []; { const ln = lines[0]; for (let s = STUB * 0.5; s < ln.length; s += 10) { const p = lineAt(ln, s).p; fly.push([p[0], p[1] + 2.4, p[2]]); } fly.push([TERM[0], TERM[1], TERM[2]]); }
  const ends = lines.map((ln, i) => { const a = lineAt(ln, 0), b = lineAt(ln, ln.length), r = routes[i];
    return { ink: inkOf[i], hex: style.inksHex[inkOf[i]], wellLevel: r.level, suburbLevel: r.sub, apothem: r.a, length: ln.length, in: { p: a.p, dir: a.t }, out: r.spur ? null : { p: b.p, dir: b.t } }; });
  const anchors = {
    portalSeat: { position: TERM.slice(), normal: [0, 0, 1], radius: 7 },
    flyThrough: fly, rampTop: [-100, ourY + 2.4, -(KRIM - 100)], rampFoot: [-100, -69.6, -(KRIM - 100) + ourY + 72],
    wellCenter: [0, -24, 0], rim: RIM, floorY: FLOOR, capsule: { position: capO.slice(), normal: inner, length: capLen, width: CAPW },
    lineEnds: ends, ruledLine: ruled, pins: pins.map((p) => [p.x, (p.y0 + p.y1) / 2, p.z]),
    viewpoints: { overRim: [-100, 62, -215], braid: [-100, -66, -20], hollow: [20, -66, 40] },
  };

  const _m = new THREE.Vector3();
  return {
    object: root, radius: 85, height: capTop - FLOOR, center: new THREE.Vector3(0, -30, 0), extent: RIM + STUB + 20,
    anchors, style, lines, routes, track, correction: corr, inkOf, ground: false, groundY: 0, clashes: lay.bad,
    stats: { trains: trains.length, dots: dots.length, pins: pins.length, triangles: (M.idx.length / 3 + trains.length * 288 + dots.length * 10) | 0 },
    // u = the world's path progress 0..1: the rush wave reaches the well as the camera tips over the ramp, and the ruled line completes
    setProgress(u) { progress = clamp(u, 0, 1); style.uniforms.uRush.value = 0.25 + 0.75 * ease((progress - 0.22) / 0.24); },
    setRush(x) { style.uniforms.uRush.value = clamp(x, 0, 1); },
    setRule(line, fraction) { style.setDrawn(line, fraction >= 1 ? 1e6 : lines[line].length * fraction); },
    update(dt, time, camera) {
      style.update(time, ctx.renderer);
      ruleAt(time);
      if (dome && camera) { root.updateWorldMatrix(true, false); _m.setFromMatrixPosition(camera.matrixWorld); dome.position.copy(root.worldToLocal(_m)); }
    },
    dispose() { style.dispose(); track.texture.dispose(); },
  };
}
