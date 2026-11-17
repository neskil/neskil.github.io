// THE SLEDGE BETWEEN THE VOLCANOES, hero part: the passage's fire side.
//   makeCone()      a volcano as a lathe mesh with gullies (the black one carries glowing lava threads; the white one
//                   is the same builder with snow and rock ribs). Own shader.
//   makeFlashes()   the crater's flashes: a seeded schedule on a named stream of its own. The eruption column itself
//                   is smoke: soft billows riding a spine (the puffs of the ice part), built in buildHero().
//   makeLavaFront() the wall of crusted lava on the ice, its tongues down the apron, steam towers, glowing blocks and
//                   the steam bursts that throw fragments (a pure function of the world clock).
//   buildHero()     puts them together in the brief's own coordinates (the world adds this object unrotated) and adds
//                   the two travellers with their sledge (src/parts/sledge-between-volcanoes-travellers.js).
// Everything staged here follows the world clock from seeded schedules, or the amounts the world hands to update().
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { makeShared, sharedUniforms, SBV_NOISE, SBV_LIGHT } from './sledge-between-volcanoes-common.js';
import { makeLavaFront } from './sledge-between-volcanoes-lava.js';
import { forksOf } from './sledge-between-volcanoes-common.js';
import { buildTravellers } from './sledge-between-volcanoes-travellers.js';
import { makePuffs } from './sledge-between-volcanoes-ice.js';

// ---------------------------------------------------------------- the cones
// profile of a cone: 1 at the summit, 0 at the foot; steep above, a long concave skirt below
const coneF = (t) => { const q = 1 - clamp(t, 0, 1); return 0.5 * Math.pow(q, 1.9) + 0.5 * q; };

const CONE_VS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vPol;      // vPol: distance from the axis (m), angle
uniform vec3 uTop;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
  vPol = vec2(length(position.xz - uTop.xz), atan(position.z - uTop.z, position.x - uTop.x));
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const CONE_FS = /* glsl */`
precision highp float;
varying vec3 vW; varying vec3 vN; varying vec2 vPol;
uniform vec3 uTop, uRock, uSnow, uLava; uniform vec4 uKind;      // x: snow cover 0..1, y: lava threads 0..1, z: crater rim radius, w: foot radius
uniform vec3 uThread;                                              // three gully angles
uniform float uTime, uHaze, uRich; uniform vec3 uHazeCol;      // uRich 1: the white mountain's richer surface (polish 1); 0: as live
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec3 n = normalize(vN);
  float r = max(vPol.x, 1.), an = vPol.y, t = clamp(r/uKind.w, 0., 1.);
  // ribs and gullies: the same bent radial field the mesh was pushed by, finer
  vec2 q = vec2(an*7., r/260.);
  float rib = sN2(vec2(an*19. + 3.*sN2(q), r/420.)), fine = sF2(vec2(an*46., r/90.) + 7.3);
  float steep = 1. - smoothstep(.55, .9, n.y);
  // snow lies in the gullies and on the gentle ground; rock ribs stand out of it where it is steep
  float snow = smoothstep(.34, .62, uKind.x*1.25 - steep*.75*(.4 + rib) + .3*(fine - .5) + .55*smoothstep(.25, .9, t)*uKind.x);
  snow *= 1. - (1. - uKind.x)*smoothstep(.5, .0, t)*.8;
  // ledges hold snow; at the foot the drift runs up the gullies in ragged tongues (no level line where rock meets snow)
  snow = max(snow, smoothstep(.56, .66, sN2(vec2(an*11., vW.y/40.) + 3.))*(1. - .7*steep)*.85);
  snow = max(snow, (1. - smoothstep(224. + 30.*fine, 236. + 170.*rib*rib + 70.*fine, vW.y))*(.7 + .3*fine));
  // the white mountain's slope is not one smooth mass: rock ribs stand through it and blue ice shows where the wind strips it
  snow *= 1. - .8*uKind.x*smoothstep(.66, .76, rib + uRich*(.34*(sF2(vec2(an*37., r/95.) + 3.1) - .5) + .2*(sF2(vec2(an*83., r/36.)) - .5)))*smoothstep(.2, .5, t)*(.5 + .5*fine);
  float bare = uKind.x*smoothstep(.6, .7, sF2(vec2(an*15., r/75.) + 1.3))*(1. - steep);
  vec3 rock = uRock*(.55 + .9*fine)*(.7 + .6*rib);
  // (polish 1, uRich) rock is rock: beds of lighter and darker stone, lifted out of flat black; its ribs and gullies
  // turn the slope's face a little to one side and the other; hanging ice with crevasse bands on the middle slopes
  float bedR = sN2(vec2(vW.y/9. + 2.*sN2(vec2(an*9., r/200.)), an*3.));
  // (second part, B1) dark and cold: blue-black to slate by its beds, never one flat tone; snow lies on its ledges
  // (thin shelves every few metres of height, of unlike length) and breaks every edge of every rock patch
  rock = mix(rock, mix(vec3(.010, .014, .026), vec3(.045, .056, .085), bedR)*(.65 + .7*fine), uRich);
  snow = max(snow, uRich*.92*smoothstep(.5, .62, sN2(vec2(an*15. + 2., vW.y/8. + 1.6*sN2(vec2(an*43., r/70.))))));
  { vec3 tng = normalize(vec3(-(vW.z - uTop.z), 0., vW.x - uTop.x) + vec3(1e-4, 0., 0.));
    n = normalize(n + tng*(uRich*7.*(sN2(vec2((an + .012)*19. + 3.*sN2(q), r/420.)) - rib))); }
  float hang = uRich*smoothstep(.57, .67, sF2(vec2(an*6. + 1.7, r/340.)))*smoothstep(.16, .3, t)*(1. - smoothstep(.6, .8, t));
  // its crevasse bands: short dark slots across the fall line, unlike in spacing, each band broken along its length
  float by = vW.y/14. + 2.4*sN2(vec2(an*17., r/120.)) + 1.1*sF2(vec2(an*41., r/55.));
  float band = (1. - smoothstep(.0, .09, abs(fract(by) - .5)))*smoothstep(.4, .62, sN2(vec2(an*57. + floor(by)*7.31, r/48.)));
  vec3 alb = mix(rock, mix(uSnow*(.86 + .2*fine), vec3(.15, .32, .52)*(.8 + .4*fine), bare*.65), snow);
  alb = mix(alb, mix(vec3(.2, .42, .62)*(.8 + .4*fine), vec3(.03, .07, .14), band*.8), hang*snow*.8);
  alb = mix(alb, uSnow, uRich*snow*(1. - snow)*2.);                                  // frost on the rim of every rock patch
  // ash on the snow of the fire mountain: long dirty streaks down the fall line
  alb *= 1. - (1. - uKind.x)*.5*snow*smoothstep(.35, .7, sN2(vec2(an*31., r/600.)));
  vec3 c = alb*(sbvSky(n) + uRich*.3*snow*sbvBelly(vW, n));      // (second part, B1: the fire's red on its snow only, faintly; no rock is pink)
  // the crater's own glow on the upper cone
  vec3 toC = uTop - vW; float dc = length(toC);
  c += alb*uLava*uKind.y*1.6*uFire.y*(1. + uFire.w)*clamp(dot(n, toC/max(dc, 1.)) + .5, 0., 1.)*(uKind.z*uKind.z*4./(dc*dc + uKind.z*uKind.z*4.));
  // lava threads crawling down three gullies: a hot line broken by crust, the bright stretches slide downhill
  float thr = 0., halo = 0.;
  for (int i = 0; i < 3; i++) {
    float a0 = i == 0 ? uThread.x : (i == 1 ? uThread.y : uThread.z);
    float da = an - a0 - .22*sN2(vec2(r/170., float(i)*7.1)) + .08*sN2(vec2(r/45., float(i)*3.3));
    da = abs(mod(da + 3.14159265, 6.2831853) - 3.14159265)*r;
    float w = (2.5 + 7.*smoothstep(.05, .6, t))*clamp(uKind.w/720., 1., 1.35);
    float line = 1. - smoothstep(w*.3, w, da);
    float flow = .35 + .65*smoothstep(.3, .7, sN2(vec2(r/70. - uTime*.11 - float(i)*5., float(i)*2.7)));
    float reach = smoothstep(uKind.z*.8, uKind.z*1.6, r)*(1. - smoothstep(.52, .8, t));
    thr += line*flow*reach;
    halo += (1. - smoothstep(w*.6, w*9., da))*(.4 + .6*flow)*reach;                     // the thread's light on the slope beside it
  }
  thr = clamp(thr, 0., 1.)*uKind.y;
  halo = clamp(halo, 0., 1.); c += alb*uLava*uKind.y*halo*halo*.9*(.5 + .5*uFire.y/2.2);
  c = mix(c, uLava*(.9 + 1.3*thr), thr*.9);
  // the rim itself glows where the vent is
  c += uLava*uKind.y*2.2*(1. - smoothstep(uKind.z*.55, uKind.z*1.15, r))*(.6 + .4*sN2(vec2(an*5., uTime*.4)));
  float dist = length(vW - cameraPosition);
  c = mix(c, uHazeCol, uHaze*(1. - exp(-dist/2600.)));
  gl_FragColor = vec4(sbvFog(c, dist, .25), 1.);
}`;

// (async: the mesh is built a few rings at a time, with a yield between)
export async function makeCone(ctx, S, o) {
  const { noise } = ctx, SEG = o.seg ?? 112, RING = o.ring ?? 36, R = o.radius, top = o.top, foot = o.foot, H = top[1] - foot, rim = o.rim ?? 0, key = o.key ?? 0;
  const pos = new Float32Array((RING + 1) * SEG * 3), idx = [];
  for (let j = 0; j <= RING; j++) {
    const tj = Math.pow(j / RING, 1.35);                       // rings gather near the summit
    for (let i = 0; i < SEG; i++) {
      const an = (i / SEG) * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an);
      // gullies: a radial field bent by noise; deeper lower down; the summit and the foot are left clean
      const g = noise.n2(ca * 3.1 + key, sa * 3.1 - key) * 0.5 + noise.n2(ca * 7.7 - key * 2, sa * 7.7 + tj * 1.5) * 0.32 + noise.n2(ca * 17 + tj * 3, sa * 17 + key) * 0.18;
      const lump = noise.n2(ca * tj * 5 + key * 3, sa * tj * 5 + 9.1);
      const amp = smoothstep(0.02, 0.25, tj) * (1 - 0.6 * smoothstep(0.7, 1, tj));
      const r = R * tj * (1 + 0.1 * lump * amp) + (j === 0 ? 0 : 0);
      let y = foot + H * coneF(tj) * (1 + 0.16 * g * amp) + 22 * lump * amp;
      if (rim > 0) { const rr = R * tj; if (rr < rim) y = Math.min(y, top[1] - 60 * (1 - rr / rim) - 18 * noise.n2(ca * 2 + key, sa * 2)); else y = Math.min(y, top[1] + 14 * noise.n2(ca * 4.3 + key, sa * 4.3)); }
      const k = (j * SEG + i) * 3; pos[k] = top[0] + ca * r; pos[k + 1] = y; pos[k + 2] = top[2] + sa * r;
    }
    if (j % 5 === 4) await ctx.yield();
  }
  for (let j = 0; j < RING; j++) for (let i = 0; i < SEG; i++) { const a = j * SEG + i, b = j * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
  const uniforms = { ...sharedUniforms(S), uTop: { value: new THREE.Vector3(top[0], top[1], top[2]) }, uRock: { value: new THREE.Color(o.rock ?? '#17151B') }, uSnow: { value: new THREE.Color(o.snow ?? '#B7C6DD').multiplyScalar(0.92) },
    uLava: { value: new THREE.Color('#FF5A1E') }, uKind: { value: new THREE.Vector4(o.snowCover ?? 0.3, o.lava ?? 0, Math.max(rim, 60), R) },
    uThread: { value: new THREE.Vector3(...(o.threads ?? [0, 2, 4])) }, uHaze: { value: o.haze ?? 0.5 }, uRich: { value: o.rich ?? 0 }, uHazeCol: { value: new THREE.Color(o.hazeColor ?? '#22355E') } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: CONE_VS, fragmentShader: CONE_FS });
  const mesh = new THREE.Mesh(g, mat); mesh.name = o.name ?? 'cone'; mesh.frustumCulled = false;
  return { object: mesh, uniforms, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- the crater's flashes
// One every 4 to 9 s, each at a place low in the smoke over the crater. A pure function of the world clock, from a
// named stream of its own (dealt anew in fix round 3: the lobed column that used to keep this schedule is gone).
function makeFlashes(ctx, spine) {
  const r = ctx.core.makeRng(ctx.core.hashSeed('sledge-crater-flashes:' + ctx.seed)), PERIOD = 96, list = [];
  let t = r.range(1, 4);
  while (t < PERIOD - 3) { const k = r.range(0.08, 0.85), a = spine[0], b = spine[2];
    list.push({ t, k: r.range(0.6, 1), p: [lerp(a[0], b[0], k) + r.range(-50, 50), lerp(a[1], b[1], k), lerp(a[2], b[2], k) + r.range(-50, 50)] }); t += r.range(4, 9); }
  return (time) => { const tt = ((time % PERIOD) + PERIOD) % PERIOD; let best = null, bv = 0;
    for (const f of list) { const d = tt - f.t; if (d < 0 || d > 0.7) continue; const v = (d < 0.1 ? smoothstep(0, 0.1, d) : 1 - smoothstep(0.1, 0.5, d)) * f.k; if (v > bv) { bv = v; best = f; } }
    return { v: bv, f: best }; };
}

// ---------------------------------------------------------------- the hero, in the brief's coordinates
// opts: shared (the world's light uniforms), ground (x, z) => y of the land, look { eruption: 'strong' | 'waning' | 'surge' },
//       travellers (false to leave them out), track { x, z0, z1 }, cast { lead: 0 | 1, push: bool }
export const CRATER = [700, 1150, -2100];
// the column climbs from the crater and is sheared down the wind (toward -x, a little toward +z) into a long banner
// that passes far ahead of the lip and thins out; it never stands over the road
export const PLUME_SPINE = [[700, 1105, -2100, 115], [697, 1320, -2096, 150], [668, 1540, -2084, 200], [560, 1730, -2058, 255], [330, 1860, -2010, 300],
  [-60, 1940, -1940, 330], [-640, 1985, -1832, 340], [-1400, 2010, -1690, 300], [-2300, 2025, -1520, 200]];

// the kinds of thing the fire side deals, each from its own stream: the world hands these in from its one list of
// forks; alone in the part viewer the same list is taken here, before anything is built
export const HERO_FORKS = ['cone', 'tongues', 'bursts', 'rollers', 'steam', 'two'];
export async function buildHero(ctx, opts = {}) {
  const S = opts.shared || makeShared(), fk = opts.forks || forksOf(opts.rng || ctx.rng, HERO_FORKS), look = opts.look || {};
  const object = new THREE.Group(); object.name = 'passage-fire-side';
  const eruption = look.eruption || 'strong', waning = eruption === 'waning', surge = eruption === 'surge';
  const CL = waning ? 1.6 : surge ? 2.8 : 2.2, BL = waning ? 0.1 : surge ? 0.21 : 0.16;      // the vent's light on the plume, its belly's dull red
  const cone = await makeCone(ctx, S, { name: 'black-volcano', top: CRATER, foot: 60, radius: 1500, rim: 150, key: 3.7, rock: '#25222b', snowCover: 0.42, lava: 1, seg: 160, ring: 52,
    threads: [Math.PI * 0.57 + fk.cone.range(-0.12, 0.12) * 0.25, Math.PI * 0.66 + fk.cone.range(-0.1, 0.1) * 0.3, Math.PI * 0.49 + fk.cone.range(-0.1, 0.1) * 0.3] });
  // the threads of lava creep on a clock of their own that starts where the seed puts it
  const coneClock = { value: 0 }, conePhase = fk.cone.range(0, 600); cone.uniforms.uTime = coneClock;
  object.add(cone.object);
  await ctx.yield();
  const spine = PLUME_SPINE.map((p) => [p[0], waning && p[1] > 1400 ? lerp(p[1], 1400, 0.3) : p[1], p[2], p[3] * (waning ? 0.82 : 1)]);
  // the smoke is many soft billows riding the spine; the crater's flashes show as a light at the flash's place on them
  const flashAt = makeFlashes(ctx, spine);
  // the billows: a stream of their own (new in fix round 2). Each stretch of the spine has its own emitter; a billow
  // rides one and a half stretches, growing from the spine's width at its start to that at its end, and fades as the
  // next stretch's take over; further down the wind they are thinner, and stars show through.
  const br = ctx.core.makeRng(ctx.core.hashSeed('sledge-plume-billows:' + ctx.seed)), bem = [], BL_LIFE = 30, BL_DRAG = 0.05, BL_RISE = (1 - Math.exp(-BL_DRAG * BL_LIFE)) / BL_DRAG;
  for (let i = 0; i < spine.length - 1; i++) { const a = spine[i], b = spine[i + 1], k = 1.5 / BL_RISE;
    bem.push({ p: [a[0], a[1], a[2]], v: [(b[0] - a[0]) * k, (b[1] - a[1]) * k, (b[2] - a[2]) * k], spread: a[3] * 0.55, vr: 2, n: i < 3 ? 18 : 16, life: BL_LIFE, size: [a[3] * 2.3, b[3] * 2.7], tone: 1,
      alpha: [0.9, 0.88, 0.85, 0.8, 0.74, 0.64, 0.5, 0.36][i], drag: BL_DRAG, flat: 0.7 }); }
  // ash falls out of the banner in soft veils
  for (const i of [4, 5, 6]) { const a = spine[i]; bem.push({ p: [a[0], a[1] - a[3] * 0.7, a[2]], v: [-9, -24, 1.6], spread: a[3] * 0.8, vr: 3, n: 7, life: 26, size: [150, 430], tone: 1, alpha: 0.15, drag: BL_DRAG, flat: 0.3 }); }
  const mxs = opts.mx ?? 1;
  const billows = makePuffs(S, { rng: br, emitters: bem, wind: [0, 0, 0], name: 'plume-billows', ashTone: waning ? '#9a948d' : '#877f78', renderOrder: 4, soft: 1,
    glowAt: [CRATER[0] * mxs, CRATER[1] - 60, CRATER[2], 420], glowCol: '#d2511c', glowK: CL * 0.5 });
  object.add(billows.object);
  await ctx.yield();
  // the lava front on the fire side wall (it needs the land; the part viewer shows the mountain and plume without it)
  let lava = null;
  if (opts.ground && opts.lava !== false) { lava = await makeLavaFront(ctx, S, { rng: fk.tongues, burstsRng: fk.bursts, rollersRng: fk.rollers, steamRng: fk.steam, noise: ctx.noise, ground: opts.ground, wind: opts.wind || [-0.984, 0.178], pathX: 0, gap: opts.gap, surge, steam: waning ? 1.7 : 1 }); object.add(lava.object); }
  await ctx.yield();
  let travellers = null;
  if (opts.travellers !== false) { travellers = await buildTravellers(ctx, { shared: S, ground: opts.ground, track: opts.track, cast: opts.cast, rng: fk.two }); object.add(travellers.object); }
  const hero = {
    object, radius: 1100, height: 1100, center: new THREE.Vector3(450, 1100, -1900), ground: false,
    anchors: { crater: new THREE.Vector3(...CRATER), plumeBase: new THREE.Vector3(690, 1380, -2080) },
    cone, billows, lava, travellers, spine, flash: 0,
    // level: how strongly the mountain burns (the world lowers it after the lip, where it is later the same night); walk: metres the two have hauled
    update(dt, time, camera, level = 1, walk = null) {
      S.uTime.value = time;
      { const fl = flashAt(time); hero.flash = fl.v; billows.uniforms.uFlashCol.value.set('#d9c8ff').multiplyScalar(0.8 * fl.v * level);
        if (fl.f) billows.uniforms.uFlashAt.value.set(fl.f.p[0] * mxs, fl.f.p[1], fl.f.p[2], 110); }
      if (lava) { lava.update(time, level); hero.flash += 0.6 * lava.bursts.glow * level; }
      cone.uniforms.uKind.value.y = level; coneClock.value = time + conePhase;
      billows.uniforms.uGlowCol2.value.set('#d2511c').multiplyScalar(CL * 0.5 * level);
      if (travellers) travellers.update(dt, time, camera, walk ?? time * 0.9);
    },
  };
  return hero;
}
