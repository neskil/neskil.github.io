// THE CITY THAT LEFT, the hero set piece: a whole river town in the air on a rough lens of its own bedrock.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera, risen), ... }
//   object     hero-local (see parts/the-city-that-left-common.js): origin at the keel's lowest point, street level at
//              y = 90, rim radius 220, +Z is the side the flight arrives from. The world puts it at HERO.
//   opts       { shared (the light), mats (kit structures materials with streetY at the street's world height),
//                cityPath (the part of the camera path that is above the rim, world coordinates), offset (world position
//                of the origin), vary: { town, wet, ... } }
//
// MAP OF THIS FILE
//   1. buildKeel       the lens and the cut rim: one polar mesh (underside, wall, top), baked ambient shade, baked
//                      view of the afterglow slot, baked lamp pools; the rock shader (beds, coal seams, soil and fill
//                      at the top, cellar rooms by interior mapping, wet sheen that mirrors the afterglow)
//   2. buildRoots      what the town left hanging: tunnel stubs with lamps (one prop mesh), caissons, the subway train
//   3. buildHanging    rails like rope ladders, cables and pipes: ribbons that swing in the vertex shader
//   4. buildFalls      the river's fall, pipe falls and dust curtains: streak sheets that fade to nothing with drop
//                      (the ribbon, sheet and tunnel makers themselves are in parts/-thin.js: the land uses them too)
//   5. buildField      the globe: a limb of light where the eye grazes it, slow rings where the eye is close to it
//   5b. buildSoft      the mill's smoke, steam off the roofs, flags on the tallest of them: one draw of soft strips
//   6. buildHero       the kit city on top (parts/-town.js adds the tower, the mill, the river mouths), anchors
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { RIM, STREET, LIP, HERO, AVE0, PITCH, STREET_W, GLOW_DIR, TOWER, PATH_PTS, toGrid, fromGrid, makeKeelShape, makeShared, sharedU, makeRouteProbe, makeForks, sectorAngles, GLSL_COMMON, GLSL_ROCK, Acc, makePropMaterial } from './the-city-that-left-common.js';
import * as KS from '../kit/structures.js';
import { buildTown } from './the-city-that-left-town.js';
import { Strands, makeStrandMaterial, Sheets, makeFallMaterial, tunnelInto } from './the-city-that-left-thin.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- 1. the keel
async function buildKeel(ctx, S, shape, lamps, grid) {
  const NS = 336, NR = 46, NW = 13, NT = 6;
  const mouthAngles = grid.mouths.map((m) => Math.atan2(m[1], m[0]) < 0 ? Math.atan2(m[1], m[0]) + TAU : Math.atan2(m[1], m[0]));
  const ang = sectorAngles(NS, 0.42, [[2.6, 1.5, 1.25], ...mouthAngles.map((m) => [m, 0.14, 1.6])]);
  const rows = NR + 1 + NW + NT, cols = NS + 1, nv = rows * cols;
  const P = new Float32Array(nv * 3), B = new Float32Array(nv * 4);
  const inRiver = (x, z) => { const g = toGrid(x, z); return Math.abs(g[0]) < 10.5 && Math.abs(g[1]) > 150; };
  let v = 0;
  for (let k = 0; k < cols; k++) {
    const a = ang[k], ca = Math.cos(a), sa = Math.sin(a);
    // underside: centre to rim
    let yEdge = LIP, rEdge = RIM;
    for (let i = 0; i <= NR; i++) {
      const t = i / NR, r0 = RIM * (1 - Math.pow(1 - t, 1.45));
      let x = ca * r0, z = sa * r0, y = shape.under(x, z);
      if (i >= NR - 1) { const rw = shape.wallR(a, y), r = lerp(r0, rw, i === NR ? 1 : 0.5); x = ca * r; z = sa * r; y = shape.under(ca * RIM, sa * RIM); if (i === NR) { yEdge = y; rEdge = r; } }
      P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z; B[v * 4 + 3] = 0; v++;
    }
    // the cut wall, up to the street (or to the river bed at a mouth)
    const topY = inRiver(ca * RIM, sa * RIM) ? STREET - 3.2 : STREET;
    for (let i = 1; i <= NW; i++) {
      const t = i / NW, y = lerp(yEdge, topY - 0.4, Math.pow(t, 0.9)), r = lerp(rEdge, shape.wallR(a, y), Math.min(1, t * 3));
      P[v * 3] = ca * r; P[v * 3 + 1] = y; P[v * 3 + 2] = sa * r; B[v * 4 + 3] = 0; v++;
    }
    // the top: pavement and yards from the cut edge inward (the kit's streets lie on it)
    const rTop = shape.wallR(a, topY), radii = [rTop - 0.6, rTop - 4, rTop - 11, rTop - 24, 150, 0];
    for (let i = 0; i < NT; i++) {
      const r = radii[i], x = ca * r, z = sa * r;
      P[v * 3] = x; P[v * 3 + 1] = (inRiver(x, z) ? STREET - 3.2 : STREET - 0.32) - (i === 0 ? 0.25 : 0); P[v * 3 + 2] = z; B[v * 4 + 3] = 1; v++;
    }
    if (k % 40 === 39) await ctx.yield();
  }
  const idx = new Uint32Array((rows - 1) * NS * 6); let q = 0;
  for (let k = 0; k < NS; k++) for (let i = 0; i < rows - 1; i++) {
    const a = k * rows + i, b = a + 1, c = (k + 1) * rows + i + 1, d = (k + 1) * rows + i;
    // faces look down under the keel, outward on the wall, up on the top
    idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = a; idx[q++] = c; idx[q++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  geo.computeVertexNormals();
  await ctx.yield();
  // weld the seam's normals (first and last column are the same place)
  const N = geo.attributes.normal.array;
  for (let i = 0; i < rows; i++) { const a = i * 3, b = (NS * rows + i) * 3; for (let c = 0; c < 3; c++) { const m = (N[a + c] + N[b + c]) * 0.5; N[a + c] = m; N[b + c] = m; } }
  // bakes: r ambient shade (hollows are darker), g how much of the afterglow slot the place sees, b lamp light
  const gx = GLOW_DIR[0], gz = GLOW_DIR[1];
  for (let k = 0; k < cols; k++) { if (k % 40 === 39) await ctx.yield(); for (let i = 0; i < rows; i++) {
    const vi = k * rows + i, x = P[vi * 3], y = P[vi * 3 + 1], z = P[vi * 3 + 2];
    let ao = 1, slot = 1;
    if (i <= NR + NW) {
      const kl = (k + NS - 2) % NS, kr = (k + 2) % NS, iu = Math.max(0, i - 2), id = Math.min(NR + NW, i + 2);
      const mean = (P[(kl * rows + i) * 3 + 1] + P[(kr * rows + i) * 3 + 1] + P[(k * rows + iu) * 3 + 1] + P[(k * rows + id) * 3 + 1]) * 0.25;
      ao = i <= NR ? clamp(0.8 - (y - mean) * 0.16, 0.35, 1.15) : 1;
      // march toward the afterglow under the smooth lens: is the horizon band open from here?
      let worst = -1;
      for (let s = 1; s <= 9; s++) {
        const d = s * s * 3.2, px = x + gx * d, pz = z + gz * d, pr = Math.hypot(px, pz);
        if (pr > RIM + 4) break;
        const yk = shape.smoothUnder(px, pz); worst = Math.max(worst, (y - 2 - yk) / d);
      }
      slot = 1 - smoothstep(-0.02, 0.2, worst);
      if (i > NR) slot = Math.max(slot, smoothstep(-0.1, 0.5, (x * gx + z * gz) / Math.max(1, Math.hypot(x, z))));
    }
    let lamp = 0;
    for (const L of lamps) {
      const dx = L.p[0] - x, dy = L.p[1] - y, dz = L.p[2] - z, d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2);
      if (d > L.reach) continue;
      const nd = Math.max(0.15, (N[vi * 3] * dx + N[vi * 3 + 1] * dy + N[vi * 3 + 2] * dz) / Math.max(0.5, d));
      const f = 1 - d / L.reach; lamp += L.power * nd * f * f / (1 + d2 * 0.012);
    }
    B[vi * 4] = ao; B[vi * 4 + 1] = slot; B[vi * 4 + 2] = Math.min(4, lamp);
  } }
  geo.setAttribute('bake', new THREE.BufferAttribute(B, 4));
  geo.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: sharedU(S, { uAve0: { value: new THREE.Vector2(AVE0[0], AVE0[1]) }, uPitch: { value: new THREE.Vector2(PITCH[0], PITCH[1]) }, uStreetW: { value: STREET_W }, uBoiler: { value: 0 } }),
    vertexShader: /* glsl */`
      attribute vec4 bake;
      varying vec3 vWorld, vLocal, vN; varying vec4 vBake;
      void main(){
        vLocal = position; vBake = bake; vN = normal;
        vec4 wp = modelMatrix*vec4(position, 1.); vWorld = wp.xyz;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: GLSL_COMMON + GLSL_ROCK + /* glsl */`
      uniform vec2 uAve0, uPitch; uniform float uStreetW, uBoiler;
      varying vec3 vWorld, vLocal, vN; varying vec4 vBake;
      void main(){
        vec3 p = vLocal, toCam = cameraPosition - vWorld;
        vec3 v = toCam / max(length(toCam), 1e-4);
        vec3 nS = normalize(vN + vec3(0., 1e-5, 0.));
        vec3 fx_ = dFdx(vWorld), fy_ = dFdy(vWorld);
        vec3 nF = cross(fx_, fy_); nF = nF / max(length(nF), 1e-9); if (dot(nF, nS) < 0.) nF = -nF;
        float top = clamp(vBake.a, 0., 1.);
        float dist = length(toCam), fine = 1. - smoothstep(90., 420., dist);
        // faces that look down lie along the beds: there the rock came away in terraces
        float flat_ = (1. - top)*(1. - smoothstep(-.62, -.3, nS.y));
        float wetK, bedF; vec3 facet; vec3 col = ctlRock(p, dist, flat_, wetK, facet, bedF);
        vec2 radial = p.xz / max(length(p.xz), 1e-3);
        float wE = .012 + dist*.0005, riser = (1. - smoothstep(.15 - wE, .15 + wE, bedF))*step(.5, flat_);
        vec3 nTread = normalize(vec3(-.11, -1., .07) + facet*.28), nRiser = normalize(vec3(radial.x, -.22, radial.y) + facet*.5);
        vec3 nWall = normalize(mix(nS, nF, .2) + facet*.34*fine);
        vec3 n = normalize(mix(nWall, mix(nTread, nRiser, riser*.85), flat_));
        n = normalize(mix(n, vec3(0., 1., 0.), top));
        // the lip above a slab's broken edge throws a line of shade
        col *= 1. - .5*step(.5, flat_)*(1. - smoothstep(0., wE*2.5, abs(bedF - .15 - wE)))*clamp(.03/wE, 0., 1.);
        col *= .78 + .44*cF3(p*.33 + 3.);                                // water stains and weathering, a few metres across
        float depth = ${STREET.toFixed(1)} - p.y, ang = atan(p.z, p.x), arc = ang*${RIM.toFixed(1)};
        // the top of the cut: pavement slab, soil, fill with old brick, then weathered rock
        float soilD = 2.2 + 2.2*cN(vec2(arc*.05, 3.)), fillD = soilD + 2.5 + 3.5*cN(vec2(arc*.031, 9.));
        float wall = (1. - top)*smoothstep(.25, .6, 1. - abs(nS.y));
        vec3 soil = vec3(.05, .038, .03)*(.6 + .8*cN3(p*vec3(.5, 1.6, .5)));
        vec3 fill = mix(vec3(.1, .095, .088), vec3(.1, .07, .058), step(.62, cN3(p*vec3(.35, .9, .35))))*(.55 + .7*cN3(p*2.1));
        float kS = (1. - smoothstep(soilD - .5, soilD + .5, depth))*wall, kF = (1. - smoothstep(fillD - 1., fillD + 1., depth))*wall;
        col = mix(col, fill, kF); col = mix(col, soil, kS);
        // cellars the cut went through: brick foundation walls, here and there a room standing open
        float cu = arc/9.5, cid = floor(cu), cf = fract(cu), ch = cH(vec2(cid, 3.3)), cv = (depth - .9)/3.3;
        float found = step(.3, ch)*step(.06, cf)*step(cf, .94)*step(0., cv)*step(cv, 1.25)*wall;
        vec2 bk = vec2(arc*2.2 + step(.5, fract(p.y*3.2))*.5, p.y*6.4);
        vec3 brick = mix(vec3(.11, .052, .038), vec3(.075, .04, .032), cH(floor(bk)))*(.4 + .6*smoothstep(.04, .12, min(fract(bk.x), fract(bk.y))));
        col = mix(col, brick, found);
        float room = step(.5, ch)*step(.14, cf)*step(cf, .86)*step(.08, cv)*step(cv, .92)*wall;
        float lamp = step(.74, ch);                                      // some of them still have a lamp burning
        vec2 rc = vec2(cf - .5, cv - .5);
        vec3 roomC = vec3(.008, .007, .008) + uGold*(.012 + .09*lamp)*(1. - smoothstep(.0, .5, length(rc*vec2(1., 1.3) + vec2(0., .3))));
        roomC += uGold*lamp*1.1*(1. - smoothstep(.0, .03, length(rc*vec2(2.9, 1.) + vec2(0., .36))));
        col = mix(col, vec3(.2, .19, .18), wall*(1. - smoothstep(.35, .5, depth)));
        // drains and service tunnels the cut went through, all round the rim: a brick ring, a dark round opening,
        // in most of them a lamp still burning a little way in
        float tu = arc/31., th = cH(vec2(floor(tu), 8.1)), tOn = step(.45, th)*wall;
        vec2 tc = vec2((fract(tu) - .5)*31. + (th - .5)*14., depth - (9.5 + 7.*cH(vec2(floor(tu), 2.7))));
        float tR = length(tc*vec2(1., 1.12)), tRad = .7 + .9*th;
        col = mix(col, brick*1.3, tOn*(1. - smoothstep(tRad + .3, tRad + .42, tR)));
        float bore = tOn*(1. - smoothstep(tRad - .08, tRad + .04, tR));
        vec3 boreC = vec3(.006, .006, .007) + uGold*step(.6, th)*(.05*(1. - smoothstep(0., tRad, tR)) + 1.3*(1. - smoothstep(.0, .16, length(tc - vec2(.3*tRad, -.35*tRad)))));
        wetK *= 1. - kF;
        // the top surface: the street grid carries on to the cut edge
        vec2 d0 = p.xz - uAve0, g = vec2((d0.x + d0.y)*.70711, (-d0.x + d0.y)*.70711);
        vec2 cell = abs(fract(g/uPitch + .5) - .5)*uPitch;
        float street = 1. - smoothstep(uStreetW*.5 - .4, uStreetW*.5, min(cell.x, cell.y));
        float kerb = smoothstep(uStreetW*.5 - 1.6, uStreetW*.5 - 1.2, min(cell.x, cell.y))*street;
        vec3 paving = mix(vec3(.085, .083, .082)*(.8 + .4*cN(p.xz*.7)), vec3(.032, .033, .037)*(.8 + .4*cN(p.xz*.35)), street);
        paving = mix(paving, vec3(.1, .098, .095), kerb*.7);
        float edge = smoothstep(${(RIM - 5).toFixed(1)}, ${(RIM - 0.5).toFixed(1)}, length(p.xz));
        paving = mix(paving, soil*1.2, edge*.7*step(.35, cN(p.xz*.9)));
        col = mix(col, paving, top);
        // light
        float ao = clamp(vBake.r, 0., 1.2), slot = clamp(vBake.g, 0., 1.);
        // under the keel the dusk comes up off the land: a cool fill on faces that look down, so the rock is never black
        vec3 bounce = vec3(.36, .4, .6)*clamp(.3 - n.y*.7, 0., 1.)*(1. - top)*(.75 + .5*slot);
        vec3 lit = col*(ctlLight(n)*mix(.7, 1., top) + bounce)*mix(ao, 1., top);
        vec3 Ls = normalize(vec3(uGlowAz.x, .03, uGlowAz.y));
        float rake = clamp(dot(n, Ls)*1.1 + .12, 0., 1.); rake *= rake;
        vec3 bandPale = mix(uBand, vec3(dot(uBand, vec3(.3, .5, .2))), .45);
        lit += col*bandPale*rake*slot*(1. - top)*(.44 + .34*flat_);
        // and the water in the hole gives the afterglow back up onto the belly: a faint moving light, strongest
        // toward the side the band is on
        float westK = smoothstep(-.9, .7, dot(p.xz, normalize(uGlowAz))/${RIM.toFixed(1)});
        lit += col*mix(uRose, bandPale, .6)*flat_*(.1 + .3*westK)*(.6 + .8*cF(p.xz*.035 + vec2(uTime*.05, -uTime*.035)));
        // wet rock mirrors the slot of afterglow
        float ndv = clamp(dot(n, v), 0., 1.), fres = .03 + .97*pow(1. - ndv, 4.);
        vec3 r = reflect(-v, n);
        float wet = clamp(wetK*(1. - top)*(.55 + .45*uWet) + uWet*top*.7, 0., 1.);
        lit = mix(lit, lit*.6, wet*.6);
        lit += ctlSky(vec3(r.x, abs(r.y)*.6 + .02, r.z))*fres*wet*slot*.8;
        // lamps in the roots
        float fl = 1. + .1*sin(uTime*7.3 + p.x*.31) + .06*sin(uTime*17.1 + p.z*.23);
        lit += col*uGold*clamp(vBake.b, 0., 4.)*fl*2.2;
        lit = mix(lit, roomC, room);
        lit = mix(lit, boreC, bore);
        gl_FragColor = vec4(ctlFog(lit, vWorld - cameraPosition), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, material: mat, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- 2. the roots
function buildRoots(ctx, S, shape, town, probe, F) {
  const acc = new Acc(), lamps = [], tunnels = [], mouths = [], deg = Math.PI / 180;
  const gridDir = (ox, oz) => {                                         // the street-grid direction nearest to (ox, oz)
    let best = null, bd = -2;
    for (const d of [[Math.SQRT1_2, Math.SQRT1_2], [-Math.SQRT1_2, -Math.SQRT1_2], [-Math.SQRT1_2, Math.SQRT1_2], [Math.SQRT1_2, -Math.SQRT1_2]]) { const k = d[0] * ox + d[1] * oz; if (k > bd) { bd = k; best = d; } }
    return best;
  };
  // Each kind draws from a stream of its own (the list is in -common.js, FORKS), so that a change of the route (which
  // changes what is left out) deals only that kind anew. Every one is tested against the route in even steps of its
  // metres (probe, in -common.js), and the test decides: a mouth the route would come within 14 m of is not opened,
  // a belly mouth or a stub moves to the nearest place the route keeps clear of, a caisson or a pile it would meet
  // is left out.
  const rW = F.subwayLines, rB = F.bellyMouths, rLn = F.lining, rC = F.caissons, rP = F.piles, rS = F.stubs, rT = F.trains;
  const mouthClear = (T) => probe.line('hero', [T.p[0], T.p[1] + 2.5, T.p[2]], [T.p[0] + T.d[0] * (T.out + 8), T.p[1] + 1, T.p[2] + T.d[1] * (T.out + 8)], 14);
  // The subway ran under the streets, 13 to 24 m down: a line under the avenue, one under the second street either
  // side of it, one under the second street either side of the river. A line has a mouth in the cut wall at each
  // of its two ends, wherever round the town its street meets the rim.
  for (const [off, alongAvenue] of [[0, true], [2 * PITCH[1], true], [-2 * PITCH[1], true], [-2 * PITCH[0], false], [2 * PITCH[0], false]]) {
    const y = STREET - rW.range(13, 24), w0 = alongAvenue ? fromGrid(0, off) : fromGrid(off, 0), w1 = alongAvenue ? fromGrid(1, off) : fromGrid(off, 1);
    for (const end of [1, -1]) {
      const out = rW.range(2.5, 5.5), d = [(w1[0] - w0[0]) * end, (w1[1] - w0[1]) * end];
      let s = 150;                                                        // metres out along the line to the wall
      for (let it = 0; it < 7; it++) { const x = w0[0] + d[0] * s, z = w0[1] + d[1] * s; s += shape.wallR(Math.atan2(z, x), y) - 1.5 - Math.hypot(x, z); }
      const T = { p: [w0[0] + d[0] * s, y - 2.6, w0[1] + d[1] * s], d, out, wall: true };
      T.open = mouthClear(T); mouths.push(T);
    }
  }
  // lower down, in the belly, the deep line's galleries: nine mouths, one in each ninth of the compass
  for (let k = 0; k < 9; k++) {
    const a = (k + rB.range(0.1, 0.9)) / 9 * TAU, r0 = rB.range(100, 160), out = rB.range(4, 9), d = gridDir(Math.cos(a), Math.sin(a));
    let T = null;
    for (let j = 0; j < 7; j++) {
      const r = r0 + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 12, x = Math.cos(a) * r, z = Math.sin(a) * r;
      T = { p: [x, shape.under(x, z) - 5.6, z], d, out, wall: false };
      T.open = r > 60 && r < RIM - 30 && mouthClear(T);
      if (T.open) break;
    }
    mouths.push(T);
  }
  // every mouth takes its lining's numbers from the stream, opened or not (one the route passes too near is built
  // into a spare that is thrown away), so no move of the route deals another mouth's lining anew
  const spare = new Acc();
  for (const T of mouths) {
    tunnelInto(T.open ? acc : spare, T, rLn);
    if (!T.open) continue;
    tunnels.push(T);
    lamps.push({ p: [T.p[0] + T.d[0] * (T.out + 1.5), T.p[1] + 3, T.p[2] + T.d[1] * (T.out + 1.5)], reach: 38, power: 1.25 });
  }
  // caissons under the tall buildings: pale concrete standing 5 to 25 m proud of the broken rock
  const conc = [0.105, 0.1, 0.092], concD = [0.055, 0.052, 0.05], caissons = [];
  const tall = town.city.buildings.filter((b) => b.h > 34).sort((a, b) => b.h - a.h).slice(0, 44);
  for (const b of tall) {
    const n = b.h > 70 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const x = b.x + (n > 1 ? (k - 0.5) * b.w * 0.45 : 0) + rC.range(-2, 2), z = b.z + rC.range(-2, 2), yu = shape.under(x, z);
      const proud = clamp(b.h * rC.range(0.14, 0.26), 5, 25), rad = clamp(b.w * 0.09, 1.8, 4.2), square = rC.chance(0.3);
      if (Math.hypot(x, z) > RIM - 12 || !probe.line('hero', [x, yu + 3, z], [x, yu - proud, z], rad + 13)) continue;
      if (square) acc.box(x, yu - proud / 2 + 3, z, rad * 1.8, proud + 6, rad * 1.8, conc);
      else acc.cyl([x, yu + 3, z], [x, yu - proud, z], rad, rad * 0.94, 9, conc, 0, 1, concD);
      caissons.push({ x, z, y: yu - proud, r: rad });
    }
  }
  // clusters of thin piles under the lower blocks
  let piles = 0, pileTries = 0;
  for (const b of town.city.buildings) {
    if (b.h > 34 || b.h < 14 || !rP.chance(0.3) || pileTries >= 160) continue;
    for (let k = 0; k < 3; k++) {
      pileTries++;
      const x = b.x + rP.range(-0.35, 0.35) * b.w, z = b.z + rP.range(-0.35, 0.35) * b.d, yu = shape.under(x, z), end = [x + rP.range(-0.5, 0.5), yu - rP.range(3, 11), z + rP.range(-0.5, 0.5)];
      if (Math.hypot(x, z) > RIM - 10 || !probe.line('hero', [x, yu + 2, z], end, 10)) continue;
      acc.cyl([x, yu + 2, z], end, 0.55, 0.5, 5, conc, 0, 1, concD); piles++;
    }
  }
  // cut mains and sewers: iron stubs standing out of the wall near its top (some of them pour: see buildFalls)
  const stubs = [];
  for (let i = 0; i < 34; i++) {
    const a0 = rS.range(0, TAU), y = STREET - rS.range(2.5, 9), rad = rS.range(0.35, 1.1), out = rS.range(1.2, 4);
    for (let k = 0; k < 9; k++) {
      const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 4 * deg, r = shape.wallR(a, y), ca = Math.cos(a), sa = Math.sin(a), tip = [ca * (r + out), y - out * 0.08, sa * (r + out)];
      if (!probe.hero(tip, 9)) continue;
      acc.cyl([ca * (r - 2), y, sa * (r - 2)], tip, rad, rad, 7, [0.05, 0.04, 0.036], 0, 1, [0.008, 0.008, 0.008]);
      stubs.push({ p: tip, a, rad });
      break;
    }
  }
  // foundation piers the cut went through: pale concrete standing proud of the rock all round the rim, from the
  // street down past the fill (stream 'rimPiers'; none at the river's two mouths, none the route passes within 9 m of)
  const rRP = F.rimPiers, riverA = [200, -200].map((c) => { const w = fromGrid(0, c); return Math.atan2(w[1], w[0]); });
  let rimPiers = 0;
  for (let i = 0; i < 48; i++) {
    const a = (i + rRP.range(0.15, 0.85)) / 48 * TAU, h = rRP.range(8, 23), rad = rRP.range(0.8, 1.7), square = rRP.chance(0.5);
    const ca = Math.cos(a), sa = Math.sin(a), r = shape.wallR(a, STREET - h * 0.5) + rad * 0.3, top = [ca * r, STREET - 0.6, sa * r], foot = [ca * r, STREET - h, sa * r];
    if (riverA.some((ra) => Math.abs(Math.atan2(Math.sin(a - ra), Math.cos(a - ra))) < 7 * deg) || !probe.line('hero', top, foot, rad + 9)) continue;
    if (square) { acc.box(top[0], STREET - 0.6 - h / 2, top[2], rad * 1.8, h, rad * 1.8, conc); acc.box(top[0], STREET - h - 0.5, top[2], rad * 2.8, 1, rad * 2.8, concD); }
    else acc.cyl(top, foot, rad, rad * 0.94, 8, conc, 0, 1, concD);
    rimPiers++;
  }
  const mesh = new THREE.Mesh(acc.build(), makePropMaterial(S, { flicker: 1 }));
  // The subway trains the cut stranded: one at each end of each line. Each creeps out to the brink of its mouth and
  // backs away again, over and over, on the world clock: its own period (14 to 22 s), its own start in that round
  // (both drawn), a plain cosine there and back, so at any moment a train is either nosing out or its lamps are
  // going back down the tunnel.
  const tr = new Acc(), walls = mouths.filter((T) => T.wall);
  tr.box(0, 1.9, -6, 2.5, 3.1, 12, [0.07, 0.085, 0.08]); tr.box(0, 2.45, -6, 2.56, 0.85, 11, [0.2, 0.18, 0.12], 1.7); tr.box(0, 1.9, 0.02, 2.1, 1.4, 0.1, [0.2, 0.18, 0.12], 1.4);
  for (const sx of [-0.8, 0.8]) tr.box(sx, 1.0, 0.06, 0.34, 0.34, 0.1, [0.3, 0.3, 0.25], 4);
  const trains = new THREE.InstancedMesh(tr.build(), makePropMaterial(S, { flicker: 1 }), Math.max(1, walls.length)); trains.frustumCulled = false;
  const runs = walls.map((T) => ({ T, period: rT.range(14, 22), start: rT(), m: new THREE.Matrix4().makeBasis(new THREE.Vector3(T.d[1], 0, -T.d[0]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(T.d[0], 0, T.d[1])) })).filter((R) => R.T.open);
  trains.count = runs.length;
  const group = new THREE.Group(); group.add(mesh, trains);
  return {
    object: group, lamps, tunnels, mouths, caissons, stubs, rimPiers, triangles: acc.triangles + tr.triangles * runs.length,
    update(time) {
      for (let i = 0; i < runs.length; i++) {
        const R = runs[i], T = R.T, z = lerp(-9, T.out - 0.8, 0.5 - 0.5 * Math.cos(TAU * (time / R.period + R.start)));
        trains.setMatrixAt(i, R.m.setPosition(T.p[0] + T.d[0] * z, T.p[1], T.p[2] + T.d[1] * z));
      }
      trains.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- 3. hanging things
// clear(p, margin): is the point (hero-local) at least `margin` metres from the camera's route?
function buildHanging(ctx, S, shape, roots, probe, F, town) {
  // each kind has a stream of its own (a change of the route deals only that kind anew) and is tested against the
  // route along its whole length; a thing the route would come within reach of is left out
  const clear = probe.hero, rL = F.ladders, rSP = F.stubPipes, rPp = F.pipes, rCb = F.cables, rr = F.treeRoots;
  let hr = rSP;
  const st = new Strands(), deg = Math.PI / 180, iron = [0.045, 0.04, 0.036], rust = [0.085, 0.045, 0.028], lead = [0.07, 0.072, 0.078];
  // rails that were sidings in the mill's yard, hanging down the west lip like rope ladders
  let ladders = 0;
  for (let a0 = 150; a0 <= 232 && ladders < 9; a0 += 4.6) {
    const a = (a0 + rL.range(-1.2, 1.2)) * deg, len = rL.range(40, 70), ca = Math.cos(a), sa = Math.sin(a), r0 = shape.wallR(a, STREET) + 0.5;
    const lean = rL.range(0.0, 0.07), twist = rL.range(-0.012, 0.012), ph = rL.range(0, TAU), amp = rL.range(0.012, 0.03), om = 2.2 / Math.sqrt(len / 9.8) * rL.range(0.8, 1.1);
    const centre = (s) => { const d = Math.max(0, s), r = r0 + 0.7 + d * lean + (s < 0 ? s : 0); return [ca * r, STREET - 0.4 - d + (s < 0 ? 0.25 : 0), sa * r]; };
    let ok = true; for (let s = 0; s <= len; s += 6) if (!clear(centre(s), 10 + s * amp * 1.4)) ok = false;
    if (!ok) continue;
    const rails = [[], []], sw = [[], []], n = Math.ceil(len / 2.6), short = rL.int(0, 1), cut = rL.range(0.72, 0.93);
    for (let i = -2; i <= n; i++) {
      const s = i < 0 ? i * 3 : len * i / n, c = centre(s), tw = twist * Math.max(0, s), tx = -sa * Math.cos(tw) + ca * Math.sin(tw), tz = ca * Math.cos(tw) + sa * Math.sin(tw);
      for (let k = 0; k < 2; k++) { if (k === short && s > len * cut) continue; const g = (k ? 0.72 : -0.72); rails[k].push([c[0] + tx * g, c[1], c[2] + tz * g]); sw[k].push([Math.max(0, s), ph, amp, om]); }
    }
    for (let k = 0; k < 2; k++) st.line(rails[k], 0.09, iron, (i) => sw[k][i]);
    for (let s = -5; s < len * cut; s += 1.35) {                      // sleepers: fewer the further down
      if (s > 8 && rL.chance(0.12 + 0.5 * s / len)) continue;
      const c = centre(s), tw = twist * Math.max(0, s), tx = -sa * Math.cos(tw) + ca * Math.sin(tw), tz = ca * Math.cos(tw) + sa * Math.sin(tw), g = 1.15;
      st.line([[c[0] - tx * g, c[1], c[2] - tz * g], [c[0] + tx * g, c[1], c[2] + tz * g]], 0.13, [0.05, 0.036, 0.026], () => [Math.max(0, s), ph, amp, om]);
    }
    ladders++;
  }
  // pipes and conduits: from the cut wall, from the stubs, from the belly
  let pipes = 0;
  const hang = (top, len, hw, col, stiff) => {
    const ph = hr.range(0, TAU), amp = (stiff ? 0.006 : hr.range(0.015, 0.04)), om = 2.4 / Math.sqrt(Math.max(4, len) / 9.8) * hr.range(0.8, 1.2);
    const kink = stiff ? hr.range(0.3, 0.8) : 2, bx = hr.range(-1, 1), bz = hr.range(-1, 1), n = stiff ? 3 : 7, pts = [], lever = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = len * t, off = stiff ? (t > kink ? (t - kink) * len * 0.35 : 0) : Math.sin(t * 2.6) * len * 0.06;
      const p = [top[0] + bx * off, top[1] - s + (stiff ? 0 : 0), top[2] + bz * off];
      if (!clear(p, 9 + s * amp * 1.5)) return false;
      pts.push(p); lever.push(s);
    }
    st.line(pts, hw, col, (i) => [lever[i], ph, amp, om]); pipes++; return true;
  };
  for (const sb of roots.stubs) if (hr.chance(0.55)) hang([sb.p[0], sb.p[1] - sb.rad * 0.5, sb.p[2]], hr.range(4, 22), Math.min(0.35, sb.rad * 0.45), hr.chance(0.5) ? rust : iron, true);
  hr = rPp;
  for (let k = 0; k < 400 && pipes < 124; k++) {
    const wallSide = hr.chance(0.4), a = hr.range(0, TAU);
    if (wallSide) { const y = STREET - hr.range(1.5, 8), r = shape.wallR(a, y) + 0.4; hang([Math.cos(a) * r, y, Math.sin(a) * r], hr.range(5, 34), hr.range(0.05, 0.16), hr.pick([iron, rust, lead]), hr.chance(0.3)); }
    else { const r = RIM * Math.sqrt(hr.range(0.02, 0.97)), x = Math.cos(a) * r, z = Math.sin(a) * r; hang([x, shape.under(x, z) + 0.5, z], hr.range(4, 26), hr.range(0.05, 0.2), hr.pick([iron, rust, lead]), hr.chance(0.45)); }
  }
  // cables slung between the caissons
  const cs = roots.caissons;
  for (let k = 0, made = 0; k < 90 && made < 22 && cs.length > 3; k++) {
    const A = rCb.pick(cs), B = rCb.pick(cs), d = Math.hypot(A.x - B.x, A.z - B.z);
    if (A === B || d < 14 || d > 70) continue;
    const sag = d * rCb.range(0.1, 0.22), pts = [], lev = [], n = 10, ya = A.y + rCb.range(1, 4), yb = B.y + rCb.range(1, 4), ph = rCb.range(0, TAU);
    let ok = true;
    for (let i = 0; i <= n; i++) { const t = i / n, sg = 4 * t * (1 - t) * sag, p = [lerp(A.x, B.x, t), lerp(ya, yb, t) - sg, lerp(A.z, B.z, t)]; if (!clear(p, 10)) ok = false; pts.push(p); lev.push(sg); }
    if (!ok) continue;
    st.line(pts, 0.06, iron, (i) => [lev[i], ph, 0.07, 1.1]); made++;
  }
  // the roots of the trees the cut left on the edge: out of the soil and down the wall a little way
  for (const t of town.rimTrees || []) for (let k = 0; k < 7; k++) {
    const a = t.a + rr.range(-0.02, 0.02), y = STREET - rr.range(0.8, 2.6), r = shape.wallR(a, y) + 0.25, len = rr.range(2, 9), ph = rr.range(0, TAU), bend = rr.range(-0.25, 0.25), pts = [], lev = [];
    for (let i = 0; i <= 5; i++) { const f = i / 5; pts.push([Math.cos(a + bend * f * len / RIM) * (r + 0.5 * Math.sin(f * 3)), y - len * f, Math.sin(a + bend * f * len / RIM) * (r + 0.5 * Math.sin(f * 3))]); lev.push(len * f); }
    const hw = rr.range(0.05, 0.14);
    if (pts.every((q) => clear(q, 8))) st.line(pts, hw, [0.07, 0.05, 0.035], (i) => [lev[i], ph, 0.02, 2.6]);
  }
  const mat = makeStrandMaterial(S), mesh = new THREE.Mesh(st.build(), mat);
  return { object: mesh, triangles: st.triangles, ladders, pipes, update() {} };
}

// ---------------------------------------------------------------- 4. the falls
// The river pouring off its cut mouth at the south-west rim, a few cut mains, drips under the belly: all one
// draw of sheets. A sheet's vertex knows its place along the lip, how far along the fall it is (t) and the sheet's
// numbers; the vertex shader bends it into the fall, the fragment shader runs streaks down it that stretch as they
// drop and thin away to nothing. kind 0 water, 1 dust, 2 drips.
function buildFalls(ctx, S, shape, roots, probe, F) {
  const sh = new Sheets(), deg = Math.PI / 180;
  // each kind has a stream of its own; every fall is tested against the route down its whole curve (probe.fall, the
  // same curve the shader bends it into), and one the route would pass within reach of is left out
  const rR = F.riverFall, rM = F.mains, rDr = F.drips;
  // the river: its bed is 3.2 m under the street, 21 m wide between the embankments. It runs off the town at the
  // south-west cut end, the way it always ran, and is emptying (the upstream end has nothing left to give)
  for (const end of [1]) {
    const na = 12, mouth = (k) => { const a = lerp(-10.2, 10.2, k / na), probe = fromGrid(a, end * 200), ang = Math.atan2(probe[1], probe[0]); let c = end * 200; for (let it = 0; it < 4; it++) { const w = fromGrid(a, c), r = Math.hypot(w[0], w[1]); c += end * (shape.wallR(ang, STREET - 3) - 0.3 - r); } const w = fromGrid(a, c); return [w[0], STREET - 3.0, w[1]]; };
    const m0 = mouth(na / 2), dl = Math.hypot(m0[0], m0[2]), dir = [m0[0] / dl, m0[2] / dl];
    // the river cannot move: its inner sheet always falls; the outer, wider one only where the route keeps 22 m from its middle
    const seedIn = rR.range(0, 50), seedOut = rR.range(0, 50);
    sh.sheet(na, mouth, { len: 230, out: end > 0 ? 30 : 19, dir, seed: seedIn, kind: 0, nd: 26, spread: end > 0 ? 0.5 : 0.3 });
    if (probe.fall('hero', m0, dir, end > 0 ? 38 : 24, 215, 22, 0.8)) sh.sheet(na, (k) => { const p = mouth(k); return [p[0] - dir[0] * 0.8, p[1] + 0.25, p[2] - dir[1] * 0.8]; }, { len: 215, out: end > 0 ? 38 : 24, dir, seed: seedOut, kind: 0, nd: 26, spread: 0.75 });
  }
  // a few cut mains that still run: thin jets
  let mains = 0;
  for (const sb of roots.stubs) {
    const want = rM.chance(0.5), dir = [Math.cos(sb.a), Math.sin(sb.a)], len = rM.range(70, 170), out = rM.range(3, 9) * (0.5 + sb.rad), width = sb.rad * rM.range(0.6, 1.1) * 0.6, seed = rM.range(0, 50);
    const top = [sb.p[0], sb.p[1] - sb.rad * 0.3, sb.p[2]];
    if (mains >= 5 || !want || !probe.fall('hero', top, dir, out, len, 12, 0.8)) continue;
    sh.sheet(2, () => top, { len, out, dir, width, seed, kind: 0, nd: 14, spread: 1.6 });
    mains++;
  }
  // drips: a few, under the belly where the rock is wet (near the river's line) and along the lip
  let drips = 0;
  for (let k = 0; k < 900 && drips < 70; k++) {
    const a = rDr.range(0, TAU), r = RIM * Math.sqrt(rDr.range(0.01, 1)), x = Math.cos(a) * r, z = Math.sin(a) * r, g = toGrid(x, z);
    const thin = rDr.chance(0.55), len = rDr.range(90, 190), width = rDr.range(0.07, 0.13), seed = rDr.range(0, 90), y = shape.under(x, z) + 0.3;
    if ((Math.abs(g[0]) > 30 && thin) || !probe.fall('hero', [x, y, z], [1, 0], 0, len, 5, 0.85)) continue;
    sh.sheet(1, () => [x, y, z], { len, out: 0, dir: [1, 0], width, seed, kind: 2, nd: 6, spread: 0 });
    drips++;
  }
  const mat = makeFallMaterial(S);
  const mesh = new THREE.Mesh(sh.build(), mat); mesh.renderOrder = 3; mesh.frustumCulled = false;
  // the higher the town has risen, the less water is left in what was cut: `risen` is the share of its rise done (0 to 1)
  return { object: mesh, material: mat, triangles: sh.triangles, mains, drips, update(risen) { mat.uniforms.uFlow.value = 1 - 0.62 * clamp(risen, 0, 1); } };
}

const FIELD_BEYOND = 60;                                   // metres of the town's own air beyond its cut edge
// ---------------------------------------------------------------- 5. the field
// The globe the town holds its air in: all but invisible. A thin limb of light where the eye grazes it, a slow ripple
// where something crosses it, and under its crown the mill's smoke spread flat.
function buildField(ctx, S) {
  // its radius is the town's: the cut rim's radius and FIELD_BEYOND metres of air beyond it, about a centre 85 m over
  // the keel's origin. The road has no say in it.
  const R = RIM + FIELD_BEYOND, mat = new THREE.ShaderMaterial({
    uniforms: sharedU(S, {}), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`
      varying vec3 vWorld, vN;
      void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWorld = wp.xyz; vN = mat3(modelMatrix)*normal; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWorld, vN;
      void main(){
        vec3 toCam = cameraPosition - vWorld; float dist = length(toCam);
        vec3 v = toCam / max(dist, 1e-4), n = normalize(vN + vec3(0., 1e-5, 0.));
        float g = clamp(1. - abs(dot(n, v)), 0., 1.), g2 = g*g, limb = g2*g2*g2;
        // where the eye is close to the skin it shows as slow rings round the nearest point
        float nearK = 1. - smoothstep(10., 130., dist);
        float ring = .5 + .5*sin(dist*.33 - uTime*2.2);
        vec3 col = vec3(.36, .46, .75)*limb*.009 + vec3(.3, .4, .7)*ring*ring*nearK*nearK*.02;
        gl_FragColor = vec4(col*(1. - ctlFogF(toCam)), 0.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), mat); mesh.position.set(0, 85, 0); mesh.renderOrder = 4;
  return { object: mesh, radius: R, triangles: 64 * 40 * 2 };
}

// ---------------------------------------------------------------- 5b. smoke, steam and flags
// The mill's smoke and the roofs' steam: tall strips that face the eye, bent downwind, with the smoke's own noise
// climbing them (it rises fast, slows, and lies down flat high under the field). Flags on the tallest roofs: cloth
// strips that wave. One draw. kind 0 smoke, 1 steam, 2 flag, 3 flagpole.
function buildSoft(ctx, S, town, probe, F) {
  const P = [], U = [], A = [], K = [], I = []; let n = 0;
  const strip = (base, nd, a4, k4) => {
    const b0 = n;
    for (let i = 0; i <= nd; i++) for (const sd of [-1, 1]) { P.push(base[0], base[1], base[2]); U.push(sd, i / nd); A.push(a4[0], a4[1], a4[2], a4[3]); K.push(k4[0], k4[1], k4[2], k4[3]); n++; }
    for (let i = 0; i < nd; i++) { const q = b0 + i * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  };
  // a4: height, width at the foot, width at the top, seed.  k4: kind, then three numbers the kind uses
  // Each kind has a stream of its own. A plume is tested against the route up its whole curve (the same curve the
  // shader bends it into, with its width); a chimney or a roof whose plume the route would fly through gives none,
  // and a flag goes on the next tallest roof the route keeps 14 m from.
  const rSm = F.smoke, rSt = F.steam, rFl = F.flags, WIND = [0.5, -0.86];
  const plumeClear = (base, H, kind, wTop) => {
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, rise = 1 - (1 - t) * (1 - t), k = H * (0.25 * t + 0.75 * t * t);
      if (!probe.hero([base[0] + WIND[0] * k, base[1] + H * rise * (kind ? 0.55 : 1), base[2] + WIND[1] * k], 12 + wTop * t * 1.2 + H * t * 0.035)) return false;
    }
    return true;
  };
  const stacks = town.mill ? town.mill.stacks : [];
  stacks.forEach((st, i) => {
    const want = i % 2 === 0 || rSm.chance(0.4), base = [st.x, STREET - 0.3 + st.h + 1, st.z], H = rSm.range(105, 135), wTop = rSm.range(26, 38), seed = rSm.range(0, 60);
    if (want && plumeClear(base, H, 0, wTop)) strip(base, 18, [H, 2.4, wTop, seed], [0, 0, 0, 0]);
  });
  const tall = town.city.buildings.filter((b) => b.h > 26).sort((a, b) => b.h - a.h);
  for (let i = 0; i < tall.length && i < 30; i++) {
    const b = tall[i], want = rSt.chance(0.3), base = [b.x + rSt.range(-0.3, 0.3) * b.w, STREET + b.h + 0.5, b.z + rSt.range(-0.3, 0.3) * b.d], H = rSt.range(14, 30), wTop = rSt.range(5, 10), seed = rSt.range(0, 60);
    if (want && plumeClear(base, H, 1, wTop)) strip(base, 10, [H, 0.9, wTop, seed], [1, 0, 0, 0]);
  }
  // six flags, on the six tallest roofs that are not the crown tower
  for (let i = 0, made = 0; made < 6 && i < tall.length; i++) {
    const b = tall[i], x = b.x + 0.32 * b.w * (i % 2 ? 1 : -1), z = b.z + 0.32 * b.d * (i % 3 ? 1 : -1), y = STREET + b.h + 0.4, seed = rFl.range(0, 60), c1 = rFl.range(0, 1), c2 = rFl.range(0, 1);
    if (!probe.line('hero', [x, y, z], [x + WIND[0] * 5.2, y + 9, z + WIND[1] * 5.2], 14)) continue;
    strip([x, y, z], 1, [9, 0.09, 0.09, seed], [3, 0, 0, 0]);
    strip([x, y + 7.4, z], 8, [5.2, 1.5, 1.5, seed], [2, c1, c2, 0]);
    made++;
  }
  // four long pennants on poles at the corners of the tower's belvedere (stream 'towerFlags'); one the route would
  // pass within 14 m of is not flown
  const rTF = F.towerFlags, tg = toGrid(TOWER.x, TOWER.z);
  for (const [sa, sc] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const w = fromGrid(tg[0] + sa * 13.4, tg[1] + sc * 13.4), x = w[0], z = w[1], y = STREET + 97.4, seed = rTF.range(0, 60), c1 = rTF.range(0, 1), c2 = rTF.range(0, 1);
    if (!probe.line('hero', [x, y, z], [x + WIND[0] * 8, y + 10, z + WIND[1] * 8], 14)) continue;
    strip([x, y, z], 1, [10, 0.1, 0.1, seed], [3, 0, 0, 0]);
    strip([x, y + 7.8, z], 8, [8, 2.2, 2.2, seed], [2, c1, c2, 0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: sharedU(S, {}), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec2 aUV; attribute vec4 aA, aK;
      uniform float uTime;
      varying vec3 vWorld; varying vec2 vUV; varying vec4 vA, vK;
      void main(){
        float t = aUV.y, kind = aK.x, H = aA.x, seed = aA.w;
        vec3 p = position; vec2 wind = vec2(.5, -.86);
        float halfW = mix(aA.y, aA.z, t);
        if (kind < 1.5) {
          // smoke and steam: up fast, then slower, carried downwind, wavering more the higher it is
          float rise = 1. - (1. - t)*(1. - t);
          p.y += H*rise*mix(1., .55, kind);
          p.xz += wind*H*(.25*t + .75*t*t) + vec2(sin(uTime*.31 + seed + t*5.), cos(uTime*.27 + seed*1.7 + t*4.))*t*H*.035;
        } else if (kind < 2.5) {
          // a flag: t runs along the cloth from the pole, the side coordinate is its height; it waves
          float w = sin(t*6.5 - uTime*5.2 + seed)*.42*t + sin(t*3.1 - uTime*3.1 + seed*2.)*.25*t;
          p.xz += wind*H*t + vec2(-wind.y, wind.x)*w;
          p.y += aUV.x*halfW - .25*t*t;
          halfW = 0.;
        } else { p.y += H*t; }
        vec4 wp = modelMatrix*vec4(p, 1.);
        vec3 toCam = cameraPosition - wp.xyz; vec2 rt = vec2(toCam.z, -toCam.x); rt = rt / max(length(rt), 1e-4);
        wp.xz += rt*aUV.x*halfW;
        vWorld = wp.xyz; vUV = aUV; vA = aA; vK = aK;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      varying vec3 vWorld; varying vec2 vUV; varying vec4 vA, vK;
      void main(){
        float t = clamp(vUV.y, 0., 1.), x = clamp(vUV.x, -1., 1.), kind = vK.x, seed = vA.w;
        vec3 toP = vWorld - cameraPosition;
        vec2 h = toP.xz / max(length(toP.xz), 1e-4);
        float back = clamp(dot(h, uGlowAz), 0., 1.); back *= back;
        vec3 col; float a;
        if (kind < 1.5) {
          float nz = cF(vec2(x*1.3 + seed, t*mix(7., 4., kind) - uTime*mix(.22, .5, kind))) + .5*cN(vec2(x*3.7 - seed, t*19. - uTime*.8));
          float body = 1. - x*x;
          a = smoothstep(.45, 1.05, nz*.8 + body*.55)*body*smoothstep(0., .05, t)*(1. - smoothstep(.5, 1., t))*mix(.62, .4, kind);
          vec3 lit = uHemiSky*.5 + uRose*.9*back + uBand*.35*back + uGold*.1*(1. - t);
          col = mix(vec3(.05, .048, .055), vec3(.2, .2, .22), kind)*lit;
        } else if (kind < 2.5) {
          // two plain bands of colour, nothing written on them
          vec3 c1 = mix(mix(vec3(.2, .05, .04), vec3(.05, .09, .2), step(.5, vK.y)), vec3(.2, .15, .04), step(.75, vK.z)), c2 = c1;
          col = mix(c1, c2, step(0., x))*(uHemiSky*.6 + uGold*.5)*(.8 + .25*sin(t*6.5 - uTime*5.2 + seed + 1.));
          a = 1.;
        } else { col = vec3(.03, .03, .034)*uHemiSky; a = 1. - smoothstep(.6, 1., abs(x)); }
        if (a < .004) discard;
        float f = ctlFogF(toP);
        gl_FragColor = vec4(mix(col, uFogCol, f)*a, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { object: mesh, triangles: I.length / 3 };
}

// ---------------------------------------------------------------- 6. the hero
export async function buildHero(ctx, opts = {}) {
  // the visit's streams: the world takes them all at the head of its build(); alone, the part takes them itself
  const F = opts.forks || makeForks(ctx);
  const S = opts.shared || makeShared(), SU = S.uniforms;
  const shape = opts.shape || makeKeelShape(ctx.noise);
  const mats = opts.mats || KS.makeMaterials({ night: 0.85, lit: 0.66, glow: 3, streetY: STREET, warm: '#FFC56B', cool: '#FFD9A0', streetGlow: 0.14, glass: '#101820' });
  const group = new THREE.Group();
  // the camera's route, sampled every 3 m: everything that hangs, falls, stands or rises near it is tested against it
  const probe = opts.probe || makeRouteProbe(), clear = probe.hero;
  const town = await buildTown(ctx, S, mats, { shape, vary: opts.vary, floraMat: opts.floraMat, probe, forks: F });
  group.add(town.object);
  await ctx.yield();
  const roots = buildRoots(ctx, S, shape, town, probe, F);
  group.add(roots.object);
  await ctx.yield();
  const keel = await buildKeel(ctx, S, shape, roots.lamps.concat(town.lamps || []), { mouths: [fromGrid(0, 219), fromGrid(0, -219)] });
  group.add(keel.mesh);
  await ctx.yield();
  const hanging = buildHanging(ctx, S, shape, roots, probe, F, town);
  group.add(hanging.object);
  await ctx.yield();
  const falls = buildFalls(ctx, S, shape, roots, probe, F);
  group.add(falls.object);
  const field = buildField(ctx, S);
  group.add(field.object);
  const soft = buildSoft(ctx, S, town, probe, F);
  group.add(soft.object);
  await ctx.yield();
  return {
    object: group, radius: 230, height: 240, center: new THREE.Vector3(0, 80, 0), ground: false,
    shared: S, mats, town, keel, roots, hanging, falls, field, shape, clear, probe,
    fieldR: field.radius,
    anchors: { portalSeat: new THREE.Vector3(TOWER.x - 9 * Math.SQRT1_2, STREET + TOWER.crown, TOWER.z - 9 * Math.SQRT1_2) },
    triangles: town.triangles + keel.triangles + roots.triangles + hanging.triangles + falls.triangles + field.triangles + soft.triangles,
    // risen: the share of its rise the town has done (0 to 1); the world's update works it out from the land's height
    update(dt, time, camera, risen = 0) {
      if (!opts.shared) SU.uTime.value = time;
      town.update(dt, time, camera); roots.update(time); hanging.update(camera); falls.update(risen);
    },
    dispose() {},
  };
}
