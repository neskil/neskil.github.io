// First Snow on Brown Paper: THE UNSEEN OAK, and the coloured-pencil-on-kraft style the whole world is drawn with.
//
// WHAT IT IS. A 40 m oak drawn in sepia before the snow comes. Every solid is a mesh that writes depth; plain solids
// (style.paper) output exactly the paper colour, shaded solids (style.paperDark, style.paperRigDark: the tree's wood,
// the animals) are hatched sepia inside their own outline, all but the side turned to the light and the tops where
// the snow is put. Everything else is hatching strokes: real quads with a place in the world (parallax, occlusion,
// metres), leaning at the hand's 55 degrees as seen on the page. White strokes settle along the top of every limb
// and twig, sepia hatch lies underneath. Three ponies stand on the bare ground beneath and forty snow buntings
// perch in rows in the crown, and lift when the snow on it is finished.
// ROUND 2 (read this before the older notes below, which it overrides where they differ):
//   groups     buf.group(x,y,z, len,wid, lanes, pen,press, T,ord,seed,flag): one quad carrying 2..7 parallel strokes
//              (aDim.z = pen + (lanes - 1)*0.06). Far off the shader lays fewer, broader lanes (never finer than 2.6 px).
//   flags      6 drift seen from above; 7 backdrop mark (true size in metres, no thinning, pressure is its tone; 7.25 is
//              cross-hatched at 25 degrees); 8 far-only mark (comes in beyond 70 to 130 m; white ones thin again beyond
//              160 m); 9 cross-hatch at 25 degrees whatever the hour.
//   sepia      is the place and is there from the start (T -9); white is the snow, part lying, the rest landing on uS.
//   the fall   a falling lead or a flake is at most 13 x 2.4 px; beyond 12 m only half the leads are shown falling and
//              beyond 66 to 96 m almost none (the snow simply comes to lie), so no white curtain stands before the tree.
//   shading    style.paperDark needs aPiv (vec3, the pivot its hatch is pinned to) and aLit (float, > 0 stays paper):
//              sweepTube fills both when out.lit, out.piv and out.litFn exist. style.paperRigDark hatches an animal's
//              flank, legs, neck and tail from its rig (the orange animal stays on style.paperRig). The hatch is in
//              page space, never finer than 2.8 px, and the tree's is laid in solid beyond 100 to 210 m.
//   uFar       (1/150, 100, 1400) in the world. layAnimal opts: far (broad far marks), lenBold (stroke length factor).
//
// EXPORTS (shade the whole world with these, so the hero is not pasted in)
//   PALETTE                    the brief's six hexes: paper, white pencil, wax (hard-pressed white), sepia, orange, fibre.
//   EXPOSURE                   1. The world returns post { flat: 1, exposure 1, bloom 0, saturation 1, contrast 1 }: no tone
//                              map, so every pigment is written as its own linear colour and lands on its hex.
//   STROKE_GLSL                screen-angle helpers shared by the stroke vertex shader.
//   RIG_GLSL                   vec3 rigPose(p, pivot, rig, time, s): the rigid-part pose used by paper AND strokes of animals.
//   makeStyle(ctx, opts)       -> style { uniforms, paper, paperRig, stroke, strokeRig, strokeLoose, strokeBird,
//                              setSeconds(s), update(time, camera), sky(radius), PEN }.  One per world. All materials are
//                              made here, once (six programs). uniforms.uS is flight seconds (0..40): EVERYTHING that lands is
//                              keyed to it, never to wall-clock time.
//   StrokeBuf                  tiny builder: add(x,y,z, len,wid, pen,pressure, T,order,seed,flag), setAlt(), setRig().
//   strokeGeometry(buf, c, r)  instanced quad geometry from a StrokeBuf (bounding sphere c, r) for a THREE.Mesh with
//                              style.stroke / strokeLoose / strokeBird / strokeRig. Paper solids: any mesh with style.paper
//                              (animals: style.paperRig with per-vertex aPiv, aRig). scene.background = style.paperScene.
//   buildHero(ctx, opts)       the oak.
//
// STROKE ATTRIBUTES (per instance)
//   aPos  xyz anchor on its surface (mesh local).
//   aDim  length m, width m, pencil (0 white, 1 sepia, 2 orange), pressure 0..1 (>= 0.9 goes waxy and solid).
//   aLand T landing time in flight seconds (T < 0: there from the start), order in its group (0 = the one that
//         falls from 16 m; 1..5 are drawn beside it at 12 a second), seed 0..1, flag (0 plain, 2 sepia cross-hatch
//         at 25 degrees gated by uDusk, 3..3.45 shed: lets go at uShedT + 1.5*(flag - 3)/0.45 (tip first) and is drawn again later,
//         4 rush, 5 moor grass, 6 a drift meant to be seen from above (keeps its white when looked down on).
//   strokeLoose adds aAlt (second anchor, where a gust of wind carries it) and aLand.w = which gust (0 or 1).
//   strokeBird  adds aAlt (its own place in the flock: along, up, across, metres); aLand = lift delay, wing (0/1), seed, row phase.
//               The flock: uniforms.uFlockC (xyz where its centre is at uBirdT, in the hero's local space; w = seconds to gather),
//               uFlockV (its velocity), uFlockEnd (xyz unit direction, w = metres along it at which a bird is gone: the tear).
//   strokeRig / paperRig add aPiv (pivot of its rigid part) and aRig (part, phase, heading yaw, shake time).
//
// buildHero opts: palette (6 hexes), detail 0.6..1 (thins apron and sepia, never the white of the oak),
//   weather 'fine' | 'heavy' (done by 26 s) | 'thin' (a half-drawn ghost), shedding (bool: the rare event at 27 s),
//   style (a style from makeStyle to share; made if absent), backdrop (paper sky + ground disc for the viewer;
//   default only in the part viewer), apron (default true: the hatched ring of moor from r 23 to 46 m that makes the
//   bare circle; pass false if your ground strokes do it, and keep them out of anchors.bareCircle),
//   ponies (default 3), buntings (default 40).
// Size: radius 26, height 40, origin at the foot of the trunk on flat ground (flatten terrain within 26 m), axes
//   are the world's: the flight arrives from -Z, light is understood from (+X, 18 deg up, -Z). Do not rotate it.
// Cost: about 143k triangles (60k stroke quads, 21-25k paper; the white count is capped so the total stays under
//   147k), 6 draw calls (8 with the viewer backdrop), no lights, no textures but the 256 x 64 pencil atlas.
// Progress: hero.setSeconds(s) (flight seconds 0..40) or hero.setProgress(u) (u -> s by the brief's pace along its
//   520 m line unless opts.secondsOfU is given). If neither is ever called (and no opts.style was passed, whose
//   owner drives style.setSeconds itself) the piece plays itself on a 46 s loop
//   from wall-clock time (that is what the part viewer shows). Timetable in anchors.times.
// Style rules kept: paper is one constant; a mark is a stroke quad, alpha-tested, never blended; exact pigment
//   whenever a stroke is its true width; a stroke widened to hold 1.5 px is drawn lighter and stands for several
//   (fewer are kept), so distance is longer, fewer, lighter, then nothing at uFar.z (600 m). No fog, no bloom.
// Anchors (local = world offsets from the trunk foot): see the end of buildHero.
// Added for the world (src/worlds/first-snow-on-kraft.js): style.strokeSnow (the fall in the air: aPos 0..1 in a box aAlt wrapped
//   round uniforms.uCam), style.strokeFlow (aAlt = the slide of a stream stroke), flags 4 (a rush that nods) and 5 (grass that
//   trembles), uniforms.uBolt (animals with shakeT -2 trot out when a bough sheds), exports sweepTube and layAnimal (one animal:
//   pony, hind or sheep; bold widens its marks), opts.tree 'oak' | 'pine' | 'beech', opts.cast, opts.ponyBold, opts.ponyRich (more
//   marks and a fifth larger: the three under the tree are seen from the turn, 35 to 50 m off). Animal strokes are
//   pushed 0.45 m toward the eye so they clear the round of the unseen body. backdrop now defaults to "no shared style passed".
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#B98F62', '#F6F1E4', '#FFFDF6', '#5B3B26', '#D9652B', '#E3D2B4'];
export const EXPOSURE = 1;

// ---- exact colour: the world returns post.flat = 1 (no tone map), so a palette colour written as linear
// (new THREE.Color(hex)) reaches the screen as that hex. Nothing is pre-corrected anywhere in this style. ----
// ---- the pencil atlas: eight strokes, 256 x 8 texels each. R = how readily the wax takes at that texel
// (1 in the core of the stroke, falling to 0 at the tapered ends and edges, broken by the paper's tooth) ----
function makeAtlas(rng) {
  const W = 256, H = 64, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let row = 0; row < 8; row++) {
    const tapA = rng.range(0.05, 0.16), tapB = rng.range(0.1, 0.3), bow = rng.range(-0.8, 0.8), ph = rng.range(0, 6.28), grit = rng.range(0.35, 0.6);
    let run = rng();
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1), end = Math.min(smoothstep(0, tapA, u), 1 - smoothstep(1 - tapB, 1, u));
      const half = 3.3 * (0.35 + 0.65 * Math.sqrt(end)) * (0.9 + 0.1 * Math.sin(u * 9 + ph)), mid = 3.5 + bow * Math.sin(u * 3.1 + ph) * 0.5;
      run = run * 0.72 + rng() * 0.28;                         // tooth runs a little way along the stroke
      for (let yy = 0; yy < 8; yy++) {
        const across = clamp(1.25 - Math.abs(yy - mid) / half, 0, 1), tooth = (1 - grit) + grit * (0.55 * rng() + 0.45 * run * 2 - 0.2);
        const v = clamp(across * (0.55 + 0.45 * end) * tooth * 1.25, 0, 1), i = ((row * 8 + yy) * W + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = Math.round(v * 255); d[i + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.colorSpace = THREE.NoColorSpace; return tex;
}

// ---- shared GLSL ----
export const STROKE_GLSL = /* glsl */`
  // the page's horizon as seen: world up projected to the screen (a bank tilts the page, not the marks on it)
  vec2 pageUp(mat4 vm){ vec2 u = (vm*vec4(0., 1., 0., 0.)).xy; float l = length(u); return l > 1e-3 ? u/l : vec2(0., 1.); }
  vec2 handAxis(vec2 up, float deg){ float a = radians(deg); vec2 hz = vec2(up.y, -up.x); return hz*cos(a) + up*sin(a); }
  float h11(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
`;
// rig = (part, phase 0..1, heading yaw, shake time in flight seconds or -1). Parts: 0 body and standing legs,
// 1 neck and head, 2 tail, 3 the leg that stamps, 4 trotting leg (phase from pivot.x). Heading: +X of the animal turned by yaw about Y.
export const RIG_GLSL = /* glsl */`
  uniform float uBolt;
  vec3 rigRot(vec3 p, vec3 c, vec3 ax, float a){ vec3 v = p - c; float s = sin(a), k = cos(a); return c + v*k + cross(ax, v)*s + ax*dot(ax, v)*(1. - k); }
  vec3 rigPose(vec3 p, vec3 piv, vec4 rig, float t, float s){
    float ph = rig.y*6.2831, part = rig.x; vec3 fw = vec3(cos(rig.z), 0., -sin(rig.z)), lat = vec3(-fw.z, 0., fw.x);
    if (part > 0.5 && part < 1.5) {                                   // head: slow swing, a dip, a look round
      p = rigRot(p, piv, lat, 0.10*sin(t*0.47 + ph) + 0.22*smoothstep(0.55, 1., sin(t*0.21 + ph*1.7)));
      p = rigRot(p, piv, vec3(0., 1., 0.), 0.30*sin(t*0.29 + ph*2.3));
    } else if (part > 1.5 && part < 2.5) {                            // tail: hangs, then flicks
      float fl = smoothstep(0.75, 1., sin(t*0.83 + ph)); p = rigRot(p, piv, fw, (0.08 + 0.75*fl)*sin(t*7.3 + ph));
    } else if (part > 2.5 && part < 3.5) {                            // one leg lifts and stamps
      float st = smoothstep(0.93, 1., sin(t*0.6 + ph)); p = rigRot(p, piv, lat, -0.7*st*abs(sin(t*5.)));
    } else if (part > 3.5) { p = rigRot(p, piv, lat, 0.55*sin(t*8.4 + piv.x*40.)); }
    float tau = s - rig.w, sh = rig.w > 0. ? smoothstep(0., 0.15, tau)*(1. - smoothstep(0.7, 1.3, tau)) : 0.;
    p += lat*((0.035*sin(t*0.37 + ph) + 0.05*sh*sin(tau*38.))*smoothstep(0., 1.2, p.y));   // weight shifts; the shake
    if (rig.w < -1.5) {                                               // the shedding: it starts and trots out the way it faces
      float tb = max(s - uBolt - 0.5*rig.y, 0.), e = smoothstep(0., 0.7, tb);
      p += fw*(30.*(1. - exp(-0.28*tb))*e) + vec3(0., 0.1*abs(sin(tb*8. + ph))*e*(1. - smoothstep(5., 8., tb)), 0.);
    }
    return p;
  }`;

// ---- the stroke: one instanced quad for everything drawn ----
const STROKE_VERT = /* glsl */`
  attribute vec3 aPos; attribute vec4 aDim; attribute vec4 aLand;
  #if defined(LOOSE) || defined(BIRD) || defined(SNOW) || defined(FLOW)
  attribute vec3 aAlt;
  #endif
  #ifdef RIG
  attribute vec3 aPiv; attribute vec4 aRig;
  #endif
  uniform float uS, uTime, uDusk, uShedT, uBirdT, uLies, uStream[5]; uniform vec3 uTree; uniform vec2 uRes, uHaloR; uniform vec4 uGust, uFlockC, uFlockEnd, uHalo; uniform vec3 uFar, uCam, uFlockV;
  varying vec2 vUv; varying vec4 vInk, vLane; varying float vFlat, vTone, vNear;
  ${STROKE_GLSL}
  ${RIG_GLSL}
  void main(){
    float T = aLand.x, ord = aLand.y, seed = aLand.z, flag = aLand.w;
    float len = aDim.x, wid = aDim.y, press = aDim.w;
    float resT = 1., pen = floor(aDim.z + 0.001), lanes = 1. + floor(fract(aDim.z)/0.06 + 0.5);   // a quad may carry a whole group of parallel strokes (lanes)
    vec3 P = aPos; float k = 1., grow = 1., ang = 55. + (seed - 0.5)*14., shift = 0., hard = 0., tl = 1., cap = 0., perched = 0.;
    #ifdef BIRD
      float tb = uS - uBirdT, tau = tb - T, wing = ord*2. - 1., th;
      if (tau < 0.) { perched = 1.;                                   // perched: a dab of two strokes that fidget
        float fid = smoothstep(0.6, 1., sin(uTime*0.9 + seed*40.));
        th = 62. - 26.*fid*abs(sin(uTime*9. + seed*17.)); P.y += 0.05*fid*abs(sin(uTime*6. + seed*9.));
      } else {                                                        // lifted: the two strokes open and close
        // off the bough in a scatter, then gathered into a flock that leads us down the last straight to the tear:
        // its centre runs along uFlockC + uFlockV*t, each bird keeps its own place in it (aAlt) and wanders a little
        float e = 1. - exp(-tau*2.3), j = smoothstep(0.6, uFlockC.w, tau);
        vec3 burst = vec3(-(0.3 + 0.95*h11(seed*5.3)), 0.5 + 0.75*h11(seed*9.1), 0.15 + 0.6*h11(seed*2.7))*(17.*e);   // out to port and toward the turn: onto blank paper, not across the white crown
        vec3 wob = vec3(sin(tau*1.1 + flag*6.3), 0.7*sin(tau*2.3 + seed*30.), cos(tau*0.9 + flag*5.1))*(1.3*e);
        vec3 C = uFlockC.xyz + uFlockV*tb + aAlt;
        P = mix(P + burst, C, j) + wob;
        th = 28. + 50.*sin(tau*13. + seed*25.); len *= 1. + 1.5*e;
        grow = 1. - smoothstep(uFlockEnd.w - 7., uFlockEnd.w, dot(P - uFlockC.xyz, uFlockEnd.xyz));   // into the tear, and gone
      }
      ang = wing > 0. ? th : 180. - th; shift = 0.46;
    #elif defined(SNOW)
      // the fall itself: strokes in the air, wrapped in a box (aAlt) round the eye, 4 m/s, turning lazily
      vec3 q0 = aPos*aAlt; q0.y -= uTime*(3.2 + 1.6*seed); q0.xz += vec2(sin(uTime*0.5 + seed*31.), cos(uTime*0.43 + seed*17.))*0.7;
      vec3 rel = mod(q0 - uCam, aAlt) - 0.5*aAlt, er = abs(rel)/(0.5*aAlt); P = uCam + rel;
      ang += 15.*sin(uTime*(0.45 + 0.6*seed) + seed*50.); grow = 1. - smoothstep(0.82, 1., max(er.x, max(er.y, er.z)));
    #else
      { vec3 w0 = (modelMatrix*vec4(aPos, 1.)).xyz;      // (round 19) beyond the stream, what the timetable lays before uLies was there from the start; not the tree (uTree: its place on the map and a radius)
        if (T >= 0. && T < uLies && w0.z > uStream[0] + uStream[1]*w0.x + uStream[2]*sin(w0.x*uStream[3] + uStream[4]) && distance(w0.xz, uTree.xy) > uTree.z) T = -9.; }
      tl = uS - T;
      if (ord < 0.5 && pen < 0.5) {                                // the one that falls (white only): 4 m/s, leaning the way the hand leans,
        if (tl < 0.) {                                                // rocking slowly as it comes down, still by the time it lands
          float f = -tl; cap = 1.; P.y += 4.*f; P.xz += vec2(sin(f*1.3 + seed*31.), cos(f*1.1 + seed*17.))*0.22*f;
          ang += 16.*sin(f*(1.1 + 0.9*seed) + seed*40.)*smoothstep(0., 0.7, f); grow = 1. - smoothstep(3.5, 4., f);
        }
      } else if (lanes < 1.5) k = clamp((tl - 0.083*max(ord, 1.))/0.12, 0., 1.);      // the rest (and every sepia or orange mark) are drawn on in place, along their length
      else k = step(0., tl);                                          // a group: its lanes are drawn on one after another in the fragment shader
      if ((flag > 8.8 && flag < 9.5) || (flag > 7.2 && flag < 7.3)) ang = 25. + (seed - 0.5)*10.;     // cross-hatch that is there whatever the hour
      if (flag > 1.5 && flag < 2.5) { ang = 25. + (seed - 0.5)*10.; k *= clamp((uDusk - (0.08 + 0.86*h11(seed*7.31)))/0.03, 0., 1.); }
      float shedF = (flag > 2.5 && flag < 3.5) ? clamp((flag - 3.)/0.45, 0., 1.) : ((flag > 8.55 && flag < 8.75) ? h11(seed*3.3 + 0.7) : -1.);
      if (shedF >= 0.) {                                              // shed: lets go from the tip inward (flag - 3 = how far in), falls as a sheet of hard white, is drawn again
        float ts = uS - uShedT - 1.5*shedF - 0.25*h11(seed + 0.21), tr = uShedT + 5.2 + 5.*h11(seed + 0.5) + 0.083*ord;
        if (ts > 0. && uS < tr) { P.y -= 2.4*ts*ts/(1. + 0.4*ts); P.x += 0.5*sin(ts*2. + seed*20.); ang += 18.*sin(ts*1.7 + seed*20.); grow *= step(0.08, P.y)*(1. - step(0.38, h11(seed*2.3 + 0.1))*step(0.3, ts)); k = 1.; hard = 0.95;       // (a good third of the load is the sheet, hard white: the rest is gone as it lets go, so the sheet stays strokes)
          float lo = smoothstep(0., 0.5, ts); len *= 1. + 0.6*lo; wid *= 1. + 0.3*lo; press = mix(press, h11(seed*1.7 + 0.3) > 0.4 ? 0.95 : 0.84, step(0.25, ts)); }
        else if (ts > 0.) k = clamp((uS - tr)/0.12, 0., 1.);
      }
    #endif
    #ifdef FLOW
      float fl = fract(uTime*0.06*(flag > 0.5 && flag < 1.5 ? 8. : 1.)*(0.7 + 0.6*seed) + seed*13.7); P += aAlt*(fl - 0.5);   // (flag 1: eight times as fast, falling snow) grow *= smoothstep(0., 0.2, fl)*(1. - smoothstep(0.8, 1., fl));
    #endif
    #if !defined(BIRD) && !defined(SNOW)
      if (flag > 4.5 && flag < 5.5) { ang += 4.5*sin(uTime*1.3 + seed*40. + aPos.x*0.25 + aPos.z*0.2); shift = 0.4; }      // moor grass trembles on its foot
      if (flag > 3.5 && flag < 4.5) { ang += 16. + 11.*sin(uTime*1.4 + seed*40. + aPos.x*0.3); shift = 0.42; }   // a rush: one long stroke that nods on its foot
    #endif
    #ifdef LOOSE
      float wx = (modelMatrix*vec4(aPos, 1.)).x, tg = (flag < 0.5 ? uGust.z : uGust.w) + (uGust.x - wx)/max(uGust.y, 0.1);
      float gf = clamp((uS - tg)/(1.5 + seed), 0., 1.), ge = gf*gf*(3. - 2.*gf), arc = sin(3.14159*gf);
      P = mix(P, aAlt, ge) + vec3(0., (1.1 + 1.4*seed)*arc, 0.); ang += arc*(seed - 0.5)*44.;
    #endif
    #ifdef RIG
      P = rigPose(P, aPiv, aRig, uTime, uS);
      if (aRig.w > 0. && seed > 0.42 && pen < 0.5) {              // the shake: half the white flies off; the snow finds it again
        float tq = uS - aRig.w - 0.15, tr = aRig.w + 2.5 + 5.*h11(seed + 0.3);
        if (tq > 0. && uS < tr) { P += normalize(vec3(h11(seed) - 0.5, 0.55, h11(seed + 0.7) - 0.5))*(3.4*tq) - vec3(0., 1.9*tq*tq, 0.); ang += 22.*sin(tq*7. + seed*30.); grow *= 1. - smoothstep(0.9, 1.6, tq); }
        else if (tq > 0.) k = clamp((uS - tr)/0.12, 0., 1.);
      }
    #endif
    vec4 mv = viewMatrix*modelMatrix*vec4(P, 1.);
    float dist = max(-mv.z, 0.1), px = 2.*dist/max(projectionMatrix[1][1]*uRes.y, 1.);
    // distance is drawn: longer, fewer, lighter, then nothing
    float back = step(6.5, flag)*step(flag, 8.75), tone0 = 1.;         // flags 7, 8: marks made for the distance, drawn the size they were given
    #ifdef SNOW
      grow *= smoothstep(1.6, 3.2, dist); cap = 1.;                   // nothing lands on the lens: a stroke fades out before it would fill the frame
    #endif
    #ifdef BIRD
      wid = max(wid, mix(2.3, 1.7, perched)*px); len = max(len, mix(mix(8., 11.5, 1. - smoothstep(3., 6., tau)), 4., perched)*px);   // off the bough each is a pair of strokes that can be counted
      grow *= step(perched*h11(seed*7.3 + 0.9), mix(1., 0.22, smoothstep(150., 230., dist)));   // from far down the valley the tree is its darks: only a few of the perched dabs are put in
    #else
      if (back < 0.5) { len *= 1. + dist*uFar.x; press *= mix(1., 0.62, smoothstep(60., 420., dist)); }
      if (cap > 0.5) grow *= step(h11(seed*4.7 + 0.3), mix(mix(1., 0.5, smoothstep(12., 42., dist)), 0.04, smoothstep(66., 96., dist)));   // the fall is seen near to; far off the snow simply comes to lie (no white curtain standing in front of the tree)
      else { tone0 = clamp(press*1.25, 0.3, 1.); press = press >= 0.9 ? press : 0.8; }   // pressure is their tone
      if (flag > 8.2 && flag < 8.75) { float dn = 26. + 12.*h11(seed*5.7 + 0.2); grow *= smoothstep(dn, dn + 12., dist)*step(h11(seed*8.9 + 0.6), 1. - 0.6*smoothstep(170., 260., dist)); }   // 8.3: the snow along a bough, a broad group standing for its twigs' worth of strokes
      else if (flag > 7.5 && flag < 8.5) { float dn = 70. + 60.*h11(seed*5.7 + 0.2); grow *= smoothstep(dn, dn + 30., dist)*(pen < 0.5 ? 1. - 0.85*smoothstep(160., 225., dist) : 1.); }   // ... the far white fewer still from the far end   // 8: only from far off (finer marks take over near to)
    #endif
    #if !defined(BIRD) && !defined(RIG)
      // THE RESERVE: the draughtsman leaves the paper round the white crown unfinished. Whatever lies beyond the tree (hillside, cloud,
      // far hills) dies away toward the crown as it stands on the page: over a band of 50 to 70 px the groups get fewer, then smaller
      // and lighter, the last ones single strokes; the edge wanders with the angle round the crown (no straight run, no corner), sits
      // close under the boughs and wider over the top. Marks flagged 7.6 are let through (the hill's foot and skyline, the sky's wash).
      if (uHalo.w > 0. && !(flag > 7.55 && flag < 7.65)) {
        vec4 hc = viewMatrix*vec4(uHalo.xyz, 1.); float hd = -hc.z;
        if (hd > 1. && dist > hd + uHaloR.x*1.15 + 2.) {
          float hpx = 2.*hd/max(projectionMatrix[1][1]*uRes.y, 1.);
          vec2 dp = (mv.xy/dist - hc.xy/hd)*(hd/hpx), rp = uHaloR/hpx + 8.*clamp(uHaloR.x/hpx/70., 0.3, 1.);
          rp.y *= dp.y > 0. ? 1.2 : 0.84;
          float th = (abs(dp.x) + abs(dp.y) > 1e-3) ? atan(dp.y, dp.x) : 0.;
          float rr = 1. + 0.12*sin(th*3. + 1.3) + 0.09*sin(th*7. + 4.1) + 0.06*sin(th*13. + 0.7) + 0.05*sin(th*23. + 2.9);
          float e = (length(dp/max(rp, vec2(1.)))/rr - 1.)/0.5, es = clamp(e, 0., 1.), hk = h11(seed*6.1 + 0.77);
          float rs = mix(1., es, uHalo.w);
          grow *= step(hk*0.92 + 0.04, mix(1., es*(2. - es), uHalo.w));                  // fewer ...
          len *= mix(0.42, 1., rs); wid *= mix(0.3, 1., rs*rs); resT = mix(0.72, 1., rs);   // ... then smaller and lighter, down to single strokes
        }
      }
    #endif
    if (cap > 0.5) { len = min(len, 13.*px); wid = min(wid, 2.4*px); }                  // a flake in the air is a short stroke, however near the eye
    #if !defined(BIRD) && !defined(SNOW)
      { float lcap = 0.111*uRes.y, lpx = len/px; if (lpx > lcap) len = px*(lcap + 0.35*(lpx - lcap)); }       // (5c, G5) the pencil's reach: near the eye a stroke is a hand's stroke on the page, not a plank
    #endif
    float single = step(lanes, 1.5);
    lanes = lanes > 1.5 ? clamp(floor(wid/(2.6*px)), 1., lanes) : 1.;                   // far off the hand lays fewer, broader strokes in the same patch: never a lane finer than 2.6 px
    float lw = wid/lanes, laneMix = 1.;
    // (5c, G5) near the eye a stroke is never drawn thicker than the pencil: a lane wider than 8 px keeps a 5 px stroke and leaves paper beside it;
    // from 3 px up the stroke shows the paper's tooth (vNear), whatever the pressure
    float pk = max(uRes.y/450., 1.), lwp = lw/(px*pk), lscale = max(1.5, lwp/5.3), spx = single > 0.5 ? wid/(px*pk) : min(lwp/1.5, 5.3);   // (sizes on the sheet: px of a 450-line page)
    vNear = cap > 0.5 ? 0. : smoothstep(2.8, 4.8, spx)*(0.5 + 0.5*h11(seed*9.7 + 0.13));
    #ifndef BIRD
      if (single > 0.5 && cap < 0.5) wid = min(wid, 6.5*px*pk);
    #endif
    float w = max(wid, 1.5*px), thin = sqrt(clamp(wid/w, 0., 1.)), lf = mix(1., clamp(len/(4.*px), 0., 1.), smoothstep(150., 230., dist)); len = max(len, 4.*px);
    vTone = clamp(thin*1.15, 0.5, 1.)*mix(pen < 0.5 ? 0.74 : 0.86, 1., laneMix)*tone0*resT;   // a mark widened to stay visible is drawn lighter: exact pigment whenever it is its true width
    #ifdef BIRD
      vTone = max(vTone, 0.94);                                       // a bunting is small and stays white
    #else
      float six = step(5.5, flag)*step(flag, 6.5), elev = six > 0.5 ? clamp((uCam.y - (modelMatrix*vec4(P, 1.)).y)/dist, 0., 1.) : 1.;
      if (six > 0.5) vTone = max(vTone, 0.92*smoothstep(0.1, 0.24, elev));   // a drift drawn to be seen from above keeps its white from up there ...
      vTone = max(vTone, hard);
      // a single stroke too fine to draw is not drawn paler: fewer of them are drawn, each in the pencil's own colour (white or absent)
      float pure = single*(1. - back)*(1. - smoothstep(0.72, 0.97, thin)), tOld = vTone; vTone = mix(vTone, 1., pure);
      // ... and stands for several: keep only as many as hold the same tone (no white-out far off)
      float keep = min(clamp(uFar.y/dist, 0.3, 1.), clamp(1.9*thin*thin*lf - 0.06, 0., 1.))*clamp(3.4*elev, 0.16, 1.);   // (from the far end of the valley a mark lengthened to stay visible counts for less again: the far tree is its darks, not a white burst)   // ... and seen edge-on from low down, where a metre of moor is a sliver, only a few of them stand
      keep *= mix(1., clamp(1.5*tOld, 0., 1.), pure);
      if (back < 0.5) grow *= (1. - smoothstep(keep, keep + 0.08, h11(seed*3.1 + 0.4)))*(1. - smoothstep(uFar.z*0.8, uFar.z, dist));
    #endif
    vFlat = smoothstep(max(lw, 1.5*px)/9., max(lw, 1.5*px)/4.5, px); vLane = vec4(lanes, tl, lscale, ord);
    vec2 up = pageUp(viewMatrix), ax = handAxis(up, ang), pr = vec2(-ax.y, ax.x), q = position.xy;
    #ifdef RIG
      mv.xyz *= 1. - min(0.45, 0.3*dist)/dist;                        // an animal's marks clear the round of its (unseen) body
    #else
      mv.xyz *= 1. - 0.06/dist;                                       // 6 cm toward the eye
    #endif
    float along = (q.x + 0.5)*k;
    mv.xy += (ax*(len*(along - 0.5 + shift)) + pr*(w*q.y))*grow;
    vUv = vec2(along, q.y + 0.5); vInk = vec4(pen, press, seed, len);
    gl_Position = (k*grow < 1e-3) ? vec4(2., 2., 2., 1.) : projectionMatrix*mv;
  }`;
const STROKE_FRAG = /* glsl */`
  uniform sampler2D uAtlas; uniform vec3 uPaperD, uWhiteD, uWaxD, uSepiaD, uOrangeD;
  varying vec2 vUv; varying vec4 vInk, vLane; varying float vFlat, vTone, vNear;
  void main(){
    float press = vInk.y, wax = step(0.9, press), row = floor(clamp(vInk.z, 0., 0.999)*8.);
    vec2 uv = vUv;
    if (vLane.x > 1.5) {                                              // a group of hatching: several strokes side by side in one quad
      float ly = vUv.y*vLane.x, j = min(floor(ly), vLane.x - 1.); ly -= j;
      float h1 = fract(sin((vInk.z*91.7 + j)*12.9898)*43758.5453), h2 = fract(h1*7.31 + 0.37);
      float a = (0.22 + 0.2*vNear)*h1*h1, b = 1. - (0.26 + 0.2*vNear)*h2*h2;                      // each starts and stops where the hand did
      float u = (vUv.x - a)/(b - a), y = (ly - 0.5)*vLane.z + 0.5 + (vUv.x - 0.5)*(h2 - 0.5)*0.8*(vLane.z - 1.);   // paper between the lanes; no two quite parallel
      float on = vLane.y < 0. ? (abs(j - floor(vLane.x*0.5)) < 0.5 ? 1. : 0.) : clamp((vLane.y - 0.083*(vLane.w + j))/0.12, 0., 1.);   // the lead falls alone; the rest are drawn beside it, twelve a second
      if (u < 0. || u > on || y < 0. || y > 1.) discard;
      uv = vec2(u, y); row = mod(row + j, 8.);
    }
    float c = texture2D(uAtlas, vec2(uv.x, (row + 0.1 + 0.8*uv.y)/8.)).r;
    float rb = abs(fract(uv.x*vInk.w/0.08 + vInk.z*5.) - 0.5)*2.;     // the paper's ribbing breaks a light stroke every 8 cm
    float fine = c - smoothstep(0.7, 1., rb)*0.55*(1. - press) - mix(0.74, 0.16, press)*(1. - wax) - 0.07*wax - vNear*(0.2 + 0.26*smoothstep(0.5, 1., rb));
    float ends = min(smoothstep(0., 0.14, uv.x), 1. - smoothstep(0.78, 1., uv.x));
    float flatC = ends*(1. - abs(uv.y - 0.5)*2.)*1.7 - mix(0.8, 0.3, press);            // too small for tooth: the flat average tint instead
    if (mix(fine, flatC, vFlat) < 0.) discard;
    vec3 ink = vInk.x < 0.5 ? mix(uWhiteD, uWaxD, wax) : (vInk.x < 1.5 ? uSepiaD : uOrangeD);
    gl_FragColor = vec4(mix(uPaperD, ink, vTone), 1.);
  }`;
const PAPER_VERT = /* glsl */`
  #ifdef RIG
  attribute vec3 aPiv; attribute vec4 aRig; uniform float uS, uTime;
  ${RIG_GLSL}
  #endif
  #ifdef SHADE
  #ifndef RIG
  attribute vec3 aPiv; attribute float aLit;
  #endif
  uniform vec2 uRes; varying vec4 vHatch; varying float vDuty;
  #endif
  void main(){
    vec3 P = position;
    #ifdef RIG
      P = rigPose(P, aPiv, aRig, uTime, uS);
    #endif
    #ifdef SHADE
      // Shaded solids: sepia hatching inside the outline. An animal's flank, legs, neck and tail (its back is left for the snow); the
      // tree's wood wherever aLit < 0 (all of it but the edge turned to the light and the tops of the boughs). The hatch is pinned to
      // the part's pivot on the page and is a pencil line wide there (never finer than 2.8 px), so it rides with the part.
      vec4 pc = projectionMatrix*viewMatrix*modelMatrix*vec4(aPiv, 1.); float pw = max(pc.w, 0.5);
      #ifdef RIG
        float dark = (aRig.x > 0.5 && aRig.x < 2.5) ? -1. : P.y - aPiv.y - 0.2, per = 0.085, duty = 0.62;
      #else
        float dark = aLit, per = 0.3, duty = mix(0.62, 0.97, smoothstep(100., 210., pw));   // from far off the wood is laid in solid: a limb two pixels wide cannot be hatched
      #endif
      vHatch = vec4((pc.xy/pw*0.5 + 0.5)*uRes, max(per*projectionMatrix[1][1]*uRes.y*0.5/pw, 2.8), dark);
      vDuty = duty;
    #endif
    gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(P, 1.);
  }`;
const PAPER_FRAG = /* glsl */`
  uniform vec3 uPaperS;
  #ifdef SHADE
  uniform vec3 uSepiaD; varying vec4 vHatch; varying float vDuty;
  #endif
  void main(){
    vec3 col = uPaperS;
    #ifdef SHADE
      if (vHatch.w < 0.) {
        vec2 d = (gl_FragCoord.xy - vHatch.xy)/vHatch.z;
        float c = d.y*0.5736 - d.x*0.8192, al = d.x*0.5736 + d.y*0.8192, h = fract(sin(floor(c)*12.9898)*43758.5453);
        col = mix(col, uSepiaD, step(fract(c), vDuty)*step(0.1*step(vDuty, 0.9), fract(al*0.09 + h)));    // each line stops and starts where the hand did
      }
    #endif
    gl_FragColor = vec4(col, 1.);
  }`;

const lin = (hex) => new THREE.Color(hex);
export function makeStyle(ctx, opts = {}) {
  const pal = opts.palette || PALETTE, rng = ctx.rng.fork('kraft-style');
  const uniforms = {
    uS: { value: 0 }, uTime: { value: 0 }, uLies: { value: -1 }, uStream: { value: [0, 0, 0, 0, 0] }, uTree: { value: new THREE.Vector3() }, uDusk: { value: 0 }, uShedT: { value: 1e6 }, uBirdT: { value: 30 },
    uFlockC: { value: new THREE.Vector4(-14, 26, 36, 2.4) }, uFlockV: { value: new THREE.Vector3(-11.8, 2.1, 0) }, uFlockEnd: { value: new THREE.Vector4(-0.985, 0.174, 0, 1e5) },   // the flock's line (see BIRD), set by the world
    uRes: { value: new THREE.Vector2(1280, 720) }, uCam: { value: new THREE.Vector3() }, uBolt: { value: 1e6 }, uGust: { value: new THREE.Vector4(60, 12, 19, 30) },   // world x where a front starts, m/s, the two gust times
    uFar: { value: new THREE.Vector3(1 / 45, 120, 600) },
    uHalo: { value: new THREE.Vector4(0, 20, 0, 0) }, uHaloR: { value: new THREE.Vector2(26, 16) },   // the reserve round the crown: world centre + strength (0 = none), half width and half height in metres
                                                // longer per metre, fewer beyond, nothing beyond
    uAtlas: { value: makeAtlas(rng) },
    uPaperD: { value: lin(pal[0]) }, uWhiteD: { value: lin(pal[1]) }, uWaxD: { value: lin(pal[2]) }, uSepiaD: { value: lin(pal[3]) }, uOrangeD: { value: lin(pal[4]) },
    uPaperS: { value: lin(pal[0]) },
  };
  const mk = (defines, vert, frag, side) => new THREE.ShaderMaterial({ uniforms, defines, vertexShader: vert, fragmentShader: frag, side, fog: false, toneMapped: false });
  const style = {
    uniforms, palette: pal, PEN: { white: 0, sepia: 1, orange: 2 },
    paper: mk({}, PAPER_VERT, PAPER_FRAG, THREE.DoubleSide), paperRig: mk({ RIG: 1 }, PAPER_VERT, PAPER_FRAG, THREE.DoubleSide), paperRigDark: mk({ RIG: 1, SHADE: 1 }, PAPER_VERT, PAPER_FRAG, THREE.DoubleSide), paperDark: mk({ SHADE: 1 }, PAPER_VERT, PAPER_FRAG, THREE.DoubleSide),
    stroke: mk({}, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide), strokeRig: mk({ RIG: 1 }, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide),
    strokeLoose: mk({ LOOSE: 1 }, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide), strokeBird: mk({ BIRD: 1 }, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide),
    strokeSnow: mk({ SNOW: 1 }, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide), strokeFlow: mk({ FLOW: 1 }, STROKE_VERT, STROKE_FRAG, THREE.DoubleSide),
    paperScene: lin(pal[0]), duskHint: opts.duskHint ?? 0,
    // flight seconds: everything that lands is keyed to this. Dusk (the second sepia pass) follows unless you set uDusk yourself after.
    setSeconds(s) { uniforms.uS.value = s; uniforms.uDusk.value = clamp(style.duskHint + (1 - style.duskHint) * smoothstep(8, 40, s), 0, 1); },
    // every frame: wall-clock time for ambient loops, and the drawing buffer height for the 1.5 pixel rule
    update(time, camera) { uniforms.uTime.value = time; if (camera) camera.getWorldPosition(uniforms.uCam.value); if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(uniforms.uRes.value); } },
    // a paper sky for scenes that cannot use scene.background = style.paperScene; keep it centred on the camera
    sky(radius = 2500) { const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8), mk({}, PAPER_VERT, PAPER_FRAG, THREE.BackSide)); m.material.depthWrite = false; m.renderOrder = -1; m.frustumCulled = false; return m; },
  };
  return style;
}

// ---- stroke instance buffers ----
export class StrokeBuf {
  constructor(kind = '') { this.kind = kind; this.pos = []; this.dim = []; this.land = []; this.alt = []; this.piv = []; this.rig = []; this.n = 0; }
  // pen 0 white, 1 sepia, 2 orange. T < 0: there from the start. ord 0 falls; 1..5 are drawn on after it. flag: see the header.
  add(x, y, z, len, wid, pen, press, T, ord, seed, flag = 0) { this.pos.push(x, y, z); this.dim.push(len, wid, pen, press); this.land.push(T, ord, seed, flag); return this.n++; }
  // a group: `lanes` parallel strokes in one quad `wid` metres across all told (2..7 lanes)
  group(x, y, z, len, wid, lanes, pen, press, T, ord, seed, flag = 0) { return this.add(x, y, z, len, wid, pen + (Math.min(7, Math.max(1, lanes)) - 1) * 0.06, press, T, ord, seed, flag); }
  setAlt(x, y, z) { this.alt.push(x, y, z); }                       // strokeLoose / strokeBird: once per add()
  setRig(px, py, pz, part, phase, yaw, shakeT) { this.piv.push(px, py, pz); this.rig.push(part, phase, yaw, shakeT); }   // strokeRig: once per add()
}
const QUAD_POS = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
export function strokeGeometry(buf, center = new THREE.Vector3(), radius = 1e4) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(QUAD_POS, 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const ia = (name, arr, n) => { if (arr.length) g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n)); };
  ia('aPos', buf.pos, 3); ia('aDim', buf.dim, 4); ia('aLand', buf.land, 4); ia('aAlt', buf.alt, 3); ia('aPiv', buf.piv, 3); ia('aRig', buf.rig, 4);
  g.instanceCount = buf.n; g.boundingSphere = new THREE.Sphere(center.clone(), radius); return g;
}

// ---- paper solids: tubes swept along chains of [x, y, z, r] (positions and indices only: paper has no shading) ----
export function sweepTube(chain, sides, out, squash = 1, rigOut = null, rig = null) {
  const base = out.pos.length / 3, n = chain.length;
  let nx = 0, ny = 0, nz = 0, first = true;
  for (let i = 0; i < n; i++) {
    const a = chain[Math.max(0, i - 1)], b = chain[Math.min(n - 1, i + 1)], c = chain[i];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    if (first) { if (Math.abs(ty) < 0.9) { nx = 0; ny = 1; nz = 0; } else { nx = 1; ny = 0; nz = 0; } first = false; }
    const dn = nx * tx + ny * ty + nz * tz; nx -= dn * tx; ny -= dn * ty; nz -= dn * tz; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    for (let s = 0; s < sides; s++) {
      const an = (s / sides) * Math.PI * 2, ca = Math.cos(an) * c[3], sa = Math.sin(an) * c[3] * squash;
      out.pos.push(c[0] + nx * ca + bx * sa, c[1] + ny * ca + by * sa, c[2] + nz * ca + bz * sa);
      if (out.lit) { const cs = Math.cos(an), sn = Math.sin(an); out.lit.push(out.litFn(nx * cs + bx * sn, ny * cs + by * sn, nz * cs + bz * sn)); out.piv.push(chain[0][0], chain[0][1], chain[0][2]); }   // shaded solids (style.paperDark): > 0 is left as paper
      if (rigOut) { rigOut.piv.push(rig[0], rig[1], rig[2]); rigOut.rig.push(rig[3], rig[4], rig[5], rig[6]); }
    }
    if (i > 0) for (let s = 0; s < sides; s++) {
      const p0 = base + (i - 1) * sides + s, p1 = base + (i - 1) * sides + (s + 1) % sides, q0 = p0 + sides, q1 = p1 + sides;
      out.idx.push(p0, q0, p1, p1, q0, q1);
    }
  }
  return base;
}

// ---- the oak's skeleton: branches = { pts: [[x,y,z,r]...], depth, limb, len, frames } ----
async function growOak(rng, noise, P, ctx) {
  const branches = [], V = (x, y, z) => [x, y, z];
  const env = (x0, y, z0) => {                                       // 1 on the crown's surface
    const x = x0 - P.cx, z = z0 - P.cz;
    const az = Math.atan2(x, z), R = P.crownR * (1 + 0.13 * noise.n2(Math.cos(az) * 1.3 + P.k, Math.sin(az) * 1.3)) * (1 + 0.1 * Math.cos(az - P.leanAz));
    const dy = y - P.crownY, ry = dy > 0 ? P.height - P.crownY : P.crownY - P.lowY;
    return Math.sqrt((x * x + z * z) / (R * R) + (dy * dy) / (ry * ry));
  };
  const SEG = [2.0, 1.5, 1.1, 0.8, 0.55, 0.42], KINK = [0.07, 0.3, 0.36, 0.42, 0.5, 0.55], MAXLEN = [0, 30, 13, 5.6, 3.1, 1.7];
  const GAP = [0, 1.9, 1.3, 1.0, 0.8, 9], queue = [];
  function grow(p0, d0, length, r0, depth, limb) {
    const pts = [[p0[0], p0[1], p0[2], r0]], nSeg = Math.max(2, Math.round(length / SEG[depth]));
    let d = d0.slice(), p = p0.slice(), nextKid = depth === 0 ? 1e9 : GAP[depth] * rng.range(0.9, 1.6) + (depth === 1 ? 2.5 : 0.3), run = 0, side = rng.sign();
    const kids = [];
    for (let i = 1; i <= nSeg; i++) {
      const t = i / nSeg, k = KINK[depth];
      d = [d[0] + rng.range(-k, k), d[1] + rng.range(-k, k) * 0.8, d[2] + rng.range(-k, k)];
      const e = env(p[0], p[1], p[2]), hl = Math.hypot(d[0], d[2]);
      if (depth >= 1) {
        d[1] += depth === 1 ? (t < 0.45 ? -0.05 : 0.11) : 0.05 + 0.05 * (e > 0.8 ? 1 : 0);          // heavy limbs sag, then the tips turn up
        if (e > 0.82) { const pull = (e - 0.82) * 2.2, rl = Math.hypot(p[0], p[2]) || 1; d[0] -= (p[0] / rl) * pull * hl; d[2] -= (p[2] / rl) * pull * hl; d[1] -= Math.sign(p[1] - P.crownY) * pull * 0.5; }
        if (p[1] < P.lowY + 1.5) d[1] += 0.16;
      }
      const dl = Math.hypot(d[0], d[1], d[2]) || 1; d = [d[0] / dl, d[1] / dl, d[2] / dl];
      const seg = length / nSeg; p = [p[0] + d[0] * seg, p[1] + d[1] * seg, p[2] + d[2] * seg]; run += seg;
      const r = Math.max(P.rMin[depth], r0 * Math.pow(1 - 0.82 * t, depth <= 1 ? 0.8 : 1.0));
      pts.push([p[0], p[1], p[2], r]);
      if (depth >= 1 && env(p[0], p[1], p[2]) > 1.04) break;
      while (depth >= 1 && depth < 5 && run >= nextKid && nextKid < length * 0.97) {
        const back = run - nextKid, kp = [p[0] - d[0] * back, p[1] - d[1] * back, p[2] - d[2] * back];
        const runK = nextKid; nextKid += GAP[depth] * rng.range(0.75, 1.3); side = -side;
        // a child leaves sideways (alternating), a little up, at 40-70 degrees from its parent
        let sx = d[2] * side, sy = rng.range(0.1, 0.75), sz = -d[0] * side; const tw = rng.range(-0.5, 0.5); sx += d[0] * tw; sz += d[2] * tw;
        const a = rng.range(0.7, 1.2), ca = Math.cos(a), sa = Math.sin(a), cd = [d[0] * ca + sx * sa, d[1] * ca + sy * sa, d[2] * ca + sz * sa];
        const cl = Math.min(MAXLEN[depth + 1], (length - runK) * rng.range(0.55, 0.95) + MAXLEN[depth + 1] * 0.3) * rng.range(0.75, 1.1);
        kids.push([kp, cd, cl, Math.max(P.rMin[depth + 1], r * rng.range(0.42, 0.6))]);
      }
    }
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
    const br = { pts, depth, limb, len, order: branches.length }; branches.push(br);
    for (const kd of kids) queue.push([kd[0], kd[1], kd[2], kd[3], depth + 1, limb]);
    return br;
  }
  // trunk: a leaning S with a flared foot
  const tr = [], lean = P.lean, la = P.leanAz, forkY = P.forkY;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, y = -0.6 + (forkY + 0.6) * t, sway = Math.sin(t * 3.0 + P.k) * 0.5 * t;
    const r = 1.12 + 0.42 * Math.pow(1 - t, 1.5) + 1.0 * Math.pow(Math.max(0, 1 - y / 2.6), 2.2) + 0.12 * Math.sin(t * 7 + P.k * 3);
    tr.push([Math.sin(la) * (lean * t * forkY + sway), y, Math.cos(la) * (lean * t * forkY) - sway * 0.6, r]);
  }
  branches.push({ pts: tr, depth: 0, limb: 0, len: forkY + 0.6, order: 0 });
  const at = (y) => { const f = clamp((y + 0.6) / (forkY + 0.6), 0, 1) * 8, i = Math.min(7, Math.floor(f)), k = f - i; return tr[i].map((v, j) => lerp(v, tr[i + 1][j], k)); };
  // great boughs: low ones nearly level from 6 m, leaders from the fork
  let az = 0; const nLow = P.nLow, nLead = P.nLead, azLow = rng.range(0, 6.28), azLead = rng.range(0, 6.28);
  for (let i = 0; i < nLow + nLead; i++) {
    const low = i < nLow, y = low ? lerp(P.lowY + 0.2, forkY - 2.2, nLow > 1 ? i / (nLow - 1) : 0.3) + rng.range(-0.3, 0.6) : forkY - rng.range(0, 0.8);
    const c = at(y), el = low ? rng.range(0.1, 0.36) : (i === nLow ? rng.range(1.2, 1.36) : rng.range(0.7, 1.15)), r0 = low ? rng.range(0.46, 0.62) : rng.range(0.55, 0.78);
    az = (low ? azLow + (i / nLow) * 6.283 * (nLow > 4 ? 2 : 1) : azLead + ((i - nLow) / nLead) * 6.283) + rng.range(-0.4, 0.4);
    const d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    grow(V(c[0] + d[0] * c[3] * 0.55, y, c[2] + d[2] * c[3] * 0.55), d, low ? rng.range(19, 25) : rng.range(24, 30), r0, 1, i + 1);
  }
  for (let qi = 0; qi < queue.length; qi++) { const q = queue[qi]; grow(q[0], q[1], q[2], q[3], q[4], q[5]); if (qi % 250 === 249) await ctx.yield(); }
  branches.sort((a, b) => a.limb - b.limb || a.depth - b.depth); for (let i = 0; i < branches.length; i++) branches[i].order = i;
  return branches;
}

const LIGHT = new THREE.Vector3(0.55, 0.31, -0.78).normalize();     // understood, never shown: behind the starboard shoulder, 18 degrees up
// ---- one animal: paper body in rigid parts and the strokes that ride them. acc = { paper: {pos, idx}, rig: {piv, rig}, strokes: StrokeBuf('rig') };
// o = { ox, oz, oy, yaw, sc, phase, shakeT (flight seconds, -1 never, -2 bolts at uBolt), headDrop, T0, spread, kind 'pony' | 'hind' | 'sheep' } ----
export function layAnimal(acc, pr, o) {
  const { ox, oz, yaw, sc, phase, shakeT, headDrop } = o, oy = o.oy || 0, ponyPaper = acc.paper, ponyRig = acc.rig, pony = acc.strokes;
  const bold = o.bold || 1, rich = o.rich || 1, N = (n) => Math.round(n * rich);     // rich: more marks on the one seen at arm's length
  const [ka, ky, kl] = o.kind === 'hind' ? [1.04, 1.2, 0.82] : o.kind === 'sheep' ? [0.82, 0.8, 1.15] : [1, 1, 1];
    const fx = Math.cos(yaw), fz = -Math.sin(yaw), lx = Math.sin(yaw), lz = Math.cos(yaw);
    const W = (a, y, l) => [ox + (fx * a * ka + lx * l * kl) * sc, oy + y * ky * sc, oz + (fz * a * ka + lz * l * kl) * sc];
    const chain = (pts) => pts.map((q) => { const w = W(q[0], q[1], q[2]); return [w[0], w[1], w[2], q[3] * sc]; });
    const part = (pts, sides, squash, id, pv) => { const w = W(pv[0], pv[1], pv[2]); sweepTube(chain(pts), sides, ponyPaper, squash, ponyRig, [w[0], w[1], w[2], id, phase, yaw, shakeT]); };
    const stampSide = pr.sign(), hd = headDrop, LEGS = [[0.6, 1], [0.4, -1], [-0.44, 1], [-0.66, -1]];      // the four legs stand apart (near fore forward, far hind back): each is seen from the side
    part([[-0.78, 1.0, 0, 0.2], [-0.62, 1.02, 0, 0.33], [-0.3, 1.0, 0, 0.385], [0.1, 0.97, 0, 0.4], [0.45, 1.0, 0, 0.37], [0.66, 1.05, 0, 0.27], [0.74, 1.08, 0, 0.14]], 8, 0.8, 0, [0, 1, 0]);
    part([[0.56, 1.06, 0, 0.27], [0.8, 1.28 - hd * 0.3, 0, 0.2], [1.0, 1.5 - hd, 0, 0.16], [1.18, 1.46 - hd * 1.3, 0, 0.14], [1.4, 1.28 - hd * 1.6, 0, 0.09], [1.47, 1.2 - hd * 1.7, 0, 0.055]], 6, 0.75, 1, [0.58, 1.08, 0]);
    part([[-0.76, 1.14, 0, 0.07], [-0.92, 0.9, 0, 0.1], [-0.98, 0.5, 0, 0.075], [-0.96, 0.32, 0, 0.03]], 5, 0.8, 2, [-0.76, 1.14, 0]);
    for (const [la, ll] of LEGS) {
      const st = la > 0 && ll === stampSide, k = la > 0 ? 0 : -0.07;
      part([[la, 0.95, ll * 0.15, 0.15], [la + k, 0.56, ll * 0.16, 0.08], [la - k * 0.6, 0.14, ll * 0.16, 0.055], [la - k * 0.6 + 0.03, 0.0, ll * 0.16, 0.075]], 5, 1, st ? 3 : 0, [la, 0.92, ll * 0.15]);
    }
    // strokes: white where the snow lies (back, rump, crest, poll, dock), sepia under belly, jaw and down the far legs
    const T0 = o.T0 + pr.range(0, 1.5); let go = 0, gt = T0, gl = 0;
    const put = (a, y, l, pen, press, len, id, pv) => {
      if (gl <= 0) { gl = 5 + pr.int(0, 1); go = 0; gt = T0 + pr.range(0, o.spread ?? 4.5) + (pen ? 1 : 0); }
      gl--; const w = W(a, y, l), p = W(pv[0], pv[1], pv[2]);
      pony.add(w[0], w[1], w[2], len * sc * (o.lenBold ?? bold), pr.range(0.034, 0.048) * (0.4 + 0.6 * bold), pen, press, pen ? -9 : gt, pen ? Math.max(go++, 1) : go++, pr(), 0); pony.setRig(p[0], p[1], p[2], id, phase, yaw, shakeT);
    };
    const farSide = (lx * LIGHT.x + lz * LIGHT.z) > 0 ? -1 : 1, bodyR = (a) => 0.4 - 0.22 * Math.pow(Math.abs(a - 0.05) / 0.8, 2.2);
    const B0 = [0, 1, 0], N0 = [0.58, 1.08, 0], D0 = [-0.76, 1.14, 0], sl = () => pr.range(0.15, 0.22), hp = () => pr.range(0.6, 0.85);
    for (let i = 0, n = N(24); i < n; i++) { const a = -0.38 + (i + pr()) / n, f = pr.range(-0.55, 0.55), r = bodyR(a); put(a, 1.02 + Math.cos(f) * r, Math.sin(f) * r * 0.8, 0, hp(), sl(), 0, B0); }          // the back
    gl = 0; for (let i = 0, n = N(12); i < n; i++) { const a = pr.range(-0.8, -0.38), f = pr.range(-0.9, 0.9), r = bodyR(a); put(a, 1.02 + Math.cos(f) * r, Math.sin(f) * r * 0.8, 0, i % 3 === 0 ? 0.95 : hp(), sl(), 0, B0); }   // the rump, pressed hard
    gl = 0; for (let i = 0, n = N(12); i < n; i++) { const t = (i + pr()) / n; put(lerp(0.6, 1.0, t), lerp(1.36, 1.68 - hd, t), pr.range(-0.06, 0.06), 0, hp(), pr.range(0.2, 0.3), 1, N0); }                      // crest and mane
    for (let i = 0; i < 6; i++) { const t = (i + pr()) / 6; put(lerp(1.02, 1.42, t), lerp(1.67 - hd, 1.38 - hd * 1.6, t), pr.range(-0.04, 0.04), 0, hp(), pr.range(0.12, 0.16), 1, N0); }                 // poll to nose
    for (const e of [-1, 1]) put(0.99, 1.75 - hd, e * 0.055, 0, 0.95, 0.12, 1, N0);                                                                                                                    // ears
    for (let i = 0; i < 4; i++) { const t = (i + pr()) / 4; put(lerp(-0.8, -1.02, t), lerp(1.22, 0.78, t), 0, 0, hp(), 0.18, 2, D0); }                                                                 // dock
    gl = 0; for (let i = 0, n = N(14); i < n; i++) { const a = -0.5 + (i + pr()) / n, f = pr.range(-0.5, 0.5), r = bodyR(a); put(a, 0.99 - Math.cos(f) * r, Math.sin(f) * r * 0.8 + farSide * 0.05, 1, hp(), pr.range(0.16, 0.24), 0, B0); }   // under the belly
    for (let i = 0; i < 5; i++) { const t = (i + pr()) / 5; put(lerp(-0.93, -0.97, t), lerp(0.85, 0.36, t), 0, 1, hp(), 0.2, 2, D0); }                                                                 // the tail's hang
    for (let i = 0; i < 6; i++) { const t = (i + pr()) / 6; put(lerp(0.68, 1.3, t), lerp(0.93, 1.2 - hd * 1.5, t), farSide * 0.05, 1, pr.range(0.5, 0.75), 0.18, 1, N0); }                             // chest, throat, jaw
    for (const [la, ll] of LEGS) {                                                                                                                           // down the legs, the far ones darker
      const st = la > 0 && ll === stampSide, n = N(ll === farSide ? 5 : 3); gl = 0;
      for (let i = 0; i < n; i++) put(la + pr.range(-0.03, 0.03) + (la < 0 ? -0.05 : 0), lerp(0.76, 0.1, (i + pr() * 0.6) / n), ll * 0.16 + farSide * 0.03, 1, pr.range(0.55, 0.8), pr.range(0.13, 0.18), st ? 3 : 0, [la, 0.92, ll * 0.15]);
    }
    {                                                                 // the dark of the animal: sepia hatch over flank, quarters, neck and face; snow on top, paper between
      // ... and the snow that lies along its back and rump, pressed hard: the first thing seen of it
      for (let i = 0, n = N(5); i < n; i++) { const a = -0.72 + 1.3 * (i + pr()) / n, w = W(a, 1.06 + bodyR(a) * 0.98, pr.range(-0.06, 0.06)), p = W(0, 1, 0); pony.group(w[0], w[1], w[2], pr.range(0.26, 0.34) * sc, pr.range(0.3, 0.38) * sc, 5, 0, i % 2 ? 0.95 : pr.range(0.74, 0.88), o.T0 < 0 || pr() < 0.5 ? -9 : T0 + pr.range(0, 3), 0, pr(), 0); pony.setRig(p[0], p[1], p[2], 0, phase, yaw, shakeT); }
    }
    const rl = o.redLen ?? 1;                                         // (round 19) the orange strokes' length factor: an animal laid a size up may keep the length its orange had
    if (o.red) {                                                      // the third pencil: sanguine hatched on flank and neck (a bay coat, a red deer; on a hill sheep the raddle mark on its rump)
      const sheep = o.kind === 'sheep', a0 = sheep ? -0.62 : -0.42, a1 = sheep ? -0.3 : 0.5; gl = 0;
      for (const sd of [-1, 1]) for (let i = 0, n = Math.round(N(9) * o.red); i < n; i++) { const a = lerp(a0, a1, (i + pr()) / n), f = sheep ? pr.range(0.1, 0.7) : pr.range(0.55, 1.35), r = bodyR(a) + 0.02; put(a, 1.0 + Math.cos(f) * r, sd * Math.sin(f) * r * 0.82, 2, pr.range(0.84, 0.95), pr.range(0.2, 0.3) * rl, 0, B0); }
      if (!sheep) for (const sd of [-1, 1]) for (let i = 0; i < Math.round(5 * o.red); i++) { const t = (i + pr()) / 5; put(lerp(0.66, 1.02, t), lerp(1.16, 1.44 - hd, t), sd * 0.17, 2, pr.range(0.84, 0.95), pr.range(0.16, 0.24) * rl, 1, N0); }
    }
    if (o.far) {                                                      // seen from 30 m and more: a few broad marks that stand for the rest (flag 8 gives way to the fine ones near to)
      const fm = (a, y, l, len, wid, pen, press, id, pv) => { const w = W(a, y, l), p = W(pv[0], pv[1], pv[2]); pony.add(w[0], w[1], w[2], len * sc, wid * sc, pen, press, pen ? -9 : o.T0 + pr.range(0, 3), 1, pr() * 0.4, o.far === true ? 8 : 7); pony.setRig(p[0], p[1], p[2], id, phase, yaw, shakeT); };
      for (const a of [-0.62, -0.34, -0.06, 0.22, 0.5]) fm(a, 1.47, 0, 0.3, 0.3, 0, 0.95, 0, B0);                        // the snow: a line along the back, a third of the body deep
      fm(1.0, 1.7 - hd, 0, 0.2, 0.2, 0, 0.95, 1, N0);                                                                    // ... and a touch on the poll
      // neck and head leave the body's outline, in sepia
      fm(0.74, 1.24 - hd * 0.3, farSide * 0.04, 0.44, 0.26, 1, 0.9, 1, N0); fm(0.98, 1.42 - hd, farSide * 0.04, 0.4, 0.22, 1, 0.9, 1, N0); fm(1.22, 1.38 - hd * 1.35, farSide * 0.04, 0.34, 0.2, 1, 0.92, 1, N0); fm(1.42, 1.24 - hd * 1.65, farSide * 0.04, 0.24, 0.14, 1, 0.92, 1, N0);
      for (const [la, ll] of LEGS) fm(la, 0.44, ll * 0.1, 0.74, 0.085, 1, 0.92, 0, B0);                             // four legs, each its own stroke, paper between
      for (const a of [-0.3, 0.2]) fm(a, 0.76, farSide * 0.05, 0.46, 0.42, 1, 0.82, 0, B0);
      if (o.red && o.kind !== 'sheep') for (const sd of [-1, 1]) fm(-0.02, 1.06, sd * 0.36, 0.36 * rl, 0.5, 2, 0.92, 0, B0);
    }
}


export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('unseen-oak'), noise = ctx.noise, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const style = opts.style || makeStyle(ctx, { palette: opts.palette || PALETTE });
  const weather = opts.weather || 'fine', viewer = opts.backdrop ?? !opts.style;      // standing alone (the part viewer): bring our own paper sky and ground
  const root = new THREE.Group(); root.name = 'unseen-oak';
  await ctx.yield();

  // ---------- skeleton (per seed: lean, fork height, how many low boughs and leaders, crown outline) ----------
  const P = { height: 40, crownR: 23, crownY: rng.range(20, 23), lowY: 6, forkY: rng.range(10.5, 13), lean: rng.range(0.01, 0.05), leanAz: rng.range(0, 6.28),
    nLow: rng.int(3, 4), nLead: rng.int(4, 5), k: rng.range(0, 50), rMin: [1, 0.2, 0.07, 0.035, 0.02, 0.014] };
  P.cx = 0; P.cz = 0;
  // the same skeleton grows the brief's other trees: a lone Scots pine (long bare trunk, a high flat crown) or a wind-bent beech
  if (opts.tree === 'pine') Object.assign(P, { crownR: 17, crownY: 28, lowY: 17, forkY: P.forkY + 10, nLow: 2, height: 36.5 });   // (its leaders and their snow overshoot the envelope by 4 m: 36.5 keeps the pine the 40 m the course is flown for)
  if (opts.tree === 'beech') { const la = -1.57 + (P.leanAz - 3.14) * 0.12; Object.assign(P, { crownR: 19, lean: 0.26, leanAz: la, cx: Math.sin(la) * 4.5, cz: Math.cos(la) * 4.5, crownY: P.crownY - 1 }); }
  const branches = await growOak(rng.fork('grow'), noise, P, ctx);
  await ctx.yield();
  // a Scots pine carries its needles in flat separate plates with sky between: the twigs are hatched only inside a few
  // flat-bottomed lenses hung on the boughs (the limbs between them are still drawn, white above, sepia beneath)
  let plates = null;
  if (opts.tree === 'pine') {
    plates = []; const pl = rng.fork('plates'), cands = [];
    for (const b of branches) if (b.depth === 1 || (b.depth === 2 && b.len > 6)) for (const f of [0.5, 0.78, 1]) cands.push(b.pts[Math.min(b.pts.length - 1, Math.round(f * (b.pts.length - 1)))]);
    pl.shuffle(cands);
    for (const q of cands) { if (plates.length >= 15) break; if (q[1] > P.lowY + 1 && plates.every((o) => Math.hypot(o[0] - q[0], (o[1] - q[1]) * 2.4, o[2] - q[2]) > 6.4)) plates.push([q[0], q[1], q[2], pl.range(5, 8), pl.range(1.7, 2.6)]); }
  }
  const inPlate = (x, y, z) => { for (const o of plates) { const dx = x - o[0], dy = y - o[1], dz = z - o[2], hy = dy > 0 ? o[4] : o[4] * 0.45; if ((dx * dx + dz * dz) / (o[3] * o[3]) + (dy * dy) / (hy * hy) < 1) return true; } return false; };

  // ---------- paper: trunk, boughs and branches down to 3.5 cm; twigs are strokes only ----------
  // The wood is shaded (style.paperDark): hatched sepia inside its outline, all but the edge of the trunk turned to the light and the
  // tops of the boughs, where the snow is put. So the tree is a dark thing from the far end of the valley, whatever lies behind it.
  const paper = { pos: [], idx: [], lit: [], piv: [], litFn: null }, SIDES = [12, 7, 5, 3];
  const litTrunk = (rx, ry, rz) => rx * 0.951 - rz * 0.31 - 0.94, litBough = (rx, ry, rz) => ry + (rx * 0.951 - rz * 0.31) * 0.3 - 0.45;
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i]; if (b.depth > 3 || (b.depth === 3 && b.pts[0][3] < 0.05)) continue;
    const ch = b.pts.slice(); const tip = ch[ch.length - 1]; ch[ch.length - 1] = [tip[0], tip[1], tip[2], b.depth === 0 ? tip[3] : tip[3] * 0.4];
    paper.litFn = b.depth === 0 ? litTrunk : litBough; sweepTube(ch, SIDES[b.depth], paper);
    if (i % 80 === 79) await ctx.yield();
  }
  { // root buttresses: five spurs running out from the foot
    const n = 5 + rng.int(0, 2), a0 = rng.range(0, 6.28);
    paper.litFn = litTrunk;
    for (let i = 0; i < n; i++) { const a = a0 + (i / n) * 6.28 + rng.range(-0.3, 0.3), L = rng.range(2.2, 3.6);
      sweepTube([[Math.sin(a) * 0.9, 1.5, Math.cos(a) * 0.9, 0.7], [Math.sin(a) * 1.9, 0.45, Math.cos(a) * 1.9, 0.55], [Math.sin(a) * L, -0.1, Math.cos(a) * L, 0.3], [Math.sin(a) * (L + 1.2), -0.5, Math.cos(a) * (L + 1.2), 0.1]], 6, paper); }
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(paper.pos), 3)); pg.setIndex(paper.idx);
  pg.setAttribute('aLit', new THREE.BufferAttribute(new Float32Array(paper.lit), 1)); pg.setAttribute('aPiv', new THREE.BufferAttribute(new Float32Array(paper.piv), 3));
  pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 34);
  const oakPaper = new THREE.Mesh(pg, style.paperDark); oakPaper.name = 'oak-paper'; root.add(oakPaper);
  await ctx.yield();

  // ---------- strokes on the oak ----------
  const sr = rng.fork('strokes'), plain = new StrokeBuf(), loose = new StrokeBuf('loose');
  const limbN = P.nLow + P.nLead, limbOrder = sr.shuffle(Array.from({ length: limbN + 1 }, (_, i) => i / limbN));
  let shedLimb = opts.shedding ? 1 + sr.int(0, limbN - 1) : -1;
  if (opts.shedding) {                                                // the great bough that reaches toward the climbing turn (+x, a little +z), so the curtain falls in front of the crown
    const sc = new Float64Array(limbN + 2), cn = new Float64Array(limbN + 2);
    for (const b of branches) if (b.depth >= 1 && b.limb >= 1 && b.limb <= limbN) for (const q of b.pts) { sc[b.limb] += (q[0] * 0.9 + q[2] * 0.44) * (q[1] < 26 ? 1 : 0.5); cn[b.limb]++; }
    let best = -1e9; for (let i = 1; i <= limbN; i++) { const v = cn[i] > 20 ? sc[i] / cn[i] + 0.004 * cn[i] : -1e9; if (v > best) { best = v; shedLimb = i; } }
  }
  let slipBranch = -1; { let tries = 0; while (tries++ < 200) { const b = branches[sr.int(1, branches.length - 1)]; if (b.depth === 2 && b.len > 6) { slipBranch = b.order; break; } } }
  const widOf = (r) => clamp(0.022 + 0.03 * r, 0.022, 0.06), lenOf = (r) => clamp(0.36 + 1.5 * r, 0.36, 1.6);
  const perM = (r) => lerp(0.55, 0.3, smoothstep(0.15, 1.0, r)) * (1.5 * r + 0.045) / (lenOf(r) * widOf(r));
  let wTotal = 0; for (const b of branches) { let w = 0; for (let i = 1; i < b.pts.length; i++) w += perM(b.pts[i][3]); b.wPer = w / (b.pts.length - 1); wTotal += b.wPer * b.len; }
  const crownK = plates ? 1 : clamp((P.crownR * P.crownR) / (23 * 23), 0.5, 1);   // the same pencil pressure on a smaller crown, not the same count
  const WHITE_TARGET = Math.min(44000 * crownK, (141000 - paper.idx.length / 3) / 2 - 17000) * (weather === 'thin' ? 1.6 : 1), dens = clamp(WHITE_TARGET / wTotal, 0.6, plates ? 2.4 : 1.5);
  const DEPTH_T = [0, 0.3, 2.2, 4.2, 6.0, 7.2];   // the frame first (trunk, great boughs), then the twigs fill it, bough by bough
  // THE SNOW DRAWS THE TREE WHILE WE COME UP THE VALLEY (round 4). The great boughs are whitened one after another, each from the
  // trunk out to its twigs in about three seconds: the bough that reaches away from the turn lies white before we come, the next is
  // laid at 7 s, half of them by 16 s, and the two that reach toward the climbing turn are laid as we round them (done by 29 s).
  // limbRank[limb] = 0 (first) .. 1 (last); the bare boughs are together on the turn's side, so the difference is a shape.
  const limbRank = new Float32Array(limbN + 2);
  {
    const sx = new Float64Array(limbN + 2), cn = new Float64Array(limbN + 2);
    for (const b of branches) if (b.depth >= 1 && b.limb >= 1 && b.limb <= limbN) for (const q of b.pts) { sx[b.limb] += q[0] * 0.95 + q[2] * 0.3; cn[b.limb]++; }
    const ids = []; for (let i = 1; i <= limbN; i++) ids.push(i);
    ids.sort((a, b) => sx[a] / Math.max(cn[a], 1) - sx[b] / Math.max(cn[b], 1));
    ids.forEach((id, r) => { limbRank[id] = r / Math.max(1, limbN - 1); });
  }
  const startOf = (q) => lerp(4.4, 25.3, q);
  const posQ = (x, z) => clamp(0.5 + ((x - P.cx) * 0.95 + (z - P.cz) * 0.3) / (1.5 * P.crownR), 0, 1);     // the same order for things hung on no one bough (a pine's plates)
  const landT = (x, y, z, b, t) => {
    const radial = clamp(Math.hypot(x - P.cx, z - P.cz) / P.crownR, 0, 1), nz = noise.n3(x * 0.09 + P.k, y * 0.09, z * 0.09);
    if (b.depth === 0) return 1.2 + 2 * t + 0.5 * nz;
    const q = limbRank[b.limb];
    let T = (b.limb === shedLimb ? 17 : q <= 0 ? 1.0 : startOf(q)) + 2.3 * radial + 0.3 * (b.depth - 1) + 0.3 * nz;      // the bough that will shed is finished by 21 s
    if (weather === 'heavy') T = 1.2 + (T - 1.2) * 0.9;
    return clamp(T, 0.6, 29.1);
  };
  const pool = [], looseSites = [];
  const up = [0, 1, 0], Ux = LIGHT.x * 0.5, Uy = 1 + LIGHT.y * 0.5, Uz = LIGHT.z * 0.5;
  // lays `count` strokes along one segment of a branch, on the lit side (pen 0) or the side turned away (pen 1)
  let gLeft = 0, gT = 0, gOrd = 0;
  function laySeg(b, i, count, pen) {
    const a = b.pts[i - 1], c = b.pts[i]; let tx = c[0] - a[0], ty = c[1] - a[1], tz = c[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let ux = Ux, uy = Uy, uz = Uz; let dt = ux * tx + uy * ty + uz * tz; ux -= dt * tx; uy -= dt * ty; uz -= dt * tz;
    if (Math.hypot(ux, uy, uz) < 0.45) { ux = LIGHT.x; uy = LIGHT.y; uz = LIGHT.z; dt = ux * tx + uy * ty + uz * tz; ux -= dt * tx; uy -= dt * ty; uz -= dt * tz; }
    const trunk = b.depth === 0;                               // the trunk is a column of bare paper between a white edge and a sepia edge
    if (trunk) { ux = pen ? -0.95 : 0.95; uy = 0; uz = pen && sr() < 0.4 ? 0.31 : -0.31; dt = ux * tx + uy * ty + uz * tz; ux -= dt * tx; uy -= dt * ty; uz -= dt * tz; }
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul; const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    for (let n = 0; n < count; n++) {
      const f = sr(), x0 = lerp(a[0], c[0], f), y0 = lerp(a[1], c[1], f), z0 = lerp(a[2], c[2], f), r = lerp(a[3], c[3], f);
      const phi = trunk ? clamp(sr.gauss() * 0.3, -0.7, 0.7) : clamp(sr.gauss() * (pen ? 0.5 : 0.6), -1.25, 1.25) + (pen ? Math.PI : 0), cp = Math.cos(phi), sp = Math.sin(phi), off = r + 0.012;
      const x = x0 + (ux * cp + vx * sp) * off, y = y0 + (uy * cp + vy * sp) * off, z = z0 + (uz * cp + vz * sp) * off;
      if (y < 0.15 || (plates && b.depth >= 2 && !inPlate(x0, y0, z0))) continue;
      if (gLeft <= 0) { gLeft = 5 + (sr() < 0.5 ? 1 : 0); gOrd = 0; gT = landT(x, y, z, b, (i - 1 + f) / (b.pts.length - 1)) + (pen ? 0.5 : 0); if (weather === 'thin' && sr() < 0.42) gT = 1e5;
        if (pen) gT = -9; else if (gT < 1e4 && b.limb !== shedLimb && sr() < (b.depth === 0 ? 0.55 : limbRank[b.limb] <= 0 ? 0.8 : 0)) gT = -9; }     // the tree itself (sepia) is drawn before we come, and the first of the snow lies on it already
      gLeft--; const ord = gOrd++;
      if (gT > 1e4) continue;
      const seed = sr(), len = lenOf(r) * sr.range(0.8, 1.25), wid = widOf(r) * sr.range(0.85, 1.2);
      if (pen === 0) {
        const hard = r > 0.09 && sr() < 0.1, press = hard ? 0.95 : clamp(0.36 + 0.3 * sr() + 1.2 * r, 0.3, 0.86);
        if (b.depth >= 2 && b.depth <= 4 && x > 2 && cp > 0.5 && sr() < 0.035) { looseSites.push([x, y, z, len, wid, press, gT, ord, seed]); continue; }
        const flag = b.limb === shedLimb && b.depth >= 1 ? 3 + 0.45 * clamp(1 - Math.hypot(x - P.cx, z - P.cz) / (P.crownR * 0.95), 0, 1) : b.order === slipBranch || b.slip ? 3 + 0.45 * seed : 0;
        plain.add(x, y, z, len, wid, 0, press, gT, ord, seed, flag);
        if ((plain.n & 7) === 0) pool.push(x, y, z);
      } else {
        const cross = r > 0.06 && sr() < 0.42;
        plain.add(x, y, z, len * (cross ? 1.15 : 1), wid, 1, clamp(0.4 + 0.35 * sr() + 0.3 * r, 0.3, 0.8), gT, cross ? Math.max(ord, 1) : ord, seed, cross ? 2 : 0);
      }
    }
  }
  const sepiaK = (r) => (r > 0.05 ? 0.5 : 0.16) * (0.4 + 0.6 * detail);
  const perches = [];
  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi];
    for (let pen = 0; pen < 2; pen++) {
      gLeft = 0; let acc = sr();
      for (let i = 1; i < b.pts.length; i++) {
        const a = b.pts[i - 1], c = b.pts[i], r = (a[3] + c[3]) * 0.5, sl = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        acc += perM(r) * sl * dens * (pen ? sepiaK(r) : 1); const cnt = Math.floor(acc); acc -= cnt;
        if (cnt > 0) laySeg(b, i, cnt, pen);
      }
    }
    if ((b.depth === 2 || b.depth === 3) && b.len > 4.5) { const m = b.pts[Math.floor(b.pts.length * 0.55)]; if (m[1] > 20 && m[1] < 36) perches.push(b); }
    if (bi % 20 === 19) await ctx.yield();
  }
  // ---------- the darks: sepia laid hard, in groups, round the trunk (all of it but the edge turned to the light) and under every
  // bough; there before we come. The tree is a dark thing the snow whitens, bough by bough. ----------
  {
    const dk = rng.fork('darks'), trk = branches.find((b) => b.depth === 0), lz = Math.atan2(0.95, -0.31);
    for (let i = 1; i < trk.pts.length; i++) {
      const a = trk.pts[i - 1], c = trk.pts[i], n = Math.round((c[1] - a[1]) * 15);
      for (let k = 0; k < n; k++) {
        const f = dk(), az = lz + dk.range(0.8, 6.2832 - 0.8), r = lerp(a[3], c[3], f) + 0.03, y = lerp(a[1], c[1], f);
        if (y < 0.4) continue;
        plain.group(lerp(a[0], c[0], f) + Math.sin(az) * r, y, lerp(a[2], c[2], f) + Math.cos(az) * r, dk.range(1.1, 1.8), dk.range(0.5, 0.8), 5, 1, dk.range(0.8, 0.9), -9, 1, dk(), dk() < 0.36 ? 9 : 0);
      }
    }
    for (const b of branches) {
      if (b.order % 50 === 49) await ctx.yield();
      if (b.depth < 1 || b.depth > 2) continue;
      let acc = dk();
      for (let i = 1; i < b.pts.length; i++) {
        const a = b.pts[i - 1], c = b.pts[i], r = (a[3] + c[3]) * 0.5; if (r < 0.085) continue;
        acc += Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]) * (b.depth === 1 ? 2.8 : 1.5) * (0.5 + 0.5 * detail);
        while (acc >= 1) {
          acc -= 1; const f = dk(), L = clamp(0.5 + 1.7 * r, 0.55, 1.6);
          plain.group(lerp(a[0], c[0], f) + dk.range(-0.5, 0.5) * r, lerp(a[1], c[1], f) - r - 0.12 * L, lerp(a[2], c[2], f) + dk.range(-0.5, 0.5) * r, L, clamp(0.24 + 0.9 * r, 0.26, 0.7), r > 0.25 ? 5 : 4, 1, dk.range(0.72, 0.88), -9, 1, dk(), dk() < 0.25 ? 9 : 0);
        }
      }
    }
    await ctx.yield();
    // ... and the tree as it is seen from far down the valley: a few large marks standing for many (flag 8: they give way to the
    // fine ones as we come near). Sepia for trunk and boughs, white for the snow on the crown, which lands on them too.
    for (let y = 0.8; y < P.forkY; y += 1.3) { const f = clamp((y + 0.6) / (P.forkY + 0.6), 0, 1) * 8, i = Math.min(7, Math.floor(f)), q = trk.pts[i].map((v, j) => lerp(v, trk.pts[i + 1][j], f - i)); plain.add(q[0] - 0.25, y, q[2], 3.0, 1.9, 1, 0.92, -9, 1, dk(), 8); }
    for (const b of branches) {
      if (b.order % 40 === 39) await ctx.yield();
      if (b.depth < 1 || b.depth > 3) continue;
      const step = [0, 1.0, 1.5, 3.2][b.depth]; let run = dk() * step;
      for (let i = 1; i < b.pts.length; i++) {
        const a = b.pts[i - 1], c = b.pts[i], sl = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]); run += sl;
        while (run >= step) {
          run -= step; const f = dk(), x = lerp(a[0], c[0], f), y = lerp(a[1], c[1], f), z = lerp(a[2], c[2], f), r = lerp(a[3], c[3], f);
          const inP = !plates || b.depth < 2 || inPlate(x, y, z);
          if (b.depth <= 2 && dk() < (b.depth === 1 ? 1 : 0.6)) plain.add(x, y - r - 0.35, z, b.depth === 1 ? 1.5 : 1.2, b.depth === 1 ? 0.6 + r : 0.5, 1, b.depth === 1 ? 0.92 : 0.8, -9, 1, dk(), 8);
          if (inP && dk() < 0.36 && !(weather === 'thin' && dk() < 0.42)) plain.add(x, y + r + 0.5, z, dk.range(1.1, 1.6), dk.range(0.5, 0.65), 0, 0.86, dk() < 0.15 && b.limb !== shedLimb && limbRank[b.limb] <= 0 ? -9 : landT(x, y, z, b, (i - 1 + f) / (b.pts.length - 1)), 1, dk(), 8);
        }
      }
    }
    // ... and the snow as it is seen from the climbing turn (40 to 80 m off), where a twig's stroke is too fine to draw: along the top
    // of every great bough a line of broad hard-white groups (flag 8.3: they come in beyond 30 m as the twig strokes thin out), each
    // standing on the bough like the snow it is. This is what makes the crown the whitest thing on the sheet.
    for (const b of branches) {
      if (b.order % 40 === 39) await ctx.yield();
      if (b.depth < 1 || b.depth > 3) continue;
      const step = [0, 0.6, 0.78, 1.5][b.depth]; let run = dk() * step;
      for (let i = 1; i < b.pts.length; i++) {
        const a = b.pts[i - 1], c = b.pts[i], sl = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]); run += sl;
        while (run >= step) {
          run -= step; const f = dk(), x = lerp(a[0], c[0], f), y = lerp(a[1], c[1], f), z = lerp(a[2], c[2], f), r = lerp(a[3], c[3], f), g = dk(), L = dk.range(0.75, 1.1) * (b.depth === 1 ? 1.2 : 1), Wd = dk.range(0.9, 1.3), sd = dk(), hardP = dk() < 0.6;
          if ((b.depth === 3 && (r < 0.028 || g < 0.45)) || (plates && b.depth >= 2 && !inPlate(x, y, z)) || (weather === 'thin' && g > 0.6)) continue;
          plain.group(x, y + r + 0.34 * L, z, L, Wd, 5, 0, hardP ? 0.95 : 0.88, g < 0.3 && limbRank[b.limb] <= 0 && b.limb !== shedLimb ? -9 : landT(x, y, z, b, (i - 1 + f) / (b.pts.length - 1)), 1 + (b.order + i) % 4, sd, b.limb === shedLimb ? 8.6 : 8.3);      // (8.6: the same, on the bough that sheds)
        }
      }
    }
    if (plates) for (const o of plates) {                              // a pine's plates: each a pad of snow on a dark belly
      const n = Math.round(o[3] * o[3] * 0.5);
      for (let k = 0; k < n; k++) {
        const a = dk.range(0, 6.2832), d = Math.sqrt(dk()) * 0.92, x = o[0] + Math.cos(a) * d * o[3], z = o[2] + Math.sin(a) * d * o[3], dome = Math.sqrt(1 - d * d), g = dk(), sd = dk();
        if (!(weather === 'thin' && g > 0.6)) plain.group(x, o[1] + o[4] * 0.7 * dome + 0.3, z, dk.range(0.9, 1.3), dk.range(1.1, 1.6), 5, 0, g < 0.55 ? 0.95 : 0.88, posQ(x, z) < 0.22 && g < 0.4 ? -9 : clamp((weather === 'heavy' ? 0.9 : 1) * (startOf(posQ(x, z)) + 1.6 * sd + 1.2 * d), 0.6, 29.1), 1 + k % 4, sd, 8.3);
        if (k % 2 === 0) plain.group(x, o[1] - o[4] * 0.3 * dome - 0.25, z, dk.range(0.9, 1.3), dk.range(1.0, 1.5), 5, 1, dk.range(0.8, 0.9), -9, 1, dk(), dk() < 0.3 ? 9 : 0);
      }
    }
    // the ground under the crown is not nothing: its shadow in thin sepia hatch (seen from the turn), and a drift against the lit side of the foot
    const nS = Math.round(170 * (0.6 + 0.4 * detail));
    for (let i = 0; i < nS; i++) { const a = dk.range(0, 6.2832), rr = Math.sqrt(dk.range(9, 22 * 22)), cross = dk() < 0.3; plain.group(Math.sin(a) * rr, 0.06, Math.cos(a) * rr, dk.range(0.8, 1.3), dk.range(0.6, 1.0), 4, 1, dk.range(0.45, 0.62), -9, 1, dk(), cross ? 9 : 6); }
    for (let i = 0; i < 46; i++) { const a = lz + dk.range(-1.3, 1.3), rr = dk.range(2.0, 6.5); plain.group(Math.sin(a) * rr, 0.07, Math.cos(a) * rr, dk.range(0.7, 1.2), dk.range(0.6, 0.9), 5, 0, dk() < 0.5 ? 0.95 : dk.range(0.7, 0.86), dk() < 0.5 ? -9 : dk.range(1.5, 11), dk.int(0, 3), dk(), 6); }
  }
  await ctx.yield();
  // loose strokes: a gust lifts them off the windward boughs and lays them 6-10 m further on (or on the ground)
  for (let i = 0; i < looseSites.length; i++) {
    const s = looseSites[i]; let tx = s[0] - sr.range(6, 10), ty = 0.06, tz = s[2] + sr.range(-2, 2);
    for (let k = 0; k < 12 && pool.length; k++) { const j = sr.int(0, pool.length / 3 - 1) * 3, dx = pool[j] - s[0], dy = pool[j + 1] - s[1]; if (dx < -5 && dx > -11 && dy < 2 && dy > -7 && Math.abs(pool[j + 2] - s[2]) < 4) { tx = pool[j]; ty = pool[j + 1] + 0.03; tz = pool[j + 2]; break; } }
    loose.add(s[0], s[1], s[2], s[3], s[4], 0, s[5], s[6], s[7], s[8], s[6] < 17.5 ? (sr() < 0.5 ? 0 : 1) : 1); loose.setAlt(tx, ty, tz);
  }
  await ctx.yield();

  // ---------- forty snow buntings: two white strokes each, perched in rows in the undrawn crown ----------
  const birds = new StrokeBuf('bird'), nBirds = opts.buntings ?? 40, br = rng.fork('buntings'), birdAt = [];
  br.shuffle(perches); let placed = 0;
  {                                                                   // rows spread over the whole crown: no two within 7 m of each other until nine boughs carry one
    const mid = (b) => b.pts[Math.floor(b.pts.length * 0.55)], pick = [], rest = [];
    for (const b of perches) { const m = mid(b); if (pick.length < 9 && pick.every((o) => { const q = mid(o); return Math.hypot(q[0] - m[0], (q[1] - m[1]) * 2.5, q[2] - m[2]) > 7; })) pick.push(b); else rest.push(b); }
    perches.length = 0; perches.push(...pick, ...rest);
  }
  const flock = [-br.range(4.5, 6.5), br.range(2.2, 3.4), br.range(2.5, 5) * br.sign()];
  for (let pi = 0; pi < perches.length * 3 && placed < nBirds; pi++) {
    const b = perches[pi % Math.max(1, perches.length)]; if (!b) break;
    const i0 = br.int(1, Math.max(1, Math.floor(b.pts.length * 0.4))), row = Math.max(1, Math.min(nBirds - placed, br.int(3, 7), Math.floor((b.pts.length - 2 - i0) / 1.3) + 1)), ph = br();
    for (let k = 0; k < row; k++) {
      const f = i0 + k * br.range(1.0, 1.5), i = Math.min(b.pts.length - 2, Math.floor(f)), t = clamp(f - i, 0, 1), a = b.pts[i], c = b.pts[i + 1];
      const x = lerp(a[0], c[0], t), y = lerp(a[1], c[1], t) + lerp(a[3], c[3], t) + 0.07, z = lerp(a[2], c[2], t), seed = br(), delay = br.range(0, 0.45) + k * 0.03;
      const v = [br.range(-7, 7), br.range(-2.4, 2.6), br.range(-4.2, 4.2)], L = br.range(0.3, 0.38);        // its place in the flock (along, up, across)
      for (let w = 0; w < 2; w++) { birds.add(x, y, z, L, 0.05, placed % 9 === 4 ? 2 : 0, 0.92, delay, w, seed, ph); birds.setAlt(v[0] * 0.85, v[1] * 1.7 + 0.5, v[2] * 2.1); }
      birdAt.push(new THREE.Vector3(x, y, z)); placed++;
    }
  }
  await ctx.yield();

  // ---------- three ponies on the undrawn ground: paper bodies in rigid parts, strokes riding the same pose ----------
  const ponyPaper = { pos: [], idx: [] }, ponyRig = { piv: [], rig: [] }, pony = new StrokeBuf('rig'), pr = rng.fork('ponies'), ponyAt = [];
  const nPony = opts.ponies ?? 3, shaker = pr.int(0, Math.max(0, nPony - 1));
  for (let pi = 0; pi < nPony; pi++) {
    const az = lerp(0.62, 2.9, (pi + 0.5) / nPony) + 0.3 * (pr.range(0.1, 0.9) - 0.5), rad = lerp(19.5, 22, (pr.range(8.5, 15) - 8.5) / 6.5) + (pi === 1 ? -1.5 : 0),   // out toward the edge of the bare circle on the side the course passes: the first faces the approach, the others the turn
      ox = Math.sin(az) * rad, oz = -Math.cos(az) * rad;
    const yaw = Math.PI / 2 - az + (opts.shedding ? 0.7 : pi === 1 ? -1.9 : 1.45) + 1.1 * pr.range(-0.5, 0.5),   // broadside to the turn that looks down on them (when the bough sheds: facing out, the way they will bolt)
     sc = pr.range(0.93, 1.08) * (opts.ponyScale ?? (opts.ponyRich ? 1.2 : 1)), phase = pr(), shakeT = opts.shedding ? -2 : pi === shaker ? 26.5 : -1, headDrop = [0.72, -0.14, 0.3][pi % 3] + 0 * pr.range(-0.05, 0.3);   // one grazing, one head up
    layAnimal({ paper: ponyPaper, rig: ponyRig, strokes: pony }, pr, { ox, oz, yaw, sc, phase, shakeT, headDrop, T0: 4 + pi * 1.6, kind: opts.cast, bold: opts.ponyBold, rich: opts.ponyRich, far: opts.ponyFar ? 7 : 0, red: opts.ponyRed ? opts.ponyRed[pi % opts.ponyRed.length] : 0 });
    ponyAt.push(new THREE.Vector3(ox, 1.1 * sc, oz));
  }
  await ctx.yield();

  // ---------- the apron: tussocks whiten the moor outside a ragged circle 46 m across; the ground under the oak stays bare ----------
  if (opts.apron ?? true) {
    const ar = rng.fork('apron'), nT = Math.round(900 * detail);
    for (let i = 0; i < nT; i++) {
      const a = ar.range(0, 6.2832), rr = Math.sqrt(ar.range(23 * 23, 47 * 47)), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
      const edge = 23.5 + 2.6 * noise.n2(Math.cos(a) * 1.7 + P.k, Math.sin(a) * 1.7), keep = 1 - smoothstep(34, 47, rr) * 0.85;
      const g = ar(), big = ar.range(0.75, 1.3), T = 4.2 + 4.6 * clamp((z + 47) / 94, 0, 1) + ar.range(0, 0.9);
      if (rr < edge || g > keep) continue;
      plain.group(x, 0.06, z, ar.range(0.42, 0.56) * big, 0.5 * big, 5, 0, ar.range(0.55, 0.85), ar() < 0.35 ? -9 : T, 0, ar(), 5);
      plain.group(x - 0.14, 0.07, z + 0.05, ar.range(0.26, 0.36) * big, 0.36 * big, 3, 1, ar.range(0.6, 0.8), -9, 1, ar(), 0);
      if (i % 400 === 399) await ctx.yield();
    }
  }
  await ctx.yield();

  // ---------- meshes (everything exists from the start; uniforms reveal it) ----------
  const C = new THREE.Vector3(0, 20, 0);
  const add = (buf, mat, name, radius) => { const m = new THREE.Mesh(strokeGeometry(buf, C, radius), mat); m.name = name; m.frustumCulled = radius < 1e3; root.add(m); return m; };
  add(plain, style.stroke, 'oak-strokes', 70); await ctx.yield();
  add(loose, style.strokeLoose, 'oak-loose', 80);
  add(birds, style.strokeBird, 'buntings', 1e4);
  add(pony, style.strokeRig, 'pony-strokes', 60);
  const ppg = new THREE.BufferGeometry();
  ppg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ponyPaper.pos), 3)); ppg.setIndex(ponyPaper.idx);
  ppg.setAttribute('aPiv', new THREE.BufferAttribute(new Float32Array(ponyRig.piv), 3)); ppg.setAttribute('aRig', new THREE.BufferAttribute(new Float32Array(ponyRig.rig), 4));
  ppg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 30);
  const ponyMesh = new THREE.Mesh(ppg, style.paperRigDark); ponyMesh.name = 'pony-paper'; root.add(ponyMesh);
  let sky = null;
  if (viewer) {                                                       // the part viewer has no paper world round it: bring our own
    sky = style.sky(2600); root.add(sky);
    const gd = new THREE.Mesh(new THREE.CircleGeometry(900, 48), style.paper); gd.rotation.x = -Math.PI / 2; gd.position.y = -0.02; gd.name = 'viewer-ground'; root.add(gd);
  }
  await ctx.yield();

  // ---------- progress ----------
  let manual = !!opts.style, shedT = opts.shedding ? 27.2 : 34.5;
  style.uniforms.uShedT.value = shedT; if (opts.shedding) style.uniforms.uBolt.value = shedT + 0.4; style.uniforms.uBirdT.value = 30;
  const SU = [[0, 0], [0.346, 9], [0.48, 14], [0.637, 23], [0.823, 32.5], [1, 40]];   // the brief's pace along its 520 m line
  const secondsOfU = opts.secondsOfU || ((u) => { for (let i = 1; i < SU.length; i++) if (u <= SU[i][0]) return lerp(SU[i - 1][1], SU[i][1], (u - SU[i - 1][0]) / (SU[i][0] - SU[i - 1][0])); return 40; });
  const _cp = new THREE.Vector3();
  const hero = {
    object: root, radius: 26, height: 40, center: new THREE.Vector3(0, 21, 0), ground: false, groundY: 0, style,
    setSeconds(s) { manual = true; style.setSeconds(s); },
    setProgress(u) { hero.setSeconds(secondsOfU(clamp(u, 0, 1))); },
    update(dt, time, camera) {
      style.update(time, camera);
      if (!manual) style.setSeconds((time + 22) % 46);               // nobody is driving: play the drawing on a loop
      if (sky && camera) { camera.getWorldPosition(_cp); root.worldToLocal(_cp); sky.position.copy(_cp); }
    },
    dispose() { if (!opts.style) style.uniforms.uAtlas.value.dispose(); },
    stats: { strokes: plain.n + loose.n + birds.n + pony.n, white: plain.n, loose: loose.n, branches: branches.length, paperTris: (paper.idx.length + ponyPaper.idx.length) / 3 },
    // Anchors, local = offsets from the trunk foot in world axes (the oak stands at world x 0, z 372 in the brief).
    anchors: {
      bareCircle: { center: new THREE.Vector3(0, 0, 0), radius: 23 },      // keep ground strokes out of this (the apron draws r 23-47 if enabled)
      lightDir: LIGHT.clone(),                                              // toward the understood light
      approach: { position: new THREE.Vector3(0, 2.3, -110), lookAt: new THREE.Vector3(0, 19, 0) },   // the 18 s frame: oak a third drawn, dead ahead
      // the brief's line: swing to starboard, abeam of the trunk at x +31, quarter-circle of 31 m round the back climbing to
      // y 24, then straight to port rising 10 degrees. 8 m clear of the crown everywhere.
      flyThrough: [[14, 2.4, -78], [24, 3.6, -40], [31, 7, 0], [28.6, 11.2, 11.9], [21.9, 15.5, 21.9], [11.9, 19.8, 28.6], [0, 24, 31], [-46, 32.1, 31], [-92, 40.2, 31]].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      portalSeat: { position: new THREE.Vector3(-92, 40.2, 31), facing: new THREE.Vector3(0.985, -0.174, 0), radius: 7 },   // in the scarp; tilt: true
      crownView: { position: new THREE.Vector3(26, 13, 17), lookAt: new THREE.Vector3(0, 22, 0) },      // 31 s: the whole crown from the climbing turn
      buntings: birdAt, ponies: ponyAt, trunkTop: new THREE.Vector3(0, P.forkY, 0),
      crown: { center: new THREE.Vector3(P.cx, P.crownY, P.cz), radius: P.crownR, lowY: P.lowY, top: P.height },   // aim the gaze with these, whatever the tree
      times: { firstStroke: 9.2, crownDone: 31, buntingsLift: style.uniforms.uBirdT.value, ponyShake: 26.5, shed: shedT, gusts: [19, 30] },
    },
  };
  return hero;
}
