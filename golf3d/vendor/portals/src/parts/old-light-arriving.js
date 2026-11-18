// OLD LIGHT ARRIVING, the hero: the bowl set to face the new star, and the sky it faces (the dome, the thread of the far side, the star).
// The bowl is a round stone hill hollowed out, standing in the basin: foot radius 190 at the waterline, rim crest radius 140 at 36 m, a rim
// walk, 22 stone tiers down to a paved ring and a still round pool; on the star's bearing a plain notch 60 m wide cut down to a flat stage,
// the open stage side of an open-air theatre, with one thick plain round-headed arch standing in it.
// LOCAL FRAME: origin at the hill's centre at water level, +Y up; the star's bearing is local -Z (so the near side, the "front", is +Z).
// a = distance along the axis toward the star (= -z), l = lateral (= x).
import * as THREE from 'three';
import { BOWL, STEPS, PATHS, MOUTH_R, footR, DEG, STAR_AZ, STAR_EL, TAN_EL, LIGHT_GLSL, LAMPMAP_GLSL, makeLightUniforms, makeLampMap, hillH, bowlXZ } from './old-light-arriving-common.js';
import { makeSkyGroup } from './old-light-arriving-sky.js';
import { WATER_GLSL } from './old-light-arriving-land.js';
import { dressBowl, GLOBE_IN } from './old-light-arriving-bowl.js';

const B = BOWL, ARCH = { a: BOWL.arch, inner: 10, outer: 14, spring: 14, depth: 5 };      // the arch: opening 20 m wide and 24 high, legs 4 m thick, 5 m deep
export const ARCH_AT = ARCH.a;
// Is a point inside the bowl in the star's light? In the bowl's frame the star's rays run along the axis and rise 12 degrees. A point is lit
// through the notch (within 30 m of the axis) or over the far rim (if its ray clears the crest); the arch throws its own shadow down the stage.
export const BOWL_LIT_GLSL = /* glsl */`
// the highest the hill may stand at lateral distance l from the axis on the star's side (the stage, then six terraces stepping up)
float stepTop(float l){ float a = abs(l), j = floor((a - ${B.notch}.)/${STEPS.w}.); return a < ${B.notch}. ? ${B.yStage.toFixed(1)} : (j > ${STEPS.n - 0.5} ? 1e4 : ${STEPS.y0} + ${STEPS.rise}*j); }
float bowlLit(vec3 p){                                                                             // p in the bowl's frame
  float l = abs(p.x), a = -p.z, r = length(p.xz);
  // the star's rays run along the axis, so a ray keeps its lateral distance: what it must clear is the far side's section at that distance,
  // which rises with the tiers until it is as high as it may stand there (the stage, a terrace of the notch's stepped side, or the rim)
  float top = stepTop(l), cap = min(top, ${B.yRim.toFixed(1)});
  float rc = cap > ${(B.yRim - 0.5).toFixed(1)} ? 134. : (top < ${(B.yStage + 0.1).toFixed(1)} ? ${B.pool}. : ${B.low}. + ${B.tread}.*floor((cap - ${B.yLow.toFixed(2)})/${B.rise.toFixed(2)} + 1e-4));
  float ac = sqrt(max(rc*rc - p.x*p.x, 0.));
  float lit = smoothstep(-1.5, .4, p.y + max(ac - a, 0.)*${TAN_EL.toFixed(5)} - cap);
  lit = mix(lit, 1., smoothstep(${(B.top - 1.5).toFixed(1)}, ${(B.top + 0.5).toFixed(1)}, r));                             // the rim walk and the outer slope: only their own facing counts
  // the arch's shadow: carry the point up its ray to the arch's plane and ask whether it meets stone
  float t = ${ARCH.a.toFixed(1)} - a, h = p.y + t*${TAN_EL.toFixed(5)} - ${B.yStage.toFixed(1)};
  float outer = min(${ARCH.outer}. - l, ${ARCH.spring}. + sqrt(max(${ARCH.outer * ARCH.outer}. - p.x*p.x, 0.)) - h);
  float inner = min(${ARCH.inner}. - l, ${ARCH.spring}. + sqrt(max(${ARCH.inner * ARCH.inner}. - p.x*p.x, 0.)) - h);
  float soft = .25 + max(t, 0.)*.012;                                                              // soft-ended: the edge widens with the shadow's length
  float sh = smoothstep(-soft, soft, outer) * (1. - smoothstep(-soft, soft, inner)) * step(0., t) * step(0., h);
  return lit * (1. - sh);
}`;

// one merged mesh of stone and turf: positions, normals, colours, a kind (0 turf, 1 stone, 2 tier stone, 3 a coursed wall of the notch's
// stepped sides, 4 paving) and, on walls, the metres below the wall's own top (for its coping)
async function shellGeometry(pause) {
  const P = [], N = [], C = [], K = [], T = [], I = [];
  const v = (x, y, z, nx, ny, nz, c, k, top = 9) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); K.push(k); T.push(top); return P.length / 3 - 1; };
  const quad = (a, b, c, d) => I.push(a, b, c, b, d, c);
  const TURF = [0.10, 0.165, 0.13], STONE = [0.34, 0.35, 0.40], TIER = [0.37, 0.38, 0.43], WALL = [0.27, 0.28, 0.33], PAVE = [0.36, 0.37, 0.42];
  // where a ring of height y is cut by the notch and its stepped sides: the half angle at radius r (no y: the ring is whole)
  const cut = (r, y) => { if (y === undefined) return 0; const lm = STEPS.lmin(y); return r > lm ? Math.asin(lm / r) : Math.PI / 2; };
  // a band between two circles (r0, y0) and (r1, y1), cut on the star's side where ground of height cy0 / cy1 may not stand
  const band = (r0, y0, r1, y1, seg, col, kind, cy0, cy1, outward = false) => {
    const dr = r1 - r0, dy = y1 - y0, len = Math.hypot(dr, dy) || 1, nr = -dy / len, ny = dr / len, sgn = (ny < 0 || (ny === 0 && nr > 0) ? -1 : 1) * (outward ? -1 : 1);      // up, or (a riser) toward the middle (outward: away from it)
    let prev = null;
    for (let i = 0; i <= seg; i++) {
      const row = [];
      for (const [r, y, cy] of [[r0, y0, cy0], [r1, y1, cy1]]) {
        const c = cut(r, cy), f = c + (2 * Math.PI - 2 * c) * i / seg, sx = Math.sin(f), cz = -Math.cos(f);
        row.push(v(r * sx, y, r * cz, sgn * nr * sx, sgn * ny, sgn * nr * cz, col, kind));
      }
      if (prev) quad(prev[0], row[0], prev[1], row[1]);
      prev = row;
    }
  };
  const yAt = (r) => B.yRim * (B.foot - r) / (B.foot - B.rim), rMouth = MOUTH_R, LV = []; for (let j = 0; j < STEPS.n; j++) LV.push(STEPS.y0 + STEPS.rise * j);      // the terraces' levels
  // the outer slope's own section above the stage's level, as knots from the mouth up to the crest: plain slope, the two terrace paths
  // (a low wall, a level tread, a low wall), and a knot at each level of the notch's stepped sides so that every ring is cut exactly
  // where its terrace runs out of the hill
  const knots = [[rMouth, B.yStage, 0]];      // [r, y, kind of the band that ends here: 0 turf, 1 a path's tread, 2 a path's wall]
  { const ev = []; for (const y of LV) ev.push([B.foot - y / B.yRim * (B.foot - B.rim), y, 0]);
    for (const t of PATHS) ev.push([t + 1.5, yAt(t + 1.5), 0], [t + 1.5, yAt(t), 2], [t - 1.5, yAt(t), 1], [t - 1.5, yAt(t - 1.5), 2]);
    ev.sort((p, q) => q[0] - p[0] || p[1] - q[1]); knots.push(...ev, [B.rim, B.yRim, 0]); }
  // where the slope is as high as y (the largest such radius)
  const rOut = (y) => { for (let i = 1; i < knots.length; i++) if (knots[i][1] >= y - 1e-6) { const p = knots[i - 1], q = knots[i]; return q[1] - p[1] < 1e-6 ? p[0] : p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]); } return B.rim; };
  // the foot: from under the water to the stage's level, its waterline wandering in and out
  { let prev = null; for (let i = 0; i <= 180; i++) { const f = 2 * Math.PI * i / 180, sx = Math.sin(f), cz = -Math.cos(f), rf = footR(f), rl = rf + 3.6 * (rf - rMouth) / B.yStage;
      const row = [v(rl * sx, -3.6, rl * cz, sx * 0.55, 0.83, cz * 0.55, TURF, 0), v(rMouth * sx, B.yStage, rMouth * cz, sx * 0.55, 0.83, cz * 0.55, TURF, 0)];
      if (prev) quad(prev[0], row[0], prev[1], row[1]); prev = row; } }
  if (pause) await pause();
  for (let i = 1; i < knots.length; i++) { const p = knots[i - 1], q = knots[i], k = q[2], cy = Math.max(p[1], q[1]); if (pause && i % 4 === 0) await pause();
    band(p[0], p[1], q[0], q[1], 120, k === 0 ? TURF : k === 1 ? [0.30, 0.30, 0.31] : WALL, k === 0 ? 0 : 1, cy, cy, k === 2); }
  if (pause) await pause();
  // the crest's inner kerb and the rim walk
  band(B.rim, B.yRim, B.rim - 2, B.yWalk, 120, STONE, 1, B.yRim, B.yRim);
  band(B.rim - 2, B.yWalk, B.top, B.yWalk, 120, STONE, 1, B.yWalk, B.yWalk);
  band(B.top, B.yWalk, B.top, B.yLow + B.rise * B.tiers, 120, WALL, 2, B.yWalk, B.yWalk);
  // 22 tiers: a riser and a tread each
  for (let k = B.tiers - 1; k >= 0; k--) {
    if (pause && k % 2 === 1) await pause();
    const r = B.low + B.tread * k, y = B.yLow + B.rise * (k + 1);
    band(r + B.tread, y, r, y, 120, TIER, 2, y, y);
    band(r, y, r, y - B.rise, 120, WALL, 2, y, y);
  }
  if (pause) await pause();
  // the paved ring and the pool's flush stone edge
  band(B.low, B.yLow, B.pool, B.yLow, 96, STONE, 4, B.yLow, B.yLow);
  band(B.pool, B.yLow, B.pool, B.yPool - 0.3, 96, WALL, 1);
  // the stage: a flat paved floor from the pool's edge through the notch, then a ramp down to the neck
  { const cols = 13; let prev = null;
    const as = []; for (let a = 0; a <= 186; a += 6) as.push(a); as.push(212, 240);
    for (const a of as) { const row = [];
      for (let i = 0; i < cols; i++) { const l = -B.notch + 2 * B.notch * i / (cols - 1), a0 = Math.sqrt(Math.max(B.pool * B.pool - l * l, 0)), aa = Math.max(a, a0), r = Math.hypot(l, aa);
        const y = r <= 186 ? B.yStage : Math.max(3, B.yStage - (r - 186) * 0.11); row.push(v(l, y, -aa, 0, 1, 0, PAVE, 4)); }
      if (prev) for (let i = 0; i < cols - 1; i++) quad(prev[i], prev[i + 1], row[i], row[i + 1]);
      prev = row; }
    // the stage's front edge at the pool
    let pv = null; for (let i = 0; i < cols; i++) { const l = -B.notch + 2 * B.notch * i / (cols - 1), a0 = Math.sqrt(Math.max(B.pool * B.pool - l * l, 0)); const t = v(l, B.yStage, -a0, 0, 0.3, 0.95, WALL, 1), b = v(l, B.yPool - 0.3, -a0, 0, 0.3, 0.95, WALL, 1); if (pv) quad(pv[0], t, pv[1], b); pv = [t, b]; } }
  if (pause) await pause();
  // ---- the notch's stepped sides. The hill's own section, as it stands where nothing cuts it:
  const base = (r, e) => {      // e: -1 just inside r, +1 just outside (the section jumps at every riser)
    const q = r + e * 1e-4;
    if (q >= B.rim) { for (const t of PATHS) if (Math.abs(q - t) <= 1.5) return yAt(t); return yAt(q); } if (q >= B.rim - 2) return B.yWalk + (B.yRim - B.yWalk) * (q - (B.rim - 2)) / 2; if (q >= B.top) return B.yWalk;
    if (q >= B.low) return B.yLow + B.rise * (Math.floor((q - B.low) / B.tread) + 1); return B.yLow; };
  const rs = []; for (let k = 0; k <= B.tiers; k++) rs.push(B.low + B.tread * k); rs.push(B.rim - 2, B.rim, ...LV.map(rOut), ...PATHS.flatMap((t) => [t - 1.5, t + 1.5]), rMouth); rs.sort((p, q) => p - q);
  for (const sd of [-1, 1]) {
    if (pause) await pause();
    // the terraces: level paved floors, each from the riser where the tiers first stand higher than it to where the outer slope falls below it
    for (let j = 0; j < STEPS.n; j++) { const L0 = B.notch + STEPS.w * j, L1 = L0 + STEPS.w, y = LV[j], kc = Math.floor((y - B.yLow) / B.rise + 1e-6), rc = B.low + B.tread * kc, ro = rOut(y), NA = 12, NL = 3;
      let prev = null;
      for (let i = 0; i <= NA; i++) { const row = [];
        for (let q = 0; q <= NL; q++) { const l = L0 + (L1 - L0) * q / NL, a0 = Math.sqrt(rc * rc - l * l), a1 = Math.sqrt(ro * ro - l * l), a = a0 + (a1 - a0) * i / NA; row.push(v(sd * l, y, -a, 0, 1, 0, PAVE, 4)); }
        if (prev) for (let q = 0; q < NL; q++) { if (sd > 0) quad(prev[q], prev[q + 1], row[q], row[q + 1]); else quad(prev[q + 1], prev[q], row[q + 1], row[q]); }
        prev = row; }
      // its front: the little wall at that riser, from the tread below up to the terrace
      const yb = B.yLow + B.rise * kc; let pv = null;
      if (y - yb > 0.02) for (let q = 0; q <= NL; q++) { const l = L0 + (L1 - L0) * q / NL, a0 = Math.sqrt(rc * rc - l * l), nx = -sd * l / rc, nz = a0 / rc;
        const t = v(sd * l, y, -a0, nx, 0, nz, WALL, 3, 0), b = v(sd * l, yb, -a0, nx, 0, nz, WALL, 3, y - yb); if (pv) quad(pv[0], t, pv[1], b); pv = [t, b]; } }
    // the walls between them: at each step's line, from the lower ground on the stage's side up to the higher ground beyond it
    for (let j = 0; j <= STEPS.n; j++) { const L = B.notch + STEPS.w * j, lowTop = j === 0 ? B.yStage : LV[j - 1], highTop = j < STEPS.n ? LV[j] : 1e9; let pv = null;
      for (let i = 0; i < rs.length; i++) for (const e of [-1, 1]) { const r = rs[i]; if (r <= L + 0.01) continue;
        const a = Math.sqrt(r * r - L * L), h = base(r, e), top = Math.min(h, highTop), bot = Math.min(h, lowTop), cur = [a, top, bot];
        if (e < 0 && pv && (pv[1] > pv[2] + 1e-3 || top > bot + 1e-3)) { const t0 = Math.max(pv[1], pv[2]), t1 = Math.max(top, bot);
          const A0 = v(sd * L, t0, -pv[0], -sd, 0, 0, WALL, 3, 0), B0 = v(sd * L, pv[2], -pv[0], -sd, 0, 0, WALL, 3, t0 - pv[2]), A1 = v(sd * L, t1, -a, -sd, 0, 0, WALL, 3, 0), B1 = v(sd * L, bot, -a, -sd, 0, 0, WALL, 3, t1 - bot);
          quad(A0, A1, B0, B1); }
        pv = cur; } }
    // the stage's own side where the paved ring lies below it
    { const a0 = Math.sqrt(B.pool * B.pool - B.notch * B.notch), a1 = Math.sqrt(B.low * B.low - B.notch * B.notch);
      quad(v(sd * B.notch, B.yStage, -a0, sd, 0, 0, WALL, 1), v(sd * B.notch, B.yStage, -a1, sd, 0, 0, WALL, 1), v(sd * B.notch, B.yLow, -a0, sd, 0, 0, WALL, 1), v(sd * B.notch, B.yLow, -a1, sd, 0, 0, WALL, 1)); }
  }
  // the arch: one thick plain round-headed arch of pale stone, taller than wide, uncarved
  { const A = ARCH, y0 = B.yStage - 0.3, z0 = -A.a - A.depth / 2, z1 = -A.a + A.depth / 2, ST = [0.5, 0.51, 0.56], prof = [];
    // the outline, from the left foot up over the head and down to the right foot: (inner point, outer point, outward normal)
    prof.push([-A.inner, 0, -A.outer, 0, -1, 0]);
    for (let i = 0; i <= 24; i++) { const f = Math.PI * i / 24, cx = -Math.cos(f), sy = Math.sin(f); prof.push([A.inner * cx, A.spring + A.inner * sy, A.outer * cx, A.spring + A.outer * sy, cx, sy]); }
    prof.push([A.inner, 0, A.outer, 0, 1, 0]);
    let pf = null, pb = null, po = null, pi = null;
    for (const [ix, iy, ox, oy, nx, ny] of prof) {
      const f = [v(ix, y0 + iy, z1, 0, 0, 1, ST, 1), v(ox, y0 + oy, z1, 0, 0, 1, ST, 1)], bk = [v(ix, y0 + iy, z0, 0, 0, -1, ST, 1), v(ox, y0 + oy, z0, 0, 0, -1, ST, 1)];
      const o = [v(ox, y0 + oy, z1, nx, ny, 0, ST, 1), v(ox, y0 + oy, z0, nx, ny, 0, ST, 1)], inn = [v(ix, y0 + iy, z1, -nx, -ny, 0, ST, 1), v(ix, y0 + iy, z0, -nx, -ny, 0, ST, 1)];
      if (pf) { quad(pf[0], pf[1], f[0], f[1]); quad(pb[0], pb[1], bk[0], bk[1]); quad(po[0], po[1], o[0], o[1]); quad(pi[0], pi[1], inn[0], inn[1]); }
      pf = f; pb = bk; po = o; pi = inn;
    } }
  if (pause) await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  if (pause) await pause();
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1)); g.setAttribute('aTop', new THREE.Float32BufferAttribute(T, 1)); g.setIndex(I); g.computeBoundingSphere();
  return g;
}

// opts (all optional; alone in the part viewer the hero makes its own): { LU: shared light uniforms, WU: { uLate }, streams: { stars, mottle,
// clouds, meteors, range, ... }, late, rare, highCloud }
export async function buildHero(ctx, opts = {}) {
  const alone = !opts.LU, LU = opts.LU || makeLightUniforms(), WU = opts.WU || { uLate: { value: 0 } };
  const S = opts.streams || (() => { const o = {}; for (const n of ['stars', 'mottle', 'clouds', 'meteors', 'range', 'crowd', 'floats', 'masts', 'hill']) o[n] = ctx.rng.fork(n); return o; })();
  const object = new THREE.Group();
  // ---- stone and turf
  const stone = new THREE.ShaderMaterial({ uniforms: { ...LU, uSeats: { value: null }, uTierFill: { value: new Float32Array(B.tiers).fill(0.9) } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 color; attribute float aKind, aTop; varying vec3 vW, vN, vL, vCol; varying float vKind, vTop; ${LIGHT_GLSL}
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*normal); vL = position; vCol = color; vKind = aKind; vTop = aTop; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform sampler2D uSeats; uniform float uTierFill[${B.tiers}]; varying vec3 vW, vN, vL, vCol; varying float vKind, vTop; ${LIGHT_GLSL} ${LAMPMAP_GLSL} ${BOWL_LIT_GLSL}
      // where in the seat table is the seat at this place of the tiers (xy), and can a ray at this height pass through someone sitting there (z)?
      // Arithmetic only: the table itself is read in main, outside every branch.
      vec3 seatAt(vec3 q){ float r = length(q.xz), k = clamp(floor((r - ${B.low}.)/${B.tread}.), 0., ${B.tiers - 1}.), f = r - ${B.low}. - ${B.tread}.*k;
        float odd = step(2.05, f), j = 2.*k + odd, rr = ${B.low}. + ${B.tread}.*k + mix(1.15, 2.95, odd), ty = ${B.yLow.toFixed(2)} + ${B.rise.toFixed(2)}*(k + 1.);
        float ang = atan(q.x, -q.z + 1e-6); ang += (1. - step(0., ang))*6.2831853;
        float n = floor(6.2831853*rr/.9), sI = ang/6.2831853*n;
        float ok = step(${B.low}., r) * step(r, ${B.top}.) * step(abs(r - rr), .36) * step(q.y, ty + .98) * step(ty - .05, q.y) * step(abs(fract(sI) - .5), .46);
        return vec3((floor(sI) + .5)/1024., (j + .5)/${B.tiers * 2}., ok); }
      // the row of seats abreast of a point of the tiers (a01: its bearing, 0 to two pi; k: its tread; odd: which of the tread's two rows):
      // (the seat's column in the table, its neighbour's to the nearer hand, metres along the row from the seat's middle, 0)
      vec4 rowAt(float a01, float k, float odd){ float rr = ${B.low}. + ${B.tread}.*k + mix(1.15, 2.95, odd), n = floor(6.2831853*rr/.9), sI = a01/6.2831853*n, c = floor(sI), su = fract(sI) - .5;
        return vec4(c, mod(c + (su < 0. ? -1. : 1.), n), su*.9, 0.); }
      void main(){ if (vW.y < -.03) discard;
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), alb = vCol;
        float r = length(vL.xz), ang = atan(vL.x, -vL.z + 1e-6), foot = max(fwidth(vL.x), fwidth(vL.z)), fine = clamp(1.2 - 1.6*foot, 0., 1.);
        float turf = 1. - smoothstep(.2, .8, vKind), wall = step(2.5, vKind) * (1. - step(3.5, vKind)), pave = step(3.5, vKind), tier = smoothstep(1.5, 1.9, vKind) * (1. - step(2.5, vKind));
        float gn = olaNoise(vL.xz*.047)*.35 + olaNoise(vL.xz*.31 + 7.)*.3 + olaNoise(vL.xz*2.1)*.35*fine + .17*(1.-fine);
        // the outer slope is a hill with a shore, not a disc: rough grass in two greens with mown rides between, a paler mown lawn where the
        // fliers come down (the near foot, either side of the landing stair), bare places worn by feet, and at the water a dark wet margin
        // of mud and stones. On snow visits the snow lies drifted: deep in the hollows, grass and stone showing through on the swells.
        float swell = olaNoise(vec2(ang*7., r*.06) + 3.)*.6 + olaNoise(vec2(ang*23., r*.21))*.4;
        float lawn = (1. - smoothstep(.34, .52, abs(abs(ang) - 2.72))) * smoothstep(149., 153., r) * (1. - smoothstep(180., 186., r)) * step(.5, turf);      // (bearings 133 to 177 degrees either side: the near slope beside the stair)
        vec3 grass = mix(vec3(.085,.15,.105), vec3(.125,.175,.115), swell) * (.72 + .56*gn);
        grass = mix(grass, vec3(.13,.2,.15) * (.9 + .1*sin(r*2.1)*fine), lawn);
        grass = mix(grass, vec3(.2,.19,.17), .6*(1. - smoothstep(.0, .045, abs(olaNoise(vec2(ang*5.5 + 3., r*.02)) - .5))) * (1. - lawn));      // worn paths up the slope
        float wet = 1. - smoothstep(.15, 1.5, vL.y), stones = smoothstep(.7, .8, olaNoise(vL.xz*1.7 + 4.)) * smoothstep(.45, .6, olaNoise(vL.xz*.23)) * wet;      // (round stones in loose scatters, not a row)
        grass = mix(grass, vec3(.04,.05,.055), wet*.8); grass = mix(grass, vec3(.2,.21,.23), stones*.7*fine + stones*.1*(1.-fine));
        alb = mix(alb, grass, turf);
        // cut stone: joints along the seats and between the blocks, a worn lighter nosing at each tread's edge
        float arc = ang*r, jw = min(fwidth(arc)*.8, .4), joint = 1. - smoothstep(.04+jw, .1+jw, abs(fract(arc/2.6 + floor(r/4.)*.37) - .5)*2.6);
        float nose = smoothstep(.72, .98, fract((r - ${B.low}.)/${B.tread}.)) * step(.5, n.y);
        alb *= mix(1., .9 + .2*olaNoise(vec2(arc*.4, r*.9)), 1.-turf);
        alb *= 1. - .14*tier*(1.-joint)*fine;
        alb *= 1. + .12*tier*nose;
        alb *= 1. - .2*tier*step(.5, n.y)*(1. - smoothstep(.0, .17, fract((r - ${B.low}.)/${B.tread}.)))*clamp(1.5 - .9*foot, 0., 1.);      // the worn dark foot of each riser: an empty tier is still read as steps
        // paving (the stage, the terraces of its stepped sides, the ring round the pool): large slabs, dark joints, each slab its own tone,
        // and the wear of feet down the stage's middle
        vec2 sl = vec2(vL.x/3.2 + .5*floor(vL.z/2.1), vL.z/2.1), sc = floor(sl), sf = fract(sl);
        float jx = min(sf.x, 1. - sf.x)*3.2, jz = min(sf.y, 1. - sf.y)*2.1, jd = min(jx, jz), jf = clamp(foot*.9, 0., .5);
        float slabJ = (1. - smoothstep(.02 + jf*.4, .07 + jf, jd)) * clamp(1.3 - 2.*foot, 0., 1.);
        alb *= mix(1., (.86 + .26*olaHash(sc)) * (1. - .34*slabJ) * (1. + .1*exp(-min(vL.x*vL.x, 900.)/26.)), pave);
        float drift = mix(1., smoothstep(.22, .5, swell + .25*gn) * (1. - wet), turf);                 // on the hill the snow lies in drifts
        alb = mix(alb, vec3(.5,.54,.62), uSnow * smoothstep(.5,.8,n.y) * mix(.5, 1., turf) * (.85+.15*gn) * drift * (1. - .75*pave*exp(-min(vL.x*vL.x, 900.)/60.)));      // (the stage's middle is swept)
        // the walls of the stepped sides: courses of cut stone with broken joints, and a coping stone along every top
        float crs = fract(vL.y/.57), run = vL.z*.92 + vL.x*.39, stag = fract(run/1.9 + .5*floor(vL.y/.57)), wf = clamp(1.3 - 2.2*max(fwidth(vL.y), fwidth(run)), 0., 1.);
        float mortar = max(1. - smoothstep(.0, .09, min(crs, 1. - crs)), 1. - smoothstep(.0, .03, min(stag, 1. - stag)));
        float cope = 1. - smoothstep(.34, .4, vTop), under = smoothstep(.34, .4, vTop) * (1. - smoothstep(.44, .6, vTop));
        alb *= mix(1., (1. - .2*mortar*wf*(1. - cope)) * (.9 + .2*olaHash(vec2(floor(vL.y/.57), floor(run/1.9 + .5*floor(vL.y/.57))))) * (1. + .3*cope) * (1. - .3*under), wall);
        // what reaches a wall that the star only grazes: the light the pale floor at its foot throws back, and the amber of the crowd's lamps
        vec3 bounce = uStarCol * .2 * wall * bowlLit(vec3(vL.x + n.x*2.5, vL.y, vL.z)) + vec3(1., .44, .095) * wall * (.05 + .1*exp(-clamp(vTop, 0., 40.)/1.6));
        // the portal's own pale light on the stage before the arch and up the stepped sides: it moves as the light in the arch moves
        vec3 pq = vec3(vL.x, vL.y - ${(B.yStage + 9).toFixed(1)}, vL.z + ${(B.arch - 1.5).toFixed(1)}); float pr = length(pq * vec3(1., 1.3, 1.));      // (the middle of the arch's light: within its depth, 1.5 m toward the pool from its plane)
        float inNotch = step(abs(vL.x), ${(B.notch + STEPS.n * STEPS.w + 0.5).toFixed(1)}) * step(0., pq.z) * step(vL.z, 0.) * (1. - turf) * (1. - tier);
        float psw = olaNoise(vec2(pr*.16 - uTime*.5, vL.y*.5 + vL.x*.11 + uTime*.21)) * .65 + olaNoise(vec2(pq.z*.33 + uTime*.4, (vL.y + vL.x*.7)*.33 - uTime*.27)) * .5;
        vec3 port = vec3(.71, .80, 1.) * 1.1 * inNotch * exp(-min(pr, 400.)/26.) * (.25 + .75*smoothstep(.2, .95, psw)) * mix(1., .6, step(.5, n.y));
        float lit = bowlLit(vL);
        // the crowd's own second shadows on the steps: carry the point up the star's ray and ask the seats it passes (five places, each read
        // of the table standing alone). Where a seat is smaller than a pixel the pattern melts to its MEAN: the tier's filled share times
        // the share of a seat's width a body shades (${0.7}).
        vec3 s0 = seatAt(vL + vec3(0., .30*${TAN_EL.toFixed(5)} + .04, -.30)), s1 = seatAt(vL + vec3(0., 1.02*${TAN_EL.toFixed(5)} + .04, -1.02)), s2 = seatAt(vL + vec3(0., 1.94*${TAN_EL.toFixed(5)} + .04, -1.94));
        vec3 s3 = seatAt(vL + vec3(0., 3.06*${TAN_EL.toFixed(5)} + .04, -3.06)), s4 = seatAt(vL + vec3(0., 4.38*${TAN_EL.toFixed(5)} + .04, -4.38));
        float h0 = texture2D(uSeats, s0.xy).r, h1 = texture2D(uSeats, s1.xy).r, h2 = texture2D(uSeats, s2.xy).r, h3 = texture2D(uSeats, s3.xy).r, h4 = texture2D(uSeats, s4.xy).r;
        float sh = max(max(max(s0.z*step(.5, h0), s1.z*step(.5, h1)), max(s2.z*step(.5, h2), s3.z*step(.5, h3))), s4.z*step(.5, h4));
        float kt = clamp(floor((r - ${B.low}.)/${B.tread}.), 0., ${B.tiers - 1}.), meanSh = uTierFill[int(kt)] * .7;
        lit *= 1. - .85 * tier * mix(meanSh, sh, fine);
        // THE HELD GLOBES' LIGHT ON THE STEPS: on each tread, the globes of its two rows (the seat abreast and its neighbour to the nearer
        // hand in each), by the metres from each globe. Where a seat is smaller than a pixel: the MEAN of that (0.85 with every globe
        // there) times the half of the tier's filled seats that hold one.
        float a01 = ang + (1. - step(0., ang))*6.2831853, fT = r - ${B.low}. - ${B.tread}.*kt, jy = (2.*kt + .5)/${B.tiers * 2}., jy1 = (2.*kt + 1.5)/${B.tiers * 2}.;
        vec4 rA = rowAt(a01, kt, 0.), rB = rowAt(a01, kt, 1.);
        float gA0 = texture2D(uSeats, vec2((rA.x + .5)/1024., jy)).a, gA1 = texture2D(uSeats, vec2((rA.y + .5)/1024., jy)).a, gB0 = texture2D(uSeats, vec2((rB.x + .5)/1024., jy1)).a, gB1 = texture2D(uSeats, vec2((rB.y + .5)/1024., jy1)).a;
        float dA = fT - ${(1.15 - GLOBE_IN).toFixed(2)}, dB = fT - ${(2.95 - GLOBE_IN).toFixed(2)}, oA = .9 - abs(rA.z), oB = .9 - abs(rB.z);
        float pools = step(.75, gA0)*.35/(.55 + dA*dA + rA.z*rA.z) + step(.75, gA1)*.35/(.55 + dA*dA + oA*oA) + step(.75, gB0)*.35/(.55 + dB*dB + rB.z*rB.z) + step(.75, gB1)*.35/(.55 + dB*dB + oB*oB);
        vec3 held = vec3(1., .44, .095) * .55 * tier * mix(uTierFill[int(kt)] * .42, pools, fine);
        vec3 c = alb * (olaLight(n, lit * olaBands(vW.xz)) + bounce + port + held) + olaLamps(vW.xz, alb) * max(step(${B.top}., length(vL.xz)), pave);      // (the lamps' pools lie on the ground itself: the hill's paths, the rim walk, the stage and its terraces)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const shell = new THREE.Mesh(await shellGeometry(ctx.yield), stone); object.add(shell);
  await ctx.yield();
  // ---- the pool: still dark water in a bowl full of lights. NOTHING IS IN IT OR ON IT: all that it shows is what stands over it, by the
  // water's own law. Slack water is a mirror: the sky's tone and stars, the far side's line, the star where the eye meets its mirror
  // angle, the tiers' held globes as points wherever the mirrored ray runs low enough to meet them (worked on the tiers' own cone).
  // THE SURFACE LIVES: the night air crosses it in cat's-paws and a slow swell passes under them. Ruffled water turns the mirrored ray
  // by up to POOL_SPREAD (the tangent of twice a ripple's slope), and far more along the eye's line than across it: so every light that
  // stands low beyond the water (the tiers' amber to either hand of the notch, the arch's pale light down its middle) is drawn out
  // into a long streak that reaches in from the far rim toward the eye, broken into glints that move with the ripples, its light
  // spread over its length. At the rim the water wets the stone: a thin line that gives back the paved ring's own light.
  // POOL_FLOOR: the water's least tone. By my count of the engine's grade with this world's settings (shots/.../fix3/grade.mjs) a grey
  // of 0.041 is the first tone the display shows at all; every channel of the floor lies above it (it shows as 17, 29, 71 of 255), so
  // no part of the pool is pure black: the depth of the water under a night sky, never a hole.
  const K_T = B.rise / B.tread, A_T = B.low + (B.yPool - B.yLow) / K_T, POOL_SPREAD = 0.55, POOL_FLOOR = [0.045, 0.05, 0.085];
  const H_LOW = B.yLow + B.rise - B.yPool, H_TOP = B.yLow + B.rise * B.tiers - B.yPool, f2 = (v) => v.toFixed(2);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(B.pool, 64).rotateX(-Math.PI / 2).translate(0, B.yPool, 0), new THREE.ShaderMaterial({ uniforms: { ...LU, ...WU, uRough: { value: 0.12 }, uTierFill: stone.uniforms.uTierFill }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vW, vL, vCamL; ${LIGHT_GLSL} void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = olaW(w.xyz); vL = position;
      vCamL = (inverse(modelMatrix)*vec4(cameraPosition, 1.)).xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform float uTierFill[${B.tiers}]; varying vec3 vW, vL, vCamL; ${LIGHT_GLSL} ${WATER_GLSL} ${BOWL_LIT_GLSL}
      float edge3(float x){ return smoothstep(-1.5, 1.5, x); }
      void main(){ vec3 cam = olaW(cameraPosition), V = vW - cam; float dist = length(V); V /= max(dist, 1e-3);
        float fine = clamp(1.4 - 2.2*max(fwidth(vW.x), fwidth(vW.z)), 0., 1.), t = uTime;
        // (every derivative before a branch or a product that can be zero)
        vec3 rl = vL - vCamL; rl.y = abs(rl.y) + 1e-3; float s = max(length(rl.xz), 1e-4), m = rl.y / s; vec2 dh = rl.xz / s;
        float b = dot(vL.xz, dh), r2 = dot(vL.xz, vL.xz);
        float tLow = -b + sqrt(max(b*b + ${f2(B.low * B.low)} - r2, 0.)), tTop = -b + sqrt(max(b*b + ${f2(B.top * B.top)} - r2, 0.));
        vec2 pm = vL.xz + dh * mix(tLow, tTop, .35);                                                // where the eye's line, carried on over the water, stands among the tiers
        float fc = atan(pm.x, -pm.y) * 52., colG = clamp(1.5 - 1.3*fwidth(fc), 0., 1.);            // the tiers in columns some 1.6 m wide, each with its own share of globes
        vec3 c = olaWater(vW.xz, V, fine, bowlLit(vL), 1.);
        // a still dark pool gives back more of the sky than moving water: the sheen that says it is water. The cat's-paws drift on a
        // TYPED course of their own, not read from the evening's wind: the broad patches at about a metre a second, some 110 degrees
        // off the wind's bearing, the small ones across them at a quarter of a metre a second (about 40 degrees off it). Ruffled
        // water gives back a paler, softer sky, slack water stays a dark mirror
        float dep = clamp(-V.y, .002, 1.), back = clamp(V.z, 0., 1.) / max(length(V.xz), 1e-3);
        float paw = .6*olaNoise(vL.xz*.1 + vec2(t*.09, t*.05)) + .4*olaNoise(vL.xz*.29 - vec2(t*.07, 0.) + 7.), ruff = smoothstep(.36, .62, paw) * fine + .45*(1. - fine);
        float swell = .5 + .5*sin(dot(vL.xz, vec2(.21, .13)) - t*.6 + 2.6*olaNoise(vL.xz*.07));      // a slow swell, its crests some 25 m apart
        c += olaSkyUp(dep, back) * (.3 + .55*ruff) * (1. - .5*dep);
        // how far the water turns the mirrored ray along the eye's line (in the tangent of its height), and the glints it is broken into:
        // long along the eye's line, narrow across it, moving with the ripples; under a pixel they go to their mean
        float sp = mix(.04, ${POOL_SPREAD}, ruff) * (.75 + .5*swell);
        float gu = dot(vL.xz, dh), gv = dot(vL.xz, vec2(-dh.y, dh.x));
        float g1 = olaNoise(vec2(gv*6., gu*.5) + vec2(t*.6, -t*.9)), g2 = olaNoise(vec2(gv*2.4 + 9., gu*.22) - vec2(t*.35, t*.5));
        float g3 = olaNoise(vec2(gv*13., gu*1.4) + vec2(-t*.9, -t*1.6));
        float gn = clamp((.45*g1 + .25*g2 + .3*g3 - .27)*2.2, 0., 1.), gnA = clamp((.3*g1 + .4*g2 + .3*g3 - .27)*2.2, 0., 1.);      // (spread to the whole of 0..1)
        // THE TIERS' AMBER: the tiers stand between two heights over the water in the mirrored ray's direction (mLo to mHi, as tangents).
        // Within that band the mirror is full of their light; above it (water nearer the eye) only the steeper ripples still catch a
        // globe, fewer and fewer of them: so the light does not dim toward the eye, its GLINTS THIN OUT (each glint a globe's own light)
        float mLo = ${f2(H_LOW)} / max(tLow, 1.), mHi = ${f2(H_TOP)} / max(tTop, 1.), over = max(m - mHi, 0.) / (1.1*sp);
        float W = edge3((m - mLo)/sp) * exp(-min(over*over, 30.));
        float have = mix(1., clamp((stepTop(pm.x) - ${f2(B.yLow)}) / ${f2(B.rise * B.tiers)}, 0., 1.), step(pm.y, 0.));      // (the notch and its stepped sides hold less of the tiers, or none)
        float fillM = (uTierFill[2] + uTierFill[8] + uTierFill[14] + uTierFill[20]) * .25;
        // (and in ruffled water the steepest ripples catch a globe from the stands to either hand: a thin scatter of amber glints in
        // every cat's-paw, thicker toward the rim under the stands that stand full behind it; none where the notch opens)
        vec2 po = vL.xz / max(sqrt(r2), 1e-3) * 84.;
        float under = smoothstep(16., 33., sqrt(r2)) * mix(1., clamp((stepTop(po.x) - ${f2(B.yLow)}) / ${f2(B.rise * B.tiers)}, 0., 1.), step(po.y, 0.));
        float d = max(have * W * mix(1., .45 + 1.1*olaNoise(vec2(fc, 2.7)), colG), ruff * (.2 + .5*under)) * fillM * 1.6;      // how thick the glints lie here
        float glint = mix(d*d*.5, smoothstep(1. - .72*d, 1.5 - .72*d, gn), fine);
        c += vec3(1., .44, .095) * .5 * glint * (1. - .35*dep);
        // THE ARCH'S PALE LIGHT, down the middle of the far water: the arch stands ${ARCH.a} m along the axis, its opening ${2 * ARCH.inner} m wide and ${ARCH.spring + ARCH.inner} m high
        float tA = (${f2(-ARCH.a)} - vL.z) / min(dh.y, -1e-3), xA = (vL.x + dh.x*tA) / (${f2(ARCH.inner)} + tA*sp*.35);
        float mA0 = ${f2(B.yStage - B.yPool)} / max(tA, 1.), mA1 = ${f2(B.yStage + ARCH.spring + ARCH.inner - B.yPool)} / max(tA, 1.), overA = max(m - mA1, 0.) / (1.1*sp);
        float dA = step(dh.y, -.05) * edge3((m - mA0)/sp) * exp(-min(overA*overA, 30.)) * exp(-min(xA*xA*1.4, 30.));
        c += vec3(.71, .80, 1.) * .55 * mix(dA*dA*.5, smoothstep(1. - .72*dA, 1.5 - .72*dA, gnA), fine);
        // the tiers in slack water: the mirrored ray from this point of the pool, met with the cone of the tiers; each globe a point
        float Bq = m / ${K_T.toFixed(4)}, den = min(Bq*Bq - 1., -1e-3), ab = ${A_T.toFixed(2)}*Bq - b;
        float tau = (-ab - sqrt(max(ab*ab - den*(${(A_T * A_T).toFixed(1)} - r2), 0.))) / den, rh = ${A_T.toFixed(2)} + Bq*tau;
        vec2 hp = vL.xz + dh*tau; float hy = ${B.yPool.toFixed(2)} + m*tau;
        hp += (vec2(olaNoise(vL.xz*.9 + t*.3), olaNoise(vL.xz*.9 + 3.7 - t*.25)) - .5) * clamp(tau, 0., 200.) * .05 * fine;      // (the ripple breaks the image)
        float on = step(Bq, .985) * smoothstep(${B.low}., ${B.low + 3}., rh) * (1. - smoothstep(${B.top - 6}., ${B.top}., rh));
        on *= 1. - step(0., -hp.y) * step(stepTop(hp.x), hy);                                       // (over the stage and its stepped sides the mirror finds no crowd)
        float kt = clamp(floor((rh - ${B.low}.)/${B.tread}.), 0., ${B.tiers - 1}.);
        vec2 cell = floor(vec2(rh*2., atan(hp.x, hp.y)*rh*1.1)); float grain = clamp(1.6 - 1.2*length(fwidth(hp))*2., 0., 1.);
        float spk = mix(.5, 3.2*step(.84, olaHash(cell)), grain);
        c += vec3(1., .44, .095) * on * uTierFill[int(kt)] * spk * .26 * (1. - .6*dep) * (1.2 - .7*ruff);      // the tiers' held globes in the mirror: points near the far rim
        // the wet rim: where the water meets the paved ring it gives back the ring's own light in a thin line that the ripples move
        float rim = smoothstep(${f2(B.pool - 0.75)}, ${f2(B.pool - 0.25)}, sqrt(r2) + .14*(olaNoise(vL.xz*1.7 + t*.4) - .5));
        c = mix(c, vec3(.15, .16, .21) + vec3(1., .44, .095) * .04 * fillM, rim * .8);
        // the water's least tone (POOL_FLOOR, above) where it lies slack; where the air ruffles it, it gives back a wider and paler sky
        c = max(c, vec3(${POOL_FLOOR.join(', ')})) * (1. + ruff * (.2 + .45*gn) + .16*(swell - .5));
        gl_FragColor = vec4(olaFog(c, dist), 1.); }` }));
  pool.renderOrder = 1;
  object.add(pool);
  // ---- the sky the bowl faces
  const sky = makeSkyGroup({ late: !!opts.late, rare: !!opts.rare, highCloud: !!opts.highCloud, LU, streams: S });
  // the sky's own stars seen again in the pool: each where the eye's line to its image crosses the water, inside the pool's round only
  if (sky.stars) { const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
    g.setAttribute('aStar', new THREE.InstancedBufferAttribute(sky.stars.dirs, 4)); g.setAttribute('aTw', new THREE.InstancedBufferAttribute(sky.stars.tw, 2)); g.instanceCount = sky.stars.n;
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: LU.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`attribute vec4 aStar; attribute vec2 aTw; uniform float uTime; varying vec2 vQ; varying float vB;
      void main(){ vec3 s = aStar.xyz, d = vec3(s.x*${Math.cos(STAR_AZ * DEG).toFixed(5)} + s.z*${Math.sin(STAR_AZ * DEG).toFixed(5)}, -s.y, -s.x*${Math.sin(STAR_AZ * DEG).toFixed(5)} + s.z*${Math.cos(STAR_AZ * DEG).toFixed(5)});      // into the bowl's frame, mirrored
        vec3 camL = (inverse(modelMatrix)*vec4(cameraPosition, 1.)).xyz; float hgt = camL.y - ${B.yPool.toFixed(2)}, t = max(hgt, 0.) / max(s.y, .02);
        vec3 hit = camL + d*t, a = normalize(cross(d, vec3(0., 1., .01))), b = cross(a, d);
        float inside = step(.05, hgt) * step(length(hit.xz), ${(B.pool - 0.4).toFixed(1)});
        vQ = position.xy; vB = aStar.w * (.72 + .28*sin(uTime*aTw.y + aTw.x)) * smoothstep(.03, .2, s.y) * .55 * inside;
        vec4 p = projectionMatrix*viewMatrix*modelMatrix*vec4(camL + (d + (a*position.x + b*position.y)*.0042) * t * .997, 1.);
        gl_Position = inside > 0. ? p : vec4(2., 2., 2., 1.); }`,
      fragmentShader: /* glsl */`varying vec2 vQ; varying float vB;
      void main(){ float r2 = dot(vQ,vQ), px = max(fwidth(vQ.x), 1e-4), s = max(.3, 1.1*px);
        gl_FragColor = vec4(vec3(.74,.82,1.) * vB * 1.5 * exp(-r2/(s*s)) * (1. - smoothstep(.6, 1., sqrt(r2))) * pow(min(1., .3/s), 1.2), 1.); }` }));
    m.frustumCulled = false; m.renderOrder = 2; object.add(m); }
  if (alone) {      // in the part viewer: full starlight, the hill's own lights, the sky hung on the hero and turned so that the star stands over the notch
    object.add(sky.group); sky.group.rotation.y = STAR_AZ * DEG; sky.group.scale.setScalar(0.9);      // (the viewer's far plane is nearer than the world's: the dome is drawn inside it)
    setLights(LU, 1, false);
  }
  await ctx.yield();
  // ---- the crowd, the floats, the masts (the bowl's own cast); the route is only asked how far it is
  const RU = opts.RU || { uRes: { value: new THREE.Vector2(1280, 720) } };
  // (the lamps' light on the ground: the world's one map, or the bowl's own when it stands alone)
  const ownMap = opts.lamp ? null : makeLampMap(LU, { x0: -232, z0: -232, w: 464, h: 464 }), lamp = opts.lamp || ((x, z, r, k, h, foot, wide) => ownMap.stamp(x, z, r, k, h, foot, wide));
  const dress = await dressBowl(object, { LU, RU, S, full: opts.full ?? 1, litGLSL: BOWL_LIT_GLSL, wind: opts.wind, far: opts.far, stone, lamp, yieldFn: ctx.yield });
  if (ownMap) await ownMap.finish(ctx.yield);
  const extras = null;
  return {
    object, radius: 150, height: 40, center: new THREE.Vector3(0, 16, 0), ground: false, sky, shell, pool, stone, dress,
    anchors: { arch: new THREE.Vector3(0, B.yStage + 11, -ARCH.a), axis: new THREE.Vector3(0, 0, -1), centre: bowlXZ(0, 0) },
    update(dt, time, camera) {
      if (alone) { LU.uTime.value = time; if (ctx.renderer) ctx.renderer.getDrawingBufferSize(RU.uRes.value); sky.update(time, camera); sky.group.position.sub(object.getWorldPosition(new THREE.Vector3())); }
      if (extras && extras.update) extras.update(dt, time, camera);
    },
    dispose() {},
  };
}

// the four lights, as the brief gives them, for a star of strength k (0..1): fill, afterglow, thread, star. The sky itself never brightens.
// (three.js spreads a light over pi; our own shaders do not, so the same numbers are used for both with the factor written once, here.)
export const LIGHT_K = { hemi: 1.7, glow: 0.3, band: 0.8, star: 0.72 };
export function setLights(LU, k, late) {
  LU.uHemiSky.value.set('#33447A').multiplyScalar(LIGHT_K.hemi * (late ? 0.8 : 1)); LU.uHemiGround.value.set('#181B2C').multiplyScalar(LIGHT_K.hemi);
  LU.uGlowDir.value.set(0, Math.sin(5 * DEG), Math.cos(5 * DEG)); LU.uGlowCol.value.set('#C79AA6').multiplyScalar(late ? 0 : LIGHT_K.glow * (1.1 - k));      // (the afterglow's rose is all but lost in the star's standing light: nothing in the country is rose or violet)
  LU.uBandDir.value.set(0, Math.sin(60 * DEG), -Math.cos(60 * DEG)); LU.uBandCol.value.set('#E9EEFA').multiplyScalar(LIGHT_K.band * 0.5);
  LU.uStarCol.value.set('#DCE8FF').multiplyScalar(LIGHT_K.star * 1.6 * k); LU.uStar.value = k;
}
