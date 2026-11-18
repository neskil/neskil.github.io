// THE FIVE SISTERS (waterspout-sisters): a biplane slalom between five sunlit waterspouts, then a climbing helix
// round the greatest of them to a door in its collar of cloud. Hero set piece: ../parts/waterspout-sisters.js.
//
// MAP OF THIS FILE (in order)
//   1. HOURS, WEATHERS   the seeded looks: sky options, fog, sea colours, exposure, bloom and grade per hour
//                        (afternoon, noon, lastlight, night) and per weather (fair, squall, calm).
//   2. GLSL              NOISE, FOGP, EDGE (the cloud's footprint, shared by sea shadow, ceiling and rain), LIP (the
//                        sheet's torn lip: `lipE`, used by the ceiling and to keep rain under cloud), then one
//                        shader pair per layer: DRESS (sea dressing; at last light also the sky's apricot lying on the swell as thin wavering threads of light (`threadsOf`, `thrN`, `kL`: single lines along the crests that cannot close into loops),
//                        a soft apricot-bronze wash on faces turned from the sun, rose reflections under the tubes and, from the helix, the whole body of the sea (LAST LIGHT: jade, a bronze mirror toward the horizon, slicks, feathered wind-streaked cat's-paws, the same threads at 17 and 6.5 m); by night the whole moonlit swell: its
//                        NIGHT block; its shadow edge is the lip's, with a wandering penumbra; low across the water the
//                        sea takes the far sky: uFarCol; from the helix whitecaps in wind rows, swell shading, sun
//                        sparks: see FROM THE HELIX), CEIL (cloud base: a marched height field of pouches and creases
//                        near the eye, painted billows beyond 1.1-2.6 km, and where the deck is seen at under ten degrees (`finK`) three or four broad shaded lobes with one lit edge (`ceilFar`); edges that melt into haze (uHaze); its lip is
//                        eaten into puffs; `farP`, the deeper far-field march tried for the helix, is switched off: seen
//                        at 10-15 degrees its pouches were a strip of scales),
//                        SHAFT (rain curtains: 4 or 5 of unequal breadth and darkness hung from the base, each a soft
//                        veil densest under the cloud and in its own heart, thinning as it falls to a feathered, uneven
//                        lower edge above the sea (the broad one behind the sisters, vBroad, keeps six tenths of its
//                        density to a shallow feather just above the horizon: the tubes are ivory on slate to their feet; it is known by its breadth, over 2.3 km),
//                        every narrower one a third heart and the rest FEATHERED FLANKS 200-400 m deep that the sky shows through (`rimN`, `pN`: a bell at
//                        their breadth ended in a ruled vertical edge, a pane, seen from the top of the helix), with faint slanted fall streaks inside it; no outline; fades inside
//                        150-420 m and when seen along its own plane; the far ones sink into the haze; drawn AFTER the
//                        ceiling so the far deck is behind them),
//                        SCUD (billowed cloud cards: lip, collars, hanging under-base rags, far-lip fringe, grotto; the
//                        bay's sun bar: uBar), HALO (the lantern), BIRD (mode 3: escorts along the last turn of the helix; the outer two stay with us up the last straight), FISH + STREAK, SHIP (sails: weathered tan-bark, lit through; rigging ribbons: tan, lit
//                        whatever way they face, half a pixel and faded far off), WAKE (the V astern: two thin crests that
//                        break into dashes, a marbled track; drawn double-sided: the strip faces down), SPRAY (sprites
//                        off the stem, keyed to her pitch, scaled to the vessel).
//   3. builders          birdGeometry, fishGeometry, buildVessel (hull, spars, sails, rigging ribbons).
//   4. build(ctx)        A looks (rng forks: hour, weather, cast, mirror)   B sky, light rig, fog
//                        C hero placement (object at (0,0,-930), mirror via opts)   D path, the places it passes (the
//                        cloud's shadow line, each sister abeam, the vessel's line, the helix's first and last metre,
//                        the lens due north and due south of S5, where the lantern clears S5's funnel), the bank's
//                        steps, pois, `pace`: in route metres between those places, but for the look at S4, which
//                        is the site's own entry in typed shares of the brief's route
//                        E sea: the patch reef (own stream), kit ocean + dressing quad, the night horizon's haze band
//                        F cloud ceiling, rain curtains (`CURT`: bearing, distance,
//                        breadth, darkness of each; the last, north-east, is what the top of the helix sees left of the lantern), scud (`scud`, `lip-fringe`:
//                        lit cards placed on the far lip by a JS copy of `lipE`), grotto + lantern, far towers
//                        G cast: vessel + wake + bow spray, the run-in file of three skiffs (own stream `run-in-lugger`:
//                        each one's start place, course and phases dealt on every seed by the rule of the file), a
//                        lugger at anchor over the patch reef (placed by the reef's stream `patch-reef`, head to wind),
//                        frigatebirds / boobies / terns (helix encounters, the stack, plunge-divers on a 9 s clock, five
//                        escorts, birds of that stack's inner band, that take station ahead of us where the lens first
//                        stands due south of S5 and fly the helix on the band's outer edge, at the track's own height:
//                        three peel away where the lantern clears the funnel, two stay wide of the door up the last
//                        straight until the group is 250 m from the portal), flying fish
//                        H weather fx: near rain and spray, rainbow (rare), lightning (night)
//                        I post + return; update(); dispose().
// PATH       the brief's slalom with a 100 m run-in: (0,12,100) level to the shadow line, west of S1, east of S2, west
//            of S3 (close pass, 40 m from the wall), north past S4, 1.25 right-hand turns round S5 climbing to 285 m,
//            then a 470 m straight east (mirrored: west) up 30 degrees into the portal's grotto at (477,520,-1235).
//            The route is about 2,515 m; BRIEF_PL (2,271 m) is the brief's own route: `B(ub)` converts the brief's
//            progress to this path's u, `U(u0)` a u on the brief's route, `TB(u)` gives brief seconds.
// POIS       Every pull stands alone by its own weight (none over 1, no two on one thing, nothing scaled for the steady
//            camera, no table, no governor); how fast the gaze goes from one to the next is the breadth of their fades.
//            ON THE SLALOM each window runs between two places of the route: S1 (front-lit, her foot to the right, the
//            open sky and the sunlit cumulus to the left) from the cloud's shadow line to S1 abeam, the vessel from S1
//            abeam to the line she sails along, S2 from S1 abeam to S2 abeam, the big sister's wall from 20 m past S2
//            abeam to S3 abeam, the dying S4 by the site's own entry (typed shares of the brief's route); then ON THE
//            HELIX ONE PULL on S5's own axis (weight 0.58: the gaze sits some 57 degrees inside the route's heading,
//            S5's wall some 45 to 100 m off on the inside of the turn all the way round: the track turns 100 to 85 m
//            from her axis and her bend wanders; the other sisters, the reef and the newborn wheel across as the route
//            turns). It comes on where
//            her axis bears 30 degrees off the route's heading on the run north (`s5From`, S5_OFF), rises over 150 m of
//            route (S5_EASE: all before the helix's first metre) and falls over the last 150 m before the helix's last
//            metre (`helixE`). DEPARTURE FROM THE BRIEF: the point of her axis it pulls to is not at the lens's height
//            but below the track by a quarter of the track's height above the sea (S5_DROP: 7.5 m under it at the
//            helix's first metre, 71 m under it at the last), so that as we climb the gaze comes down her outside to
//            the sea.
//            FROM WHERE THE LANTERN CLEARS HER FUNNEL'S EDGE (`clearD`: found on the route, eyes every 2.5 m, by
//            testing the line from the lens to the portal's seat against her wall plus her bend's wander) one pull on
//            the portal's seat (0.9) rises as hers falls.
//            `pace` (D), between places of the route: 0.8 of the average speed from S1 abeam to S2 abeam (while the
//            vessel and S2 are in the look), a 1.15 window from S4 abeam to the helix's first metre, 0.91 x 0.94 from
//            there to where the lantern clears the funnel, 1.08 from the helix's last metre to the door; each eased in
//            over the 100 m before its first place and out over the 100 m after its second. The 1.15 is never held: the
//            helix's ease-in lies over its stretch, so the lens peaks at 1.14 at S4 abeam and is already easing by the
//            helix's first metre (0.98 there). `duration` is the route's length at the brief's 50 m/s, to the whole
//            second. The pois' FIRST entry only hands u to the bank (weight 0.004, pointing where the camera
//            already looks), and camera.bank is an object whose valueOf() returns bankAt(u): 2 on the slalom, 1.15
//            from the helix's first metre, 0.95 from where the lens first stands due north of S5, 0.25 from where the
//            lantern clears the funnel, each step eased over the 150 m before its place (see the comment in D). If the
//            engine ever stops multiplying by camera.bank, replace it with a plain number.
// EXIT       The hero part lowers the cloud base round the seat into a BAY (mesh 'portal-bay': ring wall, roof, mouth
//            toward the approach, two shelves trailing back either side of the line; hero.bayHeight, hero.bayBar).
//            Section F lines it: `grotto` (about 165 billowed cards in shells round the last straight, sorted far to
//            near), `grotto-rags` (56 hanging cards round the seat, hung from the bay's wall, + 34 long flat ones under
//            the two shelves on the approach side, all 25 m or more above the line of approach), `grotto-tags` racing
//            over its mouth, `lantern` (additive glow in the portal's plane). A warm bar of sun lies across the mouth
//            (uBar/uBarK in SCUD and in the part's collar shader). Beyond 250 m the cards sink into the base's own
//            tone (uFarMix), so from the entry they are a lowered bay, not a dark head. Portal radius 10.
// FROM THE HELIX  (the sea looked down on from 100-450 m) The kit ocean's radius is 6,800 m (its default 3,600 m rim shows
//            from altitude as a bowed pale limb), and the sky dome's below-horizon colour is the sea's own far colour, so the
//            sea runs out to a level horizon lost in haze. In DRESS `hiK` (0 below 45 m, 1 from 150 m) swaps what the
//            slalom needs (20 m foam streaks, lanes, windrows, the sisters' smears, night crests: all ruled lines or a rash
//            from above) for WHITECAPS IN WIND ROWS: crests of three real sizes (`wcap`: each a ragged white lip lying
//            across the wind with a short torn lace of foam behind it, never a pale oval), gathered into rows 50 m apart
//            and gust patches with calm dark lanes between, the biggest breaking inside a spout's stain (by night only
//            the small ones: blue-green sparks in rows; outside a gust patch almost none break), small and sparse far
//            off (beyond a kilometre, specks sized to the pixel, in the same rows); looked down on from 100 m and more
//            the gust patches lie in GUST FIELDS 600-1,200 m across with calm water of the sea's own colour between
//            (`field`); the swell shades the water (dark
//            troughs, faces in the sea's own lit colour, uSeaLit); a sun patch is brighter, more saturated water with
//            sparks of glitter in it (never a pale veil; by night a faint sheen); the swell's lines bend and fork; a
//            PATCH REEF lies west to north-west of S5, its centre 330-470 m from her foot (uReef, dealt per seed; pale shallows and
//            coral heads, a lugger at anchor over them: the middle distance of the helix's view). AT LAST LIGHT the dressing paints the body of the sea up there (and
//            beyond a kilometre from any height): glass, jade under the eye and mirroring the apricot horizon as the
//            eye's line flattens (a bronze mirror toward the horizon, with pale slicks 300-800 m across), gold toward the
//            sun, with dark jade cat's-paws (LAST LIGHT in DRESS_FRAG; H.sea.jade,
//            mirror, gold); low over the water the swell's faces carry the same sky as thin wavering threads
//            (`thrN`). update() eases the kit's own foam to a quarter up there; by night the kit sea's far
//            colour and the dome below the horizon are the far sea's own moon haze (`farLow`: no navy stripe), and the
//            dome below the horizon takes it too.
//            The hero's stains darken and their arms run on as curved streaks when looked down on; its vapour rags
//            close to the eye, and a soaring bird far below it, fold away (both were milky smudges on the sea).
//            Looking east from the top of the helix a bank of sunlit cumulus stands on the horizon beyond
//            the deck's far lip (`bank` in F) and rain hangs from the dark cloud to the north.
//            THE RUN-IN'S GOLD WINDROW is broken into rafts with open water between and is parted where each skiff of
//            the run-in file has sailed through it (uLug[3]: each one's place and heading).
// MOODS      `hourName`, `weatherName`, `castVessel`, `castBird`, `MX` (mirror, +1 or -1) are chosen in A; ctx.vary.mood
//            (0..1) sets how many whitecaps show from the helix and how deep the deck's pouches are. A rare visit
//            (sun shower, double rainbow) forces a low sun unless the viewer asked for day or night: then no rainbow.
// EXPOSURE   fog colour and density: H.fog; exposure, bloom and grade: H.post (per hour, squall desaturates).
// NIGHT SKY  the tone map sends a saturated dark blue to pure blue (red 0): the night sky's horizon, the fog and the
//            rain are slate-indigo (blue-GREYS) so that red and green survive under the cloud; rain is darker than the sky.
//            The far towers and the bank are relit by night (their kit colours pulled to slate, in G after `bank`): pale,
//            they were cotton wool on the horizon. The kit's Milky Way is at a tenth (milkyWay 0.1): its core, low in the
//            south-west and cut off by the deck's lip, read from the last straight as two pale beige domes on the
//            horizon (at three tenths still; whole, a beige patch of sky).
// NIGHT SEA  the grade's contrast takes about 0.02 off every channel, so a linear colour under about 0.03 shows as black
//            or pure blue: the night sea's body (HOURS.night.sea ink, night, silver, nightHor) is a blue-GREY in linear
//            terms and reads navy on screen. Measure the picture before changing those numbers.
// SCRIPTED   every staged moment is keyed to u in update(): hero.setProgress(u) (S4's death, the newborn),
//            dress.uGustZ (gust front), bird/fish uTb (brief seconds = encounters and volleys), the vessel's and the run-in skiffs' positions, the escorts,
//            fxRain opacity (rain and spray at each pass), rig sun dimming under the cloud. Ambient loops use time.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/waterspout-sisters.js';

const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ORIGIN_Z = -930, CEIL_Y = 620, RUN_IN = 100, BRIEF_SEC = 44;
const BRIEF_PL = 2270.9;   // length of the brief's own route (run-in + 2,171 m): scripted moments and gaze keys are laid out on it
const HELIX_TOP = 285, EXIT_LEN = 470, EXIT_PITCH = Math.PI / 6, PORTAL_R = 10;   // the last straight: 470 m up 30 degrees into the grotto
const LIP_Z = -60;   // the cloud's southern lip and its shadow line: 160 m into the flight, so the dark sea shows through the previous portal

// ---------------------------------------------------------------- 1. the seeded looks
// pal: the hero's palette in the brief's order (turquoise, cobalt, jade-ink, ivory, indigo, slate, accent)
const HOURS = {
  afternoon: {
    hero: 'afternoon', elev: 22, pal: ['#19C2B8', '#0B4F9E', '#0E3B3C', '#F3E8CF', '#2B3157', '#66728C', '#D2542E'],
    sky: { preset: 'day', zenith: '#2a66b8', mid: '#74a6d2', horizon: '#a3bccc', ground: '#3f6078', horizonPow: 3.2, scatterColor: '#ffe2a8', scatter: 0.4, scatterPow: 5,
      sunColor: '#FFE2A8', sunSize: 1.6, sunIntensity: 6, sunGlow: 0.3, lightColor: '#fff0d4', lightIntensity: 2.7, ambientColor: '#9bb6e0', groundLight: '#3f8f8a', ambientIntensity: 1.4 },
    fog: ['#8FA6B8', 0.00035], key: ['#F3E8CF', 0.86], shade: ['#3A4A7A', 1.0], lip: ['#F3E8CF', 0.8], rain: '#262d42', sarg: '#b08a34',
    sea: { deep: '#0B4F9E', shallow: '#19C2B8', scatter: '#38c9b4', ink: '#12504e', inkA: 0.8, hard: 5, sand: '#a8ecd2', glit: 1, far: ['#86a3be', 0.3] },
    post: { exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1.1, contrast: 1.06, tint: '#fffaf0', shadowTint: '#060a1c', vignette: 0.3, grain: 0.02 } },
  },
  noon: {
    hero: 'noon', elev: 60, heroShadow: ['#7f93b8', 1.1], pal: ['#12d6c6', '#0a58b8', '#0b3a40', '#fbf7ee', '#2c3a66', '#6a7a98', '#D2542E'],
    sky: { preset: 'day', zenith: '#1c63cf', mid: '#57a0e4', horizon: '#b4d2e2', ground: '#3f6a88', horizonPow: 3.6, scatterColor: '#ffffff', scatter: 0.2, scatterPow: 6,
      sunColor: '#fff8e8', sunSize: 1.4, sunIntensity: 8, sunGlow: 0.3, lightColor: '#ffffff', lightIntensity: 3.1, ambientColor: '#9cc0f0', groundLight: '#3aa8a0', ambientIntensity: 1.5 },
    fog: ['#9cbdd2', 0.0003], key: ['#fffaf0', 0.9], shade: ['#4d6fb0', 1.0], lip: ['#ffffff', 0.85], rain: '#283248', sarg: '#c0963a',
    sea: { deep: '#0a58b8', shallow: '#12d6c6', scatter: '#3fe0cc', ink: '#0a3238', inkA: 0.78, hard: 1.5, sand: '#b6f4dc', glit: 1.3, far: ['#93b6d6', 0.27] },
    post: { exposure: 0.96, bloom: { strength: 0.28, radius: 0.55, threshold: 1.0 }, grade: { saturation: 1.03, contrast: 1.07, tint: '#fffdf6', shadowTint: '#040c1c', vignette: 0.28, grain: 0.02 } },
  },
  lastlight: {
    hero: 'lastlight', elev: 7, heroShadow: ['#5a5aa0', 1.02], heroSun: ['#ffa066', 1.05], pal: ['#4fae96', '#2a5a66', '#3f8272', '#ffd9b0', '#3a2c5c', '#6a5a84', '#D2542E'],
    sky: { preset: 'day', zenith: '#27357e', mid: '#8a72a8', horizon: '#eda677', ground: '#4a4460', horizonPow: 3.0, scatterColor: '#ff9a52', scatter: 0.85, scatterPow: 4,
      sunColor: '#ff9a50', sunSize: 1.9, sunIntensity: 4.5, sunGlow: 0.6, lightColor: '#ffab72', lightIntensity: 2.4, ambientColor: '#8d7fc0', groundLight: '#5a7a66', ambientIntensity: 1.5 },
    fog: ['#a48fa6', 0.00038], key: ['#ffb880', 0.92], shade: ['#4c4a8e', 1.0], lip: ['#ff9c6a', 0.85], rain: '#3c3154', sarg: '#6a5230',
    sea: { deep: '#2d7970', shallow: '#3fa690', scatter: '#4ab49e', ink: '#688e8c', inkA: 0.46, hard: 9, sand: '#7cc0a4', glit: 0.9, tq: 0.8, turq: '#62c4a8', turqK: 0.76, road: 0.9, roadPow: 5, refl: 0.5, horizon: '#ad8c62',
      sheen: ['#ff8f52', 0.62], sheenBack: ['#e09a6c', 0.42], smearK: 3.6, smearW: 1.5, smearCol: '#ff9a8a', jade: '#2c8474', mirror: ['#eda677', 0.6], gold: ['#ffb066', 0.85] },   // a glassy bronze-jade swell that carries the sky: apricot-bronze lights on its faces, gold toward the sun, rose smears under the tubes; `horizon`: the sea's far colour, a bronze-jade haze; jade, mirror, gold: the body of the sea from the helix (LAST LIGHT in DRESS_FRAG)
    post: { exposure: 1.05, bloom: { strength: 0.36, radius: 0.65, threshold: 0.98 }, grade: { saturation: 1.1, contrast: 1.05, tint: '#fff6ee', shadowTint: '#0a0612', vignette: 0.32, grain: 0.022 } },
  },
  night: {
    hero: 'night', elev: 34, pal: ['#1f8f98', '#0a2a4a', '#28323f', '#c8d6f0', '#141a36', '#2c3a5c', '#D2542E'],
    sky: { preset: 'night', clouds: false, bake: true, milkyWay: 0.1, zenith: '#060a1c', mid: '#1e2642', horizon: '#3c4660', lightColor: '#a9c1ff', lightIntensity: 1.5, ambientColor: '#3a5aa8', groundLight: '#16506a', ambientIntensity: 2.4 },
    fog: ['#242c48', 0.0003], key: ['#b8c8ea', 0.62], shade: ['#1c2646', 1.0], lip: ['#9fb4e6', 0.5], rain: '#343a4e', sarg: '#2c2818',
    sea: { deep: '#0a2a4a', shallow: '#1a6a78', scatter: '#2aa8a0', ink: '#35424f', inkA: 0.4, hard: 14, sand: '#3a8a90', glit: 0.8, glow: '#0b6b78', phos: 1, horizon: '#16284c',
      road: 0.5, roadPow: 5, roadTint: [0.8, 0.9, 1.0], night: ['#5a6474', 0.125], silver: ['#8fb0e0', 0.075], nightHor: ['#5a7090', 0.16], wakeFoam: 0.8, wakePhos: 0.7 },   // the moonlit swell is the dressing's (NIGHT block in DRESS_FRAG): navy faces, silver toward the moon, sparks where whitecaps break
    post: { exposure: 1.4, bloom: { strength: 0.5, radius: 0.7, threshold: 0.85 }, grade: { saturation: 0.95, contrast: 1.04, tint: '#eef4ff', shadowTint: '#06081a', vignette: 0.36, grain: 0.028 } },
  },
};
const WEATHERS = {
  fair: { ocean: { preset: 'choppy', height: 0.8, foam: 0.5, reflectivity: 0.7 }, lift: 1.25, squall: 0, calm: 0, fogK: 1, smear: 0.13, rain: 0.55 },
  squall: { ocean: { preset: 'choppy', height: 1.3, foam: 0.58, spread: 1.25, reflectivity: 0.7 }, lift: 1.9, squall: 1, calm: 0, fogK: 1.3, smear: 0.08, rain: 1 },
  calm: { ocean: { preset: 'calm', height: 0.2, reflectivity: 0.5 }, lift: 0.5, squall: 0, calm: 1, fogK: 0.9, smear: 0.22, rain: 0.4 },
};

// ---------------------------------------------------------------- 2. GLSL
const NOISE = /* glsl */`
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fb3(vec2 p){ return 0.5*n2(p) + 0.3*n2(p*2.07 + 13.1) + 0.2*n2(p*4.3 + 41.7); }
`;
const FOGP = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
float fogK(){ return 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth); }
`;
// the cloud's footprint: > 0 inside. South lip near z = uLipZ; the west lip (mirrored: east) steps away north of z -1500
const EDGE = /* glsl */`
uniform float uMX, uLipZ, uWestX;
float edgeS(vec2 p){ return (uLipZ + (n2(vec2(p.x*0.0045, 3.1)) - 0.5)*150.0 + (n2(vec2(p.x*0.021, 7.7)) - 0.5)*36.0) - p.y; }
float edgeW(vec2 p, float west){
  float w = west - 2500.0*(1.0 - smoothstep(-2400.0, -1500.0, p.y));
  return p.x*uMX - (w + (n2(vec2(p.y*0.004, 9.3)) - 0.5)*260.0 + (n2(vec2(p.y*0.017, 1.7)) - 0.5)*60.0);
}
`;
// The lip of the cloud sheet, in metres inside the cloud (> 0): the footprint with its corner rounded and torn into
// scallops. Far from the route (the step in the west lip north of z -1300, 2-4 km off, seen edge-on) the scallops double
// and open into ragged bays, so that no run of the far lip is straight. The rain shafts are masked by the same function.
const LIP = /* glsl */`
float lipFar(vec2 p){ vec2 q = (p - vec2(0.0, -930.0))*vec2(1.0, 0.6); return smoothstep(900.0, 2200.0, length(q))*(1.0 - smoothstep(-1300.0, -300.0, p.y)); }
float lipSoft(vec2 p){                                                   // the footprint without its scallops: what rain is masked by (a torn mask cut the veils' ends razor-straight)
  float eS = edgeS(p), eW = edgeW(p, uWestX);
  return -240.0*log(exp(-clamp(eS/240.0, -12.0, 12.0)) + exp(-clamp(eW/240.0, -12.0, 12.0))) + 380.0*(n2(p/850.0 + 7.0) - 0.5);
}
float lipE(vec2 p){
  float eS = edgeS(p), eW = edgeW(p, uWestX), fl = lipFar(p);
  float e = -240.0*log(exp(-clamp(eS/240.0, -12.0, 12.0)) + exp(-clamp(eW/240.0, -12.0, 12.0)));
  e += (170.0*(fb3(p/340.0 + 2.0) - 0.5) + 380.0*(n2(p/850.0 + 7.0) - 0.5))*(1.0 + fl);
  e += 150.0*(abs(2.0*n2(p/175.0 + 23.0) - 1.0) - 0.42);                  // billowed: rounded lobes 100-300 m across with notches between them
  return e + fl*(700.0*(n2(p/2100.0 + 3.0) - 0.5) + 420.0*(n2(p/260.0 + 31.0) - 0.5) + 180.0*(n2(p/120.0 + 11.0) - 0.5));
}
`;
const FLAT_VERT = /* glsl */`
varying vec3 vW; varying float vFogDepth;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix*wp; vFogDepth = -mv.z; gl_Position = projectionMatrix*mv; }
`;
// Sea dressing: everything the kit sea cannot carry. Premultiplied "over" (col, a) plus an additive term.
const DRESS_FRAG = (PATCH) => /* glsl */`
uniform float uTime, uInkA, uHard, uCalm, uSquall, uGlit, uGustZ, uSmear, uOriginZ, uSeaWest, uPhosK, uSargK, uTq, uRowC, uFleck;
uniform vec3 uInk, uFoamLit, uFoamShade, uSarg, uSunCol, uSand, uPhos, uSmearCol, uTurq, uFarCol, uSeaLit; uniform vec4 uLug[3], uReef;
uniform vec2 uWindD, uSunAz; uniform float uRoad, uRoadPow, uSheen, uBackK, uNightK, uLast; uniform vec3 uSheenCol, uSheenBack, uRoadTint, uNightCol, uSilver, uNightHor, uHazeN, uJade, uApr, uGold, uSeaHaze, uDFog;
uniform vec4 uSp[6];
varying vec3 vW;
${FOGP}${NOISE}${EDGE}${PATCH}
// One whitecap size seen from the helix. A crest is not a patch of paint: it is a ragged white LEADING EDGE (the breaking
// lip, about a metre deep, lying across the wind and bowed downwind) that trails a short LACE of foam on its upwind side
// (torn at four and nine times the crest's own frequency, a third as dense, gone within a few metres of the lip). The
// blob of noise that places it is never drawn. Lip and lace flare and die as the noise drifts; gone under a pixel.
// Seen from further off the lip is drawn deeper (never under about three pixels of foam: a crest is a white comma with
// a torn edge, not a one-pixel tick), and its lace with it.
float wcap(vec2 qc, float sz, float fj, float fT, float fwg){
  vec2 q = qc/(vec2(5.5, 17.0)*sz) + vec2(uTime*0.09, 3.0 + 17.0*fj);
  q += 0.1*(vec2(n2(q*5.3 + 2.0), n2(q*5.3 + 11.0)) - 0.5);                               // a ragged outline
  float dL = clamp(3.2*fwg/(5.5*sz), 0.2, 0.55);                                            // the lip's depth in cells: a metre, or three pixels
  float n = n2(q), nD = n2(q + vec2(dL, 0.0)), nL = n2(q + vec2(0.55 + dL, 0.0));
  float body = smoothstep(fT, fT + 0.03, n);
  float t1 = n2(q*vec2(3.7, 3.1) + 9.0 + uTime*vec2(0.22, 0.08)), t2 = n2(q*vec2(9.0, 7.0) + 4.0 - uTime*vec2(0.3, 0.12));
  float lip = body*(1.0 - smoothstep(fT - 0.02, fT + 0.045, nD))*(0.55 + 0.45*smoothstep(0.24, 0.46, t2));
  float lace = body*(1.0 - smoothstep(fT - 0.03, fT + 0.07, nL))*smoothstep(0.47, 0.6, 0.55*t1 + 0.45*t2);
  return max(lip, 0.3*lace)*(1.0 - smoothstep(1.1*sz, 3.0*sz, fwg));
}
// THREADS OF LIGHT (last light): the sky lying on a glassy swell. q = (metres across the swell, metres along its crests).
// A thread is a level line of a phase that only ever rises across the swell (the noise in it is too gentle to turn it
// back), so it is ONE wavering line running along the crests: it cannot close into a loop, a hook or a letter (the level
// lines of plain noise did, and filled flat between). S: metres from thread to thread; k numbers them. Each is lit only
// along stretches of its own (lenS metres and more), swelling from nothing to its full depth and back to nothing, so no
// end is cut; its depth (thk, in spacings: least and most) wavers along it and is never more than five pixels; a thread
// finer than half a pixel dims out, and where the threads lie closer than three pixels they are their own even tone, cov.
// taper (0..1) thins them, to nothing at 0 (the edge of a swell's face). Never called from a loop (it takes fwidth).
float threadsOf(vec2 q, float S, float lenS, float sd, vec2 thk, float dens, float taper, float cov){
  float ph = q.x/S + 2.4*(n2(vec2(q.y/(9.0*S), q.x/(11.0*S)) + sd) - 0.5) + 1.1*(n2(vec2(q.y/(2.6*S), q.x/(14.0*S)) + sd + 31.0) - 0.5) + 0.4*(n2(vec2(q.y/(0.95*S), q.x/(9.0*S)) + sd + 57.0) - 0.5);   // (three bends: 80, 23 and 9 m long at S = 4.5; with the last two small a thread seen end on was a ruled line. The phase still rises with q.x everywhere: 0.65/S of slope at most against 1/S)
  float fw = max(fwidth(ph), 1e-4), k = floor(ph), f = abs(fract(ph) - 0.5);
  float g = n2(vec2(q.y/lenS + k*17.3 + sd, k*5.13 + uTime*0.02));
  float th = mix(thk.x, thk.y, n2(vec2(q.y/(1.6*S) + k*3.1, sd + 7.0 + uTime*0.12)))*smoothstep(1.0 - dens, 1.3 - dens, g)*taper;
  float thC = min(th, 2.5*fw);
  float line = (1.0 - smoothstep(thC - 0.75*fw, thC + 0.75*fw, f))*smoothstep(0.0, 0.6*fw, th);
  return mix(line, cov, smoothstep(0.2, 0.45, fw));
}
void main(){
  vec2 p = vW.xz;
  float al = dot(p, uWindD) - uTime*1.6, ac = dot(p, vec2(-uWindD.y, uWindD.x));
  ac += 11.0*(n2(vec2(al*0.0042, ac*0.011)) - 0.5) + 3.0*(n2(vec2(al*0.019, ac*0.05)) - 0.5);   // windrows meander
  float fwc = fwidth(ac), fwp = length(fwidth(p));
  float cell = ac/46.0;
  float hiK = smoothstep(45.0, 150.0, cameraPosition.y - vW.y);                            // 0 on the slalom, 1 from the middle of the helix: looked down on, the 20 m streaks are a rash of white dashes and the lanes ruled lines, so they give way to flecks sized to the pixel
  // cloud shadow: the lip's own outline (rounded corner, scallops 60-250 m across) with a penumbra that wanders between
  // 2 and 9 times uHard, and the shadows of detached scud ahead of it: no ruled line. Opened by the sliding sun patches
  float eS = edgeS(p), eW = edgeW(p, uSeaWest);
  float eC = -240.0*log(exp(-clamp(eS/240.0, -12.0, 12.0)) + exp(-clamp(eW/240.0, -12.0, 12.0)));
  eC += 120.0*(fb3(p/240.0 + 6.0) - 0.5) + 46.0*(n2(p/57.0 + uTime*0.012) - 0.5);
  float flS = smoothstep(800.0, 2000.0, length((p - vec2(0.0, uOriginZ))*vec2(1.0, 0.6)));   // far from the route (seen from the helix, a kilometre and more off) the edge opens into bays and its penumbra widens: no straight side
  eC += flS*(760.0*(n2(p/1250.0 + 3.0) - 0.5) + 380.0*(n2(p/410.0 + 31.0) - 0.5));
  float eN = min(p.y + 3700.0, 3400.0 - p.x*uMX) + 900.0*(n2(p/1100.0 + 5.0) - 0.5);
  float wS = max(fwp*1.2, uHard*(2.0 + 7.0*n2(p/150.0 + 6.0))) + 170.0*flS + 130.0*uNightK*hiK;
  float sh = smoothstep(-wS, wS, eC)*smoothstep(0.0, 600.0, eN);
  sh = max(sh, 0.6*smoothstep(0.6, 0.78, n2(p/90.0 + vec2(uTime*0.03, 2.0)))*smoothstep(-320.0, -60.0, eC)*smoothstep(0.0, 600.0, eN));
  vec2 pwp = p + 170.0*(vec2(n2(p/310.0 + 1.0), n2(p/310.0 + 7.0)) - 0.5) + 56.0*(vec2(n2(p/83.0 + 3.0), n2(p/83.0 + 9.0)) - 0.5);   // (warped: the gaps between patches are ragged, not kites)
  float pt = clamp((wsPatch(pwp - vec2(0.0, uOriginZ)) - uPatch.z)/max(1.0 - uPatch.z, 0.01), 0.0, 1.0);
  float shade = sh*(1.0 - 0.78*pt*(1.0 - 0.8*hiK*uNightK)), lit = 1.0 - shade;                 // (by night, looked down on, a patch keeps a fifth of its contrast: a faint sheen, not a pale wedge)
  float hiL = uLast*hiK;                                                                   // last light, looked down on: the body of the sea is painted below (LAST LIGHT, THE BODY OF THE SEA) and the pale ink, the ink-dark ruffles and the sheen patches stand down for it
  float a = uInkA*shade*(1.0 - 0.8*hiL); vec3 col = uInk*a; vec3 add = vec3(0.0);
  // cat's-paws and the gust front: dark ruffled water
  float ruf = mix(0.5 + 0.5*n2(vec2(ac*0.3, al*0.022)), 0.75, 0.85*hiK);                    // (looked down on, the ruffles' 3 m grain is a field of ruled streaks: even there)
  float cp = smoothstep(0.52, 0.74, n2(p*0.0052 + uTime*vec2(0.021, -0.03)))*ruf;
  float g = uGustZ - p.y + 22.0*(n2(vec2(p.x*0.02, uTime*0.25)) - 0.5);
  float gb = smoothstep(0.0, 14.0, g)*exp(-max(g, 0.0)/150.0)*(0.5 + 0.5*ruf);
  float cp2 = smoothstep(0.55, 0.61, n2(p*0.023 + uTime*vec2(0.05, -0.07) + 13.0))*(0.6 + 0.4*n2(vec2(ac*0.9, al*0.07)))*(1.0 - smoothstep(mix(160.0, 900.0, uCalm), mix(520.0, 1900.0, uCalm), vFogDepth))*(1.0 - smoothstep(2.5, 7.0, fwp));   // a calm sea: small cat's-paws with crisp edges, 30-60 m across, close to
  float dk = clamp((0.14 + 0.34*uCalm)*cp + 0.55*gb, 0.0, 0.8)*(1.0 - hiL);
  col = col*(1.0 - dk) + uInk*0.55*dk; a = a*(1.0 - dk) + dk;
  float dk2 = 0.5*uCalm*cp2*(1.0 - hiL);                                                               // (darker than the glassy swell round them: ruffled water mirrors nothing)
  col = col*(1.0 - dk2) + uInk*0.3*dk2; a = a*(1.0 - dk2) + dk2;
  // wind lanes (12-20 m) and foam streaks (2 m) laid along the wind
  float lane = smoothstep(0.55, 0.8, n2(vec2(ac*0.045, al*0.0035)))*(1.0 - smoothstep(4.0, 16.0, fwc));
  float st = smoothstep(0.6, 0.85, n2(vec2(ac*0.24, al*0.011)))*(0.35 + 0.65*n2(vec2(ac*0.9 + 17.0, al*0.045)));
  st *= mix(1.5*smoothstep(0.3, 0.68, n2(p*1.3 + uTime*vec2(0.17, 0.11)))*(0.35 + 0.65*n2(p*0.29 + 4.0)), 0.5, smoothstep(0.2, 0.7, fwp));   // torn into lace up close
  float foam = (0.5 + 0.9*uSquall)*(st*(1.0 - smoothstep(0.7, 2.6, fwc))*(0.45 + 0.4*lane) + 0.1*lane*(0.5 + 0.5*ruf))*(1.0 - 0.75*uCalm)*(1.0 - 0.85*hiK);
  foam += uSquall*0.5*smoothstep(-6.0, 10.0, g)*exp(-max(g, 0.0)/60.0)*ruf;
  foam = clamp(foam, 0.0, 0.85);
  // FROM THE HELIX (150 m up and more) the streaks above are under a pixel. There the sea carries WHITECAPS OF A REAL SIZE:
  // crests lying across the wind, 1.5-4.5 m by 5-14 m (three sizes, each in its own quarters of the sea), every one torn,
  // flaring and dying as it runs. They are gathered into WIND ROWS (bands 30-70 m across laid along the wind, 150-500 m
  // long, frayed into strands) inside gust patches 200-400 m across; between the rows the water is calm and dark. A crest
  // under a pixel is gone, so far off the rows are only a faint paling, and from higher there are fewer. Round the feet
  // of the sisters the inflow breaks the biggest crests. Under them the swell: long faces 70 m apart, darker on the side
  // turned from the light, a little brighter toward it.
  float fwg = sqrt(max(length(dFdx(p))*length(dFdy(p)), 1e-4));                             // the footprint's mean axis (metres per pixel)
  float aniK = 1.0 - smoothstep(4.0, 10.0, fwp/max(fwg, 0.05));                              // (seen low across the water a crest would be a stretched dash: none there)
  float gusts = smoothstep(0.36, 0.64, 0.6*n2(p/260.0 + uTime*vec2(0.01, -0.014) + 4.0) + 0.4*n2(p/90.0 + 11.0));
  float acR = ac + 34.0*(n2(vec2(al*0.0045, ac*0.006) + 2.0) - 0.5);                        // (the rows' own meander)
  float rows = smoothstep(0.58, 0.7, n2(vec2(acR/52.0, al/420.0) + 6.0))*(0.3 + 0.7*smoothstep(0.3, 0.6, n2(vec2(acR/21.0 + 3.0, al/170.0))));
  float nearSp = 0.0;
  for (int i = 0; i < 6; i++) { vec2 dsp = p - uSp[i].xy; nearSp = max(nearSp, min(uSp[i].z, 1.0)*exp(-dot(dsp, dsp)/12000.0)); }
  nearSp *= 1.0 - 0.8*uNightK;                                                              // (the big crests break against a spray crown, inside its stain; by night only the small sparks in rows remain)
  // ... and the gust patches themselves lie in GUST FIELDS 600-1,200 m across (drifting downwind). Looked down on from
  // 100 m and more the crests break only inside a field: four or five wind rows here, a gust patch there, and calm water
  // of the sea's own colour between them (an even scatter over the whole sea was a rash of white ticks)
  float fieldN = 0.62*n2(p/880.0 + uTime*vec2(0.004, -0.006) + 31.0) + 0.38*n2(p/340.0 + 5.0 + uTime*vec2(0.006, -0.004));
  float field = mix(1.0, smoothstep(0.47, 0.6, fieldN), smoothstep(80.0, 160.0, cameraPosition.y - vW.y));
  float gather = clamp(rows*(0.05 + 0.95*gusts)*field + 0.75*nearSp, 0.0, 1.0)*(1.0 - 0.35*smoothstep(150.0, 300.0, cameraPosition.y - vW.y))*clamp(uFleck, 0.5, 1.3);
  float fT = mix(0.97, 0.7, min(gather, 1.0));
  vec2 qc = vec2(al, ac) + 3.0*(vec2(n2(p/13.0 + 1.0), n2(p/13.0 + 7.0)) - 0.5);            // (warped: no two crests lie quite the same way)
  vec3 fk = vec3(wcap(qc, 0.62, 0.0, fT, fwg), wcap(qc, 1.0, 1.0, fT, fwg), wcap(qc, 1.7, 2.0, fT, fwg));
  float szA = n2(p/150.0 + 21.0), szB = n2(p/150.0 + 47.0);                                   // which size breaks where
  float fleck = max(max(fk.x*smoothstep(0.3, 0.55, szA), fk.y*smoothstep(0.62, 0.36, szA)), fk.z*max(smoothstep(0.5, 0.7, szB)*(1.0 - 0.8*uNightK), nearSp));
  // ... and where a crest is under a pixel (a kilometre off and more) the rows still carry it as a speck sized to the
  // pixel's own footprint (two octaves, cross-faded), dimmer than a crest seen whole: the far sea is whitecapped in rows too
  float Lf = log2(max(fwg, 0.3)*2.4), l0 = floor(Lf), s0 = exp2(l0), fTf = mix(0.97, 0.76, min(gather, 1.0));
  vec2 qf = vec2(al*1.35, ac*0.78) + 2.6*s0*(vec2(n2(p/(s0*5.0) + 1.0), n2(p/(s0*5.0) + 7.0)) - 0.5);
  float fkA = smoothstep(fTf, fTf + 0.1, n2(qf/s0 + vec2(uTime*0.11, 3.0)))*(0.35 + 0.65*n2(qf/(s0*0.45) + 9.0));
  float fkB = smoothstep(fTf, fTf + 0.1, n2(qf/(2.0*s0) + vec2(uTime*0.11, 3.0)))*(0.35 + 0.65*n2(qf/(s0*0.9) + 9.0));
  fleck = max(fleck, 0.14*(0.25 + 0.75*gusts)*field*mix(fkA, fkB, Lf - l0)*smoothstep(1.3, 3.0, fwg)*(1.0 - smoothstep(14.0, 40.0, fwg)));   // (none outside a gust field)
  fleck *= hiK*aniK*(0.84 + 0.4*uSquall)*(1.0 - 0.7*uCalm);
  float farRow = 0.035*rows*(0.3 + 0.7*gusts)*field*hiK*smoothstep(0.8, 3.2, fwg)*(1.0 - smoothstep(14.0, 44.0, fwg))*aniK*(1.0 - 0.6*uCalm)*(1.0 - 0.7*uNightK);   // far off: the rows as the faintest paling (more of it was a comb of milky bars, by night pale wedges)
  float acH = ac + 46.0*(n2(vec2(al*0.0031, ac*0.0052) + 2.0) - 0.5) + 14.0*(n2(vec2(al*0.011, ac*0.02) + 7.0) - 0.5);   // (their own, wider meander: seen from above no lane is straight)
  float laneHi = hiK*smoothstep(0.52, 0.8, n2(vec2(acH*0.019, al*0.0042) + 6.0))*smoothstep(0.3, 0.7, n2(vec2(acH*0.07, al*0.012) + 3.0))*(1.0 - smoothstep(18.0, 60.0, fwc));   // ... and soft pale wind lanes 50-100 m apart, broken every 100-250 m
  foam = max(foam, clamp(0.95*fleck + farRow + 0.03*laneHi*(1.0 - 0.6*uCalm), 0.0, 0.85));   // (the pale lanes are the faintest thing there: more of them was a fan of streaks converging on the horizon)
  float alS = al + 64.0*(n2(vec2(ac/430.0, al/1400.0) + 11.0) - 0.5) + 26.0*(n2(vec2(ac/170.0, al/520.0) + 3.0) - 0.5) + 9.0*(n2(vec2(ac/48.0, al/160.0) + 8.0) - 0.5);   // (the swell's lines bend at three scales: ruled, or bent only a little, they fan from the bottom of the frame like spokes)
  float swH = 0.7*n2(vec2((alS - uTime*4.0)/38.0, ac/130.0) + 5.0) + 0.3*n2(vec2((alS - uTime*2.5)/15.0 + 3.0, ac/52.0)) - 0.5;   // (crests 130 to 260 m long: at twice that, looked along from the helix, the faces were pale rays fanning from under the wing)
  swH *= hiK*(1.0 - smoothstep(5.0, 20.0, fwp));
  float dkS = clamp(-1.0*swH, 0.0, 0.25)*(1.0 - hiL)*(1.0 - 0.5*uCalm)*(1.0 - 0.6*foam)*(0.55 + 0.45*smoothstep(0.3, 0.6, n2(p/330.0 + 17.0)));   // (deeper in some reaches of the sea than in others)                  // the swell's back faces, from above
  col = col*(1.0 - dkS) + uInk*0.45*dkS; a = a*(1.0 - dkS) + dkS;
  float swLn = (1.0 - smoothstep(0.0, 0.05, abs(swH - 0.13)))*smoothstep(0.35, 0.6, n2(vec2(al/31.0, ac/140.0) + 13.0))*smoothstep(0.42, 0.66, n2(p/300.0 + 29.0))*(1.0 - smoothstep(2.0, 7.0, fwg))*mix(1.0, 0.45, smoothstep(0.8, 2.0, fwg));   // the long crest lines of the swell, broken every hundred metres or so, in a few reaches of the sea only, and fainter where a pixel is over a metre and a half of water (looked down on, the swell is soft shading with a few bent crest lines: line beside line, they were spokes)
  add += uSeaLit*(1.0 - 0.75*hiL)*((0.5*max(swH, 0.0) + 0.22*swLn)*(0.4 + 0.6*lit) + 0.3*pt*sh*hiK*(0.75 + swH));          // ... its faces toward the light; and inside the cloud's shadow a sun patch is brighter, more saturated WATER (never a veil)
  col = col*(1.0 - foam) + mix(uFoamShade, uFoamLit, lit)*foam; a = a*(1.0 - foam) + foam;
  add += uPhos*uPhosK*foam;
  // sargassum windrows: one meandering golden line per 46 m lane, hundreds of metres long
  float ci = floor(cell), cf = fract(cell);
  float off = 0.25 + 0.5*h21(vec2(ci, 3.0)) + 0.16*(n2(vec2(al*0.006, ci*1.7)) - 0.5);
  float wd = 0.7 + 1.2*h21(vec2(ci, 9.0)), aa = max(fwc, 0.18);
  float nearS = 1.0 - smoothstep(0.5, 2.5, fwp);                                          // clumps and ragged sides resolve near the eye
  float rough = (0.9*(n2(vec2(al*0.33 + ci*5.0, ac*0.55)) - 0.5) + 0.5*(n2(p*1.9 + 3.0) - 0.5))*nearS;
  float dl = abs(cf - off)*46.0 + 1.5*rough;                                              // metres from the windrow's centre line: no straight side
  float ln = (1.0 - smoothstep(wd - aa - 0.55*nearS, wd + aa + 0.25*nearS, dl))*min(1.0, 2.5*wd/aa);
  ln *= (1.0 - smoothstep(0.7, 2.0, fwc))*(1.0 - smoothstep(0.9, 2.4, fwp))*(1.0 - 0.85*hiK)*(1.0 - step(0.001, uSheen)*smoothstep(0.35, 0.6, fwc));   // (at last light a far windrow catches the low sun as a ruled yellow line: gone sooner)   // a windrow under about 2 px wide fades out (beyond some 150 m): never a 1 px dark stroke (nor, looked down on from the helix, a scratch)
  float clump = mix(1.0, smoothstep(0.34, 0.62, n2(vec2(al*0.31 + ci*3.0, ac*0.4)))*(0.4 + 0.6*smoothstep(0.25, 0.7, n2(p*2.6 + uTime*0.1))), nearS);   // broken into 2-4 m tufts
  float sg = ln*clump*smoothstep(0.38, 0.6, n2(vec2(al*0.0032 + ci*7.3, ci*0.37)))*smoothstep(0.3, 0.62, n2(vec2(al*0.034, ci*3.1)))*(0.45 + 0.55*n2(p*0.9 + uTime*0.15))*uSargK;
  // ... and one long windrow that lies across the run-in, 35 m ahead at 2 s: it streaks under the nose
  float wd2 = 0.5 + 3.2*n2(vec2(al*0.045, 2.0))*n2(vec2(al*0.013, 6.0));                  // (0.5 to 3 m: a raft here, a thread there)
  float ln2 = (1.0 - smoothstep(wd2 - aa - 0.55*nearS, wd2 + aa + 0.25*nearS, abs(ac - uRowC) + 1.5*rough))*min(1.0, 2.5*wd2/aa);
  ln2 *= (1.0 - smoothstep(0.7, 2.0, fwc))*(1.0 - smoothstep(0.9, 2.4, fwp))*(1.0 - smoothstep(210.0, 330.0, length(p - vec2(0.0, -135.0))));
  float clump2 = mix(1.0, smoothstep(0.3, 0.58, n2(vec2(al*0.31 + 1.7, ac*0.4)))*(0.45 + 0.55*smoothstep(0.25, 0.7, n2(p*2.6 + uTime*0.1))), nearS);
  float sg2 = ln2*clump2*(0.5 + 0.5*n2(p*0.9 + uTime*0.15))*min(uSargK*1.3, 0.95);
  sg2 *= smoothstep(0.4, 0.56, n2(vec2(al/21.0 + 5.0, 1.0)))*(0.35 + 0.65*smoothstep(0.32, 0.6, n2(vec2(al/7.0, 4.0))));   // broken into rafts 10-35 m long with as much open water between: weed on the wind, not a ruled band
  for (int iL = 0; iL < 3; iL++) {                                                        // ... and parted where each skiff of the run-in file has sailed through it (her wake lies in the gap)
    vec2 dLg = p - uLug[iL].xy; float tLg = clamp(-dot(dLg, uLug[iL].zw), 0.0, 90.0);
    sg2 *= smoothstep(4.0 + 0.04*tLg, 13.0 + 0.1*tLg, length(dLg + uLug[iL].zw*tLg));
  }
  sg = max(sg, sg2);
  sg *= 0.88;                                                                             // weed lies in the water: a little of the sea shows through
  float crest2 = (1.0 - smoothstep(0.0, 0.55*wd2, abs(ac - uRowC) + 1.2*rough))*sg2*lit;                 // the run-in's windrow carries a thin sunlit crest along its middle
  col = col*(1.0 - sg) + uSarg*(0.6 + 0.4*lit)*(0.8 + 0.5*n2(p*0.7 + 9.0))*(1.0 + 0.9*sg2 + 0.9*crest2)*sg; a = a*(1.0 - sg) + sg;   // (the run-in's windrow is the freshest: gold)
  // the swell's long faces (used at last light: they carry the orange sky; uSheen is 0 at every other hour)
  float swl = n2(vec2((al - uTime*3.0)*0.085, ac*0.016)), swf = n2(vec2((al - uTime*4.5)*0.31 + 9.0, ac*0.06));
  float shv = 0.7*swl + 0.3*swf + 0.24*(n2(p*0.004 + 3.0) - 0.5), shw = mix(clamp(1.5*fwidth(shv), 0.012, 0.05), 0.12, uNightK);   // (the edge of a face is three pixels wide near the eye, never wider than it was: at a fixed width a face 100 m off had a border metres deep, a blur)
  float shn = smoothstep(0.68 - shw, 0.68 + shw, shv);   // (at last light crisp-edged: glass beside ruffled water; under the moon soft: crisp silver dashes across the sparks' rows were a plaid)
  float hiN = max(smoothstep(1.5, 9.0, fwp), 0.85*hiK*uNightK);                              // (by night, looked down on, each swell face would be a pale lozenge: patches there too)
  float farN = n2(p*0.004 + 3.0 + uTime*0.004) + uCalm*0.22*(n2(vec2(ac*0.006, al*0.028) + 9.0) - 0.5);   // (a calm sea: the patches are drawn out along the wind into long streaks ...)
  shn = mix(shn, 0.3*(0.4 + 1.2*smoothstep(mix(0.45, 0.3, uNightK), mix(0.55, 0.7, uNightK), farN)), hiN);   // from altitude: bronze in patches 200-400 m across (... with crisp edges: glass beside ruffled water, not a smear)
  shn *= mix(1.0, 0.3 + 0.7*smoothstep(0.35, 0.65, n2(vec2((al - uTime*2.0)*0.5, ac*0.11))), 1.0 - smoothstep(0.3, 1.5, fwp));   // close to, each face breaks into ripple dashes
  // (last light, near the eye) ... and a face is never one flat light: the apricot sky lies on the glassy swell as THIN
  // WAVERING THREADS (threadsOf above: 4.5 m apart, a quarter of a metre to a metre deep and never over five pixels,
  // tens of metres long, lying along the crests, drifting with the swell; they swell out of nothing and thin to nothing
  // toward the edge of the face they lie on), with jade between them. A calm sea carries more of them.
  float thrN = threadsOf(vec2(al - uTime*3.4, ac), 4.5, 18.0, 3.0, vec2(0.03, 0.12), mix(0.42, 0.55, uCalm), smoothstep(0.32, 0.6, shv), 0.07);   // (reaches of 20 to 50 m with gaps as long: at 30 m and denser a thread ran 150 m unbroken)
  shn = mix(shn, 1.15*thrN, uLast*(1.0 - hiN));
  float nsw = smoothstep(mix(0.24, 0.45, uCalm), mix(0.8, 0.59, uCalm), 0.62*swl + 0.38*swf);   // the same swell, unthresholded: broad soft faces (last light's rose wash, the night sea's body); crisper on a calm sea
  nsw = mix(nsw, 0.42*(0.6 + 0.8*mix(farN, smoothstep(0.4, 0.6, farN), uCalm)), hiN);
  // sand shoals and their caustic net under the entry
  float nearE0 = 1.0 - smoothstep(250.0, 620.0, length(p - vec2(0.0, 60.0)) + 240.0*(n2(p*0.0052 + 1.0) - 0.5) + 110.0*(n2(p*0.016 + 8.0) - 0.5)), nearE = nearE0*(1.0 - sh);   // the shoal ends in tongues and patches
  float sd = smoothstep(0.4, 0.72, n2(p*0.011 + 5.0))*nearE;
  float nr1 = 1.0 - abs(2.0*n2(p*0.33 + uTime*vec2(0.12, 0.07)) - 1.0), nr2 = 1.0 - abs(2.0*n2(p*0.8 - uTime*vec2(0.1, 0.14) + 7.0) - 1.0);
  float net = smoothstep(0.3, 0.95, nr1*(0.35 + 0.65*nr2))*(1.0 - smoothstep(0.5, 2.5, fwp));   // a soft web: two ridged octaves drifting against each other
  float lanes = (1.0 - smoothstep(380.0, 1250.0, length(p - vec2(0.0, 60.0))))*smoothstep(0.4, 0.74, 0.6*n2(vec2(ac*0.011, al*0.0034) + 3.3) + 0.4*n2(p*0.021 + 5.0));   // beyond the shoal: pale lanes and reef patches in the blue
  vec2 rq = p - uReef.xy;                                                                  // ... and a patch reef west to north-west of the fifth sister (uReef: its centre and half-axes, dealt per seed): the helix looks down on pale shallows and coral heads there, not on one blue
  float reefM = 1.0 - smoothstep(0.5, 1.0, length(rq/uReef.zw) + 0.55*(n2(p/190.0 + 3.0) - 0.5) + 0.3*(n2(p/64.0 + 8.0) - 0.5));
  float reef = reefM*smoothstep(0.36, 0.62, 0.6*n2(p*0.012 + 15.0) + 0.4*n2(p*0.041 + 2.0));
  float tq = uTq*max(max(nearE*(1.0 - 0.6*sd), 1.5*lanes*(1.0 - 0.55*sh)), 1.5*reef*(1.0 - 0.5*sh)*(1.0 - 0.6*uNightK));
  col = col*(1.0 - tq) + uTurq*(1.0 + uSheen*(1.1*swl - 0.5))*tq; a = a*(1.0 - tq) + tq;
  float sk = 0.26*sd;
  col = col*(1.0 - sk) + uSand*sk; a = a*(1.0 - sk) + sk;
  float weed = 0.85*smoothstep(0.43, 0.66, 0.6*n2(p*0.019 + 11.0) + 0.4*n2(p*0.06 + 3.0))*nearE0*(1.0 - 0.75*shade)*(1.0 - sd);   // seagrass and coral heads: dark teal patches 20-80 m across, also under the sun patches inside the shadow line: the lagoon is never one flat colour
  vec2 wq = vec2(p.x*uMX, p.y);                                                           // ... and three beds laid across the run-in itself (30-70 m across, ragged): the first 150 m are never one turquoise
  float wr = 0.55*(n2(p*0.09 + 4.0) - 0.5) + 0.3*(n2(p*0.31 + 8.0) - 0.5);
  float beds = max(max(1.0 - smoothstep(0.55, 1.0, length((wq - vec2(-24.0, 58.0))/vec2(34.0, 15.0)) + wr), 1.0 - smoothstep(0.55, 1.0, length((wq - vec2(31.0, 2.0))/vec2(40.0, 19.0)) + wr)), 1.0 - smoothstep(0.55, 1.0, length((wq - vec2(-12.0, -66.0))/vec2(30.0, 13.0)) + wr));
  weed = max(weed, 0.8*beds*(1.0 - 0.75*shade));
  weed = max(weed, 0.6*reefM*smoothstep(0.52, 0.7, 0.6*n2(p*0.026 + 21.0) + 0.4*n2(p*0.08 + 5.0)));   // (the patch reef's coral heads)
  weed *= 0.75 + 0.5*n2(p*0.23 + 2.0);                                                    // (mottled: beds, not blots)
  col = col*(1.0 - weed) + uInk*1.25*weed; a = a*(1.0 - weed) + weed;
  add += uSand*0.11*net*nearE*(0.4 + 0.6*sd)*(1.0 - 0.7*weed);
  // sun glitter
  float gl = n2(p*3.3 + uTime*vec2(1.3, 0.8))*n2(p*4.6 - uTime*vec2(0.9, 1.5));
  float Ls = log2(max(fwg, 0.3)*1.7), ls0 = floor(Ls), ss0 = exp2(ls0);                     // (from the helix) glitter is sparks a pixel or two across, twinkling: never a milky veil
  float spk = mix(smoothstep(0.8, 0.9, n2(p/ss0 + uTime*vec2(0.7, 0.45)))*n2(p/(0.6*ss0) - uTime*vec2(0.5, 0.8) + 5.0), smoothstep(0.8, 0.9, n2(p/(2.0*ss0) + uTime*vec2(0.7, 0.45)))*n2(p/(1.2*ss0) - uTime*vec2(0.5, 0.8) + 5.0), Ls - ls0)*aniK;
  vec2 toP = p - cameraPosition.xz; float sroad = max(dot(toP/max(length(toP), 1.0), uSunAz), 0.0);
  float road = pow(sroad, 60.0), roadW = pow(sroad, uRoadPow);
  gl = mix(smoothstep(0.54, 0.68, gl), mix(0.03, 0.8*spk*(0.25 + 0.75*gusts)*(0.12 + 0.88*max(roadW, 0.6*field*sroad)), hiK), smoothstep(0.15, 0.9, fwp));   // (looked down on, sparks lie toward the sun and where a gust field ruffles the water: away from the sun the sea keeps its colour)
  add += uSunCol*uGlit*1.1*gl*lit*mix(1.0 - 0.88*uCalm, 1.0, road);                      // a calm sea keeps a narrow glitter path
  add += uSunCol*uRoadTint*uRoad*(0.3*roadW + 0.7*road)*(0.35 + 0.65*lit)*(0.6 + 0.4*n2(vec2(ac*0.2, al*0.03 + uTime*0.2)));   // the bronze sun road (silver under the moon)
  float gz = 1.0 - clamp((cameraPosition.y - vW.y)/max(vFogDepth, 1.0), 0.0, 1.0); gz *= gz; gz *= gz; gz *= gz;   // (seen low across the water; from the helix the sea keeps its colour)
  // last light: the swell carries the orange sky as a broken bronze sheen, widest toward the sun. It mirrors the open
  // horizon, not the sun, so it lies under the cloud too: the shadowed sea is jade and bronze, never black
  // Faces turned away from the sun carry the rose-violet of the sky on that side: bright flecks, and a broad soft wash
  float shD = shn*mix(smoothstep(10.0, 260.0, vFogDepth), smoothstep(3.0, 30.0, vFogDepth), uCalm), nearL = uLast*(1.0 - hiN);
  float kL = nearL*(1.0 - hiL)*min(0.9*shD, 0.88)*(1.0 - foam)*(1.0 - sg)*(0.62 + 0.38*n2(p*1.3 + uTime*0.4));   // (rippled: where a thread is several pixels deep it is broken water, not a flat fill)                               // (last light, near the eye: a light is the SKY lying on the water, so it takes the water's place in the sky's own apricot, gold toward the sun; added on top of the jade it was a cream paler than the sky it mirrors)
  col = col*(1.0 - kL) + mix(uApr*1.45, uGold*1.15, roadW)*(0.72 + 0.28*lit)*kL; a = a*(1.0 - kL) + kL;
  add += (1.0 - hiL)*mix(uSheenBack, uSheenCol, max(roadW, 0.45*(1.0 - smoothstep(200.0, 700.0, vFogDepth))))*uSheen*(shD*(1.0 - nearL)*(0.6 + 0.4*roadW + 0.25*uCalm)*(0.6 + 0.4*lit) + uBackK*nsw*(1.0 - roadW)*(0.75 - 0.2*lit)*(1.0 - 0.8*gz)*(1.0 - 0.75*uSquall)*mix(0.4, 1.0, smoothstep(250.0, 600.0, vFogDepth))*(1.0 - 0.85*foam));   // (inside 700 m the faces take some of the sun side's apricot: near the eye rose-violet over jade was lilac-grey; four tenths of the wash inside 400 m, a quarter under a squall, none over foam: near the eye the wash was lilac streaks over the jade, and the foam lines keep their own lit white)   // ... and thinner still low across the water, where a wash is drawn out into a mauve smear (a squall halves it)   // (the wash is thinner on the sunlit green: rose over emerald goes grey)
  // NIGHT: the moonlit swell. The kit sea is all but black away from the moon, so the dressing carries it: navy faces on
  // every swell (dimmer in the troughs), silver on the faces toward the moon, blue-green sparks where a whitecap breaks
  // (3-8 m crests lying across the wind, flaring and dying), and a paler band under the horizon
  if (uNightK > 0.0) {
    float moonW = roadW*sqrt(roadW);
    float cap = smoothstep(0.7, 0.86, n2(vec2((al - uTime*2.0)*1.5, ac*0.3 + 0.35*sin(al*0.4))))*smoothstep(0.5, 0.76, n2(p*0.05 + uTime*vec2(0.13, -0.09)));
    cap *= 0.5 + 0.5*sin(uTime*2.3 + 40.0*n2(p*0.09));
    cap *= 0.3 + 0.7*smoothstep(0.3, 0.7, n2(p*2.1 + uTime*vec2(0.4, 0.2)));               // each crest is torn, not a lozenge
    cap = mix(cap, 0.01, smoothstep(0.35, 1.8, fwp))*(1.0 - 0.9*hiK);                        // (from the helix the sparks are the flecks' own: a row of crests would be a ruled rash)
    vec3 nb = uNightCol*(0.42 + 1.36*nsw)*(1.0 - 0.4*lit)*(0.75 + 0.5*ruf);
    nb += uNightCol*1.3*lit*smoothstep(150.0, 900.0, vFogDepth)*(1.0 - 0.8*hiK);            // the open sea beyond the cloud's shadow: no ink there, and far off the kit sea is black (looked down on, half of it: the shadow's ragged edge is a faint sheen, not pale wedges)
    nb += uSilver*shn*(0.5 + 1.6*moonW)*(1.0 - 0.5*hiK);
    nb += uPhos*cap*(0.5 + 0.6*foam);
    nb += uNightHor*smoothstep(260.0, 2300.0, vFogDepth);
    add += nb;
  }
  // toward the horizon the sea takes the pale sky under the cloud's far edge, in wind lanes: it grades away, no dark stripe
  add += uFarCol*gz*smoothstep(40.0, 300.0, vFogDepth)*(0.6 + 0.4*lit)*(0.7 + 0.6*n2(vec2(ac*0.021, al*0.0031)));
  // each sister stands on a pale smear drawn toward the eye
  float smr = 0.0;
  for (int i = 0; i < 6; i++) {
    vec2 d = cameraPosition.xz - uSp[i].xy; float dl = max(length(d), 1.0); d /= dl;
    vec2 r = p - uSp[i].xy; float sa = dot(r, d), sc = dot(r, vec2(-d.y, d.x));
    float w = uSp[i].w + 0.02*max(sa, 0.0);                                             // narrow, so three smears never merge into a wash
    smr += uSp[i].z*exp(-(sc*sc)/(w*w))*smoothstep(0.0, 60.0, sa)*exp(-max(sa, 0.0)/(0.25*dl + 60.0));
  }
  smr *= 0.55 + 0.45*n2(vec2(p.x*0.21 + p.y*0.07, p.y*0.5 + uTime*0.7));
  smr *= mix(1.0, mix((0.3 + 0.9*smoothstep(0.3, 0.7, n2(vec2((al - uTime*2.0)*0.45, ac*0.1) + 5.0)))*(1.0 - 0.85*thrN), 0.62, smoothstep(1.5, 9.0, fwp))*smoothstep(25.0, 140.0, length(toP)), step(0.001, uSheen));   // at last light the tubes' reflections are rose dashes lying along the swell BETWEEN the apricot threads, not a wash
  add += uSmearCol*uSmear*min(smr, 1.0)*(1.0 - smoothstep(42.0, 95.0, cameraPosition.y - vW.y));   // (from the helix they would be ruled rays fanning from under the wing, and at 90 m a milky patch: gone by 95 m; the slalom never climbs past 37)
  // LAST LIGHT, THE BODY OF THE SEA (uLast; the kit sea at that hour is jade under a lilac haze, and from the helix a
  // film). Looked down on, and beyond a kilometre from any height, the dressing paints the water itself under its own
  // foam and reefs: GLASS. Jade where the eye looks down into it, taking a bronze cast as the eye's line flattens
  // (bronze-jade to the horizon); on it the swell's LIGHTS, thin crisp lines of the apricot sky 6-17 m apart and
  // 50-130 m long, wavering and forking (an eighth of the water; toward the sun half of it, and gold: the glitter
  // road), one even tone where a line is under a pixel; DARK CAT'S-PAWS where a gust ruffles it (matt: they carry no lights). It hazes to the
  // sea's own far colour (uSeaHaze: the dome's colour below the horizon), never to the air's lilac.
  float bA = 0.0; vec3 bodyC = vec3(0.0);
  if (uLast > 0.0) {
    float vdn = clamp((cameraPosition.y - vW.y)/max(vFogDepth, 1.0), 0.0, 1.0), fres = 1.0 - vdn; fres *= fres*fres;
    float kA = 1.0 - smoothstep(4.0, 13.0, fwp), kB = 1.0 - smoothstep(1.5, 5.0, fwp);
    float rdL = roadW*roadW;                                                               // (the road of lights is narrower than the sun road's own wash)
    vec2 pq = vec2(al, ac) + 90.0*(vec2(n2(p/230.0 + 3.0), n2(p/230.0 + 17.0)) - 0.5) + 28.0*(vec2(n2(p/61.0 + 9.0), n2(p/61.0 + 23.0)) - 0.5);   // (warped at two scales: a cat's-paw has a ragged, lobed edge, never a straight side)
    float slk = smoothstep(0.4, 0.62, 0.6*n2(pq/vec2(840.0, 360.0) + 41.0 + uTime*vec2(0.004, 0.003)) + 0.4*n2(pq/vec2(270.0, 125.0) + 7.0));   // SLICKS: reaches of glassier water 300-800 m across. Far off, where a light is finer than the pixel, they carry the sky as pale apricot bands with jade between (one even tone to the horizon was a flat khaki field)
    float cov = mix(mix(0.03, 0.46, slk), 0.42, rdL);
    vec2 thkL = vec2(0.04, 0.13)*(1.0 + 1.6*rdL);                                             // (the same threads as near the eye, at 17 m and 6.5 m: single wavering lines along the swell, 50-120 m long, thicker and more of them toward the sun; level lines of noise were wood grain here, closed ring inside ring)
    float lights = mix(cov, max(threadsOf(vec2(alS - uTime*4.0, ac), 17.0, 120.0, 5.0, thkL, mix(0.5, 0.85, rdL), 1.0, cov), kB*threadsOf(vec2(alS - uTime*2.6, ac), 6.5, 50.0, 9.0, thkL, mix(0.45, 0.8, rdL), 1.0, cov)), kA);
    vec2 pr = vec2(0.8*pq.x - 0.6*pq.y, 0.6*pq.x + 0.8*pq.y);                               // (the second size on a turned lattice: on one lattice the cat's-paws lay in rows with near-straight sides, like paving)
    float pv = 0.74*n2(pq/vec2(360.0, 160.0) + uTime*vec2(0.02, 0.012) + 13.0) + 0.26*n2(pr/vec2(150.0, 84.0) + 3.0 - uTime*vec2(0.03, 0.0));
    float pst = 0.6*mix(n2(vec2(al/34.0, ac/4.2) + 5.0), 0.5, smoothstep(1.5, 6.0, fwp)) + 0.4*mix(n2(vec2(al/110.0, ac/11.0) + 9.0), 0.5, smoothstep(5.0, 18.0, fwp));   // wind streaks at two sizes: they fray a cat's-paw's edge along the wind and ruffle its inside
    float pvw = clamp(1.5*fwidth(pv), 0.03, 0.25);                                            // (a feathered edge, 20 m and more deep)
    float paw = smoothstep(0.67 - pvw, 0.67 + pvw, pv + 0.11*(pst - 0.5))*(1.0 - smoothstep(40.0, 130.0, fwp))*(1.0 - 0.6*uCalm)*(0.62 + 0.6*pst);   // fewer and larger than they were, their edges ragged
    vec3 brz = uApr*vec3(0.9, 0.7, 0.48);
    bodyC = mix(uJade*(0.72 + 0.26*lit)*(1.0 - 0.45*paw), brz, clamp(0.05 + 0.95*fres*fres, 0.0, 0.86)*(1.0 - 0.7*paw));   // (jade where the eye looks down into it; toward the horizon a bronze mirror, on which a cat's-paw stays dark jade. Half and half all the way out it was one olive field)
    bodyC += mix(uApr, uGold, rdL)*(1.0 - 0.25*shade)*lights*(0.16 + 0.74*smoothstep(0.0, 0.45, fres))*(1.0 - 0.92*paw);
    bodyC += uGold*(0.4*pow(sroad, 24.0)*fres + 1.5*spk*roadW*roadW)*(1.0 - 0.8*paw)*(0.4 + 0.6*lit);   // the road's bright core under the sun, sparks in it
    float hzB = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth*0.35);                  // (its marks carry further than the air's haze: slicks and cat's-paws are still there at three kilometres)
    bodyC = mix(bodyC, uSeaHaze, hzB);
    bA = uLast*max(hiK*mix(0.7, 0.93, smoothstep(150.0, 800.0, vFogDepth)), smoothstep(300.0, 1300.0, vFogDepth));
  }
  a = clamp(a, 0.0, 0.93);
  float ff = fogK(), far = 1.0 - smoothstep(mix(1700.0, 2400.0, hiK), mix(3300.0, 4300.0, hiK), vFogDepth);   // (from the helix the dressing runs further out: the sea keeps its shadow, lanes and night glow to the haze)
  col = mix(col, uDFog*a, ff);
  float hz = 0.97*uNightK*smoothstep(10.0, 24.0, cameraPosition.y)*smoothstep(mix(1000.0, 1500.0, hiK), mix(2600.0, 3600.0, hiK), vFogDepth);   // (low over the water it comes on from 1 km and is whole by 2.6: at 1.5 to 3.6 km the sea between 2 and 3.5 km, one row of pixels from the slalom, was neither: its glow gone into the fog, the haze a half, a dark hairline ruled under the horizon. Measured with the layers colour-coded)   // by night, from the slalom's 30 m up (not the run-in's 12 m: its far sea is lit by the open sky) the sea beyond 3 km is the moon haze of the sky's horizon (there the fog has taken the swell's glow and the kit sea alone is navy: a dark stripe under the horizon)
  vec4 o = vec4((col + add*(1.0 - ff))*far, a*far);
  bA *= 1.0 - o.a; o += vec4(bodyC*bA, bA);                                                 // (the body lies under the dressing's own marks and over the kit sea)
  gl_FragColor = o*(1.0 - hz) + vec4(uHazeN*mix(1.0, 0.92, smoothstep(3600.0, 6000.0, vFogDepth))*hz, hz);   // (at the rim it is the dome's own colour below the horizon)
}
`;
// Cloud base: one sheet at 620 m, shaded like the hero's collars so they melt into it. Within about 2 km its underside
// has real relief: a height field of rounded pouches 100-300 m across with creases between them, recessed up to uReliefD
// metres above the sheet and found by a 14-step march along the eye ray (so the pouches slide over one another as we
// climb, hide the hollows behind them and take the light on their flanks). Far off it flattens into the old painted
// billows. The sheet's far edges melt into the haze; its lip is cut into lobes.
const CEIL_FRAG = (PATCH) => /* glsl */`
uniform float uTime, uOriginZ, uFlash, uSpin, uReliefD, uNightC; uniform vec4 uBayA, uHaze;
uniform vec3 uIndigo, uLip, uSunDir, uSunCol, uShadeCol, uBounce, uFlashPos, uLift;
varying vec3 vW;
${FOGP}${NOISE}${EDGE}${LIP}${PATCH}
float ceilTone(vec2 w){ return 0.62*n2(w/165.0 + 3.0) + 0.38*n2(w/74.0 + 17.0); }
float ceilFar(vec2 w, float k){ float a = n2(w/1350.0 + 4.0); return mix(a, 0.5*a + 0.32*n2(w/610.0 + 19.0) + 0.18*n2(w/270.0 + 41.0), k); }   // the far deck's hanging masses: 600-1,400 m across, no two alike (three unrelated scales: nothing repeats); k: 0 where a pixel is over 60 m of deck along the eye's line (there the two finer scales are drawn out into streaks: only the broad lobes are left)
vec2 ceilAB(vec2 w){ return vec2(abs(2.0*n2(w/250.0 + 3.0) - 1.0), abs(2.0*n2(w/104.0 + 17.0) - 1.0)); }   // 0 along the creases, at two scales
float ceilH(vec2 w, float rnd, float k2){                              // 0 at the bottom of a pouch, 0.65 along a crease (rounded off by rnd: no cusp, and none at all at a grazing angle); k2: 1 near (broad pouches, creased at 100 m), 0 far off from the helix (the 100-200 m lobes carry most of the depth: each hangs by its own amount, and that is what stands in profile)
  vec2 ab = ceilAB(w); ab = sqrt(ab*ab + rnd);
  vec2 hh = sqrt(min(ab*vec2(1.6, 1.7), 1.0));
  return 1.0 - mix(0.3, 0.66, k2)*hh.x - mix(0.7, 0.34, k2)*hh.y;
}
void main(){
  vec2 p = vW.xz, q = p - vec2(0.0, uOriginZ);
  float e = lipE(p), fl = lipFar(p)*vFogDepth;                                                       // the lip: rounded corner, scallops, ragged far bays
  float eF = min(p.y + 5200.0, 3900.0 - p.x*uMX) + 900.0*(n2(p/1500.0 + 4.0) - 0.5) + 400.0*(n2(p/430.0 + 9.0) - 0.5);
  float farK = smoothstep(0.0, 1500.0, eF);                                                          // the far (north, east) edges dissolve over 1.5 km
  float ang = uTime*0.009*uSpin, ca = cos(ang), sa = sin(ang);
  vec2 c = q - vec2(0.0, -150.0), r = vec2(c.x*ca - c.y*sa, c.x*sa + c.y*ca);
  vec2 wv = vec2(fb3(r/290.0 + 1.7 + uTime*0.004), fb3(r/290.0 + 9.2 - uTime*0.003)) - 0.5;
  vec2 w = r + 170.0*wv + uTime*vec2(1.1, -0.7);
  float lump = fb3(r/420.0 + 3.0);
  float t0 = ceilTone(w);
  vec2 s2 = normalize(uSunDir.xz + vec2(1e-4, 0.0)), sr = vec2(s2.x*ca - s2.y*sa, s2.x*sa + s2.y*ca);
  float fwL = max(length(dFdx(p)), length(dFdy(p))), finK = 1.0 - smoothstep(22.0, 60.0, fwL);   // the long axis of a pixel's footprint on the deck: over 22-60 m of it (the deck seen at under about ten degrees) every tone finer than half a kilometre is a streak drawn out along the eye's line, and stands down
  float relief = clamp((t0 - ceilTone(w + sr*55.0))*3.4, -1.0, 1.0)*finK;       // (far field) > 0 on the flank of a billow that faces the low sun
  // the march: rise = metres above the sheet at which the eye ray meets the underside
  vec3 V = normalize(vW - cameraPosition);
  vec2 sXZ = vec2(V.x*ca - V.z*sa, V.x*sa + V.z*ca)/max(V.y, 0.05);         // metres across per metre of rise, in the turned frame
  // FROM THE HELIX the far deck is seen at 3-15 degrees. A flat painted sheet is squeezed into streaks there, whatever
  // is painted on it; what reads at that angle is relief in profile (a 100 m pouch 3 km off stands 30 px tall). So from
  // altitude (hiC) the march keeps its full depth out to the far lip: the ray may run 1,250 m under the sheet (not 320),
  // the depth passes from the broad pouches (a 400 m pouch 4 km off is a streak 50 px by 3) to the 100-200 m lobes, which
  // hang a third deeper there, each by its own amount, and are shaded by height (pale bellies, dark clefts); the broad
  // painted tones, which could only be streaks, are damped, and the grain is sized to the pixel.
  float hiC = smoothstep(110.0, 250.0, cameraPosition.y), farP = 0.0*hiC*smoothstep(450.0, 1400.0, vFogDepth);
  float lodR = 1.0 - smoothstep(1100.0, 2600.0, vFogDepth);   // (beyond 3-4 km a pouch is a few pixels of pale belly over a dark cleft, row on row: scales. There the deck is the painted billows again)
  float amp = 0.45 + 0.8*smoothstep(0.28, 0.7, n2(r/640.0 + 5.5));          // deep pouches in some quarters of the base, shallower in others: never a flat sheet
  amp = mix(amp, 1.3*max(amp, 0.62)*smoothstep(0.26, 0.62, 0.65*n2(r/1150.0 + 2.2) + 0.35*n2(r/380.0 + 14.0)), farP);   // (far off the pouches hang in fields 500-1,500 m across with smooth, billowed deck between them: an unbroken band of them was a strip of scales)
  float graze = 1.0 - smoothstep(0.3, 0.75, V.y), rnd = mix(0.012, 0.03, graze) + 0.035*farP, k2 = 1.0 - farP*(0.3 + 0.7*smoothstep(0.3, 0.7, n2(r/720.0 + 9.0)));   // (far off the small lobes lead in some quarters and the broad pouches in others: no band of one size)   // creases round off as the ray grazes the deck (no hairline folds)
  float jit = h21(gl_FragCoord.xy + 17.0);                                  // the march starts at a per-pixel offset: no contour steps
  float Dn = min(uReliefD*amp*lodR, mix(320.0, 1250.0, farP)/max(length(sXZ), 1e-3));   // a grazing ray never runs more than 320 m (from the helix, far off: 1,250 m): 22 steps resolve the pouches (57 m apart at most)
  vec2 w0 = r + uTime*vec2(1.1, -0.7);
  w0 += farP*(170.0*(vec2(n2(r/560.0 + 21.0), n2(r/560.0 + 43.0)) - 0.5) + 64.0*(vec2(n2(r/170.0 + 5.0), n2(r/170.0 + 31.0)) - 0.5));   // far off the pouches are crowded here and drawn out there (two more scales of noise): uneven sizes, uneven spacing
  float rise = Dn, hP = 0.0, dP = -Dn*ceilH(w0, rnd, k2), found = 0.0, hA = 0.0, dA = -1.0, hB = Dn, dB = 1.0;
  for (int i = 1; i <= 22; i++) {
    float hc = Dn*(float(i) - 0.9*jit)/22.0, df = hc - Dn*ceilH(w0 + sXZ*hc, rnd, k2);
    if (found < 0.5 && df >= 0.0) { hA = hP; dA = dP; hB = hc; dB = df; found = 1.0; }
    hP = hc; dP = df;
  }
  if (found > 0.5) {                                                        // two secant steps inside the bracket
    rise = mix(hA, hB, clamp(-dA/max(dB - dA, 1e-4), 0.0, 1.0));
    float dR = rise - Dn*ceilH(w0 + sXZ*rise, rnd, k2);
    if (dR < 0.0) { hA = rise; dA = dR; } else { hB = rise; dB = dR; }
    rise = mix(hA, hB, clamp(-dA/max(dB - dA, 1e-4), 0.0, 1.0));
    dR = rise - Dn*ceilH(w0 + sXZ*rise, rnd, k2);                           // (a third: far off a step of the march is 57 m, and two left the bellies stair-edged)
    if (dR < 0.0) { hA = rise; dA = dR; } else { hB = rise; dB = dR; }
    rise = mix(hA, hB, clamp(-dA/max(dB - dA, 1e-4), 0.0, 1.0));
  }
  vec2 wh = w0 + sXZ*rise;
  float Hh = ceilH(wh, rnd, k2), relK = Dn/max(uReliefD, 1.0), rk = min(relK*1.4, 1.0);
  vec2 ab = ceilAB(wh);
  float ao = 1.0 - mix(0.3, 0.66, k2)*(1.0 - smoothstep(0.02, 0.4, ab.x)) - mix(0.7, 0.34, k2)*(1.0 - smoothstep(0.02, 0.4, ab.y));   // broad soft shade toward the creases (never a hairline)
  ao = mix(ao, smoothstep(0.1, 1.0, 1.2 - 1.3*Hh), 0.45*farP);                                      // (far off from the helix: by height, the hanging bellies pale and the clefts between them dark)
  ao = mix(ao, 0.5 + 0.5*ao, 0.7*graze*(1.0 - farP));                                    // ... least of all where the deck is seen at a grazing angle and the shade is squeezed into lines
  vec2 gH = vec2(ceilH(wh + vec2(9.0, 0.0), rnd, k2) - Hh, ceilH(wh + vec2(0.0, 9.0), rnd, k2) - Hh)/9.0;
  float Lg = log2(max(vFogDepth*0.0135/21.0, 1.0)), l0g = floor(Lg), sg0 = 21.0*exp2(l0g);   // the grain is never finer than about 5 px: 21 m within 1.5 km, doubling with distance (two sizes cross-faded)
  vec2 bmp = mix(vec2(n2(wh/sg0 + 2.0), n2(wh/sg0 + 37.0)), vec2(n2(wh/(2.0*sg0) + 2.0), n2(wh/(2.0*sg0) + 37.0)), Lg - l0g) - 0.5;   // the pouches' own cauliflower grain
  vec3 Nr = normalize(vec3(Dn*gH.x + 0.55*bmp.x*rk, -1.0, Dn*gH.y + 0.55*bmp.y*rk));   // the underside's normal (turned frame), facing down
  float fdot = dot(Nr.xz, sr), flank = smoothstep(0.04, 0.72, fdot);          // under the deck the low sun's light comes in level: it takes the flanks that face it
  float wisp = fb3(wh/36.0 + 5.0), dt = fb3(wh/58.0 + 8.0);
  float stri = n2(vec2(r.x/310.0, r.y/42.0) + 9.0);
  float grain = bmp.x + 0.6*(n2(wh/8.5 + 5.0) - 0.5)*(1.0 - smoothstep(500.0, 1300.0, vFogDepth));     // cauliflower grain at 21 and 8.5 m: in the tone as well as the normal, most where the deck is seen at a grazing angle (no satin sheets)
  float tone = mix(0.72 + 0.46*mix(0.5, lump, 0.4 + 0.6*finK) - 0.66*finK*(t0 - 0.5) + 0.04*mix(0.5, stri, finK) + finK*(0.14*(wisp - 0.5) + 0.12*(dt - 0.5)), 0.5 + 0.4*mix(lump, 0.5, 0.7*farP) + (0.36 + 0.34*farP)*(ao - 0.55)*rk + (0.2*(dt - 0.5) + 0.12*(wisp - 0.5) + 0.04*stri)*(1.0 - 0.6*farP) + (0.12 + 0.2*graze + 0.1*farP)*grain, lodR);
  vec3 col = uIndigo*(0.34 + 0.62*tone)*0.92 + uShadeCol*0.05*tone + uBounce*(0.03 - 0.1*Nr.y*ao*ao*relK);   // the sea's turquoise on the bottoms of the pouches
  col *= mix(1.0 - 0.26*max(-relief, 0.0), (0.7 - 0.12*farP + (0.3 + 0.12*farP)*ao)*(1.0 - 0.2*smoothstep(0.1, 0.6, -fdot)), lodR*rk);   // hollows and the flanks turned from the sun are dark
  vec2 sl = uSunDir.xz/max(uSunDir.y, 0.1);
  float pt = clamp((wsPatch(q - sl*620.0) - uPatch.z)/max(1.0 - uPatch.z, 0.01), 0.0, 1.0);
  // THE FAR DECK (beyond the marched pouches, 1.5 km and more) hangs in three or four broad unequal LOBES, 600-1,400 m
  // across: seen at a few degrees a painted tone is a streak, so the masses are drawn the way they would be seen: the
  // lookup slides along the eye's line by each mass's own depth (one step: the near side of a hanging belly swells toward
  // the eye, its far side is hidden); a belly is shaded (the thick of the cloud), the deck between the lobes paler, the
  // flank turned from the low sun dark and the flank that faces it lit along its edge.
  float farS = (1.0 - lodR*rk)*mix(0.4, 1.0, hiC), farD = mix(2.0, 1.0, finK);                 // (twice the shading where the fine tones have stood down)
  vec2 wF = w + sXZ*min(46.0, 380.0/max(length(sXZ), 1e-3))*(ceilFar(w, finK) - 0.5);
  float fh = ceilFar(wF, finK), fhS = ceilFar(wF + sr*210.0, finK), fFl = clamp((fh - fhS)*3.2, -1.0, 1.0), belly = smoothstep(0.34, 0.66, fh);
  col *= 1.0 + farS*(mix(0.42, -0.5, 1.0 - finK)*(belly - 0.55) - 0.3*farD*max(-fFl, 0.0));
  col += uLip*vec3(1.0, 0.8, 0.6)*max(fFl, 0.0)*farS*farD*(0.06 + 0.14*pt)*(0.5 + 0.5*belly);
  col += uLift*(1.3 - tone);                                                                         // (night: the hollows keep a slate-indigo floor, never one clipped blue)
  col += uLip*max(relief, 0.0)*(0.03 + 0.10*pt)*(1.0 - lodR);
  col += uLip*vec3(1.0, 0.8, 0.6)*flank*(0.03 + 0.21*pt + 0.06*farP)*(0.4 + 0.6*ao)*min(relK*1.6, 1.0);        // lit flanks, brightest where a sun patch slides through
  col += uSunCol*vec3(1.0, 0.74, 0.62)*pt*0.11*(0.35 + 0.65*mix(smoothstep(0.3, 0.7, t0), ao*(0.5 + 0.5*flank), lodR))*(0.7 + 0.6*wisp);   // warm bars sliding across the base
  vec2 bq = p - uBayA.xy; float bd = length(bq - uBayA.zw*clamp(dot(bq, uBayA.zw), -320.0, 60.0));
  col *= 1.0 - 0.45*(1.0 - smoothstep(110.0, 330.0, bd));                                           // over the portal's bay and its mouth the base is a dark roof (never a pale patch that reads as sky)
  float rag = 70.0*(n2(p/38.0 + uTime*0.02) - 0.5) + 60.0*(t0 - 0.5)*(1.0 + fl/420.0);
  float er = 0.6*fb3(p/130.0 + 4.0 + uTime*0.006) + 0.4*fb3(p/43.0 - uTime*0.012), e2 = e + rag;   // within a couple of kilometres the last 340 m of the sheet are eaten into puffs and bays 40-130 m across: no clean curve against the sky
  float eat = smoothstep(0.0, 0.2, er - 0.6*(1.0 - smoothstep(0.0, 340.0, e2))*(1.0 - smoothstep(1500.0, 3200.0, vFogDepth)));
  float alpha = smoothstep(0.0, 75.0 + 0.22*fl, e2)*eat*farK;                                       // seen edge-on from kilometres off, the lip dissolves over a wider band ...
  float lipK = exp(-max(e2, 0.0)/(120.0 + 0.2*fl));                                                  // ... and its lit fringe is as wide
  float flK = min(fl/2500.0, 1.0);
  col = mix(col, uLip*mix(vec3(1.0), mix(vec3(1.12, 0.86, 0.58), vec3(0.5, 0.56, 0.7), uNightC), flK)*(0.4 + 0.5*mix(t0, 0.25 + 0.75*ao, lodR) + 0.3*max(relief, 0.0))*(1.0 + 0.9*flK)*(1.0 + lodR*(0.75*(wisp - 0.5) + 0.6*(dt - 0.5) + 0.5*(bmp.x + bmp.y))), min(lipK*(0.8 + 0.5*flK), 1.0));   // the far lip, back-lit by the open sky, glows
  float sd = max(dot(V, uSunDir), 0.0);
  col += uSunCol*(1.4*pow(sd, 220.0) + 0.3*pow(sd, 40.0) + 0.12*pow(sd, 8.0))*(0.3 + 0.7*lipK);
  col += vec3(0.5, 0.62, 1.0)*uFlash*exp(-length(p - uFlashPos.xz)/380.0)*(0.3 + 1.1*lump)*(0.6 + 0.6*ao);
  col = mix(col, uHaze.rgb, max(fogK()*uHaze.a, 1.0 - smoothstep(0.0, 2600.0, eF)));                 // toward its far edges the sheet is haze (by night the moon haze of the sky's own horizon, and more of it: no dark band over the horizon)
  gl_FragColor = vec4(col*alpha, alpha);
}
`;
// Rain curtains: three or four (five in a squall) separate curtains of unequal breadth and darkness hanging from the
// base 1.5-3.4 km north of the line: one broad slate curtain behind the sisters, a thin pale one on the open side, far
// ones nearly lost in haze. Each is a SOFT VEIL, not a pane and not a comb: densest right under the base and in its own
// heart, thinning as it falls (half as dense half-way down) to nothing above the sea, its lower edge a feather 150-300 m
// deep that hangs lower in some reaches than in others, its flanks grading over hundreds of metres (no outline anywhere).
// Inside it lie fall streaks, faint (a fifth of the veil's own density at most), fine, leaning with the mesh and a
// little more, each of its own length; they fade where a strand falls under two pixels, where the curtain is seen
// nearly along its own plane and inside 400 m. All curtains lean one way (uLean, in the vertex shader). Its top takes the
// base's own tone and haze at its distance: the mesh ends at the sheet's height and is drawn AFTER the ceiling, so the far
// deck is seen behind it. Thin rain is never brighter than the sky behind it.
const SHAFT_VERT = /* glsl */`
attribute float aSeed, aW, aK; uniform float uTime; uniform vec2 uLean;
varying vec2 vUv, vXZ; varying float vSeed, vM, vK, vW, vObl, vBroad, vFogDepth;
void main(){
  vUv = uv; vSeed = aSeed; vM = uv.x*aW; vW = aW; vXZ = position.xz; vBroad = smoothstep(2250.0, 2460.0, aW);   // (the broad one is known by its breadth: a squall's heavier, narrower curtains are veils like the rest)
  vec3 p = position; float k = 1.0 - uv.y; k *= sqrt(max(k, 0.0));
  p.xz += uLean*k*(0.8 + 0.4*fract(aSeed*5.3) + 0.06*sin(uTime*0.11 + aSeed*9.0));       // the foot trails downwind of the cloud it fell from
  vec2 nr = position.xz - vec2(0.0, -1000.0), vd = p.xz - cameraPosition.xz;   // the sheet's normal is radial from (0, -1000) (the lean shears it: the same normal); the eye's line is to the LEANED point
  vObl = smoothstep(0.14, 0.55, abs(dot(nr/max(length(nr), 1.0), vd/max(length(vd), 1.0))));   // seen along its own plane a curtain fades out: never a slab on edge
  vK = aK*vObl;
  vec4 mv = modelViewMatrix*vec4(p, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const SHAFT_FRAG = /* glsl */`
uniform float uTime, uFogAmt, uAlpha; uniform vec3 uRain, uRainLit, uRainSun; uniform vec2 uSunAz;
varying vec2 vUv, vXZ; varying float vSeed, vM, vK, vW, vObl, vBroad;
${FOGP}${NOISE}${EDGE}${LIP}
void main(){
  float s = vUv.x, v = vUv.y, x = abs(2.0*s - 1.0), fwm = fwidth(vM);
  float wob = n2(vec2(v*2.3 + vSeed*13.0, vSeed*7.0 + uTime*0.015)) - 0.5;                 // the flanks wander as they fall
  float fray = 0.6*n2(vec2(vM/170.0 + vSeed*13.0, 2.0 + uTime*0.01)) + 0.4*mix(n2(vec2(vM/55.0 - vSeed*29.0, 5.0)), 0.5, 0.8*smoothstep(900.0, 1700.0, vFogDepth));   // reaches 50-170 m broad hang lower or higher than their neighbours
  // the shape: full breadth under the cloud, 0.6 of it at the foot, and across it a bell: dense only in its heart, grading
  // away over the outer two thirds (300-900 m), its rim wandering with height
  float hw = 0.9*mix(0.6, 1.0, smoothstep(0.0, 0.62, v));
  float rim = x/hw + 0.34*(n2(vec2(vM/260.0 + vSeed*3.0, v*2.6 + vSeed*5.0)) - 0.5) + 0.16*wob + 0.12*(fray - 0.5);
  float prof = (1.0 - smoothstep(0.08, 1.0, rim))*(1.0 - smoothstep(0.86, 1.0, x));         // (zero at the mesh's own ends, whatever the noise)
  prof *= prof*(3.0 - 2.0*prof);                                                            // (a bell with long soft tails: the broad curtain's, 3 km across)
  // Every other curtain (0.6-2 km across) is a VEIL WITH FEATHERED FLANKS. The bell above, at their breadth, fell from
  // full to nothing inside 60 m where the rim's noise ran with it, and the lower edge (keyed to the same body) fell with
  // it: a pane of slate with a ruled end, seen from the top of the helix. Here the rim wanders half as far over twice
  // the length, the density is the square of ONE smoothstep across the whole half-breadth (a third of the breadth is
  // heart, the rest a feather 200-400 m deep that the sky shows through), and it is nothing well before the mesh ends.
  float rimN = 0.8*x/hw + 0.15*(n2(vec2(vM/520.0 + vSeed*3.0, v*1.3 + vSeed*5.0)) - 0.5) + 0.08*wob + 0.05*(fray - 0.5);
  float pN = (1.0 - smoothstep(0.0, 1.0, rimN))*(1.0 - smoothstep(0.45, 0.95, x));          // (nothing left of it over the last twentieth of the mesh: no seam where a curtain ends)
  prof = mix(pN*pN, prof, vBroad);
  float dens = 0.62 + 0.38*n2(vec2(vM/470.0 + vSeed*17.0, 1.5 + 0.7*v));                  // broad slow change inside it: heavier and lighter reaches, no columns
  float flD = lipFar(vXZ)*vFogDepth;
  float inC = smoothstep(-120.0, 700.0, lipSoft(vXZ) + 300.0*(fray - 0.5))*smoothstep(150.0 + 0.3*flD, 800.0 + 0.5*flD, lipE(vXZ));   // rain falls only from solid cloud, well inside the torn lip and its lit fringe (graded over 650 m and more: no cut end) ...
  inC *= smoothstep(0.0, 1500.0, min(vXZ.y + 5200.0, 3900.0 - vXZ.x*uMX));               // ... and thins where the sheet's far edges melt into haze
  float body = prof*dens*inC;
  // it thins as it falls: all of it under the base, half of it half-way down, a seventh near the sea
  float fall = smoothstep(0.0, 0.9, v);
  float mass = body*mix(mix(0.14, 0.62, vBroad), 1.0, fall*sqrt(fall));                    // (the broad curtain behind the line of sisters stays half as dense to just above the sea: the tubes' lower thirds are ivory on slate too, not pale on pale haze)
  // the lower edge: a deep feather (a quarter to a half of the fall), lower in the curtain's heart, higher on its flanks
  // (virga), and uneven along it at 330, 170 and 55 m
  float vb = max((mix(mix(0.38, 0.52, vBroad), 0.05, smoothstep(mix(0.02, 0.08, vBroad), mix(0.6, 0.7, vBroad), body)) + 0.3*(n2(vec2(vM/330.0 + vSeed*11.0, 3.0)) - 0.5) + 0.26*(fray - 0.5))*mix(1.0, 0.25, vBroad), 0.03);
  float trail = smoothstep(vb - 0.03, vb + mix(0.42, 0.15, vBroad), v);                   // (the broad one's feather is shallower: its foot hangs just above the horizon, still uneven, still soft)
  // fall streaks inside the veil: bundles 70 m, strands 26 m and threads 9 m across (the finest only while they are two
  // pixels and more), slanting a little more than the curtain leans, each fading in and out along its own length
  float fineK = 1.0 - smoothstep(2.0, 6.0, fwm), midK = 1.0 - smoothstep(6.0, 18.0, fwm);
  float sl = vM + 46.0*(1.0 - v);
  float sA = n2(vec2(sl/70.0 + vSeed*5.0, 0.45*v + uTime*0.012)), sB = n2(vec2(sl/26.0 + vSeed*31.0, 1.1*v + uTime*0.03 + vSeed)), sC = n2(vec2(sl/9.0 + vSeed*17.0, 2.3*v + uTime*0.06));
  float str = 0.34*sA + 0.38*mix(0.5, sB, midK) + 0.28*mix(0.5, sC, fineK);
  float stK = 0.28*vObl*vObl*smoothstep(250.0, 700.0, vFogDepth);                          // how much of the veil the streaks may take: none edge-on or close to
  stK *= (0.15 + 0.85*smoothstep(0.42, 0.66, n2(vec2(vM/310.0 + vSeed*7.0, 0.6*v + 3.0 + uTime*0.008))))*mix(1.0, 0.55, smoothstep(1200.0, 1900.0, vFogDepth));   // ... and they hang in bunches 150-300 m across with plain veil between (an even row of them was a comb), fainter in the far curtains
  float veil = mass*trail*mix(1.0, 0.45 + 1.1*smoothstep(0.22, 0.78, str), stK);
  float hiK = smoothstep(150.0, 290.0, cameraPosition.y);
  float top = (1.0 - smoothstep(mix(0.94, 0.8, hiK), 1.0, v + mix(0.05, 0.14, hiK)*(fray - 0.5)))*(1.0 - smoothstep(0.96, 1.0, v));   // the top melts into the base it hangs from (from the helix a little sooner: the far deck is thin haze there)
  float al = min(1.0 - exp(-3.6*veil), 0.9)*top*uAlpha*vK*smoothstep(150.0, 420.0, vFogDepth);
  vec2 dv = vXZ - vec2(0.0, -1000.0); dv /= max(length(dv), 1.0);
  float sunK = 0.5 + 0.5*dot(dv, uSunAz); sunK *= sunK;
  float upK = smoothstep(0.5, 0.95, v);
  vec3 col = mix(uRain*(0.93 + 0.14*str), uRainLit, 0.9*upK);                             // toward its top it takes the base's own tone ...
  col = mix(col, uRainSun, (0.05 + 0.4*sunK)*(0.35 + 0.65*dens)*smoothstep(0.1, 0.45, mass)*(1.0 - 0.6*smoothstep(0.3, 1.0, mass)));   // rain toward the sun (the moon) lets the light through; thin rain takes none: never a bright slit
  col = mix(col, uRainSun, 0.22*(1.0 - smoothstep(0.3, 0.72, str))*stK*(0.4 + 0.6*sunK)*smoothstep(0.1, 0.4, mass));   // between the streaks the veil is a little lighter: depth, not one tone
  float eF = min(vXZ.y + 5200.0, 3900.0 - vXZ.x*uMX);
  col = mix(col, fogColor, max(fogK()*mix(mix(uFogAmt, 0.5, upK), mix(0.9, 0.58, max(hiK, 0.8*vBroad)), smoothstep(1900.0, 3300.0, vFogDepth)), upK*(1.0 - smoothstep(0.0, 2600.0, eF))));   // ... and the base's own share of haze (so it hangs from the deck at its distance, never darker than what it hangs from); the far curtains are paler: they step back
  gl_FragColor = vec4(col*al, al);
}
`;
// Scud and the portal's grotto: billowed cloud cards. Each card is a cluster of six sphere-shaded lobes (a cauliflower
// head) with noise-torn edges, lit top-down by the sun in the card's own frame, warm-rimmed toward the sun, and kept
// level with the horizon when the camera banks.
// iA centre + orbit radius, iB angle0, angular speed, size, seed, iC drift x,z, period, lit, iD height/width,
// near-fade (in sizes), portal glow (or -1: a card that hangs under the base and melts into it), bob.
const SCUD_VERT = /* glsl */`
attribute vec4 iA, iB, iC, iD; uniform float uTime; uniform vec3 uSunDir;
varying vec2 vUv, vC; varying vec3 vLv; varying vec4 vS; varying float vFogDepth;
void main(){
  float a = iB.x + iB.y*uTime;
  vec3 c = iA.xyz + vec3(cos(a), 0.0, sin(a))*iA.w;
  float fr = iC.z > 0.0 ? fract(uTime/max(iC.z, 1.0) + iB.w) : 0.5;
  c.xz += iC.xy*(fr - 0.5)*iC.z;
  c.y += 0.12*iD.w*iB.z*sin(uTime*0.21 + iB.w*40.0);
  vec4 mv = viewMatrix*vec4(c, 1.0);
  float fade = (iC.z > 0.0 ? sin(3.14159*fr) : 1.0)*smoothstep(0.3*iD.y*iB.z, iD.y*iB.z, -mv.z);
  vec2 up = (viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xy; float ul = length(up);
  up = ul > 0.05 ? up/ul : vec2(0.0, 1.0);
  vec2 rt = vec2(up.y, -up.x);
  mv.xy += (rt*position.x + up*position.y*iD.x)*iB.z;
  vUv = position.xy*2.0; vS = vec4(iB.w, fade, iC.w, iD.z); vC = c.xz;
  vec3 lv = (viewMatrix*vec4(uSunDir, 0.0)).xyz;
  vLv = vec3(dot(lv.xy, rt), dot(lv.xy, up), lv.z);
  vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const SCUD_FRAG = /* glsl */`
uniform float uTime, uOpacity, uSoft, uFarMix, uBarK; uniform vec3 uShadeCol, uIndigo, uLip, uRim, uGlowCol; uniform vec4 uBar; uniform vec2 uBarO;
varying vec2 vUv, vC; varying vec3 vLv; varying vec4 vS;
${FOGP}${NOISE}
void main(){
  vec2 p = vUv; float seed = vS.x, lit = vS.z, hang = step(vS.w, -0.5);
  float n = fb3(p*1.6 + seed*37.0 + uTime*0.085);
  float nf = n2(p*4.7 - seed*19.0 - uTime*0.13);
  float nh = n2(p*11.0 + seed*3.0 + uTime*0.05), nh2 = n2(p*9.0 - seed*7.0 + 29.0);
  vec2 pw = p + 0.2*(vec2(n, nf) - 0.5) + 0.05*(vec2(nh, nh2) - 0.5);
  float hs = 0.0, ws = 1e-4, cov = 0.0; vec3 Ns = vec3(0.0, 0.0, 1e-4);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), k = fract(seed*7.31 + fi*0.618);
    float a = fi*1.2566 + seed*40.0 + 0.6*sin(seed*91.0 + fi*2.3) + 0.2*sin(uTime*0.31 + fi*1.9 + seed*9.0);
    float rr = i == 5 ? 0.56 : 0.30 + 0.15*k;
    vec2 c = i == 5 ? vec2(0.0) : vec2(cos(a), sin(a))*(0.53 - 0.12*k);
    vec2 d = (pw - c)/rr; float q = 1.0 - dot(d, d), qq = max(q, 0.0);
    float h = rr*sqrt(qq), w = h*h; w *= w;
    hs += w*h; ws += w; Ns += w*vec3(d, sqrt(qq)); cov = max(cov, q);
  }
  float h = hs/ws;
  float e = cov - 0.5*(1.0 - 1.25*n) - 0.15*(1.0 - nf) - 0.09*(1.0 - nh);
  float al = smoothstep(0.0, mix(0.5, 0.85, uSoft), e)*vS.y*(1.0 - smoothstep(0.8, 1.0, dot(p, p)))*(1.0 - 0.9*hang*smoothstep(-0.15, 0.75, p.y));   // open scud has a soft, thin rim
  vec2 bump = vec2(n2(p*3.1 + seed*5.0 + 11.0), n2(p*3.1 + seed*5.0 + 47.0)) - 0.5;
  vec3 N = normalize(vec3(Ns.xy/ws + 0.8*bump + 0.45*(vec2(nh, nh2) - 0.5), Ns.z/ws + 0.25));
  vec3 L = normalize(vLv + vec3(0.0, 1e-4, 0.0));
  float wrap = clamp(dot(N, L)*0.62 + 0.38, 0.0, 1.0);
  float ao = smoothstep(0.02, 0.4, h);
  float lk = min(lit, 1.0);
  vec3 dark = uIndigo*(0.72 + 0.4*n)*(0.6 + 0.4*ao)*mix(0.6, 1.0, smoothstep(0.0, 0.45, lk)) + uShadeCol*(0.02 + 0.07*lk);   // open scud is no darker than the base; the hollow is
  vec3 col = mix(dark, uLip*vec3(1.04, 0.88, 0.68)*(0.7 + 0.3*n), pow(wrap, 3.0 - 1.4*lk)*lk*(0.4 + 0.6*ao));   // sheltered cloud takes the sun on its crowns only
  float lxy = max(length(L.xy), 0.05), nxy = max(length(N.xy), 0.05);
  float rim = 1.0 - N.z; rim *= rim;
  float thin = 1.0 - smoothstep(0.05, 0.6, e);
  col += uRim*(rim + 0.5*thin)*clamp(dot(N.xy, L.xy)/(lxy*nxy)*0.8 + 0.35, 0.0, 1.0)*(0.12 + 1.4*lk)*smoothstep(-0.3, 0.2, L.z);   // gold rim on the sun side
  float back = clamp(-L.z, 0.0, 1.0);
  col = mix(col, uLip*1.05, back*back*(0.4*(1.0 - 0.8*hang) + 0.4*thin*thin*(0.4 + 1.2*n))*min(1.0, lit*2.2));   // against the sun it glows through                // silver lining when the sun is behind it
  col = mix(col, uIndigo*(0.74 + 0.1*n), 0.5*hang*smoothstep(-0.2, 0.6, p.y));               // a hanging rag has no top: it dissolves upward into the base it hangs from
  col += uGlowCol*max(vS.w, 0.0)*(0.35 + 0.65*ao)*(0.4 + 0.6*N.z);                         // the lantern's light on the grotto
  float bt = (dot(vC - uBarO, uBar.xy) - uBar.z - 22.0*sin(uTime*0.17))/max(uBar.w, 1.0);   // the bar of sun that lies across the mouth of the portal's bay (the same bar as on the bay itself)
  col += uRim*uBarK*exp(-bt*bt)*(0.25 + 0.75*wrap)*(0.45 + 0.55*ao)*(1.0 - 0.7*hang*smoothstep(-0.2, 0.6, p.y));
  float farK = uFarMix*smoothstep(250.0, 1100.0, vFogDepth);                               // (the grotto and its rags) from the entry they are a lowered bay of the same cloud:
  col = mix(col, uIndigo*(1.15 + 0.2*n) + uLip*0.14, 0.7*farK);                             // the base's own tone, and half the weight
  col = mix(col, fogColor, fogK()*0.5);
  gl_FragColor = vec4(col*al, al)*(uOpacity*(1.0 - 0.5*farK));
}
`;
// The lantern: a soft additive glow in the portal's plane. Far off it fills the ring; close in it clears the opening.
const HALO_VERT = /* glsl */`
varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }
`;
const HALO_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uTime, uR, uFar, uVis; varying vec2 vP;
${NOISE}
void main(){
  float rl = length(vP), r = rl/uR;
  vec2 dir = vP/max(rl, 1e-3);
  float ray = 0.78 + 0.22*n2(dir*2.6 + uTime*0.5) + 0.07*sin(uTime*1.7) + 0.05*sin(uTime*3.1 + r*4.0);
  float core = 1.0 - smoothstep(0.15, 1.12, r);
  float halo = exp(-max(r - 1.0, 0.0)*1.15)*smoothstep(0.7, 1.02, r), wide = 0.16*exp(-max(r - 1.0, 0.0)*0.5);
  float a = (0.95*core*uFar + halo*(0.5 + 0.4*uFar) + wide)*ray*uVis*(1.0 - smoothstep(2.8, 3.6, r));
  gl_FragColor = vec4(uCol*a, 1.0);
}
`;
// Birds: iA orbit centre + radius, iB angle0, rad/s, size (half span, m), seed, iC mode (0 keyed to the flight,
// 1 free soaring, 2 plunge-diving round the vessel, 3 escort: iA = its place in the group (metres ahead, to starboard
// and above the group's centre uEscC, which leads us along our route, on a ring of its own through the helix, heading
// uEscF) + weave in metres), encounter second, bank,
// white breast 0..1. For an escort iC.y is 0 (one of the inner three) or +-1 (one of the outer two, and its side).
// uEscK = the inner three (how far they have peeled away 0..1, the side they peel to, gone 0..1, metres dropped astern);
// uEscW = the outer two (how far they have opened out 0..1, peeled 0..1, gone 0..1, metres astern).
const BIRD_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aW; attribute vec4 iA, iB, iC;
uniform float uTime, uTb, uPx, uEscWide; uniform vec3 uShip, uEscC, uEscF; uniform vec4 uEscK, uEscW; uniform vec2 uFlap;
varying vec3 vN, vCol, vLocal, vWP; varying float vFogDepth;
void main(){
  float mode = iC.x, seed = iB.w;
  float tt = mode < 0.5 ? (uTb - iC.y) : uTime;
  float a = iB.x + iB.y*tt;
  vec3 c = iA.xyz; float fold = 0.0, amp = uFlap.x;
  float hgt = c.y + 1.2*sin(uTime*0.5 + seed*30.0);
  if (mode > 1.5) {
    c.xz += uShip.xz;
    float ph = fract(uTime/9.0 + seed), dive = smoothstep(0.62, 0.74, ph), up = smoothstep(0.80, 1.0, ph);   // (each on its own nine-second round of the clock: circle, fold, plunge, climb away)
    hgt = c.y*(1.0 - dive + up) - 2.5*dive*(1.0 - up);
    fold = dive*(1.0 - smoothstep(0.76, 0.84, ph)); amp = mix(max(amp, 0.25), 0.75, up*(1.0 - up)*4.0);
  }
  vec3 pos = vec3(c.x + cos(a)*iA.w, hgt, c.z + sin(a)*iA.w);
  float sg = iB.y < 0.0 ? -1.0 : 1.0;
  vec3 f = normalize(mix(vec3(-sin(a), 0.0, cos(a))*sg, vec3(0.0, -1.0, 0.0), 0.88*fold));
  float esc = step(2.5, mode), outer = esc*abs(iC.y), sideE = mix(uEscK.y, -sign(iC.y), outer);   // (an outer escort peels to its own side)
  float pk = mix(uEscK.x, uEscW.y, outer)*esc, open = outer*uEscW.x;
  if (mode > 2.5) {                                                    // escorts: they hold station ahead of the wing round the last of the helix, weaving, then peel away outward and down
    vec3 de = normalize(uEscF + vec3(0.0, 0.0, 1e-5)), sde = normalize(cross(de, vec3(0.0, 1.0, 0.0)));
    float wv = uTime*0.5 + seed*30.0, pq = pk*pk;
    pos = uEscC + de*(iA.x - mix(uEscK.w, uEscW.w, outer)) + sde*(iA.y + sign(iC.y)*uEscWide*open + iA.w*sin(wv) - sideE*(55.0 + 50.0*seed)*pq) + vec3(0.0, iA.z + 0.3*iA.w*sin(wv*0.63 + 1.0) - (12.0 + 22.0*seed)*pq, 0.0);
    f = normalize(vec3(de.x, 0.0, de.z)/max(length(de.xz), 1e-3) + sde*(0.22*cos(wv) - sideE*1.3*pk*(1.0 - 0.5*pk)) + vec3(0.0, 0.08 - 0.35*pk*(1.0 - 0.5*pk), 0.0)); sg = 1.0;   // level in the inflow that lifts them: we see the whole planform, not a wing on edge
  }
  vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0))), u = cross(r, f);
  float bk = iC.z*sg*(1.0 - open) + 0.16*sin(uTime*0.9 + seed*40.0) + 0.07*sin(uTime*2.3 + seed*17.0) + sideE*0.6*pk*(1.0 - 0.5*pk);   // (on the last straight the outer two level their wings)
  vec3 r2 = r*cos(bk) + u*sin(bk), u2 = cross(r2, f);
  vec3 lp = position; vec3 ln = normal;
  if (aW.x > 0.5) {
    float sx = abs(lp.x), w = uTime*uFlap.y*6.2832 + seed*20.0;
    // (escorts carry their wings in a deep M: from astern a bird, not a stroke)
    float th = 0.12 + 0.22*esc + amp*sin(w), th2 = -0.22 - 0.3*esc + amp*sin(w - 0.9);
    lp.y += sin(th)*min(sx, 0.45) + sin(th2)*max(sx - 0.45, 0.0);
    lp.z += fold*sx*sx*1.5; lp.x *= mix(1.0, 0.58, fold);                 // the dive: wings half closed and swept back to an arrowhead (a bird at any angle; narrower, it was a lozenge)
    // a wing seen on edge is never a hairline: the mid-chord row lifts and the edges drop until it is 1.5 px thick
    lp.y += (position.y > 0.016 ? 1.0 : -1.0)*min(0.75*uPx*distance(pos, cameraPosition)/max(iB.z, 0.1), 0.09);
  }
  float seen = (mode > 0.5 && mode < 1.5) ? 1.0 - smoothstep(55.0, 95.0, cameraPosition.y - pos.y) : 1.0 - mix(uEscK.z, uEscW.z, outer)*esc;   // one of the free stack 60-100 m and more below the eye is a pale smudge on the spray: it folds away as we climb past it
  vec3 wp = pos + iB.z*seen*(r2*lp.x + u2*lp.y - f*lp.z);
  vN = normalize(r2*ln.x + u2*ln.y - f*ln.z);
  vCol = mix(aCol, vec3(0.78, 0.76, 0.7), iC.w*aW.y);
  if (mode > 1.5 && mode < 2.5) vCol = mix(vCol, vec3(0.05, 0.05, 0.06), smoothstep(0.5, 0.9, abs(position.x))*aW.x);   // the divers' dark wingtips
  vLocal = position; vWP = wp;
  vec4 mv = viewMatrix*vec4(wp, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const LIT_FRAG_HEAD = /* glsl */`
uniform vec3 uSunDir, uSunCol, uShadeCol, uBounce; uniform float uKey; varying vec3 vWP;
${FOGP}
vec3 faceN(vec3 n){ vec3 N = normalize(n); return dot(N, vWP - cameraPosition) > 0.0 ? -N : N; }
vec3 litCol(vec3 alb, vec3 N, float two){
  float df = max(dot(N, uSunDir), 0.0);
  float lt = mix(df, 0.3 + 0.7*abs(dot(N, uSunDir)), two);
  return alb*(uSunCol*uKey*lt + uShadeCol*(0.5 + 0.25*N.y) + uBounce*max(-N.y, 0.0)*0.7*exp(-max(vWP.y, 0.0)/120.0));   // the sea's turquoise bounce dies out with height: birds under the base stay dark
}
`;
const BIRD_FRAG = /* glsl */`
varying vec3 vN, vCol, vLocal;
${LIT_FRAG_HEAD}
void main(){
  vec3 N = faceN(vN);
  float barb = 0.96 + 0.04*sin(vLocal.x*70.0 + vLocal.z*18.0);                       // (stronger, a folded wing seen from above was a striped slab)
  vec3 col = litCol(vCol*barb, N, 0.0);
  col += uSunCol*uKey*0.16*pow(max(dot(N, normalize(uSunDir + vec3(0.0, 1.0, 0.0))), 0.0), 12.0);
  gl_FragColor = vec4(mix(col, fogColor, fogK()), 1.0);
}
`;
// Flying fish: iA launch x,z + heading, iB launch second (brief time), speed, size, seed. They leave and re-enter the sea.
const FISH_COMMON = /* glsl */`
attribute vec4 iA, iB; uniform float uTime, uTb, uSeaY;
vec3 fishPos(out float on, out float hop, out float pitch){
  float tau = uTb - iB.x, seed = iB.w, life = 2.4 + seed*0.9;
  float Ts = 0.8 + 0.5*fract(seed*7.3);
  float ph = 3.14159*tau/Ts;
  hop = abs(sin(ph));
  float env = step(0.0, tau)*step(tau, life)*smoothstep(0.0, 0.16, tau)*(1.0 - smoothstep(life - 0.22, life, tau));
  on = env;
  pitch = 0.4*cos(ph)*(sin(ph) < 0.0 ? -1.0 : 1.0);
  vec2 xz = iA.xy + iA.zw*iB.y*max(tau, 0.0) + vec2(-iA.w, iA.z)*0.7*sin(tau*2.1 + seed*30.0);
  return vec3(xz.x, uSeaY - 0.9 + env*(1.05 + (0.5 + 1.4*fract(seed*3.1))*pow(hop, 0.7)), xz.y);
}
`;
const FISH_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aW;
varying vec3 vN, vCol, vWP; varying float vGl, vFogDepth;
${FISH_COMMON}
void main(){
  float on, hop, pitch; vec3 pos = fishPos(on, hop, pitch);
  vec3 f = normalize(vec3(iA.z*cos(pitch), sin(pitch), iA.w*cos(pitch)));
  vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0))), u = cross(r, f);
  vec3 lp = position;
  lp.y += aW.x*abs(lp.x)*(0.22 + 0.16*sin(uTime*44.0 + iB.w*50.0));
  lp.x += (1.0 - aW.x)*0.05*sin(uTime*30.0 + lp.z*9.0 + iB.w*20.0)*smoothstep(-0.1, 0.5, lp.z);
  vec3 wp = pos + iB.z*on*(r*lp.x + u*lp.y - f*lp.z);
  vN = normalize(r*normal.x + u*normal.y - f*normal.z);
  vCol = aCol; vWP = wp; vGl = (0.25 + 0.75*aW.x)*pow(0.5 + 0.5*sin(uTime*23.0 + iB.w*90.0 + lp.x*3.0), 4.0);
  vec4 mv = viewMatrix*vec4(wp, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const FISH_FRAG = /* glsl */`
varying vec3 vN, vCol; varying float vGl;
${LIT_FRAG_HEAD}
void main(){
  vec3 N = faceN(vN);
  vec3 col = litCol(vCol, N, 0.6) + uSunCol*uKey*0.9*vGl;
  gl_FragColor = vec4(mix(col, fogColor, fogK()), 1.0);
}
`;
const STREAK_VERT = /* glsl */`
uniform float uPx;
varying vec2 vUv; varying float vA, vSd, vFogDepth;
${FISH_COMMON}
void main(){
  float on, hop, pitch; vec3 pos = fishPos(on, hop, pitch);
  float dd = distance(pos, cameraPosition);
  float w = max(0.42*iB.z, 1.3*uPx*dd), len = 2.6 + 0.8*fract(iB.w*11.0);
  vec2 xz = pos.xz - iA.zw*(position.y*len) + vec2(-iA.w, iA.z)*position.x*w;
  vUv = position.xy; vSd = iB.w; vA = on*(0.3 + 0.7*pow(1.0 - hop, 1.2))*min(1.0, 0.42*iB.z/max(1.3*uPx*dd, 1e-4));
  vec4 mv = viewMatrix*vec4(xz.x, uSeaY + 0.12, xz.y, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const STREAK_FRAG = /* glsl */`
uniform vec3 uFoamLit; varying vec2 vUv; varying float vA, vSd;
${FOGP}
float mark(vec2 q, float yc, float ly, float wx){ vec2 d = vec2(q.x/wx, (q.y - yc)/ly); return 1.0 - smoothstep(0.35, 1.0, dot(d, d)); }
void main(){
  // two or three splash marks where the tail last struck, each smaller than the one before: not a dashed line
  float j1 = fract(vSd*7.3), j2 = fract(vSd*13.7), j3 = fract(vSd*23.1);
  vec2 q = vec2(vUv.x + 0.1*(j2 - 0.5), vUv.y);
  float m = mark(q, 0.10 + 0.07*j1, 0.11, 0.42) + 0.8*mark(q + vec2(0.12*(j1 - 0.5), 0.0), 0.42 + 0.14*j2, 0.085, 0.30) + 0.6*step(0.35, j3)*mark(q - vec2(0.14*(j3 - 0.5), 0.0), 0.76 + 0.12*j3, 0.06, 0.2);
  float al = vA*min(m, 1.0)*0.8*(1.0 - fogK());
  gl_FragColor = vec4(uFoamLit*al, al);
}
`;
// Vessel: aLine = ribbon tangent + signed half width (kept >= 0.8 px wide near to, 0.5 px beyond 170 m), aFlex = cloth amplitude + phase.
const SHIP_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aLine; attribute vec2 aFlex;
uniform float uTime, uPx;
varying vec3 vN, vCol, vWP, vLp; varying float vTwo, vRope, vFogDepth;
void main(){
  vLp = position; vRope = 0.0;
  vec3 lp = position + normal*aFlex.x*(0.5*sin(uTime*4.2 + aFlex.y + position.y*0.55) + 0.2*sin(uTime*7.1 + aFlex.y*1.7));
  vec4 wp = modelMatrix*vec4(lp, 1.0);
  if (abs(aLine.w) > 0.0) {
    vec3 tw = normalize(mat3(modelMatrix)*aLine.xyz);
    vec3 vd = wp.xyz - cameraPosition; float dd = max(length(vd), 1e-3);
    vec3 sd = cross(tw, vd/dd); float sl = length(sd);
    sd = sl > 1e-4 ? sd/sl : vec3(0.0, 1.0, 0.0);
    float farR = smoothstep(90.0, 170.0, dd);                                      // far off a rope is half a pixel of tan, not a black bar
    wp.xyz += sd*(aLine.w < 0.0 ? -1.0 : 1.0)*max(abs(aLine.w), mix(0.8, 0.5, farR)*uPx*dd);
    vRope = 1.0 + farR;
  }
  vN = normalize(mat3(modelMatrix)*normal); vCol = aCol; vTwo = step(0.001, aFlex.x); vWP = wp.xyz;
  vec4 mv = viewMatrix*wp; vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
// Canvas (vTwo = 1) is weathered tan-bark: darker at the foot and in blotches, faint cloths and seams, a little bleached;
// where the sun stands behind a sail it glows through, warmer and brighter than its lit face.
const SHIP_FRAG = /* glsl */`
varying vec3 vN, vCol, vLp; varying float vTwo, vRope; uniform vec3 uSailFar;
${LIT_FRAG_HEAD}${NOISE}
void main(){
  vec3 N = faceN(vN);
  vec3 col = litCol(vCol, N, 0.0);
  if (vRope > 0.5) {                                                                 // rigging: fine tan line that takes the low sun whatever way its ribbon faces, and melts into what lies behind it far off
    col = vCol*(uSunCol*uKey*0.55 + uShadeCol*0.6);
    col = mix(col, mix(uSailFar, fogColor, 0.45), 0.6*clamp(vRope - 1.0, 0.0, 1.0));
  }
  if (vTwo > 0.5) {
    float hgt = smoothstep(2.0, 23.0, vLp.y);
    float blot = n2(vLp.zy*0.3 + 3.0), grain = n2(vLp.zy*vec2(2.3, 0.7) + 11.0);
    float seam = 0.5 + 0.5*sin(vLp.z*5.2 + 0.25*vLp.y + 1.5*blot);
    float reef = 1.0 - 0.2*smoothstep(0.84, 0.92, abs(fract(vLp.y*0.21 + 0.03*sin(vLp.z*1.3)) - 0.5)*2.0);   // reef bands
    vec3 alb = vCol*(0.56 + 0.46*hgt)*(0.7 + 0.5*blot)*(0.92 + 0.14*grain)*(1.0 - 0.22*smoothstep(0.84, 0.99, seam))*mix(1.0, reef, smoothstep(0.0, 0.3, hgt)*(1.0 - smoothstep(0.5, 0.8, hgt)));
    alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.55, 0.15)))*vec3(1.18, 0.93, 0.7), 0.36);
    float ndl = dot(N, uSunDir), thru = max(-ndl, 0.0);
    float lt = 0.22 + 0.66*max(ndl, 0.0) + 0.9*thru*(0.75 + 0.5*blot);
    col = alb*(uSunCol*uKey*lt*mix(vec3(1.0), vec3(1.14, 0.84, 0.6), smoothstep(0.0, 0.35, thru)) + uShadeCol*(0.5 + 0.25*N.y) + uBounce*max(-N.y, 0.0)*0.7);
  }
  gl_FragColor = vec4(mix(col, fogColor, fogK()), 1.0);
}
`;
// Wake: uv.x across (-1..1), uv.y metres astern of the stem. A V of two bow-wave crests that leave the stem and open
// to 40 m either side 150 m astern, each a thin white line that breaks into dashes and curls from about 30 m astern,
// feathered inward by the diverging wavelets that run along it; the marbled track of aerated water from her quarters
// aft, thinning and holed; foam down her sides and the "bone" at the stem. All of it is drawn out along the flow (soft,
// long noise: no blots), pale green where it thins; by night silver, with blue-green fire in the cores of the foam.
const WAKE_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW; varying float vFogDepth;
void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix*wp; vFogDepth = -mv.z; gl_Position = projectionMatrix*mv; }
`;
const WAKE_FRAG = /* glsl */`
uniform float uTime, uLen, uBeam, uPhosK; uniform vec3 uFoam, uPhos;
varying vec2 vUv; varying vec3 vW;
${FOGP}${NOISE}
void main(){
  float sx = vUv.x, x = abs(sx), m = vUv.y, mp = max(m, 0.0);
  float hw = uBeam*0.8 + 0.3*mp, xs = sx*hw, xm = abs(xs);                     // metres off the centre line
  float nearK = 1.0 - smoothstep(0.3, 1.6, length(fwidth(vW.xz)));
  float nz = fb3(vec2(xs*0.2, m*0.045 - uTime*0.22) + 3.0);                    // billows 5 m across, 20 m long
  float nz2 = fb3(vec2(xs*0.5 + 7.0, m*0.13 - uTime*0.5));                     // streaks 2 m across, 8 m long
  float mrb = 0.55*nz2 + 0.45*fb3(vW.xz*0.42 + uTime*vec2(0.06, 0.04));
  float marb = smoothstep(0.24, 0.76, mrb), marbT = smoothstep(0.42, 0.78, mrb);   // marbT: the track's tighter marbling, so it thins and holes astern
  // the two bow-wave crests and their inward feather of wavelets
  float curl = n2(vec2(m*0.1 - uTime*0.55, 3.0 + 4.0*step(0.0, sx)));                  // each arm curls on its own after about 40 m
  float xc = 0.9 + 0.27*mp + 2.5*(nz - 0.5)*smoothstep(8.0, 60.0, mp) + 3.4*(curl - 0.5)*smoothstep(0.875*uLen, 2.34375*uLen, mp), cwd = 0.75 + 0.011*mp;
  float fwW = length(fwidth(vW.xz)), cw2 = max(cwd, 0.8*fwW);                  // (a crest is never drawn thinner than the pixel it falls in: the V holds 300 m off, fainter)
  float dx = (xm - xc)/cw2;
  float crest = exp(-dx*dx)*(0.62 + 0.5*nz2)*sqrt(cwd/cw2);
  crest *= mix(1.0, smoothstep(0.36, 0.6, n2(vec2(m*0.3 - uTime*1.5, xs*0.7) + 5.0)), smoothstep(0.8125*uLen, 2.1875*uLen, mp));   // thin crests that break into dashes astern (from 26 m behind the schooner, 13 m behind a skiff)
  float wav = 0.5 + 0.5*sin(0.9*(m - 2.6*xm) - uTime*3.0 + 4.0*nz);
  float feather = smoothstep(0.42*xc, xc, xm)*(1.0 - smoothstep(xc, xc + 2.2*cwd, xm));
  float decay = 0.1 + 0.9*exp(-mp/(uLen*2.4));
  float armK = (crest + feather*(0.16 + 0.62*wav*wav*marb))*decay;
  // the track astern: aerated water boiling up behind the counter, marbled, widening slowly
  float tw = uBeam*(0.5 + 0.007*mp), aft = max(m - uLen, 0.0);
  float track = (1.0 - smoothstep(0.3*tw, tw, xm + 0.5*tw*(nz - 0.5)))*smoothstep(uLen*0.5, uLen*0.92, m);
  float trackK = track*(0.06 + 0.94*marbT)*(0.42 + 0.58*exp(-aft/18.0))*exp(-aft/(uLen*2.3))*1.25;
  // foam sliding down her sides, and the bone in her teeth
  float side = (1.0 - smoothstep(0.5*uBeam, 0.5*uBeam + 2.2 + 2.0*nz2, xm))*smoothstep(0.0, 6.0, m)*(1.0 - smoothstep(uLen*0.5, uLen*1.0, m))*(0.35 + 0.65*marb);
  float bone = exp(-(m - 2.0)*(m - 2.0)/(uLen*0.9))*(1.0 - smoothstep(0.6, 3.4 + 0.3*mp, xm))*(0.75 + 0.25*nz2)*(0.8 + 0.2*sin(uTime*0.9 + 0.5))*smoothstep(-3.0, -0.5, m);
  float f = (armK + trackK + 0.7*side)*smoothstep(-2.0, 2.5, m) + bone;
  f *= mix(1.0, 0.6 + 0.6*marb, 0.5*nearK*(1.0 - bone));
  float endK = 1.0 - smoothstep(uLen*3.8, uLen*5.1, m + 0.3*uLen*(nz - 0.5));
  float al = clamp(f, 0.0, 0.93)*endK*(1.0 - smoothstep(0.9, 1.0, x));
  vec3 tint = mix(vec3(0.5, 0.86, 0.8), vec3(1.0), smoothstep(0.18, 0.6, f));    // thin foam is aerated green water
  vec3 col = (uFoam*tint*(0.9 + 0.18*nz2) + uPhos*uPhosK*(0.6 + 1.0*nz2)*smoothstep(0.3, 0.85, f))*al;   // by night the fire burns in the cores of the foam
  gl_FragColor = vec4(mix(col, fogColor*al, fogK()), al);
}
`;
// Bow spray: soft sprites thrown off the stem on short ballistic arcs, most of them to leeward, heaviest as the bow
// drives down into a sea (the same phase as the vessel's pitch). The mesh rides at the vessel's place and heading.
// iS = seed, side (-1 or +1 across), throw 0..1, size (m). position.xy = the sprite's corner.
const SPRAY_VERT = /* glsl */`
attribute vec4 iS; uniform float uTime, uPh, uLen; uniform vec3 uSunDir;
varying vec2 vUv; varying vec3 vK; varying vec2 vL; varying float vFogDepth;
void main(){
  float sd = iS.x, a = fract(sd*7.31), b = fract(sd*13.7), c = fract(sd*29.3);
  float ks = sqrt(clamp(uLen/32.0, 0.25, 1.0));                                  // a 16 m skiff throws her spray 4 m, not over her yard
  float vy = (6.5 + 6.0*iS.z)*ks, T = 2.0*vy/9.8 + 0.25;
  float cyc = uTime/T + sd*5.0, t = fract(cyc), tt = t*T;
  float seq = floor(cyc); a = fract(a + 0.37*seq); b = fract(b + 0.61*seq);
  float arg = (uTime - tt)*0.9 + uPh;                                           // the pitch at the moment this drop left the stem
  float env = 0.42 + 0.58*smoothstep(-0.5, 0.8, -sin(arg + 0.5));
  vec3 p = vec3(iS.y*(0.4 + 0.9*a), 0.5, -0.5*uLen + 0.6 + 2.6*b);
  p += vec3(iS.y*(1.6 + 3.2*a)*(0.5 + 0.5*iS.z), vy, 1.2 + 3.6*c - 1.5*iS.z)*tt;
  p.x += iS.y*0.6*tt*tt; p.y -= 4.9*tt*tt; p.z += 1.1*tt*tt;                    // falls, and the wind carries it aft and to leeward
  p.y = max(p.y, 0.25);
  float size = iS.w*(0.55 + 1.9*t)*(0.7 + 0.5*env);
  vec4 mv = modelViewMatrix*vec4(p, 1.0);
  mv.xy += position.xy*size;
  vUv = position.xy*2.0;
  vK = vec3(env*smoothstep(0.0, 0.07, t)*pow(1.0 - t, 1.3), sd, t);
  vL = normalize((viewMatrix*vec4(uSunDir, 0.0)).xy + vec2(1e-4, 0.0));
  vFogDepth = -mv.z; gl_Position = projectionMatrix*mv;
}
`;
const SPRAY_FRAG = /* glsl */`
uniform float uTime, uPhosK; uniform vec3 uFoam, uSunCol, uShade, uPhos;
varying vec2 vUv; varying vec3 vK; varying vec2 vL;
${FOGP}${NOISE}
void main(){
  float r = length(vUv);
  float n = n2(vUv*2.3 + vK.y*37.0 + vec2(0.0, -uTime*0.8)), nf = n2(vUv*6.5 - vK.y*19.0 + uTime*0.6);
  float body = (1.0 - smoothstep(0.15, 0.95, r + 0.45*(n - 0.5) + 0.2*(nf - 0.5)));
  float drops = smoothstep(0.62, 0.86, nf)*(1.0 - smoothstep(0.5, 1.0, r))*vK.z;          // it breaks into drops as it falls
  float al = clamp(body*(0.5 + 0.5*n)*mix(1.0, 0.55, vK.z) + 0.7*drops, 0.0, 1.0)*vK.x*0.8*(1.0 - smoothstep(0.92, 1.0, r));
  float sun = clamp(0.55 + 0.6*dot(vUv, vL), 0.0, 1.0);                                     // the low sun catches the side toward it
  vec3 col = mix(uShade, uFoam, 0.35 + 0.65*sun) + uSunCol*0.3*sun*sun*(0.4 + 0.6*n) + uPhos*uPhosK*(0.5 + 0.8*nf);
  gl_FragColor = vec4(mix(col, fogColor, fogK())*al, al);
}
`;

// ---------------------------------------------------------------- 3. builders
// A soaring sea bird, half span = 1, nose toward -Z. kind: 'frigate' (W wings, forked tail) | 'booby' | 'tern'.
function birdGeometry(kind) {
  const P = [], N = [], K = [], W = [], I = [];
  const dark = kind === 'frigate' ? [0.035, 0.035, 0.045] : kind === 'booby' ? [0.10, 0.075, 0.055] : [0.62, 0.64, 0.66];
  const pale = kind === 'frigate' ? [0.11, 0.09, 0.08] : [0.74, 0.73, 0.69];
  const tipC = kind === 'frigate' ? [0.02, 0.02, 0.03] : [0.05, 0.05, 0.06];
  const v = (x, y, z, n, c, w, s) => { P.push(x, y, z); N.push(n[0], n[1], n[2]); K.push(c[0], c[1], c[2]); W.push(w, s); return P.length / 3 - 1; };
  // body: a lofted spindle with bill, head, breast and tail root (breast flagged with aW.y = 1 for the white variant)
  const prof = kind === 'frigate'
    ? [[-0.5, 0.004, 0.0], [-0.4, 0.016, 0.0], [-0.33, 0.04, 0.0], [-0.24, 0.05, 0.01], [-0.1, 0.075, -0.012], [0.08, 0.07, -0.01], [0.26, 0.04, 0.0], [0.4, 0.014, 0.0]]
    : [[-0.42, 0.004, 0.0], [-0.33, 0.02, 0.0], [-0.27, 0.05, 0.0], [-0.2, 0.06, 0.008], [-0.06, 0.1, -0.015], [0.12, 0.095, -0.012], [0.3, 0.05, 0.0], [0.44, 0.012, 0.0]];
  const SID = 6, ring = [];
  for (let i = 0; i < prof.length; i++) {
    const [z, r, dy] = prof[i], row = [];
    for (let j = 0; j < SID; j++) {
      const a = (j / SID) * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a);
      const bill = i < 2, belly = cy < -0.3 && i >= 3 && i <= 5;
      const c = bill ? (kind === 'frigate' ? [0.3, 0.3, 0.33] : [0.75, 0.6, 0.2]) : kind === 'frigate' ? (belly && i === 3 ? [0.5, 0.05, 0.04] : dark) : (kind === 'booby' && i > 5 ? dark : pale);
      row.push(v(cx * r * 0.85, cy * r + dy, z, [cx, cy, 0], c, 0, belly ? 1 : 0));
    }
    ring.push(row);
  }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < SID; j++) {
    const a = ring[i][j], b = ring[i][(j + 1) % SID], c = ring[i + 1][j], d = ring[i + 1][(j + 1) % SID];
    I.push(a, c, b, b, c, d);
  }
  // wings: leading edge / trailing edge stations along the span (x, zLE, zTE); a pale bar on the inner coverts
  const st = kind === 'frigate'
    ? [[0.05, -0.17, 0.1], [0.25, -0.235, 0.05], [0.45, -0.27, -0.02], [0.72, -0.1, 0.07], [1.0, 0.16, 0.19]]
    : [[0.06, -0.15, 0.1], [0.3, -0.19, 0.08], [0.5, -0.2, 0.04], [0.78, -0.1, 0.08], [1.0, 0.04, 0.07]];
  for (const s of [-1, 1]) {
    const rows = st.map(([x, zl, zt], k) => {
      const zm = lerp(zl, zt, 0.45), cov = k < 3 ? pale : dark, out = k >= 3 ? tipC : dark;
      return [v(s * x, 0.012, zl, [0, 1, 0], kind === 'frigate' ? dark : out, 1, 0), v(s * x, 0.02, zm, [0, 1, 0], kind === 'frigate' ? cov : (k >= 3 ? tipC : pale), 1, 0), v(s * x, 0.0, zt, [0, 1, 0], out, 1, 0)];
    });
    for (let k = 0; k < rows.length - 1; k++) for (let m = 0; m < 2; m++) I.push(rows[k][m], rows[k + 1][m], rows[k][m + 1], rows[k][m + 1], rows[k + 1][m], rows[k + 1][m + 1]);
  }
  // tail: two long streamers (frigate) or a wedge
  if (kind === 'frigate') for (const s of [-1, 1]) { const a = v(s * 0.012, 0, 0.36, [0, 1, 0], dark, 0, 0), b = v(s * 0.05, 0, 0.38, [0, 1, 0], dark, 0, 0), c = v(s * 0.15, 0, 0.98, [0, 1, 0], tipC, 0, 0); I.push(a, b, c); }
  else { const a = v(-0.035, 0, 0.4, [0, 1, 0], dark, 0, 0), b = v(0.035, 0, 0.4, [0, 1, 0], dark, 0, 0), c = v(0.0, 0, kind === 'tern' ? 0.78 : 0.66, [0, 1, 0], tipC, 0, 0); I.push(a, b, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(K, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  g.setIndex(I);
  return g;
}
// A flying fish, length 1, nose toward -Z, two long pectoral wings and a forked tail.
function fishGeometry() {
  const P = [], N = [], K = [], W = [], I = [];
  const v = (x, y, z, n, c, w) => { P.push(x, y, z); N.push(n[0], n[1], n[2]); K.push(c[0], c[1], c[2]); W.push(w, 0); return P.length / 3 - 1; };
  const prof = [[-0.5, 0.004], [-0.4, 0.06], [-0.18, 0.1], [0.12, 0.08], [0.38, 0.026]], ring = [];
  for (const [z, r] of prof) { const row = []; for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2 + 0.3, cx = Math.cos(a), cy = Math.sin(a); row.push(v(cx * r * 0.75, cy * r, z, [cx, cy, 0], cy > 0.2 ? [0.12, 0.24, 0.4] : [0.8, 0.82, 0.82], 0)); } ring.push(row); }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < 5; j++) { const a = ring[i][j], b = ring[i][(j + 1) % 5], c = ring[i + 1][j], d = ring[i + 1][(j + 1) % 5]; I.push(a, c, b, b, c, d); }
  const wc = [0.34, 0.46, 0.58], wt = [0.18, 0.3, 0.44];
  for (const s of [-1, 1]) {
    const a = v(s * 0.05, 0.02, -0.26, [0, 1, 0], wc, 1), b = v(s * 0.44, 0.02, 0.08, [0, 1, 0], wt, 1), c = v(s * 0.34, 0.02, 0.22, [0, 1, 0], wt, 1), d = v(s * 0.05, 0.02, -0.06, [0, 1, 0], wc, 1);
    I.push(a, b, c, a, c, d);
    const e = v(s * 0.03, 0.0, 0.12, [0, 1, 0], wc, 1), f = v(s * 0.26, 0.0, 0.3, [0, 1, 0], wt, 1), h = v(s * 0.03, 0.0, 0.26, [0, 1, 0], wc, 1); I.push(e, f, h);
  }
  const t0 = v(0, 0.0, 0.36, [1, 0, 0], [0.2, 0.3, 0.44], 0), t1 = v(0, 0.13, 0.56, [1, 0, 0], [0.2, 0.3, 0.44], 0), t2 = v(0, 0.0, 0.46, [1, 0, 0], [0.2, 0.3, 0.44], 0), t3 = v(0, -0.2, 0.6, [1, 0, 0], [0.2, 0.3, 0.44], 0);
  I.push(t0, t1, t2, t0, t2, t3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(K, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  g.setIndex(I);
  return g;
}
// The vessel. kind: 'schooner' (32 m gaff schooner, reefed tan-bark sails) | 'ketch' (bare poles, furled tan-bark,
// storm jib) | 'skiff' (16 m, one tan lug sail). Local frame: bow toward -Z, +Y up, waterline y = 0, lee = sign of
// local x that is the leeward side (sails are boomed out that way).
function buildVessel(kind, accent, lee) {
  const S = kind === 'schooner' ? { L: 32, B: 6.6, masts: [[-5.5, 27, 9.5], [4.5, 30, 12]], sails: true, sprit: true }
    : kind === 'ketch' ? { L: 26, B: 6.0, masts: [[-3.5, 27, 9], [8, 17, 6]], sails: false, sprit: true }
      : { L: 16, B: 4.4, masts: [[-1.8, 16.5, 9]], sails: true, sprit: false };
  const L = S.L, k = Math.pow(L / 32, 0.7);
  const P = [], N = [], K = [], LN = [], FX = [], I = [];
  const pa = V3(), pb = V3(), pc = V3(), pd = V3(), pe = V3(), nn = V3(), UP = V3(0, 1, 0);
  const vert = (p, n, c, ln, f) => {
    P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); K.push(c.r, c.g, c.b);
    if (ln) LN.push(ln[0], ln[1], ln[2], ln[3]); else LN.push(0, 0, 0, 0);
    if (f) FX.push(f[0], f[1]); else FX.push(0, 0);
    return P.length / 3 - 1;
  };
  // generic grid surface: f(u, v, out) position, colF(u, v) colour, flexF(u, v) -> [amplitude, phase], nF(u, v, out) normal
  const grid = (nu, nv, f, colF, flexF, nF) => {
    const base = P.length / 3, e = 2e-3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      if (nF) nF(u, v, nn);
      else {
        f(Math.min(u + e, 1), v, pb); f(Math.max(u - e, 0), v, pc); f(u, Math.min(v + e, 1), pd); f(u, Math.max(v - e, 0), pe);
        nn.crossVectors(pb.sub(pc), pd.sub(pe));
      }
      if (nn.lengthSq() < 1e-12) nn.set(0, 1, 0); else nn.normalize();
      f(u, v, pa);
      vert(pa, nn, colF(u, v), null, flexF ? flexF(u, v) : null);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  };
  const tube = (A, Bq, r0, r1, col, sides = 6) => {
    const ax = new THREE.Vector3().subVectors(Bq, A), d = ax.clone().normalize();
    const e1 = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? V3(1, 0, 0) : UP).normalize(), e2 = new THREE.Vector3().crossVectors(d, e1);
    grid(sides, 1, (u, v, out) => { const a = u * Math.PI * 2, r = lerp(r0, r1, v); return out.copy(A).addScaledVector(ax, v).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r); }, () => col, null,
      (u, v, out) => { const a = u * Math.PI * 2; return out.set(0, 0, 0).addScaledVector(e1, Math.cos(a)).addScaledVector(e2, Math.sin(a)); });
  };
  const line = (A, Bq, w, col) => {
    const t = new THREE.Vector3().subVectors(Bq, A).normalize(), h = w / 2;
    const a = vert(A, UP, col, [t.x, t.y, t.z, h]), b = vert(A, UP, col, [t.x, t.y, t.z, -h]), c = vert(Bq, UP, col, [t.x, t.y, t.z, h]), d = vert(Bq, UP, col, [t.x, t.y, t.z, -h]);
    I.push(a, b, c, b, d, c);
  };
  const hullC = C('#d9d2c0'), redC = C('#7a2418'), bootC = C('#ece8dc'), railC = C('#3a2a1c'), deckC = C('#a88a5e'), deckD = C('#8a6f48'), sparC = C('#b08a52'), ropeC = C('#b39f78'), houseC = C('#e4dccb');
  const sail = accent.clone().multiplyScalar(0.95), sailD = accent.clone().multiplyScalar(0.87), sailT = accent.clone().lerp(C('#e8a070'), 0.35);
  // ---- hull, transom, deck
  const hb = (t) => 0.5 * S.B * Math.pow(Math.sin(Math.PI * clamp(0.16 + 0.84 * t, 0, 1)), 0.6);
  const sheer = (t) => (2.0 + 1.3 * t * t + 0.5 * (1 - t) * (1 - t)) * k;
  const keel = (t) => -1.8 * k * (1 - 0.7 * t * t * t * t);
  const hull = (u, v, out) => {
    const a = u * 2 - 1, w = Math.abs(a), sd = a < 0 ? -1 : 1, ky = keel(v), sy = sheer(v), q = Math.pow(w, 1.6);
    return out.set(sd * hb(v) * Math.pow(w, 0.42), ky + (sy - ky) * q, L / 2 - v * L - 1.7 * k * v * v * v * q);
  };
  const hullCol = (u, v) => { const w = Math.abs(u * 2 - 1), y = keel(v) + (sheer(v) - keel(v)) * Math.pow(w, 1.6); return w > 0.95 ? railC : y < 0.12 ? redC : y < 0.55 * k ? bootC : hullC; };
  grid(20, 14, hull, hullCol);
  grid(20, 1, (u, v, out) => { hull(u, 0, out); out.x *= 1 - v; return out; }, () => hullC);
  const deckY = (z) => sheer(clamp((L / 2 - z) / L, 0, 1)) - 0.4 * k;
  grid(4, 14, (u, v, out) => { hull(1, v, out); const a = u * 2 - 1; return out.set(a * hb(v) * 0.96, out.y - 0.4 * k + 0.14 * k * (1 - a * a), out.z); }, (u, v) => (Math.round(v * 14) % 2 ? deckC : deckD));
  const box = (cx, y0, cz, sx, sy, sz, col) => {
    const corner = (u, out, y) => { const q = Math.round(u * 4) % 4, x = q === 0 || q === 3 ? -1 : 1, z = q < 2 ? -1 : 1; return out.set(cx + x * sx / 2, y, cz + z * sz / 2); };
    grid(4, 1, (u, v, out) => corner(u, out, y0 + v * sy), () => col, null, (u, v, out) => { corner(u, out, 0); return out.set(out.x - cx, 0, out.z - cz); });
    grid(1, 1, (u, v, out) => out.set(cx + (u - 0.5) * sx, y0 + sy, cz + (v - 0.5) * sz), () => deckD, null, (u, v, out) => out.set(0, 1, 0));
  };
  if (kind !== 'skiff') { box(0, deckY(1.5), 1.5, 2.3, 1.0, 3.6, houseC); box(0, deckY(-9), -9, 1.6, 0.7, 2.0, houseC); box(0, deckY(L / 2 - 3), L / 2 - 3.2, 1.4, 0.9, 1.2, sparC); }
  else box(0, deckY(2), 2.2, 1.3, 0.45, 1.6, houseC);
  // ---- spars, sails, rigging
  const stemY = sheer(1) + 0.1, spritEnd = V3(0, stemY + 1.5 * k, -L / 2 - 6.5 * k);
  if (S.sprit) tube(V3(0, stemY - 0.2, -L / 2 + 2.5), spritEnd, 0.17 * k, 0.09 * k, sparC);
  const beta = 0.52, db = V3(lee * Math.sin(beta), 0, Math.cos(beta)), sn = V3(lee * Math.cos(beta), 0, -Math.sin(beta));
  const heads = [];
  S.masts.forEach(([zm, h, bl], mi) => {
    const rake = 0.035, top = V3(0, h, zm + rake * h), dy = deckY(zm);
    const at = (y, out = V3()) => out.set(0, y, zm + rake * y + 0.25 * k);
    tube(V3(0, 0, zm), top, 0.27 * k, 0.11 * k, sparC, 7);
    heads.push(top);
    const yb = dy + 1.7 * k, T = at(yb), Cl = T.clone().addScaledVector(db, bl).setY(yb + 0.5 * k);
    tube(T, Cl, 0.13 * k, 0.1 * k, sparC);
    if (S.sails) {
      const yt = yb + (kind === 'skiff' ? 0.62 : 0.5) * h, Th = at(yt), Pk = Th.clone().addScaledVector(db, bl * 0.78).setY(yt + 0.2 * h);
      tube(Th, Pk, 0.09 * k, 0.07 * k, sparC);
      const a0 = V3(), a1 = V3();
      grid(8, 8, (u, v, out) => { a0.lerpVectors(T, Cl, u); a1.lerpVectors(Th, Pk, u); return out.lerpVectors(a0, a1, v).addScaledVector(sn, 0.09 * bl * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.1 + 0.85 * v))); },
        (u, v) => (v > 0.86 ? sailT : Math.round(u * 8) % 2 ? sail : sailD), (u, v) => [0.22 * k * u * (0.4 + 0.6 * v) + 0.001, v * 3 + mi * 2.1]);
      line(Pk, at(Math.min(h * 0.97, yt + 0.42 * h)), 0.06, ropeC);
    } else {
      tube(T.clone().setY(yb + 0.35 * k), Cl.clone().setY(yb + 0.85 * k), 0.34 * k, 0.24 * k, sail, 7);       // furled along the boom
    }
    line(Cl, at(h * 0.93), 0.05, ropeC);                                                   // topping lift
    line(Cl, V3(0, deckY(zm + bl * 0.8), zm + bl * 0.8), 0.06, ropeC);                     // sheet
    for (const s of [-1, 1]) for (const dz of [-0.9, 0.7]) {
      const t = clamp((L / 2 - (zm + dz)) / L, 0, 1);
      line(V3(s * hb(t) * 0.97, sheer(t), zm + dz), at(h * 0.84), 0.055, ropeC);          // shrouds
    }
    // crosstrees and a lantern-sized truck
    tube(V3(-0.9 * k, h * 0.84, zm + rake * h * 0.84), V3(0.9 * k, h * 0.84, zm + rake * h * 0.84), 0.05 * k, 0.05 * k, sparC, 4);
  });
  const fore = S.masts[0], foreHead = V3(0, fore[1] * 0.9, fore[0] + 0.035 * fore[1] * 0.9);
  const stay0 = S.sprit ? spritEnd : V3(0, stemY, -L / 2 + 0.2);
  line(stay0, foreHead, 0.06, ropeC);
  if (heads.length > 1) line(heads[0], heads[1], 0.05, ropeC);
  line(heads[heads.length - 1], V3(0, deckY(L / 2 - 0.6) + 0.3, L / 2 - 0.6), 0.05, ropeC);
  if (S.sprit) line(spritEnd, V3(0, 0.4, -L / 2 + 0.4), 0.06, ropeC);
  if (kind !== 'skiff') {                                                                   // jib (storm jib on the ketch)
    const f = S.sails ? 1 : 0.5, A = stay0.clone().lerp(foreHead, S.sails ? 0.04 : 0.12), Bq = stay0.clone().lerp(foreHead, 0.04 + 0.8 * f);
    const Cc = V3(lee * 1.6 * k, deckY(fore[0] - 2) + 1.4 * k, fore[0] - (S.sails ? 1.5 : 5));
    const a0 = V3();
    grid(6, 6, (u, v, out) => { a0.lerpVectors(A, Bq, u); return out.lerpVectors(a0, Cc, v).addScaledVector(sn, 0.7 * k * f * Math.sin(Math.PI * u) * Math.sin(Math.PI * v)); },
      (u, v) => (Math.round(u * 6) % 2 ? sail : sailD), (u, v) => [0.2 * k * v + 0.001, u * 4 + 5]);
    line(Cc, V3(lee * 1.2, deckY(fore[0] + 3), fore[0] + 3), 0.05, ropeC);
  }
  // pennant at the main truck, streaming to leeward and aft
  const truck = heads[heads.length - 1].clone().setY(heads[heads.length - 1].y + 0.3);
  grid(6, 1, (u, v, out) => out.copy(truck).addScaledVector(db, u * 3.4 * k).setY(truck.y - (v - 0.5) * 0.7 * k * (1 - 0.7 * u)), () => sailT, (u) => [0.5 * k * u + 0.001, u * 5]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(K, 3)); g.setAttribute('aLine', new THREE.Float32BufferAttribute(LN, 4));
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(FX, 2));
  g.setIndex(I);
  // the wake strip: x across (uv.x -1..1), uv.y metres astern of the stem
  const WP = [], WU = [], WI = [], rows = 22;
  for (let j = 0; j <= rows; j++) {
    const m = -3 + Math.pow(j / rows, 1.6) * L * 5.2, hw = S.B * 0.8 + 0.3 * Math.max(m, 0);
    WP.push(-hw, 0, -L / 2 + m, hw, 0, -L / 2 + m); WU.push(-1, m, 1, m);
    if (j < rows) { const a = j * 2; WI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(WP, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(WU, 2)); wg.setIndex(WI);
  return { geometry: g, wake: wg, length: L, beam: S.B, height: Math.max(...S.masts.map((m) => m[1])) };
}

// ---------------------------------------------------------------- 4. the world
export default {
  id: 'waterspout-sisters',
  name: 'The Five Sisters',
  category: 'sky',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3), moodK = clamp(vary.mood ?? 0.5, 0, 1);   // mood (free, 0..1): how many whitecaps from the helix, how deep the deck's pouches
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const tU = { value: 0 }, tbU = { value: 0 }, pxU = { value: 0.003 };

    // ---- A. the seeded looks (always the same draws, whatever ctx.vary asks for)
    const lk = ctx.rng.fork('five-sisters-look-340');
    let hourName = lk.pick(['afternoon', 'noon', 'lastlight', 'afternoon', 'night', 'afternoon', 'lastlight', 'noon']);
    let weatherName = lk.pick(['fair', 'squall', 'fair', 'calm']);
    const castVessel = lk.pick(['schooner', 'ketch', 'schooner', 'skiff']);
    const castBird = lk.pick(['frigate', 'booby', 'frigate', 'tern']);
    const MX = lk.chance(0.35) ? -1 : 1;                                   // the whole course mirrored
    let rare = !!vary.rare;                                                // the sun shower and its double rainbow
    if (vary.hour === 'day') hourName = 'noon';
    else if (vary.hour === 'golden') hourName = hourName === 'lastlight' ? 'lastlight' : 'afternoon';
    else if (vary.hour === 'dawn') hourName = 'lastlight';
    else if (vary.hour === 'night') hourName = 'night';
    if (rare && (vary.hour === 'day' || vary.hour === 'night')) rare = false;             // a viewer's own hour wins: no sun shower at high noon or by moonlight
    if (rare && (hourName === 'noon' || hourName === 'night')) hourName = 'afternoon';   // a rainbow needs a low sun behind us
    if (rare && weatherName === 'calm') weatherName = 'fair';
    const H = HOURS[hourName], Wx = WEATHERS[weatherName], night = hourName === 'night';
    const mx = (x, y, z) => V3(x * MX, y, z);
    const seaHor = H.sea.horizon ? (Wx.calm && hourName === 'lastlight' ? '#' + C(H.sea.horizon).lerp(C(H.sky.horizon), 0.72).getHexString() : H.sea.horizon) : null;   // the sea's far colour (a calm sea at last light mirrors the sky's apricot out there: no maroon band under the horizon)

    // ---- B. sky, light rig, fog
    const sunAz = -112.5 * MX;                                             // west-south-west, behind the left wing at entry
    const sunDir = skyDirection(H.elev, sunAz).clone().normalize();
    const nightGround = '#' + C(H.sky.horizon).lerp(C(H.fog[0]), 0.3).multiplyScalar(1.3 * 0.92).getHexString();   // (by night the dome is baked, so its colour below the horizon is set here, once: the far sea's own moon haze, `farLow` in E. The sea's raw far colour there was a dark hairline between the sea's rim and the sky)
    const skyOpts = { rng: ctx.rng, clouds: false, clouds2: false, ...H.sky, ground: night ? nightGround : seaHor || H.sky.horizon, groundFalloff: night ? 500 : 30, renderer: ctx.renderer };   // (by night the dome takes that colour within a pixel of the horizon: the sea ends at the camera's far plane, a pixel or two short of the horizon, and the dome's own dark there was a hairline)   // (below the horizon the dome is the sea's own far colour: from the helix the sea's rim, 6.8 km out, is lost in it)
    if (night) skyOpts.bodyOverrides = { 0: { elevation: H.elev, azimuth: sunAz, size: 2.6, phase: 1, intensity: 1.1, glow: 0.3 } };
    else { skyOpts.sunElevation = H.elev; skyOpts.sunAzimuth = sunAz; }
    await ctx.yield();
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    const fogCol = C(H.fog[0]);
    if (Wx.squall) fogCol.lerp(C(H.rain), 0.25);
    scene.fog = new THREE.FogExp2(fogCol, H.fog[1] * Wx.fogK);
    const rig = makeLightRig(sky, { bounce: 0.45 }); scene.add(rig.object);
    const sunBase = rig.sun.intensity;
    const sunCol = C(H.key[0], H.key[1]), shadeCol = C(H.shade[0], H.shade[1]), ambCol = C(H.sky.ambientColor, night ? 0.5 : 0.55);
    const bounceCol = C(H.pal[0], 0.3), foamLit = C('#f2f5f0', 0.8).multiply(C(H.key[0]).lerp(C('#ffffff'), 0.5)), foamShade = C(H.shade[0]).lerp(C('#c8d4e4'), 0.45).multiplyScalar(0.8);
    if (hourName === 'lastlight') foamShade.lerp(foamLit, 0.5);            // (at last light foam under the cloud keeps half the lit foam's apricot-white: lilac-grey foam over jade was a muddy streak)
    const indigo = C(H.pal[4]).lerp(C(H.pal[5]), 0.28).multiplyScalar(0.92);   // the same mix the hero's collars use
    const litU = () => ({ ...fogU(), uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uShadeCol: { value: ambCol }, uBounce: { value: bounceCol }, uKey: { value: 1 } });
    await ctx.yield();

    // ---- D (first half). the path: built before the hero so its timeline can be mapped onto it
    const pts = [mx(0, 12, RUN_IN), mx(0, 12, -50), mx(0, 12, -200), mx(-35, 35, -380), mx(40, 35, -610), mx(-5, 30, -840), mx(-30, 30, -1150)];
    for (let k = 1; k <= 15; k++) { const a = (k / 15) * 2.5 * Math.PI, R = lerp(100, 85, k / 15); pts.push(mx(70 - R * Math.cos(a), lerp(30, HELIX_TOP, k / 15), -1150 - R * Math.sin(a))); }
    const app0 = pts[pts.length - 1].clone(), seat = mx(70 + EXIT_LEN * Math.cos(EXIT_PITCH), HELIX_TOP + EXIT_LEN * Math.sin(EXIT_PITCH), -1235);
    pts.push(app0.clone().lerp(seat, 0.2), app0.clone().lerp(seat, 0.45), app0.clone().lerp(seat, 0.72), seat);
    const path = makePath(pts), PL = path.length, DUR = Math.round(PL / 50);   // the brief's 50 m/s over the route's own length, to the whole second: the flight's duration (`pace` only shapes it)
    const BL = BRIEF_PL - RUN_IN;
    const B = (ub) => (RUN_IN + ub * BL) / PL;                             // the brief's progress -> this path's u
    const TB = (u) => ((u * PL - RUN_IN) / BL) * BRIEF_SEC;                 // this path's u -> the brief's seconds (runs past 44 on the long exit)
    const U = (u0) => (u0 * BRIEF_PL) / PL;                                // a u on the brief's route -> this path's u

    // ---- C. the hero: six sisters, their collars, stains and the portal bay
    const hero = await buildHero(ctx, {
      palette: H.pal, mood: H.hero, sunDir, mirror: MX < 0, seat: [seat.x * MX, seat.y, seat.z - ORIGIN_Z], approach: [app0.x * MX, app0.y, app0.z - ORIGIN_Z], ...(H.heroShadow ? { shadowColor: C(H.heroShadow[0], H.heroShadow[1]) } : {}), ...(H.heroSun ? { sunColor: C(H.heroSun[0], H.heroSun[1]) } : {}), seaY: Wx.lift + 0.22, patchMin: night ? 0.62 : 0.5,
      timeline: { thin: B(0.26), kink: B(0.30), rope: B(0.386), gone: B(0.455), spot: B(0.34), ring: B(0.43), finger: B(0.50), down: B(0.74) },
    });
    hero.object.position.set(0, 0, ORIGIN_Z); scene.add(hero.object);
    hero.setProgress(0);
    for (const i of [0, 1, 2, 4]) hero.setLife(i, { foot: 3 });            // standing sisters: the tube runs down inside its spray sheath
    const S5 = mx(70, 0, -1150);
    await ctx.yield();

    // ---- D (second half). where the gaze goes
    const vesselSpeed = castVessel === 'skiff' ? 8 : 6;
    const vesselAt = (u, out) => out.set((74 + vesselSpeed * (TB(u) - 11.24)) * MX, 14, -558);
    const _poiA = V3(), _poiB = V3(), _poiG = V3(), _poiS = V3(), _sp4 = new THREE.Vector4();
    // THE BANK FOLLOWS THE ROUTE. The engine banks the camera by one number for the whole flight (camera.bank). The slalom
    // wants 2; on the helix, where the horizon is seen all the way round, 2 rolls it 30 degrees and the deck reads as a slab
    // hung at an angle. So camera.bank is an object whose valueOf() follows the metres flown (`bankAt`, below the places
    // it steps at). The engine works out the bank before it calls update(), so u comes from a poi the engine asks for in
    // the same step: it points where the camera already looks, at weight 0.004.
    let bankU = 0;
    await ctx.yield();
    // THE HELIX ON THE ROUTE, in metres flown: its first metre (the route's nearest point to the brief's (-30, 30, -1150),
    // due west of S5) and its last (nearest to where the last straight begins, due north of her).
    const routeNear = (target, d0, d1) => { let best = 1e9, at = d0; for (let d = d0; d <= d1; d += 2) { const e = path.posAtDist(d, _poiG).distanceTo(target); if (e < best) { best = e; at = d; } } return at; };
    const helixD = routeNear(pts[6], 0, PL), helixE = routeNear(app0, helixD, PL);
    // THE OTHER PLACES THE ROUTE PASSES, each found by walking it every 2 m (route metres, whatever the seed's mirror):
    // `lipD` where the lens crosses the cloud's shadow line, `abeamD[i]` where the route runs nearest the foot of sister
    // i in plan (S1 to S4), `vesselD` where the lens crosses the line the vessel sails along, `northD` and `southD` where,
    // on the helix, the lens first stands due north and due south of S5.
    const firstPast = (z) => { for (let d = 0; d <= helixD; d += 2) if (path.posAtDist(d, _poiG).z <= z) return d; return helixD; };
    const abeamD = [0, 1, 2, 3].map((i) => { const f = hero.sisters[i].home; let best = 1e9, at = 0; for (let d = 0; d <= helixD; d += 2) { path.posAtDist(d, _poiG); const e = Math.hypot(_poiG.x - f.x, _poiG.z - f.y - ORIGIN_Z); if (e < best) { best = e; at = d; } } return at; });
    const lipD = firstPast(LIP_Z), vesselD = firstPast(vesselAt(0, _poiA).z);
    const dueOfS5 = (sgn) => { let px = 0; for (let d = helixD; d <= helixE; d += 2) { path.posAtDist(d, _poiG); const ex = _poiG.x - S5.x; if (d > helixD && (_poiG.z - S5.z) * sgn > 0 && ex * px <= 0) return d; px = ex; } return helixE; };
    const northD = dueOfS5(-1), southD = dueOfS5(1);
    await ctx.yield();
    // S5 COMES INTO THE GAZE where, on the run north, her axis bears S5_OFF degrees off the route's heading: `s5From`,
    // found on the route at steps of 2.5 m before the helix.
    const S5_OFF = 30;
    let s5From = helixD;
    for (let d = helixD; d > helixD - 400; d -= 2.5) {
      path.posAtDist(d, _poiG); path.tangentAtDist(d, _poiS); _poiA.set(S5.x - _poiG.x, 0, S5.z - _poiG.z).normalize(); _poiS.y = 0; _poiS.normalize();
      s5From = d; if (_poiA.dot(_poiS) > Math.cos(S5_OFF * Math.PI / 180)) break;
    }
    // THE LANTERN CLEARS THE FUNNEL'S EDGE: from the lens the line to the portal's seat passes S5's axis; where it passes
    // wide of her wall at that height by her bend's own wander (the brief's 30 m) and stays wide to the end of the helix,
    // the lantern is clear (`clearD`, route metres; eyes every 2.5 m back from the helix's last metre).
    const S5_WANDER = 30;
    let clearD = helixE;
    for (let d = helixE; d > helixD; d -= 2.5) {
      path.posAtDist(d, _poiG); _poiA.copy(seat).sub(_poiG);
      const hl = Math.hypot(_poiA.x, _poiA.z), t = clamp(((S5.x - _poiG.x) * _poiA.x + (S5.z - _poiG.z) * _poiA.z) / (hl * hl), 0, 1);
      const miss = Math.hypot(_poiG.x + _poiA.x * t - S5.x, _poiG.z + _poiA.z * t - S5.z), rWall = hero.spineAt(4, _poiG.y + _poiA.y * t, _sp4).w;
      if (miss < rWall + S5_WANDER) break;
      clearD = d;
    }
    // THE BANK'S STEPS, each at a place of the route: 2 through the slalom, 1.15 from the helix's first metre (`helixD`),
    // 0.95 from where the lens first stands due north of S5 (`northD`, a quarter turn on) and 0.25 from where the lantern
    // clears her funnel (`clearD`: there the gaze begins to pitch up to it). Each step is eased over the BANK_RUN metres
    // of route before its place, so that the new bank holds from the place on.
    const BANK_RUN = 150;
    const bankStep = (place, d) => smoothstep(place - BANK_RUN, place, d);
    const bankAt = (u) => { const d = u * PL; return lerp(lerp(lerp(2, 1.15, bankStep(helixD, d)), 0.95, bankStep(northD, d)), 0.25, bankStep(clearD, d)); };
    await ctx.yield();
    // THE GAZE. Every pull stands alone by its own weight (none over 1, no two on one thing, none scaled for the steady
    // camera); how fast the gaze moves from one to the next is the breadth of their fades. ON THE SLALOM each pull's
    // window runs between two places of the route: S1 from the cloud's shadow line (`lipD`) to S1 abeam; the vessel from
    // S1 abeam to the line she sails along (`vesselD`); S2 from S1 abeam to S2 abeam; the big sister's wall from 20 m past
    // S2 abeam to S3 abeam; the thin sister by the site's own entry (typed shares). ON THE HELIX ONE PULL, on S5's own axis, for the whole of
    // it: it comes on from `s5From` on the run north, rising over S5_EASE metres of route (all of them before the helix's
    // first metre), holds round the helix and falls over the last S5_EASE metres before the helix's last metre. The point
    // of her axis it pulls to lies BELOW THE TRACK by S5_DROP of the track's own height above the sea: 7.5 m under it at
    // the helix's first metre (30 m up), 71 m under it at the last (285 m up). (A DEPARTURE FROM THE BRIEF, which has it
    // at the lens's own height: lowered so, the gaze looks down her outside to her spray crown and the sea as we climb.)
    // The other sisters, the reef and the newborn wheel across by themselves as the route turns. FROM WHERE THE LANTERN
    // CLEARS HER FUNNEL (`clearD`) one pull on the portal's seat rises as hers falls.
    const S5_W = 0.58, S5_DROP = 0.25, S5_EASE = 150, SEAT_W = 0.9;
    const s5At = (time, u) => { path.pointAt(u, _poiB); return _poiB.set(S5.x, _poiB.y - S5_DROP * _poiB.y, S5.z); };
    const pois = [
      { at: (time, u) => { bankU = u; return path.pointAt(Math.min(u + 30 / PL, 1), _poiG); }, from: 0, to: 1, weight: 0.004, fade: 0.01 },
      { at: mx(55, 55, -380), from: lipD / PL, to: abeamD[0] / PL, weight: 0.42 },                // S1, front-lit: the gaze swings some 6 degrees to her as we come up on her, the open sky and sunlit cumulus beyond the western lip on her other hand
      { at: (time, u) => vesselAt(u, _poiA), from: abeamD[0] / PL, to: vesselD / PL, weight: 0.5, fade: 0.4 },   // the vessel beyond her spray ring
      { at: mx(-55, 42, -610), from: abeamD[0] / PL, to: abeamD[1] / PL, weight: 0.5, fade: 0.45 },   // S2, glowing from inside
      { at: mx(65, 55, -840), from: (abeamD[1] + 20) / PL, to: abeamD[2] / PL, weight: 0.45, fade: 0.4 },   // the big sister's wall
      { at: mx(-120, 150, -1060), from: U(0.415), to: B(0.47), weight: 0.3 },                    // the thin sister drawn up into the cloud
      { at: s5At, from: s5From / PL, to: helixE / PL, weight: S5_W, fade: S5_EASE / (helixE - s5From) },   // S5, the whole helix
      { at: seat, from: clearD / PL, to: 1, weight: SEAT_W, fade: 0.3 },                          // the lantern, from where it clears her funnel
    ];

    // PACE, between places of the route (metres flown): the flight lingers while the vessel and S2 are in the look (0.8
    // of its average speed from S1 abeam to S2 abeam, the two places S2's look window runs between and the vessel's
    // begins at) and over the helix (0.91 x 0.94 from its first metre to where the lantern clears the funnel: there the
    // route itself turns 29 degrees a second), and makes the time up where little turns: a 1.15 window on the run north
    // from S4 abeam to the helix's first metre, 1.08 from the helix's last metre up the last straight to the door. A
    // window's factor holds from its first place to its second; the pace eases to it over the PACE_RAMP metres before
    // the first place and back over the PACE_RAMP metres after the second. THE 1.15 IS NEVER HELD: the helix's ease-in
    // lies over that window's own stretch (S4 abeam is 84 m before the helix's first metre), so the lens quickens over
    // the 100 m before S4 abeam, peaks there at 1.14 and is already easing: 0.98 at the helix's first metre, 0.855 from
    // PACE_RAMP metres into the helix. Likewise it rises in one change over the helix's last 100 m or so, the lantern
    // coming clear 97.5 to 100 m before the helix's last metre. The engine scales the whole so that the flight still
    // lasts `duration`.
    const PACE_RAMP = 100;
    const paceWin = (d, a, b) => smoothstep(a - PACE_RAMP, a, d) * (1 - smoothstep(b, b + PACE_RAMP, d));
    const paceAt = (u) => {
      const d = u * PL, onHelix = paceWin(d, helixD, clearD);
      return (1 - 0.2 * paceWin(d, abeamD[0], abeamD[1])) * (1 + 0.15 * paceWin(d, abeamD[3], helixD)) * (1 - 0.09 * onHelix) * (1 - 0.06 * onHelix) * (1 + 0.08 * paceWin(d, helixE, PL));
    };

    // ---- E. the sea: kit ocean, turquoise shoals under the entry, and the dressing quad that rides just above it
    const wind = hero.uniforms.uWind.value, windD = new THREE.Vector2(wind.x, wind.y).normalize();
    await ctx.yield();
    const WL = Water.waterLight(sky);
    const ocean = Water.makeOcean({
      rng: ctx.rng, light: WL, ...Wx.ocean, reflectivity: (Wx.ocean.reflectivity ?? 1) * (H.sea.refl ?? 1), ...(seaHor ? { horizonColor: seaHor } : {}), deep: H.sea.deep, shallowColor: C(H.sea.shallow, 0.72), scatter: H.sea.scatter, glow: H.sea.glow || '#000000',
      radius: 6800, fadeStart: 0.42, windAngle: Math.atan2(windD.y, windD.x),
      shallows: [{ x: 0, z: 60, radius: 240, falloff: 100 }, { x: -170 * MX, z: -60, radius: 150, falloff: 80 }, { x: 190 * MX, z: 10, radius: 170, falloff: 90 }, { x: 40 * MX, z: 260, radius: 220, falloff: 100 },
        { x: -175 * MX, z: -300, radius: 80, falloff: 80 }, { x: 235 * MX, z: -285, radius: 90, falloff: 80 }, { x: -45 * MX, z: -465, radius: 55, falloff: 60 }],   // outliers: the shoal's far edge is a broken reef line, not one arc
    });
    scene.add(ocean.object);
    // by night the sea's far colour was a hard navy stripe under the sky. From 10 m up (so all but the run-in) it and the
    // dome's below-horizon colour ease to the moon haze of the sky's own horizon (hazeN): the sea melts into the sky
    const hazeN = C(H.sky.horizon).lerp(fogCol, 0.3).multiplyScalar(1.3);   // (measured: without the 1.3 its red is under the grade's floor and the haze itself shows as a navy band, darker than the sky above it and the swell below)
    const farLow = night ? hazeN.clone().multiplyScalar(0.92) : C(seaHor || H.sky.horizon), farHigh = farLow;   // (by night the dome below the horizon and the kit sea's rim are the far sea's own haze from every height: at four fifths of it, low over the water, the rim was a dark hairline under a pale one)
    const oceanHorU = night && ocean.uniforms && ocean.uniforms.uHorizonColor ? ocean.uniforms.uHorizonColor : null;
    const skyGroundU = night && sky.uniforms && sky.uniforms.uGround ? sky.uniforms.uGround : null;
    const oceanFoamU = ocean.uniforms && ocean.uniforms.uFoam && typeof ocean.uniforms.uFoam.value === 'number' ? ocean.uniforms.uFoam : null, oceanFoam0 = oceanFoamU ? oceanFoamU.value : 0;
    await ctx.yield();
    // THE PATCH REEF (a DEPARTURE FROM THE BRIEF, which has open sea round S5): pale shallows and coral heads in the sea
    // the helix looks down on, dealt from a stream of its own: its centre 330-470 m from S5's foot on a bearing between
    // west and 35 degrees north of west (clear of the line of sisters to the south and of the newborn to the north), its
    // half-axes 360 x 270 m, each 15% either way.
    const reefR = makeRng(hashSeed('patch-reef:' + ctx.seed));
    const reefB = (reefR.range(0, 35) * Math.PI) / 180, reefD = reefR.range(330, 470), reefAx = [360 * reefR.range(0.85, 1.15), 270 * reefR.range(0.85, 1.15)];
    const reefC = mx(70 - reefD * Math.cos(reefB), 0, -1150 - reefD * Math.sin(reefB));
    const spU = []; for (let i = 0; i < 6; i++) spU.push(new THREE.Vector4(0, 0, 0, 14));
    const edgeU = { uMX: { value: MX }, uLipZ: { value: LIP_Z }, uWestX: { value: -1100 } };
    const dressU = {
      ...fogU(), ...edgeU, uPatch: hero.patchUniforms.uPatch, uTime: tU, uOriginZ: { value: ORIGIN_Z }, uSeaWest: { value: -520 }, uFarCol: { value: H.sea.far ? C(H.sea.far[0], H.sea.far[1]) : C('#000000') },
      uSeaLit: { value: night ? C('#8fb0e0', 0.035) : C(H.sea.shallow).lerp(C(H.sea.deep), 0.45).multiplyScalar(0.8) }, uLug: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 1e5, 1, 0)) }, uReef: { value: new THREE.Vector4(reefC.x, reefC.z, reefAx[0], reefAx[1]) },   // (the sea's own colour, for sun patches and swell faces seen from the helix; the place and heading of each skiff of the run-in file; the patch reef)
      uInk: { value: C(H.sea.ink) }, uInkA: { value: H.sea.inkA }, uHard: { value: H.sea.hard }, uCalm: { value: Wx.calm }, uSquall: { value: Wx.squall },
      uGlit: { value: H.sea.glit }, uFleck: { value: lerp(0.85, 1.2, moodK) * (night ? 0.55 : 1) }, uGustZ: { value: -420 }, uSmear: { value: Wx.smear * (H.sea.smearK || 1) }, uRowC: { value: -135 * windD.x }, uPhosK: { value: (H.sea.phos || 0) * 0.5 }, uSargK: { value: clamp(0.72 * density, 0.45, 0.9) },
      uFoamLit: { value: foamLit }, uFoamShade: { value: foamShade }, uSarg: { value: C(H.sarg, 1.0) }, uSunCol: { value: sunCol }, uSand: { value: C(H.sea.sand, 0.8) }, uTurq: { value: C(H.sea.turq || H.sea.shallow, H.sea.turqK || 0.5) }, uTq: { value: H.sea.tq || 0.34 },
      uPhos: { value: C('#3affd8', 0.5) }, uSmearCol: { value: H.sea.smearCol ? C(H.sea.smearCol, 0.6) : C(H.pal[3], 0.55).lerp(sunCol, 0.4) }, uWindD: { value: windD }, uSp: { value: spU },
      uSunAz: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() }, uRoad: { value: H.sea.road ?? 0.05 }, uRoadPow: { value: H.sea.roadPow || 9 },
      uSheen: { value: H.sea.sheen ? H.sea.sheen[1] * (1 - 0.35 * Wx.calm) : 0 }, uSheenCol: { value: C(H.sea.sheen ? H.sea.sheen[0] : '#000000') },
      uSheenBack: { value: C(H.sea.sheenBack ? H.sea.sheenBack[0] : H.sea.sheen ? H.sea.sheen[0] : '#000000') }, uBackK: { value: H.sea.sheenBack ? H.sea.sheenBack[1] : 0 },
      uRoadTint: { value: H.sea.roadTint ? V3(...H.sea.roadTint) : V3(1.0, 0.72, 0.42) },
      uLast: { value: H.sea.jade ? 1 : 0 }, uJade: { value: C(H.sea.jade || '#000000') }, uApr: { value: H.sea.mirror ? C(H.sea.mirror[0], H.sea.mirror[1]) : C('#000000') }, uGold: { value: H.sea.gold ? C(H.sea.gold[0], H.sea.gold[1]) : C('#000000') },
      uSeaHaze: { value: C(seaHor || '#000000') }, uDFog: { value: H.sea.jade ? fogCol.clone().lerp(C(seaHor), 0.75) : fogCol },   // (last light: the body of the sea, see LAST LIGHT in DRESS_FRAG; there the dressing's own haze is the sea's far colour, not the air's lilac)
      uNightK: { value: H.sea.night ? 1 : 0 }, uNightCol: { value: H.sea.night ? C(H.sea.night[0], H.sea.night[1]) : C('#000000') },
      uSilver: { value: H.sea.silver ? C(H.sea.silver[0], H.sea.silver[1]) : C('#000000') }, uNightHor: { value: H.sea.nightHor ? C(H.sea.nightHor[0], H.sea.nightHor[1]) : C('#000000') }, uHazeN: { value: hazeN },
    };
    const dress = new THREE.Mesh(new THREE.PlaneGeometry(17000, 17000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({   // (reaches past the kit ocean's rim from anywhere on the route)
      uniforms: dressU, vertexShader: FLAT_VERT, fragmentShader: DRESS_FRAG(hero.PATCH_GLSL), transparent: true, depthWrite: false, fog: true,
      premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    }));
    dress.renderOrder = -6; dress.frustumCulled = false; dress.position.y = Wx.lift; dress.name = 'sea-dressing'; scene.add(dress);
    await ctx.yield();

    // ---- F. the cloud: ceiling sheet at 620 m, rain shafts, scud along the lip, round the collars and the portal bay
    const ceilU = {
      ...fogU(), ...edgeU, uPatch: hero.patchUniforms.uPatch, uTime: tU, uOriginZ: { value: ORIGIN_Z }, uFlash: { value: 0 }, uFlashPos: { value: V3(0, CEIL_Y, -900) },
      uSpin: { value: hero.uniforms.uDir.value }, uIndigo: { value: indigo }, uLip: { value: C(H.lip[0], H.lip[1]) }, uSunDir: { value: sunDir }, uSunCol: { value: sunCol },
      uShadeCol: { value: shadeCol }, uBounce: { value: bounceCol }, uReliefD: { value: lerp(88, 106, moodK) }, uNightC: { value: night ? 1 : 0 }, uLift: { value: night ? V3(0.0052, 0.0056, 0.0066) : V3(0, 0, 0) }, uHaze: { value: night ? new THREE.Vector4(hazeN.r, hazeN.g, hazeN.b, 0.85) : new THREE.Vector4(fogCol.r, fogCol.g, fogCol.b, 0.5) }, uBayA: { value: new THREE.Vector4(seat.x, seat.z, hero.bayBar.x, hero.bayBar.y) },
    };
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10400, 6900).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: ceilU, vertexShader: FLAT_VERT, fragmentShader: CEIL_FRAG(hero.PATCH_GLSL), transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true, side: THREE.DoubleSide,
    }));
    ceil.position.set(0, CEIL_Y, -3050); ceil.renderOrder = -4; ceil.frustumCulled = false; ceil.name = 'cloud-base'; scene.add(ceil);
    await ctx.yield();

    const sr = ctx.rng.fork('shafts');                                       // (only its fork below draws from it: the far lip's fringe)
    // The curtains, from their own stream: bearing in degrees round (0, -1000) from north (+ = east before the mirror),
    // distance from that point, breadth under the cloud, darkness. Unequal in every one of them; sky and sunlit sea show between.
    const vr = makeRng(((ctx.seed | 0) * 7919 + 20261006) >>> 0);
    const CURT = [
      [4, 1600, 2900, 0.94],      // the broad slate curtain behind the line of sisters: the ivory tubes are read against it
      [-38, 2150, 640, 0.46],     // a thin pale one on the open, sunward side
      [37, 3300, 1700, 0.62],     // a far one, nearly lost in haze
      [-57, 2700, 1300, 0.6],     // out to the north-west, well inside the far lip: the helix sees it
    ];
    if (Wx.squall) CURT.push([61, 1800, 1050, 0.8]);                          // a squall brings one more, nearer, and all of them heavier
    CURT.push([49, 2550, 1250, 0.74]);                                        // north-east: from the top of the helix it reaches the sea left of centre under the deck, a sunlit gap beside it; from the entry a soft veil low on the right, 3.4 km off
    const sheets = CURT.map(([b, R, W, k], i) => ({
      th: ((b + vr.range(-4, 4)) * Math.PI) / 180, R: R * vr.range(0.93, 1.08) * (Wx.squall ? 0.86 : 1), W: W * vr.range(0.85, 1.15) * (Wx.squall ? 1.12 : 1),
      k: Math.min(k * vr.range(0.9, 1.08) * (Wx.squall ? 1.12 : 1), 0.96), seed: vr(),
    }));
    sheets.sort((a, b) => b.R - a.R);
    {
      const P = [], U = [], Sd = [], Wd = [], Kd = [], I = [], NU = 28, NV = 10;
      sheets.forEach((s, k) => {
        const base = k * (NU + 1) * (NV + 1);
        for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
          const a = s.th + ((i / NU - 0.5) * s.W) / s.R;
          P.push(MX * s.R * Math.sin(a), (j / NV) * (CEIL_Y + 4) - 4, -1000 - s.R * Math.cos(a)); U.push(i / NU, j / NV); Sd.push(s.seed); Wd.push(s.W); Kd.push(s.k);
        }
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; I.push(a, b, c, b, d, c); }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(Sd, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wd, 1)); g.setAttribute('aK', new THREE.Float32BufferAttribute(Kd, 1)); g.setIndex(I);
      const rainSun = night ? C(H.rain, 1.2) : fogCol.clone().lerp(C(H.key[0]), 0.35).multiplyScalar(0.92);   // (by night rain is darker than the sky behind it, never a pale veil)
      const leanV = new THREE.Vector2(windD.x >= 0 ? 1 : -1, windD.y >= 0 ? 0.3 : -0.3).normalize().multiplyScalar(270);   // every curtain's foot trails the same way, 215-330 m
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...fogU(), ...edgeU, uTime: tU, uFogAmt: { value: 0.26 }, uAlpha: { value: night ? 0.88 : 0.93 }, uRain: { value: C(H.rain) }, uRainLit: { value: night ? indigo.clone().lerp(C(H.rain), 0.5) : indigo.clone().multiplyScalar(0.9) },
          uRainSun: { value: rainSun }, uSunAz: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() }, uLean: { value: leanV } },
        vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true, side: THREE.DoubleSide,
      }));
      m.renderOrder = -3.95; m.frustumCulled = false; m.name = 'rain-curtains'; scene.add(m);   // after the ceiling (-4): the deck beyond a curtain is behind it
    }

    const flr = sr.fork('far-lip');                                          // (forked from the shafts' own stream)
    await ctx.yield();
    const scudR = ctx.rng.fork('scud'), sA = [], sB = [], sC = [], sD = [];
    const scud = (x, y, z, orbitR, a0, w, size, period, vx, vz, lit, asp = 0.55, nearK = 2.2, glow = 0, bob = 1) => {
      sA.push(x, y, z, orbitR); sB.push(a0, w, size, scudR()); sC.push(vx, vz, period, lit); sD.push(asp, nearK, glow, bob);
    };
    const nLip = Math.round(90 * detail * density), nWest = Math.round(64 * detail * density);
    for (let i = 0; i < nLip; i++) {                                         // tags racing along the southern lip
      const sp = scudR.range(4, 9) * (scudR.chance(0.5) ? 1 : -1);
      scud(scudR.range(-700, 1500) * MX, scudR.range(584, 612), LIP_Z + scudR.range(-280, 10), 0, 0, 0, scudR.range(60, 140), scudR.range(60, 120), sp, scudR.range(-1, 1), 1, scudR.range(0.5, 0.7));
    }
    for (let i = 0; i < nWest; i++) scud((-1110 + scudR.range(-50, 230)) * MX, scudR.range(584, 612), scudR.range(-1450, -260), 0, 0, 0, scudR.range(70, 150), scudR.range(60, 120), scudR.range(-1, 1), scudR.range(3, 8), 0.9, scudR.range(0.5, 0.7));
    const spinDir = hero.uniforms.uDir.value;
    for (let i = 0; i < hero.sisters.length; i++) {                          // scud circling under each collar
      const s = hero.sisters[i];
      const n = Math.round((i === 4 ? 30 : 9) * detail * density), cx = s.top.x, cz = s.top.y + ORIGIN_Z;
      for (let j = 0; j < n; j++) {
        const R = s.collarR * scudR.range(0.28, i === 4 ? 1.05 : 0.95), a0 = scudR.range(0, 6.283);
        let y = 1e9;
        for (let q = 0; q < 6; q++) { const a = a0 + q * 1.047; y = Math.min(y, hero.collarHeight(i, s.top.x + Math.cos(a) * R, s.top.y + Math.sin(a) * R)); }
        const size = scudR.range(50, i === 4 ? 80 : 110);
        y = Math.max(y - 4, i === 4 ? 492 : 300);
        scud(cx, y, cz, R, a0, (spinDir * scudR.range(2.5, 6)) / R, size, 0, 0, 0, scudR.range(0.6, 1), 0.62, 2.2, -1);
      }
      await ctx.yield();
    }
    {                                                                        // lit scud hanging under the base round S5 and out toward the exit: what the helix looks up at
      const nBase = Math.round(72 * detail * density);
      for (let i = 0; i < nBase; i++) {
        const lx = 70 + scudR.range(-520, 900), z = -1150 + scudR.range(-620, 480), x = lx * MX;
        const size = scudR.range(90, 180) * 1.5, lit = scudR.range(0.6, 1), sp = scudR.range(0.5, 1.1), per = scudR.range(90, 150), asp = scudR.range(0.5, 0.75) * 0.64;   // wide shelves and rags, not heads
        let y = scudR.range(584, 606);
        if (Math.hypot(x - seat.x, z - seat.z) < 300) continue;              // the grotto has that sky to itself
        if (Math.hypot(lx - 70, z + 1150) < 330) y = Math.min(y, hero.collarHeight(4, x, z - ORIGIN_Z) - 8);
        scud(x, y, z, 0, 0, 0, size, per, windD.x * sp, windD.y * sp, lit, asp, 2.2, -1);
      }
    }
    // ... and a ring of hanging rags 110-340 m round the portal's seat, so that the grotto shelves out into the base it hangs
    // from. None on the side we come from, and all 25 m or more above the line of approach. (The fork is the scud stream's
    // last draw but the cards' own seeds, so no other seeded draw moves.)
    const rA = [], rB = [], rC = [], rD = [], bayY = (x, z) => hero.bayHeight(x, z - ORIGIN_Z);
    {
      const rr = scudR.fork('grotto-ring'), nRing = Math.round(56 * detail), aIn = Math.atan2(app0.z - seat.z, app0.x - seat.x);
      for (let i = 0; i < nRing; i++) {
        const a = aIn + rr.range(0.95, 2 * Math.PI - 0.95), r = lerp(110, 340, Math.pow(rr(), 0.8)), size = rr.range(150, 260), sp = rr.range(0.3, 0.8);
        const x = seat.x + Math.cos(a) * r, z = seat.z + Math.sin(a) * r;
        let y = rr.range(586, 604);
        if (Math.hypot(x - S5.x, z - S5.z) < 330) y = Math.min(y, hero.collarHeight(4, x, z - ORIGIN_Z) - 8);   // under S5's collar they hang from the collar
        y = Math.min(y, bayY(x, z) - 6);                                       // ... and round the seat from the bay's wall
        rA.push(x, y, z, 0); rB.push(0, 0, size, scudR()); rC.push(windD.x * sp, windD.y * sp, rr.range(100, 160), rr.range(0.45, 0.85)); rD.push(rr.range(0.36, 0.46), 2.2, -1, 1);
      }
      // the approach side: long flat rags under the bay's two shelves, trailing back toward us either side of the line of
      // approach and never nearer than 25 m above it (a card faces the eye, so one that is wide enough to reach across the
      // line is lifted clear of it)
      const r2 = rr.fork('shelves'), hx = hero.bayBar.x, hz = hero.bayBar.y, nSh = Math.round(34 * detail);
      for (let i = 0; i < nSh; i++) {
        const a = -r2.range(10, 290), t = clamp(-a / 300, 0, 1), l = (i % 2 ? 1 : -1) * (118 + 50 * t + r2.range(-38, 46));
        const x = seat.x + hx * a - hz * l, z = seat.z + hz * a + hx * l, size = r2.range(160, 270), asp = r2.range(0.27, 0.36), sp = r2.range(0.1, 0.3);
        let y = bayY(x, z) - r2.range(2, 16);
        if (Math.abs(l) < 0.5 * size + 30) y = Math.max(y, seat.y + a * Math.tan(EXIT_PITCH) + 25 + 0.5 * asp * size);
        rA.push(x, y, z, 0); rB.push(0, 0, size, r2()); rC.push(windD.x * sp, windD.y * sp, r2.range(110, 160), r2.range(0.6, 0.95)); rD.push(asp, 2.2, -1, 1);
      }
    }
    await ctx.yield();
    // the portal's grotto: a hanging head of scud with a hollow that faces the approach and the lantern at its back.
    // Three shells, all clear of the line of approach: a dark back wall, the hollow's walls (sunlit at the mouth),
    // and the mass that roots it in the cloud base. Sorted far to near along the approach.
    const gd = seat.clone().sub(app0).normalize(), g1 = V3(0, 0, 1), g2 = new THREE.Vector3().crossVectors(g1, gd).normalize();
    if (g2.y < 0) g2.negate();
    const gro = [], gr = ctx.rng.fork('grotto');
    const puff = (s, r, phi, size, lit, asp, nearK) => {
      const p = seat.clone().addScaledVector(gd, s).addScaledVector(g1, Math.cos(phi) * r).addScaledVector(g2, Math.sin(phi) * r);
      p.y = Math.min(p.y, CEIL_Y + 20 - 0.3 * size);
      gro.push({ p, s, size, lit, asp, nearK, glow: 0.42 * Math.exp(-p.distanceTo(seat) / 55) });
    };
    for (let i = 0; i < 34; i++) puff(gr.range(36, 100), 125 * Math.sqrt(gr()), gr.range(0, 6.283), gr.range(80, 130), gr.range(0.15, 0.22), gr.range(0.8, 1), 0.3);
    for (let i = 0; i < 76; i++) {
      const s = gr.range(-90, 32), size = gr.range(42, 92), asp = gr.range(0.7, 0.95), m = smoothstep(-8, -70, s);
      const r = (s < -40 ? 21 : 15) + 0.42 * size + gr() * gr.range(0, 46);
      puff(s, r, gr.range(0, 6.283), size, 0.06 + m * gr.range(0.3, 0.6), asp, 0.5);
    }
    for (let i = 0, n = Math.round(14 * detail); i < n; i++) puff(gr.range(-30, 44), gr.range(72, 145), gr.range(0, 6.283), gr.range(90, 140), gr.range(0.12, 0.22), gr.range(0.7, 0.95), 0.5);
    for (let i = 0; i < 14; i++) puff(gr.range(-40, 30), gr.range(64, 150), gr.range(Math.PI + 0.2, 2 * Math.PI - 0.2), gr.range(100, 150), gr.range(0.12, 0.22), gr.range(0.7, 0.95), 0.5);   // the floor of the hollow
    for (let i = 0, n = Math.round(26 * detail); i < n; i++) {
      const s = gr.range(-70, 150), size = gr.range(100, 175);
      puff(s, gr.range(95, 200), gr.range(-0.35, Math.PI + 0.35), size, gr.range(0.3, 0.6), gr.range(0.65, 0.9), 0.5);   // its outside is in the sun
    }
    gro.sort((a, b) => b.s - a.s);
    const gA = [], gB = [], gC = [], gD = [];
    for (const g of gro) { gA.push(g.p.x, g.p.y, g.p.z, 0); gB.push(0, 0, g.size, gr()); gC.push(0, 0, 0, g.lit); gD.push(g.asp, g.nearK, g.glow, 0.25); }
    await ctx.yield();
    const scudU = (opacity, soft, glowCol, farMix = 0) => ({ ...fogU(), uTime: tU, uOpacity: { value: opacity }, uSoft: { value: soft }, uFarMix: { value: farMix }, uSunDir: { value: sunDir }, uShadeCol: { value: shadeCol }, uIndigo: { value: indigo },
      uLip: { value: C(H.lip[0], H.lip[1]) }, uRim: { value: sunCol.clone().multiply(new THREE.Color(1, 0.8, 0.55)).multiplyScalar(0.9) }, uGlowCol: { value: glowCol || C('#BFF3EE', 0.5) },
      uBar: { value: hero.bayBar }, uBarO: { value: new THREE.Vector2(seat.x, seat.z) }, uBarK: { value: 0 } });
    const scudMesh = (A, Bq, Cq, D, opacity, order, name, soft = 0, glowCol = null, farMix = 0) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(Bq), 4));
      g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(Cq), 4)); g.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(D), 4));
      g.instanceCount = A.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: scudU(opacity, soft, glowCol, farMix), vertexShader: SCUD_VERT, fragmentShader: SCUD_FRAG, transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true }));
      m.renderOrder = order; m.frustumCulled = false; m.name = name; scene.add(m);
      return m;
    };
    scudMesh(sA, sB, sC, sD, 0.6, -0.5, 'scud', 1);
    {                                                                        // the far lip's fringe: lit scud standing exactly on the torn edge of the sheet, 2-4 km off
      const fract = (v) => v - Math.floor(v), mixn = (a, b, t) => a + (b - a) * t;
      const h21 = (x, y) => { let a = fract(x * 0.1031), b = fract(y * 0.1031), c = a; const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fract((a + b) * c); };
      const n2 = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return mixn(mixn(h21(ix, iy), h21(ix + 1, iy), fx), mixn(h21(ix, iy + 1), h21(ix + 1, iy + 1), fx), fy); };
      const fb3 = (x, y) => 0.5 * n2(x, y) + 0.3 * n2(x * 2.07 + 13.1, y * 2.07 + 13.1) + 0.2 * n2(x * 4.3 + 41.7, y * 4.3 + 41.7);
      const lipE = (x, z) => {                                               // the same function as LIP in the shaders
        const eS = LIP_Z + (n2(x * 0.0045, 3.1) - 0.5) * 150 + (n2(x * 0.021, 7.7) - 0.5) * 36 - z;
        const w = -1100 - 2500 * (1 - smoothstep(-2400, -1500, z)), eW = x * MX - (w + (n2(z * 0.004, 9.3) - 0.5) * 260 + (n2(z * 0.017, 1.7) - 0.5) * 60);
        const fl = smoothstep(900, 2200, Math.hypot(x, (z + 930) * 0.6)) * smoothstep(-300, -1300, z);
        let e = -240 * Math.log(Math.exp(-clamp(eS / 240, -12, 12)) + Math.exp(-clamp(eW / 240, -12, 12)));
        e += (170 * (fb3(x / 340 + 2, z / 340 + 2) - 0.5) + 380 * (n2(x / 850 + 7, z / 850 + 7) - 0.5)) * (1 + fl);
        e += 150 * (Math.abs(2 * n2(x / 175 + 23, z / 175 + 23) - 1) - 0.42);
        return e + fl * (700 * (n2(x / 2100 + 3, z / 2100 + 3) - 0.5) + 420 * (n2(x / 260 + 31, z / 260 + 31) - 0.5) + 180 * (n2(x / 120 + 11, z / 120 + 11) - 0.5));
      };
      const fA = [], fB = [], fC = [], fD = [], nFr = Math.round(150 * detail * density);
      for (let i = 0; i < 1800 && fA.length < nFr * 4; i++) {
        const x = flr.range(-4300, -700) * MX, z = flr.range(-4300, -1300), size = flr.range(170, 300), y = flr.range(572, 606), sp = flr.range(2, 6) * (flr.chance(0.5) ? 1 : -1);
        const per = flr.range(110, 170), lit = flr.range(0.8, 1), asp = flr.range(0.5, 0.7), sd = flr(), e = lipE(x, z);
        if (e < -90 || e > 300) continue;
        fA.push(x, y, z, 0); fB.push(0, 0, size, sd); fC.push(sp * 0.2, sp * 0.5, per, lit); fD.push(asp, 2.2, 0.55, 1);
      }
      scudMesh(fA, fB, fC, fD, 0.92, -0.5, 'lip-fringe', 1, C(H.lip[0], H.lip[1] * 0.8).multiply(new THREE.Color(1.12, 0.86, 0.58)));   // their 'glow' is the open sky's light on the fringe
    }
    scudMesh(rA, rB, rC, rD, 0.85, -0.45, 'grotto-rags', 1, null, 1).material.uniforms.uBarK.value = 0.85;
    scudMesh(gA, gB, gC, gD, 0.97, -0.4, 'grotto', 0, null, 1).material.uniforms.uBarK.value = 0.5;
    {                                                                        // tags racing across the grotto's mouth, well above the line of approach
      const tA = [], tB = [], tC = [], tD = [];
      for (let i = 0; i < Math.round(16 * detail); i++) {
        const p = seat.clone().addScaledVector(gd, gr.range(-210, -100)).addScaledVector(g2, gr.range(50, 115)).addScaledVector(g1, gr.range(-60, 60));
        tA.push(p.x, p.y, p.z, 0); tB.push(0, 0, gr.range(28, 52), gr()); tC.push(0, (gr.chance(0.5) ? 1 : -1) * gr.range(8, 14), gr.range(18, 30), gr.range(0.5, 0.9)); tD.push(0.65, 1.2, 0, 0.4);
      }
      scudMesh(tA, tB, tC, tD, 0.8, -0.3, 'grotto-tags').material.uniforms.uBarK.value = 0.5;
    }
    // the lantern: a soft glow in the portal's plane, so that far off (and through S5's funnel) the door is a light, not a ring
    const haloU = { uCol: { value: C('#BFF3EE') }, uTime: tU, uR: { value: PORTAL_R }, uFar: { value: 1 }, uVis: { value: 0 } };
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(PORTAL_R * 7.2, PORTAL_R * 7.2), new THREE.ShaderMaterial({
      uniforms: haloU, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    halo.position.copy(seat); halo.lookAt(seat.clone().sub(gd)); halo.renderOrder = 4; halo.frustumCulled = false; halo.name = 'lantern'; scene.add(halo);

    // sunlit cumulus towers on the southern horizon (seen from the helix, behind the back-lit sisters)
    await ctx.yield();
    const tr = ctx.rng.fork('towers'), at = [];
    for (let i = 0; i < 7; i++) at.push([(-2700 + i * 900 + tr.range(-250, 250)) * MX, tr.range(380, 460), tr.range(950, 1700), tr.range(560, 860)]);
    const towers = makeCloudField({ rng: ctx.rng, sky, at, height: 0.95, wind: [1.2, 0, 0.4], renderOrder: -4.5, farFade: [5200, 6900], fogFade: 0.4 });
    scene.add(towers.object);
    await ctx.yield();
    // ... and a bank of four beyond the sheet's far (east) edge, 4.5-5 km from the helix: the swing up to the lantern
    // looks out under the far lip at them, standing sunlit on the horizon (placed by hand; a field of its own, seeded from
    // the towers' fork after its last draw, so no seeded draw of the world moves and the kit call stays a short build step)
    const bank = makeCloudField({ rng: tr, sky, at: (night ? [[4350, 215, -3400, 820], [4500, 300, -2700, 1500], [4650, 210, -1950, 760], [4800, 265, -1300, 1150]] : [[4300, 330, -3700, 700], [4560, 300, -3050, 900], [4700, 340, -1250, 620], [5000, 300, 200, 820]]).map(([x, y, z, wd]) => [x * MX, y, z, wd]),   // (by night the four overlap into one low, dim mass of two heights, a quarter as bright as by day: apart they were cotton balls in a row, alike and brighter one pale loaf)
      height: night ? 0.6 : 0.95, opacity: night ? 0.2 : 0.8, wind: [1.2, 0, 0.4], renderOrder: -4.5, farFade: [5200, 6900], fogFade: 0.4, noiseTexture: towers.noiseTexture });   // (the towers' own noise texture: the kit would bake another, 50 ms)
    scene.add(bank.object);
    if (night) for (const f of [towers, bank]) {                             // (the towers keep more of their moonlit form: 0.45; the bank 0.6)                             // by night both stand as dim slate masses: lit by the kit's pale night cloud colour, a tower under the deck's lip was a beige patch of 'sky' and the bank a pale loaf
      const fu = f.uniforms || {};
      if (fu.uLit && fu.uLit.value && fu.uLit.value.isColor) fu.uLit.value.lerp(C('#39445f'), f === bank ? 0.6 : 0.45);
      if (fu.uShade && fu.uShade.value && fu.uShade.value.isColor) fu.uShade.value.lerp(C('#1c2440'), 0.4);
    }
    await ctx.yield();

    // ---- G. the cast: vessel(s) and wake, sea birds, flying fish
    const vsl = buildVessel(castVessel, C(H.pal[6]), -MX);
    const shipMat = new THREE.ShaderMaterial({ uniforms: { ...litU(), uTime: tU, uPx: pxU, uSailFar: { value: C(H.pal[6]).multiply(sunCol).multiplyScalar(0.7).add(C(H.pal[6]).multiply(ambCol).multiplyScalar(0.5)) } }, vertexShader: SHIP_VERT, fragmentShader: SHIP_FRAG, side: THREE.DoubleSide, fog: true });
    const mkWake = (v) => new THREE.ShaderMaterial({
      uniforms: { ...fogU(), uTime: tU, uLen: { value: v.length }, uBeam: { value: v.beam }, uPhosK: { value: (H.sea.phos || 0) * (H.sea.wakePhos ?? 1) }, uFoam: { value: foamShade.clone().lerp(foamLit, 0.8).multiplyScalar(H.sea.wakeFoam ?? 1) }, uPhos: { value: C('#3affd8', 0.5) } },
      vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6,
    });
    const wakeMat = mkWake(vsl);
    // bow spray: 46 soft sprites per vessel (drawn from a hash, not from ctx.rng: no seeded draw moves)
    const nSpray = 46, lee = -MX;
    const mkSprayGeo = (v) => {
      const geo = new THREE.InstancedBufferGeometry(), spI = [];
      geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < nSpray; i++) {
        const h1 = (Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1, h2 = (Math.sin(i * 78.233 + 1.3) * 12543.127) % 1, a1 = Math.abs(h1), a2 = Math.abs(h2);
        spI.push((i + 0.5) / nSpray, i % 3 === 2 ? -lee : lee, a1, (1.9 + 2.6 * a2) * Math.pow(v.length / 32, 0.6));
      }
      geo.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(spI), 4)); geo.instanceCount = nSpray;
      return geo;
    };
    const sprayGeo = mkSprayGeo(vsl);
    const sprayMat = (ph, v = vsl) => new THREE.ShaderMaterial({
      uniforms: { ...fogU(), uTime: tU, uPh: { value: ph }, uLen: { value: v.length }, uSunDir: { value: sunDir }, uPhosK: { value: (H.sea.phos || 0) * 0.8 }, uFoam: { value: foamLit.clone().multiplyScalar(1.05) },
        uShade: { value: foamShade.clone().lerp(foamLit, 0.35) }, uSunCol: { value: sunCol }, uPhos: { value: C('#3affd8', 0.5) } },
      vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true,
    });
    const ships = [], rockR = makeRng(hashSeed('vessel-rock:' + ctx.seed));       // (each vessel's pitch and heel start from a phase of its own stream)
    for (let i = 0; i < (castVessel === 'skiff' ? 2 : 1); i++) {
      const ph = rockR.range(0, 6.283), mesh = new THREE.Mesh(vsl.geometry, shipMat), wake = new THREE.Mesh(vsl.wake, wakeMat), spray = new THREE.Mesh(sprayGeo, sprayMat(ph));
      mesh.frustumCulled = false; wake.frustumCulled = false; wake.renderOrder = -5.5; mesh.name = 'vessel' + i; wake.name = 'wake' + i;
      spray.frustumCulled = false; spray.name = 'bow-spray' + i;
      scene.add(mesh, wake, spray); ships.push({ mesh, wake, spray, off: i ? V3(-30 * MX, 0, -34) : V3(0, 0, 0), ph });
    }
    const heelK = castVessel === 'ketch' ? 0.2 : castVessel === 'skiff' ? 0.3 : 0.44, shipU = { value: V3() }, _ship = V3();
    // THE RUN-IN FILE: THREE SKIFFS running in before the squalls, one beyond another along the first of the route, each
    // on one steady course of her own at LUG_V m/s by metres flown (the brief's seconds); their red sails are the measure
    // of the sisters in the first seconds. THE RULE OF THE FILE, all of it dealt on every seed from the one stream
    // `run-in-lugger`, in this order: (1) the side of the first; (2) for each of the three in file order her two phases
    // (pitch, heel); (3) for each in file order her deal: how far along the route she starts beyond the one before (the
    // first 60-140 m ahead of the entry, each next 90-160 m beyond), how far off the track (LUG_CLEAR to 90 m, abeam of
    // that place, on the side opposite the one before: the sides alternate from the first), and her course (within 30
    // degrees of south-east; mirrored with the world). A deal is dealt again if it would bring her within LUG_CLEAR
    // metres of the lens (the lens is walked along the route every 2.5 m, from the entry to 150 m past the place she
    // starts abeam of: by then she is astern), within LUG_CLEAR metres of another of the file at any time of the flight,
    // or within LUG_CLEAR metres of a sister's spray ring. (Should sixty deals fail for one of them, the file ends before
    // her.) Always skiffs, whatever the cast: one hull and sail, one wake material, a spray material each of the one program.
    await ctx.yield();
    const lug = castVessel === 'skiff' ? vsl : buildVessel('skiff', C(H.pal[6]), -MX);
    const lugR = makeRng(hashSeed('run-in-lugger:' + ctx.seed)), LUG_V = 8, LUG_CLEAR = 25, _lp = V3(), _lt = V3();
    const lugRun = (d) => LUG_V * (TB(d / PL) - TB(0)), lugEnd = lugRun(PL);   // metres each has sailed when the lens has flown d metres; and by the door
    const lugGap = (a, b) => {                                               // the least distance, over the whole flight, between a skiff and another (or a place that stands still)
      const x = a.x - b.x, z = a.z - b.z, ux = a.dx - (b.dx || 0), uz = a.dz - (b.dz || 0), uu = ux * ux + uz * uz, k = uu > 1e-9 ? clamp(-(x * ux + z * uz) / uu, 0, lugEnd) : 0;
      return Math.hypot(x + ux * k, z + uz * k);
    };
    const lensWalk = []; for (let d = 0; d < 620; d += 2.5) { path.posAtDist(d, _lp); lensWalk.push(_lp.x, _lp.z, lugRun(d)); }   // (the furthest of the file starts at most 460 m along)
    const lugSide = lugR.chance(0.5) ? 1 : -1, lugPh = [0, 1, 2].map(() => [lugR.range(0, 6.283), lugR.range(0, 6.283)]), lugFile = [];
    for (let i = 0, along = 0; i < 3; i++) {
      let s = null;
      for (let n = 0; n < 60 && !s; n++) {
        const D = along + (i ? lugR.range(90, 160) : lugR.range(60, 140)), off = lugR.range(LUG_CLEAR, 90) * (i % 2 ? -lugSide : lugSide), ca = ((45 + lugR.range(-30, 30)) * Math.PI) / 180;
        path.posAtDist(D, _lp); path.tangentAtDist(D, _lt); const tl = Math.hypot(_lt.x, _lt.z) || 1;
        const c = { D, x: _lp.x - (_lt.z / tl) * off, z: _lp.z + (_lt.x / tl) * off, dx: Math.sin(ca) * MX, dz: Math.cos(ca) };   // (off > 0: to starboard of the track)
        let ok = true;
        for (let j = 0; j < lensWalk.length && (j / 3) * 2.5 < D + 150 && ok; j += 3) if (Math.hypot(c.x + c.dx * lensWalk[j + 2] - lensWalk[j], c.z + c.dz * lensWalk[j + 2] - lensWalk[j + 1]) < LUG_CLEAR) ok = false;
        for (const o of lugFile) if (lugGap(c, o) < LUG_CLEAR) ok = false;
        for (const sis of hero.sisters) if (lugGap(c, { x: sis.home.x, z: sis.home.y + ORIGIN_Z }) < sis.ring + LUG_CLEAR) ok = false;
        if (ok) s = c;
      }
      if (!s) break;
      along = s.D; lugFile.push(s);
      await ctx.yield();
    }
    const lugWakeMat = castVessel === 'skiff' ? wakeMat : mkWake(lug), lugSprayGeo = castVessel === 'skiff' ? sprayGeo : mkSprayGeo(lug);
    const luggers = lugFile.map((s, i) => {
      const mesh = new THREE.Mesh(lug.geometry, shipMat), wake = new THREE.Mesh(lug.wake, lugWakeMat), spray = new THREE.Mesh(lugSprayGeo, sprayMat(lugPh[i][0], lug));
      mesh.frustumCulled = false; wake.frustumCulled = false; spray.frustumCulled = false; wake.renderOrder = -5.5;
      mesh.name = 'lugger' + i; wake.name = 'lugger-wake' + i; spray.name = 'lugger-spray' + i;
      scene.add(mesh, wake, spray);
      return { x: s.x, z: s.z, dx: s.dx, dz: s.dz, yaw: Math.atan2(-s.dx, -s.dz), ph: lugPh[i], mesh, wake, spray };
    });
    // ... and A LUGGER AT ANCHOR OVER THE PATCH REEF (with the reef, a DEPARTURE FROM THE BRIEF, which has one schooner):
    // she lies head to wind inside the reef's core, placed by the reef's own stream, sheering a little about her cable and
    // pitching to the swell; no wake, no bow wave. The helix looks down on her red sail over the pale shallows.
    const lug2At = V3(reefC.x + reefR.range(-0.3, 0.3) * reefAx[0], 0, reefC.z + reefR.range(-0.3, 0.3) * reefAx[1]), lug2Yaw = Math.atan2(windD.x, windD.y), lug2Ph = [reefR.range(0, 6.283), reefR.range(0, 6.283), reefR.range(0, 6.283)];
    const lug2Mesh = new THREE.Mesh(lug.geometry, shipMat);
    lug2Mesh.frustumCulled = false; lug2Mesh.name = 'lugger-at-anchor'; scene.add(lug2Mesh);

    await ctx.yield();
    const br = ctx.rng.fork('birds'), bA = [], bB = [], bC = [];
    const span = castBird === 'frigate' ? 1.15 : castBird === 'booby' ? 0.95 : 0.8;
    const bird = (cx, y, cz, R, a0, w, mode, sec, white) => { bA.push(cx, y, cz, R); bB.push(a0, w, span * br.range(0.92, 1.1), br()); bC.push(mode, sec, -0.3, white); };
    const _p = V3(), _t = V3(), _in = V3(), _dir = V3(), _rt = V3(), UPV = V3(0, 1, 0);
    // encounters on the helix: at each, a lead bird and two or three wingmen 8-15 m apart cross the frame together, inside 20 m
    [0.5, 0.525, 0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.725, 0.75].forEach((uj, j) => {
      path.pointAt(uj, _p); path.tangentAt(uj, _t); _in.set(S5.x - _p.x, 0, S5.z - _p.z).normalize();
      for (let q = 0, n = 3 + (j % 2); q < n; q++) {
        _dir.copy(_p).addScaledVector(_t, 10 + q * br.range(8, 13)).addScaledVector(_in, br.range(8, 12) + (q % 2) * br.range(3, 7));
        const y = _p.y + br.range(0, 4.5) + q * br.range(-2, 3.5), R = Math.hypot(_dir.x - S5.x, _dir.z - S5.z);
        bird(S5.x, y, S5.z, R, Math.atan2(_dir.z - S5.z, _dir.x - S5.x), (MX * br.range(10.5, 13.5)) / R, 0, TB(uj), (j + q) % 3 === 1 ? 1 : 0);
      }
    });
    const STACK_IN = [50, 68];                                                // the stack's inner band: metres from S5's axis (its outer edge is the escorts' ring, below)
    const nFar = Math.round(14 * density);
    for (let i = 0; i < nFar; i++) {                                          // the rest of the stack in S5's inflow
      const R = br.chance(0.5) ? br.range(STACK_IN[0], STACK_IN[1]) : br.range(120, 165), y = i < 4 ? br.range(38, 85) : br.range(60, 320);
      bird(S5.x, y, S5.z, R, br.range(0, 6.283), (MX * br.range(10, 14)) / R, 1, 0, br.chance(0.35) ? 1 : 0);
    }
    for (let i = 0; i < 4; i++) bird(br.range(-8, 8), br.range(17, 26), -34 + br.range(-8, 8), br.range(13, 21), br.range(0, 6.283), (br.chance(0.5) ? 1 : -1) * br.range(0.5, 0.75), 2, 0, 1);   // plunge-divers by the vessel
    // five ESCORTS that fly with us round the last of the helix. The group leads the lens along our route: its place is a
    // route distance, the lens's own plus ESC_LEAD metres once it is on station. It TAKES STATION WHERE THE LENS FIRST
    // STANDS DUE SOUTH OF S5 (`southD`, found on the route in D); before that place it is further ahead and we close on it
    // at ESC_CLOSE m/s (by the brief's seconds, which are metres flown). THE ESCORTS ARE BIRDS OF THE STACK'S INNER BAND
    // (the birds soaring in S5's inflow, dealt above between STACK_IN[0] and STACK_IN[1] metres from her axis), and THEIR
    // RING IS THAT BAND'S OUTER EDGE: wherever the group's route distance lies on the helix, its centre is on the same
    // bearing from her axis as the track there, STACK_IN[1] metres from the axis and at the track's own height (the seats
    // keep their own heights below it); before the helix's first metre the same ring is carried on at the height of the
    // helix's first metre (part of the stack). From the helix's last metre it opens out onto our own line over the first
    // ESC_OUT metres of the last straight (`escAt`).
    // THE INNER THREE GIVE THE LANTERN THE SKY: from where the lantern clears S5's funnel (`clearD`, in D) they bank
    // outward and down over 110 m of flight and drop astern. THE OUTER TWO STAY, one on either hand, each ESC_ABREAST
    // metres abreast of the line the leader flies along (the group's centre line: his own seat is 2 m off it), level
    // their wings and open out by ESC_WIDE more metres as the door nears, until the group is ESC_DOOR metres from the
    // portal (straight line): then each peels away to its own side and down and drops astern. No bird is near the door.
    // (On the ring the port outer bird flies ESC_ABREAST metres outside the band's edge, which is the track's own radius
    // at the helix's last metre: there it is on our line, ESC_LEAD metres ahead of the lens, until the group has opened
    // out.) Each rides gull-winged, all dark: no white breast. (iC.y: 0 inner, +-1 outer and its side.)
    const ESC_CLOSE = 20, ESC_LEAD = 40, ESC_DOOR = 250, ESC_WIDE = 10, ESC_OUT = 100, ESC_ABREAST = 17;
    const escAt = (sd, pos) => {                                             // the group's centre at route distance sd
      if (sd >= helixD) path.posAtDist(sd, pos);
      else { const a = (sd - helixD) / 100; pos.set((70 - 100 * Math.cos(a)) * MX, 30, -1150 - 100 * Math.sin(a)); }   // (before the helix: its first ring carried on at its first metre's height)
      const k = 1 - smoothstep(helixE, helixE + ESC_OUT, sd);                // 1 on their own ring (the inner band's outer edge), 0 on our line
      if (k > 0) { const rx = pos.x - S5.x, rz = pos.z - S5.z, r = Math.hypot(rx, rz) || 1, q = lerp(1, STACK_IN[1] / r, k); pos.x = S5.x + rx * q; pos.z = S5.z + rz * q; }
      return pos;
    };
    const escC = V3(), escF = V3(0, 0, -1), escK = new THREE.Vector4(0, MX, 0, 0), escW = new THREE.Vector4(0, 0, 0, 0);
    [[-3, -7, -7, 2.2, 0], [4, 6, -2, 2.6, 0], [16, 2, -5, 3.4, 0], [2, -ESC_ABREAST, -4, 1.8, -1], [8, ESC_ABREAST, -8, 2.4, 1]].forEach(([ah, lat, up, wv, out]) => {
      bA.push(ah, lat * MX, up, wv); bB.push(0, 0, span * 1.85 * br.range(0.95, 1.1), br()); bC.push(3, out * MX, -0.34 * MX, 0);
    });
    const birdGeo = new THREE.InstancedBufferGeometry().copy(birdGeometry(castBird));
    birdGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(bA), 4)); birdGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(bB), 4));
    birdGeo.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(bC), 4)); birdGeo.instanceCount = bA.length / 4;
    const flap = castBird === 'frigate' ? [0.05, 0.35] : castBird === 'booby' ? [0.32, 2.6] : [0.48, 3.4];
    const birds = new THREE.Mesh(birdGeo, new THREE.ShaderMaterial({
      uniforms: { ...litU(), uTime: tU, uTb: tbU, uPx: pxU, uShip: shipU, uEscC: { value: escC }, uEscF: { value: escF }, uEscK: { value: escK }, uEscW: { value: escW }, uEscWide: { value: ESC_WIDE }, uFlap: { value: new THREE.Vector2(flap[0], flap[1]) } }, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide, fog: true,
    }));
    birds.frustumCulled = false; birds.name = 'sea-birds'; scene.add(birds);

    await ctx.yield();
    const fr = ctx.rng.fork('fish'), fA = [], fB = [], perVolley = Math.max(40, Math.round(60 * detail));
    for (const t0 of [-2.6, -0.9, 2.2]) for (let i = 0; i < perVolley; i++) {      // three volleys bursting from under the nose
      const tl = t0 + fr() * 1.4, lead = fr.range(15, 52), ul = B(tl / BRIEF_SEC) + lead / PL;
      path.pointAt(ul, _p); path.tangentAt(Math.max(ul, 0), _t); _rt.set(-_t.z, 0, _t.x).normalize();
      const side = fr.range(-1, 1), lat = side * (5 + lead * 0.26), ang = side * 0.75 + fr.range(-0.2, 0.2);
      const dx = _t.x * Math.cos(ang) + _rt.x * Math.sin(ang), dz = _t.z * Math.cos(ang) + _rt.z * Math.sin(ang), dl = Math.hypot(dx, dz) || 1;
      fA.push(_p.x + _rt.x * lat, _p.z + _rt.z * lat, dx / dl, dz / dl); fB.push(tl, fr.range(14, 19), fr.range(1.75, 2.35), fr());
    }
    const fiA = new THREE.InstancedBufferAttribute(new Float32Array(fA), 4), fiB = new THREE.InstancedBufferAttribute(new Float32Array(fB), 4);
    const fishGeo = new THREE.InstancedBufferGeometry().copy(fishGeometry());
    fishGeo.setAttribute('iA', fiA); fishGeo.setAttribute('iB', fiB); fishGeo.instanceCount = fA.length / 4;
    const seaYU = { value: Wx.lift };
    const fish = new THREE.Mesh(fishGeo, new THREE.ShaderMaterial({ uniforms: { ...litU(), uKey: { value: 1.25 }, uTime: tU, uTb: tbU, uSeaY: seaYU }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, side: THREE.DoubleSide, fog: true }));
    fish.frustumCulled = false; fish.name = 'flying-fish'; scene.add(fish);
    const stGeo = new THREE.InstancedBufferGeometry();
    stGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); stGeo.setIndex([0, 1, 2, 0, 2, 3]);
    stGeo.setAttribute('iA', fiA); stGeo.setAttribute('iB', fiB); stGeo.instanceCount = fA.length / 4;
    const streaks = new THREE.Mesh(stGeo, new THREE.ShaderMaterial({
      uniforms: { ...fogU(), uTime: tU, uTb: tbU, uSeaY: seaYU, uPx: pxU, uFoamLit: { value: foamLit } }, vertexShader: STREAK_VERT, fragmentShader: STREAK_FRAG,
      transparent: true, depthWrite: false, fog: true, premultipliedAlpha: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6,
    }));
    streaks.frustumCulled = false; streaks.renderOrder = -5.4; streaks.name = 'fish-skitter'; scene.add(streaks);
    await ctx.yield();

    // ---- H. weather fx: rain and spray round the camera, the rare double rainbow, lightning at night
    const fxRain = fx.makeParticles({ rng: ctx.rng.fork('rain'), preset: 'rain', count: Math.round(2600 * detail), time: tU, colors: night ? ['#8fa8d8', '#6f88c0', '#b8c8f0'] : ['#e6eef4', '#c8d6e6', '#ffffff'], opacity: 0 });
    scene.add(fxRain.object);
    await ctx.yield();
    let rainbow = null;
    if (rare) { rainbow = fx.makeRainbow({ sunDir, intensity: 0.25, secondary: true }); rainbow.object.traverse((o) => { o.renderOrder = -3.9; }); scene.add(rainbow.object); }   // drawn over the far rain and the base's far edge

    // ---- I. exposure, bloom and grade; the frame loop; clean-up
    const post = { exposure: H.post.exposure * (Wx.squall ? 1.04 : 1), bloom: { ...H.post.bloom }, grade: { ...H.post.grade, saturation: H.post.grade.saturation * (Wx.squall ? 0.93 : 1) } };
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const _buf = new THREE.Vector2(), _cam = V3(), smearW = H.sea.smearW || 1;
    const hash = (k) => { const s = Math.sin(k * 127.1 + 3.7) * 43758.5453; return s - Math.floor(s); };
    function update(dt, time, camera, u) {
      u = clamp(u ?? 0, 0, 1);
      const tb = TB(u), ub = tb / BRIEF_SEC;                                  // the brief's clock: 0 s at z = 0
      tU.value = time; tbU.value = tb;
      const bh = ctx.renderer.getDrawingBufferSize(_buf).y || 450;
      pxU.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.2) * bh);   // metres per pixel at 1 m
      hero.setProgress(u); hero.update(dt, time, camera);                     // S4's death and the newborn follow u
      sky.update(dt, time, camera); rig.update(dt, time, camera); ocean.update(dt, time, camera); towers.update(dt, time, camera); bank.update(dt, time, camera);
      fxRain.update(dt, time, camera);
      if (rainbow) { rainbow.update(dt, time, camera); rainbow.uniforms.uIntensity.value = 0.25 * (1 - 0.65 * smoothstep(0.72, 0.86, u)); }   // on the last straight the lantern outshines the bow
      dress.position.x = camera.matrixWorld.elements[12]; dress.position.z = camera.matrixWorld.elements[14];   // (the camera behind a portal has only its matrix set)
      if (oceanHorU || skyGroundU) {
        const hk = smoothstep(0, 70, camera.matrixWorld.elements[13]);
        if (oceanHorU) oceanHorU.value.copy(farLow).lerp(farHigh, hk);
        if (skyGroundU) skyGroundU.value.copy(farLow).lerp(farHigh, hk);
      }
      if (oceanFoamU) oceanFoamU.value = oceanFoam0 * (1 - 0.75 * smoothstep(80, 230, camera.matrixWorld.elements[13]));   // looked down on from the helix the kit's breaking crests are a rash of white patches: fewer of them up there
      _cam.setFromMatrixPosition(camera.matrixWorld); _dir.copy(seat).sub(_cam);
      const hd = Math.max(_dir.length(), 1);                                  // the lantern fills the ring far off and clears it close in; only seen from the approach side
      haloU.uFar.value = smoothstep(60, 300, hd); haloU.uVis.value = smoothstep(0.45, 0.85, _dir.dot(gd) / hd);
      dressU.uGustZ.value = -420 + 42.6 * tb;                                 // the gust front meets us at about 4.5 s
      for (let i = 0; i < 6; i++) {
        const s = hero.sisters[i], L = s.life;
        spU[i].set(s.base.x, s.base.y + ORIGIN_Z, (L.foot < 60 ? L.alpha : 0) * (0.5 + 0.5 * L.thin), (s.waist * 1.1 + 3) * smearW);
      }
      // the vessel runs across the line between S1 and S2 and is passed at about 11 s
      vesselAt(u, _ship); shipU.value.copy(_ship);
      for (const s of ships) {
        const x = _ship.x + s.off.x, z = _ship.z + s.off.z, h = ocean.heightAt(x, z, time);
        s.mesh.position.set(x, h * 0.5 - 0.15, z);
        s.mesh.rotation.set(0.05 * Math.sin(time * 0.9 + s.ph), (-Math.PI / 2) * MX, MX * heelK * (1 + 0.1 * Math.sin(time * 0.6 + s.ph)), 'YXZ');
        s.wake.position.set(x, Wx.lift + 0.3, z); s.wake.rotation.y = (-Math.PI / 2) * MX;
        s.spray.position.set(x, Wx.lift + 0.2 + 0.4 * h, z); s.spray.rotation.y = (-Math.PI / 2) * MX;
      }
      for (let i = 0; i < luggers.length; i++) {                             // the run-in file: each skiff on her own course, by metres flown
        const s = luggers[i], k = LUG_V * (tb - TB(0)), x = s.x + s.dx * k, z = s.z + s.dz * k, h = ocean.heightAt(x, z, time);
        s.mesh.position.set(x, h * 0.5 - 0.1, z);
        s.mesh.rotation.set(0.06 * Math.sin(time * 1.1 + s.ph[0]), s.yaw, MX * 0.3 * (1 + 0.12 * Math.sin(time * 0.7 + s.ph[1])), 'YXZ');
        s.wake.position.set(x, Wx.lift + 0.3, z); s.wake.rotation.y = s.yaw; dressU.uLug.value[i].set(x, z, s.dx, s.dz);
        s.spray.position.set(x, Wx.lift + 0.2 + 0.4 * h, z); s.spray.rotation.y = s.yaw;
      }
      {                                                                      // the lugger at anchor over the reef, head to wind
        const h = ocean.heightAt(lug2At.x, lug2At.z, time);
        lug2Mesh.position.set(lug2At.x, h * 0.5 - 0.1, lug2At.z);
        lug2Mesh.rotation.set(0.09 * Math.sin(time * 1.05 + lug2Ph[0]), lug2Yaw + 0.14 * Math.sin(time * 0.17 + lug2Ph[1]), 0.07 * Math.sin(time * 0.66 + lug2Ph[2]), 'YXZ');
      }
      {                                                                      // the escorts: where the group is on our route, how far the inner three have peeled away, how far the outer two have opened out and peeled
        const dCam = u * PL, x = TB(southD / PL) - tb, ahead = ESC_CLOSE * (x > 0 ? x * x / (x + 1.5) : 0), sd = Math.min(dCam + ESC_LEAD + ahead, PL);
        escAt(sd, escC); escF.subVectors(escAt(sd + 2, _p), escAt(sd - 2, _t)).normalize();   // its heading: along its own course (the ring, then our line)
        const dSeat = escC.distanceTo(seat), yI = dCam - clearD, yO = ESC_DOOR - dSeat;
        escK.x = smoothstep(0, 110, yI); escK.z = smoothstep(60, 150, yI); escK.w = 0.55 * (yI > 0 ? yI * yI / (yI + 40) : 0);
        escW.x = 1 - smoothstep(ESC_DOOR, EXIT_LEN, dSeat); escW.y = smoothstep(0, 110, yO); escW.z = smoothstep(60, 150, yO); escW.w = 0.55 * (yO > 0 ? yO * yO / (yO + 40) : 0);
      }
      // rain from 13 to 22 s, spray whipping through the wires at each pass and on the helix
      const rainK = Wx.rain * bell(ub, 0.28, 0.52, 0.3);
      const pass = Math.max(bell(ub, 0.15, 0.2, 0.5), bell(ub, 0.265, 0.305, 0.5), bell(ub, 0.355, 0.42, 0.4), 0.45 * bell(ub, 0.56, 0.86, 0.2));
      fxRain.setOpacity(clamp(Math.max(rainK, 0.8 * pass), 0, 1) * 0.75);
      // the cowling dims under the cloud and the light bars slide over it; the sun returns as the climb clears the lip
      const under = smoothstep(0.02, 0.05, ub) * (1 - smoothstep(0.8, 0.9, ub)), bar = 0.5 + 0.5 * Math.sin(time * 0.35 + 1.0) * Math.sin(time * 0.23);
      rig.sun.intensity = sunBase * lerp(1, 0.3 + 0.5 * bar * bar, under);
      if (night) {                                                           // soft lightning inside the cloud: one eased flash per 3.6 s at most
        const P = 3.6, k = Math.floor(time / P), f = time - k * P;
        ceilU.uFlash.value = (hash(k) > 0.25 ? 1.3 : 0) * smoothstep(0, 0.1, f) * Math.exp(-Math.max(f - 0.1, 0) / 0.3);
        ceilU.uFlashPos.value.set(MX * (-300 + 900 * hash(k + 7.3)), CEIL_Y, -500 - 1100 * hash(k * 1.7 + 3.1));
      }
    }

    return {
      scene, path, duration: DUR, pace: paceAt,
      camera: { fov: 62, near: 0.5, far: 7200, lookAhead: 30, sway: 1, bank: { valueOf: () => bankAt(bankU) } },
      pois,
      portal: { shape: 'circle', radius: PORTAL_R, color: '#BFF3EE', glow: 1.5, revealDistance: 900, tilt: true },
      post, ride: 'biplane', update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
