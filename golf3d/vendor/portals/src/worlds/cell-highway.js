// The Inner Highway: inside a living cell painted in watercolour. The camera rides on a cargo bubble towed by a
// vermilion two-footed motor that strides along a banded microtubule, under drifting mitochondria and the arches
// of the Golgi, switches onto a branch and floats up into one open pore of the nucleus. The ride swings slowly
// round the tube (SWING, in the tube's own metres): the tube runs out of one lower corner and then the other, and
// the gaze goes to the cell's things in turn. The bubble is the seat, under the frame in every window.
//
// Everything is unlit watercolour: the hero's wash() / paper pass (src/parts/cell-highway.js, WC) shades every
// material, distance dilutes each colour into the painted sheet behind it, and the sheet's tooth is fixed to the
// screen. World space == hero space (the hero sits at the origin).
//
// Looks by seed (ctx.vary.hour is honoured): cream cold-press day; a very wet rose-and-gold dawn sheet; a golden
// sheet in raw sienna and madder; night on indigo paper in pale gouache. Wetness is the weather (wet blooms or
// dry-brush sparkle). Cast: classic, plant cell (chloroplasts streaming round a clear vacuole), secreting cell
// (three Golgi stacks, bubble traffic) or quiet cell (long mitochondria). Rare: the tube beside ours peels apart.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, WC } from '../parts/cell-highway.js';

const LOOKS = {
  day: { pal: ['#F3E6CB', '#7FBFA8', '#B9A3D9', '#F4B899', '#2F6F73', '#4A4A52', '#E2432A'], bgA: '#74BAA1', bgB: '#C0ACDC', fogD: 580, wet: null, exposure: 1.0 },
  dawn: { pal: ['#F7ECDF', '#86BDA6', '#D58AA8', '#E8B56C', '#4F7A93', '#5E5866', '#E2432A'], bgA: '#E39AAE', bgB: '#EFC77C', fogD: 580, wet: 0.88, exposure: 1.0 },
  golden: { pal: ['#F2E1BF', '#B5A562', '#B67C95', '#E8AF78', '#6A5661', '#55473F', '#E2432A'], bgA: '#D9B56E', bgB: '#C58FA3', fogD: 560, wet: null, exposure: 1.0 },
  night: { pal: ['#222A4B', '#A9D6C0', '#E6E4F2', '#EBCFC0', '#3B4F86', '#C9CEDF', '#E2432A'], bgA: '#2C5870', bgB: '#8D8FCB', fogD: 600, wet: null, hi: '#F7F3E6', gouache: true, exposure: 1.0 },
};
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  id: 'cell-highway',
  name: 'The Inner Highway',
  category: 'interior',
  weirdness: 0.6,
  media: ['tiny', 'interior', 'rail'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    // ---------------------------------------------------------------- the look of this visit
    const lr = rng.fork('look');
    const hour = ['dawn', 'day', 'golden', 'night'].includes(vary.hour) ? vary.hour : lr.pick(['day', 'day', 'dawn', 'golden', 'night']);
    const look = LOOKS[hour];
    const wet = look.wet ?? lr.pick([0.92, 0.5, 0.12]);                    // wet day, ordinary, dry-brush day
    const cast = lr.pick(['classic', 'plant', 'secreting', 'quiet']);
    const cargo = lr.pick(['bubble', 'mito', 'granule']);
    const rare = !!vary.rare;
    const hexPal = look.pal, col = (h) => new THREE.Color(h);
    const bubbleTint = look.gouache ? '#BFE6D2' : hexPal[1];              // the bubble is sea-green whatever it carries: the cargo shows in its dots
    const cargoColors = (cargo === 'mito' ? [3, 3, 3, 2, 3] : cargo === 'granule' ? [4, 5, 4, 2, 4] : [3, 2, 1, 3, 2]).map((k) => col(hexPal[k]));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(col(hexPal[0]), 1, 100000);                 // only switches the fog path on; the curve is uFogD
    scene.background = col(hexPal[0]);

    const hero = await buildHero(ctx, {
      palette: hexPal, portalStandIn: false, vehicle: true, bubble: true, lead: { length: 290, bearingDeg: 30 },
      highlight: look.hi || hexPal[0], wet, gouache: !!look.gouache, bubbleTint, cargoColors,
    });
    scene.add(hero.object);
    await ctx.yield();
    const SH = hero.shared, pal = hero.pal, A = hero.anchors, relS = A.tube.releaseS, C = A.nucleus.center;
    SH.uBgA.value = col(look.bgA); SH.uBgB.value = col(look.bgB); SH.uBgK.value = 1; SH.uFogD.value = look.fogD;
    SH.uBgDeep.value = look.gouache ? 0 : hour === 'dawn' ? 0.8 : 1;       // the two ground washes laid deeper, with a clear edge; the night sheet is deep already
    SH.uBody.value = look.gouache ? 0 : hour === 'dawn' ? 0.55 : 1;       // how thickly the paint is charged: the dawn sheet is the diluted one, gouache takes none
    const mat = (own, vs, fs, extra) => WC.wcMaterial(SH, own, vs, fs, extra);
    const blendMul = look.gouache
      ? { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }
      : { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
    const GOU = look.gouache ? 1 : 0;

    // ---------------------------------------------------------------- the route: a slow swing round our tube, then up into the pore
    // arc length along our tube, and the junction's place on it
    const F = { P: V3(), T: V3(), S: V3(), U: V3() }, S0 = 14, pts = [], tp = V3();
    const tubeMax = Math.min(A.tube.length, relS + 230), TS = Math.ceil(tubeMax / 1.5), tubePts = new Float32Array((TS + 1) * 3);
    for (let i = 0; i <= TS; i++) { hero.tubeFrame((i / TS) * tubeMax, F); tubePts.set([F.P.x, F.P.y, F.P.z], i * 3); }
    const sJ = (() => { let best = 1e18, bs = 0; for (let i = 0; i <= TS; i++) { const d = tp.set(tubePts[i * 3], tubePts[i * 3 + 1], tubePts[i * 3 + 2]).distanceToSquared(hero.junction.position); if (d < best) { best = d; bs = (i / TS) * tubeMax; } } return bs; })();
    const sG0 = sJ - 125;                                                 // where the first sac of the Golgi stands on our tube
    // the arch's own room: a capsule round the six sacs (their rims with their beads reach 61 m from our tube and 79 m over
    // it). The fan and the reticulum's nets keep out of it, as they keep off the route: nothing runs through a sac
    const archA = V3(), archB = V3(), archT = V3(), archQ = V3();
    hero.tubeFrame(sG0, F); archA.copy(F.P).addScaledVector(F.U, 14); hero.tubeFrame(sG0 + 85, F); archB.copy(F.P).addScaledVector(F.U, 14);
    const inArch = (x, y, z, r = 70) => {
      archT.subVectors(archB, archA); const k = Math.min(1, Math.max(0, archQ.set(x, y, z).sub(archA).dot(archT) / archT.lengthSq()));
      return archT.multiplyScalar(k).add(archA).distanceToSquared(archQ.set(x, y, z)) < r * r;
    };
    // THE RIDE MOVES ROUND THE TUBE. Where the lens rides in the tube's own frame, by the tube's metres: [s, to starboard, up].
    // Out of the wall it drifts down to starboard (the tube runs out under the port bow and the motor is seen from its
    // quarter, the dividing mitochondrion over the starboard bow), comes in to the arch off its middle and crosses over
    // high inside the first arches, swings out to port for the junction (the motor is seen from its side as it steps
    // onto the branch, the fan and then the globe beyond), crosses back high over the branch, sinks to starboard beside
    // the motor (the nucleus's own layers beyond it) and comes up under the pore's line for the release. The low passes
    // are to starboard and the port passes are high: the walkers that share our tube keep to its port flank, their
    // cargo beside them. No station is nearer the tube's axis than 7.5 m; each leg is 35 m of tube or more, eased at both ends.
    const SWING = [[S0 + 14, 0, 7.5], [S0 + 70, 8.5, 5.5], [sG0 - 30, 4, 7.5], [sG0 + 12, -4.5, 10], [sG0 + 78, -8.5, 10.5], [sJ - 6, -9, 8.5], [sJ + 50, -1, 12], [sJ + 100, 9, 5], [relS - 26, 1.5, 8]];
    // Between the stations the lens is carried on one smooth curve (a monotone cubic: it comes to rest across the tube only
    // where a swing turns back, and runs on through a station where the next leg goes the same way), so each swing is one
    // slow S and the lens never stops and starts in the middle of one.
    const swM = SWING.map((p, k) => (k === 0 || k === SWING.length - 1 ? [0, 0] : [1, 2].map((j) => {
      const a = SWING[k - 1], b = SWING[k + 1], h0 = p[0] - a[0], h1 = b[0] - p[0], d0 = (p[j] - a[j]) / h0, d1 = (b[j] - p[j]) / h1;
      return d0 * d1 <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
    })));
    const lensOff = (s, o) => {
      let k = 0; while (k < SWING.length - 2 && s > SWING[k + 1][0]) k++;
      const a = SWING[k], b = SWING[k + 1], h = b[0] - a[0], t = Math.min(1, Math.max(0, (s - a[0]) / h)), t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = (t3 - 2 * t2 + t) * h, h01 = 3 * t2 - 2 * t3, h11 = (t3 - t2) * h;
      o.x = h00 * a[1] + h10 * swM[k][0] + h01 * b[1] + h11 * swM[k + 1][0]; o.y = h00 * a[2] + h10 * swM[k][1] + h01 * b[2] + h11 * swM[k + 1][1]; return o;
    };
    { const o = { x: 0, y: 0 };
      for (let s = S0; s < relS - 22; s += 12) { hero.tubeFrame(s, F); lensOff(s, o); pts.push(F.P.clone().addScaledVector(F.S, o.x).addScaledVector(F.U, o.y)); } }
    const seat = A.portalSeat.position, nrm = A.portalSeat.normal;
    pts.push(A.release.clone(), seat.clone().addScaledVector(nrm, 45), seat.clone().addScaledVector(nrm, 30), seat.clone().addScaledVector(nrm, 15), seat.clone());
    const path = makePath(pts), L = path.length, uRel = 1 - 60 / L;
    await ctx.yield();
    // arc length on the tube beside the lens, as a function of u
    const NU = 200, sTab = new Float32Array(NU + 1);
    { let last = 0;
      for (let k = 0; k <= NU; k++) {
        path.pointAt((k / NU) * uRel, tp); let best = 1e18, bi = last;
        for (let i = last; i <= Math.min(TS, last + 40); i++) { const dx = tubePts[i * 3] - tp.x, dy = tubePts[i * 3 + 1] - tp.y, dz = tubePts[i * 3 + 2] - tp.z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
        last = bi; sTab[k] = (bi / TS) * tubeMax;
      } }
    const sAt = (u) => { const f = Math.min(1, Math.max(0, u / uRel)) * NU, i = Math.min(NU - 1, Math.floor(f)); return sTab[i] + (sTab[i + 1] - sTab[i]) * (f - i); };
    const uOfS = (s) => { let k = 0; while (k < NU && sTab[k] < s) k++; return (k / NU) * uRel; };
    const uJ = uOfS(sJ), mainDir = hero.junction.mainDir.clone();
    // the heading things are hung by is the tube's own, not the lens's as it swings across the tube: a body laid 200 m ahead
    // "along the route" from a place where the lens is crossing over would be thrown 40 m aside by the crossing's slant
    const headAt = (uu, out) => { if (uu >= uRel) return path.tangentAt(uu, out); hero.tubeFrame(sAt(uu), F); return out.copy(F.T); };
    const d0 = path.tangentAt(0).clone().setY(0).normalize(), ex = V3().crossVectors(d0, V3(0, 1, 0)).normalize(), ey = V3(0, 1, 0);
    SH.uBgMoon.value.copy(C).sub(path.pointAt(0.1)).normalize();
    await ctx.yield();

    // ---------------------------------------------------------------- the sheet: paper, the wet wash, the lilac bloom
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(3000, 3), mat({}, /* glsl */`
      ${WC.VERT_PARS}
      void main(){ vec3 p = position; vec3 n = normal; ${WC.VERT_END} }`, /* glsl */`
      ${WC.FRAG_PARS}
      void main(){ gl_FragColor = vec4(paperize(backdrop(normalize(vOP))), 1.); }`, { side: THREE.BackSide, depthWrite: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ---------------------------------------------------------------- the cell wall behind the entry: a quilted bowl
    const wallO = path.pointAt(0).clone().addScaledVector(d0, -19);
    { const pos = [], nor = [], rr = [], idx = [], NR = 16, NP = 56;
      for (let i = 0; i <= NR; i++) {
        const r = 160 * Math.pow(i / NR, 0.8), z = (r * r) / 90;
        for (let j = 0; j <= NP; j++) {
          const a = (j / NP) * Math.PI * 2, er = V3().addScaledVector(ex, Math.cos(a)).addScaledVector(ey, Math.sin(a));
          const p = wallO.clone().addScaledVector(d0, z).addScaledVector(er, r), n = d0.clone().addScaledVector(er, -(2 * r) / 90).normalize();
          pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); rr.push(r);
        }
        if (i < NR) for (let j = 0; j < NP; j++) { const a = i * (NP + 1) + j, b = a + 1, c = a + NP + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aR', new THREE.Float32BufferAttribute(rr, 1)); g.setIndex(idx);
      const wall = new THREE.Mesh(g, mat({ uGreen: { value: pal.green }, uPeach: { value: pal.peach } }, /* glsl */`
        ${WC.VERT_PARS}
        attribute float aR; varying float vR;
        void main(){ vR = aR; vec3 p = position; vec3 n = normal; ${WC.VERT_END} }`, /* glsl */`
        ${WC.FRAG_PARS}
        uniform vec3 uGreen, uPeach; varying float vR;
        void main(){
          vec3 n = normalize(vN), vd = vOP - cameraPosition;
          if (dot(n, vd) > 0.) discard;                                       // never seen from outside the cell
          vec3 k = vOP*.14; float qv = sin(k.x)*sin(k.y + 1.)*sin(k.z + 2.);   // quilting: a lattice of pits and seams
          float seam = 1. - smoothstep(0., .10, abs(qv)), pit = smoothstep(.40, .85, abs(qv));
          vec3 pig = mix(uPeach, uGreen*vec3(.92, 1., .96), smoothstep(-.08, .08, qv)*.85);
          vec3 c = wash(pig, normalize(n + vec3(0., pit*.5, 0.)), max(seam*.75, pit*.45), vOP, .035, .2);
          c = mix(c, c*mix(vec3(1.), uGlaze*2.4, .5), pit*.6);
          gl_FragColor = vec4(mix(c, backdrop(normalize(vd)), smoothstep(80., 156., vR + (vn(vOP*.05) - .5)*40.)), 1.);
          ${WC.FRAG_END}
        }`, { side: THREE.DoubleSide }));
      wall.frustumCulled = false; scene.add(wall); }
    await ctx.yield();

    // ---------------------------------------------------------------- microtubules: a fan from one knot beside the nucleus
    const knot = hero.junction.position.clone().addScaledVector(mainDir, 300);
    const tubes = [];           // { pts: Float32Array(K*3), K, len, r, end, kind }
    const sampleTube = (fn, len, r, kind, end, seed) => {
      const K = Math.max(8, Math.round(len / 9)) + 1, a = new Float32Array(K * 3), v = V3();
      for (let i = 0; i < K; i++) { fn(i / (K - 1), v); a.set([v.x, v.y, v.z], i * 3); }
      const t = { pts: a, K, len, r, kind, end: end || 0, seed: seed ?? rng() }; tubes.push(t); return t;
    };
    const tr = rng.fork('tubes');
    // 0: our own tube (walkers only; the hero draws it)
    const ours = { pts: tubePts, K: TS + 1, len: tubeMax, r: 2.5, kind: -1, end: 0, seed: 0 }; tubes.push(ours);
    // 1: the main tube running on from the junction to the knot
    { hero.tubeFrame(sJ - 14, F); const a = F.P.clone(), b = knot.clone(), len = a.distanceTo(b);
      sampleTube((t, v) => v.lerpVectors(a, b, t), len, 2.5, 0, 0); }
    // 2: the tube running beside ours (the one that peels apart on a rare visit)
    hero.tubeFrame(18, F); const nbA = F.P.clone().addScaledVector(F.S, 34).addScaledVector(F.U, -5);
    hero.tubeFrame(sJ, F); const nbB = F.P.clone().addScaledVector(F.S, 85).addScaledVector(F.U, 18).addScaledVector(mainDir, 60);
    const nbLen = nbA.distanceTo(nbB), nbT = nbB.clone().sub(nbA).normalize();
    if (!rare) sampleTube((t, v) => v.lerpVectors(nbA, nbB, t), nbLen, 2.5, 0, 0);
    // the fan: fifteen stout tubes (there were two dozen of our own gauge, and from the wall they read as a clutter of faint stems)
    const FAN_R = 3.1;
    { const want = 15, back = mainDir.clone().negate(), dir = V3(), mid = V3(), endp = V3(), perp = V3(), q = V3(); let made = 0, tries = 0;
      while (made < want && tries++ < 400) {
        if ((tries & 7) === 0) await ctx.yield();
        dir.set(tr.gauss(), tr.gauss() * 0.75, tr.gauss()).normalize(); if (dir.dot(back) < -0.25 && tr() < 0.8) continue;
        const len = tr.range(280, 700), bend = tr.range(-0.16, 0.16) * len;
        perp.set(tr.gauss(), tr.gauss(), tr.gauss()).cross(dir).normalize();
        mid.copy(knot).addScaledVector(dir, len * 0.5).addScaledVector(perp, bend); endp.copy(knot).addScaledVector(dir, len);
        const a = knot.clone(), m = mid.clone(), e = endp.clone();
        const fn = (t, v) => v.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(m, 2 * t * (1 - t)).addScaledVector(e, t * t);
        let ok = true;
        for (let i = 2; i <= 24 && ok; i++) { fn(i / 24, q); if (q.distanceTo(C) < A.nucleus.radius + 24 || path.distanceTo(q.x, q.y, q.z) < 46 || q.y < -260 || inArch(q.x, q.y, q.z)) ok = false; }
        if (!ok) continue;
        sampleTube(fn, len, FAN_R, 0, made === 3 ? 1 : made === 7 ? 2 : 0); made++;
      } }
    await ctx.yield();
    // one more tube leaves the wall low to port and draws away under the Golgi: the near layer of the lower left through the
    // march, 27 m from the route at the wall and 75 m by the last arch, with its own walkers (a lilac hauler slung beneath)
    let portTube = null;
    { hero.tubeFrame(18, F); const a = F.P.clone().addScaledVector(F.S, -20).addScaledVector(F.U, -10);
      hero.tubeFrame(sJ - 125, F); const b = F.P.clone().addScaledVector(F.S, -55).addScaledVector(F.U, -30);
      const a0 = a.clone().lerp(b, -0.12), b0 = a.clone().lerp(b, 1.5);
      portTube = sampleTube((t, v) => v.lerpVectors(a0, b0, t), a0.distanceTo(b0), 2.5, 0, 0, 0.37); }

    // smooth reticulum: nets hanging in the middle distance. Nine nodes a net and a stouter tube in fuller paint (there were
    // twelve, of 1.5 m tube thinned with paper), and the four beside the route stand a fifth nearer, inside the reach of the charge
    const ER_R = 2.0;
    { const er = rng.fork('er'), q = V3(), side = V3(), tan = V3();
      for (const [uu, sgn, fwd] of [[0.2, 1, 0], [0.42, -1, 0], [0.66, 1, 0], [0.8, -1, 0], [uJ + 0.05, -1, 215], [uJ + 0.05, -1, 120]]) {
        path.pointAt(uu, q); headAt(uu, tan); side.crossVectors(tan, ey).normalize();
        // the last two hang to port of the branch, in the left of the frame when the nucleus is revealed
        const cen = fwd ? q.clone().addScaledVector(tan, fwd).addScaledVector(side, -er.range(120, 150) * (fwd > 200 ? 1.42 : 0.62)).add(V3(0, er.range(-12, 30), 0))
          : q.clone().addScaledVector(side, sgn * er.range(78, 122) * (uu === 0.66 ? 1.6 : 1)).add(V3(0, er.range(-45, 25), 0)), nodes = [];
        for (let i = 0; i < 9; i++) {
          const nd = cen.clone().add(V3(er.gauss() * 34, er.gauss() * 20, er.gauss() * 34));
          if (fwd && nd.distanceTo(C) < A.nucleus.radius + 26) nd.sub(C).setLength(A.nucleus.radius + 26).add(C);
          // a node that fell beside the route, in the arch's room or behind the entry (less than 12 m inside its plane) ties nothing
          // (only a link's middle was tested, against the route: one seed in a few dozen hung a tube's end 3 m from the lens)
          nd._near = path.distanceTo(nd.x, nd.y, nd.z) < 30 || inArch(nd.x, nd.y, nd.z) || tp.copy(nd).sub(wallO).dot(d0) < 31;
          nodes.push(nd);
        }
        nodes.forEach((a, i) => {
          const near = nodes.map((b, j) => [a.distanceTo(b), j]).filter((e) => e[1] !== i).sort((x, y) => x[0] - y[0]).slice(0, 2);
          for (const [d, j] of near) {
            if (j < i && nodes[j]._l && nodes[j]._l.includes(i)) continue; (a._l = a._l || []).push(j);
            const b = nodes[j], m = a.clone().add(b).multiplyScalar(0.5).add(V3(er.gauss(), er.gauss(), er.gauss()).multiplyScalar(d * 0.14));
            if (a._near || b._near || path.distanceTo(m.x, m.y, m.z) < 34 || inArch(m.x, m.y, m.z) || tp.copy(m).sub(wallO).dot(d0) < 31) continue;
            sampleTube((t, v) => v.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(m, 2 * t * (1 - t)).addScaledVector(b, t * t), d, ER_R, 1, 0);
          }
        });
      } }
    await ctx.yield();
    // one merged mesh for every tube but ours
    const frameOf = (t, i, P, T, Sv, Uv) => {
      const a = t.pts, i0 = Math.max(0, i - 1), i1 = Math.min(t.K - 1, i + 1);
      P.set(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]); T.set(a[i1 * 3] - a[i0 * 3], a[i1 * 3 + 1] - a[i0 * 3 + 1], a[i1 * 3 + 2] - a[i0 * 3 + 2]).normalize();
      Sv.crossVectors(T, ey); if (Sv.lengthSq() < 1e-4) Sv.set(1, 0, 0); Sv.normalize(); Uv.crossVectors(Sv, T);
    };
    { const pos = [], nor = [], su = [], kk = [], idx = [], P = V3(), T = V3(), Sv = V3(), Uv = V3();
      for (const t of tubes) {
        if (t.kind < 0) continue;
        await ctx.yield();
        const RS = t.kind ? 6 : 9, base = pos.length / 3;
        for (let i = 0; i < t.K; i++) {
          frameOf(t, i, P, T, Sv, Uv); const s = (i / (t.K - 1)) * t.len;
          for (let k = 0; k <= RS; k++) {
            const a = (k / RS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), nx = Sv.x * ca + Uv.x * sa, ny = Sv.y * ca + Uv.y * sa, nz = Sv.z * ca + Uv.z * sa;
            pos.push(P.x + nx * t.r, P.y + ny * t.r, P.z + nz * t.r); nor.push(nx, ny, nz); su.push(s, a, t.r); kk.push(t.kind, t.len, t.end, t.seed);
          }
          if (i < t.K - 1) for (let k = 0; k < RS; k++) { const a = base + i * (RS + 1) + k, b = a + 1, c = a + RS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aSU', new THREE.Float32BufferAttribute(su, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, mat({ uGreen: { value: pal.green }, uLilac: { value: pal.lilac } }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec3 aSU; attribute vec4 aK; varying vec2 vSU; varying vec4 vK;
        void main(){ vSU = aSU.xy; vK = aK; vec3 n = normal;
          float rad = aSU.z, cap = 1. - smoothstep(0., mix(7., 2.5, aK.x), min(aSU.x, aK.y - aSU.x));          // a net's tubes end blunt, into one another at its nodes
          vec3 p = position + normal*(.10*cos(aSU.x*1.309)*(1. - aK.x) - rad*.97*cap*cap + aK.x*.35*sin(uTime*.7 + aSU.x*.2 + aK.w*30.));
          ${WC.VERT_END} }`, /* glsl */`
        ${WC.FRAG_PARS}
        uniform vec3 uGreen, uLilac; varying vec2 vSU; varying vec4 vK;
        void main(){
          vec3 n = normalize(vN); float s = vSU.x, a = vSU.y, b = s/4.8; vec3 c;
          if (vK.z > .5) {                                                      // a tip growing bead by bead, another fraying back
            float ph = fract(uTime*.03 + vK.w), tip = vK.z < 1.5 ? .70 + .30*ph : 1. - .30*ph;
            if (s > floor(vK.y*tip/4.8)*4.8) discard;
          }
          if (vK.x < .5) {
            vec3 pig = mix(uGreen, uGlaze, .36) * mix(.92, 1.06, step(.5, fract(b*.5)));
            pig *= 1. - .18*(1. - smoothstep(.04, .16, abs(fract(a*2.069 + s*.11) - .5)));
            float joint = abs(fract(b + .5) - .5)*4.8;
            float ed = edgeOf(vVN); c = wash(pig, n, max(ed, .8*(1. - smoothstep(.10, .42, joint))), vOP, .22, .3*(1. - smoothstep(.5, .9, ed)));
          } else {
            float ed = edgeOf(vVN); vec3 pig = mix(uGreen, uLilac, .4) * (1. - .14*smoothstep(.35, .65, vn(vec3(s*.33, a*1.3, vK.w*40.))));
            c = wash(pig, n, ed, vOP, .12, .22*(1. - smoothstep(.4, .85, ed)));
            c = mix(c, uPaper, mix(.08, .20, uGouK));                          // fuller paint by day; the night sheet's nets as they were
          }
          gl_FragColor = vec4(c, 1.);
          ${WC.FRAG_END}
        }`));
      m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // rare event: the tube beside ours comes apart from its far end, its strands curling outward like banana skin
    const uFront = { value: 1e6 };
    if (rare) {
      const pos = [], nor = [], su = [], idx = [], n = Math.round(nbLen / 2.5), RS = 26, Sv = V3().crossVectors(nbT, ey).normalize(), Uv = V3().crossVectors(Sv, nbT);
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * nbLen;
        for (let k = 0; k <= RS; k++) {
          const a = (k / RS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), nx = Sv.x * ca + Uv.x * sa, ny = Sv.y * ca + Uv.y * sa, nz = Sv.z * ca + Uv.z * sa;
          pos.push(nbA.x + nbT.x * s + nx * 2.5, nbA.y + nbT.y * s + ny * 2.5, nbA.z + nbT.z * s + nz * 2.5); nor.push(nx, ny, nz); su.push(s, a);
        }
        if (i < n) for (let k = 0; k < RS; k++) { const a = i * (RS + 1) + k, b = a + 1, c = a + RS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aSU', new THREE.Float32BufferAttribute(su, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, mat({ uGreen: { value: pal.green }, uA0: { value: nbA }, uT: { value: nbT }, uFront }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec2 aSU; uniform vec3 uA0, uT; uniform float uFront; varying vec2 vSU; varying float vD;
        void main(){ vSU = aSU; float d = aSU.x - uFront; vD = d; vec3 p = position; vec3 n = normal;
          if (d > 0.) { float Rc = 10.5 + 2.5*sin(aSU.y*3. + 1.), ph = min(d/Rc, 5.6);
            p = uA0 + uT*(uFront + Rc*sin(ph)) + normal*(2.5 + Rc*(1. - cos(ph)));
            p += normal*sin(uTime*3. + aSU.x*.3)*.5*min(d*.1, 1.);
            n = normalize(normal*cos(ph) - uT*sin(ph)); }
          ${WC.VERT_END} }`, /* glsl */`
        ${WC.FRAG_PARS}
        uniform vec3 uGreen; varying vec2 vSU; varying float vD;
        void main(){
          vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.); float s = vSU.x, a = vSU.y, st = abs(fract(a*2.069) - .5);
          if (vD > 0. && st < .24*clamp(vD/8., 0., 1.)) discard;
          vec3 pig = mix(uGreen, uGlaze, .36) * mix(.92, 1.06, step(.5, fract(s/9.6)));
          float joint = abs(fract(s/4.8 + .5) - .5)*4.8;
          float e = max(edgeOf(vVN), max(.8*(1. - smoothstep(.10, .42, joint)), step(0., vD)*smoothstep(.34, .26, st)*.7));
          gl_FragColor = vec4(wash(pig, n, e, vOP, .22, .3), 1.);
          ${WC.FRAG_END}
        }`, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }

    // ---------------------------------------------------------------- the other walkers and their balloons
    // how far each tube sample is from the route: cargo is let down (deflated) where a tube comes near it
    for (const t of tubes) { t.clear = new Float32Array(t.K); for (let i = 0; i < t.K; i++) t.clear[i] = t === ours ? 1e3 : path.distanceTo(t.pts[i * 3], t.pts[i * 3 + 1], t.pts[i * 3 + 2]); await ctx.yield(); }
    await ctx.yield();
    const wr = rng.fork('walkers'), NW = Math.round(300 * dens * detail * (cast === 'quiet' ? 0.75 : 1)), walkers = [];
    { const big = tubes.filter((t) => t.kind === 0), tot = big.reduce((a, t) => a + t.len, 0);
      for (let j = 0; j < NW; j++) {
        let t, around, type, dir, sc;
        if (j < 15) { t = ours; type = j < 9 ? 0 : 1; around = type ? Math.PI : -wr.pick([1.5, 1.62, 1.4]); dir = type ? -1 : 1; sc = type ? 1.5 : 1; }
        else {
          let x = wr() * tot; t = big[0]; for (const b of big) { if (x < b.len) { t = b; break; } x -= b.len; }
          type = wr() < 0.2 ? 1 : 0; if (j < 21) { t = portTube; if (j === 15) type = 1; }       // six work the port tube, the first a lilac hauler
          around = type ? Math.PI + wr.range(-0.3, 0.3) : wr.range(-0.9, 0.9); dir = type ? 1 : wr() < 0.6 ? -1 : 1; sc = type ? wr.range(2.2, 3) : wr.range(1.3, 2.1);
        }
        const nearT = j >= 15 && (t === big[0] || (!rare && t === big[1]) || t === portTube);          // tubes that come close to the route: small cargo, slung below
        if (t === big[0] && j >= 15) around = Math.PI + wr.range(-0.8, 0.8);
        if (t === portTube) around = type ? Math.PI + wr.range(-0.3, 0.3) : -wr.range(0.2, 1.1);              // cargo on its far side, leaning away from the route
        const rate = type ? wr.range(0.7, 1.0) : wr.range(1.0, 1.7), bal = j < 15 ? wr.range(1.9, 2.6) : nearT ? wr.range(2, 3.4) : wr() < 0.82 ? wr.range(4, 13) : 0;
        walkers.push({ t, around, type, dir, sc, rate, phi0: (j < 15 ? (j / 15 + wr() * 0.05) : j < 21 ? ((j - 15) / 6 + wr() * 0.1) : wr()) * t.len / (4.8 * sc), bal, seed: wr() });
      } }
    await ctx.yield();
    const walkerGeo = (() => {
      const parts = [], tagP = (g, k) => { const gi = g.index ? g.toNonIndexed() : g; gi.deleteAttribute('uv'); gi.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(gi.attributes.position.count).fill(k), 1)); return gi; };
      const prof = [[0.001, 0], [0.42, 0.1], [0.5, 0.5], [0.3, 0.95], [0.2, 1.4], [0.3, 1.75], [0.001, 2.0]].map((p) => new THREE.Vector2(p[0], p[1]));
      parts.push(tagP(new THREE.LatheGeometry(prof, 7), 0));
      for (let f = 0; f < 2; f++) { const g = new THREE.SphereGeometry(1, 6, 4); g.scale(0.38, 0.3, 0.82); parts.push(tagP(g, 1 + f)); }
      for (let f = 0; f < 2; f++) { const g = new THREE.CylinderGeometry(0.13, 0.13, 1, 4, 3, true); g.translate(0, 0.5, 0); parts.push(tagP(g, 3 + f)); }
      const pos = [], nor = [], part = [];
      for (const g of parts) { pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); part.push(...g.attributes.aPart.array); g.dispose(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
      return g;
    })();
    const aW = new Float32Array(NW * 4);
    walkers.forEach((w, j) => aW.set([w.phi0, w.rate, w.type, w.seed], j * 4));
    walkerGeo.setAttribute('aW', new THREE.InstancedBufferAttribute(aW, 4));
    const walkerMesh = new THREE.InstancedMesh(walkerGeo, mat({ uTeal: { value: pal.teal.clone().lerp(pal.green, look.gouache ? 0.75 : 0.22) }, uLilac: { value: pal.lilac.clone().multiplyScalar(look.gouache ? 0.9 : 0.72) } }, /* glsl */`
      ${WC.VERT_PARS}
      attribute float aPart; attribute vec4 aW; uniform vec3 uTeal, uLilac; varying vec3 vCol;
      vec3 footPos(float i, float phi){
        float x = phi - i, r = mod(x, 2.), side = i < .5 ? -1. : 1., z = (1. - r)*4.8, h = 0., lat = side*.55;
        if (r > 1.65) { float e = (r - 1.65)/.35; z += 9.6*e*e*(3. - 2.*e); h = 1.5*sin(3.14159*e); lat += side*.6*sin(3.14159*e); }
        return vec3(lat, h + .12, z);
      }
      void main(){
        float phi = aW.x + uTime*aW.y, bob = .13*cos(phi*6.2832); vec3 lp = position, ln = normal;
        vCol = mix(uTeal, uLilac, aW.z);
        if (aPart < .5) { lp.y += 1.25 + bob; vCol *= 1. - .22*aW.z*step(.5, fract(position.y*2.6)); }
        else if (aPart < 2.5) { lp += footPos(aPart - 1., phi); vCol *= .78; }
        else { float i = aPart - 3., side = i < .5 ? -1. : 1., t = position.y;
          vec3 a = footPos(i, phi) + vec3(0., .3, -.1), h = vec3(side*.28, 1.45 + bob, 0.);
          lp = mix(a, h, t) + vec3(side*.25, .4, 0.)*sin(3.14159*t) + vec3(position.x, 0., position.z); }
        vec3 p = (instanceMatrix * vec4(lp, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * ln);
        ${WC.VERT_END}
        vOP = position*1.3 + aW.w*7. + aPart*3.;
      }`, /* glsl */`
      ${WC.FRAG_PARS}
      varying vec3 vCol;
      void main(){ gl_FragColor = vec4(wash(vCol, normalize(vN), edgeOf(vVN), vOP, .9, .8), 1.); ${WC.FRAG_END} }`), NW);
    walkerMesh.frustumCulled = false; scene.add(walkerMesh);
    await ctx.yield();


    // translucent wash bodies (balloons, vesicles): multiplied onto the sheet (screened on, as gouache, at night)
    const VES_FRAG = /* glsl */`
      ${WC.FRAG_PARS}
      uniform float uGou, uFar; varying vec3 vCol; varying vec3 vL;
      void main(){
        vec3 n = normalize(vN); float e = edgeOf(vVN);
        float l = dot(n, uLight) + (vn(vL*2.5) - .5)*.5;
        float dn = .34 + .22*smoothstep(.3, .0, l) + .5*e*e*e + .1*vn(vL*6.);
        dn *= 1. - .92*smoothstep(.70, .80, l);                              // the reserved crescent
        float rim = smoothstep(.86, .95, e + (vn(vL*2. + floor(uTime*4.)*3.) - .5)*.1);
        float ff = 1. - exp(-pow(max(vFogDepth, 0.)/max(uFogD, 1.), 1.5));
        float far = mix(1., exp(-max(vFogDepth - 18., 0.)/200.), uFar);                 // far bubbles are a stain: only the nearest few carry colour
        dn = clamp(dn, 0., 1.)*(1. - ff)*far; rim *= (1. - ff)*far;
        if (uGou > .5) gl_FragColor = vec4(vCol*(dn*.8 + rim*.15), 1.);
        else gl_FragColor = vec4(mix(vec3(1.), charge(vCol, wcNear()*(.25 + .75*e*e*e), wcWarm(vCol)), dn)*(1. - .35*rim), 1.);   // the same charge as every wash: deepest where it pools at the rim
      }`;
    const vesCols = [pal.peach, pal.lilac, pal.green, pal.peach, pal.green.clone().lerp(pal.lilac, 0.5)];
    const sphGeo = new THREE.SphereGeometry(1, 12, 8);
    const NB = NW + 2, balGeo = sphGeo.clone(), aBC = new Float32Array(NB * 4);
    for (let j = 0; j < NB; j++) { const c = wr.pick(vesCols); aBC.set([c.r, c.g, c.b, wr()], j * 4); }
    balGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(aBC, 4));
    const BAL_VERT = /* glsl */`
      ${WC.VERT_PARS}
      attribute vec4 aC; varying vec3 vCol; varying vec3 vL;
      void main(){ vCol = aC.rgb; vL = position + aC.w*9.;
        vec3 lp = position*(1. + .035*sin(uTime*2. + aC.w*30. + position.y*3.));
        vec3 p = (instanceMatrix * vec4(lp, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
        ${WC.VERT_END} }`;
    const balMesh = new THREE.InstancedMesh(balGeo, mat({ uGou: { value: GOU }, uFar: { value: 1 } }, BAL_VERT, VES_FRAG, blendMul), NB);
    balMesh.frustumCulled = false; balMesh.renderOrder = 4; scene.add(balMesh);
    // balloon slots: one per walker that tows one, then the stray bubble (walkers with no cargo cost nothing)
    let NBal = 0; for (const w of walkers) w.bj = w.bal > 0 ? NBal++ : -1;
    balMesh.count = NBal + 1;

    // ---------------------------------------------------------------- mitochondria: peach airships, one pinching in two
    const mr = rng.fork('mito'), NM = cast === 'quiet' ? 13 : 9, mitos = [], uPinch = { value: 0 }, uApart = { value: 0 };
    { const q = V3(), tan = V3(), side = V3();
      for (let i = 0; i < NM; i++) {
        // 0: the one that divides, low to starboard where the level gaze finds it (the lens rides to starboard of the tube there). 5-7: three hung to port of the branch, the
        // middle layer of the left of the frame when the nucleus is revealed (they lie along the route, never across it)
        // 1, 3 and 4 stand in the first third near enough to take the full charge of paint (all four hung 65 to 86 m overhead,
        // out of the picture until they were far and thin): 1 lies along the route low to port, beyond our tube, between the
        // entry and the arch; 3 and 4 lie along the route 38 to 54 m up, one to starboard and one to port, outside the arch's
        // flanks (72 m and more from the tube: the widest sac with its beads reaches 61), so the air over the arch stays
        // open and no sac is run through; 2 keeps its height
        // 5 and up keep their whole length off the route and out of the arch's room (only a free one's middle was held 85 m
        // off the route, at one place, and the route turns: a seed in a few dozen laid one through a sac, or could lay one
        // beside the lens before the pore); one that would not is drawn again
        const over = i < 5, port = i >= 5 && i < 8; let p, ax, len, rad;
        for (let tries = 0; ; tries++) {
          const uu = i === 0 ? 0.20 : port ? uJ + 0.05 : over ? (i === 1 ? 0.125 : 0.10 + 0.05 * i) + mr.range(-0.015, 0.015) : mr.range(0.16, 0.8);
          path.pointAt(uu, q); headAt(uu, tan); side.crossVectors(tan, ey).normalize();
          const lat = i === 0 ? 34 : i === 1 ? -mr.range(50, 62) : over ? [0, 0, mr.range(-15, 80), mr.range(72, 92), -mr.range(72, 92)][i] : mr.sign() * mr.range(85, 190), up = i === 0 ? 25 : i === 1 ? mr.range(6, 16) : i === 2 ? mr.range(65, 86) : over ? mr.range(38, 54) : mr.range(-50, 95);
          p = q.clone().addScaledVector(side, lat).add(V3(0, up, 0));
          if (port) { const [fw, lt, upp] = [[175, 118, 48], [125, 72, -12], [270, 185, 8]][i - 5]; p.copy(q).addScaledVector(tan, fw).addScaledVector(side, -lt).add(V3(0, upp, 0)); }
          if (p.distanceTo(C) < A.nucleus.radius + 45) p.sub(C).setLength(A.nucleus.radius + 45 + mr.range(0, 60)).add(C);
          ax = i === 0 ? side.clone().addScaledVector(tan, 0.25) : V3(mr.gauss(), mr.gauss() * 0.25, mr.gauss());
          if (port || i === 1) ax.multiplyScalar(0.3).add(tan).setY(ax.y * 0.6); else if (i === 3 || i === 4) ax.multiplyScalar(0.18).add(tan).setY(ax.y * 0.6);
          ax.normalize();
          len = (i === 0 ? 96 : mr.range(60, 110)) * (cast === 'quiet' ? 1.35 : 1); rad = i === 0 ? 10 : mr.range(8.5, 11);
          if (i < 5 || tries >= 7) break;
          let ok = true;
          for (let k = 0; k <= 8 && ok; k++) { tp.copy(p).addScaledVector(ax, (k / 8 - 0.5) * (len - 2 * rad)); if (path.distanceTo(tp.x, tp.y, tp.z) < rad + 20 || inArch(tp.x, tp.y, tp.z, rad + 69)) ok = false; }
          if (ok) break;
        }
        mitos.push({ p, ax, len, rad, seed: mr() });
        if (i === 1) {   // its tail stands 24 m inside the entry's plane and its nose 16 m short of the first sac: it is no longer than the room between them
          const m = mitos[1], a0 = path.pointAt(0, q).dot(d0); hero.tubeFrame(sG0, F);
          const room = F.P.dot(d0) - a0 - 40; m.len = Math.min(m.len, room);
          const a = m.p.dot(d0) - a0, lo = 24 + m.len / 2, hi = 24 + room - m.len / 2; m.p.addScaledVector(d0, Math.min(hi, Math.max(lo, a)) - a);
        }
      } }
    const mitoGeo = (() => {
      const pos = [], nor = [], idx = [], NZ = 44, RS = 18;
      for (let i = 0; i <= NZ; i++) {
        const z = -4 + (8 * i) / NZ, cz = Math.max(0, Math.abs(z) - 3), r = Math.sqrt(Math.max(0, 1 - cz * cz));
        for (let k = 0; k <= RS; k++) { const a = (k / RS) * Math.PI * 2; pos.push(Math.cos(a) * r, Math.sin(a) * r, z); const nz = Math.sign(z) * cz, nl = Math.hypot(r, nz) || 1; nor.push((Math.cos(a) * r) / nl, (Math.sin(a) * r) / nl, nz / nl); }
        if (i < NZ) for (let k = 0; k < RS; k++) { const a = i * (RS + 1) + k, b = a + 1, c = a + RS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
      const aM = new Float32Array(NM * 2); mitos.forEach((m, i) => aM.set([m.seed, i === 0 ? 1 : 0], i * 2)); g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 2));
      return g;
    })();
    const mitoMesh = new THREE.InstancedMesh(mitoGeo, mat({ uPeach: { value: pal.peach }, uPinch, uApart }, /* glsl */`
      ${WC.VERT_PARS}
      attribute vec2 aM; uniform float uPinch, uApart; varying vec3 vL; varying float vSeed;
      void main(){
        vec3 lp = position; float sd = aM.x; vL = position; vSeed = sd;
        lp.xy *= 1. - .93*aM.y*uPinch*exp(-lp.z*lp.z*2.2);
        lp.z += sign(lp.z)*aM.y*uApart*.55;
        lp.x += .30*sin(lp.z*.8 + uTime*.42 + sd*6.) + .12*sin(lp.z*2.1 - uTime*.6 + sd*9.);
        lp.y += .26*cos(lp.z*.65 + uTime*.33 + sd*4.);
        vec3 p = (instanceMatrix * vec4(lp, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
        ${WC.VERT_END}
        vOP = position*8. + sd*20.;
      }`, /* glsl */`
      ${WC.FRAG_PARS}
      uniform vec3 uPeach; varying vec3 vL; varying float vSeed;
      void main(){
        vec3 n = normalize(mix(normalize(vN), uLight, .3)); float ang = atan(vL.y, vL.x + 1e-5);
        float f = sin(vL.z*9. + (fbm(vL*1.3 + vSeed*9.) - .5)*7. + sin(ang*2. + vSeed*5.)*1.4);
        float fold = smoothstep(.2, .7, f) * (1. - smoothstep(.72, .98, abs(vL.z)/4.));     // the inner folds showing through
        vec3 pig = mix(uPeach, uPeach*vec3(.78, .64, .70), fold*.8);
        gl_FragColor = vec4(wash(pig, n, max(edgeOf(vVN), fold*.3), vOP, .1, .5), 1.);
        ${WC.FRAG_END}
      }`), NM);
    mitoMesh.frustumCulled = false; scene.add(mitoMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- the Golgi: six curved sacs whose rims arch over our tube
    const gr = rng.fork('golgi'), GA = 14.5, GB = 25, GY = 6, GW = 34, sacs = [];      // sacs: { m: Matrix4 }
    const sacPoint = (tt, pr, pa, out) => {            // local point on a sac: tt 0..1 round the horseshoe, pr radial, pa axial
      const th = (-0.2 + 1.4 * tt) * Math.PI; return out.set(Math.cos(th) * (GA + pr), GY + Math.sin(th) * (GB + pr), pa + 7 * (pr / GW) * (pr / GW));
    };
    { const m4 = new THREE.Matrix4(), bx = V3();
      for (let k = 0; k < 6; k++) { hero.tubeFrame(sG0 + k * 17, F); const sc = 0.74 + 0.07 * k; bx.copy(F.S).negate();
        sacs.push({ m: new THREE.Matrix4().makeBasis(bx.clone().multiplyScalar(sc), F.U.clone().multiplyScalar(sc), F.T.clone().multiplyScalar(sc)).setPosition(F.P), k, ours: true, seed: gr() }); }
      if (cast === 'secreting') for (const [uu, lat, up] of [[0.3, -175, 55], [0.72, 185, -35]]) {
        const q = path.pointAt(uu), tan = path.tangentAt(uu), side = V3().crossVectors(tan, ey).normalize(), o = q.clone().addScaledVector(side, lat).add(V3(0, up, 0));
        if (o.distanceTo(C) < A.nucleus.radius + 90) o.sub(C).setLength(A.nucleus.radius + 90).add(C);
        const qt = new THREE.Quaternion().setFromEuler(new THREE.Euler(gr.range(-0.5, 0.5), gr.range(0, 6.28), gr.range(-0.5, 0.5))), fw = V3(0, 0, 1).applyQuaternion(qt);
        for (let k = 0; k < 6; k++) { const sc = 0.9 + 0.04 * k; sacs.push({ m: m4.clone().compose(o.clone().addScaledVector(fw, k * 17 - 42), qt, V3(sc, sc, sc)), k, ours: false, seed: gr() }); }
      } }
    { const pos = [], ag = [], idx = [], NT = 60, NPf = 12, v = V3();
      for (let i = 0; i <= NT; i++) {
        const tt = i / NT, tk = Math.sqrt(Math.min(1, 5 * Math.min(tt, 1 - tt)) + 1e-4);
        for (let j = 0; j <= NPf; j++) {
          const ph = (j / NPf) * Math.PI * 2, cp = Math.cos(ph), sp = Math.sin(ph);
          const pr = GW * (0.5 + 0.5 * Math.sign(cp) * Math.pow(Math.abs(cp), 0.6)) * tk, pa = 2.5 * Math.sign(sp) * Math.pow(Math.abs(sp), 0.8) * tk;
          sacPoint(tt, pr, pa, v); pos.push(v.x, v.y, v.z); ag.push(tt, pr / GW, 0);
        }
        if (i < NT) for (let j = 0; j < NPf; j++) { const a = i * (NPf + 1) + j, b = a + 1, c = a + NPf + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const aI = new Float32Array(sacs.length * 2); sacs.forEach((s, i) => aI.set([s.seed, s.k / 5], i * 2)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 2));
      const golgi = new THREE.InstancedMesh(g, mat({ uPeach: { value: pal.peach }, uLilac: { value: pal.lilac }, uGreen: { value: pal.green } }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec3 aG; attribute vec2 aI; varying vec3 vG; varying vec2 vI;
        void main(){
          vG = aG; vI = aI; vec3 lp = position;
          float cell = aG.x*46. + aI.x*10., bead = pow(max(0., sin(cell*6.2832)), 4.), sw = .5 + .5*sin(uTime*.5 + floor(cell)*2.4 + aI.x*20.);
          float cell2 = aG.x*31. + aI.x*17., bead2 = pow(max(0., sin(cell2*6.2832)), 2.), sw2 = .5 + .5*sin(uTime*.4 + floor(cell2)*3.1 + aI.x*11.);
          lp += normal*(bead*sw*7.*smoothstep(.62, 1., aG.y) + bead2*sw2*1.5*(1. - smoothstep(0., .14, aG.y))      // both rims swell into beads
            + .45*sin(uTime*.8 + aG.x*20. + aI.x*9.));
          vec3 p = (instanceMatrix * vec4(lp, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
          ${WC.VERT_END}
        }`, /* glsl */`
        ${WC.FRAG_PARS}
        uniform vec3 uPeach, uLilac, uGreen; varying vec3 vG; varying vec2 vI;
        void main(){
          vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
          n = normalize(mix(n, uLight, .3));                                                     // a softer turn into shadow: no hard band across a sac
          vec3 pig = mix(mix(uPeach, uGreen, .10*(1. - vI.y)), uLilac, .12*vI.y) * mix(.94, 1.04, vI.x);
          float hd = vG.x + (vn(vOP*.045 + vI.x*5.) - .5)*.5;                                    // the hue drifts round each horseshoe, lilac to a deeper peach
          pig = mix(pig, uLilac*vec3(1.04, .96, 1.), .14*smoothstep(.55, .15, hd));
          pig = mix(pig, uPeach*vec3(1., .86, .84), .55*smoothstep(.45, .9, hd));
          pig *= 1. - .16*smoothstep(.45, 1., vG.y);                                             // the wash runs to the rim and pools there
          float gt = fbm(vOP*.05 + vI.x*7.);
          float gy = vG.y + (gt - .5)*.05, gf = fbm(vOP*.21 + vI.x*3.);
          pig *= mix(vec3(1.), vec3(.86, .62, .54), smoothstep(.35, .75, sin(gy*30. + gt*8.)*.5 + .5)) * (1. - .12*(gt - .5));     // lamellae and backruns
          pig *= 1. - .17*smoothstep(.55, .9, sin(gy*95. + gt*14.)*.5 + .5);                     // a finer set between them
          float rib = sin((vG.x*46. + vI.x*10.)*6.2832)*.5 + .5;                                 // ribs round the horseshoe, in step with the rim beads
          pig *= 1. - .20*smoothstep(.55, .95, rib)*(.45 + .55*smoothstep(.3, .7, gf));
          pig = mix(pig, pig*uGlaze*2.1, .05*smoothstep(.52, .74, gf));                          // cool blotches where the wash pooled
          float fen = vn(vOP*1.1 + vI.x*40.)*vn(vOP*2.6 + 9.);                                  // fenestrae: a scatter of small darker pools, for the close pass
          pig *= 1. - .18*smoothstep(.34, .46, fen)*smoothstep(.06, .2, vG.y)*(1. - smoothstep(.8, .95, vG.y));
          float e = max(edgeOf(vVN), max(smoothstep(.84, 1., vG.y), 1. - smoothstep(0., .07, vG.y))*.8);
          pig *= mix(vec3(1.), vec3(.74, .60, .58), 1. - smoothstep(.02, .11, vG.y));          // each arch has a crisp madder inner edge against the bright opening
          wcWarmGlaze = vec3(.88, .64, .62);                                                     // peach turns to madder in shadow, not to grey
          vec3 c = wash(pig, n, e, vOP, .07, .35);
          float cy = abs(fract(gy*6. + .5) - .5), cw = max(.014, fwidth(vG.y)*7.);               // pencil growth lines, broken where the hand lifted
          float ln = (1. - smoothstep(cw*.6, cw*1.5, cy))*smoothstep(.34, .52, vn(vOP*.16 + vI.x*31. + floor(uTime*4.)*.07));
          gl_FragColor = vec4(mix(c, uPencil, .42*ln), 1.);
          ${WC.FRAG_END}
        }`, { side: THREE.DoubleSide }), sacs.length);
      sacs.forEach((s, i) => golgi.setMatrixAt(i, s.m)); golgi.instanceMatrix.needsUpdate = true; golgi.frustumCulled = false; scene.add(golgi); }
    await ctx.yield();

    // ---------------------------------------------------------------- free vesicles: Golgi buds drifting down, floaters trembling
    { const vr = rng.fork('ves'), NV0 = Math.min(460, Math.round(200 * dens * detail * (cast === 'secreting' ? 1.6 : 1))), NV = NV0 + Math.round(64 * detail), aO = new Float32Array(NV * 4), aV = new Float32Array(NV * 4), aC = new Float32Array(NV * 4), q = V3(), tan = V3(), side = V3();
      for (let i = 0; i < NV; i++) {
        if ((i & 15) === 0) await ctx.yield();
        const c = vr.pick(vesCols); aC.set([c.r, c.g, c.b, vr()], i * 4);
        let done = false;
        if (i < 16) {                                                         // a slow stream crossing in front of the open pore, never nearer than 9 m
          const e1 = V3().crossVectors(nrm, ey).normalize(), e2 = V3().crossVectors(e1, nrm), sg = i % 2 ? 1 : -1;
          q.copy(seat).addScaledVector(nrm, vr.range(4, 58)).addScaledVector(e1, -28 * sg).addScaledVector(e2, vr.sign() * vr.range(9.5, 17));
          aO.set([q.x, q.y, q.z, vr.range(0.9, 1.7)], i * 4); aV.set([e1.x * 2.6 * sg, e1.y * 2.6 * sg, e1.z * 2.6 * sg, vr.range(19, 23)], i * 4); done = true;
        }
        if (!done && i < 44) for (let tries = 0; tries < 12 && !done; tries++) {          // buds swelling on the inner rims of our arches, easing inward
          const s = sacs[vr.int(0, 5)], rr = vr.range(0.8, 1.5), life = vr.range(8, 13); sacPoint(vr.range(0.04, 0.96), -0.4, vr.range(-1.5, 1.5), q).applyMatrix4(s.m);
          tan.set(0, GY, 0).applyMatrix4(s.m).sub(q).normalize().multiplyScalar(0.26);
          if (path.distanceTo(q.x, q.y, q.z) < 9.5 + rr + 0.26 * life) continue;
          aO.set([q.x, q.y, q.z, rr], i * 4); aV.set([tan.x, tan.y - 0.1, tan.z, life], i * 4); done = true;
        }
        if (!done && i >= NV0 && i < NV0 + 36 * detail) for (let tries = 0; tries < 16 && !done; tries++) {   // buds shed from the crowns of our arches, falling toward the tube
          const s = sacs[(i + tries) % 6], rr = vr.range(1.3, 2.6), life = vr.range(7, 11); sacPoint(vr.range(0.22, 0.78), -0.6, vr.range(-2, 2), q).applyMatrix4(s.m);
          tan.set(0, GY, 0).applyMatrix4(s.m).sub(q); const room = tan.length() - 10 - rr; if (room < 5) continue;
          tan.normalize().multiplyScalar(Math.min(1.5, room / life));
          aO.set([q.x, q.y, q.z, rr], i * 4); aV.set([tan.x, tan.y, tan.z, life], i * 4); done = true;
        }
        if (!done && i >= NV0) for (let tries = 0; tries < 20 && !done; tries++) {        // a loose shoal to port of the branch, between us and the nucleus
          path.pointAt(uJ + 0.05, q); headAt(uJ + 0.05, tan); side.crossVectors(tan, ey).normalize();
          const fw = vr.range(70, 310), r = vr.range(2.2, 7.5) * (fw < 170 ? 0.7 : 1); q.addScaledVector(tan, fw).addScaledVector(side, -fw * vr.range(0.38, 0.85)).add(V3(0, vr.range(-45, 80), 0));
          if (path.distanceTo(q.x, q.y, q.z) < r + 14 || q.distanceTo(C) < A.nucleus.radius + 18 + r) continue;
          aO.set([q.x, q.y, q.z, r], i * 4); aV.set([0, 0, 0, 0], i * 4); done = true;
        }
        if (!done && i < NV * 0.34) for (let tries = 0; tries < 8 && !done; tries++) {
          const s = vr.pick(sacs); sacPoint(vr.range(0.06, 0.94), vr() < 0.6 ? GW : 0, 0, q).applyMatrix4(s.m);
          if (s.ours && path.nearestXZ(q.x, q.z).dist < 18) continue;                // a bud drifts up to 13 m aside as it falls and is 3 m across, and the lens rides off the arch's axis now: 18 m (it was 10)
          aO.set([q.x, q.y, q.z, vr.range(1.2, 3.1)], i * 4); aV.set([vr.range(-0.5, 0.5), -vr.range(2, 3.4), vr.range(-0.5, 0.5), vr.range(11, 18)], i * 4); done = true;
        }
        for (let tries = 0; tries < 30 && !done; tries++) {
          const uu = 0.08 + 0.92 * vr(); path.pointAt(uu, q); path.tangentAt(uu, tan); side.crossVectors(tan, ey).normalize();
          const lat = vr.sign() * (16 + 120 * vr()), r = Math.min(7.5, 1.3 + Math.abs(lat) * 0.045 * vr.range(0.4, 1.3));
          q.addScaledVector(side, lat).add(V3(0, vr.range(-50, 45), 0));
          if (path.distanceTo(q.x, q.y, q.z) < r + 9.5 || q.distanceTo(C) < A.nucleus.radius + 16 + r) continue;
          if (uu < 0.26 && Math.abs(lat) < 60 && (tries & 1) === 0) continue;
          if (uu > uJ - 0.17 && uu < uJ + 0.09 && Math.abs(lat) < 46 && tries < 24) continue;             // the view down the arches to the junction stays open
          aO.set([q.x, q.y, q.z, r], i * 4); aV.set([0, 0, 0, 0], i * 4); done = true;
        }
      }
      const g = new THREE.InstancedBufferGeometry(); g.index = sphGeo.index; g.setAttribute('position', sphGeo.attributes.position); g.setAttribute('normal', sphGeo.attributes.normal);
      g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
      g.instanceCount = NV;
      const ves = new THREE.Mesh(g, mat({ uGou: { value: GOU }, uFar: { value: 1 } }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec4 aO, aV, aC; varying vec3 vCol; varying vec3 vL;
        void main(){ vCol = aC.rgb; float sd = aC.w; vL = position + sd*9.;
          float life = aV.w, tt = life > 0. ? mod(uTime + sd*life*7., life) : 0., q = life > 0. ? tt/life : .5;
          float k = life > 0. ? smoothstep(0., .14, q)*(1. - smoothstep(.86, 1., q)) : 1.;
          vec3 br = vec3(sin(uTime*1.3 + sd*40.) + sin(uTime*2.9 + sd*17.), sin(uTime*1.7 + sd*23.) + sin(uTime*3.3 + sd*31.), sin(uTime*1.1 + sd*11.) + sin(uTime*2.3 + sd*5.));
          vec3 n = normal; vec3 p = aO.xyz + aV.xyz*tt + br*(.12*aO.w + .25) + position*aO.w*k*(1. + .04*sin(uTime*2.2 + sd*30. + position.y*3.));
          ${WC.VERT_END} }`, VES_FRAG, blendMul));
      ves.frustumCulled = false; ves.renderOrder = 4; scene.add(ves); }
    await ctx.yield();

    // ---------------------------------------------------------------- opaque wash bodies: the knot, lysosomes, chloroplasts, the pinching loop
    const br = rng.fork('blobs'), blobs = [];
    blobs.push({ kind: 'knot', p: knot.clone(), r: 11, c: pal.green.clone().lerp(pal.teal, 0.5), seed: br() });
    { const q = V3(), tan = V3(), side = V3(), lc = pal.teal.clone().lerp(pal.lilac, look.gouache ? 0.6 : 0.28);
      for (let i = 0; i < 6; i++) {
        for (let tries = 0; tries < 20; tries++) {
          const uu = i === 0 ? 0.27 : br.range(0.08, 0.86), r = i === 0 ? 6 : br.range(4.5, 8); path.pointAt(uu, q); path.tangentAt(uu, tan); side.crossVectors(tan, ey).normalize();
          q.addScaledVector(side, i === 0 ? 25 : br.sign() * br.range(20, 75)).add(V3(0, i === 0 ? -2 : br.range(-30, 28), 0));
          if (i > 0 && (path.distanceTo(q.x, q.y, q.z) < r + 10 || q.distanceTo(C) < A.nucleus.radius + 30)) continue;
          blobs.push({ kind: 'lyso', p: q.clone(), r, c: lc.clone().offsetHSL(br.range(-0.02, 0.02), 0, br.range(-0.03, 0.03)), seed: br(), ax: V3(br.gauss(), br.gauss(), br.gauss()).normalize() }); break;
        }
      } }
    const lyso0 = blobs[1], strayHome = lyso0.p.clone().add(V3(0, 12, 0)).addScaledVector(path.tangentAt(0.27), 7);
    // plant cell: a huge clear vacuole with green chloroplasts streaming round it
    let vacC = null; const vacR = 140;
    if (cast === 'plant') {
      const q = path.pointAt(0.36), tan = path.tangentAt(0.36), side = V3().crossVectors(tan, ey).normalize();
      vacC = q.clone().addScaledVector(side, 235).add(V3(0, 25, 0));
      const cc = pal.green.clone().multiplyScalar(0.82).lerp(pal.teal, 0.18), nC = Math.round(40 * dens);
      for (let i = 0; i < nC; i++) blobs.push({ kind: 'chloro', r: br.range(7, 10), c: cc.clone().offsetHSL(br.range(-0.02, 0.02), 0, br.range(-0.04, 0.04)), seed: br(), a0: br() * 6.283, sp: br.range(0.035, 0.06), tilt: br.range(-0.5, 0.5), tilt2: br.range(-0.5, 0.5), rr: vacR + br.range(8, 22) });
      const vg = new THREE.SphereGeometry(1, 44, 28), vc = pal.green.clone().lerp(pal.paper, 0.35);
      vg.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array([vc.r, vc.g, vc.b, 0.37]), 4));
      const vacMat = mat({ uGou: { value: GOU }, uFar: { value: 0 } }, BAL_VERT, VES_FRAG, blendMul);       // the vacuole keeps its wash at any distance
      const vac = new THREE.InstancedMesh(vg, vacMat, 1); vac.setMatrixAt(0, new THREE.Matrix4().makeScale(vacR, vacR, vacR).setPosition(vacC));
      vac.frustumCulled = false; vac.renderOrder = 3; scene.add(vac);
    }
    await ctx.yield();
    const blobMat = mat({}, /* glsl */`
      ${WC.VERT_PARS}
      attribute vec4 aC; varying vec3 vCol; varying vec3 vL;
      void main(){ vCol = aC.rgb; vL = position*3. + aC.w*17.;
        vec3 p = (instanceMatrix * vec4(position, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-5, 0.));
        ${WC.VERT_END}
        vOP = position*4. + aC.w*20.; }`, /* glsl */`
      ${WC.FRAG_PARS}
      varying vec3 vCol; varying vec3 vL;
      void main(){ vec3 pig = vCol*(1. - .26*smoothstep(.5, .7, vn(vL)));
        gl_FragColor = vec4(wash(pig, normalize(vN), edgeOf(vVN), vOP, .5, .6), 1.); ${WC.FRAG_END} }`);
    const blobGeo = new THREE.IcosahedronGeometry(1, 3), aBl = new Float32Array(blobs.length * 4);
    blobs.forEach((b, i) => aBl.set([b.c.r, b.c.g, b.c.b, b.seed], i * 4)); blobGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(aBl, 4));
    const blobMesh = new THREE.InstancedMesh(blobGeo, blobMat, blobs.length); blobMesh.frustumCulled = false; scene.add(blobMesh);
    const ringGeo = new THREE.TorusGeometry(1, 0.085, 6, 40), rc = pal.green.clone().lerp(pal.lilac, 0.4).lerp(pal.paper, 0.25);
    ringGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array([rc.r, rc.g, rc.b, 0.5]), 4));
    const ring = new THREE.InstancedMesh(ringGeo, blobMat, 1); ring.frustumCulled = false; scene.add(ring);

    // ---------------------------------------------------------------- actin: pencil hatching growing from the wall, swaying together
    const uPixA = { value: 0.0012 }, uPH = { value: 400 };
    { const ar = rng.fork('actin'), pos = [], nxt = [], sd = [], idx = [], NTf = Math.round(80 * dens * detail), base = V3(), nn = V3(), er = V3(), dir = V3(), p0 = V3(), p1 = V3(), bend = V3();
      for (let tf = 0; tf < NTf; tf++) {
        if ((tf & 15) === 0) await ctx.yield();
        const r = ar.range(42, 105), a = ar() * 6.283, ph = ar() * 6.283;
        er.set(0, 0, 0).addScaledVector(ex, Math.cos(a)).addScaledVector(ey, Math.sin(a));
        base.copy(wallO).addScaledVector(d0, (r * r) / 90).addScaledVector(er, r); nn.copy(d0).addScaledVector(er, -(2 * r) / 90).normalize();
        for (let k = 0; k < 18; k++) {
          dir.copy(nn).add(V3(ar.gauss(), ar.gauss(), ar.gauss()).multiplyScalar(0.3)).normalize(); bend.set(ar.gauss(), ar.gauss(), ar.gauss()).multiplyScalar(0.12);
          const len = ar.range(13, 34), SEG = 5, ox = ar.gauss() * 2.5, oy = ar.gauss() * 2.5, oz = ar.gauss() * 2.5;
          // a fibre that would reach the route is not drawn (a long one bent inward could: nothing tested it, and one seed in a few dozen put a tip in the lens)
          p0.copy(base).addScaledVector(dir, len).addScaledVector(bend, len); p1.copy(base).addScaledVector(dir, len * 0.6).addScaledVector(bend, len * 0.36);
          if (path.distanceTo(p0.x + ox, p0.y + oy, p0.z + oz) < 14 || path.distanceTo(p1.x + ox, p1.y + oy, p1.z + oz) < 12) continue;
          const b0 = pos.length / 3;
          for (let i = 0; i <= SEG; i++) {
            const t = i / SEG, t2 = (i + 1) / SEG;
            p0.copy(base).addScaledVector(dir, len * t).addScaledVector(bend, len * t * t); p1.copy(base).addScaledVector(dir, len * t2).addScaledVector(bend, len * t2 * t2);
            for (const s of [-1, 1]) { pos.push(p0.x + ox, p0.y + oy, p0.z + oz); nxt.push(p1.x + ox, p1.y + oy, p1.z + oz); sd.push(s, t, ph + ar() * 0.5, len); }
            if (i < SEG) { const q = b0 + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
          }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aNext', new THREE.Float32BufferAttribute(nxt, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(sd, 4)); g.setIndex(idx);
      const actin = new THREE.Mesh(g, mat({ uGreen: { value: pal.green }, uPixA }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec3 aNext; attribute vec4 aSide; uniform float uPixA; varying float vT;
        void main(){
          float t = aSide.y, ph = aSide.z; vT = t;
          vec3 sw = vec3(sin(uTime*.7 + ph), .3*cos(uTime*.5 + ph*1.3), cos(uTime*.6 + ph*.7)) * t*t*aSide.w*.11;
          vec3 p = position + sw; float t2 = min(1., t + .2);
          vec3 sw2 = vec3(sin(uTime*.7 + ph), .3*cos(uTime*.5 + ph*1.3), cos(uTime*.6 + ph*.7)) * t2*t2*aSide.w*.11;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.); vec4 mn = modelViewMatrix * vec4(aNext + sw2, 1.);
          vec3 tv = normalize(mn.xyz - mvPosition.xyz + vec3(1e-5, 0., 0.));
          vec3 sdv = normalize(cross(tv, normalize(mvPosition.xyz + vec3(0., 0., -1e-5))) + vec3(0., 1e-5, 0.));
          mvPosition.xyz += sdv * aSide.x * max(.11*(1. - .6*t), -mvPosition.z*uPixA*.8);
          vOP = p; vN = vec3(0., 1., 0.); vVN = vec3(0., 0., 1.); vVP = mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition; vClip = gl_Position.xyw;
          #include <fog_vertex>
        }`, /* glsl */`
        ${WC.FRAG_PARS}
        uniform vec3 uGreen; varying float vT;
        void main(){
          vec3 c = mix(uPaper, mix(mix(uGreen, uGlaze, .35), uPencil, .25), .95*(1. - .5*smoothstep(.15, 1., vT)));
          gl_FragColor = vec4(c, 1.);
          ${WC.FRAG_END}
        }`, { side: THREE.DoubleSide }));
      actin.frustumCulled = false; scene.add(actin); }
    await ctx.yield();

    // ---------------------------------------------------------------- fuel dots darting everywhere, glycogen rosettes trembling
    { const pr = rng.fork('dots'), NP = Math.round(2600 * dens * detail), pos = new Float32Array(NP * 3), aP = new Float32Array(NP * 4), q = V3(), cen = V3(); let i = 0, guard = 0;
      const nGly = Math.round(NP * 0.2);
      while (i < NP && guard++ < NP * 6) {
        if ((guard & 127) === 0) await ctx.yield();
        if (i < nGly) { if (i % 14 === 0) { path.pointAt(0.08 + 0.92 * pr(), cen); cen.add(V3(pr.sign() * pr.range(14, 70), pr.range(-35, 30), pr.sign() * pr.range(0, 50))); } q.copy(cen).add(V3(pr.gauss(), pr.gauss(), pr.gauss()).multiplyScalar(1.6)); }
        else { path.pointAt(0.08 + 0.92 * pr(), q); q.add(V3(pr.range(-75, 75), pr.range(-45, 45), pr.range(-75, 75))); }
        if (path.distanceTo(q.x, q.y, q.z) < (i < nGly ? 11 : 16) || q.distanceTo(C) < A.nucleus.radius + 6) continue;
        pos.set([q.x, q.y, q.z], i * 3); aP.set([pr(), i < nGly ? 1 : 0, i < nGly ? pr.range(0.35, 0.6) : pr.range(0.22, 0.5), pr.int(0, 2)], i * 4); i++;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.BufferAttribute(aP, 4)); g.setDrawRange(0, i);
      const dots = new THREE.Points(g, mat({ uPH, uC0: { value: pal.peach }, uC1: { value: pal.lilac }, uC2: { value: pal.teal.clone().lerp(pal.green, 0.4) } }, /* glsl */`
        ${WC.VERT_PARS}
        attribute vec4 aP; uniform float uPH; uniform vec3 uC0, uC1, uC2; varying vec3 vCol;
        vec3 h3(float n){ return fract(sin(vec3(n*12.9898, n*78.233, n*37.719))*43758.5453) - .5; }
        void main(){
          float sd = aP.x; vec3 off;
          if (aP.y < .5) { float tt = uTime*(.9 + sd) + sd*50., i = floor(tt), f = fract(tt); off = mix(h3(i + sd*91.), h3(i + 1. + sd*91.), smoothstep(0., .28, f))*13.; }
          else off = h3(floor(uTime*4.) + sd*33.)*.2;
          vCol = aP.y > .5 ? mix(uC1, uC2, .5)*.8 : aP.w < .5 ? uC0 : aP.w < 1.5 ? uC1 : uC2;
          vec3 p = position + off; vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
          vOP = p; vN = vec3(0., 1., 0.); vVN = vec3(0., 0., 1.); vVP = mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition; vClip = gl_Position.xyw;
          gl_PointSize = clamp(aP.z*uPH/max(-mvPosition.z, .5), 1.7, 15.);
          #include <fog_vertex>
        }`, /* glsl */`
        ${WC.FRAG_PARS}
        varying vec3 vCol;
        void main(){
          vec2 q = gl_PointCoord*2. - 1.; float r = dot(q, q); if (r > 1.) discard;
          vec3 c = mix(uPaper, vCol, .72 + .28*smoothstep(.35, 1., r));
          c = mix(c, uHi, (1. - smoothstep(0., .16, dot(q - vec2(-.3, -.3), q - vec2(-.3, -.3))))*.6);
          gl_FragColor = vec4(c, 1.);
          ${WC.FRAG_END}
        }`));
      dots.frustumCulled = false; scene.add(dots); }
    await ctx.yield();

    // the lattice coat that sketches the bubble flies apart as two dozen three-armed stars
    const NS = 24, starGeo = (() => { const pos = [], idx = []; for (let k = 0; k < 3; k++) { const a = (k * Math.PI * 2) / 3, c = Math.cos(a), s = Math.sin(a), b = pos.length / 3;
      for (const [x, y] of [[-0.09, 0], [0.09, 0], [0.16, 1.0], [-0.02, 1.05]]) pos.push(x * c - y * s, x * s + y * c, 0); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; })();
    const stars = new THREE.InstancedMesh(starGeo, mat({}, /* glsl */`
      ${WC.VERT_PARS}
      void main(){ vec3 p = (instanceMatrix * vec4(position, 1.)).xyz; vec3 n = vec3(0., 1., 0.); ${WC.VERT_END} }`, /* glsl */`
      ${WC.FRAG_PARS}
      void main(){ gl_FragColor = vec4(mix(uPaper, uPencil, .6), 1.); ${WC.FRAG_END} }`, { side: THREE.DoubleSide }), NS);
    stars.frustumCulled = false; scene.add(stars);
    const starDir = []; for (let i = 0; i < NS; i++) { const y = 1 - (2 * (i + 0.5)) / NS, r = Math.sqrt(1 - y * y), a = i * 2.39996; starDir.push(V3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    await ctx.yield();

    // ---------------------------------------------------------------- per-frame
    await ctx.yield();
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), q5 = new THREE.Quaternion(), P = V3(), T = V3(), Sv = V3(), Uv = V3(), nv = V3(), xv = V3(), zv = V3(), bp = V3(), sc3 = V3();
    const cp = V3(), cd = V3(), cu = V3(), cr = V3(), bub = V3(), size = new THREE.Vector2(), ZA = V3(0, 0, 1);
    const mitoQ = mitos.map((m) => new THREE.Quaternion().setFromUnitVectors(ZA, m.ax));
    const bubbleU = hero.vehicle.bubble.material.uniforms, sTake = sAt(0.03) + 15, basisM = new THREE.Matrix4(), wOpt = { tether: 0, bubble: bub, scale: 1, walker: 1, bubbleBasis: basisM };
    const m0In = path.tangentAt(0.2).clone().multiplyScalar(34).addScaledVector(ex, 26).add(V3(0, 9, 0));     // where the pinching mitochondrion waits before it glides in: ahead and further to starboard
    hero.vehicle.walker.renderOrder = 1;

    function placeWalkers(time) {
      for (let j = 0; j < NW; j++) {
        const w = walkers[j], t = w.t, a = t.pts;
        let s = ((w.phi0 + time * w.rate) * 4.8 * w.sc) % t.len; if (w.dir < 0) s = t.len - s;
        const f = (s / t.len) * (t.K - 1), i = Math.min(t.K - 2, Math.floor(f)), fr = f - i, i3 = i * 3;
        P.set(a[i3] + (a[i3 + 3] - a[i3]) * fr, a[i3 + 1] + (a[i3 + 4] - a[i3 + 1]) * fr, a[i3 + 2] + (a[i3 + 5] - a[i3 + 2]) * fr);
        T.set(a[i3 + 3] - a[i3], a[i3 + 4] - a[i3 + 1], a[i3 + 5] - a[i3 + 2]).normalize();
        Sv.crossVectors(T, ey); if (Sv.lengthSq() < 1e-4) Sv.set(1, 0, 0); Sv.normalize(); Uv.crossVectors(Sv, T);
        nv.copy(Uv).multiplyScalar(Math.cos(w.around)).addScaledVector(Sv, Math.sin(w.around));
        zv.copy(T).multiplyScalar(w.dir); xv.crossVectors(nv, zv);
        P.addScaledVector(nv, t.r);
        m4.makeBasis(xv, nv, zv).scale(sc3.setScalar(w.sc)).setPosition(P); walkerMesh.setMatrixAt(j, m4);
        if (w.bj < 0) continue;
        const rb = Math.min(w.bal, (t.clear[i] + (t.clear[i + 1] - t.clear[i]) * fr - 13.5 - 1.7 * w.sc) * 0.5);
        if (rb > 1.2) {
          bp.copy(P).addScaledVector(nv, 1.7 * w.sc + rb + 1.5 + 0.5 * Math.sin(time * 1.3 + w.seed * 20)).addScaledVector(zv, -(rb * 0.6 + 2) - 0.4 * Math.sin((w.phi0 + time * w.rate) * 6.283))
            .addScaledVector(xv, 0.6 * Math.sin(time * 0.9 + w.seed * 11));
          m4.makeScale(rb, rb, rb).setPosition(bp);
        } else m4.makeScale(0, 0, 0);
        balMesh.setMatrixAt(w.bj, m4);
      }
      walkerMesh.instanceMatrix.needsUpdate = true;
    }

    const SEAT = [-1.0, -6.4, 0.8];                                        // the bubble's centre from the lens, in the lens's own axes: ahead, up, to starboard
    function update(dt, time, camera, u) {
      u = u || 0;
      {
        ctx.renderer.getDrawingBufferSize(size); const e5 = camera.projectionMatrix.elements[5] || 1.7, H = Math.max(1, size.y);
        SH.uPx.value = 900 / H; uPixA.value = 2 / (e5 * H); uPH.value = (H * e5) / 2;
      }
      const e = camera.matrixWorld.elements;
      cp.set(e[12], e[13], e[14]); cu.set(e[4], e[5], e[6]).normalize(); cd.set(-e[8], -e[9], -e[10]).normalize(); cr.crossVectors(cd, cu);
      dome.position.copy(cp);

      // our vehicle: the walker ahead on the tube, and the bubble the lens rides over. THE SEAT: the lens rides 2.8 m over the
      // bubble's upper rear shoulder (the bubble's centre 6.4 m under the lens, 1 m behind it and 0.8 m to starboard, in the
      // lens's own axes), so the whole sphere lies under the lower edge of every window up to 100 degrees tall, wherever the
      // gaze goes: the bubble is the seat, not a thing in the picture (from 0.95 m over its skin it was only ever a faint
      // rim across the bottom of the frame). The seat is also far enough from the bubble's middle that the stars of its
      // coat, which fly out from that middle, pass the lens with 2 m and more to spare.
      const sCam = sAt(u);
      const rev = sstep(uJ - 0.03, uJ + 0.035, u) * (1 - sstep(uJ + 0.15, uJ + 0.23, u));     // the held beat at the junction
      let sW = Math.max(sCam + 15 + 18 * rev, sTake);                                           // through the reveal it walks a little further ahead and half as large again, against the lilac
      if (u > uRel) sW = sAt(uRel) + 15 + (u - uRel) * L * 1.8;
      const tether = sstep(0.03, 0.07, u) * (1 - sstep(uRel - 0.005, uRel + 0.03, u)), phi = sW / 4.8, bs = sstep(0, 0.014, u);
      bub.copy(cp).addScaledVector(cd, SEAT[0] + 0.22 * Math.sin(phi * 6.283 + 1.2) * tether).addScaledVector(cu, SEAT[1] - 0.25 * rev + 0.12 * Math.sin(time * 1.9)).addScaledVector(cr, SEAT[2] + 0.2 * Math.sin(time * 1.1));
      bubbleU.uForm.value = sstep(0.025, 0.06, u); bubbleU.uLat.value = sstep(0.004, 0.03, u) * (1 - sstep(0.05, 0.085, u));
      wOpt.tether = tether; wOpt.scale = bs; wOpt.walker = 1.5 + 0.5 * rev; basisM.makeBasis(xv.copy(cr).negate(), cu, cd); hero.setWalker(sW, wOpt);
      hero.setProgress(sstep(0.84, 0.985, u));
      hero.update(dt, time, camera);

      // the coat of stars
      const fly = sstep(0.05, 0.15, u), ss = sstep(0.01, 0.035, u) * (1 - sstep(0.13, 0.17, u));
      for (let i = 0; i < NS; i++) {
        if (ss <= 0) { m4.makeScale(0, 0, 0); stars.setMatrixAt(i, m4); continue; }
        const d = starDir[i]; q4.setFromUnitVectors(ZA, d); q5.setFromAxisAngle(ZA, i * 1.7 + fly * 9 + time * 0.6 * fly); q4.multiply(q5);
        bp.copy(bub).addScaledVector(d, 3.56 * bs + fly * fly * (30 + 22 * ((i * 0.618) % 1))); bp.y += fly * fly * 6;
        m4.compose(bp, q4, sc3.setScalar(0.62 * ss)); stars.setMatrixAt(i, m4);
      }
      stars.instanceMatrix.needsUpdate = true;

      placeWalkers(time);

      // the stray bubble and the lysosome that swallows it
      const sw = sstep(0.19, 0.27, u), gulp = Math.sin(Math.PI * sw);
      bp.copy(strayHome).lerp(lyso0.p, sw); bp.y += 0.5 * Math.sin(time * 1.4);
      const sr = 3.2 * (1 - sstep(0.55, 1, sw)); m4.makeScale(sr, sr, sr).setPosition(bp); balMesh.setMatrixAt(NBal, m4);
      balMesh.instanceMatrix.needsUpdate = true;

      // blobs
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        if (b.kind === 'knot') { m4.makeScale(b.r, b.r * 0.85, b.r).setPosition(b.p); }
        else if (b.kind === 'lyso') {
          q4.setFromAxisAngle(b.ax, time * 0.35 + b.seed * 6);
          bp.copy(b.p); bp.x += 2.5 * Math.sin(time * 0.23 + b.seed * 9); bp.y += 2 * Math.sin(time * 0.31 + b.seed * 5); bp.z += 2.5 * Math.cos(time * 0.19 + b.seed * 7);
          if (i === 1) bp.lerp(strayHome, 0.25 * gulp);
          const r = b.r * (i === 1 ? 1 + 0.22 * gulp : 1); m4.compose(bp, q4, sc3.set(r, r * (1 + 0.06 * Math.sin(time * 1.7 + b.seed * 30)), r));
        } else {
          const a = b.a0 + time * b.sp, ca = Math.cos(a), sa = Math.sin(a);
          nv.set(ca, sa * b.tilt, sa).normalize(); nv.y += b.tilt2 * ca * 0.6; nv.normalize();
          bp.copy(vacC).addScaledVector(nv, b.rr); q4.setFromUnitVectors(ey, nv); q5.setFromAxisAngle(ey, a * 3 + b.seed * 6); q4.multiply(q5);
          m4.compose(bp, q4, sc3.set(b.r, b.r * 0.42, b.r * 0.72));
        }
        blobMesh.setMatrixAt(i, m4);
      }
      blobMesh.instanceMatrix.needsUpdate = true;

      // mitochondria drift; one is pinched in two by a loop of pale tube and the halves ease apart
      uPinch.value = sstep(0.07, 0.16, u); uApart.value = sstep(0.15, 0.24, u);
      for (let i = 0; i < NM; i++) {
        const m = mitos[i];
        bp.copy(m.p); if (i === 0) bp.addScaledVector(m0In, 1 - sstep(0, 0.11, u)); bp.x += 4 * Math.sin(time * 0.11 + m.seed * 9); bp.y += 3 * Math.sin(time * 0.14 + m.seed * 4); bp.z += 4 * Math.cos(time * 0.09 + m.seed * 6);
        q5.setFromAxisAngle(ey, 0.12 * Math.sin(time * 0.07 + m.seed * 12)); q4.copy(q5).multiply(mitoQ[i]);
        m4.compose(bp, q4, sc3.set(m.rad, m.rad, m.len / 8)); mitoMesh.setMatrixAt(i, m4);
        if (i === 0) { const rr = (m.rad * (1.16 - 0.95 * uPinch.value) + 0.6) * (1 - sstep(0.165, 0.23, u)); m4.compose(bp, q4, sc3.set(rr, rr, rr)); ring.setMatrixAt(0, m4); }
      }
      mitoMesh.instanceMatrix.needsUpdate = true; ring.instanceMatrix.needsUpdate = true;

      if (rare) uFront.value = nbLen * (0.7 - 0.8 * sstep(0, 0.26, u));   // it passes us at about u 0.145, some 35 m/s relative
    }
    await ctx.yield();
    update(0, 0, { projectionMatrix: new THREE.Matrix4().makePerspective(-1, 1, 0.6, -0.6, 1, 10), matrixWorld: new THREE.Matrix4().setPosition(path.pointAt(0)) }, 0);

    const walkerAt = hero.vehicle.state.position;
    const sideJ = V3().crossVectors(path.tangentAt(uJ), ey).normalize();             // starboard at the junction
    const uG = uOfS(sG0), archHeart = (() => { hero.tubeFrame(sG0 + 34, F); return F.P.clone().addScaledVector(F.U, 13); })();   // the heart of the Golgi's arches, 13 m over our tube
    const gazeP = V3(), gazeQ = V3(), gazeD = V3(0, -9, 0), sbell = (u, a, b, f) => sstep(a, a + f, u) * (1 - sstep(b - f, b, u));
    const titles = { day: 'The Inner Highway', dawn: 'The Inner Highway, a Wet Dawn', golden: 'The Inner Highway in Sienna', night: 'The Inner Highway by Night' };
    return {
      scene, path, duration: 42, ride: 'none', style: 'none',
      title: titles[hour],
      pace: (u) => 0.5 + 0.6 * sstep(0.02, 0.1, u) - 0.16 * sstep(0.83, 0.9, u) - 0.3 * sbell(u, uJ - 0.02, uJ + 0.16, 0.06),
      camera: { fov: 56, near: 0.3, far: 4200, lookAhead: 22, sway: 0.6, bank: 1 },
      pois: [
        // a light hand on the vehicle: the gaze leans a little down the tube ahead, so the motor is never lost for long; through
        // the reveal it lets go, so the gaze can lift to the globe
        { at: (time, u) => { gazeD.y = -9 + 9 * sbell(u, uJ - 0.03, uJ + 0.2, 0.07); hero.tubeFrame(sAt(u) + 24, F); return gazeP.copy(F.P).add(gazeD).lerp(path.pointAt(Math.min(1, u) + 26 / L, gazeQ), 0.5); }, from: 0.03, to: uRel + 0.03, weight: 0.2, fade: 0.1 },
        { at: C.clone().add(V3(0, -120, 160)), from: 0.0, to: 0.1, weight: 0.5 },
        { at: (time) => mitos[0].p, from: 0.045, to: 0.215, weight: 0.32, fade: 0.35 },   // the gaze lifts to the one being pinched in two
        { at: archHeart, from: uG - 0.13, to: uG + 0.02, weight: 0.4, fade: 0.35 },        // the arch: its heart, as the lens comes up off the port quarter
        // a slow look across to starboard as we leave the Golgi: the neighbour tube and the fan running on to the knot
        { at: path.pointAt(uJ - 0.02).clone().addScaledVector(sideJ, 130).add(V3(0, 12, 0)), from: uJ - 0.17, to: uJ - 0.03, weight: 0.2, fade: 0.4 },
        { at: C.clone().add(V3(0, -95, 200)).addScaledVector(sideJ, 35), from: uJ - 0.04, to: uJ + 0.18, weight: 0.38 },
        { at: seat.clone(), from: uJ + 0.16, to: 0.94, weight: 0.3 },
        { at: () => walkerAt, from: uRel - 0.09, to: uRel + 0.035, weight: 0.3 },             // the farewell: the gaze stays with the walker while it waves and strides off
      ],
      portal: { shape: 'circle', radius: 7, color: look.gouache ? '#f3efe2' : '#fff2d8', glow: 0.3, tilt: true, revealDistance: 320 },
      post: { exposure: look.exposure, bloom: { strength: 0.04, radius: 0.4, threshold: 1.3 },
        grade: { saturation: 1.06, contrast: 1.0, vignette: 0.04, grain: 0, aberration: 0 } },
      update,
      dispose() { sphGeo.dispose(); },
    };
  },
};
