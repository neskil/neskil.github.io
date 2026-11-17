// MEGA MENDUNG (batik-monsoon): hero set piece "The Front", a monsoon shelf cloud drawn as living wax-resist batik.
//
// WHAT     About 580 mega-mendung curls (lobed outline of 7-10 uneven scallops with a hooked tail, eccentric nested
//          terraces, each a stepped boss) laid as: a double nose row of upright billows on the leading edge, THE
//          HANGING BANKS (hangBillows: about 30 small inverted billows in three ranks under the leading edge either
//          side of the staircase's tip, feet 16-22 m over the sea, so the tip hangs between them against the rain
//          wall), shingled rows up the 27 degree face (from 160 m off the staircase deep-dyed, 30-150 m across, lying flatter and
//          standing taller so the sea sees stacked ink risers: the staircase is the one pale path up a dark wall),
//          a crest of curls along the lip, a canyon behind the lip (two walls of paler curls set 45-60 m back and
//          turned to FACE the arriving camera like stage wings, never edge-on beside the route; a floor, a bowl), a
//          wreath round the great curl, brick-laid towers of 170-900 m curls in the deepest dye piling back to a 1,200 m
//          crest, two doubled tower masses 330-490 and 640-800 m right of the notch, THE FAR TOWER (a pile of six curls
//          1.5 km from the entry, 230 m right of the notch, crown at nine tenths of the entry frame as a half-strength
//          wash) and three 250-330 m giants that break the skyline. THE STAIRCASE (buildStairs) is the tongue of the shelf
//          the route climbs: about 45 scalloped lips in plates of four, from a scud tip 8 m over the sea ahead of the
//          nose up to the notch, 192 m wide, banked either side by small (22-30 m) curls; each lip's face carries the
//          cream line and two rows of resist dots. On and over the lip stand five 66-90 m curls against the sky (the two
//          beside the notch 140 m either side of it and lifted, leaning out, so the route never skims them): two
//          heralds (turned down to face the climbing camera) and the three of THE ARRIVAL. Under the curls three dark
//          sheets (face, underside, towers) so gaps show dyed cloth; round the staircase's tip the face and underside
//          start up to 118 m behind the nose on a lobed line (THE BAY in buildBody), so from the sea the space under
//          the shelf is open to the rain wall and no sheet is seen edge-on. THE GREAT CURL is a horn of seven lobed lips, 236 m across at the mouth, stepping in and
//          back to a 19 m throat that holds the exit portal, dyed in reverse (pale rim, ink throat), with a gold
//          scalloped ring turning round the portal seat. THE IRIS: the scallops of its lips travel round them, alternate
//          lips against each other at 0.05 rad/s (TERRACE_VERT under HORN; attributes aHornA / aHornB from
//          buildGreatCurl). Its OUTER lips are eccentric: the centres of lips 1-4 stand 75, 50, 28 and 10 m left of the
//          route and 14 to 2 m under it (HORN_OFF, HORN_DROP), so from the canyon the rings nest off-centre like a
//          whorl; lips 5-7 are CENTRED on the route and on the portal, so the last fifth of the flight is a round
//          tunnel whose rings close evenly on the portal and no lip passes near the lens. Its rim is one lobed ring
//          with THE HOOKED TAIL of the motif low on its wide (left) side (tailB, tailBump, tailTurn in buildGreatCurl). THE WINDOWS: three cloud-shaped openings onto the sky, hemmed in gold, in the caps
//          of lips 1, 2 and 3 on the upper left and upper right of the outer rings (hornWin in TERRACE_FRAG; they are
//          drawn as the cloth dome seen through, since the dark body sheet lies behind the lips). Inside the third
//          ONE TOWER BOLT is drawn in gold a second and a half after the hero bolt (T_WIN; winBolt; uWinBolt.x is its age), off the portal's line and
//          before u 0.80; nothing strikes beside the portal after that. THE CAPS of the great curl's lips carry, wherever
//          they come within about 60 m of the lens (the two pale caps: within about 120 m), two rows of half-round scales and a cream echo line (the HORN block
//          in TERRACE_FRAG, hfil); the outer lips carry the band in the middle of the cap too, and on the two pale
//          caps (rim and lip 1) it lies on a ribbon two dye steps darker (hrib), so no lip near the lens is a plain flat band. THE STAIRCASE'S PLATES are drawn as cloud tops (uStair in TERRACE_FRAG):
//          treads in three flat bands hemmed with cream echoes of the lip, each face standing on two rows of half-round
//          scales, crackle at 40%; its top plate ends 14 m short of the lip so the notch looks down onto the great curl.
//          The canyon's left wall is a single high curl only (nothing crosses the great curl's rim from the notch), and
//          face and wreath curls lying more than 60 degrees off the line to the route are turned 25 degrees toward it.
//          The wreath's curls beside and below the mouth are fully modelled and have no tail, and the bowl's curls
//          under the mouth have no tail either (level 'bmid': the same cone without the tail's sector, which lay
//          across the steps as a flat pale wedge cut off ruler-straight when seen from the canyon).
//          The canyon's upper row leans down 10 degrees toward the route and its curls have NO TAIL (seen from beside
//          and below a tail hung under the cap as a flat striped triangle), and the first towers right of the canyon
//          (within 720 m of the canyon's own axis) are turned to within 35 degrees of the line to the nearest point of
//          that axis; those within 520 m of it are FULLY MODELLED (real terraces, 8-11 points to a scallop: as 32-point cones their flanks
//          showed under the canyon's caps as flat striped fans), so the canyon shows scalloped caps and gold lips. THE GREAT CURL'S RINGS start and end on the left
//          (far) side and each cap carries one arc scale: no step in line or dot rows on the lips the camera brushes.
//          BESIDE THE STAIRCASE the billows of the nose row (100-300 m from the route) lean out and turn toward the
//          route and the dark face curls 160-300 m out stand up and turn the same way, so the camera coming in under
//          them sees caps as rounded scallops; the near, fully modelled curls have 8-11 points to a scallop. Plus: six drawn lightning bolts (one keyed to the route),
//          a rain wall of udan-liris bands under the shelf (three lanes of long pale slanted strokes to a band), and the cloth dome (cream, weave, crackle, the stain
//          climbing from the crest behind a wax-pen line; below the horizon a flat far sea in parang bands).
// SIZE     Hero-local metres, origin on the sea under the shelf's nose, +Y up, the camera arrives from +Z flying -Z.
//          Front 6.6 km wide (x -3300..3300), nose at z 0 / y 45, lip at z -340 / y 220, crest 1,200-1,300 m high near
//          z -3000. `radius` 260, `height` 100 and `center` (0,240,60) are ORBIT HINTS for the part viewer (they frame
//          the nose and face from the open-sea side; use viewer u <= 0.5). True extents: anchors.bounds.
// OPTS     palette     7 hex strings in the brief's order (ink, indigo, pale indigo, soga, cream, madder, gold)
//          colourway   'day' | 'golden' (madder cloth) | 'night' (ink cloth) | 'dawn' (jade cloth with a rose band on
//                      the storm's side of the sky, full to 30 degrees up and gone by 46: ten degrees of it over the crest);
//                      default from ctx.vary.hour, else 'day'
//          prada       true: after the hero bolt its gold runs out along every resist line at 300 m/s (default
//                      ctx.vary.rare)
//          dome        false: do not add the cloth dome (then put your own cream dome behind: unborn curls are
//                      transparent);  farSea false: keep the dome but leave it cream below the horizon
//          rainWall    false: no rain wall;   body false: no dark sheets under the curls
//          shift       metres the notch, canyon and great curl sit along the lip (default by seed, -110..110): the
//                      climb slants over to them;   boltEvery  seconds between tower bolts (default 4, night 2)
// PER SEED the notch shift, three curl outlines (scallop count, unevenness, tail, eccentricity), every curl's place,
//          size, lean and mirror, the staircase's plates and lobes, the bay in the nose, canyon width, tower lumps and giants, the great curl's lobes and twist,
//          bolt shapes and places, which lip curl arrives first. ctx.quality.detail thins the tower curls only.
// PROGRESS hero.setProgress(u): path progress 0..1 on the brief's clock (seconds = u x 36). It drives THE ARRIVAL
//          (veins 0.8 s, wax line and gold bead 1.4 s, flood 1.8 s, wax pales) of the two heralds at u 0.268 and 0.29
//          and the three lip curls at u 0.335, 0.359, 0.383 (staggered so that veins, wax and flood are on screen
//          together at u 0.4) and of five sky curls on the crest (u 0.14, 0.3, 0.5, 0.6, 0.78), the stain on the dome, and
//          the hero bolt at u 0.69 (drawn in 0.33 s, cooling to a soga trace; resist lines within 200 m flare gold
//          for 0.4 s, eased). Call it every frame with the u passed to your world's update(). If it is never called
//          the piece loops that clock on world time so that it still performs. Tower bolts strike on world time
//          (every 4 s, 2 s at night). hero.setPrada(radiusMetres) gilds the lines by hand.
// ANCHORS  entry, flyThrough (19 points: pass them straight to makePath; hero.path is that very curve. Clearance is
//          tested on every outline vertex of all eight terraces with a margin for rocking, billow and breathing:
//          curls keep 13 m at rest (measured 22 m or more on five seeds), the staircase's crests lie 11.6-11.9 m
//          under the route, the great curl's lips 9 m, taken at their cusp radius all the way round because the
//          scallops travel), shift (the notch shift in metres), portalSeat { position,
//          normal (facing the arriving camera), radius 7 }, nose, lipNotch, canyon { from, to, halfWidth, floorY },
//          greatCurl { mouth, core, axis, lips[], radii[], arcStart, lipDist[], lipOff[], lipDrop[] }, heroBolt { top, strike, u, life (seconds from its first stroke until the last of it has cooled to its trace), channel[] (its drawn trunk, top to foot) }, boltSlots[],
//          arrivals [{ position, radius, u, kind }], pois { faceAhead, greatCurlCore }, viewpoints [{ position,
//          target, note }], timeline, bounds. The route: level in at 5-8 m, up the staircase from z 120, over the lip
//          through the notch at 216 m, level along the canyon at 200 m, a 50 degree left arc of radius 250 m that
//          enters the great curl's mouth right of its centre (the outer lips stand left of the route) and runs on the
//          axis of the inner rings, and 80 m straight down the throat.
// STYLE    Exports for the rest of the world: shiftAt(z, shift) (the route's x offset at z), BATIK_GLSL (bkVor,
//          bkVeins, bkLine, bkCloth, bkGild and the palette uniforms), BATIK_FADE_GLSL (bkFade: depth is dye strength,
//          fading to uCloth by 1 - exp(-(d / 2000 m) squared) at the scene fog's density 0.00022: 4% at the nose from
//          the entry, 14% at the lip, 43% at 1.5 km, 90% at 3 km; density capped by uFadeMax 0.0003), batikPalette(palette, colourway), batikUniforms(pal) and styleMaterial(opts)
//          (the terrace material; attribute layout above TERRACE_VERT). Share hero.uniforms with your own batik
//          materials: uRamp[8] (rim ink .. pale .. core), uCloth, uLine, uWax, uGold, uSoga, uOverdye, uTime, uU,
//          uFlash, uPrada. Rules as built: one flat fill per terrace from a step index; a cream resist line where the
//          distance to the terrace lip is under 0.3 m (scaled with the cap, never under 1.1 px, fwidth-edged) with a
//          13% halo of pooled dye beside it and 20% pooling at each foot; THE GOLD WAX LINE: the outermost lip of every
//          curl, the first lip of each staircase plate and every lip of the great curl keep their wax (uGold x 0.9, 1.6
//          times the line's width; styleMaterial goldTer), three gold beads run round each lip of the great curl, and
//          its risers step darker in three flat bands toward the next lip (depth between the rings); crackle (drawn at
//          62% strength so the motif stays in front of it) = 3D Voronoi borders of the
//          rest-pose position at 3, 14 and 70 m, each dropped when its cells get small on screen, veins one step
//          darker (on the two darkest steps one lighter, so ink never goes blank); weave and mottle as a +-4% multiplier; wicking = fill where the vein distance is under a radius
//          that grows per Voronoi cell. No normals, no lights anywhere. All dyes are scaled by 0.86 (cream 0.74).
//          THE ARRIVAL's wax is a pen line on the cap side of each lip (1.6 px at least, amber x 0.85) with a gold bead
//          at its tip. Instance lift (aInst.z = reversed 0|1 + lift / 10): 0-6 raises the rim's step (paler curls), 7 the
//          plain body sheets, 8 the deep dye (core stops at mid indigo), 9 the deepest (core stops at indigo).
//          The dome's crackle and stain are set per colourway (night: a thin pale-indigo crackle that still reads on the ink cloth
//          at the top of a frame (uVeinA 0.14, uVeinW 0.85), indigo stain; golden:
//          a darker violet-indigo overdye; the stain's front is 1.5 degrees soft).
// LIGHTING None: self-coloured, reads no scene lights. Wants scene fog #EFE3C6 (or the colourway's cloth,
//          hero.palette.hex.cloth) at density 0.00022, bloom about 0.3 with threshold 1.1 (only the bolts 4, the wax
//          bead 2.5 and the portal ring 2 exceed 1), style 'none', no vignette tint.
// COST     380-395k triangles, up to 23 draw calls (9-15 instanced curl meshes: three outlines at three levels of detail, plus the tail-less models of the upper canyon row, the wreath and the bowl, staircase, great curl, body, ring, bolts, rain
//          wall, dome), 6 programs (the great curl has its own variant of the terrace program), about 100-300 ms
//          build, no lights, no textures, nothing to dispose beyond `object`.
// VIEWER   Viewer-only aid: when buildHero gets NO opts at all and the seed is 9000-9999, update() rides the camera
//          down hero.path (orbit angle -> route fraction) so the route can be judged in the part viewer. It is off
//          as soon as any opts are passed or setProgress is called.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';

// =====================================================================================================================
// palette and colourways
// =====================================================================================================================
const DEF_PAL = ['#121833', '#26407F', '#8FB0D6', '#6E4425', '#EFE3C6', '#B3362B', '#E3A72A'];
const DEF_RAMP = ['#121833', '#1B2A57', '#26407F', '#3560A6', '#5C87C4', '#8FB0D6', '#C3D6E6'];
const VALUE = 0.86;   // every dye is scaled by this so that cream stays under 0.75 linear and never clips
const DURATION = 36;  // seconds the brief's journey takes: ages in the shaders are (u - birth) * DURATION

const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const lin = (hex, k = VALUE) => {
  const c = new THREE.Color(hex), v = new THREE.Vector3(c.r * k, c.g * k, c.b * k);
  // ink would fall off the bottom of the tone curve and read as black: lift the darkest dyes so it stays navy
  const l = 0.04 * Math.pow(1 - Math.min(1, Math.max(v.x, v.y, v.z) * 4), 3); v.x += l * 0.5; v.y += l * 0.7; v.z += l * 1.7;
  return v;
};

// The fixed palette of the style as linear colours. colourway: 'day' | 'golden' | 'night' | 'dawn'.
export function batikPalette(palette = DEF_PAL, colourway = 'day') {
  const p = DEF_PAL.map((d, i) => (palette && palette[i]) || d);
  const isDef = p[0].toLowerCase() === DEF_PAL[0].toLowerCase() && p[1].toLowerCase() === DEF_PAL[1].toLowerCase() && p[2].toLowerCase() === DEF_PAL[2].toLowerCase();
  const ramp = isDef ? DEF_RAMP.slice() : [p[0], hexMix(p[0], p[1], 0.5), p[1], hexMix(p[1], p[2], 0.33), hexMix(p[1], p[2], 0.66), p[2], hexMix(p[2], p[4], 0.55)];
  let cloth = p[4], line = p[4], haze = null;
  if (colourway === 'golden') cloth = '#8A2A24';
  else if (colourway === 'night') cloth = '#0E1226';
  else if (colourway === 'dawn') { cloth = '#CFE0CF'; haze = '#D9A5A0'; }
  ramp.push(line);   // step 7: the reserved core
  return {
    colourway, hex: { ramp, cloth, line, soga: p[3], madder: p[5], gold: p[6], wax: '#C8923A', overdye: '#1E1A24', haze },
    ramp: ramp.map((h) => lin(h)), cloth: lin(cloth, colourway === 'golden' ? 0.7 : VALUE), line: lin(line), soga: lin(p[3]), madder: lin(p[5]),
    gold: lin(p[6], 1), wax: lin('#C8923A'), overdye: lin('#1E1A24'), haze: lin(haze || cloth),
  };
}

// One uniforms object shared by every batik material of a world (pass it to styleMaterial / use it in your own shaders).
export function batikUniforms(pal) {
  return {
    uRamp: { value: pal.ramp }, uCloth: { value: pal.cloth }, uLine: { value: pal.line }, uWax: { value: pal.wax },
    uGold: { value: pal.gold }, uSoga: { value: pal.soga }, uOverdye: { value: pal.overdye },
    uTime: { value: 0 }, uU: { value: 0 }, uDur: { value: DURATION },
    uFlash: { value: new THREE.Vector4(0, 0, 0, 0) },      // xyz: where the bolt struck (hero-local), w: 0..1 flare
    uPrada: { value: new THREE.Vector4(0, 0, 0, 0) },      // xyz: origin, w: radius in metres inside which resist lines are gold leaf
    uFadeMax: { value: 0.0003 },                            // cap on the scene fog density used for the dye fade
  };
}

// =====================================================================================================================
// THE STYLE, as GLSL. Everything is a function of P, the rest-pose position in metres.
//   bkVeins(P, px, floodSize, vd, ch)  crackle: 3D Voronoi borders at 3, 14 and 70 m, each kept >= 1.6 px wide and dropped
//                                      when its cells get too small on screen. Returns the vein mask; vd = 0 on a vein ..
//                                      1 at the heart of the cell and ch = cell hash, both of the `floodSize` network.
//   bkLine(edge, capW, arcM, pxE)      the resist line: x = line mask, y = dye multiplier (halo of pooled dye beside it)
//   bkCloth(P, px)                     weave and dye mottle as a multiplier around 1
//   bkFade(col, depth)                 depth is dye strength: fade to the cloth (uses the scene fog's density)
// px = metres per pixel = max(length(dFdx(P)), length(dFdy(P))), pxE = fwidth(edge): take both BEFORE any loop.
// =====================================================================================================================
export const BATIK_GLSL = /* glsl */`
uniform vec3 uRamp[8]; uniform vec3 uCloth, uLine, uWax, uGold, uSoga, uOverdye;
uniform float uTime, uFadeMax; uniform vec4 uFlash, uPrada;
vec3 bkHash3(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
vec2 bkVor(vec3 x){
  vec3 n=floor(x), f=fract(x), r1=vec3(8.), r2=vec3(8.), c1=vec3(0.); float d1=64., d2=64.;
  for(int k=-1;k<=1;k++) for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec3 g=vec3(float(i),float(j),float(k)); vec3 r=g+bkHash3(n+g)-f; float d=dot(r,r);
    if(d<d1){ d2=d1; r2=r1; d1=d; r1=r; c1=n+g; } else if(d<d2){ d2=d; r2=r; } }
  vec3 dr=r2-r1; float e=dot(.5*(r1+r2), dr/max(length(dr),1e-4));
  return vec2(max(e,0.), bkHash3(c1+3.7).x); }
float bkVeinAt(vec3 P, float size, float px, out vec2 v){
  v=bkVor(P/size+vec3(7.3,1.9,4.1)); float hw=max(.0065*size, .8*px);
  return (1.-smoothstep(hw, hw+max(px,.02*hw), v.x*size))*(1.-smoothstep(.03*size,.09*size,px)); }
float bkVeins(vec3 P, float px, float floodSize, out float vd, out float ch){
  vec2 v; float m=bkVeinAt(P,70.,px,v); vd=clamp(v.x*2.6,0.,1.); ch=v.y;
  if(px<1.26 || floodSize<40.){ float m2=bkVeinAt(P,14.,px,v); m=max(m,m2*.9); if(floodSize<40.){ vd=clamp(v.x*2.6,0.,1.); ch=v.y; } }
  if(px<.27){ m=max(m,bkVeinAt(P,3.,px,v)*.75); }
  return m; }
vec2 bkLine(float edge, float capW, float arcM, float pxE){
  float ls=max(capW*.085, .3)/.3;
  float lw=(.3+.05*(sin(arcM*.7/ls)+.6*sin(arcM*1.93/ls+1.7)))*ls;
  float lwp=max(lw, 1.1*pxE), aa=max(pxE, .1*ls);
  float line=1.-smoothstep(lwp-.5*aa, lwp+.5*aa, edge);
  line=mix(line, min(.11, lw/max(capW,1e-3)), smoothstep(.22,.55,pxE/max(capW,1e-3)));
  float halo=1.-.13*(1.-smoothstep(lwp, lwp+.5*ls, edge));
  return vec2(line, halo); }
float bkCloth(vec3 P, float px){
  float wv=sin((P.x+P.z*.37)*157.)*sin((P.y+P.z*.21)*157.)*(1.-smoothstep(.007,.015,px));
  float mo=sin(P.x*.83+1.7*sin(P.z*.61+P.y*.4))*sin(P.y*.71+1.3*sin(P.x*.47-P.z*.5));
  return 1.+.04*wv+.035*mo*(1.-smoothstep(.4,1.2,px)); }
vec3 bkGild(vec3 lineCol, vec3 P){
  float fl=uFlash.w*(1.-smoothstep(110.,200.,distance(P,uFlash.xyz)));
  float pd=distance(P,uPrada.xyz), pk=step(pd,uPrada.w)*step(.5,uPrada.w);
  lineCol=mix(lineCol, uGold*(1.25+1.6*exp(-max(uPrada.w-pd,0.)*.02)), pk);
  return lineCol+uGold*2.6*fl; }
`;
export const BATIK_FADE_GLSL = /* glsl */`
#ifdef USE_FOG
varying float vFogDepth;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear; uniform float fogFar;
#endif
#endif
vec3 bkFade(vec3 col, float depth){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  float fd=min(fogDensity,uFadeMax)*depth*2.27; return mix(col, uCloth, 1.-exp(-fd*fd));
  #else
  return mix(col, uCloth, smoothstep(fogNear, fogFar, depth));
  #endif
#else
  return col;
#endif
}
`;

// ---------------------------------------------------------------------------------------------------------------------
// The terrace material (curls, the great curl, anything built from stepped caps and risers).
// Geometry attributes (see curlGeometry): position (curl-local), normal (the direction a terrace breathes along),
//   aData = (terrace index 0 rim .. 7 core, distance to the lip, distance to the foot, arc fraction 0..1)
//   aAux  = (kind: 0 cap, 1 riser, 2 cone whose steps are cut in the shader (aData.x is then continuous 0..8 and
//            aData.z the cap width), arc length along the outline)        all lengths in curl-local units
// Instance attributes: instanceMatrix (REST pose), aInst = (birth u or -1 = always there, phase, reversed 0|1, motion 0..1)
// ---------------------------------------------------------------------------------------------------------------------
const TERRACE_VERT = /* glsl */`
attribute vec4 aData; attribute vec2 aAux; attribute vec4 aInst;
uniform float uTime, uU, uDur, uBreathe, uRock, uBillow;
varying vec3 vP; varying vec4 vData; varying vec4 vAux; varying vec3 vLoc;
#ifdef HORN
attribute vec4 aHornA; attribute vec2 aHornB;   // A = (unit radial direction, lobe phase at rest), B = (lobe depth m, phase rate rad/s)
#endif
#ifdef USE_FOG
varying float vFogDepth;
#endif
void main(){
  mat4 im = instanceMatrix;
  float s = length(im[1].xyz);
  vec3 p = position;
  vP = (im*vec4(p,1.)).xyz;
  #ifdef HORN
  // THE IRIS: the scallops of each lip of the great curl travel round it, alternate lips against each other. The
  // outline is re-evaluated at the turned phase (cusps a little rounded so they do not tick past the vertices) and
  // the vertex moves along its own radius; the dye stays with the cloth (vP is the rest pose).
  { float sn = sin(aHornA.w - aHornB.y*uTime);
    p += aHornA.xyz*(aHornB.x*(pow(sn*sn + .004, .4) - pow(abs(sin(aHornA.w)), .8))); }
  #endif
  float mo = aInst.w, ph = aInst.y, ter = min(aData.x, 7.);
  p += normal*(uBreathe*mo*sin(uTime*.9 - ter*.8 + ph)*(.2+ter/7.));
  float a = uRock*mo*sin(uTime*.42 + ph*1.7), ca = cos(a), sa = sin(a);
  vec2 q = p.xy - vec2(0.,-.55); p.xy = vec2(ca*q.x - sa*q.y, sa*q.x + ca*q.y) + vec2(0.,-.55);
  vec3 w = (im*vec4(p,1.)).xyz;
  vec3 az = im[2].xyz; az /= max(length(az), 1e-4);
  w += az*(uBillow*mo*sin(dot(vP.xz, vec2(.6,.8))*.0314 - uTime*.628));
  vData = vec4(aData.x, aData.y*s, aData.z*s, aAux.y*s);
  vAux = vec4(aData.w, aAux.x, aInst.x < 0. ? 99. : (uU - aInst.x)*uDur, s);
  vLoc = vec3(position.xy, aInst.z);
  vec4 mv = modelViewMatrix*vec4(w,1.);
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix*mv;
}`;

const TERRACE_FRAG = /* glsl */`
${BATIK_GLSL}
${BATIK_FADE_GLSL}
varying vec3 vP; varying vec4 vData; varying vec4 vAux; varying vec3 vLoc; uniform float uDot, uGoldTer, uStair;
#ifdef HORN
// THE WINDOWS of the great curl: three cloud-shaped openings onto the sky in the caps of its outer lips (a small
// mega-mendung silhouette: five lobes toward the rim over a flat base toward the lip), hemmed in the gold wax line.
// wn = (lip index, angle of the centre, the lip's mean radius m, lengthwise stretch). Returns metres to the opening's
// edge (negative inside it).
uniform vec4 uWin[4]; uniform vec4 uWinBolt;   // uWinBolt.x = age in seconds of the bolt drawn inside the third opening (uWin[2]); y belongs to the fourth slot, which is empty
float hornWin(vec4 wn, float ter, float kind, float arcF, float foot, float capW){
  float h = max(capW*.34, 1e-3);
  vec2 q = vec2(abs((fract(arcF - wn.y/6.2831853 + .5) - .5)*6.2831853*wn.z)/wn.w, capW*.46 - foot)/h;
  float d = length(q - vec2(0., .1)) - .95;
  d = min(d, length(q - vec2(1.15, -.2)) - .62);
  d = min(d, length(q - vec2(2., -.38)) - .4);
  vec2 b = abs(q - vec2(0., -.5)) - vec2(1.9, .07);
  d = min(d, length(max(b, 0.)) + min(max(b.x, b.y), 0.) - .2);
  return (abs(ter - wn.x) < .5 && kind < .5) ? d*h : 1e3;
}
// the opening's own coordinates (x along the lip, y toward the rim, in units of its height; x signed)
vec2 hornWinQ(vec4 wn, float arcF, float foot, float capW){
  float h = max(capW*.34, 1e-3);
  return vec2((fract(arcF - wn.y/6.2831853 + .5) - .5)*6.2831853*wn.z/wn.w, capW*.46 - foot)/h;
}
// A BOLT SEEN THROUGH AN OPENING: a drawn zigzag with one branch, grown from the rim side in 0.33 s (pxq = one pixel in q)
float winBolt(vec2 q, float pxq, float age, float flip){
  q.x *= flip;
  float y = q.y, t = (1.05 - y)/1.8;
  float xz = .3*(abs(fract(y*1.3 + .2) - .5)*4. - 1.) + .1*sin(y*8.);
  float hw = max(.07, 1.3*pxq);
  float m = 1. - smoothstep(hw, hw + pxq, abs(q.x - xz));
  float xb = -.208 + (.25 - y)*1.1 + .08*sin(y*14.);
  float mb = (1. - smoothstep(hw*.7, hw*.7 + pxq, abs(q.x - xb)))*step(y, .25)*step(-.45, y);
  return max(m, mb*.9)*step(t, age/.33)*step(0., age);
}
#endif
void main(){
  float pxa = length(dFdx(vP)), pxb = length(dFdy(vP)), px = max(pxa, pxb), pxg = sqrt(max(pxa*pxb, 1e-8));
  float dE = fwidth(vData.y), dT = fwidth(vData.x);
  float kind = vAux.y, ter = vData.x, edge = vData.y, foot = vData.z, capW = vData.y + vData.z, pxE = dE;
  if(kind > 1.5){ float tc = clamp(ter, 0., 7.999); capW = max(vData.z, 1e-3); ter = floor(tc); edge = fract(tc)*capW; foot = capW - edge; pxE = dT*capW; }
  else ter = floor(ter + .5);
  float riser = step(.5, kind)*step(kind, 1.5);
  #ifdef HORN
  float winA = min(hornWin(uWin[0], ter, kind, vAux.x, foot, capW), hornWin(uWin[1], ter, kind, vAux.x, foot, capW));
  float winB = hornWin(uWin[2], ter, kind, vAux.x, foot, capW), winC = hornWin(uWin[3], ter, kind, vAux.x, foot, capW);
  float winD = min(winA, min(winB, winC));
  #endif
  float age = vAux.z, R = vAux.w, rev = step(.95, vLoc.z), lift = floor(fract(vLoc.z)*10. + .5);   // aInst.z = rev + lift/10
  float dk = step(7.5, lift), dk2 = step(8.5, lift), bd = step(6.5, lift)*(1. - dk);   // lift 8 = the deep dye (core stops at mid
  lift *= (1. - dk)*(1. - bd);                                       // indigo), 9 = the deepest (core stops at indigo), 7 = the plain body
  float idx = mix(mix(mix(lift + ter*(7. - lift)/7., ter, bd), mix(floor(ter*.58 + .5), floor(ter*.36 + .5), dk2), dk), 6. - ter, rev) - riser*(1. - bd);
  float under = step(idx, -.5); idx = clamp(idx, 0., 7.);
  int ii = int(idx + .5);
  vec3 fill = uRamp[ii]*(1. - .16*under*rev)*(1. - .05*riser);
  // depth between the great curl's rings: each riser steps darker in three flat bands as it runs back to the next lip
  fill *= 1. - .2*rev*riser*floor(clamp(edge/max(capW, 1e-3), 0., .999)*3.);
  float vd, ch;
  float vein = bkVeins(vP, px, R > 110. ? 70. : 14., vd, ch)*(1. - .45*bd)*(1. - .6*uStair);   // (the staircase is drawn, not crackled: see uStair below)
  // THE GOLD WAX LINE: the outermost lip of every curl (every lip of the great curl, the first of each plate of the
  // staircase) keeps its wax, so one gold line runs through the whole flight; it is drawn 1.6 times as wide
  float gw = (1. - riser)*step(ter, uGoldTer);
  vec2 lh = bkLine(edge*mix(1., .62, gw), riser > .5 ? capW*.6 : capW, vData.w, pxE*mix(1., .62, gw));
  float line = lh.x;
  // THE STAIRCASE AS CLOUD TOPS (uStair): its treads step darker in three flat bands toward the next face, each band
  // hemmed with a cream echo of the lip, and each face stands on a row of half-round scales (sisik), so the plates
  // under the lens read as drawn, lobed cloud and never as a pale crackled sheet
  fill *= 1. - .13*uStair*riser*floor(clamp(edge/max(capW, 1e-3), 0., .999)*3.);
  if(riser > .5 && (capW > 10. || uStair > .5)){ float sw = capW/3.; float qd = abs(fract(edge/sw + .5) - .5)*sw; float hw = max(capW*.011, .8*pxE);
    line = max(line, (1. - smoothstep(hw, hw + max(pxE, .05), qd))*.85*(1. - smoothstep(.2, .5, pxE/sw))); }
  if(riser < .5 && kind < 1.5 && capW > 1.6){   // cecek: two rows of resist dots tracing each lip, only where the cap is seen close
    float csp = max(capW*.11*uDot, .3), crr = csp*.21, pxs = max(px, 1e-4);
    float cu = (fract(vData.w/csp) - .5)*csp, cu2 = (fract(vData.w/csp + .5) - .5)*csp;
    float cd = min(length(vec2(cu, edge - max(capW*.3, .75))), length(vec2(cu2, edge - max(capW*.62, 1.3))));
    line = max(line, .9*(1. - smoothstep(crr - min(pxs, crr), crr + pxs, cd))*(1. - smoothstep(crr*.6, crr*1.6, pxg)));
  }
  if(uStair > .5 && riser < .5){
    float cw = max(capW*.45, .9), pxs = max(px, 1e-4), su = (fract(vData.w/cw) - .5)*cw, su2 = (fract(vData.w/cw + .5) - .5)*cw;
    float d1 = length(vec2(su, foot)), d2 = length(vec2(su2, foot - cw*.42)), sl = max(capW*.016, .8*pxs);
    float sd = min(abs(d1 - cw*.42), d1 > cw*.42 ? abs(d2 - cw*.42) : 1e3);            // two overlapping rows of scales
    line = max(line, .85*(1. - smoothstep(sl, sl + pxs, sd))*(1. - smoothstep(.12, .3, pxs/cw)));
  }
  float hfil = 0., hrib = 0.;
  #ifdef HORN
  // THE GREAT CURL'S CAPS NEAR THE LENS: wherever a cap comes within about 60 m of the lens (a rule in the world: the
  // distance to the camera, whichever lip it is) it carries filler in cream under its gold line (a cap sweeping past
  // a few metres off was the largest plain fill of the flight): two overlapping rows of half-round scales standing
  // on its foot and a cream echo line over them; beyond 80 m the far rings stay clean. THE OUTER LIPS (caps over
  // 14 m wide: lips 1 to 3) carry the same band a second time in the MIDDLE of the cap, between the two rows of
  // dots, standing on a cream echo line of its own: their feet lie out of sight when the cap sweeps past the lens.
  // On the two PALE caps (the rim and lip 1), where cream on the palest wash does not show, the band lies on a
  // ribbon dyed two steps darker (hrib), so the scales and echo lines read as cream lace on blue, like the
  // staircase's treads (on the rim's cap, which has a line on both edges, the scales stand either side of its middle).
  if(riser < .5 && kind < .5 && capW > 4.){
    // (the two pale caps, the rim's and lip 1's, are the widest fills of the sweep and come into view edge-first from
    // far off: they carry their ribbon and scales from 150 m, in full within 95 m; the inner rings from 80 m, in full within 42)
    float pale = step(4.5, idx);
    float hk = 1. - smoothstep(mix(42., 95., pale), mix(80., 150., pale), distance(vP, cameraPosition));
    float ff = ter < .5 ? abs(capW*.5 - edge) : foot;
    float cw = max(capW*.2, .9), pxs = max(px, 1e-4), su = (fract(vData.w/cw) - .5)*cw, su2 = (fract(vData.w/cw + .5) - .5)*cw;
    float d1 = length(vec2(su, ff)), d2 = length(vec2(su2, ff - cw*.42)), sl = max(capW*.01, .8*pxs);
    float sd = min(min(abs(d1 - cw*.42), d1 > cw*.42 ? abs(d2 - cw*.42) : 1e3), abs(ff - cw*1.02));
    float rb = ter < .5 ? 1. - smoothstep(cw*1.02, cw*1.02 + pxs, ff) : 0.;
    if(ter > .5 && capW > 14.){
      float fm = foot - capW*.43;
      float e1 = length(vec2(su2, fm)), e2 = length(vec2(su, fm - cw*.42));
      float sm = fm > 0. ? min(min(abs(e1 - cw*.42), e1 > cw*.42 ? abs(e2 - cw*.42) : 1e3), abs(fm - cw*1.02)) : 1e3;
      sd = min(sd, min(sm, abs(fm)));
      rb = smoothstep(-pxs, 0., fm)*(1. - smoothstep(cw*1.02, cw*1.02 + pxs, fm));
    }
    float clearW = smoothstep(.5, 3., winD);                            // (the band stops short of a window's hem)
    hfil = hk*.85*(1. - smoothstep(sl, sl + pxs, sd))*(1. - smoothstep(.12, .3, pxs/cw))*clearW;
    hrib = hk*rb*step(4.5, idx)*clearW;
  }
  #endif
  float pool = 1. - .2*(1. - smoothstep(0., max(capW*.17, .6), foot))*(1. - under);
  vec3 veinCol = ii > 1 ? uRamp[ii - 1] : uRamp[2]*.8;
  vec3 dye = mix(fill*lh.y*pool, veinCol, vein*.62);
  #ifdef HORN
  { int ir = int(max(idx - 2., 0.) + .5); dye = mix(dye, mix(uRamp[ir], uRamp[ir > 0 ? ir - 1 : 0], vein*.62)*lh.y, hrib*.85); }
  #endif
  dye = mix(dye, mix(uLine, uRamp[2], vein*.75), hfil);
  vec3 lineCol = mix(mix(uLine, uRamp[2], vein*.75), uGold*.9, gw);
  lineCol = bkGild(lineCol, vP);
  float cov = 1.; vec3 glow = vec3(0.);
  if(age < 5.2){
    if(age <= 0.) discard;
    float up = clamp(vLoc.y*.5 + .5, 0., 1.);
    float tv = .8*(.6*up + .4*ch);
    float vs = smoothstep(tv, tv + .12, age)*vein;
    float t0 = .8 + ter*.175, head = (age - t0)/.175;
    float drawn = step(0., head)*step(vAux.x, head);
    float lwp = max(max(capW*.085, .3), 1.6*pxE);                    // a pen line on the cap side of each lip, never a band
    float wl = (1. - smoothstep(lwp, lwp + max(pxE, .05), edge))*drawn*(1. - riser);
    float bw = max(3.2*max(capW*.085, .3), 7.*pxE);
    float bead = (1. - smoothstep(bw*.6, bw, edge))*drawn*step(head - .05, vAux.x)*step(head, 1.05);
    float tf = 2.2 + 1.8*(.62*ter/7. + .16*ch), rr = (age - tf)/.42;
    float filled = 1. - smoothstep(rr - .12, rr, vd*.999 + .001);
    filled *= step(0., rr);
    float waxK = smoothstep(4., 4.8, age);
    vec3 wcol = mix(uWax*.85, lineCol, waxK);
    float lineNow = max(wl, line*filled);
    vec3 c = mix(uCloth, mix(uRamp[2], dye, filled), max(filled, vs));
    dye = c; lineCol = wcol; line = lineNow;
    cov = max(max(filled, vs), wl);
    glow = uGold*2.5*bead;
    if(cov < .03 && bead < .03) discard;
  }
  glow += uGold*2.1*rev*gw*line*(1. - smoothstep(.006, .016, abs(fract(vAux.x*3. - uTime*.045 + ter*.29) - .5)));
  vec3 col = mix(dye, lineCol, line)*bkCloth(vP, px) + glow;
  #ifdef HORN
  { float hem = max(1., 1.7*px);                                       // the opening's hem: gold wax, with dye pooled beside it
    col *= 1. - .22*(1. - smoothstep(hem, hem*2.6, winD));
    col = mix(col, bkGild(uGold*.9, vP), 1. - smoothstep(hem, hem + px, winD)); }
  #endif
  #ifdef USE_FOG
  col = bkFade(col, vFogDepth);
  #endif
  #ifdef HORN
  if(winD < 0.){
    // through the opening: the cloth dome itself, drawn as the dome draws it (its crackle lives in view-direction
    // space, so it holds still behind the turning lips exactly as a hole onto the sky would show it). It is drawn and
    // not cut, because the dark body sheet of the towers lies behind the lips and would fill a real hole.
    vec3 wd = vP - cameraPosition; float wl = max(length(wd), 1e-3); wd /= wl;
    float pxd = px/wl; vec2 sv = bkVor(wd*13. + 3.1);
    float shw = max(.0018, pxd*13.*.22), svein = 1. - smoothstep(shw, shw + pxd*13.*.8, sv.x);
    float dark = 1. - step(.3, uCloth.r + uCloth.g);
    col = mix(uCloth, mix(uSoga*1.25, uRamp[4], dark), mix(.17, .14, dark)*svein*.8);
    // a tower bolt seen through the third opening (keyed to the route by uWinBolt.x; the fourth slot is empty)
    float hq = max(capW*.34, 1e-3), bAge = winB < 0. ? uWinBolt.x : uWinBolt.y;
    vec2 bq = winB < 0. ? hornWinQ(uWin[2], vAux.x, foot, capW) : hornWinQ(uWin[3], vAux.x, foot, capW);
    float bm = (winB < 0. || winC < 0.) ? winBolt(bq, px/hq, bAge, winB < 0. ? 1. : -1.) : 0.;
    vec3 bc = mix(vec3(1., .82, .4)*3.2, uGold*1.7, smoothstep(.05, .6, bAge));
    col = mix(col, mix(bc, uSoga*.85, smoothstep(.8, 3., bAge)), bm);
  }
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// The world's material factory: every terraced surface of the world can be shaded with this one program.
//   shared   the object from batikUniforms() (palette, time, progress, flash): pass the hero's `hero.uniforms`
//   breathe  terrace breathing along `normal`, in geometry units (curls: 0.016 of a unit curl; metres for a 1:1 mesh)
//   rock     radians each instance rocks in its own plane;  billow  metres of the cloth wave along the instance's z axis
//   horn     true only for the great curl's own mesh (it needs the aHornA / aHornB attributes of buildGreatCurl): the
//            iris of travelling scallops and the windows (`windows`: three Vector4, see hornWin)
export function styleMaterial({ shared, breathe = 0.016, rock = 0.07, billow = 1.5, dot = 1, goldTer = 0.5, side = THREE.DoubleSide, horn = false, windows = null, stair = 0 } = {}) {
  const sh = shared || batikUniforms(batikPalette());
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...sh, uBreathe: { value: breathe }, uRock: { value: rock }, uBillow: { value: billow }, uDot: { value: dot }, uGoldTer: { value: goldTer }, uStair: { value: stair } };
  if (horn) { uniforms.uWin = { value: windows || [new THREE.Vector4(-9, 0, 1, 1), new THREE.Vector4(-9, 0, 1, 1), new THREE.Vector4(-9, 0, 1, 1), new THREE.Vector4(-9, 0, 1, 1)] }; uniforms.uWinBolt = { value: new THREE.Vector4(-1, -1, 0, 0) }; }
  return new THREE.ShaderMaterial({ uniforms, vertexShader: TERRACE_VERT, fragmentShader: TERRACE_FRAG, fog: true, side, defines: horn ? { HORN: 1 } : {} });
}

// =====================================================================================================================
// the mega-mendung curl: outline and terraced geometry
// =====================================================================================================================
const HSTEP = 0.0667;   // riser height of a unit curl (half-width 1): 8 risers, the core stands 0.53 proud
const SKIRT = 0.07;     // the rim riser runs this far below the curl's plane so no gap shows under it

// A lobed outline of n scallops with a hooked tail, as m points per scallop (cusps fall on vertices).
// Returns { x, y, r, arc, af, N, perim } with index 0 at the tail tip; x right, y = motif up, half-width about 1.
// THE TAIL IS A DRAWN HOOK, NOT A FOLDED TRIANGLE: it is half as long again as the curl is wide, and at even spacing
// only four or five points fell on it, so on a wall curl 150 m off it hung under the cap as a flat striped triangle
// with ruler edges. `extra` more points go to the scallops the tail lies in, and inside the tail's window the points
// are spaced by length along the line instead of by angle, so its two long sides are curves of 2-3 m chords. af is
// each point's fraction of the turn from the tail tip (what i / N was when the spacing was even).
// bare = true: the same outline with its tail tucked away (scallops all the way round; the same random draws). For
// the canyon's upper row only: the camera passes beside and below those curls, and from there a tail is not a drawn
// hook but a flat striped triangle hanging under the cap, cut off ruler-straight by the rim riser in front of it.
function curlOutline(rng, n, m, extra = 0, bare = false) {
  const th0 = rng.range(0, Math.PI * 2 / n);
  const ry = rng.range(0.54, 0.68), ampTop = rng.range(0.2, 0.28), ampBot = rng.range(0.06, 0.11);
  const lobeAmp = []; for (let j = 0; j <= n; j++) lobeAmp.push(rng.range(0.5, 1.3));
  const ex = rng.range(-0.1, 0.1), ey = rng.range(0.1, 0.2);
  const tailA = rng.range(-0.5, -0.22), tailW = rng.range(0.17, 0.23), tailL = rng.range(0.42, 0.62), hook = rng.range(0.45, 0.7);
  const at = (th, k) => {
    const c = Math.cos(th), s = Math.sin(th);
    const r0 = ry / Math.sqrt(ry * ry * c * c + s * s);
    const bump = Math.pow(Math.abs(Math.sin(n * (th - th0) * 0.5)), 0.8);
    const amp = lerp(ampBot, ampTop, smoothstep(-0.35, 0.3, s)) * lobeAmp[k];
    let d = th - tailA; d = Math.atan2(Math.sin(d), Math.cos(d));
    const tb = Math.exp(-(d / tailW) * (d / tailW));
    if (bare) { const r = r0 * (1 - amp * (1 - bump)); return [r * Math.cos(th), r * Math.sin(th), tb]; }
    const r = r0 * (1 - amp * (1 - bump) * (1 - tb)) * (1 + tailL * tb);
    const a = th - hook * tb * tb;
    return [r * Math.cos(a), r * Math.sin(a), tb];
  };
  // how many times faster than the plain oval the line runs at th, inside the tail's window (1 = even spacing)
  const dens = (th, k) => {
    let d = th - tailA; d = Math.atan2(Math.sin(d), Math.cos(d)) / (2.4 * tailW); const win = Math.exp(-d * d * d * d);
    const p0 = at(th - 0.004, k), p1 = at(th + 0.004, k);
    return 1 + win * Math.max(0, Math.min(6, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 0.008 / 0.8) - 1);
  };
  const ths = [], lobeOf = [], wS = Math.PI * 2 / n, SUB = 48, share = [], cdfs = [];
  let shareSum = 0;
  for (let k = 0; k < n; k++) {
    const cdf = new Float32Array(SUB + 1);
    for (let j = 0; j < SUB; j++) cdf[j + 1] = cdf[j] + dens(th0 + (k + (j + 0.5) / SUB) * wS, k);
    cdfs.push(cdf); share.push(cdf[SUB] - SUB); shareSum += cdf[SUB] - SUB;
  }
  { let given = 0; const want = share.map((t) => extra * t / Math.max(shareSum, 1e-6)), cnt = want.map((w) => { const c = Math.floor(w); given += c; return c; });
    const order = want.map((w, k) => k).sort((a, b) => (want[b] % 1) - (want[a] % 1));
    for (let j = 0; given < extra; j++, given++) cnt[order[j % n]]++;
    for (let k = 0; k < n; k++) {
      const mk = m + cnt[k], cdf = cdfs[k];
      for (let i = 0, j = 0; i < mk; i++) { const w = (i / mk) * cdf[SUB]; while (cdf[j + 1] < w) j++; ths.push(th0 + (k + (j + (w - cdf[j]) / (cdf[j + 1] - cdf[j])) / SUB) * wS); lobeOf.push(k); }
    } }
  const N = ths.length, px = [], py = []; let tip = 0, tipV = -1;
  for (let i = 0; i < N; i++) { const p = at(ths[i], lobeOf[i]); px.push(p[0]); py.push(p[1]); if (p[2] > tipV) { tipV = p[2]; tip = i; } }
  let mx = 0; for (let i = 0; i < N; i++) mx = Math.max(mx, Math.abs(px[i]));
  const o = { N, x: new Float32Array(N + 1), y: new Float32Array(N + 1), r: new Float32Array(N + 1), arc: new Float32Array(N + 1), af: new Float32Array(N + 1), perim: 0, ry, ex, ey };
  for (let i = 0; i <= N; i++) { const j = (i + tip) % N; o.x[i] = px[j] / mx; o.y[i] = py[j] / mx; o.r[i] = Math.hypot(o.x[i], o.y[i]); o.af[i] = i === N ? 1 : (ths[j] - ths[tip] + (j < tip ? Math.PI * 2 : 0)) / (Math.PI * 2); }
  for (let i = 1; i <= N; i++) o.arc[i] = o.arc[i - 1] + Math.hypot(o.x[i] - o.x[i - 1], o.y[i] - o.y[i - 1]);
  o.perim = o.arc[N];
  return o;
}

class GeoBuf {
  constructor() { this.pos = []; this.nor = []; this.data = []; this.aux = []; this.idx = []; this.n = 0; }
  v(x, y, z, nx, ny, nz, ter, edge, foot, arcF, kind, arcL) { this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.data.push(ter, edge, foot, arcF); this.aux.push(kind, arcL); return this.n++; }
  quadStrip(a0, b0, N) { for (let i = 0; i < N; i++) this.idx.push(a0 + i, b0 + i, a0 + i + 1, b0 + i, b0 + i + 1, a0 + i + 1); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(this.data, 4));
    g.setAttribute('aAux', new THREE.Float32BufferAttribute(this.aux, 2));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    return g;
  }
}

// full = true: seven real terraces (caps and risers, 31 N triangles). full = false: a lobed cone whose steps and
// lines are cut in the fragment shader (3 N triangles) for curls that are never seen close.
function curlGeometry(o, full) {
  const b = new GeoBuf(), N = o.N;
  const ring = (f, z, ter, kind, edgeOf, footOf) => {
    const first = b.n;
    for (let i = 0; i <= N; i++) b.v(o.x[i] * f + o.ex * (1 - f), o.y[i] * f + o.ey * (1 - f), z, 0, 0, 1, ter, edgeOf(i), footOf(i), o.af[i], kind, o.arc[i] * Math.max(f, 0.3));
    return first;
  };
  const capW = (i) => o.r[i] / 8;
  if (full) {
    for (let t = 0; t < 8; t++) {
      const f = 1 - t / 8, z0 = t === 0 ? -SKIRT : t * HSTEP, z1 = (t + 1) * HSTEP, H = z1 - z0;
      const r0 = ring(f, z0, t, 1, () => H, () => 0), r1 = ring(f, z1, t, 1, () => 0, () => H);
      b.quadStrip(r0, r1, N);
      if (t < 7) {
        const c0 = ring(f, z1, t, 0, () => 0, capW), c1 = ring(1 - (t + 1) / 8, z1, t, 0, capW, () => 0);
        b.quadStrip(c0, c1, N);
      } else {
        const c0 = ring(f, z1, t, 0, () => 0, () => 9);
        for (let i = 0; i < N; i++) { const c = b.v(o.ex, o.ey, z1, 0, 0, 1, t, capW(i), 9, (o.af[i] + o.af[i + 1]) * 0.5, 0, 0); b.idx.push(c0 + i, c, c0 + i + 1); }
      }
    }
  } else {
    const r0 = ring(1, -SKIRT, 0, 1, () => HSTEP + SKIRT, () => 0), r1 = ring(1, HSTEP, 0, 1, () => 0, () => HSTEP + SKIRT);
    b.quadStrip(r0, r1, N);
    const c0 = ring(1, HSTEP, 0, 2, () => 0, capW);
    for (let i = 0; i < N; i++) { const c = b.v(o.ex, o.ey, 8 * HSTEP, 0, 0, 1, 8, 0, (capW(i) + capW(i + 1)) * 0.5, (o.af[i] + o.af[i + 1]) * 0.5, 2, 0); b.idx.push(c0 + i, c, c0 + i + 1); }
  }
  const g = b.build();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0.2), 1.6);
  return g;
}

// one InstancedMesh from a list of placed curls: { m: Matrix4 (rest pose), birth, phase, rev, motion }
function instanced(geo, mat, list) {
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const inst = new Float32Array(list.length * 4);
  list.forEach((c, i) => { mesh.setMatrixAt(i, c.m); inst[i * 4] = c.birth ?? -1; inst[i * 4 + 1] = c.phase ?? 0; inst[i * 4 + 2] = (c.rev ?? 0) + 0.1 * (c.lift || 0); inst[i * 4 + 3] = c.motion ?? 1; });
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

// =====================================================================================================================
// the route the piece is built around (hero-local metres; the camera arrives from +Z flying toward -Z)
// =====================================================================================================================
const FLY = [
  [0, 5, 420], [0, 6, 300], [0, 8, 120], [0, 24, 40], [0, 62, -40], [0, 113, -140], [0, 164, -240], [0, 203, -316],
  [0, 216, -362], [0, 211, -410], [0, 205, -460], [0, 202, -500], [0, 200, -540],
  [-5.9, 200, -594.1], [-23.4, 200, -645.7], [-51.7, 200, -692.2], [-89.3, 200, -731.5], [-120, 200, -757.2], [-150.6, 200, -782.9],
];
const ARC_START = new THREE.Vector3(0, 200, -540);
const NOSE_Y = 45, LIP_Y = 220, LIP_Z = -340, SLOPE = 0.515, CLEAR = 13;
const STAIR_DROP = 13.2, STAIR_HALF = 96;                   // the staircase lies this far under the route; its half-width
// The notch, the canyon and the great curl shift `sx` metres along the lip (by seed): the climb slants over to them.
export const shiftAt = (z, sx) => { const t = clamp((40 - z) / 356, 0, 1); return sx * t * t * (3 - 2 * t); };
const flyPoints = (sx) => FLY.map((p) => [p[0] + shiftAt(p[2], sx), p[1], p[2]]);
const HORN_R = [118, 95, 75, 58, 43, 30, 19, 9.5];          // outline radii: rim, then the seven lips
const HORN_S = [95, 132, 166, 196, 222, 246, 268];          // metres along the route from ARC_START to each lip's plane
const HORN_OFF = [75, 50, 28, 10, 0, 0, 0], HORN_DROP = [14, 9, 5, 2, 0, 0, 0];   // the outer lips stand left of and below the route (a whorl from the canyon); from lip 4 on the rings are centred on it and on the portal
const T_ARRIVAL = 0.39, T_BOLT = 0.69, T_WIN = T_BOLT + 1.5 / DURATION;   // (T_WIN: the answering strike inside the great curl's window, a second and a half after the hero bolt)

function sampleRoute(path, sx) {
  const n = Math.ceil(path.length / 3), a = new Float32Array((n + 1) * 3), v = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { path.posAtDist((i / n) * path.length, v); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
  const dist = (x, y, z) => { let b = 1e12; for (let i = 0; i <= n; i++) { const dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  let bi = 0, bd = 1e12; for (let i = 0; i <= n; i++) { const d = Math.hypot(a[i * 3] - ARC_START.x - sx, a[i * 3 + 2] - ARC_START.z); if (d < bd) { bd = d; bi = i; } }
  // the climb as a function of z (z falls steadily from the entry to the notch): x and y of the route above that z
  const zs = [], xs = [], ys = [];
  for (let d = 0; d <= path.length; d += 2) { path.posAtDist(d, v); if (zs.length && v.z > zs[zs.length - 1] - 0.05) break; zs.push(v.z); xs.push(v.x); ys.push(v.y); if (v.z < -540) break; }
  const atZ = (z) => {
    let lo = 0, hi = zs.length - 1;
    if (z >= zs[0]) return { x: xs[0], y: ys[0] }; if (z <= zs[hi]) return { x: xs[hi], y: ys[hi] };
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zs[m] > z) lo = m; else hi = m; }
    const t = (zs[lo] - z) / (zs[lo] - zs[hi]); return { x: lerp(xs[lo], xs[hi], t), y: lerp(ys[lo], ys[hi], t) };
  };
  // the same against a short list of samples (near(): those within rad of a point), for testing many vertices of one curl
  const near = (x, y, z, rad) => { const o = []; for (let i = 0; i <= n; i++) { const dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < rad * rad) o.push(i); } return o; };
  const distIn = (list, x, y, z) => { let b = 1e12; for (let k = 0; k < list.length; k++) { const i = list[k], dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  // the nearest route sample to a point (into `out`), and its distance
  const nearest = (x, y, z, out) => { let b = 1e12, k = 0; for (let i = 0; i <= n; i++) { const dx = a[i * 3] - x, dy = a[i * 3 + 1] - y, dz = a[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; k = i; } } out.set(a[k * 3], a[k * 3 + 1], a[k * 3 + 2]); return Math.sqrt(b); };
  return { dist, near, distIn, nearest, arcStart: (bi / n) * path.length, atZ };
}

// =====================================================================================================================
// THE STAIRCASE: the tongue of the shelf that the route climbs. Seventeen or so plates laid from a low scud tip ahead
// of the nose up to the notch in the lip, each plate five nested lobed lips (a wide mega-mendung band seen from above:
// indigo rim to pale crest). The climbing camera looks UP the slope, so what it sees of a lip is its face: each face is
// 3-6 m high with a scalloped crest carrying the cream line and two rows of resist dots, and a darker tread behind it.
// Every crest lies at least STAIR_DROP under the route, so the climb rides 11-12 m over the nearest lip.
// =====================================================================================================================
async function buildStairs(route, rng, ctx) {
  const b = new GeoBuf(), M = 96, xs = [], TER = [2, 3, 4, 5], WID = [0.26, 0.22, 0.22, 0.3], NS = TER.length;
  for (let i = 0; i <= M; i++) { const t = (i / M) * 2 - 1; xs.push(STAIR_HALF * Math.sign(t) * Math.pow(Math.abs(t), 1.25)); }
  // the crest line of every lip, tip first: lobed forward (A) and upward (Av), the lobes of one plate nested, those of
  // the next plate half a lobe along, like scales
  const edges = [], lam = rng.range(26, 31), ph0 = rng.range(0, 1);
  let zf = 60; while (route.atZ(zf + 4).y - STAIR_DROP - 1.7 < 7.5 && zf > 0) zf -= 2;
  const zTop = -326;   // (the top plate ends 14 m short of the lip, so from the top of the notch the lens sees down past it to the whole of the great curl)
  for (let g = 0; zf > zTop; g++) {
    const Lp = rng.range(32, 38), ph = ph0 + (g % 2) * 0.5 + rng.range(-0.08, 0.08), A = rng.range(3.2, 4.4) * 1.55, Av = rng.range(1.2, 1.7), skew = rng.range(-0.05, 0.05);
    for (let j = 0; j < NS && zf > zTop; j++) {
      const c = route.atZ(zf + A), yc = c.y - STAIR_DROP - Av, Rc = lerp(45, 125, smoothstep(30, -120, zf)), sideDrop = Math.min(16, Math.max(yc, 0) * 0.4);
      const e = { ter: TER[j], y: new Float32Array(M + 1), x: new Float32Array(M + 1), z: new Float32Array(M + 1), arc: new Float32Array(M + 1) };
      for (let i = 0; i <= M; i++) {
        const xr = xs[i], lobe = (1 - 0.15 * j) * Math.pow(Math.abs(Math.sin(Math.PI * (xr / lam + ph))), 0.8);
        e.x[i] = c.x + xr; e.z[i] = zf - xr * xr / (2 * Rc) + xr * skew + A * lobe; e.y[i] = yc + Av * lobe - sideDrop * smoothstep(58, STAIR_HALF, Math.abs(xr));
        if (i) e.arc[i] = e.arc[i - 1] + Math.hypot(e.x[i] - e.x[i - 1], e.z[i] - e.z[i - 1]);
      }
      edges.push(e); zf -= Lp * WID[j];
    }
  }
  await ctx.yield();
  const NY = 0.5, NZ = 0.87;
  const ring = (e, yOf, ter, kind, edgeOf, footOf) => { const first = b.n; for (let i = 0; i <= M; i++) b.v(e.x[i], yOf(i), e.z[i], 0, NY, NZ, ter, edgeOf(i), footOf(i), i / M, kind, e.arc[i]); return first; };
  for (let k = 0; k < edges.length; k++) {
    const e = edges[k], prev = edges[k - 1], next = edges[k + 1];
    if (k % 4 === 3) await ctx.yield();
    // the face of the lip, which is what the climbing camera sees: shaded as a cap (kind 0: line at the crest, dot rows)
    const H = (i) => (prev ? Math.max(e.y[i] - prev.y[i], 0.5) : 4.5);
    b.quadStrip(ring(e, (i) => e.y[i] - H(i), e.ter, 0, H, () => 0), ring(e, (i) => e.y[i], e.ter, 0, () => 0, H), M);
    // the tread behind it, one step darker (kind 1), running back to the foot of the next face
    if (next) {
      const W = (i) => Math.max(Math.hypot(next.x[i] - e.x[i], next.z[i] - e.z[i]), 0.5);
      b.quadStrip(ring(e, (i) => e.y[i], e.ter, 1, () => 0, W), ring(next, (i) => e.y[i], e.ter, 1, W, () => 0), M);
    } else {
      // the last lip: a 7 m tread and a skirt falling into the canyon behind the notch
      const back = { x: e.x, z: e.z.map((z) => z - 7), arc: e.arc };
      b.quadStrip(ring(e, (i) => e.y[i], e.ter, 1, () => 0, () => 7), ring(back, (i) => e.y[i], e.ter, 1, () => 7, () => 0), M);
      b.quadStrip(ring(back, (i) => e.y[i], e.ter, 1, () => 0, () => 34), ring(back, (i) => e.y[i] - 34, e.ter, 1, () => 34, () => 0), M);
    }
  }
  // clearance achieved at rest (every crest vertex)
  await ctx.yield();
  let clear = 1e9;
  // (against the route samples within 210 m of the lip's middle: every crest vertex lies within 96 m of it and under
  // 100 m from the route, so the nearest sample is always among them)
  let ne = 0;
  for (const e of edges) { const h = M >> 1, list = route.near(e.x[h], e.y[h], e.z[h], 210); for (let i = 0; i <= M; i++) clear = Math.min(clear, route.distIn(list, e.x[i], e.y[i], e.z[i])); if (++ne % 5 === 0) await ctx.yield(); }
  await ctx.yield();
  const g = b.build(); g.computeBoundingSphere();
  return { geometry: g, tris: b.idx.length / 3, clear, lips: edges.length };
}

// The great curl: a horn of seven lobed lips stepping in and back from a 236 m mouth to the 19 m throat that holds the
// portal. Lips are perpendicular to the route; their centres start 76 m to the LEFT of it and below it and close on it,
// so the camera enters hard against the right-hand terraces and the rings read as a whorl. Dyed in reverse.
async function buildGreatCurl(path, route, rng, ctx) {
  const b = new GeoBuf(), M = 192, up = new THREE.Vector3(0, 1, 0);
  const lobes = rng.int(9, 13), twist = rng.range(0.25, 0.45) * rng.sign(), tailB = Math.PI - rng.range(-0.9, -0.45);   // (tailB: where the rim's hooked tail hangs, 26 to 52 degrees below the level on the whorl's WIDE side: see rad)
  // per vertex, for the iris (see TERRACE_VERT): its unit radial direction, its lobe phase at rest, the lobe depth of
  // its outline and the rate its scallops travel (alternate lips turn against each other at 0.05 rad/s; the rim holds)
  const hA = [], hB = [], lobeA = (q) => lerp(0.105, 0.045, q / 7), SPIN = 0.05;
  const hv = (S, beDir, be0, q, k = 1) => {
    const c = Math.cos(beDir), sn = Math.sin(beDir);
    hA.push(S.right.x * c, sn, S.right.z * c, lobes * (be0 - q * twist) * 0.5);
    hB.push(q > 0 ? HORN_R[q] * lobeA(q) * k : 0, q > 0 ? lobes * 0.5 * SPIN * (q % 2 ? 1 : -1) : 0);
  };
  const tailBump = (be) => { let d = be - tailB; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.exp(-(d / 0.26) * (d / 0.26)); };
  const tailTurn = (be, k) => { const tb = tailBump(be); return be + 0.42 * k * tb * tb; };   // (the hook: the swollen part is carried on round the rim, the tip furthest)
  const st = [];
  for (let k = 0; k < 7; k++) {
    const s = route.arcStart + HORN_S[k], P = path.posAtDist(s), H = path.tangentAtDist(s); H.y = 0; H.normalize();
    const right = new THREE.Vector3(-H.z, 0, H.x), C = P.clone().addScaledVector(right, -HORN_OFF[k]); C.y -= HORN_DROP[k];
    st.push({ s, P, H, right, C });
  }
  const end = path.posAtDist(path.length), Hend = st[6].H, back = { H: Hend, right: st[6].right, C: end.clone().addScaledVector(Hend, 6) };
  // radius of outline `q` (0 = rim .. 7 = innermost lip) at angle be
  const rad = (q, be) => {
    const A = lerp(0.105, 0.045, q / 7), bump = Math.pow(Math.abs(Math.sin(lobes * (be - q * twist) * 0.5)), 0.8);
    let r = HORN_R[q] * (1 - A * (1 - bump));
    // THE RIM'S HOOKED TAIL (the brief's motif: every mega-mendung curl ends in one): the outer lip swells by 36% over
    // about 30 degrees at tailB and its tip is swept on round the rim (tailTurn, in ring), so the line hooks. It hangs on
    // the whorl's own wide side: the rings nest toward the right (HORN_OFF), the tail trails from the left, below
    // the level. (It once hung low on the right, the thin side, under the canyon's end.)
    if (q === 0) r *= 1 + 0.36 * tailBump(be);
    return r;
  };
  const p = new THREE.Vector3();
  // NO STEP AT THE CLOSEST PASS: every ring starts and ends on the LEFT of its lip (angle -pi .. pi), the side far from
  // the route, so the one place where the arc coordinate starts again (the line's wobble and the dot rows are drawn
  // from it) is 30 m or more from the lens and never on the right-hand lips the camera brushes at 9 m; and both
  // edges of a cap carry the same arc scale (arcR), so the dot rows are round all the way round and are not sheared
  // into dashes as the angle grows.
  const ring = (S, q, ter, kind, edge, foot, along = 0, arcR = HORN_R[q]) => {
    const first = b.n;
    for (let j = 0; j <= M; j++) {
      const be0 = (j / M - 0.5) * Math.PI * 2, r = rad(q, be0), be = q === 0 ? tailTurn(be0, 1) : be0;
      p.copy(S.C).addScaledVector(S.right, Math.cos(be) * r).addScaledVector(up, Math.sin(be) * r).addScaledVector(S.H, along);
      b.v(p.x, p.y, p.z, S.H.x, 0, S.H.z, ter, edge, foot, j / M - 0.5, kind, be0 * arcR); hv(S, be, be0, q);
    }
    return first;
  };
  // rim skirt (outside of the horn, running back into the towers) and the rim's own resist line
  b.quadStrip(ring(st[0], 0, 0, 1, 0, 42), ring(st[0], 0, 0, 1, 42, 0, 42), M);
  for (let k = 0; k < 7; k++) {
    const S = st[k], w = HORN_R[k] - HORN_R[k + 1];
    if (k === 0) {
      // the rim cap carries a line on both edges: split it down the middle
      const mid = b.n, R01 = (HORN_R[0] + HORN_R[1]) * 0.5;
      for (let j = 0; j <= M; j++) {
        const be0 = (j / M - 0.5) * Math.PI * 2, r = (rad(0, be0) + rad(1, be0)) * 0.5, be = tailTurn(be0, 0.5);
        p.copy(S.C).addScaledVector(S.right, Math.cos(be) * r).addScaledVector(up, Math.sin(be) * r);
        b.v(p.x, p.y, p.z, S.H.x, 0, S.H.z, 0, w * 0.5, w * 0.5, j / M - 0.5, 0, be0 * R01); hv(S, be, be0, 1, 0.5);
      }
      const o = ring(S, 0, 0, 0, 0, w, 0, R01), i2 = ring(S, 1, 0, 0, 0, w, 0, R01);
      b.quadStrip(o, mid, M); b.quadStrip(mid, i2, M);
    } else b.quadStrip(ring(S, k, k, 0, w, 0, 0, HORN_R[k + 1]), ring(S, k + 1, k, 0, 0, w), M);
    const N = k < 6 ? st[k + 1] : back, L = S.C.distanceTo(N.C);
    b.quadStrip(ring(S, k + 1, k, 1, 0, L), ring(N, k + 1, k, 1, L, 0), M);
    if (k % 2 === 1) await ctx.yield();
  }
  // ink back wall behind the portal
  const bw = ring(back, 7, 7, 0, 30, 30), bc = b.v(back.C.x, back.C.y, back.C.z, 0, 0, 1, 7, 30, 30, 0, 0, 0);
  hA.push(0, 0, 0, 0); hB.push(0, 0);
  for (let j = 0; j < M; j++) b.idx.push(bw + j, bc, bw + j + 1);
  // clearance actually achieved (lips are the only things near the route). The scallops travel, so every lip is taken
  // at its cusp radius all the way round: the nearest any lip can ever come.
  let clear = 1e9;
  await ctx.yield();
  for (let k = 0; k < 7; k++) for (let j = 0; j < M; j += 3) {
    const be = (j / M) * Math.PI * 2, r = HORN_R[k + 1] * (1 - lobeA(k + 1)), S = st[k];
    p.copy(S.C).addScaledVector(S.right, Math.cos(be) * r).addScaledVector(up, Math.sin(be) * r);
    clear = Math.min(clear, route.dist(p.x, p.y, p.z));
  }
  await ctx.yield();
  const g = b.build(); g.computeBoundingSphere();
  g.setAttribute('aHornA', new THREE.Float32BufferAttribute(hA, 4)); g.setAttribute('aHornB', new THREE.Float32BufferAttribute(hB, 2));
  return { geometry: g, stations: st, end, axis: Hend.clone(), clear, lobes, tris: b.idx.length / 3 };
}

// =====================================================================================================================
// the front: where every curl sits
// =====================================================================================================================
// Each curl: c (the centre of its base plane), n (the way its terraces rise), up (motif up), R (half-width), plus
// hz (height factor), mirror, birth (u at which THE ARRIVAL starts for it, or -1), variant (which outline).
function layoutFront(rng, noise, route, horn, detail, sx) {
  const curls = [], V = (x, y, z) => new THREE.Vector3(x, y, z);
  const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), bayX = rng.range(-8, 2), bayD = rng.range(40, 54), nx0 = rng.range(0, 50), nz0 = rng.range(0, 50);
  const noseZ = (x) => -(x / 3000) * (x / 3000) * 520 + 22 * Math.sin(x / 170 + p1) + 12 * Math.sin(x / 61 + p2)
    - bayD * Math.exp(-((x - bayX) / 36) * ((x - bayX) / 36)) + 16 * Math.exp(-((x - 30) / 16) * ((x - 30) / 16));
  const sizeAt = (x) => lerp(38, 165, smoothstep(110, 1150, Math.abs(x)));
  const towerTop = (x, z) => {
    const d = clamp((LIP_Z - z) / 2640, 0, 1);
    return (LIP_Y + 980 * Math.pow(d, 0.75) * (0.8 + 0.2 * noise.n2(x / 620 + nx0, z / 620 + nz0))) * (1 - 0.3 * smoothstep(1700, 3200, Math.abs(x)));
  };
  const add = (c, n, up, R, o = {}) => { const g = o.rng || rng, q = { c, n: n.normalize(), up, R, hz: o.hz ?? g.range(0.6, 0.88), ax: o.ax ?? g.range(1.0, 1.3), mirror: o.mirror ?? g.sign(), birth: o.birth ?? -1, variant: g.int(0, 2), phase: g.range(0, 6.28), keep: !!o.keep, tag: o.tag || '', lift: o.lift || 0 }; curls.push(q); return q; };
  const tilt = (deg, yaw = 0) => { const a = deg * Math.PI / 180; return V(Math.sin(a) * Math.sin(yaw), Math.cos(a), Math.sin(a) * Math.cos(yaw)); };   // deg from vertical, leaning toward +Z (yaw 0)

  // --- nose row: upright billows hanging off the leading edge
  for (let x = -3250; x < 3250;) {
    let R = sizeAt(x) * rng.range(0.85, 1.5); if (Math.abs(x) < 230) R = Math.min(R, 36);   // no big slabs beside the staircase's tip
    x += R * 0.66;
    const yaw = -x / 5200;
    const onStair = Math.abs(x - route.atZ(noseZ(x)).x) < 100;      // the staircase comes through here
    const xrN = Math.abs(x - route.atZ(noseZ(x)).x), deepN = xrN > 170 ? 9 : 8;   // the leading edge is deep-dyed too: only the staircase is pale
    // the billows either side of the staircase's tip (100-300 m from the route) lean out over the sea and turn toward
    // the route, so the camera coming in under them sees their caps as scallops, never a stack of plates edge-on
    const turnN = 1 - smoothstep(240, 300, xrN), sideN = Math.sign(x - route.atZ(noseZ(x)).x);
    const nq = add(V(x, NOSE_Y + R * 0.2, noseZ(x) - R * 0.1), tilt(rng.range(66, 74) + 18 * turnN, yaw - sideN * 0.6 * turnN), V(rng.range(-0.2, 0.2), 1, 0), R, { tag: 'nose', hz: rng.range(0.42, 0.6), lift: deepN });
    if (onStair) curls.pop();
    void nq;
    if (rng.chance(0.75) && !onStair) { const R2 = R * rng.range(0.6, 0.85); add(V(x + R * rng.range(0.5, 0.8) * rng.sign(), NOSE_Y + R * 0.2 + R2 * rng.range(0.75, 1.0), noseZ(x) - R * 0.45), tilt(rng.range(56, 66) + 28 * turnN, yaw - sideN * 0.6 * turnN), V(rng.range(-0.25, 0.25), 1, 0), R2, { tag: 'nose', hz: rng.range(0.42, 0.6), lift: deepN }); }
    x += R * 0.66;
  }
  // --- the face: shingled rows climbing 27 degrees from nose to lip
  for (let x = -3250; x < 3250;) {
    const R0 = sizeAt(x); let d = R0 * 0.75, row = 0;
    while (d < 345) {
      let R = R0 * rng.range(0.9, 1.15); const xx = x + (row % 2 ? R0 * 0.75 : 0) + rng.range(-0.12, 0.12) * R0;
      const z = noseZ(xx) - d, y = NOSE_Y + SLOPE * d;
      const rt = route.atZ(z), xr = Math.abs(xx - rt.x);
      if (xr < 150) { d += R0 * rng.range(0.74, 0.86); row++; continue; }          // the staircase and its banks (below)
      // away from the staircase the wall is uneven and deep-dyed: curls from 0.6 to 1.6 of the local size (the same draw,
      // reshaped) whose cores stop at pale indigo, so from the sea ink rims and risers carry the wall, not pale caps
      // (the deep dye starts 160 m out; beyond 230 m the curls take the deepest dye, lie flatter on the slope and stand
      // taller, so what the sea sees of them is stacked ink risers under cream and gold lines: a dark terraced wall
      // whose curls run from about 30 to 150 m across)
      const far = smoothstep(160, 230, xr), kR = R / R0;
      R = R0 * lerp(kR, 0.4 + 1.25 * Math.pow(clamp((kR - 0.9) / 0.25, 0, 1), 1.7), far);
      // the dark curls nearest the staircase (160-300 m either side) stand up from the slope and turn toward the route,
      // so the climbing camera sees their caps as rounded scallops over risers, never their skirts from below
      const turn = far * (1 - smoothstep(250, 310, xr));
      if (z > LIP_Z + R * 0.15) add(V(xx, Math.min(y, rt.y + (xr - 190) * 0.3) - R * 0.12, z), tilt(rng.range(36, 46) - 13 * far + 25 * turn, -xx / 5200 + rng.range(-0.15, 0.15) - Math.sign(xx - rt.x) * 0.45 * turn), V(0, 0.3, -1), R, { tag: 'face', hz: Math.abs(xx) > 230 ? rng.range(0.45, 0.62) + 0.36 * far : rng.range(0.62, 0.9) + 0.1 * far, lift: far > 0.85 ? 9 : far > 0.08 ? 8 : 0 });
      d += R0 * rng.range(0.74, 0.86); row++;
    }
    x += R0 * 1.5;
  }
  // --- the banks of the staircase: closely shingled small curls either side of it, a step paler than the far face
  for (let d = 0; d < 300; d += rng.range(15, 19)) for (const side of [-1, 1]) for (let c = 0; c < 2; c++) {
    const z = -40 - d + rng.range(-4, 4), rt = route.atZ(z), R = rng.range(22, 30);
    const xr = side * (c ? rng.range(110, 138) : rng.range(76, 96));
    add(V(rt.x + xr, rt.y - STAIR_DROP - (c ? rng.range(1, 8) : rng.range(9, 15)), z), tilt(rng.range(34, 44), -side * rng.range(0.1, 0.45)), V(0, 0.3, -1), R, { tag: 'bank', hz: rng.range(0.62, 0.9), lift: c ? 8 : 1 });
  }
  // --- the lip: a crest of upright curls, with the three ARRIVAL curls flanking the notch
  for (let x = -3250; x < 3250;) {
    const R = sizeAt(x) * rng.range(1.0, 1.25); x += R * 0.6;
    if (x - sx < -270 || x - sx > 336) add(V(x, LIP_Y + R * 0.08, noseZ(x) * 0.5 + LIP_Z - 8), tilt(66, -x / 5200), V(0, 1, 0), R, { tag: 'lip', lift: 8 });
    x += R * 0.6;
  }
  // (the arrival curls stand tall and lean out over the face, so the climbing camera meets them face-on against the sky)
  // They are 75-90 m curls lifted 0.8 R over the lip so that the whole motif stands against cream sky, 250-320 m ahead.
  // Two HERALDS arrive first (u 0.268 and 0.29), higher and further back, piled over the lip either side of the notch,
  // so that wax is already being drawn on the sky ahead while the camera is still low on the staircase.
  const lipX = [-250, 255, -146, 140, 252], lipR = [72, 66, 90, 84, 68], early = [T_ARRIVAL - 0.122, T_ARRIVAL - 0.1];
  const arr = rng.shuffle([1, 2, 3]).slice(0, 3);
  lipX.forEach((x, i) => {
    const main = i >= 2, R = lipR[i] * rng.range(0.96, 1.06);
    add(V(sx + x + rng.range(-4, 4), LIP_Y + (main ? R * 0.8 + (i < 4 ? 26 : 0) : 180 - i * 15), LIP_Z - (main ? 6 + (i % 2) * 8 + (i === 4 ? 30 : 0) : 50 + i * 30)), tilt(rng.range(96, 104) + (main ? (i < 4 ? 10 : 0) : 20), -x / (main ? (i < 4 ? 420 : 700) : 440)), V(0, 1, 0.2), R,
      { tag: main ? 'arrival' : 'herald', birth: main ? T_ARRIVAL - 0.055 + 0.024 * arr.indexOf(i - 1) : early[i], keep: true, hz: 0.6, ax: 1.15, mirror: x < 0 ? -1 : 1 });   // the hooked tail points away from the notch, never across the route's view
  });
  // --- the canyon behind the lip: two walls, a floor, then the bowl before the great curl
  const half = rng.range(27, 32);
  // (THE CANYON'S WALLS draw from a stream of their own, 'canyon-walls': which of them stand is a rule of the canyon, and
  // a wall added or taken away deals nothing else afresh)
  const wallRng = rng.fork('canyon-walls');
  for (let k = 0; k < 6; k++) {
    const z = -390 - k * 34 + wallRng.range(-5, 5);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++) {
        if (side < 0 && (k > 0 || row === 0)) continue;       // (left wall: only the upper curl of its first pair stands, so nothing crosses the great curl's rim as seen from the notch)
        const R = wallRng.range(27, 35), y = row ? 226 + wallRng.range(-4, 8) : 180 + wallRng.range(-5, 5);
        // each wall curl is a flat turned to face the arriving camera (like stage wings), never edge-on beside the route
        // (the upper row stands 15-30 m above the route and leans DOWN 10 degrees toward it, so the camera in the canyon
        // meets its caps square on)
        add(V(sx + side * (half * 0.55 + R * 1.22 + 22 + row * 9), y, z + row * 17), V(-side * 0.9, row ? -0.25 : 0.1, 1.0 + wallRng.range(0.05, 0.3) + (k === 0 ? 0.3 : 0)), V(0, 1, 0), R, { tag: 'canyon', lift: 2, mirror: side, rng: wallRng }).bare = !!row;   // tails point out of the canyon; the upper row has none (see curlOutline)
      }
    }
    add(V(sx + rng.range(-16, 16), 159 - rng.range(0, 6), z - 10), V(rng.range(-0.15, 0.15), 1, 0.25), V(0, 0, -1), rng.range(28, 36), { tag: 'floor' });
    add(V(sx + rng.range(-12, 12) + (k % 2 ? 26 : -26), 150 - rng.range(0, 8), z - 28), V(rng.range(-0.2, 0.2), 1, 0.3), V(0, 0, -1), rng.range(30, 40), { tag: 'floor' });
  }
  // right-hand wall carried round the outside of the turn to the horn's rim, and the bowl floor on the left
  const tmp = new THREE.Vector3(), tan = new THREE.Vector3();
  for (let k = 0; k < 4; k++) {
    const s = route.arcStart + 8 + k * 30; horn.path.posAtDist(s, tmp); horn.path.tangentAtDist(s, tan);
    for (let row = 0; row < 2; row++) {
      const R = wallRng.range(30, 38), off = half * 0.55 + 22 + k * 3 + R * 1.22 + row * 10;
      add(V(tmp.x - tan.z * off, row ? 228 + wallRng.range(0, 8) : 182 + wallRng.range(-4, 4), tmp.z + tan.x * off), V(tan.z * 0.9 - tan.x * 1.1, row ? -0.25 : 0.1, -tan.x * 0.9 - tan.z * 1.1), V(0, 1, 0), R, { tag: 'canyon', lift: 2, mirror: 1, rng: wallRng }).bare = !!row;
    }
  }
  const M0 = horn.stations[0].C;
  for (let k = 0; k < 22; k++) {
    const t = (k + 0.5) / 22, wide = (k % 3) - 1, x = lerp(sx - 30, M0.x - 30, t) + wide * 62 + rng.range(-20, 20), z = lerp(-455, M0.z + 30, t) + wide * 34 + rng.range(-18, 18);
    add(V(x, lerp(152, 92, t) - Math.abs(wide) * 12 + rng.range(-8, 8), z), V(rng.range(-0.1, 0.3) - wide * 0.15, 1, rng.range(0.2, 0.5)), V(0, 0, -1), rng.range(38, 62), { tag: 'bowl' }).bare = true;   // (seen from above from the canyon: no tail, see the levels of detail)
  }
  // a wreath of curls round the great curl's rim, set back from the mouth
  const S0 = horn.stations[0], wn = 10;
  for (let k = 0; k < wn; k++) {
    const be = (k / wn) * Math.PI * 2 + rng.range(-0.12, 0.12), R = rng.range(52, 74), rr = HORN_R[0] + R * 0.42;
    const c = S0.C.clone().addScaledVector(S0.right, Math.cos(be) * rr).addScaledVector(V(0, 1, 0), Math.sin(be) * rr).addScaledVector(S0.H, 30 + rng.range(0, 14));
    if (c.y < 60) continue;
    const n = S0.H.clone().multiplyScalar(-1).addScaledVector(S0.right, Math.cos(be) * 0.45).addScaledVector(V(0, 1, 0), Math.sin(be) * 0.45 + 0.1);
    add(c, n, V(Math.cos(be) * 0.6, 1, 0), R, { tag: 'wreath' }).bare = Math.sin(be) < 0.4;   // (beside and below the mouth: see the levels of detail)
  }
  // --- the towers: brick-laid rows of big upright curls piling back to the crest
  const hornA = S0.C, hornB = horn.end;
  const nearHorn = (x, z) => { const ax = hornB.x - hornA.x, az = hornB.z - hornA.z, t = clamp(((x - hornA.x) * ax + (z - hornA.z) * az) / (ax * ax + az * az), -0.3, 1); return Math.hypot(x - hornA.x - ax * t, z - hornA.z - az * t); };
  let size = 170, z = -435, row = 0;
  while (z > -3150) {
    const step = size * 0.8 / (0.55 + 0.45 * detail);
    for (let x = -3300 + (row % 2) * step * 0.5; x < 3300; x += step) {
      const xx = x + rng.range(-0.15, 0.15) * step, zz = z + rng.range(-0.1, 0.1) * size - (xx / 3000) * (xx / 3000) * 420, R = size * 0.5 * rng.range(0.9, 1.18);
      if (zz > -640 && Math.abs(xx - sx) < 62 + R) continue;                          // the canyon
      if (zz > hornB.z - 40 && nearHorn(xx, zz) < 150 + R * 0.6) continue;            // the great curl and the view of it
      if (zz > -700 && xx < sx + 40 && xx > hornA.x - 120 && zz < -430) continue;     // the bowl
      const giant = rng.chance(0.13), Rg = giant ? R * rng.range(1.5, 1.9) : R;
      const behind = zz > -780 && Math.abs(xx - sx - 40) < 400 ? 75 : 0;              // keep the sky behind THE ARRIVAL clean
      // two tower masses right of centre: in the first two rows the curls in two narrow windows are doubled in size,
      // raised and dyed deepest, so at entry two dark towers climb to nine tenths of the frame with a gap between them
      // (both stand to the right of THE ARRIVAL's sky as the climbing camera sees it)
      const dxs = xx - sx, mass = row < 2 && !giant ? Math.max(smoothstep(330, 370, dxs) * (1 - smoothstep(450, 490, dxs)), 0.9 * smoothstep(640, 680, dxs) * (1 - smoothstep(760, 800, dxs))) : 0;
      const Rt = Rg * (1 + mass);
      add(V(xx, towerTop(xx, zz) - behind * (1 - mass) - R * 0.3 + (giant && !behind ? Rg * 0.22 : 0) + (Rt * 0.5 + 30 + 30 * row) * mass, zz - (giant ? 25 : 0)), tilt(rng.range(64, 76), -xx / 5200 + rng.range(-0.12, 0.12)), V(rng.range(-0.2, 0.2), 1, 0), Rt, { tag: 'tower', hz: rng.range(0.34, 0.5), lift: 9 });
    }
    z -= size * (row < 2 ? 0.92 : 1.0); size = Math.min(500, size * 1.19); row++;
  }
  // --- three giants that break the skyline at entry as pale washes (well off to the sides, so never behind THE ARRIVAL)
  for (const [gx, gz] of [[rng.range(980, 1100), rng.range(-950, -1050)], [rng.range(-1000, -860), rng.range(-1150, -1000)], [rng.range(-1750, -1500), rng.range(-1500, -1300)]]) {
    const R = rng.range(250, 330);
    add(V(sx + gx, towerTop(gx, gz) + rng.range(150, 250) - R * 0.25, gz), tilt(rng.range(70, 80), -gx / 5200), V(rng.range(-0.2, 0.2), 1, 0), R, { tag: 'tower', hz: rng.range(0.34, 0.45), lift: 9 });
  }
  // --- sky curls: drawn and flooded on the cream above the crest while the flight is under way
  const sky = [[-380, -2950, 225, 0.14], [650, -2700, 200, 0.3], [-900, -2250, 190, 0.5], [330, -2050, 170, 0.6], [-150, -2500, 210, 0.78]];
  for (const [x, zz, R, birth] of sky) {
    const xx = x + rng.range(-120, 120);
    add(V(xx, towerTop(xx, zz) + R * 0.42, zz), tilt(72, -xx / 5200), V(0, 1, 0), R, { tag: 'sky', birth, keep: true, hz: 0.6, ax: 1.15 });
  }
  // --- THE FAR TOWER: a pile of six deepest-dyed curls 1.5 km from the entry, a little right of the route, whose crown
  // stands at nine tenths of the entry frame as a half-strength wash (from the climb it lies below THE ARRIVAL's curls)
  { const mx = sx + 230, mz = -1150, top = 735;
    for (const [dx, dy, dz, R, tl] of [[20, -95, -40, 170, 80], [-150, -235, 0, 200, 76], [165, -270, 10, 190, 78], [0, -430, 40, 260, 74], [-270, -470, 60, 220, 72], [285, -500, 60, 230, 73]])
      add(V(mx + dx, top + dy, mz + dz), tilt(tl, -mx / 5200), V(dx > 0 ? 0.15 : -0.15, 1, 0), R, { tag: 'tower', hz: 0.42, ax: 1.15, mirror: dx > 0 ? 1 : -1, lift: 9 }).mid = true; }
  return { curls, noseZ, towerTop, half };
}

// THE HANGING BANKS: three ranks of small inverted billows (the motif upside down, so its big scallops are the lower
// edge) hung under the leading edge either side of the staircase's tip, 78-300 m from the route. From the sea their
// scalloped feet (16-22 m up) overlap the rain wall behind and hide the shelf's flat underside; the first rank stands
// just outside the tongue's shoulders, so the tip hangs between two banks. Own rng: no draw of the layout moves.
function hangBillows(rx, route, noseZ) {
  const out = [], V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
    let xr = [78, 128, 140][row] + rx.range(0, 9);
    const xMax = [268, 286, 300][row];
    while (xr < xMax) {
      const R = rx.range(22, 30), inner = xr - 1.15 * R;
      const x0 = side * xr, zn = noseZ(x0);
      // the first rank keeps in front of the tongue's rounded tip where it overlaps it in x
      const zF = inner < 100 ? 46 - inner * inner / 90 + 12 : -1e9;
      const z = row === 0 ? Math.max(zn + 8, zF) + rx.range(-3, 3) : zn + 8 - row * 30 + rx.range(-5, 5);
      const x = route.atZ(z).x + x0, a = rx.range(72, 82) * Math.PI / 180, yaw = -side * (rx.range(0.08, 0.34) + 0.5 * (1 - smoothstep(170, 250, xr)));   // the near ones turn their caps toward the route
      out.push({ c: V(x, rx.range(33, 38) + row * 2.5 + 0.02 * Math.max(0, xr - 200), z), n: V(Math.sin(a) * Math.sin(yaw), Math.cos(a), Math.sin(a) * Math.cos(yaw)).normalize(),
        up: V(rx.range(-0.28, 0.28), -1, 0), R, hz: rx.range(0.5, 0.66), ax: rx.range(1.0, 1.25), mirror: rx.sign(), birth: -1, variant: rx.int(0, 2), phase: rx.range(0, 6.28),
        keep: false, tag: 'hang', lift: 8, lod: row < 2 && xr < 178 ? 'full' : 'mid' });
      xr += R * rx.range(1.25, 1.5);
    }
  }
  return out;
}

// =====================================================================================================================
// drawn lightning: branching ribbons with a draw-order attribute, all slots in one mesh
// =====================================================================================================================
const N_BOLT = 6;
function buildBolts(rng, slots, shared) {
  const pos = [], tanA = [], so = [], bw = [], idx = [], channels = []; let n = 0;
  const strand = (pts, ord0, ord1, slot, w0, w1) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, pts.length - 1)], p = pts[i], t = i / (pts.length - 1);
      const tx = c.x - a.x, ty = c.y - a.y, tz = c.z - a.z;
      for (const side of [-1, 1]) { pos.push(p.x, p.y, p.z); tanA.push(tx, ty, tz); so.push(side, lerp(ord0, ord1, t)); bw.push(slot, lerp(w0, w1, t)); }
      if (i) idx.push(n - 2, n - 1, n, n - 1, n + 1, n);
      n += 2;
    }
  };
  slots.forEach((sl, slot) => {
    const H = sl.height, top = sl.top, trunk = [], NT = 26, r = rng.fork('bolt' + slot);
    let ox = 0, oz = 0;
    for (let i = 0; i <= NT; i++) {
      const t = i / NT; if (i) { ox += r.range(-1, 1) * H * 0.035 + (i % 3 === 0 ? r.range(-1, 1) * H * 0.05 : 0); oz += r.range(-1, 1) * H * 0.02; ox *= 0.86; }
      trunk.push(new THREE.Vector3(top.x + ox + sl.lean.x * t * H, top.y - t * H, top.z + oz + sl.lean.z * t * H));
    }
    strand(trunk, 0, 1, slot, 1, 0.55); channels.push(trunk);
    for (let k = 0; k < 5; k++) {
      const i0 = 3 + k * 4 + r.int(0, 2), t0 = i0 / NT, dir = sl.branchSign ? sl.branchSign : (k % 2 ? 1 : -1), L = H * r.range(0.22, 0.38), pts = [trunk[i0].clone()];
      let bx = 0, by = 0, bz = 0;
      for (let j = 1; j <= 8; j++) { bx += dir * L * 0.11 * r.range(0.5, 1.5); by -= L * 0.085 * r.range(0.2, 1.6); bz += r.range(-1, 1) * L * 0.03; pts.push(new THREE.Vector3(trunk[i0].x + bx, trunk[i0].y + by, trunk[i0].z + bz + sl.lean.z * (j / 8) * L)); }
      strand(pts, t0, Math.min(1, t0 + 0.4), slot, 0.6, 0.25);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tanA, 3));
  g.setAttribute('aSO', new THREE.Float32BufferAttribute(so, 2)); g.setAttribute('aBW', new THREE.Float32BufferAttribute(bw, 2));
  g.setIndex(idx);
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uAge: { value: new Float32Array(N_BOLT).fill(-1) }, uPix: { value: 0.0027 }, uWidth: { value: 0.9 }, uKeep: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec2 aSO; attribute vec2 aBW; uniform float uPix, uWidth;
      varying float vOrd; varying float vSlot; varying float vSide;
      #ifdef USE_FOG
      varying float vFogDepth;
      #endif
      void main(){
        vec4 mv = modelViewMatrix*vec4(position,1.);
        vec3 t = mat3(modelViewMatrix)*aTan; vec2 d = t.xy; float l = length(d); d = l > 1e-4 ? d/l : vec2(0.,1.);
        float w = max(uWidth*aBW.y, -mv.z*uPix*2.2*sqrt(aBW.y))*.5;
        mv.xy += vec2(-d.y, d.x)*aSO.x*w;
        vOrd = aSO.y; vSlot = aBW.x; vSide = aSO.x;
        #ifdef USE_FOG
        vFogDepth = -mv.z;
        #endif
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      ${BATIK_GLSL}
      ${BATIK_FADE_GLSL}
      uniform float uAge[${N_BOLT}]; uniform float uKeep; varying float vOrd; varying float vSlot; varying float vSide;
      void main(){
        int s = int(vSlot + .5); float age = uAge[s];
        float grow = age/.33;
        if(age < 0. || vOrd > grow) discard;
        float h = age - vOrd*.33;
        float keep = (s == 0) ? uKeep : 0.;
        vec3 hot = vec3(1., .82, .4)*4.2, gold = uGold*1.7, trace = uSoga*.85;
        vec3 col = mix(hot, gold, smoothstep(.05, .6, h));
        col = mix(col, mix(trace, gold, keep), smoothstep(.6, 2.5, h));
        col *= 1. + .5*(1. - smoothstep(0., .08, grow - vOrd))*step(grow, 1.3);
        #ifdef USE_FOG
        col = bkFade(col, vFogDepth);
        #endif
        gl_FragColor = vec4(col, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, uniforms, tris: idx.length / 3, channels };   // (channels: each slot's drawn trunk, top to foot)
}

// =====================================================================================================================
// the cloth behind everything: undyed dome with weave and crackle, the dye climbing it from the crest, and (below the
// horizon) a flat far sea in parang bands so that nothing but batik is ever in frame. Directions are hero-local.
// =====================================================================================================================
function buildDome(shared, pal) {
  const uniforms = { ...shared, uCam: { value: new THREE.Vector3(0, 5, 420) }, uStain: { value: 0 }, uSea: { value: 1 }, uHaze: { value: pal.haze }, uFade: { value: 0.00022 }, uShelf: { value: 60 }, uVeinK: { value: pal.colourway === 'golden' ? 2.4 : 1 },
    // per colourway: the crackle's colour and strength (night: a hair-thin pale-indigo crackle at about a third of the
    // day's strength, half its width, so the wall's gold-rimmed silhouette and the birds stand clear of a calm ink sky) and the
    // three washes of the stain (on the madder cloth it arrives as a darker violet-indigo overdye, not pale tiles)
    uVeinC: { value: pal.colourway === 'night' ? pal.ramp[4].clone() : pal.soga.clone().multiplyScalar(pal.colourway === 'golden' ? 1.25 / 2.4 : 1.25) },
    uVeinW: { value: pal.colourway === 'night' ? 0.85 : 1 },
    uVeinA: { value: pal.colourway === 'night' ? 0.14 : pal.colourway === 'golden' ? 0.384 : 0.16 },
    uStainC: { value: pal.colourway === 'golden' ? [pal.cloth.clone().lerp(pal.ramp[3], 0.6), pal.cloth.clone().lerp(pal.ramp[2], 0.65), pal.cloth.clone().lerp(pal.ramp[1], 0.7)]
      : pal.colourway === 'night' ? [pal.cloth.clone().lerp(pal.ramp[2], 0.7), pal.cloth.clone().lerp(pal.ramp[3], 0.7), pal.cloth.clone().lerp(pal.ramp[3], 0.7)]   // on the ink cloth the stain is an indigo wash, not pale tiles
      : [pal.ramp[6], pal.ramp[5], pal.ramp[5]] },
    uStainA: { value: pal.colourway === 'golden' ? new THREE.Vector3(0.55, 0.5, 0.4) : pal.colourway === 'night' ? new THREE.Vector3(0.75, 0.45, 0.3) : new THREE.Vector3(0.8, 0.6, 0.35) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`
      ${BATIK_GLSL}
      uniform vec3 uCam, uHaze, uVeinC, uStainC[3], uStainA; uniform float uStain, uSea, uFade, uShelf, uVeinK, uVeinA, uVeinW; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float pxd = max(length(dFdx(d)), length(dFdy(d)));
        vec3 col = uCloth;
        if(d.y >= 0. || uSea < .5){
          // sky: crackle fixed to the dome, the stain wicking up from the storm's crest (north = -Z)
          vec2 v = bkVor(d*13. + 3.1); vec2 v2 = bkVor(d*44. + 9.7);
          float hw = max(.0018, pxd*13.*.22)*uVeinW, hw2 = max(.004, pxd*44.*.22)*uVeinW;
          float vein = 1. - smoothstep(hw, hw + pxd*13.*.8, v.x);
          float vein2 = (1. - smoothstep(hw2, hw2 + pxd*44.*.8, v2.x))*(1. - smoothstep(.0006, .002, pxd));
          float el = degrees(asin(clamp(d.y, -1., 1.)));
          float az = atan(d.x, -d.z + 1e-5);
          float north = 1. - smoothstep(.9, 1.75, abs(az));
          float sc = abs(sin(az*9. + 1.3)); 
          float front = (15. + 30.*uStain + 3.5*sc)*north - 12.*(1. - north);
          float cf = front + (v.y - .5)*9.;
          float wash = 1. - smoothstep(cf - .75, cf + .75, el), wash2 = 1. - smoothstep(cf - 9.75, cf - 8.25, el), wash3 = 1. - smoothstep(cf - 19.75, cf - 18.25, el);
          float lead = step(el, front + 5. + 7.*v2.y)*max(vein, vein2*.7);
          // (dawn only) the rose band: full to 30 degrees, gone by 46, so about ten degrees of it stand above the crest
          col = mix(col, uHaze, .78*(1. - smoothstep(30., 46., el))*north*step(.001, distance(uHaze, uCloth)));
          col = mix(col, uVeinC, uVeinA*max(vein*.8, vein2*.5));
          col = mix(col, uStainC[0], wash*uStainA.x); col = mix(col, uStainC[1], wash2*uStainA.y); col = mix(col, uStainC[2], wash3*uStainA.z);
          col = mix(col, uRamp[4], lead*(1. - wash)*.5);
          col = mix(col, uRamp[5], vein*wash*.35*step(.3, uCloth.r + uCloth.g));
          // the unseen wax pen: an amber scalloped line just ahead of the stain
          float wl = abs(el - (front + 2.2)); float aw = max(.07, degrees(pxd)*.75);
          col = mix(col, uWax, (1. - smoothstep(aw, aw + degrees(pxd), wl))*north*smoothstep(.02, .1, uStain));
          col *= 1. + .03*uVeinK*sin(d.x*900. + d.y*300.)*sin(d.y*900. - d.z*300.)*(1. - smoothstep(.0008, .002, pxd));
        } else {
          // far sea plate at y = 0
          float t = uCam.y/max(-d.y, 1e-4); vec3 P = uCam + d*t; P.y = 0.;
          float px = t*pxd/max(-d.y, .02);
          float bc = (P.x + P.z)*.7071/18. + uTime*.33; float bf = fract(bc);
          float blade = smoothstep(.0, .5*px/18. + .02, .5 - abs(bf - .5) - .27 - .1*sin((P.x - P.z)*.7071*.21 + floor(bc)*2.4));
          float flat1 = 1. - smoothstep(.12, .45, px/18.);
          float cream = mix(.34, blade, flat1);
          float dots = step(.72, fract((P.x - P.z)*.7071*.45 - uTime*1.1 + floor(bc)*.37))*step(abs(bf - .12), .06)*flat1;
          float od = 1. - smoothstep(uShelf - 30., uShelf + 26.*bkVor(vec3(P.xz/55., 0.)).y, P.z);
          vec3 ground = mix(uSoga, uOverdye, od);
          col = mix(ground, uLine, max(cream*.9, dots));
          float fd = uFade*t; col = mix(col, uCloth, 1. - exp(-fd*fd*6.));
        }
        gl_FragColor = vec4(col, 1.); }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 24), mat);
  mesh.renderOrder = -0.5; mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// rain wall under the shelf: one curved strip of udan-liris bands, the dark the nose is cut against
function buildRainWall(noseZ, shared) {
  const pos = [], idx = []; let n = 0;
  for (let x = -3400; x <= 3400; x += 170) { const z = noseZ(x) - 395; pos.push(x, -3, z, x, 78 + Math.abs(x) * 0.012, z); if (n) idx.push(n - 2, n, n - 1, n - 1, n, n + 1); n += 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vP;
      #ifdef USE_FOG
      varying float vFogDepth;
      #endif
      void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.);
      #ifdef USE_FOG
      vFogDepth = -mv.z;
      #endif
      gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      ${BATIK_GLSL}
      ${BATIK_FADE_GLSL}
      varying vec3 vP;
      void main(){
        float px = max(max(length(dFdx(vP)), length(dFdy(vP))), 1e-4);
        float q = (vP.x + vP.y*.364)/26.; float band = floor(q), bf = fract(q);
        float h = bkHash3(vec3(band, 3., 7.)).x;
        vec3 col = mix(uRamp[0], uRamp[1], step(.5, h))*.9;
        // udan liris: three lanes of long slanted strokes to a band (64-110 m long, 85% of each period drawn), scrolling
        // down. A stroke is never under 1.3 px wide, and past about a kilometre the lanes melt into their own average,
        // so the wall is neither a barcode of short dashes nor a blank sheet.
        float lane = floor(bf*3.), lf = (fract(bf*3.) - .5)*8.667;
        vec3 h2 = bkHash3(vec3(band, lane, 11.));
        float per = 64. + 46.*h2.x, ay = px*1.064/per + .003;
        float fy = fract((vP.y*1.064 + uTime*25.*(.7 + .6*h))/per + h2.y*7.);
        float on = smoothstep(.15 - ay, .15 + ay, fy)*(1. - smoothstep(1. - 2.*ay, 1., fy));
        float wd = max(.42, .65*px);
        float core = 1. - smoothstep(wd - .5*px, wd + .5*px, abs(lf));
        float far = smoothstep(1.6, 3., px);
        float stroke = mix(core*on, min(2.*wd/8.667, 1.)*.85, far)*step(.2, h2.z);
        col = mix(col, uRamp[5], stroke*.46);
        float edge = 1. - smoothstep(.03, .03 + px/26., min(bf, 1. - bf));
        col = mix(col, uRamp[4], edge*(1. - smoothstep(.12, .45, px))*.3);
        #ifdef USE_FOG
        col = bkFade(col, vFogDepth);
        #endif
        gl_FragColor = vec4(col, 1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// =====================================================================================================================
// buildHero
// =====================================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('mega-mendung'), detail = ctx.quality?.detail ?? 1;
  const hour = ctx.vary?.hour, colourway = opts.colourway || (['golden', 'night', 'dawn'].includes(hour) ? hour : 'day');
  const pal = batikPalette(opts.palette, colourway), shared = batikUniforms(pal);
  const prada = opts.prada ?? !!ctx.vary?.rare;
  const object = new THREE.Group(); object.name = 'batik-monsoon-front';

  // the notch, canyon and great curl sit up to 110 m either way along the lip, by seed (opts.shift overrides)
  const sx = opts.shift ?? Math.round(rng.fork('notch').range(-110, 110));
  const hornRng = rng.fork('horn'), layRng = rng.fork('layout');   // (forked in this order before any yield)
  const fly = flyPoints(sx), path = makePath(fly);
  const canyonFrom = new THREE.Vector3(sx, 208, -352), canyonTo = new THREE.Vector3(sx, 200, -540);   // the canyon's own axis, from behind the lip to where it opens on the great curl (anchors.canyon)
  await ctx.yield();
  const route = sampleRoute(path, sx);
  await ctx.yield();
  const horn = await buildGreatCurl(path, route, hornRng, ctx); horn.path = path;
  await ctx.yield();
  const lay = layoutFront(layRng, ctx.noise, route, horn, detail, sx);
  await ctx.yield();

  // --- three outlines per seed, each at three levels of detail
  // (points per scallop for the near, fully modelled curls: 8-11, so that a lobe 20 m across seen from 100 m is a round
  // scallop of 2 m chords and never a hexagon; the same random draws as before, the outline is only sampled more finely)
  const lobeSets = rng.shuffle([[8, 10], [9, 9], [10, 8], [7, 11]]).slice(0, 3);
  const variants = lobeSets.map(([n, m]) => {
    const seedK = rng.int(1, 1e9), mk = (mm, extra, bare) => curlOutline(ctx.core.makeRng(seedK), n, mm, extra, bare);
    return { full: mk(m, 6), mid: mk(8, 4), far: mk(4, 2), bare: mk(m, 0, true), bmid: mk(8, 0, true) };   // (the extra points are the hooked tail's; bare: the canyon's upper row. See curlOutline)
  });

  await ctx.yield();
  // --- keep every curl clear of the route: push it back along its own normal, then shrink it, else drop it
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), w = new THREE.Vector3();
  const frame = (q) => { X.crossVectors(q.up, q.n).normalize(); Y.crossVectors(q.n, X).normalize(); };
  // Rest-pose distance from the route to EVERY outline vertex of all eight terraces (foot and lip of each riser), less
  // what the curl can move toward the camera (rocking, billow, breathing). A curl must keep CLEAR at rest and CLEAR - 2.5
  // at the worst of its motion.
  const clearance = (q) => {
    const o = variants[q.variant].full; let best = 1e9;
    frame(q);
    const list = route.near(q.c.x, q.c.y, q.c.z, q.R * 1.6 + 60);
    if (!list.length) return 1e9;
    for (let t = 0; t < 8; t++) {
      const f = 1 - t / 8;
      for (let h = 0; h < 2; h++) {
        const lz = (h ? (t + 1) * HSTEP : (t === 0 ? -SKIRT : t * HSTEP)) * q.R * q.hz;
        for (let i = 0; i < o.N; i++) {
          w.copy(q.c).addScaledVector(X, (o.x[i] * f + o.ex * (1 - f)) * q.R * q.ax * q.mirror).addScaledVector(Y, (o.y[i] * f + o.ey * (1 - f)) * q.R).addScaledVector(q.n, lz);
          const d = route.distIn(list, w.x, w.y, w.z); if (d < best) best = d;
        }
      }
    }
    const margin = (route.dist(q.c.x, q.c.y, q.c.z) - q.R < 60 ? 0.6 : 1) * (0.085 * q.R + 1.5 + 0.02 * q.R * q.hz);
    return Math.min(best, best - margin + 2.5);
  };
  await ctx.yield();
  // nothing may poke into the great curl or stand in front of its mouth
  const hornSegs = [];
  { const S0 = horn.stations[0]; hornSegs.push([S0.C.clone().addScaledVector(S0.H, -80), S0.C, HORN_R[1] + 4]);
    for (let k = 0; k < 7; k++) hornSegs.push([horn.stations[k].C, k < 6 ? horn.stations[k + 1].C : horn.end.clone().addScaledVector(horn.axis, 6), HORN_R[k + 1] + 3]); }
  const ab = new THREE.Vector3(), ap = new THREE.Vector3();
  const inHorn = (p) => { for (const [A, B, r] of hornSegs) { ab.subVectors(B, A); ap.subVectors(p, A); const t = clamp(ap.dot(ab) / ab.lengthSq(), 0, 1); if (ap.addScaledVector(ab, -t).lengthSq() < r * r) return true; } return false; };
  const hornHit = (q) => {
    if (q.c.distanceTo(horn.stations[2].C) > 330 + q.R) return false;
    const o = variants[q.variant].full, st = Math.max(1, Math.floor(o.N / 14)); frame(q);
    for (const f of [1, 0.6, 0.2]) for (let i = 0; i < o.N; i += st) {
      w.copy(q.c).addScaledVector(X, (o.x[i] * f + o.ex * (1 - f)) * q.R * q.ax * q.mirror).addScaledVector(Y, (o.y[i] * f + o.ey * (1 - f)) * q.R).addScaledVector(q.n, (1 - f) * 8 * HSTEP * q.R * q.hz);
      if (inHorn(w)) return true;
    }
    return false;
  };
  // NO FOLDED SLABS: a face or wreath curl within 330 m of the route whose terraces rise more than 60 degrees away from
  // the direction to the nearest point of the route is turned 25 degrees toward it, so the lens sees a rounded
  // scalloped cap and never a stack of plates edge-on (no random draw is involved)
  { const toR = new THREE.Vector3(); let nt = 0;
    for (const q of lay.curls) {
      if (q.tag !== 'face' && q.tag !== 'wreath') continue;
      const d = route.nearest(q.c.x, q.c.y, q.c.z, toR); if (d > 330 + q.R || d < 1) continue;
      toR.sub(q.c).multiplyScalar(1 / d);
      const ang = Math.acos(clamp(q.n.dot(toR), -1, 1));
      if (ang > 1.047) { const a = 0.436, sn = Math.sin(ang); q.n.multiplyScalar(Math.sin(ang - a) / sn).addScaledVector(toR, Math.sin(a) / sn).normalize(); }
      if (++nt % 15 === 0) await ctx.yield();
    } }
  // THE FIRST TOWERS RIGHT OF THE CANYON (the 85-220 m curls within 720 m of the canyon's own axis): they stood nearly
  // edge-on to the canyon, and as 32-point cones their flanks showed under the canyon wall's caps as flat striped
  // fans. Each is turned toward the nearest point of the canyon's axis (the line from the canyon's `from` to its
  // `to`, as the face and wreath curls above turn toward the nearest point of the route) until it lies within about
  // 35 degrees of the line to that point (at most 34 degrees of turn), and those within 520 m of it are marked
  // `wing`: they get the fully modelled curl (real terraces, round scallops) whatever the near-curl count says. Only
  // towers to the right of the canyon; no random draw is involved.
  { const toC = new THREE.Vector3(), axis = new THREE.Vector3().subVectors(canyonTo, canyonFrom), axisL2 = axis.lengthSq();
    for (const q of lay.curls) {
      if (q.tag !== 'tower' || q.c.x - sx < 80) continue;
      const t = clamp(toC.subVectors(q.c, canyonFrom).dot(axis) / axisL2, 0, 1);
      toC.copy(canyonFrom).addScaledVector(axis, t).sub(q.c);            // from the curl to the nearest point of the canyon's axis
      const d = toC.length(); if (d > 720 || d < 1) continue;
      toC.multiplyScalar(1 / d); if (d < 520) q.wing = true;
      const ang = Math.acos(clamp(q.n.dot(toC), -1, 1));
      if (ang > 0.7) { const a = Math.min(ang - 0.6, 0.6), sn = Math.sin(ang); q.n.multiplyScalar(Math.sin(ang - a) / sn).addScaledVector(toC, Math.sin(a) / sn).normalize(); }
    } }
  await ctx.yield();
  let minClear = 1e9, tested = 0; const kept = [];
  for (const q of lay.curls) {
    const dc = route.dist(q.c.x, q.c.y, q.c.z);
    if (dc < 70 && q.R > 40 && (q.tag === 'face' || q.tag === 'nose' || q.tag === 'bank')) q.R = 40;
    q.dPath = dc - q.R;
    if (dc - q.R * 1.6 < 24) {
      let d = clearance(q);
      for (let it = 0; it < 12 && d < CLEAR; it++) { q.c.addScaledVector(q.n, -(CLEAR - d + 1.5)); if (it >= 5) q.R *= 0.88; d = clearance(q); }
      if (d < CLEAR - 0.25) continue;
      minClear = Math.min(minClear, d); q.dPath = route.dist(q.c.x, q.c.y, q.c.z) - q.R;
      ++tested; await ctx.yield();
    }
    if (!q.keep && hornHit(q)) continue;
    kept.push(q);
  }
  await ctx.yield();

  // --- levels of detail by distance from the route, then one InstancedMesh per outline and level
  kept.sort((a, b) => a.dPath - b.dPath);
  const maxNear = 92; let nNear = 0, nMid = 0;
  for (const q of kept) {
    const big = q.tag === 'tower' || q.tag === 'sky';
    if (!big && q.dPath < 160 && nNear < maxNear) { q.lod = 'full'; nNear++; }
    else if (q.wing) q.lod = 'full';                           // the towers beside the canyon (see THE FIRST TOWERS)
    else if ((q.dPath < 560 && nMid < 190) || q.mid) { q.lod = 'mid'; nMid++; }
    else q.lod = 'far';
    if (q.bare && (q.lod === 'full' || q.tag === 'wreath')) q.lod = 'bare';   // (fully modelled, no tail: its own three meshes. The wreath's lower curls were 32-point cones whose tail fold lay across their steps as a flat pale wedge)
    else if (q.bare && q.lod === 'mid') q.lod = 'bmid';        // (the bowl's curls beside the great curl's mouth: the same cone without the tail's sector, which showed from the canyon as a flat pale wedge cut off ruler-straight)
    frame(q);
    q.m = new THREE.Matrix4().makeBasis(X.clone().multiplyScalar(q.R * q.ax * q.mirror), Y.clone().multiplyScalar(q.R), q.n.clone().multiplyScalar(q.R * q.hz)).setPosition(q.c);
    q.motion = q.dPath < 60 ? 0.6 : 1;
  }
  // the hanging banks either side of the staircase's tip (their own random stream and their own levels of detail,
  // so nothing above changes with them)
  let nHang = 0;
  for (const q of hangBillows(ctx.core.makeRng((Math.floor(lay.half * 1e6) ^ 0x2f6e2b1) >>> 0), route, lay.noseZ)) {
    if (route.dist(q.c.x, q.c.y, q.c.z) - q.R * 1.6 < CLEAR + 12) continue;
    frame(q);
    q.m = new THREE.Matrix4().makeBasis(X.clone().multiplyScalar(q.R * q.ax * q.mirror), Y.clone().multiplyScalar(q.R), q.n.clone().multiplyScalar(q.R * q.hz)).setPosition(q.c);
    q.motion = 0.8; q.dPath = route.dist(q.c.x, q.c.y, q.c.z) - q.R; kept.push(q); nHang++;
  }
  await ctx.yield();
  const curlMat = styleMaterial({ shared });
  let tris = 0; const meshes = [];
  for (let v = 0; v < 3; v++) for (const lod of ['full', 'bare', 'mid', 'bmid', 'far']) {
    const list = kept.filter((q) => q.variant === v && q.lod === lod); if (!list.length) continue;
    const geo = curlGeometry(variants[v][lod], lod === 'full' || lod === 'bare');
    const mesh = instanced(geo, curlMat, list); mesh.name = 'curls-' + v + '-' + lod;
    tris += (geo.index.count / 3) * list.length; object.add(mesh); meshes.push(mesh);
    await ctx.yield();
  }

  // --- the great curl, its gold scalloped ring, the bolts, the rain wall, the cloth dome
  // (the horn's own material carries the iris and the windows; the body sheets share the plain program of the curls)
  const hornWindows = [new THREE.Vector4(1, 2.5, 85, 1.3), new THREE.Vector4(2, 3.12, 66, 1.1), new THREE.Vector4(3, 2.2, 50, 1), new THREE.Vector4(-9, 0, 1, 1)];   // three, all on the left of the outer lips (the fourth slot is unused)
  const hornMat = styleMaterial({ shared, breathe: 0, rock: 0, billow: 1.1, goldTer: 8, horn: true, windows: hornWindows });
  const bodyMat = styleMaterial({ shared, breathe: 0, rock: 0, billow: 1.1, goldTer: 8 });
  const hornMesh = instanced(horn.geometry, hornMat, [{ m: new THREE.Matrix4(), rev: 1, motion: 1 }]); hornMesh.name = 'great-curl';
  object.add(hornMesh); tris += horn.tris;
  // the staircase under the climb (own material: its lips breathe 0.3 m in sequence and ride the cloth's billow)
  await ctx.yield();
  const stairs = await buildStairs(route, rng.fork('stairs'), ctx);
  await ctx.yield();
  const stairMat = styleMaterial({ shared, breathe: 0.45, rock: 0, billow: 1.1, dot: 2.2, goldTer: 2.5, stair: 1 });
  const stairMesh = instanced(stairs.geometry, stairMat, [{ m: new THREE.Matrix4(), rev: 0, motion: 0.6 }]); stairMesh.name = 'staircase';
  object.add(stairMesh); tris += stairs.tris;
  await ctx.yield();
  if (opts.body !== false) {
    const body = await buildBody(lay, horn, route, sx, ctx), bodyMesh = instanced(body.geometry, bodyMat, [{ m: new THREE.Matrix4(), rev: 0, motion: 0, lift: 7 }]);
    bodyMesh.name = 'body'; object.add(bodyMesh); tris += body.tris;
  }
  await ctx.yield();

  const ringGeo = (() => {
    const pos = [], uv = [], idx = [], M = 120;
    for (let j = 0; j <= M; j++) { const be = (j / M) * Math.PI * 2, c = Math.cos(be), s = Math.sin(be), ro = 8.55 + 0.6 * Math.abs(Math.sin(be * 6)); pos.push(c * 7.55, s * 7.55, 0, c * ro, s * ro, 0); uv.push(j / M, 0, j / M, 1); if (j) { const n = j * 2; idx.push(n - 2, n - 1, n, n - 1, n + 1, n); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  })();
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { uGold: shared.uGold, uTime: shared.uTime }, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uGold; uniform float uTime; varying vec2 vUv; void main(){ float k = .8 + .2*sin(vUv.x*75.4 + uTime*1.5); gl_FragColor = vec4(uGold*2.*k*(1. - .35*smoothstep(.55, 1., vUv.y)), 1.); }',
  });
  const ring = new THREE.Mesh(ringGeo, ringMat); ring.name = 'portal-ring';
  const ringQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), horn.axis.clone().multiplyScalar(-1));
  ring.position.copy(horn.end).addScaledVector(horn.axis, 0.6); ring.quaternion.copy(ringQ); object.add(ring);
  await ctx.yield();

  const boltRng = rng.fork('bolts');
  // THE HERO BOLT stands in the open air past the canyon's end, before the right-hand edge of the great curl's rim:
  // 18 m right of the route's line and 52 m beyond the start of the arc (it stood beside the canyon's end, 27 m right:
  // from the canyon that was the very edge of a wide view and outside a tall one). Its branches reach right.
  const heroBolt = { top: new THREE.Vector3(sx + 18, 322, -592), height: 176, lean: new THREE.Vector3(-0.02, 0, 0.04), branchSign: 1 };
  const slots = [heroBolt];
  for (let i = 1; i < N_BOLT; i++) {
    const side = i % 2 ? 1 : -1, x = side > 0 ? boltRng.range(260, 1100) : boltRng.range(-1300, -520), z = boltRng.range(-900, -1900), H = boltRng.range(230, 330);
    slots.push({ top: new THREE.Vector3(x, lay.towerTop(x, z) + 30, z + 40), height: H, lean: new THREE.Vector3(boltRng.range(-0.1, 0.1), 0, 0.55), branchSign: 0 });
  }
  const bolts = buildBolts(boltRng, slots, shared); object.add(bolts.mesh); tris += bolts.tris;
  await ctx.yield();
  let rain = null; if (opts.rainWall !== false) { rain = buildRainWall(lay.noseZ, shared); object.add(rain); tris += 80; }
  await ctx.yield();
  let dome = null; if (opts.dome !== false) { dome = buildDome(shared, pal); dome.uniforms.uSea.value = opts.farSea === false ? 0 : 1; object.add(dome.mesh); tris += 2200; }
  await ctx.yield();

  // --- anchors (hero-local)
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const strike = heroBolt.top.clone().addScaledVector(heroBolt.lean, 97); strike.y = 225;       // the point of the channel 97 m down from its top
  const anchors = {
    entry: V3(fly[0]),
    flyThrough: fly.map(V3),
    portalSeat: { position: horn.end.clone(), normal: horn.axis.clone().multiplyScalar(-1), radius: 7 },
    nose: new THREE.Vector3(30, NOSE_Y, lay.noseZ(30)),
    lipNotch: new THREE.Vector3(sx, 199, LIP_Z), shift: sx,
    canyon: { from: canyonFrom.clone(), to: canyonTo.clone(), halfWidth: lay.half, floorY: 160 },
    greatCurl: { mouth: horn.stations[0].C.clone(), core: horn.end.clone(), axis: horn.axis.clone(), lips: horn.stations.map((s) => s.C.clone()), radii: HORN_R.slice(),
      arcStart: route.arcStart, lipDist: HORN_S.slice(), lipOff: HORN_OFF.slice(), lipDrop: HORN_DROP.slice() },   // (lipDist: metres along the route from arcStart to each lip; lipOff / lipDrop: its centre left of and below the route)
    heroBolt: { top: heroBolt.top.clone(), strike, u: T_BOLT, life: 0.33 + 2.5, channel: bolts.channels[0].map((p) => p.clone()) },   // (life: seconds from its first stroke until its last stretch has cooled to its trace: it is drawn in 0.33 s and each stretch cools over 2.5 s, the bolts' shader's own ramp; channel: its drawn trunk, top to foot)
    boltSlots: slots.slice(1).map((s) => s.top.clone()),
    arrivals: kept.filter((q) => q.birth >= 0).map((q) => ({ position: q.c.clone(), radius: q.R, u: q.birth, kind: q.tag })),
    pois: { faceAhead: new THREE.Vector3(sx, 215, -330), greatCurlCore: horn.end.clone() },
    viewpoints: [
      { position: new THREE.Vector3(0, 5, 420), target: new THREE.Vector3(0, 60, 0), note: 'entry: the wall' },
      { position: path.posAtDist(590), target: new THREE.Vector3(sx + 10, 250, -340), note: 'the blue staircase and the arrival at the lip' },
      { position: new THREE.Vector3(sx, 205, -450), target: horn.end.clone(), note: 'canyon: bolt right, whorl ahead-left' },
      { position: path.posAtDist(path.length - 95), target: horn.end.clone(), note: 'the funnel' },
    ],
    timeline: { duration: DURATION, arrival: T_ARRIVAL, bolt: T_BOLT, skyCurls: [0.14, 0.3, 0.5, 0.6, 0.78] },
    bounds: { halfWidth: 3300, front: 70, back: -3250, crest: 1300 },
  };

  // --- animation
  const state = { u: 0, manual: false };
  const period = clamp(opts.boltEvery ?? (colourway === 'night' ? 2 : 4), 1.2, 8);
  const slotOf = (k) => 1 + ((Math.imul(k + 7, 0x9e3779b1) >>> 8) % (N_BOLT - 1));
  const local = new THREE.Vector3(), look = new THREE.Vector3(), size = new THREE.Vector2(), rq = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
  const center = new THREE.Vector3(0, 240, 60);
  // viewer-only fly preview (see header): never active once opts are passed or setProgress has been called
  const flyPreview = Object.keys(opts).length === 0 && Number(ctx.seed) >= 9000 && Number(ctx.seed) < 10000;

  const applyProgress = (u, time) => {
    shared.uU.value = u;
    const heroAge = (u - T_BOLT) * DURATION, ages = bolts.uniforms.uAge.value;
    ages[0] = heroAge >= 0 ? heroAge : -1;
    const k = Math.floor(time / period);
    for (let j = 1; j < N_BOLT; j++) { ages[j] = -1; for (let b = 0; b < 8; b++) { const kk = k - b; if (kk >= 0 && slotOf(kk) === j) { ages[j] = time - kk * period; break; } } }
    const fl = heroAge >= 0 ? smoothstep(0, 0.1, heroAge) * (1 - smoothstep(0.1, 0.4, heroAge)) : 0;
    shared.uFlash.value.set(strike.x, strike.y, strike.z, fl);
    if (prada) { shared.uPrada.value.set(strike.x, strike.y, strike.z, Math.max(0, heroAge) * 300); bolts.uniforms.uKeep.value = 1; }
    if (dome) dome.uniforms.uStain.value = u;
    // the bolt drawn inside the great curl's third opening: one strike a second and a half after the hero bolt (T_WIN),
    // cooling to a soga trace (nothing strikes beside the portal after u 0.8)
    const wb = hornMat.uniforms.uWinBolt.value;
    wb.x = u >= T_WIN ? (u - T_WIN) * DURATION : -1; wb.y = -1;
  };

  const hero = {
    object, radius: 260, height: 100, center, anchors, ground: false, groundY: 0,
    uniforms: shared, palette: pal, material: curlMat, greatCurlMaterial: hornMat, dome: dome ? dome.mesh : null, rainWall: rain, bolts: bolts.mesh,
    path, duration: DURATION,
    curls: kept,   // every placed curl { c, n, up, R, hz, ax, tag, lod, lift, dPath } (read-only: for inspection tools)
    stats: { curls: kept.length, near: nNear, mid: nMid, hang: nHang, triangles: Math.round(tris), clearance: Math.min(minClear, horn.clear, stairs.clear), stairLips: stairs.lips, shift: sx, colourway, prada },
    // path progress 0..1 (the brief's clock: seconds = u * 36). Drives THE ARRIVAL, the sky curls, the stain and the hero bolt.
    setProgress(u) { state.u = clamp(u, 0, 1); state.manual = true; },
    // strike the hero bolt's gold along every resist line regardless of ctx.vary.rare
    setPrada(radius) { shared.uPrada.value.set(strike.x, strike.y, strike.z, radius); bolts.uniforms.uKeep.value = radius > 0 ? 1 : 0; },
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (flyPreview && !state.manual) {
        let a = Math.atan2(camera.position.x - center.x, camera.position.z - center.z); if (a < -0.8) a += Math.PI * 2;
        const f = clamp((a + 0.3) / 4.712, 0, 1), d = f * path.length;
        path.posAtDist(d, camera.position); path.posAtDist(d + 30, look);
        const wgt = 0.6 * smoothstep(0.64, 0.7, f) * (1 - smoothstep(0.9, 0.95, f));
        look.sub(camera.position).normalize().lerp(local.copy(horn.end).sub(camera.position).normalize(), wgt).add(camera.position);
        camera.lookAt(look); camera.updateMatrixWorld(true);
        state.u = f;
      } else if (!state.manual) state.u = (time / DURATION) % 1;   // nobody is driving: loop the journey's clock so the piece still performs
      applyProgress(state.u, time);
      object.updateMatrixWorld();
      local.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(local);
      if (dome) { dome.mesh.position.copy(local); dome.uniforms.uCam.value.copy(local); }
      ctx.renderer.getDrawingBufferSize(size);
      bolts.uniforms.uPix.value = (2 * Math.tan((camera.fov || 62) * Math.PI / 360)) / Math.max(size.y, 1);
      ring.quaternion.copy(ringQ).multiply(rq.setFromAxisAngle(zAxis, time * 0.22));
    },
    dispose() {},
  };
  object.userData.hero = hero;
  return hero;
}

// =====================================================================================================================
// the body of the front under the curls: three dark sheets (the shelf's face, its underside, the towers) so that the
// gaps between curls show dyed cloth, never sky. Flat fills with the same crackle; no lines of their own.
// =====================================================================================================================
async function buildBody(lay, horn, route, sx, ctx) {
  const b = new GeoBuf();
  const M0 = horn.stations[0].C, E = horn.end, line = [[sx, -330], [sx, -540], [M0.x, M0.z], [E.x, E.z]];
  const dRoute = (x, z) => { let best = 1e9; for (let i = 0; i < 3; i++) { const ax = line[i][0], az = line[i][1], dx = line[i + 1][0] - ax, dz = line[i + 1][1] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; };
  const sizeAt = (x) => lerp(33, 165, smoothstep(110, 1150, Math.abs(x)));
  // columns every 120 m, every 15 m across the bay round the staircase's tip
  const rx0 = route.atZ(0).x, xs = [];
  for (let x = -3420; x <= 3420;) { xs.push(x); x += Math.abs(x + 7.5 - rx0) < 315 ? 15 : 120; }
  // THE BAY: within 250 m of the route both sheets begin up to 118 m behind the nose, on a lobed line, so that from the
  // sea the space under the shelf is open to the rain wall beside the staircase's tip (no ruled edge, no blank sheet)
  const bayCut = (x, zn) => {
    const xr = Math.abs(x - route.atZ(zn).x), k = 1 - smoothstep(105, 250, xr);
    return 118 * k + 8 * Math.abs(Math.sin(x * Math.PI / 52 + 1.3)) * (1 - smoothstep(255, 300, xr));
  };
  // the underside runs from the leading edge to the rain wall; round the bay its far edge meets the wall's top, so the
  // sheet lies edge-on above every sight line from the sea and is never seen as a strip
  const underY = (x, d) => { const y0 = NOSE_Y - 12 - sizeAt(x) * 0.14; return y0 + lerp(34, 76 + Math.abs(x) * 0.012 - y0, 1 - smoothstep(330, 520, Math.abs(x - rx0))) * d / 396; };
  const grid = (rows, at, ter) => {
    const first = b.n, C = xs.length;
    for (let j = 0; j < rows; j++) for (let i = 0; i < C; i++) { const p = at(xs[i], j / (rows - 1)); b.v(p[0], p[1], p[2], 0, 1, 0, ter, 50, 50, 0, 0, 0); }
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < C - 1; i++) { const a = first + j * C + i; b.idx.push(a, a + C, a + 1, a + 1, a + C, a + C + 1); }
  };
  // face: nose to lip, sunk under the curls and well under the route
  grid(8, (x, t) => {
    const zn = lay.noseZ(x), cut = bayCut(x, zn), d = cut + t * (zn - cut - LIP_Z + 14), z = zn - d;
    let y = NOSE_Y + SLOPE * d - 12 - sizeAt(x) * 0.14;
    const rt = route.atZ(z); y = Math.min(y, rt.y - 62 + 0.27 * Math.abs(x - rt.x));   // sunk under the staircase and its banks
    y = Math.max(y, underY(x, d) + 1.5 * smoothstep(0, 30, cut) - 60 * (1 - smoothstep(0, 4, cut)));   // in the bay, never below the underside
    return [x, y, z];
  }, 1);
  await ctx.yield();
  // underside: leading edge back to the rain
  grid(3, (x, t) => { const zn = lay.noseZ(x), d = lerp(bayCut(x, zn), 396, t); return [x, underY(x, d), zn - d]; }, 0);
  await ctx.yield();
  // towers: lip to crest, dropped to a low floor round the canyon, the bowl and the great curl
  grid(11, (x, t) => {
    const z0 = LIP_Z - 14 + lay.noseZ(x) * 0.5, z = lerp(z0, -3300, Math.pow(t, 1.5)), R = lerp(80, 250, clamp((-435 - z) / 1800, 0, 1));
    let y = lay.towerTop(x, z) - R * 0.95 - 10;
    y = lerp(42, y, smoothstep(250, 420, dRoute(x, z)));   // (the floor stays low for 250 m round the route: no dark ramp beside the canyon)
    return [x, y, z];
  }, 1);
  await ctx.yield();
  const g = b.build(); g.computeBoundingSphere();
  return { geometry: g, tris: b.idx.length / 3 };
}
