// FIGURE AND GROUND: a three-block relief print. Ivory fish rise through black water, roll flat and lock into a
// tiling at the surface of the sea; the black gaps between them thicken into geese and lift off in straight fronts.
// The camera rides a fish with an accent dorsal fin up to the plane, goes through the goose-shaped hole beside the
// cell its fish locks into, and comes out over the finished plane on a goose with an accent bill.
//
// Everything is an unlit ShaderMaterial that ends in ink, paper or the accent (no lights, no fog, no bloom).
// The plane, the locking shoal, the lift-off fronts and the exit annulus are the hero (src/parts/figure-and-ground.js);
// this file adds the dome (engraved cloud bars above, hatching below), the ranks of the deep (curtains of fish at
// several depths, from under the flown line up to the plane, on both sides of the route), a few wood shavings and
// ink chips, the far skeins of goose strokes, two rafts of geese that lock into patches of the tiling (one looms low
// and near beside the first stretch over the plane, one feeds the ring), both mounts, the black beat of the crossing
// and the rare second plane.
// It also adds the lift: ranks of geese that leave the plane behind every second lift-off front, on lanes to either side of the ring's avenue.
//
// Editions by seed / ctx.vary.hour: day (ivory sky, black sea), night (blocks swapped, star gouges), golden (kraft
// paper, heavier bars), rain (the sky ruled with sliding diagonal cuts). The accent block is picked by seed in the
// hero (vermilion, Prussian blue, gold). ctx.vary.density sets how many lift-off fronts cross the plane at once and
// how full the shoal and the sky are. Rare: the skeins close into a second plane 120 m overhead and fish drop out of it.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/figure-and-ground.js';
import { makeRng, hashSeed } from '../kit/core.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const CLIP = 'gl_Position = vec4(2., 2., 2., 1.);';
const NRAFT = 2;       // rafts over the plane: the one that looms beside the route, and the one that feeds the ring
// a raft's sheet in cells of the tiling, along its heading and across it (a cell is 8 m by 5 m): the one that looms is
// a sheet of 96 m by 65 m, the one that feeds the ring is 64 m by 45 m, as it was
const RAFT_CELLS = [[12, 13], [8, 9]];
// THE FLOWN LINE, as the place knows it. The route runs along +X all the way, so its height and its side are written
// once, at build, for every TUBE.dx metres of x (carried straight on beyond both ends), and every loose thing of the
// place (the fish of the ranks, the shavings, the chips) keeps its own distance from that line: it is pushed straight
// out from it, by its place alone, the same wherever the eye is and whichever way it looks. Nothing is hidden for it.
const TUBE = { n: 80, x0: -300, dx: 10 };
const TUBE_GLSL = /* glsl */`uniform vec2 uTube[${TUBE.n}];
  vec2 tubeAt(float x) { float f = clamp((x - ${TUBE.x0}.) / ${TUBE.dx}., 0., ${TUBE.n - 1}. - .001), i = floor(f); return mix(uTube[int(i)], uTube[int(i) + 1], f - i); }
  vec3 clearOf(vec3 p, float r, vec2 tie) { vec2 d = p.yz - tubeAt(p.x) + tie; float l = max(length(d), 1e-3); p.yz += d / l * (sqrt(l * l + r * r) - l); return p; }`;

// ---------- the dome: paper sky with engraved cloud bars, ink water with thinning hatching ----------
const DOME_VS = /* glsl */`varying vec3 vDir;
  void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FS = /* glsl */`varying vec3 vDir;
  uniform vec3 uInk, uPaper; uniform float uTime, uRain, uStars, uDuty, uSeed, uUnder, uCalm;
  float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h12(i), h12(i + vec2(1., 0.)), f.x), mix(h12(i + vec2(0., 1.)), h12(i + vec2(1., 1.)), f.x), f.y); }
  float lineT(float x, float per, float w, float aa) { float d = abs(fract(x / per + .5) - .5) * per; return 1. - smoothstep(w * .5 - aa, w * .5 + aa, d); }
  void main() {
    vec3 d = normalize(vDir);
    float hl = max(length(d.xz), 1e-4);
    vec2 hd = d.xz / hl;
    float te = abs(d.y) / hl;
    float tone = 1.;
    if (d.y >= 0. && uUnder < .5) {
      // level bars in bundles of five to nine, each bar tapering to a point at both ends like a burin cut
      float w = log(te + .012) * 2.;
      float ab = max(fwidth(w), 1e-4) * 1.5;            // one pixel, in half-band units
      float bw = w * 2., bi = floor(bw), f = bw - bi;
      float hsh = h12(vec2(bi, uSeed));
      float n = 5. + floor(hsh * 4.99);
      float horizon = 1. - smoothstep(-5.3, -4.7, w);
      float per = .078;
      float sp = (floor(h12(vec2(bi, 7.3 + uSeed)) * 3.) - 1.) * .011 + .004;   // three drift rates
      float a = uTime * sp + hsh * 40.;
      vec2 r = vec2(hd.x * cos(a) - hd.y * sin(a), hd.x * sin(a) + hd.y * cos(a));
      float nz = vn(r * 2.3 + bi * 5.7);
      float thr = mix(.52, .78, smoothstep(-5., 2.5, w));
      float taper = smoothstep(thr, thr + .14, nz);
      // on a small picture a bundle is cut with fewer, wider-spaced lines (never closer than about four pixels),
      // so it is always lines of ink and never a grey bar
      float oc = exp2(ceil(log2(max(ab * 5.6 / per, 1.))));
      per *= oc; n = max(1., floor(n / oc + .5));
      float halfB = n * per * .5 * (.35 + .65 * taper);
      float inB = 1. - smoothstep(halfB - ab, halfB + ab, abs(f - .5));
      float lw = min(per * uDuty, ab * 3.2) * taper;
      float fine = lineT(f - .5 + per * .5 * mod(n + 1., 2.), per, lw, ab) * inB * clamp(lw / (1.4 * ab), 0., 1.);
      float res = step(n * per, 1.05);
      // a bundle too fine to show its lines is one fine line, never a slab
      float sw = max(.05, ab * 1.3) * taper;
      float solid = (1. - smoothstep(sw - ab, sw + ab, abs(f - .5))) * clamp(sw / ab, 0., 1.);
      float ink = mix(solid, fine, res) * (1. - horizon) * step(.001, taper);
      // the last three degrees: a few bold level bars with gaps, never closer than about ten pixels at any size of
      // picture, thinning upward into the paper
      float fe = max(fwidth(te), 1e-6);
      float P = .0052 * exp2(ceil(log2(max(fe * 10. / .0052, 1.))));
      float li = floor(te / P);
      float hl2 = h12(vec2(li, uSeed + 3.));
      float a2 = uTime * ((floor(hl2 * 3.) - 1.) * .009 + .003) + hl2 * 50.;
      vec2 r2 = vec2(hd.x * cos(a2) - hd.y * sin(a2), hd.x * sin(a2) + hd.y * cos(a2));
      float nh = vn(r2 * 9. + li * 3.1);
      float hband = 1. - smoothstep(.03, .06, te);
      float cut = smoothstep(.36, .52, nh + .22 * (hband - .85));
      float hw = max(P * .40 * cut * (.4 + .6 * hband) * (1. - .5 * uCalm), 2.5 * fe * step(.001, cut));
      float hatch = (1. - smoothstep(hw * .5 - fe, hw * .5 + fe, abs(fract(te / P) - .5) * P)) * clamp(hw / (2. * fe), 0., 1.);
      ink = max(ink, hatch * step(.001, cut) * smoothstep(0., .02, hband));
      float pa = max(length(fwidth(d)), 1e-5);
      if (uStars > .5) {
        // a few star gouges: short cuts, each with its own slant
        vec2 sp2 = d.xz / (1. + d.y) * 15.;
        vec2 ci = floor(sp2), cf = fract(sp2) - .5;
        float hs = h12(ci + uSeed * 3.1);
        float ang = hs * 40.;
        vec2 dir = vec2(cos(ang), sin(ang));
        float al = dot(cf, dir), ac = abs(dot(cf, vec2(-dir.y, dir.x)));
        float pw = pa * 15. / (1. + d.y);
        float gouge = (1. - smoothstep(max(.004, pw * .2), max(.012, pw * .9), ac)) * (1. - smoothstep(.10 + .2 * fract(hs * 7.), .13 + .2 * fract(hs * 7.), abs(al)));
        float tw = .75 + .25 * sin(uTime * (1. + 3. * fract(hs * 13.)) + hs * 60.);
        ink = max(ink, gouge * step(.88, hs) * smoothstep(.2, .45, te) * step(.25, tw));
      }
      if (uRain > .5) {
        // long diagonal cuts sliding down-wind: great circles through the direction the rain falls in
        vec3 R = normalize(vec3(.95, -1., .35));
        vec3 U = normalize(cross(R, vec3(0., 0., 1.))), V = cross(R, U);
        float ra = dot(d, U), rb = dot(d, V), rc = dot(d, R);
        float rr = max(length(vec2(ra, rb)), 1e-4);
        float ph = atan(rb, ra + 1e-6) / 6.2831853 * 240.;
        float id = floor(ph + .5);
        float dl = abs(ph - id) * (6.2831853 / 240.) * rr;
        float hr = h12(vec2(id, 3.7 + uSeed));
        float ln = 1. - smoothstep(pa * .25, pa * 1.05, dl);
        float fc = max(fwidth(rc), 1e-5) * 2.4;
        float dash = lineT(rc * 2.4 - uTime * (.55 + .5 * hr) + hr * 9., 1., .09 + .09 * hr, fc);
        ink = max(ink, ln * dash * step(.3, hr) * smoothstep(.3, .5, rr) * smoothstep(.12, .17, te));
      }
      tone = 1. - ink;
    } else {
      // the water: ink. Its depth is cut into it: level ivory cuts that gather at the underwater horizon (long bold
      // bars with gaps, never closer than about ten pixels at any size of picture) and thin out under it, shorter,
      // finer and fewer, to nothing some thirteen degrees down. So the water has a far and a near and a level line.
      float fe = max(fwidth(te), 1e-6);
      float P = .0058 * exp2(ceil(log2(max(fe * 10. / .0058, 1.))));
      float li = floor(te / P);
      float hl2 = h12(vec2(li, uSeed + 5.));
      float a2 = uTime * (hl2 - .5) * .014 + hl2 * 50.;
      vec2 r2 = vec2(hd.x * cos(a2) - hd.y * sin(a2), hd.x * sin(a2) + hd.y * cos(a2));
      float near = 1. - smoothstep(0., .17, te);
      float nh = vn(r2 * (4. + 60. * te + 4. * hl2) + li * 3.1);       // long cuts at the horizon, short ones under it
      float thr = mix(.82, .30, near * near * near);
      float cut = smoothstep(thr, thr + .12, nh);
      float hw = max(P * .40 * cut * near * near, 2.5 * fe * step(.001, cut));
      tone = (1. - smoothstep(hw * .5 - fe, hw * .5 + fe, abs(fract(te / P) - .5) * P)) * clamp(hw / (2. * fe), 0., 1.) * step(.001, cut) * step(.004, near);
    }
    // paper fibre: a faint mottle fixed to the sheet
    float fib = (vn(gl_FragCoord.xy * vec2(.07, .45)) - .5) * .045 + (vn(gl_FragCoord.xy * .9) - .5) * .03;
    gl_FragColor = vec4(mix(uInk, uPaper * (1. - abs(fib)), tone), 1.);
  }`;

// ---------- shavings (ivory curls spiralling up through the water) and chips (ink flakes falling through the sky) ----------
const BIT_VS = /* glsl */`attribute vec4 aP; attribute vec4 aQ;
  uniform vec3 uBox, uCamW; uniform float uTime, uRise, uSide, uSpiral, uTumble, uClear;
  ${TUBE_GLSL}
  void main() {
    vec3 base = aP.xyz * uBox;
    base.y += uRise * (.55 + .9 * aP.w) * uTime;
    vec3 c = uCamW + (fract((base - uCamW) / uBox + .5) - .5) * uBox;
    float ph = uTime * aQ.y + aQ.z * 6.2832;
    c.xz += uSpiral * (.4 + aQ.w) * vec2(cos(ph * .6), sin(ph * .6));
    c.x += (1. - uSpiral) * 1.5 * sin(ph * .37);
    c = clearOf(c, uClear, (aQ.zw - .5) * .05);       // uClear metres and more from the flown line
    float ay = ph * 1.3, ax = aQ.w * 2. + uTumble * ph;
    vec3 p = position * aQ.x;
    p = vec3(p.x, p.y * cos(ax) - p.z * sin(ax), p.y * sin(ax) + p.z * cos(ax));
    p = vec3(p.x * cos(ay) + p.z * sin(ay), p.y, -p.x * sin(ay) + p.z * cos(ay));
    vec3 wp = c + p;
    vec3 rel = c - uCamW;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    if (uSide * c.y < .6 || max(abs(rel.x) / uBox.x, max(abs(rel.y) / uBox.y, abs(rel.z) / uBox.z)) > .47) ${CLIP}
  }`;
const BIT_FS = /* glsl */`uniform vec3 uCol; void main() { gl_FragColor = vec4(uCol, 1.); }`;

function shavingGeometry() {
  const pos = [], idx = [], N = 9;
  for (let i = 0; i <= N; i++) {
    const a = i * 0.95, r = 0.2 * (1 - 0.35 * i / N), y = (i / N - 0.5) * 0.9;
    pos.push(r * Math.cos(a), y - 0.07, r * Math.sin(a), r * Math.cos(a), y + 0.07, r * Math.sin(a));
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
function chipGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.16, 0.42, 0, -0.3, 0.55, 0, 0.12, -0.3, 0, 0.3], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function makeBits(base, count, rng, uniforms, size = 1) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  const p = new Float32Array(count * 4), q = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    p[i * 4] = rng(); p[i * 4 + 1] = rng(); p[i * 4 + 2] = rng(); p[i * 4 + 3] = rng();
    q[i * 4] = rng.range(0.45, 1.2) * size; q[i * 4 + 1] = rng.range(0.5, 1.6) * (rng() < 0.5 ? -1 : 1); q[i * 4 + 2] = rng(); q[i * 4 + 3] = rng();
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(p, 4));
  g.setAttribute('aQ', new THREE.InstancedBufferAttribute(q, 4));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: BIT_VS, fragmentShader: BIT_FS, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// ---------- far skeins: chevrons of two-triangle goose strokes ----------
const SKEIN_VS = /* glsl */`attribute vec4 aSk; attribute vec4 aB;
  uniform vec3 uCamW; uniform float uTime, uShow, uPX, uCeil; uniform vec2 uFrontN;
  void main() {
    float h = aSk.w, spd = aB.z;
    vec2 hd = vec2(cos(h), sin(h)), rt = vec2(-hd.y, hd.x);
    vec2 c = aSk.xy * uPX + hd * spd * uTime;
    c = uCamW.xz + (fract((c - uCamW.xz) / uPX + .5) - .5) * uPX;
    float k = abs(aB.x), sg = aB.x < 0. ? -1. : 1.;
    float br = uTime * .35 + aB.w * 6.2832;
    vec2 o = -hd * k * (6.5 + .8 * sin(br + k)) + rt * sg * k * (5.6 + .7 * cos(br * .8 + k * 1.7));
    vec3 ctr = vec3(c.x + o.x, aSk.z + k * .7 + 2.5 * sin(br * 1.3 + k * .6), c.y + o.y);
    // rare: behind the closing front the skeins tighten into the second plane and are drawn by it
    float fd = dot(ctr.xz, uFrontN) - uCeil;
    float tight = 1. - smoothstep(0., 260., fd);
    ctr.y = mix(ctr.y, 119., tight * tight);
    float dist = distance(ctr, uCamW);
    float s = max(1.1, dist / 110.);
    float flap = sin(uTime * 10. * (.9 + .2 * aB.w) + aB.w * 40. + k) * (1. - tight);
    vec3 p = position;
    p.y += abs(p.z) * (.22 + .34 * flap);
    p.z *= 1. - .12 * flap * flap;
    p *= s;
    vec3 wp = ctr + vec3(p.x * hd.x - p.z * hd.y, p.y, p.x * hd.y + p.z * hd.x);
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    vec2 rel = abs(c - uCamW.xz) / uPX;
    if (uShow < .5 || max(rel.x, rel.y) > .46 || fd < 0.) ${CLIP}
  }`;
function makeSkeins(nSkein, rng, uniforms, baseHeading, echelon) {
  const sk = [], bb = [];
  for (let i = 0; i < nSkein; i++) {
    const x = rng(), z = rng(), alt = 30 + 146 * Math.pow(rng(), 2.6);
    // the first fifteen fly at the ring (the journey runs along +X), so some chevrons always point the way
    const h = i < 15 ? rng.range(-0.15, 0.15) : baseHeading + rng.gauss() * 0.35 + (rng() < 0.15 ? Math.PI * rng.range(0.6, 1.0) : 0);
    const spd = rng.range(26, 36), n = rng.int(4, 11), one = echelon && rng() < 0.6;
    for (let k = -n; k <= n; k++) {
      if (one && k < 0) continue;
      sk.push(x, z, alt, h); bb.push(k === 0 ? 0.001 : k, rng(), spd, rng());
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  // one stroke: nose, tail and two wing tips; a shallow V that flaps
  g.setAttribute('position', new THREE.Float32BufferAttribute([1.5, 0, 0, 0.35, 0, 0, -1.3, 0, -4.4, -1.3, 0, 4.4, -2.3, 0, 0, 0.5, 0, -0.45, 0.5, 0, 0.45], 3));
  g.setIndex([0, 1, 2, 0, 3, 1, 5, 6, 4]);
  g.setAttribute('aSk', new THREE.InstancedBufferAttribute(new Float32Array(sk), 4));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(bb), 4));
  g.instanceCount = sk.length / 4;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: SKEIN_VS, fragmentShader: BIT_FS, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// ---------- the deep shoal: ranks (and, in the rare event, the ranks that come down out of the second plane) ----------
// THE RANKS, a rule of the place. The loose fish stand in the tiling's own order, pulled apart: upright sheets of
// water (curtains) cross the avenue, a curtain's pitch apart, from before the entry to the hole, and in each curtain
// the fish stand nose to tail in ranks two rows deep, one rank above another with a row of clear water between them,
// from 30 m below the flown line's deepest up to just under the plane. All of them swim one way, along their curtain
// and up their own slope (uRank: the heading, +1 up or -1 down, metres a second), so a rank slides across the avenue
// and rises toward the plane together: seen from the route it is a band of the tiling stood on end, with black water
// where the geese will be. From one curtain to the next the ranks stand a step higher (uLat.w of the climb), so that
// at every depth some curtain has a rank: the water is full from the deep to the ceiling, on both sides of the line.
// The curtains are places: curtain c crosses the avenue (z = uFld.y) at x = uFld.x + c * uBoxS.y, the same wherever
// the eye is; a fish is drawn at its own size however far it is (a far rank is small by its distance and by nothing
// else). Along its curtain a rank reaches half of uBoxS.x to either side of the avenue; a fish that comes to that
// end, or to the top or the bottom of the climb, dwindles away whole and begins again at the other end. Where the sea
// is still unlaid (ahead of the locking front) the water belongs to the hero's own rising fish: the ranks keep under
// the laid ceiling.
// uBoxS: metres along the heading that a rank reaches (the climb's length), the curtains' pitch, the lowest height,
// the height climbed. uLat: places in a rank, curtains, the step along the heading from one curtain to the next (a
// share of the reach), the step in height (a share of the climb).
// THE RARE EVENT keeps its own rule, as it was: the ranks that come down out of the second plane are one period of
// the lattice (uBoxS: metres along the heading, metres across it, the lowest height, the height climbed) taken about
// the eye's place, three rows to a rank, dwindling whole with their distance; the fish that stand in it are marked
// (aS.w: their row, -1 for a fish that is not of it).
const SHOAL_VS = /* glsl */`attribute vec4 aS; attribute vec4 aR;
  uniform vec3 uCamW; uniform vec4 uBoxS, uRank, uLat; uniform vec2 uFld; uniform float uTime, uShow, uCeil, uDrop, uFront, uSize; uniform vec2 uFrontN;
  varying vec2 vQ; varying float vCov, vUp;
  ${TUBE_GLSL}
  void main() {
    float r1 = aR.x, r2 = aR.y, r3 = aR.z, c = aS.z;
    vec2 hd = uRank.xy, nr = vec2(-hd.y, hd.x);
    float cs, cn, n0, row;
    if (uDrop > .5) { cs = dot(uCamW.xz, hd); cn = dot(uCamW.xz, nr); n0 = c / uLat.y * uBoxS.y; row = aS.w * 6.5 * uSize; }
    else { vec2 P = vec2(uFld.x + uBoxS.y * c, uFld.y); cs = dot(P, hd); cn = dot(P, nr); n0 = cn; row = aS.y * uSize + uLat.w * c * uBoxS.w; }
    float sw = cs + (fract(((aS.x / uLat.x + uLat.z * c) * uBoxS.x + uRank.w * uTime - cs) / uBoxS.x + .5) - .5) * uBoxS.x;
    float nw = cn + (fract((n0 - cn) / uBoxS.y + .5) - .5) * uBoxS.y;
    float slope = uRank.z * uBoxS.w / uBoxS.x;
    float y = uBoxS.z + mod(row + sw * slope, uBoxS.w);
    // a curtain is alive: a slow wave runs along it, and every fish keeps a little of its own
    float ph = sw * .031 - uTime * .42 + c * 2.4;
    float na = nw + 2.6 * sin(ph) + (r3 - .5) * 2.4;
    vec3 ctr = vec3(hd.x * sw + nr.x * na, y + .7 * sin(uTime * .27 + r2 * 31.), hd.y * sw + nr.y * na);
    float fd = dot(ctr.xz, uFrontN) - uCeil;
    ctr.y = mix(ctr.y, 117.5, uDrop * (1. - smoothstep(0., 170., -fd)));
    // 10 m and more from the flown line: 13 m from a line 3 m under it, where the fish we ride swims, so the leader has its own water
    ctr = clearOf(ctr, 13., vec2(3., 0.) + (vec2(r3, r2) - .5) * .05);
    vec3 lp = position;
    float wv = (.10 + .34 * (1. - smoothstep(-4., 1.5, lp.x))) * sin(lp.x * 1.1 + uTime * (4.5 + 2. * r1) + r2 * 20.);
    wv += .25 * sin(uTime * 7. + r1 * 9.) * (1. - smoothstep(-2.2, -1.2, lp.z)) * step(-1., lp.x);
    vec3 bd = vec3(lp.x, lp.z, wv);
    float pit = atan(slope) + .05 * cos(uTime * .27 + r2 * 31.);       // nose along the climb
    bd = vec3(bd.x * cos(pit) - bd.y * sin(pit), bd.x * sin(pit) + bd.y * cos(pit), bd.z);
    float yaw = atan(hd.y, hd.x) + atan(2.6 * .031 * cos(ph));
    float cy = cos(yaw), sy = sin(yaw);
    bd = vec3(bd.x * cy - bd.z * sy, bd.y, bd.x * sy + bd.z * cy);
    // at the end of its curtain's reach a fish dwindles away whole (thinning it there left long hairlines); so does one
    // at the top or the bottom of the climb, and one that comes to the unlaid sea
    vec2 e2 = abs(vec2(sw - cs, nw - cn)) / uBoxS.xy * 2.;
    float es = 1. - smoothstep(mix(.84, .72, uDrop), .98, max(e2.x, e2.y));
    es *= smoothstep(0., 5., min(y - uBoxS.z, uBoxS.z + uBoxS.w - y)) * (1. - smoothstep(uFront - 34., uFront - 10., ctr.x));
    // the rare event's ranks, sent about the eye, dwindle whole with their distance too; the ranks of the deep do not
    float dist = distance(ctr, uCamW);
    vCov = mix(1., 1. - smoothstep(66., 330., dist), uDrop) * step(.02, es);
    es *= smoothstep(0., .2, vCov);
    vec3 wp = ctr + bd * es * uSize;
    vQ = position.xz;
    vUp = max(wp.y - uCamW.y + 1.5, uDrop);
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    if (uShow < .5 || vCov <= .001 || (uDrop > .5 && (fd > -6. || aS.w < -.5 || aS.x > uLat.x - .5 || c > uLat.y - .5))) ${CLIP}
  }`;
const shoalFS = (glsl) => /* glsl */`varying vec2 vQ; varying float vCov, vUp;\n${glsl}
  void main() {
    float fw = max(fwidth(vQ.x), fwidth(vQ.y));
    float aa = clamp(fw * .75, .002, .6);
    // a body seen edge-on carries no cuts (they would beat against the pixels): plain ivory and its key line
    float side = smoothstep(.12, .3, min(fwidth(vQ.x), fwidth(vQ.y)) / max(fw, 1e-5));
    float det = (1. - smoothstep(.07, .3, fw)) * side;
    float red;
    float sd = sdfAt(vQ);
    float tone = fishTone(vQ, sd, aa, det, 0., red);
    // a far fish is still a striped fish: where the tile's own scale rows fall under the pixels, the ribs are cut
    // wider apart, octave by octave of the pixel's own width (every other one narrows and goes), never closer than
    // five pixels nor thinner than a pixel and a half; the last of them go when the fish is some twenty pixels long
    float oc = max(0., log2(fw * 5. / .8)), fo = fract(oc), P = .8 * exp2(floor(oc));
    float ru = vQ.x + .42 * (vQ.y - .2) * (vQ.y - .2);
    float wr = max(.26 * P, 1.5 * fw);
    float ribs = max(lineT(ru, 2. * P, wr, aa), lineT(ru + P, 2. * P, wr * (1. - fo), aa) * step(1.5 * fw, wr * (1. - fo)));
    ribs *= smoothstep(-2.4, -2.0, vQ.x) * (1. - smoothstep(1.1, 1.5, vQ.x)) * smoothstep(2.5 * fw, 3.5 * fw, sd) * (1. - smoothstep(.9, 1.3, fw));
    tone = min(tone, 1. - ribs * side * smoothstep(.07, .3, fw));
    // depth is size and overlap: the fish's own ink key line (a pixel wide at the least) parts a far fish from the fish
    // behind it and from the ceiling
    // the rare event's far fish: a solid paper silhouette inside its key line
    float thin = 1. - smoothstep(.55, .97, vCov);
    float cw = max(.12, 1.6 * fw);
    tone = mix(tone, smoothstep(cw, cw + aa, sd), smoothstep(0., .45, thin));
    gl_FragColor = vec4(mix(uInk, uPaper, smoothstep(.3, .7, tone)), 1.);
  }`;
// ROWS: the row slots of a curtain, in rows of the climb (six to the climb): two ranks of two rows, a row of water between
const SHOAL_ROWS = [0, 1, 3, 4];
function makeShoal(fishGeo, ni, nc, rowPitch, rng, uniforms, glsl) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = fishGeo.index; g.setAttribute('position', fishGeo.getAttribute('position'));
  // nc curtains, in each SHOAL_ROWS rows of ni places along the heading; aS: the place (with a little of its own), the
  // row's height in metres of the tile's size, the curtain, the row it takes in the rare event (the first three rows)
  const NJ = SHOAL_ROWS.length, count = ni * NJ * nc, a = new Float32Array(count * 4), r = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) r[i] = rng();
  let k = 0;
  for (let c = 0; c < nc; c++) for (let j = 0; j < NJ; j++) for (let i = 0; i < ni; i++, k += 4) {
    a[k] = i + 0.10 * (r[k + 3] - 0.5); a[k + 1] = rowPitch * SHOAL_ROWS[j] + 0.5 * (r[k] - 0.5); a[k + 2] = c; a[k + 3] = j < 3 ? j : -1;
  }
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4));
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 4));
  g.instanceCount = count;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: SHOAL_VS, fragmentShader: shoalFS(glsl), side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// ---------- rafts: flocks of large geese beside the route that close wingtip to wingtip into floating patches of the
// tiling (the paper gaps between them are the fish), then break up row by row and stream onto the ring ----------
const RAFT_VS = /* glsl */`attribute float aKind; attribute vec4 aI; attribute vec4 aJ;
  uniform vec4 uRaft[${NRAFT}]; uniform vec4 uRaftB[${NRAFT}]; uniform vec3 uSeatR, uCamW, uAxis; uniform vec2 uRingR; uniform float uTime, uShow;
  varying vec2 vQ; varying float vKind, vKeel, vLock;
  void main() {
    int ri = int(clamp(aI.z, 0., ${NRAFT - 1}.) + .5);
    vec4 R = uRaft[ri];      // centre, heading
    vec4 B = uRaftB[ri];     // roll, lock, release (0: this raft is whole .. 1: all its birds are on the ring), size
    float r1 = aJ.x, r2 = aJ.y;
    float lx = B.y * 2.2 - 1.2 * aJ.w;                    // the lock runs through the raft as a straight front
    float w = clamp(B.z * 1.7 - .7 * aI.w, 0., 1.);      // the release: front rows first
    float lk = smoothstep(0., 1., lx) * (1. - smoothstep(0., .1, w));
    float e = w * w * (3. - 2. * w);
    // where it lands on the ring: a place on the annulus, at the size of the ring's own tiles
    float th = r1 * 6.2832, rr = mix(uRingR.x, uRingR.y, r2);
    vec3 T = uSeatR + vec3(-.6, rr * cos(th), rr * sin(th));
    vec3 hd0 = vec3(cos(R.w), 0., sin(R.w));
    vec2 dT = T.xz - R.xz;
    vec3 hd = normalize(mix(hd0, vec3(dT.x, 0., dT.y) / max(length(dT), 1e-3), .8 * sin(3.1416 * w)) + vec3(1e-4, 0., 0.));
    vec3 rt0 = vec3(-hd.z, 0., hd.x);
    float ro = B.x * (1. - e);
    vec3 rt = rt0 * cos(ro) - vec3(0., sin(ro), 0.);
    vec3 up = vec3(0., cos(ro), 0.) + rt0 * sin(ro);
    vec2 Lc = aI.xy;
    float unf = 1. - lk;
    // loose: a chevron at 1.6 times the cell spacing, every bird drifting on its own; locked: the lattice offset exactly
    vec2 loose = vec2(1.6 * Lc.x - .64 * abs(Lc.y) + 1.6 * sin(uTime * .7 + r1 * 40.), 1.6 * Lc.y + 1.1 * sin(uTime * .9 + r2 * 40.));
    vec2 ab = mix(loose, Lc, lk);
    vec3 ctr = R.xyz + hd * ab.x + rt * ab.y + up * (unf * 1.3 * sin(uTime * 1.1 + r1 * 17.));
    ctr = mix(ctr, T, e);
    // a released bird keeps about 11 m from the line of travel, by the rule the lifted geese of the plane obey
    vec3 dv = ctr - uCamW;
    float al = dot(dv, uAxis);
    vec3 perp = dv - uAxis * al + vec3(0., r2 - .3, r1 - .21) * .05;
    float pl = max(length(perp), 1e-3);
    ctr += perp / pl * (sqrt(pl * pl + 120.) - pl) * (1. - smoothstep(10., 42., abs(al))) * smoothstep(0., .1, w);
    float sc = mix(1., .3, smoothstep(.3, .9, w)) * B.w;
    vec3 lp = position;
    float sgn = lp.z < 0. ? -1. : 1., az = abs(lp.z);
    float beat = sin(uTime * 6.2832 * 1.5 * (.9 + .2 * r2) + r1 * 30.);
    float ang = (beat * .5 + .14) * unf;
    float arm = max(az - .9, 0.) * (1. + 1.25 * unf);
    float y = arm * sin(ang) - .22 * beat * unf + lp.y * unf * 1.5;
    float span = min(az, .9) + arm * cos(ang);
    float x = lp.x - unf * arm * .22;
    vec3 wp = ctr + sc * (x * hd + y * up + sgn * span * rt);
    // the fish in the gap behind this goose: there only while the raft is locked, in its exact cell
    if (aKind > .5) wp = R.xyz + hd * (Lc.x - 4. + lp.x) + rt * (Lc.y - 2.5 + lp.z);
    vQ = position.xz; vKind = aKind; vLock = lk;
    vKeel = (aKind < .5 && abs(lp.y) > 1e-4) ? 1. : 0.;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    if (uShow < .5 || w > .995 || (aKind > .5 && (lx < 1.03 || w > 0. || aJ.z < .5))) ${CLIP}
  }`;
const raftFS = (glsl) => /* glsl */`varying vec2 vQ; varying float vKind, vKeel, vLock;\n${glsl}
  void main() {
    float fx = fwidth(vQ.x), fz = fwidth(vQ.y), fw = max(fx, fz);
    float aa = clamp(fw * .75, .002, .6);
    float sdF = sdfAt(vQ), sg = -sdfAt(vQ + vec2(4., 2.5));
    float red, tone;
    if (vKind > .5) {
      tone = fishTone(vQ, sdF, aa, 1. - smoothstep(.07, .3, fw), 0., red);
    } else {
      float det = max((1. - smoothstep(.03, .10, fw)) * smoothstep(.12, .3, min(fx, fz) / max(fw, 1e-5)), vLock * (1. - smoothstep(.07, .3, fw)));
      tone = vKeel > .01 ? 0. : gooseTone(vQ, sg, aa, det, 0., 0., 0., red);
      // a paper key line while it flies free; locked, the bird's edge is the fish's own key line
      float kw = max(.12, min(aa * 1.5, .32));
      float key = (1. - smoothstep(kw - aa, kw + aa, sg)) * (1. - smoothstep(.85, 1., vLock));
      tone = max(tone, vKeel > .01 ? 0. : key);
    }
    gl_FragColor = vec4(mix(uInk, uPaper, smoothstep(.3, .7, tone)), 1.);
  }`;
function makeRafts(gooseGeo, fishGeo, uniforms, glsl, rng, fN) {
  const gp = gooseGeo.getAttribute('position').array, fp = fishGeo.getAttribute('position').array;
  const ng = gp.length / 3, nf = fp.length / 3;
  const pos = new Float32Array(gp.length + fp.length), kind = new Float32Array(ng + nf);
  pos.set(gp); pos.set(fp, gp.length); kind.fill(1, ng);
  const idx = Array.from(gooseGeo.index.array);
  for (const i of fishGeo.index.array) idx.push(i + ng);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  g.setIndex(idx);
  const n = RAFT_CELLS.reduce((q, [ni, nj]) => q + ni * nj, 0), aI = new Float32Array(n * 4), aJ = new Float32Array(n * 4);
  let k = 0;
  for (let r = 0; r < NRAFT; r++) {
    const [NI, NJ] = RAFT_CELLS[r], ext = Math.abs(fN.x) * 8 * (NI - 1) + Math.abs(fN.y) * 5 * (NJ - 1);
    for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++, k += 4) {
      const a = 8 * (i - (NI - 1) / 2), b = 5 * (j - (NJ - 1) / 2);
      aI[k] = a; aI[k + 1] = b; aI[k + 2] = r; aI[k + 3] = 1 - i / (NI - 1);
      aJ[k] = rng(); aJ[k + 1] = rng(); aJ[k + 2] = (i > 0 && j > 0) ? 1 : 0; aJ[k + 3] = clamp((a * fN.x + b * fN.y) / ext + 0.5, 0, 1);
    }
  }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
  g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: RAFT_VS, fragmentShader: raftFS(glsl), side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// ---------- rare: the second plane, 120 m overhead, closing behind a straight front ----------
const upperFS = (glsl) => /* glsl */`varying vec3 vP; uniform float uCeil; uniform vec2 uFrontN;\n${glsl}
  void main() {
    if (dot(vP.xz, uFrontN) - uCeil > 0.) discard;
    vec2 p = vP.xz / 3.;      // cut three times larger, so the interlock still reads from 110 m below
    float fx = fwidth(p.x), fz = fwidth(p.y), fw = max(fx, fz);
    float aa = clamp(fw * .75, .002, .6);
    float det = 1. - smoothstep(.07, .3, fw);
    float red, hole;
    float tone = tilingTone(p, aa, det, 1., vec2(0., 1.), red, hole);
    float e = clamp(.5 * min(fx, fz) / max(fw, 1e-5) * (fw * .75 / aa), .09, .5);
    float T = smoothstep(.5 - e, .5 + e, tone);
    // past the range where the interlock can be cut: straight lines parallel to the closing front, thinning to bare
    // paper with distance, so only the nearby tiling and the front itself are seen overhead (never rings)
    float w = max(smoothstep(.7, 1.7, fx), smoothstep(.7, 1.7, fz));
    float hx = dot(p, uFrontN);
    float fh = fwidth(hx);
    float dist = length(vP.xz - uCamL.xz);
    float fade = 1. - smoothstep(160., 380., dist);
    if (fade < .003) discard;
    float edge = 1. - smoothstep(4., 30., (uCeil - dot(vP.xz, uFrontN)) / 3.);       // the closing front: a heavy line
    float duty = max(.5 * fade, .8 * edge);
    float inkF = octLines(hx, fh, 8., duty * w);
    float inkG = octLines(hx, fh, 8., 1. - (1. - duty) * w);
    float ink = mix(1. - inkG, 1. - inkF, T);
    gl_FragColor = vec4(mix(uInk, uPaper, ink), 1.);
  }`;

// ---------- the mounts ----------
// Fish: the tile's own outline lofted into a body (so that at uFlat = 1 it is the flat tile again), with a
// waving dorsal fin in the accent and two beating pectoral fins. Local space: x forward, y dorsal, z lateral.
function fishMountGeometry(outline) {
  const n = outline.length, NS = 44, M = 8, pos = [], uv = [], kind = [], idx = [];
  const span = (x) => {
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < n; i++) {
      const a = outline[i], b = outline[(i + 1) % n];
      if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) { const z = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); lo = Math.min(lo, z); hi = Math.max(hi, z); }
    }
    return lo > hi ? [0, 0] : [lo, hi];
  };
  const fr = [-2, -1, -0.8, -0.4, 0, 0.4, 0.8, 1, 2];
  for (let s = 0; s <= NS; s++) {
    const x = -3.97 + 7.94 * s / NS, [lo, hi] = span(x);
    const bx = (x - 0.7) / 3.25, hb = Math.abs(bx) < 1 ? 1.22 * Math.sqrt(1 - bx * bx) : 0;
    for (const side of [1, -1]) for (let k = 0; k <= M; k++) {
      const z = k === 0 ? lo : k === M ? hi : clamp(fr[k] * hb, lo, hi);
      const wid = hb > 0 && Math.abs(z) < hb ? 0.5 * hb * Math.sqrt(1 - (z / hb) * (z / hb)) : 0;
      pos.push(x, z, side * Math.max(0.012, wid)); uv.push(0, 0); kind.push(0);
    }
  }
  const ring = 2 * (M + 1);
  for (let s = 0; s < NS; s++) for (let sd = 0; sd < 2; sd++) for (let k = 0; k < M; k++) {
    const a = s * ring + sd * (M + 1) + k, b = a + ring;
    if (sd === 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  // pectoral fins
  const U = 4, V = 2;
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
      const u = i / U, v = j / V;
      pos.push(1.9 - 1.0 * v - 1.1 * u - 0.35 * u * v, 0.35, side * (0.5 + 2.0 * u * (1 - 0.25 * v)));
      uv.push(u, v); kind.push(1);
    }
    for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
      const a = base + i * (V + 1) + j, b = a + V + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const FISH_MOUNT_VS = /* glsl */`attribute float aKind;
  uniform float uFlat, uSwim, uTime, uShow;
  varying vec2 vQ, vUv; varying vec3 vN, vV; varying float vBody, vKind;
  void main() {
    vec3 p = position;
    float lat = p.z * (1. - uFlat);
    float w = uSwim * (.04 + .30 * (1. - smoothstep(-4., 1.5, p.x))) * sin(p.x * 1.1 + uTime * 5.5);
    float fin = smoothstep(1.3, 1.9, p.y) * uSwim * .30 * sin(p.x * 2.4 - uTime * 4.2);
    float y = p.y;
    if (aKind > .5) {
      float arm = abs(p.z) - .5;
      y += arm * (.22 + .5 * sin(uTime * 5.2 - arm * .9)) * uSwim * (1. - uFlat);
      fin = 0.;
    }
    vec3 lp = vec3(p.x, y, lat + w + fin);
    vQ = p.xy; vUv = uv; vBody = abs(p.z); vKind = aKind;
    vec4 mv = modelViewMatrix * vec4(lp, 1.);
    vN = normalMatrix * normal; vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
    if (uShow < .5 || (aKind > .5 && uFlat > .97)) ${CLIP}
  }`;
const fishMountFS = (glsl) => /* glsl */`varying vec2 vQ, vUv; varying vec3 vN, vV; varying float vBody, vKind;
  uniform float uFlat;\n${glsl}
  void main() {
    float tone, red = 0.;
    if (vKind > .5) {
      float au = max(fwidth(vUv.y), 1e-4) * .75;
      float rays = lineT(vUv.y + vUv.x * .22, .2, .05 + au, au) * smoothstep(.12, .3, vUv.x);
      float eu = max(fwidth(vUv.x), 1e-4);
      float edge = min(min(vUv.y / max(au * 1.4, 1e-4), (1. - vUv.y) / max(au * 1.4, 1e-4)), (1. - vUv.x) / eu) ;
      tone = (1. - rays) * smoothstep(1.5, 2.5, edge);
    } else {
      float fw = max(fwidth(vQ.x), fwidth(vQ.y));
      float aa = clamp(fw * .75, .002, .6);
      float det = 1. - smoothstep(.07, .3, fw);
      float sd = sdfAt(vQ);
      tone = fishTone(vQ, sd, aa, det, 1., red);
      // while it swims the back is cut lightly (a few ribs and a spine line), so it reads as an ivory body
      float lw = max(.045, aa * 1.2);
      float bodyM = smoothstep(-2.6, -2.1, vQ.x) * (1. - smoothstep(2.0, 2.6, vQ.x)) * (1. - smoothstep(1.2, 1.32, abs(vQ.y)));
      float ribs = lineT(vQ.x + .42 * (vQ.y - .2) * (vQ.y - .2), .8, .07 + aa, aa) * smoothstep(.25, .5, abs(vQ.y - .9));
      float own = smoothstep(lw - aa, lw + aa, sd) * (1. - ribs * det);
      tone = mix(tone, own, bodyM * (1. - uFlat));
      float nl = max(dot(vN, vN), 1e-8), vl = max(dot(vV, vV), 1e-8);
      float ndv = abs(dot(vN, vV)) * inversesqrt(nl * vl);
      float sil = (1. - smoothstep(.13, .19, ndv)) * smoothstep(.04, .10, vBody) * (1. - uFlat);
      tone *= 1. - sil; red *= 1. - sil;
    }
    vec3 col = mix(uInk, uPaper, tone);
    gl_FragColor = vec4(mix(col, uAccent, red), 1.);
  }`;
// Goose: what we ride from the crossing on, seen from its back. Local space: x forward, y up, z lateral.
// The body is the cell's own box, drawn as the tile's goose while it lies in its cell and cut back to a bird as it
// unfolds: a back, a slim neck, a head and a bill. The wings are not the tile's flaps (from the seat those were two
// sheets of ink beside the lens that ran out of the lower corners): each is an arm and a hand in metres along the wing
// (s) and back from its leading edge (c), as the birds of the lift are made, set at the shoulders AHEAD of the seat and
// narrow, so that from the seat the whole chord is in the picture, feathers and trailing edge, and what the frame cuts
// is a wing. They beat about the shoulder; the hand follows the arm, bent down at the wrist, most on the way up.
// THE SEAT (EYE_GOOSE, in the build) is high and well behind the shoulders: 6.5 m behind the bird's middle and 5 m
// above its back. From there the bird is small and low in the picture: the head (cut wider than the tile's bill, with
// both eyes and a short bill in the accent) on its feathered neck, and the wings only when they are up. The stroke is
// deep (the arm swings from 0.08 rad under the level to 0.64 rad over it), so across one beat the picture changes: at
// the top of the stroke both wings stand fanned in the lower corners, at the bottom they are under the lower edge and
// only the neck, the head and the bill are seen. The bird's frame is the eye's own (see the build), so it leans with
// the camera's lean and stands at the same height in the picture at every place.
// These numbers are the mount's own form: the same at every place, on every seed, in every window.
const MOUNT_W = 'const float LI = 2.3, LO = 3.4, CW = 1.6;';       // metres at the tile's size: the arm, the hand, the chord at the shoulder
function gooseMountGeometry() {
  const pos = [], part = [], idx = [], LI = 2.3, LO = 3.4, CW = 1.6, NX = 8;
  for (let i = 0; i <= NX; i++) {                      // the body: the cell's box in strips, so the neck can nod
    const x = -4 + 8 * i / NX; pos.push(x, 0, -2.5, x, 0, 2.5); part.push(0, 0);
    if (i < NX) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const st = [0, LI * 0.5, LI, LI + LO * 0.25, LI + LO * 0.5, LI + LO * 0.75, LI + LO];
  for (const sd of [-1, 1]) {                         // a wing: (along it, back from the leading edge, side); the hand's panel narrows to the point
    const k0 = pos.length / 3;
    st.forEach((sv, i) => {
      pos.push(sv, 0, sd, sv, sv <= LI ? CW : CW * (1 - (sv - LI) / LO), sd); part.push(1, 1);
      if (i < st.length - 1) { const k = k0 + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setIndex(idx);
  return g;
}
const GOOSE_MOUNT_VS = /* glsl */`attribute float aPart;
  uniform float uUnfold, uBeat, uShow;
  varying vec2 vQ; varying float vPart;
  ${MOUNT_W}
  void main() {
    float beat = sin(uBeat);
    float wu = smoothstep(.1, .7, uUnfold);       // the wings come out of the body as the cell is cut back to a bird
    vec3 B;
    if (aPart < .5) {
      B = vec3(position.x, .26 * wu, position.z);
      B.y += smoothstep(1.2, 4., position.x) * (.10 * sin(uBeat - 1.3) - .12);     // the head nods a little after the beat
      vQ = position.xz;
    } else {
      float s = position.x, c = position.y;
      float a1 = .28 + .36 * beat, a2 = a1 - .06 - .16 * (1. + cos(uBeat));
      vec3 W = normalize(vec3(.20, sin(a1), cos(a1))) * min(s, LI) + normalize(vec3(-.52, sin(a2), cos(a2))) * max(s - LI, 0.)
        + vec3(-.94, -.34, 0.) * c;                // the chord is set leading edge up: the back of the wing faces the seat
      B = vec3(.95, 0., .22) + W * wu; B.z *= position.z;
      vQ = position.xy;
    }
    B.y -= .22 * beat * uUnfold;                  // the body rides down as the wings go up
    vec4 wp = modelMatrix * vec4(B, 1.);
    if (cameraPosition.y > 0.) wp.y = max(wp.y, .04);     // over the plane nothing of it dips through the plane: until we are a seat's height up it lies on it
    vPart = aPart;
    gl_Position = projectionMatrix * viewMatrix * wp;
    if (uShow < .5 || (aPart > .5 && wu < .01)) ${CLIP}
  }`;
const gooseMountFS = (glsl) => /* glsl */`varying vec2 vQ; varying float vPart; uniform float uUnfold;\n${glsl}
  ${MOUNT_W}
  float smax(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return max(a, b) + h * h * k * .25; }
  void main() {
    float fx = fwidth(vQ.x), fz = fwidth(vQ.y), fw = max(fx, fz);
    float aa = clamp(sqrt(fx * fz) * .9, .002, .08);       // crisp cuts even where a sheet is seen steeply
    float edge, cuts, bill = 0., eye = 0.;
    if (vPart < .5) {
      float sg = -sdfAt(vQ + vec2(4., 2.5));
      float x = vQ.x, ay = abs(vQ.y);
      // once it has unfolded, the tile is cut back to a bird: a slim neck, a head and a bill ahead of an oval back with
      // a short fanned tail (as a flat cell it is the whole tile)
      // (the head and the bill: the tile's long bill is cut back to a goose's short one as the bird unfolds, the head
      // set forward on the neck: hx is the head's middle, bx the root of the bill, tx its tip)
      float un = smoothstep(.15, .6, uUnfold), hx = mix(2.6, 3.0, un), bx0 = mix(2.85, 3.3, un), tx = mix(4.02, 3.9, un);
      float hd = (x - hx) / .36;
      float hw = mix(.21, .26, un) + .37 * exp(-hd * hd);
      hw = min(hw, mix(.52, .56, un) * (tx - x) / (tx - bx0)) * step(-1., x);
      float bx = (x + .9) / 2.;
      hw = smax(hw, .74 * sqrt(max(1. - bx * bx, 0.)) * mix(1., .7, smoothstep(-1.4, 1., x)), .3);     // a slim back that narrows to the shoulders
      hw = max(hw, step(-3.6, x) * step(x, -2.4) * mix(.42, .80, clamp((-2.4 - x) / 1.2, 0., 1.)));
      hw += (1. - smoothstep(.15, .6, uUnfold)) * 6.;
      edge = min(sg + 1.2 * un, hw - ay);       // unfolded, the bird's outline is its own: the head is wider than the tile's bill was
      // feather scallops in staggered rows over the back, long primaries toward the tips of the tile's own wings
      // each family of cuts is kept only where its own spacing is resolved along its own direction
      float r = x + ay * .55;
      float pc = ay + .42 * x;
      float rn = x + ay * .9;
      float fr = fwidth(r), fp = fwidth(pc), fn = fwidth(rn);
      float dS = 1. - smoothstep(.11, .19, fr), dP = 1. - smoothstep(.09, .15, fp), dN = 1. - smoothstep(.07, .11, fn), dT = 1. - smoothstep(.05, .08, fz);
      float row = floor(r / .58);
      float fc = fract(ay / .5 + .5 * mod(row, 2.)) - .5;
      float scal = lineT(r - .58 * 1.5 * fc * fc, .58, .05 + aa * .5, max(aa, .6 * fr)) * dS;
      float primM = max(smoothstep(1.3, 1.5, ay) * step(x, .1 + .2 * ay), (1. - dS) * smoothstep(.9, 1.1, ay));
      float prim = lineT(pc, .44, max(.05 + aa * .4, 1.6 * fp), max(aa, .6 * fp)) * dP;
      float body = smoothstep(-3., -2.5, x) * (1. - smoothstep(1.0, 1.5, x));
      float tail = lineT(vQ.y, .24, .05 + aa * .4, aa) * (1. - smoothstep(-2.9, -2.6, x)) * dT;
      // neck feathers: the same staggered scallops, cut finer
      float rowN = floor(rn / .34);
      float fn2 = fract(ay / .24 + .5 * mod(rowN, 2.)) - .5;
      float ring = lineT(rn - .34 * 1.5 * fn2 * fn2, .34, .045 + aa * .5, max(aa, .6 * fn)) * dN * step(.9, x) * step(x, hx - .3) * (1. - smoothstep(.2, .5, ay - .12 * (2.3 - x)));
      cuts = max(max(mix(scal, prim, primM) * body, tail), ring);
      // bill and eye in the accent
      bill = smoothstep(bx0, bx0 + 2. * aa, x);
      eye = 1. - smoothstep(.09 - aa, .09 + aa, length(vec2(x - hx + .08, ay - .25)));
    } else {
      // a wing. The arm: the coverts as two rows of scallops over the leading half, one line where they end, and
      // behind it the secondaries, cut apart, their tips the scalloped trailing edge. The hand: the primaries, a fan
      // of seven fingers from the wrist, the outermost along the leading edge to the wing's point, parted at their tips
      float s = vQ.x, c = vQ.y;
      float fs = fwidth(s), fcw = fwidth(c);
      if (s < LI) {
        float ch = CW * mix(.94, .86, s / LI), ft = 2. * fract(s / .46) - 1.;
        edge = min(c - .02, ch * (1. - .13 * ft * ft) - c);
        float row = floor(c / .36);
        float fq = fract(s / .46 + .5 * mod(row, 2.)) - .5;
        float scal = lineT(c - .36 * 1.4 * fq * fq - .13, .36, .05 + aa * .5, max(aa, .6 * fcw)) * step(.2, c) * step(c, .55 * ch) * (1. - smoothstep(.10, .17, fcw));
        float fl = lineT(s, .46, .05 + aa * .5, max(aa, .6 * fs)) * step(.62 * ch, c) * (1. - smoothstep(.11, .17, fs));
        float cl = (1. - smoothstep(.035, .035 + aa, abs(c - .60 * ch))) * (1. - smoothstep(.10, .16, fcw));
        cuts = max(max(scal, fl), cl);
      } else {
        vec2 d = vec2(s - LI, c);
        float rho = max(length(d), 1e-3), fa = atan(d.y, d.x) * 4.4563;     // 7 fingers over the quarter turn
        float ft = 2. * fract(fa) - 1., ff = fwidth(fa), f2 = ft * ft;
        float rt = LO * CW / (CW * d.x / rho + LO * d.y / rho);              // the panel's own edge along this ray
        edge = min(c - .02, .98 * rt * (1. - .20 * f2 - .16 * f2 * f2 * f2) - rho);
        float m = .2244 * rho;                                                // metres to one finger at this radius
        cuts = lineT(fa, 1., (.05 + aa * .5) / m, max(aa / m, .6 * ff)) * step(.9, rho) * (1. - smoothstep(.22, .33, ff));
        cuts = max(cuts, (1. - smoothstep(.035, .035 + aa, abs(rho - rt * (.42 - .06 * f2)))) * (1. - smoothstep(.10, .16, fwidth(rho))));
      }
    }
    if (edge < 0.) discard;
    cuts *= smoothstep(.15, .22, edge);
    // paper key line, so the black bird stands off the black cells beneath it
    float key = 1. - smoothstep(.07 - aa, .07 + aa, edge);
    float tone = max(cuts, key);
    float red = max(bill * (1. - key), eye);
    vec3 col = mix(uInk, uPaper, tone * (1. - eye));
    gl_FragColor = vec4(mix(col, uAccent, red), 1.);
  }`;

// ---------- the lift: the plane gives up its geese in ranks ----------
// The rule is the hero's (liftLane in src/parts/figure-and-ground.js), a rule of the place in metres of the plane: lanes
// along the birds' heading on both sides of the ring's avenue, and on every lane every second lift-off front carries a
// rank (the fronts between carry the ranks of the lanes between). Along such a front the lane's three files each give
// one goose in five: the goose thickens in its cell as the front passes (the hero's own goose of that cell is not
// drawn: this bird is that goose), leaves the plane, and as it leaves it changes from the tile's squat goose into a
// flying goose's own outline: a long neck and a small head far ahead of the wings, two long narrow wings that beat
// (an arm and a hand: seen from behind a wide M at the top of the stroke, an arch at the bottom), a short tail. It
// climbs, pitched to its climb, flying at 40 m a second along its heading (its front moves 45 to 48 m a second
// along that heading, so every bird trails its front by 5 to 8 m a second), grows as it climbs (as the creatures of
// the ring grow outward from its rim) and levels out at the top. So a rank is a banner of geese three abreast that
// stands from the plane (flat pattern the size of the tiles at its foot) to some 60 m (whole birds five times the
// tile at its top) and trails behind its front. Within reach of the ring a bird leans toward a point 24 m beside
// the ring: that point is taken once, from its cell; the lean grows as the bird climbs through the 26 m above the
// ring's height and is then held, so the bird swings about its cell by up to some 55 degrees while the lean grows.
// It flies at most some 160 m along its heading, so it does not circle the ring, and only birds from cells within
// that of the ring come to it at all. Every bird is its cell's: which cell
// a slot draws is found from the front, and everything a bird is comes from its cell.
// One bird is twelve triangles of flat ink, each cut to its outline in the fragment shader with a paper key line:
// the body seen from above (the cell's own box: the tile's goose by its signed distance while it lies in its cell),
// two wings of an arm and a hand, the body seen from the side (a keel) and the body seen from behind (a hull).
// A bird fades by metres from the eye, as the hero's geese do, taken by its own size: beyond 110 m for each tile's
// length it has grown to it is drawn smaller, whole, down to half its size at about 150 m for each, and beyond that
// it is not drawn. So a far bird appears at half size, in mid-air once its growth exceeds its distance / 150 m (a far
// rank has no foot), and every bird, the full-grown one too, ends its flight by shrinking to half its size and is
// then not drawn.
// The lift's numbers that both the shader and the count of what is sent (makeLift) read are written once, here
// (the hero's liftPicked in the parts file keeps its own copy of the cell and file numbers and must change with them):
// metres between a file's giving cells and between a lane's files; the fade (metres from the eye for each tile's
// length) and the size below which a bird is not drawn; the growth (1 + min(rise, growTo) / growBy); the fan of the
// files (metres a file for each tile's size grown).
const LIFT_N = { cell: 40, file: 10, fade: [110, 190], cut: 0.5, growTo: 44, growBy: 10, fan: 14 };
const glf = (x) => (Number.isInteger(x) ? x + '.' : String(x));       // a number written as a GLSL float
const LIFT_W = 'const float LI = 2.5, LO = 4.0, CW = 2.5;';       // metres at the tile's size: the arm, the hand, the chord's panel
const liftVS = (glsl) => /* glsl */`attribute vec4 aL; attribute float aQ; attribute float aP;
  uniform vec4 uLiftC;     // birds a file holds at once, speed forward (m/s), climb (m over the first second), second at which it begins to level
  uniform vec3 uLiftS;     // what is sent: the lanes' reach to the side of the eye (+ the lanes' larger offset), the radius of the lift's disc (2550 m, 50 m inside the plane's edge) squared, lanes a side
  varying vec2 vQ; varying float vPart, vUnf;
  ${glsl}
  ${LIFT_W}
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uLiftA.z) * 43758.5453); }
  void main() {
    // WHAT IS SENT: a rule of what is sent, not of what is seen. The rule of the place (which cell gives a bird and
    // everything that bird is) reads nothing of it. No bird is drawn further from the eye than the fade's cut at full
    // growth, so slots are made (makeLift) only for the lanes and the rank fronts within that reach of the eye's place,
    // counted outward from the low edge of that box about the eye: aL.x is the lane's place in it, aL.y the rank
    // front's on its file. They are the same birds in the same cells at the same ages as when every lane and every
    // front of the whole plane had a slot; the slots that hold no bird of the plane are clipped as before.
    float n = ceil((cameraPosition.z - uLiftS.x) / uLiftA.y) + aL.x;       // lanes numbered across the avenue: 0, 1, .. on the +z side, -1, -2, .. on the -z side
    float side = n < 0. ? -1. : 1., i = n < 0. ? -n - 1. : n;
    float z = side * (uLiftA.x + uLiftA.y * i + ${glf(LIFT_N.file)} * aL.z);
    // the lane's rank fronts are every uLiftB.z-th front; where the one this slot serves crosses this file
    float c0 = mod(-(i + (side > 0. ? uLiftB.y : uLiftB.x)), uLiftB.z);
    float Dx = uLiftB.z * uWave.w / uWave.x;
    float X0 = (uWave.z - c0 * uWave.w - uWave.y * z) / uWave.x;
    // a file's rank fronts are those on its chord of the lift's disc (hc: half of it), Qn of them, as before; the
    // slot's own is counted from the eye: the first at or behind aQ metres ahead of it, then every next one back
    float hc = sqrt(max(uLiftS.y - z * z, 0.)), Qn = max(1., ceil(2. * hc / Dx)), jhi = floor((X0 + hc) / Dx);
    float j = ceil((X0 - cameraPosition.x - aQ) / Dx) + aL.y;
    float xf = X0 - j * Dx;
    // the file's giving cells stand 40 m apart: this slot draws the aL.w-th of them behind the front
    float x0 = 4. + 8. * liftPick(i, side);
    float cx = x0 + ${glf(LIFT_N.cell)} * (floor((xf - x0) / ${glf(LIFT_N.cell)}) - aL.w);
    float tt = (xf - cx) * uWave.x / uLiftB.w;           // seconds since the front passed the cell
    float life = uLiftC.x * ${glf(LIFT_N.cell)} * uWave.x / uLiftB.w;
    float h1 = h21(vec2(cx, z)), h2 = h21(vec2(z, cx));
    float T0 = .8 + .25 * h1;                             // it thickens in its cell as the front passes and leaves the plane a little later
    float tf = max(tt - T0, 0.);
    float swell = smoothstep(0., .3, tt), unfold = smoothstep(T0 - .1, T0 + .4, tt);   // its wings are out as it leaves the plane
    float run = uLiftC.y * (tf - .5 * (1. - exp(-tf / .5)));
    // the climb steepens to uLiftC.w seconds, then eases out level over the next second or so
    float tb = uLiftC.w, tc = min(tf, tb), ue = max(tf - tb, 0.), mb = uLiftC.z * 1.8 * pow(tb, .8);
    float rise = uLiftC.z * pow(tc, 1.8) + mb * .8 * (1. - exp(-ue / .8));
    float vr = tf < tb ? uLiftC.z * 1.8 * pow(tf + .02, .8) : mb * exp(-ue / .8);
    float pit = (atan(vr, uLiftC.y * (1. - exp(-tf / .5)) + .5) + .5 * exp(-ue / .8)) * smoothstep(0., .4, tf);   // pitched to its climb and steeper than its path while it labours up; it levels as its path does
    // it grows as it climbs, as the creatures of the ring grow outward from its rim: the tile's size at the plane,
    // 5.4 times that from 44 m up, and the three files open like a fan, away from the avenue, to keep wingtip to
    // wingtip
    float grow = 1. + min(rise, ${glf(LIFT_N.growTo)}) / ${glf(LIFT_N.growBy)};
    // the ring's pull, a rule of the ring's place: a goose from a cell before the ring and within its reach leans,
    // once it is above the ring's own height, toward a point 24 m to one side of the ring (that point is taken
    // once, from its CELL; the lean grows through the 26 m above the ring's height and is then held; the bird does
    // not circle the ring), so the tops of the ranks lean in over the ring and the air before the
    // ring stays clear. The reach (uLiftR.w, 520 m) is measured from the ring's own seat to the bird's cell, never to
    // the eye; the pull is full inside .45 of it (234 m) and fades out to the reach. Both are typed numbers, not
    // derived from the ring's size, the fronts' spacing or the route's length.
    vec2 toR = uLiftR.xz - vec2(cx, z);
    float dR = max(length(toR), 1.);
    vec2 aim = normalize(toR + 24. * vec2(-toR.y, toR.x) / dR);
    float pull = (1. - smoothstep(.45 * uLiftR.w, uLiftR.w, dR)) * smoothstep(30., 110., toR.x) * smoothstep(uLiftR.y, uLiftR.y + 26., rise);
    vec2 dir = normalize(mix(vec2(1., 0.), aim, .85 * pull));
    vec2 sw = swellAt(vec2(cx, z));
    vec3 ctr = vec3(cx + sw.x + dir.x * run, rise, z + sw.y + dir.y * run + side * ${glf(LIFT_N.fan)} * (aL.z + 1.) * (grow - 1.));
    // the bird in its own frame (x ahead, y up, z to its side), by part
    vec3 B;
    if (aP < .5) { B = vec3(position.x, 0., position.z); vQ = position.xz; }
    else if (aP < 2.5) {
      // a wing: the arm beats about the shoulder, the hand follows it, bent down at the wrist (most on the way up)
      // and swept back; the chord is set leading edge up, so the wing is a band of ink from behind as from below
      float ph = uTime * 6.2832 * 1.5 * (.9 + .2 * h2) + h1 * 40.;
      float a1 = .30 + .65 * sin(ph), a2 = a1 - .5 - .35 * (1. + cos(ph));
      vec3 W = normalize(vec3(.25, sin(a1), cos(a1))) * min(position.x, LI) + normalize(vec3(-.7, sin(a2), cos(a2))) * max(position.x - LI, 0.)
        + vec3(-.9, -.436, 0.) * position.y;
      B = vec3(1.1, .18, .5) + W * unfold; B.z *= position.z;
      vQ = position.xy;
    }
    else if (aP < 3.5) { B = vec3(position.x, position.y * swell * (.4 + .6 * unfold), 0.); vQ = position.xy; }
    else { B = vec3(-.4, position.y * unfold, position.z * unfold); vQ = position.zy; }
    B.y += .05 + .5 * swell;
    // pitched about its tail, which keeps to the path
    float cp = cos(pit), sp = sin(pit);
    vec3 b = vec3((B.x + 3.5) * cp - B.y * sp - 3.5, (B.x + 3.5) * sp + B.y * cp, B.z);
    vec2 hd = normalize(mix(vec2(1., 0.), dir, smoothstep(0., .8, tf)));
    // every bird, the full-grown one too, ends its flight by shrinking, whole, to half its size and is then not
    // drawn; one far from the eye for its size is drawn smaller in the same way (metres from the eye, as the hero's
    // geese fade) and is not drawn where that would be under half its size, so a far bird appears at half size: no specks
    float sc = (1. - smoothstep(.86, 1., tt / life)) * (1. - smoothstep(${glf(LIFT_N.fade[0])}, ${glf(LIFT_N.fade[1])}, distance(ctr, cameraPosition) / grow));
    vec3 wp = ctr + sc * grow * vec3(b.x * hd.x - b.z * hd.y, b.y, b.x * hd.y + b.z * hd.x);
    wp.y = max(wp.y, .03);                                // nothing dips through the plane
    vPart = aP; vUnf = unfold;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
    if (uLiftA.w < .5 || tt < 0. || tt >= life || sc < ${glf(LIFT_N.cut)} || (aP > .5 && aP < 2.5 || aP > 3.5) && unfold < .01 || cx * cx + z * z > 6.5e6) ${CLIP}
    if (i >= uLiftS.z || j > jhi || j <= jhi - Qn) ${CLIP}     // a slot of the box about the eye that holds no lane or no rank front of the plane
  }`;
const liftFS = (glsl) => /* glsl */`varying vec2 vQ; varying float vPart, vUnf;\n${glsl}
  ${LIFT_W}
  float seg(float x, float a, float b) { return step(a, x) * step(x, b); }
  void main() {
    float fx = fwidth(vQ.x), fz = fwidth(vQ.y), fw = max(fx, fz);
    float aa = clamp(fw * .75, .002, .6);
    float ac = clamp(sqrt(fx * fz) * .9, .002, .3);       // for the cuts: crisp where a part is seen steeply
    float edge, cuts = 0.;
    if (vPart < .5) {
      // the body from above. Flat in its cell it is the whole tile's goose; as it leaves it is a flying goose's own
      // outline: body, a long slim neck, a small head and a bill, a short fanned tail
      float x = vQ.x, ay = abs(vQ.y);
      float bx = (x + .9) / 1.95, hx = (x - 3.3) / .5;
      float e = .98 * sqrt(max(1. - bx * bx, 0.));
      e = max(e, seg(x, .4, 3.3) * mix(.38, .26, clamp((x - .6) / 2.6, 0., 1.)));
      e = max(e, .44 * sqrt(max(1. - hx * hx, 0.)));
      e = max(e, step(3.6, x) * .20 * clamp((4.02 - x) / .42, 0., 1.));
      e = max(e, seg(x, -3.5, -2.3) * mix(.40, .75, clamp((-2.3 - x) / 1.2, 0., 1.)));
      edge = mix(-sdfAt(vQ + vec2(4., 2.5)), min(e - ay, x + 3.5), smoothstep(0., .6, vUnf));
      // cuts, each kept only while it is three pixels or more: a ring at the foot of the neck, a crescent over the
      // rump, the tail's fan (no rows of scallops over the back: on a body they are a fish's scales)
      float ring = (1. - smoothstep(.07, .07 + aa, abs(x - 1.05))) * (1. - smoothstep(.05, .09, fx));
      float rump = (1. - smoothstep(.08, .08 + aa, abs(x + 2.0 + .5 * ay * ay))) * step(-2.5, x) * (1. - smoothstep(.06, .10, fx));
      float tail = lineT(vQ.y, .22, .05 + ac * .4, ac) * step(x, -2.55) * (1. - smoothstep(.05, .073, fz));
      cuts = max(max(rump, ring), tail);
    } else if (vPart < 2.5) {
      // a wing in metres along it (s) and back from its leading edge (c). The arm: a broad band whose trailing edge
      // is the secondaries' tips. The hand: the primaries, a fan of seven fingers that spread from the wrist, the
      // outermost along the leading edge to the wing's point, the innermost meeting the arm
      float s = vQ.x, c = vQ.y, hand = step(LI, s);
      float fsw = fwidth(s), fcw = fwidth(c);
      if (hand < .5) {
        float ch = mix(2.3, 2.0, s / LI), ft = 2. * fract(s / .5) - 1.;
        edge = min(c - .03, ch * (1. - .16 * ft * ft) - c);
        // cuts: between the feathers (the rear of the chord only), and one line where the coverts end
        float fl = lineT(s, .5, .05 + ac * .5, max(ac, .6 * fsw)) * step(.64 * ch, c) * (1. - smoothstep(.11, .17, fsw));
        cuts = max(fl, (1. - smoothstep(.04, .04 + aa, abs(c - .50 * ch))) * (1. - smoothstep(.10, .16, fcw)));
      } else {
        vec2 d = vec2(s - LI, c);
        float rho = max(length(d), 1e-3), fa = atan(d.y, d.x) * 4.4563;     // 7 fingers over the quarter turn
        float ft = 2. * fract(fa) - 1., ff = fwidth(fa);
        float rt = LO * CW / (CW * d.x / rho + LO * d.y / rho);              // the panel's own edge along this ray
        edge = min(c - .03, .98 * rt * (1. - .28 * ft * ft) - rho);
        float m = .2244 * rho;                                                // metres to one finger at this radius
        cuts = lineT(fa, 1., (.05 + ac * .5) / m, max(ac / m, .6 * ff)) * step(1.0, rho) * (1. - smoothstep(.22, .33, ff));
      }
    } else if (vPart < 3.5) {
      // the body from the side
      float x = vQ.x, y = vQ.y;
      float bx = (x + .9) / 1.95, hx = (x - 3.3) / .5;
      edge = .70 * sqrt(max(1. - bx * bx, 0.)) - abs(y + .16) - step(1., abs(bx));
      edge = max(edge, mix(-1., .27 - abs(y - .03 * (x - .6)), seg(x, .4, 3.3)));
      edge = max(edge, .38 * sqrt(max(1. - hx * hx, 0.)) - abs(y - .09) - step(1., abs(hx)));
      edge = max(edge, mix(-1., .15 * (4.02 - x) / .42 - abs(y - .05), step(3.6, x)));
      edge = max(edge, mix(-1., .12 - abs(y), seg(x, -3.5, -2.3)));
    } else {
      // the body from behind
      edge = (1. - length(vec2(vQ.x / .98, (vQ.y + .16) / .72))) * .72;
    }
    // the silhouette, one pixel wide across the edge itself
    float cov = clamp(edge / max(.75 * fwidth(edge), 1e-4) + .5, 0., 1.);
    if (cov <= 0.) discard;
    cuts *= smoothstep(.15, .22, edge) * smoothstep(.2, .7, vUnf);
    // a paper key line round the body and the wings, so black over black and over the plane still reads as birds
    float kw = max(.09, min(aa * 1.5, .32));
    float tone = vPart > 2.5 ? 0. : max(cuts, 1. - smoothstep(kw - aa, kw + aa, edge));
    gl_FragColor = vec4(mix(uInk, uPaper, smoothstep(.3, .7, tone)), cov);
  }`;
function makeLift(uniforms, glsl, A, B, R) {
  const pos = [], part = [], idx = [], LI = 2.5, LO = 4.0, CW = 2.5;
  const quad = (p, a, b, c, d) => { const k = pos.length / 3; pos.push(...a, ...b, ...c, ...d); part.push(p, p, p, p); idx.push(k, k + 2, k + 1, k, k + 3, k + 2); };
  quad(0, [-4, 0, -2.5], [4, 0, -2.5], [4, 0, 2.5], [-4, 0, 2.5]);                       // the body from above: the cell's box
  for (const sd of [-1, 1]) {
    quad(1, [0, 0, sd], [LI, 0, sd], [LI, CW, sd], [0, CW, sd]);                          // the arm: (along, back from the leading edge, side)
    const k = pos.length / 3; pos.push(LI, 0, sd, LI + LO, 0, sd, LI, CW, sd); part.push(2, 2, 2); idx.push(k, k + 1, k + 2);   // the hand
  }
  quad(3, [-3.6, -1.02, 0], [4.1, -1.02, 0], [4.1, 0.7, 0], [-3.6, 0.7, 0]);           // from the side
  quad(4, [0, -1.02, -1.2], [0, -1.02, 1.2], [0, 0.7, 1.2], [0, 0.7, -1.2]);         // from behind
  // WHAT IS SENT (a rule of what is sent, not of what is seen; see liftVS). Slots are made for a box about the eye's
  // place that holds every bird that can be drawn, and for no more. All of it follows from the lift's own numbers:
  //   D     no bird is drawn further from the eye than this: the fade's cut at full growth
  //   run   a bird flies no further than this from its cell (its speed forward times its life)
  //   side  a bird is never further than this to the side of its lane's centre line: the file's pitch, the swell,
  //         its run (the ring's pull can turn it) and the fan of the outer file at full growth
  //   back  the cells of a file that hold a bird lie within this behind their front; a bird never flies ahead of its
  //         front by more than `ahead` (nothing while it is slower along its heading than its front; its heading
  //         never turns back, since the pull works only on cells more than 30 m before the ring and aims 24 m beside it)
  // Lanes: every lane within D + side of the eye to either side; they stand A.y apart with one of two offsets (the
  // two sides of the avenue), so NL of them. Rank fronts of a file: for the lane's place k in the box, the nearest
  // any of its birds can be to the eye sideways gives the half-chord hx of the eye's disc there; the fronts within
  // hx + back ahead of the eye and hx + ahead behind it, Dx apart. M birds a front. Nested as the slots were (lane,
  // file, front, bird); the lanes now run across the avenue and a file's fronts from ahead of the eye backward;
  // birds pressed into the plane keep their order.
  const N = LIFT_N, wave = uniforms.uWave.value, C = uniforms.uLiftC.value, M = C.x, Dx = B.z * wave.w / wave.x;
  let t0 = 0, t1 = 1;
  for (let k = 0; k < 50; k++) { const t = (t0 + t1) / 2; if (1 - t * t * (3 - 2 * t) > N.cut) t0 = t; else t1 = t; }
  const growMax = 1 + N.growTo / N.growBy, D = (N.fade[0] + (N.fade[1] - N.fade[0]) * t1) * growMax;
  const life = M * N.cell * wave.x / B.w, run = C.y * life, swell = Math.abs(uniforms.uSwell.value.z);
  const sideR = N.file + swell + run + N.fan * 2 * (growMax - 1);
  const back = M * N.cell, ahead = Math.max(0, C.y - B.w / wave.x) * life;
  const offMax = Math.max(A.x, A.y - A.x), offMin = Math.min(A.x, A.y - A.x), Rz = D + sideR;
  const NL = Math.ceil((2 * Rz + offMax - offMin) / A.y) + 1;
  let lanes = 0; while (A.x + A.y * lanes + N.file < R) lanes++;                           // the lanes a side that stand on the lift's disc
  uniforms.uLiftS = { value: new THREE.Vector3(Rz + offMax, R * R, lanes) };
  const aL = [], aQ = [];
  for (let k = 0; k < NL; k++) {
    const lo = -Rz - (offMax - offMin) + A.y * k, hi = -Rz + A.y * (k + 1);                // where the lane's centre line can lie, from the eye
    const near = Math.max(0, Math.max(lo, -hi, 0) - sideR);                                // the nearest its birds can be to the eye sideways
    if (near >= D) continue;
    const hx = Math.sqrt(D * D - near * near), NQ = Math.floor((2 * hx + back + ahead + 2 * swell) / Dx) + 1;
    for (let f = -1; f <= 1; f++) for (let q = 0; q < NQ; q++) for (let m = 0; m < M; m++) { aL.push(k, q, f, m); aQ.push(hx + back + swell); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(part, 1));
  g.setIndex(idx);
  g.setAttribute('aL', new THREE.InstancedBufferAttribute(new Float32Array(aL), 4));
  g.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(aQ), 1));
  g.instanceCount = aL.length / 4;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: liftVS(glsl), fragmentShader: liftFS(glsl), side: THREE.DoubleSide, alphaToCoverage: true }));
  m.frustumCulled = false; m.name = 'figure-and-ground-lift';
  return m;
}

export default {
  id: 'figure-and-ground',
  name: 'Figure and Ground',
  category: 'sky',
  media: ['underwater', 'air'],
  weirdness: 0.95,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), detail = ctx.quality?.detail ?? 1, rare = !!vary.rare;
    const pick = rng.pick(['day', 'day', 'golden', 'rain', 'night']);
    const edition = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'golden' : vary.hour === 'day' ? 'day'
      : vary.hour === 'dawn' ? 'rain' : pick;
    const side = rng.sign(), amp = rng.range(13, 24), echelon = rng.chance(0.4), skySeed = rng.range(0, 50);

    const scene = new THREE.Scene();
    const hero = await buildHero(ctx, { edition: edition === 'night' ? 'night' : edition === 'golden' ? 'golden' : 'day',
      portalDistance: 430, fog: 0, demo: false, gooseCols: 30, gooseBack: 35 });
    scene.add(hero.object);
    const H = hero.uniforms, A = hero.anchors, G = hero.glsl;
    scene.background = H.uInk.value.clone();
    const spacing = Math.round(190 - 75 * (dens - 0.7) / 0.6);      // two fronts in view when sparse, four or five when busy
    hero.setFrontSpacing(spacing);
    hero.setRedOpen(true);
    hero.setRiseLimit(A.portalSeat.position.x - 110);     // the air in front of the ring stays clear
    await ctx.yield();

    // ---------- the path: level in the deep, the climb, through the hole, a long S over the plane, straight in ----------
    const gz = A.crossingGoose.z, seat = A.portalSeat.position, py = seat.y;
    const path = makePath([
      [-230, -46, gz], [-180, -45, gz + side * 10], [-110, -36, gz], [-34, -13.8, gz], [A.crossingGoose.x, 0, gz], [26, 7, gz],
      // three pictures over the plane: a first rise to see it whole as a front goes by beneath us, a skim low over
      // the tiles while its geese stand up on every side, a climb with them through their own height to the overview
      [76, 9, gz + side * amp * 0.42], [132, 5.5, side * amp], [184, 8, side * amp * 0.3], [240, 11, -side * amp * 0.62],
      [312, py + 1.8, 0], [seat.x - 60, py, 0], [seat.x, py, 0],
    ]);
    await ctx.yield();
    const L = path.length, _v = new THREE.Vector3();
    let dC = 0;
    for (let d = 100, i = 0; d < L; d += 0.25, i++) { if ((i & 255) === 255) await ctx.yield(); if (path.posAtDist(d, _v).y >= 0) { dC = d; break; } }
    const uC = dC / L;
    await ctx.yield();
    const duration = 42;
    const pace = (u) => (0.55 + 0.70 * sstep(0.07, uC - 0.02, u)) * (1 - 0.14 * sstep(0.86, 1, u));
    // the engine's clock at u (same table as the engine builds), so the lift-off fronts can be keyed to u
    const NT = 64, tT = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tT[i] = tT[i - 1] + 2 / (clamp(pace((i - 1) / NT), 0.35, 2.5) + clamp(pace(i / NT), 0.35, 2.5));
    const tAt = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return duration * (tT[i] + (tT[i + 1] - tT[i]) * (x - i)) / tT[NT]; };
    const fN = new THREE.Vector2(A.frontDir.x, A.frontDir.z);
    const uA = (dC + 40) / L;                         // a front overtakes us here, just after we come out
    path.posAtDist(dC + 40, _v);
    const phase0 = _v.x * fN.x + _v.z * fN.y - A.frontSpeed * tAt(uA);
    const ceil0 = _v.x * fN.x + _v.z * fN.y;

    // ---------- shared uniforms ----------
    const uTime = { value: 0 }, uCamW = { value: new THREE.Vector3(-230, -46, gz) }, uAxis = { value: new THREE.Vector3(1, 0, 0) };
    // the flown line's table (see TUBE): where the route is at each x, found by halving (the route's x only ever grows)
    const uTube = { value: [] };
    for (let i = 0, lo = -200; i < TUBE.n; i++) {
      const x = TUBE.x0 + TUBE.dx * i;
      let hi = L + 200;
      for (let k = 0; k < 26; k++) { const m = 0.5 * (lo + hi); if (path.posAtDist(m, _v).x < x) lo = m; else hi = m; }
      path.posAtDist(lo, _v); uTube.value.push(new THREE.Vector2(_v.y, _v.z));
      lo = Math.max(-200, lo - 1);
    }
    await ctx.yield();
    const uCeil = { value: -1e9 }, uFrontN = { value: fN };
    const heroU = (extra) => Object.assign({}, H, extra);

    // ---------- dome ----------
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 24), new THREE.ShaderMaterial({
      uniforms: { uInk: H.uInk, uPaper: H.uPaper, uTime, uRain: { value: edition === 'rain' ? 1 : 0 }, uStars: { value: edition === 'night' ? 1 : 0 },
        uDuty: { value: edition === 'golden' ? 0.56 : 0.36 }, uSeed: { value: skySeed }, uUnder: { value: 1 }, uCalm: { value: rare ? 1 : 0 } },
      vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -1; dome.frustumCulled = false;
    scene.add(dome);
    await ctx.yield();

    // ---------- the deep shoal: ranks ----------
    // the fish of the deep are cut 1.6 times the tile's size (as the geese of the lift are cut larger the higher they
    // stand). The curtains stand RANK.pitch m apart along the avenue from RANK.x0 on (before the entry) to past the
    // hole; a rank reaches RANK.reach / 2 m to either side of the avenue (rankN places, 20 m apart at the middle
    // density) and climbs RANK.climb m, from RANK.lo, over that reach (so 1 in 4); they swim 80 degrees off the
    // route toward one side (by seed) at 3.2 m a second. In the rare event the ranks that come down from the second
    // plane are as they were: one period of DROP_BOX about the eye, five curtains of three rows of dropN places.
    const RANK_YAW = 1.4 * side, RANK_V = 3.2;
    const RANK = { x0: -262, pitch: 40, curtains: 8, reach: 260, lo: -76, climb: 66, step: 0.38, rise: 0.38 };
    const dropN = Math.max(8, Math.round(12 * dens * detail)), rankN = Math.max(dropN, Math.round(13 * dens * detail));
    const SHOAL_BOX = [RANK.reach, RANK.pitch, RANK.lo, RANK.climb], DROP_BOX = [520, 420, 74, 38];
    const SHOAL_LAT = [rankN, RANK.curtains, RANK.step, RANK.rise], DROP_LAT = [dropN, 5, 0.38, 0];
    const shoalRng = rng.fork('shoal');
    const shoalU = heroU({ uCamW, uTube, uBoxS: { value: new THREE.Vector4(...SHOAL_BOX) }, uLat: { value: new THREE.Vector4(...SHOAL_LAT) }, uFld: { value: new THREE.Vector2(RANK.x0, gz) },
      uRank: { value: new THREE.Vector4(Math.cos(RANK_YAW), Math.sin(RANK_YAW), 1, RANK_V) },
      uShow: { value: 1 }, uCeil, uDrop: { value: 0 }, uFrontN, uSize: { value: 1.6 } });
    const shoal = makeShoal(hero.geo.fish, rankN, RANK.curtains, RANK.climb / 6 / 1.6, shoalRng, shoalU, G);
    scene.add(shoal);
    await ctx.yield();

    // ---------- shavings and chips: the cutter's litter, few and small ----------
    const shavU = { uBox: { value: new THREE.Vector3(84, 64, 84) }, uCamW, uTube, uTime, uRise: { value: 1.1 }, uSide: { value: -1 }, uSpiral: { value: 1 }, uTumble: { value: 0 }, uClear: { value: 6 }, uCol: H.uPaper };
    const shavings = makeBits(shavingGeometry(), Math.round(48 * detail), rng.fork('shavings'), shavU, 1.0);
    scene.add(shavings);
    await ctx.yield();
    const chipU = { uBox: { value: new THREE.Vector3(130, 70, 130) }, uCamW, uTube, uTime, uRise: { value: -1.5 }, uSide: { value: 1 }, uSpiral: { value: 0 }, uTumble: { value: 1 }, uClear: { value: 11 }, uCol: H.uInk };
    const chips = makeBits(chipGeometry(), Math.round(260 * dens * detail), rng.fork('chips'), chipU, 0.4);
    scene.add(chips);
    await ctx.yield();

    // ---------- far skeins ----------
    const skeinU = { uCamW, uTime, uShow: { value: 0 }, uPX: { value: 1900 }, uCeil, uFrontN, uCol: H.uInk };
    const skeins = makeSkeins(Math.round(200 * dens * (0.5 + 0.5 * detail)), rng.fork('skeins'), skeinU, Math.atan2(fN.y, fN.x) * rng.range(0.2, 0.9), echelon);
    scene.add(skeins);
    await ctx.yield();

    // ---------- rafts ----------
    const raftU = heroU({ uRaft: { value: Array.from({ length: NRAFT }, () => new THREE.Vector4()) },
      uRaftB: { value: Array.from({ length: NRAFT }, () => new THREE.Vector4()) },
      uSeatR: { value: seat.clone() }, uRingR: { value: new THREE.Vector2(A.ringInner + 0.9, A.ringOuter - 0.9) }, uShow: { value: 0 }, uCamW, uAxis });
    const rafts = makeRafts(hero.geo.goose, hero.geo.fish, raftU, G, rng.fork('rafts'), fN);
    scene.add(rafts);
    // THE RAFTS, a law of the place in metres of the route past the hole (dC), the same on every seed (only the side of
    // the avenue is the seed's). There are two, and both drift along the route RAFT_K m for every metre we fly, so
    // where a raft is depends on where we are and on nothing else (no clock, no seeded start):
    //   the first is RAFT_A0 m past the hole when we come out of it, so we come up to it slowly and are beside its
    //   middle some 175 m on, about three fifths of the flight;
    //   the second is RAFT_F0 m past the hole then, far ahead: it is the raft that feeds the ring.
    // Where a raft flies is written by the place it is over: over the first RAFT_NEAR[0] m past the hole a raft flies
    // LOW AND NEAR (its middle RAFT_LOW.alt m over the plane and RAFT_LOW.off m to the side of the route, rolled
    // RAFT_LOW.roll rad with its inner edge up, so from the route it is one large sheet of the tiling seen from under
    // and from the side, with clear sky between its lower edge and the plane); from RAFT_NEAR[1] m on it flies HIGH AND
    // WIDE (RAFT_HIGH: a flat patch in the sky, never taken for the plane), and between the two it climbs away. So
    // from the hole to about three fifths of the flight one raft looms large and near, and after that the sky is the
    // geese's; and no view ever holds more than the two.
    // A raft more than 180 m from us along the route is a loose chevron; it has locked by the time it is 100 m off.
    // At the ends of the stretch (60 m after the hole, 60 m before the ring) a raft loosens and its birds dwindle whole.
    // Feeding the ring, a rule in metres: the second raft breaks up ahead of us. It begins when we have come up to
    // RAFT_G1 m behind it along the route and its last bird has landed on the ring by the time we are RAFT_G0 m
    // behind it (its loosened birds trail up to 59 m behind its centre, so every bird in the air is ahead of us).
    const RAFT_G1 = 95, RAFT_G0 = 55, RAFT_END = 16, RAFT_K = 0.43, RAFT_A0 = 100, RAFT_F0 = 209, RAFT_NEAR = [180, 208];
    const RAFT_LOW = { off: 26, alt: 30, roll: 0.5 }, RAFT_HIGH = { off: 36, alt: 38, roll: 0.22 };
    const raftLo = dC + 60, raftHi = L - 60;
    const RAFT = [{ s0: RAFT_A0, sd: side, feeds: false }, { s0: RAFT_F0, sd: -side, feeds: true }];
    await ctx.yield();

    // ---------- rare: the second plane ----------
    const upperU = heroU({ uCeil, uFrontN, uShow: { value: 0 } });
    const upperGeo = new THREE.CircleGeometry(2600, 48);
    upperGeo.rotateX(-Math.PI / 2);
    const upper = new THREE.Mesh(upperGeo, new THREE.ShaderMaterial({ uniforms: upperU, side: THREE.DoubleSide,
      vertexShader: `varying vec3 vP; uniform float uShow; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (uShow < .5) ${CLIP} }`,
      fragmentShader: upperFS(G) }));
    upper.position.y = 120; upper.frustumCulled = false;
    scene.add(upper);
    await ctx.yield();

    // ---------- mounts ----------
    const fishU = heroU({ uFlat: { value: 0 }, uSwim: { value: 1 }, uShow: { value: 1 } });
    const fishMount = new THREE.Mesh(fishMountGeometry(hero.outline.fish),
      new THREE.ShaderMaterial({ uniforms: fishU, vertexShader: FISH_MOUNT_VS, fragmentShader: fishMountFS(G), side: THREE.DoubleSide }));
    fishMount.matrixAutoUpdate = false; fishMount.frustumCulled = false;
    scene.add(fishMount);
    await ctx.yield();
    const gooseU = heroU({ uUnfold: { value: 0 }, uBeat: { value: 0 }, uShow: { value: 0 } });
    const gooseMount = new THREE.Mesh(gooseMountGeometry(),
      new THREE.ShaderMaterial({ uniforms: gooseU, vertexShader: GOOSE_MOUNT_VS, fragmentShader: gooseMountFS(G), side: THREE.DoubleSide }));
    gooseMount.matrixAutoUpdate = false; gooseMount.frustumCulled = false;
    scene.add(gooseMount);
    await ctx.yield();

    // ---------- the beat of the crossing: one eased frame of ink ----------
    // it is a cut, not a fade: level bars of ink that widen until they meet and then narrow again, like a block being
    // inked, so every pixel is ink or the picture and never a grey between them
    const beatU = { uCol: H.uInk, uOp: { value: 0 }, uPer: { value: 24 } };
    const beat = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: beatU, transparent: false, depthTest: false, depthWrite: false,
      vertexShader: `uniform float uOp; void main() { gl_Position = vec4(position.xy, 0., 1.); if (uOp < .004) ${CLIP} }`,
      fragmentShader: `uniform vec3 uCol; uniform float uOp, uPer;
        void main() { if (abs(fract(gl_FragCoord.y / max(uPer, 2.)) - .5) * 2. > uOp) discard; gl_FragColor = vec4(uCol, 1.); }` }));
    beat.frustumCulled = false; beat.renderOrder = 50;
    scene.add(beat);

    // ---------- the lift (a stream of its own, made from the world's seed and a name) ----------
    const liftRng = makeRng(hashSeed(ctx.seed + ':lift'));
    const liftL = liftRng.int(0, 1);
    H.uLiftA.value.set(67.5, 150, liftRng.range(0, 97), 1);
    H.uLiftB.value.set(liftL, 1 - liftL, 2, A.frontSpeed);       // the two sides of the avenue take turns
    H.uLiftR.value.set(seat.x, seat.y, seat.z, 520);
    const liftU = heroU({ uLiftC: { value: new THREE.Vector4(6, 40, 6.5, 3) } });
    await ctx.yield();
    const lift = makeLift(liftU, G, H.uLiftA.value, H.uLiftB.value, 2550);
    scene.add(lift);
    await ctx.yield();

    // ---------- per-frame ----------
    const EYE_FISH = new THREE.Vector3(-7.0, 4.3, 0), EYE_GOOSE = new THREE.Vector3(-6.5, 5.0, 0);      // the seats: where the eye is, in each mount's own frame
    const AHEAD = 30;
    const cp = new THREE.Vector3(), cq = new THREE.Quaternion(), cs = new THREE.Vector3(), cdir = new THREE.Vector3();
    const pp = new THREE.Vector3(), pa = new THREE.Vector3(), fwd = new THREE.Vector3(), up = new THREE.Vector3(), rt = new THREE.Vector3();
    const mq = new THREE.Quaternion(), mp = new THREE.Vector3(), mm = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), off = new THREE.Vector3();
    const cellQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)));
    const cellP = new THREE.Vector3(A.crossingFish.x, -0.03, A.crossingFish.z);
    const poiFront = new THREE.Vector3(), poiFlock = new THREE.Vector3(), frontAt = (x) => x + 60 + 165 * sstep(-34, -230, x);
    const rp = new THREE.Vector3(), rq = new THREE.Vector3();
    const bufSize = new THREE.Vector2();
    let wingLag = 0;

    function update(dt, time, camera, u) {
      const d = clamp(u, 0, 1) * L;
      camera.matrixWorld.decompose(cp, cq, cs);
      cdir.set(0, 0, -1).applyQuaternion(cq);
      path.posAtDist(d, pp); path.posAtDist(d + AHEAD, pa);
      const below = d < dC - 1.5;
      uTime.value = time;
      uCamW.value.copy(cp);
      uAxis.value.subVectors(pa, pp).normalize();
      dome.position.copy(cp);
      dome.material.uniforms.uUnder.value = cp.y < 0 ? 1 : 0;

      // the hero: locking front under water, complete to the horizon once we are through; fronts keyed to u
      hero.setLockFront(below ? frontAt(pp.x) : 1e6);
      hero.setFrontPhase(phase0 + A.frontSpeed * tAt(u) - A.frontSpeed * time);
      hero.setPortalProgress(sstep(0.80, 0.985, u));

      // the black beat: 0.1 s in, 0.3 s out at 22 m/s
      beatU.uOp.value = sstep(dC - 4.2, dC - 2.0, d) * (1 - sstep(dC + 1.5, dC + 8.5, d));
      beatU.uPer.value = Math.max(12, ctx.renderer.getDrawingBufferSize(bufSize).y / 18);

      // which side of the page we are on
      const under = d < dC + 6, over = d > dC - 6;
      shavU.uSide.value = -1;
      skeinU.uShow.value = over ? 1 : 0;
      if (rare) {
        const k = sstep(0.58, 0.9, u);
        uCeil.value = over ? ceil0 - 700 + 3600 * Math.pow(k, 1.6) : -1e9;
        upperU.uShow.value = over ? 1 : 0;
        shoalU.uDrop.value = over && !under ? 1 : 0;
        shoalU.uShow.value = 1;
        const drop = over && !under;
        shoalU.uBoxS.value.set(...(drop ? DROP_BOX : SHOAL_BOX));
        shoalU.uLat.value.set(...(drop ? DROP_LAT : SHOAL_LAT));
        shoalU.uRank.value.z = drop ? -1 : 1;
      } else shoalU.uShow.value = under ? 1 : 0;

      // the rafts: loose chevrons far off, locked into the tiling within 100 m of us; the second streams onto the ring
      raftU.uShow.value = over ? 1 : 0;
      for (let r = 0; r < NRAFT; r++) {
        const o = RAFT[r], sg = o.s0 + RAFT_K * (d - dC), s = dC + sg, gap = s - d;      // sg: metres it is past the hole; gap: metres it is ahead of us along the route
        // the ends of the stretch: it loosens over 40 m and its birds dwindle over the last RAFT_END m
        const endLock = sstep(raftLo, raftLo + 40, s) * (1 - sstep(raftHi - 40, raftHi, s));
        const endSize = sstep(raftLo, raftLo + RAFT_END, s) * (1 - sstep(raftHi - RAFT_END, raftHi, s));
        const rel = o.feeds ? sstep(RAFT_G1, RAFT_G0, gap) : 0;
        const hi = sstep(RAFT_NEAR[0], RAFT_NEAR[1], sg), lw = 1 - hi;      // low and near, or high and wide, by the place it is over
        const offR = o.sd * (RAFT_LOW.off * lw + RAFT_HIGH.off * hi), alt = RAFT_LOW.alt * lw + RAFT_HIGH.alt * hi, roll = RAFT_LOW.roll * lw + RAFT_HIGH.roll * hi;
        path.posAtDist(s, rp); path.posAtDist(s + 6, rq);
        const hx = rq.x - rp.x, hz = rq.z - rp.z, hl = Math.max(Math.hypot(hx, hz), 1e-4);
        raftU.uRaft.value[r].set(rp.x - hz / hl * offR, alt + 1.5 * Math.sin(time * 0.31 + r * 2.1), rp.z + hx / hl * offR, Math.atan2(hz, hx));
        raftU.uRaftB.value[r].set(o.sd * (roll + 0.05 * Math.sin(time * 0.23 + r * 1.7)), 1.1 * sstep(180, 100, Math.abs(gap)) * endLock, rel, endSize);
      }

      // mount frame: between the line of travel and the gaze, never rolled
      fwd.copy(uAxis.value).lerp(cdir, 0.5).normalize();
      rt.crossVectors(fwd, up.set(0, 1, 0)).normalize();
      up.crossVectors(rt, fwd);
      mm.makeBasis(fwd, up, rt);
      mq.setFromRotationMatrix(mm);

      // the fish: ridden, then it swims ahead, rolls flat and locks into its cell
      const lock = sstep(dC - 58, dC - 10, d), locked = d >= dC - 10;
      mp.copy(cp).sub(off.copy(EYE_FISH).applyQuaternion(mq));
      const kp = lock * lock * (3 - 2 * lock), kr = sstep(0.55, 1, lock);
      mp.lerp(cellP, kp);
      mq.slerp(cellQ, kr);
      fishMount.matrix.compose(mp, mq, one);
      fishMount.matrixWorldNeedsUpdate = true;
      fishU.uFlat.value = sstep(0.6, 1, lock);
      fishU.uSwim.value = 1 - sstep(0.5, 0.95, lock);
      fishU.uShow.value = (locked || ctx.through) ? 0 : 1;      // nothing carried with the camera is drawn in a portal picture
      hero.setRedOpen(!locked);

      // the goose: under us from the black beat on
      const gOn = d > dC - 3;
      gooseU.uShow.value = (gOn && !ctx.through) ? 1 : 0;
      gooseU.uUnfold.value = sstep(dC - 2, dC + 26, d);
      // the beat runs on the world's clock (so a still at another second shows another part of the stroke); before
      // the ring it slows: it folds its wings once and goes through
      wingLag += dt * 6.2832 * 1.6 * 0.75 * sstep(0.955, 0.995, u);
      gooseU.uBeat.value = 6.2832 * 1.6 * time - wingLag;
      gooseU.uUnfold.value *= 1 - 0.8 * sstep(0.965, 1, u);
      // the goose's frame is the eye's own, turned about the eye's up half of the way from the gaze to the line of
      // travel: so it leans with the camera's lean and keeps its height in the picture (its seat alone says how much of
      // it is seen), and in a turn its head swings toward where we are going
      up.set(0, 1, 0).applyQuaternion(cq);
      const ax = uAxis.value;
      fwd.copy(cdir).applyAxisAngle(up, 0.5 * Math.atan2(cdir.z * ax.x - cdir.x * ax.z, cdir.x * ax.x + cdir.z * ax.z));
      rt.crossVectors(fwd, up).normalize();
      mm.makeBasis(fwd, up, rt);
      mq.setFromRotationMatrix(mm);
      mp.copy(cp).sub(off.copy(EYE_GOOSE).applyQuaternion(mq));
      gooseMount.matrix.compose(mp, mq, one);
      gooseMount.matrixWorldNeedsUpdate = true;

      hero.update(dt, time, camera);
    }

    const accent = '#' + H.uAccent.value.getHexString();
    return {
      scene, path, duration, pace,
      title: edition === 'night' ? 'Figure and Ground, night edition' : edition === 'golden' ? 'Figure and Ground, kraft edition'
        : edition === 'rain' ? 'Figure and Ground, rain edition' : 'Figure and Ground',
      ride: 'none', style: 'none', companion: 'none',
      // bank 0.45: the horizon leans into the turns (some 4 degrees in the S of the opening, 5 to 6 in the two turns
      // over the plane, 2 to 3 in the last) and is level between them
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: AHEAD, sway: 0.6, bank: 0.45 },
      pois: [
        { at: (t, u) => { path.pointAt(u, poiFront); return poiFront.set(frontAt(poiFront.x) - 25, 0, gz); }, from: 0.0, to: uC - 0.05, weight: 0.4, fade: 0.25 },
        // the climb with the flock: gaze a little above the line of travel, where the birds are rising
        { at: (t, u) => { path.posAtDist(clamp(u, 0, 1) * L + 50, poiFlock); poiFlock.y += 10; return poiFlock; }, from: uA + 0.12, to: uA + 0.3, weight: 0.35, fade: 0.3 },
        { at: seat, from: 0.66, to: 1, weight: 0.5, fade: 0.25 },
      ],
      portal: { shape: 'circle', radius: A.ringInner, color: accent, veil: '#' + H.uInk.value.getHexString(), glow: 0, halo: false, revealDistance: 300 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      update,
      dispose() { hero.dispose?.(); },
    };
  },
};
