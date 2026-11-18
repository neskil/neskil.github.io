// THE LAKE COMES DOWN IN CURLS: a veiled grey day in a gorge of leaning strata. Oil glazes over a brown
// underpaint, drawn hair-water. From a flowered cave with its brook we dive over the lip as a high lake breaks
// through its wall of rock, cross the falling braids, skim a pool opening like a flower and chase a combed bore
// out between two leaning pinnacles. No lights, no fog, no textures: all tone is computed in the materials
// (the hero's style routines), colours are exact under post.flat.
// +Z is the course, +X is port, the pool's surface is y = 0.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, PALETTE, makeStyle, STYLE_GLSL, glazeMaterial, contourShellMaterial, strandMaterial, strandGeometry, waterMaterial, slabGeometry } from '../parts/lake-comes-down-in-curls.js';

const DIP = 28 * Math.PI / 180, SD = Math.sin(DIP), CD = Math.cos(DIP);
const sm = smoothstep;
// the brief's route, point for point (one collinear point added on the last straight)
const ROUTE = [[0, 92, 0], [0, 90.5, 50], [-4, 87, 100], [-8, 84, 150], [0, 68, 215], [34, 42, 270], [68, 24, 322], [38, 9, 360],
  [-10, 7, 398], [-52, 8, 450], [-70, 9, 520], [-74, 10, 600], [-74, 11, 645], [-74, 12, 690]];
const BED = 4.4;      // one bed of the world's bedding, in metres of b: the land, the cave, the pinnacles and the glaze's ledges all step by it
const POOL = [10, 340], POOL_R = 111, GAP_Z = 690, GAP_X = -74;
const CLEFT = [-83, 524], CLEFT_DIR = [-0.962, 0.272];   // the side cleft's mouth on the starboard bank and the way up its valley
const STORM = new THREE.Vector3(CLEFT[0] + CLEFT_DIR[0] * 1390, 395, CLEFT[1] + CLEFT_DIR[1] * 1390);      // the far storm stands over that valley, 1.4 km off
// the valley opens from the storm toward the pool: no pinnacle stands between the pool's far water and the storm (a wedge from the pool's
// starboard side to the storm, widening with the cloud's own breadth), so the storm is seen over the valley and never through rock
const VALE = [POOL[0] - 20, POOL[1] + 65], VALE_DIR = (() => { const dx = STORM.x - VALE[0], dz = STORM.z - VALE[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();

export default {
  id: 'lake-comes-down-in-curls',
  name: 'The Lake Comes Down in Curls',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Leonardo da Vinci, 1452 to 1519',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const rng = ctx.rng, N = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(vary.density ?? 1, 0.8, 1.0);
    const path = makePath(ROUTE);

    // ---- seeded variety: the hour of the veiled sky, the rosette, the storm (the rare twin fall on vary.rare)
    const hourDealt = rng.pick(['noon', 'noon', 'gold', 'dusk']);      // drawn in every build, so a viewer's set Hour re-deals nothing after it
    const hourKey = vary.hour === 'golden' || vary.hour === 'dawn' ? 'gold' : vary.hour === 'night' ? 'dusk' : vary.hour === 'day' ? 'noon' : hourDealt;
    const nGreat = rng.int(5, 9), hand = rng.chance(0.5) ? 1 : -1, nCoils = rng.int(10, 14), rare = !!vary.rare;
    const S = makeStyle(PALETTE);      // this build's own style uniforms (palette, light, clock, hour): nothing is shared between two builds
    S.uHour.value.set(hourKey === 'gold' ? 1 : 0, hourKey === 'dusk' ? 0.72 : 1);
    const pal = PALETTE.map((h) => new THREE.Color(h));

    // ---- the route sampled by z (z rises all the way): x and y of the path over any z
    const RS = 400, rz = new Float32Array(RS + 1), rx = new Float32Array(RS + 1), ry = new Float32Array(RS + 1), _p = new THREE.Vector3(), _q = new THREE.Vector3();
    for (let i = 0; i <= RS; i++) { path.pointAt(i / RS, _p); rz[i] = _p.z; rx[i] = _p.x; ry[i] = _p.y; }
    const routeAt = (z) => {      // -> [x, y, u]
      if (z <= rz[0]) return [rx[0], ry[0], 0]; if (z >= rz[RS]) return [rx[RS], ry[RS], 1];
      let a = 0, b = RS; while (b - a > 1) { const m = (a + b) >> 1; if (rz[m] <= z) a = m; else b = m; }
      const f = (z - rz[a]) / Math.max(rz[b] - rz[a], 1e-6); return [lerp(rx[a], rx[b], f), lerp(ry[a], ry[b], f), (a + f) / RS];
    };
    const uAtZ = (z) => routeAt(z)[2];
    const routeD3 = (x, y, z) => path.distanceTo(x, y, z);

    // ---- the lie of the land, as one height function (the cave is its own shell, the dam is the hero)
    const brookY = (z) => { const y = routeAt(clamp(z, -30, 152))[1] - 4.6; return Math.floor(y / 0.6) * 0.6; };   // flooded floor, stepping 0.6 m
    const riverX0 = (z) => z < 520 ? lerp(-44, -60, sm(440, 520, z)) : z < 700 ? lerp(-60, GAP_X, sm(560, 680, z)) : GAP_X + 170 * Math.sin((z - 720) / 310) * sm(720, 1000, z);
    const riverW0 = (z) => z < 640 ? lerp(26, 20, sm(440, 480, z)) : z < 760 ? lerp(20, 11, sm(640, 684, z)) + 22 * sm(700, 760, z) : 33;      // the broad river: the ducks' water, the reach before the gap, the plain (and the rule the crags were placed by)
    // THE RAVINE'S NARROWS: past the ducks' water the river draws in under the way and runs to the ravine's end between two close undercut
    // banks, 21 m of water with a lip of rock hanging 3 m over it on either hand (LIP_OVER), so the banks pass at 7 m
    const narrowK = (z) => sm(478, 500, z) * (1 - sm(598, 626, z)), LIP_OVER = 3.2, LIP_Z0 = 456, LIP_Z1 = 612;
    const riverX = (z) => { const k = narrowK(z); return k > 0 ? lerp(riverX0(z), routeAt(z)[0], k) : riverX0(z); }, riverW = (z) => lerp(riverW0(z), 10.5, narrowK(z));
    const inCleft = (x, z, m) => { const ax = (x - CLEFT[0]) * CLEFT_DIR[0] + (z - CLEFT[1]) * CLEFT_DIR[1], dC = Math.abs((x - CLEFT[0]) * CLEFT_DIR[1] - (z - CLEFT[1]) * CLEFT_DIR[0]); return ax > -14 && dC < m; };      // within m metres of the cleft's axis, at its mouth or up it
    const lipY = (z, port) => { const y = routeAt(z)[1] - 2.4; return port ? y - 1.2 * (1 - sm(520, 575, z)) : Math.min(y, 5.6); };      // the lips' height: 2.4 m under the eye to port (lower at the ravine's head), lower to starboard (the cleft and the gap are seen over that bank)
    const wallBack = (z) => 6 * (1 - sm(520, 575, z));      // at the ravine's head the port wall stands 6 m further back behind its lip: from the ducks' water the gap is seen past it
    const portFace = (z) => z < 245 ? lerp(40, 97, sm(112, 245, z)) : 99;
    let RX = riverX, RW = riverW, NK = narrowK;      // the river as the land's height reads it (the crags are placed on the land of the broad river, as they always were: see the pinnacles)
    const H = (x, z) => {
      const n1 = N.fbm2(x * 0.004 + 3, z * 0.004 + 1, 3), n2 = N.n2(x * 0.021, z * 0.019), n3 = N.n2(x * 0.06 + 9, z * 0.06);
      let h = 12 + 11 * n1 + 4 * n2;                                                    // the low country
      const dPool = Math.hypot(x - POOL[0], z - POOL[1]) - POOL_R;
      // the headland with the shelf: a plateau that ends in the lip at z 152 and falls to the pool
      const lip = 152 + 5 * N.n2(x * 0.05, 2.2), shelf = lerp(brookY(z) - 4.5, brookY(z) + 1.3 + 1.2 * n3 - 2.4 * (1 - sm(1.5, 4.5, Math.abs(x - routeAt(z)[0]) + 0.75 * N.n2(z * 0.19, x > routeAt(z)[0] ? 3.1 : 9.7) + 0.3 * N.n2(z * 0.6, 5.5))), sm(104, 113, z));
      const head = lerp(shelf, 4, Math.pow(sm(lip, lip + 76, z), 0.85)) * (1 - sm(lip + 60, lip + 90, z));
      const edgeS = -26 - 8 * sm(60, 130, z) + 6 * N.n2(z * 0.03, 7.7);                  // the headland's starboard edge
      h = lerp(h, Math.max(h, head), sm(edgeS - 22, edgeS, x) * (1 - sm(215, 250, z)));
      // the high country to port: the gorge wall from the cave to the dam, the lake's rim, the wall beyond the dam
      const pf = portFace(z) + 5 * N.n2(z * 0.035, 1.3), hi = 112 + 13 * N.n2(x * 0.012, z * 0.012 + 5);
      let wall = sm(pf - 1, pf + 17, x) * (z < 250 || z > 425 ? 1 : sm(98, 112, x));
      let top = hi;
      if (x > 104 && x < 256 && z > 248 && z < 450) top = lerp(hi, 74, sm(0, 14, Math.min(x - 104, 256 - x, z - 248, 450 - z)));   // the lake's bed
      // the far wall round the pool's end, from the dam to the ravine's port bank
      const rvp = RX(Math.max(z, 440)) + RW(Math.max(z, 440));
      const far = sm(0, lerp(16, 7, NK(z)), Math.min(dPool + 2, x - rvp - 2 - wallBack(z) * NK(z))) * sm(372, 432, z) * (1 - sm(640, 760, z) * (1 - sm(60, 120, x)));
      const farTop = lerp(26, 108, Math.pow(sm(-20, 100, x), 1.6)) + 8 * n2;      // it falls away quickly from the dam's end to starboard: from the dive the horizon and the ranks stand open beside the fall
      h = Math.max(lerp(h, top, wall), lerp(h, farTop, far));
      // the ravine's starboard wall, broken by the cleft
      const dR = Math.abs(x - RX(z)) - RW(z);
      const rav = sm(436, 468, z) * (1 - sm(712, 770, z)) * (1 - sm(50, 130, dR));
      h = Math.max(h, (17 + 8 * n2 + 4 * n3) * rav * (x < RX(z) ? 0.3 : 1));      // the starboard bank is low: the dark wing closes one side only
      if (x < RX(z)) h = lerp(h, Math.min(h, 6.5 + 3 * n3 + 0.4 * Math.max(dR, 0)), sm(436, 470, z) * (1 - sm(700, 740, z)) * (1 - sm(40, 75, dR)));   // no hill of the low country stands on the starboard bank: the river, the cleft and the gap are seen over it
      if (NK === narrowK && z > LIP_Z0 - 8 && z < LIP_Z1 + 8) { const kz = sm(LIP_Z0 - 8, LIP_Z0, z) * (1 - sm(LIP_Z1, LIP_Z1 + 8, z)), port = x > RX(z); h = lerp(h, Math.max(h, port ? lipY(z, true) + 0.2 + 0.8 * (dR + 1.6) : lipY(z, false) - 1.0 + 0.4 * n3), kz * sm(0.6, 2.6, dR) * (1 - sm(port ? 4 + wallBack(z) : 9, port ? 7 + wallBack(z) : 20, dR))); }   // behind its lip each bank stands to the lip's own top: to port a bench going up into the wall a little steeper than the beds lie (so the land's own ledges step it), to starboard the low bank
      if (z > 430) h = lerp(h, -4, sm(5.5, -2.5, dR + 1.6 * n3 * (1 - NK(z))));                        // the river's bed (in the narrows the water's edge runs true under the lips)
      const ax = (x - CLEFT[0]) * CLEFT_DIR[0] + (z - CLEFT[1]) * CLEFT_DIR[1], dC = Math.abs((x - CLEFT[0]) * CLEFT_DIR[1] - (z - CLEFT[1]) * CLEFT_DIR[0]);
      if (ax > -8) h = lerp(h, -4, sm(21 + ax * 0.02, 13, dC + 2 * n3) * sm(-8, 2, ax));   // the cleft's bed
      h = lerp(h, -4, sm(7, -4, dPool + 2.5 * n3));                                      // the pool's basin
      if (z > 156) { const r = routeAt(z), d = Math.hypot(x - r[0], 0); h = Math.min(h, r[1] - 7.5 + Math.max(d - 5, 0) * 1.1 + 60 * NK(z) * sm(12.5 + wallBack(z), 16 + wallBack(z), d)); }   // nothing within 6.5 m of the way (in the narrows the port wall stands up from 12.5 m off: a cliff across the beds, not a slope along them)
      if (z > 740) h = lerp(h, Math.min(h, 0.3), (1 - sm(30, 220, dR)) * sm(740, 800, z));          // the plain the far river winds over
      return h;
    };
    // ledges: the height snapped to the bedding (b = dot(p, dipNormal)), a step every bed (4.4 m of b), all dipping one way
    const bedQ = (b) => { const q = b / BED; return q + 0.3 * Math.sin(q * 1.7 + 1.3); };      // beds of unequal thickness: the glaze's own rule
    const bedB = (qq) => { let q = qq; for (let i = 0; i < 8; i++) q = qq - 0.3 * Math.sin(q * 1.7 + 1.3); return q * BED; };
    const terr = (x, y, z, amt) => {
      const b = -x * SD + y * CD, q = bedQ(b), f = q - Math.floor(q);
      const bt = bedB(Math.floor(q) + (sm(0.62, 1, f) + 0.12 * f) / 1.12), hb = Math.floor(q) * 0.618034 + 0.31, bed = hb - Math.floor(hb);      // the same bed and the same thickness rule as the glaze's ledges
      return lerp(y, (bt + x * SD) / CD, amt * (0.25 + 0.75 * bed * bed));      // thick beds step out, thin ones barely
    };
    await ctx.yield();

    // ---- materials of the world: the hero's glaze for all rock and earth (all on this build's style S), the contour shells
    // (crags and fallen beds by their own radius per vertex), one cave variant with a window cut by rule
    const rockMat = glazeMaterial(S, { vertexColors: true, litTop: 0.85 });      // the ledge tops that show carry small full lights (the land, the fallen beds; the crags by cragMat below: the same program with uBlade 1, which rules each blade's own few partings and takes the land's ruled beds off it)
    const pinShellMat = contourShellMaterial(S, { vertexColors: true, radAttr: true, push: 0.017, blade: 1 }), cragMat = glazeMaterial(S, { vertexColors: true, litTop: 0.85, blade: 1 });      // a narrower band than the near rock's: a middle pinnacle is lost at its contour, not smeared
    // THE WINDOW in the cave's starboard wall, a breach through a curtain of rock: the middle's z, the half length, the sill's and the head's height of the leaning rounded
    // square its outline swells about; `thick`: the wall's thickness there; `roll`: how far into the wall the rock has rolled where the outline lies; `collar`: how far the
    // wall's face stands in toward the cave round the breach; `hole`: how far outside the rounded square the shell is cut at the jambs
    const WINO = { z: 74.31, hz: 5.79, sill: 86.2, head: 94.7, thick: 2.8, roll: 0.62, collar: 0.22, hole: 2.3 };
    // the hole in the shell ([x, y, z] of its middle, its half reaches): a rounded square under the window's own rock, which is whole (see the reveal at the cave); it reaches
    // 2.07 m over the rounded square's head and 1.13 m under its sill, where it stays over the cave's water
    const WIN = new THREE.Vector4(-12.5, (WINO.sill + WINO.head) / 2 + 0.47, WINO.z, 1), WINR = new THREE.Vector3(6, (WINO.head - WINO.sill) / 2 + 1.6, WINO.hz + WINO.hole);
    const CAVE_VERT = /* glsl */`varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vN=normalize(mat3(modelMatrix)*normal+vec3(0.,1e-5,0.)); vC=color; gl_Position=projectionMatrix*viewMatrix*wp; }`;
    const CAVE_FRAG = /* glsl */`varying vec3 vWp; varying vec3 vN; varying vec3 vC; uniform vec4 uWin; uniform vec3 uWinR;
      ${STYLE_GLSL}
      void main(){
        vec3 n=normalize(vN+vec3(0.,1e-5,0.));
        vec3 q=(vWp-uWin.xyz)/uWinR; vec2 q2=q.yz*q.yz; if(vC.b<1.5 && dot(q2,q2)<1. && abs(q.x)<1.) discard;      // the shell is cut (a rounded square); the window's own rock stands in the cut and is whole (its colour's third number is 2)
        float dim=mix(.84,1.,smoothstep(58.,112.,vWp.z));                                             // the shelter is dark; its mouth takes the day
        float wing=smoothstep(4.,7.,vWp.x)*(1.-smoothstep(38.,56.,vWp.z));                             // the port wall at the cave's head, beside and behind the rill: the dark wing, bedded as the flower ledge is
        vec3 col=lcRockD(vWp,normalize(n+uLight*.2),clamp(vC.r,0.,1.7)*dim,max(clamp(vC.g,0.,1.),.85*wing),vec2(1.),vec2(1.,.8*wing));        // the one light: ledges and faces toward the entry catch it; on the wing the thick beds' tops show whole as thin ochre lights and moss lies dark along others
        gl_FragColor=vec4(lcAir(col,vWp),1.);
      }`;
    const caveUni = () => ({ ...S, uWin: { value: WIN }, uWinR: { value: WINR } });
    const caveMat = new THREE.ShaderMaterial({ uniforms: caveUni(), vertexShader: CAVE_VERT, fragmentShader: CAVE_FRAG, vertexColors: true, side: THREE.DoubleSide });

    const joinGeo = (list, names) => {      // indexed geometries with the same attributes, as one
      const g = new THREE.BufferGeometry(); let nv = 0, ni = 0, base = 0, o = 0;      // (typed arrays filled in place: the same geometry in a short build step)
      for (const q of list) { nv += q.attributes.position.count; ni += q.index.count; }
      for (const n of names) { const A = new Float32Array(nv * 3); let k = 0; for (const q of list) { const a = q.attributes[n].array; A.set(a, k); k += a.length; } g.setAttribute(n, new THREE.BufferAttribute(A, 3)); }
      const I = new Uint32Array(ni);
      for (const q of list) { const ix = q.index.array; for (let i = 0; i < ix.length; i++) I[o++] = ix[i] + base; base += q.attributes.position.count; q.dispose(); }
      g.setIndex(new THREE.BufferAttribute(I, 1)); g.computeBoundingSphere(); return g;
    };
    // ---- a grid of land over two lists of x and z, with ledges; quads the rule skips are left out
    const axis = (a, b, step) => { const o = [a]; let v = a; while (v < b) { v += step(v); o.push(Math.min(v, b)); } return o; };
    const landMesh = async (xs, zs, hf, amtF, skip) => {
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), idx = [];
      const hs = new Float32Array(nx * nz), stp = new Float32Array(nx * nz), gx = new Float32Array(nx * nz), gz = new Float32Array(nx * nz);
      for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) hs[j * nx + i] = hf(xs[i], zs[j]); if (j % 6 === 5) await ctx.yield(); }
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const k = (j * nx + i) * 3, x = xs[i], z = zs[j], h = hs[j * nx + i], i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nx - 1), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nz - 1);
          const dhx = (hs[j * nx + i1] - hs[j * nx + i0]) / (xs[i1] - xs[i0]), dhz = (hs[j1 * nx + i] - hs[j0 * nx + i]) / (zs[j1] - zs[j0]), steep = Math.max(Math.abs(dhx), Math.abs(dhz));
          const cliff = sm(1.1, 2.4, steep), a = amtF(x, z, h) * (1 - cliff); stp[j * nx + i] = cliff; gx[j * nx + i] = dhx; gz[j * nx + i] = dhz;
          pos[k] = x; pos[k + 1] = a > 0 ? terr(x, h, z, a) : h; pos[k + 2] = z;
          col[k] = lerp(0.74 + 0.26 * N.n2(x * 0.08 + 5, z * 0.08), 0.87, cliff) - 0.3 * (1 - sm(-1, 5, h)) * (z > 225 ? 1 : 0); col[k + 2] = 1;
        }
        if (j % 24 === 23) await ctx.yield();
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        if (skip && skip((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) continue;
        const a = j * nx + i, b = a + nx; idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setIndex(idx); await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
      const nr = g.attributes.normal.array;
      for (let i = 0; i < nx * nz; i++) if (stp[i] > 0) { const l = Math.hypot(gx[i], 1, gz[i]), w = stp[i], x = lerp(nr[i * 3], -gx[i] / l, w), y = lerp(nr[i * 3 + 1], 1 / l, w), z = lerp(nr[i * 3 + 2], -gz[i] / l, w), m = Math.hypot(x, y, z) || 1; nr[i * 3] = x / m; nr[i * 3 + 1] = y / m; nr[i * 3 + 2] = z / m; }
      for (let i = 0; i < nx * nz; i++) col[i * 3 + 1] = sm(0.72, 0.92, nr[i * 3 + 1]) * (0.8 + 0.2 * N.n2(pos[i * 3] * 0.05, pos[i * 3 + 2] * 0.05 + 8)) * sm(0.5, 3, pos[i * 3 + 1]);   // olive on the tops
      g.computeBoundingSphere();
      return g;
    };
    const NX0 = -270, NX1 = 215, NZ0 = -50, NZ1 = 790;
    const nearAmt = (x, z, h) => {
      if (h < 0.5) return 0.15;
      let a = 0.92;
      if (z < 160) a = lerp(0.12, a, sm(2.2, 6, Math.abs(x - routeAt(z)[0])));      // the brook's own bed lies quiet; its banks are low ledges
      return a;
    };
    const SX0 = -37, SX1 = 31, SZ0 = 103, SZ1 = 164;
    const nearXs = axis(NX0, NX1, (v) => (v > -112 && v < 66 ? 2.6 : v < 126 ? 3.3 : 9)), nearZs = axis(NZ0, NZ1, (v) => (v > 100 && v < 236 ? 2.6 : v > 428 && v < 704 ? 3.9 : 7));
    const nearGeo = await landMesh(nearXs, nearZs,
      (x, z) => H(x, z) - (x > SX0 + 3 && x < SX1 - 3 && z > SZ0 + 3 && z < SZ1 - 3 ? 0.9 : 0), nearAmt,
      (x, z) => Math.hypot(x - POOL[0], z - POOL[1]) < POOL_R - 12 || (x > 118 && z > 262 && z < 436));
    await ctx.yield();
    const shelfGeo = await landMesh(axis(SX0, SX1, () => 1.5), axis(SZ0, SZ1, () => 1.5), H, nearAmt, null);    // the shelf by the brook, modelled finer
    await ctx.yield();
    const nearLand = new THREE.Mesh(nearGeo, rockMat); scene.add(nearLand);      // the land's first mesh: the near land, the shelf and the bench outside the cave's starboard wall as one draw (its geometry is joined below, once the cave's shell says where that wall stands)
    await ctx.yield();
    const farGeo = await landMesh(axis(-2700, 2700, () => 100), axis(-1000, 4400, () => 100),
      (x, z) => H(x, z) - (x > NX0 && x < NX1 && z > NZ0 && z < NZ1 ? 7 : 0), () => 0,
      (x, z) => x > NX0 + 100 && x < NX1 - 100 && z > NZ0 + 100 && z < NZ1 - 100);
    const farLand = new THREE.Mesh(farGeo, rockMat); scene.add(farLand);
    await ctx.yield();

    // ---- THE CAVE, z -26 to 110: one shell seen from inside, bedded and ledged, with one low mouth and one window
    const caveSec = (z) => {
      const r = routeAt(z), fl = Math.pow(sm(60, 110, z), 1.25);
      return { cx: r[0], cy: r[1], ap: lerp(8.6, 34 - r[0], clamp((z - 30) / 80, 0, 1)), as: lerp(8.2, r[0] + 12, fl), up: lerp(14.2 + 1.6 * N.n2(z * 0.045, 4.4), brookY(110) + 18 - r[1], sm(84, 110, z)), dn: 7.2 };
    };
    // the roof's leaning beds: hanging slabs whose under edge is a bedding plane, so each stands across the upper starboard
    // of the view as one soft diagonal falling from upper left to lower right ([z, clear height of the plane over the way])
    const RIBS = [[13.5, 9.2], [20.5, 7.6], [39, 8.6], [49.5, 7.3], [60, 8.8], [85.5, 7.5], [96.5, 9.4]];
    const cavePt = (z, th, out) => {
      const s = caveSec(z), c = Math.cos(th), sn = Math.sin(th), a = c > 0 ? s.ap : s.as, b = sn > 0 ? s.up : s.dn, pw = 2.7;
      let r = 1 / Math.pow(Math.pow(Math.abs(c) / a, pw) + Math.pow(Math.abs(sn) / b, pw), 1 / pw);
      const x0 = s.cx + c * r, y0 = s.cy + sn * r, bb = bedQ(-x0 * SD + y0 * CD), f = bb - Math.floor(bb);
      r *= 1 + 0.13 * (f < 0.72 ? f / 0.72 : (1 - f) / 0.28) - 0.06 + 0.07 * N.n3(x0 * 0.11, y0 * 0.11, z * 0.11);
      const dd = sn * CD - c * SD;
      if (dd > 0.05) for (const rb of RIBS) { const g = sm(rb[0] - 2.5, rb[0] - 0.9, z) * (1 - sm(rb[0] + 0.9, rb[0] + 2.5, z)), rr = rb[1] / dd; if (g > 0 && rr < r) r = lerp(r, rr, g); }
      r *= 0.08 + 0.92 * sm(-27, -9, z);
      out[0] = s.cx + c * r; out[1] = s.cy + sn * r; out[2] = z; return out;
    };
    // the shell as it is meshed (set where the shell is made): a wall's x at a height and a z (starboard, or port) read along its rings; its place by ring share and z; the
    // same x read on its triangles; the wall's face with its hollows filled; the shell's two colour numbers nearest a place, read on its triangles between their
    // corners; the wall's back, its humps filled; whether a place lies inside the cave
    let shellX = null, shellAt = null, shellTri = null, shellEnv = null, shellNear = null, shellBack = null, shellIn = null;
    const caveParts = [];      // the shell and all the cave's own rock built onto it (the mouth's lip, the window's reveal, the hood the rill falls out of): one mesh, one draw
    {
      const nzc = 82, nt = 60, pos = new Float32Array((nzc + 1) * (nt + 1) * 3), col = new Float32Array((nzc + 1) * (nt + 1) * 3), idx = [], t = [0, 0, 0];
      for (let j = 0; j <= nzc; j++) {
        const z = -26 + 136 * Math.pow(j / nzc, 0.94);
        for (let i = 0; i <= nt; i++) {
          const k = (j * (nt + 1) + i) * 3; cavePt(z, (i / nt) * Math.PI * 2, t);
          pos[k] = t[0]; pos[k + 1] = t[1]; pos[k + 2] = t[2];
          col[k] = clamp(0.74 + 0.26 * N.n3(t[0] * 0.2, t[1] * 0.2, z * 0.2) + 0.1 * sm(70, 110, z), 0.3, 1); col[k + 1] = 0.5 * sm(2, -3, t[1] - routeAt(z)[1]) * sm(-0.2, 0.4, N.n2(z * 0.2, t[1] * 0.3)); col[k + 2] = 1;
        }
        if (j % 10 === 9) await ctx.yield();
      }
      for (let j = 0; j < nzc; j++) for (let i = 0; i < nt; i++) { const a = j * (nt + 1) + i, b = a + nt + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
      g.computeVertexNormals();
      const nr = g.attributes.normal.array;      // the normals look into the cave
      for (let i = 0; i < pos.length; i += 3) { const r = routeAt(pos[i + 2]); if (nr[i] * (r[0] - pos[i]) + nr[i + 1] * (r[1] - pos[i + 1]) < 0) { nr[i] = -nr[i]; nr[i + 1] = -nr[i + 1]; nr[i + 2] = -nr[i + 2]; } }
      const zRow = (j) => -26 + 136 * Math.pow(j / nzc, 0.94), rowOf = (z) => { let j = clamp(Math.floor(nzc * Math.pow(clamp((z + 26) / 136, 0, 1), 1 / 0.94)), 0, nzc - 1); while (j > 0 && zRow(j) > z) j--; while (j < nzc - 1 && zRow(j + 1) < z) j++; return j; };
      const rowX = (j, y, port) => {      // one ring of the mesh, from the roof's middle down one side
        for (let q = 0; q < nt / 2; q++) { const i = port ? (nt + nt / 4 - 1 - q) % nt : nt / 4 + q, k = (j * (nt + 1) + i) * 3; if ((pos[k + 1] - y) * (pos[k + 4] - y) <= 0) return lerp(pos[k], pos[k + 3], (y - pos[k + 1]) / ((pos[k + 4] - pos[k + 1]) || 1e-6)); }
        return pos[(j * (nt + 1) + (port ? 0 : nt / 2)) * 3];
      };
      shellX = (y, z, port) => { const j = rowOf(z); return lerp(rowX(j, y, port), rowX(j + 1, y, port), clamp((z - zRow(j)) / (zRow(j + 1) - zRow(j)), 0, 1)); };
      shellAt = (f, z, out) => {      // the meshed shell's place at a share f (0 to nt, any turn) round the ring and a z; past the mouth the last ring stands for it
        const j = rowOf(z), w = clamp((z - zRow(j)) / (zRow(j + 1) - zRow(j)), 0, 1), ff = ((f % nt) + nt) % nt, i = Math.min(Math.floor(ff), nt - 1), u = ff - i, a = (j * (nt + 1) + i) * 3, b = a + (nt + 1) * 3;
        out[0] = lerp(lerp(pos[a], pos[a + 3], u), lerp(pos[b], pos[b + 3], u), w); out[1] = lerp(lerp(pos[a + 1], pos[a + 4], u), lerp(pos[b + 1], pos[b + 4], u), w); out[2] = z; return out;
      };
      const triX = (p, r, q, y, z) => {      // where the line through a height and a z along x meets one triangle of the shell, or nothing
        const ay = pos[p + 1] - y, az = pos[p + 2] - z, by = pos[r + 1] - y, bz = pos[r + 2] - z, cy = pos[q + 1] - y, cz = pos[q + 2] - z, d = (by - ay) * (cz - az) - (bz - az) * (cy - ay); if (Math.abs(d) < 1e-12) return null;
        const u = (ay * (cz - az) - az * (cy - ay)) / -d, v = (az * (by - ay) - ay * (bz - az)) / -d; return u < -1e-9 || v < -1e-9 || u + v > 1 + 1e-9 ? null : pos[p] + u * (pos[r] - pos[p]) + v * (pos[q] - pos[p]);
      };
      shellTri = (y, z, port) => {      // a wall's x on the shell's own triangles (the nearest to the way where the line meets more than one); off the wall's height, the rings' reading
        const j = rowOf(z); let best = null;
        for (let q = 0; q < nt / 2; q++) {
          const i = port ? (nt + nt / 4 - 1 - q) % nt : nt / 4 + q, a = (j * (nt + 1) + i) * 3, b = a + (nt + 1) * 3;
          for (let h = 0; h < 2; h++) { const x = h ? triX(b, a + 3, b + 3, y, z) : triX(a, a + 3, b, y, z); if (x !== null && (best === null || (port ? x < best : x > best))) best = x; }
        }
        return best ?? shellX(y, z, port);
      };
      shellEnv = (y, z, r, port) => {      // the nearest to the way that a wall's triangles stand within r of a place (by height and z): on the circle's rim at sixteen places and wherever an edge of the mesh crosses it, at the middle, and at every corner of the mesh inside it
        let best = shellTri(y, z, port); const take = (x) => { if (port ? x < best : x > best) best = x; };
        for (let a = 0; a < 16; a++) take(shellTri(y + r * Math.sin(a * Math.PI / 8), z + r * Math.cos(a * Math.PI / 8), port));
        for (let j = rowOf(z - r), j1 = Math.min(rowOf(z + r) + 1, nzc); j <= j1; j++) for (let q = 0; q <= nt / 2; q++) {
          const i = port ? (nt + nt / 4 - q) % nt : nt / 4 + q, k = (j * (nt + 1) + i) * 3; if (Math.hypot(pos[k + 1] - y, pos[k + 2] - z) <= r) take(pos[k]);
        }
        const rim = (k, k2) => {      // where one edge of the mesh crosses the circle's rim (a bed's step is an edge: between the rim's sixteen places it would be missed)
          const py = pos[k + 1] - y, pz = pos[k + 2] - z, dy = pos[k2 + 1] - pos[k + 1], dz = pos[k2 + 2] - pos[k + 2], A = dy * dy + dz * dz, B = py * dy + pz * dz, D = B * B - A * (py * py + pz * pz - r * r);
          if (A < 1e-12 || D < 0) return; const s = Math.sqrt(D);
          for (const t of [(-B - s) / A, (-B + s) / A]) if (t > 0 && t < 1) take(pos[k] + t * (pos[k2] - pos[k]));
        };
        for (let j = rowOf(z - r), j1 = rowOf(z + r); j <= j1; j++) for (let q = 0; q < nt / 2; q++) {
          const i = port ? (nt + nt / 4 - 1 - q) % nt : nt / 4 + q, a = (j * (nt + 1) + i) * 3, b = a + (nt + 1) * 3; rim(a, a + 3); rim(a, b); rim(a + 3, b); rim(b, b + 3); rim(a + 3, b + 3);
        }
        return best;
      };
      shellNear = (x, y, z) => {      // the shell's two colour numbers at the place of its triangles nearest to a place, between that triangle's corners
        let best = 1e18, c0 = 0, c1 = 0;
        for (let j = Math.max(rowOf(z - 1), 0), j1 = Math.min(rowOf(z + 1), nzc - 1); j <= j1; j++) for (let i = 0; i < nt; i++) for (let h = 0; h < 2; h++) {
          const a0 = (j * (nt + 1) + i) * 3, b0 = a0 + (nt + 1) * 3, p = h ? b0 : a0, r = a0 + 3, q = h ? b0 + 3 : b0;
          const ex = pos[r] - pos[p], ey = pos[r + 1] - pos[p + 1], ez = pos[r + 2] - pos[p + 2], fx = pos[q] - pos[p], fy = pos[q + 1] - pos[p + 1], fz = pos[q + 2] - pos[p + 2], dx = x - pos[p], dy = y - pos[p + 1], dz = z - pos[p + 2];
          const ee = ex * ex + ey * ey + ez * ez, ef = ex * fx + ey * fy + ez * fz, ff = fx * fx + fy * fy + fz * fz, de = dx * ex + dy * ey + dz * ez, df = dx * fx + dy * fy + dz * fz, den = ee * ff - ef * ef; if (den < 1e-14) continue;
          let u = (de * ff - df * ef) / den, v = (df * ee - de * ef) / den;
          if (u < 0 || v < 0 || u + v > 1) {      // off the triangle: the nearest place of its three edges
            let bd = 1e18, bu = 0, bv = 0; const w = clamp(((dx - ex) * (fx - ex) + (dy - ey) * (fy - ey) + (dz - ez) * (fz - ez)) / (ee + ff - 2 * ef), 0, 1);
            for (const [uu, vv] of [[clamp(de / ee, 0, 1), 0], [0, clamp(df / ff, 0, 1)], [1 - w, w]]) { const d = Math.pow(ex * uu + fx * vv - dx, 2) + Math.pow(ey * uu + fy * vv - dy, 2) + Math.pow(ez * uu + fz * vv - dz, 2); if (d < bd) { bd = d; bu = uu; bv = vv; } }
            u = bu; v = bv;
          }
          const d = Math.pow(ex * u + fx * v - dx, 2) + Math.pow(ey * u + fy * v - dy, 2) + Math.pow(ez * u + fz * v - dz, 2);
          if (d < best) { best = d; c0 = col[p] + u * (col[r] - col[p]) + v * (col[q] - col[p]); c1 = col[p + 1] + u * (col[r + 1] - col[p + 1]) + v * (col[q + 1] - col[p + 1]); }
        }
        return [c0, c1];
      };
      shellBack = (y, z, r, port) => {      // the furthest from the way that a wall's triangles stand within r of a place by height and by z (twenty-five places)
        let best = shellTri(y, z, port);
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a || b) { const x = shellTri(y + a * r / 2, z + b * r / 2, port); if (port ? x > best : x < best) best = x; }
        return best;
      };
      shellIn = (x, y, z) => {      // inside the cave: the level line from a place toward port crosses the shell's triangles an odd number of times
        const j = rowOf(z); let n = 0;
        for (let i = 0; i < nt; i++) { const a = (j * (nt + 1) + i) * 3, b = a + (nt + 1) * 3; for (let h = 0; h < 2; h++) { const xx = h ? triX(b, a + 3, b + 3, y, z) : triX(a, a + 3, b, y, z); if (xx !== null && xx > x) n++; } }
        return n % 2 === 1;
      };
      caveParts.push(g);
    }
    await ctx.yield();
    const hk2 = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7 + 2.9) * 43758.5453; return v - Math.floor(v); };      // a number from 0 to 1 by two indices
    // ---- THE WINDOW'S OUTLINE, in the wall's own plane as [z, height]: a rounded square (WINO) that leans a tenth toward the mouth, carried in and out by swells at two
    // scales, one wave from crest to crest. Six big swells, rock into the opening and air out of it by turns: a nose on the far jamb, the head arched over the half toward
    // the mouth, rock at the upper corner toward the cave's head, air in the near jamb, the sill humped, air in the far jamb's foot; their crests stand 4.6 to 6.4 m
    // apart along the rounded square (their places are shares of its length) and are 0.4 to 0.8 m deep (by the noise at the crest's place). On them twenty-six small
    // swells, in and out by turns, their crests 1.0 to 1.6 m apart (by the crest's index) and 0.08 to 0.2 m deep (the longer the deeper; six tenths of that on the
    // sill), and 0.05 m of the wall's noise. `low`: the outline's lowest height
    const winLine = (() => {
      const NB = 720, cy = (WINO.sill + WINO.head) / 2, hy = (WINO.head - WINO.sill) / 2, bp = [], sb = [0];
      for (let q = 0; q <= NB; q++) {      // the leaning rounded square and its length
        const a = q / NB * 2 * Math.PI, r = Math.pow(Math.pow(Math.abs(Math.cos(a)) / WINO.hz, 3.2) + Math.pow(Math.abs(Math.sin(a)) / hy, 3.2), -1 / 3.2);
        bp.push([WINO.z + r * Math.cos(a) + 0.1 * r * Math.sin(a), cy + r * Math.sin(a)]); if (q) sb.push(sb[q - 1] + Math.hypot(bp[q][0] - bp[q - 1][0], bp[q][1] - bp[q - 1][1]));
      }
      const bn = bp.map((p, q) => { const a = bp[(q + NB - 1) % NB], b = bp[(q + 1) % NB], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]; });      // the way out of the opening
      const per = sb[NB], at = (s) => { let q = 0; while (q < NB - 1 && sb[q] < s) q++; return q; };
      const BIG = [[2.2, -0.6], [7.7, 0.62], [12.6, -0.52], [19.5, 0.5], [26.2, -0.45], [33, 0.5]].map((b) => {      // [where along the outline (of 37 parts, from the far jamb's middle over the head), how far out of the opening (rock: under nothing)]
        const s = b[0] * per / 37, p = bp[at(s)]; return [s, Math.sign(b[1]) * clamp(Math.abs(b[1]) * (1 + 0.35 * N.n2(p[0] * 0.31 + 1.7, p[1] * 0.31 + 4.1)), 0.4, 0.8)];
      });
      const SML = []; let acc = 0;
      for (let k = 0; acc < per; k++) { const h = 1 + 0.6 * hk2(k, 53); SML.push([acc, 0, h]); acc += h; }
      if (SML.length % 2) acc -= SML.pop()[2];
      SML.forEach((b, k) => {
        b[0] *= per / acc; b[2] *= per / acc; const hm = Math.min(b[2], SML[(k + SML.length - 1) % SML.length][2] * (k ? 1 : per / acc));
        b[1] = (k % 2 ? 1 : -1) * Math.min(0.2, 0.09 * hm * hm) * (0.86 + 0.14 * hk2(k, 59)) * (bn[at(b[0])][1] < -0.6 ? 0.6 : 1);
      });
      const wave = (K, s) => {      // from crest to crest round the closed outline
        const n = K.length; let k = 0; while (k < n - 1 && s >= K[k + 1][0]) k++; if (s < K[0][0]) k = n - 1;
        const a = K[k], b = K[(k + 1) % n], span = ((b[0] - a[0]) % per + per) % per || per; return lerp(a[1], b[1], (1 - Math.cos(Math.PI * clamp((((s - a[0]) % per + per) % per) / span, 0, 1))) / 2);
      };
      const off = [], line = []; let low = 1e9;
      for (let q = 0; q < NB; q++) { const o = wave(BIG, sb[q]) + wave(SML, sb[q]) + 0.05 * N.n2(bp[q][0] * 0.5 + 2, bp[q][1] * 0.5); off.push(o); line.push([bp[q][0] + bn[q][0] * o, bp[q][1] + bn[q][1] * o]); low = Math.min(low, line[q][1]); }
      return { NB, bp, bn, off, line, low };
    })();
    await ctx.yield();
    // ---- THE BENCH outside the cave's starboard wall: the headland's shelf carried back along the wall, ground that runs on toward the country outside the mouth.
    // Its mesh reaches from z 58.4 to z 113. At z 58.4 it stands up out of the land in one upright face (its first two rows lie 0.001 m apart: the lower 0.3 m under
    // the land's mesh, see `under`; the upper at the bench's height); from there on its top lies by the shelf's own rule (brookY + 1.3 and the shelf's noise). Its
    // inner edge follows `lims`, a line 0.35 m outside the shell's outermost place near each row, and goes on past it in under the wall's overhang wherever the
    // wall's foot stands back further (see `inB`); by the wall, where the window is not, the bench lies low: from 1.6 m outside `lims` it comes down to its least
    // height over the water at 0.2 m. From z 107.85 on a cell is built only where it lies 1.4 m and more outside `lims` as taken at the cell's middle (the lesser of its two rows'), so the edge keeps 1.4 to 1.95 m outside THAT; against a row's own `lims` the edge lies 1.4 to 2.0 m outside it on the rows z 110 to 113 (never under 1.4 by that rule) and, on the row z 107.85 (which the cells before it share), up to 0.8 m inside it (the water sheet's starboard edge lies 0.9 to 1.5 m further out there, under the bench). So the edge is under
    // the wall's overhang or the window's rock for most of its length and never inside the cave. Outward the bench goes to 6.5 m and more past the headland's
    // starboard edge (H's edgeS); from 5 m past that edge it lies 0.3 m under the land's mesh, and so does its whole first row: the border goes into the land there
    // (as built on seeds 1 to 40 the outer edge lies 11 m and more under the land, the far end at z 113 0.7 m and more under the upper of the land's sheets there). Within 6 m of `lims` it lies quiet, further out it steps in the land's own ledges.
    // Beside the window, out to 5.6 m from `lims` (2 m and more outside the wall's outer side), it lies 1.1 to 1.3 m under the lowest point of the window's outline
    // (1.03 m at the least, where the water under it wants it higher). Within 4.5 m of `lims` (taken there as the lesser of the two rows' about a place; the brook's water sheet reaches at most 1.33 m past that under the bench on seeds 1 to 40, and at most 1.45 m past a row's own `lims`) it lies 0.3 m or
    // more over the water as it stands 2.5 m further up the brook. From z 110 on it lies 0.6 m or more under the land as H and the land's ledges have it. H is not
    // changed: the bench is a mesh of its own in the land's draw, of the corners that its triangles use and no others
    {
      const BX0 = -46, BX1 = -6.4, BZ0 = 58.4, BZ1 = 113, zw0 = WINO.z - WINO.hz, zw1 = WINO.z + WINO.hz;
      const xsB = axis(BX0, BX1, (v) => (v < -15.6 ? 2.4 : 0.55)), zsB = [BZ0, ...Array.from({ length: 25 }, (_, i) => (i < 24 ? BZ0 + (i ? 2.15 * i : 0.001) : 110)), 111.5, BZ1];
      const edge = (z) => -26 - 8 * sm(60, 130, z) + 6 * N.n2(z * 0.03, 7.7);      // H's edgeS
      const lims = zsB.map((z) => { let m = 1e9; for (const dz of [-2.2, -1.1, 0, 1.1, 2.2]) for (const dy of [1.0, 1.9, 2.8]) m = Math.min(m, shellX(brookY(z) + dy, Math.min(z + dz, 110))); return m - 0.35; });      // `lims`, the line the bench's inner edge follows, row by row
      const lim = (z) => { let j = 0; while (j < zsB.length - 2 && zsB[j + 1] < z) j++; return Math.min(lims[j], lims[j + 1]); };
      const cellOf = (A, v) => { let i = 0; while (i < A.length - 2 && A[i + 1] <= v) i++; return i; };
      const under = (x, z) => {      // 0.3 m under the lowest corner of every cell of the near land's mesh that lies within 2.4 m of the place along x or 2.2 m along z
        const P = nearGeo.attributes.position.array, i0 = cellOf(nearXs, x - 2.4), i1 = cellOf(nearXs, x + 2.4) + 1, j0 = cellOf(nearZs, z - 2.2), j1 = cellOf(nearZs, z + 2.2) + 1; let m = 1e9;
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) m = Math.min(m, P[(j * nearXs.length + i) * 3 + 1]);
        return m - 0.3;
      };
      const benchH = (x, z) => {
        if (z < BZ0 + 0.0005) return under(x, z);
        const d = lim(z) - x, top = brookY(z) + 1.3 + 1.2 * N.n2(x * 0.06 + 9, z * 0.06), eS = edge(z), w = sm(eS - 5, eS, x);
        let h = w < 1 ? lerp(under(x, z), top, w) : top;
        const wz = sm(zw0 - 5.5, zw0 - 3, z) * (1 - sm(zw1 + 3, zw1 + 5.5, z));
        h = lerp(h, clamp(h, winLine.low - 1.3, winLine.low - 1.1), (1 - sm(5.6, 7.2, d)) * wz);
        h = lerp(h, Math.max(h, brookY(z - 2.5) + 0.3), 1 - sm(4.5, 6, d));
        h = lerp(h, brookY(z - 2.5) + 0.3, (1 - sm(0.2, 1.6, d)) * (1 - wz));      // by the wall it lies low, at that least height over the water, where the wall's foot stands furthest back under its overhang
        if (z > 109.9) for (const dx of [-2.4, -1.2, 0, 1.2, 2.4]) for (const dz of [-1.5, -0.75, 0, 0.75, 1.5]) { const hl = H(x + dx, z + dz); h = Math.min(h, hl - 0.6, terr(x + dx, hl, z + dz, nearAmt(x + dx, z + dz, hl)) - 0.6); }      // under the land as it lies there and as its ledges step it, a cell round
        return h;
      };
      // the bench's inner edge, row by row: from the grid's last column outside `lims` (of the row and its two neighbours) it goes on in under the wall's overhang, column by
      // column (eight at most), as long as the bench's own top at the next column, 0.4 m over and under it and 0.8 and 1.6 m up and down the brook, lies 0.45 m or more outside the cave
      const inB = zsB.map((z, j) => {
        let i = 0; const l0 = Math.min(lims[Math.max(j - 1, 0)], lims[j], lims[Math.min(j + 1, zsB.length - 1)]); while (i < xsB.length - 2 && xsB[i + 1] <= l0) i++;
        if (z > 107.9) return xsB[i];
        const zr = Math.max(z, BZ0 + 0.001), safe = (x) => { const h = benchH(x, zr); for (const dz of [-1.6, -0.8, 0, 0.8, 1.6]) for (const dh of [-0.4, 0, 0.4]) if (shellIn(x + 0.45, h + dh, clamp(zr + dz, BZ0 - 1.6, 109.9))) return false; return true; };
        for (let q = 0; q < 8 && i < xsB.length - 2 && safe(xsB[i + 1]); q++) i++;
        return xsB[i];
      });
      await ctx.yield();
      const skipB = (x, z) => { const xi = xsB.find((v) => v > x); let j = 0; while (j < zsB.length - 2 && zsB[j + 1] < z) j++; return (z > 107.9 ? xi > lim(z) - 1.4 : xi > Math.min(inB[j], inB[j + 1])) || xi < edge(z) - 6.5; };
      // the grid's corners: 2 where a cell that is built uses the corner, 1 where only such a corner's neighbour in its row or its column is one (its height is wanted for that
      // corner's slope, no more), 0 elsewhere: those are neither reckoned nor carried
      const nxB = xsB.length, nzB = zsB.length, useB = new Uint8Array(nxB * nzB), xiB = new Map(xsB.map((v, i) => [v, i])), ziB = new Map(zsB.map((v, j) => [v, j]));
      for (let j = 0; j < nzB - 1; j++) for (let i = 0; i < nxB - 1; i++) if (!skipB((xsB[i] + xsB[i + 1]) / 2, (zsB[j] + zsB[j + 1]) / 2)) for (const k of [j * nxB + i, j * nxB + i + 1, (j + 1) * nxB + i, (j + 1) * nxB + i + 1]) useB[k] = 2;
      for (let j = 0; j < nzB; j++) for (let i = 0; i < nxB; i++) if (useB[j * nxB + i] === 2) for (const k of [j * nxB + Math.max(i - 1, 0), j * nxB + Math.min(i + 1, nxB - 1), Math.max(j - 1, 0) * nxB + i, Math.min(j + 1, nzB - 1) * nxB + i]) if (!useB[k]) useB[k] = 1;
      const usedB = (x, z) => useB[ziB.get(z) * nxB + xiB.get(x)];
      const benchAll = await landMesh(xsB, zsB, (x, z) => (usedB(x, z) ? benchH(x, z) : 0), (x, z, h) => (z > 109.9 || usedB(x, z) < 2 ? 0 : nearAmt(x, z, h) * sm(6, 9.5, lim(z) - x)), skipB);
      await ctx.yield();
      const benchGeo = new THREE.BufferGeometry();
      {      // the corners that a triangle uses, and no others
        const I = benchAll.index.array, nv = benchAll.attributes.position.count, to = new Int32Array(nv).fill(-1); let m = 0;
        for (let k = 0; k < I.length; k++) if (to[I[k]] < 0) to[I[k]] = m++;
        for (const name of ['position', 'normal', 'color']) { const src = benchAll.attributes[name].array, dst = new Float32Array(m * 3); for (let v = 0; v < nv; v++) if (to[v] >= 0) for (let c = 0; c < 3; c++) dst[to[v] * 3 + c] = src[v * 3 + c]; benchGeo.setAttribute(name, new THREE.BufferAttribute(dst, 3)); }
        benchGeo.setIndex(Array.from(I, (v) => to[v])); benchAll.dispose();
      }
      await ctx.yield();
      nearLand.geometry = joinGeo([nearGeo, shelfGeo, benchGeo], ['position', 'normal', 'color']);
    }
    await ctx.yield();
    // a smooth skin of the cave's own rock over rows of places [x, y, z, k, moss, c, g]: the shell's own tone (k times it: rock that takes the day is lighter) and the
    // shell's own moss unless one is given; where c is given ([tone, moss, share]) the two colour numbers go that share of the way to c's (a skin's border takes the
    // shell's own numbers so); its normals from its own lie, all turned to the side on which `probe` ([row, column, x, y, z]: a place on the skin and the way its open
    // air lies there) has them; a place's g, where given, stands for the place when the next row's normals are taken; `wrap` closes each row into a ring; `cut` is the
    // colour's third number (2: the window's cut leaves this rock whole); with `faces` the normals are taken from the triangles as parted (see below)
    const caveSkin = (rows, wrap, cut, probe, faces) => {
      const m = rows[0].length, n = rows.length, P = new Float32Array(n * m * 3), Nn = new Float32Array(n * m * 3), C = new Float32Array(n * m * 3), I = [];
      const raw = (j, i, k) => {
        const a = rows[j][wrap ? (i + m - 1) % m : Math.max(i - 1, 0)], b = rows[j][wrap ? (i + 1) % m : Math.min(i + 1, m - 1)], c0 = rows[Math.max(j - 1, 0)][i], c = j > 0 && c0[6] ? c0[6] : c0, d = rows[Math.min(j + 1, n - 1)][i];
        Nn[k] = (b[1] - a[1]) * (d[2] - c[2]) - (b[2] - a[2]) * (d[1] - c[1]); Nn[k + 1] = (b[2] - a[2]) * (d[0] - c[0]) - (b[0] - a[0]) * (d[2] - c[2]); Nn[k + 2] = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
      };
      raw(probe[0], probe[1], 0); const sg = Nn[0] * probe[2] + Nn[1] * probe[3] + Nn[2] * probe[4] < 0 ? -1 : 1;
      for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) {
        const q = rows[j][i], k = (j * m + i) * 3; raw(j, i, k);
        const l = (Math.hypot(Nn[k], Nn[k + 1], Nn[k + 2]) || 1) * sg; Nn[k] /= l; Nn[k + 1] /= l; Nn[k + 2] /= l; P[k] = q[0]; P[k + 1] = q[1]; P[k + 2] = q[2];
        C[k] = clamp(0.74 + 0.26 * N.n3(q[0] * 0.2, q[1] * 0.2, q[2] * 0.2) + 0.1 * sm(70, 110, q[2]), 0.3, 1) * (q[3] ?? 1);
        C[k + 1] = q[4] ?? 0.5 * sm(2, -3, q[1] - routeAt(q[2])[1]) * sm(-0.2, 0.4, N.n2(q[2] * 0.2, q[1] * 0.3)); C[k + 2] = cut;
        if (q[5]) { C[k] = lerp(C[k], q[5][0], q[5][2]); C[k + 1] = lerp(C[k + 1], q[5][1], q[5][2]); }
      }
      const agree = (p, q, r) => {      // how a triangle's own lie agrees with the normals of its three corners (the least of the three; under nothing: it is folded against one)
        const ux = P[q * 3] - P[p * 3], uy = P[q * 3 + 1] - P[p * 3 + 1], uz = P[q * 3 + 2] - P[p * 3 + 2], vx = P[r * 3] - P[p * 3], vy = P[r * 3 + 1] - P[p * 3 + 1], vz = P[r * 3 + 2] - P[p * 3 + 2];
        const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = (Math.hypot(x, y, z) || 1e-9) * sg;
        return Math.min(x * Nn[p * 3] + y * Nn[p * 3 + 1] + z * Nn[p * 3 + 2], x * Nn[q * 3] + y * Nn[q * 3 + 1] + z * Nn[q * 3 + 2], x * Nn[r * 3] + y * Nn[r * 3 + 1] + z * Nn[r * 3 + 2]) / l;
      };
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < (wrap ? m : m - 1); i++) {      // each quad as two triangles, parted the other way where the first way would fold one or nearly and the other lies better
        const a = j * m + i, a1 = j * m + (i + 1) % m, b = a + m, b1 = a1 + m;
        if (Math.min(agree(a, a1, b), agree(b, a1, b1)) < 0.1 && Math.min(agree(a, a1, b1), agree(a, b1, b)) > Math.min(agree(a, a1, b), agree(b, a1, b1))) I.push(a, a1, b1, a, b1, b); else I.push(a, a1, b, b, a1, b1);
      }
      if (faces) {      // each corner's normal from the triangles that meet at it, the larger the weightier; then every quad whose parting lies badly with those normals is parted the other way where that lies better, and the normals are taken again
        const F = new Float32Array(n * m * 3), N0 = Nn.slice();
        const fromFaces = () => {
          F.fill(0);
          for (let t = 0; t < I.length; t += 3) {
            const p = I[t] * 3, q = I[t + 1] * 3, r = I[t + 2] * 3, ux = P[q] - P[p], uy = P[q + 1] - P[p + 1], uz = P[q + 2] - P[p + 2], vx = P[r] - P[p], vy = P[r + 1] - P[p + 1], vz = P[r + 2] - P[p + 2];
            let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; if ((x * (N0[p] + N0[q] + N0[r]) + y * (N0[p + 1] + N0[q + 1] + N0[r + 1]) + z * (N0[p + 2] + N0[q + 2] + N0[r + 2])) < 0) { x = -x; y = -y; z = -z; }
            for (const k of [p, q, r]) { F[k] += x; F[k + 1] += y; F[k + 2] += z; }
          }
          for (let k = 0; k < F.length; k += 3) { const l = Math.hypot(F[k], F[k + 1], F[k + 2]); if (l > 1e-9) { Nn[k] = F[k] / l; Nn[k + 1] = F[k + 1] / l; Nn[k + 2] = F[k + 2] / l; } }
        };
        fromFaces();
        for (let pass = 0; pass < 2; pass++) {
          let turned = 0;
          for (let t = 0; t < I.length; t += 6) {
            const a = I[t], a1 = I[t + 1], other = I[t + 2] !== I[t + 3], b = other ? I[t + 5] : I[t + 2], b1 = other ? I[t + 2] : I[t + 5];      // (the quad's corners, whichever way it is parted now)
            const now = other ? Math.min(agree(a, a1, b1), agree(a, b1, b)) : Math.min(agree(a, a1, b), agree(b, a1, b1)), alt = other ? Math.min(agree(a, a1, b), agree(b, a1, b1)) : Math.min(agree(a, a1, b1), agree(a, b1, b));
            if (now < 0.1 && alt > now) { if (other) { I[t + 2] = b; I[t + 3] = b; I[t + 4] = a1; I[t + 5] = b1; } else { I[t + 2] = b1; I[t + 3] = a; I[t + 4] = b1; I[t + 5] = b; } turned++; }
          }
          if (!turned) break; fromFaces();
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(I); return g;
    };
    // ---- THE MOUTH'S LIP, z 104.4 to 111.6: the cave's own wall continued. Over its last metres the shell's surface (as it is meshed, with its swelling beds)
    // turns in toward the opening, ends in a thick rounded rim and goes back out and behind the shell's end, so the rock shows a thickness there; it is a
    // skin, open at its back. Its outline is broken by the world's own beds: each bed (the rock between two neighbouring planes of bedQ where they cross the mouth's outline:
    // from a single step up to 17.8 m of outline, as the dip meets the outline's lie; past the port corner two beds more, 17.1 to 21.1 m and 3.7 to 6.1 m; seeds 1 to 40) reaches in by its own amount (as built 0.39 to 2.10 m at the roof, at most 1.56 m at a wall, less where the
    // opening is low, nothing at the water and on the port bank, and coming down to nothing over the last 1.8 m of the outline at its port end), has its crest at
    // its own z (107.7 to 109.6) and its end at its own z (110.4 to 111.4), and rounds into its neighbours over half a metre. The long beds of the roof's port
    // side swell in lobes along their length (see the columns). The numbers of a bed and of a lobe come from their own indices (golden steps: no two neighbours
    // alike), never from a draw. The rim is lighter where it turns to the day: the wall's tone on the way in, 1.3 times at the crest, 1.5 times where it faces out.
    // Each column begins outside the cave, behind the shell, and over the first 0.8 m of its run (as meshed: by its second or third place, 0.8 to 1.6 m on) its two colour numbers go over from the shell's own at its place to the skin's.
    // Most of that run lies behind the shell (on seeds 1 to 40 the lip comes out of the shell 0.3 m and more from its border, on one column in thirty within that run), so where the skin comes into the open two columns in three have the skin's own tone alone and the rest a share of the shell's with it (over half on 17 columns of 3,233, 76 per cent at the most): a step of tone can stand there
    {
      const NT = 60, NS = 480, NE = NS + 48, FA = 37.6, FB = 0.3, t = [0, 0, 0], wy = brookY(110), rc = routeAt(110), fr = (v) => v - Math.floor(v);
      const ringP = [], ringN = []; for (let i = 0; i < NT; i++) { shellAt(i, 110, t); ringP.push([t[0], t[1]]); }
      for (let i = 0; i < NT; i++) {      // the way in from the outline, from the outline's lie over four of the mesh's steps (the beds' swellings do not turn it)
        const a = ringP[(i + NT - 2) % NT], b = ringP[(i + 2) % NT], p = ringP[i]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = (Math.hypot(nx, ny) || 1) * (nx * (rc[0] - p[0]) + ny * (rc[1] - p[1]) < 0 ? -1 : 1); ringN.push([nx / l, ny / l]);
      }
      const nIn = (f) => { const ff = ((f % NT) + NT) % NT, i = Math.floor(ff) % NT, u = ff - Math.floor(ff), a = ringN[i], b = ringN[(i + 1) % NT], x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
      const clear = (p, n) => {      // how far the opening goes on from a place on its outline, straight in
        let m = 60; for (let i = 0; i < NT; i++) { const a = ringP[i], b = ringP[(i + 1) % NT], ex = b[0] - a[0], ey = b[1] - a[1], den = n[0] * ey - n[1] * ex; if (Math.abs(den) < 1e-6) continue; const tt = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den, uu = ((a[0] - p[0]) * n[1] - (a[1] - p[1]) * n[0]) / den; if (tt > 0.5 && uu >= 0 && uu <= 1) m = Math.min(m, tt); } return m;
      };
      // the outline in fine steps from under the starboard water line over the roof to the port corner (step NS) and on round that corner, down the shell's port end to under
      // the land (step NE; the steps past the corner are counted as beds of their own): each step's bed and its length along the outline
      const smp = []; let arc = 0, px = 0, py = 0;
      for (let k = 0; k <= NE; k++) { const f = lerp(FA, FB, k / NS); shellAt(f, 110, t); if (k) arc += Math.hypot(t[0] - px, t[1] - py); px = t[0]; py = t[1]; smp.push({ f, s: arc, x: t[0], bed: Math.floor(bedQ(-t[0] * SD + t[1] * CD)) + (k > NS ? 1000 : 0) }); }
      await ctx.yield();
      const cols = [];
      for (let k0 = 0; k0 <= NE;) {
        let k1 = k0; while (k1 < NE && smp[k1 + 1].bed === smp[k0].bed) k1++;
        const s0 = smp[k0].s, len = smp[k1].s - s0, n = smp[k0].bed, g1 = fr(n * 0.618034 + 0.27), g2 = fr(n * 0.754878 + 0.61), g3 = fr(n * 0.56984 + 0.13);
        const ze = 110.3 + 1.2 * g2, zc = ze - 0.9 - (ze - 0.9 - 107.6) * g3, rho = 0.45 + 0.4 * fr(n * 0.3247 + 0.4);
        // a bed that begins more than 10 m to port of the way swells in lobes along its length: between knots 1.1 to 1.9 m apart (lengths and shares by the knot's
        // index) its reach is the bed's own less up to 45 % of it where that is 2 m, up to 75 % where it is 0.67 m or less; its columns stand evenly, at most 0.8 m
        // apart (1.6 m past the port corner), all running in from z 104.4
        const port = smp[k0].x > rc[0] + 10, kn = [], at = []; let ka = 0;
        if (port) { for (let j = 0; ka < len + 1.9; j++) { kn.push([ka, fr(j * 0.618034 + n * 0.29 + 0.15)]); ka += 1.1 + 0.8 * fr(j * 0.754878 + n * 0.37 + 0.4); } const nq = Math.max(1, Math.ceil(len / (k0 > NS ? 1.6 : 0.8))); for (let q = 0; q < nq; q++) at.push(len * (q + 0.5) / nq); }
        else if (len < 0.7) at.push(len / 2);
        else { const inner = Math.max(1, Math.ceil((len - 0.9) / 1.35)); at.push(0.12); if (len > 1.8) for (let q = 0; q <= inner; q++) at.push(0.45 + (len - 0.9) * q / inner); at.push(len - 0.12); }
        for (const sa of at) {
          let k = k0; while (k < k1 && smp[k + 1].s - s0 < sa) k++;
          const f = k < NE ? lerp(smp[k].f, smp[k + 1].f, clamp((s0 + sa - smp[k].s) / ((smp[k + 1].s - smp[k].s) || 1e-6), 0, 1)) : smp[k].f, n2 = nIn(f); shellAt(f, 110, t);
          let gl = 1; if (port) { let j = 0; while (kn[j + 1][0] < sa) j++; gl = lerp(kn[j][1], kn[j + 1][1], sm(0.2, 0.8, (sa - kn[j][0]) / (kn[j + 1][0] - kn[j][0]))); }      // 0 to 1: how much of its swing the lobe holds back here
          const lim = lerp(1.8, 2.6, sm(0.35, 0.8, -n2[1])) * sm(wy + 0.2, wy + 2.6, t[1]) * (1 - sm(0.25, 0.7, n2[1]));
          const d0 = Math.min(lim * (0.25 + 0.75 * g1) * (0.8 + 0.2 * sm(0, 0.45, sa) * sm(0, 0.45, len - sa)), 0.28 * clear(t, n2)), d = d0 * (port ? 1 - (1 - gl) * Math.min(0.75, 0.3 + 0.3 / Math.max(d0, 0.1)) : 1) * sm(0, 1.8, smp[NS].s - s0 - sa);
          cols.push({ f, n: n2, d: d - 0.1 * (1 - sm(0.1, 0.4, d)), zc, ze, rho, run: port ? zc - 104.4 : 2.4 + 1.1 * d });
        }
        k0 = k1 + 1;
      }
      await ctx.yield();
      // each column's section: out of the shell and in to the crest, round the rim to the bed's end, out again behind the shell's end and back
      const SEC = cols.map((c) => {
        const o = [], put = (z, w, k, d) => { shellAt(c.f, z, t); const q = [t[0] + c.n[0] * w, t[1] + c.n[1] * w, z, k]; if (d !== undefined && d < 0.8) q[5] = [0, 0, 1 - sm(0.1, 0.8, d)]; o.push(q); };
        for (const s of [0, 0.3, 0.55, 0.78, 1]) put(c.zc - c.run * (1 - s), -0.4 + (c.d + 0.4) * (0.3 * s + 0.7 * s * s * (3 - 2 * s)), 1 + 0.3 * Math.pow(clamp((s - 0.55) / 0.45, 0, 1), 1.6), c.run * s);      // (over the first 0.8 m from its border the skin's two colour numbers go over from the shell's own at its place)
        for (let q = 0; q < 8 && shellIn(o[0][0] + 0.3 * c.n[0], o[0][1] + 0.3 * c.n[1], o[0][2]); q++) { o[0][0] -= 0.15 * c.n[0]; o[0][1] -= 0.15 * c.n[1]; }
        for (const a of [0.61, 1.22]) put(c.zc + (c.ze - c.zc) * Math.sin(a), c.d - c.rho * (1 - Math.cos(a)), 1.3 + 0.2 * Math.sin(a));      // the rim takes the day as it turns to face out of the cave: 1.3 at the crest, 1.5 at the bed's end
        put(c.ze, c.d - c.rho, 1.5); put(c.ze + 0.12, c.d - c.rho - 0.9, 1.5); put(c.ze - 0.9, c.d - c.rho - 1.3, 1.4);
        return o;
      });
      // each section's first place lies outside the cave (above); where the shell's triangles still leave the line between two neighbours' first places inside it, both go further out
      for (let q = 0; q < 8; q++) {
        let any = false;
        for (let k = 0; k + 1 < SEC.length; k++) {
          const a = SEC[k][0], b = SEC[k + 1][0], na = cols[k].n, nb = cols[k + 1].n;
          if (![0.25, 0.5, 0.75].some((u) => shellIn(lerp(a[0], b[0], u) + 0.15 * (na[0] + nb[0]), lerp(a[1], b[1], u) + 0.15 * (na[1] + nb[1]), lerp(a[2], b[2], u)))) continue;
          a[0] -= 0.15 * na[0]; a[1] -= 0.15 * na[1]; b[0] -= 0.15 * nb[0]; b[1] -= 0.15 * nb[1]; any = true;
        }
        if (!any) break;
      }
      await ctx.yield();
      { let read = 0; for (const o of SEC) for (const q of o) if (q[5]) { const sc = shellNear(q[0], q[1], q[2]); q[5][0] = sc[0]; q[5][1] = sc[1]; if (++read % 8 === 0) await ctx.yield(); } }      // (about a hundred readings of the shell, the first of them a millisecond each in a cold run, the later ones a tenth: the hand goes back at every eighth)
      await ctx.yield();
      const mid = Math.floor(cols.length / 2);
      caveParts.push(caveSkin(SEC[0].map((_, j) => SEC.map((o) => o[j])), false, 1, [4, mid, cols[mid].n[0], cols[mid].n[1], 0]));
    }
    await ctx.yield();
    // ---- THE WINDOW'S REVEAL: one skin of the cave's rock in fourteen rows round the opening, a column at every 0.44 m of the outline (winLine) or less. The wall's own
    // face (the nearest to the way that the shell stands round a place: see where the rows' x is set) stands in toward the cave as a collar round the breach: 0.15 m
    // proud at the skin's border, which lies 0.35 m or more past the shell's hole along the outline's way out (0.29 m or more from it, measured straight), and
    // WINO.collar proud from 0.4 m further in. Outside the border the skin goes in behind the shell: its outermost row stands 0.5 m further out along that way,
    // 0.45 m or more behind the border row and 0.15 m or more behind the furthest back that the shell's triangles stand round its own place (see that row below).
    // At the border the skin's two colour numbers are the shell's own at the place; they go over to the skin's own within a metre of it. From 1.2 to 1.4 m outside the outline the face turns
    // outward in a broad roll, a quarter of an ellipse: at the outline it has gone WINO.roll into the wall, a hand further on it has turned wholly, a metre in. It runs
    // on through the wall, which is WINO.thick thick from the collar's face, give or take 0.2 m by the wall's noise, rounds over the last 0.45 m at the outer edge and
    // ends on the wall's outer side, 0.8 m from the breach. Through the wall the head's under side goes down outward by 0.3 to the metre, the sill's
    // top by 0.08, and the breach is splayed: at the outer edge a jamb stands 0.3 m further out toward the cave's head, 0.6 m toward the mouth below height 89.5 (coming
    // to nothing by height 94: the head's outer edge runs into that jamb's in one curve). In the upper corner toward the cave's head the rock through the wall stands
    // further into the breach the deeper it lies: up to 0.3 m toward the mouth at the outer edge (the whole before z 69 and over height 93, nothing from z 76 on
    // and under height 86.5). Seen square on, the opening's outline as meshed keeps a radius of 0.6 m and more. The rock is brown as the
    // wall is and a little lighter the nearer the day it lies: the wall's own tone on the wall's face, 1.1 times at the outline, 1.3 times at the outer edge; the sill
    // carries a little moss
    {
      const { NB, bp, bn, off, line } = winLine, sf = [0], P = WINO.collar;
      for (let q = 1; q <= NB; q++) sf.push(sf[q - 1] + Math.hypot(line[q % NB][0] - line[q - 1][0], line[q % NB][1] - line[q - 1][1]));
      const env = (y, z) => shellEnv(y, z, 0.45);
      const m = Math.ceil(sf[NB] / 0.44), rows = Array.from({ length: 14 }, () => []), ROLL = [[1, 1], [0.72, 1], [0.46, 1], [0.24, 1.04], [0.05, 1.1]];      // the roll's rows: [share of its length still to go to its end, tone]
      for (let i = 0, q = 0; i < m; i++) {
        const s = sf[NB] * i / m; while (q < NB - 1 && sf[q + 1] < s) q++;
        const u = (s - sf[q]) / ((sf[q + 1] - sf[q]) || 1e-6), q1 = (q + 1) % NB, bz = lerp(bp[q][0], bp[q + 1][0], u), by = lerp(bp[q][1], bp[q + 1][1], u), o = lerp(off[q], off[q1], u);
        let nz = lerp(bn[q][0], bn[q1][0], u), ny = lerp(bn[q][1], bn[q1][1], u); const nl = Math.hypot(nz, ny); nz /= nl; ny /= nl;
        const g = 0.19 + 0.11 * ny, L = 1.36 + 0.1 * N.n2(bz * 0.3 + 4, by * 0.3), T = WINO.thick - P + 0.2 * N.n2(bz * 0.25, by * 0.25 + 5), moss = 0.35 * sm(0.4, 0.8, -ny);
        const cutAt = (t) => { const a = (by + ny * t + g * WINO.roll - WIN.y) / WINR.y, b = (bz + nz * t - WIN.z) / WINR.z; return a * a * a * a + b * b * b * b; };      // the shader's own measure of the hole (it cuts under 1)
        let t0 = 0, t1 = 8; for (let c = 0; c < 24; c++) { const tm = (t0 + t1) / 2; if (cutAt(tm) < 1) t0 = tm; else t1 = tm; }
        const tb = Math.max(t1 + 0.35, o + L + 0.5), tE = o - 0.05 * L;      // the border; the roll's end
        const at = (t, e, k, ms) => [-e, by + ny * t + g * (WINO.roll - e), bz + nz * t, k, ms];      // a place on the wall's face or the roll: so far outside the rounded square, so deep in the wall (its x is set from the wall's face below)
        const xo = env(by + ny * tE + g * WINO.roll, bz + nz * tE), hw = 0.3 * sm(76, 69, bz) * sm(86.5, 93, by), thru = (dt, e, k) => { const sh = clamp((e - 1) / (T - 1), 0, 1), ts = tE + dt + (nz > 0 ? 0.6 * sm(94, 89.5, by) : 0.3) * nz * nz * sh; return [xo - e, by + ny * ts + g * (WINO.roll - e), bz + nz * ts + hw * sh, k, moss]; };
        const bd = (p, d) => { p[5] = [0, 0, 1 - sm(0.1, 1, d)]; return p; };      // (how far from the border a place lies: there the skin takes the wall's own two colour numbers, see below)
        rows[0].push(bd([0, by + ny * (tb + 0.5) + g * WINO.roll, bz + nz * (tb + 0.5), 1], 0)); rows[1].push(bd(at(tb, -0.15, 1), 0)); rows[2].push(bd(at(tb - 0.4, -P, 1), 0.4));
        ROLL.forEach((r, j) => rows[3 + j].push(bd(at(tE + r[0] * L, (1 + P) * (1 - Math.sqrt(1 - (1 - r[0]) * (1 - r[0]))) - P, r[1], j > 2 ? moss * (j - 2) / 2 : undefined), tb - tE - r[0] * L)));
        rows[8].push(thru(0, 1, 1.14)); rows[9].push(thru(0, (T + 0.55) / 2, 1.2)); rows[10].push(thru(0, T - 0.45, 1.26)); rows[11].push(thru(0.13, T - 0.13, 1.3)); rows[12].push(thru(0.45, T, 1.3)); rows[13].push(thru(0.8, T, 1.25));
        if (i % 30 === 29) await ctx.yield();
      }
      // the wall's face under each place of rows 1 to 7: the nearest to the way that the shell stands within 0.45 m of it, or within 0.6 of the way to its neighbours
      // in the row where the columns stand further apart (round a corner they fan out to 1.5 m at the border), so no step of the shell's beds comes through between two columns
      for (let j = 1; j < 8; j++) {
        const far = rows[j].map((p, i) => { const a = rows[j][(i + m - 1) % m], b = rows[j][(i + 1) % m]; return Math.max(Math.hypot(a[1] - p[1], a[2] - p[2]), Math.hypot(b[1] - p[1], b[2] - p[2])); });
        for (let i = 0; i < m; i++) { const p = rows[j][i]; p[0] += shellEnv(p[1], p[2], Math.max(0.45, 0.6 * far[i])); if (p[5][2] > 0) { const c = shellNear(p[0], p[1], p[2]); p[5][0] = c[0]; p[5][1] = c[1]; } }
        await ctx.yield();
      }
      // the outermost row: 0.15 m behind the furthest back that the shell's triangles stand within 0.4 m of its own place (or within 0.6 of the way to its neighbours
      // in the row, where they stand further apart), and 0.45 m or more behind the border row. The border row takes its normals as if this row stood just 0.45 m behind it
      // (the place's seventh number: see caveSkin), so the face's shading at the border does not turn with the depth of the tuck
      {
        const bk = rows[0].map((p, i) => { const a = rows[0][(i + m - 1) % m], b = rows[0][(i + 1) % m]; return shellBack(p[1], p[2], Math.max(0.4, 0.6 * Math.max(Math.hypot(a[1] - p[1], a[2] - p[2]), Math.hypot(b[1] - p[1], b[2] - p[2]))), false); });
        for (let i = 0; i < m; i++) { const p = rows[0][i]; p[6] = [rows[1][i][0] - 0.45, p[1], p[2]]; p[0] = Math.min(bk[i] - 0.15, p[6][0]); const c = shellNear(p[0], p[1], p[2]); p[5][0] = c[0]; p[5][1] = c[1]; }
      }
      await ctx.yield();
      caveParts.push(caveSkin(rows, true, 2, [2, 0, 1, 0, 0]));
      await ctx.yield();
    }
    // ---- THE RILL'S SOURCE, z 24.9: A HOOD of the port wall's rock, one skin of twenty-nine sections of twenty-four places (1,288 triangles) in the cave's mesh.
    // A boss hangs out of the wall, its foremost place 4.84 m to port of the way, and in its under side is a hollow: in plan a rectangle with rounded corners
    // (hoodD) from 5.36 m to port of the way back to the wall and 2.1 m long, over the five locks' lines as far as the wall leaves them free (see THE HOLLOW'S BACK WALL, below). The hollow's roof (hoodRoof) lies 3.0 to 3.25 m over the
    // height of the way at z 25, highest about 7 m to port of it; each lock begins 0.45 m over hoodRoof on its own line (as built 0.4 to 0.55 m over the roof's skin), inside the rock (rillTop). Round the hollow on its three free
    // sides hangs a rim 0.52 m thick (to 0.75 m round the corners), round below; its lower edge (hoodRim) wanders between 1.7 and 2.1 m over the way in lobes of
    // 0.6 to 1.1 m. From the rim the outer face rises, bulging, to its top 4.75 to 5.2 m over the way, where the wall lies furthest back under the next bed above; to
    // either hand the boss thins (hoodE), 4.5 m up the brook and 4.2 m down it, and over its last 1.3 m it sinks through the wall's face. All four borders lie behind
    // the shell's triangles: above the top, below the hollow's back wall (the skin goes down and back from that wall's foot), and at the two ends. Inside the hollow
    // the rock is dark (0.23 to 0.34) on the under side and on the back wall above its foot; the back wall's foot row, from which the skin goes down behind the wall, has the wall's own tone, and the wall goes to dark above it (within 0.12 to 0.18 m on the six sections within 0.76 m of the middle, 0.21 to 0.32 m on the two at 0.9 m); on the two sections 1.0 m from the middle the upright strip has about six tenths of the rock's own tone (0.31 to 0.59); the rim's under edge 0.6, the outer face has the rock's own tone and a moss number of 0.85; toward the ends and at the borders the
    // skin's two colour numbers are the shell's own at the place. Under the rim nothing is built: the wall there is the shell
    const RILL_Z = 25, rillAt = routeAt(RILL_Z), HX = rillAt[0], HY = rillAt[1];
    const HOOD = { z: RILL_Z - 0.1, hz: 1.05, pin: 5.36, cr: 0.45, rim: 0.52, up: 4.5, dn: 4.2, edge: 1.95, roof: 3.05, skin: 0.008, least: 0.005 };
    const wallP = (y, z) => shellEnv(y, z, 0.4, true);      // the port wall's face: the nearest to the way that the shell's triangles stand within 0.4 m of a place
    const hoodD = (x, z) => {      // how far inside the hollow's outline a place lies in plan (under nothing: outside it)
      const a = HOOD.pin + HOOD.cr - (x - HX), b = Math.abs(z - HOOD.z) - (HOOD.hz - HOOD.cr);
      return a > 0 && b > 0 ? HOOD.cr - Math.hypot(a, b) : Math.min(x - HX - HOOD.pin, HOOD.hz - Math.abs(z - HOOD.z));
    };
    const hoodRim = (x, z) => { const xl = Math.max(x - HX - HOOD.pin - HOOD.cr, 0); return HY + HOOD.edge + 0.15 * Math.sin(2.9 * (z - HOOD.z) + 2.6 * xl + 0.7) + 0.07 * Math.sin(5.3 * (z - HOOD.z) - 4.1 * xl + 2.1) + 0.03 * N.n2(x * 0.8 + 2.3, z * 0.8 + 6.1); };      // the height of the rim's lower edge
    const hoodRoof = (x, z) => HY + HOOD.roof + 0.17 * Math.exp(-Math.pow((x - HX - 7) / 0.9, 2) - Math.pow((z - HOOD.z) / 0.8, 2)) + 0.05 * N.n2(x * 1.7 + 5.3, z * 1.7 + 1.9);      // the height of the hollow's roof
    const hoodUnder = (x, z) => {      // the height of the hood's under side
      const d = hoodD(x, z), y0 = hoodRim(x, z), r = HOOD.rim / 2;
      if (d >= 0) { const s = 1 - clamp(d / 0.3, 0, 1); return lerp(y0 + r, hoodRoof(x, z), 1 - s * s); }
      if (d > -HOOD.rim) return y0 + r - Math.sqrt(Math.max(r * r - (d + r) * (d + r), 0));
      return y0 + r + 1.0 * sm(0, 2.2, -d - HOOD.rim);
    };
    const hoodHalf = (z) => (z < HOOD.z ? HOOD.up : HOOD.dn), hoodE = (z) => Math.max(0.08, Math.pow(1 - sm(0.9, hoodHalf(z), Math.abs(z - HOOD.z)), 1.6));      // the share of its reach the hood has at a z
    const hoodXw = (z) => { let xw = 1e9; for (let h = 1.6; h < 4.1; h += 0.3) xw = Math.min(xw, wallP(HY + h, z)); return xw; };      // the port wall's proudest place between 1.6 and 4.1 m over the way (the rim and the boss are set out from it)
    const hoodSec = (z, bk) => {      // the hood's section at a z, twenty-four places [x, y, z, tone, moss, [colour, moss, share]]; bk: the back wall's four places there, for a section in the hollow
      const E = hoodE(z), back = (y, d) => shellBack(y, z, 0.35, true) + d;
      const xw = hoodXw(z), xn = lerp(xw, HX + HOOD.pin - HOOD.rim, E);
      const au = Math.abs(z - HOOD.z), cb = (u) => Math.max(u - (HOOD.hz - HOOD.cr), 0), cx = (u) => HX + HOOD.pin + HOOD.cr - Math.sqrt(Math.max(HOOD.cr * HOOD.cr - cb(u) * cb(u), 0));      // the hollow's outline toward the way, round its two corners
      const rw = au <= HOOD.hz ? Math.max(cx(au) - xn, HOOD.rim) : lerp(Math.max(cx(HOOD.hz) - lerp(xw, HX + HOOD.pin - HOOD.rim, hoodE(HOOD.z + HOOD.hz)), HOOD.rim), HOOD.rim, sm(HOOD.hz, HOOD.hz + 0.85, au)) * Math.min(1, (xw - xn) / 1.3), rr = rw / 2, xin = xn + rw, xc = xn + rr, yb = Math.max(hoodUnder(xin, z) - rr * (1 - sm(0, 0.4, -hoodD(xin, z) - HOOD.rim)), Math.min(hoodRim(xc, z), hoodUnder(xin, z))), ry = clamp(hoodUnder(xin, z) - yb, 0, rr), yc = yb + rr;      // the rim's lowest height here; how far over it the under side meets the rim's round
      const hol = Math.abs(z - HOOD.z) < HOOD.hz - 0.1, xp = bk ? bk[3][0] : xw - 0.07, yr = bk ? bk[3][1] : hoodUnder(xp, z), yf = bk ? bk[0][1] : Math.min(yr - 0.3, lerp(yr - 0.3, hoodRim(xw, z), 1 - sm(0, 0.6, -hoodD(xw, z) - HOOD.rim))), o = [];
      const sh = (w) => [-1, 0, w], dark = (x, y) => 0.285 + 0.055 * N.n3(x * 0.9, y * 0.9, z * 0.9);
      const und = (x) => { const y = hoodUnder(x, z), d = hoodD(x, z); return d > 0.03 ? [x, y, z, 1, 0, [dark(x, y), 0, 1]] : [x, y, z, 1, 0, [0.6 + 0.03 * N.n3(x * 0.9, y * 0.9, z * 0.9), 0, 1 - sm(0, 1.5, Math.abs(z - HOOD.z) - HOOD.hz - HOOD.rim)]]; };
      o.push([back(yf - 0.45, 0.15), yf - 0.45, z, 1, undefined, sh(1)]);
      const Rf = bk ? clamp(yr - bk[2][1], 0.05, 0.3) : Math.max(0.01, Math.min(0.3, 0.5 * (yr - yf), 0.3 * (xp - xin))), bw = (x, y) => (hol ? [x, y, z, 1, 0, [dark(x, y), 0, 1]] : [x, y, z, lerp(1, 0.6, E), 0, sh(1 - E)]);
      if (bk) o.push([bk[0][0], yf, z, 1, 0, sh(1)], bw(bk[1][0], bk[1][1]), bw(bk[2][0], bk[2][1]), bw(xp, yr));      // in the hollow: the back wall's four places from the rim's height up (hoodBack), the last of them the roof's back edge
      else o.push(bw(xp, yf), bw(xp, yr - Rf), bw(xp - 0.293 * Rf, lerp(yr - Rf, hoodUnder(xp - Rf, z), 0.707)));      // along the flanks: an upright strip behind the rim, 0.07 m in front of the wall's proudest place, and its round into the under side
      o.splice(1, 0, [(o[0][0] + o[1][0]) / 2, yf - 0.225, z, 1, undefined, sh(1)]);      // from the wall's foot inside the hollow the skin goes down and back to its border behind the wall
      const x4 = xp - Rf, S = x4 - xin;
      for (const x of [x4, xin + 0.62 * S, xin + 0.33 * S, xin + Math.min(0.42, 0.24 * S), xin + Math.min(0.27, 0.16 * S), xin + Math.min(0.14, 0.08 * S)]) o.push(und(x));
      const wr = 1 - sm(0, 1.5, au - HOOD.hz - HOOD.rim), ab = (x, y, v) => [x, y, z, 1, 0, [v + 0.03 * N.n3(x * 0.9, y * 0.9, z * 0.9), 0, wr]];      // the rim's round from inside to outside: 0.42, 0.52 and 0.6 at its lowest (round the hollow; along the flanks the wall's own, within 1.5 m)
      o.push(ab(xin, yb + ry, 0.42), ab(xc + 0.707 * rr, yb + 0.293 * ry, 0.52), ab(xc, yb, 0.6), [xc - 0.707 * rr, yc - 0.707 * rr, z, lerp(1, 0.85, wr), 0.85], [xn, yc, z, 1, 0.85]);
      let yt = HY + 4.3, xt = -1e9; for (let y = HY + 4.3; y < HY + 5.21; y += 0.05) { const x = shellTri(y, z, true); if (x > xt) { xt = x; yt = y; } }      // its top: where the wall lies furthest back under the next bed above
      xt += 0.05;
      for (const t of [0.07, 0.2, 0.38, 0.6, 0.82, 1]) {
        const a = t * Math.PI / 2, x = xn + (xt - xn) * (1 - Math.pow(Math.cos(a), 0.45)), y = yc + (yt - yc) * Math.pow(Math.sin(a), 0.45);
        o.push([x, y, z, 1, 0.85, t > 0.7 ? sh(t > 0.9 ? 1 : 0.5) : undefined]);
      }
      o.push([back(yt + 0.3, 0.15), yt + 0.3, z, 1, undefined, sh(1)]);
      const sink = sm(hoodHalf(z) - 1.3, hoodHalf(z) - 0.05, Math.abs(z - HOOD.z));
      if (sink > 0) {      // toward its two ends the section goes back into the wall: at the end itself every place of it lies 0.2 m or more behind the wall's face at its own height
        const need = (p) => shellTri(p[1], z, true) + 0.2 - p[0]; let dl = 0; for (let j = 2; j <= 15; j++) dl = Math.max(dl, need(o[j]));
        const dt = Math.max(need(o[21]), 0);
        o.forEach((p, j) => { if (j >= 2 && j <= 21) p[0] += sink * (j <= 15 ? dl : Math.max(lerp(dl, dt, (j - 15) / 6), need(p))); });
        o[1][0] = (o[0][0] + o[2][0]) / 2;
      }
      if (!bk) o.splice(3, 0, bw((o[2][0] + o[3][0]) / 2, (o[2][1] + o[3][1]) / 2));      // a flank's section has twenty-three places of its own (so they are counted just above); its twenty-fourth lies midway on its upright strip
      const we = 1 - sm(0.06, 0.45, E);      // toward its two ends the skin takes the wall's own two numbers
      o.forEach((p) => {
        const mine = p[5] && p[5][0] >= 0; if (we <= 0 && (!p[5] || mine)) return;      // a place that takes the shell's two numbers (wholly, or by a share on top of its own tone)
        const c = shellNear(p[0], p[1], z); p[5] = mine ? [lerp(p[5][0], c[0], we), lerp(p[5][1], c[1], we), Math.max(p[5][2], we)] : [c[0], c[1], Math.max(p[5] ? p[5][2] : 0, we)];
      });
      return o;
    };
    // THE HOLLOW'S BACK WALL is the port wall's own face at its own height on the six sections within 0.76 m of the hollow's middle (hoodBack): four places to a
    // section, from the rim's height up: the foot; a lower place on the line of the shell's mesh under hoodLn where that line lies 0.12 m or more over the foot, else
    // 0.12 m over the foot (so in 232 of 240 sections on seeds 1 to 40); an upper place on the line hoodLn itself (a bed end of the wall, where its face turns), 0.05 m
    // or more under the top and 0.12 m or more over the lower; the top, where the hollow's under side meets the wall -> [[x, y, z] four times]. Each is set HOOD.skin
    // in front of the shell's triangles at its height and the fitting further down brings some further forward (as built 0.008 to 0.050 m in front). So the wall leans,
    // steps and bulges as the port wall does, and as built it stands 0.005 to 0.085 m in front of the shell's triangles (between the sections too) and nowhere behind.
    // At the hollow's two ends the under side comes down to the rim across the wall's lines, and the back wall turns out of the wall's face into the rim's inner side:
    // the two sections 0.9 m from the middle stand six tenths of the way from the wall's face to the upright strip the flanks have (hoodHeld), the two at 1.0 m on
    // that strip; there the skin stands up to 0.65 m in front of the wall at 0.9 m from the middle and up to 1.07 m at 1.0 m (no lock hangs there: the five hang
    // within 0.6 m of the middle). The wall-side lock hangs 0.37 m and more in front of this wall on 15 seeds of forty; where the port wall itself stands by or in
    // that lock's line (its nose 2.5 to 2.8 m over the way reaches up to 0.11 m past the lock's middle line) the strands of that side come out of the wall's face
    // under the nose, up to 1.2 m under the roof, as they do in live (live's wall hides up to 35 per cent of that lock between 1.9 m and the roof, this one up to 37)
    const hoodLineY = (i, z) => shellAt(i, z, [0, 0, 0])[1];
    let hoodLn = 1; { const ym = hoodUnder(hoodXw(HOOD.z), HOOD.z); for (let i = 1; i < 8; i++) if (hoodLineY(i, HOOD.z) < ym - 0.1) hoodLn = i; }      // the highest line that lies 0.1 m or more under the roof at the hollow's middle
    const hoodBack = (z) => {
      const xw = hoodXw(z), up = hoodLineY(hoodLn, z); let x = xw, yt = 0;
      for (let q = 0; q < 6; q++) { yt = hoodUnder(x, z); x = shellTri(yt, z, true) - HOOD.skin; }
      const yf = Math.min(yt - 0.3, hoodRim(xw, z)), y2 = Math.min(up, yt - 0.05), y1 = clamp(hoodLineY(hoodLn - 1, z), yf + 0.12, y2 - 0.12);
      return [yf, y1, y2, yt].map((y) => [shellTri(y, z, true) - HOOD.skin, y, z]);
    };
    const hoodHeld = (z) => {      // the same four places as an upright strip 0.07 m in front of the wall's proudest place, rounded into the under side (as a flank's section has them)
      const xw = hoodXw(z), xp = xw - 0.07, yr = hoodUnder(xp, z), yf = Math.min(yr - 0.3, hoodRim(xw, z)), Rf = Math.min(0.3, 0.5 * (yr - yf));
      return [[xp, yf, z], [xp, (yf + yr - Rf) / 2, z], [xp, yr - Rf, z], [xp - 0.293 * Rf, lerp(yr - Rf, hoodUnder(xp - Rf, z), 0.707), z]];
    };
    // where a lock begins: on the line live's lock hangs on, 0.45 m over the place where that line comes out of the hollow's roof -> [x, y, z, how far down live's lock that is]
    const rillTop = (i) => {
      const z = RILL_Z - 0.5 + 0.2 * i, x0 = HX + 7.95 - 0.42 * i, y0 = brookY(RILL_Z) + 0.2 + (8.4 + 0.5 * (i % 3)) * 0.987 + 0.5;
      let y = HY + HOOD.roof + 0.45; for (let q = 0; q < 5; q++) y = hoodRoof(x0 - 0.08 * (y0 - y) / 0.9968, z) + 0.45;
      return [x0 - 0.08 * (y0 - y) / 0.9968, y, z, (y0 - y) / 0.9968];
    };
    let hoodRows = null;      // the hood's sections as built (the maidenhair by the rill are set against them)
    {
      const U = [-4.5, -4, -3.5, -3, -2.6, -2.2, -1.9, -1.6, -1.32, -1.1, -1, -0.9, -0.76, -0.5, -0.18, 0.18, 0.5, 0.76, 0.9, 1, 1.1, 1.32, 1.6, 1.9, 2.3, 2.75, 3.25, 3.7, 4.2], secs = [];
      const bks = U.map((u) => { const a = Math.abs(u), z = HOOD.z + u; return a > HOOD.hz - 0.1 ? null : a < HOOD.hz - 0.25 ? hoodBack(z) : hoodBack(z).map((p, k) => { const h = hoodHeld(z)[k]; return [lerp(p[0], h[0], 0.6), lerp(p[1], h[1], 0.6), z]; }); }), fwd = U.map(() => [0, 0, 0, 0]);
      await ctx.yield();
      // between its places the back wall must not lie behind the wall: every cell of it (two neighbouring sections, two neighbouring places), parted either way, is
      // read against the shell's triangles at a hundred and fifty-three places to a triangle; where a place lacks of HOOD.least, the triangle's corners come forward:
      // those on the cell's row away from the upper line alone (the foot's, the lower line's, the top's: the upper line is the wall's nose, where the locks pass
      // closest, and stays as near the wall as it can) by as much as makes the lack good, where they bear on the place by half or more; all three by the lack otherwise
      for (let q = 0; q + 1 < U.length; q++) {
        if (!bks[q] || !bks[q + 1]) continue;
        for (let r = 0; r < 3; r++) {
          const c = [[q, r], [q + 1, r], [q, r + 1], [q + 1, r + 1]].map(([a, b]) => bks[a][b]), far = r === 2 ? 1 : 0, need = [0, 0, 0, 0];
          for (const m of [[0, 1, 2], [2, 1, 3], [0, 1, 3], [0, 3, 2]]) for (let a = 0; a <= 16; a++) for (let b = 0; b <= 16 - a; b++) {
            const w = [1 - (a + b) / 16, a / 16, b / 16], at = (n) => w[0] * c[m[0]][n] + w[1] * c[m[1]][n] + w[2] * c[m[2]][n], v = at(0) - shellTri(at(1), at(2), true) + HOOD.least; if (v <= 0) continue;
            const wf = (m[0] >> 1 === far ? w[0] : 0) + (m[1] >> 1 === far ? w[1] : 0) + (m[2] >> 1 === far ? w[2] : 0);
            for (const k of m) if (wf < 0.5) need[k] = Math.max(need[k], v); else if (k >> 1 === far) need[k] = Math.max(need[k], v / wf);
          }
          need.forEach((v, k) => { fwd[q + (k & 1)][r + (k >> 1)] = Math.max(fwd[q + (k & 1)][r + (k >> 1)], v); });
        }
        await ctx.yield();
      }
      bks.forEach((bk, q) => {      // (a top that lies on the hollow's under side is set on it again where it has come to stand)
        if (!bk) return; bk.forEach((p, r) => { p[0] -= fwd[q][r]; }); if (Math.abs(U[q]) < HOOD.hz - 0.25) bk[3][1] = hoodUnder(bk[3][0], bk[3][2]);
      });
      await ctx.yield();
      for (let q = 0; q < U.length; q++) { secs.push(hoodSec(HOOD.z + U[q], bks[q])); if (q % 4 === 3) await ctx.yield(); }      // (the hand goes back at every fourth section)
      hoodRows = secs; await ctx.yield();
      caveParts.push(caveSkin(secs[0].map((_, j) => secs.map((o) => o[j])), false, 1, [19, 14, -1, 0, 0], true));
    }
    await ctx.yield();
    { const cave = new THREE.Mesh(joinGeo(caveParts, ['position', 'normal', 'color']), caveMat); cave.frustumCulled = false; scene.add(cave); }
    await ctx.yield();
    // a smooth bedded mass: the brook's stones, the flower ledge
    const blobGeo = (rx0, ry0, rz0, seed, n = 12, pw = 4, amp = 0.12) => {
      const g = new THREE.SphereGeometry(1, n * 2, n), p = g.attributes.position, c = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const r = Math.pow(Math.pow(Math.abs(x), pw) + Math.pow(Math.abs(y), pw) + Math.pow(Math.abs(z), pw), 1 / pw) || 1;
        const k = (1 / r) * (1 + amp * N.n3(x * 1.4 + seed, y * 1.4, z * 1.4) + amp * 0.4 * Math.sin(y * 7 + seed));
        p.setXYZ(i, x * k * rx0, y * k * ry0, z * k * rz0);
        c[i * 3] = 0.72 + 0.28 * sm(-0.3, 0.6, Math.sin(y * 7 + seed)); c[i * 3 + 1] = y > 0.55 ? 0.6 : 0; c[i * 3 + 2] = 1;
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
      // the sphere's seam and poles share places: weld the normals there so no crease shows
      const nrm = g.attributes.normal, key = new Map();
      for (let i = 0; i < p.count; i++) { const s = Math.round(p.getX(i) * 40) + ',' + Math.round(p.getY(i) * 40) + ',' + Math.round(p.getZ(i) * 40); let e = key.get(s); if (!e) { e = [0, 0, 0, []]; key.set(s, e); } e[0] += nrm.getX(i); e[1] += nrm.getY(i); e[2] += nrm.getZ(i); e[3].push(i); }
      for (const e of key.values()) { const l = Math.hypot(e[0], e[1], e[2]) || 1; for (const i of e[3]) nrm.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); }
      return g;
    };
    // still rocks are baked, placed and turned, into one geometry (the ledge, the stones, the ravine's lips and roots): one draw
    const rockBag = () => {
      const P = [], Nn = [], C = [], I = [], e = new THREE.Euler(), m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3();
      return {
        add(g, x, y, z, rotY = 0, tilt = DIP) {
          const base = P.length / 3, p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, ix = g.index.array;
          m4.makeRotationFromEuler(e.set(0, rotY, tilt, 'YXZ')); m3.setFromMatrix4(m4); m4.setPosition(x, y, z);
          for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m4); P.push(v.x, v.y, v.z); v.fromBufferAttribute(n, i).applyMatrix3(m3); Nn.push(v.x, v.y, v.z); C.push(c.getX(i), c.getY(i), c.getZ(i)); }
          for (let i = 0; i < ix.length; i++) I.push(ix[i] + base); g.dispose();
        },
        geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere(); return g; },
      };
    };
    const stillRocks = rockBag();
    // the flower ledge, 3.5 to 4 m to starboard of the way in the cave; the brook's three stones
    const LEDGE = { z0: 4.5, z1: 40, blocks: [] };
    for (let i = 0; i < 5; i++) {
      const z = 9 + i * 6.6, r = routeAt(z), b = { x: r[0] - 6.0 - 0.3 * (i % 2), y: r[1] - 3.35 - 0.3 * (i % 2), z, rx: 2.1 + 0.3 * (i % 2), ry: 1.3 + 0.2 * ((i * 2) % 3), rz: 4.3 };
      LEDGE.blocks.push(b); stillRocks.add(blobGeo(b.rx, b.ry, b.rz, 11 + i * 3.1, 10, 5), b.x, b.y, b.z, 0, 0.1);
    }
    const STONES = [[1.6, 15, 1.0], [-1.3, 23, 1.25], [0.9, 32, 0.9]];
    for (const s of STONES) {      // low flat slabs awash, umber (darker than the water's lights), moss on their tops
      const r = routeAt(s[1]), g = blobGeo(s[2] * 1.15, s[2] * 0.3, s[2] * 1.35, s[1], 8, 5, 0.05), c = g.attributes.color, p = g.attributes.position;
      for (let i = 0; i < c.count; i++) c.setXYZ(i, 0.5, p.getY(i) > s[2] * 0.12 ? 0.75 : 0.15, 1);
      stillRocks.add(g, r[0] + s[0], brookY(s[1]) + 0.1, s[1], s[0], 0.2);
    }
    await ctx.yield();
    // ---- THE RAVINE'S UNDERCUT BANKS, from the ducks' water to the ravine's end: along each bank a lip of bedded rock hangs LIP_OVER over the
    // water, broken every 6 to 12 m by an upright joint into blocks that step in and out; its top is open to the light, its underside and the hollow
    // behind it are the deep umber; bare roots hang from its nose toward the water. By place: the lips' noses pass 7 m from the way and 2.4 m under
    // the eye, the roots hang below them.
    const lipBlocks = [[], []];      // per bank (0 port, 1 starboard): [z0, z1, step out, step up]
    {
      const hk = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7 + 5.3) * 43758.5453; return v - Math.floor(v); }, TD = SD / CD;
      const P = [], C = [], I = [], sec = (sd, z, w, up) => {      // one section of a lip, from the bank behind it round its nose to the water under it
        const sg = sd ? -1 : 1, cx = riverX(z), e = riverW(z), y = lipY(z, !sd) + up, d0 = e - LIP_OVER + w;
        // its top is a bedding plane, dipping with every bed of the country: to port it rises from the nose into the wall, to starboard it falls away behind the nose
        const top = sd ? [[d0 + 6.5, y - 1.3, 0.95, 0.7], [d0 + 2.6, y - 1.25, 1, 0.6], [d0 + 0.5, y - 0.25, 1.05, 0.25]] : [[d0 + 6.5, y + 6.5 * TD, 0.95, 0.6], [d0 + 3, y + 3 * TD, 1, 0.6], [d0 + 0.5, y + 0.5 * TD, 1.05, 0.25]];
        for (const q of [...top, [d0, y - 0.4, 0.9, 0], [d0 + 0.15, y - 1.25, 0.55, 0], [d0 + 1.6, y - 1.9, 0.36, 0], [e + 0.5, 1.5, 0.3, 0], [e + 1.0, -1.0, 0.3, 0]]) { const v = hk(Math.round(z * 3.1) + P.length, 31); P.push(cx + sg * q[0], q[1], z); C.push(q[2] * (q[3] > 0.1 ? 0.8 + 0.25 * v : 1), q[3] > 0.1 ? 0.25 + 0.75 * hk(Math.round(z * 1.7), 37 + sd) : q[3], 1); }      // moss lies along some blocks' tops and leaves others bare
      };
      for (let sd = 0; sd < 2; sd++) {
        let z = LIP_Z0, i = 0, prev = -2;
        while (z < LIP_Z1) {
          const len = 6 + 6 * hk(i, sd), z1 = Math.min(z + len, LIP_Z1), w = 1.5 * hk(i, sd + 2), up = 0.8 * (hk(i, sd + 4) - 0.5), n = Math.max(2, Math.ceil((z1 - z) / 3.4));
          const open = sd === 1 && (inCleft(riverX(z) - riverW(z), z, 23) || inCleft(riverX(z1) - riverW(z1), z1, 23));      // the starboard lip is broken through where the cleft comes in
          if (!open) {
            lipBlocks[sd].push([z, z1, w, up]);
            for (let k = 0; k <= n; k++) {
              const zz = lerp(z + 0.2, z1 - 0.2, k / n), base = P.length / 3; sec(sd, zz, w + 0.25 * Math.sin(zz * 0.9 + i), up);
              const join = k > 0 || prev === i - 1;      // the block's own length, or the upright joint's face between it and the block before
              if (join) for (let q = 0; q < 7; q++) { const a = base - 8 + q, b = base + q; if (sd) I.push(a, b, a + 1, b, b + 1, a + 1); else I.push(a, a + 1, b, b, a + 1, b + 1); }
            }
            prev = i;
          }
          z = z1; i++;
        }
      }
      // the roots: two to four to a block, tapering, wandering down from the lip's nose and underside toward the water
      const base0 = P.length / 3; let nr = 0;
      for (let sd = 0; sd < 2; sd++) for (let bi = 0; bi < lipBlocks[sd].length; bi++) {
        const B = lipBlocks[sd][bi], sg = sd ? -1 : 1, cnt = 2 + Math.floor(2.99 * hk(bi, sd + 7) * detail);
        for (let r = 0; r < cnt; r++) {
          const h = (k) => hk(bi * 7 + r, sd + 10 + k), z0 = lerp(B[0] + 0.6, B[1] - 0.6, (r + h(0)) / cnt), y0 = lipY(z0, !sd) + B[3] - 1.2 - 0.4 * h(1), d0 = riverW(z0) - LIP_OVER + B[2] + 0.15 + 0.9 * h(1);
          const len = Math.min(lerp(1.8, 4.6, h(2)), y0 - 0.5), r0 = lerp(0.11, 0.2, h(3)), drift = (h(4) - 0.5) * 1.6, lean = -0.5 * h(5), ph = 6.28 * h(6), NS = 4;
          for (let s = 0; s <= NS; s++) {
            const t = s / NS, rr = r0 * (1 - 0.82 * t), wob = 0.22 * Math.sin(t * 5.5 + ph) * t, zz = z0 + drift * t * t + 0.18 * Math.sin(t * 4.1 + ph * 2) * t;
            const cx = riverX(zz) + sg * (d0 + lean * t + wob), cy = y0 - len * t;
            for (let a = 0; a < 3; a++) { const an = a * 2.0944 + 0.6 * s; P.push(cx + Math.cos(an) * rr, cy, zz + Math.sin(an) * rr); C.push(0.78 + 0.22 * hk(nr, a), 0, -1); }      // b = -1: a bare thing, the glaze rules no bed on it
            if (s) { const q = P.length / 3 - 6; for (let a = 0; a < 3; a++) { const a1 = (a + 1) % 3; I.push(q + a, q + 3 + a, q + a1, q + a1, q + 3 + a, q + 3 + a1); } }
          }
          nr++;
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
      { const nrm = g.attributes.normal, pa = g.attributes.position; for (let i = base0; i < pa.count; i++) { const ring = Math.floor((i - base0) / 3) * 3 + base0; let mx = 0, mz = 0; for (let a = 0; a < 3; a++) { mx += pa.getX(ring + a); mz += pa.getZ(ring + a); } const dx = pa.getX(i) - mx / 3, dz = pa.getZ(i) - mz / 3, l = Math.hypot(dx, dz) || 1; nrm.setXYZ(i, dx / l, 0, dz / l); } }      // a root is round: its normals look straight out from its axis
      if (g.attributes.normal.getY(1) < 0 || g.attributes.normal.getY(base0 - 7) < 0) throw new Error('a lip faces down');
      stillRocks.add(g, 0, 0, 0, 0, 0);
    }
    await ctx.yield();
    scene.add(new THREE.Mesh(stillRocks.geo(), rockMat));
    await ctx.yield();

    // ---- pinnacles: crags, each a sheaf of leaning blades (slab); the gap's two are the greatest of them
    const massBuilder = () => {
      const pos = [], col = [], idx = [], rad = [], own = [];      // own: mends of the normals, applied once the smooth normals are worked out (the fallen blocks bring their own; a wall's front leans toward its broad face)
      return {
        pos, col, idx,
        // one leaning BLADE of a crag: ONE continuous mass from foot to head, wider than thick, of a lens section with a sharp arris
        // at each side (0 the up-dip one, S/2 the down-dip one), a plain back and a front (the face the course looks at, toward -Z)
        // parted by one upright joint into two unequal members, the second standing a little behind the first and in its dark.
        // Every ring lies ON a bedding plane and there are few of them: the foot, the crag's partings (o.beds, of unequal thickness,
        // five at most) and the head. The rings carry no value of their own: g is the parting coordinate (whole numbers at the
        // partings; the glaze rules each as a short ledge on the faces only, see uBlade in the part), r the dark of joint and arris.
        // The head is never level and never square: broken on the dip (steeper than the beds lie) into two or three unequal teeth
        // that step down toward the dip, the highest at the up-dip arris.
        // o: x, z, y0, h, rx (half extent along X), rz (half extent along Z), lx, lz, seed, segs (8 or 6), yaw and z0 (optional: the sheaf's turn about (x0, z0)), x0, beds (the heights at which the crag's partings cross the line x = x0)
        // For the gap's great blades also: maxRings, minT, maxT (how many partings a blade takes and where), thinAbove (over that height only every third parting), step and stepTo (below stepTo
        // a parting is a real ledge: the bed above stands back from the one below by up to step metres on the front), edge(y) with edgeU (the world x of one arris at each height: the gap's own
        // profile; for a blade broad along the river, of its front's fullest line), flip (a blade broad along the river shows its front to starboard), seats (its ledges' places, for the plants)
        slab(o) {
          const base = pos.length / 3, S = o.segs, TD = SD / CD, ts = [0], hs = (i) => { const v = Math.sin(o.seed * 12.9898 + i * 78.233) * 43758.5453; return v - Math.floor(v); };
          const cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0), z0 = o.z0 ?? o.z, ox = o.x0 + (o.x - o.x0) * cy + (o.z - z0) * sy, oz = z0 - (o.x - o.x0) * sy + (o.z - z0) * cy;      // the sheaf stands turned about its own middle (yaw): no two crags show the eye the same side
          for (let k = 0; k < o.beds.length; k++) { const t = (o.beds[k] + (ox - o.x0) * TD - o.y0) / o.h; if (t > ts[ts.length - 1] + (o.minT ?? 0.09) && t < (o.maxT ?? 0.66) && ts.length < (o.maxRings ?? 6) && !(o.thinAbove && o.y0 + t * o.h > o.thinAbove && k % 3)) ts.push(t); }
          ts.push(1);
          const R = ts.length - 1, wide = o.rx >= o.rz, hu = wide ? o.rx : o.rz, hv = wide ? o.rz : o.rx, s0 = 16 * Math.floor(hs(3) * 40);      // (each blade counts its partings from its own sixteen, so no two blades deal them alike)
          // the section, as (u along the broad axis, v across; v = -1 the front): the joint's place and the back are the blade's own
          const xp = lerp(-0.25, 0.3, hs(5)), xq = lerp(-0.82, -0.56, hs(6)), WL = S === 16, UF = [xq - 0.1, xq, xq + 0.08, xp - 0.2, xp - 0.13, xp, xp * 0.45 + 0.58];
          // A WALL (16 to a ring: the gap's two jamb blades of each sheaf, the walls of the last straight): one smooth leaning mass. Its front has seven places between the arrises,
          // two of them upright joints set deep as dark clefts (r low: the partings die there), the blocks between standing a little in and out; the back a plain lens.
          const U = WL ? [1, UF[6] + 0.02, UF[5] + 0.02, UF[4], UF[3], UF[2], UF[1], UF[0] - 0.02, -1, ...UF] : S === 8 ? [1, xp + 0.02, xp - 0.15, xq - 0.02, -1, xq, xp - 0.13, xp] : [1, xp, xp - 0.5, -1, xp - 0.5, xp];      // (the back's vertices stand behind the front's: the teeth go through the blade)
          const V = WL ? [0, ...[1, 2, 3, 4, 5, 6, 7].map((i) => Math.max(Math.pow(Math.max(1 - U[i] * U[i], 0), 0.6), 0.3)), 0, -0.66, -0.5, -0.78, -0.86, -0.68, -1, -0.86] : S === 8 ? [0, 0.8, 1, 0.75, 0, -0.74, -0.7, -1] : [0, 0.9, 0.85, 0, -0.72, -1];
          const OC = WL ? [0.6, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.55, 0.9, 0.4, 0.92, 1, 0.42, 1, 0.92] : S === 8 ? [0.6, 0.9, 0.95, 0.85, 0.55, 1, 0.45, 1] : [0.6, 0.9, 0.9, 0.55, 0.5, 1], iq = WL ? -1 : S === 8 ? 5 : 4;
          // the head's cut: down from the up-dip arris on a slope steeper than the dip, a drop at the joint, a last small tooth at the down-dip arris
          const cutK = TD * lerp(1.2, 1.9, hs(8)), drop = lerp(0.5, 1.1, hs(9)) * hu, drop2 = lerp(0.3, 0.7, hs(10)) * hu;      // a tooth is about as high as it is wide: a broken head, never a spike
          const cut = (u) => Math.min((1 - u) * hu * 0.8 * cutK + (u <= xp - 0.1 ? drop : 0) + (u <= xq + 0.01 ? drop2 : 0), 0.3 * o.h);
          const rings = []; for (let j = 0; j <= R; j++) { rings.push([j, 0]); if (o.step && j > 0 && j < R && o.y0 + ts[j] * o.h < (o.stepTo ?? 1e9) && !(WL && hs(j + 30) < 0.4)) rings.push([j, o.step * (hs(j + 30) < 0.4 ? 0.12 : 0.55 + 0.9 * hs(j + 31))]); }      // a ledge: the same parting twice, the bed above standing back (on a wall the lesser partings have no step: they are ruled only)
          const wideF = wide || !o.flip ? 1 : -1;
          for (const [j, inset] of rings) {
            const t = ts[j], hd = j === R, pu = (1.08 - 0.38 * t) * (0.94 + 0.14 * N.n2(o.seed * 1.7, t * 2.6)), pv = (1.12 - 0.5 * t) * (hd ? 0.7 : 1);      // it narrows a little; the head is a chisel's edge, not a face
            const ay = o.y0 + t * o.h, az = oz + o.lz * t * o.h;
            const ax = o.edge ? o.edge(ay) - (wide ? o.edgeU * hu * pu * 1.05 : wideF * hv * (1.12 - 0.5 * t)) : ox + o.lx * t * o.h * (1 - 0.25 * t);
            for (let i = 0; i < S; i++) {
              const du = U[i] * hu * pu * (1 + 0.05 * N.n3(U[i] * 1.3 + o.seed, V[i] * 1.3, t * 2.2)), dv = V[i] * hv * pv + (V[i] < 0 && (!WL || OC[i] > 0.6) ? inset : 0), lx = wide ? du : -dv * wideF, lz = wide ? dv : du, dx = lx * cy + lz * sy, dz = lz * cy - lx * sy;
              const sh = WL && inset > 0 && V[i] < 0 && OC[i] > 0.6;      // a wall's ledge is a rounded shoulder: the bed above stands back a little and its foot is raised, so the step is a slope that takes the light
              const py = ay + dx * TD * sm(0, 0.12, t) - (hd ? cut(U[i]) + (V[i] + 1) * 0.55 * hv : 0) + (sh ? 0.3 + inset : 0);
              pos.push(ax + dx, py, az + dz);      // (the head's edge falls to the back as well: seen edge on, the blade's head is a slant too, never a post's flat top)
              rad.push(Math.max(hv * pv, 0.3));      // its own half thickness to every ring vertex, in step with pos (the shell reads it)
              col.push(OC[i] * (j === 0 ? 0.8 : 1) * (WL ? (V[i] < 0 ? lerp(1, 0.66, sm(22, 38, py)) : 1) : inset > 0.4 && V[i] < 0 ? 0.72 : 1), s0 + (hd ? R - 0.5 : j) + (i === iq && !hd ? 0.36 : 0) + (sh ? 0.14 : 0), WL ? 3 : 1);      // (b 3: a wall, see the part's glaze; a wall's upper part is one umber: over 38 m no parting is ruled on it)      // (the second member's partings stand a third of a bed off the first's: each stops at the joint; under a ledge the bed above stands in its dark)
              if (o.seats && j > 0 && !hd && inset === 0 && V[i] < -0.6 && OC[i] > 0.6) o.seats.push([ax + dx, py, az + dz, j]);
            }
          }
          const NR = rings.length - 1;
          if (WL) { const fx = wide ? -sy : wideF * cy, fz = wide ? -cy : -wideF * sy; own.push((na) => { for (let r = 0; r <= NR; r++) for (let i = 9; i < 16; i++) if (OC[i] > 0.6) { const k = (base + r * S + i) * 3, nx = na[k] * 0.62 + fx * 0.38, ny = na[k + 1] * 0.62, nz = na[k + 2] * 0.62 + fz * 0.38, l = Math.hypot(nx, ny, nz) || 1; na[k] = nx / l; na[k + 1] = ny / l; na[k + 2] = nz / l; } }); }      // its front's normals lean toward the wall's own broad face: one mass turning slowly from half tone to umber
          for (let j = 0; j < NR; j++) for (let i = 0; i < S; i++) { const p = base + j * S + i, q = base + j * S + (i + 1) % S; if (wideF > 0) idx.push(p, p + S, q, q, p + S, q + S); else idx.push(p, q, p + S, q, q + S, p + S); }
          const top = base + NR * S, H2 = S / 2;      // the head's edge is closed across the blade's thickness
          if (wideF > 0) idx.push(top, top + S - 1, top + 1, top + H2 - 1, top + H2 + 1, top + H2); else idx.push(top, top + 1, top + S - 1, top + H2 - 1, top + H2, top + H2 + 1);
          for (let i = 1; i < H2 - 1; i++) { if (wideF > 0) idx.push(top + i, top + S - i, top + S - i - 1, top + i, top + S - i - 1, top + i + 1); else idx.push(top + i, top + S - i - 1, top + S - i, top + i, top + i + 1, top + S - i - 1); }
        },
        // a fallen bed (the part's slabGeometry: a block, its own vertices and its own normal to each face), laid in place: turned rotY about the upright, then tilted on the dip's axis
        fallen(g, x, y, z, rotY, tilt, r) {
          const base = pos.length / 3, p = g.attributes.position, c = g.attributes.color, nm = g.attributes.normal, e = new THREE.Euler(0, rotY, tilt, 'YXZ'), v = new THREE.Vector3(), nn = [];
          for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyEuler(e); pos.push(v.x + x, v.y + y, v.z + z); col.push(c.getX(i), c.getY(i), c.getZ(i)); rad.push(r); idx.push(base + i); v.fromBufferAttribute(nm, i).applyEuler(e); nn.push(v.x, v.y, v.z); }
          own.push((na) => na.set(nn, base * 3)); g.dispose();
        },
        geo() {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
          if (rad.length !== pos.length / 3) throw new Error('aRad out of step with position');
          g.setAttribute('aRad', new THREE.Float32BufferAttribute(rad, 1)); g.setIndex(idx); g.computeVertexNormals();
          for (const mend of own) mend(g.attributes.normal.array);
          g.computeBoundingSphere(); return g;
        },
      };
    };
    const nearPins = massBuilder(), farPins = massBuilder(), PINS = [], pinSpecs = [];
    const routeXZ = (x, z) => path.nearestXZ(x, z).dist;
    // the two that lean together over the river: a pointed gap 22 m wide at the water, 45 m to its apex
    const gapW = (y) => (y < 45 ? 22 * (1 - Math.pow(Math.max(y, 0) / 45, 1.7)) : -Math.min((y - 45) * 0.3, 9));
    // THE GAP'S TWO are the greatest crags of the country: each a sheaf of five leaning blades with upright joints between them, one forward and the
    // next back. The first is broad along the river and its face is the gap's own profile (the jamb we fly past); the second, the tallest, stands broad
    // across the dip with its inner arris on that profile, so the two sheaves lean together over the river; three lower ones stand against their outer
    // sides and lean with them. Their beds are the sheaf's own, of plainly unequal thickness. All five blades of each sheaf are WALLS (16 to a ring, see slab): smooth leaning masses
    // whose greater partings below 60 m are rounded shoulders that take the ledge light, the lesser ones ruled only, with two upright joints to a face as dark clefts.
    const gapSeats = [[], []];      // [0] the port sheaf's ledges, [1] the starboard's: [x, y, z, parting]
    PINS.push({ x: GAP_X + 38, z: GAP_Z, r: 25, h: 131 }, { x: GAP_X - 36, z: GAP_Z, r: 22, h: 104 });
    for (const [sg, hG, sd] of [[1, 131, 3.3], [-1, 104, 8.1]]) {
      const beds = [], hb = (k) => { const v = Math.sin(k * 91.7 + sd * 13.1) * 43758.5453; return v - Math.floor(v); }, edge = (y) => GAP_X + sg * gapW(y) / 2;
      for (let y = -62 + 3 * hb(0), k = 1; y < 190; k++) { y += hb(k) < 0.42 ? lerp(2.4, 3.6, hb(k + 50)) : lerp(5.2, 9, hb(k + 50)); beds.push(y); }      // one thick bed to every one or two thin
      const co = { slab: true, x0: GAP_X, beds, y0: -5, segs: 8, maxRings: 30, minT: 0.016, maxT: 0.9, thinAbove: 58, step: 1.5, stepTo: 60, seats: gapSeats[sg > 0 ? 0 : 1], lz: 0 };
      pinSpecs.push([true, { ...co, segs: 16, step: 0.5, x: GAP_X + sg * 17, z: GAP_Z, h: hG * 0.72 + 5, rx: 5.5, rz: 22, lx: 0, seed: sd + 1.3, edge, flip: sg > 0 }]);
      pinSpecs.push([true, { ...co, segs: 16, step: 0.5, x: GAP_X + sg * 24, z: GAP_Z - 5 - sg, h: hG + 5, rx: 13, rz: 8, lx: 0, seed: sd, edge: (y) => edge(y) + sg * 1.2, edgeU: -sg }]);
      pinSpecs.push([true, { ...co, segs: 16, step: 0.5, x: GAP_X + sg * 43, z: GAP_Z - 11, h: hG * 0.76 + 5, rx: 11, rz: 7, lx: -sg * 0.2, seed: sd + 11 }]);
      pinSpecs.push([true, { ...co, segs: 16, step: 0.5, x: GAP_X + sg * 59, z: GAP_Z - 2, h: hG * 0.54 + 5, rx: 9.5, rz: 6.5, lx: -sg * 0.24, seed: sd + 15.3 }]);
      pinSpecs.push([true, { ...co, segs: 16, step: 0.5, x: GAP_X + sg * 72, z: GAP_Z - 8, h: hG * 0.35 + 5, rx: 8, rz: 5.5, lx: -sg * 0.27, seed: sd + 19.6 }]);
    }
    {
      RX = riverX0; RW = riverW0; NK = () => 0;      // (placed by the broad river's land, so every crag stands where it stood and every later draw falls as before)
      // 70 pinnacles, 40 to 140 m high, all leaning 5 to 25 degrees one way (down the dip, to starboard), placed by rule on the land
      const zones = [[-250, -118, 190, 470, 14], [-190, 40, 462, 680, 16], [-420, 260, 770, 1500, 16], [-1300, -280, -100, 1700, 16], [130, 420, 470, 1300, 6]];      // 68 and the gap's two
      for (const zn of zones) {
        let made = 0, tries = 0;
        while (made < zn[4] && tries++ < 400) {
          let x = rng.range(zn[0], zn[1]), z = rng.range(zn[2], zn[3]); const h = rng.range(40, 140), r0 = h * rng.range(0.11, 0.17), lean = Math.tan(rng.range(5, 25) * Math.PI / 180), seed = rng.range(0, 99);
          let g0 = H(x, z); const reach = lean * h + r0;
          if (g0 < 2 || g0 > 60 || routeXZ(x, z) < r0 + 13 || routeXZ(x - reach, z) < r0 + 13) continue;
          if (Math.hypot(x, z - 400) > 1040 - reach) continue;      // every pinnacle stands this side of the first rank (1.2 km round the pool): one beyond it would show only its foot through the rank's faded feet, as a block
          if (Math.abs(x - RX(z)) - RW(z) < r0 + 9 && z > 430) continue;
          { const ax = (x - CLEFT[0]) * CLEFT_DIR[0] + (z - CLEFT[1]) * CLEFT_DIR[1], dC = Math.abs((x - CLEFT[0]) * CLEFT_DIR[1] - (z - CLEFT[1]) * CLEFT_DIR[0]); if (ax > -30 && ax < 260 && dC < r0 + 26) continue; }      // none stands in the cleft's mouth, where the bore comes out
          if (PINS.some((p) => Math.hypot(p.x - x, p.z - z) < (p.r + r0) * 1.5)) continue;
          {      // one that would stand in the storm's valley stands on its nearer side instead
            const ax = (x - VALE[0]) * VALE_DIR[0] + (z - VALE[1]) * VALE_DIR[1], lat = (x - VALE[0]) * VALE_DIR[1] - (z - VALE[1]) * VALE_DIR[0], half = 26 + 0.1 * Math.max(ax, 0) + r0 * 1.6;
            if (ax > 30 && Math.abs(lat) < half) {
              let placed = false;
              for (const sg of lat >= 0 ? [1, -1] : [-1, 1]) {
                const mv = sg * half - lat, nx = x + VALE_DIR[1] * mv, nz = z - VALE_DIR[0] * mv, ng = H(nx, nz);
                if (ng < 2 || ng > 60 || routeXZ(nx, nz) < r0 + 13 || routeXZ(nx - reach, nz) < r0 + 13 || (Math.abs(nx - RX(nz)) - RW(nz) < r0 + 9 && nz > 430)) continue;
                const cax = (nx - CLEFT[0]) * CLEFT_DIR[0] + (nz - CLEFT[1]) * CLEFT_DIR[1], cdC = Math.abs((nx - CLEFT[0]) * CLEFT_DIR[1] - (nz - CLEFT[1]) * CLEFT_DIR[0]);
                if ((cax > -30 && cax < 260 && cdC < r0 + 26) || PINS.some((p) => Math.hypot(p.x - nx, p.z - nz) < (p.r + r0) * 1.5)) continue;
                x = nx; z = nz; g0 = ng; placed = true; break;
              }
              if (!placed) continue;
            }
          }
          const near = routeXZ(x, z) < 190;
          const lz = rng.range(-0.08, 0.08), ns = rng.int(0, 2);
          rng.range(0.5, 0.8);      // (a draw the first profile took: the order of every later draw is kept)
          let nf = 2;      // a pinnacle is a CRAG of two to four leaning members of unequal height, standing side by side across the dip
          for (let q = 0; q < ns; q++) {      // one more slab for every place beside it that stands clear of the way and the river (the places, and their draws, as the first build's shoulders had them)
            const a = rng.range(0, 6.28), d = r0 * rng.range(0.85, 1.25), k = rng.range(0.38, 0.7), sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d;
            if (routeXZ(sx, sz) < r0 * k + 13 || routeXZ(sx - (lean * h + r0) * k, sz) < r0 * k + 13 || (z > 430 && Math.abs(sx - RX(sz)) - RW(sz) < r0 * k + 4)) continue;
            rng.range(0.7, 1.2); rng.range(0.5, 0.8); nf++;
          }
          {
            // crags stand in groups with valley between: away from the course a slow field lowers whole neighbourhoods to 40 m crags
            const cl = near ? 1 : lerp(0.42, 1, sm(-0.3, 0.15, N.n2(x * 0.0042 + 7.3, z * 0.0042 + 2.1))), hh = Math.max(h * cl, Math.min(h, 40)), rr0 = r0 * Math.pow(hh / h, 0.7);
            const hf = (i) => { const v = Math.sin(seed * 91.7 + i * 37.1) * 43758.5453; return v - Math.floor(v); }, ext = rr0 * (0.6325 * nf + 0.5) * (0.66 - 0.08 * nf), it = hf(0) < 0.62 ? 0 : 1, KB = near ? 4 : 2, beds = [];      // ext: the crag's half extent across the dip, as it always was
            // its partings, shared by its blades: few, and of plainly unequal thickness (one thick bed to every two or three thin)
            { let c = 0, tot = 0; const gp = []; for (let k = 0; k <= KB; k++) { gp.push(hf(k + 20) < 0.4 ? 2.6 : 1); tot += gp[k]; } for (let k = 0; k < KB; k++) { c += gp[k]; beds.push(g0 - 6 + (hh + 6) * (0.1 + 0.58 * c / tot)); } }
            for (let i = 0; i < nf; i++) {      // i = 0 the up-dip (+X) blade; the blades stand like leaves of one sheaf, broad across the dip, overlapping, one forward and the next back, so an upright joint parts each from its neighbour; the heads step down toward the dip and every blade leans the one way, the lower ones a little more
              const hi = hh * Math.max(0.45, 1 - 0.2 * Math.abs(i - it) - (i === it ? 0 : 0.22 * hf(i + 1))), bw = rr0 * (0.5 + 0.3 * hf(i + 9));
              pinSpecs.push([near, { slab: true, x0: x, z0: z, yaw: (hf(40) - 0.5) * 1.4, beds, x: x - (i - (nf - 1) / 2) / ((nf - 1) / 2) * (ext - bw), z: z + (i % 2 ? 1 : -1) * rr0 * 0.26 * (0.6 + 0.4 * hf(i + 5)), y0: g0 - 6, h: hi + 6, rx: bw, rz: rr0 * (0.27 + 0.15 * hf(i + 13)), lx: -lean * (1 + 0.1 * (i - (nf - 1) / 2)), lz, seed: seed + i * 3.7, segs: near ? 8 : 6 }]);
            }
          }
          PINS.push({ x, z, r: r0, h, g0 }); made++;
        }
        await ctx.yield();
      }
      RX = riverX; RW = riverW; NK = narrowK;
    }
    pinSpecs.sort((a, b) => b[1].z - a[1].z);      // far to near along the course
    for (let i = 0; i < pinSpecs.length; i++) { (pinSpecs[i][0] ? nearPins : farPins).slab(pinSpecs[i][1]); if (i % 6 === 5) await ctx.yield(); }
    // fallen beds: at the dam's foot (reaching x 76) and a leaning pile in the pool beside the skim. Each is a broken BLOCK of the dam's rock: a third
    // to a half as thick as it is long and never thicker than the dam's thickest bed, six unequal sides, umber on its broken faces with two or three
    // wavering partings, ochre only on its upturned bedding face (a darker hollow in it, moss on some); tilted, leaning on its neighbour, half awash.
    // They lie in the crags' own mesh: the blade's glaze rules their partings, the shell loses their contour.
    {
      const spots = [[80, 268, 9], [78, 286, 7], [81, 302, 10], [79, 362, 8], [80, 380, 11], [78, 402, 9], [34, 404, 13], [47, 414, 11], [24, 418, 9], [58, 424, 12], [40, 428, 14]];
      for (let i = 0; i < spots.length; i++) {
        const s = spots[i], hl = s[2] * 0.72, ty = Math.min(hl * (0.36 + (rng.range(0.19, 0.27) - 0.19) * 3), 4.7), g = slabGeometry(hl * 2, ty * 2, hl * rng.range(0.6, 0.9) * 2, 20 + i * 2.7);      // (the same draws as ever; hl its half length)
        nearPins.fallen(g, s[0], s[2] * (0.24 + 0.1 * (i % 3)), s[1], rng.range(-0.5, 0.5), DIP * (i % 2 ? rng.range(1.5, 2.3) : rng.range(0.7, 1.1)) * (i % 3 === 2 ? -0.6 : 1), ty);      // tilted, leaning on each other
      }
    }
    const nearPinGeo = nearPins.geo(); await ctx.yield();
    const pinMesh = new THREE.Mesh(nearPinGeo, cragMat); scene.add(pinMesh);
    const pinShell = new THREE.Mesh(nearPinGeo, pinShellMat); pinShell.renderOrder = 6; scene.add(pinShell);
    const farPinGeo = farPins.geo(), farPinMesh = new THREE.Mesh(farPinGeo, cragMat); scene.add(farPinMesh);
    const farPinShell = new THREE.Mesh(farPinGeo, pinShellMat); farPinShell.renderOrder = 5; scene.add(farPinShell);
    await ctx.yield();
    await ctx.yield();
    // ---- FAR: five ranks of blue pinnacle mountains at 1.2, 2, 3.2, 5 and 8 km, 400 to 1,800 m high, as ridge strips.
    // Soft rock ghosts: rounded broken shoulders, each rank paler than the one before, the crest lost into the air
    // through a fringe row, the feet dissolving into pale air (alpha to nothing: no base line). Farthest rank first
    // in the index, depth writing off, drawn after the solids: nothing to sort.
    {
      const pos = [], att = [], idx = [], RD = [1200, 2000, 3200, 5000, 8000], RH = [400, 650, 950, 1350, 1800], cols = 168, TS = [0, 0.16, 0.34, 0.54, 0.76, 1, 1];
      const rows = TS.length;
      for (let k = 4; k >= 0; k--) {
        const base = pos.length / 3, hr = new Float32Array(cols + 1);
        for (let i = 0; i <= cols; i++) {
          const ph = (i / cols) * Math.PI * 2, c = Math.sin(ph), s = Math.cos(ph);
          const lo = 0.5 + 0.5 * N.n2(c * 1.9 + k * 9.1, s * 1.9), crag = sm(-0.25, 0.45, N.n2(c * 5.6 + k * 3.7, s * 5.6 + 4)), sh = sm(-0.1, 0.5, N.n2(c * 8.5 + k * 5.3, s * 8.5 + 1.7));
          hr[i] = RH[k] * (0.2 + 0.3 * lo + 0.34 * crag * (0.45 + 0.55 * lo) + 0.16 * sh * crag);
        }
        for (let i = 0; i <= cols; i++) {
          const ph = (i / cols) * Math.PI * 2, c = Math.sin(ph), s = Math.cos(ph);
          const hc = 0.25 * hr[(i + cols - 1) % cols] + 0.5 * hr[i % cols] + 0.25 * hr[(i + 1) % cols];      // rounded shoulders: no summit is one vertex
          for (let j = 0; j < rows; j++) {
            const t = TS[j], fr = j === rows - 1, d = RD[k] * (1 + 0.03 * N.n2(c * 14 + k, s * 14 + t * 1.6)) + Math.pow(t, 1.5) * hc * 0.5;
            pos.push(c * d - 0.22 * hc * t, -30 + hc * t + (fr ? 0.026 * RD[k] : 0), 400 + s * d);
            att.push(t, fr ? 0 : 1, k, 0.5 + 0.5 * N.n2(ph * 23 + k * 5, t * 3.1));
          }
        }
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows - 1; j++) { const a = base + i * rows + j, b = a + rows; idx.push(a, b, a + 1, b, b + 1, a + 1); }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(att, 4));
      g.setIndex(idx); g.computeVertexNormals();
      { const nr = g.attributes.normal.array; for (let i = 0; i < pos.length; i += 3) { const dx = -pos[i], dz = 400 - pos[i + 2], l = Math.hypot(dx, dz) || 1, x = 0.45 * nr[i] + 0.55 * dx / l, y = 0.45 * nr[i + 1] + 0.2, z = 0.45 * nr[i + 2] + 0.55 * dz / l, m = Math.hypot(x, y, z) || 1; nr[i] = x / m; nr[i + 1] = y / m; nr[i + 2] = z / m; } }
      g.computeBoundingSphere();
      const rankMat = new THREE.ShaderMaterial({
        uniforms: { ...S }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec4 aR; varying vec4 vR; varying vec3 vN; varying vec3 vWp;
          void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vR=aR; vN=mat3(modelMatrix)*normal; gl_Position=projectionMatrix*viewMatrix*wp; }`,
        fragmentShader: /* glsl */`varying vec4 vR; varying vec3 vN; varying vec3 vWp;
          ${STYLE_GLSL}
          void main(){
            vec3 n=normalize(vN+vec3(0.,1e-4,0.)); float t=clamp(vR.x,0.,1.), k=clamp(vR.z,0.,4.)/4.;
            float form=clamp(dot(n,uLight),0.,1.), beds=sin(dot(vWp,uDipN)*.021+vR.w*2.)*.5+.5;
            vec3 rock=mix(uPal[4],uPal[5],mix(.1,.74,k))*uHour.y;                  // each rank paler than the one before, the last a step darker than the sky
            rock*=.93+.05*form+.04*beds*(1.-k);                                     // a ghost of the bedded rock: soft modelling from the one light
            float el=vWp.y/max(length(vWp.xz-cameraPosition.xz),1.);                // the tangent of its angle over the level, as the eye has it
            float foot=max(1.-smoothstep(-.1,.6,t),1.-smoothstep(.07,.27,el));      // paler at the feet than the summit, by its own height and by what stands clear of the banks: each rank stands on pale air
            vec3 col=mix(rock,mix(uPal[5],uPal[6],.42)*mix(1.,uHour.y,.5),foot);
            float al=clamp(vR.y,0.,1.); al=al*al*(3.-2.*al)*smoothstep(0.,.3,t);   // the crest lost into the air; the feet stand on air
            gl_FragColor=vec4(col,al);
          }` });
      const ranks = new THREE.Mesh(g, rankMat); ranks.frustumCulled = false; ranks.renderOrder = 1; scene.add(ranks);
    }
    await ctx.yield();

    // ---- level water: the flooded cave floor and the brook stepping 0.6 m at a time; the river; the cleft; the far river
    const waterMat = waterMaterial(S), paleWaterMat = waterMaterial(S, { pale: 0.5 });
    waterMat.side = THREE.DoubleSide; paleWaterMat.side = THREE.DoubleSide; waterMat.uniforms.uGrow.value = 1; paleWaterMat.uniforms.uGrow.value = 0.6;      // the brook and the river stream in full lanes of tone
    const STEPS = [], levelWater = [];
    const ribbon = (zs, f) => {      // f(z) -> [xLeft(+X), xRight(-X), y, (zL, zR optional)]
      const pos = [], idx = [];
      for (let i = 0; i < zs.length; i++) { const r = f(zs[i]); pos.push(r[0], r[2], r[3] ?? zs[i], r[1], r[2], r[4] ?? zs[i]); if (i) { const a = i * 2 - 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
    };
    {
      const zs = []; let py = brookY(-26);
      for (let z = -26; z <= 156; z += 0.25) {
        const y = brookY(z);
        if (y !== py) { zs.push([z - 0.3, py], [z + 0.05, y]); STEPS.push({ z, y0: py, y1: y }); py = y; } else if (Math.abs((z + 26) % 2) < 0.01) zs.push([z, y]);
      }
      const pos = [], idx = [];
      zs.forEach((e, i) => {
        const z = e[0], r = routeAt(z), s = caveSec(Math.min(z, 110)), k = sm(108, 115, z), end = sm(150, 156, z);
        pos.push(r[0] + lerp(s.ap + 1.5, 4.8, k), e[1] - end * 1.2, z, r[0] - lerp(s.as + 1.5, 4.8, k), e[1] - end * 1.2, z);
        if (i) { const a = i * 2 - 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      levelWater.push(g);
    }
    scene.add(new THREE.Mesh(ribbon(axis(770, 3900, (v) => 30 + (v - 770) * 0.03), (z) => { const w = riverW(z) + 6 + (z - 770) * 0.022; return [riverX(z) + w, riverX(z) - w, 0.9]; }), paleWaterMat));
    levelWater.push(ribbon(axis(-6, 420, () => 30), (a) => {
      const cx = CLEFT[0] + CLEFT_DIR[0] * a, cz = CLEFT[1] + CLEFT_DIR[1] * a, w = 24;
      return [cx - CLEFT_DIR[1] * w, cx + CLEFT_DIR[1] * w, 0.05, cz + CLEFT_DIR[0] * w, cz - CLEFT_DIR[0] * w];
    }));
    scene.add(new THREE.Mesh(joinGeo(levelWater, ['position']), waterMat));      // the brook's floor and the cleft: one draw (the river is laid with the pool's own material, after the hero)
    await ctx.yield();

    // ---- the sky: veiled grey weather, no sun. A low bright band to 6 degrees, pale green-blue, azurite darkest overhead; six piled cloud scrolls low over the last range
    const HOUR = { noon: { band: pal[6].clone(), bandE: 0.105, zen: 1 }, gold: { band: pal[6].clone().lerp(pal[2], 0.36), bandE: 0.13, zen: 0.94 }, dusk: { band: pal[6].clone().lerp(pal[5], 0.42), bandE: 0.055, zen: 0.62 } }[hourKey];
    waterMat.uniforms.uBandW.value.copy(HOUR.band); paleWaterMat.uniforms.uBandW.value.copy(HOUR.band);
    const scr = [];
    for (let i = 0; i < 6; i++) scr.push(new THREE.Vector4(lerp(-1.3, 0.62, i / 5) + rng.range(-0.1, 0.1), rng.range(0.2, 0.33), rng.range(0.17, 0.27), i % 2 ? 1 : -1));
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uBand: { value: HOUR.band }, uBandE: { value: HOUR.bandE }, uZen: { value: pal[4].clone().multiplyScalar(HOUR.zen) }, uScr: { value: scr } },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD=position; vec4 p=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position=p; }`,
      fragmentShader: /* glsl */`varying vec3 vD; uniform vec3 uBand; uniform vec3 uZen; uniform float uBandE; uniform vec4 uScr[6];
        ${STYLE_GLSL}
        void main(){
          vec3 d=vD/max(length(vD),1e-4); float e=d.y;
          vec3 mid=mix(uPal[5],uZen,.3)*vec3(.98,1.02,.99);
          vec3 col=mix(uBand,mid,smoothstep(uBandE,uBandE+.24,e));
          col=mix(col,uZen,smoothstep(.3,.97,e));
          col=mix(col,mix(uPal[5],uBand,.4),1.-smoothstep(-.04,0.,e));
          float az=atan(d.x,d.z+1e-5), el=asin(clamp(e,-1.,1.));
          for(int i=0;i<6;i++){
            float fi=float(i);
            vec2 q=vec2((az-uScr[i].x)*cos(el),el-uScr[i].y)/(uScr[i].z*.4);      // a PILED scroll, about as high as wide: three lobes at its foot, two on them, one on top
            vec2 cc=vec2(.4*uScr[i].w,.36), qd=q-cc;
            float sw=(1.-smoothstep(0.,.95,length(qd)))*(1.0+.35*sin(uTime*.08+fi*1.7))*uScr[i].w, cs=cos(sw), sn=sin(sw);
            vec2 w=cc+vec2(qd.x*cs-qd.y*sn,qd.x*sn+qd.y*cs);                 // its upper edge curls over on one side and turns slowly, as the eddies do
            float d=0.;
            for(int j=0;j<6;j++){ float fj=float(j);
              vec2 c=j<3?vec2(-.5+.5*fj,-.18+.05*sin(fi*2.+fj)):(j<5?vec2(-.26+.52*(fj-3.),.2+.06*sin(fi+fj)):vec2(.06*sin(fi*1.3),.55));
              float rr=(j<3?.42:(j<5?.37:.28))*(1.+.12*sin(fi*1.9+fj*2.3));
              d=max(d,1.-length(w-c)/rr); }
            float m=smoothstep(0.,.7,d)*smoothstep(-.5,-.26,w.y)*smoothstep(-.02,.08,el);
            float lit=clamp(.38+.7*w.y+.4*d-.25*w.x,0.,1.);                  // lit from above and a little from port; grey-blue below
            col=mix(col,mix(mix(uPal[5],uPal[4],.4),uBand,lit),m*.78);
          }
          gl_FragColor=vec4(col,1.);
        }`,
      depthWrite: false, depthTest: false, side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 40, 24), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---- THE STRAND RULE for every other water: bundles of parallel strands winding to a hooked scroll (the hero's lock and fall shaders)
    const lockBatch = (max) => {
      const A = { aO: [3, new Float32Array(max * 3)], aU: [3, new Float32Array(max * 3)], aV: [3, new Float32Array(max * 3)], aP: [4, new Float32Array(max * 4)], aQ: [4, new Float32Array(max * 4)], aK: [4, new Float32Array(max * 4)] };
      let n = 0;
      return {
        // o origin, u stem direction, v the side the scroll winds to; b: { ns, sp, stem, R, k, turns, birth, phase, mode, lit, crown, fill, body }
        add(o, u, v, b) {
          const wb = Math.max((b.ns - 1) / 2 * b.sp, 0.05);
          if (b.body && n < max) {
            A.aO[1].set([o[0] - (b.bodyOff ? b.bodyOff[0] : 0), o[1] - (b.bodyOff ? b.bodyOff[1] : 0.1), o[2] - (b.bodyOff ? b.bodyOff[2] : 0)], n * 3); A.aU[1].set(u, n * 3); A.aV[1].set(v, n * 3);
            A.aP[1].set([b.stem, b.R, b.k, b.turns], n * 4); A.aQ[1].set([0, b.birth, b.phase, wb + b.sp * 0.9], n * 4); A.aK[1].set([b.mode, -1, 0, wb], n * 4); n++;
          }
          for (let s = 0; s < b.ns && n < max; s++, n++) {
            A.aO[1].set(o, n * 3); A.aU[1].set(u, n * 3); A.aV[1].set(v, n * 3);
            A.aP[1].set([b.stem, b.R, b.k, b.turns], n * 4);
            A.aQ[1].set([(s - (b.ns - 1) / 2) * b.sp, b.birth + 0.03 * (s / b.ns), b.phase + s * 0.0007, b.sp * (b.fill ?? 0.42)], n * 4);
            A.aK[1].set([b.mode, b.lit, b.crown || 0, wb], n * 4);
          }
        },
        mesh(segs, mat) { const m = new THREE.Mesh(strandGeometry(segs, A, Math.max(n, 1)), mat); m.frustumCulled = false; scene.add(m); return m; },
        get count() { return n; },
      };
    };
    const fallBatch = (bundles, o) => {      // a small fall on the hero's parabola: o { ns, sp, spread, dep, plait, body }
      const max = bundles * o.ns + 3, O = new Float32Array(max * 3), U = new Float32Array(max * 3), P = new Float32Array(max * 4), K = new Float32Array(max * 4);
      let n = 0;
      for (let q = 0; q < 3; q++, n++) { const zb = -0.7 + 0.7 * q; O.set([zb * o.spread * 0.55, o.dep * 4, rng.range(0, 6.28)], n * 3);      // the dark body: a slim core behind the plait
        U.set([0.1, 0.06, (q % 2 ? 1 : -1) * 1.5], n * 3); P.set([0, -0.2, rng.range(0, 6.28), o.body], n * 4); K.set([-1, 0, rng(), 0], n * 4); }
      for (let bi = 0; bi < bundles; bi++) {
        const zb = lerp(-1, 1, (bi + 0.5) / bundles) * o.spread, dep = rng.range(-1, 1) * o.dep, tw = rng.range(0, 6.28), turns = rng.range(1.5, 3) * (bi % 2 ? 1 : -1), ph = rng.range(0, 6.28), pale = rng.range(0.2, 0.7) * (o.pale ?? 1), seed = rng();
        for (let s = 0; s < o.ns; s++, n++) {
          O.set([zb, dep, tw], n * 3); U.set([o.plait, o.plait * 0.7, turns], n * 3);
          P.set([(s - (o.ns - 1) / 2) * o.sp, -0.2, ph, o.sp * 0.44], n * 4); K.set([0.45 + 0.55 * Math.pow(s / (o.ns - 1), 1.5), pale, seed + s * 0.013, 0], n * 4);
        }
      }
      return strandGeometry(28, { aO: [3, O], aU: [3, U], aP: [4, P], aK: [4, K] }, n);
    };
    // the rill: five locks of 7.9 to 8.1 m, their tops 7.9, 7.5, 7.0, 6.7 and 6.2 m to port of the way in the cave and 3.5 to 3.7 m over it, each from inside the hood's rock (rillTop) down through the roof of its hollow to the cave's water; where the port wall itself stands in the wall-side lock's line, that lock's strands toward the wall come out of the wall's face under the roof, as in live (see THE HOLLOW'S BACK WALL)
    const rillMat = strandMaterial(S, 'lock', { lines: 3, wave: 0.22, waves: 1.6, waveSpeed: 2.2, far: 0.62, minW: 0.0017 });      // minW: from the cave's head its strands are closer than a pixel: they are drawn wide enough to touch, and each lock is then one soft olive-grey body, paler down its outer side
    {
      const rb = lockBatch(48), ud = [-0.08, -0.9968, 0];
      for (let i = 0; i < 5; i++) {
        const h = i % 2 ? 1 : -1, top = rillTop(i), len = 8.4 + 0.5 * (i % 3) - top[3];      // live's lock, begun lower on its own line: its foot and its scroll are where they always were
        rb.add([top[0], top[1], top[2]], ud, [-0.9 * h, -0.0722 * h, 0.43 * h].map((v) => v / 1.0001),
          { ns: 7, sp: 0.066, stem: len, R: rng.range(0.4, 0.6), k: 0.25, turns: rng.range(1.7, 2.2), birth: -0.5, phase: rng(), mode: 1, lit: 1, crown: 0, fill: 0.46, body: 1, bodyOff: [-0.14, 0, 0] });      // (its own dark body just behind it, toward the wall)
      }
      rb.mesh(28, rillMat);
    }
    // the brook slides off the lip at z 152 and falls to the pool
    const LIPP = new THREE.Vector3(routeAt(153)[0], brookY(152) - 0.4, 153);
    const slideProf = [];      // the ground under the slide's 78 m run, from the lip to the pool: the water keeps to it, going over every ledge
    for (let i = 0; i <= 16; i++) { const z = 153 + 78 * i / 16; let y = 0; for (const dx of [-0.8, 0, 0.8]) for (const dz of [-1.6, 0, 1.6]) { const x = LIPP.x + dx, h = H(x, z + dz); y = Math.max(y, terr(x, h, z + dz, nearAmt(x, z + dz, h))); } slideProf.push(y + 0.3 - LIPP.y); }
    slideProf[0] = 0; for (let i = 1; i <= 16; i++) slideProf[i] = Math.min(slideProf[i], slideProf[i - 1] - 0.05); slideProf[16] = -LIPP.y;
    const slideMat = strandMaterial(S, 'fall', { lines: 4, run: 2.4, fine: 3, far: 0.62, slide: slideProf });
    slideMat.uniforms.uGrow.value = 0; slideMat.uniforms.uLip.value.set(0, 0, 0); slideMat.uniforms.uFoot.value.set(-78, -LIPP.y, 0);
    const slide = new THREE.Mesh(fallBatch(4, { ns: 7, sp: 0.11, spread: 1.25, dep: 0.16, plait: 1.0, body: 0.5, pale: 1.4 }), slideMat);      // a plait of four broad locks one can count going over the edge, lying on the brook's own olive body
    slide.position.copy(LIPP); slide.rotation.y = Math.PI / 2; slide.frustumCulled = false; scene.add(slide);
    await ctx.yield();
    // the brook: locks down the flooded floor, a small rosette under every 0.6 m step, plaits round the three stones; wakes on the river
    const brookMat = strandMaterial(S, 'lock', { lines: 3, wave: 0.1, waves: 1.5, waveSpeed: 2.2, flow: 4, turnAmp: 0.25, turnRate: 0.9, ang: 0.18 }),      // ang: a sixth of a lock's segments to its straight stem, the rest to its scroll, finest on the outer winding: round at 4 m
      riverMat = strandMaterial(S, 'lock', { lines: 4, wave: 0.55, waves: 1.3, waveSpeed: 1.6, flow: 2, turnAmp: 0.25, turnRate: 0.6, ang: 0.3 });      // (the wakes' scrolls take most of their segments too: round from the last straight)
    const brook = lockBatch(384), wake = lockBatch(Math.round(208 * detail));      // 26 wakes whole: the ravine's, to z 740 (the last eight, far out on the plain, are dealt and left)
    const flat = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; return [dx / l, 0, dz / l]; }, sideOf = (d, h) => [d[2] * h, 0, -d[0] * h];
    for (const st of STEPS) {
      const r = routeAt(st.z), n = 3;
      for (let q = 0; q < n; q++) {
        const open = st.z >= 112, off = (q - (n - 1) / 2) * (open ? 1.25 : 2.6) + rng.range(-0.3, 0.3), d = flat(rng.range(-0.25, 0.25) * (open ? 0.4 : 1), 1), h = open ? (Math.round(st.z) % 2 ? 1 : -1) : q % 2 ? 1 : -1;      // on the open shelf a step's locks all wind the one way, each a long combed stem to one hooked scroll at its side (two that wind to meet make a hoop, seen from above)
        // THE STRAND RULE: seven strands to every lock, a slim band (wd, 0.33 to 0.5 m) no wider than a third of its scroll's radius, wound one and a half to two turns, so dark
        // water shows between the windings. In the cave two locks to a step; on the open shelf one, on alternate hands, so each can be followed down to the lip (the others' numbers are drawn and left: every later draw falls as before).
        const wd = (rng.int(5, 7) - 1) * 0.083, stem = rng.range(1.2, 2.4) * (open ? 2.3 : 1), R = Math.max(rng.range(0.55, 0.95) * (open ? 0.8 : 1), 3.4 * wd), turns = rng.range(1.5, 2.0), phase = rng(), lit = rng.range(0.8, 1);
        if (open ? st.z < 146 && q === (Math.round(st.z) % 2 ? 0 : 2) : q !== 1) brook.add([r[0] + off, st.y1 + 0.07, st.z + 0.25], d, sideOf(d, h), { ns: 7, sp: wd / 6, stem, R, k: 0.25, turns, birth: -0.5, phase, mode: 0, lit, crown: 0.05, body: 1 });
      }
    }
    for (const s of STONES) {
      const r = routeAt(s[1]), y = brookY(s[1] + 1) + 0.07;
      for (const h of [-1, 1]) { const d = flat(h * 0.3, 1); brook.add([r[0] + s[0] + h * (s[2] + 0.45), y, s[1] - s[2] * 1.2], d, sideOf(d, h), { ns: 7, sp: 0.4 / 6, stem: s[2] * 2.6, R: Math.max(s[2] * 0.6, 1.24), k: 0.26, turns: 2, birth: -0.5, phase: rng(), mode: 0, lit: 0.95, crown: 0.04, body: 1 }); }
    }
    for (let i = 0; i < 16; i++) {      // quieter locks down the cave's wide water and the mouth
      const z = rng.range(-4, 108), r = routeAt(z), s = caveSec(z), x = r[0] + rng.range(-s.as + 2.5, Math.min(s.ap - 2.5, 20)), d = flat(rng.range(-0.3, 0.3), 1), h = rng.chance(0.5) ? 1 : -1;
      const nsD = rng.int(5, 8), wd = (nsD - 1) * 0.094, ns = Math.max(7, nsD), stem = rng.range(2, 5), R = Math.max(rng.range(0.7, 1.5), 3.4 * wd), turns = rng.range(1.5, 2.0), phase = rng(), lit = rng.range(0.6, 0.95);
      if (i % 2 === 0) brook.add([x, brookY(z + 2) + 0.06, z], d, sideOf(d, h), { ns, sp: wd / (ns - 1), stem, R, k: 0.25, turns, birth: -0.5, phase, mode: 0, lit, crown: 0.05, body: 1 });
    }
    for (let i = 0; i < 9; i++) {      // and down the shelf to the lip
      const z = 113 + i * 4.3 + rng.range(-1, 1), r = routeAt(z), d = flat(rng.range(-0.2, 0.2) * 0.5, 1), h = i % 2 ? 1 : -1;
      const x = r[0] + rng.range(-1.6, 1.6), wd = (rng.int(5, 7) - 1) * 0.086, stem = rng.range(1.6, 3.2) * 1.7, R = Math.max(rng.range(0.6, 1.0) * 0.85, 3.4 * wd), turns = rng.range(1.5, 2.0), phase = rng(), lit = rng.range(0.8, 1);
      if (i % 2 === 0 && !STEPS.some((st) => st.z >= 112 && st.z < 146 && Math.abs(st.z - z) < 4.5)) brook.add([x, brookY(z + 1.5) + 0.06, z],      // (none beside a step's own lock: no two touch)
        d, sideOf(d, h), { ns: 7, sp: wd / 6, stem, R, k: 0.25, turns, birth: -0.5, phase, mode: 0, lit, crown: 0.05, body: 1 });
    }
    { const z = 9.5, r = routeAt(z), d = flat(0.12, 1);      // one lock with its scroll in the water to port of the way at the cave's head
      brook.add([r[0] + 4.4, brookY(z + 2) + 0.06, z], d, sideOf(d, 1), { ns: 7, sp: 0.062, stem: 3.4, R: 1.2, k: 0.25, turns: 1.9, birth: -0.5, phase: 0.37, mode: 0, lit: 0.95, crown: 0.05, body: 1 }); }
    brook.mesh(Math.round(34 * (detail * 0.5 + 0.5)), brookMat);
    for (let i = 0; i < 34; i++) {      // the river's wakes, combed down the ravine and out over the plain
      const z = i < 26 ? rng.range(446, 740) : rng.range(740, 1100), x = riverX(z) + rng.range(-0.75, 0.75) * riverW(z), d = flat(riverX(z + 10) - riverX(z) + rng.range(-1.5, 1.5), 10), h = x > riverX(z) ? -1 : 1;
      const R = rng.range(1.8, 3.2);
      wake.add([x, 0.2, z], d, sideOf(d, h), { ns: 7, sp: R * 0.052, fill: 0.36, stem: rng.range(7, 16), R, k: 0.23, turns: rng.range(1.6, 2.2), birth: -0.5, phase: rng(), mode: 0, lit: rng.range(0.7, 1), crown: 0.2, body: 1 });
    }
    wake.mesh(28, riverMat);
    // the pool's own locks, 8 to 25 m: drawn by the current along the skim and into the outflow, a fan under the brook's
    // slide; each a long stem curling off to a round hooked scroll (the scroll's segments even by angle: no corner near the eye)
    const poolLockMat = strandMaterial(S, 'lock', { lines: 4, wave: 0.3, waves: 1.2, waveSpeed: 1.5, flow: 2.4, turnAmp: 0.28, turnRate: 0.6, bend: 0.6, ang: 0.34, far: 0.8, farLit: 0.6, airK: 0.3 }), pl = lockBatch(368);
    {
      const OUT = [-46, 452], plLock = (x, z, d, h, stem, R, birth) => pl.add([x, 0.2, z], d, sideOf(d, h), { ns: 7, sp: R * 0.068, fill: 0.36, stem, R, k: rng.range(0.2, 0.24), turns: rng.range(1.6, 2.1), birth, phase: rng(), mode: 0, lit: rng.range(0.7, 1), crown: 0.22, body: 1 });
      for (let i = 0; i < 28; i++) {      // down the skim: one after another along the way flown, to either hand of it
        const z = 350 + i * 3.4 + rng.range(-2, 2), r = routeAt(z), sg = i % 2 ? 1 : -1, x = r[0] + sg * (i % 3 === 0 ? rng.range(1.5, 4) : i % 3 === 1 ? rng.range(7, 16) : rng.range(18, 34));
        if (Math.hypot(x - POOL[0], z - POOL[1]) > POOL_R - 9 || Math.hypot(x - 72, z - 330) < 60) continue;
        const d = flat(OUT[0] - x + rng.range(-14, 14), OUT[1] - z + rng.range(-8, 8));
        plLock(x, z, d, sg * (rng.chance(0.8) ? 1 : -1), rng.range(11, 21), rng.range(2.0, 3.4), i % 3 ? -0.5 : 0.15 + 0.5 * rng());
      }
      for (let i = 0; i < 4; i++) {       // the fan the brook's slide feeds where it meets the pool
        const a = lerp(-0.75, 0.75, i / 3) + rng.range(-0.1, 0.1), d = flat(Math.sin(a) + 0.25, Math.cos(a));
        plLock(LIPP.x + Math.sin(a) * 3, 234.5 + Math.cos(a) * 3, d, a > 0 ? -1 : 1, rng.range(8, 15), rng.range(1.5, 2.4), -0.5);
      }
      for (let i = 0; i < 8; i++) {       // the quiet water's own slow curls, 20 to 25 m: the current goes round the starboard half from the brook's slide to the outflow
        const ph = lerp(-0.2, 1.75, (i + rng.range(0.15, 0.85)) / 8), r = i % 2 ? rng.range(40, 60) : rng.range(68, 90), x = POOL[0] - Math.sin(ph) * r, z = POOL[1] - Math.cos(ph) * r;
        const d = flat(-Math.cos(ph) + rng.range(-0.2, 0.2), Math.sin(ph) + rng.range(-0.2, 0.2)), R = rng.range(3.6, 5.2);
        plLock(x, z, d, 1, rng.range(10, 15), R, -0.5);
      }
      for (let i = 0; i < 5; i++) {       // and where the pool draws together into the river
        const x = lerp(-78, -8, (i + rng.range(0.2, 0.8)) / 5), z = rng.range(418, 436), d = flat(riverX(470) - x, 470 - z);
        if (Math.hypot(x - POOL[0], z - POOL[1]) > POOL_R - 6) continue;
        plLock(x, z, d, x > riverX(450) ? -1 : 1, rng.range(9, 16), rng.range(1.8, 2.8), i % 2 ? -0.5 : 0.2 + 0.5 * rng());
      }
    }
    pl.mesh(Math.round(44 * (detail * 0.5 + 0.5)), poolLockMat);
    await ctx.yield();

    // ---- the far storm over the cleft's valley, 1.4 km to starboard: the far weather of his deluge sheets. ONE turbulent heap: four great coils of
    // plainly unequal size (the largest twice the smallest) rolling over and into one another, the lesser ones (ten to fourteen in all, as dealt) on
    // their shoulders. A coil is not a disc with a spiral in it: it is bundles of curved streaming lines that sweep round its middle and stream off
    // its edge on one side. The heap's outline is lost into the sky above and on its lit side and firm only below. Under it the rain comes down as
    // three slanted sheets of straight parallel strands, all leaning the one way at 20 degrees, dense under the cloud and gone before the ground.
    // One sheet standing across the valley, depth tested (rock always hides it), depth writing off; it grows with the way flown from a knot
    // (two small coils) to six coils on the skim and the whole heap by the ravine.
    const coilA = [], coilB = [];
    {
      const GREAT = [[-70, 20, 122], [95, -25, 92], [0, 128, 74], [-190, 62, 60]];      // the first two are the knot
      for (let i = 0; i < 14; i++) {
        const d0 = rng.range(-1, 1), d1 = rng.range(0, 1), d2 = rng.range(0, 1), great = i < 4, k = i - 4;
        const a = great ? GREAT[i][0] + 14 * d0 : (k % 2 ? 1 : -1) * (120 + 150 * d1) + 40 * d0, b = great ? GREAT[i][1] + 16 * d1 : 150 - 0.55 * Math.abs(a) + 70 * d1 - 20 * (k % 3), R = great ? GREAT[i][2] * (0.94 + 0.12 * d2) : 34 + 22 * d2;
        const birth = i < 2 ? -0.5 : i < 6 ? lerp(0.0, 0.46, (i - 2) / 3) : lerp(0.58, 0.88, (i - 6) / Math.max(nCoils - 7, 1));      // six by the skim, all of them as we come down the ravine
        coilA.push(new THREE.Vector4(a, b, i < nCoils ? R : 1, birth));
        coilB.push(new THREE.Vector4(i % 2 ? 1 : -1, rng.range(0, 6.28), rng.range(0.6, 1), i < nCoils ? 1 : 0));
      }
    }
    const stormMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uGrow: { value: 0 }, uCoilA: { value: coilA }, uCoilB: { value: coilB } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */`varying vec2 vP; uniform float uGrow; uniform vec4 uCoilA[14]; uniform vec4 uCoilB[14];
        ${STYLE_GLSL}
        void main(){
          vec2 p=vP+26.*(vec2(lcN2(vP*.011+3.),lcN2(vP*.011+11.))-.5)+8.*(vec2(lcN2(vP*.04),lcN2(vP*.04+5.))-.5);      // no coil is a ruled circle
          float px=fwidth(vP.x)+fwidth(vP.y)+1e-3;      // metres to a pixel, taken once (never inside the loop)
          float body=0., veil=0., st=.3, lift=.5, tail=0., all=.45+.55*smoothstep(0.,.7,uGrow);
          for(int i=0;i<14;i++){      // each coil rolls over the ones before it and into them: its lines run on through its soft edge
            vec4 A=uCoilA[i], B=uCoilB[i];
            float born=smoothstep(A.w,A.w+.1,uGrow)*B.w, R=A.z*(.5+.5*born)*all;
            vec2 q=(p-A.xy*all)/max(R,1.); float r=length(q);
            float th=atan(q.y,q.x+(abs(q.x)<1e-4?1e-4:0.));
            // NO OUTLINE on a coil's upper and lit side: its body ends well inside it there and thins into its own streaming strands, which run on
            // out into the sky and die over a band as wide as a small coil; beneath, where the rain leaves it, it is firm. No lobe is a clean round.
            // A lesser coil is strands almost all round (none stands at the heap's edge as a round of its own): only the great ones have a firm underside.
            float up=mix(smoothstep(-.62,.18,q.y+.25*q.x),1.,.85*(1.-smoothstep(54.,60.,A.z)));
            float rr=r*(1.+.4*up*(lcN2(q/max(r,.04)*2.3+B.y)-.5));
            float a=(1.-smoothstep(mix(.84,.4,up),mix(1.08,1.25,up),rr))*born;
            // the streaming lines: two bundles of strands to a turn, on spirals that wind in to the coil's eye and turn slowly
            float sp=(B.x*th+log(max(r,.04))/.5+B.y+uTime*.1*B.x)/6.2832*2.;
            float bun=1.-smoothstep(.34,.5,abs(fract(sp)-.5)), f=abs(fract(sp*4.)-.5);
            float gap=max(r,.04)*R*.196, aa=clamp(px/gap,0.,1.);      // how far apart its strands lie here, in metres; in pixels
            float ln=mix(1.-smoothstep(.2-.5*aa,.2+.5*aa,f),.42,smoothstep(.28,.6,aa))*bun*(.6+.4*B.z)*smoothstep(.03,.12,r);      // strands closer than three pixels are their flat tint
            float zone=up*smoothstep(.1,.6,rr);      // above, the body is carried by its strands alone: a veil of them, never a rim
            st=mix(st,ln,a); lift=mix(lift,clamp(q.y*.5+.5,0.,1.),a); body=1.-(1.-body)*(1.-a*(1.-zone)); veil=max(veil,a*a*zone*mix(.5,1.,clamp(ln*2.3,0.,1.)));
            float off=max((1.-smoothstep(1.,1.75,r))*smoothstep(.9,1.05,r)*smoothstep(.1,.8,cos(th-B.y*B.x-1.2)),up*smoothstep(.22,.6,rr)*(1.-smoothstep(.7,1.6,rr)))*born;      // they stream off its edge on one side, and off its whole upper side into the air
            tail=max(tail,ln*off);
          }
          // the far weather: olive-grey azurite, the darkest thing in the far sky (darker than the rank it stands before), paler than any near rock
          vec3 dk=mix(uPal[4],uPal[3],.42)*.84*mix(1.,uHour.y,.5), md=mix(uPal[4],uPal[3],.22), lt=mix(uPal[4],uPal[5],.5);
          vec3 col=mix(mix(dk,md,st),lt,st*st*(.45+.5*lift));      // piled: paler on the coils' upper sides
          float al=max(max(smoothstep(0.,.55,body)*.96,veil*.86),tail*.68*(1.-body));
          // the rain: three slanted sheets of straight strands under the heap (the sheet's own plain coordinate: nothing bends them)
          float xs=vP.x-vP.y*.364, cell=xs/15., id=floor(cell), fr=abs(fract(cell)-.5), ar=clamp(px/15.,0.,1.);
          float strand=mix(1.-smoothstep(.17-.5*ar,.17+.5*ar,fr),.34,smoothstep(.28,.6,ar));
          float sheet=max(max(1.-smoothstep(40.,75.,abs(xs+185.)),1.-smoothstep(55.,95.,abs(xs+15.))),1.-smoothstep(35.,70.,abs(xs-160.)));
          float foot=-190.-150.*lcH(vec2(id,3.7));      // each strand ends where it will
          float env=sheet*smoothstep(foot-40.,foot+110.,vP.y)*(1.-smoothstep(-60.,30.,vP.y))*smoothstep(.2,.55,uGrow);
          float ra=strand*env*.56*(1.-al);
          col=mix(md,col,al/max(al+ra,1e-3));
          gl_FragColor=vec4(col,clamp(al+ra,0.,1.));
        }`,
    });
    {
      const g = new THREE.PlaneGeometry(900, 760); g.translate(0, -100, 0);      // the heap in its upper part, the rain hanging under it
      const storm = new THREE.Mesh(g, stormMat); storm.position.copy(STORM); storm.rotation.y = Math.atan2(-30 - STORM.x, 430 - STORM.z); storm.renderOrder = 2; storm.frustumCulled = false; scene.add(storm);
    }
    await ctx.yield();

    // ---- twenty slow veils of air drifting through the cave's mouth: a medium we pass through (alpha under 0.12, thinning by each point's own distance from the eye: whole at 62 m, nothing within 30 m)
    const veilMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uVeil: { value: HOUR.band.clone().lerp(pal[5], 0.5) } },
      vertexShader: /* glsl */`attribute vec4 aC; attribute vec3 aS; uniform float uTime; varying vec2 vUv; varying float vA; varying vec3 vVp;
        void main(){ vec3 c=aC.xyz+vec3(sin(uTime*.11+aC.w*6.28)*aS.z,sin(uTime*.07+aC.w*9.)*1.5,cos(uTime*.09+aC.w*4.)*5.);
          vec3 wp=c+vec3(position.x*aS.x,position.y*aS.y,0.); vUv=position.xy;
          vVp=wp; vA=.6+.4*sin(uTime*.13+aC.w*20.);
          gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`,
      fragmentShader: /* glsl */`varying vec2 vUv; varying float vA; varying vec3 vVp; uniform vec3 uVeil;
        void main(){ float r=clamp(1.-dot(vUv,vUv),0.,1.); gl_FragColor=vec4(uVeil,.115*r*r*clamp(vA,0.,1.)*smoothstep(30.,62.,distance(vVp,cameraPosition))); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    {
      const n = 20, C = new Float32Array(n * 4), S = new Float32Array(n * 3), sc = caveSec(110);
      for (let i = 0; i < n; i++) { C.set([sc.cx + rng.range(-sc.as, sc.ap), sc.cy + rng.range(-3, sc.up), rng.range(100, 126), rng()], i * 4); S.set([rng.range(9, 17), rng.range(4, 8), rng.range(4, 9)], i * 3); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 3)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 90, 110), 80);
      const veils = new THREE.Mesh(g, veilMat); veils.renderOrder = 8; veils.frustumCulled = false; scene.add(veils);
    }

    // ---- PLANTS: his studied plants, instanced, shaded by the same glaze; whorls wind and unwind with each gust as the eddies do
    const PLANT_VERT = /* glsl */`attribute vec3 aI; uniform float uTime; uniform vec3 uWind; varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      void main(){
        vec3 p=position, n=normal;
        vec4 o=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
        float gust=.5+.5*sin(uTime*1.5+aI.x*6.28+o.x*.05+o.z*.07)*sin(uTime*.6+aI.x*11.);
        float ang=aI.y*gust*1.5708*clamp(length(p.xz)*2.4,0.,1.), ca=cos(ang), sa=sin(ang);
        p.xz=mat2(ca,-sa,sa,ca)*p.xz; n.xz=mat2(ca,-sa,sa,ca)*n.xz;
        vec4 wp=modelMatrix*instanceMatrix*vec4(p,1.);
        vec2 aw=wp.xz-uWind.xy; float dw=max(length(aw),1.);
        vec2 push=aw/dw*uWind.z*(1.-smoothstep(20.,90.,dw))+vec2(.42,.3)*(gust-.4);
        float sway=color.b*color.b;
        wp.xz+=push*sway*(.35+.65*gust)*aI.z; wp.y-=sway*.12*gust*aI.z;
        vWp=wp.xyz; vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n+vec3(0.,1e-4,0.)); vC=color;
        gl_Position=projectionMatrix*viewMatrix*wp; }`;
    const PLANT_FRAG = /* glsl */`varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      ${STYLE_GLSL}
      void main(){
        vec3 n=normalize(vN+vec3(0.,1e-4,0.)); if(n.y<0.) n=-n;
        float pd=distance(vWp,cameraPosition), leaf=1.-smoothstep(.0,.3,vC.g);
        float tone=clamp(lcTone(n)*.75+.25,0.,1.)*clamp(vC.r,0.,1.)*mix(1.,mix(1.,.5,leaf),smoothstep(28.,80.,pd));      // a plant far off is a dark olive tuft on its rock, never a pale scratch
        vec3 local=vC.g<.5?mix(uPal[3],uPal[1],clamp(vC.g*2.,0.,1.)):mix(uPal[1],uPal[6],clamp(vC.g*2.-1.,0.,1.));
        local=mix(local,mix(uPal[3],uPal[6],.22),leaf*smoothstep(.55,.95,tone)*.6*(1.-smoothstep(20.,50.,pd)));      // the glaze thin on a lit leaf, near
        gl_FragColor=vec4(lcAir(lcGlaze(local,tone),vWp),1.);
      }`;
    const WIND = new THREE.Vector3(78, 330, 0);
    const plantMat = new THREE.ShaderMaterial({ uniforms: { ...S, uWind: { value: WIND } }, vertexShader: PLANT_VERT, fragmentShader: PLANT_FRAG, vertexColors: true, side: THREE.DoubleSide });
    const plantBuilder = () => {
      const pos = [], nrm = [], col = [], idx = [];
      const B = {
        // a ribbon through pts with half widths ws; side(i) gives the unit vector it widens along; c(t) -> [tone, pigment, sway]
        strip(pts, ws, side, c) {
          const base = pos.length / 3, n = pts.length;
          for (let i = 0; i < n; i++) {
            const p = pts[i], a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], s = side(i), w = ws[i], cc = c(i / (n - 1));
            const tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
            let nx = ty * s[2] - tz * s[1], ny = tz * s[0] - tx * s[2], nz = tx * s[1] - ty * s[0]; const l = Math.hypot(nx, ny, nz) || 1; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
            pos.push(p[0] - s[0] * w, p[1] - s[1] * w, p[2] - s[2] * w, p[0] + s[0] * w, p[1] + s[1] * w, p[2] + s[2] * w);
            nrm.push(nx / l, ny / l, nz / l, nx / l, ny / l, nz / l); col.push(cc[0], cc[1], cc[2], cc[0], cc[1], cc[2]);
            if (i) { const q = base + i * 2 - 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
          }
        },
        tri(a, b, c, cc, cc2) {
          const base = pos.length / 3, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
          pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) nrm.push(nx / l, ny / l + 0.4, nz / l);
          col.push(...cc, ...(cc2 || cc), ...(cc2 || cc)); idx.push(base, base + 1, base + 2);
        },
        // a flower: np petals of length r round c, cupped by lift, tilted along nod (a horizontal vector, 0 = facing up)
        flower(c, r, np, lift, cc, a0 = 0) {
          for (let k = 0; k < np; k++) {
            const a = a0 + (k / np) * 6.2832, d = [Math.cos(a), 0, Math.sin(a)], s = [-d[2], 0, d[0]], w = r * 0.34;
            B.tri(c, [c[0] + d[0] * r * 0.6 + s[0] * w, c[1] + lift * 0.6, c[2] + d[2] * r * 0.6 + s[2] * w], [c[0] + d[0] * r, c[1] + lift, c[2] + d[2] * r], cc);
            B.tri(c, [c[0] + d[0] * r * 0.6 - s[0] * w, c[1] + lift * 0.6, c[2] + d[2] * r * 0.6 - s[2] * w], [c[0] + d[0] * r, c[1] + lift, c[2] + d[2] * r], cc);
          }
        },
        stem(a, b, w, cc, bow = 0, n = 4) {
          const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + bow * Math.sin(t * 3.1416), lerp(a[2], b[2], t)]); }
          const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, s = l < 1e-3 ? [1, 0, 0] : [-dz / l, 0, dx / l];
          B.strip(pts, pts.map(() => w), () => s, (t) => [cc[0], cc[1], cc[2] * t]);
          return pts;
        },
        lump(c, r, sq, cc, seed) {
          const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, base = pos.length / 3;
          for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.22 * N.n3(x * 1.7 + seed, y * 1.7, z * 1.7);
            pos.push(c[0] + x * r * k, c[1] + y * r * sq * k, c[2] + z * r * k); nrm.push(x, y * 0.8 + 0.25, z);
            col.push(cc[0] * (0.72 + 0.28 * sm(-0.6, 0.7, y)), cc[1], cc[2] * sm(-1, 1, y)); idx.push(base + i);
          }
          g.dispose();
        },
        geo() {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
        },
      };
      return B;
    };
    const prng = rng.fork ? rng.fork('plants') : rng;
    const xr = ctx.core.makeRng((((ctx.seed | 0) * 7919) ^ 0x5bd1e995) >>> 0);      // a second, separate run of draws for plants seated later: the first run's order stays as it was
    const KIND = {};
    {
      let B = plantBuilder();      // star-of-Bethlehem: a whorl 0.8 m across whose leaves swirl as the eddies do, small white stars at its heart
      for (let k = 0; k < 17; k++) {
        const a = (k / 17) * 6.2832 + prng.range(-0.1, 0.1), L = 0.4 * prng.range(0.72, 1), pts = [], sd = [];
        for (let i = 0; i <= 4; i++) { const t = i / 4, an = a + 1.3 * t * t + 0.25 * t, ro = L * t; pts.push([Math.cos(an) * ro, 0.04 + 0.27 * Math.sin(3.1416 * Math.min(t * 1.15, 1)), Math.sin(an) * ro]); sd.push([-Math.sin(an + 0.9 * t), 0.25, Math.cos(an + 0.9 * t)]); }
        B.strip(pts, [0.016, 0.04, 0.042, 0.028, 0.003], (i) => sd[i], (t) => [0.62 + 0.38 * t, 0.06 * t, t]);
      }
      for (let k = 0; k < 6; k++) { const a = k * 1.05, r = k ? 0.085 : 0, top = [Math.cos(a) * r * 1.7, 0.36 + 0.05 * (k % 3), Math.sin(a) * r * 1.7]; B.stem([Math.cos(a) * r * 0.3, 0.02, Math.sin(a) * r * 0.3], top, 0.007, [0.7, 0.1, 0.5]); B.flower(top, 0.085, 6, 0.024, [1, 1, 0.5], k); }
      KIND.whorl = B.geo();
      B = plantBuilder();          // columbine: nodding spurred flowers on arching stems over lobed leaves
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + 0.4, d = [Math.cos(a), 0, Math.sin(a)], h = 0.75 + 0.2 * k, top = [d[0] * 0.22, h, d[2] * 0.22];
        B.stem([0, 0, 0], top, 0.008, [0.75, 0.25, 1], 0.05, 5);
        const fc = [top[0] + d[0] * 0.07, h - 0.05, top[2] + d[2] * 0.07];
        B.flower(fc, 0.085, 5, -0.07, [1, 0.96, 1], k); B.flower([fc[0], fc[1] + 0.012, fc[2]], 0.06, 5, 0.085, [0.9, 0.62, 1], k + 0.63);
      }
      for (let k = 0; k < 6; k++) {
        const a = k * 1.047 + 0.2, r = 0.2 + 0.07 * (k % 2), c = [Math.cos(a) * r, 0.2 + 0.1 * (k % 3), Math.sin(a) * r];
        B.stem([0, 0, 0], c, 0.005, [0.6, 0.2, 0.6]); B.flower(c, 0.075, 3, 0.012, [0.8, 0.02, 0.7], a); B.flower(c, 0.05, 3, 0.02, [0.95, 0.04, 0.7], a + 1.05);
      }
      KIND.columbine = B.geo();
      B = plantBuilder();          // violets: a low clump of heart leaves and small pale flowers
      for (let k = 0; k < 7; k++) { const a = k * 2.4, r = 0.05 + 0.017 * k, c = [Math.cos(a) * r, 0.03 + 0.011 * k, Math.sin(a) * r]; B.flower(c, 0.075, 2, 0.03, [0.72 + 0.04 * k, 0, 0.5], a); B.flower(c, 0.05, 2, 0.02, [0.9, 0, 0.5], a + 1.57); }
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.5, c = [Math.cos(a) * 0.07, 0.13 + 0.02 * k, Math.sin(a) * 0.07]; B.stem([0, 0.02, 0], c, 0.004, [0.7, 0.2, 0.8], 0.01, 2); B.flower(c, 0.034, 5, 0.006, [1, 0.9, 1], k); }
      KIND.violet = B.geo();
      B = plantBuilder();          // wood anemone: a ruff of three cut leaves under one six-petalled white flower
      for (let k = 0; k < 5; k++) {
        const a = k * 1.26, r = 0.1 + 0.03 * k, base = [Math.cos(a) * r * 0.3, 0, Math.sin(a) * r * 0.3], mid = [Math.cos(a) * r, 0.17, Math.sin(a) * r], top = [Math.cos(a) * r * 1.15, 0.27 + 0.02 * k, Math.sin(a) * r * 1.15];
        B.stem(base, top, 0.005, [0.7, 0.2, 1], 0.01, 3); B.flower(mid, 0.1, 3, 0.02, [0.78, 0, 0.6], a); B.flower(mid, 0.07, 3, 0.03, [0.92, 0.03, 0.6], a + 1.05); B.flower(top, 0.055, 6, 0.014, [1, 1, 1], a);
      }
      KIND.anemone = B.geo();
    }
    await ctx.yield();
    {
      const arc = (a, len, lean, n, drop = 0) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, out = lean * t * t * len; pts.push([Math.cos(a) * out, len * t * (1 - drop * t), Math.sin(a) * out]); } return pts; };
      let B = plantBuilder();      // iris: a fan of sword blades
      for (let k = 0; k < 8; k++) { const a = k * 0.8 + 0.3, len = 0.8 + 0.07 * ((k * 5) % 7), pts = arc(a, len, 0.3, 4, 0.1).map((p) => [p[0] + Math.cos(a) * 0.03, p[1], p[2] + Math.sin(a) * 0.03]), s = [-Math.sin(a + 0.6), 0, Math.cos(a + 0.6)]; B.strip(pts, [0.03, 0.036, 0.03, 0.02, 0.002], () => s, (t) => [0.6 + 0.4 * t, 0.05, t]); }
      KIND.iris = B.geo();
      B = plantBuilder();          // ivy: a hanging stem of pointed leaves. NO LEAF OVER 0.3 m (three times life): the longest is 0.212 m as modelled and no ivy is set larger than 1.4 (the long trails: 0.323 m, never larger than 0.9)
      { const pts = []; for (let i = 0; i <= 9; i++) { const t = i / 9; pts.push([0.22 * Math.sin(t * 5), -3.6 * t, 0.18 * Math.sin(t * 3.3 + 1)]); }
        B.strip(pts, pts.map(() => 0.028), () => [1, 0, 0], (t) => [0.55, 0.45, t]);
        for (let k = 0; k < 17; k++) { const t = (k + 0.5) / 17, c = [0.22 * Math.sin(t * 5), -3.6 * t, 0.18 * Math.sin(t * 3.3 + 1)], a = k * 2.4, d = [Math.cos(a), -0.35, Math.sin(a)], s = [-Math.sin(a), 0, Math.cos(a)], L = 0.15 + 0.025 * (k % 3), w = L * 0.6, cc = [0.44 + 0.26 * ((k * 3) % 4) / 3, 0.02, t];
          const tip = [c[0] + d[0] * L, c[1] + d[1] * L, c[2] + d[2] * L], m = [c[0] + d[0] * L * 0.45, c[1] + d[1] * L * 0.3, c[2] + d[2] * L * 0.45];
          B.tri(c, [m[0] + s[0] * w, m[1], m[2] + s[2] * w], tip, cc); B.tri(c, [m[0] - s[0] * w, m[1], m[2] - s[2] * w], tip, cc); } }
      KIND.ivy = B.geo();
      B = plantBuilder();
      { const at = (t) => [0.3 * Math.sin(t * 7) + 0.12 * Math.sin(t * 17), -8 * t, 0.24 * Math.sin(t * 4.6 + 1)], pts = []; for (let i = 0; i <= 14; i++) pts.push(at(i / 14));
        B.strip(pts, pts.map(() => 0.035), () => [1, 0, 0], (t) => [0.5, 0.45, t]); B.strip(pts, pts.map(() => 0.035), () => [0, 0, 1], (t) => [0.5, 0.45, t]);
        for (let k = 0; k < 50; k++) { const t = (k + 0.5) / 50, c = at(t), a = k * 2.4, d = [Math.cos(a), -0.4, Math.sin(a)], sd = [-Math.sin(a), 0, Math.cos(a)], Lf = (0.24 + 0.03 * (k % 3)) * (1 - 0.3 * t), w = Lf * 0.6, cc = [0.42 + 0.26 * ((k * 3) % 4) / 3, 0.02, t];
          const tip = [c[0] + d[0] * Lf, c[1] + d[1] * Lf, c[2] + d[2] * Lf], m = [c[0] + d[0] * Lf * 0.45, c[1] + d[1] * Lf * 0.3, c[2] + d[2] * Lf * 0.45];
          B.tri(c, [m[0] + sd[0] * w, m[1], m[2] + sd[2] * w], tip, cc); B.tri(c, [m[0] - sd[0] * w, m[1], m[2] - sd[2] * w], tip, cc); } }
      KIND.ivyLong = B.geo();
      B = plantBuilder();          // maidenhair and bramble: wiry arching stems hung with small fans
      for (let k = 0; k < 5; k++) { const a = k * 1.4, len = 1.1 + 0.25 * k, pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([Math.cos(a) * 0.5 * t, 0.25 * Math.sin(t * 2.2) - len * t * t, Math.sin(a) * 0.5 * t]); }
        B.strip(pts, pts.map(() => 0.006), () => [-Math.sin(a), 0, Math.cos(a)], (t) => [0.5, 0.5, t]);
        for (let i = 1; i <= 8; i++) { const t = i / 8.5, j = Math.min(Math.floor(t * 6), 5), f = t * 6 - j, c = [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f), lerp(pts[j][2], pts[j + 1][2], f)], sgn = i % 2 ? 1 : -1, s = [-Math.sin(a) * sgn, 0, Math.cos(a) * sgn], w = 0.075;
          B.tri(c, [c[0] + s[0] * w * 1.5 + 0.03, c[1] - 0.02, c[2] + s[2] * w * 1.5], [c[0] + s[0] * w, c[1] - w * 1.3, c[2] + s[2] * w + 0.03], [0.75 + 0.2 * (i % 3) / 2, 0.03, t]); } }
      KIND.maiden = B.geo();
      B = plantBuilder();          // bulrush: tall blades and two dark heads
      for (let k = 0; k < 4; k++) { const a = k * 1.65, len = 1.6 + 0.12 * ((k * 3) % 5), pts = arc(a, len, 0.16, 4).map((p) => [p[0] + Math.cos(a) * 0.06, p[1], p[2] + Math.sin(a) * 0.06]); B.strip(pts, [0.026, 0.028, 0.024, 0.016, 0.002], () => [-Math.sin(a), 0, Math.cos(a)], (t) => [0.6 + 0.4 * t, 0.08, t]); }
      for (let k = 0; k < 2; k++) { const x = k ? 0.07 : -0.05, h = 1.9 + 0.25 * k; B.stem([x, 0, 0.02], [x * 1.5, h, 0.03], 0.008, [0.7, 0.3, 1], 0, 3);
        for (let q = 0; q < 2; q++) { const a = q * 1.571, s = [Math.cos(a), 0, Math.sin(a)]; B.strip([[x * 1.5, h - 0.02, 0.03], [x * 1.5, h + 0.14, 0.03], [x * 1.5, h + 0.3, 0.03]], [0.01, 0.038, 0.012], () => s, () => [0.42, 0.5, 1]); } }
      KIND.bulrush = B.geo();
      B = plantBuilder();          // sedge: a tuft of arching blades
      for (let k = 0; k < 7; k++) { const a = k * 2.4, len = 0.7 + 0.05 * ((k * 3) % 7); B.strip(arc(a, len, 0.75, 4, 0.35), [0.014, 0.017, 0.014, 0.009, 0.001], () => [-Math.sin(a), 0, Math.cos(a)], (t) => [0.58 + 0.42 * t, 0.1 * t, t]); }
      KIND.sedge = B.geo();
      B = plantBuilder();          // fern: fronds whose edges are cut into pinnae
      for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.2, len = 1.0 + 0.1 * (k % 3), n = 6, pts = arc(a, len, 0.85, n, 0.45), ws = pts.map((p, i) => 0.14 * (1 - Math.pow(i / n, 1.4)) * (i % 2 ? 1 : 0.42) + 0.004); B.strip(pts, ws, () => [-Math.sin(a), 0, Math.cos(a)], (t) => [0.6 + 0.4 * t, 0.04, t]); }
      KIND.fern = B.geo();
      B = plantBuilder();          // juniper: a dark close spire
      B.lump([0, 2.3, 0], 1.25, 1.9, [0.5, 0, 0.25], 1.1); B.lump([0.15, 4.6, 0.1], 0.85, 2.0, [0.56, 0, 0.5], 4.2); B.stem([0, 0, 0], [0, 1.2, 0], 0.13, [0.5, 0.5, 0], 0, 1);
      KIND.juniper = B.geo();
      B = plantBuilder();          // the round-headed tree
      B.stem([0, 0, 0], [0.15, 3.6, 0.1], 0.2, [0.55, 0.5, 0], 0, 2); B.stem([0, 0, 0.01], [0.15, 3.6, 0.11], 0.2, [0.55, 0.5, 0], 0, 2);
      B.lump([0.1, 5.2, 0], 2.3, 0.85, [0.74, 0, 0.3], 2.2); B.lump([-1.3, 4.4, 0.8], 1.5, 0.8, [0.66, 0, 0.3], 5.5); B.lump([1.4, 4.5, -0.6], 1.55, 0.8, [0.7, 0, 0.3], 8.1);
      KIND.tree = B.geo();
    }
    await ctx.yield();
    // instancing: list entries are [x, y, z, yaw, scale, twist, sway, (tilt quaternion)]
    const _m4 = new THREE.Matrix4(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _s3 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const plantMeshes = [];
    const plantMesh = (geo, list) => {
      const n = Math.max(list.length, 1), g = geo.clone(), I = new Float32Array(n * 3), m = new THREE.InstancedMesh(g, plantMat, n);
      for (let i = 0; i < list.length; i++) {
        const e = list[i]; _qa.setFromAxisAngle(_up, e[3]); if (e[7]) _qa.premultiply(e[7]);
        _m4.compose(_p.set(e[0], e[1], e[2]), _qa, _s3.setScalar(e[4])); m.setMatrixAt(i, _m4); I.set([prng(), e[5], e[6]], i * 3);
      }
      if (!list.length) { _m4.makeScale(0, 0, 0); m.setMatrixAt(0, _m4); }
      g.setAttribute('aI', new THREE.InstancedBufferAttribute(I, 3)); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); scene.add(m); plantMeshes.push(m); return m;
    };

    // ---- THE HERO: the dam, the high lake, the fall, the rosette, the beds, the bore (world coordinates)
    const wayPts = []; for (let d = 0; d <= path.length; d += 0.5) { path.posAtDist(d, _p); if (Math.hypot(_p.x - 72, _p.z - 330) < 60) wayPts.push(_p.x, _p.y, _p.z); }      // the way past the fall, every 0.5 m: the hero keeps its volutes 3 m clear of it, at build
    const hero = await buildHero(ctx, { inWorld: true, detail, greatCurls: nGreat, hand, twin: rare, style: S, band: HOUR.band, way: wayPts, bedWindow: [uAtZ(269.5), uAtZ(325)] });      // the house-sized bed lets go as we come down along the dam and is in the pool as we reach the column
    scene.add(hero.object);
    const A = hero.anchors;
    // the river: the pool's own water running out. One material with the pool (one tone across the join, by world position) and laid
    // 0.3 m under the pool's disc, so no two water surfaces ever share a plane
    { const rv = new THREE.Mesh(ribbon(axis(424, 770, () => 6), (z) => [riverX(z) - riverW(z) - 8, riverX(z) + riverW(z) + 8, -0.3]), hero.poolMaterial); scene.add(rv); }      // (starboard edge first: the ribbon then faces up, as the pool's one-sided material needs)
    await ctx.yield();

    // ---- where the plants stand
    const groundY = (x, z) => { const h = H(x, z); return terr(x, h, z, nearAmt(x, z, h)); };
    const dens = (n) => Math.max(1, Math.round(n * detail * density));
    const L = { whorl: [], columbine: [], violet: [], anemone: [], iris: [], ivy: [], ivyLong: [], maiden: [], bulrush: [], sedge: [], fern: [], juniper: [], tree: [] };
    const yaw = () => prng.range(0, 6.2832);
    const tiltTo = (nx, ny, nz) => new THREE.Quaternion().setFromUnitVectors(_up, _q.set(nx, ny, nz).normalize());
    {
      // the flower ledge in the cave: small clumps at no more than three times life
      const ledgeY = (x, z) => { let y = -1e3; for (const b of LEDGE.blocks) { const dx = (x - b.x) / b.rx, dz = (z - b.z) / b.rz, q = 1 - Math.abs(dx) ** 5 - Math.abs(dz) ** 5; if (q > 0.05) y = Math.max(y, b.y + b.ry * Math.pow(q, 0.2) * 0.97 + dx * b.rx * 0.1); } return y - 0.08; };
      const onLedge = (list, n, x0, x1, sc0, sc1, tw, sw) => { for (let i = 0, k = 0; i < n && k < n * 20; k++) { const z = prng.range(LEDGE.z0 + 1, LEDGE.z1 - 1), x = routeAt(z)[0] - 6.1 + prng.range(x0, x1), y = ledgeY(x, z); if (y < 0 || routeD3(x, y + 0.4, z) < 3.1) continue; list.push([x, y, z, yaw(), prng.range(sc0, sc1), tw, sw]); i++; } };
      for (const e of [[11, 2.05, 0], [12.7, 2.5, 1], [14.6, 2.0, 0], [16.4, 2.6, 1], [18.6, 2.1, 0], [21, 2.5, 1]]) { const x = routeAt(e[0])[0] - 6.1 + e[1], y = ledgeY(x, e[0]); if (y > 0 && routeD3(x, y + 0.4, e[0]) > 3.1) (e[2] ? L.columbine : L.whorl).push([x, y, e[0], yaw(), e[2] ? 1.15 : 1.05, e[2] ? 0.12 : 1, e[2] ? 0.5 : 0.25]); }
      onLedge(L.whorl, dens(26), 0.3, 1.9, 0.9, 1.1, 1, 0.25); onLedge(L.columbine, dens(20), -1.4, 1.4, 0.9, 1.3, 0.12, 0.5); onLedge(L.violet, dens(24), 0.2, 2.0, 0.9, 1.3, 0.1, 0.3);
      onLedge(L.anemone, dens(24), -0.6, 1.9, 0.9, 1.3, 0.2, 0.4); onLedge(L.iris, dens(14), -1.8, 0.2, 0.9, 1.3, 0.05, 0.5); onLedge(L.fern, dens(14), -2.0, -0.4, 0.9, 1.3, 0.1, 0.6);
      // the shelf beside the brook, and the same plants where the banks of the river run in under the gap
      const strew = (list, n, zr, lat0, lat1, sc0, sc1, tw, sw, cx, ok) => { for (let i = 0, k = 0; i < n && k < n * 30; k++) { const z = prng.range(zr[0], zr[1]), x = cx(z) + prng.range(lat0, lat1) * (prng.chance(0.5) ? 1 : -1), y = groundY(x, z); if (ok && !ok(x, y, z)) continue; list.push([x, y - 0.04, z, yaw(), prng.range(sc0, sc1), tw, sw]); i++; } };
      const rX = (z) => routeAt(z)[0], dry = (x, y, z) => y > brookY(Math.min(z, 152)) + 0.25;
      strew(L.whorl, dens(9), [114, 150], 5, 9, 0.9, 1.1, 1, 0.25, rX, dry); strew(L.columbine, dens(9), [113, 151], 5, 11, 0.9, 1.2, 0.12, 0.5, rX, dry); strew(L.violet, dens(16), [113, 151], 4.6, 10, 0.9, 1.3, 0.1, 0.3, rX, dry);
      strew(L.anemone, dens(14), [113, 151], 4.6, 12, 0.9, 1.3, 0.2, 0.4, rX, dry); strew(L.iris, dens(20), [112, 152], 3.4, 5.2, 0.9, 1.25, 0.05, 0.5, rX); strew(L.sedge, dens(38), [110, 154], 3.2, 5.4, 0.8, 1.3, 0.15, 0.7, rX);
      strew(L.bulrush, dens(14), [112, 152], 3.4, 4.6, 0.7, 1.0, 0.05, 0.8, rX);
      strew(L.sedge, dens(56), [111, 153], 5, 17, 0.8, 1.5, 0.15, 1.8, rX, dry); strew(L.violet, dens(14), [112, 152], 5, 15, 1, 1.5, 0.1, 0.6, rX, dry);
      strew(L.anemone, dens(14), [112, 152], 5, 15, 1, 1.5, 0.3, 0.8, rX, dry); strew(L.whorl, dens(16), [113, 151], 5.5, 13, 0.9, 1.1, 1, 0.3, rX, dry);
      for (let st = 0; st < Math.round(28 * detail); st++) {      // clumps 3 to 7 m from the way on both hands, every few metres of the shelf: iris blades, whorls with swirling leaves, columbine, sedge at the water
        const z = 113.5 + st * (37.5 / Math.round(28 * detail)) + xr.range(-0.5, 0.5), sgx = st % 2 ? 1 : -1, x0 = rX(z) + sgx * xr.range(3.4, 6.6), kind = st % 6;
        for (let c = 0; c < (kind === 1 || kind === 4 ? 2 : 5); c++) {
          const x = x0 + xr.range(-0.6, 0.6), zz = z + xr.range(-0.7, 0.7), y = groundY(x, zz), wet = !dry(x, y, zz), ya = xr.range(0, 6.2832), sc = xr.range(1.05, 1.45);
          if (wet || kind === 2) L.sedge.push([x, y - 0.04, zz, ya, sc, 0.15, 0.7]);
          else if (kind === 0 || kind === 3) L.iris.push([x, y - 0.04, zz, ya, sc * 0.95, 0.05, 0.5]);
          else if (kind === 1 || kind === 4) { L.whorl.push([x + (c ? 1.1 : 0), y - 0.04, zz, ya, sc * 0.8, 1, 0.25]); L.anemone.push([x - 0.5, groundY(x - 0.5, zz + 0.6) - 0.04, zz + 0.6, ya, sc, 0.2, 0.4]); }
          else (c < 3 ? L.columbine : L.violet).push([x, y - 0.04, zz, ya, sc * 0.9, c < 3 ? 0.12 : 0.1, c < 3 ? 0.5 : 0.3]);
        }
      }
      // bulrush and sedge at the water: the pool's rim and both banks of the river
      RX = riverX0; RW = riverW0; NK = () => 0;      // these two rules are dealt on the broad river's land, as they always were (every later draw of this run then falls as before); what they set in the narrows is left out
      for (let i = 0, k = 0; i < dens(96) && k < 8000; k++) { const a = prng.range(0, 6.2832), r = POOL_R + prng.range(-5, 5), x = POOL[0] + Math.sin(a) * r, z = POOL[1] + Math.cos(a) * r, h = H(x, z); if (h < -1.3 || h > 1.6 || x > 70) continue; (i % 5 < 3 ? L.bulrush : L.sedge).push([x, Math.max(h, -0.1) - 0.05, z, yaw(), prng.range(0.8, 1.35), 0.05, 0.8]); i++; }
      for (let i = 0, k = 0; i < dens(150) && k < 9000; k++) { const z = prng.range(438, 760), sg = prng.chance(0.5) ? 1 : -1, x = riverX0(z) + sg * (riverW0(z) + prng.range(-1.5, 4)), h = H(x, z); if (h < -1.3 || h > 1.8) continue; const e = [x, Math.max(h, -0.1) - 0.05, z, yaw(), prng.range(0.8, 1.4), 0.05, 0.8]; if (z < LIP_Z0 - 4 || z > 630) (i % 5 < 3 ? L.bulrush : L.sedge).push(e); i++; }
      RX = riverX; RW = riverW; NK = narrowK;
      {      // the ravine: bulrush and sedge stand in the water at the foot of every block of both lips, just out from its nose (a run of draws of their own), and at the two corners of the cleft's mouth
        const rv = ctx.core.makeRng((((ctx.seed | 0) * 31337) ^ 0x2545f491) >>> 0);
        for (let sd = 0; sd < 2; sd++) for (const B of lipBlocks[sd]) for (let c = 0; c < Math.round(3 * detail); c++) {
          const z = rv.range(B[0] + 0.5, B[1] - 0.5), x = riverX(z) + (sd ? -1 : 1) * (riverW(z) - LIP_OVER + B[2] - rv.range(0.4, 1.4));
          (c % 3 < 2 ? L.bulrush : L.sedge).push([x, -0.14, z, rv.range(0, 6.2832), c % 3 < 2 ? rv.range(1.0, 1.5) : rv.range(1.2, 1.8), 0.05, 0.8]);
        }
        for (let sd = 0; sd < 2; sd++) for (const B of lipBlocks[sd]) for (let c = 0; c < Math.round(2 * detail); c++) {      // fern on the lips' tops, near the nose, lying with the bed
          const z = rv.range(B[0] + 0.6, B[1] - 0.6), t = rv.range(0.5, 2.3), sg = sd ? -1 : 1, x = riverX(z) + sg * (riverW(z) - LIP_OVER + B[2] + t), y = lipY(z, !sd) + B[3] + (sd ? -0.25 - 0.48 * (t - 0.5) : t * SD / CD);
          L.fern.push([x, y + 0.02, z, rv.range(0, 6.2832), rv.range(1.3, 2.1), 0.1, 0.7, tiltTo(-SD, CD, 0)]);
        }
        for (let c = 0; c < Math.round(10 * detail); c++) { const z = c % 2 ? rv.range(499, 506) : rv.range(546, 553), x = riverX(z) - riverW(z) + rv.range(0.3, 1.6); (c % 5 < 3 ? L.bulrush : L.sedge).push([x, -0.14, z, rv.range(0, 6.2832), rv.range(1.0, 1.5), 0.05, 0.8]); }
      }
      await ctx.yield();
      // the port wall at the cave's head, the dark wing beside the rill: maidenhair hanging from the lowest line of the hood's rim down the brook from the rill, fern at the wall's foot where the wet is, ivy on the roof's nearest rib,
      // two clumps of iris and sedge on the bank at the water (placed by rule, no draw taken: every later draw falls as before)
      {
        const t = [0, 0, 0], hq = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
        const wallAt = (z, y) => { let x = 0, best = 1e9; for (let q = 0; q <= 48; q++) { cavePt(z, -0.9 + 1.9 * q / 48, t); const e = Math.abs(t[1] - y); if (e < best) { best = e; x = t[0]; } } return x; };      // the port wall's x at this height
        // the five maidenhair by the rill hang from the lowest line of the hood's rim down the brook from the hollow, as built 1.7 to 3.14 m from the hood's middle (MAID: where each
        // is tried first). A plant tries its place, then 0.12 and 0.24 m and then 0.2 and 0.32 m to either hand of it, each with its own turn and fifteen further turns of 0.4;
        // a place less than 0.25 m along the brook from a plant already set is passed over (no two of the five stand closer: as built 0.30 m and more); the first is taken at
        // which four fifths or more of every stem's length (the stems as KIND.maiden has them) lies outside the hood and in front of the wall; failing all, the best
        const MAID = [1.7, 2, 2.3, 2.6, 2.9];
        const hoodAt = (z) => { let i = 0; if (z < hoodRows[0][0][2] || z > hoodRows[hoodRows.length - 1][0][2]) return null; while (i < hoodRows.length - 2 && hoodRows[i + 1][0][2] < z) i++; const a = hoodRows[i], b = hoodRows[i + 1], w = (z - a[0][2]) / (b[0][2] - a[0][2]); return a.map((p, j) => [lerp(p[0], b[j][0], w), lerp(p[1], b[j][1], w)]); };
        const rock = (x, y, z) => {      // in the wall, or in the hood (inside its section there, closed through the wall)
          if (x > shellTri(y, z, true)) return true; const q = hoodAt(z); if (!q) return false; let c = false;
          for (let i = 0, j = q.length - 1; i < q.length; j = i++) if ((q[i][1] > y) !== (q[j][1] > y) && x < (q[j][0] - q[i][0]) * (y - q[i][1]) / (q[j][1] - q[i][1]) + q[i][0]) c = !c;
          return c;
        };
        const freeOf = (e) => {      // the least share of a stem's length in free air, of a plant's five stems
          let worst = 1;
          for (let k = 0; k < 5; k++) {
            const a = k * 1.4, len = 1.1 + 0.25 * k, c = Math.cos(e[3]), sn = Math.sin(e[3]); let free = 0, tot = 0, px = e[0], py = e[1], pz = e[2];
            for (let i = 1; i <= 30; i++) { const tt = i / 30, lx = Math.cos(a) * 0.5 * tt, ly = 0.25 * Math.sin(tt * 2.2) - len * tt * tt, lz = Math.sin(a) * 0.5 * tt, x = e[0] + e[4] * (lx * c + lz * sn), y = e[1] + e[4] * ly, z = e[2] + e[4] * (-lx * sn + lz * c), d = Math.hypot(x - px, y - py, z - pz); tot += d; if (!rock((x + px) / 2, (y + py) / 2, (z + pz) / 2)) free += d; px = x; py = y; pz = z; }
            worst = Math.min(worst, free / tot);
          }
          return worst;
        };
        const took = [];
        for (let i = 0; i < 5; i++) {
          let best = null, bs = -1;
          for (const du of [0, 0.12, -0.12, 0.24, -0.24, 0.2, -0.2, 0.32, -0.32]) {
            const z = HOOD.z + MAID[i] + du; if (took.some((v) => Math.abs(v - z) < 0.25)) continue;
            for (let q = 0; q < 16 && bs < 0.8; q++) { const sec = hoodAt(z), e = [sec[14][0], sec[14][1] - 0.04, z, 6.28 * hq(i + 3) + 0.4 * q, 1.1 + 0.3 * hq(i + 5), 0.1, 1], f = freeOf(e); if (f > bs) { bs = f; best = e; } }
            if (bs < 0.8) await ctx.yield();      // (the hand goes back after every place that fails, and after each plant)
          }
          took.push(best[2]); L.maiden.push(best); await ctx.yield();
        }
        for (let i = 0; i < 4; i++) { const z = RILL_Z - 3.2 + 1.9 * i + 0.5 * hq(i + 20), y = brookY(z) + 0.05; L.fern.push([wallAt(z, y + 0.3) - 0.5 - 0.5 * hq(i + 23), y, z, 6.28 * hq(i + 21), 1.0 + 0.3 * hq(i + 22), 0.1, 0.6]); }
        for (let i = 0; i < 5; i++) { cavePt(RIBS[0][0] - 0.6 + 0.3 * i, (0.2 + 0.07 * i) * Math.PI, t); L.ivy.push([t[0], t[1] + 0.25, t[2], 6.28 * hq(i + 30), 1.1 + 0.3 * hq(i + 31), 0.1, 1]); }
        for (let c = 0; c < 2; c++) for (let i = 0; i < 3; i++) { const z = 10.5 + 7.5 * c + 0.5 * i, y = brookY(z) + 0.02, x = wallAt(z, y + 0.3) - 0.6 - 0.35 * i; (c ? L.sedge : L.iris).push([x, y, z, 6.28 * hq(i + 40 + c * 5), 1.05 + 0.25 * hq(i + 43 + c * 5), c ? 0.15 : 0.05, c ? 0.7 : 0.5]); }
      }
      // ivy, bramble and maidenhair hang from the cave's roof, thickest at the mouth
      for (let i = 0; i < dens(150); i++) { const z = i % 4 === 0 ? prng.range(100, 109.5) : prng.range(3, 108), t = cavePt(z, prng.range(0.2, 0.8) * Math.PI, [0, 0, 0]); (i % 5 < 4 ? L.ivy : L.maiden).push([t[0], t[1] + 0.25, t[2], yaw(), prng.range(0.9, 1.4), 0.1, 1]); }
      for (let i = 0; i < dens(13); i++) { const t = cavePt(prng.range(101, 109.6), prng.range(0.16, 0.84) * Math.PI, [0, 0, 0]); if (routeD3(t[0], t[1] - 4, t[2]) > 3.2 && routeD3(t[0], t[1] - 7, t[2]) > 3.2) L.ivyLong.push([t[0], t[1] + 0.2, t[2], yaw(), prng.range(0.45, 0.8), 0.1, 1]); }      // long trails in the mouth, clear of the way
      // ivy and columbine on the two leaning pinnacles of the gap; fern, moss and maidenhair on the dam, shaken by the fall's wind
      // (their seats are the ledges of the two sheaves, as the blades were built: gapSeats)
      const gapPts = []; for (const side of gapSeats) for (const q of side) if (Math.abs(q[2] - GAP_Z) < 11 && Math.abs(q[0] - GAP_X) < 24 && q[1] > 1.2 && q[1] < 52) gapPts.push(q);
      for (let i = 0; i < dens(92) && gapPts.length; i++) {
        const k = prng.pick(gapPts), x = k[0], y = k[1], z = k[2], sg = x > GAP_X ? -1 : 1;
        if (y > 22 && i % 3) L.ivy.push([x + sg * 0.35, y, z, yaw(), prng.range(0.8, 1.4), 0.1, 1]);
        else if (y < 22 && i % 2) L.columbine.push([x + sg * 0.1, y, z, yaw(), prng.range(1, 1.4), 0.12, 0.5, tiltTo(sg * 0.8, 0.6, 0)]);
        else L.fern.push([x + sg * 0.1, y, z, yaw(), prng.range(0.9, 1.5), 0.1, 0.7, tiltTo(sg * 0.7, 0.7, 0)]);
      }
      {      // the two walls of the last straight: ivy, maidenhair and fern along six beds a side, from the water up, so the eye goes in along the plants to the gap
        for (let w = 0; w < 2; w++) {
          const wall = gapSeats[w ? 0 : 1].filter((q) => q[2] - GAP_Z > -34 && q[2] - GAP_Z < -3 && q[1] > 2 && q[1] < 38 && routeD3(q[0], q[1], q[2]) > 5), sg = w ? 1 : -1;
          const rows = [...new Set(wall.map((q) => q[3]))].sort((p, q) => p - q);      // the sheaf's own partings, from the water up
          for (let b = 0; b < 6 && b < rows.length; b++) {
            const cand = wall.filter((q) => q[3] === rows[b]).sort((p, q) => q[2] - p[2]);      // a row lies on one bed (it dips with the rock); nearest the gap first
            const hang = b % 3 !== 2, spot = () => cand[Math.min(Math.floor(Math.pow(xr(), 1.7) * cand.length), cand.length - 1)];      // thickest toward the gap
            for (let c = 0; c < Math.round((hang ? 5 : 6) * detail); c++) {
              const k = spot(), x = k[0], y = k[1], z = k[2];
              if (hang) for (let q = 0; q < 3; q++) L.ivy.push([x + sg * (0.3 + 0.12 * q), y - 0.2 * q, z - 0.3 + xr.range(-0.45, 0.45), xr.range(0, 6.2832), xr.range(1.0, 1.4), 0.1, 1]);      // four beds a side hang with ivy, three trails to a place
              else if (c % 2) L.maiden.push([x + sg * 0.2, y, z - 0.2, xr.range(0, 6.2832), xr.range(1.6, 2.4), 0.1, 1]);
              else L.fern.push([x + sg * 0.15, y, z - 0.15, xr.range(0, 6.2832), xr.range(1.5, 2.3), 0.1, 0.7, tiltTo(sg * 0.6, 0.6, -0.5)]);
            }
            if (hang) L.ivyLong.push([cand[0][0] + sg * 0.5, cand[0][1], cand[0][2] - 0.5, xr.range(0, 6.2832), xr.range(0.6, 0.9), 0.1, 1]);      // and one long trail at the row's end by the gap
          }
        }
      }
      for (const sg of [1, -1]) {      // from the gap's two lips: long trails hanging free beside the opening, dark on the pale gap; columbine at their feet by the water
        for (let b = 0; b < 6; b++) {      // the lip is the innermost rock at each height: the trail hangs from it into the open gap
          let best = null, bx = 1e9;
          for (const k of gapPts) { const dx = (k[0] - GAP_X) * sg; if (dx > 0 && dx < bx && k[1] > 20 + b * 3.8 && k[1] < 25.5 + b * 3.8) { bx = dx; best = k; } }
          if (best) for (let q = 0; q < 2; q++) {      // a FULL trail: four stems hung close together from the one place (the same two draws as ever; no leaf over 0.3 m)
            const ya = yaw(), sc = prng.range(0.7, 0.9);
            for (let e = 0; e < 2; e++) { const k = q * 2 + e; L.ivyLong.push([best[0] - sg * (0.5 + 0.5 * k), best[1] - 0.2 - 0.7 * k, best[2] - 0.4 - 0.55 * k, ya + 2.3 * e, e ? 1.6 - sc : sc, 0.1, 1]); }
          }
        }
        for (let q = 0, n = 0; q < 600 && n < 5 && gapPts.length; q++) {      // clumps on the lip of each mass at the water, on the side we come from: columbine nodding over fern, each clump large enough to read from the last straight
          const k = prng.pick(gapPts); if (!((k[0] - GAP_X) * sg > 0 && k[1] < 7 && k[2] < GAP_Z + 1)) continue;
          const tq = tiltTo(-sg * 0.55, 0.75, -0.35);
          for (let c = 0; c < 4; c++) (c < 3 ? L.columbine : L.fern).push([k[0] - sg * (0.2 + 0.25 * c), k[1] + 0.3 * (c % 2), k[2] - 0.3 + prng.range(-0.7, 0.7), yaw(), c < 3 ? prng.range(1.7, 2.3) : prng.range(1.6, 2.2), c < 3 ? 0.12 : 0.1, 0.5, tq]);
          n++;
        }
      }
      const dam = hero.object.children[0].children[0], dp = dam.geometry.attributes.position.array, dc = dam.geometry.attributes.color.array, qDam = tiltTo(-0.75, 0.66, 0);
      for (let i = 0, k = 0; i < dens(120) && k < 12000; k++) {
        const v = prng.int(0, dp.length / 3 - 1) * 3, x = dp[v] + 10, y = dp[v + 1], z = dp[v + 2] + 340;
        if (dc[v + 1] < 0.2 || y < 3 || y > 100 || Math.abs(z - 330) < 9 || z < 250 || z > 425 || ((Math.abs(z - 330) > 42 || y > 52) && prng() < 0.6)) continue;
        (i % 6 === 5 ? L.maiden : L.fern).push([x - 0.2, y + 0.1, z, yaw(), prng.range(1.3, 2.4), 0.1, 1, i % 6 === 5 ? null : qDam]); i++;
      }
      {      // and thick along the closest pass, on the ledges to either hand of the column
        const dn = dam.geometry.attributes.normal.array;
        for (let i = 0, k = 0; i < dens(100) && k < 30000; k++) {      // half of them close beside the column to port, where the look rests as we cross
          const v = prng.int(0, dp.length / 3 - 1) * 3, x = dp[v] + 10, y = dp[v + 1], z = dp[v + 2] + 340, zone = i % 4;
          if (dn[v + 1] < 0.02 || (zone < 2 ? z < 305 || z > 323 || y < 20 || y > 64 : y < 10 || y > 78 || (zone === 2 ? z < 288 || z > 322.5 : z < 337.5 || z > 358))) continue;
          (i % 4 === 3 ? L.maiden : L.fern).push([x - 0.25, y + 0.1, z, yaw(), prng.range(2.2, 3.0), 0.1, 1, i % 4 === 3 ? null : qDam]); i++;
        }
        for (let i = 0, k = 0; i < Math.round(96 * detail) && k < 60000; k++) {      // the port third of the closest pass is never bare, whatever the build's density: fern and maidenhair seated on the ledges the way goes down along
          const v = xr.int(0, dp.length / 3 - 1) * 3, x = dp[v] + 10, y = dp[v + 1], z = dp[v + 2] + 340;
          if (dn[v + 1] < 0.02 || z < 302 || z > 322.5 || y < 14 || y > 45) continue;
          (i % 3 === 2 ? L.maiden : L.fern).push([x - 0.25, y + 0.1, z, xr.range(0, 6.2832), xr.range(2.1, 3.0), 0.1, 1, i % 3 === 2 ? null : qDam]); i++;
        }
      }
      await ctx.yield();
      // fern and maidenhair on the undercut banks of the ravine
      for (let i = 0, k = 0; i < dens(105) && k < 6000; k++) {
        const z = prng.range(448, 700), sg = prng.chance(0.5) ? 1 : -1, x = riverX(z) + sg * (riverW(z) + prng.range(1.5, 10)), y = groundY(x, z);
        if (y < 1.2 || y > 22 || routeD3(x, y, z) < 4.5) continue;
        (i % 4 === 3 ? L.maiden : L.fern).push([x, y, z, yaw(), prng.range(1.2, 2.3), 0.1, 0.7, i % 4 === 3 ? null : tiltTo(-sg * 0.6, 0.8, 0)]); i++;
      }
      for (let i = 0, k = 0; i < dens(60) && k < 4000; k++) {      // ivy over the ravine's rims
        const z = prng.range(452, 684), sg = prng.chance(0.5) ? 1 : -1, x = riverX(z) + sg * (riverW(z) + prng.range(3, 8)), y = groundY(x, z), y0 = groundY(x - sg * 2.5, z);
        if (y - y0 < 3.5 || y < 6 || routeD3(x - sg * 1.2, y - 2, z) < 5) continue;
        L.ivy.push([x - sg * 1.2, y - 0.3, z, yaw(), prng.range(1, 1.4), 0.1, 1]); i++;
      }
      // dark junipers and round-headed trees on the ledges of the land
      const treeOk = (x, z, h) => !(h < 6 || h > 128 || routeXZ(x, z) < 24 || Math.abs(H(x + 3, z) - H(x - 3, z)) > 5.5 || (x > 100 && z > 244 && z < 452) || (z < 112 && x > -30 && x < 40));
      for (let i = 0, k = 0; i < dens(21) && k < 9000; k++) {      // copses: three or four dark heads together on a ledge
        const x = prng.range(NX0 + 10, NX1 - 10), z = prng.range(60, NZ1 - 10), h = H(x, z);
        if (!treeOk(x, z, h)) continue;
        for (let q = 0, n = i % 3 === 2 ? 2 : 4; q < n; q++) {
          const a = q * 1.7 + prng.range(0, 1), d = q ? prng.range(3, 6.5) : 0, tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d, th = H(tx, tz);
          if (q && !treeOk(tx, tz, th)) continue;
          (i % 3 === 2 ? L.juniper : L.tree).push([tx, terr(tx, th, tz, 0.92) - 0.3, tz, yaw(), prng.range(0.7, 1.3) * (q ? 0.85 : 1.1), 0.02, 0.5]);
        }
        i++;
      }
    }
    {      // the far wall round the pool's end (looked at across the column and from the dive): a copse of round-headed trees on a ledge of its face
      // and two junipers further to starboard, each rooted where the face stands at the height drawn for it (the wall rises from the pool's rim)
      const A0 = xr.range(0.42, 0.7);
      for (let g = 0; g < 2; g++) for (let n = 0, k = 0; n < (g ? 2 : 4) && k < 60; k++) {
        const A = g ? xr.range(0.04, 0.3) : A0 + xr.range(-0.09, 0.09), want = g ? xr.range(16, 30) : xr.range(22, 42); let d = 2;
        while (d < 18 && H(POOL[0] + Math.sin(A) * (POOL_R + d), POOL[1] + Math.cos(A) * (POOL_R + d)) < want) d += 0.5;
        const x = POOL[0] + Math.sin(A) * (POOL_R + d), z = POOL[1] + Math.cos(A) * (POOL_R + d), h = H(x, z);
        if (h > 62 || h < 8 || routeXZ(x, z) < 24) continue;
        (g ? L.juniper : L.tree).push([x, h - 1.2, z, xr.range(0, 6.2832), xr.range(1.1, 1.45), 0.02, 0.5]); n++;
      }
    }
    for (const k in L) { plantMesh(KIND[k], L[k]); KIND[k].dispose(); await ctx.yield(); }

    // ---- BIRDS: only kite, martin and duck. Pigment ramp: 0 umber, 0.5 raw umber, 0.75 ochre, 1 lead white
    const BIRD_FRAG = /* glsl */`varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      ${STYLE_GLSL}
      void main(){ vec3 n=normalize(vN+vec3(0.,1e-4,0.)); float g=clamp(vC.g,0.,1.);
        vec3 local=g<.5?mix(uPal[0],uPal[1],g*2.):(g<.75?mix(uPal[1],uPal[2],g*4.-2.):mix(uPal[2],uPal[6],g*4.-3.));
        if(vC.b>.5) local=uPal[3];
        float tone=clamp(lcTone(n)*.6+.4,0.,1.)*clamp(vC.r,0.,1.);
        gl_FragColor=vec4(lcAir(lcGlaze(local,tone),vWp),1.); }`;
    const birdMat = new THREE.ShaderMaterial({ uniforms: { ...S }, vertexColors: true, side: THREE.DoubleSide, fragmentShader: BIRD_FRAG,
      vertexShader: /* glsl */`varying vec3 vWp; varying vec3 vN; varying vec3 vC; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vec3 n=mat3(modelMatrix)*normal; if(n.y<0.) n=-n; vN=n; vC=color; gl_Position=projectionMatrix*viewMatrix*wp; }` });
    // the red kite, span 2.2 m: the companion, met three times
    const kite = new THREE.Group(), kiteWings = [], kiteTail = new THREE.Group(); scene.add(kite);
    {
      let B = plantBuilder(); B.lump([0, 0, 0], 0.115, 0.9, [0.95, 0.62, 0], 3.1); const body = new THREE.Mesh(B.geo(), birdMat); body.scale.set(1, 1, 3.4); kite.add(body);
      B = plantBuilder(); B.lump([0, 0.03, 0.42], 0.075, 0.9, [1, 0.97, 0], 6.6); B.tri([-0.02, 0.01, 0.48], [0.02, 0.01, 0.48], [0, -0.03, 0.56], [0.8, 0.8, 0]); kite.add(new THREE.Mesh(B.geo(), birdMat));
      const wingGeo = () => {
        const W = plantBuilder(), n = 9, pts = [], ws = [], cs = [];
        for (let i = 0; i <= n; i++) { const s = 0.9 * i / n, wr = Math.min(s / 0.42, 1), le = 0.13 + 0.17 * Math.sin(wr * 1.5708) - 0.42 * Math.max(s - 0.42, 0), c = lerp(0.34, 0.4, wr) - 0.24 * Math.max(s - 0.42, 0); pts.push([s, 0.03 * Math.sin(s * 3), le - c / 2]); ws.push(c / 2); cs.push(s < 0.4 ? 0.6 : s < 0.72 ? 0.93 : 0.3); }
        W.strip(pts, ws, () => [0, 0, 1], (t) => [0.95, cs[Math.round(t * n)], 0]);
        for (let f = 0; f < 5; f++) { const z0 = pts[n][2] + ws[n] - (f + 0.5) * ws[n] * 0.4, a = -0.25 - f * 0.2; W.tri([0.88, 0.02, z0 + 0.045], [0.88, 0.02, z0 - 0.045], [0.9 + 0.24 * Math.cos(a), 0.03, z0 + 0.24 * Math.sin(a)], [0.9, 0.08, 0]); }
        return W.geo();
      };
      for (const sg of [1, -1]) { const w = new THREE.Mesh(wingGeo(), birdMat); w.scale.x = sg; w.position.set(sg * 0.08, 0.03, 0); kite.add(w); kiteWings.push(w); }
      B = plantBuilder(); for (const sg of [1, -1]) { B.tri([0, 0, -0.3], [sg * 0.19, 0, -0.86], [0, 0, -0.62], [0.95, 0.74, 0], [0.85, 0.7, 0]); B.tri([0, 0, -0.3], [sg * 0.07, 0, -0.34], [sg * 0.19, 0, -0.86], [0.95, 0.74, 0], [0.85, 0.66, 0]); }
      kiteTail.add(new THREE.Mesh(B.geo(), birdMat)); kite.add(kiteTail);
    }
    // 200 martins flicking in skeins round the fall (orbits by the world's clock, in the vertex shader)
    const flyVert = (body) => /* glsl */`attribute vec4 aM; attribute vec4 aN; uniform float uTime; varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      void main(){ vec3 c; vec3 fwd; float flap; float sc=1.; ${body}
        fwd=fwd/max(length(fwd),1e-4); vec3 rt=cross(vec3(0.,1.,0.),fwd); rt=rt/max(length(rt),1e-4); vec3 up=cross(fwd,rt);
        vec3 p=position*sc; p.y+=abs(p.x)*flap;
        vec3 wp=c+rt*p.x+up*p.y+fwd*p.z; vWp=wp; vN=up; vC=color; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`;
    const martinMat = new THREE.ShaderMaterial({ uniforms: { ...S }, vertexColors: true, side: THREE.DoubleSide, fragmentShader: BIRD_FRAG,
      vertexShader: flyVert(`float ph=aM.x+uTime*aM.w; c=aN.xyz+vec3(cos(ph)*aM.y,sin(ph*2.+aM.x*3.)*2.2,sin(ph)*aM.z);
        fwd=vec3(-sin(ph)*aM.y,cos(ph*2.+aM.x*3.)*4.4,cos(ph)*aM.z)*sign(aM.w); flap=sin(uTime*17.+aN.w*40.)*.8*step(.3,fract(uTime*.4+aN.w*3.));`) });
    {
      const B = plantBuilder(), dk = [0.9, 0.08, 0], wh = [1, 1, 0];
      B.tri([0, 0, 0.3], [0.06, 0, 0], [-0.06, 0, 0], dk); B.tri([0.06, 0, 0], [-0.06, 0, 0], [0, 0, -0.16], wh);
      for (const s of [1, -1]) { B.tri([s * 0.05, 0, 0.1], [s * 0.05, 0, -0.04], [s * 0.42, 0, -0.16], dk); B.tri([0, 0, -0.14], [s * 0.035, 0, -0.14], [s * 0.1, 0, -0.38], dk); }
      const n = Math.round(200 * Math.max(detail, 0.8)), g = new THREE.InstancedBufferGeometry().copy(B.geo()), M = new Float32Array(n * 4), Nn = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const k = i % 10 < 5 ? 0 : i % 10 < 8 ? 1 : 2, sg = rng.chance(0.75) ? 1 : -1;      // high round the column, mid past the braids, low over the boil
        if (k === 0) { M.set([rng.range(0, 6.28), rng.range(6, 15), rng.range(10, 26), sg * rng.range(0.45, 0.9)], i * 4); Nn.set([70, rng.range(38, 78), 330, rng()], i * 4); }
        else if (k === 1) { M.set([rng.range(0, 6.28), rng.range(2, 4.5), rng.range(3, 7), sg * rng.range(0.8, 1.5)], i * 4); Nn.set([73 + rng.range(-1, 1), 27 + rng.range(-2.5, 3), 341 + rng.range(-2, 3), rng()], i * 4); }
        else { M.set([rng.range(0, 6.28), rng.range(5, 11), rng.range(7, 16), sg * rng.range(0.5, 1)], i * 4); Nn.set([68, rng.range(3.5, 6.5), 330, rng()], i * 4); }
      }
      g.setAttribute('aM', new THREE.InstancedBufferAttribute(M, 4)); g.setAttribute('aN', new THREE.InstancedBufferAttribute(Nn, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, martinMat); m.scale.setScalar(1); m.frustumCulled = false; scene.add(m);
    }
    // 40 ducks that burst from under us at the pool's lip, their wakes small parted locks
    const DUCKS = new THREE.Vector3(routeAt(467)[0], 0, 467), uDuck = uAtZ(DUCKS.z - 29);      // they sit on the outflow just past the pool's lip and go up as we come over them
    // A duck is a body, not a dart: a plump spindle, a stretched neck, a small head, and two short round wings that turn about the shoulders (a wing vertex
    // is one that stands over 0.16 from the body's axis): each bird at its own point of the beat, the hand of the wing bending a little further than the arm;
    // while it sits the wings lie folded along the body. Its place, heading, size and beat are the law they always had.
    const duckMat = new THREE.ShaderMaterial({ uniforms: { ...S, uBurst: { value: 0 } }, vertexColors: true, side: THREE.DoubleSide, fragmentShader: BIRD_FRAG,
      vertexShader: /* glsl */`attribute vec4 aM; attribute vec4 aN; uniform float uTime; uniform float uBurst; varying vec3 vWp; varying vec3 vN; varying vec3 vC;
      void main(){ vec3 c; vec3 fwd; float flap; float sc=1.;
        float q=max(uBurst-aN.x,0.); sc=1.3*(1.-smoothstep(3.5,5.,q));      // they grow small and are gone before the burst's clamp is reached: none stops in the air
        float d=aM.w*21.*q; float go=smoothstep(0.,.06,q);
        c=vec3(aM.x+sin(aM.z)*d,.12+.05*sin(uTime*1.3+aN.w*30.)*(1.-go)+(11.+5.*aN.y)*q*sqrt(q)/(1.+.45*q),aM.y+cos(aM.z)*d);
        fwd=vec3(sin(aM.z),.35*go/(1.+q),cos(aM.z)); flap=sin(uTime*21.+aN.w*40.)*.95*go-.25*(1.-go);
        fwd=fwd/max(length(fwd),1e-4); vec3 rt=cross(vec3(0.,1.,0.),fwd); rt=rt/max(length(rt),1e-4); vec3 up=cross(fwd,rt);
        vec3 p=position, n=normal; float sx=p.x<0.?-1.:1., w=max(abs(p.x)-.16,0.)*mix(.14,1.,go), a=flap*(1.+.6*w)*1.05;
        if(w>0.){ p.x=sx*(.16+w*cos(a)); p.y+=w*sin(a); n=vec3(-sx*sin(a),cos(a),0.); }
        p*=sc; vec3 wp=c+rt*p.x+up*p.y+fwd*p.z; vWp=wp; vN=rt*n.x+up*n.y+fwd*n.z; vC=color; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }` });
    const duckWakeMat = strandMaterial(S, 'lock', { lines: 3 });
    {
      // the one duck (40 triangles): +Z its heading. Pigment (colour g): umber above, raw umber on the flanks, a pale collar, the head olive (b 1), the bill ochre; the wings umber, pale only along the trailing flight feathers
      const P = [], C = [], Nm = [], I = [], vtx = (p, c, nn) => { P.push(p[0], p[1], p[2]); C.push(c[0], c[1], c[2]); Nm.push(nn[0], nn[1], nn[2]); return P.length / 3 - 1; };
      const br = [0.9, 0.42, 0], dkb = [0.85, 0.24, 0], bel = [0.8, 0.5, 0], wh = [1, 1, 0], hd = [0.5, 0, 1], pw = [1, 0.93, 0];
      {      // the body: a plump spindle twice as long as deep, a point at the tail, a point where the neck leaves it
        const ring = (z, w, h) => [vtx([0, h, z], dkb, [0, 1, 0]), vtx([w, 0, z], br, [1, 0, 0]), vtx([0, -h, z], bel, [0, -1, 0]), vtx([-w, 0, z], br, [-1, 0, 0])];
        const tl = vtx([0, 0.05, -0.47], dkb, [0, 0.3, -1]), r1 = ring(-0.2, 0.15, 0.15), r2 = ring(0.1, 0.16, 0.17), nk = vtx([0, 0.05, 0.32], br, [0, 0.3, 1]);
        for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; I.push(tl, r1[i], r1[j], r1[i], r2[i], r1[j], r1[j], r2[i], r2[j], r2[i], nk, r2[j]); }
        // the neck, stretched forward and up, broad as well as tall (two crossed blades), a pale collar under the head
        for (const sd of [[1, 0, 0], [0, 0.88, -0.47]]) { const k = 0.05, a = vtx([-sd[0] * k, 0.03 - sd[1] * k, 0.24 - sd[2] * k], br, [0, 1, 0]), b = vtx([sd[0] * k, 0.03 + sd[1] * k, 0.24 + sd[2] * k], br, [0, 1, 0]), k2 = 0.036, c2 = vtx([-sd[0] * k2, 0.2 - sd[1] * k2, 0.56 - sd[2] * k2], wh, [0, 1, 0]), d2 = vtx([sd[0] * k2, 0.2 + sd[1] * k2, 0.56 + sd[2] * k2], wh, [0, 1, 0]); I.push(a, b, c2, b, d2, c2); }
        // the head: small, dark, well forward of the wings; the bill beyond it
        const hb = vtx([0, 0.19, 0.54], hd, [0, 1, 0]), bill = vtx([0, 0.19, 0.78], [0.9, 0.75, 0], [0, 1, 0]);
        I.push(hb, vtx([0.06, 0.215, 0.63], hd, [1, 0.5, 0]), bill, hb, vtx([-0.06, 0.215, 0.63], hd, [-1, 0.5, 0]), bill, hb, vtx([0, 0.275, 0.62], hd, [0, 1, 0]), bill, hb, vtx([0, 0.16, 0.63], hd, [0, 0.4, 0]), bill);
        // the wings: short and round, three places along the span and three across the chord
        for (const sg of [1, -1]) {
          const X = [0.16, 0.5, 0.74], LE = [0.2, 0.19, 0.04], MI = [-0.1, -0.11, -0.06], TE = [-0.2, -0.21, -0.12], g0 = [];
          for (let k = 0; k < 3; k++) g0.push([vtx([sg * X[k], 0.08, LE[k]], dkb, [0, 1, 0]), vtx([sg * (X[k] + (k === 2 ? 0.05 : 0)), 0.08, MI[k]], k === 2 ? dkb : br, [0, 1, 0]), vtx([sg * (X[k] - (k === 2 ? 0.03 : 0)), 0.08, TE[k]], pw, [0, 1, 0])]);
          for (let k = 0; k < 2; k++) for (let r = 0; r < 2; r++) I.push(g0[k][r], g0[k + 1][r], g0[k][r + 1], g0[k + 1][r], g0[k + 1][r + 1], g0[k][r + 1]);
        }
      }
      const n = 40, g = new THREE.InstancedBufferGeometry(), M = new Float32Array(n * 4), Nn = new Float32Array(n * 4), wk = lockBatch(27 * 7), tq = path.tangentAt(uAtZ(DUCKS.z), _q), hd0 = Math.atan2(tq.x, tq.z);
      for (let i = 0; i < n; i++) {
        const x = DUCKS.x + rng.range(-9, 9), z = DUCKS.z + rng.range(-7, 12), sgn = (x - DUCKS.x) * Math.cos(hd0) - (z - DUCKS.z) * Math.sin(hd0) >= 0 ? 1 : -1, a = hd0 + sgn * rng.range(0.4, 1.2);
        M.set([x, z, a, rng.range(0.7, 1.2)], i * 4); Nn.set([rng.range(0, 0.35), rng(), 0, rng()], i * 4);
        const d = [Math.sin(a), 0, Math.cos(a)];
        const stem = rng.range(2.5, 4.5) * 1.25, R = rng.range(0.45, 0.8), phase = rng();
        if (i % 3 !== 2) wk.add([x, 0.16, z], d, sideOf(d, sgn), { ns: 7, sp: 0.1, stem, R, k: 0.26, turns: 1.7, birth: Nn[i * 4] * 0.5, phase, mode: 0, lit: 1, crown: 0.03 });      // seven strands to a wake (the strand rule), the wake 0.6 m wide as before; two ducks in three leave one, so the wakes cost no more than they did
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3)); g.setIndex(I);
      g.setAttribute('aM', new THREE.InstancedBufferAttribute(M, 4)); g.setAttribute('aN', new THREE.InstancedBufferAttribute(Nn, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, duckMat); m.frustumCulled = false; scene.add(m); wk.mesh(14, duckWakeMat);
    }
    await ctx.yield();

    // ---- THE BORE's run: down the cleft's valley, round into the river, through the gap and out over the plain
    const boreCurve = new THREE.CatmullRomCurve3([
      [CLEFT[0] + CLEFT_DIR[0] * 150, CLEFT[1] + CLEFT_DIR[1] * 150], [CLEFT[0] + CLEFT_DIR[0] * 70, CLEFT[1] + CLEFT_DIR[1] * 70], [CLEFT[0] + CLEFT_DIR[0] * 16, CLEFT[1] + CLEFT_DIR[1] * 16],
      [riverX(534) - 3, 534], [riverX(580), 580], [riverX(620), 620], [riverX(660), 660], [GAP_X, GAP_Z], [GAP_X, 770], [riverX(900), 900]].map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
    const BN = 240, bz = new Float32Array(BN + 1); let bMouth = 0;
    let bLow = 0; for (let i = 0; i <= BN; i++) { boreCurve.getPointAt(i / BN, _p); bz[i] = _p.z; if (bz[i] < bz[bLow]) bLow = i; }
    for (let i = bLow; i <= BN && !bMouth; i++) if (bz[i] >= 534) bMouth = i / BN;      // where the run comes into the river
    const boreAtZ = (z) => {      // arc fraction of the run whose place lies at this z of the river (below the mouth); before it, the mouth's own
      let a = Math.round(bMouth * BN), b = BN; if (z <= bz[a]) return bMouth - (bz[a] - z) / boreCurve.getLength(); if (z >= bz[BN]) return 1;
      while (b - a > 1) { const m = (a + b) >> 1; if (bz[m] <= z) a = m; else b = m; }
      return (a + (z - bz[a]) / Math.max(bz[b] - bz[a], 1e-6)) / BN;
    };
    // caught at 11 m and ridden; down the last straight it draws ahead to the gap, heaps there with its crest a few metres short of the sill while we come up, and passes under as we reach it
    // it is in the cleft's mouth while we are still 35 m short of it, swings out into the river faster than we fly and has turned down the river well ahead of us;
    // then it lets us come up (never slower than a third of our speed) until we ride 11 m behind its front
    const boreLead = (zc) => lerp(33 + 4 * sm(486, 506, zc) - 26 * sm(502, 562, zc), 683 + 0.2 * (zc - 640) + 14 * sm(664, 690, zc) - zc, sm(584, 634, zc));
    const _bp = new THREE.Vector3(), _bt = new THREE.Vector3(), boreLook = new THREE.Vector3(CLEFT[0], 2, CLEFT[1] + 14);
    const BED2_X = 99.5;      // it starts 3.5 m further to port than the first build had it and keeps close down the dam's face: its nearest surface passes 13 m or more from the eye (proved by fix5/clear.mjs)
    // the rare event: a second bed lets go as we cross the column (the fall then parts in two braids, with a second small rosette: the hero's twin)
    const bed2 = rare ? new THREE.Mesh(slabGeometry(11.2, 4.6, 8.4, 77), cragMat) : null, uBed2 = [uAtZ(258), uAtZ(322)];      // it goes as we come down along the dam to cross the column

    if (bed2) { bed2.position.set(BED2_X, 101, 311); bed2.rotation.set(0, 0, DIP * 0.5, 'YXZ'); scene.add(bed2); }      // a broken slab like the fallen ones, no larger in any reach than the round bed it replaces

    // ---- the kite's flight, by place: hanging on the wind in the cave's mouth, alongside on the shelf, low ahead over the pool, first through the gap.
    // IT NEVER FLIES BACKWARD: its place is the eye's station on the way plus a lead, and the lead never falls faster than 0.75 m for each metre
    // we fly, so the kite's own motion over the ground is forward at a quarter of our speed or more; its heading is the direction it really moves
    // (two places of this same law, a step of the way apart). It waits for us as kites do: hung in the mouth's light, drifting on at a walk.
    const _kp = new THREE.Vector3(), _kt = new THREE.Vector3(), _kr = new THREE.Vector3(), _ku = new THREE.Vector3(), _kq = new THREE.Quaternion(), _km = new THREE.Matrix4(), _cam = new THREE.Vector3(), _poi = new THREE.Vector3();
    const kiteLaw = (zc, o) => {
      const hang = 0.5 * (110 - zc + Math.sqrt((110 - zc) * (110 - zc) + 64)),      // the way still to fly to the cave's mouth (smooth; nothing past it)
        off = sm(188, 232, zc), wS = sm(100, 118, zc) * (1 - off),      // alongside to z 188, 36 m past the lip at z 152: the kite goes over the lip with us and peels off as the dive steepens (the designer's ruling)
        wP = sm(310, 364, zc) * (1 - sm(430, 462, zc)), wG = sm(596, 640, zc);      // it lets us come up with it over the pool's near water (a lead given up slowly: never faster than we fly)
      let lead = lerp(4.6 + 0.72 * hang, 36, off), lat = lerp(-2.0, -15, off), up = lerp(lerp(2.6, -0.8, sm(64, 118, zc)), 7, off);      // from the mouth it waits in to alongside at 5 m, a little under the eye
      lat = lerp(lat, -0.5, sm(40, 93, zc) * (1 - sm(99, 112, zc)));      // through the cave's mouth (it is then 15 m ahead of us, at z 108 to 113) it keeps to the middle of the opening: the mouth's lip, the cave's own rock turned in, stands in up to 2.1 m from the roof and 1.6 m from the walls, and the kite passes inside it; it swings out beside us as it comes into the open
      lat = lerp(lat, -6, sm(256, 300, zc));      // the way bends toward the kite's side at the column (plan radius 16 m): it closes to 6 m of the way before the bend, so it never hangs in one spot at the bend's centre
      lead = lerp(lead, 5.6, wP); lat = lerp(lat, 1.1, wP); up = lerp(up, -2.3, wP);
      lead = lerp(lead, 16 + 0.5 * Math.max(zc - 600, 0), wG); lat = lerp(lat, 0.5, wG); up = lerp(up, 1.4, wG);
      o[0] = lead; o[1] = lat; o[2] = up; o[3] = -0.85 * wS; return o;      // o[3]: its bank on the shelf, toward us (it wheels in beside us)
    };
    const kitePlace = (d, time, o, out) => {      // where the kite is when the eye has flown d metres of the way (kept vectors only; past the route's end the way runs straight on)
      kiteLaw(path.posAtDist(d, _ku).z, o);
      path.posAtDist(d + o[0], out); path.posAtDist(d + o[0] + 0.5, _kr).sub(out);
      _kr.set(_kr.z, 0, -_kr.x); if (_kr.lengthSq() < 1e-8) _kr.set(1, 0, 0); else _kr.normalize();                    // port of the way; starboard is its negative
      out.addScaledVector(_kr, o[1] + 0.9 * clamp(o[0] / 14, 0.4, 1) * Math.sin(time * 0.62)); out.y += o[2] + 0.45 * Math.sin(time * 0.83);      // it wanders less when it flies close beside us
      return out;
    };
    const kl = [0, 0, 0, 0], kl2 = [0, 0, 0, 0], kl3 = [0, 0, 0, 0];

    // the look at the column, by the eye's place: high on the fall from the lip, sinking down the column as it nears and going ahead of us
    // past its foot, so the gaze is let go early and slowly and the pool comes into the frame's starboard side at the crossing
    const _col = new THREE.Vector3(), colLook = (time, u) => { const z = path.pointAt(u, _col).z, k = sm(284, 334, z); return _col.set(lerp(80, 74, k), lerp(43, 18, k), 331 + 23 * sm(304, 354, z)); };
    // The looks' windows are shares of the way, and the way is fixed, so each is a place: 0.16 is 14 m past the cave's mouth (z 124), where the notch's look has let go;
    // 0.17 to 0.29 the shelf and the lip down to z 221; 0.245 the lip's far edge (z 189), where the kite peels off and the column takes the gaze, to 0.5 past the column's
    // foot (z 349); 0.47 to 0.68 from the crossing of the column (z 332) to the pool's lip (z 445); 0.71 to 0.9 from the ducks' water (z 466) to the gap's lips (z 612).
    // A look's weight is nothing at both ends of its window.
    const pois = [
      { at: A.notchLip.clone().add(new THREE.Vector3(-8, 4, 0)), from: 0.0, to: 0.16, weight: 0.3 },
      { at: A.lookAt.flower, from: 0.17, to: 0.29, weight: 0.5 },
      { at: colLook, from: 0.245, to: 0.5, weight: 0.9, fade: 0.3, arc: true, steady: true },
      { at: (time, u) => path.pointAt(Math.min(u + 0.04, 1), _poi).setY(0), from: 0.47, to: 0.68, weight: 0.55 },
      { at: boreLook, from: 0.71, to: 0.9, weight: 0.4 },
    ];
    const pace = (u) => {
      let p = lerp(0.9, 1.2, sm(0.14, 0.22, u));
      p = lerp(p, 0.75, sm(0.33, 0.39, u)); p = lerp(p, 1.3, sm(0.6, 0.68, u)); p = lerp(p, 1.0, sm(0.84, 0.9, u));
      return p;
    };
    const portal = { shape: 'arch', width: 14, height: 15, color: '#A9BFC8', veil: '#A9BFC8', glow: 0, halo: false, blendDistance: 25 };

    const update = (dt, time, camera, u) => {
      hero.setProgress(u);
      camera.getWorldPosition(_cam);
      sky.position.copy(_cam);
      const zc = path.pointAt(u, _p).z;
      // the storm grows with the way flown; the fall's wind strengthens as the lake lets go
      stormMat.uniforms.uGrow.value = clamp((u - 0.15) / 0.6, 0, 1); poolLockMat.uniforms.uGrow.value = sm(0, 1, clamp((u - 0.1) / 0.24, 0, 1));
      // the bore: it comes down the cleft as we leave the pool, swings out of the mouth into the river ahead of us, is caught, ridden, and goes through the gap before us
      const w = sm(404, 490, zc), s = clamp(lerp(0.12, boreAtZ(zc + boreLead(zc)), w), 0, 1);
      boreCurve.getPointAt(s, _bp); boreCurve.getPointAt(Math.min(s + 0.004, 1), _bt); _bt.sub(_bp);      // its heading from two points of the run (nothing made per frame)
      if (_bt.lengthSq() < 1e-8) _bt.set(0, 0, 1); else _bt.normalize();
      hero.bore.position.set(_bp.x, 0, _bp.z); hero.bore.rotation.y = Math.atan2(_bt.x, _bt.z);
      hero.setBore(sm(0.03, 0.45, w), lerp(15, riverW(_bp.z), sm(bMouth - 0.035, bMouth + 0.01, s)) * 2 * 0.96, _bp.z > 540 ? sm(20, 11.5, riverW0(_bp.z)) : 0, s > bMouth ? sm(536, 566, _bp.z) : 0);      // heaped up where the river narrows: a shorter back, nine ringlets; its tails short while it turns out of the cleft, whole once it runs the straight river
      // the one wind: the fall's while we are in the gorge (it dies as we leave the pool), then the bore's own, which bends the bulrush and sedge of the banks away from it as it passes
      if (zc < 454) WIND.set(78, 330, (0.25 + 0.75 * sm(0.1, 0.34, u)) * (1 - sm(430, 452, zc))); else WIND.set(_bp.x, _bp.z, 1.3 * sm(456, 474, zc));
      { const kb = sm(486, 536, zc); boreLook.set(lerp(CLEFT[0] + 4, _bp.x + _bt.x * 18, kb), 5, lerp(CLEFT[1] + 16, _bp.z + _bt.z * 18, kb)); }      // from the cleft's mouth to the bore as the bore comes out into the river ahead of us: the gaze waits at the mouth and never follows the bore up the cleft; then it rests beyond the bore's front, not down on its back
      duckMat.uniforms.uBurst.value = clamp((u - uDuck) / 0.05, 0, 5.4); duckWakeMat.uniforms.uGrow.value = clamp((u - uDuck) / 0.03 + 0.02, 0, 1);
      if (bed2) { hero.setTwin(sm(0.05, 0.5, clamp((u - uBed2[0]) / (uBed2[1] - uBed2[0]), 0, 1)));
        const q = clamp((u - uBed2[0]) / (uBed2[1] - uBed2[0]), 0, 1), qs = Math.min(q / 0.3, 1), qf = Math.max(0, (q - 0.3) / 0.7), sl = 7 * qs * qs;
        bed2.position.set(BED2_X - CD * sl - 12 * qf, 101 - SD * sl - 104 * qf * qf, 311 - 2 * qf); bed2.rotation.z = DIP * 0.5 + 1.2 * qf; bed2.rotation.x = 0.4 * qf; }
      hero.update(dt, time, camera);      // after the bore and the twin are set, so the hero writes this frame's amounts
      // the kite
      kitePlace(u * path.length + 0.8, time, kl3, _kt); kitePlace(u * path.length, time, kl, _kp); kiteLaw(zc + 6, kl2);
      _kt.sub(_kp); if (_kt.lengthSq() < 1e-8) _kt.copy(path.endTangent); else _kt.normalize();      // its heading is the way it really moves
      const roll = clamp((kl2[1] - kl[1]) * 0.42 + (kl2[2] - kl[2]) * 0.1, -0.9, 0.9) + kl[3] + (0.3 + 0.2 * kl[3]) * Math.cos(time * 0.62);
      _kr.crossVectors(_up, _kt).normalize(); _ku.crossVectors(_kt, _kr);
      _km.makeBasis(_kr, _ku, _kt); _kq.setFromRotationMatrix(_km);
      kite.position.copy(_kp); kite.quaternion.copy(_kq); kite.rotateZ(roll);
      const flap = Math.sin(time * 2.1) * 0.5 + 0.5, beat = sm(0.55, 1, Math.sin(time * 0.31)) * Math.sin(time * 7.5) * 0.45;
      kiteWings[0].rotation.z = 0.1 + 0.08 * flap + beat; kiteWings[1].rotation.z = -(0.1 + 0.08 * flap + beat);
      kiteTail.rotation.z = -roll * 0.9 + 0.25 * Math.sin(time * 1.3); kiteTail.rotation.x = 0.06 * Math.sin(time * 0.9);
    };

    return {
      scene, path, duration: 44, pace,
      camera: { fov: 55, near: 0.3, far: 12000, lookAhead: 26, sway: 0.3, bank: 0.3 },
      pois, portal,
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { for (const m of plantMeshes) m.dispose(); hero.dispose(); },      // an instanced mesh drops its instance buffer only by its own dispose()
    };
  },
};
