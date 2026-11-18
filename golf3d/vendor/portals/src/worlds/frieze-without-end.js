// THE FRIEZE WITHOUT END. A lapis cylinder seal as tall as a cathedral rolls over a plain of wet river clay
// and prints one raised picture every turn; we fly up the frieze from its oldest, cracked repeat to the wet
// one, watch the seal come to rest and leave through the hole drilled for its cord.
// Style: a cylinder-seal impression. One clay, four values by dryness, two tones each; a line is a shadow.
// Everything on screen is made from the ONE makeStyle instance of ../parts/frieze-without-end.js: no lights,
// no fog, no pass, post.flat = 1 (the hexes of the brief are the colours shown).
// ROUND THREE (the crew lead's note after the outside review): the frieze is flown HIGH and read as a picture
// (pale figures a tone drier than the leather-dark band, deep cast shade, a lit lip; two registers: ibex, mountain,
// ibex, bull and sun disc below, a file of walking beasts above); the plain carries a country built of the same clay
// (ziggurat, two tells, palms, kilns under smoke, jars, standing tablets stamped with the same picture, gold-horned
// standards); what flies is lumps of wet clay and wheel-cut strokes of dust, never flat plates.
// ROUND SEVEN (the crew lead's polish note): THE LAND BETWEEN TWO RIVERS. A river of flat lapis glaze with pale ripple
// lines runs along the sun side of the band and a canal beyond the far rope, date palms with gold dates on their banks;
// the ziggurat's terraces, the standards, the kiln mouths and the tablets' plinths carry glazed lapis and gold; the print
// has gold bosses and lapis eyes set into it and the drum carries every figure as a crisp clay silhouette (both in the
// part file). The route loops back over the lower register so the file of beasts stands upright at u 0.34, and after
// the slipped foreleg swings out over the river so the seal is seen whole (u 0.61 flank on, u 0.70 its gold end);
// the length is the old one to within a metre, so the other stills stand where they stood. Fewer, larger, round lumps.
// World frame = the brief's: +Z the course, +X to the camera's left, sun toward -X. The hero object sits at
// (0,0,1000) by translation only; "course" coordinates below are world minus (0,0,1000).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, makeStyle, PITCH } from '../parts/frieze-without-end.js';

const Z0 = 1000;                          // world z of the course origin (the seal's contact point at rest)

export default {
  id: 'frieze-without-end',
  name: 'The Frieze Without End',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const { renderer } = ctx;
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
    const vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- the seed's choices (all drawn here, before anything else touches ctx.rng) -------------------
    const vr = ctx.rng.fork('frieze-world');
    const hour = vary.hour === 'day' ? 'day' : vary.hour === 'night' ? 'night' : 'afternoon';      // dawn, golden, any: the default
    const stoneRoll = vr(), weatherRoll = vr(), creatureRoll = vr();
    const stone = stoneRoll < 0.66 ? 'lapis' : stoneRoll < 0.84 ? 'carnelian' : 'serpentine';
    const weather = ['still', 'rain', 'breeze'][Math.floor(weatherRoll * 7.3) % 3];
    const rare = !!vary.rare;             // the second roll: every figure of the oldest repeat has a ghost
    const HOURS = {
      afternoon: { palette: ['#7E6B55', '#A68E6E', '#D6C6A5', '#E4D8BD', '#1F3C88', '#D1A640', '#C9D8D6'], sun: 12, cream: '#EDE4CF', glow: '#F8F2E2' },
      day: { palette: ['#7F7060', '#AA9A82', '#DAD0BA', '#EAE4D2', '#1F3C88', '#D1A640', '#C2D6DE'], sun: 30, cream: '#EEEBE0', glow: '#F7F6F0' },
      night: { palette: ['#2C3446', '#46536B', '#6E7F99', '#8799B2', '#182A63', '#9A854E', '#1C2740'], sun: 12, cream: '#A9BAD6', haze: '#3A4863', glow: '#5A6E90' },
    };
    const H = HOURS[hour];

    const style = makeStyle(ctx, { palette: H.palette, stone, sunElevation: H.sun, cream: H.cream, haze: H.haze, glow: H.glow, night: hour === 'night',
      weather, ghost: rare, creature: creatureRoll });
    const hero = await buildHero(ctx, { style, detail, repeats: 3, nearPatch: 2, sky: true, plain: true });
    hero.object.position.set(0, 0, Z0);
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, fig = A.figures, U = style.uniforms, M = style.materials;
    const W = (v) => new THREE.Vector3(v.x, v.y, v.z + Z0);          // course -> world

    // ---- the flight (entry 80 m short of the first ibex's repeat, at y 72, so the whole animal lies inside the
    // level view the portal gives). One early look from high over the river band (the whole ibex-mountain-ibex group lying
    // below as a shadow drawing that points at the seal), a dive to the slipped foreleg at x -44 (old repeat,
    // z 123), over the mountain's scales, back to the river, the same foreleg leather-hard (z 626), up beside
    // the trailing flank, out over the rope border and round a wide left hook onto a long straight along +X
    // into the bore, so the direction of travel itself points at the cap for the last quarter.
    const seat = W(A.portalSeat.position), slipOld = W(A.slip[1]), slipNew = W(A.slip[0]);
    const nx = slipNew.x + 61, nz = slipNew.z - 626;       // the seed's jitter of the cut
    // Both passes over the slipped foreleg come at it from the same side (south-west of the knee, heading up the
    // course) and look down on it at 25 to 30 degrees, the second simply nearer, so the two frames are one drawing.
    // THE ROUTE (round three): the first half is flown HIGH, 85 to 106 m, so the picture is seen as a picture. Out to
    // the right over the plain and back in heading +X, so the ibex-mountain-ibex group stands upright and whole below
    // (u 0.16); across the band over the mountain's peak with the bull and the sun disc ahead (u 0.25); up
    // the far side beside the file of walking beasts (u 0.34); down across the palm to the river band under the seal (u 0.43);
    // then the second half as it was composed.
    // ROUND FOUR: the second half is rebuilt so each still is its own picture. Straight down to the slipped foreleg (F,
    // u 0.52); out over the river to the second ibex lying wet and whole beside us (I, u 0.61); on to the bull under
    // the hollow that has just printed it (B, u 0.675); past the cap's foot and UP THE FACE OF THE GOLD CAP, 35 m off
    // its granules (u 0.72 to 0.82); over its rim into a descending right-hand turn on the far side of the seal, from
    // whose top the whole frieze runs away behind the stopped drum (T, u 0.87); then down onto the axis and 88 m
    // dead straight into the bore.
    const pts = [
      [-205, 96, -80], [-196, 86, -35], [-187, 84.5, 10], [-190, 89, 50], [-212, 94, 90], [-236, 100, 128], [-232, 104, 162], [-205, 106, 184],
      [-160, 106, 196], [-110, 105, 203], [-65, 103, 212],
      // ROUND SEVEN (same length to within a metre, so every still outside these two stretches stands where it stood):
      // a short loop back over the lower register, so at u 0.34 the file of walking beasts stands UPRIGHT and whole
      // across the frame from 100 to 180 m (it was passed slantwise from 25 m off its ground line) ...
      [-28, 102, 225], [-8, 100, 255], [-20, 98, 290], [-50, 96, 318], [-86.5, 93, 345], [-101, 88, 385], [-94.8, 77, 420], [-75, 62, 452],
      [-97, 54, 492], [-90 + nx, 44, 544 + nz], [-63 + nx, 31, 586 + nz], [-66.5 + nx, 34, 628 + nz],      // round eight: the foreleg is passed 9 m lower (the knee balls a twentieth of the frame)
      // ... and after the slipped foreleg the route swings OUT over the river on the sun side instead of running in
      // under the trailing flank: from there the drum is seen WHOLE with its figures (u 0.61, flank on; u 0.70, the
      // whole gold end as an upright ellipse with the flank running away), never as a slab cut by three edges
      [-118, 52, 672], [-182, 58, 702], [-232, 50, 768], [-270, 52, 822], [-264, 78, 870], [-281, 104, 870],
      // ROUND FIVE, the title: from the cap's foot the route climbs AWAY from the seal on its trailing side, out over the
      // plain, and comes round a left turn 180 m out from the cap and 20 m above its rim (T, u 0.85 to 0.885): from
      // there the stopped seal stands in the near right and the whole printed band lies across the left of the frame,
      // running away to the horizon with its repeats. Then down onto the axis and 110 m dead straight into the bore.
      // The length is the old one to within a few metres, so every earlier still stands where it stood.
      [-304, 124, 846], [-348, 157, 868], [-363, 178, 908], [-357, 184, 946], [-326, 134, 982], [-290, 86, 1000],
      [seat.x - 78, seat.y, seat.z], [seat.x - 39, seat.y, seat.z], [seat.x, seat.y, seat.z],
    ];
    const path = makePath(pts);
    // the seal's clock was composed against a route 1594.4 m long by distance still to fly, when this one was 1764.4 m:
    // uo() keeps that clock exactly as it was, as a function of u alone
    const uo = (u) => 1 - (1 - u) * 1764.4 / 1594.4;
    await ctx.yield();

    // ---- the cracked plain sheds its skin: curled plates of chalk-dry clay that lie, curl and skitter downwind, never
    // higher than a man's head (nothing flat hangs in the air: what flies in this world is a LUMP, below)
    const pr = ctx.rng.fork('frieze-plates');
    const shed = weather === 'rain' ? 0.45 : 1;          // after rain the ground holds: fewer plates lift
    const plainPlates = style.makePlates(Math.round(700 * detail * density * shed), -560, -272, -1150, 330, pr, 1, 0.22);       // round seven: west of the river
    const farPlates = style.makePlates(Math.round(240 * detail * density * shed), 308, 520, -1150, 200, pr, 1, 0.22);            // beyond the canal
    hero.object.add(plainPlates, farPlates);
    // ROUND EIGHT, THE PLAIN SHEDS ITS SKIN WHERE THE ENTRY LOOKS: two lots of large curled plates (5 to 10 m), few enough to
    // count, each with its own hard shade on the ground: on the river's west bank before the first tablets (the lower right
    // of the entry) and along the strip between the river and the rope. They lie, curl, lift an edge, flip and skitter
    // downwind toward the band, never higher than a palm's trunk.
    const bigPlates = [[26, -345, -262, -1090, -740], [12, -306, -262, -1045, -935], [9, -205, -176, -1150, -965]].map(([n, x0, x1, z0, z1]) => {
      const m = style.makePlates(Math.max(6, Math.round(n * detail * density * shed)), x0, x1, z0, z1, pr, 1, 0.3, true), a = m.geometry.attributes.aPlate.array;
      for (let i = 2; i < a.length; i += 4) a[i] = 7.5 + (a[i] - 2.2) * 1.3;        // 7.5 to 14 m: one plate of the cracked plain
      const bed = style.makePlateShade(m, true), sh = style.makePlateShade(m); bed.renderOrder = -0.3; sh.renderOrder = -0.2; hero.object.add(bed, sh, m); return m; });
    await ctx.yield();
    // ---- LUMPS OF WET CLAY flung up by the roller: squeezed out at the two ends and along the trailing contact
    // line, thrown up and back in arcs, tumbling, landing, slumping where they fall. Thick lumps (a knobbly
    // icosahedron), dark wet clay, two tones by the sun like all free clay, so the underside is always in shade.
    const nLp = Math.round(22 * detail * (weather === 'breeze' ? 1.2 : 1));       // round eight: a handful (eight at the near end), none over the fresh print on the river side
    const lpGeo = new THREE.InstancedBufferGeometry(), lpBase = new THREE.IcosahedronGeometry(1, 2);      // round five: a ball of 320 faces, its outline a curve
    { const pa = lpBase.attributes.position, seen = new Map();
      for (let i = 0; i < pa.count; i++) {                 // the same knob for every copy of a corner, so the lump stays closed
        const key = [pa.getX(i), pa.getY(i), pa.getZ(i)].map((v) => v.toFixed(3)).join(',');
        if (!seen.has(key)) seen.set(key, 0.955 + 0.09 * Math.sin(pa.getX(i) * 2.3 + 0.7) * Math.sin(pa.getZ(i) * 1.9 + 1.));      // a smooth slump, never a knob at a corner
        const k = seen.get(key); pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k * 0.8, pa.getZ(i) * k);
      }
      // round four: a lump is ROUND like every other piece of clay here (a drilled ball, slumped): the normal is the
      // ball's own, so the sun cuts one hard crescent of shade across it and no facet shows
      const na = lpBase.attributes.normal;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i) / 0.64, z = pa.getZ(i), l = Math.hypot(x, y, z) || 1; na.setXYZ(i, x / l, y / l, z / l); }
      lpGeo.setAttribute('position', pa); lpGeo.setAttribute('normal', na);
      const arr = new Float32Array(nLp * 4); for (let i = 0; i < nLp * 4; i++) arr[i] = pr();
      lpGeo.setAttribute('aLp', new THREE.InstancedBufferAttribute(arr, 4)); lpGeo.instanceCount = nLp; }
    const lpMat = M.clayFreeBiased(3000);
    lpMat.uniforms.uFall = { value: 1 }; lpMat.uniforms.uSpeed = { value: 10 };
    lpMat.vertexShader = /* glsl */`
      attribute vec4 aLp; uniform float uFall, uSpeed; varying vec3 vL; varying vec3 vW; varying vec3 vN;
      ${style.glsl.common}
      void main(){
        float s = aLp.w, T = 7. + 4. * fract(s * 5.3), ph = fract(uTime / T + aLp.x), t = ph * T;
        float endS = step(0.25, aLp.y), side = aLp.z < 0.5 ? -1. : 1.;                       // three in four come off the two ends
        float x0 = mix(20. + aLp.z * 140., side * (171. + 14. * fract(s * 9.7)), endS);      // the rest off the far half of the contact line
        float vy = 13. + 13. * fract(s * 3.1), vz = 3. + 7. * fract(s * 7.9), vx = mix(4. * (fract(s * 11.3) - 0.5), side * (3. + 7. * fract(s * 2.3)), endS);
        float tf = vy / 4.9, tt = min(t, tf);                                                  // lands at tf, then lies and slumps
        float y = max(vy * tt - 4.9 * tt * tt, 0.);
        float z = uContact - mix(26., 4., endS) * fract(s * 4.1) - (vz + uSpeed) * tt - uSpeed * (t - tt);   // it stays where it fell as the seal rolls on
        float lie = clamp((t - tf) / max(T - tf, 0.5), 0., 1.);
        float alive = step(fract(s * 13.7), uFall) * smoothstep(0., 0.02, ph) * (1. - smoothstep(0.75, 1., lie));
        float size = (1.7 + 2.6 * s * s) * alive;
        float a = tt * (1.1 + 2.2 * fract(s * 3.3)), ca = cos(a), sa = sin(a);
        vec3 p = position * size, n = normal;
        p = vec3(p.x, p.y * ca - p.z * sa, p.y * sa + p.z * ca); n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
        float sl = 1. - 0.45 * smoothstep(0., 0.25, lie);                                      // the slump on landing
        p.y *= sl; n.y /= sl;
        vec3 wp = uOrigin + vec3(x0 + vx * tt, y + 0.55 * size * sl, z) + p;
        vW = wp; vL = wp - uOrigin; vN = n;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`;
    const lumps = new THREE.Mesh(lpGeo, lpMat); lumps.frustumCulled = false; scene.add(lumps);
    await ctx.yield();

    // ---- THE COUNTRY ROUND THE FRIEZE: everything built of the same clay with the same three tools' shapes (slabs,
    // balls, tapering sticks), two tones by the sun plus the pale lip on whatever faces it squarely, sunk in the same
    // haze. One merged mesh, one material. aA = (tone 0 wet..3 chalk | 4 gold | 5 the seal's stone, picture u, picture v);
    // a face with u >= 0 is a stamped tablet: it carries a window of the ONE picture, raked by the sun along its width.
    const BUILT_FRAG = /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec3 vA; uniform vec3 uSunDir, uGold, uStone;
      ${style.glsl.common}
      void main(){
        vec3 N = vN * (gl_FrontFacing ? 1. : -1.); float ln = length(N); N = ln > 1e-5 ? N / ln : vec3(0., 1., 0.);
        float nl = dot(N, uSunDir), f = fwidth(nl) * 0.7 + 0.01;
        float sh = 1. - smoothstep(-0.03 - f, -0.03 + f, nl), lip = smoothstep(0.5 - f, 0.5 + f, nl);
        float ti = vA.x;
        vec3 palest = mix(uTone[3], uCream, 0.6);
        vec3 base = ti < 0.5 ? uTone[0] : (ti < 1.5 ? uTone[1] : (ti < 2.5 ? uTone[2] : uTone[3]));
        vec3 pale = ti < 0.5 ? uTone[1] : (ti < 1.5 ? uTone[2] : (ti < 2.5 ? uTone[3] : palest));
        if (vA.y > -0.5) {                                   // the stamped face: figure a tone paler, cut shade, lit lip
          vec2 uv = vA.yz; float du = 1. / ${PITCH}.;
          float h = fzH(textureLod(uPic, uv, 1.5)) * 5.;
          float s1 = fzH(textureLod(uPic, uv + vec2(2.5 * du, 0.), 1.5)) * 5. - h, s2 = fzH(textureLod(uPic, uv + vec2(6. * du, 0.), 2.)) * 5. - h;
          float s3 = fzH(textureLod(uPic, uv + vec2(11. * du, 0.), 2.5)) * 5. - h, s4 = fzH(textureLod(uPic, uv + vec2(17. * du, 0.), 3.)) * 5. - h;
          float cst = max(max(s1 - 0.62, s2 - 1.5), max(s3 - 2.75, s4 - 4.25));
          float fc = fwidth(cst) * 0.7 + 0.03, fh = fwidth(h) * 0.7 + 0.03;
          float cut = smoothstep(-fc, fc, cst);
          float lp = smoothstep(0.45 - fh, 0.45 + fh, -s1) * (1. - cut);
          base = mix(base, pale, smoothstep(0.9 - fh, 0.9 + fh, h));
          base = mix(base, palest, lp);
          sh = max(sh, cut); lip = 0.;
        }
        vec3 col = fzShade(mix(base, pale, lip), sh);
        if (ti > 3.5) {
          vec3 g = ti > 4.5 ? uStone : uGold;
          col = mix(mix(g * 0.52, g, 1. - sh), mix(g, uCream, 0.5), lip * step(ti, 4.5));
        }
        gl_FragColor = vec4(fzHazed(col, vW), 1.);
      }`;
    const builtMat = new THREE.ShaderMaterial({
      uniforms: U, side: THREE.DoubleSide, fragmentShader: BUILT_FRAG,
      vertexShader: /* glsl */`
        attribute vec3 aA; attribute float aSway; varying vec3 vW; varying vec3 vN; varying vec3 vA; uniform float uTime, uWind;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.);
          wp.x += aSway * (sin(uTime * 0.7 + wp.z * 0.05) + 0.5 * sin(uTime * 1.3 + wp.x * 0.07)) * (0.6 + 0.4 * uWind);     // fronds nod downwind
          vW = wp.xyz; vN = mat3(modelMatrix) * normal; vA = aA;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    });
    const built = [];                      // geometries, world coordinates, each with aA and aSway
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p3 = new THREE.Vector3(), _s3 = new THREE.Vector3();
    // put(geometry, tone, x, y, z, rotY, sx, sy, sz, rotX, rotZ, sway): flat-shaded, toned, placed, kept
    const put = (g, tone, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0, sway = 0) => {
      const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose();
      n.applyMatrix4(_m4.compose(_p3.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s3.set(sx, sy, sz)));
      n.computeVertexNormals();
      const c = n.attributes.position.count, a = new Float32Array(c * 3), sw = new Float32Array(c);
      for (let i = 0; i < c; i++) { a[i * 3] = tone; a[i * 3 + 1] = -1; a[i * 3 + 2] = 0; sw[i] = sway; }
      n.setAttribute('aA', new THREE.BufferAttribute(a, 3)); n.setAttribute('aSway', new THREE.BufferAttribute(sw, 1));
      n.deleteAttribute('uv'); built.push(n); return n;
    };
    const box = (tone, w, h, d, x, y, z, ry = 0) => put(new THREE.BoxGeometry(w, h, d), tone, x, y + h / 2, z, ry);
    const br = ctx.rng.fork('frieze-country');
    const kilnTops = [];                   // course-frame anchors for the smoke (x, y, course z)

    // group helper: everything put since `from` is turned about the vertical and moved as one
    const place = (from, x, z, ry) => { _m4.compose(_p3.set(x, 0, z), _q.setFromEuler(_e.set(0, ry, 0)), _s3.set(1, 1, 1)); for (let i = from; i < built.length; i++) built[i].applyMatrix4(_m4); };
    // a stepped temple tower of mud brick: tiers with pilasters (every one a stripe of light and a stripe of shade), a
    // stair up the sunward face, a shrine with a gold door
    const ziggurat = async (x, z, ry, k) => {
      const from = built.length, tiers = [[230, 36], [168, 30], [112, 26]]; let y = 0;
      for (const [w, h] of tiers) {
        box(1, w * k, h * k, w * k, 0, y, 0);
        const n = Math.round(w / 28);
        for (let i = 0; i < n; i++) { const o = ((i + 0.5) / n - 0.5) * w * k;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) box(1, dx ? 5 * k : 10 * k, h * k, dx ? 10 * k : 5 * k, dx ? dx * (w / 2 + 2) * k : o, y, dx ? o : dz * (w / 2 + 2) * k); }
        box(2, (w + 8) * k, 3 * k, (w + 8) * k, 0, y + h * k, 0);                        // the coping, a pale line round each terrace
        box(5, (w + 11) * k, 8.5 * k, (w + 11) * k, 0, y + h * k - 9 * k, 0);             // round seven: a band of lapis-glazed brick under every coping
        box(4, (w + 12.5) * k, 3 * k, (w + 12.5) * k, 0, y + h * k - 12.6 * k, 0);        // and a gold line under the band
        y += h * k; await ctx.yield();
      }
      box(2, 58 * k, 26 * k, 44 * k, 0, y, 0); box(4, 2 * k, 17 * k, 16 * k, -29.6 * k, y, 0);       // shrine and its gold door
      box(5, 61 * k, 6 * k, 47 * k, 0, y + 19 * k, 0); box(4, 62 * k, 2 * k, 48 * k, 0, y + 26 * k, 0);             // its glazed frieze and gold cornice
      put(new THREE.BoxGeometry(150 * k, 5 * k, 20 * k), 2, -112 * k, 44 * k, 0, 0, 1, 1, 1, 0, 0.64);    // the great stair
      place(from, x, z, ry);
    };
    await ctx.yield();
    await ziggurat(560, 650, 0.3, 1);
    await ctx.yield();
    // a tell: a low mound of old brick with a town on it inside a buttressed wall
    const tell = async (x, z, ry, k, nHouse) => {
      const from = built.length, ax = 190 * k, az = 150 * k, hm = 24 * k;
      put(new THREE.SphereGeometry(1, 16, 4, 0, Math.PI * 2, 0, Math.PI / 2), 2, 0, 0, 0, 0, ax * 1.25, hm, az * 1.25);
      for (let i = 0; i < 14; i++) {                       // the wall: fourteen straight runs with a tower at every turn
        const a0 = i / 14 * 6.2832, a1 = (i + 1) / 14 * 6.2832, x0 = Math.cos(a0) * ax, z0 = Math.sin(a0) * az, x1 = Math.cos(a1) * ax, z1 = Math.sin(a1) * az;
        const len = Math.hypot(x1 - x0, z1 - z0), ang = -Math.atan2(z1 - z0, x1 - x0);
        put(new THREE.BoxGeometry(len, 20 * k, 7 * k), 1, (x0 + x1) / 2, 15 * k, (z0 + z1) / 2, ang);
        box(1, 15 * k, 34 * k, 15 * k, x0, 4 * k, z0, ang);
        if (i % 5 === 4) await ctx.yield();
      }
      for (let i = 0; i < nHouse; i++) {
        const a = br() * 6.2832, r = Math.sqrt(br()) * 0.78, hx = Math.cos(a) * ax * r, hz = Math.sin(a) * az * r, w = (16 + br() * 26) * k, d = (16 + br() * 22) * k, h = (9 + br() * 20) * k;
        box(br() < 0.5 ? 1 : 2, w, h, d, hx, hm * (1 - r * r) * 0.9 + 4 * k, hz, br() * 0.5);
        if (i % 8 === 7) await ctx.yield();
      }
      box(1, 80 * k, 26 * k, 60 * k, 0, hm * 0.9, 0, 0.2); box(2, 46 * k, 20 * k, 34 * k, 0, hm * 0.9 + 26 * k, 0, 0.2);     // the temple platform
      place(from, x, z, ry);
    };
    await tell(-640, 560, 0.25, 1, Math.round(26 * (0.6 + 0.4 * detail)));
    await ctx.yield();
    await tell(470, 1290, -0.4, 0.8, Math.round(16 * (0.6 + 0.4 * detail)));
    await ctx.yield();
    // the potters' yard inside the hook: beehive kilns under smoke, and rows of sealed jars drying from dark to pale
    for (const [kx, kz, kr] of [[-420, 700, 15], [-452, 806, 17], [-478, 925, 14], [-505, 1015, 13], [-222, 1172, 15]]) {
      put(new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), 1, kx, 0, kz, br() * 3, kr, kr * 1.45, kr);
      box(5, kr * 0.5, kr * 0.7, 2, kx - kr * 0.93, 0, kz, Math.PI / 2);                 // the stoke hole, framed in lapis glaze
      box(4, kr * 0.7, kr * 0.13, 2.6, kx - kr * 0.95, kr * 0.7, kz, Math.PI / 2);        // under a gold lintel
      put(new THREE.CylinderGeometry(kr * 0.22, kr * 0.3, kr * 0.5, 7, 1, true), 1, kx, kr * 1.55, kz);
      kilnTops.push(kx, kr * 1.8, kz - Z0); await ctx.yield();
    }
    { const prof = [[0.1, 0], [2.3, 0.3], [4.6, 3.4], [5.2, 7], [4.5, 10.6], [2.6, 13.2], [1.9, 14.6], [2.7, 15.8], [2.4, 16.6], [0.1, 17.2]].map(([r, y]) => new THREE.Vector2(r, y));
      // two lots: eight by the rope, seen whole from the flank; fifteen north of the hook, on the right of the last approach
      const nS = Math.round(8 * (0.6 + 0.4 * detail)), nN = Math.round(15 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nS; i++) { const row = i % 2, col = Math.floor(i / 2), sc = 0.8 + br() * 0.45;
        put(new THREE.LatheGeometry(prof, 9), row, -330 - col * 13 + br() * 3 - row * 4, 0, 722 + row * 18 + br() * 3, br() * 6, sc, sc, sc); if (i % 3 === 2) await ctx.yield(); }      // round five: before the tablet of the title view, clear of the climb's lower edge
      for (let i = 0; i < nN; i++) { const row = i % 3, col = Math.floor(i / 3), sc = 0.85 + br() * 0.5;
        put(new THREE.LatheGeometry(prof, 9), row, -236 - col * 17 + br() * 4 - row * 5, 0, 1126 + row * 20 + br() * 4, br() * 6, sc, sc, sc); if (i % 3 === 2) await ctx.yield(); }
    }
    await ctx.yield();

    // date palms as the seal-cutter makes them, in the round: a wheel-cut trunk, a drilled crown, tapering fronds
    // that nod downwind, two drilled clusters of dates
    const palm = (x, z, H, fine) => {
      const lean = (br() - 0.5) * 0.16, top = H * 0.98;
      put(new THREE.CylinderGeometry(0.03 * H, 0.05 * H, H, 6, 1, true), 1, x, H / 2, z, br() * 6, 1, 1, 1, lean, lean * 0.6);
      const cx = x - Math.sin(lean * 0.6) * H * 0.5, cz = z + Math.sin(lean) * H * 0.5;
      put(new THREE.IcosahedronGeometry(0.07 * H, 0), 2, cx, top, cz, br() * 6);
      const nf = 8, a0 = br() * 6.2832;
      for (let i = 0; i < nf; i++) {                         // a frond: a flat blade that arcs over and tapers to its tip, bone-pale
        const az = a0 + i / nf * 6.2832, t = 0.7 + 0.45 * br(), L = (0.52 + 0.14 * br()) * H, r0 = 0.062 * H;      // round five: fronds broad and long enough to be a palm in silhouette, from the shaded side too
        const d0 = _p3.set(-Math.sin(t) * Math.cos(az), Math.cos(t), Math.sin(t) * Math.sin(az)).clone(), P = [], ST = [0, 0.5, 1];
        for (const q of ST) {
          const c = new THREE.Vector3(cx, top, cz).addScaledVector(d0, L * q); c.y -= 0.55 * L * q * q;
          const dir = d0.clone(); dir.y -= 1.1 * q; dir.normalize();
          const u = new THREE.Vector3().crossVectors(dir, _s3.set(0, 1, 0)).normalize(), v = new THREE.Vector3().crossVectors(u, dir), r = r0 * (1 - q) * (0.55 + 0.9 * q);
          P.push([c.clone().addScaledVector(u, r), c.clone().addScaledVector(v, r * 0.45), c.clone().addScaledVector(u, -r), c.clone().addScaledVector(v, -r * 0.45)]);
        }
        const pos = [];
        for (let k = 0; k < ST.length - 1; k++) for (let j = 0; j < 4; j++) { const a = P[k][j], b = P[k][(j + 1) % 4], c = P[k + 1][j], d = P[k + 1][(j + 1) % 4];
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); if (k < ST.length - 2) pos.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        put(g, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0.02 * H);
      }
      for (const sgn of [-1, 1]) {                           // two drilled clusters of dates, gold (round seven); by the river, where we pass close, they are round balls
        const dx = cx + sgn * 0.07 * H, dy = top - 0.11 * H, dz = cz + (br() - 0.5) * 0.06 * H;
        const g = put(new THREE.IcosahedronGeometry(0.05 * H, fine ? 1 : 0), 4, dx, dy, dz, br() * 6, 1, 1.4, 1);
        if (fine) { const P = g.attributes.position, N = g.attributes.normal;
          for (let i = 0; i < P.count; i++) { const ax = P.getX(i) - dx, ay = (P.getY(i) - dy) / 1.96, az = P.getZ(i) - dz, l = Math.hypot(ax, ay, az) || 1; N.setXYZ(i, ax / l, ay / l, az / l); } }
      }
    };
    const riverX = (z) => -232 + 7 * Math.sin(z * 0.011 + 1) + 3 * Math.sin(z * 0.029), riverW = (z) => 22 + 3 * Math.sin(z * 0.017 + 2);     // centre and half width (world z)
    const canalX = (z) => 252 + 11 * Math.sin(z * 0.0083 + 0.4) + 5 * Math.sin(z * 0.021 + 2.), canalW = (z) => 27 + 4 * Math.sin(z * 0.013);
    const palmSpots = [];
    for (let i = 0; i < 26; i++) palmSpots.push([306 + br() * 40 + (i % 5 === 0 ? 40 : 0), -260 + i * 54 + br() * 34]);          // the far row, beyond the men
    for (let i = 0; i < 20; i++) { const a = br() * 6.2832, r = 1.18 + br() * 0.5; palmSpots.push([-640 + Math.cos(a) * 190 * r, 560 + Math.sin(a) * 150 * r]); }   // round the tell
    // ROUND SEVEN, THE LAND BETWEEN TWO RIVERS: date palms stand along both banks of the river on the sun side and along
    // the near bank of the canal beyond the far rope (none where the route comes low: 60 m clear of it)
    { const _pp = new THREE.Vector3(), lowPath = [];
      for (let i = 0; i <= 220; i++) { path.posAtDist(i / 220 * path.length, _pp); if (_pp.y < 90) lowPath.push(_pp.x, _pp.z); }
      const clearOf = (x, z) => { for (let i = 0; i < lowPath.length; i += 2) if (Math.hypot(lowPath[i] - x, lowPath[i + 1] - z) < 60) return false; return true; };
      for (let i = 0; i < 58; i++) { const z = -560 + i * 37 + br() * 16, west = i % 2 === 0, x = west ? riverX(z) - riverW(z) - 8 - br() * 12 : riverX(z) + riverW(z) + 6 + br() * 5;
        if (clearOf(x, z) && (west || z < 690 || z > 1040)) palmSpots.push([west ? x : Math.min(x, -197), z, 1]); }      // none where the seal's end and its bow roll pass
      for (let i = 0; i < 34; i++) { const z = -420 + i * 58 + br() * 24, x = Math.max(canalX(z) - canalW(z) - 6 - br() * 5, 196); palmSpots.push([x, z]); } }
    for (const q of [[-430, 250], [-455, 290], [-505, 760], [-528, 800], [-498, 985], [-540, 1010], [-455, 1050], [-250, 1150], [-285, 1190], [-205, 1215]]) palmSpots.push(q);
    const nPalm = Math.round(palmSpots.length * (0.6 + 0.4 * detail));
    for (let i = 0; i < nPalm; i++) { const q = palmSpots[Math.floor(i * palmSpots.length / nPalm)]; palm(q[0], q[1], 34 + br() * 20, q[2] === 1); await ctx.yield(); }
    // standards along the far rope: a short clay pole, a gold ball and horns
    for (const z of [-90, 235, 660]) {                      // round five: off the rope, out on the plain, and none where a view looks across the band
      put(new THREE.CylinderGeometry(1.7, 2.6, 40, 6, 1, true), 1, 198, 20, z);
      put(new THREE.CylinderGeometry(3.6, 3.6, 7, 8, 1, false), 5, 198, 34, z);            // round seven: a collar of lapis
      put(new THREE.IcosahedronGeometry(5.6, 1), 4, 198, 44, z);
      for (const sgn of [-1, 1]) put(new THREE.ConeGeometry(2.6, 24, 5, 1, true), 4, 198, 55, z + sgn * 8.5, 0, 1, 1, 1, sgn * 0.62, 0);
    }
    await ctx.yield();
    // standing tablets, each rolled with a stretch of the same seal: a round-topped slab turned a little to the sun so
    // it rakes the face; the window of the picture is (centre pz, centre x, picture metres per metre of tablet)
    const tablet = (x, z, ry, w, h, win) => {
      const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w / 2); sh.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
      const g0 = new THREE.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false, curveSegments: 9 }); g0.translate(0, 0, -4.5);
      const g = g0.toNonIndexed(); g0.dispose(); g.computeVertexNormals();
      const lp = g.attributes.position.array.slice(), ln = g.attributes.normal.array.slice(), sgn = Math.cos(ry) > 0 ? -1 : 1;
      put(g, 1, x, 0, z, ry);
      box(5, w + 8, 5, 15, x, 0, z, ry); box(4, w + 10, 1.5, 17, x, 5, z, ry);          // round seven: a plinth of glazed lapis brick and a gold line
      const a = g.attributes.aA.array;
      for (let i = 0; i < lp.length / 3; i++) if (Math.abs(ln[i * 3 + 2]) > 0.9) {
        a[i * 3 + 1] = (win[0] + sgn * lp[i * 3] * win[2]) / PITCH + 4;                       // + 4 turns: the flag "u >= 0" stays true
        a[i * 3 + 2] = (win[1] + (lp[i * 3 + 1] - h * 0.46) * win[2] + 170) / 340;
      }
    };
    const fz = (p) => p ? p[0] : 200;
    tablet(-285, 190, 0.32, 56, 78, [fz(fig.ibex && fig.ibex[0].head) - 12, -50, 1.9]);          // the rearing ibex
    await ctx.yield();
    tablet(-395, 335, 0.2, 50, 70, [fz(fig.bull && fig.bull.eye) - 34, -62, 1.75]);               // the bull
    await ctx.yield();
    tablet(-600, 300, 0.3, 46, 66, [fz(fig.file && fig.file[1].at) + 6, 86, 1.5]);                 // one of the walking beasts, out by the tell
    await ctx.yield();
    tablet(-545, 890, 1.25, 52, 72, [fz(fig.sun && fig.sun.at), 2, 1.3]);                         // the sun disc, by the kilns
    await ctx.yield();
    tablet(-300, 690, -0.25, 50, 70, [fz(fig.ibex && fig.ibex[1] && fig.ibex[1].head) + 12, -50, 1.7]);   // the facing ibex, in the near left of the title view (its face to +Z and the sun)
    await ctx.yield();
    for (let i = 0; i < built.length; i += 40) {            // merged in batches, a breath between: no long step
      const part = built.slice(i, i + 40), country = new THREE.Mesh(mergeGeometries(part), builtMat); country.frustumCulled = false; scene.add(country);
      for (const g of part) g.dispose();
      await ctx.yield();
    }

    // ---- ROUND SEVEN, THE TWO WATERS: the river on the sun side of the band and the canal beyond the far rope, each a
    // flat ribbon of lapis glaze (the seal's own stone) lying in the plain. One flat blue; the sunward bank's shade lies
    // on it as one darker tone with a cut edge; the far bank shows a pale lit lip; the ripples are pale wheel-cut lines
    // in broken lengths ALONG the flow (so nothing alternates under the lens), sliding slowly downstream.
    { const pos = [], av = [], idx = []; let n = 0;
      for (const [cx, hw, z0, z1] of [[riverX, riverW, -2600, 4000], [canalX, canalW, -2600, 4000]]) {
        const rows = Math.round((z1 - z0) / 20), base = n;
        for (let j = 0; j <= rows; j++) { const z = z0 + (z1 - z0) * j / rows, c = cx(z), w = hw(z);
          pos.push(c - w, 0.45, z, c + w, 0.45, z); av.push(-1, w, 1, w); n += 2; }
        for (let j = 0; j < rows; j++) { const a = base + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('aV', new THREE.Float32BufferAttribute(av, 2)); rg.setIndex(idx);
      const riverMat = new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
        vertexShader: /* glsl */`attribute vec2 aV; varying vec3 vW; varying vec2 vV;
          void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vV = aV; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`varying vec3 vW; varying vec2 vV; uniform vec3 uStone, uVein;
          ${style.glsl.common}
          void main(){
            float hw = max(vV.y, 1.), m = (vV.x + 1.) * hw, fm = fwidth(m) + 0.02, z = vW.z;
            float shade = 1. - smoothstep(8. - fm, 8. + fm, m + 1.6 * sin(z * 0.045));                 // the sunward bank's shade on the water
            float lip = smoothstep(2. * hw - 1.7 - fm, 2. * hw - 1.7 + fm, m);                          // the far bank's lit face
            float lane = vV.x * 4.4 + 0.3 * sin(z * 0.031 + vV.x * 2.), li = floor(lane + 0.5), dl = abs(lane - li) * hw / 4.4;
            float run = fzNoise(vec2((z + uTime * (5. + 2. * sin(li * 2.1))) * 0.03 + li * 7.3, li * 3.1));
            float wl = 0.2 + 0.65 * smoothstep(0.5, 0.8, run), fl = fwidth(dl) + 0.02;
            float line = (1. - smoothstep(wl - fl, wl + fl, dl)) * smoothstep(0.5, 0.53, run) * clamp(1.4 * wl / fl, 0., 1.);
            vec3 col = mix(uStone, uStone * 0.52, shade);
            col = mix(col, mix(uVein, uStone, 0.35 * shade), line * (1. - lip));
            col = mix(col, mix(uTone[3], uCream, 0.6), lip);
            gl_FragColor = vec4(fzHazed(col, vW), 1.);
          }`,
      });
      const rivers = new THREE.Mesh(rg, riverMat); rivers.frustumCulled = false; scene.add(rivers); }
    await ctx.yield();

    // ---- dust smoking downwind (+X) from every high point of the dry repeats: billboarded ribbons ----
    const dr = ctx.rng.fork('frieze-dust');
    const anchorsD = [];
    for (let k = 1; k <= 3; k++) {
      const add = (p, y, len) => anchorsD.push(p[1], y, fig.toCourse(p[0], k), len);
      for (const ib of fig.ibex || []) add(ib.head, 5.5, dr.range(90, 150));
      if (fig.mountain) add(fig.mountain.peak, 5.5, dr.range(110, 170));
      if (fig.bull) add(fig.bull.eye, 5.5, dr.range(80, 120));
      if (fig.palm) add(fig.palm.crown, 5.5, dr.range(100, 150));
      for (let i = 0, got = 0; i < 400 && got < Math.round(12 * density); i++) {             // other high relief, nearer the path
        const x = dr.range(-166, 60), pz = dr.range(0, PITCH), z = fig.toCourse(pz, k);
        if (style.heightAt(x, z) > 3.3) { add([pz, x], style.heightAt(x, z) + 0.5, dr.range(40, 110)); got++; }
      }
      await ctx.yield();
    }
    for (let i = 0; i < kilnTops.length; i += 3) anchorsD.push(kilnTops[i], kilnTops[i + 1], kilnTops[i + 2], -dr.range(80, 110));     // kiln smoke: w < 0
    const nPl = anchorsD.length / 4, SEG = 18;
    const plumeGeo = new THREE.InstancedBufferGeometry();
    { const pos = [], idx = [];
      for (let j = 0; j <= SEG; j++) pos.push(j / SEG, 0, 0, j / SEG, 1, 0);
      for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      plumeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); plumeGeo.setIndex(idx);
      const seeds = new Float32Array(nPl); for (let i = 0; i < nPl; i++) seeds[i] = dr();
      plumeGeo.setAttribute('aAnchor', new THREE.InstancedBufferAttribute(new Float32Array(anchorsD), 4));
      plumeGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1)); plumeGeo.instanceCount = nPl; }
    const plumeMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, { uOp: { value: weather === 'breeze' ? 0.55 : 0.4 }, uNear: { value: 30 } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aAnchor; attribute float aSeed; varying vec2 vUv; varying vec3 vW; varying float vSeed, vLive, vKiln;
        ${style.glsl.common}
        void main(){
          float t = position.x, kiln = step(aAnchor.w, 0.), len = abs(aAnchor.w) * (0.8 + 0.4 * uWind);
          float live = max(kiln, clamp((uFronts.y - aAnchor.z) / 70., 0., 1.) * step(aAnchor.z, uContact - 40.));
          float wav = fzNoise(vec2(t * 3. - uTime * 0.22 * uWind + aSeed * 40., aSeed * 9.)) - 0.5;
          float wav2 = fzNoise(vec2(t * 2.2 - uTime * 0.17 * uWind + aSeed * 17., 4. + aSeed * 5.)) - 0.5;
          vec3 c = uOrigin + vec3(aAnchor.x + t * len * (1. - 0.45 * kiln), aAnchor.y + t * (5. + 16. * aSeed + 34. * kiln * (1. - 0.4 * t)) + wav * 9. * t, aAnchor.z + (wav2 * 26. + 10. * (aSeed - 0.5)) * t);
          vec3 toCam = uCamPos - c; float l = length(toCam); toCam = l > 1e-3 ? toCam / l : vec3(0., 1., 0.);
          vec3 side = cross(vec3(1., 0., 0.), toCam); float ls = length(side); side = ls > 1e-3 ? side / ls : vec3(0., 1., 0.);
          float wdt = (1.2 + 10. * sqrt(t)) * (0.7 + 0.6 * aSeed) * live * (1. + 0.5 * kiln);
          vec3 wp = c + side * (position.y - 0.5) * wdt;
          vUv = vec2(t, position.y); vW = wp; vSeed = aSeed; vLive = live; vKiln = kiln;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW; varying float vSeed, vLive, vKiln; uniform float uOp, uNear;
        ${style.glsl.common}
        void main(){
          float n = fzNoise(vec2(vUv.x * 9. - uTime * 0.6 * uWind + vSeed * 31., vUv.y * 3.2 + vSeed * 7.)) * 0.65 + fzNoise(vec2(vUv.x * 23. - uTime * 1.1 * uWind, vUv.y * 6. + vSeed * 3.)) * 0.35;
          float a = sin(clamp(vUv.y, 0., 1.) * 3.14159) * smoothstep(0., 0.06, vUv.x) * (1. - vUv.x) * (0.45 + 1.1 * n);
          float f = fwidth(a) + 0.01;
          float lvl = 0.5 * smoothstep(0.2 - f, 0.2 + f, a) + 0.5 * smoothstep(0.42 - f, 0.42 + f, a);     // two flat densities, hard-edged
          float d = length(vW - uCamPos);
          gl_FragColor = vec4(mix(uHaze, mix(uHaze, uTone[1], 0.5), vKiln), lvl * mix(uOp, 0.85, vKiln) * vLive * smoothstep(uNear * 0.2, uNear, d));
        }`,
    });
    const plumes = new THREE.Mesh(plumeGeo, plumeMat); plumes.frustumCulled = false; plumes.renderOrder = 3; scene.add(plumes);
    await ctx.yield();
    // ---- THE WIND, DRAWN AS THE SEAL-CUTTER WOULD CUT IT: short tapering strokes of pale dust (the wheel's own mark)
    // sliding downwind (+X) a few metres over the dry PLAIN. Round four: never over the printed band (they read as
    // scratches on the drawing) and never within 60 m of the lens; and since a line here is a shadow, each stroke
    // throws its own: a second quad lying on the plain where the 12 degree sun puts it, in the shade tone.
    const nWs = Math.round(1700 * detail * Math.min(1.2, density) * (weather === 'breeze' ? 1.25 : 1)), wsGeo = new THREE.InstancedBufferGeometry();
    { wsGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1], 3)); wsGeo.setIndex([0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6]);
      const arr = new Float32Array(nWs * 4); for (let i = 0; i < nWs * 4; i++) arr[i] = dr();
      wsGeo.setAttribute('aWs', new THREE.InstancedBufferAttribute(arr, 4)); wsGeo.instanceCount = nWs; }
    const windMat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aWs; varying vec2 vUv; varying vec3 vW; varying float vLive, vSh;
        ${style.glsl.common}
        void main(){
          float s = aWs.w, len = 7. + 13. * s * s, spd = (8. + 10. * fract(s * 7.3)) * uWind, isSh = position.z;
          float hook = step(aWs.z, 0.3), bedg = step(0.3, aWs.z) * step(aWs.z, 0.52);        // bedg: over the smooth unprinted bed ahead of the seal (flat, so they keep their shade)
          float z = mix(mix(-1170. + 1260. * aWs.y, -310. + 520. * aWs.y, hook), uContact + 96. + 440. * aWs.y, bedg) + 6. * sin(uTime * 0.21 + s * 40.);
          float span = mix(mix(900., 340., hook), 560., bedg), x0 = mix(-520., -262., bedg) + mod(aWs.x * span + spd * uTime, span);
          float edge = mix(smoothstep(-520., -470., x0) * (1. - smoothstep(span - 600., span - 520., x0)) * (1. - hook * smoothstep(-215., -192., x0)),
                           smoothstep(-262., -230., x0) * (1. - smoothstep(262., 298., x0)), bedg);
          // round five: the strokes skim the ground (0.7 to 2 m up), so each lies right beside the shade it throws and the
          // pair reads as one mark, a low ridge of dust drawn like every other ridge here: never a shade without its stroke
          float y = 0.7 + 1.1 * fract(s * 3.9) + 0.25 * sin(uTime * 0.5 + s * 17.);
          float xs = x0 + y / max(uSunTan, 0.05);                                             // where its shade falls
          float onPlain = max(bedg, step(190., abs(x0 + 0.5 * len)) * step(190., abs(x0)) * step(190., abs(x0 + len)));
          float shOn = max(bedg, step(190., abs(xs)) * step(190., abs(xs + len)));
          vec3 c0 = uOrigin + vec3(x0 + 0.5 * len, y, z);
          float near = smoothstep(60., 85., length(c0 - uCamPos));
          float dryLand = (1. - step(-278., xs + len) * step(x0, -188.)) * (1. - step(198., xs + len) * step(x0, 304.) * step(0., x0));      // round seven: never over the river or the canal
          vLive = edge * onPlain * near * dryLand * mix(1., shOn, isSh);
          vec3 c = uOrigin + vec3(mix(x0, xs, isSh) + position.x * len, mix(y, 0.35, isSh), z + 1.6 * sin(position.x * 2.2 + uTime * 0.8 + s * 9.));
          vec3 toCam = uCamPos - c; float l = length(toCam); toCam = l > 1e-3 ? toCam / l : vec3(0., 1., 0.);
          vec3 side = cross(vec3(1., 0., 0.), toCam); float ls = length(side); side = ls > 1e-3 ? side / ls : vec3(0., 0., 1.);
          side = mix(side, vec3(0., 0., 1.), isSh);                                            // the shade lies flat on the plain
          float wdt = max(0.9 + 1.3 * fract(s * 5.1), l * uPixel * 1.8) * step(0.5, vLive);
          vec3 wp = c + side * (position.y - 0.5) * wdt;
          vUv = position.xy; vW = wp; vSh = isSh;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW; varying float vLive, vSh;
        ${style.glsl.common}
        void main(){
          float taper = sin(clamp(vUv.x, 0., 1.) * 3.14159) * (0.45 + 0.55 * vUv.x);          // fat toward the head, like a wheel-cut
          float dd = taper - abs(vUv.y - 0.5) * 2., f = fwidth(dd) + 1e-3;
          float a = smoothstep(-f, f, dd - 0.08) * step(0.5, vLive);
          if (a < 0.02) discard;
          vec3 pale = mix(uTone[3], uCream, 0.6);
          gl_FragColor = vec4(fzHazed(mix(pale, fzShade(uTone[3], 1.), step(0.5, vSh)), vW), a);
        }`,
    });
    const windStrokes = new THREE.Mesh(wsGeo, windMat); windStrokes.frustumCulled = false; windStrokes.renderOrder = 2; scene.add(windStrokes);
    await ctx.yield();
    // ---- DUST SMOKES FROM EVERY HIGH POINT OF THE DRY PRINT (the brief's own words), in the same wheel-cut stroke: each
    // stroke is born ON a crest of the relief (a base that is not on something at least 2.6 m high stays dead), tears
    // away downwind across that figure's own cast shade, lengthens, thins and is gone. So over the band nothing floats
    // free of the drawing: every stroke starts at the edge of a figure and leaves it.
    const nCs = Math.round(4000 * detail * Math.min(1.2, density) * (weather === 'breeze' ? 1.2 : 1)), csGeo = new THREE.InstancedBufferGeometry();
    { csGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], 3)); csGeo.setIndex([0, 1, 2, 1, 3, 2]);
      const arr = new Float32Array(nCs * 4); for (let i = 0; i < nCs * 4; i++) arr[i] = dr();
      csGeo.setAttribute('aCs', new THREE.InstancedBufferAttribute(arr, 4)); csGeo.instanceCount = nCs; }
    U.uMtn = { value: new THREE.Vector2(fig.seam0, fig.mountain ? fig.mountain.peak[0] : -999) };      // seam offset, the mountain's picture z
    const crestMat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fragmentShader: windMat.fragmentShader,
      vertexShader: /* glsl */`
        attribute vec4 aCs; varying vec2 vUv; varying vec3 vW; varying float vLive, vSh; uniform vec2 uMtn;
        ${style.glsl.common}
        void main(){
          float s = aCs.w, xb = -104. + aCs.x * 266., zb = -1509. * aCs.y;      // the figure field and the far border, never the river band under the lens
          float hb = fzH(textureLod(uPic, fzPicUv(vec2(xb, zb)), 1.)) * 5.;
          float T = 2.4 + 2.2 * fract(s * 5.3), ph = fract(uTime * uWind / T + aCs.z);
          float dry = step(zb, uFronts.x - 30.) * step(uStart + 4., zb);
          float pzc = mod(zb + uMtn.x, ${PITCH}.);                               // round eight: none born on the mountain's drilled scales (the domes stay clear of marks)
          float alive = step(2.35, hb) * dry * smoothstep(0., 0.1, ph) * (1. - smoothstep(0.65, 1., ph)) * (1. - step(abs(pzc - uMtn.y), 60.) * step(xb, 32.));
          float len = (7. + 13. * s) * (0.35 + 0.65 * ph), x0 = xb + ph * (12. + 22. * s);
          float y = hb + 0.5 + ph * (1.2 + 2.8 * fract(s * 3.9));
          vec3 c0 = uOrigin + vec3(x0, y, zb);
          float cdist = length(c0 - uCamPos);
          alive *= smoothstep(115., 160., cdist) * (1. - smoothstep(380., 540., cdist));     // never over the figures under the lens, never a far speck
          vec3 c = uOrigin + vec3(x0 + position.x * len, y, zb + 1.1 * sin(position.x * 2.2 + uTime * 0.9 + s * 9.) * ph);
          vec3 toCam = uCamPos - c; float l = length(toCam); toCam = l > 1e-3 ? toCam / l : vec3(0., 1., 0.);
          vec3 side = cross(vec3(1., 0., 0.), toCam); float ls = length(side); side = ls > 1e-3 ? side / ls : vec3(0., 0., 1.);
          float wdt = max((0.8 + 1.1 * fract(s * 5.1)) * alive, l * uPixel * 2.4) * step(0.04, alive);
          vec3 wp = c + side * (position.y - 0.5) * wdt;
          vUv = position.xy; vW = wp; vLive = step(0.04, alive); vSh = 0.;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
    });
    const crestStrokes = new THREE.Mesh(csGeo, crestMat); crestStrokes.frustumCulled = false; crestStrokes.renderOrder = 2; scene.add(crestStrokes);
    await ctx.yield();
    // ROUND EIGHT, DUST SMOKES FROM THE HORNS AND THE PEAK (the brief's entry: "dust smoking from the first ibex's horns"):
    // three wisps to each horn top, mountain peak and palm crown of every dry repeat, each a wheel-cut stroke with a fat
    // head and a thin tail whose tail stays on its crest while the head tears away downwind, leaning up the course, so
    // from across the band it is a leaning streamer and never a spike standing on the figure. None nearer than 150 m.
    const wr = ctx.rng.fork('frieze-wisps'), hwA = [];
    { const top = (p, dir) => {                              // the highest lit point of the horn: furthest down-sun within the sweep
        let bx = p[1], bz = p[0];
        for (let dz = -46; dz <= 8; dz += 2) for (let x = p[1] + 34; x > bx; x -= 1) if (style.heightAt(x, fig.toCourse(p[0] + dir * dz, 1)) > 2.2) { bx = x; bz = p[0] + dir * dz; break; }
        return [bz, bx]; };
      const spots = [];
      for (const ib of fig.ibex || []) spots.push(top(ib.head, ib.dir));
      if (fig.mountain) spots.push([fig.mountain.peak[0], fig.mountain.peak[1] + 6]);
      if (fig.palm) spots.push([fig.palm.crown[0], fig.palm.crown[1] + 30]);
      if (fig.bull && fig.bull.eye) spots.push(top(fig.bull.eye, -1));
      for (let k = 1; k <= 3; k++) for (const q of spots) for (let j = 0; j < 4; j++) hwA.push(q[1], style.heightAt(q[1], fig.toCourse(q[0], k)) + 0.4, fig.toCourse(q[0], k), wr()); }
    const hwGeo = new THREE.InstancedBufferGeometry();
    { const pos = [], idx = [], SG = 6;
      for (let j = 0; j <= SG; j++) pos.push(j / SG, 0, 0, j / SG, 1, 0);
      for (let j = 0; j < SG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      hwGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hwGeo.setIndex(idx);
      hwGeo.setAttribute('aHw', new THREE.InstancedBufferAttribute(new Float32Array(hwA), 4)); hwGeo.instanceCount = hwA.length / 4; }
    const wispMat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fragmentShader: windMat.fragmentShader,
      vertexShader: /* glsl */`
        attribute vec4 aHw; varying vec2 vUv; varying vec3 vW; varying float vLive, vSh;
        ${style.glsl.common}
        void main(){
          float s = aHw.w, T = 4.2 + 2.4 * fract(s * 5.3), ph = fract(uTime * uWind / T + s * 7.);
          vec3 a0 = uOrigin + aHw.xyz; float cd = length(a0 - uCamPos);
          float alive = step(aHw.z, uFronts.x - 40.) * step(uStart + 4., aHw.z) * smoothstep(0., 0.12, ph) * (1. - smoothstep(0.72, 1., ph))
                      * smoothstep(150., 200., cd) * (1. - smoothstep(520., 640., cd));
          float len = (12. + 34. * ph) * (0.8 + 0.4 * fract(s * 3.1)), lead = 4. + ph * (42. + 20. * fract(s * 9.7));
          float t = position.x, along = max(lead - len * (1. - t), 0.);            // the tail stays on its crest
          vec2 wd = normalize(vec2(1., 0.8 + 0.1 * sin(s * 40.)));                 // downwind, leaning up the course (all nearly parallel: streamers, not rays)
          float bil = sin(t * 2.6 + uTime * 0.9 + s * 9.) * 1.4 * ph;
          vec3 c = a0 + vec3(wd.x * along - wd.y * bil, 0.6 + along * 0.12 + 1.5 * ph * t, wd.y * along + wd.x * bil);
          vec3 toCam = uCamPos - c; float l = length(toCam); toCam = l > 1e-3 ? toCam / l : vec3(0., 1., 0.);
          vec3 side = cross(vec3(wd.x, 0.12, wd.y), toCam); float ls = length(side); side = ls > 1e-3 ? side / ls : vec3(0., 1., 0.);
          float wdt = max((2.3 + 2. * fract(s * 5.1)) * (0.6 + 0.8 * ph), l * uPixel * 4.2) * step(0.04, alive);
          vec3 wp = c + side * (position.y - 0.5) * wdt;
          vUv = position.xy; vW = wp; vLive = step(0.04, alive); vSh = 0.;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
        }`,
    });
    const wisps = new THREE.Mesh(hwGeo, wispMat); wisps.frustumCulled = false; wisps.renderOrder = 2; scene.add(wisps);
    await ctx.yield();

    // ---- flakes of dry clay on the air. ROUND FIVE: few, large, soft-edged, in the clay's two tones, always BELOW the
    // eye (so none hangs over the sky or over the drum) and gone before the cap fills the view: over the gold and blue
    // face nothing may read as specks on the lens. (The rng draws are kept as they were, for the crumbs after them.)
    const nM = Math.round(3600 * detail), nMs = Math.round(520 * detail);       // round seven: 520, of which a quarter are drawn, fewer over leather-hard clay
    const moteGeo = new THREE.BufferGeometry();
    { const arr = new Float32Array(nM * 4); for (let i = 0; i < nM * 4; i++) arr[i] = dr();
      moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nMs * 3), 3));
      moteGeo.setAttribute('aMote', new THREE.BufferAttribute(arr.slice(0, nMs * 4), 4)); }
    const moteMat = new THREE.ShaderMaterial({
      uniforms: Object.assign({}, U, { uPx: { value: 225 } }), transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        attribute vec4 aMote; uniform float uPx; varying float vSeed, vFade; varying vec3 vW;
        ${style.glsl.common}
        void main(){
          float s = aMote.w; vec3 box = vec3(190., 60., 190.);
          vec3 vel = vec3(6.5 * uWind * (0.6 + 0.8 * s), 0., 1.6 * (fract(s * 7.7) - 0.5));
          vec3 p = aMote.xyz * box + vel * uTime; p.y += sin(uTime * 0.6 + s * 40.) * 2.2; p.z += sin(uTime * 0.47 + s * 71.) * 3.;      // eddies
          vec3 rel = mod(p - uCamPos, box) - 0.5 * box;
          rel.y = -abs(rel.y) - 4.;                                    // below the eye: seen against the ground only
          vec3 wp = uCamPos + rel; vW = wp; vSeed = s;
          vec4 mv = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mv;
          float dist = max(-mv.z, 0.5), size = 0.55 + 0.9 * s * s;
          vec3 e = abs(rel) / (0.5 * box);
          vFade = (1. - smoothstep(0.7, 1., max(e.x, e.z))) * smoothstep(14., 30., dist) * step(0.6, wp.y);
          // A FLAKE IS OF THE CLAY IT FLIES OVER, by the drying lines alone: over the leather-hard stretch, between the leather
          // line (taken straight, the change eased across 32 m either way) and the wet line, the flakes are large chips and
          // fewer; over bone-dry and older ground they are small; the wet line, where the ground draws it, is their end
          float cz = wp.z - uOrigin.z, hard = smoothstep(uFronts.y - 32., uFronts.y + 32., cz);
          vec2 xz = vec2(wp.x - uOrigin.x, cz); float rag = (fzFbm(xz * 0.011) - 0.5) * 64. + (fzNoise(xz * 0.09) - 0.5) * 9.;      // the wet line where the ground draws it (the part's fzDry: its rag, at free clay's height 0), at the flake's own place: a flake comes in over the 9 m behind that line (the fine rag's own 9), so at the line and past it, over wet clay, no flake
          vFade *= (1. - smoothstep(uFronts.x - 9., uFronts.x, cz + rag)) * step(fract(s * 91.7), 0.25 - 0.06 * hard);
          gl_PointSize = clamp(2.2 * size * uPx * (1. + hard) * projectionMatrix[1][1] / dist, 8.5 + 7.5 * hard, 14. + 10. * hard) * step(0.01, vFade);
        }`,
      fragmentShader: /* glsl */`
        varying float vSeed, vFade; varying vec3 vW;
        ${style.glsl.common}
        void main(){
          vec2 q = gl_PointCoord - 0.5; float a = vSeed * 31.4, ca = cos(a), sa = sin(a);
          q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
          float tum = uTime * (0.3 + 0.5 * fract(vSeed * 5.3)) + vSeed * 50.;
          q.y /= 0.45 + 0.55 * abs(sin(tum));
          // round eight: a CHIP, not a disc: a straight-sided flake (six cut edges) in the clay's two tones, its lit face
          // and the shade under its curled lip parted by one hard line, tumbling
          float r = max(abs(q.x) * 1.1 + abs(q.y) * 0.6, abs(q.y) * 1.3), al = 1. - smoothstep(0.40, 0.46, r);
          if (al < 0.02) discard;
          vec3 pale = mix(uTone[3], uCream, 0.6);
          vec3 col = mix(pale, fzShade(uTone[2], 1.), smoothstep(-0.02, 0.02, q.y - 0.08 + 0.3 * q.x));
          gl_FragColor = vec4(fzHazed(col, vW), al * vFade * 0.9);
        }`,
    });
    const motes = new THREE.Points(moteGeo, moteMat); motes.frustumCulled = false; motes.renderOrder = 4; scene.add(motes);
    await ctx.yield();
    // (the flakes that swirled into the cord hole are gone: over the cap's face they read as noise. The draws stay.)
    { const nBf = Math.round(2400 * detail); for (let i = 0; i < nBf * 4; i++) dr(); }
    await ctx.yield();

    // ---- crumbs of wet clay dropping out of the rising hollows on the trailing flank ------------------
    const nCr = Math.round(44 * detail);
    const crGeo = new THREE.InstancedBufferGeometry(), ico = new THREE.IcosahedronGeometry(1, 1);
    crGeo.setAttribute('position', ico.attributes.position); crGeo.setAttribute('normal', ico.attributes.position);      // round seven: a round drop, the ball's own normal
    { const arr = new Float32Array(nCr * 4);
      for (let i = 0; i < nCr; i++) { arr[i * 4] = dr() < 0.6 ? dr.range(-169, -95) : dr.range(-95, 168); arr[i * 4 + 1] = dr.range(0.32, 1.45); arr[i * 4 + 2] = dr(); arr[i * 4 + 3] = 0.9 + 1.3 * dr() * dr(); }
      crGeo.setAttribute('aCr', new THREE.InstancedBufferAttribute(arr, 4)); crGeo.instanceCount = nCr; }
    const crMat = M.clayFreeBiased(3000);
    crMat.uniforms.uFall = { value: 1 };
    crMat.vertexShader = /* glsl */`
      attribute vec4 aCr; uniform float uFall; varying vec3 vL; varying vec3 vW; varying vec3 vN;
      ${style.glsl.common}
      void main(){
        float T = 5.2, ph = fract(uTime / T * (0.8 + 0.4 * fract(aCr.z * 7.1)) + aCr.z), t = ph * T;
        float y0 = 80.05 - 80.05 * cos(aCr.y), z0 = uContact - 80.05 * sin(aCr.y) - 0.6;
        float y = y0 - 4.9 * t * t, z = z0 - 1.4 * t;
        float alive = step(0.3, y) * step(fract(aCr.z * 13.7), uFall) * smoothstep(0., 0.04, ph);
        float a = t * (1.5 + 3. * fract(aCr.z * 3.3)), ca = cos(a), sa = sin(a);
        vec3 p = position * aCr.w * alive, n = normal;
        p = vec3(p.x, p.y * ca - p.z * sa, p.y * sa + p.z * ca); n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
        vec3 wp = uOrigin + vec3(aCr.x, y, z) + p;
        vW = wp; vL = wp - uOrigin; vN = n;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`;
    const crumbs = new THREE.Mesh(crGeo, crMat); crumbs.frustumCulled = false; scene.add(crumbs);
    ico.dispose();
    await ctx.yield();
    const _sz = new THREE.Vector2();

    // ---- gaze, portal, post ----------------------------------------------------------------------------
    // The seal's clock. The route is 126 m longer than the one the second half was composed on, so the picture's
    // progress runs a little behind u to the flank and a little ahead after it: every later view keeps its place.
    const progOld = (u) => lerp(0.9516 * u, 1 - (1 - u) * 1.0858, smoothstep(0.59, 0.69, u)), prog = (u) => progOld(uo(clamp(u, 0, 1)));
    // THE GAZE of the second half is one target that glides from picture to picture (held between u0 and u1 of each
    // key, eased between keys), so nothing of the travel direction leaks in between two looks.
    const contactW = (u) => Z0 + style.sealZ(prog(u));
    const KEYS = [
      [0.45, 0.485, (u) => _k[0].set(-50, 40, contactW(u) - 20)],               // down to the river band: the whole seal standing over the leather-hard palm and ibex
      // (eleventh) THE GLANCE DOWN IS TAKEN OUT. Live held the gaze from u 0.508 to 0.53 on the ground beside the slipped foreleg
      // (slipNew.x + 18, 0, slipNew.z + 1: "the slipped foreleg and the mountain's scales right under the lens (no drum ...)");
      // from 30 to 34 m up that is pale relief on dark clay filling the frame with no subject, and strangers named it a blur of beige
      // blobs four of four. The gaze now glides in one ease from the river band's look to the drum whole, so the seal stays in
      // the frame from u 0.45 to 0.63 (its top edge cut a little in parts, as in live). The slipped foreleg is not seen close any more: it leaves the low frame at about u 0.505.
      [0.565, 0.63, (u) => { const k = smoothstep(0.57, 0.605, u); return _k[2].set(lerp(-11, 10, k), lerp(48, 41, k), contactW(u) + lerp(21, 8, k)); }],              // THE DRUM WHOLE, flank on, its figures riding round it; the wet print at its foot
      [0.685, 0.71, (u) => _k[3].set(-130, 66, contactW(u) - 28)],              // the whole gold end as an upright ellipse, the flank running away to the left
      [0.735, 0.75, (u) => _k[4].set(-172, 70, contactW(u) - 30)],              // the beaded face of the cap, close, as the climb begins
      [0.775, 0.80, () => _k[5].set(-150, 42, Z0 - 58)],                        // climbing away: the whole cap at the right, the wet band and the bow roll at its foot
      [0.84, 0.872, () => _k[6].set(0, 14, 870)],                                // THE TITLE (round eight: turned 12 degrees toward the seal): the stopped seal WHOLE in the right of the frame with its foot and bow roll, the band running from its foot across to the upper left
      [0.892, 1, () => _k[7].set(-172, 80, Z0)],                                // the bore (round eight: from u 0.9, so the dive is flown AT the cap's centre)
    ];
    const _k = Array.from({ length: 8 }, () => new THREE.Vector3());        // (eleventh) eight scratch vectors by count: the keys keep their own, _k[1] is no key's now
    const gazeAt = (u, out) => { let i = 0; while (i < KEYS.length - 1 && u > KEYS[i + 1][0]) i++;
      const A = KEYS[i], B = KEYS[Math.min(i + 1, KEYS.length - 1)], k = smoothstep(A[1], B[0], u);
      return out.copy(A[2](u)).lerp(B[2](u), k); };
    const _g = [0, 1].map(() => new THREE.Vector3());
    const pois = [
      { at: [-20, 5, 195], from: 0.035, to: 0.125, weight: 0.88, fade: 0.3 },                  // the ibexes and the mountain, the seal whole but for its near end at the right
      { at: [-30, 0, 176], from: 0.118, to: 0.215, weight: 0.9, fade: 0.25 },                  // ibex, mountain, ibex: upright and whole
      { at: [-35, 0, 460], from: 0.205, to: 0.3, weight: 0.9, fade: 0.25 },                    // the sun disc and the bull, the whole seal standing over them
      { at: [110, 0, 356], from: 0.29, to: 0.39, weight: 0.95, fade: 0.25 },                   // the file of walking beasts, upright across the frame, the canal and the ziggurat beyond
      { at: [-70, 20, 640], from: 0.385, to: 0.475, weight: 0.8, fade: 0.3 },                  // the seal over the palm as we come down to the river
      ...[0.45, 0.46].map((from, i) => ({ at: (time, u) => gazeAt(u, _g[i]), from, to: 0.99, weight: 0.9, fade: 0.06 })),
    ];
    const sm = (a, b, u) => smoothstep(a, b, u);
    // slow for the high opening look, quick over the dry repeats, slow again for the leather foreleg and the
    // flank, a brisk hook, an unhurried straight
    const pace = (u) => 0.78 + 0.27 * sm(0.3, 0.4, u) - 0.4 * sm(0.46, 0.53, u) + 0.3 * sm(0.69, 0.76, u) - 0.33 * sm(0.79, 0.85, u) + 0.33 * sm(0.89, 0.93, u);

    let disposed = false;
    return {
      scene, path, duration: 49, pace,
      camera: { fov: 62, near: 0.5, far: 6000, lookAhead: 40, sway: 0.5, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#' + style.palette.gold.getHexString(), glow: 0.3, revealDistance: 300 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const uu = prog(clamp(u, 0, 1));
        hero.setProgress(uu);
        hero.update(dt, time, camera);
        const speed = (style.sealZ(uu + 0.004) - style.sealZ(uu - 0.004)) / (0.008 * 42);
        crMat.uniforms.uFall.value = 0.3 + 0.7 * clamp(speed / 10, 0, 1);
        lpMat.uniforms.uFall.value = 0.25 + 0.75 * clamp(speed / 10, 0, 1); lpMat.uniforms.uSpeed.value = Math.max(speed, 0);
        moteMat.uniforms.uPx.value = renderer.getDrawingBufferSize(_sz).y * 0.5;
      },
      dispose() { if (disposed) return; disposed = true; hero.dispose(); },
    };
  },
};
