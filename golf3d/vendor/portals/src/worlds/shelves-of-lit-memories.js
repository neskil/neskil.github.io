// SHELVES OF LIT MEMORIES. The inside of a mind at night, drawn in our own hand from a description in words: the endless curving
// shelf walls of long-term memory with their glowing orbs, the dark round chasm, the islands on their stems, the tower in the middle.
// THE PLACE (typed places: src/parts/shelves-of-lit-memories-plan.js; x east, y up, z south; the flight goes south):
//  THE PLAIN at y 0, covered with shelf walls 38 m tall laid in folds, lanes 18 m wide between them; on every shelf a row of orbs
//   2 m across, each glowing in one colour (gold for most; runs of blue, red, green, violet; a few grey).  [part -shelves]
//  THE CHASM, a round pit 1,040 m across about (0, 900), its depth lost in dark haze; five islands on slim stems in it, the
//   funfair island with its great wheel nearest the way; the far-west island's place is typed as scenery, the same on every
//   seed, PLACED TO BE SEEN WELL FROM THE WAY over the whole stretch from the wheel to the ring; a line of light from each to
//   THE TOWER in the middle (a rounded pod, foot 44 m and crown 176 m up, 136 m across, one great band of window facing north);
//   THE RING on its own round platform before the window. [part -isles]
//  THE RIDE: five glass tubes from the tower's crown to the shelf walls' tops with orbs racing through them; three small trains
//   on one loop of track of light; fine motes in the air.  [part -ride]
//  THE SKY: no star, no sun, no moon. A deep soft dome, indigo overhead, violet lower, a dusky rose low down; slow pale veils of
//   light in it; a brighter soft glow in the south, above the tower. A thin violet haze with distance.
// THE FLIGHT (the plan's ROUTE, laid by rule from the spine; 54 s): in high from the north, 124 m up, 110 m east of the lane's
//  line, the sixth glass tube rising out of a wall top just ahead and running on beside the dive (15 m off, at the height the
//  line has midway down); a straight dive that swings in onto the route's own lane and comes down to the wall tops' height at
//  INTO, the spine's place where the lane's true balls begin; from there the line carries the dive's own slope on down between the
//  walls and flares out softly to the lane's height (LEVEL: where it is 4 m over that height), then low along the lane (14.5 m
//  over its floor, on the lane's middle, 9 m from either wall) through its bends, under the glass tube that crosses it; THE CLIMB
//  OUT OF THE LANE along its middle, from the border between the blue district and the gold district with red and green (CLIMB)
//  to the border where the violet district begins, over the wall tops again at OVER and level 62 m up over the lane's last
//  bends; out over the rim 63 m up, 21 m over the trains' track (MOUTH); gently up past the great wheel on the left hand, 40 m
//  off its face (ABEAM); the last 156 m straight and level to the ring before the tower's window. The ring is in view from OVER on.
// THE LOOKS (four; each on one fixed place, one plain weight, between named places of the route; never two at once):
//  1 THE TOWER'S WINDOW, its middle: weight 0.55, from the entry to INTO, ramps of 50 m. Why: the dive points the eye at the
//    folds below; the look lifts it toward the chasm, the islands and the tower.
//  2 THE FUNFAIR ISLAND'S STEM, 76 m under its deck (a low place far ahead, in the chasm): weight 0.75, from 85 m before CLIMB
//    to MOUTH, ramps of 80 m: at its full weight before the climb begins. Why: in the climb it holds the eye down on the chasm
//    ahead, and over the tops it rests the gaze low (11 to 13 degrees down) on the lit lane, the rim, the track and the islands.
//  3 THE GREAT WHEEL'S AXLE: weight 0.75, from MOUTH to ABEAM, ramps of 60 m; it has let go by abeam, where the axle is 79
//    degrees off the route. Why: the wheel is the one great near thing over the chasm.
//  4 THE TOWER'S WINDOW, its middle: weight 0.45, from ABEAM to the end, ramps of 60 m. Why: the goal; it lifts the eye a little
//    from the ring to the window that towers behind it.
//  None between INTO and 85 m before CLIMB (the low lane): the eye goes down the lane.
// THE PACE (by places on the route, the same on every visit): about 32 m a second from the entry to the lane's mouth, about 15 m a
//  second over the chasm (the place's great sight), eased over 120 m about the mouth (from 30 m before it to 90 m past it).
// THE RING (14 m in radius): a clear bright cyan-white of its own ('#6fe6ff', glow 1.1: its halo must not pale the window behind it).
// NOTHING ELSE is keyed to metres flown; everything that moves goes by the clock (the parts say what).
// THE HOUR DEALS (ctx.vary.hour: the visitor's own Hour, or a journey's; no seed's number deals it): 'dawn' THE PALE NIGHT (a little
//  more haze and a paler dome: shared.mist 1), every other hour THE CLEAR NIGHT.
// A SEED DEALS: the field of the sky's veils (stream sky); each racing orb's colour and place in its tube (stream tube-orbs); each
//  mote's home (streams motes-lane, motes-chasm); ctx.vary.rare and ctx.vary.density are read by the parts -shelves and -isles.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import { ROUTE, TOWER, WHEEL, RING, ISLES, INTO, LEVEL, CLIMB, MOUTH, ABEAM } from '../parts/shelves-of-lit-memories-plan.js';
import { buildShelves } from '../parts/shelves-of-lit-memories-shelves.js';
import { buildIsles } from '../parts/shelves-of-lit-memories-isles.js';
import { buildRide } from '../parts/shelves-of-lit-memories-ride.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export default {
  id: 'shelves-of-lit-memories', name: 'Shelves of Lit Memories', category: 'screen', placeKind: 'bizarre', screen: 'Inside Out', screenYear: '2015', screenKind: 'film',
  weirdness: 0.6, media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, mist = vary.hour === 'dawn', detail = ctx.quality ? ctx.quality.detail : 1;
    const stream = (name) => makeRng(hashSeed('shelves-of-lit-memories:' + name + ':' + ctx.seed));
    const shared = { uTime: { value: 0 }, mist: mist ? 1 : 0 };

    // ---------------- the sky: a deep soft dome with no star and no body; a soft glow in the south over the tower; pale veils
    const sky = makeSky({ rng: stream('sky'), preset: 'night', bodies: [], key: 'sun', stars: 0, milkyWay: 0, nebula: 0, clouds: false,
      // the pale veils: one broad soft layer of lilac light, drifting slowly
      clouds2: { coverage: mist ? 0.5 : 0.44, softness: 0.7, scale: 0.42, opacity: mist ? 0.34 : 0.28, detail: 0.15, silver: 0.25, absorb: 0, stretch: 0.8, wind: [0.006, 0.002], haze: 0.25,
        lit: mist ? '#8b7cc8' : '#7466b8', shade: mist ? '#2c245e' : '#1e184c' },
      // the curtains and ribbons of light (the kit's own, slowed): pale rose low, lilac high, more of them on the tower's side
      aurora: mist ? 0.74 : 0.64, auroraColors: ['#ffb0c8', '#b094ff'], auroraScale: 0.9, auroraSpeed: 0.25, auroraAzimuth: 180, auroraSpread: 0.3,
      // the dome: indigo overhead, violet lower, a dusky rose low down
      zenith: mist ? '#0b0a2c' : '#06051a', mid: mist ? '#221a5c' : '#18134e', horizon: mist ? '#7c5270' : '#683c5a', ground: '#07051a', horizonPow: 4.5, midPow: 1.3, groundFalloff: 5,
      // the glow over the tower: no disc, a broad soft halo whose middle lies behind the tower's pod all the way (due south, 1.5 degrees up:
      // the tower stands within 6 degrees of due south from every place of the route), so that the tower stands in its own light
      sunDirection: [0, 0.026, 0.9997], sunIntensity: 0, sunColor: '#f6cfae', sunGlow: mist ? 0.56 : 0.48, sunGlowTight: 0,
      scatterColor: mist ? '#8a5a78' : '#7a4664', scatter: mist ? 0.36 : 0.3, scatterPow: 4, scatterHigh: 0.06, scatterFall: 3,
      lightColor: '#c8b4ff', lightIntensity: 0.9, ambientColor: '#5a48a8', groundLight: '#2a1c50', ambientIntensity: 1.9, lightElevationMin: 55,
      quality: detail < 0.75 ? 0.5 : 1, bake: false, renderer: ctx.renderer });      // on a low detail the veils and the curtains take fewer steps
    scene.add(sky.object);
    // the dome's crown: high overhead the sky is plain deep indigo. A cap that is PART OF THE SKY: drawn at the far plane (z = w, as
    // the kit's dome is) and turned by the view's rotation only, so that it is centred on whichever camera draws, at every pose, and
    // no part of it can be cut by the far plane; in the opaque pass straight after the dome and before every body, so that every
    // body, every glow and the ring's light lie over it. Under it the curtains' rays fade out from 25 degrees up (the kit draws
    // faint rays toward the zenith; they are not wanted over the eye). Its mesh is a FINELY DIVIDED CAP OF A UNIT SPHERE (from the
    // zenith down to 21 degrees up, where it is clear): never one flat fan of huge triangles, whose middle point straight overhead
    // lies in or behind the eye's own plane when the eye is level or tips down, so that the fade is carried wrongly across the
    // sky and the fan's rim shows as a hard arc.
    const capMat = new THREE.ShaderMaterial({ name: 'slmDomeCap', transparent: false, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: { uCol: { value: new THREE.Color(mist ? '#0b0a2c' : '#06051a') } },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`precision highp float; varying vec3 vD; uniform vec3 uCol;
        void main(){ vec3 d = vD*inversesqrt(max(dot(vD, vD), 1e-6)); float a = .92*smoothstep(.42, .72, d.y); gl_FragColor = vec4(uCol*a, a); }` });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 14, 0, Math.PI * 2, 0, 1.2), capMat);
    cap.name = 'dome-cap'; cap.renderOrder = -0.5; cap.frustumCulled = false; scene.add(cap);
    scene.fog = new THREE.FogExp2(new THREE.Color(mist ? '#40305e' : '#2b1946'), mist ? 0.00066 : 0.0005);      // a thin violet haze: the far folds and the far islands sink into it
    const rig = makeLightRig(sky, { bounce: 0.25 }); scene.add(rig.object);
    await ctx.yield();

    // ---------------- the parts, each in its own steps: the shelves and the plain; the chasm, the islands, the tower; the ride
    const shelves = await buildShelves(ctx, shared); scene.add(shelves.object);
    await ctx.yield();
    const isles = await buildIsles(ctx, shared); scene.add(isles.object);
    await ctx.yield();
    const ride = await buildRide(ctx, shared); scene.add(ride.object);
    await ctx.yield();
    const parts = [shelves, isles, ride];

    // ---------------- the route and its named places, in metres flown; the four looks (see the head)
    const path = makePath(ROUTE), L = path.length, U = (m) => m / L, M = (p) => path.nearestXZ(p[0], p[2]).u * L;
    const mInto = M(INTO), mLevel = M(LEVEL), mClimb = M(CLIMB), mMouth = M(MOUTH), mAbeam = M(ABEAM);
    const ease = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
    const pace = (u) => 1 - 0.54 * ease(mMouth - 30, mMouth + 90, u * L);      // the speed at u beside the entry's: the engine scales it so that the flight lasts `duration`
    const look = (at, from, to, ramp, weight) => ({ at, from: U(from), to: U(to), fade: ramp / (to - from), weight });      // the engine's fade is the ramp's share of the span
    const windowMid = V3(TOWER.x, (TOWER.win0 + TOWER.win1) / 2, TOWER.z - TOWER.r), axle = V3(WHEEL.x, WHEEL.y, WHEEL.z);
    const under = V3(ISLES[0].x, ISLES[0].y - 76, ISLES[0].z);      // the funfair island's stem, 76 m under its deck: a low place far ahead, in the chasm
    const pois = [
      look(windowMid, 0, mInto, 50, 0.55),
      look(under, mClimb - 85, mMouth, 80, 0.75),
      look(axle, mMouth, mAbeam, 60, 0.75),
      look(windowMid, mAbeam, L, 60, 0.45),
    ];
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 54, pace, title: 'Shelves of Lit Memories',
      camera: { fov: 68, near: 0.5, far: 7000, lookAhead: 30, sway: 0.4, bank: 0.25 },
      pois,
      portal: { shape: 'circle', radius: RING.r, color: '#6fe6ff', glow: 1.1 },
      post: { exposure: 1.3, bloom: { strength: 0.42, radius: 0.5, threshold: 0.9 },
        grade: { saturation: 1.12, contrast: 1.04, tint: '#fff4fb', shadowTint: '#0a0620', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        shared.uTime.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        for (const p of parts) if (p && typeof p.update === 'function') p.update(time, dt, camera);
      },
      dispose() {
        // each thing once: a part frees its own; the sky frees its own; whatever else the scene holds is freed here
        const own = new Set([sky.object]), done = new Set();
        for (const p of parts) if (p) { if (typeof p.dispose === 'function') p.dispose(); if (p.object) own.add(p.object); }
        const free = (o) => { if (o && typeof o.dispose === 'function' && !done.has(o)) { done.add(o); o.dispose(); } };
        const walk = (o) => {
          if (own.has(o)) return;
          free(o.geometry);
          for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) free(m);
          for (const ch of o.children) walk(ch);
        };
        walk(scene);
        if (typeof rig.dispose === 'function') rig.dispose();
        sky.dispose();
      },
    };
  },
};
