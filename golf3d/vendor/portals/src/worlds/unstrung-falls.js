// THE UNSTRUNG FALLS: a full-moon night in a gorge of glass beadwork. Everything is a bead on thread: cliffs stitched
// row by row, fringe willows, a river of rolling pearls, and a fall of loose pearls pouring from a colossal broken
// necklace sagging across the stars. We ride a moth of wire and beads up the river, through a bead curtain, up the
// face of the pour, over the lip under the great strand and up beside it to the coral-rimmed clasp ring.
//
// World frame: +Z is the course. The hero (src/parts/unstrung-falls.js) is seated mirrored with rotation.y = PI at
// (0,0,300), so world = (-x, y, 300 - z): the Snag stands on the right rim (world x -34) and the strand climbs away
// to the left, as the brief's words have it. The moon is to the right, 90 degrees off the exit axis.
// Round 3 (the picture grouped by value): the canyon is calm dark planes (midnight and navy; the moonward buttress
// slate) with the fall the one bright thing; the night half has a light: a low moon (a great pearl, two rows of pearls
// and a halo of seed beads) over rows of glow beads sewn along the horizon, and a lit side and a shaded side on every
// horn and every ball of the strand. The moon is SEEN 42 degrees right of the entry course; the light it sheds is
// taken from further round (104 degrees), so the strand and spires show us their lit sides. The mount is only the
// moth's small head and two feelers at the bottom centre. The flight begins 242 m from the fall, so the lip comes at
// u 0.44; events are keyed to places (sGust, sRel), not to fixed seconds.
// Style: every material is one of the hero's unlit bead materials (impostor beads, row lattices, thread); colours
// are the palette's own values (post.flat: no tone map, so each lands on its hex; only glints are written above 1
// and bloom); no lights, no fog: distance is told by bead size (and, far off, by fewer and plainer beads).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  buildHero, createStyle, STYLE_GLSL, beadQuadGeometry, beadMaterial, rowMaterial, threadMaterial,
  threadTubeGeometry, backingMaterial, sceneColorFor, PALETTE,
} from '../parts/unstrung-falls.js';

const V3 = THREE.Vector3;
const hashI = (n) => { const s = Math.sin(n * 12.9898 + 4.137) * 43758.5453; return s - Math.floor(s); };
const FROST = ['#06070F', '#7E9BCB', '#7A8CAB', '#CFDBEA', '#F2F0E8', '#E4533F', '#EEF6FF'];
const DEG = Math.PI / 180;

export default {
  id: 'unstrung-falls',
  name: 'The Unstrung Falls',
  category: 'wilderness',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, hour = vary.hour || 'any', rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
    const N = ctx.noise;

    // ---- the brief's variations (own fork: the hero's draws from ctx.rng keep their order) ----
    const vr = ctx.rng.fork('uf-look');
    let moonKind = vr.pick([0, 0, 0, 1, 1, 2, 2]);                 // 0 high ice-white, 1 low rose pearl, 2 small hard blue-white
    if (hour === 'dawn' || hour === 'golden') moonKind = 1; else if (hour === 'night' && moonKind === 1) moonKind = 0;
    const frost = vr.chance(0.3) && !rare;
    const breeze = vr.pick([0, 0, 0, 1, 2, 2]);                    // 0 one gust in the gorge, 1 still, 2 steady wind with fronts
    const cast = vr.pick([0, 0, 0, 1, 2, 2]);                      // 0 moths and fish, 1 fish only (hundreds), 2 dragonflies
    const lay = { willowSeed: vr.range(0, 100), bank: vr.range(0, 100), ridge: vr.range(0, 100), curt: vr.range(0, 6) };
    const palette = (frost ? FROST : PALETTE).slice();
    if (moonKind === 1) palette[6] = frost ? '#FBE9EA' : '#F7E2E4'; else if (moonKind === 2) palette[6] = '#DCEBFF';
    const EXPOSURE = 1;                                             // post.flat: palette colours are written as themselves

    // moon: always to the right (world -X), 90 degrees off the exit axis for the default
    // The moon is seen low on the right (42 degrees right of the entry course, 86 off the exit axis): over the Snag's
    // shoulder at the crest, behind the right wall in the gorge. The light it sheds on the beadwork (lit sides, shaded
    // sides, glints) is taken from further round to the right, so the strand and the spires show us their lit side.
    const dirOf = (az, el) => new V3(-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), Math.cos(az * DEG) * Math.cos(el * DEG)).normalize();
    const moonSee = dirOf([42, 40, 46][moonKind], [17, 11, 27][moonKind]);
    const moonW = dirOf(104, [25, 15, 37][moonKind]);
    const style = createStyle({ palette, exposure: EXPOSURE, moon: moonW, glintGain: moonKind === 2 ? 1.9 : 1.6,
      deep: frost ? '#3E5C9A' : palette[1], navy: frost ? '#5673AE' : null });
    const U = style.uniforms;
    const dispo = [];

    // ---- the hero, seated ----
    await ctx.yield();
    const hero = await buildHero(ctx, { palette, detail, exposure: EXPOSURE, mirror: true, style, run: rare, light: moonW });
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 300);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors;
    const toW = (v, out = new V3()) => out.set(-v.x, v.y, 300 - v.z);
    const strandW = (s, out = new V3(), time = -1) => toW(hero.strandPoint(s, out, time), out);
    const ringC = toW(A.portalSeat.position), ringA = new V3(-A.portalSeat.axis.x, A.portalSeat.axis.y, -A.portalSeat.axis.z).normalize();
    const snagTip = toW(A.snagTip), tailTip = toW(A.tailTip), dropFrom = toW(A.dropFrom);
    const hd = new V3(ringC.x - snagTip.x, 0, ringC.z - snagTip.z).normalize(), sideL = new V3(hd.z, 0, -hd.x);     // the strand's heading and its true left
    // arc length at the top of the Snag: the nearest strand sample to the tip
    let sTop = 0; { let best = 1e9; const t = new V3(); for (let s = 0; s < hero.strandLength; s += 1) { const d = strandW(s, t).distanceToSquared(snagTip); if (d < best) { best = d; sTop = s; } } }
    const SLEN = hero.strandLength;

    // ---- the path: river, gorge, the 63 degree climb up the face, the crest, beside the strand, the ring ----
    const foot = toW(A.climbFoot), topC = toW(A.climbTop), aim = ringC.clone().addScaledVector(ringA, -62);
    const cl = (k) => new V3().lerpVectors(foot, topC, k);
    const runUp = rare ? 10 : 0;                         // on the rare run the lightened strand lifts: we fly that much higher beside it
    const beside = (ds, side, up) => strandW(sTop + ds).addScaledVector(sideL, side).add(new V3(0, up, 0));
    // from the strand's low span one straight 30 degree leg rises to the ring's axis: the strand stays ahead and to the
    // right with its last balls under the ring, and the nose never pitches above the final climb
    const b72 = beside(70, 12, 9.5 + runUp);
    const pts = [
      // (low and straight under the two reaching willows, then a rise and a swing to the right and back before the curtain, so the eye moves)
      // (the flight begins 242 m from the fall, so its lip comes before the middle of the path)
      [0, 6, 58], [0, 6, 78], [0, 6.4, 97], [-3.5, 10.5, 119], [-1.5, 9.2, 137], [0, 7.5, 154], [0, 7.6, 190], [0, 8.2, 222], [0, 9.6, 236],
      cl(0.045).add(new V3(0, -0.6, 0)), cl(0.2), cl(0.4), cl(0.6), cl(0.8).add(new V3(1.2, 0, 0)), cl(0.95).add(new V3(4, -0.5, 0)),
      // over the lip we slide out to the left and stay low over the heap, so the strand lies side-on across the sky to our
      // right with its dangling end 75 m off; then a banked sweep right and up to its left side, close round the Snag
      // (and we bear in low toward the dangling end, to within some 55 m of it, so the strand looms over us and the ball
      // that leaves it falls close, before the sweep up to its left side)
      [4, 101.6, 301], [2, 101.3, 313], [0, 101.8, 326], [-2, 103, 340], [-2, 105, 352], [4, 107.5, 364], [12, 112, 377], [18, 122, 392], [12, 136, 409], [-1, 147, 422],
      beside(30, 14.5, 3.5 + runUp * 0.4), beside(50, 12, 5.5 + runUp), b72, new V3().lerpVectors(b72, aim, 0.34), new V3().lerpVectors(b72, aim, 0.67),
      aim, ringC.clone().addScaledVector(ringA, -31), ringC.clone(),
    ];
    const path = makePath(pts, { samples: 480 });
    await ctx.yield();
    // u at the landmarks, found on the built path
    const uOf = (fn) => { let b = 0, bd = 1e18; const p = new V3(); for (let i = 0; i <= 600; i++) { path.pointAt(i / 600, p); const d = fn(p, i / 600); if (d < bd) { bd = d; b = i / 600; } } return b; };
    const uMouth = uOf((p) => Math.abs(p.z - 150) + (p.y > 30 ? 1e6 : 0)), uFoot = uOf((p) => p.distanceTo(foot)), uLip = uOf((p) => p.distanceTo(topC));
    await ctx.yield();
    const uStrandBeat = uOf((p) => p.distanceTo(new V3(-1.5, 102.6, 335))), uDropBeat = uOf((p) => Math.abs(p.z - 362) + (p.y < 100 ? 1e6 : 0)), uGustBeat = uOf((p) => Math.abs(p.z - 205) + (p.y > 30 ? 1e6 : 0));
    await ctx.yield();
    // the lingering place (round 4): from where the dangling end is 50 m off to where the necklace's sag crosses the whole frame
    const uLingA = uOf((p) => Math.abs(p.z - 352) + (p.y < 100 ? 1e6 : 0)), uLingB = uOf((p) => Math.abs(p.z - 406) + (p.y < 100 ? 1e6 : 0));
    await ctx.yield();
    const uCrestEnd = uOf((p) => Math.abs(p.z - 366) + (p.y < 100 ? 1e6 : 0)), uAim = uOf((p) => p.distanceTo(aim)), uB72 = uOf((p) => p.distanceTo(b72));
    await ctx.yield();
    const pace = (u) => {
      let p = 1.3;
      p = lerp(p, 1.1, smoothstep(uMouth - 0.05, uMouth + 0.03, u));
      p = lerp(p, 0.95, smoothstep(uFoot - 0.04, uFoot + 0.03, u));
      // over the lip and across the heap briskly; the slow seconds are spent under the necklace, where the ball falls and bursts
      p = lerp(p, 0.9, smoothstep(uLip - 0.045, uLip + 0.015, u));
      p = lerp(p, 1.4, smoothstep(uLip + 0.012, uLip + 0.05, u));      // (round 6: the first, small sight of the garland lasts under three seconds)
      p = lerp(p, 0.4, smoothstep(uLingA - 0.05, uLingA, u));
      p = lerp(p, 1.2, smoothstep(uLingB, uLingB + 0.07, u));
      return lerp(p, 1, smoothstep(0.84, 0.92, u));
    };
    const DURATION = 42;
    // journey seconds at u (the engine's own rescaling of pace), for events the brief times in seconds
    const TT = new Float32Array(257); { let a = 0; for (let i = 1; i <= 256; i++) { a += 1 / clamp(pace((i - 0.5) / 256), 0.35, 2.5); TT[i] = a; } for (let i = 1; i <= 256; i++) TT[i] *= DURATION / a; }
    const secAt = (u) => { const f = clamp(u, 0, 1) * 256, i = Math.min(255, Math.floor(f)); return lerp(TT[i], TT[i + 1], f - i); };
    // the brief's timed events, keyed to where we are: the gust front meets us in the gorge; the lowest ball is released
    // 0.8 s before we are nearest the dangling end, so it is falling as we look and bursts just after
    const sGust = secAt(uGustBeat), sRel = secAt(uDropBeat) - 0.8;
    const uAtSec = (s) => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (secAt(m) < s) lo = m; else hi = m; } return lo; };
    await ctx.yield();

    // ---- the breeze, shared by everything strung: one travelling front (or a train of them), and the camera's wake ----
    const wind = { uGF: { value: new THREE.Vector4(400, breeze === 1 ? 0 : 1, breeze === 2 ? 1 : 0, breeze === 1 ? 0.25 : 1) }, uCamP: { value: new V3(0, 6, 0) }, uPart: { value: 1 } };
    const WIND_GLSL = /* glsl */`
      uniform vec4 uGF; uniform vec3 uCamP; uniform float uPart;
      // 0..1: how hard the air pushes at p. One front travelling down the gorge at 12 m/s, relaxing over ten seconds
      // behind it; in a steady wind, a front every five seconds, the beads relaxing to blue well before the next.
      float gustAt(vec3 p){
        float b = p.z - uGF.x;
        // (behind the front the beads relax along a slanting edge, lower rows last: the turned stretch is a band some
        // 50 m long crossing the wall, and the walls beside the fall are never turned: they stay its dark flanks)
        float one = smoothstep(0., 9., b)*(1. - smoothstep(40., 60., b + 0.55*p.y))*(1. - uGF.z);
        // (the front slants across a cliff face, so on the buttress it is one silver band a quarter of the face wide)
        float f = fract((p.z + 0.34*abs(p.x) - 0.3*p.y + 12.*uTime)/60. + 0.05*sin(p.x*0.03));
        float train = smoothstep(0., 0.05, f)*(1. - smoothstep(0.07, 0.2, f))*uGF.z;
        return (one + train)*uGF.y*(1. - smoothstep(254., 274., p.z));
      }
      // a fringe that is let down as we come: 0.03 (its beads bunched at the bough) far off, 1 (hanging its full length) near
      float letK(vec2 xz, float ph){ float d = length(xz - uCamP.xz); return max(1. - smoothstep(11. + 3.*ph, 30. + 3.*ph, d), 0.03); }
      // the bead curtain is let down as we come: metres of each strand released (its crystal weight runs down the
      // thread and the bugles come off the roll behind it), the outer strands first
      float curtRel(float ph){ return 84.*(1. - smoothstep(26., 62., 150. - uCamP.z - ph*14.)); }
      // a strung bead d metres down its strand from the pivot: pendulum with lag running down the strand, pushed
      // down-gorge by the gust, and swung aside from the moth (rad = how far it clears us)
      vec3 swayAt(vec3 p, float d, float ph, float rad){
        float cu = rad < -6.5 ? 1. : 0.;                                 // a strand of the curtain: long and heavy
        float g = (gustAt(p + vec3(0., 0., -d*0.9))*(1. - 0.3*uGF.z) + 0.3*uGF.z)*(1. - 0.72*cu);
        float a = (0.035*sin(uTime*0.85 + ph*6.283 - d*0.21) + 0.02*sin(uTime*1.37 + ph*17. - d*0.33))*uGF.w;
        float c = 0.03*sin(uTime*0.61 + ph*11. - d*0.17)*uGF.w*(1. - 0.55*cu) + cu*0.012*sin(uTime*1.9 + ph*23. - d*0.38);
        vec3 o = vec3(c*d, 0., -(a + 0.42*g + 0.05*g*sin(uTime*2.1 + ph*40. - d*0.4))*d);
        o.y = 0.14*g*g*d;
        if (cu > 0.5) {                                                  // it swings out from the moth as a pendulum and clacks back behind
          vec2 dc = (p.xz + o.xz - uCamP.xz)*vec2(1., 0.42); float lc = length(dc);
          float nr = (1. - smoothstep(5.5, 11.5, lc))*uPart; float dk = clamp(d/62., 0., 1.); nr *= dk*sqrt(dk);
          o.x += (p.x > uCamP.x ? 1. : -1.)*nr*2.6; o.z += 0.6*nr*sin(uTime*5. + ph*30.);
          return o;
        }
        float zs = 1.;
        vec2 dx = (p.xz + o.xz - uCamP.xz)*vec2(1., zs); float l = length(dx);
        float near = (1. - smoothstep(rad*0.55, rad, l))*(1. - smoothstep(4., 9., abs(p.y - uCamP.y)))*min(d*0.3, 1.)*uPart;
        vec2 dir = l > 1e-3 ? dx/l : vec2(1., 0.);
        dir = normalize(vec2(dir.x + (p.x > uCamP.x ? 0.9 : -0.9), dir.y*0.35));
        o.xz += dir*near*(rad - l*0.6);
        return o;
      }`;

    // ---- the bead collector: every fixed or strung impostor bead of the world goes through here ----
    // colour index: 0 blue, 1 slate, 2 silver, 3 pearl, 4 coral, 5 thread, 6 clear crystal. shape: 0 round, 1 faceted
    // crystal, 2 cylinder, 3 bugle. hang: metres down its strand (0 = fixed); ph: phase; rad: clearance from the moth.
    const collectors = [];
    function collector(name) {
      const c = { name, p: [], ax: [], k: [], s: [], n: 0,
        add(x, y, z, r, ax, ay, az, col, shape = 0, lined = 0, hang = 0, ph = 0, rad = 0, turn = 0) {
          c.p.push(x, y, z, r); c.ax.push(ax, ay, az); c.k.push(col, shape, (c.n * 0.61803 + ph) % 1, lined); c.s.push(hang, ph, rad, turn); c.n++;
        } };
      collectors.push(c); return c;
    }
    const beadMat = beadMaterial(style, { uniforms: wind, header: `attribute vec4 aP, aK, aS; attribute vec3 aAx; ${WIND_GLSL}`, body: /* glsl */`
      C = aP.xyz; R = aP.w; SEED = aK.z; LINED = aK.w;
      float hang = aS.x;
      if (aS.z > 6.5) { float lk = letK(aP.xz, aS.y); C.y += hang*(1. - lk); hang *= lk; }     // its beads slide down their thread from the bough
      vec3 P0 = aP.xyz;
      if (aS.z < -6.5) {                                  // a bead of the curtain: on the roll until its strand is let down past it
        float rel = curtRel(aS.y);
        if (aS.w < 0.5) R *= smoothstep(-0.4, 2.2, rel - hang);
        if (hang > rel) { C.y += hang - rel; hang = rel; }
        P0 = C;
      }
      if (hang > 0.) C += swayAt(P0, hang, aS.y, aS.z);
      if (aS.z > 3.25 && aS.z < 3.35) R *= 1. - smoothstep(80., 140., length(aP.xyz - cameraPosition));
      AX = aAx*inversesqrt(max(dot(aAx, aAx), 1e-6));
      vec3 e = cross(AX, vec3(0.2, 0.9, 0.4)); if (dot(e, e) < 1e-3) e = vec3(1., 0., 0.); E1 = normalize(e);
      float ci = aK.x;
      COLA = ci < 0.5 ? uBlue : (ci < 1.5 ? uSlate : (ci < 2.5 ? uSilver : (ci < 3.5 ? uPearl : (ci < 4.5 ? uCoral : (ci < 5.5 ? uThread : (ci < 6.5 ? mix(uSilver, uGlint, 0.55) : (ci < 7.5 ? uVelvet*2.6 + vec3(0.015) : uNavy)))))));
      if (aS.x <= 0. && aS.y > 0.5) {                     // a bead of the inner gorge walls: far off (from the river) the wall is one plain midnight, the fall's dark flank
        float far = smoothstep(85., 150., length(aP.xyz - cameraPosition));
        if (ci < 0.5) COLA = uDeep;
        COLA = mix(COLA, uDeep, far); LINED *= 1. - far;
      }
      COLB = COLA;
      if (aS.w > 0.5 && aS.z > -6.5) {                    // a two-tone bead on a wall: the gust turns it blue to silver
        float tn = clamp(gustAt(aP.xyz)*1.6, 0., 1.)*(1. - smoothstep(55., 100., length(aP.xyz - cameraPosition)));
        COLB = uSilver; LINED = tn; float th = (tn - 0.5)*3.14159;
        E1 = normalize(cross(AX, vec3(0.3, 0.2, 0.9)))*cos(th) + normalize(cross(AX, cross(AX, vec3(0.3, 0.2, 0.9))))*sin(th);
        if (tn > 0.98) COLA = uSilver; if (tn < 0.02) COLB = COLA;
      }
      KIND = aK.y > 0.5 && aK.y < 1.5 ? 1. : 0.; LEN = aK.y > 2.5 ? 3. : (aK.y > 1.5 ? 0.6 : 0.);
      if (aS.x > 0. && abs(ci - 4.) > 0.5 && aS.z > -6.5) {              // strung seed beads too far to draw are held to a couple of pixels: they take the tone of the bank behind them instead of adding up to a veil
        float pxd = 2.*R*projectionMatrix[1][1]*uResY*0.5/max(-(viewMatrix*vec4(C, 1.)).z, 0.05);
        float cov = clamp(pxd/2.4, 0.25, 1.);
        vec3 dim = aP.x > 0. ? mix(uSilver, uSlate, 0.3) : mix(uBlue, uSlate, 0.2);
        COLA = mix(dim, COLA, cov); COLB = mix(dim, COLB, cov);
      }` });
    async function beadMesh(c) {
      const g = beadQuadGeometry(c.n);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(c.p), 4)); await ctx.yield();
      g.setAttribute('aAx', new THREE.InstancedBufferAttribute(new Float32Array(c.ax), 3)); await ctx.yield();
      g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(c.k), 4)); await ctx.yield();
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(c.s), 4)); await ctx.yield();
      const m = new THREE.Mesh(g, beadMat); m.frustumCulled = false; m.name = c.name; scene.add(m); c.p = c.ax = c.k = c.s = null; return m;
    }
    // grid sheet for row-lattice surfaces: fn(u, v, o) fills o = [x, y, z, rowU, rowV]
    function gridGeo(nu, nv, fn) {
      const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0, 0, 0];
      for (let j = 0, q = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, q++) { fn(i / nu, j / nv, o); pos[q * 3] = o[0]; pos[q * 3 + 1] = o[1]; pos[q * 3 + 2] = o[2]; uv[q * 2] = o[3]; uv[q * 2 + 1] = o[4]; }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    await ctx.yield();

    // ---- the lie of the land (world frame) ----
    const riverY = (x) => 0.9 * Math.cos(clamp(x / 17, -1.5, 1.5)) + 3.5 * smoothstep(15, 24, Math.abs(x)) - 0.4;
    const hw = (z) => 23 - 3 * smoothstep(150, 215, z) + 1.5 * smoothstep(245, 300, z);                     // gorge half-width
    const zFront = (ax) => 150 + 0.17 * (ax - 23) - 11 * Math.exp(-(((ax - 42) / 19) ** 2)) + 4 * N.n2(ax * 0.02 + lay.ridge, 3.1);
    const basinE = (x, z) => Math.pow(Math.pow(Math.abs(x) / 60, 2.6) + Math.pow(Math.abs(z - 372) / 74, 2.6), 1 / 2.6);
    const pinF = toW(A.pinnacleFoot);
    const topY = (x, z) => {                                                                               // the massif's top
      const e = basinE(x, z), ax = Math.abs(x);
      const high = 113 + 9 * N.fbm2(x * 0.011 + lay.ridge, z * 0.011, 3) + 16 * Math.exp(-(((ax - 95) / 40) ** 2) - (((z - 185) / 45) ** 2))
        - 60 * Math.exp(-(((ax - 26) / 26) ** 2) - (((z - 156) / 34) ** 2)) + 27 * Math.exp(-(((ax - 46) / 27) ** 2) - (((z - 266) / 40) ** 2))
        + 14 * Math.exp(-((x - pinF.x) ** 2 + (z - pinF.z) ** 2) / 2600);
      const y = lerp(95.5, high, Math.max(smoothstep(1.1, 1.7, e), 1 - smoothstep(292, 322, z)));
      let yy = y - 78 * smoothstep(120, 300, ax) * (1 - smoothstep(260, 420, z)) - 60 * smoothstep(240, 330, ax) - 60 * smoothstep(640, 800, z);
      // beside the strand the land keeps 11 m below our course (a shallow fold under it), so its cobbles run on unbroken under the moth
      if (z > 425) { const q = path.nearestXZ(x, z); yy = Math.min(yy, q.y - 11.5 + 0.011 * q.dist * q.dist); }      // (a wide round fold: the sheet under the cobbles is coarse and must follow it)
      return yy;
    };
    const valleyY = (x, z) => {
      const ax = Math.abs(x);
      return riverY(x) + 0.07 * Math.max(ax - 24, 0) + 34 * smoothstep(70, 230, ax) * (0.7 + 0.5 * N.n2(x * 0.01, z * 0.012 + lay.bank))
        + 1.6 * N.n2(x * 0.05 + lay.bank, z * 0.05) * smoothstep(22, 40, ax);
    };
    // the cliff line in plan, one per side: along the massif's front, round the buttress, up the gorge to the headwall
    const walls = [];
    for (const sd of [1, -1]) {
      const cp = [];
      for (let ax = 300; ax > hw(150) + 9; ax -= 9) cp.push(new V3(sd * ax, 0, zFront(ax)));
      for (let z = 161; z <= 306; z += 8) cp.push(new V3(sd * (hw(z) + 1.1 * N.n2(z * 0.045 + sd * 7, lay.ridge)), 0, z));
      const c = new THREE.CatmullRomCurve3(cp, false, 'centripetal'); c.arcLengthDivisions = 400;
      const L = c.getLength(), n = Math.ceil(L / 2.5), P = c.getSpacedPoints(n), Nn = [];
      let sCorner = 0, bestZ = 1e9;
      for (let i = 0; i <= n; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(n, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
        Nn.push([tz / l * sd, -tx / l * sd]);                                                              // into the rock
        if (Math.abs(P[i].x) < 60 && P[i].z < bestZ) { bestZ = P[i].z; sCorner = i * 2.5; }
      }
      walls.push({ sd, P, Nn, n, L: n * 2.5, sCorner: sCorner + 14 });
    }
    await ctx.yield();
    // a point of a cliff face at arc s, height y: leans back, ribbed, with two ledges; o = [x, y, z, rowU, rowV, nx, nz]
    function wallPoint(w, s, y, o) {
      const f = clamp(s / 2.5, 0, w.n), i = Math.min(w.n - 1, Math.floor(f)), k = f - i;
      const px = lerp(w.P[i].x, w.P[i + 1].x, k), pz = lerp(w.P[i].z, w.P[i + 1].z, k), nx = lerp(w.Nn[i][0], w.Nn[i + 1][0], k), nz = lerp(w.Nn[i][1], w.Nn[i + 1][1], k);
      const front = 1 - smoothstep(w.sCorner - 8, w.sCorner + 4, s);
      const rib = Math.pow(Math.abs(Math.sin(s * 0.085 + w.sd)), 3) * (1.6 + 2.4 * front) + 1.3 * N.n2(s * 0.04 + w.sd * 9, y * 0.03 + lay.ridge);
      const back = (w.sd > 0 ? 0.035 : 0.05) * y + 2.6 * smoothstep(27, 30.5, y) + 2.6 * smoothstep(62, 66, y) - rib * smoothstep(0, 12, y) * (1 - 0.5 * smoothstep(60, 110, y)) + 3
        - 2 * smoothstep(232, 288, pz) * smoothstep(55, 100, y) * (1 - front);        // the head of the gorge leans in a little; the V of sky over the lip stays open for the three balls of the tease
      o[0] = px + nx * back; o[1] = y; o[2] = pz + nz * back; o[3] = s; o[4] = y + back * 0.6; o[5] = nx; o[6] = nz;
      return o;
    }
    const wallTop = (w, s) => { const o = wallPoint(w, s, 100, [0, 0, 0, 0, 0, 0, 0]); return topY(o[0] + o[5] * 3, o[2] + o[6] * 3); };
    const BAND_GLSL = /* glsl */`
      // the zigzag pattern every cliff carries: returns 0 body, 1 accent (three rows), 2 pearl (one row), 3 slate row
      float bandOf(float cl, float rw){
        float zz = abs(mod(cl*0.5 + 600., 26.) - 13.), band = mod(rw - zz + 800., 17.);
        return mod(rw, 34.) < 1. ? 3. : (band < 3. ? 1. : (band < 4. ? 2. : 0.));
      }`;
    const bandOf = (cl, rw) => { const zz = Math.abs((((cl * 0.5 + 600) % 26) + 26) % 26 - 13), band = (((rw - zz + 800) % 17) + 17) % 17; return ((rw % 34) + 34) % 34 < 1 ? 3 : (band < 3 ? 1 : (band < 4 ? 2 : 0)); };
    const cliffFrag = /* glsl */`
      float front = AUX.x; float sd = AUX.y;
      PITCH = front > 1.5 ? 1.6 : (front > 0.5 ? 3. : 1.2); if (front > 2.5) DARK = 1.;   // the massif's top lies under impostor beads
      if (front < 0.5 && uv.y > 60.) { PITCH = 2.4; DARK = 1.; }                     // the upper gorge walls: 2.4 m beads (real ones lie on them)
      float farW = (1. - smoothstep(0.3, 0.7, front))*smoothstep(85., 150., length(vVP));   // far off the inner walls are one plain midnight
      vec2 pc = (floor(uv/41.) + 0.5)*41. + (vec2(hash2(floor(uv/41.)), hash2(floor(uv/41.) + 7.3)) - 0.5)*22.;
      vec2 pd = uv - pc; uv -= pd*exp(-dot(pd, pd)/(30.*PITCH))*0.4;                 // a pucker: tension pulled too tight
      float rw = floor(uv.y/PITCH), cl = floor(uv.x/PITCH + 0.5*mod(rw, 2.));
      float bd = bandOf(cl, rw);
      // Values are grouped: each wall is one calm plane, its zigzag in a tone close to its body. The buttress that
      // faces the moon (left) is slate with navy rows and one silver-lined row; the rest is midnight with navy rows. Up the gorge
      // both walls are the fall's dark flanks (a deeper blue in frost); the valley floor is a slate and navy carpet.
      float inner = 1. - smoothstep(0.3, 0.7, front), floorK = step(1.5, front)*step(front, 2.5);
      vec3 body = mix(uBlue, uDeep, inner), acc = uNavy;
      COLW = uSlate;
      if (sd > 0.) {                                                                 // the left side
        // (up the gorge it changes bead by bead to midnight, so the fall stands between dark walls)
        float inn = clamp(sd - 1., 0., 1.);
        vec2 fwc = fwidth(vRow); float pxl = PITCH/max(max(fwc.x, fwc.y), 1e-5);
        float sel = max(mix(inn, step(hash2(vec2(cl, rw)*1.31 + 2.7), inn), smoothstep(3., 6.5, pxl)), floorK);
        float thin = step(1.5, bd)*step(bd, 2.5);                                    // the one row of the zigzag that is silver-lined
        vec3 lb = mix(uSlate, mix(body, uSlate, floorK), sel), la = mix(mix(uNavy, uSilver, thin), acc, sel);
        COLA = bd > 0.5 ? la : lb; COLB = COLA; LINED = (1. - sel)*thin;
      } else {                                                                       // the right side: the gust turns it
        COLA = bd > 0.5 ? acc : body; COLB = uSilver;
        if (bd < 0.5) { TURN = clamp(gustAt(vWP)*1.6, 0., 1.)*(1. - smoothstep(55., 100., length(vVP))); LINED = TURN; } else COLB = COLA;   // (the turn shows on the walls beside us, never far off beside the fall)
      }
      COLA = mix(COLA, uDeep, farW); COLB = mix(COLB, uDeep, farW); LINED *= 1. - farW;`;
    const cliffMat = rowMaterial(style, { uniforms: wind, header: 'attribute vec2 aAux;', vertex: 'AUX = vec4(aAux, 0., 0.);', fragHeader: WIND_GLSL + BAND_GLSL, fragment: cliffFrag, side: THREE.DoubleSide });
    const fixed = collector('fixed-beads');
    for (const w of walls) {
      const nu = Math.round(w.L / 5), nv = 30, aux = new Float32Array((nu + 1) * (nv + 1) * 2), o7 = [0, 0, 0, 0, 0, 0, 0];
      // (the face's points are worked out a few rows at a time, each column's top once, so no step of the build holds the page)
      const tops = new Float32Array(nu + 1), wpre = new Float32Array((nu + 1) * (nv + 1) * 5);
      for (let i = 0; i <= nu; i++) tops[i] = wallTop(w, i / nu * w.L);
      await ctx.yield();
      for (let j = 0, q = 0; j <= nv; j++) {
        for (let i = 0; i <= nu; i++, q++) {
          const u = i / nu, v = j / nv, s = u * w.L, top = tops[i], over = Math.max(0, (v - 0.9) / 0.1), y = lerp(-4, top, Math.min(v / 0.9, 1) ** 0.85);
          wallPoint(w, s, y, o7);
          wpre[q * 5] = o7[0] + o7[5] * over * 7; wpre[q * 5 + 1] = y - over * over * 1.2; wpre[q * 5 + 2] = o7[2] + o7[6] * over * 7; wpre[q * 5 + 3] = o7[3]; wpre[q * 5 + 4] = o7[4] + over * 7;
        }
        if (j % 6 === 5) await ctx.yield();
      }
      let wq = 0;
      const geo = gridGeo(nu, nv, (u, v, o) => { for (let k = 0; k < 5; k++) o[k] = wpre[wq + k]; wq += 5; });
      for (let j = 0, q = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, q++) { aux[q * 2] = i / nu * w.L < w.sCorner ? 1 : 0; aux[q * 2 + 1] = w.sd > 0 ? 1 + smoothstep(w.sCorner - 6, w.sCorner + 8, i / nu * w.L) : w.sd; }
      geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2));
      if (w.sd > 0) { const ix = geo.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } geo.computeVertexNormals(); }
      const m = new THREE.Mesh(geo, cliffMat); m.name = 'cliff' + w.sd; scene.add(m);
      await ctx.yield();
      // boulder beads coping the cliff top so its silhouette is beads, 3 m on the buttress front, smaller up the gorge
      for (let s = 2; s < w.L; ) {
        const front = s < w.sCorner, r = front ? 1.55 : 0.95, k = Math.round(s);
        const top = wallTop(w, s); wallPoint(w, s, top, o7);
        const col = k % 11 === 3 ? 1 : (front && w.sd > 0 ? (k % 5 === 0 ? 2 : 1) : (k % 5 === 0 ? 8 : 0));      // (only the moonward buttress keeps a pale coping)
        fixed.add(o7[0], top + r * 0.55, o7[2], r, -o7[6], 0, o7[5], col, k % 7 === 0 && front ? 1 : 2, col === 2 ? 1 : 0, 0, front ? 0 : 1, 0, 0);
        s += r * 2.05 + (front ? 0 : 0.5);
      }
    }
    await ctx.yield();

    // ---- the massif's top: a sheet snapped to the cliff line, the gorge and the basin rim (rows run on over the edge) ----
    {
      // (fine enough to follow the land: where it was coarser it bridged the hollows and lay over the cobbles as a bare patch)
      const NX = 104, NZ = 96, X0 = -330, X1 = 330, Z0 = 128, Z1 = 800, bad = new Uint8Array((NX + 1) * (NZ + 1)), pre = new Float32Array((NX + 1) * (NZ + 1) * 3);
      for (let j = 0, q = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++, q++) {
          let x = lerp(X0, X1, i / NX), z = lerp(Z0, Z1, j / NZ), b = 0;
          const zf = zFront(Math.max(Math.abs(x), 23)) + 7;
          if (z < zf) { z = zf; b = 1; }
          if (z < 314 && Math.abs(x) < hw(z) + 8) { x = (x >= 0 ? 1 : -1) * (hw(z) + 8); b = 1; }
          const e = basinE(x, z);
          if (e < 1.05) { if (e < 0.05) { x = 63; z = 372; } else { x *= 1.05 / e; z = 372 + (z - 372) * 1.05 / e; } b = 1; }
          bad[q] = b; pre[q * 3] = x; pre[q * 3 + 1] = topY(x, z) - (b ? 0.8 : 1.1); pre[q * 3 + 2] = z;
        }
        await ctx.yield();
      }
      const geo = gridGeo(NX, NZ, (u, v, o) => {
        const q = Math.round(v * NZ) * (NX + 1) + Math.round(u * NX);
        o[0] = pre[q * 3]; o[1] = pre[q * 3 + 1]; o[2] = pre[q * 3 + 2]; o[3] = o[0]; o[4] = o[2];
      });
      await ctx.yield();
      const ix = geo.index.array, keep = [];
      for (let i = 0; i < ix.length; i += 6) { if (bad[ix[i]] && bad[ix[i + 1]] && bad[ix[i + 2]] && bad[ix[i + 5]]) continue; for (let k = 0; k < 6; k++) keep.push(ix[i + k]); }
      geo.setIndex(keep); geo.computeVertexNormals();
      const aux = new Float32Array((NX + 1) * (NZ + 1) * 2); for (let q = 0; q < aux.length; q += 2) { aux[q] = 3; aux[q + 1] = -1; }
      geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2));
      const m = new THREE.Mesh(geo, cliffMat); m.name = 'massif-top'; scene.add(m);
    }
    await ctx.yield();
    // ---- the valley floor: banks and hills, rows running with the river ----
    {
      const NX = 52, NZ = 42, aux = new Float32Array((NX + 1) * (NZ + 1) * 2);
      const geo = gridGeo(NX, NZ, (u, v, o) => {
        const t = u * 2 - 1, x = Math.sign(t) * Math.pow(Math.abs(t), 1.7) * 300, z = lerp(-170, 215, v), ax = Math.abs(x);
        o[0] = x; o[2] = z; o[1] = valleyY(x, z) - 1.6 * (1 - smoothstep(18.5, 22.5, ax)); o[3] = z; o[4] = x;
        const q = (Math.round(v * NZ) * (NX + 1) + Math.round(u * NX)) * 2; aux[q] = 2; aux[q + 1] = x > 0 ? 1 : -1;
      });
      geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 2));
      const m = new THREE.Mesh(geo, cliffMat); m.name = 'valley'; scene.add(m);
    }
    await ctx.yield();
    // ---- the lower river: the hero's bed carried on downstream, the same lanes of rolling beads ----
    const flowU = { uFlow: { value: 0 } };
    {
      const geo = gridGeo(22, 44, (u, v, o) => { o[0] = lerp(-22.5, 22.5, u); o[2] = lerp(202, -170, v); o[1] = riverY(o[0]); o[3] = 300 - o[2]; o[4] = -o[0]; });
      const mat = rowMaterial(style, { uniforms: flowU, side: THREE.DoubleSide, fragHeader: 'uniform float uFlow;', fragment: /* glsl */`
        PITCH = 1.4; ROLL = 1.; SHEAR = 0.7; SCROLL = uFlow*3.; COLA = uSlate; COLB = mix(uSlate, uBlue, 0.6); COLW = uNavy; LINED = 0.; BRICK = 0.; GLINT = 0.5;
        if (mod(floor(uv.y/PITCH), 5.) < 1.) { COLA = uNavy; COLB = uBlue; }` });
      const m = new THREE.Mesh(geo, mat); m.name = 'river-bed'; scene.add(m);
    }
    // loose pearls rolling on it in lanes (sheared: each lane has its own speed), the big rounds lagging as bed-load
    const RIV_LEN = 380, RIV_TOP = 214;
    {
      const lanes = 21, per = Math.round(250 * detail), n = lanes * per, a = new Float32Array(n * 4), r = vr.fork('river');
      for (let l = 0, q = 0; l < lanes; l++) for (let i = 0; i < per; i++, q++) {
        const big = r.chance(0.07);
        a[q * 4] = (l - (lanes - 1) / 2) * 1.5 + r.range(-0.15, 0.15); a[q * 4 + 1] = (i + r.range(0.1, 0.9)) / per; a[q * 4 + 2] = big ? r.range(0.85, 1.15) : r.range(0.52, 0.72); a[q * 4 + 3] = r();
      }
      const g = beadQuadGeometry(n); g.setAttribute('aL', new THREE.InstancedBufferAttribute(a, 4));
      const mat = beadMaterial(style, { uniforms: flowU, header: 'attribute vec4 aL; uniform float uFlow;', body: /* glsl */`
        float lane = floor(aL.x/1.5 + 10.5), big = step(0.8, aL.z);
        float sp = 3.*(1. + 0.5*(hash1(lane) - 0.5))*(1. - 0.55*big);
        float d = fract(aL.y + uFlow*sp/${RIV_LEN.toFixed(1)})*${RIV_LEN.toFixed(1)};       // metres travelled from the top
        float z = ${RIV_TOP.toFixed(1)} - d;
        R = aL.z*smoothstep(0., 14., d)*(1. - smoothstep(${(RIV_LEN - 20).toFixed(1)}, ${RIV_LEN.toFixed(1)}, d));
        float x = aL.x + sin(z*0.05 + lane)*0.25;
        C = vec3(x, 0.9*cos(clamp(x/17., -1.5, 1.5)) - 0.4 + 3.5*smoothstep(15., 24., abs(x)) + R*0.72 + 0.12*sin(uFlow*2.3 + aL.w*40.), z);
        float ang = d/max(aL.z, 0.2) + aL.w*6.283;
        AX = normalize(vec3(1., 0.25*(aL.w - 0.5), 0.3*(aL.w - 0.5))); E1 = normalize(cross(AX, vec3(0., cos(ang), sin(ang))));
        COLA = uPearl; COLB = aL.w < 0.3 ? uSilver : (aL.w > 0.955 ? uSlate : mix(uPearl, uSilver, 0.5)); LINED = aL.w < 0.3 ? 1. : 0.25; SEED = aL.w;
        // the river is strung in lanes as it leaves the fall: every third lane pearl, the two between slate and midnight
        // (one wrong bead here and there), so the floor is dark with white rows running to the fall's stroke
        float dl = step(0.5, mod(lane, 5.))*smoothstep(8., 40., d)*step(aL.w, 0.975);
        COLA = mix(COLA, mod(lane, 2.) < 0.5 ? uSlate : uBlue, dl); COLB = mix(COLB, mod(lane, 2.) < 0.5 ? mix(uSlate, uBlue, 0.5) : mix(uBlue, uSlate, 0.35), dl); LINED *= 1. - dl;
        if (big > 0.5) { KIND = aL.w > 0.6 ? 1. : 0.; COLA = KIND > 0.5 ? mix(uSilver, uGlint, 0.5) : uPearl; COLB = COLA; LINED = 0.25; }` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'river-beads'; scene.add(m);
    }
    await ctx.yield();
    // 3 m boulder beads edging both banks, in rows
    for (let sd = -1; sd <= 1; sd += 2) for (let k = 0; k < 2; k++) for (let z = -150 + k * 1.6; z < 199; z += 3.15) {
      const x = -sd * (19.5 + k * 3.3 + Math.sin((300 - z) * 0.11) * 1.2), big = 1.5 - k * 0.25, zi = Math.round(300 - z) + k;
      const col = zi % 9 === 0 ? (sd < 0 ? 2 : 1) : (k ? 8 : (sd < 0 ? 1 : 0));               // slate and navy on the moonward bank, midnight and navy on the other; one silver here and there
      fixed.add(x, riverY(x) + big * 0.7, z, big, 0.2 * sd, 0.1, 1, col, zi % 13 === 0 ? 1 : 0, col === 2 ? 1 : 0);
    }
    // near tier: real beads on the gorge walls' own lattice and pattern, where we pass within 25 m
    {
      const o7 = [0, 0, 0, 0, 0, 0, 0], P = 1.2, r = vr.fork('near');
      let cnt = 0, it = 0;
      for (const w of walls) for (let rw = 0; rw < 50; rw++) for (let cl = Math.ceil((w.sCorner + 3) / P); cl * P < w.L - 4; cl++) {
        if (++it % 300 === 0) await ctx.yield();
        const s = (cl + 0.5 - 0.5 * (rw % 2)) * P, tv = (rw + 0.5) * P;
        let y = tv - 2; wallPoint(w, s, y, o7); y += tv - o7[4]; wallPoint(w, s, y, o7); y += tv - o7[4]; wallPoint(w, s, y, o7);
        if (y < riverY(o7[0]) - 0.3) continue;
        const bd = bandOf(cl, rw), wrong = r() < 0.045;
        let col, lined = 0, turn = 0;
        // both gorge walls are the fall's dark flanks: midnight with the zigzag in navy, one slate bead wrong here and there
        col = wrong ? 1 : (bd === 0 ? 0 : 8); turn = w.sd < 0 && col === 0 ? 1 : 0;
        if (w.sd > 0 && hashI(cl * 1.31 + rw * 57.7) >= smoothstep(w.sCorner - 6, w.sCorner + 8, s)) { col = wrong ? 0 : (bd === 0 ? 1 : (bd === 2 ? 2 : 8)); lined = col === 2 ? 1 : 0; }   // the left wall is still slate where it turns in from the buttress
        fixed.add(o7[0] - o7[5] * 0.34, y, o7[2] - o7[6] * 0.34, P * 0.49, o7[6], 0, -o7[5], col, 0, lined, 0, 1, 0, turn);
        if (++cnt % 800 === 0) await ctx.yield();
      }
      // upper tier: above 60 m, where we never pass within 25 m, the same walls in real 2.4 m beads on their own
      // lattice and the same zigzag, to the top edge and over the coping (so no wall face is a flat fill on the climb)
      const P2 = 2.4;
      for (const w of walls) for (let rw = 25; rw < 62; rw++) for (let cl = Math.ceil((w.sCorner + 2) / P2); cl * P2 < w.L - 2; cl++) {
        if (++it % 200 === 0) await ctx.yield();
        const s = (cl + 0.5 - 0.5 * (rw % 2)) * P2, tv = (rw + 0.5) * P2, top = wallTop(w, s);
        wallPoint(w, s, top, o7);
        const tvTop = o7[4];
        let bx, by, bz;
        if (tv > tvTop) { const over = (tv - tvTop) / 7; if (over > 1.05) continue; bx = o7[0] + o7[5] * over * 7; by = top - over * over * 1.2 + 0.5; bz = o7[2] + o7[6] * over * 7; }
        else { let y = tv - 4; wallPoint(w, s, y, o7); y += tv - o7[4]; wallPoint(w, s, y, o7); y += tv - o7[4]; wallPoint(w, s, y, o7); bx = o7[0] - o7[5] * 0.6; by = y; bz = o7[2] - o7[6] * 0.6; }
        const bd = bandOf(cl, rw), wrong = r() < 0.045;
        let col, lined = 0, turn = 0;
        col = wrong ? 1 : (bd === 0 ? 0 : 8); turn = w.sd < 0 && col === 0 ? 1 : 0;
        fixed.add(bx, by, bz, P2 * 0.49, o7[6], 0, -o7[5], col, 0, lined, 0, 1, 0, turn);
        if (++cnt % 800 === 0) await ctx.yield();
      }
      // and the buttress fronts that face the entry, on their own 3 m lattice: big real beads, the first thing seen
      const PB = 3;
      for (const w of walls) for (let rw = 0; rw < 46; rw++) for (let cl = Math.ceil((w.sCorner - 165) / PB); cl * PB < w.sCorner; cl++) {
        if (++it % 200 === 0) await ctx.yield();
        const s2 = (cl + 0.5 - 0.5 * (rw % 2)) * PB, tv = (rw + 0.5) * PB;
        let y = tv - 2; wallPoint(w, s2, y, o7); y += tv - o7[4]; wallPoint(w, s2, y, o7); y += tv - o7[4]; wallPoint(w, s2, y, o7);
        if (y > wallTop(w, s2) - 1.2 || y < valleyY(o7[0], o7[2]) - 1) continue;
        const bd = bandOf(cl, rw), wrong = r() < 0.045;
        let col, lined = 0, turn = 0;
        // the moonward buttress: silver-lined, its zigzag the same silver unlined, a slate row and a slate wrong bead;
        // the other: midnight with navy rows
        if (w.sd > 0) { col = wrong ? 0 : (bd === 0 ? 1 : (bd === 2 ? 2 : 8)); lined = col === 2 ? 1 : 0; }
        else { col = wrong ? 1 : (bd === 0 ? 0 : 8); turn = col === 0 ? 1 : 0; }
        fixed.add(o7[0] - o7[5] * 0.8, y, o7[2] - o7[6] * 0.8, PB * 0.49, o7[6], 0, -o7[5], col, 0, lined, 0, 0, 0, turn);
        if (++cnt % 800 === 0) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- the sky: black velvet, crystals sewn on, a beadwork moon ----
    const skyHorizon = style.sceneColor(moonKind === 1 ? '#1C1846' : '#0E1838'), skyVelvet = style.sceneColor(palette[0]);
    {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.ShaderMaterial({
        uniforms: { uA: { value: skyVelvet }, uB: { value: skyHorizon }, uC: { value: U.uBlue.value }, uD: { value: U.uSlate.value }, uE: { value: U.uSilver.value }, uMz: { value: new THREE.Vector2(moonSee.x, moonSee.z).normalize() } }, side: THREE.BackSide, depthWrite: false, depthTest: false,
        vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(position*100. + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
        // the moon's glow is beadwork too: rows of round beads sewn on the velvet along the horizon, a pale row at the
        // skyline, then slate, midnight and deep blue rows thinning out into the black; highest under the moon
        fragmentShader: `uniform vec3 uA, uB, uC, uD, uE; uniform vec2 uMz; varying vec3 vD;
          float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
          void main(){ vec3 d = vD*inversesqrt(max(dot(vD, vD), 1e-6));
            float el = asin(clamp(d.y, -1., 1.))*57.2958, az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z)*57.2958;
            float hl = max(length(d.xz), 1e-4), toM = 0.5 + 0.5*dot(d.xz/hl, uMz), lift = 0.5 + 0.5*toM*toM;
            const float P = 1.25; float row = floor(el/P), e = (row + 0.5)*P;
            float cf = az*max(cos(e*0.0174533), 0.25)/P + 0.5*mod(row, 2.);
            vec2 f = vec2(fract(cf), fract(el/P))*2. - 1.; float r = length(f);
            float t = max(e, 0.)/lift + 2.2*(hs(vec2(floor(cf), row)) - 0.5);
            vec3 c = t < 5.5 ? mix(uD, uE, 0.45) : (t < 8.5 ? uD : (t < 15. ? uC : (t < 23. ? uB : uA)));
            if (hs(vec2(row, floor(cf))*1.7 + 3.) < 0.045) c = t < 15. ? uB : uC;                 // the wrong bead
            float px = P*0.0174533/max(fwidth(d.y), 1e-6);
            // (sewn by hand, not printed: the beads differ in size, and the higher rows are sewn ever more sparsely into the black)
            float sz = 0.6 + 0.28*hs(vec2(floor(cf), row)*2.3 + 1.7), gone = step(hs(vec2(floor(cf), row)*0.7 + 9.1), clamp((t - 10.)/28., 0., 0.5));
            float aa = 2.4/max(px, 1.), inside = (1. - smoothstep(sz - aa, sz, r))*(1. - gone);
            vec3 bead = c*(1. - 0.34*r*r);
            gl_FragColor = vec4(mix(mix(uA, c, 0.5*(1. - gone)), mix(uA, bead, inside), smoothstep(3., 6., px))*step(-9., e) + uA*(1. - step(-9., e)), 1.); }` }));
      dome.renderOrder = -3; dome.frustumCulled = false; dome.name = 'velvet'; scene.add(dome);
      // stars: four-point faceted crystals, never under 3 px, each held by two thread ticks; a slow breathing glint
      const NX = 44, n = 900 + NX, a = new Float32Array(n * 4), r = vr.fork('stars');
      for (let i = 0; i < 900; i++) {
        const y = Math.pow(r(), 0.75) * 0.97 + 0.02, th = r() * Math.PI * 2, s = Math.sqrt(1 - y * y);
        a[i * 4] = Math.cos(th) * s; a[i * 4 + 1] = y; a[i * 4 + 2] = Math.sin(th) * s; a[i * 4 + 3] = r();
      }
      // (round 6) and a drift of larger crystals sewn where the notch over the lip shows the sky from the river and the
      // gorge, so that slot is a window on the stars, never a blank black patch
      { const rx = vr.fork('notch-stars'); for (let i = 900; i < n; i++) { const az = rx.range(-6.5, 6.5) * DEG, el = (17 + 30 * Math.pow(rx(), 1.4)) * DEG; a[i * 4] = Math.sin(az) * Math.cos(el); a[i * 4 + 1] = Math.sin(el); a[i * 4 + 2] = Math.cos(az) * Math.cos(el); a[i * 4 + 3] = rx.range(0.45, 1); } }
      const g = beadQuadGeometry(n); g.setAttribute('aD', new THREE.InstancedBufferAttribute(a, 4));
      const starMat = new THREE.ShaderMaterial({ uniforms: U, depthWrite: false, transparent: true,
        vertexShader: /* glsl */`${STYLE_GLSL} attribute vec4 aD; varying vec2 vQ; varying vec2 vS;
          void main(){
            vec4 p = projectionMatrix*viewMatrix*vec4(aD.xyz*100. + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4;
            float px = (6. + 9.*aD.w*aD.w*aD.w)*max(uResY/450., 1.)*0.75 + 2.;      // the quad's half-size in pixels
            float ca = cos(aD.w*40.)*0.966 , sa = sin(aD.w*40.)*0.26;
            vec2 q = vec2(position.x*ca - position.y*sa, position.x*sa + position.y*ca);
            p.xy += q*px/uResY*2.*p.w*vec2(projectionMatrix[0][0]/projectionMatrix[1][1], 1.);
            vQ = position.xy; vS = vec2(aD.w, px);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */`${STYLE_GLSL} varying vec2 vQ; varying vec2 vS;
          void main(){
            vec2 a = abs(vQ)/0.66;
            float star = pow(a.x, 0.62) + pow(a.y, 0.62);                                // a four-point faceted crystal
            float aa = 1.5/max(vS.y*0.66, 1.);
            float inS = 1. - smoothstep(1. - aa, 1., star);
            vec2 d = vec2(vQ.x - vQ.y, vQ.x + vQ.y)*0.7071;                             // two thread ticks hold it to the velvet
            float tick = (1. - smoothstep(0.05, 0.05 + 1.2/max(vS.y, 1.), abs(d.x)))*step(0.2, abs(d.y))*(1. - step(0.62, abs(d.y)));
            float facet = (vQ.x > 0. ? 0.16 : -0.1) + (vQ.y > 0. ? 0.1 : -0.12) + (a.x > a.y ? 0.08 : -0.06);
            float br = 0.5 + 0.5*sin(uTime*(0.25 + 0.3*vS.x) + vS.x*90.);
            vec3 c = mix(uSilver, uGlint, 0.5 + 0.5*br)*(0.78 + facet);
            float core = 1. - smoothstep(0.0, 0.6, star);
            vec3 col = toScene(mix(uThread*0.55, c, inS))*(1. + core*br*uGlintGain*0.8);
            float al = max(inS, tick*0.8);
            if (al < 0.02) discard;
            gl_FragColor = vec4(col, al);
          }` });
      const stars = new THREE.Mesh(g, starMat); stars.renderOrder = -2; stars.frustumCulled = false; stars.name = 'stars'; scene.add(stars);
      // the moon: nine concentric rows of pearls, one slate bead wrong in the fourth row, one row puckered
      // (round 4: no great pearl. Distance makes beads bigger and fewer: six rows of separate pearls round one at the
      // centre (seven for the low rose moon, five for the small hard one), each some 14 to 20 px across at 800x450, strung along
      // their rows so no hole faces us; one slate bead wrong in the fourth row, the row inside the limb puckered, the
      // limb row silver-lined; round it the halo: a ring of seed beads and a broken one outside it)
      // (round 10: THE MOON 2.4 TIMES AS WIDE, on all three moon kinds, on every seed. MOON_GROW multiplies the three
      // angular sizes: the moon is 30, 38.4 and 20.4 degrees across its limb pearls (12.5, 16 and 8.5 before). The rows
      // are the same, so the pearls and the halo's seed beads grow with it, as the distance law has it. A number tuned
      // on the whole field, for no still.)
      const MOON_GROW = 2.4;
      const md = [], D = 6200, nR = [6, 7, 5][moonKind], ang = [12.5, 16, 8.5][moonKind] * MOON_GROW * DEG, pitch = Math.tan(ang / 2) * D / (nR + 0.5);
      const mu = new V3(0, 1, 0).addScaledVector(moonSee, -moonSee.y).normalize(), ms = new V3().crossVectors(mu, moonSee).normalize();
      for (let h = 0; h < 2; h++) { const rh = pitch * (nR + (h ? 3.6 : 2.0)), nh = Math.round(2 * Math.PI * rh / (pitch * (h ? 1.25 : 0.72))); for (let i = 0; i < nh; i++) { if (h && i % 8 > 4) continue; const th = (i + 0.5) / nh * Math.PI * 2; md.push(Math.cos(th) * rh, Math.sin(th) * rh, th, 4); } }
      for (let k = 0; k <= nR; k++) {
        const nb = k === 0 ? 1 : Math.round(2 * Math.PI * k * 0.99);
        for (let i = 0; i < nb; i++) {
          const th = (i + (k % 2) * 0.5) / nb * Math.PI * 2, rr = k * pitch * (k === nR - 1 ? 1 + 0.07 * Math.sin(th * 3 + 1) * (Math.sin(th) > 0.2 ? 1 : 0) : 1);
          md.push(Math.cos(th) * rr, Math.sin(th) * rr, th + k * 0.7, k === 4 && i === 5 ? 1 : (k === nR ? 2 : 0));
        }
      }
      const mg = beadQuadGeometry(md.length / 4); mg.setAttribute('aM', new THREE.InstancedBufferAttribute(new Float32Array(md), 4));
      const moonMat = beadMaterial(style, { uniforms: { uMD: { value: moonSee.clone().multiplyScalar(D) }, uMU: { value: mu }, uMS: { value: ms }, uMR: { value: pitch * 0.5 }, uMC: { value: new THREE.Color(moonKind === 1 ? '#F3D9D8' : moonKind === 2 ? '#E6F0FF' : palette[4]) } },
        header: 'attribute vec4 aM; uniform vec3 uMD, uMU, uMS, uMC; uniform float uMR;', body: /* glsl */`
          C = cameraPosition + uMD + uMS*aM.x + uMU*aM.y; R = uMR; SEED = fract(aM.z*3.7 + aM.x*0.01);
          float mth = atan(aM.y, abs(aM.x) < 1e-3 ? (aM.x < 0. ? -1e-3 : 1e-3) : aM.x);
          AX = normalize(-uMS*sin(mth) + uMU*cos(mth) + uMD*1e-6); E1 = normalize(uMD);
          COLA = aM.w > 1.5 ? mix(uMC, uSilver, 0.5) : (aM.w > 0.5 ? uSlate : uMC); COLB = COLA; LINED = aM.w > 1.5 ? 0.6 : 0.15; LEN = 0.;
          if (aM.w > 3.5) { R = uMR*0.56; COLA = mix(uSilver, uGlint, 0.5); COLB = COLA; LINED = 1.; }` });
      moonMat.depthWrite = false;
      const moon = new THREE.Mesh(mg, moonMat); moon.renderOrder = -1; moon.frustumCulled = false; moon.name = 'moon'; scene.add(moon);
    }
    await ctx.yield();

    // ---- strands: camera-facing ribbons hanging from a pivot, never under 1.5 px; a row of seed beads or bare thread ----
    const rib = { pos: [], r: [], t: [], idx: [], n: 0 };
    function addStrand(x, y, z, len, segs, ph, rad, mode, hang0 = 0, wid = 0.16, dx = 0, dz = 0) {
      const b = rib.n;
      for (let j = 0; j <= segs; j++) for (let sd = -1; sd <= 1; sd += 2) {
        const k = j / segs;
        rib.pos.push(x + dx * k, y - len * k, z + dz * k); rib.r.push(sd, hang0 + len * k, ph, rad); rib.t.push(mode, wid); rib.n++;
      }
      for (let j = 0; j < segs; j++) { const q = b + j * 2; rib.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    const ribbonMat = new THREE.ShaderMaterial({ uniforms: { ...U, ...wind }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`${STYLE_GLSL} ${WIND_GLSL}
        attribute vec4 aR; attribute vec2 aT; varying vec4 vR; varying vec3 vT; varying vec3 vVP;
        void main(){
          vec3 P = position; float hang = aR.y;
          if (aR.w > 6.5) { float lk = letK(position.xz, aR.z); P.y += hang*(1. - lk); hang *= lk; }
          vec3 P0 = position;
          if (aR.w < -6.5) { float rel = curtRel(aR.z); if (hang > rel) { P.y += hang - rel; hang = rel; } P0 = P; }
          if (hang > 0.) P += swayAt(P0, hang, aR.z, aR.w);
          vec4 mv = viewMatrix*vec4(P, 1.);
          float minW = 0.8*max(-mv.z, 0.05)/(projectionMatrix[1][1]*uResY*0.5);
          float w = max(aT.y, minW);
          mv.x += aR.x*w;
          vR = vec4(aR.x*w/aT.y, aR.y, aR.z, aT.y); vT = vec3(aT.x, w/aT.y, position.x > 0. ? 1. : 0.); vVP = mv.xyz;
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: /* glsl */`${STYLE_GLSL}
        varying vec4 vR; varying vec3 vT; varying vec3 vVP;
        void main(){
          vec3 V = normalize(-vVP), M = mat3(viewMatrix)*uMoon;
          float mode = vT.x, wid = vR.w;
          vec3 thread = uThread*(0.62 + 0.3*(1. - abs(vR.x)/max(vT.y, 1.)));
          // a thread held to its least width far off takes the tone of the bank behind it (no veil of hairlines)
          float cov = clamp(1./max(vT.y, 1.), 0.25, 1.);
          vec3 dim = vT.z > 0.5 ? mix(uSilver, uSlate, 0.3) : mix(uBlue, uSlate, 0.2);
          if (mode < -0.5) { gl_FragColor = vec4(toScene(thread), 1.); return; }       // the curtain's thread: waxed grey, never a veil
          if (mode < 0.5) { gl_FragColor = vec4(toScene(mix(dim, thread, cov)), 1.); return; }
          float pitch = wid*2.3, g = vR.y/pitch, id = floor(g);
          float px = pitch/max(fwidth(vR.y), 1e-5);
          vec2 f = vec2(vR.x, (fract(g)*2. - 1.)*1.12);
          float r2 = dot(f, f), sd = hash2(vec2(id, vR.z*91.));
          vec3 body = sd < 0.5 ? uSilver : (sd < 0.8 ? uPearl : (sd < 0.93 ? uBlue : uSlate));
          float lined = sd < 0.5 ? 1. : 0.;
          if (mode > 2.5) { body = sd < 0.62 ? uBlue : (sd < 0.84 ? uSlate : (sd < 0.95 ? uSilver : uPearl)); lined = sd >= 0.84 && sd < 0.95 ? 1. : 0.; }
          vec3 n = normalize(vec3(f.x, f.y, sqrt(max(1. - r2, 0.04))));
          vec4 cg = beadShade(body, lined, n, V, vec3(0., 1., 0.), M, sd);
          float aa = 2.4/max(px, 1.);
          float inside = 1. - smoothstep(1. - aa, 1., sqrt(r2));
          vec3 gap = abs(vR.x) < 0.3 ? thread : vec3(-1.);
          float k = smoothstep(3., 6., px);
          vec3 avg = mix(dim, mix(uThread*0.5, mode > 2.5 ? mix(uBlue, uSlate, 0.3) : mix(uSilver, uPearl, 0.4), 0.62), cov);
          if (k > 0.5 && inside < 0.5 && gap.x < 0.) discard;
          vec4 o = mix(vec4(avg, 0.), mix(vec4(max(gap, 0.), 0.), cg, inside), k);
          gl_FragColor = vec4(beadOut(o), 1.);
        }` });
    // ---- fringe willows: trunk and boughs of cylinder beads, thirty fringes of seed beads each, a bugle and a knot at the end ----
    const strung = collector('strung-beads');
    const trees = [];
    {
      const r = vr.fork('willows');
      // Eight trees. Six stand well back on the banks, three a side, where the entry sees each one whole against its
      // buttress: a trunk, a dome crown in one colour (midnight before the silver buttress, pearl before the blue one)
      // and a skirt of fringes, with bare wall between neighbours; the middle of the picture is left to the river, the
      // fall and the sky. Two tall ones stand close to the start, outside the entry's frame, and reach one long bough
      // high over the river: its pale fringes are let down as we come and part round the wings.
      const STAGE = [[126, 44.5, 6.2, 21], [100, 57, 6.5, 22], [80, 68.5, 6.5, 22.5]];
      for (let i = 0; i < 8; i++) {
        const sd = i % 2 ? 1 : -1, st = i < 6 ? STAGE[i >> 1] : null;
        const z = st ? st[0] + r.range(-2, 2) + (sd > 0 ? 3 : 0) : 103 + (sd > 0 ? 3.5 : 0), x = sd * (st ? st[1] + r.range(-1.5, 1.5) : 44);
        trees.push({ x, z, sd, h: st ? st[3] * r.range(0.95, 1.06) : 31, ph: r(), reach: !st, crown: st ? st[2] : 5, nf: Math.max(3, Math.round((st ? 5 : 3) * Math.min(density, 1.2))) });
      }
      for (const t of trees) {
        const gy = valleyY(t.x, t.z), lean = -t.sd * 0.1, nb = t.reach ? 6 : 9, fat = 1.3;
        const dark = t.sd > 0, body = dark ? 0 : 1;
        let yTop = 0;
        for (let k = 0, y = 0; y < t.h * 0.86; k++) {                                   // trunk: tube-stitched cylinder beads
          const rr = lerp(0.95, 0.5, y / t.h) * fat, col = dark ? (k % 4 === 3 ? 2 : (k % 2 ? 0 : 1)) : (k % 4 === 3 ? 2 : (k % 2 ? 1 : 8));
          strung.add(t.x + lean * y, gy + y + rr, t.z, rr, lean, 1, 0.05, col, 2, col === 2 ? 1 : 0); y += rr * 2.5; yTop = y;
        }
        // where the boughs spring: two rings of big beads and a crystal
        for (let q = 0; q < 11; q++) {
          const ring = q < 6 ? 0 : 1, a = q * (ring ? 1.257 : 1.047) + t.ph * 6, rad = (ring ? 0.95 : 1.55) * fat, yy = gy + yTop + (ring ? 1.5 : 0.2) * fat;
          strung.add(t.x + lean * yTop + Math.cos(a) * rad, yy, t.z + Math.sin(a) * rad, (ring ? 0.72 : 0.85) * fat, -Math.sin(a), 0.2, Math.cos(a), q % 4 === 1 ? 2 : body, 2, q % 4 === 1 ? 1 : 0);
        }
        strung.add(t.x + lean * yTop, gy + yTop + 4.2 * fat, t.z, 0.8 * fat, 0, 1, 0, 6, 1, 0);
        // the head: a dome of bead rows in the tree's one colour, its rim row a shade apart, one wrong bead here and there
        {
          const Rc = t.crown * 0.95, rbd = 0.72, topC = gy + yTop + 3.6 * fat, cx0 = t.x + lean * yTop;
          for (let ring = 1, rho = rbd * 1.5; rho <= Rc; ring++, rho += rbd * 1.75) {
            const nbd = Math.max(5, Math.round(2 * Math.PI * rho / (rbd * 2.02))), yy = topC - 0.75 * Rc * (rho / Rc) ** 2, rim = rho + rbd * 1.75 > Rc;
            for (let q = 0; q < nbd; q++) {
              const a = (q + 0.5 * (ring % 2)) / nbd * Math.PI * 2 + t.ph * 6, wrong = hashI(q * 3.3 + ring * 17 + t.ph * 99) < 0.045;
              const col = wrong ? (dark ? 1 : 0) : (rim ? (dark ? 1 : 2) : body);
              strung.add(cx0 + Math.cos(a) * rho, yy, t.z + Math.sin(a) * rho, rbd, -Math.sin(a), 0, Math.cos(a), col, 0, col === 2 ? 1 : 0);
            }
          }
        }
        const bIn = t.sd > 0 ? 3 : 0;                                                  // the bough that points at the river
        for (let b = 0; b < nb; b++) {                                                 // boughs arching out and down
          const far = t.reach && b === bIn, a = far ? (t.sd > 0 ? Math.PI : 0) : (b + r.range(-0.2, 0.2)) / nb * Math.PI * 2;
          const L = far ? Math.abs(t.x) - 0.1 * (yTop + 0.6) - 5.6 : t.crown * r.range(0.86, 1.04);
          const y0 = gy + (far ? yTop + 0.6 : t.h * r.range(0.74, 0.84)), x0 = t.x + lean * (y0 - gy), nf = far ? 6 : t.nf;
          const at = (k, o) => { o[0] = x0 + Math.cos(a) * L * k; o[2] = t.z + Math.sin(a) * L * k; o[1] = y0 + L * (0.42 * k - 0.36 * k * k) + t.h * 0.1 * k; return o; };
          const o = [0, 0, 0], o2 = [0, 0, 0], br = 1.35;
          for (let k = 0.08; k < 1; k += 0.9 * br / Math.max(4, L)) { at(k, o); at(k + 0.02, o2); const c = Math.round(k * 20) % 5 === 0 ? (dark ? 1 : 2) : body; strung.add(o[0], o[1], o[2], lerp(0.45, 0.26, k) * br, o2[0] - o[0], o2[1] - o[1], o2[2] - o[2], c, 2, c === 2 ? 1 : 0); }
          for (let f = 0; f < nf; f++) {
            // the long bough carries its fringes at its tip only, to either side of the path
            const kf = far ? 1 - f * 0.036 : (f + 0.6 + r.range(-0.2, 0.2)) / nf;
            at(kf, o);
            const ph = r(), end = far ? riverY(o[0]) + r.range(1.4, 3.6) : Math.max(valleyY(o[0], o[2]) + 1.2, gy - 1 + r.range(1.5, 6));
            const len = far ? o[1] - end : Math.min(lerp(4.5, 12.5, kf) * r.range(0.85, 1.12), o[1] - end);
            if (len < 4) continue;
            if (far) {                    // pale seed beads on grey thread, a bugle and a knot; rad 6.6 marks a fringe that is let down (see letK)
              addStrand(o[0], o[1], o[2], len, 9, ph, 6.6, 0, 0, 0.05);
              const pitch = 0.54, nbd = Math.floor((len - 1.2) / pitch);
              for (let q = 1; q < nbd; q++) { const h = hashI(q * 7 + Math.floor(ph * 977)), col = h < 0.5 ? 2 : h < 0.8 ? 3 : h < 0.93 ? 0 : 1; strung.add(o[0], o[1] - q * pitch, o[2], 0.26, 0, 1, 0, col, 0, col === 2 ? 1 : 0, q * pitch, ph, 6.6); }
              strung.add(o[0], o[1] - len + 0.6, o[2], 0.2, 0, 1, 0, 2, 3, 1, len - 0.6, ph, 6.6);
              strung.add(o[0], o[1] - len - 0.3, o[2], f % 2 ? 0.17 : 0.27, 0, 1, 0, f % 2 ? 5 : 4, 0, 0, len, ph, 6.6);      // the knot (round 6: every other one a coral seed, the warm accent of the whole flight)
            } else {                      // the skirt: big seed beads in the tree's colour, so it reads as one hanging mass from the entry
              addStrand(o[0], o[1], o[2], len, 5, ph, 4.6, 0, 0, 0.06);
              const pitch = 0.86, nbd = Math.floor((len - 0.8) / pitch);
              for (let q = 1; q < nbd; q++) { const h = hashI(q * 7 + Math.floor(ph * 977)), col = h < 0.8 ? body : h < 0.92 ? (dark ? 1 : 8) : (dark ? 8 : 2); strung.add(o[0], o[1] - q * pitch, o[2], 0.4, 0, 1, 0, col, 0, col === 2 ? 1 : 0, q * pitch, ph, 4.6); }
              strung.add(o[0], o[1] - len + 0.5, o[2], 0.28, 0, 1, 0, dark ? 1 : 2, 3, dark ? 0 : 1, len - 0.5, ph, 4.6);
              if (f % 3 === 1) strung.add(o[0], o[1] - len - 0.45, o[2], 0.36, 0, 1, 0, 4, 0, 0, len, ph, 4.6);      // a coral seed under every third bugle: the skirt's hem is dotted warm
            }
          }
        }
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- the bead curtain at the gorge mouth: twenty strands of bugles on a thread slung between the buttresses ----
    const threadGeos = [];
    {
      const slung = (x) => 67 + 8 * (x / 27) ** 2 + 0.5 * Math.sin(x * 0.4 + lay.curt), pts2 = [];
      for (let x = -30; x <= 30; x += 3) pts2.push(new V3(x, slung(x), 150 + 0.02 * x * x * 0.2));
      threadGeos.push(threadTubeGeometry(pts2, 0.16, 5, false, 0));
      // Ten strands a side hang plumb from the slung thread, 1.35 m apart, the innermost 7.6 m from the path: bugles
      // 3.4 m long, silver-lined and midnight by turns, a pearl or slate round between each pair, grey thread showing
      // in every gap, a crystal weight at the end. Far off the curtain is rolled up to the slung thread (only the row of
      // weights shows); it is let down as we come (curtRel), hangs the height of the frame at the gorge mouth, and its
      // inner strands swing out from the moth and clack back behind.
      const dk = frost ? 7 : 0;                                                            // in frost the dark bugles are jet, the colour of the sky
      for (let sd = -1; sd <= 1; sd += 2) for (let i = 0; i < 10; i++) {
        const x = sd * (7.6 + i * 1.35), y0 = slung(x), ph = hashI(i * 3.1 + sd + lay.curt) * 0.35 + i * 0.065;
        const yb = riverY(x) + (Math.abs(x) > 16.4 ? 3.7 : 1.5) + 1.4 * hashI(i + sd * 5 + lay.curt), len = y0 - yb, zc = 150 + 0.004 * x * x;
        addStrand(x, y0, zc, len, 14, ph, -9.0, -1, 0, 0.1);
        strung.add(x, y0, zc, 0.42, 1, 0, 0, 3, 0, 0);                                    // the knot on the slung thread
        for (let d = 2.5, k = 0; d < len - 2.4; k++, d += 2.6) {
          const bug = k % 2 === 0, wrong = hashI(k * 5.3 + i * 17.1 + sd) < 0.045;
          let col = bug ? ((k % 4 === 0) !== wrong ? 2 : dk) : (k % 4 === 1 ? 3 : 1);
          strung.add(x, y0 - d, zc, bug ? 0.42 : 0.52, 0, 1, 0, col, bug ? 3 : 0, col === 2 ? 1 : 0, d, ph, -9.0, 0);
        }
        strung.add(x, y0 - len, zc, 0.8, 0, 1, 0, i % 3 === 0 ? 3 : (i % 3 === 1 ? 4 : 6), i % 3 === 2 ? 1 : 0, 0, len, ph, -9.0, 1);   // the weight: pearl, coral and crystal by turns
      }
    }
    await ctx.yield();
    // ---- bugle reeds on wires along the banks, nodding; coral rosettes on the banks and the ledges of the gorge ----
    {
      const r = vr.fork('reeds'), nR = Math.round(1300 * detail * Math.min(density, 1.15));
      for (let i = 0; i < nR; i++) {
        if (i % 250 === 249) await ctx.yield();
        const sd = r.chance(0.5) ? 1 : -1, z = r.range(-70, 204), clump = N.n2(z * 0.06 + sd * 20, lay.bank), x = sd * (20.8 + Math.abs(r.gauss()) * 3.2 + (clump < -0.1 ? 14 * r() : 0));
        const gy = valleyY(x, z), h = r.range(2.2, 3.6), ph = r();
        if (z > 148 && Math.abs(x) > hw(z) + 1.5) continue;
        if (z > 36 && hashI(i * 1.37 + 0.5) < 0.93 * smoothstep(36, 96, z)) continue;       // from the entry the far banks are bare: reeds are for the near river
        addStrand(x, gy + h, z, h, 2, ph, 3.4, 0, 0.3, 0.03);
        const c = r.chance(sd < 0 ? 0.7 : 0.12) ? 0 : 2;
        strung.add(x, gy + h * 0.52, z, 0.105, 0, 1, 0, c, 3, c === 2 ? 1 : 0, h * 0.5, ph, 3.4);
        strung.add(x, gy + h * 0.52 + 0.9, z, 0.105, 0, 1, 0, r.chance(0.2) ? 1 : 2, 3, 1, h * 0.75, ph, 3.4);
        strung.add(x, gy + h + 0.1, z, 0.13, 0, 1, 0, i % 4 ? 1 : 3, 0, 0, h, ph, 3.4);
      }
      await ctx.yield();
      const nF = Math.round(300 * density * (0.7 + 0.3 * detail)), o7 = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < nF; i++) {
        if (i % 60 === 59) await ctx.yield();
        let cx, cy, cz, nx = 0, ny = 1, nz = 0;
        const kind = i % 3, ph = r();
        if (kind < 2) { const sd = r.chance(0.5) ? 1 : -1; cz = r.range(-40, 146); cx = sd * (i % 2 ? 21.5 + 40 * r() * r() : 30 + 75 * r()); cy = valleyY(cx, cz) + r.range(1.0, 1.9); nx = -sd * 0.55; nz = -0.5; ny = 0.67; }
        else { const w = walls[i % 2 ^ (r.chance(0.5) ? 1 : 0)], s = r.range(w.sCorner - 40, w.L - 6), y = r.chance(0.6) ? 31.6 : 67; wallPoint(w, s, y, o7); cx = o7[0] - o7[5] * 0.9; cy = y + r.range(0.6, 1.4); cz = o7[2] - o7[6] * 0.9; nx = -o7[5] * 0.8; nz = -o7[6] * 0.8; ny = 0.6; }
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const e1 = new V3(-nz, 0, nx).normalize(), e2 = new V3().crossVectors(new V3(nx, ny, nz), e1), big = kind < 2 ? 1 : 1.5;
        const frad = kind < 2 ? 3.4 : 3.3;                                             // (3.3 marks a ledge flower: nothing far off, so the far walls stay plain)
        addStrand(cx, cy, cz, kind < 2 ? cy - valleyY(cx, cz) : 1.2, 1, ph, 3.4, 0, 0, 0.03);
        strung.add(cx, cy, cz, 0.15 * big, nx, ny, nz, 3, 0, 0, 0.6, ph, frad);
        for (let p = 0; p < 5; p++) for (let b = 0; b < 6; b++) {
          const a = p / 5 * Math.PI * 2 + ph * 6, t = (b + 0.5) / 6 * Math.PI * 2, rad = (0.42 - 0.34 * Math.cos(t)) * big, tan = 0.21 * Math.sin(t) * big, lift = 0.18 * (1 - Math.cos(t)) * big;
          const px = e1.x * (Math.cos(a) * rad - Math.sin(a) * tan) + e2.x * (Math.sin(a) * rad + Math.cos(a) * tan) + nx * lift;
          const py = e1.y * (Math.cos(a) * rad - Math.sin(a) * tan) + e2.y * (Math.sin(a) * rad + Math.cos(a) * tan) + ny * lift;
          const pz = e1.z * (Math.cos(a) * rad - Math.sin(a) * tan) + e2.z * (Math.sin(a) * rad + Math.cos(a) * tan) + nz * lift;
          strung.add(cx + px, cy + py, cz + pz, 0.1 * big, -py, px, pz * 0.5 + 0.01, (i * 5 + p) % 23 === 0 ? 3 : 4, 0, 0, 0.6 + rad * 1.6, ph, frad);
        }
      }
    }
    await ctx.yield();
    // ---- bead fish: strings of seven graded clear beads, leaping upstream out of the rolling beads in low arcs ----
    {
      const nFish = Math.round((cast === 1 ? 220 : 60) * (0.7 + 0.3 * detail)), a = new Float32Array(nFish * 7 * 4), r = vr.fork('fish');
      for (let i = 0; i < nFish; i++) {
        const x = (r.chance(0.5) ? 1 : -1) * r.range(2.5, 13), z = r.range(4, 226), ph = r();
        for (let b = 0; b < 7; b++) { const q = (i * 7 + b) * 4; a[q] = x; a[q + 1] = z; a[q + 2] = ph; a[q + 3] = b; }
      }
      const g = beadQuadGeometry(nFish * 7); g.setAttribute('aF', new THREE.InstancedBufferAttribute(a, 4));
      const mat = beadMaterial(style, { header: 'attribute vec4 aF;', body: /* glsl */`
        float T = 2.6 + 1.6*fract(aF.z*7.31);
        float tt = uTime/T + aF.z - aF.w*0.42/(9.5*1.05);
        float cyc = floor(tt), ph = fract(tt)*T/1.05;                  // the leap lasts 1.05 s of each period
        float h1 = hash1(cyc*1.7 + aF.z*31.), h2 = hash1(cyc*2.9 + aF.z*57.);
        float up = clamp(ph, 0., 1.);
        float x = aF.x + (h1 - 0.5)*5., z = aF.y + h2*26. + up*9.5;
        float arc = 4.*up*(1. - up);
        float ry = 0.9*cos(clamp(x/17., -1.5, 1.5)) - 0.4;
        C = vec3(x + sin(up*9. + aF.w*0.8)*0.22, ry + 0.2 + arc*(2.1 + 1.3*h1) - 0.5*(1. - arc), z);
        R = mix(0.36, 0.13, aF.w/6.)*smoothstep(0., 0.06, up)*(1. - smoothstep(0.94, 1., up));
        AX = normalize(vec3(0.1, (1. - 2.*up)*0.9, 1.)); E1 = normalize(cross(AX, vec3(1., 0.2, 0.)));
        COLA = aF.w < 0.5 ? uPearl : mix(uSilver, uGlint, 0.6); COLB = aF.w < 0.5 ? uPearl : uSilver; LINED = 1.; SEED = fract(aF.z*13. + aF.w*0.17);
        KIND = aF.w < 0.5 ? 1. : 0.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'bead-fish'; scene.add(m);
    }
    await ctx.yield();

    const hfF = [], hfG = [], hfR = vr.fork('highfish');
    // ---- and their kin above the fall: big bead fish leaping out of the heap toward the lip, and out of the massif's
    // cobbles beside the strand (in the fish-only cast, shoals of them all the way to the ring; otherwise a few at the
    // crest). Each is seven graded clear beads; they are sized for the distance they are seen at. ----
    {
      const r = hfR, want = Math.round((cast === 1 ? 110 : 20) * (0.7 + 0.3 * detail)), F = hfF, G = hfG, pp = new V3(), tg = new V3();
      for (let i = 0, tries = 0; i < want && tries < want * 14; tries++) {
        if (tries % 50 === 49) await ctx.yield();
        const uu = cast === 1 ? lerp(uLip - 0.01, 1.3, r()) : lerp(uLip - 0.01, uCrestEnd + 0.06, r());
        path.pointAt(Math.min(uu, 1), pp); path.pointAt(Math.min(uu, 1) - 0.06, tg).sub(pp).negate();
        const sdL = r.chance(0.5) ? 1 : -1, off = 20 + (cast === 1 ? 250 : 60) * Math.pow(r(), 1.3), hl = Math.hypot(tg.x, tg.z) || 1, ov = Math.max(uu - 1, 0) * 900;
        const x = pp.x + sdL * tg.z / hl * off + tg.x / hl * ov, z = pp.z - sdL * tg.x / hl * off + tg.z / hl * ov, e = basinE(x, z), ph = r(), hj = r(), S = r.range(0.85, 1.3);
        if (Math.hypot(x - pinF.x, z - pinF.z) < 34 || Math.hypot(x - snagTip.x, z - snagTip.z) < 30 || (e > 0.86 && e < 1.14) || z < 306 || Math.abs(x) > 300 || z > 770) continue;
        const inB = e < 0.86, y0 = inB ? 96.5 : topY(x, z) + 0.6;
        // heading: in the basin toward the lip; on the massif along our course, slanting in toward the strand
        const hdg = inB ? Math.atan2(0 - x * 0.6, 300 - z) + (hj - 0.5) * 0.5 : Math.atan2(tg.x, tg.z) + (hj - 0.5) * 1.2 - sdL * 0.4;
        const x1 = x + Math.sin(hdg) * 24, z1 = z + Math.cos(hdg) * 24, e1 = basinE(x1, z1);
        if (!inB && e1 < 1.14) continue;
        const y1 = inB ? 96.5 : topY(x1, z1) + 0.6;
        for (let b = 0; b < 7; b++) { F.push(x, y0, z, ph); G.push(b, hdg, S, clamp(y1 - y0, -6, 6)); }
        i++;
      }
    }
    await ctx.yield();

    // ---- coral moths (or bugle-bodied dragonflies): wire and bead, two looped wings a side ----
    const mothU = { uCompC: { value: new V3(0, 20, 250) }, uComp: { value: 0 }, uClimb: { value: 0 }, uFishU: { value: new V3(0, 0.891, 0.454) }, uDrag: { value: cast === 2 ? 1 : 0 },
      uRingC: { value: ringC.clone() }, uRingK: { value: 0 }, uRingE: { value: 0 }, uFishTop: { value: 2 },
      // (round 7) the two great ones that fly with us: their centres, our heading and the eye's right (set every frame)
      uGreatA: { value: new V3(0, -999, 0) }, uGreatB: { value: new V3(0, -999, 0) }, uGreatF: { value: new V3(0, 0, 1) }, uGreatR: { value: new V3(1, 0, 0) },
      // the lingering place: the three lowest balls, the tail and the falling ball are kept clear (uEndC, eased by uEndK)
      uNeck: { value: Array.from({ length: 12 }, (_, i) => strandW(sTop + 6 + (SLEN - sTop - 14) * i / 11)) }, uNeckK: { value: 0 },
      uEndC: { value: new V3().lerpVectors(tailTip, dropFrom, 0.4) }, uEndS: { value: new V3(1, 0, 0) }, uEndK: { value: 0 } };
    { const p = path.pointAt(uDropBeat, new V3()), c = mothU.uEndC.value, dx = c.x - p.x, dz = c.z - p.z, l = Math.hypot(dx, dz) || 1; mothU.uEndS.value.set(dz / l, 0, -dx / l); }
    // (round 6) on the last climb the ring is seen whole: every creature keeps to its own side of the line from the eye
    // to the ring, out of the middle third of the frame (it parts sideways as we turn toward the clasp), and no bead
    // of any creature is drawn larger than 6% of the frame's height
    const RING_GLSL = /* glsl */`
      uniform vec3 uRingC; uniform float uRingK, uRingE, uFishTop;
      // (round 7) under the necklace the leaping fish keep to the land: the top of a leap stays under uFishTop (the frame's
      // height in clip units; 2 = no limit), so no arc crosses the necklace, the horns or the ring from the lingering place
      float topScale(vec3 base, vec3 apex){
        vec4 a = projectionMatrix*viewMatrix*vec4(base, 1.), b = projectionMatrix*viewMatrix*vec4(apex, 1.);
        float ya = a.y/max(a.w, 0.1), yb = b.y/max(b.w, 0.1);
        return (a.w > 0.1 && b.w > 0.1) ? clamp((uFishTop - ya)/max(yb - ya, 1e-3), 0., 1.) : 1.;
      }
      vec3 ringPart(vec3 p, float sg, float hw){
        vec3 dR = uRingC - cameraPosition; float LR = length(dR); vec3 aR = dR/max(LR, 1e-3);
        vec3 sR = vec3(aR.z, 0., -aR.x); sR *= inversesqrt(max(dot(sR, sR), 1e-4));
        vec3 d = p - cameraPosition; float al = dot(d, aR), sx = dot(d, sR);
        float need = 0.37*max(al, 0.) + hw;
        float k = uRingK*smoothstep(-2., 6., al)*(1. - smoothstep(LR + 30., LR + 80., al));
        return p + sR*(sg*max(sg*sx, need) - sx)*k;
      }
      // (round 7) under the necklace the hero is seen whole. Three rules, each a size (1 = as it is, 0 = gone) for a whole
      // creature from where its body is: it grows small and is gone as it comes before (a) the dangling end: the three lowest
      // balls, the frayed tail and the ball that falls hang in one upright line, kept clear a ball's width to either side
      // (uEndK); (b) the necklace itself, a corridor a ball and a half wide along twelve places of the sag, while the ball
      // leaves, falls and bursts (uNeckK); (c) the ring, a ring's width to either side of the line from the eye to it, from
      // the lingering place until the last climb, where ringPart() takes over (uRingE). Nothing is pushed: no creature piles
      // up at an edge or jumps a side.
      uniform vec3 uEndC, uEndS, uNeck[12]; uniform float uEndK, uNeckK;
      float heroKeep(vec3 p, float hw){
        float f = 1.;
        vec2 dA = uEndC.xz - cameraPosition.xz; float LT = max(length(dA), 1.); vec2 aT = dA/LT;
        vec2 d2 = p.xz - cameraPosition.xz; float al = dot(d2, aT), sx = dot(d2, vec2(aT.y, -aT.x));
        float need = (12.5/max(LT, 20.))*max(al, 0.) + hw;
        float k = uEndK*smoothstep(-2., 6., al)*(1. - smoothstep(LT + 45., LT + 90., al))*(1. - smoothstep(uEndC.y + 36., uEndC.y + 48., p.y));
        f = min(f, 1. - k*(1. - smoothstep(need*0.8, need*1.15, abs(sx))));
        vec3 d = p - cameraPosition;
        if (uNeckK > 0.) for (int i = 0; i < 12; i++) {
          vec3 a = uNeck[i] - cameraPosition; float L = max(length(a), 1.); a /= L;
          float an = dot(d, a), ll = length(d - a*an), nd = (11./L)*max(an, 0.) + hw;
          f = min(f, 1. - uNeckK*smoothstep(0., 6., an)*(1. - smoothstep(L + 40., L + 80., an))*(1. - smoothstep(nd*0.8, nd*1.15, ll)));
        }
        vec3 aR = uRingC - cameraPosition; float LR = max(length(aR), 1.); aR /= LR;
        float ar = dot(d, aR), lr = length(d - aR*ar), nr = 0.11*max(ar, 0.) + hw;
        f = min(f, 1. - uRingE*smoothstep(0., 6., ar)*(1. - smoothstep(LR + 30., LR + 80., ar))*(1. - smoothstep(nr*0.8, nr*1.15, lr)));
        return f;
      }
      float beadCap(vec3 c, float r, float k){ return min(r, k*max(-(viewMatrix*vec4(c, 1.)).z, 0.05)); }`;      // k 0.03: 25 px across at 800x450
    {
      const r = vr.fork('moths'), nM = cast === 1 ? 0 : Math.round(110 * detail * density), nC = 10, A4 = [], B4 = [], C2 = [];
      const tailMid = new V3().lerpVectors(tailTip, dropFrom, 0.4); let nTail = 0;
      const sR0 = new V3(ringA.z, 0, -ringA.x).normalize(), DR = cast === 2 ? 1 : 0;
      const one = (cx, cy, cz, rad, mode, size, drag = DR, o = null) => {
        const ph0 = r(), ph = o ? o.ph : ph0, sp = r.range(0.25, 0.6) * (r.chance(0.5) ? 1 : -1) * (5 / Math.max(rad, 2.5));
        const sgn = o ? o.sgn : mode ? (cx > 0 ? 1 : -1) : ((cx - ringC.x) * sR0.x + (cz - ringC.z) * sR0.z >= 0 ? 1 : -1);      // its own side of the ring's axis
        for (let b = 0; b < 4; b++) { A4.push(cx, cy, cz, rad); B4.push(ph, sp, 4, b); C2.push(mode, size, sgn, drag); }
        // each wing is a closed loop of sixteen touching seed beads (the wire is hidden under them, as on the mount)
        for (let w = 0; w < 4; w++) for (let b = 0; b < 16; b++) { A4.push(cx, cy, cz, rad); B4.push(ph, sp, w, (b + 0.5) / 16); C2.push(mode, size, sgn, drag); }
      };
      for (let i = 0; i < nM; i++) {
        const k = i % 10;
        // few and readable, not a red haze: dragonflies keep to the reeds on the banks, moths to the willow crowns; the
        // rest circle the dangling end, a handful haunt the gorge walls, and the others fly beside the strand
        if (cast === 2 && k < 5) one((r.chance(0.5) ? 1 : -1) * r.range(17.5, 27), r.range(3.5, 8), r.range(-10, 150), r.range(2.5, 5), 0, r.range(1.1, 1.6));
        else if (cast !== 2 && k < 2 && trees.length) { const t = trees[Math.floor(i / 10 + k) % 6]; one(t.x - t.sd * r.range(0, 12), valleyY(t.x, t.z) + t.h * r.range(0.45, 1.05), t.z + r.range(-5, 5), r.range(4, 10), 0, r.range(0.9, 1.4)); }
        else if (k < (cast === 2 ? 7 : 4)) {
          // round the dangling end, out of the entry's view through the notch. (round 7) They ring it: three to each side, each
          // beating up and down a tall loop that stays a ball's width and more clear of the hanging balls, the tail and the
          // ball that falls (mode 3: the loop lies in the upright plane that faces the lingering eye)
          if (nTail++ < 6) { const jx = r.range(-6, 12), jy = r.range(-11, 17), jz = r.range(-6, 8), rd = r.range(7, 12), sz = r.range(2.0, 2.6);
            one(tailMid.x, tailMid.y + 6 + jy * 0.2, tailMid.z, 13 + rd * 0.5, 3, sz, DR, { ph: ((nTail - 1) >> 1) / 3 + (jx + 6) / 18 * 0.2, sgn: nTail % 2 ? 1 : -1 }); void jz; }
          else r.range(0, 1); }
        else if (k < (cast === 2 ? 8 : 5)) one((r.chance(0.5) ? 1 : -1) * r.range(12, 16), r.range(8, 30), r.range(150, 240), r.range(2.5, 4.5), 0, r.range(0.9, 1.4));   // in the gorge, by the walls: the fall's stroke stays clear
        else { const p = strandW(sTop + r.range(26, SLEN - sTop - 78)), o = r.range(10, 26); if (i % 4 === 0) one(p.x - sideL.x * o, p.y + r.range(2, 15), p.z - sideL.z * o, r.range(4.5, 8), 0, r.range(2.0, 2.5)); }   // beyond the strand (its far side), out in the sky: never between us and the ring
      }
      // (round 4) the night half is never empty stars: big moths (or dragonflies) all the way beside the strand to the
      // ring, on both sides of our course (every sixth passes close, each bead readable; none before the ring's
      // opening), and a swarm crossing the moon as seen from under the necklace
      // (round 6) THE NIGHT SKY IS THE DRAGONFLIES', in every cast: beadwork dragonflies (a body of coral bugles, wings
      // of white seed-bead loops with a coral bead at the tip) at three depths from the necklace to the ring: a few
      // passing close with every bead readable, a middle crowd on both sides of our course, and great far ones high in
      // the upper sky (distance makes beads bigger and fewer); none before the ring (ringPart)
      {
        const rn = vr.fork('nightmoths'), pp = new V3(), tg = new V3(), sd3 = new V3(), nN = Math.round(96 * detail * density);
        for (let i = 0; i < nN; i++) {
          const uu = lerp(uLingB + 0.02, 0.975, (i + rn()) / nN); path.pointAt(uu, pp); path.pointAt(Math.min(uu + 0.01, 1), tg); tg.sub(pp).normalize(); sd3.set(tg.z, 0, -tg.x).normalize();
          const near = i % 8 === 2 && uu < 0.88, far = !near && i % 3 === 0, sg = i % 2 ? 1 : -1;
          const o = sg * (near ? rn.range(8.5, 11) : far ? rn.range(40, 88) : rn.range(uu > 0.84 ? 19 : 13, 36));
          one(pp.x + sd3.x * o, pp.y + (far ? rn.range(6, 42) : rn.range(-5, 10)), pp.z + sd3.z * o, near ? rn.range(2.6, 3.4) : far ? rn.range(9, 17) : rn.range(4, 8), 0, near ? rn.range(1.6, 2.0) : far ? rn.range(3.4, 5) : rn.range(1.9, 2.6), 1);
        }
        // a swarm crossing the moon as seen from under the necklace (coral moths in the moth cast, with dragonflies among them)
        path.pointAt(uLingB - 0.015, pp); pp.addScaledVector(moonSee, 82);
        for (let i = 0; i < 13; i++) one(pp.x + rn.range(-9, 9), pp.y + rn.range(-7, 7), pp.z + rn.range(-9, 9), rn.range(6, 13), 0, rn.range(2.2, 2.7), i < 9 ? DR || (cast === 1 ? 1 : 0) : 1);
      }
      // three by the clasp, out in the black sky beyond the ring's pearl row (its three rows stay an unbroken circle)
      for (let i = 0; i < 3; i++) { const k = r.range(3, 12); const o = (i % 2 ? 1 : -1) * r.range(19.5, 22); one(ringC.x - ringA.x * k + sideL.x * o, ringC.y - ringA.y * k + r.range(-5, 5), ringC.z - ringA.z * k + sideL.z * o, r.range(2.2, 2.8), 0, r.range(1.5, 1.8), cast === 0 ? 0 : 1); }
      // (round 6) and a loose ring of dragonflies round the clasp itself, in the black sky to either side of it and behind it
      // (ringPart keeps every one of them out of the middle of the frame), so the last frames are not bare
      { const rc = vr.fork('claspflies'); for (let i = 0; i < 12; i++) { const k = rc.range(-34, 16), o = (i % 2 ? 1 : -1) * rc.range(19, 40); one(ringC.x - ringA.x * k + sideL.x * o, ringC.y - ringA.y * k + rc.range(-9, 16), ringC.z - ringA.z * k + sideL.z * o, rc.range(2.4, 5), 0, rc.range(1.6, 2.6), 1); } }
      if (cast !== 1) for (let i = 0; i < nC; i++) one((i % 2 ? 1 : -1) * r.range(4.6, 9), r.range(-2.6, 3.4), r.range(-6, 8), r.range(1.0, 2.0), 1, r.range(1.0, 1.3));
      // (round 6) two great ones fly with us, one to each side at the frame's thirds: a clear near subject on the climb and beside the strand, every bead readable
      // (round 7: in every cast; on the climb they hold the frame's left and right thirds whichever camera flies, heading up the fall with us)
      one(-9.2, 5.2, -2, 0.8, 2, 2.2, DR); one(9.6, 5.8, 3, 0.8, 2, 1.9, DR);     // (coral wing loops in every cast: the warm accent against the pearls and the blue)
      const n = Math.max(1, A4.length / 4), g = beadQuadGeometry(n);
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A4.length ? A4 : [0, -999, 0, 1]), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B4.length ? B4 : [0, 0, 0, 0]), 4));
      g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(C2.length ? C2 : [0, 0, 1, 0]), 4));
      const mat = beadMaterial(style, { uniforms: mothU, header: 'attribute vec4 aA, aB, aC; uniform vec3 uCompC, uGreatA, uGreatB, uGreatF, uGreatR; uniform float uComp, uDrag;' + RING_GLSL, body: /* glsl */`
        float a = uTime*aB.y + aB.x*6.283, sc = aC.y, DG = max(uDrag, aC.w);
        vec3 ctr = aA.xyz;
        if (aC.x > 2.5) { }
        else if (aC.x > 1.5) { ctr = aA.x < 0. ? uGreatA : uGreatB; sc *= uComp; }
        else if (aC.x > 0.5) { ctr += uCompC; sc *= uComp; }
        float vy = 1.7*a + aB.x*9.;
        vec3 pos = ctr + vec3(cos(a)*aA.w, sin(vy)*aA.w*0.32, sin(a)*aA.w*0.8);
        vec3 fw = normalize(vec3(-sin(a), cos(vy)*0.55, cos(a)*0.8))*(aB.y < 0. ? -1. : 1.);
        if (aC.x > 2.5) {                                             // one of the ring round the dangling end
          vec3 nE = cross(uEndS, vec3(0., 1., 0.));
          pos = ctr + uEndS*(aC.z*aA.w*(1. + 0.25*cos(a))) + vec3(0., sin(a)*19., 0.) + nE*(sin(vy)*2.);
          fw = normalize(uEndS*(-aC.z*aA.w*0.25*sin(a)) + vec3(0., 19.*cos(a), 0.) + nE*0.3)*(aB.y < 0. ? -1. : 1.);
        } else if (aC.x > 1.5) {                                      // a great one: it flies our course, weaving a little, turned a little outward so its body is seen
          pos = ctr + vec3(sin(a)*0.5, sin(vy*0.6)*0.4, cos(a*0.7)*0.5);
          fw = normalize(uGreatF + uGreatR*(aA.x < 0. ? -0.42 : 0.42) + vec3(cos(a)*0.1, cos(vy*0.6)*0.08, 0.));
        }
        vec3 rt = cross(fw, vec3(0., 1., 0.)); rt *= inversesqrt(max(dot(rt, rt), 1e-4)); vec3 up = cross(rt, fw);
        if (aC.x > 2.5) { rt = cross(fw, cross(uEndS, vec3(0., 1., 0.))); rt *= inversesqrt(max(dot(rt, rt), 1e-4)); up = cross(rt, fw); }     // (its wing loops lie open to the eye)
        else if (aC.x > 1.5) { rt = uGreatR - fw*dot(uGreatR, fw); rt *= inversesqrt(max(dot(rt, rt), 1e-4)); up = cross(rt, fw); }   // (its back is turned to the eye: both pairs of wing loops are seen open)
        vec3 l; R = 0.085*sc; COLA = uCoral; COLB = uCoral; SEED = fract(aB.x*17. + aB.w*3.1 + aB.z*0.37); AX = fw; E1 = up;
        if (aB.z > 3.5) {                                             // body: crystal head, coral thorax and abdomen (dragonfly: one long bugle)
          float b = aB.w;
          l = fw*(b < 0.5 ? 0.3 : (b < 1.5 ? 0. : (b < 2.5 ? -0.31 - 0.3*DG : -0.56 - 0.75*DG)));
          if (b < 0.5) { KIND = 1.; COLA = mix(uSilver, uGlint, 0.5); COLB = COLA; R = 0.14*sc; }
          else { R = (b < 1.5 ? 0.19 : (b < 2.5 ? 0.15 : 0.115))*sc*(1. - 0.3*DG); LEN = DG*(b < 1.5 ? 0.6 : (b < 2.5 ? 3. : 1.2)); if (b > 2.5) COLB = mix(uCoral, uPearl, 0.35); }
        } else {
          float side = aB.z < 1.5 ? 1. : -1., fore = mod(aB.z, 2.) < 0.5 ? 1. : 0.;
          float th = aB.w*6.283, L = mix(0.78, 1.12, fore)*(1. + 0.3*DG), W = mix(0.3, 0.38, fore)*(1. - 0.55*DG);
          float lx = 0.16 + (0.5 - 0.5*cos(th))*L, lz = sin(th)*W + (fore > 0.5 ? 0.34 : -0.3)*lx/L + (fore > 0.5 ? 0.1 : -0.12);
          float flap = sin(uTime*(13. + 5.*fract(aB.x*5.3))*(1. + DG) + aB.x*30. - (1. - fore)*0.5)*mix(0.8, 0.3, DG) + 0.22*(1. - DG);
          l = rt*side*lx*cos(flap) + up*lx*sin(flap) + fw*lz;
          float k16 = floor(aB.w*16.);
          if (abs(k16 - 5. - aB.z) < 0.5) { COLA = uPearl; COLB = uPearl; }                     // one pearl in each loop
          else if (mod(k16, 4.) < 0.5) { COLB = mix(uCoral, uPearl, 0.22); }
          if (DG > 0.5 && aC.x < 1.5) { COLA = uPearl; COLB = mix(uSilver, uGlint, 0.5); LINED = 1.; if (abs(k16 - 8.) < 0.5) { COLA = uCoral; COLB = uCoral; LINED = 0.; } }     // white seed loops, a coral bead at the tip
          float hl = 0.5*L, per = 6.283*sqrt(0.5*(hl*hl + W*W));        // the loop's length: sixteen beads touch all round it
          R = per/32.*1.06*sc;
        }
        float keep = 1.;
        if (aC.x < 0.5) { pos = ringPart(pos, aC.z, 1.7*sc); keep = heroKeep(pos, 1.7*sc); }
        float cut = aC.y > 3.2 ? 300. : (aC.y > 1.65 ? 128. : 78.);
        R *= 1. - smoothstep(cut, cut*1.1 + 2., length(pos - cameraPosition));      // far moths are not drawn (never a red speck): the small ones of the river and gorge beyond 90 m, the big ones of the strand beyond 140 m
        C = pos + l*sc*keep; R = beadCap(C, R, 0.03)*keep;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'moths'; scene.add(m);
    }
    await ctx.yield();
    // ---- bead fish leaping up the face of the pour just ahead of us, all the way up the climb (in every cast): strings
    // of seven graded clear beads, a pearl at the head, arcing out of the falling pearls and back in ----
    {
      // (round 7) each is one string of seven TOUCHING beads, graded from a faceted crystal head to a small coral tail, bent along
      // a round arc that leaves the pour, swings up and outward and goes back in; they keep to the left and right of the
      // pour's centre line and leap away from it. The whole fish is sized by one cap (its head at most 6% of the frame's height).
      const nF = cast === 1 ? 18 : 11, a = new Float32Array(nF * 7 * 4), r = vr.fork('climbfish');
      for (let i = 0; i < nF; i++) { const sd = i % 2 ? 1 : -1, ox = sd * (1.8 + ((i >> 1) % 4) * 0.4 + r.range(0, 0.3)), al = r.range(-4, 9), ph = r(); for (let b = 0; b < 7; b++) { const q = (i * 7 + b) * 4; a[q] = ox; a[q + 1] = al; a[q + 2] = ph; a[q + 3] = b; } }
      const g = beadQuadGeometry(nF * 7); g.setAttribute('aF', new THREE.InstancedBufferAttribute(a, 4));
      const mat = beadMaterial(style, { uniforms: mothU, header: 'attribute vec4 aF; uniform vec3 uCompC, uFishU; uniform float uClimb;' + RING_GLSL, body: /* glsl */`
        float T = 2.0 + 1.2*fract(aF.z*7.31), tt = uTime/T + aF.z;
        float cyc = floor(tt), up = clamp(fract(tt)*T/1.45, 0., 1.), h1 = hash1(cyc*1.7 + aF.z*31.), sd = aF.x < 0. ? -1. : 1.;
        // along the water's run 15 m ahead of us (level in the gorge, up the face of the pour on the climb), and out of it
        vec3 dU = uFishU, n0 = cross(dU, vec3(1., 0., 0.)), dN = n0/max(length(n0), 1e-3);
        // the arc: a half circle on the chord cD (up the face and out of it), its belly along wD: in toward the pour's
        // centre line. It leaves the pour's flank, bows in over the white of the fall (never nearer its middle than 1.5 m)
        // and goes back; the plane of the bow is seen open both from the gorge and from the climb
        vec3 cD = normalize(dU + dN*0.4), wD = vec3(-sd, 0., 0.);
        float rho = 2.9 + 0.9*h1, arcL = 3.14159*rho;
        vec3 base = uCompC + vec3(sd*(rho + 1.5 + abs(aF.x) - 1.8 + h1*0.5), 0., 0.) + dU*(aF.y*0.3 - 3.2 + (h1 - 0.5)*2.4) + dN*(-2.4);       // (the water runs about 3 m under our course: the leaps stay low over it, against its white, and end at our own height)
        float kS = clamp(0.03*max(-(viewMatrix*vec4(base + cD*rho + wD*rho, 1.)).z, 0.05)/0.42, 0.4, 2.3);   // one size for the whole fish: its head 6% of the frame's height, near or far
        float r0 = 0.42*kS, dl = 0.047*kS, b = aF.w;
        float dB = 2.*r0*b - dl*b*b, Lf = 12.*r0 - 36.*dl;             // each bead touches the next: its distance behind the head, and the fish's length
        float th = (up*(arcL + Lf) - dB)/rho;
        C = base + cD*(rho*(1. - cos(clamp(th, 0., 3.14159)))) + wD*(rho*sin(clamp(th, 0., 3.14159)));
        R = (r0 - dl*b)*smoothstep(0., 0.16, th)*(1. - smoothstep(2.98, 3.14159, th))*uClimb;
        AX = normalize(cD*sin(th) + wD*cos(th)); vec3 e = cross(AX, vec3(0.2, 0.3, 0.93)); if (dot(e, e) < 1e-3) e = vec3(1., 0., 0.); E1 = normalize(e);
        // (a crystal head, slate and midnight beads by turns, a coral bead for the tail: dark fish against the white pour)
        float sl = step(0.5, mod(aF.w, 2.));
        COLA = aF.w < 0.5 ? mix(uSilver, uGlint, 0.6) : (aF.w > 5.5 ? uCoral : mix(uSlate, uBlue, sl)); COLB = aF.w < 0.5 ? uSilver : (aF.w > 5.5 ? uCoral : mix(mix(uSlate, uBlue, 0.5), uBlue, sl));
        LINED = aF.w < 0.5 ? 1. : 0.; SEED = fract(aF.z*13. + aF.w*0.17); KIND = aF.w < 0.5 ? 1. : 0.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'climb-fish'; scene.add(m);
    }
    // ---- (round 4) in the fish-only cast the sky of the night half is theirs: great bead fish (a crystal head, pearl
    // and silver-lined beads graded down to a coral tail) leaping out of the cobbles in tall arcs on both sides of our
    // course, all the way from the necklace to the ring; the other casts fly moths or dragonflies there ----
    if (cast === 1) {
      const r = vr.fork('skyfish'), nF = Math.round(64 * detail * density), a = new Float32Array(nF * 7 * 4), b4 = new Float32Array(nF * 7 * 4), pp = new V3(), tg = new V3();
      for (let i = 0; i < nF; i++) {
        const uu = lerp(uLingB - 0.02, 0.95, (i + r()) / nF); path.pointAt(uu, pp); path.pointAt(Math.min(uu + 0.01, 1), tg); tg.sub(pp);
        const hl = Math.hypot(tg.x, tg.z) || 1, o = (i % 2 ? 1 : -1) * r.range(uu > 0.84 ? 21 : 12, i % 3 ? 30 : 46);
        const hdg = Math.atan2(tg.x, tg.z) + r.range(-0.3, 0.3), ph = r(), S = r.range(1.1, 1.9), y0 = pp.y - r.range(13, 20), hk = r();
        for (let b = 0; b < 7; b++) { const q = (i * 7 + b) * 4; a[q] = pp.x + tg.z / hl * o; a[q + 1] = y0; a[q + 2] = pp.z - tg.x / hl * o; a[q + 3] = ph; b4[q] = b; b4[q + 1] = hdg; b4[q + 2] = S; b4[q + 3] = hk; }
      }
      const g = beadQuadGeometry(nF * 7); g.setAttribute('aF', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(b4, 4));
      const sx0 = ringA.z / Math.hypot(ringA.x, ringA.z), sz0 = -ringA.x / Math.hypot(ringA.x, ringA.z);
      const mat = beadMaterial(style, { uniforms: mothU, header: 'attribute vec4 aF, aG;' + RING_GLSL, body: /* glsl */`
        float T = 3.4 + 1.6*fract(aG.w*7.31), tt = uTime/T + aF.w - aG.x*0.027*aG.z;
        float up = clamp(fract(tt)*1.25, 0., 1.), arc = 4.*up*(1. - up);
        float H = 10. + 8.*fract(aG.w*3.7), Ln = 26. + 14.*fract(aG.w*5.3);       // (they leap from the cobbles and fall back: the sky above the eye line is the dragonflies')
        vec3 dh = vec3(sin(aG.y), 0., cos(aG.y));
        vec3 lead = aF.xyz + dh*((fract(uTime/T + aF.w)*1.25 - 0.5)*Ln);          // the whole fish parts as one
        float sgn = (aF.x - uRingC.x)*${sx0.toFixed(4)} + (aF.z - uRingC.z)*${sz0.toFixed(4)} >= 0. ? 1. : -1.;
        float hs = topScale(aF.xyz, aF.xyz + vec3(0., H, 0.)); H *= hs;
        C = aF.xyz + dh*((up - 0.5)*Ln) + vec3(0., arc*H, 0.);
        C += ringPart(lead, sgn, 4.) - lead;
        R = mix(1.05, 0.4, aG.x/6.)*aG.z*smoothstep(0., 0.05, up)*(1. - smoothstep(0.95, 1., up))*smoothstep(0.02, 0.3, hs)*heroKeep(lead, 4.); R = beadCap(C, R, 0.022);
        AX = normalize(dh*Ln + vec3(0., 4.*(1. - 2.*up)*H, 0.)); vec3 e = cross(AX, vec3(0.3, 0.1, 0.9)); if (dot(e, e) < 1e-3) e = vec3(1., 0., 0.); E1 = normalize(e);
        // (round 7) not the necklace's pearl: a crystal head, a body of slate and silver-lined beads by turns, a coral tail
        float sl = step(0.5, mod(aG.x, 2.));
        COLA = aG.x < 0.5 ? mix(uSilver, uGlint, 0.6) : (aG.x > 5.5 ? uCoral : mix(uSilver, uSlate, sl));
        COLB = aG.x < 0.5 ? uSilver : (aG.x > 5.5 ? uCoral : mix(mix(uSilver, uGlint, 0.5), mix(uSlate, uBlue, 0.5), sl));
        LINED = (aG.x > 5.5 || (aG.x > 0.5 && sl > 0.5)) ? 0. : 1.; SEED = fract(aF.w*13. + aG.x*0.17); KIND = aG.x < 0.5 ? 1. : 0.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'sky-fish'; scene.add(m);
    }
    // ---- our mount: a moth of silver wire and beads built round the camera (head, antennae, forewing loops in frame) ----
    const rideG = new THREE.Group(); rideG.name = 'ride-moth'; rideG.matrixAutoUpdate = false; scene.add(rideG);
    const rideU = { uBeat: { value: 0 }, uIn: { value: 0 } };
    {
      const RIDE_GLSL = /* glsl */`
        uniform float uBeat, uIn;
        // w.x: wing side (+-1, 0 = body), w.y: antenna weight
        vec3 rideP(vec3 p, vec2 w){
          if (abs(w.x) > 0.5) {
            vec2 root = vec2(0.22*w.x, -0.8), rel = p.xy - root;
            float reach = length(rel);
            float ang = w.x*(-0.01 + 0.05*sin(uBeat - reach*0.42) + 0.01*sin(uBeat*2. + 1.));    // a small stroke: the loops' tops beat within the lowest sixth of the frame
            float c = cos(ang), s = sin(ang);
            p.xy = root + vec2(rel.x*c - rel.y*s, rel.x*s + rel.y*c);
          }
          p.x += w.y*sin(uTime*1.1 + p.z*2. + (p.x > 0. ? 0. : 2.))*0.05; p.y += w.y*sin(uTime*1.6 + p.z*3.)*0.035 + 0.02*sin(uBeat)*step(abs(w.x), 0.5);
          p.y -= 0.12 + (1. - uIn)*3.6;                 // below the frame until the flight begins (nothing of the mount shows in the previous portal's picture)
          return p;
        }`;
      const P = [], K = [], W = [], tubes = [];
      const bead = (x, y, z, r, col, shape, lined, wx, wy, ax = 1, ay = 0, az = 0) => { P.push(x, y, z, r); K.push(col, shape, (P.length * 0.137) % 1, lined, ax, ay, az, 0); W.push(wx, wy); };
      // (round 6) a wire is laid in short pieces (the part's tube takes three segments for anything this short, which drew a
      // curved wire as two straight sticks beside its beads): fn(k) is the wire's centre at k = 0..1, nP pieces of four points
      const tube = (fn, nP, rad, wx, wy) => {
        for (let q = 0; q < nP; q++) {
          const g = threadTubeGeometry([0, 1, 2, 3].map((j) => fn((q + j / 3) / nP)), rad, 4, false, 0), n = g.getAttribute('position').count, w = new Float32Array(n * 2);
          for (let i = 0; i < n; i++) { w[i * 2] = wx; const k = (q + Math.floor(i / 5) / 3) / nP; w[i * 2 + 1] = wy * k * k; }
          g.setAttribute('aW', new THREE.BufferAttribute(w, 2)); tubes.push(g);
        }
      };
      // What the eye carries is small: the back of the moth's head (one faceted crystal, a coral seed either side) and
      // its two beaded feelers, all within the lowest fourteenth of the frame at its middle; the wings beat out of sight.
      bead(0, -1.38, -3.0, 0.12, 2, 1, 1, 0, 0, 0.1, 0.3, 1);
      bead(-0.17, -1.37, -3.04, 0.05, 4, 0, 0, 0, 0); bead(0.17, -1.37, -3.04, 0.05, 4, 0, 0, 0, 0);
      for (const sd of [-1, 1]) {
        const ac = new THREE.CatmullRomCurve3([new V3(sd * 0.08, -1.33, -3.1), new V3(sd * 0.3, -1.5, -3.5), new V3(sd * 0.6, -1.72, -4.0), new V3(sd * 0.85, -1.98, -4.4), new V3(sd * 0.95, -2.14, -4.6)]);
        tube((k) => ac.getPointAt(Math.min(k * 0.985, 1)), 6, 0.011, 0, 1);
        for (let i = 1; i <= 13; i++) { const k = i / 13.4, p = ac.getPointAt(k), t = ac.getTangentAt(k); bead(p.x, p.y, p.z, lerp(0.062, 0.03, k), i === 13 ? 4 : (i % 4 === 0 ? 1 : (i % 2 ? 3 : 2)), 0, i % 2 ? 0 : 1, 0, k * k, t.x, t.y, t.z); }
      }
      // the upper arcs of the two forewing loops rise into the lower corners: a wire loop strung with slate seeds, a
      // pearl after each and one coral, thread showing between them, beating at 1.5 strokes a second (uBeat)
      // (round 6) each loop is two rows of seeds on two wires, as a beader makes a wing: an outer row of pale seeds (pearl and
      // silver-lined by turns) and an inner row of slate with one coral, so the band reads as a made thing against the
      // river's carpet; its crest stands in the lowest sixth of the frame, a quarter of the width in from the edge, and
      // the arc runs from the frame's lower edge up over the crest and down again to its side edge
      for (const sd of [-1, 1]) {
        const ring = (rr, k, o = new V3()) => { const t = (-36 + 252 * k) * DEG, a = Math.cos(t) * rr, b = Math.sin(t) * rr; return o.set(sd * (2.25 + a * 0.94 - b * 0.34), -1.86 + a * 0.34 + b * 0.94, -3.12 + 0.22 * Math.cos(t)); };
        for (let row = 0; row < 2; row++) {
          const rr = 0.87 - row * 0.128, NB = row ? 26 : 30;
          tube((k) => ring(rr, k), 14, 0.012, sd, 0);                // one smooth wire, through the hole of every bead on it
          for (let i = 0; i < NB; i++) {
            const q = ring(rr, (i + 0.5) / NB), t = ring(rr, (i + 0.56) / NB).sub(ring(rr, (i + 0.44) / NB)).normalize(), cor = row === 1 && i === (sd > 0 ? 11 : 14);
            const col = cor ? 4 : (row ? (frost ? (i % 5 === 2 ? 0 : 1) : (i % 5 === 2 ? 3 : 1)) : (frost ? (i % 2 ? 0 : 1) : (i % 2 ? 3 : 2)));     // (frost: deep blue and slate on a pale carpet)
            bead(q.x, q.y, q.z, 0.06, col, 0, col === 2 ? 1 : 0, sd, 0, t.x, t.y, t.z);
          }
        }
      }
      const n = P.length / 4, g = beadQuadGeometry(n), k8 = new Float32Array(K), k4 = new Float32Array(n * 4), ax = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { k4.set(k8.subarray(i * 8, i * 8 + 4), i * 4); ax.set(k8.subarray(i * 8 + 4, i * 8 + 7), i * 3); }
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(k4, 4));
      g.setAttribute('aAx', new THREE.InstancedBufferAttribute(ax, 3)); g.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(W), 2));
      const mat = beadMaterial(style, { uniforms: rideU, header: `attribute vec4 aP, aK; attribute vec3 aAx; attribute vec2 aW; ${RIDE_GLSL}`, body: /* glsl */`
        C = rideP(aP.xyz, aW); R = aP.w; SEED = aK.z; LINED = aK.w;
        AX = aAx*inversesqrt(max(dot(aAx, aAx), 1e-6)); vec3 e = cross(AX, vec3(0.2, 0.9, 0.4)); if (dot(e, e) < 1e-3) e = vec3(1., 0., 0.); E1 = normalize(e);
        float ci = aK.x;
        COLA = ci < 0.5 ? uDeep : (ci < 1.5 ? uSlate : (ci < 2.5 ? uSilver : (ci < 3.5 ? uPearl : (ci < 4.5 ? uCoral : mix(uSilver, uGlint, 0.6))))); COLB = COLA;
        KIND = aK.y > 0.5 && aK.y < 1.5 ? 1. : 0.; LEN = aK.y > 1.5 ? 0.6 : 0.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; rideG.add(m);
      const tg = mergeGeometries(tubes, false); tubes.forEach((t) => t.dispose());
      const tm = new THREE.Mesh(tg, threadMaterial(style, { uniforms: rideU, header: `attribute vec2 aRad, aW; ${RIDE_GLSL}`, body: 'RAD = aRad.x; CEN = rideP(position, aW);', tone: 1.3, twist: 9 }));
      tm.frustumCulled = false; rideG.add(tm);
    }
    await ctx.yield();

    // ---- far ridges, each stitched coarser than the last: rings of row-beadwork crowned with beads of their own pitch ----
    {
      const ridgeMat = rowMaterial(style, { header: 'attribute vec3 aRg;', vertex: 'AUX = vec4(aRg, 0.);', fragHeader: BAND_GLSL, side: THREE.DoubleSide, fragment: /* glsl */`
        PITCH = AUX.x; DARK = 1.; float rw = floor(uv.y/PITCH), cl = floor(uv.x/PITCH + 0.5*mod(rw, 2.));
        float bd = bandOf(cl*AUX.y, rw);
        COLA = uBlue; COLW = uSilver;
        COLW = uSlate;
        if (bd > 2.5) { COLA = uSlate; } else if (bd > 1.5) { COLA = uSilver; LINED = 1.; } else if (bd > 0.5) { COLA = uNavy; }` });
      const rings = [[560, 9, 110, 100, 0, 30], [1050, 18, 190, 170, 0, 70], [2100, 36, 330, 340, 1, 140], [4500, 75, 560, 760, 1, 240]], geos = [];
      for (let k = 0; k < rings.length; k++) {
        const [R, pitch, h0, amp, simple, yMin] = rings[k], nu = k < 2 ? 150 : 110, nv = 6;
        const crest = (th) => h0 + amp * (0.55 * Math.abs(N.n2(Math.cos(th) * 2.3 + k * 9 + lay.ridge, Math.sin(th) * 2.3)) + 0.45 * Math.abs(N.n2(Math.cos(th) * 6 + k * 5, Math.sin(th) * 6 + lay.ridge)))
          * (1 + (k > 1 ? 1.1 : 0.4) * Math.exp(-((Math.atan2(Math.sin(th - 0.49), Math.cos(th - 0.49)) / 0.55) ** 2)));
        const geo = gridGeo(nu, nv, (u, v, o) => {
          const th = u * Math.PI * 2, h = crest(th), rr = R - (1 - v) * h * 1.05 + 14 * pitch * 0.1 * Math.sin(th * 23 + k);
          o[0] = Math.sin(th) * rr; o[2] = 330 + Math.cos(th) * rr; o[1] = -30 + (h + 30) * v ** 0.8; o[3] = u * Math.PI * 2 * R; o[4] = v * (h + 30) * 1.4;
        });
        const rg = new Float32Array((nu + 1) * (nv + 1) * 3); for (let q = 0; q < rg.length; q += 3) { rg[q] = pitch; rg[q + 1] = k < 2 ? 1 : 0.5; rg[q + 2] = simple; }
        geo.setAttribute('aRg', new THREE.BufferAttribute(rg, 3)); geos.push(geo);
        const nb = Math.floor(Math.PI * 2 * R / pitch);
        for (let i = 0; i < nb; i++) { const th = (i + 0.5) / nb * Math.PI * 2, h = crest(th); const cc = i % 11 === 5 ? 1 : (i % 3 === 0 ? 3 : 2); fixed.add(Math.sin(th) * R, h + pitch * 0.2, 330 + Math.cos(th) * R, pitch * 0.52, Math.cos(th), 0, -Math.sin(th), cc, 0, cc === 2 ? 1 : 0); }   // the crest row catches the moon: silver and pearl
        // the ridge's face in real beads on its own coarse lattice (never under about 6 px from the massif): the far land
        // is simple and two-coloured because its beads are huge. Only what the flight can see: ahead of the entry, above
        // the nearer land.
        const cs = k < 2 ? 1 : 0.5; let cnt = 0, it = 0;
        for (let rw = 0; rw < 60; rw++) for (let cl = 0; cl < nb; cl++) {
          if (++it % 400 === 0) await ctx.yield();
          const th = (cl + 0.5 - 0.5 * (rw % 2)) * pitch / R, cz = Math.cos(th);
          if (330 + cz * R < -60) continue;
          const h = crest(th), v = (rw + 0.5) * pitch / ((h + 30) * 1.4);
          if (v > 0.985) continue;
          const y = -30 + (h + 30) * v ** 0.8;
          if (y < yMin) continue;
          const rr = R - (1 - v) * h * 1.05 + 14 * pitch * 0.1 * Math.sin(th * 23 + k) - pitch * 0.2;
          const bd = bandOf((cl - (rw % 2)) * cs, rw), col = v > 0.87 ? (rw % 2 ? 3 : 2) : bd === 3 ? 1 : bd === 2 ? 2 : bd === 1 ? 8 : (hashI(cl * 3.7 + rw * 91.3 + k) < 0.045 ? 1 : 0);
          fixed.add(Math.sin(th) * rr, y, 330 + cz * rr, pitch * 0.5, cz, 0, -Math.sin(th), col, 0, col === 2 ? 1 : 0);
          if (++cnt % 700 === 0) await ctx.yield();
        }
        // in the fish-only cast the shoals reach every far ridge: colossal bead fish (their beads the size of the
        // ridge's own, so all of them look alike to the eye) leaping along each skyline, against the velvet
        if (cast === 1) for (let i = 0, nf = 26 - k * 2; i < nf; i++) {
          const th = (i + hfR()) / nf * 2.7 - 1.35, rr = R - pitch * 0.7, ph = hfR(), fwd = hfR() < 0.5 ? 0 : Math.PI, S0 = 0.95 + 0.3 * hfR();
          for (let b = 0; b < 7; b++) { hfF.push(Math.sin(th) * rr, crest(th) - pitch * 0.5, 330 + Math.cos(th) * rr, ph); hfG.push(b, th + Math.PI / 2 + fwd, S0, 0); }
        }
        await ctx.yield();
      }
      const m = new THREE.Mesh(mergeGeometries(geos, false), ridgeMat); geos.forEach((g) => g.dispose()); m.name = 'ridges'; m.frustumCulled = false; scene.add(m);
    }
    {
      const F = hfF, G = hfG;
      const n = Math.max(1, F.length / 4), g = beadQuadGeometry(n);
      g.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(F.length ? F : [0, -999, 0, 0]), 4)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(new Float32Array(G.length ? G : [0, 0, 1, 0]), 4));
      const hx0 = ringA.z / Math.hypot(ringA.x, ringA.z), hz0 = -ringA.x / Math.hypot(ringA.x, ringA.z);
      const mat = beadMaterial(style, { uniforms: mothU, header: 'attribute vec4 aF, aG;' + RING_GLSL, body: /* glsl */`
        float far = length(aF.xyz - cameraPosition);
        float S = aG.z*clamp(far/15., 1., 340.), Lp = 9.5*S, T = 3.1 + 2.2*fract(aF.w*7.31), Tl = 1.7;     // distance makes them bigger (and fewer): a far shoal is a few huge fish
        float tt = uTime/T + aF.w - (0.72*aG.x - 0.0383*aG.x*aG.x)*S*Tl/(Lp*T);       // (round 7: each bead touches the next, head to tail)
        float cyc = floor(tt), up = clamp(fract(tt)*T/Tl, 0., 1.);       // the leap lasts 1.7 s of each period
        float h1 = hash1(cyc*1.7 + aF.w*31.);
        vec2 dir = vec2(sin(aG.y), cos(aG.y));
        float arc = 4.*up*(1. - up), H = (3.3 + 1.6*h1)*S;
        float hs = topScale(aF.xyz, aF.xyz + vec3(0., H, 0.)); H *= hs;
        C = vec3(aF.x + dir.x*up*Lp, aF.y + aG.w*up + arc*H - 0.9*S*(1. - arc), aF.z + dir.y*up*Lp);
        C.xz -= dir*Lp*0.5;
        C.xz += vec2(dir.y, -dir.x)*sin(up*9. + aG.x*0.8)*0.22*S;
        // (round 7: the whole leap keeps to its own side of the line from the eye to the ring, and clear of the dangling end)
        float sgn = (aF.x - uRingC.x)*${hx0.toFixed(4)} + (aF.z - uRingC.z)*${hz0.toFixed(4)} >= 0. ? 1. : -1.;
        C += ringPart(aF.xyz, sgn, 0.5*Lp + 2.*S) - aF.xyz;
        R = mix(0.36, 0.13, aG.x/6.)*S*smoothstep(0., 0.06, up)*(1. - smoothstep(0.94, 1., up))*(1. - smoothstep(5600., 5900., far))*smoothstep(62., 96., cameraPosition.y)*smoothstep(0.02, 0.3, hs)*heroKeep(aF.xyz, min(0.5*Lp, 14.) + 2.*min(S, 3.));     // nothing of them from the river: the V of sky over the lip keeps to the three discs
        AX = normalize(vec3(dir.x*Lp, H*4.*(1. - 2.*up) + aG.w, dir.y*Lp)); E1 = normalize(cross(AX, vec3(dir.y, 0.2, -dir.x)));
        // (round 7) a crystal head, a body of silver-lined and slate beads by turns, a coral tail: never the necklace's pearl
        float sl = step(0.5, mod(aG.x, 2.));
        COLA = aG.x < 0.5 ? mix(uSilver, uGlint, 0.6) : (aG.x > 5.5 ? uCoral : mix(uSilver, uSlate, sl));
        COLB = aG.x < 0.5 ? uSilver : (aG.x > 5.5 ? uCoral : mix(mix(uSilver, uGlint, 0.5), mix(uSlate, uBlue, 0.5), sl));
        LINED = (aG.x > 5.5 || (aG.x > 0.5 && sl > 0.5)) ? 0. : 1.; SEED = fract(aF.w*13. + aG.x*0.17);
        KIND = aG.x < 0.5 ? 1. : 0.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'high-fish'; scene.add(m);
    }
    await ctx.yield();
    await ctx.yield();
    // ---- lesser horns on the massif, kin to the Snag: rings of beads on a bent axis over a dark backing ----
    {
      const r = vr.fork('horns'), backs = [], spots = [[175, 640], [-150, 650], [10, 730], [-205, 400], [215, 345], [-240, 255], [245, 225], [-120, 760]];
      // and two colossal horns beyond the clasp, hooked toward one another over it: the ring hangs under their arch, so
      // the last climb has beadwork round it in the sky, stitched coarse (6 m beads) because it is far and huge
      const a2 = new V3(ringA.x, 0, ringA.z).normalize(), s2 = new V3(a2.z, 0, -a2.x), mnl = Math.hypot(moonW.x, moonW.z) || 1, mnx = moonW.x / mnl, mnz = moonW.z / mnl;
      for (let i = 0; i < spots.length + 2; i++) {
        const great = i >= spots.length, gs = i === spots.length ? 1 : -1;
        let bx, bz, H, R0, bend, ba, by;
        if (great) {
          bx = ringC.x + a2.x * 150 + s2.x * gs * 76; bz = ringC.z + a2.z * 150 + s2.z * gs * 76; by = topY(bx, bz) - 6;
          H = ringC.y + (gs > 0 ? 185 : 162) - by; R0 = H * 0.07; bend = 60; ba = Math.atan2(-s2.z * gs - a2.z * 0.25, -s2.x * gs - a2.x * 0.25);
        } else {
          bx = spots[i][0] + r.range(-12, 12); bz = spots[i][1] + r.range(-12, 12); H = r.range(42, 78); R0 = H * r.range(0.085, 0.11); bend = r.range(0.1, 0.3) * H; ba = r.range(0, 6.28); by = topY(bx, bz) - 4;
          if (path.distanceTo(bx, by + H * 0.5, bz) < 40) continue;
        }
        const axisAt = (k, o) => { o.set(bx + Math.cos(ba) * bend * k * k, by + H * k, bz + Math.sin(ba) * bend * k * k); return o; };
        const c = new V3(), bp = great ? 7 : 2.4 + (i > 6 ? 0.8 : 0), pts2 = [];
        for (let y = 0, j = 0; y < H; j++) {
          const k = y / H, rr = R0 * Math.pow(1 - k, 0.8) + 0.5; axisAt(k, c);
          const nb = Math.max(3, Math.round(2 * Math.PI * rr / bp)), band = j % 9 === 8 ? 3 : (j % 9 === 7 || j % 9 === 0 ? 2 : (j % 17 === 5 ? 1 : 0));
          for (let q = 0; q < nb; q++) { const a = (q + (j % 2) * 0.5) / nb * Math.PI * 2, lit = Math.cos(a) * mnx + Math.sin(a) * mnz + 0.2 * (hashI(q * 3.1 + j * 17.3) - 0.5) > 0.22; let cb = lit ? (band === 0 ? 3 : (band === 1 ? 1 : 2)) : (band === 0 ? 0 : (band === 3 ? 1 : 8));
            if (great) {                  // (round 6) the ring's warmth on the arch: coral beads sewn among the rows of the two great horns, thickest where their flanks pass nearest the ring's axis
              const px = c.x + Math.cos(a) * rr - ringC.x, py = c.y - ringC.y, pz = c.z + Math.sin(a) * rr - ringC.z, al = px * ringA.x + py * ringA.y + pz * ringA.z;
              const dp = Math.sqrt(Math.max(px * px + py * py + pz * pz - al * al, 0)), inward = -(Math.cos(a) * (px - al * ringA.x) + Math.sin(a) * (pz - al * ringA.z)) / Math.max(dp, 1);
              if (hashI(q * 7.7 + j * 3.3 + gs) < (1 - smoothstep(22, 96, dp)) * (0.2 + 0.5 * smoothstep(-0.2, 0.6, inward))) cb = 4;
            }
            fixed.add(c.x + Math.cos(a) * rr, c.y, c.z + Math.sin(a) * rr, bp * 0.5, -Math.sin(a), 0, Math.cos(a), cb, 0, cb === 2 ? 1 : 0, 0, 0, 0, cb === 0 ? 1 : 0); }
          pts2.push(new THREE.Vector2(Math.max(rr - bp * 0.3, 0.05), y)); y += bp * 0.9;
        }
        fixed.add(c.x, c.y + bp * 0.9, c.z, bp * 0.6, 0, 1, 0, 6, 1, 0);
        const lg = new THREE.LatheGeometry(pts2, 9); lg.deleteAttribute('uv');
        const pa = lg.getAttribute('position'); for (let q = 0; q < pa.count; q++) { const k = pa.getY(q) / H; pa.setXYZ(q, pa.getX(q) + bx + Math.cos(ba) * bend * k * k, pa.getY(q) + by, pa.getZ(q) + bz + Math.sin(ba) * bend * k * k); }
        backs.push(lg);
      }
      if (backs.length) { const m = new THREE.Mesh(mergeGeometries(backs, false), backingMaterial(style, 'uVelvet*1.6 + uBlue*0.22', THREE.DoubleSide)); backs.forEach((g) => g.dispose()); m.name = 'horn-backing'; scene.add(m); }
    }
    await ctx.yield();
    // ---- gather strands and slung thread ----
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(rib.pos, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(rib.r, 4)); g.setAttribute('aT', new THREE.Float32BufferAttribute(rib.t, 2)); g.setIndex(rib.idx);
      g.boundingSphere = new THREE.Sphere(new V3(0, 40, 80), 400);
      const m = new THREE.Mesh(g, ribbonMat); m.frustumCulled = false; m.name = 'strands'; scene.add(m);
      const tg = mergeGeometries(threadGeos, false); threadGeos.forEach((t) => t.dispose());
      const tm = new THREE.Mesh(tg, threadMaterial(style, { header: 'attribute vec2 aRad;', body: 'RAD = aRad.x;' })); tm.name = 'slung-thread'; scene.add(tm);
    }
    await ctx.yield();

    // ---- spray: in a steady wind, seed beads are blown off the lip and carried down the gorge ----
    {
      const n = Math.round(420 * density * detail), a = new Float32Array(n * 4), r = vr.fork('spray');
      for (let i = 0; i < n; i++) { a[i * 4] = r.range(-13, 13); a[i * 4 + 1] = r(); a[i * 4 + 2] = r.range(0.1, 0.19); a[i * 4 + 3] = r(); }
      const g = beadQuadGeometry(n); g.setAttribute('aY', new THREE.InstancedBufferAttribute(a, 4));
      const mat = beadMaterial(style, { uniforms: wind, header: `attribute vec4 aY; ${WIND_GLSL}`, body: /* glsl */`
        float T = 3.2 + 1.5*aY.w, t = fract(uTime/T + aY.y)*T;
        float gz = 0.5 + 0.5*gustAt(vec3(aY.x, 95., 296.));
        vec3 p = vec3(aY.x*(1. + 0.12*t) + sin(t*2. + aY.w*20.)*0.8, 93.2 + (3.5 + 5.*aY.w)*t - 2.6*t*t, 299.5 - (5. + 9.*fract(aY.w*7.3))*t*gz - 1.6*t*t);
        vec3 d = p - uCamP; float l = length(d); p += d/max(l, 1e-3)*max(0., 2.6 - l);
        C = p; R = aY.z*smoothstep(0., 0.25, t)*(1. - smoothstep(T - 0.7, T, t))*(1. - smoothstep(130., 220., length(p - cameraPosition))); SEED = aY.w;   // spray is nothing from the river: the lip stays clean under the three discs
        float sp = t*(3. + 5.*aY.w); AX = normalize(vec3(cos(sp), 0.4, sin(sp))); E1 = normalize(cross(AX, vec3(0.1, 1., 0.2)));
        COLA = aY.w < 0.5 ? uPearl : uSilver; COLB = aY.w < 0.5 ? mix(uPearl, uSilver, 0.8) : mix(uSilver, uGlint, 0.5); LINED = aY.w < 0.5 ? 0.3 : 1.;` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'spray'; m.visible = breeze === 2; scene.add(m);
    }

    // ---- the massif's top in three tiers of real beads, coarser with distance from the path (the style's own depth
    // cue): 2.4 m cobbles by the path and round the basin, 5 m in the mid-ground, 10 m beyond, all on brick lattices
    // carrying the cliffs' zigzag bands, over a dark backing (the sheet under them goes dark where its rows are too fine)
    {
      const r = vr.fork('cobble'); let cnt = 0, it = 0;
      const tierOf = (x, z, e) => {
        const pd = path.nearestXZ(x, z).dist, n = N.n2(x * 0.03, z * 0.03 + lay.ridge);
        if (pd <= 46 + 10 * n || (e < 1.32 && z < 470)) return 0;
        return pd <= 150 + 28 * N.n2(x * 0.012 + 5, z * 0.012 + lay.ridge) ? 1 : 2;
      };
      const TIERS = [[2.4, 290, 668, 46], [5, 135, 800, 68], [10, 130, 810, 34]];      // (the cobbles run on past the ring's pinnacle: the ground ahead of the moth's head on the last climb)
      for (let t = 0; t < 3; t++) {
        const [P, zA, zB, nC] = TIERS[t];
        for (let rw = 0; zA + rw * P * 0.87 < zB; rw++) for (let cl = -nC; cl <= nC; cl++) {
          if (++it % 90 === 0) await ctx.yield();
          const x = (cl + 0.5 * (rw % 2)) * P, z = zA + rw * P * 0.87, ax = Math.abs(x);
          if (ax > 334 || z < zFront(Math.max(ax, 23)) + 5 + P * 0.4) continue;
          const e = basinE(x, z);
          if (e < 1.07 || (z < 316 && ax < hw(Math.min(z, 306)) + 7.5 + P * 0.6)) continue;
          if (tierOf(x, z, e) !== t) continue;
          const y = topY(x, z), bd = bandOf(cl, rw), wrong = r() < 0.045;
          if (path.distanceTo(x, y, z) < 3.6 + P * 0.5) continue;
          let col = bd === 3 ? 1 : bd === 2 ? 2 : bd === 1 ? 8 : 0; if (wrong) col = 1;      // midnight, the zigzag in navy with one silver-lined row along it
          fixed.add(x, y + 0.25 - (P - 2.4) * 0.06, z, P * 0.5, 1, 0, 0.15, col, 0, col === 2 ? 1 : 0, 0, 0, 0, col === 0 ? 1 : 0);
          if (++cnt % 700 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- gather the fixed and strung beads ----
    for (const c of collectors) { if (c.n) await beadMesh(c); await ctx.yield(); }

    // ---- gaze, portal, post ----
    const tailLook = new V3().lerpVectors(tailTip, dropFrom, 0.5), tmp = new V3(), tmp2 = new V3(), tmp3 = new V3(), impactW = toW(A.impact);
    const GAZE = { db: 33, dp: 8, dt: 26, de: 11 };                       // degrees: the Snag's hook at most this far right of the line of sight; the necklace's highest ball this far under the frame's top edge
    const pois = [
      { at: [0, 62, 296], from: 0.03, to: uFoot - 0.02, weight: 0.35 },
      // over the lip the gaze goes to the strand itself: between the dangling end and the low point of the sag, so
      // the whole span from the Snag to the ring lies across the frame above the horizon
      { at: (time, u) => {
        strandW(sTop + 34, tmp, time).lerp(tailLook, 0.42); tmp.y += 8;
        // the lingering place: the gaze holds the dangling end right of centre in the upper third (the ball leaves it,
        // falls and bursts there), the Snag over it and the sag sweeping away to the left across the frame, the heap
        // below; as the surge runs out under us it swings left and up along the necklace to the ring
        const kA = smoothstep(uLingA - 0.035, uLingA + 0.012, u);
        if (kA > 0) {
          // (round 6) the necklace never leaves: the gaze is set by the necklace itself. Its bearing lies between the
          // Snag's hook and the sixth ball beyond it (the Snag no further than GAZE.db right of centre); its pitch holds
          // the highest of the hook and those balls GAZE.dp under the frame's top edge, so the hook, the frayed tail and
          // the sag stay in the upper part of the frame while the ball falls, bursts and the surge runs beneath them
          path.pointAt(u, tmp2);
          const bS = Math.atan2(-(snagTip.x - tmp2.x), snagTip.z - tmp2.z), eS = Math.atan2(snagTip.y + 8 - tmp2.y, Math.hypot(snagTip.x - tmp2.x, snagTip.z - tmp2.z));
          strandW(sTop + 46, tmp3, time);
          const b6 = Math.atan2(-(tmp3.x - tmp2.x), tmp3.z - tmp2.z), e6 = Math.atan2(tmp3.y + 4.5 - tmp2.y, Math.hypot(tmp3.x - tmp2.x, tmp3.z - tmp2.z));
          strandW(sTop + 18, tmp3, time);
          const e3 = Math.atan2(tmp3.y + 4.5 - tmp2.y, Math.hypot(tmp3.x - tmp2.x, tmp3.z - tmp2.z));
          const bR = Math.atan2(-(ringC.x - tmp2.x), ringC.z - tmp2.z);
          let b = Math.max(Math.min(lerp(bS, b6, 0.5), bR + 35 * DEG), bS - GAZE.db * DEG), e = Math.min(Math.max(eS, e6, e3) - (28 - GAZE.dp) * DEG, 34 * DEG);
          // (round 7) from the release on the dangling end itself is held inside the frame: its tail no further than GAZE.dt right
          // of the line of sight (we swing round it at 42 m, so the gaze follows it and the ring waits out of frame for two
          // seconds); and once the ball has burst the gaze comes down until the lowest hanging ball is GAZE.de under the top
          // edge, so the mound and the surge leaving it are in the lower right of the frame
          const dT = Math.hypot(tailLook.x - tmp2.x, tailLook.z - tmp2.z), bT = Math.atan2(-(tailLook.x - tmp2.x), tailLook.z - tmp2.z);
          b = Math.max(b, bT - lerp(44, GAZE.dt, smoothstep(uDropBeat - 0.012, uDropBeat + 0.016, u)) * DEG);
          const eD = Math.atan2(dropFrom.y + 4 - tmp2.y, dT) + (GAZE.de - 28) * DEG;
          e = lerp(e, Math.min(e, eD), smoothstep(uDropBeat + 0.012, uDropBeat + 0.036, u));
          tmp2.x -= Math.sin(b) * Math.cos(e) * 70; tmp2.y += Math.sin(e) * 70; tmp2.z += Math.cos(b) * Math.cos(e) * 70;
          // (then the gaze swings left and up to the low point of the sag: the whole necklace from the Snag to the ring)
          const kB = smoothstep(uDropBeat + 0.0365, uDropBeat + 0.0525, u);
          if (kB > 0) { strandW(sTop + 56, tmp3, time); tmp3.y -= 5; tmp2.lerp(tmp3, kB); }
          tmp.lerp(tmp2, kA);
        }
        return tmp; }, from: uLip - 0.038, to: uLingB + 0.03, weight: 0.86, fade: 0.1 },
      { at: (time, u) => strandW(sTop + lerp(40, SLEN - sTop - 30, smoothstep(uCrestEnd, uAim, u)), tmp, time), from: uCrestEnd + 0.04, to: uB72 + 0.05, weight: 0.3 },
      { at: (time, u) => strandW(SLEN - 34, tmp, time).lerp(ringC, smoothstep(uAim - 0.03, uAim + 0.05, u)), from: uB72 + 0.02, to: 1, weight: 0.6 },                // the ring, with the thread and its last balls under it
    ];
    const camW = new V3(), gA = new V3(), gB = new V3();
    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 56, near: 0.25, far: 9000, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#EAF4FF', glow: 0, halo: false, veil: '#F1D3C6', revealDistance: 300, blendDistance: 25 },
      // flat: no tone map, so each bead colour lands on its hex; glints are written above 1 and only they bloom
      post: { flat: 1, exposure: EXPOSURE, bloom: { strength: 0.12, radius: 0.2, threshold: 1.0 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      _dbg: { tailTip: tailTip.toArray(), dropFrom: dropFrom.toArray(), impact: impactW.toArray(), snagTip: snagTip.toArray(), low: strandW(sTop + 46).toArray(), ring: ringC.toArray(), u: { uFoot, uLip, uLingA, uLingB, uDropBeat } },   // (for shots/unstrung-falls/tmp helpers only)
      update(dt, time, camera, u) {
        style.update(time, ctx.renderer);
        camW.setFromMatrixPosition(camera.matrixWorld);
        wind.uCamP.value.copy(camW);
        flowU.uFlow.value = time;
        const sec = secAt(u || 0);
        // the gust: a front leaves the fall, meets us in the gorge at ten seconds and runs on down the valley
        wind.uGF.value.x = 213 - 12 * (sec - sGust);
        hero.setGust(breeze === 1 ? 0 : breeze === 2 ? 0.45 + 0.4 * Math.sin(time * 0.63) : smoothstep(1, 4, sec) * Math.exp(-Math.max(sec - 4, 0) / 9));
        if (rare) {
          // the run: at 23 s the thread jerks and the twelve crystals slide off in one train over four seconds; the surge
          // doubles the pour for eight seconds and the lightened strand lifts 15 m, settling in two slow bounces
          const tr = sec - sRel - 0.3;
          hero.setCycle(hero.cycleSpan - 6 + clamp(sec - (sRel - 13.5), -0.01, 6));        // three balls in the notch from the river; it restrings while we fly the gorge and waits whole for the jerk
          hero.setRun(u > 0 ? tr : -1, tr > 0 ? 5 * Math.exp(-tr * 1.6) * Math.sin(tr * 9) : 0, tr > 0.6 ? 15 * (1 - Math.exp(-(tr - 0.6) * 0.5) * Math.cos((tr - 0.6) * 1.15)) * smoothstep(0.6, 4.5, tr) : 0);
          hero.setSurge(smoothstep(3.2, 5, tr) * (1 - smoothstep(10.5, 13, tr)));
        } else hero.setCycle(hero.cycleSpan - 6 + Math.max(sec - (sRel - 7.5), -0.01));   // from the river and through the previous portal the strand is held ten balls short and, that far off, every third ball stands for three, so three pale discs stand in a row in the notch above the lip (the tease); it restrings while we climb and is whole as we come over the lip, the first ball leaving at 23 s
        hero.update(dt, time, camera);
        // the mount rides the camera it is given; it rises into frame as the flight begins
        rideG.visible = !ctx.through;
        rideG.matrix.copy(camera.matrixWorld); rideG.matrixWorld.copy(camera.matrixWorld);
        for (const c of rideG.children) c.matrixWorld.copy(camera.matrixWorld);
        rideU.uIn.value = smoothstep(0, 0.012, u || 0);
        rideU.uBeat.value = time * 9.42;
        // moths beside us on the climb (beside the strand the big ones keep to its far side)
        const uu = u || 0;
        path.pointAt(Math.min(uu + 15 / path.length, 1), mothU.uCompC.value);
        const climbW = smoothstep(uFoot - 0.14, uFoot - 0.08, uu) * (1 - smoothstep(uLip - 0.04, uLip - 0.008, uu));
        path.tangentAt(Math.min(uu + 15 / path.length, 1), mothU.uFishU.value).normalize();
        mothU.uClimb.value = climbW;                                   // the fish leap up the face of the pour and nowhere else
        // (round 7) the two great ones: beside the strand they keep their old stations off the path; on the climb they hold
        // the left and right thirds of whatever the eye sees (the steady camera looks 30 degrees under our course there)
        {
          const e = camera.matrixWorld.elements, gk = smoothstep(uFoot - 0.035, uFoot + 0.02, uu) * (1 - smoothstep(uLip - 0.03, uLip + 0.005, uu));
          const cc = mothU.uCompC.value, A = mothU.uGreatA.value, B = mothU.uGreatB.value, wv = Math.sin(time * 0.43), wv2 = Math.sin(time * 0.31 + 1.7);
          gA.set(camW.x - e[8] * 14 - e[0] * (5.2 + 0.4 * wv) + e[4] * (1.9 + 0.4 * wv2), camW.y - e[9] * 14 - e[1] * (5.2 + 0.4 * wv) + e[5] * (1.9 + 0.4 * wv2), camW.z - e[10] * 14 - e[2] * (5.2 + 0.4 * wv) + e[6] * (1.9 + 0.4 * wv2));
          gB.set(camW.x - e[8] * 15.5 + e[0] * (5.7 + 0.4 * wv2) + e[4] * (0.3 - 0.4 * wv), camW.y - e[9] * 15.5 + e[1] * (5.7 + 0.4 * wv2) + e[5] * (0.3 - 0.4 * wv), camW.z - e[10] * 15.5 + e[2] * (5.7 + 0.4 * wv2) + e[6] * (0.3 - 0.4 * wv));
          A.set(cc.x - 9.2, cc.y + 5.2, cc.z - 2).lerp(gA, gk); B.set(cc.x + 9.6, cc.y + 5.8, cc.z + 3).lerp(gB, gk);
          // (on the climb they bank out from the fall, so the eye looks down on their backs and the wing loops lie open)
          path.tangentAt(Math.min(uu + 0.004, 1), mothU.uGreatF.value).normalize();
          gA.set(-e[8] * 0.5 + e[4] * 0.85, -e[9] * 0.5 + e[5] * 0.85, -e[10] * 0.5 + e[6] * 0.85).normalize();
          mothU.uGreatF.value.lerp(gA, Math.max(gk, 0.45)).normalize();     // (off the climb too they fly a little turned to us, wing loops open)
          mothU.uGreatR.value.set(e[0], e[1], e[2]).normalize();
          hero.setClear(A, B, 3.7 * gk);                               // the loose pearls part round them
        }
        mothU.uComp.value = Math.max(climbW, cast === 1 ? 0 : smoothstep(uLingB + 0.03, uLingB + 0.08, uu) * (1 - smoothstep(0.7, 0.76, uu)));     // (companions again up beside the strand; they leave us before the turn to the ring)
        mothU.uEndK.value = smoothstep(uLingA - 0.05, uLingA - 0.012, uu) * (1 - smoothstep(uDropBeat + 0.05, uDropBeat + 0.085, uu));
        const rk = smoothstep(0.7, 0.78, uu);
        mothU.uRingE.value = smoothstep(uLingA - 0.02, uLingA + 0.015, uu) * (1 - rk);     // (round 7) from the lingering place on, nothing within a ring's width of the ring; on the last climb the whole middle third (ringPart)
        mothU.uFishTop.value = lerp(2, -0.1, smoothstep(uLip - 0.03, uLip, uu) * (1 - smoothstep(0.69, 0.77, uu)));
        mothU.uNeckK.value = smoothstep(uLingA - 0.05, uLingA - 0.012, uu) * (1 - smoothstep(uDropBeat + 0.03, uDropBeat + 0.055, uu));
        mothU.uRingK.value = rk;                 // from here the ring is seen whole: every creature keeps to its own side
      },
      dispose() { hero.dispose(); for (const d of dispo) d.dispose(); },
    };
  },
};
