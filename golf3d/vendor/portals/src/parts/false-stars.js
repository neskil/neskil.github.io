// THE FALSE STARS: hero set piece for "false-stars". A New Zealand glow-worm cave built as one river: the Grotto with
// the Chandelier (the sphere of stars), the Tube and the Flume (the gun barrel) down to the mouth in the cliff.
//
// Local space: +Y up, y = 0 is the still water, ORIGIN = the point on the water under the Chandelier. The boat enters at
// (0, 0.8, +49.5) travelling toward -Z (so "front" is +Z: the entry view looks down -Z at the Chandelier 49.5 m ahead).
// River distance s (metres from the entry): Grotto -31..112 (dome 30 m wide, 10 m high round the entry, a gallery, then a
// second hall at s = 86; the boat's line drifts in a slow S through it), Chandelier at s = 49.5, Tube 112..163 (7 m wide,
// a ~30 degree bend to the left), THE HALL OF THREADS 163..262 (a still lake 34 m wide under a dome 14 m high: a sky of
// worms, some 1,200 silk threads up to eight metres long strung with pearls of light, each doubled in the lake, pendants
// to five metres, the Organ, an island of wet flowstone columns under a great pendant, on the right near the far door, a
// smaller island on the left, and the boat's line swinging round them), a ~30 degree bend to the right in the Hall's throat
// (smooth rock with a few large soft scallops, a lane of worms on its roof joint), and
// the Flume 276..345 (6 m wide, 5 degrees down, level, lip kicking up 6 degrees, flaring to a mouth 9 x 7 m with a rock
// collar for the cliff). Section ends are the constants S_GROTTO, S_DOME0, S_DOME1, S_TUBE (the Flume's start), S_MOUTH.
//
// What is built
//   - Rock: three chunks (hero.chunks: grotto, tube, flume) from one swept ring grid; inward faces only, so from outside
//     the cave is a cutaway. Stalactites, curtains and the Chandelier (lobed boss, three folded skirts, 46 fringe
//     stalactites, lowest tip 2.2 m over the water) are merged in. Worm light is BAKED per vertex (aLight = direction +
//     irradiance blurred from the colony's density at three radii, aSky = cold light from the mouth); the fragment
//     shader adds limestone scallops (a smooth blend of jittered cells: dish hollows, soft cusps, no facets), strata,
//     wet glints; relief fades by fwidth where a dish would fall under a pixel. Black seam at the waterline.
//   - The colony: ~10,000 worms (x opts.density) as instanced additive sprites in clouds, lanes and rifts with a dense
//     band on the roof joint, ~1,000 on the Chandelier; never under 2 px, capped small up close, sized from the drawing
//     buffer every frame, breathing on their own clocks, dimming in ragged low patches behind the boat and relighting
//     over ~8 s. THE SMEAR: each cave light is drawn out along its own screen velocity over a shutter the world sets from
//     the boat's speed along the river (uShutter, uStreak; one law the whole way), so a near light is a long streak and a
//     far one a point; where the cap is lifted it is drawn as a comet, a round bright head with a tail that tapers and
//     dims behind it. The lights outside the cave (river distance > 9000) keep the plain point. The colony stands in
//     CLOUDS AND DARK LANES: toneField, a slow field in cave space (river distance, side, height), thins the baked light
//     and shrinks the worms in the lanes; scatterCores adds tight knots where the clouds are densest; scatterRightWall
//     lights the entry dome's right wall (s 38..88). Both take their own named streams and are flagged (ex 3, 4) so the
//     snares, drips and weta are dealt exactly as before them. uVoid (set by the world from river distance) lets the
//     Hall's unlit rock fall darker between the clouds.
//   - Snares: ~2,500 camera-facing cards under the worms near the boat's line and all over the Chandelier, six plumb
//     threads each with beads, drawn in the fragment shader with fwidth antialiasing; they sway and swing in our air.
//   - THE MIRROR IS BUILT, the whole river long: the water is one dark sheet of glass over the rock's image and the image
//     of every light. Grotto and Tube lie level, so their rock is drawn again flipped in y (grotto-mirror: shell,
//     Chandelier, 240 stalactites; tube-mirror: the whole chunk). The Flume slopes, so its image (flume-mirror) is worked
//     out at build: every vertex reflected in the water's own plane at its place on the river, shaded as the rock it shows
//     and seen from the eye's image; a pane of sky (mouth-image) stands in the mouth of that image, in a black trough.
//     Every image shivers with the water at the point where the eye meets it (bow V, the eel's wake, 12 drip rings, a slow
//     swell that grows with the current and rides with the boat), rock and lights by the same amount, so a light stays on
//     its rock. On quick water each light's image is drawn out toward the eye into a short soft streak of uneven length.
//     The sheet itself draws only what lies on the water: drifting flecks, the bow V's glints, chevrons off both walls, the
//     Flume's standing waves (oblique: each crest a V pointing downstream and only a piece of the stream wide, staggered left
//     and right, with a pale broken rising face, a soft dark back and a cap of froth in pieces), a ragged foam line and dead-water
//     fringe along every bay of the wall (the walls' feet are cut into bays, so the waterline is never ruled), the lip's
//     curl, and the lane of the mouth's blue from the disc toward the bow. It is never displaced, and nothing on it is drawn
//     out along the current, so nothing can rule it or beat against the pixels.
//   - The Hall's flowstone (hall-stone, hall-stone-mirror; its own shader): every column that stands in the lake is a stack
//     of three to six tiers, each swelling to a drip lip with fluted sides, a rounded or broken top and small stumps at
//     its foot. THERE IS NO LIGHT IN THE CAVE BUT THE WORMS, and nothing underground is warmer than green. The colony lives
//     on the ranks (colonise): clusters on the crowns, worms and short snares of beads under every drip lip, lanes down the
//     flutes; the light of each is baked onto the wet stone within about a metre of it (bakeWormLight, aWl), greener from
//     the clusters, bluer from the lanes. Each island also takes a dim side light from the cloud of the colony it faces,
//     columns shadowing their neighbours, the far side near black, with pin glints of the bluest light. Behind each rank a
//     brighter cloud on the far wall draws its outline (scatterCloud). Every island stands IN the water: a bank of rimstone
//     steps close under its outermost columns, a lit lip on each step, a dark wet foot, two or three rings on the lake round
//     it, and an image a quarter as bright broken into bands. The banks are low shelves (75 to 190 mm) with scalloped
//     rims, the stalagmites lean and taper, and the Hall's own rock image is held darker between two planes in world
//     space (uMirD at the neck's mouth, uMirE at the passage's end) so the lake is black water with lights in it. The
//     ranks' stone is drawn in three stages by the eye's river distance (setEyeS): each rank is put away 6 m after the
//     eye passes it. On quick water chevrons stand off both walls under the streaks (uChev). Drops fall into rings round the three ranks
//     (drips-hall, uHDrip). The great pendant over the far rank is the same stone hung point down, with worms and threads.
//   - The false Milky Way (scatterBand): the roof's central band of worms from the Hall's far door down the passage and the
//     Flume, on the axis of the real one that stands in the mouth, doubled in the water, with beaded threads let down from
//     it close over the bow (snares-short). The rock takes the colour of the colony over it: green under the clouds, blue
//     along the lanes (uHue, uCl); the shade is blue-black.
//   - Cast that belongs to the piece: nine cave weta on a bright curtain on the Chandelier's approach side (black
//     silhouettes; only antennae move), a 2.5 m longfin eel that crosses under the bow while the boat covers s = 8..27
//     (u 0.02..0.05), 12 drips.
//   NOT built (world coder): kayak, mayflies (also those that spiral up the great Organ), bats, ruru, the cliff, plume, forest, sky, the 600 outside worms (pass
//   their local positions in opts.extraWorms to draw them with the same sprites, unmirrored).
//
// opts: palette (7 hex, brief order; [1] relief blue, [2] worm colour, [3] zenith, [4] mist, [6] moon are used),
//   density 0.7..1.3 (colony size; default per seed), hue -1 greener .. +1 bluer (default per seed),
//   formations 'mixed' | 'straws' | 'draperies' (default per seed), hour 'night' | 'moonless' | 'dawn' | 'dusk' | 'day' |
//   'golden' (only sets the colour and strength of the light coming in at the mouth), weather 'rain' (roofs a metre
//   closer), eel false, extraWorms [[x,y,z],...], brightness (worm HDR peak, 4.2), glint (1), streak (1), gain (1).
//
// anchors (local space)
//   entry { position, direction }            the entry point (eye) and heading.
//   flyThrough [Vector3]                     the whole path: eye 0.8 m over the water every 6 m from the entry to
//                                            the lip (= cavePath), then arc (= anchors.arc: a 190 m glide out over the
//                                            gorge that ends 168 m out, 57 m down, 12 m left, last 60 m straight at 33 degrees).
//                                            Clearance in the cave is the brief's, not 6 m: walls >= 2.8 m either side,
//                                            roof >= 1.7 m and thread tips >= 1.2 m over the eye (enforced at build).
//   pathAt(s, out)                           eye point at river distance s.   sections { grotto, tube, flume, hall, bendEnd, caveU, caveLen, pathLength }
//   riverAt(d)                               river distance s for a distance d flown along flyThrough.   speedAt(s)   current speed (m/s)
//   portalSeat { position, normal, radius: 7, tilt: true }   end of the arc; normal points back up the dive.
//   chandelier { position, top, tip, width, dist }   weta [Vector3 x 9]   drips [Vector3]
//   mouth { position (lip, water level), eye, direction (6 degrees up), right, width, height }
//   plume { origin, velocity (22 m/s), gravity }     viewpoints { sphere, sphereLook, chandelierPass, tube, flume, flumeLook }
//
// Hooks: update(dt, time, camera) every frame. Everything scripted (wake, dimming, eel, streak length) is keyed to where
//   the boat is on the river, read from the camera each frame; nothing uses wall-clock time except ambient loops.
//   setProgress(u) overrides that with the journey u (cave = 0..sections.caveU = 0.646); setBoat(position, direction,
//   speed) overrides with an explicit local-space boat; setSky(color, k) sets the mouth light; hero.uniforms holds every
//   shared uniform (uGain, uBright, uSkyCol, uWormCol ...). Hide hero.object once the cave is out of sight (u > 0.75).
//
// Lighting: all materials are self-lit ShaderMaterials writing linear HDR and honouring scene fog; no scene lights are
//   used or added. Tuned for exposure ~1.6 underground with bloom (worms peak ~4, rock 2-10 percent). Keep cave fog
//   very thin or the far worms and the disc go grey. Keep the hero unscaled (rotate / translate only).
// Viewer: the piece never reads the URL or moves the camera; in tools/shot.mjs _part it is seen from the stock orbit.
// Size: radius ~206 (centre = midpoint of the river, y 3), height 11. Cost: ~235k triangles built (ctx.quality.detail thins
//   snares and mirrored worms; a dense colony trims the Flume's mirrored worms first), 19 draw calls, ~0.6 s build. The worms
//   are three sets ('worms' + 'worms-mirror' for the Grotto, 'worms-tube' + 'worms-mirror-tube' for the Tube and the Hall,
//   'worms-flume' + 'worms-mirror-flume' for the Flume and the outside ones) so the world can put each away once it is behind.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#03070B', '#0D1F2C', '#4FE0D6', '#0B1638', '#9DB2C6', '#27473F', '#E4EEF8'];
const V3 = THREE.Vector3, TAU = Math.PI * 2, RAD = Math.PI / 180;
const S0 = -30.6, S_GROTTO = 112, S_TUBE = 276, S_MOUTH = 345;     // distances along the river from the entry point (m); S_TUBE = where the Flume begins
const S_HALL = 86;                                                 // the second dome of the Grotto, beyond the Chandelier
const S_DOME0 = 122, S_DOME1 = 262;                                // the Hall of Threads: a still lake 140 m long under a high dome, from a short neck after the Grotto to the Tube's last bend
// the ranks of the Organ (river distance, metres right of the axis): a small rank in the Sphere, the Grotto's rank in the far hall, the door rank just inside
// the Hall, the great Organ in mid-lake, and the far rank near the Hall's end. No light comes into the cave but the colony's:
// the ranks carry their own worms (clusters on the crowns, under the drip lips, lanes down the flutes), each lighting the wet
// stone within about a metre of it, and a cloud of the colony on the wall behind each rank draws its outline.
const RANK_S = [21, -6.6], RANK_G = [97, -3.8], RANK_D = [S_DOME0 + 24, -6.0], RANK_T = [S_DOME0 + 74, 7.3], NISL = 5;
const domeK = (s) => smoothstep(S_DOME0, S_DOME0 + 19, s) * (1 - smoothstep(S_DOME1 - 24, S_DOME1, s));    // 0 in the passages .. 1 in the hall
const ENTRY_Z = 49.5, EYE = 0.8, NS = 41, DS = 0.5, NDRIP = 12, NHD = 10;
// the Hall's exit funnel and the passage to the Flume: a throat of smooth rock with a few large soft scallops (1 there, 0 elsewhere)
const softK = (s) => smoothstep(S_DOME1 - 40, S_DOME1 - 22, s) * (1 - smoothstep(S_TUBE + 4, S_TUBE + 26, s));

// ---------------------------------------------------------------- layout: river axis, widths, roof heights
function buildLayout(rng, noise, opts) {
  const flood = opts.weather === 'rain' ? 1 : 0;                       // after rain: the river a metre higher, roofs closer
  const bend = rng.range(27, 33) * RAD, R = 45, arc = R * bend;
  const a = rng.range(9, 14) * 0.6, b = rng.range(26, 32);            // (b is still drawn so that nothing after it moves)
  const k0 = S_GROTTO + a, k1 = k0 + arc, k3 = S_TUBE - 2, k2 = k3 - arc + 0 * b;  // left arc k0..k1 into the hall, right arc k2..k3 out of it
  const n = Math.round((S_MOUTH + 8 - S0) / DS) + 1;
  const ax = new Float32Array(n), ay = new Float32Array(n), az = new Float32Array(n), ap = new Float32Array(n);
  const i0 = Math.round((0 - S0) / DS);
  let x = 0, y = 0, z = ENTRY_Z, phi = 0;
  for (let i = i0; i < n; i++) {
    const s = S0 + i * DS;
    ax[i] = x; ay[i] = y; az[i] = z; ap[i] = phi;
    const kap = (s >= k0 && s < k1) ? 1 / R : (s >= k2 && s < k3) ? -1 / R : 0;
    const sl = -5 * RAD * smoothstep(S_TUBE, S_TUBE + 10, s) * (1 - smoothstep(S_MOUTH - 46, S_MOUTH - 34, s)) + 6 * RAD * smoothstep(S_MOUTH - 9, S_MOUTH - 1, s);
    phi += kap * DS; x += -Math.sin(phi) * DS; z += -Math.cos(phi) * DS; y += Math.tan(sl) * DS;
  }
  for (let i = i0 - 1; i >= 0; i--) { ax[i] = 0; ay[i] = 0; az[i] = ENTRY_Z + (i0 - i) * DS; ap[i] = 0; }
  const so = rng.range(0, 100);
  const L = {
    flood, k0, k1, k2, k3, n,
    axis(s, o) {                                                       // o: { x, y, z, phi, dx, dz, rx, rz }
      const f = clamp((s - S0) / DS, 0, n - 1.001), i = Math.floor(f), t = f - i;
      o.x = lerp(ax[i], ax[i + 1], t); o.y = lerp(ay[i], ay[i + 1], t); o.z = lerp(az[i], az[i + 1], t);
      const p = lerp(ap[i], ap[i + 1], t); o.phi = p;
      o.dx = -Math.sin(p); o.dz = -Math.cos(p); o.rx = Math.cos(p); o.rz = -Math.sin(p);
      o.slope = (ay[i + 1] - ay[i]) / DS;
      return o;
    },
    width(s) {                                                         // half width at the waterline
      if (s < -8) return 15 * Math.sqrt(Math.max(0.0, 1 - ((s + 8) / 23) ** 2)) + 0.4;
      const dome = 15.4 - 5.4 * smoothstep(-2, 24, s);
      const gal = 10 + 1.4 * noise.n2(s * 0.045, so) + 3.2 * Math.exp(-(((s - S_HALL) / 17) ** 2));
      let w = lerp(dome, gal, smoothstep(10, 30, s));
      w = lerp(w, 3.5 + 0.3 * noise.n2(s * 0.09, so + 7), smoothstep(S_GROTTO - 13, S_GROTTO + 5, s));
      w = lerp(w, 16.6 + 1.6 * noise.n2(s * 0.05, so + 13), domeK(s));
      w = lerp(w, 3.0 + 0.2 * noise.n2(s * 0.11, so + 9), smoothstep(S_TUBE - 6, S_TUBE + 8, s));
      const fl = smoothstep(S_MOUTH - 52, S_MOUTH, s);
      return w + 2.3 * fl * fl;
    },
    roof(s) {                                                          // roof height above the water
      let h;
      if (s < -8) h = 10 * Math.pow(Math.max(0.0, 1 - ((s + 8) / 23) ** 2), 0.42) + 0.3;
      else {
        const gal = clamp(5.1 + 1.9 * noise.n2(s * 0.06, so + 20), 3.6, 6.9);
        h = lerp(10, gal, smoothstep(4, 26, s));
        h = lerp(h, 6.7, Math.exp(-(((s - ENTRY_Z) / 9) ** 2)));
        h = lerp(h, 8.6, Math.exp(-(((s - S_HALL) / 15) ** 2)));
        h = lerp(h, 3.35 + 0.6 * noise.n2(s * 0.07, so + 31), smoothstep(S_GROTTO - 11, S_GROTTO + 5, s));
        h = lerp(h, 14.2 + 1.2 * noise.n2(s * 0.04, so + 37), Math.pow(domeK(s), 0.8));
        h = lerp(h, 3.5 + 0.45 * noise.n2(s * 0.05, so + 43), smoothstep(S_TUBE - 6, S_TUBE + 10, s));
        const fl = smoothstep(S_MOUTH - 58, S_MOUTH, s);
        h += (8.3 - 3.5) * fl * fl;
      }
      return Math.max(0.5, h - flood * (s > S_GROTTO - 10 ? 0.55 : 1.0) * smoothstep(-28, -8, s));
    },
    camX(s) {                                                          // camera line, metres right of the axis: a slow S through the Grotto, a swing round the hall's island
      return -2.5 * smoothstep(10, 41, s) * (1 - smoothstep(56, 80, s)) + 3.4 * smoothstep(58, 84, s) * (1 - smoothstep(89, S_GROTTO - 5, s))
        + 2.2 * smoothstep(S_DOME0 + 6, S_DOME0 + 22, s) * (1 - smoothstep(S_DOME0 + 30, S_DOME0 + 54, s)) - 2.6 * smoothstep(S_DOME0 + 44, S_DOME0 + 68, s) * (1 - smoothstep(S_DOME1 - 22, S_DOME1 - 4, s));
    },
    domeK,
    // 0 still .. 1 flume. The Tube quickens, the hall is a lake where the river all but stops, then the Flume takes it.
    flow(s) { return Math.min(1, 0.02 + 0.45 * smoothstep(S_GROTTO - 12, S_GROTTO + 36, s) * (1 - 0.94 * smoothstep(S_DOME0 - 8, S_DOME0 + 14, s)) + 0.02 * domeK(s) + 0.96 * smoothstep(S_DOME1 - 10, S_TUBE + 40, s) * (0.44 + 0.56 * smoothstep(S_TUBE - 10, S_TUBE + 40, s))); },
    speed(s) {                                                         // the boat's speed (m/s) at river distance s
      if (s < S_GROTTO - 12) return lerp(3, 6, clamp(s / (S_GROTTO - 12), 0, 1));
      const tube = lerp(6, 11, smoothstep(S_GROTTO - 12, S_DOME0, s)), hall = lerp(tube, 4.2, smoothstep(S_DOME0 - 6, S_DOME0 + 16, s));
      return lerp(hall, lerp(16, 28, clamp((s - S_TUBE) / (S_MOUTH - S_TUBE), 0, 1)), smoothstep(S_DOME1 - 12, S_TUBE + 6, s));
    },
  };
  return L;
}

// The colony's own range of colour: where it is greener (0) and where bluer (1), in patches some fifteen metres across. Sines
// only, so the script (which tints each worm) and the shaders (which tint the light on the rock) get the same field.
const hueField = (x, y, z) => 0.5 + 0.27 * Math.sin(x * 0.19 + 1.3 + 1.6 * Math.sin(z * 0.11 + 0.7)) + 0.23 * Math.sin(z * 0.23 + 0.4 + 1.4 * Math.sin(x * 0.13 + y * 0.21));
const GL_HUE = /* glsl */`
float hueF(vec3 p){ return 0.5+0.27*sin(p.x*0.19+1.3+1.6*sin(p.z*0.11+0.7))+0.23*sin(p.z*0.23+0.4+1.4*sin(p.x*0.13+p.y*0.21)); }
`;
// ---------------------------------------------------------------- shared GLSL
const GL_HASH = /* glsl */`
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=h31(i), b=h31(i+vec3(1,0,0)), c=h31(i+vec3(0,1,0)), d=h31(i+vec3(1,1,0));
  float e=h31(i+vec3(0,0,1)), g=h31(i+vec3(1,0,1)), h=h31(i+vec3(0,1,1)), k=h31(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z); }
`;
// The ripple field of the mirror: bow V, the eel's wake, drip rings, and a shimmer that grows with the current.
// Returns (slope.x, slope.z, amount). No textures, no derivatives, fixed loop.
const GL_RIPPLE = /* glsl */`
uniform vec4 uBoat;      // xz of the bow, xz of its heading (unit)
uniform vec4 uBoatP;     // speed m/s, wake strength 0..1, time, unused
uniform vec4 uEel;       // xz, heading xz
uniform float uEelOn;
uniform vec4 uDrip[${NDRIP}];   // x, z, period, phase
vec3 wakeV(vec2 p, vec2 o, vec2 d, float sc, float t){
  vec2 r=(p-o)/sc; float z=-dot(r,d); float x=r.x*d.y-r.y*d.x;
  float inside=z*0.6+0.3-abs(x);
  float m=smoothstep(0.0,0.45,inside)*smoothstep(-0.4,0.8,z)*exp(-max(z,0.0)*0.05)*(0.3+0.7*exp(-max(inside,0.0)*0.5));
  float sg=x<0.0?-1.0:1.0;
  vec2 dn=vec2(d.y,-d.x)*sg*0.94+d*0.34;
  return vec3(dn*cos(inside*13.0-t*6.5)*m, m);
}
vec3 rippleField(vec2 p, float flow){
  float t=uBoatP.z;
  vec3 r=wakeV(p,uBoat.xy,uBoat.zw,1.0,t)*uBoatP.y*0.3;
  r+=wakeV(p,uEel.xy,uEel.zw,0.4,t*1.4)*uEelOn*0.22;
  for(int i=0;i<${NDRIP};i++){
    vec4 ds=uDrip[i]; float tt=fract(t/ds.z+ds.w)*ds.z;
    vec2 q=p-ds.xy; float dd=length(q); float w=dd-tt*0.6-0.05;
    float a=exp(-w*w*14.0)*exp(-tt*0.75);
    r.xy+=q/max(dd,0.02)*a*sin(w*16.0)*0.2; r.z+=a*0.5;
  }
  // the current's own shimmer rides with the boat (we drift on the water we look at), so it is a slow swell at any speed
  vec2 q0=p-uBoat.xy;
  vec2 sh=vec2(sin(q0.x*1.7+t*0.9+sin(q0.y*1.1-t*0.6)), sin(q0.y*2.1-t*1.1+sin(q0.x*1.3+t*0.5)));
  vec2 sh2=vec2(sin(q0.x*5.3-t*3.1+q0.y*2.0), sin(q0.y*4.7+t*2.7-q0.x*1.6));
  float amb=0.006+0.034*flow;
  r.xy+=sh*amb+sh2*amb*0.3*flow; r.z+=amb*2.0;
  return r;
}
`;
const GL_FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    col *= 1.0-smoothstep(fogNear,fogFar,vFogDepth);
  #endif
#endif
`;

// ---------------------------------------------------------------- rock (shell, formations, Chandelier, and their mirror)
const ROCK_VERT = /* glsl */`
attribute vec4 aLight; attribute float aSky, aSoft; attribute vec3 aOrg, aPl;
uniform float uMirror, uFlowC; uniform vec3 uCamL;
varying vec3 vP, vN, vL, vCam; varying float vIrr, vSky, vSoft, vNear;
#include <fog_pars_vertex>
${GL_RIPPLE}
// uMirror 0: the rock. 1: its image in level water (the mesh is flipped in y by its matrix). 2: its image in the Flume's sloping
// water (position is already the image; aOrg is the rock it is the image of, aPl the water's normal there). An image is shaded
// as the rock it shows, seen from the eye's own image, and it shivers with the water at the point where the eye meets it.
void main(){
  vec3 p=position; vP=position; vCam=uCamL; vSoft=aSoft; vNear=100.0;
  if(uMirror>0.5){
    float hd;
    if(uMirror>1.5){
      vNear=length(uCamL-position);
      vP=aOrg; hd=max(0.5*dot(aOrg-position,aPl),0.0);
      vec3 Vm=uCamL-position; vCam=aOrg+Vm-2.0*dot(Vm,aPl)*aPl;
    } else { hd=max(position.y,0.0); vCam=vec3(uCamL.x,-uCamL.y,uCamL.z); }
    vec2 H=mix(uCamL.xz,position.xz,${EYE.toFixed(2)}/(${EYE.toFixed(2)}+hd));
    vec3 rp=rippleField(H,uFlowC); p.xz+=rp.xy*(hd+0.15)*1.45;
  }
  vN=normal; vL=aLight.xyz; vIrr=aLight.w; vSky=aSky;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
uniform vec3 uCamL, uWormCol, uRockCol, uSkyCol, uMouth, uAmb, uLift, uColA, uColB;
uniform vec4 uMirD, uMirE; uniform float uMirK, uVoid;      // the Hall's lake: where it begins (x, z, heading), where it ends, how bright the rock's image is in it
uniform float uMirror, uGain, uGlint, uRockK, uRel, uCalm, uRimK, uEven, uHue;
uniform vec4 uCl[5];             // the clouds of the colony behind the ranks: centre, 1 / radius squared
varying vec3 vP, vN, vL, vCam; varying float vIrr, vSky, vSoft, vNear;
#include <fog_pars_fragment>
${GL_HASH}
${GL_HUE}
vec3 h33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
// Limestone scallops as a SMOOTH field: the eight surrounding jittered cell centres are blended with exponential weights
// (a smooth minimum of the squared distances), so the offset to "the nearest centre" turns over softly on the cusps
// instead of jumping, and no flat facet or slat can form. Returns the blended offset; f = smooth squared distance.
vec3 scallop(vec3 p, out float f){
  vec3 ip=floor(p-0.5), acc=vec3(0.0); float ws=0.0, fs=0.0;
  for(int i=0;i<2;i++) for(int j=0;j<2;j++) for(int k=0;k<2;k++){
    vec3 c=ip+vec3(float(i),float(j),float(k));
    vec3 dd=p-(c+0.5+(h33(c)-0.5)*0.5);
    float d2=dot(dd,dd), w=exp(-d2*11.0);
    acc+=dd*w; fs+=d2*w; ws+=w;
  }
  ws=max(ws,1e-5); f=fs/ws; return acc/ws;
}
void main(){
  vec3 N=vN/max(length(vN),1e-4);
  vec3 q=vP;
  vec3 fq=fwidth(q); float px=max(fq.x,max(fq.y,fq.z));        // metres of rock under one pixel (taken before any loop)
  vec3 V=vCam-vP; V=V/max(length(V),1e-3);
  float facing=clamp(dot(N,V),0.0,1.0);
  // relief fades where a dish would be squeezed under a pixel or two (far down the barrel, at grazing angles)
  float k1=(1.0-smoothstep(0.03,0.11,px))*mix(0.3,1.0,smoothstep(0.05,0.45,facing));       // (far rock is smooth, glow-lit limestone: a dish under three pixels across is a moire, not a scallop)
  float k2=(1.0-smoothstep(0.012,0.04,px))*mix(0.35,1.0,smoothstep(0.05,0.45,facing));
  float dRel=1.0-0.88*smoothstep(8.0,28.0,length(vCam-vP)); k1*=dRel; k2*=dRel;
  float soft=max(vSoft,uEven);                                        // (uEven: the world asks for the same soft rock where a flooded roof is an arm's length off)
  k1*=1.0-soft; k2*=1.0-0.8*soft;                                     // the Hall's throat: smooth rock, no small dishes at all
  float flow=step(vSky,-0.5); k1*=1.0-0.85*flow; k2*=1.0-0.6*flow;      // flowstone (the Hall's stalagmites and islands): smooth and wet, no scallops      // and at any resolution the far walls are calm
  // limestone scallops: dish-shaped hollows with soft cusps between them (two sizes), then grain and strata
  float f1a; vec3 d1a=scallop(q*1.75+vec3(vn3(q*0.7)*0.8),f1a);
  float f1b; vec3 d1b=scallop(q*0.8+vec3(vn3(q*0.37+3.0)*0.7)+19.0,f1b);                 // and patches of big ones, well over a metre across
  float szm=smoothstep(0.36,0.64,vn3(q*0.19+31.0));
  float f1=mix(f1a,f1b,szm); vec3 d1=mix(d1a,d1b*1.3,szm);
  float lk=smoothstep(0.05,0.22,vIrr);                                 // scallops show where the colony's light rakes them; dim rock between the clouds of light is smooth and dark
  float f2; vec3 d2=scallop(q*6.1+7.3,f2);
  d1-=N*dot(d1,N); d2-=N*dot(d2,N);
  float f0; vec3 d0=scallop(q*0.33+vec3(vn3(q*0.19+5.0)*0.9),f0); d0-=N*dot(d0,N);      // a few large soft scallops, three metres across (the throat only)
  float n1=vn3(q*1.3), n2=vn3(q*5.0+3.7), fine=mix(0.5,vn3(q*23.0),k2);
  float sc1=0.45+0.8*smoothstep(0.3,0.7,vn3(q*0.23+11.0));
  vec3 n=N-d1*(1.3*sc1*k1*(1.0-0.55*uCalm))-d2*0.34*k2-d0*(0.8*soft)+N*(fine-0.5)*0.12; n=n/max(length(n),1e-3);
  float strata=vn3(vec3(q.x*0.3,q.y*2.3,q.z*0.3));
  float alb=(0.25+0.2*n1+0.10*strata+0.08*fine)*(0.8+0.3*k1*smoothstep(0.10,0.30,f1))*(0.93+0.12*k2*smoothstep(0.08,0.24,f2));   // dish floors darker and wet, cusps pale
  alb=mix(alb,0.31+0.12*n1+0.06*strata,soft);
  float lv=length(vL);
  float form=1.0-smoothstep(0.55,0.85,lv);                         // stalactites and curtains carry a short light vector: they stay black against the glow
  vec3 L=vL/max(lv,1e-3);
  float difF=0.22+0.26*uCalm, dif=difF+(1.0-difF)*max(dot(n,L),0.0);      // uCalm: the narrow passages, where the walls are an arm's length off and their relief is eased to soft scallops
  vec3 R=reflect(-V,n);
  float wet=smoothstep(0.4,0.75,n2)*0.8+0.2;
  float sp=max(dot(R,L),0.0); sp*=sp; sp*=sp; sp*=sp; sp*=sp; sp*=sp;        // ^32
  float irrC=max(vIrr,0.0)/(1.0+uRockK*max(vIrr,0.0));                                // the world may hold the brightest rock down (dense colony, close walls): dim relief keeps its light
  // the colony's light raked across the scallops (the baked direction with most of its head-on part taken out, leaning to
  // the roof): the side of each dish that faces it and the cusps are lit, the far sides and the dish floors are not
  vec3 Lr=L-N*(dot(L,N)*0.72)+vec3(0.0,0.3,0.0); Lr=Lr/max(length(Lr),1e-3);
  float relK=mix(mix(0.42,1.0,lk),1.0,uCalm);
  float rel=clamp(0.5+1.25*(dot(n,Lr)-dot(N,Lr))*relK+0.3*(smoothstep(0.08,0.32,f1)-0.55)*k1*relK+0.14*(smoothstep(0.04,0.3,f0)-0.5)*soft+0.2*(n1-0.5)*(1.0-0.6*uEven),0.0,1.0);
  rel=mix(rel,0.5+(rel-0.5)*0.4,uEven);                              // (a flooded roof an arm's length off: the swing is eased, so no side of a scallop falls to black)
  // the light on the rock is the colour of the colony over it: greener under its clouds, bluer along its lanes (uHue: how far
  // the two are told apart; the Hall and all after it)
  float cgr=0.0;
  vec3 pm=vec3(vP.x,abs(vP.y),vP.z);                                 // (an image takes the colour of what it is the image of)
  for(int i=0;i<5;i++){ vec3 dc=pm-uCl[i].xyz; cgr+=exp(-dot(dc,dc)*uCl[i].w); }
  float hq=0.5+(hueF(pm)-0.5)*mix(2.2,3.6,uHue)-0.85*min(cgr,1.0)*uHue;
  vec3 wc=max(mix(uColA,uColB,clamp(hq,-0.45,1.5)),vec3(0.0));
  vec3 lit=mix(wc,uRockCol,mix(0.6,0.3,uHue))*alb*irrC*dif*mix(1.0,mix(0.35,1.65,rel),uRel) + wc*irrC*sp*wet*uGlint*2.2*(0.35+0.65*k1);
  // cold sky light finding its way in from the mouth: mid-dark wet rock with pin glints, never a white wall
  vec3 Lm=uMouth-vP; float dm=max(length(Lm),1e-3); Lm/=dm;
  vec3 ns=N*0.3+n*0.7; ns=ns/max(length(ns),1e-3);
  float sm=max(dot(reflect(-V,ns),Lm),0.0); float sm6=sm*sm*sm; sm6*=sm6; float sm2=sm6*sm6; sm2*=sm2;
  float skv=max(vSky,0.0), skd=skv*sqrt(skv)*sqrt(sqrt(skv)), sks=sqrt(skv)*sqrt(sqrt(skv));      // diffuse dies in 30 m; the wet glints carry 100 m
  lit+=uAmb*alb*(0.55+0.45*dif)*(1.0-0.6*form);
  // a pedestal of dim blue-green that follows the same relief, so the lit sides and the cusps sit well over the display curve's
  // cliff and the far sides and the dish floors fall under it: wet modelled rock, not an even glow
  // (uVoid, the Hall and the neck: the pedestal follows the colony's light, so the rock under a cloud of lights is modelled
  // relief and the lanes and voids between the clouds are plain dark rock: the walls are not one even tone)
  float ped=mix(1.0,mix(0.58,1.12,smoothstep(0.02,0.17,max(vIrr,0.0))),uVoid);
  lit+=uLift*ped*mix(mix(0.42,1.7,rel),1.0,0.5*uCalm)*mix(0.93,1.0,max(lk,uCalm))*(0.75+0.55*alb)*(1.0-0.55*form)*(uMirror>0.5?1.4:1.0)*(1.0+0.45*soft);     // (an image is seen through the dark sheet: its relief is lifted to land where the rock's does)
  float rim=1.0-facing; lit+=uWormCol*(vIrr*flow*(1.5*rim*rim*rim+(uMirror>0.5?0.0:0.55*(1.0-smoothstep(0.0,0.14,vP.y)))));     // and a wet line of light where it stands in the lake     // flowstone columns: a wet edge that takes the false sky's light
  // what hangs from the roof is black against the glow, with a wet rim of the colony's light down each side (so is every edge of lit rock)
  lit+=uWormCol*(uRimK*rim*rim*rim*(form*(0.07+0.5*vIrr)+(1.0-form)*0.2*vIrr)*(1.0-flow));
  lit+=uSkyCol*(skd*alb*(0.30+0.70*max(dot(n,Lm),0.0))*0.7+sks*(sm2*(0.2+0.8*wet)*0.9+sm6*(0.3+0.7*wet)*0.16)*(0.25+0.75*k1)*uGlint);
  if(uMirror>1.5) lit=mix(uLift*1.7+uAmb*1.1,lit,smoothstep(3.0,11.0,vNear));      // right under the eye the Flume's image is a few stretched triangles: it dissolves into the sheet's own dim tone
  if(uMirror>0.5) lit*=0.9-0.4*flow;                                 // (a column's image is dimmer than the column: the waterline reads)
  // The Hall's lake is a still black mirror: it holds every light and the towers that stand in it, and of the walls and the
  // dome only a dim image. A rule of the place: from the neck's mouth (uMirD) to the passage's end (uMirE), eased at both.
  if(uMirror>0.5&&uMirror<1.5) lit*=mix(1.0,uMirK,smoothstep(-2.0,12.0,dot(vP.xz-uMirD.xy,uMirD.zw))*(1.0-smoothstep(-44.0,-8.0,dot(vP.xz-uMirE.xy,uMirE.zw))));
  gl_FragColor=vec4(lit*uGain,1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- worms (and their mirror images)
const WORM_VERT = /* glsl */`
attribute vec3 iPos, iMir, iPar2;      // iPar2: river distance s, flow 0..1, water height there
attribute vec4 iPar;                   // size (m), phase, tint -1..1, how much a wake slap dims it
uniform float uFlip, uTime, uBoatS, uRelight, uShutter, uGain, uBright, uFlowC, uStreak, uAhead;
uniform vec2 uRes; uniform vec3 uCamL, uVelL, uColA, uColB;
varying vec2 vUV; varying float vLen, vSoft, vCom; varying vec3 vCol;
#include <fog_pars_vertex>
${GL_RIPPLE}
void main(){
  vec3 c=iPos; float stretch=1.0, dimM=1.0, velK=1.0; vec3 ext=vec3(0.0); vSoft=0.0;
  if(uFlip>0.5){
    c=iMir;
    float hd=max(iPar2.z-c.y,0.0);
    vec2 H=mix(uCamL.xz,c.xz,${EYE.toFixed(2)}/(${EYE.toFixed(2)}+hd));
    vec3 rp=rippleField(H,uFlowC);
    c.xz+=rp.xy*(hd+0.15)*1.45;                                     // the same shiver as the rock's image: a light stays on its rock
    stretch=1.0+min(rp.z*5.0,0.8);
    dimM=0.8/(1.0+rp.z*1.2);
    // on quick water the image of each light is drawn out toward the eye into a long soft streak (it is a reflection on a
    // rough surface, not a light that streaks past); the streaks are of uneven length, soft at both ends
    float fq=smoothstep(0.04,0.34,iPar2.y);
    vec2 te=uCamL.xz-c.xz; te=te/max(length(te),1e-3);
    ext=vec3(te.x,0.0,te.y)*((0.3+0.42*hd)*0.5*fq*(0.55+0.9*fract(iPar.y*13.7)));
    velK=1.0-0.8*fq; vSoft=fq*0.7;
    dimM*=mix(1.0,0.8,fq);                                          // an image is never brighter than its light
  }
  vec4 mvPosition=modelViewMatrix*vec4(c,1.0);
  // A LIGHT IN THE SMEAR IS A COMET (the cave's lights themselves, uFlip 0, wherever the world has lifted the cap uStreak
  // with our speed): its head is the light, where it is now; its tail runs back along our travel to where the light stood a
  // moment ago (uShutter seconds of our own velocity, so the length on screen is our speed and its nearness: an arm's length
  // overhead a long stroke, across the hall a still point). An image on the water (uFlip 1) keeps its soft two-ended shimmer.
  // Where the cap is not lifted (the Sphere, the Hall, the open air) and for the lights of the banks outside (river distance
  // 9999) every light is the round point it always was.
  float capW=mix(1.15,uStreak,step(iPar2.x,9000.0));
  float comet=(1.0-step(0.5,uFlip))*step(1.16,capW);
  vCom=comet;
  vec3 vv=mat3(modelViewMatrix)*(uVelL*(uShutter*mix(0.5*velK,0.62+0.7*fract(iPar.y*5.31),comet))+ext);
  vec4 mA=vec4(mvPosition.xyz-vv*(1.0-comet),1.0), mB=vec4(mvPosition.xyz+vv,1.0);
  float zc=min(mvPosition.z,-0.05); mA.z=min(mA.z,-0.05); mB.z=min(mB.z,-0.05);
  vec4 pC=projectionMatrix*vec4(mvPosition.xy,zc,1.0), pA=projectionMatrix*mA, pB=projectionMatrix*mB;
  vec2 hr=0.5*uRes;
  vec2 d=pB.xy/pB.w*hr-pA.xy/pA.w*hr; float len=length(d);
  vec2 dir=len>0.5?d/len:vec2(1.0,0.0);
  float rTrue=iPar.x*projectionMatrix[1][1]*hr.y/(-zc);
  float r=clamp(rTrue,1.0,max(1.6,uRes.y*0.0062)), e=r*2.6;
  // In still water (the Sphere, the Hall) a light is a round point, drawn out by no more than its own width. Where the current
  // takes hold (the neck, and from the Hall's far door down the Flume) the world lifts uStreak (the cap, in widths) with our
  // speed and the lights are drawn out along our motion: comets, longer with speed and nearness.
  len=min(len,r*(uFlip>0.5?1.15+(capW-1.15)*0.3:capW)*(1.0+0.5*vSoft));      // (an image on the water is drawn out a third as far: the water never carries ruled lanes of light)
  float smK=clamp((capW-1.15)*0.25,0.0,1.0);                    // 1 where the world has lifted the cap: the smear
  float sy=len>0.5?mix(1.0,mix(mix(0.55,0.42,smK),1.15,vSoft),smoothstep(0.5,4.0,len/e)):stretch;
  if(comet>0.5) sy=1.0;                                             // the head stays a round point
  float along=comet>0.5?mix(-e,len+e,position.x*0.5+0.5):position.x*(len*0.5+e);
  vec2 px=pC.xy/pC.w*hr+dir*along+vec2(-dir.y,dir.x)*position.y*e*sy;
  gl_Position=vec4(px/hr*pC.w,pC.z,pC.w);
  if(mvPosition.z>-0.08) gl_Position=vec4(0.0,0.0,2.0,1.0);
  vUV=vec2(along/e,position.y); vLen=comet>0.5?len/e:len*0.5/e;
  if(comet>0.5) vSoft=0.0; else if(uFlip<0.5) vSoft=0.6*smoothstep(1.0,4.0,vLen);
  float br=0.7+0.3*sin(uTime*(0.3+0.5*fract(iPar.y*7.31))+iPar.y*6.2832);
  float dl=uBoatS-iPar2.x-4.0;
  br*=1.0-0.93*iPar.w*smoothstep(0.0,2.5,dl)*(1.0-smoothstep(uRelight*0.2,uRelight,dl));
  br*=max(pow(clamp(rTrue/r,0.0,1.0),1.4),0.05)*(1.0+0.35*clamp(rTrue/r-1.0,0.0,2.0));
  if(comet<0.5) br*=(uFlip>0.5?1.0-0.35*smK:1.0)/((1.0+vLen*mix(0.22,0.5,smK))*sqrt(max(sy,1.0)));      // (a comet's head is as bright as the still light: only an image thins as it is drawn out)
  br*=1.0+uAhead*smoothstep(7.0,26.0,iPar2.x-uBoatS);              // seen down a passage the hall beyond is the brighter place: a lit door, never a dark pane
  vCol=mix(uColA,uColB,iPar.z*0.5+0.5)*(br*uBright*dimM*uGain);
  #include <fog_vertex>
}`;
const WORM_FRAG = /* glsl */`
uniform float uFlip;
varying vec2 vUV; varying float vLen, vSoft, vCom; varying vec3 vCol;
#include <fog_pars_fragment>
void main(){
  if(vCom>0.5){
    // the comet: a round bright head at the light, and behind it a tail that narrows and dies away along our travel
    float x=vUV.x, y=vUV.y, L=max(vLen,1e-3), r2h=x*x+y*y;
    float edge=clamp(1.0-r2h,0.0,1.0); edge*=edge;
    float head=exp(-r2h*11.0)*sqrt(edge)+exp(-r2h*3.6)*0.13*edge;
    float g=clamp(x/L,0.0,1.0), w=mix(0.8,0.24,g), yy=y/w, ey=clamp(1.0-yy*yy,0.0,1.0);
    float tail=exp(-yy*yy*9.0)*ey*ey*exp(-1.5*g)*(1.0-g)*sqrt(1.0-g)*smoothstep(-0.3,0.4,x)*0.5*smoothstep(0.25,1.5,vLen);      // (it dies away over its whole length: a stroke, not a stub)
    vec3 col=vCol*(head+tail);
    col+=vec3(0.3)*dot(vCol,vec3(0.33))*exp(-r2h*22.0);
    ${GL_FOG_ADD}
    gl_FragColor=vec4(col,1.0);
    return;
  }
  float dx=max(abs(vUV.x)-vLen,0.0); float r2=dx*dx+vUV.y*vUV.y;
  float edge=clamp(1.0-r2,0.0,1.0); edge*=edge;                    // everything is gone well inside the card: no plate, no square
  float core=exp(-r2*mix(11.0,6.5,clamp(vSoft*2.5-1.5,0.0,1.0))), halo=exp(-r2*3.6)*0.13*edge;   // only an image on quick water is softened
  float gx=vUV.x/(vLen+1.0);
  float taper=mix(1.0,exp(-gx*gx*4.2)*1.1,vSoft);                  // a streak fades toward both ends: a smear of light, never a dash
  vec3 col=vCol*(core*sqrt(edge)+halo)*taper;
  col+=vec3(0.3)*dot(vCol,vec3(0.33))*core*core*taper;
  ${GL_FOG_ADD}
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- snares: plumb silk threads strung with beads
const SNARE_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;      // length (m), seed, card width (m), river distance
uniform vec3 uCamL, uVelL; uniform float uTime;
varying vec2 vUV; varying vec4 vPar; varying float vFade;
#include <fog_pars_vertex>
void main(){
  vec3 tc=uCamL-iPos; float dist=length(tc);
  vec3 rt=vec3(tc.z,0.0,-tc.x); rt=rt/max(length(rt),1e-3);
  float v=position.y;
  vec3 p=iPos+rt*(position.x*iPar.z*0.5)-vec3(0.0,v*iPar.x,0.0);
  float nearK=exp(-dist*dist/12.0);
  vec2 sw=vec2(sin(uTime*1.3+iPar.y*40.0),cos(uTime*1.1+iPar.y*23.0))*0.016
         +uVelL.xz*0.014*nearK*(0.6+0.4*sin(uTime*3.0+iPar.y*9.0));
  p.xz+=sw*v*v*(iPar.x/0.3);
  vUV=vec2(position.x*0.5+0.5,v); vPar=iPar; vFade=1.0-smoothstep(16.0,38.0,dist);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SNARE_FRAG = /* glsl */`
uniform vec3 uWormCol, uCamL; uniform float uGain, uTime;
varying vec2 vUV; varying vec4 vPar; varying float vFade;
#include <fog_pars_fragment>
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
void main(){
  vec2 fw=fwidth(vUV);
  float W=vPar.z, Lm=vPar.x;
  float pxm=max(fw.x*W,1e-5);
  float lw=max(pxm*0.6,0.0004);
  float thin=min(1.0,0.0009/lw+0.18);
  float ym=vUV.y*Lm;
  float acc=0.0, bead=0.0;
  for(int k=0;k<6;k++){
    float fk=float(k);
    float xk=(fk+0.5)/6.0+(h11(vPar.y*91.7+fk*3.1)-0.5)*0.13;
    float lk=0.3+0.7*h11(vPar.y*57.3+fk*7.7);
    float dxm=abs(vUV.x-xk)*W;
    float on=1.0-smoothstep(lk-0.03,lk,vUV.y);
    acc+=(1.0-smoothstep(lw*0.5,lw*1.5,dxm))*thin*on;
    float sp=0.013+0.012*h11(vPar.y*13.1+fk*5.3);
    float yb=ym/sp+h11(vPar.y*3.3+fk);
    float id=floor(yb); float dym=(yb-id-0.5)*sp;
    float rb=0.0016+0.0016*h11(id*7.7+fk*31.0+vPar.y*17.0);
    float dd=length(vec2(dxm,dym));
    float b=(1.0-smoothstep(max(rb-pxm*0.5,0.0),rb+pxm,dd))*min(1.0,rb*rb/(pxm*pxm)*4.0+0.05);
    float tw=0.5+0.5*sin(id*12.9+fk*4.0+uCamL.x*5.0+uCamL.z*5.0+uTime*0.7);
    bead+=b*on*(0.35+1.65*tw*tw*tw);
  }
  vec3 col=(uWormCol*acc*0.22+mix(uWormCol,vec3(0.56,0.78,1.0),0.55)*bead*1.6)*(1.0-0.7*vUV.y)*vFade*uGain;     // silk beads: the palest, bluest white in the cave
  col+=vec3(0.55,0.75,1.0)*bead*bead*0.3*vFade*uGain;
  ${GL_FOG_ADD}
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- the Hall's threads: silk metres long, strung with pearls of light
// One camera-facing ribbon per thread, never under about four pixels wide, so a thread is a soft hair of light and its beads
// are round pearls at any distance; far off the pearls run together into a lit hair. uFlip 1: its image in the still lake.
const THREAD_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;      // length (m), seed, sway at the tip (m), the water's height under it
uniform vec3 uCamL, uVelL; uniform vec2 uRes; uniform float uTime, uFlip, uFlowC;
varying vec3 vT; varying vec4 vK;               // vT: metres across, metres down the thread, metres per pixel   vK: seed, brightness, length, 0..1 down the thread
#include <fog_pars_vertex>
${GL_RIPPLE}
void main(){
  float v=position.y, len=iPar.x, h=iPar.y;
  vec3 p=iPos; p.y-=v*len;
  float d0=length(uCamL.xz-iPos.xz);
  vec2 sw=vec2(sin(uTime*(0.5+0.45*h)+h*40.0),cos(uTime*(0.42+0.4*fract(h*7.3))+h*23.0))*iPar.z
         +uVelL.xz*(0.03*min(1.0,len/3.0))*exp(-d0*d0/60.0)*(0.6+0.4*sin(uTime*2.1+h*9.0));      // (a short thread swings less in the air we push aside)
  p.xz+=sw*v*v;
  float dimM=1.0;
  if(uFlip>0.5){
    float wy=iPar.w, hd=max(p.y-wy,0.0);
    vec2 H=mix(uCamL.xz,p.xz,${EYE.toFixed(2)}/(${EYE.toFixed(2)}+hd));
    vec3 rp=rippleField(H,uFlowC);
    p.y=2.0*wy-p.y; p.xz+=rp.xy*(hd+0.15)*1.45;
    dimM=0.7/(1.0+rp.z*1.2);
  }
  vec3 tc=uCamL-p; float dist=max(length(tc),0.05);
  vec3 rt=vec3(tc.z,0.0,-tc.x); rt=rt/max(length(rt),1e-3);
  float pxm=dist*2.0/(projectionMatrix[1][1]*max(uRes.y,1.0));      // metres under one pixel at this distance
  float hw=max(0.03,2.3*pxm);
  p+=rt*(position.x*hw);
  vT=vec3(position.x*hw,v*len,pxm);
  vK=vec4(h,dimM*(1.0-smoothstep(70.0,130.0,dist)),len,v);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const THREAD_FRAG = /* glsl */`
uniform vec3 uWormCol; uniform float uGain, uTime, uThreadK;
varying vec3 vT; varying vec4 vK;
#include <fog_pars_fragment>
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
void main(){
  float x=vT.x, y=vT.y, pxm=max(vT.z,1e-5);
  float lw=max(0.0035,0.6*pxm);
  float line=exp(-x*x/(lw*lw))*min(1.0,0.0035/lw*1.6+0.07);
  float sp=min(0.4+0.3*h11(vK.x*17.0)+0.05*y,0.04+0.16*vK.z);     // the pearls: further apart toward the tip (a short snare carries small beads close together)
  float yb=y/sp+h11(vK.x*3.3);
  float id=floor(yb), dy=(yb-id-0.5)*sp;
  float rT=(0.011+0.009*h11(id*7.7+vK.x*31.0))*clamp(0.5+0.2*vK.z,0.5,1.0), rb=max(rT,1.0*pxm);
  float kb=max(pow(min(1.0,rT/rb),1.15),0.07);
  float bd=exp(-(x*x+dy*dy)/(rb*rb)*1.3);
  float tw=0.5+0.5*sin(id*12.9+vK.x*40.0+uTime*(0.45+0.9*h11(id*3.1+vK.x)));
  float merge=smoothstep(0.5,1.0,2.6*rb/sp);                      // far off they run together into a lit hair
  float bead=mix(bd*(0.3+1.25*tw*tw),0.3*exp(-x*x/(rb*rb)*1.3),merge)*kb;
  float ends=smoothstep(0.0,0.02,vK.w)*(1.0-smoothstep(0.93,1.0,vK.w))*(1.0-0.4*vK.w);
  vec3 col=(uWormCol*line*0.1+mix(uWormCol,vec3(0.56,0.78,1.0),0.5)*bead*1.9+vec3(0.6,0.8,1.0)*bead*bead*0.7)*(ends*vK.y*uThreadK*uGain);     // pearls of water on silk: the palest, bluest white in the cave
  ${GL_FOG_ADD}
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- flowstone: the Hall's stalagmites, islands and its great pendant
// Wet flowstone that takes no light but the colony's. Two lights reach it: the bright cloud of worms the island faces (aLit: a
// direction and a strength, with the shadow its neighbours throw and the hollow under each drip lip in aCol.z), which gives
// every column a dim lit side and a near-black side; and the worms that live ON the stone (aWl: the light of the worms within
// about a metre and a half of each vertex, summed at build as a vector, and how blue or green they are), which lay pools of
// light round the clusters on the crowns, under the lips and down the lanes. aCol.x turns x fine flutes; on a bank (aCol.w 1)
// aCol.y is 1 on the lip of each rimstone step and 0 in the pool behind it. The shader flutes the sides, lays growth bands
// and drip streaks, scatters pin glints of the colony's bluest light, darkens the wet foot where the stone stands in the lake
// and lights the lip of every step. uMirror 1: its image in the lake, a fifth as bright and broken into bands by the ripples.
const FLOW_VERT = /* glsl */`
attribute vec4 aLit, aCol, aWl;
uniform float uMirror, uFlowC; uniform vec3 uCamL;
varying vec3 vP, vN, vCam; varying vec4 vL, vC, vWl;
#include <fog_pars_vertex>
${GL_RIPPLE}
void main(){
  vec3 p=position; vP=position; vCam=uCamL;
  if(uMirror>0.5){
    float hd=max(position.y,0.0); vCam=vec3(uCamL.x,-uCamL.y,uCamL.z);
    vec2 H=mix(uCamL.xz,position.xz,${EYE.toFixed(2)}/(${EYE.toFixed(2)}+hd));
    vec3 rp=rippleField(H,uFlowC); p.xz+=rp.xy*(hd+0.15)*1.45;
  }
  vN=normal; vL=aLit; vC=aCol; vWl=aWl;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FLOW_FRAG = /* glsl */`
uniform vec3 uCamL, uWormCol, uRockCol, uAmb, uLift, uColA, uColB;
uniform float uMirror, uGain, uGlint, uFlowK, uTime;
varying vec3 vP, vN, vCam; varying vec4 vL, vC, vWl;
#include <fog_pars_fragment>
${GL_HASH}
void main(){
  vec3 N=vN/max(length(vN),1e-4);
  vec3 q=vP;
  vec3 fq=fwidth(q); float px=max(fq.x,max(fq.y,fq.z));            // metres of stone under one pixel
  vec3 V=vCam-vP; V=V/max(length(V),1e-3);
  float kf=1.0-smoothstep(0.012,0.05,px), kb=1.0-smoothstep(0.03,0.13,px);     // fine work fades before it can alias
  float bank=vC.w, lip=bank*vC.y;
  float warp=vn3(vec3(q.x*1.3,q.y*0.8,q.z*1.3));
  float fj=vn3(vec3(q.x*3.1+7.0,q.y*0.6,q.z*3.1)), fa=(0.15+1.1*vn3(vec3(q.x*1.9+3.0,q.y*0.45,q.z*1.9)))*(1.0-bank);     // the flutes: of uneven spacing and depth, some run together, some die out
  float fc=(vC.x+(warp-0.5)*1.2+(fj-0.5)*0.9)*6.2832;
  vec3 T=vec3(-N.z,0.0,N.x); T=T/max(length(T),1e-3);
  float g1=vn3(vec3(vC.x*0.3,q.y*8.0+warp*1.6,2.0)), g2=vn3(vec3(vC.x*0.8,q.y*25.0,7.0));     // growth bands: thin lips of flowstone, one over another
  float d1=vn3(vec3(vC.x*1.1+3.0,q.y*0.5,5.0)), d2=vn3(vec3(vC.x*2.9,q.y*1.2+2.0,9.0));       // drip streaks: where the water runs down
  vec3 n=N+T*(sin(fc)*0.42*kf*fa)+vec3(0.0,(g1-0.5)*0.55*kb+(g2-0.5)*0.4*kf,0.0)*(1.0-bank)+N*((d2-0.5)*0.25*kf);
  n=n/max(length(n),1e-3);
  float wet=0.25+0.75*smoothstep(0.35,0.7,d1);
  float alb=(0.30+0.17*d1+0.13*g1+0.07*(0.5+0.5*cos(fc))*kf*fa)*(0.76+0.24*smoothstep(0.3,0.6,d2));
  vec3 L=vL.xyz/max(length(vL.xyz),1e-3);
  float sh=vC.z, ndl=dot(n,L), ndl0=dot(N,L);
  float dif=smoothstep(0.0,0.8,ndl)*smoothstep(-0.12,0.3,ndl0);    // the lit side is a third of the way round; the far side takes nothing
  float bk=1.0-(0.9-0.3*smoothstep(0.04,0.3,vP.y))*bank;           // (a bank's risers and pools stay dark, lighter toward the top: its lips carry the light)
  vec3 R=reflect(-V,n);
  float sp=max(dot(R,L),0.0); float s4=sp*sp; s4*=s4; float s32=s4*s4; s32*=s32; s32*=s4;
  // pin glints: beads of water on the stone that catch a light as the eye moves
  vec3 gq=q*21.0; float gh=h31(floor(gq)), gd=length(fract(gq)-0.5);
  float pinB=step(0.93,gh)*(1.0-smoothstep(0.1,0.34,gd))*(1.0-smoothstep(0.12,0.4,px*21.0));
  // the colony's own range: its clouds are greener, its lanes bluer
  vec3 cG=uColA+(uColA-uColB)*0.3, cB=uColB+(uColB-uColA)*0.55;
  vec3 cloudC=mix(cG,uRockCol,0.3);
  // (1) the cloud the island faces: a dim lit side, a near-black side
  vec3 lit=cloudC*(alb*vL.w*dif*sh*0.56*bk*uFlowK);
  lit+=cloudC*(vL.w*sh*uGlint*uFlowK*s32*wet*0.6);
  float facing=clamp(dot(N,V),0.0,1.0), rim=1.0-facing; rim=rim*rim*rim*(1.0-bank);      // (seen from a kayak a bank's flat is all edge: it takes none of this)
  lit+=cloudC*(vL.w*sh*rim*0.2*uFlowK*smoothstep(0.0,0.6,ndl0));                    // a thin wet edge, on the lit side only
  // (2) the worms that live on the stone: each lights the wet flowstone round it, within about a metre
  float Ew=length(vWl.xyz); vec3 Lw=vWl.xyz/max(Ew,1e-3);
  vec3 wC=mix(cG,cB,clamp(vWl.w,0.0,1.0));
  float difw=0.22+0.78*max(dot(n,Lw),0.0);
  float sw=max(dot(R,Lw),0.0); sw*=sw; sw*=sw; sw*=sw;
  float aoW=0.45+0.55*smoothstep(0.2,0.8,sh);                     // the hollow under a lip still holds its own worms' light
  lit+=wC*(Ew*uFlowK*aoW*bk*(alb*difw*0.7+sw*wet*0.22*uGlint));
  // (3) pin-sharp glints of the bluest light, where either light falls
  float pin=pinB*(vL.w*sh*smoothstep(0.05,0.55,ndl0)*(0.25+0.75*s4)*1.7+Ew*aoW*(0.3+0.7*sw)*1.1);
  lit+=mix(cB,vec3(0.5,0.78,1.0),0.45)*(pin*uGlint*uFlowK);
  // (4) the lip of each rimstone step: a wet edge that takes the light, the pool behind it dark
  float l4=clamp(lip,0.0,1.0); l4*=l4; l4*=l4;                                         // (a thin line along the top of the dam: the riser under it stays dark)
  l4*=0.3+0.7*smoothstep(0.004,0.02,px);      // (close under the eye a lip is a hand wide: there it is wet stone, not a band of light)
  lit+=cloudC*(l4*uFlowK*(vL.w*(0.1+0.3*smoothstep(-0.5,0.5,ndl0))+Ew*0.16))+wC*(l4*Ew*0.12*uFlowK);
  // the far side: blue-black, never a hole
  lit+=uAmb*alb*1.3+uLift*0.55*(0.35+0.65*smoothstep(-0.6,0.4,ndl0))+vec3(0.0006,0.0026,0.0075)*alb*(1.0-0.5*bank);
  // where it stands in the lake the stone is dark with water: a black wet line at its foot (and at the foot of its image)
  lit*=0.1+0.9*smoothstep(0.015,mix(0.12,0.07,bank),vP.y);
  // the waterline: a thin bright meniscus where the wet stone meets the lake, never under two pixels tall, so that from across
  // the lake a bank or a column is seen to stand IN the water (lit stone, a line of light, then a dimmer broken image)
  float wlh=max(mix(0.06,0.022,bank),2.0*px);                      // (a bank shelves into the lake: its line is thinner, or the whole shelf would glow)
  float wline=(1.0-smoothstep(wlh*0.45,wlh,vP.y))*(1.0-uMirror)*(1.0-smoothstep(0.5,1.6,px));
  lit+=mix(cloudC,vec3(0.4,0.72,0.9),0.35)*(wline*uFlowK*(1.0-0.5*bank)*(0.2*vL.w*(0.35+0.65*smoothstep(-0.4,0.5,ndl0))+0.14*Ew+0.012));
  if(uMirror>0.5){                                                 // its image: the stone again (the lake's own sheet over it dims it), fading with depth and broken into bands by the lake's ripples (a black image reads as teeth hanging under a plate)
    float bands=smoothstep(0.3,0.7,vn3(vec3(vP.x*0.8,vP.y*5.4+uTime*0.6,vP.z*0.8)));
    lit*=(0.5+0.6*bands)*exp(-0.05*vP.y)*mix(1.0,0.6,bank)*smoothstep(0.0,0.09,vP.y);      // (a hair of dark under the waterline, then the foot's own image: the stone stands in the lake)
  }
  gl_FragColor=vec4(lit*uGain,1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- water: a black sheet over the built mirror
const WATER_VERT = /* glsl */`
attribute vec4 aW;        // metres from the axis, drift time tau (s), flow 0..1, roof glow above
attribute vec4 aW2;       // sky light, across -1..1, river distance (m), drift speed there (m/s)
attribute vec2 aW3;       // where the rock stands in the water on the left and on the right (metres from the axis)
varying vec3 vP; varying vec4 vW, vW2; varying vec2 vW3;
#include <fog_pars_vertex>
void main(){
  vP=position; vW=aW; vW2=aW2; vW3=aW3;                 // the sheet is never displaced: standing waves are shaded, so no mesh edge can show
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform vec3 uCamL, uWormCol, uSkyCol, uAmb, uMouth;
uniform float uTime, uGain, uChev;
uniform vec4 uIsl[${NISL}];     // the islands that stand in the lake: x, z, the bank's radius, the phase of its lobes (0: the great Organ)
uniform vec4 uHDrip[${NHD}];    // where drops fall into the Hall's lake from the roof: x, z, period (s), phase
varying vec3 vP; varying vec4 vW, vW2; varying vec2 vW3;
#include <fog_pars_fragment>
${GL_HASH}
${GL_RIPPLE}
// The sheet is a dark glass over the BUILT mirror (the rock's image and every light's image lie under it, the whole river
// long): what it draws itself is only what lies ON the water. Foam at one scale: x across in metres, y along the current in
// units of about a metre. Returns (soft clumps for the caps of standing waves, small separate flecks). No lines anywhere:
// nothing here is drawn out along the current, so nothing can rule the surface or beat against the pixels.
vec2 foamAt(float x, float y){
  float wob=vn3(vec3(x*0.7,y*0.33,3.0))*1.7;
  float a=vn3(vec3(x*2.6+wob,y*0.9,1.0))*0.6+vn3(vec3(x*6.3-wob*1.3,y*2.1,5.0))*0.4;
  float f=vn3(vec3(x*13.0+y*7.5+wob,y*13.0-x*7.5,13.0))*0.78+vn3(vec3(x*23.0-y*9.0,y*17.0+x*11.0,9.0))*0.22;
  return vec2(a,f);
}
void main(){
  vec2 fwp=fwidth(vP.xz); float px=max(fwp.x,fwp.y);              // metres of water under one pixel (before any loop)
  float pxx=max(fwidth(vW.x),1e-4);                               // metres ACROSS the stream under one pixel
  vec3 V=uCamL-vP; float dist=max(length(V),1e-3); V/=dist;
  float fl=vW.z, irr=vW.w, sky=vW2.x, ac=vW2.y, sr=vW2.z, vw=max(vW2.w,0.06), x=vW.x;
  float c1=1.0-clamp(V.y,0.0,1.0); float f3=c1*c1*c1;
  float fast=smoothstep(0.06,0.5,fl), fl2=fl*fl;
  // how much of the mirror shows: still water and the Tube's mirror from every angle; the Flume's quick water less under the bow
  float Rf=mix(0.72+0.27*f3,0.48+0.48*f3,smoothstep(0.4,0.9,fl));
  vec3 rp=rippleField(vP.xz,fl);
  // the water's own clock: what floats rides the current exactly. Two octaves of scale are blended by the local speed so a
  // unit along the current is always one to two metres of river, in the still Grotto and in the Flume alike.
  float ta=vW.y-uTime;
  float lv=log2(vw), lo=floor(lv), lf=lv-lo;
  float ya=ta*exp2(lo), yb=ya*2.0;
  vec2 F=mix(foamAt(x,ya),foamAt(x,yb),lf);
  float near=1.0-smoothstep(0.05,0.22,px);
  float lace=vn3(vec3(x*29.0+F.y*2.0,ya*3.3,17.0));                 // grain inside the foam: lace and froth, never a flat pane
  float fleck=smoothstep(0.72,0.88,F.y)*(1.0-smoothstep(0.03,0.14,px))*(0.35+0.85*lace);
  float still=smoothstep(0.84,0.95,vn3(vec3(vP.x*9.0,(vP.z+uTime*0.14)*9.0,9.1)))*(1.0-fast);     // the Grotto's drifting flecks
  // standing waves of the Flume. Quick water in a chute stands in oblique waves: each crest is a V whose point lies downstream
  // and whose arms trail back up the chute toward the walls, some twelve metres from point to wall, so from the bow an arm is
  // a diagonal running away down the water and never a line ruled from wall to wall. The point wanders off the middle, and
  // each crest is only a PIECE: it stands over a third to half of the stream, on one side or the other, its ends ragged, and
  // one in five is missing. The face that rises toward us is pale broken water, its back a soft dark hollow, and froth rides
  // the top in pieces. Far off, where they would be thinner than a few pixels, and right under the bow they are not drawn.
  float crestK=(1.0-smoothstep(1.2,3.6,px))*smoothstep(4.0,10.0,dist)*smoothstep(0.22,0.7,fl);
  float apexX=0.22*sin(sr*0.071+1.3)+0.2*(vn3(vec3(sr*0.045,2.0,7.0))-0.5);
  float av=sqrt((ac-apexX)*(ac-apexX)+0.003);
  float sph=sr*0.5+11.5*av*sqrt(sqrt(av))+0.5*sin(x*0.9+sr*0.11)+1.5*vn3(vec3(x*0.45,sr*0.06,3.0))+0.8*vn3(vec3(x*1.6,sr*0.2,4.0));
  float sw=sin(sph), cw=cos(sph);
  float ci=floor((sph+1.5708)/6.2832);                               // which crest (the seam between two lies in a trough, where nothing is drawn)
  float hA=h11(ci*7.13+3.0), hB=h11(ci*3.71+11.0), hC=h11(ci*5.3+1.7);
  float pcx=(mod(ci,2.0)<0.5?-1.0:1.0)*(0.07+0.24*hA);               // staggered: one stands left of the middle, the next right
  float pwd=0.23+0.10*hB;
  float pedge=abs(ac-pcx)+0.12*(vn3(vec3(x*1.1,sr*0.21,ci+3.0))-0.5);
  float cpc=(1.0-smoothstep(pwd*0.5,pwd*1.2,pedge))*step(0.2,hC);
  float crest=smoothstep(0.80,1.0,sw);                               // the cap is a narrow line along the top, a metre or two wide
  float farK=smoothstep(0.25,1.2,px);                                // far off the foam's grain is under a pixel: a crest is then broken by a coarser field
  float brk=vn3(vec3(x*1.7+ci*5.0,sr*0.16,9.0));                     // (across the stream, an arm's length at a time)
  float capN=mix(F.x*0.6+0.4*vn3(vec3(x*1.1,sr*0.5,9.0)),0.15+0.7*brk,farK);
  float cap=crest*smoothstep(0.46,0.72,capN)*mix(0.12+0.88*lace*lace*1.6,0.6,farK)*crestK*cpc;        // and it comes in pieces of froth: never a band from wall to wall
  float rise=max(cw,0.0)*smoothstep(-0.2,0.7,sw)*crestK*cpc, back=max(-cw,0.0)*smoothstep(-0.6,0.8,sw)*crestK*cpc;
  rise*=(0.22+0.78*smoothstep(0.28,0.66,mix(capN,brk,0.5)))*mix(0.5+0.5*lace,0.8,farK);      // a rising face is broken water, never a flat pale lens
  back*=(0.25+0.75*smoothstep(0.25,0.7,vn3(vec3(x*0.9+3.0,sr*0.12,ci))))*(0.45+0.55*smoothstep(0.3,0.7,vn3(vec3(x*2.3,sr*0.45,ci+7.0))));                         // and its back a hollow of uneven depth, never a ruled riser
  // chevrons: standing diagonal waves that leave both walls and cross in mid-stream, wandering and broken along their length
  float cj=1.5*vn3(vec3(x*0.6,sr*0.15,5.0))+0.7*sin(sr*0.31+x*0.8);
  float chA=max(sin(sr*1.5-x*2.1+cj),0.0), chB=max(sin(sr*1.5+x*2.1+cj*0.8+1.9),0.0);
  chA*=chA; chB*=chB;
  float chev=(chA*(1.0-smoothstep(-0.2,0.8,ac))+chB*smoothstep(-0.8,0.2,ac))
            *(0.15+0.85*smoothstep(0.3,0.7,vn3(vec3(x*1.3,sr*0.4,2.2))))*(1.0-smoothstep(0.2,0.8,px))*fast*(1.0-0.55*fl2);
  // where the current takes hold (the neck, and from the Hall's far door down the Flume: uChev) chevrons stand on the water a
  // metre under the eye: Vs whose points lie downstream and whose arms trail back toward both walls, wandering, broken along
  // their length, each with a pale face and a dark back; flecks of foam ride through them
  // (the arms wander at two scales, so each piece of a crest is a short curve: a comma of broken water, never a ruled line)
  float cw2=2.0*vn3(vec3(x*0.7,sr*0.22,15.0))+0.5*sin(sr*0.23)+1.9*vn3(vec3(x*3.1+3.0,sr*1.4,19.0));
  float cv=sin(sr*2.7+abs(x-0.4*sin(sr*0.09))*5.4+cw2*1.7);          // (arms some 27 degrees off the stream, a crest every 2.3 m)
  float cvK=(1.0-smoothstep(0.05,0.2,px))*smoothstep(1.7,4.2,dist)*uChev;      // only where a crest is several pixels wide, and not right under the eye, where a hand's length of water is a hundred pixels
  // each arm in short pieces (a hand to a forearm long), the pieces in groups, with gaps as long
  float cvP=smoothstep(0.46,0.68,vn3(vec3(x*3.2+5.0,sr*1.5,8.0)))*smoothstep(0.3,0.6,vn3(vec3(x*1.1+9.0,sr*0.5,12.0)));
  float chevN=smoothstep(0.5,0.95,cv)*cvP*cvK*(0.2+0.8*lace);          // a soft face broken into froth
  float chevD=smoothstep(0.55,1.0,-cv)*cvP*cvK*0.5;
  // where the water meets the rock: a ragged line of foam and slow eddies of uneven width that follows every bay of the wall
  float dwall=min(x-vW3.x,vW3.y-x);
  float farB=smoothstep(0.15,0.6,px);                                // far off, what varies along the bank by the arm's length is under a pixel: it is evened out, never dotted
  float edgeN=mix(vn3(vec3(vP.x*1.9,vP.z*1.9,2.0+uTime*0.07)),0.45,farB);
  float eddy=vn3(vec3(x*2.4,ya*0.2,31.0))*0.6+vn3(vec3(x*7.0+edgeN*2.0,ya*0.45,37.0))*0.4;      // these creep: the bank water is slow
  float bankW=0.12+0.5*edgeN*edgeN+0.15*fl;
  float piece=mix(smoothstep(0.42,0.68,vn3(vec3(vP.x*1.15+7.0,vP.z*1.15,3.0+uTime*0.04))),0.3,farB);          // it comes in pieces an arm or two long, with gaps
  // (and where a piece would be thinner than a pixel or two it is not drawn: far down the river there is no line at all)
  float bankF=(1.0-smoothstep(bankW*0.25,bankW,dwall))*smoothstep(-0.3,0.0,dwall)*piece*smoothstep(0.34,0.6,eddy)*(0.3+0.7*mix(0.6,lace,near))*smoothstep(1.0,2.6,bankW/pxx);
  float fringe=(1.0-smoothstep(0.0,0.25+0.6*edgeN,dwall))*mix(smoothstep(0.3,0.75,vn3(vec3(vP.x*0.9+3.0,vP.z*0.9,5.0+uTime*0.05))),0.4,farB);   // dead water in the bays mirrors nothing
  float lipF=smoothstep(${(S_MOUTH - 1.5).toFixed(1)},${(S_MOUTH - 0.2).toFixed(1)},sr)*(0.35+0.65*lace);     // the water curls white as it goes over the lip
  float foam=still*(0.1+0.5*fl)+fleck*0.8*max(fast*(0.45+0.55*fl),0.7*uChev)+cap*6.0+rise*0.55+bankF*(0.3+0.35*fast)+lipF*0.5+chevN*(0.05+0.3*lace*F.x);
  foam*=1.0-smoothstep(60.0,160.0,dist)*0.6;
  vec3 light=uWormCol*(irr*mix(0.34,0.6,fast)+0.09*fast)+uSkyCol*(sky/(0.35+sky))*1.6+uAmb*2.0;   // foam is white: it shows on little light
  float lumF=dot(light,vec3(0.25,0.55,0.2));
  vec3 col=mix(light,vec3(0.9,1.0,1.03)*lumF,0.55)*foam*0.8*(1.0-0.4*sky);          // foam is pale: it takes the roof's colour only half way
  vec2 vd=V.xz/max(length(V.xz),1e-3);
  float s1=max(dot(rp.xy,vd)-(0.006+0.034*fl)*1.2,0.0);
  float slw=min(s1*s1*10.0,1.0)*(1.0-0.85*fast);                   // the bow V belongs to still water: in the current it is torn away
  col+=uWormCol*irr*slw*(0.4+0.6*f3)*0.45;                        // faces of the wake that tip toward us catch the roof glow
  // the roof's glow on the faces of the standing waves and chevrons that tip toward the eye: soft, never a line
  col+=(uWormCol*irr*(rise*3.6+chev*0.26)+uSkyCol*sky*rise*2.2)*(0.25+0.75*f3);
  col+=(uWormCol*(irr*1.5+0.07)+uSkyCol*(sky*1.4+0.04))*(chevN*(0.3+0.7*f3)*0.2);
  // the mouth's light on the water. Its true image lies in the built mirror (the Flume's own image, with a pane of sky in its
  // mouth); here is what the roughness of quick water adds: a lane as wide as the disc that runs from under it toward the
  // bow, broken into clumps and glints that ride the current. Worked in directions: the mirrored ray of each point against
  // the mouth's bearing (the lane's width is the mouth's own) and against its height (its length is the water's roughness).
  vec3 Lm=uMouth-vP; float dm=max(length(Lm),1e-3); Lm/=dm;
  vec2 lh=Lm.xz/max(length(Lm.xz),1e-3);
  float dAz=abs(lh.x*vd.y-lh.y*vd.x), wAz=4.2/dm;
  float laneA=(1.0-smoothstep(0.5*wAz,1.2*wAz+0.012+0.03*fast,dAz))*step(0.0,-dot(lh,vd));
  float dEl=max(abs(V.y-Lm.y)-2.6/dm,0.0)/(0.05+0.30*fast);
  float lane=laneA*exp(-0.5*dEl*dEl)*smoothstep(${(S_TUBE - 24).toFixed(1)},${(S_TUBE + 8).toFixed(1)},sr);
  float gl1=vn3(vec3(x*3.1+F.x*1.5,ya*1.3,21.0)), gl2=vn3(vec3(x*11.0,ya*3.1,25.0));
  // far down the chute a metre of water along the stream is under a pixel, so the lane's clumps there are drawn out down the
  // current (round, seen along the water) and ride it: patches of the sky's blue with dark water between, and a few sparks
  float run=uTime*0.55;
  float lcA=vn3(vec3(x*1.25,sr*0.085-run,23.0)), lcB=vn3(vec3(x*3.4+lcA*1.5,sr*0.21-run*2.0,27.0));
  float clumpF=smoothstep(0.36,0.66,lcA)*(0.3+0.7*smoothstep(0.3,0.7,lcB));
  float clump=mix(smoothstep(0.3,0.72,gl1)*(0.35+0.65*clumpF),clumpF,farK);
  float glint=smoothstep(0.60,0.88,gl1*0.5+gl2*0.5)*(1.0-smoothstep(0.03,0.2,px));
  float glintF=smoothstep(0.64,0.8,lcB*0.6+lcA*0.4)*farK;
  col+=uSkyCol*lane*(0.5+0.5*sky)*(0.06+1.05*clump+2.2*glint*fast+1.5*glintF+2.5*rise+0.6*chev)*0.9;
  // where the chute flattens, the water is a hollow mirror and the roof's image runs together into a band: broken water lies
  // across it in patches, so it is never a line from wall to wall
  // rings on the lake round each island's bank: the drips off its columns keep the water there moving. Their faces that tip
  // toward the eye take the colony's glow, their backs hide the image under them, and right at the bank the water is a dark
  // seam between the stone and its image. A ring is drawn only where it is wider than a few pixels ACROSS itself (from a kayak
  // that is the two sides of each ring, far off; the near and far arcs lie edge on and are left out).
  vec2 dPx=dFdx(vP.xz), dPy=dFdy(vP.xz);                           // (taken before the loops)
  float ringL=0.0, ringD=0.0, seam=0.0;
  for(int i=0;i<${NISL};i++){
    vec4 isl=uIsl[i]; vec2 qi=vP.xz-isl.xy; float ri=length(qi), ai=atan(qi.y,qi.x+step(ri,0.0)*1e-6);
    float Rb=isl.z*(1.0+0.15*sin(ai*3.0+isl.w)+0.09*sin(ai*5.0-isl.w*1.7)+0.045*sin(ai*11.0+isl.w));
    float di=ri-Rb, on=step(0.5,isl.z);
    vec2 gi=qi/max(ri,1e-3);
    float pc=max(abs(dot(gi,dPx)),abs(dot(gi,dPy)));               // metres across the rings under one pixel
    float rk=(1.0-smoothstep(0.07,0.2,pc))*on;
    float env=smoothstep(-0.2,0.1,di)*(1.0-smoothstep(0.5,2.3,di));   // two or three rings, and then still water
    float wv=sin(di*8.4-uTime*1.5+1.2*vn3(vec3(vP.x*0.5,vP.z*0.5,uTime*0.08+float(i))));
    ringL+=env*smoothstep(0.6,1.0,wv)*rk; ringD+=env*smoothstep(0.35,1.0,-wv)*rk;
    seam+=smoothstep(-0.4,-0.1,di)*(1.0-smoothstep(0.05,0.5,di))*on;
  }
  col+=uWormCol*((irr+0.2)*ringL*(0.3+0.7*f3)*0.4);
  // drops fall from the stalactites into the Hall's lake: each lands as a ring that widens and dies (lit by the colony alone)
  float hring=0.0;
  for(int i=0;i<${NHD};i++){
    vec4 hd=uHDrip[i]; float per=max(hd.z,0.5), tt=fract(uTime/per+hd.w)*per;
    vec2 qd=vP.xz-hd.xy; float ld=length(qd); vec2 gd=qd/max(ld,1e-3);
    float pc=max(abs(dot(gd,dPx)),abs(dot(gd,dPy)));
    float wr=clamp(0.7*pc,0.05,0.13), w2=ld-tt*0.75, w3=w2+0.42;      // two thin rings, the second inside the first
    hring+=(exp(-w2*w2/(2.0*wr*wr))+0.55*exp(-w3*w3/(2.0*wr*wr))*step(0.42,tt*0.75))*(0.06/wr)*exp(-tt*0.9)*smoothstep(0.0,0.2,tt)*step(0.6,hd.z)*(1.0-smoothstep(0.14,0.36,pc));     // (a ring too thin to draw is left out: never a pale disc)
  }
  col+=mix(uWormCol,vec3(0.5,0.75,1.0),0.3)*((irr+0.25)*hring*(0.35+0.65*f3)*0.8);
  float jz=exp(-(sr-${(S_MOUTH - 38).toFixed(1)})*(sr-${(S_MOUTH - 38).toFixed(1)})/50.0);
  float jbrk=jz*smoothstep(0.38,0.62,vn3(vec3(x*0.85+11.0,sr*0.07,41.0)));
  float alpha=clamp(1.0-Rf+foam*0.8+fringe*(0.22+0.2*fast)+back*0.5+jbrk*0.4+ringD*0.3+ringL*0.12+seam*0.6+hring*0.2+chevD*0.3+chevN*0.2,0.0,1.0);
  col*=uGain;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff=1.0-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float ff=smoothstep(fogNear,fogFar,vFogDepth);
    #endif
    col=mix(col,fogColor*alpha,ff);
  #endif
  gl_FragColor=vec4(col,alpha);
}`;

// the pane of sky that stands in the mouth of the Flume's image: mist and the plume's top just under the lip's image, deep
// blue below (uv.x across, uv.y metres under the water)
const MOUTH_VERT = /* glsl */`
varying vec2 vQ;
void main(){ vQ=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const MOUTH_FRAG = /* glsl */`
uniform vec3 uSkyCol; uniform float uGain, uTime;
varying vec2 vQ;
${GL_HASH}
void main(){
  float d=max(vQ.y,0.0);
  float n=vn3(vec3(vQ.x*2.5,d*1.3-uTime*0.9,uTime*0.15));
  float mist=exp(-d*1.3)*(0.5+0.8*n);
  float n2=vn3(vec3(vQ.x*5.0+3.0,d*0.9-uTime*0.5,7.0));
  vec3 col=uSkyCol*(vec3(0.3,0.46,0.95)*(0.22+0.2*n+0.14*n2)+vec3(0.85,0.95,1.1)*0.5*mist);
  gl_FragColor=vec4(col*uGain,1.0);
}`;

// ---------------------------------------------------------------- small cast: weta, eel, drips
const WETA_VERT = /* glsl */`
attribute vec3 aAnt;      // 0..1 along an antenna (0 elsewhere), side, base radius of thin parts (0 = body)
uniform float uTime;
varying vec3 vNv; varying float vTop;
#include <fog_pars_vertex>
void main(){
  vec3 p=position;
  float hsh=fract(instanceMatrix[3].x*3.71+instanceMatrix[3].z*5.13);
  float ph=uTime*(0.8+0.7*hsh)+hsh*40.0;
  float a=aAnt.x*aAnt.x;
  p.x+=aAnt.y*sin(ph+aAnt.y*1.3)*0.075*a+sin(ph*2.3)*0.012*a;
  p.y+=cos(ph*0.63+aAnt.y*2.0)*0.06*a;
  vec4 wp=modelMatrix*instanceMatrix*vec4(p,1.0);
  float dist=length(cameraPosition-wp.xyz);
  vec3 nw=mat3(modelMatrix)*mat3(instanceMatrix)*normal; nw=nw/max(length(nw),1e-4);
  if(aAnt.z>0.0) wp.xyz+=nw*max(0.0,0.0024*dist-aAnt.z);
  vec4 mvPosition=viewMatrix*wp;
  vNv=mat3(viewMatrix)*nw; vTop=nw.y;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WETA_FRAG = /* glsl */`
uniform vec3 uWormCol; uniform float uGain;
varying vec3 vNv; varying float vTop;
#include <fog_pars_fragment>
void main(){
  vec3 n=vNv/max(length(vNv),1e-4);
  float rim=max(1.0-abs(n.z),0.0); rim=rim*sqrt(rim);
  vec3 col=uWormCol*(0.0015+0.022*rim*(0.5+0.5*vTop))*uGain;      // black on the glow: the faintest wet rim, no more
  gl_FragColor=vec4(col,1.0);
  #include <fog_fragment>
}`;
const EEL_VERT = /* glsl */`
attribute float aT;
uniform vec4 uEel; uniform float uTime, uEelY;
varying vec3 vN; varying float vT;
#include <fog_pars_vertex>
void main(){
  float amp=0.08+0.27*aT;
  float ph=aT*7.5-uTime*5.0;
  float lat=position.x+amp*sin(ph);
  vec2 d=uEel.zw, r=vec2(-d.y,d.x);
  vec3 p=vec3(uEel.x+r.x*lat-d.x*position.z, uEelY+position.y, uEel.y+r.y*lat-d.y*position.z);
  vN=vec3(r.x*normal.x-d.x*normal.z, normal.y, r.y*normal.x-d.y*normal.z); vT=aT;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const EEL_FRAG = /* glsl */`
uniform vec3 uWormCol; uniform float uGain;
varying vec3 vN; varying float vT;
#include <fog_pars_fragment>
void main(){
  vec3 n=vN/max(length(vN),1e-4);
  float up=max(n.y,0.0); up*=up; up*=up;
  float ridge=up*up; ridge*=ridge;
  float skin=0.6+0.4*sin(vT*140.0)*sin(vT*37.0+1.0);
  vec3 col=uWormCol*(0.0008+0.11*up*skin+0.16*ridge)*uGain+vec3(0.25,0.4,0.5)*ridge*ridge*ridge*0.14*uGain;   // a black body; only the wet spine takes the roof's blue
  gl_FragColor=vec4(col,1.0);
  #include <fog_fragment>
}`;
const DRIP_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;     // fall height, period, phase, seed
uniform float uTime; uniform vec3 uCamL, uWormCol; uniform float uGain;
varying vec2 vUV; varying vec3 vCol;
#include <fog_pars_vertex>
void main(){
  float tt=fract(uTime/iPar.y+iPar.z)*iPar.y;
  float tf=sqrt(2.0*iPar.x/9.8);
  float tfall=tt-(iPar.y-tf);
  float y=iPos.y-step(0.0,tfall)*4.9*tfall*tfall;
  float vel=max(tfall,0.0)*9.8;
  float grow=tfall<0.0?smoothstep(0.0,iPar.y-tf,tt):1.0;
  vec3 c=vec3(iPos.x,y,iPos.z);
  vec3 tc=uCamL-c; float dist=length(tc);
  vec3 rt=vec3(tc.z,0.0,-tc.x); rt=rt/max(length(rt),1e-3);
  float w=max(0.008*grow,0.0016*dist), h=max(w,vel*0.022);
  vec3 p=c+rt*position.x*w+vec3(0.0,position.y*h,0.0);
  vUV=position.xy; vCol=(uWormCol*1.8+vec3(0.25))*uGain*(0.5+0.5*grow)*(1.0-smoothstep(18.0,45.0,dist));
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DRIP_FRAG = /* glsl */`
varying vec2 vUV; varying vec3 vCol;
#include <fog_pars_fragment>
void main(){
  float r2=dot(vUV,vUV);
  vec3 col=vCol*exp(-r2*4.0)*(1.0-smoothstep(0.7,1.0,r2));
  ${GL_FOG_ADD}
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- geometry helpers
function meshBuilder() {
  const pos = [], nrm = [], lit = [], sky = [], sof = [], idx = [];
  return {
    pos, nrm, lit, sky, sof, idx,
    get count() { return pos.length / 3; },
    v(x, y, z, nx, ny, nz, lx, ly, lz, irr, sk, soft = 0) { pos.push(x, y, z); nrm.push(nx, ny, nz); lit.push(lx, ly, lz, irr); sky.push(sk); sof.push(soft); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    async geometry(ctx) {                                 // one attribute at a time: turning a long list into a typed array is the slow part
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); await ctx.yield?.();
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3)); await ctx.yield?.();
      g.setAttribute('aLight', new THREE.BufferAttribute(new Float32Array(lit), 4)); await ctx.yield?.();
      g.setAttribute('aSky', new THREE.BufferAttribute(new Float32Array(sky), 1)); await ctx.yield?.();
      g.setAttribute('aSoft', new THREE.BufferAttribute(new Float32Array(sof), 1)); await ctx.yield?.();
      g.setIndex(new THREE.BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1)); await ctx.yield?.();
      g.computeBoundingSphere(); await ctx.yield?.();
      g.computeBoundingBox();
      return g;
    },
  };
}

// The cave as a grid of rings: positions, inward normals, and (after the colony is scattered) baked worm light.
async function buildGrid(ctx, L, noise) {
  const sl = [];
  for (let s = S0; s < S_GROTTO - 1e-3; s += 0.66) sl.push(s);
  const iG = sl.length;
  for (let s = S_GROTTO; s < S_TUBE - 1e-3; s += 0.77) sl.push(s);
  const iT = sl.length;
  for (let s = S_TUBE; s < S_MOUTH - 0.4; s += 1.2) sl.push(s);
  sl.push(S_MOUTH);
  const iM = sl.length - 1;
  sl.push(S_MOUTH + 0.4, S_MOUTH + 1.1);                  // rock collar round the mouth for the cliff to bury
  const NR = sl.length, P = new Float32Array(NR * NS * 3), N = new Float32Array(NR * NS * 3);
  const o = {};
  for (let i = 0; i < NR; i++) {
    const s = Math.min(sl[i], S_MOUTH), col = i - iM;      // col 1,2: collar rings
    L.axis(s, o);
    const W = L.width(s), H = L.roof(s), camx = L.camX(s);
    const sc = clamp(Math.min(W, H) / 5, 0.5, 1.6), tight = smoothstep(S_GROTTO - 14, S_GROTTO + 6, s) * (1 - domeK(s));
    const jm = 0.5 + 0.05 * noise.n2(s * 0.11, 3.3);
    const bayL = lerp(lerp(5.2, 3.4, tight), 5.0, smoothstep(S_TUBE - 20, S_TUBE + 20, s)), bayA = lerp(0.8, 0.58, tight);
    for (let j = 0; j < NS; j++) {
      const t = j / (NS - 1), th = Math.PI * t, c = Math.cos(th), sn = Math.sin(th);
      let x = W * Math.sign(c) * Math.pow(Math.abs(c), 0.75), y = H * Math.pow(sn, 0.8);
      let nx = x / (W * W), ny = y / (H * H) + 1e-5; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      const px = o.x + o.rx * x, py = o.y + y, pz = o.z + o.rz * x;
      const big = noise.fbm3(px * 0.07, py * 0.11, pz * 0.07, 3) * 1.4 * sc * (1 - 0.55 * tight);
      const rdg = 1 - Math.abs(noise.n3(px * 0.42, py * 0.6, pz * 0.42));
      const fine = noise.n3(px * 1.4, py * 1.4, pz * 1.4) * 0.07;
      const joint = Math.exp(-(((t - jm) / (0.03 + 0.045 * tight)) ** 2)) * 0.95 * sc * smoothstep(-22, -6, s);
      const notch = 0.3 * Math.exp(-((y / 0.45) ** 2));    // undercut at the waterline
      const calm = 1 - 0.75 * smoothstep(S_TUBE - 30, S_TUBE + 10, s);
      const calm2 = 1 - smoothstep(S_TUBE - 40, S_TUBE - 5, s);
      // the waterline is never a ruled edge: the foot of each wall is cut into bays a few metres long with cusps between them
      // (scallops at the scale of the river), fading out a metre above the water
      const sd = c > 0 ? 0 : 1, lam = bayL;
      const bay = ((Math.pow(Math.abs(Math.sin(Math.PI * (s / lam + sd * 0.37) + 1.3 * noise.n2(s * 0.06, 50 + sd * 9))), 0.6) - 0.42) * bayA + 0.16 * noise.n2(s * 0.7, 70 + sd * 9)) * Math.exp(-((y / 0.85) ** 2)) * smoothstep(-10, 0, s);
      const d = big * (0.4 + 0.6 * calm) - rdg * rdg * 0.32 * sc * calm2 * (1 - 0.5 * tight) + fine * calm2 * (1 - 0.7 * tight) + joint * (0.5 + 0.5 * calm2) + notch + bay;
      const wl = j === 0 || j === NS - 1;
      x += nx * d; if (!wl) y = Math.max(0.1, y + ny * d);
      if (s > -6 && Math.abs(x - camx) < 1.4) y = Math.max(y, 2.55);                         // roof 1.7 m over the eye
      if (s > 40 && y < 2.2 && Math.abs(x - camx) < 2.9) x = camx + (x < camx ? -2.9 : 2.9);  // walls 3 m either side
      let fwd = 0;
      if (col > 0) { const k = col === 1 ? 1.35 : 2.2, yc = H * 0.45; x *= k; y = wl ? y : (y - yc) * k + yc; fwd = col === 1 ? 0.5 : 0.2; }
      const q = (i * NS + j) * 3;
      P[q] = o.x + o.rx * x + o.dx * fwd; P[q + 1] = o.y + y + o.slope * fwd; P[q + 2] = o.z + o.rz * x + o.dz * fwd;
      if ((j & 15) === 15) await ctx.yield?.();
    }
    await ctx.yield?.();                // a part of a ring at a time
  }
  await ctx.yield?.();
  // inward normals from the grid
  for (let i = 0; i < NR; i++) { if ((i & 63) === 63) await ctx.yield?.(); for (let j = 0; j < NS; j++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(NR - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(NS - 1, j + 1);
    const a = (i1 * NS + j) * 3, b = (i0 * NS + j) * 3, c = (i * NS + j1) * 3, e = (i * NS + j0) * 3;
    const sx = P[a] - P[b], sy = P[a + 1] - P[b + 1], sz = P[a + 2] - P[b + 2];
    const tx = P[c] - P[e], ty = P[c + 1] - P[e + 1], tz = P[c + 2] - P[e + 2];
    let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx;
    const l = Math.hypot(nx, ny, nz) || 1; const q = (i * NS + j) * 3;
    N[q] = nx / l; N[q + 1] = ny / l; N[q + 2] = nz / l;
  } }
  await ctx.yield?.();
  const ringOf = (s) => {                                 // float ring index of river distance s
    if (s <= S_GROTTO) return clamp((s - S0) / 0.66, 0, iG - 0.001);
    if (s <= S_TUBE) return clamp(iG + (s - S_GROTTO) / 0.77, iG, iT - 0.001);
    return clamp(iT + (s - S_TUBE) / 1.2, iT, iM);
  };
  const sOf = (fi) => { const i = Math.min(NR - 2, Math.floor(fi)); return lerp(sl[i], sl[i + 1], fi - i); };
  const at = (fi, fj, out) => {                           // bilinear surface sample: out = [x,y,z,nx,ny,nz]
    const i = Math.min(NR - 2, Math.floor(fi)), j = Math.min(NS - 2, Math.floor(fj)), u = fi - i, v = fj - j;
    const a = (i * NS + j) * 3, b = a + 3, c = a + NS * 3, e = c + 3;
    const w0 = (1 - u) * (1 - v), w1 = (1 - u) * v, w2 = u * (1 - v), w3 = u * v;
    for (let k = 0; k < 3; k++) {
      out[k] = P[a + k] * w0 + P[b + k] * w1 + P[c + k] * w2 + P[e + k] * w3;
      out[3 + k] = N[a + k] * w0 + N[b + k] * w1 + N[c + k] * w2 + N[e + k] * w3;
    }
    const l = Math.hypot(out[3], out[4], out[5]) || 1; out[3] /= l; out[4] /= l; out[5] /= l;
    return out;
  };
  return { sl, iG, iT, iM, NR, P, N, ringOf, sOf, at, D: new Float32Array(NR * NS), B: null, B2: null };
}

// Scatter the colony on the roof in clouds, lanes and dark rifts with a dense band along the central joint.
async function scatterWorms(ctx, L, G, rng, noise, sections, W) {     // sections: [from, to, how many, bias toward the start, floor of the density, size]
  const out = [], o = {};
  for (const [sa, sb, target, pw, floor, big = 1] of sections) {
    let got = 0;
    for (let tries = 0; tries < target * 40 && got < target; tries++) {
      if ((tries & 31) === 31) await ctx.yield?.();
      const s = sa + (sb - sa) * Math.pow(rng(), pw), fi = G.ringOf(s), fj = rng() * (NS - 1), t = fj / (NS - 1);
      G.at(fi, fj, out); L.axis(s, o);
      const h = out[1] - o.y; if (h < 0.5) continue;
      if (s > S_GROTTO - 8 && s < S_GROTTO + 10 && rng() < 0.4 * (1 - Math.abs(s - S_GROTTO - 1) / 9)) continue;   // a breath of dark at the Tube's throat
      const roofness = Math.sin(Math.PI * t);
      const cl = smoothstep(-0.08, 0.42, noise.fbm3(out[0] * 0.085 + 11, out[1] * 0.12, out[2] * 0.085, 3));
      const ln = Math.pow(1 - Math.abs(noise.n3(out[0] * 0.05 + 40, 3.1, out[2] * 0.05)), 7);
      const rift = smoothstep(-0.32, -0.08, noise.n3(out[0] * 0.035 + 80, out[1] * 0.05, out[2] * 0.035));
      const jb = Math.exp(-(((t - 0.5 - 0.05 * noise.n2(s * 0.11, 3.3)) / 0.05) ** 2));
      const dens = (floor + cl * cl * 0.9 + ln * 0.55) * Math.max(rift, floor) * (0.22 + 0.78 * Math.pow(roofness, 1.5)) + jb * 0.95 * (0.35 + 0.65 * cl) * (0.4 + 0.6 * rift);
      if (rng() * 1.6 > dens) continue;
      const r = rng(), size = (0.02 + 0.028 * r * r + (rng() < 0.04 ? 0.03 : 0)) * big;
      const low = h < 2.7 && roofness < 0.75 && noise.n2(s * 0.12, t * 6 + 50) > -0.1 ? 1 : 0;
      W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(rng.gauss() * 0.45, -1, 1), low, s);
      G.D[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
      got++;
    }
  }
}

// Blur the scattered density into irradiance on the rock (two radii) and find where the light comes from.
async function bakeLight(ctx, G) {
  const { NR, P, D, sl } = G, n = NR * NS;
  const area = new Float32Array(NR), ri = new Int32Array(NR), rj = new Int32Array(NR);
  for (let i = 0; i < NR; i++) {
    const ds = Math.max(0.3, Math.abs(sl[Math.min(NR - 1, i + 1)] - sl[Math.max(0, i - 1)]) * 0.5);
    const a = (i * NS + 20) * 3, b = a + 3; const dt = Math.max(0.12, Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]));
    area[i] = ds * dt; ri[i] = clamp(Math.round(1.1 / ds), 1, 3); rj[i] = clamp(Math.round(1.1 / dt), 1, 6);
  }
  const A = new Float32Array(n), T = new Float32Array(n);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) A[i * NS + j] = D[i * NS + j] / area[i];
  const blur = async (src, dst, mul) => {
    for (let i = 0; i < NR; i++) { const r = ri[i] * mul; for (let j = 0; j < NS; j++) { let s = 0, w = 0; for (let k = -r; k <= r; k++) { const ii = i + k; if (ii < 0 || ii >= NR) continue; const ww = r + 1 - Math.abs(k); s += src[ii * NS + j] * ww; w += ww; } T[i * NS + j] = s / w; } if ((i & 31) === 31) await ctx.yield?.(); }
    for (let i = 0; i < NR; i++) { const r = rj[i] * mul; for (let j = 0; j < NS; j++) { let s = 0, w = 0; for (let k = -r; k <= r; k++) { const jj = j + k; if (jj < 0 || jj >= NS) continue; const ww = r + 1 - Math.abs(k); s += T[i * NS + jj] * ww; w += ww; } dst[i * NS + j] = s / w; } if ((i & 31) === 31) await ctx.yield?.(); }
  };
  const B = new Float32Array(n), B2 = new Float32Array(n), B3 = new Float32Array(n);
  await blur(A, B, 1); await blur(B, B2, 3); await blur(B2, B3, 7);
  G.B = B; G.B2 = B2; G.B3 = B3;
  await ctx.yield?.();
  const srt = Array.from(B).filter((v) => v > 1e-4).sort((a, b) => a - b);
  G.norm = 0.16 / Math.max(1e-3, srt[Math.floor(srt.length * 0.93)] || 1);     // dense clouds light the rock to ~0.2
}

// light on the rock at grid cell (i, j): [dirx, diry, dirz, irradiance]
function cellLight(G, i, j, out) {
  const { NR, P, N, B, B2 } = G;
  const i0 = Math.max(0, i - 1), i1 = Math.min(NR - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(NS - 1, j + 1);
  const q = (i * NS + j) * 3, c = i * NS + j, b = B[c];
  const a = (i1 * NS + j) * 3, e = (i0 * NS + j) * 3, f = (i * NS + j1) * 3, g = (i * NS + j0) * 3;
  let sx = P[a] - P[e], sy = P[a + 1] - P[e + 1], sz = P[a + 2] - P[e + 2]; let l = Math.hypot(sx, sy, sz) || 1; sx /= l; sy /= l; sz /= l;
  let tx = P[f] - P[g], ty = P[f + 1] - P[g + 1], tz = P[f + 2] - P[g + 2]; l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
  const flK = smoothstep(S_TUBE - 14, S_TUBE + 8, G.sl[i]);          // in the Flume the rings are 1.2 m apart: the finest blur steps from ring to ring in blocks, so the next one stands in for it
  const Bg = flK > 0 ? (q2) => B[q2] * (1 - flK) + B2[q2] * flK : (q2) => B[q2];
  const gi = clamp((Bg(i1 * NS + j) - Bg(i0 * NS + j)) / (b + 0.25), -1, 1) * 1.1, gj = clamp((Bg(i * NS + j1) - Bg(i * NS + j0)) / (b + 0.25), -1, 1) * 1.1;
  let lx = N[q] * 0.5 + sx * gi + tx * gj, ly = N[q + 1] * 0.5 + sy * gi + ty * gj, lz = N[q + 2] * 0.5 + sz * gi + tz * gj;
  l = Math.hypot(lx, ly, lz) || 1;
  out[0] = lx / l; out[1] = ly / l; out[2] = lz / l;
  const dark = 0.075 * smoothstep(S_GROTTO - 16, S_GROTTO + 8, G.sl[i]) * (1 - 0.45 * smoothstep(S_TUBE, S_TUBE + 50, G.sl[i]));   // the Tube never falls to black: its walls are an arm's length away
  out[3] = Math.min(0.5, Math.max(dark, (b * 0.5 * (1 - flK) + B2[c] * (0.5 + 0.5 * flK) + G.B3[c] * 0.8) * G.norm * (1 + 0.5 * smoothstep(ENTRY_Z + 8, ENTRY_Z + 26, G.sl[i]) + 1.2 * smoothstep(S_GROTTO - 12, S_GROTTO + 6, G.sl[i]))));
  return out;
}

async function shellChunk(ctx, mb, L, G, ia, ib) {
  const { P, N, sl } = G, lt = [0, 0, 0, 0], o = {};
  const base = mb.count;
  for (let i = ia; i <= ib; i++) {
    const s = Math.min(sl[i], S_MOUTH); L.axis(s, o);
    const sk = i > G.iM ? 1 : Math.exp(-(S_MOUTH - s) / 55) * smoothstep(L.k3 - 12, L.k3 + 22, s);
    const soft = softK(s);
    for (let j = 0; j < NS; j++) {
      const q = (i * NS + j) * 3; cellLight(G, i, j, lt);
      const seam = smoothstep(0.0, 0.55, P[q + 1] - o.y);              // the black seam at the waterline
      mb.v(P[q], P[q + 1], P[q + 2], N[q], N[q + 1], N[q + 2], lt[0], lt[1], lt[2], lt[3] * (0.25 + 0.75 * seam), sk * (0.35 + 0.65 * seam), soft);
    }
    if ((i & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  for (let i = 0; i < ib - ia; i++) for (let j = 0; j < NS - 1; j++) {
    const a = base + i * NS + j, b = a + NS, c = a + 1, d = b + 1;
    mb.tri(a, c, b); mb.tri(b, c, d);
  }
}

// one stalactite: tapered, flared at the root, a little bent, dark at the tip (the worms are on the roof above it)
function addStalactite(mb, rng, rx, ry, rz, len, r0, irr, sk, sides = 5, rings = 5, pw = 1.5, lean = 0.06) {
  const a0 = rng() * TAU, bx = rng.gauss() * lean, bz = rng.gauss() * lean, wob = rng() * TAU, base = mb.count;
  for (let k = 0; k < rings; k++) {
    const v = k / rings, r = r0 * (Math.pow(1 - v, pw) * (1 + 0.18 * Math.sin(v * 9 + wob)) + 0.75 * Math.exp(-v * 9)) + 0.004;
    const cx = rx + bx * len * v * v, cy = ry + 0.15 - (len + 0.15) * v, cz = rz + bz * len * v * v;
    for (let m = 0; m < sides; m++) {
      const a = a0 + (m / sides) * TAU + v * 0.6, ca = Math.cos(a), sa = Math.sin(a), rr = r * (1 + 0.14 * Math.sin(m * 2.4 + wob));
      mb.v(cx + ca * rr, cy, cz + sa * rr, ca * 0.94, -0.3, sa * 0.94, ca * 0.22, 0.42, sa * 0.22, irr * Math.pow(1 - 0.85 * v, 1.6), sk);   // light vector half length: marks a formation for the shader
    }
  }
  const tip = mb.v(rx + bx * len, ry - len, rz + bz * len, 0, -1, 0, 0, 0.48, 0, irr * 0.05, sk);
  for (let k = 0; k < rings - 1; k++) for (let m = 0; m < sides; m++) {
    const a = base + k * sides + m, b = base + k * sides + (m + 1) % sides, c = a + sides, d = b + sides;
    mb.tri(a, b, c); mb.tri(b, d, c);
  }
  const lb = base + (rings - 1) * sides;
  for (let m = 0; m < sides; m++) mb.tri(lb + m, lb + (m + 1) % sides, tip);
  return [rx + bx * len, ry - len, rz + bz * len];
}

// a curtain of flowstone: top edge points tp[] (on the rock), hanging hs[] metres, folded, two skins
function addDrapery(mb, tp, hs, nx, nz, irr, sk, rows = 5, fold = 0.1, ph = 0, dim = 0.8) {
  const n = tp.length;
  for (let side = -1; side <= 1; side += 2) {
    const base = mb.count;
    for (let i = 0; i < n; i++) for (let k = 0; k <= rows; k++) {
      const v = k / rows, f = Math.sin(i * 1.9 + ph + v * 1.3) * fold * v + side * (0.05 * (1 - v) + 0.012);
      const p = tp[i], nxi = Array.isArray(nx) ? nx[i] : nx, nzi = Array.isArray(nz) ? nz[i] : nz;
      mb.v(p[0] + nxi * f, p[1] + 0.12 - (hs[i] + 0.12) * v, p[2] + nzi * f, nxi * side, -0.15, nzi * side, nxi * side * 0.2, 0.45, nzi * side * 0.2, irr * Math.pow(1 - dim * v, 1.4), sk);
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < rows; k++) {
      const a = base + i * (rows + 1) + k, b = a + rows + 1, c = a + 1, d = b + 1;
      if (side > 0) { mb.tri(a, b, c); mb.tri(b, d, c); } else { mb.tri(a, c, b); mb.tri(b, c, d); }
    }
  }
}

// stalactites and curtains hung from the roof grid
async function addFormations(ctx, mbs, L, G, rng0, rngT, noise, style) {
  const out = [], lt = [0, 0, 0, 0], o = {}, tips = [];
  let mirrorCut = -1;
  const zones = [[S0 + 3, S_GROTTO - 2, 600, 0], [S_GROTTO - 2, S_TUBE, 110, 1], [S_TUBE, S_MOUTH - 6, 30, 2]];
  for (const [sa, sb, target, zi] of zones) {
    const rng = zi === 0 ? rng0 : rngT;
    let got = 0;
    for (let tries = 0; tries < target * 30 && got < target; tries++) {
      if ((tries & 127) === 127) await ctx.yield?.();
      const s = rng.range(sa, sb), fi = G.ringOf(s), fj = rng.range(0.14, 0.86) * (NS - 1);
      G.at(fi, fj, out); if (out[4] > -0.45) continue;                                       // roof only
      const cl = noise.fbm3(out[0] * 0.12 + 200, 0, out[2] * 0.12, 2);
      if (rng() > (smoothstep(-0.25, 0.35, cl) * 0.6 + 0.08) * (0.35 + Math.min(1, (G.B2f || G.B2)[Math.round(fi) * NS + Math.round(fj)] * G.norm * 5))) continue;
      L.axis(s, o);
      const lat = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s), h = out[1] - o.y;
      if (Math.hypot(out[0], out[2]) < 2.6) continue;                                       // the Chandelier's own ground
      const floorY = Math.abs(lat) < 2.4 ? 2.6 : 1.1;                                       // nothing hangs into the boat's way
      let len = zi === 0 ? (0.25 + 1.9 * Math.pow(rng(), 2.2)) * (style === 'straws' ? 1.25 : 1) : 0.1 + 0.3 * rng();
      len = Math.min(len, h - floorY); if (len < 0.1) continue;
      const slender = style === 'straws' ? rng() < 0.75 : rng() < 0.3;
      const r0 = slender ? 0.035 + 0.03 * rng() : (0.07 + 0.11 * rng()) * (0.6 + 0.4 * Math.min(1.5, len));
      cellLight(G, Math.round(fi), Math.round(fj), lt);
      const sk = Math.exp(-(S_MOUTH - s) / 55) * 0.8;
      const tip = addStalactite(mbs[zi], rng, out[0], out[1], out[2], len, r0, lt[3] * 0.85 + 0.02, sk, 5, slender ? 4 : 5, slender ? 0.8 : 1.5);
      if (zi === 0 && s > 2 && s < S_GROTTO - 6 && Math.abs(lat) < 8 && len > 0.3) tips.push([tip[0], tip[1], tip[2], tip[1] - o.y]);
      got++;
      if (zi === 0 && got === 240) mirrorCut = mbs[0].idx.length;
    }
    if (zi === 0 && mirrorCut < 0) mirrorCut = mbs[0].idx.length;
  }
  // curtains across the grotto roof
  await ctx.yield?.();
  const rng = rng0;
  const nCurt = style === 'draperies' ? 16 : 8;
  for (let c = 0; c < nCurt; c++) {
    const s = rng.range(-12, S_GROTTO - 8), fi = G.ringOf(s), fj0 = rng.range(0.2, 0.62) * (NS - 1), span = rng.range(4, 8), dfi = rng.range(-3, 3);
    if (Math.abs(s - ENTRY_Z) < 6) continue;
    const tp = [], hs = [], n = 13; let ok = true;
    const hmax = rng.range(0.6, 1.8);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1); G.at(clamp(fi + dfi * u, 0, G.iG - 1), fj0 + span * u, out); L.axis(s, o);
      const lat = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s);
      const hh = Math.min(hmax * (0.3 + 0.7 * Math.sin(Math.PI * u)) * (1 + 0.3 * Math.sin(u * 17 + c)), out[1] - o.y - (Math.abs(lat) < 2.6 ? 2.7 : 1.2));
      if (hh < 0.12) ok = false;
      tp.push([out[0], out[1], out[2]]); hs.push(hh);
    }
    if (!ok) continue;
    const dx = tp[n - 1][0] - tp[0][0], dz = tp[n - 1][2] - tp[0][2], dl = Math.hypot(dx, dz) || 1;
    cellLight(G, Math.round(fi), Math.round(fj0 + span * 0.5), lt);
    addDrapery(mbs[0], tp, hs, dz / dl, -dx / dl, lt[3] * 0.8 + 0.02, 0, 5, 0.12, c * 1.7);
  }
  return { tips, mirrorCut };
}

// Teeth of the Tube and the upper Flume: stalactites hung from the roof and, longest, from the shoulders either side of the
// boat's line, where there is room for them to hang past the eye. They are the black shapes the worm clouds are seen behind.
// Drawn from their own random stream so that nothing else in the piece moves.
async function addTeeth(ctx, mbs, L, G, rng) {
  const out = [], lt = [0, 0, 0, 0], o = {};
  for (const [sa, sb, target, zi] of [[S_GROTTO + 3, S_DOME0 + 3, 30, 1], [S_DOME1 - 9, S_TUBE, 30, 1], [S_TUBE, S_MOUTH - 44, 36, 2]]) {
    let got = 0;
    for (let tries = 0; tries < target * 30 && got < target; tries++) {
      if ((tries & 63) === 63) await ctx.yield?.();
      const s = rng.range(sa, sb), fi = G.ringOf(s), sh = rng() < 0.62;
      const t = sh ? (rng() < 0.5 ? rng.range(0.15, 0.33) : rng.range(0.67, 0.85)) : rng.range(0.3, 0.7);
      G.at(fi, t * (NS - 1), out); if (out[4] > -0.4) continue;
      L.axis(s, o);
      const lat = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s), h = out[1] - o.y;
      const floorY = Math.abs(lat) < 2.7 ? 2.62 : 1.3;                                       // nothing hangs into the boat's way
      let len = 0.2 + (sh ? 1.15 : 0.6) * Math.pow(rng(), 1.6);
      len = Math.min(len, h - floorY); if (len < 0.15) continue;
      const r0 = (0.05 + 0.07 * rng()) * (0.7 + 0.5 * Math.min(1.2, len));
      cellLight(G, Math.round(fi), Math.round(t * (NS - 1)), lt);
      addStalactite(mbs[zi], rng, out[0], out[1], out[2], len, r0, lt[3] * 0.5 + 0.01, Math.exp(-(S_MOUTH - s) / 55) * 0.8, 4, 4, 1.4, 0.05);
      got++;
    }
  }
}

// ---- flowstone geometry (the Hall's stalagmites, islands and great pendant): its own mesh, the light it stands in baked per column
function flowBuilder() {
  const pos = [], nrm = [], lit = [], col = [], idx = [];
  return {
    pos, nrm, lit, col, idx, wl: null,
    get count() { return pos.length / 3; },
    async geometry(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); await ctx.yield?.();
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3)); await ctx.yield?.();
      g.setAttribute('aLit', new THREE.BufferAttribute(new Float32Array(lit), 4)); await ctx.yield?.();
      g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(col), 4)); await ctx.yield?.();
      g.setAttribute('aWl', new THREE.BufferAttribute(this.wl && this.wl.length === pos.length / 3 * 4 ? this.wl : new Float32Array(pos.length / 3 * 4), 4)); await ctx.yield?.();     // the light of the worms that live on the stone (bakeWormLight)
      g.setIndex(new THREE.BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1)); await ctx.yield?.();
      g.computeBoundingSphere(); await ctx.yield?.();
      g.computeBoundingBox();
      return g;
    },
  };
}

// Plan one column of flowstone: a stack of tiers, each a cushion whose drip lip overhangs the one below, the caps stepping in
// by a quarter to a third each time; a rounded or a broken top. dir +1: a stalagmite that rises hgt metres from (bx, by, bz);
// dir -1: a pendant that hangs hgt metres from it and ends in a point. rng is the Hall's own stream (four draws, in the order
// the old plain cone took them, so nothing else in the Hall moves); r2 is the detail stream.
function planColumn(rng, r2, bx, by, bz, hgt, r0, dir = 1, tiersWant = 0) {
  let a0, wob, lx, lz;
  const lean = hgt > 8 ? 0.035 : 0.075;                                // a stalagmite leans a little as it grew (the tallest stays under its pendant)
  if (dir > 0) { a0 = rng() * TAU; wob = rng() * TAU; lx = rng.gauss() * lean; lz = rng.gauss() * lean; }
  else { a0 = rng() * TAU; lx = rng.gauss() * 0.01; lz = rng.gauss() * 0.01; wob = rng() * TAU; }
  const nT = tiersWant || clamp(Math.round(hgt / 0.95) + 1, 2, 6), tiers = [], wts = [];
  let ws = 0; for (let i = 0; i < nT; i++) { const w = (1.3 - 0.5 * i / nT) * r2.range(0.5, 1.6); wts.push(w); ws += w; }
  const capH = dir > 0 ? Math.min(0.2 * hgt, r0 * 0.95) : 0.26 * hgt, body = hgt - capH;      // (a stalagmite ends in a blunt point, not a flat cap)
  let y = 0, C = r0 * (dir > 0 ? 1.12 : 1.0);
  for (let i = 0; i < nT; i++) {
    const h = body * wts[i] / ws, C1 = C * r2.range(0.72, 0.9);
    tiers.push({ y0: y, y1: y + h, C0: C, C1, ph: r2() * TAU, nfl: 3 + Math.floor(r2() * 4), nk: dir > 0 ? r2.range(0.86, 0.98) : r2.range(0.72, 0.94), pw: dir > 0 ? r2.range(0.7, 1.15) : r2.range(0.4, 0.8) });   // a stalagmite tapers tier by tier under small drip lips: a grown cone, never a stack of plates
    y += h; C = C1;
  }
  return { bx, by, bz, hgt, r0, dir, a0, wob, lx, lz, tiers, sides: r0 > 1.0 ? 20 : r0 > 0.55 ? 14 : r0 > 0.3 ? 12 : 9, capH, topR: C,
    broken: dir > 0 && r2() < 0.3, tilt: r2() * TAU, nfine: clamp(Math.round(TAU * r0 / 0.15), 7, 34) };
}

// Build a planned column. lt = [lx, ly, lz, irradiance] (where its light comes from); shade(x, y, z, column) = the shadow its
// neighbours throw on that point, 0..1.
function emitColumn(fb, c, lt, shade) {
  const { bx, by, bz, hgt, dir, sides, tiers } = c, SV = sides + 1, rows = [], TT = [0, 0.1, 0.34, 0.66, 0.86, 0.94];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i], N0 = t.nk * t.C1, th = t.y1 - t.y0;         // N0: the neck under the next lip
    for (const tt of TT) {
      if (tt > 0.9) { rows.push([lerp(t.y0, t.y1, tt), N0 + (t.C1 - N0) * 0.42, 0.4, 0.04, 0, i + tt, t]); continue; }       // the hollow under the next lip
      const e2 = tt / 0.86, ao = tt === 0 ? (i ? 0.9 : 0.55) : tt > 0.8 ? 0.5 : 0.78 + 0.22 * smoothstep(0, 0.5, tt);
      rows.push([lerp(t.y0, t.y1, tt), N0 + (t.C0 - N0) * Math.pow(Math.max(0, 1 - e2 * e2), t.pw), ao, lerp(0.12, 0.03, e2), i && tt < 0.2 ? th * (tt === 0 ? 0.17 : 0.07) : 0, i + tt, t]);
    }
  }
  const tl = tiers[tiers.length - 1], yT = tl.y1, Ct = c.topR, nt = tiers.length, cH = c.capH;
  rows.push([yT, Ct, 0.9, 0.09, cH * 0.12, nt, tl]);
  if (dir < 0) rows.push([yT + cH * 0.4, Ct * 0.66, 0.85, 0.05, 0, nt + 0.4, tl], [yT + cH * 0.75, Ct * 0.32, 0.8, 0.02, 0, nt + 0.75, tl], [yT + cH * 0.95, Ct * 0.08, 0.8, 0, 0, nt + 0.95, tl]);
  else if (c.broken) rows.push([yT + cH * 0.45, Ct * 0.92, 0.95, 0.05, 0, nt + 0.4, tl], [yT + cH * 0.55, Ct * 0.7, 0.8, 0.02, 0, nt + 0.6, tl], [yT + cH * 0.5, Ct * 0.12, 0.7, 0, 0, nt + 0.9, tl]);
  else rows.push([yT + cH * 0.5, Ct * 0.87, 0.95, 0.05, 0, nt + 0.4, tl], [yT + cH * 0.86, Ct * 0.5, 1, 0.02, 0, nt + 0.8, tl], [yT + cH * 0.985, Ct * 0.12, 1, 0, 0, nt + 0.95, tl]);
  const NRW = rows.length, P = new Float32Array(NRW * SV * 3), base = fb.count;
  for (let k = 0; k < NRW; k++) {
    const [h, r, , fl, dr, , t] = rows[k], v = h / hgt, brk = c.broken && k >= NRW - 3 ? 1 : 0;
    for (let m = 0; m < SV; m++) {
      const a = c.a0 + ((m % sides) / sides) * TAU, ridge = Math.cos(a * t.nfl + t.ph + 1.7 * Math.sin(a + c.wob));
      const rr = r * (1 + fl * ridge + 0.05 * Math.cos(a * 2 + c.wob)) + 0.012, q = (k * SV + m) * 3;
      P[q] = bx + c.lx * hgt * v * v + Math.cos(a) * rr; P[q + 2] = bz + c.lz * hgt * v * v + Math.sin(a) * rr;
      P[q + 1] = by + dir * h - dr * Math.max(ridge, 0) + brk * Math.cos(a - c.tilt) * Ct * 0.35;
    }
  }
  for (let k = 0; k < NRW; k++) for (let m = 0; m < SV; m++) {
    const km = Math.max(k - 1, 0), kp = Math.min(k + 1, NRW - 1), mm = ((m % sides) - 1 + sides) % sides, mp = ((m % sides) + 1) % sides;
    const a = (k * SV + mp) * 3, b = (k * SV + mm) * 3, u = (kp * SV + m) * 3, d = (km * SV + m) * 3, q = (k * SV + m) * 3;
    const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[u] - P[d], vy = P[u + 1] - P[d + 1], vz = P[u + 2] - P[d + 2];
    let nx = (vy * uz - vz * uy) * dir, ny = (vz * ux - vx * uz) * dir, nz = (vx * uy - vy * ux) * dir; const l = Math.hypot(nx, ny, nz) || 1;
    fb.pos.push(P[q], P[q + 1], P[q + 2]); fb.nrm.push(nx / l, ny / l, nz / l); fb.lit.push(lt[0], lt[1], lt[2], lt[3]);
    fb.col.push((m / sides) * c.nfine + Math.floor(rows[k][5]) * 0.37, rows[k][5], rows[k][2] * shade(P[q], P[q + 1], P[q + 2], c), 0);
  }
  for (let k = 0; k < NRW - 1; k++) for (let m = 0; m < sides; m++) {
    const a = base + k * SV + m, b = a + 1, u = a + SV, d = u + 1;
    fb.idx.push(a, u, b, b, u, d);
  }
  const hv = (yT + cH * (dir < 0 ? 1 : c.broken ? 0.42 : 1)) / hgt, tx = bx + c.lx * hgt * hv * hv, tz = bz + c.lz * hgt * hv * hv, ty = by + dir * hv * hgt, tip = fb.count;
  fb.pos.push(tx, ty, tz); fb.nrm.push(0, dir, 0); fb.lit.push(lt[0], lt[1], lt[2], lt[3]); fb.col.push(0.5 * c.nfine, nt + 1, (dir < 0 ? 0.8 : 1) * shade(tx, ty, tz, c), 0);
  const lb = base + (NRW - 1) * SV;
  for (let m = 0; m < sides; m++) fb.idx.push(lb + m, tip, lb + m + 1);
}

// the island's own ground: a low lumpy mound of flowstone that goes under the water all round
function emitMound(fb, noise, cx, cz, R, H0, ph, lt, shade) {
  const NRG = 6, NSC = 18, base = fb.count, Rm = R * 0.55;         // a steep hump among the columns' feet: a wide low lens is a dark bar from a kayak
  fb.pos.push(cx, H0, cz); fb.nrm.push(0, 1, 0); fb.lit.push(lt[0], lt[1], lt[2], lt[3]); fb.col.push(0, 0, 0.56 * shade(cx, H0, cz, null), 0);
  for (let i = 1; i <= NRG; i++) for (let m = 0; m < NSC; m++) {
    const q = i / NRG, a = (m / NSC) * TAU, lobe = 1 + 0.22 * Math.sin(a * 3 + ph) + 0.1 * Math.sin(a * 7 - ph), rr = Rm * q * lobe;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    const y = Math.max(0, H0 * Math.pow(1 - q * q, 0.8) + 0.16 * noise.n2(x * 0.9, z * 0.9) * (1 - q) * q);
    const nl = Math.hypot(0.8 * q, 1 - 0.5 * q);
    fb.pos.push(x, y, z); fb.nrm.push(Math.cos(a) * 0.8 * q / nl, (1 - 0.5 * q) / nl, Math.sin(a) * 0.8 * q / nl); fb.lit.push(lt[0], lt[1], lt[2], lt[3]);
    fb.col.push(0, q, (0.2 + 0.36 * smoothstep(0.0, 0.5, y)) * shade(x, y, z, null), 0);       // (the hump under the columns stays a dark foot: lit, it is a pale slab)
  }
  for (let m = 0; m < NSC; m++) fb.idx.push(base, base + 1 + (m + 1) % NSC, base + 1 + m);
  for (let i = 0; i < NRG - 1; i++) for (let m = 0; m < NSC; m++) {
    const a = base + 1 + i * NSC + m, b = base + 1 + i * NSC + (m + 1) % NSC, u = a + NSC, d = b + NSC;
    fb.idx.push(a, b, u, b, d, u);
  }
}

// The island's bank: steps of rimstone that go under the water all round. Each step is a dam a hand's breadth thick that
// stands a quarter of a metre over the pool behind it: a steep riser, a rounded lip, a dark pool, the next riser. Their
// outlines are lobed and differ from one another. Seen from a kayak (the eye 0.8 m up) it is risers and lit lips, never a
// flat pale plate; the first riser stands in the lake and is dark with water at its foot. aCol.y = 1 on a lip, 0 in a pool.
function emitBank(fb, noise, cx, cz, Rb, ph, lt, shade, steps = 3) {
  const NSC = 72, ROWS = [[1.0, -0.08, 0.3, 0, 0]];                  // radius (in Rb), height, shade, lip, which step's outline
  for (let t = 0; t < steps; t++) {
    const r0 = 1 - 0.2 * t, top = 0.075 + 0.115 * t;                   // (a shelf a hand's breadth over the lake, each step a hand higher: it stands in the water, it is not a plate over it)
    // (each step shelves up out of the water behind it over a hand's length to a thin wet lip, then dips to its pool: a shore, not a plate's edge)
    ROWS.push([r0 - 0.03, top - 0.05, 0.7, 0.25, t], [r0 - 0.075, top - 0.012, 1.0, 0.85, t], [r0 - 0.1, top, 1.0, 1, t], [r0 - 0.135, top - 0.04, 0.3, 0, t], [r0 - 0.185, top - 0.034, 0.26, 0, t]);
  }
  const NR = ROWS.length, yTop = 0.075 + 0.115 * (steps - 1);
  const P = new Float32Array(NR * NSC * 3), base = fb.count;
  for (let k = 0; k < NR; k++) for (let m = 0; m < NSC; m++) {
    const a = (m / NSC) * TAU, t = ROWS[k][4], lobe = 1 + 0.22 * Math.sin(a * 2 + ph + t * 1.3) + 0.13 * Math.sin(a * 5 - ph * 1.7 + t * 2.1) + 0.06 * Math.sin(a * 11 + ph + t), q = (k * NSC + m) * 3;
    // each rim is a row of scallops (7, 9, 11 round the three steps): arcs that bulge out between cusps where the water spills
    // over a notch. The foot under the water keeps the plain outline (the waterline is drawn to it); the first riser leans to it.
    const sc = Math.pow(Math.abs(Math.sin(a * (3.5 + t) + ph * 2.3 + t * 1.9)), 0.7), amp = k === 0 ? 0 : t === 0 ? 0.075 : 0.12;
    const rr = Rb * ROWS[k][0] * lobe * (1 + amp * (sc - 0.62));
    P[q] = cx + Math.cos(a) * rr; P[q + 2] = cz + Math.sin(a) * rr;
    P[q + 1] = ROWS[k][1] + (k > 0 ? 0.025 * noise.n2(P[q] * 1.3, P[q + 2] * 1.3) + 0.012 * Math.sin(a * 9 + t * 2 + ph) - 0.035 * (1 - sc) * ROWS[k][3] : 0);
  }
  for (let k = 0; k < NR; k++) for (let m = 0; m < NSC; m++) {
    const km = Math.max(k - 1, 0), kp = Math.min(k + 1, NR - 1), mm = (m - 1 + NSC) % NSC, mp = (m + 1) % NSC;
    const a = (k * NSC + mp) * 3, b = (k * NSC + mm) * 3, u = (kp * NSC + m) * 3, d = (km * NSC + m) * 3, q = (k * NSC + m) * 3;
    const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[u] - P[d], vy = P[u + 1] - P[d + 1], vz = P[u + 2] - P[d + 2];
    let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux; const l = Math.hypot(nx, ny, nz) || 1;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    fb.pos.push(P[q], P[q + 1], P[q + 2]); fb.nrm.push(nx / l, ny / l, nz / l); fb.lit.push(lt[0], lt[1], lt[2], lt[3]);
    fb.col.push((m / NSC) * 22 + k * 0.37, ROWS[k][3], ROWS[k][2] * (0.5 + 0.5 * shade(P[q], P[q + 1] + 0.3, P[q + 2], null)), 1);
  }
  for (let k = 0; k < NR - 1; k++) for (let m = 0; m < NSC; m++) {
    const a = base + k * NSC + m, b = base + k * NSC + (m + 1) % NSC, u = a + NSC, d = b + NSC;
    fb.idx.push(a, b, u, b, d, u);
  }
  const c = fb.count; fb.pos.push(cx, yTop - 0.04, cz); fb.nrm.push(0, 1, 0); fb.lit.push(lt[0], lt[1], lt[2], lt[3]); fb.col.push(0, 0, 0.3 * shade(cx, yTop + 0.3, cz, null), 1);
  const lb = base + (NR - 1) * NSC;
  for (let m = 0; m < NSC; m++) fb.idx.push(lb + m, lb + (m + 1) % NSC, c);
}

// A point on the surface of a planned column (a stalagmite): h metres up it, at angle a, off metres out from the stone.
// Returns [x, y, z, outward x, outward z].
function colPt(c, h, a, off = 0.03) {
  const hh = clamp(h, 0, c.hgt * 0.99), nT = c.tiers.length; let r = -1;
  for (let i = 0; i < nT && r < 0; i++) {
    const t = c.tiers[i]; if (hh > t.y1) continue;
    const N0 = t.nk * t.C1, e2 = Math.min(1, ((hh - t.y0) / Math.max(1e-3, t.y1 - t.y0)) / 0.86);
    r = N0 + (t.C0 - N0) * Math.pow(Math.max(0, 1 - e2 * e2), t.pw);
  }
  if (r < 0) { const q = clamp((hh - c.tiers[nT - 1].y1) / Math.max(1e-3, c.capH), 0, 1); r = c.topR * (1 - 0.82 * q * q); }
  const v = hh / c.hgt, ca = Math.cos(a), sa = Math.sin(a);
  return [c.bx + c.lx * c.hgt * v * v + ca * (r + off), c.by + c.dir * hh, c.bz + c.lz * c.hgt * v * v + sa * (r + off), ca, sa];
}

// The light of the worms that live on the stone, summed for every vertex of builder fb from v0 to v1: each worm within a
// metre adds its light (strongest within a hand's breadth, an eighth at half a metre, gone by a metre) as a
// vector toward it, and its colour. wl = [[x, y, z, size, tint], ...].
async function bakeWormLight(ctx, fb, v0, v1, wl) {
  const A = fb.wl, RW = 1.15, R2 = RW * RW, n = wl.length;
  if (!n) return;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const w of wl) { x0 = Math.min(x0, w[0]); x1 = Math.max(x1, w[0]); z0 = Math.min(z0, w[2]); z1 = Math.max(z1, w[2]); }
  for (let v = v0; v < v1; v++) {
    if (((v - v0) & 63) === 63) await ctx.yield?.();
    const px = fb.pos[v * 3], py = fb.pos[v * 3 + 1], pz = fb.pos[v * 3 + 2];
    if (px < x0 - RW || px > x1 + RW || pz < z0 - RW || pz > z1 + RW) continue;
    let sx = 0, sy = 0, sz = 0, se = 0, sb = 0;
    for (let i = 0; i < n; i++) {
      const w = wl[i], dx = w[0] - px; if (dx > RW || dx < -RW) continue;
      const dy = w[1] - py, dz = w[2] - pz, d2 = dx * dx + dy * dy + dz * dz; if (d2 > R2) continue;
      const f = 1 - d2 / R2, sz2 = w[3] / 0.06, e = sz2 * sz2 * (0.04 / (d2 + 0.04)) * f * f, d = Math.sqrt(d2) + 0.06;
      sx += dx / d * e; sy += dy / d * e; sz += dz / d * e; se += e; sb += e * clamp(w[4] * 0.42 + 0.5, 0, 1);
    }
    if (se < 1e-4) continue;
    const k = (1.15 * se / (se + 0.75)) / se, q = v * 4;                    // a crowd of worms does not burn the stone white
    // the summed vector keeps its direction but takes the whole of the light for its length (worms all round a point still light it)
    const l = Math.hypot(sx, sy, sz) || 1, m = se * k / l;
    A[q] += sx * m; A[q + 1] += sy * m; A[q + 2] += sz * m; A[q + 3] = sb / se;
  }
}

// The Hall of Threads: what stands in its lake and hangs from its dome. The Organ stands in ranks down the river: a rank in
// the Grotto's far hall (its own mesh, fbG), the door rank just inside the Hall on the left, the great Organ in mid-lake on
// the right, and the far rank on the right near the Hall's end, whose tallest column reaches for a great pendant. The colony
// lives on every rank (colonise: clusters on the crowns, worms under each drip lip with their snares, lanes down the flutes),
// and its light is baked onto the stone round each worm (bakeWormLight). Lone stalagmites stand along the walls' feet and some ninety pendants
// hang from the dome, the largest five metres long: the black shapes the false sky is seen behind. Everything that stands in
// the lake is wet flowstone: tiered, fluted columns with small stumps at their feet on a bank of rimstone terraces, each island
// lit from the side its worm cloud is on and shadowing itself; the ranks carry their own lights (worms under the drip lips, each
// with a snare or a thread of pearls). Returns the islands (for the threads to keep clear of), the ranks, the clear dome over
// the great Organ (gap), those lights, threads and snares, the short snares (shortT) and the places where drops fall (hdrips).
async function addHall(ctx, mb, fb, fbG, L, G, rng, r2, noise, hallLight) {
  const o = {}, out = [], lt = [0, 0, 0, 0], islands = [], lights = [], lightsG = [], threads = [], snares = [], shortT = [], hdrips = [], tag = ':' + (ctx.seed ?? 0);
  const at = (s, lat) => { L.axis(s, o); return [o.x + o.rx * lat, o.z + o.rz * lat]; };
  const roofOver = (s, lat) => {                                   // the roof point over (s, lat), roughly
    const W = L.width(s), c = Math.sign(lat) * Math.pow(Math.min(0.999, Math.abs(lat) / W), 1 / 0.75);
    return G.at(G.ringOf(s), (Math.acos(c) / Math.PI) * (NS - 1), out);
  };
  const island = async (s, lat, R, H0, spikes, stumps = 1, q = {}) => {     // q: { fb, rs, rd: the island's own builder and random streams; bank: its bank's radius in R }
    const FB = q.fb || fb, RS = q.rs || rng, RD = q.rd || r2;
    const [x, z] = at(s, lat), ph = RS() * TAU, cols = [], Rm = R * 0.55, v0 = FB.count;
    const moundY = (px, pz) => { const qq = Math.hypot(px - x, pz - z) / Rm; return qq < 1 ? Math.max(0, H0 * Math.pow(1 - qq * qq, 0.8) - 0.04) : 0; };
    let tall = 0;
    for (const [fr, ang, hgt, r0] of spikes) {
      const px = x + Math.cos(ang) * R * fr, pz = z + Math.sin(ang) * R * fr, y = H0 * Math.pow(Math.max(0, 1 - (fr / 0.55) * (fr / 0.55)), 0.8) - 0.05;
      cols.push(planColumn(RS, RD, px, Math.max(y, 0), pz, hgt, r0, 1, hgt > 8 ? 8 : 0)); tall = Math.max(tall, y + hgt);
    }
    let li = hallLight(x, 2.0, z, s, lat);
    if (q.lt) { L.axis(s, o); const ce = Math.cos(24 * RAD) / Math.hypot(q.lt[0], q.lt[1]); li = [(o.dx * q.lt[0] + o.rx * q.lt[1]) * ce, Math.sin(24 * RAD), (o.dz * q.lt[0] + o.rz * q.lt[1]) * ce, q.lt[2]]; }      // lt: [down the river, to the right, how strong]: where this island's light is
    const lh2 = Math.max(li[0] * li[0] + li[2] * li[2], 1e-4);
    const shade = (px, py, pz, self) => {                           // the shadow the island's other columns throw along the light
      let sh = 1;
      for (const c of cols) {
        if (c === self) continue;
        const dx = c.bx - px, dz = c.bz - pz, t = (dx * li[0] + dz * li[2]) / lh2;
        if (t < 0.05) continue;
        const hh = py + li[1] * t - c.by; if (hh > c.hgt || hh < -0.5) continue;
        const rho = c.r0 * (1.08 - 0.78 * clamp(hh / c.hgt, 0, 1)), d = Math.hypot(dx - li[0] * t, dz - li[2] * t);
        sh = Math.min(sh, 0.1 + 0.9 * smoothstep(rho * 0.55, rho * 1.5, d));
      }
      return sh;
    };
    emitMound(FB, noise, x, z, R, H0, ph, li, shade);
    if (q.bank) emitBank(FB, noise, x, z, R * (q.bw ?? q.bank), ph, li, shade, q.steps ?? 3);
    await ctx.yield?.();
    for (let i = 0; i < cols.length; i++) { emitColumn(FB, cols[i], [li[0], li[1], li[2], li[3] * RD.range(0.88, 1.1)], shade); await ctx.yield?.(); }
    await ctx.yield?.();
    for (const c of cols) {                                         // small stumps at the columns' feet
      if (c.r0 < 0.3) continue;
      for (let k = 0, n = Math.round(stumps * (1 + 1.6 * RD())); k < n; k++) {
        const a = RD() * TAU, d = c.r0 * RD.range(1.25, 1.9), px = c.bx + Math.cos(a) * d, pz = c.bz + Math.sin(a) * d;
        let clear = true; for (const qq of cols) if (qq !== c && Math.hypot(qq.bx - px, qq.bz - pz) < qq.r0 * 1.15) clear = false;
        const st = planColumn(RD, RD, px, moundY(px, pz), pz, RD.range(0.28, 0.75) * Math.min(1.3, 0.6 + c.r0), RD.range(0.1, 0.19), 1, 2);
        if (clear) emitColumn(FB, st, [li[0], li[1], li[2], li[3] * 0.95], shade);
      }
      await ctx.yield?.();
    }
    islands.push({ x, z, R: q.bank ? R * q.bank : R, Rb: q.bank ? R * (q.bw ?? q.bank) : R, top: tall, s, lat, cols, li, ph, FB, v0, v1: FB.count, i1: FB.idx.length, wl: [] });      // (R: what others keep clear of; Rb: the bank as built, close under the outermost columns so the towers stand in the water and not on a plate)
    return islands[islands.length - 1];
  };
  // The colony on an island (rr: its own random stream). On every column a cluster on the crown and the shoulder under it; on
  // the nTall tallest also worms in the hollow under each drip lip, each with a short snare of beads (or, where hang is set, a
  // thread of pearls let down beside the column), and one to three lanes of worms down the flutes. Clusters and lips are of
  // the colony's greener kind, lanes of its bluer (tint: -1.6 .. 1.7). Every worm goes to the lights (drawn) and to the
  // island's own list (wl: baked onto the stone as light).
  const colonise = (isl, rr, nTall, sv, hang) => {
    const add = (x, y, z, size, tint) => { lights.push([x, y, z, size, sv, tint]); isl.wl.push([x, y, z, size, tint]); };
    const sorted = isl.cols.slice().sort((a, b) => b.hgt - a.hgt);
    sorted.forEach((c, ci) => {
      const tall = ci < nTall, a0 = rr() * TAU;
      for (let k = 0, n = tall ? 7 + Math.floor(rr() * 7) : 2 + Math.floor(rr() * 4); k < n; k++) {
        const p = colPt(c, c.hgt * (1 - 0.17 * rr() * rr()) - 0.02, rr() * TAU);
        add(p[0], p[1], p[2], 0.03 + 0.034 * rr() * rr(), -0.5 - 1.0 * rr());
      }
      if (!tall) return;
      for (let i = 1; i < c.tiers.length; i++) {
        const t = c.tiers[i];
        for (let k = 0, n = 3 + Math.floor(rr() * 4); k < n; k++) {
          const p = colPt(c, t.y0 + 0.03, rr() * TAU), y = p[1] - 0.04 - 0.08 * rr(), pk = rr();
          add(p[0], y, p[2], 0.04 + 0.05 * rr() * rr(), -0.3 - 1.0 * rr());
          if (pk < 0.62) { const ln = Math.min(rr.range(0.25, 0.8), y - 0.35); if (ln > 0.2) shortT.push([p[0] + p[3] * 0.03, y - 0.01, p[2] + p[4] * 0.03, ln, rr(), 0.006 + 0.012 * rr(), 0]); }
          else if (hang && pk < 0.86 && y > 1.6) threads.push([p[0] + p[3] * 0.05, y, p[2] + p[4] * 0.05, Math.min(rr.range(0.9, 2.6), y - 0.45), 0.012 + 0.02 * rr(), sv]);
        }
      }
      for (let l = 0, nl = 1 + Math.floor(rr() * 2.5); l < nl; l++) {
        const a = a0 + l * 2.3 + rr(), h1 = c.hgt * rr.range(0.72, 0.96), h0 = c.hgt * rr.range(0.06, 0.3);
        for (let h = h1; h > h0; h -= 0.1 + 0.2 * rr()) {
          const sz = 0.026 + 0.03 * rr() * rr(), tn = 0.9 + 0.8 * rr();
          if (Math.sin(h * 2.3 + a * 5) > 0.6) continue;              // a lane comes in runs with gaps
          const p = colPt(c, h, a + 0.13 * Math.sin(h * 1.7 + l));
          add(p[0], p[1], p[2], sz, tn);
        }
      }
    });
  };
  const sA = S_DOME1 - 25;
  // the far rank
  const organ = [[0.12, rng() * TAU, 6.9, 0.95]];
  for (let i = 0; i < 13; i++) organ.push([0.22 + 0.7 * Math.sqrt((i + rng()) / 13), i * 2.4 + rng(), 1.3 + 3.9 * Math.pow(rng(), 1.3), 0.36 + 0.38 * rng()]);
  const A1 = await island(sA, 8.2, 4.4, 1.25, organ, 1, { bank: 1.3, bw: 1.12, lt: [-0.3, -1.0, 0.52] });      // (lit from the lake's middle, on our side as we come down the lake: the faces we see take the light, the far faces are black)
  await ctx.yield?.();
  { // the great pendant over it: tiered like the column it reaches for, hung with worms and with threads of pearls
    const r = roofOver(sA, 8.2), px = A1.x + 0.3, pz = A1.z + 0.2, yR = r[1] + 0.15, len = Math.max(2, r[1] - A1.top - 1.1) + 0.15, li = A1.li;
    const pc = planColumn(rng, r2, px, yR, pz, len, 0.62, -1, 4), pv0 = fb.count, pwl = [];
    emitColumn(fb, pc, [li[0], 0.12, li[2], li[3] * 0.85], () => 1);
    A1.pend = { v0: pv0, v1: fb.count, wl: pwl };
    const rad = (hf) => 0.62 * (1 - 0.72 * hf) * 0.92 + 0.03;
    for (let i = 0; i < 30; i++) { const hf = r2.range(0.08, 0.95), a = r2() * TAU, rr = rad(hf), q = [px + Math.cos(a) * rr, yR - hf * len, pz + Math.sin(a) * rr, 0.03 + 0.03 * r2() * r2()]; lights.push(q); pwl.push([q[0], q[1], q[2], q[3] * 1.4, -0.6]); }
    for (let i = 0; i < 12; i++) {
      const hf = r2.range(0.3, 0.97), a = r2() * TAU, rr = rad(hf) + 0.03, y = yR - hf * len, ln = Math.min(r2.range(1.3, 3.8), y - (A1.top - 0.9));
      if (ln > 0.5) threads.push([px + Math.cos(a) * rr, y, pz + Math.sin(a) * rr, ln, 0.02 + 0.03 * r2()]);
    }
    const tc = A1.cols[0];                                          // the tallest column: worms under its drip lips, each with its short snare
    for (let i = 1; i < tc.tiers.length; i++) for (let k = 0, n = 2 + Math.floor(r2() * 3); k < n; k++) {
      const t = tc.tiers[i], a = r2() * TAU, v = t.y0 / tc.hgt, rr = t.C0 * 0.98 + 0.02;
      const x = tc.bx + tc.lx * tc.hgt * v * v + Math.cos(a) * rr, z = tc.bz + tc.lz * tc.hgt * v * v + Math.sin(a) * rr, y = tc.by + t.y0 - 0.2 * (t.y1 - t.y0) * 0.5;
      const sz = 0.03 + 0.025 * r2(); lights.push([x, y, z, sz]); A1.wl.push([x, y, z, sz * 1.3, -0.5]);
      snares.push([x, y - 0.02, z, r2.range(0.14, 0.34), r2(), r2.range(0.1, 0.2)]);
    }
    // More of the colony lives on this rank (its own stream): clusters, lips and lanes on its columns, and more worms and
    // threads on the great pendant.
    const r3 = makeRng('false-stars-organ-colony' + tag);
    colonise(A1, r3, 6, sA, true);
    for (let i = 0; i < 44; i++) { const hf = r3.range(0.05, 0.96), a = r3() * TAU, rr = rad(hf) + 0.02, q = [px + Math.cos(a) * rr, yR - hf * len, pz + Math.sin(a) * rr, 0.04 + 0.045 * r3() * r3(), sA, i % 3 ? -0.4 - r3() : 1.2]; lights.push(q); pwl.push([q[0], q[1], q[2], q[3], q[5]]); }
    for (let i = 0; i < 12; i++) {
      const hf = r3.range(0.25, 0.97), a = r3() * TAU, rr = rad(hf) + 0.04, y = yR - hf * len, ln = Math.min(r3.range(1.0, 3.4), y - (A1.top - 0.9));
      if (ln > 0.5) threads.push([px + Math.cos(a) * rr, y, pz + Math.sin(a) * rr, ln, 0.02 + 0.03 * r3()]);
    }
  }
  await ctx.yield?.();
  // the great Organ, in mid-lake: one column ten metres tall, a ring of tall ones round it, a crowd of lesser ones out to the
  // bank's edge. Each new rank draws from streams of its own.
  const rT = makeRng('false-stars-organ-tomo' + tag), rTd = makeRng('false-stars-organ-tomo-d' + tag);
  const big = [[0.08, rT() * TAU, 9.4 + 0.9 * rT(), 1.18]];
  for (let i = 0; i < 6; i++) big.push([0.27 + 0.2 * rT(), i * (TAU / 6) + rT() * 0.7, 4.4 + 3.8 * rT(), 0.6 + 0.3 * rT()]);
  for (let i = 0; i < 10; i++) big.push([0.5 + 0.42 * Math.sqrt((i + rT()) / 10), i * 2.4 + rT(), 1.4 + 3.4 * Math.pow(rT(), 1.3), 0.34 + 0.3 * rT()]);
  const A2 = await island(RANK_T[0], RANK_T[1], 5.8, 1.5, big, 0.55, { rs: rT, rd: rTd, bank: 1.24, bw: 1.08, lt: [0.15, -1.0, 0.55] });      // lit from the lake's middle, on our side as we come: its faces toward the lake take the light, the far faces are black, and the cloud on the wall behind draws their outline
  colonise(A2, rT, 8, RANK_T[0], true);
  await ctx.yield?.();
  // the dome over the great Organ, a little toward the lake's middle, is kept clear of pendants and threads (gap): the tall
  // column's crown and its cluster of worms stand against open roof there
  const rh = roofOver(RANK_T[0], RANK_T[1] - 1.9), hole = [rh[0], rh[1] - 0.3, rh[2]];
  const gap = { hole };
  // the door rank, on the left just inside the Hall
  const rD = makeRng('false-stars-rank-door' + tag), rDd = makeRng('false-stars-rank-door-d' + tag);
  const door = [[0.1, rD() * TAU, 7.0 + 0.9 * rD(), 0.8]];
  for (let i = 0; i < 9; i++) door.push([0.24 + 0.68 * Math.sqrt((i + rD()) / 9), i * 2.4 + rD(), 1.3 + 4.2 * Math.pow(rD(), 1.25), 0.3 + 0.34 * rD()]);
  const A3 = await island(RANK_D[0], RANK_D[1], 3.9, 1.1, door, 0.6, { fb: fbG, rs: rD, rd: rDd, bank: 1.3, bw: 1.1, lt: [0.42, 0.9, 0.5] });      // lit from the lake's middle and from beyond it: we come upon towers with a lit side and a black side
  colonise(A3, rD, 6, RANK_D[0], true);
  await ctx.yield?.();
  // the Grotto's rank, in the far hall beyond the Chandelier (seen from the entry as a group of black pipes against the far
  // hall's lights): as tall as that roof allows
  const rG = makeRng('false-stars-rank-grotto' + tag), rGd = makeRng('false-stars-rank-grotto-d' + tag);
  const hG = Math.max(2.6, roofOver(RANK_G[0], RANK_G[1])[1] - 1.0);
  const farR = [[0.1, rG() * TAU, hG * (0.9 + 0.08 * rG()), 0.58]];
  for (let i = 0; i < 7; i++) farR.push([0.26 + 0.66 * Math.sqrt((i + rG()) / 7), i * 2.4 + rG(), Math.min(hG * 0.86, 1.2 + 3.8 * Math.pow(rG(), 1.2)), 0.26 + 0.26 * rG()]);
  const A0 = await island(RANK_G[0], RANK_G[1], 3.1, 0.8, farR, 0.8, { fb: fbG, rs: rG, rd: rGd, bank: 1.3, bw: 1.1, lt: [0.3, 0.95, 0.46] });       // lit from the far hall's middle, across our way: a lit side and a black side
  colonise(A0, rG, 5, RANK_G[0], false);
  await ctx.yield?.();
  // and a small rank in the Sphere itself, on the left of the way in: towers with lights under their lips and their image in
  // the lake, black against the colony with a lit edge toward the Chandelier. It is what stands in the first frame.
  const rS = makeRng('false-stars-rank-sphere' + tag), rSd = makeRng('false-stars-rank-sphere-d' + tag);
  const hS = Math.max(2.2, roofOver(RANK_S[0], RANK_S[1])[1] - 0.8);
  const sph = [[0.1, rS() * TAU, Math.min(hS * (0.9 + 0.08 * rS()), 4.6), 0.46]];
  for (let i = 0; i < 6; i++) sph.push([0.28 + 0.62 * Math.sqrt((i + rS()) / 6), i * 2.4 + rS(), Math.min(hS * 0.8, 1.0 + 2.6 * Math.pow(rS(), 1.2)), 0.22 + 0.2 * rS()]);
  const AS = await island(RANK_S[0], RANK_S[1], 2.2, 0.7, sph, 0.7, { fb: fbG, rs: rS, rd: rSd, bank: 1.16, lt: [0.95, 0.31, 0.5] });
  colonise(AS, rS, 4, RANK_S[0], false);
  await ctx.yield?.();
  for (let i = 0; i < 12; i++) {                                    // lone stalagmites and low reefs at the walls' feet
    const s = lerp(S_DOME0 + 14, S_DOME1 - 16, (i + rng()) / 12), sd = i % 2 ? 1 : -1, lat = sd * (L.width(s) - rng.range(2.4, 5.5));
    const sp = [[0.1, rng() * TAU, 1.2 + 2.4 * rng(), 0.34 + 0.24 * rng()]]; if (rng() < 0.7) sp.push([0.6, rng() * TAU, 0.6 + 1.3 * rng(), 0.24 + 0.12 * rng()]);
    const [px, pz] = at(s, lat); let ok = Math.abs(lat - L.camX(s)) >= 6;
    for (const q of islands) if (Math.hypot(px - q.x, pz - q.z) < q.R + 3.5) ok = false;
    if (!ok) continue;
    await island(s, lat, rng.range(1.1, 1.9), 0.5, sp, 0.6, { bank: 1.12, steps: 1 });
    if ((i & 3) === 3) await ctx.yield?.();
  }
  await ctx.yield?.();
  for (let got = 0, tries = 0; tries < 3200 && got < 96; tries++) {  // pendants on the dome
    if ((tries & 63) === 63) await ctx.yield?.();
    const s = rng.range(S_DOME0 + 7, S_DOME1 - 9), fi = G.ringOf(s), t = rng.range(0.1, 0.9);
    G.at(fi, t * (NS - 1), out); if (out[4] > -0.35) continue;
    if (Math.hypot(out[0] - hole[0], out[2] - hole[2]) < 5.2) continue;                            // none in the clear dome over the great Organ
    L.axis(s, o);
    const lat = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s), h = out[1] - o.y;
    let len = 0.7 + 4.6 * Math.pow(rng(), 2.0);
    len = Math.min(len, h - (Math.abs(lat) < 3.4 ? 3.6 : 2.2)); if (len < 0.6) continue;
    let ok = true; for (const q of islands) if (Math.hypot(out[0] - q.x, out[2] - q.z) < q.R + 0.8 && out[1] - len < q.top + 1.2) ok = false;
    if (!ok) continue;
    cellLight(G, Math.round(fi), Math.round(t * (NS - 1)), lt);
    addStalactite(mb, rng, out[0], out[1], out[2], len, (0.09 + 0.1 * rng()) * (0.8 + 0.45 * Math.min(3, len)), lt[3] * 0.5 + 0.012, 0, len > 2 ? 7 : 5, len > 2 ? 7 : 5, 1.25, 0.035);
    got++;
  }
  await ctx.yield?.();
  { // where drops fall from the roof into the lake: round the banks of the Hall's three ranks (x, top y, z, fall, period, phase)
    const rd = makeRng('false-stars-halldrips' + tag);
    for (const [isl, n] of [[A2, 5], [A3, 2], [A1, 3]]) for (let k = 0; k < n && hdrips.length < NHD; k++) {
      const a = rd() * TAU, r = isl.R * (1.12 + 0.3 * rd()), x = isl.x + Math.cos(a) * r, z = isl.z + Math.sin(a) * r, top = Math.max(4, roofOver(isl.s, isl.lat)[1] - rd.range(0.6, 3));
      hdrips.push([x, top, z, top, rd.range(2.4, 5.2), rd()]);
    }
  }
  // the light of each island's own worms on its stone
  fb.wl = new Float32Array(fb.count * 4); fbG.wl = new Float32Array(fbG.count * 4);
  for (const isl of islands) { if (isl.wl.length) await bakeWormLight(ctx, isl.FB, isl.v0, isl.v1, isl.wl); await ctx.yield?.(); }
  if (A1.pend) await bakeWormLight(ctx, fb, A1.pend.v0, A1.pend.v1, A1.pend.wl);
  return { islands, organ: A1, organT: A2, rankD: A3, rankG: A0, rankS: AS, gap, lights, lightsG, threads, snares, shortT, hdrips };
}

// The entry dome's left wall: a colony of its own, in clouds and along the ledges, low on the wall down to the waterline, so
// the wall is there from the first frame (lit scallops, and its lights doubled in the water). Its density goes into Dx, which
// is added to the roof's light only after the formations have been placed (they must not move).
async function scatterWall(ctx, L, G, rng, noise, W, Dx, target) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 40 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = rng.range(-16, 60), fi = G.ringOf(s), t = rng.range(0.57, 0.988), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    const h = out[1] - o.y; if (h < 0.3) continue;
    const cl = smoothstep(-0.12, 0.34, noise.fbm3(out[0] * 0.15 + 71, out[1] * 0.2, out[2] * 0.15, 3));
    const ln = Math.pow(1 - Math.abs(noise.n3(out[0] * 0.07 + 5, out[1] * 0.42 + 9, out[2] * 0.07)), 6);      // lanes along the ledges
    const edge = smoothstep(-16, -6, s) * (1 - smoothstep(46, 60, s));
    if (rng() * 1.25 > (0.05 + cl * cl * 0.85 + ln * 0.7) * edge) continue;
    const r = rng(), size = (0.022 + 0.03 * r * r + (rng() < 0.05 ? 0.03 : 0));
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, s);
    Dx[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// THE COLONY'S TONE, a field in the cave's own space (nothing in it knows where the eye is): the lights gather into clouds
// some twelve metres across with black voids between them, thin dark lanes wind through the clouds, and one reach of the
// river (some thirty metres) is brighter than the next. 0.2 in a void .. 1.3 in a cloud's core. It is laid over the colony
// after it is dealt (no light moves and none is taken away: a light in a void is a faint grain) and over the light the colony
// throws on the rock. It ends before the Flume, where the false Milky Way carries the picture.
function toneField(noise, x, y, z, s) {
  const v = noise.fbm3(x * 0.075 + 71, y * 0.1 + 3, z * 0.075 + 13, 2);
  const cloud = smoothstep(-0.2, 0.1, v), core = smoothstep(0.12, 0.42, v);
  const lane = smoothstep(0.0, 0.5, 1 - Math.pow(1 - Math.abs(noise.n3(x * 0.042 + 9, 5.7, z * 0.042 + 31)), 6));
  const reach = 0.5 + 0.5 * Math.sin(s * 0.19 + 1.3 * noise.n2(s * 0.03, 23.7));
  let m = lerp(0.2, 1, cloud * lane) * lerp(0.7, 1.1, reach) * (1 + 0.2 * core);
  m = Math.max(m, lerp(0.72, 0.2, smoothstep(24, 52, s)));                // (the entry dome is the sphere of stars: its voids are dim, never black)
  m = lerp(m, Math.max(m, 1), smoothstep(S_GROTTO - 14, S_GROTTO - 4, s) * (1 - smoothstep(S_DOME0, S_DOME0 + 8, s)));     // (the ten-metre neck is one bright lane: no void in it)
  return lerp(m, 1, smoothstep(S_DOME1 - 12, S_DOME1 - 2, s));
}
// More lights in the cores of the Sphere's clouds (the Grotto's set only: nothing is added to the Hall). Own random stream;
// density into Dx, so no formation moves.
async function scatterCores(ctx, L, G, rng, noise, W, Dx, target) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 60 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = rng.range(S0 + 2, S_GROTTO - 4), fi = G.ringOf(s), t = rng.range(0.04, 0.96), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    const h = out[1] - o.y; if (h < 0.6) continue;
    const core = smoothstep(0.1, 0.42, noise.fbm3(out[0] * 0.075 + 71, out[1] * 0.1 + 3, out[2] * 0.075 + 13, 2));
    const fine = smoothstep(-0.25, 0.3, noise.fbm3(out[0] * 0.4 + 17, out[1] * 0.4, out[2] * 0.4 + 5, 2));      // a cloud is itself knots and wisps
    if (rng() > core * (0.25 + 0.75 * fine) * (0.3 + 0.7 * Math.sin(Math.PI * t))) continue;
    const r = rng(), size = 0.02 + 0.026 * r * r + (rng() < 0.03 ? 0.026 : 0);
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, s, 0, 3);      // (ex 3: a light added after the colony was dealt: it hangs no snare, so the piece's main stream is dealt as it always was)
    Dx[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// The right wall of the Grotto beyond the Chandelier (river distance 40 to 86 m), from the waterline to the shoulder of the
// roof: a colony of its own in clouds and along the ledges, as the entry dome's left wall has (scatterWall). As we pass the
// Chandelier the gaze comes round across this wall: it is lit scallops and lights doubled in the water, not a black void.
// Own random stream; density into Dx (no formation moves); ex 3 (no snares: the main stream is dealt as it always was).
async function scatterRightWall(ctx, L, G, rng, noise, W, DxR, target) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 40 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = rng.range(38, 88), fi = G.ringOf(s), t = rng.range(0.012, 0.44), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    const h = out[1] - o.y; if (h < 0.3) continue;
    const cl = smoothstep(-0.2, 0.3, noise.fbm3(out[0] * 0.15 + 31, out[1] * 0.2 + 7, out[2] * 0.15 + 53, 3));
    const ln = Math.pow(1 - Math.abs(noise.n3(out[0] * 0.07 + 15, out[1] * 0.42 + 2, out[2] * 0.07 + 8)), 6);      // lanes along the ledges
    const edge = smoothstep(38, 48, s) * (1 - smoothstep(76, 88, s));
    if (rng() * 1.25 > (0.06 + cl * cl * 0.85 + ln * 0.7) * edge) continue;
    const r = rng(), size = (0.022 + 0.03 * r * r + (rng() < 0.05 ? 0.03 : 0));
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, s, 0, 4);      // (ex 4: as 3, and it keeps its own tone)
    DxR[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// What hangs into the first frames: groups of large stalactites from the entry dome's roof, left and right of the way in, and
// one broad curtain on the right. They are black shapes with a wet rim of the colony's light, and the lake doubles them. Own
// mesh, own random stream; the middle of the dome (the Chandelier's hourglass) is left clear.
async function addEntry(ctx, mb, L, G, rng) {
  const out = [], lt = [0, 0, 0, 0], o = {};
  const roofPt = (s, lat) => { const W = L.width(s), c = Math.sign(lat || 1) * Math.pow(Math.min(0.999, Math.abs(lat) / W), 1 / 0.75), fj = (Math.acos(c) / Math.PI) * (NS - 1); G.at(G.ringOf(s), fj, out); return fj; };
  for (const [s0, lat0, n, spread, longest] of [[17, -5.4, 4, 1.2, 4.4], [28.5, -9.2, 5, 1.5, 2.6], [35, -7.6, 4, 1.3, 2.4], [19.5, 6.6, 3, 1.2, 3.4], [30, 8.2, 3, 1.1, 2.4]]) {
    for (let k = 0; k < n; k++) {
      const a = rng() * TAU, q = k ? Math.sqrt(rng()) * spread : 0, s = s0 + Math.cos(a) * q, lat = lat0 + Math.sin(a) * q * 0.8;
      const fj = roofPt(s, lat); if (out[4] > -0.3) continue;
      L.axis(s, o);
      const la = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s), h = out[1] - o.y;
      let len = longest * (k ? rng.range(0.32, 0.8) : 1);
      len = Math.min(len, h - (Math.abs(la) < 3.6 ? 3.8 : 2.2)); if (len < 0.5) continue;
      cellLight(G, Math.round(G.ringOf(s)), Math.round(fj), lt);
      addStalactite(mb, rng, out[0], out[1], out[2], len, (0.1 + 0.07 * rng()) * (0.7 + 0.4 * Math.min(3, len)), lt[3] * 0.7 + 0.03, 0, 8, 9, 1.25, 0.03);
    }
    await ctx.yield?.();
  }
  { // the curtain: from over the right shoulder of the way in toward the right wall
    const tp = [], hs = [], n = 17; let ok = true;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), s = lerp(21.5, 26.5, u), lat = lerp(3.9, 9.6, u);
      roofPt(s, lat); L.axis(s, o);
      const la = (out[0] - o.x) * o.rx + (out[2] - o.z) * o.rz - L.camX(s);
      const hh = Math.min(2.5 * (0.3 + 0.7 * Math.sin(Math.PI * Math.pow(u, 0.8))) * (1 + 0.28 * Math.sin(u * 19 + 1)), out[1] - o.y - (Math.abs(la) < 3.6 ? 3.6 : 2.2));
      if (hh < 0.15) ok = false;
      tp.push([out[0], out[1], out[2]]); hs.push(Math.max(hh, 0.15));
    }
    if (ok) {
      const dx = tp[n - 1][0] - tp[0][0], dz = tp[n - 1][2] - tp[0][2], dl = Math.hypot(dx, dz) || 1;
      cellLight(G, Math.round(G.ringOf(24)), Math.round(roofPt(24, 6.8)), lt);
      addDrapery(mb, tp, hs, dz / dl, -dx / dl, lt[3] * 0.8 + 0.03, 0, 6, 0.16, 0.7, 0.7);
    }
  }
}

// A lane of worms along the roof joint of the Hall's throat and the passage to the Flume: it gathers in the funnel, comes in
// knots and thin places, and leads the eye to the Flume's door. Drawn from its own random stream.
async function scatterLane(ctx, L, G, rng, noise, sa, sb, target, W) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 30 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = sa + (sb - sa) * rng(), jm = 0.5 + 0.05 * noise.n2(s * 0.11, 3.3);
    const t = clamp(jm + rng.gauss() * (0.035 + 0.05 * (1 - smoothstep(sa, sa + 20, s))) + 0.03 * Math.sin(s * 0.45), 0.2, 0.8), fi = G.ringOf(s), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    if (out[1] - o.y < 1.2) continue;
    if (rng() > (0.3 + 0.7 * smoothstep(-0.35, 0.3, noise.n2(s * 0.2, 91))) * (1 - 0.6 * smoothstep(S_DOME1 - 4, S_DOME1 + 4, s))) continue;
    const r = rng(), size = 0.022 + 0.03 * r * r + (rng() < 0.05 ? 0.03 : 0);
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, s);
    G.D[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// A cloud of the colony on a patch of wall or roof (its own random stream): a soft-edged blob round river distance sC and
// place tC round the ring (0 the right waterline .. 0.5 the roof joint .. 1 the left waterline), in knots, of the colony's
// greener kind. It is what a rank of the Organ is seen against: black towers on a cloud of light. Its density goes into Dx,
// which joins the rock's light only after the formations are placed (they must not move).
async function scatterCloud(ctx, L, G, rng, noise, W, Dx, sC, tC, rs, rt, target, sMin, sMax, big = 1) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 30 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = clamp(sC + rng.gauss() * rs, sMin, sMax), t = clamp(tC + rng.gauss() * rt, 0.012, 0.988), fi = G.ringOf(s), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    if (out[1] - o.y < 0.35) continue;
    const kn = smoothstep(-0.3, 0.35, noise.fbm3(out[0] * 0.3 + 140, out[1] * 0.3, out[2] * 0.3, 2));
    if (rng() > 0.16 + 0.84 * kn) continue;
    const r = rng(), size = (0.02 + 0.03 * r * r + (rng() < 0.05 ? 0.03 : 0)) * big;
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(-0.95 + rng.gauss() * 0.45, -1.6, 0.4), 0, s, 0, 1);
    Dx[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// THE FALSE MILKY WAY: the roof's central band of worms from the Hall's far door down the passage and the Flume, on the same
// axis as the real one that stands in the mouth. Many small lights close together along the roof joint, in knots and thin
// places, with a dark rift wandering down it a little off the middle and a thinner scatter either side; bluer at its heart.
// It thins toward the mouth, where the last worms cannot be told from the first stars. Own random stream; density into Dx.
async function scatterBand(ctx, L, G, rng, noise, W, Dx, sa, sb, target) {
  const out = [], o = {};
  for (let got = 0, tries = 0; tries < target * 40 && got < target; tries++) {
    if ((tries & 127) === 127) await ctx.yield?.();
    const s = sa + (sb - sa) * Math.pow(rng(), 1.2), jm = 0.5 + 0.05 * noise.n2(s * 0.11, 3.3);
    const knot = smoothstep(-0.3, 0.4, noise.n2(s * 0.16, 77)), wb = 0.03 + 0.05 * knot, g = rng.gauss() * (rng() < 0.22 ? 2.6 : 1);      // (one in five lies out in the band's thin skirts)
    const t = clamp(jm + g * wb + 0.016 * Math.sin(s * 0.33), 0.25, 0.75);
    const rift = Math.abs(t - jm - 0.013 * Math.sin(s * 0.21 + 1.0) - 0.007) / wb;
    if (rift < 0.24 * (0.9 + noise.n2(s * 0.4, 31)) && rng() < 0.85) continue;
    if (rng() > (0.22 + 0.78 * knot) * (1 - 0.72 * smoothstep(S_TUBE + 18, sb, s))) continue;
    const fi = G.ringOf(s), fj = t * (NS - 1);
    G.at(fi, fj, out); L.axis(s, o);
    if (out[1] - o.y < 1.6) continue;
    const r = rng(), size = 0.015 + 0.02 * r * r + (rng() < 0.06 ? 0.022 : 0);
    W.add(out[0] + out[3] * 0.05, out[1] + out[4] * 0.05, out[2] + out[5] * 0.05, size, rng(), clamp(1.0 - 0.75 * Math.abs(g) + rng.gauss() * 0.35, -1.4, 1.7), 0, s, 0, 2);
    Dx[Math.round(fi) * NS + Math.round(fj)] += size * size * 800;
    got++;
  }
}

// The Chandelier: a lobed boss of flowstone, three skirts of folded curtain, a fringe of stalactites whose tips
// make an inverted cone ending 2.2 m above the water. Returns surface points for its worms, snares and weta.
async function addChandelier(ctx, mb, L, G, rng) {
  const out = []; G.at(G.ringOf(ENTRY_Z), (NS - 1) * 0.5, out);
  const yTop = out[1] + 0.5, yCore = 3.35, IRR = 0.42, v0 = mb.count;
  const RX = 1.5, RZ = 1.05, sides = 18, rings = 10, lob = rng() * TAU;
  const coreR = (v, a) => (lerp(1.0, 0.2, Math.pow(v, 0.75)) + 0.12 * Math.exp(-v * 7)) * (1 + 0.15 * Math.sin(a * 5 + lob + v * 3) + 0.07 * Math.sin(a * 11 - v * 9));
  const base = mb.count;
  for (let k = 0; k <= rings; k++) {
    const v = k / rings, y = lerp(yTop, yCore, v);
    for (let m = 0; m < sides; m++) {
      const a = (m / sides) * TAU, r = coreR(v, a), ca = Math.cos(a), sa = Math.sin(a);
      mb.v(ca * r * RX, y, sa * r * RZ, ca * 0.85, -0.5, sa * 0.85, ca * 0.6, 0.3, sa * 0.6, IRR * (0.75 + 0.25 * Math.sin(a * 5 + lob)), 0);
    }
  }
  for (let k = 0; k < rings; k++) for (let m = 0; m < sides; m++) {
    const a = base + k * sides + m, b = base + k * sides + (m + 1) % sides, c = a + sides, d = b + sides;
    mb.tri(a, b, c); mb.tri(b, d, c);
  }
  const bot = mb.v(0, yCore - 0.35, 0, 0, -1, 0, 0, -1, 0, IRR, 0), lb = base + rings * sides;
  for (let m = 0; m < sides; m++) mb.tri(lb + m, lb + (m + 1) % sides, bot);
  // skirts
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const a0 = rng() * TAU, span = rng.range(2.4, 3.4), n = 30, vAt = 0.08 + sIdx * 0.2, yT = lerp(yTop, yCore, vAt);
    const tp = [], hs = [], nxs = [], nzs = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + span * (i / (n - 1)), r = coreR(vAt, a) + 0.1, ca = Math.cos(a), sa = Math.sin(a);
      tp.push([ca * r * RX, yT, sa * r * RZ]); nxs.push(ca); nzs.push(sa);
      const e = Math.sin(Math.PI * (i / (n - 1)));
      hs.push(Math.min(yT - 2.75, (1.1 + 0.9 * sIdx * 0.4) * (0.35 + 0.65 * e) * (1 + 0.22 * Math.sin(i * 1.3 + sIdx))));
    }
    addDrapery(mb, tp, hs, nxs, nzs, IRR, 0, 6, 0.09, sIdx * 2.1);
    await ctx.yield?.();
  }
  // the weta curtain: one broad, bright drapery on the side the boat comes up (and passes) on. Nine cave weta cling to its
  // outer face, black against its glow; nothing hangs in front of it.
  const WA0 = 1.62, WSPAN = 2.1, seats = [], wpts = [];
  const wR = (a) => coreR(0.3, a) + 0.14, wYT = lerp(yTop, yCore, 0.3);
  {
    const n = 26, tp = [], hs = [], nxs = [], nzs = [];
    for (let i = 0; i < n; i++) {
      const a = WA0 + WSPAN * (i / (n - 1)), r = wR(a), ca = Math.cos(a), sa = Math.sin(a), e = Math.sin(Math.PI * (i / (n - 1)));
      tp.push([ca * r * RX, wYT, sa * r * RZ]); nxs.push(ca); nzs.push(sa);
      hs.push((wYT - 2.75) * (0.6 + 0.4 * e) * (1 - 0.08 * Math.abs(Math.sin(i * 1.7))));
    }
    const c0 = mb.count;
    addDrapery(mb, tp, hs, nxs, nzs, 0.9, 0, 7, 0.05, 0.6, 0.25);
    for (let i = c0 + n * 8; i < mb.count; i++) wpts.push([mb.pos[i * 3], mb.pos[i * 3 + 1], mb.pos[i * 3 + 2], mb.nrm[i * 3], mb.nrm[i * 3 + 1], mb.nrm[i * 3 + 2]]);
    for (let tries = 0; tries < 4000 && seats.length < 9; tries++) {
      const f = rng.range(0.06, 0.66), a = WA0 + WSPAN * f, r = wR(a) + 0.07, ca = Math.cos(a), sa = Math.sin(a);
      const hem = wYT - (wYT - 2.75) * (0.6 + 0.4 * Math.sin(Math.PI * f)) * 0.9;
      const y = rng.range(Math.max(hem + 0.25, 3.0), Math.min(tries < 2000 ? 4.5 : 5.0, wYT - 0.4));
      const px = ca * r * RX, pz = sa * r * RZ;
      let ok = true; for (const q of seats) if (Math.hypot(q.x - px, q.y - y, q.z - pz) < (tries < 2000 ? 0.5 : 0.4)) ok = false;
      if (!ok) continue;
      let ox = ca / RX, oz = sa / RZ; const ol = Math.hypot(ox, oz); ox /= ol; oz /= ol;
      seats.push({ x: px, y, z: pz, ox, oz });
    }
  }
  await ctx.yield?.();
  // fringe
  const nF = 46;
  for (let f = 0; f < nF; f++) {
    if ((f & 7) === 7) await ctx.yield?.();
    let a = rng() * TAU; const q = f === 0 ? 0 : Math.sqrt(rng()) * 0.98;
    if (q > 0.42) { const rel = ((a - WA0 + 0.2) % TAU + TAU) % TAU; if (rel < WSPAN + 0.4) a += WSPAN + 0.6; }   // nothing hangs in front of the weta
    const ca = Math.cos(a), sa = Math.sin(a);
    const x = ca * q * RX * 0.95, z = sa * q * RZ * 0.95;
    const yRoot = lerp(yCore - 0.2, yTop - 1.2, Math.pow(q, 1.6));
    const yTip = f === 0 ? 2.2 : 2.3 + Math.pow(q, 1.25) * 2.3 + rng() * 0.45;
    const len = Math.max(0.3, yRoot - yTip), r0 = 0.07 + 0.09 * rng() + (f === 0 ? 0.06 : 0);
    addStalactite(mb, rng, x, yRoot, z, len, r0, IRR * 0.9, 0, 6, 6, 1.3, 0.03);
  }
  // surface points (position + outward normal) for worms and snares
  const pts = [];
  for (let i = v0; i < mb.count; i++) pts.push([mb.pos[i * 3], mb.pos[i * 3 + 1], mb.pos[i * 3 + 2], mb.nrm[i * 3], mb.nrm[i * 3 + 1], mb.nrm[i * 3 + 2]]);
  return { pts, seats, wpts, yTop, yTip: 2.2, RX, RZ };
}

// ---------------------------------------------------------------- small geometry: tubes for weta and eel
function polyTube(A, pts, radii, sides, extra) {          // A: { pos, nrm, ext, idx }; extra(k, u) -> [a, b, c]
  const base = A.pos.length / 3, n = pts.length, t = new V3(), u = new V3(), w = new V3(), up = new V3();
  for (let k = 0; k < n; k++) {
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[Math.min(n - 1, k + 1)];
    t.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
    up.set(0, 1, 0); if (Math.abs(t.y) > 0.9) up.set(1, 0, 0);
    u.crossVectors(t, up).normalize(); w.crossVectors(t, u);
    const e = extra(k, k / (n - 1));
    for (let m = 0; m < sides; m++) {
      const a = (m / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a), nx = u.x * ca + w.x * sa, ny = u.y * ca + w.y * sa, nz = u.z * ca + w.z * sa;
      const r = Array.isArray(radii[k]) ? radii[k] : [radii[k], radii[k]];
      const ox = u.x * ca * r[0] + w.x * sa * r[1], oy = u.y * ca * r[0] + w.y * sa * r[1], oz = u.z * ca * r[0] + w.z * sa * r[1];
      A.pos.push(pts[k][0] + ox, pts[k][1] + oy, pts[k][2] + oz); A.nrm.push(nx, ny, nz); A.ext.push(e[0], e[1], e[2]);
    }
  }
  for (let k = 0; k < n - 1; k++) for (let m = 0; m < sides; m++) {
    const a = base + k * sides + m, b = base + k * sides + (m + 1) % sides, c = a + sides, d = b + sides;
    A.idx.push(a, b, c, b, d, c);
  }
}

// a cave weta, head toward +Z, back toward +Y, clinging to a surface at y = 0. Antennae carry aAnt.x = 0..1.
function wetaGeometry() {
  const A = { pos: [], nrm: [], ext: [], idx: [] }, none = () => [0, 0, 0];
  const body = [], br = [];
  for (let k = 0; k <= 8; k++) { const u = k / 8, z = lerp(-0.034, 0.026, u), e = Math.sin(Math.PI * Math.pow(u, 0.8)); body.push([0, 0.019 + 0.008 * e - 0.006 * u, z]); br.push([0.002 + 0.012 * e, 0.002 + 0.014 * e]); }
  polyTube(A, body, br, 7, none);
  const head = []; const hr = [];
  for (let k = 0; k <= 4; k++) { const u = k / 4; head.push([0, 0.014 - 0.006 * u, 0.024 + 0.012 * u]); hr.push(0.001 + 0.006 * Math.sin(Math.PI * (0.15 + 0.8 * u))); }
  polyTube(A, head, hr, 6, none);
  const legs = [[0.014, 0.055, 0.03, 0.03], [0.002, 0.075, 0.004, 0.036], [-0.012, 0.085, -0.075, 0.07]];   // root z, reach, foot z, knee height
  for (const sd of [-1, 1]) for (let li = 0; li < 3; li++) {
    const [z0, reach, zf, kh] = legs[li], th = li === 2 ? 0.0048 : 0.0034;
    const pts = [[sd * 0.006, 0.014, z0], [sd * reach * 0.45, kh, lerp(z0, zf, 0.3)], [sd * reach * 0.8, kh * 0.4, lerp(z0, zf, 0.8)], [sd * reach, 0.0, zf], [sd * (reach + 0.012), 0.001, zf + (li === 2 ? -0.012 : 0.008)]];
    polyTube(A, pts, [th, th, th * 0.6, th * 0.45, th * 0.3], 3, () => [0, sd, th * 0.5]);
  }
  for (const sd of [-1, 1]) {
    const pts = [], rr = [];
    for (let k = 0; k <= 10; k++) { const a = k / 10; pts.push([sd * (0.004 + 0.02 * a + 0.07 * a * a), 0.016 + 0.035 * a - 0.02 * a * a, 0.034 + 0.2 * a]); rr.push(0.0019 * (1 - 0.55 * a)); }
    polyTube(A, pts, rr, 3, (k, a) => [a, sd, 0.0005]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nrm, 3));
  g.setAttribute('aAnt', new THREE.Float32BufferAttribute(A.ext, 3));
  g.setIndex(A.idx);
  return g;
}

// a longfin eel 1.4 m long: head at z = 0, body trailing toward +z (the shader lays it along its heading)
function eelGeometry() {
  const A = { pos: [], nrm: [], ext: [], idx: [] }, pts = [], rr = [], n = 30;
  for (let k = 0; k <= n; k++) {
    // a blunt, flat head, a thick shoulder a fifth of the way back, a long taper, and the tail drawn out into a paddle of fin
    const u = k / n, snout = smoothstep(0, 0.035, u), neck = 1 - 0.16 * Math.exp(-(((u - 0.085) / 0.03) ** 2));
    const taper = Math.pow(Math.max(0, 1 - smoothstep(0.1, 0.92, u)), 1.25), fin = smoothstep(0.3, 0.6, u) * (1 - smoothstep(0.9, 1, u));
    const pect = Math.exp(-(((u - 0.125) / 0.02) ** 2));                     // a pair of pectoral fins behind the head, seen from above as two lobes
    const lat = (0.012 + 0.092 * taper) * (0.5 + 0.5 * snout) * neck + 0.055 * pect, tall = (0.012 + 0.05 * taper) * (0.4 + 0.6 * snout) + 0.06 * fin;
    pts.push([0, 0, u * 2.5]); rr.push([lat * (1 - smoothstep(0.96, 1, u)) + 0.003, tall * (1 - smoothstep(0.96, 1, u)) + 0.003]);
  }
  polyTube(A, pts, rr, 7, (k, u) => [u, 0, 0]);
  const aT = new Float32Array(A.ext.length / 3); for (let i = 0; i < aT.length; i++) aT[i] = A.ext[i * 3];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nrm, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  g.setIndex(A.idx);
  return g;
}

function quadGeometry(count, attrs, y0 = -1) {            // instanced quad: x in -1..1, y in y0..1
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, y0, 0, 1, y0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  for (const k in attrs) g.setAttribute(k, attrs[k]);
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new V3(0, 0, -80), 400);
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('false-stars-hero') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [, cRelief, cWorm, cZenith, cMist, , cMoon] = pal;
  const rDen = rng.range(0.82, 1.2), rHue = rng.range(-0.6, 0.6), rStyle = rng.pick(['mixed', 'straws', 'draperies']);
  const density = clamp(opts.density ?? rDen, 0.7, 1.3), hue = clamp(opts.hue ?? rHue, -1, 1), style = opts.formations || rStyle;
  const hour = opts.hour || 'night';
  const det = clamp(ctx.quality?.detail ?? 1, 0.5, 1);                 // thins snares and mirrored worms only: the colony itself is the hero

  const group = new THREE.Group(); group.name = 'false-stars-hero';
  const L = buildLayout(rng, noise, opts);
  await ctx.yield?.();
  const G = await buildGrid(ctx, L, noise);
  await ctx.yield?.();

  // ---- the colony
  const wd = { p: [], par: [], s: [], ch: [], ex: [] };              // (ex 1: a cloud behind a rank, 2: the false Milky Way; both from streams of their own)
  const W = { add(x, y, z, size, phase, tint, low, s, ch = 0, ex = 0) { wd.p.push(x, y, z); wd.par.push(size, phase, tint, low); wd.s.push(s); wd.ch.push(ch); wd.ex.push(ex); } };
  // The Sphere's colony comes from the piece's main stream, as it always has. Everything past the Tube's throat (the Tube, the
  // Hall of Threads, the Flume) draws from a stream of its own, so the far river can be rebuilt without moving the Sphere.
  const rngT = makeRng('false-stars-river:' + (ctx.seed ?? 0));
  await ctx.yield?.();
  await scatterWorms(ctx, L, G, rng, noise, [[S0 + 2, S_GROTTO, Math.round(8300 * density), 1, 0.035], [ENTRY_Z + 9, S_GROTTO - 3, Math.round(2100 * density), 1, 0.05]], W);
  const Dx = new Float32Array(G.D.length);
  await scatterWall(ctx, L, G, makeRng('false-stars-leftwall:' + (ctx.seed ?? 0)), noise, W, Dx, Math.round(1250 * density));
  const rCl = makeRng('false-stars-backclouds:' + (ctx.seed ?? 0)), CLOUDS = [];
  // the cloud the Grotto's rank is seen against, on the left wall beyond it (the Grotto's set)
  CLOUDS.push([RANK_G[0] + 8.5, 0.8, 3.2]); await scatterCloud(ctx, L, G, rCl, noise, W, Dx, RANK_G[0] + 8.5, 0.8, 3.2, 0.07, Math.round(300 * density), RANK_G[0] + 1, S_GROTTO - 1.5);
  await scatterCores(ctx, L, G, makeRng('false-stars-cores:' + (ctx.seed ?? 0)), noise, W, Dx, Math.round(1700 * density));
  const DxR = new Float32Array(G.D.length);
  await scatterRightWall(ctx, L, G, makeRng('false-stars-rightwall:' + (ctx.seed ?? 0)), noise, W, DxR, Math.round(1000 * density));
  await scatterWorms(ctx, L, G, rngT, noise, [[S_GROTTO, S_DOME0 + 5, Math.round(420 * density), 1, 0.46], [S_DOME0 + 3, S_DOME1 - 3, Math.round(7000 * density), 1, 0.045, 1.55]], W);
  // and those behind the Hall's three ranks as we come upon each: the left wall beyond the door rank, the right wall beyond the
  // great Organ and the roof over it, the right wall of the funnel beyond the far rank (the Hall's set)
  CLOUDS.push([RANK_D[0] + 13, 0.84, 5.5]); await scatterCloud(ctx, L, G, rCl, noise, W, Dx, RANK_D[0] + 13, 0.84, 5.5, 0.075, Math.round(420 * density), S_DOME0 + 6, S_DOME1 - 4, 1.4);
  CLOUDS.push([RANK_T[0] + 17, 0.15, 8]); await scatterCloud(ctx, L, G, rCl, noise, W, Dx, RANK_T[0] + 17, 0.15, 8, 0.085, Math.round(600 * density), S_DOME0 + 6, S_DOME1 - 4, 1.4);
  CLOUDS.push([RANK_T[0] + 2, 0.37, 5]); await scatterCloud(ctx, L, G, rCl, noise, W, Dx, RANK_T[0] + 2, 0.37, 5, 0.06, Math.round(260 * density), S_DOME0 + 6, S_DOME1 - 4, 1.4);
  CLOUDS.push([S_DOME1 - 14, 0.2, 5]); await scatterCloud(ctx, L, G, rCl, noise, W, Dx, S_DOME1 - 14, 0.2, 5, 0.09, Math.round(420 * density), S_DOME0 + 6, S_DOME1 - 4, 1.3);
  const nPass = wd.s.length;                                          // from here on: the passage past the Hall and the Flume (drawn with the Flume's set)
  await scatterBand(ctx, L, G, makeRng('false-stars-milkyway:' + (ctx.seed ?? 0)), noise, W, Dx, S_DOME1 - 34, S_MOUTH - 30, Math.round(2600 * density));
  await scatterLane(ctx, L, G, makeRng('false-stars-lane:' + (ctx.seed ?? 0)), noise, S_DOME1 - 27, S_TUBE + 5, Math.round(680 * density), W);
  await scatterWorms(ctx, L, G, rngT, noise, [[S_DOME1 - 6, S_TUBE, Math.round(360 * density), 1, 0.4], [S_TUBE, S_MOUTH - 26, Math.round(1500 * density), 1.45, 0.34, 0.9]], W);
  { // the Chandelier's knot lights the roof round it
    const ic = Math.round(G.ringOf(ENTRY_Z)), jc = (NS - 1) >> 1;
    for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) G.D[(ic + di) * NS + jc + dj] += 3.0 * Math.exp(-(di * di + dj * dj) / 5);
  }
  await ctx.yield?.();
  await bakeLight(ctx, G);
  await ctx.yield?.();
  { // the left wall's colony joins the light on the rock; the formations are still placed by the light without it (B2f)
    G.B2f = G.B2; const norm0 = G.norm;
    for (let i = 0; i < Dx.length; i++) G.D[i] += Dx[i];
    for (let i = 0; i < G.NR; i++) {                                    // and the colony's tone: the rock under a void is dark
      for (let j = 0; j < NS; j++) { const c = i * NS + j; G.D[c] = G.D[c] * toneField(noise, G.P[c * 3], G.P[c * 3 + 1], G.P[c * 3 + 2], G.sl[i]) + DxR[c]; }
      if ((i & 15) === 15) await ctx.yield?.();
    }
    await bakeLight(ctx, G); G.norm = norm0;
  }
  await ctx.yield?.();

  // ---- rock: three chunks (grotto, tube, flume) with their formations; the Chandelier rides in the grotto chunk
  const mbs = [meshBuilder(), meshBuilder(), meshBuilder()];
  await shellChunk(ctx, mbs[0], L, G, 0, G.iG); await shellChunk(ctx, mbs[1], L, G, G.iG, G.iT); await shellChunk(ctx, mbs[2], L, G, G.iT, G.NR - 1);
  await ctx.yield?.();
  const CH = await addChandelier(ctx, mbs[0], L, G, rng);
  await ctx.yield?.();
  const { tips, mirrorCut } = await addFormations(ctx, mbs, L, G, rng, rngT, noise, style);
  await ctx.yield?.();
  await addTeeth(ctx, mbs, L, G, makeRng('false-stars-teeth:' + (ctx.seed ?? 0)));
  await ctx.yield?.();
  const mbE = meshBuilder();
  await addEntry(ctx, mbE, L, G, makeRng('false-stars-entry:' + (ctx.seed ?? 0)));
  await ctx.yield?.();
  // Where the light on a thing standing in the Hall's lake comes from: the bright cloud of the colony it faces, which for the
  // boat coming down the Hall is ahead and toward the middle of the lake. So every column is lit from down the Hall and from
  // the lake's middle at a raking angle: on the approach it is a dark shape with a lit edge against the false sky, abeam it
  // is half lit and half black.
  const lo = {};
  const hallLight = (x, y, z, s, lat) => {
    L.axis(s, lo);
    const al = 0.9, ac = -0.48 * Math.sign(lat || 1), hl = Math.hypot(al, ac), ce = Math.cos(24 * RAD) / hl;
    return [(lo.dx * al + lo.rx * ac) * ce, Math.sin(24 * RAD), (lo.dz * al + lo.rz * ac) * ce, 0.45];
  };
  const fb = flowBuilder(), fbG = flowBuilder(), rF = makeRng('false-stars-flow:' + (ctx.seed ?? 0));
  const HALL = await addHall(ctx, mbs[1], fb, fbG, L, G, makeRng('false-stars-hall:' + (ctx.seed ?? 0)), rF, noise, hallLight);
  await ctx.yield?.();
  { // the Chandelier's own worms: the densest knot of the colony
    const n = Math.round(1000 * density);
    for (let i = 0; i < n; i++) {
      const p = CH.pts[Math.floor(rng() * CH.pts.length)], j = 0.07;
      const x = p[0] + p[3] * 0.05 + rng.gauss() * j, y = p[1] + p[4] * 0.05 + rng.gauss() * j, z = p[2] + p[5] * 0.05 + rng.gauss() * j;
      if (y < 2.3) continue;
      let clear = true;
      for (const q of CH.seats) { const dx = x - q.x, dy = y - q.y, dz = z - q.z; if (dx * dx + dy * dy + dz * dz < 0.3 && dx * q.ox + dz * q.oz > -0.03) clear = false; }
      const r = rng();
      if (!clear) continue;
      W.add(x, y, z, 0.034 + 0.034 * r * r + (rng() < 0.08 ? 0.03 : 0), rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, ENTRY_Z - z, 1);
    }
    // and a bright scatter on the weta curtain itself, behind the animals: the glow they are black against
    for (let i = 0, m = Math.round(230 * density); i < m && CH.wpts.length; i++) {
      const p = CH.wpts[Math.floor(rng() * CH.wpts.length)], x = p[0] + p[3] * 0.03 + rng.gauss() * 0.06, y = p[1] + rng.gauss() * 0.08, z = p[2] + p[5] * 0.03 + rng.gauss() * 0.06;
      let clear = y > 2.6;
      for (const q of CH.seats) { const dx = x - q.x, dy = y - q.y, dz = z - q.z; if (dx * dx + dy * dy + dz * dz < 0.3 && dx * q.ox + dz * q.oz > -0.045) clear = false; }
      const r = rng();
      if (clear) W.add(x, y, z, 0.03 + 0.03 * r * r, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, ENTRY_Z - z, 1);
    }
  }
  await ctx.yield?.();
  { // The colony's own range of colour: greener in its clouds, bluer along its lanes, in patches some fifteen metres across
    // (gently in the Sphere, whole from the Hall on). The rock under each patch takes the same colour (hueF in the shaders).
    for (let i = 0; i < wd.s.length; i++) {
      if ((wd.ex[i] && wd.ex[i] < 3) || wd.ch[i]) continue;
      const x = wd.p[i * 3], y = wd.p[i * 3 + 1], z = wd.p[i * 3 + 2], k = lerp(0.4, 1, smoothstep(S_GROTTO - 30, S_GROTTO + 6, wd.s[i]));
      const ln = Math.pow(1 - Math.abs(noise.n3(x * 0.05 + 40, 3.1, z * 0.05)), 7);
      wd.par[i * 4 + 2] = clamp(wd.par[i * 4 + 2] * 0.7 + ((hueField(x, y, z) - 0.5) * 4.6 + 1.3 * ln) * k, -1.7, 1.7);
      if ((i & 2047) === 2047) await ctx.yield?.();
    }
  }
  await ctx.yield?.();
  { // the colony's tone (toneField): clouds, voids, dark lanes and reaches. The Chandelier and the clouds behind the ranks keep their own.
    for (let i = 0; i < wd.s.length; i++) {
      if ((wd.ex[i] && wd.ex[i] !== 3) || wd.ch[i]) continue;
      wd.par[i * 4] *= Math.pow(toneField(noise, wd.p[i * 3], wd.p[i * 3 + 1], wd.p[i * 3 + 2], wd.s[i]), 0.75);
      if ((i & 1023) === 1023) await ctx.yield?.();
    }
  }
  await ctx.yield?.();
  { // Chandelier worms first, flume stragglers last: if the triangle budget bites, the mirror drops the least important
    const order = wd.s.map((_, i) => i).sort((a, b) => wd.ch[b] - wd.ch[a] || a - b);
    const re = (arr, n) => { const res = []; for (const i of order) for (let k = 0; k < n; k++) res.push(arr[i * n + k]); return res; };
    await ctx.yield?.();
    wd.p = re(wd.p, 3); await ctx.yield?.();
    wd.par = re(wd.par, 4); await ctx.yield?.();
    wd.s = re(wd.s, 1); wd.ch = re(wd.ch, 1); wd.ex = re(wd.ex, 1);
  }
  await ctx.yield?.();
  const nMain = wd.s.length;
  if (Array.isArray(opts.extraWorms)) for (const e of opts.extraWorms) { const r = rng(); W.add(e[0], e[1], e[2], 0.02 + 0.028 * r * r, rng(), clamp(rng.gauss() * 0.45, -1, 1), 0, 9999); }
  const nAll = wd.s.length;
  const iPos = new Float32Array(wd.p), iMir = new Float32Array(nAll * 3), iPar = new Float32Array(wd.par), iPar2 = new Float32Array(nAll * 3);
  const o = {}, lat = new Float32Array(nAll), hgt = new Float32Array(nAll);
  for (let i = 0; i < nAll; i++) {
    const s = wd.s[i], x = iPos[i * 3], y = iPos[i * 3 + 1], z = iPos[i * 3 + 2];
    if (i >= nMain) { iMir[i * 3] = x; iMir[i * 3 + 1] = y; iMir[i * 3 + 2] = z; iPar2[i * 3] = s; iPar2[i * 3 + 2] = y - 50; continue; }
    L.axis(s, o);
    let nx = -o.slope * o.dx, ny = 1, nz = -o.slope * o.dz; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const d = (x - o.x) * nx + (y - o.y) * ny + (z - o.z) * nz;
    iMir[i * 3] = x - 2 * d * nx; iMir[i * 3 + 1] = y - 2 * d * ny; iMir[i * 3 + 2] = z - 2 * d * nz;
    iPar2[i * 3] = s; iPar2[i * 3 + 1] = L.flow(s); iPar2[i * 3 + 2] = o.y;
    lat[i] = (x - o.x) * o.rx + (z - o.z) * o.rz - L.camX(s); hgt[i] = y - o.y;
    if ((i & 127) === 127) await ctx.yield?.();
  }
  await ctx.yield?.();

  // ---- snares: beaded threads under the worms nearest the boat's line, and all over the Chandelier
  const sn = { p: [], par: [] };
  {
    const inRange = (i) => !wd.ex[i] && wd.s[i] > -8 && wd.s[i] < S_DOME0 + 8 && Math.abs(lat[i]) < 7.5 ;
    let cands = 0; for (let i = 0; i < nMain; i++) if (!wd.ch[i] && inRange(i)) cands++;
    const pr = Math.min(1, 1100 * det / Math.max(1, cands));
    for (let i = 0; i < nMain; i++) {
      if ((i & 1023) === 1023) await ctx.yield?.();
      const ch = wd.ch[i];
      if (ch ? rng() > 0.62 : !(inRange(i) && rng() < pr)) continue;
      let len = ch ? 0.14 + 0.3 * rng() : 0.07 + 0.33 * Math.pow(rng(), 1.5);
      len = Math.min(len, hgt[i] - (Math.abs(lat[i]) < 1.6 ? 2.03 : 0.5));
      if (len < 0.05) continue;
      sn.p.push(iPos[i * 3], iPos[i * 3 + 1] - 0.01, iPos[i * 3 + 2]); sn.par.push(len, rng(), 0.1 + 0.16 * rng(), wd.s[i]);
    }
  }
  for (const q of HALL.snares) { sn.p.push(q[0], q[1], q[2]); sn.par.push(q[3], q[4], q[5], q[6] ?? HALL.organ.s); }       // the Organ's own snares, under the tall column's lips
  await ctx.yield?.();
  // ---- the Hall's threads: silk metres long, hung in tassels. Each tassel is some fifty threads from a patch of roof a few
  // metres across, longest at its heart, so it hangs as a teardrop of pearls with dark air round it; a few single threads
  // hang between them. All keep clear of the boat's line and of the islands, and every one is doubled in the lake.
  const th = { p: [], par: [] }, tassels = [];
  {
    const tr = makeRng('false-stars-threads:' + (ctx.seed ?? 0)), out = [];
    const roofAt = (sv, la) => { const Wd = L.width(sv), c = Math.sign(la || 1) * Math.pow(Math.min(0.999, Math.abs(la) / Wd), 1 / 0.75); return G.at(G.ringOf(sv), (Math.acos(c) / Math.PI) * (NS - 1), out); };
    const hang = (sv, la, lenWant, sway) => {
      roofAt(sv, la); const x = out[0], y = out[1], z = out[2];
      if (out[4] > -0.3) return;                                        // roof only
      if (Math.hypot(x - HALL.gap.hole[0], z - HALL.gap.hole[2]) < 4.6) return;        // none in the clear dome over the great Organ
      L.axis(sv, o); const lt2 = (x - o.x) * o.rx + (z - o.z) * o.rz - L.camX(sv);
      let tipMin = Math.abs(lt2) < 2.8 ? 3.0 : 1.3;
      for (const q of HALL.islands) if (Math.hypot(x - q.x, z - q.z) < q.R + 0.7) tipMin = Math.max(tipMin, q.top + 0.7);
      const len = Math.min(lenWant, y - o.y - tipMin);
      if (len < 0.8) return;
      th.p.push(x, y - 0.03, z); th.par.push(len, tr(), sway * Math.min(1.6, len / 3), 0);       // (0: the lake's level under it)
    };
    const nT = Math.round(12 * Math.max(det, 0.75)) + 3, FIX = [[S_DOME1 - 19, 2.2], [S_DOME1 - 27, -9.5], [S_DOME1 - 13, -5.2]];      // the first three hang where the Organ's pass sees them
    for (let c = 0, tries = 0; c < nT && tries < 400; tries++) {
      const sv = c < 3 ? FIX[c][0] : tr.range(S_DOME0 + 17, S_DOME1 - 19), la = c < 3 ? FIX[c][1] : tr.range(-0.7, 0.7) * L.width(sv);
      let ok = true; for (const q of tassels) if (c >= 3 && Math.hypot(q.s - sv, q.lat - la) < 10.5) ok = false;
      if (!ok) continue;
      const Lc = tr.range(4.2, 8.2), Rc = tr.range(1.5, 2.6), n = Math.round(tr.range(26, 40));
      tassels.push({ s: sv, lat: la, len: Lc, R: Rc }); c++;
      for (let i = 0; i < n; i++) {
        const a = tr() * TAU, q = Math.sqrt(tr()), rr = q * Rc;
        hang(sv + Math.cos(a) * rr, la + Math.sin(a) * rr, Lc * (1 - 0.6 * q * q) * tr.range(0.62, 1), 0.02 + 0.03 * tr());
      }
      await ctx.yield?.();              // a tassel at a time
    }
    await ctx.yield?.();
    for (let i = 0; i < Math.round(150 * det); i++) hang(tr.range(S_DOME0 + 8, S_DOME1 - 10), tr.range(-0.85, 0.85) * L.width(S_DOME0 + 40), 1.0 + 3.6 * Math.pow(tr(), 1.6), 0.02 + 0.05 * tr());
    for (const q of HALL.threads) { th.p.push(q[0], q[1] - 0.02, q[2]); th.par.push(q[3], rF(), q[4] * Math.min(1.6, q[3] / 3), 0); }     // and those that hang from the great pendant
  }
  // ---- short snares, as ribbons with beads (they hold at any distance): under the drip lips of the Organ's ranks, and close
  // overhead under the false Milky Way in the Hall's throat and the head of the Flume (tips 1.2 m clear of the eye). The last
  // number of each is the water's height under it, for its image.
  const st = { p: [], par: [] };
  {
    const tr2 = makeRng('false-stars-snares-short:' + (ctx.seed ?? 0));
    for (const q of HALL.shortT) { st.p.push(q[0], q[1], q[2]); st.par.push(q[3], q[4], q[5], q[6]); }
    for (let i = 0; i < nMain; i++) {
      if (wd.ex[i] !== 2 || wd.s[i] < S_DOME1 - 32 || wd.s[i] > S_TUBE + 46 || Math.abs(lat[i]) > 3.4) continue;
      const pk = tr2(), sd = tr2(), ln = Math.min(sd < 0.4 ? tr2.range(1.4, 4.2) : tr2.range(0.35, 1.3), hgt[i] - (Math.abs(lat[i]) < 1.7 ? 2.06 : 1.4));      // (where the roof is high some are let down metres, to hang close over the bow)
      if (pk > 0.62 * det || ln < 0.25) continue;
      st.p.push(iPos[i * 3], iPos[i * 3 + 1] - 0.02, iPos[i * 3 + 2]); st.par.push(ln, sd, 0.008 + 0.01 * sd, iPar2[i * 3 + 2]);
    }
  }
  await ctx.yield?.();

  // ---- water sheet (one ribbon for the whole river) and the black trough under the fast water
  const wg = { pos: [], w: [], w2: [], w3: [], idx: [] }, tg = { pos: [], idx: [] }, NA = 13, lt = [0, 0, 0, 0];
  {
    let tau = 0, prevS = S0, rows = 0, trows = 0;
    for (let i = 0; i <= G.iM; i++) {
      const s = G.sl[i]; L.axis(s, o);
      const vw = 0.3 + 3.5 * smoothstep(S_GROTTO - 12, S_GROTTO + 36, s) * (1 - 0.93 * smoothstep(S_DOME0 - 8, S_DOME0 + 14, s)) + 3.5 * smoothstep(S_DOME1 - 12, S_TUBE, s) + 9 * smoothstep(S_TUBE - 10, S_TUBE + 50, s); tau += (s - prevS) / vw; prevS = s;
      const hw = L.width(s) + (s < S_GROTTO - 4 || domeK(s) > 0.02 ? 3.4 : 2.2), fl = L.flow(s), sk = Math.exp(-(S_MOUTH - s) / 60);
      const irr = (cellLight(G, i, 20, lt)[3] * 2 + cellLight(G, i, 12, lt)[3] + cellLight(G, i, 28, lt)[3]) * 0.25;
      const qr = i * NS * 3, ql = (i * NS + NS - 1) * 3;                 // the shell's two waterline vertices on this ring
      const xR = (G.P[qr] - o.x) * o.rx + (G.P[qr + 2] - o.z) * o.rz, xL = (G.P[ql] - o.x) * o.rx + (G.P[ql + 2] - o.z) * o.rz;
      for (let a = 0; a < NA; a++) {
        const ac = (a / (NA - 1)) * 2 - 1, x = ac * hw;
        wg.pos.push(o.x + o.rx * x, o.y, o.z + o.rz * x); wg.w.push(x, tau, fl, irr); wg.w2.push(sk, ac, s, vw); wg.w3.push(Math.min(xL, xR), Math.max(xL, xR));
      }
      if (rows > 0) for (let a = 0; a < NA - 1; a++) { const q = (rows - 1) * NA + a, r = q + NA; wg.idx.push(q, q + 1, r, r, q + 1, r + 1); }
      rows++;
      if (s > S_TUBE - 3) {
        const xs = [-hw, -hw, hw, hw], ys = [0.02, -15, -15, 0.02];
        for (let k = 0; k < 4; k++) tg.pos.push(o.x + o.rx * xs[k], o.y + ys[k], o.z + o.rz * xs[k]);
        if (trows > 0) for (let k = 0; k < 3; k++) { const q = (trows - 1) * 4 + k, r = q + 4; tg.idx.push(q, q + 1, r, r, q + 1, r + 1); }
        trows++;
      }
      if ((i & 63) === 63) await ctx.yield?.();
    }
    const e = (trows - 1) * 4; tg.idx.push(e, e + 1, e + 2, e, e + 2, e + 3);
  }

  await ctx.yield?.();

  // ---- uniforms shared by reference between all materials
  const hsl = { h: 0, s: 0, l: 0 }; cWorm.getHSL(hsl);
  const hh = hsl.h + hue * 0.03;
  const skyK = hour === 'moonless' ? 0.14 : hour === 'dawn' ? 0.42 : (hour === 'day' || hour === 'golden' || hour === 'dusk') ? 0.36 : 0.3;
  const skyC = (hour === 'dawn' ? cMoon.clone().lerp(cMist, 0.5) : hour === 'moonless' ? cZenith.clone().lerp(cMist, 0.25) : cMist.clone().lerp(cZenith, 0.3)).multiplyScalar(skyK);
  const relief = cRelief.clone(); relief.multiplyScalar(0.8 / Math.max(relief.r, relief.g, relief.b, 1e-3));
  const drips = [];
  { // drip sites: stalactite tips near the boat's line; their rings are part of the mirror's ripple field
    rng.shuffle(tips);
    for (let i = 0; i < NDRIP; i++) {
      let t = tips[i];
      if (!t) { const s = rng.range(4, S_GROTTO - 8), out = []; G.at(G.ringOf(s), rng.range(0.3, 0.7) * (NS - 1), out); t = [out[0], out[1] - 0.1, out[2], out[1] - 0.1]; }
      drips.push({ x: t[0], y: t[1], z: t[2], h: Math.max(0.5, t[3]), period: rng.range(2.6, 6.5), phase: rng() });
    }
  }
  const U = {
    uTime: { value: 0 }, uCamL: { value: new V3(0, EYE, ENTRY_Z) }, uVelL: { value: new V3(0, 0, -3) }, uRes: { value: new THREE.Vector2(1920, 1080) },
    uGain: { value: opts.gain ?? 1 }, uGlint: { value: opts.glint ?? 1 }, uRockK: { value: 0 }, uRel: { value: 0 }, uCalm: { value: 0 }, uThreadK: { value: 1 }, uFlowK: { value: 1 }, uStreak: { value: 1.15 }, uAhead: { value: 0 }, uChev: { value: 0 }, uBrightO: { value: 1 }, uMirK: { value: opts.hallMirror ?? 0.55 }, uVoid: { value: 0 }, uMirD: { value: new THREE.Vector4() }, uMirE: { value: new THREE.Vector4() }, uLift: { value: new THREE.Color(0, 0, 0) }, uBright: { value: opts.brightness ?? 4.2 },
    uWormCol: { value: new THREE.Color().setHSL(hh, hsl.s, hsl.l) }, uRockCol: { value: relief },
    uColA: { value: new THREE.Color().setHSL(hh - 0.04, hsl.s, hsl.l) }, uColB: { value: new THREE.Color().setHSL(hh + 0.045, hsl.s, hsl.l * 1.03) },
    uSkyCol: { value: skyC }, uMouth: { value: new V3() }, uAmb: { value: cRelief.clone().multiplyScalar(0.02) },
    uBoat: { value: new THREE.Vector4(0, ENTRY_Z, 0, -1) }, uBoatP: { value: new THREE.Vector4(3, 1, 0, 0) },
    uEel: { value: new THREE.Vector4(0, 0, 0, -1) }, uEelOn: { value: 0 }, uEelY: { value: -0.045 },
    uDrip: { value: drips.map((d) => new THREE.Vector4(d.x, d.z, d.period, d.phase)) },
    uBoatS: { value: 0 }, uRelight: { value: 30 }, uShutter: { value: 0 }, uFlowC: { value: 0.02 },
    uRimK: { value: 1 }, uEven: { value: 0 }, uHue: { value: 0 },
    uCl: { value: CLOUDS.slice(0, 5).map((c) => { const o4 = []; G.at(G.ringOf(c[0]), c[1] * (NS - 1), o4); const r = c[2] * 1.5 + 2.5; return new THREE.Vector4(o4[0], o4[1], o4[2], 1 / (r * r)); }) },
  };
  { // the islands the lake rings round, and the places where drops fall into it
    U.uIsl = { value: [HALL.organT, HALL.rankD, HALL.organ, HALL.rankG, HALL.rankS].slice(0, NISL).map((q) => q ? new THREE.Vector4(q.x, q.z, q.Rb ?? q.R, q.ph) : new THREE.Vector4(0, 0, 0, 0)) };
    U.uHDrip = { value: Array.from({ length: NHD }, (_, i) => { const d = HALL.hdrips[i]; return d ? new THREE.Vector4(d[0], d[2], d[4], d[5]) : new THREE.Vector4(0, 0, 0, 0); }) };
  }
  const pick = (names, extra = {}) => { const u = THREE.UniformsUtils.clone(THREE.UniformsLib.fog); for (const n of names) u[n] = U[n]; return Object.assign(u, extra); };
  const RIP = ['uBoat', 'uBoatP', 'uEel', 'uEelOn', 'uDrip'];
  const rockMat = (mirror) => new THREE.ShaderMaterial({ fog: true, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
    uniforms: pick(['uCamL', 'uWormCol', 'uRockCol', 'uSkyCol', 'uMouth', 'uAmb', 'uLift', 'uGain', 'uGlint', 'uRockK', 'uRel', 'uCalm', 'uFlowC', 'uRimK', 'uEven', 'uHue', 'uCl', 'uColA', 'uColB', 'uMirK', 'uMirD', 'uMirE', 'uVoid', ...RIP], { uMirror: { value: mirror } }) });
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true };
  const wormMat = (flip) => new THREE.ShaderMaterial({ ...add, vertexShader: WORM_VERT, fragmentShader: WORM_FRAG,
    uniforms: pick(['uTime', 'uBoatS', 'uRelight', 'uShutter', 'uGain', 'uBright', 'uRes', 'uCamL', 'uVelL', 'uColA', 'uColB', 'uFlowC', 'uStreak', 'uAhead', ...RIP], { uFlip: { value: flip } }) });

  const mRock = rockMat(0), mRockMir = rockMat(1);
  const flowMats = []; let gFlowG = null;
  { // the Hall's flowstone and its image in the lake
    const gFlow = await fb.geometry(ctx);
    for (const mir of [0, 1]) {
      const m = new THREE.Mesh(gFlow, new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: FLOW_VERT, fragmentShader: FLOW_FRAG,
        uniforms: pick(['uCamL', 'uWormCol', 'uRockCol', 'uAmb', 'uLift', 'uGain', 'uGlint', 'uFlowK', 'uFlowC', 'uTime', 'uColA', 'uColB', ...RIP], { uMirror: { value: mir } }) }));
      if (mir) m.scale.y = -1;
      m.name = mir ? 'hall-stone-mirror' : 'hall-stone'; group.add(m);
      flowMats.push(m.material);
    }
    await ctx.yield?.();
    gFlowG = await fbG.geometry(ctx);                             // the Grotto's rank and the door rank: the same stone, shown from the entry on (they are seen down the gallery)
    for (const mir of [0, 1]) {
      const m = new THREE.Mesh(gFlowG, flowMats[mir]);
      if (mir) m.scale.y = -1;
      m.name = mir ? 'rank-stone-mirror' : 'rank-stone'; group.add(m);
    }
    await ctx.yield?.();
  }
  { // what hangs into the first frames, and its image
    const gE = await mbE.geometry(ctx);
    const te = new THREE.Mesh(gE, mRock); te.name = 'grotto-teeth'; group.add(te);
    const tm = new THREE.Mesh(gE, mRockMir); tm.scale.y = -1; tm.name = 'grotto-teeth-mirror'; group.add(tm);
    await ctx.yield?.();
  }
  const geos = [];
  for (const m of mbs) { geos.push(await m.geometry(ctx)); await ctx.yield?.(); }
  const chunks = geos.map((g, k) => { const m = new THREE.Mesh(g, mRock); m.name = ['grotto', 'tube', 'flume'][k]; group.add(m); return m; });
  const gMirror = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'aLight', 'aSky', 'aSoft']) gMirror.setAttribute(k, geos[0].getAttribute(k));
  gMirror.setIndex(new THREE.BufferAttribute(geos[0].index.array.slice(0, mirrorCut), 1)); gMirror.boundingSphere = geos[0].boundingSphere.clone();
  const mirror = new THREE.Mesh(gMirror, mRockMir); mirror.scale.y = -1; mirror.name = 'grotto-mirror'; group.add(mirror);
  // the Tube is level too: its rock is mirrored whole, so the quickening water still holds the roof (the Flume slopes: a black trough)
  const mirrorT = new THREE.Mesh(geos[1], mRockMir); mirrorT.scale.y = -1; mirrorT.name = 'tube-mirror'; group.add(mirrorT);
  await ctx.yield?.();
  // the Flume slopes, so its image is worked out here: every vertex reflected in the water's own plane at its place on the
  // river (the Flume is dead straight in plan, so the river distance of a point is a projection). The collar round the mouth
  // is left out. Shaded as the rock it shows (aOrg), seen from the eye's image (aPl = the water's normal).
  const gMirF = new THREE.BufferGeometry();
  {
    const gF = geos[2], pF = gF.getAttribute('position').array, nV = pF.length / 3, mPos = new Float32Array(pF.length), mPl = new Float32Array(pF.length);
    L.axis(S_TUBE, o); const fx0 = o.x, fz0 = o.z, fdx = o.dx, fdz = o.dz;
    for (let v = 0; v < nV; v++) {
      const x = pF[v * 3], y = pF[v * 3 + 1], z = pF[v * 3 + 2];
      L.axis(clamp(S_TUBE + (x - fx0) * fdx + (z - fz0) * fdz, S_TUBE, S_MOUTH), o);
      let nx = -o.slope * o.dx, ny = 1, nz = -o.slope * o.dz; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const d = (x - o.x) * nx + (y - o.y) * ny + (z - o.z) * nz;
      mPos[v * 3] = x - 2 * d * nx; mPos[v * 3 + 1] = y - 2 * d * ny; mPos[v * 3 + 2] = z - 2 * d * nz;
      mPl[v * 3] = nx; mPl[v * 3 + 1] = ny; mPl[v * 3 + 2] = nz;
      if ((v & 2047) === 2047) await ctx.yield?.();
    }
    const iF = gF.index.array, cutA = (G.iM - G.iT) * (NS - 1) * 6, cutB = (G.NR - 1 - G.iT) * (NS - 1) * 6, mi = [];
    for (let k = 0; k < iF.length; k += 3) { if (k >= cutA && k < cutB) continue; mi.push(iF[k], iF[k + 2], iF[k + 1]); }     // an image turns its triangles over
    gMirF.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); gMirF.setAttribute('aOrg', gF.getAttribute('position')); gMirF.setAttribute('aPl', new THREE.BufferAttribute(mPl, 3));
    for (const k of ['normal', 'aLight', 'aSky', 'aSoft']) gMirF.setAttribute(k, gF.getAttribute(k));
    gMirF.setIndex(new THREE.BufferAttribute(nV > 65535 ? new Uint32Array(mi) : new Uint16Array(mi), 1)); gMirF.computeBoundingSphere();
  }
  const mirrorF = new THREE.Mesh(gMirF, rockMat(2)); mirrorF.name = 'flume-mirror'; group.add(mirrorF);
  await ctx.yield?.();

  let nG = 0; while (nG < nMain && wd.s[nG] < S_GROTTO) nG++;           // the Chandelier's, the Grotto's and the hall's worms come first
  const wSet = (a, b) => ({ iPos: new THREE.InstancedBufferAttribute(iPos.subarray(a * 3, b * 3), 3), iMir: new THREE.InstancedBufferAttribute(iMir.subarray(a * 3, b * 3), 3),
    iPar: new THREE.InstancedBufferAttribute(iPar.subarray(a * 4, b * 4), 4), iPar2: new THREE.InstancedBufferAttribute(iPar2.subarray(a * 3, b * 3), 3) });
  const nCh = wd.ch.reduce((a, c) => a + (c ? 1 : 0), 0);
  const nF0 = Math.max(nG, Math.min(nMain, nPass + nCh));         // then the Tube's and the Hall's, then the Flume's (and the outside ones). (nPass was counted before the Chandelier's worms were moved to the front.)
  const wA = wSet(0, nG), wB = wSet(nG, nF0), wC = wSet(nF0, nAll), mW = wormMat(0), mWM = wormMat(1);
  const wormMesh = (n, at, mat, ro, name) => { const m = new THREE.Mesh(quadGeometry(n, at), mat); m.frustumCulled = false; m.renderOrder = ro; m.name = name; group.add(m); return m; };
  const worms = wormMesh(nG, wA, mW, 3, 'worms'), wormsT = wormMesh(nF0 - nG, wB, mW, 3, 'worms-tube'), wormsF = wormMesh(nAll - nF0, wC, mW, 3, 'worms-flume');
  { // the Organ's own lights (on the great pendant and under the tall column's lips) and their images
    const n = HALL.lights.length, p = new Float32Array(n * 3), mi = new Float32Array(n * 3), pa = new Float32Array(n * 4), p2 = new Float32Array(n * 3), fl = L.flow(HALL.organ.s);
    HALL.lights.forEach((q, i) => { p.set([q[0], q[1], q[2]], i * 3); mi.set([q[0], -q[1], q[2]], i * 3); pa.set([q[3], rF(), q[5] ?? clamp(rF.gauss() * 0.45 - 0.3, -1, 1), 0], i * 4); p2.set([q[4] ?? HALL.organ.s, fl, 0], i * 3); });
    const at = { iPos: new THREE.InstancedBufferAttribute(p, 3), iMir: new THREE.InstancedBufferAttribute(mi, 3), iPar: new THREE.InstancedBufferAttribute(pa, 4), iPar2: new THREE.InstancedBufferAttribute(p2, 3) };
    const mWMo = wormMat(1); mWMo.uniforms.uBright = U.uBrightO;            // the images of the ranks' own lights: half as bright as the lights (the waterline reads)
    wormMesh(n, at, mW, 3, 'worms-organ'); wormMesh(n, at, mWMo, 2.5, 'worms-organ-mirror');
  }
  const wormsMir = wormMesh(nG, wA, mWM, 2.5, 'worms-mirror'), wormsMirT = wormMesh(nF0 - nG, wB, mWM, 2.5, 'worms-mirror-tube'), wormsMirF = wormMesh(nMain - nF0, wC, mWM, 2.5, 'worms-mirror-flume');

  const snares = new THREE.Mesh(
    quadGeometry(sn.par.length / 4, { iPos: new THREE.InstancedBufferAttribute(new Float32Array(sn.p), 3), iPar: new THREE.InstancedBufferAttribute(new Float32Array(sn.par), 4) }, 0),
    new THREE.ShaderMaterial({ ...add, side: THREE.DoubleSide, vertexShader: SNARE_VERT, fragmentShader: SNARE_FRAG, uniforms: pick(['uCamL', 'uVelL', 'uTime', 'uWormCol', 'uGain']) }));
  snares.frustumCulled = false; snares.renderOrder = 4; snares.name = 'snares'; group.add(snares);
  { // the Hall's threads and their image in the lake
    const NSEG = 5, tp = [], ti = [];
    for (let k = 0; k <= NSEG; k++) tp.push(-1, k / NSEG, 0, 1, k / NSEG, 0);
    for (let k = 0; k < NSEG; k++) { const q = k * 2; ti.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
    const n = th.par.length / 4, tPos = new THREE.InstancedBufferAttribute(new Float32Array(th.p), 3), tPar = new THREE.InstancedBufferAttribute(new Float32Array(th.par), 4);
    for (const flip of [0, 1]) {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); g.setIndex(ti);
      g.setAttribute('iPos', tPos); g.setAttribute('iPar', tPar); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new V3(0, 0, -80), 400);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ ...add, side: THREE.DoubleSide, vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG,
        uniforms: pick(['uCamL', 'uVelL', 'uRes', 'uTime', 'uWormCol', 'uGain', 'uThreadK', 'uFlowC', ...RIP], { uFlip: { value: flip } }) }));
      m.frustumCulled = false; m.renderOrder = flip ? 2.5 : 4; m.name = flip ? 'threads-mirror' : 'threads'; group.add(m);
      // the short snares: two segments each, the same material
      const gs = new THREE.InstancedBufferGeometry();
      gs.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 0.5, 0, 1, 0.5, 0, -1, 1, 0, 1, 1, 0], 3)); gs.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5]);
      gs.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(st.p), 3)); gs.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(st.par), 4)); gs.instanceCount = st.par.length / 4;
      gs.boundingSphere = new THREE.Sphere(new V3(0, 0, -80), 400);
      const ms = new THREE.Mesh(gs, m.material);
      ms.frustumCulled = false; ms.renderOrder = flip ? 2.5 : 4; ms.name = flip ? 'snares-short-mirror' : 'snares-short'; group.add(ms);
    }
  }
  await ctx.yield?.();

  const gWater = new THREE.BufferGeometry();
  gWater.setAttribute('position', new THREE.Float32BufferAttribute(wg.pos, 3));
  gWater.setAttribute('aW', new THREE.Float32BufferAttribute(wg.w, 4)); gWater.setAttribute('aW2', new THREE.Float32BufferAttribute(wg.w2, 4)); gWater.setAttribute('aW3', new THREE.Float32BufferAttribute(wg.w3, 2));
  gWater.setIndex(wg.idx); gWater.computeBoundingSphere();
  await ctx.yield?.();
  const water = new THREE.Mesh(gWater, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: true,
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, uniforms: pick(['uTime', 'uCamL', 'uWormCol', 'uSkyCol', 'uAmb', 'uMouth', 'uGain', 'uIsl', 'uHDrip', 'uChev', ...RIP]) }));
  water.renderOrder = 2; water.name = 'water'; group.add(water);
  const gTrough = new THREE.BufferGeometry();
  gTrough.setAttribute('position', new THREE.Float32BufferAttribute(tg.pos, 3)); gTrough.setIndex(tg.idx); gTrough.computeBoundingSphere();
  const trough = new THREE.Mesh(gTrough, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })); trough.name = 'trough'; group.add(trough);
  await ctx.yield?.();
  { // the sky seen in the mouth of the Flume's image
    L.axis(S_MOUTH - 0.15, o); const hw = L.width(S_MOUTH) + 2.2, D = 14.8, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([o.x - o.rx * hw, o.y, o.z - o.rz * hw, o.x + o.rx * hw, o.y, o.z + o.rz * hw, o.x + o.rx * hw, o.y - D, o.z + o.rz * hw, o.x - o.rx * hw, o.y - D, o.z - o.rz * hw], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([-1, 0, 1, 0, 1, D, -1, D], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeBoundingSphere();
    const mi = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: MOUTH_VERT, fragmentShader: MOUTH_FRAG, uniforms: { uSkyCol: U.uSkyCol, uGain: U.uGain, uTime: U.uTime } }));
    mi.name = 'mouth-image'; group.add(mi);
  }

  await ctx.yield?.();

  // ---- nine cave weta on the Chandelier's camera-side edge (they never walk: only the antennae move)
  const wetaPos = [];
  const weta = new THREE.InstancedMesh(wetaGeometry(), new THREE.ShaderMaterial({ fog: true, vertexShader: WETA_VERT, fragmentShader: WETA_FRAG, uniforms: pick(['uTime', 'uWormCol', 'uGain']) }), 9);
  {
    // giants of their kind: body a hand long, legs and antennae spanning most of a metre, so that they read as animals from the
    // boat; flat on the bright curtain, heads down or up, every one a true black silhouette
    const m4 = new THREE.Matrix4(), X = new V3(), Y = new V3(), Z = new V3(), dn = new V3(0, -1, 0), sd = new V3();
    for (let i = 0; i < 9; i++) {
      const q = CH.seats[i % Math.max(1, CH.seats.length)] || { x: -1.2, y: 4, z: 0.3, ox: -1, oz: 0 };
      Y.set(q.ox, 0.0, q.oz).normalize(); sd.crossVectors(Y, dn).normalize();
      const roll = rng.range(-0.8, 0.8) + (rng() < 0.3 ? Math.PI : 0);
      Z.copy(dn).multiplyScalar(Math.cos(roll)).addScaledVector(sd, Math.sin(roll)).normalize(); X.crossVectors(Y, Z);
      const sc = rng.range(2.7, 3.5);
      m4.makeBasis(X.clone().multiplyScalar(sc), Y.clone().multiplyScalar(sc), Z.clone().multiplyScalar(sc)).setPosition(q.x, q.y, q.z);
      weta.setMatrixAt(i, m4); wetaPos.push(new V3(q.x, q.y, q.z));
    }
    weta.instanceMatrix.needsUpdate = true; weta.frustumCulled = false; weta.name = 'weta'; group.add(weta);
  }
  const eel = new THREE.Mesh(eelGeometry(), new THREE.ShaderMaterial({ fog: true, vertexShader: EEL_VERT, fragmentShader: EEL_FRAG, uniforms: pick(['uEel', 'uTime', 'uEelY', 'uWormCol', 'uGain']) }));
  eel.frustumCulled = false; eel.name = 'eel'; group.add(eel);
  {
    const dp = [], dq = []; for (const d of drips) { dp.push(d.x, d.y, d.z); dq.push(d.h, d.period, d.phase, rng()); }
    const dm = new THREE.Mesh(quadGeometry(drips.length, { iPos: new THREE.InstancedBufferAttribute(new Float32Array(dp), 3), iPar: new THREE.InstancedBufferAttribute(new Float32Array(dq), 4) }),
      new THREE.ShaderMaterial({ ...add, vertexShader: DRIP_VERT, fragmentShader: DRIP_FRAG, uniforms: pick(['uTime', 'uCamL', 'uWormCol', 'uGain']) }));
    dm.frustumCulled = false; dm.renderOrder = 4; dm.name = 'drips'; group.add(dm);
    // and the drops that fall from the Hall's roof into its lake (their rings are drawn by the water: uHDrip)
    const hp = [], hq = []; for (const d of HALL.hdrips) { hp.push(d[0], d[1], d[2]); hq.push(d[3], d[4], d[5], rF()); }
    const hm = new THREE.Mesh(quadGeometry(HALL.hdrips.length, { iPos: new THREE.InstancedBufferAttribute(new Float32Array(hp), 3), iPar: new THREE.InstancedBufferAttribute(new Float32Array(hq), 4) }), dm.material);
    hm.frustumCulled = false; hm.renderOrder = 4; hm.name = 'drips-hall'; group.add(hm);
  }

  // The mirror's budget. The count of images is worked out as it always was, from the colony as it was dealt before the lights
  // added to the Grotto's clouds and right wall (ex 3, 4: they are all in the Grotto's set and all have their image), so the
  // Hall's and the Flume's images are as many as before: the Flume's images go first, the Sphere's last. tubeTrim is how many
  // of the Hall's are drawn while the Grotto is still drawn with it (the neck: the fullest stretch of the cave); once the
  // Grotto is put away behind us the Hall's lake holds every one of its lights (see update).
  let tubeTrim = 0, tubeFull = 0;
  {
    const tri = (g) => (g.index ? g.index.count : 0) / 3;
    let nNew = 0; for (let i = 0; i < nMain; i++) if (wd.ex[i] >= 3) nNew++;
    const others = geos.reduce((a, g) => a + tri(g), 0) + tri(gMirror) + tri(geos[1]) + tri(gMirF) + tri(gWater) + tri(gTrough) + sn.par.length / 2 + th.par.length * 5 + tri(weta.geometry) * 9 + tri(eel.geometry) + drips.length * 2 + (nAll - nNew) * 2;
    const nMain0 = nMain - nNew, nG0 = nG - nNew, nF00 = nF0 - nNew;
    const nm = clamp(Math.floor(Math.min(nMain0 * det, (300000 - others) / 2)), Math.min(3000, nMain0), nMain0);
    wormsMir.geometry.instanceCount = Math.min(nG, nm + nNew);
    tubeTrim = clamp(nm - nG0, 0, nF0 - nG); tubeFull = Math.max(tubeTrim, Math.floor((nF0 - nG) * det));
    wormsMirT.geometry.instanceCount = tubeTrim; wormsMirF.geometry.instanceCount = clamp(nm - nF00, 0, nMain - nF0);
  }
  // the ranks' stone (rank-stone and its image share one geometry, laid down door rank, Grotto's rank, Sphere's rank): each
  // of the two that stand in the Grotto is put away once it is six metres behind the eye (see update)
  const rankEnd = [HALL.rankD.i1, HALL.rankG.i1];
  { // where the Hall's lake begins and ends (the rock's image in it is dim: uMirD, uMirE)
    L.axis(S_GROTTO, o); U.uMirD.value.set(o.x, o.z, o.dx, o.dz); L.axis(S_TUBE, o); U.uMirE.value.set(o.x, o.z, o.dx, o.dz);
  }

  await ctx.yield?.();

  // ---- the camera line, the arc out of the mouth, anchors
  const o2 = {};
  const camPoint = (s, out = new V3()) => { L.axis(s, o2); const cx = L.camX(s); return out.set(o2.x + o2.rx * cx, o2.y + EYE, o2.z + o2.rz * cx); };
  L.axis(S_MOUTH, o);
  const mDir = new V3(o.dx, 0, o.dz), mRight = new V3(o.rx, 0, o.rz), lip = new V3(o.x, o.y, o.z), lipEye = camPoint(S_MOUTH);
  U.uMouth.value.copy(lip).addScaledVector(mDir, 5).add(new V3(0, 3.6, 0));
  const air = (k, y, r) => lipEye.clone().addScaledVector(mDir, k).addScaledVector(mRight, r).add(new V3(0, y, 0));
  const cavePts = []; for (let s = 0; s < S_MOUTH - 3; s += 6) cavePts.push(camPoint(s)); cavePts.push(lipEye.clone());
  // The flight out of the mouth, 190 m: fired out level and a little to the right of the plume, a long glide down the gorge
  // with the whole valley, the fall and the sky in front (the bow dips no faster than the land opens), then a slow left turn
  // onto a last straight 60 m at 33 degrees down into the ring, which hangs over the far rim of the pool, high in the fall's
  // mist. Heading (degrees right of the flume's axis) and pitch are keyed to metres flown and integrated a metre at a time.
  const arcPts = [];
  {
    const KD = [0, 8, 22, 40, 62, 85, 108, 126, 130, 190], KY = [0, 6, 15, 16, 13, 4, -12, -23, -25, -25], KP = [6, 4.5, 0.5, -3, -8.5, -15, -24, -31.5, -33, -33];
    const key = (K, d) => { let i = 0; while (i < KD.length - 2 && d > KD[i + 1]) i++; const t = clamp((d - KD[i]) / (KD[i + 1] - KD[i]), 0, 1);
      const m0 = i > 0 ? (K[i + 1] - K[i - 1]) / (KD[i + 1] - KD[i - 1]) : 0, m1 = i < KD.length - 2 ? (K[i + 2] - K[i]) / (KD[i + 2] - KD[i]) : 0, h = KD[i + 1] - KD[i];
      const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * K[i] + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * K[i + 1] + (t3 - t2) * h * m1; };
    let ak = 0, ay = 0, ar = 0;
    for (let d = 1; d <= 190; d++) {
      const yw = (d > 130 ? -25 : key(KY, d - 0.5)) * RAD, pt = (d > 130 ? -33 : key(KP, d - 0.5)) * RAD;
      ak += Math.cos(pt) * Math.cos(yw); ar += Math.cos(pt) * Math.sin(yw); ay += Math.sin(pt);
      if (d % 10 === 0) arcPts.push(air(ak, ay, ar));
    }
  }
  const flyThrough = cavePts.concat(arcPts);
  await ctx.yield?.();
  const ridePath = makePath(flyThrough);
  await ctx.yield?.();
  // river distance against distance flown: the camera line wanders (an S through the Grotto), so the two are not quite the same
  const distTab = [0]; { const pa = camPoint(0), pb = new V3(); for (let s = 1; s <= S_MOUTH; s++) { camPoint(s, pb); distTab.push(distTab[s - 1] + pa.distanceTo(pb)); pa.copy(pb); } }
  const caveLen = distTab[S_MOUTH], caveU = caveLen / ridePath.length;
  const riverAt = (d) => {                                              // metres flown from the entry -> river distance s
    if (d <= 0) return d; if (d >= caveLen) return S_MOUTH + (d - caveLen);
    let lo = 0, hi = S_MOUTH; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (distTab[m] <= d) lo = m; else hi = m; }
    return lo + (d - distTab[lo]) / Math.max(1e-4, distTab[hi] - distTab[lo]);
  };
  const dive = new V3().subVectors(arcPts[arcPts.length - 1], arcPts[arcPts.length - 2]).normalize();
  const mid = camPoint((S0 + S_MOUTH) * 0.5), center = new V3(mid.x, 3, mid.z);
  const radius = (S_MOUTH - S0) * 0.5 + 18, height = 11;
  const anchors = {
    entry: { position: camPoint(0), direction: new V3(0, 0, -1) },
    flyThrough, cavePath: cavePts, arc: arcPts,
    pathAt(s, out = new V3()) { return camPoint(clamp(s, S0 + 2, S_MOUTH), out); },
    portalSeat: { position: arcPts[arcPts.length - 1].clone(), normal: dive.clone().negate(), radius: 7, tilt: true },
    chandelier: { position: new V3(0, (CH.yTop + CH.yTip) * 0.5, 0), top: new V3(0, CH.yTop, 0), tip: new V3(0, CH.yTip, 0), width: CH.RX * 2, dist: ENTRY_Z },
    weta: wetaPos,
    mouth: { position: lip.clone(), eye: lipEye.clone(), direction: new V3().copy(mDir).add(new V3(0, Math.tan(6 * RAD), 0)).normalize(), right: mRight.clone(), width: 2 * L.width(S_MOUTH), height: L.roof(S_MOUTH) },
    plume: { origin: lip.clone().add(new V3(0, 0.3, 0)), velocity: new V3().copy(mDir).multiplyScalar(22 * Math.cos(6 * RAD)).add(new V3(0, 22 * Math.sin(6 * RAD), 0)), gravity: 9.8 },
    sections: { grotto: [0, S_GROTTO], tube: [S_GROTTO, S_TUBE], dome: [S_DOME0, S_DOME1], flume: [S_TUBE, S_MOUTH], hall: S_HALL, bendEnd: L.k3, caveU, caveLen, pathLength: ridePath.length },
    organ: { position: new V3(HALL.organ.x, HALL.organ.top * 0.5, HALL.organ.z), top: HALL.organ.top, s: HALL.organ.s }, domeK: (s) => domeK(s),
    // the Organ's other ranks down the river
    ranks: Object.fromEntries([['sphere', HALL.rankS], ['grotto', HALL.rankG], ['door', HALL.rankD], ['great', HALL.organT], ['far', HALL.organ]].map(([k, q]) => [k, { position: new V3(q.x, q.top * 0.5, q.z), top: q.top, s: q.s, lat: q.lat, radius: q.R }])),
    domeCentre: (() => { L.axis((S_DOME0 + S_DOME1) * 0.5, o2); return new V3(o2.x, L.roof((S_DOME0 + S_DOME1) * 0.5) * 0.6, o2.z); })(),
    riverAt, speedAt: (s) => L.speed(s),
    drips: drips.map((d) => new V3(d.x, d.y, d.z)),
    viewpoints: { sphere: camPoint(21), sphereLook: new V3(0, 2.2, 0), chandelierPass: camPoint(45.4), tube: camPoint(S_GROTTO + 30), hall: camPoint(S_DOME0 + 20), flume: camPoint(S_MOUTH - 51), flumeLook: lipEye.clone() },
  };

  await ctx.yield?.();

  // ---- per-frame state: everything scripted is keyed to where the boat is on the river, never to the clock
  let progress = null, boat = null, hasPrev = false, eyeS = null; const boatBuf = { position: null, direction: null, speed: 0 };
  const inv = new THREE.Matrix4(), camL = new V3(), prevCam = new V3(), vel = new V3(0, 0, -3), tA = new V3(), tB = new V3(), tC = new V3(), res = new THREE.Vector2();
  const nearestS = (p) => {
    let best = 1e12, bs = 0;
    for (let s = S0; s <= S_MOUTH; s += 2) { L.axis(s, o2); const d = (o2.x - p.x) ** 2 + (o2.z - p.z) ** 2; if (d < best) { best = d; bs = s; } }
    const s0 = bs; best = 1e12;
    for (let s = s0 - 2; s <= s0 + 2; s += 0.25) { L.axis(s, o2); const d = (o2.x - p.x) ** 2 + (o2.z - p.z) ** 2; if (d < best) { best = d; bs = s; } }
    if (bs >= S_MOUTH - 0.3) { L.axis(S_MOUTH, o2); bs = S_MOUTH + Math.max(0, (p.x - o2.x) * o2.dx + (p.z - o2.z) * o2.dz); }
    return bs;
  };
  function update(dt, time, camera) {
    group.updateWorldMatrix(true, false); inv.copy(group.matrixWorld).invert();
    if (camera) { if (camera.getWorldPosition) camera.getWorldPosition(camL); else camL.copy(camera.position); camL.applyMatrix4(inv); }
    const P = boat ? boat.position : progress != null ? ridePath.pointAt(progress, tC) : camL;
    const s = nearestS(P); L.axis(Math.min(s, S_MOUTH), o);
    let speed;
    if (boat) { speed = boat.speed; vel.copy(boat.direction).multiplyScalar(speed); }
    else if (progress != null || !(dt > 1e-5) || !hasPrev) {
      speed = s > S_MOUTH ? 24 : L.speed(s);
      if (progress != null) ridePath.tangentAt(progress, tB); else tB.set(o.dx, o.slope, o.dz).normalize();
      vel.copy(tB).multiplyScalar(speed);
    } else {
      tB.copy(camL).sub(prevCam).divideScalar(dt);
      if (tB.length() < 90) vel.lerp(tB, 1 - Math.exp(-dt * 8));
      speed = vel.length();
    }
    prevCam.copy(camL); hasPrev = true;
    let hx = vel.x, hz = vel.z; const hl = Math.hypot(hx, hz); if (hl > 0.2) { hx /= hl; hz /= hl; } else { hx = o.dx; hz = o.dz; }
    U.uTime.value = time; U.uCamL.value.copy(camL); U.uVelL.value.copy(vel);
    U.uBoat.value.set(P.x + hx * 3.3, P.z + hz * 3.3, hx, hz);
    U.uBoatP.value.set(speed, smoothstep(0.3, 2.5, speed) * (1 - smoothstep(S_MOUTH - 6, S_MOUTH + 1, s)), time, 0);
    U.uBoatS.value = s; U.uRelight.value = Math.max(22, 8 * speed);
    U.uFlowC.value = L.flow(Math.min(s + 4, S_MOUTH));                 // how quick the water is where the eye meets it: every image shivers by this
    U.uShutter.value = 0.042 * smoothstep(6, 12, speed) * (opts.streak ?? 1);      // (the world lengthens it where the current takes hold)
    U.uBrightO.value = U.uBright.value * 0.5;
    const se = eyeS ?? s;                                              // the eye's river distance (the world gives it: setEyeS)
    wormsMirT.geometry.instanceCount = se > S_GROTTO + 4 ? tubeFull : tubeTrim;      // (the world puts the Grotto away four metres into the neck)
    if (gFlowG) gFlowG.setDrawRange(0, se > RANK_G[0] + 6 ? rankEnd[0] : se > RANK_S[0] + 6 ? rankEnd[1] : Infinity);
    // the eel: a black S that slides across under the bow, left to right, while the boat covers s = 12.5 .. 36 (the eye is at
    // u 0.023 .. 0.067: not yet in the frame of the arrival, where its wet back alone was a stray line over black water). It keeps station with us as we overhaul it: 3.3 down to 1.5 m ahead of the eye, 2 to 3 m from it.
    const w = (s - 14.5) / 17, fw = 1.15 + lerp(3.4, 1.7, w), la = lerp(-3.2, 3.2, w), rx = -hz, rz = hx;
    let ex = hx * 0.42 + rx * 0.91, ez = hz * 0.42 + rz * 0.91; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
    U.uEel.value.set(P.x + hx * fw + rx * la + ex * 1.05, P.z + hz * fw + rz * la + ez * 1.05, ex, ez);
    U.uEelOn.value = opts.eel === false ? 0 : smoothstep(-0.12, 0.02, w) * (1 - smoothstep(1.05, 1.25, w));
    eel.visible = U.uEelOn.value > 0.001;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(res); if (res.x > 0) U.uRes.value.copy(res); }
  }
  update(0, 0, null);

  return {
    object: group, radius, height, center, anchors, ground: false, groundY: 0,
    uniforms: U, chunks, counts: { worms: nAll, snares: sn.par.length / 4 },
    update,
    setEyeS(s) { eyeS = s; },                                          // the eye's river distance, for what is put away behind it
    setProgress(u) { progress = u == null ? null : clamp(u, 0, 1); },                           // journey u (cave = 0 .. anchors.sections.caveU)
    setBoat(position, direction, speed) { if (!position) { boat = null; return; } boatBuf.position = position; boatBuf.direction = direction; boatBuf.speed = speed; boat = boatBuf; },   // local space, overrides everything
    setSky(color, k = 1) { U.uSkyCol.value.set(color).multiplyScalar(k); },
    dispose() {},
  };
}
