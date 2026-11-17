// The Gates in the Snow: a public garden forged of heavy black iron bar under falling snow, still being made as we fly it.
// Two runs of glowing scrolls race along the railings beside the lens, climb a pair of gates ninety metres tall, finish their
// crown and swing them open. Everything visible is made from the one makeStyle instance in ../parts/gates-in-the-snow.js:
// bar (faceted tube), cap (snow strip), collar, forged scroll instances, steam, clumps, flakes. No lights, no fog, no textures,
// no full-screen pass; post is flat so the seven colours written are the colours shown.
// Layout (metres, snow at y 0): entry (0, 2.6, 0) heading +Z down the central walk; pergola z 75-130; a quarter turn round the
// bandstand (centre 26, 150); the main axis runs +X along z 176 to the Great Gates at x 326; the path climbs 33 degrees to the ring.
// The lens swings: to one railing and its fire, across to the other, up into the vault, round the bandstand (its columns close on
// the left as the Gates are revealed, horizon level), down the sight line, then well off the axis: out over the right-hand bed
// at hat height past one near flower head with the Gates three-quarter on, back down under the first arch looking up into its
// closing crown, and up the climb. The Gates are held back (hidden) until it leaves the pergola. The hoop bowls its own weaving line
// down the garden's centreline, 17 to 40 m ahead on the walk, never in the middle of the frame for long.
// HEAT (the one colour) is working iron only, never a lamp and never paint: the winding scrolls; and the two runs as FRONTS of fire
// (style.hotMaterial: straw at the head, orange, a long cherry tail to black) a bay long on each walk railing's top rail 13 to 24 m
// ahead of the lens, on the edging hoops well ahead of us down the axis, away down the far railings, up the arches' standards and
// the piers. The snow cap of every bar a front reaches slumps off as it arrives (sections drawn with a fast-shedding snow
// material), so behind the fire the rail is bare black and ahead of it capped white. Small warm pools lie on the snow under the hot
// lengths only (ground shader) and under winding scrolls (spill cards). The smith's leavings are forged work: offcut scrolls, urns,
// box hedges of leaves, footprints. Hours: noon (flat pearl), dusk (one flat slate blue, snow lighter than the sky), night.
// Everything scripted hangs on S = u * path.length (the lens's arc along the route), never on the clock.
// Seeded: hour (noon, dusk, night; ctx.vary.hour is honoured), weather (steady, heavy with the distance closed, clear with no
// flakes), trees (C-scroll boughs or iron poplars of stacked S-scrolls), pergola (rose or vine), beds (thistles or sunflowers of
// leaf rings), overthrow (C, S or lyre). Rare (ctx.vary.rare): the shiver, every cap in the garden lets go as the leaves start to move.
// Tone: uFog is driven from S on the axis (the Gates darken from grey to black as they grow) and heavy members fade slower than
// small work; the ground keeps its own fog so the snowfield always pales into the sky. Steam is flat two-tone puffs, heat is hard-edged.
// Ground: the caps' own snow at every hour, drawn in its two tones as WIND DRIFT: one lattice of small blue crescents over the whole
// snowfield, all bowed the same way, three sizes, none over 2.5 m (ground shader); melt dimples at every bar foot and pocks under
// shedding bars as one mesh of flat marks. Nothing follows the outline of a tree or a railing, so nothing reads as a cast shadow.
// The three approach arches are capped springing arcs that stand outside one another and outside the Gates' piers, each with a gap
// at its apex that two scrolls close. Terminal posts (barley twist, spike, two capped scrolls) stand at the head of the central
// walk, where the turn meets the axis and in the beds where the lens leaves the walk.
// Round five (polish): the Gates' curtains are streamers of separate lumps (see the part); the night sky is one flat tone lighter
// than iron; the snowfield pales into the sky within four degrees of the horizon at every hour and height; the gaze goes to the
// bandstand as the lens leaves the pergola (which stands 3 m nearer the entry so its last post is behind us there) and dips to the
// Gates from the foot of the climb; the edging is separate low hoops; urns are baskets of sprung bar; terminal posts stand on four
// scrolled feet; beaten leaves are flat-shaded per facet (style.ironFacet); the pergola's brackets carry a short hot bend; pocks are
// crescent dents; thin ridge strokes lie ALONG the walks; low hot offcuts lie close beside the lens at the entry and inside the turn.
// Round eight (polish; path, camera and the last third untouched): the sky is three broad flat bands paling to the horizon with one
// pale low light behind the Gates, the snowfield pales into that band, the far snowfall is hard slanting streaks a step darker.
// Pieces that stood against the lens or cut a frame corner are moved or slimmed where they stand: the near flower of the bed (16 m
// off, whole), the bed's terminal post, one thistle by the way back to the axis, the pergola's posts, the first arch's springing
// bar, three crown scrolls of the second and third arches (re-aimed close under their bars, rng untouched), the offcut in the turn.
// Round ten (polish; path, pace, swing and the ending's staging untouched): BEYOND THE GATES the snowfield rises as a real hill and an
// avenue climbs it to a far second arch (railing runs, scroll standards, trees, a few tips still winding hot), all of the same bar and
// caps with their own slower fade; the hoop runs out through the gateway and its one ruled track (pixel floor) and thread of steam
// lead up the avenue; the snow out there is drawn as long scalloped drift lips; the sky's pale lens has a hard uneven edge, a farther
// ridge and capped iron trees along its crest; the far snowfall is round flakes with short slanted tails, cut off at the hill line.
// The Gates' crown is half made under the first arch and complete before the second; clumps fall from the first arch there. The
// pergola's posts are twisted square bar with collars and snow pillows; the second arch's bar and crown scrolls are slimmer; the
// lattice's crescents and the walk's ridge strokes are thin scalloped lips; two sprouts (a capped curl and a new scroll winding out of
// one collar on a short post) stand low by the far railing's foot and inside the turn; the piers' plumes stand behind the pier-head scrolls.
// Round eleven (the forging as the subject): the gaze goes down the near railing (first poi) to the bays being made; the crown is finished
// at T.open + 4, the leaves start then and swing over 64 m of the climb. Rare: the shiver is lumps in mid fall in front of the lens as the
// leaves start to move (from every cap ahead, its own dice), the far trees' caps go with them. Terminal posts have no blue lip; iron keeps its
// full black farther from the lens (near 42, 24 in heavy snow).
// Round twelve (rules in space, nothing placed for a picture): the route keeps to the axis from the bed to the ring (level to x 166, then the
// straight 33 degree climb), so the Gates stand square under the arches with a level horizon; two heralds (scroll standards with the run's fire
// winding up them in a helix) stand 38 m either side of the axis at x 196. THE CLEAR RING: no forged member of an arch's crown comes within
// 14.5 m of the route, and the second arch's apex stands 60 m up. CLEARANCE: the lens keeps 6 m from every railing post and rib foot. ONE LEAD
// on the entry walk: each scroll is born 15 m ahead and shut 8 m ahead. THE SPILL RULE: orange lies on the snow only under a tip or a fire's
// head that is glowing now, 3 m wide, and goes as it cools. The beds' nearest row is the tall one along the whole axis; the beds by the turn
// are edged in low hoops; the far crest trees are solid iron trees with caps. MORE FORGING IN WORK (forgeX, its own dice): a crozier over
// every post of the entry walk with its plume and a lump of snow sliding off, tendrils pushed out of the pergola's ribs overhead, croziers
// along the axis walk's edging wound as its fire passes. The hoop runs out through the gateway as the leaves part.
// Round thirteen (the forging close to; rules along whole stretches, the route's line on the axis untouched): on the open walk the gaze rests on
// the near railing where the run is working (17 m ahead, weight 0.9), the lens comes no nearer it than 7.4 m (the run's one lead is as it was: born 15 m ahead,
// shut 8 m ahead, the rail's fire beyond), and the leavings on that side lie flat and cold. The hoop bowls 17 to 40 m ahead on the
// walk and pulls ahead on the axis as before. The edging's croziers work for 56 m of flight under taller plumes, so some are in work beside the
// lens all down the axis. THE WREATH: the second crown's six scrolls
// hang as slim pendants from collars high on the bar and wind up beside the way through, three a side (clear ring: RING over the route's line,
// RINGW either side of it, no dice). The lens stays on the axis from the first arch to the ring (the Gates square under the arches).
// Hand round after the eighth version (added work only, own dice, no live line changed): THE LONG RAILINGS' CROZIERS: a crozier over each
// post of the two long railings' straight lines, the entry walk's law at their distance (30 / 9.25) and weight (the cresting's bar); none
// begun before the run's cresting over its post is shut, so the first ones rise behind the run in one burst and the rest await the lens;
// none beside the first arch's plinths or the heralds. So iron is still growing beside the lens from the turn to the climb.
// Not built from the brief: the hoar-frost colourway.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, PALETTE, COMMON_GLSL } from '../parts/gates-in-the-snow.js';

const V3 = THREE.Vector3;
const P3 = (x, y, z) => new V3(x, y, z);
const seg = (a, b, n = 1) => { const o = []; for (let i = 0; i <= n; i++) o.push(a.clone().lerp(b, i / n)); return o; };
const AXZ = 176, GX = 326, RINGY = 104, TILT = 33, BSX = 28, BSZ = 151.5, ARCH1 = 165, PZ = 72;   // BS: the bandstand's centre, set in so the Gates clear its columns at the turn

export default {
  id: 'gates-in-the-snow',
  name: 'The Gates in the Snow',
  category: 'city',
  weirdness: 0.45,
  media: ['snow', 'open'],
  async build(ctx) {
    let rng = ctx.rng;
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), vary = ctx.vary || {};
    const vr = rng.fork('vary');
    // ---- the seeded look: hour, weather, cast ---------------------------------------------------------------------------
    const hourPick = vr.pick(['noon', 'dusk', 'dusk', 'dusk', 'dusk', 'night']);
    const hour = vary.hour === 'night' ? 'night' : (vary.hour === 'golden' || vary.hour === 'dawn') ? 'dusk' : vary.hour === 'day' ? 'noon' : hourPick;
    const weather = vr.pick(['steady', 'steady', 'heavy', 'clear']);
    const cast = { poplar: vr.chance(0.4), sunflower: vr.chance(0.4), vine: vr.chance(0.45), overthrow: vr.pick(['C', 'C', 'S', 'lyre']) };
    const rare = !!vary.rare;
    const pal7 = PALETTE.slice(); let pearl = PALETTE[4], heatK = 1, veilHex = '#D0D8DF', capK = [1, 1];
    // the hour's ground and sky: [snowfield, its hollows, sky at the zenith, sky a third of the way up, the pale band on the horizon]
    let HOUR = ['#F4F6F8', '#C9D6E6', '#DAE0E6', '#E6EAEC', '#EDF0F2', '#F4F6F8'];   // ROUND EIGHT: the sky is three broad flat bands that pale toward the horizon, with one pale low light behind the Gates (the sixth hex)
    // deep blue dusk: black iron, snow in blue shade, white caps, orange fire; the sky one flat slate blue, the snowfield paling into it
    if (hour === 'dusk') { pearl = '#7388B4'; pal7[1] = '#34405A'; pal7[2] = '#F2F5FA'; pal7[3] = '#93A9CE'; heatK = 1.6; veilHex = '#5E73A1'; capK = [1.25, 0.7];
      HOUR = ['#93A8CD', '#7389B4', '#7388B4', '#8799C1', '#9DADD0', '#C3CDE4']; }
    // night: ONE flat sky, clearly lighter than iron black, so the crown is a silhouette on the climb; far iron sinks into it
    if (hour === 'night') { pearl = '#39424F'; pal7[1] = '#4A5462'; pal7[2] = '#D3DBE6'; pal7[3] = '#8494AB'; heatK = 2; veilHex = '#2E3642'; capK = [1.6, 0.4];
      HOUR = ['#D3DBE6', '#8494AB', '#39424F', '#434D5B', '#4F5A6B', '#69778D']; }
    const fog = weather === 'heavy' ? 210 : weather === 'clear' ? 900 : 400;
    const style = makeStyle(ctx, { palette: pal7, pearl, fog, cap: capK, near: weather === 'heavy' ? 24 : 42, edge: hour === 'night' ? [0.66, 0.72, 0.1] : hour === 'dusk' ? [0.7, 0.86, 0.22] : [0.8, 0.92, 0.32] });
    const pal = style.pal, U = style.uniforms;
    const scene = new THREE.Scene(); scene.background = pal.pearl.clone();
    await ctx.yield();

    // ---- the route ------------------------------------------------------------------------------------------------------
    const cl = (t) => P3(GX - t * Math.cos(TILT * Math.PI / 180), RINGY - t * Math.sin(TILT * Math.PI / 180), AXZ);   // the climb, t m before the ring
    // the lens does not keep to the middle of the walk: it swings to the left railing and its running fire, rises across to the
    // right one, weaves up into the pergola's vault and down again, rounds the bandstand, then lifts over the left bed level with
    // the thistles' hats before it drops under the first arch. The garden's own centreline (wp) is what the hoop bowls along.
    const wp = [[0, 0, -10], [0, 0, 30], [0, 0, 60], [0, 0, 90], [0, 0, 120], [0, 0, 143]];
    // CLEARANCE (a rule in space): railing posts stand at x -9 and +9, the pergola's rib feet at -7 and +7, and the lens keeps 6 m from every one of
    // them: it swings no farther than 3 m off the centreline on the open walk and 1 m under the pergola
    const pp = [[0, 2.6, 0], [0, 2.6, 13], [-1.4, 2.7, 31], [-1.2, 3.4, 43], [2.6, 4.6, 56], [1.0, 3.8, 68], [0.6, 3.4, 80], [-0.8, 5, 98], [0.7, 3.2, 119], [0, 2.5, 143]];
    for (const a of [18, 36, 54, 72]) { const r = a * Math.PI / 180, q = [26 - 26 * Math.cos(r), 2.5, 150 + 26 * Math.sin(r)]; pp.push(q); wp.push([q[0], 0, q[2]]); }
    // the axis: the lens leaves the walk, lifts out over the right-hand bed between its first two rows of plants (hat height, 14 m off
    // the axis, so the Gates are seen three-quarter on past a near flower head), then comes back down onto the axis to go under the first arch
    pp.push([33, 2.5, AXZ], [56, 3.2, AXZ + 1.5], [78, 6.2, AXZ + 10], [100, 7.6, AXZ + 14.5], [120, 6.2, AXZ + 10], [138, 3.6, AXZ + 2.5], [150, 2.8, AXZ]);
    // ROUND TWELVE: from the bed the lens comes back onto the axis and STAYS on it: level to x 166, then the straight climb at 33 degrees to the
    // ring, so the Gates are seen square under the arches all the way up with a level horizon (the swing to the left of the axis is gone)
    pp.push([166, 2.9, AXZ]);
    wp.push([33, 0, AXZ], [100, 0, AXZ], [200, 0, AXZ], [300, 0, AXZ], [400, 0, AXZ]);
    const walkPath = makePath(wp);
    await ctx.yield();
    for (const t of [166, 140, 110, 75, 40, 15, 0]) pp.push(cl(t));
    const path = makePath(pp), LEN = path.length, pathOld = path, HX = 196, HZ = 38;   // HX, HZ: where the two heralds stand (x, metres off the axis)
    const sOf = (x, z) => path.nearestXZ(x, z).u * LEN;                 // the lens's arc when it is abreast of (x, z)
    const HS = sOf(HX, AXZ);                                            // ... abreast of the heralds
    await ctx.yield();

    // ---- the hour's sky (its low band and pale light are shared with the snowfield, which pales into them)
    // ROUND TEN: the pale lens is a HILL: its upper edge is drawn hard, a little uneven (hillTop), a farther ridge of one flat tone stands
    // behind it, and capped iron trees stand along its crest (far iron: one pale tone, a stem, a scroll or two, a white cap). The far
    // snowfall is cut off at that edge, so nothing falls in front of the hill or the snowfield.
    const HILL_GLSL = /* glsl */`
      // the pale low light behind the Gates (they stand toward +X): a flat lens lying on the horizon, 11 degrees high at its middle
      float glowTop(vec2 hd){ return .2 * smoothstep(.1, 1., hd.x) - .015; }
      float hillTop(vec2 hd){ return glowTop(hd) + smoothstep(.12, .5, hd.x) * (.011 * sin(hd.y * 9. + 1.3) + .006 * sin(hd.y * 23. + .4)); }`;
    const SKY_GLSL = /* glsl */`
      uniform vec3 uBand, uGlow;
      ${HILL_GLSL}
      vec3 horizonCol(vec2 hd){ float hG = glowTop(hd); return mix(uBand, uGlow, 1. - smoothstep(hG - .012, hG + .012, 0.)); }`;
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uShiver: U.uShiver, uFarI: { value: pal.pearl.clone().lerp(pal.iron, hour === 'night' ? 0.55 : 0.42) }, uFarC: { value: pal.snow.clone() }, uRidge: { value: new THREE.Color(HOUR[4]).lerp(new THREE.Color(HOUR[5]), 0.45) }, uTop: { value: new THREE.Color(HOUR[2]) }, uMid: { value: new THREE.Color(HOUR[3]) }, uBand: { value: new THREE.Color(HOUR[4]) }, uGlow: { value: new THREE.Color(HOUR[5]) } },
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`varying vec3 vD; uniform vec3 uTop, uMid, uFarI, uFarC, uRidge; uniform float uShiver; ${SKY_GLSL}
        float h11(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
        float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }
        void main(){ float h = vD.y / max(length(vD), 1e-4); vec2 hd = vD.xz / max(length(vD.xz), 1e-4);
          vec3 c = mix(uMid, uTop, smoothstep(.34, .37, h));                 // three flat bands, each edge soft over a degree or two
          c = mix(uBand, c, smoothstep(.115, .14, h));
          float aa = fwidth(h) + 1e-4, mh = smoothstep(.14, .5, hd.x);
          float hF = glowTop(hd) + mh * (.022 + .024 * sin(hd.y * 4.2 + 2.1) + .007 * sin(hd.y * 15. + 1.));   // the farther ridge
          c = mix(c, uRidge, 1. - smoothstep(hF - aa, hF + aa, h));
          float hG = hillTop(hd); c = mix(c, uGlow, 1. - smoothstep(hG - aa, hG + aa, h));                    // the hill's drawn edge
          // the garden's own iron trees along the crest, far off: far iron sheds its small work, so each is its heavy members only, SOLID in the
          // one pale iron tone (a tapering trunk, five boughs fanning from the fork, the C-scroll at each bough's end closed to a knob) with a
          // white cap lying on every knob. Mixed sizes (the largest three times the smallest), leaning, in clumps; one cell every 5.2 degrees. Nothing here is an outline.
          float tx = hd.y * 11., ci = floor(tx), cy = (ci + .5) / 11., r1 = h11(ci * 7.3 + 2.), r2 = h11(ci * 3.1 + 5.), r3 = h11(ci * 5.7 + 9.), sz = .009 + .017 * r1 * r1;
          vec2 hc = vec2(sqrt(max(1. - cy * cy, 1e-4)), cy);
          vec2 q = vec2((tx - ci - .5 - (r2 - .5) * .6 * (1. - r1) * (1. - r1)) / 11., h - hillTop(hc) + .004) / sz;
          float qa = (fwidth(h) / sz) * 1.2 + 1e-4;
          q.x = (q.x + (r3 - .5) * .22 * q.y) / (.82 + .3 * r2);
          vec2 qm = vec2(abs(q.x), q.y), F = vec2(0., 1.15), E0 = vec2((r2 - .5) * .3, 2.7 + .2 * r3), E1 = vec2(.74 + .12 * r3, 2.36), E2 = vec2(1.22, 1.62 + .2 * r2);
          float dT = max(abs(q.x) - (.17 - .045 * q.y), max(-q.y - .4, q.y - 1.3));
          float dBo = min(sdSeg(q, F, E0), min(sdSeg(qm, F, E1), sdSeg(qm, F - vec2(0., .18), E2))) - .095;
          vec2 k0 = q - E0, k1 = qm - E1 - vec2(.1, -.07), k2 = qm - E2 - vec2(.12, -.1);
          float dI = min(dT, min(dBo, min(length(k0), min(length(k1), length(k2))) - .25));
          float dC = min(max(abs(length(k0) - .34) - .085, .03 - k0.y), min(max(abs(length(k1) - .34) - .085, .03 - k1.y), max(abs(length(k2) - .34) - .085, .03 - k2.y)));
          float on = step(.34, h11(floor(ci / 3.) * 2.7 + 1.)) * step(.1, fract(r2 * 7.31)) * mh;   // they stand in clumps of two or three with bare stretches of crest between
          c = mix(c, uFarI, on * (1. - smoothstep(-qa, qa, dI)));
          c = mix(c, uFarC, on * (1. - smoothstep(-qa, qa, dC)) * step(uShiver, .5));      // the rare shiver takes the far trees' caps too
          gl_FragColor = vec4(c, 1.); }`,
    });
    const RAIL_AT = 21.5;   // the fire on the walk's top rails: its straw head runs this far ahead of the lens, over the scrolls in work
    // ---- ground: one plane of the caps' own snow at every hour, DRAWN in its two tones: a lattice of wind-drift crescents (see the shader)
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uFog: { value: fog }, uGround: { value: new THREE.Color(HOUR[0]) }, uGroundB: { value: new THREE.Color(HOUR[1]) }, uRun: { value: 0 }, uXf: { value: 0 }, uWarm: { value: hour === 'noon' ? 0.3 : hour === 'dusk' ? 0.42 : 0.4 }, uHoopP: { value: new V3() }, uBand: skyMat.uniforms.uBand, uGlow: skyMat.uniforms.uGlow },
      vertexShader: /* glsl */`varying vec3 vW, vNg; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vNg = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        varying vec3 vW, vNg; uniform vec3 uGround, uGroundB, uHoopP; uniform float uRun, uWarm, uXf;
        ${COMMON_GLSL}
        ${SKY_GLSL}
        // WIND DRIFT: one lattice of small blue crescents over the whole snowfield, in the wind's own frame (x runs down the wind), so
        // every one is bowed the same way on both sides of every walk, none longer than 2.5 m, in three sizes at an even rhythm
        // (rows 3.3 m apart, 6.4 m between crescents, alternate rows set half a step along). Signed: > 0 inside, about metres.
        float crescent(vec2 P){
          float row = floor(P.y / 3.3), gx = P.x / 6.4 + .5 * mod(row, 2.) + .23 * h11(row * 3.7 + 1.), cx = floor(gx);
          vec2 f = vec2((gx - cx - .5) * 6.4, (P.y / 3.3 - row - .5) * 3.3);
          float hs = h11(cx * 7.3 + row * 13.1 + 2.), sz = hs < .34 ? .6 : (hs < .7 ? .8 : 1.);
          f -= (vec2(h11(cx * 3.1 + row * 5.7), h11(cx * 9.7 + row * 2.3)) - .5) * vec2(1.5, .45);
          f /= sz;
          float o = 1. - length(f / vec2(.9, 1.2)), n = length((f - vec2(.36, 0.)) / vec2(.9, 1.3)) - 1. - .05 * abs(sin(f.y * 6. + hs * 9.));   // ROUND TEN: a thin lip with a scalloped inner edge (it was a fat crescent)
          return h11(cx * 5.9 + row * 1.7 + 4.) < .1 ? -1. : min(o, n) * sz;
        }
        // ROUND TEN: beyond the Gates the snow is drawn as long low DRIFTS seen from the climb: one thin blue lip to each, bowed down
        // the axis, scalloped, pointed at both ends, in rows that widen with range (g: metres past the gate line, metres off the axis)
        float lips(vec2 g){
          float rc = log(1. + max(g.x, 0.) / 26.) * 5., row = floor(rc);
          float x0 = 26. * (exp(row / 5.) - 1.), rh = 26. * (exp((row + 1.) / 5.) - 1.) - x0, Lc = rh * 1.5;
          float gz = g.y / Lc + .5 * mod(row, 2.) + .31 * h11(row * 3.7 + 1.), cz = floor(gz), hs = h11(cz * 7.3 + row * 13.1 + 2.);
          float u = (gz - cz - .5) / (.33 + .14 * hs), e = 1. - u * u;
          float yc = x0 + rh * (.32 + .2 * h11(cz * 3.1 + row * 5.7)) + rh * .24 * e + rh * .06 * abs(sin(u * (5. + 3. * hs) + hs * 9.));
          return h11(cz * 5.9 + row * 1.7 + 4.) < .16 ? -1. : rh * .1 * e - abs(g.x - yc);
        }
        void main(){
          float d = distance(cameraPosition, vW);
          float far = 1. - smoothstep(70., 210., d), sd = dot(vNg, cameraPosition - vW) / (max(d, 1.) * max(length(vNg), 1e-4));   // how steeply the lens looks onto the snow here
          vec2 P = vec2(.6216 * vW.x + .7833 * vW.z, -.7833 * vW.x + .6216 * vW.z);
          float fc = crescent(P), drift = clamp(fc / max(fwidth(fc), 1e-4) + .5, 0., 1.) * step(-.25, fc) * far * (1. - smoothstep(318., 324., vW.x));   // beyond the Gates the small crescents stop
          vec2 gq = vec2(vW.x - 322., vW.z - 176.);
          float lipA = clamp(lips(gq) / max(fwidth(gq.x) + .5 * fwidth(gq.y), 1e-4) + .5, 0., 1.) * smoothstep(0., 8., gq.x) * (1. - smoothstep(150., 240., abs(gq.y))) * smoothstep(.05, .14, sd) * exp(-max(d - uNear, 0.) * .4 / max(uFog, 1.));
          // the walk's own coordinates (a: metres along it, c: across): the central walk, the quarter turn round the bandstand, the axis
          vec2 ac = vec2(vW.z, vW.x);
          if (vW.z >= 150.) {
            if (vW.x < 26.) { vec2 q = vW.xz - vec2(26., 150.); ac = vec2(150. + atan(q.y, -q.x + 1e-4) * 26., 26. - length(q)); }
            else ac = vec2(vW.x + 165., vW.z - 176.);
          }
          // the fire's light on the snow, under the hot lengths only: the short hot stretch of each walk railing, the stretch of edging
          // hoops alight down the axis, the far railings' runs, and the hoop's own small pool. Painted here; there is no lamp anywhere.
          float turn = step(150., vW.z) * step(vW.x, 26.), onAx = step(40., vW.x) * step(150., vW.z);
          float runA = smoothstep(uRun + ${(RAIL_AT - 3.9).toFixed(1)}, uRun + ${(RAIL_AT - 2.1).toFixed(1)}, ac.x) * (1. - smoothstep(uRun + ${(RAIL_AT - 0.9).toFixed(1)}, uRun + ${(RAIL_AT + 0.7).toFixed(1)}, ac.x)) * (.88 + .12 * sin(uTime * 1.3 + ac.x * .45));   // THE SPILL RULE: only under the straw head of the fire, 3 m long and 3 m wide
          float qa = (abs(ac.y) - 8.7) / 1.05;
          float wWalk = exp(-qa * qa) * runA * mix(1., step(ac.y, 0.), turn) * (1. - onAx);
          float runE = smoothstep(uXf - 6.5, uXf - 4., vW.x) * (1. - smoothstep(uXf - 1., uXf + 1., vW.x)) * step(46., vW.x) * (1. - smoothstep(296., 302., vW.x));
          float qe = (abs(vW.z - 176.) - 6.9) / 1.05, wEdge = exp(-qe * qe) * runE * .8;
          float xf = 56. + (uRun - 165.) / .3383;                                               // on the axis the runs leave us
          float runB = smoothstep(xf - 6., xf - 3.5, vW.x) * (1. - smoothstep(xf - .5, xf + 1.5, vW.x)) * step(50., vW.x) * (1. - smoothstep(316., 322., vW.x));
          float qb = (abs(vW.z - 176.) - 29.6) / 1.05, wAxis = exp(-qb * qb) * runB;
          vec2 hq = vW.xz - uHoopP.xy; float wHoop = exp(-dot(hq, hq) / 4.5) * uHoopP.z;
          float warm = clamp(max(max(wWalk, wAxis), max(wHoop, wEdge)) * uWarm, 0., 1.) * exp(-d / 700.);
          // the snowfield pales with range into the sky's LOW band (and into the pale light where the Gates stand), never to a line
          vec2 hd = vW.xz - cameraPosition.xz; hd /= max(length(hd), 1e-4);
          vec3 hz = horizonCol(hd), gm = mix(sqrt(max(hz, 0.)), sqrt(max(mix(uGround, uGroundB, drift), 0.)), exp(-max(d - uNear, 0.) / max(uFog, 1.))), g = gm * gm;
          g = mix(hz, g, smoothstep(0., .075, sd));
          g = mix(g, uGroundB, lipA * .9);
          g = mix(g, mix(uOrange, uStraw, smoothstep(.5, .95, warm)), min(warm * 1.15, .9));
          gl_FragColor = vec4(g, 1.);
        }`,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), groundMat);
    ground.position.set(160, 0, 100); ground.frustumCulled = false; scene.add(ground);
    // the marks the garden leaves on it, gathered as it is built: [x, z, half-length, half-width, heading, kind, seed];
    // kind 0 a melt dimple round a bar foot with its short lee scour, 1 a pock where a clump fell, 2 a drift banked on a railing
    let gr = vr.fork('ground');
    const marks = [], solids = [], WIND = 0.9;
    // ROUND NINE: nothing casts a shadow, so no blue mark may lie beside a foot or point away from one. A foot stands in a dimple no wider
    // than one and a half times itself, drawn by its lip alone (a thin crescent, white inside); solids remembers every foot and piece so the
    // long strokes can keep 3 m clear of them
    const foot = (x, z, r, lip = true, g = gr) => { solids.push([x, z, r]); const m = [x, z, r * 1.5, r * 1.5, WIND + g.range(-0.3, 0.3), 0, g()]; if (lip) marks.push(m); };   // ROUND ELEVEN: lip false: no blue crescent at this foot (the terminal posts: it read as a shadow)
    const pock = (x, z, r = gr.range(0.4, 0.95)) => marks.push([x, z, r, r * gr.range(0.65, 0.9), gr() * 6.28, 1, gr()]);

    // ---- sky: flat pearl; its only texture is three far veils of falling streaks, a twentieth darker, sinking slowly ------------
    const veilMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uVeil: { value: new THREE.Color(veilHex) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec2 aSz; varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv * aSz; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW; uniform vec3 uVeil;
        ${COMMON_GLSL}
        ${HILL_GLSL}
        void main(){
          // ROUND TEN: the far snowfall is SNOW: round flakes in short slanted trails of three (a flake and two smaller ones behind it), all
          // drifting down their own slant at their own pace (no column stands still, no patch is empty), one flat tone a step darker
          // than the sky; nothing is drawn over the hill, the snowfield or below the hill line
          vec3 dir = vW - cameraPosition; float dl = max(length(dir), 1e-4), h = dir.y / dl; vec2 hd = dir.xz / max(length(dir.xz), 1e-4);
          if (h < max(hillTop(hd), 0.) + .05) discard;
          vec2 p = vUv / 17.; p.x += p.y * .32;
          float w = fwidth(p.x) + fwidth(p.y) + 1e-4, col = floor(p.x), r = h11(col * 3.7 + 1.), r2 = h11(col * 9.1 + 4.);
          float ry = (p.y + uTime * (.5 + .45 * r2) + r * 31.) / 2.6, row = floor(ry), r3 = h11(col * 5.1 + row * 13.7 + 2.), r4 = h11(col * 1.9 + row * 7.3);
          vec2 f = vec2(p.x - col - .5 - (r4 - .5) * .42, (ry - row) * 2.6 - .5) / (.72 + .4 * h11(col * 7.7 + row * 3.3 + 1.));   // no two the same size or place
          float tr = max(.19 - length(f - vec2(0., .62 + .2 * r4)), .12 - length(f - vec2(0., 1.12 + .4 * r4)));   // the trail is two smaller flakes following the first up its slant
          float d = max(.27 - length(f), tr), a = clamp(d / w + .5, 0., 1.) * step(.46 + .4 * vUv.y / 420., r3) * .42;
          if (a < .01) discard;
          gl_FragColor = vec4(uVeil, a);
        }`,
    });
    // the hour's sky: one dome round the lens, flat pearl at noon; at dusk slate blue overhead falling to a pale band on the horizon
    const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 24, 12), skyMat); sky.frustumCulled = false; sky.renderOrder = -5; scene.add(sky);
    const veils = new THREE.Group();
    for (const [x, z, ry, w] of [[-190, 640, 0.25, 620], [480, 800, -0.5, 700], [960, 640, -1.05, 560], [900, -330, -2.1, 700]]) {
      const vg = new THREE.PlaneGeometry(w, 420); vg.setAttribute('aSz', new THREE.BufferAttribute(new Float32Array([w, 420, w, 420, w, 420, w, 420]), 2));
      const m = new THREE.Mesh(vg, veilMat); m.position.set(x, 205, z); m.rotation.y = ry; m.renderOrder = -2; veils.add(m);
    }
    scene.add(veils);
    await ctx.yield();

    // ---- THE GREAT GATES ---------------------------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { style, detail, tilt: TILT, ringY: RINGY, overthrow: cast.overthrow, heat: 3.5 * Math.min(heatK, 1.25), halo: 3.4 * heatK,
      ember: hour === 'night' ? 0.3 : hour === 'dusk' ? 0.24 : 0, cool: 1.6, haloMin: 4, haloMax: 0.02, plume: 1.55, plumeFat: 1.75 });
    hero.object.position.set(GX, 0, AXZ); hero.object.rotation.y = -Math.PI / 2;      // its +Z (the side the lens comes from) faces -X
    scene.add(hero.object);
    hero.object.traverse((o) => { if (!o.isMesh) return;                          // the Gates are off to one side for the first third: let them be culled
      if (o.isInstancedMesh) o.boundingSphere = new THREE.Sphere(P3(0, 112, 0), 62); else if (o.geometry.isInstancedBufferGeometry) o.geometry.boundingSphere = new THREE.Sphere(P3(0, 60, -15), 110); else o.geometry.boundingSphere.radius += 5;
      o.frustumCulled = true; });
    await ctx.yield();
    // ---- sections: each region of the garden is one iron batch and one snow batch (two draws), culled as a whole --------------
    const { Batch, bar, cap, collar, scrollSpec, scrollPts } = style;
    const Y = P3(0, 1, 0), secs = {}, capPts = [], shv = [];   // shv: [point, lump size]: the caps that stand in front of the lens when the rare shiver comes
    const sec = (name) => secs[name] || (secs[name] = { I: new Batch(), S: new Batch(), shed: false });
    const tight = () => rng.range(0.18, 0.24);
    // hot iron that is not a winding scroll (style.hotMaterial): hotW, the fire running along the walk's railings a little ahead
    // of the lens (arc = metres of the route); hotX, the same fire leaving us down the axis railings, up the arches' standards and
    // up the piers (arc = order / AXR); hotS, still pieces just off the anvil. hr is their own rng, so the garden's draws keep their order.
    const hotW = new Batch(), hotX = new Batch(), hotS = new Batch(), hotE = new Batch(), AXR = 90 / 266, hr = vr.fork('hot'), pools = [];
    const helix = (x, z, y0, y1, R, o0, hand) => { const pts = [], n = Math.max(8, Math.round((y1 - y0) / (R * 0.55))), ph = hr() * 6.28;
      for (let i = 0; i <= n; i++) { const t = i / n, a = ph + hand * t * (y1 - y0) / (R * 2.6); pts.push(P3(x + Math.cos(a) * R * 1.02, lerp(y0, y1, t), z + Math.sin(a) * R * 1.02)); }
      bar(hotX, pts, { r: Math.max(0.22, R * 0.2), sides: 6, capA: false, capB: false, s0: o0 / AXR }); return o0 + (y1 - y0) * 1.25 * AXR; };
    // the forging: every forged scroll is an instance; order = the lens arc S at which it is born, dur = metres of flight it takes
    const forged = { walk: [], perg: [], turn: [], axis: [], crown: [] }, steam = [], steamF = [];   // steamF: tall plumes seen from far off, drawn fat
    const frameM = (p, dir, side, lean = 0) => { const z = new V3().crossVectors(dir, side).normalize(), s2 = side.clone().applyAxisAngle(dir, lean); z.applyAxisAngle(dir, lean);
      return new THREE.Matrix4().makeBasis(dir, s2, z).setPosition(p); };
    const forge = (list, p, dir, side, S, order, dur, plume = 0, g = rng) => {
      list.push({ m: frameM(p, dir, side, g.range(-0.1, 0.1)), S, order, dur, seed: g() });
      if (plume) (plume > 10.5 ? steamF : steam).push({ p: p.clone(), order: order + dur * 0.25, dur: Math.max(dur * 0.34, 4.6), seed: g(), h: plume });   // gone before the lens is abreast of it
    };
    const spike = (B, p, h, r, light) => bar(B, seg(p, P3(p.x + rng.range(-0.06, 0.06) * h, p.y + h, p.z + rng.range(-0.06, 0.06) * h), 4), { r: (t) => r * Math.pow(1 - t, 0.8), taper: true, rot: rng.range(0.4, 1.2), capA: false, light });

    // ROUND TWELVE, MORE FORGING IN WORK AT ONCE (added work only, its own dice fr): a scroll is pushed out of a collar as a straight glowing bar and
    // winds up from the tip, a plume stands over it and a lump of snow slides off beside it
    const fr = makeRng((((ctx.seed ?? 1) >>> 0) * 2654435761 + 1207) >>> 0);
    const forgeX = (list, p, dir, side0, Sp, order, dur, plume = 0, lump = 0) => { const side = side0.clone().addScaledVector(dir, -side0.dot(dir)).normalize();
      list.push({ m: frameM(p, dir, side, fr.range(-0.08, 0.08)), S: Sp, order, dur, seed: fr() });
      if (plume) steam.push({ p: p.clone(), order: order + dur * 0.2, dur: Math.max(dur * 0.45, 5), seed: fr(), h: plume });
      if (lump) clumps.push({ p: P3(p.x, p.y + 0.5, p.z), t: (order + dur * 0.15) / 10 + fr.range(0, 0.25), size: lump, seed: fr(), rho: 0 }); };
    const NUL = new Batch();                              // work too small to show at its distance is built here and never drawn, so the rng keeps its order
    const SHED = 15, clumps = [];                       // a cap takes 15 m of flight to let go; clump clock: 1 unit = 10 m of flight
    const shedOrder = (B, order) => { B.shed = 1 + order / SHED; };
    const dropClumps = (pts, order, n, size = [0.35, 0.8]) => { for (let i = 0; i < n; i++) { const p = pts[Math.floor(rng() * pts.length)];
      clumps.push({ p: P3(p.x + rng.range(-0.4, 0.4), p.y + 0.3, p.z + rng.range(-0.4, 0.4)), t: order / 10 + rng.range(0.2, 1.6), size: rng.range(size[0], size[1]), seed: rng(), rho: 0 }); } };
    // caps on bars the fire runs along (the walk's top rails, the edging hoops, the far railings) let go as it arrives: a quick
    // slump over 5 m of flight, in sections drawn with their own snow material (sec.shed = 'fast'); S.shed stays 0 for everything else there
    const SHEDF = 5, shedFast = (B, order) => { B.shed = 1 + (order + 100) / SHEDF; };
    const XF0 = 127, XFS = 227, XFR = 1.25, hoopS = (x) => XFS + (x - XF0) / XFR;     // the edging's fire: its front is at x = XF0 + (S - XFS) * XFR, leaving us down the axis
    // RAILING along a polyline: posts 0.7 m thick every ~10.5 m with a spike and collar, two rails, three pickets 3.5 m apart.
    // opt.list: the run's scroll list (three scrolls a bay, born as the lens nears); opt.lead: metres ahead of the lens it works.
    // how far ahead of the lens a run works: on the entry walk ONE lead from z 0 to the pergola (the brief: the run keeps pace 15 m ahead, each
    // scroll is born there as a straight hot bar and is wound shut 8 m from the lens); LD0 is the lead everywhere else.
    const LD0 = 20.5, LDW = 15;   // the run's work on the walk's railing (scrolls winding 8 to 15 m ahead, the rail's fire beyond them)
    const railing = async (sc, pts, opt = {}) => {
      const { I, S } = sc, LD = opt.walk ? LDW : LD0;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1], len = a.distanceTo(b), nb = Math.max(1, Math.round(len / 10.5)), d = b.clone().sub(a).normalize();
        for (let i = 0; i <= nb; i++) {
          if (i === nb && k < pts.length - 2) break;
          await ctx.yield();
          const p = a.clone().lerp(b, i / nb);
          bar(I, [P3(p.x, 0, p.z), P3(p.x, 4.2, p.z)], { r: 0.35, capA: false, rot: Math.atan2(d.x, d.z) + Math.PI / 4 }); foot(p.x, p.z, 0.35);
          spike(I, P3(p.x, 4.2, p.z), rng.range(1.2, 1.6), 0.33); collar(opt.far ? NUL : I, P3(p.x, 3.95, p.z), Y, 0.38, { band: 0.13, seg: 4, rng });   // the far railings stand 30 m off: their small collars are shed (same draws)
          cap(S, [P3(p.x - d.x * 0.3, 4.05, p.z - d.z * 0.3), P3(p.x + d.x * 0.3, 4.05, p.z + d.z * 0.3)], { r: 0.3, wide: 1.5, high: 0.5, seed: rng(), pinch: false });
          if (i === nb) break;
          const q = a.clone().lerp(b, (i + 1) / nb), bl = p.distanceTo(q);
          for (const y of [0.6, 3.4]) { const A = P3(p.x, y, p.z), Bq = P3(q.x, y, q.z);
            bar(I, [A, Bq], { r: 0.25, capA: false, capB: false, up: Y });
            if (opt.list && y > 3) bar(opt.far ? hotX : hotW, [A, Bq], { r: 0.285, sides: 4, capA: false, capB: false, up: Y, s0: opt.far ? axisOrder(A) / AXR : sOf(A.x, A.z) });
            if (opt.far) { if (y > 3) { shedFast(S, axisOrder(A) - 3); cap(S, [A, Bq], { r: 0.25, seed: rng(), pinch: false, minH: 0.3, step: 5.5 }); S.shed = 0; } continue; }
            if (y < 3 || !opt.list) { cap(S, [A, Bq], { r: 0.25, seed: rng(), pinch: false, minH: 0.3, step: 1.6 }); continue; }
            for (let j = 0; j < 4; j++) { const a0 = A.clone().lerp(Bq, j / 4 + 0.012), a1 = A.clone().lerp(Bq, (j + 1) / 4 - 0.012), mid = a0.clone().lerp(a1, 0.5), arc = sOf(mid.x, mid.z);
              shedFast(S, arc - RAIL_AT - 2.5); cap(S, [a0, a1], { r: 0.25, seed: rng(), pinch: false, minH: 0.3, step: 2.8 }); S.shed = 0;
              clumps.push({ p: P3(mid.x, y + 0.3, mid.z), t: (arc - RAIL_AT) / 10 + rng.range(0, 0.3), size: rng.range(0.3, 0.5), seed: rng(), rho: 0 }); capPts.push(mid); } }
          for (let j = 1; j <= 3; j++) {
            const c = p.clone().lerp(q, j / 4), far = opt.far;
            bar(I, [P3(c.x, 0.6, c.z), P3(c.x, 3.4, c.z)], { r: 0.16, capA: false, capB: false, light: !far });
            spike(I, P3(c.x, 3.4, c.z), rng.range(0.9, 1.2), 0.16, !far);
            if (opt.list && (!opt.every || j === 2)) {
              // it curls up from the root and fills the panel; on the far railings it is heavy cresting standing on the top rail, one a bay
              const root = P3(c.x, far ? 3.7 : rng.range(0.98, 1.1), c.z), across = far ? rng.range(4.3, 5.2) : Math.min(rng.range(2.4, 2.7), bl / 4 * 1.02);
              const Sp = scrollSpec(across, far ? 0.3 : 0.17, tight(), rng.range(0.5, 0.8) * (far ? 2.2 : 1), -rng.range(0.08, 0.16), 1);
              const order = (opt.order ? opt.order(root) : sOf(root.x, root.z) - LD) + rng.range(-1, 1) * (opt.order ? 1 : 0.3);
              forge(opt.list, root.addScaledVector(d, 0.2), d, P3(0, -1, 0), Sp, order, opt.dur ?? 7, j === 2 ? (far ? rng.range(11, 15) : rng.range(6, 10)) : 0);
            }
          }
        }
      }
    };
    // TREE: a barley-twist trunk 1.6 m thick forking at 9 m into five boughs that each end in a C-scroll 5 m across; or an
    // iron poplar, a tapering trunk with stacked S-scrolls. Snow on every bough.
    const tree = (sc, x, z, face) => {
      const { I, S } = sc, tw = rng.sign() * Math.PI * 2 * rng.range(2.2, 3); foot(x, z, 0.8);
      for (let i = 0; i < 5; i++) { const a = gr() * 6.28, r = gr.range(2.5, 7); pock(x + Math.cos(a) * r, z + Math.sin(a) * r); }
      if (cast.poplar) {
        const H = rng.range(21, 24);
        bar(I, seg(P3(x, 0, z), P3(x, H * 0.72, z), 30), { r: (t) => 0.8 - 0.25 * t, sides: 8, star: 0.62, twist: tw * 2, capA: false, capB: false });
        spike(I, P3(x, H * 0.72, z), H * 0.28, 0.45);
        collar(I, P3(x, 1.1, z), Y, 0.85, { band: 0.24, rng });
        for (let l = 0; l < 5; l++) for (const h of [1, -1]) {
          const y = 4.2 + l * 3.3 + rng.range(-0.3, 0.3), a = face + (l % 2 ? Math.PI / 2 : 0) + rng.range(-0.3, 0.3), dd = P3(Math.cos(a) * h, 0, Math.sin(a) * h);
          const dir = dd.clone().multiplyScalar(0.5).add(P3(0, 0.866, 0)).normalize(), side = dd.clone().multiplyScalar(0.866).add(P3(0, -0.5, 0)).normalize();
          const Sp = scrollSpec(rng.range(5, 6.4) * (1 - l * 0.07), 0.44, tight(), rng.range(3.5, 4.5), 0.16, 1), s = scrollPts(P3(x, y, z).addScaledVector(dd, 0.5), dir, side, Sp, 18);
          bar(I, s.pts, { r: s.r, sides: 6, taper: true, capA: false }); cap(S, s.pts, { r: s.r, seed: rng(), maxSlope: 0.75 });
          if (h > 0) collar(I, P3(x, y, z), Y, 0.8 - 0.07 * l, { band: 0.18, seg: 6, rng });
        }
        return;
      }
      bar(I, seg(P3(x, 0, z), P3(x, 9.3, z), 22), { r: 0.8, sides: 8, star: 0.62, twist: tw, capA: false, capB: false });
      collar(I, P3(x, 1.1, z), Y, 0.85, { band: 0.26, rng }); collar(I, P3(x, 9, z), Y, 0.95, { band: 0.3, rng });
      spike(I, P3(x, 9.3, z), rng.range(3, 4.5), 0.5);
      for (let i = 0; i < 5; i++) {
        const a = face + i * Math.PI * 2 / 5 + rng.range(-0.25, 0.25), dd = P3(Math.cos(a), 0, Math.sin(a)), e = i ? rng.range(0.25, 0.5) : rng.range(0.74, 0.86);
        const dir = dd.clone().multiplyScalar(Math.sin(e)).add(P3(0, Math.cos(e), 0)), side = dd.clone().multiplyScalar(-Math.cos(e)).add(P3(0, Math.sin(e), 0));
        const Sp = scrollSpec(i ? rng.range(5, 6.2) : rng.range(6.4, 7.4), i ? 0.48 : 0.58, tight(), i ? rng.range(8.5, 11.5) : rng.range(16.5, 19), -(i ? rng.range(0.05, 0.085) : 0.03), 1), s = scrollPts(P3(x, 8.6, z).addScaledVector(dd, 0.5), dir, side, Sp, 20);
        bar(I, s.pts, { r: s.r, sides: 6, taper: true, capA: false }); cap(S, s.pts, { r: s.r, seed: rng(), maxSlope: 0.82 }); capPts.push(s.pts[7], s.pts[11], s.pts[14]);
      }
    };

    // ---- the central walk: railings at x -9 and +9, trees at x -17 and +17 every 24 m from z 20 ----------------------------------
    const axisOrder = (p) => 165 + (p.x - 56) * AXR;      // on the axis the runs leave us: off at the reveal (S 165), three times our speed, at the piers at S 255
    await railing(sec('A'), [P3(9, 0, 0.3), P3(9, 0, 75.5)], { list: forged.walk, walk: true }); await ctx.yield();
    await railing(sec('A'), [P3(-9, 0, 0.3), P3(-9, 0, 75.5)], { list: forged.walk, walk: true });   // seven bays of 10.7 m a side, from z 0.3
    await ctx.yield();
    // a crozier winds up over every post of the walk's railings, outward of the walk (its plane faces the lens), born 28 m ahead and shut 6 m
    // ahead, so of the three posts ahead of the lens one carries a straight hot bar, one a half-wound hook and one a curl nearly shut
    for (const sx of [-1, 1]) for (let i = 0; i <= 7; i++) { const z = 0.3 + i * 75.2 / 7, root = P3(sx * 9.25, 4.1, z);
      forgeX(forged.walk, root, P3(sx * 0.1, 0.995, 0).normalize(), P3(-sx, 0, 0), scrollSpec(fr.range(3, 3.6), 0.2, fr.range(0.18, 0.24), fr.range(2.1, 2.9), -fr.range(0.06, 0.1), 1), sOf(root.x, root.z) - 28 + fr.range(-1.5, 1.5), 22, fr.range(6, 10), fr.range(0.4, 0.6)); }
    await ctx.yield();
    await railing(sec('B'), [P3(9, 0, 75.5), P3(9, 0, 128)], { list: forged.walk }); await ctx.yield();
    await railing(sec('B'), [P3(-9, 0, 75.5), P3(-9, 0, 149)], { list: forged.walk }); await ctx.yield();
    { const arc = [P3(-9, 0, 149)]; for (const a of [22.5, 45, 67.5, 90]) { const r = a * Math.PI / 180; arc.push(P3(26 - 35 * Math.cos(r), 0, 150 + 35 * Math.sin(r))); }
      arc.push(P3(62, 0, 206)); await railing(sec('C'), arc, { list: forged.turn }); await ctx.yield(); }
    await railing(sec('D'), [P3(62, 0, 206), P3(250, 0, 206), P3(321, 0, 223)], { list: forged.axis, every: true, order: axisOrder, dur: 24, far: true }); await ctx.yield();
    await railing(sec('D'), [P3(52, 0, 146), P3(250, 0, 146), P3(321, 0, 129)], { list: forged.axis, every: true, order: axisOrder, dur: 24, far: true }); await ctx.yield();
    const rngMain = rng, grMain = gr; rng = gr = makeRng('gates-in-the-snow:avenue:' + ctx.seed);   // the avenue's trees have their own dice
    for (let i = 0; i < 8; i++) for (const sx of [1, -1]) {
      const x = sx * 17 + rng.range(-0.6, 0.6), z = 20 + i * 24 + rng.range(-0.8, 0.8);
      if (Math.hypot(x - BSX, z - BSZ) < 24 || path.nearestXZ(x, z).dist < 13) continue;
      tree(sec(z < 76 ? 'A' : z < 140 ? 'B' : 'C'), x, z, sx > 0 ? Math.PI : 0); await ctx.yield();
    }
    rng = rngMain; gr = grMain;

    // where the turn meets the axis: the last tree of the avenue outside the turn's railing, and a pair of heavy capped terminal
    // posts either side of the axis walk (barley twist on a plinth, collars, a spike, two capped scrolls at the head)
    tree(sec('C'), 40, AXZ + 20, Math.PI); await ctx.yield();
    const termPost = (sc, x, z, ax) => { const { I, S } = sc, R = 0.95, c = Math.cos(ax), sn = Math.sin(ax); foot(x, z, 0.6, false);       // ax: the way its two scrolls lie
      { const sd0 = rng();                                                               // four scrolled feet: down and out from under the lower collar, toes curled up, each capped
        for (let i = 0; i < 4; i++) { const a = ax + 0.785 + i * 1.5708, ca = Math.cos(a), sa = Math.sin(a);
          const ft = scrollPts(P3(x + ca * R * 0.7, 2.7, z + sa * R * 0.7), P3(ca * 0.72, -0.69, sa * 0.72), P3(ca * 0.69, 0.72, sa * 0.69), scrollSpec(1.5, 0.24, 0.21, 2.5, -0.1, 1), 10);
          bar(I, ft.pts, { r: ft.r, sides: 6, taper: true, capA: false }); cap(S, ft.pts, { r: ft.r, seed: sd0 + i * 0.37, maxSlope: 0.8 }); } }
      bar(I, seg(P3(x, 0, z), P3(x, 11.2, z), 28), { r: R, sides: 8, star: 0.62, twist: rng.sign() * Math.PI * 2 * rng.range(2.6, 3.2), capA: false, capB: false });
      collar(I, P3(x, 2.9, z), Y, R * 1.08, { band: 0.3, seg: 8, rng }); collar(I, P3(x, 10.4, z), Y, R * 1.08, { band: 0.3, seg: 8, rng });
      spike(I, P3(x, 11.2, z), rng.range(4, 4.8), 0.7);
      for (const h of [1, -1]) { const os = scrollPts(P3(x + c * h * R * 0.8, 9.4 + (h > 0 ? 0 : 1.3), z + sn * h * R * 0.8), P3(c * h * 0.6, 0.8, sn * h * 0.6), P3(-c * h * 0.8, 0.6, -sn * h * 0.8), scrollSpec(rng.range(3.6, 4.4), 0.36, tight(), rng.range(1.6, 2.4), -0.08, 1), 22);
        bar(I, os.pts, { r: os.r, sides: 6, taper: true, capA: false }); cap(S, os.pts, { r: os.r, seed: rng(), maxSlope: 0.8 }); capPts.push(os.pts[10]); } };
    for (const sg of [-1, 1]) { termPost(sec('C'), 47, AXZ + sg * 12.5, Math.PI / 2); await ctx.yield(); termPost(sec('A'), sg * 9, 23, 0); await ctx.yield(); }
    termPost(sec('T'), 92, AXZ - 10.5, Math.PI / 2);   /* ROUND NINE: turned so its scrolls face the lens coming down the axis (edge-on it read as a thin stick) */ termPost(sec('T'), 97.5, AXZ + 33, Math.PI / 2); await ctx.yield();     // two more stand in the beds, where the lens leaves the walk      // and a pair at the head of the central walk
    for (const k of 'ABCD') sec(k).shed = 'fast';
    await ctx.yield();

    // ROUND TEN: beyond the Gates the snowfield rises as a real hill, 140 m high 550 m on, falling away either side of the axis
    const hillH = (x, z) => 140 * smoothstep(400, 880, x) * Math.exp(-(((z - AXZ) / 320) ** 2));
    // ---- the hoop: the one piece of iron with no snow on it, bowling down the walk ahead of the lens; its ruled track; its steam ---
    // It bowls by itself: a weaving line of its own down the walk (never the middle of it for long), now close ahead, now far
    // off and small, straightening only to go between the leaves.
    const GATE_A = walkPath.nearestXZ(GX, AXZ).u * walkPath.length - 10, _r0 = new V3(), _r1 = new V3(), hoopPh = vr.range(0, 6.28);
    const routeAt = (a, out) => { walkPath.posAtDist(a + 10, _r0); walkPath.posAtDist(a + 10.5, _r1); _r1.sub(_r0); const l = Math.hypot(_r1.x, _r1.z) || 1;
      const off = (4.3 * Math.sin(a / 23 + hoopPh) + 1.3 * Math.sin(a / 9.7 + 1.7 * hoopPh)) * (1 - smoothstep(GATE_A - 70, GATE_A - 20, a));
      return out.set(_r0.x - _r1.z / l * off, 0, _r0.z + _r1.x / l * off); };
    const hoopArc = (S) => S + 28 + 11 * Math.sin(S / 27 + 2 * hoopPh) * (1 - smoothstep(185, 300, S)) + (GATE_A - 452) * smoothstep(185, 430, S) + Math.max(0, S - 430) * 0.6 + 360 * smoothstep(385, 480, S);   // ROUND TEN: through the gateway it runs out ahead across the snow beyond, so its track is in the gap at u 0.79 to 0.94
    const hoop = new THREE.Group(), hoopLean = new THREE.Group(), hoopRoll = new THREE.Group(); hoop.add(hoopLean); hoopLean.add(hoopRoll);
    { const B = new Batch(), pts = [], wob = rng.range(0, 6.28);
      for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 1.5 * (1 + 0.03 * Math.sin(a * 2 + wob)); pts.push(P3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
      bar(B, pts, { r: 0.17, sides: 8, capA: false, capB: false, up: P3(0, 0, 1) });
      collar(B, P3(1.5, 0, 0), Y, 0.19, { band: 0.07, seg: 6, rng });
      const m = style.mesh(B, style.iron); hoopRoll.add(m); }
    scene.add(hoop);
    const hoopSteam = style.steamMesh([{ p: P3(0, 0, 0), order: 0, dur: -1, seed: 0.3, h: 2.4 }, { p: P3(0.25, 0, 0.2), order: 0, dur: -1, seed: 0.7, h: 1.5 }], style.steamMaterial(null));
    scene.add(hoopSteam);
    const hoopSteamFar = style.steamMesh([{ p: P3(0, 0, 0), order: 0, dur: -1, seed: 0.52, h: 26 }, { p: P3(0.6, 0, 0.4), order: 0, dur: -1, seed: 0.91, h: 15 }], hoopSteam.material);   // ROUND TEN: its thread seen from the climb
    hoopSteamFar.visible = false; hoopSteamFar.frustumCulled = false; scene.add(hoopSteamFar);
    const trackMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uHoop: { value: 0 }, uGateA: { value: GATE_A }, uGround: groundMat.uniforms.uGround, uGroundB: groundMat.uniforms.uGroundB }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40,
      vertexShader: /* glsl */`attribute vec2 aT; attribute vec2 aN; uniform float uGateA; varying vec2 vT; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vT = aT; vD = distance(cameraPosition, w.xyz);
          w.xz += aN * max(0., vD * .008 - .42) * smoothstep(uGateA - 40., uGateA, aT.x);   // ROUND TEN: beyond the Gates the track keeps a width the climb can see (it is 0.84 m wide close to)
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        varying vec2 vT; varying float vD; uniform float uHoop; uniform vec3 uGround, uGroundB;
        ${COMMON_GLSL}
        void main(){ if (vT.x > uHoop) discard; float e = abs(vT.y), aa = fwidth(vT.y) + 1e-4;
          gl_FragColor = vec4(toPearl(mix(mix(uGround, uSnow, .35), uGroundB, smoothstep(.42 - aa, .42 + aa, e)), vD), 1.); }`,
    });
    { const n = 760, pos = new Float32Array(n * 6), aT = new Float32Array(n * 4), aNn = new Float32Array(n * 4), idx = [], p = new V3(), q = new V3();
      for (let i = 0; i < n; i++) { const a = -8 + i * 1.4; routeAt(a, p); routeAt(a + 0.5, q); q.sub(p); const l = Math.hypot(q.x, q.z) || 1, nx = -q.z / l * 0.42, nz = q.x / l * 0.42;
        const hy = 0.11 + hillH(p.x, p.z) * 1.004; pos.set([p.x + nx, hy, p.z + nz, p.x - nx, hy, p.z - nz], i * 6); aT.set([a, 1, a, -1], i * 4); aNn.set([nx / 0.42, nz / 0.42, -nx / 0.42, -nz / 0.42], i * 4);
        if (i) { const o = i * 2; idx.push(o - 2, o - 1, o, o, o - 1, o + 1); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 2)); g.setAttribute('aN', new THREE.BufferAttribute(aNn, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, trackMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---- the pergola: z 80-135, eleven ribs 5.5 m apart, 14 m wide, 20 m high; the runs take to the ribs ---------------------------
    const leafList = [];                                // { p, dir, side, len, order }: beaten from a spike in four held shapes
    const leafAt = (p, dir, order, len = 2) => { const side = new V3().crossVectors(dir, P3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1))).normalize();
      leafList.push({ p, dir: dir.clone().normalize(), side, len: len * rng.range(0.85, 1.2), order }); };
    {
      const sc = sec('P'), { I, S } = sc; sc.shed = true;
      const ribPts = (z, lean) => { const pts = []; for (let i = 0; i <= 5; i++) pts.push(P3(-7, i * 2.6, z));
        for (let i = 1; i < 16; i++) { const a = i / 16 * Math.PI; pts.push(P3(-7 * Math.cos(a), 13 + 7 * Math.sin(a) * (1 + lean), z + Math.sin(a) * lean * 3)); }
        for (let i = 5; i >= 0; i--) pts.push(P3(7, i * 2.6, z)); return pts; };
      for (let r = 0; r < 11; r++) {
        const z = PZ + r * 5.5 + rng.range(-0.25, 0.25), pts = ribPts(z, rng.range(-0.03, 0.03)), ord = sOf(0, z) - 30;
        { const rr = r === 0 || r === 10 ? 0.5 : 0.4;      // ROUND TEN: each post is a barley twist with four collars and a snow pillow on every one (it read as a black slab)
          bar(I, pts.slice(5, pts.length - 5), { r: rr, sides: 4, capA: false, capB: false, up: P3(0, 0, 1) });
          for (const sx of [-1, 1]) { bar(I, seg(P3(sx * 7, 0, z), P3(sx * 7, 13.1, z), 20), { r: rr * 0.8, sides: 4, twist: (r % 2 ? 1 : -1) * sx * Math.PI * 2 * 1.9, capA: false, capB: false });
            for (const [cy, k] of [[6.7, 0], [1, 1]]) { if (!k) collar(I, P3(sx * 7, cy, z), Y, rr * 0.9, { band: 0.12, seg: 4, turns: 2 });
              if (cy < 12) cap(S, [P3(sx * 7 - 0.3, cy + 0.5, z), P3(sx * 7 + 0.3, cy + 0.5, z)], { r: 0.6, wide: 1.3, high: 0.5, minH: 0.3, seed: (r * 0.37 + cy * 0.11 + (sx > 0 ? 0.5 : 0)) % 1 }); } } }   // ROUND EIGHT: slimmer posts, the stem wound close: the near pairs take under a third of the frame
        shedOrder(S, ord + 4); cap(S, pts.slice(8, 19), { r: 0.55, seed: rng(), maxSlope: 0.9, minH: 0.7, high: 0.9 }); S.shed = 0;
        dropClumps(pts.slice(7, 11).concat(pts.slice(16, 20)), ord + 6, 12);
        for (const sx of [-1, 1]) {
          collar(I, P3(sx * 7, 12.6, z), Y, 0.38, { band: 0.12, seg: 6, rng }); collar(I, P3(sx * 7, 1, z), Y, 0.38, { band: 0.12, seg: 6, rng });
          // the rose (or vine) stem, 0.4 m thick, wound round the post
          const st = [], turns = cast.vine ? 4.5 : 2.5, ph = rng() * 6.28, hand = rng.sign();
          for (let i = 0; i <= 20; i++) { const t = i / 20, a = ph + hand * t * turns * Math.PI * 2; st.push(P3(sx * 7 + Math.cos(a) * 0.47, 0.2 + t * 13.5, z + Math.sin(a) * 0.47)); }
          bar(I, st, { r: (t) => 0.17 * (1 - 0.5 * t), sides: 4, light: true, capA: false });
          // the bracket the run forges under each shoulder, and a second curl standing on it
          const inw = P3(-sx, 0, 0), up = P3(-sx * 0.35, 0.94, 0).normalize();
          forge(forged.perg, P3(sx * 6.4, 9.2, z), up, inw.clone().negate(), scrollSpec(rng.range(3, 3.8), 0.2, tight(), 2.2, -0.1, 1), ord + rng.range(0, 3), 20, sx > 0 ? 8 : 0);
          if (sx < 0) steam.push({ p: P3(sx * 6.4, 9.2, z), order: ord + 6.5, dur: 7, seed: (r * 0.377 + 0.13) % 1, h: 7 + (r % 3) });   // the other side's brackets steam too (no rng draw)
          if (r % 2 === 0) forge(forged.perg, P3(sx * 6.5, 13.4, z), P3(sx * 0.5, 0.86, 0), inw, scrollSpec(rng.range(2.6, 3.3), 0.17, tight(), 1.6, 0.12, 1), ord + 5 + rng.range(0, 3), 18, 0);
        }
        // overhead the run pushes a tendril out of the rib's crown either side of the ridge: it hangs forward toward the next rib and winds back up
        for (const sx of [-1, 1]) { const a = Math.PI / 2 + sx * fr.range(0.38, 0.62), root = P3(-7 * Math.cos(a), 12.6 + 7 * Math.sin(a), z + 0.3);
          forgeX(forged.perg, root, P3(-sx * 0.3, -0.42, 0.86).normalize(), P3(0, -1, 0), scrollSpec(fr.range(3, 3.7), 0.2, fr.range(0.18, 0.24), fr.range(1.6, 2.4), -0.08, 1), ord + 9 + fr.range(0, 6), 17, 0, fr.range(0.35, 0.55)); }
        await ctx.yield();
        // water-leaves beaten out along the rib, more of them overhead
        const nl = Math.round((cast.vine ? 10 : 13) * detail);
        for (let i = 0; i < nl; i++) { const k = 4 + Math.floor(rng() * (pts.length - 8)), p = pts[k], out = P3(p.x, p.y - 11, 0).normalize();
          leafAt(P3(p.x, p.y, p.z + rng.sign() * 0.5).addScaledVector(out, -0.2), P3(out.x * rng.range(-0.6, 0.3), out.y * rng.range(-0.6, 0.3) - 0.25, rng.sign() * rng.range(0.6, 1)), ord + 6 + rng.range(0, 14), cast.vine ? 2.6 : 2); }
        if (!cast.vine && r % 3 !== 1) for (const sx of [-1, 1]) { const c = P3(sx * 7.1, rng.range(5, 12), z + rng.sign() * 0.7);       // roses: five leaves round a point, made long ago
          for (let i = 0; i < 5; i++) { const a = i * 1.257 + rng.range(-0.2, 0.2); leafAt(c.clone(), P3(sx * 0.5, Math.sin(a), Math.cos(a)), -1e4, 1.5); } }
        for (const sx of [-1, 1]) { foot(sx * 7, z, 0.5); for (let i = 0; i < 3; i++) pock(sx * gr.range(1.7, 6.2), z + gr.range(-1.6, 1.6)); }
        await ctx.yield();
      }
      for (const [x, y, rr] of [[0, 20, 0.4], [-7, 13.2, 0.35], [7, 13.2, 0.35]]) {       // purlins tie the ribs; their snow goes with the ribs'
        bar(I, [P3(x, y, PZ - 1.5), P3(x, y, PZ + 56.5)], { r: rr, up: Y });
        for (let r = 0; r < 10; r++) { const z0 = PZ + r * 5.5 + 0.7, ord = sOf(0, z0) - 26; shedOrder(S, ord + 6); cap(S, [P3(x, y, z0), P3(x, y, z0 + 4.1)], { r: rr, seed: rng(), minH: 0.6 });
          if (x !== 0) dropClumps([P3(x * 0.92, y, z0 + 1), P3(x * 0.92, y, z0 + 3)], ord + 8, 3); }
        S.shed = 0;
      }
      await ctx.yield();
    }

    // ---- the bandstand: centre (26, 150), eight barley-twist columns, a rail, sixteen roof ribs with no sheet between them -------------
    {
      const sc = sec('K'), { I, S } = sc, C = P3(BSX, 0, BSZ); sc.shed = true;
      for (let i = 0; i < 8; i++) {
        const a = (i + 0.5) / 8 * Math.PI * 2, p = P3(C.x + Math.cos(a) * 14, 0, C.z + Math.sin(a) * 14), a2 = (i + 1.5) / 8 * Math.PI * 2, q = P3(C.x + Math.cos(a2) * 14, 0, C.z + Math.sin(a2) * 14);
        bar(I, seg(P3(p.x, 0, p.z), P3(p.x, 13, p.z), 26), { r: 0.6, sides: 8, star: 0.62, twist: rng.sign() * Math.PI * 2 * rng.range(4, 5), capA: false, capB: false });
        collar(I, P3(p.x, 1.2, p.z), Y, 0.66, { band: 0.2, rng }); collar(I, P3(p.x, 12.3, p.z), Y, 0.66, { band: 0.2, rng }); foot(p.x, p.z, 0.6);
        bar(I, [P3(p.x, 13.2, p.z), P3(q.x, 13.2, q.z)], { r: 0.5, up: Y });                                               // the ring beam
        if (i !== 3) { bar(I, [P3(p.x, 3, p.z), P3(q.x, 3, q.z)], { r: 0.28, up: Y, capA: false, capB: false }); cap(S, [P3(p.x, 3, p.z), P3(q.x, 3, q.z)], { r: 0.28, seed: rng(), pinch: false });
          for (let j = 1; j < 4; j++) { const c = p.clone().lerp(q, j / 4); bar(I, [P3(c.x, 0, c.z), P3(c.x, 3, c.z)], { r: 0.16, light: true, capA: false, capB: false }); } }
        await ctx.yield();
      }
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, d = P3(Math.cos(a), 0, Math.sin(a)), pts = [];
        for (let k = 0; k <= 12; k++) { const t = k / 12, rad = 16.2 * (1 - t), y = 13.4 + 10.6 * Math.pow(t, 0.75) - 1.6 * Math.sin(t * Math.PI); pts.push(P3(C.x + d.x * rad, y, C.z + d.z * rad)); }
        bar(I, pts, { r: (t) => 0.42 - 0.12 * t, sides: 4, up: Y, capB: false });
        const tip = pts[0], ord = sOf(tip.x, tip.z) - 34 + (Math.abs(tip.x - C.x) < 20 && tip.z < C.z && tip.x > C.x ? 12 : 0);
        shedOrder(S, ord + 6); cap(S, pts.slice(0, 11), { r: (t) => 0.42 - 0.14 * t, seed: rng(), maxSlope: 0.9, minH: 0.75, wide: 1.25 }); S.shed = 0;
        dropClumps(pts.slice(0, 5), ord + 9, 8, [0.4, 0.8]);
        for (let j = 0; j < 4; j++) { const rr = gr.range(13.2, 18.4), aa = a + gr.range(-0.16, 0.16); pock(C.x + Math.cos(aa) * rr, C.z + Math.sin(aa) * rr); }
        // the bracket under the bare eave: pushed straight down the column's outer side, it winds up into the corner under the rib
        // (it never reaches out across the view of the Gates)
        forge(forged.turn, P3(tip.x - d.x * 1, 13, tip.z - d.z * 1), P3(d.x * 0.2, -0.98, d.z * 0.2).normalize(), P3(d.x * 0.98, 0.2, d.z * 0.98).normalize(), scrollSpec(rng.range(3.4, 4.2), 0.2, tight(), 1.5, -0.1, 1), ord + rng.range(0, 3), 20, i % 2 ? 9 : 0);
        if (i % 4 === 3) await ctx.yield();
      }
      spike(I, P3(C.x, 23.2, C.z), 5.5, 0.6); collar(I, P3(C.x, 23.8, C.z), Y, 0.7, { band: 0.25, rng });
      for (let i = 0; i < 16; i++) {                                                   // low hoops round its bed, 6.5 m inside the turn
        const pts = [], hh = rng.range(1.1, 1.4);
        for (let j = 0; j <= 8; j++) { const t = j / 8, a = (i + t * 1.06) / 16 * Math.PI * 2; pts.push(P3(C.x + Math.cos(a) * 17, Math.sin(t * Math.PI) * hh, C.z + Math.sin(a) * 17)); }
        bar(I, pts, { r: 0.15, sides: 4, capA: false, capB: false, up: Y }); cap(S, pts.slice(2, 7), { r: 0.15, seed: rng(), maxSlope: 0.9, minH: 0.28 });
      }
      await ctx.yield();
    }

    // ---- the three approach arches, 170, 100 and 50 m before the Gates: two twisted standards whose crowns stop short of meeting;
    //      the runs close each crown as the lens goes under the first and through the other two ------------------------------------
    {
      const sc = sec('R'), { I, S } = sc, o2 = [0, 0], w = new V3();
      // THE CLEAR RING: no forged member of any arch's crown comes nearer the route than RING metres (a rule in space, the same for all three
      // arches), so a crown is seen ahead as a sight round the Gates and never hangs against the lens. A scroll's dice are thrown as they always
      // were (clearM), then its stem is shortened, with no dice, until the whole of it is outside the ring.
      const RING = 14.5, RINGW = 8, crowns = makeRng('gates-in-the-snow:crowns:' + ctx.seed);   // crowns: the dice of the arches' forged scrolls
      const clearForge = (root, dir, side, across, R, stem, k, order, dur, plume) => {
        for (let tries = 0; tries < 14; tries++) {
          let Sp = scrollSpec(across, R, crowns.range(0.18, 0.24), stem, k, 1);
          const hits = (clear) => { for (let i = 0; i <= 30; i++) { style.scrollAt(Sp, Sp.L * i / 30, o2); w.copy(root).addScaledVector(dir, o2[0]).addScaledVector(side, o2[1]); if (path.distanceTo(w.x, w.y, w.z) < clear + R) return true; } return false; };
          if (!hits(clearM)) {
            for (let t2 = 0; t2 < 18 && hits(Math.max(clearM, RING)); t2++) { stem = Math.max(0.5, stem - 1.2); if (stem <= 0.6) across *= 0.88; Sp = scrollSpec(across, R, Sp.b, stem, k, 1); }
            forge(forged.crown, root, dir, side, Sp, order, dur, plume, crowns); return; }
          stem = Math.max(0.5, stem - 1.2); if (stem <= 0.6) across *= 0.9;
        }
      };
      // x, apex height, half-width, standard half-thickness, springing height, half-gap at the apex. Seen from the axis walk each
      // stands outside the next and outside the Gates' piers, so the three nest round the Gates like sights, crowns rising.
      let clearM = 7.3;
      const ARCH = [[ARCH1, 18, 28, 1.4, 7, 3.6], [226, 60, 48, 2, 24, 6], [258, 82, 56, 2.4, 46, 15]];   // the second arch's apex stands 60 m up, so its bar and old curls too are well outside the ring (21 m over the route)
      for (let k = 0; k < 3; k++) { const nCrown0 = forged.crown.length;
        clearM = k === 2 ? 10.5 : 7.3;
        const [x, H, hw, R, top, gz] = ARCH[k], yc = path.nearestXZ(x, AXZ).y, sPass = sOf(x, AXZ), thE = Math.acos(gz / hw);
        for (const sg of [-1, 1]) {
          const z = AXZ + sg * hw, arcP = (th, dx = 0) => P3(x + dx, top + (H - top) * Math.sin(th), AXZ + sg * hw * Math.cos(th));
          bar(I, seg(P3(x, 0, z), P3(x, 2.4, z)), { r: R * 1.5, capA: false }); foot(x, z, R * 1.5);                                   // plinth
          cap(S, [P3(x, 1.2, z - R * 1.5), P3(x, 1.2, z + R * 1.5)], { r: R * 1.5, wide: 1.06, high: 0.14, seed: rng() });
          bar(I, seg(P3(x, 2.2, z), P3(x, top, z), Math.round(top / 0.8)), { r: R, sides: 8, star: 0.62, twist: rng.sign() * Math.PI * top / (R * 2.4), capA: false, capB: false });
          collar(I, P3(x, 3.4, z), Y, R * 1.08, { band: R * 0.3, seg: 8, rng }); collar(I, P3(x, top - 0.8, z), Y, R * 1.08, { band: R * 0.3, seg: 8, rng });
          spike(I, P3(x, top, z + sg * R * 0.4), k === 0 ? 4.5 : 6 + 4 * k, R * 0.6);
          // the springing bar: a capped quarter arc sweeping in from the standard's head and stopping short of the apex under a collar,
          // where the old crown ends in one capped curl turned up and back
          const sp = []; for (let i = 0; i <= 26; i++) sp.push(arcP(thE * i / 26));
          const rs = (t) => R * (1 - (k === 2 ? 0.66 * t : k === 0 ? 0.68 * Math.pow(t, 0.7) : 0.62 * t))   /* ROUND EIGHT: the first arch's bar thins early to a slim bar over the walk */, end = sp[26], tan = P3(0, (H - top) * Math.cos(thE), -sg * hw * Math.sin(thE)).normalize(), nUp = P3(0, hw * Math.sin(thE), sg * (H - top) * Math.cos(thE)).normalize();
          bar(I, sp, { r: rs, sides: 6, taper: true, capA: false, capB: false, up: P3(1, 0, 0) }); cap(S, sp.slice(2), { r: (t) => R * (0.96 - (k === 2 ? 0.62 * t : k === 0 ? 0.64 * Math.pow(t, 0.7) : 0.58 * t)), seed: rng(), maxSlope: 0.92, wide: 1.12, high: 0.5 });
          if (k) { for (let i = 4; i <= 25; i += 2) shv.push([sp[i], 0.42 + 0.24 * k]); shv.push([P3(x, 1.6, z), 0.5]); }
          collar(I, end, tan, R * (k === 0 ? 0.5 : 0.7), { band: R * 0.2, seg: 6, rng });
          { const oTop = helix(x, z, 2.4, top, R, axisOrder(P3(x, 0, z)), sg);                                       // the run leaps the standard and takes the springing bar
            bar(hotX, sp.map((p, i) => p.clone().add(P3(i % 2 ? 0.25 : -0.25, 0, 0))), { r: (t) => Math.max(0.22, rs(t) * 0.3), sides: 6, capA: false, capB: false, up: P3(1, 0, 0), s0: oTop / AXR }); }
          for (const th of k === 0 ? [0.8] : [0.56, 0.95]) {                                       // crockets: capped curls standing on the haunches, turned toward the apex
            const tg = P3(0, (H - top) * Math.cos(th), -sg * hw * Math.sin(th)).normalize(), no = P3(0, hw * Math.sin(th), sg * (H - top) * Math.cos(th)).normalize(), rb = rs(th / thE);
            const cr = scrollPts(arcP(th).addScaledVector(no, rb * 0.7), no.clone().multiplyScalar(0.86).addScaledVector(tg, 0.5), tg.clone().multiplyScalar(0.86).addScaledVector(no, -0.5), scrollSpec([3.6, 6.5, 8.5][k] * rng.range(0.9, 1.1), R * 0.4, tight(), [1.2, 2.2, 3][k], -0.07, 1), 22);
            bar(I, cr.pts, { r: cr.r, sides: 6, taper: true, capA: false }); cap(S, cr.pts, { r: cr.r, seed: rng(), maxSlope: 0.8 }); collar(I, arcP(th), tg, rb * 1.1, { band: R * 0.2, seg: 6, rng });
            if (k) shv.push([cr.pts[9], 0.4 + 0.2 * k], [cr.pts[15], 0.35 + 0.2 * k]);
          }
          const cs = scrollPts(end, tan, nUp, scrollSpec(k === 2 ? 8.5 : gz * 1.15 + 1.5, R * (k === 2 ? 0.3 : 0.42), tight(), 1, -0.06, 1), 24);
          bar(I, cs.pts, { r: cs.r, sides: 6, taper: true, capA: false }); cap(S, cs.pts, { r: cs.r, seed: rng(), maxSlope: 0.8 }); if (k) shv.push([cs.pts[8], 0.36 + 0.2 * k], [cs.pts[14], 0.3 + 0.2 * k]);
          for (let j = 0; j < (k === 0 ? 1 : 3); j++) { const y0 = top * (k === 0 ? 0.72 : 0.3 + 0.27 * j), os = scrollPts(P3(x, y0, z + sg * R * 0.9), P3(0, 0.8, sg * 0.6), P3(0, 0.6, -sg * 0.8), scrollSpec(rng.range(4.5, 6) + k, R * 0.42, tight(), rng.range(2.5, 4), -0.08, 1), 22);
            bar(I, os.pts, { r: os.r, sides: 6, taper: true, capA: false }); cap(S, os.pts, { r: os.r, seed: rng(), maxSlope: 0.8 }); collar(I, P3(x, y0, z), Y, R * 1.08, { band: R * 0.26, seg: 8, rng }); if (k) shv.push([os.pts[10], 0.4 + 0.2 * k]); }
          // closing the gap: the run leaps the standards (axisOrder) and two scrolls start across the apex from the collar, still
          // winding as the lens comes down the axis, shut before it passes
          await ctx.yield();
          const Rf = Math.min(R * 0.48, 0.62), o0 = axisOrder(P3(x, 0, z)), durG = sPass + (k ? -22 : 9) - o0;   // the first arch's are still winding as we go under
          clearForge(arcP(thE, 0.5), P3(0, 0.26, -sg * 0.966), P3(0, 0.966, sg * 0.26), gz * 1.3, Rf * 0.9, gz * 0.35, -0.05, o0 + crowns.range(0, 3), durG, k ? 12 : 9);
          clearForge(arcP(thE * 0.93, -0.5), P3(0, -0.1, -sg * 0.995), P3(0, k ? 0.995 : -0.995, k ? -sg * 0.1 : sg * 0.1), gz * (k ? 0.9 : 1.1), Rf * 0.75, gz * 0.9, k ? 0.04 : -0.04, o0 + 5 + crowns.range(0, 3), durG, 0);
          await ctx.yield();
          // the new crown: scrolls that spring from collars on the bar and wind shut round the way through
          const dur = k === 0 ? 34 : 72, base = sPass - (k === 0 ? 36 : 66);
          // ROUND EIGHT, alt [height, metres off the centreline, across]: a scroll that crossed a corner of the frame on the climb is
          // re-aimed to hang close under its bar (the third arch: its first aim is forged, then overwritten). With a fourth entry, its collar's place, the scroll is the wreath's alone: no first aim is forged.
          const reach = (th, ty, tz, across, kk, plume, lag, dx, alt) => { const n0 = forged.crown.length, root = arcP(th, dx), T = P3(x + dx, ty, AXZ + sg * tz), dir = T.clone().sub(root), len = dir.length(); dir.normalize();
            const side = P3(0, -dir.z, dir.y).multiplyScalar(kk > 0 ? 1 : -1);
            if (!(alt && alt[3])) clearForge(root, dir, side, across, Rf, Math.max(1, len - across * 0.55), Math.abs(kk) * (kk > 0 ? 1 : -1) * 0.012, base + lag + crowns.range(0, 4), dur, plume);
            if (alt && alt[3]) wreath(n0, arcP(alt[3], dx), P3(x + dx, alt[0], AXZ + sg * alt[1]), alt[2], kk > 0 ? 1 : -1, base + lag + 2, dur, (alt[3] * 7.31 + (sg > 0 ? 0.37 : 0.11)) % 1);
            else if (alt && forged.crown.length > n0) { const d2 = P3(x + dx, alt[0], AXZ + sg * alt[1]).sub(root), l2 = d2.length(); d2.normalize();
              const e = forged.crown[n0]; e.m = frameM(root, d2, P3(0, -d2.z, d2.y).multiplyScalar(kk > 0 ? 1 : -1), 0); e.S = scrollSpec(alt[2], Rf, 0.21, Math.max(1, l2 - alt[2] * 0.55), (kk > 0 ? 1 : -1) * 0.012, 1); } };
          // THE WREATH (the brief's closing crown: scroll tips winding shut round the lens, steam going by). The second crown's six scrolls hang from
          // collars high on the bar as long slim pendants and wind up BESIDE the way through, three a side at three heights above the way through (the lowest a metre over it), so that from the foot of
          // the climb they ring the Gates' overthrow and the lens passes between them. The clear ring is kept as a rule in space with no dice: nothing
          // within RING over the route's line, nothing within RINGW (half the brief's 16 m opening) to either side of it; a stem is shortened until
          // its whole scroll is outside. A plume stands behind each hook while it winds.
          const wreath = (n0, r2, T2, across, hand, order, dur, seed) => { const d2 = T2.clone().sub(r2), l2 = d2.length(); d2.normalize();
            const s2 = P3(0, -d2.z, d2.y).multiplyScalar(hand); let st = Math.max(1, l2 - across * 0.55), Sq = scrollSpec(across, Rf, 0.21, st, hand * 0.012, 1);
            const hit = () => { for (let i = 0; i <= 30; i++) { style.scrollAt(Sq, Sq.L * i / 30, o2); w.copy(r2).addScaledVector(d2, o2[0]).addScaledVector(s2, o2[1]);
              const lat = (Math.abs(w.z - AXZ) - Rf) / RINGW, ver = (path.distanceTo(w.x, w.y, AXZ) - Rf) / RING; if (lat < 1 && lat * lat + ver * ver < 1) return true; } return false; };
            for (let t2 = 0; t2 < 30 && hit(); t2++) { st = Math.max(0.5, st - 1); Sq = scrollSpec(across, Rf, 0.21, st, hand * 0.012, 1); }
            let e = forged.crown[n0]; if (!e) { e = { order, dur, seed }; forged.crown.push(e); }
            e.m = frameM(r2, d2, s2, 0); e.S = Sq;
            steam.push({ p: r2.clone().addScaledVector(d2, st + across * 0.3), order: e.order + e.dur * 0.3, dur: e.dur * 0.6, seed: (seed * 3.7 + 0.21) % 1, h: 8 + 4 * seed }); };
          await ctx.yield();
          if (k === 0) {        // two pendants a side, hanging in from the bar to curl 8 m off the centreline at 9 m: the top corners of the frame as we go under
            reach(0.98, 9.2, 8.6, 5, sg, 10, 0, 0.9); reach(0.66, 7.4, 13.5, 3.9, -sg, 0, 5, 0.9);
          } else {
            // alt of the second arch [height, metres off the centreline, across, where on the bar its collar sits]: the wreath
            reach(0.72, yc - 3, 10, 8.5, sg, 14, 0, 0, k === 2 ? [66, 38, 4.5] : [yc + 1, 10.5, sg > 0 ? 4.4 : 4.1, 1.12]); reach(1.0, yc + 5.5, 9.5, 7.5, -sg, 0, 4, 0.7, k === 2 ? [80, 35, 4.5] : [yc + 5, 9.5, sg > 0 ? 3.8 : 4.2, 1.26]); reach(1.26, yc + 10, 3.5, 6, sg, 12, 8, -0.7, k === 2 ? null : [yc + 9, 8.6, sg > 0 ? 3.7 : 3.4, 1.4]);
          }
        }
        if (k === 1) for (let i = nCrown0; i < forged.crown.length; i++) forged.crown[i].S = { ...forged.crown[i].S, R: forged.crown[i].S.R * 0.7 };   // the second crown's scrolls are slimmer bar
        await ctx.yield();
      }
    }

    // ---- the beds either side of the axis: iron thistles (or sunflowers of leaf rings) wearing snow hats, edged in low hoops --------
    {
      const sc = sec('T'), { I, S } = sc, sc2 = sec('E'), nx = Math.round(21 * clamp(vary.density ?? 1, 0.8, 1.2)); sc2.shed = 'fast';
      const NEARF = [110.5, AXZ + 19.6];                  // the near flower: the one the lens passes at hat height out over the bed
      let TI = I, TS = S;                                 // ROUND ELEVEN: a plant that would stand in the new route or on a herald's foot is still worked through (every die thrown) but into a batch that is never drawn
      const thistle = (x, z, H, K = 1, farRow = false, KS = 1) => {      // KS > 1: a heavy foreground plant (thicker stem and leaves, a second ring of head spikes, a broader hat)
        const lean = P3(rng.range(-0.05, 0.05), 1, rng.range(-0.05, 0.05)), topP = P3(x + lean.x * H, H, z + lean.z * H); foot(x, z, 0.5);
        bar(TI, seg(P3(x, 0, z), topP, 3), { r: (t) => (0.52 - 0.22 * t) * KS, sides: 4, taper: true, capA: false, capB: false, rot: rng() });
        collar(farRow ? NUL : TI, P3(x + lean.x * H * 0.93, H * 0.93, z + lean.z * H * 0.93), Y, 0.4, { band: 0.2, seg: 5, rng });
        for (let j = 0; j < 4; j++) { const a = rng() * 6.28, y = H * rng.range(0.25, 0.7), d = P3(Math.cos(a), 0.5, Math.sin(a));         // four spike leaves on the stem
          bar(TI, seg(P3(x + lean.x * y, y, z + lean.z * y), P3(x + lean.x * y + d.x * 2.9 * KS, y + 1.45 * KS, z + lean.z * y + d.z * 2.9 * KS), 2), { r: (t) => 0.27 * KS * (1 - t), sides: 4, taper: true, capA: false }); }
        if (cast.sunflower) {
          // a flat ring of eleven water-leaves turned three quarters toward the oncoming lens (it comes down the axis from -X), a
          // little toward the centreline, so the ring reads as a disc; its snow hat lies along the upper rim
          const fz = z > AXZ ? -1 : 1, n = 11, nn = P3(-1, 0, 0.5 * fz).normalize(), hh = P3(nn.z, 0, -nn.x), arc = [];
          for (let j = 0; j < n; j++) { const a = j / n * 6.28 + rng.range(-0.1, 0.1); leafAt(topP.clone(), hh.clone().multiplyScalar(Math.cos(a)).add(P3(0, Math.sin(a), 0)).addScaledVector(nn, 0.16), -1e4, 2.3 * K); }
          for (let j = 0; j <= 8; j++) { const a = (48 + j * 10.5) * Math.PI / 180; arc.push(topP.clone().addScaledVector(hh, Math.cos(a) * 2.05 * K).add(P3(0, Math.sin(a) * 2.05 * K, 0)).addScaledVector(nn, 0.3)); }
          cap(TS, arc, { r: 0.42 * K, wide: 1.5, high: 0.8, seed: rng(), maxSlope: 1.2 }); if (TS === S && x > 204) shv.push([arc[4], 0.5]);
        } else {
          for (let j = 0; j < 8; j++) { const a = j / 8 * 6.28 + rng.range(-0.3, 0.3), sp = rng.range(0.35, 0.6);
            bar(TI, seg(topP, P3(topP.x + Math.cos(a) * sp * 2.5 * K, topP.y + 2.1 * K, topP.z + Math.sin(a) * sp * 2.5 * K), 2), { r: (t) => 0.34 * K * (1 - t * 0.9), sides: 4, taper: true, capA: false }); }
          if (KS > 1) for (let j = 0; j < 7; j++) { const a = (j + 0.5) / 7 * 6.28;                                       // the outer ring: seven spikes thrown wide, no dice thrown for them
            bar(TI, seg(topP, P3(topP.x + Math.cos(a) * 2.1 * K, topP.y + 1.25 * K, topP.z + Math.sin(a) * 2.1 * K), 2), { r: (t) => 0.36 * K * (1 - t * 0.9), sides: 4, taper: true, capA: false }); }
          const cw = KS > 1 ? 1.3 : 0.95;
          cap(TS, [P3(topP.x - cw * K, topP.y + 1.3 * K, topP.z), P3(topP.x + cw * K, topP.y + 1.3 * K, topP.z)], { r: 0.7 * K, wide: 1.5, high: 0.75, seed: rng() });
          if (TS === S && x > 204) shv.push([P3(topP.x, topP.y + 1.5 * K, topP.z), 0.55]);
        }
      };
      for (let i = 0; i < nx; i++) {
        for (const [off, ph] of [[9.5, 0], [19, 0.5], [27, 0.25]]) for (const sg of [-1, 1]) {
          const x = 48 + (i + ph) * (252 / nx) + rng.range(-1.2, 1.2), z = AXZ + sg * (off + rng.range(-0.8, 0.8));
          if (Math.hypot(x - BSX, z - BSZ) < 22 || [[ARCH1, 28], [226, 48], [258, 56]].some(([ax, hw]) => Math.abs(x - ax) < 5.5 && Math.abs(Math.abs(z - AXZ) - hw) < 5.5)) continue;
          if (off > 20 && i % 2) continue;
          if (pathOld.distanceTo(x, 7, z) < 6.6 || Math.hypot(x - NEARF[0], z - NEARF[1]) < 7.5 || Math.hypot(x - 86, z - AXZ + 12.5) < 5 || Math.hypot(x - 96, z - AXZ - 25) < 5) continue;      // the lens flies between the first two rows: nothing stands in its way
          const hush = path.distanceTo(x, 7, z) < 7.2 || path.distanceTo(x, 3.5, z) < 6.2 || Math.hypot(x - HX, Math.abs(z - AXZ) - HZ) < 6.5, nL = leafList.length, nM = marks.length, nS = solids.length;
          if (hush) { TI = NUL; TS = NUL; }
          // a rule of the bed: the row nearest the walk is the tall one along the WHOLE axis (a broader crown, a heavier stem and a
          // second ring of head spikes; a tenth taller), the rows behind it stand lower
          const row1 = off < 10;
          thistle(x, row1 && sg > 0 && x > 137.5 && x < 150.5 ? z + 5.5 : z, rng.range(5.4, 6.6) * (row1 ? 1.1 : 0.9), row1 ? 1.15 : 1, off > 20, row1 ? 1.15 : 1);
          if (hush) { TI = I; TS = S; leafList.length = nL; marks.length = nM; solids.length = nS; }
          if (sg > 0) await ctx.yield();
        }
        await ctx.yield();
      }
      thistle(117.5, AXZ + 23.5, 6.4, 1.15);   // the near flower of the bed stands between its second and third rows
      const edging = makeRng('gates-in-the-snow:edging:' + ctx.seed);   // the dice of the hoops' feet
      for (let i = 0; i < 42; i++) for (const sg of [-1, 1]) {                                   // the low hoops, 6 m apart (under three a second at any speed we fly)
        const x0 = 46 + i * 6.05, z = AXZ + sg * 6.9, pts = [], hh = rng.range(1.5, 1.9);
        if (x0 > 296) continue;
        // low, small and whole: one separate hoop to a bay, 3.2 m long and about a metre high; none where the lens crosses out to the bed
        for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(P3(x0 + 1.6 + t * 3.2, Math.sin(t * Math.PI) * hh * 0.6, z + rng.range(-0.05, 0.05))); }
        if (path.distanceTo(x0 + 3.2, 0.6, z) < 5.8) { rng(); continue; }
        bar(sc2.I, pts, { r: 0.14, sides: 4, capA: false, capB: false, up: Y }); foot(x0 + 1.6, z, 0.14, true, edging); foot(x0 + 4.8, z, 0.14, true, edging);
        bar(hotE, pts, { r: 0.17, sides: 4, capA: false, capB: false, up: Y, s0: (x0 + 1.6) / 0.84 });                // the edging's fire: a front that leaves us down the axis (arc * 0.84 = metres of x)
        shedFast(sc2.S, hoopS(x0 + 3.2) - 2.5); cap(sc2.S, pts.slice(2, 7), { r: 0.14, seed: rng(), maxSlope: 0.9, minH: 0.24 }); sc2.S.shed = 0;   // each hoop's snow goes as the fire reaches it
        // ROUND TWELVE: a slim crozier stands in every other gap between two hoops, curling outward of the walk (its plane faces the lens), wound as the
        // edging's fire passes; none where a plant's foot or one of the smith's leavings (laid further down, by the same rule of 252 / nx) is in its way
        { const xc = x0 + 0.6, dxs = 252 / nx, js = Math.round((xc - 48) / dxs - 0.5), nearStation = (js % 2 ? 1 : -1) === sg && Math.abs(xc - (48 + (js + 0.5) * dxs)) < 4.6;
          if (i % 2 === 1 && !nearStation && !solids.some(([ox, oz, or]) => or >= 0.4 && Math.hypot(xc - ox, z + sg * 1.6 - oz) < 3 + or)) {
            forgeX(forged.axis, P3(xc, 0.1, z), P3(0, 0.995, sg * 0.1).normalize(), P3(0, 0, -sg), scrollSpec(fr.range(1.9, 2.4), 0.17, fr.range(0.18, 0.24), fr.range(2.4, 3.2), -fr.range(0.05, 0.09), 1), hoopS(xc) - 6 + fr.range(0, 4), 56, fr.range(8, 13), 0);
            solids.push([xc, z, 0.2]); } }
        if (i % 4 === 3 && sg > 0) await ctx.yield();
      }
    }

    // ---- the smith's leavings, all of them forged work (nothing that is not one of the seven forgings): offcuts of scroll cooling
    //      in the snow, one of each three still hot at its root; snow-capped urns turned on the bar; low box hedges of iron
    //      leaves; footprints between them. A hot offcut lays a small warm pool on the snow (pools: x, z, radius, seed, strength).
    {
      const hr = makeRng('gates-in-the-snow:leavings:' + ctx.seed);   // the leavings' own dice
      const sc = sec('F'), { I, S } = sc, tbl = [[0, 0.62], [0.1, 0.62], [0.18, 0.25], [0.3, 0.3], [0.5, 0.95], [0.68, 1.05], [0.8, 0.6], [0.9, 0.55], [1, 0.85]];
      const urnR = (t) => { for (let i = 1; i < tbl.length; i++) if (t <= tbl[i][0]) return lerp(tbl[i - 1][1], tbl[i][1], (t - tbl[i - 1][0]) / (tbl[i][0] - tbl[i - 1][0])); return 0.85; };
      const steps = (x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), n = Math.floor(L / 1.9), h = Math.atan2(dz, dx);
        for (let i = 1; i < n; i++) { const t = i / n, sd = i % 2 ? 0.45 : -0.45; marks.push([x0 + dx * t - Math.sin(h) * sd, z0 + dz * t + Math.cos(h) * sd, 0.52, 0.21, h + hr.range(-0.15, 0.15), 3, hr()]); } };
      const station = (x, z, h, kind, mute = false) => {
        const fx = Math.cos(h), fz = Math.sin(h), L = (u, y, v) => P3(x + fx * u - fz * v, y, z + fz * u + fx * v), F = P3(fx, 0, fz);
        if (kind === 4) for (const u of [-3, 0, 3]) solids.push([x + fx * u, z + fz * u, 0.9]); else solids.push([x, z, kind === 3 ? 2.4 : 1.1]);
        if (kind === 2) {                                                               // an urn, turned on the bar, wearing its snow
          const a0 = hr() * 6.28; foot(x, z, 0.62, true, hr);
          bar(I, [L(0, 0, 0), L(0, 1.05, 0)], { r: 0.22, sides: 6, capA: false, capB: false });
          for (let i = 0; i < 5; i++) { const a = a0 + i * 1.2566, pts = [];
            for (let j = 0; j <= 7; j++) { const t = j / 7, rr = 0.2 + 0.86 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.8); pts.push(L(Math.cos(a) * rr, 0.95 + 2.15 * t, Math.sin(a) * rr)); }
            bar(I, pts, { r: 0.12, sides: 4, capA: false, capB: false }); }
          collar(I, L(0, 0.95, 0), Y, 0.3, { band: 0.11, seg: 5 }); collar(I, L(0, 3.1, 0), Y, 0.3, { band: 0.11, seg: 5 });
          bar(I, seg(L(0, 3.1, 0), L(0, 4.5, 0), 3), { r: (t) => 0.17 * Math.pow(1 - t, 0.8), taper: true, capA: false });
          cap(S, [L(-0.45, 3.2, 0), L(0.45, 3.2, 0)], { r: 0.5, wide: 1.4, high: 0.85, seed: hr() });
        } else if (kind === 3) {                                                               // offcuts: curls of scroll thrown down, one still hot
          for (let j = 0; j < 3; j++) { const a = h + hr.range(-1.4, 1.4), d = P3(Math.cos(a), 0, Math.sin(a)), sd = P3(-d.z, 0, d.x).multiplyScalar(hr.sign());
            const o = L(hr.range(-1.6, 1.6), 0.2, hr.range(-1.1, 1.1)), sp = scrollPts(o, d, sd, scrollSpec(hr.range(1.7, 2.6), 0.17, hr.range(0.18, 0.24), hr.range(0.5, 1.5), 0.1 * hr.sign(), 1), 16);
            bar(mute === true ? NUL : j || mute === 'cold' ? I : hotS, sp.pts, { r: sp.r, sides: 6, taper: true, capA: false });
            if (!j && mute !== 'cold') { const pl = [o.x + d.x * 0.5, o.z + d.z * 0.5, 1.5, hr(), 0.75], st = { p: P3(o.x + d.x * 0.4, 0.3, o.z + d.z * 0.4), order: 0, dur: -1, seed: hr(), h: hr.range(2.6, 3.8) }; if (!mute) { pools.push(pl); steam.push(st); } } }
        } else {                                                                               // a small bed of iron leaves edged in three low hoops of bar, each hoop capped
          for (const u0 of [-3.3, -1.05, 1.2]) { const pts = [], hh = 0.95 + 0.2 * Math.abs(Math.sin(u0 * 3.1 + x));
            for (let q = 0; q <= 8; q++) { const t = q / 8; pts.push(L(u0 + t * 2.1, Math.sin(t * Math.PI) * hh, 0)); }
            bar(I, pts, { r: 0.15, sides: 4, capA: false, capB: false, up: Y }); cap(S, pts.slice(2, 7), { r: 0.15, seed: (u0 * 0.31 + x * 0.17 + 7) % 1, maxSlope: 0.9, minH: 0.26 }); }
          const nl = Math.round(24 * detail); for (let j = 0; j < nl; j++) { const u = -3.1 + 6.2 * (j + hr()) / nl, v = (j % 2 ? 1 : -1) * hr.range(0.25, 0.6);
            leafAt(L(u, 0.1, v * 1.6), P3(fx * hr.range(-0.3, 0.3) - fz * v * 0.9, 1, fz * hr.range(-0.3, 0.3) + fx * v * 0.9), -1e4, 0.95); }
        }
      };
      const KINDS = [3, 2, 4, 3, 2, 2, 3, 4, 2, 3], spots = [];
      for (let i = 0, z = 8; z < 70; i++, z += 8.2) { const sp = [(i % 2 ? 1 : -1) * hr.range(7.3, 7.8), z + hr.range(-1, 1), Math.PI / 2 + hr.range(-0.25, 0.25)]; if (!(i % 2)) sp.push(3, undefined, 'cold'); spots.push(sp); }   // the smith's leavings lie along the railings' feet; on the side the gaze rests on they lie flat and cold (offcuts only: the heat there is the railing's), so nothing stands between the lens and the bay in work
      for (const a of [9, 22, 35, 48, 61, 74, 86]) { const r = a * Math.PI / 180; spots.push([26 - 31.5 * Math.cos(r), 150 + 31.5 * Math.sin(r), r + hr.range(-0.2, 0.2)]); }
      { const nx = Math.round(21 * clamp(vary.density ?? 1, 0.8, 1.2)), dx = 252 / nx;                  // on the axis: just outside the edging, in the gaps of the first row of thistles
        for (let i = 0; 48 + (i + 0.5) * dx < 304; i++) spots.push([48 + (i + 0.5) * dx + hr.range(-1, 1), AXZ + (i % 2 ? 1 : -1) * hr.range(8.1, 8.6), hr.range(-0.25, 0.25)]); }
      spots.push([-6.8, 139, 1.4, 2]);                                                         // an urn where the walk opens to the bandstand
      const nBase = spots.length;
      spots.push([2.4, 22, 1.3, 3, 2.3], [-6.7, 63.5, 1.7, 3, 2.3], [1.4, 52, 1.2, 3, 2.3]);   // low offcuts on the entry walk (they lie flat)
      spots.push([8.2, 153.4, 1.2, 3], [8.9, 161.3, 2, 4], [15.2, 167.6, 2.6, 3], [-4.8, 153, 1.4, 2], [4.8, 140.5, 1.75, 4]); const hedges = [];   // inside the turn, between the lens and the bandstand's bed; and a basket urn outside it
      let last = [null, null];
      for (let i = 0; i < spots.length; i++) { let [x, z, h] = spots[i];
        if (i % 4 === 3) await ctx.yield();
        if (spots[i][4] ? pathOld.nearestXZ(x, z).dist < spots[i][4] : (pathOld.distanceTo(x, 2, z) < 3.4 || pathOld.nearestXZ(x, z).dist < 4.2)) continue;
        // CLEARANCE: a standing piece nearer the route than 6.5 m (in plan) is set straight out from it to 6.5 m, wherever on the route that is (no dice)
        if (!spots[i][4]) { const nr = path.nearestXZ(x, z); if (nr.dist < 6.5) { path.pointAt(nr.u, _r0); const k = 6.5 / Math.max(nr.dist, 0.5); x = _r0.x + (x - _r0.x) * k; z = _r0.z + (z - _r0.z) * k; } }
        const kind = spots[i][3] ?? KINDS[(i + Math.floor(hr() * 2)) % KINDS.length], sd = i % 2; station(x, z, h, kind, (x === 8.2 && z === 153.4) || spots[i][5] || false);
        if (i >= nBase) { if (kind === 4) hedges.push([x, z]); continue; }
        if (last[sd] && Math.hypot(x - last[sd][0], z - last[sd][1]) < 40) steps(last[sd][0], last[sd][1], x, z); last[sd] = [x, z];
      }
      steps(-6.2, 3.5, 2.6, 20.5); steps(3, 24, -6.6, 52); if (hedges.length > 1) steps(hedges[1][0], hedges[1][1], hedges[0][0], hedges[0][1]);   // the smith's own tracks between them
      await ctx.yield();
    }

    // ---- ROUND TEN: BEYOND THE GATES. The garden goes on: the snowfield rises beyond the gateway as a real hill (hillH; the pale lens
    //      of the sky stands behind it as the farther ridge), and an avenue forged of the same seven forgings and capped white climbs
    //      it to a far second arch on the crest: railing runs with spiked posts, scroll standards, trees in rows either side and outside
    //      the piers, paling and shedding small work with range (their own uFog), a few tips still growing and hot. Nothing stands in
    //      the gap's middle (the hoop's track runs up it), nothing is nearer the lens than the leaves. Own rng (zr): no draw of the garden's moves.
    const driftRng = vr.fork('drift'), zr = vr.fork('beyond');
    const ironZ = style.iron.clone(), snowZ = style.snowMaterial(), FOGZ = weather === 'heavy' ? 420 : weather === 'clear' ? 1000 : 760, fogZ = { value: FOGZ }, zMeshes = [];
    for (const k of Object.keys(U)) ironZ.uniforms[k] = U[k];
    ironZ.uniforms.uFog = fogZ; snowZ.uniforms.uFog = fogZ;
    forged.extra = [];
    const zForge = (p, dir, side, Sp, order, dur, plume = 0, list = forged.extra) => { list.push({ m: frameM(p, dir, side, zr.range(-0.1, 0.1)), S: Sp, order, dur, seed: zr() });
      if (plume) steamF.push({ p: p.clone(), order: order + dur * 0.25, dur: dur * 0.5, seed: zr(), h: plume }); };
    const ZI = new Batch(), ZS = new Batch();
    {
      { const nx = 40, nz = 30, pos = new Float32Array((nx + 1) * (nz + 1) * 3), nrm = new Float32Array((nx + 1) * (nz + 1) * 3), idx = [];      // the hill itself, drawn by the snowfield's own material
        for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = 396 + i * 27.6, z = AXZ - 750 + j * 50, o = (j * (nx + 1) + i) * 3, n = P3(hillH(x - 2, z) - hillH(x + 2, z), 4, hillH(x, z - 2) - hillH(x, z + 2)).normalize();
          pos.set([x, hillH(x, z) - 0.5, z], o); nrm.set([n.x, n.y, n.z], o);
          if (i < nx && j < nz) { const a = j * (nx + 1) + i, b = a + nx + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx);
        const m = new THREE.Mesh(g, groundMat); m.frustumCulled = false; scene.add(m); zMeshes.push(m); }
      await ctx.yield();
      const zSpike = (p, h, r) => bar(ZI, seg(p, P3(p.x + zr.range(-0.05, 0.05) * h, p.y + h, p.z + zr.range(-0.05, 0.05) * h), 3), { r: (t) => r * Math.pow(1 - t, 0.8), taper: true, rot: zr.range(0.4, 1.2), capA: false });
      const zScroll = (root, dir, side, across, R, stem, n, sides = 6) => { const s = scrollPts(root, dir, side, scrollSpec(across, R, zr.range(0.18, 0.24), stem, -zr.range(0.05, 0.09), 1), n);
        bar(ZI, s.pts, { r: s.r, sides, taper: true, capA: false }); cap(ZS, s.pts, { r: s.r, seed: zr(), maxSlope: 0.82, step: Math.max(2.4, across * 0.5) }); return s; };
      // a tree of the avenue's kind, K times the walk's: barley trunk, collar, spike, capped C-scroll boughs (the far ones shed the collar and a bough)
      const zTree = (x, z, K, far) => { const y0 = hillH(x, z) - 0.6, H = 9.4 * K, a0 = zr() * 6.28, nb = far ? 3 : 4;
        bar(ZI, seg(P3(x, y0, z), P3(x, y0 + H, z), far ? 6 : 10), { r: 0.85 * K, sides: far ? 6 : 8, star: 0.62, twist: zr.sign() * Math.PI * 2 * zr.range(2, 2.8), capA: false, capB: false });
        if (!far) collar(ZI, P3(x, y0 + H * 0.94, z), Y, 0.95 * K, { band: 0.3 * K, seg: 6, rng: zr });
        zSpike(P3(x, y0 + H, z), 4 * K, 0.5 * K);
        for (let i = 0; i < nb; i++) { const a = a0 + i * 6.283 / nb + zr.range(-0.25, 0.25), dd = P3(Math.cos(a), 0, Math.sin(a)), e = zr.range(0.3, 0.6);
          zScroll(P3(x, y0 + H * 0.9, z).addScaledVector(dd, 0.5 * K), dd.clone().multiplyScalar(Math.sin(e)).add(P3(0, Math.cos(e), 0)), dd.clone().multiplyScalar(-Math.cos(e)).add(P3(0, Math.sin(e), 0)), zr.range(5.2, 6.6) * K, 0.5 * K, zr.range(8, 11) * K, far ? 10 : 13, far ? 4 : 6); } };
      // a scroll standard: a barley-twist post on a plinth, two collars, a spike, two capped scrolls at its head lying across the avenue
      const zStd = (x, z, K, far) => { const y0 = hillH(x, z) - 0.6, R = 1.05 * K, H = 16 * K;
        bar(ZI, seg(P3(x, y0, z), P3(x, y0 + 2.2 * K, z)), { r: R * 1.5, capA: false }); cap(ZS, [P3(x, y0 + 1.1 * K, z - R * 1.5), P3(x, y0 + 1.1 * K, z + R * 1.5)], { r: R * 1.5, wide: 1.06, high: 0.14, seed: zr() });
        bar(ZI, seg(P3(x, y0 + 2 * K, z), P3(x, y0 + H, z), far ? 8 : 12), { r: R, sides: 8, star: 0.62, twist: zr.sign() * Math.PI * 2 * zr.range(2.6, 3.4), capA: false, capB: false });
        collar(ZI, P3(x, y0 + H - 1.2 * K, z), Y, R * 1.08, { band: R * 0.3, seg: far ? 4 : 5, rng: zr });
        zSpike(P3(x, y0 + H, z), 6 * K, R * 0.62);
        for (const h of [1, -1]) zScroll(P3(x, y0 + H - 2.4 * K + (h > 0 ? 0 : 1.6 * K), z + h * R * 0.8), P3(0, 0.8, h * 0.6), P3(0, 0.6, -h * 0.8), zr.range(5.4, 6.6) * K, 0.5 * K, zr.range(2, 3) * K, far ? 11 : 14, far ? 4 : 6);
        return y0; };
      await ctx.yield();
      for (const sg of [-1, 1]) {
        // the railing runs: posts with spikes 14 m apart (heavier up the hill), two rails, the top one capped; pickets only in the bays the climb sees close
        const z = AXZ + sg * 22, yAt = (x) => hillH(x, z) - 0.3;
        for (let i = 0; i <= 23; i++) { const x = i < 10 ? 372 + i * 14 : 512 + (i - 10) * 28, L = i < 10 ? 14 : 28, y = yAt(x), y2 = yAt(x + L), k = i < 10 ? 1 + i * 0.08 : 2.1 + (i - 10) * 0.12;
          bar(ZI, [P3(x, y - 0.3, z), P3(x, y + 5.2 * k, z)], { r: 0.45 * k, capA: false, rot: Math.PI / 4 }); zSpike(P3(x, y + 5.2 * k, z), zr.range(1.6, 2.1) * k, 0.42 * k);
          cap(ZS, [P3(x - 0.4 * k, y + 5.05 * k, z), P3(x + 0.4 * k, y + 5.05 * k, z)], { r: 0.4 * k, wide: 1.5, high: 0.5, seed: zr(), pinch: false });
          if (i === 23) break;
          for (const h of [0.8, 4.3]) bar(ZI, [P3(x, y + h * k, z), P3(x + L, y2 + h * k, z)], { r: 0.3 * k, capA: false, capB: false, up: Y });
          cap(ZS, [P3(x + 0.5, lerp(y, y2, 0.04) + 4.3 * k, z), P3(x + L - 0.5, lerp(y, y2, 0.96) + 4.3 * k, z)], { r: 0.3 * k, seed: zr(), pinch: false, minH: 0.34, step: L / 3, maxSlope: 0.95 });
          if (i % 5 === 4) await ctx.yield();
          if (i < 5) for (let j = 1; j <= 3; j++) { const px = x + j * 3.5, py = lerp(y, y2, j / 4); bar(ZI, [P3(px, py + 0.8, z), P3(px, py + 4.3, z)], { r: 0.2, capA: false, capB: false }); zSpike(P3(px, py + 4.3, z), zr.range(1, 1.4), 0.2); }
          // the run is still at work out here: in a few bays a scroll is winding up on the top rail, hot at the bend
          if (i % 3 === (sg > 0 ? 1 : 2) && i < 21) zForge(P3(x + L / 2, lerp(y, y2, 0.5) + 4.6 * k, z), P3(1, (y2 - y) / L, 0).normalize(), P3(0, -1, 0), scrollSpec(zr.range(5, 6) * k, 0.36 * k, zr.range(0.18, 0.24), zr.range(1.2, 1.8) * k, -zr.range(0.08, 0.14) / k, 1), 416 + i * 4.2 + zr.range(-2, 2), 50, i > 9 ? zr.range(14, 20) : 0);
        }
        await ctx.yield();
        // scroll standards outside the railings, 62 m apart, heavier up the hill; the nearer ones have a new curl winding at the head
        for (let i = 0; i < 5; i++) { const x = [400, 484, 578, 684, 796][i] + zr.range(-2, 2), K = 1.8 + 0.5 * i, zs = AXZ + sg * (36 + K * 4.2 + zr.range(-1, 1)), y0 = zStd(x, zs, K, i > 2);
          zForge(P3(x, y0 + 11 * K, zs - sg * 1.2 * K), P3(0, 0.5, -sg * 0.866), P3(0, 0.866, sg * 0.5), scrollSpec(zr.range(6.5, 7.5) * K, 0.42 * K, zr.range(0.18, 0.24), 2 * K, -0.1 / K, 1), 420 + i * 13 + (sg > 0 ? 0 : 7) + zr.range(-3, 3), 60, 16 + 4 * i);
          await ctx.yield(); }
        // trees in rows either side of the avenue, outside the piers and over the hill's shoulders, bigger and plainer with range
        for (const [x, off, K] of [[350, 80, 1.6], [424, 130, 2], [520, 96, 2.5], [612, 158, 2.9], [704, 112, 3.2], [800, 176, 3.6], [872, 260, 4]]) {
          zTree(x + zr.range(-3, 3), AXZ + sg * (off + zr.range(-3, 3)), K, x > 470); await ctx.yield(); }
      }
      { // the far second arch stands on the crest and closes the avenue: two twisted standards, capped springing bars meeting under a
        // collar, a spike over it, a capped curl on each haunch
        const x = 884, hw = 62, R = 3.8, y0 = hillH(x, AXZ + hw) - 1.5, top = y0 + 56, H = y0 + 112;
        for (const sg of [-1, 1]) { const z = AXZ + sg * hw, arcP = (th) => P3(x, top + (H - top) * Math.sin(th), AXZ + sg * hw * Math.cos(th));
          bar(ZI, seg(P3(x, y0, z), P3(x, y0 + 3.4, z)), { r: R * 1.5, capA: false });
          bar(ZI, seg(P3(x, y0 + 3.2, z), P3(x, top, z), 14), { r: R, sides: 8, star: 0.62, twist: sg * Math.PI * 5, capA: false, capB: false });
          collar(ZI, P3(x, top - 1.2, z), Y, R * 1.08, { band: R * 0.3, seg: 8, rng: zr });
          zSpike(P3(x, top, z + sg * R * 0.4), 14, R * 0.6); await ctx.yield();
          const sp = []; for (let i = 0; i <= 18; i++) sp.push(arcP(Math.PI / 2 * i / 18));
          bar(ZI, sp, { r: (t) => R * (1 - 0.55 * t), sides: 6, taper: true, capA: false, capB: false, up: P3(1, 0, 0) });
          cap(ZS, sp.slice(1), { r: (t) => R * (0.96 - 0.5 * t), seed: zr(), maxSlope: 0.92, wide: 1.12, high: 0.5, step: 4 });
          for (const th of [0.72]) { const tg = P3(0, (H - top) * Math.cos(th), -sg * hw * Math.sin(th)).normalize(), no = P3(0, hw * Math.sin(th), sg * (H - top) * Math.cos(th)).normalize();
            zScroll(arcP(th).addScaledVector(no, R * 0.6), no.clone().multiplyScalar(0.86).addScaledVector(tg, 0.5), tg.clone().multiplyScalar(0.86).addScaledVector(no, -0.5), 14, R * 0.42, 3, 14); } }
        collar(ZI, P3(x, H, AXZ), P3(0, 0, 1), R * 0.6, { band: 0.8, seg: 6, rng: zr }); zSpike(P3(x, H, AXZ), 15, 1.2);
      }
      // ROUND TEN: a sprout: a short twisted post in the snow, a collar, a capped curl of old work standing on it and a new scroll winding
      // up out of the same collar, hot at the bend (one at the far railing's foot on the entry walk, one inside the turn: a sprout grows at a railing's foot)
      const sprout = (x, z, face, K, order, dur) => { const F = sec('F'), c = Math.cos(face), sn = Math.sin(face), H = 1.0 * K; foot(x, z, 0.3 * K);
        bar(F.I, seg(P3(x, 0, z), P3(x, H, z), 8), { r: 0.24 * K, sides: 4, twist: Math.PI * 2.5, capA: false });
        collar(F.I, P3(x, H - 0.2 * K, z), Y, 0.26 * K, { band: 0.09 * K, seg: 5, rng: zr });
        const sp = scrollPts(P3(x, H - 0.1, z), P3(-c * 0.35, 0.94, -sn * 0.35), P3(c * 0.94, 0.35, sn * 0.94), scrollSpec(1.35 * K, 0.17 * K, 0.21, 0.35 * K, -0.1, 1), 14);
        bar(F.I, sp.pts, { r: sp.r, sides: 6, taper: true, capA: false }); cap(F.S, sp.pts, { r: sp.r, seed: zr(), maxSlope: 0.85, minH: 0.22 });
        zForge(P3(x, H - 0.25 * K, z), P3(c * 0.5, 0.866, sn * 0.5), P3(-c * 0.866, 0.5, -sn * 0.866), scrollSpec(1.7 * K, 0.17 * K, 0.21, 0.8 * K, 0.1, 1), order, dur, 0, forged.perg); };
      sprout(6.4, 27, 2.6, 0.85, 3, 24); sprout(8.4, 153.2, -1.2, 0.95, 136, 28);
      await ctx.yield();
      const zi = style.mesh(ZI, ironZ); await ctx.yield(); const zs = style.mesh(ZS, snowZ); zi.frustumCulled = zs.frustumCulled = true; zi.geometry.boundingSphere.radius += 6; zs.geometry.boundingSphere.radius += 6; scene.add(zi, zs); zMeshes.push(zi, zs);
      await ctx.yield();
    }

    // ---- ROUND ELEVEN: THE HERALDS. Two scroll standards of the avenue's kind stand at the foot of the climb, 25 m either side of the axis
    //      (seen down the axis they stand outside the piers, lower than the pier heads): a plinth, a barley twist, two collars with a snow
    //      pillow on the lower, a spike, two capped scrolls at the head. The run takes them as the lens comes by: its fire winds up the twist
    //      (heraldFire, a hot bar: straw at the head, a cherry tail), a new scroll is pushed out of the upper collar and winds up hot, a plume
    //      stands on the head. Own rng (sr): no draw of the garden's moves.
    const heraldFire = []; forged.herald = [];
    { const sr = vr.fork('heralds'), { I, S } = sec('R');
      for (const sg of [-1, 1]) {
        const x = HX, z = AXZ + sg * HZ, R = 1.5, top = 27, c = 0.65, sn = -sg * 0.76;      // the head scrolls lie across the diagonal the lens sees them from
        solids.push([x, z, R * 1.5]); marks.push([x, z, R * 2.3, R * 2.3, WIND + sr.range(-0.3, 0.3), 0, sr()]);
        bar(I, seg(P3(x, 0, z), P3(x, 2.6, z)), { r: R * 1.5, capA: false });
        cap(S, [P3(x, 1.3, z - R * 1.5), P3(x, 1.3, z + R * 1.5)], { r: R * 1.5, wide: 1.06, high: 0.14, seed: sr() });
        bar(I, seg(P3(x, 2.4, z), P3(x, top, z), 30), { r: R, sides: 8, star: 0.62, twist: sg * Math.PI * 2 * 4.2, capA: false, capB: false });
        collar(I, P3(x, 3.8, z), Y, R * 1.08, { band: R * 0.3, seg: 8, rng: sr }); collar(I, P3(x, top - 0.9, z), Y, R * 1.08, { band: R * 0.3, seg: 8, rng: sr });
        for (const cy of [3.8, 11.4, 19]) { if (cy > 4) collar(I, P3(x, cy, z), Y, R * 1.08, { band: R * 0.26, seg: 8, rng: sr });      // a collar every 7.6 m, a square pad of snow on each: the twist is banded white (it read as one black mass)
          cap(S, [P3(x - R * 1.05, cy - R * 1.12 + 0.75, z), P3(x + R * 1.05, cy - R * 1.12 + 0.75, z)], { r: R * 1.12, wide: 1.22, high: 0.5, minH: 0.9, pinch: false, seed: sr() }); }
        bar(I, seg(P3(x, top, z), P3(x + sr.range(-0.3, 0.3), top + 8, z + sr.range(-0.3, 0.3)), 4), { r: (t) => R * 0.62 * Math.pow(1 - t, 0.8), taper: true, rot: sr.range(0.4, 1.2), capA: false });
        for (const h of [1, -1]) { const os = scrollPts(P3(x + c * h * R * 0.8, top - 3.4 + (h > 0 ? 0 : 1.6), z + sn * h * R * 0.8), P3(c * h * 0.6, 0.8, sn * h * 0.6), P3(-c * h * 0.8, 0.6, -sn * h * 0.8), scrollSpec(sr.range(5.2, 6), 0.5, sr.range(0.19, 0.23), sr.range(2, 2.8), -0.08, 1), 22);
          bar(I, os.pts, { r: os.r, sides: 6, taper: true, capA: false }); cap(S, os.pts, { r: os.r, seed: sr(), maxSlope: 0.8 }); shv.push([os.pts[9], 0.5], [os.pts[13], 0.45], [os.pts[17], 0.4]); }
        { const pts = [], ph = sr() * 6.28; for (let i = 0; i <= 72; i++) { const t = i / 72, a = ph + sg * t * 19; pts.push(P3(x + Math.cos(a) * R * 1.06, 2.6 + t * (top - 3.2), z + Math.sin(a) * R * 1.06)); } heraldFire.push(pts); }
        forged.herald.push({ m: frameM(P3(x, top - 4.6, z - sg * R * 0.75), P3(0, 0.5, -sg * 0.866), P3(0, -0.866, -sg * 0.5), sr.range(-0.08, 0.08)), S: scrollSpec(sr.range(5.2, 5.7), 0.42, sr.range(0.2, 0.22), 2.5, -0.04, 1), order: HS - 74 + (sg > 0 ? 5 : 0), dur: 44, seed: sr() });
        steamF.push({ p: P3(x, top - 1.5, z), order: HS - 72, dur: 34, seed: sr(), h: sr.range(14, 17) });
        await ctx.yield();
      }
    }

    // ---- the ground's marks: one mesh of flat quads lying on the snow, each cut to its shape in the snow's blue --------------------
    {
      { const dr = driftRng, PI = Math.PI;
        // a wind ridge is laid only in the open walk, parallel to its edge, and only where its whole length is 3 m clear of every foot, piece and offcut
        const ridge = (x, z, h) => { const m = [x, z, dr.range(2.8, 5) * 0.6, dr.range(0.3, 0.44), h + dr.range(-0.08, 0.08) + (dr() < 0.5 ? PI : 0), 4, dr()], c = Math.cos(m[4]), sn = Math.sin(m[4]);
          for (const [ox, oz, or] of solids) for (let t = -1; t <= 1; t += 0.5) if (Math.hypot(x + c * m[2] * t - ox, z + sn * m[2] * t - oz) < 3 + or) return;
          marks.push(m); };
        for (const lx of [-5, -3, 3, 5]) for (let z = (lx === -3 || lx === 5 ? 4.5 : 9.5) + dr() * 2; z < 142; z += dr.range(9, 14)) ridge(lx + dr.range(-0.3, 0.3), z, PI / 2);
        await ctx.yield();
        for (const lz of [-4.9, -2.6, 2.6, 4.9]) for (let x = 40 + dr() * 9; x < 300; x += dr.range(12, 18)) ridge(x, AXZ + lz + dr.range(-0.4, 0.4), 0);
        await ctx.yield();
        for (const rr of [22.5, 29.5]) for (let a = 6 + dr() * 8; a < 86; a += dr.range(13, 19)) { const r = a * PI / 180; ridge(26 - rr * Math.cos(r), 150 + rr * Math.sin(r), PI / 2 - r); }
      }
      await ctx.yield();
      const n = marks.length, pos = new Float32Array(n * 12), aM = new Float32Array(n * 16), idx = [];
      marks.forEach(([x, z, hl, hw, h, kind, seed], i) => { const cx = Math.cos(h), sx = Math.sin(h);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v], j) => { pos.set([x + cx * u * hl - sx * v * hw, 0.08, z + sx * u * hl + cx * v * hw], i * 12 + j * 3); aM.set([u, v, kind, seed], i * 16 + j * 4); });
        idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aM', new THREE.BufferAttribute(aM, 4)); g.setIndex(idx);
      const markMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uFog: { value: fog }, uGroundB: groundMat.uniforms.uGroundB }, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40,
        vertexShader: /* glsl */`attribute vec4 aM; varying vec4 vM; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vM = aM; vD = distance(cameraPosition, w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          varying vec4 vM; varying float vD; uniform vec3 uGroundB;
          ${COMMON_GLSL}
          void main(){
            vec2 p = vM.xy; float r = length(p), th = r < 1e-4 ? 0. : atan(p.y, p.x), ph = vM.w * 40., f;
            if (vM.z < .5) f = min(.97 * (1. + .04 * sin(th * 5. + ph)) - r, length(p - vec2(.14, 0.)) - .82);                      // a foot's dimple: its lip alone, a thin crescent hugging the foot (never a filled blot or a tail: that reads as a cast shadow)
            else if (vM.z < 1.5) f = min(.88 * (1. + .1 * sin(th * 3. + ph)) - r, length(p - vec2(0., .24)) - .76);             // pock: a dent drawn by its lip alone, a small crescent (never a blot that could be a shadow)
            else if (vM.z < 2.5) f = min(p.y + .92, (1. - p.x * p.x) * 1.75 * (.78 + .22 * abs(sin(p.x * 7. + ph))) - .92 - p.y);   // drift: a lens with a scalloped lip
            else if (vM.z < 3.5) f = min(.9 - r, length(p - vec2(.22, 0.)) - .74);                                                                                      // a footprint: a dent drawn by its lip alone, a small crescent (a filled oval read as a shadow)
            else f = (1. - p.x * p.x) * .17 - abs(p.y - .5 * abs(sin(p.x * 2.6 + ph)) + .28);                                      // a drift lip lying along the walk: one thin scalloped stroke, pointed at both ends                                               // a wind ridge: one thin stroke lying along the walk, pointed at both ends
            float a = clamp(f / max(fwidth(f), 1e-4) + .5, 0., 1.) * (1. - smoothstep(90., 260., vD));
            if (a < .01) discard;
            gl_FragColor = vec4(toPearl(uGroundB, vD), a);
          }`,
      });
      const m = new THREE.Mesh(g, markMat); m.frustumCulled = false; m.renderOrder = -1; scene.add(m);
      await ctx.yield();
    }

    // ---- leaves: four held shapes of one bar (spike, two beatings, water-leaf); each instance sits in exactly one pose mesh ----------
    const NLF = leafList.length, leafM = new Float32Array(NLF * 64), leafStage = new Int8Array(NLF).fill(-1), leafMeshes = [];
    { const FZ = [1, 0.75, 0.5, 0.32], m4 = new THREE.Matrix4(), sc = new THREE.Matrix4();
      for (let k = 0; k < 4; k++) {
        const B = new Batch(), f = k / 3, pts = [];
        for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push(P3(t, 0, f * (0.16 * Math.sin(t * Math.PI) - 0.22 * t * t * t))); }
        bar(B, pts, { r: (t) => lerp(0.075 * Math.pow(1 - t, 0.8), 0.03 + 0.2 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.8), f), sides: 4, rot: 0, up: P3(0, 1, 0), taper: true });
        const im = new THREE.InstancedMesh(B.geometry(), style.ironFacet, Math.max(1, NLF)); im.count = 0; im.frustumCulled = false; leafMeshes.push(im); scene.add(im); await ctx.yield();
      }
      leafList.forEach((l, i) => { const z = new V3().crossVectors(l.dir, l.side).normalize();
        for (let k = 0; k < 4; k++) { m4.makeBasis(l.dir, l.side, z).setPosition(l.p); sc.makeScale(l.len, l.len, l.len * FZ[k]); m4.multiply(sc); m4.toArray(leafM, (i * 4 + k) * 16); } });
    }
    const setLeaves = (S) => {
      let changed = false;
      for (let i = 0; i < NLF; i++) { const st = clamp(Math.floor((S - leafList[i].order) / 5), 0, 3); if (st !== leafStage[i]) { leafStage[i] = st; changed = true; } }
      if (!changed) return;
      const n = [0, 0, 0, 0];
      for (let i = 0; i < NLF; i++) { const k = leafStage[i], o = (i * 4 + k) * 16; leafMeshes[k].instanceMatrix.array.set(leafM.subarray(o, o + 16), n[k] * 16); n[k]++; }
      for (let k = 0; k < 4; k++) { leafMeshes[k].count = n[k]; leafMeshes[k].instanceMatrix.needsUpdate = true; }
    };
    // ---- the rare event, the shiver: as the leaves start to move every cap in the garden lets go within two seconds ----------------
    for (const sg of [-1, 1]) for (let i = 0; i < 16; i++) { const th = zr.range(0.35, 1.3), x = ARCH1 + zr.range(-0.5, 0.5), zc = sg * Math.max(5.5, 28 * Math.cos(th));      // ROUND TEN
      clumps.push({ p: P3(x, 7 + 11 * Math.sin(th) + 0.6, AXZ + zc), t: (284 + zr.range(0, 30)) / 10, size: zr.range(0.4, 0.85), seed: zr(), rho: 0 }); }
    // ROUND ELEVEN: the collapse is IN FRONT of the lens. When the shiver comes the garden's caps are nearly all behind us, so the lumps are let go
    // from the caps still ahead: the second and third arches' bars and curls, the heralds' heads, the plants at the Gates' foot, the pier heads
    // and their old scrolls, the ring, the leaves' rails, the trees outside the piers and the avenue beyond. Each cap drops two or three pieces
    // of itself over two seconds of flight (a ragged row hanging under every bar); pieces from high up are heavy and fall faster, so
    // the air is clear again before the ring. Own rng (zr).
    if (rare) { const TO = 372 + LEN - 521, lump = (p, size, n = 2) => { for (let j = 0; j < n; j++) clumps.push({ p: P3(p.x + zr.range(-1.2, 1.2), p.y + 0.4, p.z + zr.range(-1.2, 1.2)), t: (TO - 12 + zr.range(0, 26)) / 10,
          size: size * zr.range(0.7, 1.15) * (j ? 0.75 : 1), seed: zr(), rho: 0, sp: clamp(p.y / 38, 1, 2.5) * zr.range(0.9, 1.1) }); };
      const nd = detail < 0.8 ? 1 : 2;
      for (const [p, size] of shv) lump(p, size, nd + 1);
      for (const sg of [-1, 1]) {
        for (let j = 0; j < 6; j++) lump(P3(GX - 1 + zr.range(-2, 2), 97.5, AXZ + sg * (49 + zr.range(-3, 3))), 1.9, nd);                // the pier heads
        for (let j = 0; j < 4; j++) lump(P3(GX + zr.range(-4, 4), 104 + zr.range(0, 3), AXZ + sg * (49 + zr.range(-4, 4))), 1.3, nd);   // their old scrolls
        for (let j = 0; j < 3; j++) lump(P3(GX - 3, 111 + zr.range(-1, 1), AXZ + sg * zr.range(1, 7)), 1.3, nd);                        // the ring's cap
        for (const y of [4.6, 28, 34.5, 76.5]) for (let j = 0; j < 9; j++) lump(P3(GX - 2.2, y, AXZ + sg * (4 + (j + zr()) * 4.4)), y > 70 ? 1.5 : 1.25, nd);   // the leaves' rails
        for (let j = 0; j < 5; j++) lump(P3(350 + zr.range(-5, 5), 15 + zr.range(-2, 5), AXZ + sg * (80 + zr.range(-5, 5))), 1.8, nd);     // the tree outside the pier
        for (let j = 0; j < 4; j++) lump(P3(400 + zr.range(-2, 2), 27 + zr.range(-3, 3), AXZ + sg * (43.5 + zr.range(-5, 5))), 2.1, nd);   // the first standard of the avenue
        for (let j = 0; j < 8; j++) lump(P3(374 + j * 14, 5.5 + hillH(374 + j * 14, AXZ), AXZ + sg * 22), 1.6, 1);                       // its railing runs
      }
    }
    // ---- (hand round after the eighth version) THE LONG RAILINGS' CROZIERS: the entry walk's law at the long railings' own distance
    //      and weight. A crozier winds up over each post that stands on the two long railings' straight lines (39 posts), as over
    //      the walk's posts, in a plane across the railing, curling outward of the garden. The walk's croziers stand 9.25 m off the
    //      walk's centre line and are born 28 m of flight before the lens is abreast and wound over 22 m; the long railings stand
    //      30 m off the axis, so theirs are born and wound 30 / 9.25 times as far ahead (KD), counted from the route's sample
    //      nearest the axis point abreast of the post. And none is begun before the run's cresting that is pushed over its post
    //      is shut: that cresting is rooted half a bay before the post, ordered by axisOrder within 1 m and wound over 24 m; a
    //      metre more. So no cresting bar passes through a crozier, and the posts the run reaches before the lens is 91 m short
    //      of them (to about x 125, a post more on some seeds) throw up their croziers behind the run, in one burst. The first
    //      post of each railing has no cresting before it; the same arc is used there, so its crozier rises with that burst.
    //      The bar is the cresting's (half-thickness 0.3 m against the walk croziers' 0.2: KS) and the figure the walk's enlarged
    //      (lengths times KS, curvature over KS); plume and lump of snow are the walk's own. None where the foot of a standing
    //      thing (a solid of 0.4 m or more, the edging's own bound) lies in a box round what the growing crozier sweeps: 8 m
    //      outward of the railing's line (the sweep is 6.56 m at the most), 1.3 m inward (the collar's 0.29 m), 1.9 m either
    //      side of its plane (the sweep's 0.69 m), each widened by the solid's radius: the first arch's plinths and the heralds
    //      (four posts). The box tests feet: the beds' flowers, whose feet stand further in, are not seen by it. A bare post
    //      draws no dice. Own dice (pr), drawn in forgeX's order; the block stands after the last push to live's lists and
    //      solids, so every live scroll, plume and lump keeps its place in its list.
    { const pr = makeRng('gates-in-the-snow:posts:' + ctx.seed), KD = 30 / 9.25, KS = 1.5;
      for (const [xa, xb, zq, sg] of [[62, 250, 206, 1], [52, 250, 146, -1]]) { const nb = Math.max(1, Math.round((xb - xa) / 10.5)), bay = (xb - xa) / nb;
        for (let i = 0; i <= nb; i++) { const x = xa + bay * i;
          if (solids.some(([ox, oz, or]) => or >= 0.4 && Math.abs(ox - x) < or + 1.9 && (oz - zq) * sg > -(or + 1.3) && (oz - zq) * sg < or + 8)) continue;
          const root = P3(x, 4.1, zq + sg * 0.25), dir = P3(0, 0.995, sg * 0.1).normalize(), side = P3(0, 0, -sg); side.addScaledVector(dir, -side.dot(dir)).normalize();
          const Sp = scrollSpec(pr.range(3, 3.6) * KS, 0.2 * KS, pr.range(0.18, 0.24), pr.range(2.1, 2.9) * KS, -pr.range(0.06, 0.1) / KS, 1), dur = 22 * KD;
          const order = Math.max(sOf(x, AXZ) - 28 * KD + pr.range(-1.5, 1.5) * KD, axisOrder(P3(x - bay / 2 + 0.2, 0, zq)) + 1 + 24 + 1), plume = pr.range(6, 10), lump = pr.range(0.4, 0.6);
          forged.axis.push({ m: frameM(root, dir, side, pr.range(-0.08, 0.08)), S: Sp, order, dur, seed: pr() });
          steam.push({ p: root.clone(), order: order + dur * 0.2, dur: Math.max(dur * 0.45, 5), seed: pr(), h: plume });
          clumps.push({ p: P3(root.x, root.y + 0.5, root.z), t: (order + dur * 0.15) / 10 + pr.range(0, 0.25), size: lump, seed: pr(), rho: 0 });
        } }
      await ctx.yield(); }
    const clumpMat = style.clumpMaterial({ openA: 0, openT: 8, fall: 9, floor: 0, stretch: 0.7 });   // near the lens a clump is a lump, not a streak
    await ctx.yield();
    if (clumps.length) scene.add(style.clumpMesh(clumps, clumpMat));
    await ctx.yield();

    // ---- flakes, and the meshes of everything gathered above -------------------------------------------------------------------
    const flakes = weather === 'clear' ? null : style.flakes(Math.round((weather === 'heavy' ? 21000 : 17800) * detail), 90);
    if (flakes) { flakes.renderOrder = 3; scene.add(flakes); }
    await ctx.yield();
    const shedMat = style.snowMaterial(), shedFastMat = style.snowMaterial();
    for (const k of Object.keys(secs)) {
      const s = secs[k]; if (!s.I.nv) continue;
      const mi = style.mesh(s.I, style.iron); await ctx.yield();
      const ms = style.mesh(s.S, s.shed === 'fast' ? shedFastMat : s.shed ? shedMat : style.snow);
      mi.frustumCulled = ms.frustumCulled = true; mi.geometry.boundingSphere.radius += 6; ms.geometry.boundingSphere.radius += 6;
      scene.add(mi, ms); await ctx.yield();
    }
    const scrollMat = style.scrollMaterial({ heat: 1.8 * Math.min(heatK, 1.4), heatMin: 0.72, halo: 3.6 * heatK, haloMax: 0.016, ember: 0.3, cool: 46 }), haloMat = style.haloMaterial(scrollMat), steamMat = style.steamMaterial(scrollMat);
    const spillMat = style.spillMaterial(scrollMat, 3); spillMat.uniforms.uLinger.value = 0;   // THE SPILL RULE: 3 m wide, under the winding bend, gone as the bend cools
    const scrollMatBig = style.scrollMaterial({ heat: 1.6, heatMin: 0.45, halo: 1.7 * Math.sqrt(heatK), haloMax: 0.016 }), haloMatBig = style.haloMaterial(scrollMatBig);   // the crowns never come inside the clear ring, so their bends glow along a metre and a half of bar (straw, orange, cherry) and still keep under two percent of the frame at night
    const scrollMatP = style.scrollMaterial({ heat: 0.8 * Math.min(heatK, 1.3), halo: 2.6 * heatK, haloMax: 0.012, ember: 0.3, cool: 30 }), haloMatP = style.haloMaterial(scrollMatP);   // the pergola's brackets pass close overhead: the heat is at the bend, never a strap
    for (const k of Object.keys(forged)) {
      const list = forged[k]; if (!list.length) continue;
      const sm = style.scrollMesh(list, k === 'crown' ? scrollMatBig : k === 'perg' ? scrollMatP : scrollMat, k !== 'crown' && k !== 'herald'), hm = style.haloMesh(sm, k === 'crown' ? haloMatBig : k === 'perg' ? haloMatP : haloMat), box = new THREE.Box3(), v = new V3();
      for (const s of list) box.expandByPoint(v.setFromMatrixPosition(s.m));
      const sph = box.getBoundingSphere(new THREE.Sphere()); sph.radius += 16;
      sm.boundingSphere = sph; hm.boundingSphere = sph; sm.frustumCulled = hm.frustumCulled = true; scene.add(sm, hm);
      if (k === 'walk' || k === 'turn' || k === 'axis') { const sp = style.spillMesh(sm, spillMat); sp.boundingSphere = sph; sp.frustumCulled = true; scene.add(sp); }
      await ctx.yield();
    }
    if (steam.length) scene.add(style.steamMesh(steam, steamMat));
    const steamMatF = style.steamMaterial(scrollMat, 1.9), pierSteam = [];
    if (steamF.length) scene.add(style.steamMesh(steamF, steamMatF));
    // ---- the fire that is not a scroll: the runs along the railings, up the standards and the piers; the still hot pieces; their pools
    for (const sg of [-1, 1]) helix(GX, AXZ + sg * 49, 1, 97, 3.15, 255, sg);
    const hotG = new Batch();
    for (const sg of [-1, 1]) { const pts = []; for (let i = 0; i <= 44; i++) { const t = i / 44, a = 2 - sg * t * 11.7; pts.push(P3(GX + Math.cos(a) * 3.3, 1 + t * 96, AXZ + sg * 49 + Math.sin(a) * 3.3)); }   // a second fire up each pier, against the twist, while the leaves swing
      bar(hotG, pts, { r: 0.42, sides: 6, capA: false, capB: false, s0: 352 / 0.9 }); pierSteam.push({ p: P3(GX + 5, 99, AXZ + sg * 49), order: 418, dur: 44, seed: hr(), h: 30 }); }   // no pool lies at the piers' feet: a spill lies only under a tip glowing above it, 3 m wide
    const hotMatG = style.hotMaterial({ at: 0, rate: 0.9, len: 34 }); scene.add(style.mesh(hotG, hotMatG));
    const hotH = new Batch(), hotMatH = style.hotMaterial({ at: 0, rate: 1.04, len: 26 });      // the fire up the heralds: three turns of a helix, at the foot when the lens is 78 m short of them (HS), at the head 40 m of flight later
    for (const pts of heraldFire) bar(hotH, pts, { r: 0.18, sides: 6, capA: false, capB: false, s0: (HS - 78) / 1.04 });
    scene.add(style.mesh(hotH, hotMatH)); scene.add(style.steamMesh(pierSteam, steamMatF));
    const hotMatW = style.hotMaterial({ at: -RAIL_AT, rate: 1, len: 8.5 }), hotMatX = style.hotMaterial({ at: 0, rate: AXR, len: 6 }), hotMatS = style.hotMaterial({ len: -1.9 }), hotMatE = style.hotMaterial({ at: 0, rate: 0.84, len: 48 });
    for (const [B, mat] of [[hotW, hotMatW], [hotX, hotMatX], [hotS, hotMatS], [hotE, hotMatE]]) if (B.nv) { scene.add(style.mesh(B, mat)); await ctx.yield(); }
    { const n = pools.length, g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), a = new Float32Array(n * 4), b = new Float32Array(n);
      pools.forEach((p, i) => { a.set([p[0], p[1], p[2], p[3]], i * 4); b[i] = p[4]; });
      g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(b, 1)); g.instanceCount = n;
      const poolMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uWarm: groundMat.uniforms.uWarm }, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`attribute vec4 aP; attribute float aK; uniform float uTime; varying vec3 vQ; varying float vD;
          void main(){ vec3 w = vec3(aP.x + position.x * aP.z * 2., .06, aP.y + position.z * aP.z * 2.);
            vQ = vec3(position.xz * 2., aK * (.86 + .14 * sin(uTime * .9 + aP.w * 40.))); vD = distance(cameraPosition, w); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
        fragmentShader: /* glsl */`varying vec3 vQ; varying float vD; uniform float uWarm; uniform vec3 uOrange, uStraw;
          void main(){ float r = length(vQ.xy) * (1. + .06 * sin(atan(vQ.y, abs(vQ.x) + 1e-4) * 5.));
            float a = (1. - smoothstep(.04, .98, r)) * vQ.z * uWarm * exp(-vD / 700.) * 1.25;
            if (a < .015) discard;
            gl_FragColor = vec4(mix(uOrange, uStraw, smoothstep(.45, .9, a)), min(a, .9)); }`,
      });
      const m = new THREE.Mesh(g, poolMat); m.frustumCulled = false; m.renderOrder = 0; scene.add(m); }
    await ctx.yield();

    // ---- the timetable, in metres of the lens's arc (the brief's seconds at its speeds) ----------------------------------------
    const DS = LEN - 521;                                        // what happens on the climb keeps its place before the ring whatever the route's length
    const T = { reveal: 160, piers: 255, crown: 372 + DS, open: 372 + DS, ring: 438 + DS, ringEnd: 505 + DS };   // the crown is still closing on the ring at the foot of the climb; the leaves start as it shuts
    const openAt = (S) => Math.max(-1, (S - T.open) / 64 + 0.8 * Math.max(0, S - T.open - 58) / 64);   // how far the leaves stand open at arc S: 0 as they start, 1 as they stand open
    const _p = new V3(), _q = new V3(), _poi = new V3(), _poi2 = new V3(), _poi3 = new V3(), fogAxis = weather === 'heavy' ? 800 : 2200;
    const drive = (S, time) => {
      scrollMat.uniforms.uRun.value = S + 5 * (1 - Math.exp(-time / 7)) * (1 - smoothstep(0, 14, S)); scrollMatBig.uniforms.uRun.value = S; scrollMatP.uniforms.uRun.value = scrollMat.uniforms.uRun.value;
      U.uFog.value = lerp(fog, fogAxis, Math.pow(smoothstep(weather === 'heavy' ? 185 : 158, weather === 'heavy' ? 320 : 262, S), weather === 'heavy' ? 1.25 : 1));   // the Gates darken from grey to black as they grow
      // ROUND TEN: the crown is half made as the lens goes under the first arch (the last third of it is forged in a rush, many tips at once)
      // and stands complete and black as the leaves begin to move
      hero.setForge(S < T.piers ? 0.4 * smoothstep(T.reveal - 40, T.piers, S) : S < 316 ? lerp(0.4, 0.58, (S - T.piers) / (316 - T.piers)) : 0.58 + 0.42 * clamp((S - 316) / (T.crown + 4 - 316), 0, 1));
      // ROUND NINE: the leaves swing over 80 m of the climb: their veils fall as they swing;
      // once they are open the fall's clock runs on a little faster, so the last puffs are gone before the ring
      hero.setOpen(openAt(S));
      hero.setRing(clamp((S - T.ring) / (T.ringEnd - T.ring), 0, 1)); hero.object.visible = S > 119; zMeshes.forEach((m, i) => { m.visible = S > (i ? 162 : 136); }); fogZ.value = lerp(1, FOGZ, smoothstep(162, 200, S));   // the avenue beyond comes out of the pearl as the Gates are revealed (held back before, like the Gates)
      const a = hoopArc(S); routeAt(a, _p); routeAt(a + 0.6, _q); _q.sub(_p);
      const hy = hillH(_p.x, _p.z); hoop.position.set(_p.x, 1.62 + hy, _p.z); hoop.rotation.y = Math.atan2(-_q.z, _q.x);
      hoopLean.rotation.x = 0.07 * Math.sin(time * 1.3) + 0.03 * Math.sin(time * 3.1); hoopLean.rotation.y = 0.3 * Math.sin(time * 0.8 + 1) + 0.12 * Math.sin(time * 1.9);
      hoopRoll.rotation.z = -a / 1.5;
      { const l = Math.hypot(_q.x, _q.z) || 1; hoopSteam.position.set(_p.x - _q.z / l * 0.75, hy, _p.z + _q.x / l * 0.75); hoopSteamFar.position.copy(hoopSteam.position); hoopSteamFar.visible = _p.x > GX + 6; }   // its thread of steam stands beside the track, clear of the ring
      trackMat.uniforms.uHoop.value = a; groundMat.uniforms.uRun.value = hotMatW.uniforms.uHot.value.x = scrollMat.uniforms.uRun.value; hotMatX.uniforms.uHot.value.x = hotMatG.uniforms.uHot.value.x = hotMatH.uniforms.uHot.value.x = S; groundMat.uniforms.uHoopP.value.set(_p.x, _p.z, 0);   // the hoop is warm, not glowing: it lays no light on the snow
      shedMat.uniforms.uShed.value = S / SHED; shedFastMat.uniforms.uShed.value = (scrollMat.uniforms.uRun.value + 100) / SHEDF; hotMatE.uniforms.uHot.value.x = groundMat.uniforms.uXf.value = XF0 + (S - XFS) * XFR; clumpMat.uniforms.uClock.value = S / 10; setLeaves(S);
      U.uShiver.value = rare ? smoothstep(T.open - 12, T.open + 12, S) : 0;
    };
    drive(0, 0);
    const SP = [10, 10, 9.3, 15, 14], SU = [0, 80 / LEN, 135 / LEN, 191 / LEN, 318 / LEN];
    const pace = (u) => { let v = SP[0]; for (let i = 1; i < 5; i++) v = lerp(v, SP[i], smoothstep(SU[i] - 0.03, SU[i] + 0.03, u)); return lerp(v, 12.4, smoothstep(0.86, 0.9, u)) / 12.4; };
    const gatesW = hero.object.localToWorld(hero.center.clone()); const RAMP = 22;   // gatesW: the Gates' own centre, on the axis at half their height. RAMP: the metres a look by places takes to come in and to let go, the length the gaze already rests ahead on the course
    return {
      scene, path, duration: 42, pace, title: 'The Gates in the Snow',
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 22, sway: 0.5, bank: 0.2 },   // the horizon stays level through the turn: the reveal is a composed picture
      pois: [{ at: (time, u) => { path.pointAt(Math.min(1, u + 17 / LEN), _poi2); return _poi2.set(-9.6, 3.4, _poi2.z); }, from: 20 / LEN, to: 62 / LEN, weight: 0.9, fade: 0.3 },   // ROUND ELEVEN: the lens turns onto the near railing, 17 m ahead: the bay being forged is the picture (scrolls at three stages, the hot rail, a plume), the pergola in the far third
        { at: (time, u) => path.pointAt(Math.min(1, u + 24 / LEN), _poi).setY(15), from: 60 / LEN, to: 124 / LEN, weight: 0.42 },   // look up into the vault
        { at: [BSX + 1, 10, BSZ - 1], from: 110 / LEN, to: 154 / LEN, weight: 0.6, fade: 0.3 },   // leaving the pergola the gaze goes to the bandstand: its columns, rail and capped ribs are the picture at the turn
        { at: [GX, 52, AXZ], from: 138 / LEN, to: 246 / LEN, weight: 0.8, fade: 0.22 },     // the reveal: the gaze goes to the Gates past the bandstand's columns while the lens is still turning
        { at: [285, 22, AXZ + 98], from: 246 / LEN, to: 300 / LEN, weight: 0.62, fade: 0.35 },   // out over the bed the gaze turns outward: the Gates three-quarter on to the left, a flower head close on the right
        { at: [GX, 135, AXZ], from: 284 / LEN, to: 340 / LEN, weight: 0.6, fade: 0.3 },     // and up (ROUND ELEVEN: 14 m sooner, so the Gates are whole in frame as the lens comes back to the axis), under the first arch: its closing crown across the top, the ring beneath it
        { at: gatesW, from: sOf(ARCH1, AXZ) / LEN, to: (T.open + RAMP) / LEN, weight: 0.7, fade: RAMP / (T.open + RAMP - sOf(ARCH1, AXZ)) },   // a look by places: from the first arch's own plane until RAMP metres after the leaves begin to part, the gaze rests on the Gates' own centre; its ramps lie inside that stretch, RAMP metres each
        { at: (time, u) => _poi3.set(GX, 50 - 20 * smoothstep(0.74, 0.785, u) * (1 - smoothstep(0.795, 0.835, u)), AXZ), from: 0.722, to: 0.855, weight: 0.55, fade: 0.22 },   // ROUND NINE: as the leaves swing the gaze dips to their feet (the veils whole in frame, the arch's curls out of the top edge), then lifts again                  // on the climb, look down into the parting leaves: the crown and pier heads fill the top
        { at: [GX, 74, AXZ], from: 0.835, to: 0.915, weight: 0.5, fade: 0.3 }],                   // clear of the last arch the gaze rests on the top rails and the crown, so the Gates fill the frame                   // on the climb, look down into the parting leaves: the crown and pier heads fill the top
      portal: { shape: 'circle', radius: 7, color: '#FFE08A', glow: 0.45, revealDistance: 240, tilt: true },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        style.update(dt, time, camera);
        hero.update(dt, time, camera);
        drive(clamp(u || 0, 0, 1) * LEN, time);
      },
      dispose() { hero.dispose(); },
    };
  },
};
