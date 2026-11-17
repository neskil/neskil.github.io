// The Evening Meet: a flying field at the end of a windless day where the ground, the hills, the trees, the
// sky and three hundred rubber-powered aeroplanes are all balsa sticks under doped tissue, seen against the
// light. Two materials and no third (see src/parts/tissue-and-balsa-meet.js): opaque honey BALSA drawn first,
// then TISSUE: a paper with a body, which shows its own lit colour, its frame drawn in it as shadow, and hides
// what is behind it (only the far ranges and the hour's long shadows multiply what is behind them); then an additive
// sun lobe on the papers that burn. No lights, no fog, no normal attribute is read (where a paper is given a form, a face's own
// normal is taken in the fragment shader from the derivative of its place), post.flat = 1 (a pigment written is the
// pigment shown; no inverse tone map anywhere).
// We ride the red model: its wing, nose and propeller are built here and carried with the camera; the lens sits
// forward over the wing's leading edge, so the model lies under the picture (its nose is seen when the gaze drops).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, liningShade, shadeTint, Sticks, Skins, TISSUE, PALETTE, AIRSHIP, LINE_UNDER, BODY, FORM } from '../parts/tissue-and-balsa-meet.js';

const HOURS = {
  evening: { peach: '#F6BE94', lilac: '#A898DA', hot: '#FFEDC4', earth: '#B79A70', az: 70, el: 11, mist: 1 },      // the brief's default (and night): apricot under violet
  golden: { peach: '#F5D88E', lilac: '#A4C6E8', hot: '#FFE29C', earth: '#BFA468', az: 66, el: 23, mist: 0.8 },     // butter to blue, the blur higher and amber
  dawn: { peach: '#EFDDD0', lilac: '#E2A6B8', hot: '#FFEEDD', earth: '#B8A08E', az: -70, el: 6, mist: 1.7 },       // pearl and rose, the blur low on the right
};
const TITLES = { evening: 'The Evening Meet', golden: 'The Evening Meet, Golden Hour', dawn: 'The Dawn Meet' };

export default {
  id: 'tissue-and-balsa-meet',
  name: 'The Evening Meet',
  category: 'sky',
  weirdness: 0.15,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const scene = new THREE.Scene();
    // ---- the visit: hour, colourway, cast, density (all drawn first, in a fixed order) ----------------------
    const hr = rng(), cw = rng(), castPick = rng.int(0, 2);
    const hourId = vary.hour === 'golden' || vary.hour === 'day' ? 'golden' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'night' ? 'evening'
      : hr < 0.46 ? 'evening' : hr < 0.74 ? 'golden' : 'dawn';
    const hour = HOURS[hourId];
    const colourway = cw < 0.5 ? 0 : cw < 0.75 ? 1 : 2;
    const cast = [[0.6, 0.3, 0.1], [0.3, 0.6, 0.1], [0.4, 0.27, 0.33]][castPick];
    const dens = clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1);
    const pal = PALETTE.slice(); pal[1] = hour.peach; pal[2] = hour.lilac;
    const C = (hex) => new THREE.Color(hex);
    const tis = { white: C(TISSUE.white), lemon: C(pal[4]), orange: C(TISSUE.orange), red: C(pal[3]), blue: C(pal[5]), olive: C(pal[6]) };
    const way = [['white', 'lemon', 'orange', 'red', 'blue', 'olive'], ['red', 'white'], ['lemon', 'blue', 'white']][colourway];
    const GRASS = '#A7CC6B', grass = C(GRASS);                     // the green paper of the ground and the hills: a paper with a body shows its own colour in the hour's warm light

    // ---- the route, laid by geometry before anything is placed ------------------------------------------------
    // The strip, a swing wide to the right, an easing spiral into ONE left-hand circle round the thermal's axis, an
    // easing spiral out of it, and straight down the airship, which is moored on that last tangent. Turning and
    // climb change only gradually: no kink at the circle's foot, none at its top. Heading 0 is +z; +x is our left.
    const AX = 15, AZ = 230, d2r = Math.PI / 180, CR = 30;
    const VEER = 12 * d2r, LC = 22, EASE = 30 * d2r, S_E = 2 * EASE * CR;       // the swing wide: two spirals of 22 m; each easing spiral turns 30 degrees in 31.4 m
    const A_IN = EASE - VEER, HEAD = 300 * d2r, A_OUT = HEAD - EASE;            // the circle proper: from 18 to 270 degrees round the axis; the hull lies across our way in, flank on
    const LEAD = 45, HULL = AIRSHIP.length, Y_IN = 7.5, Y0 = 50, G_C = 0.1485, RISE0 = 36, DS = 0.5;
    const plan = [[AX, Y_IN, 0]], arc = [0], M = {};                            // the line every half metre, its metres, and its marks (metres)
    {
      const veer = (q) => (q < LC ? -VEER * q * q / (2 * LC * LC) : -VEER + VEER * (2 * LC - q) * (2 * LC - q) / (2 * LC * LC));
      const easeIn = (q) => -VEER + EASE * (q / S_E) * (q / S_E), easeOut = (q) => A_OUT + (q - q * q / (2 * S_E)) / CR;
      const walk = (x, z, psi, len, keepIt) => {
        const n = Math.max(1, Math.ceil(len / DS)), ds = len / n;
        for (let i = 0; i < n; i++) { const a = psi((i + 0.5) * ds); x += Math.sin(a) * ds; z += Math.cos(a) * ds; if (keepIt) { plan.push([x, 0, z]); arc.push(arc[arc.length - 1] + ds); } }
        return [x, z];
      };
      const dv = walk(0, 0, veer, 2 * LC), de = walk(0, 0, easeIn, S_E);          // what the swing and the spiral in displace
      const pe = [AX - CR * Math.cos(A_IN) - de[0], AZ + CR * Math.sin(A_IN) - de[1]];   // where the spiral in begins
      const run = (pe[0] - AX - dv[0]) / Math.sin(-VEER), zs = pe[1] - dv[1] - run * Math.cos(VEER);
      const leg = (name, psi, len) => { M[name] = arc[arc.length - 1]; const q = plan[plan.length - 1]; walk(q[0], q[2], psi, len, true); };
      leg('strip', () => 0, zs); leg('veer', veer, 2 * LC); leg('line', () => -VEER, run); leg('easeIn', easeIn, S_E);
      leg('circle', (q) => A_IN + q / CR, (A_OUT - A_IN) * CR); leg('easeOut', easeOut, S_E); leg('lead', () => HEAD, LEAD); leg('stern', () => HEAD, HULL);
    }
    const S_TOT = arc[arc.length - 1];
    // the climb: level for the first RISE0 metres of the strip, then a rise of slope G_R, G_C round the circle (from its foot at Y0), eased to level before the stern
    const G_R = (Y0 - Y_IN - 23 * G_C) / (M.circle - RISE0 - 48);
    const slopeAt = (q) => G_R * smoothstep(RISE0, RISE0 + 50, q) + (G_C - G_R) * smoothstep(M.circle - 46, M.circle, q) - G_C * smoothstep(M.easeOut, M.lead + 30, q);
    for (let i = 1; i < plan.length; i++) plan[i][1] = plan[i - 1][1] + (arc[i] - arc[i - 1]) * slopeAt((arc[i] + arc[i - 1]) / 2);
    const planAt = (q) => {
      let i = Math.min(arc.length - 2, Math.max(0, Math.floor(q / DS))); while (i > 0 && arc[i] > q) i--; while (i < arc.length - 2 && arc[i + 1] < q) i++;
      const f = clamp((q - arc[i]) / (arc[i + 1] - arc[i]), 0, 1), a = plan[i], b = plan[i + 1];
      return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
    };
    const Y1 = planAt(M.easeOut)[1], Y_SHIP = plan[plan.length - 1][1];         // the circle's top, and the height we level at for the hull
    await ctx.yield();
    const NK = Math.round(S_TOT / 10), pts = [];
    for (let k = 0; k <= NK; k++) pts.push(planAt(S_TOT * k / NK));              // even knots about every 10 m
    const path = makePath(pts), L = path.length, mU = 1 / L;                      // mU: one metre of the flown line, as a share of it
    await ctx.yield();
    // A mark's share of the flight is found ON THE FLOWN LINE ITSELF (the plan's metres are level metres and the line climbs,
    // so the flown line is a little longer than the plan's count): qOf holds, for each of NQ even steps of the flown line, the plan's metre nearest it.
    const NQ = Math.ceil(L), qOf = new Float64Array(NQ + 1);
    {
      const p = new THREE.Vector3(); let i = 0;
      for (let j = 1; j < NQ; j++) {
        path.posAtDist(L * j / NQ, p);
        let best = 1e9, bi = i;
        for (let k = i; k < Math.min(plan.length - 1, i + 8); k++) {
          const a = plan[k], b = plan[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
          const f = clamp(((p.x - a[0]) * dx + (p.y - a[1]) * dy + (p.z - a[2]) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
          const e = (a[0] + f * dx - p.x) ** 2 + (a[1] + f * dy - p.y) ** 2 + (a[2] + f * dz - p.z) ** 2;
          if (e < best) { best = e; bi = k; qOf[j] = arc[k] + f * (arc[k + 1] - arc[k]); }
        }
        i = bi;
      }
      qOf[NQ] = S_TOT;
    }
    const uAt = (q) => {                                           // the share of the flight at which the eye is at the plan's metre q
      let lo = 0, hi = NQ; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (qOf[m] <= q) lo = m; else hi = m; }
      return clamp((lo + (q - qOf[lo]) / Math.max(1e-6, qOf[hi] - qOf[lo])) / NQ, 0, 1);
    };
    const qAt = (d) => { const t = clamp(d / L, 0, 1) * NQ, j = Math.min(NQ - 1, Math.floor(t)); return lerp(qOf[j], qOf[j + 1], t - j); };   // the plan's metre at d metres of the flown line
    await ctx.yield();
    const _cp = new THREE.Vector3(), _f = new THREE.Vector3(), _l = new THREE.Vector3(), _up = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _cu = new THREE.Vector3();
    const _m = new THREE.Matrix4(), _lx = new THREE.Vector3(), _ux = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), eye = new THREE.Vector3(), _e2 = new THREE.Vector3(), _w = new THREE.Vector3();
    const uC0 = uAt(M.circle), uC1 = uAt(M.easeOut), uCirc = (f) => lerp(uC0, uC1, f);     // f = share of the circle's own arc
    // the 14 m orange model flies our own course 5.2 m over it, slower than we do (O_K of our speed): it is 5 m ahead of us O_AT
    // of the way round the circle (a share of the circle's own arc) and we are under it 7.7 m further on; O_FROM is the plan's metre at which it sets out
    const O_AT = 0.2, O_K = 0.35, uO = uCirc(O_AT), dO = uO * L, orangeD = (u) => dO + 5 + (u - uO) * L * O_K, O_FROM = qAt(orangeD(0));
    // the share of the flight at which the eye is level with the field's z: found on the flown line, on the way in, where z only grows
    const uAtZ = (z) => { let a = 0, b = uC0; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (path.pointAt(m, _e2).z < z) a = m; else b = m; } return (a + b) / 2; };
    const sternP = new THREE.Vector3(...planAt(M.stern)), nose = new THREE.Vector3(...planAt(S_TOT)), shipDir = new THREE.Vector3(Math.sin(HEAD), 0, Math.cos(HEAD));
    const MAST = [nose.x + shipDir.x * 1.5, nose.z + shipDir.z * 1.5];             // where the mooring mast stands, under the nose ring
    await ctx.yield();

    // ---- the hero: the thermal, the unfinished hill, the airship frame --------------------------------------
    // It is given the flown line (in its own space, a point every metre) so that every model is laid clear of it by place.
    const SUN = [Math.sin(hour.az * d2r) * Math.cos(hour.el * d2r), Math.sin(hour.el * d2r), Math.cos(hour.az * d2r) * Math.cos(hour.el * d2r)];   // the way to the sun
    const line = [];
    { const q = new THREE.Vector3(); for (let d = 0; d <= L; d += 1) { path.posAtDist(d, q); if (Math.hypot(q.x - AX, q.z - AZ) < 90) line.push({ x: AX - q.x, y: q.y, z: AZ - q.z }); } }
    const hero = await buildHero(ctx, { palette: pal, detail, colourway, cast, count: Math.round(lerp(220, 300, dens)), bare: lerp(0.5, 0.22, dens),
      dethermalise: !!vary.rare, dome: false, grass: GRASS, flown: line, sun: [-SUN[0], SUN[1], -SUN[2]], circleRadius: CR, circleY0: Y0, circleY1: Y_SHIP,
      airship: { stern: [AX - sternP.x, sternP.y, AZ - sternP.z], heading: HEAD + Math.PI } });
    const U = hero.style.uniforms, { balsa: balsaMaterial, lining: liningMaterial, tissue: tissueMaterial, mist: mistMaterial, shade: shadeMaterial, dome: domeMaterial, flock: buildFlock } = hero.style;
    hero.object.rotation.y = Math.PI; hero.object.position.set(AX, 0, AZ); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    U.uSunDir.value.set(SUN[0], SUN[1], SUN[2]).normalize();
    U.uHot.value.set(C(hour.hot).r, C(hour.hot).g, C(hour.hot).b); U.uEarth.value.set(C(hour.earth).r, C(hour.earth).g, C(hour.earth).b);
    await ctx.yield();
    // marks of the place found on the route: the foot of the hero's hill on the way in
    let zFoot = AZ - 60; for (let i = 0; i < plan.length && arc[i] < M.circle; i++) if (hero.heightAt(AX - plan[i][0], AZ - plan[i][2]) > 1) { zFoot = plan[i][2]; break; }
    // the winding stooges of the strip: [x, z, height]; the strip's things are named by where they stand along it
    // (all seven on our right; the lemon's launch stand, on our left, is stood where the lemon's way begins)
    const STOOGES = [[6, 18, 7.2], [5.4, 31, 8.8], [6.4, 50, 8.2], [-2, 22, 6.5], [-9, 41, 7], [-4, 60, 5.6], [-16, 12, 6]];
    const Z_S0 = 12, Z_S2 = 31, Z_S3 = 50, Z_SL = 60;              // the eye comes level with the stooge at z 12 (the first along the strip), the one at z 31, the one at z 50, the last
    // THE LEMON'S WAY, worked from where the eye is on the route and written down before anything is stood or laid near the
    // strip. It waits on its launch stand D_REST metres along the strip, 9.5 m to our left, until the eye is E_GO metres in
    // (so it rests there while this world is seen through a portal); it leaves the stand as we come, gathering way (its lead
    // on the eye shrinks from D_REST - E_GO to 9 m, smoothly, by where the eye is) until it flies 9 m ahead of the eye where
    // the eye is level with the stooge at z 31; from there to the stooge at z 50 it draws 7 m further ahead while it crosses our
    // nose from 9.5 m on the left to 12 m on the right (the crossing begins when it is 6 m clear of its stand); then it glides from G0 down to
    // LAND: the glide begins at the station's own speed and climb and ends at rest on the field (a cubic in the eye's way: nothing steps).
    const LEMON_OVER = 4.4, LAND = new THREE.Vector3(3, 1.42, 106), Z_LAND = LAND.z - 8;     // it touches down as the eye comes within 8 m of the spot
    const E_GO = 3, D_REST = 24;
    const leadOf = (e) => {                                       // metres the lemon is ahead of the eye: a cubic from rest (slope -1: the lemon still) to 9 m (slope 0: at our speed)
      if (e <= E_GO) return D_REST - e; if (e >= Z_S2) return 9;
      const sp = Z_S2 - E_GO, f = (e - E_GO) / sp, f2 = f * f, f3 = f2 * f;
      return (2 * f3 - 3 * f2 + 1) * (D_REST - E_GO) - (f3 - 2 * f2 + f) * sp + (3 * f2 - 2 * f3) * 9;
    };
    // the eye's z at which the lemon is 6 m past its stand, its tail clear of the cradle's bar: until then it flies straight off the stand, all but level (it rises 0.3 m)
    let E_OFF = E_GO; while (E_OFF + leadOf(E_OFF) < D_REST + 6 && E_OFF < Z_S2) E_OFF += 0.05;
    const station = (u, e, out) => {                              // the lemon's station: ahead of the eye on the route, off to one side, a little over it
      const d = Math.max(D_REST, u * L + leadOf(e) + 7 * smoothstep(Z_S2, Z_S3, e)), lat = lerp(9.5, -12, smoothstep(E_OFF, Z_S3, e));
      path.posAtDist(d, out); path.tangentAtDist(d, _a); _b.crossVectors(UP, _a).normalize();
      // by place: within its own reach of the flown line it rides LEMON_OVER above that line, so 2 m of clear air stays under its low wingtip as it crosses
      const over = Math.max(1.6 + 0.9 * smoothstep(Z_S0, Z_S2, e), LEMON_OVER * (1 - smoothstep(6.5, 10, Math.abs(lat))));
      return out.addScaledVector(_b, lat).setY(out.y + over);
    };
    const REST = station(0, 0, new THREE.Vector3()), REST_DIR = path.startTangent.clone();
    const G0 = station(uAtZ(Z_S3), Z_S3, new THREE.Vector3()), LAND_DIR = new THREE.Vector3(LAND.x - G0.x, 0, LAND.z - G0.z).normalize();
    // the station's way where the glide begins, for each unit of the glide's own measure (the eye's way from the stooge at z 50 to the landing mark)
    const G_V = station(uAtZ(Z_S3 - 0.5), Z_S3 - 0.5, new THREE.Vector3()).sub(G0).multiplyScalar(-2 * (Z_LAND - Z_S3));
    const G_M = clamp((G_V.x * LAND_DIR.x + G_V.z * LAND_DIR.z) / Math.hypot(LAND.x - G0.x, LAND.z - G0.z), 0, 2.5), G_VY = G_V.y;
    const lemonAt = (u, out) => {                                 // on its stand, off the left wingtip, across our nose, then the glide from G0 down to LAND
      path.pointAt(u, _e2); const e = _e2.z;
      if (e < Z_S3) return station(u, e, out);
      const t = clamp((e - Z_S3) / (Z_LAND - Z_S3), 0, 1), h10 = t * (1 - t) * (1 - t), h01 = t * t * (3 - 2 * t), sg = G_M * h10 + h01;
      return out.set(lerp(G0.x, LAND.x, sg), G0.y + G_VY * h10 + (LAND.y - G0.y) * h01, lerp(G0.z, LAND.z, sg));
    };
    // its whole way, a point for every half metre of the eye's, and the test every upright thing and every model's ring near
    // the strip is laid by: 1 m of clear air between the lemon as a ball (LEMON_BALL 4.8 m: its furthest point is 4.45 m from
    // its centre) and the thing (a place x, z between heights y0 and y1, with its own reach)
    const LEMON_BALL = 0.6 * 8, lemonWay = [], lemonBox = [1e9, -1e9, 1e9, -1e9];
    {
      const p = new THREE.Vector3(), dEnd = uAtZ(Z_LAND + 1) * L;
      for (let d = 0; d <= dEnd + 0.5; d += 0.5) { lemonAt(d / L, p); lemonWay.push([p.x, p.y, p.z]); lemonBox[0] = Math.min(lemonBox[0], p.x); lemonBox[1] = Math.max(lemonBox[1], p.x); lemonBox[2] = Math.min(lemonBox[2], p.z); lemonBox[3] = Math.max(lemonBox[3], p.z); }
    }
    const lemonClear = (x, y0, y1, z, reach) => {
      const need = LEMON_BALL + reach + 1;
      if (x < lemonBox[0] - need || x > lemonBox[1] + need || z < lemonBox[2] - need || z > lemonBox[3] + need) return true;
      return lemonWay.every(([lx, ly, lz]) => { const dx = lx - x, dz = lz - z, dy = Math.max(0, y0 - ly, ly - y1); return dx * dx + dz * dz + dy * dy >= need * need; });
    };
    // THE ORANGE'S WAY, written down as the lemon's is: its whole course, a point for every half metre from where it sets out
    // to where it is at the flight's end, 5.2 m over the flown line. A model's ring is laid clear of it by place: outside its
    // reach in plan (the orange as a ball of 10.2 m, its 2.5 m of weave, the model's own reach and 1 m), else 3.5 m and more
    // under its course or 6.5 m and more over it (its wheels hang 2.5 m under its course; banked, its high wingtip stands 5.5 m over)
    const ORANGE_BALL = 0.73 * 14 + 2.5, orangeWay = [], orangeBox = [1e9, -1e9, 1e9, -1e9];
    {
      const p = new THREE.Vector3();
      for (let d = orangeD(0); d <= orangeD(1) + 0.5; d += 0.5) { path.posAtDist(Math.min(d, L), p); orangeWay.push([p.x, p.y + 5.2, p.z]); orangeBox[0] = Math.min(orangeBox[0], p.x); orangeBox[1] = Math.max(orangeBox[1], p.x); orangeBox[2] = Math.min(orangeBox[2], p.z); orangeBox[3] = Math.max(orangeBox[3], p.z); }
    }
    const orangeClear = (x, y0, y1, z, reach) => {
      const need = ORANGE_BALL + reach + 1;
      if (x < orangeBox[0] - need || x > orangeBox[1] + need || z < orangeBox[2] - need || z > orangeBox[3] + need) return true;
      return orangeWay.every(([ox, oy, oz]) => y1 <= oy - 3.5 || y0 >= oy + 6.5 || (ox - x) * (ox - x) + (oz - z) * (oz - z) >= need * need);
    };
    await ctx.yield();

    // ---- the dome: a whole sphere, peach to lilac, the evening's cloud painted on it (it carries no line) -----
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), domeMaterial());
    dome.frustumCulled = false; dome.renderOrder = -1; scene.add(dome);

    // ---- the field: a wing laid on the ground (cross ribs every 6 m, four spars, stringers every 8 m) --------
    const GS = new Sticks(), SF = new Skins(false), SA = new Skins(false);     // ground sticks, field skin (8 x 6 m bays), apron skin (16 m bays)
    const FX0 = -65, FX1 = 95, FZ0 = -70, FZ1 = 332, RIV = 130, RIVW = 7;
    const inRiver = (z) => Math.abs(z - RIV) < RIVW + 0.5;
    const jig = (a, b, k) => 0.16 * Math.sin(a * 12.9 + b * 78.2 + k * 37.7);
    const lemonMix = grass.clone().lerp(tis.lemon, 0.6), fieldDark = grass.clone().multiplyScalar(0.72), lemonB = tis.lemon.clone().lerp(grass, 0.2), mown = grass.clone().lerp(tis.lemon, 0.3);
    const NFX = 20, NFZ = 67;
    for (let j = 0; j <= NFZ; j++) {                              // cross ribs
      const z = FZ0 + j * 6; if (inRiver(z)) continue;
      for (let i = 0; i < NFX; i += 2) GS.stick([FX0 + i * 8, -0.14, z + jig(i, j, 1)], [FX0 + (i + 2) * 8, -0.14, z + jig(i + 2, j, 1)], j % 5 === 0 ? 0.2 : 0.13, 0, [0, 0, 1]);
    }
    await ctx.yield();
    for (let i = 0; i <= NFX; i++) {                              // spars (every fifth line) and stringers
      const x = FX0 + i * 8, spar = i % 5 === 0 && i !== 10;      // (no spar under the middle of the flight strip: a stringer there)
      for (let j = 0; j < NFZ; j += 4) {
        const z0 = FZ0 + j * 6, z1 = Math.min(FZ1, z0 + 24);
        if (z0 < RIV && z1 > RIV) { GS.stick([x, -0.2, z0], [x, -0.2, RIV - RIVW], spar ? 0.34 : 0.1, spar ? 0 : 1, [1, 0, 0]); GS.stick([x, -0.2, RIV + RIVW], [x, -0.2, z1], spar ? 0.34 : 0.1, spar ? 0 : 1, [1, 0, 0]); }
        else GS.stick([x + jig(i, j, 3), -0.2, z0], [x + jig(i, j + 4, 3), -0.2, z1], spar ? 0.34 : 0.1, spar ? 0 : 1, [1, 0, 0]);
      }
    }
    await ctx.yield();
    const patch = (x, z) => noise.fbm2(x * 0.012 + 3.3, z * 0.012 - 7.1, 2);
    for (let j = 0; j < NFZ; j++) {
      const z0 = FZ0 + j * 6, z1 = z0 + 6; if (inRiver(z0 + 3)) continue;
      for (let i = 0; i < NFX; i++) {
        const x0 = FX0 + i * 8, x1 = x0 + 8, xm = x0 + 4, zm = z0 + 3;
        const strip = Math.abs(xm - 15) < 8 && zm < 118;                                   // the flight strip: one bay of 16 m across (no rib down its middle): a lemon middle of 8 m, two lemons by turns along it, between two mown flanks
        if (strip && xm > 15) continue;
        const pn = patch(xm, zm), col = strip ? (j % 2 ? tis.lemon : lemonB) : pn > 0.28 ? lemonMix : grass;
        const edge = i === 0 || i === NFX - 1 || j === 0 || j === NFZ - 1;
        const sl = edge ? 0.7 : 0.45 * smoothstep(0.6, 0.95, Math.abs(Math.sin(i * 3.3 + j * 5.1)));
        if (strip) {
          SF.quad([x0 + 16, 0, z0], [x0 + 12, 0, z0], [x0 + 12, 0, z1], [x0 + 16, 0, z1], [i, j, i + 0.25, j + 1], mown, { slack: 0 });
          SF.quad([x0 + 12, 0, z0], [x0 + 4, 0, z0], [x0 + 4, 0, z1], [x0 + 12, 0, z1], [i + 0.25, j, i + 0.75, j + 1], col, { slack: 0 });
          SF.quad([x0 + 4, 0, z0], [x0, 0, z0], [x0, 0, z1], [x0 + 4, 0, z1], [i + 0.75, j, i + 1, j + 1], mown, { slack: 0 });
        }
        else SF.quad([x1, 0, z0], [x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [i, j, i + 1, j + 1], col, { slack: [0, 0, sl, edge ? sl : 0] });
      }
      if (j % 3 === 2) await ctx.yield();
    }
    // the apron: more panels, 16 m bays, out to the first range; every bay a breath off its neighbour
    const APR = 540, ACX = 15, ACZ = 180, AB = 16;
    const inField = (x, z) => x > FX0 - 0.1 && x < FX1 + 0.1 && z > FZ0 - 0.1 && z < FZ1 + 0.1;
    const NA = Math.ceil(APR / AB);
    const ax0 = FX0 - 34 * AB, az0 = FZ0 - 26 * AB;               // the apron grid is laid from the field's own corner
    for (let j = 0; j < 2 * NA + 8; j++) {
      const z0 = az0 + j * AB, zm = z0 + AB / 2;
      for (let i = 0; i < 2 * NA + 8; i++) {
        const x0 = ax0 + i * AB, xm = x0 + AB / 2;
        if (Math.hypot(xm - ACX, zm - ACZ) > APR || inField(xm, zm) || inRiver(zm)) continue;
        const pn = patch(xm, zm) + 0.25 * Math.sin(i * 7.7 + j * 3.1);
        const col = pn > 0.42 ? lemonMix : pn > 0.1 ? grass : pn > -0.2 ? fieldDark : lemonMix.clone().lerp(grass, 0.5);   // a patchwork of fields
        SA.quad([x0 + AB, -0.05, z0], [x0, -0.05, z0], [x0, -0.05, z0 + AB], [x0 + AB, -0.05, z0 + AB], [i, j, i + 1, j + 1], col, { slack: 0.35 * smoothstep(0.7, 1, Math.abs(Math.sin(i * 5.3 + j * 2.9))) });
      }
      await ctx.yield();
    }
    for (let k = 0; k < 2 * NA + 9; k++) {                        // its lattice: long strips both ways, cut where the field and river are
      for (let s = 0; s < 2 * NA + 8; s += 2) {
        for (const dir of [0, 1]) {
          const a = dir ? [ax0 + k * AB, -0.3, az0 + s * AB] : [ax0 + s * AB, -0.3, az0 + k * AB];
          const b = dir ? [a[0], -0.3, a[2] + 2 * AB] : [a[0] + 2 * AB, -0.3, a[2]];
          const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
          if (Math.hypot(mx - ACX, mz - ACZ) > APR || (inField(mx, mz) && inField(a[0], a[2]) && inField(b[0], b[2]))) continue;
          if (dir === 1 && a[2] < RIV + RIVW && b[2] > RIV - RIVW) continue;
          if (dir === 0 && inRiver(a[2])) continue;
          GS.stick(a, b, dir ? 0.2 : 0.14, dir ? 0 : 1, dir ? [1, 0, 0] : [0, 0, 1]);
        }
      }
      await ctx.yield();
    }

    // ---- the river: slack blue tissue 14 m wide over its own ribs (the paper has a body and hides them; its bank sticks are seen)
    const RS = new Skins(false);
    for (let i = -56; i < 60; i++) {
      const x0 = i * 6, x1 = x0 + 6;
      for (let q = 0; q < 2; q++) {
        const z0 = RIV - RIVW + q * RIVW, z1 = z0 + RIVW, mid = q === 0 ? 1 : 0;
        const sw = (x, on) => [0, on * 0.22, 0, x * 0.55];
        RS.quad([x1, -0.3, z0], [x0, -0.3, z0], [x0, -0.3, z1], [x1, -0.3, z1], [i, q, i + 1, q + 1], tis.blue,
          { slack: 0.55, sway: [sw(x1, 1 - mid), sw(x0, 1 - mid), sw(x0, mid), sw(x1, mid)] });
      }
      for (const dx of [0, 3]) GS.stick([x0 + dx, -1.5, RIV - RIVW], [x0 + dx + jig(i, dx, 5), -1.5, RIV + RIVW], dx ? 0.09 : 0.16, 0, [1, 0, 0]);
      for (const sz of [-1, 1]) GS.stick([x0, -0.1, RIV + sz * RIVW], [x1, -0.1, RIV + sz * RIVW], 0.28, 0, [0, 0, 1]);
      GS.stick([x0, -1.5, RIV], [x1, -1.5, RIV], 0.2, 0, [0, 0, 1]);
      if (i % 20 === 0) await ctx.yield();
    }
    await ctx.yield();

    // ---- the hills: hollow shells of formers and stringers under olive tissue ---------------------------------
    // shell(): one hill. Formers (a top chord across x every `bay` metres of z) and stringers along z, lying on the
    // hill's LINING: an opaque paper sheet LINE_UNDER below them, shaded once by its slope to the sun (see the part), so
    // that a hill is a solid thing, its ribs lie on it and nothing behind it is seen through it. near: crossed chords.
    const HS = new Sticks(), HB = new Sticks(), SH4 = new Skins(false), SH8 = new Skins(false), SR1 = new Skins(false);
    const hills = [];
    async function shell(o, F, S, front) {
      const { cx, cz, rx, rz, H, bay, near } = o, NX = Math.ceil(rx / bay) + 1, NZ = Math.ceil(rz / bay) + 1;
      const sh = o.sh, sx = o.sx, sz = o.sz;
      const heightAt = (x, z) => {
        const r = Math.hypot((x - cx) / rx, (z - cz) / rz); if (r >= 1) return 0;
        const b = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * r), 0.8);
        const sec = sh * Math.exp(-(((x - cx - sx) / (rx * 0.4)) ** 2) - (((z - cz - sz) / (rz * 0.4)) ** 2));
        let h = H * Math.min(1, b + sec * (1 - b) * 1.2) + noise.fbm2(x * 0.03 + cx, z * 0.03 - cz, 3) * 3 * Math.min(1, b * 3);
        if (o.carve) { const n = path.nearestXZ(x, z); if (n.dist < 22) h = Math.min(h, lerp(n.y - 10, h, smoothstep(12, 22, n.dist))); }
        return Math.max(0, h);
      };
      o.heightAt = heightAt;
      const W1 = 2 * NX + 1, hg = new Float32Array(W1 * (2 * NZ + 1));
      for (let j = -NZ; j <= NZ; j++) { for (let i = -NX; i <= NX; i++) hg[(j + NZ) * W1 + i + NX] = heightAt(cx + i * bay, cz + j * bay); if ((j + NZ) % 2 === 1) await ctx.yield(); }
      const P = (i, j) => {
        let x = cx + i * bay + jig(i, j, 1) * bay * 0.3, z = cz + j * bay + jig(i, j, 2) * bay * 0.3;
        const r = Math.hypot((x - cx) / rx, (z - cz) / rz);
        if (r > 0.985) return [cx + (x - cx) / r * 0.985, 0.02, cz + (z - cz) / r * 0.985];
        return [x, Math.max(0.02, Math.abs(i) > NX || Math.abs(j) > NZ ? 0 : hg[(j + NZ) * W1 + i + NX]), z];
      };
      const inside = (i, j) => Math.hypot(i * bay / rx, j * bay / rz) < 0.985;
      const hAt = (i, j) => (Math.abs(i) > NX || Math.abs(j) > NZ ? 0 : hg[(j + NZ) * W1 + i + NX]);
      const hw = bay / 4;
      for (let j = -NZ; j <= NZ; j++) {
        for (let i = -NX; i < NX; i++) {
          if (!inside(i, j) && !inside(i + 1, j)) continue;
          const a = P(i, j), b = P(i + 1, j);
          if (near) F.stick2(a, b, 0.12 * hw, 0); else F.stick(a, b, 0.13 * hw, 0, [0, 1, 0]);
        }
        await ctx.yield();
      }
      for (let i = -NX; i <= NX; i++) {
        for (let j = -NZ; j < NZ; j++) {
          if (!inside(i, j) && !inside(i, j + 1)) continue;
          const a = P(i, j), b = P(i, j + 1);
          F.stick(a, b, 0.09 * hw, 1, [1, 0, 0]);
        }
        await ctx.yield();
      }
      for (let j = -NZ; j < NZ; j++) {
        for (let i = -NX; i < NX; i++) {
          if (!inside(i, j) && !inside(i + 1, j) && !inside(i + 1, j + 1) && !inside(i, j + 1)) continue;
          const p00 = P(i, j), p10 = P(i + 1, j), p11 = P(i + 1, j + 1), p01 = P(i, j + 1);
          const shd = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => liningShade((hAt(a + 1, b) - hAt(a - 1, b)) / (2 * bay), (hAt(a, b + 1) - hAt(a, b - 1)) / (2 * bay), SUN));
          if (Math.max(p00[1], p10[1], p11[1], p01[1]) > 0.3) HB.plate([p00, p10, p11, p01].map((q) => [q[0], Math.max(0.02, q[1] - LINE_UNDER), q[2]]), shd.map((q) => 4 + q));
          const xm = (p00[0] + p11[0]) / 2, zm = (p00[2] + p11[2]) / 2, pn = patch(xm * 1.7, zm * 1.7);
          const col = pn > 0.45 ? lemonMix : pn < -0.45 ? o.dark : grass;
          const sl = 0.5 * smoothstep(0.55, 0.95, Math.abs(Math.sin(i * 3.3 + j * 5.1)));
          const cols = shd.map((q) => shadeTint(col, q));                                 // the paper's colour in the hour's light, by its slope to the sun
          if (front) S.quad(p00, p10, p11, p01, [i, j, i + 1, j + 1], col, { slack: [0, 0, sl, 0], front: [front(p00), front(p10), front(p11), front(p01)], sag: [0, -0.55, 0], cols });
          else S.quad(p00, p10, p11, p01, [i, j, i + 1, j + 1], col, { slack: [0, 0, sl, 0], cols });
        }
        await ctx.yield();
      }
    }
    const hrng = rng.fork('hills');
    const HILLS = [   // cx, cz, rx, rz, H, bay
      [-80, 52, 54, 78, 36, 4], [118, 30, 62, 85, 46, 4], [-100, 218, 56, 62, 52, 4], [135, 205, 60, 70, 60, 4], [60, 432, 95, 70, 82, 8],
      [-190, 120, 80, 100, 70, 8], [230, 110, 90, 110, 85, 8], [-245, 330, 90, 90, 64, 8], [215, 335, 100, 90, 90, 8], [-60, -160, 110, 70, 60, 8], [150, -150, 100, 80, 75, 8], [140, 570, 120, 80, 95, 8],
    ];
    const darkOlive = grass.clone().multiplyScalar(0.8);
    for (let k = 0; k < HILLS.length; k++) {
      const h = HILLS[k], o = { cx: h[0] + (k ? hrng.range(-8, 8) : 0), cz: h[1] + (k ? hrng.range(-8, 8) : 0), rx: h[2], rz: h[3], H: h[4] * hrng.range(0.86, 1.14), bay: h[5], near: h[5] === 4,
        sh: hrng.range(0.2, 0.5), sx: hrng.range(-0.3, 0.3) * h[2], sz: hrng.range(-0.3, 0.3) * h[3], carve: k < 5, dark: darkOlive };
      // a far hill is stood clear of the mooring mast's feet, by place: moved straight away from the mast until its foot is 13 m and more from it
      if (k >= 5) for (let n = 0; n < 40 && Math.hypot((MAST[0] - o.cx) / (o.rx + 13), (MAST[1] - o.cz) / (o.rz + 13)) < 1; n++) { const dx = o.cx - MAST[0], dz = o.cz - MAST[1], dl = Math.hypot(dx, dz) || 1; o.cx += 4 * dx / dl; o.cz += 4 * dz / dl; }
      hills.push(o);
      await shell(o, HS, k === 0 ? SR1 : h[5] === 8 ? SH8 : SH4, k === 0 ? (p) => p[2] + 0.35 * p[0] : null);
    }
    await ctx.yield();
    const addMesh = (geo, mat, order = 0, cull = true) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.frustumCulled = cull; scene.add(m); return m; };
    addMesh(await GS.geometryAsync(ctx), balsaMaterial({ minPx: 1.2 }));
    // every paper laid under the sky has a BODY and takes the hour's light from above; the ground's are drawn before whatever stands on them
    addMesh(await SF.geometryAsync(ctx), tissueMaterial({ bay: [8, 6], lift: 0.25, body: BODY, lit: 1, deepen: 0.15, rib: 0.3, marks: 0.35 }), 0.8);
    addMesh(await SA.geometryAsync(ctx), tissueMaterial({ bay: [16, 16], lift: 0.5, far: 0.6, body: BODY, lit: 1, deepen: 0.15, rib: 0.3, marks: 0.35 }), 0.8);
    addMesh(RS.geometry(THREE.BufferGeometry, false, true), tissueMaterial({ bay: [6, 7], sway: 1.1, body: BODY, lit: 1 }), 0.8);
    await ctx.yield();
    addMesh(await HB.geometryAsync(ctx), liningMaterial());
    addMesh(await HS.geometryAsync(ctx), balsaMaterial({ minPx: 1.2, soft: true }));   // a hill's sticks lie on its lining and thin away over it with distance
    addMesh(await SH4.geometryAsync(ctx), tissueMaterial({ bay: [4, 4], lift: 0.5, far: 0.5, body: BODY, lit: 1, rib: 0.18, marks: 0.2, form: FORM }), 0.9);
    addMesh(await SH8.geometryAsync(ctx), tissueMaterial({ bay: [8, 8], lift: 1, far: 0.5, body: BODY, lit: 1, rib: 0.18, marks: 0.2, form: FORM }), 0.9);
    // the first hillside: slack and creased until the mist, going before the visitor, walks across it and pulls it drum-tight
    const r1Front = new THREE.Vector4(-1e3, 1e6, 3, 1), r1Mist = new THREE.Vector4(-1e3, 9, 0, 0), R1 = hills[0];
    addMesh(await SR1.geometryAsync(ctx, true), tissueMaterial({ front: true, frontUniform: r1Front, bay: [4, 4], lift: 0.5, far: 0.5, body: BODY, lit: 1, rib: 0.18, marks: 0.2, form: FORM }), 0.9);
    const r1F0 = 20, r1F1 = R1.cz + R1.rz + 0.35 * (R1.cx + R1.rx) + 12;   // front coordinate z + 0.35 x: from the slope ahead of the entry to past the hillside's far end
    {
      const NM = Math.round(2200 * detail * Math.min(1.4, hour.mist)), mPos = new Float32Array(NM * 3), mSeed = new Float32Array(NM * 4), mr = rng.fork('mist1');
      for (let i = 0; i < NM; i++) {
        const a = mr() * 6.2832, rr = Math.sqrt(mr()) * 0.92, x = R1.cx + Math.cos(a) * rr * R1.rx, z = R1.cz + Math.sin(a) * rr * R1.rz;
        mPos.set([x, R1.heightAt(x, z) + 0.6, z], i * 3);
        mSeed.set([mr.range(2.2, 5), mr(), mr.range(0.3, 2.6), z + 0.35 * x + mr.range(-1.5, 1.5)], i * 4);
        if (i % 200 === 199) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(mPos, 3)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(mSeed, 4));
      g.instanceCount = NM; addMesh(g, mistMaterial({ mistUniform: r1Mist, strength: 0.4 }), 3, false);
    }
    await ctx.yield();

    // ---- grass: tissue slivers glued by the foot to the field's ribs, leaning and twisting though there is no wind
    let grassB = null;                                             // the blades as built: { g, root, lean, gcol, n } (those inside a tent are taken out where the tents are stood)
    {
      const NG = Math.round(46000 * detail * lerp(0.85, 1.1, dens)), gr = rng.fork('grass');
      const root = new Float32Array(NG * 4), lean = new Float32Array(NG * 4), gcol = new Float32Array(NG * 3);
      const gc = [grass.clone().multiplyScalar(0.78), grass, grass.clone().multiplyScalar(0.9), lemonMix];
      let n = 0;
      for (let i = 0; i < NG * 3 && n < NG; i++) {
        const verge = gr() < 0.5, mode = gr(), bank = gr() < 0.3, side = gr() < 0.5 ? -1 : 1, off = Math.abs(gr.gauss());
        let x, z;
        if (verge && bank) { x = gr.range(FX0, FX1); z = RIV + side * (RIVW + 0.6 + off * 6); }           // the river's two banks
        else if (verge) { x = 15 + side * (8 + off * 9); z = gr.range(-30, 118); }                           // the two verges of the lemon strip
        else { x = gr.range(FX0, FX1); z = gr.range(FZ0, FZ1); }
        if (mode < 0.5) z = FZ0 + Math.round((z - FZ0) / 6) * 6 + gr.range(-0.9, 0.9);              // on a rib
        else if (mode < 0.8) x = FX0 + Math.round((x - FX0) / 8) * 8 + gr.range(-1.3, 1.3);         // on a spar or stringer
        if (x < FX0 || x > FX1 || z < FZ0 || z > FZ1 || inRiver(z) || (Math.abs(x - 15) < 8.6 && z < 118.6) || hero.heightAt(15 - x, 230 - z) > 0.25 || hills.some((o) => o.heightAt(x, z) > 0.25)) continue;   // no blade is rooted under a hill
        const tall = verge ? Math.min(1.9, gr.range(0.7, 1.5) + (gr() < 0.12 ? gr.range(0.2, 0.6) : 0)) : gr.range(0.5, 1.4);
        const la = gr() * 6.2832, lm = gr.range(0.15, 0.6);
        root.set([x, 0.02, z, tall], n * 4); lean.set([Math.cos(la) * lm, Math.sin(la) * lm, gr(), gr.range(0.16, 0.34) * (0.6 + 0.4 * tall)], n * 4);
        const c = gc[Math.floor(gr() * 4)]; gcol.set([c.r, c.g, c.b], n * 3); n++;
        if (i % 200 === 199) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aBay', new THREE.Float32BufferAttribute([0.2, 0.1, 0.8, 0.1, 0.8, 0.9, 0.2, 0.9], 2)); g.setAttribute('aSlack', new THREE.Float32BufferAttribute([0, 0, 0.4, 0.4], 1));
      g.setAttribute('aRoot', new THREE.InstancedBufferAttribute(root, 4)); g.setAttribute('aLean', new THREE.InstancedBufferAttribute(lean, 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(gcol, 3));
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(15, 0, 130), 260); grassB = { g, root, lean, gcol, n };
      addMesh(g, tissueMaterial({ blade: 0.8, bay: [0.3, 1], body: BODY, lit: 1 }), 1);
    }
    await ctx.yield();

    // ---- poplars: olive tissue wrapped round stacks of ring formers on a balsa spine, breathing between rings --
    const standing = [];                                           // every upright thing of the field: [x, z, radius, height]
    const shady = [];                                               // those of them that stand on the level ground and throw a long shadow: [x, z, half width, height]
    // level ground under a thing's whole foot: no hill stands over 0.3 m at its middle or at twenty-four points of a ring half a
    // metre outside its rim (a hill's foot can end in a step, so the ring is laid outside the thing and tested closely)
    const onHills = (x, z, r) => {
      for (let k = -1; k < 24; k++) {
        const px = k < 0 ? x : x + (r + 0.5) * Math.cos(k * 0.2618), pz = k < 0 ? z : z + (r + 0.5) * Math.sin(k * 0.2618);
        if (hero.heightAt(15 - px, 230 - pz) > 0.3 || hills.some((o) => o.heightAt(px, pz) > 0.3)) return true;
      }
      return false;
    };
    // the strip's own uprights are written into the list first, so that every tree and tent stood below keeps off them: the seven
    // winding stooges, each moved straight out from the strip, a metre at a time, until 1 m of air lies between the lemon's ball
    // and the stooge (its legs and cradle within 2.8 m of its post, its prongs 2.2 m over its head); the lemon's launch stand;
    // the mooring mast. Their sticks are built further down, where they stand here.
    const stoogeAt = STOOGES.map(([x, z, h]) => {
      for (let n = 0; n < 40 && !lemonClear(x, 0, h * 1.06 + 2.2, z, 2.8); n++) x += x < AX ? -1 : 1;
      standing.push([x, z, h * 0.32 + 2.3, h * 1.06 + 2.3]);
      return [x, z, h];
    });
    standing.push([REST.x, REST.z, 4.6, REST.y + 1], [MAST[0], MAST[1], 10.6, nose.y]);
    {
      const PS = new Sticks(), PK = new Skins(false), pr = rng.fork('poplars'), SIDES = 7, spots = [], poplarGreen = grass.clone().multiplyScalar(0.62);
      for (let k = 0; k < 34; k++) { const x = -250 + k * 15.5 + pr.range(-3, 3); spots.push([x, RIV + (k % 2 ? 1 : -1) * (RIVW + 5 + pr.range(0, 3))]); }
      for (let k = 0; k < 14; k++) spots.push([FX0 - 4 + pr.range(-2, 2), -40 + k * 17 + pr.range(-3, 3)]);
      for (let k = 0; k < 12; k++) spots.push([38 + pr.range(-4, 22), 20 + k * 8 + pr.range(-3, 3)]);
      for (let k = 0; k < 10; k++) spots.push([-8 - pr.range(0, 10), 66 + k * 9 + pr.range(-2, 2)]);        // passing under the wing in the rise
      let made = 0;
      for (let [x, z] of spots) {
        // a spot where a hill stands under the crown (at its middle or its rim) is moved toward the strip, 4 m at a time, until
        // it stands on level ground (else no poplar)
        let Ht = pr.range(12, 20); const Rm = pr.range(1.7, 2.6), ph = pr() * 6.28;
        const onHill = (px) => onHills(px, z, Rm);
        for (let n = 0; n < 12 && onHill(x); n++) x += x < AX ? 4 : -4;
        const nn = path.nearestXZ(x, z);
        if (nn.dist < 13) Ht = Math.min(Ht, nn.y - 7.5);
        if (Ht < 6 || onHill(x) || Math.abs(z - RIV) < RIVW + Rm + 1 || Math.hypot(x - REST.x, z - REST.z) < 24 + Rm || !lemonClear(x, 0, Ht + 0.8, z, Rm + 0.4) || !standing.every(([sx, sz, rad]) => Math.hypot(sx - x, sz - z) > rad + Rm + 1.4)) continue;   // nor in the river (its crown a metre and more clear of the water), nor within 24 m of the lemon's launch stand (its apron is kept clear), nor in the lemon's way, nor against a stooge, the mast or another poplar
        standing.push([x, z, Rm + 0.4, Ht + 0.8]); shady.push([x, z, Rm, Ht]);
        const NR = Math.max(4, Math.round(Ht / 2.1)), rad = (t) => Rm * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.62))), 0.75) * (1 - 0.25 * t) + 0.08;
        const ring = (k, f = 0) => { const t = (k + f) / NR, y = 1.6 + (Ht - 1.6) * t, r = rad(Math.min(1, t * 0.97 + 0.015)), o = []; for (let s = 0; s <= SIDES; s++) { const a = (s % SIDES) / SIDES * 6.2832 + ph + k * 0.2; o.push([x + r * Math.cos(a), y, z + r * Math.sin(a), Math.cos(a), Math.sin(a)]); } return o; };
        PS.stick2([x, 0, z], [x + 0.2 * Math.sin(ph), Ht + 0.6, z], 0.13, 0);
        for (let k = 0; k <= NR; k++) {
          const r0 = ring(k);
          for (let s = 0; s < SIDES; s++) { PS.stick(r0[s], r0[s + 1], 0.09, k % 2 ? 1 : 0, [r0[s][3], 0, r0[s][4]]); if (s % 2 === 0) PS.stick([x, r0[s][1], z], r0[s], 0.05, 1, [0, 1, 0]); }
          if (k === NR) break;
          const rm = ring(k, 0.5), r1 = ring(k + 1), col = (k + made) % 5 === 0 ? grass : poplarGreen;
          for (let s = 0; s < SIDES; s++) {
            const sw = (q) => [q[3] * 0.2, 0, q[4] * 0.2, ph + k * 1.3], z4 = [0, 0, 0, 0];
            PK.quad(r0[s], r0[s + 1], rm[s + 1], rm[s], [s, k, s + 1, k + 0.5], col, { sway: [z4, z4, sw(rm[s + 1]), sw(rm[s])] });
            PK.quad(rm[s], rm[s + 1], r1[s + 1], r1[s], [s, k + 0.5, s + 1, k + 1], col, { sway: [sw(rm[s]), sw(rm[s + 1]), z4, z4], slack: k === NR - 1 ? 0.5 : 0 });
          }
        }
        if (++made % 2 === 0) await ctx.yield();
      }
      // the firs of the five nearer hills: three tiers of green paper on a balsa trunk, each tier a cone of six sides.
      // Each is stood by place: on its own hill's skin where no other hill lies over it; where the route or the hull passes within
      // 18 m its top is 17 m and more under the line; within 72 m of the thermal's axis its top is under 25 m (the column's
      // lowest reach); clear of the lemon's whole way and of every upright thing stood before it
      const fr = rng.fork('firs'), firs = [poplarGreen, poplarGreen, grass.clone().multiplyScalar(0.8), grass.clone().lerp(tis.blue, 0.25).multiplyScalar(0.6)];
      let firN = 0;
      for (let k = 0; k < 5; k++) {
        const o = hills[k];
        for (let i = 0; i < 44; i++) {
          const a = fr() * 6.2832, rr = Math.sqrt(fr.range(0.03, 0.78)), x = o.cx + Math.cos(a) * rr * o.rx, z = o.cz + Math.sin(a) * rr * o.rz, base = o.heightAt(x, z);
          let Ht = fr.range(5, 10.5); const Rm = Ht * fr.range(0.2, 0.27), ph = fr() * 6.2832, col = firs[Math.floor(fr() * 4) % 4], nn = path.nearestXZ(x, z);
          if (nn.dist < 18 + Rm) Ht = Math.min(Ht, nn.y - 17 - base);
          if (Math.hypot(x - AX, z - AZ) < 72) Ht = Math.min(Ht, 25 - base);
          if (base < 3 || Ht < 3.5 || hero.heightAt(15 - x, 230 - z) > 0.3 || hills.some((q) => q !== o && q.heightAt(x, z) > base - 0.5) || !lemonClear(x, base, base + Ht + 0.8, z, Rm + 0.4)
            || !standing.every(([sx, sz, rad]) => Math.hypot(sx - x, sz - z) > rad + Rm + 1.2)) continue;
          standing.push([x, z, Rm + 0.4, base + Ht + 0.8]);
          PS.stick2([x, base - 0.4, z], [x, base + Ht * 0.3, z], 0.1, 0);                 // its trunk; the spine above is inside the paper
          for (let t = 0; t < 3; t++) {
            const yb = base + Ht * (0.16 + 0.27 * t), yt = base + Ht * (0.64 + 0.18 * t), r = Rm * (1 - 0.27 * t), apex = [x, yt, z], ring = [];
            for (let q = 0; q <= SIDES - 1; q++) { const b = q / (SIDES - 1) * 6.2832 + ph + t * 0.5; ring.push([x + r * Math.cos(b), yb, z + r * Math.sin(b), Math.cos(b), Math.sin(b)]); }
            for (let q = 0; q < SIDES - 1; q++) {
              const p0 = ring[q], p1 = ring[q + 1], lit = 0.5 + 0.5 * ((p0[3] + p1[3]) * SUN[0] + (p0[4] + p1[4]) * SUN[2]) / 2;
              PK.quad(p0, p1, apex, apex, [q, t, q + 1, t + 1], shadeTint(col, 0.15 + 0.8 * lit), { sway: [[0, 0, 0, 0], [0, 0, 0, 0], [0.12, 0, 0.09, ph + t], [0.12, 0, 0.09, ph + t]] });
            }
          }
          if (++firN % 4 === 0) await ctx.yield();
        }
      }
      // the hedges of the fields about the meet: short rows of small paper trees (two tiers, five sides) along some of the apron's
      // bay lines, out to 330 m from the apron's middle. Each tree is stood by place as the firs are: on the level apron (not on the
      // field or the river, and no hill under its middle or its rim), 14 m and more from the mooring mast, its top 17 m and more under the line where the route
      // or the hull passes within 18 m, clear of the lemon's whole way and of every upright thing stood before it
      const hd = rng.fork('hedges'); let hedgeN = 0;
      for (let j = 0; j < 2 * NA + 8; j++) {
        for (let i = 0; i < 2 * NA + 8; i++) {
          const x0 = ax0 + i * AB, z0 = az0 + j * AB, alongX = hd() < 0.5, n = hd.int(2, 4);
          if (hd() > 0.22 || Math.hypot(x0 - ACX, z0 - ACZ) > 330) continue;
          for (let q = 0; q < n; q++) {
            const f = (q + hd.range(0.2, 0.8)) / n, x = alongX ? x0 + f * AB : x0 + hd.range(-0.8, 0.8), z = alongX ? z0 + hd.range(-0.8, 0.8) : z0 + f * AB;
            let Ht = hd.range(3.2, 6.5); const Rm = Ht * hd.range(0.26, 0.34), ph = hd() * 6.2832, col = firs[Math.floor(hd() * 4) % 4], nn = path.nearestXZ(x, z);
            if (nn.dist < 18 + Rm) Ht = Math.min(Ht, nn.y - 17);
            if (Ht < 3 || (x > FX0 - Rm - 1 && x < FX1 + Rm + 1 && z > FZ0 - Rm - 1 && z < FZ1 + Rm + 1) || Math.abs(z - RIV) < RIVW + Rm + 1 || Math.hypot(x - MAST[0], z - MAST[1]) < 14 + Rm
              || onHills(x, z, Rm) || !lemonClear(x, 0, Ht + 0.8, z, Rm + 0.4)
              || !standing.every(([sx, sz, rad]) => Math.hypot(sx - x, sz - z) > rad + Rm + 1.2)) continue;
            standing.push([x, z, Rm + 0.4, Ht + 0.8]); shady.push([x, z, Rm, Ht]);
            PS.stick2([x, 0, z], [x, Ht * 0.3, z], 0.09, 0);
            for (let t = 0; t < 2; t++) {
              const yb = Ht * (0.18 + 0.3 * t), yt = Ht * (0.72 + 0.28 * t), r = Rm * (1 - 0.3 * t), apex = [x, yt, z], ring = [];
              for (let s = 0; s <= 5; s++) { const b = s / 5 * 6.2832 + ph + t * 0.6; ring.push([x + r * Math.cos(b), yb, z + r * Math.sin(b), Math.cos(b), Math.sin(b)]); }
              for (let s = 0; s < 5; s++) {
                const p0 = ring[s], p1 = ring[s + 1], lit = 0.5 + 0.5 * ((p0[3] + p1[3]) * SUN[0] + (p0[4] + p1[4]) * SUN[2]) / 2;
                PK.quad(p0, p1, apex, apex, [s, t, s + 1, t + 1], shadeTint(col, 0.15 + 0.8 * lit), { sway: [[0, 0, 0, 0], [0, 0, 0, 0], [0.1, 0, 0.08, ph + t], [0.1, 0, 0.08, ph + t]] });
              }
            }
            if (++hedgeN % 6 === 0) await ctx.yield();
          }
        }
        await ctx.yield();
      }
      // the meet's tents: bell tents of striped paper (eight gores, one of four bright papers and the white by turns) on a balsa
      // pole with a pennant: a row along our left of the strip beyond the launch stand's apron (the lemon lands down our right),
      // and small camps out on the fields. Each is stood by place: on the level ground (not the river, and no hill under its
      // middle or its rim), 14 m and more from the mooring mast, 24 m and more from the launch stand; where the route passes
      // within 9 m of its wall its top is 17 m and more under the line; clear of the lemon's whole way and of every upright
      // thing stood before it (the strip's stooges among them). No blade of grass is left rooted inside a tent's wall.
      const tr = rng.fork('tents'), tcol = [tis.red, tis.orange, tis.blue, tis.lemon], tentsAt = [];
      const tent = (x, z, big = 1) => {
        const H = tr.range(3.2, 4.6) * big, R = H * tr.range(0.62, 0.78), ph = tr() * 6.2832, c = tcol[tr.int(0, 3)], nn = path.nearestXZ(x, z), z4 = [0, 0, 0, 0];
        if ((nn.dist < 9 + R && H + 1.8 > nn.y - 17) || Math.abs(z - RIV) < RIVW + R + 1 || Math.hypot(x - MAST[0], z - MAST[1]) < 14 + R || Math.hypot(x - REST.x, z - REST.z) < 24 + R
          || Math.abs(x - 15) < 9 + R && z < 119 + R || onHills(x, z, R) || !lemonClear(x, 0, H + 1.8, z, R + 0.4)
          || !standing.every(([sx, sz, rad]) => Math.hypot(sx - x, sz - z) > rad + R + 1.2)) return;
        standing.push([x, z, R + 0.4, H + 1.8]); shady.push([x, z, R, H]); tentsAt.push([x, z, R]);
        const r0 = [], r1 = [], wall = H * 0.42, apex = [x, H, z];
        for (let s = 0; s <= 8; s++) { const b = s / 8 * 6.2832 + ph, cs = Math.cos(b), sn = Math.sin(b); r0.push([x + R * cs, 0, z + R * sn]); r1.push([x + R * 0.94 * cs, wall, z + R * 0.94 * sn]); }
        for (let s = 0; s < 8; s++) {
          const col = s % 2 ? tis.white : c;
          PK.quad(r0[s], r0[s + 1], r1[s + 1], r1[s], [s, 0, s + 1, 1], col, { sway: z4 });
          PK.quad(r1[s], r1[s + 1], apex, apex, [s, 1, s + 1, 2], col, { sway: [z4, z4, [0.05, 0, 0.04, ph], [0.05, 0, 0.04, ph]] });
        }
        PS.stick2([x, 0, z], [x, H + 1.5, z], 0.07, 0);
        const tip = [x + 1.4 * Math.cos(ph), H + 1.15, z + 1.4 * Math.sin(ph)], sw = [-0.3 * Math.sin(ph), 0.1, 0.3 * Math.cos(ph), ph];
        PK.quad([x, H + 1.5, z], [x, H + 0.9, z], tip, tip, [0, 0, 1, 1], c, { sway: [z4, z4, sw, sw] });
      };
      for (let z = 58; z <= 122; z += 10.5) tent(29 + tr.range(0, 1.5), z + tr.range(-1.5, 1.5));
      await ctx.yield();
      for (let q = 0; q < 26; q++) {
        const a = tr() * 6.2832, rad = tr.range(70, 300), cx = ACX + Math.cos(a) * rad, cz = ACZ + Math.sin(a) * rad, n = tr.int(3, 5);
        for (let k = 0; k < n; k++) { const b = k / n * 6.2832 + tr(), rr = tr.range(6.5, 9.5); tent(cx + Math.cos(b) * rr * 1.3, cz + Math.sin(b) * rr * 1.3, 1.35); }
        if (q % 4 === 3) await ctx.yield();
      }
      // no blade stands inside a tent: the blades rooted within a tent's wall (and 0.4 m about it) are taken out of the grass
      if (grassB) {
        const { root, lean, gcol } = grassB, near = tentsAt.filter(([tx, tz, R]) => tx > FX0 - R - 1 && tx < FX1 + R + 1 && tz > FZ0 - R - 1 && tz < FZ1 + R + 1);
        // the test is a small function of its own: written straight into this long build's body it ran several times slower
        const inTent = (x, z) => { for (let t = 0; t < near.length; t++) { const q = near[t], dx = x - q[0], dz = z - q[1], rr = q[2] + 0.4; if (dx * dx + dz * dz < rr * rr) return true; } return false; };
        let m = 0;
        for (let i = 0; i < grassB.n; i++) {
          if (i % 4000 === 3999) await ctx.yield();
          const x = root[i * 4], z = root[i * 4 + 2];
          if (inTent(x, z)) continue;
          if (m < i) { root.copyWithin(m * 4, i * 4, i * 4 + 4); lean.copyWithin(m * 4, i * 4, i * 4 + 4); gcol.copyWithin(m * 3, i * 3, i * 3 + 3); }
          m++;
        }
        grassB.g.instanceCount = m;
      }
      await ctx.yield();
      addMesh(await PS.geometryAsync(ctx), balsaMaterial({ minPx: 1.2 }));
      addMesh(await PK.geometryAsync(ctx, false, true), tissueMaterial({ bay: [1.4, 2.1], sway: 0.8, lift: 0.3, body: BODY, lit: 0.6, rib: 0.2, marks: 0.3, form: 0.7 }), 1);
    }
    await ctx.yield();

    // ---- far ranges at 500, 800 and 1,200 m: single pale skins with no ribs -----------------------------------
    {
      const RK = new Skins(false), N = 96;
      const rg = [[500, 55, 95, C('#6E7CA6'), -30], [800, 110, 110, C('#8C96CC'), -60], [1200, 190, 150, C('#ABA9DC'), -110]];   // slate, then two paler blues: each range a step further into the evening
      rg.forEach(([R, base, amp, col, low], q) => {
        const top = (i) => base + amp * (0.5 + 0.5 * noise.fbm2(Math.cos(i / N * 6.2832) * 2.2 + q * 9, Math.sin(i / N * 6.2832) * 2.2 - q * 5, 4));
        const P = (i, y) => [15 + R * Math.sin(i / N * 6.2832), y, 180 + R * Math.cos(i / N * 6.2832)];
        for (let i = 0; i < N; i++) RK.quad(P(i, low), P(i + 1, low), P(i + 1, top(i + 1)), P(i, top(i)), [0.5, 0.5, 0.5, 0.5], col);
      });
      addMesh(RK.geometry(), tissueMaterial({ bay: [40, 40], far: 0.7 }), 1, false);
    }
    await ctx.yield();

    // ---- bare strip: winding stooges at the entry, and the lattice mooring mast under the airship's nose ring --
    {
      const MS = new Sticks(), sr = rng.fork('stooges');
      const stooge = (x, z, Ht, yaw, prongs = true) => {
        const top = [x, Ht, z], c = Math.cos(yaw), s = Math.sin(yaw), sp = Ht * 0.3;
        const legs = [[x + sp * c, 0, z + sp * s], [x - sp * 0.6 * c - sp * 0.8 * s, 0, z - sp * 0.6 * s + sp * 0.8 * c], [x - sp * 0.6 * c + sp * 0.8 * s, 0, z - sp * 0.6 * s - sp * 0.8 * c]];
        for (const l of legs) MS.stick2(l, top, 0.11, 0);
        for (let k = 0; k < 3; k++) { const a = legs[k], b = legs[(k + 1) % 3], m = (q, t) => [lerp(q[0], top[0], t), lerp(q[1], top[1], t), lerp(q[2], top[2], t)];
          MS.stick2(m(a, 0.33), m(b, 0.33), 0.07, 0); MS.stick2(m(a, 0.66), m(b, 0.66), 0.06, 0); MS.stick(m(a, 0.33), m(b, 0.66), 0.045, 1, [0, 1, 0]); }
        const arm = [x - 1.9 * s, Ht + 0.9, z + 1.9 * c], arm2 = [x + 1.9 * s, Ht + 0.9, z - 1.9 * c];                     // the cradle: a bar and two prongs
        MS.stick2(top, [x, Ht + 0.9, z], 0.1, 0); MS.stick2(arm, arm2, 0.09, 0);
        if (prongs) { MS.stick2(arm, [arm[0], arm[1] + 1.3, arm[2]], 0.07, 0); MS.stick2(arm2, [arm2[0], arm2[1] + 1.3, arm2[2]], 0.07, 0); }
        MS.stick([x + 0.5 * c, Ht * 0.5, z + 0.5 * s], [x + 2.2 * c, Ht * 0.5 + 0.2, z + 2.2 * s], 0.06, 0, [0, 1, 0]);    // the winder's crank
      };
      // each stands where it was written into the list of upright things (above the poplars): clear of the lemon's whole way, by place
      stoogeAt.forEach(([x, z, h]) => { stooge(x, z, h * sr.range(0.94, 1.06), sr.range(0, 6.28)); shady.push([x, z, h * 0.3, h * 1.06 + 2.2]); });
      // the lemon's launch stand, where its way begins: the cradle's bar lies across the strip close under the lemon's belly
      // (the bar's top 0.43 m under the lemon's centre, its belly 0.36 m); this stand carries no prongs (they crossed the lemon's wing from below)
      stooge(REST.x, REST.z, REST.y - 1.42, Math.PI / 2, false);
      // the mast: three legs, twelve rings (one about every 5.4 m), diagonals; its head carries a cone of struts to the nose ring
      const mx = MAST[0], mz = MAST[1], top = nose.y - 9.2, leg = (k, y) => { const r = 1.2 + 9 * (1 - y / top), a = k * 2.0944 + 0.5; return [mx + r * Math.cos(a), y, mz + r * Math.sin(a)]; };
      for (let y = 0; y < top - 0.1; y += top / 12) {
        const y1 = Math.min(top, y + top / 12);
        for (let k = 0; k < 3; k++) { MS.stick2(leg(k, y), leg(k, y1), 0.24, 0); MS.stick2(leg(k, y1), leg((k + 1) % 3, y1), 0.14, 0); MS.stick(leg(k, y), leg((k + 1) % 3, y1), 0.1, 1, [0, 1, 0]); }
      }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; MS.stick2([mx, top, mz], [nose.x + 3.2 * Math.cos(a) * shipDir.z, nose.y - 8.1 + 0.6 * Math.abs(Math.cos(a)), nose.z - 3.2 * Math.cos(a) * shipDir.x], 0.12, 0); }
      // (the mast stands in the list of upright things with the stooges, above the poplars)
      addMesh(MS.geometry(), balsaMaterial({ minPx: 1.2 }));
    }
    await ctx.yield();

    // ---- the hour's long shadows, flat on the level ground, straight away from the sun: a mound from the middle of each hill
    // that stands high enough to throw one past its own foot (at most 90 m past it), and one from the foot of each poplar, hedge
    // tree, tent and winding stooge that does not stand in a hill's shadow (as long as the sun's height makes it, at most 3.2
    // heights and 64 m). A shadow is laid by the sun's place and the thing's place alone; a hill drawn after it covers it where it
    // stands. It multiplies the ground's papers and is drawn after all balsa: the foot of a leg or trunk standing before it is
    // darkened with the ground; a blade, tree or tent standing in it keeps its own light; where two cross, the ground is darkened twice.
    {
      const sl = Math.hypot(SUN[0], SUN[2]) || 1, dx = -SUN[0] / sl, dz = -SUN[2] / sl, cot = Math.min(3.2, sl / Math.max(SUN[1], 0.05));
      const pos = [], st = [], idx = [], mounds = [];
      const quad = (x, z, hw, L, kind) => {
        const px = -dz * hw, pz = dx * hw, n = pos.length / 3;
        pos.push(x - px, 0.04, z - pz, x + px, 0.04, z + pz, x + px + dx * L, 0.04, z + pz + dz * L, x - px + dx * L, 0.04, z - pz + dz * L);
        st.push(-1, 0, kind, 1, 0, kind, 1, 1, kind, -1, 1, kind); idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      };
      const mound = (cx, cz, hAt) => {
        let top = 0, ra = 0, rp = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) top = Math.max(top, hAt(cx + a * 12, cz + b * 12));
        while (ra < 240 && hAt(cx + dx * (ra + 4), cz + dz * (ra + 4)) > 0.3) ra += 4;                                                  // the hill's reach away from the sun
        while (rp < 240 && (hAt(cx - dz * (rp + 4), cz + dx * (rp + 4)) > 0.3 || hAt(cx + dz * (rp + 4), cz - dx * (rp + 4)) > 0.3)) rp += 4;   // and across
        const L = Math.min(top * cot, ra + 90);
        if (L > ra + 8) { quad(cx, cz, rp * 0.92, L, 1); mounds.push([cx, cz, rp * 0.92, L]); }
      };
      hills.forEach((o) => mound(o.cx, o.cz, o.heightAt));
      mound(15, 230, (x, z) => hero.heightAt(15 - x, 230 - z));
      const shaded = (x, z) => mounds.some(([cx, cz, hw, L]) => { const t = ((x - cx) * dx + (z - cz) * dz) / L, s = ((x - cx) * -dz + (z - cz) * dx) / hw; return t > 0 && t < 0.9 && Math.abs(s) < 0.85 * Math.sqrt(1 - t * t); });
      shady.forEach(([x, z, hw, h]) => { if (!shaded(x, z)) quad(x, z, hw, Math.min(64, h * cot), 0); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSt', new THREE.Float32BufferAttribute(st, 3)); g.setIndex(idx);
      if (idx.length) addMesh(g, shadeMaterial(), 0.85, false);
    }
    await ctx.yield();

    // ---- more aeroplanes: thistledown (film-covered indoor models over the grass), and a few still climbing under power
    // Each circles its own centre. A ring is laid only where it is clear, by place: of the route (6 m and more), of every
    // upright thing of the field, of the lemon's whole way, of every model laid before it, and for the climbers of every hill
    // under the whole ring and of the orange's whole way. Where no clear ring is found the model is not built (of twenty climbers dealt one is built most often, none to two on forty seeds counted: the hills, the column, the route, the orange's way and the tents leave few clear places).
    const pickCol = (r) => tis[way[Math.floor(r() * way.length) % way.length]];
    // every model laid about the field is written down (its centre, ring, body as a ball, the heights it sweeps), so that
    // one laid later is laid clear of it by place
    const BALL = [0.73, 0.79, 0.6], laid = [];                    // furthest point of a model from its centre, in spans, by type (as the part's)
    const lay = (m, type, y0, y1) => laid.push([m.origin[0], m.origin[2], m.r, BALL[type] * m.span, y0 - 0.06 * m.span, y1 + 0.06 * m.span]);
    const laidClear = (x, y0, y1, z, reach) => laid.every(([ox, oz, r, ball, a, b]) => {
      const rho = Math.hypot(x - ox, z - oz), dr = Math.max(0, r * 0.95 - rho, rho - r * 1.05), dy = Math.max(0, a - y1, y0 - b); return dr * dr + dy * dy >= (ball + reach) * (ball + reach); });
    const ringFree = (ox, oz, r, reach, top) => standing.every(([x, z, rad, ht]) => ht < top || Math.abs(Math.hypot(x - ox, z - oz) - r) > reach + rad + 1);
    {
      const tr = rng.fork('thistle'), list = [], q = new THREE.Vector3(), t = new THREE.Vector3();
      for (let i = 0; i < 160 && list.length < 24; i++) {
        const d = tr.range(16, 96), side = tr() < 0.5 ? -1 : 1, r = tr.range(1.4, 3.6), lat = side * (r + tr.range(7.6, 17)), span = tr.range(1.1, 1.9);
        path.posAtDist(d, q); path.tangentAtDist(d, t);
        const m = { span, r, h: Math.max(2.2, q.y - tr.range(-0.5, 3.6)), th: tr() * 6.28, rate: 1.3 / r * (tr() < 0.5 ? 1 : 0.8), climb: 0, free: -1, seed: tr(),
          a: tis.white, b: tis.white, origin: [q.x + t.z * lat, 0, q.z - t.x * lat] };
        let ok = ringFree(m.origin[0], m.origin[2], r, span * 0.8, m.h - span) && path.distanceTo(m.origin[0], m.h, m.origin[2]) > r + span * 0.8 + 6;
        for (let k = 0; k < 8 && ok; k++) {
          const a = k / 8 * 6.2832, x = m.origin[0] + r * Math.sin(a), z = m.origin[2] + r * Math.cos(a);
          ok = laidClear(x, m.h - 0.3, m.h + 0.3, z, span * 0.8 + 1) && lemonClear(x, m.h - 0.3, m.h + 0.3, z, span * 0.8);
        }
        if (ok) { list.push(m); lay(m, 1, m.h, m.h); }
        if (i % 10 === 9) await ctx.yield();
      }
      if (list.length) for (const m of buildFlock(list, 1, tr, { col: new THREE.Vector4(-30, 70, 0.1, 0), origin: true, minPx: 1.2 })) scene.add(m);
      await ctx.yield();
      const cr = rng.fork('climbers'), per = [[], [], []];
      for (let i = 0; i < 20; i++) {
        let ox = 0, oz = 0, r = 18, span = 5, ok = false;
        for (let tries = 0; tries < 48 && !ok; tries++) {
          if (tries % 6 === 5) await ctx.yield();
          ox = cr.range(-45, 80); oz = cr.range(24, 190); r = cr.range(13, 26); span = cr.range(3.2, 7.5);       // ahead of the entry, where the flight looks
          ok = hero.heightAt(15 - ox, 230 - oz) < 0.5 && ringFree(ox, oz, r, span * 0.8, 0);
          for (let k = 0; k < 24 && ok; k++) {
            const a = k / 24 * 6.2832, x = ox + r * Math.sin(a), z = oz + r * Math.cos(a);
            if (path.nearestXZ(x, z).dist < span * 0.8 + 8 || hero.heightAt(15 - x, 230 - z) > 0.5 || hills.some((o) => o.heightAt(x, z) > 0.5) || !hero.columnClear(15 - x, 1.5, 96, 230 - z, span * 0.8 + 1) || !laidClear(x, 1.5, 96, z, span * 0.8 + 1) || !lemonClear(x, 1.5, 96, z, span * 0.8) || !orangeClear(x, 1.5, 96, z, span * 0.8)) ok = false;
          }
        }
        const type = cr() < 0.7 ? 0 : 1, m = { span, r, h: cr.range(2, 95), th: cr() * 6.28, rate: (5 + 0.45 * span) / r, climb: cr.range(0.9, 1.7), free: -1, seed: cr(), a: pickCol(cr), b: pickCol(cr), origin: [ox, 0, oz] };
        if (ok) { per[type].push(m); lay(m, type, 1.5, 96); }     // where no ring is clear the climber is not built
        await ctx.yield();
      }
      for (let type = 0; type < 2; type++) { if (per[type].length) for (const m of buildFlock(per[type], type, cr, { col: new THREE.Vector4(1.5, 96, 0.3, 1), origin: true })) scene.add(m); await ctx.yield(); }
      // up to eighteen indoor models circling inside the airship's frame, as they are flown in airship sheds. Each ring
      // lies beside the flown line, by place: its model's ball 2.6 m and more from the line, and 1 m and more inside the hull's
      // ring formers at both ends of the ring wherever the hull is in its half degree of swing about its nose (the hull narrows toward the nose: the ring is drawn in toward the line as far
      // as that asks); where both cannot be, the model is not built
      const ir = rng.fork('indoor'), inside = [[], []], side = new THREE.Vector3(shipDir.z, 0, -shipDir.x);
      for (let i = 0; i < 18; i++) {                                // one every 4.5 m of the hull, on either side by turns; 0.8 to 3 m over our own height, so over our own wing
        const along = 16 + i * 4.5 + ir.range(-1, 1), sgn = i % 2 ? -1 : 1, type = ir() < 0.5 ? 0 : 1, r = ir.range(1.3, 1.9), span = ir.range(1.6, 2.4), reach = BALL[type] * span, wide = ir.range(6.4, 6.9), h = sternP.y + ir.range(0.8, 3);
        const inner = Math.min(hero.hullInner(along - r - reach), hero.hullInner(along + r + reach)) - 1.25 - 0.008 * (HULL - along + r + reach), dy = Math.abs(h - nose.y) + 0.06 * span;
        const off = sgn * Math.min(wide, Math.sqrt(Math.max(0, inner * inner - dy * dy)) - r - reach);
        const m = { span, r, h, th: ir() * 6.28, rate: 1.1 / r * (ir() < 0.5 ? 1 : -1), climb: 0, free: -1, seed: ir(), a: pickCol(ir), b: pickCol(ir),
          origin: [sternP.x + shipDir.x * along + side.x * off, 0, sternP.z + shipDir.z * along + side.z * off] };
        if (Math.abs(off) - r - reach >= 2.6) inside[type].push(m);
      }
      for (let type = 0; type < 2; type++) if (inside[type].length) for (const m of buildFlock(inside[type], type, ir, { col: new THREE.Vector4(-30, 200, 0.1, 0), origin: true, minPx: 1.2, ink: 1.3 })) scene.add(m);
      await ctx.yield();
      // BESIDE THE WAY: models circling places of their own beside the flown line, so that the rise and the way to the stern have
      // aeroplanes near us and not only far above. A place is one ring; one, two or three models of one span share it, evenly
      // spaced and at one rate (as many as keep 1.5 m between them as balls), so they follow one another round and never meet.
      // At each station along the line a place is tried on either side. Each is laid by place, at one height else another
      // (heights gives each with the metres it lies further out), else not built: its whole ring 3 m and
      // more clear of the flown line (the model as a ball), over every hill's skin and the field's grass, clear of every upright
      // thing, of the column's models (hero.columnClear), of the lemon's whole way, of the orange's whole way and of every model laid before
      const beside = async (name, n, q0, q1, heights, stop) => {
        const br = rng.fork(name), out = [[], []];
        for (let i = 0; i < n; i++) {
          const q = lerp(q0, q1, (i + br.range(0.15, 0.85)) / n), c = planAt(q), d = planAt(q + 1), hx = d[0] - c[0], hz = d[2] - c[2], hl = Math.hypot(hx, hz);
          for (const sgn of i % 2 ? [1, -1] : [-1, 1]) {
            const r = br.range(5, 9), span = br.range(4.5, 8.5), reach = span * 0.8, lat = r + reach + br.range(3, 8), hs = heights(q, c[1], br);
            const chord = (1.58 * span + 1.5 + 0.1 * r) / (2 * r), many = chord < 1 ? Math.min(3, Math.floor(Math.PI / Math.asin(chord))) : 1;
            const th = br() * 6.28, rate = (4 + 0.45 * span) / r * (br() < 0.5 ? 1 : -1);
            if (stop(q, r + reach)) continue;
            for (const [h, wide] of hs) {
              const ox = c[0] + sgn * hz / hl * (lat + wide), oz = c[2] - sgn * hx / hl * (lat + wide), low = h - 0.25 * span - 2.5;
              let ok = low > 2 && path.distanceTo(ox, h, oz) > r + reach + 3 && ringFree(ox, oz, r, reach, low);
              for (let k = 0; k < 16 && ok; k++) {
                const a = k / 16 * 6.2832, x = ox + r * Math.sin(a), z = oz + r * Math.cos(a);
                ok = hero.heightAt(15 - x, 230 - z) < low && !hills.some((o) => o.heightAt(x, z) > low) && hero.columnClear(15 - x, h - 0.5, h + 0.5, 230 - z, reach + 1) && laidClear(x, h - 0.5, h + 0.5, z, reach + 1) && lemonClear(x, h - 0.5, h + 0.5, z, reach) && orangeClear(x, h - 0.3 * span, h + 0.3 * span, z, reach);
              }
              if (!ok) continue;
              for (let j = 0; j < many; j++) {
                const type = br() < 0.6 ? 0 : 1, m = { span, r, h, th: th + j * 6.2832 / many, rate, climb: 0, free: -1, seed: br(), a: pickCol(br), b: pickCol(br), origin: [ox, 0, oz] };
                out[type].push(m); if (!j) lay(m, 1, h, h);
              }
              break;
            }
          }
          await ctx.yield();
        }
        for (let type = 0; type < 2; type++) { if (out[type].length) for (const m of buildFlock(out[type], type, br, { col: new THREE.Vector4(-30, 200, 0.35, 0), origin: true })) scene.add(m); await ctx.yield(); }
      };
      // the escorts of the rise, from the strip's end to the circle's foot: about our own height or over it; but from 36 m before
      // the orange model's first place on our course (O_FROM; 36 m: the widest ring and reach of a place and the orange as a
      // ball) only under the line it rides 5.2 m over: 1.8 m and more below, else well below
      await beside('escorts', 34, M.veer + 30, M.circle + 14, (q, y, br) => (q < O_FROM - 36 ? [[y + br.range(-5, 4.5), 0], [y - br.range(1.8, 6), 0], [y + br.range(7, 12), 0]] : [[y - br.range(1.8, 5), 0], [y - br.range(10, 15), 0]]), () => false);
      // the waiting models, from the circle's top to the stern: a little under our height; else over it, 8 m further out (the
      // orange's half span and a metre: it comes this way late, 5.2 m over the line) and only where the column's models leave
      // the air clear (they may sink 9 m in the rare wave); else well under. None whose ring would reach the stern
      await beside('waiting', 26, M.easeOut - 14, M.stern - 4, (q, y, br) => [[y - br.range(2, 6), 0], [y + br.range(2, 7), 8], [y - br.range(9, 14), 0]], (q, ext) => q > M.stern - (ext + 2));
    }

    // ---- the ride: the red model, 10 m in span, carried with the camera (everything carried is in this one group)
    const carried = new THREE.Group(); carried.name = 'carried'; scene.add(carried);
    for (const m of buildFlock([{ span: 10, r: 0, h: 0, th: 0, rate: 0, climb: 0, free: 2, seed: 0.37, a: tis.red, b: tis.red }], 0, rng.fork('ride'), { col: new THREE.Vector4(0, 300, 0, 0), lift: 0.03 })) { if (m.renderOrder > 0) m.renderOrder += 3; carried.add(m); }   // our own skin is drawn after the mist, so it tints it
    const EYE = new THREE.Vector3(0, 3.0, 1.4);                   // 1.8 m above the centre section, over the leading edge: the wing, the nose and the propeller's whole disc lie under the picture while the gaze is level
    await ctx.yield();

    // ---- the flight ---------------------------------------------------------------------------------------------
    // Every thing that begins, ends or moves here does so by WHERE THE EYE IS on the route (its metres along the
    // strip, its height), measured against named things of the place: the stooges, the foot of the hero's hill, the
    // circle's foot and top, the hull. No share of the flight is typed: a window that begins some metres before a mark
    // says so in metres of the flown line (mU is one metre of it). DECLARED PACINGS (stations worked from where
    // the eye is on the route, never steered by the gaze): THE LEMON's way is laid above, with the stooges (from its
    // stand, to 9 m ahead of us, 7 m further ahead as it crosses our nose 4.4 m over the route, then the glide down
    // to the field); THE 14 m ORANGE model flies our own course 5.2 m over it at 0.35 of our speed and is 5 m ahead
    // of us where we are a fifth of the way round the circle, so we pass under it 7.7 m further on and the gaze goes on
    // up from it into the column (it is behind us and under the picture by then); while it is more than 40 m ahead of us along the route it weaves up
    // to 2.5 m to either side of the course by the world's own clock (so it is never a thing hung still in the air,
    // also while this world is seen through a portal), and within 40 m it flies the course itself.
    const O_SWAY = 0.35, orangeSway = (u) => 2.5 * smoothstep(40, 90, orangeD(u) - u * L);
    const orangeAt = (u, time, out) => {
      const d = orangeD(u), w = orangeSway(u) * Math.sin(time * O_SWAY);
      path.posAtDist(d, out); path.tangentAtDist(d, _b);
      return out.set(out.x + _b.z * w, out.y + 5.2, out.z - _b.x * w);
    };
    const BK = 7 * mU;                                            // the turn is read over 14 m of the flown line
    const bankAt = (u) => {                                       // left wing down in a left turn, 20 degrees in the circle
      path.tangentAt(clamp(u - BK, 0, 1), _a); path.tangentAt(clamp(u + BK, 0, 1), _b);
      const dpsi = Math.atan2(_a.z * _b.x - _a.x * _b.z, _a.x * _b.x + _a.z * _b.z);
      return clamp(dpsi / 14 * CR * 0.35, -0.35, 0.35);
    };
    // the looks: each window's ends are marks of the place found on the route (or so many metres of the flown line from one)
    // ONE LOOK holds the column from the orange's pass until the lead is begun, and its mark moves by where the eye is on
    // the route: as the orange has passed overhead the gaze goes on up to "the image" (60 m over the eye on the axis), whole
    // from 36 to 59 per cent of the way round; by three quarters round it has come down ACROSS the column (the axis, 6 m
    // over the eye: the models about our own height, the airship beyond them, the hills and the field under them); from the
    // circle's top it slides from the column to the hull's stern, so the gaze comes down from the image and round to the
    // stern in one slow turn
    const uAng = (a) => uAt(M.circle + (a - A_IN) * CR), uLook0 = uO - 6 * mU, uLook1 = uAng(A_OUT - 3 * d2r), uUp0 = uO + 4 * mU, uUp1 = uCirc(0.36), uDn0 = uCirc(0.59), uDn1 = uCirc(0.75), uOut = uAt(M.lead + 8);
    const uFoot = uAtZ(zFoot), uStern = uAt(M.stern);
    const pLemon = new THREE.Vector3(), pOrange = new THREE.Vector3(), pAxis = new THREE.Vector3(), pIn = new THREE.Vector3();
    const pOpen = new THREE.Vector3(), hullMid = sternP.clone().addScaledVector(shipDir, HULL / 2);
    const pois = [
      { at: (time, u) => lemonAt(u, pLemon), from: uAtZ(Z_S0), to: uAtZ(Z_SL), weight: 0.4 },                    // the lemon, from the first stooge to the last
      { at: hullMid, from: uAt(M.line + 40), to: uAt(M.easeIn + 6), weight: 0.45 },                              // the airship whole, flank on, while it lies beside the rise
      { at: new THREE.Vector3(AX, 36, AZ), from: uFoot, to: uO - 29 * mU, weight: 0.4 },                             // the bare crest, from the hill's foot until the orange is near
      // coming into the circle the gaze turns in toward the column, which stands against the evening's light (18 m over the eye on the axis), until the orange is close
      { at: (time, u) => { path.pointAt(u, pIn); return pIn.set(AX, pIn.y + 18, AZ); }, from: uAt(M.easeIn - 10), to: uO - 4 * mU, weight: 0.66 },
      { at: (time, u) => orangeAt(u, time, pOrange), from: uO - 29 * mU, to: uO + 7 * mU, weight: 0.7 },   // the orange, from 29 m before it is 5 m ahead of us until we are all but under it
      { at: (time, u) => { path.pointAt(u, pAxis); return pAxis.set(AX, pAxis.y + lerp(6, 60, smoothstep(uUp0, uUp1, u) * (1 - smoothstep(uDn0, uDn1, u))), AZ).lerp(sternP, smoothstep(uLook1 - 11.5 * mU, uOut, u)); },
        from: uLook0 - 11.5 * mU, to: uAt(M.lead + 16), weight: 0.8, fade: 0.2 },                                    // the column: the image, across, and away to the stern
      // down the hull the gaze lies on the nose ring, but from 34 to 80 m in, when it lifts up and to our right to the gores left open, where the bare frame stands against the sky (the nose ring stays in the picture)
      { at: (time, u) => { path.pointAt(u, pOpen); return pOpen.addScaledVector(shipDir, 18).add(_w.set(-shipDir.z * 4, 7, shipDir.x * 4)); }, from: uAt(M.stern + 34), to: uAt(M.stern + 80), weight: 0.6 },
    ];
    const pace = (u) => {                                         // slow over the strip, faster in the rise, eased for the circle and the image; the step up comes on the straight after the circle
      let p = 0.6 + 0.7 * smoothstep(uAt(M.veer), uAt(M.line), u) - 0.35 * smoothstep(uAt(M.easeIn), uC0, u);
      p -= 0.15 * smoothstep(uLook0, uLook0 + 23 * mU, u) * (1 - smoothstep(uAt(M.lead), uAt(M.lead + 30), u));   // eased for the image; given back on the straight of the lead
      p += 0.2 * smoothstep(uAt(M.lead), uStern, u) - 0.15 * smoothstep(uAt(M.stern + 40), uAt(M.stern + 80), u);
      return p;
    };
    const yWave = lerp(Y0, Y1, 0.3);                              // the rare wave begins as the eye is three tenths of the way up the circle (the look is up the column then)

    function update(dt, time, camera, u) {
      // where the eye is on the route (the entry while this world is still seen through a portal)
      path.pointAt(u, eye); const ez = eye.z, ey = eye.y;
      // the crest's sheet is laid as the eye climbs: a third of it on the rise to the circle's foot, the rest up to the hull's height
      hero.setProgress(0.35 * clamp((ey - Y_IN) / (Y0 - Y_IN), 0, 1) + 0.65 * clamp((ey - Y0) / (Y_SHIP - Y0), 0, 1), clamp((ey - yWave) / (Y1 - yWave), 0, 1));
      hero.update(dt, time, camera);                              // style uniforms (time, pixel size), free propellers, airship swing
      // the first hillside: the mist goes before the visitor along the hillside's own axis (z + 0.35 x), 15 m ahead of him
      // at the entry and gaining 0.6 m for each of his, until it has left the hillside's far end; the tissue snaps tight behind it
      const f = clamp(1.6 * (ez + 0.35 * eye.x) + 11.6, r1F0, r1F1);
      r1Front.set(f - 5, 1e6, 3, 1); r1Mist.set(f, 11, 0, 0);
      // the ride: at the eye, heading down the course, banked with it. Hidden while this world is seen through a portal
      // (the portal's near plane would slice it); at the eye from the first frame it is not.
      const through = !!ctx.through;
      carried.visible = !through;
      if (through) { _cp.copy(path.start); _f.copy(path.startTangent); }
      else {                                                      // heading follows the eye (the wing always runs across the bottom), pitch follows the course
        camera.getWorldPosition(_cp); path.tangentAt(u, _f); camera.getWorldDirection(_b);
        const hl = Math.hypot(_b.x, _b.z), pp = Math.asin(clamp(_f.y, -1, 1)), pc = Math.asin(clamp(_b.y, -1, 1));
        const pr = pp + Math.min(0, pc - pp) * 0.8;                 // looking down, the wing dips with the eye; looking up, it stays on the course
        if (hl > 0.2) _f.set(_b.x / hl * Math.cos(pr), Math.sin(pr), _b.z / hl * Math.cos(pr)).normalize();
      }
      _l.crossVectors(UP, _f); if (_l.lengthSq() < 1e-6) _l.set(1, 0, 0); _l.normalize(); _up.crossVectors(_f, _l).normalize();
      let roll = 0;
      if (!through) { _cu.setFromMatrixColumn(camera.matrixWorld, 1); const cr = Math.atan2(_cu.dot(_l), Math.max(1e-4, _cu.dot(_up))); roll = cr + clamp(bankAt(u) - cr, -0.09, 0.09); }
      roll += 0.022 * Math.sin(time * 0.9) + 0.012 * Math.sin(time * 2.3);
      const c = Math.cos(roll), s = Math.sin(roll);
      _lx.copy(_l).multiplyScalar(c).addScaledVector(_up, -s); _ux.copy(_up).multiplyScalar(c).addScaledVector(_l, s);
      _m.makeBasis(_lx, _ux, _f);
      _a.copy(_cp).addScaledVector(_lx, -EYE.x).addScaledVector(_ux, -EYE.y + 0.04 * Math.sin(time * 1.3)).addScaledVector(_f, -EYE.z);
      _m.setPosition(_a);
      // our motor runs down from the first stooge to the foot of the hero's hill: fan, two blades, stopped
      hero.setFreeMatrix(2, _m, lerp(0.1, 1, smoothstep(Z_S0, zFoot, ez)));
      // the lemon companion: its heading is the way it is moving (read 2 m of the eye's way ahead); on its stand it sits
      // level, nose down the strip; landed, it sits as it came down
      lemonAt(u, pLemon); lemonAt(u + 2 * mU, _w); _a.copy(_w).sub(pLemon); const moving = _a.length();
      const down = smoothstep(Z_LAND - 14, Z_LAND, ez), away = smoothstep(E_OFF, E_OFF + 8, ez);
      if (moving > 1e-3) _a.multiplyScalar((1 - down) / moving).addScaledVector(LAND_DIR, down).normalize(); else _a.copy(down > 0.5 ? LAND_DIR : REST_DIR);
      const swing = smoothstep(Z_S0, Z_S2, ez) * (1 - smoothstep(Z_S2, Z_S3, ez));
      hero.setFree(1, pLemon, _a, (-0.28 - 0.15 * swing + 0.04 * Math.sin(time * 0.8)) * (1 - down) * away, lerp(0.3, 1, smoothstep(0, Z_S2, ez)));
      // the orange model we pass under: its heading is its course, turned a little with its weave
      const dOr = orangeD(u), bk = bankAt(clamp(dOr / L, 0, 1)), turn = orangeSway(u) * O_SWAY * Math.cos(time * O_SWAY) / 4;
      orangeAt(u, time, pOrange); path.tangentAtDist(dOr, _a); _a.set(_a.x + _a.z * turn, _a.y, _a.z - _a.x * turn).normalize();
      hero.setFree(0, pOrange, _a, bk + 0.03 * Math.sin(time * 0.7), 0.8);
    }

    return {
      scene, path, duration: 50, pace, title: TITLES[hourId],
      camera: { fov: 62, near: 0.25, far: 3400, lookAhead: 22, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: AIRSHIP.open, color: '#F4DE6A', frame: 0, revealDistance: 300, blendDistance: 40 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', companion: 'none', style: 'none',
      update,
      dispose() {},
    };
  },
};
