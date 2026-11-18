// THE ROLLER: hero set piece of "The Country of Pins".
//
// An engraved ball 260 m across rolls unseen under a field of sliding steel pins. All you ever see
// is the relief the pins raise over it: a dome 257 m wide and 110 m high with near-sheer feet, a 70 m
// embossed belt (lozenges, discs, ferns) that turns over the crown, a late-sinking ragged comb at the
// back, 400 m of settling wake ripples, and 600 amber marbles pouring down both flanks into the wake.
//
// STYLE (how it is done, so the world can match it): nothing is diffuse. One closed-form height
// H(field xz, secondsAgo) and one hex lattice (pitch 0.8 m) with a per-pin hash (rise delay, fall
// delay, jitter) feed two tiers that share the same GLSL (exported as hero.glsl):
//   near : real instanced pins (domed chamfered hex head, 3-sided shaft) in a lattice-snapped window
//          that follows the camera; heads stay level and only slide vertically.
//   far  : one displaced polar grid; its fragment shader finds the lattice cell, computes THAT pin's
//          height and draws the staircase analytically (tread = level mirror head, riser = shaft
//          stripes over ink), melting to the average by 2 px a cell.
// Every head is a mirror of the analytic sky(dir) (exported in hero.glsl.sky) times an anodised
// ramp(height) with a contour every 5 m; glints are sun reflections; gaps go to ink.
//
// SIZE   dome radius 128.5 m, crown at y 110 (113 on the belt), wake to z -530; hero.radius 150, height 113.
//        Local space: datum y 0, ball centre (0,-20,0), it rolls toward +Z (front), wake trails to -Z.
// COST   ~145k triangles, 4 draw calls (far grid 54k + comb base 13k, 2,850 real pins x 28, 600 marble
//        impostors), +1 call with opts.skyDome. Build ~160 ms. No lights, one 1024x128 R8 texture.
// OPTS   palette (7 hex: teal, violet, rose-gold, pale gold, steel, cream, ink), detail 0.6-1 (thins real
//        pins only), nearPins (default 2850; the world may raise it toward 12000), speed (9 m/s),
//        sunDir (Vector3, local, toward the sun), sunSide (+1/-1 when sunDir is not given), shelfDir
//        ({x,z} azimuth of the slate night shelf), ripple (0.5 m), wake (ripple height, ~1.5 m),
//        marbles (600), amber, plainRadius (3200: the far grid is also the plain to the horizon),
//        skyDome (false; true adds a dome drawn with the same sky function), debugView.
// DRIVE  Stand-alone, update(dt, time, camera) keeps the ball at the origin and streams the lattice under
//        it. In a world call hero.setRoller(x, z, rollRadians, vx, vz) each frame from the path's u (ball
//        centre in hero-local metres, roll += distance / 130, velocity so pins can be stepped back in
//        time): the lattice is then fixed in the world and the dome, comb, wake and marbles follow the
//        ball. Nothing else is keyed to wall-clock but ambient ripples and marble loops. heightAt(x, z)
//        is a CPU upper bound of the pin tops for clearance checks.
// ANCHORS (local, ball at origin heading +Z)
//        crown, ballCentre; flyThrough: 15 points, a rising traverse up the leading flank with the slope
//        to port, over the crown, down the back and along the wake, >= 9 m off the ball surface (6 m off
//        the embossed pins); portalSeat {position, normal}: end of the wake, facing +Z;
//        viewpoints {entry, flank, crown, wake} as {position, lookAt}; wake {start, end, width};
//        sunDir, shelfDir: the directions the piece was lit for (give the sky the same).
// LIGHT  Needs no scene lights: every surface mirrors the analytic sky in hero.glsl.sky (apricot high sky,
//        cream zenith, gold sun bloom, slate shelf opposite the sun) under a low sun (14 degrees). The
//        Roller's own shadow is analytic. Fog is supported but the style wants none. Bloom: glints,
//        hairlines and marble highlights reach 2-4; heads stay under ~0.8.
// EXPORTS hero.glsl {uniforms, lattice, height, sky, steel} and hero.uniforms: reuse them for the trench,
//        Henge, creatures and sky so every tier shares one height, one hash and one sky.
// WORLD  (added by the world builder) The same height now also carries the world's cast and fixed works, all
//        off by default and switched on through hero.uniforms: rays (uCr slots), a breaching pod (uPod), a herd
//        of runners (uHerd), an eel (uEel), far wandering backs (uFarOn), the trench (uTr), a second "moon"
//        ball and its looping wake (uMoon), weather (uWx: rain dimples, swell), sky colours (cSkyLo/Hi/Sun,
//        uHorz), ramp luminance and contour colour (uRampLum, uCont). opts.patch adds a fine camera-following
//        grid so the cast displaces the mid-field; hero.addStatic(geometry) draws a world-fixed mesh as pins
//        (the trench); hero.addFixedPins([{x, z, lift, chase, phase}]) stands real pins above the field (the
//        Henge columns, the portal collar). opts.belt: 0 ferns/discs/lozenges, 1 stars and crescents, 2 key-fret.
// FAR FIELD (fix round) Past the melt the far shader keeps a world-anchored grain of separate mirrors (cells double
//        with distance per axis, never under ~1.7 px), slow sun sparks on the sunward side, Fresnel-untinted grazing
//        heads and riser stripes instead of a smooth under-surface; the trench mesh steps back behind its wall pins.
// FIX ROUND 2 The far tier's slope is read at the mesh's own moment on the leading side (it used to be 0.6 s old, so the
//        foot of the front was shaded as level ground: the weave round the Roller's foot). Melted risers are world-anchored
//        vertical pipes (meridians on the Roller, a lattice axis elsewhere, never under 4 px, no cell in height) with sparse
//        glints; melted heads are a stipple in a frame turned to the view heading, with ripple-crest and wake-crest bands.
//        The belt emboss has its own short clock (gEmbBack) and its pins take the palest finish (gInlay), so motifs stay
//        crisp and read as an inlay. The ball's grid is unstaggered (flat panels). uGl carries per-look glint/line/band
//        settings. Real pins leave the window one by one over its last 9 m. Ripple crests now lie across the heading.
// FIX ROUND 3 Pin-art legibility and a light direction. The cast is read on a short clock (gFineCap) and stepped into 1.3 m
//        terraces, rise delays are 0.05-0.13 s, and the late ragged sinking starts 50 m behind the crown; the belt emboss is
//        two clean levels (1.65 m, 3 m) with a darker ground and paler tops (gBelt, gBeltF) and a coarser fern.
//        reliefShadow() throws long pin shadows (three samples of the driving shape toward the sun); shadows and shaft faces
//        turned from the sun fall to cShade; uFin.x gives shafts the ramp colour of a higher level (bare metal under patina).
//        The far grain is sized from the exact view heading (no dashes), fades at the horizon and from above, crest bands are
//        whole lines. Marbles are a ball lens (hero.glsl.glass); uEsc marbles spill amber caustics on the real heads;
//        standing pins take an extra height scaled by uTall; uPodB.z scales the pod.
// FIX ROUND 4 Pins to the horizon: past the melt every far head is a round, soft-edged dot in a view-turned, world-anchored
//        cell (gDot / stipple: staggered rows, dark between, 3.4 px near the real pins down to 2.3 px far out), with sparks in
//        the same cells; the averaged far head mirrors only a dome's share of the pre-dawn horizon line (gHz), so there is no
//        step in brightness where the real pins end. Shade has a floor (uFin.y) and shaded shafts a cool edge (uFin.z); the
//        shaded far walls are ruled with pipes like the lit ones. Rays are kites in clean levels (rim, body, travelling
//        wing-tips, tail ridge), runners are loaves 26 m apart, uLev adds two leviathans, uTrP is the trench's profile.
import * as THREE from 'three';

const R_BALL = 130, SINK = 20, PITCH = 0.8, BELT_W = 70;
const DEF_PALETTE = ['#12464F', '#6B4E9B', '#E8A07C', '#F6E2A6', '#C9CED6', '#FBE9D7', '#101820'];

// ---------- belt relief: 1024 x 128 8-bit height map, u = once round the ball, v = across the belt ----------
function sdLozenge(x, y, hx, hy) { return (Math.abs(x) / hx + Math.abs(y) / hy - 1) * Math.min(hx, hy) * 0.7; }
function sdFern(x, y, len, dirSign) {
  // midrib along x in [-len/2, len/2]; 24 paired leaflets raked toward the tip, shrinking to the tip
  const t = (x * dirSign) / len + 0.5; if (t < -0.05 || t > 1.05) return 9;
  const rib = Math.abs(y) - (1.15 - 0.5 * t);
  const n = 10, ft = t * n, k = Math.floor(ft), fr = ft - k - 0.5;
  const env = 6.2 * Math.sin(Math.min(1, Math.max(0, t)) * Math.PI * 0.86 + 0.25) * (1 - 0.35 * t);
  const ay = Math.abs(y);
  // leaflet axis leans tipward: along-axis offset grows with |y|
  const lean = fr * (len / n) - ay * 0.45;
  const leaf = Math.max(Math.abs(lean) - 0.62 * (1 - ay / Math.max(env, 0.1)) - 0.3, ay - env);
  return Math.min(rib, k >= 0 && k < n ? leaf : 9);
}
function sdStar(x, y, R) { const a = Math.atan2(y, x), r = Math.hypot(x, y); return r - R * (0.4 + 0.6 * Math.pow(Math.abs(Math.cos(2.5 * a)), 2.4)); }
function sdCrescent(x, y, R) { return Math.max(Math.hypot(x, y) - R, R * 0.82 - Math.hypot(x - R * 0.45, y)); }
const FRET = [[0, -1], [0, 1], [0.76, 1], [0.76, -0.42], [0.3, -0.42], [0.3, 0.36], [0.52, 0.36]];
function sdFret(x, y, P, hy) {   // one key-fret meander: a base line and a squared spiral in every cell of length P
  const u = ((x % P) + P) % P; let d = Math.abs(y + hy) ;
  for (let i = 0; i < FRET.length - 1; i++) {
    const ax = FRET[i][0] * P, ay = FRET[i][1] * hy, bx = FRET[i + 1][0] * P, by = FRET[i + 1][1] * hy;
    const ex = bx - ax, ey = by - ay, t = Math.min(1, Math.max(0, ((u - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
    d = Math.min(d, Math.hypot(u - ax - ex * t, y - ay - ey * t));
  }
  return d - 2.3;
}
async function buildBeltTexture(rng, style = 0, pause = null) {
  const W = 1024, Hh = 128, circ = 2 * Math.PI * R_BALL, data = new Uint8Array(W * Hh);
  const cells = 16, cellLen = circ / cells, layout = rng.int(0, 2), flip = [];
  for (let i = 0; i < cells; i++) flip.push(rng.chance(0.5) ? 1 : -1);
  const soft = (d, w) => { const t = Math.min(1, Math.max(0, 0.5 - d / w)); return t * t * (3 - 2 * t); };
  for (let j = 0; j < Hh; j++) {
    if (pause) await pause();
    const y = ((j + 0.5) / Hh - 0.5) * BELT_W;
    for (let i = 0; i < W; i++) {
      if (pause && (i & 255) === 255) await pause();
      const xm = ((i + 0.5) / W) * circ, ci = Math.floor(xm / cellLen) % cells, x = xm - (ci + 0.5) * cellLen;
      let v = 0;
      // edge rails with transverse ribs (the "ribbed stripe" seen from far)
      const ay = Math.abs(y), rail = Math.abs(ay - 31.5) - 1.6;
      v = Math.max(v, soft(rail, 1.6) * 0.8);
      const ribx = Math.abs(((xm / (cellLen / 12)) % 1) - 0.5) * (cellLen / 12);
      v = Math.max(v, soft(Math.max(ribx - 0.9, Math.abs(ay - 26.5) - 2.6), 1.4) * 0.62);
      if (style === 2) { v = Math.max(v, soft(sdFret(xm, y, cellLen / 2, 19), 1.3)); data[j * W + i] = Math.round(Math.min(1, v) * 255); continue; }
      if (style === 1) {   // stars and crescents
        v = Math.max(v, soft(sdStar(x + cellLen * 0.22, y, 9.5), 1.2));
        v = Math.max(v, soft(sdCrescent(x - cellLen * 0.26, y, 7.5) * flip[ci] > -90 ? sdCrescent((x - cellLen * 0.26) * flip[ci], y, 7.5) : 9, 1.2));
        for (let sgn = -1; sgn <= 1; sgn += 2) {
          const yy = y - sgn * 17.5, lx = ((x + sgn * cellLen * 0.125 + cellLen * 2) % (cellLen / 2)) - cellLen / 4;
          v = Math.max(v, soft(sdStar(lx, yy, 5.2), 1.0) * 0.95);
          const bx = ((x + sgn * cellLen * 0.125 + cellLen * 2.25) % (cellLen / 2)) - cellLen / 4;
          v = Math.max(v, soft(sdCrescent(bx * sgn, yy, 3.6), 0.9) * 0.85);
        }
        data[j * W + i] = Math.round(Math.min(1, v) * 255); continue;
      }
      // centre row: a fern, then a disc with a sunk centre
      const fx = x + cellLen * 0.19;
      v = Math.max(v, soft(sdFern(fx, y, 30, flip[ci]), 1.1));
      const dx = x - cellLen * 0.31, dr = Math.hypot(dx, y);
      const disc = layout === 1 ? sdLozenge(dx, y, 7, 5.2) : dr - 4.5;
      v = Math.max(v, soft(disc, 1.3) * (1 - 0.75 * soft(dr - 1.9, 1.2)));
      // side rows: lozenges 14 m long, staggered, with small discs between
      for (let s = -1; s <= 1; s += 2) {
        const yy = y - s * 17.5, st = layout === 2 ? 0 : s * cellLen * 0.125;
        const lx = ((x + st + cellLen * 2) % (cellLen / 2)) - cellLen / 4;
        v = Math.max(v, soft(sdLozenge(lx, yy, 7, 3.6), 1.2) * (1 - 0.5 * soft(sdLozenge(lx, yy, 3.4, 1.5), 0.9)));
        const bx = ((x + st + cellLen * 2.25) % (cellLen / 2)) - cellLen / 4;
        v = Math.max(v, soft(Math.hypot(bx, yy) - 2.3, 1.1) * 0.85);
      }
      data[j * W + i] = Math.round(Math.min(1, v) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RedFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ---------- shared GLSL: lattice, hash, height field, sky, steel ----------
const GLSL_UNIFORMS = /* glsl */`
uniform vec2 uBall, uShift, uHeadg, uVel;   // ball centre (local xz), lattice shift, unit heading, velocity
uniform float uRoll, uOmega, uTime, uRip, uWakeAmp;
uniform sampler2D uBelt;
uniform vec3 uSun; uniform vec2 uShelf;
uniform vec3 cTeal, cViolet, cRose, cGold, cSteel, cCream, cInk, cSlate, cHaze;
uniform vec3 uCamL; uniform vec3 uWin;      // camera (local), near-pin window (centre xz in field coords, radius)
// --- the world's cast and fixed works, all written into the same height (see fineH / trenchH) ---
uniform vec4 uCr[9];                        // rays: x, z, heading (radians from +Z toward +X), strength 0..1
uniform float uCrOn, uEelA, uTrOn, uFarOn;
uniform vec4 uPod, uPodB;                   // pod: x0, z0, heading, seconds since the first breach | count, spacing
uniform vec4 uHerd, uHerdB;                 // runners: origin x, z, heading, front s | strength, length, lanes, bend
uniform vec4 uEel;                          // eel: origin x, z, heading, head s
uniform vec4 uTr;                           // trench: start x, z, unit direction x, z
uniform vec3 uTrP;                          // trench profile: metres of descent, where the ramp starts, metres of ramp
uniform vec4 uLev[2];                       // leviathans, long terraced backs beside the wake: x, z, heading, strength
uniform vec4 uMoon;                         // second ball: orbit angle, orbit radius, angular speed, strength
uniform vec3 uWx;                           // weather: rain, swell (m), unused
uniform vec4 uPatch;                        // camera patch: centre x, z, radius, on
uniform vec3 cSkyLo, cSkyHi, cSkySun;       // the sky's own colours (default: rose-gold, cream, pale gold of the finish)
uniform vec2 uRampLum;                     // luminance of the anodised ramp at the datum and at the crown
uniform vec4 uHorz, uCont;                  // a bright horizon line (rgb, strength) | contour colour (rgb, 0 = dark line .. 1 = lit line)
uniform vec4 cShade;                        // the colour shaded sides and shadows fall to (rgb), strength (a)
uniform vec4 uEsc[4];                       // escort marbles: centre xyz, radius (0 = away); they spill an amber caustic on the heads
uniform vec4 uFin;                          // finish: shafts take the ramp colour of at least this height (bare metal under patinated heads) | luminance floor of shaded sides | cool edge light on shaded shafts | paler finish of the cast's raised backs
uniform float uTall;                        // standing pins: how much of their extra height is up (the Henge lowers its pipes as we arrive)
uniform vec4 uGl;                           // per look: broad sun lobe on domed heads | spark reach 0..1 | gold line across each head | far crest bands
`;
const GLSL_LATTICE = /* glsl */`
#define PITCH ${PITCH.toFixed(3)}
#define ROW (PITCH*0.8660254)
float hash1(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 pinCell(vec2 f){
  float z = f.y / ROW, x = f.x / PITCH - 0.5 * z, y = -x - z;
  float rx = floor(x + 0.5), ry = floor(y + 0.5), rz = floor(z + 0.5);
  float dx = abs(rx - x), dy = abs(ry - y), dz = abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
  return vec2(rx, rz);
}
vec2 pinPos(vec2 c){ return vec2(PITCH * (c.x + 0.5 * c.y), ROW * c.y); }
`;
const GLSL_HEIGHT = /* glsl */`
#define RBALL ${R_BALL.toFixed(1)}
#define SINK ${SINK.toFixed(1)}
#define BELTW ${BELT_W.toFixed(1)}
float gHa = 0.0;    // set by pinHeight: this pin's height on its rise delay
float gRip = 1.0;   // far tier fades the small ripples out of its slope maths before they alias
float gFine = 1.0;  // 0 where a coarse mesh must not be displaced by the small cast (its fragments still draw them)
float gTrench = 1.0;
float gWk = 1.0;    // the far tier fades the long wake ripples later than the short ones
float gWake = 0.0;  // set by fieldH: 1 on a wake crest, 0 in a hollow or outside the wake
float gEmbA = 0.0;  // set by pinHeight: how far this pin stands proud in a belt motif (0..3 m)
float gEmb = 0.0;   // set by fieldH: the belt emboss at that moment
float gEmbBack = 0.085;   // seconds ago at which the belt emboss is read (its own short clock; pinHeight jitters it per pin)
float gFineCap = 0.3;   // the cast (rays, runners, pod, eel) is never read further back than this: its trailing fringe stays two pins deep
float gBelt = 0.0;  // set by fieldH: 1 inside the belt band on the dome (0 off it)
float gBeltA = 0.0; // set by pinHeight
float gEmbOn = 1.0; // 0: fieldH leaves the emboss out (pinHeight adds it on the short delay, so motif edges stay crisp)
float sm01(float x){ x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
float hashF(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// the unseen cast: rays (slots), a breaching pod, a herd of runners, an eel. Backs only, in pins.
float fineH(vec2 f, float back0, float t0){
  float back = min(back0, gFineCap), t = t0 + back0 - back;
  float h = 0.0;
  if (uCrOn > 0.5) {
    for (int i = 0; i < 9; i++) {
      vec4 c = uCr[i];
      if (c.w < 0.01) continue;
      vec2 hd = vec2(sin(c.z), cos(c.z));
      vec2 q = f - (c.xy - hd * (33.0 * back));
      if (dot(q, q) > 1100.0) continue;
      float a = dot(q, hd), l = abs(q.x * hd.y - q.y * hd.x);
      // a kite in clean levels: a crisp rim one terrace high, the body a second terrace, swept wings whose tips stand a
      // terrace higher and travel in and out, a straight tail ridge two pins wide
      float ak = a + 0.3 * l;
      float k = 1.0 - l / 15.0 - (ak > 0.0 ? ak / 10.5 : -ak / 12.0);
      float rim = smoothstep(0.0, 0.07, k), mid = smoothstep(0.40, 0.47, k);
      float tl = 9.0 + 2.6 * sin(1.6 * t + float(i) * 1.7);
      float tip = smoothstep(0.0, 0.25, 1.0 - length(vec2(l - tl, (ak + 0.5) * 0.8)) / 3.0) * rim;
      float tail = smoothstep(0.0, 0.3, 1.0 - l / 1.1) * sm01((-ak - 9.5) / 2.0) * sm01((27.0 + ak) / 4.0);
      h += c.w * (1.45 * rim + 1.3 * mid + 1.3 * tip * (1.0 - mid) + 1.45 * tail * (1.0 - rim));
    }
  }
  if (uPod.w > -0.5) {
    vec2 hd = vec2(sin(uPod.z), cos(uPod.z)), q = f - uPod.xy;
    float a = dot(q, hd), l = q.x * hd.y - q.y * hd.x;
    float i = clamp(floor(a / uPodB.y + 0.5), 0.0, uPodB.x - 1.0);
    float tp = uPod.w - back - i * 0.62;
    float d = length(vec2(a - i * uPodB.y, l)) / (1.0 + uPodB.z);
    float up = sm01(tp / 0.5) * (1.0 - sm01((tp - 1.3) / 0.8));
    h += 7.4 * (1.0 + uPodB.z) * up * sqrt(max(1.0 - d * d / 72.0, 0.0));
    float ring = max(tp - 1.5, 0.0), rr = d - 8.0 * ring;
    h += 0.9 * sin(rr * 0.9) * sm01(1.0 - abs(rr) / 7.0) * exp(-ring * 0.4) * sm01(ring * 2.0);
  }
  if (uHerdB.x > 0.01) {
    vec2 hd = vec2(sin(uHerd.z), cos(uHerd.z)), q = f - uHerd.xy;
    float s = dot(q, hd), l = q.x * hd.y - q.y * hd.x;
    l -= uHerdB.w * sin(s * 0.011 + 0.6);
    float sr = (uHerd.w - 22.0 * back) - s;
    float LW = 14.0, CL = 26.0, lanes = uHerdB.z;   // loaves well apart: rows of datum heads show between one back and the next
    float env = sm01(sr / 6.0) * sm01((uHerdB.y - sr) / 6.0) * step(abs(l), lanes * LW * 0.5);
    if (env > 0.001) {
      float lf = l / LW + lanes * 0.5, li = floor(lf);
      float so = sr + hashF(vec2(li, 3.7)) * CL, ci = floor(so / CL);
      vec2 jit = vec2(hashF(vec2(ci, li)), hashF(vec2(li, ci) + 9.1)) - 0.5;
      float a = (fract(so / CL) - 0.5) * CL + jit.x * 6.0, b = (fract(lf) - 0.5) * LW + jit.y * 3.4;
      float body = sm01(1.25 * (1.0 - length(vec2(max(abs(a) - 3.3, 0.0), b)) / 2.7));
      float ph = t * 9.0 + (ci + li * 3.0) * 2.4;
      float pr = (a > 0.0 ? 1.0 : -1.0) * (b > 0.0 ? 1.0 : -1.0);
      float leg = sm01(1.0 - length(vec2(abs(a) - 3.0, abs(b) - 1.6)) / 1.5) * max(sin(ph) * pr, 0.0);
      h += uHerdB.x * env * (3.1 * body + 0.8 * leg);
    }
  }
  if (uEelA > 0.01) {
    vec2 hd = vec2(sin(uEel.z), cos(uEel.z)), q = f - uEel.xy;
    float s = dot(q, hd), l = q.x * hd.y - q.y * hd.x;
    float sr = (uEel.w - 14.0 * back) - s;
    float w = 10.0 * sin(s * 0.045 - 1.3 * t) * sm01(sr / 30.0);
    float thick = 6.0 * sm01(sr / 14.0) * (1.0 - 0.72 * sm01((sr - 40.0) / 140.0));
    float body = sm01(sr / 3.0) * sm01((180.0 - sr) / 20.0) * sm01(1.0 - abs(l - w) / max(thick, 0.5));
    h += uEelA * 3.6 * body * (0.82 + 0.18 * sin(sr * 0.8));
  }
  // leviathans: two long backs beside the wake, 11 m high, a dorsal ridge and a tapering tail, their flanks breathing
  for (int i = 0; i < 2; i++) {
    vec4 c = uLev[i];
    if (c.w < 0.01) continue;
    vec2 hd = vec2(sin(c.z), cos(c.z));
    vec2 q = f - (c.xy - hd * (3.0 * back));
    float a = dot(q, hd), l = q.x * hd.y - q.y * hd.x;
    if (abs(a) > 70.0 || abs(l) > 30.0) continue;
    float ta = a > 0.0 ? a / 44.0 : -a / 62.0;                          // blunt head, long tail
    float wd = 21.0 * sqrt(max(1.0 - ta * ta, 0.0)) + 0.01;
    float k = 1.0 - abs(l) / wd;
    float bodyL = sm01(k * 1.25) * (0.74 + 0.26 * sin(a * 0.21 - 1.1 * t + float(i) * 2.0) * sm01(abs(l) / 6.0));
    float ridge = sm01(1.0 - abs(l) / 2.6) * sm01(1.0 - abs(a + 6.0) / 30.0);
    h += c.w * (9.6 * bodyL + 2.6 * ridge) * step(0.0, k);
  }
  // far company: slow low backs wandering the plain, one to a 430 m cell, kept off the flight line
  float lane = smoothstep(120.0, 215.0, abs(f.x - uShift.x - 30.0));
  if (uFarOn > 0.5 && lane > 0.001) {
    vec2 gi = floor(f / 430.0);
    float ha = hashF(gi), hb = hashF(gi + 7.7);
    vec2 c = (gi + 0.5 + (vec2(ha, hb) - 0.5) * 0.42) * 430.0 + 46.0 * vec2(sin(t * 0.045 + ha * 6.28), cos(t * 0.037 + hb * 6.28));
    float d = length(f - c) / (44.0 + 30.0 * fract(ha * 9.1));
    h += lane * step(0.3, hb) * (5.5 + 5.0 * fract(hb * 5.3)) * sm01(1.0 - d) * (0.9 + 0.1 * sin(t * 0.7 + ha * 20.0));
  }
  // pin-art: backs are level terraces of heads, stepping up 1.3 m at a time, flat datum between them
  return mix(h, floor(h / 1.3 + 0.5) * 1.3, 0.88);
}
// the trench: 18 m wide, 22 m deep, 300 m long, its floor ramping up over the last 70 m; a slow ripple runs up it
float trenchH(vec2 f, float t){
  vec2 q = f - uTr.xy;
  float s = dot(q, uTr.zw), l = abs(q.x * uTr.w - q.y * uTr.z);
  float dep = 22.0 * sm01(s / uTrP.x) * (1.0 - sm01((s - uTrP.y) / uTrP.z));
  float wall = 1.0 - smoothstep(8.3, 12.7, l);   // five lattice rows bared down each wall
  return wall * (-dep + 0.55 * sin(0.21 * s - 1.4 * t) * sm01(dep / 6.0));
}
// height of the driving shape at field position f, 'back' seconds ago (closed form, no history)
float fieldH(vec2 f, float back){
  float t = uTime - back;
  float h = uRip * (0.5 + gRip * 0.5 * sin(0.698 * (f.y + 1.7 * sin(f.x * 0.021 + 1.3)) - 0.9 * t));
  h += gRip * uRip * 0.24 * sin(f.x * 0.19 + f.y * 0.05 + 0.6 * t);
  vec2 q = f - (uBall + uShift - uVel * back);
  float al = dot(q, uHeadg), la = dot(q, vec2(uHeadg.y, -uHeadg.x));
  float d2 = dot(q, q), sy = sqrt(max(RBALL * RBALL - d2, 0.0)), cap = max(sy - SINK, 0.0);
  vec2 qe = q - uVel * (back - gEmbBack);
  float ale = dot(qe, uHeadg), lae = dot(qe, vec2(uHeadg.y, -uHeadg.x));
  float ang = atan(ale, sqrt(max(RBALL * RBALL - dot(qe, qe), 0.0)) + 0.001);
  vec2 buv = vec2((ang - (uRoll - uOmega * gEmbBack)) / 6.2831853, lae / BELTW + 0.5);
  float emb = textureLod(uBelt, buv, 0.0).r;
  float band = 1.0 - smoothstep(BELTW * 0.5 - 1.5, BELTW * 0.5, abs(lae));
  float lev = 0.55 * smoothstep(0.26, 0.40, emb) + 0.45 * smoothstep(0.86, 0.96, emb);   // two terraces: 1.65 m and 3 m
  gBelt = band * smoothstep(0.0, 5.0, cap);
  gEmb = 3.0 * lev * gBelt;
  h += cap + gEmb * gEmbOn;
  // wake: field-fixed settling ripples left behind the ball
  float s = -al;
  float env = smoothstep(105.0, 165.0, s) * (1.0 - smoothstep(330.0, 540.0, s)) * (1.0 - smoothstep(42.0, 78.0, abs(la)));
  float fa = dot(f, uHeadg);
  float wk = cos(0.349 * fa + 0.7 * sin(la * 0.07)) * (0.62 + 0.38 * cos(s * 0.11 + 0.45 * t));
  h += uWakeAmp * env * (0.5 + gWk * 0.5 * wk);
  gWake = env * (0.5 + 0.5 * wk);
  // settling trough and rebound just behind the foot
  h -= 1.6 * smoothstep(RBALL - 2.0, RBALL + 8.0, sqrt(d2)) * (1.0 - smoothstep(RBALL + 8.0, RBALL + 34.0, sqrt(d2))) * smoothstep(0.0, 60.0, s) * (1.0 - smoothstep(60.0, 110.0, abs(la)));
  // weather: a long swell under everything
  h += uWx.y * sin(0.021 * f.x + 0.031 * f.y + 0.6 * sin(f.y * 0.008) - 0.55 * t);
  // rare: a second, 90 m ball circling the Roller like a moon, and its looping wake
  if (uMoon.w > 0.01) {
    float phi = uMoon.x - uMoon.z * min(back, 0.8);
    vec2 qm = q - uMoon.y * vec2(sin(phi), cos(phi));
    h += uMoon.w * max(sqrt(max(2025.0 - dot(qm, qm), 0.0)) - 9.0, 0.0);
    float r = sqrt(d2), ang = atan(q.x, (abs(q.x) + abs(q.y) < 1e-4) ? 1.0 : q.y);
    float dA = mod(phi - ang, 6.2831853), dr = r - uMoon.y;
    float e2 = (1.0 - smoothstep(16.0, 48.0, abs(dr))) * smoothstep(0.22, 0.5, dA) * (1.0 - smoothstep(2.4, 5.4, dA));
    h += uMoon.w * 1.5 * e2 * (0.5 + gWk * 0.5 * cos(0.405 * dr + 0.9 * t));
  }
  if (gFine > 0.001) h += gFine * fineH(f, back, t);
  if (gTrench > 0.5 && uTrOn > 0.5) h += trenchH(f, t);
  return h;
}
// long pin shadows: 1 where relief toward the sun stands above this point's line to the sun (three samples)
float reliefShadow(vec2 f, float back){
  float e0 = gEmb, w0 = gWake, b0 = gBelt;
  float h = fieldH(f, back) - 0.25;   // the driving shape against itself, not this pin's own lateness: clean terrace shadows
  float sl = max(length(uSun.xz), 1e-4); vec2 sh = uSun.xz / sl;
  float tn = max(uSun.y / sl, 0.17);   // a sun on the horizon still throws shadows no longer than six heights
  float s = smoothstep(0.0, 0.5, fieldH(f + sh * 2.0, back) - h - 2.0 * tn);
  s = max(s, smoothstep(0.0, 0.7, fieldH(f + sh * 6.0, back) - h - 6.0 * tn));
  s = max(s, smoothstep(0.0, 1.0, fieldH(f + sh * 15.0, back) - h - 15.0 * tn));
  gEmb = e0; gWake = w0; gBelt = b0;
  return s;
}
// the one pin height every tier reads: late by its own friction, fast up, slow down, small overshoot
float pinHeight(vec2 cell, out float hsh){
  vec2 f = pinPos(cell);
  float h1 = hash1(cell), h2 = hash1(cell + 17.31);
  hsh = h1;
  float a = mix(0.05, 0.13, h1), b = mix(0.5, 2.2, h2 * h2);
  // the late, ragged sinking belongs to the steep back: over the crown and for 50 m behind it pins follow promptly, so the
  // belt's terraces cross the top as level sheets
  b = mix(a + 0.12, b, smoothstep(52.0, 100.0, -dot(f - (uBall + uShift), uHeadg)));   // (a narrow spread of rise delays: terraces stay level sheets)
  gEmbBack = 0.06 + 0.05 * h1;
  gFineCap = a + 0.03 + 0.12 * h2 * h2;
  float Ha = fieldH(f, a); float eA = gEmb; gEmbA = eA; gBeltA = gBelt;
  gEmbOn = 0.0; float Hb = fieldH(f, b) + eA; float Hc = fieldH(f, a + 0.25); gEmbOn = 1.0;
  gEmbBack = 0.085; gFineCap = 0.3;
  gHa = Ha;
  float o = max(Ha, Hb) + clamp(0.5 * (Ha - eA - Hc), -0.5, 0.5) + (fract(h1 * 7.13) - 0.5) * 0.06;
  if (uWx.x > 0.01) {   // unseen rain: curtains of one-pin dimples drifting over the field
    float cur = sin(f.x * 0.045 + f.y * 0.021 - uTime * 0.5) * sin(f.y * 0.037 - f.x * 0.013 + uTime * 0.23);
    float cyc = uTime * 0.6 + h2 * 13.7, ph = fract(cyc);
    float hit = step(0.8, fract(h1 * 31.7 + floor(cyc) * 0.618));
    o -= uWx.x * 0.42 * smoothstep(0.3, 0.75, cur) * hit * sin(min(ph * 2.2, 1.0) * 3.14159);
  }
  return o;
}
// 1 in the Roller's analytic shadow (one ray-sphere test)
float rollerShadow(vec3 p){
  vec3 oc = p - vec3(uBall.x, -SINK, uBall.y);
  float b = dot(oc, uSun), dist = sqrt(max(dot(oc, oc) - b * b, 0.0));
  return (1.0 - smoothstep(RBALL - 9.0, RBALL + 4.0, dist)) * smoothstep(-28.0, 75.0, -b);
}
`;
const GLSL_SKY = /* glsl */`
// the one analytic sky every head mirrors (give the sky dome the same function)
float gCirrus = 1.0;
float gHz = 1.0;    // the far tier's averaged head mirrors only a dome's share of the horizon line
vec3 skyCol(vec3 d0){
  vec3 d = d0 / max(length(d0), 1e-4);
  float y = max(d.y, 0.0);
  vec3 c = mix(cSkyLo * 1.08, cSkyHi * 1.05, smoothstep(0.08, 0.85, y));
  c = mix(c, cSkyHi * 1.02, 0.35 * (1.0 - smoothstep(0.0, 0.10, y)));
  float sd = clamp(dot(d, uSun), 0.0, 1.0);
  float s2 = sd * sd, s8 = s2 * s2 * s2 * s2;
  c = mix(c, cSkySun * 1.25, 0.75 * s8 * s8);
  vec2 hz = d.xz / max(length(d.xz), 1e-4);
  float az = dot(hz, uShelf);
  float hump = smoothstep(0.45, 1.0, az);    // the shelf towers over the exit so the ring stands on slate; a broad swell, no narrow cone
  float top = 0.56 + 0.36 * hump;
  float m = smoothstep(0.05, 0.85, az) * (1.0 - smoothstep(top - 0.32 - 0.16 * hump, top, y));
  c = mix(c, mix(cSlate, cHaze, smoothstep(0.0, 0.46, y)), m * 0.92);
  c *= 1.0 + m * 0.11 * sin(y * 31.0 + 2.6 * hz.x + 1.3 * sin(hz.x * 5.0 + y * 4.0));   // the shelf is layered haze, not a flat wall
  // long thin cirrus bars lying across the course, rose on the sunward edge, cream bodies
  vec2 cp = d.xz / max(y, 0.16);
  float cw = cp.y * 5.2 + 1.5 * cp.x + 2.8 * sin(cp.x * 0.42 + 1.1) + 0.5 * sin(cp.x * 1.9 + cp.y * 0.7) + uTime * 0.02;
  float bar = sin(cw), brk = 0.5 + 0.5 * sin(cp.x * 0.85 + 2.3 * floor(cw / 6.2831853 + 0.25) + 0.8 + 0.6 * sin(cp.y * 0.9));
  float wisp = 0.62 + 0.38 * sin(cp.x * 6.3 + 2.4 * sin(cp.y * 2.1) + 3.0 * bar);
  float cm = wisp * smoothstep(0.84, 1.0, bar) * smoothstep(0.15, 0.27, y) * (1.0 - smoothstep(0.62, 0.9, y)) * smoothstep(0.3, 0.85, brk);
  float edge = smoothstep(0.84, 0.93, bar) * (1.0 - smoothstep(0.93, 1.0, bar));
  vec3 cir = mix(max(cSkyHi, cSkyLo) * 1.2 + 0.07, mix(cSkyLo, cSkySun, 0.35) * 1.3, edge * (0.45 + 0.55 * s2));
  c = mix(c, cir, gCirrus * cm * 0.5 * (1.0 - 0.45 * smoothstep(0.34, 0.7, y)));
  // pre-dawn: one bright line along the horizon, strongest under the sun
  c += uHorz.rgb * uHorz.a * gHz * exp(-y * mix(46.0, 17.0, s2)) * (0.22 + 0.78 * s2);
  return c;
}
`;
const GLSL_STEEL = /* glsl */`
float gInlay = 0.0; // 0..1: this pin stands proud in a belt motif and takes the palest finish of the ramp
float gBump = 1.0;
float gShade = 0.0; // 0..1: this pin stands in the shadow of relief toward the sun
float gBeltF = 0.0; // 0..1: this pin is on the belt (its ground level takes a darker finish, its terraces the palest)
vec3 shadeTint(vec3 col, float w){
  float l = dot(col, vec3(0.30, 0.59, 0.11));
  vec3 sn = cShade.rgb / max(dot(cShade.rgb, vec3(0.30, 0.59, 0.11)), 0.02);
  return mix(col, sn * max(l * 0.5, uFin.y), clamp(w, 0.0, 1.0) * cShade.a);   // shade falls to the shade colour at a floor, never to black
}  // far tier: 0 on sheer faces, where the bright finish of low relief would read as a pale skirt
vec3 anodise(float h){
  // hue from the ramp, luminance held near steel's 0.58 so heads stay mid-grey mirrors with coloured tints
  vec3 r = mix(cTeal, cViolet, smoothstep(0.3, 2.8, h));
  r = mix(r, cRose, smoothstep(20.0, 56.0, h));
  r = mix(r, cGold, smoothstep(58.0, 100.0, h));
  r = mix(r, cGold, 0.6 * gInlay);
  r = mix(r, cViolet, 0.45 * gBeltF * (1.0 - gInlay));   // the belt's ground: a darker finish under its pale terraces
  float lum = dot(r, vec3(0.30, 0.59, 0.11));
  r = min(r / max(lum, 0.03) * (mix(uRampLum.x, uRampLum.y, smoothstep(0.0, 105.0, h)) + 0.32 * gInlay - 0.4 * gBeltF * (1.0 - gInlay) + 0.46 * gBump * smoothstep(0.9, 2.6, h) * (1.0 - smoothstep(7.0, 14.0, h)) - 0.07 * (1.0 - smoothstep(-0.2, 0.6, h))), vec3(1.05));
  float cont = smoothstep(0.03, 0.10, abs(fract(h / 5.0 + 0.5) - 0.5));
  r = mix(r, mix(r * 0.45, uCont.rgb, uCont.a), (1.0 - cont) * smoothstep(1.6, 3.0, h));
  return mix(cSteel * 0.62, r, mix(0.5, 0.74, smoothstep(0.0, 12.0, h)));
}
// level mirror head: n is the dome/chamfer normal, V points from the eye to the surface
vec3 headShade(vec3 n, vec3 V, float h, float shadow, out float glint){
  vec3 r = reflect(V, n); r.y = abs(r.y);
  float fz = 1.0 - clamp(-V.y, 0.0, 1.0); float f2 = fz * fz; fz = f2 * f2 * fz;   // Fresnel: a grazing mirror shows the sky untinted
  vec3 col = skyCol(r) * mix(anodise(h), vec3(0.86), 0.84 * smoothstep(0.02, 0.9, fz));
  float sd = clamp(dot(r, uSun), 0.0, 1.0);
  float g = sd * sd; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g;   // ^512
  glint = 4.5 * g * g * (1.0 - shadow) * (1.0 - gShade);
  // noon: a wider lobe as well, so the sun's footprint is a patch of sparks on the rims below and ahead of the camera
  float gb = sd * sd; gb *= gb; gb *= gb; gb *= gb; gb *= gb; gb *= gb; gb *= gb; gb *= gb;   // ^256
  glint += uGl.x * gb * (1.0 - shadow) * (1.0 - gShade);
  // pre-dawn: one gold line across every head, the horizon mirrored in its far shoulder, brightest toward the sun
  vec2 vh = V.xz / max(length(V.xz), 1e-4), sh = uSun.xz / max(length(uSun.xz), 1e-4);
  float tl = dot(n.xz, vh) / max(n.y, 0.2);
  float line = 1.0 - smoothstep(0.02, 0.05, abs(tl - 0.13));
  col += uHorz.rgb * (uGl.z * line * (0.3 + 0.7 * smoothstep(-0.5, 0.7, dot(vh, sh))));
  col = shadeTint(col, gShade);
  return mix(col, cSlate * 0.4 + col * 0.45, shadow);
}
// bared shaft: a vertical mirror; nh is its horizontal face normal, depth = metres below its own head
vec3 shaftShade(vec3 nh, vec3 V, float h, float depth, float shadow, float spark){
  vec3 nn = nh / max(length(nh), 1e-4);
  vec3 r = reflect(V, nn); r.y = abs(r.y) + 0.26;   // shafts lean their mirror above the low haze
  vec3 rl = vec3(V.x, abs(V.y) + 0.16, V.z);          // the level reflection: what the heads here show
  vec3 dm = mix(rl, r, 0.72);
  dm.y = mix(0.42 * max(length(dm.xz), 0.3), dm.y, spark);
  gCirrus = spark;
  vec3 col = 0.72 * skyCol(dm) * mix(cSteel * 0.7, anodise(max(h, uFin.x)), 0.8);
  gCirrus = 1.0;
  vec2 rh = r.xz / max(length(r.xz), 1e-4), sh = uSun.xz / max(length(uSun.xz), 1e-4);
  float hd = clamp(dot(rh, sh), 0.0, 1.0); float hl = hd * hd; hl *= hl; hl *= hl; hl *= hl; hl *= hl; hl *= hl;  // ^64
  float lit = max(dot(nn.xz, sh), 0.0);   // a riser turned to the sun is a curtain of hairlines: their average when melted
  col += vec3(1.0, 0.8, 0.5) * mix(0.04 + 0.10 * sqrt(hl) + 0.05 * lit, 2.2 * hl * hl + 0.05 * lit, spark) * (1.0 - shadow) * (1.0 - gShade);
  float shW = max(gShade, 0.85 * (1.0 - smoothstep(-0.45, 0.15, dot(nn.xz, sh))));
  col = shadeTint(col, shW);
  // a dim cool edge of sky light tells one shaded shaft from the next
  float edge = 1.0 - abs(dot(nn.xz, V.xz / max(length(V.xz), 1e-4))); edge *= edge;
  col += cHaze * (uFin.z * edge * shW * spark);
  col = mix(col, cSlate * 0.35 + col * 0.42, shadow);
  return mix(col, cInk, smoothstep(0.4, 3.2, depth) * 0.86);
}
`;

// amber glass: a ball lens shows the world upside down (bright sky across its lower half, the dark field above), amber
// thickening to a deep red rim, one hard sun glint, a hot crescent of focused light on the side away from the sun
const GLSL_GLASS = /* glsl */`
vec3 glassBall(vec3 n, vec3 V, vec2 uv, vec3 right, vec3 up, vec3 amber, float shadow){
  float r2 = min(dot(uv, uv), 1.0), rimT = 1.0 - sqrt(max(1.0 - r2, 0.0));
  vec3 d = V - (right * uv.x + up * uv.y) * (1.25 + 0.5 * r2);
  d = d / max(length(d), 1e-4);
  vec3 sk = skyCol(vec3(d.x, abs(d.y), d.z));
  vec3 gnd = mix(cInk, sk, 0.42);
  vec3 seen = mix(gnd, sk * 1.15, smoothstep(-0.10, 0.03, d.y));
  seen += cSkyHi * 0.5 * exp(-d.y * d.y * 90.0);                      // the horizon itself: one pale line through the ball
  vec3 absorb = mix(amber * 1.3 + vec3(0.3, 0.14, 0.0), vec3(0.62, 0.13, 0.02), smoothstep(0.08, 0.9, rimT));
  vec3 col = seen * absorb * 1.2;
  float focus = max(dot(n, -uSun * vec3(1.0, -0.35, 1.0)), 0.0); focus *= focus; focus *= focus; focus *= focus;
  col += amber * vec3(1.9, 1.3, 0.6) * focus * smoothstep(0.15, 0.7, rimT) * (1.0 - shadow);
  vec3 rs = reflect(V, n); rs.y = abs(rs.y);
  col = mix(col, skyCol(rs), 0.04 + 0.5 * rimT * rimT * rimT);
  float sd = clamp(dot(rs, uSun), 0.0, 1.0); float g = sd * sd; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g;   // ^256
  col += vec3(1.0, 0.9, 0.7) * 5.0 * g * (1.0 - shadow);
  return mix(col, col * vec3(0.45, 0.5, 0.62), shadow * 0.7);
}
`;

// ---------- far tier: one displaced polar grid whose fragment shader draws every pin ----------
const FAR_VERT = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_LATTICE}
${GLSL_HEIGHT}
uniform float uLayer, uMode;   // uMode 0: the ball's own polar grid, 1: the camera patch, 2: a static world-fixed mesh
varying vec3 vP; varying float vLow, vDrop;
#include <fog_pars_vertex>
void main(){
  vec2 pl;
  if (uMode < 0.5) { pl = position.x * vec2(uHeadg.y, -uHeadg.x) + position.z * uHeadg + uBall; gFine = 1.0 - smoothstep(172.0, 215.0, length(position.xz)); gTrench = 0.0; }
  else if (uMode < 1.5) { pl = position.xz + uPatch.xy; gFine = 1.0 - smoothstep(uPatch.z * 0.72, uPatch.z * 0.94, length(position.xz)); gTrench = 0.0; }
  else { pl = position.xz; }
  vec2 f = pl + uShift;
  float hNow = fieldH(f, 0.06);
  float h = uMode > 0.5 ? hNow : (uLayer > 0.5 ? hNow - 0.25 : max(hNow, fieldH(f, 2.1)));
  float dW = length(f - uWin.xy);
  float low = uMode > 1.5 ? 1.0 - smoothstep(uWin.z - 7.0, uWin.z - 1.5, dW) : 1.0 - smoothstep(uWin.z - 15.0, uWin.z - 9.5, dW);
  vLow = low;
  vDrop = 2.6 * low + 0.4 * (1.0 - smoothstep(uWin.z - 2.0, uWin.z + 1.0, dW));   // under the thinning pins the ground stays a hand lower
  vP = vec3(pl.x, h - vDrop, pl.y);
  if (uMode > 1.5) {   // the trench mesh steps back behind the real pins of its walls, so their shafts stand free like organ pipes
    vec2 tq = pl - uTr.xy; float tl = tq.x * uTr.w - tq.y * uTr.z, ts = dot(tq, uTr.zw);
    float dep = sm01(ts / uTrP.x) * (1.0 - sm01((ts - uTrP.y) / uTrP.z));
    float push = (tl < 0.0 ? -1.0 : 1.0) * 4.6 * low * dep * smoothstep(7.4, 8.6, abs(tl)) * (1.0 - smoothstep(14.0, 20.0, abs(tl)));
    vP.xz += push * vec2(uTr.w, -uTr.z);
  }
  vec4 mvPosition = modelViewMatrix * vec4(vP, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FAR_FRAG = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_LATTICE}
${GLSL_HEIGHT}
${GLSL_SKY}
${GLSL_STEEL}
uniform float uLayer, uMode;
varying vec3 vP; varying float vLow, vDrop;
#include <fog_pars_fragment>
// FAR HEADS (fix round 4). Past the melt every head is still drawn: one round, soft-edged dot to a cell, dark between, in
// staggered rows like the lattice, in a world-anchored frame turned to one of 64 headings. Cells are sized per axis from the
// pixel's footprint across and along the view (never under uDotPx pixels), so at grazing angles a head stays a round dot
// instead of a dash. gDot (mask, hash) of one level; stipple() blends the four neighbouring levels and returns the dot value
// (average about 0.41) and, through spark, the slow sun sparks of the same cells (a tighter dot, eased over seconds).
vec2 gDot(vec2 q, vec2 s, vec2 sd, vec2 px, float r){
  vec2 u = q / s; float row = floor(u.y); u.x += 0.5 * mod(row, 2.0);
  vec2 c = floor(u), p = fract(u) - 0.5;
  float h = hash1(c + sd);
  p -= (vec2(h, fract(h * 57.31)) - 0.5) * 0.24;
  float w = clamp(max(px.x / s.x, px.y / s.y) * 0.75, 0.06, 0.3);
  return vec2(1.0 - smoothstep(r - w, r + w, length(p)), h);
}
float sparkle(float h, float pS){
  float tw = 0.5 + 0.5 * sin(uTime * (0.7 + 0.9 * fract(h * 13.0)) + h * 251.0);
  return smoothstep(1.0 - pS, 1.0 - 0.6 * pS, h) * tw * tw * tw;
}
float stipple(vec2 f, vec2 px, float k, float minPx, float pS, out float spark){
  k = mod(k, 64.0);
  float th = k * 0.09817477; vec2 ax = vec2(sin(th), cos(th)), ay = vec2(ax.y, -ax.x);
  vec2 q = vec2(dot(f, ay), dot(f, ax));
  vec2 lv = clamp(log2(px * minPx / vec2(PITCH, ROW)), 0.0, 11.0);
  vec2 l0 = floor(lv), lf = smoothstep(0.2, 0.8, lv - l0);
  vec2 s0 = vec2(PITCH, ROW) * exp2(l0), s1 = s0 * 2.0, sd = l0 * 17.0 + k * 5.3;
  vec2 a = gDot(q, s0, sd, px, 0.36), b = gDot(q, vec2(s1.x, s0.y), sd + vec2(17.0, 0.0), px, 0.36);
  vec2 c = gDot(q, vec2(s0.x, s1.y), sd + vec2(0.0, 17.0), px, 0.36), d = gDot(q, s1, sd + 17.0, px, 0.36);
  vec4 wt = vec4((1.0 - lf.x) * (1.0 - lf.y), lf.x * (1.0 - lf.y), (1.0 - lf.x) * lf.y, lf.x * lf.y);
  vec4 m = vec4(a.x, b.x, c.x, d.x);
  spark = dot(wt, m * m * vec4(sparkle(a.y, pS), sparkle(b.y, pS), sparkle(c.y, pS), sparkle(d.y, pS)));
  return dot(wt, m * (0.82 + 0.36 * vec4(a.y, b.y, c.y, d.y)));
}
// melted risers: world-anchored vertical pipes along one lattice axis, never narrower than 4 px and with no cell in
// height, so a steep face is ruled with shafts and can not break into blocks. returns (pipe mask, pipe hash, hairline)
vec3 pipes(float c, float p, float sd){
  float lv = clamp(log2(max(p, 1e-4) * 4.0 / PITCH), 0.0, 12.0), l0 = floor(lv), lf = smoothstep(0.25, 0.75, lv - l0);
  float x0 = c / (PITCH * exp2(l0)), x1 = x0 * 0.5;
  float a0 = abs(fract(x0) - 0.5), a1 = abs(fract(x1) - 0.5);
  float h0 = hash1(vec2(floor(x0), l0 * 7.0 + sd)), h1 = hash1(vec2(floor(x1), l0 * 7.0 + 7.0 + sd));
  float m = mix(1.0 - smoothstep(0.14, 0.46, a0), 1.0 - smoothstep(0.14, 0.46, a1), lf);
  float hl = mix((1.0 - smoothstep(0.0, 0.2, a0)) * step(0.5, h0), (1.0 - smoothstep(0.0, 0.2, a1)) * step(0.5, h1), lf);
  return vec3(m, mix(h0, h1, lf), hl);
}
// crest bands: one octave of the combing ripples, shown while its period is between about 4 and 60 px
float crest(float ph, float lam, float fpy, float t){
  float ppx = lam / max(fpy, 1e-4);
  float c = 0.5 + 0.5 * sin(6.2831853 * ph / lam - t);
  c *= c; c *= c * (0.4 + 0.6 * c);
  return c * smoothstep(5.0, 12.0, ppx) * (1.0 - smoothstep(40.0, 90.0, ppx));
}
void main(){
  vec3 Vd = vP - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  vec2 f = vP.xz + uShift;
  // who draws where: the ball's grid within 172 m of it, the static trench mesh in its rectangle, the camera patch elsewhere
  float dB = length(vP.xz - uBall);
  vec2 tq = vP.xz - uTr.xy; float ts = dot(tq, uTr.zw), tl = abs(tq.x * uTr.w - tq.y * uTr.z);
  bool inT = uTrOn > 0.5 && ts > -12.0 && ts < uTrP.y + uTrP.z + 43.0 && tl < 34.0;
  bool inP = uPatch.w > 0.5 && length(vP.xz - uPatch.xy) < uPatch.z - 4.0;
  if (uMode < 0.5) { if (uLayer < 0.5 && dB > 172.0 && (inP || inT)) discard; }
  else if (dB < 170.0 || (uMode < 1.5 && inT)) discard;
  vec2 dfx = dFdx(f), dfy = dFdy(f);
  vec2 fpx = max(abs(dfx) + abs(dfy), vec2(1e-4));   // metres of field a pixel covers, per axis
  float fw = max(fpx.x, fpx.y) / PITCH;
  gRip = 1.0;
  float fwy = fwidth(vP.y);
  vec2 cell = pinCell(f), dl = f - pinPos(cell);
  float hsh; float hc = pinHeight(cell, hsh); float embP = gEmbA; gBeltF = gBeltA;
  gShade = reliefShadow(pinPos(cell), 0.12);
  // top layer: a pin that has already sunk is a hole (the ragged comb); base layer: only the sunk ones
  float hN = gHa, hL = (uMode > 0.5 || dB > 176.0) ? hN : fieldH(pinPos(cell), 2.1), envC = max(hN, hL);
  float up = hc - hN;
  if (uLayer < 0.5) { if (envC - hc > 1.2 && hL > hN + 1.2) discard; } else { if (up > 1.2 && envC - hc <= 1.2) hc -= up; }
  float standing = uLayer > 0.5 ? smoothstep(1.0, 1.6, hc - hN) : 0.0;   // base layer: this pin's top is above us, so what shows here is its shaft
  // analytic slope of the driving surface, and the envelope the tall pins stand at
  gRip = 1.0 - smoothstep(1.2, 4.0, fw * PITCH); gWk = 1.0 - smoothstep(3.0, 9.0, fw * PITCH);
  // (on the leading side the slope is read at the mesh's own moment: 0.6 s ago the foot of the front was still flat
  // ground, and a sheer wall shaded as level heads is the weave that used to hang round the Roller's foot)
  float tG = mix(0.6, 0.06, smoothstep(-12.0, 12.0, dot(vP.xz - uBall, uHeadg)));
  float G0 = fieldH(f, tG);
  vec2 grad = vec2(fieldH(f + vec2(0.4, 0.0), tG) - G0, fieldH(f + vec2(0.0, 0.4), tG) - G0) / 0.4;
  float slope = min(length(grad), 30.0);
  vec2 nh = -grad / max(length(grad), 1e-4);            // downhill: the way the risers face
  if (slope < 0.02) nh = vec2(0.0, 1.0);
  float env = uLayer > 0.5 ? G0 : max(G0, hL);
  float sunk = max(env - hc, 0.0);
  // staircase projection: how much of each step is level tread, how much bared riser
  float vy = max(-V.y, 0.0), vh = max(-dot(V.xz, nh), 0.0) + 0.5 * abs(V.x * nh.y - V.z * nh.x);
  float rise = slope * PITCH;
  float headFrac = clamp((vy + 0.015) / (vy + slope * vh + 0.015), 0.0, 1.0) * (1.0 - standing);
  float shadow = rollerShadow(vec3(vP.x, hc, vP.z));
  // --- the average a cell melts to by 2 px: no shimmer, same energy. Its colour comes from the smooth surface
  // height, so the 5 m contour rings stay clean lines where single pins can no longer be told apart ---
  float hAvg = mix(mix(hc, env, 0.5), max(vP.y + vDrop, G0), 0.9);
  gBump = 1.0 - 0.8 * smoothstep(1.6, 4.0, slope);
  gInlay = clamp(gEmb / 2.4, 0.0, 1.0);
  gHz = mix(0.22, 1.0, smoothstep(50.0, 700.0, length(Vd)));
  float gA; vec3 headA = headShade(vec3(0.0, 1.0, 0.0), V, hAvg, shadow, gA);
  float gB; headA = mix(headA, headShade(normalize(vec3(-V.x * 0.26, 1.0, -V.z * 0.26)), V, hAvg, shadow, gB), 0.3);
  // near the real pins the average also carries what their chamfered rims show (the high sky, the sky abeam), so the
  // hand-over has no step in brightness; with distance the heads read as level mirrors of the low sky
  float chamW = 0.3 * (1.0 - smoothstep(30.0, 260.0, length(Vd)));
  if (chamW > 0.01) {
    vec2 vhz = V.xz / max(length(V.xz), 1e-4); float gC;
    vec3 ch = headShade(normalize(vec3(-vhz.x * 1.1, 1.0, -vhz.y * 1.1)), V, hAvg, shadow, gC);
    ch += headShade(normalize(vec3(-vhz.y * 1.1, 1.0, vhz.x * 1.1)), V, hAvg, shadow, gC);
    ch += headShade(normalize(vec3(vhz.y * 1.1, 1.0, -vhz.x * 1.1)), V, hAvg, shadow, gC);
    headA = mix(headA, ch / 3.0, chamW);
  }
  gHz = 1.0;
  vec3 rl = reflect(V, vec3(0.0, 1.0, 0.0));
  float rs = clamp(dot(rl, uSun), 0.0, 1.0);
  float lobe = rs * rs; lobe *= lobe; lobe *= lobe; lobe *= lobe;
  headA += vec3(1.0, 0.84, 0.56) * (0.55 * lobe * lobe + 0.10 * lobe) * (1.0 - shadow);
  // --- past the melt the plain is still a field of separate mirrors: a world-anchored stipple of small round cells
  // (see stipple), some of them gaps, slow sparks where a dome mirrors the sun, and the ripple crests as light bands ---
  float azv = atan(V.x, (abs(V.x) + abs(V.z) < 1e-5) ? 1.0 : V.z) / 0.09817477, k0 = floor(azv), kw = smoothstep(0.3, 0.7, azv - k0);
  // (cells are sized from the footprint across and along the exact view heading, not the quantised frame's: a frame a
  // few degrees off then shears its cells a little instead of stretching them into dashes)
  vec2 vhx = V.xz / max(length(V.xz), 1e-4), vpx = vec2(vhx.y, -vhx.x);
  vec2 pxS = max(vec2(abs(dot(dfx, vpx)) + abs(dot(dfy, vpx)), abs(dot(dfx, vhx)) + abs(dot(dfy, vhx))), vec2(1e-4));
  float wide = lobe > 0.0 ? sqrt(sqrt(lobe)) : 0.0; wide = wide * sqrt(wide);       // (r.sun)^6: where domes can find the sun
  wide = mix(wide, smoothstep(0.3, 0.72, rs), uGl.y);                              // a high sun reaches further: its footprint
  float pS = 0.004 + 0.34 * wide;
  // heads get finer with distance: 3.4 px cells just outside the real pins, 2.3 px and fainter far out (an even grain)
  float farness = smoothstep(40.0, 520.0, length(Vd));
  float minPx = mix(3.4, 2.3, farness);
  float spA, spB; float gvA = stipple(f, pxS, k0, minPx, pS, spA), gvB = stipple(f, pxS, k0 + 1.0, minPx, pS, spB);
  float gv = mix(gvA, gvB, kw), spk = mix(spA, spB, kw);
  float far1 = 1.0 - smoothstep(7.0, 9.5, log2(max(fpx.x, fpx.y) * 1.7 / PITCH));   // the last cells before the horizon melt away
  float tallW = max(smoothstep(0.3, 1.0, slope), smoothstep(4.0, 12.0, hAvg));       // the Roller and other tall relief: finer, gentler
  // the grain lives in the middle distance: at the horizon (cells would smear into dashes) and looking steeply down from
  // the crown it melts into a satin, and just outside the real pins it is as strong as they are
  float nearW = 1.0 - smoothstep(0.0, 70.0, length(f - uWin.xy) - uWin.z);
  float gAmp = far1 * smoothstep(0.004, 0.03, vy) * (1.0 - 0.55 * smoothstep(0.2, 0.6, vy)) * (1.0 - 0.45 * tallW) * mix(1.0, 0.5, farness);
  float cph = f.y + 1.7 * sin(f.x * 0.021 + 1.3), tb = 0.9 * uTime;
  float bands = crest(cph, 9.0, fpx.y, tb) + crest(cph + 3.0, 36.0, fpx.y, tb * 0.5) + crest(cph + 40.0, 144.0, fpx.y, tb * 0.25) + crest(cph + 110.0, 576.0, fpx.y, tb * 0.12);
  bands = min(bands, 1.2) * uGl.w * (1.0 - tallW) * 0.6 * (1.0 - 0.75 * smoothstep(0.08, 0.3, vy));   // whole thin lines: broken by the grain they read as dashes
  // melted risers: vertical pipes with ink between, ruled along the lattice axis that lies across the face
  vec3 shA = shaftShade(vec3(nh.x, 0.0, nh.y), V, hAvg, 1.6, shadow, 0.0);
  vec2 sunH = uSun.xz / max(length(uSun.xz), 1e-4); float litA = max(dot(nh, sunH), 0.0);
  // (on the Roller the pipes are its meridians, so they stand upright on the dome from every side and never weave)
  float sxw = smoothstep(0.44, 0.56, nh.x * nh.x);
  vec2 qb = vP.xz - uBall;
  float cM = atan(qb.y, (abs(qb.x) + abs(qb.y) < 1e-4) ? 1.0 : qb.x) * 128.0;
  float pM = 128.0 * (abs(qb.x * dfx.y - qb.y * dfx.x) + abs(qb.x * dfy.y - qb.y * dfy.x)) / max(dot(qb, qb), 1.0);
  float ballW = 1.0 - smoothstep(129.0, 137.0, dB);
  vec3 pp = mix(mix(pipes(f.x, fpx.x, 11.0), pipes(f.y, fpx.y, 3.0), sxw), pipes(cM, pM, 5.0), ballW);
  // full contrast on sheer feet and walls, a faint ruling on the staircase of a flank, and none once a pipe would be many pins wide
  float lvP = log2(max(mix(mix(fpx.x, fpx.y, sxw), pM, ballW), 1e-4) * 4.0 / PITCH);
  float sheer = smoothstep(3.0, 6.0, slope);     // a true wall (the trench) keeps its pipes however far it runs
  float pFar = 1.0 - smoothstep(mix(1.2, 9.5, sheer), mix(3.2, 12.0, sheer), lvP);
  float pAmp = smoothstep(0.3, 1.0, slope) * mix(0.34, 0.9, smoothstep(1.4, 5.5, slope)) * pFar;
  vec3 shG = mix(shA * 0.72, mix(mix(cInk, shA, 0.16), shA * (0.8 + 0.5 * pp.y), pp.x), pAmp);
  if (uMode > 1.5) shG *= mix(1.0, 0.86, sheer);   // far trench walls: a little deeper, like the real pipes they continue
  // shaded walls are ruled with pipes too: each one the shade colour at its floor, every other one with a dim cool edge
  float shadedW = (1.0 - smoothstep(-0.45, 0.15, dot(nh, sunH))) * pAmp;
  vec3 snF = cShade.rgb / max(dot(cShade.rgb, vec3(0.30, 0.59, 0.11)), 0.02);
  shG += (snF * (uFin.y * 1.5 * pp.x * (0.5 + pp.y)) + cHaze * (uFin.z * 1.5 * pp.z)) * shadedW * (1.0 - 0.6 * shadow);
  // the sheet of small glints: pipes turned so that they throw the sun at us; it sweeps the flank as we move
  vec3 rS = reflect(V, vec3(nh.x, 0.0, nh.y));
  float sweep = litA * smoothstep(0.1, 0.9, dot(rS.xz / max(length(rS.xz), 1e-4), sunH));
  float ycell = 1.6 * exp2(ceil(clamp(log2(max(fwy, 1e-4) * 3.0 / 1.6), 0.0, 8.0)));
  float seg = hash1(vec2(floor(vP.y / ycell), floor(pp.y * 64.0)));
  float tws = 0.5 + 0.5 * sin(uTime * (0.8 + seg) + seg * 190.0);
  float dotY = 1.0 - smoothstep(0.12, 0.45, abs(fract(vP.y / ycell) - 0.5));
  float pG = smoothstep(0.3, 1.0, slope) * pFar;
  shG += vec3(1.0, 0.82, 0.55) * (pAmp * pp.z * 0.22 * litA * litA + pG * pp.z * dotY * 3.0 * step(1.0 - 0.14 * sweep, seg) * tws * tws + 0.05 * litA * litA) * (1.0 - shadow);
  shG = mix(mix(cInk, shG, 0.62), shG, smoothstep(0.25, 2.2, rise));    // a low riser is mostly the gap beside its shaft
  // each dot a head (bright), the dark between them gaps and the shafts of the next row; the average stays the melted colour
  vec3 hdG = mix(cInk, headA, 0.88) * mix(1.0, 0.46 + 1.32 * gv, gAmp);
  float wkB = gWake * gWake * (1.0 - smoothstep(0.3, 1.0, slope));
  hdG *= (1.0 + 0.5 * bands) * (1.0 + (0.8 + 0.7 * smoothstep(0.1, 0.4, vy)) * wkB * far1);
  hdG += vec3(1.0, 0.86, 0.6) * ((3.2 * spk * far1 * smoothstep(0.006, 0.03, vy) + 0.10 * bands * sqrt(wide)) * (1.0 - shadow) * (1.0 - gShade));
  vec3 avg = mix(shG, hdG, headFrac);
  float melt = smoothstep(0.25, 0.5, max(fw, fwy / max(rise + PITCH, PITCH) * 0.5));
  melt = max(melt, smoothstep(0.07, 0.19, fw) * (1.0 - headFrac) * smoothstep(0.3, 1.2, rise));   // steep risers melt sooner: their stripes moire first
  vec3 col = avg;
  if (melt < 0.995) {
    gInlay = clamp(embP / 2.4, 0.0, 1.0);
    float e = clamp(dot(dl, -nh) / PITCH, -0.5, 0.5) + (hsh - 0.5) * 0.25 * (1.0 - headFrac);   // + uphill
    float lat = dot(dl, vec2(-nh.y, nh.x));
    float split = 0.5 - headFrac;
    // tread: the level head, re-expanded to a full hexagon
    float te = (e - split) / max(headFrac, 0.02) - 0.5;
    vec2 hp = lat * vec2(-nh.y, nh.x) - nh * (te * PITCH);
    hp = mix(dl, hp, smoothstep(0.02, 0.2, slope));
    float hexd = max(abs(hp.x), abs(hp.x) * 0.5 + abs(hp.y) * 0.8660254);
    float rim = smoothstep(0.27, 0.36, hexd);
    vec3 n = normalize(vec3(hp.x * (0.55 + 1.7 * rim), 1.0, hp.y * (0.55 + 1.7 * rim)));
    float glint; vec3 head = headShade(n, V, hc, shadow, glint);
    head += vec3(1.0, 0.88, 0.62) * glint;
    float aa = clamp(fw * 1.2, 0.01, 0.2);
    vec3 tread = mix(head, cInk, smoothstep(0.37 - aa, 0.37 + aa, hexd));
    // riser: this pin's shaft with its hairline, the staggered row behind it, then the dark of deeper rows
    float rr = clamp((split - e) / max(1.0 - headFrac, 0.02), 0.0, 1.0);
    float depth = rr * min(rise, 1.2) * 0.5;
    float ang = (hsh - 0.5) * 1.0 + clamp(lat / 0.11, -1.0, 1.0) * 0.55, ca = cos(ang), sa = sin(ang);
    vec3 nf = vec3(nh.x * ca - nh.y * sa, 0.0, nh.x * sa + nh.y * ca);
    vec3 sh1 = shaftShade(nf, V, hc, depth, shadow, 1.0);
    vec3 sh2 = shaftShade(vec3(nf.z, 0.0, -nf.x) * 0.6 + vec3(nh.x, 0.0, nh.y) * 0.8, V, hc, depth + 0.9, shadow, 1.0);
    float m1 = 1.0 - smoothstep(0.11 - aa * 0.5, 0.11 + aa * 0.5, abs(lat));
    float m2 = 1.0 - smoothstep(0.10 - aa * 0.5, 0.10 + aa * 0.5, abs(abs(lat) - 0.4));
    vec3 sh3 = mix(shA, cInk, mix(0.35, 0.72, smoothstep(1.0, 5.0, rise)));
    vec3 riser = mix(mix(sh3, sh2, m2), sh1, m1);
    vec3 det = mix(riser, tread, step(split, e));
    // a pin that has sunk a little between tall neighbours is a dark slot
    det = mix(det, mix(cInk, sh3, 0.4), smoothstep(0.5, 2.5, sunk) * mix(0.2, 0.75, vy));
    col = mix(det, avg, melt);
  }
  // under the real pins: never a smooth surface, only the next rows of shafts going down into ink
  float latU = uMode > 1.5 ? dot(dl, uTr.zw) : dot(dl, vec2(-nh.y, nh.x));
  float stU = max(1.0 - smoothstep(0.08, 0.14, abs(latU)), 0.6 * (1.0 - smoothstep(0.07, 0.12, abs(abs(latU) - 0.4)))) * (1.0 - melt);
  col = mix(col, mix(cInk, shA, uMode > 1.5 ? 0.3 + 0.55 * stU : 0.07 + 0.14 * stU), vLow);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
async function buildFarGeometry(outer, pause = null) {
  const radii = [0];
  let r = 0;
  while (r < 100) { r += 4; radii.push(r); }
  while (r < 134) { r += 1.25; radii.push(r); }
  while (r < 180) { r += 3; radii.push(r); }
  while (r < 560) { r += 5; radii.push(r); }
  while (r < outer) { r *= 1.3; radii.push(r); }
  const segs = 208, nr = radii.length, pos = new Float32Array(nr * segs * 3), idx = [];
  for (let i = 0; i < nr; i++) for (let j = 0; j < segs; j++) {
    const a = (j / segs) * Math.PI * 2, o = (i * segs + j) * 3;
    pos[o] = Math.sin(a) * radii[i]; pos[o + 1] = 0; pos[o + 2] = Math.cos(a) * radii[i];
  }
  if (pause) await pause();
  for (let i = 0; i < nr - 1; i++) {
    if (pause && i % 6 === 5) await pause();
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs), c = (i + 1) * segs + j, d = (i + 1) * segs + ((j + 1) % segs);
      if (i === 0) { idx.push(a, c, d); continue; }
      idx.push(a, c, b, b, c, d);
    }
  }
  if (pause) await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const idxA = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i += 30000) { idxA.set(idx.slice(i, i + 30000), i); if (pause) await pause(); }
  g.setIndex(new THREE.BufferAttribute(idxA, 1));
  // base layer: the ground under the back comb only (out to 162 m, the rear 220 degrees)
  const bidx = [];
  for (let i = 1; i < nr - 1; i++) {
    if (pause && i % 8 === 7) await pause();
    if (radii[i + 1] > 162) continue;
    for (let j = Math.round(segs * 0.195); j < Math.round(segs * 0.805); j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs), c = (i + 1) * segs + j, d = (i + 1) * segs + ((j + 1) % segs);
      bidx.push(a, c, b, b, c, d);
    }
  }
  const gb = new THREE.BufferGeometry();
  gb.setAttribute('position', g.getAttribute('position'));
  gb.setIndex(new THREE.BufferAttribute(new Uint32Array(bidx), 1));
  if (pause) await pause();
  return { top: g, base: gb };
}

// ---------- near tier: real pins in a lattice-snapped window that follows the camera ----------
const PIN_VERT = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_LATTICE}
${GLSL_HEIGHT}
attribute float aKind;      // 0 head, 1 underside, 2 shaft top, 3 shaft foot
attribute vec2 aCell;       // per instance: offset coordinates inside the window
uniform vec2 uWinCell, uWinN;
#ifdef FIXED
attribute vec4 aLift;       // standing pins (columns, collar): height, chase amplitude, chase phase, extra height (times uTall)
#endif
varying vec3 vP, vN; varying float vKind, vH, vDepth, vShadow, vEmb, vShade, vBelt;
#include <fog_pars_vertex>
void main(){
  vec2 ij = aCell + floor((uWinCell - aCell) / uWinN + 0.5) * uWinN;
  vec2 cell = vec2(ij.x - floor(ij.y * 0.5 + 0.001), ij.y);
  vec2 fp = pinPos(cell);
  float hsh; float hc = pinHeight(cell, hsh);
  vEmb = gEmbA; vBelt = gBeltA;
  vShade = reliefShadow(fp, 0.12);
#ifdef FIXED
  vShade = 0.0;
  float lift = aLift.x + aLift.w * uTall + aLift.y * (0.5 + 0.5 * sin(uTime * 0.9 + aLift.z)), sc = 1.0;
  hc += lift;
#else
  float edge = uWin.z - 0.6 - 9.0 * fract(hsh * 23.7);
  float lift = 0.0, sc = 1.0 - smoothstep(edge - 1.6, edge, length(fp - uWin.xy));
#endif
  vec3 lp = position, ln = normal;
  if (aKind > 1.5) {
    float a = hsh * 6.2831853, c = cos(a), s = sin(a);
    lp.xz = vec2(lp.x * c - lp.z * s, lp.x * s + lp.z * c);
    ln.xz = vec2(ln.x * c - ln.z * s, ln.x * s + ln.z * c);
  }
  lp.xz *= sc;
  float y = hc + lp.y;
  if (aKind > 2.5) y = hc - 24.0 - lift;
  float G0 = fieldH(fp, 0.6);
  vec2 grad = vec2(fieldH(fp + vec2(0.4, 0.0), 0.6) - G0, fieldH(fp + vec2(0.0, 0.4), 0.6) - G0) / 0.4;
  float nb = min(hc, G0 + 0.2) - min(length(grad), 30.0) * PITCH * 1.5;
#ifdef FIXED
  nb = G0 + 0.2;
#endif
  vDepth = nb;
  vKind = aKind; vH = hc; vN = ln;
  vP = vec3(fp.x - uShift.x + lp.x, y, fp.y - uShift.y + lp.z);
  vShadow = rollerShadow(vec3(vP.x, hc, vP.z));
  vec4 mvPosition = modelViewMatrix * vec4(vP, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PIN_FRAG = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_SKY}
${GLSL_STEEL}
varying vec3 vP, vN; varying float vKind, vH, vDepth, vShadow, vEmb, vShade, vBelt;
#include <fog_pars_fragment>
void main(){
  vec3 Vd = vP - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 col;
  gInlay = clamp(vEmb / 2.4, 0.0, 1.0); gBeltF = vBelt; gShade = vShade;
  if (vKind < 0.5) {
    float glint; col = headShade(n, V, vH, vShadow, glint);
    col += vec3(1.0, 0.88, 0.62) * glint;
    // amber light focused through an escort marble: a hot spot spilled over the heads on the side away from the sun
    vec2 shz = uSun.xz / max(length(uSun.xz), 1e-4);
    for (int i = 0; i < 4; i++) {
      vec4 e = uEsc[i];
      vec2 dq = vP.xz - (e.xz - shz * (0.9 * e.w + 0.35 * max(e.y - vP.y, 0.0)));
      float fall = 1.0 - smoothstep(1.5, 13.0, e.y - vP.y);
      col += vec3(1.0, 0.56, 0.16) * (2.6 * fall * step(0.05, e.w) * exp(-dot(dq, dq) / max(1.6 * e.w * e.w + 0.6, 0.1)));
    }
  } else if (vKind < 1.5) {
    col = mix(cInk, cSteel * 0.6 * mix(cTeal, cSlate, 0.5) * 3.0, 0.35);
  } else {
    // far shafts melt toward their average: sub-pixel hairlines would only shimmer
    col = shaftShade(n, V, vH, max(vDepth - vP.y, 0.0) + 0.25, vShadow, 1.0 - 0.55 * smoothstep(20.0, 58.0, length(Vd)));
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function buildPinGeometry(count, rng) {
  const P = [], N = [], K = [], I = [];
  const v = (x, y, z, nx, ny, nz, k) => { const l = Math.hypot(nx, ny, nz) || 1; P.push(x, y, z); N.push(nx / l, ny / l, nz / l); K.push(k); return P.length / 3 - 1; };
  const rc = 0.37 / Math.cos(Math.PI / 6), ri = rc * 0.70;
  // domed top: centre, shoulder ring, then the chamfer down to the rim (split normals: crisp rim line)
  const c0 = v(0, 0, 0, 0, 1, 0, 0), inner = [], chamA = [], chamB = [], under = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6, cx = Math.cos(a), cz = Math.sin(a);
    inner.push(v(cx * ri, -0.022, cz * ri, cx * 0.22, 1, cz * 0.22, 0));
    chamA.push(v(cx * ri, -0.022, cz * ri, cx * 0.9, 1, cz * 0.9, 0));
    chamB.push(v(cx * rc, -0.095, cz * rc, cx * 1.5, 1, cz * 1.5, 0));
    under.push(v(cx * rc, -0.12, cz * rc, 0, -1, 0, 1));
  }
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    I.push(c0, inner[j], inner[i]);
    I.push(chamA[i], chamA[j], chamB[j], chamA[i], chamB[j], chamB[i]);
  }
  I.push(under[0], under[1], under[2], under[0], under[2], under[3], under[0], under[3], under[5], under[3], under[4], under[5]);
  // three-sided shaft, flat faces, stretched to its foot in the vertex shader
  const rs = 0.127;
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2, a1 = ((i + 1) / 3) * Math.PI * 2, am = (a0 + a1) / 2;
    const w = 0.55, n0x = Math.cos(am - w), n0z = Math.sin(am - w), n1x = Math.cos(am + w), n1z = Math.sin(am + w);
    const t0 = v(Math.cos(a0) * rs, -0.12, Math.sin(a0) * rs, n0x, 0, n0z, 2), t1 = v(Math.cos(a1) * rs, -0.12, Math.sin(a1) * rs, n1x, 0, n1z, 2);
    const b0 = v(Math.cos(a0) * rs, -1, Math.sin(a0) * rs, n0x, 0, n0z, 3), b1 = v(Math.cos(a1) * rs, -1, Math.sin(a1) * rs, n1x, 0, n1z, 3);
    I.push(t0, b0, t1, t1, b0, b1);
  }
  const side = Math.sqrt(count * PITCH * PITCH * 0.8660254);
  const nx = Math.max(8, Math.round(side / PITCH)), nz = Math.max(8, Math.round(side / (PITCH * 0.8660254) / 2) * 2);
  const cells = new Float32Array(nx * nz * 2);
  for (let j = 0, o = 0; j < nz; j++) for (let i = 0; i < nx; i++) { cells[o++] = i; cells[o++] = j; }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
  g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2));
  g.setIndex(I);
  g.instanceCount = nx * nz;
  return { geometry: g, nx, nz, radius: Math.min(nx * PITCH, nz * PITCH * 0.8660254) * 0.5, tris: (I.length / 3) * nx * nz };
}

// ---------- marbles: 600 amber glass spheres on closed-form paths (impostor spheres, one draw) ----------
const MARBLE_VERT = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_LATTICE}
${GLSL_HEIGHT}
attribute vec4 aSeed;
uniform float uCycle;
varying vec2 vUv; varying vec3 vC, vRight, vUp, vFwd; varying float vShadow, vFade;
#include <fog_pars_vertex>
void main(){
  float tl = fract(uTime / uCycle + aSeed.x) * uCycle;
  float Td = 15.0 + 7.0 * aSeed.y;
  float side = aSeed.z < 0.5 ? -1.0 : 1.0;
  float sf = fract(aSeed.z * 2.0); float strm = floor(sf * sqrt(sf) * 5.0);   // more of them pour down the streams beside the flight line
  float psi = side * (0.19 + strm * 0.52 + (aSeed.w - 0.5) * 0.14);   // five streams a side; the first runs down the belt beside the flight line
  vec2 perp = vec2(uHeadg.y, -uHeadg.x);
  vec2 dir = uHeadg * cos(psi) + perp * sin(psi);
  // stage 1: lifted out at the crown, pours down the flank, faster and bouncing higher as it goes
  float x = clamp(tl / Td, 0.0, 1.0);
  float rho = mix(3.0 + 9.0 * aSeed.w, RBALL - 0.5, x * x * (0.55 + 0.45 * x));
  vec2 pb = dir * rho + perp * sin(tl * 0.9 + aSeed.x * 40.0) * 1.2 * x;
  // stage 2: left behind in the field, it rolls into the nearest wake hollow and pools there
  float t2 = max(tl - Td, 0.0);
  vec2 left = dir * (RBALL - 0.5) - uVel * t2;
  vec2 F1 = left + uBall + uShift;
  float la = dot(left, perp), fa = dot(F1, uHeadg);
  float laP = side * (6.0 + 30.0 * aSeed.w * aSeed.w) + (fract(aSeed.x * 91.7) - 0.5) * 9.0;
  float nP = floor((0.349 * fa + 0.7 * sin(laP * 0.07) - 3.14159) / 12.56637 + 0.5);
  float faP = (12.56637 * nP + 3.14159 - 0.7 * sin(laP * 0.07)) / 0.349 + (fract(aSeed.y * 57.3) - 0.5) * 6.0;
  float settle = smoothstep(1.0, 9.0 + 5.0 * aSeed.y, t2);
  vec2 pooled = left + uHeadg * (faP - fa) * settle + perp * (laP - la) * settle;
  vec2 p = t2 > 0.0 ? pooled : pb;
  vec2 F = p + uBall + uShift;
  float h = fieldH(F, 0.3);
  float leap = (strm < 0.5 && side > 0.0 && fract(aSeed.y * 7.3) < 0.6) ? 1.9 : 1.0;   // the stream beside the flight line bounds up to our height
  float hopA = (0.4 + 3.4 * x * x) * leap * (1.0 - settle) * (t2 > 0.0 ? exp(-t2 * 0.6) : 1.0);
  float hop = abs(sin(tl * (2.2 + aSeed.y) + aSeed.x * 60.0)) * hopA;
  float life = smoothstep(0.0, 1.6, tl) * (1.0 - smoothstep(uCycle - 2.5, uCycle, tl));
  vec3 C = vec3(p.x + uBall.x, h + 0.6 + hop - (1.0 - life) * 2.4, p.y + uBall.y);
  vec4 mv = modelViewMatrix * vec4(C, 1.0);
  float rad = max(0.62 + 0.26 * (1.0 - settle), -mv.z * 0.0028);
  vUv = position.xy; vC = C; vFade = life;
  vRight = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
  vUp = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
  vFwd = vec3(modelViewMatrix[0][2], modelViewMatrix[1][2], modelViewMatrix[2][2]);
  vShadow = rollerShadow(C);
  vec4 mvPosition = mv + vec4(position.xy * rad, 0.0, 0.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MARBLE_FRAG = /* glsl */`
${GLSL_UNIFORMS}
${GLSL_SKY}
${GLSL_GLASS}
uniform vec3 cAmber;
varying vec2 vUv; varying vec3 vC, vRight, vUp, vFwd; varying float vShadow, vFade;
#include <fog_pars_fragment>
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0 || vFade < 0.02) discard;
  float nz = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vRight * vUv.x + vUp * vUv.y + vFwd * nz;
  n = n / max(length(n), 1e-4);
  vec3 Vd = vC - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  vec3 col = glassBall(n, V, vUv, vRight, vUp, cAmber, vShadow);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function buildMarbleGeometry(count, rng) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) seed[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  return g;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('roller') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const speed = opts.speed ?? 9;
  const dbg = opts.debugView ?? null;

  // per-seed variety: belt layout and fern directions, finish drift, wake height, marble count split, sun side
  const hueDrift = rng.range(-0.025, 0.025);
  pal.slice(0, 4).forEach((c) => c.offsetHSL(hueDrift, 0, 0));
  const sunAz = opts.sunDir ? 0 : rng.range(0.85, 1.25) * (opts.sunSide ?? 1);
  const sunEl = 14 * Math.PI / 180;
  const sun = opts.sunDir ? new THREE.Vector3().copy(opts.sunDir).normalize()
    : new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl));
  const shelf = opts.shelfDir ? new THREE.Vector2(opts.shelfDir.x, opts.shelfDir.z ?? opts.shelfDir.y).normalize()
    : new THREE.Vector2(-sun.x - 0.35, -sun.z - 0.75).normalize();
  const belt = await buildBeltTexture(rng, opts.belt ?? 0, ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();

  const U = {
    uBall: { value: new THREE.Vector2(0, 0) }, uShift: { value: new THREE.Vector2(0, 0) },
    uHeadg: { value: new THREE.Vector2(0, 1) }, uVel: { value: new THREE.Vector2(0, speed) },
    uRoll: { value: 0 }, uOmega: { value: speed / R_BALL }, uTime: { value: 0 },
    uRip: { value: opts.ripple ?? 0.5 }, uWakeAmp: { value: opts.wake ?? rng.range(1.3, 1.7) },
    uBelt: { value: belt }, uSun: { value: sun }, uShelf: { value: shelf },
    cTeal: { value: pal[0] }, cViolet: { value: pal[1] }, cRose: { value: pal[2] }, cGold: { value: pal[3] },
    cSteel: { value: pal[4] }, cCream: { value: pal[5] }, cInk: { value: pal[6] },
    cSlate: { value: new THREE.Color('#3E5266') }, cHaze: { value: new THREE.Color('#6F8196') },
    uCamL: { value: new THREE.Vector3(0, 60, 300) }, uWin: { value: new THREE.Vector3(0, 300, 20) },
    uCr: { value: Array.from({ length: 9 }, () => new THREE.Vector4()) }, uCrOn: { value: 0 }, uEelA: { value: 0 }, uTrOn: { value: 0 }, uFarOn: { value: 0 },
    uPod: { value: new THREE.Vector4(0, 0, 0, -1) }, uPodB: { value: new THREE.Vector4(7, 18, 0, 0) },
    uHerd: { value: new THREE.Vector4() }, uHerdB: { value: new THREE.Vector4(0, 150, 4, 16) }, uEel: { value: new THREE.Vector4() },
    uTr: { value: new THREE.Vector4(0, -1e5, 0, -1) }, uTrP: { value: new THREE.Vector3(70, 232, 68) }, uLev: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] }, uMoon: { value: new THREE.Vector4(0, 215, 0.1, 0) },
    cSkyLo: { value: new THREE.Color(opts.skyLo ?? pal[2]) }, cSkyHi: { value: new THREE.Color(opts.skyHi ?? pal[5]) },
    cSkySun: { value: new THREE.Color(opts.skySun ?? pal[3]) },
    uRampLum: { value: new THREE.Vector2(0.44, 0.86) }, uHorz: { value: new THREE.Vector4(1, 0.8, 0.5, 0) }, uCont: { value: new THREE.Vector4(0, 0, 0, 0) },
    uGl: { value: new THREE.Vector4(0, 0, 0, 1) }, uFin: { value: new THREE.Vector4(0, 0.03, 0.09, 0) }, uTall: { value: 1 },
    cShade: { value: new THREE.Vector4(0.02, 0.11, 0.13, 0.75) }, uEsc: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, -50, 0, 0)) },
    uWx: { value: new THREE.Vector3(0, 0, 0) }, uPatch: { value: new THREE.Vector4(0, 0, 240, 0) },
  };
  const mk = (vs, fs, extra = {}, defines = {}) => new THREE.ShaderMaterial({
    uniforms: { ...U, ...extra, ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) },
    vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, defines,
  });

  const object = new THREE.Group(); object.name = 'TheRoller';
  // far tier
  const farGeos = await buildFarGeometry(opts.plainRadius ?? 3200, ctx.yield ? () => ctx.yield() : null), farGeo = farGeos.top;
  const far = new THREE.Mesh(farGeo, mk(FAR_VERT, FAR_FRAG, { uLayer: { value: 0 }, uMode: { value: 0 } })); far.frustumCulled = false; object.add(far);
  await ctx.yield?.();
  const baseMat = mk(FAR_VERT, FAR_FRAG, { uLayer: { value: 1 }, uMode: { value: 0 } });
  baseMat.polygonOffset = true; baseMat.polygonOffsetFactor = 2; baseMat.polygonOffsetUnits = 4;
  const farBase = new THREE.Mesh(farGeos.base, baseMat); farBase.frustumCulled = false; object.add(farBase);
  await ctx.yield?.();
  // optional matching sky dome (opts.skyDome; on by default only inside the _part viewer, ?pinsky=0 hides it):
  // the same sky(dir) the heads mirror
  let skyDome = null;
  if (opts.skyDome ?? false) {
    skyDome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
      uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `${GLSL_UNIFORMS}${GLSL_SKY} varying vec3 vD; void main(){ vec3 d = vD / max(length(vD), 1e-3);
        vec3 c = skyCol(vec3(d.x, abs(d.y), d.z)); float sd = max(dot(d, uSun), 0.0);
        c += vec3(1.0, 0.86, 0.6) * 5.0 * smoothstep(0.99985, 0.99994, sd);
        gl_FragColor = vec4(c, 1.0); }`,
    }));
    skyDome.renderOrder = -0.5; skyDome.frustumCulled = false; object.add(skyDome);
  }
  await ctx.yield?.();
  // near tier
  const pinCount = Math.round((opts.nearPins ?? 2850) * detail);
  const pins = buildPinGeometry(pinCount, rng);
  const pinU = { uWinCell: { value: new THREE.Vector2() }, uWinN: { value: new THREE.Vector2(pins.nx, pins.nz) } };
  const pinMesh = new THREE.Mesh(pins.geometry, mk(PIN_VERT, PIN_FRAG, pinU)); pinMesh.frustumCulled = false; object.add(pinMesh);
  U.uWin.value.z = pins.radius - 0.5;
  await ctx.yield?.();
  // marbles (never thinned: the brief counts them)
  const marbleCount = opts.marbles ?? 600;
  const marbleU = { uCycle: { value: 72 }, cAmber: { value: new THREE.Color(opts.amber ?? '#F2A33C') } };
  await ctx.yield?.();
  const marbles = new THREE.Mesh(buildMarbleGeometry(marbleCount, rng), mk(MARBLE_VERT, MARBLE_FRAG, marbleU));
  marbles.frustumCulled = false; object.add(marbles);

  // ---- world helpers: every extra mesh draws with the same shaders, the same height and the same hash ----
  const ROWJ = PITCH * 0.8660254;
  let patch = null;
  await ctx.yield?.();
  if (opts.patch) {   // a fine polar grid that follows the camera, so the cast really displaces the mid-field
    const pr = [0]; let r = 0; const R = opts.patchRadius ?? 240, segs = 128;
    while (r < R) { r += Math.max(1.8, r * 0.042); pr.push(r); }
    const nr = pr.length, pos = new Float32Array(nr * segs * 3), idx = [];
    for (let i = 0; i < nr; i++) for (let j = 0; j < segs; j++) {
      const a = ((j + (i % 2) * 0.5) / segs) * Math.PI * 2, o = (i * segs + j) * 3;
      pos[o] = Math.sin(a) * pr[i]; pos[o + 1] = 0; pos[o + 2] = Math.cos(a) * pr[i];
    }
    for (let i = 0; i < nr - 1; i++) for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs), c = (i + 1) * segs + j, d = (i + 1) * segs + ((j + 1) % segs);
      if (i === 0) { idx.push(a, c, d); continue; }
      if (i % 2) idx.push(a, d, b, a, c, d); else idx.push(a, c, b, b, c, d);
    }
    await ctx.yield?.();
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    patch = new THREE.Mesh(pg, mk(FAR_VERT, FAR_FRAG, { uLayer: { value: 0 }, uMode: { value: 1 } }));
    patch.frustumCulled = false; object.add(patch);
    U.uPatch.value.set(0, 0, pr[nr - 1], 1);
    await ctx.yield?.();
  }
  // a world-fixed mesh (positions are local xz, y ignored) drawn as pins: the trench and the Henge floor
  function addStatic(geometry) {
    const m = new THREE.Mesh(geometry, mk(FAR_VERT, FAR_FRAG, { uLayer: { value: 0 }, uMode: { value: 2 } }));
    m.frustumCulled = false; object.add(m); return m;
  }
  // real pins that stand above the field at fixed lattice cells: [{ x, z, lift, chase, phase }]
  function addFixedPins(list) {
    const cells = new Float32Array(list.length * 2), lift = new Float32Array(list.length * 4), seen = new Set();
    let k = 0;
    for (const p of list) {
      const j = Math.round(p.z / ROWJ), cx = Math.round(p.x / PITCH - 0.5 * j), i = cx + Math.floor(j * 0.5 + 0.001), key = i + ',' + j;
      if (seen.has(key)) continue;
      seen.add(key);
      cells[k * 2] = i; cells[k * 2 + 1] = j; lift[k * 4] = p.lift; lift[k * 4 + 1] = p.chase || 0; lift[k * 4 + 2] = p.phase || 0; lift[k * 4 + 3] = p.extra || 0; k++;
    }
    const g = new THREE.InstancedBufferGeometry();
    for (const n of ['position', 'normal', 'aKind']) g.setAttribute(n, pins.geometry.getAttribute(n));
    g.setIndex(pins.geometry.getIndex());
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells.slice(0, k * 2), 2));
    g.setAttribute('aLift', new THREE.InstancedBufferAttribute(lift.slice(0, k * 4), 4));
    g.instanceCount = k;
    const m = new THREE.Mesh(g, mk(PIN_VERT, PIN_FRAG, { uWinCell: { value: new THREE.Vector2(0, 0) }, uWinN: { value: new THREE.Vector2(4e6, 4e6) } }, { FIXED: 1 }));
    m.frustumCulled = false; object.add(m); return m;
  }

  // ---- anchors (local space; in stand-alone mode the ball sits at the origin heading +Z) ----
  const C0 = new THREE.Vector3(0, -SINK, 0);
  const onShell = (azDeg, polarDeg, off) => { // a point 'off' metres outside the ball's surface
    const a = azDeg * Math.PI / 180, p = polarDeg * Math.PI / 180;
    return new THREE.Vector3(Math.sin(a) * Math.sin(p), Math.cos(p), Math.cos(a) * Math.sin(p)).multiplyScalar(R_BALL + off).add(C0);
  };
  const anchors = {
    crown: new THREE.Vector3(0, R_BALL - SINK + 3, 0),
    ballCentre: C0.clone(),
    // rising traverse up the leading (+Z) flank with the slope to port, over the crown, down the back, along the wake
    flyThrough: [
      new THREE.Vector3(96, 12, 300), new THREE.Vector3(104, 9, 215), new THREE.Vector3(110, 9, 150),
      onShell(52, 77, 9), onShell(44, 62, 9), onShell(34, 44, 9), onShell(22, 26, 9.5), onShell(0, 8, 10),
      onShell(180, 12, 10), onShell(180, 34, 11), onShell(180, 52, 14), new THREE.Vector3(0, 30, -150),
      new THREE.Vector3(0, 9, -215), new THREE.Vector3(0, 8, -330), new THREE.Vector3(0, 8, -480),
    ],
    portalSeat: { position: new THREE.Vector3(0, 9, -600), normal: new THREE.Vector3(0, 0, 1) },
    viewpoints: {
      entry: { position: new THREE.Vector3(135, 12, 520), lookAt: new THREE.Vector3(0, 70, 0) },
      flank: { position: onShell(48, 68, 9), lookAt: onShell(20, 50, 0) },
      crown: { position: onShell(0, 6, 10), lookAt: new THREE.Vector3(0, 60, -260) },
      wake: { position: new THREE.Vector3(0, 8, -260), lookAt: new THREE.Vector3(0, 2, -420) },
    },
    wake: { start: new THREE.Vector3(0, 0, -130), end: new THREE.Vector3(0, 0, -530), width: 150 },
    sunDir: sun.clone(), shelfDir: new THREE.Vector3(shelf.x, 0, shelf.y),
  };

  // ---- driving the Roller ----
  let manual = false;
  const camL = new THREE.Vector3(), fwd = new THREE.Vector3(), inv = new THREE.Matrix4();
  const ROW = PITCH * 0.8660254;
  // World use: call every frame from the path's u. (x, z) = ball centre in hero-local metres, roll in
  // radians (advance by distance / 130), (vx, vz) = its velocity in m/s so pins can be stepped back in time.
  function setRoller(x, z, roll, vx = 0, vz = speed) {
    manual = true;
    U.uBall.value.set(x, z); U.uShift.value.set(0, 0); U.uRoll.value = roll; U.uVel.value.set(vx, vz);
    const sp = Math.hypot(vx, vz);
    if (sp > 1e-3) U.uHeadg.value.set(vx / sp, vz / sp);
    U.uOmega.value = sp / R_BALL;
  }
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (!manual) { // stand-alone: the ball stays at the origin and the lattice streams under it instead
      U.uShift.value.set(0, speed * time); U.uRoll.value = (speed / R_BALL) * time;
    }
    if (!camera) return;
    object.updateWorldMatrix(true, false);
    inv.copy(object.matrixWorld).invert();
    camera.getWorldPosition(camL).applyMatrix4(inv);
    camera.getWorldDirection(fwd).transformDirection(inv);
    U.uCamL.value.copy(camL);
    if (skyDome) skyDome.position.copy(camL);
    const Rw = U.uWin.value.z, fl = Math.hypot(fwd.x, fwd.z);
    const lead = Rw * 0.62 * Math.min(1, fl * 1.4);
    const wx = camL.x + (fl > 1e-4 ? fwd.x / fl : 0) * lead + U.uShift.value.x;
    const wz = camL.z + (fl > 1e-4 ? fwd.z / fl : 1) * lead + U.uShift.value.y;
    U.uWin.value.x = wx; U.uWin.value.y = wz;
    if (patch) { U.uPatch.value.x = camL.x; U.uPatch.value.y = camL.z; }
    const j0 = Math.round(wz / ROW);
    pinU.uWinCell.value.set(Math.round(wx / PITCH - 0.5 * (((j0 % 2) + 2) % 2)), j0);
  }
  // CPU upper bound of the pin tops at a local point (for clearance checks along a camera path)
  function heightAt(x, z, ballX = U.uBall.value.x, ballZ = U.uBall.value.y) {
    const d2 = (x - ballX) ** 2 + (z - ballZ) ** 2;
    const cap = Math.max(0, Math.sqrt(Math.max(0, R_BALL * R_BALL - d2)) - SINK);
    return cap + (cap > 0 ? 3.2 : 0) + U.uRip.value * 1.3 + U.uWakeAmp.value + 1.2;
  }
  update(0, 0, null);

  // ---- what the viewer orbits (close-up debug views: ?pinview=flank|crown|wake|foot) ----
  let radius = 150, height = 113, center = new THREE.Vector3(0, 46, 0);
  if (dbg === 'flank') { radius = 9; height = 22; center = onShell(48, 70, 0); }
  else if (dbg === 'crown') { radius = 10; height = 16; center = new THREE.Vector3(0, 113, 0); }
  else if (dbg === 'wake') { radius = 14; height = 30; center = new THREE.Vector3(0, 2, -250); }
  else if (dbg === 'foot') { radius = 4; height = 14; center = new THREE.Vector3(150, 3, 60); }
  else if (dbg === 'mid') { radius = 30; height = 40; center = onShell(48, 70, 0); }
  else if (dbg === 'flank2') { radius = 9; height = 22; center = onShell(-60, 70, 0); }

  return {
    object, radius, height, center, anchors,
    update, setRoller, heightAt, addStatic, addFixedPins,
    setProgress(u) { /* nothing is keyed to u inside the piece: drive the ball with setRoller() */ },
    uniforms: U,
    glsl: { uniforms: GLSL_UNIFORMS, lattice: GLSL_LATTICE, height: GLSL_HEIGHT, sky: GLSL_SKY, steel: GLSL_STEEL, glass: GLSL_GLASS },
    stats: { pins: pins.geometry.instanceCount, pinTriangles: pins.tris, farTriangles: (farGeo.index.count + farGeos.base.index.count) / 3, marbles: marbleCount },
    dispose() {},
    ground: false, groundY: 0,
  };
}
