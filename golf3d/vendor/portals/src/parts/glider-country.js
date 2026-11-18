// Glider Country hero: THE GUN. A true Gosper glider gun at 6 m per cell, running plain B3/S23 live.
//
// What it is: two ever-living end blocks (cream towers 84 m, stepped crowns, moss roofs, cube-trees), two
// crescent shuttles of low coral cubes that meet every 30 steps and hatch one five-cube glider, the bare
// avenue the gliders walk south-east between two rows of old block towers, and at its end the eater, a
// hooked seven-cell tower (54 m) whose lip dies back and regrows coral each time it takes a glider. A few
// seeded still-life gardens stand round it. Everything standing is a cell of the rule; nothing is faked.
//
// Local space: origin = Gun centre on the ground, +Y up, +X east, +Z south. Gliders leave toward +X +Z
// ("front"). Size: Gun 216 x 54 m, towers 84 m; avenue + eater reach about (290, 0, 290) (anchors.bounds).
// radius/center are a viewing hint (160 m round (60, 20, 60)), not the full extent.
//
// opts: palette (7 hex, brief order: cream, coral, apricot, mint, moss, sky, indigo), detail (0.6-1, thins
//   roof gardens and birds only, never the rule), gridSize (128; the world may pass 256 and then owns the
//   whole plain), stamps [{ pattern: 'block'|'beehive'|'loaf'|'boat'|'tub'|'pond'|'ship'|'pulsar'|
//   'honeyfarm' or cells [[x,z]..], x, z (local metres), age (1-255), cap (storeys) }], gardens (26 seeded
//   still lifes), avenue (true), eater (true), eaterStoreys (9), avenueCells (38 diagonal cells to the
//   eater), meetStep (30) and eatStep (88) for the dry run, preRoll (240), sunAzimuth (250), sunElevation
//   (38), shadow (1), haze (1400), birds (42), maxColumns (1600), groundSize (9000), stepsPerSecond (2.5),
//   autoRun (true), highlightGlow (0.05).
//
// Driving it: call hero.setStep(S) every frame with the fractional flight step (the brief's S = 105 * T(u)),
//   or hero.setProgress(u) for the linear table. It never runs backward and takes at most two whole steps a
//   frame; fract(S) eases every change over the full step. If neither is called it runs itself from world
//   time at 2.5 steps a second. The dry run guarantees: shuttles meet on step 30 (+30k); a bite begins on
//   anchors.steps.eat (88 +30k). hero.gliders() lists living gliders (local, eased, nearest the Gun first)
//   for the gaze. hero.cellOf(x, z) / localOf(cx, cz, y) convert metres <-> cells.
//
// anchors (local): westTower, eastTower (roof centres); meet (where the shuttles close); birth (where the
//   newborn shakes out, south side); lane { start, dir, length, starboard, cameraOffset 21 } the gliders'
//   line and the camera lane 21 m to starboard of it; eater (roof), eaterLip (the cube that dies and heals);
//   portalSeat { position, facing, radius 7 } on the camera lane 80 m past the eater at y 8, facing back up
//   the lane; flyThrough: the journey's line, >= 6 m clear of every cell (west entry at y 30, past the west
//   tower 16 m to port, over the meeting, down to 4.5 m beside the newborn, along the lane, 8 m past the
//   eater, to the seat); viewpoints { entry, meeting, besideGlider, eaterPass } as { position, target };
//   steps { meet, eat, period, perSecond, flightSteps, ok }; bounds { min, max }.
//
// Also exposed for the world's own materials: hero.textures { cur, prev, heights, soil } (RGBA8, nearest,
//   texelFetch; R age, G footprint heat, B neighbours*16 + role, A flutter*32; heights R last/G this step in
//   0.4 m units), hero.uniforms { cell { uF, uStep.. }, time, origin }, hero.glazes (7 linear colours).
//
// Added for the world (src/worlds/glider-country.js): opts.stamps may be an (async) function of the layout
//   ({ gx, gz, lane, far, eater } in cells from the Gun's north-west corner) and a stamp may give cx, cz in those
//   cells, a moss-clad `ivy` flag (the hedge) and any cell list; opts.clear [[x0, z0, x1, z1]..] keeps boxes free;
//   roofDensity(lx, lz, cap) thins roof gardens; tone [lit apricot mix, shade indigo mix, shade tone, lit tone],
//   horizon(glazes), cloudShade (0-1 drifting cloud shadows) and birdHomes [[x, y, z]..] shape the look.
//   occlusion (depth of the indigo pools the towers stand in, and of their darkened feet), pileUp (metres the
//   shuttles' cells rise where they meet) and shuttleScale (their height scale), kerbLights (0-1 chase lights down
//   the lane's kerbs), birdSize (m) and birdOk(cx, cy, cz, r) (refuse a bird loop near the camera's line); a stamp
//   with ivy 0.5 is glazed as machinery (banded apricot and coral storeys) instead of moss.
//   gunStoreys (14: height of the Gun's two end towers), ripple (0-1: the ring of warm tiles each meeting sends out
//   over the forecourts). Shade faces take the indigo glaze's own hue (shadeHue), the ground's darkeners are floored
//   so grout and inlay survive in shadow, every low cube carries a pressed panel and the head a cream tile on each face.
//   hero.jumpStep(S) lands on a step at once, hero.shownStep() is the whole step on screen, layout.shipBand
//   [z0, z1, x0, x1] gives a lane of the plain the shuttle glaze (the world's rare fleet). Gliders are only
//   recognised on the lane's diagonal, so a boat in a garden is never mistaken for one. The build yields
//   between every heavy piece (dry run, pre-roll ticks, roof gardens, first step).
//
// Lighting: none wanted. Every material is an unlit ShaderMaterial using the face-tone table (see faceTone)
//   and the sun direction in opts; scene lights are ignored, scene fog is honoured if present.
// Cost (128 grid, detail 1): about 72k triangles, 4 draw calls (ground, columns, roof gardens, birds),
//   4 small RGBA8 textures, build about 200-250 ms, one rule step about 0.2 ms.
import * as THREE from 'three';

const CELL = 6;            // metres per cell
const STOREY = 6;          // metres per storey
const DEFAULT_PALETTE = ['#F7EFE2', '#FF8E7A', '#FFC98A', '#9ED9C3', '#4FA58E', '#8FD3F0', '#2B3A67'];
//                        cream      coral      apricot    mint       moss       sky        indigo

// ---------------------------------------------------------------------------------------------
// Glaze colours. The hexes are ON-SCREEN targets; the engine shows toSRGB(ACES(linear / 0.6)), so
// each is pushed back through that curve (bisection on a hue-preserving scale) to the linear value
// that lands on it. Brightness is capped so cream never reaches bloom.
// ---------------------------------------------------------------------------------------------
function acesDisplay(r, g, b) {
  r /= 0.6; g /= 0.6; b /= 0.6;
  const ir = 0.59719 * r + 0.35458 * g + 0.04823 * b, ig = 0.076 * r + 0.90834 * g + 0.01566 * b, ib = 0.0284 * r + 0.13383 * g + 0.83777 * b;
  const f = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
  const fr = f(ir), fg = f(ig), fb = f(ib);
  return [1.60475 * fr - 0.53108 * fg - 0.07367 * fb, -0.10208 * fr + 1.10813 * fg - 0.00605 * fb, -0.00327 * fr - 0.07276 * fg + 1.07602 * fb];
}
function glaze(hex, cap = 1.02) {
  const t = new THREE.Color(hex);                       // target, linear display
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const want = lum([t.r, t.g, t.b]);
  // ACES desaturates brights, so pre-saturate the hue a little, then solve the scale by bisection
  const m = (t.r + t.g + t.b) / 3, sat = 1.22;
  const h = [Math.max(0.004, m + (t.r - m) * sat), Math.max(0.004, m + (t.g - m) * sat), Math.max(0.004, m + (t.b - m) * sat)];
  let lo = 0, hi = 8;
  for (let i = 0; i < 28; i++) { const k = (lo + hi) / 2; if (lum(acesDisplay(h[0] * k, h[1] * k, h[2] * k)) < want) lo = k; else hi = k; }
  let k = (lo + hi) / 2; const mx = Math.max(h[0], h[1], h[2]) * k; if (mx > cap) k *= cap / mx;
  return new THREE.Color(h[0] * k, h[1] * k, h[2] * k);
}

// ---------------------------------------------------------------------------------------------
// Patterns (run-length encoded, x east, y south)
// ---------------------------------------------------------------------------------------------
const RLE = {
  gun: '24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!',
  eater: '2o$obo$2bo$2b2o!',
  block: '2o$2o!', beehive: 'b2o$o2bo$b2o!', loaf: 'b2o$o2bo$bobo$2bo!', boat: '2o$obo$bo!', tub: 'bo$obo$bo!',
  pond: 'b2o$o2bo$o2bo$b2o!', ship: '2o$obo$b2o!', pulsar: '2b3o3b3o2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2$2b3o3b3o$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!',
  honeyfarm: '6bo$5bobo$5bobo$6bo2$b2o7b2o$o2bo5bo2bo$b2o7b2o2$6bo$5bobo$5bobo$6bo!',
};
function parseRLE(s) {
  const cells = []; let x = 0, y = 0, n = '';
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') { n += ch; continue; }
    const k = n === '' ? 1 : parseInt(n, 10); n = '';
    if (ch === 'b') x += k; else if (ch === 'o') { for (let i = 0; i < k; i++) cells.push([x + i, y]); x += k; }
    else if (ch === '$') { y += k; x = 0; } else if (ch === '!') break;
  }
  return cells;
}
// the eight orientations of a cell list, each normalised to a zero corner
function orient(cells, o) {
  const out = cells.map(([x, y]) => { let a = x, b = y; if (o & 4) { const t = a; a = b; b = t; } if (o & 1) a = -a; if (o & 2) b = -b; return [a, b]; });
  const mx = Math.min(...out.map((c) => c[0])), my = Math.min(...out.map((c) => c[1]));
  return out.map(([a, b]) => [a - mx, b - my]);
}

// ---------------------------------------------------------------------------------------------
// THE RULE: plain B3/S23 on a G x G Uint8 grid, worked only inside the bounding box of the living.
// Per cell it keeps what the shaders read: age, footprint heat, neighbour count, role, flutter.
// ---------------------------------------------------------------------------------------------
function makeLife(G) {
  const N = G * G;
  const L = {
    G, alive: new Uint8Array(N), next: new Uint8Array(N), age: new Uint8Array(N), heat: new Uint8Array(N),
    nbr: new Uint8Array(N), hist: new Uint8Array(N), role: new Uint8Array(N), cap: new Uint8Array(N).fill(3), cool: new Uint8Array(N).fill(25),
    fixed: new Uint8Array(N),          // 1 = authored "has always been alive" cell (age pinned at 255)
    step: 0, x0: G, x1: -1, z0: G, z1: -1, pop: 0,
  };
  L.stamp = (cells, cx, cz, age = 1, cap = 0) => {
    for (const [x, z] of cells) {
      const X = cx + x, Z = cz + z; if (X < 4 || Z < 4 || X >= G - 4 || Z >= G - 4) continue;
      const i = Z * G + X; L.alive[i] = 1; L.age[i] = age; if (cap) L.cap[i] = cap; if (age >= 255) L.fixed[i] = 1;
      if (X < L.x0) L.x0 = X; if (X > L.x1) L.x1 = X; if (Z < L.z0) L.z0 = Z; if (Z > L.z1) L.z1 = Z;
    }
  };
  L.tick = () => {
    const { alive, next, age, heat, nbr, hist, cool } = L;
    const ax0 = Math.max(4, L.x0 - 1), ax1 = Math.min(G - 5, L.x1 + 1), az0 = Math.max(4, L.z0 - 1), az1 = Math.min(G - 5, L.z1 + 1);
    let nx0 = G, nx1 = -1, nz0 = G, nz1 = -1, pop = 0;
    for (let z = az0; z <= az1; z++) {
      for (let x = ax0, i = z * G + ax0; x <= ax1; x++, i++) {
        const n = alive[i - G - 1] + alive[i - G] + alive[i - G + 1] + alive[i - 1] + alive[i + 1] + alive[i + G - 1] + alive[i + G] + alive[i + G + 1];
        const a = alive[i], b = (n === 3 || (a && n === 2)) ? 1 : 0;
        next[i] = b;
        if (b) { pop++; if (x < nx0) nx0 = x; if (x > nx1) nx1 = x; if (z < nz0) nz0 = z; if (z > nz1) nz1 = z; }
      }
    }
    // commit: ages, footprints, birth history
    for (let z = az0; z <= az1; z++) {
      for (let x = ax0, i = z * G + ax0; x <= ax1; x++, i++) {
        const a = alive[i], b = next[i];
        hist[i] = ((hist[i] << 1) | (b && !a ? 1 : 0)) & 255;
        if (b) { age[i] = a ? (age[i] < 255 ? age[i] + 1 : 255) : 1; }
        else { age[i] = 0; heat[i] = a ? 255 : (heat[i] > cool[i] ? heat[i] - cool[i] : 0); }
        if (b && heat[i] > 0) heat[i] = heat[i] > cool[i] ? heat[i] - cool[i] : 0;
        alive[i] = b;
      }
    }
    // the outer four cells are cleared every step, so nothing ever walks off the edge of the world
    if (nx1 >= G - 9 || nz1 >= G - 9 || nx0 <= 8 || nz0 <= 8) {
      for (let z = az0; z <= az1; z++) for (let x = ax0; x <= ax1; x++) if (x < 8 || z < 8 || x > G - 9 || z > G - 9) { const i = z * G + x; if (alive[i]) { alive[i] = 0; age[i] = 0; heat[i] = 255; pop--; } }
    }
    // neighbour counts of the new generation (occlusion and contact shadows read these)
    for (let z = az0; z <= az1; z++) {
      for (let x = ax0, i = z * G + ax0; x <= ax1; x++, i++) {
        nbr[i] = alive[i - G - 1] + alive[i - G] + alive[i - G + 1] + alive[i - 1] + alive[i + 1] + alive[i + G - 1] + alive[i + G] + alive[i + G + 1];
      }
    }
    L.px0 = ax0; L.px1 = ax1; L.pz0 = az0; L.pz1 = az1;       // the box this step touched
    if (nx1 >= 0) { L.x0 = Math.min(nx0, ax0 + 1); L.x1 = Math.max(nx1, ax1 - 1); L.z0 = Math.min(nz0, az0 + 1); L.z1 = Math.max(nz1, az1 - 1); }
    L.pop = pop; L.step++;
  };
  return L;
}

// ---------------------------------------------------------------------------------------------
// Roles: which living cells are shuttle cubes, which are a walking glider, and which cube is its head.
// A glider is any free five-cell clump inside a 3 x 3 box south-east of the collision point.
// ---------------------------------------------------------------------------------------------
function assignRoles(L, lay) {
  const { G, alive, role, fixed } = L, { gx, gz } = lay;
  const x0 = Math.max(1, L.px0 ?? 1), x1 = Math.min(G - 2, L.px1 ?? G - 2), z0 = Math.max(1, L.pz0 ?? 1), z1 = Math.min(G - 2, L.pz1 ?? G - 2);
  const gliders = [];
  for (let z = z0; z <= z1; z++) for (let x = x0, i = z * G + x0; x <= x1; x++, i++) role[i] = 0;
  const seen = lay._seen || (lay._seen = new Uint32Array(G * G)); const mark = ++lay._mark || (lay._mark = 1);
  const stack = [], comp = [];
  for (let z = z0; z <= z1; z++) {
    for (let x = x0, i = z * G + x0; x <= x1; x++, i++) {
      if (!alive[i] || fixed[i]) continue;
      const lx = x - gx, lz = z - gz;
      if (!role[i] && lx >= -3 && lx <= 38 && lz >= -4 && lz <= 12) role[i] = 3;          // inside the machine: shuttle cubes
      if (!role[i] && lay.shipBand && lz >= lay.shipBand[0] && lz <= lay.shipBand[1] && lx >= lay.shipBand[2] && lx <= lay.shipBand[3]) { role[i] = 3; continue; }      // the fleet's lane
      if (!role[i] && lay.plazas) { for (const b of lay.plazas) if (lx >= b[0] && lx <= b[2] && lz >= b[1] && lz <= b[3]) role[i] = 5; if (role[i]) continue; }   // a plaza's dancers
      if (seen[i] === mark || lx < 19 || lz < 6 || lay.eaterMask?.[i]) continue;
      comp.length = 0; stack.length = 0; stack.push(i); seen[i] = mark;
      let bx0 = x, bx1 = x, bz0 = z, bz1 = z, touchesFixed = false;
      while (stack.length) {
        const j = stack.pop(); comp.push(j); const jx = j % G, jz = (j / G) | 0;
        if (jx < bx0) bx0 = jx; if (jx > bx1) bx1 = jx; if (jz < bz0) bz0 = jz; if (jz > bz1) bz1 = jz;
        if (comp.length > 9) continue;
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          const k = j + dz * G + dx; if (k === j || !alive[k]) continue;
          if (fixed[k] || lay.eaterMask?.[k]) { touchesFixed = true; continue; }
          if (seen[k] !== mark) { seen[k] = mark; stack.push(k); }
        }
      }
      if (comp.length === 5 && bx1 - bx0 === 2 && bz1 - bz0 === 2 && !touchesFixed && bx0 - gx >= 19 && bz0 - gz >= 6 && Math.abs((bx0 - gx) - (bz0 - gz) - 14) <= 3) {
        let head = comp[0], best = -1;
        for (const j of comp) { const s = ((j % G) + ((j / G) | 0)) * 4 + (((j / G) | 0) - bz0); if (s > best) { best = s; head = j; } }
        for (const j of comp) role[j] = 1; role[head] = 2;
        gliders.push({ x: bx0 + 1.5, z: bz0 + 1.5, head });
      }
    }
  }
  L.gliders = gliders;
  return gliders;
}

// ---------------------------------------------------------------------------------------------
// The dry run. Finds the phase at which the shuttles meet, finds an eater seat that swallows a glider
// cleanly, slides it down the diagonal until the bite lands on the wanted step, and checks the machine.
// ---------------------------------------------------------------------------------------------
async function planLand(G, opts, ctx) {
  const shift = G < 200 ? Math.floor(G / 8) : 0;
  const lay = { G, gx: (G >> 1) - 18 - shift, gz: (G >> 1) - 4 - shift, ok: true };
  lay.ox = lay.gx + 18; lay.oz = lay.gz + 4.5;                  // grid coords of the local origin (Gun centre)
  const gun = parseRLE(RLE.gun);
  const isBlock = ([x, z]) => (x <= 1 && z >= 4 && z <= 5) || (x >= 34 && z >= 2 && z <= 3);
  const stampGun = (L) => { L.stamp(gun.filter((c) => !isBlock(c)), lay.gx, lay.gz, 1, 2); L.stamp(gun.filter(isBlock), lay.gx, lay.gz, 255, opts.gunStoreys ?? 14); };

  // (1) gun alone: where is the crowd at the midpoint thickest, and where do gliders walk?
  const A = makeLife(G); stampGun(A);
  const crowd = new Float32Array(30); let sample = null;
  for (let n = 1; n <= 150; n++) {
    if (n % 4 === 0) await ctx.yield?.();
    A.tick();
    if (n > 60) { let c = 0; for (let z = lay.gz - 2; z <= lay.gz + 10; z++) for (let x = lay.gx + 14; x <= lay.gx + 22; x++) c += A.alive[z * G + x]; crowd[n % 30] += c; }
    if (!sample && n > 60) { const gl = assignRoles(A, lay).filter((g) => g.x - lay.gx > 34 && g.z - lay.gz > 18); if (gl.length) { const g = gl[0]; const cells = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (A.alive[(g.z - 0.5 + dz) * G + (g.x - 0.5 + dx)]) cells.push([dx + 1, dz + 1]); sample = { n, x: g.x - 1.5, z: g.z - 1.5, cells }; } }
  }
  let pm = 0; for (let i = 1; i < 30; i++) if (crowd[i] > crowd[pm]) pm = i;
  const meet = ((opts.meetStep ?? 30) % 30 + 30) % 30;
  let s0 = opts.preRoll ?? 240; while (((s0 + meet) % 30) !== pm) s0++;
  lay.s0 = s0; lay.meetPhase = pm;

  // (2) eater: try every orientation and seat against one glider on a small board
  const eat0 = parseRLE(RLE.eater); let seat = null;
  if (sample && opts.eater !== false) {
    for (let o = 0; o < 8 && !seat; o++) {
      const e = orient(eat0, o);
      for (let ez = 2; ez <= 9 && !seat; ez++) for (let ex = 2; ex <= 9 && !seat; ex++) {
        await ctx.yield?.();
        const B = makeLife(40); B.stamp(sample.cells, 10, 10, 1); B.stamp(e, 10 + ex, 10 + ez, 200);
        const want = new Set(e.map(([x, z]) => (10 + ez + z) * 40 + 10 + ex + x)); let start = -1, end = -1, lip = new Set();
        for (let n = 1; n <= 48; n++) {
          B.tick(); let same = B.pop === 7; for (const i of want) if (!B.alive[i]) { same = false; lip.add(i); }
          if (!same && start < 0 && [...want].some((i) => !B.alive[i])) start = n;
          if (same && start >= 0 && end < 0) end = n; if (!same && end >= 0) { end = -2; break; }
        }
        if (start > 0 && end > 0 && end - start <= 8) seat = { o, ex, ez, start, cells: e, lip: [...lip].map((i) => [(i % 40) - 10 - ex, ((i / 40) | 0) - 10 - ez]) };
      }
    }
  }
  if (seat) {
    const wantEat = opts.eatStep ?? 88, far = opts.avenueCells ?? 38; let bestK = 0, bestErr = 1e9;
    for (let k = -8; k <= 8; k++) {
      const X = sample.x + seat.ex + (far - (sample.x - lay.gx - 23)) + k; if (X + 6 > G - 10) continue;
      const kk = X - sample.x - seat.ex, stepEat = sample.n + seat.start - 1 + 4 * kk - s0;
      let r = (((stepEat - wantEat) % 30) + 30) % 30; if (r > 15) r = 30 - r; const err = r * 10 + Math.abs(k);
      if (err < bestErr) { bestErr = err; bestK = kk; lay.eatStep = stepEat; }
    }
    lay.eater = { x: sample.x + seat.ex + bestK, z: sample.z + seat.ez + bestK, cells: seat.cells, lip: seat.lip };
    lay.eatStep = wantEat + ((((lay.eatStep - wantEat) % 30) + 45) % 30) - 15;      // the bite nearest the wanted step
  }
  lay.stampGun = stampGun;
  return lay;
}

// ---------------------------------------------------------------------------------------------
// Geometry: the thirty-triangle bevelled column. `position` holds the corner signs (x, 0|1, z) and
// `inset` says along which axes that vertex is pulled in by the bevel, so the shader can stretch
// the box to any height and width while the bevel stays 0.35 m.
// ---------------------------------------------------------------------------------------------
function bevelBoxGeometry(bottom = false) {
  const pos = [], ins = [], nor = [];
  const V = (sx, sy, sz, ix, iy, iz, n) => { pos.push(sx, sy, sz); ins.push(ix, iy, iz); nor.push(n[0], n[1], n[2]); };
  const quad = (a, b, c, d, n) => { V(...a, n); V(...b, n); V(...c, n); V(...a, n); V(...c, n); V(...d, n); };
  const tri = (a, b, c, n) => { V(...a, n); V(...b, n); V(...c, n); };
  const S = Math.SQRT1_2, T = 1 / Math.sqrt(3);
  quad([-1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 1], [1, 1, -1, 1, 0, 1], [-1, 1, -1, 1, 0, 1], [0, 1, 0]);     // top
  if (bottom) quad([-1, 0, -1, 0, 0, 0], [1, 0, -1, 0, 0, 0], [1, 0, 1, 0, 0, 0], [-1, 0, 1, 0, 0, 0], [0, -1, 0]);
  for (let k = 0; k < 4; k++) {
    // k-th side: outward normal d, tangent t (counter-clockwise seen from above)
    const d = [[1, 0], [0, -1], [-1, 0], [0, 1]][k], t = [-d[1], d[0]];   // t = d rotated +90deg about y (x->-z)
    const c = (st, sy, ix, iy, iz) => [d[0] + t[0] * st, sy, d[1] + t[1] * st, ix, iy, iz];
    const iN = d[0] !== 0 ? [0, 1] : [1, 0];                               // inset along the tangent axis only
    quad(c(-1, 0, iN[0], 0, iN[1]), c(1, 0, iN[0], 0, iN[1]), c(1, 1, iN[0], 1, iN[1]), c(-1, 1, iN[0], 1, iN[1]), [d[0], 0, d[1]]);   // side
    quad(c(-1, 1, iN[0], 1, iN[1]), c(1, 1, iN[0], 1, iN[1]), c(1, 1, 1, 0, 1), c(-1, 1, 1, 0, 1), [d[0] * S, S, d[1] * S]);            // top-edge bevel
    // vertical bevel between this side (at tangent +1) and the next side round
    const d2 = t, e = [d[0] + d2[0], d[1] + d2[1]];
    const iA = iN, iB = d2[0] !== 0 ? [0, 1] : [1, 0];
    quad([e[0], 0, e[1], iA[0], 0, iA[1]], [e[0], 0, e[1], iB[0], 0, iB[1]], [e[0], 1, e[1], iB[0], 1, iB[1]], [e[0], 1, e[1], iA[0], 1, iA[1]], [e[0] * S, 0, e[1] * S]);
    tri([e[0], 1, e[1], iA[0], 1, iA[1]], [e[0], 1, e[1], iB[0], 1, iB[1]], [e[0], 1, e[1], 1, 0, 1], [e[0] * T, T, e[1] * T]);          // corner facet
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('inset', new THREE.Float32BufferAttribute(ins, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

// GLSL shared by every material of the piece: the glaze set, the face-tone table and the far tint.
const GLSL_COMMON = /* glsl */`
  uniform vec3 uCream, uCoral, uApricot, uMint, uMoss, uSky, uIndigo, uHorizon;
  uniform vec3 uSun;            // unit vector toward the sun
  uniform float uHaze;          // metres to the horizon tint (1400)
  uniform vec4 uTone;           // sunward sides: mix to apricot, shade sides: mix to indigo, shade tone, sunward tone
  uniform float uCloudT, uCloudK;
  // tone of a face from its normal. Tops take the glaze as it is; each of the four sides takes its own value from
  // how squarely it meets the sun (full key, grazing, shade, deep shade), so every block shows three values.
  // the hue of shade: the indigo glaze's own colour at full strength, thinned, so a shade face is lavender or plum, never grey
  vec3 shadeHue() { return mix(vec3(1.), uIndigo / max(max(uIndigo.r, uIndigo.g), max(uIndigo.b, 1e-3)), 0.34) * 1.12; }
  vec3 faceTone(vec3 col, vec3 n) {
    float wx = n.x * n.x, wz = n.z * n.z, wy = n.y * n.y;
    vec2 sh = uSun.xz / max(length(uSun.xz), 1e-3);
    float ex = smoothstep(0., 1., sign(n.x) * sh.x), ez = smoothstep(0., 1., sign(n.z) * sh.y);
    float lit = (wx * ex + wz * ez) / max(wx + wz, 1e-4);
    vec3 side = mix(mix(col, uIndigo, uTone.y) * uTone.z * shadeHue(), mix(col, uApricot, uTone.x) * uTone.w, lit);
    float up = clamp(wy / max(wx + wy + wz, 1e-4), 0., 1.) * step(0., n.y);
    vec3 c = mix(side, col, up);
    float bevel = 4. * max(wx * wz, max(wx * wy, wz * wy));          // 0 on flat faces, 1 on 45 degree bevels
    return mix(c, mix(side, col, 0.7) * 1.2, clamp(bevel, 0., 1.));
  }
  float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  vec3 farTint(vec3 col, float d) { float x = d / max(uHaze, 1.); return mix(col, uHorizon, min(0.66, 1. - exp(-x * sqrt(x)))); }
  // drifting cloud shadows: soft-edged 60 m squares of shade sliding over the plain (0 lit .. 1 shaded)
  float cloudShade(vec2 p) {
    vec2 q = (p - vec2(8., 3.) * uCloudT) / 60., c = floor(q), w = smoothstep(0.36, 0.64, fract(q));
    float a = step(0.63, hash21(c)), b = step(0.63, hash21(c + vec2(1., 0.))), e = step(0.63, hash21(c + vec2(0., 1.))), g = step(0.63, hash21(c + vec2(1., 1.)));
    return mix(mix(a, b, w.x), mix(e, g, w.x), w.y) * uCloudK;
  }
`;

// vertex side of the rule: both texels of a cell -> eased height, glaze colour, role
const GLSL_CELL = /* glsl */`
  uniform sampler2D uCur, uPrev, uSoil;
  uniform float uF, uStep;      // easing phase inside the step (0..1), whole steps taken
  uniform vec4 uGun;            // the Gun's centre in cells (x, z), the pile-up height in metres, the shuttles' scale
  float cellHeight(vec4 t, vec4 soil, vec2 cell) {
    float age = t.r * 255.; if (age < 0.5) return 0.;
    float cap = max(1., floor(soil.r * 255. / 16. + 0.5)) * 6.;
    float bb = floor(t.b * 255. + 0.5), role = mod(bb, 16.), flut = t.a * 255. / 32.;
    float h = age <= 8. ? mix(2.4, 6., (age - 1.) / 7.) : min(cap, 6. + (age - 8.) * 0.75);
    if (role < 0.5 && flut >= 1.5) h = min(h, 1.2);
    // a plaza's dancers: a cell stands taller every step it lives (4, 7.5, 10 m), so its rings are caught at three heights
    if (role > 4.5 && role < 5.5) h = age < 1.5 ? 4. : (age < 2.5 ? 7.5 : 10.);
    // the machine's moving parts stand taller than the animals, and pile up where the two shuttles meet
    vec2 g = cell + 0.5 - uGun.xy;
    float inGun = step(2.5, role) * step(role, 3.5) * step(abs(g.x), 20.) * step(abs(g.y), 9.);
    float pile = exp(-g.x * g.x / 34.) * (0.5 + 0.13 * floor(bb / 16.));
    h += 4. * step(2.5, role) * step(role, 3.5) * (1. - inGun);            // a ship's cubes stand taller than a walker's
    return mix(h, h * uGun.w + uGun.z * pile, inGun);
  }
  vec3 glazeOfAge(float age) {
    vec3 c = mix(uCoral, uApricot, clamp((age - 1.) / 7., 0., 1.));
    return mix(c, uCream, smoothstep(8., 64., age));
  }
  float backOut(float t) { float u = t - 1.; return 1. + 2.9 * u * u * u + 1.9 * u * u; }
  // returns eased height; e = the easing weight toward the current texel
  float easedHeight(float hA, float hB, out float e) {
    float s = uF * uF * (3. - 2. * uF);
    e = (hB > hA && hA < 0.01) ? backOut(uF) : s;
    return max(0., mix(hA, hB, e));
  }
`;

// ---------------------------------------------------------------------------------------------
// COLUMN material: every living cell. No lighting model, only the face-tone table.
// ---------------------------------------------------------------------------------------------
const COLUMN_VERT = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  attribute vec3 inset; attribute vec2 aCell;
  uniform vec2 uOrigin; uniform float uWidth;
  varying vec3 vLocal, vN, vWorld, vGlaze; varying vec4 vInfo; varying vec3 vMisc; varying float vIvy;
  ${GLSL_COMMON}
  ${GLSL_CELL}
  void main() {
    ivec2 ij = ivec2(aCell + 0.25);
    vec4 tB = texelFetch(uCur, ij, 0), tA = texelFetch(uPrev, ij, 0), soil = texelFetch(uSoil, ij, 0);
    float hA = cellHeight(tA, soil, aCell), hB = cellHeight(tB, soil, aCell), e;
    float H = easedHeight(hA, hB, e);
    float ageA = tA.r * 255., ageB = tB.r * 255.;
    float bA = floor(tA.b * 255. + 0.5), bB = floor(tB.b * 255. + 0.5);
    float roleA = mod(bA, 16.), roleB = mod(bB, 16.);
    float cm = ageA < 0.5 ? 1. : (ageB < 0.5 ? 0. : clamp(e, 0., 1.));
    float role = cm > 0.5 ? roleB : roleA;
    vec3 gA = glazeOfAge(ageA), gB = glazeOfAge(ageB);
    if (roleA < 0.5 && tA.a * 255. / 32. >= 1.5) gA = uApricot;
    if (roleB < 0.5 && tB.a * 255. / 32. >= 1.5) gB = uApricot;
    if (roleA > 4.5 && roleA < 5.5) gA = mix(uCoral, mix(uApricot, uCream, 0.45), clamp((ageA - 1.) * 0.5, 0., 1.));
    if (roleB > 4.5 && roleB < 5.5) gB = mix(uCoral, mix(uApricot, uCream, 0.45), clamp((ageB - 1.) * 0.5, 0., 1.));
    // shuttle and glider bodies keep an apricot top-glow as they age inside one stroke
    vGlaze = mix(gA, gB, cm);
    float roof = mix(smoothstep(104., 120., ageA), smoothstep(104., 120., ageB), cm);
    float headA = step(1.5, roleA) * step(roleA, 2.5), headB = step(1.5, roleB) * step(roleB, 2.5);
    float glider = step(0.5, role) * step(role, 2.5);
    float bob = glider * (0.25 + 0.25 * sin(6.2832 * (uStep + uF) * 0.25));
    H += bob * smoothstep(0.3, 1.5, H);
    float hw = uWidth * 0.5, bev = min(0.35, H * 0.45);
    vec3 p = vec3(position.x * (hw - inset.x * bev), position.y * (H - inset.y * bev), position.z * (hw - inset.z * bev));
    vLocal = p;
    p.xz += glider * p.y * 0.07 * vec2(0.7071);                      // lean 4 degrees into the heading
    vec3 w = vec3((aCell.x + 0.5 - uOrigin.x) * ${CELL}.0 + p.x, p.y, (aCell.y + 0.5 - uOrigin.y) * ${CELL}.0 + p.z);
    if (H < 0.03) w = vec3(0., -20., 0.);
    vN = normal;
    vInfo = vec4(H, roof, mix(floor(bA / 16.), floor(bB / 16.), clamp(e, 0., 1.)), mix(headA, headB, cm));
    vMisc = vec3(soil.g, glider, step(2.5, role) * step(role, 3.5)); vIvy = soil.b;
    vec4 wp = modelMatrix * vec4(w, 1.); vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const COLUMN_FRAG = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  uniform float uWidth, uGlow, uAO;
  varying vec3 vLocal, vN, vWorld, vGlaze; varying vec4 vInfo; varying vec3 vMisc; varying float vIvy;
  ${GLSL_COMMON}
  float sdBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
  // the net of a crazed glaze: distance between the two nearest of nine hashed points (no textures, no derivatives)
  float crackle(vec2 p) {
    vec2 c = floor(p), f = p - c; float f1 = 8., f2 = 8.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), r = o + vec2(hash21(c + o), hash21(c + o + 19.7)) - f; float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    return sqrt(max(f2, 0.)) - sqrt(max(f1, 0.));
  }
  void main() {
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
    float H = vInfo.x, hw = uWidth * 0.5; vec2 tp = vLocal.xz;
    float d = distance(cameraPosition, vWorld);
    float topF = step(0.9, n.y), sideF = 1. - step(0.2, n.y), topBevel = step(0.3, n.y) * (1. - topF);
    float flatSide = sideF * step(0.9, max(abs(n.x), abs(n.z)));
    float fy = fwidth(vLocal.y) + 1e-4, fxz = fwidth(vLocal.x) + fwidth(vLocal.z) + 1e-4;

    // glaze: age colour with a small per-cell jitter, moss roof under a mint lip, the head's indigo glaze
    vec3 col = vGlaze * (0.965 + 0.07 * vMisc.x);
    // each storey is its own fired block: a hashed step of value and a lean toward apricot or mint
    float sj = hash21(vec2(floor(vLocal.y / 6.) + 1., floor(vMisc.x * 251.))), sj2 = hash21(vec2(floor(vMisc.x * 251.), floor(vLocal.y / 6.) + 9.));
    float tallS = smoothstep(6.5, 8.5, vInfo.x) * (1. - topF);
    col *= 1. - tallS * 0.085 * sj;
    col = mix(col, mix(uApricot, uMint, step(0.6, sj2)), tallS * 0.2 * sj2);
    col = mix(col, mix(uApricot, uCoral, 0.25), tallS * 0.5 * step(vInfo.x - 6.2, vLocal.y) * (1. - step(0.3, n.y)) * step(0.45, vMisc.x));
    col = mix(col, uMoss * (0.95 + 0.1 * vMisc.x), vInfo.y * topF);
    col = mix(col, uMint, vInfo.y * topBevel);
    // the machine's own towers: storeys banded apricot and coral, so the Gun reads as one warm thing from end to end
    float ivy = step(0.75, vIvy), mach = step(0.25, vIvy) * (1. - ivy);
    vec3 band = mix(mix(uApricot, uCream, 0.3), mix(uApricot, uCoral, 0.55), step(0.5, mod(floor(vLocal.y / 6.), 2.)));
    col = mix(col, band * (0.94 + 0.1 * sj), mach * (1. - step(0.3, n.y)));
    // the avenue's towers (soil.b about 0.2): cream blocks with every third storey fired mint or sky, and an apricot course under the roof
    float street = step(0.1, vIvy) * (1. - step(0.25, vIvy)), stN = floor(vLocal.y / 6.), topS = step(vInfo.x - 6.2, vLocal.y);
    vec3 sband = mix(mix(uMint, uCream, 0.25), mix(uSky, uMint, 0.35), step(0.5, hash21(vec2(floor(vMisc.x * 251.), 7.))));
    col = mix(col, sband * (0.9 + 0.1 * sj), street * (1. - step(0.3, n.y)) * step(mod(stN + floor(vMisc.x * 3.), 3.), 0.5) * (1. - topS));
    col = mix(col, mix(uApricot, uCoral, 0.3) * (0.92 + 0.08 * sj), street * (1. - step(0.3, n.y)) * topS * 0.9);
    col = mix(col, mix(col, uApricot, 0.55), (vMisc.y + vMisc.z) * topF * (1. - vInfo.w));   // apricot tops of the animals
    col = mix(col, mix(vGlaze, uIndigo, 0.62) * 0.74, vInfo.w);

    // sides: storey grooves, one window tile a storey, a door notch, foot occlusion, crackle
    float tall = smoothstep(6.5, 8.5, H);
    float gy = abs(fract(vLocal.y / 6. + 0.5) - 0.5) * 6.;
    float groove = (1. - smoothstep(0.15 - fy, 0.15 + fy, gy)) * step(1.5, vLocal.y);
    groove = mix(0.05, groove, 1. - smoothstep(0.2, 0.7, fy));
    float pool = (1. - smoothstep(0.125, 1.1, gy)) * 0.5;                         // glaze pooling toward each groove
    col *= 1. - sideF * tall * (0.32 * groove + 0.09 * pool);
    float s = mix(vLocal.x, vLocal.z, step(0.5, abs(n.x)));
    float ly = fract(vLocal.y / 6.) * 6. - 3.15;
    float wd = sdBox(vec2(s, ly), vec2(0.8), 0.12);
    float win = 1. - smoothstep(-fy, fy, wd);
    float lintel = win * (1. - smoothstep(0.42, 0.62, 0.8 - ly));                 // shadow under the upper edge
    float sill = (1. - smoothstep(0., 0.09 + fy, abs(wd - 0.07))) * step(ly, -0.6);
    float winFade = 1. - smoothstep(0.1, 0.4, fy);
    col *= 1. - flatSide * tall * winFade * (0.13 * win + 0.17 * lintel - 0.10 * sill);
    float door = (1. - smoothstep(-fy, fy, sdBox(vec2(s, vLocal.y - 0.9), vec2(0.5, 1.1), 0.06))) * step(11., H) * flatSide * max(step(0.5, n.z), step(0.5, -n.x));
    col = mix(col, uIndigo * 0.9, 0.82 * door);
    // hedge cells (soil.b): the sides are clad in square moss leaves
    vec2 lcell = vec2(s, vLocal.y) / 1.2; float lf = hash21(floor(lcell) + 3.);
    vec2 lq = abs(fract(lcell) - 0.5); float ledge = smoothstep(0.36, 0.48, max(lq.x, lq.y)) * (1. - smoothstep(0.1, 0.5, fy));
    float flut = 0.11 * sin(uCloudT * (1.3 + 2.2 * lf) + lf * 40.);                     // the hedge's square leaves stir
    col = mix(col, mix(uMoss, uMint, 0.3 * lf + flut) * (0.74 + 0.26 * lf + flut) * (1. - 0.2 * ledge), ivy * sideF * 0.94);
    // moss down the cold sides: under every mossed roof on unflagged soil the same square leaves hang down the north and
    // east faces (typed compass: -z and +x), 6 to 36 m by the cell's glaze jitter, each leaf column up to two leaves longer
    // than the next, whole leaves only, the windows left open, and never into the lowest 6 m above the tiles. These
    // leaves hold still (the hedge's stir reads the clock; this reads none).
    float cold = flatSide * max(step(0.5, n.x), step(0.5, -n.z)) * (1. - step(0.1, vIvy)) * vInfo.y;
    float hang = 6. + 27.6 * vMisc.x + 2.4 * hash21(vec2(floor(lcell.x) + 11., floor(vMisc.x * 251.))), leafY = (floor(lcell.y) + 0.5) * 1.2;
    col = mix(col, mix(uMoss, uMint, 0.3 * lf) * (0.74 + 0.26 * lf) * (1. - 0.2 * ledge), 0.94 * cold * step(H - hang, leafY) * step(6., leafY) * (1. - win * winFade));
    float foot = 1. - clamp(vLocal.y / max(9., H * 0.36), 0., 1.); foot *= foot;
    col = mix(col, uIndigo * 0.8, min(0.8, (1. - topF) * foot * (0.34 * clamp(vInfo.z / 5., 0., 1.) + 0.2) * uAO));
    // fired glaze on the low cubes: it pools darker toward the foot and under the rim, and in a ring inside the top's edge
    float low = 1. - tall, yN = clamp(vLocal.y / max(H, 0.5), 0., 1.);
    col *= 1. - sideF * low * (0.2 * (1. - smoothstep(0., 0.5, yN)) + 0.15 * smoothstep(0.84, 0.97, yN));
    col *= 1. - topF * low * 0.13 * smoothstep(hw - 1.5, hw - 0.75, max(abs(tp.x), abs(tp.y)));
    // and each face of a low cube is pressed with one shallow panel: a darker line with the glaze a shade paler inside it
    float pd = sdBox(vec2(s, vLocal.y - H * 0.5), vec2(hw - 0.62, max(H * 0.5 - 0.5, 0.05)), 0.16);
    float pline = (1. - smoothstep(0.045, 0.045 + fy, abs(pd))) * (1. - smoothstep(0.1, 0.45, fy));
    col *= 1. + flatSide * low * step(1.4, H) * (0.05 * step(pd, 0.) - 0.17 * pline);
    // crackle, close to the lens only: fades before its lines are finer than a pixel
    float fcr = (fy + fxz) / 0.4;
    float ck = crackle(mix(vec2(s + vLocal.y * 0.31, vLocal.y), tp, topF) / 0.4 + vMisc.x * 37.);
    float cline = 1. - smoothstep(0.012 + fcr * 0.5, 0.03 + fcr * 1.2, ck);
    col *= 1. - 0.085 * cline * (1. - smoothstep(0.06, 0.22, fcr)) * (sideF + topF);

    // the head's marking: one cream tile folded over its forward edge
    // (a square cream tile in the middle of each of its two forward faces, and one on its top)
    float tile = flatSide * (1. - smoothstep(-fy, fy, sdBox(vec2(s, vLocal.y - H * 0.52), vec2(1.15, min(0.62, H * 0.3)), 0.1)));
    float topTile = topF * (1. - smoothstep(0.95 - fxz, 0.95 + fxz, max(abs(tp.x), abs(tp.y))));
    col = mix(col, uCream, max(tile, topTile) * vInfo.w);

    // tops: a rim line and the pooled-glaze highlight, a paler rounded square pushed toward the sun
    float rim = 1. - smoothstep(0.05, 0.05 + fxz, abs(max(abs(tp.x), abs(tp.y)) - (hw - 0.8)));
    col *= 1. - 0.14 * rim * topF * (1. - smoothstep(0.08, 0.3, fxz));
    vec3 vdir = normalize(cameraPosition - vWorld + vec3(0., 1e-3, 0.));
    vec2 hc = uSun.xz * 0.75 - vdir.xz * 0.2;
    float hl = (1. - smoothstep(-0.22, 0.22, sdBox(tp - hc, vec2(hw * 0.45), 0.5))) * topF;
    col = mix(col, mix(col, uCream * 1.08, 0.3), hl * (1. - 0.4 * vInfo.y) * (1. - vInfo.w));

    vec3 base = col;
    col = faceTone(col, n);
    // the machine's moving parts and the animals are fresh from the kiln: their shade sides stay a deep coral, never brown
    col = mix(col, max(col, base * 0.5), clamp(0.6 * vMisc.y + vMisc.z, 0., 1.) * (1. - vInfo.w));
    col = mix(col, max(col, base * 0.45), vInfo.w);                                // the head's shade side is plum, never a black hole
    // the glaze breaks pale along every edge
    float wx = n.x * n.x, wz = n.z * n.z, wy = n.y * n.y, bevelF = clamp(4. * max(wx * wz, max(wx * wy, wz * wy)), 0., 1.);
    col = mix(col, mix(col, uCream, 0.5) * 1.1, bevelF * 0.7 * (1. - 0.6 * ivy) * (1. - smoothstep(0.5, 1.6, fxz + fy)));
    col = mix(col, mix(col, uIndigo, 0.25) * 0.74, cloudShade(vWorld.xz));
    col += hl * uGlow * uApricot;                                                 // faint bloom seed on highlights
    col = farTint(col, d);
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

// ---------------------------------------------------------------------------------------------
// GROUND: one quad. Sea-glass tiles with grout inside the grid, a calm checker outside it; footprints,
// neighbour occlusion, contact shadows and the cast shadows are all composed here from the textures.
// uHgt holds each cell's height last step (R) and this step (G) in 0.4 m units.
// ---------------------------------------------------------------------------------------------
const GROUND_VERT = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  varying vec3 vWorld; varying vec2 vLoc;
  void main() {
    vLoc = position.xz;
    vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const GROUND_FRAG = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D uHgt, uAoMap; uniform vec2 uOrigin; uniform float uGrid, uTanSun, uShadow, uAO, uRipple, uMeet; uniform vec4 uLane;
  varying vec3 vWorld; varying vec2 vLoc;
  ${GLSL_COMMON}
  ${GLSL_CELL}
  float inGrid(vec2 c) { return step(0., min(c.x, c.y)) * step(max(c.x, c.y), uGrid - 1.); }
  // eased height of the column standing on cell c (0 outside the grid)
  float heightAt(vec2 c, float sm, float bo) {
    vec4 h = texelFetch(uHgt, ivec2(clamp(c, vec2(0.), vec2(uGrid - 1.))), 0);
    float a = h.r * 102., b = h.g * 102.;
    return max(0., mix(a, b, (b > a && a < 0.01) ? bo : sm)) * inGrid(c);
  }
  // what the blue byte of the height texture says of tile c: x = 1 on a floor tile, y = 1 on its kerb (0, 0 elsewhere)
  vec2 floorAt(vec2 c) {
    float b = texelFetch(uHgt, ivec2(clamp(c, vec2(0.), vec2(uGrid - 1.))), 0).b * inGrid(c);
    return vec2(step(0.75, b), step(0.25, b) * (1. - step(0.75, b)));
  }
  void main() {
    float d = distance(cameraPosition, vWorld);
    vec2 g = vLoc / ${CELL}.0 + uOrigin, cell = floor(g), q = (g - cell - 0.5) * ${CELL}.0;      // q: metres from the tile centre
    float inside = inGrid(cell);
    vec2 fw2 = vec2(fwidth(g.x), fwidth(g.y)) * ${CELL}.0 + 1e-4;                                  // metres a pixel along each axis
    float fwSum = fw2.x + fw2.y, fw = mix(fw2.y, fw2.x, step(abs(q.y), abs(q.x)));               // fw: across the nearest edge of a square, so squares stay pixel-sharp at grazing angles
    float sm = uF * uF * (3. - 2. * uF), bo = backOut(uF);
    ivec2 ij = ivec2(clamp(cell, vec2(0.), vec2(uGrid - 1.)));
    vec4 tA = texelFetch(uPrev, ij, 0), tB = texelFetch(uCur, ij, 0), soil = texelFetch(uSoil, ij, 0);

    // tile glaze: mint 55 % toward cream, a whisper of per-tile jitter, a checker outside the grid
    vec3 tileC = mix(uMint, uMoss, 0.4) * 0.6;
    float chk = mod(cell.x + cell.y, 2.), tj = hash21(cell + 17.3), tk = hash21(cell.yx + 41.7);
    vec3 col = tileC * (0.9 + 0.17 * soil.g * inside);
    col = mix(col, mix(uMint, uSky, 0.5) * 0.6, 0.5 * step(0.74, tj));
    col = mix(col, mix(uMint, uCream, 0.4) * 0.7, 0.5 * step(tj, 0.74) * step(0.6, tj));
    col = mix(mix(tileC, uCream * 0.8, 0.1 + 0.2 * chk), col * (1. - 0.06 * chk), inside);
    // floors under what turns in place: the blue byte of the height texture says floor or kerb; a floor tile is glazed
    // indigo and its kerb cream, and the inlay, footprints, ripple and shadows below are laid over both. The edge between
    // two tiles is shared out over one pixel (this tile's share along each axis, the three tiles across its nearest edges)
    vec2 fAcross = sign(q), fShare = clamp(0.5 + (${CELL / 2}.0 - abs(q)) / fw2, 0.5, 1.);
    vec2 fk = mix(mix(floorAt(cell + fAcross), floorAt(cell + vec2(0., fAcross.y)), fShare.x), mix(floorAt(cell + vec2(fAcross.x, 0.)), floorAt(cell), fShare.x), fShare.y);
    col = col * (1. - 0.8 * fk.x - 0.85 * fk.y) + uIndigo * (0.8 * fk.x) + uCream * (0.85 * 0.85 * fk.y);
    // inlay: each tile is laid from nine 2 m squares, each fired a shade apart; one tile in three carries a
    // motif of squares (a cream ring, an apricot stud, four corner studs)
    float nearK = 1. - smoothstep(0.12, 0.7, fwSum), mid = 1. - smoothstep(0.3, 1.3, fwSum), edgeT = max(abs(q.x), abs(q.y));
    vec2 sc3 = floor(q / 2. + 1.5), sq = abs(fract(q / 2. + 0.5) - 0.5) * 2.;
    float sh3 = hash21(cell * 3. + sc3 + 5.);
    col *= 1. + (sh3 - 0.5) * 0.18 * mid * inside;
    float sline = 1. - smoothstep(0.04, 0.04 + fw, 1. - max(sq.x, sq.y));
    col *= 1. - 0.16 * sline * nearK * inside;
    float motif = step(tk, 0.34) * inside * mid, kind = fract(tk * 37.);
    float ringM = 1. - smoothstep(0.16, 0.16 + fw, abs(edgeT - 1.55));
    float stud = 1. - smoothstep(0.55, 0.55 + fw, edgeT);
    vec2 cq = abs(abs(q) - 2.); float corner = 1. - smoothstep(0.4, 0.4 + fw, max(cq.x, cq.y));
    col = mix(col, uCream * 0.9, 0.62 * motif * ringM * step(kind, 0.6));
    col = mix(col, mix(uApricot, uCoral, 0.3) * 0.92, 0.75 * motif * stud * step(0.35, kind) * step(kind, 0.8));
    col = mix(col, mix(uMoss, uMint, 0.3) * 0.8, 0.7 * motif * corner * step(0.6, kind));
    vec2 ck = floor(vWorld.xz / 0.42);
    col *= 1. - 0.1 * (hash21(ck) * 0.6 + hash21(floor(vWorld.xz / 0.14) + 5.) * 0.4) * (1. - smoothstep(9., 30., d));

    // footprints: warm apricot where something died, cooling to a faint ring
    float heat = mix(tA.g, tB.g, sm) * inside;
    float edge = max(abs(q.x), abs(q.y));
    float ring = 1. - smoothstep(0.12, 0.12 + fw, abs(edge - 2.05));
    float fill = smoothstep(0.1, 0.55, heat) * (1. - smoothstep(2.6 - fw, 2.6 + fw, edge));
    vec3 warm = mix(mix(uCream, uApricot, smoothstep(0.1, 0.45, heat)), mix(uApricot, uCoral, 0.7), smoothstep(0.55, 1., heat)) * (0.82 + 0.3 * heat);
    col = mix(col, warm, 0.9 * fill + 0.4 * ring * smoothstep(0.0, 0.25, heat) * (1. - fill));

    // the machine's floor: every meeting sends a square ring of warm tiles out from the midpoint, most of a tile a
    // step, cooling behind its front, so the forecourts either side of the Gun are a mosaic that beats with it
    vec2 gm = cell + 0.5 - uGun.xy; float rr = max(abs(gm.x) * 0.55, abs(gm.y));
    float front = mod(uStep + uF - uMeet + 30., 30.) * 0.9;
    float wave = (1. - smoothstep(front - 0.6, front + 0.6, rr)) * exp(-max(front - rr, 0.) / 4.5);
    float reach = (1. - smoothstep(15., 26., rr)) * smoothstep(1.5, 4., rr) * uRipple * inside;
    col = mix(col, mix(uApricot, uCoral, 0.18 + 0.3 * tk), 0.72 * wave * reach * (0.35 + 0.65 * step(0.3, tj)) * (1. - smoothstep(2.6 - fw, 2.6 + fw, edge)));

    // kerb lights: studs inlaid along both edges of the gliders' lane, lit in a chase that runs ahead of the walkers
    // toward the eater, one tile a step (each stud brightens once in eight steps, eased)
    float dl = cell.x - cell.y - uLane.x, sl = cell.x + cell.y;
    float onKerb = step(abs(abs(dl) - 5.), 0.5) * step(uLane.y, sl) * step(sl, uLane.z) * inside * uLane.w;
    float wv = mod(floor(sl * 0.5 + 0.25) - (uStep + uF), 8.), lamp = 1. - smoothstep(0., 2.5, min(wv, 8. - wv));
    float studK = (1. - smoothstep(0.75, 0.75 + fw, edge)) * onKerb * (1. - smoothstep(0.6, 2.5, fwSum));
    col = mix(col, mix(uCream, uApricot, 0.5 + 0.5 * lamp) * (0.8 + 1.15 * lamp), studK);

    // grout 0.2 m, 12 % darker, with a paler lip; fades to its mean tone when finer than two pixels
    vec2 gd2 = ${CELL / 2}.0 - abs(q);                                                               // per axis, so lines running away stay crisp
    vec2 gr2 = 1. - smoothstep(vec2(0.1), 0.1 + fw2, gd2), lp2 = 1. - smoothstep(vec2(0.06), 0.06 + fw2, abs(gd2 - 0.22));
    vec2 fd2 = 1. - smoothstep(vec2(0.2), vec2(1.1), fw2);
    vec2 ln2 = mix(vec2(0.02), 0.36 * gr2 - 0.2 * lp2 * (1. - gr2), fd2);
    col *= 1. - max(ln2.x, ln2.y);
    // each tile's glaze pools a little: a paler rounded square pushed toward the sun, gone with distance
    vec2 pc = q - uSun.xz * 0.5; vec2 pq = abs(pc) - 1.5; float pd = length(max(pq, 0.)) + min(max(pq.x, pq.y), 0.) - 0.6;
    col = mix(col, uCream * 0.9, 0.12 * (1. - smoothstep(-fw, fw, pd)) * (1. - smoothstep(0.1, 0.9, fwSum)) * (1. - fill));

    vec3 gbase = col;
    // occlusion: 5 % per living neighbour, plus a soft contact shadow against each standing neighbour
    float nb = mix(floor(tA.b * 255. / 16. + 0.03), floor(tB.b * 255. / 16. + 0.03), sm) * inside;
    float hE = heightAt(cell + vec2(1., 0.), sm, bo), hW = heightAt(cell - vec2(1., 0.), sm, bo);
    float hS = heightAt(cell + vec2(0., 1.), sm, bo), hN = heightAt(cell - vec2(0., 1.), sm, bo);
    float ct = 0.;
    ct = max(ct, min(1., hE / 2.4) * (1. - smoothstep(0., 2.6, 3. - q.x)));
    ct = max(ct, min(1., hW / 2.4) * (1. - smoothstep(0., 2.6, 3. + q.x)));
    ct = max(ct, min(1., hS / 2.4) * (1. - smoothstep(0., 2.6, 3. - q.y)));
    ct = max(ct, min(1., hN / 2.4) * (1. - smoothstep(0., 2.6, 3. + q.y)));
    col = mix(col, mix(col, uIndigo, 0.45) * 0.62, 0.7 * ct);
    col *= 1. - 0.085 * min(nb, 6.) * (1. - 0.5 * ct);
    // every old tower stands in a soft indigo pool two or three tiles wide (a blurred map of what has always stood)
    float pool = texture2D(uAoMap, g / uGrid).r * inside;
    col = mix(col, mix(col, uIndigo, 0.6) * 0.5, smoothstep(0., 0.3, pool) * min(1., 0.56 * uAO));

    // cast shadows: fixed taps toward the sun through the height field, soft wedges of sea-glass shade
    vec2 sd = uSun.xz / max(length(uSun.xz), 1e-3);
    float sh = 0., k = clamp(0.78 / max(uTanSun, 0.05), 1., 2.5);
    for (int i = 0; i < 20; i++) {
      float fi = float(i), t = (2.5 + fi * (3.5 + 0.125 * fi)) * k;
      float hh = heightAt(floor(g + sd * (t / ${CELL}.0)), sm, bo);
      sh = max(sh, smoothstep(-0.5, 1.6, hh - t * uTanSun));
    }
    col = mix(col, mix(col, uIndigo, 0.5) * 0.46, sh * uShadow * inside);
    col = mix(col, mix(col, uIndigo, 0.25) * 0.74, cloudShade(vWorld.xz) * (1. - 0.6 * sh * uShadow));
    col = max(col, mix(gbase, uIndigo, 0.3) * 0.4 * shadeHue());             // deep sea-glass, never navy black

    col = farTint(col, d);
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

// ---------------------------------------------------------------------------------------------
// ROOF GARDENS and CUBE-BIRDS: small bevelled boxes sharing one fragment shader.
// Garden boxes read their cell's texel so they ride their roof; trees sway from the trunk foot.
// ---------------------------------------------------------------------------------------------
const SMALL_FRAG = /* glsl */`
  #include <common>
  #include <fog_pars_fragment>
  varying vec3 vN, vWorld, vCol; varying vec3 vLoc; varying float vShow;
  ${GLSL_COMMON}
  void main() {
    if (vShow < 0.01) discard;
    vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
    vec3 col = vCol;
    float m = max(abs(vLoc.x), abs(vLoc.z));
    col = mix(col, mix(col, uCream, 0.3), step(0.9, n.y) * (1. - smoothstep(0.42, 0.5, m)) * 0.6);   // pooled highlight
    vec3 base = col;
    col = faceTone(col, n);
    col = max(col, base * 0.4 * shadeHue());
    col = farTint(col, distance(cameraPosition, vWorld));
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;
const GARDEN_VERT = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  attribute vec3 inset, aOff, aSize, aColor; attribute vec2 aCell; attribute vec4 aSway;   // aSway: pivot x, pivot z, height above roof of box base, phase
  uniform vec2 uOrigin; uniform float uTime;
  varying vec3 vN, vWorld, vCol; varying vec3 vLoc; varying float vShow;
  ${GLSL_COMMON}
  ${GLSL_CELL}
  void main() {
    ivec2 ij = ivec2(aCell + 0.25);
    vec4 tB = texelFetch(uCur, ij, 0), tA = texelFetch(uPrev, ij, 0), soil = texelFetch(uSoil, ij, 0);
    float e, H = easedHeight(cellHeight(tA, soil, aCell), cellHeight(tB, soil, aCell), e);
    vShow = smoothstep(104., 120., mix(tA.r, tB.r, clamp(e, 0., 1.)) * 255.);
    float bev = min(0.09, 0.2 * min(aSize.x, aSize.y));
    vec3 hs = aSize * vec3(0.5, 1., 0.5) * vShow;
    vec3 p = vec3(position.x * (hs.x - inset.x * bev), position.y * (hs.y - inset.y * bev), position.z * (hs.z - inset.z * bev));
    vLoc = vec3(position.x * (1. - inset.x * 0.15), position.y, position.z * (1. - inset.z * 0.15)) * 0.5;
    p += aOff;
    // sway: three degrees, growing with height above the trunk foot; flowers (phase < 0) nod instead
    float hgt = p.y;
    float ph = abs(aSway.w), w1 = sin(uTime * 1.3 + ph), w2 = sin(uTime * 0.83 + ph * 1.7);
    float nod = step(aSway.w, 0.);
    p.xz += (1. - nod) * hgt * 0.085 * vec2(w1 + 0.4 * w2, w2 - 0.3 * w1) * smoothstep(0., 1.5, hgt);
    p.y += nod * 0.1 * (w1 + 1.); p.xz += nod * 0.09 * vec2(w2, w1);
    vec3 w = vec3((aCell.x + 0.5 - uOrigin.x) * ${CELL}.0, H, (aCell.y + 0.5 - uOrigin.y) * ${CELL}.0) + p;
    vN = normal; vCol = aColor;
    vec4 wp = modelMatrix * vec4(w, 1.); vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const BIRD_VERT = /* glsl */`
  #include <common>
  #include <fog_pars_vertex>
  attribute vec3 inset; attribute vec4 aA, aB;     // aA: loop centre xyz + radius; aB: phase, speed, part (-1 wing, 0 body, 1 wing), size
  uniform float uTime; uniform vec3 uBirdCol, uWingCol;
  varying vec3 vN, vWorld, vCol; varying vec3 vLoc; varying float vShow;
  void main() {
    float a = aB.x + uTime * aB.y, sz = aB.w, part = aB.z;
    vec3 c = aA.xyz + vec3(cos(a) * aA.w, 2.5 * sin(a * 2. + aB.x * 3.), sin(a) * aA.w * 0.72);
    vec3 fw = normalize(vec3(-sin(a) * aA.w, 0., cos(a) * aA.w * 0.72) * sign(aB.y) + vec3(1e-4, 0., 0.));
    vec3 rt = vec3(fw.z, 0., -fw.x);
    // body: a cube; wings: square plates hinged on the body's sides, flapping about the heading
    float wing = abs(part);
    vec3 hs = mix(vec3(0.5), vec3(0.5, 0.07, 0.42), wing) * sz;
    float bev = 0.06 * sz * (1. - 0.6 * wing);
    vec3 q = vec3(position.x * (hs.x - inset.x * bev), (position.y - 0.5) * 2. * (hs.y - inset.y * bev * 0.5), position.z * (hs.z - inset.z * bev));
    float flap = sin(uTime * 8.5 + aB.x * 5.) * 0.85 + 0.15;
    float cf = cos(flap), sf = sin(flap) * part;
    q.x = (q.x + hs.x) * wing + q.x * (1. - wing);                   // wing grows outward from its hinge
    vec2 rot = vec2(q.x * cf, q.x * abs(sf) + q.y);                   // lift the wing tip
    q.xy = mix(q.xy, rot, wing);
    q.x = q.x * mix(1., part, wing) + part * 0.5 * sz;
    q.y += 0.12 * sz * sin(uTime * 8.5 + aB.x * 5. + 1.6) * (1. - wing) + wing * 0.1 * sz;
    vec3 w = c + rt * q.x + vec3(0., q.y, 0.) + fw * q.z;
    vN = normalize(rt * normal.x * mix(1., part, wing) + vec3(0., normal.y, 0.) + fw * normal.z + vec3(0., 1e-4, 0.));
    vCol = mix(uBirdCol, uWingCol, wing); vLoc = position * 0.5; vShow = 1.;
    vec4 wp = modelMatrix * vec4(w, 1.); vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

export { GLSL_COMMON, bevelBoxGeometry, parseRLE, orient, RLE, glaze, CELL };

const bitCount = (v) => { let c = 0; while (v) { c += v & 1; v >>= 1; } return c; };
function cellHeightJS(age, cap, role, flut, nbr = 0, gx = 99, gz = 99, gun = null) {
  if (age < 1) return 0;
  let h = age <= 8 ? 2.4 + (6 - 2.4) * (age - 1) / 7 : Math.min(cap * STOREY, 6 + (age - 8) * 0.75);
  if (role === 0 && flut >= 2) h = Math.min(h, 1.2);
  if (role === 5) h = age < 2 ? 4 : age < 3 ? 7.5 : 10;
  if (gun && role === 3 && Math.abs(gx) <= 20 && Math.abs(gz) <= 9) h = h * gun[1] + gun[0] * Math.exp(-gx * gx / 34) * (0.5 + 0.13 * nbr);
  else if (role === 3) h += 4;
  return h;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('glider-country-hero') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice(0, 7);
  const G = opts.gridSize ?? 128;

  // ---- sun and glaze ------------------------------------------------------------------------
  const az = THREE.MathUtils.degToRad(opts.sunAzimuth ?? 250), el = THREE.MathUtils.degToRad(opts.sunElevation ?? 38);
  const sun = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));   // azimuth 0 = north (-z), 90 = east (+x)
  const warm = opts.warmth ?? rng.range(-0.012, 0.012);                // a seed-sized lean of the whole glaze set
  const C = pal.map((h, i) => { const c = glaze(h, i === 0 ? 0.98 : 1.02); c.r *= 1 + warm; c.b *= 1 - warm; return c; });
  const horizon = opts.horizon ? opts.horizon(C) : glaze(pal[0], 0.9);
  const tone = new THREE.Vector4(...(opts.tone || [0.10, 0.28, 0.54, 0.78])), cloudU = { value: 0 };
  const common = () => ({
    uCream: { value: C[0] }, uCoral: { value: C[1] }, uApricot: { value: C[2] }, uMint: { value: C[3] }, uMoss: { value: C[4] }, uSky: { value: C[5] }, uIndigo: { value: C[6] },
    uHorizon: { value: horizon }, uSun: { value: sun }, uHaze: { value: opts.haze ?? 1400 },
    uTone: { value: tone }, uCloudT: cloudU, uCloudK: { value: opts.cloudShade ?? 0 },
  });

  // ---- the dry run and the land ---------------------------------------------------------------
  let lay = await planLand(G, opts, ctx);
  await ctx.yield?.();
  const toCell = (x, z) => [Math.floor(x / CELL + lay.ox), Math.floor(z / CELL + lay.oz)];
  const toLocal = (cx, cz, y = 0) => new THREE.Vector3((cx - lay.ox) * CELL, y, (cz - lay.oz) * CELL);    // cx, cz in cell units (cell centre = n + 0.5)
  const lane = { x: lay.gx + 26, z: lay.gz + 12 };                       // a cell on the gliders' diagonal (they walk +x +z)
  const far = lay.eater ? lay.eater.x - lane.x : (opts.avenueCells ?? 38);
  const still = ['block', 'beehive', 'loaf', 'boat', 'tub', 'pond', 'ship'];
  const stamps = [];
  // the avenue: two rows of old block towers either side of the bare lane the gliders walk
  if (opts.avenue !== false) {
    for (let k = 5; k + 3 < far; k += 5) for (const s of [-1, 1]) {
      stamps.push({ cells: parseRLE(RLE.block), x: lane.x + k + s * 5 - (s < 0 ? 0 : 1), z: lane.z + k - s * 5 - (s < 0 ? 1 : 0), age: 255, cap: rng.int(5, 11) });
    }
  }
  // seeded still-life gardens round the machine (never in the lane, never within five cells of the Gun)
  const nGardens = opts.gardens ?? 26;
  const taken = [];
  for (let t = 0, placed = 0; t < 400 && placed < nGardens; t++) {
    const name = rng.pick(still), cells = orient(parseRLE(RLE[name]), rng.int(0, 7));
    const a = rng.range(0, Math.PI * 2), r = rng.range(9, G * 0.42);
    const x = Math.round(lay.ox + Math.cos(a) * r * 1.5), z = Math.round(lay.oz + 12 + Math.sin(a) * r);
    if (x < 10 || z < 10 || x > G - 16 || z > G - 16) continue;
    const lx = x - lay.gx, lz = z - lay.gz;
    if (lx > -10 && lx < 43 && lz > -10 && lz < 17) continue;                                   // the Gun's moat
    if (Math.abs((x - z) - (lane.x - lane.z)) < 19 && x + z > lane.x + lane.z - 12) continue;   // the avenue
    if (taken.some((p) => Math.abs(p[0] - x) < 9 && Math.abs(p[1] - z) < 9)) continue;
    taken.push([x, z]); placed++;
    const dist = Math.hypot(x - lay.ox, z - lay.oz);
    stamps.push({ cells, x, z, age: rng.chance(0.25) ? rng.int(20, 90) : rng.int(120, 255), cap: Math.max(1, Math.min(6, Math.round(rng.range(0.6, 2.2) + Math.max(0, dist - 30) * 0.06 * rng.range(0, 1)))) });
  }
  // the world's own: { pattern | cells, x, z (local metres) or cx, cz (cells from the Gun's corner), age, cap };
  // opts.stamps may be a function of the layout ({ lane, far, eater, gx, gz }, all in cells from the Gun's corner)
  const info = { gx: lay.gx, gz: lay.gz, lane: { x: lane.x - lay.gx, z: lane.z - lay.gz }, far, eater: lay.eater ? { x: lay.eater.x - lay.gx, z: lay.eater.z - lay.gz } : null };
  const own = typeof opts.stamps === 'function' ? await opts.stamps(info) : (opts.stamps || []);
  if (info.plazas) lay.plazas = info.plazas;                 // boxes (cells from the Gun's corner) whose cells dance as a plaza
  for (const s of own) {
    const [cx, cz] = s.cx !== undefined ? [lay.gx + s.cx, lay.gz + s.cz] : toCell(s.x, s.z); stamps.push({ cells: s.cells || parseRLE(RLE[s.pattern] || RLE.block), x: cx, z: cz, age: s.age ?? 200, cap: s.cap ?? 2, ivy: s.ivy });
  }
  // opts.clear: boxes [x0, z0, x1, z1] (cells from the Gun's corner) that nothing may be stamped in
  if (opts.clear) for (let n = stamps.length - 1; n >= 0; n--) {
    const s = stamps[n];
    if (s.cells.some(([x, z]) => opts.clear.some((b) => s.x + x - lay.gx >= b[0] && s.x + x - lay.gx <= b[2] && s.z + z - lay.gz >= b[1] && s.z + z - lay.gz <= b[3]))) stamps.splice(n, 1);
  }
  const raise = (useStamps) => {
    const L = makeLife(G); lay.stampGun(L);
    if (lay.eater) { L.stamp(lay.eater.cells, lay.eater.x, lay.eater.z, 255, opts.eaterStoreys ?? 9); lay.eaterMask = new Uint8Array(G * G); for (const [x, z] of lay.eater.cells) lay.eaterMask[(lay.eater.z + z) * G + lay.eater.x + x] = 1; }
    if (useStamps) for (const s of stamps) L.stamp(s.cells, s.x, s.z, s.age, s.cap);
    // the walkers' track cools slowly (9 a step instead of 25), so every walker trails a wake most of the way to the next
    const wk = opts.wakeCool ?? 9;
    for (let k = 4; k <= far + 2; k++) for (let d = -3; d <= 3; d++) for (let e = 0; e <= 1; e++) { const X = lane.x + k + d, Z = lane.z + k + e; if (X > 4 && Z > 4 && X < G - 4 && Z < G - 4) L.cool[Z * G + X] = wk; }
    return L;
  };
  // assert: with everything stamped the machine is still exactly period 30 and nothing has strayed
  let L = raise(true);
  const sig = (L) => { let h = 0; for (let z = L.z0; z <= L.z1; z++) for (let x = L.x0; x <= L.x1; x++) if (L.alive[z * G + x]) h = (Math.imul(h, 31) + z * G + x) | 0; return h + L.pop * 7919; };
  await ctx.yield?.();
  for (let n = 0; n < lay.s0 - 30; n++) { L.tick(); await ctx.yield?.(); }
  const sigA = sig(L); for (let n = 0; n < 30; n++) { L.tick(); if (n % 2 === 1) await ctx.yield?.(); }
  if (sig(L) !== sigA) { lay.ok = false; L = raise(false); for (let n = 0; n < lay.s0; n++) { L.tick(); if (n % 2 === 1) await ctx.yield?.(); } }
  // soil: glaze jitter everywhere; pinned ages for the ever-living (they were authored old)
  for (let i = 0; i < G * G; i++) if (L.fixed[i] && L.alive[i]) L.age[i] = 255;
  await ctx.yield?.();
  // flight step 0: stamped things get their authored ages back; the eater's lip is not "ever-living"
  for (const s of (lay.ok ? stamps : [])) for (const [x, z] of s.cells) { const i = (s.z + z) * G + s.x + x; if (L.alive[i] && s.age < 255) L.age[i] = s.age; }
  const lipCells = [];
  if (lay.eater) for (const [x, z] of lay.eater.lip) { const i = (lay.eater.z + z) * G + lay.eater.x + x; L.fixed[i] = 0; lipCells.push(i); }
  const s0 = L.step;
  // stepped crowns: the cells of one old tower stop at slightly different storeys (per seed), so every
  // tower has terraces for its gardens instead of a flat lid; one cell of each always reaches full height
  await ctx.yield?.();
  {
    const seenT = new Uint8Array(G * G);
    for (let i = 0; i < G * G; i++) {
      if (!L.fixed[i] || !L.alive[i] || seenT[i] || L.cap[i] < 5) continue;
      const comp = [], st = [i]; seenT[i] = 1;
      while (st.length) { const j = st.pop(); comp.push(j); for (const d of [-1, 1, -G, G, -G - 1, -G + 1, G - 1, G + 1]) { const k = j + d; if (L.fixed[k] && L.alive[k] && !seenT[k]) { seenT[k] = 1; st.push(k); } } }
      const keep = rng.int(0, comp.length - 1), top = L.cap[i];
      comp.forEach((j, n) => { if (n !== keep) L.cap[j] = Math.max(3, top - rng.pick([0, 1, 1, 2, 3])); });
    }
  }

  // ---- textures: this step, last step, heights, soil ----------------------------------------------
  const mkTex = (data) => { const t = new THREE.DataTexture(data, G, G, THREE.RGBAFormat, THREE.UnsignedByteType); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
  const dCur = new Uint8Array(G * G * 4), dPrev = new Uint8Array(G * G * 4), dHgt = new Uint8Array(G * G * 4), dSoil = new Uint8Array(G * G * 4);
  await ctx.yield?.();
  for (let i = 0; i < G * G; i++) { dSoil[i * 4] = L.cap[i] * 16; dSoil[i * 4 + 1] = (rng() * 255) | 0; dSoil[i * 4 + 3] = 255; }
  // soil B: 255 = moss-clad hedge, 128 = part of the machine (the Gun's end towers and bastions take its warm banded glaze)
  for (const s of (lay.ok ? stamps : [])) if (s.ivy) for (const [x, z] of s.cells) dSoil[((s.z + z) * G + s.x + x) * 4 + 2] = Math.round(255 * Math.min(1, +s.ivy));
  for (const [x, z] of [[0, 4], [1, 4], [0, 5], [1, 5], [34, 2], [35, 2], [34, 3], [35, 3]]) dSoil[((lay.gz + z) * G + lay.gx + x) * 4 + 2] = 128;
  if (lay.eater && (opts.eaterBands ?? true)) for (const [x, z] of lay.eater.cells) dSoil[((lay.eater.z + z) * G + lay.eater.x + x) * 4 + 2] = 128;   // the eater is machinery too: banded like the Gun's bastions
  const tCur = mkTex(dCur), tPrev = mkTex(dPrev), tHgt = mkTex(dHgt), tSoil = mkTex(dSoil);
  // occlusion map: how much old, tall stuff stands round each tile, blurred three cells wide (R8 in RGBA, bilinear)
  const aoU = { value: opts.occlusion ?? 1 }, dAo = new Uint8Array(G * G * 4);
  {
    const a = new Float32Array(G * G), b = new Float32Array(G * G);   // blurred 7 x 7, weights 1 2 3 4 3 2 1
    for (let i = 0; i < G * G; i++) if (L.alive[i] && (L.fixed[i] || L.age[i] >= 60)) a[i] = Math.min(1, 0.25 + L.cap[i] * 6 / 60);
    await ctx.yield?.();
    for (let z = 0; z < G; z++) {
      for (let x = 3, i = z * G + 3; x < G - 3; x++, i++) b[i] = (a[i - 3] + a[i + 3] + 2 * (a[i - 2] + a[i + 2]) + 3 * (a[i - 1] + a[i + 1]) + 4 * a[i]) / 16;
      if (z % 64 === 63) await ctx.yield?.();
    }
    for (let z = 3; z < G - 3; z++) {
      for (let x = 0, i = z * G; x < G; x++, i++) dAo[i * 4] = Math.min(255, Math.round((b[i - 3 * G] + b[i + 3 * G] + 2 * (b[i - 2 * G] + b[i + 2 * G]) + 3 * (b[i - G] + b[i + G]) + 4 * b[i]) / 16 * 255 * 2.2));
      if (z % 64 === 63) await ctx.yield?.();
    }
  }
  await ctx.yield?.();
  const tAo = new THREE.DataTexture(dAo, G, G, THREE.RGBAFormat, THREE.UnsignedByteType); tAo.minFilter = tAo.magFilter = THREE.LinearFilter; tAo.generateMipmaps = false; tAo.needsUpdate = true;
  const gunH = [opts.pileUp ?? 26, opts.shuttleScale ?? 2.6];          // pile-up metres at the midpoint, the shuttles' height scale
  const writeTexels = () => {                       // the land as the shaders read it (R age, G heat, B neighbours*16+role, A flutter*32)
    dPrev.set(dCur);
    const x0 = L.px0 ?? 0, x1 = L.px1 ?? G - 1, z0 = L.pz0 ?? 0, z1 = L.pz1 ?? G - 1;
    for (let z = z0; z <= z1; z++) for (let x = x0, i = z * G + x0; x <= x1; x++, i++) {
      const o = i * 4, fl = Math.min(7, bitCount(L.hist[i]));
      dCur[o] = L.age[i]; dCur[o + 1] = L.heat[i]; dCur[o + 2] = L.nbr[i] * 16 + L.role[i]; dCur[o + 3] = fl * 32;
      dHgt[o] = dHgt[o + 1]; dHgt[o + 1] = Math.min(255, Math.round(cellHeightJS(L.age[i], L.cap[i], L.role[i], fl, L.nbr[i], x + 0.5 - lay.ox, z + 0.5 - lay.oz, gunH) / 0.4));
    }
    tCur.needsUpdate = tPrev.needsUpdate = tHgt.needsUpdate = true;
  };

  // ---- columns ---------------------------------------------------------------------------------
  const maxColumns = opts.maxColumns ?? 1600;
  const boxGeo = bevelBoxGeometry(false);
  const colGeo = new THREE.InstancedBufferGeometry(); colGeo.index = boxGeo.index;
  for (const k of ['position', 'inset', 'normal']) colGeo.setAttribute(k, boxGeo.getAttribute(k));
  const aCell = new THREE.InstancedBufferAttribute(new Float32Array(maxColumns * 2), 2); aCell.setUsage(THREE.DynamicDrawUsage);
  colGeo.setAttribute('aCell', aCell); colGeo.instanceCount = 0;
  const cellU = { uCur: { value: tCur }, uPrev: { value: tPrev }, uSoil: { value: tSoil }, uF: { value: 0 }, uStep: { value: 0 }, uGun: { value: new THREE.Vector4(lay.ox, lay.oz, gunH[0], gunH[1]) } };
  const originU = { value: new THREE.Vector2(lay.ox, lay.oz) };
  const mkMat = (vs, fs, extra) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...common(), ...cellU, uOrigin: originU, ...extra },
  });
  const colMat = mkMat(COLUMN_VERT, COLUMN_FRAG, { uWidth: { value: 5.6 }, uGlow: { value: opts.highlightGlow ?? 0.05 }, uAO: aoU });
  const columns = new THREE.Mesh(colGeo, colMat); columns.frustumCulled = false; columns.name = 'life-columns';
  const listColumns = () => {
    let n = 0; const a = aCell.array;
    for (let z = L.pz0 ?? 0; z <= (L.pz1 ?? G - 1); z++) for (let x = L.px0 ?? 0, i = z * G + x; x <= (L.px1 ?? G - 1); x++, i++) {
      if ((dCur[i * 4] || dPrev[i * 4]) && n < maxColumns) { a[n * 2] = x; a[n * 2 + 1] = z; n++; }
    }
    colGeo.instanceCount = n; aCell.needsUpdate = true;
  };

  // ---- ground ----------------------------------------------------------------------------------
  const gSize = opts.groundSize ?? 9000;
  const gGeo = new THREE.PlaneGeometry(gSize, gSize, 1, 1); gGeo.rotateX(-Math.PI / 2);
  const groundMat = mkMat(GROUND_VERT, GROUND_FRAG, { uHgt: { value: tHgt }, uAoMap: { value: tAo }, uGrid: { value: G }, uTanSun: { value: Math.tan(el) }, uShadow: { value: opts.shadow ?? 1 }, uAO: aoU, uMeet: { value: ((opts.meetStep ?? 30) % 30 + 30) % 30 }, uRipple: { value: opts.ripple ?? 1 },
    uLane: { value: new THREE.Vector4(lane.x - lane.z, lane.x + lane.z + 4, lane.x + lane.z + 2 * far - 8, opts.kerbLights ?? 1) } });
  const ground = new THREE.Mesh(gGeo, groundMat); ground.frustumCulled = false; ground.name = 'life-ground'; ground.position.y = -0.02;

  const object = new THREE.Group(); object.name = 'glider-country-gun';
  object.add(ground, columns);
  await ctx.yield?.();

  // ---- floors under what turns in place ---------------------------------------------------------
  // A scratch copy of the board is run through one period of the Gun (30 steps) and every cell's births are counted.
  // A cell born ten times or more turns in place (a blinker's arm 15, a pulsar's cell 10; the Gun's busiest cell 8,
  // a tile a walker crosses 2). Every tile within two cells of one is floor, and a floor tile with a bare tile on any
  // of its four sides is the kerb. Written once into the blue byte of the height texture (255 floor, 128 kerb), which
  // nothing else reads. No dice; the board itself is never touched.
  {
    const scratch = makeLife(G), born = new Uint8Array(G * G), floorOf = new Uint8Array(G * G);
    scratch.alive.set(L.alive); scratch.x0 = L.x0; scratch.x1 = L.x1; scratch.z0 = L.z0; scratch.z1 = L.z1;
    for (let n = 0; n < 30; n++) {
      scratch.tick();
      for (let z = scratch.pz0; z <= scratch.pz1; z++) for (let x = scratch.px0, i = z * G + x; x <= scratch.px1; x++, i++) born[i] += scratch.hist[i] & 1;
      await ctx.yield?.();
    }
    for (let z = 2; z < G - 2; z++) for (let x = 2, i = z * G + 2; x < G - 2; x++, i++) {
      if (born[i] >= 10) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) floorOf[i + dz * G + dx] = 1;
    }
    await ctx.yield?.();
    for (let z = 1; z < G - 1; z++) for (let x = 1, i = z * G + 1; x < G - 1; x++, i++) {
      if (floorOf[i]) dHgt[i * 4 + 2] = (floorOf[i - G] & floorOf[i - 1] & floorOf[i + 1] & floorOf[i + G]) ? 255 : 128;
    }
    await ctx.yield?.();
  }

  // ---- roof gardens: cube-trees and nodding flower cubes on everything old enough to grow moss -------
  const gCells = [];
  await ctx.yield?.();
  for (let i = 0; i < G * G; i++) if (L.alive[i] && (L.fixed[i] || L.age[i] >= 20) && !lipCells.includes(i)) gCells.push(i);
  const gi = { cell: [], off: [], size: [], col: [], sway: [] };
  const addBox = (i, ox, oy, oz, sx, sy, sz, c, ph) => { gi.cell.push(i % G, (i / G) | 0); gi.off.push(ox, oy, oz); gi.size.push(sx, sy, sz); gi.col.push(c.r, c.g, c.b); gi.sway.push(0, 0, 0, ph); };
  const tmpC = new THREE.Color();
  let gN = 0;
  for (const i of gCells) {
    if (++gN % 150 === 0) await ctx.yield?.();
    const rd = opts.roofDensity ? opts.roofDensity((i % G) - lay.gx, ((i / G) | 0) - lay.gz, L.cap[i]) : 1;
    if (rd <= 0) continue;
    const big = L.cap[i] >= 5, nt = Math.floor((big ? rng.int(1, 3) : rng.int(0, 2)) * (detail < 0.8 ? 0.67 : 1) * Math.min(1, rd) + rng() * 0.999 * (rd < 1 ? 1 : 0) * Math.min(1, rd));
    const spots = [];
    for (let t = 0; t < nt; t++) {
      let x = 0, z = 0, ok = false;
      for (let a = 0; a < 8 && !ok; a++) { x = rng.range(-1.6, 1.6); z = rng.range(-1.6, 1.6); ok = spots.every((p) => Math.abs(p[0] - x) > 1.5 || Math.abs(p[1] - z) > 1.5); }
      if (!ok) continue; spots.push([x, z]);
      const sc = rng.range(0.72, 1.3) * (L.cap[i] >= 12 ? 1.4 : 1), ph = rng.range(0.1, 6.2), th = 2 * sc * rng.range(0.85, 1.25), c1 = 2 * sc, c2 = 1.2 * sc;
      addBox(i, x, 0, z, 0.5 * sc, th, 0.5 * sc, tmpC.copy(C[2]).lerp(C[1], rng.range(0, 0.25)), ph);
      addBox(i, x, th, z, c1, c1, c1, tmpC.copy(C[4]).lerp(C[3], rng.range(0, 0.22)).multiplyScalar(rng.range(0.92, 1.05)), ph);
      addBox(i, x + rng.range(-0.25, 0.25) * sc, th + c1, z + rng.range(-0.25, 0.25) * sc, c2, c2, c2, tmpC.copy(C[4]).lerp(C[3], rng.range(0.2, 0.55)), ph);
      if (rng.chance(0.3)) addBox(i, x + rng.range(-0.2, 0.2), th + c1 + c2, z + rng.range(-0.2, 0.2), 0.62 * sc, 0.62 * sc, 0.62 * sc, tmpC.copy(C[3]), ph);
    }
    const nf = Math.round(rng.int(1, 4) * detail * Math.min(1, rd * rd));
    for (let t = 0; t < nf; t++) {
      const x = rng.range(-2.2, 2.2), z = rng.range(-2.2, 2.2); if (spots.some((p) => Math.abs(p[0] - x) < 0.6 && Math.abs(p[1] - z) < 0.6)) continue;
      const s = rng.range(0.32, 0.5), stem = rng.range(0.25, 0.6);
      addBox(i, x, 0, z, 0.1, stem, 0.1, C[3], -rng.range(0.1, 6.2));
      addBox(i, x, stem, z, s, s, s, tmpC.copy(rng.chance(0.7) ? C[1] : C[0]).lerp(C[2], rng.range(0, 0.4)), -rng.range(0.1, 6.2));
    }
  }
  const timeU = { value: 0 };
  let garden = null;
  if (gi.cell.length) {
    const gg = new THREE.InstancedBufferGeometry();
    for (const k of ['position', 'inset', 'normal']) gg.setAttribute(k, boxGeo.getAttribute(k));
    for (const [k, arr, n] of [['aCell', gi.cell, 2], ['aOff', gi.off, 3], ['aSize', gi.size, 3], ['aColor', gi.col, 3], ['aSway', gi.sway, 4]]) {
      await ctx.yield?.();
      gg.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(arr), n));
    }
    gg.instanceCount = gi.cell.length / 2;
    garden = new THREE.Mesh(gg, mkMat(GARDEN_VERT, SMALL_FRAG, { uTime: timeU })); garden.frustumCulled = false; garden.name = 'roof-gardens';
    object.add(garden);
  }
  await ctx.yield?.();

  // ---- landmarks in local space -------------------------------------------------------------------
  const westTower = toLocal(lay.gx + 1, lay.gz + 5, 84), eastTower = toLocal(lay.gx + 35, lay.gz + 3, 84);
  const meetPt = toLocal(lay.gx + 18.5, lay.gz + 4.5, 0), birthPt = toLocal(lay.gx + 26, lay.gz + 11.5, 1.5);
  const dirSE = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2), starboard = new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2);
  const laneStart = toLocal(lane.x + 0.5, lane.z + 0, 0);
  const eaterH = (opts.eaterStoreys ?? 9) * STOREY;
  const eaterPt = lay.eater ? toLocal(lay.eater.x + 2, lay.eater.z + 2, eaterH) : laneStart.clone().addScaledVector(dirSE, far * CELL * Math.SQRT2);
  const lipPt = lipCells.length ? toLocal((lipCells[0] % G) + 0.5, ((lipCells[0] / G) | 0) + 0.5, 6) : eaterPt.clone().setY(6);
  const laneLen = eaterPt.clone().setY(0).sub(laneStart).dot(dirSE);
  const camLane = (t, y) => laneStart.clone().addScaledVector(dirSE, t).addScaledVector(starboard, 21).setY(y);

  // ---- cube-birds: a cream cube and two square wings each, looping round the roof gardens ----------
  const nBirds = Math.round((opts.birds ?? 42) * detail);
  let birds = null;
  if (nBirds > 0) {
    const bGeo0 = bevelBoxGeometry(true), bg = new THREE.InstancedBufferGeometry();
    for (const k of ['position', 'inset', 'normal']) bg.setAttribute(k, bGeo0.getAttribute(k));
    const aA = new Float32Array(nBirds * 3 * 4), aB = new Float32Array(nBirds * 3 * 4);
    const homes = [westTower, eastTower, eaterPt, meetPt.clone().setY(22), birthPt.clone().setY(14), laneStart.clone().addScaledVector(dirSE, laneLen * 0.5).setY(30)];
    for (const h of opts.birdHomes || []) homes.push(new THREE.Vector3(h[0], h[1] - 6, h[2]));
    for (let b = 0; b < nBirds; b++) {
      // a loop round a home; opts.birdOk(cx, cy, cz, r) may refuse one that comes near the camera's line, and a
      // loop refused six times is lifted well above it, so no bird is ever a slab in front of the lens
      const sp0 = rng.range(0.25, 0.6) * (rng.chance(0.5) ? 1 : -1), ph = rng.range(0, 6.28), sz = rng.range(0.8, 1.3) * (opts.birdSize ?? 1);
      let h = homes[b % homes.length], r = 20, cx = 0, cy = 0, cz = 0;
      for (let t = 0; t < 7; t++) {
        h = homes[(b + t * 5) % homes.length]; r = rng.range(9, 34);
        cx = h.x + rng.range(-10, 10); cy = h.y + rng.range(3, 14); cz = h.z + rng.range(-10, 10);
        if (t === 6) cy = Math.max(cy + 30, 62);
        if (!opts.birdOk || opts.birdOk(cx, cy, cz, r)) break;
      }
      const sp = sp0 * 14 / r;
      for (let p = 0; p < 3; p++) { const o = (b * 3 + p) * 4; aA[o] = cx; aA[o + 1] = cy; aA[o + 2] = cz; aA[o + 3] = r; aB[o] = ph; aB[o + 1] = sp; aB[o + 2] = p - 1; aB[o + 3] = sz; }
    }
    bg.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); bg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
    bg.instanceCount = nBirds * 3;
    birds = new THREE.Mesh(bg, new THREE.ShaderMaterial({
      vertexShader: BIRD_VERT, fragmentShader: SMALL_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...common(), uTime: timeU, uBirdCol: { value: C[0] }, uWingCol: { value: C[0].clone().lerp(C[2], 0.35) } },
    }));
    birds.frustumCulled = false; birds.name = 'cube-birds'; object.add(birds);
  }

  // ---- running the rule in step with the flight ---------------------------------------------------
  const rate = opts.stepsPerSecond ?? 2.5;
  let S = 0, extS = null, started = false, forceJump = false, prevGl = [], curGl = [];
  const showStep = () => { L.tick(); prevGl = curGl; curGl = assignRoles(L, lay); writeTexels(); listColumns(); };
  const jumpTo = (n) => {                                   // land exactly on flight step n (prev = n, cur = n + 1)
    while (L.step - s0 < n) L.tick();
    curGl = assignRoles(L, lay); L.px0 = 0; L.px1 = G - 1; L.pz0 = 0; L.pz1 = G - 1; writeTexels(); showStep();
  };
  // flight step 0, laid out piece by piece so no part of it holds the page (the same work as jumpTo(0))
  await ctx.yield?.();
  curGl = assignRoles(L, lay); L.px0 = 0; L.px1 = G - 1; L.pz0 = 0; L.pz1 = G - 1;
  await ctx.yield?.(); writeTexels();
  await ctx.yield?.(); L.tick();
  await ctx.yield?.(); prevGl = curGl; curGl = assignRoles(L, lay);
  await ctx.yield?.(); writeTexels();
  await ctx.yield?.(); listColumns();
  await ctx.yield?.();
  const advance = (dt, time) => {
    const target = Math.max(0, extS ?? (opts.autoRun === false ? 0 : time * rate));
    if (!started || forceJump) { started = true; forceJump = false; if (Math.floor(target) + 1 > L.step - s0) jumpTo(Math.floor(target)); S = Math.max(S, target); }
    else if (target > S) S = Math.min(target, S + Math.max(0, dt) * 4.2);
    let guard = 0; while (L.step - s0 < Math.floor(S) + 1 && guard++ < 2) showStep();
    const shown = L.step - s0 - 1; if (Math.floor(S) > shown) S = shown + 0.999;
    cellU.uF.value = Math.min(1, Math.max(0, S - shown)); cellU.uStep.value = shown % 120;
  };
  // living gliders, local space, eased; nearest the Gun first. A fixed pool of vectors is refilled once per shown
  // step and frame: nothing is allocated and nothing is sorted per call (hero.gliderCount() says how many are live).
  const glPool = []; for (let i = 0; i < 24; i++) glPool.push(new THREE.Vector3());
  let glN = 0, glKeyF = -1, glKeyS = -1;
  const gliders = () => {
    const f = cellU.uF.value;
    if (f === glKeyF && L.step === glKeyS) return glPool;
    glKeyF = f; glKeyS = L.step;
    const e = f * f * (3 - 2 * f); glN = 0;
    for (let k = 0; k < curGl.length && glN < glPool.length; k++) {
      const g = curGl[k]; let p = g;
      for (let j = 0; j < prevGl.length; j++) { const q = prevGl[j]; if (Math.abs(q.x - g.x) <= 1.5 && Math.abs(q.z - g.z) <= 1.5) p = q; }
      const x = (p.x + (g.x - p.x) * e - lay.ox) * CELL, z = (p.z + (g.z - p.z) * e - lay.oz) * CELL;
      let at = glN; while (at > 0 && glPool[at - 1].x + glPool[at - 1].z > x + z) { glPool[at].copy(glPool[at - 1]); at--; }   // insertion keeps the Gun's nearest first
      glPool[at].set(x, 1.5, z); glN++;
    }
    return glPool;
  };

  const anchors = {
    westTower, eastTower, meet: meetPt, birth: birthPt, eater: eaterPt, eaterLip: lipPt,
    lane: { start: laneStart, dir: dirSE.clone(), length: laneLen, starboard: starboard.clone(), cameraOffset: 21 },
    portalSeat: { position: camLane(laneLen + 80, 8), facing: dirSE.clone().negate(), radius: 7 },
    flyThrough: [
      new THREE.Vector3(westTower.x - 220, 30, westTower.z + 22), new THREE.Vector3(westTower.x - 90, 30, westTower.z + 22),
      new THREE.Vector3(westTower.x, 30, westTower.z + 22), new THREE.Vector3(westTower.x + 48, 20, westTower.z + 24),
      new THREE.Vector3(meetPt.x - 22, 12.5, meetPt.z + 42), camLane(-2, 7), camLane(22, 4.5), camLane(90, 4.5),
      camLane(laneLen * 0.6, 6), camLane(laneLen - 25, 8), camLane(laneLen + 30, 8), camLane(laneLen + 80, 8),
    ],
    viewpoints: {
      entry: { position: new THREE.Vector3(westTower.x - 190, 30, westTower.z + 22), target: new THREE.Vector3(eastTower.x, 30, 0) },
      meeting: { position: new THREE.Vector3(meetPt.x - 55, 16, meetPt.z + 26), target: meetPt.clone().setY(2) },
      besideGlider: { position: camLane(30, 4.5), target: laneStart.clone().addScaledVector(dirSE, 42).setY(1.5) },
      eaterPass: { position: camLane(laneLen - 22, 8), target: lipPt.clone() },
    },
    steps: { meet: (opts.meetStep ?? 30), eat: lay.eatStep ?? null, period: 30, perSecond: rate, flightSteps: 105, ok: lay.ok },
  };

  anchors.bounds = { min: new THREE.Vector3(westTower.x - 12, 0, Math.min(westTower.z, eastTower.z) - 36), max: new THREE.Vector3(Math.max(eaterPt.x, eastTower.x) + 18, 84, eaterPt.z + 18) };
  const hero = {
    object, radius: 160, height: 84, center: new THREE.Vector3(60, 20, 60),
    anchors, ground: false, groundY: 0,
    // S = fractional flight step (the world sets 105 * T(u)); never runs backward, at most two whole steps a frame
    setStep(s) { extS = s; }, jumpStep(s) { extS = s; forceJump = true; }, shownStep: () => L.step - s0 - 1, setProgress(u, flightSteps = 105) { extS = Math.max(0, u) * flightSteps; },
    getStep: () => S, gliders, gliderCount: () => { gliders(); return glN; }, cellOf: toCell, localOf: toLocal, layout: lay, life: L,
    textures: { cur: tCur, prev: tPrev, heights: tHgt, soil: tSoil }, uniforms: { cell: cellU, time: timeU, origin: originU }, glazes: C,
    update(dt, time) { timeU.value = time; cloudU.value = time; advance(dt, time); },
    dispose() { tCur.dispose(); tPrev.dispose(); tHgt.dispose(); tSoil.dispose(); tAo.dispose(); },
  };
  return hero;
}
