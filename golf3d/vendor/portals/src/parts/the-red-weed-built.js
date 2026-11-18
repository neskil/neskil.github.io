// THE RED WEED, what people built and left: the bridge and the cart on it, the mill and its wheel, the cottages, the
// inn, the church, the washing line, the skiff, and on the hill the rim of the cylinder in its pit.
// Everything is drawn by ONE material (stone, brick, tile, flint, wood, iron, cloth by a number per vertex), which
// also grows the weed up every wall as far as that wall says, and hangs the whole in this world's dusk and mist.
// Walls take the afterglow as a wide band of sky and the far fire as a second, red light; a window may hold a
// lamp left burning (KIND.lamp); a burnt house glows inside from its embers (a seed of 2 or more marks its walls).
//
//   makeBuiltMaterial(U, own)        the material (uniform uSick: how far the sickness has gone on the walls)
//   bridgeInto(acc, o)               -> { arches, half, hw, deckY(x), hangs, posts }
//   cartInto(acc, o), wheelInto(acc, o), skiffInto(acc), washingInto(acc, o, rng)
//   cottageInto(acc, o, rng), churchInto(acc, o), millInto(acc, o), cylinderInto(acc, o), trackInto(acc, o)
//   finish(acc, mirror)              -> BufferGeometry (mirror < 0 flips the whole in x)
// All of it is written in the unmirrored valley's metres, +X right, -Z up the valley, water at y = 0.
import * as THREE from 'three';
import { RW_GLSL, withShared, Acc, C, clamp, lerp, sstep, DEG } from './the-red-weed-common.js';

export const KIND = { stone: 0, brick: 1, tile: 2, flint: 3, wood: 4, iron: 5, cloth: 6, dark: 7, plaster: 8, pit: 9, lamp: 10, ember: 11, track: 12 };

const BUILT_VS = /* glsl */`
uniform float uTime;
attribute vec3 color; attribute vec4 aE;
varying vec3 vW, vP, vN, vCol; varying vec4 vE;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix)*normal);
  // washing on the line: it hangs from its top edge and stirs
  float sw = aE.z, ph = aE.w*40.0;
  wp.xyz += n*sw*(0.2*sin(uTime*1.2 + ph + wp.x*1.6) + 0.08*sin(uTime*2.7 + ph*2.0 + wp.y*3.0)) + vec3(0.0, 0.04, 0.0)*sw*sin(uTime*1.9 + ph);
  vW = wp.xyz; vP = position; vN = n; vCol = color; vE = aE;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const BUILT_FS = /* glsl */`
${RW_GLSL}
uniform vec2 uSick;           // the sickness on the walls: bias, and how much it gains with height (per metre)
uniform float uGreen;         // the pit's breath
varying vec3 vW, vP, vN, vCol; varying vec4 vE;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 vv = cameraPosition - vW; float dist = length(vv); vec3 v = vv/max(dist, 1e-3);
  float k = floor(vE.x + 0.5), seed = fract(vE.w), burnt = step(1.5, vE.w)*step(k, 8.5);
  vec3 an = abs(n);
  vec2 q = an.y > 0.78 ? vP.xz : (an.x > an.z ? vec2(vP.z, vP.y) : vec2(vP.x, vP.y));
  float px = uPx*dist;                                    // metres one pixel covers here
  vec3 alb = vCol; float gloss = 0.0;
  float stain = 0.78 + 0.44*rwN(q*0.55 + seed*13.0);
  if (k < 0.5) {              // dressed stone in courses
    float row = floor(q.y/0.36);
    vec2 b = vec2(q.x/0.74 + 0.5*mod(row, 2.0) + 0.3*rwH(vec2(row, seed*91.0)), q.y/0.36), f = fract(b);
    float jd = min(min(f.x, 1.0 - f.x)*0.74, min(f.y, 1.0 - f.y)*0.36);
    float j = (1.0 - smoothstep(0.012, 0.035 + px, jd))*(1.0 - smoothstep(0.03, 0.14, px));
    alb *= (0.8 + 0.4*rwH(floor(b) + seed*7.0))*(1.0 - 0.5*j)*stain;
  } else if (k < 1.5) {       // brick
    float row = floor(q.y/0.085);
    vec2 b = vec2(q.x/0.23 + 0.5*mod(row, 2.0), q.y/0.085), f = fract(b);
    float jd = min(min(f.x, 1.0 - f.x)*0.23, min(f.y, 1.0 - f.y)*0.085);
    float lod = 1.0 - smoothstep(0.012, 0.05, px);
    float j = (1.0 - smoothstep(0.006, 0.014 + px, jd))*lod;
    alb *= mix(1.0, 0.72 + 0.56*rwH(floor(b) + seed*7.0), lod)*(1.0 - 0.4*j)*stain;
  } else if (k < 2.5) {       // roof tiles
    float row = floor(q.y/0.17);
    vec2 b = vec2(q.x/0.26 + 0.5*mod(row, 2.0), q.y/0.17), f = fract(b);
    float lod = 1.0 - smoothstep(0.02, 0.09, px);
    alb *= mix(1.0, (0.7 + 0.5*rwH(floor(b) + seed*3.0))*(0.72 + 0.4*f.y), lod)*(0.75 + 0.5*rwN(q*0.33 + seed*5.0));
  } else if (k < 3.5) {       // knapped flint in pale mortar
    float lod = 1.0 - smoothstep(0.02, 0.1, px);
    float fl = smoothstep(0.38, 0.62, rwN(q*9.0 + seed)), fl2 = rwN(q*23.0 + 7.0);
    alb *= mix(0.95, mix(1.5, 0.55 + 0.5*fl2, fl), lod)*stain; gloss = 0.05*fl*lod;
  } else if (k < 4.5) {       // weathered wood
    alb *= (0.72 + 0.5*rwN(q*vec2(1.3, 11.0) + seed*9.0))*stain;
  } else if (k < 5.5) {       // the cylinder: scorched grey metal, scaled and streaked
    float sc = rwN(q*0.9 + 3.0)*0.6 + 0.4*rwN(q*3.7);
    alb *= 0.55 + 0.75*sc; alb = mix(alb, alb*vec3(1.25, 0.95, 0.8), smoothstep(0.55, 0.8, rwN(q*0.31 + 11.0))); gloss = 0.22;
  } else if (k < 6.5) {       // cloth
    alb *= 0.9 + 0.14*rwN(q*4.0 + seed*9.0);
  } else if (k < 7.5) {       // an opening: a dark room behind old glass
    gloss = 0.07;
  } else if (k < 8.5) {       // limewash
    alb *= (0.84 + 0.2*rwN(q*1.2 + seed*5.0))*stain;
  }
  else if (k > 11.5) {        // the cart track: two ruts in bare sand, a strip of heath between them, ragged edges
    float ac = vE.w*2.0 - 1.0, along = vP.x*0.31 + vP.z*0.95;
    float wob = (rwN(vec2(along*0.35, 3.0)) - 0.5)*0.22;
    float rut = 1.0 - smoothstep(0.07, 0.2, abs(abs(ac + wob) - 0.52));
    float crown = 1.0 - smoothstep(0.08, 0.3, abs(ac + wob));
    float rag = smoothstep(0.62, 0.98, abs(ac) + (rwN(vP.xz*0.9) - 0.5)*0.5);
    alb *= 0.78 + 0.4*rwN(vP.xz*1.7);
    alb = mix(alb, vec3(0.2, 0.19, 0.15), 0.55*crown*smoothstep(0.3, 0.6, rwN(vP.xz*0.6 + 9.0)));
    alb = mix(alb, alb*vec3(0.42, 0.4, 0.4), rut*(0.7 + 0.3*rwN(vec2(along*1.3, ac*3.0))));
    alb = mix(alb, vec3(0.16, 0.14, 0.14), rag); gloss = 0.1*rut;
  }
  float ndl = dot(n, uKeyDir);
  // the afterglow is a wide band of sky, not a lamp: a wall turned any way toward it takes its rose and amber;
  // the far fire reddens what faces it; the high sky behind us fills the rest
  vec2 nh = n.xz/max(length(n.xz), 1e-3);
  float glowL = clamp(0.5 + 0.5*dot(nh, uGlow.xz), 0.0, 1.0); glowL = glowL*sqrt(glowL)*(1.0 - 0.75*n.y*n.y);
  vec3 fd = normalize(uFire.xyz - vW);
  vec3 lightc = uKeyCol*clamp(ndl*0.9 + 0.1, 0.0, 1.0) + rwAmb(n)*1.9
    + (uSkyRose*0.5 + uSkyAmber*0.4)*glowL*uGlow.w
    + uFireCol*uFire.w*clamp(dot(n, fd)*0.8 + 0.2, 0.0, 1.0)*0.55;
  // a burnt house: its embers light the inner faces of what is left of its walls, from the floor up
  float flick = 0.72 + 0.28*sin(uTime*2.3 + seed*40.0)*sin(uTime*3.7 + seed*17.0);
  if (burnt > 0.5 && !gl_FrontFacing) lightc += vec3(1.0, 0.3, 0.06)*1.1*(1.0 - smoothstep(0.0, 3.2, vW.y))*flick;
  // cloth lets the evening through
  if (k > 5.5 && k < 6.5) lightc += uKeyCol*0.5*clamp(-ndl, 0.0, 1.0)*clamp(dot(-v, uKeyDir), 0.0, 1.0);
  vec3 col = alb*lightc;
  vec3 r = reflect(-v, n); float fr = 1.0 - clamp(dot(n, v), 0.0, 1.0);
  col += rwSky(r)*gloss*(0.25 + 0.75*fr*fr);
  // the weed climbs every wall as far as the wall says (vE.y, metres above the water): lobed pads over one another
  float top = vE.y;
  if (top > 0.05) {
    float hN = 0.6*rwN(q*0.31 + seed*3.0) + 0.4*rwN(q*1.07 + 9.0);
    float m = (top - vW.y)/max(top, 1.0)*0.9 + (hN - 0.5)*1.1 - 0.16;
    vec4 pd = rwPad(q*1.9 + seed*17.0 + (vec2(rwN(q*2.7 + 3.0), rwN(q*2.7 + 41.0)) - 0.5)*0.55);
    float padK = 1.0 - smoothstep(0.06, 0.3, px), padH = mix(0.7, smoothstep(0.02, 0.34, pd.z), padK);
    // pad by pad: the growth is ragged at its edge, each pad there or not
    float cover = smoothstep(0.0, 0.14, m + (pd.w - 0.5)*0.3*padK)*(1.0 - 0.75*step(6.5, k)*step(k, 7.5));
    float sick = smoothstep(0.5, 0.62, uSick.x + uSick.y*vW.y + (pd.w - 0.5)*0.4*padK + (rwN(q*0.19 + 31.0) - 0.5)*0.5);
    vec3 wn = normalize(n + (an.y > 0.78 ? vec3(pd.x, 0.0, pd.y) : (an.x > an.z ? vec3(0.0, pd.y, pd.x) : vec3(pd.x, pd.y, 0.0)))*(-1.6)*(1.0 - padH)*padK);
    vec3 wc = rwWeed(wn, v, 0.1 + 0.3*(1.0 - padH), sick, 0.55 + 0.45*padH)*mix(1.0, 0.78 + 0.44*pd.w, padK*(1.0 - 0.6*sick))*(0.66 + 0.6*rwN(q*0.16 + seed*5.0));      // older and darker in places
    col = mix(col*(1.0 - 0.3*cover), wc, cover);
  }
  // a lamp left burning behind a window (its glazing bars across it); the dull red of embers in a burnt house's openings
  if (k > 9.5 && k < 10.5) {
    float bars = step(0.07, abs(fract(q.x/0.45) - 0.5))*step(0.06, abs(fract(q.y/0.58) - 0.5));
    col = vec3(1.0, 0.55, 0.2)*(1.2 + 0.1*sin(uTime*5.3 + seed*30.0))*mix(0.22, 1.0, bars)*(0.75 + 0.25*rwN(q*1.3 + seed*9.0));
  } else if (k > 10.5 && k < 11.5) {
    float em = rwN(q*2.3 + vec2(0.0, -uTime*0.25) + seed*31.0);
    col = vec3(0.95, 0.22, 0.04)*(0.12 + 0.5*em*em)*flick*(1.0 - 0.55*smoothstep(0.3, 2.4, vW.y));
  }
  // the pit: the open end of the cylinder breathes a faint green
  if (k > 8.5 && k < 9.5) {
    float sw = rwN(vP.xz*0.16 + vec2(uTime*0.05, -uTime*0.035))*0.6 + 0.4*rwN(vP.xz*0.45 - vec2(uTime*0.08, 0.0));
    col = vec3(0.04, 0.045, 0.045) + vec3(0.10, 0.62, 0.24)*uGreen*(0.06 + 0.94*sw*sw)*(0.55 + 0.45*sin(uTime*0.7 + sw*5.0));
  }
  gl_FragColor = vec4(rwAir(col, vW, cameraPosition), 1.0);
}`;
export function makeBuiltMaterial(U, own = {}) {
  return new THREE.ShaderMaterial({ uniforms: withShared(U, { uSick: { value: new THREE.Vector2(-0.4, 0.02) }, uGreen: { value: 1.0 }, ...own }), vertexShader: BUILT_VS, fragmentShader: BUILT_FS, side: THREE.DoubleSide });
}

// ---------------------------------------------------------------- helpers
const set = (acc, kind, weed = 0, seed = 0, sway = 0) => acc.extra(kind, weed, sway, seed);
// a quad whose normal is turned to the side `hint` points to
function Q(acc, a, b, c, d, hx, hy, hz) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * hx + ny * hy + nz * hz >= 0) acc.quad(a, b, c, d); else acc.quad(d, c, b, a);
}
function T3(acc, a, b, c, hx, hy, hz) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  const s = nx * hx + ny * hy + nz * hz >= 0 ? 1 : -1;
  const i0 = acc.v(a[0], a[1], a[2], nx * s, ny * s, nz * s), i1 = acc.v(b[0], b[1], b[2], nx * s, ny * s, nz * s), i2 = acc.v(c[0], c[1], c[2], nx * s, ny * s, nz * s);
  if (s > 0) acc.tri(i0, i1, i2); else acc.tri(i0, i2, i1);
}
// a beam of square section from a to b (4 sides, capped)
const beam = (acc, a, b, r) => acc.tube(a, b, r * 1.414, r * 1.414, 4, 1);
export function finish(acc, mirror = 1) {
  if (mirror < 0) {
    for (let i = 0; i < acc.p.length; i += 3) { acc.p[i] = -acc.p[i]; acc.n[i] = -acc.n[i]; }
    for (let i = 0; i < acc.i.length; i += 3) { const t = acc.i[i + 1]; acc.i[i + 1] = acc.i[i + 2]; acc.i[i + 2] = t; }
  }
  return acc.geometry('aE', true);
}

// ---------------------------------------------------------------- the bridge
// o: { z, spans: [centre span, side span, ...], crown, parapet (top y over the crown), rng }
export function bridgeInto(acc, o) {
  const z0 = o.z, hw = 3.4, rng = o.rng, side = o.side ?? 2, cSpan = o.centre ?? 20, sSpan = side === 1 ? 14 : 8.2, pier = side === 1 ? 3.4 : 2.5, ys = 1.0;
  // arches, centre outward
  const arches = [[0, cSpan / 2, ys, (o.crown ?? 9.5) - ys]];
  let x = cSpan / 2;
  for (let k = 0; k < side; k++) { const a = sSpan / 2, rise = (side === 1 ? 7.3 : 5.6 - k * 0.5) - ys + 1; arches.push([x + pier + a, a, ys, rise], [-(x + pier + a), a, ys, rise]); x += pier + sSpan; }
  const half = x + 3.2, far = half + 46;                                        // abutments, then the causeways running down into the flood
  const deckY = (xx) => { const ax = Math.abs(xx); return ax <= half ? 10.4 - 0.9 * (ax / half) * (ax / half) : lerp(9.5, 0.45, sstep(half, far, ax) * 0.5 + 0.5 * clamp((ax - half) / (far - half), 0, 1)); };
  const parH = (xx) => lerp(1.1, 0.45, sstep(half + 6, far - 4, Math.abs(xx)));
  const under = (xx) => { for (const a of arches) { const d = (xx - a[0]) / a[1]; if (Math.abs(d) < 1) return a[2] + a[3] * Math.sqrt(Math.max(0, 1 - d * d)); } return -1.5; };
  // the samples along the bridge: fine through the arches
  const xs = new Set([-far, far, -half, half]);
  for (let k = 0; k <= 12; k++) { xs.add(lerp(half, far, k / 12)); xs.add(-lerp(half, far, k / 12)); }
  for (const a of arches) for (let k = 0; k <= 16; k++) xs.add(a[0] - a[1] * Math.cos((k / 16) * Math.PI));
  const X = [...xs].sort((p, q) => p - q);
  const stone = C('#8d887e'), pale = C('#a39d90'), road = C('#6a655c');
  set(acc, KIND.stone, 9.5, rng()); acc.color(stone);
  for (let i = 0; i < X.length - 1; i++) {
    const xa = X[i], xb = X[i + 1], xm = (xa + xb) / 2, inArch = under(xm) > -1;
    // the growth has climbed the piers and the lower courses (and hangs from the parapets in curtains): the upper
    // courses, the arch rings and the parapet stand pale above it, so the bridge is stone against the evening
    acc.ex[1] = Math.abs(xm) > half ? Math.min(3.8, 0.5 * (deckY(xm) + parH(xm)) + 0.5) : 3.8;
    // just inside an arch's edge the wall's foot is the curve; at the very edge it drops to the water
    const ya = inArch ? Math.max(under(xa + 1e-4 * Math.sign(xm - xa)), ys) : -1.5, yb = inArch ? Math.max(under(xb + 1e-4 * Math.sign(xm - xb)), ys) : -1.5;
    const ta = deckY(xa) + parH(xa), tb = deckY(xb) + parH(xb);
    for (const s of [1, -1]) Q(acc, [xa, ya, z0 + s * hw], [xb, yb, z0 + s * hw], [xb, tb, z0 + s * hw], [xa, ta, z0 + s * hw], 0, 0, s);
    if (inArch) Q(acc, [xa, ya, z0 + hw], [xa, ya, z0 - hw], [xb, yb, z0 - hw], [xb, yb, z0 + hw], 0, -1, 0);       // the soffit
    // the road, the parapets' tops and inner faces
    const da = deckY(xa), db = deckY(xb), pw = 0.45;
    acc.color(road); Q(acc, [xa, da, z0 + hw - pw], [xb, db, z0 + hw - pw], [xb, db, z0 - hw + pw], [xa, da, z0 - hw + pw], 0, 1, 0); acc.color(stone);
    for (const s of [1, -1]) {
      Q(acc, [xa, ta, z0 + s * hw], [xb, tb, z0 + s * hw], [xb, tb, z0 + s * (hw - pw)], [xa, ta, z0 + s * (hw - pw)], 0, 1, 0);
      Q(acc, [xa, da, z0 + s * (hw - pw)], [xb, db, z0 + s * (hw - pw)], [xb, tb, z0 + s * (hw - pw)], [xa, ta, z0 + s * (hw - pw)], 0, 0, -s);
    }
  }
  acc.ex[1] = 3.8;
  for (const s of [1, -1]) Q(acc, [s * far, -1.5, z0 - hw], [s * far, -1.5, z0 + hw], [s * far, deckY(far) + 0.45, z0 + hw], [s * far, deckY(far) + 0.45, z0 - hw], s, 0, 0);
  // the piers' faces inside the openings, the ring of voussoirs round each arch, the cutwaters
  const posts = [];
  for (const a of arches) {
    for (const s of [1, -1]) Q(acc, [a[0] + s * a[1], -1.5, z0 - hw], [a[0] + s * a[1], -1.5, z0 + hw], [a[0] + s * a[1], ys, z0 + hw], [a[0] + s * a[1], ys, z0 - hw], -s, 0, 0);
    acc.color(pale);
    for (let k = 0; k < 16; k++) {
      const t0 = (k / 16) * Math.PI, t1 = ((k + 1) / 16) * Math.PI, w = 0.62;
      const p0 = [a[0] - a[1] * Math.cos(t0), a[2] + a[3] * Math.sin(t0)], p1 = [a[0] - a[1] * Math.cos(t1), a[2] + a[3] * Math.sin(t1)];
      const q0 = [a[0] - (a[1] + w) * Math.cos(t0), a[2] + (a[3] + w) * Math.sin(t0)], q1 = [a[0] - (a[1] + w) * Math.cos(t1), a[2] + (a[3] + w) * Math.sin(t1)];
      for (const s of [1, -1]) { const zz = z0 + s * (hw + 0.09); Q(acc, [p0[0], p0[1], zz], [p1[0], p1[1], zz], [q1[0], q1[1], zz], [q0[0], q0[1], zz], 0, 0, s);
        Q(acc, [q0[0], q0[1], zz], [q1[0], q1[1], zz], [q1[0], q1[1], z0 + s * hw], [q0[0], q0[1], z0 + s * hw], q0[0] - a[0], q0[1] - a[2] + 1, 0); }
    }
    acc.color(stone);
  }
  const edges = arches.flatMap((a) => [a[0] - a[1], a[0] + a[1]]).sort((p, q) => p - q);
  for (let k = 1; k < edges.length - 1; k += 2) {
    const xa = edges[k], xb = edges[k + 1], xm = (xa + xb) / 2, wp = (xb - xa) / 2 + 0.25; posts.push([xm, z0, 6.5, 0.7]);
    for (const s of [1, -1]) {
      const zf = z0 + s * hw, tip = [xm, zf + s * 2.5], yc = 5.0;
      Q(acc, [xm - wp, -1.5, zf], [tip[0], -1.5, tip[1]], [tip[0], yc, tip[1]], [xm - wp, yc, zf], -1, 0, s);
      Q(acc, [xm + wp, -1.5, zf], [tip[0], -1.5, tip[1]], [tip[0], yc, tip[1]], [xm + wp, yc, zf], 1, 0, s);
      T3(acc, [xm - wp, yc, zf], [tip[0], yc, tip[1]], [xm, yc + 1.7, zf], -1, 1.2, s); T3(acc, [xm + wp, yc, zf], [tip[0], yc, tip[1]], [xm, yc + 1.7, zf], 1, 1.2, s);
    }
  }
  posts.push([-half - 2, z0, 7, 0.6], [half + 2, z0, 7, 0.6]);
  // where the curtains of weed hang: the parapets (not over the middle of the centre arch) and the edges of the arches
  const hangs = [];
  for (const s of [1, -1]) {
    for (let xx = -half - 14; xx < half + 14; xx += 0.62 + 0.75 * rng()) {
      if (Math.abs(xx) < 7.2 || rng() < 0.16) continue;
      const top = deckY(xx) + parH(xx), room = top - Math.max(under(xx), 0) - 0.4, free = under(xx) > -1 ? top - 0.3 : top - 0.2;
      hangs.push([xx, top + 0.02, z0 + s * (hw + 0.14), Math.min(free, rng.range(2.6, 7.2)), 0, s, rng.range(0.55, 1.05), room]);
    }
    for (const a of arches) for (let k = 0; k < 26; k++) {
      const d = rng.range(-0.98, 0.98); if (a[0] === 0 && Math.abs(d * a[1]) < 7.2) continue;
      const yy = a[2] + a[3] * Math.sqrt(1 - d * d);
      hangs.push([a[0] + d * a[1], yy + 0.05, z0 + s * (hw + 0.05 - 0.5 * rng()), Math.min(yy - 0.25, rng.range(1.6, 4.6)), 0, s, rng.range(0.4, 0.8), yy]);
    }
  }
  return { arches, half, far, hw, deckY, parH, hangs, posts, z: z0 };
}

// a spoked wheel about the local Z axis: rim, spokes, hub; with `paddles` > 0 a mill wheel (two rims, float boards)
export function wheelInto(acc, o) {
  const R = o.radius, W = o.width ?? 0.12, n = o.spokes ?? 10, th = o.thick ?? R * 0.06, seg = o.seg ?? 16, sides = o.paddles ? [-W / 2, W / 2] : [0];
  for (const zc of sides) {
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * Math.PI * 2, a1 = ((k + 1) / seg) * Math.PI * 2;
      beam(acc, [Math.cos(a0) * R, Math.sin(a0) * R, zc], [Math.cos(a1) * R, Math.sin(a1) * R, zc], th);
    }
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; beam(acc, [Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1, zc], [Math.cos(a) * R, Math.sin(a) * R, zc], th * 0.7); }
  }
  acc.tube([0, 0, -W / 2 - (o.axle ?? 0.1)], [0, 0, W / 2 + (o.axle ?? 0.1)], R * 0.11, R * 0.11, 8, 1);
  for (let k = 0; k < (o.paddles || 0); k++) {
    const a = (k / o.paddles) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r0 = R * 0.8, r1 = R * 1.06;
    acc.quad([c * r0, s * r0, -W / 2], [c * r1, s * r1, -W / 2], [c * r1, s * r1, W / 2], [c * r0, s * r0, W / 2]);
  }
}

// the cart, overturned against the parapet: local frame = on its side, shafts in the air. o: { at: [x, y, z], rng }
export function cartInto(acc, o) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-1.12, 0.22, 0.06)).setPosition(o.at[0], o.at[1], o.at[2]);
  acc.xf(m); set(acc, KIND.wood, 0, 0.37); acc.color(C('#6e5a44'));
  acc.box(0, 0.55, 0, 1.25, 0.06, 0.72);                                                         // bed
  acc.box(0, 0.95, 0.72, 1.25, 0.4, 0.04); acc.box(0, 0.95, -0.72, 1.25, 0.4, 0.04); acc.box(-1.25, 0.95, 0, 0.04, 0.4, 0.72);   // sides and headboard
  beam(acc, [1.2, 0.5, 0.62], [3.5, 0.75, 0.5], 0.045); beam(acc, [1.2, 0.5, -0.62], [3.5, 0.75, -0.5], 0.045);                    // shafts
  acc.tube([0, 0.38, -1.0], [0, 0.38, 1.0], 0.05, 0.05, 6, 0);                                                                     // axle
  // the wheel that lies under it (the other one turns in the air: a mesh of its own)
  const mw = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.38, 0.93)); acc.xf(mw); wheelInto(acc, { radius: 0.74, width: 0.08, spokes: 12, seg: 14 });
  acc.xf(null);
  const hub = new THREE.Vector3(0, 0.38, -0.93).applyMatrix4(m), axis = new THREE.Vector3(0, 0, -1).transformDirection(m);
  return { hub, axis };
}

// ---------------------------------------------------------------- houses
// a gabled block in its own frame: ridge along local X, eaves at y = h, floor under the water.
// o: { x, z, ry, w, d, h, pitch, state: 0 whole | 1 roof burst open | 2 burnt to its gable ends, wall: KIND, wallCol, roofCol,
//      weed (how high the weed has climbed), storeys, chimneys: 0..2, door: +1 | -1 (which long side) }
export function cottageInto(acc, o, rng) {
  const w = o.w, d = o.d, h = o.h, pitch = o.pitch ?? 0.95, hx = w / 2, hz = d / 2, ridge = h + hz * pitch, seed = rng(), state = o.state || 0;
  const m = new THREE.Matrix4().makeRotationY(o.ry || 0).setPosition(o.x, o.y ?? 0, o.z); acc.xf(m);
  const wallCol = (o.wallCol || C('#8a5a48')).clone(), soot = state === 2 ? 0.42 : 1, burnt = state === 2;
  set(acc, o.wall ?? KIND.brick, burnt ? (o.weed ?? 3) * 0.6 : (o.weed ?? 3), seed + (burnt ? 2 : 0)); acc.color(wallCol.clone().multiplyScalar(soot));
  // long walls (a burnt house's stand broken to different heights), then the gable ends
  for (const s of [1, -1]) {
    const n = burnt ? 5 : 1; let ya = burnt ? h * rng.range(0.5, 1) : h;
    for (let k = 0; k < n; k++) {
      const xa = -hx + (w * k) / n, xb = -hx + (w * (k + 1)) / n, yb = burnt ? h * rng.range(0.35, 1) : h;
      Q(acc, [xa, -1, s * hz], [xb, -1, s * hz], [xb, yb, s * hz], [xa, ya, s * hz], 0, 0, s); ya = yb;
    }
  }
  for (const s of [1, -1]) {
    Q(acc, [s * hx, -1, -hz], [s * hx, -1, hz], [s * hx, h, hz], [s * hx, h, -hz], s, 0, 0);
    T3(acc, [s * hx, h, -hz], [s * hx, h, hz], [s * hx, ridge, 0], s, 0, 0);
  }
  // chimneys on the gable ends
  for (let c = 0; c < (o.chimneys ?? 1); c++) { const s = c === 0 ? 1 : -1; acc.box(s * (hx - 0.42), (h + ridge + 1.5) / 2, 0, 0.36, (ridge + 1.5 - h) / 2, 0.36, '-y'); acc.box(s * (hx - 0.42), ridge + 1.62, 0, 0.42, 0.1, 0.42); }
  // openings: a door and windows, dark (a burnt house's glow dully from its embers; o.lamp = [side, floor, window]
  // puts a lamp left burning behind one window)
  const opening = burnt ? KIND.ember : KIND.dark, lamp = o.lamp;
  set(acc, opening, 0, seed); acc.color(0.07, 0.075, 0.09);
  const ds = o.door ?? 1, storeys = o.storeys ?? (h > 4.2 ? 2 : 1), nw = Math.max(2, Math.round(w / 3.2));
  for (const s of [1, -1]) for (let f = 0; f < storeys; f++) for (let k = 0; k < nw; k++) {
    const xc = -hx + (w * (k + 0.5)) / nw, y0 = f === 0 ? 0.9 : 3.35, zz = s * (hz + 0.03), isDoor = f === 0 && s === ds && k === Math.floor(nw / 2);
    if (burnt && rng() < 0.4) continue;
    const lit = !isDoor && lamp && lamp[0] === s && lamp[1] === f && lamp[2] === k;
    if (lit) { set(acc, KIND.lamp, 0, seed); acc.color(1.0, 0.56, 0.2); }
    if (isDoor) Q(acc, [xc - 0.5, -0.6, zz], [xc + 0.5, -0.6, zz], [xc + 0.5, 1.95, zz], [xc - 0.5, 1.95, zz], 0, 0, s);
    else if (y0 + 1.15 < h - 0.15) Q(acc, [xc - 0.45, y0, zz], [xc + 0.45, y0, zz], [xc + 0.45, y0 + 1.15, zz], [xc - 0.45, y0 + 1.15, zz], 0, 0, s);
    if (lit) { set(acc, opening, 0, seed); acc.color(0.07, 0.075, 0.09); }
  }
  // the roof: whole; or burst open, some of it gone and the rafters bare; or burnt away, a few black rafters left
  const ov = 0.34, ex = hx + 0.3, ey = h - ov * pitch, ez = hz + ov;
  const hole = { x: rng.range(-0.3, 0.3) * w, r: rng.range(0.3, 0.42) * w, side: rng.pick([1, -1]), deep: rng.range(0.5, 1.2) };
  const nx = state === 0 ? 1 : 7, nz = state === 0 ? 1 : 4;
  if (!burnt) {
    set(acc, KIND.tile, (o.weed ?? 3) * (state ? 0.9 : 0.75), seed); acc.color((o.roofCol || C('#7a4a3a')));
    for (const s of [1, -1]) for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const xa = lerp(-ex, ex, i / nx), xb = lerp(-ex, ex, (i + 1) / nx), ta = j / nz, tb = (j + 1) / nz, xm = (xa + xb) / 2, tm = (ta + tb) / 2;
      if (state === 1) { const dd = Math.hypot((xm - hole.x) / hole.r, (s === hole.side ? 1 - tm : 1 + tm * hole.deep) / 1.05); if (dd < 1 + 0.18 * (rng() - 0.5)) continue; }
      Q(acc, [xa, lerp(ey, ridge, ta), s * lerp(ez, 0, ta)], [xb, lerp(ey, ridge, ta), s * lerp(ez, 0, ta)], [xb, lerp(ey, ridge, tb), s * lerp(ez, 0, tb)], [xa, lerp(ey, ridge, tb), s * lerp(ez, 0, tb)], 0, 1, s * 0.5);
    }
  }
  if (state) {
    set(acc, KIND.wood, 0, seed); acc.color(burnt ? C('#1c1a19') : C('#5c4a3a'));
    const nr = Math.max(5, Math.round(w / 1.1));
    for (let i = 0; i <= nr; i++) {
      const xx = lerp(-hx + 0.1, hx - 0.1, i / nr);
      for (const s of [1, -1]) {
        if (burnt && rng() < 0.66) continue;
        if (!burnt && Math.abs(xx - hole.x) > hole.r * 1.05) continue;
        const t1 = burnt ? rng.range(0.45, 1) : 1;
        beam(acc, [xx, h, s * hz], [xx, lerp(h, ridge, t1), s * lerp(hz, 0, t1)], 0.055);
      }
    }
    if (!burnt || rng() < 0.5) beam(acc, [-hx, ridge - 0.05, 0], [hx, ridge - 0.05, 0], 0.06);
  }
  acc.xf(null);
  return { x: o.x, z: o.z, r: Math.hypot(hx, hz), hx, hz, h, ridge, m };
}

// the church: a square flint tower with a short shingled cap, the nave running away from the river, a chancel, a porch
export function churchInto(acc, o) {
  const m = new THREE.Matrix4().makeRotationY(o.ry || 0).setPosition(o.x, 0, o.z); acc.xf(m);
  const flint = C('#7d7b78'), quoin = C('#a59e90'), shingle = C('#5a4e44'), tH = o.tower ?? 22, t = 3.3, seed = 0.61;
  set(acc, KIND.flint, 8, seed); acc.color(flint);
  acc.box(0, (tH - 1) / 2, 0, t, (tH + 1) / 2, t, '-y+y');
  // quoins, a string course and the parapet in pale stone
  set(acc, KIND.stone, 8, seed); acc.color(quoin);
  for (const sx of [1, -1]) for (const sz of [1, -1]) acc.box(sx * (t - 0.2), (tH - 1) / 2, sz * (t - 0.2), 0.27, (tH + 1) / 2, 0.27, '-y+y');
  acc.box(0, 14.6, 0, t + 0.1, 0.14, t + 0.1); acc.box(0, tH + 0.1, 0, t + 0.16, 0.28, t + 0.16);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
    for (const e of [-1, 0, 1]) acc.box(c * (t + 0.02) + s * e * 2.2, tH + 0.75, s * (t + 0.02) - c * e * 2.2, 0.16 + 0.42 * Math.abs(s), 0.4, 0.16 + 0.42 * Math.abs(c)); }
  // belfry openings (louvred, dark, pointed) on each face, a west door, the cap
  set(acc, KIND.dark, 0, seed); acc.color(0.07, 0.075, 0.09);
  const openings = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a)), f = t + 0.04;
    const P = (u, y) => [c * f - s * u, y, s * f + c * u];
    Q(acc, P(-0.62, 16.0), P(0.62, 16.0), P(0.62, 18.6), P(-0.62, 18.6), c, 0, s); T3(acc, P(-0.62, 18.6), P(0.62, 18.6), P(0, 19.7), c, 0, s);
    openings.push(new THREE.Vector3(c * f, 17.6, s * f).applyMatrix4(m));
  }
  Q(acc, [-t - 0.04, -0.5, -0.8], [-t - 0.04, -0.5, 0.8], [-t - 0.04, 2.6, 0.8], [-t - 0.04, 2.6, -0.8], -1, 0, 0); T3(acc, [-t - 0.04, 2.6, -0.8], [-t - 0.04, 2.6, 0.8], [-t - 0.04, 3.5, 0], -1, 0, 0);
  set(acc, KIND.tile, 0, seed); acc.color(shingle);
  for (let k = 0; k < 4; k++) { const a0 = (k / 4) * Math.PI * 2 + Math.PI / 4, a1 = a0 + Math.PI / 2, r = (t - 0.25) * 1.414;
    T3(acc, [Math.cos(a0) * r, tH + 0.38, Math.sin(a0) * r], [Math.cos(a1) * r, tH + 0.38, Math.sin(a1) * r], [0, tH + 3.9, 0], Math.cos(a0 + Math.PI / 4), 1, Math.sin(a0 + Math.PI / 4)); }
  acc.tube([0, tH + 3.8, 0], [0, tH + 5.2, 0], 0.05, 0.03, 4, 0);                               // a bare vane rod (no cock, no letters)
  // nave and chancel
  const block = (x0, x1, hz, h, ridge, weed) => {
    set(acc, KIND.flint, weed, seed + 0.1); acc.color(flint);
    for (const s of [1, -1]) Q(acc, [x0, -1, s * hz], [x1, -1, s * hz], [x1, h, s * hz], [x0, h, s * hz], 0, 0, s);
    Q(acc, [x1, -1, -hz], [x1, -1, hz], [x1, h, hz], [x1, h, -hz], 1, 0, 0); T3(acc, [x1, h, -hz], [x1, h, hz], [x1, ridge, 0], 1, 0, 0);
    T3(acc, [x0, h, -hz], [x0, h, hz], [x0, ridge, 0], -1, 0, 0);
    set(acc, KIND.tile, weed * 0.6, seed + 0.2); acc.color(C('#6a5348'));
    for (const s of [1, -1]) Q(acc, [x0, ridge, 0], [x1 + 0.3, ridge, 0], [x1 + 0.3, h - 0.3, s * (hz + 0.35)], [x0, h - 0.3, s * (hz + 0.35)], 0, 1, s * 0.5);
    set(acc, KIND.dark, 0, seed); acc.color(0.07, 0.075, 0.09);
    const nwin = Math.max(1, Math.round((x1 - x0) / 5.5));
    for (const s of [1, -1]) for (let k = 0; k < nwin; k++) { const xc = lerp(x0, x1, (k + 0.5) / nwin), zz = s * (hz + 0.04), y0 = h * 0.3, y1 = h * 0.7;
      Q(acc, [xc - 0.55, y0, zz], [xc + 0.55, y0, zz], [xc + 0.55, y1, zz], [xc - 0.55, y1, zz], 0, 0, s); T3(acc, [xc - 0.55, y1, zz], [xc + 0.55, y1, zz], [xc, y1 + 1.0, zz], 0, 0, s); }
  };
  block(t, t + 19, 4.4, 6.6, 11.6, 5.5); block(t + 19, t + 27, 3.2, 5.0, 8.6, 4.5);
  // the porch on the side we come from
  set(acc, KIND.flint, 4, seed + 0.3); acc.color(flint); acc.box(t + 5, 1.2, 4.4 + 1.5, 1.6, 2.2, 1.5, '-y+y-z');
  set(acc, KIND.tile, 2, seed); acc.color(C('#6a5348')); for (const s of [1, -1]) Q(acc, [t + 5, 4.9, 4.2], [t + 5, 4.9, 7.7], [t + 5 + s * 1.95, 3.2, 7.7], [t + 5 + s * 1.95, 3.2, 4.2], s * 0.5, 1, 0);
  acc.xf(null);
  return { openings, top: tH, m, posts: [[o.x, o.z, 7, 0.7]] };
}

// the mill: brick, three floors, a hoist hanging out from its gable; the wheel is a mesh of its own
export function millInto(acc, o, rng) {
  const main = cottageInto(acc, { x: o.x, z: o.z, ry: Math.PI / 2, w: 12, d: 9, h: 10.4, pitch: 0.85, wall: KIND.brick, wallCol: C('#7c5244'), roofCol: C('#6e4a3c'), weed: 7.5, storeys: 2, chimneys: 0, door: o.door ?? 1, lamp: o.lamp }, rng);
  cottageInto(acc, { x: o.x + 7.2, z: o.z - 1.5, ry: 0, w: 6.5, d: 7, h: 5.2, pitch: 0.8, wall: KIND.brick, wallCol: C('#7c5244'), roofCol: C('#6e4a3c'), weed: 4.5, chimneys: 1 }, rng);
  // the hoist (a boarded box on the gable that faces down the valley) and a third row of windows
  set(acc, KIND.wood, 3, 0.2); acc.color(C('#5d5046')); acc.box(o.x, 11.6, o.z + 6.7, 1.1, 1.3, 0.8);
  set(acc, KIND.tile, 2, 0.2); acc.color(C('#6e4a3c')); acc.box(o.x, 13.0, o.z + 6.8, 1.3, 0.08, 1.0);
  set(acc, KIND.dark, 0, 0.2); acc.color(0.07, 0.075, 0.09);
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) { const zz = o.z - 4.5 + k * 3, xx = o.x + s * 4.54; Q(acc, [xx, 6.6, zz - 0.45], [xx, 6.6, zz + 0.45], [xx, 7.8, zz + 0.45], [xx, 7.8, zz - 0.45], s, 0, 0); }
  // the wheel's bearing wall and the sluice timbers beside it
  set(acc, KIND.brick, 6, 0.5); acc.color(C('#74503f')); acc.box(o.x - 7.6, 0.4, o.z, 0.35, 1.9, 3.8, '-y');
  set(acc, KIND.wood, 5, 0.5); acc.color(C('#4e4238')); beam(acc, [o.x - 7.6, 2.3, o.z - 3.6], [o.x - 4.5, 2.3, o.z - 3.6], 0.12); beam(acc, [o.x - 7.6, 2.3, o.z + 3.6], [o.x - 4.5, 2.3, o.z + 3.6], 0.12);
  return { wheel: [o.x - 6.05, 1.75, o.z], posts: [[o.x, o.z, 11, 0.6], [o.x - 6, o.z, 6, 0.5]], main };
}

// the skiff: a clinker rowing boat, empty, about 4.6 m, its oars shipped along the thwarts (its own mesh; bow
// toward local -Z). Pale weathered paint outside, bare boards inside: a boat, seen from above or from the side
export function skiffInto(acc) {
  set(acc, KIND.wood, 0, 0.83); const st = [-1, -0.82, -0.5, 0, 0.5, 0.86, 1], L = 2.3, sec = [];
  const beam = (s) => 0.74 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), s < 0 ? 2.2 : 3.2)), 0.6);
  for (const s of st) { const b = beam(s) + (s > 0.9 ? 0.34 : 0), sheer = 0.34 + 0.2 * s * s, k = -0.2 + 0.1 * Math.abs(s) * Math.abs(s);
    sec.push([[-b, sheer], [-b * 0.86, sheer - 0.2], [-b * 0.55, k + 0.07], [0, k], [b * 0.55, k + 0.07], [b * 0.86, sheer - 0.2], [b, sheer]].map((p) => [p[0], p[1], s * L])); }
  for (let i = 0; i < sec.length - 1; i++) for (let j = 0; j < 6; j++) {
    acc.color(j === 0 || j === 5 ? C('#cdc6b2') : j === 1 || j === 4 ? C('#a39a86') : C('#8f8672'));
    const a = sec[i][j], b = sec[i][j + 1], c = sec[i + 1][j + 1], d = sec[i + 1][j]; Q(acc, a, b, c, d, a[0] + b[0], -1, 0);
  }
  const last = sec[sec.length - 1]; acc.color(C('#b4ac96')); for (let j = 0; j < 5; j++) T3(acc, last[j], last[j + 1], [0, 0.3, L], 0, 0, 1);
  // gunwale rails, three thwarts, the bottom boards, two oars laid fore and aft with their blades over the stern
  acc.color(C('#d6cfba')); for (let i = 0; i < sec.length - 1; i++) for (const j of [0, 6]) acc.tube(sec[i][j], sec[i + 1][j], 0.035, 0.035, 4, 0);
  acc.color(C('#b9ad92')); for (const s of [-0.45, 0.2, 0.74]) { const b = beam(s) * 0.92; acc.box(0, 0.2, s * L, b, 0.025, 0.13); }
  acc.color(C('#857a66')); Q(acc, [-0.5, -0.06, -1.5], [0.5, -0.06, -1.5], [0.56, -0.06, 1.9], [-0.56, -0.06, 1.9], 0, 1, 0);
  acc.color(C('#c9bd9e')); for (const sx of [-1, 1]) { acc.tube([sx * 0.2, 0.25, -1.25], [sx * 0.3, 0.3, 1.95], 0.028, 0.028, 5, 0); acc.box(sx * 0.33, 0.31, 2.3, 0.07, 0.012, 0.36); }
}

// washing still pegged on a line between two posts. o: { a: [x, z], b: [x, z], y }
export function washingInto(acc, o, rng) {
  const [ax, az] = o.a, [bx, bz] = o.b, y = o.y ?? 2.25, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  set(acc, KIND.wood, 1.2, 0.4); acc.color(C('#5a4e42'));
  acc.tube([ax, -1, az], [ax, y + 0.15, az], 0.07, 0.06, 6, 1); acc.tube([bx, -1, bz], [bx, y + 0.15, bz], 0.07, 0.06, 6, 1);
  const lineY = (t) => y - 0.22 * 4 * t * (1 - t);
  set(acc, KIND.cloth, 0, 0.4); acc.color(C('#b9b2a4'));
  for (let k = 0; k < 8; k++) acc.tube([ax + dx * (k / 8), lineY(k / 8), az + dz * (k / 8)], [ax + dx * ((k + 1) / 8), lineY((k + 1) / 8), az + dz * ((k + 1) / 8)], 0.022, 0.022, 4, 0);
  // sheets, shirts, a pair of small things: pale, hanging from the line, stirring from the hem
  const cols = ['#d8d2c4', '#cfc9bc', '#c2c6cc', '#d9d0bd', '#b8b4ac', '#d2cdc2'];
  let t = 0.08;
  while (t < 0.9) {
    const wd = rng.range(0.5, 1.5), hh = rng.range(0.7, 1.45), t1 = t + wd / L; if (t1 > 0.94) break;
    const seed = rng(); acc.color(C(rng.pick(cols)));
    const nx = 3, ny = 4, ids = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const tt = lerp(t, t1, i / nx), yy = lerp(lineY(tt), lineY(tt) - hh * (1 - 0.06 * Math.sin(i * 2.1 + seed * 9)), j / ny), sw = Math.pow(j / ny, 1.4);
      ids.push(acc.v(ax + dx * tt, yy, az + dz * tt, -uz, 0, ux, [KIND.cloth, 0, sw, seed]));
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = ids[j * (nx + 1) + i]; acc.quadI(a, a + 1, a + nx + 2, a + nx + 1); }
    t = t1 + rng.range(0.03, 0.09);
  }
}

// the cylinder in its pit: the rim of a great scorched tube lying half buried as it struck, its open end up and
// tipped back along the line of its fall (the world gives the tilt and the compass yaw)
// o: { x, y, z, radius, tilt (rad), yaw }
export function cylinderInto(acc, o) {
  const R = o.radius ?? 14, m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.tilt ?? 0.3, o.yaw ?? 0, 0.08)).setPosition(o.x, o.y, o.z);
  acc.xf(m); set(acc, KIND.iron, 0, 0.7); acc.color(C('#46423c'));      // scorched iron, dull: it is not glass
  acc.lathe(0, 0, [[R, -9], [R, 1.7], [R - 0.12, 2.0], [R - 1.0, 2.05], [R - 1.2, 1.8], [R - 1.2, -3.2]], 44);
  // the screw thread of its lost lid: three low ribs inside the mouth
  for (const yy of [0.9, 0.2, -0.5]) acc.lathe(0, 0, [[R - 1.2, yy - 0.16], [R - 1.42, yy], [R - 1.2, yy + 0.16]], 44);
  set(acc, KIND.pit, 0, 0.7); acc.color(0.02, 0.03, 0.02);
  const c = acc.v(0, -3.1, 0, 0, 1, 0), b = acc.count; for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2; acc.v(Math.cos(a) * (R - 1.2), -3.1, Math.sin(a) * (R - 1.2), 0, 1, 0); }
  for (let k = 0; k < 28; k++) acc.tri(c, b + k + 1, b + k);
  acc.xf(null);
  return { m, mouth: new THREE.Vector3(0, -1.5, 0).applyMatrix4(m) };
}

// a cart track: a ribbon laid on the ground along pts ([[x, z], ...]), two ruts and a crown between them (drawn
// by the material from the across-the-track number each vertex carries). o: { pts, width, heightAt(x, z), color }
export function trackInto(acc, o) {
  const pts = o.pts, n = pts.length, hw = (o.width ?? 2.4) / 2, across = [-1, -0.5, 0, 0.5, 1], rows = [], H = o.heightAt;
  acc.color(o.color || C('#b9a47e'));
  for (let k = 0; k < n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1, sx = -tz / tl, sz = tx / tl, row = [];
    for (const ac of across) {
      const x = pts[k][0] + sx * ac * hw, z = pts[k][1] + sz * ac * hw, y = H(x, z), gx = (H(x + 1, z) - H(x - 1, z)) / 2, gz = (H(x, z + 1) - H(x, z - 1)) / 2, nl = Math.hypot(gx, 1, gz);
      row.push(acc.v(x, y + 0.07, z, -gx / nl, 1 / nl, -gz / nl, [KIND.track, 0, 0, 0.5 + 0.5 * ac]));
    }
    rows.push(row);
  }
  for (let k = 0; k < n - 1; k++) for (let i = 0; i < 4; i++) acc.quadI(rows[k][i], rows[k][i + 1], rows[k + 1][i + 1], rows[k + 1][i]);
}
