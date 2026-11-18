// A dusk city of clock towers beside one wide river, flown among the towers at their own height. Ninety towers of pale stone,
// glazed tile and dark iron (the hero, src/parts/dial-towers-at-dusk.js) each carry a great lit dial whose hands turn and a
// dark bell that swings in an open belfry; at its own bell's stroke each tower sends out one thin ring of pale light that
// widens level over the roofs and the water. Nobody is in view: the lens is the visitor.
//
// THE STANDING STATES OF THE PLACE (none of them begins when anyone comes):
//   THE DUSK. It is always the same clear dusk, violet overhead and amber low in the west. The sky, the key out of the west,
//   every lamp and every window are steady: none comes on, none goes out.
//   THE SOUNDING. It is under way and full at every moment, in the first frame as in the last. Each tower's bell keeps its own
//   interval and its own start on the place's one clock; nothing is counted and nothing ends.
//   THE RINGS. Each tower sends its own thin ring at its own bell's stroke, from its belfry's cornice; rings of several ages
//   are always in the air, and where one crosses the river the water carries it as one thin line.
//
// The place is data (src/parts/dial-towers-at-dusk-data.js): the same on every seed. ctx.vary is read and deals nothing here
// (the design's own word: the seed deals nothing); ctx.quality.detail thins the far house blocks and nothing else.
// One clock runs for the whole place: the engine's own seconds, handed to bells, faces and rings as one uniform. Nothing reads
// the metres flown. Where the lens stands is read only for how a thing is drawn from there: the sky dome goes with the eye,
// a line keeps its width in pixels, far stone, roofs and water take the dusk's far fade, a far window is shown by the share
// of a pixel it fills.
//
// WHAT THIS FILE HOLDS: the sky; the river, its embankments and the ground; the house blocks with their roofs and lit fronts,
// near the route by the designer's law and on to 640 m from it; the lamps of the embankments and below the house fronts,
// and the embankment lamps' points on the water; the rings of light in the air and their one line each on the river; the
// route with its six looks; the exit ring's place. The towers, their faces, bells and own lamps are the part's.
// THE RINGS' LIGHT differs by the ring's own level, a law of the place (see makeRings): the rings of the low belfries hold
// their light to their last 5 s over the dark roofs and the water; the rings of the high belfries are bright near their
// tower and thin to a faint, finer line farther out. Every ring keeps the designer's ages, speed, life and reach.
// LAID AGAIN OVER THE RINGS: the sky where it is brighter than a ring, and the far ground where the dusk has faded it to the
// west's amber, are drawn once more after the rings, so that no ring shows as a pink line over the bright west.
// The place sets neither portal.drawWithin nor portal.drawIn: the exit ring stands whole at every metre. No audio is built
// here: the sound row is the owner's.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeClock, LIGHT_GLSL } from '../parts/dial-towers-at-dusk.js';
import { TOWERS, KNOTS, LOOKS, LOOK_AHEAD, FLIGHT_SECONDS, RING, RIVER, SOUND, COLOURS, RING_COLOUR, SKY, GROUND_Y, UNIT, RING_LUM, dirOf, fromEastBank, overWater } from '../parts/dial-towers-at-dusk-data.js';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const g3 = (c) => `vec3(${c[0].toFixed(6)}, ${c[1].toFixed(6)}, ${c[2].toFixed(6)})`;
const v3 = (hex) => g3(lin(hex));
// a hash of two whole numbers, 0 to 1: places of the city are laid by their own cell's numbers, never by a seed
const hash2 = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- the sky: four colours alone, three columns, steady
// The dome is drawn twice with one geometry. FIRST, behind everything. AGAIN, after the rings of light, only where the open
// sky is brighter than a ring can be (its bright amber and pale parts in the west): a ring is laid by the
// greater of ring and ground, so over that sky no ring shows, and the west keeps its amber with no other hue laid in it.
// The second drawing stands at the far plane with the depth test on, so it never covers stone, roof or anything solid; it
// comes before the exit ring's own glow in the drawing order, so that glow lies over it as over everything else.
function makeSky() {
  const col = (k) => SKY[k].map(g3).join(', ');
  const vertexShader = /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
  const fragmentShader = (over) => /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vDir;
      // a column: colours at 0, 10, 15, 20 and 28 degrees above the horizon, mixed straight between two neighbours
      vec3 column(vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4, float up) {
        vec3 r = mix(c0, c1, clamp(up / 10., 0., 1.));
        r = mix(r, c2, clamp((up - 10.) / 5., 0., 1.));
        r = mix(r, c3, clamp((up - 15.) / 5., 0., 1.));
        return mix(r, c4, clamp((up - 20.) / 8., 0., 1.));
      }
      void main() {
        vec3 d = normalize(vDir);
        float up = max(0., degrees(asin(clamp(d.y, -1., 1.))));
        vec3 west = column(${col('west')}, up), halfw = column(${col('half')}, up), away = column(${col('away')}, up);
        vec3 sky = byShare(westShare(d.xz), west, halfw, away);
        ${over ? `float units = dot(sky, vec3(.2126, .7152, .0722)) / ${UNIT.toFixed(6)};
        gl_FragColor = vec4(sky, smooth01((units - .55) / .4));` : 'gl_FragColor = vec4(sky, 1.);'}
      }`;
  const geo = new THREE.SphereGeometry(3000, 32, 16);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, vertexShader, fragmentShader: fragmentShader(false) }));
  mesh.name = 'sky'; mesh.renderOrder = -10; mesh.frustumCulled = false;
  const over = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: true, depthFunc: THREE.LessEqualDepth, transparent: true, vertexShader, fragmentShader: fragmentShader(true) }));
  over.name = 'sky-over-rings'; over.renderOrder = 4.5; over.frustumCulled = false;
  mesh.add(over);
  return mesh;
}

// ---------------------------------------------------------------- the river, the embankments and the ground under the houses
// One dark level river from bank to bank; it writes no depth, so that what lies mirrored under it is seen through it and
// hidden wherever a sight line meets the ground. The embankments are stone walls from the water to 6 m; their tops are carried
// inland, dark as a roof.
function makeGround() {
  const group = new THREE.Group(), n = RIVER.inland, d = dirOf(RIVER.bearing), p = RIVER.p, W = RIVER.width, FAR = 3400;
  const at = (along, s, y) => [p[0] + d[0] * along + n[0] * s, y, p[1] + d[1] * along + n[1] * s];
  const quadGeo = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };
  // the water's one flat colour; far off it takes the dusk's own far fade, as the ground beside it does
  const riverGeo = quadGeo([at(-FAR, 0, 0), at(-FAR, -W, 0), at(FAR, -W, 0), at(FAR, 0, 0)]);
  const river = new THREE.Mesh(riverGeo, new THREE.ShaderMaterial({
    depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vWp;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vWp;
      void main() { gl_FragColor = vec4(farFade(${v3(COLOURS.river)}, vWp, cameraPosition, 1.), 1.); }`,
  }));
  river.name = 'river'; river.renderOrder = -5; river.frustumCulled = false; group.add(river);
  // the water's level is written into the depth once what lies mirrored under it has been drawn (the lamps' points and the
  // rings' lines), so that the sky's second drawing never lies on the water
  const level = new THREE.Mesh(riverGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, side: THREE.DoubleSide }));
  level.name = 'river-level'; level.renderOrder = 3.8; level.frustumCulled = false; group.add(level);
  // ground and walls in one geometry: east ground, west ground, the two walls; each quad is laid to look up or toward the water
  const pos = [], nor = [], idx = [];
  const lay = (pts, nn) => { const b = pos.length / 3; for (const q of pts) { pos.push(q[0], q[1], q[2]); nor.push(nn[0], nn[1], nn[2]); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  lay([at(-FAR, 0, GROUND_Y), at(FAR, 0, GROUND_Y), at(FAR, FAR, GROUND_Y), at(-FAR, FAR, GROUND_Y)], [0, 1, 0]);
  lay([at(-FAR, -W, GROUND_Y), at(FAR, -W, GROUND_Y), at(FAR, -W - FAR, GROUND_Y), at(-FAR, -W - FAR, GROUND_Y)], [0, 1, 0]);
  lay([at(-FAR, 0, 0), at(FAR, 0, 0), at(FAR, 0, GROUND_Y), at(-FAR, 0, GROUND_Y)], [-n[0], 0, -n[1]]);
  lay([at(-FAR, -W, 0), at(FAR, -W, 0), at(FAR, -W, GROUND_Y), at(-FAR, -W, GROUND_Y)], [n[0], 0, n[1]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const plain = new THREE.Mesh(g, new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vN, vWp;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN, vWp;
      const vec3 TOP = ${v3(COLOURS.houseRoof)}, WALL_U = ${v3(COLOURS.bankUnlit)}, WALL_L = ${v3(COLOURS.stoneLit)};
      void main() {
        vec3 N = normalize(vN);
        // the walls' stone in courses of 0.6 m; the tops dark as a roof
        float cy = vWp.y / .6, fw = fwidth(cy), joint = smoothstep(.44 - fw, .44, abs(fract(cy) - .5)) * (1. - smooth01((fw - .3) / .6));
        vec3 wall = mix(WALL_U, WALL_L, max(0., dot(N, KEY))) * (1. - .12 * joint);
        gl_FragColor = vec4(farFade(N.y > .5 ? TOP : wall, vWp, cameraPosition, 1.), 1.);
      }`,
  }));
  plain.name = 'ground'; plain.frustumCulled = false; group.add(plain);
  // The ground's tops are drawn AGAIN after the rings of light, as the sky is, only where the far ground has taken so much of
  // the dusk's far fade that it is brighter than a far ring: a ring is laid by the greater of ring and ground, so over
  // that ground no ring shows, and the pale warm cream lays no other hue on the amber of the far west. Near ground is dark
  // as a roof and is never drawn twice.
  const over = new THREE.Mesh(g, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: true, depthFunc: THREE.LessEqualDepth,
    vertexShader: plain.material.vertexShader,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN, vWp;
      void main() {
        vec3 col = farFade(${v3(COLOURS.houseRoof)}, vWp, cameraPosition, 1.);
        float units = dot(col, vec3(.2126, .7152, .0722)) / ${UNIT.toFixed(6)};
        gl_FragColor = vec4(col, step(.5, normalize(vN).y) * smooth01((units - .2) / .2));
      }`,
  }));
  over.name = 'ground-over-rings'; over.renderOrder = 4.4; over.frustumCulled = false; group.add(over);
  return { group, river, plain };
}

// ---------------------------------------------------------------- house blocks with their roofs and lit fronts, the lamps
// NEAR: one block to each 15 m cell of ground within 260 m of the route, or within 70 m of the far embankment, clear of every
// tower by 4 m: the designer's own law and count. FAR: beyond those, to 640 m from the route on both banks, one larger block
// to each 30 m cell, so that the roofs go on to where the dusk takes them. A block's size, height, roof and the way its
// ridge runs come from its cell's numbers alone. Ridges stand 14 to 34 m.
const HOUSE_REACH = 260, FAR_REACH = 640, FAR_CELL = 30;
function layHouses(path, detail) {
  const pts = []; for (let dd = 0; dd <= Math.ceil(path.length); dd++) { const q = path.posAtDist(Math.min(dd, path.length)); pts.push(q.x, q.z); }
  const toRoute = (x, z) => { let b = Infinity; for (let i = 0; i < pts.length; i += 2) { const dx = pts[i] - x, dz = pts[i + 1] - z, q = dx * dx + dz * dz; if (q < b) b = q; } return Math.sqrt(b); };
  // the room a block has beside the nearest tower: 4 m of clear ground beyond the tower's cornice
  const room = (x, z) => { let b = Infinity; for (const t of TOWERS) b = Math.min(b, Math.max(Math.abs(x - t.x), Math.abs(z - t.z)) - t.w / 2 - 4.6); return b; };
  const out = [];
  const add = (x, z, ix, iz, half, spread, far) => {
    const most = room(x, z), ha = Math.min(half + spread * hash2(ix, iz + 71), most), hb = Math.min(half + spread * hash2(ix + 37, iz), most);
    const top = 14 + (far ? 15 : 20) * hash2(ix + 5, iz + 11), rot = hash2(ix + 9, iz + 23) < 0.5 ? 1 : 0, across = rot ? ha : hb;
    const roof = Math.min((0.42 + 0.38 * hash2(ix + 13, iz + 3)) * across, top - GROUND_Y - 6);
    const hip = hash2(ix + 17, iz + 41), inset = hip < 0.35 ? 0 : 0.3 + 0.45 * hash2(ix + 19, iz + 43);
    out.push({ x, z, ix, iz, ha, hb, top, roof, rot, inset, far, n: out.length });
  };
  for (let ix = 0, x = -420; x <= 440; x += 15, ix++) for (let iz = 0, z = -480; z <= 300; z += 15, iz++) {
    const s = fromEastBank(x, z); if (overWater(x, z) || Math.abs(s) < 4 || Math.abs(s + RIVER.width) < 4) continue;
    const westStrip = s < -RIVER.width && s > -RIVER.width - 70 && z > -460 && z < 120;
    if (!westStrip && !(s > 0 && toRoute(x, z) <= HOUSE_REACH)) continue;
    if (room(x, z) < 4.9) continue;
    add(x, z, ix, iz, 5.2, 1.5, 0);
  }
  const C = FAR_CELL;
  for (let ix = 200, x = -1110; x <= 1110; x += C, ix++) for (let iz = 200, z = -1200; z <= 1110; z += C, iz++) {
    const s = fromEastBank(x, z); if (s <= 8 && s >= -RIVER.width - 8) continue;
    const r = toRoute(x, z); if (r > FAR_REACH) continue;
    if (s > 0 && r <= HOUSE_REACH + C / 2) continue;
    if (s < 0 && s > -RIVER.width - 70 - C / 2 && z > -460 && z < 120) continue;
    if (room(x, z) < 13) continue;
    // the far blocks are plentiful: a slower machine keeps the share its detail names, by the cell's own number
    if (hash2(ix + 3, iz + 7) >= detail) continue;
    add(x, z, ix, iz, 9.5, 3.5, 1);
  }
  return out;
}
// One block: four walls to the eaves and a roof of two slopes with two ends (fourteen triangles), instanced. The roof's
// height, the ridge's inset (none: a gable; some: a hipped roof) and the way the ridge runs are the block's own. The fronts are
// painted in the shader: storeys of 3.2 m, a plain ground storey, rows of windows 0.9 by 1.4 m above it; a row is lit whole
// or dark whole (four windows or more, never one alone), steady, a fifth of a face at rest; a far window is shown by the
// share of the pixel it fills, so it never flickers. Nothing is seen in a window but its light.
function makeHouses(houses) {
  const Q = (a, b, c, d) => [a, b, c, a, c, d], E = 0.8;
  const faces = [
    Q([1, 0, -1], [1, 0, 1], [1, E, 1], [1, E, -1]), Q([1, 0, 1], [-1, 0, 1], [-1, E, 1], [1, E, 1]),
    Q([-1, 0, 1], [-1, 0, -1], [-1, E, -1], [-1, E, 1]), Q([-1, 0, -1], [1, 0, -1], [1, E, -1], [-1, E, -1]),
    Q([1, E, 1], [-1, E, 1], [-1, 1, 0], [1, 1, 0]), Q([-1, E, -1], [1, E, -1], [1, 1, 0], [-1, 1, 0]),
    [[1, E, -1], [1, E, 1], [1, 1, 0]], [[-1, E, 1], [-1, E, -1], [-1, 1, 0]],
  ];
  const pos = [], aF = [];
  faces.forEach((f, k) => { for (const v of f) { pos.push(v[0], v[1], v[2]); aF.push(k); } });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aF', new THREE.Float32BufferAttribute(aF, 1));
  const iB = new Float32Array(houses.length * 4);
  houses.forEach((h, i) => iB.set([1 - h.roof / (h.top - GROUND_Y), h.inset, h.rot, h.n], i * 4));
  geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aF; attribute vec4 iB;
      varying vec3 vN, vWp, vK; varying vec4 vF;
      void main() {
        float ha = instanceMatrix[0].x, H = instanceMatrix[1].y, hb = instanceMatrix[2].z, rot = iB.z;
        // along the ridge and across it
        float la = mix(ha, hb, rot), lb = mix(hb, ha, rot), roofH = H * (1. - iB.x);
        vec3 p = position; float ridge = step(.9, p.y);
        p.y = mix(p.y / ${E.toFixed(1)} * iB.x, 1., ridge); p.x *= 1. - ridge * iB.y;
        vec3 n = vec3(1., 0., 0.); float W = lb, u = p.z * lb, kind = 0.;
        if (aF > .5 && aF < 1.5) { n = vec3(0., 0., 1.); W = la; u = p.x * la; }
        else if (aF > 1.5 && aF < 2.5) { n = vec3(-1., 0., 0.); }
        else if (aF > 2.5 && aF < 3.5) { n = vec3(0., 0., -1.); W = la; u = p.x * la; }
        else if (aF > 3.5 && aF < 4.5) { n = vec3(0., lb, roofH); kind = 1.; }
        else if (aF > 4.5 && aF < 5.5) { n = vec3(0., lb, -roofH); kind = 1.; }
        else if (aF > 5.5) { n = vec3((aF < 6.5 ? 1. : -1.) * max(roofH, .01), iB.y * la, 0.); kind = step(.02, iB.y); }
        // where the ridge runs along z, the block's two level axes change places
        vec3 q = rot > .5 ? p.zyx : p; n = rot > .5 ? n.zyx : n;
        vec4 wp = modelMatrix * instanceMatrix * vec4(q, 1.);
        vWp = wp.xyz; vN = normalize(n); vF = vec4(u, p.y * H, W, H * iB.x); vK = vec3(kind, iB.w * 8. + aF, 0.);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN, vWp, vK; varying vec4 vF;
      const vec3 ROOF = ${v3(COLOURS.houseRoof)}, WALL_U = ${v3(COLOURS.houseUnlit)}, WALL_L = ${v3(COLOURS.houseLit)}, WIN = ${v3(COLOURS.window)};
      float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      // the share of a pixel's footprint that lies in the band a to b of every whole step of x
      float band(float x, float a, float b, float fw) {
        fw = max(fw, 1e-4);
        float x0 = x - .5 * fw, x1 = x + .5 * fw;
        float i0 = floor(x0) * (b - a) + clamp(fract(x0), a, b) - a, i1 = floor(x1) * (b - a) + clamp(fract(x1), a, b) - a;
        return clamp((i1 - i0) / fw, 0., 1.);
      }
      void main() {
        vec3 N = normalize(vN);
        float s = max(0., dot(N, KEY)), u = vF.x, v = vF.y, W = max(vF.z, 1.), wallH = vF.w, id = floor(vK.y + .5);
        float st = v / 3.2, nst = floor(wallH / 3.2), ncol = max(4., floor(2. * W / 2.3)), pitch = 2. * W / ncol, cu = (u + W) / pitch;
        float fs = fwidth(st), fc = fwidth(cu), row = floor(st), col = floor(cu);
        // every block a little of its own tone; a band under the eaves
        float own = .86 + .28 * hash12(vec2(floor(id / 8.), 5.));
        vec3 wall = mix(WALL_U, WALL_L, s) * own * (1. - .18 * smoothstep(wallH - .9, wallH - .6, v) * step(v, wallH + .01));
        // a plain ground storey a little darker, and a thin course at every floor
        wall *= 1. - .22 * (1. - smoothstep(2.9, 3.3, v)) - .14 * band(st, 0., .07, fs) * (1. - smooth01((fs - .5) / .5));
        float m = band(st, 1. / 3.2, 2.4 / 3.2, fs) * band(cu, .5 - .45 / pitch, .5 + .45 / pitch, fc) * step(1., row) * step(row, nst - 1.);
        // a row is lit whole or dark whole; three fronts in four carry lit rows
        float P = .5 * step(.25, hash12(vec2(id, 91.)));
        float lit = mix(step(hash12(vec2(id, row)), P), P, smooth01((fs - .4) / .6));
        float tone = mix(.65 + .35 * hash12(vec2(id + col * 7.13, row)), .825, smooth01((fc - .4) / .6));
        vec3 front = mix(wall, mix(wall * .45, WIN * tone, lit), m);
        vec3 col3 = vK.x > .5 ? ROOF * (1. + .7 * s) * (.8 + .4 * hash12(vec2(floor(id / 8.), 9.))) : front;
        gl_FragColor = vec4(farFade(col3, vWp, cameraPosition, 1.), 1.);
      }`,
  });
  const mesh = new THREE.InstancedMesh(geo, material, houses.length), m = new THREE.Matrix4();
  houses.forEach((h, i) => { m.makeScale(h.ha, h.top - GROUND_Y, h.hb); m.setPosition(h.x, GROUND_Y, h.z); mesh.setMatrixAt(i, m); });
  mesh.instanceMatrix.needsUpdate = true; mesh.name = 'houses'; mesh.frustumCulled = false;
  return mesh;
}
// warm points that turn about their own place to face the eye: lamps (0.5 m, never under 2 px) and, mirrored under the
// water's level, the embankment lamps' points on the river. Each holds its place; none takes the clock.
function makePoints(list, name, uH, sizeM, minPx) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.setAttribute('position', q.getAttribute('position')); g.setIndex(q.getIndex()); g.instanceCount = list.length;
  g.setAttribute('iL', new THREE.InstancedBufferAttribute(new Float32Array(list.flat()), 4));
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uH }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 iL; uniform float uH; varying vec2 vUv; varying float vB;
      void main() {
        vec4 mv = viewMatrix * modelMatrix * vec4(iL.xyz, 1.);
        float pxPerM = projectionMatrix[1][1] * uH * .5 / max(-mv.z, .5);
        float size = max(${sizeM.toFixed(2)}, ${minPx.toFixed(1)} * uH / 450. / pxPerM);
        mv.xy += position.xy * size * .5; vUv = position.xy; vB = iL.w;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vB;
      const vec3 LAMP = ${v3(COLOURS.lamp)};
      void main() { float a = 1. - smoothstep(.55, 1., length(vUv)); gl_FragColor = vec4(LAMP * vB * a, a); }`,
  }));
  mesh.name = name; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}
// ---------------------------------------------------------------- the rings of light, and their one reflected line on the river
// A ring, in the designer's order: age = mod(t - start, interval) + slot x interval; at 22 s or more the ribbon is folded
// to one point; radius = first radius + 4.6 x age; brightness = 2.2 x 25 / (25 + radius), eased in over half a second and
// out over its last 5 s. A level circle of 128 segments at its belfry's cornice, each vertex pushed half the line's width to
// either side, square to the line and to the sight line; the line has a width in metres, held between two widths in pixels of a
// 450 px picture; one pale warm cream; LAID BY THE GREATER of ring and ground, never added: no glow, no disc, no sheet.
// `mirror`: the same ribbon under the water's level at a share of the brightness, shown only where the ring's own point is over
// the river, and shifted by one pixel at the most.
// THE LINE'S FIGURES ARE THE PICTURE'S (people who knew nothing of the place read rings of one width and one grey as
// wires laid over the picture). A ring's line has a width in METRES (RING_M), so a near ring is drawn broader than a far
// one and the rings lie in the depth of the place; it is held between the designer's least, 1.2 px, and RING_MAX_PX of a
// 450 px picture. The reflected line carries four tenths of its ring's brightness (1.8 to 2.4 px). The rings' ages, speed,
// life, reach and easing are the designer's, untouched.
const SLOTS = 4, RING_M = 0.5, RING_MIN_PX = 1.2, RING_MAX_PX = 2.2, RING_ON_WATER = 0.4, WATER_MIN_PX = 1.8, WATER_MAX_PX = 2.4;
// A RING'S LIGHT BY ITS OWN AGE AND LEVEL (a law of the place: it reads the ring's radius and its belfry's cornice, nothing
// of the lens). Every ring takes the designer's fade by its radius: brightest as it leaves its belfry (1.7 to 1.9 units),
// under 1 unit from 30 m out, so that a tower's rings read as one widening set, the young one bright and the old ones
// fainter. The rings of the high belfries (cornice at 74.8 m or over) go out in the open air, where many cross one sky:
// between RING_THIN_FROM and RING_THIN_TO m out they thin to RING_THIN of the fade, but never under RING_FAR units as far
// as RING_OUT_FROM m (the least at which, by count over every moment of the clock, a ring past half its life still tells
// beside a young one); from there to RING_OUT_TO m they sink to RING_FAINT, so the widest loops of all, which cross the
// most sky, are a trace. The rings of the low belfries (cornice at 67 m or under) go out close over dark roofs and dark
// water and never fall under RING_HOLD units before their last 5 s. No tower stands between the two levels.
// A FAINT RING IS DRAWN ON A FINER LINE: under RING_FINE_UNDER units the line is RING_FINE of its width, from RING_FULL_FROM
// units it is whole, never under the least width. High in the open air the faint line is finer still (RING_FINE_HIGH of
// its width under RING_FINE_HIGH_UNDER units: the designer's least width, on which every count of the rings is made), so
// the old rings that cross the sky are a fine tracery behind the bright young ones.
const RING_LOW = 67, RING_HIGH = 74.8, RING_HOLD = 0.5, RING_FAR = 0.45, RING_FAINT = 0.2, RING_THIN = 0.25, RING_THIN_FROM = 30, RING_THIN_TO = 65, RING_OUT_FROM = 75, RING_OUT_TO = 92, RING_FINE = 0.75, RING_FINE_UNDER = 0.4, RING_FULL_FROM = 0.9, RING_FINE_HIGH = 0.55, RING_FINE_HIGH_UNDER = 0.46;
function makeRings(towers, clock, uH, linePx, mirror) {
  // the line on the water is seen from 67 m above or more and from far: half the segments hold it round
  const SEG = mirror ? 64 : 128;
  const pos = new Float32Array((SEG + 1) * 2 * 3), idx = [];
  for (let i = 0; i <= SEG; i++) for (let s = 0; s < 2; s++) pos.set([i / SEG, s ? 1 : -1, 0], (i * 2 + s) * 3);
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const n = towers.length * SLOTS, iC = new Float32Array(n * 4), iT = new Float32Array(n * 3);
  towers.forEach((t, i) => { for (let s = 0; s < SLOTS; s++) { iC.set([t.x, t.ring, t.z, t.r0], (i * SLOTS + s) * 4); iT.set([t.interval, t.start, s], (i * SLOTS + s) * 3); } });
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 3)); g.instanceCount = n;
  const ringCol = lin(RING_COLOUR).map((c) => c * UNIT / RING_LUM);
  const material = new THREE.ShaderMaterial({
    uniforms: { uClock: clock, uH, uLinePx: linePx }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`
      attribute vec4 iC; attribute vec3 iT;
      uniform float uClock, uH, uLinePx;
      varying float vAcross, vHalf, vBright; varying vec2 vXz;
      float sm(float x) { x = clamp(x, 0., 1.); return x * x * (3. - 2. * x); }
      void main() {
        float age = mod(uClock - iT.y, iT.x) + iT.z * iT.x;
        float radius = iC.w + ${SOUND.speed.toFixed(2)} * age;
        // the designer's fade by the radius; then by the ring's own level: low over the roofs and the water it keeps a
        // floor, high in the open air it thins between ${RING_THIN_FROM.toFixed(0)} and ${RING_THIN_TO.toFixed(0)} m out and sinks to a trace beyond ${RING_OUT_FROM.toFixed(0)} m
        float law = ${SOUND.fadeTop.toFixed(2)} * ${SOUND.fadeK.toFixed(1)} / (${SOUND.fadeK.toFixed(1)} + radius);
        float low = 1. - sm((iC.y - ${RING_LOW.toFixed(1)}) / ${(RING_HIGH - RING_LOW).toFixed(1)});
        float high = max(${RING_FAR.toFixed(2)}, law * (1. - ${(1 - RING_THIN).toFixed(2)} * sm((radius - ${RING_THIN_FROM.toFixed(1)}) / ${(RING_THIN_TO - RING_THIN_FROM).toFixed(1)})));
        high *= 1. - ${(1 - RING_FAINT / RING_FAR).toFixed(4)} * sm((radius - ${RING_OUT_FROM.toFixed(1)}) / ${(RING_OUT_TO - RING_OUT_FROM).toFixed(1)});
        float level = mix(high, max(${RING_HOLD.toFixed(2)}, law), low);
        vBright = level * sm(age / ${SOUND.easeIn.toFixed(2)}) * sm((${SOUND.life.toFixed(1)} - age) / ${SOUND.easeOut.toFixed(1)});
        float ang = position.x * 6.2831853, c = cos(ang), s = sin(ang);
        vec3 P = vec3(iC.x + radius * c, ${mirror ? '-iC.y' : 'iC.y'}, iC.z + radius * s), T = vec3(-s, 0., c);
        vXz = P.xz;
        vec3 V = P - cameraPosition; float dist = max(length(V), .1);
        vec3 x = cross(T, V); float xl = length(x); vec3 across = xl > 1e-4 ? x / xl : vec3(0., 1., 0.);
        float pxPerM = projectionMatrix[1][1] * uH * .5 / dist, k = uH / 450.;
        float wpx = clamp(${(mirror ? SOUND.lineM : RING_M).toFixed(2)} * pxPerM, uLinePx * k, ${(mirror ? WATER_MAX_PX : RING_MAX_PX).toFixed(1)} * k);
        ${mirror ? '' : `float fineLow = mix(${RING_FINE.toFixed(2)}, 1., sm((level - ${RING_FINE_UNDER.toFixed(2)}) / ${(RING_FULL_FROM - RING_FINE_UNDER).toFixed(2)}));
        float fineHigh = mix(${RING_FINE_HIGH.toFixed(2)}, 1., sm((level - ${RING_FINE_HIGH_UNDER.toFixed(2)}) / ${(RING_FULL_FROM - RING_FINE_HIGH_UNDER).toFixed(2)}));
        wpx = max(uLinePx * k, wpx * mix(fineHigh, fineLow, low));`}
        vHalf = .5 * wpx; vAcross = position.y * (vHalf + 1.);
        ${mirror ? 'P += across * (sin(1.3 * uClock + .2 * P.x) / pxPerM);' : ''}
        P += across * (vAcross / pxPerM);
        gl_Position = age >= ${SOUND.life.toFixed(1)} ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * vec4(P, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying float vAcross, vHalf, vBright; varying vec2 vXz;
      const vec3 RING = ${g3(ringCol)};
      void main() {
        // a hard-edged line with one pixel of smoothing at each edge, and nothing beyond it
        float a = clamp(vHalf + .5 - abs(vAcross), 0., 1.);
        ${mirror ? `float sb = (vXz.x - ${RIVER.p[0].toFixed(3)}) * ${RIVER.inland[0].toFixed(6)} + (vXz.y - ${RIVER.p[1].toFixed(3)}) * ${RIVER.inland[1].toFixed(6)};
        a *= ${RING_ON_WATER.toFixed(2)} * step(sb, 0.) * step(${(-RIVER.width).toFixed(1)}, sb);` : ''}
        gl_FragColor = vec4(RING * (vBright * a), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.name = mirror ? 'ring-lines-on-water' : 'rings'; mesh.frustumCulled = false; mesh.renderOrder = mirror ? 3.6 : 4;
  return mesh;
}
// the towers whose rings can reach the water (the designer's count: 45)
const reachesWater = (t) => { const s = fromEastBank(t.x, t.z), reach = t.r0 + SOUND.speed * SOUND.life; return s > 0 ? s < reach : -RIVER.width - s < reach; };

export default {
  id: 'dial-towers-at-dusk',
  name: 'Dial Towers at Dusk',
  category: 'books',
  placeKind: 'city',
  book: 'As I Walked Out One Evening',
  author: 'W. H. Auden, 1907 to 1973',
  weirdness: 0.35,
  media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    // the visit's hints are read and deal nothing: the place is the same on every seed
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const clock = makeClock(), uH = { value: 450 }, linePx = { value: RING_MIN_PX };
    // the route: the designer's 56 knots in their order, flown at one even speed; the exit ring's centre is the last knot
    const path = makePath(KNOTS);

    const sky = makeSky(); scene.add(sky);
    await ctx.yield();
    const hero = await buildHero(ctx, { city: true, clock });
    scene.add(hero.object);
    await ctx.yield();
    const ground = makeGround(); scene.add(ground.group);
    await ctx.yield();
    const houses = layHouses(path, detail);
    await ctx.yield();
    scene.add(makeHouses(houses));
    await ctx.yield();
    {
      // lamps: along both embankments every 12 m, and below the house fronts, one to every second block, 6 m up
      const lamps = [], onWater = [], n = RIVER.inland, d = dirOf(RIVER.bearing);
      for (let i = 0; i < 127; i++) {
        const east = i < 64, along = -372 + 12 * (east ? i : i - 64), s = east ? 0.4 : -RIVER.width - 0.4;
        const x = RIVER.p[0] + d[0] * along + n[0] * s, z = RIVER.p[1] + d[1] * along + n[1] * s;
        lamps.push([x, GROUND_Y + 2.2, z, 1]); onWater.push([x, -(GROUND_Y + 2.2), z, 0.6]);
      }
      for (const h of houses) {
        if (h.n % 2) continue;
        const f = Math.floor(4 * hash2(h.n, 3)), [nx, nz] = [[1, 0], [0, 1], [-1, 0], [0, -1]][f], half = f % 2 ? h.hb : h.ha, c = (hash2(h.n, 5) - 0.5) * 6;
        lamps.push([h.x + nx * (half + 0.5) - nz * c, GROUND_Y + 6, h.z + nz * (half + 0.5) + nx * c, 1]);
      }
      scene.add(makePoints(lamps, 'lamps', uH, 0.5, 2));
      scene.add(makePoints(onWater, 'lamp-points-on-water', uH, 0.5, 2));
      await ctx.yield();
    }
    // the rings of light of every tower, and the reflected lines of those whose rings can reach the water
    const rings = makeRings(TOWERS, clock, uH, linePx, false); scene.add(rings);
    await ctx.yield();
    scene.add(makeRings(TOWERS.filter(reachesWater), clock, uH, { value: WATER_MIN_PX }, true));
    await ctx.yield();

    const size = new THREE.Vector2(), eye = new THREE.Vector3();
    // the six looks, as the designer's rows give them: never two together, every row steady
    const pois = LOOKS.map((l) => ({ at: l.at, from: l.from, to: l.to, fade: l.fade, weight: l.weight, steady: l.steady }));
    return {
      scene, path, duration: FLIGHT_SECONDS,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: LOOK_AHEAD, sway: 0, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: RING.radius, color: '#c9d6ff', glow: 1 },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, seconds, camera) {
        // the place's one clock is the engine's own seconds; the sky goes with the eye; the lines' width follows the picture's height
        clock.value = seconds;
        eye.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(eye);
        ctx.renderer.getDrawingBufferSize(size); uH.value = size.y;
        hero.update(dt, seconds, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
