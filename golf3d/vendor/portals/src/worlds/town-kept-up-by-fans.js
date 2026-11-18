// The Town Kept Up by Fans: a gusty late morning in a town sewn entirely from ripstop nylon and held up by fans.
// Style: sewn inflatables under the engine's flat switch. Everything visible is made with the one makeStyle
// instance of src/parts/town-kept-up-by-fans.js: pillow panels with analytic normals, six cloths, webbing (black for the fan drums with their discs and collars, the big fan's guard hoops, spokes and skids, the balloons' lines, the Tall Tower's sewn straps, loops, D-rings and patch hems, and the pegs that are no strap's (hem, lane edge, the kite's); the strap's white for every strap with its D-ring and peg and, since the seventh, for the bunting strings and the windsock fishes' mouth hoops; the hoses the carts' yellow cloth),
// one pale tarpaulin, one flat sky. No lights, no textures, no full-screen pass; no fog pass either: THE AIR is in the cloth's and the
// floor's own shaders (far things go toward the tone of the sky cloth's low strip by their distance from the eye: paler at the pale
// hours, deeper under the engine's night; the part's uHaze).
// Coordinates: +Z is the course, ground y 0. The keep (the hero) stands across the avenue's end, z 400..520.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeStyle, buildHero, PALETTE, PLAZA, STRAP_CLOTH } from '../parts/town-kept-up-by-fans.js';

const DURATION = 41;
const COLOURWAYS = {
  // red (keep), yellow, blue (towers), green (hummocks), white, pink, sky
  primaries: PALETTE,
  sherbet: ['#D81E5B', '#FFE66D', '#B79CED', '#8FE3C0', '#F7F5EE', '#FFAE8A', '#6FA8E8'],
  regatta: ['#D62828', '#F7F5EE', '#1D4E9E', '#3F7FE0', '#F7F5EE', '#E5352B', '#6FA8E8'],
};
// blue hour: every swatch two tones deeper, no lamps
function deeper(hex, k) { const c = new THREE.Color(hex), n = new THREE.Color('#1A2A78'); c.multiplyScalar(1 - 0.38 * k).lerp(n, 0.3 * k); return '#' + c.getHexString(); }

export default {
  id: 'town-kept-up-by-fans',
  name: 'The Town Kept Up by Fans',
  category: 'city',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, Q = ctx.quality || { detail: 1 };
    const detail = clamp(Q.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const vr = rng.fork('looks');
    // ---- the seeded looks ---------------------------------------------------------------------------
    const seededHour = vr.pick(['day', 'day', 'day', 'golden', 'golden', 'dawn']);
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : seededHour;
    if (!['day', 'golden', 'dawn', 'night'].includes(hour)) hour = 'day';
    const colourway = vr.pick(['primaries', 'primaries', 'primaries', 'sherbet', 'regatta']);
    const weather = vr.pick(['gusty', 'gusty', 'squally', 'calm']);
    const socks = vr.pick(['fish', 'fish', 'sock']);
    const rare = !!vary.rare;
    let hexes = COLOURWAYS[colourway].slice();
    let tarpHex = '#DDE6D0';
    if (hour === 'night') { hexes = hexes.map((h, i) => (i === 6 ? '#2B4A9A' : deeper(h, 1))); tarpHex = '#8FA0C4'; }
    // the sun: +X is the camera's left on this course. Late morning 62 degrees up; golden low behind and left;
    // dawn low ahead and left (never behind the arch, which lies to the right of the course)
    const sun = hour === 'golden' ? new THREE.Vector3(0.62, 0.40, -0.68) : hour === 'dawn' ? new THREE.Vector3(0.80, 0.42, 0.42)
      : hour === 'night' ? new THREE.Vector3(0.5, 0.62, -0.6) : new THREE.Vector3(0.441, 0.883, 0.161);
    const style = makeStyle(ctx, { palette: hexes, sun });
    const { pal, CLOTH } = style, SU = style.uniforms;
    pal.tarp.set(tarpHex);
    const gustPeriod = weather === 'squally' ? 5 : 9, gustFold = weather === 'squally' ? 2.75 : weather === 'calm' ? 0.3 : 2.3;
    SU.uGust.value.set(-0.2, 0.98, 60, gustPeriod); SU.uWind.value.set(-0.2, 0.98);
    SU.uOut.value.set(1e6, 3, 120, 470);
    await ctx.yield();

    const scene = new THREE.Scene();
    scene.background = pal.sky.clone();        // (under the sky cloth below: what shows if it is ever missed)
    // ---- the sky cloth: three flat strips sewn edge to edge with scalloped seams, each paler toward the hem, the low ones warmed on the sun's side.
    //      Drawn at the far plane round whatever camera looks (no position to follow), flat colours, nothing above 1. ----
    {
      const nightK = hour === 'night' ? 0.45 : 1, warmK = hour === 'golden' || hour === 'dawn' ? 0.85 : hour === 'night' ? 0 : 0.6;
      const top = pal.sky.clone(), mid = pal.sky.clone().lerp(pal.white, 0.16 * nightK), low = pal.sky.clone().lerp(pal.white, 0.34 * nightK);
      const warm = new THREE.Color('#FFE3B8');
      SU.uHaze.value.set(low.r, low.g, low.b, 0.62);      // (polish round air) THE AIR: far cloth, far washes and far floor go toward the tone of the sky's low strip (the part's airAt), so the far town lies in layers behind the near one
      const sxz = new THREE.Vector2(sun.x, sun.z); if (sxz.length() < 1e-3) sxz.set(1, 0); sxz.normalize();
      const skyMat = new THREE.ShaderMaterial({
        uniforms: { uTop: { value: top }, uMid: { value: mid }, uLow: { value: low }, uWarm: { value: warm }, uSunXZ: { value: sxz }, uWarmK: { value: warmK } },
        vertexShader: /* glsl */`varying vec3 vDir;
          void main(){ vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
        fragmentShader: /* glsl */`uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow; uniform vec3 uWarm; uniform vec2 uSunXZ; uniform float uWarmK; varying vec3 vDir;
          void main(){
            vec3 d = vDir / max(length(vDir), 1e-4); float e = d.y;
            vec2 h = d.xz / max(length(d.xz), 1e-4);
            float w = smoothstep(-0.35, 0.95, dot(h, uSunXZ)); w = w * w * uWarmK;
            // the strips rise a little on the sun's side, so the warm part of the sky is also the tallest pale part
            float lift = 0.05 * w;
            // the strips are SEWN edge to edge, not blended: each join is a crisp scalloped seam (one pillow every few degrees), like the hem
            float az = abs(h.x) + abs(h.y) > 1e-3 ? atan(h.x, h.y) : 0.0, fe = max(fwidth(e), 1e-5);
            float a = smoothstep(-fe, fe, e - (0.04 + lift) - 0.011 * abs(sin(az * 30.0))), b = smoothstep(-fe, fe, e - (0.185 + 1.6 * lift) - 0.016 * abs(sin(az * 22.0 + 0.7)));
            vec3 lowC = mix(uLow, uWarm, 0.5 * w), midC = mix(uMid, uWarm, 0.3 * w), topC = mix(uTop, uMid, 0.3 * w * (1.0 - smoothstep(0.3, 0.75, e)));
            vec3 col = mix(lowC, midC, a); col = mix(col, topC, b);
            gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0); }`,
        side: THREE.BackSide, depthWrite: false, depthTest: true,
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), skyMat); dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    }

    // ---- the path -----------------------------------------------------------------------------------
    const KZ = 460;                             // the keep's centre
    const END = new THREE.Vector3(-71.4, 8, 712.4), TOP = new THREE.Vector3(-17, 70, 513);
    const wob = vr.range(0.7, 1);          // (the side is fixed: each stretch of the avenue is composed for the side it is seen from)
    const line = (f) => [lerp(TOP.x, END.x, f), lerp(TOP.y, END.y, f), lerp(TOP.z, END.z, f)];
    const path = makePath([
      // the avenue: low on the left for the hall being blown up on the right, up and across to the right for the slide on the left,
      // back to the left for the church in its opening on the right, then to the middle for the plaza
      [0, 2.5, 0], [1.0 * wob, 2.6, 30], [4.2 * wob, 3.0, 60], [-4.4 * wob, 9.5, 120], [4.4 * wob, 8.0, 186], [-1.6 * wob, 11.4, 248],
      // over the front crest (the Tall Tower stands at x -30, z 452, 8.7 m in radius)
      // (after the crest the flight swings 30 m out to the left over the courtyard, so that the Tall Tower stands off to the right at
      // some 55 m, both its edges and its foot in the frame, instead of sliding by at arm's length)
      // (the swing starts at z 414 and is done by z 444: across the yard the tower's axis is never nearer
      // than 46 m; the course comes nearest it, 41 m, further on, as it rounds the tower)
      [-1, 25, 290], [-1.2, 43, 328], [-1.6, 55, 362], [-1.7, 59.2, 398], [-1.65, 60.3, 407], [-1.6, 61.0, 413.5], [0.6, 61.3, 417.5], [7, 61.7, 423], [15, 62.1, 429.5], [21.3, 62.5, 436.5], [24.9, 62.8, 443.5], [25.2, 63.1, 450], [15, 70, 467], [-11, 71, 493],
      // the dive: steep off the back wall into the town (23 degrees), easing to a low run between the far avenue's
      // air-dancers and house fronts; the last 80 m are one straight line 10.5 degrees down to the arch
      ...[[0.1, 65], [0.24, 53], [0.38, 40], [0.51, 30], [0.64, 22.4], [0.8, 16], [0.9, 12], [1, 8]].map(([f, y]) => { const q = line(f); q[1] = y; return q; }),
    ]);
    // script seconds as a function of u: the brief's clock, pinned to places (entry 0 s, first house 5 s, the keep
    // slumped 14 s, the front crest 23 s, the back wall 31 s, the arch 41 s)
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const KEYS = [[0, 0], [uAt(2.4 * wob, 55), 5], [uAt(-1.6 * wob, 253), 14], [uAt(-2, 407), 23], [uAt(TOP.x, 513), 31], [1, 41]];
    const secOf = (u) => {
      for (let i = 1; i < KEYS.length; i++) if (u <= KEYS[i][0]) { const a = KEYS[i - 1], b = KEYS[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / Math.max(b[0] - a[0], 1e-5); }
      return 41;
    };
    const uOfSec = (s) => {
      for (let i = 1; i < KEYS.length; i++) if (s <= KEYS[i][1]) { const a = KEYS[i - 1], b = KEYS[i]; return a[0] + (b[0] - a[0]) * (s - a[1]) / (b[1] - a[1]); }
      return 1;
    };
    // speed along the path, relative: the slope of u over script seconds, smoothed
    const pace = (u) => {
      let v = 0, w = 0;
      for (let k = -3; k <= 3; k++) { const uu = clamp(u + k * 0.012, 0, 1), s = secOf(uu), g = (uOfSec(Math.min(41, s + 0.4)) - uOfSec(Math.max(0, s - 0.4))) / 0.8; v += g; w++; }
      return lerp(clamp((v / w) * DURATION, 0.5, 1.8), 1, smoothstep(0.84, 0.93, u));     // the approach to the arch is unhurried
    };
    await ctx.yield();

    // ---- THE COURSE AS A PLACE: its line taken at even steps of route metres, from the first metre to the last. Whatever keeps clear of
    //      the course is tested against these points where it is placed, the same whether we are there or not. ----------------------------
    const TRACK = []; { const p = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 2.5) { path.posAtDist(d, p); TRACK.push([p.x, p.y, p.z]); } }
    // ONE CLEARANCE IN THE PLAN for every upright thing (a mast and its posts, the poles of the high
    // string, a steeple, a slide, a far dancer, a small dancer, a fish's pole off the avenue's rows, a kite
    // on its line): its foot stands no nearer the course's ground track than its own height h. One that
    // fails is moved straight away from the course, with its plot and whatever hangs on it, never removed.
    // Returns where it stands. (The avenue's two rows with what stands on them, the entry's poles, the
    // keep, the Tall Tower, the banded gate and the arch are flown to: they are not put through it.)
    const standClear = (x, z, h) => {
      for (let pass = 0; pass < 8; pass++) {
        let best = 1e9, bx = 0, bz = 0;
        for (const q of TRACK) { const d = Math.hypot(x - q[0], z - q[2]); if (d < best) { best = d; bx = q[0]; bz = q[2]; } }
        if (best >= h) break;
        let ux = x - bx, uz = z - bz; const l = Math.hypot(ux, uz); if (l < 1e-3) { ux = 1; uz = 0; } else { ux /= l; uz /= l; }
        x = bx + ux * (h + 0.5); z = bz + uz * (h + 0.5);
      }
      return [x, z];
    };
    // THE SKY'S CLEARANCE: nothing that flies comes nearer the course's LINE (in space) than `clear` metres from its middle (x, y, z);
    // one that fails is moved level and straight away from the course, never left out
    const flyClear = (x, y, z, clear) => {
      for (let pass = 0; pass < 12; pass++) {
        let best = 1e9, b = null;
        for (const q of TRACK) { const d = Math.hypot(x - q[0], y - q[1], z - q[2]); if (d < best) { best = d; b = q; } }
        if (best >= clear) break;
        let ux = x - b[0], uz = z - b[2]; const l = Math.hypot(ux, uz); if (l < 1e-3) { ux = 1; uz = 0; } else { ux /= l; uz /= l; }
        const flat = Math.sqrt(Math.max(1, clear * clear - (y - b[1]) * (y - b[1]))) + 1;
        x = b[0] + ux * flat; z = b[2] + uz * flat;
      }
      return [x, z];
    };

    // every batch of static stuff (pegs, poles, tethers, hem) goes into one mesh drawn with the keep's kind of skin
    const statics = style.batch();
    const disposables = [];
    let archDrums = [];
    const movers = [];                          // per-frame jobs: (dt, time, scriptSeconds, camera) => void
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0);
    // an InstancedMesh of one of the style's bodies: per-instance pressure state lives in iBody / iState
    function instGeo(base, iB, iS) {
      const g = new THREE.BufferGeometry();
      for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
      g.setIndex(base.index);
      g.setAttribute('iBody', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iState', new THREE.InstancedBufferAttribute(iS, 4));
      return g;
    }
    function instanced(geo, mat, list, iB, iS, order = 0) {
      const m = new THREE.InstancedMesh(instGeo(geo, iB, iS), mat, list.length);
      for (let i = 0; i < list.length; i++) {
        const o = list[i]; Q4.setFromAxisAngle(YAX, o.rot || 0); V3.set(o.x, o.y || 0, o.z); S3.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1);
        m.setMatrixAt(i, M4.compose(V3, Q4, S3));
      }
      m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m;
    }
    const cl = (name) => CLOTH[name];
    const TREE_CLOTHS = [cl('YELLOW'), cl('PINK'), cl('GREEN'), cl('WHITE'), cl('RED')];
    const HOUSE_WALLS = [cl('WHITE'), cl('YELLOW'), cl('PINK'), cl('GREEN'), cl('RED'), cl('WHITE'), cl('YELLOW')];
    const pick2 = (r, arr, not) => { let c = r.pick(arr), n = 0; while (c === not && n++ < 8) c = r.pick(arr); return c; };

    // ---- ground: one taut pale tarpaulin out to its hem at 1,200 m, then sky ---------------------------
    const CX = 0, CZ = 400, HEM = 1200;
    {
      const g = new THREE.CircleGeometry(HEM + 6, 120); g.rotateX(-Math.PI / 2);
      const ground = new THREE.Mesh(g, style.ground()); ground.position.set(CX, 0, CZ); ground.renderOrder = -0.5; ground.frustumCulled = false; scene.add(ground);
      // the same sheet again 9 m under the floor (hidden by the real one in flight): through the previous world's portal the
      // lower rays start below y 0, and without it the opening shows sky under the town
      const under = new THREE.Mesh(g, ground.material); under.position.set(CX, -9, CZ); under.renderOrder = -0.6; under.frustumCulled = false; scene.add(under);
      // the hem: a rolled, scalloped edge (one fat pillow per 60 m), pegged; white cloth
      await style.quiltY(statics, { nu: 120, nv: 1, su: 4, sv: 2, bulge: 9, tuft: false, body: 0, cloth: cl('WHITE'),
        P: (u, v, out) => { const a = Math.PI * 2 * u, r = HEM - 6 + 22 * v; out[0] = CX + r * Math.sin(a); out[1] = 0.2 + 7 * Math.sin(Math.PI * v); out[2] = CZ + r * Math.cos(a); } }, ctx, 12);
      for (let i = 0; i < 120; i++) { const a = Math.PI * 2 * i / 120, s = Math.sin(a), c = Math.cos(a); style.ribbon(statics, [[CX + (HEM + 4) * s, 5, CZ + (HEM + 4) * c], [CX + (HEM + 24) * s, 0.2, CZ + (HEM + 24) * c]], 2.2, cl('WEB'), 0); }
    }
    await ctx.yield();

    // ---- the hero: the keep, turned so its gate faces the entry ----------------------------------------
    const hero = await buildHero(ctx, { style, detail, duration: DURATION });
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, KZ); scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const W = (v) => new THREE.Vector3(-v.x, v.y, KZ - v.z);       // hero local -> world
    const A = hero.anchors;
    await ctx.yield();

    // ---- far avenue frame: from the keep's back down to the finish arch ----------------------------------
    const FDIR = new THREE.Vector3(END.x - TOP.x, 0, END.z - TOP.z).normalize(), FSIDE = new THREE.Vector3(FDIR.z, 0, -FDIR.x);
    const FROT = Math.atan2(FDIR.x, FDIR.z), F0 = new THREE.Vector3(TOP.x, 0, TOP.z + 8);
    const farAxisDist = (x, z) => { const dx = x - F0.x, dz = z - F0.z, t = dx * FDIR.x + dz * FDIR.z, s = dx * FSIDE.x + dz * FSIDE.z; return { t, s }; };
    SU.uLaneB.value.set(F0.x, F0.z, FDIR.x, FDIR.z);          // the ground draws its lane tape down the far avenue too
    const inKeep = (x, z, m) => Math.abs(x) < 85 + m && z > 392 - m && z < 528 + m;

    // ---- geometry of the air-dancer, in two details -------------------------------------------------------
    // 25 m tube, 2.2 m thick, on a black fan drum; two 9 m arm tubes; a fringe at the open top; no face
    const dancerHi = style.batch(); style.airDancer(dancerHi, 3);
    for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), l = 1.6 + 1.3 * ((i * 7) % 5) / 4;
      style.ribbon(dancerHi, [[c * 0.9, 24.6, s * 0.9], [c * (1.3 + 0.5 * l), 24.9 + l, s * (1.3 + 0.5 * l)]], 0.34, 0, 0); }
    // webbing collar and two D-ring straps at the foot, the fan's sleeve seam
    style.quilt(dancerHi, { nu: 4, nv: 1, su: 2, sv: 1, bulge: 0.05, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 1.78 * Math.cos(a); out[1] = 1.45 + 0.6 * v; out[2] = 1.78 * Math.sin(a); } });
    const dancerLo = style.batch();
    style.quilt(dancerLo, { nu: 5, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 1.7 * Math.cos(a); out[1] = 1.6 * v; out[2] = 1.7 * Math.sin(a); } });
    style.tube(dancerLo, { x: 0, z: 0, ys: [1.2, 9, 17, 25], rad: (y) => 1.15 * (1 + 0.25 * Math.exp(-(y - 1.2) * 0.8)), gores: 4, sub: 2, sv: 2, bulge: 0.2, tuftK: 0.05, cloth: 0 });
    for (const sd of [-1, 1]) style.armTube(dancerLo, sd, { gores: 3, su: 2, sv: 3, tip: 1, bulge: 0.2 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); style.ribbon(dancerLo, [[c * 1.05, 24.8, s * 1.05], [c * 2.2, 27.4, s * 2.2]], 0.8, 0, 0); }
    const dancerHiGeo = dancerHi.geometry(), dancerLoGeo = dancerLo.geometry();
    disposables.push(dancerHiGeo, dancerLoGeo);
    await ctx.yield();

    // ---- where the air-dancers stand ----------------------------------------------------------------------
    const STREETS = []; for (let z = -366; z <= 1260; z += 72) STREETS.push(z);          // cross streets (centre lines)
    const dHi = [], dLo = [];
    const dr = rng.fork('dancers');
    const mkDancer = (x, z, cloth, rot, r = dr) => ({ x, z, rot: rot ?? r.range(-0.5, 0.5), cloth, hinge: r.range(0.42, 0.56), ph: r(), soft: 0, born: 0, s: r.range(0.94, 1.06) });
    const fpos0 = (t, s) => [F0.x + FDIR.x * t + FSIDE.x * s, F0.z + FDIR.z * t + FSIDE.z * s];
    // the avenue: facing pairs every 16 m at x -13 and +13; the first pair is yellow and pink
    // the first pair stands 46 m in so that the second is whole in the entry frame; from z 190 the rows open into a plaza
    // before the keep (the wall and the Tall Tower stand clear in the gap); in the middle stretch the arms lie along the rows
    const rowX = (z) => 13 + 4.5 * smoothstep(52, 150, z) + 20.5 * smoothstep(140, 330, z);      // the rows open a little all the way, so the wall and its tower stand whole in the gap from the first frame
    // ---- THE TOWN'S BIG THINGS: one record each, made here and read by its builder, by the plots of the houses, by the far avenue's
    //      dancers and by the gaze alike (its place; its size from its geometry and its scale). No place of theirs is typed twice (some sizes are: the heights below and the gate's leg are typed again where each body is built).
    const HW = 5, HD = 6, WALL = 6.6, RISE = 4.6;                    // the house loaf (houseGeo below)
    const STEEPLE_H = 46.7, SLIDE_H = 29, GATE_H = 29;               // the big bodies as built (their builders below): foot to the ball's top, to the canopy's top, to the crown
    const rowHouseX = (sd, z) => sd * (13.5 + rowX(z));              // where a house of the avenue's rows stands
    const REC = {};
    {
      const loaf = (x, z, rot, sx, sy, sz) => ({ x, z, rot, sx, sy, sz, h: (WALL + RISE) * sy, fx: HW * 1.2 * sx, fz: HD * 1.22 * sz, cz: 0 });
      const round = (x, z, rot, sxz, sy) => { const h = STEEPLE_H * sy, q = standClear(x, z, h); return { x: q[0], z: q[1], rot, sxz, sy, h, fx: 4.1 * sxz, fz: 4.1 * sxz, cz: 0 }; };
      const slide = (x, z, rot, sc) => { const h = SLIDE_H * sc, q = standClear(x, z, h); return { x: q[0], z: q[1], rot, s: sc, h, fx: 6.7 * sc, fz: 14.75 * sc, cz: -3.75 * sc }; };
      // the near avenue: the hall being blown up and the bouncy church (its nave in an opening of the right-hand row, its steeple
      // before it), the slide in a gap of the left-hand row
      REC.hall = loaf(rowHouseX(-1, 97) - 6.5, 106, Math.PI / 2, 2.2, 2.0, 1.9);
      REC.nave = loaf(rowHouseX(-1, 251) - 12.5, 251, Math.PI / 2, 1.9, 2.0, 2.1);
      REC.steeple = round(-47, 231, 0.8, 0.9, 0.9);
      REC.slide = slide(49, 196, -Math.PI / 2, 1.3);
      // the far quarter: the second church (the same nave; its steeple stands by it as the near steeple stands by the near nave, the
      // offset turned with the nave), a bell tower, the far slide, and the banded gate across the far avenue
      { const q = fpos0(118, 38); REC.farNave = loaf(q[0], q[1], FROT - Math.PI / 2, 1.9, 2.0, 2.1); }
      { const ox = REC.steeple.x - REC.nave.x, oz = REC.steeple.z - REC.nave.z, a = REC.farNave.rot - REC.nave.rot, c = Math.cos(a), sn = Math.sin(a);
        REC.farSteeple = round(REC.farNave.x + ox * c + oz * sn, REC.farNave.z - ox * sn + oz * c, 0.3, 1.65, 1.25); }
      { const q = fpos0(78, -40); REC.bell = round(q[0], q[1], 1.1, 1.12, 1.12); }
      { const q = fpos0(172, -45); REC.farSlide = slide(q[0], q[1], FROT + Math.PI / 2, 1.6); }
      { const q = fpos0(46, 0); REC.gate = { x: q[0], z: q[1], rot: FROT, s: 1.55, h: GATE_H * 1.55, open: (12 + 14 - 3) * 1.55, legX: 14 * 1.55, legR: 3 * 1.55 }; }      // (open: floor to the inside of its crown, as built)
    }
    // a plot is clear of houses where a big thing of the far quarter stands, and nowhere else: its footprint in the far avenue's own
    // frame (t along, s across) with a margin of m metres
    const PLOTTED = [REC.farNave, REC.farSteeple, REC.bell, REC.farSlide];
    const onPlot = (t, s, m) => PLOTTED.some((r) => { const a = r.rot - FROT, ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const f = farAxisDist(r.x + Math.sin(r.rot) * r.cz, r.z + Math.cos(r.rot) * r.cz);
      return Math.abs(t - f.t) < sa * r.fx + ca * r.fz + m && Math.abs(s - f.s) < ca * r.fx + sa * r.fz + m; });      // (a body's front, local +z, lies at the angle a from the avenue's direction)
    await ctx.yield();
    const FRONT_T0 = 24, FRONT_STEP = 14, FRONT_S = 32;              // the far avenue's front rows of houses: the first plot, the pitch, how far off the axis
    for (let k = 0, z = 46; z < 384; z += 16, k++) {
      const c0 = k === 0 ? cl('YELLOW') : dr.pick(TREE_CLOTHS), c1 = k === 0 ? cl('PINK') : pick2(dr, TREE_CLOTHS, c0);
      const along = z < 250, r0 = dr.range(-0.5, 0.5), r1 = dr.range(-0.5, 0.5);
      dHi.push(mkDancer(rowX(z), z, c0, along ? Math.PI / 2 - 0.5 + 0.5 * r0 : r0), mkDancer(-rowX(z), z, c1, along ? -Math.PI / 2 + 0.5 + 0.5 * r1 : r1));
      if (hour === 'dawn' && z > 60 && z < 215) { dHi[dHi.length - 1].born = Math.max(0.1, secOf(uAt(0, z)) - 6.6 + dr.range(-0.4, 0.4)); dHi[dHi.length - 2].born = Math.max(0.1, secOf(uAt(0, z)) - 6.2 + dr.range(-0.4, 0.4)); }
      if (z === 78 || z === 94 || z === 110 || z === 206 || z === 222 || z === 238 || z === 254) dHi.pop();          // gaps in the right-hand row: the hall being born behind it is seen whole, and the church stands in its opening
      if (z === 142 || z === 158) dHi.splice(dHi.length - 2, 1);          // a gap in the left-hand row: the slide behind it
    }
    // two on the sun's side where the flight comes in, standing just outside the first frame: what they give the picture is
    // their shadows, whole (trunk, both arms, fringe) across the lane from its left edge to past the yellow tape
    for (const [x, z, c, rot, sc] of [[64, -72, cl('PINK'), 1.2, 1.25], [-60, -80, cl('GREEN'), 0.75, 1.15]]) { const d = mkDancer(x, z, c, rot); d.s = sc; d.hinge = 0.5; d.entry = true; dHi.push(d); }
    // the far avenue, down to the arch
    // Every pair that is drawn stands, at the design's height (a tube 25 m tall), each dancer in a gap
    // between two house fronts of its own side: the gaps of the front row's own pitch, free where the
    // tallest dancer can stand clear of every big thing's plot (gapTaken); the pairs take them in the order
    // of the row, each the nearest one left to its turn. There it stands back from the course by the one
    // clearance in the plan (its foot no nearer the course's ground track than it is tall) and clear of the
    // banded gate's legs; once the front houses are laid it is set in the middle between its two
    // neighbours' eaves (below). Its arms lie along the row. (A departure from the brief's 'fringes 8 m
    // either side': at 8 m a tube 25 m tall stands nearer the course than it is tall.)
    {
      const turns = []; for (let t = 22; t < 196; t += 16) turns.push(t);
      const gaps = {}, last = { 1: -1, [-1]: -1 };
      // a gap is free where a dancer can stand in it: the plots are tested at the place where the tallest
      // dancer drawn would stand in it after the one clearance (27.6 m x 1.06 from the course's ground
      // track), with its drum (1.7 m x 1.06) for a margin
      const gapTaken = function (tg, sd) {
        const q = fpos0(tg, sd * (FRONT_S - HD)), c = standClear(q[0], q[1], 27.6 * 1.06);
        const f = farAxisDist(c[0], c[1]);
        return onPlot(f.t, f.s, 1.7 * 1.06); };
      for (const sd of [-1, 1]) { gaps[sd] = []; for (let tg = FRONT_T0 - FRONT_STEP / 2; tg < turns[turns.length - 1] + FRONT_STEP / 2; tg += FRONT_STEP) if (!gapTaken(tg, sd)) gaps[sd].push(tg); }
      turns.forEach((t, i) => {
        const c0 = dr.pick(TREE_CLOTHS), c1 = pick2(dr, TREE_CLOTHS, c0);
        for (const sd of [-1, 1]) {
          const d = mkDancer(0, 0, sd > 0 ? c0 : c1, FROT + (t > 30 ? sd * (Math.PI / 2 - 0.25) + dr.range(-0.2, 0.2) : dr.range(-0.4, 0.4)));
          const g = gaps[sd], hi = g.length - (turns.length - i); let tg = t, bi = -1;
          for (let j = last[sd] + 1; j <= Math.max(hi, last[sd] + 1) && j < g.length; j++) if (bi < 0 || Math.abs(g[j] - t) < Math.abs(g[bi] - t)) bi = j;
          if (bi >= 0) { tg = g[bi]; last[sd] = bi; }
          const q = fpos0(tg, sd * (FRONT_S - HD)), c = standClear(q[0], q[1], 27.6 * d.s);
          // (and its drum stands half a metre clear of the banded gate's two legs, from the gate's own record:
          // legX either side of its middle, legR in radius. One nearer a leg is moved straight away from the leg,
          // the least way.)
          for (const lg of [-1, 1]) {
            const g = REC.gate, lx = g.x + FSIDE.x * lg * g.legX, lz = g.z + FSIDE.z * lg * g.legX;
            const off = Math.hypot(c[0] - lx, c[1] - lz), need = g.legR + 1.7 * d.s + 0.5;
            const push = Math.max(0, need - off) / Math.max(off, 1e-3);
            c[0] += (c[0] - lx) * push; c[1] += (c[1] - lz) * push; }
          d.x = c[0]; d.z = c[1]; d.far = true; dHi.push(d);
        }
      });
    }
    await ctx.yield();
    // cross streets: pairs marching away from both avenues, thinned by detail
    {
      const cand = [];
      for (const z of STREETS) for (let x = -690; x <= 690; x += 24) {
        if (Math.abs(x) < Math.max(30, rowX(z) + 13) || inKeep(x, z, 22)) continue;
        const f = farAxisDist(x, z); if (f.t > -16 && f.t < 346 && Math.abs(f.s) < 134) continue;
        if (Math.hypot(x - CX, z - CZ) > 700) continue;
        // how much the flight sees of it: near the avenue's crossings and all over the town beyond the keep
        const w = (z > 0 && z < 400 ? 1.6 - Math.abs(x) / 200 : z >= 400 ? 1.5 - Math.hypot(x + 40, z - 700) / 620 : 0.1) + dr() * 0.5;
        cand.push({ x, z, w });
      }
      cand.sort((a, b) => b.w - a.w);
      // the far quarter's own: a line of dancers down every cross alley and along the two lanes of each side, so that a gust
      // front crossing the town is seen as a bow of bending tubes
      const qd = rng.fork('quarter-dancers');
      for (const sd of [1, -1]) {
        for (const t of [63.5, 144.5, 225.5]) for (const sa of [57, 74, 92, 111]) { const [x, z] = fpos0(t + qd.range(-1, 1), sd * sa); if (!inKeep(x, z, 16)) dLo.push(mkDancer(x, z, qd.pick(TREE_CLOTHS), undefined, qd)); }
        for (const sl of [55.25, 92.25]) for (let t = 23; t < 300; t += 27) { if (Math.abs(((t + 4) / 13.5) % 6 - 5.5) < 0.8 || (sd < 0 && sl < 60 && Math.abs(t - 172) < 20)) continue; const [x, z] = fpos0(t, sd * sl + qd.range(-1, 1)); if (!inKeep(x, z, 16)) dLo.push(mkDancer(x, z, qd.pick(TREE_CLOTHS), undefined, qd)); }
      }
      dLo.sort((a, b) => Math.abs(farAxisDist(a.x, a.z).s) - Math.abs(farAxisDist(b.x, b.z).s));      // (the far quarter's, nearest the far avenue first)
      const n = Math.min(cand.length, 80, Math.round(60 * detail * density));
      for (let i = 0; i < n; i++) dLo.push(mkDancer(cand[i].x + dr.range(-2, 2), cand[i].z + (i % 2 ? 4.5 : -4.5), dr.pick(TREE_CLOTHS)));
    }
    // the soft dozen: under-inflated, leaning and wrinkled until a cart arrives
    for (let i = 0; i < 7; i++) { const d = dHi[2 + Math.floor(dr() * (dHi.length - 2))]; d.soft = dr.range(0.45, 0.8); }
    for (let i = 0; i < 12; i++) { const d = dLo[Math.floor(dr() * dLo.length)]; if (d) d.soft = dr.range(0.4, 0.8); }
    for (const d of dHi) if (d.entry || d.far) d.soft = 0;
    for (const d of dLo) d.s *= 0.7;
    // one clearance for all: the small dancers of the cross streets and of the far quarter are put through it like every upright thing
    for (const d of dLo) { const c = standClear(d.x, d.z, 27.6 * d.s); d.x = c[0]; d.z = c[1]; }
    // and each stands clear of the two towers that the clearance stood in the lanes of the far quarter (the
    // far steeple, the bell tower): its drum half a metre from the tower's collar. One that is nearer is
    // moved along the far avenue's direction, the least way; none is left out. (f: where it stands from the
    // tower's middle, along and across.)
    for (const d of dLo) for (const r of [REC.farSteeple, REC.bell]) {
      const f = farAxisDist(d.x - r.x + F0.x, d.z - r.z + F0.z), need = r.fx + 1.7 * d.s + 0.5;
      const reach = Math.sqrt(Math.max(0, need * need - f.s * f.s));
      const push = Math.max(0, reach - Math.abs(f.t)) * (Math.sign(f.t) || 1);
      d.x += FDIR.x * push; d.z += FDIR.z * push;
    }
    {
      const fixed = (v) => Object.assign(() => v, { range: (a, b) => a + (b - a) * v });          // (no draw from any seeded stream)
      for (const sd of [1, -1]) { const q = fpos0(225.5, sd * 40), d = mkDancer(q[0], q[1], sd > 0 ? cl('YELLOW') : cl('GREEN'), FROT + 0.3 * sd, fixed(0.5 + 0.2 * sd)); d.s *= 0.7; dLo.unshift(d); }
    }
    await ctx.yield();
    // ---- houses: loaves. Four pillow walls, a bulging gabled roof in a second cloth, door and windows sewn on,
    //      guy lines to pegs, a fan drum at one corner joined to the wall by a fat sleeve. Front = local +z. ------
    // the front wall's surface (local z) at x, y: the superellipse section, its swell with height and the pillow bulge of its panels
    const wallZ = (x, y, hi) => { const rows = hi ? 2 : 1, q = 2 * ((clamp(y / WALL, 0, 0.999) * rows) % 1) - 1, k = 0.96 + 0.1 * Math.sin(Math.PI * clamp(y / WALL, 0, 1));
      const cs = Math.pow(Math.min(1, Math.abs(x) / (HW * k)), 1 / 0.45), sn = Math.pow(Math.sqrt(Math.max(0, 1 - cs * cs)), 0.45);
      return HD * sn * k + (hi ? 0.5 : 0.85) * Math.sin(Math.PI * Math.min(1, Math.abs(x) / (HW * 0.95))) * (1 - q * q * q * q); };
    function houseGeo(hi) {
      const B = style.batch(), e = 0.45, sub = hi ? 4 : 2;
      const sq = (c) => Math.sign(c) * Math.pow(Math.abs(c), e);
      style.quilt(B, { nu: hi ? 8 : 4, nv: hi ? 2 : 1, su: hi ? 3 : 2, sv: hi ? 3 : 2, bulge: hi ? 0.5 : 0.85, cloth: 0,
        P: (u, v, out) => { const a = Math.PI * 2 * u + Math.PI / 4, k = 0.96 + 0.1 * Math.sin(Math.PI * v); out[0] = HW * sq(Math.cos(a)) * k; out[1] = 0.05 + WALL * v; out[2] = HD * sq(Math.sin(a)) * k; } });
      // the roof: a closed pillow loaf in the second cloth. Seams along the ridge, the eaves and under the belly, a seam
      // ring at each gable; the ridge and eaves are round, the gable ends bulge shut
      const pw = (c, k) => Math.sign(c) * Math.pow(Math.abs(c), k), Y0 = WALL - 0.55, YC = Y0 + RISE * 0.3;
      style.quilt(B, { nu: hi ? 6 : 4, nv: 3, vEdges: [0, 0.1, 0.9, 1], su: hi ? 4 : 2, sv: hi ? 3 : 1, bulge: hi ? 0.3 : 0.38, cloth: 1, flip: true,
        P: (u, v, out) => { const a = Math.PI * 2 * u + Math.PI / 2, c = Math.cos(a), sn = Math.sin(a), zn = 2 * v - 1, k = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(zn), 6)));
          const y = sn > 0 ? RISE * 1.08 * Math.pow(sn, 0.88) : -1.0 * Math.pow(-sn, 0.7);          // a fat cushion: the eaves are round, no corner anywhere on the outline
          out[0] = HW * 1.2 * pw(c, 0.8) * k; out[1] = YC + (Y0 + y - YC) * k; out[2] = HD * 1.22 * zn; } });
      // door and windows: sewn-on panels of a third cloth, each with its own seam all round
      // (each lies on the wall's own bulge: the front wall is two pillow panels across, one or two up)
      // round: a porthole cushion (the square is drawn in to a disc, so it has no corner) swelling out of the wall
      const panel = (x, y, w, h, cloth, s, round) => style.quilt(B, { nu: 1, nv: 1, su: s, sv: s, bulge: round ? 0.34 : 0.14, cloth,
        P: (u, v, out) => { const a = 2 * u - 1, b = 2 * v - 1, ka = round ? Math.sqrt(1 - 0.5 * b * b) : 1, kb = round ? Math.sqrt(1 - 0.5 * a * a) : 1;
          out[0] = x - a * w * ka; out[1] = y + b * h * kb; out[2] = wallZ(out[0], out[1], hi) + (round ? 0.02 : 0.06); } });
      panel(0, 2.3, 1.1, 2.1, cl('PINK'), hi ? 2 : 1);
      if (hi) {
        panel(-3.0, 3.6, 1.15, 1.2, cl('WHITE'), 4, true); panel(3.0, 3.6, 1.15, 1.2, cl('WHITE'), 4, true);
        // the fan drum on its side at a back corner, and its sleeve into the wall
        const fx = HW + 2.6, fz = -HD + 1.6, fr = 0.85;
        style.quilt(B, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = fx + 1.4 - 1.5 * v; out[1] = 1.0 + fr * Math.cos(a); out[2] = fz + fr * Math.sin(a); } });
        style.quilt(B, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), flip: true, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = fx + 1.3; out[1] = 1.0 + fr * v * Math.cos(a); out[2] = fz + fr * v * Math.sin(a); } });
        style.quilt(B, { nu: 4, nv: 2, su: 2, sv: 2, bulge: 0.18, cloth: 0, P: (u, v, out) => { const a = Math.PI * 2 * u, r = fr * 0.9 + 0.5 * v; out[0] = fx - 0.1 - 2.4 * v; out[1] = Math.max(0.12, 1.0 + 0.5 * v + r * Math.cos(a)); out[2] = fz + r * Math.sin(a); } });
        // guy lines and pegs
        for (const [gx, gz] of [[-1, 1], [1, 1], [-1, -1]]) style.strap(B, [gx * HW * 0.95, WALL - 0.4, gz * HD * 0.95], [gx * (HW + 4), 0.15, gz * (HD + 4)]);
      }
      const g = B.geometry(); disposables.push(g); return g;
    }
    const houseHiGeo = houseGeo(true); await ctx.yield();
    const houseLoGeo = houseGeo(false); await ctx.yield();

    const hr = rng.fork('houses'), hrA = hr;
    const hHi = [], hLo = [];
    let nQuarterShadow = 0;
    let nReturned = 0;                                             // (how many houses the alley step puts back: they stand last in the low houses' list)
    const fpos = (t, s) => [F0.x + FDIR.x * t + FSIDE.x * s, F0.z + FDIR.z * t + FSIDE.z * s];
    // (plots kept clear of houses for the big things among them: onPlot above, from the things' own records)
    const hq = makeRng(ctx.seed + ':far-houses');          // the houses beyond the keep draw from a stream of their own
    const secAtZ = (z) => secOf(uAt(0, clamp(z, 0, 500)));
    // the far quarter's roofs are laid in BLOCKS: every block between two cross alleys wears one roof cloth, and no two blocks
    // that touch (along the avenue, across a lane, across the avenue) wear the same, so the town reads from above as a quilt
    const ROOFC = [cl('RED'), cl('YELLOW'), cl('GREEN'), cl('PINK'), cl('WHITE')], WALLALT = [cl('WHITE'), cl('YELLOW'), cl('PINK')];
    const blockRoof = (h, t, pair, sd) => { h.roof = ROOFC[(((Math.floor((t + 4) / 81) * 2 + pair * 3 + (sd > 0 ? 1 : 0)) % 5) + 5) % 5]; for (let i = 0; i < 3 && h.walls === h.roof; i++) h.walls = WALLALT[(pair + i) % 3]; };
    const mkHouse = (x, z, rot, hiRow, hr = hrA) => {
      const walls = hr.pick(HOUSE_WALLS), roof = pick2(hr, [cl('RED'), cl('YELLOW'), cl('PINK'), cl('GREEN'), cl('WHITE')], walls);
      const h = { x, z, rot: rot + hr.range(-0.06, 0.06), walls, roof, ph: hr(), soft: hr.chance(0.05) ? hr.range(0.35, 0.7) : 0, born: 0,
        sx: hr.range(0.9, 1.18), sy: hr.range(0.86, 1.28), sz: hr.range(0.9, 1.12) };
      if (hr.chance(hiRow ? 0.08 : 0.13)) h.born = -hr.range(0.5, 46);                    // lives on the 46 s cycle: sags, lies down, is born again
      return h;
    };
    for (const sd of [1, -1]) for (let z = 13; z < 392; z += 14) {
      if (STREETS.some((s) => Math.abs(s - z) < 9)) continue;
      const h = mkHouse(rowHouseX(sd, z), z, -sd * Math.PI / 2, true); h.row = sd;
      if (z < 110) { h.born = 0; h.soft = 0; }
      if (sd > 0 && z < 30) h.x += 1.3;          // (room for the two dancers that stand by the entry)
      // the two births that are watched from puddle to pop: well ahead, each in the gap between two dancers. Left, 83 m in: a
      // puddle at the entry, lumps at 2 s, half up at 3 s, popped by 5 s. Right, 125 m in, two seconds later.
      if (sd > 0 && z === 83) { h.born = 0.05; h.soft = 0; h.walls = cl('YELLOW'); h.roof = cl('RED'); h.sy = 1.25; h.sx = 1.15; }
      // the HALL on the right, 96 m in: twice a house in every direction, half blown up as the flight draws near, popped as it passes
      if (sd < 0 && z === 97) { const r = REC.hall; h.born = 2.0; h.soft = 0; h.walls = cl('PINK'); h.roof = cl('GREEN'); h.sy = r.sy; h.sx = r.sx; h.sz = r.sz; h.x = r.x; h.z = r.z; }
      if (sd < 0 && z === 83) h.x -= 42;
      if (z === 41) h.x += sd * 20;          // (the pair nearest the first frame stands back: no house is cut by its side edges)
      if (sd > 0 && z === 195) h.x += 46;          // (its plot goes to the slide)
      if (sd < 0 && z === 237) h.x -= 46;
      if (sd < 0 && z === 265) h.z = 271;
      // the bouncy church's nave in the opening on the right, 250 m in
      if (sd < 0 && z === 251) { const r = REC.nave; h.born = 0; h.soft = 0; h.walls = cl('WHITE'); h.roof = cl('PINK'); h.sx = r.sx; h.sy = r.sy; h.sz = r.sz; h.x = r.x; }
      if (hour === 'dawn' && z < 215 && h.born >= 0) h.born = Math.max(h.born, 0.05 + hr.range(0, 0.5), secAtZ(z) - 5.6 + hr.range(-0.5, 0.5));
      if (sd < 0 && z === 111) continue;          // (its plot goes to the big one being born beside it)
      hHi.push(h);
    }
    for (const sd of [1, -1]) for (let t = FRONT_T0; t < 204; t += FRONT_STEP) {
      const x = F0.x + FDIR.x * t + FSIDE.x * FRONT_S * sd, z = F0.z + FDIR.z * t + FSIDE.z * FRONT_S * sd;
      if (inKeep(x, z, 8) || onPlot(t, FRONT_S * sd, 5)) continue;          // (tested before any draw)
      const h = mkHouse(x, z, FROT - sd * Math.PI / 2, true, hq);
      blockRoof(h, t, 0, sd); h.ft = t; h.fs = sd; hHi.push(h);
    }
    // A FAR DANCER STANDS IN THE MIDDLE OF ITS GAP: between the eaves, as built, of the two houses of the
    // front row on either side of it, at its own depth from the row. One that does not is moved along the
    // avenue, the least way; none is left out. (Where a neighbour's plot is empty it keeps its trunk clear
    // of the one roof there is.) In the middle its drum must stand out of every big thing's plot, as it did
    // where it stood: where the middle fails, it takes the place nearest the middle, toward where it stood,
    // that passes (tried in steps of 5 cm at most; where none passes it stays where it stood). Then the
    // banded gate's legs are asked again, by the move made above: a dancer that the middle brings nearer a
    // leg than its half metre is moved straight away from the leg, the least way.
    for (const d of dHi.filter(function (d) { return d.far; })) {
      const f = farAxisDist(d.x, d.z), sd = Math.sign(f.s), depth = Math.abs(Math.abs(f.s) - FRONT_S);
      // (eave: half the roof's width at that depth, from the roof's own outline)
      const eave = function (h) {
        return HW * 1.2 * h.sx * Math.sqrt(1 - Math.pow(Math.min(1, depth / (HD * 1.22 * h.sz)), 6)); };
      // (near: the house of its side within a pitch, that way)
      const near = function (way) { return hHi.find(function (h) {
        const off = Math.abs(h.ft - f.t - way * 7); return h.fs === sd && off === Math.min(off, 7); }); };
      const a = near(-1), b = near(1), lo = a ? a.ft + eave(a) : -1e9, hi = b ? b.ft - eave(b) : 1e9;
      const mid = a && b ? (lo + hi) / 2 : Math.min(Math.max(f.t, lo + 1.1 * d.s), hi - 1.1 * d.s);
      let t = f.t; const n = Math.ceil(Math.abs(f.t - mid) / 0.05);
      for (let k = 0; k < n; k++) { const tt = mid + (f.t - mid) * k / n; if (!onPlot(tt, f.s, 1.7 * d.s)) { t = tt; break; } }
      d.x += FDIR.x * (t - f.t); d.z += FDIR.z * (t - f.t);
      for (const lg of [-1, 1]) {
        const g = REC.gate, lx = g.x + FSIDE.x * lg * g.legX, lz = g.z + FSIDE.z * lg * g.legX;
        const off = Math.hypot(d.x - lx, d.z - lz), need = g.legR + 1.7 * d.s + 0.5, push = Math.max(0, need - off) / Math.max(off, 1e-3);
        d.x += (d.x - lx) * push; d.z += (d.z - lz) * push; }
    }
    function dancerArrays(list) {
      const iB = new Float32Array(list.length * 4), iS = new Float32Array(list.length * 4);
      list.forEach((d, i) => { iB.set([27.6, d.hinge, d.ph, gustFold * (0.9 + 0.2 * d.ph)], i * 4); iS.set([d.born, d.soft, 0.32, d.cloth], i * 4); });
      return [iB, iS];
    }
    const dancerMat = style.skin({ instanced: true, tube: true, sinkMin: 0.25, rs0: 0.5 });
    const dancerShadowMat = style.skin({ instanced: true, shadow: true, tube: true, sinkMin: 0.25, rs0: 0.5 });
    {
      const [iB, iS] = dancerArrays(dHi); instanced(dancerHiGeo, dancerMat, dHi, iB, iS);
      instanced(dancerLoGeo, dancerShadowMat, dHi, iB, iS, 2);
      const [jB, jS] = dancerArrays(dLo); instanced(dancerLoGeo, dancerMat, dLo, jB, jS);
      instanced(dancerLoGeo, dancerShadowMat, dLo, jB, jS, 2);          // a tinted shadow for every small dancer
    }
    {
      const cand = [];
      for (const sz of STREETS) for (const dz of [18, 36, 54]) for (let k = 0; k < 28; k++) for (const sd of [1, -1]) {
        if (k % 3 === 2) continue;
        const x = sd * (50 + 24 * k), z = sz + dz;
        if (inKeep(x, z, 14) || Math.hypot(x - CX, z - CZ) > 700 || (k === 0 && z > 215 && z < 400)) continue;
        const f = farAxisDist(x, z); if (f.t > -16 && f.t < 346 && Math.abs(f.s) < 134) continue;      // the far quarter is laid out in its own frame
        const w = (z > -20 && z < 400 ? 1.5 - Math.abs(x) / 160 : z >= 400 ? 1.6 - Math.hypot(x + 50, z - 720) / 560 : 0) + hr() * 0.45;
        cand.push({ x, z, w, rot: (dz === 18 ? Math.PI : dz === 54 ? 0 : sd * Math.PI / 2), cell: STREETS.indexOf(sz) * 2 + Math.floor(k / 6) * 3 + (sd > 0 ? 1 : 0) });
      }
      cand.sort((a, b) => b.w - a.w);
      // THE FAR QUARTER: blocks packed shoulder to shoulder along the far avenue, in the avenue's own frame (t along, s across).
      // Rows stand back to back (roofs touching) with lanes between and a cross alley every sixth plot; the first two rows of
      // each side cast tinted shadows, and so does every house the alley step puts back. A plot within 5 m of a big thing's footprint (far nave, far steeple, bell tower, far slide) is left empty, or its house steps off it (below).
      const qr = rng.fork('quarter');
      const QROWS = [[32, -1], [45.5, 1], [67, -1], [80.5, 1], [103, -1], [116.5, 1]];
      // A plot of the quarter that a big thing's plot takes is not left empty where a free place lies beside
      // it: the house is laid the least way off the big plot, along its row into the mouth of a cross alley
      // (in steps of half a metre, no further than half a plot), and draws from a stream of its own, so that
      // no other house is dealt anew. Where no such place is free the plot stays empty. (The houses so laid
      // stand last in the list. Off the big plot: by the widest wall a house can be dealt and the jitter of
      // its place.)
      const qk = makeRng(ctx.seed + ':quarter-kept'), kept = [];
      const stepOff = function (t, s, k) {
        const ways = [[1, 0], [-1, 0]].filter(function (w) { return (k + w[0] + 6) % 6 === 5; });
        let best = null;
        for (const w of ways) for (let m = 0.5; m !== 7; m += 0.5) {
          if (onPlot(t + w[0] * m, s + w[1] * m, HW * 1.18 * 1.06 + 0.6)) continue;
          if (!best || Math.min(m, best[2]) !== best[2]) best = [t + w[0] * m, s + w[1] * m, m];
          break; }
        return best; };
      for (let ri = 0; ri < QROWS.length; ri++) for (const sd of [1, -1]) for (let k = 0; k < 26; k++) {
        const t = -4 + 13.5 * k, s = sd * QROWS[ri][0];
        if (k % 6 === 5 || (ri === 0 && t < 236)) continue;          // (the front row here only runs on beyond the arch and its guy lines)
        const taken = onPlot(t, s, 5), off = taken ? stepOff(t, s, k) : null;
        if (taken && !off) continue;
        const at = off || [t, s], jr = off ? qk : qr;
        if (ri > 3 && (k * 7 + ri * 3 + (sd > 0 ? 1 : 0)) % 5 === 0 && detail < 0.9) continue;
        const [x, z] = fpos(at[0] + jr.range(-0.6, 0.6), at[1] + jr.range(-0.8, 0.8));
        if (inKeep(x, z, 13) || Math.hypot(x - CX, z - CZ) > 700) continue;
        const h = mkHouse(x, z, FROT + sd * QROWS[ri][1] * Math.PI / 2, false, off ? qk : hq);
        h.sx *= 1.06; h.sy *= ri % 2 ? 1.0 : 1.12; h.q = ri; blockRoof(h, t, ri >> 1, sd);
        (off ? kept : hLo).push(h);
      }
      hLo.sort((a, b) => a.q - b.q);
      nQuarterShadow = hLo.filter((h) => h.q < 3).length;
      const n = Math.min(cand.length, 230, Math.round(200 * detail * density));
      for (let i = 0; i < n; i++) { const c = cand[i], h = mkHouse(c.x + hr.range(-2, 2), c.z + hr.range(-2, 2), c.rot, false);
        if (c.z >= 392) { h.roof = ROOFC[((c.cell % 5) + 5) % 5]; h.walls = WALLALT[c.cell % 3]; if (h.walls === h.roof) h.walls = WALLALT[(c.cell + 1) % 3]; }          // (beyond the keep the far houses lie in clusters of one roof cloth, a street cell each: patches, not dots)
        if (Math.abs(h.x - 47) < 27 && Math.abs(h.z - 196) < 15) h.x += 46; if (Math.abs(h.x + 60) < 22 && Math.abs(h.z - 251) < 18) h.x -= 42; if (hour === 'dawn' && c.z < 215 && c.z > -20 && h.born >= 0) h.born = Math.max(0.1, secAtZ(c.z) - 5 + hr.range(-1, 1)); hLo.push(h); }
      for (const h of kept) hLo.push(h); nReturned = kept.length;
    }
    // puddled cloth beside the lane where the flight comes in: a spare skin that is never blown up (its birth never comes), lying
    // spread and lumped on the tarpaulin on the cart's side, its hose main running over it
    hHi.push({ x: -11.2 * (Math.sign(wob) || 1), z: 35, rot: 0.35, walls: cl('PINK'), roof: cl('YELLOW'), ph: 0.71, soft: 0, born: 9999, sx: 0.62, sy: 0.7, sz: 0.62 });
    // the bouncy church's nave: a loaf like the houses at twice the size (its steeple is built below, with the other big things)
    { const r = REC.farNave; hHi.push({ x: r.x, z: r.z, rot: r.rot, walls: cl('WHITE'), roof: cl('PINK'), ph: 0.37, soft: 0, born: 0, sx: r.sx, sy: r.sy, sz: r.sz }); }
    await ctx.yield();
    function houseArrays(list) {
      const iB = new Float32Array(list.length * 4), iS = new Float32Array(list.length * 4);
      list.forEach((h, i) => { iB.set([WALL + RISE, 0.55, h.ph, weather === 'calm' ? 0.03 : 0.16], i * 4); iS.set([h.born, h.soft, 0.22, h.walls + 8 * h.roof], i * 4); });
      return [iB, iS];
    }
    const houseMat = style.skin({ instanced: true, sinkMin: 0.03, rs0: 1.4 });
    const houseShadowMat = style.skin({ instanced: true, shadow: true, sinkMin: 0.03, rs0: 1.4 });
    {
      const [iB, iS] = houseArrays(hHi); instanced(houseHiGeo, houseMat, hHi, iB, iS); instanced(houseLoGeo, houseShadowMat, hHi, iB, iS, 2);
      const [jB, jS] = houseArrays(hLo); instanced(houseLoGeo, houseMat, hLo, jB, jS);
      // (the tinted shadows: the first of the list as before, and every house the alley step puts back: those are the last of it)
      const nLit = Math.min(hLo.length - nReturned, nQuarterShadow + Math.round(70 * detail)), lit = hLo.slice(0, nLit).concat(hLo.slice(hLo.length - nReturned));
      const [sB, sS] = houseArrays(lit); instanced(houseLoGeo, houseShadowMat, lit, sB, sS, 2);
      // what the hand gets wrong: one house in fifteen wears a square patch in the wrong colour, with its own hem
      const PB = style.batch();
      style.quilt(PB, { nu: 1, nv: 1, su: 2, sv: 2, bulge: 0.16, cloth: 0, P: (u, v, out) => { const a = 2 * u - 1; out[0] = 2.9 - a * 0.95; out[1] = 1.55 + (2 * v - 1) * 0.95; out[2] = wallZ(out[0], out[1], true) + 0.1; } });
      const pg = PB.geometry(); disposables.push(pg);
      const patched = hHi.concat(hLo).filter((h, i) => h.born === 0 && i % 5 === 2).slice(0, 34);
      const kB = new Float32Array(patched.length * 4), kS = new Float32Array(patched.length * 4);
      patched.forEach((h, i) => { const c = pick2(hr, [cl('GREEN'), cl('PINK'), cl('YELLOW'), cl('RED'), cl('WHITE')], h.walls); kB.set([WALL + RISE, 0.55, h.ph, weather === 'calm' ? 0.03 : 0.16], i * 4); kS.set([0, h.soft, 0.22, c + 8 * c], i * 4); });
      instanced(pg, houseMat, patched, kB, kS);
    }
    await ctx.yield();
    // ---- the big things among the houses of the far quarter: the church's steeple and a bell tower, a slide, and a banded
    //      gate over the far avenue. Each is one more body of the same skin: it breathes, dents and folds in a gust. --------
    {
      const big = (B, mat, shMat, list, H, kink) => {
        const g = B.geometry(); disposables.push(g);
        const iB = new Float32Array(list.length * 4), iS = new Float32Array(list.length * 4);
        list.forEach((o, i) => { iB.set([H, 0.55, o.ph, kink], i * 4); iS.set([0, 0, 0.2, o.a + 8 * o.b], i * 4); });
        instanced(g, mat, list, iB, iS); instanced(g, shMat, list, iB, iS, 2);
      };
      // steeple: a white tube with one coloured ring, a pink cone cap and a yellow ball, on a black fan collar
      const SP = style.batch();
      style.tube(SP, { x: 0, z: 0, ys: [0, 7, 14, 21, 28, 34], rad: (y) => 3.4 * (1.05 - 0.1 * y / 34) + 0.9 * Math.exp(-(y - 32) * (y - 32) / 6), gores: 8, sub: 2, sv: 2, bulge: 0.45, tuftK: 0.4, cloth: (iu, iv) => (iv === 3 ? 1 : 0) });
      style.tube(SP, { x: 0, z: 0, ys: [34, 39.5, 44.6], rad: (y) => Math.max(0.25, 4.7 * (1 - (y - 34) / 10.8)), gores: 8, sub: 2, sv: 3, bulge: 0.35, tuft: false, cloth: cl('PINK') });
      style.ball(SP, 0, 45.4, 0, 1.3, 0, cl('YELLOW'), 3);
      style.quilt(SP, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 4.1 * Math.cos(a); out[1] = 1.7 * v; out[2] = 4.1 * Math.sin(a); } });
      { const A1 = REC.farSteeple, A2 = REC.bell, A3 = REC.steeple;          // (each stands where its record says: the far church's steeple, the bell tower, the steeple of the church beside the near avenue)
        big(SP, dancerMat, dancerShadowMat, [{ x: A1.x, z: A1.z, rot: A1.rot, ph: 0.61, a: cl('WHITE'), b: cl('YELLOW'), sx: A1.sxz, sy: A1.sy, sz: A1.sxz }, { x: A2.x, z: A2.z, rot: A2.rot, ph: 0.17, a: cl('YELLOW'), b: cl('WHITE'), sx: A2.sxz, sy: A2.sy, sz: A2.sxz },
          { x: A3.x, z: A3.z, rot: A3.rot, ph: 0.43, a: cl('WHITE'), b: cl('PINK'), sx: A3.sxz, sy: A3.sy, sz: A3.sxz }], 46, 0.5); }
      await ctx.yield();
      // slide: a chute in the second cloth between two fat rails, a platform on four posts under a pink canopy. Front = local +z.
      const SB = style.batch(), ramp = (v, o) => { o[1] = 1.2 + 16.5 * Math.pow(1 - v, 1.7); o[2] = -9 + 20 * v; };
      style.quilt(SB, { nu: 3, nv: 4, su: 2, sv: 3, bulge: 0.5, cloth: 1, P: (u, v, out) => { ramp(v, out); out[0] = (u - 0.5) * 9; } });
      for (const sd of [-1, 1]) style.quilt(SB, { nu: 4, nv: 4, su: 2, sv: 2, bulge: 0.3, cloth: 0,
        P: (u, v, out) => { ramp(u, out); const a = Math.PI * 2 * v; out[0] = sd * 5.3 + 1.35 * Math.cos(a); out[1] += 1.0 + 1.35 * Math.sin(a); } });
      for (const px of [-5.3, 5.3]) for (const pz of [-9.6, -17]) style.tube(SB, { x: px, z: pz, ys: [0, 8, 16, 24], rad: () => 1.5, gores: 4, sub: 2, sv: 2, bulge: 0.3, cloth: 0 });
      style.quilt(SB, { nu: 2, nv: 2, su: 2, sv: 2, bulge: 0.5, cloth: 1, P: (u, v, out) => { out[0] = (u - 0.5) * 10.4; out[1] = 17.4; out[2] = -17 + 8 * v; } });
      style.quilt(SB, { nu: 6, nv: 2, su: 2, sv: 2, bulge: 0.4, cloth: cl('PINK'), P: (u, v, out) => { const a = Math.PI * 2 * u, b = v * Math.PI * 0.5 * 0.97, r = 8.4 * Math.cos(b); out[0] = r * Math.cos(a); out[1] = 23.4 + 5.6 * Math.sin(b); out[2] = -13.3 + 0.72 * r * Math.sin(a); } });
      { const A1 = REC.farSlide, A2 = REC.slide;          // (the far quarter's slide; the slide in the gap of the near avenue's left-hand row)
        big(SB, houseMat, houseShadowMat, [{ x: A1.x, z: A1.z, rot: A1.rot, ph: 0.83, a: cl('GREEN'), b: cl('YELLOW'), s: A1.s }, { x: A2.x, z: A2.z, rot: A2.rot, ph: 0.29, a: cl('RED'), b: cl('WHITE'), s: A2.s }], 29, 0.12); }
      await ctx.yield();
      // the banded gate over the far avenue, 46 m down it: a fat tube in bands of every cloth (the far dancers keep clear of its feet)
      const GB = style.batch(), RX = 14, LEG = 12, R = 3.0, arcL = Math.PI * RX, tot = 2 * LEG + arcL, nb = Math.round(tot / 3.4), c = [0, 0], t = [0, 0];
      const BANDC = [cl('YELLOW'), cl('PINK'), cl('GREEN'), cl('WHITE'), cl('RED')];
      const centre = (u) => { const q = u * tot;
        if (q < LEG) { c[0] = RX; c[1] = q; t[0] = 0; t[1] = 1; } else if (q < LEG + arcL) { const a = (q - LEG) / RX; c[0] = RX * Math.cos(a); c[1] = LEG + RX * Math.sin(a); t[0] = -Math.sin(a); t[1] = Math.cos(a); }
        else { c[0] = -RX; c[1] = LEG - (q - LEG - arcL); t[0] = 0; t[1] = -1; } };
      style.quilt(GB, { nu: nb, nv: 4, su: 2, sv: 2, bulge: 0.45, cloth: (iu) => BANDC[iu % 5],
        P: (u, v, out) => { centre(u); const ph = Math.PI * 2 * v; out[0] = c[0] - R * Math.cos(ph) * t[1]; out[1] = c[1] + R * Math.cos(ph) * t[0]; out[2] = R * Math.sin(ph); } });
      { const A1 = REC.gate; big(GB, houseMat, houseShadowMat, [{ x: A1.x, z: A1.z, rot: A1.rot, ph: 0.45, a: 0, b: 0, s: A1.s }], 29, 0.07); }          // (45 m to its crown: the dive clears it by 6 m)
    }
    await ctx.yield();
    // ---- bunting: strings of pennants in every cloth, roof to roof across both avenues. Each pennant is a short streamer (it
    //      hangs, swings and flutters with the wind), and each string lays its row of tinted triangles on the lane below. ------
    {
      const BB = style.batch(), br = rng.fork('bunting'), CL5 = [cl('PINK'), cl('YELLOW'), cl('GREEN'), cl('WHITE'), cl('RED')];
      const hung = [];          // (every string as hung, in order: its two ends)
      const string = (a, b, sag, step, L, hw, cw) => {
        hung.push([a, b]);
        const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / step)), pts = [];
        const at = (f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f) - sag * 4 * f * (1 - f), lerp(a[2], b[2], f)];
        const ns = cw > 0.2 ? 6 : 12; for (let i = 0; i <= ns; i++) pts.push(at(i / ns));
        style.ribbon(statics, pts, cw, STRAP_CLOTH, 0);          // (seventh) the string is white webbing, the strap's own cloth: a black string read as a stray line
        for (let i = 0; i < n; i++) {
          const q = at((i + 0.5) / n), ph = br(), c = CL5[i % 5]; let p0 = -1, p1 = -1;
          for (let j = 0; j <= 3; j++) {
            const sj = j / 3, w = hw * (1 - sj);
            const v0 = BB.vert(q[0], q[1], q[2], 0, 1, 0, sj, -1, ph, w, 0, c, -1, L), v1 = BB.vert(q[0], q[1], q[2], 0, 1, 0, sj, 1, ph, w, 0, c, -1, L);
            if (j) { BB.tri(p0, v0, p1); BB.tri(p1, v0, v1); } p0 = v0; p1 = v1;
          }
        }
      };
      // two over the lane where the flight comes in: overhead in the first frame, above the keep's tower, their shadows lying whole
      // on the floor ahead; then one along each row of roofs (nothing is strung across the view of the keep) ...
      for (const [z0, z1] of [[13, 8.5], [22.5, 26]]) string([18.5, 11.4, z0], [-18.5, 11.4, z1], 1.5, 1.45, 1.75, 0.56, 0.09);
      // two more, higher, on poles behind the rows: over the top of the first frame (well above the tower's cap), their rows of
      // tinted triangles lying across the lane 10 to 25 m ahead
      for (const [z0, z1, y] of [[31, 28, 14.6], [38, 41, 16.6]]) {
        string([19.5, y, z0], [-19.5, y, z1], 1.5, 1.45, 1.75, 0.56, 0.09);
        for (const [px, pz] of [[19.6, z0], [-19.6, z1]]) style.strap(statics, [px, y + 0.3, pz], [px, 0, pz], { ring: false });
      }
      for (const sd of [1, -1]) for (const z0 of [15, 29, 43]) string([sd * 19, 11.2, z0], [sd * 19.4, 11.2, z0 + 12], 1.1, 1.45, 1.75, 0.56, 0.09);
      // ... and four across the far avenue between its dancers, well under the dive
      for (const t of [79, 103, 127]) { const p = fpos(t, 24.5), q = fpos(t + 1.5, -24.5); string([p[0], 12.6, p[1]], [q[0], 12.6, q[1]], 2.1, 2.1, 2.5, 0.8, 0.14); }
      // HIGH BUNTING: masts taller than any roof, each with long strings of big pennants running down to short posts all round it
      // (a big top without its tent), beside both avenues and out in the far quarter; and one long string high across the avenue
      const mast = (mx0, mz0, H, n, R, a0) => {
        const [mx, mz] = standClear(mx0, mz0, H + 3.7);          // (the one clearance: the mast stands back with its strings and posts)
        style.strap(statics, [mx, H + 1.5, mz], [mx, 0, mz], { ring: false });
        style.ball(statics, mx, H + 2.4, mz, 1.3, 0, CL5[(n + Math.round(H)) % 5], 2);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * Math.PI * 2, [ex, ez] = standClear(mx + R * Math.sin(a), mz + R * Math.cos(a), 9.3);
          string([mx, H, mz], [ex, 9, ez], 3.2, 5.2, 4.8, 1.6, 0.22);
          style.strap(statics, [ex, 9.3, ez], [ex, 0, ez], { ring: false });
        }
      };
      for (const [mx, mz, H, n, R, a0] of [[-62, 150, 46, 4, 36, 0.3], [68, 215, 50, 4, 38, 0.9], [-86, 300, 54, 4, 40, 0.1], [98, 118, 44, 4, 34, 0.5]]) mast(mx, mz, H, n, R, a0);
      await ctx.yield();
      for (const [t, s2, H, a0] of [[300, -72, 54, 0.4]]) {          // (one mast beyond the finish; the two that stood among the far quarter's blocks are gone: from the back wall they were sticks and lines over the roofs)
        const q = fpos(t, s2); mast(q[0], q[1], H, 4, 38, a0); }
      { const z0 = 150, x0 = rowX(z0) + 28, pa = standClear(x0, z0, 45.6), pb = standClear(-x0, z0 + 3, 45.6);
        string([pa[0], 45, pa[1]], [pb[0], 45, pb[1]], 5, 4.4, 4.6, 1.5, 0.22);
        for (const [px, pz] of [pa, pb]) style.strap(statics, [px, 45.6, pz], [px, 0, pz], { ring: false }); }
      // ROOF TO ROOF along both rows: one string from each house's gable to the next one's, wherever two
      // houses of a row stand side by side and both are up at the start (none across the lane, none over a
      // cross street, none on the hall or the church), and none where a string already hangs between the two:
      // a string is not hung if more than half of its line would lie within a pennant's length, 1.75 m, of a
      // string already hung, in plan (heights left out: a string a little higher or lower beside another is a
      // second string all the same). Where the flight comes in, a string typed above runs along each row
      // already, so no roof string is hung beside it. That is tested before anything is drawn for the string.
      // Made after every string above, so that no old pennant's phase moves.
      const offString = (px, pz, [a, b]) => { const vx = b[0] - a[0], vz = b[2] - a[2], f = clamp(((px - a[0]) * vx + (pz - a[2]) * vz) / (vx * vx + vz * vz || 1), 0, 1);
        return Math.hypot(px - a[0] - f * vx, pz - a[2] - f * vz); };          // (how far a point lies, in plan, from a string hung between a and b)
      for (const sd of [1, -1]) {
        const row = hHi.filter((h) => h.row === sd && h.born === 0 && h.sx < 1.6).sort((a, b) => a.z - b.z);
        for (let i = 0; i + 1 < row.length; i++) { const a = row[i], b = row[i + 1];
          if (b.z - a.z > 20 || Math.abs(b.x - a.x) > 6) continue;
          const at = (h) => [h.x - sd * (HD * 1.22 * h.sz + 0.4), (WALL - 0.55 + RISE * 1.08) * h.sy * 0.97, h.z];
          const pa = at(a), pb = at(b); let by = 0;          // (by: how many of its line's 24 even pieces lie, at their middles, by a string already hung)
          for (let k = 0; k < 24; k++) { const f = (k + 0.5) / 24, px = lerp(pa[0], pb[0], f), pz = lerp(pa[2], pb[2], f); if (hung.some((s) => offString(px, pz, s) < 1.75)) by++; }
          if (by > 12) continue;
          string(pa, pb, 1.1, 1.45, 1.75, 0.56, 0.09); }
      }
      await ctx.yield();
      const bm = style.skin({ streamer: true }), bsm = style.skin({ streamer: true, shadow: true, share: bm });
      bm.uniforms.uBX.value[0].set(0, 0, 1, 0);
      for (const m of [bm, bsm]) { m.uniforms.uStream.value = 0.42; m.uniforms.uStreamK.value.set(0, 0.2, 0); }
      const bg = BB.geometry(), mesh = new THREE.Mesh(bg, bm), sh = new THREE.Mesh(bg, bsm);
      mesh.frustumCulled = false; sh.frustumCulled = false; sh.renderOrder = 2; scene.add(mesh, sh);
    }
    await ctx.yield();
    // ---- hummocks: the hills, green inflated mounds beyond the town out to the hem ------------------------------
    {
      const B = style.batch();
      style.quilt(B, { nu: 8, nv: 3, su: 2, sv: 1, bulge: 0.07, cloth: 0, vEdges: [0, 0.42, 0.75, 1],
        P: (u, v, out) => { const a = Math.PI * 2 * u, b = 0.03 + 1.5 * v, r = Math.cos(b * 0.98); out[0] = r * Math.cos(a); out[1] = Math.sin(b * 0.98); out[2] = r * Math.sin(a); } });
      const g = B.geometry(); disposables.push(g);
      const mr = rng.fork('hummocks'), list = [], n = Math.round(54 * Math.max(0.75, detail));
      for (let i = 0; i < n; i++) {
        const a = (i + mr.range(-0.3, 0.3)) / n * Math.PI * 2, r = mr.range(735, 1120), R = mr.range(15, 40), h = mr.range(6, 15) * (R > 28 ? 1.15 : 1);
        list.push({ x: CX + r * Math.sin(a), z: CZ + r * Math.cos(a), rot: mr.range(0, 6.28), sx: R * mr.range(0.9, 1.3), sy: h, sz: R, ph: mr() });
      }
      const iB = new Float32Array(n * 4), iS = new Float32Array(n * 4);
      list.forEach((h, i) => { iB.set([1, 0.5, h.ph, 0], i * 4); iS.set([0, 0, 0, cl('GREEN') + 8 * cl('GREEN')], i * 4); });
      const mat = style.skin({ instanced: true, sinkMin: 0.45, rs0: 1.05 });
      instanced(g, mat, list, iB, iS);
    }
    await ctx.yield();

    // ---- clouds: nine white quilted pillows on four white tethers each (the strap); they bob, and one is always a little soft --
    {
      const cr = rng.fork('clouds');
      // Where they ride: nine typed places, kept as they were. Five ride low over the hem beyond the far
      // quarter and four stand off to the sides and behind. [x, z, lowest y, highest y, tether width]
      const hemC = (t, s) => { const q = fpos0(t, s); return [q[0], q[1], 98, 118, 2.3]; };
      const spots = [hemC(960, -330), hemC(990, 40), hemC(925, 390), hemC(790, -630), hemC(730, 650), [470, 560, 180, 240, 3], [-540, 150, 180, 250, 3], [770, 900, 190, 255, 4], [430, -260, 180, 250, 3]];
      const cloudMat = style.skin({ bodies: 1 }), softMat = style.skin({ bodies: 1 });
      for (const m of [cloudMat, softMat]) { m.uniforms.uBP.value[0].set(0, 0, 0, 280); m.uniforms.uBD.value[0].set(0, 1, 0.5, 1); m.uniforms.uBX.value[0].set(1, 1, 0.82, 0.4); }
      softMat.uniforms.uBS.value[0].set(0.62, 0, 0, 0);
      const softOne = cr.int(0, 2);
      for (let i = 0; i < spots.length; i++) {
        const L = cr.range(60, 90) / 2 * (i < 5 ? 1.6 : 1.1), Wd = L * cr.range(0.42, 0.55), Hh = cr.range(11, 16) * (i < 5 ? 1.3 : 1.1), y = lerp(spots[i][2], spots[i][3], (cr.range(180, 255) - 180) / 75), tw = spots[i][4];
        const x = spots[i][0] + cr.range(-25, 25), z = spots[i][1] + cr.range(-25, 25);
        const B = style.batch(), e = 0.7, pw = (c) => Math.sign(c) * Math.pow(Math.abs(c), e);
        style.quilt(B, { nu: 10, nv: 5, su: 2, sv: 2, bulge: 2.6, body: 0, cloth: cl('WHITE'),
          P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * (0.003 + 0.994 * v), sb = Math.pow(Math.sin(b), 0.75); out[0] = -L * Math.cos(b); out[1] = y + Hh * pw(Math.sin(a)) * sb; out[2] = Wd * pw(Math.cos(a)) * sb; } });
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const px = sx * (L * 0.55 + 46), pz = sz * (Wd + 52), ax = sx * L * 0.55, az = sz * Wd * 0.5, ay = y - Hh * 0.7;
          style.strap(B, [ax, ay, az], [px, 0.2, pz], { w: tw, pins: [0, 1] });          // (a pillow a hundred metres long hangs on a broader strap than a house does: its own real width)
        }
        const mesh = new THREE.Mesh(B.geometry(), i === softOne ? softMat : cloudMat);
        mesh.position.set(x, 0, z); mesh.rotation.y = cr.range(-0.5, 0.5) + 0.3 + (i < 5 ? FROT : 0); mesh.frustumCulled = false; scene.add(mesh);
        const ph = cr.range(0, 6.28), sp = cr.range(0.35, 0.6), amp = cr.range(0.008, 0.016);
        movers.push((dt, time) => { mesh.scale.y = 1 + amp * Math.sin(time * sp + ph) + 0.4 * amp * Math.sin(time * sp * 2.7 + ph * 2); });
        await ctx.yield();
      }
    }

    // ---- things in the sky, sewn like everything else: hot-air balloons (a gored envelope over a black fan drum), blimps and
    //      parafoil kites. Balloons and blimps fly free (no tether to cross a tipped view); each bobs, turns and drifts. ------
    {
      const sr = rng.fork('sky-things'), E3 = new THREE.Euler(0, 0, 0, 'YXZ');
      const skyMat = style.skin({ instanced: true, sinkMin: 1, rs0: 1 });
      const PAIRS = [[cl('RED'), cl('WHITE')], [cl('YELLOW'), cl('PINK')], [cl('GREEN'), cl('YELLOW')], [cl('PINK'), cl('WHITE')], [cl('YELLOW'), cl('RED')], [cl('WHITE'), cl('GREEN')]];
      const flock = (B, list, H, move) => {
        const g = B.isBufferGeometry ? B : B.geometry(); if (!B.isBufferGeometry) disposables.push(g);
        const iB = new Float32Array(list.length * 4), iS = new Float32Array(list.length * 4);
        list.forEach((o, i) => { o.ph = sr(); const pr = PAIRS[(i * 5 + (o.c ?? 0)) % PAIRS.length]; iB.set([H, 0.5, o.ph, 0], i * 4); iS.set([0, 0, 0, pr[0] + 8 * pr[1]], i * 4); });
        const m = instanced(g, skyMat, list, iB, iS); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        movers.push((dt, time) => {
          for (let i = 0; i < list.length; i++) { const o = list[i]; move(o, time, i); Q4.setFromEuler(E3); S3.set(o.s, o.s, o.s); m.setMatrixAt(i, M4.compose(V3, Q4, S3)); }
          m.instanceMatrix.needsUpdate = true;
        });
        return g;
      };
      // the balloon: ten gores in two cloths, a webbing collar at the mouth, four lines down to the fan drum. Origin = the drum's foot.
      const BL = style.batch();
      const br = (v) => 17 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(v, 1.6))), 0.8) + 2.4 * (1 - v) * (1 - v);
      style.quilt(BL, { nu: 10, nv: 3, vEdges: [0, 0.42, 0.78, 1], su: 2, sv: 2, bulge: 1.3, tuftK: 0.25, cloth: (iu) => iu % 2,
        P: (u, v, out) => { const a = Math.PI * 2 * u, vv = 0.004 + 0.992 * v, r = br(vv); out[0] = r * Math.cos(a); out[1] = 9 + 44 * vv; out[2] = r * Math.sin(a); } });
      style.quilt(BL, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 2.75 * Math.cos(a); out[1] = 8.4 + 1.5 * v; out[2] = 2.75 * Math.sin(a); } });
      style.quilt(BL, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 2.0 * Math.cos(a); out[1] = 3.4 * v; out[2] = 2.0 * Math.sin(a); } });
      style.quilt(BL, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), flip: true, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 2.0 * v * Math.cos(a); out[1] = 0; out[2] = 2.0 * v * Math.sin(a); } });
      for (let i = 0; i < 4; i++) { const a = (i + 0.5) / 4 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); style.hose(BL, [[1.9 * c, 3.2, 1.9 * s], [2.6 * c, 8.6, 2.6 * s]], 0.14, cl('WEB'), 0, 4); }
      const far = (t, s, y, sc, c) => { const q = fpos0(t, s); return { x: q[0], y, z: q[1], s: sc, c }; };
      // THE SKY'S PLAN. A balloon takes a street cell of the town's own plan: a cross street (STREETS) and a
      // column 96 m wide, the cells spread over the whole town (no two flyers take neighbouring cells; where
      // sixty tries find none free, the cell with most room). The balloons ride in one height band, the
      // blimps above it; a blimp's circle is centred on a cell in the same way. The cells come from a stream
      // of their own. Then the sky's one clearance: no envelope nearer the course's line than three of its
      // own heights (flyClear, at even steps of route metres); one that fails is moved off its cell, level
      // and straight away from the course, never left out. Then the sky's keep-apart (skyApart below).
      const cellR = makeRng(ctx.seed + ':sky-cells'), cells = [];
      const skyCell = () => {
        let x = 0, z = 0;
        for (let k = 0; k < 60; k++) {
          x = 96 * (cellR.int(0, 13) - 6.5); z = cellR.pick(STREETS);
          if (Math.hypot(x - CX, z - CZ) < 660 && !cells.some((c) => Math.abs(c[0] - x) < 100 && Math.abs(c[1] - z) < 80)) break;
        }
        // (where sixty tries find no free cell the plan is nearly full: the flyer then takes the cell of the
        // plan, inside the town, that lies farthest from every cell taken; nothing is drawn for it)
        const inTown = function (px, pz) { return Math.hypot(px - CX, pz - CZ) < 660; };
        const lost = function (px, pz) { return !inTown(px, pz) || cells.some(function (c) {
          return Math.sign(Math.max(Math.abs(c[0] - px) - 100, Math.abs(c[1] - pz) - 80)) === -1; }); };
        const room = function (px, pz) {
          return Math.min(1e9, ...cells.map(function (c) { return Math.hypot(c[0] - px, c[1] - pz); })); };
        if (lost(x, z)) {
          let best = -1;
          for (let c = 0; c !== 14; c++) for (const sz of STREETS) {
            const px = 96 * (c - 6.5), w = inTown(px, sz) ? room(px, sz) : -1;
            if (Math.max(w, best) !== best) { best = w; x = px; z = sz; } }
        }
        cells.push([x, z]); return [x, z];
      };
      // THE SKY'S KEEP-APART: no two flyers ride where they could touch. flown holds every flyer placed so
      // far: its place, its reach in the plan (a balloon: its envelope with its pillows, 19 m in radius at
      // scale 1, and its wander of 13 m; a blimp: the farthest its hull reaches from the middle of its
      // circle) and the heights it rides between. One that, where the course's clearance puts it, would stand
      // within its own reach and another's at heights that meet is moved level to the nearest place where it
      // keeps the course's clearance and touches no flyer (looked for on rings 8 m apart round where it
      // stood, twenty-four places a ring); none is left out, nothing is drawn for it.
      const flown = [];
      const skyApart = function (x, y, z, reach, clear, low, high) {
        const p0 = flyClear(x, y, z, clear);
        const free = function (px, pz) { const q = flyClear(px, y, pz, clear);
          return q[0] === px && q[1] === pz && !flown.some(function (o) {
            return Math.sign(Math.min(high, o[4]) - Math.max(low, o[3])) === 1
              && Math.sign(Math.hypot(px - o[0], pz - o[1]) - reach - o[2]) === -1; }); };
        let px = p0[0], pz = p0[1];
        for (let ring = 1; ring !== 101 && !free(px, pz); ring++) {
          for (let a = 0; a !== 24 && !free(px, pz); a++) {
            px = p0[0] + 8 * ring * Math.sin(a * Math.PI / 12);
            pz = p0[1] + 8 * ring * Math.cos(a * Math.PI / 12); } }
        flown.push([px, pz, reach, low, high]); return [px, pz];
      };
      const BAND = [44, 62], BALLOON_H = 54, BLIMP_H = 30, BLIMP_R = 50;          // the balloons' height band (the drum's foot); the bodies as built below; the radius of a blimp's circle
      const balloonAt = () => { const [cx, cz] = skyCell(), sc = cellR.range(0.8, 1.25), y = cellR.range(BAND[0], BAND[1]), H = BALLOON_H * sc;
        const q = skyApart(cx, y + 0.6 * H, cz, 19 * sc + 13, 3 * H + 9, y - 5, y + H + 5); return { x: q[0], y, z: q[1], s: sc }; };          // (+ 9: how far it wanders along x and along z)
      const balloons = []; for (let i = 0; i < 16; i++) balloons.push(balloonAt());
      const balloonMove = (o, time) => {
        const w = 0.11 + 0.07 * o.ph, a = time * w + o.ph * 40;
        V3.set(o.x + 9 * Math.sin(a * 0.7), o.y + 3.5 * Math.sin(a * 1.9) + 1.5 * Math.sin(a * 3.1 + 1), o.z + 9 * Math.cos(a * 0.53));
        E3.set(0.045 * Math.sin(a * 2.3), o.ph * 6.28 + time * 0.05, 0.045 * Math.sin(a * 1.7 + 2));
      };
      const balloonGeo = flock(BL, balloons, BALLOON_H, balloonMove);
      await ctx.yield();
      // the blimp: a hull in six broad bands, three pillow fins, a fan drum slung under the belly. It lies along local z; origin under the belly.
      const BP = style.batch(), RB = 13, LB = 50;
      style.quilt(BP, { nu: 8, nv: 6, su: 2, sv: 2, bulge: 1.5, tuftK: 0.3, cloth: (iu, iv) => iv % 2,
        P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * (0.004 + 0.992 * v), sb = Math.pow(Math.sin(b), 0.7) * (1 - 0.25 * v); out[0] = RB * sb * Math.cos(a); out[1] = 17 + RB * sb * Math.sin(a); out[2] = LB * Math.cos(b); } });
      for (const [fx, fy] of [[0, 1], [0.87, -0.5], [-0.87, -0.5]]) for (const side of [1, -1]) style.quilt(BP, { nu: 1, nv: 2, su: 2, sv: 2, bulge: 0.9, cloth: 1, flip: side < 0,
        P: (u, v, out) => { const r = 4 + 13 * v * (1 - 0.35 * u), z = -LB * 0.5 - 20 * u - 5 * v; out[0] = fx * r + side * 0.3 * fy; out[1] = 17 + fy * r - side * 0.3 * fx; out[2] = z; } });
      style.quilt(BP, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 2.4 * Math.cos(a); out[1] = 2.4 + 2.4 * Math.sin(a); out[2] = 6 - 9 * v; } });
      for (const sd of [1, -1]) style.quilt(BP, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: cl('WEB'), flip: sd < 0, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 2.4 * v * Math.cos(a); out[1] = 2.4 + 2.4 * v * Math.sin(a); out[2] = sd > 0 ? 6 : -3; } });
      const blimps = [0, 1, 2, 3].map((c) => { const [cx, cz] = skyCell(), sc = cellR.range(0.9, 1.25), y = cellR.range(70, 130);
        const q = skyApart(cx, y + 17 * sc, cz, Math.hypot(BLIMP_R + RB * sc, LB * sc),
          3 * BLIMP_H * sc + BLIMP_R + LB * sc, y - 4, y + BLIMP_H * sc + 4); return { cx: q[0], cz: q[1], y, s: sc, hd: cellR.range(0, 6.28), c }; });          // (the whole circle keeps the clearance, nose to tail)
      flock(BP, blimps, BLIMP_H, (o, time) => {      // a slow circle 50 m in radius, nose along the tangent, a metre a second
        const a = o.hd + time * 0.02;
        V3.set(o.cx + BLIMP_R * Math.sin(a), o.y + 4 * Math.sin(time * 0.21 + o.ph * 9), o.cz + BLIMP_R * Math.cos(a));
        E3.set(0.03 * Math.sin(time * 0.4 + o.ph * 7), a + Math.PI / 2, 0.03 * Math.sin(time * 0.33 + o.ph * 5));
      });
      await ctx.yield();
      // the kite: a parafoil (ram-air cells of ripstop, the one thing here blown up by the wind itself) on a white line (the strap) to a black peg, two tails.
      // Origin = the peg; the kite hangs downwind (local +z) at the top of its line, the instance sways about the peg.
      const KB = style.batch(), KY = 45, KZ2 = 31;
      style.quilt(KB, { nu: 4, nv: 5, su: 2, sv: 2, bulge: 0.45, cloth: (iu, iv) => iv % 2,
        P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * (0.01 + 0.98 * v), sb = Math.pow(Math.sin(b), 0.45), c = Math.cos(a), sn = Math.sin(a);
          const ly = 1.1 * sn * sb, lz = 3.4 * c * sb; out[0] = -7 * Math.cos(b); out[1] = KY + ly * 0.8 + lz * 0.6 + 1.2 * sb; out[2] = KZ2 + lz * 0.8 - ly * 0.6; } });
      const sag = (f) => [0, KY * f - 7 * Math.sin(Math.PI * f) * 0.6, KZ2 * f + 7 * Math.sin(Math.PI * f) * 0.5];
      style.strap(KB, sag(0.9), [0, 0, 0], { peg: false });          // the kite's line: taut from the ring where its bridles meet to the peg below
      for (const sd of [-1, 1]) {
        style.strap(KB, [sd * 5.6, KY - 0.4, KZ2 - 1.6], sag(0.9), { peg: false });
        const tail = [], pins = []; for (let i = 0; i <= 7; i++) { tail.push([sd * 6.2, KY + 0.6 - 0.9 * i, KZ2 + 2.6 + 2.3 * i]); pins.push(sd * 1.6 * i); }
        style.ribbon(KB, tail, 0.9, 1, 0, pins);
      }
      style.ribbon(KB, [[0, 0, 0], [0.3, 1.5, 0.3]], 0.5, cl('WEB'), 0);
      const wrot = Math.atan2(SU.uWind.value.x, SU.uWind.value.y);
      const kites = [{ x: 46, z: 58, s: 1.0 }, { x: -44.3, z: 125.2, s: 0.85 }, { x: 60, z: 172, s: 1.25 }, { x: -66, z: 236, s: 1.1 }, { x: 96, z: 318, s: 1.3 },
        far(214, 96, 0, 1.1), far(262, -78, 0, 1.2)];          // (two beyond the finish; none over the blocks of the far quarter)
      for (const k of kites) { const q = standClear(k.x, k.z, (KY + 3) * k.s); k.x = q[0]; k.z = q[1]; k.y = 0; }          // (the one clearance: its peg no nearer the course's ground track than the kite flies high)
      flock(KB, kites, 60, (o, time) => {
        const a = time * (0.5 + 0.3 * o.ph) + o.ph * 30;
        V3.set(o.x, 0, o.z);
        E3.set(0.07 * Math.sin(a * 0.8) + 0.04 * Math.sin(a * 2.1), wrot + 0.2 * Math.sin(a * 0.45 + 1), 0.16 * Math.sin(a) + 0.05 * Math.sin(a * 2.7));
      });
      // A SECOND FLOCK OF BALLOONS over the town, by the same plan and the same clearance as the first (made after the kites, so that
      // no old phase moves)
      { const more = []; for (let i = 0; i < 16; i++) more.push(balloonAt()); flock(balloonGeo, more, BALLOON_H, balloonMove); }
      // one more kite, flown from a peg beside the start: the kite itself rides above the first frame, and its striped shadow (cells,
      // two tails, the line) lies whole on the lanes between the lens and the lane numbers, drifting as the kite sways
      {
        const g2 = KB.geometry(); disposables.push(g2);
        const ek = [{ x: 18.8, z: 7.8, s: 0.62 }], eB = new Float32Array([60, 0.5, 0.37, 0]), eS = new Float32Array([0, 0, 0, cl('RED') + 8 * cl('WHITE')]);
        const em = instanced(g2, skyMat, ek, eB, eS), es = instanced(g2, style.skin({ instanced: true, shadow: true, sinkMin: 1, rs0: 1 }), ek, eB, eS, 2);
        em.instanceMatrix.setUsage(THREE.DynamicDrawUsage); es.instanceMatrix = em.instanceMatrix;
        movers.push((dt, time) => {
          const a = time * 0.62 + 11;
          V3.set(18.8, 0, 7.8); E3.set(0.05 * Math.sin(a * 0.8), wrot + 0.12 * Math.sin(a * 0.45 + 1), 0.09 * Math.sin(a)); Q4.setFromEuler(E3); S3.set(0.62, 0.62, 0.62);
          em.setMatrixAt(0, M4.compose(V3, Q4, S3)); em.instanceMatrix.needsUpdate = true;
        });
      }
      await ctx.yield();
    }
    // ---- the exit: a finish arch across the far avenue. A tube 4 m thick in red and white bands 3 m wide, leaning
    //      back with the path on six guy lines, a fan drum at each foot. Local frame: +z looks back up the path. ------
    const arch = new THREE.Group();
    {
      const tan = path.tangentAt(1, new THREE.Vector3()).normalize(), zA = tan.clone().negate(), xA = new THREE.Vector3().crossVectors(YAX, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
      arch.matrix.makeBasis(xA, yA, zA).setPosition(END); arch.matrixAutoUpdate = false; arch.updateMatrixWorld(true); scene.add(arch);
      const inv = new THREE.Matrix4().copy(arch.matrix).invert();
      const toLocal = (x, y, z) => { V3.set(x, y, z).applyMatrix4(inv); return [V3.x, V3.y, V3.z]; };
      const B = style.batch(), RX = 10.7, Y0 = -8.9, Y1 = 1.0, R = 3.1, legL = Y1 - Y0, arcL = Math.PI * RX, tot = 2 * legL + arcL;
      const centre = (u, c, t) => {
        const s = u * tot;
        if (s < legL) { c[0] = RX; c[1] = Y0 + s; t[0] = 0; t[1] = 1; }
        else if (s < legL + arcL) { const a = (s - legL) / RX; c[0] = RX * Math.cos(a); c[1] = Y1 + RX * Math.sin(a); t[0] = -Math.sin(a); t[1] = Math.cos(a); }
        else { c[0] = -RX; c[1] = Y1 - (s - legL - arcL); t[0] = 0; t[1] = -1; }
      };
      const c = [0, 0], t = [0, 0], nb = Math.round(tot / 3);
      style.quilt(B, { nu: nb, nv: 6, su: 3, sv: 3, bulge: 0.42, body: 1, cloth: (iu) => (iu % 2 ? cl('WHITE') : cl('RED')),
        P: (u, v, out) => { centre(u, c, t); const ph = Math.PI * 2 * v, n1x = -t[1], n1y = t[0]; out[0] = c[0] + R * Math.cos(ph) * n1x; out[1] = c[1] + R * Math.cos(ph) * n1y; out[2] = R * Math.sin(ph); } });
      // two banded pylons stand shoulder to shoulder with the arch's legs (a finish GATE 40 m across: from the back wall it is the
      // strongest red and white shape after the banded gate), each with a red cone and a white ball, leaning and breathing with the arch
      const PX = RX + R + 3.2, PR = 2.9, PH = 21;
      for (const sd of [1, -1]) {
        style.tube(B, { x: sd * PX, z: 0, ys: [0, 3, 6, 9, 12, 15, 18, 21].map((y) => Y0 + y), rad: (y) => PR * (1.04 - 0.14 * (y - Y0) / PH), gores: 6, sub: 2, sv: 2, bulge: 0.4, body: 1, cloth: (iu, iv) => (iv % 2 ? cl('RED') : cl('WHITE')) });
        style.tube(B, { x: sd * PX, z: 0, ys: [Y0 + PH, Y0 + PH + 3, Y0 + PH + 5.6], rad: (y) => Math.max(0.2, 3.5 * (1 - (y - Y0 - PH) / 5.9)), gores: 6, sub: 2, sv: 2, bulge: 0.3, tuft: false, body: 1, cloth: cl('RED') });
        style.ball(B, sd * PX, Y0 + PH + 6.3, 0, 0.95, 1, cl('WHITE'), 2);
      }
      // six guy lines to pegs in the tarpaulin, and a fan drum with its sleeve at each foot
      const up = (lx, ly, lz) => { V3.set(lx, ly, lz).applyMatrix4(arch.matrix); return [V3.x, V3.y, V3.z]; };
      for (const [lx, ly, dx, dz] of [[PX + PR - 0.4, 8, 11, 13], [PX + PR - 0.4, 8, 11, -15], [-PX - PR + 0.4, 8, -11, 13], [-PX - PR + 0.4, 8, -11, -15], [5.5, 13.2, 6, -27], [-5.5, 13.2, -6, -27]]) {
        const w0 = up(lx, ly, 0), peg = [w0[0] + xA.x * dx - FDIR.x * dz, 0.15, w0[2] + xA.z * dx - FDIR.z * dz];
        const a = [lx, ly, 0], b = toLocal(peg[0], peg[1], peg[2]);
        style.strap(B, a, b, { body: 1, pins: [0, 1] });
      }
      const drums = [];
      for (const sd of [1, -1]) {
        const fw = up(sd * (PX + PR + 5.6), Y0 + 1.5, 0); fw[1] = 2.3; const f = toLocal(fw[0], fw[1], fw[2]), fr = 2.2;
        style.quilt(B, { nu: 8, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, body: 0, cloth: cl('WEB'), flip: sd < 0,
          P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = f[0] + sd * (1.6 - 3.2 * v); out[1] = f[1] + fr * Math.cos(a); out[2] = f[2] + fr * Math.sin(a); } });
        style.quilt(B, { nu: 6, nv: 2, su: 2, sv: 2, bulge: 0.3, body: 1, cloth: cl('RED'), flip: sd < 0,
          P: (u, v, out) => { const a = Math.PI * 2 * u, r = fr * 0.9 + 0.5 * v; out[0] = f[0] - sd * (1.5 + 4.2 * v); out[1] = f[1] + 0.4 * v + r * Math.cos(a); out[2] = f[2] + r * Math.sin(a); } });
        drums.push([f[0] + sd * 1.3, f[1], f[2], sd]);
      }
      const archMat = style.skin({ bodies: 2 });
      archMat.uniforms.uBX.value[0].set(0, 0, 1, 0);
      archMat.uniforms.uBP.value[1].set(0, Y0, 0, 22); archMat.uniforms.uBD.value[1].set(0, 1, 0.5, 1); archMat.uniforms.uBX.value[1].set(0, 0, 1, 0.3);
      const mesh = new THREE.Mesh(B.geometry(), archMat); mesh.frustumCulled = false; arch.add(mesh);
      const sh = new THREE.Mesh(mesh.geometry, style.skin({ shadow: true, share: archMat })); sh.frustumCulled = false; sh.renderOrder = 2; arch.add(sh);
      movers.push((dt, time) => { archMat.uniforms.uBS.value[1].set(1, 0, 0.022 * Math.sin(time * 0.9) + 0.012 * Math.sin(time * 2.3 + 1), 0); });
      archDrums = drums;
      REC.arch = { at: END, h: Y1 + RX + R - Y0 };          // the finish arch as built: its place (the route's end), and its height from its feet to its crown
    }
    await ctx.yield();
    // fan blades in the arch's drums: a soft three-lobed disc, under 0.8 turns a second
    {
      const bl = [], bi = [];
      for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2, r = 2.0 * (0.17 + 0.83 * Math.pow(Math.abs(Math.cos(2.5 * a)), 2.4)), aa = a + 0.55 * r / 2.0; bl.push(0, r * Math.cos(aa), r * Math.sin(aa)); }
      bl.push(0, 0, 0); for (let i = 0; i < 80; i++) bi.push(81, i, i + 1);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bl, 3)); bg.setIndex(bi);
      const bm = new THREE.MeshBasicMaterial({ color: pal.white, side: THREE.DoubleSide, toneMapped: false });
      for (const d of archDrums) { const b = new THREE.Mesh(bg, bm); b.position.set(d[0], d[1], d[2]); arch.add(b); movers.push((dt, time) => { b.rotation.x = time * 3.6 * d[3]; }); }
    }

    // ---- windsock fish: a sock 6 m long, mouth held open by a hoop, on a white pole (the strap); since the seventh the mouth hoop is the strap's white too (black, it read as a stray chevron); four bands of colour (a fish a b a b, a plain sock a b a a) ----
    const heroSkin = hero.object.children[0].material;
    {
      const B = style.batch(), fishy = socks === 'fish', FISHY = 64;
      const rad = (y) => (fishy ? (y < 4.9 ? 1.0 - 0.105 * y : 0.49 + 0.5 * (y - 4.9)) : 0.95 - 0.09 * y);
      style.tube(B, { x: 0, z: 0, ys: [0, 1.6, 3.3, 4.9, 6.2], rad, gores: 6, sub: 2, sv: 2, bulge: 0.12, cloth: (iu, iv) => (iv === 1 ? 1 : iv === 3 ? (fishy ? 1 : 0) : 0) });
      style.quilt(B, { nu: 6, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: STRAP_CLOTH, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 1.08 * Math.cos(a); out[1] = -0.12 + 0.3 * v; out[2] = 1.08 * Math.sin(a); } });
      if (fishy) for (const sd of [-1, 1]) style.quilt(B, { nu: 1, nv: 1, su: 1, sv: 2, bulge: 0.05, cloth: 1, flip: sd < 0,
        P: (u, v, out) => { out[0] = sd * (0.86 + 1.1 * v * (1 - 0.5 * u)); out[1] = 1.3 + 1.5 * u + 0.9 * v; out[2] = 0; } });
      const g = B.geometry(); disposables.push(g);
      const fr = rng.fork('fish'), list = [], poles = style.batch();
      const BANDS = [[cl('RED'), cl('WHITE')], [cl('YELLOW'), cl('PINK')], [cl('GREEN'), cl('WHITE')], [cl('PINK'), cl('WHITE')], [cl('YELLOW'), cl('RED')]];
      // eight on the back wall: their poles are part of the wall's body and sink with it
      const wallFish = [];
      A.fishSeats.forEach((s, i) => {
        // each on the keep's own seat; one nearer the course's line than 8 m is moved along the wall, away from the course, until it is clear
        s = s.clone();
        for (let k = 0; k < 40; k++) { const w = W(s); let best = 1e9, bx = 0; for (const q of TRACK) { const d = Math.hypot(w.x - q[0], FISHY - q[1], w.z - q[2]); if (d < best) { best = d; bx = q[0]; } }
          if (best >= 8) break; s.x -= (w.x >= bx ? 1 : -1) * 0.5; }          // (the keep is turned: world x = -local x)
        style.strap(poles, [s.x, FISHY, s.z], [s.x, 46, s.z], { body: 3, ring: false, peg: false });
        const w = W(s), b = fr.pick(BANDS); w.y = FISHY; wallFish.push(list.length);
        list.push({ x: w.x, y: w.y, z: w.z, s: 1.55, ph: fr(), a: b[0], b: b[1], soft: 0 });
      });
      const pm = new THREE.Mesh(poles.geometry(), style.skin({ bodies: style.MAXB, share: heroSkin })); pm.frustumCulled = false; hero.object.add(pm);
      // A FISH SWIMS CLEAR. Downwind of its pole, for its own length (6.2 m at scale 1), no air-dancer's
      // trunk and no steeple stands within half a metre of it. A pole whose fish would swim into one is moved
      // straight away from it, the least way; no fish is left out. (The eight on the back wall and the three
      // where the flight comes in stay where they are. A roof fish is tested at the largest scale it can be
      // dealt, 1.35, so that no draw changes its order.)
      const gust = SU.uGust.value, wl = Math.hypot(gust.x, gust.y), wx = gust.x / wl, wz = gust.y / wl;
      const inWay = dHi.concat(dLo).map(function (d) { return [d.x, d.z, 1.1 * d.s]; })
        .concat([REC.steeple, REC.farSteeple, REC.bell].map(function (r) { return [r.x, r.z, r.fx]; }));
      const swimClear = function (x, z, sc) {
        for (let pass = 0; pass !== 3; pass++) for (const o of inWay) {
          const dx = o[0] - x, dz = o[1] - z, along = Math.min(Math.max(dx * wx + dz * wz, 0), 6.2 * sc);
          // (ox, oz: from the place along the fish that is nearest the thing, to the thing)
          const ox = dx - along * wx, oz = dz - along * wz, off = Math.hypot(ox, oz);
          const push = Math.max(0, 1.2 * sc + o[2] + 0.5 - off) / Math.max(off, 1e-3);
          x -= ox * push; z -= oz * push;
        }
        return [x, z];
      };
      // the rest above the roofs of both avenues and across the town
      const roofs = hHi.filter((h, i) => i % 3 === 1 && h.born === 0).concat(hLo.filter((h, i) => i % 9 === 2 && h.born === 0));
      const n = Math.min(roofs.length, Math.round(52 * Math.max(detail, 0.7)));
      for (let i = 0; i < n; i++) {
        const h = roofs[i], H0 = fr.range(18, 30), H = h.z > 392 ? 11.2 * (h.sy || 1) + 1.6 + 0.08 * H0 : H0, b = fr.pick(BANDS), p0 = [h.x + fr.range(-3, 3), h.z + fr.range(-3, 3)];
        const p1 = swimClear(p0[0], p0[1], 1.35),
          [px, pz] = h.row ? p1 : standClear(p1[0], p1[1], H);          // (the one clearance, but for what stands on the avenue's two rows)
        style.strap(statics, [px, H, pz], [px, 0, pz], { ring: false });          // (beyond the keep each fish rides just over its own roof on a short pole)
        list.push({ x: px, y: H, z: pz, s: fr.range(1.0, 1.35), ph: fr(), a: b[0], b: b[1], soft: fr.chance(0.15) ? 0.6 : 0 });
      }
      const entryFish = [[20.5, 34, 17, cl('PINK'), cl('YELLOW')], [21, 47, 17, cl('YELLOW'), cl('PINK')], [21.6, 61, 21, cl('GREEN'), cl('YELLOW')]].map(([px, pz, H, a, b]) => {
        style.strap(statics, [px, H, pz], [px, 0, pz], { ring: false });
        const f = { x: px, y: H, z: pz, s: 1.5, ph: fr(), a, b, soft: 0 }; list.push(f); return f; });
      // the reveal's own: three big striped fish on tall poles just beyond the back wall and a row of five
      // giant ones swimming nose to tail over the roofs on the church's side of the far avenue. The table is
      // the typed places, as they were; a fish whose place is taken swims clear of it (swimClear above), so
      // not every one of them stands on its typed place.
      for (const [t, sOff, H, sc, bi] of [[30, 34, 16, 2.0, 0], [28, -35, 16, 2.0, 1], [60, -31, 17, 2.0, 3], [96, 62, 21, 2.6, 2], [121, 62, 23, 2.6, 4], [146, 62, 21, 2.6, 0], [171, 62, 23, 2.6, 1], [196, 62, 21, 2.6, 3]]) {
        const f0 = fpos(t, sOff), q0 = swimClear(f0[0], f0[1], sc),
          [px, pz] = standClear(q0[0], q0[1], H + 2), b = BANDS[bi];
        style.strap(statics, [px, H, pz], [px, 0, pz], { ring: false });
        list.push({ x: px, y: H, z: pz, s: sc, ph: fr(), a: b[0], b: b[1], soft: t < 30 ? -0.6 : -0.25 });      // (negative: these swim fuller than the rest)
      }
      // (where the roofs offered above were fewer than the fish, the rest ride the other low roofs that are
      // up, in the list's order; they are dealt last, so that no fish above changes)
      { const more = hLo.filter(function (h, i) { return i % 9 !== 2 && h.born === 0; });
        const want = Math.min(Math.round(52 * Math.max(detail, 0.7)) - n, more.length);
        for (let i = 0; i !== Math.max(0, want); i++) {
          const h = more[i], H0 = fr.range(18, 30), b = fr.pick(BANDS);
          const H = Math.sign(h.z - 392) === 1 ? 11.2 * (h.sy || 1) + 1.6 + 0.08 * H0 : H0;
          const p0 = [h.x + fr.range(-3, 3), h.z + fr.range(-3, 3)];
          const p1 = swimClear(p0[0], p0[1], 1.35), [px, pz] = standClear(p1[0], p1[1], H);
          style.strap(statics, [px, H, pz], [px, 0, pz], { ring: false });
          const sc = fr.range(1.0, 1.35), ph = fr(), soft = fr.chance(0.15) ? 0.6 : 0;
          list.push({ x: px, y: H, z: pz, s: sc, ph, a: b[0], b: b[1], soft });
        } }
      const iB = new Float32Array(list.length * 4), iS = new Float32Array(list.length * 4);
      list.forEach((f, i) => { iB.set([f.s, 0.5, f.ph, 0], i * 4); iS.set([0, f.soft, 0, f.a + 8 * f.b], i * 4); });
      { const eB = new Float32Array(12), eS = new Float32Array(12);
        entryFish.forEach((f, i) => { eB.set([f.s, 0.5, f.ph, 0], i * 4); eS.set([0, 0, 0, f.a + 8 * f.b], i * 4); });
        instanced(g, style.skin({ instanced: true, shadow: true, sock: true }), entryFish, eB, eS, 2); }
      const fish = instanced(g, style.skin({ instanced: true, sock: true }), list, iB, iS);
      fish.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      movers.push(() => {      // the wall's fish ride its crest as it sinks and is pumped back
        const p = Math.min(1, heroSkin.uniforms.uBS.value[3].x), sy = lerp(20 / 45, 1, p);
        for (const i of wallFish) { const f = list[i]; fish.setMatrixAt(i, M4.makeTranslation(f.x, FISHY * sy, f.z)); }
        fish.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();

    // ---- fan carts: a drum in the colourway's yellow cloth (white in regatta) on four white wheels trailing its hose (37.5 or 43.5 m as drawn) in the drum's own cloth, sent to whatever sags ---------
    {
      // (built twice: the cart, and a lighter body of the same cart that only casts its wash on the floor)
      const cartBody = (lo) => { const B = style.batch(), su = lo ? 1 : 2;
      style.quilt(B, { nu: 8, nv: lo ? 1 : 2, su, sv: su, bulge: 0.15, cloth: 0, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 1.25 * Math.cos(a); out[1] = 2.0 + 1.25 * Math.sin(a); out[2] = 1.8 - 3.6 * v; } });
      for (const sd of [1, -1]) style.quilt(B, { nu: 8, nv: lo ? 1 : 2, vEdges: lo ? [0, 1] : [0, 0.5, 1], su, sv: su, bulge: 0.07, cloth: 0, flip: sd > 0,
        P: (u, v, out) => { const a = Math.PI * 2 * u, b = v * Math.PI * 0.5 * 0.99, r = 1.25 * Math.cos(b); out[0] = r * Math.cos(a); out[1] = 2.0 + r * Math.sin(a); out[2] = sd * (1.8 + 0.95 * Math.sin(b)); } });
      for (const [wx, wz] of [[-1.3, 1.3], [1.3, 1.3], [-1.3, -1.3], [1.3, -1.3]]) {
        if (!lo) style.ball(B, wx, 0.72, wz, 0.7, 0, cl('WHITE'), 3);
        else style.quilt(B, { nu: 6, nv: 1, su: 1, sv: 3, bulge: 0, tuft: false, cloth: cl('WHITE'), P: (u, v, out) => { const a = Math.PI * 2 * u, e = Math.PI * (0.03 + 0.94 * v), sn = Math.sin(e); out[0] = wx + 0.7 * sn * Math.cos(a); out[1] = 0.72 - 0.7 * Math.cos(e); out[2] = wz + 0.7 * sn * Math.sin(a); } });
      }
      // the hose: a round tube of the drum's own yellow cloth (it was black webbing) lying in two lazy curves behind the cart
      const hose = [], hn = lo ? 14 : 28; for (let i = 0; i <= hn; i++) { const s = i / hn; hose.push([1.5 * Math.sin(s * 5.2) * Math.pow(s, 0.8), 0.14 + 1.2 * Math.exp(-s * 14), -2.2 - 30 * s]); }
      style.hose(B, hose, style.STRAP / 2, cl('YELLOW'), 0, lo ? 3 : 4);          // (a hose is as broad as a strap, like every line of the town)
        return B.geometry(); };
      const g = cartBody(false); await ctx.yield(); const gSh = cartBody(true); disposables.push(g, gSh);
      const kr = rng.fork('carts'), list = [], N = 16;
      // where the six couple: along the front wall's foot inside the plaza, clear of the big fan; the last one goes to the fan itself
      const fanW = W(A.fan), fs = Math.sign(fanW.x) || 1, wallZ = W(A.hoseSeats[0]).z - 7;
      const seats = [[-7 * fs, wallZ], [1.5 * fs, wallZ], [-16.5 * fs, wallZ], [10.5 * fs, wallZ], [-26 * fs, wallZ], [fanW.x, fanW.z - 16]];
      for (let i = 0; i < N; i++) {
        if (i < 6) {      // parked in a staggered queue on the avenue at z 190 to 220; they start at 10.4 s, pass under us and reach the wall at about 18 s
          const seat = seats[i], v = 27, ts = 10.0 + 0.1 * i, t1 = 17.5 + 0.3 * i;
          list.push({ kind: 0, lane: Math.sign(seat[0]) * (6 + 2 * Math.floor(i / 2)), sx: seat[0], sz: seat[1], ts, v, z0: seat[1] - v * (t1 - ts - 1.25), x: 0, z: 0, rot: 0, s: 1.45 }); }
        else if (i < 8 || i === 9) { const t = kr.range(20, 190); list.push({ kind: 1, off: (i === 9 ? 8.5 : i % 2 ? 5 : -5), t0: t, sp: kr.range(9, 15) * (i % 2 ? 1 : -1), x: 0, z: 0, rot: 0, s: 1.25 }); }
        else if (i === 8) list.push({ kind: 3, x: 5.2, z0: 22, sp: 11, rot: 0, s: 1.25 });   /* on the sun's side, clear of the house being born on the right */
        else { const sd = i % 2 ? 1 : -1, z = [66, 138, 282, 354, 570, 642][i - 10]; list.push({ kind: 2, z: z + kr.range(-3, 3), x0: sd * (rowX(z) + 21), x1: sd * 150, sp: kr.range(0.05, 0.09), ph: kr(), x: 0, rot: 0, s: 1.25 }); }
      }
      const iB = new Float32Array(N * 4), iS = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) { iB.set([4, 0.5, kr(), 0], i * 4); iS.set([0, 0, 0, cl('YELLOW') + 8 * cl('YELLOW')], i * 4); }
      const carts = instanced(g, style.skin({ instanced: true, sinkMin: 1, rs0: 1 }), list, iB, iS);
      const cartSh = instanced(gSh, style.skin({ instanced: true, shadow: true, sinkMin: 1, rs0: 1 }), list, iB, iS, 2);
      carts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); cartSh.instanceMatrix = carts.instanceMatrix;
      movers.push((dt, time, sec) => {
        for (let i = 0; i < N; i++) {
          const c = list[i]; let x, z, rot;
          if (c.kind === 0) {          // the six that race up the avenue under us and couple to the wall's foot at 18 s
            const tau = Math.max(0, sec - c.ts), zr = c.z0 + (tau < 2.5 ? c.v * tau * tau / 5 : c.v * (tau - 1.25)), zb = c.sz - 8;
            z = zr < zb ? zr : c.sz - 8 * Math.exp(-(zr - zb) / 8);
            const k = smoothstep(250, c.sz - 4, z); x = lerp(c.lane, c.sx, k); rot = Math.atan2((c.sx - c.lane) * 6 * k * (1 - k) / (c.sz - 254), 1);
          } else if (c.kind === 1) {   // up and down the far avenue
            const span = 170, tt = c.t0 + time * c.sp, m = ((tt % (2 * span)) + 2 * span) % (2 * span), t = m < span ? m : 2 * span - m, fwd = (m < span) === (c.sp > 0) ? 1 : -1;
            x = F0.x + FDIR.x * (t + 18) + FSIDE.x * c.off; z = F0.z + FDIR.z * (t + 18) + FSIDE.z * c.off; rot = FROT + (fwd > 0 ? 0 : Math.PI);
          } else if (c.kind === 3) {   // one that trundles up the avenue ahead of us from the entry, hose trailing on the floor; it keeps ahead and joins the race to the wall
            z = Math.min(c.z0 + c.sp * sec + 10 * Math.max(0, sec - 5), 352); x = c.x + Math.sign(c.x) * (3.2 * smoothstep(56, 104, z) + 12 * smoothstep(250, 350, z)); rot = 0.05 * Math.sin(sec * 0.9 + c.z0) + Math.sign(c.x) * 0.14 * smoothstep(56, 80, z) * (1 - smoothstep(80, 104, z));
          } else {                     // along a cross street, out and back
            const m = (time * c.sp + c.ph) % 2, t = m < 1 ? m : 2 - m, e = t * t * (3 - 2 * t);
            x = lerp(c.x0, c.x1, e); z = c.z; rot = (m < 1 ? 1 : -1) * Math.sign(c.x1 - c.x0) * Math.PI / 2;
          }
          Q4.setFromAxisAngle(YAX, rot); V3.set(x, 0, z); S3.set(c.s, c.s, c.s); carts.setMatrixAt(i, M4.compose(V3, Q4, S3));
        }
        carts.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ---- hoses on the tarpaulin: one main in the fan carts' yellow cloth (white in regatta) along each row of air-dancers, 22 stubs a side toward the dancers' drums (live's count: nine of the 44 end where no dancer stands) -----------------
    {
      for (const sd of [1, -1]) {
        const main = []; for (let z = 30; z <= 384; z += 4) main.push([sd * (rowX(z) - 3.4 + 0.7 * Math.sin(z * 0.11 + sd) + 0.25 * Math.sin(z * 0.23)), 0.16, z]);
        style.hose(statics, main, style.STRAP / 2, cl('YELLOW'), 0, 4);
        for (let z = 46; z < 384; z += 16) style.hose(statics, [[sd * (rowX(z) - 1.6), 0.5, z], [sd * (rowX(z) - 2.5), 0.22, z - 1.3], [sd * (rowX(z - 4) - 3.4 + 0.7 * Math.sin((z - 4) * 0.11 + sd) + 0.25 * Math.sin((z - 4) * 0.23)), 0.16, z - 4]], style.STRAP / 2, cl('YELLOW'), 0, 4, 2);
        const far = []; for (let t = 14; t <= 200; t += 4) { const o = sd * (10.4 + 0.7 * Math.sin(t * 0.12 + sd)); far.push([F0.x + FDIR.x * t + FSIDE.x * o, 0.2, F0.z + FDIR.z * t + FSIDE.z * o]); }
        style.hose(statics, far, style.STRAP / 2, cl('YELLOW'), 0, 4);
      }
      await ctx.yield();
    }
    // ---- things sewn and laid on the tarpaulin: door mats, a start bar and a finish bar, metre marks and a countdown in fat sewn
    //      digits, a lawn with a white edge and toys on it where the flight comes in, feeder hoses, cables, pegs, guy lines ------
    {
      const gr = rng.fork('floor-things');
      // a flat pillow mat: centre (cx, cz), half sizes (hx, hy) across / along the reader's view, f = the reader's forward (unit xz)
      const matAt = (cx, cz, f, lx, ly, hx, hy, cloth, y = 0.1, su = 2, sv = 2) => {
        const rx = -f[1], rz = f[0];
        style.quilt(statics, { nu: 1, nv: 1, su, sv, bulge: 0.06, tuftK: 0.6, cloth, flip: true,
          P: (u, v, out) => { const a = lx + (2 * u - 1) * hx, b = ly + (2 * v - 1) * hy; out[0] = cx + rx * a + f[0] * b; out[1] = y; out[2] = cz + rz * a + f[1] * b; } });
      };
      // seven-segment digits, each segment its own sewn strip
      const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
      const digit = (cx, cz, f, ch, W, H, cloth) => {
        const t = W * 0.17, w2 = W / 2, h2 = H / 2, q = H / 4;
        const R = { a: [0, h2 - t, w2, t], g: [0, 0, w2, t], d: [0, -h2 + t, w2, t], b: [w2 - t, q, t, q], c: [w2 - t, -q, t, q], f: [-w2 + t, q, t, q], e: [-w2 + t, -q, t, q] };
        for (const k of SEG[ch]) { const r = R[k]; matAt(cx, cz, f, r[0], r[1], r[2], r[3], cloth, 0.13, 2, 1); }
      };
      const number = (cx, cz, f, str, W, H, cloth) => { const n = str.length, gap = W * 1.32; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * gap; digit(cx - f[1] * o, cz + f[0] * o, f, str[i], W, H, cloth); } };
      const FA = [0, 1], FB = [FDIR.x, FDIR.z];
      // the near avenue: a start bar, lane numbers, a metre mark every hundred metres
      matAt(0, 23.5, FA, 0, 0, 6.4, 0.5, cl('WHITE'));
      [4.8, 1.6, -1.6, -4.8].forEach((x, i) => digit(x, 28.6, FA, String(i + 1), 1.7, 3.6, cl('RED')));
      number(0, 104, FA, '100', 2.5, 5.0, cl('RED')); number(0, 214, FA, '200', 2.5, 5.0, cl('RED')); number(0, 300, FA, '300', 3.4, 6.8, cl('RED'));
      // the far avenue: a countdown to the arch and a finish bar
      // (each numeral on its own white plate with a red hem, so that it reads as a painted number from any height; the 1 has a foot and a flag)
      for (const [t, ch] of [[72, '3'], [116, '2'], [158, '1']]) {
        const q = fpos0(t, 0), Wd = 3.8, Hd = 7.4, tk = Wd * 0.17, off = ch === '1' ? Wd / 2 - tk : 0;
        matAt(q[0], q[1], FB, 0, 0, 3.9, 5.6, cl('WHITE'), 0.07, 2, 3);
        for (const [lx, ly, hx, hy] of [[0, 5.25, 3.9, 0.35], [0, -5.25, 3.9, 0.35], [3.55, 0, 0.35, 4.9], [-3.55, 0, 0.35, 4.9]]) matAt(q[0], q[1], FB, lx, ly, hx, hy, cl('RED'), 0.11, 2, 2);
        digit(q[0] + FB[1] * off, q[1] - FB[0] * off, FB, ch, Wd, Hd, cl('RED'));
        if (ch === '1') { matAt(q[0], q[1], FB, 0, -Hd / 2 + tk, 1.5, tk, cl('RED'), 0.13, 2, 1); matAt(q[0], q[1], FB, -0.95, Hd / 2 - tk, 0.95, tk, cl('RED'), 0.13, 2, 1); }
      }
      { const q = fpos0(186, 0); matAt(q[0], q[1], FB, 0, 0, 7.0, 0.9, cl('RED')); matAt(q[0], q[1], FB, 0, 1.6, 7.0, 0.35, cl('WHITE')); matAt(q[0], q[1], FB, 0, -1.6, 7.0, 0.35, cl('WHITE')); }
      // a mat at every door of both avenues
      const MATC = [cl('RED'), cl('GREEN'), cl('PINK'), cl('YELLOW'), cl('WHITE')];
      hHi.forEach((h, i) => { if (h.born > 100 || h.sx > 1.6) return; const d = HD * h.sz + 2.4, f = [Math.sin(h.rot), Math.cos(h.rot)]; let c = MATC[i % 5]; if (c === h.walls) c = MATC[(i + 1) % 5];
        matAt(h.x + f[0] * d, h.z + f[1] * d, f, 0, 0, 1.7, 1.1, c); });
      await ctx.yield();
      // the lawn where the flight comes in: a green sheet quilted in squares with a white printed edge, toys left on it
      const ls = Math.sign(wob) || 1, LX = ls * 13.6, LZ = 27.5, LW = 4.6, LD = 10.5;
      style.quilt(statics, { nu: 3, nv: 6, su: 2, sv: 2, bulge: 0.1, cloth: cl('GREEN'), flip: true, P: (u, v, out) => { out[0] = LX + (2 * u - 1) * LW; out[1] = 0.1; out[2] = LZ - (2 * v - 1) * LD; } });
      for (const [lx, ly, hx, hy] of [[0, LD + 0.3, LW + 0.6, 0.3], [0, -LD - 0.3, LW + 0.6, 0.3], [LW + 0.3, 0, 0.3, LD], [-LW - 0.3, 0, 0.3, LD]]) matAt(LX, LZ, FA, lx, ly, hx, hy, cl('WHITE'), 0.12, 2, 2);
      const TOYC = [cl('RED'), cl('YELLOW'), cl('PINK'), cl('WHITE')];
      for (const [bx, bz, r] of [[-1.6, -5.5, 1.25], [1.9, -1.5, 0.8], [-0.6, 3.6, 1.0], [2.3, 6.4, 0.6]]) style.ball(statics, LX + bx, r * 0.97 + 0.1, LZ + bz, r, 0, TOYC[Math.floor(gr() * 4)], 3);
      // two skittle cones: a fat tube tapering to a ball
      for (const [bx, bz] of [[-2.6, 0.2], [0.9, -8.2]]) { const c = TOYC[Math.floor(gr() * 3)];
        style.tube(statics, { x: LX + bx, z: LZ + bz, ys: [0.1, 1.2, 2.4], rad: (y) => 0.75 - 0.2 * y, gores: 6, sub: 2, sv: 2, bulge: 0.08, cloth: (iu, iv) => (iv ? cl('WHITE') : c) });
        style.ball(statics, LX + bx, 2.75, LZ + bz, 0.42, 0, c, 2); }
      // the hall's skirt: its groundsheet spread on the tarpaulin before it in its own two cloths, out to the lane's edge tape
      { const X0 = REC.hall.x + 11.2, X1 = -(rowX(97) - 5.2), Z0 = REC.hall.z - 12.5, Z1 = REC.hall.z + 12.5, mx = (X0 + X1) / 2, mz = (Z0 + Z1) / 2, hx = (X1 - X0) / 2, hz = (Z1 - Z0) / 2;
        style.quilt(statics, { nu: 2, nv: 4, su: 2, sv: 2, bulge: 0.1, cloth: cl('PINK'), flip: true, P: (u, v, out) => { out[0] = lerp(X0, X1, u); out[1] = 0.1; out[2] = lerp(Z1, Z0, v); } });
        for (const [lx, ly, bx, by] of [[0, hz + 0.35, hx + 0.7, 0.35], [0, -hz - 0.35, hx + 0.7, 0.35], [-hx - 0.35, 0, 0.35, hz]]) matAt(mx, mz, FA, lx, ly, bx, by, cl('GREEN'), 0.12, 2, 2); }
      await ctx.yield();
      // feeder hoses from each row's main to the fan at every house's corner, cables across the lane, pegs along its edge tape
      for (const sd of [1, -1]) {
        // (the feeder hoses that snaked from each main to the houses are gone: on the floor under the lens they read as loose scribble; the mains, the stubs to the drums and the carts' own hoses stay)
        for (let z = 12; z < 372; z += 9) { const x = sd * (13 + 25 * smoothstep(140, 330, z) - 5.6 + 0.5); style.ribbon(statics, [[x, 0, z], [x + sd * 0.12, 0.55, z]], 0.24, cl('WEB'), 0); }
      }
      // (the three cables that crossed the lane are gone: on the floor under the lens they read as loose scribble)
      await ctx.yield();
    }
    // ---- the statics mesh (hem, pegs, poles, tethers): one body that never moves --------------------------
    const staticMat = style.skin({ bodies: 1 });
    staticMat.uniforms.uBX.value[0].set(0, 0, 1, 0);
    {
      const m = new THREE.Mesh(statics.geometry(), staticMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- clocks ---------------------------------------------------------------------------------------------
    // script seconds come from u. Held at one u (a still, or the world seen through a portal) the gust clock and,
    // after the entry, the birth clock keep running, so nothing stands still; in flight the hold eases away.
    let lastU = -1, hold = 0, shotHold = 0;
    const GUST_LEAD = 5.4;                       // the front that passes the camera at 7 s and reaches the keep at 12 s
    // ---- where the gaze goes: ONE RULE makes every look ------------------------------------------------------------------------
    // A look is at a thing: lookAt(point, reach, weight). The course is walked at even steps of 2 m of route; the look begins at the
    // first place where the thing lies ahead of us and nearer than its reach, and ends where we come abeam of it. The reach is a round
    // number of metres from the thing's own size (four times its size, to the nearest 20 m: a thing 50 m tall is looked at from
    // farther than one 20 m tall); nothing is read from the camera. The pull is one hump over that pass, with no level stretch. One
    // look per thing, no weight over 0.9. No start, end, angle or hold is typed.
    const _c = new THREE.Vector3(), _q = new THREE.Vector3(), LOOK_STEP = 2;
    const reachOf = (size) => 20 * Math.round(size * 4 / 20);
    const lookAt = (at, reach, weight) => {
      const L = path.length; let from = -1, to = L;
      for (let d = 0; d <= L; d += LOOK_STEP) {
        path.posAtDist(d, _c); path.tangentAtDist(d, _q);
        const dist = _c.distanceTo(at), ahead = _q.dot(_c.subVectors(at, _c)) > 0;
        if (from < 0) { if (!(ahead && dist < reach)) continue; from = d; }
        if (!ahead) { to = d; break; }
      }
      return from < 0 || to <= from ? null : { at, from: from / L, to: to / L, weight, fade: 0.5 };
    };
    const P3 = (x, y, z) => new THREE.Vector3(x, y, z), halfUp = (r) => P3(r.x, r.h / 2, r.z);
    // One look per thing, each point and size from the thing's own record or the keep's own anchors: [point, size in metres, weight].
    // The engine lays later looks of its list over earlier ones, so the list is put in the order of where the looks end, the last to
    // end first: the thing we are about to pass is laid over the things beyond it.
    const pois = [
      [halfUp(REC.hall), REC.hall.h, 0.3],                                                    // the hall being blown up, right of the lane: the middle of its walls
      [halfUp(REC.slide), REC.slide.h, 0.6],                                                  // the avenue's slide, left: half way up it
      [P3((REC.nave.x + REC.steeple.x) / 2, REC.steeple.h / 2, (REC.nave.z + REC.steeple.z) / 2), REC.steeple.h, 0.55],   // the bouncy church in its opening, right: between nave and steeple, half way up the steeple
      [P3(PLAZA.x, 0, PLAZA.z), 2 * PLAZA.ring, 0.5],                                         // the plaza floor where the carts race in under us: the middle of its pitch ring; the ring's width
      [W(A.gate), A.crest.y, 0.9],                                                            // the wall's foot at the gate (carts, hoses, the big fan); the wall's standing height
      [W(A.courtyard), A.courtMark, 0.85],                                                    // the yard: its own centre, where the centre mark is sewn; the mark's width
      [P3(REC.gate.x, REC.gate.open / 2, REC.gate.z), REC.gate.h, 0.9],                       // the banded gate over the far avenue: the middle of its opening; floor to crown
      [halfUp(REC.farSteeple), REC.farSteeple.h, 0.4],                                        // the far church's steeple: half way up it
      [halfUp(REC.farSlide), REC.farSlide.h, 0.4],                                            // the far slide: half way up it
      [REC.arch.at, REC.arch.h, 0.6],                                                         // the finish arch: the route's end in its opening; feet to crown
    ].map(([at, size, weight]) => lookAt(at, reachOf(size), weight)).filter(Boolean).sort((a, b) => b.to - a.to);
    // The Tall Tower's look, by places: it begins at the route metre nearest the wall's foot at the gate
    // and ends at the route metre nearest the tower's own foot. One hump over that stretch, aimed at half
    // the tower's height, where it kinks. It is laid over the others. (the route metre nearest a place, in
    // plan, at the looks' even steps)
    const mNear = function (x, z) { let best = Infinity, m = 0;
      for (let d = 0; Math.max(d, path.length) === path.length; d += LOOK_STEP) { path.posAtDist(d, _c);
        const q = Math.hypot(_c.x - x, _c.z - z);
        m = Math.min(q, best) === best ? m : d; best = Math.min(q, best); }
      return m; };
    { const tw = W(A.towerAxis).setY(A.towerTop.y / 2), g = W(A.gate);
      const from = mNear(g.x, g.z) / path.length, to = mNear(tw.x, tw.z) / path.length;
      // its weight is 0.3 of a whole pull, not the design's 0.4: at 0.4 the calm camera's fastest turn, inside this look, was more
      // than half a degree a second above the live version's fastest; at 0.3 neither camera's is (forty seeds, six entry clocks)
      pois.push({ at: tw, from, to, weight: 0.3, fade: 0.5 }); }
    // NEVER MORE THAN ONE WHOLE PULL: the route is walked at the same even steps and the weights of all the looks acting at each place
    // are added up (each weight times its own rise and fall); while the largest sum is over 1, the looks acting at that place are
    // scaled down together by it.
    {
      const L = path.length, hump = (q, u) => { const w = (q.to - q.from) * q.fade; return smoothstep(q.from, q.from + w, u) * (1 - smoothstep(q.to - w, q.to, u)); };
      for (let pass = 0; pass < 24; pass++) {
        let top = 0, uTop = 0;
        for (let d = 0; d <= L; d += LOOK_STEP) { const u = d / L; let sum = 0; for (const q of pois) sum += q.weight * hump(q, u); if (sum > top) { top = sum; uTop = u; } }
        if (top <= 1.0001) break;
        for (const q of pois) if (hump(q, uTop) > 0) q.weight /= top;
      }
    }
    const uniformsRare = SU.uOut.value;
    if (rare) uniformsRare.x = 31;

    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 62, near: 0.3, far: 3400, lookAhead: 24, sway: 0.6, bank: 0.5 },
      pois,
      portal: { shape: 'arch', width: 14, height: 14, tilt: true, color: '#F7F5EE', glow: 0.5, revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none',
      style: 'none',
      update(dt, time, camera, u) {
        const uu = clamp(u ?? 0, 0, 1), sec = secOf(uu), d = Math.min(dt, 0.1);
        if (Math.abs(uu - lastU) < 1e-7) {
          hold += d; if (uu <= 0) hold %= gustPeriod; else shotHold += d;
        } else {
          const target = hold > gustPeriod * 0.5 ? gustPeriod : 0;
          hold += clamp(target - hold, -1.2 * d, 1.2 * d); if (hold >= gustPeriod) hold = 0;
          if (uu < lastU) shotHold = 0;
        }
        lastU = uu;
        style.update(dt, time, camera);
        SU.uClock.value = sec + shotHold;
        // the reveal's gust: the clock is run on so that a front tops the back wall with us (29 s), then held back so that its bow of
        // bending dancers runs down the far avenue just ahead of the flight, reaching the arch as the dive levels out (34 s)
        const gf = clamp((sec - 28.8) / 5.5, 0, 1);
        SU.uGustT.value = sec - GUST_LEAD + hold + (gustPeriod > 6 ? 4.18 * smoothstep(23.5, 28.8, sec) - 3.41 * (0.5 * gf + 0.5 * gf * gf * (3 - 2 * gf)) : 0);
        hero.setTime(sec); hero.update(dt, time, camera);
        for (let i = 0; i < movers.length; i++) movers[i](d, time, sec + shotHold, camera);
      },
      dispose() { for (const g of disposables) g.dispose(); if (hero.dispose) hero.dispose(); },
    };
  },
};
