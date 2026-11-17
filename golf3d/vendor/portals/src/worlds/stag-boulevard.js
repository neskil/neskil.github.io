// A HUNDRED SPRINGS LATER: late April in a river megacity a century after people. We ride a sika stag at full
// gallop in the middle of its herd down a flooded boulevard that mirrors green-furred glass towers, through a
// sun-shower that overtakes us and hangs a rainbow on the slate wall ahead, over a metro court turned waterfall,
// under a fallen monorail beam and into the Wisteria Stack, to a ring of light in the lily pond under its lowest span.
// Frame: X right of the entry heading, Y up, Z back along the boulevard; the camera enters heading -Z; water at y 0.
// Looks by seed / ctx.vary.hour: the sun-shower (day), "After the Rain" (golden: copper low sun, the slate wall and a
// tall bow from the first frame), "First Light" (dawn: pearl fog, the stack arriving deck by deck, forty egrets) and
// "Full Moon" (night: silver-blue light, fireflies in the bamboo and over the pond). Cast by seed: lilac, cream or
// mixed wisteria; one seed in four a white stag among the leaders. Rare event: seven elephants showering in the pond
// under a full double bow. One analytic sun mask (the boulevard stands in open sun under drifting cloud shadow, with one soft
// lane of cool shade across the way down from the crane in the sun-shower look; the five decks' shadows in the stack, the camphor crowns) is shared by water, concrete, towers, falls, wisteria,
// spray and herd light. On the water: wind ripples lying across the way we run, a caustic net on the road bed, short
// dashes of lane paint, widening hoof rings behind every near animal, every galloper's shadow (drawn out long ahead of it in the
// copper light of the golden look), and our own stag's shadow running in front of us. Our own stag stays under the frame for the whole flight (seen from the saddle it stood in the picture
// as forks at the edges or as a pole with a head): what says we ride is the gait, the spray and its shadow. Behind the stack stands THE
// FAR BANK, a rank of terraced, furred towers either side of the ring with a quay of old trees, mirrored in the pond, so the last run
// ends in a canyon. Far things (the ranks of towers on the
// hills beyond the river, the cable-stayed bridge) fog toward the slate wall behind them instead of toward the pale haze.
// The herd is two things: the kit herds for the middle distance and beyond, each lit by the sun mask where it runs, and the near herd
// (makeNearDeer in the part file): fourteen or so animals 6 to 45 m ahead on both flanks, each on its own line bent round cars, buses,
// trees, piers and pits, leaping the metro court with us and passing into the ring ahead of us.
// Near the eye: six buses as leaning moss domes (kudzu mounds and sedge skirts over mossed mid-tone bodies), cars as kudzu hummocks, the
// court's rims under sedge with the flood going over them in strands. The decks' carriageways are meadows in flower, hinds at graze on the third. Seen through the previous portal the world is drawn from 0.3 m (camera.nearThrough), so the
// water in front of the entry fills the lower part of the opening; nothing stands on the entry axis behind the entry.
// The view alternates near and wide: eye level in the herd under the two wisteria gantries (z 478 and 446, one curtain behind the
// other); a crane to 15 m once both are behind us, looking down the clean canyon at the whole herd; down to 1.8 m beside four large
// near-herd animals that bound in turn with the bow behind them (they close in wherever the eye is under 3 m: one rule, by the eye's
// height alone); up to 14 m for the wide view of the flooded avenue, the monorail, the long fall, the bow and the herd going over the
// court, over the court and its falls and down under the dropped beam; up again to viaduct height past THE BRIDGE END, where
// one great stag in full antler stands sunlit on a broken stub of deck with the foot of the bow behind it and the herd streaming by
// below; a glide at 12 m under the outer flyover and through the bead veil, faint sheets of drizzle off the deck edges ahead;
// down to deer height before the third deck, and a long run at the ring (a slow weave past the falls, then 62 m dead straight) with three
// more near-deer going into it ahead of us and THE NEAR BOW arching over the ring in front of the far bank. The far bank's towers have
// light wells with balconies across them, 8 m setbacks and rooms lit by the low sun. The towers are
// drawn from both sides with panes set back in their reveals over rooms five metres deep, every pane with its own tilt and tint, the
// panes near the eye mirroring the facing wall, one in twelve a dark socket with ferns; fins and stacks of balconies standing proud,
// creeper and shrubs on them; each camphor crown is eight ragged masses of foliage over the kit tree, whose leaf sprays are made
// smaller and twice as many. By moonlight all foliage is tinted cooler and greyer (uFol, nightC).
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as flora from '../kit/flora.js';
import { buildHero, GB, makeFallSet, makeWisteria, makeNearDeer, deerGeometry, deckShade, deckUniforms, DECKS, deckPoint, flyX } from '../parts/stag-boulevard.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const bell = (c, w, x) => { const t = (x - c) / w; return Math.exp(-t * t); };
const HERO = { x: 130, z: -432, rot: -28 * Math.PI / 180 }, RING = 8.5, GANTRY = [478, 446];       // the ring: 17 m across, its lower 5.5 m under the pond
const toLocal = (x, z) => { const dx = x - HERO.x, dz = z - HERO.z, c = Math.cos(HERO.rot), s = Math.sin(HERO.rot); return [dx * c - dz * s, dx * s + dz * c]; };
const toWorld = (lx, y, lz) => [HERO.x + lx * Math.cos(HERO.rot) + lz * Math.sin(HERO.rot), y, HERO.z - lx * Math.sin(HERO.rot) + lz * Math.cos(HERO.rot)];
// The route. The eye rides 3 m above the water on our stag's back for the opening, the leap over the court, the basin and the last run.
// Between them the view leaves the saddle three times: under the first gantry's wisteria it lifts with the egrets to 18 m and looks down
// the canyon over the second gantry and the whole herd; it comes down to 1.7 m and runs low beside a few stags and hinds that bound
// through the shallows (the hero moment); and in the stack (points in the stack's own frame) it rises under the outer flyover's fringe
// and through the bead veil to 9 m, the herd large below and ahead, and is down among the deer again before the third deck.
const WAY_STREET = [[0, 3, 580], [0.5, 3, 535], [2, 3, 484], [2, 3.2, 448], [1.8, 5, 432], [1.5, 9.5, 416], [1.5, 13.5, 400], [1.2, 14.8, 384], [0.8, 12.4, 366], [0.4, 7.2, 346], [-1.5, 3.8, 326], [-4, 2.3, 306], [-6, 1.9, 284], [-7, 1.8, 258],
  [-6.5, 1.8, 232], [-4.5, 2.6, 206], [-2.5, 5.5, 184], [-0.5, 10, 160], [0, 14, 136], [-3, 14.6, 112], [-8, 12.6, 88], [-12.5, 10.6, 66], [-14.5, 9.2, 44], [-17, 7.6, 20], [-20, 6.4, -5]];
// (a low glide: up to 9 m under the outer flyover's fringe and through the veil, the herd large below and ahead, then down to deer height
// before the third deck, a slow weave past the falls either side, and the last 62 m dead straight at the ring)
const WAY_STACK = [[60, 11.5, 392], [52, 12, 376], [44, 12, 358], [36, 11.6, 338], [29, 10.8, 318], [23, 9.8, 300], [17.5, 8.6, 282], [12.5, 7.1, 262], [8.5, 5.6, 244], [5, 4.4, 226], [2, 3.5, 208], [0, 2.9, 190], [-1.6, 2.6, 172], [-2, 2.3, 154], [-0.6, 2.2, 136], [1.8, 2.3, 118], [2.5, 2.6, 100], [1.3, 2.9, 82], [0, 3, 62], [0, 3, 0]];
const WAY = WAY_STREET.concat(WAY_STACK.map((p) => toWorld(p[0], p[1], p[2])));
// THE BRIDGE END: the last pier of the old approach viaduct stands in the basin 8 m left of the way, a stub of its deck still on it, broken
// off toward us, wisteria hanging from its edges and a thread of water falling from its tip. On it stands one great stag in full antler,
// side on to us and sunlit, looking out over the herd that streams past below, with the foot of the bow behind it: the view passes it at
// its own height, 14 m off. BRIDGE: the deck's top line from its landward end to its tip; STAG: x, y, z, heading.
const BRIDGE = { a: [-22, 8.5, -63.9], b: [-7.6, 9.4, -63.9], hw: 3.6, pier: [-15, -63.9] };
const bridgeY = (x) => BRIDGE.a[1] + (BRIDGE.b[1] - BRIDGE.a[1]) * (x - BRIDGE.a[0]) / (BRIDGE.b[0] - BRIDGE.a[0]);
// (the stag's place is the stub's own: on its centre line, a body length back from the broken tip, heading along the stub toward the tip,
// where the herd streams past below; nothing of it is set from the path or from where the eye is)
const STAG = [BRIDGE.b[0] - 3.0, bridgeY(BRIDGE.b[0] - 3.0), BRIDGE.a[2], Math.atan2(BRIDGE.b[0] - BRIDGE.a[0], BRIDGE.b[2] - BRIDGE.a[2])];
// right wall: seven towers with 18 m side streets, then tower W; left wall: low plot, two towers, collapsed plot, one tower
const TOWERS = [];
for (let k = 0; k < 7; k++) TOWERS.push({ side: 1, z1: 700 - k * 101.4, z0: 700 - k * 101.4 - 83.4, h: [290, 250, 340, 270, 310, 255, 330][k] });
TOWERS.push({ side: 1, z1: -10, z0: -80, h: 228, w: true });
TOWERS.push({ side: -1, z1: 700, z0: 604, h: 24 }, { side: -1, z1: 598, z0: 532, h: 300 }, { side: -1, z1: 524, z0: 458, h: 265 }, { side: -1, z1: 327, z0: 258, h: 325 });

// The boulevard runs in open sunlight from the first frame to the stack (the three lanes of sun and shade of earlier versions are gone:
// from the saddle the shade read as murk); what moves over it now is the soft shadow of the cumulus, which never takes more than a fifth.
// (one soft lane of cool shade lies across the way down from the crane in the sun-shower look, z 388 to 300: the herd runs out of it into
// full sun and spray where the view comes down beside it; laneAt in buildWorld, its GLSL twin in sunLane)

// One sun mask for every shader of the world: sunLane = drifting cloud shadow, deckShade = the five decks' shadows
// (each deck's centre line is a parabola in the stack frame, so its distance has a closed form: no texture, no loop).
const GLSL_COMMON = /* glsl */`
  #ifndef SOFT_K
    #define SOFT_K 1.0
  #endif
  uniform vec3 uZen, uHor, uSlateCol, uSunDir, uSunCol, uAmbCol, uCloudCol; uniform float uSlate, uTime, uLaneK; uniform vec4 uFol;
  vec3 folTint(vec3 c){ return mix(vec3(dot(c, vec3(0.3, 0.55, 0.15))), c, uFol.w) * uFol.rgb; }      // foliage by moonlight: cooler and greyer
  uniform vec4 uHero; uniform vec4 uDk[5]; uniform vec4 uDk2[5];
  uniform vec4 uRingL; uniform vec3 uRingC;      // the ring as a lamp: its centre (world) and strength, its colour
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
  float sunLane(vec3 w){ float low = 1.0 - smoothstep(30.0, 90.0, w.y), edge = (vn(w.xz * 0.11) - 0.5) * 9.0;
    return (1.0 - 0.2 * smoothstep(0.56, 0.86, vn(w.xz * 0.008 + vec2(uTime * 0.012, uTime * 0.021))) * low)
      * (1.0 - uLaneK * smoothstep(300.0, 322.0, w.z + edge) * (1.0 - smoothstep(368.0, 388.0, w.z + edge)) * (1.0 - smoothstep(24.0, 60.0, w.y))); }
  vec2 stackXZ(vec2 p){ vec2 hl = p - uHero.xy; return vec2(hl.x * uHero.z - hl.y * uHero.w, hl.x * uHero.w + hl.y * uHero.z); }
  float deckDist(vec2 lp, vec4 d){
    float xs = clamp(lp.x + 300.0, 0.0, 600.0), c = d.w;
    float t = xs / ((c + 300.0) + sqrt(max((c + 300.0) * (c + 300.0) - 2.0 * c * xs, 1.0))), k = 1.0 - t;
    float zc = k * k * d.x + 2.0 * t * k * d.y + t * t * d.z;
    float dz = 2.0 * k * (d.y - d.x) + 2.0 * t * (d.z - d.y), dx = 2.0 * k * (c + 300.0) + 2.0 * t * (300.0 - c);
    return abs(lp.y - zc) * dx / sqrt(dx * dx + dz * dz + 1e-4) + max(abs(lp.x) - 300.0, 0.0);
  }
  float deckShadow1(vec3 w, vec4 d, vec4 e){
    float dy = e.x + 1.2 - w.y, soft = (1.0 + max(dy, 0.0) * 0.06) * SOFT_K;
    vec2 lp = stackXZ(w.xz + uSunDir.xz * (dy / max(uSunDir.y, 0.08)));
    return (1.0 - smoothstep(e.y - soft, e.y + soft, deckDist(lp, d))) * smoothstep(0.6, 2.6, dy);
  }
  float deckShade(vec3 w){
    vec2 lp = stackXZ(w.xz);
    if (abs(lp.x) > 560.0 || lp.y < -420.0 || lp.y > 760.0) return 1.0;
    float s = 1.0 - 0.92 * deckShadow1(w, uDk[0], uDk2[0]);
    s *= 1.0 - 0.92 * deckShadow1(w, uDk[1], uDk2[1]); s *= 1.0 - 0.92 * deckShadow1(w, uDk[2], uDk2[2]);
    s *= 1.0 - 0.92 * deckShadow1(w, uDk[3], uDk2[3]); s *= 1.0 - 0.92 * deckShadow1(w, uDk[4], uDk2[4]);
    return s;
  }
  float sunMask(vec3 w){ return sunLane(w) * deckShade(w); }
  // sunlight down in the metro court and the escalator slot: only where the ray toward the sun leaves through the opening
  float pitLit(vec3 w){
    if (w.y > -0.05) return 1.0;
    vec2 h = w.xz + uSunDir.xz * (-w.y / max(uSunDir.y, 0.08));
    float a = smoothstep(-32.4, -31.6, h.x) * (1.0 - smoothstep(17.6, 18.4, h.x)) * smoothstep(47.6, 48.4, h.y) * (1.0 - smoothstep(61.6, 62.4, h.y));
    float b = smoothstep(-2.4, -1.6, h.x) * (1.0 - smoothstep(13.6, 14.4, h.x)) * smoothstep(19.6, 20.4, h.y) * (1.0 - smoothstep(47.6, 48.4, h.y));
    return max(a, b);
  }
  vec3 skyRefl(vec3 r){ float e = clamp(r.y, 0.0, 1.0); vec3 c = mix(uHor, uZen, pow(e, 0.6));
    vec2 cq = r.xz / (e + 0.3);
    float cl = smoothstep(0.35, 0.85, vn(cq * 1.1 + uTime * 0.004) * 0.65 + vn(cq * 2.9 + 7.0) * 0.35) * smoothstep(0.03, 0.3, e);
    c = mix(c, uCloudCol, cl * 0.42);
    float ahead = smoothstep(0.15, -0.45, r.z) * (1.0 - smoothstep(0.3, 0.75, e));
    return mix(c, uSlateCol, ahead * uSlate); }
  // our own stag's shadow, thrown ahead of us on the water: a cut-out standing across the path at the rider (rump, legs, neck, ears and
  // the two antlers, in metres above the water), projected along the sun ray; uRider = (x, z, forward x, forward z), uRiderK = (strength, bob, stride)
  uniform vec4 uRider; uniform vec3 uRiderK;
  float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0)); }
  float riderShadow(vec2 p){
    // (thrown as if the sun stood at least 21 degrees up: a truer, longer shadow is a stripe 20 m long that no one reads as a stag)
    vec3 L = normalize(vec3(uSunDir.x, max(uSunDir.y, 0.55), uSunDir.z));
    vec2 d = p - uRider.xy; float lf = dot(L.xz, uRider.zw);
    if (uRiderK.x < 0.01 || dot(d, d) > 900.0 || lf > -0.05) return 0.0;
    float s = -dot(d, uRider.zw) / lf;
    if (s < 0.0) return 0.0;
    vec2 h = d + L.xz * s;
    vec2 q = vec2(abs(dot(h, vec2(-uRider.w, uRider.z))), s * L.y - uRiderK.y) / 1.3;
    float sd = sdSeg(q, vec2(0.0, 0.95), vec2(0.0, 1.4)) - 0.3, nk = sdSeg(q, vec2(0.0, 1.5), vec2(0.0, 2.3)) - 0.14;   // rump and barrel; neck
    float hb = clamp(0.5 + 0.5 * (nk - sd) / 0.4, 0.0, 1.0); sd = mix(nk, sd, hb) - 0.4 * hb * (1.0 - hb);                // the barrel runs into the neck over the withers
    sd = min(sd, sdSeg(q, vec2(0.0, 2.3), vec2(0.0, 2.48)) - 0.17);                               // head
    sd = min(sd, sdSeg(q, vec2(0.2, 0.92), vec2(0.21 + 0.1 * uRiderK.z, -0.3)) - 0.07);          // legs
    sd = min(sd, sdSeg(q, vec2(0.1, 2.4), vec2(0.37, 2.5)) - 0.06);                               // ear
    sd = min(sd, sdSeg(q, vec2(0.08, 2.45), vec2(0.33, 2.95)) - 0.045);                           // beam
    sd = min(sd, sdSeg(q, vec2(0.33, 2.95), vec2(0.27, 3.42)) - 0.05);
    sd = min(sd, sdSeg(q, vec2(0.16, 2.62), vec2(0.46, 2.72)) - 0.04);                            // brow tine
    sd = min(sd, sdSeg(q, vec2(0.32, 3.0), vec2(0.54, 3.24)) - 0.045);                            // trez tine
    float soft = 0.015 + 0.004 * s;
    return (1.0 - smoothstep(-soft, soft, sd)) * uRiderK.x * smoothstep(2.5, 7.0, s);       // nothing of it right under the eye
  }
`;
// after <fog_pars_fragment>: the fog of far things leans toward the slate wall that stands behind them, and never quite closes,
// so the far city is a rank of slate-blue silhouettes with a little form left in them instead of pale cut-outs
const FOG_FAR = /* glsl */`
  vec3 fogFar(vec3 col, vec3 w, float dist){
    #ifdef FOG_EXP2
      // (the far bank's rank, seen from the reveal and further off, stands in the rain's shadow: a quiet blue-grey rank with its form
      // kept behind the sunlit stack, never pale cut-outs; it comes into its own light as the view nears it)
      vec2 lr = stackXZ(w.xz);
      float rk = uSlate * step(lr.y, -45.0) * step(-270.0, lr.y) * step(abs(lr.x), 330.0) * smoothstep(230.0, 500.0, dist);
      col = mix(col, dot(col, vec3(0.3, 0.5, 0.2)) * (uSlateCol * 1.5 + uHor * 0.22), rk * 0.74);
      float f = 1.0 - exp(-fogDensity * fogDensity * dist * dist), farK = smoothstep(450.0, 800.0, dist);
      f *= 1.0 - 0.42 * step(-45.0, lr.y) * step(lr.y, 430.0) * step(abs(lr.x), 330.0) * step(6.0, w.y) * (1.0 - smoothstep(0.002, 0.004, fogDensity));      // the stack keeps its colour through the haze: the landmark that closes the boulevard
      float k = uSlate * farK * smoothstep(20.0, 150.0, w.y) * (0.55 + 0.45 * smoothstep(700.0, 2400.0, dist));
      vec3 fc = mix(fogColor, uSlateCol * 0.92 + uHor * 0.2, k);            // pale ground haze, slate higher up, the furthest ranks melting into the wall
      float keep = farK * (0.04 + 0.2 * (1.0 - smoothstep(900.0, 2300.0, dist))) * (1.0 - smoothstep(0.002, 0.004, fogDensity));
      #ifdef FAR_DARK
        // the ranks of towers and the hills beyond the river: a quiet blue-grey between the pale haze on the river and the wall of rain
        // (the nearer rank a shade darker), low enough that their tops show under the lowest deck: an upright skyline, never pale
        // cut-outs with a dark city hanging between them
        float dk = uSlate * farK, rank = smoothstep(900.0, 2300.0, dist);
        fc = mix(fc, mix(fogColor, uSlateCol * 0.95, FAR_DARK * mix(0.62, 0.5, rank)), dk * smoothstep(-40.0, 40.0, w.y));
        col *= 1.0 - 0.5 * dk;
      #endif
      return mix(col, fc, min(f, 1.0 - keep));
    #else
      return col;
    #endif
  }`;
const VERT_W = /* glsl */`
  varying vec3 vW; varying vec3 vN; varying vec3 vC;
  #include <fog_pars_vertex>
  void main(){
    #ifdef USE_COLOR
      vC = color;
    #else
      vC = vec3(1.0);
    #endif
    vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = mat3(modelMatrix) * normal;
    vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

// ---- the mirror: wet asphalt and lane paint looking down; toward grazing an analytic mirror of sky, slate wall, the two tower
// walls, the camphor crowns, the five decks with their lilac fringes, piers, the flanking falls and the ring ----
const WATER_FRAG = /* glsl */`
  #define SOFT_K (1.0 + 2.2 * smoothstep(8.0, 22.0, cameraPosition.y))
  ${GLSL_COMMON}
  uniform vec4 uTw[12]; uniform vec4 uCol[16]; uniform vec4 uCrown[14]; uniform vec4 uRank[8];
  uniform float uRain, uRing, uPads, uWeed, uLaneC; uniform vec2 uFront; uniform vec3 uBed; uniform vec3 uPortal, uPortalN, uPortalCol, uLilac, uPetal;
  varying vec3 vW; varying vec3 vN; varying vec3 vC;
  #include <fog_pars_fragment>
  vec3 hazed(vec3 c, float d){
    #ifdef FOG_EXP2
      return mix(fogColor, c, exp(-fogDensity * fogDensity * d * d));
    #else
      return c;
    #endif
  }
  void deckMirror(inout vec3 refl, inout float dkc, vec2 p, vec3 R, float inv, float dist, vec4 d, vec4 e, vec3 soff, vec3 fringe, float fk, float pond, float torn){
    vec2 h1 = stackXZ(p + R.xz * ((e.x - 4.5) * inv)), h2 = stackXZ(p + R.xz * ((e.x + 4.0) * inv));
    float a1 = deckDist(h1, d) - e.y, a2 = deckDist(h2, d) - e.y;
    float airC = 1.0 - 0.8 * smoothstep(8.0, 20.0, cameraPosition.y), airF = 1.0 - 0.9 * smoothstep(4.5, 11.0, cameraPosition.y);
    float cov = (1.0 - smoothstep(-0.7, 0.7, max(a1, a2))) * airC;      // from the air we look into the water: no pale panes of mirrored soffit
    // the mirrored edge of a deck is soft and torn by the ripple, wider with distance: never a ruled line on the water
    float sw = 1.2 + 0.03 * dist;
    float fr = (1.0 - smoothstep(-sw, sw, a1 * a2 / (abs(a1 - a2) + 0.3))) * (1.0 - cov) * (0.45 + 0.55 * torn);
    float fd = dist + e.x * inv;
    refl = mix(refl, hazed(soff, fd), cov * 0.94); dkc = max(dkc, cov);
    // where the ray passes the deck's edge between the two planes it meets the deck's flank: the girder and parapet above the soffit
    // line (pale concrete), the hanging racemes below it (one-dimensional strands along the parapet, thinning toward their tips)
    float den = a1 - a2, tcr = clamp(a1 / (abs(den) < 1e-3 ? 1e-3 : den), 0.0, 1.0), side = smoothstep(0.5, 0.56, tcr);
    float strand = vn(vec2(h1.x * 1.4, 3.0)), bead = vn(vec2(h1.x * 4.6, 9.0));
    // (a ray that is under the deck at the lower plane and leaves it above the soffit line has met the soffit, not the pale flank:
    // painted as flank it lay on the pond as a pale box between the falls)
    float enter = smoothstep(-0.4, 0.4, a1);
    vec3 flank = vec3(0.4, 0.38, 0.33) * (uAmbCol * 0.9 + uSunCol * 0.45); flank = mix(flank, flank * vec3(0.55, 0.75, 0.55), pond);
    refl = mix(refl, hazed(soff, fd), fr * side * (1.0 - enter) * 0.9 * airC);
    refl = mix(refl, hazed(flank, fd), fr * side * enter * 0.5 * sqrt(fk) * airF);
    refl = mix(refl, hazed(fringe * (0.72 + 0.5 * bead), fd), fr * (1.0 - side) * 0.6 * smoothstep(0.75 - 0.9 * tcr, 1.05 - 0.9 * tcr, strand + 0.25) * fk * airF);
  }
  void main(){
    vec2 p = vW.xz;
    // the metro court and the escalator slot are holes in the sheet
    if (p.x > -32.0 && p.x < 18.0 && p.y > 48.0 && p.y < 62.0) discard;
    if (p.x > -2.0 && p.x < 14.0 && p.y > 20.0 && p.y <= 48.0) discard;
    vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
    vec2 lp = stackXZ(p);
    float pond = 1.0 - smoothstep(0.75, 1.0, length((lp - vec2(0.0, 60.0)) / vec2(78.0, 68.0)));
    // ripples: cat's-paws, hoof chop near the rider, rain rings
    float t = uTime; float calm = 1.0 - 0.65 * pond;
    float deep = max(pond, 1.0 - smoothstep(190.0, 300.0, lp.y));                // all the water under the stack is deep and cool, not only the lily pond
    float n0 = vn(p * 0.33 + t * vec2(0.35, 0.22));
    vec2 g = vec2(n0 - vn(p * 0.33 + vec2(1.7, 0.0) + t * vec2(0.35, 0.22)), n0 - vn(p * 0.33 + vec2(0.0, 1.7) + t * vec2(0.35, 0.22)));
    float paw = smoothstep(0.45, 0.8, vn(p * 0.035 + t * vec2(0.05, 0.12)));
    vec2 g2 = vec2(vn(p * 1.9 - t * vec2(0.9, 0.4)) - 0.5, vn(p * 1.9 + 5.3 + t * vec2(0.3, 1.0)) - 0.5);
    float nearK = 1.0 - smoothstep(10.0, 70.0, dist);
    g *= mix(0.45, 1.0, smoothstep(8.0, 28.0, dist));                // the slow swell is halved under the eye: the towers stand in a mirror there, not in marble
    // rain rings: small, soft and short-lived, a shiver in the reflection and never a drawn circle; none right under the eye
    vec2 cell = floor(p / 1.2), cf = fract(p / 1.2) - 0.5; float ch = h21(cell);
    vec2 rc = cf - (vec2(h21(cell + 3.1), h21(cell + 7.7)) - 0.5) * 0.4;
    float ph = fract(t * 0.8 + ch * 7.0), rr = length(rc);
    // (the shower's front: uFront = its line across the boulevard (world z) and how much of a front there is. Rain has reached the water
    // astern of the line and not ahead of it, and along the line itself the first heavy drops come down in a band of crowded rings.)
    float fz = p.y - uFront.x, fband = uFront.y * exp(-fz * fz * 0.022), rainK = min(1.0, uRain * mix(1.0, smoothstep(-5.0, 9.0, fz), uFront.y) + 0.95 * fband);
    float rd = rr - ph * 0.3, rfade = (1.0 - ph) * (1.0 - ph) * rainK * step(1.0 - rainK * 0.55 - 0.3 * fband, ch) * (1.0 - smoothstep(50.0, 120.0, dist) * (1.0 - 0.6 * fband)) * mix(smoothstep(4.0, 14.0, dist), 1.0, fband);
    float ringW = smoothstep(0.06, 0.0, abs(rd)) * rfade, ringT = smoothstep(0.07, 0.0, abs(rd + 0.08)) * rfade;      // the crest and the trough inside it
    // wind ripples: crests lying across the water and running down it, so that from the saddle they are short level dashes in every
    // reflection (what says water); the fine set fades before it gets finer than a pixel, the broad set carries to the middle distance
    vec2 wq1 = vec2(p.x * 0.5 + 0.7 * n0, p.y * 2.1 + t * 1.2), wq2 = vec2(p.x * 0.19 + 3.0, p.y * 0.72 + t * 0.65);
    float wz = (vn(wq1 + vec2(0.0, 0.5)) - vn(wq1)) * 0.13 * (1.0 - smoothstep(12.0, 46.0, dist)) + (vn(wq2 + vec2(0.0, 0.5)) - vn(wq2)) * 0.1 * (1.0 - smoothstep(45.0, 140.0, dist));
    vec3 N = normalize(vec3(g.x * (0.05 + 0.1 * paw) * calm + g2.x * (0.035 + 0.06 * nearK) * calm + (ringW - ringT) * rc.x * 1.6, 1.0,
                            g.y * (0.05 + 0.1 * paw) * calm + g2.y * (0.035 + 0.06 * nearK) * calm + wz * calm + (ringW - ringT) * rc.y * 1.6));
    vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
    float ndv = clamp(dot(V, N), 0.0, 1.0), fres = 0.12 + 0.88 * (1.0 - ndv) * (1.0 - ndv) * (1.0 - ndv);
    float inv = 1.0 / max(R.y, 0.02);
    // the sun mask on the water, with the camphor crowns' shadows thrown ahead of each tree; the same loop finds their reflections
    // (round 15: the edge of every shadow on the water wanders with the swell: no ruled line where a lane of sun ends)
    vec2 lwob = (vec2(vn(p * 0.19 + 3.0), vn(p * 0.19 + 9.0)) - 0.5) * 3.4 + (vec2(vn(p * 0.8 + t * 0.1), vn(p * 0.8 + 5.0 - t * 0.1)) - 0.5) * 0.9;
    float lit = mix(0.6, sunMask(vW + vec3(lwob.x, 0.0, lwob.y)), uLaneC), dap = vn(p * 0.8 + t * vec2(0.3, 0.1)) - 0.5, shadow = 0.0, crownR = 0.0;
    vec2 sdir = uSunDir.xz / max(uSunDir.y, 0.08);
    #ifndef LITE
    for (int i = 0; i < 14; i++) {
      vec4 c = uCrown[i]; float cr = max(c.z, 0.1);
      shadow = max(shadow, 1.0 - smoothstep(0.55, 1.1, length(p + sdir * c.w - c.xy) / cr + 0.5 * dap));
      vec3 oc = vec3(c.x - vW.x, c.w, c.y - vW.z); float tc = dot(oc, R);
      crownR = max(crownR, (1.0 - smoothstep(0.7, 1.05, length(oc - R * tc) / cr + 0.35 * dap)) * step(0.0, tc));
    }
    #endif
    lit *= 1.0 - 0.85 * shadow;
    float litB = lit * (1.0 - 0.7 * riderShadow(p));               // the road bed also takes our own stag's shadow
    // mirror: sky and slate wall, then the tower walls x = +-42
    vec3 refl = skyRefl(R);
    // (the walls stand 40 m and more behind the surface, where every ripple is magnified: they are looked up through a calmer surface than the sky is)
    vec3 Rw = reflect(-V, normalize(mix(vec3(0.0, 1.0, 0.0), N, 0.42))); Rw.y = abs(Rw.y) + 1e-3;
    float sgn = Rw.x >= 0.0 ? 1.0 : -1.0, tx = (sgn * 42.0 - vW.x) / (sgn * max(abs(Rw.x), 1e-3));
    float hy = Rw.y * tx, hz = vW.z + Rw.z * tx, hitT = 0.0;
    if (abs(vW.x) < 42.0 && tx > 0.0) {
      float ew = 1.0 + 0.05 * tx; hz += (vn(vec2(p.x * 0.9 + t * 0.4, p.y * 0.25)) - 0.5) * (3.0 + 0.1 * tx) + (vn(p * 2.3 - t * 0.5) - 0.5) * 1.6;      // a mirrored wall's edge wavers with the water
      for (int i = 0; i < 12; i++) { vec4 q = uTw[i]; hitT = max(hitT, step(0.0, q.w * sgn) * smoothstep(q.x - ew, q.x + ew, hz) * (1.0 - smoothstep(q.y - ew, q.y + ew, hz)) * (1.0 - smoothstep(q.z - 2.0 * ew, q.z + 2.0 * ew, hy))); }
    }
    float terr = fract(hy / 55.0), fur = smoothstep(0.3, 0.0, terr) + smoothstep(0.9, 1.0, terr);
    float pane = mix(0.8 + 0.2 * smoothstep(0.12, 0.26, fract(hy / 4.2)), 0.93, smoothstep(40.0, 160.0, tx));      // floor lines only: mirrored mullions are long rays that fan out from the eye
    vec3 wallSun = uSunCol * (sgn > 0.0 ? 0.22 * smoothstep(60.0, 110.0, hy) : 0.02) + uAmbCol * 0.5;
    vec3 wall = mix(vec3(0.045, 0.085, 0.09) * pane + skyRefl(vec3(-sgn, 0.25, 0.3)) * 0.2 * pane, vec3(0.16, 0.3, 0.07) * 1.1, clamp(fur, 0.0, 1.0)) * (wallSun * 1.3 + 0.2);
    refl = mix(refl, hazed(wall, dist + tx), hitT * 0.94);
    #ifndef LITE
    // the rank of towers on the far bank behind the ring (front planes in the stack's frame: x0, x1, front z, height), met by the same calm ray
    if (lp.y > -50.0 && lp.y < 430.0 && abs(lp.x) < 430.0) {
      vec2 dl = vec2(Rw.x * uHero.z - Rw.z * uHero.w, Rw.x * uHero.w + Rw.z * uHero.z);
      float rkT = 0.0, rkD = 0.0, rkH = 0.0, wob = (vn(vec2(p.x * 0.9 + t * 0.4, p.y * 0.25)) - 0.5) * 3.0 + (vn(p * 2.3 - t * 0.5) - 0.5) * 1.4;
      if (dl.y < -0.02) {
        for (int i = 0; i < 8; i++) {
          vec4 q = uRank[i]; float tz = (q.z - lp.y) / dl.y, ew2 = 1.0 + 0.04 * tz, hx = lp.x + dl.x * tz + wob * (1.0 + 0.03 * tz), hy2 = Rw.y * tz;
          float m = smoothstep(q.x - ew2, q.x + ew2, hx) * (1.0 - smoothstep(q.y - ew2, q.y + ew2, hx)) * (1.0 - smoothstep(q.w - 2.0 * ew2, q.w + 2.0 * ew2, hy2));
          if (m > rkT) { rkT = m; rkD = tz; rkH = hy2; }
        }
      }
      float terr2 = fract(rkH / 40.0), fur2 = clamp(smoothstep(0.3, 0.0, terr2) + smoothstep(0.88, 1.0, terr2), 0.0, 1.0);
      vec3 rankC = mix(vec3(0.15, 0.16, 0.155) * (0.8 + 0.2 * smoothstep(0.12, 0.26, fract(rkH / 4.2))), vec3(0.16, 0.3, 0.07) * 1.1, fur2) * (uAmbCol * 0.6 + uSunCol * 0.42);
      refl = mix(refl, hazed(rankC, dist + rkD), rkT * 0.9);
    }
    #endif
    refl = mix(refl, vec3(0.07, 0.15, 0.045) * (uAmbCol + uSunCol * 0.45) * (0.8 + 0.6 * dap), crownR * 0.9);
    // columns standing in the water: piers (radius > 0) and the flanking falls (radius < 0)
    float pierR = 0.0, fallR = 0.0, rxz = dot(R.xz, R.xz) + 1e-5, fjit = vn(vec2(p.y * 0.8 + p.x * 0.3, t * 0.9)) - 0.5;
    #ifndef LITE
    for (int i = 0; i < 16; i++) {
      vec4 c = uCol[i]; vec2 o = c.xy - p; float tt = dot(o, R.xz) / rxz, r = abs(c.w) + 0.02 * tt;
      float lat = length(o - R.xz * tt) + (c.w < 0.0 ? fjit * r * 1.6 : 0.0);                     // a mirrored fall's edges waver and break with the water
      float m = (1.0 - smoothstep(r * (c.w < 0.0 ? 0.25 : 0.6), r * (c.w < 0.0 ? 1.35 : 1.2), lat)) * step(0.0, tt) * (1.0 - smoothstep(c.z * (c.w < 0.0 ? 0.25 : 0.9), c.z, R.y * tt));
      if (c.w < 0.0) fallR = max(fallR, m); else pierR = max(pierR, m);
    }
    #endif
    refl = mix(refl, vec3(0.3, 0.29, 0.25) * (uAmbCol + uSunCol * 0.4), pierR * 0.85);
    // the five decks, highest first so the lower lintels cover the higher ones: dark soffit, lilac fringe at each edge
    float dkc = 0.0;
    if (abs(lp.x) < 520.0 && lp.y > -260.0 && lp.y < 900.0) {
      // (the soffits are lit from below by the water: their mirror image is a soft grey-green, never a navy slab)
      vec3 soff = vec3(0.075, 0.08, 0.095) * (uAmbCol * 1.1 + uSunCol * 0.08) + (uAmbCol * vec3(0.5, 0.62, 0.5) + uSunCol * vec3(0.05, 0.07, 0.055)) * 0.5, fringe = uLilac * (uAmbCol * 0.85 + uSunCol * 0.5);
      // the decks are mirrored through a calmer surface than the sky is: the full ripple tore their long edges into islands
      vec3 Rk = reflect(-V, normalize(mix(vec3(0.0, 1.0, 0.0), N, mix(0.7, 0.22, smoothstep(10.0, 40.0, dist))))); Rk.y = abs(Rk.y) + 1e-3; float invK = 1.0 / max(Rk.y, 0.02);
      float fk = fres * fres, torn = smoothstep(0.25, 0.75, vn(p * 0.7 + vec2(t * 0.25, -t * 0.18)));
      deckMirror(refl, dkc, p, Rk, invK, dist, uDk[4], uDk2[4], soff, fringe, fk, pond, torn); deckMirror(refl, dkc, p, Rk, invK, dist, uDk[3], uDk2[3], soff, fringe, fk, pond, torn);
      deckMirror(refl, dkc, p, Rk, invK, dist, uDk[2], uDk2[2], soff, fringe, fk, pond, torn); deckMirror(refl, dkc, p, Rk, invK, dist, uDk[1], uDk2[1], soff, fringe, fk, pond, torn);
      deckMirror(refl, dkc, p, Rk, invK, dist, uDk[0], uDk2[0], soff, fringe, max(fk, 0.3 * pond), pond, torn);
    }
    refl = mix(refl, (uAmbCol * 0.9 + uSunCol * 0.6) * vec3(1.0, 0.98, 0.95), fallR * (0.3 + 0.3 * vn(vec2(p.x * 1.3, p.y * 0.35 - t * 2.0))) * (0.55 + 0.45 * smoothstep(0.3, 0.7, vn(p * 1.9 + vec2(0.0, t * 1.4)))) * (1.0 - 0.75 * smoothstep(0.3, 0.7, V.y)) * (1.0 - smoothstep(4.5, 10.0, cameraPosition.y)));      // (from the air a mirrored fall is a pale box at its foot)
    // the ring's reflection
    float dn = dot(R, uPortalN); float tp = dot(uPortal - vW, uPortalN) / (abs(dn) < 1e-3 ? 1e-3 : dn);
    vec3 H = vW + R * tp; float dr = length(H - uPortal);
    float ring = (exp(-(dr - RING_R) * (dr - RING_R) * 0.5) + 0.7 * (1.0 - smoothstep(RING_R - 3.0, RING_R, dr))) * step(0.0, tp) * uRing;
    // from the air we look into the water, not at a pale sky lying on it: what the mirror still shows is the slate of the rain wall
    float air = smoothstep(4.5, 12.0, cameraPosition.y);
    refl = mix(refl, refl * vec3(0.8, 0.88, 0.98), air);                    // (round 15: the flood seen from the air still carries the sky: slate-blue and cloud, not black-green)
    refl += uPortalCol * ring;
    // looking down: asphalt, ghost lane paint, moss; the pond is green and deep
    float street = step(abs(p.x), 30.0) * step(-40.0, p.y);
    // ghosts of lane paint: short dashes with square ends (long lines along the road fan out from the eye as pale rays)
    float pdash = fract(p.y / 12.0);
    float paint = street * smoothstep(0.476, 0.486, abs(fract(p.x / 6.0) - 0.5)) * smoothstep(0.0, 0.012, pdash) * (1.0 - smoothstep(0.24, 0.252, pdash)) * 0.1 * (1.0 - smoothstep(20.0, -40.0, p.y)) * (1.0 - smoothstep(22.0, 55.0, dist));
    float mossy = smoothstep(0.45, 0.75, vn(p * 0.09) * 0.6 + vn(p * 0.5) * 0.4);
    vec3 base = mix(vec3(0.05, 0.078, 0.066), vec3(0.075, 0.15, 0.052), mossy * 0.85) + paint * vec3(0.42, 0.42, 0.34);      // weed-green asphalt under clear water, never a mauve floor
    base *= mix(vec3(1.0), vec3(0.6, 0.98, 0.86), max(smoothstep(0.3, 0.75, V.y), smoothstep(0.1, 0.45, V.y) * air));                    // from the air the flood is green and deep, not lit sand
    base *= mix(vec3(1.0), vec3(0.6, 0.9, 0.82), air);
    // the pond bed: green depth mottled with weed and pale silt, not one flat tone
    float weed = vn(p * 0.55 + 11.0) * 0.6 + vn(p * 1.9 + 3.0) * 0.4;
    base = mix(base, mix(vec3(0.03, 0.085, 0.05), vec3(0.075, 0.15, 0.07), smoothstep(0.3, 0.75, weed)) * mix(vec3(1.0), vec3(0.66, 0.9, 1.08), deep), max(pond, 1.0 - street) * 0.8);      // (0.9 m of water over the pond's bed: deeper and cooler than the flood on the road)
    // sunlight through 0.25 m of moving water: a net of bright caustic lines sliding over the road bed, gone in every shadow
    vec2 cw = p + g * 1.6;
    float c1 = 1.0 - abs(2.0 * vn(cw * 2.6 + t * vec2(0.3, 0.2)) - 1.0), c2 = 1.0 - abs(2.0 * vn(cw * 4.3 + 3.7 - t * vec2(0.25, 0.35)) - 1.0);
    float caus = mix(c1 * c1 * c1 * c1 + 0.6 * c2 * c2 * c2 * c2 * c2, 0.36, max(smoothstep(12.0, 40.0, dist), air));
    vec3 light = uAmbCol * vec3(1.35, 1.6, 1.45) + uSunCol * litB * (0.85 + 0.6 * caus * uBed.x) * (1.0 - 0.64 * deep) * (1.0 - 0.45 * air);
    // in shade no light reaches the bed, so the mirror carries the picture there: cool sky and clouds, not black asphalt
    // (under a deck within a few metres of the eye we look down through the water: bed, pads and petals take over from the soffit's mirror image)
    float steep = smoothstep(0.3, 0.75, V.y);                                // from high above we look into the water: the green bed, pads and weed, not a grey sky
    float mirK = mix(mix(max(fres, 0.44 - 0.26 * steep), max(fres, 0.2 - 0.06 * steep), lit), max(fres, 0.16), dkc * (1.0 - smoothstep(6.0, 18.0, dist)));
    mirK *= 1.0 - 0.28 * air * (1.0 - fres);
    vec3 col = mix(base * light, refl * mix(vec3(0.8, 0.85, 0.96), vec3(1.0), lit), mirK);
    col *= mix(vec3(1.0), vec3(0.7, 0.98, 1.12), air);                     // (a warm sky must not turn the flood khaki from above)
    // (no foam threads drawn out along the way we run: from the saddle they fanned out as long rays and the water read as a stretched picture)
    // fallen petals: rafts of fine pale dots turning on the water, never a solid patch
    vec2 drift = t * vec2(0.03, -0.07);
    float raft = smoothstep(0.42, 0.95, vn(p * 0.4 + drift) * 0.55 + vn(p * 1.7 + drift) * 0.45) * (0.3 + 0.7 * smoothstep(250.0, 60.0, length(lp - vec2(0.0, 150.0)) - 200.0));
    vec2 pq = (p + drift * 6.0) / 0.22, pid = floor(pq), pf = fract(pq) - 0.5;
    raft *= raft;
    float dot1 = step(1.0 - raft * 0.36, h21(pid)) * smoothstep(0.3, 0.16, length((pf - (vec2(h21(pid + 1.3), h21(pid + 2.7)) - 0.5) * 0.4) * vec2(1.0, 1.5)));
    float nearP = 1.0 - smoothstep(18.0, 60.0, dist);
    col = mix(col, uPetal * (uAmbCol + uSunCol * litB * 0.6) * 0.62, (dot1 * 0.46 * nearP + raft * mix(0.07, 0.03, pond) * (1.0 - nearP)) * (1.0 - 0.6 * pond * (1.0 - nearP)));
    // seen from the air: the fallen petals lie on the dark water in long pale drifts that the current draws out, thickest under the decks
    float swirl = smoothstep(0.66, 0.84, vn(p * vec2(0.06, 0.1) + drift * 0.6 + 3.0) * 0.55 + vn(p * vec2(0.33, 0.21) + drift) * 0.45) * (0.35 + 0.65 * smoothstep(250.0, 60.0, length(lp - vec2(0.0, 150.0)) - 200.0));
    col = mix(col, uPetal * (uAmbCol + uSunCol * litB * 0.6) * 0.6, swirl * smoothstep(0.45, 0.7, vn(p * vec2(2.3, 1.1) + drift * 3.0)) * 0.3 * air);
    // duckweed: rafts of fine green fronds lying against both kerbs (the middle of the flood stays a mirror), drifting slowly down the
    // flood toward the pit; matt (no mirror in them), a crowd of dots close by and a broken film of green from further off and from the air
    vec2 wdr = p + vec2(0.0, t * 0.11);
    float wkerb = smoothstep(16.0, 24.5, abs(p.x)) * street * step(p.y, 640.0) * (1.0 - pond);
    float wraft = smoothstep(0.5, 0.6, vn(wdr * vec2(0.11, 0.05)) * 0.55 + vn(wdr * 0.23 + 7.0) * 0.45 + 0.12 * smoothstep(25.0, 30.0, abs(p.x))) * wkerb * uWeed;
    vec2 wq = wdr / 0.085, wi = floor(wq); float wfar = smoothstep(3.0, 11.0, dist);
    float wdot = step(0.3, h21(wi)) * (1.0 - smoothstep(0.3, 0.46, length(fract(wq) - 0.5 - (vec2(h21(wi + 1.9), h21(wi + 3.3)) - 0.5) * 0.3)));
    float wtex = mix(wdot, 0.35 + 0.65 * smoothstep(0.3, 0.62, vn(wdr * 1.9 + 3.0) * 0.6 + vn(wdr * 5.3) * 0.4), wfar);      // (holes of open water in every raft)
    col = mix(col, mix(vec3(0.075, 0.17, 0.035), vec3(0.14, 0.26, 0.055), vn(wdr * 0.7 + 11.0)) * (uAmbCol * 1.15 + uSunCol * litB * 0.42), wraft * wtex * 0.8);
    // lily pads in the pond, thinning outward: veined, dark-rimmed, with a sheen of sky; white petalled flowers
    vec2 lc = floor(lp / 1.7), lf = fract(lp / 1.7) - 0.5; float lh = h21(lc + 11.0);
    float rad = 0.36 * (0.5 + 0.9 * h21(lc + 0.7));
    vec2 off = (vec2(h21(lc + 2.3), h21(lc + 5.9)) - 0.5) * (0.96 - 2.0 * rad); vec2 ld = lf - off + vec2(sin(t * 0.7 + lh * 20.0), cos(t * 0.6 + lh * 9.0)) * 0.012;
    float lpatch = smoothstep(0.3, 0.52, vn(lp * 0.045 + 3.0));
    lpatch = max(lpatch, 0.62 * (1.0 - smoothstep(9.0, 24.0, abs(lp.x))) * smoothstep(-4.0, 10.0, lp.y) * (1.0 - smoothstep(120.0, 160.0, lp.y)) * smoothstep(0.25, 0.5, vn(lp * 0.21 + 7.0) + 0.25));
    // and a broad raft of them in the open water between the top deck and the third, where the view looks straight down from over the top
    float band2 = (1.0 - smoothstep(30.0, 62.0, abs(lp.x - 4.0))) * smoothstep(150.0, 168.0, lp.y) * (1.0 - smoothstep(205.0, 228.0, lp.y)) * smoothstep(0.3, 0.55, vn(lp * 0.13 + 5.0) * 0.6 + vn(lp * 0.37) * 0.4 + 0.12);
    float want = step(1.0 - max((0.66 * pond + 0.12) * lpatch, 0.6 * band2) * uPads * step(length(lp - vec2(0.0, 80.0)), 190.0), lh);
    float dl = length(ld), la = atan(ld.y, ld.x + 1e-5) + lh * 40.0, rn = dl / rad;
    float notch = smoothstep(0.9, 0.96, cos(la)) * step(0.12, rn);
    float pad = want * smoothstep(1.0, 0.9, rn) * (1.0 - notch) * (1.0 - smoothstep(120.0, 200.0, dist) * 0.6);
    float vein = smoothstep(0.82, 1.0, abs(cos(la * 5.5))) * smoothstep(0.1, 0.5, rn) * (1.0 - smoothstep(30.0, 70.0, dist));
    vec3 padCol = mix(vec3(0.07, 0.19, 0.05), vec3(0.15, 0.31, 0.08), h21(lc + 4.4)) * (1.0 - 0.3 * vein) * (1.0 - 0.45 * smoothstep(0.72, 1.0, rn));
    padCol = padCol * (uAmbCol + uSunCol * litB * 0.8) + skyRefl(R) * fres * 0.55 * mix(vec3(0.6, 0.67, 0.8), vec3(1.0), lit);
    col = mix(col, padCol, pad);
    vec2 fd2 = ld - vec2(0.3, 0.12) * rad; float fa = atan(fd2.y, fd2.x + 1e-5), fl = length(fd2);
    float flower = want * step(0.8, h21(lc + 9.1)) * smoothstep(0.03, 0.0, fl - 0.13 * (0.72 + 0.28 * cos(fa * 9.0)));
    col = mix(col, mix(vec3(1.0, 0.82, 0.3), vec3(1.0, 0.97, 0.92), smoothstep(0.02, 0.05, fl)) * (uAmbCol + uSunCol * litB) * 0.62, flower);
    // sun glints on ripple crests, rain rings catching the sky
    // sun glitter: small points that wink on ripple crests, never strokes
    vec2 sq = p * 3.1 + g2 * 2.5, si = floor(sq); float sh = h21(si), tw = max(0.0, sin(t * (3.0 + 5.0 * sh) + sh * 40.0));
    vec2 rdv = p - cameraPosition.xz, mdir = -uSunDir.xz / max(length(uSunDir.xz), 1e-3);
    float road = uBed.z * (1.0 - smoothstep(0.03, 0.11, abs(dot(rdv, vec2(mdir.y, -mdir.x))) / max(length(rdv), 1.0))) * step(0.0, dot(rdv, mdir));   // the moon road: a lane of glitter running out ahead of us
    float spark = step(0.74 - 0.42 * road, sh) * smoothstep(0.24, 0.04, length(fract(sq) - 0.5 - (vec2(h21(si + 1.7), h21(si + 4.1)) - 0.5) * 0.5)) * tw * tw * tw;
    col += uSunCol * litB * spark * 1.3 * (uBed.y + 1.6 * road) * (1.0 - pad) * (1.0 - smoothstep(35.0 + 110.0 * road, 80.0 + 160.0 * road, dist));
    // (round 15) THE RING'S LIGHT ON THE WATER: a broken lane of glitter from its foot toward the eye, as wide as the ring looks from
    // wherever we are, wandering with the swell and dying away with distance
    vec2 rgp = p - uPortal.xz, rgc = cameraPosition.xz - uPortal.xz; float rgL = max(length(rgc), 1.0); vec2 rgd = rgc / rgL;
    float ral = dot(rgp, rgd), rac = abs(dot(rgp, vec2(rgd.y, -rgd.x)) + (vn(p * 0.3 + t * 0.15) - 0.5) * 2.4);
    float rgw = (2.6 + 8.0 * clamp(1.0 - ral / rgL, 0.0, 1.0)) * (0.7 + 0.6 * vn(vec2(ral * 0.08, 3.0)));
    float rlane = (1.0 - smoothstep(0.3 * rgw, rgw, rac)) * smoothstep(1.0, 7.0, ral) * exp(-ral / (36.0 + 0.45 * rgL)) * step(0.0, dot(rgc, uPortalN.xz));
    float rglit = 0.18 + 0.82 * smoothstep(0.42, 0.78, vn(p * vec2(1.3, 2.9) + g2 * 2.0 + t * vec2(0.2, -0.6)) * 0.6 + vn(p * 0.37 - t * 0.1) * 0.4);
    col += uPortalCol * rlane * rglit * 0.55 * mix(0.3, 1.0, air) * uRing * (1.0 - pad);      // (from the saddle the ring's own mirror image carries it: the lane is for the air)
    col = col * (1.0 - 0.3 * ringT) + (uHor * 0.5 + uSunCol * lit * 0.5) * ringW * (0.2 + 0.5 * fband);
    // the front's own line on the water: a ruffled, broken band of pale chop where the first drops strike, the surface matt behind it
    float ruff = fband * smoothstep(0.3, 0.75, vn(p * vec2(0.45, 1.5) + vec2(t * 0.7, -t * 2.0)) * 0.6 + vn(p * vec2(1.7, 3.1) + t) * 0.4);
    col = mix(col, uHor * 0.62 + uSunCol * 0.3 * lit, ruff * 0.42 * (1.0 - pad) * (1.0 - smoothstep(140.0, 320.0, dist)));
    col += uSunCol * vec3(1.0, 0.95, 0.86) * 0.06 * lit * smoothstep(25.0, 110.0, dist) * uBed.y;      // far off a lit lane is a bright band on the water, a shaded one stays cool
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

// ---- concrete (street, pavements, monorail, court, buses, cars, the stack): vertex colour under stains, rain streaks and moss,
// lit by the shared sun mask; soffits catch moving light thrown up from sunlit water ----
const CONC_FRAG = /* glsl */`
  ${GLSL_COMMON}
  uniform vec3 uPetal;
  varying vec3 vW; varying vec3 vN; varying vec3 vC;
  #include <fog_pars_fragment>
  ${FOG_FAR}
  float kerbOf(vec2 sl, float y, vec4 d, vec4 e){ return step(abs(y - e.x - 2.4), 0.6) * smoothstep(e.y - 3.0, e.y - 0.8, deckDist(sl, d)); }
  void main(){
    vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) n = -n;
    vec2 sl = stackXZ(vW.xz); float fwj = min(fwidth(sl.x), 4.0);        // along the decks, for the soffit joints (derivative taken before any branch)
    float cdist = length(cameraPosition - vW), nearD = 1.0 - smoothstep(7.0, 30.0, cdist);
    float lit = sunMask(vW) * pitLit(vW), ndl = max(dot(n, uSunDir), 0.0);
    float up = smoothstep(0.35, 0.8, n.y), side = 1.0 - abs(n.y);
    float h = abs(n.x) > abs(n.z) ? vW.z : vW.x;
    vec2 hq = abs(n.y) > 0.7 ? vW.xz : vec2(h, vW.y);                       // level faces take their stains in plan: no stripes drawn out along one axis
    float big = vn(hq * 0.13 + 7.0), fine = vn(hq * 2.3), streak = vn(vec2(h * 1.7, vW.y * 0.09));
    float dark = step(vC.r + vC.g + vC.b, 0.12);                           // window sockets and other holes keep their darkness
    vec3 alb = vC * (0.8 + 0.3 * big + 0.14 * fine);
    alb = mix(alb, alb * vec3(0.5, 0.48, 0.46), side * smoothstep(0.55, 0.85, streak) * 0.7);
    // from a few metres: pitting and grit, hairline runs of damp, patches of lichen, so that no hull, pier or panel is a flat slab near the eye
    float pit = vn(hq * 9.0 + 5.0), grit = vn(hq * 27.0 + 2.0);
    alb *= 1.0 + nearD * ((pit - 0.5) * 0.55 + (grit - 0.5) * 0.3) * (1.0 - dark);
    alb = mix(alb, alb * vec3(0.56, 0.54, 0.5), side * smoothstep(0.58, 0.85, vn(vec2(h * 5.3 + 2.0, vW.y * 0.3))) * 0.55 * nearD);
    alb = mix(alb, mix(vec3(0.36, 0.38, 0.24), vec3(0.17, 0.27, 0.09), grit), smoothstep(0.6, 0.78, vn(hq * 2.9 + 17.0) * 0.6 + pit * 0.4) * 0.5 * nearD * (1.0 - dark) * step(-0.3, n.y));
    float lipMoss = (1.0 - smoothstep(-0.6, 2.6, -vW.y - 2.3 * (vn(vec2(h * 0.75, 1.3)) - 0.45) - 1.1 * (vn(vec2(h * 2.3 + 7.0, 2.9)) - 0.5) - 0.8 * (fine - 0.5))) * step(vW.y, 0.0);      // down in the pits: tongues of moss hanging from the rim
    float mossK = max(up * smoothstep(0.3, 0.7, vn(vW.xz * 0.35) * 0.6 + fine * 0.4 + 0.12), side * max(smoothstep(6.0, 0.3, vW.y + 5.0 * big) * step(-0.6, vW.y), lipMoss)) * (1.0 - dark);
    alb = mix(alb, folTint(mix(vec3(0.12, 0.25, 0.06), vec3(0.2, 0.3, 0.08), vn(hq * 1.1 + 3.0))) * (0.65 + 0.7 * fine) * (1.0 - 0.3 * lipMoss * smoothstep(-0.6, 0.0, vW.y)), mossK * 0.8);
    // the carriageways up on the decks are meadows now: drifts of small flowers in the moss, seen when the view climbs over them
    float parkK = step(vW.x, -41.5) * step(0.45, vW.y) * step(vW.y, 0.95) * step(vW.z, 261.0);      // the park's lawn is a meadow like the decks' carriageways
    float topK = up * max(smoothstep(11.0, 14.0, vW.y) * (1.0 - smoothstep(200.0, 240.0, vW.y)), parkK) * (1.0 - dark);
    if (topK > 0.01) {
      float drift = smoothstep(0.42, 0.7, vn(vW.xz * 0.11 + 5.0) * 0.6 + vn(vW.xz * 0.4) * 0.4);
      alb = mix(alb, folTint(mix(vec3(0.13, 0.27, 0.07), vec3(0.24, 0.36, 0.1), vn(vW.xz * 0.9 + 2.0))) * (0.7 + 0.6 * fine), topK * (0.35 + 0.4 * drift));
      if (parkK > 0.5) {      // (round 15) the park is rough meadow, not a lawn: tussocks light and dark, drifts of buttercup, vetch and cow parsley that read from the air
        float tus = vn(vW.xz * 0.55 + 3.0), tus2 = vn(vW.xz * 1.9 + 11.0);
        alb *= 0.58 + 0.9 * smoothstep(0.25, 0.75, tus * 0.6 + tus2 * 0.4);
        alb = mix(alb, vec3(0.86, 0.72, 0.2), smoothstep(0.6, 0.8, vn(vW.xz * 0.16 + 21.0)) * (0.3 + 0.45 * tus2));
        alb = mix(alb, vec3(0.62, 0.45, 0.85), smoothstep(0.62, 0.82, vn(vW.xz * 0.21 + 47.0)) * (0.3 + 0.45 * tus2));
        alb = mix(alb, vec3(0.88, 0.86, 0.8), smoothstep(0.68, 0.85, vn(vW.xz * 0.27 + 77.0)) * 0.45 * tus);
      }
      vec2 fq = vW.xz * 3.2, fi = floor(fq); float fh = h21(fi), fl = length(fract(fq) - 0.5 - (vec2(h21(fi + 1.7), h21(fi + 4.1)) - 0.5) * 0.6);
      vec3 fcol = fh > 0.94 ? vec3(0.95, 0.78, 0.25) : fh > 0.86 ? vec3(0.95, 0.93, 0.85) : vec3(0.7, 0.5, 0.9);
      float fk = step(1.0 - 0.3 * drift, fh) * smoothstep(0.2, 0.08, fl) * (1.0 - smoothstep(30.0, 70.0, cdist));
      alb = mix(alb, fcol, topK * (fk * 0.85 + drift * 0.12 * smoothstep(20.0, 70.0, cdist)));      // far off the drifts are a lilac bloom on the green
      // looked down on from a few metres: blades and their shadows, heads of cow parsley and buttercup, and the wisteria's fallen
      // petals lying in pale drifts along both kerbs
      float bl = vn(vW.xz * vec2(7.0, 19.0)) * 0.5 + vn(vW.xz * vec2(23.0, 9.0) + 4.0) * 0.5;
      alb *= 1.0 + (bl - 0.5) * 1.1 * topK * (1.0 - smoothstep(10.0, 42.0, cdist));
      vec2 uq = vW.xz * 1.7, ui = floor(uq); float uh = h21(ui + 31.0), ul = length(fract(uq) - 0.5 - (vec2(h21(ui + 5.7), h21(ui + 8.3)) - 0.5) * 0.5);
      float umb = step(1.0 - 0.5 * drift, uh) * smoothstep(0.2, 0.1, ul) * smoothstep(0.3, 0.55, vn(vW.xz * 13.0)) * (1.0 - smoothstep(70.0, 150.0, cdist));
      alb = mix(alb, uh > 0.9 ? vec3(0.9, 0.74, 0.22) : vec3(0.9, 0.88, 0.8), topK * umb * 0.75);
      float kerb = max(max(kerbOf(sl, vW.y, uDk[0], uDk2[0]), kerbOf(sl, vW.y, uDk[1], uDk2[1])), max(max(kerbOf(sl, vW.y, uDk[2], uDk2[2]), kerbOf(sl, vW.y, uDk[3], uDk2[3])), kerbOf(sl, vW.y, uDk[4], uDk2[4])));
      float pk = kerb * smoothstep(0.4, 0.66, vn(vW.xz * 0.45 + 9.0) * 0.55 + vn(vW.xz * 3.1 + 2.0) * 0.45 + 0.2 * kerb);
      alb = mix(alb, mix(uPetal, vec3(0.9, 0.88, 0.86), 0.45) * 0.7 * (0.6 + 0.6 * vn(vW.xz * 5.0 + 1.0)), topK * pk * 0.6);
    }
    alb *= mix(1.0, 0.55, (1.0 - smoothstep(0.0, 0.7, abs(vW.y - 0.05))) * side);            // wet at the water line
    alb *= mix(1.0, 0.75, smoothstep(-0.5, -5.0, vW.y));                                       // wet, darker walls down in the court
    vec3 hemi = mix(vec3(0.3, 0.38, 0.26) * dot(uAmbCol, vec3(0.4)), uAmbCol, n.y * 0.5 + 0.5);
    float under = smoothstep(-0.3, -0.8, n.y);
    // soffits: a cast joint every 8 m, dark drip stains and pale lime bleeding from the joints, and light off the water below them
    float jl = abs(fract(sl.x / 8.0 + 0.5) - 0.5) * 8.0, joint = (1.0 - smoothstep(0.07 + fwj, 0.16 + 2.0 * fwj, jl)) * (1.0 - smoothstep(1.0, 3.0, fwj));
    float drip = smoothstep(0.5, 0.8, vn(vec2(sl.x * 0.9, sl.y * 0.14 + 3.0)) * 0.7 + 0.3 * fine), lime = (1.0 - smoothstep(0.2, 1.6, jl)) * smoothstep(0.4, 0.8, vn(vec2(sl.x * 0.3, sl.y * 0.8)));
    alb = mix(alb, alb * 0.5 * (1.0 - 0.3 * joint) + vec3(0.2, 0.2, 0.18) * lime, under * max(max(drip * 0.7, joint * 0.8), lime * 0.55));      // (a joint is a shade darker, never a black dash)
    // (round 15) and no soffit is one tone: the marks of the boards it was cast on, broad patches of damp, rust bleeding along the
    // girders, algae where the wet stands; the water's light plays on it as a moving net
    float board = (1.0 - smoothstep(0.03, 0.09, abs(fract(sl.y / 1.3) - 0.5))) * (1.0 - smoothstep(25.0, 70.0, cdist));
    float sbig = vn(sl * 0.07 + 13.0), srust = smoothstep(0.52, 0.78, vn(sl * vec2(0.5, 0.11) + 5.0) * 0.6 + sbig * 0.4), salg = smoothstep(0.5, 0.78, vn(sl * 0.23 + 21.0) * 0.6 + fine * 0.4);
    vec3 sa = alb * (0.6 + 0.75 * sbig) * (1.0 - 0.25 * board);
    sa = mix(sa, vec3(0.36, 0.21, 0.12) * (0.7 + 0.6 * fine), srust * 0.5);
    sa = mix(sa, folTint(vec3(0.12, 0.2, 0.07)) * (0.7 + 0.6 * fine), salg * 0.5);
    alb = mix(alb, sa, under * (1.0 - dark));
    float caus = 0.5 + 1.1 * vn(vW.xz * 0.3 + uTime * vec2(0.3, 0.2)) * vn(vW.xz * 0.7 - uTime * vec2(0.25, 0.35));
    float net = 1.0 - abs(2.0 * vn(vW.xz * 0.42 + uTime * vec2(0.21, 0.16)) - 1.0); net = net * net * net;
    vec3 bounce = uSunCol * vec3(0.6, 0.8, 0.62) * 0.2 * under * caus * (under > 0.01 ? sunMask(vec3(vW.x, 0.0, vW.z)) : 0.0);
    bounce += (uAmbCol * vec3(0.5, 0.62, 0.5) + uSunCol * vec3(0.05, 0.07, 0.055)) * under * (0.6 + 0.6 * caus + 0.8 * net);       // a floor that needs no sun on the water below
    // the ring is a lamp: warm light on every soffit, pier and flank that faces it, falling off with distance
    vec3 rv = uRingL.xyz - vW; float rd2 = dot(rv, rv);
    bounce += uRingC * uRingL.w * (0.6 * under + 0.6 * max(dot(n, rv) / sqrt(rd2 + 1e-3), 0.0)) / (1.0 + rd2 / 700.0);
    bounce *= 1.0 + 1.6 * under * (1.0 - smoothstep(16.0, 46.0, cdist)) * smoothstep(9.0, 17.0, cameraPosition.y);          // a soffit the view passes close under, from above the water: its light off the pond is plain to see
    // light thrown back by the sunlit water on whatever stands in it (hulls, kerbs, pier feet): a flank turned from the sun is never a black block
    bounce += uSunCol * vec3(0.75, 0.85, 0.7) * 0.17 * side * (1.0 - under) * smoothstep(-0.3, 0.2, vW.y) * (1.0 - smoothstep(1.0, 9.0, vW.y)) * (0.35 + 0.65 * lit);
    bounce += (uAmbCol * vec3(0.5, 0.66, 0.55) * 0.9 + uSunCol * vec3(0.1, 0.15, 0.12)) * smoothstep(-0.5, -4.0, vW.y) * (0.7 + 0.6 * caus);      // down in the court: light off the pool, the white water and the mist, and from the opening (no wall of it is a black slab)
    vec3 col = max(alb, vec3(0.0)) * (hemi * 0.95 + uSunCol * ndl * lit + bounce);
    gl_FragColor = vec4(max(fogFar(col, vW, cdist), vec3(0.0)), 1.0);
  }`;
// ---- the green pool on the floor of the court ----
const POOL_FRAG = /* glsl */`
  ${GLSL_COMMON}
  varying vec3 vW; varying vec3 vN; varying vec3 vC;
  #include <fog_pars_fragment>
  void main(){
    vec2 p = vW.xz; vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0)); float t = uTime;
    vec2 g = vec2(vn(p * 1.3 + t * vec2(0.5, 0.3)) - vn(p * 1.3 + vec2(0.6, 0.0) + t * vec2(0.5, 0.3)), vn(p * 1.3 + t * vec2(0.5, 0.3)) - vn(p * 1.3 + vec2(0.0, 0.6) + t * vec2(0.5, 0.3)));
    vec3 N = normalize(vec3(g.x * 0.5, 1.0, g.y * 0.5)); vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
    float fres = 0.08 + 0.92 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 3.0), lit = pitLit(vW + vec3(0.0, 0.2, 0.0)) * sunLane(vec3(vW.x, 0.0, vW.z));
    float foam = smoothstep(0.55, 0.9, vn(p * 0.9 - t * vec2(0.2, 0.5)) * 0.6 + vn(p * 3.1 + t * 0.4) * 0.4) * smoothstep(8.0, 1.0, min(min(p.x + 32.0, 18.0 - p.x), min(p.y - 20.0, 62.0 - p.y)));
    vec3 col = mix(vec3(0.05, 0.22, 0.1) * (uAmbCol * 1.3 + uSunCol * lit), skyRefl(R) * 0.9, fres);
    col += vec3(0.25, 0.5, 0.22) * uSunCol * lit * 0.35 * vn(p * 2.2 + g * 6.0 + t * 0.5);
    col = mix(col, (uAmbCol * 1.2 + uSunCol * lit) * 0.8, foam * 0.7);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }`;
// ---- towers: teal curtain glass carrying the sky and its clouds, concrete slabs, mullions, a pilaster every six panes and a dark
// spandrel every five floors, clustered sockets with ferns, creeper stains; grid lines are filtered and melt into their mean far off ----
const TOWER_FRAG = /* glsl */`
  #define FAR_DARK 1.0
  ${GLSL_COMMON}
  uniform float uRimK, uGrid;
  varying vec3 vW; varying vec3 vN; varying vec3 vC;
  #include <fog_pars_fragment>
  ${FOG_FAR}
  float lineCov(float x, float c, float hw, float fw){ float d = abs(fract(x - c + 0.5) - 0.5); return mix(1.0 - smoothstep(hw - fw, hw + fw, d), 2.0 * hw, smoothstep(0.35, 0.9, fw)); }
  void main(){
    // (the builder winds its boxes inward and this material draws both sides: what is seen of a tower is the outside of its walls, never
    // the far wall from within with the underside of its roof for a black ceiling)
    vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) n = -n;
    vec3 toCam = cameraPosition - vW + vec3(0.0, 1e-4, 0.0); float dist = length(toCam); vec3 V = toCam / dist;
    float lane = sunLane(vW), ndl = max(dot(n, uSunDir), 0.0);
    vec3 light = uAmbCol * (0.75 + 0.25 * n.y) + uSunCol * ndl * lane;
    vec3 col;
    float h = abs(n.x) > 0.5 ? vW.z : vW.x; vec2 gq = vec2(h / 3.6, vW.y / 4.2);
    vec2 fw = min(fwidth(gq), vec2(4.0)) * 0.75 + 1e-4;                  // derivatives are taken before any branch
    if (n.y > 0.5) {
      col = mix(vec3(0.1, 0.2, 0.05), vec3(0.3, 0.42, 0.12), vn(vW.xz * 0.3)) * light;
    } else if (n.y < -0.5) {
      col = vC * (uAmbCol * 0.6 + uSunCol * vec3(0.5, 0.65, 0.45) * 0.1) * (0.7 + 0.6 * vn(vW.xz * 0.2));      // a creeper-stained soffit lit from the street
    } else {
      vec2 id = floor(gq), f = fract(gq);
      vec2 lpT = stackXZ(vW.xz); float rankK = step(lpT.y, -45.0) * step(-270.0, lpT.y) * step(abs(lpT.x), 330.0), gridK = mix(uGrid, 0.82, rankK);      // the rank on the far bank
      float far = mix(smoothstep(110.0, 260.0, dist), smoothstep(300.0, 520.0, dist), rankK);      // (the rank keeps every pane's own tilt and tint out to 500 m: it is looked at for the whole last run)
      float slab = lineCov(gq.y, 0.1, 0.1, fw.y), mull = lineCov(gq.x, 0.035, 0.035, fw.x);
      float pil = lineCov(gq.x / 6.0, 0.03, 0.03, fw.x / 6.0), span = lineCov(gq.y / 5.0, 0.16, 0.06, fw.y / 5.0);
      // every pane sits a little differently in its frame and has its own tint. On the boulevard's two walls a pane near the eye mirrors
      // what stands across the water (the facing wall's floors and green terraces, sunlit if that is the right-hand wall; the bamboo plot;
      // the park), the flood below it, and the sky only above that roof line: neighbouring panes carry different pictures
      vec3 nj = normalize(n + (vec3(h21(id + 3.1), h21(id + 6.7), h21(id + 1.9)) - 0.5) * vec3(0.08, 0.05, 0.08) * (1.0 - far));
      vec3 R = reflect(-V, nj); float fr = 0.4 + 0.6 * pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 3.0);
      // dark teal glass that carries the sky: every pane sits a little differently in its frame, so they glint unevenly; looked up at steeply
      // a wall mirrors the bright lower sky and its clouds, not the dark zenith
      float lf = (0.8 + 0.12 * vn(id * 0.15) + 0.07 * (h21(vec2(id.y, 3.0)) - 0.5)) * mix(0.72 + 0.56 * h21(id + 9.0), 1.0, far);
      vec3 skyC = skyRefl(normalize(vec3(R.x, abs(R.y) * 0.45 + 0.06, abs(R.z) * 0.6 + 0.3)));
      float sideW = step(0.5, abs(n.x)) * step(abs(vW.x), 43.0) * step(-12.0, vW.z) * (1.0 - far);
      float txo = 84.0 / max(abs(R.x), 0.03), hyo = vW.y + R.y * txo, hzo = vW.z + R.z * txo, bay = (700.0 - hzo) / 101.4;
      float roofR = step(-80.0, hzo) * step(hzo, 700.0) * (1.0 - smoothstep(0.81, 0.83, fract(bay))) * (250.0 + 80.0 * h21(vec2(floor(bay), 2.0)));
      float roofL = hzo > 604.0 ? 24.0 : hzo > 598.0 ? 0.0 : hzo > 532.0 ? 300.0 : hzo > 524.0 ? 0.0 : hzo > 458.0 ? 265.0 : hzo > 357.0 ? 24.0 : hzo > 327.0 ? 0.0 : hzo > 258.0 ? 325.0 : 10.0;
      float roof = n.x < 0.0 ? roofL : roofR;                               // a pane of the right-hand wall looks at the left-hand one
      float oppK = sideW * max((1.0 - smoothstep(roof - 6.0, roof + 6.0, hyo)) * step(0.5, roof), step(hyo, 0.0));
      float fl2 = smoothstep(0.1, 0.24, fract(hyo / 4.2)), terr2 = fract(hyo / 55.0), fur2 = clamp(smoothstep(0.26, 0.0, terr2) + smoothstep(0.9, 1.0, terr2), 0.0, 1.0);
      vec3 oppSun = uAmbCol * 0.55 + uSunCol * (n.x > 0.0 ? 0.3 * smoothstep(40.0, 110.0, hyo) : 0.03);
      vec3 oppC = mix(vec3(0.06, 0.1, 0.105) * (0.6 + 0.4 * fl2) + skyC * 0.12, vec3(0.13, 0.25, 0.06), max(fur2, 1.0 - step(30.0, roof))) * (oppSun * 1.5 + 0.1);
      oppC = mix(oppC, vec3(0.05, 0.1, 0.075) * (uAmbCol + uSunCol * 0.2), step(hyo, 0.0));        // below the facing wall: the flood
      vec3 tintP = mix(vec3(1.0), vec3(0.86, 1.02, 1.02) + (vec3(h21(id + 21.0), h21(id + 23.0), h21(id + 27.0)) - 0.5) * vec3(0.3, 0.16, 0.2), 1.0 - far);
      vec3 glass = vec3(0.03, 0.078, 0.086) * (uAmbCol + uSunCol * ndl * lane * 0.6) * 1.6 * (1.0 - 0.4 * fr * (1.0 - far)) + mix(skyC, oppC, oppK) * tintP * mix(min(fr, 0.72), fr, far) * lf * mix(0.75, 1.0, lane) * mix(vec3(1.0), vec3(0.4, 0.6, 0.68), rankK);
      // sockets come in clusters: dark teal, never black, ferns filling the lower part behind a ragged edge
      float sock = step(h21(id + 5.0), max(mix(0.34, 0.166, smoothstep(16.0, 70.0, vW.y)) * smoothstep(0.45, 0.7, vn(id * 0.11 + 3.0)), 0.083)) * (1.0 - 0.75 * far);      // one pane in twelve at the least
      float fern = 1.0 - smoothstep(-0.06, 0.06, f.y - 0.2 - 0.48 * (0.75 + 0.5 * vn(vec2(gq.x * 6.0, id.y))));
      // DEPTH. Every pane sits 0.55 m back in its reveal: along the sight line the glass is met further on, so the head of each opening
      // is a band of shadow, the jamb turned to the sun a warm strip, and both slide as we pass. Behind the pane is a room 5 m deep: a
      // dim back wall with a doorway, a mossed floor, a dark ceiling, and the side wall the sun reaches through the opening lit warm.
      vec3 T = abs(n.x) > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
      float vnn = max(dot(V, n), 0.08), nearW = 1.0 - mix(smoothstep(90.0, 210.0, dist), smoothstep(330.0, 520.0, dist), rankK);
      vec2 dir2 = -vec2(dot(V, T) / 3.6, V.y / 4.2) / vnn, fs = f + dir2 * 0.55;
      float inAp = step(0.07, f.x) * step(0.2, f.y) * nearW;
      float jamb = inAp * (1.0 - step(0.07, fs.x) * step(fs.x, 1.0)), head = inAp * step(1.0, fs.y), sill = inAp * (1.0 - step(0.2, fs.y));
      vec2 q0 = clamp(fs, vec2(0.07, 0.2), vec2(1.0));
      float tx = dir2.x > 0.0 ? (1.0 - q0.x) / max(dir2.x, 1e-4) : (0.07 - q0.x) / min(dir2.x, -1e-4);
      float ty = dir2.y > 0.0 ? (1.0 - q0.y) / max(dir2.y, 1e-4) : (0.2 - q0.y) / min(dir2.y, -1e-4);
      float tr = min(min(tx, ty), 5.0), deep = exp(-tr * 0.28), rn = vn(gq * vec2(5.0, 4.0) + id * 0.7);
      vec2 bq = q0 + dir2 * tr;
      vec3 sideN = T * (dir2.x > 0.0 ? -1.0 : 1.0);
      float sunIn = max(dot(sideN, uSunDir), 0.0) * (1.0 - smoothstep(1.2, 4.0, tr)) * lane;
      vec3 room = tr > 4.99 ? vec3(0.2, 0.21, 0.17) * (1.0 - 0.8 * step(0.52, bq.x) * step(bq.x, 0.8) * step(bq.y, 0.78))      // back wall and its doorway
        : tx < ty ? vec3(0.24, 0.23, 0.19) * (0.7 + 0.6 * rn)                                                                    // a side wall
        : dir2.y > 0.0 ? vec3(0.07, 0.075, 0.07) : folTint(vec3(0.12, 0.2, 0.07)) * (0.6 + 0.8 * rn);                           // ceiling, mossed floor
      room *= (uAmbCol * (0.35 + 0.4 * deep) + uSunCol * (tx < ty && tr < 4.99 ? sunIn * 1.1 : 0.06 * deep * lane)
        + uSunCol * ndl * lane * (tr > 4.99 ? 0.6 : 0.25) * (1.0 - smoothstep(0.1, 0.62, uSunDir.y)));      // a low sun shines straight in: the back wall of a room that faces it is lit
      glass += room * mix(0.3, 0.5, rankK) * nearW * (1.0 - 0.5 * fr);                                                                           // dimly, through the pane
      vec3 hole = mix(mix(glass * 0.3 + vec3(0.004, 0.012, 0.012), room * 0.55 + vec3(0.006, 0.012, 0.012), nearW), folTint(vec3(0.11, 0.25, 0.06)) * light * (0.7 + 0.6 * vn(gq * vec2(9.0, 7.0))), fern * 0.9);      // a dark socket, ferns in its lower part
      glass = mix(glass, hole, sock);
      glass = mix(glass, vC * light * 0.42, span * 0.8);
      vec3 jambN = T * (fs.x < 0.07 ? 1.0 : -1.0);
      glass = mix(glass, vC * (uAmbCol * 0.5 + uSunCol * max(dot(jambN, uSunDir), 0.0) * lane * 0.95) * (0.8 + 0.3 * rn), jamb);
      glass = mix(glass, vC * (uAmbCol * 0.75 + uSunCol * max(uSunDir.y, 0.0) * lane * 0.5) * mix(vec3(1.0), folTint(vec3(0.5, 0.75, 0.3)), smoothstep(0.4, 0.7, rn)), sill);
      glass = mix(glass, vC * uAmbCol * 0.26, head);
      vec3 conc = vC * light * (0.85 + 0.3 * vn(vec2(h, vW.y) * 0.21)) * gridK;
      conc = mix(vec3(dot(conc, vec3(0.3, 0.55, 0.15))), conc, 0.4 + 0.6 * gridK);                // the frames are weathered grey: in low sun they do not turn the wall into peach graph paper
      col = mix(glass, conc, clamp(max(max(slab, mull), pil), 0.0, 1.0) * 0.85);
      float creep = vn(vec2(h * 0.07, vW.y * 0.018)) * 0.6 + vn(vec2(h * 0.4, vW.y * 0.11)) * 0.4 + 0.12 * exp(-vW.y * 0.03);
      float creepE = creep + (vn(vec2(h * 0.55 + 3.0, vW.y * 0.5)) - 0.5) * 0.3 * rankK;      // on the rank the creeper has a leaf-edged outline: patches, not a wash
      col = mix(col, folTint(vec3(0.1, 0.21, 0.05)) * (0.4 + 0.6 * uFol.w) * light * (0.8 + 0.6 * vn(vec2(h * 1.3, vW.y * 0.9))), smoothstep(0.52 - 0.07 * rankK, mix(0.7, 0.5, rankK), creepE) * 0.85);
      // by moonlight tower W's corner takes a soft rim of light, so that the long fall hangs on a wall and not in the sky
      float wRim = uRimK * step(vW.z, -9.0) * step(-81.0, vW.z) * step(41.0, vW.x) * step(vW.x, 113.0) * max(step(0.5, n.z), step(n.x, -0.5)) * exp(-max(vW.x - 42.0, 0.0) * 0.06);
      col += uSunCol * vec3(0.55, 0.62, 0.75) * wRim * (0.16 + 0.1 * vn(vec2(h * 0.4, vW.y * 0.05)));
    }
    col = max(col, uAmbCol * vec3(0.5, 0.65, 0.45) * 0.1);                    // nothing of a tower is ever a black cut-out
    gl_FragColor = vec4(max(fogFar(col, vW, dist), vec3(0.0)), 1.0);
  }`;

function makeMaterials(L, heroU, lite) {
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const dk = deckUniforms();
  const shared = {
    uZen: { value: C(L.zenith) }, uHor: { value: C(L.horizon) }, uSlateCol: { value: C(L.slate, 0.62) }, uSunDir: { value: L.sunDir.clone() },
    uSunCol: { value: C(L.sunColor, L.sunK) }, uAmbCol: { value: C(L.amb, L.ambK) }, uCloudCol: { value: C(L.cream, L.cloudK) }, uSlate: { value: 0 }, uTime: { value: 0 },
    uHero: { value: new THREE.Vector4(HERO.x, HERO.z, Math.cos(HERO.rot), Math.sin(HERO.rot)) }, uDk: { value: dk.a }, uDk2: { value: dk.b },
    uRider: { value: new THREE.Vector4(0, 540, 0, -1) }, uRiderK: { value: new THREE.Vector3(0, 0, 0) }, uLaneK: { value: L.laneK ?? 0 },
    uFol: { value: new THREE.Vector4(...(L.fol || [1, 1, 1, 1])) }, uPetal: { value: C(L.petal) }, uShMin: { value: L.shMin ?? 0.5 },
    uRingL: { value: new THREE.Vector4(130, 3, -432, 1) }, uRingC: { value: C(L.portal).lerp(C('#ffc98e'), 0.65).multiplyScalar(0.85) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const tw = TOWERS.map((t) => new THREE.Vector4(t.z0, t.z1, t.h, t.side));
  const far4 = (n) => { const a = []; for (let i = 0; i < n; i++) a.push(new THREE.Vector4(1e5, 1e5, 0, 0.1)); return a; };
  const water = new THREE.ShaderMaterial({
    fog: true, defines: lite ? { LITE: 1, RING_R: RING.toFixed(1) } : { RING_R: RING.toFixed(1) },      // phones: no crown or pier loops in the mirror
    uniforms: { ...fogU(), ...shared, uTw: { value: tw }, uCol: { value: far4(16) }, uCrown: { value: far4(14) }, uRank: { value: far4(8) }, uRain: { value: 0 }, uPads: { value: 1 }, uWeed: { value: 1 }, uLaneC: { value: L.laneC ?? 1 }, uFront: { value: new THREE.Vector2(0, 0) }, uBed: { value: new THREE.Vector3(L.bed ?? 1, L.spark ?? 1, L.road ?? 0) },
      uPortal: { value: new THREE.Vector3(130, 3, -432) }, uPortalN: { value: new THREE.Vector3(-0.47, 0, 0.883) }, uPortalCol: { value: C(L.portal, 2.2) }, uRing: heroU.ring,
      uLilac: { value: C(L.fringe) }, uPetal: { value: C(L.petal) } },
    vertexShader: VERT_W, fragmentShader: WATER_FRAG,
  });
  const concrete = new THREE.ShaderMaterial({ fog: true, vertexColors: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...shared }, vertexShader: VERT_W, fragmentShader: CONC_FRAG });
  const pool = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...shared }, vertexShader: VERT_W, fragmentShader: POOL_FRAG });
  const tower = new THREE.ShaderMaterial({ fog: true, vertexColors: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...shared, uRimK: { value: L.rimW ?? 0 }, uGrid: { value: L.grid ?? 0.8 } }, vertexShader: VERT_W, fragmentShader: TOWER_FRAG });
  // ---- green fur: creeper curtains hanging from every terrace edge, a bumpy shrub crest above it ----
  const fur = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...shared },
    vertexShader: /* glsl */`
      attribute vec4 aInfo; uniform float uTime; varying vec2 vUv; varying vec4 vI; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vUv = uv; vI = aInfo; vec3 p = position;
        float hang = aInfo.x < 0.5 ? (1.0 - uv.y) : uv.y;                  // curtains swing at the bottom, crests nod at the top
        p.xz += vec2(sin(uTime * 0.9 + p.z * 0.11 + aInfo.y * 6.0), cos(uTime * 0.7 + p.x * 0.13)) * hang * hang * (aInfo.x < 0.5 ? min(0.9, 0.22 * aInfo.w) : min(0.35, 0.3 * aInfo.w));
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      varying vec2 vUv; varying vec4 vI; varying vec3 vW;
      #include <fog_pars_fragment>
      ${FOG_FAR}
      void main(){
        vec2 q = vec2(vUv.x * vI.z, vUv.y * vI.w);
        float n1 = vn(q * 0.16 + vI.y * 9.0), n2 = vn(q * 0.9 + vI.y * 3.0), n3 = vn(q * 2.7 + 4.0), n = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        float thr = vI.x < 0.5 ? mix(0.9, 0.3, vUv.y) : mix(0.2, 0.9, vUv.y);
        float tuftK = step(1.5, vI.x), mead = step(2.5, vI.x), flw = 0.0, fh2 = 0.0;
        if (tuftK > 0.5) {
          // kind 2, sedge on a rim: separate tufts of uneven height (one-dimensional noise along the edge), their tops broken into blades
          n = vn(vec2(q.x * 1.1 + vI.y * 9.0, 2.0)) * 0.6 + vn(vec2(q.x * 4.3, 7.0)) * 0.4;
          thr = mix(0.34, 1.0, vUv.y) + (vn(vec2(q.x * 17.0, vUv.y * 1.5 + 3.0)) - 0.5) * 0.5 * vUv.y;
          if (mead > 0.5) {
            // kind 3, tall grass on a carriageway: finer blades, and heads of flowers standing in it
            n = vn(vec2(q.x * 2.6 + vI.z * 3.0, 2.0)) * 0.5 + vn(vec2(q.x * 7.3, 7.0)) * 0.5;
            thr = mix(0.02, 0.95, vUv.y) + (vn(vec2(q.x * 31.0, vUv.y * 1.5 + 3.0)) - 0.5) * 0.8 * vUv.y + 0.7 * smoothstep(0.3, 0.5, abs(vUv.x - 0.5));
            vec2 fq2 = vec2(q.x * 4.5 + vI.z, q.y * 4.5), fi2 = floor(fq2); fh2 = h21(fi2 + vI.z * 3.0);
            flw = step(0.8, fh2) * smoothstep(0.36, 0.2, length(fract(fq2) - 0.5)) * smoothstep(0.3, 0.5, vUv.y) * step(thr - 0.3, n);
          }
        }
        float upK = step(0.5, vI.x) * (1.0 - tuftK) * step(16.0, vW.y);         // a crest up on a deck's coping: a row of separate shrubs, not a hedge
        thr += upK * (0.55 * smoothstep(0.32, 0.5, abs(vUv.x - 0.5)) + (n3 - 0.5) * 0.35);
        if (n < thr && flw < 0.5) discard;
        float lane = sunLane(vW);
        vec3 alb = mix(vec3(0.07, 0.17, 0.045), vec3(0.25, 0.39, 0.11), n3 * 0.6 + n2 * 0.3 + 0.1 * sin(uTime * 1.3 + q.x * 0.7));
        alb = mix(alb, mix(vec3(0.05, 0.1, 0.035), vec3(0.2, 0.27, 0.09), vUv.y) * (0.7 + 0.6 * n3), tuftK);
        alb = mix(alb, mix(vec3(0.06, 0.14, 0.04), vec3(0.2, 0.33, 0.09), vUv.y * (0.6 + 0.8 * n2)) * (1.0 + 1.5 * (1.0 - uFol.w)), mead);
        alb *= 1.0 - 0.25 * upK;
        alb = folTint(alb);
        alb = mix(alb, fh2 > 0.95 ? vec3(0.9, 0.74, 0.2) : fh2 > 0.9 ? vec3(0.9, 0.88, 0.8) : vec3(0.62, 0.46, 0.84), step(0.5, flw));
        gl_FragColor = vec4(max(fogFar(alb * (uAmbCol + uSunCol * vI.y * lane * (0.55 - 0.2 * mead)), vW, length(cameraPosition - vW)), vec3(0.0)), 1.0);
      }`,
  });
  // ---- leaf blobs: far hills, trees on the towers, kudzu over cars and buses (instanced, wind in the vertex shader) ----
  const blob = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...fogU(), ...shared },
    vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vS; varying float vNr;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        // the colour carries the kind: +2 = still and far (hills, crowns on towers), +4 = a mound of kudzu near the path (still, leafy)
        // (+6 = a mass of foliage in a camphor's crown: still, leafy, ragged at its outline)
        float sway = instanceColor.r > 1.5 ? 0.0 : 1.0; vNr = instanceColor.r > 5.5 ? 2.0 : instanceColor.r > 3.5 ? 1.0 : 0.0; vC = instanceColor - (instanceColor.r > 5.5 ? 6.0 : instanceColor.r > 3.5 ? 4.0 : instanceColor.r > 1.5 ? 2.0 : 0.0);
        float tall = length(instanceMatrix[1].xyz);
        w.xz += vec2(sin(uTime * 1.1 + w.x * 0.21 + w.y * 0.3), cos(uTime * 0.8 + w.z * 0.17 + w.y * 0.25)) * (position.y * 0.5 + 0.5) * min(tall, 16.0) * 0.045 * sway;
        vW = w.xyz; vN = mat3(modelMatrix) * (mat3(instanceMatrix) * normal); vS = sway;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #define FAR_DARK 0.62
      ${GLSL_COMMON}
      varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vS; varying float vNr;
      #include <fog_pars_fragment>
      ${FOG_FAR}
      float vn3(vec3 p){ float i = floor(p.z), f = fract(p.z); f = f * f * (3.0 - 2.0 * f); return mix(vn(p.xy + i * vec2(17.3, 9.1)), vn(p.xy + (i + 1.0) * vec2(17.3, 9.1)), f); }
      void main(){
        vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
        float sc = mix(0.05, 1.0, max(vS, min(vNr, 1.0))), crownK = step(1.5, vNr);
        vec3 Vb = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0)); float rimB = 1.0 - clamp(dot(n, Vb), 0.0, 1.0);
        float leaf = vn(vW.xz * 5.2 * sc + vec2(vW.y * 3.7, -vW.y * 2.9) * sc + uTime * 0.35 * vS) * 0.55 + vn(vW.zy * 1.9 * sc + vec2(vW.x * 1.3, vW.x * -1.1) * sc) * 0.45;
        float top = smoothstep(-0.75, 0.8, n.y);
        float nt = clamp((1.0 - uFol.w) * 2.5, 0.0, 1.0);                 // by moonlight: softer modelling, so a mound is a mass of leaves and not a rock
        float wrap = mix(clamp(dot(n, uSunDir) * 0.6 + 0.4, 0.0, 1.0), 0.6, nt * 0.75);
        vec3 alb = vC * (0.52 + 0.5 * leaf);
        if (vNr > 1.5) {
          // a camphor's foliage (round 15: noise in three dimensions, so no face of a mass is streaked or drawn out): clumps of leaves a
          // metre across, each lit on top and dark beneath and between, small leaves glinting on them, stirring; toward its outline and
          // from beneath every mass breaks up into sprays, so no crown has a smooth edge or a smooth bowl for an underside
          float c1 = vn3(vW * 0.55 + 3.0), c2 = vn3(vW * 1.5 + vec3(0.0, uTime * 0.05, 7.0)), c3 = vn3(vW * 4.6 + vec3(uTime * 0.22, 0.0, 1.0));
          if (c2 * 0.5 + c3 * 0.5 < max(smoothstep(0.25, 0.9, rimB) * 0.68, smoothstep(0.0, 0.7, -n.y) * 0.52)) discard;
          float mass = smoothstep(0.3, 0.66, c1 * 0.45 + c2 * 0.55 + 0.04 * sin(uTime * 1.7 + vW.x * 1.3 + vW.z * 1.1));
          alb = vC * mix(0.2, 1.22, mass) * (0.62 + 0.72 * smoothstep(0.35, 0.75, c3));
          alb = mix(alb, vec3(0.42, 0.44, 0.15) * (0.8 + 0.5 * c3), smoothstep(0.55, 0.8, c2) * top * 0.55);      // the flush of new leaves on the clumps' tops
          alb *= mix(0.55, 1.0, smoothstep(-0.5, 0.5, n.y));                                                       // shade under every clump
        } else if (vNr > 0.5) {
          // kudzu seen from a few metres: leaves in overlapping layers with dark gaps between them, pale young leaves on top, all stirring
          vec2 lq = vW.xz * 6.0 + vec2(vW.y * 4.4, -vW.y * 3.3);
          lq += (vec2(vn(lq * 0.6 + 3.0), vn(lq * 0.6 + 11.0)) - 0.5) * 1.6 + vec2(sin(uTime * 1.3 + vW.x * 2.0), cos(uTime * 1.1 + vW.z * 2.0)) * 0.05;
          float l1 = vn(lq), l2 = vn(lq * 2.7 + 5.0), l3 = vn(lq * 0.3 + 9.0), blade = smoothstep(0.3, 0.7, l1 * 0.6 + l2 * 0.4);
          float fine = 1.0 - smoothstep(6.0, 45.0, length(cameraPosition - vW)) * 0.7;
          alb = vC * mix(0.52 + 0.5 * leaf, mix(0.3 + 0.3 * nt, 1.2 - 0.15 * nt, blade) * (0.7 + 0.6 * l3), fine);
          alb = mix(alb, vec3(0.3, 0.4, 0.12) * (0.7 + 0.5 * l2), smoothstep(0.62, 0.8, l2 * 0.6 + l3 * 0.4) * top * 0.5 * fine);
        }
        vec3 col = folTint(alb) * (uAmbCol * (0.5 + 1.15 * top) + uSunCol * wrap * max(sunMask(vW), 0.12) * (0.5 + 0.45 * leaf) * mix(0.3 + 1.0 * top, 0.8, nt * 0.6));
        // the mounds near the path take a rim of light, so that it is their outline that catches the sun or the moon
        col += folTint(alb) * (uAmbCol * 1.3 + uSunCol * 0.8) * rimB * rimB * rimB * min(vNr, 1.0) * (1.0 - 0.6 * crownK) * (0.4 + 0.6 * top) * (1.0 - 0.5 * nt);      // (leaf-coloured: a grey rim made rock of it)
        gl_FragColor = vec4(max(fogFar(col, vW, length(cameraPosition - vW)), vec3(0.0)), 1.0);
      }`,
  });
  // ---- the slate rain wall ahead: a streaked arc 2.6 km off, opacity keyed to u ----
  const slate = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...shared, uTop: { value: C(L.cream, 0.9) } },
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform vec3 uTop; varying vec2 vUv;
      void main(){
        float az = abs(vUv.x - 0.5) * 2.0, v = vUv.y;
        float veil = vn(vec2(vUv.x * 46.0 + v * 2.5 + uTime * 0.01, v * 2.2)) * 0.6 + vn(vec2(vUv.x * 11.0 - uTime * 0.004, v * 0.8)) * 0.4;
        float edge = vn(vec2(vUv.x * 9.0 + uTime * 0.006, 3.0)) * 0.22;
        float a = uSlate * (1.0 - smoothstep(0.45, 1.0, az)) * (1.0 - smoothstep(0.34 + edge, 0.62 + edge, v)) * (0.78 + 0.22 * veil);
        vec3 col = mix(uSlateCol * (0.8 + 0.3 * veil), uTop, smoothstep(0.3 + edge, 0.6 + edge, v) * 0.8);
        col = mix(uHor * 0.85, col, smoothstep(0.0, 0.07, v));
        gl_FragColor = vec4(col, a);
      }`,
  });
  return { shared, water, concrete, pool, tower, fur, blob, slate, fogU };
}

// The sky dome's 256 px white-noise texture, made here in short steps and handed to makeSky as its noiseTexture: the same arithmetic
// (a fixed xorshift, no draws from any rng) and the same texture settings as the kit's own, so the same texels.
async function skyNoiseTexture(ctx) {
  const S = 256, d = new Uint8Array(S * S * 4); let a = 0x2545f491;
  const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
  for (let i = 0; i < S * S; i++) { d[i * 4] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = 255; if ((i & 8191) === 8191) await ctx.yield(); }
  for (let y = 0; y < S; y++) { for (let x = 0; x < S; x++) d[(y * S + x) * 4 + 1] = d[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4]; if ((y & 31) === 31) await ctx.yield(); }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// The cloud field's noise texture, filled here in slices and handed to makeCloudField as its noiseTexture: the kit's own
// bake is one long step of build(). Same arithmetic and the same draws from the field's own rng as the kit, so the same texels.
function cloudNoiseTexture() {
  const tex = new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
async function fillCloudNoise(ctx, rng, tex) {
  const size = 256, N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x];
          acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy);
        }
        if (y % 16 === 15) await ctx.yield();
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = tex.image.data, m = size - 1;
  const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
      data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]);
    }
    if (y % 16 === 15) await ctx.yield();
  }
  tex.needsUpdate = true;
}

// a GB's merged geometry one attribute at a time with a yield between: the same arrays and normals as gb.build(), in three short steps
async function buildGB(ctx, gb) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(gb.p, 3));
  await ctx.yield();
  g.setAttribute('color', new THREE.Float32BufferAttribute(gb.c, 3));
  await ctx.yield();
  g.computeVertexNormals();
  await ctx.yield();
  return g;
}

const post = (g, a, b, r, col, col2) => {
  const o = [[-r, -r], [r, -r], [r, r], [-r, r]];
  for (let i = 0; i < 4; i++) {
    const p = o[i], q = o[(i + 1) % 4];
    g.quad([a[0] + p[0], a[1], a[2] + p[1]], [a[0] + q[0], a[1], a[2] + q[1]], [b[0] + q[0], b[1], b[2] + q[1]], [b[0] + p[0], b[1], b[2] + p[1]], col, col2 || col);
  }
};

// average the normals of vertices that share a position, so a kit animal's body shades as one smooth skin
function smoothNormals(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = Math.round(p.getX(i) * 3000) + ',' + Math.round(p.getY(i) * 3000) + ',' + Math.round(p.getZ(i) * 3000);
    let e = map.get(k); if (!e) map.set(k, e = [0, 0, 0, []]);
    e[0] += n.getX(i); e[1] += n.getY(i); e[2] += n.getZ(i); e[3].push(i);
  }
  for (const e of map.values()) { const l = Math.hypot(e[0], e[1], e[2]); if (l > 1e-6) for (const i of e[3]) n.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); }
  n.needsUpdate = true;
}

// ---- foam wakes, droplet fans and shadows of every galloper: three instanced quads per animal that ride the herd's own track texture
// and travel uniform (shared by reference with the kit herd, so they can never drift apart), lit by the sun mask. The shadow lies on
// the water and is thrown ahead of the animal along the sun ray (the kit's own blob shadow sits at the feet, under the sheet). ----
function makeWake(herd, M, size = 1.6, shadowK = 0.5) {
  const hg = herd.geometry, hu = herd.uniforms, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 1, 0, 1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute([2, 2, 2, 2, 0, 0, 0, 0, 1, 1, 1, 1], 1)); g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]);
  g.setAttribute('iA', hg.attributes.iA); g.setAttribute('iB', hg.attributes.iB); g.instanceCount = herd.count;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: { ...M.fogU(), ...M.shared, uTracks: hu.uTracks, uTrackInfo: hu.uTrackInfo, uTravel: hu.uTravel, uVis: hu.uVis, uSize: { value: size }, uShadowK: { value: shadowK } },
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute float aK;
      uniform sampler2D uTracks; uniform vec3 uTrackInfo, uSunDir; uniform float uTravel, uVis, uSize, uShMin;
      varying vec2 vQ; varying float vK; varying vec3 vW; varying float vSeed;
      #include <fog_pars_vertex>
      vec3 trackTex(float i){ float W = uTrackInfo.x; i = clamp(i, 0., W - 1.); return texelFetch(uTracks, ivec2(int(i + .5), int(iA.x + .5)), 0).xyz; }
      vec3 trackAt(float s){
        float W = uTrackInfo.x, L = max(iA.y, 1.0), f = s / L, fc = clamp(f, 0., 1.), x = fc * (W - 1.);
        float i = floor(x), k = x - i, k2 = k * k, k3 = k2 * k;
        vec3 p = trackTex(i - 1.) * ((1. - 3. * k + 3. * k2 - k3) / 6.) + trackTex(i) * ((3. * k3 - 6. * k2 + 4.) / 6.) + trackTex(i + 1.) * ((-3. * k3 + 3. * k2 + 3. * k + 1.) / 6.) + trackTex(i + 2.) * (k3 / 6.);
        if (f != fc) { float e = f > 1. ? W - 1. : 1.; vec3 d = trackTex(e) - trackTex(e - 1.); p += d / max(length(d), 1e-4) * (f - fc) * L; }
        return p;
      }
      void main(){
        float s = uTravel - iA.z; vec3 P = trackAt(s), P2 = trackAt(s + 1.0);
        vec2 f2 = P2.xz - P.xz; float fl = length(f2); vec2 Fw = fl > 1e-5 ? f2 / fl : vec2(0.0, -1.0); vec2 X = vec2(Fw.y, -Fw.x);
        float sc = iB.x * uSize * uVis * (1.0 - smoothstep(-0.1, 0.5, P.y));        // nothing while the animal is in the air over the court
        float airW = smoothstep(4.5, 12.0, cameraPosition.y);                       // seen from the air every animal draws a long white wake: the herd is a river of motion
        vK = aK; vSeed = iA.w; vec4 mvPosition;
        if (aK > 1.5) {
          // shadow: an ellipse from under the animal to where its back and head fall, stretched by the height of the sun
          float sl = length(uSunDir.xz), body = iB.x * uVis * (1.0 - smoothstep(-0.1, 0.5, P.y)), reach = body * 0.62 / max(uSunDir.y / max(sl, 1e-3), max(uShMin, 0.1));
          vec2 sd = sl > 1e-3 ? -uSunDir.xz / sl : vec2(0.0, -1.0), sx = vec2(sd.y, -sd.x);
          vQ = vec2(position.x, position.z);
          vec2 xz = P.xz + sd * (reach * 0.55 + position.z * (reach * 0.55 + body * 0.7)) + sx * position.x * body * 0.6;
          vW = vec3(xz.x, 0.04, xz.y); mvPosition = viewMatrix * vec4(vW, 1.0);
        } else if (aK < 0.5) {
          vQ = vec2(position.x, position.z);
          vec2 xz = P.xz - Fw * (position.z * 4.6 * (1.0 + 0.55 * airW) - 0.5) * sc + X * position.x * (0.35 + position.z * 1.35) * (1.0 + 0.15 * airW) * sc;
          vW = vec3(xz.x, 0.05, xz.y); mvPosition = viewMatrix * vec4(vW, 1.0);
        } else {
          vQ = vec2(position.x, position.y);
          vW = vec3(P.x - Fw.x * 0.45 * sc, 0.0, P.z - Fw.y * 0.45 * sc); mvPosition = viewMatrix * vec4(vW, 1.0);
          mvPosition.xy += vec2(position.x * 0.8, position.y * 0.6) * sc;
        }
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform float uShadowK;
      varying vec2 vQ; varying float vK; varying vec3 vW; varying float vSeed;
      #include <fog_pars_fragment>
      void main(){
        float a, u = vQ.x, v = vQ.y;
        if (vK > 1.5) {
          if ((vW.x > -32.5 && vW.x < 18.5 && vW.z > 47.5 && vW.z < 62.5) || (vW.x > -2.5 && vW.x < 14.5 && vW.z > 19.5 && vW.z <= 48.0)) discard;
          a = (1.0 - smoothstep(0.2, 1.0, length(vQ))) * uShadowK * sunMask(vW);
          if (a < 0.01) discard;
          gl_FragColor = vec4(vec3(0.03, 0.05, 0.09) * uAmbCol * 2.0, a);
          #include <fog_fragment>
          return;
        }
        if (vK < 0.5) {
          float arm = smoothstep(0.3, 0.0, abs(abs(u) - 0.25 - v * 0.6)) * (1.0 - v), churn = exp(-(u * u * 5.0 + v * v * 14.0));
          float n = vn(vW.xz * 2.6 + vec2(0.0, uTime * 1.5)) * 0.6 + vn(vW.xz * 7.0 - uTime) * 0.4;
          a = clamp((arm * 0.75 + churn * 1.2) * (0.1 + 1.5 * n) - 0.38 + 0.16 * smoothstep(4.5, 12.0, cameraPosition.y), 0.0, 1.0) * (0.62 + 0.3 * smoothstep(4.5, 12.0, cameraPosition.y)) * (0.45 + 0.55 * smoothstep(3.0, 16.0, length(cameraPosition - vW)));
        } else {
          // spray flung up and back with every stride: a torn sheet of water opening into a fan, never beads on spokes
          float ph = fract(uTime * 2.6 + vSeed * 7.0), r = length(vec2(u, v)) / (0.3 + 0.7 * ph), ang = atan(u, v + 1e-3);
          float fan = (1.0 - smoothstep(0.55, 1.0, r)) * smoothstep(0.08, 0.3, r) * (1.0 - smoothstep(0.7, 1.2, abs(ang)));
          a = (fan * smoothstep(0.45, 0.8, vn(vec2(ang * 5.0 + vSeed * 17.0, r * 4.0 - ph * 3.0))) * 0.5 + exp(-r * r * 4.0) * 0.1) * (1.0 - ph);
        }
        if (a < 0.01) discard;
        vec3 col = mix(uAmbCol * 0.9, uAmbCol * 0.65 + uSunCol * 0.8, sunMask(vW));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'wake';
  return mesh;
}

// ---- the herd in the mirror: the same instanced geometry and the same uniforms drawn again under a group scaled y -1, straight after
// the sheet, only where it lies behind the water (GreaterDepth), wobbled and darkened ----
// ---- FLIPPED COPIES OF THE HARD THINGS IN THE FLOOD (buses, cars, gantries, lamp posts and masts, shelter frames, the dropped beam and
// the train): their massing built a second time in rings and short lengths, so that the copy can waver with the water, and drawn like the
// herd's: under a group flipped in y, straight after the sheet, only where it lies behind the sheet, darkened, strongest at a grazing
// angle and gone from the air (looked down on, the flood is green depth, not a mirror). One draw call. ----
class FB {
  constructor() { this.p = []; this.c = []; this.i = []; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); }
  // a prism in rings 0.8 m apart: (ru, rv) half axes at the foot, (ru1, rv1) at the top; four sides make a box (corners on the diagonals)
  prism(cx, cz, ux, uz, ru, rv, y0, y1, c0, c1, sides = 6, ru1 = ru, rv1 = rv) {
    const rings = Math.max(1, Math.ceil((y1 - y0) / 0.8)), vx = -uz, vz = ux, base = this.p.length / 3;
    for (let r = 0; r <= rings; r++) {
      const t = r / rings, y = y0 + (y1 - y0) * t, a = ru + (ru1 - ru) * t, b = rv + (rv1 - rv) * t, col = c0.clone().lerp(c1, t);
      for (let q = 0; q < sides; q++) { const an = (q + 0.5) / sides * TAU, co = Math.cos(an) * a, si = Math.sin(an) * b; this.v(cx + ux * co + vx * si, y, cz + uz * co + vz * si, col); }
    }
    for (let r = 0; r < rings; r++) for (let q = 0; q < sides; q++) { const a = base + r * sides + q, b = base + r * sides + (q + 1) % sides; this.i.push(a, b, b + sides, a, b + sides, a + sides); }
  }
  // a post from a to b (square, half width r), in lengths of 0.8 m
  post(a, b, r, c0, c1) {
    const n = Math.max(1, Math.ceil(Math.abs(b[1] - a[1]) / 0.8)), base = this.p.length / 3;
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t, col = c0.clone().lerp(c1, t); this.v(x - r, y, z - r, col); this.v(x + r, y, z - r, col); this.v(x + r, y, z + r, col); this.v(x - r, y, z + r, col); }
    for (let k = 0; k < n; k++) for (let q = 0; q < 4; q++) { const p = base + k * 4 + q, e = base + k * 4 + (q + 1) % 4; this.i.push(p, e, e + 4, p, e + 4, p + 4); }
  }
  // a beam from a to b (half width hw, depth h under the line), in lengths of 2 m
  beam(a, b, hw, h, c0, c1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, n = Math.max(1, Math.ceil(Math.hypot(l, dy) / 2)), nx = -dz / l * hw, nz = dx / l * hw, base = this.p.length / 3;
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + dx * t, y = a[1] + dy * t, z = a[2] + dz * t; this.v(x - nx, y, z - nz, c1); this.v(x + nx, y, z + nz, c1); this.v(x + nx, y - h, z + nz, c0); this.v(x - nx, y - h, z - nz, c0); }
    for (let k = 0; k < n; k++) for (let q = 0; q < 4; q++) { const p = base + k * 4 + q, e = base + k * 4 + (q + 1) % 4; this.i.push(p, e, e + 4, p, e + 4, p + 4); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i);
    return g;
  }
}
function flipOf(M, geometry) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...M.fogU(), ...M.shared }, fog: true, vertexColors: true, side: THREE.DoubleSide, depthFunc: THREE.GreaterDepth, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vW; varying vec3 vC;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0); vC = color;
        float dp = clamp(-wp.y, 0.0, 16.0);                    // the deeper in the picture, the more the water moves it
        wp.xz += vec2(sin(uTime * 2.1 + wp.y * 1.9 + wp.x * 0.6), cos(uTime * 1.7 + wp.y * 2.3 + wp.z * 0.6)) * (0.03 * min(dp, 1.5) + 0.03 * dp);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      varying vec3 vW; varying vec3 vC;
      #include <fog_pars_fragment>
      void main(){
        if (vW.y > -0.03) discard;
        float kY = cameraPosition.y / max(cameraPosition.y - vW.y, 1e-3); vec2 hx = mix(cameraPosition.xz, vW.xz, kY);      // where the sight line meets the water
        if ((hx.x > -32.0 && hx.x < 18.0 && hx.y > 48.0 && hx.y < 62.0) || (hx.x > -2.0 && hx.x < 14.0 && hx.y > 20.0 && hx.y <= 48.0)) discard;
        vec3 toW = vec3(hx.x, 0.0, hx.y) - cameraPosition; float gz = 1.0 - clamp(-toW.y / max(length(toW), 1e-3), 0.0, 1.0);
        float lit = sunMask(vec3(vW.x, -vW.y, vW.z));
        vec3 col = vC * (uAmbCol * 1.2 + uSunCol * 0.62 * lit) * vec3(0.6, 0.66, 0.75);
        float torn = 0.62 + 0.38 * smoothstep(0.25, 0.7, vn(hx * vec2(0.9, 2.6) + vec2(uTime * 0.5, -uTime * 0.8)));      // broken by the ripple, never a clean pane
        float a = mix(0.06, 0.8, gz * gz * gz) * torn * (1.0 - smoothstep(4.5, 10.5, cameraPosition.y));
        if (a < 0.01) discard;
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geometry, mat); mesh.renderOrder = -0.3; mesh.frustumCulled = false; mesh.name = 'mirror-street';
  const group = new THREE.Group(); group.scale.y = -1; group.add(mesh);
  return group;
}
// ---- the shower's front: three veils of falling streaks, 9 m apart, that travel with the line (see frontZ in buildWorld) ----
function makeVeil(M) {
  const vp = [], vl = [], vi = [];
  for (let k = 0; k < 3; k++) { const z = k * 9, b = k * 4; vp.push(-52, 0, z, 52, 0, z, 52, 74, z, -52, 74, z); vl.push(k, k, k, k); vi.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); vg.setAttribute('aL', new THREE.Float32BufferAttribute(vl, 1)); vg.setIndex(vi);
  const vm = new THREE.ShaderMaterial({
    uniforms: { ...M.fogU(), ...M.shared, uK: { value: 0 } }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aL; varying vec3 vW; varying float vL;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vL = aL; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform float uK; varying vec3 vW; varying float vL;
      #include <fog_pars_fragment>
      void main(){
        float d = distance(vW, cameraPosition), lit = sunMask(vW);
        // falling streaks: fine ones and coarse ones, slanting a little with the wind, in gusts that travel along the line
        float s1 = vn(vec2(vW.x * 8.5 + vW.y * 0.5 + vL * 17.0, vW.y * 0.2 + uTime * 5.2)), s2 = vn(vec2(vW.x * 2.6 + vW.y * 0.2 + vL * 31.0, vW.y * 0.09 + uTime * 3.0));
        float gust = 0.45 + 0.55 * smoothstep(0.25, 0.7, vn(vec2(vW.x * 0.06 + uTime * 0.25 + vL * 3.0, vW.y * 0.03)));
        float a = (0.075 + 0.17 * smoothstep(0.55, 0.92, s1) + 0.09 * smoothstep(0.45, 0.8, s2)) * gust;
        a *= (1.0 - smoothstep(34.0, 72.0, vW.y)) * (1.0 - smoothstep(40.0, 51.0, abs(vW.x))) * smoothstep(9.0, 36.0, d) * (1.0 - 0.3 * vL) * uK;
        if (a < 0.004) discard;
        vec3 col = mix(uSlateCol * 0.8 + uAmbCol * 0.45, uSunCol * 0.95 + uHor * 0.5, lit * 0.85);
        gl_FragColor = vec4(col, min(a, 0.4));
        #include <fog_fragment>
      }`,
  });
  const veil = new THREE.Mesh(vg, vm); veil.frustumCulled = false; veil.renderOrder = 2; veil.name = 'rain-front';
  return veil;
}
// ---- the spray-bow: a sheet of drifting spray 1.4 m over the basin with the 42-degree arc in it (see buildWorld) ----
function makeSprayBow(M) {
  // (round 15: and the spray that stands up at the tower fall's foot, as an upright sheet 48 m wide and 36 m high that turns about the
  // vertical to face the eye: the arc is seen in it from the side, where the level sheet lies edge-on)
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([-16, 1.4, -4, 48, 1.4, -4, 48, 1.4, -70, -16, 1.4, -70, -24, 0.5, 0, 24, 0.5, 0, 24, 36, 0, -24, 36, 0], 3));
  bg.setAttribute('aCard', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1], 1)); bg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const bm = new THREE.ShaderMaterial({
    uniforms: { ...M.shared, uK: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`attribute float aCard; varying vec3 vW; varying vec3 vL;
      void main(){ vec3 p = position; vL = vec3(position.xy, aCard);
        if (aCard > 0.5) { vec2 dc = cameraPosition.xz - vec2(33.0, -45.0); dc /= max(length(dc), 1e-3); p = vec3(33.0, 0.0, -45.0) + vec3(dc.y, 0.0, -dc.x) * position.x + vec3(0.0, position.y, 0.0); }
        vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      uniform float uK; varying vec3 vW; varying vec3 vL;
      void main(){
        vec3 v = normalize(vW - cameraPosition); float ang = degrees(acos(clamp(dot(v, -uSunDir), -1.0, 1.0))), x = (ang - 39.4) / 3.4;
        // the drifting spray: thick near the fall, in tatters toward us
        float m = smoothstep(0.42, 0.78, vn(vW.xz * 0.11 + vec2(uTime * 0.16, uTime * 0.07)) * 0.55 + vn(vW.xz * 0.37 - vec2(uTime * 0.1, -uTime * 0.13)) * 0.45 + 0.08);
        float e = 1.0 - smoothstep(15.0, 31.0, length(vW.xz - vec2(15.0, -37.0)));
        if (vL.z > 0.5) {
          m = smoothstep(0.3, 0.7, vn(vec2(vL.x * 0.09 + uTime * 0.05, vL.y * 0.07 - uTime * 0.16)) * 0.55 + vn(vec2(vL.x * 0.31 - uTime * 0.08, vL.y * 0.23 - uTime * 0.3)) * 0.45 + 0.12);
          e = (1.0 - smoothstep(0.35, 1.0, length(vec2(vL.x / 24.0, (vL.y - 4.0) / 32.0)))) * smoothstep(0.5, 3.0, vL.y) * 1.5;
        }
        float band = smoothstep(0.0, 0.4, x) * (1.0 - smoothstep(0.6, 1.0, x)) * step(0.0, x) * step(x, 1.0);
        vec3 col = clamp(vec3(smoothstep(0.42, 0.8, x), 1.0 - abs(x - 0.5) * 2.6, 1.0 - smoothstep(0.18, 0.55, x)), 0.0, 1.0);      // violet inside, red outside
        float lit = sunMask(vW), a = m * e * uK * lit * smoothstep(3.0, 12.0, distance(vW, cameraPosition));
        vec3 outC = col * band * (uSunCol * 0.5 + 0.35) * a + (uSunCol * 0.5 + uAmbCol * 0.5) * 0.22 * a;      // (and the spray itself, a breath of white)
        if (a < 0.003) discard;
        gl_FragColor = vec4(outC, 1.0);
      }`,
  });
  const sprayBow = new THREE.Mesh(bg, bm); sprayBow.frustumCulled = false; sprayBow.renderOrder = 2.5; sprayBow.name = 'spray-bow';
  return sprayBow;
}
function mirrorOf(herd, M) {
  const m = herd.material, vAt = 'vec4 wp = modelMatrix * vec4(w, 1.);', fAt = 'gl_FragColor = vec4(c, uOpacity);';
  if (!m.vertexShader.includes(vAt) || !m.fragmentShader.includes(fAt)) return new THREE.Group();      // the kit shader changed: no mirror rather than a herd drawn upside down above the water
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...m.uniforms, uHeroP: M.shared.uHero, uTimeP: M.shared.uTime, uPadsP: M.water.uniforms.uPads }, defines: { ...m.defines }, fog: true, vertexColors: true, side: THREE.DoubleSide, depthFunc: THREE.GreaterDepth, depthWrite: false,
    vertexShader: 'varying vec3 vMW;\n' + m.vertexShader.replace('vec4 wp = modelMatrix * vec4(w, 1.);', 'vec4 wp = modelMatrix * vec4(w, 1.); vMW = wp.xyz; wp.xz += vec2(sin(uTime * 2.3 + wp.y * 2.6 + wp.x), cos(uTime * 1.9 + wp.y * 3.1 + wp.z)) * 0.07 * clamp(-wp.y, 0., 2.);'),
    // (padP: the water sheet's own lily-pad field, cell for cell, under names of its own: a leaf gives back no deer)
    fragmentShader: 'varying vec3 vMW;\n' + /* glsl */`
      uniform vec4 uHeroP; uniform float uTimeP, uPadsP;
      float pH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float pN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(pH(i), pH(i+vec2(1.,0.)), f.x), mix(pH(i+vec2(0.,1.)), pH(i+vec2(1.,1.)), f.x), f.y); }
      float padP(vec2 w){
        vec2 hl = w - uHeroP.xy, lp = vec2(hl.x * uHeroP.z - hl.y * uHeroP.w, hl.x * uHeroP.w + hl.y * uHeroP.z); float pond = 1.0 - smoothstep(0.75, 1.0, length((lp - vec2(0.0, 60.0)) / vec2(78.0, 68.0)));
        vec2 lc = floor(lp / 1.7), lf = fract(lp / 1.7) - 0.5; float lh = pH(lc + 11.0), rad = 0.36 * (0.5 + 0.9 * pH(lc + 0.7));
        vec2 off = (vec2(pH(lc + 2.3), pH(lc + 5.9)) - 0.5) * (0.96 - 2.0 * rad), ld = lf - off + vec2(sin(uTimeP * 0.7 + lh * 20.0), cos(uTimeP * 0.6 + lh * 9.0)) * 0.012;
        float lpatch = smoothstep(0.3, 0.52, pN(lp * 0.045 + 3.0));
        lpatch = max(lpatch, 0.62 * (1.0 - smoothstep(9.0, 24.0, abs(lp.x))) * smoothstep(-4.0, 10.0, lp.y) * (1.0 - smoothstep(120.0, 160.0, lp.y)) * smoothstep(0.25, 0.5, pN(lp * 0.21 + 7.0) + 0.25));
        float band2 = (1.0 - smoothstep(30.0, 62.0, abs(lp.x - 4.0))) * smoothstep(150.0, 168.0, lp.y) * (1.0 - smoothstep(205.0, 228.0, lp.y)) * smoothstep(0.3, 0.55, pN(lp * 0.13 + 5.0) * 0.6 + pN(lp * 0.37) * 0.4 + 0.12);
        float want = step(1.0 - max((0.66 * pond + 0.12) * lpatch, 0.6 * band2) * uPadsP * step(length(lp - vec2(0.0, 80.0)), 190.0), lh);
        float rn = length(ld) / max(rad, 1e-3), la = atan(ld.y, ld.x + 1e-5) + lh * 40.0;
        return want * (1.0 - smoothstep(0.94, 1.04, rn)) * (1.0 - smoothstep(0.9, 0.96, cos(la)) * step(0.12, rn));
      }
      ` + m.fragmentShader.replace('gl_FragColor = vec4(c, uOpacity);',
      'float kY = cameraPosition.y / max(cameraPosition.y - vMW.y, 1e-3); vec2 hx = mix(cameraPosition.xz, vMW.xz, kY);\n' +
      'if ((hx.x > -32. && hx.x < 18. && hx.y > 48. && hx.y < 62.) || (hx.x > -2. && hx.x < 14. && hx.y > 20. && hx.y <= 48.) || vMW.y > 0. || padP(hx) > 0.5) discard;\n' +
      'gl_FragColor = vec4(c * vec3(.56, .63, .72), uOpacity);'),
  });
  const mesh = new THREE.Mesh(herd.geometry, mat); mesh.renderOrder = -0.3; mesh.frustumCulled = false; mesh.name = 'mirror-herd';
  const group = new THREE.Group(); group.scale.y = -1; group.add(mesh);
  return group;
}

// ---- macaques: about 170 triangles each, instanced; limbs swing from their joints in the vertex shader. list: [x, y, z, yaw, pose, range, onWire] ----
function makeMacaques(M, list, rng) {
  const P = [], N = [], Cc = [], A = [], I = [], fur = new THREE.Color('#8a7a62'), furDk = new THREE.Color('#5f5344'), face = new THREE.Color('#c9806a');
  const add = (g, part, pv, paint) => {
    const o = P.length / 3, p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), c = paint(x, y, z);
      P.push(x, y, z); N.push(n.getX(i), n.getY(i), n.getZ(i)); Cc.push(c.r, c.g, c.b); A.push(part, pv[0], pv[1], pv[2]);
    }
    for (let i = 0; i < g.index.count; i++) I.push(o + g.index.getX(i));
  };
  add(new THREE.SphereGeometry(1, 7, 5).scale(0.17, 0.25, 0.19).translate(0, 0.27, 0), 0, [0, 0.15, 0], (x, y, z) => (z > 0.1 ? fur.clone().lerp(new THREE.Color('#c9bca0'), 0.6) : y > 0.35 ? fur : furDk));
  add(new THREE.SphereGeometry(0.105, 6, 4).translate(0, 0.6, 0.05), 1, [0, 0.5, 0], (x, y, z) => (z > 0.1 && y < 0.66 ? face : fur));
  for (const [part, x] of [[2, -0.13], [3, 0.13]]) add(new THREE.CylinderGeometry(0.036, 0.028, 0.3, 4, 1).translate(x, 0.42 - 0.15, 0.06), part, [x, 0.42, 0.06], () => fur);
  for (const [part, x] of [[4, -0.1], [5, 0.1]]) add(new THREE.CylinderGeometry(0.046, 0.03, 0.3, 4, 1).translate(x, 0.1 - 0.15, 0.02), part, [x, 0.1, 0.02], () => furDk);
  add(new THREE.CylinderGeometry(0.02, 0.012, 0.28, 3, 1).translate(0, 0.12 - 0.14, -0.17), 6, [0, 0.12, -0.17], () => furDk);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  const iA = new Float32Array(list.length * 4), iB = new Float32Array(list.length * 4);
  list.forEach((m, i) => { iA.set([m[0], m[1], m[2], m[3]], i * 4); iB.set([m[4] || 0, rng(), m[5] || 0, m[6] || 0], i * 4); });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, vertexColors: true, side: THREE.DoubleSide, uniforms: { ...M.fogU(), ...M.shared },
    vertexShader: /* glsl */`
      attribute vec4 aPart; attribute vec4 iA; attribute vec4 iB; uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying vec3 vC;
      #include <fog_pars_vertex>
      vec3 rotX(vec3 d, float a){ float c = cos(a), s = sin(a); return vec3(d.x, d.y * c - d.z * s, d.z * c + d.y * s); }
      vec3 rotY(vec3 d, float a){ float c = cos(a), s = sin(a); return vec3(d.x * c + d.z * s, d.y, d.z * c - d.x * s); }
      void main(){
        float part = aPart.x, walk = iB.x, ph = iB.y * 6.2832; vec3 pv = aPart.yzw, p = position, n = normal, c0 = vec3(0.0, 0.15, 0.0);
        float pace = sin(uTime * 0.22 + ph), dirS = cos(uTime * 0.22 + ph) >= 0.0 ? 1.0 : -1.0, moving = walk * smoothstep(0.02, 0.2, abs(cos(uTime * 0.22 + ph)));
        float tilt = 1.25 * walk, gait = uTime * 6.0 + ph;
        if (part > 1.5) {
          float fore = part < 3.5 ? 1.0 : 0.0, sd = mod(part, 2.0) < 0.5 ? 1.0 : -1.0, a;
          if (part > 5.5) a = mix(0.5 + 0.2 * sin(uTime * 1.3 + ph), 1.3 + 0.3 * sin(uTime * 2.0 + ph), walk);
          else a = mix(fore > 0.5 ? (-0.55 - 0.7 * max(sin(uTime * 1.7 + ph) * sd, 0.0)) : -1.45, 0.6 * sin(gait + (sd * (fore * 2.0 - 1.0) > 0.0 ? 0.0 : 3.1416)) * moving, walk);
          vec3 d = rotX(p - pv, a); n = rotX(n, a);
          p = rotX(pv - c0, tilt) + c0 + d;
        } else {
          if (part > 0.5) {                       // the head turns to follow the herd going by
            vec2 toC = cameraPosition.xz - iA.xz + vec2(1e-3, 0.0);
            float look = clamp(sin(atan(toC.x, toC.y) - iA.w - (dirS < 0.0 ? 3.1416 : 0.0) * walk), -0.9, 0.9) * (1.0 - 0.7 * walk) + 0.25 * sin(uTime * 0.7 + ph * 3.0);
            p = rotY(p - pv, look) + pv; n = rotY(n, look);
            p = rotX(p - c0, tilt * 0.55) + c0 + vec3(0.0, 0.0, 0.12 * walk);
          } else p = rotX(p - c0, tilt) + c0;
          n = rotX(n, tilt * (part > 0.5 ? 0.55 : 1.0));
        }
        p.y += 0.15 * walk + 0.012 * sin(uTime * 2.0 + ph) + 0.03 * abs(sin(gait)) * moving;
        float yaw = iA.w + (dirS < 0.0 ? 3.1416 : 0.0) * walk;
        vec3 wp = iA.xyz + rotY(p * 1.6, yaw) + vec3(sin(iA.w), 0.0, cos(iA.w)) * iB.z * pace * walk;
        if (iB.w > 0.5) wp.y += (12.6 - 1.6 * (1.0 - (wp.x / 42.0) * (wp.x / 42.0))) - iA.y;      // those on the wire follow its sag
        vW = wp; vN = rotY(n, yaw); vC = color;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      varying vec3 vW; varying vec3 vN; varying vec3 vC;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0)); vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0)); if (dot(n, V) < 0.0) n = -n;
        float rim = pow(max(1.0 - dot(n, V), 0.0), 2.0);
        vec3 col = vC * (uAmbCol * (0.8 + 0.3 * n.y) + uSunCol * (max(dot(n, uSunDir), 0.0) * 0.85 + 0.15) * sunMask(vW)) + (uAmbCol * 0.3 + uSunCol * 0.12) * rim;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'macaques';
  return mesh;
}

const LOOKS = {
  shower: { title: 'A Hundred Springs Later', el: 26.1, zenith: '#4A78B4', horizon: '#C4D3DC', slate: '#55607C', cream: '#f4ead6', cloudK: 0.95, sunColor: '#FFE4B5', sunK: 1.45, amb: '#8492b4', ambK: 0.95,
    lightI: 3.6, hemiI: 1.3, fogA: '#AEB9C6', fogB: '#8696c4', exposure: 1.05, coverage: 0.5, laneK: 0.5 },
  golden: { title: 'After the Rain', el: 8, zenith: '#3f5f94', horizon: '#f0c8a0', slate: '#4c5672', cream: '#ffc890', cloudK: 0.95, sunColor: '#FFA665', sunK: 2.05, amb: '#77819f', ambK: 1.0, shMin: 0.2,
    lightI: 3.4, hemiI: 1.25, fogA: '#d2b8a4', fogB: '#8e8cc2', exposure: 1.05, coverage: 0.5, bed: 0.6, grid: 0.5 },
  dawn: { title: 'First Light', el: 6, zenith: '#9fb0cc', horizon: '#f2d6c4', slate: '#b9b3bd', cream: '#fff1e4', cloudK: 0.9, sunColor: '#ffc4a0', sunK: 1.5, amb: '#b6b6c4', ambK: 0.9,
    lightI: 2.8, hemiI: 1.6, fogA: '#e6d2c8', fogB: '#dcd8d6', exposure: 1.0, coverage: 0.35, bed: 0.6, spark: 0.5, laneC: 0.2 },      // (laneC: in the fog no lane of sun lies ruled on the water)
  night: { title: 'Full Moon', el: 38, zenith: '#0a1630', horizon: '#2a3f66', slate: '#101a34', cream: '#7f93c4', cloudK: 0.4, sunColor: '#AFC4EE', sunK: 0.85, amb: '#3d4c74', ambK: 1.1,
    lightI: 1.9, hemiI: 2.6, fogA: '#1a2c54', fogB: '#1a2c54', exposure: 1.3, coverage: 0.3, bed: 0.15, spark: 0.4, road: 1, rimW: 1, grid: 1, fol: [0.62, 0.88, 1.0, 0.68] },     // moonlight: a faint net on the bed, few glints
};

// The whole build is this function; build() at the foot of the file only calls it. A browser compiles a function on its first call, and
// this one is long: called once with no ctx it is compiled and runs nothing, in a step of its own, before the call that does the work.
async function buildWorld(ctx) {
    if (!ctx) return null;
    await ctx.yield();
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1, mood = vary.mood ?? 0.5;
    const hour = vary.hour || 'any', r0 = rng(), r1 = rng(), r2 = rng(), rare = !!vary.rare;
    const look = hour === 'golden' ? 'golden' : hour === 'dawn' ? 'dawn' : hour === 'night' ? 'night' : hour === 'day' ? 'shower' : r0 < 0.26 ? 'golden' : r0 < 0.42 ? 'dawn' : r0 < 0.5 ? 'night' : 'shower';
    const golden = look === 'golden', dawn = look === 'dawn', night = look === 'night', shower = look === 'shower';
    const cast = r1 < 0.6 ? 'lilac' : r1 < 0.8 ? 'cream' : 'mixed', whiteStag = r2 < 0.25;
    const K = LOOKS[look], el = K.el * Math.PI / 180, hn = Math.hypot(0.23, 0.87), laneK = K.laneK ?? 0;
    const laneAt = (x, z) => 1 - laneK * sstep(300, 322, z) * (1 - sstep(368, 388, z));
    const L = { ...K, portal: '#EFE6FF', fringe: cast === 'cream' ? '#efe3c6' : cast === 'mixed' ? '#cdbbe0' : '#B59AE0', petal: cast === 'cream' ? '#f4ecd8' : '#d9c8f2',
      sunDir: new THREE.Vector3(-0.23 / hn * Math.cos(el), Math.sin(el), 0.87 / hn * Math.cos(el)).normalize() };
    const slateAt = (u) => (shower ? sstep(0.2, 0.55, u) : golden ? mix(0.6, 1, sstep(0.2, 0.55, u)) : 0);
    const rainAt = (u) => (shower ? sstep(0.19, 0.25, u) * (1 - 0.7 * sstep(0.47, 0.56, u)) * (1 - 0.73 * sstep(0.56, 0.68, u)) * (0.75 + 0.5 * mood) : 0);
    const bowAt = (u) => Math.min(0.34, (shower ? (0.2 + 0.06 * sstep(0.56, 0.7, u)) * sstep(0.21, 0.5, u) : golden ? 0.17 + 0.05 * sstep(0.56, 0.7, u) : 0) * (rare ? 1.3 : 1));      // (the bow stands behind the bounding deer from the moment the shower has passed us)
    const fogAt = (u) => (shower ? mix(mix(0.0007, 0.0019, sstep(0.2, 0.3, u)), 0.0013, sstep(0.5, 0.62, u)) : golden ? mix(0.0008, 0.0013, sstep(0.1, 0.4, u)) : dawn ? mix(0.0044, 0.0048, sstep(0.55, 0.8, u)) : 0.0016);

    const scene = new THREE.Scene();
    await ctx.yield();
    makePath(WAY.slice(0, 4));                                 // a short path first takes the kit function's cold start out of the next step (no random draws in it)
    await ctx.yield();
    const path = makePath(WAY);
    await ctx.yield();
    const skyNoise = await skyNoiseTexture(ctx);               // the dome's noise, made here in steps of its own and handed to makeSky as its noiseTexture
    const sky = makeSky({ rng, noiseTexture: skyNoise, preset: night ? 'night' : 'day', ...(night ? { stars: 0.55, starDensity: 0.45 } : {}), zenith: L.zenith, horizon: L.horizon, ...(night ? { bodyOverrides: { 0: { elevation: 38, azimuth: -165.2 } } } : { sunElevation: K.el, sunAzimuth: -165.2, sunColor: L.sunColor }),
      lightColor: L.sunColor, lightIntensity: L.lightI, ambientColor: L.amb, groundLight: night ? '#2c3a4a' : '#5E7350', ambientIntensity: L.hemiI, clouds: { coverage: L.coverage } });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(L.fogA, fogAt(0));
    const rig = makeLightRig(sky, { bounce: 0.55 }); scene.add(rig.object);
    const fogA = new THREE.Color(L.fogA), fogB = new THREE.Color(L.fogB);
    await ctx.yield();
    // the field forks its rng once from ours and lays its clouds out with the fork; the fork then fills the noise texture
    let cloudRng = null; const cloudNoise = cloudNoiseTexture();
    const clouds = makeCloudField({ rng: { fork: (label) => (cloudRng = rng.fork(label)) }, sky, count: 7, altitude: 620, size: [300, 560], center: [150, 0, -700], extent: [3400, 3000], wind: [0.5, 0, 9],
      filter: (x, y, z, w) => path.nearestXZ(x, z).dist > w * 0.5, noiseTexture: cloudNoise });
    scene.add(clouds.object);
    await ctx.yield();
    await fillCloudNoise(ctx, cloudRng, cloudNoise);
    await ctx.yield();

    const heroU = { ring: { value: 1 } };
    const M = makeMaterials(L, heroU, !!ctx.quality?.mobile);
    const C = (h) => new THREE.Color(h);
    // the sun mask on the CPU: lanes on the boulevard, deck shadows in the stack (for everything placed once at build, and the herd light)
    const sunLocal = (() => { const c = Math.cos(HERO.rot), s = Math.sin(HERO.rot); return [L.sunDir.x * c - L.sunDir.z * s, L.sunDir.y, L.sunDir.x * s + L.sunDir.z * c]; })();
    const litAt = (x, y, z) => { const lp = toLocal(x, z); return laneAt(x, z) * deckShade(lp[0], y, lp[1], sunLocal); };
    const shadeTint = night ? [0.56, 0.62, 0.78] : dawn ? [0.62, 0.64, 0.7] : [0.36, 0.42, 0.56];
    const tintAt = (x, y, z) => { const k = litAt(x, y, z); return [mix(shadeTint[0], 1, k), mix(shadeTint[1], 1, k), mix(shadeTint[2], 1, k)]; };
    const conc = C('#a39d90'), concDk = C('#5d5c60'), moss = C('#5c7a3c'), mossDk = C('#3E6B33'), rust = C('#7a4a30'), socket = new THREE.Color(0.012, 0.022, 0.024);
    const nightC = (c) => { if (night) { const g = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; c.setRGB(mix(g, c.r, 0.65) * 0.64, mix(g, c.g, 0.65) * 0.86, mix(g, c.b, 0.65)); } return c; };   // greens by moonlight: cooler, greyer
    nightC(moss); nightC(mossDk);
    const tg = new GB(), sg = new GB();                       // tower shader geometry, concrete street geometry
    const furP = [], furU = [], furI = [], furX = [];
    const furQuad = (a, b, y0, y1, kind, sun) => {            // a, b: [x, z] ends of the edge
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), o = furP.length / 3, r = 0.3 + 0.7 * sun;
      furP.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y1, a[1]); furU.push(0, 0, 1, 0, 1, 1, 0, 1);
      for (let i = 0; i < 4; i++) furI.push(kind, r, len, Math.abs(y1 - y0));
      furX.push(o, o + 1, o + 2, o, o + 2, o + 3);
    };
    const blobs = [];                                         // [x, y, z, sx, sy, sz, rotY, r, g, b, noSway]
    const addBlob = (x, y, z, sx, sy, sz, col, rot = 0, still = 0) => blobs.push([x, y, z, sx, sy, sz, rot, col.r, col.g, col.b, still]);
    const greens = [C('#2e5628'), C('#3f6b2c'), C('#4c7630'), C('#55803a'), C('#38623a')];
    const blobsN = [], obst = [];                             // the mounds near the path get a rougher shape; obst: [x, z, radius] of everything a deer must run round
    const addBlobN = (x, y, z, sx, sy, sz, col, rot = 0, kind = 4) => blobsN.push([x, y, z, sx, sy, sz, rot, col.r, col.g, col.b, kind]);

    // ---- towers with terraces, fur on every terrace edge, trees on the setbacks ----
    // The lowest block of every tall tower has real depth where we pass: a fin 1.3 m proud on every pilaster line, and in most bays a
    // stack of balconies three panes wide (some fallen), their tops under moss, creeper hanging from one in three and shrubs standing on
    // others; on the wall along the boulevard and on the first 42 m of the wall that faces back up it, into the sun. No draws from the rng.
    const hsh0 = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    const balC = conc.clone().multiplyScalar(0.94), balTop = moss.clone().lerp(C('#7c9a48'), 0.4), finC = conc.clone().lerp(concDk, 0.22);
    const dressWall = (axis, c, nrm, a, b, top, sun, key) => {      // axis 0: the wall runs along z at x = c; 1: along x at z = c; nrm: which way it faces
      const P2 = (h, o) => (axis === 0 ? [c + nrm * o, h] : [h, c + nrm * o]);
      const bx = (h0, h1, o1, y0, y1, col, topC, bot) => { const q = P2((h0 + h1) / 2, o1 / 2); sg.box(q[0], q[1], 1, 0, axis === 0 ? o1 / 2 : (h1 - h0) / 2, axis === 0 ? (h1 - h0) / 2 : o1 / 2, y0, y1, col, topC, bot); };
      const m0 = Math.ceil((a + 1.5) / 21.6), m1 = Math.floor((b - 2.5) / 21.6), floors = Math.min(13, Math.floor((top - 6) / 4.2));
      for (let m = m0 - 1; m <= m1; m++) {
        const hf = m * 21.6 + 0.65;
        if (m >= m0) bx(hf - 0.65, hf + 0.65, 1.3, -1, top, finC, moss);
        const hk = hsh0(key * 7.3 + m * 3.1), h0 = (m * 6 + 1 + Math.floor(hk * 2.99)) * 3.6 + 0.26, h1 = h0 + 10.54;
        if (hk < 0.2 || h0 < a + 1 || h1 > b - 1) continue;
        for (let k = 2; k <= floors; k++) {
          const hb = hsh0(key * 3.7 + m * 5.3 + k * 1.9), y0 = k * 4.2 + 0.04;
          if (hb > 0.76) continue;
          bx(h0, h1, 2.3, y0, y0 + 1.45, balC, balTop, concDk);
          if (hb < 0.4) { const q0 = h0 + (h1 - h0) * 0.6 * hsh0(key * 1.3 + k + m), q1 = Math.min(h1, q0 + 3 + 5 * hsh0(key * 2.1 + k * 3 + m)); furQuad(P2(q0, 2.36), P2(q1, 2.36), y0 + 1.2 - 2 - 4.5 * hsh0(key + m + k * 7.7), y0 + 1.5, 0, sun); }
          else if (hb < 0.56) furQuad(P2(h0 + 0.6, 1.2), P2(h1 - 0.6, 1.2), y0 + 1.3, y0 + 2.2 + 1.2 * hsh0(key + k * 5.1 + m), 1, sun);
        }
      }
    };
    const FR = [0, 0.26, 0.48, 0.68, 0.85, 1];
    for (let ti = 0; ti < TOWERS.length; ti++) {
      const t = TOWERS[ti];
      const s = t.side, n = t.h < 60 ? 1 : 5;
      if (n > 1) {
        const top = t.w ? 62 : t.h * FR[1];
        dressWall(0, s * 42, -s, t.z0, t.z1, top, s > 0 ? 0.6 : 0.15, ti + 1);
        dressWall(1, t.z1, 1, s > 0 ? 42 : -84, s > 0 ? 84 : -42, top, 1, ti + 21);
      }
      for (let j = 0; j < n; j++) {
        const y0 = t.h * (n === 1 ? 0 : FR[j]), y1 = t.h * (n === 1 ? 1 : FR[j + 1]), inner = 42 + j * (t.w ? 0 : 5), z0 = t.z0 + j * 3, z1 = t.z1 - j * 3;
        tg.box(s * (inner + 112) / 2, (z0 + z1) / 2, 1, 0, (112 - inner) / 2, (z1 - z0) / 2, y0 - (j ? 0 : 2), y1, conc, mossDk);
        const xs = s * (inner - 0.5), drop = rng.range(8, 20) * Math.min(1.2, density), crest = rng.range(3.5, 7);
        furQuad([xs, z0], [xs, z1], y1 - drop, y1 + 0.3, 0, s > 0 ? 0.55 : 0.1); furQuad([xs, z0], [xs, z1], y1 - 0.5, y1 + crest, 1, s > 0 ? 0.7 : 0.25);
        furQuad([s * inner, z1 + 0.5], [s * 112, z1 + 0.5], y1 - drop * 0.8, y1 + 0.3, 0, 1); furQuad([s * inner, z1 + 0.5], [s * 112, z1 + 0.5], y1 - 0.5, y1 + crest, 1, 1);
        if (j === 0 && n > 1) { const d2 = rng.range(10, 18); furQuad([xs + s * 0.2, z0], [xs + s * 0.2, z1], y1 * 0.5 - d2, y1 * 0.5, 0, s > 0 ? 0.5 : 0.1); }
        const trees = n === 1 ? 5 : 2;
        for (let k = 0; k < trees; k++) { const r = rng.range(3.5, 6.5); addBlob(s * (inner + rng.range(2, 9)), y1 + r * 0.8, rng.range(z0 + 5, z1 - 5), r, r * rng.range(0.9, 1.4), r, rng.pick(greens), 0, y1 > 120 ? 1 : 0); }
      }
      if (t.w) {                                              // tower W: the upper block set back 22 m, a brimming roof pool ringed by trees
        tg.box(88, -45, 1, 0, 24, 35, 228, 375, conc, mossDk);
        furQuad([63.5, -80], [63.5, -10], 375 - 16, 375.3, 0, 0.55); furQuad([64, -9.5], [112, -9.5], 375 - 14, 375.3, 0, 1);
        for (let k = 0; k < 7; k++) { const r = rng.range(4, 7); addBlob(rng.range(45, 61), 228 + r * 0.8, -78 + k * 11 + (k > 2 ? 9 : 0), r, r * 1.2, r, rng.pick(greens), 0, 1); }
      }
      await ctx.yield();
    }
    // far ranks of towers and green hills beyond the river, dissolving into the haze
    // (same draws as ever from the world's rng; everything new about them comes from hsh, so nothing after this moves)
    const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    const farGreen = C('#2f4f2c');
    for (let i = 0; i < 64; i++) {
      // ranks beyond the river: none nearer than the bridge in the middle of the view, the further ones standing on the hills
      const a = rng.range(-1.35, 1.35), r0 = rng.range(760, 2700), r1 = 1250 + (r0 - 760) * 0.75, r = Math.abs(a - 0.2) < 0.8 ? Math.max(r1, 1680 + 500 * hsh(i + 140)) : r1;
      const x = HERO.x + Math.sin(a + 0.3) * r, z = HERO.z - Math.cos(a + 0.3) * r, lift = r > 1650 ? 30 + 80 * hsh(i + 90) : 0;
      const w = rng.range(22, 48), h = Math.min(rng.range(70, 240) + (r0 > 1500 ? 80 : 0) + lift, 0.105 * r), dk = w * rng.range(0.5, 1);
      // two or three stacked blocks with setbacks, the top one off centre, a crown of trees on the nearer ones: tops stay under 9 degrees
      const n = 2 + (hsh(i) > 0.45 ? 1 : 0), ca = Math.cos(a), sa = Math.sin(a), off = (hsh(i + 70) - 0.5) * w * 0.5;
      for (let j = 0; j < n; j++) {
        const k = 1 - j * (0.2 + 0.12 * hsh(i * 3 + j)), y0 = j ? h * (0.45 + 0.27 * (j - 1) + 0.08 * hsh(i + j * 9)) : -2, y1 = j === n - 1 ? h : h * (0.45 + 0.27 * j + 0.08 * hsh(i + (j + 1) * 9));
        tg.box(x + ca * off * j * 0.5, z + sa * off * j * 0.5, ca, sa, w * k, dk * k, y0, y1, conc, mossDk);
      }
      if (r < 1900) { const k = 1 - (n - 1) * 0.26; addBlob(x + ca * off * (n - 1) * 0.5, h + 3, z + sa * off * (n - 1) * 0.5, w * k * 0.9, 9 + 8 * hsh(i + 31), dk * k * 0.9, farGreen, -a, 1); }
    }
    for (let i = 0; i < 9; i++) {
      const a = -1.2 + i * 0.3 + rng.range(-0.08, 0.08), r = 1700 + (rng.range(1300, 2300) - 1300) * 0.75, hx = HERO.x + Math.sin(a + 0.3) * r, hz = HERO.z - Math.cos(a + 0.3) * r;
      const sx0 = rng.range(380, 620), sy = rng.range(110, 200), sz0 = rng.range(300, 480), fit = Math.min(1, (r - 1520) / Math.max(sx0, sz0)), sx = sx0 * fit, sz = sz0 * fit;   // every hill stays beyond the bridge
      addBlob(hx, 10, hz, sx, sy, sz, C('#2c4a30'), a, 1);
      // apartment slabs stepping up the near flank of each hill
      for (let k = 0; k < 4; k++) {
        const t = 0.25 + 0.17 * k, la = a + 0.3 + (hsh(i * 7 + k) - 0.5) * 1.3, rr = Math.min(sx, sz) * t, px = hx - Math.sin(la) * rr, pz = hz + Math.cos(la) * rr;
        const y = 10 + sy * Math.sqrt(Math.max(0, 1 - t * t)) - 14;
        tg.box(px, pz, Math.cos(a), Math.sin(a), 34 + 30 * hsh(i * 5 + k), 8, y - 30, y + 26 + 22 * hsh(i * 11 + k), conc, mossDk);
      }
    }
    await ctx.yield();
    // ---- THE FAR BANK: a rank of terraced, furred towers 56 to 240 m behind the ring on both sides of it (stack frame), with a quay of
    // old trees and sedge at their feet, so that the stack stands in a bowl of green city and the last run ends in a canyon, not on an
    // open plain; the gap in the middle keeps the river, the bridge and the far city behind the ring. Lit from astern, they stand in the
    // pond's mirror (uRank). RANK: [x0, x1, front z, depth, height]. Their own hash: no draws from the rng. ----
    const RANK = [[-112, -46, -62, 60, 142], [-198, -130, -70, 56, 186], [-296, -216, -58, 62, 128], [46, 108, -64, 60, 150], [126, 198, -56, 60, 118], [216, 296, -72, 56, 204], [-178, -112, -190, 50, 236], [108, 166, -184, 50, 226]];
    const rux = Math.cos(HERO.rot), ruz = -Math.sin(HERO.rot), FRK = [0, 0.3, 0.56, 0.8, 1], quayC = [C('#587c2f'), C('#6c8a36'), C('#7d9340'), C('#4d742e')].map(nightC), barkC = C('#6a5c4c');
    // (DEPTH: every block steps back 8 m at the front; the three lower blocks of the six towers nearest the ring are two or three separate
    // masses with light wells between them, 6.5 m wide and 7 m deep: a dark back wall, pale balconies bridging the gap, creeper hanging
    // down it. Fins and stacks of balconies stand on the two lower blocks. In the shader their panes each sit and tint differently out
    // to 500 m, their rooms are lit by the low sun, and the creeper is leaf-edged patches, not a wash.)
    const slotC = new THREE.Color(0.05, 0.07, 0.065);
    for (let ri = 0; ri < RANK.length; ri++) {
      const [x0, x1, zf, dp, h] = RANK[ri];
      M.water.uniforms.uRank.value[ri].set(x0, x1, zf, h);
      for (let j = 0; j < 4; j++) {
        const y0 = j ? h * FRK[j] : -2, y1 = h * FRK[j + 1], xc = (x0 + x1) / 2, hu = (x1 - x0) / 2 - j * 3, hv = dp / 2 - j * 4, zfr = zf - j * 8, zm = zfr - hv;
        const ns = ri < 6 ? (j < 2 ? 2 : j === 2 ? 1 : 0) : 0, slots = [];
        for (let k = 0; k < ns; k++) slots.push(xc - hu + 2 * hu * (k + 1) / (ns + 1) + (hsh(ri * 6.3 + k * 2.9 + (j === 2 ? 7 : 0)) - 0.5) * 7);
        for (let k = 0, xa = xc - hu; k <= ns; k++) {          // the masses between the wells
          const xb = k < ns ? slots[k] - 3.25 : xc + hu, c = toWorld((xa + xb) / 2, 0, zm);
          tg.box(c[0], c[2], rux, ruz, (xb - xa) / 2, hv, y0, y1, conc, mossDk);
          xa = xb + 6.5;
        }
        for (let k = 0; k < ns; k++) {
          const sx = slots[k], zb = zfr - 7, yb0 = Math.max(y0, 0);
          sg.quad(toWorld(sx - 3.3, yb0, zb), toWorld(sx + 3.3, yb0, zb), toWorld(sx + 3.3, y1, zb), toWorld(sx - 3.3, y1, zb), slotC, slotC);
          for (let f = 1, nf = Math.floor((y1 - yb0) / 4.2); f < nf; f++) {
            const hb = hsh(ri * 9.7 + j * 4.1 + k * 2.3 + f * 1.7); if (hb > 0.58) continue;
            const cb = toWorld(sx, 0, zfr - 1.25), yb = yb0 + f * 4.2;
            sg.box(cb[0], cb[2], rux, ruz, 3.3, 1.2, yb, yb + 1.3, balC, balTop, concDk);
            if (hb < 0.2) { const pa = toWorld(sx - 3 + 3 * hb * 5, 0, zfr + 0.05), pb = toWorld(sx + 0.4 + 3 * hb * 5 * 0.8, 0, zfr + 0.05); furQuad([pa[0], pa[2]], [pb[0], pb[2]], yb - 3 - 5 * hsh(ri + f * 3.3 + k), yb + 1.4, 0, 0.85); }
          }
          const dropS = Math.min(y1 - yb0 - 2, 10 + 18 * hsh(ri * 3.1 + j * 7.7 + k)), pa = toWorld(sx - 3.2, 0, zfr - 3.5), pb = toWorld(sx + 3.2, 0, zfr - 3.5);
          furQuad([pa[0], pa[2]], [pb[0], pb[2]], y1 - dropS, y1 + 0.3, 0, 0.7);                              // creeper down the well
        }
        const inSlot = (xa, xb) => slots.some((sx) => xb > sx - 3.6 && xa < sx + 3.6);
        const zq = zfr + 0.5, a = toWorld(xc - hu, 0, zq), b = toWorld(xc + hu, 0, zq), drop = (9 + 12 * hsh(ri * 7.1 + j)) * Math.min(1.2, density), crest = 3.5 + 3.5 * hsh(ri * 3.3 + j * 5);
        furQuad([a[0], a[2]], [b[0], b[2]], y1 - drop, y1 + 0.3, 0, 0.9); furQuad([a[0], a[2]], [b[0], b[2]], y1 - 0.5, y1 + crest, 1, 1);
        if (j < 2 && ri < 6) {                                 // fins on every pilaster line and stacks of balconies between them, as on the boulevard
          const yb0 = Math.max(y0, 0), floors = Math.min(12, Math.floor((y1 - yb0 - 6) / 4.2));
          for (let fxp = xc - hu + 3, m = 0; fxp < xc + hu - 2; fxp += 20.4, m++) {
            if (!inSlot(fxp - 0.7, fxp + 0.7)) { const cf = toWorld(fxp, 0, zfr + 0.65); sg.box(cf[0], cf[2], rux, ruz, 0.65, 0.65, yb0 - 1, y1, finC, moss); }
            const hk = hsh(ri * 7.3 + m * 3.1 + j * 1.3), bx0 = fxp + 2.4 + 4.08 * Math.floor(hk * 1.99);
            if (hk < 0.18 || bx0 + 10.6 > xc + hu - 1 || inSlot(bx0, bx0 + 10.6)) continue;
            for (let k = 2; k <= floors; k++) {
              const hb = hsh(ri * 3.7 + m * 5.3 + k * 1.9 + j * 2.3), yb = yb0 + k * 4.2 + 0.04, cb = toWorld(bx0 + 5.3, 0, zfr + 1.15);
              if (hb > (j ? 0.6 : 0.74)) continue;
              sg.box(cb[0], cb[2], rux, ruz, 5.3, 1.15, yb, yb + 1.45, balC, balTop, concDk);
              const q0 = bx0 + 6 * hsh(ri * 1.3 + k + m), q1 = Math.min(bx0 + 10.6, q0 + 3 + 5 * hsh(ri * 2.1 + k * 3 + m)), pa = toWorld(q0, 0, zfr + 2.36), pb = toWorld(q1, 0, zfr + 2.36);
              if (hb < 0.4) furQuad([pa[0], pa[2]], [pb[0], pb[2]], yb + 1.2 - 2 - 4.5 * hsh(ri + m + k * 7.7), yb + 1.5, 0, 0.85);
              else if (hb < 0.56) { const sa = toWorld(bx0 + 0.6, 0, zfr + 1.2), sb2 = toWorld(bx0 + 10, 0, zfr + 1.2); furQuad([sa[0], sa[2]], [sb2[0], sb2[2]], yb + 1.3, yb + 2.2 + 1.2 * hsh(ri + k * 5.1 + m), 1, 0.9); }
            }
          }
        }
        if (j === 0) for (let k = 0; k < 3; k++) {           // creeper down the lowest block, in three uneven curtains
          const u0 = 0.04 + 0.3 * k + 0.1 * hsh(ri * 5.7 + k), u1 = u0 + 0.14 + 0.12 * hsh(ri * 2.9 + k), top = y1 * (0.42 + 0.3 * hsh(ri * 9.3 + k));
          const p0 = toWorld(xc - hu + 2 * hu * u0, 0, zq), p1 = toWorld(xc - hu + 2 * hu * Math.min(u1, 0.98), 0, zq);
          furQuad([p0[0], p0[2]], [p1[0], p1[2]], Math.max(top - 10 - 14 * hsh(ri * 4.1 + k), 1), top, 0, 0.85);
        }
        for (let k = 0; k < 3; k++) {                         // trees on every setback: leafy masses on the two lower ones, plain crowns above
          const r = 4 + 3 * hsh(ri * 11 + j * 3 + k), q = toWorld(xc - hu + 4 + (2 * hu - 8) * hsh(ri * 13 + j * 7 + k), 0, zfr - 3 - 3 * hsh(ri + j + k * 3));
          if (j < 2 && ri < 6) addBlobN(q[0], y1 + r * 0.7, q[2], r, r * (0.8 + 0.4 * hsh(ri * 17 + k + j)), r, quayC[(ri + j + k) % 4], hsh(ri + k) * TAU, 6);
          else addBlob(q[0], y1 + r * 0.75, q[2], r, r * (0.9 + 0.5 * hsh(ri * 17 + k + j)), r, greens[(ri + j + k) % 5], 0, 1);
        }
      }
      await ctx.yield();
    }
    for (const sd of [-1, 1]) {
      const c = toWorld(sd * 172, 0, -53); sg.box(c[0], c[2], rux, ruz, 128, 4.5, -1.2, 0.5, concDk, moss);
      for (let k = 0; k < 9; k++) {                           // the quay's trees: a trunk and four masses of foliage each
        const w = toWorld(sd * (53 + k * 27 + 9 * hsh(k * 3.1 + sd)), 0, -52.5 + 2 * hsh(k * 7.7 + sd)), sc = 0.85 + 0.5 * hsh(k * 5.3 + sd * 2), R = 5.2 * sc, H = 10 * sc;
        sg.prism(w[0], w[2], 1, 0, 0.5 * sc, 0.5 * sc, 0.4, H * 0.85, barkC, barkC.clone().multiplyScalar(0.8), 6);
        for (let q = 0; q < 4; q++) {
          const a = (q + hsh(k * 9.1 + q + sd)) / 3 * TAU, rr2 = q === 3 ? 0 : R * 0.52;
          addBlobN(w[0] + Math.cos(a) * rr2, H + (q === 3 ? 0.36 * R : (hsh(k + q * 3.7 + sd) - 0.5) * 0.3 * R), w[2] + Math.sin(a) * rr2, R * 0.64, R * 0.46, R * 0.64, quayC[(k + q) % 4], a, 6);
        }
      }
      for (let k = 0, lx = 46; lx < 296; k++) {               // sedge standing along the quay's edge in ragged lengths
        const l = 3 + 5 * hsh(k * 2.7 + sd * 3), a = toWorld(sd * lx, 0, -48.4), b = toWorld(sd * (lx + l), 0, -48.4);
        if (hsh(k * 6.1 + sd) > 0.2) furQuad([a[0], a[2]], [b[0], b[2]], -0.12, 0.7 + 0.8 * hsh(k * 4.3 + sd), 2, 0.85);
        lx += l + 1.5 * hsh(k * 8.9 + sd);
      }
    }
    // creeper curtains down the left-hand tower where the low run passes it (z 327 to 258): from balcony height, 6 to 14 m long
    for (let i = 0; i < 9; i++) {
      const z0 = 261 + i * 7.1 + 2.5 * hsh(i * 3.7 + 90), w = 3 + 3 * hsh(i * 5.1 + 91), top = (3 + ((i * 3) % 5)) * 4.2 + 1.6, drop = 6 + 8 * hsh(i * 7.3 + 92);
      furQuad([-40.6, z0], [-40.6, Math.min(z0 + w, 326)], Math.max(top - drop, 1.2), top, 0, 0.4);
    }
    await ctx.yield();
    // the cable-stayed bridge over the river 1.4 km behind the stack: deck, two portal pylons, creeper hanging from the girder
    const BR = { x: 800, z: -1690, ux: 0.94, uz: 0.34, deck: 46, top: 190 }, stayP = [], stayU = [], stayI = [];
    {
      // (its concrete is given three times the albedo: what is left of its own colour through 1.5 km of rain then shows it sunlit against the slate)
      const conc = C('#a39d90').multiplyScalar(3), concDk = C('#77736c').multiplyScalar(3);
      const B = (su, sv, y) => [BR.x + BR.ux * su - BR.uz * sv, y, BR.z + BR.uz * su + BR.ux * sv];
      sg.box(BR.x, BR.z, BR.ux, BR.uz, 620, 13, BR.deck - 5, BR.deck, concDk, mossDk, concDk);
      for (const su of [-580, -470, 470, 580]) sg.box(B(su, 0, 0)[0], B(su, 0, 0)[2], BR.ux, BR.uz, 5, 10, -2, BR.deck - 5, conc, conc);
      for (const su of [-270, 270]) {
        for (const sv of [-16, 16]) { const q = B(su, sv, 0); sg.box(q[0], q[2], BR.ux, BR.uz, 6, 5, -2, BR.top, conc, mossDk); }
        const c = B(su, 0, 0); sg.box(c[0], c[2], BR.ux, BR.uz, 5, 20, BR.top - 22, BR.top - 8, conc, mossDk); sg.box(c[0], c[2], BR.ux, BR.uz, 5, 20, BR.deck + 40, BR.deck + 50, conc, mossDk);
        for (const dir of [-1, 1]) {           // a fan of stays either side of each pylon, drawn as one veiled triangle (lines in the shader)
          const o = stayP.length / 3, T = B(su, 0, BR.top - 10), D0 = B(su + dir * 8, 0, BR.deck), D1 = B(su + dir * 186, 0, BR.deck);
          stayP.push(...T, ...D0, ...D1); stayU.push(0, 0, 0, 1, 1, 1); stayI.push(o, o + 1, o + 2);
        }
      }
      for (let k = 0; k < 16; k++) {
        const s0 = -600 + k * 75 + 20 * hsh(k + 200), s1 = s0 + 40 + 30 * hsh(k + 300), a0 = B(s0, 13.3, 0), a1 = B(s1, 13.3, 0), drop = 14 + 26 * hsh(k + 400);
        furQuad([a0[0], a0[2]], [a1[0], a1[2]], BR.deck - drop, BR.deck + 0.5, 0, 0.6);
      }
    }
    await ctx.yield();

    // ---- street furniture: pavements, park, monorail, dropped spans and train, metro court, canopy, gantries, lamp posts ----
    sg.box(36, 345, 1, 0, 6, 355, -1.2, 0.16, concDk, moss); sg.box(-36, 478, 1, 0, 6, 221, -1.2, 0.16, concDk, moss);
    sg.box(-150, 100, 1, 0, 108, 160, -1.5, 0.7, mossDk, C('#55803a'));
    sg.box(-78, 392, 1, 0, 35, 65, -1, 5, concDk, mossDk);                                  // the collapsed plot under bamboo
    // THE PARK'S LAWN IS A MEADOW: tall grass in flower standing in drifts across it (fur kind 3), thickest toward the boulevard, and
    // sedge overhanging its edge in ragged lengths: from the air never a flat green slab with a ruled kerb (the concrete shader gives its
    // top the deck meadows' blades and drifts of flowers too). Hashes and the seeded noise: no draws from the rng.
    for (let i = 0; i < 440; i++) {
      const x = -43.5 - 78 * Math.pow(hsh(i * 1.37 + 3000), 1.6), z = -56 + 312 * hsh(i * 2.11 + 3100);
      if (ctx.noise.n2(x * 0.045, z * 0.045) < -0.18) continue;
      const ang = hsh(i * 3.3 + 3200) * Math.PI, l = 1.6 + 2.6 * hsh(i * 5.7 + 3300), dx = Math.cos(ang) * l / 2, dz = Math.sin(ang) * l / 2;
      furQuad([x - dx, z - dz], [x + dx, z + dz], 0.64, 1.3 + 1.1 * hsh(i * 7.1 + 3400), 3, 0.9);
    }
    for (let z = -58, k = 0; z < 256; k++) { const l = 1.8 + 3.4 * hsh(k * 2.7 + 3500); if (hsh(k * 6.1 + 3600) > 0.25) furQuad([-41.85, z], [-41.85, Math.min(z + l, 258)], 0.2, 1.1 + 0.9 * hsh(k * 4.3 + 3700), 2, 0.8); z += l + 1.2 * hsh(k * 8.9 + 3800); }
    await ctx.yield();
    // (round 15) and low mounds of bramble and kudzu stand in the meadow, by hash: from the air the park has relief, not one level
    for (let i = 0; i < 46; i++) { const x = -45 - 74 * hsh0(i * 3.1 + 4100), z = -50 + 300 * hsh0(i * 7.7 + 4200); if (ctx.noise.n2(x * 0.05, z * 0.05) < -0.15) continue; const sc = 1.2 + 2.2 * hsh0(i * 5.3 + 4300); addBlobN(x, 0.55, z, sc, 0.5 + 0.35 * sc * hsh0(i + 4400), sc * (0.8 + 0.5 * hsh0(i * 2.1 + 4500)), greens[i % 5], hsh0(i * 9.1) * TAU); }
    sg.beam([-50, 25.3, 256], [-50, 25.3, 8], 1.6, 3.3, conc, moss);
    for (let k = 0; k < 9; k++) {                               // creeper curtains hanging 4 to 9 m from the beam, a shrubby crest along its top
      const z1 = 252 - k * 27 - 6 * hsh(k + 500), z0 = z1 - 13 - 9 * hsh(k + 510), drop = 4 + 5 * hsh(k + 520);
      furQuad([-48.3, Math.max(z0, 10)], [-48.3, z1], 25.3 - drop, 25.5, 0, 0.3); furQuad([-51.7, Math.max(z0, 10) - 3], [-51.7, z1 - 5], 25.3 - drop * 0.8, 25.5, 0, 0.8);
      if (k % 2 === 0) furQuad([-50, Math.max(z0, 10)], [-50, z1], 25.1, 25.3 + 1.6 + 1.4 * hsh(k + 530), 1, 0.6);
    }
    for (let z = 240; z >= 0; z -= 40) { sg.prism(-50, z, 1, 0, 1.6, 2.2, 0, 20.5, mossDk, conc, 12); sg.box(-50, z, 1, 0, 4.2, 1.6, 20.5, 22, conc, moss); }
    sg.beam([-46, 25.3, 8], [-2, 16.3, -18], 1.6, 3.3, conc, moss); sg.beam([-2, 16.3, -18], [38, 1.2, -40], 1.6, 3.3, conc, moss);
    // (round 15) THE DROPPED SPANS ARE DRESSED: every 3 m of both flanks a cast panel in its own stain (rust, damp, moss, lime), creeper
    // hanging from the top edge down over the flank and below it in curtains of uneven length, a crest of shrubs and mounds of kudzu
    // along the first span's top (the train lies on the second). Where the way passes beneath, nothing hangs within 3.5 m of the eye's height.
    for (const [A, B, top, id] of [[[-46, 25.3, 8], [-2, 16.3, -18], 1, 900], [[-2, 16.3, -18], [38, 1.2, -40], 0, 1300]]) {
      const dx = B[0] - A[0], dz = B[2] - A[2], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, n = Math.round(l / 3.1);
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, y0 = A[1] + (B[1] - A[1]) * t0, y1 = A[1] + (B[1] - A[1]) * t1, ym = (y0 + y1) / 2, x0 = A[0] + dx * t0, z0 = A[2] + dz * t0, x1 = A[0] + dx * t1, z1 = A[2] + dz * t1;
        const nr = path.nearestXZ((x0 + x1) / 2, (z0 + z1) / 2), eye = nr.dist < 14 ? nr.y : -5;
        for (const s of [-1, 1]) {
          const h1 = hsh0(id + k * 3.7 + s * 11), h2 = hsh0(id + k * 5.9 + s * 17), ox = nx * s * 1.63, oz = nz * s * 1.63;
          if (h1 > 0.3) { const pc = h1 > 0.78 ? rust.clone().lerp(conc, 0.62) : h1 > 0.55 ? mossDk.clone().lerp(conc, 0.6) : concDk.clone().lerp(conc, 0.55 + 0.9 * (h1 - 0.3)), g = 0.04;
            sg.quad([x0 + dx / n * g + ox, y0 - 0.2, z0 + dz / n * g + oz], [x1 - dx / n * g + ox, y1 - 0.2, z1 - dz / n * g + oz], [x1 - dx / n * g + ox, y1 - 3.1, z1 - dz / n * g + oz], [x0 + dx / n * g + ox, y0 - 3.1, z0 + dz / n * g + oz], pc, pc.clone().multiplyScalar(0.62)); }
          if (h2 < 0.8) { const drop = Math.min(1.6 + 5.8 * hsh0(id + k * 4.1 + s * 3), ym - Math.max(eye + 3.5, 0.4)); if (drop > 0.8) furQuad([x0 + nx * s * 1.7, z0 + nz * s * 1.7], [x1 + nx * s * 1.7, z1 + nz * s * 1.7], ym - drop, ym + 0.25, 0, s > 0 ? 0.75 : 0.4); }
        }
        if (top) {
          const h3 = hsh0(id + k * 7.3 + 5);
          if (h3 > 0.4) furQuad([x0, z0], [x1, z1], ym - 0.15, ym + 0.8 + 1.3 * hsh0(id + k * 2.9), 1, 0.7);
          if (h3 > 0.72) addBlobN((x0 + x1) / 2, ym + 0.25, (z0 + z1) / 2, 2.1, 1.0 + 0.5 * h3, 1.8, greens[k % 5], h3 * TAU);
        }
      }
    }
    // (round 15) and the things the way passes close beside over the court end in green, not in a hard edge: a crest of shrubs and
    // short creeper along the canopy's near eave and its ridge, mounds of kudzu on its near slope, sedge, tall grass and low mounds
    // along the slot's near rim
    for (let k = 0; k < 9; k++) {
      const z0 = 21.5 + k * 2.9, z1 = z0 + 2.2 + 0.6 * hsh0(k + 1700), h = hsh0(k * 3.3 + 1710);
      if (h > 0.25) furQuad([-4.1, z0], [-4.1, z1], 8.1, 8.9 + 1.0 * hsh0(k + 1720), 1, 0.7);
      if (h < 0.7) furQuad([-4.25, z0], [-4.25, z1], 8.3 - 1.0 - 1.9 * hsh0(k + 1730), 8.4, 0, 0.5);
      if (h > 0.5) furQuad([6, z0], [6, z1], 9.5, 10.2 + 0.9 * hsh0(k + 1740), 1, 0.8);
      if (k % 3 === 1) addBlobN(-1.2 + 2.4 * h, 9.0 + 0.3 * h, (z0 + z1) / 2, 1.9, 0.8, 2.3, greens[k % 5], h * TAU);
      furQuad([-2.35, z0 - 0.4], [-2.35, z1], -0.1, 0.5 + 0.9 * hsh0(k + 1750), k % 2 ? 2 : 3, 0.8);
      if (k % 2 === 0) addBlobN(-2.75, 0.1, (z0 + z1) / 2, 1.0, 0.55 + 0.3 * h, 1.5, greens[(k + 2) % 5], h * TAU);
    }
    // (the sunk pier at (-2, -18) passes 10 m from the eye: it is a smooth column of its own further down, with a moss skirt, ferns and creeper)
    for (let k = 0; k < 7; k++) {
      const a0 = (k + 0.2 * hsh(k + 700)) / 7 * TAU, a1 = a0 + 0.5 + 0.3 * hsh(k + 710), P0 = [-2 + Math.cos(a0) * 2.0, -18 + Math.sin(a0) * 2.6], P1 = [-2 + Math.cos(a1) * 2.0, -18 + Math.sin(a1) * 2.6];
      furQuad(P0, P1, -0.12, 0.5 + 0.7 * hsh(k + 720), 2, 0.8);                                               // sedge at its foot
      if (k % 2 === 0 || P0[0] < -2) furQuad([-2 + Math.cos(a0) * 1.98, -18 + Math.sin(a0) * 2.58], [-2 + Math.cos(a1) * 1.98, -18 + Math.sin(a1) * 2.58], 5.3, 6.1 + 0.8 * hsh(k + 730), 1, 0.8);      // a crest of shrubs on the skirt's ledge
      if (k % 2 === 1 || P0[0] < -2.5) furQuad([-2 + Math.cos(a0) * 1.72, -18 + Math.sin(a0) * 2.3], [-2 + Math.cos(a1) * 1.72, -18 + Math.sin(a1) * 2.3], 13 - 3 - 4.5 * hsh(k + 740), 13.2, 0, 0.75);      // creeper from under the beam
    }
    // the two-car train, nose down on the second dropped span: pale mossed bodies, a band of dark window sockets on both flanks
    const trainC = C('#7d8f72'), trainTop = C('#4f7a34');
    for (const [a, b] of [[[7, 18.1, -22.9], [20, 13.2, -30.1]], [[21, 12.8, -30.6], [35.5, 6.4, -38.6]]]) {
      const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz), nx = -dz / l * 1.56, nz = dx / l * 1.56;
      sg.beam(a, b, 1.5, 3.2, trainC, trainTop);
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) {
        const t0 = 0.08 + k * 0.18, t1 = t0 + 0.13, P = (t, y) => [a[0] + dx * t + nx * s, a[1] + (b[1] - a[1]) * t - y, a[2] + dz * t + nz * s];
        sg.quad(P(t0, 0.7), P(t1, 0.7), P(t1, 1.8), P(t0, 1.8), socket);
      }
    }
    // metro court (a pit in the sheet) and the escalator slot beyond it: mossed lip, cast panels; the shader wets and darkens them with depth
    const lipC = [C('#4a5240'), C('#525a46')], wallC = [C('#62685a'), C('#596052')], lowC = [C('#4c5548'), C('#454e43')];
    const pit = (runs, yb) => {
      for (const [ax, az, bx, bz] of runs) {
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 4.2));
        for (let i = 0; i < n; i++) {
          const px = ax + (bx - ax) * i / n, pz = az + (bz - az) * i / n, qx = ax + (bx - ax) * (i + 1) / n, qz = az + (bz - az) * (i + 1) / n, m = i % 2;
          sg.quad([px, 0, pz], [qx, 0, qz], [qx, -1.2, qz], [px, -1.2, pz], lipC[m], wallC[m]);          // (the moss of the lip is in the shader: tongues of uneven length, no band)
          sg.quad([px, -1.2, pz], [qx, -1.2, qz], [qx, -5, qz], [px, -5, pz], wallC[m], wallC[m]);
          sg.quad([px, -5, pz], [qx, -5, qz], [qx, yb, qz], [px, yb, pz], wallC[m], lowC[m]);
        }
      }
    };
    // (the slot's mouth is open to the court: the three escalators come down into the court's pool in plain view of the approach)
    pit([[-32, 48, -2, 48], [14, 48, 18, 48], [-32, 62, 18, 62], [-32, 48, -32, 62], [18, 48, 18, 62]], -12); pit([[-2, 20, 14, 20], [-2, 20, -2, 48], [14, 20, 14, 48]], -12.5);
    // sedge and moss standing on the rims in ragged tufts, the water pouring between and through them: no ruler edge from the air
    const rimCrest = (x0, x1, z, o) => { for (let x = x0, k = 0; x < x1 - 0.5; k++) { const l = Math.min(x1 - x, 2.2 + 3.2 * hsh(z * 3 + k * 7 + o)), h = 0.55 + 0.6 * hsh(z + k * 13 + o); if (hsh(z * 5 + k * 11 + o) > 0.15) furQuad([x, z], [x + l, z], -0.12, h, 2, 0.75); x += l + 0.5 * hsh(k + o); } };
    rimCrest(-32, 18, 62, 0); rimCrest(-32, 18, 62.5, 40); rimCrest(-32, -2, 48, 0); rimCrest(-32, -2, 47.5, 40); rimCrest(14, 18, 48, 0);
    const lipHang = (a, b, o) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0, k = 0; t < len - 0.8; k++) { const l = Math.min(len - t, 1.6 + 3 * hsh(o + k * 7)), P = (q) => [a[0] + (b[0] - a[0]) * q / len, a[1] + (b[1] - a[1]) * q / len]; if (hsh(o + k * 11) > 0.3) furQuad(P(t), P(t + l), -0.7 - 1.7 * hsh(o + k * 13), 0.06, 0, 0.75); t += l + 1.2 * hsh(o + k * 3); } };
    lipHang([-32, 48.07], [-2, 48.07], 100); lipHang([14, 48.07], [18, 48.07], 140); lipHang([-31.93, 48], [-31.93, 62], 180); lipHang([17.93, 48], [17.93, 62], 220);
    // three escalators abreast climbing away from us to street level at z 20: real treads, rusted balustrades between them
    for (let e = 0; e < 3; e++) for (let i = 0; i < 30; i++) {
      const z0 = 20 + i * 28 / 30, y = -(i + 1) * 0.4;
      const hm = hsh0(i * 3.1 + e * 7.7 + 40);            // dark wet treads, one in three under moss: stone between the runs of water, never a pale stair
      sg.box(0.85 + e * 5.15, z0 + 0.467, 1, 0, 2.15, 0.467, y - 0.7, y, (i + e) % 2 ? C('#383c36') : C('#40443c'), hm > 0.66 ? mossDk.clone().lerp(concDk, 0.3) : hm > 0.4 ? C('#4c5044') : C('#565a50'));
    }
    for (const x of [-1.75, 3.42, 8.58, 13.75]) { sg.beam([x, 1.0, 20], [x, -11.0, 48], 0.13, 1.1, rust, C('#5a3a28')); sg.beam([x, 1.25, 20], [x, -10.75, 48], 0.2, 0.22, C('#3a3028')); }
    for (const x of [-1.75, 3.42, 8.58, 13.75]) {             // (bare, each was a dark wedge in the water beside the dropped beam)
      addBlobN(x, 0.6, 20.9, 0.7, 0.75 + 0.2 * hsh0(x + 3), 1.5, greens[Math.abs(Math.round(x)) % 5], 0);
      addBlobN(x + 0.3 - 0.6 * hsh0(x + 5), 0.3, 19.5, 0.95, 0.5, 0.9, greens[Math.abs(Math.round(x) + 2) % 5], 0);
      furQuad([x - 0.9, 19.7], [x + 0.9, 19.7], -0.12, 0.8 + 0.5 * hsh0(x + 7), 2, 0.8);
    }
    // the ribbed steel canopy over them: eleven arched ribs, a skin of rusted sheets with bays fallen out
    for (let i = 0; i < 11; i++) { const z = 22 + i * 2.5; sg.beam([-4, 8.2, z], [6, 9.6, z], 0.16, 0.4, rust, moss); sg.beam([6, 9.6, z], [16, 8.2, z], 0.16, 0.4, rust, moss); }
    for (let i = 0; i < 10; i++) for (const s of [0, 1]) {
      if ((i * 7 + s * 3) % 5 < 2) continue;
      const z0 = 22 + i * 2.5 + 0.2, z1 = z0 + 2.1, xa = s ? 6 : -4, xb = s ? 16 : 6, ya = s ? 9.62 : 8.22, yb = s ? 8.22 : 9.62;
      sg.quad([xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1], i % 2 ? C('#6d5a44') : C('#7a6248'), C('#5f7a40'));
    }
    for (const x of [-4, 16]) for (const z of [22, 47]) post(sg, [x, 0, z], [x, 8.2, z], 0.2, rust, moss);
    const gantC = concDk.clone().lerp(moss, 0.5), gantTop = moss.clone().lerp(C('#7c9a48'), 0.5);
    GANTRY.forEach((z, gi) => {
      // each beam hangs in two lengths that meet at a sagging joint, mossed, with mounds of creeper and a ragged crest of shrubs on top: no ruler line
      const xj = gi ? -9 : 6, yj = 10.9 - 0.3 * gi;
      post(sg, [-33, 0, z], [-33.6, 11, z], 0.35, concDk, moss); post(sg, [33, 0, z], [33.4, 11, z], 0.35, concDk, moss);
      sg.beam([-34, 11.8, z], [xj, yj, z], 0.5, 1.1, gantC, gantTop); sg.beam([xj, yj, z + 0.15], [34, 11.4 - 0.5 * gi, z + 0.15], 0.5, 1.1, gantC, gantTop);
      for (let k = 0; k < 4; k++) { const bx = -27 + k * 17 + 6 * hsh(gi * 9 + k + 600), t = (bx + 34) / 68; addBlobN(bx, 11.2 - 0.5 * Math.sin(t * Math.PI), z, 1.1 + 0.5 * hsh(k + 610), 0.55, 2.2 + 1.4 * hsh(gi + k + 620), greens[(k + gi) % 5], Math.PI / 2); }
      for (let k = 0; k < 6; k++) { const x0 = -32 + k * 11 + 3 * hsh(gi * 5 + k + 630), x1 = x0 + 5 + 4 * hsh(k + 640); furQuad([x0, z], [Math.min(x1, 33), z], 11.0, 11.9 + 0.7 * hsh(gi + k + 650), 1, 0.9); }
    });
    const vineSpans = [], fernPts = [], reedPts = [], treePts = [], vineSpans2 = [], lampAt = [], carAt = [], mastAt = [], shelterAt = [];
    for (let k = 0; k < 6; k++) { const a = Math.PI * (0.55 + 0.25 * k) + 0.2 * hsh(k + 750); fernPts.push({ x: -2 + Math.cos(a) * 1.82, y: 5.45, z: -18 + Math.sin(a) * 2.4, s: 1.1 + 0.8 * hsh(k + 760), rot: hsh(k + 770) * TAU, v: k % 2, d: 0, u: 0 }); }   // ferns on the sunk pier's ledge
    vineSpans.push([[-3.9, 9.5, -18.6], [-2.6, 4.2, -20.5]], [[-3.2, 12.4, -16.4], [-3.95, 7.5, -17.6]]);                                    // and vine wound round its shaft
    for (const z of GANTRY) for (let k = 0; k < 4; k++) vineSpans.push([[-32 + k * 16, 10.6, z - 0.7], [-16 + k * 16, 10.5, z - 0.7]]);
    for (let i = 0; i < 18; i++) {
      const s = i % 2 ? 1 : -1, z = 660 - i * 38, lean = rng.range(-1.6, 1.6);
      if (s < 0 && z < 257) continue;
      post(sg, [s * 30.6, 0, z], [s * 30.6 + lean, 10.5, z + lean * 0.5], 0.17, concDk, moss); lampAt.push([s * 30.6, z, lean]);
      sg.beam([s * 30.6 + lean, 10.6, z + lean * 0.5], [s * 27.4 + lean, 10.2, z + lean * 0.5], 0.14, 0.2, moss);
      vineSpans.push([[s * 30.6 + lean, 10.4, z + lean * 0.5], [s * 30.6 + lean * 0.3 + s * 0.4, 3.4, z + 1.2]]);       // each post wound with vine
      vineSpans.push([[s * 27.4 + lean, 10.1, z + lean * 0.5], [s * 30.6 + lean, 10.4, z + lean * 0.5]]);
    }
    // NINE SIGNAL MASTS wound with vine (the brief's): a leaning pole on the kerb, an arm out over the near lane, two blank hooded signal
    // heads hanging dark under it, a tuft of creeper at the elbow and a curtain of it off the arm. Hashes only; their vines are a set of their own.
    [[1, 528], [1, 414], [1, 338], [1, 262], [1, 204], [1, 128], [-1, 546], [-1, 394], [-1, 318]].forEach(([sd, z], k) => {
      const x = sd * 29.7, lean = (hsh(k * 3.7 + 900) - 0.5) * 1.5, top = [x + lean * 0.5, 8.7, z + lean], tip = [x - sd * 5.8 + lean * 0.5, 8.2 + 0.5 * hsh(k + 910), z + lean * 0.8];
      post(sg, [x, -0.4, z], top, 0.2, concDk, moss);
      sg.beam([top[0] + sd * 0.2, top[1] - 0.15, top[2]], tip, 0.13, 0.28, moss, mossDk);
      for (const t of [0.52, 0.9]) {
        const hx = top[0] + (tip[0] - top[0]) * t, hy = top[1] + (tip[1] - top[1]) * t - 0.4, hz = top[2] + (tip[2] - top[2]) * t;
        { const hk = hsh(hx * 3.1 + hz * 1.7); sg.box(hx, hz, 1, 0, 0.27, 0.2, hy - 1.45, hy, rust.clone().lerp(mossDk, 0.25 + 0.5 * hk), mossDk, rust.clone().multiplyScalar(0.6)); }      // (round 15: mossed rust, shaded like everything else: not a black cut-out)
        sg.box(hx, hz + 0.3, 1, 0, 0.3, 0.14, hy - 0.08, hy + 0.02, mossDk, moss);       // the head and its hood: no lamp lit in it
        sg.box(hx, hz, 1, 0, 0.05, 0.05, hy, hy + 0.42, concDk, concDk);
      }
      addBlobN(top[0] - sd * 0.5, 8.75, top[2], 0.95, 0.6, 0.8, greens[k % 5], 0);
      furQuad([top[0] - sd * 0.9, top[2] + 0.05], [top[0] - sd * (2.6 + 1.2 * hsh(k + 920)), (top[2] + tip[2]) / 2 + 0.05], 8.1 - 1.3 - 1.6 * hsh(k + 930), 8.2, 0, 0.75);
      vineSpans2.push([[top[0], 8.5, top[2]], [x + sd * 0.35, 1.0, z + 0.9]], [[top[0], 6.4, top[2] - 0.2], [x - sd * 0.3, 0.6, z - 0.8]], [[tip[0], tip[1] - 0.15, tip[2]], [top[0], top[1] - 0.2, top[2]]]);
      mastAt.push([[x, 0, z], top, tip]);
    });
    for (let k = 0; k < 3; k++) vineSpans2.push([[-30 + k * 21, 11.4, 330], [-12 + k * 21, 11.3, 330]]);      // the first wire carries vine too (with the masts' set: its own rng)
    // SEVEN BUS SHELTERS REDUCED TO FRAMES on the pavements: six thin posts, two roof rails and the purlins between them (no sheeting left),
    // a back rail and a bench slab, creeper over one end. No panel, no sign.
    [[1, 500], [1, 376], [1, 300], [1, 186], [1, 104], [-1, 470], [-1, 330]].forEach(([sd, z], k) => {
      const x0 = sd * 31.3, x1 = sd * 33.3, len = 6.4, lean = (hsh(k * 5.1 + 940) - 0.5) * 0.5, y1 = 2.8, e = k % 2 ? 1 : -1;
      for (const dz of [-len / 2, 0, len / 2]) { post(sg, [x0, 0.1, z + dz], [x0 + lean, y1 - 0.28, z + dz + lean * 0.4], 0.07, rust, moss); post(sg, [x1, 0.1, z + dz], [x1 + lean, y1, z + dz + lean * 0.4], 0.07, rust, moss); }
      sg.beam([x0 + lean, y1 - 0.28, z - len / 2 - 0.4], [x0 + lean, y1 - 0.28, z + len / 2 + 0.4], 0.06, 0.12, rust, moss); sg.beam([x1 + lean, y1, z - len / 2 - 0.4], [x1 + lean, y1, z + len / 2 + 0.4], 0.06, 0.12, rust, moss);
      for (let q = 0; q < 6; q++) { const zz = z - len / 2 + q * len / 5 + lean * 0.4; sg.beam([x0 + lean - sd * 0.5, y1 - 0.36, zz], [x1 + lean + sd * 0.2, y1 + 0.03, zz], 0.04, 0.08, rust, moss); }
      sg.beam([x1, 1.15, z - len / 2], [x1, 1.15, z + len / 2], 0.04, 0.08, rust, rust); sg.beam([x1 - sd * 0.5, 0.66, z - len / 2 + 0.7], [x1 - sd * 0.5, 0.66, z + len / 2 - 0.7], 0.18, 0.08, concDk, moss);
      addBlobN(x1 + lean - sd * 0.5, y1, z + e * len * 0.3, 1.6, 0.6, 1.9, greens[(k + 2) % 5], 0);
      furQuad([x0 + lean, z + e * len * 0.3 - 1.5], [x0 + lean, z + e * len * 0.3 + 1.5], y1 - 1.4 - 0.7 * hsh(k + 950), y1 - 0.2, 0, 0.75);
      shelterAt.push([sd, z, lean]);
    });
    for (const z of [300, 250]) for (let k = 0; k < 3; k++) vineSpans.push([[-30 + k * 21, 11.4, z], [-12 + k * 21, 11.3, z]]);          // vine-hung wires
    for (let k = 0; k < 5; k++) { const t0 = 0.1 + k * 0.17, t1 = t0 + 0.14; vineSpans.push([[-46 + 44 * t0, 22 - 9 * t0 - 0.2, 8 - 26 * t0], [-46 + 44 * t1, 22 - 9 * t1 - 0.2, 8 - 26 * t1]]); }   // under the dropped beam
    // looped under the two lowest decks of the stack, clear of the ring and of the piers (nothing hangs below 11 m)
    for (const [x0, x1] of [[-38, -25.5], [-22.5, -12.5], [12.5, 22.5], [25.5, 38]]) vineSpans.push([toWorld(x0, 13.7, 14), toWorld(x1, 13.7, 14)]);
    const d2z = (x) => { const t = (x + 300) / 600, k = 1 - t; return -10 * k * k + 110 * t * k + 240 * t * t; };
    for (const [x0, x1] of [[-34, -18], [14, 30]]) vineSpans.push([toWorld(x0, 20.95, d2z(x0)), toWorld(x1, 20.95, d2z(x1))]);
    await ctx.yield();

    // ---- up on the decks, where the view climbs over them: creeper down the parapets' inner faces, a ragged crest of shrubs on their
    // copings, tall grass in flower standing in drifts on the carriageways. Their own hash and the seeded noise: no draws from the rng. ----
    {
      const P = {};
      for (const di of [4, 2, 1, 0]) {
        const d = DECKS[di], yT = d.y + 2.4, hw = d.w / 2, top = di === 4 || di === 2, reach = top ? 64 : 48;
        for (let t = 0.36, k = 0; t < 0.64; k++) {
          deckPoint(d, t, P);
          const t1 = Math.min(t + (2.4 + 3.4 * hsh(di * 71 + k * 3.1)) / 610, 0.64), ax = P.x, az = P.z, off = Math.abs(P.x - flyX(P.z));
          deckPoint(d, t1, P);
          if (off < reach) for (const sd of [-1, 1]) {
            const W2 = (o) => [toWorld(ax + P.nx * o, 0, az + P.nz * o), toWorld(P.x + P.nx * o, 0, P.z + P.nz * o)];
            const [a, b] = W2(sd * (hw - 0.74)), sun = litAt(a[0], yT + 1, a[2]) * (sd < 0 ? 1 : 0.35), hh = hsh(di * 13 + k * 7.7 + sd);
            if (hh > 0.1) furQuad([a[0], a[2]], [b[0], b[2]], yT + 1.5 - (0.9 + 0.75 * hh), yT + 1.66, 0, sun * 0.45);
            const [a2, b2] = W2(sd * (hw - 0.25));
            if (hsh(di * 29 + k * 5.3 + sd) > 0.25) furQuad([a2[0], a2[2]], [b2[0], b2[2]], yT + 1.35, yT + 1.9 + 0.9 * hsh(di * 31 + k + sd), 1, sun);
          }
          t = t1 + (0.6 + 1.6 * hsh(di * 37 + k)) / 610;
        }
        for (let i = 0, ng = di === 4 ? 320 : di === 2 ? 280 : 90; i < ng; i++) {
          deckPoint(d, 0.5 + (hsh(di * 101 + i * 1.37) - 0.5) * (top ? 0.2 : 0.16), P);
          const o = (hsh(di * 103 + i * 2.11) - 0.5) * 2 * (hw - 1.3), cx = P.x + P.nx * o, cz = P.z + P.nz * o;
          if (i % 4 || (ctx.noise.n2(cx * 0.07 + di * 9, cz * 0.07) < -0.25 && Math.abs(o) < hw - 3.2)) continue;       // in drifts, thickest along the kerbs (one in four of them: the view no longer passes over a deck)
          const ang = hsh(i * 3.3 + di) * Math.PI, l = 1.1 + 1.7 * hsh(i * 5.7 + di * 3), dx = Math.cos(ang) * l / 2, dz = Math.sin(ang) * l / 2;
          const a = toWorld(cx - dx, 0, cz - dz), b = toWorld(cx + dx, 0, cz + dz);
          furQuad([a[0], a[2]], [b[0], b[2]], yT - 0.06, yT + 0.5 + 0.7 * hsh(i * 7.1 + di * 5), 3, litAt(a[0], yT + 0.6, a[2]));
        }
        await ctx.yield();
      }
    }

    // ---- buses: six moss domes. The dome is the silhouette (a lumpy ridge of kudzu over the roof, drapes down both flanks, a tree through
    // it) and the body is what shows through: dark rusted panels, two or three window sockets a side, each bus leaning and sunk at one corner ----
    const busC = [C('#7f7a68'), C('#6c7676'), C('#7a6c5c')], roofC = nightC(C('#4f7a34')), sockLow = new THREE.Color(0.055, 0.1, 0.06), sockMid = new THREE.Color(0.11, 0.19, 0.1);   // faded cream, grey-blue, tan
    const domeC = [C('#4f7a34'), C('#5a8338'), C('#466f30'), C('#3f6b2c'), C('#52792f')];
    const buses = [[12, 452, 0.05], [-23, 405, -0.08], [-27, 372, 0.12], [14, 275, 0.9], [25, 160, -0.1], [-30, 120, 0.2]];
    for (let bi = 0; bi < buses.length; bi++) {
      const [x, z, rot] = buses[bi];
      const ux = Math.cos(rot), uz = -Math.sin(rot), vx = -uz, vz = ux;
      // leaning 3 to 6 degrees about its long axis and sunk 0.3 m, so one lower corner is under water
      const roll = (bi % 2 ? -1 : 1) * (0.055 + 0.05 * hsh(bi * 53 + 7)), cr = Math.cos(roll), sr = Math.sin(roll);
      const W = (su, sv, y) => { const a = su * cr - y * sr; return [x + ux * a + vx * sv, su * sr + y * cr - 0.3, z + uz * a + vz * sv]; };
      const bc = busC[bi % 3].clone().multiplyScalar(0.5).lerp(mossDk, 0.62).lerp(rust, 0.1), low = rust.clone().lerp(mossDk, 0.6).multiplyScalar(0.7), foot = concDk.clone().lerp(mossDk, 0.4).multiplyScalar(0.7), sill = concDk.clone().lerp(bc, 0.5).multiplyScalar(0.8), top = bc.clone().lerp(roofC, 0.35);
      // where the kudzu hangs down each flank: two drapes a side, [centre along the bus, half length, centre height, half height]
      const drape = (s) => [[-4.6 + 2.2 * (hsh(bi * 61 + s) - 0.5), 1.9 + 0.5 * hsh(bi * 71 + s), 2.5, 2.1], [3.9 + 2.2 * (hsh(bi * 67 + s) - 0.5), 2.3 + 0.5 * hsh(bi * 73 + s), 1.75, 2.7], [-0.4 + 1.6 * (hsh(bi * 101 + s) - 0.5), 1.7 + 0.4 * hsh(bi * 103 + s), 1.3, 1.9]];
      const wall = (a, b) => {                       // a, b: [su, sv] ends of a wall without windows
        sg.quad(W(a[0], a[1], -0.6), W(b[0], b[1], -0.6), W(b[0], b[1], 1.25), W(a[0], a[1], 1.25), foot, low); sg.quad(W(a[0], a[1], 1.25), W(b[0], b[1], 1.25), W(b[0], b[1], 2.1), W(a[0], a[1], 2.1), low, bc);
        sg.quad(W(a[0], a[1], 2.1), W(b[0], b[1], 2.1), W(b[0], b[1], 4.4), W(a[0], a[1], 4.4), bc, top);
      };
      for (const s of [-1, 1]) {
        const X = s * 1.9, Xi = s * 1.75, dr = drape(s), under = (v) => dr.some((d) => Math.abs(v - d[0]) < d[1] * 0.8);
        for (let k = 0; k < 9; k++) {                // the lower panels: nine sheets a side, each rusted or mossed its own way
          const v0 = -7.9 + k * 15.8 / 9, v1 = v0 + 15.8 / 9, h1 = hsh(bi * 31 + k * 5 + s), h2 = hsh(bi * 43 + k * 9 + s);
          const lo = low.clone().lerp(h1 > 0.5 ? rust : mossDk, 0.5 * h2).multiplyScalar(0.55 + 0.6 * h1), mid = bc.clone().lerp(lo, 0.5);
          sg.quad(W(X, v0, -0.6), W(X, v1, -0.6), W(X, v1, 1.25), W(X, v0, 1.25), foot, lo); sg.quad(W(X, v0, 1.25), W(X, v1, 1.25), W(X, v1, 2.1), W(X, v0, 2.1), lo, mid);
        }
        sg.quad(W(X, -7.9, 3.5), W(X, 7.9, 3.5), W(X, 7.9, 4.4), W(X, -7.9, 4.4), bc, top);
        let pv = -7.9;
        for (let k = 0; k < 7; k++) {
          const v0 = -7.6 + k * 2.2, v1 = v0 + 1.75;
          sg.quad(W(X, pv, 2.1), W(X, v0, 2.1), W(X, v0, 3.5), W(X, pv, 3.5), bc); pv = v1;
          sg.quad(W(Xi, v0, 2.1), W(Xi, v1, 2.1), W(Xi, v1, 3.5), W(Xi, v0, 3.5), sockMid, sockLow);      // green gloom low in each socket, dark above
          sg.quad(W(X, v0, 2.1), W(X, v1, 2.1), W(Xi, v1, 2.1), W(Xi, v0, 2.1), sill); sg.quad(W(X, v0, 3.5), W(X, v1, 3.5), W(Xi, v1, 3.5), W(Xi, v0, 3.5), sill);
          sg.quad(W(X, v0, 2.1), W(Xi, v0, 2.1), W(Xi, v0, 3.5), W(X, v0, 3.5), sill); sg.quad(W(X, v1, 2.1), W(Xi, v1, 2.1), W(Xi, v1, 3.5), W(X, v1, 3.5), sill);
          if (hsh(bi * 13 + k * 3 + s) > 0.4 && !under((v0 + v1) / 2)) { const f = W(s * 1.82, (v0 + v1) / 2, 2.12); fernPts.push({ x: f[0], y: f[1], z: f[2], s: 0.75 + 0.4 * hsh(bi + k * 7 + s), rot: hsh(bi * 5 + k) * TAU, v: k % 2, d: 0, u: 0 }); }   // ferns in the sockets
        }
        sg.quad(W(X, pv, 2.1), W(X, 7.9, 2.1), W(X, 7.9, 3.5), W(X, pv, 3.5), bc);
        for (const e of [-1, 1]) wall([X, e * 7.9], [s * 1.25, e * 9]);
        // the drapes: rough mounds of kudzu on the wall plane, from the roof down over the windows, one of the two reaching the water
        dr.forEach((d, q) => { const c = W(s * 1.95, d[0], d[2]); addBlobN(c[0], c[1], c[2], 1.05 + 0.25 * hsh(bi * 79 + s + q), d[3], d[1], domeC[(bi + q + (s > 0 ? 2 : 0)) % 5], rot); });
        // loose ends of it hanging plumb under each drape and off the roof edge between them
        for (let q = 0; q < 2; q++) {
          const d = dr[q], a0 = W(s * 2.2, d[0] - d[1] * 0.75, 2.2), a1 = W(s * 2.2, Math.min(d[0] + d[1] * 0.75, 7.8), 2.2), yb = q ? -0.3 : 1.2 - 0.9 * hsh(bi * 23 + s);
          furQuad([a0[0], a0[2]], [a1[0], a1[2]], yb, a0[1] + 0.9, 0, 0.75);
        }
        { const cv = -1.6 + 2.2 * hsh(bi * 37 + s), a0 = W(s * 2.15, cv, 3.6), a1 = W(s * 2.15, cv + 2.4, 3.6); furQuad([a0[0], a0[2]], [a1[0], a1[2]], a0[1] - 1.2 - 1.2 * hsh(bi * 41 + s), a0[1] + 0.7, 0, 0.75); }
        const g0 = -7.4 + 3 * hsh(bi * 3 + s), g1 = g0 + 6.5 + 3 * hsh(bi * 7 + s);
        vineSpans.push([W(s * 2.05, g0, 4.3), W(s * 2.05, Math.min(g1, 7.8), 4.2)]);                   // a garland of flowering vine along each roof edge
      }
      for (const e of [-1, 1]) {
        const V = e * 9;
        sg.quad(W(-1.25, V, -0.6), W(1.25, V, -0.6), W(1.25, V, 1.25), W(-1.25, V, 1.25), foot, low); sg.quad(W(-1.25, V, 1.25), W(1.25, V, 1.25), W(1.25, V, 1.9), W(-1.25, V, 1.9), low, bc);
        sg.quad(W(-1.25, V, 1.9), W(1.25, V, 1.9), W(1.25, V, 3.6), W(-1.25, V, 3.6), sockMid, sockLow); sg.quad(W(-1.25, V, 3.6), W(1.25, V, 3.6), W(1.25, V, 4.4), W(-1.25, V, 4.4), bc, top);
        sg.quad(W(-1.9, e * 7.9, 4.4), W(1.9, e * 7.9, 4.4), W(1.25, V, 4.4), W(-1.25, V, 4.4), mossDk);
      }
      sg.quad(W(-1.9, -7.9, 4.4), W(1.9, -7.9, 4.4), W(1.9, 7.9, 4.4), W(-1.9, 7.9, 4.4), mossDk);     // (the roof itself is under the dome)
      // the dome: three rough mounds along the roof, a lumpy ridge 5 to 6 m up that overhangs both walls
      [[-5.5, 2.6, 1.5, 4.2], [0, 2.4, 1.3, 3.6], [5.5, 2.5, 1.6, 4.0]].forEach(([sv, rx, ry, rz], q) => {
        const c = W((hsh(bi * 83 + q) - 0.5) * 0.7, sv + (hsh(bi * 89 + q) - 0.5) * 1.2, 4.1);
        addBlobN(c[0], c[1], c[2], rx, ry * (0.9 + 0.3 * hsh(bi * 97 + q)), rz, domeC[(bi * 2 + q) % 5], rot);
      });
      // shrubs standing on the ridge, in two ragged lengths
      for (let q = 0; q < 2; q++) { const c0 = W(0.2, -7.2 + q * 7.6 + 1.2 * hsh(bi * 17 + q), 5.1), c1 = W(-0.2, -2.4 + q * 7.6 + 1.6 * hsh(bi * 19 + q), 5.1); furQuad([c0[0], c0[2]], [c1[0], c1[2]], c0[1] - 0.2, c0[1] + 1.0 + 0.6 * hsh(bi * 29 + q), 1, 0.8); }
      // the two ends rounded off under kudzu, and sedge standing along the waterline all round: no ruler-straight foot
      for (const e of [-1, 1]) { const c = W(0, e * 8.5, 1.7); addBlobN(c[0], c[1], c[2], 2.0, 2.1 + 0.4 * hsh(bi * 107 + e), 1.3, domeC[(bi + (e > 0 ? 1 : 3)) % 5], rot); }
      for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) {
        const v0 = -8.6 + k * 3.5 + 0.8 * hsh(bi * 109 + k + sd), v1 = Math.min(v0 + 2.4 + 0.9 * hsh(bi * 113 + k + sd), 8.8), a0 = W(sd * 2.12, v0, 0.3), a1 = W(sd * 2.12, v1, 0.3);
        furQuad([a0[0], a0[2]], [a1[0], a1[2]], -0.12, 0.45 + 0.6 * hsh(bi * 127 + k + sd), 2, 0.8);
      }
      for (const sv of [-7, -3.5, 0, 3.5, 7]) { const q = W(0, sv, 0); obst.push([q[0], q[2], 3.6]); }
      const tp = W(rng.range(-0.5, 0.5), rng.range(-3, 3), 3.2); treePts.push({ x: tp[0], y: tp[1], z: tp[2], s: rng.range(0.4, 0.55), rot: rng.range(0, TAU), v: 3 + (bi % 2), d: 0, u: 0 });
      for (let k = 0; k < 6; k++) { const fu = rng.range(-1.5, 1.5), f = W(fu, rng.range(-8, 8), Math.abs(fu) < 0.8 ? 5.3 : 4.8); fernPts.push({ x: f[0], y: f[1], z: f[2], s: rng.range(1.1, 2.0), rot: rng.range(0, TAU), v: k % 2, d: 0, u: 0 }); }
      await ctx.yield();
    }
    for (let i = 0, made = 0; made < 34 && i < 200; i++) {
      let x = rng.range(-28, 28); const z = rng.range(-30, 620), rot = rng.range(-0.5, 0.5);
      if (z > 545 && Math.abs(x) < 12) x = (x < 0 ? -1 : 1) * (12 + Math.abs(x));        // nothing on the entry axis behind the entry: the camera of the previous portal stands there
      if (path.nearestXZ(x, z).dist < 9 || (x > -36 && x < 22 && z > 14 && z < 68)) continue;
      const ux = Math.cos(rot), uz = -Math.sin(rot), cc = rng.pick(busC);
      // a rounded hull and cabin (ten-sided), the glass band dark, the bonnet and roof under moss
      const ch = cc.clone().multiplyScalar(0.6).lerp(mossDk, 0.4); sg.prism(x, z, ux, uz, 1.0, 2.35, -0.4, 0.5, concDk, ch, 10); sg.prism(x, z, ux, uz, 1.0, 2.35, 0.5, 0.95, ch, ch.clone().lerp(roofC, 0.5), 10);
      sg.prism(x + uz * 0.2, z + ux * -0.2, ux, uz, 0.84, 1.2, 0.95, 1.5, sockMid, sockLow, 10);
      sg.box(x, z, ux, uz, 0.7, 1.66, 0.9, 0.95, roofC, roofC); sg.box(x + uz * 0.2, z + ux * -0.2, ux, uz, 0.6, 0.85, 1.45, 1.5, roofC, roofC);
      // kudzu: a rough mound over the hull (one car in three keeps its cabin clear), a second lobe over the bonnet, curtains down the flanks, ferns
      const bx = x + rng.range(-0.3, 0.3), bz = z + rng.range(-0.8, 0.8), bl = rng.range(1.6, 2.6), bcol = rng.pick(greens), vx = -uz, vz = ux, e = made % 2 ? 1 : -1;
      if (made % 3 !== 1) addBlobN(bx, 0.55, bz, 1.6, 1.05, bl + 0.5, bcol, rot);
      else { addBlobN(x + vx * 1.55 * e + ux * 0.3, 0.5, z + vz * 1.55 * e + uz * 0.3, 1.0, 0.62, 1.15, greens[(made * 3) % 5], rot + 0.5); addBlobN(x, 0.3, z, 1.5, 0.72, 2.75, bcol, rot); }
      for (const sd of [-1, 1]) {
        const v0 = -2.0 + 0.9 * hsh(made * 7 + sd), v1 = 2.0 - 0.9 * hsh(made * 11 + sd), y1 = made % 3 === 1 ? 1.52 : 1.0, un = sd * (made % 3 === 1 ? 0.88 : 1.04);
        furQuad([x + ux * un + vx * v0, z + uz * un + vz * v0], [x + ux * un + vx * v1, z + uz * un + vz * v1], -0.1, y1, 0, 0.7);
        furQuad([x - ux * 0.85 + vx * 2.36 * sd, z - uz * 0.85 + vz * 2.36 * sd], [x + ux * 0.85 + vx * 2.36 * sd, z + uz * 0.85 + vz * 2.36 * sd], -0.1, 0.98, 0, 0.7);
      }
      for (let k = 0; k < 2; k++) { const fu = (hsh(made * 19 + k) - 0.5) * 1.3, fv = (hsh(made * 23 + k) - 0.5) * 3.8; fernPts.push({ x: x + ux * fu + vx * fv, y: Math.abs(fv - 0.2) < 0.8 ? 1.5 : 0.95, z: z + uz * fu + vz * fv, s: 0.8 + 0.6 * hsh(made * 29 + k), rot: hsh(made * 31 + k) * TAU, v: k % 2, d: 0, u: 0 }); }
      carAt.push([x, z, rot]); obst.push([x, z, 3.1]); made++;
    }
    await ctx.yield();

    // ---- the bridge end (see BRIDGE at the head of the file): pier, hammerhead, a sloping stub of deck with its far parapet and two
    // stumps of the near one, a jagged tip, kudzu over its landward end, creeper and shrubs. Its own hash: no draws from the rng. ----
    {
      const A = BRIDGE.a, B = BRIDGE.b, hw = BRIDGE.hw, [px, pz] = BRIDGE.pier, zc = A[2], warm = C('#b8ae98'), dkEdge = concDk.clone().lerp(mossDk, 0.3);
      sg.prism(px, pz, 1, 0, 1.7, 2.3, -1.5, 4.6, mossDk, moss.clone().lerp(conc, 0.5), 12); sg.prism(px, pz, 1, 0, 1.7, 2.3, 4.6, 6.4, moss.clone().lerp(conc, 0.5), conc, 12);
      sg.box(px, pz, 0, 1, 3.2, 1.8, 6.4, bridgeY(px) - 1.5, warm, moss, concDk);
      sg.beam(A, B, hw, 1.5, warm, moss);                                                               // the stub of deck
      sg.beam([A[0], A[1] + 1.05, zc - hw + 0.2], [-12.5, bridgeY(-12.5) + 1.05, zc - hw + 0.2], 0.2, 1.05, conc, moss);      // the far parapet, broken off short of the tip
      sg.beam([A[0], A[1] + 1.05, zc + hw - 0.2], [-19.8, bridgeY(-19.8) + 1.0, zc + hw - 0.2], 0.2, 1.05, conc, moss);      // two stumps of the near one
      sg.beam([-17.6, bridgeY(-17.6) + 0.5, zc + hw - 0.2], [-16.4, bridgeY(-16.4) + 0.35, zc + hw - 0.2], 0.2, 0.5, conc, moss);
      sg.beam([B[0] - 0.2, B[1] - 0.1, zc - 2.3], [B[0] + 0.9, B[1] - 0.6, zc - 2.5], 0.55, 0.7, dkEdge, moss);             // the break: ribs of the girder standing out past the slab
      sg.beam([B[0] - 0.2, B[1] - 0.15, zc + 1.9], [B[0] + 0.7, B[1] - 0.45, zc + 2.0], 0.8, 0.9, dkEdge, moss);
      sg.beam([B[0] - 0.1, B[1] - 0.6, zc - 0.2], [B[0] + 0.5, B[1] - 1.1, zc - 0.3], 0.3, 0.5, rust, rust);
      // kudzu over the landward end and down its cut face, a mound at the pier's foot, creeper hanging from the soffit, shrubs on the far parapet
      addBlobN(A[0] - 0.4, A[1] + 0.2, zc + 0.3, 2.6, 1.9, 4.1, domeC[1], 0); addBlobN(A[0] + 0.3, A[1] - 2.2, zc - 1.6, 1.5, 2.6, 2.4, domeC[3], 0.4);
      addBlobN(px - 0.6, 0.2, pz + 0.4, 3.1, 1.3, 3.6, domeC[2], 0.3);
      furQuad([A[0] - 0.9, zc - hw], [A[0] - 0.9, zc + hw], A[1] - 5.5, A[1] + 0.3, 0, 0.7);
      furQuad([A[0] + 0.5, zc + hw + 0.05], [A[0] + 4.6, zc + hw + 0.05], A[1] - 3.4, A[1] + 0.5, 0, 0.9);
      for (let k = 0; k < 3; k++) { const x0 = A[0] + 1 + k * 3.4 + hsh(k + 900), x1 = x0 + 2 + 1.4 * hsh(k + 910); furQuad([x0, zc - hw + 0.2], [x1, zc - hw + 0.2], bridgeY(x0) + 0.9, bridgeY(x0) + 1.9 + 0.9 * hsh(k + 920), 1, 0.9); }
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; furQuad([px + Math.cos(a) * 1.75, pz + Math.sin(a) * 2.35], [px + Math.cos(a + 0.8) * 1.75, pz + Math.sin(a + 0.8) * 2.35], -0.12, 0.5 + 0.6 * hsh(k + 930), 2, 0.8); }
      for (let k = 0; k < 7; k++) { const fx2 = A[0] + 1.5 + 9 * hsh(k + 940), fz2 = zc + (k % 2 ? -1 : 1) * (hw - 0.7 - 0.9 * hsh(k + 950)); fernPts.push({ x: fx2, y: bridgeY(fx2) + 0.02, z: fz2, s: 0.9 + 0.8 * hsh(k + 960), rot: hsh(k + 970) * TAU, v: k % 2, d: 0, u: 0 }); }
      treePts.push({ x: A[0] + 1.6, y: bridgeY(A[0] + 1.6) - 0.1, z: zc - 1.9, s: 0.42, rot: 1.3, v: 3, d: 0, u: 0 });      // a fig sapling rooted in the joint
      vineSpans.push([[A[0] + 0.5, A[1] + 1.0, zc + hw - 0.2], [-19.8, bridgeY(-19.8) + 0.9, zc + hw - 0.2]]);
      obst.push([px, pz, 3.6], [B[0] + 1.3, zc - 2.1, 2.2]);
    }
    await ctx.yield();

    // ---- trees and ground plants (kit flora, one shared wind material; shade is baked per instance from the sun mask) ----
    const crowns = [];                                         // [x, z, radius, height] of the thirteen camphor crowns, for their shadows and reflections
    // (each crown is broken into masses of foliage: six rough mounds of leaves round and over the kit tree's own crown, sunlit above and
    // dark beneath, and creeper hanging in short curtains under its rim; their own hash, no draws from the rng)
    const crownC = [C('#587c2f'), C('#6c8a36'), C('#7d9340'), C('#4d742e')].map(nightC);
    const camphor = (x, z, lift = 0) => {
      const s = rng.range(0.92, 1.12) + lift * 0.04; treePts.push({ x, y: 0, z, s, rot: rng.range(0, TAU), v: Math.floor(rng() * 3), d: 0, u: 0 }); crowns.push([x, z, 8.2 * s, 15.5 * s]); obst.push([x, z, 3.0]);
      const R = 8.2 * s, H = 15.5 * s, ci = crowns.length;
      for (let k = 0; k < 6; k++) {
        const top = k === 5, a = (k + 0.8 * hsh(ci * 9.1 + k)) / 5 * TAU, rr2 = top ? 0.1 * R : R * (0.5 + 0.14 * hsh(ci * 5.3 + k * 2.7)), sz = R * (0.43 + 0.13 * hsh(ci * 3.9 + k * 4.1));
        addBlobN(x + Math.cos(a) * rr2, H + (top ? 0.4 * R : (hsh(ci * 7.7 + k) - 0.62) * 0.4 * R), z + Math.sin(a) * rr2, sz * 1.12, sz * 0.74, sz * 1.12, crownC[(ci + k) % 4], a, 6);
      }
      for (let k = 0; k < 2; k++) { const a = hsh(ci * 8.3 + k) * TAU + k * Math.PI; addBlobN(x + Math.cos(a) * R * 0.27, H - 0.3 * R, z + Math.sin(a) * R * 0.27, R * 0.62, R * 0.4, R * 0.62, crownC[(ci + k) % 4].clone().multiplyScalar(0.7), a, 6); }
      for (let k = 0; k < 5; k++) {
        const a = (k + hsh(ci * 4.3 + k)) / 5 * TAU, rr2 = R * 0.74, w = 1.4 + 1.6 * hsh(ci * 2.9 + k), cx = x + Math.cos(a) * rr2, cz = z + Math.sin(a) * rr2, y1 = H - 0.27 * R;
        furQuad([cx + Math.sin(a) * w, cz - Math.cos(a) * w], [cx - Math.sin(a) * w, cz + Math.cos(a) * w], y1 - 2.2 - 2.4 * hsh(ci * 6.1 + k), y1 + 0.6, 0, 0.5);
      }
      // (round 15) six smaller clumps of leaves on the crown's outside, so its outline is clumps and gaps with light and shade on each
      // (on the crowns within 40 m of the way: a rule of distance in the world)
      if (path.nearestXZ(x, z).dist < 40) for (let k = 0; k < 6; k++) {
        const a = (k + 0.8 * hsh(ci * 6.7 + k * 2.3)) / 6 * TAU, e = (0.15 + 1.05 * hsh(ci * 4.9 + k * 3.1)) * 0.9, rr2 = R * 0.9 * Math.cos(e), sz = R * (0.22 + 0.1 * hsh(ci * 2.1 + k * 5.3));
        addBlobN(x + Math.cos(a) * rr2, H - 0.12 * R + R * 0.62 * Math.sin(e), z + Math.sin(a) * rr2, sz * 1.15, sz * 0.8, sz * 1.15, crownC[(ci + k * 3) % 4].clone().multiplyScalar(0.85 + 0.35 * hsh(ci + k * 7.1)), a, 6);
      }
      // and at the waterline: a mossed hummock of root and earth in the old tree pit, buttress roots running down into the flood, sedge
      // standing round it: no trunk stands straight in the water
      addBlobN(x, 0.05, z, 2.7, 0.8, 2.7, greens[(ci * 2) % 5], hsh(ci * 3.3) * TAU);
      for (let k = 0; k < 5; k++) { const a = (k + 0.6 * hsh(ci * 5.1 + k)) / 5 * TAU, l = 2.6 + 1.2 * hsh(ci * 7.3 + k); sg.beam([x + Math.cos(a) * 0.3, 1.5 + 0.5 * hsh(ci + k * 3.7), z + Math.sin(a) * 0.3], [x + Math.cos(a) * l, -0.25, z + Math.sin(a) * l], 0.2, 0.55, barkC, moss); }
      for (let k = 0; k < 6; k++) { const a = (k + hsh(ci * 9.7 + k)) / 6 * TAU, w = 0.9 + 0.8 * hsh(ci * 1.9 + k), cx = x + Math.cos(a) * 2.8, cz = z + Math.sin(a) * 2.8; furQuad([cx + Math.sin(a) * w, cz - Math.cos(a) * w], [cx - Math.sin(a) * w, cz + Math.cos(a) * w], -0.12, 0.6 + 0.6 * hsh(ci * 6.3 + k), 2, 0.8); }
    };
    for (const z of [468, 418, 362, 318, 242, 188, 140, 104]) camphor(22, z);
    camphor(-27, 356); for (const z of [216, 168]) camphor(-25, z);      // (the first of the three stood at z 392, in the crane's left edge)
    camphor(35, 522, 4); camphor(-35, 496, 4);                // the first two stand back on the pavements, clear of the opening view
    for (let i = 0; i < 26; i++) { const tp = { x: rng.range(-240, -112), y: 0.6, z: rng.range(-50, 255), s: rng.range(0.9, 1.5), rot: rng.range(0, TAU), v: 3 + (i % 2), d: 0, u: 0 }; if (i % 4 !== 3 || tp.x > -150) treePts.push(tp); }
    for (const [lx, lz] of [[-44, 118], [40, 48], [-70, 31]]) {  // three willows trailing in the pond, each on a mossed hummock
      const w = toWorld(lx, 0.25, lz); treePts.push({ x: w[0], y: 0.25, z: w[2], s: rng.range(1.3, 1.55), rot: rng.range(0, TAU), v: 5 + (treePts.length % 2), d: 0, u: 0 });
      addBlobN(w[0], -0.3, w[2], 3.4, 0.9, 3.4, C('#4c7630'), 0); obst.push([w[0], w[2], 4.2]);
    }
    await ctx.yield();
    const bambooPts = [], nb = Math.round(120 * Math.min(1.2, density));
    const bamboo = (x, y, z) => bambooPts.push({ x, y, z, s: rng.range(1.5, 2.15), rot: rng.range(0, TAU), v: Math.floor(rng() * 2), d: path.nearestXZ(x, z).dist, u: 0 });
    for (let i = 0; i < nb; i++) bamboo(rng.range(-108, -46), 5, rng.range(331, 455));
    await ctx.yield();
    for (let i = 0; i < 92; i++) bamboo(rng.range(-104, -62), 0.6, rng.range(-50, 250));
    { const xr = makeRng('bamboo-more:' + ctx.seed); for (let i = 0; i < 16; i++) { const x = xr.range(-104, -46), z = xr.range(331, 398); bambooPts.push({ x, y: 5, z, s: xr.range(1.5, 2.15), rot: xr.range(0, TAU), v: Math.floor(xr() * 2), d: path.nearestXZ(x, z).dist, u: 0 }); } }
    await ctx.yield();
    // sedge and reed along both kerbs, at the feet of the monorail piers and round the pond
    for (let i = 0; i < 130; i++) { const s = i % 2 ? 1 : -1, z = rng.range(-38, 640); if (s < 0 && z < 257 && z > 100) continue; reedPts.push({ x: s * rng.range(28.6, 30.4), y: -0.1, z, s: rng.range(1.2, 2.2), rot: rng.range(0, TAU), v: i % 3, d: 0, u: 0 }); }
    for (let i = 0; i < 56; i++) {
      const a = rng.range(0, TAU), k = rng.range(0.92, 1.12), w = toWorld(Math.cos(a) * 78 * k, -0.1, 60 + Math.sin(a) * 68 * k);
      if (path.nearestXZ(w[0], w[2]).dist < 16) continue;
      reedPts.push({ x: w[0], y: -0.1, z: w[2], s: rng.range(1.3, 2.4), rot: rng.range(0, TAU), v: i % 3, d: 0, u: 0 });
    }
    for (let i = 0; i < 30; i++) { const a = rng.range(0, TAU), x = Math.cos(a) * 30, z = Math.sin(a) * 9; fernPts.push({ x: -7 + (Math.abs(x) > 24 ? Math.sign(x) * 24.75 : x), y: rng.range(-2.6, -0.4), z: 55 + (Math.abs(x) > 24 ? z * 0.7 : Math.sign(z || 1) * 6.75), s: rng.range(1.2, 2.2), rot: rng.range(0, TAU), v: i % 2, d: 0, u: 0 }); }   // ferns on the court walls
    for (let i = 0; i < 40; i++) { const s = i % 2 ? 1 : -1; fernPts.push({ x: s * rng.range(30.2, 31.4), y: 0.16, z: rng.range(260, 640), s: rng.range(0.9, 1.7), rot: rng.range(0, TAU), v: i % 2, d: 0, u: 0 }); }
    await ctx.yield();

    // leaf blobs. Far ones (trees on the towers, crowns on the far ranks) are 80 triangles each; the nine hills keep 320 for their outline.
    const ballGeo = (detail) => {
      const g = new THREE.IcosahedronGeometry(1, detail), bp = g.getAttribute('position'), bn = g.getAttribute('normal');
      for (let i = 0; i < bp.count; i++) {
        const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.2 * ctx.noise.n3(x * 1.6 + 5, y * 1.6, z * 1.6) + 0.09 * ctx.noise.n3(x * 4, y * 4 + 9, z * 4);
        bp.setXYZ(i, x * k, y * k, z * k); bn.setXYZ(i, x, y, z);
      }
      return g;
    };
    const dm = new THREE.Object3D(), dc = new THREE.Color();
    const blobSet = (geo, list, flag, name) => {
      const m = new THREE.InstancedMesh(geo, M.blob, Math.max(1, list.length));
      list.forEach((b, i) => {
        dm.position.set(b[0], b[1], b[2]); dm.scale.set(b[3], b[4], b[5]); dm.rotation.set(0, b[6], 0); dm.updateMatrix(); m.setMatrixAt(i, dm.matrix);
        const f = flag(b); dc.setRGB(b[7] + f, b[8] + f, b[9] + f); m.setColorAt(i, dc);
      });
      m.count = list.length; m.frustumCulled = false; m.name = name; scene.add(m);
    };
    blobSet(ballGeo(2), blobs.filter((b) => b[3] > 90), (b) => b[10] * 2, 'hills');
    await ctx.yield();
    blobSet(ballGeo(1), blobs.filter((b) => b[3] <= 90), (b) => b[10] * 2, 'green');
    await ctx.yield();
    // the mounds near the path: a real silhouette (two octaves of lumps, a flattened underside) and the normals of that shape, not of a ball.
    // The masses of foliage in the camphors' crowns are the same shape at 80 triangles: their outline is broken up in the shader.
    const dA = [0, 0, 0], dB = [0, 0, 0], dC = [0, 0, 0];
    const lump = (x, y, z, o) => { const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l; const k = 1 + 0.42 * ctx.noise.n3(x * 1.7 + 5, y * 1.7, z * 1.7) + 0.2 * ctx.noise.n3(x * 5, y * 5 + 9, z * 5); o[0] = x * k; o[1] = (y < 0 ? y * 0.4 : y) * k; o[2] = z * k; };
    const lumpGeo = (detail) => {
      const g = new THREE.IcosahedronGeometry(1, detail), np = g.getAttribute('position'), nn = g.getAttribute('normal');
      for (let i = 0; i < np.count; i++) {
        const x = np.getX(i), y = np.getY(i), z = np.getZ(i), ax = Math.abs(y) > 0.9 ? [1, 0, 0] : [0, 1, 0];
        let t1 = [y * ax[2] - z * ax[1], z * ax[0] - x * ax[2], x * ax[1] - y * ax[0]]; const tl = Math.hypot(t1[0], t1[1], t1[2]) || 1; t1 = [t1[0] / tl, t1[1] / tl, t1[2] / tl];
        const t2 = [y * t1[2] - z * t1[1], z * t1[0] - x * t1[2], x * t1[1] - y * t1[0]], h = 0.06;
        lump(x, y, z, dA); lump(x + t1[0] * h, y + t1[1] * h, z + t1[2] * h, dB); lump(x + t2[0] * h, y + t2[1] * h, z + t2[2] * h, dC);
        const e1 = [dB[0] - dA[0], dB[1] - dA[1], dB[2] - dA[2]], e2 = [dC[0] - dA[0], dC[1] - dA[1], dC[2] - dA[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0]; const sg2 = nx * x + ny * y + nz * z < 0 ? -1 : 1, nl = Math.hypot(nx, ny, nz) || 1;
        np.setXYZ(i, dA[0], dA[1], dA[2]); nn.setXYZ(i, sg2 * nx / nl, sg2 * ny / nl, sg2 * nz / nl);
      }
      return g;
    };
    const ngeo = lumpGeo(2);
    await ctx.yield();
    // (a mound under 1.7 m across, or more than 20 m from the way, is the same shape at 80 triangles: a rule of size and distance in the world)
    const lgeo1 = lumpGeo(1), nearN = (b) => Math.max(b[3], b[5]) >= 1.7 && path.nearestXZ(b[0], b[2]).dist <= 20;
    blobSet(ngeo, blobsN.filter((b) => b[10] !== 6 && nearN(b)), (b) => b[10], 'mounds');
    await ctx.yield();
    // (and one under 1.3 m across, or more than 45 m from the way, at 20)
    const farN = (b) => Math.max(b[3], b[5]) < 1.3 || path.nearestXZ(b[0], b[2]).dist > 45;
    blobSet(lgeo1, blobsN.filter((b) => b[10] !== 6 && !nearN(b) && !farN(b)), (b) => b[10], 'mounds-mid');
    await ctx.yield();
    blobSet(lumpGeo(0), blobsN.filter((b) => b[10] !== 6 && !nearN(b) && farN(b)), (b) => b[10], 'mounds-far');
    await ctx.yield();
    blobSet(lgeo1, blobsN.filter((b) => b[10] === 6), (b) => b[10], 'crowns');
    await ctx.yield();
    const towers = new THREE.Mesh(await buildGB(ctx, tg), M.tower); towers.frustumCulled = false; towers.name = 'towers'; scene.add(towers);
    await ctx.yield();
    const street = new THREE.Mesh(await buildGB(ctx, sg), M.concrete); street.frustumCulled = false; street.name = 'street'; scene.add(street);
    {
      // the flipped copies (see FB): buses, cars, gantries, lamp posts, signal masts, shelter frames, the dropped beam, its sunk pier and the train
      const fg = new FB(), gC = concDk.clone().lerp(moss, 0.5), gT = moss.clone().lerp(C('#7c9a48'), 0.5), trC = C('#7d8f72'), trT = C('#4f7a34');
      buses.forEach(([x, z, rot], bi) => {
        const ux = Math.cos(rot), uz = -Math.sin(rot), bc = busC[bi % 3].clone().multiplyScalar(0.5).lerp(mossDk, 0.62);
        fg.prism(x, z, ux, uz, 2.7, 11.9, 0, 4.2, bc.clone().multiplyScalar(0.7), bc, 4); fg.prism(x, z, ux, uz, 2.9, 9.2, 3.4, 6.0, domeC[bi % 5], domeC[(bi + 2) % 5], 8, 1.2, 6.2);
      });
      await ctx.yield();
      carAt.forEach(([x, z, rot], k) => { const ux = Math.cos(rot), uz = -Math.sin(rot); fg.prism(x, z, ux, uz, 1.5, 2.9, 0, 1.0, greens[k % 5].clone().lerp(concDk, 0.4), greens[k % 5], 8, 1.3, 2.5); fg.prism(x, z, ux, uz, 1.3, 2.5, 1.0, 1.65, greens[k % 5], greens[(k + 2) % 5], 8, 0.5, 1.1); });
      await ctx.yield();
      GANTRY.forEach((z, gi) => {
        const xj = gi ? -9 : 6, yj = 10.9 - 0.3 * gi;
        fg.post([-33, 0, z], [-33.6, 11, z], 0.35, concDk, moss); fg.post([33, 0, z], [33.4, 11, z], 0.35, concDk, moss);
        fg.beam([-34, 11.8, z], [xj, yj, z], 0.5, 1.1, gC, gT); fg.beam([xj, yj, z + 0.15], [34, 11.4 - 0.5 * gi, z + 0.15], 0.5, 1.1, gC, gT);
        fg.beam([-28, 12.7, z], [xj, yj + 0.9, z], 0.6, 0.9, greens[1], greens[3]); fg.beam([xj, yj + 0.9, z], [30, 12.3 - 0.5 * gi, z], 0.6, 0.9, greens[2], greens[3]);
      });
      for (const [x, z, lean] of lampAt) { fg.post([x, 0, z], [x + lean, 10.5, z + lean * 0.5], 0.17, concDk, moss); fg.beam([x + lean, 10.6, z + lean * 0.5], [x - Math.sign(x) * 3.2 + lean, 10.2, z + lean * 0.5], 0.14, 0.2, moss, moss); }
      for (const [a, top, tip] of mastAt) { fg.post(a, top, 0.2, concDk, moss); fg.beam(top, tip, 0.13, 0.28, moss, mossDk); }
      for (const [sd, z, lean] of shelterAt) {
        for (const dz of [-3.2, 0, 3.2]) { fg.post([sd * 31.3, 0, z + dz], [sd * 31.3 + lean, 2.52, z + dz + lean * 0.4], 0.07, rust, moss); fg.post([sd * 33.3, 0, z + dz], [sd * 33.3 + lean, 2.8, z + dz + lean * 0.4], 0.07, rust, moss); }
        fg.beam([sd * 31.3 + lean, 2.52, z - 3.6], [sd * 31.3 + lean, 2.52, z + 3.6], 0.06, 0.12, rust, moss); fg.beam([sd * 33.3 + lean, 2.8, z - 3.6], [sd * 33.3 + lean, 2.8, z + 3.6], 0.06, 0.12, rust, moss);
      }
      await ctx.yield();
      fg.beam([-46, 25.3, 8], [-2, 16.3, -18], 1.6, 3.3, conc, moss); fg.beam([-2, 16.3, -18], [38, 1.2, -40], 1.6, 3.3, conc, moss);
      fg.prism(-2, -18, 1, 0, 2.0, 2.6, 0, 13, mossDk, conc, 10);
      for (const [a, b] of [[[7, 18.1, -22.9], [20, 13.2, -30.1]], [[21, 12.8, -30.6], [35.5, 6.4, -38.6]]]) fg.beam(a, b, 1.5, 3.2, trC, trT);
      await ctx.yield();
      scene.add(flipOf(M, fg.build()));
      await ctx.yield();
    }
    await ctx.yield();
    {   // the sunk monorail pier: a smooth oval column, a mossed skirt to 5.4 m with a ledge, the pale shaft above (the street's concrete)
      const PP = [], PC = [], PI = [], S = 28, rows = [[-1, 1.95, 2.55, mossDk], [2.2, 1.92, 2.52, mossDk.clone().lerp(moss, 0.5)], [5.25, 1.88, 2.48, moss.clone().lerp(conc, 0.3)], [5.5, 1.62, 2.22, moss.clone().lerp(conc, 0.55)], [9, 1.6, 2.2, conc.clone().lerp(moss, 0.15)], [13, 1.6, 2.2, conc]];
      for (const [y, ru, rv, c] of rows) for (let k = 0; k < S; k++) { const a = k / S * TAU; PP.push(-2 + Math.cos(a) * ru, y, -18 + Math.sin(a) * rv); PC.push(c.r, c.g, c.b); }
      for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < S; k++) { const a = r * S + k, b = r * S + (k + 1) % S, c = a + S, d = b + S; PI.push(a, c, b, b, c, d); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(PC, 3)); pg.setIndex(PI); pg.computeVertexNormals();
      const pier = new THREE.Mesh(pg, M.concrete); pier.name = 'sunk-pier'; scene.add(pier);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(furP, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(furU, 2));
    fg.setAttribute('aInfo', new THREE.Float32BufferAttribute(furI, 4)); fg.setIndex(furX);
    const furMesh = new THREE.Mesh(fg, M.fur); furMesh.frustumCulled = false; furMesh.name = 'fur'; scene.add(furMesh);
    await ctx.yield();
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), M.water);
    sheet.position.set(100, 0, -900); sheet.frustumCulled = false; sheet.renderOrder = -0.4; sheet.name = 'mirror'; scene.add(sheet);
    const poolGeo = new THREE.BufferGeometry();
    poolGeo.setAttribute('position', new THREE.Float32BufferAttribute([-32, -11.4, 48, 18, -11.4, 48, 18, -11.4, 62, -32, -11.4, 62, -2, -11.4, 20, 14, -11.4, 20, 14, -11.4, 48, -2, -11.4, 48], 3));
    poolGeo.setIndex([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]); poolGeo.computeVertexNormals();
    const poolMesh = new THREE.Mesh(poolGeo, M.pool); poolMesh.material.side = THREE.DoubleSide; poolMesh.name = 'court-pool'; scene.add(poolMesh);
    const slateMesh = new THREE.Mesh(new THREE.CylinderGeometry(2600, 2600, 2600, 48, 1, true, 2.836 - 1.5, 3.0), M.slate);
    slateMesh.frustumCulled = false; slateMesh.renderOrder = -0.5; slateMesh.name = 'slate-wall'; scene.add(slateMesh);
    await ctx.yield();
    // tram wire and power lines across the boulevard at z 330, 300 and 250: ribbons that widen with distance so they never drop under 1.5 px
    const wp = [], wsd = [], wix = [];
    for (const z of [330, 300, 250]) for (let i = 0; i < 16; i++) {
      const sag = (x) => 12.6 - 1.6 * (1 - (x / 42) * (x / 42)), xa = -42 + i * 5.25, xb = xa + 5.25, o = wp.length / 3;
      wp.push(xa, sag(xa), z, xb, sag(xb), z, xb, sag(xb), z, xa, sag(xa), z); wsd.push(-1, -1, 1, 1); wix.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    const wireGeo = new THREE.BufferGeometry(); wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wireGeo.setAttribute('aS', new THREE.Float32BufferAttribute(wsd, 1)); wireGeo.setIndex(wix);
    const wires = new THREE.Mesh(wireGeo, new THREE.ShaderMaterial({
      // (round 15: each wire is the rope of a garland: thicker, mossed, its upper side catching the light, wisteria hanging from it in
      // bunches, see wire-garlands further down; never a black hairline across the sky)
      fog: true, side: THREE.DoubleSide, uniforms: { ...M.fogU(), ...M.shared },
      vertexShader: /* glsl */`
        attribute float aS; varying float vS; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vS = aS; w.y += aS * max(0.13, 0.0032 * distance(cameraPosition, w.xyz));
          vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        varying float vS; varying vec3 vW;
        #include <fog_pars_fragment>
        void main(){
          float n = vn(vec2(vW.x * 1.7, vW.z * 0.3)), tuft = smoothstep(0.35, 0.7, n);
          vec3 alb = mix(vec3(0.2, 0.17, 0.12), vec3(0.2, 0.31, 0.1), tuft) * (0.75 + 0.5 * vn(vec2(vW.x * 9.0, vW.z)));
          gl_FragColor = vec4(folTint(alb) * (uAmbCol * (0.75 + 0.25 * vS) + uSunCol * (0.2 + 0.6 * max(vS, 0.0)) * sunLane(vW)), 1.0);
          #include <fog_fragment>
        }`,
    }));
    wires.frustumCulled = false; wires.name = 'wires'; scene.add(wires);
    // the bridge's stays: one veiled triangle per fan, the cables drawn in the fragment shader and melting to their mean when they get finer than a pixel
    const stayGeo = new THREE.BufferGeometry(); stayGeo.setAttribute('position', new THREE.Float32BufferAttribute(stayP, 3)); stayGeo.setAttribute('uv', new THREE.Float32BufferAttribute(stayU, 2)); stayGeo.setIndex(stayI);
    const stays = new THREE.Mesh(stayGeo, new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...M.fogU(), ...M.shared },
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
          vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        ${GLSL_COMMON}
        varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_fragment>
        ${FOG_FAR}
        void main(){
          float sN = vUv.x / max(vUv.y, 1e-3) * 14.0, fw = min(fwidth(sN), 4.0) + 1e-4, d = abs(fract(sN) - 0.5);
          float a = mix(clamp((0.09 + fw * 0.5 - d) / fw, 0.0, 1.0), 0.18, smoothstep(0.35, 0.9, fw)) * smoothstep(0.0, 0.04, vUv.y);
          gl_FragColor = vec4(fogFar(uAmbCol * 2.0 + uSunCol * 1.6, vW, length(cameraPosition - vW)), a * 0.85);
        }`,
    }));
    stays.frustumCulled = false; stays.renderOrder = 1; stays.name = 'bridge-stays'; scene.add(stays);
    await ctx.yield();

    const wind = flora.makeWind({ direction: [0.25, -1], strength: 0.75 + 0.6 * mood });
    await ctx.yield();
    await flora.prepareLeafTexture({ size: 256 }, ctx.yield, 4);   // the kit's stepped painter: the same pixels as makeLeafTexture draws in one piece, kept for the call below
    await ctx.yield();
    const leafMap = flora.makeLeafTexture({ size: 256 });      // (no pixel work left here; the kit's 1024 px atlas is one step of 50 to 120 ms and 512 px still 22 to 37 ms)
    await ctx.yield();
    const fmat = flora.windMaterial({ wind, map: leafMap, ambient: 3.0, leafAmbient: 2.3 });
    await ctx.yield();
    const fr = rng.fork('flora'), treeVar = [], bamNear = [], bamFar = [];
    // (a workaround kept in this file: under every clump of leaf cards the kit's broadleaf crown has a smooth dark core, and a few metres
    // from the eye those cores read as plain ellipsoids. Each core, twenty triangles on twelve vertices of its own, is drawn in to 0.7
    // of its size and mottled, so the leaf sprays and this world's own masses of foliage make every outline. No draws from any rng.)
    // (in this version the cores are drawn in to 0.36, out of sight under the sprays; and the leaf cards that follow each core, a metre
    // and a half across, are drawn in to 0.58 of their size and each is given a twin turned about the core, so that a 20 m tree carries
    // sprays of small leaves, twice as many, and no smooth face reaches its outline or shows from beneath)
    const breakCores = (g) => {
      const ix = g.index.array, P = g.attributes.position.array, K = g.attributes.color.array, UV = g.attributes.uv.array, use = new Uint8Array(12), cards = [];
      let core = null;
      for (let t = 0; t < ix.length;) {
        if (core && t + 6 <= ix.length) {
          const a = ix[t];
          if (ix[t + 1] === a + 1 && ix[t + 2] === a + 2 && ix[t + 3] === a && ix[t + 4] === a + 2 && ix[t + 5] === a + 3 && UV[a * 2] < 0.26 && UV[a * 2 + 1] < 0.5) { cards.push(a, core[0], core[1], core[2]); t += 6; continue; }
        }
        if (t + 60 > ix.length) { t += 3; continue; }
        let lo = 1e9, hi = -1; for (let k = 0; k < 60; k++) { const v = ix[t + k]; if (v < lo) lo = v; if (v > hi) hi = v; }
        let ok = hi - lo === 11;
        if (ok) { use.fill(0); for (let k = 0; k < 60; k++) use[ix[t + k] - lo]++; for (let k = 0; k < 12; k++) if (use[k] !== 5) ok = false; }
        if (!ok) { t += 3; continue; }
        let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 12; k++) { const j = (lo + k) * 3; cx += P[j] / 12; cy += P[j + 1] / 12; cz += P[j + 2] / 12; }
        for (let k = 0; k < 12; k++) {
          const j = (lo + k) * 3, m = (0.7 + 0.65 * hsh(lo * 0.37 + k * 1.91)) * 0.8;
          P[j] = cx + (P[j] - cx) * 0.36; P[j + 1] = cy + (P[j + 1] - cy) * 0.36; P[j + 2] = cz + (P[j + 2] - cz) * 0.36;
          K[j] *= m; K[j + 1] *= m; K[j + 2] *= m;
        }
        core = [cx, cy, cz];
        t += 60;
      }
      const nc = cards.length / 4, nv = g.attributes.position.count;
      if (!nc) return g;
      const out = {}, names = ['position', 'normal', 'color', 'wind', 'uv'];
      for (const nm of names) { const a = g.attributes[nm]; out[nm] = new Float32Array((nv + nc * 4) * a.itemSize); out[nm].set(a.array); }
      const nix = new (nv + nc * 4 > 65535 ? Uint32Array : Uint16Array)(ix.length + nc * 6); nix.set(ix);
      for (let q = 0; q < nc; q++) {
        const a = cards[q * 4], cx = cards[q * 4 + 1], cy = cards[q * 4 + 2], cz = cards[q * 4 + 3], b = nv + q * 4, OP = out.position, ON = out.normal;
        let mx = 0, my = 0, mz = 0; for (let k = 0; k < 4; k++) { mx += OP[(a + k) * 3] / 4; my += OP[(a + k) * 3 + 1] / 4; mz += OP[(a + k) * 3 + 2] / 4; }
        const ang = 0.9 + 1.9 * hsh(a * 0.173 + 5), ca = Math.cos(ang), sa = Math.sin(ang), rk = 0.86 + 0.3 * hsh(a * 0.311 + 9), dy = (hsh(a * 0.57 + 2) - 0.5) * 0.5;
        for (let k = 0; k < 4; k++) {
          const j = (a + k) * 3, j2 = (b + k) * 3;
          OP[j] = mx + (OP[j] - mx) * 0.58; OP[j + 1] = my + (OP[j + 1] - my) * 0.58; OP[j + 2] = mz + (OP[j + 2] - mz) * 0.58;
          const rx = (OP[j] - cx) * rk, rz = (OP[j + 2] - cz) * rk;
          OP[j2] = cx + rx * ca + rz * sa; OP[j2 + 1] = OP[j + 1] + dy; OP[j2 + 2] = cz + rz * ca - rx * sa;
          ON[j2] = ON[j] * ca + ON[j + 2] * sa; ON[j2 + 1] = ON[j + 1]; ON[j2 + 2] = ON[j + 2] * ca - ON[j] * sa;
          for (const nm of ['color', 'wind', 'uv']) { const sz = g.attributes[nm].itemSize; for (let e = 0; e < sz; e++) out[nm][(b + k) * sz + e] = out[nm][(a + k) * sz + e]; }
        }
        nix.set([b, b + 1, b + 2, b, b + 2, b + 3], ix.length + q * 6);
      }
      for (const nm of names) g.setAttribute(nm, new THREE.BufferAttribute(out[nm], g.attributes[nm].itemSize));
      g.setIndex(new THREE.BufferAttribute(nix, 1));
      return g;
    };
    for (let i = 0; i < 3; i++) { treeVar.push(breakCores(flora.oakGeometry({ rng: fr, detail: 1, height: 21, fullness: 1.05, leaf: '#5d8a34', leafLight: '#b9c25e', leafDark: '#345a28', bark: '#7a6a58', barkDark: '#5a4c40' }))); await ctx.yield(); }   // camphors in bronze-green flush
    for (let i = 0; i < 2; i++) { treeVar.push(flora.oakGeometry({ rng: fr, detail: 0, height: 13 })); await ctx.yield(); }
    await ctx.yield();
    flora.willowGeometry({ rng: makeRng('willow-warm'), detail: 0, height: 12 }).dispose();      // the kit function's cold start, on an rng of its own, out of the next step
    await ctx.yield();
    for (let i = 0; i < 2; i++) { treeVar.push(flora.willowGeometry({ rng: fr, detail: 1, height: 12 })); await ctx.yield(); }      // (a detail 2 willow is one step of 20 to 60 ms)
    const boulevard = (x, z) => Math.abs(x) < 43 || z < -60, leafK = golden ? [1.5, 1.38, 1.05] : night ? [0.72, 0.82, 1.4] : dawn ? [1.2, 1.2, 1.15] : [1.3, 1.34, 1.15], nk = night ? [0.72, 0.76, 1.3] : [1, 1, 1], nkT = (t) => [t[0] * nk[0], t[1] * nk[1], t[2] * nk[2]];     // crowns stand in the light: never dark cut-outs against the towers
    const trees = flora.makeScatter({ rng: fr, variants: treeVar, points: treePts, material: fmat, sink: 0.02, tilt: 0.03, groundColor: (x, z, y) => { const t = boulevard(x, z) ? tintAt(x, y + 12, z) : [1, 1, 1]; return [t[0] * leafK[0], t[1] * leafK[1], t[2] * leafK[2]]; } });
    trees.object.name = 'trees'; scene.add(trees.object);
    await ctx.yield();
    for (let i = 0; i < 2; i++) { bamNear.push(flora.bambooGeometry({ rng: fr, detail: 1, height: 13 })); await ctx.yield(); }
    for (let i = 0; i < 2; i++) { bamFar.push(flora.bambooGeometry({ rng: fr, detail: 0, height: 13 })); await ctx.yield(); }
    await ctx.yield();
    const bambooS = flora.makeScatter({ rng: makeRng('bamboo:' + ctx.seed), variants: bamNear, farVariants: bamFar, farDistance: 30, points: bambooPts.filter((p, i) => !(p.d > 80 && i % 2 === 0) && !(p.d > 50 && i % 7 === 3)), material: fmat, sink: 0.01, ...(night ? { groundColor: () => nk } : {}) });      // (the bamboo's own stream: the reeds, ferns, vines and grass that follow in fr are dealt anew once against live)
    bambooS.object.name = 'bamboo'; scene.add(bambooS.object);
    await ctx.yield();
    const reeds = flora.makeReeds({ rng: fr, points: reedPts, material: fmat, groundColor: (x, z, y) => nkT(tintAt(x, 1.5, z)) });
    reeds.object.name = 'reeds'; scene.add(reeds.object);
    await ctx.yield();
    { const warm = flora.makeFerns({ rng: makeRng('fern-warm'), points: fernPts.slice(0, 2), material: fmat }); warm.object.traverse((o) => o.geometry?.dispose?.()); }      // the kit function's cold start, on an rng of its own, out of the next step
    await ctx.yield();
    const ferns = flora.makeFerns({ rng: fr, points: fernPts, material: fmat, groundColor: (x, z, y) => nkT(y < -0.1 ? [0.6, 0.66, 0.75] : tintAt(x, y + 1, z)) });
    ferns.object.name = 'ferns'; scene.add(ferns.object);
    await ctx.yield();
    for (let k = 0; k < 8; k++) {                              // in eight parts: all the spans at once are one step of nearly 30 ms (the kit draws span by span, so the vines are the same)
      const half = Math.ceil(vineSpans.length / 8), vines = flora.makeVines({ rng: fr, material: fmat, spans: vineSpans.slice(k * half, (k + 1) * half), sag: 0.2, thickness: 0.07, flower: L.fringe });
      vines.object.name = 'vines' + k; vines.object.frustumCulled = false; scene.add(vines.object);
      await ctx.yield();
    }
    {
      const mv = flora.makeVines({ rng: makeRng('mast-vines:' + ctx.seed), material: fmat, spans: vineSpans2, sag: 0.16, thickness: 0.1, stem: '#8a785c', flower: L.fringe });      // (their own rng: the old vines and everything after them stay as they were)
      mv.object.name = 'mast-vines'; mv.object.frustumCulled = false; scene.add(mv.object);
      await ctx.yield();
    }
    const grassOpt = (uRange, material) => ({ rng: fr, path, uRange, radius: 62, bias: 1, heightStep: 5, count: Math.round(1300 * detail * Math.min(1.2, density)), chunks: 2, wind, map: leafMap, material, flowers: 0.03,
      flowerColors: ['#e9e2f6', '#b59ae0', '#f1e9c8'], height: [0.5, 1.1], heightAt: (x) => (x < -42 ? 0.7 : 0.16),
      density: (x, z) => ((x > 30 && x < 42 && z > -10) || (x < -30 && x > -42 && z > 257) ? 1 : x < -42 && x > -62 && z < 257 && z > -60 ? 0.6 : 0),
      groundColor: (x, z) => { const t = nkT(tintAt(x, 0.6, z)); return [0.1 * t[0], 0.17 * t[1], 0.05 * t[2]]; } });
    const grass = await flora.makeGrassAsync(grassOpt([0, 0.2]), ctx.yield, 4);   // the kit's stepped builder: same tufts, same draws, no 30 ms step
    await ctx.yield();
    const grass2 = await flora.makeGrassAsync(grassOpt([0.2, 0.39], grass.material), ctx.yield, 4);
    grass2.object.name = 'grass2'; scene.add(grass2.object);
    await ctx.yield();
    const grass3 = await flora.makeGrassAsync(grassOpt([0.39, 0.58], grass.material), ctx.yield, 4);
    grass3.object.name = 'grass3'; scene.add(grass3.object);
    grass.object.name = 'grass'; scene.add(grass.object);
    await ctx.yield();
    crowns.forEach((c, i) => { if (i < 14) M.water.uniforms.uCrown.value[i].set(c[0], c[1], c[2], c[3]); });

    // ---- the hero ----
    const cream = cast === 'cream';
    const wl = { flower: cream ? '#efe2bd' : '#9a78d8', tip: cream ? '#fffaf0' : '#e6dafa', flower2: '#efe2bd', tip2: '#fffaf0', leaf: cream ? '#7c7a36' : '#6b7a34', sun: L.sunColor, sunK: L.sunK, amb: L.amb, ambK: L.ambK, gust: 0.7 + 0.6 * mood };
    const fallLight = { lit: golden ? '#ffe2c0' : night ? '#c6d6f6' : '#fff6e4', gain: dawn ? 1.9 : night ? 1.15 : 1.6, shade: night ? '#5670b0' : '#93a3c4', shadeK: night ? 0.5 : 0.75, veil: night ? 0.6 : 1, drizzle: night ? 0.5 : dawn ? 0.6 : 1 };
    const stackLit = (x, y, z) => deckShade(x, y, z, sunLocal);
    const hero = await buildHero(ctx, { rng, density, light: wl, fallLight, concrete: M.concrete, sunLocal, mixed: cast === 'mixed', flora: { material: fmat }, litAt: stackLit,
      tintAt: (x, y, z) => { const k = stackLit(x, y, z); return [mix(shadeTint[0], 1, k), mix(shadeTint[1], 1, k), mix(shadeTint[2], 1, k)]; } });
    hero.object.position.set(HERO.x, 0, HERO.z); hero.object.rotation.y = HERO.rot; scene.add(hero.object);
    await ctx.yield();
    // what stands in the pond for the mirror: the twelve piers nearest the fly line and the four falls nearest the ring
    const cols = M.water.uniforms.uCol.value;
    hero.piers.map((p) => { const w = toWorld(p[0], 0, p[1]); return [w[0], w[2], p[2], path.nearestXZ(w[0], w[2]).dist]; }).sort((a, b) => a[3] - b[3]).slice(0, 12).forEach((p, i) => cols[i].set(p[0], p[1], p[2], 2.7));
    hero.fallList.slice(0, 4).forEach((f, i) => { const w = toWorld(f[0], 0, f[1]); cols[12 + i].set(w[0], w[2], f[2], -(f[3] * 0.6 + 0.5)); });

    // ---- the world's own falling water and wisteria ----
    const fallItems = [
      { top: [42, 228, -45], width: 9, height: 228.5, yaw: -Math.PI / 2, kind: 4, phase: 0.13, lit: night ? 0.8 : 1.8 }, { top: [28, 0, -45], width: 46, height: 0.7, kind: 1, phase: 0.4 }, { top: [36, 60, -45], width: night ? 44 : 24, height: night ? 0.3 : 0.42, kind: 1, phase: 0.9 },      // (round 15: the mist stands at the fall's foot and in one torn puff up its length: tower W stays solid and dark behind its fall)
      // the court: sheets over all four rims (the far one faces us in the sun), mist boiling up out of the pit
      // (the far rim faces the sun and us: five ribbons with bare mossed wall between them, not one pane)
      // (over the near rim the flood goes in sheets of very different widths at uneven gaps, not a row of equal ribbons)
      { top: [-29.3, 0.1, 48], width: 3.6, height: 12, yaw: 0, kind: 0, phase: 0.33, lit: 0.9 }, { top: [-23.3, 0.1, 48], width: 4.4, height: 12, yaw: 0, kind: 0, phase: 0.58, lit: 0.9 },
      { top: [-16.6, 0.1, 48], width: 4.8, height: 12, yaw: 0, kind: 0, phase: 0.07, lit: 0.9 }, { top: [-10.3, 0.1, 48], width: 3.4, height: 12, yaw: 0, kind: 0, phase: 0.74, lit: 0.9 },
      { top: [-4.8, 0.1, 48], width: 2.8, height: 12, yaw: 0, kind: 0, phase: 0.45, lit: 0.9 }, { top: [16, 0.1, 48], width: 2.6, height: 12, yaw: 0, kind: 0, phase: 0.81, lit: 0.9 },
      { top: [-28.4, 0.1, 62], width: 2.1, height: 12, yaw: Math.PI, kind: 0, phase: 0.52, lit: 0.6 }, { top: [-21.5, 0.1, 62], width: 7.4, height: 12, yaw: Math.PI, kind: 0, phase: 0.95, lit: 0.6 },
      { top: [-12.6, 0.1, 62], width: 2.8, height: 12, yaw: Math.PI, kind: 0, phase: 0.17, lit: 0.6 }, { top: [-3.4, 0.1, 62], width: 8.6, height: 12, yaw: Math.PI, kind: 0, phase: 0.61, lit: 0.6 },
      { top: [6.2, 0.1, 62], width: 1.8, height: 12, yaw: Math.PI, kind: 0, phase: 0.39, lit: 0.6 }, { top: [13.4, 0.1, 62], width: 5.6, height: 12, yaw: Math.PI, kind: 0, phase: 0.64, lit: 0.6 },
      // spray thrown up where the escalators land, and a plume of mist standing over the pit beside the herd's leap (the herd's right flank passes through it)
      { top: [6, -11.3, 46.5], width: 13, height: 4.2, kind: 6, phase: 0.71, lit: 0.9 },
      { top: [2, -5.5, 52], width: 11, height: 0.65, kind: 1, phase: 0.29, lit: 1 }, { top: [6, -8, 41], width: 10, height: 0.6, kind: 1, phase: 0.12, lit: 1 },
      { top: [-32, 0.1, 51.6], width: 4.6, height: 12, yaw: Math.PI / 2, kind: 0, phase: 0.71, lit: 0.45 }, { top: [-32, 0.1, 58.2], width: 5.2, height: 12, yaw: Math.PI / 2, kind: 0, phase: 0.12, lit: 0.45 },
      { top: [18, 0.1, 51.4], width: 5, height: 12, yaw: -Math.PI / 2, kind: 0, phase: 0.27, lit: 0.45 }, { top: [18, 0.1, 58.4], width: 4.4, height: 12, yaw: -Math.PI / 2, kind: 0, phase: 0.78, lit: 0.45 },
      { top: [-18, -8, 53], width: 16, height: 0.1, kind: 1, phase: 0.66 }, { top: [3, -8, 55], width: 14, height: 0.1, kind: 1, phase: 0.21 }, { top: [-8, -4, 55], width: 20, height: 0.05, kind: 1, phase: 0.48 },
      { top: [6, -9, 44], width: 14, height: 0.15, kind: 1, phase: 0.92 },
    ];
    for (let e = 0; e < 3; e++) fallItems.push({ top: [0.85 + e * 5.15, 0.14, 20], width: 4.1, height: 12, yaw: 0, kind: 3, phase: 28, lit: 1 });
    // the elephants stand 25 to 35 m left of the fly line, at the first of these places that is clear of every pier
    const eleAt = [[-22, 119], [-25, 114], [-20, 124], [-28, 120], [-31, 112], [-33, 120]].map((q) => toWorld(q[0], 0, q[1])).find((w) => hero.piers.every((pr) => { const pw = toWorld(pr[0], 0, pr[1]); return Math.hypot(pw[0] - w[0], pw[2] - w[2]) > 13; })) || toWorld(-25, 0, 118);
    if (rare) for (let i = 0; i < 5; i++) {                      // trunk showers: plumes of spray thrown up over their backs that come and go and catch the light
      const ex = eleAt[0] + (i - 2) * 2.9, ez = eleAt[2] + ((i * 3) % 5 - 2) * 1.7;
      fallItems.push({ top: [ex, 3.4, ez], width: 4.2, height: 4.6, kind: 6, phase: 60 + i * 2.1, lit: 1 }, { top: [ex, 4.6, ez], width: 6, height: 0.5, kind: 1, phase: 60 + i * 2.1, lit: 1 },
        { top: [ex + 0.9, 3.8, ez + 0.6], width: 2.4, height: 6.2, kind: 6, phase: 61.3 + i * 2.1, lit: 1 });      // and a second, taller plume that the sun catches
    }
    fallItems.push({ top: [51, 228, -9.3], width: 5.5, height: 228.5, yaw: 0, kind: 4, phase: 0.57, lit: night ? 0.9 : 2.3 }, { top: [51, 0, -5], width: 24, height: night ? 0.35 : 0.6, kind: 1, phase: 0.36 });
    // where the two long falls go in: rings running out over the basin, a crown of spray standing in the mist
    fallItems.push({ top: [38.5, 0.07, -45], width: 17, height: 1, kind: 5, phase: 0.2, lit: 1 }, { top: [38.5, -0.1, -45], width: 15, height: 9, kind: 6, phase: 0.3, lit: 1 },
      { top: [51, 0.07, -6], width: 12, height: 1, kind: 5, phase: 0.7, lit: 1 }, { top: [51, -0.1, -6], width: 10, height: 7, kind: 6, phase: 0.8, lit: 1 });
    {   // a thread of water off the bridge end's tip: column, rings, a crown of spray and a drift of mist where it goes in
      const tx = BRIDGE.b[0] + 0.5, tz = BRIDGE.a[2] - 2.1, th = BRIDGE.b[1] - 0.9, fxx = tx + 0.3 + 0.2 * Math.sqrt(th);
      fallItems.push({ top: [tx, th, tz], width: 1.5, height: th + 0.3, yaw: Math.PI / 2, kind: 4, phase: 0.43, lit: 1 }, { top: [fxx, 0.07, tz], width: 6.5, height: 1, kind: 5, phase: 0.6, lit: 1 },
        { top: [fxx, -0.1, tz], width: 5, height: 2.4, kind: 6, phase: 0.5, lit: 1 }, { top: [fxx, 0, tz], width: 7, height: 0.7, kind: 1, phase: 0.15, lit: 1 });
    }
    await ctx.yield();
    const fallsW = makeFallSet(fallItems, fallLight);
    fallsW.mesh.name = 'world-falls'; scene.add(fallsW.mesh);
    await ctx.yield();
    const wa = [], wb = [];
    for (const z of GANTRY) for (let x = -31; x <= 31; x += 1.05) { wa.push(x, 10.3 - 0.5 * Math.sin((x + 34) / 68 * Math.PI), z + 0.6, rng.range(2.4, 4.2)); wb.push(0, rng() * 0.999, 0.15 + 0.85 * laneAt(x, z), x * 3 + z); }
    for (let i = 0; i < 44; i++) { const t = i / 43; for (const s of [-1.7, 1.7]) { wa.push(-46 + 44 * t + s * 0.5, 22 - 9 * t, 8 - 26 * t + s, rng.range(3, 6)); wb.push(0.53, rng() * 0.999, s > 0 ? 1 : 0.4, i * 2); } }
    for (const x of [-4.3, 16.3]) for (let z = 21; z < 48; z += 1.1) { wa.push(x, 8.2, z, rng.range(2, 3.8)); wb.push(Math.PI / 2, rng() * 0.999, 0.7, z * 3 + x); }
    for (let x = -3.5; x < 16; x += 1.1) { wa.push(x, 8.3 + 1.3 * (1 - Math.abs(x - 6) / 10), 47.4, rng.range(1.6, 3.2)); wb.push(0, rng() * 0.999, 1, x * 3); }
    for (let i = 0; i < 16; i++) { const t = (i + 0.5) / 16, s = i % 2 ? 1.6 : -1.6; wa.push(7 + 28.5 * t + s * 0.47, 18 - 11.6 * t - 0.6, -22.9 - 15.7 * t + s * 0.85, rng.range(1.5, 3)); wb.push(0.5, rng() * 0.999, 0.9, i * 5); }   // out of the train's windows
    { const br = makeRng('bridge-end:' + ctx.seed), A = BRIDGE.a, B = BRIDGE.b, hw = BRIDGE.hw, zc = A[2];      // the bridge end's fringe: both edges and round the tip (its own rng)
      for (let x = A[0] + 4.4; x < B[0]; x += 0.95) for (const sd of [1, -1]) { if (br() < 0.1) continue; wa.push(x, bridgeY(x) + 0.15, zc + sd * (hw + 0.2), br.range(2.8, sd > 0 ? 5.4 : 4.2)); wb.push(0, br() * 0.999, sd > 0 ? 1 : 0.45, x * 3 + sd); }
      for (let z = zc - hw + 0.4; z < zc + hw; z += 1.0) { wa.push(B[0] + 0.15, B[1] - 0.2, z, br.range(2.2, 4.4)); wb.push(Math.PI / 2, br() * 0.999, 0.9, z * 3); } }
    { const gr = makeRng('wire-garlands:' + ctx.seed);      // THE THREE WIRES ACROSS THE BOULEVARD ARE GARLANDS: wisteria hanging from each in bunches of uneven length, with gaps (their own rng)
      for (const z of [330, 300, 250]) for (let x = -40; x <= 40; x += 0.95) {
        const bunch = ctx.noise.n2(x * 0.16 + z * 0.7, z * 0.37);
        if (bunch < -0.28) continue;
        wa.push(x, 12.55 - 1.6 * (1 - (x / 42) * (x / 42)), z + gr.range(-0.15, 0.15), gr.range(1.3, 2.2) + 1.6 * Math.max(0, bunch)); wb.push(gr.range(-0.3, 0.3), gr() * 0.999, 0.25 + 0.75 * laneAt(x, z), x * 3 + z);
      } }
    const wistW = makeWisteria({ A: new Float32Array(wa), B: new Float32Array(wb), count: wa.length / 4 }, wl);
    wistW.mesh.name = 'street-wisteria'; scene.add(wistW.mesh);
    await ctx.yield();

    // ---- the herd, standing deer, macaques, egrets, swallows, butterflies ----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    const inX = (x, a, b) => sstep(a - 4, a, x) * (1 - sstep(b, b + 4, x));
    const pondAt = (x, z) => { const lp = toLocal(x, z); return 1 - sstep(0.75, 1, Math.hypot(lp[0] / 78, (lp[1] - 60) / 68)); };
    const heightAt = (x, z) => -0.25 - 0.35 * pondAt(x, z) + 3.4 * Math.max(bell(55, 13, z) * inX(x, -36, 22), bell(36, 20, z) * inX(x, -5, 17));
    // the kit's blob shadows lie at the feet, 0.25 m under the sheet, so they are off; makeWake throws each animal's shadow on the water
    const herdBase = { species: 'deer', size: 1.6, mode: 'migrate', gait: 'run', heightAt, coat: '#6b5140', rump: '#f2ede2', horn: '#8A6A58', varieties: 0.35, rim: 0.3, blobShadow: false };
    const outer = Math.round(15 * Math.min(1.2, density)), shadowK = golden ? 0.55 : dawn ? 0.22 : night ? 0.35 : 0.5;
    // the kit's herd is the middle distance and beyond (none of it nearer than about 22 m to the eye); the animals that run beside us
    // are the near herd further down, built in the part file. Eighty gallopers in all at density 1.
    const herdDefs = [[16, 0, 78, [14, 50]], [10, 17.5, 60, [8, 30]], [10, -17.5, 60, [8, 30]], [outer, 30, 50, [12, 60]], [outer, -30, 50, [12, 60]]];
    if (whiteStag) herdDefs.push([1, 3, 31, [2, 2]]);                                                         // one seed in four: a leucistic stag running just ahead of us
    const gallopers = [], shadeSky = new THREE.Color('#55607C');
    // the gallopers' body is one mesh for all five herds: the kit builds it once here, in a step of its own (a one-animal herd with the same
    // colours and its own rng, kept only for its geometry), and each herd is handed it through the kit's `geometry` option. A herd that
    // builds the same body inside its own makeHerd is one step of 20 to 50 ms. Same vertices, same smoothed normals, the same draws from rng.
    const body0 = F.makeHerd({ species: 'deer', coat: herdBase.coat, rump: herdBase.rump, horn: herdBase.horn, rng: makeRng('herd-body'), count: 1, blobShadow: false });
    body0.material.dispose(); body0.uniforms.uTracks?.value?.dispose?.();
    const herdBody = body0.geometry;
    await ctx.yield();
    smoothNormals(herdBody);
    await ctx.yield();
    for (let hi = 0; hi < herdDefs.length; hi++) {
      const [count, side, lead, spread] = herdDefs[hi], white = hi === 5;
      const h = F.makeHerd({ ...herdBase, ...(white ? { coat: '#efe9e0', varieties: 1, sizes: [1.14] } : { geometry: herdBody }), rng: rng.fork('herd' + side), count, spread, along: { path, side, lead, from: -0.05, to: 1.1 } });
      if (!white) {
        // (round 15) THE HERD IS NOT ONE ANIMAL EIGHTY TIMES. After the kit has laid the herd out (same draws, same places, same run),
        // each animal is given its own build by hash: one in seven a fawn, a quarter hinds (smaller, no antlers), one in ten a heavy
        // stag; coats from dark chocolate through chestnut and red to pale buff; one in five bounds high every few seconds of its
        // run, and one in eight swims the middle of the pond with only its back and head out.
        const aB = h.geometry.attributes.iB, aT = h.geometry.attributes.iTint, tr = h.uniforms.uTracks.value.image, TW = tr.width, td = tr.data;
        for (let i = 0; i < count; i++) {
          const k1 = hsh0(hi * 31.7 + i * 7.3 + 1), k2 = hsh0(hi * 17.1 + i * 3.9 + 5), k3 = hsh0(hi * 9.3 + i * 11.7 + 9);
          let sc = aB.getX(i), stag = aB.getY(i);
          if (k1 < 0.14) { sc *= 0.58; stag = 0; } else if (k1 < 0.4) { sc *= 0.86; stag = 0; } else if (k1 > 0.9) { sc *= 1.16; stag = 1; }
          aB.setXY(i, sc, stag);
          const tone = k2 < 0.22 ? [0.6, 0.57, 0.55] : k2 < 0.42 ? [1.3, 1.22, 1.04] : k2 < 0.62 ? [1.22, 0.94, 0.76] : [1, 1, 1];
          aT.setXYZ(i, aT.getX(i) * tone[0], aT.getY(i) * tone[1], aT.getZ(i) * tone[2]);
          if (k3 < 0.2) { for (let q = 0; q < 7; q++) { const j = 3 + Math.floor(hsh0(i * 5.1 + q * 13.3 + hi) * (TW - 6)), o = (i * TW + j) * 4; if (td[o + 1] < 0.4) td[o + 1] += 1.0 + 1.1 * hsh0(i + q * 3.3 + hi * 2); } }
          else if (k3 > 0.875) for (let j = 0; j < TW; j++) { const o = (i * TW + j) * 4; if (td[o + 1] > 0.4) continue; const lp = toLocal(td[o], td[o + 2]), r = Math.hypot(lp[0] / 78, (lp[1] - 60) / 68); td[o + 1] -= 0.95 * sc / 1.6 * (1 - sstep(0.38, 0.7, r)); }
        }
      }
      await ctx.yield();
      if (white) smoothNormals(h.geometry);
      fauna.add(h, { always: true });
      await ctx.yield();
      scene.add(makeWake(h, M, 1.6, shadowK));
      if (hi < 3 || white) scene.add(mirrorOf(h, M));                                                            // leaders and inner wings stand in the mirror
      gallopers.push({ lead, side, e: -1, u: h.uniforms, sun0: h.uniforms.uSunColor.value.clone(), sky0: h.uniforms.uSkyColor.value.clone(), shade: h.uniforms.uSkyColor.value.clone().lerp(shadeSky.clone().multiplyScalar(L.hemiI), 0.6) });
      await ctx.yield();
    }
    const hinds = F.makeHerd({ species: 'deer', size: 1.6, rng: rng.fork('hinds'), count: 10, varieties: 0, coat: '#8a6044', rump: '#ffffff', center: [-36.5, 0.16, 366], radius: 4.6, y: 0.16, roam: 0.5, pause: 0.3 });
    await ctx.yield();
    smoothNormals(hinds.geometry); fauna.add(hinds);
    await ctx.yield();
    const drinkAt = toWorld(26, 0, 105);
    const drinkers = F.makeHerd({ species: 'deer', size: 1.6, rng: rng.fork('drink'), count: 6, varieties: 0.3, coat: '#8a6044', rump: '#ffffff', horn: '#8A6A58', center: [drinkAt[0], -0.3, drinkAt[2]], radius: 8, y: -0.3, roam: 0.6, pause: 0.34, path, clear: 12 });
    await ctx.yield();
    smoothNormals(drinkers.geometry); fauna.add(drinkers);
    await ctx.yield();
    // hinds at graze on the third deck's carriageway, a meadow now, where the view looks down on it from over the top deck
    { const dk = [];      // (none now: the view no longer climbs over the top deck, and from below they are not seen)
      for (let i = 0; i < dk.length; i++) {
        const [c, r, cnt] = dk[i];
        const g = F.makeHerd({ species: 'deer', size: 1.6, rng: makeRng('deck-hinds' + i + ':' + ctx.seed), count: cnt, varieties: 0.3, coat: '#6b5140', rump: '#ffffff', horn: '#8A6A58', center: c, radius: r, y: c[1], roam: 0.4, pause: 0.4 });
        await ctx.yield();
        smoothNormals(g.geometry); fauna.add(g);
        await ctx.yield();
      } }
    if (rare) {                                                                                               // the rare event: the zoo herd's descendants showering in the lily pond
      const ele = F.makeHerd({ species: 'elephant', coat: golden ? '#3d3b3a' : '#7d7873', rim: golden ? 0.25 : 0.6, rng: rng.fork('elephants'), count: 7, size: 1.5, sizes: [1, 1.06, 0.94, 1, 0.9, 0.52, 0.46], center: [eleAt[0], -1.5, eleAt[2]], radius: 6.5, y: -1.5, roam: 0.5, pause: 0.32, path, clear: 11 });
      await ctx.yield();
      smoothNormals(ele.geometry); fauna.add(ele);
      await ctx.yield();
    }
    // ---- the near herd: fourteen deer of our own (part file) running 6 to 45 m ahead on both flanks, each on its own line beside the
    // path. A line is a table of sideways offsets over the path, bent at build time round every car, bus, tree, pier and pit, and drawn
    // in toward the ring at the end so that they pass into it ahead of us. Its own rng: nothing else in the world moves. ----
    for (const pr of hero.piers) { const w = toWorld(pr[0], 0, pr[1]); obst.push([w[0], w[2], 4.4]); }
    for (const z of [22, 30, 38, 46]) obst.push([6, z, 10.5]);
    for (const f of hero.fallList.slice(-8)) { const w = toWorld(f[0], 0, f[1]); obst.push([w[0], w[2], 3.4]); }      // the four falls placed by hand beside the last of the route
    obst.push([-2, -18, 3.6], [36, -39, 5], [drinkAt[0], drinkAt[2], 7]); if (rare) obst.push([eleAt[0], eleAt[2], 9.5]);
    const nrng = makeRng('near-herd:' + ctx.seed), LEN = path.length, NS = 380, UMAX = 1.12;
    const SLOTS = [[9.5, 5.6], [11, -6.0], [14.5, 3.6], [19, -4.0], [11, 10], [17, -10.5], [20, 7.6], [22, -6.4], [26, 11.5], [27, -9.2], [30, 6.6], [32, -13], [35, 7.8], [38, -6], [17, 13.2], [41, -7.4], [44, 7], [24, -14]];
    const nd = SLOTS.slice(0, Math.max(10, Math.min(16, Math.round(14 * density)))).map(([lead, side]) => ({ lead: lead + nrng.range(-1, 1), side: side + nrng.range(-0.5, 0.5) * (Math.abs(side) > 6.5 ? 1 : 0.3), p1: nrng() * TAU, p2: nrng() * TAU, tab: null }));
    // three more run well ahead on our own line and are the first of the near herd into the ring, in plain view on the last run (their own rng)
    const n0 = nd.length, rr = makeRng('ring-runners:' + ctx.seed);
    for (const [lead, side] of [[64, 2.7], [80, -3.3], [98, 1.5]]) nd.push({ lead: lead + rr.range(-2, 2), side: side + rr.range(-0.4, 0.4), p1: rr() * TAU, p2: rr() * TAU, tab: null });
    const nearGeo = deerGeometry();                             // the skin in a step of its own (no random draws in it)
    await ctx.yield();
    const ndSizes = nd.map((d, i) => (i >= n0 ? 0.9 + 0.1 * rr() : i % 3 === 0 ? 1 : i % 7 === 4 ? 0.74 : 0.86 + 0.06 * nrng())), ndStags = nd.map((d, i) => (i >= n0 ? i === n0 : i % 3 === 0));
    const ndPhases = nd.map((d, i) => (i >= n0 ? rr() : nrng())), ndSeeds = nd.map((d, i) => (i >= n0 ? rr() : nrng()));
    // (round 15: after the draws, by index: two fawns among the hinds, and no two stags the same size)
    for (let i = 0; i < n0; i++) { if (i % 5 === 2 && !ndStags[i]) ndSizes[i] = 0.6; else if (ndStags[i]) ndSizes[i] = 0.96 + 0.16 * hsh0(i * 3.3 + 70); }
    // THE HERO DEER: two stags, a hind and a yearling that run with the rest and, while the view is down near the water, close in to
    // 10 to 14 m ahead on both sides of it and bound through the shallows, one or two of them in the air at any moment.
    // [lead and side far off, lead and side close by, size, stag, phase of the bound, its height] (their own rng)
    // ONE RULE (round 15; it replaces two moments set by hand): each of the four has one far place and one close place, and how close it
    // runs is set by the height of the eye alone, at every moment of the flight: wherever the eye rides at saddle height (3 m) or lower
    // they run 10 to 14 m ahead and 5 to 9 m out and bound; as the eye lifts they draw ahead and out, and by 7 m they are back in the
    // herd. No change of places, nothing keyed to a position.
    const HEROES = [[17, 7.6, 9.8, 5.4, 1.14, 1, 0.08, 1], [24, 10, 13.6, 7.6, 0.92, 0, 0.77, 0.85], [20, -8.6, 13, -7.2, 1.1, 1, 0.513, 1], [27, -11.5, 10.6, -8.8, 0.76, 0, 0.3, 0.7]];
    const eyeV = new THREE.Vector3(), eyeY = (u) => path.pointAt(Math.min(1, Math.max(0, u)), eyeV).y;
    const heroW = (u) => 1 - sstep(3.0, 7.0, eyeY(u)), lowW = (u) => 1 - sstep(2.0, 3.0, eyeY(u)), hr = makeRng('hero-deer:' + ctx.seed);
    const heroLead = (h, u) => mix(h[0], h[2], heroW(u)), heroSide = (h, u) => mix(h[1], h[3], heroW(u));
    for (const h of HEROES) { nd.push({ lead: h[0], side: h[1], p1: hr() * TAU, p2: hr() * TAU, tab: null, hero: h }); ndSizes.push(h[4]); ndStags.push(h[5] === 1); ndPhases.push(hr()); ndSeeds.push(hr()); }
    // THE GREAT STAG: one animal a third larger than the rest, in full antler (rack 0.6), rim-lit. It runs beside us for the whole
    // flight, five to seven metres ahead and five metres off our line (the brief's distance for the near herd): on our left as far as
    // the stack, crossing over ahead of us where the view lifts there (u 0.56 to 0.66), then on our right, and at the end it pulls
    // ahead and is into the ring in front of us. Whenever it is within ten metres or so of the eye it looks back at us over its
    // shoulder for a second or two about every five: a habit of the animal, with a phase of the visit's own (its own rng).
    // (Round 13 had it 34 m ahead, beside us only on two stretches, with two timed glances; by hand it keeps one lead and one habit.)
    // (the higher the eye flies, the further ahead it runs: a metre and a half for every metre above the saddle's three, so that from
    // the raised views we look down on it among the herd and do not lose it under the frame)
    const gEye = new THREE.Vector3();
    const greatLead = (u) => mix(6.2 + 0.9 * Math.sin(u * 14 + 1.3) + 1.5 * Math.max(0, path.pointAt(Math.min(1, Math.max(0, u)), gEye).y - 3), 11.5, sstep(0.885, 0.95, u));
    const greatSide = (u) => mix(-5.0, mix(5.0, 2.0, sstep(0.89, 0.95, u)), sstep(0.56, 0.66, u));
    const glPh = makeRng('great-look:' + ctx.seed)() * 6.2832;
    const ndRack = ndSeeds.map((s) => 0.5 * ((s * 7.9) % 1) - 0.14);      // (round 15) every stag of the near herd carries its own size of antler, from its seed
    const greatLook = (dist, time) => (1 - sstep(10, 16, dist)) * sstep(0.3, 0.75, Math.sin(time * 1.25 + glPh));
    const iGreat = nd.length; nd.push({ lead: 12, side: -4.4, p1: 0.4, p2: 2.1, tab: null, great: true }); ndSizes.push(1.32); ndStags.push(true); ndPhases.push(0.21); ndSeeds.push(0.83);
    // THE STAG ON THE BRIDGE END is the last animal of the near herd: it stands (see the bridge end further up). Our own stag is not drawn:
    // placed from the camera it stood in the picture as a pole with a head. mountShown(u) says where the view is in the saddle: our shadow
    // on the water runs ahead of us there.
    const iStag = nd.length; ndSizes.push(1.5); ndStags.push(true); ndPhases.push(0.37); ndSeeds.push(0.61);
    const mwin = (a, b, u) => sstep(a - 0.014, a, u) * (1 - sstep(b, b + 0.014, u));
    const mountShown = (u) => Math.max(sstep(0.004, 0.02, u) * (1 - sstep(0.09, 0.11, u)), mwin(0.915, 2, u));
    const near = makeNearDeer({ geometry: nearGeo, count: nd.length + 1, common: GLSL_COMMON, shared: M.shared, fogU: M.fogU, shadowK, strideLen: 23.5 / 2.6, rimK: night ? 2.4 : 1, padsU: M.water.uniforms.uPads, ...(night ? { coat: '#a38676', coatDark: '#6b584e' } : {}),   // by moonlight the chestnut is grey-brown
      sizes: ndSizes, stags: ndStags, phases: ndPhases, seeds: ndSeeds });
    scene.add(near.object);
    await ctx.yield();
    const lineBase = new Float32Array((NS + 1) * 4), dv = new THREE.Vector3(), dtan = new THREE.Vector3(), dq = [0, 0, 0];
    for (let j = 0; j <= NS; j++) { path.pointAt(j / NS * UMAX, dv); path.tangentAt(j / NS * UMAX, dtan); const tl = Math.hypot(dtan.x, dtan.z) || 1; lineBase.set([dv.x, dv.z, dtan.x / tl, dtan.z / tl], j * 4); }
    await ctx.yield();
    for (let di = 0; di < nd.length; di++) {
      const d = nd[di], tab = new Float32Array(NS + 1), tmp = new Float32Array(NS + 1), s0 = Math.sign(d.side), cap = d.great ? 2 : 2.4 + 2.2 * Math.abs(Math.sin(d.p1));
      // the outer animals do not crowd into the ring: they fan out and go by on either side of it, under the lowest deck
      d.fan = !d.great && Math.abs(d.hero ? d.hero[1] : d.side) > 9;
      for (let j = 0; j <= NS; j++) {
        const ud = j / NS * UMAX, sv = d.great ? greatSide(ud) + 0.2 * Math.sin(ud * 23 + d.p2) : d.hero ? heroSide(d.hero, ud - 14 / LEN) + 0.3 * Math.sin(ud * 23 + d.p2) : d.side + (Math.abs(d.side) < 6 ? 0.4 : 0.9) * Math.sin(ud * 23 + d.p2);
        tab[j] = mix(sv, d.fan ? s0 * (RING + 4 + 0.36 * Math.abs(d.side)) : (d.great ? Math.sign(sv) : s0) * Math.min(Math.abs(sv), cap), sstep(d.fan ? 0.88 : 0.9, 0.995, ud));
      }
      const resolve = () => {
        for (let j = 0; j <= NS; j++) {
          const bx = lineBase[j * 4], bz = lineBase[j * 4 + 1], tx = lineBase[j * 4 + 2], tz = lineBase[j * 4 + 3]; let sv = tab[j];
          for (let k = 0; k < obst.length; k++) {
            const o = obst[k], dx = o[0] - bx, dz = o[1] - bz, ao = dx * tx + dz * tz, R = o[2] + 1.1; if (Math.abs(ao) >= R) continue;
            const so = dx * -tz + dz * tx, w = Math.sqrt(R * R - ao * ao); if (Math.abs(sv - so) >= w) continue;
            const sg = d.great ? (tab[j] < 0 ? -1 : 1) : s0, inner = so - sg * w; sv = inner * sg >= (d.great ? 2.6 : 3.4) ? inner : so + sg * w;             // pass it on the path's side if there is room, else outside
          }
          tab[j] = sv;
        }
      };
      const smooth = (r) => { tmp.set(tab); for (let j = 0; j <= NS; j++) { let a = 0, c = 0; for (let k = Math.max(0, j - r); k <= Math.min(NS, j + r); k++) { a += tmp[k]; c++; } tab[j] = a / c; } };
      resolve(); await ctx.yield(); smooth(3); resolve(); await ctx.yield(); smooth(1); resolve();
      d.tab = tab;
      await ctx.yield();
    }
    let nearK = 1;
    const deerAt = (d, ud, out) => {
      path.pointAt(ud, dv); path.tangentAt(ud, dtan);
      const tl = Math.hypot(dtan.x, dtan.z) || 1, f = Math.min(NS - 0.001, Math.max(0, ud / UMAX * NS)), j = Math.floor(f), s0 = mix(d.tab[j], d.tab[j + 1], f - j);
      let sv = d.lead < 22 && nearK < 1 ? Math.sign(s0) * Math.max(Math.abs(s0) * nearK, Math.min(Math.abs(s0), 3.4)) : s0;
      out[0] = dv.x - dtan.z / tl * sv; out[2] = dv.z + dtan.x / tl * sv; out[1] = Math.max(heightAt(out[0], out[2]), -0.45);
    };
    const heroAt = (i, u, time, out) => { const d = nd[n0 + 3 + i], ud = u + heroLead(d.hero, u) / LEN; deerAt(d, ud, dq); return out.set(dq[0], 1.5, dq[2]); };
    const greatU = (u) => u + greatLead(u) / LEN;
    const greatAt = (u, out) => { deerAt(nd[iGreat], greatU(u), dq); return out.set(dq[0], 2.0, dq[2]); };
    // (greatPose makes no fit from the camera's matrices; live's nearK in deerAt still draws every near animal's side offset in on screens narrower than 1.6 to 1, the great stag's among them)
    const gPose = [0, 0, 0, 0, 0, 1, 0];
    const greatPose = (u, o) => {
      const d = nd[iGreat], ud = greatU(u);
      deerAt(d, ud, dq); o[0] = dq[0]; o[1] = dq[1]; o[2] = dq[2];
      deerAt(d, ud + 0.0025, dq); o[3] = Math.atan2(dq[0] - o[0], dq[2] - o[2]); o[4] = dq[1]; o[5] = Math.hypot(dq[0] - o[0], dq[2] - o[2]) || 1; o[6] = ud;
    };
    const placeNear = (u, camera, time = 0) => {
      if (camera) { const pe = camera.projectionMatrix.elements; nearK = Math.min(1, Math.max(0.55, pe[5] / Math.max(pe[0], 1e-3) / 1.6)); }
      greatPose(u, gPose); const gx = gPose[0], gz = gPose[2];
      for (let i = 0; i < nd.length; i++) {
        const d = nd[i], hw = d.hero ? heroW(u) : 0, ud = d.great ? gPose[6] : u + ((d.hero ? heroLead(d.hero, u) : d.lead) + 1.5 * Math.sin(u * 31 + d.p1) * (1 - 0.85 * hw)) / LEN;
        if (d.great) {
          // its head comes round to the lens now and again while it runs beside us (the neck turns up to 137 degrees: it looks back over
          // its shoulder); now and again it throws its head up; and for part of the time it bounds instead of galloping: habits of the
          // animal on the visit's own clock, the same at every place of the flight
          const x = gPose[0], y = gPose[1], z = gPose[2], hd = gPose[3];
          let yaw = 0;
          if (camera) { const ce = camera.matrixWorld.elements, cx = ce[12] - x, cz = ce[14] - z, sh = Math.sin(hd), ch = Math.cos(hd); yaw = Math.max(-2.4, Math.min(2.4, Math.atan2(-cx * ch + cz * sh, cx * sh + cz * ch))) * greatLook(Math.hypot(cx, cz), time); }
          const gb = sstep(0.1, 0.55, Math.sin(time * 0.33 + glPh * 1.7)), c = (time * 0.6 + glPh * 0.7) % 1, up = gb > 0.02 && c < 0.45;
          const hop = up ? 1.3 * gb * Math.sin(Math.PI * c / 0.45) : 0, hp = up ? -0.3 * gb * Math.cos(Math.PI * c / 0.45) : 0;
          const toss = -0.5 * Math.pow(Math.max(0, Math.sin(time * 0.83 + glPh * 2.3)), 10);
          near.setHead(i, yaw, 1, toss);
          near.set(i, x, (ud - 1) * LEN > 1.2 ? -80 : y + hop, z, hd, -0.8 * Math.atan2(gPose[4] - y, gPose[5]) + hp, sstep(0.15, 1.3, y + hop + 0.25), 0, 0.6);
          continue;
        }
        deerAt(d, ud, dq); let x = dq[0], z = dq[2]; const y = dq[1];
        deerAt(d, ud + 0.0025, dq);
        const ds = Math.hypot(dq[0] - x, dq[2] - z) || 1, hd = Math.atan2(dq[0] - x, dq[2] - z);
        let hop = 0, hp = 0;                                           // a hero deer bounds: 0.75 s in the air, 0.9 s at the gallop
        if (hw > 0.02) { const c = (time * 0.6 + d.hero[6]) % 1; if (c < 0.45) { hop = 1.55 * d.hero[7] * hw * Math.sin(Math.PI * c / 0.45); hp = -0.36 * hw * Math.cos(Math.PI * c / 0.45); } }
        // nobody runs through the great stag: an animal within 3.6 m of it gives way
        const ex = x - gx, ez = z - gz, ed = Math.hypot(ex, ez); if (ed < 3.6) { const k = (3.6 - ed) / Math.max(ed, 0.4); x += ex * k; z += ez * k; }
        near.set(i, x, !d.fan && (ud - 1) * LEN > 1.2 ? -80 : y + hop, z, hd, -0.8 * Math.atan2(dq[1] - y, ds) + hp, sstep(0.15, 1.3, y + hop + 0.25), 0, ndRack[i] || 0);   // gone once through the ring
      }
      // the stag on the bridge end: it stands and looks out over the herd, its head lifting and turning a little; rack 0.6 = antlers 1.6 times the herd's
      near.set(iStag, STAG[0], STAG[1], STAG[2], STAG[3], -0.06, 0, 1, 0.6); near.setHead(iStag, 0, 0.7);
      near.commit();
    };
    placeNear(0);
    await ctx.yield();
    // fourteen macaques: on the wire at z 330, along the dropped beam, on the lowest parapet either side of the ring
    const apes = [];
    for (const [x, pose] of [[-19, 0], [-17.6, 0], [-6, 1], [8, 0], [9.5, 0], [21, 1]]) apes.push([x, 12.62, 330, pose ? Math.PI / 2 : rng.range(-0.5, 0.5) + Math.PI, pose, pose ? 4 : 0, 1]);
    for (const t of [0.2, 0.26, 0.52, 0.8]) apes.push([-46 + 44 * t, 25.3 - 9 * t, 8 - 26 * t, 0.9 + rng.range(-0.6, 0.6), t === 0.52 ? 1 : 0, 3, 0]);
    for (const lx of [-13, -10.5, 11, 15.5]) { const w = toWorld(lx, 16.9, 16.75); apes.push([w[0], w[1], w[2], HERO.rot + rng.range(-0.5, 0.5), 0, 0, 0]); }
    scene.add(makeMacaques(M, apes, rng.fork('apes')));
    await ctx.yield();
    const egretAt = [[-28.5, 0, 505], [28.6, 0, 431], [-28.8, 0, 312], [28.7, 0, 226], [28.4, 0, 158], [27, 0, 96], toWorld(-52, 0, 96), toWorld(-60, 0, 60), toWorld(48, 0, 118), toWorld(58, 0, 70), toWorld(-40, 0, 24), toWorld(44, 0, 30)];
    if (dawn) for (let i = 0; i < 28; i++) { if (i % 2) egretAt.push([(i % 4 === 1 ? 1 : -1) * rng.range(26.5, 29), 0, rng.range(60, 520)]); else { const a = rng.range(0, TAU), r = rng.range(30, 70); egretAt.push(toWorld(Math.cos(a) * r, 0, 60 + Math.sin(a) * r * 0.8)); } }
    fauna.add(F.makeWaders({ rng: rng.fork('egret'), species: 'egret', positions: egretAt, count: egretAt.length, level: 0, size: 1.5 }));
    await ctx.yield();
    const whiteBird = { body: '#ffffff', belly: '#ffffff', wingC: '#f4f4ee', tip: '#ffffff', trail: '#ffffff' };
    fauna.add(F.makeFlock({ rng: rng.fork('lift1'), species: 'gulls', count: 9, size: 1.4, ...whiteBird, cross: { path, u: 0.26, lead: 48, height: 5, span: 170, duration: 44 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('lift2'), species: 'gulls', count: 7, size: 1.4, ...whiteBird, cross: { path, u: 0.69, lead: 36, height: 2, span: 150, rise: 20, duration: 44 } }));
    await ctx.yield();
    // and seven more cross low over the open water between the top deck and the third as the view glides down under the top deck (their own rng)
    fauna.add(F.makeFlock({ rng: makeRng('lift3:' + ctx.seed), species: 'gulls', count: 7, size: 1.5, ...whiteBird, cross: { path, u: 0.792, lead: 34, height: -2.6, span: 150, angle: 72, duration: 46 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('swallow1'), species: 'swifts', count: 20, along: { path, side: 2, up: 3.5, lead: 42 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('swallow2'), species: 'swifts', count: 40, center: toWorld(0, 16, 120), radius: 80 }));
    await ctx.yield();
    fauna.add(F.makeButterflies({ rng: rng.fork('swallowtail'), center: toWorld(0, 7, 40), radius: 34, count: 40, shape: 'swallowtail', size: 2.4 }));
    if (night) {                                                                                              // full moon: fireflies pulsing in waves in the bamboo and over the pond
      await ctx.yield();
      fauna.add(F.makeFireflies({ rng: rng.fork('ff1'), center: [-70, 9, 392], radius: 58, count: Math.round(1300 * detail), size: 0.3, sync: 0.6, altitude: [0.5, 14] }), { always: true });
      await ctx.yield();
      fauna.add(F.makeFireflies({ rng: rng.fork('ff2'), center: toWorld(0, 4, 70), radius: 85, count: Math.round(1500 * detail), size: 0.3, sync: 0.6 }), { always: true });
      await ctx.yield();
      fauna.add(F.makeFireflies({ rng: rng.fork('ff3'), path, uFrom: 0.02, uTo: 0.6, spread: 34, clear: 7, lift: [-2.4, 5], count: Math.round(500 * detail), size: 0.26, sync: 0.5 }), { always: true });
    }
    await ctx.yield();

    // ---- air: rain, petals, spray, the bow, mist in the stack, shafts through the bamboo gap and between the decks ----
    const set = fx.fxGroup(); scene.add(set.object);
    const rain = set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', count: Math.round(5000 * detail) }));
    await ctx.yield();
    const petalC = night ? ['#8ea2d6', '#7f8fc4', '#a3b2de'] : cream ? ['#ffffff', '#f6efd9', '#efe6c8'] : ['#B59AE0', '#d3c2f0', '#f1eaff'], petalK = night ? 0.5 : 1;      // (by moonlight pale petals over dense stars read as snowfall)
    const petals = set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', count: Math.round(1400 * detail * Math.min(1.2, density)), colors: petalC, near: [3.2, 7.5] }));      // (a petal a metre from the lens was a flat lilac shape in the corner of the picture)
    await ctx.yield();
    // spray thrown up by the herd around the rider: lit droplets hugging the water (round, not streaks: streaks lay across the near deer's legs)
    const spray = set.add(fx.makeParticles({ rng: rng.fork('spray'), preset: 'rain', mode: 'billboard', shape: 'disc', count: Math.round(460 * detail), box: [48, 1.1, 48], follow: 'xz', center: [0, 0.6, 0],
      velocity: [0.5, -3.2, 5], velocityRandom: [1.6, 1.4, 2.2], size: [0.022, 0.05], twinkle: 0.4, colors: night ? ['#b9c9ee', '#d6e0fa', '#9fb0dc'] : ['#fff6e6', '#ffffff', '#e6eefa'], intensity: night ? 0.4 : 1.4, opacity: 0.6, additive: 0.7, near: [2.5, 6] }));
    await ctx.yield();
    // the bow: primary alone plus a faint copy that also carries the secondary, so the secondary stays at a fraction of the primary
    const bowR = rare ? 3900 : 2400;      // (the rare double bow stands 3.9 km off, inside the camera's 4.2 km: its wider secondary arc clears everything built)
    const bowA = fx.makeRainbow({ sunDir: L.sunDir.toArray(), intensity: 0, radius: bowR, secondary: false }); scene.add(bowA.object);
    const bowB = fx.makeRainbow({ sunDir: L.sunDir.toArray(), intensity: 0, radius: bowR }); scene.add(bowB.object);
    const bowSec = rare ? 0.85 : 0.4;
    // ONE BOW, 2.4 km off: behind every tower of the far bank on the last run too (a second, near bow that hung in the spray drew across their facades).
    await ctx.yield();
    const mistK = dawn ? 0.2 : night ? 0.2 : golden ? 0.2 : 0.11;
    const mist = set.add(fx.makeMist({ rng: rng.fork('mist'), count: 64, area: [230, 7, 260], center: toWorld(0, 4, 130), size: [9, 22], softness: 1.0, ragged: 0.7, near: [0.8, 2.4], color: night ? '#8ea2d6' : golden ? '#f2dcc8' : '#e4e9f2', opacity: mistK }));      // (round 15: smaller, torn puffs, gone near the lens: wisps over the pond, never a pale slab)
    await ctx.yield();
    // THE SHOWER'S FRONT (sun-shower look only): the rain comes up from astern as a line across the boulevard, passes over us at u 0.188
    // and runs on ahead toward the slate wall. frontZ(u) is where the line is; the water draws its band of rings there (uFront), and three
    // veils of falling streaks, 9 m apart, travel with it: bright where the sun lanes cross them, grey in shade.
    const frontZ = (u) => 384 - (u - 0.188) * (u < 0.188 ? 2400 : 3100), frontK = (u) => (shower ? sstep(0.135, 0.16, u) * (1 - sstep(0.3, 0.42, u)) : 0);
    let veil = null;
    if (shower) { veil = makeVeil(M); veil.position.set(0, 0, frontZ(0)); scene.add(veil); await ctx.yield(); }
    // THE SPRAY-BOW in the tower fall's mist (the brief's, at the reveal): the fall's spray drifts low across the basin between us and
    // the fall, and where the sight line through it makes 42 degrees with the line from the sun there is colour in it. It lies in a sheet of
    // spray 1.4 m over the water, so it is seen against the flood from above and never against a facade; it is worked out per pixel from
    // the eye, so the arc slides through the spray as we pass, and it shows only where the drifting spray is. None by moonlight or in fog.
    let sprayBow = null; const sprayBowK = shower ? 0.5 : golden ? 0.42 : 0;
    if (sprayBowK > 0) { sprayBow = makeSprayBow(M); scene.add(sprayBow); await ctx.yield(); }
    // THE BREATH OF MIST OFF THE WARM WATER IN THE LANES (golden look only): low wisps lying on the flood down the boulevard, lit copper,
    // thin enough to see the mirror through; gone from the air (looked down on they are discs on the water) and never at the lens
    const laneMistK = golden ? 0.5 : 0;
    const laneMist = golden ? set.add(fx.makeMist({ rng: makeRng('lane-mist:' + ctx.seed), count: 50, area: [56, 1.4, 560], center: [0, 0.9, 262], size: [16, 30], flatten: 0.2, softness: 1.0, ragged: 0.6, color: '#ffcda0', opacity: laneMistK, drift: [0.25, 0, -0.6], near: [0.7, 2.1] })) : null;      // (near is in puff widths: gone inside about 12 m, whole beyond 35)
    await ctx.yield();
    const rayCol = night ? '#9fb6ee' : golden ? '#ffc890' : '#ffe2b0', rayK = night ? 0.2 : dawn ? 0.8 : 0.3, sunDown = [-L.sunDir.x, -L.sunDir.y, -L.sunDir.z];
    set.add(fx.makeGodRays({ rng: rng.fork('rays'), position: toWorld(-6, 46, 150), direction: sunDown, radius: 60, count: 16, length: 100, color: rayCol, intensity: rayK }));
    // (round 15) SUN SHAFTS IN THE STACK, standing in the world: fourteen upright sheets of air across the view's line from the stack's
    // near side to the pond. Each lights only where the sun comes down past a deck's edge (the decks' own shadow function, so a shaft
    // leaves every gap between decks at the sun's angle and stays where it is as we pass), in drifting mist; nothing within 8 m of the eye.
    {
      const sp = [], su = [], si = [];
      for (let k = 0; k < 14; k++) {
        const lz = 150 + k * 20 + 9 * hsh0(k * 3.7), cx = flyX(lz), a = toWorld(cx - 85, 0, lz), b = toWorld(cx + 85, 0, lz), o = sp.length / 3;
        sp.push(a[0], 0.3, a[2], b[0], 0.3, b[2], b[0], 56, b[2], a[0], 56, a[2]); su.push(0, 0, 1, 0, 1, 1, 0, 1); si.push(o, o + 1, o + 2, o, o + 2, o + 3);
      }
      const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sgeo.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sgeo.setIndex(si);
      const smat = new THREE.ShaderMaterial({
        uniforms: { ...M.shared, uK: { value: golden ? 0.13 : shower ? 0.11 : dawn ? 0.035 : 0.03 }, uCol: { value: C(rayCol) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          ${GLSL_COMMON}
          uniform float uK; uniform vec3 uCol; varying vec3 vW; varying vec2 vUv;
          void main(){
            float d = distance(vW, cameraPosition); vec3 az = vec3(uHero.w, 0.0, uHero.z) * 7.0;
            float s0 = deckShade(vW), s1 = deckShade(vW + az), s2 = deckShade(vW - az);
            float xl = dot(vW.xz - uHero.xy, vec2(uHero.z, -uHero.w)), zl = dot(vW.xz - uHero.xy, vec2(uHero.w, uHero.z));
            float streak = smoothstep(0.38, 0.8, vn(vec2((xl + vW.y * 0.42) * 0.15 + zl * 0.012, zl * 0.05)) * 0.7 + vn(vec2((xl + vW.y * 0.42) * 0.5, zl * 0.05 + 4.0)) * 0.3);
            float shaft = s0 * (0.3 + 0.7 * (1.0 - s1 * s2)) * streak;
            float m = 0.3 + 0.7 * smoothstep(0.25, 0.75, vn(vec2(dot(vW.xz, vec2(uHero.z, -uHero.w)) * 0.045 + uTime * 0.015, vW.y * 0.09 - uTime * 0.012)));
            float a = shaft * m * uK * smoothstep(0.3, 5.0, vW.y) * (1.0 - smoothstep(40.0, 56.0, vW.y)) * smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x)
              * smoothstep(8.0, 30.0, d) * (1.0 - smoothstep(170.0, 320.0, d));
            if (a < 0.002) discard;
            gl_FragColor = vec4(uCol * (0.6 + 0.4 * uSunCol) * a, 1.0);
          }`,
      });
      const shafts = new THREE.Mesh(sgeo, smat); shafts.frustumCulled = false; shafts.renderOrder = 2.7; shafts.name = 'sun-shafts'; scene.add(shafts);
    }
    const rays2 = set.add(fx.makeGodRays({ rng: rng.fork('rays2'), position: dawn ? [-20, 40, 480] : [-62, 44, 404], direction: sunDown, radius: dawn ? 50 : 34, count: 12, length: 100, color: rayCol, intensity: rayK * (night ? 0.5 : 0.8) })), rays2K = rayK * (night ? 0.5 : 0.8);
    await ctx.yield();
    await sky.prewarm?.(ctx.renderer, null, scene);

    // u of the places the script is keyed to (the route is longer than it was: nothing is keyed to a bare number that a place decides)
    const pace = (u) => mix(mix(1.06, 0.98, sstep(0.54, 0.6, u)), 0.82, sstep(0.6, 0.72, u)) * (1 - 0.1 * lowW(u));      // (a little slower wherever the eye runs under saddle height, down among the bounding deer)
    let paceI = 0; for (let i = 0; i < 64; i++) paceI += 1 / (64 * Math.max(0.35, pace((i + 0.5) / 64)));
    const speedAt = (u) => LEN * paceI / 46 * pace(u);      // metres a second at u (the engine scales pace so the flight lasts its duration)
    const uCourt = path.nearestXZ(-14, 56).u, pv = new THREE.Vector3(), pv2 = new THREE.Vector3(), below = new THREE.Vector3();
    const cp = new THREE.Vector3(), tgt = new THREE.Vector3(), tgt2 = new THREE.Vector3(), riderK = dawn ? 0.3 : night ? 0.5 : 0.55;
    let laneE = -1, lastU = -1;
    return {
      scene, path, duration: 46, pace, ride: 'none', title: K.title,
      camera: { fov: 64, near: 0.3, nearThrough: 0.3, far: 4200, lookAhead: 28, sway: 0.5, bank: 0.3 },
      // the gaze: from the crane down the canyon at the herd; at the great stag running beside us on our left; the escalator cascade ahead-right
      // on the approach to the court; the stack under its bow at the reveal; as the view lifts through the veil, out over the pond at the herd under the
      // stepped decks; and from the glide on, the ring
      pois: [{ at: (time, u) => { path.pointAt(Math.min(1, u + 62 / LEN), pv); return below.set(pv.x, 1, pv.z); }, from: 0.125, to: 0.225, weight: 0.5 },
        { at: (time, u) => greatAt(u, pv2), from: 0.225, to: 0.374, weight: 0.34 },
        // the wide view: down the avenue from 14 m at the herd going over the court, the long fall and the stack under the bow
        { at: (time, u) => { path.pointAt(Math.min(1, u + 90 / LEN), pv); return below.set(pv.x + 8, 2, pv.z); }, from: 0.375, to: uCourt - 0.05, weight: 0.4 },
        // the escalator cascade while it faces us ahead and to the right, on the approach; over the court itself the gaze is level again
        // (held on it from beside the slot it looked hard down to the right: a tilted picture with the stair cut by the corner)
        { at: [6, -4, 32], from: uCourt - 0.085, to: uCourt - 0.004, weight: 0.42 },
        // the reveal's gaze is the brief's: the stack under its bow (the stag on the bridge end has no gaze key of its own)
        { at: [120, 28, -420], from: 0.53, to: 0.70, weight: 0.4 },
        { at: (time, u) => { path.pointAt(Math.min(1, u + 75 / LEN), pv); return below.set(pv.x, 1, pv.z); }, from: 0.645, to: 0.765, weight: 0.5 },
        { at: [130, 3, -432], from: 0.75, to: 0.97, weight: 0.6 },
        ...(rare ? [{ at: [eleAt[0], 3, eleAt[2]], from: 0.8, to: 0.875, weight: 0.45 }] : [])],
      portal: { shape: 'circle', radius: RING, color: night ? '#FFE9C8' : '#EFE6FF', glow: 1.3, revealDistance: 400 },
      post: { exposure: K.exposure, bloom: { strength: 0.38, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#141A2C', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u = 0) {
        const sh = M.shared;
        sh.uTime.value = time; sh.uSlate.value = slateAt(u);
        const fk = frontK(u), fzw = frontZ(u);
        M.water.uniforms.uRain.value = Math.max(rainAt(u), 0.8 * fk); M.water.uniforms.uFront.value.set(fzw, fk);
        if (veil) { veil.position.z = fzw; veil.material.uniforms.uK.value = fk * (0.75 + 0.25 * mood); }
        if (sprayBow) sprayBow.material.uniforms.uK.value = sprayBowK * sstep(0.5, 0.545, u) * (1 - sstep(0.6, 0.645, u));
        scene.fog.density = fogAt(u); scene.fog.color.copy(fogA).lerp(fogB, 0.8 * slateAt(u));
        cp.setFromMatrixPosition(camera.matrixWorld);
        // our own shadow on the water: where we are, which way we run, the stride's bob and the height of the leap
        path.tangentAt(u, tgt); const tl = Math.hypot(tgt.x, tgt.z) || 1, strideS = Math.sin(time * TAU * 2.6);
        sh.uRider.value.set(cp.x, cp.z, tgt.x / tl, tgt.z / tl); const alt = 1 - sstep(4.2, 6.5, cp.y);                               // our own shadow, spray and antlers are the stag's: gone while the view is off its back
        sh.uRiderK.value.set(u > 0 && ctx.through !== true ? riderK * mountShown(u) * alt : 0, strideS * 0.05 + Math.min(Math.max(0, cp.y - 3.2), 4), strideS);
        // the sun mask at the rider, eased over 0.4 s: herd light, antlers, rain and spray all follow it
        const lane = litAt(cp.x, 3, cp.z);
        const jump = laneE < 0 || Math.abs(u - lastU) > 0.02, ease = 1 - Math.exp(-Math.max(dt, 0) / 0.4);
        if (jump) laneE = lane; else laneE += (lane - laneE) * ease;
        lastU = u;
        // every herd is lit where it runs, not where we are: from the shade the leaders blaze in the lane ahead, from a lane the far deer are blue shapes
        for (let i = 0; i < gallopers.length; i++) {
          const g = gallopers[i]; path.pointAt(Math.min(1, u + g.lead / LEN), tgt2);
          const gl = litAt(tgt2.x - tgt.z / tl * g.side, 2, tgt2.z + tgt.x / tl * g.side);
          if (jump || g.e < 0) g.e = gl; else g.e += (gl - g.e) * ease;
          g.u.uSunColor.value.copy(g.sun0).multiplyScalar(0.24 + 0.56 * g.e); g.u.uSkyColor.value.copy(g.shade).lerp(g.sky0, g.e);
        }
        placeNear(u, camera, time); near.uniforms.uStrideLen.value = speedAt(u) / 2.6;      // hoof splashes and rings stay where the hoof went in
        slateMesh.position.set(cp.x, 1240, cp.z);
        sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera);
        hero.update(dt, time, camera);
        wind.update(time); grass.update(dt, time, camera); grass2.update(dt, time, camera); grass3.update(dt, time, camera);
        fallsW.uniforms.uTime.value = time; wistW.uniforms.uTime.value = time;
        if (mist.uniforms?.uOpacity) mist.uniforms.uOpacity.value = mistK * (1 - 0.88 * sstep(8, 22, cp.y));
        if (laneMist?.uniforms?.uOpacity) laneMist.uniforms.uOpacity.value = laneMistK * (1 - 0.92 * sstep(4.5, 10, cp.y)) * (1 - sstep(0.5, 0.6, u));
        if (rays2.uniforms?.uIntensity) rays2.uniforms.uIntensity.value = rays2K * (1 - sstep(3.4, 6, cp.y));      // (from the crane a shaft across the open sky is a streak on the lens)      // looked down on, drifting mist is flat discs on the water
        const bow = bowAt(u);
        bowA.uniforms.uIntensity.value = bow * (1 - bowSec); bowB.uniforms.uIntensity.value = bow * bowSec;
        rain.setOpacity(rainAt(u) * (0.25 + 0.75 * laneE)); spray.setOpacity((u > 0 ? 0.8 : 0.6) * (0.3 + 0.7 * laneE) * (0.35 + 0.65 * alt)); petals.setOpacity(mix(0.3, 1, sstep(0.5, 0.68, u)) * petalK);
        set.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
      },
      dispose() { sky.dispose?.(); },
    };
}

export default {
  id: 'stag-boulevard',
  name: 'A Hundred Springs Later',
  category: 'city',
  weirdness: 0.2,
  media: ['water', 'air'],
  async build(ctx) {
    await ctx.yield();                                         // the task that starts build() also carries the loading of the modules: none of our work rides in it
    buildWorld(null);                                          // compiled here, nothing run (no random draw, nothing made)
    await ctx.yield();
    return buildWorld(ctx);
  },
};
