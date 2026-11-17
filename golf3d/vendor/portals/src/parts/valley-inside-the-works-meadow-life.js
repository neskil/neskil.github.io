// valley-inside-the-works, the meadow: LIFE. A dozen swallows hawking low over the river and the meadow on a loop
// laid by the plan (the kit's flock; counted here against the hall's columns, the trees, the field walls and the flown
// line); bees and butterflies over the flowers near the line; the
// drift of white hawthorn petals (look.petals) and the low dawn haze over the meadow (look.hour 'dawn').
// CLEAR AIR: every creature's whole course, with its roam and its body, stands 3 m or more off the line by this
// file's own count (the swallows 8 m); a group that could not be laid so is not drawn at all, and the part says so in
// what it hands back.
// Streams: 'meadow-swallows' the flock (the kit's deal and its start), 'meadow-swallows-course' the hand the loop is
// flown; 'meadow-bees', 'meadow-butterflies' the anchors and '...-kit' the kit's deals; 'meadow-web-form' and
// 'meadow-webs' (drawn, and nothing built from them); 'meadow-petals'.
import * as P from './valley-inside-the-works-plan.js';
import * as K from '../kit/fauna.js';
import { CH, smooth, routeAt, bare } from './valley-inside-the-works-meadow-field.js';
import { dryHeight } from './valley-inside-the-works-meadow-ground.js';

const KEEP = 3;
// THE SWALLOWS' COURSE, LAID BY THE PLAN: a closed loop on the left of the lower valley through the middles of the
// bays between the hall's column rows. It runs up the valley along the middle of the aisle between the two left-hand
// rows, turns through the middle of a bay of the outer row (midway between two of its columns) into the side aisle
// between that row and the long wall, runs back down the valley along that aisle's middle, and turns again through
// the middle of a bay: two straights joined by two half circles, 12 m over the ground or the river beneath. It
// begins in the first bay wholly past the entry and runs up the valley through as many bays as the seed's trees
// leave free, to the last bay wholly short of the scar at most (the plan's floorLevel steps up at z -38): no trunk
// within its crown and 15.5 m of the course's line (the flock's breadth, 3 m of air and a crown's loose sprays).
// Three bays it always has: the trees' own deal keeps off that least loop (swallowLeast).
export const SWALLOW = { height: 12, keep: 15.5, line: 8, scarFoot: -38 };
function swallowBays() {
  const xa = 0.5 * (P.COLUMN_X[0] + P.COLUMN_X[1]), xb = 0.5 * (P.SHED.x0 + P.COLUMN_X[0]), cx = 0.5 * (xa + xb), r = 0.5 * (xa - xb);
  const mid = (k) => 0.5 * (P.columnZ(k) + P.columnZ(k + 1)), dz = Math.sqrt(r * r - (P.COLUMN_X[0] - cx) * (P.COLUMN_X[0] - cx));
  let k0 = 0, k1; while (P.columnZ(k0) >= P.ENTRY.z) k0++;
  k1 = k0; while (P.columnZ(k1 + 2) > SWALLOW.scarFoot) k1++;
  // (a half circle's middle lies dz beyond its centre, so it crosses the outer row exactly midway between two columns)
  const lay = (ka, kb) => {
    const zA = mid(ka) - dz, zB = mid(kb) + dz, pts = [], n = Math.max(1, Math.round((zA - zB) / 21));
    for (let i = 0; i <= n; i++) pts.push([xa, zA + (zB - zA) * i / n]);
    for (let d = 30; d < 180; d += 30) pts.push([cx + r * Math.cos(d * Math.PI / 180), zB - r * Math.sin(d * Math.PI / 180)]);
    for (let i = 0; i <= n; i++) pts.push([xb, zB + (zA - zB) * i / n]);
    for (let d = 30; d < 180; d += 30) pts.push([cx - r * Math.cos(d * Math.PI / 180), zA + r * Math.sin(d * Math.PI / 180)]);
    return pts;
  };
  const distance = (pts, x, z) => {
    let best = 1e9;
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length], ex = B[0] - A[0], ez = B[1] - A[1], t = Math.min(Math.max(((x - A[0]) * ex + (z - A[1]) * ez) / (ex * ex + ez * ez), 0), 1);
      best = Math.min(best, Math.hypot(x - A[0] - ex * t, z - A[1] - ez * t));
    }
    return best;
  };
  return { k0, k1, lay, distance };
}
// how near a place is to the least loop (its first three bays), for the trees' deal
export function swallowLeast() { const B = swallowBays(), pts = B.lay(B.k0, B.k0 + 2); return (x, z) => B.distance(pts, x, z); }
// the course on this seed's trees: { pts: its points in plan, bays }
export function swallowCourse(sites) {
  const B = swallowBays();
  for (let kb = B.k1; kb >= B.k0 + 2; kb--) {
    const pts = B.lay(B.k0, kb);
    if (sites.every((t) => B.distance(pts, t.x, t.z) >= t.crown + SWALLOW.keep)) return { pts, bays: kb - B.k0 + 1 };
  }
  return null;
}

// (sweets: what the sweets' deal hands back, where there is one: gap(x, z), how far a place is from the nearest drum of
// any sweet; tall, the canes and lollipops as { x, z, crown })
export async function meadowLife(ctx, o, field, mats, meshesFrom, sites, walls, sweets = { gap: () => 1e9, tall: [] }) {
  const THREE = o.THREE, group = new THREE.Group(), items = [], owned = [], info = {};
  group.name = 'valley-life';
  let triangles = 0, drawCalls = 0, minClear = 1e9;
  // the flown line as the kit's clearing walks it: the 60 m straight behind the entry, then the line itself, a point a metre
  const path = ctx.core.makePath(P.ROUTE), v = new THREE.Vector3(), line = [[P.ENTRY.x, P.ENTRY.y, P.ENTRY.z + 60]];
  for (let d = 0; d <= path.length; d += 1) { path.posAtDist(d, v); line.push([v.x, v.y, v.z]); }
  const light = { sunDir: o.lightDir, sunColor: o.look.sun, sunIntensity: 1.2, sky: o.look.sky, skyIntensity: 2.3, ground: o.look.shade, groundIntensity: 2.3 };
  const add = (f, name, clear) => {
    info[name] = { clear: +clear.toFixed(2), short: f.kept ? f.kept.short : null, moved: f.kept ? +(+f.kept.moved || 0).toFixed(2) : null, count: f.count };
    owned.push(f.geometry, f.material);
    if (!(clear >= KEEP) || (f.kept && f.kept.short > 0)) { info[name].left = true; return; }
    f.object.name = name; group.add(f.object); items.push(f); triangles += f.triangles; drawCalls += 1; minClear = Math.min(minClear, clear);
  };
  // THE SWALLOWS: the kit's scythe-winged bird in a swallow's coat, a loose dozen strung along the course the plan lays
  await ctx.yield();
  const course = swallowCourse(sites.filter((t) => t.z > SWALLOW.scarFoot));
  if (!course) info.swallows = { left: true, bays: 0 };
  else {
    const pts = o.rngFor('meadow-swallows-course')() < 0.5 ? course.pts : course.pts.slice().reverse();
    const route = pts.map(([x, z]) => [x, Math.max(P.groundHeight(x, z), P.liquidY(z)) + SWALLOW.height, z]);
    const flock = await K.makeFlockAsync({
      rng: o.rngFor('meadow-swallows'), species: 'swifts', count: 12, size: 3, speed: 15, form: 'loose', spread: [1.8, 1.4, 8], maxSigma: 3, wander: [0.8, 0.6, 0.8, 0.7],
      body: '#141c34', wingC: '#10162a', belly: '#eadfc8', head: '#1a2038', tailC: '#0e1220', route, closed: true, light,
      keepClear: { path: line, dist: KEEP, each: true, up: true, step: 2 },
    }, ctx.yield, 1);
    await ctx.yield();
    // THE COUNT: every bird's own way round the whole course (the course's point and the bird's dealt place about it,
    // with its roam and its body) against the flown line, the hall's columns (shafts 1.5 m across), the trees (crown
    // and 3 m of loose sprays) and the tall sweets with them (their reach for a crown), the field walls' copes, the shed's stairs along the long wall, the roof's girders and
    // the tallest plants under it
    const R = flock.reach, off = R.offsets, roamXZ = Math.hypot(R.wander[0], R.wander[2]) + R.body, roamY = R.wander[1] + R.body, roam = Math.hypot(R.wander[0], R.wander[1], R.wander[2]) + R.body;
    const c = { line: 1e9, columns: 1e9, trees: 1e9, wallTops: 1e9, stairs: 1e9, girders: 1e9, plants: 1e9 }, stand = sites.concat(sweets.tall);
    for (let s = 0, n = 0; s < flock.route.length; s += 1) {
      flock.route.pointAt(s, v);
      for (let i = 0; i < off.length; i += 3) {
        const x = v.x + off[i], y = v.y + off[i + 1], z = v.z + off[i + 2], k = Math.round((200 - z) / 20), g = Math.max(dryHeight(x, z), P.liquidY(z));
        c.line = Math.min(c.line, P.routeDistance(x, y, z) - roam);
        for (const cx of P.COLUMN_X) c.columns = Math.min(c.columns, Math.hypot(x - cx, z - P.columnZ(k)) - 0.75 - roamXZ);
        for (const t of stand) if (Math.abs(t.z - z) < 40) c.trees = Math.min(c.trees, Math.hypot(x - t.x, z - t.z) - t.crown - 3 - roamXZ);
        if (walls.distance(x, z) < 0.95 + roamXZ) c.wallTops = Math.min(c.wallTops, y - roamY - g - 4.6);
        c.stairs = Math.min(c.stairs, x - roamXZ - (P.SHED.x0 + 6.4)); c.girders = Math.min(c.girders, P.SHED.roofValley - 4 - y - roamY); c.plants = Math.min(c.plants, y - roamY - g - 5.1);
      }
      if (++n % 10 === 0) await ctx.yield();
    }
    const ok = c.line >= SWALLOW.line && c.columns >= KEEP && c.trees >= KEEP && c.wallTops >= 0.3 && c.stairs >= 0.3 && c.girders >= KEEP && c.plants >= 0.3;
    add(flock, 'swallows', ok ? c.line : 0);
    info.swallows.bays = course.bays; info.swallows.roam = +roamXZ.toFixed(2); info.swallows.lap = Math.round(flock.route.length);
    for (const key of Object.keys(c)) info.swallows[key] = +Math.min(c[key], 999).toFixed(2);
  }
  await ctx.yield();
  // WHERE THE FLOWN LINE LIES OVER THE LOWER VALLEY'S LAND, by the plan's bankDistance under the line: from where it
  // first comes over land past the entry (zOn) to where it last leaves the land before the pool (zOff). The insects
  // are dealt along that stretch.
  let zOn = P.ENTRY.z, zOff = P.FALL_Z;
  while (zOn > P.FALL_Z && P.bankDistance(routeAt(zOn)[0], zOn) <= 0) zOn -= 0.25;
  while (zOff < zOn && P.bankDistance(routeAt(zOff)[0], zOff) <= 0) zOff += 0.25;
  // what stands in the meadow that a small flier must keep off: a field wall, a column of the hall, a trunk,
  // a sweet (every drum of it, by 0.3 m)
  const clearOf = (x, z, r) => field.wallDistance(x, z) >= r + 1.2 && sweets.gap(x, z) >= r + 0.3 && sites.every((t) => Math.hypot(x - t.x, z - t.z) >= r + 0.8) && P.COLUMN_X.every((cx) => Math.hypot(x - cx, z - P.columnZ(Math.round((200 - z) / 20))) >= r + 1.05);
  // BEES AND BUTTERFLIES over the flowers near the line: anchors of this part's own deal (a cluster's dice before its tests),
  // in the drifts of daisy and clover, each anchor stood off the line by the keep, its roam (R) and a margin, and off
  // every wall, column and trunk by its roam
  const anchors = (rng, n, per, lo, hi, R) => {
    const out = [];
    for (let c = 0; c < 160; c++) {
      const z = zOn - (zOn - zOff) * rng(), side = rng() < 0.5 ? -1 : 1, lat = 6.5 + 9 * rng(), keep = rng(), dice = [];
      for (let i = 0; i < per * 3; i++) dice.push(rng());
      const cx = routeAt(z)[0] + side * lat;
      if (out.length >= n || bare(cx, z) || keep > 0.2 + 1.6 * (field.at(CH.daisy, cx, z) + field.at(CH.clover, cx, z))) continue;
      for (let i = 0; i < per && out.length < n; i++) {
        let x = cx + (dice[i * 3] - 0.5) * 6; const pz = z + (dice[i * 3 + 1] - 0.5) * 6, y = dryHeight(x, pz) + lo + (hi - lo) * dice[i * 3 + 2];
        const lack = KEEP + 0.4 + R - P.routeDistance(x, y, pz); if (lack > 0) x += side * lack * 1.6;
        if (P.routeDistance(x, y, pz) >= KEEP + 0.4 + R && clearOf(x, pz, R)) out.push([x, y, pz]);
      }
    }
    return out;
  };
  const insects = (make, name, n, per, lo, hi, R, opts) => {
    const pts = anchors(o.rngFor('meadow-' + name), n, per, lo, hi, R); if (!pts.length) return;
    const f = make({ rng: o.rngFor('meadow-' + name + '-kit'), count: pts.length, positions: pts, maxSigma: 3, light, keepClear: { path: line, dist: KEEP, up: true, step: 1 }, ...opts });
    let clear = 1e9; const a = f.anchors;
    for (let i = 0; i + 2 < a.length; i += 3) clear = Math.min(clear, P.routeDistance(a[i], a[i + 1], a[i + 2]) - f.reach.radius);
    add(f, name, clear);
  };
  insects(K.makeBees, 'bees', 40, 8, 1.7, 3.1, 2.4, { size: 3 });
  await ctx.yield();
  insects(K.makeButterflies, 'butterflies', 26, 3, 2.0, 4.2, 4.2, { size: 3 });
  await ctx.yield();
  // NO WEB IS BUILT. The two streams the webs were dealt from are still drawn as they were when webs stood (nine dice
  // of 'meadow-web-form', six for each of ninety tries of 'meadow-webs'), by order, and nothing is made of them.
  { const fr = o.rngFor('meadow-web-form'), rng = o.rngFor('meadow-webs'); for (let k = 0; k < 9; k++) fr(); for (let i = 0; i < 540; i++) rng(); }
  await ctx.yield();
  return { object: group, items, owned, info, triangles, drawCalls, minClear, line };
}

// THE PETALS (look.petals): white hawthorn petals falling the length of the valley, each down a column of its own with a
// sway of 0.45 m; a column is kept by its distance from the flown line in plan, with the sway and the petal's own size
// taken off first: all of them beyond 11 m, fewer nearer, none at all within 3 m; BEHIND THE ENTRY none within 8.5 m
// of the straight the plan lays there (the opening's half width and 2 m). The fall is the shader's; the sun reaches
// a petal in the roof's bars only.
export function petalDrift(THREE, o, uTime) {
  const rng = o.rngFor('meadow-petals'), A = [], B = [];
  let minClear = 1e9;
  for (let i = 0; i < 2000; i++) {
    const z = 208 - 434 * rng(), lat = (rng() - 0.5) * 84, keep = rng(), ph = rng(), sp = rng(), tw = rng(), sw = rng(), top = rng();
    const x = routeAt(z)[0] + lat, d = P.routeDistanceXZ(x, z) - 0.9;
    if (bare(x, z) && P.bankDistance(x, z) > 1 || keep >= smooth(3, 11, d) || (z > P.ENTRY.z && d < 8.5)) continue;
    if (d < minClear) minClear = d;
    A.push(x, Math.max(P.groundHeight(x, z), P.liquidY(z)) + 0.05, z, ph); B.push(9 + 14 * top, 0.9 + 0.8 * sp, 1.2 + 2.2 * tw, sw);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.09, 0, 0, 0.09, 0, 0, 0, 0.21, 0.03, 0, -0.07, 0.02], 3)); g.setIndex([0, 1, 2, 1, 0, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
  g.instanceCount = A.length / 4;
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSun: { value: o.look.sun.clone().multiplyScalar(0.9) }, uSky: { value: o.look.sky.clone().multiplyScalar(0.72) } }]);
  uniforms.uTime = uTime;
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aA; attribute vec4 aB; uniform float uTime; varying float vLit; varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
void main() {
  float t = fract(aA.w + uTime * aB.y / aB.x), ang = uTime * aB.z + aB.w * 6.2832, c = cos(ang), s = sin(ang), c2 = cos(ang * 0.7 + 1.3), s2 = sin(ang * 0.7 + 1.3);
  vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  p = vec3(p.x, p.y * c2 - p.z * s2, p.y * s2 + p.z * c2) * (smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.985, 1.0, t)));
  vec3 w = vec3(aA.x + 0.45 * sin(ang * 0.31 + aB.w * 40.0), aA.y + aB.x * (1.0 - t), aA.z + 0.45 * cos(ang * 0.27 + aB.w * 23.0)) + p;
  vW = w; vLit = 0.55 + 0.45 * abs(c2);
  vec4 mvPosition = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `uniform vec3 uSun; uniform vec3 uSky; varying float vLit; varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
` + P.LIGHT_BAR_GLSL + `
void main() {
  gl_FragColor = vec4(vec3(0.86, 0.85, 0.8) * (uSky + uSun * (lightBar(vW) * vLit)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'petals'; mesh.frustumCulled = false;
  return { object: mesh, owned: [g, m], triangles: 2 * g.instanceCount, drawCalls: 1, minClear, count: g.instanceCount };
}

// THE DAWN HAZE (look.hour 'dawn'): one low sheet 2.3 m over the meadow, none over the river, the scar or the terrace,
// and none near the flown line: a point of it is 12.5 m or more from the line (no cell of the sheet is so wide that a
// part of it with any haze in it could come within 3 m).
export function dawnHaze(THREE, o, field) {
  const NXH = 27, NZH = 74, pos = [], col = [], idx = [];
  for (let j = 0; j < NZH; j++) for (let i = 0; i < NXH; i++) {
    const x = -80 + 160 * i / (NXH - 1), z = 210 - 440 * j / (NZH - 1), y = Math.max(P.groundHeight(x, z), P.liquidY(z)) + 2.3;
    const a = bare(x, z) ? 0 : 0.55 * smooth(1.5, 10, P.bankDistance(x, z)) * smooth(12.5, 24, P.routeDistance(x, y, z)) * (0.55 + 0.45 * field.noise.n2(x / 23 + 4.4, z / 31 - 2.2));
    pos.push(x, y, z); col.push(1, 1, 1, Math.max(a, 0));
    if (i + 1 < NXH && j + 1 < NZH) { const k = j * NXH + i; idx.push(k, k + NXH, k + 1, k + 1, k + NXH, k + NXH + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
  g.computeBoundingSphere();
  const m = new THREE.MeshBasicMaterial({ color: o.look.sky.clone().multiplyScalar(0.78), vertexColors: true, transparent: true, depthWrite: false, fog: true });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'dawn-haze'; mesh.renderOrder = 3;
  return { object: mesh, owned: [g, m], triangles: idx.length / 3, drawCalls: 1 };
}
