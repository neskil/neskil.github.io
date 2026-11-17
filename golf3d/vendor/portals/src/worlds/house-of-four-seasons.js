// The House of Four Seasons: one court estate whose four gardens each keep one season. At the height of a boat and of a
// person we glide in one unbroken line over a spring lake among painted boats and blossom, up a stream under a gallery
// into a green summer dusk of fireflies, under the roofed crossing where the four gardens meet (the hero,
// src/parts/house-of-four-seasons.js), round a red maple hill in a low sun and into a moonlit court of snow.
// Compass: +X east, +Z south. The four quarters meet at the origin. Everything is one and a half times life size.
import * as THREE from 'three';
import { lerp } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import {
  buildHero, makeBuilder, makeTimberMaterial, makeGroundMaterial, groundGeometry, hallInto, galleryInto, roofInto, boatInto, duckInto, figureInto, sleeveInto,
  railInto, gardenColor, snowOn, snowNW, SETS, SURF, PAL, CROSS, crossUnder, lin, plumeGeometry, makeHours, hoursAt, hoursInto, floraHours, GLSL_FIELD, PLACE, makeEstate, JOIN, COVER, makeCover, hiddenSteps, dealRings, RAFT_RINGS, boatBeat, dealBall, sightFan, fanDist, BALL_PLACE, makeCourtSheet, COURT_SHEET, makeCourtAir, makeStandMap, makeWaterMaterial, makeCourseSheet,
} from '../parts/house-of-four-seasons.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
// the kit's clamp and smoothstep, written out (the same arithmetic without a call inside a call: the ground's colour asks them many thousand times)
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smoothstep = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- the places of the estate (metres): the part's plan
const { GY, LAKE, ISLE, POOL, ARC, HILL, KNOLL, FALL, FU, LIP, fallAt, ALAKE, GATE, HALLS, ICE, COURT } = PLACE;
// the ground's swell behind the fall's top lip
const CRAG = fallAt(FALL.steps[0][0] + 5);

export default {
  id: 'house-of-four-seasons',
  name: 'The House of Four Seasons',
  category: 'books',
  placeKind: 'domestic',
  book: 'The Tale of Genji',
  author: 'Murasaki Shikibu, about 973 to about 1014',
  media: ['air'],
  weirdness: 0.25,
  async build(ctx) {
    const noise = ctx.noise, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene(), tU = { value: 0 };
    // The build asks for a rest after every piece of work, and says how heavy the piece was: a weight of 1 for about three thousandths
    // of a second of work as it was measured on the crew's machine under load (most pieces), up to 5 for the long single pieces (a ground
    // sheet, a tree's shape, a lake), and 8 after a kit maker's first call, which is slow the first time. The engine hands the page back
    // once six milliseconds have gone, and each hand-back waits for a frame (a long wait on a loaded machine), so an ask is passed on only
    // when the weights since the last one add up to 8: a slice of about 24 thousandths under that load, less on a quiet machine.
    // The part's and the kit's makers ask through the same count.
    let owed = 0; const rest = (w = 1) => ((owed += w) < 8 ? undefined : (owed = 0, ctx.yield()));
    // Every drawn thing has a stream of its own, made from the world's seed and the thing's name: none draws from another, and
    // every draw of a stream is taken whatever is given from outside (the hour, the weather, the mood).
    const R = {};
    for (const name of ['visit', 'crossing', 'halls', 'boats', 'ducks', 'cherry', 'spring', 'kerria', 'wisteria', 'wood', 'summer', 'iris', 'field', 'maple', 'autumn', 'winter', 'pines', 'girls',
      'treeshapes', 'bushshapes', 'scatter', 'petals', 'leaves', 'snow', 'fireflies', 'fire', 'koi', 'heron', 'horses', 'smoke', 'stones', 'far', 'sift', 'birds',
      'ice', 'fall0', 'fall1', 'fall2', 'icestones', 'baskets', 'tracks', 'ledges', 'bough', 'plumes', 'litter', 'walkers', 'walker0', 'walker1', 'walker2', 'walker3', 'hallSpring', 'hallWing', 'hallFishing', 'hallSummer', 'hallStables', 'hallAutumn', 'hallWinter', 'glow0', 'glow1', 'glow3'])
      R[name] = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    for (const kind of ['cherry', 'shore', 'willow', 'isle', 'kerria', 'azalea', 'pine', 'hillwood', 'grove', 'bamboo', 'deutzia', 'orange', 'reed', 'northwood', 'maple', 'pampas', 'clover', 'darkwood', 'mum', 'snowpine', 'snowbush', 'pinewood', 'grass', 'flowers', 'iris', 'pinks', 'watchtree', 'egret', 'snowpinelow', 'fieldgrass', 'bough', 'lily', 'brooklily', 'mist', 'moonshade', 'wisteria'])
      for (const use of ['place', 'shape', 'tint']) R[use + ':' + kind] = ctx.core.makeRng(ctx.core.hashSeed(use + ':' + kind + ':' + ctx.seed));
    // a stream by its name, made when it is first asked for (each water, each water's rafts, the ball and the like have one each)
    const stream = (name) => (R[name] || (R[name] = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed))));
    // ------------------------------------------------------------ this visit
    const rv = R.visit;
    // (every draw of the stream is taken whether or not a value is given from outside: the layout is the same with and without a given mood)
    const moodDraw = rv();
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : 'day', rare = !!vary.rare, mood = clamp(vary.mood ?? moodDraw, 0, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3), many = dens * detail;
    const snowing = mood < 0.5, setK = mood < 0.5 ? 0 : 1, night = hour === 'night';
    // which of the two boats holds the dealt phase on their beat beside the lane (the other lies half a round behind it)
    const nearDragon = rv.chance(0.5);
    // where on the island's north shore the bridge lands
    const bridgeBearing = rv.range(-0.5, 0.5);
    // how many children play in the snow, and which bay of the fishing pavilion the fireflies gather under
    const girlCount = rv.int(4, 6), fireflyBay = rv.int(1, 6);

    // ------------------------------------------------------------ the route, the watercourses and the ground rule: the part's plan, laid with this build's noise
    const E = await makeEstate(noise, rest);
    const { knots, path, LEN, route, nearRoute, metresAt, mMouth, mBridge, mArc1, mNorth1, mBrook, mCross, mArc2, mSouth2, mWest2, mGate } = E;
    const { course, courseM, waterY, halfW, polyDist, SIDE, courseDist, courseMetres, leg, rightN, lakeIn, alakeIn, iceIn, iceLine, iceHalf, heightAt } = E;
    const WH = HALLS.winter;
    // ------------------------------------------------------------ the four standing hours (spring's is the visit's; the other three are the book's)
    // Whatever stands is lit by the hour of its own place (the part's light chunk reads each fragment's world x, z). What has
    // no place of its own (the sky's dome, the air's haze over the kit's water and motes) is read from where the eye stands
    // in the estate. Nothing is read from the metres flown or the clock, and no light's direction is ever blended.
    const H = makeHours({ hour, storm: rare, snowing, time: tU }), HU = H.uniforms;
    const STATES = H.hours.map((h) => {
      const o = h.raw, sun = h.sun;
      return { ...h, water: Water.waterLight({ preset: o.preset, sunDir: [sun.x, sun.y, sun.z], sunColor: o.sunCol, sunIntensity: o.sunI * h.expo * 0.8, zenith: o.zen, horizon: o.hor, scatterColor: o.glow, fogColor: o.fog, clouds: false }) };
    });
    // the water of each garden mirrors its own garden's sky for ever
    const WLq = STATES.map((s) => s.water);
    scene.fog = new THREE.FogExp2(STATES[0].fog.clone(), STATES[0].fogD);
    // The dome: four skies and four bodies at four stations for ever. The sky over a garden is that garden's: a part of the
    // sky takes the weights of the ground it stands over (overhead the eye's own place, toward the horizon up to 120 m out along
    // the bearing; a join is 40 m wide overhead and wider the farther out its ground lies). THE GLOW IS THE SKY'S: every body's glow (a sun's lobe, the afterglow, the
    // moon's halo and ring) takes, at each part of the sky, the weight of its own sky at that part, as the stars do; there is no
    // other law for a glow. The moon's disc is at full strength for ever, in every garden's sky. A SUN'S DISC CHANGES ONLY BEHIND
    // WHAT STANDS: it is whole wherever the eye stands on its own garden's ground, nought on any other, and the line between the
    // two lies, where the lane passes under a dividing roof, on a stretch of the lane from every metre of which the world hides
    // the disc's whole face (found when the estate is built by rays cast at the buildings that stand there; see the
    // end of build). The two numbers of each line are that stretch's two ends; nothing else sets where or how long.
    const each = (f) => ({ value: STATES.map(f) });
    // (a line of a disc's ground: where it is nought, and one over its breadth; until the stretches are found every line lies far off)
    const domeU = { uZen: each((s) => s.zen), uHor: each((s) => s.hor), uGlow: each((s) => s.glow), uSunDir: each((s) => s.sun), uDisc: each((s) => s.disc), uFog: each((s) => s.fog), uCloud: each((s) => s.cloud),
      uP: each((s) => new THREE.Vector4(s.discSize, s.stars, s.cloudAmt, s.ring)), uEye: { value: new THREE.Vector3(knots[0][0], knots[0][1], knots[0][2]) }, uTime: tU,
      uDX: each(() => new THREE.Vector2(-1e4, 1)), uDZ: each(() => new THREE.Vector4(-1e4, 1, -1e4, 1)) };
    // (how light each sky is at its horizon, even to the eye; a sky darker than the mean of the other three by a third of the whole scale yields later: see the dome)
    { const lt = STATES.map((st) => Math.pow(0.2126 * st.hor.r + 0.7152 * st.hor.g + 0.0722 * st.hor.b, 1 / 2.4)); domeU.uYield = { value: new THREE.Vector4(...lt.map((l) => 1 - smoothstep(0.12, 0.33, (lt[0] + lt[1] + lt[2] + lt[3] - l) / 3 - l))) }; }
    // HOW TWO SKIES MEET IN ONE PICTURE. (1) A join is as wide as it is far: at a part of the sky whose ground place lies s metres
    // from the eye the join's half width is 20 + s / 2 metres (overhead, s nought, 20). (2) The skies cross by lightness: each of
    // the four is worked whole in its own hour (its colours, its body's glow, its stars, its cloud, its far ridge and haze), and
    // the four are mixed by the weights in an encoding even to the eye (each colour to the power 1 / 2.4, mixed, and back), not as
    // light. Both read what the dome always read, the eye's place and the bearing. Only the dome: whatever stands keeps its own joins.
    // a body with a sun's disc of its own (the moon's is full for ever; the afterglow and a night's spring have none)
    const hasDisc = (i) => !STATES[i].moon && STATES[i].raw.disc > 0;
    // the disc's ground: east or west of one line and south of another; the second line is the crossing's own as far west as the
    // crossing's eave and the border gallery's from where that gallery begins (the foot of the crossing's west stair)
    const discLaw = (i) => `smoothstep(0., 1., min(clamp((uEye.x - uDX[${i}].x) * uDX[${i}].y, 0., 1.), clamp((uEye.z - dl.x) * dl.y, 0., 1.)))`;
    // one garden's sky, whole, at this part of the dome; its share is laid on in the even encoding; its disc's light is kept apart
    // (a night sky's red and green ease to the level the court's own grade shows as black, and do not fall under it: the moon's
    // lobe then fades into the dark with a round knee and not at a line; no part of that sky is shown lighter by 3 of 255)
    const sky1 = (i) => `{ float dt = dot(d, uSunDir[${i}]), sd = clamp(dt, 0., 1.), rq = (acos(clamp(dt, -1., 1.)) - 0.17) / 0.02; vec2 dl = mix(uDZ[${i}].xy, uDZ[${i}].zw, smoothstep(${CROSS.eave.toFixed(1)}, ${CROSS.stub.toFixed(1)}, -uEye.x)); float bk = ${hasDisc(i) ? discLaw(i) : '1.'};
            vec3 ci = mix(uHor[${i}], uZen[${i}], g) + uGlow[${i}] * ((0.42 * pow(sd, 5.) + 0.5 * pow(sd, 48.)) * (1. - 0.5 * t) + uP[${i}].w * 0.07 * exp(-rq * rq)) + vec3(0.8, 0.86, 1.0) * (st * uP[${i}].y);
            ci = mix(ci, uCloud[${i}] * (0.75 + 0.5 * n) + uGlow[${i}] * (0.5 * pow(sd, 3.)), smoothstep(0.92 - mix(cloudAll, uP[${i}].z, own), 1.3 - mix(cloudAll, uP[${i}].z, own), n) * clH * 0.6);
            ci = mix(ci, mix(uFog[${i}], uZen[${i}] * 0.6 + uHor[${i}] * 0.25, 0.42), rk); ci = mix(uFog[${i}], ci, hz);
            ${STATES[i].moon ? '{ vec2 kx = (ci.rg - 0.031) / 0.0028; ci.rg = mix(ci.rg, 0.031 + 0.0028 * (max(kx, 0.) + log(1. + exp(-abs(kx)))), own); }' : ''}
            vec3 ei = pow(max(ci, vec3(1e-6)), vec3(pw)); acc += w[${i}] * ei; chr += w[${i}] * (max(ei.r, max(ei.g, ei.b)) - min(ei.r, min(ei.g, ei.b))); cloudAmt += w[${i}] * uP[${i}].z; disc += uDisc[${i}] * bk * smoothstep(uP[${i}].x, uP[${i}].x + 0.00012, dt); }`;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: domeU,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 uZen[4]; uniform vec3 uHor[4]; uniform vec3 uGlow[4]; uniform vec3 uSunDir[4]; uniform vec3 uDisc[4]; uniform vec3 uFog[4]; uniform vec3 uCloud[4]; uniform vec4 uP[4];
        uniform vec3 uEye; uniform float uTime; uniform vec2 uDX[4]; uniform vec4 uDZ[4]; varying vec3 vDir;
        float hh(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
        float hn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x), mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x), f.y); }
        float fb(vec2 p){ return hn(p)*.5 + hn(p*2.07+3.1)*.27 + hn(p*4.3+7.7)*.15 + hn(p*8.9+1.3)*.08; }
        // (the dome's own weights of the four gardens' ground: the estate's field, eased with no corner at either end of a join,
        // so that no line can be traced in the sky where a join begins or ends)
        // (k: how far the ease is the cornerless one; at nought it is the estate's plain ease, as the ground's own joins have)
        uniform vec4 uYield;
        float e5(float a, float b, float x, float k){ float q = clamp((x - a) / (b - a), 0., 1.); return mix(q * q * (3. - 2. * q), q * q * q * (q * (q * 6. - 15.) + 10.), k); }
        vec4 d4At(vec2 p, float hs, float k){
          float e = e5(-hs, hs, p.x, k), zd = ${JOIN.hallZ.toFixed(1)} * smoothstep(${JOIN.turn0.toFixed(1)}, ${JOIN.turn1.toFixed(1)}, p.x), se = e5(zd - hs, zd + hs, p.y, k), sw = e5(-hs, hs, p.y, k);
          return vec4(e * se, e * (1. - se), (1. - e) * sw, (1. - e) * (1. - sw));
        }
        void main(){
          vec3 d = normalize(vDir); float h = d.y, t = clamp(h, 0., 1.), g = pow(t, 0.55), lowK = (1. - t) * (1. - t) * (1. - t);
          float reach = 120. * lowK;
          // A DARK SKY YIELDS LATER. From the ground of a garden whose sky is much darker than the estate's others (uYield: nought for
          // such a garden, one for the rest; the court's night is the only such) a join keeps the width it has overhead, 20 m either
          // side of the gardens' line, however far out its ground lies: the night gives way only where the sky's ground place has
          // left the court, and no far sky is spread up into it. From every other garden's ground a join is as wide as it is far.
          // Where the eye passes from such a garden to another the two laws change into one another with the eye's own place.
          // And from such a garden's ground the skies mix as light does (a bright sky's glow spills into the night in its own
          // measure, as live's did: the night stays as light as it was); from every other garden's they mix even to the eye (pw).
          // (the dark garden's law is whole from 12 m inside its line: a night sky shows a hundredth of a bright one, so it waits no longer)
          float own = smoothstep(0.1, 1., dot(d4At(uEye.xz, 20., 0.), uYield)), pw = mix(1., 1. / 2.4, own);
          vec4 w = d4At(uEye.xz + d.xz / max(length(d.xz), 1e-4) * reach, 20. + 0.5 * reach * own, own);
          vec3 acc = vec3(0.), disc = vec3(0.); float cloudAmt = 0., chr = 0.;
          // (and from such a garden's ground the skies that cross carry one cloud cover between them, the mean of their own, as live's did)
          float cloudAll = dot(w, vec4(uP[0].z, uP[1].z, uP[2].z, uP[3].z));
          vec2 sp = d.xz / max(d.y + 0.16, 0.05);
          vec2 sc = floor(sp * 90.), sf = fract(sp * 90.) - 0.5 - 0.2 * (vec2(hh(sc + 3.), hh(sc + 5.)) - 0.5);
          float st = step(0.9965, hh(sc)) * smoothstep(0.22, 0.05, length(sf)) * (0.6 + 0.4 * sin(uTime * 2.3 + hh(sc + 7.) * 40.)) * smoothstep(0.05, 0.3, h) * 1.6;
          float n = fb(sp * 0.9 + vec2(uTime * 0.006, uTime * 0.002)), clH = smoothstep(0.015, 0.2, h);
          float az = atan(d.z, d.x), ridge = 0.016 + 0.03 * hn(vec2(az * 3.1, 2.)) + 0.012 * hn(vec2(az * 11., 5.));
          float rk = smoothstep(ridge + 0.004, ridge - 0.004, h), hz = smoothstep(-0.01, 0.045, h);
          ${sky1(0)}
          ${sky1(1)}
          ${sky1(2)}
          ${sky1(3)}
          // THE MIX DOES NOT GREY. Where skies of different hue cross, the mix (even to the eye in lightness) would lose its colour
          // on the way; its chroma (the spread of its three channels in the even encoding) is raised, about its own lightness, to the
          // weighted mean of the chroma the crossing skies have at that part; a part under one sky alone is left as it is.
          // (From a dark garden's ground, where the skies mix as light does, the mix is left as light makes it.)
          float cm = max(acc.r, max(acc.g, acc.b)) - min(acc.r, min(acc.g, acc.b));
          if (chr > cm && cm > 1e-4) { float lm = dot(acc, vec3(0.2126, 0.7152, 0.0722)); acc = max(vec3(lm) + (acc - lm) * mix(1., min(chr / cm, 2.5), own), 0.); }
          vec3 c = pow(acc, vec3(1. / pw));
          // (from a dark garden's own ground the knee is the mixed sky's, by the night's share of it: where another sky has lifted the
          // mix clear of that level nothing is added; from the other gardens' it is the night sky's own, before the mix, as above)
          { vec2 kx = (c.rg - 0.031) / 0.0028; c.rg = mix(c.rg, 0.031 + 0.0028 * (max(kx, 0.) + log(1. + exp(-abs(kx)))), (1. - own) * (${STATES.map((st, i) => (st.moon ? `w[${i}]` : '')).filter(Boolean).join(' + ') || '0.'})); }
          c += disc * ((1. - 0.8 * smoothstep(0.92 - cloudAmt, 1.3 - cloudAmt, n) * clH) * (1. - rk) * hz);
          gl_FragColor = vec4(c, 1.0);
        }` }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    await rest(8);

    // ------------------------------------------------------------ the ground: colour, shade under the roofs, four quarters and a fine strip along the water
    const softBox = (x, z, cx, cz, hw, hd, yaw, soft) => { const c = Math.cos(yaw), s = Math.sin(yaw), dx = x - cx, dz = z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c; return 1 - smoothstep(-soft * 0.3, soft, Math.max(Math.abs(lx) - hw, Math.abs(lz) - hd)); };
    const quarterOf = (x, z) => (z > 0 ? (x > 0 ? 0 : 2) : (x > 0 ? 1 : 3));
    // where a roof's shade falls in each quarter: away from that quarter's light, as long as the eave is high (at most 14 m)
    const shadeOff = STATES.map((s, i) => { const hl = Math.hypot(s.sun.x, s.sun.z) || 1, reach = i === 1 ? 0 : Math.min(14, 7.5 / Math.max(Math.tan(s.raw.el * DEG), 0.2)); return [-s.sun.x / hl * reach, -s.sun.z / hl * reach]; });
    const roofs = [];
    for (const k of Object.keys(HALLS)) { const h = HALLS[k], turn = !!h.yaw; roofs.push([h.x, h.z, (turn ? h.d : h.w) / 2 + 4, (turn ? h.w : h.d) / 2 + 4]); }
    // the court's three storehouses [x, z, width, depth] and the two pavilions at the ends of the hall's side galleries
    const STORES = [[-82, -150, 15, 10], [-70, -176, 13, 10], [-166, -212, 15, 10]], WINGS = [-1, 1].map((sg) => [HALLS.winter.x + sg * HALLS.winter.w / 2, -158]);
    roofs.push([0, 0, CROSS.eave, CROSS.eave]); for (const st of STORES) roofs.push([st[0], st[1], st[2] / 2 + 2.4, st[3] / 2 + 2.4]); for (const w of WINGS) roofs.push([w[0], w[1], 7, 6.5]);
    const shadeAt = (x, z) => {
      const off = shadeOff[quarterOf(x, z)]; let k = 0;
      for (let k2 = 0; k2 < roofs.length; k2++) {
        const r = roofs[k2]; if (Math.abs(x - r[0]) > r[2] + 20 || Math.abs(z - r[1]) > r[3] + 20) continue;
        for (let i = 0; i <= 2; i++) k = Math.max(k, softBox(x, z, r[0] + off[0] * i * 0.5, r[1] + off[1] * i * 0.5, r[2], r[3], 0, 3) * (i === 0 ? 1 : 0.8));
      }
      return k;
    };
    const C = { sand: mul(lin('#e6dfcf'), 0.78), earth: lin('#a08a64'), pebble: lin('#6a6252'), bed: lin('#6f8a94'), litter: lin('#7a3420'), pink: lin('#f3c9d2'), mossy: lin('#31502c'), moss2: lin('#566a2c'), deepLitter: lin('#4a2416'), leafRed: [0.55, 0.125, 0.045], leafOrange: [0.62, 0.25, 0.055], leafGold: [0.57, 0.35, 0.085], rock: lin('#6e6a66'), stone: lin('#a39c92') };
    // (C.bed, the floor under deep water, is the water's own grey-blue: it is never seen through the water, only where an opening's camera
    // behind the entry cuts the lake's surface away before the entry, and there it must read as water)
    const courts = [[90, 52, 27, 17, 0.9], [89, -91, 20, 6, 0.8], [170, -65, 19, 44, 0.75], [-158, 40, 10, 14, 0.7], [152, 60, 10, 14, 0.5]];
    const groundColor = (x, z, y) => {
      const n = 0.5 + 0.5 * noise.n2(x * 0.045, z * 0.045), n2 = 0.5 + 0.5 * noise.n2(x * 0.19 + 9, z * 0.19 - 4), q = quarterOf(x, z);
      const g = gardenColor(x, z, n); let c = [g[0], g[1], g[2]], snow = g[3], sand = 0;
      for (let i = 0; i < courts.length; i++) {
        const ct = courts[i]; if (Math.abs(x - ct[0]) > ct[2] + 5 || Math.abs(z - ct[1]) > ct[3] + 5) continue;
        const k = softBox(x, z, ct[0], ct[1], ct[2], ct[3], 0, 4) * ct[4] * (1 - snow);
        if (k > 0.01) { c = mix3(c, i === 2 ? C.earth : C.sand, k); sand = Math.max(sand, k); }
      }
      const up = smoothstep(GY + 0.6, GY + 5, y);
      if (up > 0) c = mix3(c, q === 2 ? mix3(C.litter, C.mossy, n2 * 0.5) : q === 3 ? c : mix3(C.mossy, c, 0.4 + 0.3 * n), up * 0.85);
      // (a garden's own floor comes in with that garden's share of the ground under the dividing roofs, as its base colour does: no step at the line)
      const ge = smoothstep(-5, 5, x), gs = smoothstep(-5, 5, z), wSpring = ge * gs, wSummer = ge * (1 - gs), wAutumn = (1 - ge) * gs;
      if (wSpring > 0.01 && sand < 0.5) c = mix3(c, C.pink, 0.42 * smoothstep(0.52, 0.8, n2) * smoothstep(-22, -2, lakeIn(x, z)) * wSpring);
      if (wAutumn > 0.01 && sand < 0.5) {
        // the autumn floor: deep leaf litter under and round the maples, moss in the dale by the water and in patches, dry grass between
        const wood = Math.max(smoothstep(74, 34, Math.hypot(x - HILL.x, z - HILL.z)), smoothstep(52, 30, Math.hypot(x - KNOLL.x, z - KNOLL.z))), n3 = 0.5 + 0.5 * noise.n2(x * 0.085 - 31, z * 0.085 + 12);
        // (the litter's own colour by the place: red under one stretch of the maples, orange under the next, gold further on; what
        // grows in it takes this tone at its foot)
        const zn = 0.5 + 0.5 * noise.n2(x * 0.028 + 17, z * 0.028 - 23) + 0.25 * (n2 - 0.5);
        const leaf = zn < 0.52 ? mix3(C.leafRed, C.leafOrange, smoothstep(0.3, 0.5, zn)) : mix3(C.leafOrange, C.leafGold, smoothstep(0.55, 0.75, zn));
        c = mix3(c, mul(leaf, 0.6 + 0.3 * n2), smoothstep(0.3, 0.62, n * 0.5 + n2 * 0.25 + wood * 0.55) * 0.85 * wAutumn);
        c = mix3(c, mix3(C.mossy, C.moss2, n2), Math.max(smoothstep(0.52, 0.8, n3) * 0.75, smoothstep(GY - 0.05, GY - 0.45, y) * 0.8) * wAutumn);
      }
      if (wSummer > 0.01) c = mix3(c, C.mossy, 0.6 * smoothstep(0.35, 0.75, n2) * (1 - sand) * wSummer);
      const crag = Math.hypot(x - CRAG[0], z - CRAG[1]); if (crag < 12) c = mix3(c, mul(C.rock, 0.7 + 0.5 * n2), smoothstep(12, 6, crag));
      const wet = smoothstep(GY - 0.45, GY - 0.95, y);
      if (wet > 0) { c = mix3(c, mul(q === 0 || q === 2 ? mix3(C.pebble, C.mossy, 0.55) : C.pebble, 0.75 + 0.5 * n2), wet * (1 - 0.7 * snow)); c = mix3(c, C.bed, smoothstep(-0.2, -1.2, y)); snow *= 1 - smoothstep(GY - 0.5, GY - 1.1, y); sand = Math.max(sand, wet * 0.8); }
      // the court's snow is a little bluer in its hollows than on its drifts
      if (q === 3 && snow > 0.5) { const k = smoothstep(GY - 0.3, GY + 0.9, y); c = [c[0] * (0.86 + 0.14 * k), c[1] * (0.9 + 0.1 * k), c[2]]; }
      const sh = shadeAt(x, z);
      if (sh > 0) c = [c[0] * (1 - 0.55 * sh), c[1] * (1 - 0.5 * sh), c[2] * (1 - 0.36 * sh)];
      return [c[0], c[1], c[2], snow, sand];
    };
    // the court's sheet (the part's makeCourtSheet): the ground's shader reads it; it is laid further on, when everything of the court stands
    const courtSheet = makeCourtSheet(STATES[3].sun);
    // (the brook's straight line from the crossing down the field, for the ground's wet line: its direction, and where along it the water begins to fall and has fallen)
    const brookLine = (() => { const a = route[mCross], b = route[mArc2], l = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / l, uz = (b.z - a.z) / l, d0 = a.x * ux + a.z * uz; return new THREE.Vector4(ux, uz, d0 + 12, d0 + mArc2 + 20 - mCross); })();
    const groundMat = makeGroundMaterial({ uTime: tU, court: courtSheet.uniforms, wet: { value: brookLine } }, HU), grounds = [[], [], [], []];
    // (a quarter's sheet leaves out the cells whose middle lies within 12.5 m of the watercourse or 7 m of the frozen stream's line: the fine strips lie there)
    const iceEnd = (a, b2, m) => { const l = Math.hypot(a[0] - b2[0], a[1] - b2[1]); return [a[0] + (a[0] - b2[0]) / l * m, a[1] + (a[1] - b2[1]) / l * m]; };
    const iceDrop = [iceEnd(iceLine[0], iceLine[1], 6)].concat(iceLine);
    const nearCourse = (x, z) => (E.courseNear(x, z) && courseDist(x, z)[0] < 12.5) || (x < -112 && x > -166 && z < 12 && z > -196 && polyDist(iceDrop, x, z)[0] < 7);
    for (let q = 0; q < 4; q++) {
      const sx = q === 0 || q === 1 ? 1 : -1, sz = q === 0 || q === 2 ? 1 : -1;
      for (let half = 0; half < 3; half++) {
        const za = sz * 85 * half, zb = sz * 85 * (half + 1);
        const g = await groundGeometry({ x0: Math.min(0, sx * 215), x1: Math.max(0, sx * 215), z0: Math.min(za, zb), z1: Math.max(za, zb), cell: 4.4, heightAt, colorAt: groundColor, keep: (x, z) => !nearCourse(x, z), rest: q ? undefined : () => rest(3) });
        const mesh = new THREE.Mesh(g, groundMat); scene.add(mesh); grounds[q].push(mesh);
        // (the first quarter's sheets are the first use of the ground's rules and take twice as long as the later ones: they ask inside too)
        await rest(4);
      }
    }
    // a fine strip along a line of water: banks and bed at about a metre across and three along, laid a finger above the quarters
    const stripMeshes = [];
    const stripAlong = async (st, offs, parts) => {
      const no = offs.length, reach = offs[no - 1], per = Math.ceil(st.length / parts);
      for (let part = 0; part < parts; part++) {
        const i0 = part * per, i1 = Math.min(st.length - 1, (part + 1) * per), ns = i1 - i0 + 1; if (ns < 2) continue;
        const P = new Float32Array(ns * no * 3), Cc = new Float32Array(ns * no * 3), G = new Float32Array(ns * no * 2), I = [];
        for (let i = 0; i < ns; i++) {
          const a = st[Math.max(0, i0 + i - 1)], c2 = st[Math.min(st.length - 1, i0 + i + 1)], p = st[i0 + i]; let tx = c2[0] - a[0], tz = c2[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
          for (let j = 0; j < no; j++) {
            const x = p[0] - tz * offs[j], z = p[1] + tx * offs[j], y = heightAt(x, z), cc = groundColor(x, z, y), k = (i * no + j);
            P[k * 3] = x; P[k * 3 + 1] = y + 0.04 * (1 - Math.abs(offs[j]) / reach); P[k * 3 + 2] = z; Cc[k * 3] = cc[0]; Cc[k * 3 + 1] = cc[1]; Cc[k * 3 + 2] = cc[2]; G[k * 2] = cc[3]; G[k * 2 + 1] = cc[4];
          }
          if (i % 16 === 15) await rest();
        }
        for (let i = 0; i < ns - 1; i++) for (let j = 0; j < no - 1; j++) { const a = i * no + j, b2 = a + 1, c2 = a + no, d = c2 + 1; I.push(a, b2, c2, b2, d, c2); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setAttribute('aG', new THREE.BufferAttribute(G, 2)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere();
        const mesh = new THREE.Mesh(g, groundMat); scene.add(mesh); stripMeshes.push(mesh);
      }
    };
    {
      const st = []; for (let i = 0; i < course.length - 1; i++) { const a = course[i], b2 = course[i + 1], L = Math.hypot(b2[0] - a[0], b2[1] - a[1]), n = Math.max(1, Math.round(L / 3)); for (let k = 0; k < n; k++) st.push([lerp(a[0], b2[0], k / n), lerp(a[1], b2[1], k / n)]); }
      st.push(course[course.length - 1]);
      await stripAlong(st, [-17, -13.2, -10.4, -8.4, -7, -5.9, -4.9, -3.8, -1.9, 0, 1.9, 3.8, 4.9, 5.9, 7, 8.4, 10.4, 13.2, 17], 4);
      // the frozen stream's banks and bed, from 18 m beyond its pool to 12 m beyond its end under the border gallery
      const n = iceLine.length, lead = [6, 5, 4, 3, 2, 1].map((k) => iceEnd(iceLine[0], iceLine[1], k * 3)), tail = [1, 2, 3, 4].map((k) => iceEnd(iceLine[n - 1], iceLine[n - 2], k * 3));
      await stripAlong(lead.concat(iceLine, tail), [-10, -7.6, -5.6, -4.2, -3.2, -2.3, -1.2, 0, 1.2, 2.3, 3.2, 4.2, 5.6, 7.6, 10], 2);
    }
    await rest();

    // ------------------------------------------------------------ water: two lakes, the cool spring, the stream and brook, the fall
    // each water has a stream of its own name: no maker stands before another on one stream
    const pool = Water.makeLake({ rng: stream('water:pool'), light: WLq[1], level: 0.12, center: [POOL.x, POOL.z], radius: POOL.r + 3, segments: 22, depthAt: (x, z) => (POOL.r - Math.hypot(x - POOL.x, z - POOL.z) > -1.5 ? 0.12 - heightAt(x, z) : -1),
      deep: '#16382e', shallow: '#7fb09a', ripple: 0.6, shoreFoam: 0.2, foamWidth: 1.2, band: { color: '#1f3a28', top: '#4a7a5a', height: 0.2, amount: 0.8 } });
    await rest(4);
    // the frozen stream and its pool: one sheet of the kit's ice along the stream's line and over the pool. Its light is the court's moon,
    // which stands north-north-west for ever: the moon's road lies on the ice toward the hall.
    const iceGeo = (() => {
      const offs = [-5.2, -4.2, -3.2, -2.2, -1.1, 0, 1.1, 2.2, 3.2, 4.2, 5.2], no = offs.length, ns = iceLine.length, P = [], D = [], I = [];
      const quads = (base, nu, nv, turned) => { for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) { const a = base + v * (nu + 1) + u, b2 = a + 1, c2 = a + nu + 1, d = c2 + 1; if (D[a] > 0 || D[b2] > 0 || D[c2] > 0 || D[d] > 0) { if (turned) I.push(a, b2, c2, b2, d, c2); else I.push(a, c2, b2, b2, c2, d); } } };
      for (let i = 0; i < ns; i++) {
        const a = iceLine[Math.max(0, i - 1)], c2 = iceLine[Math.min(ns - 1, i + 1)], p = iceLine[i]; let tx = c2[0] - a[0], tz = c2[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        for (let j = 0; j < no; j++) { const x = p[0] - tz * offs[j], z = p[1] + tx * offs[j]; P.push(x, 0, z); D.push(3 * (ICE.level - heightAt(x, z))); }
      }
      quads(0, no - 1, ns - 1, true);
      const base = P.length / 3, n = 10, c = ICE.pool, w = c[2] * 2 + 5;
      for (let v = 0; v <= n; v++) for (let u = 0; u <= n; u++) { const x = c[0] + (u / n - 0.5) * w, z = c[1] + (v / n - 0.5) * w; P.push(x, 0, z); D.push(3 * (ICE.level - heightAt(x, z))); }
      quads(base, n, n);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aDepth', new THREE.Float32BufferAttribute(D, 1)); g.setIndex(I); g.computeBoundingSphere();
      return g;
    })();
    const ice = Water.makeLake({ frozen: true, rng: R.ice, light: WLq[3], level: ICE.level, geometry: iceGeo, ice: '#8ea8dc', deep: '#081430', crackColor: '#dfeaff', snowColor: '#dfe8f6', snow: 0.16, roughness: 0.06, crackScale: 5, thickness: 0.8, shoreSlope: 0.25 });
    // (polished ice gives the moon back more whole than snow does: on the ice alone the moon's key is two fifths stronger, so its road lies as bright and as long as it did)
    ice.object.material.uniforms.uSunColor = { value: WLq[3].sunColor.clone().multiplyScalar(1.4) };
    await rest(4);
    // the stream and the brook: calm ribbons of the lake's own water along the whole course (its ripples keep their size in metres), one for
    // each garden it runs through, each mirroring that garden's trees as a band of their colour; under the gallery-bridge and under the crossing the next ribbon lies over the last for 30 m and thickens out of nothing along them, and the last thins away under it
    const ribbonRows = [];
    for (let i = 0; i < course.length - 1; i++) { const a = course[i], b2 = course[i + 1], L = Math.hypot(b2[0] - a[0], b2[1] - a[1]), n = Math.max(1, Math.round(L / 3)); for (let k = 0; k < n; k++) ribbonRows.push([lerp(a[0], b2[0], k / n), lerp(a[1], b2[1], k / n), lerp(courseM(i), courseM(i + 1), k / n)]); }
    // WHERE THE WATER QUICKENS (0 glass .. 1 riffle), by the course's own shape: where it runs narrower than it does over the 28 m about
    // the place (the noise of its width, so glass and riffle alternate on every seed), and more so there where its bed falls (the brook's descent to the autumn lake)
    const quickens = (m) => { const hw = halfW(m), mean = (halfW(m - 14) + hw + halfW(m + 14)) / 3, fall = (waterY(m - 3) - waterY(m + 3)) / 6; return clamp(smoothstep(0.05, 0.45, mean - hw) * (1 + 0.6 * smoothstep(0.002, 0.008, fall)), 0, 1); };
    // a place by the course: [metres along it, metres across it (to the ribbons' own side)]
    const courseAt = (x, z) => { const t = courseDist(x, z)[1], i = Math.min(course.length - 2, Math.floor(t)), a = course[i], b2 = course[i + 1], tx = b2[0] - a[0], tz = b2[1] - a[1], tl = Math.hypot(tx, tz) || 1, f = t - i; return [courseMetres(t), ((x - lerp(a[0], b2[0], f)) * -tz + (z - lerp(a[1], b2[1], f)) * tx) / tl]; };
    // the place `off` metres across the course at its metre m (to the ribbons' own side)
    const pointOn = (m, off) => { let j = 0; while (j < ribbonRows.length - 2 && ribbonRows[j + 1][2] < m) j++; const a = ribbonRows[j], b2 = ribbonRows[j + 1], t = clamp((m - a[2]) / Math.max(1e-6, b2[2] - a[2]), 0, 1), tx = b2[0] - a[0], tz = b2[1] - a[1], tl = Math.hypot(tx, tz) || 1; return [lerp(a[0], b2[0], t) - tz / tl * off, lerp(a[1], b2[1], t) + tx / tl * off]; };
    const ribbonOf = (m0, m1, rise) => {
      const offs = [-7, -6, -5.2, -4.4, -3.4, -2.2, -1.1, 0, 1.1, 2.2, 3.4, 4.4, 5.2, 6, 7], no = offs.length, all = ribbonRows, i0 = Math.max(0, all.findIndex((r) => r[2] >= m0) - 1), st = all.filter((r, i) => i >= i0 && r[2] <= m1 + 2);
      const ns = st.length, P = new Float32Array(ns * no * 3), D = new Float32Array(ns * no), Sh = new Float32Array(ns * no), FL = new Float32Array(ns * no * 4), DR = new Float32Array(ns * no * 2), I = [];
      for (let i = 0; i < ns; i++) {
        const a = all[Math.max(0, i0 + i - 1)], c2 = all[Math.min(all.length - 1, i0 + i + 1)], p = st[i]; let tx = c2[0] - a[0], tz = c2[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const wy = waterY(p[2]), hw = halfW(p[2]), rif = quickens(p[2]);
        for (let j = 0; j < no; j++) { const x = p[0] - tz * offs[j], z = p[1] + tx * offs[j], k = i * no + j; P[k * 3] = x; P[k * 3 + 1] = wy; P[k * 3 + 2] = z; FL[k * 4] = p[2]; FL[k * 4 + 1] = offs[j]; FL[k * 4 + 2] = hw; FL[k * 4 + 3] = rif; DR[k * 2] = tx; DR[k * 2 + 1] = tz; D[k] = (wy - heightAt(x, z)) * (rise ? Math.pow(clamp((p[2] - m0) / rise, 0, 1), 2) : 1) * clamp((m1 - p[2]) / 10, 0, 1); Sh[k] = hw + 0.6 - Math.abs(offs[j]); }
      }
      for (let i = 0; i < ns - 1; i++) for (let j = 0; j < no - 1; j++) { const a = i * no + j, b2 = a + 1, c2 = a + no, d = c2 + 1; if (D[a] > 0 || D[b2] > 0 || D[c2] > 0 || D[d] > 0) I.push(a, b2, c2, b2, d, c2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aDepth', new THREE.BufferAttribute(D, 1)); g.setAttribute('aShore', new THREE.BufferAttribute(Sh, 1)); g.setAttribute('aFlow', new THREE.BufferAttribute(FL, 4)); g.setAttribute('aDir', new THREE.BufferAttribute(DR, 2)); g.setIndex(I); g.computeBoundingSphere();
      return g;
    };
    // THE ESTATE'S OWN WATER (the part's material). The stream, the brook, the side waters and the two lakes mirror what stands at their
    // banks BY PLACE: the part's standing map (what stands where, how tall, in what colour as its own garden lights it) is laid further
    // on, when everything stands, and each water walks its mirrored ray over it. LIGHT LAW: a water keeps its own garden's hour over
    // its whole sheet (its sky, its key, its fill are that garden's alone); the three ribbons lie as they lay, each thickening out of
    // nothing under the gallery-bridge and under the crossing while the last thins away; the haze over a water is the scene's, by the eye's place.
    const standMap = makeStandMap(H.hours);
    const waterOf = (q, geometry, level, o) => { const object = new THREE.Mesh(geometry, makeWaterMaterial({ hour: STATES[q], hours: STATES, amb: WLq[q].ambient, key: WLq[q].sunColor, stand: standMap, time: tU, detail, ...o })); object.position.y = level; object.name = 'water'; return { object, material: object.material, update() {} }; };
    // each garden's water: the spring's clear green, the summer's dusk green, the autumn's dark clear water under the rose dusk
    // (glint: how much of its garden's key a water throws back from its facets: the day's sun a road of light, the dusk's sunk sun a little, the red sun half)
    const WATERS = [{ deep: '#1d3c40', shallow: '#8ab09a', clarity: 0.55, foam: 0.3, glint: 0.6 }, { deep: '#12302c', shallow: '#6a9a84', clarity: 0.6, foam: 0.25, glint: 0.15 }, { deep: '#10161e', shallow: '#4a4640', clarity: 0.95, foam: 0.12, glint: 0.5 }];
    // the course's sheets (the part's makeCourseSheet), filled further on when the stones, the pads and the rafts are dealt: one wake sheet for
    // the whole course; a ring sheet for each ribbon (the spring's and the autumn's go down with their rafts at the rafts' own pace, the summer's pads lie still)
    const rM0 = ribbonRows[0][2], rEnd = rM0 + Math.floor((ribbonRows[ribbonRows.length - 1][2] - rM0) / 2) * 2, RAFT = [[rM0, mBridge + 4, 1.3], null, [mCross + 6, rEnd, 1.5]];
    const wakeSheet = makeCourseSheet(rM0, ribbonRows[ribbonRows.length - 1][2] - rM0, 4, false), ringSheets = [makeCourseSheet(RAFT[0][0], RAFT[0][1] - RAFT[0][0], 1, true), makeCourseSheet(mBridge - 4, mCross + 26 - mBridge, 1, false), makeCourseSheet(RAFT[2][0], RAFT[2][1] - RAFT[2][0], 1, true)];
    // (where carp rise: four places to a ribbon, dealt further on; until then far off)
    const riseAt = [0, 1, 2].map(() => [0, 1, 2, 3].map(() => new THREE.Vector4(1e5, 1e5, 10, 0)));
    const streams = [];
    for (const [q, m0, m1, rise] of [[0, -1e9, mBridge + 26, 0], [1, mBridge - 4, mCross + 22, 30], [2, mCross - 8, 1e9, 30]]) {
      const rf = RAFT[q];
      streams.push(waterOf(q, ribbonOf(m0, m1, rise), 0.02, { ...WATERS[q], ripple: 1, scale: 0.6, foamWidth: 0.9, rises: riseAt[q],
        flow: { speed: rf ? rf[2] : 1.4, wake: wakeSheet, ring: ringSheets[q], ringSpeed: rf ? rf[2] : 0, ringMode: rf ? 1 : 0, from: rf ? rf[0] : mBridge + 4, to: rf ? rf[1] : mCross + 14 } }));
      await rest(2);
    }
    const sides = SIDE.map((s, si) => {
      const offs = [-1, -0.72, -0.4, 0, 0.4, 0.72, 1].map((k) => k * (s.hw + 1.6)), no = offs.length, ns = s.poly.length, P = new Float32Array(ns * no * 3), D = new Float32Array(ns * no), Sh = new Float32Array(ns * no), I = [];
      for (let i = 0; i < ns; i++) {
        const a = s.poly[Math.max(0, i - 1)], c2 = s.poly[Math.min(ns - 1, i + 1)], p = s.poly[i]; let tx = c2[0] - a[0], tz = c2[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        for (let j = 0; j < no; j++) { const x = p[0] - tz * offs[j], z = p[1] + tx * offs[j], k = i * no + j; P[k * 3] = x; P[k * 3 + 1] = s.y; P[k * 3 + 2] = z; D[k] = s.y - heightAt(x, z); Sh[k] = s.hw + 0.5 - Math.abs(offs[j]); }
      }
      for (let i = 0; i < ns - 1; i++) for (let j = 0; j < no - 1; j++) { const a = i * no + j, b2 = a + 1, c2 = a + no, d = c2 + 1; if (D[a] > 0 || D[b2] > 0 || D[c2] > 0 || D[d] > 0) I.push(a, b2, c2, b2, d, c2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aDepth', new THREE.BufferAttribute(D, 1)); g.setAttribute('aShore', new THREE.BufferAttribute(Sh, 1)); g.setIndex(I); g.computeBoundingSphere();
      return waterOf(s.q, g, 0.02, { ...WATERS[s.q], shallow: s.shallow, ripple: 1, scale: 0.5, foam: 0.1, foamWidth: 0.5, clarity: 0.9 });
    });
    // the fall: three drops, each from its lip onto the ledge below, the last into the pool with its mist
    const falls = FALL.steps.map(([d, y, w], i) => { const p = fallAt(d), last = i === FALL.steps.length - 1, foot = last ? FALL.level : FALL.steps[i + 1][1];
      return Water.makeWaterfall({ rng: R['fall' + i], light: WLq[2], top: [p[0], y, p[1]], height: y - foot, width: w, dir: [-FU[0], 0, -FU[1]], launch: 1.2, lipLength: 2.4, density: 0.85, mist: last, pool: last, mistCount: 150, mistOpacity: 0.24, rainbow: 0, poolSize: 0.9, tint: '#3a6a70' }); });
    scene.add(pool.object, ice.object); for (const f of falls) scene.add(f.object); for (const st of streams) scene.add(st.object); for (const s of sides) scene.add(s.object);
    await rest(4);

    // ------------------------------------------------------------ what the gardens share: wind, the leaf material, the timber material; then the hero
    const shared = { uTime: tU };
    const timber = makeTimberMaterial(shared, HU);
    const wind = flora.makeWind({ direction: [-0.75, -0.65], strength: 0.85, speed: 0.9 });
    const matOpts = { wind, backlight: 1.0, backlightTint: '#ffdca8', ambient: 2.0, leafAmbient: 1.9 };
    await flora.prepareLeafTexture(matOpts, () => rest(4));
    // the kit's leaf material, lit by the four hours of each leaf's own place (the part's floraHours)
    const fmat = floraHours(flora.windMaterial(matOpts), HU);
    // the shapes of each kind of plant, each kind from a stream of its own
    // (a rest between the shapes of a kind, each one call into the kit, by the shape's weight: 3 for a tree at full detail, 2 for a plain tree, 1 for a bush or a clump of blades)
    const G = {}, shapes = async (kind, n, f, w = 1) => { G[kind] = []; for (let i = 0; i < n; i++) { G[kind].push(f(R['shape:' + kind], i)); await rest(w); } };
    // the kinds that also stand at the crossing's four corners are shaped first: the hero wears the gardens' own shapes
    await shapes('kerria', 2, (g) => flora.bushGeometry({ rng: g, size: 1.5, detail: 1, flowers: 1, flowerColor: '#ffc21a', leaf: '#8a9a34' }), 3);
    await rest();
    await shapes('bamboo', 2, (g, i) => flora.bambooGeometry({ rng: g, detail: 1, height: 12 - i * 2, stalk: '#5f7a3a', leaf: '#4a7a36' }), 3);
    await rest();
    await shapes('deutzia', 2, (g) => flora.bushGeometry({ rng: g, size: 1.8, detail: 1, flowers: 0.9, flowerColor: '#ffffff', leaf: '#3f6a3a' }));
    await rest();
    await shapes('maple', 2, (g, i) => flora.mapleGeometry({ rng: g, detail: 1, height: 16 - i * 2.5, leaf: '#b8231c', crimson: '#8a1410', gold: '#e8861c' }), 4);
    await rest();
    await shapes('pampas', 2, (g, i) => plumeGeometry({ rng: g, height: 3.0 - i * 0.5 }));
    await rest();
    await shapes('clover', 2, (g, i) => flora.bushGeometry({ rng: g, size: 1.5, detail: 1, flowers: 0.7, flowerColor: i ? '#f0e8f0' : '#c84a9a', leaf: '#5a7a3a' }));
    await rest();
    await shapes('snowpine', 2, (g, i) => snowOn(flora.pineGeometry({ rng: g, detail: 1, height: 16.5 - i * 3, bark: '#4a3c38' })), 2);
    await rest();
    await shapes('snowpinelow', 2, (g, i) => snowOn(flora.pineGeometry({ rng: g, detail: 1, height: 7.5 - i * 1.5, bark: '#4a3c38' })));
    await rest();
    await shapes('cherry', 2, (g, i) => flora.cherryGeometry({ rng: g, detail: 1, height: 15 - i * 2, leaf: '#f3c9d2', leafLight: '#fff2f5', leafDark: '#c98aa0' }));
    await rest();
    const hero = await buildHero({ ...ctx, yield: () => rest() }, { inWorld: true, rng: R.crossing, shared, hours: H, timber, floraMat: fmat, wind, time: tU, density: dens, mood, groundY: GY, storm: rare,
      shapes: { kerria: G.kerria, cherry: G.cherry, bamboo: G.bamboo, deutzia: G.deutzia, maple: G.maple, pampas: G.pampas, clover: G.clover, pine: G.snowpine, pineLow: G.snowpinelow } });
    scene.add(hero.object);
    await rest();

    // ------------------------------------------------------------ the buildings: one mesh for each quarter
    const BQ = [0, 1, 2, 3].map(() => makeBuilder(32768)), rh = R.halls;
    const setsOf = (name) => [SETS[name][setK], SETS[name][setK], SETS[name][1 - setK]];
    const hallAt = (q, H, o, g) => { const b = BQ[q]; b.tr(H.x, GY, H.z, H.yaw || 0); const r = hallInto(b, g, { w: H.w, d: H.d, bays: H.bays, eave: H.eave, ridge: H.ridge, lamp: 1, ...o }); r.toWorld = ((yaw) => (lx, ly, lz) => [H.x + lx * Math.cos(yaw) + lz * Math.sin(yaw), GY + ly, H.z - lx * Math.sin(yaw) + lz * Math.cos(yaw)])(H.yaw || 0); b.pop(); return r; };
    const dry = (x, z) => { const y = heightAt(x, z); return y > 0.55 && nearRoute(x, z).d >= 7 ? y : null; };
    const wet = (x, z) => (nearRoute(x, z).d >= 7 ? heightAt(x, z) : null);
    // every gallery leaves its line here, so that nothing is planted through its floor
    // (a gallery's line, its reach to either side, and the box that holds both: x least, x most, z least, z most)
    // (and its measures in `walks`, for the standing map the waters mirror)
    const segs = [], walks = [], gal = (b, p0, p1, o) => { const w = (o.width || 3.6) / 2 + (o.roof === false ? 0.6 : 2.2); segs.push([p0[0], p0[1], p1[0], p1[1], w, Math.min(p0[0], p1[0]) - w - 0.001, Math.max(p0[0], p1[0]) + w + 0.001, Math.min(p0[1], p1[1]) - w - 0.001, Math.max(p0[1], p1[1]) + w + 0.001]); const r = galleryInto(b, p0, p1, o); walks.push([p0, p1, o, r]); return r; };
    // spring: the hall, the east wing, the gallery that bridges the stream between them, the fishing pavilion, the island's bridge
    const springLamp = night ? 1 : 0;
    const hallSpring = hallAt(0, HALLS.spring, { sets: setsOf('spring'), sleeves: 0.75, stair: 8.8, lamp: springLamp }, R.hallSpring);
    await rest(4);
    hallAt(0, HALLS.wing, { sets: setsOf('spring'), sleeves: 0.5, stair: 0, lamp: springLamp }, R.hallWing);
    await rest();
    hallAt(0, HALLS.fishing, { sets: setsOf('spring'), sleeves: 0.3, stair: 0, veranda: 2.0, overhang: 3.2, lowered: 0.3, lamp: springLamp }, R.hallFishing);
    await rest();
    const HS = HALLS.spring, HW = HALLS.wing, gx0 = HS.x + HS.w / 2 + 2.6, gx1 = HW.x - HW.d / 2 - 2.6;
    const springBridge = gal(BQ[0], [gx0, HS.z], [gx1, HS.z], { y0: GY + 1.6, arch: 3.6, width: 4.2, caustic: true, ground: dry });
    await rest(2);
    gal(BQ[0], [HW.x, HW.z + HW.w / 2 + 2.6], [HALLS.fishing.x + 2, HALLS.fishing.z - 8.6], { y0: GY + 1.6, ground: dry });
    await rest();
    gal(BQ[0], [CROSS.stub, 0], [50, 0], { y0: CROSS.stubY, ground: dry }); gal(BQ[0], [50, 0], [50, HS.z], { y0: CROSS.stubY, ground: dry }); gal(BQ[0], [50, HS.z], [HS.x - HS.w / 2 - 2.6, HS.z], { y0: CROSS.stubY, ground: dry });
    await rest();
    gal(BQ[0], [0, CROSS.stub], [0, 62], { y0: CROSS.stubY, ground: dry });
    await rest();
    BQ[0].tr(0, GY, 69, 0); hallInto(BQ[0], rh, { w: 10, d: 8, bays: 3, eave: 5.0, ridge: 8.6, bare: true, stair: 3, veranda: 1.8, overhang: 2.8 }); BQ[0].pop();
    await rest();
    const islA = [ISLE.x + (ISLE.r - 1.5) * Math.sin(bridgeBearing), ISLE.z - (ISLE.r - 1.5) * Math.cos(bridgeBearing)], islB = [islA[0] + 8 * Math.sin(bridgeBearing), LAKE.cz - LAKE.b + 0.5];
    gal(BQ[0], islA, islB, { roof: false, y0: GY + 0.5, arch: 2.5, width: 3, step: 4.6, ground: wet });
    await rest(2);
    // summer: the hall, the open pavilion over the cool spring, the riding ground's rail, pavilion and stables, the north gallery
    const hallSummer = hallAt(1, HALLS.summer, { sets: setsOf('summer'), sleeves: 0.6, stair: 8.5, lamp: 0.9 }, R.hallSummer);
    await rest();
    BQ[1].tr(POOL.x + 9, GY, POOL.z - 7, Math.PI * 0.75); hallInto(BQ[1], rh, { w: 8, d: 7, bays: 2, eave: 4.6, ridge: 8, bare: true, stair: 0, veranda: 1.6, overhang: 2.6 }); BQ[1].pop();
    await rest();
    BQ[1].tr(0, 0, 0, 0); railInto(BQ[1], [153, -112], [153, -18], GY, 1.35); railInto(BQ[1], [153, -18], [190, -18], GY, 1.35); BQ[1].pop();
    await rest();
    BQ[1].tr(176, GY, -58, -Math.PI / 2); hallInto(BQ[1], rh, { w: 12, d: 8, bays: 3, eave: 5.0, ridge: 8.8, bare: true, stair: 3.5, veranda: 1.8, overhang: 2.8 }); BQ[1].pop();
    await rest();
    BQ[1].tr(184, GY, -96, -Math.PI / 2); hallInto(BQ[1], R.hallStables, { w: 24, d: 8, bays: 6, eave: 4.6, ridge: 8.2, floor: 0.5, stair: 0, veranda: 1.2, overhang: 2.2, sets: setsOf('summer'), sleeves: 0, lowered: 0.1, lamp: 0 }); BQ[1].pop();
    await rest();
    gal(BQ[1], [0, -CROSS.stub], [0, HALLS.summer.z], { y0: CROSS.stubY, ground: dry }); gal(BQ[1], [0, HALLS.summer.z], [HALLS.summer.x - HALLS.summer.w / 2 - 2.6, HALLS.summer.z], { y0: CROSS.stubY, ground: dry });
    await rest(2);
    // autumn: the wing, the open border gallery with its gate
    const hallAutumn = hallAt(2, HALLS.autumn, { sets: setsOf('autumn'), sleeves: 0.7, stair: 5, lowered: rare ? 0.25 : 0.62, lamp: 0.45 }, R.hallAutumn);
    await rest();
    const HA = HALLS.autumn, gateA = GATE.x + GATE.w / 2 + 1.2, gateB = GATE.x - GATE.w / 2 - 1.2;
    // the border gallery is the broadest of the house: 5.2 m of floor, posts a third thicker, a deeper roof
    const BORDER = { y0: CROSS.stubY, ground: dry, snow: 0.9, snowSide: 1, width: 5.2, eave: 4.2, rise: 1.7, overhang: 1.9, post: 1.35 };
    const borderGallery = gal(BQ[2], [-CROSS.stub, 0], [gateA, 0], BORDER);
    await rest();
    gal(BQ[2], [gateB, 0], [HA.x - 2, 0], BORDER); gal(BQ[2], [HA.x - 2, 0], [HA.x - 2, HA.z - HA.w / 2 - 2.6], { y0: CROSS.stubY, ground: dry });
    await rest();
    {
      const b = BQ[2]; b.surf(SURF.TIMBER).col(PAL.timber, 0.95);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(GATE.x + sx * GATE.w / 2, GY - 0.5, GY + GATE.h + 0.6, sz * 2.7, 0.46, 10);
      for (const sz of [-1, 1]) b.beam([GATE.x - GATE.w / 2 - 1.2, GY + GATE.h + 0.3, sz * 2.7], [GATE.x + GATE.w / 2 + 1.2, GY + GATE.h + 0.3, sz * 2.7], 0.5, 0.6);
      for (const sx of [-1, 1]) b.beam([GATE.x + sx * GATE.w / 2, GY + GATE.h + 0.3, -3.3], [GATE.x + sx * GATE.w / 2, GY + GATE.h + 0.3, 3.3], 0.45, 0.5);
      roofInto(b, GATE.x, 0, GATE.w + 7, 10.6, GY + GATE.h + 1.25, 3.2, { gable: 0.45, snowAt: (x, z) => smoothstep(0.5, -1.5, z) * 0.95 });
    }
    await rest();
    // winter: the hall with its open middle bays; from each end an open gallery comes 20 m forward to a small open pavilion, so that the
    // upper court is held on three sides; three plastered storehouses, two forward on the right, one behind on the left
    const hallWinter = hallAt(3, WH, { sets: setsOf('winter'), sleeves: 0.8, stair: 12, open: 2, snow: 1, lowered: 0.75 }, R.hallWinter);
    await rest(2);
    for (const w of WINGS) {
      gal(BQ[3], [w[0], WH.z + WH.d / 2 + 2.8], [w[0], w[1] - 5.2], { y0: GY + 1.6, ground: dry, snow: 0.9 });
      BQ[3].tr(w[0], GY, w[1], 0); hallInto(BQ[3], rh, { w: 8, d: 7, bays: 2, eave: 4.8, ridge: 8.4, bare: true, stair: 0, veranda: 1.6, overhang: 2.6, snow: 1 }); BQ[3].pop();
      await rest();
    }
    for (const [x, z, w, d] of STORES) {
      const b = BQ[3], y = heightAt(x, z); b.tr(x, Math.min(GY, y), z, 0);
      b.surf(SURF.PLASTER).col(PAL.plaster, 0.85); b.box(-w / 2, -0.6, -d / 2, w / 2, 5.6, d / 2, { top: false });
      b.surf(SURF.TIMBER).col(PAL.dark, 2.2); b.box(-1.3, 0, d / 2, 1.3, 3.4, d / 2 + 0.12);
      b.col(PAL.timber, 0.8); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * (w / 2 + 0.05), -0.6, 5.7, sz * (d / 2 + 0.05), 0.24, 8);
      roofInto(b, 0, 0, w + 4.4, d + 4.4, 5.9, 3.6, { gable: 0.4, snowAt: () => 1 });
      b.pop();
    }
    // a censer on the veranda of the spring hall and of the winter hall: a small dark bowl on a foot (its smoke is lit further on)
    const censers = [[0, hallSpring.toWorld(-7.4, hallSpring.yF, HALLS.spring.d / 2 + 1.6)], [3, hallWinter.toWorld(9.2, hallWinter.yF, WH.d / 2 + 1.6)]];
    for (const [q, p] of censers) { const b = BQ[q]; b.surf(SURF.GILT).col(PAL.iron, 2.2); b.cyl(p[0], p[1], p[1] + 0.22, p[2], 0.1, 8); b.cyl(p[0], p[1] + 0.22, p[1] + 0.5, p[2], 0.14, 8, 0.26, true); }
    const builtMeshes = [];
    for (const b of BQ) { const m = new THREE.Mesh(b.toGeometry(), timber); scene.add(m); builtMeshes.push(m); await rest(2); }
    await rest();

    // ------------------------------------------------------------ the gardens' plants. Every die of a kind is thrown first; the rules then keep or drop.
    // QG: a garden's small things (drawn by where the eye stands, see the end of build); QT: its trees over 8 m and what lies under them (always drawn)
    const QG = [0, 1, 2, 3].map(() => { const g = new THREE.Group(); scene.add(g); return g; }), QT = [0, 1, 2, 3].map(() => { const g = new THREE.Group(); scene.add(g); return g; });
    const TALL = new Set(['cherry', 'shore', 'willow', 'isle', 'pine', 'hillwood', 'grove', 'northwood', 'bamboo', 'maple', 'darkwood', 'snowpine', 'pinewood']);
    const solids = hero.solids.map((s) => s.slice()), casters = [[], [], [], []], scatters = [];
    const segDist = (x, z, s) => { const dx = s[2] - s[0], dz = s[3] - s[1], t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(s[0] + dx * t - x, s[1] + dz * t - z); };
    const builtAt = (x, z, pad) => { for (let k = 0; k < roofs.length; k++) { const r = roofs[k]; if (Math.abs(x - r[0]) < r[2] + pad && Math.abs(z - r[1]) < r[3] + pad) return true; } for (let k = 0; k < segs.length; k++) { const s = segs[k]; if (x < s[5] - pad || x > s[6] + pad || z < s[7] - pad || z > s[8] + pad) continue; if (segDist(x, z, s) < s[4] + pad) return true; } return false; };
    const rightAt = (m) => { const a = route[Math.max(0, Math.round(m) - 1)], c = route[Math.min(route.length - 1, Math.round(m) + 1)], l = Math.hypot(c.x - a.x, c.z - a.z) || 1; return [-(c.z - a.z) / l, (c.x - a.x) / l]; };
    const die = (rng) => ({ s: rng.range(0.85, 1.2), rot: rng.range(0, TAU), v: rng.int(0, 5), k: rng() });
    // n dice over a box of the estate
    const dice = (kind, n, x0, z0, x1, z1) => { const rng = R['place:' + kind], out = []; for (let i = 0; i < n; i++) out.push({ x: rng.range(x0, x1), z: rng.range(z0, z1), ...die(rng) }); return out; };
    // n dice beside the lane: metres along it, metres off it, to the right (1), the left (-1) or either side (0)
    const along = (kind, n, m0, m1, o0, o1, side) => {
      const rng = R['place:' + kind], out = [];
      for (let i = 0; i < n; i++) { const m = rng.range(m0, m1), off = rng.range(o0, o1) * (side || (rng.chance(0.5) ? 1 : -1)), p = route[Math.round(m)], r = rightAt(m); out.push({ x: p.x + r[0] * off, z: p.z + r[1] * off, ...die(rng) }); }
      return out;
    };
    // the rules: off the hero's own corners, on ground at least `low` high, `lane` metres from the lane, `pad` metres from any roof, `gap` metres apart;
    // and nothing is planted behind the entry within 12 m of the entry's own axis for 64 m back (what draws us into an opening stands there)
    const head0 = (() => { const l = Math.hypot(route[2].x - route[0].x, route[2].z - route[0].z); return [(route[2].x - route[0].x) / l, (route[2].z - route[0].z) / l]; })();
    const keepBy = (list, o) => {
      const out = [];
      for (const p of list) {
        if (out.length >= o.max) break;
        const ex = p.x - route[0].x, ez = p.z - route[0].z, back = -(ex * head0[0] + ez * head0[1]); if (back > -2 && back < 64 && Math.abs(ex * head0[1] - ez * head0[0]) < 12) continue;
        if (Math.hypot(p.x, p.z) < 35 || Math.abs(p.x) > 205 || Math.abs(p.z) > 245) continue;
        const y = heightAt(p.x, p.z); if (y < (o.low ?? GY - 0.25)) continue;
        const nr = nearRoute(p.x, p.z); if (nr.d < o.lane || builtAt(p.x, p.z, o.pad ?? 2.5)) continue;
        if (o.ok && !o.ok(p, y, nr)) continue;
        if (o.gap) {
          const g2 = o.gap * o.gap; let near = false;
          for (let k = 0; k < out.length && !near; k++) { const dx = out[k].x - p.x, dz = out[k].z - p.z, d2 = dx * dx + dz * dz; near = d2 < g2 * 0.999999 || (d2 < g2 * 1.000001 && Math.hypot(dx, dz) < o.gap); }
          if (near) continue;
        }
        p.y = y; p.m = nr.m; p.d = nr.d; out.push(p);
      }
      return out;
    };
    // the plainer shapes of a kind, worn by those that stand farther than `dist` metres from the lane
    const GF = {}, FD = {}, farShapes = async (kind, dist, n, f, w = 1) => { GF[kind] = []; FD[kind] = dist; for (let i = 0; i < n; i++) { GF[kind].push(f(R['shape:' + kind], i)); await rest(w); } };
    // low kinds are split in two along the lane, and a half is not drawn from farther than 150 m (shrubs under trees and behind roofs at that range)
    const SMALL = { chunks: 2, cullDistance: 150 };
    // a kind that spreads over a whole garden is split in two along the lane, so that the half behind the eye is not drawn
    const WIDE = { chunks: 2 };
    // a kind into its quarter: trunk = the radius the lane must stay clear of, shadow = the radius of the blot under it
    const planted = {};
    const plant = (q, kind, pts, trunk, shadow, extra) => {
      planted[kind] = pts;
      if (!pts.length) return null;
      // the kit splits a kind by each point's share of the way; here that is its share of the kind's own reach along the lane
      let mLo = 1e9, mHi = -1e9; for (const p of pts) { mLo = Math.min(mLo, p.m); mHi = Math.max(mHi, p.m); }
      const sc = flora.makeScatter({ rng: R['tint:' + kind], points: pts.map((p) => ({ x: p.x, y: p.y - 0.1, z: p.z, s: p.s, rot: p.rot, v: p.v % G[kind].length, d: p.d, u: (p.m - mLo) / (mHi - mLo + 1) })), variants: G[kind], material: fmat, ...(GF[kind] ? { farVariants: GF[kind], farDistance: FD[kind] } : {}), ...extra });
      const grp = TALL.has(kind) ? QT[q] : QG[q]; grp.add(sc.object); scatters.push([grp, sc]);
      for (const p of pts) { if (trunk) solids.push([p.x, p.z, trunk * p.s, kind]); if (shadow && p.d < 52) casters[q].push({ x: p.x, z: p.z, r: shadow * p.s }); }
      return sc;
    };
    // spring: cherries on the lake's east bank, along the stream and round the shore; willows at the water; pines, kerria, azalea; a wooded hill behind
    await shapes('shore', 2, (g, i) => flora.cherryGeometry({ rng: g, detail: 0, height: 14 - i * 2, leaf: '#f3c9d2', leafLight: '#fff2f5', leafDark: '#c98aa0' }));
    await rest();
    await shapes('willow', 1, (g) => flora.willowGeometry({ rng: g, detail: 1, height: 13 }), 4);
    await rest();
    await shapes('pine', 2, (g, i) => flora.pineGeometry({ rng: g, detail: 1, height: 17 - i * 3 }), 2);
    await rest();
    await shapes('azalea', 2, (g, i) => flora.bushGeometry({ rng: g, size: 1.6, detail: 1, flowers: 0.9, flowerColor: i ? '#f6eef0' : '#e8508a', leaf: '#3f6a34' }));
    await rest();
    await farShapes('azalea', 20, 1, (g, i) => flora.bushGeometry({ rng: g, size: 1.6, detail: 0, flowers: 0.9, flowerColor: i ? '#f6eef0' : '#e8508a', leaf: '#3f6a34' }));
    await rest();
    G.isle = G.pine;
    await shapes('hillwood', 3, (g, i) => (i === 1 ? G.shore[1] : flora.oakGeometry({ rng: g, detail: 0, height: 15 - i, leaf: i ? '#6f9a44' : '#4f8238' })));
    await rest();
    const shoreBand = (a, b) => (p) => { const li = lakeIn(p.x, p.z); return li < a && li > b; };
    { const pts = keepBy([...along('cherry', 70, 0, mMouth - 6, 16, 25, 1), ...along('cherry', 50, mMouth + 6, mBridge - 16, 10.5, 19, 0)], { lane: 10.5, gap: 8.5, max: 26 }); plant(0, 'cherry', pts, 0.7, 4.6, WIDE); }
    await rest();
    { const pts = keepBy(dice('shore', 260, 20, 60, 190, 245), { lane: 24, gap: 11, max: 22, ok: shoreBand(-3, -20) }); plant(0, 'shore', pts, 0.7, 4.4, WIDE); }
    await rest();
    { const pts = keepBy(dice('willow', 300, 30, 62, 180, 240), { lane: 13, gap: 17, max: 6, ok: shoreBand(-2, -6.5) }); plant(0, 'willow', pts, 0.6, 4.4); }
    await rest();
    { const pts = keepBy(dice('isle', 40, ISLE.x - 11, ISLE.z - 11, ISLE.x + 11, ISLE.z + 11), { lane: 20, gap: 5, max: 5, ok: (p) => Math.hypot(p.x - ISLE.x, p.z - ISLE.z) < 10 }); await rest(); for (const p of pts) p.s *= 0.68; plant(0, 'isle', pts, 0.5, 3.4); }
    await rest();
    { const pts = keepBy(along('kerria', 110, mMouth + 2, mBridge - 8, 5.3, 7.8, 0), { lane: 5.2, gap: 2.2, max: 36, low: 0.5 }); plant(0, 'kerria', pts, 1.2, 1.5, SMALL); }
    await rest();
    { const pts = keepBy([...dice('azalea', 220, 40, 30, 175, 112), ...along('azalea', 70, mMouth + 4, mBridge - 10, 8.2, 14, 0)], { lane: 8, gap: 3, max: 46, ok: (p) => lakeIn(p.x, p.z) > -9 || p.d < 14.5 || p.k < 0.25 }); plant(0, 'azalea', pts, 1.1, 1.3, WIDE); }
    await rest();
    { const pts = keepBy(dice('pine', 80, 36, 6, 180, 72), { lane: 13, gap: 15, max: 7, pad: 5 }); plant(0, 'pine', pts, 0.6, 4.2); }
    await rest();
    { const pts = keepBy(dice('hillwood', 300, 4, 100, 214, 254), { lane: 30, gap: 7.5, max: 60, ok: (p, y) => y > GY + 1.6 }); plant(0, 'hillwood', pts, 0, 0, WIDE); }
    await rest();
    // summer: a deep wood round the cool spring and the brook, bamboo at the hall's east corner, a flowering hedge before the hall, irises in the shallows.
    // Reeds stand only in the water's edge (their feet within a foot of the waterline), lean, and are lower than the eye: none stands across a hall.
    await shapes('grove', 2, (g, i) => flora.oakGeometry({ rng: g, detail: 1, height: 21 - i * 3, leaf: i ? '#2f6a38' : '#3a7a3c', leafLight: '#6a9a4a' }));
    await rest();
    await farShapes('grove', 26, 2, (g, i) => flora.oakGeometry({ rng: g, detail: 0, height: 21 - i * 3, leaf: i ? '#2f6a38' : '#3a7a3c', leafLight: '#6a9a4a' }));
    await rest();
    G.northwood = GF.grove;
    await rest();
    await shapes('orange', 1, (g) => flora.bushGeometry({ rng: g, size: 2.6, detail: 1, flowers: 0.35, flowerColor: '#fff8e8', leaf: '#2f5a30' }));
    await rest();
    await shapes('iris', 2, (g, i) => flora.flowerGeometry({ rng: g, color: i ? '#c8c4e0' : '#6a48d8', cards: 3, width: 0.7, height: 1.15, root: '#2f5a2c', tip: '#5a8a3a' }));
    await rest();
    await shapes('reed', 1, (g) => flora.reedGeometry({ rng: g, height: 1.9, leaf: '#4a7a3a', tip: '#8a9a50' }));
    await rest();
    const riding = (p) => p.x > 148 && p.x < 192 && p.z > -112 && p.z < -16;
    // the watch fire: low, at the design's place, 11 m inside the arc's north point toward the cool spring, under a tree that leans over it
    const FIRE = [POOL.x, heightAt(POOL.x, POOL.z - ARC + 11), POOL.z - ARC + 11];
    // The tree is dealt from a stream of its own: 4.2 to 5.2 m from the fire, on a bearing 40 to 75 degrees round from the line of
    // approach (from the bend's start through the fire) toward the cool spring, so that it stands beyond the fire and to its side
    // as the lane first sees it, never between the lane and the fire; it leans 0.3 rad toward the fire.
    const wt = (() => {
      const g = stream('watchtree'), p0 = route[mArc1], ux = FIRE[0] - p0.x, uz = FIRE[2] - p0.z, toPool = (ux * (POOL.z - FIRE[2]) - uz * (POOL.x - FIRE[0])) > 0 ? 1 : -1;
      const a = Math.atan2(uz, ux) + toPool * g.range(40, 75) * DEG, r = g.range(4.2, 5.2);
      return { x: FIRE[0] + Math.cos(a) * r, z: FIRE[2] + Math.sin(a) * r, dx: -Math.cos(a), dz: -Math.sin(a), rot: g.range(0, TAU), s: g.range(0.75, 0.85) };
    })();
    // (no tree of the grove is planted within 2 m of the leaning tree: trunk clear of trunk)
    { const pts = keepBy(dice('grove', 420, 36, -240, 200, -8), { lane: 9.5, gap: 9, max: 44, pad: 5, ok: (p) => !riding(p) && !(p.z > -100 && p.z < -78 && p.x > 64 && p.x < 114) && Math.hypot(p.x - wt.x, p.z - wt.z) > 2 }); plant(1, 'grove', pts, 0.8, 5.2, WIDE); }
    await rest();
    { const pts = keepBy(dice('northwood', 300, 6, -250, 214, -124), { lane: 40, gap: 8, max: 30, pad: 5 }); plant(1, 'northwood', pts, 0, 0, WIDE); }
    await rest();
    { const pts = keepBy(dice('bamboo', 90, 104, -126, 128, -88), { lane: 9, gap: 4.5, max: 8, pad: 0.5 }); plant(1, 'bamboo', pts, 1.2, 2.2); }
    await rest();
    { const pts = keepBy(dice('deutzia', 120, 60, -84, 118, -80), { lane: 6, gap: 2.2, max: 24 }); plant(1, 'deutzia', pts, 1.2, 1.4, WIDE); }
    await rest();
    { const pts = keepBy(dice('orange', 60, 58, -100, 122, -70), { lane: 9, gap: 7, max: 6 }); plant(1, 'orange', pts, 1.4, 2.0); }
    await rest();
    { const pts = keepBy(along('iris', 520, mArc1, mCross - 34, 3.3, 5.6, 0), { lane: 3.2, gap: 0.6, max: Math.round(170 * many), low: 0.02, pad: 1 }); plant(1, 'iris', pts, 0, 0, WIDE); }
    await rest(3);
    { const pts = keepBy([...dice('reed', 160, POOL.x - 20, POOL.z - 20, POOL.x + 20, POOL.z + 20), ...along('reed', 120, mArc1 - 30, mCross - 34, 4.6, 6.4, 0)], { lane: 4.5, gap: 1.6, max: 46, low: -0.3, pad: 1, ok: (p, y, nr) => { const w = Math.hypot(p.x - POOL.x, p.z - POOL.z) < POOL.r + 4 ? 0.12 : waterY(nr.m); return y < w + 0.3 && y > w - 0.3; } }); plant(1, 'reed', pts, 0, 0, { tilt: 0.16 }); }
    await rest(2);
    // autumn: maples on and round the hill, pampas and bush clover along the brook and through the field, a gold and red wood behind
    await rest();
    await farShapes('maple', 22, 2, (g, i) => flora.mapleGeometry({ rng: g, detail: 0, height: 16 - i * 2.5, leaf: '#b8231c', crimson: '#8a1410', gold: '#e8861c' }));
    await rest();
    await shapes('darkwood', 3, (g, i) => (i === 1 ? GF.maple[1] : flora.oakGeometry({ rng: g, detail: 0, height: 17 - i, leaf: i ? '#a8782a' : '#6a6a2c' })));
    await rest();
    await farShapes('pampas', 15, 1, (g, i) => plumeGeometry({ rng: g, height: 3.0 - i * 0.5, blades: 8, plumes: 5 }));
    await rest();
    await farShapes('clover', 14, 1, (g, i) => flora.bushGeometry({ rng: g, size: 1.5, detail: 0, flowers: 0.7, flowerColor: i ? '#f0e8f0' : '#c84a9a', leaf: '#5a7a3a' }));
    await rest();
    const hillD = (p) => Math.hypot(p.x - HILL.x, p.z - HILL.z);
    // the fall ends the brook's straight line down the field: no tree stands within 13 m of the line from the start of the bend round the
    // maple hill (where the lane leaves the brook's line) to the crag behind the fall's lip, or within 13 m of its pool
    const knollD = (p) => Math.hypot(p.x - KNOLL.x, p.z - KNOLL.z), sightLine = [route[mArc2].x, route[mArc2].z, CRAG[0], CRAG[1]];
    const sight = (p) => segDist(p.x, p.z, sightLine) < 13 || Math.hypot(p.x - FALL.x, p.z - FALL.z) < 13;
    { const pts = keepBy(dice('maple', 460, -160, -2, -30, 132), { lane: 10.5, gap: 7.5, max: 40, pad: 4, ok: (p) => ((hillD(p) < 62 && (hillD(p) < 30 || p.k < 0.5)) || knollD(p) < 40) && !sight(p) }); plant(2, 'maple', pts, 0.7, 4.6, WIDE); }
    await rest();
    { const pts = keepBy(dice('darkwood', 560, -214, 8, -6, 252), { lane: 30, gap: 9, max: 60, pad: 5, ok: (p) => hillD(p) > 50 && knollD(p) > 36 && !sight(p) }); plant(2, 'darkwood', pts, 0, 0, WIDE); }
    await rest(2);
    { const pts = keepBy([...along('pampas', 420, mCross + 34, mWest2, 5.6, 12, 0), ...dice('pampas', 200, -150, 6, -30, 110)], { lane: 5.5, gap: 1.9, max: Math.round(150 * many), low: -0.2, ok: (p, y, nr) => y > waterY(nr.m) + 0.2 && (p.d < 12.5 || p.k < 0.4) }); plant(2, 'pampas', pts, 0, 0, WIDE); }
    await rest(2);
    { const pts = keepBy([...along('clover', 160, mCross + 34, mWest2, 7, 14, 0), ...dice('clover', 120, -150, 6, -30, 110)], { lane: 6.8, gap: 3, max: 44, low: 0.25 }); plant(2, 'clover', pts, 1.1, 1.3, SMALL); }
    await rest();
    // winter: screens of snow-laden pines either side of the court, their trunks 16 to 25 m from the lane (none in the frozen stream: the rule of the low ground),
    // a pine wood behind, low snowed shrubs, a frosted hedge on the right for the first 40 m inside the gate
    await rest();
    await farShapes('snowpine', 16.5, 2, (g, i) => snowOn(flora.pineGeometry({ rng: g, detail: 0, height: 16.5 - i * 3, bark: '#4a3c38' })));
    await rest();
    G.pinewood = GF.snowpine;
    await rest();
    await shapes('snowbush', 2, (g) => snowOn(flora.bushGeometry({ rng: g, size: 1.7, detail: 1, flowers: 0, leaf: '#3a5a3c' })));
    await rest();
    await farShapes('snowbush', 10, 1, (g) => snowOn(flora.bushGeometry({ rng: g, size: 1.7, detail: 0, flowers: 0, leaf: '#3a5a3c' })));
    await rest();
    await shapes('mum', 1, (g) => snowOn(flora.bushGeometry({ rng: g, size: 1.4, detail: 1, flowers: 0.6, flowerColor: '#e8dca0', leaf: '#5a6a48' }), 0.55));
    await rest();
    // The children's ball is dealt from a stream of its own (the part's dealBall: within 5 m along the lane of the design's place,
    // 10 to 14 m to the right). No bush or low pine is planted within 2.5 m of any straight line from the lane to the ball, for
    // every place of the lane inside the gate from which the ball bears under 60 degrees; nor within 4.5 m of the ball (the
    // children's ground), nor within 3.6 m of the furrow it was rolled along; no pine stands within 7 m of it.
    const ballAt = dealBall(stream('ball'), E), mBall = ballAt.m, rtb = [ballAt.rx, ballAt.rz], BALL = [ballAt.x, 0, ballAt.z];
    const ballPhase = stream('ball').range(0, TAU);
    // the furrow: the ball was rolled here from the pines on the right, 16 m along a bent line (the bend is the first number of the tracks' stream)
    const trailBend = R.tracks.range(-0.35, 0.35);
    const trail = (t, off) => { const a = trailBend * t / 16, ux = rtb[0] * Math.cos(a) - rtb[1] * Math.sin(a), uz = rtb[0] * Math.sin(a) + rtb[1] * Math.cos(a); return [BALL[0] + ux * t - uz * off, BALL[2] + uz * t + ux * off, ux, uz]; };
    const ballFan = sightFan(E, BALL[0], BALL[2], mGate), furrow = Array.from({ length: 13 }, (_, i) => trail(i * 1.5, 0));
    const ballOpen = (p) => fanDist(ballFan, BALL[0], BALL[2], p.x, p.z) > BALL_PLACE.sight && Math.hypot(p.x - BALL[0], p.z - BALL[2]) > 4.5 && furrow.every((f) => Math.hypot(p.x - f[0], p.z - f[1]) > 3.6);
    { const pts = keepBy(along('snowpine', 200, mGate + 14, LEN - 12, 16, 25, 0), { lane: 15.5, gap: 5.6, max: 44, pad: 4, ok: (p) => Math.hypot(p.x - BALL[0], p.z - BALL[2]) > 7 }); plant(3, 'snowpine', pts, 0.6, 4, WIDE); }
    await rest();
    { const pts = keepBy(dice('pinewood', 420, -214, -250, -8, -8), { lane: 27, gap: 8, max: 40, pad: 5 }); plant(3, 'pinewood', pts, 0, 0, WIDE); }
    await rest();
    { const pts = keepBy(along('snowbush', 180, mGate + 10, LEN - 16, 7.2, 13, 0), { lane: 7, gap: 3, max: 44, ok: ballOpen }); plant(3, 'snowbush', pts, 1.2, 1.4, SMALL); }
    await rest();
    { const pts = keepBy(along('snowpinelow', 80, mGate + 20, LEN - 30, 9, 14, 0), { lane: 9, gap: 9, max: 10, pad: 3, ok: ballOpen }); plant(3, 'snowpinelow', pts, 0.4, 2.2, SMALL); }
    await rest();
    { const pts = keepBy(along('mum', 80, mGate + 8, mGate + 48, 6.9, 7.7, 1), { lane: 6.8, gap: 1.4, max: 26 }); plant(3, 'mum', pts, 0.9, 1.0, SMALL); }
    await rest();
    // the blots under the trees: two sheets for each quarter (every other tree in each, so that neither is long in the making), cast away from that quarter's light
    // (in the court only under the low things: a pine's shadow there is the moon's own, laid from its foot on the sheet below)
    const blotR = { cherry: 4.6, maple: 4.4, pine: 3.6, pineLow: 1.8, bamboo: 2, kerria: 1.4, deutzia: 1.4, clover: 1.2 };
    for (const s of hero.solids) if (blotR[s[3]]) casters[quarterOf(s[0], s[1])].push({ x: s[0], z: s[1], r: blotR[s[3]] });
    const blots = [];
    for (let q = 0; q < 4; q++) for (let half = 0; half < 2; half++) {
      const sh = flora.makeGroundShadows({ points: casters[q].filter((c, i) => i % 2 === half && (q !== 3 || c.r < 2.6)), heightAt, cell: 13, sunDir: STATES[q].sun, strength: [0.38, 0.3, 0.55, 0.3][q], color: ['#2a2c40', '#0c2018', '#3a1c24', '#1c2a5a'][q] });
      QT[q].add(sh.object); blots.push(sh); await rest();
    }
    await rest();

    // ------------------------------------------------------------ the children's prints: three files of small prints from the pines to their ball, in the
    // blue of snow shade, on a thin sheet over the snow (the furrow they go beside, and the moon's shade of everything that stands, are laid on the
    // court's sheet further on). Soft while snow falls, sharp when it has stopped.
    // The children's great ball of snow stands where it was dealt, to the right of the lane.
    BALL[1] = heightAt(BALL[0], BALL[2]);
    const courtTracks = [];
    {
      const gt = R.tracks;
      const P = [], Cc = [], I = [], shade = new THREE.Color('#6f86b8').lerp(new THREE.Color('#ffffff'), snowing ? 0.4 : 0.12);
      const yAt = (x, z) => Math.max(heightAt(x, z), iceIn(x, z) > 0 ? ICE.level : -99) + 0.09;
      const vert = (x, z, k, up = 0) => { P.push(x, yAt(x, z), z); Cc.push(lerp(1, shade.r, k) + up, lerp(1, shade.g, k) + up, lerp(1, shade.b, k) + up); return P.length / 3 - 1; };
      // a print is a small hollow: dark at its middle and darker still under its wall on the moon's side (that wall's own shade),
      // and its far rim, which faces the moon, is lit (a sheet that multiplies: over one it brightens); beyond the rim, the snow as it lies
      const disc = (cx, cz, rx, rz, k, ux, uz) => {
        const c0 = vert(cx, cz, Math.min(1, k * 1.15)), rim = [], out = [];
        for (let a = 0; a < 8; a++) {
          const an = a * TAU / 8, ex = Math.cos(an) * rx, ez = Math.sin(an) * rz, px = -uz * ex + ux * ez, pz = ux * ex + uz * ez, far = (px * courtSheet.dx + pz * courtSheet.dz) / (Math.hypot(px, pz) || 1);
          rim.push(vert(cx + px, cz + pz, far < 0 ? -0.7 * k * far : 0, far > 0 ? 0.45 * far * far : 0)); out.push(vert(cx + px * 1.7, cz + pz * 1.7, 0));
        }
        for (let a = 0; a < 8; a++) { const b2 = (a + 1) % 8; I.push(c0, rim[a], rim[b2], rim[a], out[a], out[b2], rim[a], out[b2], rim[b2]); }
      };
      // three files of small prints beside the furrow (its line was laid with the ball)
      for (let f = 0; f < 3; f++) { const off = [-1.9, 1.7, 2.6][f] + gt.range(-0.2, 0.2); for (let k = 0; k < 34; k++) { const c0 = trail(1.4 + k * 0.48 + gt.range(-0.05, 0.05), off + (k % 2 ? 0.16 : -0.16) + 0.5 * Math.sin(k * 0.23 + f * 2)); disc(c0[0], c0[1], 0.11, 0.2, 0.8, c0[2], c0[3]); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); geo.setIndex(I);
      const sheet = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      // (drawn with the court's tall pines, always, as it was)
      sheet.renderOrder = 0.6; QT[3].add(sheet);
      // A few lines of tracks cross the open court (a stream of their own): a hare's bounds (two small prints one behind the
      // other, two long ones side by side ahead of them, a bound every 1.1 m) or a bird's walk (thin prints left and right, a
      // hand apart). Each line begins 3 to 10 m off the lane somewhere along it inside the gate, heads within a radian of the
      // lane's own heading either way, wanders a little, and stops at the ice, at a wall or at anything that stands.
      P.length = 0; Cc.length = 0; I.length = 0;
      const ga = stream('court:tracks');
      for (let n = 0; n < 6; n++) {
        const m = ga.range(mGate + 18, LEN - 36), off = ga.range(3, 10) * (ga.chance(0.5) ? 1 : -1), hare = ga.chance(0.5), len = ga.range(22, 42), bend = ga.range(-0.02, 0.02), ph = ga.range(0, TAU), q = route[Math.round(m)], r = rightAt(m);
        let x = q.x + r[0] * off, z = q.z + r[1] * off, a = Math.atan2(-r[0], r[1]) + ga.range(-1, 1) + (ga.chance(0.5) ? Math.PI : 0);
        const step = hare ? 1.1 : 0.24;
        for (let d = 0, k = 0; d < len; d += step, k++) {
          a += bend * step + 0.05 * step * Math.sin(d * 0.4 + ph); const ux = Math.cos(a), uz = Math.sin(a); x += ux * step; z += uz * step;
          if (iceIn(x, z) > -0.6 || builtAt(x, z, 1) || heightAt(x, z) < GY - 0.25 || Math.abs(x) < 4 || Math.abs(z) < 4 || solids.some((o) => Math.hypot(o[0] - x, o[1] - z) < o[2] + 0.5)) break;
          if (hare) { disc(x - ux * 0.46, z - uz * 0.46, 0.06, 0.08, 0.75, ux, uz); disc(x - ux * 0.26, z - uz * 0.26, 0.06, 0.08, 0.75, ux, uz); disc(x + uz * 0.1, z - ux * 0.1, 0.07, 0.15, 0.8, ux, uz); disc(x - uz * 0.1, z + ux * 0.1, 0.07, 0.15, 0.8, ux, uz); }
          else { const sd = k % 2 ? 0.06 : -0.06; disc(x + uz * sd, z - ux * sd, 0.035, 0.1, 0.75, ux, uz); }
          if (!hare && k % 4 === 0 || hare) courtTracks.push([x, z]);
        }
      }
      if (I.length) {
        const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g2.setIndex(I);
        const tracks = new THREE.Mesh(g2, sheet.material); tracks.renderOrder = 0.6; tracks.name = 'court:tracks'; QG[3].add(tracks);
      }
    }
    await rest();

    // ------------------------------------------------------------ the two lakes. The kit lays each sheet (its grid, its depths, its distances to
    // the shore) at the place it always lay; the water on it is the estate's own, which mirrors the crowns and the roofs on its shores
    // where they stand, as wide as they stand and in their own colours (the standing map, laid when everything stands).
    const laneMidX = (knots[0][0] + knots[2][0]) / 2;
    const lakeSheet = Water.makeLake({ rng: stream('water:lake'), light: WLq[0], level: 0, center: [laneMidX, LAKE.cz], width: (laneMidX - LAKE.cx + LAKE.a) * 2 + 12, depth: LAKE.b * 2 + 12, segments: 46, depthAt: (x, z) => (lakeIn(x, z) > -1.5 ? -heightAt(x, z) : -1), band: false });
    const lake = waterOf(0, lakeSheet.object.geometry, 0, { ...WATERS[0], deep: '#24484e', shallow: '#9cc0aa', ripple: 0.8, scale: 0.8, foam: 0.3, foamWidth: 1.6, clarity: 0.5 }); lakeSheet.material.dispose();
    await rest(5);
    const alakeSheet = Water.makeLake({ rng: stream('water:autumnlake'), light: WLq[2], level: -0.6, center: [ALAKE.cx, ALAKE.cz], width: ALAKE.a * 2 + 12, depth: ALAKE.b * 2 + 12, segments: 30, depthAt: (x, z) => (alakeIn(x, z) > -1.5 ? -0.6 - heightAt(x, z) : -1), band: false });
    const alake = waterOf(2, alakeSheet.object.geometry, -0.6, { ...WATERS[2], ripple: 1, scale: 1, foam: 0.2, foamWidth: 1.6 }); alakeSheet.material.dispose();
    scene.add(lake.object, alake.object);
    await rest(2);

    // ------------------------------------------------------------ the life of the spring lake: two boats, paired water birds, the children's round dance
    const life = [[], [], [], []], dummy = new THREE.Object3D();
    const rb = R.boats;
    const pages = [lin('#3f6a4a'), lin('#c8a23a'), lin('#8a3a5a'), lin('#3a5a8a')];
    const boats = [];
    for (const head of ['dragon', 'bird']) {
      const b = makeBuilder(); boatInto(b, rb, { head, robes: pages, sets: setsOf('spring'), band: head === 'dragon' ? lin('#1f5a5a') : lin('#7a2a2a') });
      const m = new THREE.Mesh(b.toGeometry(), timber); QG[0].add(m); boats.push(m);
      await rest(3);
    }
    // Both boats ply one beat beside the first leg, half a round apart on the world clock (the part's boatBeat: where it lies and
    // why; no boat's place goes by the metres flown). One phase is dealt, from a stream of its own; the visit says which boat holds it.
    const beat = boatBeat(E), beatPhase = stream('boats:beat').range(0, TAU);
    const boatAt = (i, time, out) => beat.at(beatPhase + (i === (nearDragon ? 0 : 1) ? 0 : Math.PI), time, out);
    const bp = { x: 0, z: 0, yaw: 0 };
    // (every thing the clock moves is set down at its clock 0 place when it is built, never left at the estate's middle)
    const moveBoats = (dt, time) => { boats.forEach((m, i) => { boatAt(i, time, bp); m.position.set(bp.x, 0.05 * Math.sin(time * 0.9 + i * 2), bp.z); m.rotation.set(0.018 * Math.sin(time * 0.7 + i), bp.yaw, 0); }); };
    moveBoats(0, 0); life[0].push(moveBoats);
    // paired water birds: every die first; a pair is kept where its whole round lies on water a hand deep or more and 3 m clear of
    // whatever a boat's skin sweeps on the beat
    const rd = R.ducks, pairDice = [];
    for (let i = 0; i < 30; i++) { const m = rd.range(6, mBridge - 12), off = rd.range(4.5, 14) * (rd.chance(0.5) ? 1 : -1), r = rd.range(1.2, 2.6), T = rd.range(26, 52), ph = rd.range(0, TAU), p = route[Math.round(m)], rr = rightAt(m); pairDice.push({ x: p.x + rr[0] * off, z: p.z + rr[1] * off, r, T, ph }); }
    const pairs = pairDice.filter((p) => [0, 1, 2, 3].every((k) => heightAt(p.x + Math.cos(k * 1.5708) * (p.r + 0.8), p.z + Math.sin(k * 1.5708) * (p.r + 0.8)) < -0.2) && beat.reach(p.x, p.z) > p.r + 3).slice(0, 9);
    const ducks = [true, false].map((male) => { const b = makeBuilder(); duckInto(b, male); const m = new THREE.InstancedMesh(b.toGeometry(), timber, Math.max(1, pairs.length)); m.count = pairs.length; QG[0].add(m); return m; });
    await rest(3);
    const setDucks = (time) => {
      for (let i = 0; i < pairs.length; i++) {
        const p = pairs[i];
        for (let k = 0; k < 2; k++) {
          const a = p.ph + time * TAU / p.T - k * 1.5 / p.r;
          dummy.position.set(p.x + Math.cos(a) * p.r, 0.03 * Math.sin(time * 1.3 + i + k), p.z + Math.sin(a) * p.r); dummy.rotation.set(0, Math.atan2(-Math.cos(a), -Math.sin(a)), 0); dummy.scale.setScalar(1.5); dummy.updateMatrix();
          ducks[k].setMatrixAt(i, dummy.matrix);
        }
      }
      for (const m of ducks) m.instanceMatrix.needsUpdate = true;
    };
    setDucks(0); for (const m of ducks) { m.computeBoundingSphere(); m.boundingSphere.radius += 6; }
    life[0].push((dt, time) => setDucks(time));
    await rest();
    // the children of the spring festival: four dressed as birds with cherry in silver, four as butterflies with kerria in gold,
    // each four treading a slow round on the sand between the hall's stair and the water
    const rg = R.girls;
    // (each round starts from an angle dealt from a stream of the rounds' own)
    const rings = [[true, 109, 58], [false, 99, 60.5]].map(([birds, cx, cz]) => {
      const b = makeBuilder();
      for (let k = 0; k < 4; k++) {
        const a = k * TAU / 4 + 0.4;
        figureInto(b, rg, Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2, birds ? Math.PI - a : -a, { kind: 'girl', h: 1.9, robe: birds ? lin('#c8323c') : lin('#a8b84a'), hem: birds ? lin('#f3c9d2') : lin('#ffc21a'),
          wings: birds ? lin('#3a8a8a') : lin('#ffd84a'), carry: 'vase', carryCol: birds ? lin('#d8dce4') : PAL.gilt, sprig: birds ? lin('#f3c9d2') : lin('#ffc21a') });
      }
      const m = new THREE.Mesh(b.toGeometry(), timber); m.position.set(cx, heightAt(cx, cz), cz); QG[0].add(m); return { m, turn: birds ? 1 : -1, a0: stream('girls:rounds').range(0, TAU) };
    });
    const turnRings = (dt, time) => { for (const r of rings) r.m.rotation.y = r.a0 + r.turn * time * TAU / 46; };
    turnRings(0, 0); life[0].push(turnRings);
    await rest();

    // ------------------------------------------------------------ fire, and the life of the summer dusk
    const faunaLight = (q) => { const o = STATES[q].raw, e = o.expo || 1, sn = STATES[q].sun; return { sunDir: [sn.x, sn.y, sn.z], sunColor: o.sunCol, sunIntensity: o.sunI * e, sky: o.hemiSky, skyIntensity: o.hemiI * e, ground: o.hemiGround, groundIntensity: o.hemiI * e }; };
    const flameMat = new THREE.ShaderMaterial({ uniforms: { uTime: tU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'attribute float aPh; varying vec2 vUv; varying float vPh; uniform float uTime; void main(){ vUv = uv; vPh = aPh; vec3 p = position; p.x += sin(uTime * 3.1 + aPh * 5.0 + position.y * 2.0) * 0.07 * uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec2 vUv; varying float vPh;
        float hh(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
        float hn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x), mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x), f.y); }
        void main(){
          float n = hn(vec2(vUv.x * 3. + vPh, vUv.y * 2.5 - uTime * 2.6)) * .6 + hn(vec2(vUv.x * 7. + vPh * 2., vUv.y * 5. - uTime * 4.1)) * .4;
          float w = 1. - abs(vUv.x - .5) * 2.;
          float body = smoothstep(0., .3, w - vUv.y * (0.5 + 0.7 * n)), core = smoothstep(.2, .8, w - vUv.y * 0.95 + n * .2);
          vec3 c = mix(vec3(1., .26, .03), vec3(1., .7, .24), core) * (0.8 + 0.7 * core);
          gl_FragColor = vec4(c * body * (1. - vUv.y * 0.55) * smoothstep(0., .06, vUv.y), 1.);
        }` });
    // crossed sheets of flame for a list of fires [x, y, z, width, height]
    const flameMesh = (list) => {
      const P = [], U = [], A = [], I = [];
      list.forEach(([x, y, z, w, h], n) => { for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + n, cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2, o = P.length / 3, ph = n * 1.7 + k; P.push(x - cx, y, z - cz, x + cx, y, z + cz, x + cx, y + h, z + cz, x - cx, y + h, z - cz); U.push(0, 0, 1, 0, 1, 1, 0, 1); A.push(ph, ph, ph, ph); I.push(o, o + 1, o + 2, o, o + 2, o + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(A, 1)); g.setIndex(I); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, flameMat); m.renderOrder = 2; return m;
    };
    // an iron basket of coals on three legs, h metres high
    const basketInto = (b, x, y, z, h) => {
      b.tr(x, y, z, 0); b.surf(SURF.TIMBER).col(PAL.iron);
      for (let k = 0; k < 3; k++) { const a = k * TAU / 3; b.beam([Math.cos(a) * 0.55, -0.2, Math.sin(a) * 0.55], [Math.cos(a) * 0.2, h, Math.sin(a) * 0.2], 0.06, 0.06); }
      b.cyl(0, h - 0.05, h + 0.4, 0, 0.26, 8, 0.46); b.surf(SURF.PLASTER, 1.6).col([0.25, 0.08, 0.02]); b.cyl(0, h + 0.3, h + 0.36, 0, 0.4, 8, 0.4, true); b.pop();
    };
    const extra = [0, 1, 2, 3].map(() => makeBuilder(4096)), _cp0 = new THREE.Vector3();
    basketInto(extra[1], FIRE[0], FIRE[1], FIRE[2], 0.9); solids.push([FIRE[0], FIRE[2], 0.6, 'watch fire']);
    const watchTree = flora.makeScatter({ rng: R['tint:watchtree'], points: [{ x: 0, y: 0, z: 0, s: wt.s, rot: wt.rot, v: 0, d: 12, u: 0 }], variants: [G.grove[1]], material: fmat });
    watchTree.object.position.set(wt.x, heightAt(wt.x, wt.z) - 0.25, wt.z); watchTree.object.quaternion.setFromAxisAngle(_cp0.set(wt.dz, 0, -wt.dx), 0.3); QT[1].add(watchTree.object); solids.push([wt.x, wt.z, 0.7, 'leaning tree']);
    // its light: a lamp of the place, at one strength for ever (the flame's shake is the shader's, on the clock)
    H.lamp(FIRE[0], FIRE[1] + 2.3, FIRE[2], 30, '#ff9a3c', 420, 0.3);
    const watchFlame = flameMesh([[FIRE[0], FIRE[1] + 1.15, FIRE[2], 1.3, 1.9]]); QG[1].add(watchFlame);
    const sparks = fx.makeParticles({ rng: R.fire, preset: 'embers', time: tU, follow: false, center: [FIRE[0], FIRE[1] + 3.6, FIRE[2]], box: [2.4, 5, 2.4], count: 50, size: [0.03, 0.07] });
    const watchSmoke = fx.makeSmokeColumn({ rng: R.smoke, time: tU, position: [FIRE[0], FIRE[1] + 2.2, FIRE[2]], height: 10, radius: [0.25, 1.8], size: [0.8, 3.2], count: 36, color: '#3a4040', colorTop: '#5a6468', opacity: 0.3, hot: '#ff6a1c', hotFalloff: 2.5, wind: [-0.5, 0, -0.4], sunDir: STATES[1].sun });
    QG[1].add(sparks.object, watchSmoke.object);
    life[1].push((dt, time, camera) => { sparks.update(dt, time, camera); watchSmoke.update(dt, time, camera); });
    await rest();
    // fireflies over the brook and the cool spring, and a cluster before one bay of the summer hall (which bay is the visit's)
    const rf = R.fireflies, flyAt = [];
    for (let i = 0; i < 420; i++) { const m = rf.range(mBridge + 22, mCross - 30), off = rf.range(1, 15) * (rf.chance(0.5) ? 1 : -1), up = rf.range(0.4, 3.6), p = route[Math.round(m)], rr = rightAt(m), x = p.x + rr[0] * off, z = p.z + rr[1] * off; flyAt.push([x, Math.max(heightAt(x, z), 0.1) + up, z]); }
    for (let i = 0; i < 90; i++) { const a = rf.range(0, TAU), r = POOL.r + rf.range(-6, 9), up = rf.range(0.4, 3), x = POOL.x + Math.cos(a) * r, z = POOL.z + Math.sin(a) * r; flyAt.push([x, Math.max(heightAt(x, z), 0.12) + up, z]); }
    await rest();
    const nFly = Math.round(flyAt.length * Math.min(1, many));
    const fireflies = F.makeFireflies({ rng: rf, positions: flyAt.slice(0, nFly), count: nFly, color: '#d8ff7a', color2: '#ffe08a', size: 0.2, blink: 0.3 });
    const fbay = hallSummer.front[fireflyBay], fbw = hallSummer.toWorld(fbay.x, hallSummer.yF + 1.5, HALLS.summer.d / 2 + 0.35);
    const bayFlies = F.makeFireflies({ rng: stream('fireflies:bay'), positions: [fbw], count: 34, jitter: 0.6, color: '#d8ff7a', size: 0.14, blink: 0.5, roam: [0.5, 0.4, 0.5, 0.05] });
    QG[1].add(fireflies.object, bayFlies.object);
    await rest(3);
    // horses at the riding ground's rail, a heron in the shallows of the cool spring, egrets in the lake's
    const horses = F.makeHerd({ rng: R.horses, species: 'horse', count: 3, size: 1.5, center: [171, GY, -66], radius: 13, heightAt, light: faunaLight(1) });
    await rest(8);
    const rhn = R.heron, wadeDice = []; for (let i = 0; i < 24; i++) { const a = rhn.range(0, TAU), r = POOL.r - rhn.range(0.5, 2.4); wadeDice.push([POOL.x + Math.cos(a) * r, 0.12, POOL.z + Math.sin(a) * r]); }
    const heron = F.makeWaders({ rng: rhn, species: 'heron', positions: wadeDice.filter((p) => heightAt(p[0], p[2]) < 0).slice(0, 2), count: 2, level: 0.12, heightAt, size: 1.5, light: faunaLight(1) });
    await rest(8);
    const egretAt = keepBy(dice('egret', 200, 36, 66, 170, 236), { lane: 12, gap: 14, max: 4, low: -0.5, pad: 3, ok: (p, y) => y < -0.12 });
    const egrets = F.makeWaders({ rng: R['tint:egret'], species: 'egret', positions: egretAt.map((p) => [p.x, 0, p.z]), count: Math.max(1, egretAt.length), level: 0, heightAt, size: 1.5, light: faunaLight(0) });
    QG[1].add(horses.object, heron.object); QG[0].add(egrets.object);
    life[1].push((dt, time, camera) => { fireflies.update(dt, time, camera); bayFlies.update(dt, time, camera); horses.update(dt, time, camera); heron.update(dt, time, camera); });
    life[0].push((dt, time, camera) => egrets.update(dt, time, camera));
    await rest(4);

    // ------------------------------------------------------------ autumn: the household on the border gallery, geese over the field
    // Three or four of the household walk the long gallery to and fro for ever, each on a stream of its own (phase, pace, how far
    // from the middle line it keeps): the page girl with her box (she hands it to no one), two pages bearing a curtained frame along
    // (whoever walks inside is never seen: only sleeve edges under its hem), a page with a folded cloth, a girl with a spray in a vase.
    // Each goes from 6 m inside one end to 6 m inside the other and back, keeping to one side each way. None waits for anyone.
    const one = (g, o) => { const b = makeBuilder(); figureInto(b, g, 0, 0, 0, 0, o); return new THREE.Mesh(b.toGeometry(), timber); };
    const aset = SETS.autumn[setK];
    const curtained = (g) => {
      const b = makeBuilder(), ph = g.range(0, TAU), cs = 0.06;
      for (const sz of [-1.45, 1.45]) figureInto(b, g, 0, 0, sz, 0, { kind: 'page', h: 1.8, robe: sz > 0 ? lin('#6a4a2a') : lin('#3f5a4a'), hem: PAL.plaster });
      b.surf(SURF.TIMBER).sway(0).col(PAL.dark, 1.6);
      for (const sx of [-0.5, 0.5]) b.beam([sx, 1.78, -1.5], [sx, 1.78, 1.5], 0.06, 0.06);
      for (const sx of [-0.5, 0.5]) {
        b.surf(SURF.CLOTH).sway(0, ph + sx);
        b.quad([sx, 0.22, -1.15], [sx, 0.22, 1.15], [sx, 1.76, 1.15], [sx, 1.76, -1.15], null, { cols: [aset[1], aset[1], aset[4], aset[4]], sways: [cs, cs, 0, 0] });
        b.tr(sx, 0, 0, sx > 0 ? Math.PI / 2 : -Math.PI / 2); sleeveInto(b, g.range(-0.5, 0.5), 0.02, 0.05, g.range(0.5, 0.7), aset, ph); b.pop();
      }
      return new THREE.Mesh(b.toGeometry(), timber);
    };
    const walkerKinds = [
      (g) => one(g, { kind: 'girl', h: 1.9, robe: lin('#5a3a7a'), hem: lin('#c8a23a'), carry: 'box', carryCol: [0.03, 0.025, 0.03], sprig: lin('#b8231c') }),
      curtained,
      (g) => one(g, { kind: 'page', h: 1.8, robe: lin('#3f5a4a'), hem: PAL.plaster, carry: 'box', carryCol: lin('#c8b89a'), sprig: lin('#e8dca0') }),
      (g) => one(g, { kind: 'girl', h: 1.85, robe: aset[1], hem: aset[3], carry: 'vase', carryCol: PAL.gilt, sprig: lin('#e8861c') }),
    ];
    // how many walk (the page girl and the curtained frame always): every stream's draws are taken whether or not its walker is out
    const walkerCount = R.walkers.int(3, 4), walkers = [];
    for (let i = 0; i < walkerKinds.length; i++) {
      const g = R['walker' + i], w = { mesh: walkerKinds[i](g), phase: g.range(0, TAU), pace: i === 1 ? g.range(0.5, 0.7) : g.range(0.75, 1.15), off: g.range(0.35, 0.95), turns: i !== 1 };
      if (i < walkerCount) { QG[2].add(w.mesh); walkers.push(w); }
    }
    await rest();
    const walkAt = (w, time, out) => { const L = borderGallery.L, a = w.phase + time * TAU / (2 * (L - 12) / w.pace), p = borderGallery.at(L / 2 + (L / 2 - 6) * Math.cos(a), w.off * Math.sin(a), 0); out.set(p[0], p[1], p[2]); return out; };
    const gp = new THREE.Vector3(), gq = new THREE.Vector3(), galleryYaw = Math.atan2(borderGallery.at(1)[0] - borderGallery.at(0)[0], borderGallery.at(1)[2] - borderGallery.at(0)[2]);
    const moveWalkers = (dt, time) => { for (const w of walkers) { walkAt(w, time, gp); walkAt(w, time + 0.25, gq); w.mesh.position.copy(gp); w.mesh.rotation.y = w.turns ? Math.atan2(gq.x - gp.x, gq.z - gp.z) : galleryYaw; } };
    moveWalkers(0, 0); life[2].push(moveWalkers);
    const gooseLoop = []; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; gooseLoop.push([-84 + Math.cos(a) * 96, 38 + 6 * Math.sin(a * 2), 62 + Math.sin(a) * 78]); }
    const geese = F.makeFlock({ rng: R.birds, species: 'geese', count: 13, size: 1.5, route: gooseLoop, closed: true, speed: 13, light: faunaLight(2) });
    QG[2].add(geese.object); life[2].push((dt, time, camera) => geese.update(dt, time, camera));
    await rest(3);
    // ------------------------------------------------------------ winter: the children rolling a great ball of snow, fire baskets at the stair, lanterns
    solids.push([BALL[0], BALL[2], 1.3, 'snowball'], [BALL[0], BALL[2] + 1.9, 1.6, 'children']);
    const ball = (() => { const b = makeBuilder(); b.surf(SURF.SNOW).col(PAL.snow); b.grid(14, 9, (u, v) => { const a = u * TAU, t = v * Math.PI, bump = 1 + 0.05 * Math.sin(a * 3 + t * 5); return [Math.sin(t) * Math.cos(a) * 1.3 * bump, -Math.cos(t) * 1.3 * bump, Math.sin(t) * Math.sin(a) * 1.3 * bump]; }, { uv: (u, v) => [u * 8, v * 4] }); return new THREE.Mesh(b.toGeometry(), timber); })();
    const pushers = (() => {
      const b = makeBuilder(), ws = SETS.winter[setK];
      for (let k = 0; k < girlCount; k++) { const a = (k / (girlCount - 1) - 0.5) * 2.3, r = 1.3 + 0.5 + (k % 2) * 0.5; figureInto(b, rg, Math.sin(a) * r, 0, Math.cos(a) * r, Math.PI + a * 0.6, { kind: 'girl', h: 1.85, robe: ws[k % 5], hem: ws[(k + 2) % 5], lean: 0.28 }); }
      return new THREE.Mesh(b.toGeometry(), timber);
    })();
    QG[3].add(ball, pushers);
    const moveBall = (dt, time) => { const k = Math.sin(time * 0.8 + ballPhase); ball.rotation.x = -0.14 * k; ball.position.set(BALL[0], BALL[1] + 1.22, BALL[2] - 0.18 * k); pushers.position.set(BALL[0], BALL[1], BALL[2] - 0.18 * k); };
    moveBall(0, 0); life[3].push(moveBall);
    await rest();
    const sf = hallWinter.stairFoot, fires = [-1, 1].map((sx) => [sf[0] + sx * 7.5, GY, sf[2] - 0.5]);
    for (const f of fires) { basketInto(extra[3], f[0], f[1], f[2], 1.5); solids.push([f[0], f[2], 0.6, 'fire basket']); }
    // three more iron baskets burn along the frozen stream's near bank, 39 m apart, the first 27 m inside the gallery
    const laneSide = (i) => { const a = iceLine[i - 1], c = iceLine[i + 1], tl = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, nx = (c[1] - a[1]) / tl, nz = -(c[0] - a[0]) / tl, sg = nx > 0 ? 1 : -1; return [nx * sg, nz * sg]; };
    const bankFires = [9, 22, 35].map((k) => { const i = iceLine.length - 1 - k, n = laneSide(i), off = iceHalf(i) + 1.3, x = iceLine[i][0] + n[0] * off, z = iceLine[i][1] + n[1] * off; return [x, heightAt(x, z), z]; });
    for (const f of bankFires) { basketInto(extra[3], f[0], f[1], f[2], 1.5); solids.push([f[0], f[2], 0.6, 'fire basket']); H.lamp(f[0], f[1] + 2.3, f[2], 26, '#ff9a3c', 80, 0.3); }
    const courtFlames = flameMesh([...fires, ...bankFires].map((f) => [f[0], f[1] + 1.75, f[2], 1.0, 1.5])); QG[3].add(courtFlames);
    { const g = fx.makeGlows({ rng: R.baskets, time: tU, positions: [...fires, ...bankFires].map((f) => [f[0], f[1] + 2.2, f[2]]), color: '#ff9a3c', size: 3.4, intensity: 1.3, flicker: 0.3 }); QG[3].add(g.object); life[3].push((dt, time, camera) => g.update(dt, time, camera)); }
    await rest();
    // the two at the stair light it; the lamps behind the hall's blinds throw their gold on the stair and the snow: lamps of the place, at one strength for ever
    for (const f of fires) H.lamp(f[0], f[1] + 2.3, f[2], 22, '#ff9a3c', 40, 0.3);
    H.lamp(sf[0], GY + 7, sf[2] + 8, 80, '#ffc66a', 150, 0.04);
    // lanterns under the front eaves of the halls that are lit: one before every second post
    const lanternAt = [];
    const lanterns = (q, hall, H) => {
      for (let i = 1; i < H.bays; i += 2) {
        const lx = -H.w / 2 + i * hall.sp; if (hall.open && lx > hall.open[0] - 0.1 && lx < hall.open[1] + 0.1) continue;
        const p = hall.toWorld(lx, H.eave - 1.25, H.d / 2 + 3.6), b = extra[q];
        b.surf(SURF.TIMBER).col(PAL.iron); b.box(p[0] - 0.02, p[1] + 0.3, p[2] - 0.02, p[0] + 0.02, p[1] + 1.1, p[2] + 0.02); b.cyl(p[0], p[1] + 0.27, p[1] + 0.36, p[2], 0.3, 6, 0.06, true);
        b.surf(SURF.PLASTER, 2.2).col(PAL.plaster, 0.9); b.cyl(p[0], p[1] - 0.25, p[1] + 0.27, p[2], 0.2, 6, 0.24);
        lanternAt.push([q, p]);
      }
    };
    lanterns(1, hallSummer, HALLS.summer); lanterns(3, hallWinter, WH); if (night) lanterns(0, hallSpring, HALLS.spring);
    const glows = [0, 1, 3].map((q) => { const pts = lanternAt.filter((l) => l[0] === q).map((l) => l[1]); if (!pts.length) return null; const g = fx.makeGlows({ rng: R['glow' + q], time: tU, positions: pts, color: '#ffc66a', size: 2.4, intensity: 1.5, flicker: 0.12 }); QG[q].add(g.object); life[q].push((dt, time, camera) => g.update(dt, time, camera)); return g; });
    await rest();
    // ------------------------------------------------------------ set stones: a rock face round the fall, stones at the brook's edge, round the cool spring, in the frozen stream
    const rs = R.stones;
    // a stone's five shape numbers, thrown from its stream before anything is tried
    const rockShape = (g) => [g.range(0, TAU), g.range(0, TAU), g.range(0, TAU), g.range(0, TAU), g.range(0.8, 1.15)];
    // (wetY: a stone at the water is wet and dark up to this height over its own foot: a hand and a half over the water)
    const rockInto = (b, x, y, z, sx, sy, sz, tone, snow, sh, wetY) => {
      const p0 = sh[0], p1 = sh[1], p2 = sh[2], yaw = sh[3], base = mul(C.stone, tone * sh[4]);
      b.tr(x, y, z, yaw); b.surf(SURF.PLASTER).sway(0);
      b.grid(8, 5, (u, v) => { const a = u * TAU, t = v * Math.PI, r = 1 + 0.2 * Math.sin(a * 2 + p0) * Math.sin(t * 2 + p1) + 0.13 * Math.sin(a * 3 + p2 + t * 3); return [Math.sin(t) * Math.cos(a) * sx * r, (0.3 - Math.cos(t) * 0.7) * sy * r, Math.sin(t) * Math.sin(a) * sz * r]; },
        { lattice: true, wrapU: true, uv: (u, v) => [u * (sx + sz) * 3, v * sy * 2], color: (u, v) => { const c = v > 0.62 ? mix3(base, snow ? PAL.snow : C.mossy, snow ? 0.95 : 0.55) : mul(base, 0.75 + 0.35 * v); return wetY !== undefined && (0.3 - Math.cos(v * Math.PI) * 0.7) * sy < wetY ? mul(c, 0.48) : c; } });
      b.pop();
    };
    // The fall's rock: three ledges of real stone, one under each lip, stepping down to the pool: the lowest 17 m wide and 8 m high, the next 14 m,
    // the top 11 m; each a craggy face with a level top, the water's channel worn dark in its middle; great boulders close each ledge's ends and ring the pool.
    {
      const b = extra[2], g = R.ledges, steps = FALL.steps, rockC = mul(C.stone, 0.62), wetC = mul(C.stone, 0.3), mossC = mix3(C.mossy, C.litter, 0.25);
      b.tr(FALL.x, 0, FALL.z, -Math.PI / 4); b.surf(SURF.PLASTER).sway(0);
      steps.forEach(([d, y, w], i) => {
        const W = 11 + i * 3, foot = i === steps.length - 1 ? FALL.level - 1 : steps[i + 1][1] - 0.6, back = i === 0 ? d + 6.5 : steps[i - 1][0] + 0.8, p0 = g.range(0, TAU), p1 = g.range(0, TAU), p2 = g.range(0, TAU);
        const f = (u, v) => {
          const x = (u - 0.5) * W, e = Math.pow(Math.abs(u * 2 - 1), 3), face = v < 0.5, t = face ? v * 2 : (v - 0.5) * 2, yy = face ? lerp(foot, y, t) : y;
          const crag = 0.55 * Math.sin(u * 9 + p0) * Math.sin(yy * 0.8 + p1) + 0.3 * Math.sin(u * 23 + p2 + yy * 1.7), chan = 1 - smoothstep(w * 0.5, w * 0.5 + 0.9, Math.abs(x));
          return [x, yy - (face ? 0 : 0.18 * chan - 0.22 * (1 - chan) * Math.sin(u * 13 + p1) * Math.sin(t * 5 + p0)) - e * (face ? 0 : 1.2), (face ? d - 0.5 * (1 - t) + crag * (1 - 0.6 * chan) : lerp(d, back, t)) + e * 2.6];
        };
        b.grid(16, 10, f, { vs: [0, 0.07, 0.15, 0.24, 0.33, 0.42, 0.5, 0.56, 0.68, 0.84, 1], uv: (u, v) => [u * W * 0.5, v * 12],
          color: (u, v) => { const x = (u - 0.5) * W, chan = 1 - smoothstep(w * 0.5 - 0.3, w * 0.5 + 0.7, Math.abs(x)), band = 0.8 + 0.3 * Math.sin(v * 43 + p0 + u * 3), top = v > 0.5 ? 0.7 * (1 - chan) * (0.5 + 0.5 * Math.sin(u * 17 + p2)) : 0; return mix3(mix3(mul(rockC, band), mossC, top), wetC, chan * 0.85); } });
        for (const sg of [-1, 1]) rockInto(b, sg * (W / 2 + g.range(0.2, 1.2)), foot - 0.5, d + g.range(1.2, 2.4), g.range(2.4, 3.2), (y - foot) * g.range(0.62, 0.78), g.range(2.2, 3), 0.7, 0, rockShape(g));
      });
      for (const [side, d] of [[-7.6, 1.5], [7.8, 1.2], [-6.2, -2.6], [6.4, -2.9], [-10.5, 4.5], [10.8, 4.2]]) rockInto(b, side, FALL.level - 0.6, d, g.range(1.5, 2.3), g.range(1.4, 3.2), g.range(1.5, 2.2), 0.75, 0, rockShape(g));
      b.pop();
    }
    await rest(4);
    // THE FALL IS SEATED. One rule of FALL's place, in the fall's own frame (metres uphill of the pool, metres to the side): two shoulders of
    // rock stand either side of the top lip and a crag behind it, each higher than the lip, so that the water comes out of a notch of the
    // rock's own top and not from its tip; lower shoulders step down either side of the second and third ledges; two more close the top
    // behind. Each stands on the ground's own height at its place. A stream of its own (fall:seat), made here; every number first.
    const fallSeat = [], fallTrees = [], fallRocks = makeBuilder(1024), _cp2 = new THREE.Vector3();
    {
      const g = stream('fall:seat');
      const dealt = [[15, -7.2, 4.6, 5.2, 4.4], [15.4, 7.4, 4.4, 5.6, 4.6], [19.8, 0.4, 6.2, 6.6, 5.2], [11.5, -9.6, 4.2, 6, 4], [11.8, 9.8, 4, 5.6, 4.2], [8.5, -12.5, 3.8, 4.6, 3.6], [8.8, 12.2, 3.6, 4.2, 3.4], [22.5, -7.5, 4.6, 4.2, 4.4], [22.8, 7.6, 4.4, 4, 4.6]]
        .map(([s, side, sx, sy, sz]) => ({ s: s + g.range(-0.7, 0.7), side: side + g.range(-0.7, 0.7), k: g.range(0.9, 1.12), sx, sy, sz, sh: rockShape(g) }));
      for (const d of dealt) {
        const p = fallAt(d.s, d.side), y = heightAt(p[0], p[1]), sy = d.sy * d.k;
        rockInto(fallRocks, p[0], y - 0.35 * sy, p[1], d.sx * d.k, sy, d.sz * d.k, 0.62, 0, d.sh); fallSeat.push([p[0], p[1], y + 0.6 * sy, Math.max(d.sx, d.sz) * d.k]);
      }
    }
    await rest(2);
    // stones at the water's edge along the brook: every number first (the places, then the shapes), kept where the bank meets the water;
    // none stands higher than 0.8 m
    const stoneDice = []; for (let i = 0; i < 110; i++) { const m = rs.range(mBridge + 10, mArc2), off = (halfW(m) + rs.range(-0.3, 1.6)) * (rs.chance(0.5) ? 1 : -1), size = rs.range(0.35, 0.75), p = route[Math.round(m)], rr = rightAt(m); stoneDice.push([p.x + rr[0] * off, p.z + rr[1] * off, size]); }
    for (const d of stoneDice) d.push(rockShape(rs));
    for (let i = 0; i < stoneDice.length; i++) { const d = stoneDice[i]; if (i % 36 === 35) await rest(); const y = heightAt(d[0], d[1]); if (y < -0.7 || y > 0.7 || Math.hypot(d[0], d[1]) < 30) continue; rockInto(extra[quarterOf(d[0], d[1])], d[0], y - 0.12, d[1], d[2] * 1.3, d[2], d[2] * 1.1, 0.85, 0, d[3], waterY(nearRoute(d[0], d[1]).m) + 0.26 - y); }
    await rest();
    // mossy stones set through the autumn field, 6 to 14 m from the lane: every number of a stone first (its shape too), kept on dry ground
    { const g = R.litter;
      for (let i = 0; i < 34; i++) {
        const m = g.range(mCross + 30, mWest2), off = g.range(6, 14) * (g.chance(0.5) ? 1 : -1), size = g.range(0.45, 1.0), sh = rockShape(g), p = route[Math.round(m)], rr = rightAt(m), x = p.x + rr[0] * off, z = p.z + rr[1] * off, y = heightAt(x, z);
        if (y < waterY(m) + 0.1 || builtAt(x, z, 2)) continue;
        rockInto(extra[2], x, y - 0.3 * size, z, size * 1.4, size * 0.8, size * 1.1, 0.75, 0, sh); solids.push([x, z, size * 1.4, 'field stone']);
      } }
    await rest();
    // round the cool spring (a stream of their own)
    for (let i = 0, g = stream('stones:pool'); i < 9; i++) { const a = g.range(0, TAU), size = g.range(0.6, 1.4), sh = rockShape(g), x = POOL.x + Math.cos(a) * (POOL.r + 0.6), z = POOL.z + Math.sin(a) * (POOL.r + 0.6); rockInto(extra[1], x, heightAt(x, z) - 0.2, z, size * 1.3, size, size * 1.1, 0.8, 0, sh); }
    // snow-capped stones stand in the frozen stream and at its edges, all along it: every number of a stone first (its shape too), kept where the ice is
    { const g = R.icestones;
      for (let i = 0; i < 40; i++) {
        const k = g.int(2, iceLine.length - 3), off = g.range(-1.15, 1.15), size = g.range(0.45, 1.05), sh = rockShape(g), n = laneSide(k), hw = iceHalf(k), x = iceLine[k][0] + n[0] * off * hw, z = iceLine[k][1] + n[1] * off * hw;
        if (iceLine[k][1] > -6 || nearRoute(x, z).d < 4.5) continue;
        rockInto(extra[3], x, ICE.level - 0.25 * size, z, size * 1.3, size, size * 1.1, 0.9, 1, sh); solids.push([x, z, size * 1.3, 'stream stone']);
      } }
    await rest();
    // ------------------------------------------------------------ what stands near the lane in the court, 4 to 12 m off it, by one rule on every visit
    // Each kind has streams of its own (made here, after everything they read stands). Nothing of them stands on the ice or within
    // a metre of its edge (the bank's dead grass: a hand), on a line of tracks, under
    // a roof, on the children's ground or in the open sight of the ball, nor nearer than its own girth to anything that stood
    // before it. Low snow pines whose loaded boughs reach toward the lane; the frosted chrysanthemums of the gate carried on
    // along the lane's right in groups that thin out (five, four, three, two, two, one); half-buried stones with caps.
    const courtFree = (p, r, bank = 1) => iceIn(p.x, p.z) < -bank && ballOpen(p) && solids.every((s) => Math.hypot(s[0] - p.x, s[1] - p.z) > s[2] + r) && courtTracks.every((t) => Math.hypot(t[0] - p.x, t[1] - p.z) > r + 0.4);
    {
      for (const kind of ['courtpine', 'frostmum', 'deadgrass', 'snowbamboo']) for (const part of ['place:', 'tint:', 'shape:']) stream(part + kind);
      G.courtpine = G.snowpinelow; G.frostmum = G.mum;
      { const pts = keepBy(along('courtpine', 700, mGate + 16, LEN - 34, 7.5, 12, 0), { lane: 7.5, gap: 10, max: 4, pad: 3.5, ok: (p) => courtFree(p, 2.6) }); const sc = plant(3, 'courtpine', pts, 0.4, 0, SMALL); if (sc) sc.object.name = 'court:courtpine'; }
      await rest();
      {
        const g = R['place:frostmum'], list = [];
        [5, 4, 3, 2, 2, 1].forEach((n, k) => { const m0 = mGate + 58 + k * 17 + g.range(-3, 3); for (let i = 0; i < n + 5; i++) { const m = m0 + g.range(-2.6, 2.6), off = g.range(5.2, 7.6), q = route[Math.round(m)], r = rightAt(m); list.push({ x: q.x + r[0] * off, z: q.z + r[1] * off, ...die(g), grp: k, cap: n }); } });
        const had = [0, 0, 0, 0, 0, 0], pts = keepBy(list, { lane: 5, gap: 1.5, max: 40, ok: (p) => courtFree(p, 1) }).filter((p) => had[p.grp]++ < p.cap);
        const sc = plant(3, 'frostmum', pts, 0.9, 0, SMALL); if (sc) sc.object.name = 'court:frostmum';
      }
      await rest();
      {
        const g = stream('court:stones'), dice2 = [];
        for (let i = 0; i < 22; i++) { const m = g.range(mGate + 12, LEN - 30), off = g.range(6.5, 11.5) * (g.chance(0.5) ? 1 : -1), size = g.range(0.4, 0.9), sh = rockShape(g), q = route[Math.round(m)], r = rightAt(m); dice2.push({ x: q.x + r[0] * off, z: q.z + r[1] * off, size, sh }); }
        let n = 0;
        for (const d of dice2) {
          if (n >= 12 || builtAt(d.x, d.z, 2) || nearRoute(d.x, d.z).d < 6.5 || !courtFree(d, d.size * 1.4 + 1.5)) continue;
          rockInto(extra[3], d.x, heightAt(d.x, d.z) - 0.42 * d.size, d.z, d.size * 1.4, d.size * 0.9, d.size * 1.1, 0.85, 1, d.sh); solids.push([d.x, d.z, d.size * 1.4, 'court stone']); n++;
        }
      }
      await rest();
      // along the frozen stream's banks, within 2.4 m of the ice: the summer's pampas and reeds gone to straw, snow on their bent
      // heads; inside the gate, by the border gallery: bamboo bowed over under its load
      const straw = (geo, c) => { const a = geo.getAttribute('color'); for (let i = 0; i < a.count; i++) { const l = 0.45 + 0.9 * (0.3 * a.getX(i) + 0.6 * a.getY(i) + 0.1 * a.getZ(i)); a.setXYZ(i, c[0] * l, c[1] * l, c[2] * l); } return geo; };
      const bowed = (geo, H, bow) => { const a = geo.getAttribute('position'); for (let i = 0; i < a.count; i++) { const t = clamp(a.getY(i) / H, 0, 1.2); a.setXYZ(i, a.getX(i) + bow * H * t * t, a.getY(i) * (1 - 0.22 * t * t), a.getZ(i)); } geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo; };
      await shapes('deadgrass', 2, (g, i) => snowOn(straw(i ? flora.reedGeometry({ rng: g, height: 1.7, blades: 7, cattails: 2 }) : plumeGeometry({ rng: g, height: 2.3 }), lin(i ? '#a89868' : '#b8a678')), 0.8));
      {
        const g = R['place:deadgrass'], list = [];
        for (let i = 0; i < 90; i++) { const k = g.int(2, iceLine.length - 3), sg = g.chance(0.5) ? 1 : -1, n = laneSide(k), off = (iceHalf(k) + g.range(0.5, 2.4)) * sg; list.push({ x: iceLine[k][0] + n[0] * off, z: iceLine[k][1] + n[1] * off, ...die(g) }); }
        const sc = plant(3, 'deadgrass', keepBy(list, { lane: 4.2, gap: 1.3, max: 34, pad: 2, low: ICE.level + 0.03, ok: (p) => p.z < -8 && courtFree(p, 0.5, 0.3) }), 0, 0, SMALL); if (sc) sc.object.name = 'court:deadgrass';
      }
      await rest();
      const frosted = (geo, H) => { const a = geo.getAttribute('color'), q = geo.getAttribute('position'); for (let i = 0; i < a.count; i++) { const k = 0.3 + 0.5 * clamp(q.getY(i) / H, 0, 1); a.setXYZ(i, lerp(a.getX(i), PAL.snow[0] * 0.92, k), lerp(a.getY(i), PAL.snow[1] * 0.92, k), lerp(a.getZ(i), PAL.snow[2] * 0.92, k)); } return geo; };
      await shapes('snowbamboo', 2, (g, i) => frosted(snowOn(bowed(flora.bambooGeometry({ rng: g, detail: 1, height: 7.5 - i * 1.5, stalk: '#5f6a4a', leaf: '#56705a' }), 7.5 - i * 1.5, 0.42)), 7.5 - i * 1.5), 2);
      { const sc = plant(3, 'snowbamboo', keepBy(along('snowbamboo', 110, mGate + 5, mGate + 18, 6.5, 12, 0), { lane: 6.5, gap: 2.2, max: 10, pad: 1.2, ok: (p) => courtFree(p, 1.2) }), 0.5, 0, SMALL); if (sc) sc.object.name = 'court:snowbamboo'; }
    }
    await rest();
    // ------------------------------------------------------------ the frozen stream's snow: a lip along both banks, drifts lying across the ice
    // The wind has swept the ice dark and left its snow in two places: a lip a hand or two high where each bank meets the ice
    // (the ice's own edge, found on each row of the stream's line as the place where the ground comes up through the ice's
    // level), and long thin drifts lying on the ice along the wind, about every sixth metre of the stream (a stream of their own).
    {
      const b = extra[3], g = stream('ice:snow'), lipC = mul(PAL.snow, 0.94), ph = [g.range(0, TAU), g.range(0, TAU), g.range(0, TAU)];
      const edgeAt = (cx, cz, nx, nz) => { let lo = 0.4, hi = 8; if (heightAt(cx + nx * hi, cz + nz * hi) < ICE.level || heightAt(cx + nx * lo, cz + nz * lo) > ICE.level) return -1; for (let k = 0; k < 9; k++) { const mid = (lo + hi) / 2; if (heightAt(cx + nx * mid, cz + nz * mid) < ICE.level) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      const rows = []; for (let i = 1; i < iceLine.length - 1; i++) if (iceLine[i][1] < -6) rows.push(i);
      const ds = [-0.55, -0.3, 0, 0.4, 1.0], hs = [0, 0.15, 0.25, 0.18, 0.02];
      for (const sg of [1, -1]) {
        const e = rows.map((i) => { const n = laneSide(i); return edgeAt(iceLine[i][0], iceLine[i][1], n[0] * sg, n[1] * sg); });
        const turned = (() => { const i = rows[0], n = laneSide(i), a = iceLine[i], c = iceLine[i + 1]; return ((c[0] - a[0]) * n[1] * sg - (c[1] - a[1]) * n[0] * sg) > 0; })();
        b.surf(SURF.SNOW).sway(0);
        b.grid(rows.length - 1, 4, (u, v) => {
          const k = Math.round(u * (rows.length - 1)), j = Math.round(v * 4), i = rows[k], n = laneSide(i), ee = e[k], on = ee > 0, d = (on ? ee : iceHalf(i)) + ds[j];
          const x = iceLine[i][0] + n[0] * sg * d, z = iceLine[i][1] + n[1] * sg * d, tall = on ? 0.65 + 0.35 * Math.sin(i * 0.9 + ph[0]) * Math.sin(i * 0.37 + ph[1] + sg) + 0.2 * Math.sin(i * 2.3 + ph[2]) : 0;
          return [x, (on ? Math.max(ICE.level, heightAt(x, z)) + 0.015 + hs[j] * tall : ICE.level - 0.06), z];
        }, { lattice: true, flip: turned, color: () => lipC });
        await rest(2);
      }
      for (let m = 4, n = 0; m < 170 && n < 30; m += g.range(3.5, 8.5), n++) {
        const k = Math.min(iceLine.length - 3, 2 + Math.floor(m / 3)), side = g.range(-0.8, 0.8), a = g.range(2.4, 5.2), wd = g.range(0.3, 0.75), turn = g.range(-0.3, 0.3), p0 = g.range(0, TAU), tall = g.range(0.06, 0.12), bend = g.range(-0.5, 0.5);
        if (iceLine[k][1] > -8) continue;
        const nn = laneSide(k), hw = iceHalf(k), cx = iceLine[k][0] + nn[0] * side * hw, cz = iceLine[k][1] + nn[1] * side * hw, ax = PLACE.WIND[0] * Math.cos(turn) - PLACE.WIND[1] * Math.sin(turn), az = PLACE.WIND[0] * Math.sin(turn) + PLACE.WIND[1] * Math.cos(turn);
        b.surf(SURF.SNOW).sway(0);
        b.grid(12, 2, (u, v) => { const t = u * 2 - 1, e = 1 - t * t, w = wd * Math.pow(e, 0.7) * (1 + 0.3 * Math.sin(t * 7 + p0)), c = (v * 2 - 1) * w + bend * e; return [cx + ax * a * t + az * c, ICE.level + 0.012 + tall * e * (1 - (v * 2 - 1) * (v * 2 - 1)), cz + az * a * t - ax * c]; }, { lattice: true, color: () => lipC });
      }
    }
    await rest(2);
    // ------------------------------------------------------------ the court's sheet is laid, now that everything of the court stands
    // THE MOON'S SHADE ON THE SNOW. By the moon's one station (north-north-west, 21 degrees up, for ever) a metre of height throws
    // 2.6 m of shade to the south-south-east, and each thing's shade begins at its own foot. A pine lays its trunk's line and,
    // further out, its crown as one mass, clear-edged where it begins and soft at its far end (how broad, and which way its tip
    // leans, from a stream of the shade's own); a storehouse, a side gallery of the hall and its pavilion lay their walls, floors and
    // roofs as slabs, a gallery its posts; the ball, the children, the fire baskets and the stream's capped stones their own
    // short ones. Nothing is laid that has no thing to throw it. The hall's own shade is not laid (it would cover the whole of
    // the last approach); the gate and the border gallery stand on the court's south edge, and by this moon their shade falls
    // away from the court.
    // THE SNOW'S FORM: the slope of the court's ground (the ground rule's own heights, read every metre, its drifts raised as
    // the sheet says) and of the furrow the ball was rolled along; and snow pressed down: that furrow, as wide as the ball, and the lanes the children trod beside it.
    {
      const sh = courtSheet, mass = stream('moonshade:mass');
      const pineShade = (x, z, h) => {
        // the trunk's line from the foot; then the crown as ONE mass: it begins broad and clear-edged where the lowest loaded boughs
        // throw it, narrows to the tip, and its far end is soft. (The mass has a stream of its own, moonshade:mass: one number for
        // the way its tip leans and one for its breadth, a pine; nothing else is drawn from it.)
        sh.cast(x, z, 0, 0.42 * h, 0.03 * h, 0.024 * h, 0.95);
        const lean = mass.range(-0.07, 0.07), wide = mass.range(0.088, 0.117);
        const t0 = sh.cot * 0.4 * h, t1 = sh.cot * h, sd = lean * h * 0.6;
        sh.blade(0, x + sh.dx * t0, z + sh.dz * t0, x + sh.dx * t1 - sh.dz * sd, z + sh.dz * t1 + sh.dx * sd, h * (0.07 + 0.8 * wide), h * 0.03, 0.9, 0.5, 0.3, 1.4);
      };
      for (const [kind, h0, dh] of [['snowpine', 16.5, 3], ['snowpinelow', 7.5, 1.5], ['pinewood', 16.5, 3], ['courtpine', 7.5, 1.5]]) for (const p of planted[kind] || []) pineShade(p.x, p.z, (h0 - (p.v % 2) * dh) * p.s);
      // (the low things: a bush, a clump, a bamboo bowed over, each its own short blot)
      for (const [kind, top, r, k] of [['snowbush', 1.5, 1.1, 0.7], ['mum', 1.0, 0.8, 0.6], ['frostmum', 1.0, 0.8, 0.6], ['deadgrass', 1.7, 0.45, 0.55], ['snowbamboo', 5.2, 1.3, 0.75]]) for (const p of planted[kind] || []) sh.cast(p.x, p.z, 0, top * p.s, r * p.s, 0.6 * r * p.s, k);
      for (const s of hero.solids) if (s[3] === 'pine' || s[3] === 'pineLow') pineShade(s[0], s[1], s[3] === 'pine' ? 13.5 * s[2] / 0.6 : 7 * s[2] / 0.5);
      await rest(3);
      for (const [x, z, w, d] of STORES) { sh.slab(x, z, w / 2, d / 2, 0, 5.6, 0.85); sh.slab(x, z, w / 2 + 2.2, d / 2 + 2.2, 5.6, 6.9, 0.85); sh.slab(x, z, w / 2 + 2.2, d / 4 + 1.1, 6.9, 8.2, 0.85); sh.slab(x, z, w / 2 + 2.2, 0.6, 8.2, 9.4, 0.85); }
      await rest(2);
      for (const w of WINGS) {
        const za = WH.z + WH.d / 2 + 2.8, zb = w[1] - 5.2, zm = (za + zb) / 2, hd = (zb - za) / 2;
        sh.slab(w[0], zm, 1.8, hd, 1.25, 1.65, 0.85); sh.slab(w[0], zm, 3.2, hd + 1, 5.3, 5.9, 0.85); sh.slab(w[0], zm, 1.2, hd, 5.9, 6.5, 0.85);
        for (let k = 0; k <= 5; k++) for (const sx of [-1.7, 1.7]) sh.cast(w[0] + sx, za + (zb - za) * k / 5, 0, 5.3, 0.16, 0.16, 0.8);
        sh.slab(w[0], w[1], 5.6, 5.1, 1.2, 1.6, 0.85); sh.slab(w[0], w[1], 6.6, 6.1, 6.4, 7.2, 0.85); sh.slab(w[0], w[1], 3.5, 2, 7.2, 9.5, 0.85);
      }
      await rest(2);
      sh.cast(BALL[0], BALL[2], 0.2, 2.2, 1, 1.1, 0.9); sh.cast(BALL[0], BALL[2] + 1.9, 0, 1.7, 0.9, 0.7, 0.7);
      for (const f of [...fires, ...bankFires]) { sh.cast(f[0], f[2], 0, 1.5, 0.12, 0.3, 0.6); sh.cast(f[0], f[2], 1.5, 1.9, 0.4, 0.4, 0.7); }
      // a basket STANDS ON the snow: its three legs' short shade by its own fire (from each foot outward, a leg's length), and
      // the snow melted dark in a small ring under it (the sheet's pressed channel: the ground shows through)
      for (const f of [...fires, ...bankFires]) {
        for (let k = 0; k < 3; k++) { const a = k * TAU / 3, ux = Math.cos(a), uz = Math.sin(a); sh.blade(0, f[0] + ux * 0.5, f[2] + uz * 0.5, f[0] + ux * 1.75, f[2] + uz * 1.75, 0.16, 0.24, 0.92, 0.5, 0.22, 0.4); }
        sh.texels(f[0] - 1.5, f[2] - 1.5, f[0] + 1.5, f[2] + 1.5, (k, x, z) => sh.mark(k, 3, 0.92 * (1 - smoothstep(0.75, 1.3, Math.hypot(x - f[0], z - f[2])))));
      }
      // (and the ground itself shows where the snow is gone: under each basket a small ragged patch of dark wet earth with a rim
      // of wet snow about it, and across it each leg's short shade by the fire overhead, from the foot outward (on the bare
      // ground it ends where the fire's ray past the leg's top comes down, 0.95 m out; on the snow beyond, the sheet's); a stream of its
      // own, dealt here, after the baskets and the ground stand; the patch lies in the baskets' own mesh)
      {
        const b = extra[3], gm = stream('court:melt'), earthC = [0.075, 0.06, 0.05], wetC = [0.34, 0.36, 0.42], legC = [0.03, 0.026, 0.03];
        b.surf(SURF.PLASTER).sway(0);
        for (const f of [...fires, ...bankFires]) {
          const N = 16, at = (a, r, up, c) => { const x = f[0] + Math.cos(a) * r, z = f[2] + Math.sin(a) * r; return b.vert([x, Math.max(heightAt(x, z), iceIn(x, z) > 0 ? ICE.level : -99) + up, z], [0, 1, 0], x, z, c); };
          const c0 = at(0, 0, 0.07, earthC), rin = [], rout = [];
          for (let j = 0; j < N; j++) { const a = j * TAU / N, r = gm.range(0.7, 1.0); rin.push(at(a, r, 0.07, earthC)); rout.push(at(a, r + gm.range(0.18, 0.34), 0.05, wetC)); }
          for (let j = 0; j < N; j++) { const k = (j + 1) % N; b.tri(c0, rin[k], rin[j]); b.tri(rin[j], rin[k], rout[k]); b.tri(rin[j], rout[k], rout[j]); }
          for (let k = 0; k < 3; k++) {
            const a = k * TAU / 3, p0 = at(a - 0.09, 0.5, 0.085, legC), p1 = at(a + 0.09, 0.5, 0.085, legC), p2 = at(a + 0.06, 0.95, 0.075, legC), p3 = at(a - 0.06, 0.95, 0.075, legC);
            b.tri(p0, p1, p2); b.tri(p0, p2, p3);
          }
        }
      }
      for (const s of solids) if (s[3] === 'stream stone' || s[3] === 'court stone') sh.cast(s[0], s[1], 0, 0.58 * s[2], 0.8 * s[2], 0.5 * s[2], 0.8);
      // pressed snow: the furrow, the ball's own width; the lanes trodden either side of it
      for (let i = 0; i < 10; i++) {
        const a = trail(1.2 + i * 1.5, 0), b2 = trail(2.7 + i * 1.5, 0), l = trail(1.2 + i * 1.5, 2.15), l2 = trail(2.7 + i * 1.5, 2.15), r = trail(1.2 + i * 1.5, -1.9), r2 = trail(2.7 + i * 1.5, -1.9);
        sh.blade(3, a[0], a[1], b2[0], b2[1], 1.3, 1.3, 0.85, 0.85, 0.35, 0.35); sh.blade(3, l[0], l[1], l2[0], l2[1], 0.7, 0.7, 0.4, 0.4, 0.4, 0.4); sh.blade(3, r[0], r[1], r2[0], r2[1], 0.45, 0.45, 0.35, 0.35, 0.4, 0.4);
      }
      await rest(2);
      const fl = [trail(1.2, 0), trail(16.2, 0)], fbox = [Math.min(fl[0][0], fl[1][0]) - 5, Math.max(fl[0][0], fl[1][0]) + 5, Math.min(fl[0][1], fl[1][1]) - 5, Math.max(fl[0][1], fl[1][1]) + 5];
      const groove = (x, z) => {
        if (x < fbox[0] || x > fbox[1] || z < fbox[2] || z > fbox[3]) return 0;
        let d = 1e9; for (let i = 0; i < 10; i++) { const a = trail(1.2 + i * 1.5, 0), b2 = trail(2.7 + i * 1.5, 0); d = Math.min(d, segDist(x, z, [a[0], a[1], b2[0], b2[1]])); }
        return 0.44 * (1 - smoothstep(0.6, 1.4, d));
      };
      let gy = 0;
      await sh.relief((x, z) => (gy = heightAt(x, z)) + (COURT_SHEET.gain - 1) * E.drift(x, z) - groove(x, z), () => rest(3), () => gy);
      // the furrow's two clean rims, laid at the sheet's own grain: the snow the ball pushed aside stands as one crest either side,
      // a ball's half width and a hand from the furrow's middle, steep toward the furrow, falling gently away from it
      {
        const fs = []; for (let i = 0; i < 10; i++) { const a = trail(1.2 + i * 1.5, 0), b2 = trail(2.7 + i * 1.5, 0); fs.push([a[0], a[1], b2[0] - a[0], b2[1] - a[1]]); }
        sh.texels(fbox[0], fbox[2], fbox[1], fbox[3], (k, x, z) => {
          let d = 1e9, nx = 0, nz = 0;
          for (const s of fs) { let t = ((x - s[0]) * s[2] + (z - s[1]) * s[3]) / (s[2] * s[2] + s[3] * s[3]); t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = x - s[0] - s[2] * t, qz = z - s[1] - s[3] * t, q = Math.hypot(qx, qz); if (q < d) { d = q; nx = qx; nz = qz; } }
          if (d < 1.05 || d > 2.55) return;
          const g = d < 1.45 ? 2 * 0.13 * (1 - (1.45 - d) / 0.4) / 0.4 : -2 * 0.13 * (1 - (d - 1.45) / 1.1) / 1.1;
          sh.tilt(k, g * nx / d, g * nz / d);
        });
      }
      // THE LONG DRIFTS (a stream of their own, drawn here, after everything of the court stands). A drift lies ALONG the one
      // wind: a ridge 6 to 20 m long, in rows 3.5 to 8 m apart across the wind, bowed a little toward the moon's side (a
      // crescent), running out to nothing at both ends. Its side toward the moon is short and climbs to ONE crest line; its lee
      // is broad and smooth. Between the drifts the snow lies clean. None is laid on the ice, under a roof, on the furrow, where
      // the ball stands or at the crossing's own corner; the slope inside the gate carries them as the court's floor does.
      // They are slopes in the court's sheet (the snow's form the ground's shader reads): no thing stands on one.
      {
        const gd = stream('court:drifts'), W = PLACE.WIND, S = COURT_SHEET, lit = W[1] * sh.dx - W[0] * sh.dz > 0 ? 1 : -1;
        const free = (x, z) => x > S.x0 + 4 && x < -3 && z > S.z0 + 4 && z < -3 && Math.hypot(x, z) > 40 && iceIn(x, z) < -2.5 && !builtAt(x, z, 1.5) && (x < fbox[0] || x > fbox[1] || z < fbox[2] || z > fbox[3]);
        let c0 = 1e9, c1 = -1e9, a0 = 1e9, a1 = -1e9;
        for (const [x, z] of [[S.x0, S.z0], [S.x1, S.z0], [S.x0, S.z1], [S.x1, S.z1]]) { const a = x * W[0] + z * W[1], c = -x * W[1] + z * W[0]; c0 = Math.min(c0, c); c1 = Math.max(c1, c); a0 = Math.min(a0, a); a1 = Math.max(a1, a); }
        let laid = 0;
        for (let c = c0 + gd.range(0, 4); c < c1; c += gd.range(3.5, 8)) {
          for (let a = a0 + gd.range(0, 20); a < a1;) {
            const half = gd.range(3, 10), bow = gd.range(0.4, 1.4), tall = gd.range(0.36, 0.52), wl = gd.range(0.9, 1.3), we = gd.range(1.5, 2.2), cm = c + gd.range(-1, 1), am = a + half; a += 2 * half + gd.range(5, 16);
            let ok = true; for (const t of [-0.9, -0.45, 0, 0.45, 0.9]) { const aa = am + half * t, cc = cm + lit * bow * (1 - t * t); if (!free(aa * W[0] - cc * W[1], aa * W[1] + cc * W[0])) { ok = false; break; } }
            if (!ok) continue;
            const mx = am * W[0] - cm * W[1], mz = am * W[1] + cm * W[0], rx = half * Math.abs(W[0]) + (we + wl + bow) * Math.abs(W[1]), rz = half * Math.abs(W[1]) + (we + wl + bow) * Math.abs(W[0]);
            const H = tall * smoothstep(3, 10, Math.min(-mx, -mz));
            // (a texel takes the mean slope of its own four quarters, so the crest is one clean line however it lies to the sheet's grain)
            sh.texels(mx - rx, mz - rz, mx + rx, mz + rz, (k, x0, z0) => {
              let sx = 0, sz = 0;
              for (let q = 0; q < 4; q++) {
                const x = x0 + (q & 1 ? 0.125 : -0.125), z = z0 + (q & 2 ? 0.125 : -0.125), t = (x * W[0] + z * W[1] - am) / half; if (t <= -1 || t >= 1) continue;
                const e = 1 - t * t, v = (-x * W[1] + z * W[0] - cm) * lit - bow * e; if (v >= wl || v <= -we) continue;
                const u = v > 0 ? 1 - v / wl : 1 + v / we, hs = H * Math.pow(e, 1.5), dP = v > 0 ? -2 * u / wl : 2 * u / we;
                const dc = hs * dP * lit, da = H * 1.5 * Math.sqrt(e) * (-2 * t / half) * u * u + hs * dP * 2 * bow * t / half;
                sx += da * W[0] - dc * W[1]; sz += da * W[1] + dc * W[0];
              }
              if (sx || sz) sh.tilt(k, sx / 4, sz / 4);
            });
            if (++laid % 60 === 0) await rest(2);
          }
        }
      }
      sh.done();
    }
    await rest();
    // ------------------------------------------------------------ the court's air: snow slips from the pines' boughs, the baskets spark and smoke
    // Every pine of the court sheds from one bough of its own, once in its own period (18 to 46 s) at its own phase of the
    // world's clock; the five baskets throw sparks and a thin smoke that leans down the one wind, and each bank basket's gold
    // lies on the ice beside it. A second, nearer veil of
    // larger flakes drifts over the lane itself. (streams of their own)
    {
      const gs = stream('court:slips'), slips = [];
      for (const [kind, h0, dh] of [['snowpine', 16.5, 3], ['snowpinelow', 7.5, 1.5], ['courtpine', 7.5, 1.5]]) for (const p of planted[kind] || []) {
        const h = (h0 - (p.v % 2) * dh) * p.s, per = gs.range(18, 46), a = gs.range(0, TAU), r = gs.range(0.05, 0.16) * h, up = gs.range(0.55, 0.85), ph = gs.range(0, per);
        slips.push([p.x + Math.cos(a) * r, p.y + h * up, p.z + Math.sin(a) * r, per, ph, 0.5 + 0.035 * h]);
      }
      const air = makeCourtAir({ rng: gs, time: tU, wind: [PLACE.WIND[0], PLACE.WIND[1]], slips, fires: [...fires, ...bankFires].map((f) => [f[0], f[1] + 1.9, f[2]]),
        pools: bankFires.map((f) => { let k = 1, best = 1e9; for (let i = 1; i < iceLine.length - 1; i++) { const d = Math.hypot(iceLine[i][0] - f[0], iceLine[i][1] - f[2]); if (d < best) { best = d; k = i; } } return [iceLine[k][0], ICE.level + 0.03, iceLine[k][1], iceHalf(k) * 0.95]; }), moon: '#c9d8ff', ember: '#ff9a3c', smoke: '#56648a' });
      air.name = 'court:air'; QG[3].add(air);
      const veil = fx.makeParticles({ rng: stream('snow:near'), preset: 'snow', time: tU, follow: false, center: [-132, GY + 5.5, -96], box: [46, 11, 190], count: Math.round((snowing ? 640 : 420) * many), size: [0.09, 0.17] });
      veil.object.name = 'court:veil'; QG[3].add(veil.object); life[3].push((dt, time, camera) => veil.update(dt, time, camera));
    }
    await rest();
    // ------------------------------------------------------------ the great blossom bough: 25 m north of the entry an old cherry on the east bank leans
    // out over the water, and one long limb of it reaches across the lane and 7 m beyond, 6.5 m over the water where the lane goes under it;
    // blossom hangs from the limb all along, never lower than 4 m over the water. A second limb carries its crown over the bank.
    await shapes('bough', 1, (g) => flora.bushGeometry({ rng: g, size: 2.5, detail: 1, flowers: 1, flowerColor: '#fff2f5', leaf: '#f3c9d2' }));
    {
      const g = R.bough, p = route[25], root = [p.x + rightN[0] * 14.6, p.z + rightN[1] * 14.6], ry = heightAt(root[0], root[1]), side = [leg.x, 0, leg.y], bark = mul(PAL.bark, 0.55);
      const at = (t, y) => [root[0] - rightN[0] * t, y, root[1] - rightN[1] * t];
      const run = [[0, ry - 0.4], [1.2, ry + 2.6], [3.6, 5.4], [7.5, 6.8], [11.5, 7.0], [15, 6.5], [18.5, 5.8], [21.5, 5.2]], limb = run.map(([t, y]) => at(t, y));
      const limbY = (t) => { for (let i = 0; i < run.length - 1; i++) if (t <= run[i + 1][0]) return lerp(run[i][1], run[i + 1][1], (t - run[i][0]) / (run[i + 1][0] - run[i][0])); return run[run.length - 1][1]; };
      const b = extra[0]; b.surf(SURF.TIMBER).sway(0);
      b.tube(limb, [0.62, 0.52, 0.42, 0.34, 0.27, 0.2, 0.13, 0.05], 8, { side, cols: limb.map(() => bark) });
      b.tube([at(1.2, ry + 2.6), at(0.9, 6.6), at(-0.8, 10.2)], [0.45, 0.3, 0.1], 8, { side, cols: [bark, bark, bark] });
      solids.push([root[0], root[1], 0.9, 'bough tree']);
      const pts = [];
      for (let i = 0; i < 14; i++) { const t = 4.5 + i * 1.25 + g.range(-0.4, 0.4), al = g.range(-1.5, 1.5), q = at(t, limbY(t) - g.range(1.0, 1.4)); pts.push({ x: q[0] + leg.x * al, y: q[1], z: q[2] + leg.y * al, s: g.range(0.75, 1.05) * (1 - 0.3 * i / 14), rot: g.range(0, TAU), v: 0, d: 0, u: i / 14 }); }
      for (let i = 0; i < 5; i++) { const q = at(g.range(-2.6, 2.4), g.range(7.2, 9.4)), al = g.range(-2.4, 2.4); pts.push({ x: q[0] + leg.x * al, y: q[1], z: q[2] + leg.y * al, s: g.range(1.2, 1.6), rot: g.range(0, TAU), v: 0, d: 0, u: 1 }); }
      const sc = flora.makeScatter({ rng: g, points: pts, variants: G.bough, material: fmat, sink: 0, tilt: 0.12 });
      QG[0].add(sc.object); scatters.push([QG[0], sc]);
    }
    await rest();
    extra.forEach((b, q) => { if (b.triangles > 0) QG[q].add(new THREE.Mesh(b.toGeometry(), timber)); });
    // (the fall's rocks are a mesh of their own, of the same stuff, drawn with the autumn garden's small things by the gardens' one law)
    if (fallRocks.triangles > 0) { const m = new THREE.Mesh(fallRocks.toGeometry(), timber); m.name = 'fall:rocks'; QG[2].add(m); }
    await rest();
    // ------------------------------------------------------------ wisteria along both eaves of the spring gallery-bridge: a leafy vine on each eave's
    // edge and under it lilac racemes that hang and swing; where the lane passes beneath, the bridge's floor is 6.2 m above the water and the racemes'
    // feet 4.9 m or more. (The kit's strands are 1.2 to 4.5 m long: the vines are made 1.2 times too large and hung at 1 / 1.2.)
    {
      const K = 1.2, out = 4.2 / 2 + 1.45, mid = springBridge.at(springBridge.L / 2, 0, 0), spans = [];
      for (const sg of [-1, 1]) for (let i = 0; i < 12; i++) spans.push([i, i + 1].map((k) => { const p = springBridge.at(springBridge.L * k / 12, sg * out, 3.8); return [(p[0] - mid[0]) * K, (p[1] - mid[1]) * K, (p[2] - mid[2]) * K]; }));
      const lilac = { leaves: 0, hangers: 1.8, sag: 0.04, thickness: 0.03, leaf: '#b79ad8', leafLight: '#ece0fb', leafDark: '#8a6cc4' };
      for (const [use, o] of [['shape', { leaves: 1, hangers: 0, sag: 0.04, thickness: 0.1, flower: '#b79ad8' }], ['tint', lilac], ['place', lilac]]) {
        const vine = new THREE.Mesh(flora.vineGeometry({ rng: R[use + ':wisteria'], spans, ...o }), fmat);
        vine.position.set(mid[0], mid[1], mid[2]); vine.scale.setScalar(1 / K); QG[0].add(vine);
        await rest(2);
      }
    }
    // incense rising from the censers on the verandas of the spring hall and of the winter hall
    for (const [q, p] of censers) {
      const smoke = fx.makeSmokeColumn({ rng: R.smoke, time: tU, position: [p[0], p[1] + 0.5, p[2]], height: 5, radius: [0.04, 0.6], size: [0.25, 1.3], count: 16, color: '#cfc8d8', colorTop: '#efeaf6', opacity: 0.2, wind: [0.15, 0, 0.1], sunDir: STATES[q].sun });
      QG[q].add(smoke.object); life[q].push((dt, time, camera) => smoke.update(dt, time, camera));
    }
    await rest();

    // ------------------------------------------------------------ what rides the water: rafts of fallen blossom turn slowly on the spring lake and go
    // down the stream as far as the gallery-bridge; red and gold leaves ride the brook from the crossing down into the autumn lake and turn on it
    const flowTab = [], flowM0 = ribbonRows[0][2];
    { let j = 0; for (let m = flowM0; m <= ribbonRows[ribbonRows.length - 1][2]; m += 2) { while (j < ribbonRows.length - 2 && ribbonRows[j + 1][2] < m) j++; const a = ribbonRows[j], b2 = ribbonRows[j + 1], t = clamp((m - a[2]) / Math.max(1e-6, b2[2] - a[2]), 0, 1); flowTab.push([lerp(a[0], b2[0], t), lerp(a[1], b2[1], t)]); } }
    const raftMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    raftMat.onBeforeCompile = (sh) => hoursInto(sh, HU); raftMat.customProgramCacheKey = () => 'h4s-raft';
    // one raft: a loose handful of small flat petals or leaves, each a rhombus lying on the water
    const raftGeometry = (g, n, size, spread, tones) => {
      const P = [], N = [], Cc = [], I = [], c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const r = spread * Math.sqrt(g()), a = g.range(0, TAU), x = r * Math.cos(a), z = r * Math.sin(a), yaw = g.range(0, TAU), l = size * g.range(0.7, 1.3), w = l * g.range(0.45, 0.7), cx = Math.cos(yaw), sx = Math.sin(yaw), k = P.length / 3;
        P.push(x + cx * l, 0, z + sx * l, x - sx * w, 0, z + cx * w, x - cx * l, 0, z - sx * l, x + sx * w, 0, z - cx * w);
        c.set(g.pick(tones)).multiplyScalar(g.range(0.85, 1.1));
        for (let v = 0; v < 4; v++) { N.push(0, 1, 0); Cc.push(c.r, c.g, c.b); }
        I.push(k, k + 2, k + 1, k, k + 3, k + 2);
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); geo.setIndex(I);
      return geo;
    };
    // rafts on a quarter's water: `down` of them go down the course between two metres of it at the water's pace (they gather out of nothing over
    // the first ten metres and are drawn under over the last ten), `round` of them turn in slow rings on the lake L
    const raftsOn = (q, name, geo, mA, mB, down, L, level, round, speed) => {
      // (the water's own two streams: one for the rafts that go down the course, one for the rings; a ring is kept where its
      // whole round lies 3.3 m or more inside its lake's bank: water a hand deep or more; the part deals them)
      const g = stream('rafts:' + name + ':down'), list = [];
      for (let i = 0; i < down; i++) list.push({ f: g(), o: g.range(-0.78, 0.78), yaw: g.range(0, TAU), s: g.range(0.7, 1.25) });
      for (const ring of dealRings(stream('rafts:' + name + ':rings'), L, L === LAKE ? lakeIn : alakeIn, round, RAFT_RINGS[name])) list.push(ring);
      const mesh = new THREE.InstancedMesh(geo, raftMat, list.length), M = mesh.instanceMatrix.array; mesh.frustumCulled = false; QG[q].add(mesh);
      const span = mB - mA;
      // (a slow ring lies round every raft that goes down the course: its place on the ribbon's ring sheet, which goes down with it)
      if (down) { for (const it of list) if (it.f !== undefined) ringSheets[q].ring(mA + it.f * span, it.o * 3); ringSheets[q].texture.needsUpdate = true; }
      const put = (time) => {
        for (let i = 0; i < list.length; i++) {
          const it = list[i], o = i * 16; let x, y, z, s = it.s;
          if (it.f !== undefined) {
            const m = mA + ((it.f * span + speed * time) % span), f = clamp((m - flowM0) / 2, 0, flowTab.length - 1.001), j = Math.floor(f), t = f - j, a = flowTab[j], b2 = flowTab[j + 1], tx = b2[0] - a[0], tz = b2[1] - a[1], tl = Math.hypot(tx, tz) || 1, off = it.o * (halfW(m) - 1.1);
            x = lerp(a[0], b2[0], t) - tz / tl * off; z = lerp(a[1], b2[1], t) + tx / tl * off; y = waterY(m) + 0.06; s *= Math.min(smoothstep(0, 10, m - mA), smoothstep(0, 10, mB - m));
          } else { const a = it.a + it.w * time; x = it.cx + it.r * Math.cos(a); z = it.cz + it.r * Math.sin(a); y = level + 0.04; }
          const yaw = it.yaw + 0.5 * Math.sin(time * 0.21 + i), c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
          M[o] = c; M[o + 1] = 0; M[o + 2] = -sn; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = s; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = sn; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
        }
        mesh.instanceMatrix.needsUpdate = true;
      };
      put(0); life[q].push((dt, time) => put(time));
      return mesh;
    };
    const flowEnd = flowM0 + (flowTab.length - 1) * 2;
    raftsOn(0, 'spring', raftGeometry(stream('shape:rafts:spring'), 22, 0.09, 1.4, ['#ffd0de', '#fff0f4', '#f3b8cc']), flowM0, mBridge + 4, Math.round((mBridge + 4 - flowM0) / 1.1), LAKE, 0, Math.round(220 * many), 1.3);
    await rest(2);
    raftsOn(2, 'autumn', raftGeometry(stream('shape:rafts:autumn'), 12, 0.17, 2.2, ['#c8321c', '#e8862a', '#b02818', '#e8b030']), mCross + 6, flowEnd, Math.round((flowEnd - mCross - 6) / 1.5), ALAKE, -0.6, Math.round(140 * many), 1.5);
    await rest();

    // pads on the summer water, at the edges of the stream below the gallery-bridge and round the rim of the cool spring, some in flower
    await shapes('lily', 3, (g, i) => flora.lilyPadGeometry({ rng: g, size: 0.5 + i * 0.1, flower: i === 2, pad: '#3f7a4a', petal: '#ffd8ea' }));
    { const afloat = (p, y, nr) => y < waterY(nr.m) - 0.12, on = (p, y) => ({ ...p, y: y + 0.14 });
      const pads = keepBy(along('lily', 420, mBridge + 14, mCross - 14, 1.3, 3.6, 0), { low: -9, pad: 0.5, gap: 0.9, max: Math.round(130 * many), ok: afloat }).map((p) => on(p, waterY(p.m)));
      const rim = keepBy(dice('brooklily', 260, POOL.x - POOL.r, POOL.z - POOL.r, POOL.x + POOL.r, POOL.z + POOL.r), { low: -9, pad: 0.5, gap: 0.9, max: Math.round(50 * many), ok: (p, y) => { const r = Math.hypot(p.x - POOL.x, p.z - POOL.z); return r < POOL.r - 1 && r > POOL.r - 6 && y < -0.05; } }).map((p) => on(p, 0.12));
      plant(1, 'lily', pads.concat(rim), 0, 0, SMALL);
      // (a slow ring lies round every pad on the stream: its place on the summer ribbon's ring sheet)
      for (const p of planted.lily) if (p.y < 0.2) { const ca = courseAt(p.x, p.z); ringSheets[1].ring(ca[0], ca[1]); } ringSheets[1].texture.needsUpdate = true; }
    await rest(3);
    // carp under the surface of the stream and the brook: dark gold and grey, a few, in twos and threes where the water lies glassy. Every
    // number of a school is thrown first from its own stream (made here, after the course and its ribbons stand); a school is kept where
    // the water does not quicken, at most one on the spring stream, two on the summer's, one on the brook. Each school turns about its
    // own place by the world's clock, one round to its own period, and its first carp comes up at the same point of every round: a
    // slow ring opens there (the ribbon's rise places).
    {
      const g = stream('carp:place'), schools = [];
      for (const [q, mA, mB, n] of [[0, mMouth + 8, mBridge - 10, 3], [1, mBridge + 30, mCross - 30, 6], [2, mCross + 40, mArc2 - 10, 3]]) for (let i = 0; i < n; i++) schools.push({ q, m: g.range(mA, mB), o: g.range(-0.4, 0.4), n: g.int(2, 3), r: g.range(0.7, 1.3), turn: g.chance(0.5) ? 1 : -1, per: g.range(10, 17), ph: g.range(0, 17), a0: g.range(0, TAU), s: g.range(0.55, 0.8) });
      const cap = [1, 2, 1], cnt = [0, 0, 0], kept = [];
      for (const sc of schools) { if (cnt[sc.q] >= cap[sc.q] || quickens(sc.m) > 0.3) continue; kept.push(sc); cnt[sc.q]++; }
      // one carp, a metre long before its own size: a spindle (dark gold along the back, grey on the flanks, pale under), a flat tail, two fins
      const P = [], N = [], Cc = [], I = [], gold = lin('#6a4a16'), grey = lin('#4a4640'), pale = lin('#8a8478'), ring = [[0.5, 0], [0.32, 0.075], [0.05, 0.105], [-0.25, 0.07], [-0.44, 0.022]];
      for (let i = 0; i < ring.length; i++) for (let j = 0; j < 6; j++) { const a = j / 6 * TAU, cy = Math.sin(a), cz = Math.cos(a), c = cy > 0.4 ? gold : cy < -0.4 ? pale : grey; P.push(ring[i][0], ring[i][1] * cy * 0.9, ring[i][1] * cz * 0.8); N.push(0.2, cy, cz); Cc.push(c[0], c[1], c[2]); }
      for (let i = 0; i < ring.length - 1; i++) for (let j = 0; j < 6; j++) { const a = i * 6 + j, b2 = i * 6 + (j + 1) % 6; I.push(a, b2, a + 6, b2, b2 + 6, a + 6); }
      for (const tri of [[[-0.42, 0, 0], [-0.66, 0.02, 0.11], [-0.66, 0.02, -0.11]], [[0.2, -0.02, 0.07], [0.02, -0.03, 0.2], [0.06, -0.02, 0.07]], [[0.2, -0.02, -0.07], [0.06, -0.02, -0.07], [0.02, -0.03, -0.2]]]) { const k = P.length / 3; for (const v of tri) { P.push(v[0], v[1], v[2]); N.push(0, 1, 0); Cc.push(gold[0], gold[1], gold[2]); } I.push(k, k + 1, k + 2); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); geo.setIndex(I);
      const fish = []; for (const sc of kept) { const c = pointOn(sc.m, sc.o * (halfW(sc.m) - 1.6)), w = sc.turn * TAU / sc.per; sc.c = c; sc.w = w; sc.y = waterY(sc.m); for (let i = 0; i < sc.n; i++) fish.push({ sc, i }); }
      // the rise's place: where the school's first carp is when its round begins anew
      const perQ = [0, 0, 0];
      for (const sc of kept) { const a = sc.a0 - sc.w * sc.ph; riseAt[sc.q][perQ[sc.q]++].set(sc.c[0] + sc.r * Math.cos(a), sc.c[1] + sc.r * Math.sin(a), sc.per, sc.ph); }
      // (each ribbon's carp are one mesh in their own garden's small things, moved with that garden's life: no switch by the eye)
      for (let q = 0; q < 3; q++) { const fq = fish.filter((f) => f.sc.q === q); if (!fq.length) continue;
        const mesh = new THREE.InstancedMesh(geo, raftMat, fq.length), M = mesh.instanceMatrix.array; mesh.frustumCulled = false; QG[q].add(mesh);
        const put = (time) => {
          for (let k = 0; k < fq.length; k++) {
            const { sc, i } = fq[k], o = k * 16, a = sc.a0 + sc.w * time + i * TAU / sc.n, tt = (time + sc.ph) % sc.per, up = i === 0 ? smoothstep(sc.per - 1.6, sc.per - 0.2, tt) + (1 - smoothstep(0.1, 1.4, tt)) : 0;
            const rr = sc.r * (1 + 0.18 * Math.sin(time * 0.37 + i * 2.1)), x = sc.c[0] + rr * Math.cos(a), z = sc.c[1] + rr * Math.sin(a), y = sc.y - 0.3 + 0.24 * Math.min(1, up) + 0.04 * Math.sin(time * 0.9 + i), yaw = a + sc.turn * Math.PI / 2 + 0.12 * Math.sin(time * 2.6 + i), s = sc.s * (1 - 0.12 * i), c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
            M[o] = c; M[o + 1] = 0; M[o + 2] = sn; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = s; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = -sn; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
          }
          mesh.instanceMatrix.needsUpdate = true;
        };
        put(0); life[q].push((dt, time) => put(time));
      }
    }
    await rest(2);
    // ------------------------------------------------------------ the banks: low growth hanging over the water's edge, by one rule of the course
    // Where a bank is bare (nothing planted within a metre, no stone within its own girth), a low tuft of arching fronds stands at the
    // foot of each bank and hangs over the wet line: one every 1.3 to 2.1 m of the course on either side, from the stream's mouth to
    // the brook's last bend, a hand to two hands outside the water's edge (which lies 0.63 m outside the course's half width). It wears its own garden's growth by the place it stands in:
    // spring's fresh green and, one in three, the kerria's yellow sprays; summer's sweet flag and fern; autumn's rust and gold sedge and
    // moss. Streams of their own (bank:place, bank:shape, bank:tint), made here, after everything they read stands. Every number
    // is thrown first; the rules then keep or drop. The tufts are low (under 0.8 m) and stand 2.6 m and more from the lane's line.
    const bankG = new THREE.Group(); scene.add(bankG);
    {
      const g = stream('bank:place'), diceB = [];
      for (const sg of [-1, 1]) for (let m = mMouth + 3; m < mArc2 + 10;) { m += g.range(1.3, 2.1); diceB.push({ m, sg, off: g.range(0.72, 1.05), s: g.range(0.75, 1.2), rot: g.range(0, TAU), k: g() }); }
      const near = ['kerria', 'iris', 'reed', 'pampas', 'clover', 'azalea'].flatMap((kind) => planted[kind] || []), stonesAt = stoneDice.filter((d) => { const y = heightAt(d[0], d[1]); return y >= -0.7 && y <= 0.7; }), pts = [];
      for (let i = 0; i < diceB.length; i++) {
        const d = diceB[i]; if (i % 60 === 59) await rest();
        const p = pointOn(d.m, d.sg * (halfW(d.m) + d.off)), x = p[0], z = p[1], y = heightAt(x, z), wy = waterY(d.m);
        if (y < wy + 0.05 || y > wy + 0.8 || Math.hypot(x, z) < 17 || builtAt(x, z, 0.5)) continue;
        if (near.some((q) => Math.abs(q.x - x) < 1 && Math.abs(q.z - z) < 1 && Math.hypot(q.x - x, q.z - z) < 1) || stonesAt.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] * 1.3 + 0.4)) continue;
        pts.push({ x, y: y - 0.03, z, s: d.s, rot: d.rot, v: 0, d: 0, u: (d.m - mMouth) / (mArc2 + 12 - mMouth), k: d.k });
      }
      const kOf = new Map(pts.map((p) => [Math.round(p.x * 64) * 65536 + Math.round(p.z * 64), p.k])), w4 = [0, 0, 0, 0];
      const tintAt = (x, z) => { hoursAt(x, z, w4); const k = kOf.get(Math.round(x * 64) * 65536 + Math.round(z * 64)) ?? 0.5; return w4[0] > 0.5 ? (k < 0.33 ? [0.8, 0.56, 0.1] : [0.46, 0.6, 0.2]) : w4[1] > 0.5 ? (k < 0.4 ? [0.34, 0.54, 0.26] : [0.2, 0.42, 0.2]) : (k < 0.4 ? [0.6, 0.25, 0.08] : k < 0.72 ? [0.72, 0.5, 0.14] : [0.3, 0.36, 0.14]); };
      if (pts.length) {
        const sc = flora.makeScatter({ rng: stream('bank:tint'), points: pts, variants: [flora.fernGeometry({ rng: stream('bank:shape'), size: 0.9, fronds: 4, segs: 2, leaf: '#d8d8d8', leafLight: '#ffffff', leafDark: '#8c8c8c' })], material: fmat, chunks: 20, cullDistance: 60, groundColor: tintAt, tint: 0.1, hue: 0.03, tilt: 0.22 });
        bankG.add(sc.object); scatters.push([bankG, sc]); planted.bank = pts;
      }
    }
    await rest(2);
    // the autumn lake's shore: pampas stands at its edge, on the bank within two metres of the water, round the whole rim (the garden's own
    // plain clumps; one clump to 2.2 m at the closest, 46 at the most). A stream of its own (bank:lakeshore), made here; every die first.
    {
      const g = stream('bank:lakeshore'), list = [];
      for (let i = 0; i < 520; i++) list.push({ x: g.range(ALAKE.cx - ALAKE.a - 3, ALAKE.cx + ALAKE.a + 3), z: g.range(ALAKE.cz - ALAKE.b - 3, ALAKE.cz + ALAKE.b + 3), s: g.range(0.85, 1.25), rot: g.range(0, TAU), v: g.int(0, 5), k: g() });
      const pts = keepBy(list, { lane: 20, gap: 2.2, max: 46, low: -0.55, ok: (p, y) => { const ai = alakeIn(p.x, p.z); return ai < -0.2 && ai > -2.2 && y > -0.5; } });
      if (pts.length) {
        const sc = flora.makeScatter({ rng: stream('bank:lakeshore:tint'), points: pts.map((p) => ({ x: p.x, y: p.y - 0.1, z: p.z, s: p.s, rot: p.rot, v: 0, d: p.d, u: 0 })), variants: GF.pampas, material: fmat, cullDistance: 170 });
        QG[2].add(sc.object); scatters.push([QG[2], sc]); planted.lakeshore = pts;
      }
    }
    await rest(2);
    // ------------------------------------------------------------ the fall's trees, and its pool made whole
    // By the same frame of FALL's place: a pine on the top behind the crag and a maple to either side of it, on the knoll's own ground,
    // behind the lips as the lane sees them (none stands before the water; each 10.5 m or more from the lane, as the garden's maples). They
    // wear the gardens' own shapes. A stream of their own (fall:trees), made here, after everything they read stands; every number first.
    {
      const gt = stream('fall:trees');
      const trees = [['pine', 25, 0, 0.72], ['maple', 22, -10.5, 0.8], ['maple', 21, 11, 0.74]].map(([kind, s, side, sc]) => ({ kind, s: s + gt.range(-1.5, 1.5), side: side + gt.range(-1.5, 1.5), sc: sc * gt.range(0.92, 1.1), rot: gt.range(0, TAU), v: gt.int(0, 5), k: gt() }));
      for (const kind of ['pine', 'maple']) {
        const pts = trees.filter((t) => t.kind === kind).map((t) => { const p = fallAt(t.s, t.side), nr = nearRoute(p[0], p[1]); return { x: p[0], y: heightAt(p[0], p[1]), z: p[1], s: t.sc, rot: t.rot, v: t.v, k: t.k, d: nr.d, m: nr.m }; }).filter((p) => p.d >= 10.5);
        if (!pts.length) continue;
        const sc = flora.makeScatter({ rng: stream('fall:tint:' + kind), points: pts.map((p) => ({ x: p.x, y: p.y - 0.1, z: p.z, s: p.s, rot: p.rot, v: p.v % G[kind].length, d: p.d, u: 0 })), variants: G[kind], material: fmat });
        QT[2].add(sc.object); scatters.push([QT[2], sc]); for (const p of pts) fallTrees.push([kind, p]);
        await rest();
      }
    }
    // the fall's pool is one whole water (the kit lays its sheet; the estate's own water on it): white where the fall comes down into
    // it, rings running out from there by the world's clock
    const fallFoot = fallAt(2.2);
    const fallPoolSheet = Water.makeLake({ rng: stream('water:fallpool'), light: WLq[2], level: FALL.level, center: [FALL.x, FALL.z], radius: FALL.r + 2, segments: 12, depthAt: (x, z) => (FALL.r - Math.hypot(x - FALL.x, z - FALL.z) > -1.5 ? FALL.level - heightAt(x, z) : -1), band: false });
    const fallPool = waterOf(2, fallPoolSheet.object.geometry, FALL.level + 0.012, { ...WATERS[2], ripple: 1, scale: 0.5, foam: 0.25, foamWidth: 0.6, churn: new THREE.Vector4(fallFoot[0], fallFoot[1], 3.4, 0.85),
      rises: [0, 1, 2, 3].map((i) => new THREE.Vector4(fallFoot[0], fallFoot[1], 3.2, i * 0.8)) }); fallPoolSheet.material.dispose();
    QG[2].add(fallPool.object);
    await rest(2);
    // low mist: a thin morning haze on the spring lake, dusk mist lying along the summer water, the fall's breath over the autumn lake
    for (const [q, cx, cz, ax, az, n, op] of [[0, LAKE.cx, LAKE.cz, 170, 190, 26, 0.1], [1, 60, -60, 190, 130, 30, 0.16], [2, -96, 150, 150, 150, 18, 0.07]]) {
      const mist = fx.makeMist({ rng: R['place:mist'], time: tU, count: n, area: [ax, 1.5, az], center: [cx, GY + 1.2, cz], size: [14, 30], color: STATES[q].fog.clone().lerp(STATES[q].hor, 0.6), opacity: op, drift: [0.5, 0, 0.3] });
      QG[q].add(mist.object); life[q].push((dt, time, camera) => mist.update(dt, time, camera));
    }
    await rest();

    // ------------------------------------------------------------ the air: petals over the lake and the stream, leaves over the field and the hill, snow over the court
    const airs = [
      [0, fx.makeParticles({ rng: R.petals, preset: 'petals', time: tU, follow: false, center: [136, GY + 6.5, 126], box: [64, 14, 170], count: Math.round(1100 * many), velocity: [-1.3, -0.7, 0.5], colors: ['#ffd0de', '#fff0f4', '#f3b8cc'], size: [0.1, 0.2] })],
      [0, fx.makeParticles({ rng: stream('petals:stream'), preset: 'petals', time: tU, follow: false, center: [128, GY + 6, 40], box: [46, 12, 50], count: Math.round(380 * many), velocity: [-1.3, -0.7, 0.5], colors: ['#ffd0de', '#fff0f4', '#f3b8cc'], size: [0.1, 0.2] })],
      [2, fx.makeParticles({ rng: R.leaves, preset: 'leaves', time: tU, follow: false, center: [-82, GY + 7, 48], box: [140, 16, 120], count: Math.round((rare ? 2200 : 800) * many), velocity: rare ? [5.5, -0.6, -5.5] : [2.0, -0.55, -2.0], colors: ['#c8321c', '#e8862a', '#9a1c14'], size: [0.16, 0.3] })],
      [3, fx.makeParticles({ rng: R.snow, preset: 'snow', time: tU, follow: false, center: [-130, GY + 13, -100], box: [80, 28, 200], count: Math.round((snowing ? 3200 : 900) * many), size: [0.05, 0.12] })],
    ];
    for (const a of airs) { QG[a[0]].add(a[1].object); life[a[0]].push((dt, time, camera) => a[1].update(dt, time, camera)); }
    await rest();

    // ------------------------------------------------------------ grass through the three green gardens, flowers by the brook and in the autumn field
    // no grass on the sanded courts, on the snow, or under a floor
    const barren = (x, z) => { if (x < 2 && z < 2) return true; for (const ct of courts) if (Math.abs(x - ct[0]) < ct[2] + 1 && Math.abs(z - ct[1]) < ct[3] + 1) return true; return builtAt(x, z, 0.5); };
    const grassMat = floraHours(flora.windMaterial({ wind, map: fmat.map, fade: [55, 80], detail: 0, wrap: 0.3, backlight: 0.5, ambient: 1, leafAmbient: 1, sheen: 0.4 }), HU);
    const grass = await flora.makeGrassAsync({ rng: R['place:grass'], path, heightAt, wind, material: grassMat, count: Math.round(4600 * many), radius: 26, bias: 1.5, uRange: [0, (mGate - 14) / LEN],
      groundColor: (x, z, y) => groundColor(x, z, y), shade: blots.slice(0, 6), yRange: [GY - 0.6, 40], height: [0.5, 1.0], chunks: 8, fade: [55, 80],
      density: (x, z) => (barren(x, z) ? 0 : 1) }, () => rest(4));
    scene.add(grass.object);
    await rest();
    // the autumn field has a second, closer sowing within 16 m of the lane, so that its flowers stand rooted in grass
    const fieldGrass = await flora.makeGrassAsync({ rng: R['place:fieldgrass'], path, heightAt, wind, material: grassMat, count: Math.round(2000 * many), radius: 16, bias: 1.15, uRange: [(mCross + 28) / LEN, (mGate - 16) / LEN],
      groundColor: (x, z, y) => groundColor(x, z, y), shade: blots.slice(4, 6), yRange: [0.45, 40], height: [0.4, 0.8], chunks: 3, fade: [45, 65], density: (x, z) => (barren(x, z) ? 0 : 1) }, () => rest(4));
    QG[2].add(fieldGrass.object); scatters.push([QG[2], fieldGrass]);
    await rest();
    // the field's flowers are sown in three reaches of the lane, one after another, so that no one sowing is long
    // (the tone of the autumn floor as the ground's shader lays its litter: the ground's own colour, lighter and browner)
    const litterTone = (x, z, y) => { const g = groundColor(x, z, y); return [g[0] * 1.4 + 0.07, g[1] * 1.4 + 0.06, g[2] * 1.4 + 0.025]; };
    const fieldFlowers = [];
    for (let k = 0; k < 3; k++) {
      const f0 = mCross + 30, f1 = mGate - 20;
      fieldFlowers.push(flora.makeFlowers({ rng: R[['place', 'shape', 'tint'][k] + ':flowers'], path, heightAt, material: fmat, uRange: [lerp(f0, f1, k / 3) / LEN, lerp(f0, f1, (k + 1) / 3) / LEN], radius: 30, corridor: 3.2, count: Math.round(380 * many),
        colors: ['#c8b040', '#7a62b0', '#c06a88', '#d8d0c0'], yRange: [GY - 0.3, 30], scale: [0.55, 0.95], chunks: 2, cullDistance: 120, groundColor: litterTone }));
      await rest(4);
    }
    const pinks = flora.makeFlowers({ rng: R['place:pinks'], path, heightAt, material: fmat, uRange: [(mBridge + 20) / LEN, (mCross - 30) / LEN], radius: 20, corridor: 3.2, count: Math.round(380 * many),
      colors: ['#c85a78', '#d0c8cc', '#b03a58'], yRange: [GY - 0.3, 30], scale: [0.55, 0.95], chunks: 3, cullDistance: 120 });
    for (const f of fieldFlowers) { QG[2].add(f.object); scatters.push([QG[2], f]); }
    // THE FIELD'S PLANTS STAND IN THE LITTER. Under every clump of the field's flowers, every pampas and every bush clover a soft
    // shade lies on the ground at its foot (a thin sheet that multiplies, as the court's prints do: darkest at the stem, nothing
    // at the plant's own breadth); and the flowers' leaves take the tone of the litter they stand in (litterTone, handed to the sowing).
    {
      // (each a square of two triangles wearing one small round shade: a picture of 32 texels, the same for every foot and every seed)
      // The shade's strength falls to nought with its true distance from the eye, from 55 m to 85 m (a foot's shade is not seen from
      // farther); the sheet lies in pieces 48 m square and a piece none of which is within 90 m of the eye's place is left out,
      // where every shade of it is at nought already: a level of detail by where the eye IS, with no step and no test of where it looks.
      const cells = new Map(), CELL = 48;
      const foot = (x, z, r) => {
        const key = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); let c = cells.get(key); if (!c) cells.set(key, c = { P: [], Uv: [], I: [], x0: 1e9, z0: 1e9, x1: -1e9, z1: -1e9 });
        const c0 = c.P.length / 3;
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const px = x + sx * r, pz = z + sz * r; c.P.push(px, heightAt(px, pz) + 0.07, pz); c.Uv.push(0.5 + 0.5 * sx, 0.5 + 0.5 * sz); }
        c.I.push(c0, c0 + 2, c0 + 1, c0, c0 + 3, c0 + 2); c.x0 = Math.min(c.x0, x - r); c.x1 = Math.max(c.x1, x + r); c.z0 = Math.min(c.z0, z - r); c.z1 = Math.max(c.z1, z + r);
      };
      for (const f of fieldFlowers) { for (const p of f.points) foot(p.x, p.z, 0.6 * (p.s || 1)); await rest(3); }
      for (const [kind, r] of [['pampas', 0.85], ['clover', 1.15], ['lakeshore', 0.85]]) for (const p of planted[kind] || []) foot(p.x, p.z, r * p.s);
      if (cells.size) {
        const N = 32, px = new Uint8Array(N * N * 4), dark = [0.4, 0.37, 0.42];
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const r = Math.min(1, Math.hypot((i + 0.5) / N - 0.5, (j + 0.5) / N - 0.5) * 2), k = (j * N + i) * 4; for (let c = 0; c < 3; c++) px[k + c] = Math.round(255 * lerp(dark[c], 1, r)); px[k + 3] = 255; }
        const round = new THREE.DataTexture(px, N, N, THREE.RGBAFormat); round.magFilter = THREE.LinearFilter; round.minFilter = THREE.LinearMipmapLinearFilter; round.generateMipmaps = true; round.needsUpdate = true;
        const mat = new THREE.MeshBasicMaterial({ map: round, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        mat.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vFootD;').replace('#include <project_vertex>', '#include <project_vertex>\n  vFootD = length(mvPosition.xyz);');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFootD;').replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.), smoothstep(55., 85., vFootD));');
        };
        mat.customProgramCacheKey = () => 'h4s-feet';
        const feet = new THREE.Group(), pieces = []; feet.name = 'autumn:feet'; QG[2].add(feet);
        for (const c of cells.values()) {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(c.Uv, 2)); g.setIndex(c.I);
          const m = new THREE.Mesh(g, mat); m.renderOrder = 0.6; feet.add(m); pieces.push([m, c.x0, c.z0, c.x1, c.z1]);
        }
        scatters.push([QG[2], { update(dt, time, camera) {
          if (!camera) return; const e = camera.getWorldPosition(_cp2);
          for (const [m, x0, z0, x1, z1] of pieces) {
            const dx = Math.max(x0 - e.x, 0, e.x - x1), dz = Math.max(z0 - e.z, 0, e.z - z1);
            m.visible = dx * dx + dz * dz < 8100;
          }
        } }]);
      }
    }
    QG[1].add(pinks.object); scatters.push([QG[1], pinks]);
    await rest();

    // ------------------------------------------------------------ the standing map is laid, now that everything stands: what the waters mirror, by place
    // One rule for every kind: a thing is laid where it stands, as tall and as wide as its shape, in its own colour as its own garden's
    // hour lights it (the part's makeStandMap). Trees by their shapes' heights and the dice of each (its size, its shape, its own
    // shade of the kind's colour); bushes, clumps and stones as low mounds; halls, galleries, bridges and the crossing by their own
    // measures; the hills and the fall's crag by the ground's rule; the watch fire and the lit blinds by their own light.
    {
      // (LEAF: a crown or a bush takes its garden's fill as the gardens' leaf material takes it, nearly twice over)
      const sm = standMap, LEAF = 1.7, barkC = lin('#4a3c34'), snowC = mul(PAL.snow, 1.15), roofC = mul(PAL.bark, 0.9), wallC = mix3(PAL.timber, PAL.blind, 0.45), tone = (hex, p) => mul(lin(hex), 0.82 + 0.36 * p.k);
      // a kind of tree: its shapes' heights (m), the crown's half breadth and its underside as shares of the height, the crown's colour by shape
      const TREES = { cherry: [[15, 13], 0.4, 0.26, ['#f3c9d2']], shore: [[14, 12], 0.4, 0.26, ['#f3c9d2']], willow: [[13], 0.44, 0.1, ['#a4c474']], pine: [[17, 14], 0.25, 0.34, ['#3f6a44']], isle: [[17, 14], 0.25, 0.34, ['#3f6a44']],
        hillwood: [[15, 12, 13], 0.36, 0.28, ['#4f8238', '#f3c9d2', '#6f9a44']], grove: [[21, 18], 0.35, 0.3, ['#3a7a3c', '#2f6a38']], northwood: [[21, 18], 0.35, 0.3, ['#3a7a3c', '#2f6a38']], bamboo: [[12, 10], 0.15, 0.18, ['#4a7a36']],
        maple: [[16, 13.5], 0.4, 0.26, ['#c8301c', '#e0641c']], darkwood: [[17, 13.5, 15], 0.36, 0.28, ['#6a6a2c', '#c8301c', '#a8782a']], snowpine: [[16.5, 13.5], 0.25, 0.3, ['#aab8d0']], pinewood: [[16.5, 13.5], 0.25, 0.3, ['#aab8d0']], snowpinelow: [[7.5, 6], 0.3, 0.2, ['#aab8d0']] };
      for (const kind in TREES) {
        const [hs, rk, uk, cols] = TREES[kind];
        for (const p of planted[kind] || []) { const h = hs[p.v % hs.length] * p.s; sm.tree(p.x, p.z, p.y - 0.1, h, h * rk, uk, sm.lit(tone(cols[p.v % cols.length], p), p.x, p.z, LEAF), sm.lit(barkC, p.x, p.z)); }
        await rest(2);
      }
      // a low kind: how high it stands, how far it spreads, its colour
      const LOW = { kerria: [1.5, 1.0, '#c8a428'], azalea: [1.6, 1.0, '#b8587a'], deutzia: [1.8, 1.1, '#aebca4'], orange: [2.6, 1.6, '#2f5a30'], iris: [1.1, 0.5, '#5a58a8'], reed: [1.9, 0.6, '#5a8a44'], pampas: [2.8, 1.0, '#d6c88e'], clover: [1.5, 1.0, '#8a6a70'], snowbush: [1.7, 1.1, '#aab8d0'], mum: [1.4, 0.9, '#b8b890'] };
      for (const kind in LOW) { const [h, r, hex] = LOW[kind]; for (const p of planted[kind] || []) sm.mound(p.x, p.z, p.y, h * p.s, r * p.s, sm.lit(tone(hex, p), p.x, p.z, LEAF)); await rest(); }
      for (const p of planted.lakeshore || []) sm.mound(p.x, p.z, p.y, 2.6 * p.s, 1.0 * p.s, sm.lit(tone('#d6c88e', p), p.x, p.z, LEAF));
      // the crossing's own corners (the hero's trees and bushes), its posts
      const HERO = { cherry: [11, 4.4, 0.26, '#f3c9d2'], maple: [11, 4.4, 0.26, '#c8301c'], pine: [12, 3.2, 0.34, '#3f6a44'], pineLow: [5.5, 1.8, 0.2, '#aab8d0'], bamboo: [10, 1.6, 0.18, '#4a7a36'] }, HLOW = { kerria: LOW.kerria, deutzia: LOW.deutzia, clover: LOW.clover };
      for (const s of hero.solids) {
        const t = HERO[s[3]], l = HLOW[s[3]];
        if (t) sm.tree(s[0], s[1], GY, t[0], t[1], t[2], sm.lit(lin(t[3]), s[0], s[1], LEAF), sm.lit(barkC, s[0], s[1]));
        else if (l) sm.mound(s[0], s[1], GY, l[0], l[1], sm.lit(lin(l[2]), s[0], s[1], LEAF));
        else if (s[3] === 'post') sm.cells(s[0] - s[2], s[1] - s[2], s[0] + s[2], s[1] + s[2], (k) => sm.tall(k, CROSS.lintel, -1, sm.lit(PAL.timber, s[0], s[1]), 1, sm.lit(PAL.timber, s[0], s[1])));
      }
      await rest();
      // the halls (a lit hall's blinds glow in the water as they glow on the land), the small pavilions, the storehouses
      const glowC = [1.5, 0.82, 0.3], lampOf = { spring: springLamp, wing: springLamp, fishing: springLamp, summer: 0.9, autumn: 0.45, winter: 0 };
      for (const k in HALLS) {
        const h = HALLS[k], ov = k === 'fishing' ? 3.2 : 4.6, sn = k === 'winter', wl = sm.lit(wallC, h.x, h.z), lk = lampOf[k];
        sm.house(h.x, h.z, h.yaw || 0, h.w / 2, h.d / 2, ov, GY + h.eave + 0.62, GY + h.ridge, sm.lit(sn ? snowC : roofC, h.x, h.z), [wl[0] + glowC[0] * lk, wl[1] + glowC[1] * lk, wl[2] + glowC[2] * lk]);
      }
      for (const [x, z, yaw, w, d, e, r, ov, sn] of [[0, 69, 0, 10, 8, 5.0, 8.6, 2.8, 0], [POOL.x + 9, POOL.z - 7, Math.PI * 0.75, 8, 7, 4.6, 8, 2.6, 0], [176, -58, -Math.PI / 2, 12, 8, 5.0, 8.8, 2.8, 0], [184, -96, -Math.PI / 2, 24, 8, 4.6, 8.2, 2.2, 0], ...WINGS.map((w2) => [w2[0], w2[1], 0, 8, 7, 4.8, 8.4, 2.6, 1])])
        sm.house(x, z, yaw, w / 2, d / 2, ov, GY + e + 0.62, GY + r, sm.lit(sn ? snowC : roofC, x, z), sm.lit(PAL.timber, x, z));
      for (const [x, z, w, d] of STORES) sm.house(x, z, 0, w / 2, d / 2, 2.2, GY + 5.9, GY + 9.5, sm.lit(snowC, x, z), sm.lit(PAL.plaster, x, z));
      await rest(2);
      // the galleries and the bridges, each by its own floor's rule; the gate; the crossing: its deck's underside, its roof, its four roofed stairs
      for (const [p0, p1, o, r] of walks) {
        const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, roofed = o.roof !== false, hw = (o.width ?? 3.6) / 2;
        sm.walk(p0, p1, roofed ? hw + (o.overhang ?? 1.5) : hw, r.fy, roofed ? (o.eave ?? 3.7) + 0.5 : 1.05, roofed ? o.rise ?? 1.25 : 0, sm.lit(o.snow ? snowC : roofC, mx, mz), sm.lit(mul(PAL.timber, 0.8), mx, mz));
      }
      sm.house(GATE.x, 0, 0, GATE.w / 2, 2.7, 3.2, GY + GATE.h + 1.25, GY + GATE.h + 4.45, sm.lit(roofC, GATE.x, 2), sm.lit(PAL.timber, GATE.x, 2));
      await rest(2);
      // the crossing: its deck's underside (the part's vault) and its roof from the eaves to the peak, each cell lit by its own garden; its four roofed stairs
      sm.cells(-CROSS.eave, -CROSS.eave, CROSS.eave, CROSS.eave, (k, x, z) => {
        const e = Math.max(Math.abs(x), Math.abs(z)), top = CROSS.eaveY + (CROSS.peak - CROSS.eaveY) * (1 - e / CROSS.eave), deck = e < CROSS.deck, un = deck ? crossUnder(x, z) : CROSS.eaveY - 0.4;
        sm.tall(k, top, un, sm.lit(roofC, x, z), deck ? (CROSS.deckY + 1 - un) / (top - un) : 0, sm.lit(mul(PAL.timber, 0.8), x, z));
      });
      for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) sm.walk([ux * CROSS.eave, uz * CROSS.eave], [ux * CROSS.stub, uz * CROSS.stub], 3.3, (a) => lerp(CROSS.deckY, CROSS.stubY, a / (CROSS.stub - CROSS.eave)), 4.2, 1.25, sm.lit(roofC, ux * 20, uz * 20), sm.lit(mul(PAL.timber, 0.8), ux * 20, uz * 20));
      await rest(2);
      // the hills by the ground's rule, each in its own ground's colour; the fall's crag by the ground's own heights, its three ledges of rock
      // (each as high as its lip, the water's channel white down its middle); the stones at the brook's edge; the watch fire's own light
      for (const h of E.HILLS) { sm.hill(h[0], h[1], h[2], h[3], h[4], GY, sm.lit(groundColor(h[0], h[1], GY + h[3]), h[0], h[1], 0.9)); await rest(2); }
      { const rock = sm.lit(mul(C.stone, 0.62), FALL.x, FALL.z), white = sm.lit([0.8, 0.84, 0.88], FALL.x, FALL.z), crag = sm.lit(mix3(C.mossy, C.stone, 0.5), FALL.x, FALL.z), put = (p, y, c) => sm.cells(p[0] - 0.75, p[1] - 0.75, p[0] + 0.75, p[1] + 0.75, (k) => sm.ground(k, y, c));
        FALL.steps.forEach(([d, y, w], i) => { const W = 11 + i * 3, back = i === 0 ? d + 6.5 : FALL.steps[i - 1][0] + 0.8; for (let s = d - 0.5; s <= back; s += 0.7) for (let side = -W / 2; side <= W / 2; side += 0.7) put(fallAt(s, side), y, Math.abs(side) < w / 2 && s < d + 0.3 ? white : rock); });
        await rest();
        for (let s = 3; s <= 38; s++) for (let side = -18; side <= 18; side++) { const p = fallAt(s, side), y = heightAt(p[0], p[1]); if (y > GY + 0.6) put(p, y, crag); }
      }
      await rest(2);
      // (the fall's shoulders and crag, its pine and its maples)
      { const rock = sm.lit(mul(C.stone, 0.62), FALL.x, FALL.z); for (const [x, z, top, r] of fallSeat) sm.cells(x - r, z - r, x + r, z + r, (k, cx, cz) => { const d = Math.hypot(cx - x, cz - z) / r; if (d < 1) sm.ground(k, top - (top - heightAt(x, z)) * d * d, rock); });
        for (const [kind, p] of fallTrees) { const t = TREES[kind], h = t[0][p.v % t[0].length] * p.s; sm.tree(p.x, p.z, p.y - 0.1, h, h * t[1], t[2], sm.lit(tone(t[3][p.v % t[3].length], p), p.x, p.z, LEAF), sm.lit(barkC, p.x, p.z)); } }
      // (a stone whose body reaches the water leaves its V on the wake sheet, down the course from where it stands)
      for (let i = 0; i < stoneDice.length; i++) {
        const d = stoneDice[i], y = heightAt(d[0], d[1]); if (y < -0.7 || y > 0.7 || Math.hypot(d[0], d[1]) < 30) continue;
        sm.mound(d[0], d[1], y - 0.12, d[2] * 0.9, d[2] * 1.3, sm.lit(mul(C.stone, 0.8), d[0], d[1]));
        const ca = courseAt(d[0], d[1]); if (Math.abs(ca[1]) - d[2] * 1.3 < halfW(ca[0]) - 0.2) { wakeSheet.wake(ca[0], ca[1], d[2] * 1.3); await rest(); }
      }
      wakeSheet.texture.needsUpdate = true;
      sm.mound(FIRE[0], FIRE[2], FIRE[1], 1.2, 0.72, [1.3, 0.56, 0.13]);
      await rest(8); await sm.done(() => rest(8));   // (asks to hand back before, between and after the map's last passes)
      await rest(8);
    }
    // ------------------------------------------------------------ where each sun's disc changes: the stretches of lane the world hides it from
    // (The rule is at the head of the dome.) What can hide a disc: the built meshes and the crossing, all of it always drawn;
    // no crown, for light comes through leaves. Three dividing roofs lie over the lane: the spring gallery-bridge (on the
    // hall's line), the crossing (its north-south axis), the gate in the border gallery (the gallery's
    // line). The spring sun's disc goes at the first; the red sun's comes at the second and goes at the third (ahead: the
    // disc's own garden lies ahead of that roof along the lane). At each the hidden stretch is found by the part's
    // hiddenSteps, and the change is laid on it less COVER.margin metres at each end (a stretch too short for that would
    // keep a change of 2 m at its middle: the buildings give COVER.least metres and more).
    const cover = makeCover();
    for (const m of builtMeshes) cover.solid(m.geometry);
    cover.solid(hero.mesh.geometry);
    const JOINS = [{ name: 'gallery-bridge', m: mBridge, off: (x, z) => z - JOIN.hallZ, ahead: false }, { name: 'crossing', m: mCross, off: (x, z) => x, ahead: true }, { name: 'gate', m: mGate, off: (x, z) => z - GATE.z, ahead: false }];
    // the casts for body i at join j (dir and cosR: the body's station and the cosine of its disc's radius), and the change laid on what they find
    const stepsOf = (i, j, dir = STATES[i].sun, cosR = STATES[i].discSize) => hiddenSteps(cover, E, JOINS[j].m, JOINS[j].off, JOINS[j].ahead, [dir.x, dir.y, dir.z], Math.sqrt(1 - cosR * cosR) / cosR);
    const laid = (i, j, run) => {
      const len = run.to - run.from, mid = len >= 0 ? (run.from + run.to) / 2 : JOINS[j].m, half = Math.max(1, len / 2 - COVER.margin);
      return { body: i, join: JOINS[j].name, ...run, a: mid - half, b: mid + half, A: path.posAtDist(mid - half), B: path.posAtDist(mid + half) };
    };
    const stretchOf = (i, j, dir, cosR) => { const it = stepsOf(i, j, dir, cosR); let r = it.next(); while (!r.done) r = it.next(); return laid(i, j, r.value); };
    // at build the same casts, with a hand-back after each
    const found = async (i, j) => { const it = stepsOf(i, j); let r = it.next(); while (!r.done) { await rest(8); r = it.next(); } await rest(8); return laid(i, j, r.value); };
    // a line of a disc's ground from where the disc is nought (p0) to where it is whole (p1). (West, the spring sun's ground ends on
    // the crossing's own line, which the lane meets only north of the gallery-bridge's line: that disc is nought there already.)
    const lineOf = (p0, p1) => [p0, 1 / (p1 - p0)], discs = [];
    if (hasDisc(0)) { const s = await found(0, 0), l = lineOf(s.B.z, s.A.z); discs.push(s); domeU.uDX.value[0].set(-JOIN.half, 0.5 / JOIN.half); domeU.uDZ.value[0].set(l[0], l[1], l[0], l[1]); }
    const sIn = await found(2, 1), sOut = await found(2, 2); discs.push(sIn, sOut);
    { const lx = lineOf(sIn.A.x, sIn.B.x), lz = lineOf(sIn.A.z, sIn.B.z), lg = lineOf(sOut.B.z, sOut.A.z); domeU.uDX.value[2].set(lx[0], lx[1]); domeU.uDZ.value[2].set(lz[0], lz[1], lg[0], lg[1]); }
    // (what was found, and the finder itself, are kept with the dome for whoever prints them)
    dome.userData.discs = discs; dome.userData.stretchOf = stretchOf; dome.userData.cover = cover;

    // ------------------------------------------------------------ where the eye is drawn, and how fast we go (rules R10 and R11 of the notes)
    const _cp = new THREE.Vector3(), _ah = new THREE.Vector3(), _tg = new THREE.Vector3();
    // A pull lets go by bearing: toward a thing more than 40 degrees off the lane's line it weakens, and past 60 degrees the eye is on the lane again.
    // Of several things the look rests on whichever lies ahead: each by its own share of the bearing rule.
    const C40 = Math.cos(40 * DEG), C60 = Math.cos(60 * DEG), _sum = new THREE.Vector3();
    const gazeAny = (things) => (time, u) => {
      const m = clamp(u, 0, 1) * LEN; path.posAtDist(m, _cp); path.posAtDist(Math.min(LEN, m + 20), _ah);
      const ax = _ah.x - _cp.x, az = _ah.z - _cp.z, al = Math.hypot(ax, az) || 1; let all = 0, top = 0; _sum.set(0, 0, 0);
      for (const thing of things) {
        thing(time, _tg);
        const bx = _tg.x - _cp.x, bz = _tg.z - _cp.z, share = 1 - smoothstep(C40, C60, (ax * bx + az * bz) / (al * (Math.hypot(bx, bz) || 1)));
        _sum.addScaledVector(_tg, share); all += share; if (share > top) top = share;
      }
      if (all > 0) _tg.copy(_sum).multiplyScalar(1 / all); else _tg.copy(_ah);
      return _tg.lerp(_ah, 1 - top);
    };
    const gaze = (thing) => gazeAny([thing]);
    const U = (m) => clamp(m / LEN, 0, 1), boatLook = (i) => (time, out) => { boatAt(i, time, bp); out.set(bp.x, 2.2, bp.z); };
    // Every look's span lies between two places of the world, with no metres trimmed off either; inside it the bearing rule
    // alone says when the eye lets go (each of these things is lost to the bearing before its span's far place is reached).
    const pois = [
      // the pleasure boats on their beat beside the first leg, whichever lies ahead: from 30 m in to abreast of the island (the knot there)
      { at: gazeAny([boatLook(0), boatLook(1)]), from: U(30), to: U(metresAt(knots[2][0], knots[2][2])), weight: 0.34, fade: 0.3 },
      // the watch fire under its tree inside the bend round the cool spring: from the bend's start, where the fire first lies
      // within the bearing rule (from the north point on it is abeam), to where the brook lies ahead
      { at: gaze((time, out) => out.set(FIRE[0], FIRE[1] + 1.6, FIRE[2])), from: U(mArc1), to: U(mBrook), weight: 0.32, fade: 0.3 },
      // the fall on its knoll, at the end of the brook's straight line: from the crossing to the south point of the bend round the maple
      // hill, eased over the whole span (the fall is dead ahead for most of it, where a pull turns nothing; it eases off as the fall slides left)
      { at: gaze((time, out) => out.set(fallAt(8)[0], 9, fallAt(8)[1])), from: U(mCross), to: U(mSouth2), weight: 0.34, fade: 0.5 },
      // the children at their ball of snow: from 25 m inside the gate until we are abeam of them
      { at: gaze((time, out) => out.set(BALL[0], BALL[1] + 1.4, BALL[2])), from: U(mGate + 25), to: U(mBall), weight: 0.4, fade: 0.3 },
    ];
    // slower for 30 m either side of the crossing and up the court, as far as the start of the last 60 m (the knot where the lane
    // runs level into the hall: the design's own place for it); a little slower round both bends
    const mLast = metresAt(COURT[COURT.length - 2][0], COURT[COURT.length - 2][2]);
    const span = (m, a, b, f) => smoothstep(a - f, a + f, m) * (1 - smoothstep(b - f, b + f, m));
    const paceAt = (m) => 1 - 0.3 * span(m, mCross - 30, mCross + 30, 22) - 0.14 * span(m, mGate + 20, mLast, 25) - 0.13 * span(m, mArc1, mBrook, 20) - 0.13 * span(m, mArc2, mWest2, 20);

    // ------------------------------------------------------------ what is read from where the eye stands in the estate
    // The eye's own weights (its world x, z against the dividing roofs): the haze the kit's water, motes and creatures are seen
    // through (the dome reads the eye's place itself: for the weights of each part of the sky and for the ground of each sun's disc). And which gardens' small things are drawn: a garden's shrubs, flowers, creatures and air while the
    // eye stands in it or in a garden that looks into it across a roof (spring and summer, summer and autumn, autumn and winter;
    // under the crossing all four). Ground, water, buildings, lamps and every tree over 8 m are always drawn.
    const camP = new THREE.Vector3(), EW = [1, 0, 0, 0], seen = (w) => w > 0.002;
    const eyeAt = (x, z) => {
      hoursAt(x, z, EW);
      let r = 0, g = 0, b2 = 0, fd = 0;
      for (let i = 0; i < 4; i++) { const st = STATES[i], w = EW[i]; r += st.fog.r * w; g += st.fog.g * w; b2 += st.fog.b * w; fd += st.fogD * w; }
      scene.fog.color.setRGB(r, g, b2); scene.fog.density = fd;
      QG[0].visible = seen(EW[0]) || seen(EW[1]); QG[1].visible = seen(EW[1]) || seen(EW[0]) || seen(EW[2]);
      QG[2].visible = seen(EW[2]) || seen(EW[1]) || seen(EW[3]); QG[3].visible = seen(EW[3]) || seen(EW[2]);
    };
    eyeAt(knots[0][0], knots[0][2]);
    return {
      scene, path, duration: 50, pace: (u) => paceAt(clamp(u, 0, 1) * LEN), pois,
      camera: { fov: 62, near: 0.3, far: 1500, lookAhead: 20, sway: 0.7, bank: 0.2 },
      portal: { shape: 'rect', width: 10.5, height: 5.4, color: '#ffc66a', glow: 1, revealDistance: 200 },
      post: { exposure: 1.05, bloom: { strength: 0.4, radius: 0.65, threshold: 0.9 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#0a0c1a', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time;
        camera.getWorldPosition(camP);
        eyeAt(camP.x, camP.z);
        dome.position.copy(camP); domeU.uEye.value.copy(camP);
        wind.update(time);
        lake.update(dt, time, camera); alake.update(dt, time, camera); pool.update(dt, time, camera); ice.update(dt, time, camera); for (const st of streams) st.update(dt, time, camera); for (const f of falls) f.update(dt, time, camera); for (const s of sides) s.update(dt, time, camera);
        hero.update(dt, time, camera); grass.update(dt, time, camera);
        for (const sc of scatters) if (sc[0].visible) sc[1].update(dt, time, camera);
        for (let q = 0; q < 4; q++) if (QG[q].visible) for (const f of life[q]) f(dt, time, camera);
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
