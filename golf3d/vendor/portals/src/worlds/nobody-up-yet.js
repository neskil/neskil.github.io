// NOBODY UP YET. Seven on a July morning in a cape town about 1930: the elevated down a brick street as the sun's ruled
// edge overtakes us, a white summer hotel of a hundred empty rooms, in at a window, out over a stiff blue sea, and up the
// dunes to a boathouse door. Oil on canvas: one sun, three flat tones to a plane, white in shade is blue-green.
// Everything is shaded by the hero's style routines (src/parts/nobody-up-yet.js): no lights, no fog, flat exact colour.
// Course is +Z (south); sun and sea are to port (+X).
// THE DORIES ON THE SAND KEEP CLEAR OF THE LENS, BY PLACE. Every dory drawn up on the sand stands as a whole body (every slab of
// its hull, not its nearest visible corner) 2.0 m and more from the lens's line, on every seed. The green dory, which lay under
// the way, is typed at [13.3, 638.2], heading 0.3, and stands 2.5 m and more from it. It is a law of place: the way's points (PTS)
// are typed in this file, the same on every seed, and so is each dory's place in the list of five further down.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, HOP_PALETTE, PIG, STYLE_GLSL, hopMaterial, hopGeo, hopQuad, hopBox, hopFrame, hopRect, hopBoard, hopWall, hopWindow, hopFinish, hopShadowMesh } from '../parts/nobody-up-yet.js';

const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const HOX = 18.5, HOY = 18.5, HOZ = 385;          // the hotel's origin in the world (its base is the bluff top)
const SX = -52;                                  // Front Street runs 52 m west of the hotel's axis, so the hotel is seen aslant from the first frame
const EYE = 9.6, DECK = 7, ROWX = SX - 7, PORTX = SX + 9.5; // the elevated on Front Street
const SEA_Y = -0.5, END_Z = 800, END_Y = 16.75, TWX = 16, TWZ = 712;   // TWX, TWZ: the light tower
// THE FLANK RUN (the design's own flight). The street starts where the row of fronts is already beside the eye (z -12). The
// trestle leaves the street at z 190 and climbs the hill on one open curve to the south-east, past the scattered mansard
// houses, with the hotel growing ahead to port (cream north end, the flank running off, the sea beyond it), to the buffers at
// z 300. The eye goes on level at second-floor height and closes on the west flank on one straight slant, 14 m off at z 330 to
// 6 m at z 458, room after room opening, then in at the dining-room window. Every later beat is keyed by PLACE (zToU below).
const PTS = [[SX, EYE, -12], [SX, EYE, 60], [SX, EYE, 130], [SX, EYE, 190], [-50, 11.5, 213], [-42.5, 15.3, 234], [-31.5, 19.2, 254], [-22.5, 22.4, 271], [-16.5, 24.2, 285], [-11.5, 24.7, 296.5],
  [-7, 24.8, 307], [-2.8, 24.8, 318], [0.3, 24.8, 331], [2.3, 24.8, 352], [3.7, 24.8, 375], [5, 24.8, 398], [6.3, 24.8, 420], [7.4, 24.8, 440],
  [8, 24.8, 458], [8, 24.8, 470], [8, 24.8, 484], [8, 24.4, 494], [8.5, 14, 516], [10, 4.2, 540], [12, 2.6, 575], [12, 2.6, 625],
  [4, 3.4, 650], [-10.8, 5.6, 667], [-15.9, 7.8, 682], [-7.5, 9.6, 697], [1.5, 11.6, 714], [1.5, 13.7, 735], [0, 15.4, 760], [0, 16.3, 780], [0, END_Y, END_Z]];
const axisX = (z) => { let i = 0; while (i < PTS.length - 2 && PTS[i + 1][2] < z) i++; const a = PTS[i], b = PTS[i + 1]; return mix(a[0], b[0], Math.max(0, Math.min(1, (z - a[2]) / Math.max(1e-6, b[2] - a[2])))); };

// the land, as one function: street, headland, hill, bluff, cove, beach, dunes
function landH(x, z, n2) {
  const up = ss(190, 300, z);
  const pw = HOY * up - 6.5 * ss(490, 800, z);                                   // west of the cove the bluff runs on
  const drop = ss(488, 502, z), pe = HOY * up * (1 - drop) - 3 * drop + 15 * Math.max(ss(612, 800, z), 0.25 * ss(610, 644, z) + 0.09 * ss(652, 668, z));   // a shelf of sand at the head of the cove: the beach   // on the course: bluff, the drop, cove, dunes
  let h = mix(pw, pe, ss(-135, -85, x));
  // the light's shelf: east of the course the dunes step down to a low green shelf and the shore cuts in behind it, so the
  // tower and the keeper's house stand against the sea with a level horizon
  const fin = z > 670 && z < 775 ? ss(678, 696, z) * (1 - ss(744, 768, z)) : 0, shelf = fin * ss(3, 19, x);
  h = mix(h, 3.4, shelf);
  const coast = z < 190 ? 250 : mix(46, 64, ss(480, 700, z)) - 28 * ss(684, 704, z) * (1 - ss(742, 772, z)) + 40 * ss(820, 900, z);
  h = mix(h, -3, ss(coast, coast + 16, x));
  if (z < 300) h += 60 * ss(48, 135, x) * (1 - ss(150, 262, z)) * (1 - ss(250, 330, x) * 0.6);   // the headland to port
  const roll = z > 196 ? ss(196, 240, z) : 0, dune = ss(640, 720, z);
  const off = Math.abs(x - axisX(z));
  if (roll > 0 && h > 0.5) h += n2(x * 0.012, z * 0.012) * (1.2 + 2.2 * dune) * roll * ss(7, 26, off) * (z > 300 && z < 490 && x > -30 ? 0 : 1);
  if (z > 690 && h > 2) {                                      // dune ridges running inland: a gentle side to the sun, a steep lee in shade
    const p = x * 0.2 + n2(x * 0.02 + 7, z * 0.02) * 2.4 + z * 0.03;
    h += 3.1 * Math.sin(p - 0.5 * Math.cos(p)) * ss(690, 735, z) * ss(7, 21, off) * (1 - shelf) * (1 - 0.8 * ss(760, 782, z) * (1 - ss(17, 32, Math.abs(x))));
  }
  if (z > 650 && z < 780) h += 3.2 * ss(660, 686, z) * (1 - ss(728, 770, z)) * (1 - ss(7, 26, off));   // the course runs up a dune of its own, so the eye rides low over the ranks and looks down on the shelf
  if (z > 745) h -= 2 * ss(750, 782, z) * (1 - ss(18, 36, Math.abs(x)));     // the boathouse stands in a hollow, its sill 2 m under the portal's
  if (z > 680 && z < 745) h += 1.3 * (1 - ss(5, 15, Math.hypot(x - TWX, z - TWZ)));   // the light stands on a low knoll
  if (z > 600 && h < -0.15) h = -0.15 - (-0.15 - h) * 6;               // the beach goes under steeply, so the waterline is one ruled edge
  return h;
}

export default {
  id: 'nobody-up-yet',
  name: 'Nobody Up Yet',
  category: 'artists',
  placeKind: 'city',
  after: 'Edward Hopper, 1882 to 1967',
  weirdness: 0.15,
  media: ['rail', 'air'],
  async build(ctx) {
    const rng = ctx.rng, Y = ctx.yield, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    const renderer = ctx.renderer;
    // ---- the edition, chosen once by seed -------------------------------------------------------------------------
    const evening = vary.hour === 'golden';
    const october = rng() > 0.76, clouds = rng() < 0.38, straw = rng() < 0.24, greenRow = rng() < 0.3, coaster = rng() < 0.4;
    const rare = !!vary.rare, density = vary.density ?? 1;
    const n2 = (x, z) => ctx.noise.fbm2(x, z, 3);
    const H = (x, z) => landH(x, z, n2);

    // ---- the hero ---------------------------------------------------------------------------------------------------
    const path = makePath(PTS);
    const tab = []; { const v = new THREE.Vector3(); for (let i = 0; i <= 900; i++) { path.pointAt(i / 900, v); tab.push([v.z, v.x, v.y]); } }
    const atZ = (z) => {                                           // the path where it crosses this z (z rises all the way)
      let lo = 0, hi = 900; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] < z) lo = m; else hi = m; }
      const a = tab[lo], b = tab[hi], t = Math.max(0, Math.min(1, (z - a[0]) / Math.max(1e-6, b[0] - a[0])));
      return { u: (lo + t) / 900, x: mix(a[1], b[1], t), y: mix(a[2], b[2], t) };
    };
    const pathX = (z) => atZ(z).x, zToU = (z) => atZ(z).u;
    const hero = await buildHero(ctx, { palette: HOP_PALETTE, detail, colourway: straw ? 'straw' : 'white', october, evening, apron: false, clearBays: [[3, 5], [3, 6]], bareBays: [], openBays: [], curtainBays: [], curtainShare: 0.3, heroBay: 14 });   // the long curtain hangs in the first bay south of the tower pavilion (bays 11 to 13): the design's closest pass, "u 0.5 ... the curtain at 3 m"
    await Y();
    const U = hero.uniforms;
    hero.object.position.set(HOX, HOY, HOZ); scene.add(hero.object);
    const curtainU = zToU(HOZ + hero.anchors.curtain.z - 9);
    const mat = hopMaterial(U), matD = hopMaterial(U, { side: THREE.DoubleSide }), roomMat = hero.roomMaterial;
    const toHotel = (g) => g.translate(-HOX, -HOY, -HOZ);       // rooms live in the hotel's frame (their slab test is hotel-local)
    let G = hopGeo(); const R = hopGeo();                            // all the town's slabs, all the town's rooms
    const flushG = async (name) => { await Y(); const o = new THREE.Mesh(hopFinish(G), mat); o.name = name; o.frustumCulled = false; scene.add(o); G = hopGeo(); await Y(); };
    const addMesh = (geo, m, name, parent = scene) => { const o = new THREE.Mesh(geo, m); o.name = name; o.frustumCulled = false; parent.add(o); return o; };

    const treeU = Array.from({ length: 23 }, () => new THREE.Vector4(0, -999, 0, 0));   // the tree masses, for the long shadows they throw on the grass
    // ---- the ground: one sheet of opaque paint (street, grass in ranks, sand), toned by the same sun ---------------
    {
      const X0 = -330, X1 = 420, Z0 = -160, Z1 = 1010, ST = 6, nx = Math.round((X1 - X0) / ST), nz = Math.round((Z1 - Z0) / ST);
      const pos = new Float32Array((nx + 1) * (nz + 1) * 3), nor = new Float32Array((nx + 1) * (nz + 1) * 3);
      for (let j = 0, k = 0; j <= nz; j++) {
        const z = Z0 + j * ST;
        for (let i = 0; i <= nx; i++, k += 3) {
          const x = X0 + i * ST, h = H(x, z), dx = H(x + 1.5, z) - H(x - 1.5, z), dz = H(x, z + 1.5) - H(x, z - 1.5), l = Math.hypot(dx, 3, dz);
          pos[k] = x; pos[k + 1] = h; pos[k + 2] = z; nor[k] = -dx / l; nor[k + 1] = 3 / l; nor[k + 2] = -dz / l;
        }
        if (j % 2 === 0) await Y();
      }
      const idx = new Uint32Array(nx * nz * 6);
      for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const gm = new THREE.ShaderMaterial({
        uniforms: { ...U, uTree: { value: treeU } }, toneMapped: false,
        vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; void main(){ vW = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          varying vec3 vW; varying vec3 vN; uniform vec4 uTree[23];
          void main(){
            vec3 n = vN / max(length(vN), 1e-4);
            float tsh = -1.; vec3 ps = vW + n * .05;                                  // the sun ray against each tree mass
            for (int i = 0; i < 23; i++) { vec3 d = uTree[i].xyz - ps; float b = dot(d, uSun); tsh = max(tsh, b > 0. ? b * b - dot(d, d) + uTree[i].w * uTree[i].w : -1.); }
            float tw = max(fwidth(tsh), 1e-4), inT = smoothstep(-tw, tw, tsh);
            float wob = (texture2D(uNoise, vW.xz * .013).r - .5);
            float st = min(196. - vW.z + wob * 3., min(vW.x + ${(40 - SX).toFixed(1)}, ${(46 + SX).toFixed(1)} + wob * 4. - vW.x));                 // the street's paving
            float sd = max(vW.z > 470. ? .8 - n.y : -1., min(vW.z - 600., 1.6 + wob * 1.8 - vW.y)); // cliff faces and the beach
            float m = max(st, sd); float w = max(fwidth(m), 1e-4);
            float a = smoothstep(-w, w, m);
            vec3 nn = n.y > .86 ? vec3(0., 1., 0.) + n * .001 : n;
            // the ground is brushed, not modelled: hummocks a few metres across, long from north to south, turn the plane toward and
            // away from the one sun, so the grass falls into slabs of straw and of its dark green whose edges swing as the sun climbs
            float fp = length(fwidth(vW.xz));
            vec2 hq = vW.xz + (texture2D(uNoise, vW.xz * vec2(.0031, .0007)).r - .5) * vec2(9., 0.);
            vec4 ph = vec4(hq.x * .55 + hq.y * .10, hq.x * .83 - hq.y * .17 + 1.7, hq.x * 1.31 + hq.y * .22 + 4.1, hq.x * .37 - hq.y * .06 + 2.6);
            vec4 am = vec4(.55, .58, .66, .44) * (1. - smoothstep(vec4(.1), vec4(.26), fp * vec4(.088, .135, .21, .06)));
            float hsl = dot(am, cos(ph)) * (vW.z > 600. ? .3 : vW.z > 196. ? .13 : 0.) * step(.7, n.y);
            vec3 nh = normalize(n - vec3(hsl, 0., hsl * .15));
            vec3 cg = hopTone(13., nh, vW, n.y > .7 ? .4 : 0., -1.);
            cg = mix(cg, hopTab(13., 2), inT * step(.03, dot(nh, uSun)));
            float gust = smoothstep(.5, .72, sin(dot(vW.xz, vec2(.045, .028)) - uTime * .8 + wob * 3.));       // the wind combs the grass in travelling waves: the ranks thicken where it passes
            float inC = hopCast(vW + n * .04, 0.) * step(.03, dot(n, uSun));
            cg = mix(cg, hopTab(13., 1), hopRule(vW.z, .8, .19) * inC * step(.7, n.y));
            cg = mix(cg, mix(hopTab(13., 2), hopTab(13., 1), inC), hopRule(vW.z + .2, .4, .11) * gust * step(.7, n.y));
            vec3 ns = n.y > .8 ? normalize(n + vec3(0., 1.6, 0.)) : n;                                      // level sand is one slab: only a real lee slope turns to shade
            vec3 co = hopTone(st > sd ? 7. : 0., st > sd ? n : ns, vW, 0., -1.);
            float wy = max(fwidth(vW.y), 1e-4);                                                               // wet sand at the water's edge: one band of white's shade
            co = mix(co, hopTab(0., 1), (1. - smoothstep(-wy, wy, vW.y - .1 - wob * .35)) * step(600., vW.z) * step(st, sd));
            co = mix(co, hopTab(0., 1), hopRule(vW.y + wob * .3, .52, .022) * step(600., vW.z) * step(st, sd) * step(vW.y, 1.75) * step(.8, n.y));   // tide lines: the sea's ruled marks up the sand, one to each half metre of height
            gl_FragColor = vec4(mix(cg, co, a), 1.);
          }`,
      });
      addMesh(g, gm, 'ground');
    }
    await Y();

    // ---- the sea: stiff ridges in rows, three tones by the facet's facing --------------------------------------------
    // uBoat: the sloop's place and heading on the water (x, z, cos, sin), uHull its half length, uSailT its sails and hull as
    // triangles in its own upright plane (along the keel, up): the sea paints the boat's thrown shadow and its wake by them
    const seaU = { ...U, uAmp: { value: october ? 1.5 : 1 }, uBoat: { value: new THREE.Vector4(0, -9999, 1, 0) }, uHull: { value: 5 }, uSailT: { value: Array.from({ length: 21 }, () => new THREE.Vector2()) } };
    {
      const N = 110, NZ = 190, X0 = -120, X1 = 320, Z0 = 470, Z1 = 760, pos = [], amp = [], idx = [];
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= N; i++) {
        const fx = i / N, fz = j / NZ; pos.push(X0 + (X1 - X0) * fx, SEA_Y, Z0 + (Z1 - Z0) * fz);
        amp.push(Math.min(1, 6 * Math.min(fx, 1 - fx, fz, 1 - fz)));
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      await Y();
      const far = [[-900, -900], [3400, -900], [3400, 3400], [-900, 3400]], b0 = pos.length / 3;
      for (const [x, z] of far) { pos.push(x, SEA_Y - 0.25, z); amp.push(0); }
      idx.push(b0, b0 + 3, b0 + 1, b0 + 1, b0 + 3, b0 + 2);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAmp', new THREE.Float32BufferAttribute(amp, 1)); g.setIndex(idx);
      const WAVE = /* glsl */`
        uniform float uAmp;
        vec3 seaH(vec2 p, float t){                                 // height and its gradient: three marching rows
          float a = (p.x * .31 + p.y * .95) * .92 - t * 1.9, b = (p.x * .28 + p.y * .96) * .23 - t * .8, c = (p.x * -.55 + p.y * .83) * 2. - t * 2.7;
          float h = .25 * sin(a) + .5 * sin(b) + .025 * sin(c);
          vec2 g = .25 * .92 * cos(a) * vec2(.31, .95) + .5 * .23 * cos(b) * vec2(.28, .96) + .025 * 2. * cos(c) * vec2(-.55, .83);
          return vec3(h, g) * uAmp;
        }`;
      const sm = new THREE.ShaderMaterial({
        uniforms: seaU, toneMapped: false,
        vertexShader: /* glsl */`${WAVE} uniform float uTime; attribute float aAmp; varying vec3 vW;
          void main(){ vec3 p = position; p.y += seaH(p.xz, uTime).x * aAmp; vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: /* glsl */`
          ${STYLE_GLSL}
          ${WAVE}
          varying vec3 vW; uniform vec4 uBoat; uniform float uHull; uniform vec2 uSailT[21];
          float edgeIn(vec2 p, vec2 a, vec2 b, vec2 c){             // metres inside the triangle a b c (negative outside), either winding
            float ar = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x), sg = ar < 0. ? -1. : 1.;
            float e0 = ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / max(length(b - a), 1e-3);
            float e1 = ((c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x)) / max(length(c - b), 1e-3);
            float e2 = ((a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x)) / max(length(a - c), 1e-3);
            return abs(ar) < 1e-3 ? -1. : min(sg * e0, min(sg * e1, sg * e2));
          }
          void main(){
            vec3 hg = seaH(vW.xz, uTime);
            float sl = normalize(uSun.xz + vec2(1e-4)).x * hg.y + normalize(uSun.xz + vec2(1e-4)).y * hg.z;   // slope toward the sun
            float fine = length(fwidth(vW.xz)) * .62;
            float w = max(fwidth(sl), 1e-4);
            float lit = smoothstep(-w, w, -sl - .02);
            float lw = max(fwidth(hg.x), 1e-4), low = 1. - smoothstep(-lw, lw, hg.x + .42 * uAmp);
            vec3 col = mix(uTab[7], uTab[6], lit); col = mix(col, uTab[8], low * (1. - lit));
            // short level dabs of the neighbouring tone, laid along the ridges: the sea is painted, not ruled
            vec2 dq = vec2(vW.x * .95 - vW.z * .31, vW.x * .31 + vW.z * .95);
            float dn = texture2D(uNoise, dq * vec2(.0045, .042) + vec2(0., uTime * .004)).r, dw = max(fwidth(dn), 1e-4);
            float dab = smoothstep(-dw, dw, dn - .76) * (1. - smoothstep(.12, .3, fine));
            col = mix(col, mix(uTab[6], uTab[7], lit), dab * (1. - low * (1. - lit)));
            col = mix(col, mix(uTab[7], uTab[6], .5), smoothstep(.3, .85, fine));
            // thrown shadows on the water, ruled: the bluff's (the sun ray from this point back to the cliff's brow at z 494, 18.5 m
            // up, between the cove's west shore and the coast), the wing's and every caster's (hopCast), and the sloop's own sails
            vec3 flat0 = vec3(vW.x, ${SEA_Y.toFixed(1)}, vW.z);
            float wobS = (texture2D(uNoise, vW.xz * .021).r - .5) * 1.6;
            float tb = (vW.z - 494.) / max(-uSun.z, .05), xb = vW.x + uSun.x * tb;
            float bl = min(min(18.5 - uSun.y * tb + wobS, tb), min(50. - xb, xb + 110.)), bw = max(fwidth(bl), 1e-4);
            float sh = max(smoothstep(-bw, bw, bl), hopCast(flat0 + vec3(0., .3, 0.), wobS * .08));
            vec2 bd = vW.xz - uBoat.xy; vec2 lb = vec2(bd.x * uBoat.z - bd.y * uBoat.w, bd.x * uBoat.w + bd.y * uBoat.z);      // across the keel, along it
            vec3 sb = vec3(uSun.x * uBoat.z - uSun.z * uBoat.w, uSun.y, uSun.x * uBoat.w + uSun.z * uBoat.z);
            float ts = -lb.x / (sign(sb.x + 1e-6) * max(abs(sb.x), .05)); vec2 qs = vec2(lb.y + sb.z * ts, -.2 + sb.y * ts);
            float ins = -1.;
            for (int i = 0; i < 7; i++) ins = max(ins, edgeIn(qs, uSailT[i * 3], uSailT[i * 3 + 1], uSailT[i * 3 + 2]));
            float iw = max(fwidth(ins), 1e-4); sh = max(sh, smoothstep(-iw, iw, ins + wobS * .03) * step(0., ts));
            col = mix(col, mix(uTab[8], uTab[7], lit), sh);
            // crests: one ruled stroke of cream along the top of each marching ridge where the swell lifts it, broken as the brush
            // lifts; white in shade is blue-green, so under a thrown shadow the stroke is blue-green
            float pa = (vW.x * .31 + vW.z * .95) * .92 - uTime * 1.9;
            float brk = texture2D(uNoise, dq * vec2(.015, .047) + vec2(.3, uTime * .006)).r, kw = max(fwidth(brk), 1e-4);
            float crest = hopRule((pa - 1.5708) / .92, 6.8296, .19) * smoothstep(-kw, kw, brk - .55) * step(.05 * uAmp, hg.x) * (1. - smoothstep(.2, .55, fine));
            // the sloop's wake: two short ruled strokes opening astern, broken as the brush lifts, gone within a hull's length
            // and a quarter (uHull is the half length; a mark at the stern, never a line across the cove)
            float sa = -uHull - lb.y, sc = clamp(sa, 0., 2.5 * uHull);
            float wl = abs(abs(lb.x) - (.5 + .2 * sc)) - (.08 + .012 * sc), ww = max(fwidth(wl), 1e-4);
            float wk = (1. - smoothstep(-ww, ww, wl)) * smoothstep(-kw, kw, brk - .3) * (1. - smoothstep(1.25 * uHull, 2.5 * uHull, sa)) * step(0., sa);
            col = mix(col, mix(uTab[0], uTab[1], sh), max(crest, wk));
            gl_FragColor = vec4(col * (1. + (hopDrag(vW, vec3(0., 1., 0.)) - .5) * .07), 1.);
          }`,
      });
      addMesh(g, sm, 'sea');
    }
    await Y();

    // ---- the bare sky: the only gradient in the world; in some editions three level bars of cream cloud low to port ---
    const skyU = { ...U, uCloud: { value: clouds ? 1 : 0 } };
    const sky = addMesh(new THREE.SphereGeometry(3200, 32, 20), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, toneMapped: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        ${STYLE_GLSL}
        uniform float uCloud; varying vec3 vD;
        void main(){
          vec3 d = vD / max(length(vD), 1e-4);
          vec3 col = hopSky(d);
          float az = atan(d.z, abs(d.x) + 1e-4) + uTime * .004;                   // port side only (d.x > 0)
          for (int i = 0; i < 3; i++) {
            float fi = float(i), y0 = .075 + fi * .05, th = .016 - fi * .003, c = -.25 + fi * .42, len = .5 - fi * .1;
            float e = max(abs(d.y - y0) / th - 1., (abs(az - c) - len) / .02);
            float inb = step(e, 0.) * step(0., d.x) * uCloud;
            col = mix(col, d.y > y0 - th * .35 ? uTab[0] : mix(uTab[1], uSkyHor, .45), inb);
          }
          float hw = max(fwidth(d.y), 1e-5);
          col = mix(mix(uTab[7], uTab[6], .5), col, smoothstep(-hw, hw, d.y + .002));   // under the horizon: sea
          gl_FragColor = vec4(col, 1.);
        }`,
    }), 'sky');
    sky.renderOrder = -1;

    await Y();
    // ---- building blocks of the town (all slabs go into G, all rooms into R) -------------------------------------------
    let nBox = 6;                                                 // caster boxes after the hotel's six
    const caster = (x0, y0, z0, x1, y1, z1) => { if (nBox >= 22) return; U.uBoxMin.value[nBox].set(x0 - HOX, y0 - HOY, z0 - HOZ); U.uBoxMax.value[nBox].set(x1 - HOX, y1 - HOY, z1 - HOZ); nBox++; };
    const fpt = (F, u, y, d) => [F.O[0] + F.R[0] * u - F.N[0] * d, F.O[1] + y, F.O[2] + F.R[2] * u - F.N[2] * d];
    const blindOf = () => ({ drop: october ? 0.96 : (rng() < 0.08 ? 0 : 0.12 + 0.7 * rng()), pig: rng() < 0.45 ? PIG.GREEN : PIG.STRAW, ph: rng() });
    // one window with its room behind: dark box, far window (a painted pane with its sill), the sun's slab by either window
    const winRoom = (F, h, fl, top, u0, u1, depth, o = {}) => {
      const b = o.blind || blindOf(), ax = Math.abs(F.N[0]) > 0.5 ? 0 : 1;
      const cur = depth > 0 && o.curtain && rng() < o.curtain;
      if (cur) b.drop = Math.min(b.drop, 0.25);
      hopWindow(G, F, h, { blind: b.drop, blindPig: b.pig, phase: b.ph, glass: !depth, open: o.open || cur, rev: o.rev });
      if (cur) {                                                  // a white curtain, blown out through the raised sash and sucked back
        const len = (h.y1 - h.y0) * 0.78, ph = rng(), thr0 = 2.3 + rng(), thin = o.thin && ph > o.thin, thr = o.thin ? thr0 * 0.5 : thr0, wm = [F.N[0] * thr * 0.4, 0.1, F.N[2] * thr * 0.4, ph], wb = [F.N[0] * thr, 0.45, F.N[2] * thr, ph], z4 = [0, 0, 0, 0];
        const a = fpt(F, h.u - h.hw * 0.9, h.y1 - 0.12, 0.2), b2 = fpt(F, h.u + h.hw * 0.9, h.y1 - 0.12, 0.2), c = fpt(F, h.u + h.hw * 0.8, h.y1 - 0.12 - len * 0.5, 0.2), d = fpt(F, h.u - h.hw * 0.8, h.y1 - 0.12 - len * 0.5, 0.2);
        const e = fpt(F, h.u + h.hw * 0.7, h.y1 - 0.12 - len, 0.2), f = fpt(F, h.u - h.hw * 0.7, h.y1 - 0.12 - len, 0.2);
        if (!thin) {                                              // on the street only one window in a few blows a curtain, and a short one: more read as stray shapes on the brick
          hopQuad(G, d, c, b2, a, PIG.WHITE, 0, [wm, wm, z4, z4]); hopQuad(G, f, e, c, d, PIG.WHITE, 0, [wb, wb, wm, wm]);
          hopQuad(G, c, d, a, b2, PIG.WHITE, 0, [wm, wm, z4, z4]); hopQuad(G, e, f, d, c, PIG.WHITE, 0, [wb, wb, wm, wm]);
        }
      }
      if (!depth) return b;
      const d0 = 0.3, d1 = depth, yf = fl + 0.05, yc = top - 0.3, yb = h.y1 - (h.y1 - h.y0) * b.drop, fd = 0.2 + 0.5 * rng(), hl = h.y1 - (h.y1 - h.y0) * fd;
      const c1 = fpt(F, h.u, (h.y0 + yb) * 0.5, 0.15), c2 = fpt(F, h.u, (h.y0 + hl) * 0.5, d1);
      R.win = [c1[0] - HOX, c1[1] - HOY, c1[2] - HOZ, h.hw, Math.max(0, (yb - h.y0) * 0.5), ax]; R.win2 = [c2[0] - HOX, c2[1] - HOY, c2[2] - HOZ, h.hw, (hl - h.y0) * 0.5, ax];   // hotel-local, as the rooms are
      hopQuad(R, fpt(F, u0, yf, d0), fpt(F, u1, yf, d0), fpt(F, u1, yf, d1), fpt(F, u0, yf, d1), PIG.ROOMFLOOR);
      hopQuad(R, fpt(F, u0, yc, d1), fpt(F, u1, yc, d1), fpt(F, u1, yc, d0), fpt(F, u0, yc, d0), PIG.ROOMCEIL);
      hopQuad(R, fpt(F, u0, yf, d0), fpt(F, u0, yf, d1), fpt(F, u0, yc, d1), fpt(F, u0, yc, d0), PIG.ROOMWALL);
      hopQuad(R, fpt(F, u1, yf, d1), fpt(F, u1, yf, d0), fpt(F, u1, yc, d0), fpt(F, u1, yc, d1), PIG.ROOMWALL);
      hopRect(R, F, u0, yf, h.u - h.hw, yc, d1, PIG.ROOMWALL); hopRect(R, F, h.u + h.hw, yf, u1, yc, d1, PIG.ROOMWALL);
      hopRect(R, F, h.u - h.hw, yf, h.u + h.hw, h.y0, d1, PIG.ROOMWALL); hopRect(R, F, h.u - h.hw, hl, h.u + h.hw, yc, d1, PIG.ROOMWALL);
      hopRect(R, F, h.u - h.hw, h.y0, h.u + h.hw, hl, d1, o.pane === false ? PIG.DARK : PIG.PANE);
      hopRect(R, F, h.u - h.hw, h.y0 - 0.1, h.u + h.hw, h.y0, d1 - 0.12, PIG.ROOMCEIL);
      R.win = null; R.win2 = null;
      return b;
    };
    // a storey of n bays between u0 and u1: wall with holes, windows, rooms
    const storey = (F, u0, u1, fl, top, n, wy0, wy1, hw, pig, line, depth, o) => {
      const bw = (u1 - u0) / n, holes = [];
      for (let i = 0; i < n; i++) holes.push({ u: u0 + (i + 0.5) * bw, hw, y0: wy0, y1: wy1 });
      hopWall(G, F, u0, u1, fl, top, holes, pig, line);
      for (let i = 0; i < n; i++) winRoom(F, holes[i], fl, top, u0 + i * bw + 0.12, u0 + (i + 1) * bw - 0.12, depth, o);
    };
    const cornice = (F, u0, u1, y, hgt, out, pig, brackets = true) => {
      hopBoard(G, F, u0 - 0.1, y - hgt, u1 + 0.1, y, out, pig);
      if (brackets) for (let u = u0 + 0.5; u < u1 - 0.3; u += 1.25) hopBoard(G, F, u, y - hgt - 0.5, u + 0.2, y - hgt, out * 0.7, pig);
    };
    // a mansard: steep slabs, a flat deck; with dormers given as [{ F, u }]
    const frustum = (x0, x1, z0, z1, y0, y1, inx, inz, pig, ln, topPig = pig) => {
      const a = [x0, y0, z0], b = [x1, y0, z0], c = [x1, y0, z1], d = [x0, y0, z1];
      const A = [x0 + inx, y1, z0 + inz], B = [x1 - inx, y1, z0 + inz], C = [x1 - inx, y1, z1 - inz], D = [x0 + inx, y1, z1 - inz];
      hopQuad(G, b, a, A, B, pig, ln); hopQuad(G, c, b, B, C, pig, ln); hopQuad(G, d, c, C, D, pig, ln); hopQuad(G, a, d, D, A, pig, ln);
      hopQuad(G, D, C, B, A, topPig, 0);
    };
    const dormer = (F, u, y0, hw, hh, bl) => {
      const y1 = y0 + hh, back = 1.4, a = u - hw - 0.2, b = u + hw + 0.2;
      hopWall(G, F, a, b, y0, y1 + 0.2, [{ u, hw, y0: y0 + 0.25, y1 }], PIG.WHITE);
      hopWindow(G, F, { u, hw, y0: y0 + 0.25, y1 }, { blind: bl.drop, blindPig: bl.pig, phase: bl.ph, glass: true, rev: 0.18 });
      hopQuad(G, fpt(F, a, y0, back), fpt(F, a, y0, 0), fpt(F, a, y1 + 0.2, 0), fpt(F, a, y1 + 0.2, back), PIG.ROOF);
      hopQuad(G, fpt(F, b, y0, 0), fpt(F, b, y0, back), fpt(F, b, y1 + 0.2, back), fpt(F, b, y1 + 0.2, 0), PIG.ROOF);
      hopQuad(G, fpt(F, a - 0.15, y1 + 0.2, -0.2), fpt(F, b + 0.15, y1 + 0.2, -0.2), fpt(F, b + 0.15, y1 + 0.42, back), fpt(F, a - 0.15, y1 + 0.42, back), PIG.ROOF);
      hopBoard(G, F, a - 0.15, y1 + 0.05, b + 0.15, y1 + 0.2, 0.2, PIG.WHITE);
    };
    // the four wall frames of a box (x0..x1, z0..z1) standing at y: east (+X), west (-X), north (-Z), south (+Z)
    const frames = (x0, x1, z0, z1, y) => ({ E: hopFrame([x1, y, z1], [1, 0, 0]), W: hopFrame([x0, y, z0], [-1, 0, 0]), N: hopFrame([x1, y, z0], [0, 0, -1]), S: hopFrame([x0, y, z1], [0, 0, 1]) });

    await Y();
    // ---- Front Street, starboard: one unbroken row of 26 fronts, shop below, two rows of sashes, a bracketed cornice ---
    const FW = 190 / 26, brick = greenRow ? PIG.GREEN : PIG.RED, perch = [], keepOut = [], fencePerch = [];
    const barber = 5 + Math.floor(rng() * 4); let pole = null;
    const front = async (i) => {
      const z0 = i * FW, z1 = z0 + FW, hgt = 12.4 + Math.round(rng() * 4) * 0.65, F = hopFrame([ROWX, 0, z1], [1, 0, 0]);
      const r = rng(), wall = i === 1 || i === 2 || r < 0.13 ? PIG.WHITE : r < 0.24 ? (greenRow ? PIG.RED : PIG.GREEN) : brick, trim = wall === PIG.WHITE ? PIG.GREEN : rng() < 0.6 ? PIG.WHITE : PIG.GREEN;
      const nb = rng() < 0.3 ? 2 : 3, sb = rng() < 0.5;
      // the shop: a plate window and a recessed door as dark holes, a sill, a blank sign band, a striped awning
      const du = sb ? FW - 1.0 : 1.0, pu = sb ? (FW - 1.9) * 0.5 : (FW + 1.9) * 0.5, phw = (FW - 3.1) * 0.5;
      const holes = [{ u: pu, hw: phw, y0: 0.75, y1: 3.45 }, { u: du, hw: 0.55, y0: 0.12, y1: 2.9 }]; holes.sort((a, b) => a.u - b.u);
      hopWall(G, F, 0, FW, 0, 4.4, holes, wall); hopRect(G, F, 0.1, 0, FW - 0.1, 4.3, 0.55, PIG.DARK);
      hopBoard(G, F, pu - phw - 0.12, 0.6, pu + phw + 0.12, 0.75, 0.14, trim); hopBoard(G, F, pu - phw - 0.14, 0.75, pu - phw, 3.45, 0.06, trim); hopBoard(G, F, pu + phw, 0.75, pu + phw + 0.14, 3.45, 0.06, trim);
      hopBoard(G, F, 0.25, 4.5, FW - 0.25, 5.05, 0.08, trim === PIG.WHITE ? PIG.WHITE : PIG.STRAW);
      if (rng() < (i >= 0 && i < 10 ? 0.95 : 0.72)) {             // awning: stripes are slabs; the valance flaps
        const n = 7, a0 = pu - phw - 0.3, aw = (2 * phw + 0.6) / n, c2 = rng() < 0.5 ? PIG.RED : PIG.GREEN, ph = rng();
        for (let k = 0; k < n; k++) {
          const ua = a0 + k * aw, ub = ua + aw, pg = k % 2 ? c2 : PIG.WHITE, lf = [0, 0.7, 0, ph], w = [0.42, 0.85, 0, ph], z4 = [0, 0, 0, 0];
          hopQuad(G, fpt(F, ua, 3.05, -1.7), fpt(F, ub, 3.05, -1.7), fpt(F, ub, 3.95, 0), fpt(F, ua, 3.95, 0), pg, 0, [lf, lf, z4, z4]);
          hopQuad(G, fpt(F, ua, 2.6, -1.7), fpt(F, ub, 2.6, -1.7), fpt(F, ub, 3.05, -1.7), fpt(F, ua, 3.05, -1.7), pg, 0, [w, w, lf, lf]);
        }
      }
      storey(F, 0, FW, 4.4, 8.5, nb, 5.4, 7.9, 0.62, wall, 0, i < 0 ? 0 : 4.6, { curtain: i >= 0 && i < 7 ? (october ? 0.6 : 0.72) : (october ? 0.22 : 0.4), thin: 0.2 });
      storey(F, 0, FW, 8.5, hgt, nb, 9.0, 11.4, 0.62, wall, 0, i < 0 ? 0 : 4.6, { curtain: i >= 0 && i < 7 ? (october ? 0.6 : 0.72) : (october ? 0.22 : 0.4), thin: 0.2 });
      cornice(F, 0, FW, hgt, 0.55, 0.6, trim);
      hopBox(G, ROWX - 11, 0, z0, ROWX, hgt, z1, wall, 0, 'Xy', PIG.ROOF);
      if (i >= 0) perch.push([ROWX + 0.3, hgt, z0 + FW * (0.2 + 0.6 * rng())]);
      if (i === barber) {                                         // the barber pole: one slab of each colour to a turn (it turns as its own small mesh)
        const B = hopGeo(), n = 8, r0 = 0.11;
        for (let s = 0; s < 6; s++) for (let k = 0; k < n; k++) {
          const a0 = k / n * 6.283, a1 = (k + 1) / n * 6.283, y0 = s * 0.2, pg = (k + s) % 4 < 2 ? PIG.RED : PIG.WHITE;
          hopQuad(B, [Math.sin(a0) * r0, y0, Math.cos(a0) * r0], [Math.sin(a1) * r0, y0, Math.cos(a1) * r0], [Math.sin(a1) * r0, y0 + 0.2, Math.cos(a1) * r0], [Math.sin(a0) * r0, y0 + 0.2, Math.cos(a0) * r0], pg);
        }
        hopBox(B, -0.15, -0.14, -0.15, 0.15, 0, 0.15, PIG.WHITE); hopBox(B, -0.15, 1.2, -0.15, 0.15, 1.36, 0.15, PIG.WHITE);
        pole = addMesh(hopFinish(B), mat, 'barber-pole'); pole.position.set(ROWX + 0.45, 1.5, sb ? z0 + 0.25 : z1 - 0.25);
      }
      await Y();
      if (i === 7 || i === 16) await flushG('row-' + i);          // three short uploads instead of one long one
    };
    for (let i = -3; i < 26; i++) await front(i);
    await flushG('row');

    // ---- port side of the street: four detached brick blocks and low sheds, with gaps for the sun -----------------------
    const block = (x0, x1, z0, z1, hgt, wall, trim, floors, o = {}) => {
      const f = frames(x0, x1, z0, z1, o.y ?? 0), w = x1 - x0, l = z1 - z0, line = o.line ?? 0, fh = hgt / floors;
      for (let s = 0; s < floors; s++) {
        const fl = s * fh, top = fl + fh, wy0 = fl + 0.95, wy1 = Math.min(top - 0.55, wy0 + 2.5);
        storey(f.W, 0, l, fl, top, Math.max(1, Math.round(l / 3.4)), wy0, wy1, 0.6, wall, line, Math.min(4.6, w * 0.45), o.room);
        storey(f.E, 0, l, fl, top, Math.max(1, Math.round(l / 3.4)), wy0, wy1, 0.6, wall, line, o.east ? Math.min(4.6, w * 0.45) : 0, o.room);
        storey(f.N, 0, w, fl, top, Math.max(1, Math.round(w / 4.2)), wy0, wy1, 0.6, wall, line, 0);
        storey(f.S, 0, w, fl, top, Math.max(1, Math.round(w / 4.2)), wy0, wy1, 0.6, wall, line, 0);
      }
      if (line) for (const k of ['W', 'E', 'N', 'S']) { const ww = k === 'W' || k === 'E' ? l : w; hopBoard(G, f[k], 0, 0, 0.28, hgt, 0.06, PIG.WHITE); hopBoard(G, f[k], ww - 0.28, 0, ww, hgt, 0.06, PIG.WHITE); }
      return f;
    };
    {
      let z = -34, nb = 0, seq = 0;                             // one block behind the start, three in mid street; sheds beside the first fronts (so the sun's edge is alone on them) and at the street's end (so the hill shows)
      for (let k = 0; z < 186 && k < 16; k++) {
        const kind = k === 0 ? 'b' : (z >= 112 && z < 162 && nb < 3 && (seq++ % 3 !== 2)) ? 'b' : 's', x0 = PORTX + (kind === 's' ? rng() * 2.5 : 0);
        if (kind === 'b' && nb < 4) {
          const l = 15 + rng() * 5, hgt = 10.5 + rng() * 3, d = 11 + rng() * 3, wall = rng() < 0.75 ? PIG.RED : PIG.WHITE, trim = wall === PIG.WHITE ? PIG.GREEN : PIG.WHITE;
          const f = block(x0, x0 + d, z, z + l, hgt, wall, trim, 3, { room: { curtain: october ? 0.12 : 0.25 } });
          cornice(f.W, 0, l, hgt + 0.5, 0.5, 0.5, trim); cornice(f.N, 0, d, hgt + 0.5, 0.5, 0.5, trim); cornice(f.E, 0, l, hgt + 0.5, 0.5, 0.5, trim, false); cornice(f.S, 0, d, hgt + 0.5, 0.5, 0.5, trim, false);
          hopQuad(G, [x0, hgt + 0.3, z + l], [x0 + d, hgt + 0.3, z + l], [x0 + d, hgt + 0.3, z], [x0, hgt + 0.3, z], PIG.ROOF);
          hopBox(G, x0 + d * 0.6, hgt + 0.3, z + 2, x0 + d * 0.6 + 1.1, hgt + 2.4, z + 3.4, PIG.RED, 0, 'y');
          caster(x0 + 0.3, -1, z + 0.3, x0 + d - 0.3, hgt + 0.3, z + l - 0.3); perch.push([x0 + 0.2, hgt + 0.5, z + l * rng()]);
          z += l + 5 + rng() * 6; nb++;
        } else {
          const l = 8 + rng() * 7, d = 7 + rng() * 3, hgt = 3.6 + rng() * 1.6, r = rng(), wall = r < 0.45 ? PIG.WHITE : r < 0.75 ? PIG.GREEN : PIG.RED, x1 = x0 + d;
          const f = frames(x0, x1, z, z + l, 0), ln = wall === PIG.WHITE ? 0.5 : 0, du = l * (0.3 + 0.4 * rng());
          hopWall(G, f.W, 0, l, 0, hgt, [{ u: du, hw: 1.5, y0: 0.1, y1: 2.9 }], wall, ln); hopRect(G, f.W, du - 1.5, 0, du + 1.5, 2.9, 0.4, PIG.DARK);
          hopBoard(G, f.W, du - 1.65, 2.9, du + 1.65, 3.08, 0.08, PIG.WHITE);
          hopRect(G, f.E, 0, 0, l, hgt + 1.4, 0, wall, ln);
          for (const [F, n] of [[f.N, [0, 0, -1]], [f.S, [0, 0, 1]]]) {             // gable ends under a shed roof rising to the east
            const a = fpt(F, 0, 0, 0), b = fpt(F, d, 0, 0), east = n[2] < 0 ? a : b, west = n[2] < 0 ? b : a;
            hopQuad(G, a, b, [b[0], n[2] < 0 ? hgt : hgt + 1.4, b[2]], [a[0], n[2] < 0 ? hgt + 1.4 : hgt, a[2]], wall, ln);
          }
          hopQuad(G, [x0 - 0.3, hgt, z + l + 0.3], [x1 + 0.3, hgt + 1.4, z + l + 0.3], [x1 + 0.3, hgt + 1.4, z - 0.3], [x0 - 0.3, hgt, z - 0.3], PIG.ROOF);
          if (nBox < 10) caster(x0 + 0.2, -1, z + 0.2, x1 - 0.2, hgt + 0.6, z + l - 0.2);
          perch.push([x0, hgt, z + l * rng()]);
          z += l + 3.5 + rng() * 5.5;
        }
        await Y();
      }
    }
    await Y();

    // ---- the elevated and the trestle: deck with ruled ties, girders, columns every 12 m, buffers at z 300 --------------
    const deckY = (z) => (z < 190 ? DECK : atZ(z).y - (EYE - DECK)), trackX = (z) => (z <= 190 ? SX : atZ(z).x);
    for (let z = -48; z < 190; z += 6) {
      const z1 = z + 6, y0 = deckY(z), y1 = deckY(z1), c0 = trackX(z), c1 = trackX(z1);
      hopQuad(G, [c1 - 1.7, y1, z1], [c1 + 1.7, y1, z1], [c0 + 1.7, y0, z], [c0 - 1.7, y0, z], PIG.TIE, 0.62);
      for (const sx of [-1, 1]) {                                 // plate girders, dark green, their tops the near horizontal
        const xa = sx * 1.7, xb = sx * 1.95, lo = 1.0, q = (x, a, b) => (sx * (x === xb ? 1 : -1) < 0
          ? [[c0 + x, y0 - lo, z], [c1 + x, y1 - lo, z1], [c1 + x, y1 + 0.18, z1], [c0 + x, y0 + 0.18, z]] : [[c1 + x, y1 - lo, z1], [c0 + x, y0 - lo, z], [c0 + x, y0 + 0.18, z], [c1 + x, y1 + 0.18, z1]]);
        hopQuad(G, ...q(xb), PIG.GREEN); hopQuad(G, ...q(xa), PIG.GREEN);
        const m0 = Math.min(xa, xb), m1 = Math.max(xa, xb);
        hopQuad(G, [c0 + m0, y0 + 0.18, z], [c1 + m0, y1 + 0.18, z1], [c1 + m1, y1 + 0.18, z1], [c0 + m1, y0 + 0.18, z], PIG.GREEN);
      }
      hopQuad(G, [c0 - 1.95, y0 - 1.0, z], [c0 + 1.95, y0 - 1.0, z], [c1 + 1.95, y1 - 1.0, z1], [c1 - 1.95, y1 - 1.0, z1], PIG.DARK);
      if (Math.round(z / 6) % 2 === 0) {                           // a bent: two columns and a cross girder
        const gy = Math.min(H(c0 - 1.6, z), H(c0 + 1.6, z)) - 0.5, timber = z >= 190;
        for (const sx of [-1, 1]) hopBox(G, c0 + sx * 1.62 - 0.19, gy, z - 0.19, c0 + sx * 1.62 + 0.19, y0 - 1.0, z + 0.19, PIG.GREEN, 0, 'yY');
        hopBox(G, c0 - 1.95, y0 - 1.5, z - 0.2, c0 + 1.95, y0 - 1.0, z + 0.2, PIG.GREEN, 0, 'Y');
        if (timber && y0 - gy > 5) hopBox(G, c0 - 1.62, (gy + y0) * 0.5 - 0.15, z - 0.1, c0 + 1.62, (gy + y0) * 0.5 + 0.15, z + 0.1, PIG.GREEN);
      }
    }
    caster(SX - 1.9, 5.9, -60, SX + 1.9, 7.05, 190);
    // signal posts (the gull's is the second) and telegraph poles to port
    const sigTop = new THREE.Vector3(trackX(219) + 4.4, 0, 219);
    for (const [x, z] of [[SX - 3.1, 96], [sigTop.x, sigTop.z]]) {
      const gy = H(x, z) - 0.3, top = deckY(z) + 3.7; hopBox(G, x - 0.14, gy, z - 0.14, x + 0.14, top, z + 0.14, PIG.GREEN, 0, 'y');   // a dark-green post from the ground up, so it reads as a post against the sky
      hopBox(G, Math.min(x, x - 1.3 * Math.sign(x - trackX(z))), top - 0.8, z - 0.05, Math.max(x, x - 1.3 * Math.sign(x - trackX(z))), top - 0.42, z + 0.05, PIG.RED); if (z > 200) sigTop.y = top;
    }
    const wires = [], poles = [];   // poles: down the street, up the hill to port of the track, then north of the swing, so the line frames the hotel's cream end and never crosses its flank
    for (const [px, pz] of [...Array.from({ length: 8 }, (_, k) => [SX + 6.5, -40 + 30 * k]), [-45.3, 200], [trackX(228) + 8.3, 228], [trackX(252) + 9.8, 252], [trackX(270) + 11.5, 270], [trackX(283) + 16, 283]]) { const x = px, z = pz, gy = H(x, z); poles.push([x, gy + 9.2, z]); hopBox(G, x - 0.13, gy - 0.4, z - 0.13, x + 0.13, gy + 9.4, z + 0.13, PIG.GREEN, 0, 'y'); hopBox(G, x - 1.1, gy + 8.6, z - 0.07, x + 1.1, gy + 8.78, z + 0.07, PIG.GREEN); }
    poles.push([HOX - 5.7, HOY + 9.9, 299.7]);                    // the line ends on the hotel's north-west corner
    // the trestle, laid along the course (it runs up the hill on a diagonal): real ties square to the rails, girders, timber bents
    {
      const u0 = zToU(190), L = (zToU(300) - u0) * path.length, P = new THREE.Vector3(), Q = new THREE.Vector3();
      const st = (s) => { const u = u0 + s / path.length; path.pointAt(u, P); path.pointAt(u + 0.0006, Q); const tx = Q.x - P.x, tz = Q.z - P.z, l = Math.hypot(tx, tz) || 1; return { x: P.x, y: P.y - (EYE - DECK), z: P.z, nx: tz / l, nz: -tx / l, tx: tx / l, tz: tz / l }; };
      const at = (a, o, dy = 0, f = 0) => [a.x + a.nx * o + a.tx * f, a.y + dy, a.z + a.nz * o + a.tz * f];
      const face = (p0, p1, p2, p3, want, pig) => {               // a quad whose flat normal is turned toward want
        const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
        if ((uy * vz - uz * vy) * want[0] + (uz * vx - ux * vz) * want[1] + (ux * vy - uy * vx) * want[2] < 0) hopQuad(G, p3, p2, p1, p0, pig); else hopQuad(G, p0, p1, p2, p3, pig);
      };
      const nSeg = Math.ceil(L / 3);
      for (let i = 0; i < nSeg; i++) {
        if (i % 8 === 7) await Y();
        const a = st(i * L / nSeg), b = st((i + 1) * L / nSeg);
        face(at(a, -1.7, -0.05), at(a, 1.7, -0.05), at(b, 1.7, -0.05), at(b, -1.7, -0.05), [0, 1, 0], PIG.DARK);          // the gaps between the ties
        face(at(a, -1.95, -1), at(a, 1.95, -1), at(b, 1.95, -1), at(b, -1.95, -1), [0, -1, 0], PIG.DARK);
        for (const sx of [-1, 1]) {
          const out = [a.nx * sx, 0, a.nz * sx], inn = [-out[0], 0, -out[2]];
          face(at(a, sx * 1.95, -1), at(b, sx * 1.95, -1), at(b, sx * 1.95, 0.18), at(a, sx * 1.95, 0.18), out, PIG.GREEN);
          face(at(a, sx * 1.7, -1), at(b, sx * 1.7, -1), at(b, sx * 1.7, 0.18), at(a, sx * 1.7, 0.18), inn, PIG.GREEN);
          face(at(a, sx * 1.7, 0.18), at(b, sx * 1.7, 0.18), at(b, sx * 1.95, 0.18), at(a, sx * 1.95, 0.18), [0, 1, 0], PIG.GREEN);
          wires.push([...at(a, sx * 0.75, 0.1), ...at(b, sx * 0.75, 0.1), 0.04, PIG.WHITE]);
        }
        if (i % 4 === 0) {                                          // a bent every 12 m: two posts, a cap, a brace where it stands tall
          const pl = at(a, -1.62), pr = at(a, 1.62), gy = Math.min(H(pl[0], pl[2]), H(pr[0], pr[2])) - 0.5, tn = [a.tx, 0, a.tz], tb = [-a.tx, 0, -a.tz];
          for (const p of [pl, pr]) hopBox(G, p[0] - 0.19, gy, p[2] - 0.19, p[0] + 0.19, a.y - 1.0, p[2] + 0.19, PIG.GREEN, 0, 'yY');
          const bar = (y0, y1, hw) => {
            face(at(a, -1.95, y0, hw), at(a, 1.95, y0, hw), at(a, 1.95, y1, hw), at(a, -1.95, y1, hw), tn, PIG.GREEN);
            face(at(a, -1.95, y0, -hw), at(a, 1.95, y0, -hw), at(a, 1.95, y1, -hw), at(a, -1.95, y1, -hw), tb, PIG.GREEN);
            face(at(a, -1.95, y0, -hw), at(a, 1.95, y0, -hw), at(a, 1.95, y0, hw), at(a, -1.95, y0, hw), [0, -1, 0], PIG.GREEN);
          };
          bar(-1.5, -1.0, 0.2); if (a.y - gy > 5) bar((gy - a.y) * 0.5 - 0.15, (gy - a.y) * 0.5 + 0.15, 0.1);
        }
      }
      { const e = st(L), bar = (o0, o1, y0, y1, f0, f1, pig) => { face(at(e, o0, y0, f1), at(e, o1, y0, f1), at(e, o1, y1, f1), at(e, o0, y1, f1), [e.tx, 0, e.tz], pig); face(at(e, o0, y0, f0), at(e, o1, y0, f0), at(e, o1, y1, f0), at(e, o0, y1, f0), [-e.tx, 0, -e.tz], pig); face(at(e, o0, y1, f0), at(e, o1, y1, f0), at(e, o1, y1, f1), at(e, o0, y1, f1), [0, 1, 0], pig); };
        bar(-1.5, 1.5, 0.35, 0.8, 0.2, 0.6, PIG.RED); for (const sx of [-1, 1]) bar(sx * 1.1 - 0.14, sx * 1.1 + 0.14, -3.1, 0.35, 0.25, 0.55, PIG.WHITE); }   // the buffers
      await Y();
      for (let s = 0.25; s < L; s += 0.62) { const a = st(s); face(at(a, -1.7, 0, -0.22), at(a, 1.7, 0, -0.22), at(a, 1.7, 0, 0.22), at(a, -1.7, 0, 0.22), [0, 1, 0], PIG.TIE); }
      await Y();
    }
    await flushG('port-and-elevated');
    for (let i = 0; i + 1 < poles.length; i++) for (const ox of [-0.95, 0, 0.95]) for (let k = 0; k < 4; k++) {
      const a = poles[i], b = poles[i + 1], sag = (t) => -1.1 * 4 * t * (1 - t), t0 = k / 4, t1 = (k + 1) / 4;
      wires.push([mix(a[0], b[0], t0) + ox, mix(a[1], b[1], t0) - 0.5 + sag(t0), mix(a[2], b[2], t0), mix(a[0], b[0], t1) + ox, mix(a[1], b[1], t1) - 0.5 + sag(t1), mix(a[2], b[2], t1), 0.012, PIG.DARK, -sag(t0), -sag(t1), i + ox]);
    }
    for (let z = -48; z < 190; z += 6) for (const sx of [-0.75, 0.75]) wires.push([trackX(z) + sx, deckY(z) + 0.1, z, trackX(z + 6) + sx, deckY(z + 6) + 0.1, z + 6, 0.04, PIG.WHITE]);
    await Y();

    // ---- the hill: white mansard houses, each split cream and blue-green ---------------------------------------------
    const house = (cx, cz, w, l, cast) => {
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - l / 2, z1 = cz + l / 2, y = Math.min(H(x0, z0), H(x1, z0), H(x0, z1), H(x1, z1)) + 0.5, hgt = 6.6;
      hopBox(G, x0 - 0.1, y - 4, z0 - 0.1, x1 + 0.1, y, z1 + 0.1, PIG.RED, 0, 'yY');
      const f = block(x0, x1, z0, z1, hgt, PIG.WHITE, PIG.WHITE, 2, { y, line: 0.5, east: true });
      hopBox(G, x0 - 0.55, y + hgt, z0 - 0.55, x1 + 0.55, y + hgt + 0.35, z1 + 0.55, PIG.WHITE, 0, '', PIG.ROOF);
      const my0 = y + hgt + 0.35, my1 = my0 + 3.1;
      frustum(x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, my0, my1, 1.2, 1.2, PIG.ROOF, 0.5);
      const fr = frames(x0 - 0.25, x1 + 0.25, z0 - 0.25, z1 + 0.25, 0);
      for (const k of ['W', 'E', 'N', 'S']) { const ww = k === 'W' || k === 'E' ? l : w, n = ww > 9 ? 2 : 1; for (let i = 0; i < n; i++) dormer(fr[k], (ww + 0.5) * (i + 0.5) / n, my0 + 0.55, 0.5, 1.7, blindOf()); }
      hopBox(G, cx - 0.5 + w * 0.2, my1, cz - 0.6, cx + 0.5 + w * 0.2, my1 + 2.3, cz + 0.6, PIG.RED, 0, 'y'); hopBox(G, cx - 0.62 + w * 0.2, my1 + 2.3, cz - 0.72, cx + 0.62 + w * 0.2, my1 + 2.5, cz + 0.72, PIG.RED, 0, '', PIG.DARK);
      const px = cx < trackX(cz) ? x1 : x0 - 2.4;                          // a porch on the side that looks at the track
      hopBox(G, px, y + 2.9, z0 + 0.5, px + 2.4, y + 3.1, z1 - 0.5, PIG.WHITE, 0, '', PIG.ROOF); hopBox(G, px, y - 3, z0 + 0.5, px + 2.4, y + 0.25, z1 - 0.5, PIG.WHITE, 0, 'y', PIG.STREET);
      for (let k = 0; k <= 3; k++) { const z = z0 + 0.6 + k * (l - 1.4) / 3, xx = cx < trackX(cz) ? px + 2.15 : px + 0.07; hopBox(G, xx, y + 0.25, z, xx + 0.18, y + 2.9, z + 0.18, PIG.WHITE, 0, 'yY'); }
      if (cast) caster(x0 + 0.3, y - 4, z0 + 0.3, x1 - 0.3, y + hgt + 0.3, z1 - 0.3);
      perch.push([x0 + 1.3, my1, cz]);
    };
    const lots = [[-74, 224, 9, 11], [-22, 226, 10, 9], [-52, 258, 11, 13], [-50, 292, 9, 12], [4, 240, 9, 10], [-82, 298, 12, 10], [-94, 238, 10, 10]];
    const nHouse = Math.max(4, Math.min(7, Math.round(5.5 * density)));
    for (let i = 0; i < nHouse; i++) { house(...lots[i], i < 3); await Y(); }
    await Y();
    await flushG('hill-houses');

    // ---- the boathouse: a cream gable raked from the left, one dark doorway with its two leaves open -------------------
    {
      // It is drawn at its old size about its door sill and then set down a third larger, 12 m nearer, with its sill at YB: the door
      // stands a third of the frame high from 40 m, and the portal hangs at the far end of a dark room whose floor ramps up to it.
      const y = 12, z0 = END_Z + 0.15, z1 = z0 + 18, x0 = -8.5, x1 = 8.5, ev = 10.7, pk = 16, f = frames(x0, x1, z0, z1, y);
      const K = 1.3, ZD = END_Z - 12, YB = 10, TB = (x, yy, z) => [x * K, YB + (yy - y) * K, ZD + (z - z0) * K];
      hopBox(G, x0 - 0.1, y - 6, z0 - 0.1, x1 + 0.1, y, z1 + 0.1, PIG.STREET, 0, 'yY');
      hopWall(G, f.N, 0, 17, 0, ev, [{ u: 8.5, hw: 4.5, y0: 0, y1: 9.5 }], PIG.WHITE, 0.5);
      hopQuad(G, [x1, y + ev, z0], [x0, y + ev, z0], [0, y + pk, z0], [0, y + pk, z0], PIG.WHITE, 0.5);
      hopQuad(G, [x0, y + ev, z1], [x1, y + ev, z1], [0, y + pk, z1], [0, y + pk, z1], PIG.WHITE, 0.5);
      hopRect(G, f.S, 0, 0, 17, ev, 0, PIG.WHITE, 0.5); storey(f.E, 0, 18, 0, ev, 3, 4.2, 6.9, 0.7, PIG.WHITE, 0.5, 0); storey(f.W, 0, 18, 0, ev, 3, 4.2, 6.9, 0.7, PIG.WHITE, 0.5, 0);
      hopQuad(G, [x1 + 0.5, y + ev - 0.3, z1 + 0.6], [x1 + 0.5, y + ev - 0.3, z0 - 0.9], [0, y + pk + 0.02, z0 - 0.9], [0, y + pk + 0.02, z1 + 0.6], PIG.ROOF, 0.52);
      hopQuad(G, [x0 - 0.5, y + ev - 0.3, z0 - 0.9], [x0 - 0.5, y + ev - 0.3, z1 + 0.6], [0, y + pk + 0.02, z1 + 0.6], [0, y + pk + 0.02, z0 - 0.9], PIG.ROOF, 0.52);
      for (const sx of [-1, 1]) {                                 // rake boards, corner boards, the casing, a leaf swung out
        hopQuad(G, ...(sx > 0 ? [[x1 + 0.5, y + ev - 0.3, z0 - 0.9], [0, y + pk + 0.02, z0 - 0.9], [0, y + pk - 0.4, z0 - 0.9], [x1 + 0.5, y + ev - 0.72, z0 - 0.9]] : [[0, y + pk + 0.02, z0 - 0.9], [x0 - 0.5, y + ev - 0.3, z0 - 0.9], [x0 - 0.5, y + ev - 0.72, z0 - 0.9], [0, y + pk - 0.4, z0 - 0.9]]).reverse(), PIG.WHITE);
        hopBox(G, sx * 8.5 - 0.16, y, z0 - 0.07, sx * 8.5 + 0.16, y + ev, z0, PIG.WHITE, 0, 'yZ'); hopBox(G, sx * 4.66 - 0.16, y, z0 - 0.08, sx * 4.66 + 0.16, y + 9.5, z0, PIG.WHITE, 0, 'yZ');
        const hx = sx * 4.8, ex = sx * 6.1, ez = z0 - 4.3, a = [hx, y + 0.1, z0 - 0.1], b = [ex, y + 0.1, ez], c = [ex, y + 9.4, ez], d = [hx, y + 9.4, z0 - 0.1];
        hopQuad(G, ...(sx > 0 ? [a, b, c, d] : [b, a, d, c]), PIG.GREEN); hopQuad(G, ...(sx > 0 ? [b, a, d, c] : [a, b, c, d]).map((p) => [p[0] + sx * 0.08, p[1], p[2]]), PIG.GREEN);
      }
      for (const sx of [-1, 1]) { const a = [sx * 9, y + ev - 0.32, z0], b = [0, y + pk, z0], c = [0, y + pk, z0 - 0.9], d = [sx * 9, y + ev - 0.32, z0 - 0.9]; hopQuad(G, a, b, c, d, PIG.WHITE); hopQuad(G, b, a, d, c, PIG.WHITE); }   // the soffits
      hopBox(G, -4.5, y + 9.5, z0 - 0.09, 4.5, y + 9.82, z0, PIG.WHITE, 0, 'Z'); hopBox(G, -5.4, y - 0.35, z0 - 3.2, 5.4, y, z0, PIG.WHITE, 0, 'y');
      caster(...TB(x0 + 0.3, y - 6, z0 + 0.3), ...TB(x1 - 0.3, y + ev, z1 - 0.3)); perch.push(TB(3.2, y + pk - 3.6, z0 + 5), TB(-2, y + pk - 2.2, z0 + 9));
      {                                                           // a lean-to on the shade flank, set back from the gable: its end in sun, its side blue-green
        const lx0 = -14.6, lx1 = -8.5, lz0 = z0 + 4.5, lz1 = z1, hi = 7.4, lo = 4.7, lf = frames(lx0, lx1, lz0, lz1, y);
        hopBox(G, lx0 - 0.1, y - 6, lz0 - 0.1, lx1, y, lz1 + 0.1, PIG.STREET, 0, 'yYX');
        storey(lf.W, 0, lz1 - lz0, 0, lo, 2, 1.5, 3.5, 0.7, PIG.WHITE, 0.5, 0);
        hopQuad(G, [lx1, y, lz0], [lx0, y, lz0], [lx0, y + lo, lz0], [lx1, y + hi, lz0], PIG.WHITE, 0.5); hopQuad(G, [lx0, y, lz1], [lx1, y, lz1], [lx1, y + hi, lz1], [lx0, y + lo, lz1], PIG.WHITE, 0.5);
        hopRect(G, lf.N, 2.0, 0.1, 4.3, 3.9, -0.012, PIG.GREEN); hopBoard(G, lf.N, 1.85, 3.9, 4.45, 4.05, 0.07, PIG.WHITE);                        // a dark-green door in its end
        hopQuad(G, [lx0 - 0.4, y + lo - 0.18, lz0 - 0.4], [lx0 - 0.4, y + lo - 0.18, lz1 + 0.4], [lx1, y + hi + 0.02, lz1 + 0.4], [lx1, y + hi + 0.02, lz0 - 0.4], PIG.ROOF, 0.52);
        hopBox(G, lx0, y, lz0 - 0.06, lx0 + 0.3, y + lo, lz0, PIG.WHITE, 0, 'yZ');
        caster(...TB(lx0 + 0.2, y - 6, lz0 + 0.2), ...TB(lx1, y + lo + 1.2, lz1 - 0.2));
      }
      // thrown shadows on the gable, ruled and sheared: the east rake's soffit and the two open leaves (the sun stands still by now, at 20 degrees)
      {
        const sg = evening ? -1 : 1, S = [sg * 0.883, 0.342, -0.321], OVR = 0.9;
        const proj = (p) => { const t = (z0 - p[2]) / 0.321; return [p[0] - S[0] * t, p[1] - y - S[1] * t]; };
        const clipTo = (poly, reg) => {                             // Sutherland-Hodgman, convex region given counter-clockwise
          let out = poly;
          for (let i = 0; i < reg.length && out.length; i++) {
            const a = reg[i], b = reg[(i + 1) % reg.length], inp = out, sd = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); out = [];
            for (let k = 0; k < inp.length; k++) {
              const P = inp[k], Q = inp[(k + 1) % inp.length], dp = sd(P), dq = sd(Q);
              if (dp >= 0) out.push(P);
              if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
            }
          }
          return out;
        };
        const regs = [[[-8.5, 0], [-4.5, 0], [-4.5, 9.5], [-8.5, 9.5]], [[4.5, 0], [8.5, 0], [8.5, 9.5], [4.5, 9.5]], [[-8.5, 9.5], [8.5, 9.5], [8.5, ev], [0, pk], [-8.5, ev]]];
        const casters = [
          [[sg * 9, y + ev - 0.3, z0], [0, y + pk, z0], [0, y + pk, z0 - OVR], [sg * 9, y + ev - 0.3, z0 - OVR]],
          [[4.8, y + 0.1, z0 - 0.1], [6.1, y + 0.1, z0 - 4.3], [6.1, y + 9.4, z0 - 4.3], [4.8, y + 9.4, z0 - 0.1]],
          [[-4.8, y + 0.1, z0 - 0.1], [-6.1, y + 0.1, z0 - 4.3], [-6.1, y + 9.4, z0 - 4.3], [-4.8, y + 9.4, z0 - 0.1]],
        ];
        const SHB = [], pl = [0, 0, -1, z0], at = (q) => [q[0], q[1] + y, z0];
        for (const c of casters) {
          let poly = c.map(proj);
          let ar = 0; for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length]; ar += P[0] * Q[1] - Q[0] * P[1]; }
          if (ar < 0) poly = poly.reverse();
          for (const reg of regs) { const q = clipTo(poly, reg); for (let k = 1; k + 1 < q.length; k++) SHB.push({ p: [at(q[0]), at(q[k]), at(q[k + 1]), at(q[k + 1])], pl, pig: PIG.WHITE, line: 0.5 }); }
        }
        for (const c of SHB) { c.p = c.p.map((q) => TB(q[0], q[1], q[2])); c.pl = [0, 0, -1, ZD]; }
        const sm = hopShadowMesh(U, SHB); sm.name = 'boathouse-shadows'; scene.add(sm);
      }
      for (let k = 0; k < G.pos.length; k += 3) { const q = TB(G.pos[k], G.pos[k + 1], G.pos[k + 2]); G.pos[k] = q[0]; G.pos[k + 1] = q[1]; G.pos[k + 2] = q[2]; }
      {                                                           // inside: a bare dark room, the sun's slab thrown in at the door across the ramp and up the west wall
        const F2 = hopFrame([x1 * K, YB, ZD], [0, 0, -1]), u0 = 0.5, u1 = 2 * x1 * K - 0.5, yc = ev * K - 0.4, d0 = 0.25, d1 = END_Z - ZD + 0.3, rise = 12 - YB;
        const hw = 4.5 * K, hh = 9.5 * K * 0.5, um = x1 * K;
        R.win = [-HOX, YB + hh - HOY, ZD + 0.1 - HOZ, hw, hh, 1]; R.win2 = null;
        hopQuad(R, fpt(F2, u0, 0.03, d0), fpt(F2, u1, 0.03, d0), fpt(F2, u1, rise, d1), fpt(F2, u0, rise, d1), PIG.ROOMFLOOR);
        hopQuad(R, fpt(F2, u0, yc, d1), fpt(F2, u1, yc, d1), fpt(F2, u1, yc, d0), fpt(F2, u0, yc, d0), PIG.ROOMCEIL);
        hopQuad(R, fpt(F2, u0, -0.2, d0), fpt(F2, u0, -0.2, d1), fpt(F2, u0, yc, d1), fpt(F2, u0, yc, d0), PIG.ROOMWALL);
        hopQuad(R, fpt(F2, u1, -0.2, d1), fpt(F2, u1, -0.2, d0), fpt(F2, u1, yc, d0), fpt(F2, u1, yc, d1), PIG.ROOMWALL);
        hopRect(R, F2, u0, 0, u1, yc, d1, PIG.ROOMWALL);
        for (const [xa, xb, ya, yb] of [[-5.0, -4.5, rise, 11.9], [4.5, 5.0, rise, 11.9], [-5.0, 5.0, 11.5, 11.9]]) hopRect(R, F2, um - xb, ya, um - xa, yb, d1 - 0.05, PIG.ROOMCEIL);   // the casing of the far door, where the portal hangs
        R.win = null;
      }
      keepOut.push([-20, 15.5, ZD - 6, END_Z + 12]);
      await flushG('boathouse');
      // the light tower (never lit) and the keeper's house, close behind the boathouse to port: split down its length cream and blue-green
      const tx = TWX, tz = TWZ, TS = 1.5, ty = H(tx, tz) - 0.4, n = 8, pt = (r, yy, k) => [tx + Math.sin((k + 0.5) / n * 6.2832) * r * 1.12, ty + yy * TS, tz + Math.cos((k + 0.5) / n * 6.2832) * r * 1.12];
      for (let k = 0; k < n; k++) {
        hopQuad(G, pt(3.5, 0, k), pt(3.5, 0, k + 1), pt(2.2, 15.5, k + 1), pt(2.2, 15.5, k), PIG.WHITE, 0.95);
        hopQuad(G, pt(3.0, 15.5, k), pt(3.0, 15.5, k + 1), pt(3.0, 15.85, k + 1), pt(3.0, 15.85, k), PIG.WHITE); hopQuad(G, pt(3.0, 15.85, k), pt(3.0, 15.85, k + 1), [tx, ty + 15.85 * TS, tz], [tx, ty + 15.85 * TS, tz], PIG.ROOF);
        hopQuad(G, pt(3.0, 15.5, k + 1), pt(3.0, 15.5, k), [tx, ty + 15.5 * TS, tz], [tx, ty + 15.5 * TS, tz], PIG.WHITE);
        hopQuad(G, pt(1.55, 15.85, k), pt(1.55, 15.85, k + 1), pt(1.55, 18.3, k + 1), pt(1.55, 18.3, k), k % 2 ? PIG.DARK : PIG.ROOF);
        hopQuad(G, pt(1.9, 18.3, k), pt(1.9, 18.3, k + 1), [tx, ty + 20 * TS, tz], [tx, ty + 20 * TS, tz], PIG.ROOF);
      }
      {
        // the shaft's own marks on the faces the course passes (north round to south-west): a door with a hood, slit windows
        // up the stair, each a blue-black hole over a pale sill, and a ruled plinth course; so the shaft is drawn all the way up
        const fq = (k, f, yy, out) => { const r = 3.5 - 1.3 * yy / 15.5 + out, A = pt(r, yy, k), B = pt(r, yy, k + 1); return [mix(A[0], B[0], f), A[1], mix(A[2], B[2], f)]; };
        const slab = (k, f0, f1, y0, y1, pig, out = 0.05) => hopQuad(G, fq(k, f0, y0, out), fq(k, f1, y0, out), fq(k, f1, y1, out), fq(k, f0, y1, out), pig);
        for (const [k, ys] of [[3, [5.2, 10.6]], [4, [3.4, 8.2, 12.6]], [5, [5.6, 10.4]], [6, [3.2, 8.0, 12.4]]]) for (const y0 of ys) {
          slab(k, 0.36, 0.64, y0, y0 + 1.25, PIG.DARK); slab(k, 0.3, 0.7, y0 - 0.16, y0, PIG.WHITE, 0.14); slab(k, 0.32, 0.68, y0 + 1.25, y0 + 1.37, PIG.WHITE, 0.1);
        }
        slab(5, 0.33, 0.67, 0.25, 1.75, PIG.GREEN, 0.06); slab(5, 0.27, 0.73, 1.75, 1.93, PIG.WHITE, 0.2); slab(5, 0.27, 0.73, 0.05, 0.25, PIG.WHITE, 0.3);
        for (let k = 0; k < n; k++) slab(k, 0, 1, 0.0, 0.42, PIG.WHITE, 0.16);
      }
      caster(tx - 2.6, ty, tz - 2.6, tx + 2.6, ty + 15.5 * TS, tz + 2.6); hopBox(G, tx - 3.2, ty - 6, tz - 3.2, tx + 3.2, ty + 0.05, tz + 3.2, PIG.STREET, 0, 'yY');
      const kx = 15, kt = 731.5, ky = H(kx, kt + 2) + 0.3, kf = block(kx - 5, kx + 5, kt - 3, kt + 6, 4.2, PIG.WHITE, PIG.WHITE, 1, { y: ky, line: 0.5 });   // the keeper's house, beyond the light and beside the course
      hopBox(G, kx - 5.1, ky - 5, kt - 3.1, kx + 5.1, ky, kt + 6.1, PIG.RED, 0, 'yY'); frustum(kx - 5.4, kx + 5.4, kt - 3.4, kt + 6.4, ky + 4.2, ky + 7.4, 5.3, 1.4, PIG.ROOF, 0.5);
      hopBox(G, kx - 0.5, ky + 6.6, kt + 1, kx + 0.5, ky + 8.6, kt + 2, PIG.RED, 0, 'y');
      keepOut.push([tx - 6, tx + 6, tz - 6, tz + 6], [kx - 6, kx + 6, kt - 4, kt + 7]); perch.push([kx, ky + 7.4, kt + 3.5], [kx, ky + 7.4, kt]);
      await Y();
      // rail fences: one beside us up the dunes, one that leaves it and crosses under us (the near horizontal)
      const fenceRun = (pts) => {
        let prev = null;
        for (const [x, z] of pts) {
          const gy = H(x, z), p = [x, gy, z];
          hopBox(G, x - 0.08, gy - 0.3, z - 0.08, x + 0.08, gy + 1.3, z + 0.08, PIG.WHITE, 0, 'y');
          if (prev) for (const hy of [0.5, 1.02]) { const a = [prev[0], prev[1] + hy, prev[2]], b = [p[0], p[1] + hy, p[2]], c = [b[0], b[1] + 0.15, b[2]], d = [a[0], a[1] + 0.15, a[2]]; hopQuad(G, a, b, c, d, PIG.WHITE); hopQuad(G, b, a, d, c, PIG.WHITE); }
          prev = p;
        }
      };
      { const a = []; for (let z = 669.2 - 8 * 2.6; z <= 779; z += 2.6) a.push([pathX(z) - 6.2, z]); fenceRun(a); }   // it begins on the upper beach, eight posts before the grass, where the eye leaves the dories
      { const a = [], x0f = pathX(716) - 6.2; for (let k = 0; k <= 13; k++) a.push([x0f + k * 2.6, 716 + k * 0.75]); fenceRun(a); }
      // the bathhouse at the head of the beach: a long white shed, north end in sun, the flank with its doors in shade, its shadow ruled across the sand
      {
        const bx0 = 13, bx1 = 16.8, bz0 = 677, bz1 = 694, yb = 2.5, bev = 2.8, bpk = 4.1, bf = frames(bx0, bx1, bz0, bz1, yb), xm = (bx0 + bx1) / 2, L = bz1 - bz0, doors = [];
        hopBox(G, bx0 + 0.15, -2, bz0 + 0.15, bx1 - 0.15, yb, bz1 - 0.15, PIG.STREET, 0, 'yY');
        for (let k = 0; k < 5; k++) doors.push({ u: 1.7 + k * (L - 3.4) / 4, hw: 0.55, y0: 0.12, y1: 2.15 });
        hopWall(G, bf.W, 0, L, 0, bev, doors, PIG.WHITE, 0.5);
        doors.forEach((d, k) => { hopRect(G, bf.W, d.u - d.hw - 0.3, 0, d.u + d.hw + 0.3, d.y1 + 0.3, 0.12, k === 3 ? PIG.DARK : PIG.GREEN); hopBoard(G, bf.W, d.u - d.hw - 0.1, d.y1, d.u + d.hw + 0.1, d.y1 + 0.12, 0.06, PIG.WHITE); });
        hopBoard(G, bf.W, 0, -0.25, L, 0.12, 1.1, PIG.WHITE);                                         // the boardwalk step along the doors
        hopRect(G, bf.E, 0, 0, L, bev, 0, PIG.WHITE, 0.5); hopRect(G, bf.N, 0, 0, bx1 - bx0, bev, 0, PIG.WHITE, 0.5); hopRect(G, bf.S, 0, 0, bx1 - bx0, bev, 0, PIG.WHITE, 0.5);
        hopQuad(G, [bx1, yb + bev, bz0], [bx0, yb + bev, bz0], [xm, yb + bpk, bz0], [xm, yb + bpk, bz0], PIG.WHITE, 0.5); hopQuad(G, [bx0, yb + bev, bz1], [bx1, yb + bev, bz1], [xm, yb + bpk, bz1], [xm, yb + bpk, bz1], PIG.WHITE, 0.5);
        hopRect(G, bf.N, 1.45, 0.9, 2.35, 2.0, -0.01, PIG.DARK);                                      // one small window in the end
        hopQuad(G, [bx1 + 0.35, yb + bev - 0.2, bz1 + 0.4], [bx1 + 0.35, yb + bev - 0.2, bz0 - 0.4], [xm, yb + bpk + 0.02, bz0 - 0.4], [xm, yb + bpk + 0.02, bz1 + 0.4], PIG.ROOF, 0.52);
        hopQuad(G, [bx0 - 0.35, yb + bev - 0.2, bz0 - 0.4], [bx0 - 0.35, yb + bev - 0.2, bz1 + 0.4], [xm, yb + bpk + 0.02, bz1 + 0.4], [xm, yb + bpk + 0.02, bz0 - 0.4], PIG.ROOF, 0.52);
        caster(bx0 + 0.2, -2, bz0 + 0.2, bx1 - 0.2, yb + bev + 0.55, bz1 - 0.2); perch.push([xm, yb + bpk, bz0 + 3], [xm, yb + bpk, bz0 + 11]);
      }
      await Y();
      // ---- more of the same hand, where the flight used to have nothing to look at ---------------------------------------
      // the lawn: a rail fence and a line of poles run down the flank to starboard of the eye, 17 to 20 m off the wall
      { const a = []; for (let z = 338; z <= 453; z += 2.6) a.push([-3, z]); fenceRun(a); }
      {
        const lp = [];
        for (let z = 352; z <= 424; z += 36) { const x = -6, gy = H(x, z); lp.push([x, gy + 9.2, z]); hopBox(G, x - 0.13, gy - 0.4, z - 0.13, x + 0.13, gy + 9.4, z + 0.13, PIG.GREEN, 0, 'y'); hopBox(G, x - 0.07, gy + 8.6, z - 1.1, x + 0.07, gy + 8.78, z + 1.1, PIG.GREEN); }
        lp.push([-6, HOY + 9.8, 469.9]);
        for (let i = 0; i + 1 < lp.length; i++) for (const oz of [-0.95, 0, 0.95]) for (let k = 0; k < 4; k++) {
          const p0 = lp[i], p1 = lp[i + 1], sag = (t) => -1.1 * 4 * t * (1 - t), t0 = k / 4, t1 = (k + 1) / 4, o1 = i + 2 === lp.length ? oz * 0.2 : oz;
          wires.push([mix(p0[0], p1[0], t0), mix(p0[1], p1[1], t0) - 0.5 + sag(t0), mix(p0[2] + oz, p1[2] + o1, t0), mix(p0[0], p1[0], t1), mix(p0[1], p1[1], t1) - 0.5 + sag(t1), mix(p0[2] + oz, p1[2] + o1, t1), 0.012, PIG.DARK, -sag(t0), -sag(t1), 40 + i + oz]);
        }
      }
      await Y();
      // gulls stand on the lawn fence where the eye crosses it; two lift as we come
      {
        for (const k of [9, 13, 4, 17, 22]) fencePerch.push([-3, H(-3, 338 + 2.6 * k) + 1.3, 338 + 2.6 * k]);
      }
      await Y();
      // the pier in the cove: a cream deck on dark piles, running in beside us to the beach under the bathhouse
      {
        const px0 = 20, px1 = 22.8, pz0 = 588, pz1 = 648, dy = 1.45;
        hopBox(G, px0, dy - 0.3, pz0, px1, dy, pz1, PIG.WHITE, 0, '', PIG.WHITE);
        for (let z = pz0 + 0.5; z < pz1 - 4; z += 5.8) {
          for (const x of [px0 + 0.3, px1 - 0.3]) hopBox(G, x - 0.17, -2.4, z - 0.17, x + 0.17, dy - 0.3, z + 0.17, PIG.ROOF, 0, 'yY');
          hopBox(G, px0 + 0.1, dy - 0.62, z - 0.11, px1 - 0.1, dy - 0.3, z + 0.11, PIG.ROOF, 0, 'Y');
        }
        for (const z of [pz0 + 0.3, pz0 + 11.9, pz0 + 23.5]) { hopBox(G, px0 - 0.16, dy, z - 0.16, px0 + 0.16, dy + 1.25, z + 0.16, PIG.ROOF, 0, 'y'); perch.push([px0, dy + 1.25, z]); }   // mooring posts, a gull to each
        hopBox(G, px0 + 0.2, dy, pz0 + 0.4, px0 + 2.2, dy + 1.7, pz0 + 3.6, PIG.WHITE, 0.5, 'y', PIG.ROOF);                                              // a locker at the pier head
        for (let k = 0; k < 6; k++) perch.push([px1 - 0.2, dy, pz0 + 6 + k * 9.5]);
      }
      await Y();
      // dories: two moored off the pier, five drawn up on the sand
      {
        const dory = (x, y, z, hd, pig, roll = 0) => {
          const c = Math.cos(hd) * 1.3, s = Math.sin(hd) * 1.3, T = (p) => { const yy = (p[1] + p[0] * roll) * 1.3; return [x + p[0] * c + p[2] * s, y + yy, z - p[0] * s + p[2] * c]; };
          const st = [-2.1, -0.9, 0.7, 2.3], wt = [0.56, 0.74, 0.66, 0.02], wb = [0.3, 0.44, 0.36, 0.02], ty = [0.56, 0.52, 0.56, 0.74];
          for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) {
            const a = [sd * wb[k], 0, st[k]], b = [sd * wb[k + 1], 0, st[k + 1]], e = [sd * wt[k + 1], ty[k + 1], st[k + 1]], d = [sd * wt[k], ty[k], st[k]];
            const q = sd > 0 ? [b, a, d, e] : [a, b, e, d];
            hopQuad(G, ...q.map(T), pig); hopQuad(G, ...[q[1], q[0], q[3], q[2]].map((p) => T([p[0] * 0.9, p[1] + 0.03, p[2]])), PIG.WHITE);
            hopQuad(G, ...(sd > 0 ? [[0, 0.04, st[k]], [0, 0.04, st[k + 1]], [b[0] * 0.9, 0.04, b[2]], [a[0] * 0.9, 0.04, a[2]]] : [[0, 0.04, st[k + 1]], [0, 0.04, st[k]], [a[0] * 0.9, 0.04, a[2]], [b[0] * 0.9, 0.04, b[2]]]).map(T), PIG.ROOF);
          }
          hopQuad(G, ...[[wb[0], 0, st[0]], [-wb[0], 0, st[0]], [-wt[0], ty[0], st[0]], [wt[0], ty[0], st[0]]].map(T), pig);
          for (const tz of [-1.0, 0.6]) hopQuad(G, ...[[-0.66, 0.4, tz - 0.13], [-0.66, 0.4, tz + 0.13], [0.66, 0.4, tz + 0.13], [0.66, 0.4, tz - 0.13]].map(T), PIG.WHITE);
          if (!roll) return;
          // drawn up on the sand it throws a ruled shadow: the gunwale's outline slid down the sun ray, in sand's own shade tone
          const sg = evening ? -1 : 1, out = [[-0.56, -2.1], [0.56, -2.1], [0.74, -0.9], [0.66, 0.7], [0, 2.3], [-0.66, 0.7], [-0.74, -0.9]];
          for (const f of [0.5, 1]) {
            let P = out.map(([a, b]) => { const q = T([a, 0, b]); return [q[0] - sg * 2.58 * 0.72 * f, y + 0.03 + 0.01 * f, q[2] + 0.94 * 0.72 * f]; });
            if ((P[1][2] - P[0][2]) * (P[2][0] - P[0][0]) - (P[1][0] - P[0][0]) * (P[2][2] - P[0][2]) < 0) P = P.reverse();
            for (let k = 1; k + 1 < P.length; k++) { hopQuad(G, P[0], P[k], P[k + 1], P[k + 1], PIG.WHITE); for (let m = G.nor.length - 18; m < G.nor.length; m += 3) { G.nor[m] = 0; G.nor[m + 1] = -1; G.nor[m + 2] = 0; } }
          }
        };
        dory(15.6, SEA_Y + 0.02, 622, 2.7, PIG.RED); dory(-2.5, SEA_Y + 0.02, 627, 3.5, PIG.WHITE);
        // the law of place at the head of this file: the green dory, first of the five, is typed clear of the way (it lay under it at x 8.2)
        for (const [x, z, hd, pig] of [[13.3, 638.2, 0.3, PIG.GREEN], [3.6, 640.5, 0.75, PIG.RED], [-4.4, 641.5, -0.35, PIG.WHITE], [-13, 647, 0.9, PIG.GREEN], [15, 646, -0.5, PIG.RED]]) dory(x, H(x, z) + 0.02, z, hd, pig, 0.16);
        for (let k = 0; k < 7; k++) perch.push([-9 + k * 2.1 + (k % 2) * 0.5, H(-9 + k * 2.1, 636.5) + 0.02, 636.5 + (k % 3) * 0.6]);   // gulls stand in a rank at the water's edge
      }
      await Y();
      // two Cape houses on the dunes, each cut cream and blue-green under a grey gable, a brick chimney to each
      {
        const cottage = (cx, cz, w, l, hgt) => {
          const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - l / 2, z1 = cz + l / 2, hs = [H(x0, z0), H(x1, z0), H(x0, z1), H(x1, z1)], y = (Math.min(...hs) + Math.max(...hs)) * 0.5 + 0.3, pk = hgt + w * 0.42;
          hopBox(G, x0 - 0.1, y - 5, z0 - 0.1, x1 + 0.1, y, z1 + 0.1, PIG.RED, 0, 'yY');
          block(x0, x1, z0, z1, hgt, PIG.WHITE, PIG.WHITE, 1, { y, line: 0.5, east: true });
          hopQuad(G, [x1, y + hgt, z0], [x0, y + hgt, z0], [cx, y + pk, z0], [cx, y + pk, z0], PIG.WHITE, 0.5);
          hopQuad(G, [x0, y + hgt, z1], [x1, y + hgt, z1], [cx, y + pk, z1], [cx, y + pk, z1], PIG.WHITE, 0.5);
          hopQuad(G, [x1 + 0.4, y + hgt - 0.25, z1 + 0.45], [x1 + 0.4, y + hgt - 0.25, z0 - 0.45], [cx, y + pk + 0.02, z0 - 0.45], [cx, y + pk + 0.02, z1 + 0.45], PIG.ROOF, 0.52);
          hopQuad(G, [x0 - 0.4, y + hgt - 0.25, z0 - 0.45], [x0 - 0.4, y + hgt - 0.25, z1 + 0.45], [cx, y + pk + 0.02, z1 + 0.45], [cx, y + pk + 0.02, z0 - 0.45], PIG.ROOF, 0.52);
          hopQuad(G, [x1 + 0.4, y + hgt - 0.25, z0 - 0.45], [x1 + 0.4, y + hgt - 0.25, z1 + 0.45], [cx, y + pk + 0.02, z1 + 0.45], [cx, y + pk + 0.02, z0 - 0.45], PIG.WHITE);   // soffits
          hopQuad(G, [x0 - 0.4, y + hgt - 0.25, z1 + 0.45], [x0 - 0.4, y + hgt - 0.25, z0 - 0.45], [cx, y + pk + 0.02, z0 - 0.45], [cx, y + pk + 0.02, z1 + 0.45], PIG.WHITE);
          hopRect(G, hopFrame([x1, y, z0], [0, 0, -1]), w / 2 - 0.5, hgt + 0.5, w / 2 + 0.5, hgt + 1.9, -0.012, PIG.DARK);                                                 // the attic window
          hopBox(G, cx - 0.45, y + pk - 1.3, cz - 0.5, cx + 0.45, y + pk + 1.3, cz + 0.5, PIG.RED, 0, 'y');
          hopBox(G, x0 + 1, y - 0.1, z0 - 1.5, x0 + 2.6, y + 0.12, z0, PIG.WHITE, 0, 'y');                                                                                 // a step at the north door
          caster(x0 + 0.3, y - 5, z0 + 0.3, x1 - 0.3, y + hgt + (pk - hgt) * 0.45, z1 - 0.3); perch.push([cx, y + pk, cz + 2.5]);
          keepOut.push([x0 - 0.6, x1 + 0.6, z0 - 1.7, z1 + 0.6]);
        };
        cottage(-36, 716, 8, 11, 3.5); await Y(); cottage(-27, 796, 8, 10, 3.4); 
      }
      await flushG('lawn-cove-dunes');
    }
    await Y();

    await flushG('boathouse-and-light');
    // ---- trees: dense dark masses, each with one lit cap, no leaf drawn; their edges shiver ----------------------------
    {
      // One mass, three flat tones cut by level-ish ruled edges: a straw cap on the sunward top, a shoulder, the dark body.
      // The sphere is fine enough that the outline is a painted curve; each triangle is clipped along the tone edges, and
      // every piece of a tone carries the same normal (up for the lit tones, down for the body) so no facet shows.
      const ico = new THREE.IcosahedronGeometry(1, 6), ip = ico.attributes.position, capDir = new THREE.Vector3(evening ? -0.5 : 0.5, 0.82, -0.14).normalize();
      const spots = [[-86, 272, 5], [-104, 262, 7], [40, 226, 5], [-80, 320, 8], [-88, 384, 9], [-72, 442, 7], [-112, 304, 10], [-50, 476, 6], [-80, 204, 6], [-52, 716, 5], [52, 764, 5], [-44, 760, 5], [-40, 800, 6], [-56, 836, 7], [58, 18, 8], [66, 62, 9], [56, 104, 8], [70, 146, 10], [52, 182, 7], [-14, 200, 7.5], [-90, 197, 6.5], [-19, 447, 9.5, 1], [-27, 384, 8.5, 1]];   // the last two stand on the hotel's lawn: their bodies in the hotel's shadow, their caps above the shadow's ruled edge
      const vs = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      const lerp = (A, B, t) => ({ p: [mix(A.p[0], B.p[0], t), mix(A.p[1], B.p[1], t), mix(A.p[2], B.p[2], t)], w: [mix(A.w[0], B.w[0], t), A.w[1], mix(A.w[2], B.w[2], t), mix(A.w[3], B.w[3], t)], f: mix(A.f, B.f, t) });
      const clip = (poly, thr, keepAbove) => {                    // the part of a convex polygon on one side of f = thr
        const out = [];
        for (let i = 0; i < poly.length; i++) {
          const A = poly[i], B = poly[(i + 1) % poly.length], ia = (A.f > thr) === keepAbove, ib = (B.f > thr) === keepAbove;
          if (ia) out.push(A);
          if (ia !== ib) out.push(lerp(A, B, (thr - A.f) / (B.f - A.f || 1e-6)));
        }
        return out;
      };
      const emit = (poly, pig, ny) => {
        for (let i = 1; i + 1 < poly.length; i++) {
          const A = poly[0], B = poly[i], C = poly[i + 1];
          hopQuad(G, A.p, B.p, C.p, C.p, pig, 0, [A.w, B.w, C.w, C.w]);
          for (let k = G.nor.length - 18; k < G.nor.length; k += 3) { G.nor[k] = 0; G.nor[k + 1] = ny; G.nor[k + 2] = 0; }
        }
      };
      let nt = 0;
      for (const [x, z, sz, own] of spots) {                  // (the lawn tree draws nothing from the seed's stream, so every later draw stays where it was)
        const gy = H(x, z), ph = own ? 0.37 : rng(), rx = sz * (own ? 0.95 : 0.85 + 0.3 * rng()), ry = sz * (own ? 0.92 : 0.75 + 0.25 * rng()), cy = gy + ry * 0.9 + 1.2;
        treeU[nt].set(x, cy, z, Math.min(rx, ry) * 0.95);
        const seen = new Map();
        const V = (v) => {
          const key = Math.round(v.x * 4096) + ',' + Math.round(v.y * 4096) + ',' + Math.round(v.z * 4096), hit = seen.get(key); if (hit) return hit;
          const o = V0(v); seen.set(key, o); return o;
        };
        const V0 = (v) => {
          const k = 1 + 0.2 * ctx.noise.n3(v.x * 1.3 + x, v.y * 1.3, v.z * 1.3 + z) + 0.035 * ctx.noise.n3(v.x * 3.1 + z, v.y * 3.1 + x, v.z * 3.1);
          return { p: [x + v.x * rx * k, cy + v.y * ry * k * (v.y < 0 ? 0.6 : 1), z + v.z * rx * k], w: [v.x * 0.45, 0.12, v.z * 0.45, ph + v.y * 0.3],
            f: v.dot(capDir) + 0.1 * ctx.noise.n3(v.x * 2.2 + x, v.y * 2.2 + z, v.z * 2.2) };
        };
        for (let i = 0; i < ip.count; i += 3) {
          if (i % 900 === 897) await Y();
          const tri = [0, 1, 2].map((k) => V(vs[k].fromBufferAttribute(ip, i + k)));
          const lo = Math.min(tri[0].f, tri[1].f, tri[2].f), hi = Math.max(tri[0].f, tri[1].f, tri[2].f);
          if (lo > 0.66) emit(tri, PIG.GRASS, 1); else if (hi < 0.36) emit(tri, PIG.LEAF, -1);
          else {
            emit(clip(tri, 0.66, true), PIG.GRASS, 1);
            const rest = clip(tri, 0.66, false); emit(clip(rest, 0.36, true), PIG.LEAF, 1); emit(clip(rest, 0.36, false), PIG.LEAF, -1);
          }
        }
        hopBox(G, x - 0.22, gy - 0.5, z - 0.22, x + 0.22, cy - ry * 0.5, z + 0.22, PIG.DARK, 0, 'yY');
        nt++; if (nt % 5 === 0) await flushG('trees-' + nt); else await Y();
      }
      ico.dispose();
    }
    await Y();
    addMesh(hopFinish(G), mat, 'town');
    await Y();
    addMesh(toHotel(hopFinish(R, true)), roomMat, 'town-rooms', hero.object);
    await Y();

    await Y();
    // ---- ribbons: rails and telegraph wires, never thinner than a pixel and a half -----------------------------------
    const ribU = { ...U, uPix: { value: 0.002 } };
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const A = new Float32Array(wires.length * 3), B = new Float32Array(wires.length * 3), W = new Float32Array(wires.length * 2), S = new Float32Array(wires.length * 3);
      wires.forEach((w, i) => { A.set([w[0], w[1], w[2]], i * 3); B.set([w[3], w[4], w[5]], i * 3); W.set([w[6], w[7]], i * 2); S.set([w[8] || 0, w[9] || 0, w[10] || 0], i * 3); });
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3)); g.setAttribute('aW', new THREE.InstancedBufferAttribute(W, 2)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 3));
      g.instanceCount = wires.length;
      addMesh(g, new THREE.ShaderMaterial({
        uniforms: ribU, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: /* glsl */`attribute vec3 aA; attribute vec3 aB; attribute vec2 aW; attribute vec3 aS; uniform float uPix; uniform float uTime; varying vec3 vW; varying float vPg;
          void main(){
            vec3 P = mix(aA, aB, position.x), dir = aB - aA;
            float sw = mix(aS.x, aS.y, position.x); P += vec3(.32, .12, 0.) * sw * sin(uTime * 1.6 + aS.z * 2.1);   // wires swing in their spans
            vec3 toC = cameraPosition - P;
            vec3 side = cross(dir, toC); side /= max(length(side), 1e-4);
            P += side * position.y * max(aW.x, .8 * uPix * length(toC));
            vW = P; vPg = aW.y; gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL} varying vec3 vW; varying float vPg; void main(){ gl_FragColor = vec4(hopTone(vPg, vec3(0., 1., 0.), vW, 0., -1.), 1.); }`,
      }), 'ribbons');
    }

    await Y();
    // ---- grass: blades in ranks 0.4 m apart, combed by the wind in travelling waves -----------------------------------
    {
      // Each mark is a comb: a card as wide as a hand-span of blades, its top cut into teeth, dark at the foot and straw at
      // the tips. Cards stand edge to edge in ranks 0.4 m apart beside the path (no ground between them) and thin out
      // further off, where the ground's own ruled ranks take over.
      const zones = [[199, 300, -8, 8, 0.55, 0.4, 0.5, 0.6, 1], [199, 300, -27, -8, 0.55, 0.8, 0.9, 1.05, 0], [199, 300, 8, 27, 0.55, 0.8, 0.9, 1.05, 0], [300, 469.6, -17, 2.4, 0.6, 0.6, 0.6, 0.72, 0],
        [668, 800, -9, 9, 0.9, 0.4, 0.5, 0.6, 1], [668, 800, -44, -9, 0.9, 0.8, 0.9, 1.05, 0], [668, 800, 9, 44, 0.9, 0.8, 0.9, 1.05, 0]];
      const pos = [], dat = []; let n = 0, rows = 0;
      for (const [za, zb, xa, xb, hgt, dz, step, wd, near] of zones) {
        for (let z = za; z < zb; z += dz, rows++) {
          const px = pathX(z), off = rng() * step;
          for (let xr = xa + off; xr < xb; xr += step) {
            const r1 = rng(), r2 = rng();
            if (!near && r2 > detail) continue;
            const x = px + xr + (r1 - 0.5) * 0.12, y = H(x, z);
            if (y < 0.8 || (za > 290 && za < 310 && x > 10.2) || (z > 796.4 && Math.abs(x) < 5.8)) continue;
            if (keepOut.some((k) => x > k[0] && x < k[1] && z > k[2] && z < k[3])) continue;
            if (za > 600) { const m = ctx.noise.fbm2(x * 0.09, z * 0.09, 2); if (y < 1.8 + 1.2 * m || m < -0.04 - 0.3 * ss(20, 44, Math.abs(xr)) || (x > 11.6 && x < 17.6 && z > 676 && z < 695)) continue; }
            pos.push(x, y - 0.04, z + (r2 - 0.5) * 0.08); dat.push(hgt * (0.75 + 0.5 * r1), wd, r2 * 6.283, r1 * 9.7); n++;
          }
          if (rows % 6 === 5) await Y();
        }
      }
      // beach grass on the upper sand, between the dories and the dunes: the same combs in the same ranks, standing in clumps
      // where the land's own noise is high, in a band beside the path as every grass zone of this world is; nothing drawn from the seed's stream
      for (let z = 646.4, row = 0; z < 668; z += 0.4, row++) {
        const px = pathX(z);
        for (let xr = -22; xr < 26; xr += 0.5) {
          const x = px + xr, y = H(x, z), hh = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453, h1 = hh - Math.floor(hh), m = ctx.noise.fbm2(x * 0.11 + 9, z * 0.11, 2);
          if (y < 0.75 || m < 0.1 || h1 > 0.85 * detail || (x > 11.6 && x < 17.6 && z > 676)) continue;
          pos.push(x + (h1 - 0.5) * 0.12, y - 0.04, z); dat.push(0.9 * (0.6 + 0.5 * h1), 0.6, h1 * 6.283, h1 * 9.7); n++;
        }
        if (row % 12 === 11) await Y();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(n ? pos : [0, -50, 0]), 3)); g.setAttribute('aDat', new THREE.InstancedBufferAttribute(new Float32Array(n ? dat : [0.1, 0.1, 0, 0]), 4));
      g.instanceCount = Math.max(1, n);
      await Y();
      // The tone is worked at the card's corners, not by its pixels. The place handed to hopTone is one value for the whole card
      // and the normal is -ns in the blade and ns at the tip, so a card has two tones and no more: the vertex stage works both
      // with the part's own routine and hands them on flat, the fragment stage keeps the comb's teeth and picks tip or blade.
      // The routine is a fragment stage's, so two defines stand before it here: every noise read at the finest level, named
      // (what the pixels read inside the blade and inside the tip, the place not changing over a card), and no filter width
      // taken (a vertex stage has none), so each max(fwidth(x), 1e-4) stands at its floor, as it did inside the blade and the tip.
      // Along the seam between tip and blade the pixels used to read the noise at its coarsest level, the normal turning over
      // there, and lost the card's own brush on a line a pixel or two wide: that line goes, the card's tone runs up to the seam.
      // The casters and the car's screen are read as ever.
      addMesh(g, new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: /* glsl */`
          #undef texture2D
          #define texture2D(s, c) textureLod(s, c, 0.)
          #define fwidth(x) 0.
          ${STYLE_GLSL} attribute vec3 aPos; attribute vec4 aDat; varying vec2 vC; varying float vS; flat varying vec3 vT0; flat varying vec3 vT1;
          void main(){
            float wave = .5 + .5 * sin(dot(aPos.xz, vec2(.19, .11)) - uTime * 2.6), fl = sin(uTime * 5. + aDat.z) * .05;
            float t = position.y, bend = t * t * aDat.x * (.1 + .75 * wave * wave + fl);
            vec3 p = aPos + vec3(position.x * aDat.y - bend, t * aDat.x * (1. - .28 * wave * t), bend * .35);
            vec3 vB = aPos + vec3(0., .25, 0.); vC = vec2((position.x * aDat.y + aPos.x) / .13, t); vS = aDat.w;
            vec3 ns = normalize(vec3(uSun.x, .3, uSun.z));
            vT0 = hopTone(13., -ns, vB, 0., -1.); vT1 = hopTone(13., ns, vB, 0., -1.);                 // the blade's tone and the tip's, the same at the card's four corners
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`uniform sampler2D uNoise; varying vec2 vC; varying float vS; flat varying vec3 vT0; flat varying vec3 vT1;
          void main(){
            float fu = fwidth(vC.x), tooth = 1. - abs(fract(vC.x) - .5) * 2.;
            float jit = texture2D(uNoise, vec2(floor(vC.x) * .137 + .31, vS * .1)).r;
            float top = mix(mix(.28, .56 + .44 * jit, tooth), .66, smoothstep(.22, .55, fu));        // finer than three pixels: the comb's flat average
            top *= 1. - smoothstep(.3, .7, fu);                                                       // further off the combs sink into the ground's own slabs and ranks: no blocks
            bool cut = vC.y > top;                                                                    // the teeth are decided here and cut below, after the tone: hopTone reads the noise and takes widths, which are not defined on a pixel whose neighbour is already cut
            float tip = step(top - .3, vC.y);
            gl_FragColor = vec4(tip > .5 ? vT1 : vT0, 1.);
            if (cut) discard;
          }`,
      }), 'grass');
    }
    await Y();

    await Y();
    // ---- gulls, the only life: cream above, blue-green beneath, blue-black wing tips ----------------------------------
    const NG = Math.max(30, Math.round(44 * Math.min(1.15, density) * (0.7 + 0.3 * detail)));
    const gI = { pos: new Float32Array(NG * 3), head: new Float32Array(NG * 2), mode: new Float32Array(NG * 4), pit: new Float32Array(NG) };
    const gulls = [];
    {
      const P = [], V = [], tri = (a, b, c, part) => { for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); V.push(part, part >= 2 && part < 4.5 ? Math.max(0, Math.abs(p[0]) - 0.08) : 0); } };
      const nose = [0, 0.03, 0.26], tail = [0, 0.04, -0.3], top = [0, 0.13, 0.02], bot = [0, -0.1, 0.02], L = [-0.11, 0.01, 0.03], Rr = [0.11, 0.01, 0.03];
      tri(nose, Rr, top, 0); tri(Rr, tail, top, 0); tri(tail, L, top, 0); tri(L, nose, top, 0); tri(Rr, nose, bot, 1); tri(tail, Rr, bot, 1); tri(L, tail, bot, 1); tri(nose, L, bot, 1);
      tri([0, 0.05, -0.24], [0.1, 0.04, -0.5], [-0.1, 0.04, -0.5], 0); tri([0, 0.05, -0.24], [-0.1, 0.04, -0.5], [0.1, 0.04, -0.5], 1);                                   // the tail, a short fan
      { const hb = [[0.065, 0.07, 0.2], [0, 0.16, 0.2], [-0.065, 0.07, 0.2], [0, -0.01, 0.2]], ap = [0, 0.075, 0.37];                                                     // the head, a cream wedge
        for (let k = 0; k < 4; k++) tri(ap, hb[k], hb[(k + 1) % 4], k < 2 ? 0 : k === 2 ? 1 : 1);
        tri([0, 0.1, 0.33], [0.025, 0.06, 0.33], [0, 0.055, 0.46], 5); tri([0, 0.1, 0.33], [-0.025, 0.06, 0.33], [0, 0.055, 0.46], 5); tri([0.025, 0.06, 0.33], [-0.025, 0.06, 0.33], [0, 0.055, 0.46], 5); }   // the bill, straw
      for (const s of [-1, 1]) {
        const X = (d) => s * (0.08 + d), r0 = [X(0), 0.04, 0.15], r1 = [X(0), 0.04, -0.17], m0 = [X(0.34), 0.04, 0.27], m1 = [X(0.34), 0.04, -0.03], t0 = [X(0.56), 0.04, 0.12], t1 = [X(0.52), 0.04, -0.13], tip = [X(0.78), 0.04, -0.3];   // in plan the wrist leads and the hand sweeps back
        const q = (a, b, c, d, part) => { if (s > 0) { tri(a, b, c, part); tri(a, c, d, part); } else { tri(a, c, b, part); tri(a, d, c, part); } };
        q(r1, r0, m0, m1, 2); q(m1, m0, t0, t1, 2); q(t1, t0, tip, tip, 4);
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 2));
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(gI.pos, 3)); g.setAttribute('iHead', new THREE.InstancedBufferAttribute(gI.head, 2)); g.setAttribute('iMode', new THREE.InstancedBufferAttribute(gI.mode, 4)); g.setAttribute('iPit', new THREE.InstancedBufferAttribute(gI.pit, 1));
      for (const k of ['iPos', 'iHead', 'iMode', 'iPit']) g.attributes[k].setUsage(THREE.DynamicDrawUsage);
      g.instanceCount = NG;
      addMesh(g, new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide, toneMapped: false,
        vertexShader: /* glsl */`attribute vec2 aV; attribute vec3 iPos; attribute vec2 iHead; attribute vec4 iMode; attribute float iPit; uniform float uTime; varying float vPart; varying vec3 vW;
          void main(){                                            // iMode: flap amplitude, fold (1 = standing), phase, scale
            vec3 p = position; float d = aV.y, sg = sign(p.x);
            if (d > .001) {                                       // a wing is two rigid boards: the arm lifts from the shoulder, the hand droops from the wrist (a shallow M)
              float fl = uTime * 7.5 + iMode.z, a1 = iMode.x * sin(fl) + .3, a2 = a1 - .68 - .45 * iMode.x * cos(fl);
              float di = min(d, .34), dn = max(d - .34, 0.);
              vec3 q = vec3(sg * (.08 + di * cos(a1) + dn * cos(a2)), .04 + di * sin(a1) + dn * sin(a2), p.z);
              vec3 f = vec3(sg * (.08 + d * .12), .05 - d * .05, p.z - d * .55);
              p = mix(q, f, iMode.y);
            }
            p.y += iMode.y * .1;
            float cb = cos(iHead.y), sb = sin(iHead.y); p = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z);
            float cq = cos(iPit), sq = sin(iPit); p = vec3(p.x, p.y * cq + p.z * sq, -p.y * sq + p.z * cq);      // the climb
            float ch = cos(iHead.x), sh = sin(iHead.x); p = vec3(p.x * ch + p.z * sh, p.y, -p.x * sh + p.z * ch);
            p = iPos + p * iMode.w; vW = p; vPart = aV.x;
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL} varying float vPart; varying vec3 vW;
          void main(){
            float lit = step(0., max(dot(vW, uHead.xyz) + uHead.w, vW.z - uHeadZ)) * (1. - step(0., hopChord(vW)));
            vec3 up = mix(uTab[1], uTab[0], lit), under = mix(uTab[2], uTab[1], lit);
            vec3 col = vPart < .5 ? up : vPart < 1.5 ? under : vPart < 3. ? (gl_FrontFacing ? up : under) : vPart < 4.5 ? uTab[19] : mix(uTab[10], uTab[9], lit);
            gl_FragColor = vec4(col, 1.);
          }`,
      }), 'gulls');
      // the cast: 0 the one that crosses the nose; then standers on cornices and roofs, gliders round the hotel, a low flock on the cove
      const hp = hero.anchors.perches.map((p) => [p.x + HOX, p.y + HOY, p.z + HOZ]);
      for (let i = 0; i < NG; i++) {
        const kind = i === 0 ? 'hero' : i < 9 ? 'cove' : i < 15 ? 'glide' : i < 22 ? 'street' : i < 24 ? 'window' : i < 29 ? 'fence' : 'stand', src = i % 2 ? hp : perch, pt0 = src[Math.floor(rng() * src.length)] || hp[0], pt = kind === 'fence' ? fencePerch[i - 24] : pt0;
        gulls.push({ kind, p: pt, ph: rng() * 6.283, r: 14 + rng() * 30, h: 30 + rng() * 16, sp: (rng() < 0.5 ? -1 : 1) * (0.18 + 0.12 * rng()), ox: rng() * 2 - 1, oz: rng() });
      }
    }
    await Y();
    // THE GLIDERS KEEP CLEAR OF THE HOTEL, BY PLACE (the owner's rule: the six circuits are laid clear of the hotel's whole volume
    // by the gull's wing reach and a margin). At the height they were dealt (the upper storeys) nineteen circuits in twenty come
    // within 2.4 m of the hotel, its wing or a tree at some moment (229 of 240 on forty seeds), and few of the dealt circles have
    // clear air there. One lift clears every one of them by one number: each glider keeps the middle of its circle in plan, its
    // speed and its phase (and its radius, but for the pole's rule below) and flies 21.3 m higher, over the roofs: the lowest
    // pass of the lowest circuit that can be dealt is then 2.4 m (the reach of a wing tip, 1.38 m, and a metre of air) over the
    // tower's cap at its tallest (30.5 above the hotel's base), and so over the chimneys, the mansard, the wing and the trees.
    // The pole's top and its pennant alone stand higher (the pennant streams 6.5 m from the pole's top to the west-south-west,
    // the part's own numbers; a disc of 3.7 m about its middle holds them both): a circle that would pass within 2.4 m of that
    // disc takes the nearer radius that does not, never under the 14 m that is the least dealt (so a radius may pass live's
    // 44 m, to 50.1 m at the most). A place fixed at build; nothing here reads the lens or the clock, and no draw is made or moved.
    for (const g of gulls) if (g.kind === 'glide') { const d = Math.hypot(-26 + g.ox * 22 + 0.94 * 3.25, -30 + g.oz * 150 - 0.34 * 3.25), gap = 2.4 + 3.7; if (Math.abs(d - g.r) < gap) g.r = g.r < d && d - gap >= 14 ? d - gap : d + gap; }
    // ---- the low flock on the cove: the design's "gulls scattering low", "gulls lift, glide and settle" --------------
    // The same gull at the design's 1.4 m, resting on the ridges beside the course from the foot of the drop to the pier's
    // head, dealt to starboard and to port in turn. Each lifts when the eye is FLOCK_LIFT metres off along the route, flies
    // low ahead of us down the cove while we overhaul it, peels outward, glides and settles on the water again. A bird's
    // place is a function of the metres the eye has flown past its own lifting place; only the wing beat and the lift of
    // the ridges under a resting bird loop on time. A flock of its own on a stream of its own: the cast above (the eight
    // on the water among them) keeps its draws and its rule.
    const FLOCK_LIFT = 28, FLOCK_NT = 24;                           // metres of route; the points a flight is kept by
    const NF = Math.round(18 * Math.min(1.15, density) * (0.7 + 0.3 * detail)), FSC = 1.4 / 1.72;   // the model spans 1.72 m at scale 1
    const fI = { pos: new Float32Array(NF * 3), head: new Float32Array(NF * 2), mode: new Float32Array(NF * 4), pit: new Float32Array(NF) }, flock = [];
    {
      const fr = ctx.core.makeRng(ctx.core.hashSeed('cove-flock:' + ctx.seed)), base = scene.getObjectByName('gulls');
      const sloopX = pathX(566) + 9.5, NT = FLOCK_NT, FOOT_Z = 540, PIER_Z = 588;   // the foot of the drop (the route's own point); the pier's head
      // every point of a flight: water at least 0.6 m deep, 7 m clear of the sloop's line (it lies on it from z 530 to z 566,
      // a hull's length each way) and of the pier, 5 m clear of the moored dories
      const clear = (x, z) => H(x, z) < SEA_Y - 0.6 && !(Math.abs(x - sloopX) < 7 && z > 515 && z < 581) && !(x > 13 && x < 29.8 && z > PIER_Z - 7) && Math.hypot(x - 15.6, z - 622) > 5 && Math.hypot(x + 2.5, z - 627) > 5;
      // where it rests and where it settles: 3 m clear of where each of the eight on the water may rest (4 to 9 m off the course
      // at its own z) and of where every bird of the flock dealt before it rests and settles
      const room = (x, z) => {
        for (let e = 1; e <= 8; e++) { const bz = 548 + e * 9.5, lat = (x - pathX(bz)) * (e % 2 ? -1 : 1); if (Math.hypot(z - bz, Math.max(4 - lat, 0, lat - 9)) < 3) return false; }
        for (const f of flock) if (Math.hypot(x - f.x[0], z - f.z[0]) < 3 || Math.hypot(x - f.x[NT - 1], z - f.z[NT - 1]) < 3) return false;
        return true;
      };
      // in the air: no two birds of the flock within a wingspan of one another, in plan, at the same metre of the eye's flight.
      // A try is walked beside every bird dealt before it, both by the eye's metres, from the first lift of the two to the
      // last settling; a step is a quarter metre of the eye's flight, in which two birds close by less than a quarter metre
      // (neither flies as far as the eye does), so half a step is added to the wingspan and nothing passes between two steps.
      const WING = 1.4, WSTEP = 0.25, pa = [0, 0], pb = [0, 0];
      const birdAt = (f, em, o) => { const q = Math.max(0, Math.min(1, (em - f.m0) / f.F)) * (NT - 1), j = Math.min(NT - 2, Math.floor(q)), a = q - j; o[0] = mix(f.x[j], f.x[j + 1], a); o[1] = mix(f.z[j], f.z[j + 1], a); };
      const apart = (c) => {
        for (const f of flock) {
          const e1 = Math.max(c.m0 + c.F, f.m0 + f.F);
          for (let em = Math.min(c.m0, f.m0); em <= e1; em += WSTEP) { birdAt(c, em, pa); birdAt(f, em, pb); if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < WING + 0.5 * WSTEP) return false; }
        }
        return true;
      };
      for (let i = 0; i < NF; i++) {
        const sd = i % 2 ? 1 : -1;                                  // to starboard and to port in turn
        for (let t = 0; t < 40; t++) {
          // all of a try's values are drawn before the water is asked: where it rests (z along the course, metres off the course,
          // the draw cubed toward it), how far ahead it flies for each metre the eye flies, how far it peels outward in all, how
          // high, how soon it settles (a little before the eye draws level with it, or a little after), its wing's phase. What
          // is kept differs from what is drawn: to port the sloop's band and the pier leave no resting place nearer than about
          // 17 m, and a long flight from a late place runs out of water, so the kept birds thin toward the pier's head.
          const z0 = FOOT_Z + (PIER_Z - FOOT_Z) * fr(), l0 = 6 + 24 * Math.pow(fr(), 3), fw = 0.62 + 0.13 * fr(), ow = 3 + 6 * fr(), h = 0.4 + 0.7 * fr(), k = 0.8 + 0.35 * fr(), ph = fr() * 6.283;   // (h: metres above the highest ridge, under the eye's own height over the water)
          const F = k * FLOCK_LIFT / (1 - fw), x = new Float32Array(NT), z = new Float32Array(NT);
          let ok = true;
          for (let j = 0; j < NT && ok; j++) { const q = j / (NT - 1); z[j] = z0 + fw * F * q; x[j] = pathX(z[j]) + sd * (l0 + ow * q * q); ok = clear(x[j], z[j]) && ((j > 0 && j < NT - 1) || room(x[j], z[j])); }
          if (!ok) continue;
          const bird = { m0: zToU(z0) * path.length - FLOCK_LIFT, F, x, z, sd, h, ph };
          if (!apart(bird)) continue;
          flock.push(bird); break;
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', base.geometry.attributes.position); g.setAttribute('aV', base.geometry.attributes.aV);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(fI.pos, 3)); g.setAttribute('iHead', new THREE.InstancedBufferAttribute(fI.head, 2)); g.setAttribute('iMode', new THREE.InstancedBufferAttribute(fI.mode, 4)); g.setAttribute('iPit', new THREE.InstancedBufferAttribute(fI.pit, 1));
      for (const k of ['iPos', 'iHead', 'iMode', 'iPit']) g.attributes[k].setUsage(THREE.DynamicDrawUsage);
      g.instanceCount = flock.length;
      addMesh(g, base.material, 'cove-flock');
    }

    await Y();
    // ---- the sloop (or a two-masted coaster): light red hull, cream sails, heeling ------------------------------------
    const boat = new THREE.Group(), boat2 = new THREE.Group(); boat.name = 'sloop'; boat2.name = 'sail-off-the-light';
    {
      const B = hopGeo(), hl = coaster ? 7.5 : 5, bw = coaster ? 1.9 : 1.5, st = [-hl, -hl * 0.55, 0, hl * 0.5, hl], wd = [0.75, 1, 1, 0.72, 0].map((v) => v * bw);
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
        const a = [s * wd[k], 0.75, st[k]], b = [s * wd[k + 1], 0.75 + (k === 3 ? 0.35 : 0), st[k + 1]], a2 = [s * wd[k] * 0.4, -0.8, st[k]], b2 = [s * wd[k + 1] * 0.4, -0.8, st[k + 1]];
        hopQuad(B, ...(s > 0 ? [b2, a2, a, b] : [a2, b2, b, a]), PIG.RED);
        hopQuad(B, ...(s > 0 ? [a, [0, 0.78, st[k]], [0, 0.78 + (k === 3 ? 0.35 : 0), st[k + 1]], b] : [[0, 0.78, st[k]], a, b, [0, 0.78 + (k === 3 ? 0.35 : 0), st[k + 1]]]), PIG.WHITE);
      }
      hopQuad(B, [wd[0] * 0.4, -0.8, -hl], [-wd[0] * 0.4, -0.8, -hl], [-wd[0], 0.75, -hl], [wd[0], 0.75, -hl], PIG.RED);
      hopBox(B, -0.5, 0.78, -hl * 0.45, 0.5, 1.25, -hl * 0.05, PIG.WHITE, 0, 'y', PIG.ROOF);
      const masts = coaster ? [[hl * 0.42, 10.5], [-hl * 0.3, 11.5]] : [[hl * 0.22, 11.5]];
      for (const [mz, mh] of masts) {
        hopBox(B, -0.08, 0.7, mz - 0.08, 0.08, mh, mz + 0.08, PIG.STRAW, 0, 'y');
        const boom = Math.min(hl * 0.95, mz + hl - 0.4), a = [0.02, 1.7, mz - 0.1], b = [0.5, 1.9, mz - boom], c = [0.3, coaster ? mh * 0.8 : mh * 0.35, mz - boom * (coaster ? 0.8 : 0.5)], d = [0.02, mh - 0.4, mz - 0.1];
        hopQuad(B, a, b, c, d, PIG.WHITE); hopQuad(B, b, a, d, c, PIG.WHITE);
      }
      const jm = masts[0], ja = [0, 1.2, hl - 0.1], jb = [0.35, 1.5, jm[0] + 0.5], jc = [0.02, jm[1] * 0.82, jm[0] + 0.1];
      hopQuad(B, ja, jb, jc, jc, PIG.WHITE); hopQuad(B, jb, ja, jc, jc, PIG.WHITE);
      {                                                           // the same slabs as triangles (along the keel, up) for the shadow they throw on the water
        const T = [[[-hl, 0], [hl, 0], [hl, 1.1]], [[-hl, 0], [hl, 1.1], [-hl, 0.75]], [[hl - 0.1, 1.2], [jm[0] + 0.5, 1.5], [jm[0] + 0.1, jm[1] * 0.82]]];
        for (const [mz, mh] of masts) { const boom = Math.min(hl * 0.95, mz + hl - 0.4), a = [mz - 0.1, 1.7], b = [mz - boom, 1.9], c = [mz - boom * (coaster ? 0.8 : 0.5), coaster ? mh * 0.8 : mh * 0.35], d = [mz - 0.1, mh - 0.4]; T.push([a, b, c], [a, c, d]); }
        T.forEach((t, i) => t.forEach((q, k) => seaU.uSailT.value[i * 3 + k].set(q[0], q[1]))); seaU.uHull.value = hl;
      }
      boat.add(addMesh(hopFinish(B), mat, 'sloop-slabs', boat)); scene.add(boat);
      // a second sail stands off the light, out beyond the shelf: the tower is seen against the sea with a sail on it
      addMesh(boat.children[0].geometry, mat, 'sail-off-the-light', boat2); boat2.position.set(66, SEA_Y + 0.2, 729); boat2.rotation.set(0, evening ? 0.5 : 2.6, 0.2); boat2.scale.setScalar(1.3); scene.add(boat2);
    }
    await Y();
    // ---- the rare event: somebody is up. One small figure on a bed edge, turned to the sea window; next door a blind goes up
    const figure = new THREE.Group(), blind = new THREE.Group();
    {
      const Fg = hopGeo(), zb = -85 + 5.5 * 6.8 + 0.25, yf = 13.3, x = -3.86;
      hopBox(Fg, -4.16, yf + 0.05, zb - 1.3, -3.2, yf + 0.75, zb + 0.75, PIG.ROOMCEIL);                              // a high iron bed along the window wall
      hopBox(Fg, x - 0.13, yf + 0.75, zb - 0.3, x + 0.13, yf + 1.37, zb + 0.3, PIG.WHITE);                             // the back of a shirt
      hopBox(Fg, x - 0.1, yf + 0.8, zb - 0.41, x + 0.08, yf + 1.33, zb - 0.3, PIG.WHITE); hopBox(Fg, x - 0.1, yf + 0.8, zb + 0.3, x + 0.08, yf + 1.33, zb + 0.41, PIG.WHITE);
      hopBox(Fg, x - 0.07, yf + 1.37, zb - 0.07, x + 0.07, yf + 1.44, zb + 0.07, PIG.STREET); hopBox(Fg, x - 0.11, yf + 1.44, zb - 0.11, x + 0.11, yf + 1.68, zb + 0.11, PIG.STREET);
      hopBox(Fg, x - 0.125, yf + 1.57, zb - 0.125, x + 0.06, yf + 1.71, zb + 0.125, PIG.DARK);                         // hair; no face is ever seen
      figure.add(addMesh(hopFinish(Fg), mat, 'figure-slabs', figure)); figure.scale.setScalar(rare ? 1 : 1e-4); if (!rare) figure.position.set(0, -60, 0);
      const Bg = hopGeo(), z2 = -85 + 6.5 * 6.8; hopQuad(Bg, [0, -1, -1.3], [0, -1, 1.3], [0, 0, 1.3], [0, 0, -1.3], PIG.STRAW); hopQuad(Bg, [-0.01, -1.04, -0.05], [-0.01, -1.04, 0.05], [-0.01, -1, 0.05], [-0.01, -1, -0.05], PIG.WHITE);
      blind.add(addMesh(hopFinish(Bg), mat, 'blind-slab', blind)); blind.position.set(-4.5 + 0.165, 16.9, z2);
      hero.object.add(figure, blind);
    }
    await Y();

    await Y();
    // ---- the flight ---------------------------------------------------------------------------------------------------
    const uGull = zToU(sigTop.z - 17), uFence = [zToU(fencePerch[0][2] - 20), zToU(fencePerch[1][2] - 20)], uBlind = zToU(HOZ - 85 + 6.5 * 6.8 - 30), size = new THREE.Vector2(), cp = new THREE.Vector3(), tg = new THREE.Vector3(), gp = new THREE.Vector3();
    const K = 0.5, kn = Math.hypot(1, K);
    U.uHeadZ.value = 196;
    const heroLook = new THREE.Vector3(HOX - 3, HOY + 11, HOZ - 62), revealLook = new THREE.Vector3(HOX - 4.5, HOY + 8, 338), flank = new THREE.Vector3(), boatLook = new THREE.Vector3(), look0 = new THREE.Vector3(), look1 = new THREE.Vector3(), look2 = new THREE.Vector3(), look3 = new THREE.Vector3(), towerLook = new THREE.Vector3(TWX, 17, TWZ), figLook = new THREE.Vector3(HOX - 4.5, HOY + 14.6, HOZ - 85 + 5.5 * 6.8);
    const setGull = (i, x, y, z, hd, bank, flap, fold, ph, sc, pit = 0) => { gI.pit[i] = pit; gI.pos[i * 3] = x; gI.pos[i * 3 + 1] = y; gI.pos[i * 3 + 2] = z; gI.head[i * 2] = hd; gI.head[i * 2 + 1] = bank; gI.mode[i * 4] = flap; gI.mode[i * 4 + 1] = fold; gI.mode[i * 4 + 2] = ph; gI.mode[i * 4 + 3] = sc; };
    const gullMesh = scene.getObjectByName('gulls'), windHead = evening ? Math.PI / 2 : -Math.PI / 2;
    const flockMesh = scene.getObjectByName('cove-flock'), NT_F = FLOCK_NT;
    const setFlock = (i, x, y, z, hd, bank, flap, fold, ph, pit) => { fI.pit[i] = pit; fI.pos[i * 3] = x; fI.pos[i * 3 + 1] = y; fI.pos[i * 3 + 2] = z; fI.head[i * 2] = hd; fI.head[i * 2 + 1] = bank; fI.mode[i * 4] = flap; fI.mode[i * 4 + 1] = fold; fI.mode[i * 4 + 2] = ph; fI.mode[i * 4 + 3] = FSC; };
    const BOATX = pathX(566) + 9.5, boatZ = (ez) => mix(530, 566, ss(450, 567, ez)), BOATL = coaster ? 15 : 10;   // the sloop's place for the eye's place on the course; its hull's length (twice hl above)
    const update = (dt, time, camera, u) => {
      // the paint first: the sun climbs, its ruled edge runs down the street faster than we travel
      hero.setProgress(u);
      { const d = Math.abs(u - curtainU) / 0.075; hero.setGust(d < 1 ? (1 - d * d) * (1 - d * d) : 0); }
      hero.update(dt, time);
      if (evening) U.uHead.value.set(0, 1, 0, -(1.5 + 60 * u));
      else { const zE = u > 0.2 ? 1e5 : -14 + 1800 * u; U.uHead.value.set(0, 1 / kn, -K / kn, K * zE / kn); }
      path.pointAt(u, cp);
      const cz = Math.min(cp.z, 285); U.uCar.value.set(trackX(cz) - HOX, deckY(cz) + 0.3 - HOY, cz - 3 - HOZ, cz + 15 - HOZ);   // our car's shadow; it stops at the buffers
      renderer.getDrawingBufferSize(size); ribU.uPix.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * Math.max(1, size.y));
      if (pole) pole.rotation.y = time * 1.7;
      // the sloop, by the eye's place on the course:
      // it has put out from under the bluff and stands down the cove on our own course: under the eye in the drop, ahead of us
      // from the bluff's edge and growing all the way down, heeling as we close, overhauled 9.5 m to port off the cove's mouth (z 566)
      boat.position.set(BOATX, SEA_Y + 0.2 + 0.18 * Math.sin(time * 1.1), boatZ(cp.z));   // one offset to port for the whole pass
      { const near = 1 - ss(28, 75, Math.hypot(boat.position.x - cp.x, boat.position.z - cp.z)); boat.rotation.set(-0.03 * Math.sin(time * 0.9), 0.1, -(0.07 + 0.17 * near + 0.04 * Math.sin(time * 0.7))); }
      seaU.uBoat.value.set(boat.position.x, boat.position.z, Math.cos(boat.rotation.y), Math.sin(boat.rotation.y));
      boat2.position.y = SEA_Y + 0.2 + 0.16 * Math.sin(time * 1.0 + 2); boat2.rotation.z = 0.2 + 0.04 * Math.sin(time * 0.8 + 1);
      blind.scale.y = 2.9 * (rare ? mix(0.86, 0.1, ss(uBlind - 0.012, uBlind + 0.03, u)) : 0.5);
      // gulls
      for (let i = 0; i < NG; i++) {
        const g = gulls[i];
        if (g.kind === 'hero') {
          const s = (u - uGull) / 0.075;
          if (s <= 0) setGull(i, sigTop.x, sigTop.y + 0.02, sigTop.z, windHead, 0, 0, 1, 0, 1.5);
          else {
            path.pointAt(Math.min(1, u + 24 / path.length), gp).sub(cp).setY(0).normalize();     // where the eye looks: the nose
            // it lifts off the post and climbs away with its back to us, both wings spread in a shallow M, cream above, then slides off to starboard
            const far = Math.max(0, s - 1), lat = 3.3 - 3.5 * ss(0, 0.35, s) - 5.5 * ss(0.62, 1, s) - far * 24, k = ss(0, 0.2, s), ah = 6.5;
            const x = mix(sigTop.x, cp.x + gp.x * ah + gp.z * lat, k), y = mix(sigTop.y, cp.y + 1.75 + 0.5 * ss(0, 1, s), k) + far * 8, z = mix(sigTop.z, cp.z + gp.z * ah - gp.x * lat, k) + far * 18;
            setGull(i, x, y, z, Math.atan2(gp.x, gp.z) - 0.25 - 0.5 * ss(0.5, 1.1, s), 0.14 - 0.5 * ss(0.55, 1.1, s), 0.2, 0, 0, 1.5, 1.05 - 0.35 * ss(0.5, 1.2, s));
          }
        } else if (g.kind === 'cove') {
          const bz = 548 + i * 9.5, bx = pathX(bz) + (i % 2 ? -1 : 1) * (4 + 5 * g.oz), ui = zToU(bz - 34), s = (u - ui) / 0.06;
          if (s <= 0) setGull(i, bx, SEA_Y + 0.25 + 0.2 * Math.sin(time * 1.3 + g.ph), bz, windHead, 0, 0, 1, g.ph, 1.2);
          else { const e = Math.min(s, 6), sd = i % 2 ? -1 : 1; setGull(i, bx + sd * e * 9, SEA_Y + 0.4 + 2.6 * Math.sqrt(e) + e * 1.5, bz + e * 16, sd * 0.5, sd * -0.3, 0.8, 0, g.ph, 1.2, 0.35); }
        } else if (g.kind === 'glide') {
          const a = g.ph + time * g.sp, cx = HOX - 26 + g.ox * 22, czz = HOZ - 30 + g.oz * 150;
          setGull(i, cx + Math.cos(a) * g.r, HOY + 26.3 + g.h * 0.32 + 3 * Math.sin(a * 0.7 + g.ph), czz + Math.sin(a) * g.r, Math.atan2(-Math.sin(a) * g.sp, Math.cos(a) * g.sp), -0.35 * Math.sign(g.sp), 0.15 + 0.5 * Math.max(0, Math.sin(time * 0.6 + g.ph * 3)), 0, g.ph, 1.5);
        } else if (g.kind === 'street') {                           // a few work up and down the street, over its port side
          if (i < 18) {                                             // three wheel over the street's first sheds, 9 m and more to port of the eye, so the arrival has wings in it
            const w = 0.38 * Math.sign(g.sp), a = g.ph + time * w, cz = -6 + (i - 15) * 15;
            setGull(i, SX + 17 + Math.cos(a) * 8, 14.6 + g.oz * 1.6 + 0.6 * Math.sin(a * 0.7 + g.ph), cz + Math.sin(a) * 13, Math.atan2(-Math.sin(a) * 8 * w, Math.cos(a) * 13 * w), -0.3 * Math.sign(w), 0.2 + 0.5 * Math.max(0, Math.sin(time * 0.8 + g.ph * 4)), 0, g.ph, 1.5);
            continue;
          }
          const zz = ((g.ph * 60 + time * 28 * g.sp) % 215 + 215) % 215 - 40, dir = g.sp > 0 ? 0 : Math.PI;   // z -40 to 175: they stay over the port side of the street, 5 m and more to port of the eye and 6 m above it, so none crosses the lens larger than the one the design sends across the nose
          setGull(i, SX + 10 + g.ox * 3 + 1.5 * Math.sin(time * 0.5 + g.ph), 17 + g.oz * 3 + Math.sin(time * 0.8 + g.ph), zz, dir, 0.2 * Math.sin(time * 0.5 + g.ph), 0.2 + 0.6 * Math.max(0, Math.sin(time * 0.9 + g.ph * 5)), 0, g.ph, 1.5);
        } else if (g.kind === 'window') {                           // two cross the sea windows of the dining room, out over the drop
          const d = i % 2 ? 1 : -1, xx = ((g.ph * 20 + time * 6.5) % 64 + 64) % 64 - 32;
          setGull(i, HOX - 10.5 + d * xx, HOY + 8.2 + g.oz * 2.2 + 0.8 * Math.sin(time * 0.7 + g.ph), HOZ + 118 + 8 * g.oz, d * Math.PI / 2, 0, 0.3 + 0.5 * Math.max(0, Math.sin(time * 0.8 + g.ph * 4)), 0, g.ph, 1.5);
        } else if (g.kind === 'fence' && i < 26 && u > uFence[i - 24]) {      // two lift off the lawn fence as the eye comes out over the grass, and make for the roof ahead of us
          const s = (u - uFence[i - 24]) / 0.07, k = ss(0, 0.3, s), far = Math.max(0, s - 1), sd = i === 24 ? -1 : 1;
          gp.set(HOX - 5 - cp.x, 0, Math.max(HOZ + 15, cp.z + 26) - cp.z).normalize();
          const ah = 15 + (i - 24) * 5 + far * 30, lat = -2.5 + sd * (1.5 + 1.2 * s);
          const x = mix(g.p[0], cp.x + gp.x * ah + gp.z * lat, k), y = mix(g.p[1], cp.y + 0.9 + (i - 24) * 1.4 + 0.8 * s, k) + far * 9, z = mix(g.p[2], cp.z + gp.z * ah - gp.x * lat, k);
          setGull(i, x, y, z, Math.atan2(gp.x, gp.z) + sd * 0.25, sd * 0.12, 0.35, 0, g.ph, 1.5, 0.5 - 0.3 * ss(0.3, 1, s));
        } else setGull(i, g.p[0], g.p[1] + 0.02, g.p[2], windHead + 0.25 * Math.sin(g.ph * 9 + time * 0.4), 0, 0, 1, g.ph, 1.1);
      }
      const ga = gullMesh.geometry.attributes; ga.iPos.needsUpdate = true; ga.iHead.needsUpdate = true; ga.iMode.needsUpdate = true; ga.iPit.needsUpdate = true;
      // the low flock on the cove: each bird by the metres the eye has flown past its own lifting place. On the water it rides
      // the ridge under it (the sea's own three rows, as its shader has them); in the air it keeps one level over the highest ridge
      const em = u * path.length, sAmp = seaU.uAmp.value, crest = 0.775 * sAmp;
      for (let i = 0; i < flock.length; i++) {
        const f = flock[i], s = Math.max(0, Math.min(1, (em - f.m0) / f.F)), q = s * (NT_F - 1), j = Math.min(NT_F - 2, Math.floor(q)), a = q - j;
        const x = mix(f.x[j], f.x[j + 1], a), z = mix(f.z[j], f.z[j + 1], a);
        const ride = sAmp * (0.25 * Math.sin((x * 0.31 + z * 0.95) * 0.92 - time * 1.9) + 0.5 * Math.sin((x * 0.28 + z * 0.96) * 0.23 - time * 0.8) + 0.025 * Math.sin((x * -0.55 + z * 0.83) * 2 - time * 2.7));
        const air = ss(0, 0.2, s) * (1 - ss(0.72, 1, s)), y = SEA_Y + 0.12 + mix(ride, crest + f.h, air);
        const rest = windHead + 0.25 * Math.sin(f.ph * 9 + time * 0.4);                                                  // its heading on the water, facing the wind
        if (s <= 0 || s >= 1) setFlock(i, x, y, z, rest, 0, 0, 1, f.ph, 0);   // on the water: where it rested, or where it has settled
        else {
          // It does not snap into the air or onto the water. Over the first and the last tenth of its own flight the wings
          // unfold and fold, and the beat, the bank and the climb come in and go out with them; over the first and the last
          // fifth it turns from its resting heading to its line and back, the short way round. Both are functions of the
          // metres the eye has flown past its lifting place (s), the same lines for the lift and, turned round, for the settling.
          const open = ss(0, 0.1, s) * (1 - ss(0.9, 1, s)), line = ss(0, 0.2, s) * (1 - ss(0.8, 1, s));
          const trk = Math.atan2(f.x[j + 1] - f.x[j], f.z[j + 1] - f.z[j]), off = Math.atan2(Math.sin(rest - trk), Math.cos(rest - trk));
          setFlock(i, x, y, z, trk + off * (1 - line), open * f.sd * -0.3 * (1 - ss(0, 0.3, s)), open * (mix(0.8, 0.2, ss(0.15, 0.45, s)) + 0.5 * ss(0.8, 1, s)), 1 - open, f.ph, open * (0.35 * (1 - ss(0, 0.25, s)) - 0.2 * ss(0.7, 0.9, s) * (1 - ss(0.94, 1, s))));
        }
      }
      const fa = flockMesh.geometry.attributes; fa.iPos.needsUpdate = true; fa.iHead.needsUpdate = true; fa.iMode.needsUpdate = true; fa.iPit.needsUpdate = true;
    };
    update(0, 0, { projectionMatrix: new THREE.Matrix4().makePerspective(-0.5, 0.5, 0.3, -0.3, 0.5, 100) }, 0);
    await Y();
    // Every key of pace and gaze is a PLACE on the route (a z of the world), turned into u once here: nothing is keyed to a fixed u.
    const Z = (z) => zToU(z), WALLX = HOX - 4.5;
    const pk = [Z(141), Z(202), Z(263), Z(302), Z(489), Z(529), Z(620), Z(680)];
    return {
      scene, path, duration: 40,
      pace: (u) => 1.35 - 0.35 * ss(pk[0], pk[1], u) - 0.3 * ss(pk[2], pk[3], u) + 0.8 * ss(pk[4], pk[5], u) - 0.5 * ss(pk[6], pk[7], u),   // 1.35 on the street, 0.7 along the flank and in the room, 1.5 in the dive, 1 at the end
      camera: { fov: 60, near: 0.3, far: 7000, lookAhead: 24, sway: 0, bank: 0 },
      pois: [
        { at: (time, u) => { path.pointAt(u, look0); return look0.set(SX + 45, 13, look0.z + 70); }, from: -0.06, to: Z(40), weight: 0.6 },   // arriving: the eye is on the sunlit side, the hill and the hotel
        { at: heroLook, from: -0.1, to: Z(280), weight: 0.3 },
        { at: revealLook, from: Z(165), to: Z(300), fade: 0.3, weight: 0.72 },              // the reveal from the trestle: the eye goes to the hotel's sunlit end
        // a glance aside, as from a train: the fronts nearly square-on, their blinds and curtains at eye level, our car's shadow running on them
        { at: (time, u) => { path.pointAt(u, look1); return look1.set(ROWX, 8.4, look1.z + 7.5); }, from: Z(58), to: Z(128), weight: 0.72 },
        // THE FLANK RUN, one rule for the whole of it, by the distance d to the wall: the eye is turned to port of the wall's own
        // line onto a point of the wall ahead of us, 9 degrees out at the buffers (24 m off: the hotel whole and aslant on the left,
        // and to starboard its shadow dark green on the lawn to the ruled edge, straw sun, the trees' lit caps and the wing's cream
        // end beyond), 15 where the wall is 14 m off, 26 at 6.5 m, so as we close the nearest rooms grow and are seen deeper into
        // (dark box, slab, square of sea) while the flank still runs off on its diagonal to the tower and the wing closes the view
        // with the lawn beside it; never square on, never only wall. The gaze is tipped up 6.5 degrees, so the horizon lies at two
        // fifths of the frame under eave and sky. Over the flank's last 30 m it swings to the wing: to a point a little to starboard
        // of the tall window we go in at, so the frame holds that window and its neighbour, both full of sea, and the blank corner
        // where flank meets wing stays at the frame's edge.
        { at: (time, u) => {
          path.pointAt(u, flank); const d = Math.max(4, WALLX - flank.x), sD = ss(436, 462, flank.z), c = 1 / Math.tan(0.16 + 0.1 * ss(24, 14, d) + 0.2 * ss(14, 6.5, d));
          return flank.set(mix(WALLX + 1.5, 4.6, sD), mix(flank.y + 0.115 * d * Math.hypot(1, c), 25.2, sD), mix(flank.z + c * d, 472, sD));
        }, from: Z(283), to: Z(468), fade: 0.25, weight: 0.9 },
        { at: towerLook, from: Z(588), to: Z(721), weight: 0.45 },     // the light on its knoll: the eye goes to it from the pier's head, across the beach and up the dunes, while the course swings to starboard round the bathhouse, and lets it go as it comes abeam
        // from the dining room's window and down the drop the eye keeps to the far shore (the light, the beach, the boathouse) and
        // the level horizon, so the fall is felt against a still picture and the sea lies under it in rows
        { at: (time, u) => { path.pointAt(u, look2); return look2.set(mix(look2.x, 14, 0.5), 5, look2.z + 170); }, from: Z(470), to: Z(566), fade: 0.22, weight: 0.8 },
        // THE SLOOP, one rule by the distance to it, from the bluff's brow until it is astern: the eye goes to the boat, more the
        // nearer it is, on one ramp from 80 m (a third of the way) to 18 m (four fifths); at the brow, 49 m off, it stands at a
        // little over half, so the boat is whole and growing in the frame all the way down; the pull lets go from one hull's
        // length before we draw level to one hull's length after, so
        // close to, the heeling sail is cut by the frame's side and top as one slab with the hull's sheer under it, and by the time
        // only its bow would be left the eye is back on the course and the boat is behind us
        { at: (time, u) => {
          path.pointAt(u, look3); path.pointAt(Math.min(1, u + 24 / path.length), boatLook);
          const bz = boatZ(look3.z), k = (0.3 + 0.5 * ss(80, 18, Math.hypot(BOATX - look3.x, bz - look3.z))) * ss(-BOATL, BOATL, bz - look3.z);
          return boatLook.set(mix(boatLook.x, BOATX, k), mix(boatLook.y, 4, k), mix(boatLook.z, bz, k));
        }, from: Z(494), to: Z(566 + 24), fade: 0.12, weight: 0.9 },   // from the bluff's brow to one look-ahead (24 m) past the place where the sloop is overhauled (z 566)
        { at: figLook, from: Z(283), to: Z(311), weight: rare ? 0.5 : 0 },      // somebody is up: the eye goes to that window
      ],
      portal: { shape: 'rect', width: 9, height: 9.5, color: '#4F8FB8', veil: '#7FA8A6', glow: 0.2, frame: 0, revealDistance: 240, blendDistance: 30 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
