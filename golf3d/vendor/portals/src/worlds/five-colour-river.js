// RIVER OF FIVE COLOURS - Cano Cristales in bloom, flown low and fast as a swallow flies the river.
//
// World space = the hero's local space (src/parts/five-colour-river.js sits at the origin): the river runs toward
// -Z, the morning sun stands on -X (our left). z ~ +335 entry in the moss corridor | 235 corridor mouth, the
// Gatepost at 217 | 235..116 the sand shallows (butterfly clubs, sunbittern, heron) | 116..90 shelf, 90 the ledge |
// 90..-90 THE RED CARPET | -90..-195 the cascade | -225 the portal between two buttresses under a leaning moriche.
// Everything this file adds is lit by the hero's own light uniforms (sun, sky, cloud shadow, time), so the whole
// valley dims under one cloud; kit flora and fauna get a three.js rig set to the same values.
//
// Banks: a planted shelf at the water (bankAt: BK.d wide), then bedded rock scarps 3-10 m high (wallSheet,
// 'fcr-scarp') hung with ferns and roots, gallery forest on the plateau behind; the sunward scarp lays a shadow on
// the water. At z 128 a headland of the right scarp steps 11 m into the river, 18 m high, and a tributary falls over
// its upstream face into a pool ('fcr-tributary-fall'); a cocoi heron stands in the shallows 13 m out from the right
// bank above it. The sand reach is a shallow clear river over sand: two channels wind down it, knee-deep and green-turquoise
// (natural(): chn), ribs of mossed rock lie slantwise across it a hand under the glass (rib), the cobbles gather on the channels' shoulders,
// three mossed boulders stand beside the line with their pillows, and the yellow is left to the bars and the flats; red weed
// (hero.makeFronds, 'fcr-upper-weed') begins on the ribs in flecks from z 226 and thickens to a carpet by the ledge. The corridor (z > 236) is all green: water deepening to 1.5 m over mossed shoals
// with green weed ('fcr-corridor-weed', hero fronds; the shaded ones on their own dimmer material), pebbles and fish, the
// first yellow sand at the mouth; the Gatepost stands dark on the axis in the bright slot; 32 m up the slot from its mouth a fallen tree
// bridges it ('fcr-log', ferns and hanging roots on it). The slot's water carries long racing foam lines, drifting leaves, the
// walls' mirror broken by ripples, and patches of sun let down through the trees on the rim (corrSh). Every boulder in the water (uRocks, 19 slots in the
// water shader) gets a pillow on its upstream face ('fcr-rock-pillows', raised white water), a V wake and a lee.
// Foam is thin soft threads drawn out along the streamlines, in loose rafts, fainter under the eye. Within 23 m the bed is
// drawn plant by plant (the hero's fcrTuft) under a caustic net (fcrNet), its masks torn per pixel. Below the brink a belt of gallery forest stands on both
// banks ('belts': a rank of trees, three of crowns, and palms). Every broadleaf crown is canopyGeo(): six to nine
// small leaf masses on a flattened dome over a bole and limbs, shaded by FRAG_CROWN (the dome's normal lights it,
// the lobe's own normal cuts a ragged leaf-scale outline, sky-blue fill below, warm back-light at a low sun). The
// front rank and the wall trees by the gate are drawn from a low-poly copy until their stretch of the river is within 80 m (beltLod).
// The two buttresses at the portal are bare wet black rock, ferns on crowns and ledges only; the lower stacks beside them
// are rounded (wallSheet o.round) and ferned ('fcr-stack-ferns').
// Culling by camera z in update(): the hero's bed, water, wells and otters are hidden in the slot (z > 262: the walls
// close the view there), its wells and otters stand from z 150 (60 m above the ledge that hides them), the belts wait for z < 165, the corridor weed is dropped past the mouth; the log and the slot's ferns go
// 26 m past the mouth (behind us from then on), the upper reach's boulders, pebbles, bed and water at z 52, the clubs at 80; the gate's ferns wait for z < 40;
// the wells are dropped once the eye is below the brink and a metre under the slab's water as it stands (the brink's lip hides them).
// The scarps' ferns and the vellozia are drawn by stretches of the river, each while the eye's z is within its reach. BELOW THE
// BRINK THE LOOK TURNS ACROSS AND UP THE RIVER (fallLook), so from the brink until the eye is 6 m past the place where the look
// is straight ahead again (z -174) no stretch of them up the river is let go, and the log and the slot's ferns stand again: on that
// stretch a cull drops only what the land hides from the eye's place (the upper river and what lies on it, above the ledge; the
// wells), never what merely lies behind the eye. The slab's weed is never dropped for the eye's depth: its tops show over the lip.
// What the frame cannot hold the renderer passes over by each thing's own ball, whatever the lens: so also the weed's stretches
// (the hero) and the kit's effects that stay in one place (the mists, the slot's shafts and drips: marked so in build()).
// Read from where the eye IS, never from where it looks: these culls, the bittern's and the clubs' distances, and in the hero the wells' mirror and
// the mat between the weed's plants (by the direction to the eye) and the levels of detail that go by the pixel's footprint.
// Flight, THE MIDDLE LINE (path): a metre over the water down the slot, then climbing steadily
// down the sand reach (2 m over the water at z 196, 3 m at z 150) and up over the ledge, an S-swing right then left over the slab
// (keeps u 0.40-0.46 on the reveal) coming down to 2.9 m over the carpet at z 4, sinking a hand to the 2.5 m it holds over the lip
// of the brink. A LOW LINE (mk(z, false): 1.0 m over the sand, 1.2 m over the carpet) is built once, only to measure by: held()
// lifts each look's end by what the middle line stands over it at the eye's z (riseAt), so FROM THE MIDDLE LINE a look has the
// pitch it would have from the low one. ON THE ONE RISE (below) the eye stands up to 3.5 m over the middle line and nothing more
// is added: the two looks that fall there, the reveal's (letting go as the rise begins) and the macaws', pitch that much more
// steeply down, and the carpet is looked down on from above.
// THE ROUTE the eye flies is that middle line carried up once and aside once (route, FLK), each by a law of metres:
// ONE RISE over the carpet, from 268.5 m of route to the place where the macaws cross (z 40), eased up and eased down, to 8.6 m
// over the slab's water, so that the river is seen once from above as a pattern of red beds, wells and the blue lane; and THE
// FLANK: from the brink the line leaves the middle for the RIGHT bank's shelf (the chute's side: the otters riding it pass under
// the eye, and the falls are lit from the left in the morning and stand against the low sun at the golden hour), from 8 m
// below the brink out in 50 m of z to 6 m outside the water's edge at each lip where the shelf has the room and never nearer the scarp's foot than 3.4 m,
// 3.2 m over each lip's water. THE LIPS: the brink (z -90), then one every 15 m (-105, -120, -135, -150, -165, -180), the last
// fall at -195, the ring at -225. Past the brink and the lips at -105, -120 and -135 the line swings out and stands over the shelf;
// from 3 m below the lip at -135 it comes BACK across the lower steps in one S of 52 m of z, on a level keel (the camera's bank
// is read from the middle line's direction there), and is on the middle from z -190; its height over the middle line is whole
// down to z -170 and is given back between there and -195. FROM Z -195 TO THE RING, 30 m, THE ROUTE IS THE
// MIDDLE LINE ITSELF, straight down the ring's axis. So the lower lips (-150, -165, -180) are passed on the slant, the eye coming
// in over the water again between the first two of them.
// THE LOOK ACROSS THE FALLS (fallLook: a yaw by the eye's z, by the compass) is laid by the lips: eased in from 2 m below the
// brink over 24 m; FULL, 105 degrees round from down the river, for 30 m, from 4 m above the lip at -120 to 4 m above the lip at
// -150 (the eye passes the lips at -120 and -135, the two it stands beside before the way back); eased back over 28 m to
// straight down the river at z -174, so that the ring stands whole ahead from about z -170 and the last fall is met head on.
// The turn is PAST ABEAM (over 90 degrees) because a fall's face is seen only looking back up the river: abeam, a lip is a line
// seen edge on; 15 degrees back, the white face under it is in the picture, lip above lip.
// Plants are kept off the flank's line by place (route.beside): the air is the line's, whatever the lens.
//
// Looks by seed (or ctx.vary.hour): hour morning | golden (sun low on the right) | dawn (rose light, mist in the
// corridor and over the potholes); weather drifting cloud shadow | broken cumulus, big shadows | after a cloudburst (rain curtain
// over the savanna, higher white water); season september | july | november (hero palette and water level).
// Cast: two pairs of scarlet macaws or a loose dozen blue-and-yellows, five to nine otters, club colours.
// Rare (ctx.vary.rare): the sulphur migration, a river of yellow butterflies streaming upriver over the red.
// Scripted: the sunbittern on its rock 6.5 m right of the flight line at the brief's beat (u 0.26) opens its shield as the eye
// comes within 27 m (full at 15 m), holds it and turns it after us while we pass, gaze 0.15-0.31 until the release rule lets it go |
// three butterfly clubs on wet sandbars under or beside the line lift as the eye comes within 30 m (all up at 11 m) and rise across
// the line, the second through the lens; a wing fades over its last half metre before the lens |
// tributary fall on the right, gaze 0.20-0.335 | reveal over the ledge 0.40-0.46 |
// macaws come up on our right, 9 to 11 m off, and cross our line 14 m ahead over the route's point at z 40 (MAC) | THE OTTERS SWIM THE RIVER, NOT THE FRAME: the hero is handed the route once
// (hero.setFlight) and the file swims by one law of the metres we have flown (parts: makeFileLaw), the same in every camera: rear
// otter 16 m ahead at 0.55, we gain 0.35 m a metre, the rear four race us abreast 5 m to the right until two seconds past 0.64 and
// fall behind; each dives into the pots of the lane by its own stream (the one look at them: otterGaze 0.52-0.705) |
// the periscope pair in their well 5 m left, up from 24 m short of it until we are 4 m past, heads after our place on the route
// (look 0.672-0.722) | the brink 0.765, the gaze on the lead otters riding the right-hand chute 6 m off (chuteGaze) from 0.735 to
// the brink; below the brink the look across the falls is laid over it (the last look of the list, at its whole weight from 5 m
// below the brink; the chute look's span runs on to 0.868 under it and tells only where the engine gives a look less than its whole weight) |
// down the flank the look is fallLook's, by z, as the lips lay it above; from z -174 it is straight down the river and from -190
// the route's own | from there the ring whole ahead between its buttresses, and beside its foot,
// on a low black island in the pool on the right, one otter lying and one sitting up, bib to the fall. Every look AT A SUBJECT is
// let go by one rule: it fades once its subject stands more than 80 degrees off the way ahead and is gone by 115 (held()). The
// look across the falls is not a look at a subject and is not under that rule: it is laid by the eye's z alone and stands up to
// 105 degrees off the way down the river. camera.nearThrough 0.3 draws the
// river right up to the lens when this world is seen through the previous portal. Low sun (golden, dawn) lays long
// palm shadows and turns the channel and the far side of every well into a mirror of the sky (the lip stays dark rock, the
// near side blue-violet); dawn stands one thin wisp of mist on each well's downwind rim. Also on u: the log bridge 0.00-0.11.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/five-colour-river.js';

const PALETTE = ['#C4122F', '#F04E7C', '#EBC65A', '#4C8C3B', '#17161A', '#1668B0', '#8FCBEF'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const LIN = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const VLIN = (hex, k = 1) => new THREE.Vector3(...LIN(hex, k));
const SOLID_UV = [0.875, 0.75];                      // opaque cell of the kit leaf atlas

// ---- GLSL shared by every material of this file (S = hero.shared) -------------------------------------------
const VERT_STD = /* glsl */`
varying vec3 vW; varying vec3 vN;
#ifdef FCR_GROUND
attribute float aWl; attribute vec4 aM; varying float vWl; varying vec4 vM;
#endif
#ifdef FCR_WATER
attribute float aDepth; varying float vDepth;
#endif
#ifdef USE_COLOR
varying vec3 vC;
#endif
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
  #ifdef FCR_GROUND
  vWl = aWl; vM = aM;
  #endif
  #ifdef FCR_WATER
  vDepth = aDepth;
  #endif
  #ifdef USE_COLOR
  vC = color;
  #endif
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const fragHead = (S) => /* glsl */`
varying vec3 vW; varying vec3 vN;
uniform vec3 uSunDir, uSun, uSky, cWeed, cTip, cSand, cGreen, cRock, cDeep, cHaze, cZen;
uniform vec4 uCorr;                                   // corridor: half gap, rim height, z of the mouth, strength
${S.noiseGLSL}${S.cloudShadowGLSL}${S.waterGLSL}${S.paveGLSL}${S.sandGLSL}
// analytic sun shadow of the corridor walls (the slot runs along z, walls at x = +-uCorr.x, rim at y = uCorr.y)
float corrSh(vec3 w){
  float sx = uSunDir.x, sg = sx >= 0. ? 1. : -1.;
  float t = max(uCorr.x - sg*w.x, 0.)/max(abs(sx), .05);
  float top = w.y + uSunDir.y*t - uCorr.y, zh = w.z + uSunDir.z*t;
  float slot = smoothstep(uCorr.z - 5., uCorr.z + 2., zh)*step(abs(w.x), uCorr.x + 3.5)*uCorr.w;
  // the rim is hung with trees: shafts come down through the gaps and light patches of the shaded water, and leaves shade the lit side
  vec2 cq = w.xz + uSunDir.xz*((uCorr.y - w.y)/max(uSunDir.y, .15));
  float gap = smoothstep(.52, .7, vn(cq*.3 + 3.)*.65 + vn(cq*.85 + 9.)*.35), lit = mix(smoothstep(-.9, .9, top), 1., gap*.85);
  lit *= 1. - .3*smoothstep(.5, .32, vn(cq*.55 + 17.));
  return 1. - slot*(1. - lit);
}
float inCorr(vec3 w){ return smoothstep(uCorr.z - 7., uCorr.z + 3., w.z)*smoothstep(uCorr.x + 4.5, uCorr.x + 1.5, abs(w.x)); }
#include <fog_pars_fragment>
`;

// ground: the riverbed above the ledge (sand, rock, shade weed under clear water) and all the land round the river
const FRAG_GROUND = /* glsl */`
varying float vWl; varying vec4 vM;
uniform vec3 uGrassA, uGrassB; uniform float uMirror;
void main(){
  vec3 N = normalize(vN);
  float dist = distance(cameraPosition, vW), lod = smoothstep(300., 50., dist);
  float depth = vWl - vW.y;
  depth += (fb(vW.xz*.7 + 3.) - .5)*.16*smoothstep(.3, .04, abs(depth));               // the waterline wanders, never follows the mesh
  float uw = smoothstep(0., .05, depth), dc = clamp(depth, 0., 1.5);
  vec2 rp = vW.xz + fcrRip(vW.xz)*(.015 + .07*dc)*uw;
  float sand = vM.x, grass = vM.y*(1. - uw), green = vM.z;
  float steep = 1. - smoothstep(.5, .85, N.y);
  // (the masks are baked a metre apart: near the eye their soft edges are cut to a torn line, so sand, rock and weed meet as things,
  // and under water the bed is lit as the level floor it is, not facet by facet of the mesh)
  float tear = (vn(rp*3.7 + 11.) - .5)*.44 + (vn(rp*9.3) - .5)*.22, crispK = smoothstep(46., 14., dist)*uw;
  sand = mix(sand, smoothstep(.36, .64, sand + tear), crispK);
  N = normalize(mix(N, vec3(0., 1., 0.), uw*.85*(1. - steep)));
  float rn = mix(.5, fb(rp*1.7), lod), big = fb(rp*.21 + 20.);
  vec2 jp = vec2(rp.x*.37 + rp.y*.11 + 1.1*vn(rp*.17), rp.y*.23 - rp.x*.07 + 1.1*vn(rp*.17 + 9.));
  float crack = smoothstep(.02, 0., min(abs(fract(jp.x) - .5), abs(fract(jp.y) - .5)))*.8*lod;
  float dry = smoothstep(.03, .4, -depth);
  vec3 rock = cRock*(.55 + 1.5*rn)*(1. - crack*.75);
  vec3 aux; vec4 pv = fcrPave(rp, lod, aux);                                           // black quartzite pavement, as on the hero's banks
  pv.rgb *= mix(.5, 1., smoothstep(.02, .5, -depth));
  rock = mix(rock, pv.rgb, dry);
  rock *= 1. + steep*(.9*vn(vec2(rp.x*.25, vW.y*5.)) - .3);
  float moss = smoothstep(.05, 0., abs(depth + .01) - .03*rn)*smoothstep(.4, .75, rn + green*.25);
  moss = max(moss, green*(1. - uw)*smoothstep(.3, .62, rn + .2*big));
  moss = max(moss, dry*aux.z*smoothstep(.2, .45, vn(rp*.31 + 5.) + .2*big)*(1. - steep));
  rock = mix(rock, cGreen*vec3(.6,.85,.42)*(.25 + .6*rn), moss*.85);
  float bare = dry*(1. - steep)*(1. - sand)*(1. - min(grass*2., 1.));
  N = normalize(N + vec3(aux.x, 0., aux.y)*bare);
  // shade weed: the same plant as the red carpet, green where rock or forest keeps the sun off it
  vec2 wp = vec2(rp.x + .07*sin(rp.y*1.9 + uTime*2.4 + 5.*vn(rp*.35)), rp.y);
  float st = vn(vec2(wp.x*6.5 + 2.2*vn(wp*vec2(2.3,.8) + 3.), wp.y*2. + uTime*.3))*.65 + vn(vec2(wp.x*15. + 5., wp.y*4.6 + uTime*.4))*.35;
  float tuft = vn(wp*vec2(1.5,.6) + 13.);
  float dens = green*uw*smoothstep(.2, .55, tuft*.6 + st*.3 + green*.3)*(1. - sand);
  float ros = 1. - .5*smoothstep(.56, .76, vn(vec2(wp.x*1.9 + 1.3*vn(wp*.6), wp.y*1.05 + 4.)))*smoothstep(90., 24., dist);   // plant by plant: the bed shows dark at each holdfast
  vec3 wc = mix(cGreen*.3, cGreen*1.15, st)*(.75 + .5*big);
  float red = smoothstep(.06, .4, vM.w);                                                 // rock out in the sun (baked per vertex: the real fronds stand on the same mask)
  red = mix(red, smoothstep(.34, .62, vM.w*1.5 + tear), crispK);
  vec3 wr = mix(cWeed*.42, cWeed*.9, smoothstep(.15, .8, st)); wr = mix(wr, cTip, smoothstep(.7, .98, st*.55 + tuft*.55)*.35);
  wc = mix(wc, wr*(.62 + .4*big), red);
  dens = max(dens, red*(1. - sand)*uw*smoothstep(.1, .45, tuft*.6 + st*.4))*ros;                                                 // out in the sun the same weed turns crimson: the first flecks of the carpet
  wc *= .8 + .4*vn(vec2(wp.x*30., wp.y*10. + uTime*.5))*lod;
  // under the eye the weed is plants, not paint (the hero's fcrTuft): green in the slot's shade, emerald to yellow-green at the tips,
  // crimson to rose out in the sun, on a dark mat with the rock showing in the gaps
  float lodT = smoothstep(23., 9., dist)*(1. - steep)*(1. - smoothstep(.5, .8, depth))*mix(.62, 1., smoothstep(.06, .4, vM.w)); vec3 tf = fcrTuft(rp);   // (shallow water only: in a deep lane a tuft was a mark, not a plant)
  vec3 tg = mix(cGreen*vec3(.32, .42, .3), cGreen*vec3(1.1, 1.3, .7), smoothstep(0., .7, tf.y))*(.8 + .4*tf.z);
  vec3 tr = mix(cWeed*.3, cWeed*1.12, smoothstep(0., .6, tf.y))*(.78 + .46*tf.z); tr = mix(tr, cTip*(.85 + .3*tf.z), smoothstep(.5, 1., tf.y)*.62);
  wc = mix(wc, mix(wc*.45, mix(tg, tr, red), tf.x), lodT);
  dens *= 1. - lodT*.45*(1. - tf.x)*smoothstep(.52, .7, vn(rp*2.7 + 5.));
  vec3 alb = mix(rock, wc, dens);
  // THE BARS are wet sand, their crowns a finger out of the river and the rest under a film of clear water: there the ripple ridges
  // run whole and curving, a lit and a shaded side to each (barK), the caustic net plays over them, and the swash leaves its leaves
  float barK = smoothstep(.34, .1, depth)*(1. - steep);
  vec3 sc = fcrSandR(rp, dist, cSand*(.9 + .2*big), uSunDir.xz, barK);                  // ripple marks, grain, cobbles, fallen leaves
  float hA = -depth, dryS = 1. - uw;
  float wetM = dryS*smoothstep(.11 + .06*(rn - .5), .01, hA);
  sc = mix(sc, sc*vec3(.66,.56,.37), wetM);                                            // the dark wet margin
  sc = mix(sc, mix(sc, vec3(dot(sc, vec3(.4,.5,.1))), .3)*vec3(1.1,1.06,.95), dryS*smoothstep(.07, .2, hA));   // the dry crown, a little bleached
  float dl = max(smoothstep(.03, 0., abs(hA - .05 - .03*vn(vW.xz*.8))), .7*smoothstep(.025, 0., abs(hA - .14 - .04*vn(vW.xz*.6 + 5.))));
  sc = mix(sc, vec3(.07,.045,.02), dl*dryS*smoothstep(.3, .6, vn(vW.xz*4.))*.75*lod);  // drift lines of leaf litter at two old water levels
  // ... and the swash line itself, leaf by leaf: small fallen leaves, brown and ochre, lying where the film ends and a hand either side
  vec2 lq = vW.xz*5.5 + 2.*vec2(vn(vW.xz*.9), vn(vW.xz*.9 + 4.)), li = floor(lq), lf = fract(lq) - .5; float lh = h21(li + 3.3), lt = h21(li*1.7 + 9.), la = lh*6.283;
  vec2 lr = vec2(lf.x*cos(la) + lf.y*sin(la), lf.y*cos(la) - lf.x*sin(la));
  float leafB = smoothstep(.0, .05, .3*(1. - lr.x*lr.x/.17) - abs(lr.y))*step(.4, lh);
  float swash = smoothstep(.07, .0, abs(hA - .012 - .03*(vn(vW.xz*.7 + 2.) - .5)))*smoothstep(.25, .6, vn(vW.xz*.45 + 13.));
  sc = mix(sc, mix(vec3(.11, .06, .025), vec3(.42, .3, .07), lt*lt)*(.75 + .5*smoothstep(.0, .12, abs(lr.y))), leafB*swash*smoothstep(30., 8., dist)*.9);
  sc *= mix(vec3(1.), vec3(1.,.86,.56), uw*smoothstep(118., 136., vW.z));
  alb = mix(alb, sc, sand*(1. - steep));
  // (round 27) GRAVEL: on the shoulders of the channels, where the current slackens and drops its stones (the real cobbles lie thickest
  // there), the sand between them is dark wet gravel, grain by grain under the eye, a darker band from further off
  float pbK = sand*uw*smoothstep(.2, .3, depth)*smoothstep(.62, .44, depth)*smoothstep(.38, .6, vn(vW.xz*.23 + 31.))*(1. - steep);
  float speck = smoothstep(.36, .7, vn(rp*19. + 3.)*.6 + vn(rp*43.)*.4);
  alb = mix(alb, mix(alb*.74, mix(alb*.5, alb*.86 + .04, speck), smoothstep(22., 7., dist)), pbK*.8);
  float gn = fb(vW.xz*.31), gs = mix(.5, vn(vW.xz*vec2(2.5, 7.)), lod);
  vec3 gc = mix(uGrassA, uGrassB, smoothstep(.3, .7, fb(vW.xz*.021 + 7.)))*(.62 + .6*gn)*(.8 + .4*gs);
  alb = mix(alb, gc, smoothstep(.2, .55, grass*1.3 + (gn - .5)*.6)*(1. - steep));
  float cl = fcrCloud(vW.xz), nl = max(dot(N, uSunDir), 0.), sh = corrSh(vW), ic = inCorr(vW);
  float caus = min(fcrCaus(rp) + 1.5*fcrNet(rp)*smoothstep(30., 7., dist), 1.5 - .35*sand)*uw*exp(-dc*.5);   // (held on the sand: in full glare the ripple marks and the net still read, yellow, never a white sheet)
  vec3 col = alb*(uSun*cl*sh*nl*(.78 + caus*(1. + .15*sand)) + uSky*(.55 + .45*N.y)*(1. + .8*ic) + uSun*vec3(.4,.5,.24)*.4*ic);
  vec3 V = normalize(cameraPosition - vW);
  float wetS = max(wetM*sand, (1. - uw)*(1. - dry)*(1. - sand)*.8), gz = 1. - max(dot(V, N), 0.); gz *= gz;
  col += uSun*cl*sh*wetS*.3*pow(max(dot(reflect(-V, N), uSunDir), 0.), 40.);          // wet sand and wet rock shine
  col += uSky*gz*gz*(.05*bare + .25*wetS)*(1. - uw) + mix(cHaze, cZen, .3)*gz*(.04 + .2*gz)*wetM*sand*(1. - uw)*(.6 + .4*cl);   // (wet sand holds the sky at a glancing angle)
  col += cHaze*uMirror*bare*(.07 + .3*gz)*(1. - uw)*(1. - .6*crack);                          // a low sun: the black pavement takes the gold of the sky at a glancing angle
  // (round 27) CLEAR WATER OVER SAND HAS ITS OWN COLOUR BY THE HAND: a film over a bar is yellow, knee-deep in a channel the yellow has
  // gone to green-turquoise (the red of the sand is taken out on the way down and back, and the water's own light comes up); the
  // caustic net and the ripple marks are seen through it. Out in the sun only: the slot keeps its moss green.
  float tq = (1. - exp(-max(depth - .2, 0.)*2.4))*uw*sand*(1. - ic)*(1. - steep);
  col = mix(col*mix(vec3(1.), vec3(.46,.98,.84), tq), vec3(.04,.47,.45)*(uSun*cl*sh*(.75 + .5*caus) + uSky), tq*.5);
  float ab = (1. - exp(-max(depth - .35, 0.)*.8))*uw;                                      // clear water: the bed keeps its colours to a metre down
  vec3 deep = mix(cDeep, cGreen*vec3(.5,.84,.62), clamp(green*.85, 0., 1.));              // (the slot's deeper lanes go to a clear moss green, never a dark pool)
  col = mix(col, deep*(uSun*cl*sh*.8 + uSky*(.8 + .9*ic)), ab*.7);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// rock: corridor walls, boulders, the Gatepost, the buttresses (vertex colour = albedo tint)
const FRAG_ROCK = /* glsl */`
varying vec3 vC; uniform float uWetY, uMoss, uWarm, uBounce, uSheen;
void main(){
  vec3 N = normalize(vN), p = vW;
  float dist = distance(cameraPosition, p), lod = smoothstep(260., 40., dist);
  float n1 = mix(.5, fb(p.xz*.9 + p.y*vec2(1.7, 1.3)), lod), n2 = fb(vec2(p.x + p.z, p.y*2.)*.55 + 11.), big = fb(p.xz*.13 + p.y*.21);
  float fine = mix(.5, vn(vec2(p.x + p.z*.7, p.y)*7.), lod*smoothstep(60., 10., dist));
  N = normalize(N + (vec3(vn(p.yz*3.1 + 2.), vn(p.xz*3.3 + 5.), vn(p.xy*2.9 + 9.)) - .5)*.6*lod*smoothstep(70., 12., dist));   // close to, the face breaks into planes
  float side = 1. - N.y*N.y;
  float bedv = p.y*.9 + 2.2*vn(p.xz*.06) + .7*vn(vec2((p.x + p.z)*.45, p.y*.35));
  float seam = smoothstep(.09, 0., abs(fract(bedv) - .5))*side*smoothstep(.3, .6, vn(vec2((p.x - p.z)*.21, p.y*.5)));
  float jx = (p.x*.62 + p.z*.78)*.23 + 1.3*vn(vec2(p.y*.22, p.x*.08 + p.z*.06));
  float joint = smoothstep(.03, 0., abs(fract(jx) - .5))*side*smoothstep(.35, .7, vn(vec2(p.y*.3 + 5., (p.x + p.z)*.1)));
  vec3 alb = vC*(.5 + 1.0*n1)*(.75 + .5*big)*(.8 + .4*fine)*(.86 + .28*mix(.5, vn(vec2(p.x + p.z*.6, p.y*1.2)*21.), lod*smoothstep(26., 6., dist)));
  alb *= 1. - .5*max(seam, joint*.8)*lod;
  alb = mix(alb, alb*vec3(1.5,1.25,1.05) + .01, smoothstep(.62, .8, n2)*.5);          // pale lichen plates
  float up = smoothstep(.2, .75, N.y);
  float stain = smoothstep(.4, .72, vn(vec2(p.y*.3 + 2.4*vn(p.xz*.045), (p.x + p.z)*.03 + 7.)))*(1. - .6*up);
  alb = mix(alb, alb*vec3(2.5,1.55,.95) + vec3(.014,.007,.002), uWarm*stain);     // iron-stained beds
  float moss = clamp(up*1.05 + uMoss*(.3 + 1.1*n2) - .5 + .35*big, 0., 1.)*smoothstep(.25, .6, n2*.7 + up*.5 + uMoss*.3);
  // the walls stand in beds: under every ledge a hand of shadowed bare rock, and on its lip the moss catches the light
  float lq = bedv*1.45 + .12*vn(vec2((p.x + p.z)*1.3, p.y*.4)), lb = fract(lq);
  float lK = lod*smoothstep(110., 16., dist)*side*smoothstep(.28, .5, vn(vec2((p.x + p.z)*.3, floor(lq)*7.3 + 2.)));
  float lsh = smoothstep(.36, .03, lb)*lK, lip = smoothstep(.78, .97, lb)*lK;
  moss *= 1. - .85*lsh; alb *= 1. - .6*lsh;
  // close to, nothing is a smooth wash: the rock is cut by a net of fine cracks, the moss is cushions with dark between and bright leaf tips
  float nearK = lod*smoothstep(34., 7., dist); vec2 q = vec2(p.x + p.z*.8, p.y + p.x*.3);
  float cush = vn(q*11.)*.55 + vn(q*27. + 3.)*.45, crk = smoothstep(.07, .0, abs(vn(q*2.6 + 1.7*vn(q*.9)) - .5))*smoothstep(.3, .6, vn(q*.7 + 9.));
  alb *= 1. - .55*crk*nearK;
  alb *= 1. + nearK*(.5*(vn(q*33.) - .5));
  moss = clamp(moss + nearK*(cush - .5)*.9*step(.02, moss), 0., 1.);
  vec3 mossC = mix(cGreen*vec3(.5,.8,.3), cGreen*vec3(1.3,1.02,.5), n1*n1)*(.45 + .65*fine)*(.7 + .5*big);
  mossC *= mix(1., .42 + 1.25*cush*cush + .5*smoothstep(.7, .8, vn(q*47.)), nearK)*(1. + .8*lip);
  alb = mix(alb, mossC, moss);
  float streak = smoothstep(.72, .9, vn(vec2((p.x + p.z)*3.1, p.y*.09 + 3.)))*side;
  alb *= 1. - .4*streak*max(uMoss, 0.);
  float wet = smoothstep(.8, 0., p.y - uWetY);
  alb *= 1. - .5*wet;
  float cl = fcrCloud(p.xz), nl = max(dot(N, uSunDir), 0.), sh = corrSh(p), ic = inCorr(p);
  vec3 col = alb*(uSun*cl*sh*nl + uSky*(.6 + .4*N.y)*(1. + 1.1*ic) + uSun*vec3(.4,.5,.24)*.55*ic + uSun*cl*uBounce*vec3(.2,.15,.1)*(1. - .7*N.y)*(.25 + .75*sh));
  vec3 V = normalize(cameraPosition - p);
  col += uSun*cl*sh*(wet*.3 + streak*max(uMoss, 0.)*.12)*pow(max(dot(reflect(-V, N), uSunDir), 0.), 24.);
  float gzr = 1. - max(dot(V, N), 0.);                                                    // boulders in the river: splashed and glossy, the sky on their flanks
  col += uSheen*(1. - .75*moss)*(uSun*cl*sh*.2*pow(max(dot(reflect(-V, N), uSunDir), 0.), 8.) + mix(cHaze, cZen, .35)*(.22 + .5*cl*uSun.g)*gzr*gzr*(.35 + .65*gzr)*(.4 + .6*sh));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// far tablelands: vertex colour, bedding, haze
const FRAG_MESA = /* glsl */`
varying vec3 vC;
void main(){
  vec3 N = normalize(vN);
  float band = vn(vec2(vW.y*.045, (vW.x + vW.z)*.0012))*.5 + vn(vec2((vW.x - vW.z)*.006, vW.y*.012))*.5;
  vec3 alb = vC*(.7 + .6*band);
  vec3 col = alb*(uSun*max(dot(N, uSunDir), 0.)*fcrCloud(vW.xz*.25) + uSky*(.6 + .4*N.y));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// the water surface above the ledge: the hero's sheet (same streamlines, glint road, foam) fed with a depth
// attribute instead of the hero's mask, plus the corridor's shade and reflections and the white water round every standing rock
const FRAG_WATER = /* glsl */`
varying float vDepth;
uniform float uReflCap, uGlint, uWhite; uniform vec3 uRocks[19]; uniform vec4 uFallFoot;
void main(){
  float depth = vDepth; depth += (fb(vW.xz*.7 + 3.) - .5)*.16*smoothstep(.3, .04, abs(depth));
  float cl = fcrCloud(vW.xz), sh = corrSh(vW), ic = inCorr(vW);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  vec2 p = vW.xz; float flow = uTime*2.2;
  float riffle = smoothstep(.12, .04, depth)*smoothstep(0., .03, depth);
  // every rock standing in the river (x, z, radius): a pillow of white piled on its upstream face, a V of standing wave trailing
  // from its shoulders, and a boiling lee between the arms
  float wake = 0., lee = 0.;
  for (int i = 0; i < 19; i++) {
    vec2 gd = p - uRocks[i].xy; float r0 = uRocks[i].z, rz = max(r0, .05), dn = -gd.y, gr = length(gd), on = step(.01, r0), dp = max(dn, 0.);
    float arm = abs(abs(gd.x) - (rz*.82 + .4*dp)), gk = i == 0 ? 2.3 : 1.;                 // (slot 0 is the Gatepost: its white V stands broad enough to be read from up the slot)
    float wk = smoothstep((.35 + .07*dp)*gk, .04, arm)*smoothstep(-rz*.5, rz*.4, dn)*smoothstep(rz*9.*gk, rz*2., dn);
    wk *= mix(.36, 1., smoothstep(rz*5., rz*1.5, dn));                                        // (white at the rock; down the arms it thins to broken lace, the sand and its ripple marks seen through it)
    wk = max(wk, smoothstep(.75, .1, abs(gr - rz - .25))*smoothstep(rz*.5, -rz*.6, dn));
    wake = max(wake, wk*on);
    lee = max(lee, on*smoothstep(rz*.8 + .2*dp, 0., abs(gd.x))*smoothstep(rz*.7, rz*1.3, dn)*smoothstep(rz*4.5, rz*1.5, dn));
  }
  vec2 g = fcrRip(p)*.045 + .1*vec2(vn(vec2(p.x*2.6, p.y*1.7 + uTime*1.6)) - .5, vn(vec2(p.x*1.3 + 9., p.y*1.1 + uTime*2.1)) - .5);
  g += .14*vec2(vn(p*5. + vec2(0., flow*2.)) - .5, vn(p*5.3 + vec2(7., flow*2.3)) - .5)*(riffle*.3 + uWhite + ic*.35 + wake + lee);
  g *= (1. + .8*smoothstep(.4, 1., depth)*(1. - .75*ic))/(1. + dist*.01);
  vec3 N = normalize(vec3(-g.x, 1., -g.y));
  float nv = max(dot(N, V), 0.), f1 = 1. - nv, fres = min(.02 + .98*f1*f1*f1*f1*f1, uReflCap*.8 + .3*ic)*(.45 + .55*max(smoothstep(.03, .3, depth + .25*ic), .7*smoothstep(9., 30., dist)*smoothstep(0., .04, depth)));   // (a film of water over sand is looked through, ripple marks and all: the sky lies on the deeper water; round 27: and on a film from 9 m off, whole by 30 m: this reads the distance to the eye, as the grazing look does)
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 sky = mix(cHaze, cZen, smoothstep(0., .4, R.y));
  float open = smoothstep(2.6, .7, abs(R.x)/max(R.y, .03));                              // in the slot the walls are mirrored, not the sky
  vec3 wallc = cGreen*vec3(.55,.66,.36)*(uSky*1.5 + uSun*.35*sh);
  wallc *= .5 + 1.1*vn(vec2(p.y*.22 + R.x*2., R.y*7. + p.x*.3));                         // the mirrored wall keeps its beds and its ferns: light and dark bands, broken by every ripple
  open = max(open*.45, smoothstep(.55, .12, abs(R.x)));                                    // down the axis the slot mirrors its own bright mouth
  sky = mix(sky, mix(wallc, sky, open), ic);
  float sd = max(dot(R, uSunDir), 0.), road = pow(sd, 36.);
  float spk = smoothstep(.8, .96, vn(p*24. + uTime*vec2(1.3, 3.1)))*smoothstep(.4, .85, vn(p*6. - uTime*vec2(.5, 1.7)));
  float glint = (road*spk*1.6 + pow(sd, 700.)*.6)*uGlint*cl*sh;
  float deepA = (1. - exp(-max(depth - .4, 0.)*.7))*.5;                                    // glass: only the deep holes take the water's own colour
  // foam: thin soft lines drawn out along the streamlines and racing down with the current (wandering, braiding, broken along their
  // length), sparkle on the riffles, lace at the shore, the rocks' white water
  vec2 fp = vec2(p.x, p.y + flow*1.5);
  float raft = smoothstep(.5, .8, vn(fp*vec2(.5, .1) + 3.));
  float flw = .028 + dist*.006;
  float fleck = smoothstep(flw, 0., abs(vn(vec2(fp.x*3.1 + 1.3*vn(fp*vec2(.8, .2) + 7.), fp.y*.5)) - .5))*smoothstep(.34, .64, vn(fp*vec2(2.1, 1.4) + 5.));
  float foam = raft*(fleck*smoothstep(30., 7., dist)*(1. - .65*smoothstep(9., 2., dist)) + .08*smoothstep(10., 26., dist)*smoothstep(110., 50., dist))*.36;
  foam += riffle*smoothstep(.72, .93, vn(vec2(p.x*6., (p.y + flow*1.4)*3.2)))*.24;
  // down the slot the current draws long foam lines that race under the eye: drawn along the streamlines, braided, broken into rafts
  float l2 = abs(vn(vec2(fp.x*1.6 + 1.2*vn(fp*vec2(.45, .12) + 11.), fp.y*.16)) - .5);
  float band = smoothstep(.15 + dist*.006, 0., l2 + .09*(vn(fp*vec2(5., 1.6)) - .5));
  foam += ic*band*band*smoothstep(.4, .64, vn(fp*vec2(.7, .3) + 2.))*smoothstep(.25, .6, vn(vec2(fp.x*1.7, fp.y*.55) + 23.))*smoothstep(70., 24., dist)*(.4 + .6*smoothstep(2., 6.5, dist))*.24;
  foam += smoothstep(.035, .0, depth)*smoothstep(.3, .7, vn(p*3. + uTime*.4))*.22;
  float wn = vn(p*vec2(3.2, 2.6) + vec2(0., flow*2.))*.6 + vn(p*vec2(8., 7.) + vec2(3., flow*3.))*.4;
  foam += wake*smoothstep(.15, .6, wn)*.95 + lee*smoothstep(.58, .86, wn)*.34;
  float fd = length(p - uFallFoot.xy), fr = uFallFoot.z;                                  // the tributary's plunge: boil, then rings running out
  foam += (smoothstep(fr, fr*.2, fd)*(.3 + .7*vn(p*2.2 + vec2(uTime*.9, -uTime*1.3)))
    + smoothstep(.22, 0., abs(fract(fd*.4 - uTime*.45) - .5))*smoothstep(fr*3., fr, fd)*.35*smoothstep(.3, .7, vn(p*1.3 + 3.)))*uFallFoot.w;
  glint += spk*sh*cl*.07*ic*uGlint;
  foam = clamp(foam, 0., 1.);
  float shore = smoothstep(0., .03, depth), shore0 = smoothstep(.03, .1, depth);
  vec3 lit = uSun*cl*sh + uSky + mix(cHaze, cZen, .25)*.5*ic*(1. - sh*cl);               // in the shaded slot foam is lit by the strip of sky
  float lane = .8 + .4*vn(vec2(p.x*1.5 + 1.5*vn(p*.6), (p.y + flow)*.8));
  vec3 deep = mix(cDeep, cGreen*vec3(.42,.6,.4), ic*.85);
  vec3 col = sky*fres + deep*lit*.6*lane*deepA*(1. - fres);
  float a = 1. - (1. - fres)*(1. - deepA);
  // the surface itself: a slow net of bright lines where the ripples tip the sky toward the eye, sliding downstream over the bed
  float sl = fcrNet(p*.4 + 5.)*(.13 + .2*ic)*smoothstep(.1, .3, depth)*smoothstep(2.5, 8., dist)*smoothstep(44., 16., dist);   // (under the eye the bed is seen clean through glass)
  col += mix(cHaze, cZen, .3)*(.45 + .55*cl*sh)*sl; a = min(a + sl*.6, 1.);
  // and wavelets tipping the sky (in the slot, the walls) toward the eye in travelling slivers: the bed is seen THROUGH water
  vec2 rq = vec2(p.x*.8 + .6*vn(p*.35 + 2.), (p.y + flow*.55)*2.4);
  float rw = vn(rq)*.6 + vn(rq*2.3 + 7.)*.4;
  float ripS = mix(smoothstep(.6, .78, rw), .2, smoothstep(13., 38., dist))*f1*f1*smoothstep(1.6, 5., dist)*smoothstep(.02, .12, depth);
  col += sky*ripS*.45*(1. - fres); a = min(a + ripS*.42, 1.);
  col = mix(col, vec3(.86, .9, .93)*min(lit, vec3(1.5))*.82, foam); a = mix(a, 1., foam*.92);
  // fallen leaves ride the slot's water: one in every third square metre, yellow, ochre and rust, turning slowly as they drift
  vec2 lq = vec2(p.x, p.y + flow*1.5)*.9, lc = floor(lq), lf = fract(lq) - .5; float lr = h21(lc + 31.);
  float la = lr*40. + uTime*(.2 + .3*fract(lr*7.)); vec2 lo = lf - (vec2(fract(lr*13.), fract(lr*29.)) - .5)*.6;
  lo = vec2(lo.x*cos(la) - lo.y*sin(la), lo.x*sin(la) + lo.y*cos(la));
  float leaf = smoothstep(1., .7, length(lo*vec2(9., 17.)))*step(lr, .34)*ic*smoothstep(26., 12., dist)*shore0;
  col = mix(col, mix(vec3(.62,.46,.08), vec3(.42,.16,.04), fract(lr*53.))*(.4 + .6*(1. - 3.*abs(lo.y)))*lit*.55, leaf); a = mix(a, 1., leaf);
  col += uSun*glint*4.5; a = min(a + glint, 1.);
  col *= shore; a *= shore;
  #ifdef USE_FOG
  float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  col = mix(col, fogColor*a, ff);
  #endif
  gl_FragColor = vec4(col, a);
}`;

// plants lit like everything else here (wall ferns, hanging roots, moriche palms): kit leaf atlas for the cut-outs
const VERT_PLANT = /* glsl */`
attribute vec4 wind; attribute vec4 aRib;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying float vLeaf;
uniform float uTime;
#include <fog_pars_vertex>
void main(){
  vec4 w = vec4(position, 1.); vec3 n = normal, rb = aRib.xyz;
  #ifdef USE_INSTANCING
  w = instanceMatrix*w; n = mat3(instanceMatrix)*n; rb = mat3(instanceMatrix)*rb;
  #endif
  w = modelMatrix*w; n = normalize(mat3(modelMatrix)*n + vec3(0., 1e-4, 0.));
  float gust = sin(uTime*1.3 + w.x*.11 + w.z*.07) + .5*sin(uTime*2.9 + w.z*.23 + w.x*.31);
  w.xz += vec2(.85, .35)*wind.x*(.45 + .55*gust);
  w.xyz += n*wind.y*.07*sin(uTime*5.3 + w.x*3.1 + w.y*4.3 + w.z*2.7);
  float rl = dot(rb, rb);
  if (rl > 1e-8) w.xyz += rb*(max(aRib.w, distance(cameraPosition, w.xyz)*.0017)/sqrt(rl));
  vW = w.xyz; vN = n; vUv = uv; vLeaf = min(wind.z, 1.);
  vC = color;
  #ifdef USE_INSTANCING_COLOR
  vC *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_PLANT = /* glsl */`
varying vec3 vC; varying vec2 vUv; varying float vLeaf; uniform sampler2D map;
void main(){
  vec4 tx = texture2D(map, vUv); if (tx.a < .4) discard;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float nl = dot(N, uSunDir), wrap = clamp(nl*.6 + .4, 0., 1.), back = clamp(-nl, 0., 1.)*vLeaf;
  float cl = fcrCloud(vW.xz), sh = corrSh(vW), ic = inCorr(vW);
  vec3 alb = vC*(.36 + .6*tx.r);
  vec3 col = alb*(uSun*cl*sh*(wrap + back*.8*vec3(.85, 1.1, .35)) + uSky*(.7 + .3*N.y)*(1. + 1.1*ic) + uSun*vec3(.4,.5,.24)*.5*ic);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// forest crowns: each tree is a dome of small leaf masses. The vertex stage carries two normals: the mass's own (its outline is
// torn by a leaf-scale cut where it turns edge-on to the eye) and the dome's (the light: sunlit tops, blue-green undersides).
const VERT_CROWN = /* glsl */`
attribute vec4 wind; attribute vec3 aDome;
varying vec3 vW; varying vec3 vN; varying vec3 vD; varying vec3 vC; varying vec3 vO; varying float vLeaf;
uniform float uTime;
#include <fog_pars_vertex>
void main(){
  vec4 w = vec4(position, 1.); vec3 n = normal, dn = aDome;
  #ifdef USE_INSTANCING
  w = instanceMatrix*w; n = mat3(instanceMatrix)*n; dn = mat3(instanceMatrix)*dn;
  #endif
  w = modelMatrix*w; vO = w.xyz;
  float gust = sin(uTime*1.3 + w.x*.11 + w.z*.07) + .5*sin(uTime*2.9 + w.z*.23 + w.x*.31);
  w.xz += vec2(.85, .35)*wind.x*(.45 + .55*gust);
  w.y += wind.y*.1*sin(uTime*2.3 + w.x*.9 + w.z*.7);
  vW = w.xyz; vN = normalize(n + vec3(0., 1e-4, 0.)); vD = normalize(dn + vec3(0., 1e-4, 0.)); vLeaf = wind.z;
  vC = color;
  #ifdef USE_INSTANCING_COLOR
  vC *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_CROWN = /* glsl */`
varying vec3 vC; varying vec3 vD; varying vec3 vO; varying float vLeaf;
uniform vec3 uCFill; uniform vec4 uCK;                 // sky fill on leaf; sun gain, back-light gain, rim gain, depth of the outline's cut
void main(){
  vec3 p = vO, Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  vec3 Ng = normalize(vN), Nd = normalize(vD), col;
  float cl = fcrCloud(vW.xz), lod = smoothstep(420., 60., dist), near = smoothstep(170., 45., dist);
  if (vLeaf < .5) {                                                                        // bole and limbs
    col = vC*(.7 + .6*vn(vec2(p.x + p.z, p.y*.4)*3.))*(uSun*cl*max(dot(Ng, uSunDir), 0.)*.8 + uCFill*.7);
  } else {
    vec2 q1 = p.xz*.55 + p.y*vec2(.37, .29), q2 = vec2(p.x - p.z, p.y*1.3)*.5 + 7.;
    float c1 = vn(q1)*.6 + vn(q2)*.4, fine = vn(q1*3.1 + 3.)*.5 + vn(q2*3.7)*.5, leaf = vn(q1*8.3 + 5.)*.5 + vn(q2*9.7 + 2.)*.5;
    float nv = abs(dot(Ng, V));
    float rag = mix(fine, fine*.45 + leaf*.55, near);
    float cut = (.07 + uCK.w*smoothstep(.34, .66, rag*.75 + c1*.25))*smoothstep(600., 260., dist);
    if (nv < cut) discard;                                                                 // a notched, ragged outline: sprays of leaf, never a ball
    float inside = gl_FrontFacing ? 0. : 1.;
    vec3 N = normalize(mix(Nd, Ng*(1. - 2.*inside), .5));
    N = normalize(N + (vec3(vn(q1*2.3 + 1.7), vn(q2*2.3 + 4.1), vn(q1.yx*2.3 + 9.3)) - .5)*.9*lod);
    float clump = mix(.5, smoothstep(.3, .7, c1), lod), dap = mix(.5, leaf, near), fn = mix(.5, fine, lod);
    vec3 alb = vC*(.5 + .95*clump)*(.68 + .64*fn)*(.7 + .6*dap);
    alb = mix(alb, alb*vec3(1.55, 1.3, .5), smoothstep(.56, .8, fn*.55 + dap*.45)*.45*lod);  // sunlit leaf tips
    float edge = 1. - nv, nl = dot(N, uSunDir), up = N.y*.5 + .5;
    float lit = smoothstep(-.2, .85, nl)*(1. - .85*inside)*(.5 + .5*smoothstep(.25, .6, clump + (fn - .5)*.6));   // each spray shades the one under it
    vec3 fill = uCFill*mix(vec3(.5, .68, .86), vec3(1.), smoothstep(.2, .8, up))*(.46 + .54*clump)*(1. - .38*inside);
    col = alb*(uSun*cl*lit*uCK.x + fill);
    float thru = max(dot(-V, uSunDir), 0.);                                                // against the sun the outer leaves glow, and every mass keeps a lit rim
    col += alb*uSun*cl*vec3(1.1, 1.3, .4)*(thru*thru*(.35 + .9*smoothstep(.5, .8, fn))*uCK.y + edge*edge*(.25 + .75*thru)*smoothstep(-.5, .3, nl)*uCK.z);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// sulphur butterflies: hinged flappers, each a fore-wing and a hind-wing either side of a dark body. clubs 0..2 puddle on a sandbar,
// wings blinking, and lift when uLift says so: the cloud rises off the bar and drifts ACROSS the flight line (uDrift = metres from the
// bar to the line), a few metres on down the river, so that we fly through it; mode 3 is the migration, a stream flowing up the river
// (+Z) over the slab along the flight line; mode 4 the loose ones that tumble about the line all down the sand reach. A wing is never
// shrunk: one that comes within a metre of the lens fades out over its last half metre (vA), so the cloud is whole wings at every
// distance from half a metre out and none is ever a card across the picture.
const VERT_FLAP = /* glsl */`
attribute vec4 iA, iB; attribute vec3 iC;
uniform float uTime; uniform vec4 uLift; uniform vec4 uStream; uniform vec4 uMig; uniform vec3 uDrift, uEye; uniform vec4 uMid;      // stream: z lo, z hi, speed, water y
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vQ; varying float vA;
#include <fog_pars_vertex>
void main(){
  vN = vec3(0., 1., 0.);
  float ph = iA.w, club = iB.x, sz = iB.y, sd = iB.z, r2 = iB.w;
  float lift = club < .5 ? uLift.x : club < 1.5 ? uLift.y : club < 2.5 ? uLift.z : 1.;
  float mid = step(.5, club)*step(club, 1.5);                                             // the second club's bar lies under the flight line itself: its cloud opens through the lens
  float l = clamp(lift*1.7 - r2*.7, 0., 1.); l = l*l*(3. - 2.*l)*step(r2, .8);                // a fifth of each club stays down, wings blinking
  float t = uTime*(.55 + .4*r2) + ph*6.283;
  vec3 home = iA.xyz, c; float yaw, scl = sz;
  if (club < 2.5) {
    float dr = club < .5 ? uDrift.x : club < 1.5 ? uDrift.y : uDrift.z, eh = club < .5 ? uEye.x : club < 1.5 ? uEye.y : uEye.z;   // (uEye: the flown line's height over each bar: the clouds stand about it)
    vec3 fly = home + vec3(dr*(.5 + r2) + sin(t*1.3 + ph*9.)*(1. + 2.2*r2) + sin(t*2.9)*.45, .25 + (1.3 + eh)*sd*(1. - .25*mid) + .45*sin(t*2.1 + ph*5.),
      -2.6 - 2.6*sd + cos(t*1.1 + ph*4.)*(1.4 + 2.6*sd) + cos(t*3.3)*.45);
    if (mid > .5) {
      // the second club's cloud stands as a column along the flight line itself (uMid: the line's point over the bar and its heading
      // there), from the bar's middle to ten metres past it, two and a half metres wide and a metre and a half deep about the height
      // we fly at: we go through its whole length
      float s = 1. + 8.5*sd + cos(t*1.1 + ph*4.)*(.6 + .9*r2), lat = (fract(ph*7.31) - .5)*2.4 + sin(t*1.3 + ph*9.)*(.25 + .6*r2);
      fly = vec3(uMid.x + uMid.z*s + uMid.w*lat, home.y + uEye.y - .85 + 1.3*fract(ph*13.7) + .25*sin(t*2.1 + ph*5.), uMid.y + uMid.w*s - uMid.z*lat);
    }
    c = mix(home, fly, l); yaw = ph*40. + l*(t*1.2 + sin(t*.7)*2.);
  } else if (club > 3.5) {
    c = home + vec3(sin(t*1.3 + ph*9.)*(1.3 + 2.4*r2) + sin(t*2.9)*.45, .7*sin(t*2.1 + ph*5.) + .25*sin(t*4.3 + ph*3.), cos(t*1.1 + ph*4.)*(1.5 + 3.*sd) + cos(t*3.3)*.45);
    yaw = ph*40. + t*1.2 + sin(t*.7)*2.; l = 1.;
  } else {
    float span = uStream.y - uStream.x, zz = mod(iA.z + uTime*uStream.z*(.8 + .4*r2), span);
    float zw = uStream.x + zz, tm = clamp((zw + 60.)/40., 0., 3.);              // the stream follows the flight line down the slab
    float mx = tm < 1. ? mix(uMig.x, uMig.y, tm) : tm < 2. ? mix(uMig.y, uMig.z, tm - 1.) : mix(uMig.z, uMig.w, tm - 2.);
    c = vec3(mx + iA.x + 1.1*sin(t*1.1 + ph*9.) + .4*sin(t*3.1), uStream.w + iA.y + .4*sin(t*1.7 + ph*5.), zw);
    yaw = .5*sin(t*1.3 + ph*7.); l = 1.;
    scl *= uLift.w*smoothstep(0., 12., zz)*smoothstep(span, span - 12., zz);
  }
  float flap = mix(1.22 + .28*sin(uTime*(1.2 + 1.5*r2) + ph*20.), .25 + 1.05*sin(uTime*(13. + 5.*sd) + ph*30.), l);
  vec3 q = vec3(position.x*cos(flap), abs(position.x)*sin(flap), position.z);
  q.y += .08;
  float cy = cos(yaw), sy = sin(yaw);
  vec3 wp = c + vec3(q.x*cy + q.z*sy, q.y, -q.x*sy + q.z*cy)*scl;
  vec3 cw = (modelMatrix*vec4(c, 1.)).xyz;
  vA = smoothstep(.5, 1.05, distance(cw, cameraPosition));
  vec4 w = modelMatrix*vec4(wp, 1.); vW = w.xyz; vC = iC; vQ = position;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_FLAP = /* glsl */`
varying vec3 vC; varying vec3 vQ; varying float vA;
void main(){
  float fa = clamp(vA, 0., 1.); if (fa < .02) discard;
  float ax = abs(vQ.x), body = step(.5, vQ.y);
  float margin = smoothstep(.74, .97, ax + .25*max(vQ.z - .3, 0.));                 // a dusky border to the fore-wing's tip
  float veins = .9 + .1*sin(ax*22. + vQ.z*9.), spot = smoothstep(.1, .05, length(vec2(ax - .5, vQ.z - .3)));
  vec3 alb = vC*(1. - .5*margin)*veins*(.8 + .2*smoothstep(.0, .35, ax));
  alb = mix(alb, vec3(.42, .2, .04), spot*.7);                                          // the sulphur's rust spot
  alb = mix(alb, vec3(.03, .026, .02), body);
  float cl = fcrCloud(vW.xz), sh = corrSh(vW);
  vec3 col = alb*(uSun*cl*sh*.85 + uSky*.9);
  gl_FragColor = vec4(col, fa);
  #include <fog_fragment>
}`;

// the sunbittern: body from vertex colour; wing and tail feathers swing from folded to the frontal display
const VERT_BIRD = /* glsl */`
attribute vec3 aOpen; attribute vec3 aPat;                            // open-pose position; (across fan, along feather, kind)
uniform float uOpen, uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vPat;
#include <fog_pars_vertex>
void main(){
  float o = uOpen*uOpen*(3. - 2.*uOpen);
  vec3 p = mix(position, aOpen, o*step(.5, aPat.z));
  p += step(.5, aPat.z)*vec3(0., .012, .02)*sin(uTime*7. + aPat.x*9.)*aPat.y*o;      // the fan quivers while it is held
  p.y += .006*sin(uTime*2.1)*step(aPat.z, .5);
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = color; vPat = aPat;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_BIRD = /* glsl */`
varying vec3 vC; varying vec3 vPat;
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vC;
  if (vPat.z > .5) {
    float a = vPat.x, r = vPat.y, bars = smoothstep(.35, .65, sin(r*46. + a*5.)*.5 + .5);
    vec3 grey = mix(vec3(.2,.17,.13), vec3(.5,.45,.36), bars);
    float da = (a - .5)*1.5, e = length(vec2(da, (r - .56)*2.3));
    vec3 eye = mix(vec3(.5,.13,.03), vec3(.03,.02,.02), smoothstep(.2, .3, e)*smoothstep(.46, .36, e));    // chestnut heart, black crescent
    eye = mix(eye, vec3(.85,.56,.1), smoothstep(.44, .52, e)*smoothstep(.72, .6, e));                      // gold ring
    alb = mix(grey, eye, smoothstep(.74, .64, e)*step(vPat.z, 1.5));
    alb = mix(alb, vec3(.04,.03,.03), smoothstep(.78, .84, r)*smoothstep(.93, .87, r)*.85);                // dark band near the tips
    alb = mix(alb, vec3(.5,.14,.04), smoothstep(.5, .6, r)*smoothstep(.8, .7, r)*step(1.5, vPat.z)*.8);    // chestnut tail band
  }
  float nl = dot(N, uSunDir), cl = fcrCloud(vW.xz);
  vec3 col = alb*(uSun*cl*(.35 + .65*clamp(nl*.7 + .3, 0., 1.)) + uSky*.9);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// a distant grey rain curtain trailing from a cloud (after-the-cloudburst look)
const FRAG_RAIN = /* glsl */`
varying vec2 vUv; uniform float uTime; uniform vec3 uCol;
float h1(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float vn1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float x = vUv.x + (1. - vUv.y)*.22;
  float st = vn1(vec2(x*26., vUv.y*1.5 + uTime*.12))*.6 + vn1(vec2(x*7., vUv.y*.6 + uTime*.05))*.4;
  float a = smoothstep(.25, .8, st)*smoothstep(0., .2, vUv.x)*smoothstep(1., .75, vUv.x)*smoothstep(1., .55, vUv.y)*smoothstep(-.05, .3, vUv.y);
  gl_FragColor = vec4(uCol*a*.6, a*.6);
}`;

// the tributary: a veil of white water draped down the ledges of the right-hand scarp (aF = across -1..1, down 0..1)
const VERT_FALL = /* glsl */`
attribute vec2 aF; varying vec3 vW; varying vec3 vN; varying vec2 vF;
#include <fog_pars_vertex>
void main(){
  vF = aF; vN = vec3(0., 1., 0.); vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_FALL = /* glsl */`
varying vec2 vF;
void main(){
  float ax = abs(vF.x), t = vF.y, fall = uTime*1.15;
  float wid = mix(.3, .95, smoothstep(0., .8, t));                                     // a tongue at the lip, fanning out over the ledges
  float n1 = vn(vec2(vF.x*7. + 1.3*vn(vec2(vF.x*2., t*3. - fall)), t*5. - fall*3.2));
  float n2 = vn(vec2(vF.x*19., t*11. - fall*5.));
  float n3 = mix(vn(vec2(vF.x*31. + 2.*n1, t*4.5 - fall*5.6)), .5, smoothstep(60., 130., distance(cameraPosition, vW)));   // threads a hand wide, drawn out down the fall
  float edge = smoothstep(wid, wid - .28 - .15*n1, ax + (n2 - .5)*.2);
  float cords = smoothstep(.3, .75, n1*.5 + n2*.2 + n3*.3 + .25*(1. - ax/max(wid, .05)));
  float a = edge*(.16 + .84*cords)*smoothstep(0., .05, t)*smoothstep(1.03, .94, t - (n1 - .5)*.06);
  if (a < .01) discard;
  float cl = fcrCloud(vW.xz)*corrSh(vW);
  vec3 V = normalize(cameraPosition - vW); float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd;
  vec3 col = vec3(.8, .86, .92)*(uSun*cl*(.42 + .3*cords + .5*fwd) + uSky*.95)*(.62 + .38*cords);
  gl_FragColor = vec4(col, a*.94);
  #include <fog_fragment>
}`;
// the shadow a scarp lays over its shelf and the river (uv.x 0 at the foot .. 1 at the shadow's edge, uv.y = how deep it is)
const VERT_SHADE = /* glsl */`
varying vec2 vUv; varying vec3 vW; varying float vD;
void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }`;
const fragShade = (S) => /* glsl */`
varying vec2 vUv; varying vec3 vW; varying float vD; uniform vec4 uShade;
${S.noiseGLSL}${S.cloudShadowGLSL}
void main(){
  float rag = vn(vW.xz*.55)*.6 + vn(vW.xz*1.7 + 4.)*.4;
  float a = smoothstep(1., .72, vUv.x + (rag - .5)*.3)*vUv.y;
  a *= (fcrCloud(vW.xz) - .38)/.62*smoothstep(420., 150., vD);                        // no second shadow under a cloud
  gl_FragColor = vec4(uShade.rgb, a*uShade.a);
}`;

// ---- geometry helpers ------------------------------------------------------------------------------------
// vertex normals of an indexed mesh, a few thousand triangles at a time (the same sums as three's computeVertexNormals, which in
// one go holds the page); tick = ctx.yield
async function triNormals(g, tick) {
  const pos = g.attributes.position.array, idx = g.index.array, nrm = new Float32Array(pos.length);
  for (let q = 0; q < idx.length; q += 3) {
    if (q % 9000 === 8997) await tick();
    const a3 = idx[q] * 3, b3 = idx[q + 1] * 3, c3 = idx[q + 2] * 3, bx = pos[b3], by = pos[b3 + 1], bz = pos[b3 + 2];
    const ux = pos[c3] - bx, uy = pos[c3 + 1] - by, uz = pos[c3 + 2] - bz, vx = pos[a3] - bx, vy = pos[a3 + 1] - by, vz = pos[a3 + 2] - bz;
    const X = uy * vz - uz * vy, Y = uz * vx - ux * vz, Z = ux * vy - uy * vx;
    nrm[a3] += X; nrm[a3 + 1] += Y; nrm[a3 + 2] += Z; nrm[b3] += X; nrm[b3 + 1] += Y; nrm[b3 + 2] += Z; nrm[c3] += X; nrm[c3 + 1] += Y; nrm[c3 + 2] += Z;
  }
  await tick();
  for (let o = 0; o < nrm.length; o += 3) { const l = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1; nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
}
class Acc {                                                            // position / normal / colour / uv / wind / rib accumulator
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.w = []; this.rb = []; this.i = []; }
  v(x, y, z, nx, ny, nz, c, sway = 0, flut = 0, leaf = 0, rib = null) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(c[0], c[1], c[2]); this.uv.push(SOLID_UV[0], SOLID_UV[1]); this.w.push(sway, flut, leaf, 0);
    if (rib) this.rb.push(rib[0], rib[1], rib[2], rib[3]); else this.rb.push(0, 0, 0, 1);
    return this.p.length / 3 - 1;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // tube through pts with radii; col(t, k) -> [r,g,b]; sway(t) metres
  tube(pts, rad, sides, col, sway = () => 0) {
    const n = pts.length, base = this.p.length / 3, up = V3(0, 1, 0), d = V3(), a = V3(), b = V3();
    for (let i = 0; i < n; i++) {
      d.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      a.crossVectors(d, Math.abs(d.y) > 0.95 ? V3(1, 0, 0) : up).normalize(); b.crossVectors(d, a);
      for (let k = 0; k < sides; k++) {
        const th = (k / sides) * Math.PI * 2, cx = Math.cos(th), sx = Math.sin(th), r = rad[i];
        const nx = a.x * cx + b.x * sx, ny = a.y * cx + b.y * sx, nz = a.z * cx + b.z * sx;
        this.v(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r, nx, ny, nz, col(i / (n - 1), k), sway(i / (n - 1)));
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const p0 = base + i * sides + k, p1 = base + i * sides + (k + 1) % sides;
      this.quad(p0, p1, p1 + sides, p0 + sides);
    }
  }
  build(extra = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (extra) { g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('wind', new THREE.Float32BufferAttribute(this.w, 4)); g.setAttribute('aRib', new THREE.Float32BufferAttribute(this.rb, 4)); }
    g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  }
}

// A moriche palm: ringed grey trunk, a round head of long-stalked fans cut into pointed blades, a skirt of dead fronds.
function moricheGeometry(rng, H = 14, CK = 1) {
  const A = new Acc(), mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const bark = LIN('#8a8272', 0.8), barkD = LIN('#4a4438', 0.8), leaf = LIN('#3f7a2c'), leafL = LIN('#8fb845'), leafD = LIN('#1d4420'), dry = LIN('#9a7a3a', 0.8);
  const az = rng() * 6.283, bend = rng.range(0.3, 1.2), pts = [], rad = [], NR = 11;
  for (let i = 0; i <= NR; i++) { const t = i / NR; pts.push(V3(Math.cos(az) * bend * t * t, H * t, Math.sin(az) * bend * t * t)); rad.push(H * 0.021 * (1 + 0.5 * Math.exp(-t * 8)) * (1 - 0.2 * t) * (i % 2 ? 1.06 : 0.96)); }
  A.tube(pts, rad, 7, (t, k) => mix3(barkD, bark, (Math.round(t * NR) % 2 ? 0.75 : 0.3) + 0.2 * rng()), (t) => 0.22 * t * t);
  const top = pts[NR], nf = 17, d = V3(), side = V3(), upv = V3(), c = V3(), bd = V3(), nn = V3();
  let a = rng() * 6.283;
  for (let k = 0; k < nf; k++) {
    const t = k / (nf - 1), el = lerp(1.2, -0.75, Math.pow(t, 0.85)) + rng.range(-0.1, 0.1), old = smoothstep(0.72, 1, t); a += 2.4 + rng.range(-0.25, 0.25);
    d.set(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const stalk = H * CK * rng.range(0.15, 0.2) * (1 - 0.35 * old), sway = 0.22 + 0.25 * (1 - old);
    side.set(-Math.sin(a), 0, Math.cos(a)); upv.crossVectors(side, d).normalize();
    c.copy(top).addScaledVector(d, stalk); c.y -= stalk * 0.12 * (1 + old);
    const sc = mix3(leafD, dry, old * 0.7), w = 0.05;
    const s0 = A.v(top.x - side.x * w, top.y - side.y * w, top.z - side.z * w, upv.x, upv.y, upv.z, sc, 0.22), s1 = A.v(top.x + side.x * w, top.y, top.z + side.z * w, upv.x, upv.y, upv.z, sc, 0.22);
    const s2 = A.v(c.x + side.x * w, c.y, c.z + side.z * w, upv.x, upv.y, upv.z, sc, sway), s3 = A.v(c.x - side.x * w, c.y, c.z - side.z * w, upv.x, upv.y, upv.z, sc, sway);
    A.quad(s0, s1, s2, s3);
    const nb = 15, R = H * CK * rng.range(0.1, 0.125) * (1 - 0.3 * old), droop = 0.25 + 0.5 * old + 0.2 * rng();
    for (let j = 0; j < nb; j++) {
      const th = ((j / (nb - 1)) - 0.5) * 5.1, ct = Math.cos(th), sn = Math.sin(th);
      bd.copy(d).multiplyScalar(ct).addScaledVector(side, sn).addScaledVector(upv, 0.18 * Math.cos(th * 2.0)).normalize();          // pleated round fan
      nn.crossVectors(bd, upv).normalize(); const bw = R * 0.085, len = R * (0.82 + 0.3 * rng());
      const c0 = mix3(leafD, dry, old), c1 = mix3(mix3(leaf, leafL, rng() * 0.7), dry, old * 0.85), fl = 0.5 + 0.5 * rng();
      const mx = c.x + bd.x * len * 0.55, my = c.y + bd.y * len * 0.55 - droop * len * 0.12, mz = c.z + bd.z * len * 0.55;
      const b0 = A.v(c.x, c.y, c.z, upv.x, upv.y, upv.z, c0, sway, 0, 1);
      const b1 = A.v(mx - nn.x * bw, my - nn.y * bw, mz - nn.z * bw, upv.x, upv.y, upv.z, c1, sway * 1.2, fl * 0.5, 1), b2 = A.v(mx + nn.x * bw, my + nn.y * bw, mz + nn.z * bw, upv.x, upv.y, upv.z, c1, sway * 1.2, fl * 0.5, 1);
      const b3 = A.v(c.x + bd.x * len, c.y + bd.y * len - droop * len * 0.42, c.z + bd.z * len, upv.x, upv.y, upv.z, mix3(c1, leafL, 0.3 * (1 - old)), sway * 1.5, fl, 1);
      A.tri(b0, b1, b2); A.tri(b1, b3, b2);
    }
  }
  for (let k = 0; k < 9; k++) {                                         // the skirt of dead fronds under the head
    const th = (k / 9) * 6.283 + rng(), len = H * rng.range(0.12, 0.2), w = H * 0.02, ox = Math.cos(th), oz = Math.sin(th), cc = mix3(dry, barkD, rng() * 0.6);
    const y0 = top.y - H * 0.02, x1 = top.x + ox * len * 0.35, z1 = top.z + oz * len * 0.35;
    const q0 = A.v(top.x - oz * w, y0, top.z + ox * w, ox, 0.2, oz, cc, 0.2), q1 = A.v(top.x + oz * w, y0, top.z - ox * w, ox, 0.2, oz, cc, 0.2);
    const q2 = A.v(x1 + oz * w * 1.6, y0 - len, z1 - ox * w * 1.6, ox, 0.2, oz, cc, 0.35, 0.6, 1), q3 = A.v(x1 - oz * w * 1.6, y0 - len, z1 + ox * w * 1.6, ox, 0.2, oz, cc, 0.35, 0.6, 1);
    A.quad(q0, q1, q2, q3);
  }
  return A.build(true);
}

// (round 19, rule 5; round 20) A MORICHE IN FEWER TRIANGLES, for the palms of the wet hollows only (the line of 480,000 triangles: a
// full moriche is 716, and thirty of them stand in view at once). It is built as moricheGeometry builds its palm, by the same
// rules and proportions: the same bend of the trunk, seventeen fans on stalks at the same angles, nine dead fronds. What is
// lighter is how each part is cut: the trunk is five-sided in five lengths (the full one: seven-sided in eleven); each fan is ONE
// leaf, whole out to 0.55 of a blade's length (where the full fan's fifteen blades close up side by side) and cut beyond that into
// five points spread evenly over the arc of the full fan's fifteen blades (at its first, middle and last blade and half-way
// between), drooped as they; a stalk and a dead frond are
// one tapering triangle each. 50 + 17 x 9 + 9 = 212 triangles. IT IS A MODEL OF ITS OWN: it takes from its stream only the
// draws it uses (a tone for each of its own trunk's thirty corners, a length, a colour and a flutter for each of a fan's nine
// rim points), none to keep step with the full palm's.
function moricheLight(rng, H = 14) {
  const A = new Acc(), mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const bark = LIN('#8a8272', 0.8), barkD = LIN('#4a4438', 0.8), leaf = LIN('#3f7a2c'), leafL = LIN('#8fb845'), leafD = LIN('#1d4420'), dry = LIN('#9a7a3a', 0.8);
  const az = rng() * 6.283, bend = rng.range(0.3, 1.2), pts = [], rad = [], NL = 5;
  for (let i = 0; i <= NL; i++) { const t = i / NL; pts.push(V3(Math.cos(az) * bend * t * t, H * t, Math.sin(az) * bend * t * t)); rad.push(H * 0.021 * (1 + 0.5 * Math.exp(-t * 8)) * (1 - 0.2 * t) * (i % 2 ? 1.06 : 0.96)); }
  A.tube(pts, rad, 5, (t, k) => mix3(barkD, bark, (Math.round(t * NL) % 2 ? 0.75 : 0.3) + 0.2 * rng()), (t) => 0.22 * t * t);
  const top = pts[NL], nf = 17, d = V3(), side = V3(), upv = V3(), c = V3(), bd = V3();
  let a = rng() * 6.283;
  for (let k = 0; k < nf; k++) {
    const t = k / (nf - 1), el = lerp(1.2, -0.75, Math.pow(t, 0.85)) + rng.range(-0.1, 0.1), old = smoothstep(0.72, 1, t); a += 2.4 + rng.range(-0.25, 0.25);
    d.set(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const stalk = H * rng.range(0.15, 0.2) * (1 - 0.35 * old), sway = 0.22 + 0.25 * (1 - old);
    side.set(-Math.sin(a), 0, Math.cos(a)); upv.crossVectors(side, d).normalize();
    c.copy(top).addScaledVector(d, stalk); c.y -= stalk * 0.12 * (1 + old);
    const sc = mix3(leafD, dry, old * 0.7), w = 0.05;
    A.tri(A.v(top.x - side.x * w, top.y - side.y * w, top.z - side.z * w, upv.x, upv.y, upv.z, sc, 0.22), A.v(top.x + side.x * w, top.y, top.z + side.z * w, upv.x, upv.y, upv.z, sc, 0.22), A.v(c.x, c.y, c.z, upv.x, upv.y, upv.z, sc, sway));
    const nb = 15, R = H * rng.range(0.1, 0.125) * (1 - 0.3 * old), droop = 0.25 + 0.5 * old + 0.2 * rng();
    const c0 = mix3(leafD, dry, old), b0 = A.v(c.x, c.y, c.z, upv.x, upv.y, upv.z, c0, sway, 0, 1), rim = [], NP = 5;
    for (let m = 0; m < 2 * NP - 1; m++) {                                 // point, cut, point ... round the fan (each rim point its own length, colour and flutter)
      const j = (m / (2 * NP - 2)) * (nb - 1), len = R * (0.82 + 0.3 * rng()), c1 = mix3(mix3(leaf, leafL, rng() * 0.7), dry, old * 0.85), fl = 0.5 + 0.5 * rng(), th = ((j / (nb - 1)) - 0.5) * 5.1, tip = m % 2 === 0;
      bd.copy(d).multiplyScalar(Math.cos(th)).addScaledVector(side, Math.sin(th)).addScaledVector(upv, 0.18 * Math.cos(th * 2.0)).normalize();
      if (tip) rim.push(A.v(c.x + bd.x * len, c.y + bd.y * len - droop * len * 0.42, c.z + bd.z * len, upv.x, upv.y, upv.z, mix3(c1, leafL, 0.3 * (1 - old)), sway * 1.5, fl, 1));
      else rim.push(A.v(c.x + bd.x * len * 0.55, c.y + bd.y * len * 0.55 - droop * len * 0.12, c.z + bd.z * len * 0.55, upv.x, upv.y, upv.z, c1, sway * 1.2, fl * 0.5, 1));
    }
    for (let m = 0; m < rim.length - 1; m++) A.tri(b0, rim[m], rim[m + 1]);
  }
  for (let k = 0; k < 9; k++) {                                         // the skirt of dead fronds under the head
    const th = (k / 9) * 6.283 + rng(), len = H * rng.range(0.12, 0.2), w = H * 0.02, ox = Math.cos(th), oz = Math.sin(th), cc = mix3(dry, barkD, rng() * 0.6);
    const y0 = top.y - H * 0.02, x1 = top.x + ox * len * 0.35, z1 = top.z + oz * len * 0.35;
    A.tri(A.v(top.x - oz * w, y0, top.z + ox * w, ox, 0.2, oz, cc, 0.2), A.v(top.x + oz * w, y0, top.z - ox * w, ox, 0.2, oz, cc, 0.2), A.v(x1, y0 - len, z1, ox, 0.2, oz, cc, 0.35, 0.6, 1));
  }
  return A.build(true);
}

// Vellozia: a knee-high shrub of the bare pavement. A dark fibrous stem, a rosette of stiff narrow leaves (the lowest dead and
// straw-coloured) and one white six-petalled flower held above each head.
function velloziaGeometry(rng, heads) {
  const A = new Acc(), stem = LIN('#2b2520'), lf0 = LIN('#3c5c40'), lf1 = LIN('#93b684'), old = LIN('#8a7a4a', 0.8), wh = LIN('#f4f2f6', 0.8), ye = LIN('#f0c020', 0.8);
  for (let h = 0; h < heads; h++) {
    const lean = heads > 1 ? (h ? 0.55 : -0.45) : rng.range(-0.15, 0.15), az = rng() * 6.283, H = rng.range(0.24, 0.42);
    const tx = Math.cos(az) * lean * H, tz = Math.sin(az) * lean * H;
    A.tube([V3(0, -0.06, 0), V3(tx * 0.45, H * 0.55, tz * 0.45), V3(tx, H, tz)], [0.05, 0.036, 0.042], 3, () => stem, (t) => 0.02 * t);
    const NL = 8;
    for (let k = 0; k < NL; k++) {
      const a = k * 2.4 + rng() * 0.5, t = k / (NL - 1), el = lerp(1.25, 0.12, t) + rng.range(-0.1, 0.1), len = rng.range(0.3, 0.46) * (0.75 + 0.35 * t), w = 0.022;
      const ce = Math.cos(el), dx = Math.cos(a) * ce, dy = Math.sin(el), dz = Math.sin(a) * ce, sx = -Math.sin(a), sz = Math.cos(a);
      const c0 = t > 0.8 ? old : lf0, c1 = t > 0.8 ? old : lf1, sw = 0.03 + 0.05 * (1 - t), nx = -Math.cos(a) * dy, nz = -Math.sin(a) * dy;
      const b0 = A.v(tx - sx * w, H, tz - sz * w, nx, ce, nz, c0, 0.02, 0, 1), b1 = A.v(tx + sx * w, H, tz + sz * w, nx, ce, nz, c0, 0.02, 0, 1);
      const mx = tx + dx * len * 0.55, my = H + dy * len * 0.55, mz = tz + dz * len * 0.55;
      const m0 = A.v(mx - sx * w * 0.8, my, mz - sz * w * 0.8, nx, ce, nz, c1, sw, 0.3, 1), m1 = A.v(mx + sx * w * 0.8, my, mz + sz * w * 0.8, nx, ce, nz, c1, sw, 0.3, 1);
      const tip = A.v(tx + dx * len, H + dy * len - 0.25 * len * (1 - dy), tz + dz * len, nx, ce, nz, c1, sw * 1.6, 0.6, 1);
      A.quad(b0, b1, m1, m0); A.tri(m0, m1, tip);
    }
    for (let f = 0; f < 2; f++) {
      const fy = H + rng.range(0.28, 0.46), fx = tx + rng.range(-0.14, 0.14), fz = tz + rng.range(-0.14, 0.14), R = rng.range(0.1, 0.135);
      const s0 = A.v(tx - 0.007, H, tz, 0, 0.3, 1, lf0, 0.02), s1 = A.v(tx + 0.007, H, tz, 0, 0.3, 1, lf0, 0.02), s2 = A.v(fx + 0.007, fy, fz, 0, 0.3, 1, lf1, 0.08), s3 = A.v(fx - 0.007, fy, fz, 0, 0.3, 1, lf1, 0.08);
      A.quad(s0, s1, s2, s3);
      const c = A.v(fx, fy, fz, 0, 1, 0, ye, 0.08, 0, 1), ring = [];
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; ring.push(A.v(fx + Math.cos(a) * R, fy + 0.04, fz + Math.sin(a) * R, 0, 1, 0, wh, 0.08, 0.4, 1)); }
      for (let k = 0; k < 6; k++) A.tri(c, ring[(k + 1) % 6], ring[k]);
    }
  }
  return A.build(true);
}

// The sunbittern, facing +Z, feet at the origin. position = folded pose, aOpen = the display (wings and tail fanned
// into one shield facing the viewer), aPat = (across the fan, along the feather, 0 body | 1 wing | 2 tail).
function sunbitternGeometry(S = 1.7) {
  const P = [], O = [], N = [], C = [], PT = [], I = [];
  const v = (p, o, n, c, pat) => { P.push(p[0] * S, p[1] * S, p[2] * S); O.push(o[0] * S, o[1] * S, o[2] * S); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); PT.push(pat[0], pat[1], pat[2]); return P.length / 3 - 1; };
  const brown = LIN('#6e5a40'), dark = LIN('#2a2018'), white = LIN('#e8e2d0'), orange = LIN('#d8862a'), black = LIN('#0c0b0a'), buff = LIN('#b89a68');
  // body, neck, head, bill: one lofted tube
  const sp = [[0, 0.19, -0.23, 0.012], [0, 0.2, -0.15, 0.058], [0, 0.215, -0.04, 0.088], [0, 0.235, 0.05, 0.08], [0, 0.275, 0.1, 0.052], [0, 0.335, 0.125, 0.03], [0, 0.39, 0.14, 0.025],
    [0, 0.425, 0.16, 0.036], [0, 0.43, 0.2, 0.03], [0, 0.425, 0.24, 0.013], [0, 0.42, 0.31, 0.003]], SD = 7, b0 = 0;
  sp.forEach((r, i) => { for (let k = 0; k < SD; k++) {
    const th = (k / SD) * 6.283, cx = Math.cos(th), sy = Math.sin(th), up = i < 5 ? 1 : 0.6;                 // rings in XY for the body, tilted for the neck
    const p = i < 5 ? [r[0] + cx * r[3], r[1] + sy * r[3] * 0.85, r[2]] : [r[0] + cx * r[3], r[1] + sy * r[3] * up, r[2] - sy * r[3] * 0.5];
    const col = i >= 9 ? (sy > 0 ? dark : orange) : i >= 7 ? (Math.abs(sy) < 0.45 ? white : black) : i >= 5 ? brown : (sy < -0.3 ? buff : (i % 2 ? brown : dark));
    v(p, p, [cx, sy, 0.2], col, [0, 0, 0]);
  } });
  for (let i = 0; i < sp.length - 1; i++) for (let k = 0; k < SD; k++) { const a = b0 + i * SD + k, b = b0 + i * SD + (k + 1) % SD; I.push(a, b, b + SD, a, b + SD, a + SD); }
  for (const sx of [-1, 1]) {                                            // legs
    const x = sx * 0.032, a = v([x - 0.008, 0.2, -0.02], [x - 0.008, 0.2, -0.02], [0, 0, 1], orange, [0, 0, 0]), b = v([x + 0.008, 0.2, -0.02], [x + 0.008, 0.2, -0.02], [0, 0, 1], orange, [0, 0, 0]);
    const c = v([x + 0.007, 0, 0], [x + 0.007, 0, 0], [0, 0, 1], orange, [0, 0, 0]), d = v([x - 0.007, 0, 0], [x - 0.007, 0, 0], [0, 0, 1], orange, [0, 0, 0]);
    const e = v([x, 0.004, 0.06], [x, 0.004, 0.06], [0, 1, 0], orange, [0, 0, 0]);
    I.push(a, b, c, a, c, d, d, c, e);
  }
  const feather = (rootC, tipC, wC, rootO, tipO, wO, a0, a1, kind) => {   // 3 segments root -> tip
    const base = P.length / 3;
    for (let s = 0; s <= 3; s++) {
      const t = s / 3, wk = 0.35 + 0.65 * Math.sin(Math.min(1, t * 1.25) * 1.57) * (s === 3 ? 0.7 : 1);
      for (const e of [-1, 1]) {
        v([lerp(rootC[0], tipC[0], t) + wC[0] * e * wk, lerp(rootC[1], tipC[1], t) + wC[1] * e * wk, lerp(rootC[2], tipC[2], t) + wC[2] * e * wk],
          [lerp(rootO[0], tipO[0], t) + wO[0] * e * wk, lerp(rootO[1], tipO[1], t) + wO[1] * e * wk, lerp(rootO[2], tipO[2], t) + wO[2] * e * wk + 0.04 * t * t],
          [0, 0.15, 1], brown, [e < 0 ? a0 : a1, t, kind]);
      }
    }
    for (let s = 0; s < 3; s++) { const q = base + s * 2; I.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  };
  const NFE = 11;
  for (const sx of [-1, 1]) for (let j = 0; j < NFE; j++) {
    const a = j / (NFE - 1), sh = [sx * 0.06, 0.25, 0.045], th = lerp(-0.55, 1.78, a), r = 0.4 + 0.1 * Math.sin(a * 3.14159);
    const dO = [sx * Math.cos(th), Math.sin(th), 0], wO = [-sx * Math.sin(th) * r * 0.125, Math.cos(th) * r * 0.125, 0];
    const tipC = [sh[0] + sx * (0.015 + 0.02 * a), sh[1] - 0.05 - 0.05 * a, sh[2] - 0.3 - 0.08 * (1 - a)];
    feather([sh[0] + sx * 0.012, sh[1] - 0.02 * a, sh[2] - 0.03], tipC, [0, 0.028, 0], [sh[0] + dO[0] * 0.03, sh[1] + dO[1] * 0.03, sh[2]], [sh[0] + dO[0] * r, sh[1] + dO[1] * r, sh[2]], wO,
      sx > 0 ? a - 0.05 : a + 0.05, sx > 0 ? a + 0.05 : a - 0.05, 1);
  }
  for (let j = 0; j < 7; j++) {                                          // tail
    const a = j / 6, th = lerp(0.75, 2.39, a), r = 0.3, rt = [0, 0.2, -0.2];
    feather(rt, [(a - 0.5) * 0.05, 0.17, -0.47], [0.022, 0, 0], [0, 0.24, -0.02], [Math.cos(th) * r, 0.24 + Math.sin(th) * r, -0.05], [Math.sin(th) * 0.045, -Math.cos(th) * 0.045, 0], a - 0.08, a + 0.08, 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aOpen', new THREE.Float32BufferAttribute(O, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPat', new THREE.Float32BufferAttribute(PT, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(V3(0, 0.3 * S, 0), 1.2 * S);
  return g;
}

// One butterfly, unit half-span, hinged on the body axis (z): each side a fore-wing and a hind-wing with a notch between them, and
// a slim dark body (position.y = 1 marks it; the shader folds by x and z only). plain = the lighter cut for the migration's thousands.
function flapperGeometry(plain = false) {
  const p = [], idx = [];
  for (const s of [-1, 1]) {
    const o = p.length / 3;
    if (plain) { p.push(0, 0, 0.36, s * 0.98, 0, 0.6, s * 0.74, 0, 0.04, 0, 0, 0.0, s * 0.62, 0, -0.12, s * 0.44, 0, -0.6); idx.push(o, o + 1, o + 2, o + 3, o + 4, o + 5); }
    else { p.push(0, 0, 0.38, 0, 0, 0.02, s * 0.98, 0, 0.6, s * 0.8, 0, 0.08, 0, 0, 0.06, 0, 0, -0.38, s * 0.66, 0, -0.1, s * 0.5, 0, -0.62);
      idx.push(o, o + 2, o + 3, o, o + 3, o + 1, o + 4, o + 6, o + 7, o + 4, o + 7, o + 5); }
  }
  const o = p.length / 3; p.push(0, 1, 0.5, 0.05, 1, 0.1, -0.05, 1, 0.1, 0, 1, -0.46); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  return { position: new THREE.Float32BufferAttribute(p, 3), index: idx };
}
function flapperMesh(mat, items, plain = false) {                        // items: flat [x,y,z,phase, club,size,r1,r2, r,g,b]
  const base = flapperGeometry(plain), g = new THREE.InstancedBufferGeometry(), n = items.length / 11;
  g.setAttribute('position', base.position); g.setIndex(base.index);
  const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(items), 11);
  g.setAttribute('iA', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('iB', new THREE.InterleavedBufferAttribute(ib, 4, 4)); g.setAttribute('iC', new THREE.InterleavedBufferAttribute(ib, 3, 8));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

// A sheet of bedded, jointed rock standing on a ground line: cols = [{ x, z, nx, nz, y0, y1 }] (n = outward, toward
// the viewer). Rows climb from y0 to y1 with ledges, lips, batter and clefts; a last row folds back onto the land.
async function wallSheet(cols, noise, seed, o = {}, tick = async () => {}) {
  const NV = o.rows ?? 13, nc = cols.length, pos = new Float32Array(nc * (NV + 1) * 3), col = new Float32Array(nc * (NV + 1) * 3);
  const beds = [0.2, 0.42, 0.66, 0.87], batter = o.batter ?? 1.0, bulge = o.bulge ?? 0.6, off0 = [], k0 = o.shade ?? 1;
  let s = 0;
  for (let i = 0; i < nc; i++) {
    if ((i & 31) === 31) await tick();
    const c = cols[i]; if (i) s += Math.hypot(c.x - cols[i - 1].x, c.z - cols[i - 1].z);
    const H = c.y1 - c.y0, cleft = smoothstep(0.55, 0.9, Math.abs(noise.n2(s * 0.085 + seed, 7.7))) * 0.9, fade = c.fade ?? 1;
    for (let j = 0; j <= NV; j++) {
      const t = Math.min(1, j / (NV - 1)), y = c.y0 + t * H, k = (i * (NV + 1) + j) * 3;
      let sb = 0, lip = 0, par = 0;
      for (let b = 0; b < 4; b++) { const hb = beds[b] + 0.04 * noise.n2(s * 0.02 + b * 5 + seed, b * 3.1); sb += 0.42 * smoothstep(hb - 0.025, hb + 0.025, t); const q = (t - hb + 0.07) / 0.07; if (q > 0 && q < 1) lip += 0.34 * q * q; if (t > hb) par++; }
      let off = (bulge - batter * t - sb + lip + 0.85 * noise.fbm2(s * 0.055 + seed, y * 0.11, 3) + 0.28 * noise.n2(s * 0.31, y * 0.43 + seed) - cleft * (0.5 + 0.5 * noise.n2(s * 0.02, y * 0.2))) * fade;
      if (o.round) { const q = clamp((t - 0.4) / 0.6, 0, 1); off -= o.round * q * q * (0.8 + 0.4 * noise.n2(s * 0.09 + seed, 4.4)); }      // a stack's shoulders round over into its crown
      if (o.loop) { if (i === 0) off0[j] = off; else if (i > nc - 6) off = lerp(off, off0[j], (i - (nc - 6)) / 5); }
      let yy = y;
      if (j === NV) { off -= o.cap ?? 3.6; yy = c.y1 + (o.capUp ?? 0.3); }
      pos[k] = c.x + c.nx * off; pos[k + 1] = yy; pos[k + 2] = c.z + c.nz * off;
      const sh = (par % 2 ? 1.25 : 0.85) * (0.8 + 0.4 * (noise.n2(s * 0.13 + seed, y * 0.3) * 0.5 + 0.5)) * (1 - 0.35 * cleft) * (o.foot ? lerp(o.foot, 1, smoothstep(0.08, 0.3, t)) : 1);
      col[k] = 0.088 * sh * k0; col[k + 1] = 0.082 * sh * k0; col[k + 2] = 0.08 * sh * k0;
    }
  }
  const idx = [], flip = (-(cols[1].z - cols[0].z) * cols[0].nx + (cols[1].x - cols[0].x) * cols[0].nz) < 0;   // wind so that faces look along n
  for (let i = 0; i < nc - 1; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; if (flip) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  await tick(); await triNormals(g, tick); g.computeBoundingSphere();
  return { geometry: g, at: (i, j, out) => { const k = (clamp(i, 0, nc - 1) * (NV + 1) + clamp(j, 0, NV)) * 3; return out.set(pos[k], pos[k + 1], pos[k + 2]); }, cols, rows: NV };
}

// a flat-topped tableland 3-5 km off: scarp, talus, forested top
function mesaInto(A, rng, cx, cz, R, H, base) {
  const NS = 22, rings = [[1.0, H, LIN('#3d5a34', 0.8)], [1.03, H * 0.96, LIN('#8f7a68', 0.7)], [1.1, H * 0.58, LIN('#74625a', 0.7)], [1.75, H * 0.2, LIN('#2c4a28', 0.8)], [2.6, base, LIN('#34542c', 0.8)]];
  const rr = []; for (let k = 0; k < NS; k++) rr.push(R * (0.72 + 0.5 * rng()) * (1 + 0.25 * Math.sin(k * 0.9 + rng() * 2)));
  const st = A.p.length / 3, el = rng.range(0.55, 1), ro = rng() * 3;
  const top = A.v(cx, H * 1.01, cz, 0, 1, 0, rings[0][2]);
  rings.forEach(([f, y, c], ri) => { for (let k = 0; k < NS; k++) {
    const th = (k / NS) * 6.283, ca = Math.cos(th), sa = Math.sin(th), x = ca * rr[k] * f, z = sa * rr[k] * f * el, cr = Math.cos(ro), sr = Math.sin(ro);
    A.v(cx + x * cr - z * sr, y + (ri === 0 ? H * 0.03 * Math.sin(k * 2.1) : 0), cz + x * sr + z * cr, ca, ri < 1 ? 1 : 0.3, sa, c);
  } });
  for (let k = 0; k < NS; k++) A.tri(top, st + 1 + (k + 1) % NS, st + 1 + k);
  for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < NS; k++) { const a = st + 1 + r * NS + k, b = st + 1 + r * NS + (k + 1) % NS; A.quad(a, b, b + NS, a + NS); }
}

export default {
  id: 'five-colour-river',
  name: 'River of Five Colours',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['water', 'air'],
  async build(ctx) {
    const R = ctx.rng, NZ = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---------- the look of this visit ----------
    const lk = R.fork('fcr-look'), l1 = lk(), l2 = lk(), l3 = lk(), l4 = lk();
    let hour = l2 < 0.36 ? 'morning' : l2 < 0.68 ? 'golden' : 'dawn';
    if (vary.hour === 'day') hour = 'morning'; else if (vary.hour === 'golden') hour = 'golden'; else if (vary.hour === 'dawn' || vary.hour === 'night') hour = 'dawn';
    let weather = l1 < 0.6 ? 'clouds' : l1 < 0.8 ? 'overcast' : 'cloudburst';
    if ((weather === 'overcast' && hour !== 'morning') || hour === 'dawn') weather = 'clouds';
    const season = l3 < 0.22 ? 'july' : l3 < 0.8 ? 'september' : 'november', rare = !!vary.rare, blueMacaws = l4 < 0.35;
    const LOOK = {
      morning: { sky: 'day', zen: '#2463B8', hor: '#8FCBEF', fog: '#9cc4e4', fogD: 0.00042, exposure: 1.0, tint: '#ffffff', shadow: '#02060e', mist: 0, cover: 0.34, grassA: '#b9a55e', grassB: '#5d8a3c' },
      golden: { sky: 'goldenHour', zen: '#2a5aa8', hor: '#f0c890', fog: '#d6b890', fogD: 0.0005, exposure: 1.06, tint: '#fff4e4', shadow: '#0a0612', mist: 0.25, cover: 0.4, grassA: '#c49a50', grassB: '#6a8438' },
      dawn: { sky: 'dawn', zen: '#4A5E9C', hor: '#f2b8a8', fog: '#d8b4b4', fogD: 0.0011, exposure: 1.12, tint: '#fff0f0', shadow: '#0a0816', mist: 1, cover: 0.3, grassA: '#a8906a', grassB: '#587a48' },
    }[hour];
    // 'overcast' is played as BROKEN CLOUD: a sky two-thirds full of lit cumulus over deep blue, the valley mostly in moving shadow
    // with patches of hard sun racing through it (a flat grey lid dulled the red)
    const broken = weather === 'overcast', overcast = false, burst = weather === 'cloudburst';

    // ---------- the hero: the Red Carpet, its otters, the cascade ----------
    const hero = await buildHero(ctx, { palette: PALETTE, hour, season, weather: broken ? 'clouds' : weather, otters: Math.round(clamp(7 * density, 5, 9)), adoptLight: false, periZ: [-57, -56], wellMist: LOOK.mist });
    await ctx.yield();
    const L = hero.layout, U = hero.uniforms, S = hero.shared, AN = hero.anchors;
    const sunV = V3(...AN.sunDir).normalize(), WY = hero.waterLevelAt(0, 110), wsY = AN.slabWaterY, POOL = AN.portalSeat.poolY;
    const Z_MOUTH = 236, GATE = { x: 1.3, z: 217, r: 3.3 }, HALF = 8.9;
    const scene = new THREE.Scene(); scene.add(hero.object);
    U.cSand.value.multiplyScalar(0.8);                                   // sand a stop down, so sun plus caustics stay yellow
    if (hour === 'dawn') { U.uSky.value.multiplyScalar(1.55); U.uSun.value.multiplyScalar(1.15); }
    else if (hour === 'golden') U.uSky.value.multiplyScalar(1.5);
    if (hour !== 'morning') U.uCloudAmt.value *= 0.55;                             // under a low sun a cloud's shadow is soft: it dims the red, it does not put it out
    if (hour !== 'morning') U.cHaze.value.lerp(VLIN(LOOK.hor), 0.7);                // the water mirrors this hour's horizon, not a noon one
    if (broken) { U.uCloudCov.value = 0.045; U.uCloudAmt.value = 0.72; }      // broken cloud: big shadows, but thin ones, and the sun wins                // the slot and the banks keep their colour under a low sun   // dawn banks and walls were sinking to black

    // ---------- the lie of the land ----------
    const lr = R.fork('land');
    // (the three wet sandbars are laid along the flight line once the path is known: `bars`, below)
    const barDraw = [{ x: lr.range(-0.8, 0.8), z: 210 + lr.range(-2, 2), rx: lr.range(3.2, 4.0), rz: lr.range(8, 11) }, { x: lr.range(-0.3, 0.3), z: 188 + lr.range(-1, 1), rx: lr.range(2.8, 3.4), rz: lr.range(8, 10) },
      { x: lr.range(-1.5, 1.5), z: 162 + lr.range(-3, 3), rx: lr.range(3.4, 4.4), rz: lr.range(8, 11) }], bars = [];
    const zFront = (x) => Z_MOUTH + Math.abs(x) * 0.1 + 5 * NZ.n2(x * 0.025, 3.3) * smoothstep(12, 40, Math.abs(x));
    const rimY = (x, z) => WY + 11.5 + 1.6 * NZ.n2(x * 0.03 + 9, z * 0.03) - 5.5 * smoothstep(50, 170, Math.abs(x));
    const hills = (x, z) => 9 * NZ.fbm2(x / 260, z / 260, 3) + 4;
    const info = { sand: 0, grass: 0, green: 0, red: 0, wl: -100, dE: 0, plat: 0, ph: 0, shoal: 0 };
    const bump2 = (t) => { t = 1 - t * t; return t > 0 ? t * t : 0; };
    // The tributary fall stands on a HEADLAND of the right-hand scarp that juts nine metres into the river just above the hero's
    // shelf: ahead-right of the flight from the sandbars on, 14 m of white water against dark rock, passed at u 0.34.
    // Its upstream flank (z 124-140) turns to face the camera as it comes down the sand reach, and the fall pours down that flank.
    const ZF = 128, BITE = 11.5, headland = (z) => smoothstep(116.5, 123, z) * (1 - smoothstep(124, 140, z));
    const riverEdge = (z, out) => { const s = smoothstep(205, 238, z); out[0] = lerp(L.edgeL(z), -10.8, s); out[1] = lerp(L.edgeR(z), 10.8, s) - BITE * headland(z) + 2.6 * bump2((z - ZF) / 7); out[2] = s;
      if (z < -236) { const m = 30 * Math.sin((-236 - z) * 0.03) * smoothstep(0, 30, -236 - z); out[0] += m; out[1] += m; }   // below the portal the river swings away between the trees
      return out; };
    const eo = [0, 0, 0];
    // THE SCARPS. The river has cut a shallow gorge into the tableland: beyond a shelf of bare pavement each bank rises in a bedded
    // rock scarp to the forested plateau. bankAt(z) -> BK.d = shelf width from the water's edge to the scarp's foot, BK.h = its height.
    const BK = { z: NaN, d: [0, 0], h: [0, 0] };
    const bankAt = (z) => {
      if (z === BK.z) return BK; BK.z = z;
      for (let k = 0; k < 2; k++) {
        const sg = k ? 1 : -1;
        let d = 11.5 + 5 * NZ.n2(z * 0.021 + sg * 17.3, 3.7) + 1.8 * NZ.n2(z * 0.07, sg * 9.1);
        let h = clamp(6.0 + 3.4 * NZ.n2(z * 0.012 + sg * 5.1, 9.3) + 1.4 * NZ.n2(z * 0.05 + 3, sg * 3.3), 2.8, 10);
        if (z > 116) d = Math.min(d, 12.5);
        if (k) { const f = Math.max(smoothstep(96, 112, z) * (1 - smoothstep(124, 138, z)), bump2((z - ZF) / 7)); d = lerp(d, 2.2, f); h = lerp(h, 21.5, bump2((z - ZF) / 30)); }   // the headland: the scarp comes down to the water and stands tall at the fall
        h = lerp(h, 10.4, smoothstep(206, 236, z)) * lerp(0.3, 1, smoothstep(-206, -150, z));
        BK.d[k] = d; BK.h[k] = h;
      }
      return BK;
    };
    riverEdge(ZF, eo); bankAt(ZF); const FALL = { x: eo[1] + BK.d[1], z: ZF };
    const lumps = [];                                                     // every rock standing in or beside the upper river: [x, z, radius] (filled as they are placed, below)
    const CHN = (() => { const r = ctx.core.makeRng('fcr-channels:' + ctx.seed); return [r.range(0, 6.283), r.range(0, 6.283), r.range(0, 6.283), r.range(0, 6.283)]; })();   // the phases of the sand reach's two channels
    // natural(x, z): height of the ground as it would be without the meshes that cover it; fills `info`
    const natural = (x, z) => {
      const ax = Math.abs(x); let h = hero.heightAt(x, z);
      info.sand = 0; info.grass = 0; info.green = 0; info.red = 0; info.wl = -100; info.shoal = 0;
      riverEdge(z, eo); const dE = Math.min(x - eo[0], eo[1] - x), s = eo[2]; info.dE = dE;
      let pt = 0, ph = 0;
      if (dE < -1) { const k = x < 0 ? 0 : 1; bankAt(z); const sb = k ? 4.5 * smoothstep(116, 124, z) * (1 - smoothstep(138, 147, z)) : 0;   // (the headland's oblique flank: the land stands back behind its wall)
        pt = smoothstep(BK.d[k] + 1.4 + sb, BK.d[k] + 4.2 + sb, -dE); ph = (BK.h[k] - 0.5) * pt; }
      info.plat = pt; info.ph = ph;
      if (z > 112) {
        if (dE > 0) {
          let bar = 0;
          for (const b of bars) { const q = ((x - b.x) / b.rx) ** 2 + ((z - b.z) / b.rz) ** 2 + 0.55 * NZ.n2(x * 0.33 + b.z, z * 0.21) + 0.3 * NZ.n2(x * 0.9 + 4, z * 0.6 + b.x); if (q < 2.1) bar = Math.max(bar, smoothstep(1.9, 0.25, q)); }
          // THE SLOT IS ALL GREEN: its floor is mossed rock in shoals (info.shoal) that rise to half a metre under the glass, the corridor
          // weed over them, lanes of deeper water between, deepening to 1.5 m up the slot; the first yellow sand lies in its mouth.
          const shoal = s > 0 ? smoothstep(-0.12, 0.25, NZ.fbm2(x * 0.13 + 11, z * 0.1 + 2, 2)) : 0, deepC = lerp(0.6, 1.45, smoothstep(Z_MOUTH + 2, Z_MOUTH + 34, z));
          const hS = lerp(h, WY - 0.1 + 0.165 * bar * bar + 0.02 * NZ.n2(x * 1.3, z * 0.8) * bar, Math.min(1, bar * 1.6)), sC = s > 0 ? 0.85 * smoothstep(248, 235, z) * smoothstep(0.6, 2.4, dE) : 0,
            hC = WY - 0.12 - (deepC * (1 - 0.64 * shoal) + 0.14 * NZ.n2(x * 0.11 + 3, z * 0.09) - 0.14 * sC) * smoothstep(0, 3.2, dE);
          info.shoal = shoal;
          h = lerp(hS, hC, s) - 0.5 * bump2(Math.hypot(x - FALL.x + 3, z - FALL.z) / 6);
          // (round 27) THE SAND REACH IS A RIVER OVER SAND, NOT A SHEET. Two CHANNELS wind down it from the slot's mouth to the shelf,
          // braiding (chn: 2 to 3 m to a side, 0.6 m deeper than the film on the flats, none through a bar, a rock's foot or the shore),
          // and RIBS of the bedrock lie slantwise across it (rib: long backs a hand under the glass, where the water riffles over them
          // and the weed holds; more of them toward the shelf). Both are the lie of the bed in the world's own x and z: the ground's
          // paint, the water's depth, the pebbles, the fish and the fronds all read them from here.
          let rib = 0;
          if (s < 1 && z < 242) {
            const cx = (eo[0] + eo[1]) * 0.5, cw = (eo[1] - eo[0]) * 0.5, wob = 0.8 * NZ.n2(x * 0.31 + 3, z * 0.27), hw = 2.5 + 0.9 * NZ.n2(z * 0.06, 4.4);
            const t1 = Math.abs(x - cx - cw * (0.46 * Math.sin(z * 0.058 + CHN[0]) + 0.16 * Math.sin(z * 0.141 + CHN[1]))) + wob,
              t2 = Math.abs(x - cx - cw * (0.5 * Math.sin(z * 0.043 + CHN[2]) - 0.14 * Math.sin(z * 0.117 + CHN[3]))) + wob;
            let chn = Math.max(smoothstep(hw, hw * 0.3, t1), 0.8 * smoothstep(hw * 0.85, hw * 0.25, t2)) * (1 - Math.min(1, bar * 1.6)) * smoothstep(0.6, 3.4, dE) * (1 - s) * smoothstep(114, 126, z);
            for (const l of lumps) { const q = Math.hypot(x - l[0], z - l[1]) - l[2]; if (q < 2.4) chn *= smoothstep(0.3, 2.4, q); }
            const ru = x * 0.82 + z * 0.57, rv = z * 0.82 - x * 0.57;
            rib = smoothstep(0.24, 0.38, NZ.fbm2(ru * 0.19 + 5.5, rv * 0.045 + 9, 2) + 0.1 * smoothstep(205, 150, z)) * (1 - bar) * (1 - s) * smoothstep(1.0, 3.5, dE) * smoothstep(116, 128, z);
            h = lerp(h - 0.62 * chn, Math.max(h, WY - 0.1 + 0.045 * NZ.n2(x * 0.7 + 2, z * 0.7)), rib);
          }
          // sand gives way to rock toward the ledge, and out in the sun the rock carries the first red weed (info.red: paint and real fronds)
          // (the reach above z 150 is sand with a rare rib of rock in it; from z 140 the first flecks of red, thickening to the carpet by the ledge)
          // (round 27: the last 6 m above the hero's shelf are all rock and weed, so that no window of sand is cut off straight at the seam)
          const rk = 0.06 * smoothstep(172, 146, z) + 0.52 * smoothstep(143, 118, z) - 0.45 * smoothstep(150, 176, z) + 0.7 * smoothstep(123, 117, z),
            rockP = Math.max(smoothstep(0.1 - rk, 0.4 - rk, NZ.fbm2(x * 0.07 + 5, z * 0.05, 2)) * (1 - bar), rib);
          // (round 27: the red begins on the ribs of the sand reach, in flecks, from 20 m below the slot's mouth)
          info.red = rockP * Math.max(smoothstep(142, 123, z), 0.62 * smoothstep(226, 198, z) * smoothstep(0.22, 0.5, NZ.n2(x * 0.23 + 3.1, z * 0.19 + 8.2))) * smoothstep(0.8, 3, dE) * (1 - s);
          info.sand = lerp(1 - 0.92 * rockP, sC, s); info.green = clamp(rockP * 0.7 + s * (1 - 0.85 * sC) + 0.5 * smoothstep(4, 0, dE) * (x < 0 ? 1 : 0.4), 0, 1); info.wl = WY;
        } else {
          h = Math.max(h, WY + 0.16 + 0.55 * smoothstep(0, 3, -dE) + 0.5 * smoothstep(3, 14, -dE));
          if (dE > -4) info.wl = WY;
          info.green = 0.4 * smoothstep(7, 0, -dE); info.grass = Math.max(0.9 * pt, 0.55 * smoothstep(4, 9, -dE) * smoothstep(-0.1, 0.35, NZ.n2(x * 0.07 + 7, z * 0.07)));
          h += ph;
        }
        const zf = zFront(x), pl = smoothstep(zf + 1.5, zf + 4.5, z);
        if (pl > 0 && ax > 12.4) { h = lerp(h, rimY(x, z), pl); info.grass = lerp(info.grass, 0.8, pl); info.sand = 0; info.green = lerp(info.green, 0.5, pl); if (pl > 0.3) info.wl = -100; }
      } else {
        info.grass = Math.max(0.9 * pt, smoothstep(28, 50, -dE + 8 * NZ.n2(x * 0.04, z * 0.04)));
        h += ph;
        if (z < -228 && dE > 0) { info.wl = POOL; info.green = 0.6; info.sand = 0.3; h -= 0.9 * smoothstep(0, 5, dE) * smoothstep(-228, -240, z); }
      }
      if (ax > 70) h += hills(x, z) * smoothstep(70, 260, ax);
      return h;
    };
    const cover = (x, z) => smoothstep(46, 66, Math.abs(x) + 9 * NZ.n2(x * 0.03, z * 0.03));     // where the land rises over the hero's rock skirt
    const inHero = (z) => z < 116 && z > -233;
    const groundAt = (x, z) => { const h = natural(x, z); return inHero(z) ? Math.max(h - info.ph, h + 2.1 * cover(x, z) - 1.3 * (1 - info.plat)) : h; };

    // ---------- the flight ----------
    const fly = AN.flyThrough, lipY = (z) => wsY - 1.7 * ((-90 - z) / 15), casY = (z) => 1.8 + lipY(z);
    const SWING = 11;
    // (round 27) THE EYE IS RAISED from the slot's mouth to the brink, by one law of height on each side of the ledge. Down the sand
    // reach it climbs steadily from the 1.1 m it leaves the slot at (up: 2.1 cm a metre of z, 2 m over the water at z 196, 3 m at 150)
    // and on up to the ledge as before; down the carpet it comes off the reveal onto a line 2.9 m over the water at z 4 that sinks a
    // hand in 23 m to the 2.5 m it has always had over the brink (low). No knot moves in x or z; the staircase is as it was. hi = false
    // gives the line as it was flown before (1.0 m over the sand, 1.2 m over the carpet): it is built once, only to measure the rise.
    const mk = (z0, hi = true) => {
      const up = (z, was) => WY + (hi ? 1.12 + 0.0213 * (Z_MOUTH + 4 - z) : was), low = (z, was) => wsY + (hi ? 2.5 + 0.4 * clamp((z + 89.5) / 93.5, 0, 1) : was);
      const pts = [[0, WY + 1.2, z0], [0, WY + 1.2, z0 - 36], [0, WY + 1.2, Z_MOUTH + 26], [-1.4, WY + 1.12, Z_MOUTH + 4], [-7.3, up(GATE.z, 1.0), GATE.z], [-8.6, up(196, 1.0), 196], [-4.2, up(172, 1.0), 172], [0.8, up(150, 1.25), 150],
        [fly[0][0] - 0.2, hi ? up(130) + 0.33 : WY + 3.0, 130]];
      // over the ledge, then one wide S across the carpet while we sink: out over the blue channel to the right, back across it,
      // and onto the otters' line 5 m left of it (the hero gets this much more of the flight, seen from above and banking)
      pts.push([fly[0][0], WY + 5.0, fly[0][2]], [fly[1][0], WY + 4.4, fly[1][2]], [fly[2][0], fly[2][1] + 1.1, fly[2][2]],
        [L.flyX(63) + SWING, 6.3, 63], [L.flyX(40) - SWING * 0.8, hi ? 4.0 : 3.4, 40], [L.flyX(18) - 1.2, hi ? low(4) + 0.24 : 1.9, 18]);
      for (let z = 4; z >= -37; z -= 13.5) pts.push([L.flyX(z), low(z, 1.2), z]);
      // THE BRINK, as the brief flies it: up to 2.5 m over the lip, then the nose drops 6.5 degrees and the camera holds 1.8 m above
      // the step edges, dead straight for the last 135 m, the red ribbons and white cords pouring under it.
      pts.push([L.flyX(-49), low(-49, 1.2), -49], [L.flyX(-62), low(-62, 1.3), -62], [L.flyX(-76), low(-76, 1.9), -76], [0, wsY + 2.5, -89.5], [0, casY(-106), -106], [0, casY(-126), -126],
        [0, casY(-148), -148], [0, casY(-171), -171], [0, casY(-195), -195], [0, casY(-225), -225]);
      return makePath(pts);
    };
    let Z0 = 338, path = null;
    const zPeri = AN.periscopeWell.position[2], zT = zPeri + 3.2, xT = L.chanX(zT) - 5.3;   // (the flight passes the periscoping pair under six metres off)
    for (let it = 0; it < 4; it++) { await ctx.yield(); path = mk(Z0); await ctx.yield(); const uT = path.nearestXZ(xT, zT).u; if (Math.abs(uT - 0.7) < 0.003) break; Z0 = clamp(Z0 + (0.7 - uT) * path.length / 0.3, 300, 385); path = null; }
    await ctx.yield();
    if (!path) path = mk(Z0);
    await ctx.yield();
    const ZTOP = Z0 + 46, DUR = 40;
    const uTab = []; { const p = V3(); for (let i = 0; i <= 400; i++) { if ((i & 127) === 127) await ctx.yield(); uTab.push(path.pointAt(i / 400, p).z); } }
    const uAtZ = (z) => { for (let i = 0; i <= 400; i++) if (uTab[i] <= z) return i / 400; return 1; };
    // riseAt(z): how many metres the middle line stands above the low line (mk(z, false)), at the world's z (0 in the slot and from the brink on)
    await ctx.yield();
    const yByZ = (p) => { const a = [], q = V3(); for (let i = 0; i <= 400; i++) { p.pointAt(i / 400, q); a.push(q.z, q.y); }
      return (z) => { let i = 0; while (i < 399 && a[2 * i + 2] > z) i++; const z0 = a[2 * i], z1 = a[2 * i + 2]; return lerp(a[2 * i + 1], a[2 * i + 3], clamp((z0 - z) / Math.max(z0 - z1, 1e-6), 0, 1)); }; };
    const lineY = yByZ(path); await ctx.yield(); const wasY = yByZ(mk(Z0, false)), riseAt = (z) => lineY(z) - wasY(z);
    // THE ROUTE. `path` is the middle line: every bar, rock, plant and beat of the river is laid by it, metre for metre. The eye flies
    // `route`: that line, its length and its place in z for every metre flown, carried UP once and ASIDE once by two laws.
    const FLK = { cy: 3.2, lift: 16, late: 8, off: 6, wall: 3.4, band: 4, out: 50, back: [-138, -190], down: [-170, -195], keel: [-141, -146], from: 268.5, up: 0.37, top: 8.6, zC: 40, turn: 105, full: [-116, -146], ahead: -174, own: [-112, -176, -190], tip: 0.09, air: 3.3 };
    const sm5 = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
    const route = await (async () => {
      const Lp = path.length, q = V3(), sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
      const dAtZ = (z) => { let a = 0, b = Lp; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (path.posAtDist(m, q).z > z) a = m; else b = m; } return (a + b) / 2; };
      const dC = dAtZ(FLK.zC), dA = FLK.from, dT = dA + FLK.up * (dC - dA), yTop = wsY + FLK.top, room = clamp((dC - dA) / 30, 0, 1);
      await ctx.yield();
      const zB = AN.brink.z, TR = AN.steps.tread, nK = AN.steps.count, KX = []; let least = 1e9;
      for (let i = 1; i <= nK; i++) {
        const zk = zB - TR * i; let xw = 0, foot = 1e9;
        for (let x = 1; x < 36; x += 0.25) { const z = L.zOf(x, zk + 0.8); if (hero.waterLevelAt(x, z) - hero.heightAt(x, z) > 0.08) xw = x; }
        for (let z = zk - 9; z <= zk + 9; z += 1.5) { riverEdge(z, eo); bankAt(z); foot = Math.min(foot, eo[1] + BK.d[1]); }
        KX.push(Math.min(xw + FLK.off, foot - FLK.wall)); least = Math.min(least, KX[i - 1]);
        await ctx.yield();
      }
      for (let i = 0; i < nK; i++) KX[i] = Math.min(KX[i], least + FLK.band, i ? KX[i - 1] : 99);
      // (the lips' offsets are joined by a curve that passes each lip's own with the slope of its two neighbours and comes to its first
      // and its last lip with slope nought: above the first and below the last it is held, and the line's direction has no step there)
      const MX = KX.map((v, i) => (i === 0 || i === nK - 1 ? 0 : (KX[i + 1] - KX[i - 1]) / 2));
      const xAt = (z) => { const f = clamp((zB - TR - z) / TR, 0, nK - 1), i = Math.min(nK - 2, Math.floor(f)), t = f - i, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * KX[i] + (t3 - 2 * t2 + t) * MX[i] + (3 * t2 - 2 * t3) * KX[i + 1] + (t3 - t2) * MX[i + 1]; };
      // (THE WAY BACK: from z FLK.back[0], 3 m below the lip at z -135, the offset is given back in one S of 52 m of z and is nought
      // from FLK.back[1]; the height over the middle line is kept whole down to FLK.down[0] and given back between FLK.down's
      // two z. From FLK.down[1], the last fall, the route is the middle line to the bit: place, height and heading)
      const backAt = (z) => 1 - sm5((FLK.back[0] - z) / (FLK.back[0] - FLK.back[1])), downAt = (z) => 1 - sm5((FLK.down[0] - z) / (FLK.down[0] - FLK.down[1]));
      // (both laws begin FLK.late metres below the brink: the engine's gaze reads the line 18 m ahead, and so the look before the brink leans little)
      const shareAt = (z) => z >= zB || z <= FLK.back[1] ? 0 : sm5((zB - FLK.late - z) / FLK.out) * backAt(z), sideAt = (z) => xAt(z) * shareAt(z);
      const upAt = (z) => z >= zB || z <= FLK.down[1] ? 0 : (FLK.cy - 1.8) * sm((zB - FLK.late - z) / FLK.lift) * downAt(z);
      const shift = (d, o) => { if (d > dA && d < dC) o.y += sm((d - dA) / (dT - dA)) * (1 - sm((d - dT) / (dC - dT))) * room * Math.max(0, yTop - o.y); o.x += sideAt(o.z); o.y += upAt(o.z); return o; };
      const pos = (d, out = V3()) => shift(d, path.posAtDist(d, out)), ta = V3(), tb = V3();
      // (THE TANGENT is what the engine reads the camera's bank from; held() reads it only within the route's last metre, where it
      // is the middle line's own. Where the route is the middle line
      // itself, a hand either way, it is the middle line's own, to the last bit. On the rise and where the line swings out to the shelf
      // it is the line's own direction. Over the top of the arc, between FLK.keel's two z, where the line runs within a few degrees of
      // the middle line, it is eased into the middle line's own, and on the whole way back it IS the middle line's own: the eye comes
      // back across the lower steps on a level keel. The line's direction itself is in posAtDist.)
      const tan = (d, out = V3()) => {
        const mid = d + 0.05 <= dA || d - 0.05 >= dC, zu = path.posAtDist(d - 0.05, tb).z;
        if (mid && (path.posAtDist(d + 0.05, ta).z >= zB || zu <= FLK.keel[1])) return path.tangentAtDist(d, out);
        pos(d + 0.05, ta); pos(d - 0.05, tb); out.subVectors(ta, tb).normalize();
        const w = mid ? sm((FLK.keel[0] - zu) / (FLK.keel[0] - FLK.keel[1])) : 0;
        return w > 0 ? out.lerp(path.tangentAtDist(d, ta), w).normalize() : out; };
      const N = 640, sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1);
      for (let i = 0; i <= N; i++) { if ((i & 127) === 127) await ctx.yield(); pos(i / N * Lp, q); sx[i] = q.x; sy[i] = q.y; sz[i] = q.z; }
      const R = { length: Lp, points: path.points, start: path.start, end: path.end, startTangent: path.startTangent, endTangent: path.endTangent, flank: KX, rise: [dA, dC],
        posAtDist: pos, tangentAtDist: tan, pointAt: (u, out) => pos(u * Lp, out), tangentAt: (u, out) => tan(u * Lp, out),
        nearestXZ(x, z) { let best = Infinity, bi = 0; for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dz = sz[i] - z, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } } return { dist: Math.sqrt(best), u: bi / N, y: sy[bi] }; },
        distanceTo(x, y, z) { let best = Infinity; for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, dd = dx * dx + dy * dy + dz * dz; if (dd < best) best = dd; } return Math.sqrt(best); },
        isClear: (x, y, z, radius = 0, margin = 4) => R.distanceTo(x, y, z) > radius + margin,
        beside: (x, z) => z < zB + 4 && z > FLK.back[1] - 4 ? R.nearestXZ(x, z).dist : 99,   // how far, in plan, a place lies from the line where it goes down the flank (99 anywhere else)
        frameAt: (end, out, tilt) => path.frameAt(end, out, tilt) };
      return R;
    })();
    // THREE WET SANDBARS, bars of the river where the sand breaks the surface, each laid along the flight line: the first brushed on our
    // left below the mouth, the second CROSSED half way down the reach (about 2 m under the eye since round 27 raised the line; 0.8 m before), the third brushed on the left further
    // down. A club of sulphurs puddles on each.
    { const pb = V3(), tb = V3(), offs = [3.5, 0.5, 3.2];
      barDraw.forEach((b, i) => { const ub = uAtZ(b.z); path.pointAt(ub, pb); path.tangentAt(ub, tb).setY(0).normalize();
        const off = offs[i] + (i === 1 ? 0.6 : 0.25) * b.x; bars.push({ x: pb.x + tb.z * off, z: pb.z - tb.x * off, rx: i === 1 ? b.rx + 0.4 : b.rx, rz: b.rz, lx: pb.x, lz: pb.z, tx: tb.x, tz: tb.z }); }); }
    await ctx.yield();

    // ---------- sky, light, air ----------
    const us = U.uSun.value, uk = U.uSky.value, sm = Math.max(us.x, us.y, us.z, 1e-3), km = Math.max(uk.x, uk.y, uk.z, 1e-3);
    const cloudOpt = broken ? { coverage: 0.5, wind: [0.021, 0.007], scale: 0.85, silver: 1.3, shade: '#8496c0', softness: 0.26 } : { coverage: LOOK.cover + (burst ? 0.16 : 0), wind: [0.016, 0.005], scale: 1.1 };
    const sky = makeSky({ rng: R.fork('sky'), preset: overcast ? 'overcast' : LOOK.sky, sunDirection: sunV.clone(), zenith: broken ? '#1b55b2' : LOOK.zen, horizon: LOOK.hor, clouds: cloudOpt,
      lightColor: [us.x / sm, us.y / sm, us.z / sm], lightIntensity: sm * Math.PI * (overcast ? 1.6 : 1), ambientColor: [uk.x / km, uk.y / km, uk.z / km], ambientIntensity: km * Math.PI * 0.8 });
    scene.add(sky.object);
    const fogCol = new THREE.Color(broken ? '#a2c6e6' : burst ? '#a4b8c8' : LOOK.fog), fogD = LOOK.fogD * (burst ? 1.3 : 1);
    scene.fog = new THREE.FogExp2(fogCol, fogD);
    const rig = makeLightRig(sky, { bounce: 0.35, ambient: 1.2 }); scene.add(rig.object);
    await ctx.yield();

    // ---------- materials ----------
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog), FH = fragHead(S);
    const uCorr = { value: new THREE.Vector4(HALF, WY + 11, Z_MOUTH + 2, 1) };
    const rockU = []; for (let k = 0; k < 19; k++) rockU.push(V3(0, 0, 0));          // (x, z, radius) of every rock standing in the upper river, for its white water
    const shader = (defines, frag, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr, ...extra }, defines, fog: true, vertexShader: VERT_STD, fragmentShader: FH + frag, ...o });
    const groundMat = shader({ FCR_GROUND: 1 }, FRAG_GROUND, { uGrassA: { value: VLIN(LOOK.grassA, 0.8) }, uGrassB: { value: VLIN(LOOK.grassB, 0.85) } });
    const rockMat = (wetY, moss, warm = 0, bounce = 0, sheen = 0) => shader({}, FRAG_ROCK, { uWetY: { value: wetY }, uMoss: { value: moss }, uWarm: { value: warm }, uBounce: { value: bounce }, uSheen: { value: sheen } }, { vertexColors: true });
    const waterMat = shader({ FCR_WATER: 1 }, FRAG_WATER, { uRocks: { value: rockU }, uFallFoot: { value: new THREE.Vector4(FALL.x - 2.2, FALL.z, 3.4, 1) } }, { transparent: true, depthWrite: false, premultipliedAlpha: true });
    const mesaMat = shader({}, FRAG_MESA, {}, { vertexColors: true, side: THREE.DoubleSide });
    await ctx.yield();

    // ---------- rocks standing in or beside the water (placed first: the water laps round them) ----------
    const corrOnly = [], upOnly = [], gateOnly = [];                      // culled by the camera's z in update(): the slot's own things, the upper river's, the gate's
    const rr = R.fork('rocks'), rockParts = [], M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler();
    const rockCol = { color: '#8e847a', colorB: '#514a46' };                 // wet quartzite with a lit side, never a black lump
    const gateCol = { color: '#4a4541', colorB: '#211f1e' };                // the Gatepost: dark in the bright slot
    const addRock = (x, y, z, sx, sy, sz, yaw, kind = 'boulder', detailLv = 3, tilt = 0, col = rockCol) => {
      const g = T.rockGeometry({ rng: rr, kind, radius: 1, detail: detailLv, ...col });
      M4.compose(V3(x, y, z), Q4.setFromEuler(E4.set(tilt, yaw, tilt * 0.6)), V3(sx, sy, sz)); rockParts.push({ g, m: M4.clone() });
      lumps.push([x, z, Math.max(sx, sz) * 0.92]);
      let top = -1e9; const pa = g.attributes.position.array, v = V3(); for (let i = 0; i < pa.length; i += 3) { v.set(pa[i], pa[i + 1], pa[i + 2]).applyMatrix4(M4); if (Math.hypot(v.x - x, v.z - z) < Math.min(sx, sz) * 0.45 && v.y > top) top = v.y; }
      return top;
    };
    addRock(GATE.x - 1.35, WY + 1.7, GATE.z, 2.0, 4.4, 2.5, 0.3, 'boulder', 3, 0.06, gateCol);                     // the Gatepost: one boulder split in two
    await ctx.yield();
    addRock(GATE.x + 1.5, WY + 1.2, GATE.z + 0.5, 1.9, 3.7, 2.3, 2.1, 'boulder', 3, -0.07, gateCol);
    await ctx.yield();
    addRock(GATE.x + 0.4, WY + 0.1, GATE.z - 3.4, 1.2, 0.8, 1.5, 1.0, 'rock', 2, 0, gateCol);
    await ctx.yield();
    // the sunbittern's rock stands in the shallows 6.5 m to the right of the flight line, and nowhere nearer than 6 m to that line down
    // the whole reach: where the line swings toward it, it stands further out
    // (the brief's beat: at u 0.26 it flares its wings; the rock stands abeam of the point five metres further on, so that the bird is then
    // ahead of us on the right, eight metres off, and is passed at 6.5)
    const dBird = 0.26 * path.length + 5, pB = path.posAtDist(dBird), tB = path.tangentAtDist(dBird).setY(0).normalize(), rB = V3(-tB.z, 0, tB.x);
    const birdXZ = pB.clone().addScaledVector(rB, 6.5);
    for (let k = 0; k < 12 && path.nearestXZ(birdXZ.x, birdXZ.z).dist < 6.2; k++) birdXZ.addScaledVector(rB, 0.4);
    const birdTop = addRock(birdXZ.x, WY + 0.12, birdXZ.z, 1.25, 0.62, 1.05, rr.range(0, 3), 'boulder', 3);
    // THE SPLIT ROCK: a house-high boulder and its two fellows standing in the river on the shelf, 32 m above the ledge and 11 m left
    // of the river's axis (the flight line passes them 9 m off). The current piles white against them and parts round them, the
    // red weed streaming down both sides.
    const SPLIT = { x: -11.4, z: AN.ledge.z + 32.4 };
    { const cr1 = ctx.core.makeRng('fcr-split:' + ctx.seed);
      for (const [dx, dz, sx, sy, sz, y, det] of [[0, 0, 3.9, 5.4, 4.3, 1.5, 3], [-4.4, -3.4, 2.1, 2.5, 2.4, 0.6, 3], [4.9, -2.4, 1.3, 0.85, 1.6, 0.1, 2]]) {
        const g = T.rockGeometry({ rng: cr1, kind: 'boulder', radius: 1, detail: det, ...rockCol });
        M4.compose(V3(SPLIT.x + dx, WY + y, SPLIT.z + dz), Q4.setFromEuler(E4.set(0.05, cr1.range(0, 6.3), -0.04)), V3(sx, sy, sz)); rockParts.push({ g, m: M4.clone() });
        lumps.push([SPLIT.x + dx, SPLIT.z + dz, Math.max(sx, sz) * 0.9]);
        await ctx.yield();
      } }
    for (let k = 0, tries = 0; k < 7 && tries < 200; tries++) {
      await ctx.yield();
      const z = rr.range(124, 232), x = rr.range(-21, 21), sc = rr.range(0.6, 1.7);
      if (path.nearestXZ(x, z).dist < 7.5 + sc || Math.hypot(x - birdXZ.x, z - birdXZ.z) < 5 || Math.hypot(x - GATE.x, z - GATE.z) < 7 || Math.hypot(x - SPLIT.x, z - SPLIT.z) < 10.5) continue;
      natural(x, z); if (info.dE < -1) continue;
      addRock(x, WY + rr.range(-0.1, 0.25) * sc, z, sc * rr.range(0.9, 1.3), sc * rr.range(0.55, 0.9), sc * rr.range(0.9, 1.3), rr.range(0, 6.3), rr.chance(0.6) ? 'boulder' : 'rock', 2); k++;
    }
    await ctx.yield();
    { // boulders down the slot itself, close under the walls: each parts the current with a pillow and a V
      const cr0 = ctx.core.makeRng('fcr-corr-rocks:' + ctx.seed);
      for (let k = 0; k < 4; k++) {
        const z = Z_MOUTH + 22 + k * 23 + cr0.range(-5, 5), sg = k % 2 ? 1 : -1, sc = cr0.range(0.9, 1.35), x = sg * (HALF - 1.5 - sc * cr0.range(0.1, 0.5));
        const g = T.rockGeometry({ rng: cr0, kind: 'boulder', radius: 1, detail: 2, ...rockCol });
        M4.compose(V3(x, WY + cr0.range(-0.05, 0.2) * sc, z), Q4.setFromEuler(E4.set(0.05, cr0.range(0, 6.3), 0.04)), V3(sc * cr0.range(0.95, 1.25), sc * cr0.range(0.6, 0.85), sc * cr0.range(0.95, 1.3))); rockParts.push({ g, m: M4.clone() });
        lumps.push([x, z, sc * 1.1]);
        await ctx.yield();
      }
    }
    { // (round 27) THREE MOSSED BOULDERS STAND IN THE SAND REACH BESIDE THE LINE, each with its pillow and its V: one to the right 13 m
      // below the slot's mouth, one to the left, one to the right again above the last bar; 5.6 to 7.4 m from the flown line by place
      // (the whole rock nowhere nearer than 3.5 m), off the bars, clear of the other rocks and of the sunbittern's
      const nr = ctx.core.makeRng('fcr-near-rocks:' + ctx.seed), pn = V3(), tn = V3();
      for (const [zr, sg] of [[223, 1], [203, -1], [170, 1]]) {
        for (let t = 0; t < 12; t++) {
          const d = uAtZ(zr + nr.range(-4, 4)) * path.length, sc = nr.range(0.8, 1.15), off = nr.range(5.6, 7.4); path.posAtDist(d, pn); path.tangentAtDist(d, tn).setY(0).normalize();
          const x = pn.x - tn.z * sg * off, z = pn.z + tn.x * sg * off;
          if (path.nearestXZ(x, z).dist < 5.4 || Math.hypot(x - birdXZ.x, z - birdXZ.z) < 7) continue;
          if (bars.some((b) => ((x - b.x) / b.rx) ** 2 + ((z - b.z) / b.rz) ** 2 < 2.7) || lumps.some((l) => Math.hypot(x - l[0], z - l[1]) - l[2] < 4.5)) continue;
          natural(x, z); if (info.dE < 3) continue;
          addRock(x, WY + nr.range(0, 0.2) * sc, z, sc * nr.range(0.95, 1.25), sc * nr.range(0.6, 0.85), sc * nr.range(0.95, 1.25), nr.range(0, 6.3), 'boulder', 2); break;
        }
        await ctx.yield();
      }
      rockU[0].set(GATE.x, GATE.z, GATE.r - 0.4);                           // the Gatepost's two halves part the water as one
      for (let k = 3; k < lumps.length && k < 21; k++) rockU[k - 2].set(lumps[k][0], lumps[k][1], lumps[k][2] * 0.9);
    }
    await ctx.yield();
    const rockM = rockMat(WY, 0.35, 0.18, 1.3, 1), rockCut = Math.ceil(rockParts.length / 2);   // (merged in two halves: one kit call for all eighteen is a long step)
    const rocks = new THREE.Mesh(T.mergeRocks(rockParts.slice(0, rockCut)), rockM); rocks.name = 'fcr-boulders'; scene.add(rocks);
    const upRocks = [rocks];
    await ctx.yield();
    const rocksB = new THREE.Mesh(T.mergeRocks(rockParts.slice(rockCut)), rockM); rocksB.name = 'fcr-boulders-b'; scene.add(rocksB); upRocks.push(rocksB);
    await ctx.yield();

    // ---------- the river above the ledge: bed + banks (fine mesh), water sheet, and the land beyond ----------
    const grid = async (xs, zs, fn, withM) => {
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), a1 = new Float32Array(nx * nz), a3 = withM ? new Float32Array(nx * nz * 4) : null;
      for (let j = 0; j < nz; j++) {
        if ((j & 3) === 3) await ctx.yield();                            // a few rows at a time
        for (let i = 0; i < nx; i++) { const o = j * nx + i; pos[o * 3] = xs[i]; pos[o * 3 + 2] = zs[j]; pos[o * 3 + 1] = fn(xs[i], zs[j], o, a1, a3); }
      }
      await ctx.yield();
      const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute(withM ? 'aWl' : 'aDepth', new THREE.BufferAttribute(a1, 1)); if (withM) g.setAttribute('aM', new THREE.BufferAttribute(a3, 4));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      await triNormals(g, ctx.yield); g.computeBoundingSphere();
      return g;
    };
    const fill = (o, a1, a3) => { a1[o] = info.wl; a3[o * 4] = info.sand; a3[o * 4 + 1] = info.grass; a3[o * 4 + 2] = info.green; a3[o * 4 + 3] = info.red; };
    const UP_Z0 = 113.5, UP_N = Math.ceil((ZTOP - UP_Z0) / 1.5), UP_Z1 = UP_Z0 + UP_N * 1.5;
    { const xs = [], zs = []; for (let i = -14; i < 0; i++) xs.push(-20 + i * 1.6); for (let i = -25; i <= 25; i++) xs.push(i * 0.8); for (let i = 1; i <= 14; i++) xs.push(20 + i * 1.6);
      for (let z = UP_Z0; z < UP_Z1 - 0.01; z += z < 124.9 ? 1.5 : z < 205 ? 1.0 : z < 241 ? 1.5 : 3) zs.push(z); zs.push(UP_Z1);
      const bed = new THREE.Mesh(await grid(xs, zs, (x, z, o, a1, a3) => { const h = natural(x, z); fill(o, a1, a3); return z < 116.2 ? h - 0.07 : h; }, true), groundMat); bed.name = 'fcr-upper-bed'; scene.add(bed); upRocks.push(bed); }
    await ctx.yield();
    { const xs = [-28, -26, -24, -22], zs = []; for (let i = -20; i <= 20; i++) xs.push(i); xs.push(22, 24, 26, 28);
      for (let z = 116; z < UP_Z1 - 0.01; z += z < 123.9 ? 2 : z < 206 ? 1 : z < 240 ? 2 : 3) zs.push(z); zs.push(UP_Z1);
      const g = await grid(xs, zs, (x, z, o, a1) => {
        let d = WY - natural(x, z); if (info.wl < -50 && d > 0) d = -1;
        for (const l of lumps) { const q = (Math.hypot(x - l[0], z - l[1]) - l[2]) * 0.5; if (q < d) d = q; }
        a1[o] = d; return WY;
      }, false);
      const water = new THREE.Mesh(g, waterMat); water.renderOrder = 3; water.name = 'fcr-upper-water'; scene.add(water); upRocks.push(water); }
    await ctx.yield();
    { // real stones and fallen leaves on the sand: thick under the flight line, strewn along the bars' drift lines
      const PA = new Acc(), qr = R.fork('pebbles'), pc = [LIN('#4a4640'), LIN('#6a6258'), LIN('#7a6648'), LIN('#948c7c'), LIN('#3a3634'), LIN('#b4ac98', 0.85), LIN('#5e4a3a')];
      const pebble = (x, z, sz0) => {                                      // a low rounded cobble: 13 vertices
        const y = natural(x, z); if (info.dE < 0.4 || (info.sand < 0.4 && !(z > Z_MOUTH + 1 && info.shoal > 0.55))) return;   // on the sand, and on the mossed shoals of the slot
        const b = PA.p.length / 3, sx = sz0 * qr.range(0.75, 1.5), sz = sz0 * qr.range(0.75, 1.5), sy = sz0 * qr.range(0.4, 0.7), a = qr() * 6.283, ca = Math.cos(a), sa = Math.sin(a), c = qr.pick(pc), c2 = [c[0] * 0.7, c[1] * 0.7, c[2] * 0.72];
        PA.v(x, y + sy, z, 0, 1, 0, c);
        for (const [r, h, cc] of [[0.72, 0.55, c], [1, -0.1, c2]]) for (let k = 0; k < 6; k++) { const t = k * 1.0472, lx = Math.cos(t) * r * sx, lz = Math.sin(t) * r * sz, nx = Math.cos(t) * r, nz = Math.sin(t) * r;
          PA.v(x + lx * ca - lz * sa, y + h * sy, z + lx * sa + lz * ca, nx * ca - nz * sa, h + 0.45, nx * sa + nz * ca, cc); }
        for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; PA.tri(b, b + 1 + k1, b + 1 + k); PA.tri(b + 1 + k, b + 1 + k1, b + 7 + k); PA.tri(b + 1 + k1, b + 7 + k1, b + 7 + k); }
      };
      const u0 = 0, u1 = uAtZ(128), pp = V3(), nP = Math.round(700 * (0.6 + 0.4 * detail));   // (to z 128: below it the bed is rock and weed to the shelf; sixty stones fewer than before, the three new boulders' worth of triangles and more)
      // (round 27: in the sand reach a stone that would lie on the open flat or in a channel's floor is thrown again, twice at most:
      // the cobbles gather on the channels' shoulders, a hand to a forearm and a half under water, as PEBBLE BARS)
      for (let i = 0; i < nP; i++) { let x = 0, z = 0;
        for (let t = 0; t < 3; t++) { path.pointAt(lerp(u0, u1, qr()), pp); const cl = qr() < 0.3 ? 0.35 : 1; x = pp.x + qr.gauss() * (t ? 6.5 : 4.2 * cl); z = pp.z + qr.range(-1, 1);
          const dep = WY - natural(x, z); if (z > Z_MOUTH - 4 || z < 126 || (dep > 0.2 && dep < 0.6)) break; }
        pebble(x, z, qr.range(0.03, 0.085) * (qr() < 0.06 ? 1.8 : 1)); if ((i & 127) === 127) await ctx.yield(); }
      await ctx.yield();
      const lc = [LIN('#7a5a22', 0.8), LIN('#9a7a2a', 0.8), LIN('#5a3a1c', 0.8), LIN('#b89a3a', 0.8), LIN('#4a5a26', 0.8)];
      for (const b of bars) for (let i = 0; i < 110; i++) {
        const a = qr() * 6.283, r = 0.55 + 0.6 * qr(), x = b.x + Math.cos(a) * r * b.rx, z = b.z + Math.sin(a) * r * b.rz, y = natural(x, z);
        if (y < WY - 0.03 || y > WY + 0.14) { if (qr() < 0.7) continue; pebble(x, z, qr.range(0.03, 0.07)); continue; }
        const l = qr.range(0.05, 0.1), w = l * qr.range(0.35, 0.6), th = qr() * 6.283, ct = Math.cos(th), st = Math.sin(th), c = qr.pick(lc), yy = Math.max(y, WY) + 0.012;
        const v0 = PA.v(x - l * ct, yy, z - l * st, 0, 1, 0, c), v1 = PA.v(x - w * st, yy + 0.006, z + w * ct, 0, 1, 0, c), v2 = PA.v(x + l * ct, yy, z + l * st, 0, 1, 0, c), v3 = PA.v(x + w * st, yy + 0.006, z - w * ct, 0, 1, 0, c);
        PA.tri(v0, v1, v2); PA.tri(v0, v2, v3); PA.tri(v2, v1, v0); PA.tri(v3, v2, v0);
      }
      await ctx.yield();
      const peb = new THREE.Mesh(PA.build(), rockMat(WY - 6, -1.6)); peb.name = 'fcr-pebbles'; scene.add(peb); upOnly.push(peb, ...upRocks); }
    await ctx.yield();
    // THE FIRST RED: real fronds of the hero's own weed (same mesh, same shader) standing on the sunlit rock of the shallows above
    // the ledge, flecks at first and thickening toward it. The ground's red paint (info.red) lies only under them.
    let upWeed = null;
    // (a ROSETTE as the hero plants them: three instances fanned from one holdfast, one tone, carried in the whole part of the phase)
    const rosette = (arr, x, y, z, yaw, len, depth, green, ph, tone) => { const t8 = Math.floor(clamp(tone, 0, 0.999) * 8);
      for (let j = -1; j <= 1; j++) arr.push(x, y, z, yaw + j * 0.47, len * (j ? 0.82 : 1.12), depth, green, ((ph + j * 0.13 + 1) % 1) * 0.998 + t8); };
    { const wr = ctx.core.makeRng('fcr-upweed:' + ctx.seed), arr = [], want = Math.round(800 * (0.6 + 0.4 * detail)), pp = V3();
      for (let n = 0, tries = 0; n < want && tries < want * 14; tries++) {
        if ((tries & 127) === 127) await ctx.yield();
        // (round 27: one rosette in nine stands up the sand reach, on the red flecks of its ribs: the same number of fronds in all)
        const early = n < want * 0.11 && tries < want * 5, z = early ? 143 + 80 * wr() : 114.6 + 27.5 * Math.pow(wr(), 1.1); path.pointAt(uAtZ(z), pp);
        const x = pp.x + wr.gauss() * (early ? 10 : 8.5), h = natural(x, z), depth = WY - h;
        if (info.dE < 1 || depth < 0.05 || depth > 0.7 || wr() > info.red * 1.25) continue;
        rosette(arr, x, h - 0.01, z, L.flowYaw(x, z) + wr.range(-0.14, 0.14), wr.range(0.55, 1.0), Math.min(depth, 0.6), 0, wr(), 0.25 + 0.75 * wr()); n++;
      }
      if (arr.length) { upWeed = hero.makeFronds(arr); upWeed.name = 'fcr-upper-weed'; scene.add(upWeed); } }
    await ctx.yield();
    // THE SLOT'S OWN WEED: the same plant, green where the walls keep the sun off it, combed down the current under knee-deep glass.
    // Two meshes of the hero's fronds: those the sun reaches, and those in the walls' shadow (the same shader with the sun turned down).
    const corrWeed = [];
    { const wr = ctx.core.makeRng('fcr-corrweed:' + ctx.seed), lists = [[], []], want = Math.round(900 * (0.6 + 0.4 * detail)), sgn = sunV.x >= 0 ? 1 : -1;
      for (let n = 0, tries = 0; n < want && tries < want * 10; tries++) {
        if ((tries & 127) === 127) await ctx.yield();
        const z = wr.range(Z_MOUTH - 4, Z0 + 6), x = clamp(wr.gauss() * 4.4, -HALF + 1.3, HALF - 1.3), h = natural(x, z), depth = WY - h;
        if (info.sand > 0.45 || depth < 0.12 || wr() < info.sand || (depth > 0.95 && wr() < 0.7)) continue;      // thick on the shoals, sparse in the deep lanes
        const shaded = z > Z_MOUTH - 3 && sunV.y * (HALF - sgn * x) / Math.max(Math.abs(sunV.x), 0.05) < 11;
        rosette(lists[shaded ? 1 : 0], x, h - 0.01, z, wr.range(-0.22, 0.22), wr.range(0.6, 1.0), Math.min(depth, 0.6) * 0.45, 1, wr(), 0.3 + 0.7 * wr()); n++;
      }
      lists.forEach((arr, k) => { if (!arr.length) return; const m = hero.makeFronds(arr), hm = m.material;
        if (k) m.material = new THREE.ShaderMaterial({ uniforms: { ...hm.uniforms, uSun: { value: U.uSun.value.clone().multiplyScalar(0.07) }, uSky: { value: U.uSky.value.clone().multiplyScalar(2.1).add(V3(0.03, 0.05, 0.02)) } }, fog: true, side: THREE.DoubleSide, vertexShader: hm.vertexShader, fragmentShader: hm.fragmentShader });
        m.name = 'fcr-corridor-weed'; scene.add(m); corrWeed.push(m); }); }
    await ctx.yield();
    // A FALLEN TREE bridges the slot from rim to rim 32 m up the slot from its mouth: seen from the entry as a dark bar over the
    // bright mouth, then passed under, moss on its back, ferns riding it and roots hanging from it.
    const LOG = { z: Z_MOUTH + 32, at: (x, out) => { const t = (x + HALF + 3) / (2 * HALF + 6); return out.set(x, WY + 9.3 - 3.4 * t + 0.5 * Math.sin(t * 3.1416), LOG.z + 3.5 - 7 * t); }, r: (x) => 0.82 - 0.3 * (x + HALF + 3) / (2 * HALF + 6) };
    { const A = new Acc(), lr2 = ctx.core.makeRng('fcr-log:' + ctx.seed), bk = [LIN('#6a5238'), LIN('#3e3024'), LIN('#57483a')], pts = [], rad = [], NP = 15;
      for (let i = 0; i <= NP; i++) { const x = -HALF - 3 + (2 * HALF + 6) * i / NP, p = LOG.at(x, V3()); p.y += 0.12 * NZ.n2(x * 0.4, 5.5); pts.push(p); rad.push(LOG.r(x) * (1 + 0.12 * NZ.n2(x * 0.9, 9.1)) * (i === 0 || i === NP ? 0.8 : 1)); }
      A.tube(pts, rad, 10, (t, k) => { const c = bk[(k + Math.round(t * 30)) % 3], q = 0.8 + 0.4 * lr2(); return [c[0] * q, c[1] * q, c[2] * q]; });
      for (let k = 0; k < 4; k++) {                                        // broken branch stubs
        const x = lr2.range(-HALF + 1, HALF - 1), b = LOG.at(x, V3()), a = lr2.range(-1.2, 1.2), len = lr2.range(1.2, 2.6), d = V3(lr2.range(-0.4, 0.4), Math.cos(a), Math.sin(a)).normalize(), r0 = lr2.range(0.16, 0.26);
        A.tube([b.clone(), b.clone().addScaledVector(d, len * 0.55).add(V3(0.1, 0.05, 0)), b.clone().addScaledVector(d, len).add(V3(0.3, 0.2, 0.1))], [r0, r0 * 0.75, r0 * 0.5], 6, () => bk[1]);
      }
      const g = A.build(); g.computeVertexNormals();
      const lm = new THREE.Mesh(g, rockMat(WY - 60, 0.95)); lm.name = 'fcr-log'; scene.add(lm); corrOnly.push(lm); }
    await ctx.yield();
    const landY = (x, z) => { const h = natural(x, z), ax = Math.abs(x); return inHero(z) ? h + 2.1 * cover(x, z) - (1.3 + 4.6 * smoothstep(1.2, 4.5, info.dE)) * (1 - info.plat) : (z >= 116 && z < UP_Z1 - 0.2 && ax < 42) ? h - 2.5 * smoothstep(42, 37, ax) : h; };
    { const xs = [0], zs = [];
      for (let x = 3; x <= 63; x += 3) { xs.push(x); xs.unshift(-x); } for (let x = 69; x <= 123; x += 6) { xs.push(x); xs.unshift(-x); } for (let x = 150; x < 3000; x *= 1.3) { xs.push(x); xs.unshift(-x); }
      const far = []; for (let d = 8; d < 3000; d = d * 1.3 + 2) far.push(d);
      for (let k = far.length - 1; k >= 0; k--) zs.push(-233.5 - far[k]);
      zs.push(-233.5); for (let z = -232.5; z < 115; z += 6) zs.push(z); zs.push(115.5, 116.5);
      for (let z = 122; z < UP_Z1 - 4; z += 6) zs.push(z); zs.push(UP_Z1 - 0.75, UP_Z1); for (const d of far) zs.push(UP_Z1 + d);
      const land = new THREE.Mesh(await grid(xs, zs, (x, z, o, a1, a3) => { const h = landY(x, z); fill(o, a1, a3); if (z > -228) a1[o] = -100; return h; }, true), groundMat); land.name = 'fcr-land'; scene.add(land); }
    await ctx.yield();

    // ---------- the corridor: two walls of bedded rock under moss, rounding the mouth and running out along the scarp ----------
    const wallCols = (sg) => {
      const cols = [];
      for (let z = UP_Z1 + 2; z > 241; z -= 1.1) cols.push({ x: sg * (HALF + 0.5 * NZ.n2(z * 0.04, sg * 7) * smoothstep(241, 252, z)), z, nx: -sg, nz: 0, y0: WY - 1.7, y1: rimY(sg * 13, z) + 0.15 });
      for (let k = 1; k <= 6; k++) { const th = (k / 6) * Math.PI / 2; cols.push({ x: sg * (HALF + 4 - 4 * Math.cos(th)), z: 241 - 4 * Math.sin(th), nx: -sg * Math.cos(th), nz: -Math.sin(th), y0: WY - 1.2, y1: rimY(sg * 13, 242) + 0.15 }); }
      for (let x = HALF + 5.1; x < 52; x += 1.15) { const zz = lerp(237, zFront(sg * x) + 1, smoothstep(HALF + 4, 21, x)); cols.push({ x: sg * x, z: zz, nx: 0, nz: -1, y0: WY - 0.6, y1: rimY(sg * x, zz + 6) + 0.15, fade: 1 - 0.85 * smoothstep(40, 52, x) }); }
      return cols;
    };
    const wallMat = rockMat(WY, 0.85), walls = [];
    for (const sg of [-1, 1]) { const w = await wallSheet(wallCols(sg), NZ, sg * 31 + 50, { rows: 14 }, ctx.yield); w.sg = sg; walls.push(w); const m = new THREE.Mesh(w.geometry, wallMat); m.name = 'fcr-wall'; scene.add(m); await ctx.yield(); }

    // ---------- the scarps: a bedded rock wall along each bank, the tributary fall, the shadow the sunward scarp lays ----------
    // (the scarp that faces away from a low sun stands in the glow thrown back off the lit bank and the water: brown, never a black wall)
    const bnc = hour === 'dawn' ? 3.4 : hour === 'golden' ? 2.6 : 1.8, bankMat = rockMat(-1000, 0.3, 0.42, bnc), bankMatShade = hour === 'morning' ? bankMat : rockMat(-1000, 0.3, 0.42, bnc * (hour === 'golden' ? 2.1 : 1.4));
    const bankWalls = [], tv = V3(), xr = ctx.core.makeRng('fcr-scarps:' + ctx.seed);   // its own stream: nothing older is reshuffled
    for (const sg of [-1, 1]) {
      const k = sg < 0 ? 0 : 1, pts = [];
      for (let z = 239.5; z > -207; z -= 1.35) {
        riverEdge(z, eo); bankAt(z); const x = sg < 0 ? eo[0] - BK.d[0] : eo[1] + BK.d[1];
        if (z > zFront(x) + 1.5) continue;
        pts.push([x, z, BK.h[k]]);
      }
      const cols = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        let nx = -tz, nz = tx; if (nx * sg > 0) { nx = -nx; nz = -nz; }                       // the face looks at the river
        const [x, z, H] = pts[i], base = natural(x, z);
        cols.push({ x, z, nx, nz, y0: base - 1.3, y1: base + H, H, base, fade: 0.55 + 0.45 * smoothstep(2.5, 6, H) });
      }
      await ctx.yield();
      const w = await wallSheet(cols, NZ, sg * 53 + 90, { rows: 12, cap: 3.4, batter: 0.85, bulge: 0.55, shade: 1.75, foot: 0.4 }, ctx.yield); w.sg = sg; bankWalls.push(w);
      const m = new THREE.Mesh(w.geometry, sg * sunV.x > 0 ? bankMatShade : bankMat); m.name = 'fcr-scarp'; scene.add(m);
      await ctx.yield();
    }
    { // the tributary: white water draped down the ledges of the right-hand scarp where the gorge pinches in
      const w = bankWalls[1]; let ci = 0, best = 1e9; w.cols.forEach((c, i) => { const d = Math.abs(c.z - ZF); if (d < best) { best = d; ci = i; } });
      const P = [], Fa = [], I = [], NC = 3, NR = w.rows, yTop = w.cols[ci].y1, yFoot = WY;
      for (let c = -NC; c <= NC; c++) for (let j = 0; j < NR; j++) {
        const col = w.cols[ci + c]; w.at(ci + c, j, tv);
        P.push(tv.x + col.nx * 0.32, tv.y + 0.05, tv.z + col.nz * 0.32); Fa.push(c / NC, (yTop - tv.y) / (yTop - yFoot));
      }
      for (let c = 0; c < NC * 2; c++) for (let j = 0; j < NR - 1; j++) { const a = c * NR + j, b = a + NR; I.push(a, b, a + 1, b, b + 1, a + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(Fa, 2)); g.setIndex(I); g.computeBoundingSphere();
      const fallMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: VERT_FALL, fragmentShader: FH + FRAG_FALL });
      const fm = new THREE.Mesh(g, fallMat); fm.renderOrder = 2; fm.name = 'fcr-tributary-fall'; scene.add(fm);
      { // white water piled against the upstream face of every standing rock: a mound that stands up out of the sheet, so it reads from a metre above the river
        const PP = [], PF = [], PI = [], NA = 14;
        for (let k = 0; k < lumps.length; k++) { if (k === 2) continue; const [cx, cz, r] = lumps[k], hgt = clamp(0.2 * r, 0.24, 0.55), b = PP.length / 3;
          for (let i = 0; i <= NA; i++) { const a = (i / NA * 2 - 1) * 1.95, sa = Math.sin(a), ca = Math.cos(a), hh = hgt * (0.3 + 0.7 * Math.cos(a * 0.5) ** 2);
            PP.push(cx + sa * (r + 0.42), WY - 0.03, cz + ca * (r + 0.42), cx + sa * (r - 0.3), WY + hh, cz + ca * (r - 0.3)); PF.push(i / NA * 2 - 1, 1, i / NA * 2 - 1, 0); }
          for (let i = 0; i < NA; i++) { const a = b + i * 2; PI.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('aF', new THREE.Float32BufferAttribute(PF, 2)); pg.setIndex(PI); pg.computeBoundingSphere();
        const pm = new THREE.Mesh(pg, fallMat); pm.renderOrder = 4; pm.name = 'fcr-rock-pillows'; scene.add(pm); }
      FALL.ci = ci; w.at(ci, 1, tv); FALL.x = tv.x; FALL.fz = tv.z; FALL.nx = w.cols[ci].nx; FALL.nz = w.cols[ci].nz; FALL.top = yTop;
      waterMat.uniforms.uFallFoot.value.set(tv.x + FALL.nx * 1.6, tv.z + FALL.nz * 1.6, 3.6, 1);
    }
    await ctx.yield();
    { // the sunward scarp's shadow, raked over its shelf and (under a low sun) far across the river
      const w = bankWalls[sunV.x >= 0 ? 1 : 0], hl = Math.hypot(sunV.x, sunV.z) || 1, dx = -sunV.x / hl, dz = -sunV.z / hl, cot = hl / Math.max(sunV.y, 0.12), NS = 6;
      const P = [], UV = [], I = [];
      for (let i = 0; i < w.cols.length; i++) {
        if ((i & 63) === 63) await ctx.yield();
        const c = w.cols[i], len = Math.min(c.H * cot, 24), deep = clamp(1.2 - len / 40, 0.5, 1) * smoothstep(1.2, 3, c.H), b = P.length / 3;
        for (let q = 0; q <= NS; q++) {
          const t = q / NS, xx = c.x + c.nx * 0.5 + dx * len * t, zz = c.z + c.nz * 0.5 + dz * len * t; let y = groundAt(xx, zz) + 0.3;
          if (info.dE > 0 && inHero(zz)) y = Math.max(y - 0.22, hero.waterLevelAt(xx, zz) + 0.08); else if (info.wl > -50) y = Math.max(y - 0.22, info.wl + 0.08);
          P.push(xx, y, zz); UV.push(t, deep);
        }
        if (i) for (let q = 0; q < NS; q++) { const a = b - (NS + 1) + q, d = b + q; I.push(a, d, a + 1, d, d + 1, a + 1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeBoundingSphere();
      const sm2 = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uCloudT: U.uCloudT, uCloudAmt: U.uCloudAmt, uCloudCov: U.uCloudCov,
        uShade: { value: hour === 'dawn' ? new THREE.Vector4(0.05, 0.03, 0.1, 0.38) : hour === 'golden' ? new THREE.Vector4(0.06, 0.03, 0.09, 0.34) : new THREE.Vector4(0.008, 0.012, 0.04, 0.62) } },   // a low sun's long shadow is thin and violet, never a black lid
        transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, vertexShader: VERT_SHADE, fragmentShader: fragShade(S) }));
      sm2.renderOrder = 4; sm2.name = 'fcr-scarp-shadow'; scene.add(sm2);
    }
    await ctx.yield();

    // ---------- the exit: two black buttresses of the same bedded rock, lower stacks trailing off, the otters' ledge ----------
    const buttress = async (cx, cz, rx, rz, H, seed, shade = 0.8, o = {}) => {
      const cols = [], n = Math.max(14, Math.round((rx + rz) * 3.1416 / 1.05));
      for (let k = 0; k <= n; k++) { const th = (k % n) / n * 6.2832, lob = 1 + 0.16 * Math.sin(th * 2 + seed) + 0.1 * Math.sin(th * 3 + seed * 2.3), ca = Math.cos(th), sa = Math.sin(th);
        cols.push({ x: cx + ca * rx * lob, z: cz + sa * rz * lob, nx: ca, nz: sa, y0: o.y0 ?? POOL - 2.6, y1: POOL + H, fade: o.fade ?? 1 }); }
      const w = await wallSheet(cols, NZ, seed, { rows: 12, loop: true, cap: o.cap ?? Math.max(rx, rz) * 1.12 - 2.0, batter: 0.9, bulge: 0.5, shade, round: o.round, capUp: o.capUp }, ctx.yield);
      await ctx.yield();
      const mat = o.mat ?? gateMat; if (!buttGeo.has(mat)) buttGeo.set(mat, []); buttGeo.get(mat).push(w.geometry); return w;
    };
    const buttGeo = new Map();                                            // the six stacks of the exit are two draws, one for each of their two rocks (joined below: the same faces)
    const gateMat = rockMat(POOL, -0.3, 0.06, 1.2, 1);                    // two black buttresses: bare wet quartzite faces, growth only on crowns and ledges
    const gates = [await buttress(-15.6, -229, 5.6, 7.2, 12.4, 3.1, 0.5), await buttress(15.5, -229.6, 5.4, 7.4, 11.8, 7.7, 0.5)];
    await ctx.yield();
    // the lower stacks trailing off to either side: rounded shoulders, a domed crown, moss only in patches, ferns on top (never a flat green lid)
    const stackMat = rockMat(POOL, -0.22, 0.25, 1.2), stackO = { round: 2.7, cap: 1.5, capUp: 1.0, mat: stackMat };
    const stacks = [await buttress(-28.5, -232, 7.4, 6.0, 8.2, 12.3, 1.0, stackO), await buttress(28, -233, 7.2, 6.0, 7.4, 17.9, 1.0, stackO), await buttress(-42, -231, 7.5, 5.6, 5.2, 23.4, 1.0, { ...stackO, round: 2.3 }), await buttress(41, -232, 7.5, 5.6, 4.8, 29.2, 1.0, { ...stackO, round: 2.3 })];
    await ctx.yield();
    for (const [mat, gs] of buttGeo) {
      const g = new THREE.BufferGeometry(), idx = []; let nv = 0;
      for (const nm of ['position', 'normal', 'color']) { const a = new Float32Array(gs.reduce((s, q) => s + q.attributes[nm].array.length, 0)); let o = 0;
        for (const q of gs) { a.set(q.attributes[nm].array, o); o += q.attributes[nm].array.length; } g.setAttribute(nm, new THREE.BufferAttribute(a, 3)); }
      for (const q of gs) { const ia = q.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + nv); nv += q.attributes.position.count; }
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.name = 'fcr-buttress'; scene.add(m); await ctx.yield();
    }
    // THE OTTERS' LEDGE, BY THE EXIT: a low island of black rock standing in the pool on the right, 23 m below the cascade's last tread
    // and 7 m up-river of the ring, its river end a metre and a half outside the ring's foot: a slab lying across the current, half a
    // metre clear of the water, the outflow piling white against its up-river face. One otter sits up at its river end, its cream bib
    // to the fall and the water coming down it; the other lies stretched along the slab's down-river rim, head to the river. They
    // are placed and turned by the island and the river and keep their seats.
    const LEDGE = { x: 9.4, z: AN.portalSeat.position[2] + 7, rx: 2.55, rz: 1.25, top: POOL + 0.56 };
    { const NS = 36, RG = [[1.2, -1.5, 0.6], [1.07, -0.06, 0.62], [0.99, 0.2, 0.7], [0.93, 0.25, 0.8], [0.86, 0.5, 0.9], [0.7, 0.56, 1.1], [0.4, 0.6, 1.2]], P = [], C = [], I = [];
      for (let r = 0; r < RG.length; r++) for (let k = 0; k < NS; k++) {
        const th = k / NS * 6.2832, lob = 1 + 0.1 * Math.sin(th * 2 + 1.3) + 0.07 * Math.sin(th * 3 + 0.4) + 0.05 * Math.sin(th * 5 + 2.1), f = RG[r][0] * lob * (1 + 0.04 * NZ.n2(k * 0.9 + r * 3.1, 5.5 + r));
        const x = LEDGE.x + Math.cos(th) * LEDGE.rx * f, z = LEDGE.z + Math.sin(th) * LEDGE.rz * f, sh = RG[r][2] * (0.82 + 0.36 * (NZ.n2(x * 0.9 + 3, z * 0.9) * 0.5 + 0.5));
        P.push(x, POOL + RG[r][1] + (r > 3 ? 0.05 * NZ.n2(x * 1.3, z * 1.3 + 9) : 0), z); C.push(0.084 * sh, 0.08 * sh, 0.08 * sh);
      }
      P.push(LEDGE.x, LEDGE.top + 0.05, LEDGE.z); C.push(0.1, 0.095, 0.094);
      for (let r = 0; r < RG.length - 1; r++) for (let k = 0; k < NS; k++) { const a = r * NS + k, b2 = r * NS + (k + 1) % NS, c = a + NS, d = b2 + NS; I.push(a, c, b2, b2, c, d); }
      for (let k = 0, o = (RG.length - 1) * NS; k < NS; k++) I.push(o + k, RG.length * NS, o + (k + 1) % NS);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
      await triNormals(g, ctx.yield); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, rockMat(POOL - 0.1, -0.9, 0.04, 1.2, 0.8)); m.name = 'fcr-otter-ledge'; scene.add(m); }
    const sitP = V3(LEDGE.x - 1.6, LEDGE.top + 0.0, LEDGE.z + 0.05), lieP = V3(LEDGE.x + 0.75, LEDGE.top + 0.02, LEDGE.z - 0.42);
    hero.placeOtter(0, sitP, Math.atan2(0, AN.lastFall.z - sitP.z)); hero.placeOtter(1, lieP, -Math.PI / 2, { lie: true }); hero.setStack(LEDGE.x, LEDGE.z, LEDGE.rx + 0.15, LEDGE.rz + 0.15);
    await ctx.yield();

    // ---------- far tablelands ----------
    { const A = new Acc(), mr = R.fork('mesa');
      for (const deg of [-118, -80, -50, -24, 8, 33, 58, 88, 124, 165]) { const a = (deg + mr.range(-9, 9)) * Math.PI / 180, d = mr.range(2500, 4300); mesaInto(A, mr, Math.sin(a) * d, -Math.cos(a) * d - 100, mr.range(420, 900), mr.range(230, 330), -30); }
      const g = A.build(); g.computeVertexNormals(); const m = new THREE.Mesh(g, mesaMat); m.name = 'fcr-mesas'; scene.add(m); }
    await ctx.yield();

    // ---------- plants ----------
    const wind = flora.makeWind({ direction: [0.85, 0.35], strength: 0.9 }), leafOpt = { wind, ambient: 2.5, leafAmbient: hour === 'morning' ? 2.6 : 3.0, backlight: 1.25 };
    await flora.prepareLeafTexture(leafOpt, ctx.yield);                  // the leaf atlas, drawn in short steps
    const leafMat = flora.windMaterial(leafOpt), pr = R.fork('plants');
    await ctx.yield();
    const plantMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr, map: { value: leafMat.map } }, fog: true, vertexColors: true, side: THREE.DoubleSide, vertexShader: VERT_PLANT, fragmentShader: FH + FRAG_PLANT });
    const tp = V3(), tn = V3(), upv = V3(0, 1, 0), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), sc = V3(), scarpFerns = [];
    await ctx.yield();
    { // ferns on the ledges and faces of both walls
      const fernG = flora.fernGeometry({ rng: pr, size: 1.25, detail: 1, leaf: '#3f8a34', leafLight: '#a4d458', leafDark: '#1c4a26' });
      await ctx.yield();
      const n = Math.round(460 * (0.6 + 0.4 * detail)), nG = 84, ferns = new THREE.InstancedMesh(fernG, plantMat, n), fernsG = new THREE.InstancedMesh(fernG, plantMat, nG), fc = new THREE.Color();
      for (let i = 0; i < n + nG; i++) {
        const gt = i >= n, w = gt ? gates[i % 2] : walls[i % 2]; let ci = pr.int(2, w.cols.length - 3);
        if (gt) for (let t = 0; t < 12 && w.cols[ci].nz < -0.25; t++) ci = pr.int(0, w.cols.length - 2);      // the faces the flight sees
        const rim = pr.chance(gt ? 0.4 : 0.28), rj0 = rim ? w.rows - 1 : pr.int(gt ? 4 : 2, w.rows - 2), rj = gt && !rim ? (rj0 < 7 ? 10 : rj0 < 9 ? 7 : rj0) : rj0, c = w.cols[ci];   // (on the gate: the two upper ledges and the crown only)
        w.at(ci, rj, tp); tn.set(c.nx, rim ? 1.1 : 0.5, c.nz).normalize();
        qa.setFromUnitVectors(upv, tn); qb.setFromAxisAngle(upv, pr.range(0, 6.283)); qa.multiply(qb);
        const s = pr.range(0.55, 1.35) * (rim ? 1.4 : 1); tp.x += c.nx * 0.1; tp.z += c.nz * 0.1;
        const fm = gt ? fernsG : ferns, fi = gt ? i - n : i;
        M4.compose(tp, qa, sc.set(s, s, s)); fm.setMatrixAt(fi, M4);
        const fb = pr.range(0.45, 1.0); fm.setColorAt(fi, fc.setRGB(fb * pr.range(0.7, 1.25), fb, fb * pr.range(0.6, 1.1)));
      }
      for (const fm of [ferns, fernsG]) { fm.instanceMatrix.needsUpdate = true; fm.instanceColor.needsUpdate = true; fm.computeBoundingSphere(); fm.name = 'fcr-wall-ferns'; scene.add(fm); }
      corrOnly.push(ferns); gateOnly.push(fernsG);
      const stepR = ctx.core.makeRng('fcr-step-ferns:' + ctx.seed);
      for (const w of bankWalls) {                                        // ferns on the ledges and rims of both scarps, thickest round the fall
        const nB = Math.round(130 * (0.6 + 0.4 * detail)), last = w.cols.length - 3, fl = [[], [], []];
        // FERNS AT THE TWO ENDS OF EVERY FALL: where each lip of the staircase and the last lip run out into the bank the shelf steps
        // down with them, and ferns hang on that step's face from the water's side outward, three to six a lip and bank, facing
        // down the river. Each is dealt by a stream of its own, stands on the ground's own drop there, and is left out where it
        // would stand within FLK.air and its own reach of the line down the flank. They are drawn with this bank's scarp ferns.
        for (let k = 0; k <= AN.steps.count; k++) {
          const zk = k < AN.steps.count ? AN.brink.z - AN.steps.tread * k : AN.lastFall.z; let xw = 0;
          for (let x = 1; x < 36; x += 0.25) { const z = L.zOf(w.sg * x, zk + 0.8); if (hero.waterLevelAt(w.sg * x, z) - hero.heightAt(w.sg * x, z) > 0.08) xw = x; }
          for (let i = 0, n = stepR.int(3, 6); i < n; i++) {
            const x = w.sg * (xw + 0.2 + 2.8 * stepR() * stepR()), f = stepR.range(0.12, 0.7), s = stepR.range(0.5, 1.0), yw = stepR.range(0, 6.283), fb = stepR.range(0.5, 1.0), fr1 = fb * stepR.range(0.7, 1.25), fb1 = fb * stepR.range(0.6, 1.1);
            const z0 = L.zOf(x, zk) + 1.2, hT = groundAt(x, z0), hB = groundAt(x, z0 - 3.4); if (hT - hB < 0.6) continue;
            let z = z0; while (z > z0 - 3.4 && groundAt(x, z) > hT - f * (hT - hB)) z -= 0.1;
            if (route.beside(x, z) < FLK.air + 2.4) continue;
            tp.set(x, groundAt(x, z) - 0.05, z - 0.08); qa.setFromUnitVectors(upv, tn.set(0, 0.5, -1).normalize()); qa.multiply(qb.setFromAxisAngle(upv, yw));
            M4.compose(tp, qa, sc.set(s, s, s)); fl[2].push([M4.clone(), fr1, fb, fb1]);
          }
        }
        await ctx.yield();
        for (let i = 0; i < nB; i++) {
          let ci = xr.int(2, last); for (let t = 0; t < 6 && w.cols[ci].H < 3.2; t++) ci = xr.int(2, last);
          if (w.sg > 0 && xr.chance(0.3)) ci = clamp(FALL.ci + (xr.chance(0.5) ? 1 : -1) * xr.int(4, 16), 2, last);
          const rim = xr.chance(0.42), rj = rim ? w.rows - 1 : xr.int(3, w.rows - 2), c = w.cols[ci];
          w.at(ci, rj, tp); tn.set(c.nx, rim ? 1.1 : 0.5, c.nz).normalize();
          qa.setFromUnitVectors(upv, tn); qb.setFromAxisAngle(upv, xr.range(0, 6.283)); qa.multiply(qb);
          const s = xr.range(0.55, 1.15) * (rim ? 1.35 : 1); tp.x += c.nx * 0.1; tp.z += c.nz * 0.1;
          M4.compose(tp, qa, sc.set(s, s, s));
          const fb = xr.range(0.5, 1.0), fr1 = fb * xr.range(0.7, 1.25), fb1 = fb * xr.range(0.6, 1.1); fl[clamp(Math.floor((240 - tp.z) / 149), 0, 2)].push([M4.clone(), fr1, fb, fb1]);
        }
        fl.forEach((part, ci) => { if (!part.length) return; const bf = new THREE.InstancedMesh(fernG, plantMat, part.length);     // (three stretches a bank: one is drawn while the eye's z is within 170 m of it, and down the flank whatever of it stands up the river)
          part.forEach((e, k) => { bf.setMatrixAt(k, e[0]); bf.setColorAt(k, fc.setRGB(e[1], e[2], e[3])); });
          bf.instanceMatrix.needsUpdate = true; bf.instanceColor.needsUpdate = true; bf.computeBoundingSphere(); bf.name = 'fcr-scarp-ferns'; scene.add(bf); scarpFerns.push([bf, 240 - (ci + 0.5) * 149, 74.5 + 170]); });
        await ctx.yield();
      }
      { // ferns crowning the low stacks beside the gate, and tucked into their shoulders
        const sr = ctx.core.makeRng('fcr-stack-ferns:' + ctx.seed), nS = 44, sf = new THREE.InstancedMesh(fernG, plantMat, nS);
        for (let i = 0; i < nS; i++) {
          const w = stacks[i % 4]; let ci = sr.int(0, w.cols.length - 2); for (let t = 0; t < 8 && w.cols[ci].nz < -0.3; t++) ci = sr.int(0, w.cols.length - 2);
          const top = sr.chance(0.6), rj = top ? w.rows - sr.int(0, 1) : sr.int(6, w.rows - 2), c = w.cols[ci];
          w.at(ci, rj, tp); tn.set(c.nx * (top ? 0.35 : 0.9), 1, c.nz * (top ? 0.35 : 0.9)).normalize();
          qa.setFromUnitVectors(upv, tn); qb.setFromAxisAngle(upv, sr.range(0, 6.283)); qa.multiply(qb);
          const s1 = sr.range(0.9, 1.7) * (top ? 1.25 : 1); tp.y -= 0.12;
          M4.compose(tp, qa, sc.set(s1, s1, s1)); sf.setMatrixAt(i, M4); const fb = sr.range(0.5, 1.0); sf.setColorAt(i, fc.setRGB(fb * sr.range(0.7, 1.2), fb, fb * sr.range(0.6, 1.0)));
        }
        sf.instanceMatrix.needsUpdate = true; sf.instanceColor.needsUpdate = true; sf.computeBoundingSphere(); sf.name = 'fcr-stack-ferns'; scene.add(sf); gateOnly.push(sf); }
      await ctx.yield();
      // hanging roots and vines: ribbons that keep their width on screen
      const RA = new Acc(), rootC = [LIN('#4a3a26', 0.9), LIN('#3a5a2a', 0.9), LIN('#5a4a30', 0.9)];
      for (let k = 0; k < 138; k++) {
        const gt = k >= 110, w = gt ? gates[k % 2] : walls[k % 2]; let ci = pr.int(2, w.cols.length - 3);
        if (gt) for (let t = 0; t < 12 && w.cols[ci].nz < -0.25; t++) ci = pr.int(0, w.cols.length - 2);
        const rj = pr.chance(0.6) ? w.rows - 1 : pr.int(6, w.rows - 2), c = w.cols[ci];
        w.at(ci, rj, tp); const len = Math.min(pr.range(2.5, 8.5), tp.y - (gt ? POOL : WY) - 0.3); if (len < 1.2) continue;
        const x0 = tp.x + c.nx * 0.55, z0 = tp.z + c.nz * 0.55, col = pr.pick(rootC), hw = pr.range(0.028, 0.05), sx = -c.nz, sz = c.nx, bw = pr.range(0.05, 0.3);
        let prev = -1;
        for (let s = 0; s <= 5; s++) {
          const t = s / 5, y = tp.y - len * t, bow = Math.sin(t * 3.1416) * bw, sway = 0.3 * t * t;
          const a = RA.v(x0 + c.nx * bow, y, z0 + c.nz * bow, c.nx, 0, c.nz, col, sway, 0, 0, [-sx, 0, -sz, hw]); RA.v(x0 + c.nx * bow, y, z0 + c.nz * bow, c.nx, 0, c.nz, col, sway, 0, 0, [sx, 0, sz, hw]);
          if (s) RA.quad(prev, prev + 1, a + 1, a); prev = a;
        }
      }
      for (let k = 0; k < 90; k++) {                                      // roots and lianas over the scarp rims
        const w = bankWalls[k % 2], ci = xr.int(2, w.cols.length - 3), c = w.cols[ci]; if (c.H < 3.5) continue;
        w.at(ci, w.rows - 1, tp); const len = Math.min(xr.range(2, 6.5), c.H - 0.8);
        const x0 = tp.x + c.nx * 0.5, z0 = tp.z + c.nz * 0.5, col = xr.pick(rootC), hw = xr.range(0.03, 0.055), sx = -c.nz, sz = c.nx, bw = xr.range(0.05, 0.3);
        let prev = -1;
        for (let q = 0; q <= 5; q++) {
          const t = q / 5, y = tp.y - len * t, bow = Math.sin(t * 3.1416) * bw + 0.5 * t, sway = 0.3 * t * t;
          const a = RA.v(x0 + c.nx * bow, y, z0 + c.nz * bow, c.nx, 0, c.nz, col, sway, 0, 0, [-sx, 0, -sz, hw]); RA.v(x0 + c.nx * bow, y, z0 + c.nz * bow, c.nx, 0, c.nz, col, sway, 0, 0, [sx, 0, sz, hw]);
          if (q) RA.quad(prev, prev + 1, a + 1, a); prev = a;
        }
      }
      { const lr3 = ctx.core.makeRng('fcr-log-plants:' + ctx.seed), nL = 12, lf = new THREE.InstancedMesh(fernG, plantMat, nL);
        for (let i = 0; i < nL; i++) {                                     // ferns riding the fallen tree
          LOG.at(lr3.range(-HALF + 0.5, HALF - 0.5), tp); tp.y += LOG.r(tp.x) * 0.8; tn.set(lr3.range(-0.2, 0.2), 1, lr3.range(-0.5, 0.5)).normalize();
          qa.setFromUnitVectors(upv, tn); qb.setFromAxisAngle(upv, lr3.range(0, 6.283)); qa.multiply(qb); const s1 = lr3.range(0.7, 1.3);
          M4.compose(tp, qa, sc.set(s1, s1, s1)); lf.setMatrixAt(i, M4); const fb = lr3.range(0.55, 1.0); lf.setColorAt(i, fc.setRGB(fb * lr3.range(0.7, 1.2), fb, fb * lr3.range(0.6, 1.0)));
        }
        lf.instanceMatrix.needsUpdate = true; lf.instanceColor.needsUpdate = true; lf.computeBoundingSphere(); lf.name = 'fcr-log-ferns'; scene.add(lf); corrOnly.push(lf);
        for (let k = 0; k < 16; k++) {                                     // roots and lianas hanging from it, clear of the flight line
          const x = (k % 2 ? 1 : -1) * lr3.range(2.4, HALF - 0.6); LOG.at(x, tp); const y0 = tp.y - LOG.r(x) * 0.7, len = Math.min(lr3.range(1.6, 4.6), y0 - (WY + 3.3)); if (len < 1) continue;
          const col = lr3.pick(rootC), hw = lr3.range(0.03, 0.055), bw = lr3.range(0.05, 0.25); let prev = -1;
          for (let q = 0; q <= 5; q++) {
            const t = q / 5, y = y0 - len * t, bow = Math.sin(t * 3.1416) * bw, sway = 0.35 * t * t;
            const a = RA.v(tp.x + bow, y, tp.z, 0, 0, 1, col, sway, 0, 0, [-1, 0, 0, hw]); RA.v(tp.x + bow, y, tp.z, 0, 0, 1, col, sway, 0, 0, [1, 0, 0, hw]);
            if (q) RA.quad(prev, prev + 1, a + 1, a); prev = a;
          }
        } }
      const roots = new THREE.Mesh(RA.build(true), plantMat); roots.name = 'fcr-roots'; scene.add(roots);
    }
    await ctx.yield();
    const palmAt = [];
    { // moriche palms in the wet hollows along both banks, on the rim over the corridor mouth, and the leaning one at the exit
      const pg = [moricheGeometry(pr.fork('p1'), 13.5), moricheGeometry(pr.fork('p2'), 16.5)], lists = [[], []];
      await ctx.yield();
      const put = (x, z, s, lean = 0.06, q = pr) => { groundAt(x, z); if (info.plat > 0.01 && info.plat < 0.99) x -= Math.sign(x) * 5.5; E4.set(q.range(-lean, lean), q.range(0, 6.283), q.range(-lean, lean)); M4.compose(tp.set(x, groundAt(x, z) - 0.25, z), Q4.setFromEuler(E4), sc.set(s, s, s)); const vi = q.int(0, 1); if (route.beside(x, z) < FLK.air + 1.7) return; lists[vi].push(M4.clone()); palmAt.push([x, z, (vi ? 16.5 : 13.5) * s]); };
      const groves = Math.round(9 * density);
      for (let g = 0, tries = 0; g < groves && tries < 300; tries++) {
        const z = g === 0 ? 205 : g === 1 ? 176 : pr.range(-215, 228), sg = g === 0 ? -1 : g === 1 ? 1 : pr.sign(); riverEdge(z, eo);
        bankAt(z); const d = Math.min(pr.range(4, 13), BK.d[sg < 0 ? 0 : 1] - 3), x = sg < 0 ? eo[0] - d : eo[1] + d;
        if (d < 2.5) { g++; continue; }
        if (path.nearestXZ(x, z).dist < 15) continue;
        for (let k = 0, m = pr.int(2, 4); k < m; k++) put(x + sg * pr.range(0, 6) * 0.3 + (k ? pr.range(-3, 3) : 0), z + (k ? pr.range(-6, 6) : 0), pr.range(0.8, 1.15));
        g++;
      }
      for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) put(sg * pr.range(15, 22), zFront(sg * 18) + pr.range(7, 14) + k * 9, pr.range(0.8, 1.0));
      { const bp = ctx.core.makeRng('fcr-belt-palms:' + ctx.seed);          // tall moriches standing up through the gallery forest of the lower river
        for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) { const z = -66 - k * 44 + bp.range(-9, 9); riverEdge(z, eo); bankAt(z); const k2 = sg < 0 ? 0 : 1;
          put((sg < 0 ? eo[0] : eo[1]) + sg * (BK.d[k2] + bp.range(10, 22)), z, bp.range(1.3, 1.55), 0.05, bp); } }
      lists.forEach((ls, i) => { if (!ls.length) return; const im = new THREE.InstancedMesh(pg[i], plantMat, ls.length); ls.forEach((m, k) => im.setMatrixAt(k, m)); im.instanceMatrix.needsUpdate = true; im.name = 'fcr-palms'; scene.add(im); });
      await ctx.yield();
      const lean = new THREE.Mesh(moricheGeometry(pr.fork('p3'), 11, 1.35), plantMat); lean.position.set(-12.6, POOL + 11.4, -227.2); lean.rotation.set(0.14, 0.6, -0.68); lean.name = 'fcr-exit-palm'; scene.add(lean);
    }
    await ctx.yield();
    // (round 14, B; the rules of round 15) THE WET HOLLOWS OF THE RED RIVER. Along each bank of the slab, from the ledge to the brink,
    // the pavement seeps at the water's edge: one hollow to every 65 m of bank (the first 14 to 40 m below the ledge, AN.ledge.z, then a
    // seeded step of 52 to 78 m), so two or three to a bank. The walk down a bank ends where a hollow of the middling length (a pad
    // runs 6.5 to 9.5 m either way along the bank: 8 m) would no longer lie above the brink (AN.brink.z); and NO HOLLOW'S PAD REACHES
    // PAST THE BRINK: one whose own pad would is laid that much higher up the bank (the paint's torn outline strays out to 1.38 times
    // the pad's length at the most, the bed shader's 1 + .3 + .08, and it is that outline which stays above the brink).
    // NO HOLLOW WITHOUT ITS PAINT: the hero's bed has six places for the paint (uHol), so a seventh hollow is not laid.
    // A pad is 3.6 to 4.6 m half across and lies that far out on the bank less 0.6 m: at its middle its outline reaches 0.6 m
    // inside the water's edge (the paint fades to nothing at that outline; at the waterline the wet pavement is the river's own).
    // Each is a pad of dark wet rock, algae and standing water (hero.setHollows paints it) with three to seven moriche palms, 12 to
    // 18 m to the top of the crown, their feet on the bank 1.5 to 6 m outside the water's edge and within nine tenths of the pad's
    // length up or down the bank from its middle: never in the water, never on the
    // weed, and never between the eye and anything in the river, because the eye, the otters' lane, the pair's well and the macaws'
    // crossing all lie inside the two water's edges and every foot stands outside them. The places come from a stream of their own
    // and the bank's own line. The palms are the world's own moriche in a lighter cut (moricheLight, plantMat), whole crowns at every distance,
    // drawn as the palms above are. THEY ARE PALMS OF THIS RIVER: each stands on palmAt with its foot and its trunk's height (as put gives it
    // for every other palm: the model's trunk times the palm's scale), no foot nearer than 1.7 m to another palm's, and they are
    // laid here, before the shadows, so that the one loop below lays their long shadows at a low sun as it lays every other palm's
    // (palmAt is read by that loop and by the spacing of the feet here, by nothing else).
    {
      const hr = ctx.core.makeRng(ctx.core.hashSeed('fcr-hollows:' + ctx.seed));
      const TRUNK = [13.5, 16.5], hg = [moricheLight(hr.fork('g1'), TRUNK[0]), moricheLight(hr.fork('g2'), TRUNK[1])];   // (round 19, rule 5: two light palms of 212 triangles each)
      await ctx.yield();
      const topOf = hg.map((g) => { g.computeBoundingBox(); return g.boundingBox.max.y; }), list = [], mats = [[], []];
      const PAINTED = 6, HL = [6.5, 9.5], TORN = 1.38;
      for (const sg of [-1, 1]) {
        for (let z0 = AN.ledge.z - hr.range(14, 40); list.length < PAINTED && z0 - (HL[0] + HL[1]) / 2 > AN.brink.z; z0 -= hr.range(52, 78)) {
          const hw = hr.range(3.6, 4.6), hl = hr.range(HL[0], HL[1]), z = Math.max(z0, AN.brink.z + hl * TORN), edge = sg < 0 ? L.edgeL(z) : L.edgeR(z), cx = edge + sg * (hw - 0.6);
          for (let k = 0, m = hr.int(3, 7), tries = 0; k < m && tries < 40; tries++) {
            const fz = z + hr.range(-1, 1) * hl * 0.9, e = sg < 0 ? L.edgeL(fz) : L.edgeR(fz), fx = e + sg * hr.range(1.5, 6), H = hr.range(12, 18), vi = hr.int(0, 1), yaw = hr.range(0, 6.283), lx = hr.range(-0.05, 0.05), lz = hr.range(-0.05, 0.05);
            if (palmAt.some((f) => Math.hypot(f[0] - fx, f[1] - fz) < 1.7)) continue;
            const s = H / topOf[vi]; E4.set(lx, yaw, lz); M4.compose(tp.set(fx, groundAt(fx, fz) - 0.25, fz), Q4.setFromEuler(E4), sc.set(s, s, s)); mats[vi].push(M4.clone()); palmAt.push([fx, fz, TRUNK[vi] * s]); k++;
          }
          list.push([cx, z, hw, hl]);
          await ctx.yield();
        }
      }
      mats.forEach((ls, vi) => { if (!ls.length) return; const im = new THREE.InstancedMesh(hg[vi], plantMat, ls.length); ls.forEach((m, k) => im.setMatrixAt(k, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.name = 'fcr-hollow-palms'; scene.add(im); });
      hero.setHollows(list);
    }
    await ctx.yield();
    if (sunV.y < 0.5 && !overcast) { // low sun: every palm lays a long shadow over the pavement and across the slab
      const SA = { p: [], uv: [], i: [] }, hx = -sunV.x, hz = -sunV.z, hl = Math.hypot(hx, hz) || 1, dx = hx / hl, dz = hz / hl, px = -dz, pz = dx, NS = 16;
      for (const [x0, z0, H] of palmAt) {
        if (z0 > 232) continue;
        const len = Math.min(H * hl / Math.max(sunV.y, 0.15), 60), b = SA.p.length / 3;
        for (let k = 0; k <= NS; k++) {
          const t = k / NS, x = x0 + dx * len * t, z = z0 + dz * len * t, e = (t - 0.87) / 0.13, w = 0.3 + 0.25 * t + (Math.abs(e) < 1 ? 0.2 * H * Math.sqrt(1 - e * e) : 0);
          for (const sd of [-1, 1]) { const xx = x + px * w * sd, zz = z + pz * w * sd; let y = groundAt(xx, zz); if (info.dE > 0 && inHero(zz)) y = Math.max(y, hero.waterLevelAt(xx, zz)); else if (info.wl > -50) y = Math.max(y, info.wl);
            SA.p.push(xx, y + 0.07, zz); SA.uv.push(sd, t); }
          if (k) { const a = b + (k - 1) * 2; SA.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      }
      if (SA.i.length) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(SA.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(SA.uv, 2)); g.setIndex(SA.i);
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
          vertexShader: /* glsl */`varying vec2 vUv; varying float vD; varying float vK; uniform float uTime;
void main(){ vUv = uv; vK = smoothstep(${(AN.lastFall.z - 3).toFixed(1)}, ${(AN.lastFall.z + 4).toFixed(1)}, position.z); vec3 p = position; float sw = uv.y*uv.y*.35*sin(uTime*1.3 + position.z*.2); p.x += sw*${(px).toFixed(4)}; p.z += sw*${(pz).toFixed(4)};
  vec4 mv = modelViewMatrix*vec4(p, 1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
          fragmentShader: /* glsl */`varying vec2 vUv; varying float vD; varying float vK;
void main(){ float e = 1. - abs(vUv.x), head = smoothstep(.7, .8, vUv.y);
  float a = smoothstep(0., mix(.5, .3, head), e)*smoothstep(1., .96, vUv.y)*smoothstep(0., .03, vUv.y);
  a *= mix(1., .55 + .45*step(.45, fract(vUv.x*3.5 + vUv.y*9.)), head*smoothstep(.25, .7, abs(vUv.x)));   // the fans' fingers at the crown's edge
  gl_FragColor = vec4(.012, .01, .03, a*.5*smoothstep(260., 90., vD)*clamp(vK, 0., 1.)); }` }));   // (vK: no shadow is ruled across the pool below the last fall; its water is deep and broken)
        m.renderOrder = 4; m.frustumCulled = false; m.name = 'fcr-palm-shadows'; scene.add(m);
      }
    }
    await ctx.yield();
    // gallery forest: dark round crowns from 25-40 m back, and along the rim of the tableland
    const oakO = { leaf: '#3a7230', leafLight: '#88b048', leafDark: '#1a3e20', bark: '#5a4a3a' };
    const nearV = [flora.oakGeometry({ rng: pr, detail: 1, height: 15, ...oakO })];
    await ctx.yield();
    nearV.push(flora.oakGeometry({ rng: pr, detail: 1, height: 18, ...oakO }));
    await ctx.yield();
    const farV = [flora.oakGeometry({ rng: pr, detail: 0, height: 15, ...oakO })];
    await ctx.yield();
    farV.push(flora.oakGeometry({ rng: pr, detail: 0, height: 18.5, ...oakO }));
    await ctx.yield();
    const onTop = (x, z) => z > zFront(x) + 5;
    const forest = flora.makeForest({ rng: R.fork('forest'), path, heightAt: groundAt, material: leafMat, variants: nearV, farVariants: farV, farDistance: 64, count: Math.round(56 * Math.min(density, 1.0)), radius: 130, corridor: 16,
      spacing: 4.5, scale: [0.85, 1.3], falloff: 0.55, chunks: 4, cullDistance: 330, groundShadow: { sunDir: sunV, strength: 0.45 },
      density: (x, z) => { natural(x, z); return onTop(x, z) ? (Math.abs(x) > 16 ? 0.9 : 0) : info.plat > 0.97 ? (Math.hypot(x - FALL.x, z - ZF) < 26 ? 0 : 1) : info.plat > 0.01 ? 0 : 0.12 * smoothstep(24, 40, -info.dE); } });
    scene.add(forest.object);
    // THE SHADOW SHEET LIES ON THE GROUND OR IS NOT DRAWN. forest.shadow.object is one mesh of discs. The kit lays each disc as a grid of
    // n by n cells (n + 1 vertices a side, n from 2 to 6), its vertices one after another in the mesh, its uv running from (-1, -1) at its
    // first vertex to (1, 1) at its last: the first n + 1 vertices of a disc, and no others of it, have uv.x = -1. Counting them gives n;
    // the disc holds (n + 1) * (n + 1) vertices and 6 * n * n indices (2 * n * n triangles), and the next disc begins straight after.
    // Each disc is tried at its vertices and at points no more than SHEET_STEP metres apart across each cell, on the two triangles the
    // kit draws there (p, p + 1, p + n + 2 and p, p + n + 2, p + n + 1), against the ground as it is drawn under the point (drawnAt, or
    // groundAt where drawnAt finds none). A disc of which any such point stands more than SHEET_MARGIN over that ground is left out of
    // the mesh's index, whole; every other disc keeps its vertices and its triangles as the kit made them.
    // THE GROUND AS DRAWN is three meshes: fcr-land (the land on every side), fcr-upper-bed (the river's bed and banks above the ledge
    // and up the slot) and the hero's fcr-bed (its own bed and rock skirt, down the falls to the pool). Each is a grid: rows of nx
    // vertices, the vertices of a column sharing one x, which rises from column to column, and its index cuts every cell (a in row j and
    // column i, b beside it in column i + 1, c and d under them in row j + 1) along b to c into the triangles a b c and b d c. The three
    // are read as their geometries hold them (none is moved, turned or scaled), whole, whatever of them is shown at a moment: update()
    // hides fcr-upper-bed while the eye's z is 52 or less and fcr-bed while the eye's z is over 262, and the bed's shader leaves fcr-bed
    // undrawn over its potholes, where the mesh fcr-wells stands; a disc is tried against the three as their geometries hold them all
    // the same. nx is the number of vertices, from the first, for which
    // x rises; a mesh that is not found, or whose vertices are not whole rows of nx, or that has fewer than two rows or two columns, is
    // not read. drawnAt gives the highest of the read meshes' surfaces at x, z. For each mesh: the two neighbouring columns whose x hold
    // x between them, found by halving the columns between the first and the last; then the two neighbouring rows whose edges across
    // that strip (a to b and c to d, each taken at x) hold z between them, found by halving the rows between the first and the last;
    // then the height on a b c if the point lies on a's side of b to c and a b c has area in plan, else on b d c if that has area in
    // plan. The mesh lies under no point there if x is outside its first row's x, if its first and last row edges at x do not hold z
    // between them, if a halving has not closed on two neighbours after 40 passes (each pass halves the gap, so a grid of fewer than
    // 2 to the 40th columns and rows closes), or if neither of those two heights can be taken. drawnAt gives -Infinity where no read
    // mesh lies under the point, and there groundAt (the ground the forest is planted on) is the height.
    // SHEET_MARGIN is a typed 2.3 m: the kit's own lift of the sheet (0.12 m) and 2.18 m more, so that a disc which the kit's grid lays
    // across a hollow of unbroken ground stays. (The kit sets each vertex on the ground and raises it by the lift and by 1.3 times the
    // greatest amount by which the ground at the middle of a grid edge, or of a cell's diagonal p to p + n + 2, that ends at that vertex
    // stands over the mean of that edge's or diagonal's two ends; by the lift alone where it nowhere stands over.) A disc goes only where
    // a tried point stands more than the margin over the ground as drawn, as it does across a step of that ground that is high enough.
    // The walk takes one pass for each disc and never more passes than the mesh has vertices; if a disc does not fit (n under 2, or its
    // vertices or its indices running past the mesh's own), the walk stops there, and then, or if vertices or indices are left over
    // after the last disc, or if no disc is left out, the mesh stays as the kit made it. The page is asked for (ctx.yield) before the
    // three meshes are read and after each disc that fits.
    const SHEET_MARGIN = 2.3, SHEET_STEP = 1;
    await ctx.yield();
    { const sg = forest.shadow.object.geometry, sp = sg.attributes.position.array, su = sg.attributes.uv.array, si = sg.index.array, nv = sp.length / 3, kept = [], grounds = [];
      for (const name of ['fcr-land', 'fcr-upper-bed', 'fcr-bed']) {
        const o = scene.getObjectByName(name), q = o ? o.geometry.attributes.position.array : null, nq = q ? q.length / 3 : 0;
        let nx = 1; while (nx < nq && q[nx * 3] > q[nx * 3 - 3]) nx++;
        if (nx >= 2 && nq % nx === 0 && nq / nx >= 2) grounds.push({ q, nx, nz: nq / nx });
      }
      const drawnAt = (x, z) => {
        let top = -Infinity;
        for (const G of grounds) {
          const q = G.q, nx = G.nx;
          if (x < q[0] || x > q[nx * 3 - 3]) continue;
          let i = 0, i1 = nx - 1; for (let h = 0; h < 40 && i1 - i > 1; h++) { const im = (i + i1) >> 1; if (q[im * 3] <= x) i = im; else i1 = im; }
          if (i1 - i > 1) continue;
          // f: how far x lies from column i to column i + 1; s0, s1: the first and the last row's edge at x, less z
          const f = (x - q[i * 3]) / (q[i * 3 + 3] - q[i * 3]), k0 = i * 3 + 2, kn = ((G.nz - 1) * nx + i) * 3 + 2, s0 = q[k0] + (q[k0 + 3] - q[k0]) * f - z, s1 = q[kn] + (q[kn + 3] - q[kn]) * f - z;
          if (s0 * s1 > 0) continue;
          // row j stays on the first row's side of z (or is the first row), row j1 does not
          let j = 0, j1 = G.nz - 1; for (let h = 0; h < 40 && j1 - j > 1; h++) { const jm = (j + j1) >> 1, km = (jm * nx + i) * 3 + 2; if ((q[km] + (q[km + 3] - q[km]) * f - z) * s0 > 0) j = jm; else j1 = jm; }
          if (j1 - j > 1) continue;
          // a at ka, b at ka + 3, c at kc, d at kc + 3 (c has a's x, d has b's); cut: the point's place across b to c, equal to da at a and to dd at d
          const ka = (j * nx + i) * 3, kc = ka + nx * 3, ax = q[ka], bx = q[ka + 3], az = q[ka + 2], bz = q[ka + 5], cz = q[kc + 2], dz = q[kc + 5];
          const cut = (bz - cz) * (x - ax) + (ax - bx) * (z - cz), da = (ax - bx) * (az - cz), dd = (ax - bx) * (dz - bz);
          let y;
          if (da !== 0 && cut / da >= 0) y = (cut / da) * q[ka + 1] + f * q[ka + 4] + (1 - cut / da - f) * q[kc + 1];
          else if (dd !== 0) y = (cut / dd) * q[kc + 4] + (f - cut / dd) * q[ka + 4] + (1 - f) * q[kc + 1];
          else continue;
          if (y > top) top = y;
        }
        return top;
      };
      let b = 0, io = 0, fits = true;
      for (let pass = 0; b < nv && pass < nv; pass++) {
        let m = 0; while (b + m < nv && su[(b + m) * 2] === -1) m++;
        const n = m - 1;
        if (n < 2 || b + m * m > nv || io + 6 * n * n > si.length) { fits = false; break; }
        const b3 = b * 3, ki = Math.max(1, Math.ceil(Math.hypot(sp[b3 + m * 3] - sp[b3], sp[b3 + m * 3 + 2] - sp[b3 + 2]) / SHEET_STEP)), kj = Math.max(1, Math.ceil(Math.hypot(sp[b3 + 3] - sp[b3], sp[b3 + 5] - sp[b3 + 2]) / SHEET_STEP));
        let lies = true;
        for (let I = 0; I <= n * ki && lies; I++) for (let J = 0; J <= n * kj; J++) {
          const i = Math.min(n - 1, Math.floor(I / ki)), j = Math.min(n - 1, Math.floor(J / kj)), a = I / ki - i, c = J / kj - j;
          // the cell's four vertices: p0 at (i, j), pj at (i, j + 1), pi at (i + 1, j), pd at (i + 1, j + 1); their weights on the triangle the point falls in
          const p0 = (b + i * m + j) * 3, pj = p0 + 3, pi = p0 + m * 3, pd = pi + 3, wd = Math.min(a, c), wj = Math.max(0, c - a), wi = Math.max(0, a - c), w0 = 1 - wd - wj - wi;
          const x = sp[p0] * w0 + sp[pj] * wj + sp[pi] * wi + sp[pd] * wd, z = sp[p0 + 2] * w0 + sp[pj + 2] * wj + sp[pi + 2] * wi + sp[pd + 2] * wd, h = drawnAt(x, z);
          if (sp[p0 + 1] * w0 + sp[pj + 1] * wj + sp[pi + 1] * wi + sp[pd + 1] * wd - (h > -Infinity ? h : groundAt(x, z)) > SHEET_MARGIN) { lies = false; break; }
        }
        if (lies) for (let k = 0; k < 6 * n * n; k++) kept.push(si[io + k]);
        b += m * m; io += 6 * n * n;
        await ctx.yield();
      }
      if (fits && b === nv && io === si.length && kept.length < si.length) sg.setIndex(new THREE.BufferAttribute(new si.constructor(kept), 1));
    }
    await ctx.yield();
    const belts = [], beltLod = [];
    { // FOREST CROWNS: the belt behind each scarp, the wall behind the buttresses, the canopy along the rims, clumps on the savanna.
      // Every crown is a broad flattened dome of small leaf masses (one crowning, a ring of shoulders, a skirt), each mass noise-lumped,
      // dark where it faces into the crown, on a bole with limbs forking up into it. The crown shader tears every outline to leaf scale.
      const canopyGeo = (seed, nl, sub, trunk, limbs) => {
        const q = ctx.core.makeRng('fcr-canopy:' + seed), ico = new THREE.IcosahedronGeometry(1, sub), ip = ico.attributes.position;
        const pos = [], nor = [], dom = [], col = [], wnd = [], LB = [[0, 0.34, 0, 0.52]];
        for (let k = 1; k < nl; k++) {
          const t = (k - 1) / Math.max(1, nl - 2), a = k * 2.39996 + seed, rad = lerp(0.36, 0.7, Math.sqrt(t)) + q.range(-0.05, 0.05), r = lerp(0.46, 0.33, t) * q.range(0.88, 1.14);
          LB.push([Math.cos(a) * rad, 0.3 * (1 - rad * rad * 1.6) + q.range(-0.07, 0.07), Math.sin(a) * rad, r]);
        }
        for (const [ox, oy, oz, r] of LB) {
          const ol = Math.hypot(ox, oy + 0.45, oz) || 1, ux = ox / ol, uy = (oy + 0.45) / ol, uz = oz / ol;      // the way this mass faces out of the crown
          for (let i = 0; i < ip.count; i++) {
            const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i);
            const lump = 0.5 + 0.5 * NZ.n3(x * 1.7 + seed + ox * 5, y * 1.7 + oy * 5, z * 1.7 + oz * 5), k = r * (0.8 + 0.4 * lump + 0.1 * NZ.n3(x * 4.2, y * 4.2 + seed, z * 4.2 + ox * 9));
            const px = ox + x * k, py = oy + (y < 0 ? y * 0.55 : y * 0.92) * k, pz = oz + z * k, dl = Math.hypot(px, py + 0.5, pz) || 1;
            const ao = (0.42 + 0.58 * smoothstep(-0.7, 0.45, x * ux + y * uy + z * uz)) * (0.7 + 0.3 * smoothstep(-0.1, 0.7, py)) * (0.78 + 0.4 * lump);
            pos.push(px, py, pz); nor.push(x, y, z); dom.push(px / dl, (py + 0.5) / dl, pz / dl);
            col.push(0.075 * ao, 0.168 * ao, 0.052 * ao); wnd.push(0.32 * Math.max(0, py + 0.3), 0.5 + 0.5 * lump, 1, 0);
          }
        }
        const wood = (ax, ay, az, bx, by, bz, r0, r1, sides) => {            // a tapered bole or limb
          const dx = bx - ax, dy = by - ay, dz = bz - az, l = Math.hypot(dx, dy, dz) || 1; let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz);
          if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
          const tx = (dy * sz) / l, ty = (dz * sx - dx * sz) / l, tz = (-dy * sx) / l;
          const ring = (cx, cy, cz, r, a) => { const c = Math.cos(a), s = Math.sin(a), nx = sx * c + tx * s, ny = ty * s, nz = sz * c + tz * s; return [cx + nx * r, cy + ny * r, cz + nz * r, nx, ny, nz]; };
          for (let k = 0; k < sides; k++) {
            const a0 = (k / sides) * 6.2832, a1 = ((k + 1) / sides) * 6.2832, A0 = ring(ax, ay, az, r0, a0), A1 = ring(ax, ay, az, r0, a1), B0 = ring(bx, by, bz, r1, a0), B1 = ring(bx, by, bz, r1, a1);
            for (const v of [A0, A1, B1, A0, B1, B0]) { pos.push(v[0], v[1], v[2]); nor.push(v[3], v[4], v[5]); dom.push(v[3], v[4], v[5]); col.push(0.115, 0.09, 0.066); wnd.push(0.32 * Math.max(0, v[1] + 0.3), 0, 0, 0); }
          }
        };
        if (trunk) {
          wood(0.05, trunk, 0, 0, -0.1, 0, 0.085, 0.06, 5);
          for (let k = 0; k < limbs; k++) { const lb = LB[1 + Math.floor((k + 0.5) * (nl - 1) / limbs)]; wood(0, -0.22, 0, lb[0] * 0.8, lb[1] - 0.04, lb[2] * 0.8, 0.045, 0.022, 3); }
        }
        ico.dispose();
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aDome', new THREE.Float32BufferAttribute(dom, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(wnd, 4));
        return g;
      };
      // leaf in the open takes far more sky than the river's bed does, and at a low sun the canopy must not sink to black
      const cFill = U.uSky.value.clone().multiplyScalar(hour === 'morning' ? 1.15 : hour === 'golden' ? 2.3 : 2.1).add(hour === 'golden' ? V3(0.07, 0.05, 0.03) : hour === 'dawn' ? V3(0.05, 0.035, 0.04) : V3(0, 0, 0));
      const crownMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr, uCFill: { value: cFill }, uCK: { value: new THREE.Vector4(1.15, hour === 'morning' ? 1 : 1.9, hour === 'morning' ? 0.5 : 1.5, 0.6) } },
        fog: true, vertexColors: true, side: THREE.DoubleSide, vertexShader: VERT_CROWN, fragmentShader: FH + FRAG_CROWN });
      const cr = R.fork('crowns'), wallM = [], wallN = [], farM = [];
      const crown = (x, z, into) => {
        const tree = into !== farM, s = tree ? cr.range(3.8, 6.4) : cr.range(5, 9.5), sy = s * cr.range(0.85, 1.15), y = groundAt(x, z);
        M4.compose(tp.set(x, tree ? y + 1.25 * sy : y + s * 0.5 + 1.2, z), Q4.setFromEuler(E4.set(0, cr.range(0, 6.3), 0)), sc.set(s * 1.12, sy, s * 1.12)); into.push(M4.clone()); };
      const nWall = Math.round(90 * (0.6 + 0.4 * detail)), nFar = Math.round(140 * (0.6 + 0.4 * detail));
      for (let k = 0; k < nWall; k++) { const sg = cr.sign(), x = sg * (27 + 270 * Math.pow(cr(), 1.6)), z = cr.range(-480, -238) + Math.abs(x) * 0.15; crown(x, z, Math.abs(x) < 78 ? wallN : wallM); }   // (those beside the gate are passed close: whole trees)
      for (let k = 0, tries = 0; k < nFar && tries < 4000; tries++) {
        const z = cr.range(-520, 560), x = cr.sign() * cr.range(95, 700);
        if (NZ.n2(x * 0.0055 + 3, z * 0.0055) < 0.02 && cr() > 0.12) continue;
        if (k % 3) { k++; continue; }                                        // only a few clumps out on the savanna: the trees stand in the belt
        crown(x, z, farM); k++;
      }
      // THE GALLERY FOREST of the lower river: four ranks behind each scarp from the slab down past the pool, overlapping into one
      // canopy 15-20 m tall. The front rank is whole trees (nine masses each, bole and limbs); the ranks behind show their domes over
      // it; a few emergents stand a crown higher and, with the moriches, break the top line.
      const beltF = [], beltB = [], bc = ctx.core.makeRng('fcr-belt:' + ctx.seed);
      for (const sg of [-1, 1]) for (let z = -56; z > -226; z -= 5.4) {
        riverEdge(z, eo); bankAt(z); const k2 = sg < 0 ? 0 : 1, foot = (sg < 0 ? eo[0] : eo[1]) + sg * Math.max(BK.d[k2] + 10, 33);
        for (let row = 0; row < 4; row++) {
          const x = foot + sg * (row * 7.6 + bc.range(-2.2, 2.2)), zz = z + bc.range(-2.5, 2.5), em = bc() < 0.09 ? 1 : 0, gap = bc();
          if (gap < (row ? 0.1 : 0.16)) continue;
          const front = !row || em, s1 = em ? bc.range(6.2, 7.2) : row ? bc.range(5, 7.2) : bc.range(4.6, 6.2);
          const y = groundAt(x, zz) + (em ? 15 + 1.2 * row : row ? 8.6 + 1.5 * row : 6.4 + 0.6 * s1) + bc.range(-1.3, 1.3);
          M4.compose(tp.set(x, y, zz), Q4.setFromEuler(E4.set(0, bc.range(0, 6.3), 0)), sc.set(s1, s1 * bc.range(0.78, 1.0), s1)); (front ? beltF : beltB).push(M4.clone());
        }
      }
      const rimM = [];
      for (let k = 0, nRim = Math.round(26 * (0.6 + 0.4 * detail)); k < nRim; k++) {     // the canopy behind the trees that stand along both rims
        const z = xr.range(-205, 224), k2 = xr.chance(0.5) ? 1 : 0; riverEdge(z, eo); bankAt(z);
        const back = BK.d[k2] + 46 + 40 * Math.pow(xr(), 1.4), x = k2 ? eo[1] + back : eo[0] - back; if (BK.h[k2] < 2.2 || z > zFront(x) - 2) continue;
        crown(x, z, rimM);
      }
      await ctx.yield();
      const kc = new THREE.Color();
      const nearGeo = canopyGeo(3.1, 9, 1, -3.4, 4);
      await ctx.yield();
      const nearLo = canopyGeo(3.1, 9, 0, -3.4, 4);                          // the same tree in fewer facets, for the front rank while it is still far off
      const midGeo = canopyGeo(8.4, 6, 0, -1.9, 0), farGeo = canopyGeo(5.7, 6, 0, 0, 0);
      await ctx.yield();
      const crownMesh = (geo, list) => { const im = new THREE.InstancedMesh(geo, crownMat, list.length);
        list.forEach((e, k) => { im.setMatrixAt(k, e[0]); im.setColorAt(k, kc.setRGB(e[1], e[2], e[3])); });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.name = 'fcr-far-crowns'; scene.add(im); return im; };
      [[wallM, midGeo, 1.25], [wallN, nearGeo, 1.3], [farM, farGeo, 1.05], [rimM, midGeo, 1.5], [beltF, nearGeo, 1.6], [beltB, midGeo, 1.3]].forEach(([mats, geo, gain]) => {
        if (!mats.length) return;                                            // the rim canopy and the belt's front rank stand nearer: a lighter, sunnier green
        const list = mats.map((m) => { const b = cr.range(0.7, 1.15) * gain, r1 = b * cr.range(0.8, 1.3), b1 = b * cr.range(0.7, 1.1); return [m, r1, b, b1]; });
        if (mats === beltF || mats === wallN) {
          // the near trees twice, in stretches of the river: full detail for a stretch while its middle is within 80 m of the eye's z,
          // up the river or down (the wall trees by the gate: 118 m), the light copy of the same trees beyond
          const nCh = mats === beltF ? 6 : 1, parts = Array.from({ length: nCh }, () => []);
          for (const e of list) parts[nCh > 1 ? clamp(Math.floor((-53 - e[0].elements[14]) / 29.2), 0, nCh - 1) : 0].push(e);
          parts.forEach((part, ci) => { if (!part.length) return; beltLod.push([crownMesh(nearGeo, part), crownMesh(nearLo, part), mats === beltF ? 165 : 1e9, nCh > 1 ? -67.6 - 29.2 * ci : -262, nCh > 1 ? 80 : 118]); });
          return;
        }
        const im = crownMesh(geo, list); if (mats === beltB) belts.push(im);
      });
    }
    await ctx.yield();
    // vellozia: knee-high tufted shrubs with white flowers on the bare pavement
    const bushV = [0, 1, 2].map(() => flora.bushGeometry({ rng: pr, detail: 0, size: pr.range(0.9, 1.4), flowers: 0.7, flowerColor: '#ffffff', leaf: '#4f7a3a', leafLight: '#9ab85a' }));
    await ctx.yield();
    const scrub = flora.makeBushes({ rng: R.fork('scrub'), path, heightAt: groundAt, material: leafMat, variants: bushV, count: Math.round(62 * density), radius: 72, corridor: 10, spacing: 1.5, scale: [0.7, 1.5], chunks: 3,
      density: (x, z) => { natural(x, z); const d = -info.dE; return onTop(x, z) ? (Math.abs(x) > 12.5 ? 0.8 : 0) : info.plat > 0.99 ? (d - BK.d[x < 0 ? 0 : 1] < 9 ? 1 : 0) : info.plat > 0.01 ? 0 : smoothstep(5, 10, d); } });
    scene.add(scrub.object);
    await ctx.yield();
    const velloz = [];                                                   // [mesh, z of its stretch, its reach]: knee-high shrubs are not drawn beyond 140 m of z (the staircase's banks are one stretch, 177 m long: seen whole from the line beside the falls; down the flank no stretch up the river is let go)
    { // vellozia on the bare black pavement beside the river, every few metres, in white flower
      const vg = [velloziaGeometry(pr.fork('v1'), 1), velloziaGeometry(pr.fork('v2'), 2), velloziaGeometry(pr.fork('v3'), 1)], vr = R.fork('vellozia'), NCH = 5, lists = [];
      for (let i = 0; i < NCH * 3; i++) lists.push([]);
      const want = Math.round(400 * Math.min(density, 1.05) * (0.6 + 0.4 * detail)), vc = new THREE.Color();
      for (let n = 0, tries = 0; n < want && tries < want * 12; tries++) {
        if ((tries & 127) === 127) await ctx.yield();
        const z = vr.range(-212, 230), sg = vr.sign(), d = 1.3 + 16 * Math.pow(vr(), 1.5); riverEdge(z, eo);
        const x = sg < 0 ? eo[0] - d : eo[1] + d;
        if (onTop(x, z) || NZ.n2(x * 0.09 + 40, z * 0.09) < -0.3 && vr() > 0.15) continue;
        if (path.nearestXZ(x, z).dist < 5.5) continue;
        natural(x, z); if (info.plat > 0.01) continue;                       // the shelf only: not in the scarp, nor up on the plateau where nobody sees them
        const y = groundAt(x, z), s1 = vr.range(1.3, 2.3), v = vr() < 0.3 ? 1 : vr() < 0.5 ? 2 : 0, ch = clamp(Math.floor((230 - z) / 442 * NCH), 0, NCH - 2);
        E4.set(vr.range(-0.12, 0.12), vr.range(0, 6.283), vr.range(-0.12, 0.12)); M4.compose(tp.set(x, y, z), Q4.setFromEuler(E4), sc.set(s1, s1 * vr.range(0.85, 1.2), s1));
        const tone = vr.range(0.75, 1.2); n++; if (route.beside(x, z) < FLK.air + 0.9) continue;   // (dealt and counted as every other, and not planted: the flank's air)
        lists[ch * 3 + v].push(M4.clone(), tone);
      }
      lists.forEach((ls, i) => { if (!ls.length) return; const im = new THREE.InstancedMesh(vg[i % 3], plantMat, ls.length / 2);
        for (let k = 0; k < ls.length; k += 2) { im.setMatrixAt(k / 2, ls[k]); im.setColorAt(k / 2, vc.setRGB(ls[k + 1], ls[k + 1], ls[k + 1])); }
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); im.name = 'fcr-vellozia'; scene.add(im);
        const c = Math.floor(i / 3), two = c === NCH - 2; velloz.push([im, 230 - (c + (two ? 1 : 0.5)) * 88.4, two ? 184.2 : 140]); });
    }
    await ctx.yield();
    const gA = new THREE.Color(LOOK.grassA), gB = new THREE.Color(LOOK.grassB), gcol = new THREE.Color();
    const grass = await flora.makeGrassAsync({ rng: R.fork('grass'), path, heightAt: groundAt, wind, map: leafMat.map, count: Math.round(5000 * detail), radius: 80, bias: 1.15, width: [1.0, 1.7], height: [0.5, 1.1], chunks: 4, fade: [120, 160], flowers: 0.03,
      density: (x, z) => { natural(x, z); const d = -info.dE; if (onTop(x, z)) return Math.abs(x) > 12.5 ? 0.9 : 0; if (info.plat > 0.985) return d - BK.d[x < 0 ? 0 : 1] < 13 ? 1 : 0.12;
        return info.plat > 0.01 || d < 2 ? 0 : 0.25 + 0.75 * smoothstep(-0.1, 0.35, NZ.n2(x * 0.07 + 7, z * 0.07)); },
      groundColor: (x, z) => gcol.copy(gA).lerp(gB, smoothstep(-0.3, 0.4, NZ.fbm2(x * 0.02, z * 0.02, 2))).multiplyScalar(0.62) }, ctx.yield);
    scene.add(grass.object);
    await ctx.yield();
    // THE FLANK'S AIR. The kit deals its tufts and bushes by the middle line; those it has stood within FLK.air and a tuft's own
    // half width of the line where it goes down the flank are brought to no size where they stand (no draw, nothing else moved).
    for (const m of [...(grass.meshes || []), ...(scrub.meshes || [])]) { let hit = false;
      for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M4); const e = M4.elements; if (route.beside(e[12], e[14]) >= FLK.air + 1.5) continue;
        const x = e[12], y = e[13], z = e[14]; M4.makeScale(0, 0, 0).setPosition(x, y, z); m.setMatrixAt(i, M4); hit = true; }
      if (hit) m.instanceMatrix.needsUpdate = true; await ctx.yield(); }

    // ---------- wildlife ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), fr = R.fork('fauna');
    await ctx.yield();
    const macawCol = blueMacaws ? { body: '#1c6fd0', belly: '#f2c230', wingC: '#1a5fc0', trail: '#1648a0', tip: '#0f2f78', head: '#2a8ae0', tailC: '#1a58b8', beak: '#1a1a1a' }
      : { body: '#d81e2c', belly: '#e8302c', wingC: '#f0c020', trail: '#1c50c8', tip: '#143a9c', head: '#e02828', tailC: '#c81c28', beak: '#f2ead8' };
    // THE BIRDS KEEP CLEAR OF OUR LINE. Each of the four flocks below is handed keepClear (keep: our path; dist = CLEAR + MARGIN; up,
    // so that no push goes downward; step, the metres between the points the path is taken at: 2 for the macaws, 4 for the escort,
    // 3 for the two circling flocks, and the kit adds to dist what the path can bulge off those points) and maxSigma 3. keepBy(z, r)
    // is keep for a flock that stays within r metres of z down the river: the path is taken from uAtZ(z + r) to uAtZ(z - r) only
    // (r is 100 about the macaws' crossing, whose course is 130 m long, and 120 about each circle's centre, whose birds are dealt
    // up to 54 m along x and along z from a course of radius 26 or 15). spread [a, b, c]: the kit
    // deals a bird's place off the course on bell curves of sigma 0.45 * a along x and along z and 0.45 * b in height, and sets
    // the bird up to c metres behind along the course. With maxSigma the kit holds every bell-curve draw of a dealt place within three
    // sigma either side, at the bound, drawing no more and no fewer numbers. With keepClear and each (handed to all four) the kit,
    // after its deal and with no draw, leaves the course where it laid it and moves every member that (at its dealt offset, with
    // its wander at its furthest and its body) would come within dist of any point of the path taken, anywhere along its course
    // and, on an open course, along the stretch it is shown on before the course's start: the member is moved by its own dealt
    // offset, by what it lacks, away from the path (one that the path pulls both ways, straight up), and every other member stays
    // as dealt. The flock's `kept` says how many members moved, the greatest move of one and, as `short`, what any member lacks
    // after that (0: clear).
    const CLEAR = 2, MARGIN = 0.1, keep = { path: route, dist: CLEAR + MARGIN, up: true }, keepBy = (z, r) => ({ ...keep, from: uAtZ(z + r), to: uAtZ(z - r) });
    // (THE FLOCK OVER THE SHALLOWS IS CLEARED OF THE MIDDLE LINE. The kit's clearing is a sum over the whole stretch of line handed to it,
    // and that flock's stretch reaches down to z 45, onto the route's rise, which none of its birds can come within 25 m of: it is
    // kept clear of the middle line's own stretch, keepMid, which above the rise is the route itself, point for point.
    // The escort flies the whole river and is cleared of the whole route.)
    const keepMid = (z, r) => ({ ...keep, path, from: uAtZ(z + r), to: uAtZ(z - r) });
    // (round 27) THE MACAWS COME BY NEAR. Strangers saw "a small distant line": the old course crossed our line 1.9 m over it, where a
    // macaw (a body of two metres by the kit's measure, a roam of one) lacks three, so the kit lifted and scattered all of them, up
    // to 12 m. The course now clears the line by itself and is laid in the world's own z and in metres of route:
    //   C, the place where they cross our line: the route's point at z = MAC.z (40: the foot of the S-swing's leftward leg), and
    //   MAC.h (5.3 m) over it: a macaw's own need (dist 2.1 + roam + body, 4.9 to 5.2 m) is kept as dealt, so the flock stays one group;
    //   the course is straight and level through C, MAC.turn (11 degrees) to the left of the way we come down that leg (the chord
    //   of the route from 26 m to 4 m short of C): they come up on our right from behind, a wing's length higher than the eye;
    //   the lead bird is over C when we are MAC.lead (14 m) short of it, and they fly MAC.gain (1.28 m) for each metre we fly: so
    //   they are abreast on the right, 9 to 11 m off and 2 m over the middle line, when we are 34 m short of C, draw ahead, cross
    //   our line 13 to 15 m ahead and 4 m over the middle line, and go away to the left. (speed = gain x the route's length / the
    //   flight's seconds, which is the kit's own law of a crossing; no clock.) THE EYE IS ON THE ONE RISE THERE, which ends at C:
    //   it stands up to 0.6 m over the middle line when they are abreast and about 2.5 m over it when they cross, so to the eye
    //   they are 1.4 to 2 m over its own level abreast and about 1.5 m over it as they cross, 13 to 15 m ahead.
    // keepBy is given C's z; the blue dozen's spread is [4.6, 0.64, 3.2], the two scarlet pairs' [3.4, 0.6, 2.4]. keepClear is
    // handed each, so any macaw whose own dealt place lacks room rises by what it lacks. nearFade: the kit shrinks a bird to
    // nothing between two distances of its middle from the lens; the farther is set to keep.dist, which a bird's middle cannot
    // reach while the flock is kept clear, and the nearer stands to it as 0.8 to 2.2, the proportion of the kit's own pair.
    const MAC = { z: 40, h: 5.3, turn: 11, lead: 14, gain: 1.28 };
    { let d = 0; const q = V3(); while (d < path.length && path.posAtDist(d, q).z > MAC.z) d += 0.25;
      MAC.d = d; const a = path.posAtDist(d - 26, V3()), b = path.posAtDist(d - 4, V3()), t = path.tangentAtDist(d, V3());
      MAC.angle = (Math.atan2(t.x, -t.z) - Math.atan2(b.x - a.x, -(b.z - a.z))) * 180 / Math.PI + MAC.turn; }   // (the kit turns the course from the route's own heading at C)
    const macaws = F.makeFlock({ rng: fr.fork('macaw'), species: 'parrots', count: blueMacaws ? 12 : 4, size: 2.7, len: 0.56, girth: 0.058, tail: 0.62, span: 0.56, speed: MAC.gain * path.length / DUR, flap: 3.8,
      spread: blueMacaws ? [4.6, 0.64, 3.2] : [3.4, 0.6, 2.4], wander: [0.5, 0.3, 0.5, 0.5], ...macawCol, maxSigma: 3, keepClear: { ...keepBy(path.posAtDist(MAC.d, V3()).z, 100), step: 2, each: true }, nearFade: [keep.dist * 0.8 / 2.2, keep.dist],
      cross: { path, u: (MAC.d - MAC.lead) / path.length, lead: MAC.lead, angle: MAC.angle, side: -1, height: MAC.h, span: 130, bow: 0, duration: DUR } });
    fauna.add(macaws, { always: true });
    await ctx.yield();
    const swCol = { body: '#1f4a5a', belly: '#f4f4ee', wingC: '#e4ecf0', trail: '#16323e', tip: '#101c24', head: '#1f4a5a' };
    // (the escort's course is laid by the kit 1.5 m to the right of the path and 1.3 m over it and is flown 26 m ahead of us,
    // 9 m more and less as the kit's drift swings (side: 1.5, up: 1.3, lead: 26, drift: 9); keepClear is handed each. Its wander,
    // [1.5, 0.5, 1.5, 0.7], is a box of 2.25 m sideways, 0.5 m up and down and 1.5 m along about each bird's place. It is cleared of
    // the whole route, the longest clearing of the build: the kit's stepped maker hands the page back between its slices)
    fauna.add(await F.makeFlockAsync({ rng: fr.fork('sw1'), species: 'swifts', count: 8, size: 2.0, ...swCol, spread: [9, 1.6, 14], wander: [1.5, 0.5, 1.5, 0.7], maxSigma: 3, keepClear: { ...keep, step: 4, each: true },
      along: { path, side: 1.5, up: 1.3, lead: 26, from: -0.02, to: 1.06, drift: 9 } }, ctx.yield), { always: true });
    await ctx.yield();
    // (the two circling flocks are handed the wander [3, 1, 3, 0.7], of which the kit makes a box of 4.5 m sideways, 1 m up and
    // down and 3 m along about each bird's place. Both have the kit's own spread for swifts, [40, 16, 40], and the keepClear of
    // both is handed each)
    fauna.add(F.makeFlock({ rng: fr.fork('sw2'), species: 'swifts', count: 6, size: 2.0, ...swCol, wander: [3, 1, 3, 0.7], maxSigma: 3, keepClear: { ...keepMid(165, 120), step: 3, each: true }, center: [-6, WY + 3.5, 165], radius: 26, height: 2.5 }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr.fork('sw3'), species: 'swifts', count: 6, size: 2.0, ...swCol, wander: [3, 1, 3, 0.7], maxSigma: 3, keepClear: { ...keepBy(-205, 120), step: 3, each: true }, center: [0, POOL + 9.5, -205], radius: 15, height: 3 }));
    await ctx.yield();
    // the cocoi heron wades in the shallows across the river from the flight line (the right: we fly the left of the sand reach),
    // 13 m out from that bank and 60 m above the ledge, where the water is a hand to a forearm deep (stepping toward the bank until
    // it is): tall and pale against the dark foot of the scarp
    const HERON = [0, WY, AN.ledge.z + 60];
    { riverEdge(HERON[2], eo); HERON[0] = eo[1] - 13;
      for (let k = 0; k < 16; k++) { const d = WY - natural(HERON[0], HERON[2]); if (d > 0.1 && d < 0.3 && info.dE > 1) break; HERON[0] += 0.5; } }
    fauna.add(F.makeWaders({ rng: fr.fork('heron'), species: 'heron', count: 1, positions: [HERON], level: WY, depth: 0.22, heightAt: groundAt, size: 3.2, facing: 1.2, scatterYaw: 0.3,
      body: '#8a95a3', belly: '#1c1f26', neckC: '#f0f0ea', cap: '#0a0a0e', wing: '#687380' }), { always: true });
    await ctx.yield();
    // THE INSECTS KEEP CLEAR OF OUR LINE. standOff(f) takes a flock of insects as the kit dealt it and, with no draw, moves anchors and
    // may shorten the roam; it gives back the share k of the roam that is kept. An insect flies about its anchor within the kit's reach:
    // roam (three half-extents, whose diagonal is taken as the farthest it gets from the anchor) and body. `line` is the path as a
    // point every half metre and line.sag what the path can bulge off it. need = k * diagonal + body + CLEAR + MARGIN + line.sag.
    // Every anchor nearer `line` than need is moved level, straight away from the nearest point of `line`, to need from that point,
    // and tried again, since the nearest point may have changed: at most 8 moves an anchor, and an anchor short after them stays where
    // the last move put it (one within a millimetre, in plan, of the nearest point has no level way out and is left where it is).
    // An anchor has room when the four plan corners of the box of its flight (k * roam[0] + body either way) are free: a corner above
    // z = Z_MOUTH + 1, where the slot's walls and their quarter-turn ends stand, when it is within HALF - 0.5 of x = 0; a corner
    // below that z, when it is on no scarp (natural's info.plat is 0). k is 1 where every anchor has room; else the largest share
    // that ten halvings between 0.5 and 1 find to give every anchor room; and 0.5 where even that leaves one without. The kit's roam
    // is in proportion to its uniforms uRoam.x, uRoam.y, uRoam.w and uBounce, so those four are multiplied by k; the anchors go to
    // the kit's setAnchors.
    const line = F.pathLine(path, { step: 0.5 }), nearQ = V3();
    const standOff = (f) => {
      const n = f.count, re = f.reach, diag = re.radius - re.body, an = f.anchors, pos = new Float32Array(n * 3), ur = f.uniforms.uRoam.value;
      const place = (k) => { const need = k * diag + re.body + CLEAR + MARGIN + line.sag, e = k * re.roam[0] + re.body; let room = true;
        for (let i = 0; i < n; i++) { let x = an[i * 3], z = an[i * 3 + 2]; const y = an[i * 3 + 1];
          for (let p = 0; p < 8 && F.lineDist(line, x, y, z, nearQ) < need; p++) { const vx = x - nearQ.x, vz = z - nearQ.z, l = Math.hypot(vx, vz), t = Math.sqrt(Math.max(0, need * need - (y - nearQ.y) ** 2)) + 0.001;
            if (l < 1e-3) break; x = nearQ.x + vx / l * t; z = nearQ.z + vz / l * t; }
          pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
          for (let c = 0; c < 4; c++) { const cx = x + (c & 1 ? e : -e), cz = z + (c & 2 ? e : -e); if (cz > Z_MOUTH + 1 ? Math.abs(cx) > HALF - 0.5 : (natural(cx, cz), info.plat > 0)) room = false; } }
        return room; };
      let k = 1;
      if (!place(1)) { let hi = 1; k = 0.5; if (place(0.5)) for (let h = 0; h < 10; h++) { const mid = (k + hi) / 2; if (place(mid)) k = mid; else hi = mid; } place(k); }
      ur.x *= k; ur.y *= k; ur.w *= k; f.uniforms.uBounce.value *= k; f.setAnchors(pos);
      return k;
    };
    const morphos = F.makeButterflies({ rng: fr.fork('morpho'), path, uFrom: 0.03, uTo: 0.16, count: 3, size: 3.2, varieties: [['#1466e0', '#52b8ff'], ['#1f7cf0', '#9ad8ff']], spread: 5, clear: 2.2, lift: [-0.3, 3], maxSigma: 3 });
    standOff(morphos); fauna.add(morphos);
    await ctx.yield();
    const dragons = F.makeDragonflies({ rng: fr.fork('dragon'), path, uFrom: uAtZ(228), uTo: uAtZ(122), count: Math.round(16 * density), size: 2.2, spread: 12, clear: 2, lift: [-0.7, 0.9], maxSigma: 3 });
    standOff(dragons); fauna.add(dragons);
    await ctx.yield();
    // small silver characins hold in eight potholes: the eight sandy wells nearest the flight line (the brief: six in each of eight)
    { const fw = AN.wells.filter((w) => w.sandy).map((w) => ({ w, d: path.nearestXZ(w.x, w.z).dist })).sort((a, b) => a.d - b.d).slice(0, 8);
      for (let i = 0; i < fw.length; i++) { const w = fw[i].w, big = w.radius > 3.9;         // (the widest well holds a shoal big enough to read from the reveal)
        fauna.add(F.makeFishSchool({ rng: fr.fork('fish' + i), species: 'mackerel', form: 'pond', top: '#3c4636', belly: '#aeb8b2', fin: '#59604e', spec: 0.25, count: big ? 14 : 6, size: big ? 0.8 : 0.6, speed: 0.5, center: [w.x, w.waterY - (big ? 0.6 : 0.75), w.z], spread: [w.radius * 0.55, 0.3], light: 'day' }), { range: big ? 110 : 70 });
        if (i & 1) await ctx.yield(); } }
    await ctx.yield();
    // ... and shoals of them all down the upper river: one every 19 m of the flight line from the entry to the shelf, to its left and
    // its right by turns, wherever the bed there is sand or shoal under a hand to a forearm and a half of water (bigger fish in the slot)
    { const pf = V3(), tf = V3(); let n = 0;
      for (let d = 9; d < path.length; d += 19) {
        path.posAtDist(d, pf); if (pf.z < AN.ledge.z + 29) break;
        path.tangentAtDist(d, tf).setY(0).normalize(); const side = (n & 1 ? 1 : -1) * (pf.z > Z_MOUTH ? 0.4 : 1.5), x = pf.x - tf.z * side, z = pf.z + tf.x * side, dep = WY - natural(x, z);
        if (dep < 0.15 || dep > 1.3 || (info.sand < 0.4 && info.shoal < 0.4)) continue;   // (a shoal hangs over a channel as over the flats)
        const sz = pf.z > Z_MOUTH - 6 ? 0.7 : 0.34;
        fauna.add(F.makeFishSchool({ rng: fr.fork('shoal' + n), species: 'mackerel', form: 'pond', top: '#3c4636', belly: '#aeb8b2', fin: '#59604e', spec: 0.25, count: sz > 0.4 ? 13 : 8, size: sz, speed: 0.6, center: [x, WY - Math.min(sz > 0.4 ? 0.2 : 0.13, dep * 0.6), z], spread: [sz > 0.4 ? 1.7 : 2.0, 0.04], light: 'day' }), { range: 60 });
        n++; if (n & 1) await ctx.yield();
      } }
    await ctx.yield();
    // the sunbittern on its rock stands as a bird on a stream stone does, facing the current: its heading runs up-river along the
    // river's own axis at its rock (the line of the midpoints between the banks, two metres above and below it)
    const birdMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr, uOpen: { value: 0 } }, fog: true, vertexColors: true, side: THREE.DoubleSide, vertexShader: VERT_BIRD, fragmentShader: FH + FRAG_BIRD });
    const bird = new THREE.Mesh(sunbitternGeometry(1.45), birdMat), pB2 = path.pointAt(path.nearestXZ(birdXZ.x, birdXZ.z).u), birdP = V3(birdXZ.x, birdTop + 0.5, birdXZ.z);
    riverEdge(birdXZ.z + 2, eo); const midUp = (eo[0] + eo[1]) / 2; riverEdge(birdXZ.z - 2, eo); const birdYaw = Math.atan2(midUp - (eo[0] + eo[1]) / 2, 4);
    bird.position.set(birdXZ.x, birdTop - 0.04, birdXZ.z); bird.rotation.y = birdYaw; bird.name = 'fcr-sunbittern'; scene.add(bird); void pB2;
    await ctx.yield();
    // sulphur butterflies: three puddling clubs on the wet sandbars; on a rare visit, the migration
    const flapU = { uLift: { value: new THREE.Vector4(0, 0, 0, 0) }, uDrift: { value: V3(...bars.map((b) => b.lx - b.x)) }, uEye: { value: V3(...bars.map((b) => lineY(b.lz) - WY)) }, uMid: { value: new THREE.Vector4(bars[1].lx, bars[1].lz, bars[1].tx, bars[1].tz) }, uStream: { value: new THREE.Vector4(-92, 86, 6.5, wsY) }, uMig: { value: new THREE.Vector4(L.flyX(-60), L.flyX(-20), L.flyX(20), L.flyX(60)) } };
    const flapMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uCorr, ...flapU }, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, vertexShader: VERT_FLAP, fragmentShader: FH + FRAG_FLAP });
    const br = R.fork('sulphur'), yel = [LIN('#f6d83a', 0.8), LIN('#ffe668', 0.8), LIN('#f2b21c', 0.8)], pale = LIN('#f4f0e0', 0.75), orange = LIN('#f08a1c', 0.8), mixed = br() < 0.5;
    const items = [], clubN = Math.round(200 * density * (0.6 + 0.4 * detail));
    for (let k = 0; k < 3; k++) for (let i = 0; i < clubN; i++) {
      const c = mixed && br() < 0.35 ? (br() < 0.5 ? pale : orange) : yel[br.int(0, 2)];
      let x = bars[k].x, z = bars[k].z, y = WY;                             // each one stands on the wet sand itself
      for (let t = 0; t < 8; t++) { const a = br() * 6.283, r = Math.sqrt(br()) * (0.85 - t * 0.08); x = bars[k].x + Math.cos(a) * r * bars[k].rx; z = bars[k].z + Math.sin(a) * r * bars[k].rz; y = natural(x, z); if (y > WY - 0.02) break; }
      items.push(x, Math.max(y, WY) + 0.012, z, br(), k, br.range(0.09, 0.125) * 1.22, br(), br(), c[0], c[1], c[2]);
    }
    await ctx.yield();
    { // the loose ones, tumbling about the flight line all the way down the sand reach, two to eight metres from the eye
      const lq = ctx.core.makeRng('fcr-loose-sulphur:' + ctx.seed), nL = Math.round(380 * (0.6 + 0.4 * detail)), u0 = uAtZ(Z_MOUTH - 4), u1 = uAtZ(AN.ledge.z + 34), pl = V3();
      for (let i = 0; i < nL; i++) { path.pointAt(lerp(u0, u1, lq()), pl); const c = yel[lq.int(0, 2)], sd = lq() < 0.5 ? -1 : 1;
        items.push(pl.x + sd * lq.range(0.8, 4.8), Math.max(WY, pl.y - 1) + lq.range(0.5, 2.3), pl.z + lq.range(-3, 3), lq(), 4, lq.range(0.09, 0.125) * 1.3, lq(), lq(), c[0], c[1], c[2]); } }
    const clubs = flapperMesh(flapMat, items); clubs.name = 'fcr-sulphur-clubs'; clubs.renderOrder = 6; scene.add(clubs);
    let stream = null;
    if (rare) {
      const mi = [], n = Math.round(4400 * (0.5 + 0.5 * detail));
      // A RIVER OF WINGS: thick about the flight line (two in three within three metres of it), one to nearly five metres over the water and
      // thinning steadily upward from 1.1 m (half of them under 2.6 m, about the eye's height), in four waves that run into one another; each a hand and a half across, so the nearest read as butterflies
      for (let i = 0; i < n; i++) { if ((i & 1023) === 1023) await ctx.yield(); const c = yel[br.int(0, 2)], zw = ((178 * (br.int(0, 3) + 0.5) / 4 + br.gauss() * 15) % 178 + 178) % 178;
        mi.push(clamp(br.gauss() * 3.1, -15, 15), 1.1 + 3.6 * Math.pow(br(), 1.3), zw, br(), 3, br.range(0.15, 0.19), br(), br(), c[0], c[1], c[2]); }
      stream = flapperMesh(flapMat, mi, true); stream.name = 'fcr-sulphur-migration'; stream.renderOrder = 6; stream.visible = false; scene.add(stream);
    }
    await ctx.yield();

    // ---------- air: mist at the exit, dawn mist, shafts and drips in the corridor, motes, far cumulus, rain curtain ----------
    const time = { value: 0 }, set = fx.fxGroup(), ar = R.fork('air'); scene.add(set.object);
    const mistCol = new THREE.Color(LOOK.hor).lerp(new THREE.Color('#ffffff'), 0.45).multiplyScalar(hour === 'morning' ? 0.85 : 0.75);
    const exitMist = []; for (let k = 0; k < 6; k++) exitMist.push([ar.range(-8, 8), POOL + ar.range(0.4, 2.2), ar.range(-227, -220)]);
    exitMist.push([-2.8, POOL + 1.0, -223.4], [2.6, POOL + 1.2, -223]);          // two puffs seated on the ring's lower rim
    set.add(fx.makeMist({ rng: ar.fork('m1'), time, positions: exitMist, size: [5, 8.5], color: mistCol, opacity: 0.24, sunDir: sunV }));
    { const fm = []; for (let k = 0; k < 9; k++) { const o = xr.range(0.5, 5), t = xr.range(-4.5, 4.5); fm.push([FALL.x + FALL.nx * o - FALL.nz * t, WY + xr.range(0.6, 4.2), FALL.fz + FALL.nz * o + FALL.nx * t]); }
      set.add(fx.makeMist({ rng: xr.fork('fall-mist'), time, positions: fm, size: [4.5, 8.5], color: mistCol, opacity: 0.25, sunDir: sunV })); }
    await ctx.yield();
    if (LOOK.mist > 0) {
      const cm = [], wm = [];
      for (let k = 0; k < Math.round(16 * LOOK.mist) + 2; k++) cm.push([ar.range(-6, 6), WY + ar.range(1.2, 5), ar.range(Z_MOUTH - 20, UP_Z1 - 10)]);
      for (const w of AN.wells) if (ar() < 0.75) wm.push([w.x, w.waterY + ar.range(0.5, 1.3), w.z]);
      set.add(fx.makeMist({ rng: ar.fork('m2'), time, positions: cm, size: [9, 16], color: mistCol, opacity: 0.1 + 0.1 * LOOK.mist, sunDir: sunV }));
      void ar.fork('m3'); void wm;                                         // (no pads of mist lying on the wells: the hero stands one thin wisp at each well's far rim)
    }
    await ctx.yield();
    const sgS = sunV.x >= 0 ? 1 : -1;
    if (hour === 'morning' && !overcast) for (let k = 0; k < 3; k++) set.add(fx.makeGodRays({ rng: ar.fork('ray' + k), time, position: [sgS * (HALF + 0.5), WY + 11.5, Z_MOUTH + 12 + k * 27 + ar.range(-5, 5)], direction: [-sunV.x, -sunV.y, -sunV.z],
      radius: 5.5, count: 6, length: 15, width: [0.5, 1.7], color: '#f4ffd8', intensity: 0.4, far: [60, 140] }));
    await ctx.yield();
    for (const sg of [-1, 1]) set.add(fx.makeParticles({ rng: ar.fork('drip' + sg), preset: 'rain', time, follow: false, center: [sg * 7.3, WY + 5.8, (Z_MOUTH + UP_Z1) / 2], box: [2.4, 11.5, UP_Z1 - Z_MOUTH - 8], count: Math.round(110 * detail),
      velocity: [0, -7.5, 0], velocityRandom: [0.1, 2, 0.1], size: [0.02, 0.035], stretch: 0.05, opacity: 0.5 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: ar.fork('motes'), preset: 'pollen', time, count: Math.round(380 * detail), box: [40, 14, 40], size: [0.025, 0.06], colors: ['#fff6d0', '#ffffff', '#ffe9a0'], intensity: 1.0, opacity: 0.6 }));
    // (THE KIT GIVES EACH EFFECT THAT STAYS IN ONE PLACE A BALL OF ITS OWN and means the renderer to pass it over wherever the frame
    // cannot hold any of it; the engine's warming draw leaves such an effect marked as always drawn. So the mark is set here, on the
    // kit's own balls: the mists, the slot's shafts and its drips are drawn wherever they can be in the frame, whatever the lens and
    // however the eye looks, and nowhere else. The motes go with the eye and have no ball: they are always drawn.)
    set.object.traverse((o) => { const b = o.isMesh && o.geometry.boundingSphere; if (b && isFinite(b.radius)) o.frustumCulled = true; });
    await ctx.yield();
    // fair-weather cumulus drifting in from the east, a wall of towers building over the lowland to the west (our right)
    const towers = []; for (let k = 0; k < 6; k++) towers.push([ar.range(1300, 2100), 240 + ar.range(-30, 60), -1500 + k * 520 + ar.range(-120, 120), ar.range(420, 700)]);
    for (let k = 0; k < 4; k++) towers.push([ar.range(-1900, -700), 330 + ar.range(0, 120), ar.range(-1600, 900), ar.range(180, 300)]);
    if (burst) towers.push([1250, 300, -420, 760]);
    const cuO = { sky, puffs: Math.round(34 * (0.6 + 0.4 * detail)), height: 0.8, wind: [1.8, 0, 0.6] };      // (two fields: one kit call for all the towers is a long step, and each field costs its own 25 ms whatever it holds)
    const cumuli = [makeCloudField({ rng: ar.fork('cu'), at: towers.slice(0, 5), ...cuO })]; scene.add(cumuli[0].object);
    await ctx.yield();
    cumuli.push(makeCloudField({ rng: ar.fork('cu2'), at: towers.slice(5), ...cuO })); scene.add(cumuli[1].object);
    await ctx.yield();
    let rainMat = null;
    if (burst) {
      rainMat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uCol: { value: VLIN('#7f93a8', 0.85) } }, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }', fragmentShader: FRAG_RAIN });
      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(900, 330), rainMat); curtain.position.set(1180, 150, -420); curtain.rotation.y = -Math.PI / 2 + 0.25; curtain.renderOrder = 1; curtain.name = 'fcr-rain-curtain'; scene.add(curtain);
    }
    await ctx.yield();

    // ---------- gaze ----------
    const g1 = V3(), g2 = V3(), g3 = V3();
    const periP = V3(AN.periscopeWell.position[0], wsY + 0.45, AN.periscopeWell.position[2]);
    // (every look is a pure function of u; the brink belongs to the path's own heading, straight down the staircase to the portal)
    const zAtU = (u) => { const f = clamp(u, 0, 1) * 400, i = Math.min(399, Math.floor(f)); return lerp(uTab[i], uTab[i + 1], f - i); };
    // THE OTTERS SWIM THE RIVER, NOT THE FRAME: the hero is given the route once (its length, our place on it by progress) and the
    // file swims by its law of metres flown (parts: makeFileLaw). The one look at them, otterGaze, rests on the middle of the rear
    // four where that law puts it, and a metre and a half toward their rear once they are abreast (their middle under nine metres
    // ahead of us), so the four lie across the picture.
    hero.setFlight({ length: path.length, zAt: zAtU });
    const otterGaze = (t, u) => { const zf = hero.fileZ('A', u), z = clamp(zf + 1.6 * smoothstep(9, 5, zAtU(u) - zf), -190, 84); return g1.set(L.chanX(z), wsY + 0.3, z); };
    // THAT LOOK'S ENDS COME FROM WHERE THE OTTERS ARE: the route is walked once, a metre at a step. It begins at the first place where
    // the middle of the rear four lies 25 m or less ahead of us (ahead = our z less theirs), having been further off; it ends at the
    // first place after that where the distance has fallen to 0 (they have been abreast and their middle is abeam of us).
    let uOtterFrom = 0, uOtterTo = 1;
    { let far = false, near = false;
      for (let d = 0; d <= path.length; d += 1) {
        const u = d / path.length, ahead = zAtU(u) - hero.fileZ('A', u);
        if (!near) { if (ahead > 25) far = true; else if (far) { near = true; uOtterFrom = u; } }
        else if (ahead <= 0) { uOtterTo = u; break; }
      } }
    // the look leans to the three otters riding the right-hand chute 6 m off the middle line as the eye comes to the brink (the
    // same law, read at our place on the path); below the brink the look across the falls is laid over it
    const chuteGaze = (t, u) => { const zu = zAtU(u), z = clamp(zu - Math.max(zu - hero.fileZ('B', u), 2.5), -193, -60), x = L.chanX(z); return g2.set(x, hero.waterLevelAt(x, z) + 0.25, z); };
    // THE LOOK ACROSS THE FALLS, laid by the eye's z: its turn (k) is eased in from 2 m below the brink, is FULL (FLK.turn degrees
    // round from down the river, by the compass and not by the line's own heading: own) from FLK.full[0] to FLK.full[1], and is eased
    // back to straight down the river by FLK.ahead; from FLK.own[1] to FLK.own[2] the compass is given back to the route's own gaze,
    // which by then is the middle line's. ez: an ease that turns at one rate through its middle four fifths (its greatest rate 1.11
    // of its mean), so a turn of a given size in a given stretch asks the least of the camera.
    const ez = (t) => { t = clamp(t, 0, 1); return t < 0.1 ? t * t / 0.18 : t < 0.9 ? (t - 0.05) / 0.9 : 1 - (1 - t) * (1 - t) / 0.18; };
    const g4 = V3(), g5 = V3(), fallLook = (t, u) => {
      const zu = zAtU(u), dd = u * route.length, zb = AN.brink.z; route.posAtDist(dd, g5); route.posAtDist(dd + 18, g4).sub(g5);
      const k = ez((zb - 2 - zu) / (zb - 2 - FLK.full[0])) * (1 - ez((FLK.full[1] - zu) / (FLK.full[1] - FLK.ahead))), own = smoothstep(zb, FLK.own[0], zu) * (1 - smoothstep(FLK.own[1], FLK.own[2], zu));
      const h = Math.hypot(g4.x, g4.z) || 1, yaw = Math.atan2(g4.x, -g4.z) * (1 - own) - FLK.turn * Math.PI / 180 * k;
      return g4.set(g5.x + 30 * Math.sin(yaw), g5.y + 30 * lerp(g4.y / h, -FLK.tip, Math.min(1, k * 2)), g5.z - 30 * Math.cos(yaw));
    };
    const uLedge = uAtZ(90), macGaze = (t, u) => { macaws.positionAt(t, u, g3); g3.y -= 0.6; return g3; };   // (the middle of the macaws: the kit's own place of their lead point, by our place on the route)
    // ONE RELEASE RULE FOR EVERY LOOK AT A SUBJECT (held()), worked out every frame from where the camera is on the route: a look
    // holds while its subject lies within 80 degrees of the way the flight itself looks (down the route, 18 m ahead) and lets go as
    // it swings wider, gone by 115 (what we have passed is left behind, the gaze going back to the river ahead). No look is timed
    // against another. THE LOOK ACROSS THE FALLS (fallLook) is not a look at a subject and is NOT under this rule: it is a turn of
    // the gaze itself, laid by the eye's z, and stands up to FLK.turn (105) degrees off the way down the river.
    const lkP = V3(), lkT = V3(), lkO = V3(), REL0 = Math.cos(80 * Math.PI / 180), REL1 = Math.cos(115 * Math.PI / 180);
    const held = (subject) => (t, u) => {
      const sv = typeof subject === 'function' ? subject(t, u) : subject, dd = u * route.length; route.posAtDist(dd, lkP); route.posAtDist(dd + 18, lkT).sub(lkP);
      if (lkT.lengthSq() < 1) route.tangentAt(u, lkT); lkT.normalize();
      const dx = sv.x - lkP.x, dz = sv.z - lkP.z, k = smoothstep(REL1, REL0, (dx * lkT.x + dz * lkT.z) / ((Math.hypot(dx, dz) || 1) * (Math.hypot(lkT.x, lkT.z) || 1)));
      lkO.copy(lkP).addScaledVector(lkT, 30).lerp(sv, k); lkO.y += k * riseAt(lkP.z);   // (the look's end is lifted by what the MIDDLE line stands over the low line at the eye's z: from the middle line a subject is looked at at the low line's pitch. Where the route stands over the middle line, on the one rise, nothing is added and the look is that much steeper down)
      return lkO;
    };
    const pois = [
      { at: held(birdP), from: 0.15, to: 0.31, weight: 0.58, fade: 0.15 },
      { at: held(V3(FALL.x, WY + 5.5, FALL.fz)), from: 0.2, to: 0.335, weight: 0.5 },
      { at: held(V3(L.chanX(40), 0, 34)), from: uLedge - 0.1, to: uLedge + 0.09, weight: 0.6 },
      { at: held(macGaze), from: (MAC.d - MAC.lead - 38) / path.length, to: (MAC.d - MAC.lead + 22) / path.length, weight: 0.42, fade: 0.3 },   // (the eye goes part of the way up to the macaws while they come by, from 38 m of route before the lead bird is over our line to 22 m after)
      { at: held(otterGaze), from: uOtterFrom, to: uOtterTo, weight: 0.8, fade: 0.15 },
      { at: held(periP), from: 0.672, to: 0.722, weight: 0.75, fade: 0.35 },
      { at: held(chuteGaze), from: 0.735, to: 0.868, weight: 0.62, fade: 0.3 },
      { at: fallLook, from: uAtZ(-90), to: uAtZ(-195), weight: 1, fade: 0.05, arc: true },
    ];                                                                    // (the last is laid over all the others at its whole weight from 5 m below the brink; from z -174 it is straight down the river and from z -190 the route's own: the ring stands whole ahead between its buttresses, the pair on their ledge beside it)

    if (ctx.renderer && sky.prewarm) { try { await sky.prewarm(ctx.renderer, null, scene); } catch (e) { /* headless */ } }
    hero.setWatch(rare);
    const camP = V3(), lift = flapU.uLift.value, heroBig = hero.object.children.filter((c) => ['fcr-bed', 'fcr-water'].includes(c.name)), heroLate = hero.object.children.filter((c) => ['fcr-wells', 'fcr-otters', 'fcr-otter-fx'].includes(c.name)), wellsM = heroLate.find((c) => c.name === 'fcr-wells');
    return {
      scene, path: route, duration: DUR,
      // brisk down the corridor, lingering over the fall, the Red Carpet and the otter run, slowest as the camera comes to the
      // brink (the staircase needs a breath to be counted), then gathering speed down the steps to the portal
      pace: (u) => 1.16 - 0.34 * smoothstep(0.17, 0.42, u) - 0.12 * smoothstep(0.69, 0.74, u) + 0.3 * smoothstep(0.77, 0.9, u),
      camera: { fov: 62, near: 0.3, far: 6500, lookAhead: 18, sway: 0.6, bank: 0.55, nearThrough: 0.3 },   // (seen through a portal the river is drawn right up to the lens: the path starts a metre over the water)
      pois,
      portal: { shape: 'circle', radius: 7, color: '#bfe4ff', glow: 1, revealDistance: 260, tilt: true },
      post: { exposure: LOOK.exposure * (overcast ? 1.08 : 1), bloom: { strength: 0.26, radius: 0.6, threshold: 0.95 },
        grade: { saturation: broken ? 1.14 : 1.1, contrast: 1.05, tint: LOOK.tint, shadowTint: LOOK.shadow, vignette: 0.28, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        camP.setFromMatrixPosition(camera.matrixWorld);
        hero.setProgress(u); hero.update(dt, t, camera);
        sky.update(dt, t, camera); rig.update(dt, t, camera); for (const cf of cumuli) cf.update(dt, t, camera);
        forest.update(dt, t, camera); scrub.update(dt, t, camera); grass.update(dt, t, camera);
        fauna.update(dt, t, camera, u); set.update(dt, t, camera);
        // scripted moments: the sunbittern's display (by the eye's distance), each butterfly club lifting as we arrive, the migration (on u)
        birdMat.uniforms.uOpen.value = smoothstep(27, 15, camP.distanceTo(birdP));   // the fan opens as the eye comes within range, is full at fifteen metres and is held while we pass
        { let d = Math.atan2(camP.x - birdP.x, camP.z - birdP.z) - birdYaw; d -= Math.round(d / 6.2832) * 6.2832; bird.rotation.y = birdYaw + clamp(d, -0.85, 0.85); }   // (it keeps its feet and turns the shield after us)
        // each club lifts as the lens comes within thirty metres of its bar and is all in the air at eleven
        lift.x = smoothstep(30, 11, Math.hypot(camP.x - bars[0].x, camP.z - bars[0].z)); lift.y = smoothstep(30, 11, Math.hypot(camP.x - bars[1].x, camP.z - bars[1].z)); lift.z = smoothstep(30, 11, Math.hypot(camP.x - bars[2].x, camP.z - bars[2].z));
        lift.w = rare ? smoothstep(0.44, 0.5, u) * (1 - smoothstep(0.765, 0.8, u)) : 0;
        if (stream) stream.visible = lift.w > 0.001;
        const cz = camP.z;
        if (upWeed) upWeed.visible = cz > 30 && cz < 262;
        const inSlot = cz > 262;                                            // from inside the slot the slab and the lower river lie below the ledge, out of sight
        for (const m of heroBig) m.visible = !inSlot;
        for (const m of heroLate) m.visible = cz < 150;                     // the wells and the otters lie 6 m below the ledge: they stand from 60 m above it, before any line of sight clears its lip
        if (wellsM && cz < AN.brink.z - 5 && camP.y < wsY - 1) wellsM.visible = false;  // (and from a metre under the slab's water, down the staircase, the brink's own lip hides every well: by where the eye is)
        for (const m of belts) m.visible = cz < 165;
        // (BELOW THE BRINK THE LOOK TURNS ACROSS AND UP THE RIVER, and what stands up the river is in the picture there, far to its
        // edge on a wide screen. So nothing is let go for lying behind the eye's place: the belts' crowns keep their full copy as far
        // up the river as down it, the ferns and the vellozia go by their distance alone, and from the brink until the eye is 6 m
        // past the place where the look is straight ahead again (turned: by the eye's z) no stretch of them up the river goes at all,
        // nor the slot's ferns and its tree. Those that come back at the brink stand 140 m and more straight behind the eye, which
        // looks ahead there. What stays let go below the brink the land hides from every place of the line there: the upper river
        // and its weed lie above the ledge, the wells in the slab under the eye's own level)
        const turned = cz < AN.brink.z && cz > FLK.ahead - 6;
        for (const p of beltLod) { const hi = Math.abs(cz - p[3]) < p[4]; p[0].visible = hi; p[1].visible = !hi && cz < p[2]; }
        for (const v of velloz) v[0].visible = Math.abs(cz - v[1]) < v[2] || (turned && v[1] > cz);
        for (const v of scarpFerns) v[0].visible = Math.abs(cz - v[1]) < v[2] || (turned && v[1] > cz);
        for (const m of corrWeed) m.visible = cz > 226;
        for (const m of corrOnly) m.visible = cz > Z_MOUTH - 26 || turned;          // the slot's ferns and its fallen tree lie behind us from the sand reach on
        for (const m of upOnly) m.visible = cz > 52;                       // so does the whole upper river once we are down on the slab
        for (const m of gateOnly) m.visible = cz < 40;                     // and the growth on the gate is not seen from above the ledge
        clubs.visible = cz > 80; bird.visible = cz > 110;
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
