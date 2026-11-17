// THE CHART-MAKER'S SERPENT: hero set piece for the world "engraved-sea-chart" (hand-coloured copperplate).
//
// What it is
//   A sea serpent drawn as a living engraving: ~600 m of spine, 9 m thick, standing out of the sea in
//   three arches (crowns 45 m, feet 44 m apart, a clear opening 35 m wide and 36 m high under each), a
//   low tail hump and a 12 m tail fin to port, and to starboard a reared neck carrying a 14 m head
//   (tusks or ram horns or a mane by seed, barbels, crest, frills, 1.2 m gold-leaf eyes that track the
//   camera, twin blowholes with 50 m ruled spouts). Scales (shader lattice + ~3,700 raised scutes),
//   belly plates, a spined dorsal fin with rose membrane, 12 m pectoral fins, barnacle rings, hanging
//   wrack, line-rain sheeting off every coil, eight spreading waterlines and a collar of curl ticks
//   round every leg, and the bulge of sea it tears out of.
//   EVERYTHING is skinned in the vertex shader to one spine (a 256 x 4 half-float texture rewritten on
//   the CPU each frame), so the whole animal can be re-posed: the rise, breathing, the girth wave, the
//   head turning to watch, and a second pose (rolling "pacing" coils that can sound) for 28-37 s.
//
// Local space
//   Origin = still sea level under the crown of the MIDDLE arch. +Y up. Front = +Z: the ship comes down
//   +Z sailing toward -Z, so starboard is +X and port is -X. The spine crosses the course at 60 degrees:
//   crowns at (-55, 45, 32) port, (0, 45, 0) middle, (55, 45, -32) starboard. The head hangs near
//   (28, 18 -> 11, -72), inside the starboard turn, facing back up the course so the ship sees it three-
//   quarter face, then in profile 20-25 m off. Brief distance d metres along the path == z = 252 - d on
//   the first straight (the entry is at z = +252). The tail fin stands near (-135, 8, 100).
//   Keep the object upright (rotate about Y only): wrack and rain hang along local -Y.
//
// opts
//   palette   seven hex strings [vellum, aged vellum, far ink, sepia ink, verdigris, rose madder, gold]
//             (pass another plate's palette for first proof / sanguine / night: it is only paper+ink+2 washes+gold)
//   keyDir    [x,y,z] direction TO the key light, WORLD space. Default port, 30 degrees up: [-0.82, 0.5, 0.28]
//   head      'tusked' | 'ram' | 'maned'    (default by seed)      spouts  1 | 2 (default by seed)
//   finWash   'rose' | 'verdigris'          (default by seed)
//   stage     true draws a plain vellum dome and a flat engraved sea so the piece can be judged alone.
//             DEFAULT: true only when opts is empty (the part viewer). A world must not use it.
//   bulge     true (default) the hero draws its own 60 m dome of contour lines during the rise
//   waterlines true (default) the hero draws its own waterline/curl-tick discs round each leg
//   seaGLSL   optional GLSL source defining   float heroSea(vec2 worldXZ)   (plus any uniforms it needs,
//             given in opts.seaUniforms); waterline discs and the bulge then ride the world's swell.
//
// Progress hooks (never wall-clock)
//   hero.setProgress(p)   THE RISE, p 0..1 == journey 7 s .. 13 s (p = hero.progressFromU(u)).
//                         0.00-0.25 the sea bulges   0.17-0.67 middle arch tears out and stands (8-11 s)
//                         0.42 port arch   0.58 starboard arch   0.6 tail   0.75-1 the head rears (11.5-13 s)
//                         Never called -> fully risen (the viewer). p = 0 -> nothing above water.
//   hero.setHead(k|null)  0 = head held at 18 m, 1 = lowered to eye height (about 11 m). null (default) = it
//                         lowers by itself as the camera comes within 120 -> 35 m. The head also turns up
//                         to 18 degrees toward the camera, the irises track it and the jaw gapes as it nears
//                         (all from the camera passed to update(), so they follow the flight, not the clock).
//   hero.setPacing(k, travel, sound, origin, dir)   k 0..1 blends the standing arches into the pacing
//                         pose: rolling coils 22 m high along the line origin + dir * travel (local space,
//                         head leading at `travel` metres). sound 0..1 takes it under, head first, ending
//                         in a tail-fin flick. Switch k while the serpent is out of frame (25-28 s).
//   hero.setSurge(shift, lean)   the MIDDLE arch travels with the ship: its feet slide `shift` metres along
//                         -Z (the course) and its crown leans a further `lean` metres ahead of them. The whole
//                         arch (skin, scales, wrack, rain, waterlines, capsules) follows. The world uses it at
//                         15-20 s so the ship sails under a living, leaning coil for three seconds, not one.
//   hero.spout            0..1 spout strength (default follows the head's rise).   hero.rain  0..1.
//
// For the world's sea shader
//   hero.capsules         Float32Array(16*4): x,y,z,radius of 16 spine capsules (local space), refreshed in
//                         update(): shadow, waterlining and bulge can be driven from it.
//   hero.legs             [{x,z,r}] where the body currently pierces the still sea (local), refreshed too
//                         (the objects are pooled and reused every frame: copy what you keep).
//   hero.heightOfBulge(x,z)  JS height of the hero's own bulge dome at local x,z for the current progress.
//
// The style (shared with the rest of the world)
//   export ENGRAVE_GLSL            fragment chunk: eInk(tone, hatchUV, w) -> ink coverage, eCompose(...)
//   export engraveUniforms(pal,key) the shared uniform objects (palette, key, time)
//   export styleMaterial(opts)      a ready ShaderMaterial for ordinary world-space meshes
//   export styleOutline(opts)       the matching inverted-hull outline material
//   hero.style = { uniforms, pal, material: styleMaterial, outline: styleOutline }  (same uniform objects)
//
// anchors (local space)
//   crowns        [port, middle, starboard] crown points (top of the body)
//   underCrown    (0, 9.5, 0) the eye's position under the middle arch (26 m of air above, a leg 14 m either side)
//   flyThrough    the brief's course as ordered points: 14 m/s eye line, >= 13 m clear of every solid
//   portalSeat    { position, normal, radius 7 } the exit ring 588 m along the course, facing back up it
//   head          rest position of the head's centre;  headPass: where the eye passes it (20 m off)
//   bulge         centre of the rise dome (0,0,0);  rainFoot: where the cloud's rain curtain should stand
//   pacingOrigin, pacingDir   default line for setPacing (55 m to starboard of the last straight)
//   viewpoints    { entry, rise, underArch, headPass, exitLook } camera positions with composed views
//
// Size and cost
//   radius 120 frames the arches and head (hero.extent = 175 reaches the tail fin), height 68 (spouts;
//   body 45). 139-146k triangles by seed (maned is the heaviest), 8 draw calls (10 with the viewer
//   stage), one 256x4 half-float texture rewritten each frame (256 samples, trivial), no lights.
//   Build 100-200 ms of JS on a laptop.
// Lighting it expects
//   None: it is self-shaded line. Tone is N.L from keyDir plus analytic shadow; scene fog is honoured
//   (ink thins to far ink, then to fogColor, which the world should set to its vellum). Only the gold
//   irises are emissive (2.5). Use bloom threshold >= 1.1 and style 'none'. Paper is written at 0.9 x
//   palette[0] (max channel ~0.77). Washes multiply the paper, so for the night plate pass paler washes.
//   Render order: opaque body 0, bulge 1, waterlines and wash hull 2, rain and spouts 3 (all transparent
//   ones have depthWrite off): draw the world's sea before them (it is opaque, so it will be).
import * as THREE from 'three';

export const PALETTE = ['#EBDCB6', '#CDB88A', '#8A6A45', '#3B2616', '#7FAE9C', '#C8687A', '#E2A93A'];

// ---------------------------------------------------------------------------------------------
// The style. One fragment chunk: tone (0 bare paper .. 1 deepest shadow) becomes engraved line.
// ---------------------------------------------------------------------------------------------
export const ENGRAVE_GLSL = /* glsl */`
uniform vec3 uPaper, uAged, uInkFar, uInk, uWashA, uWashB, uGold;
uniform vec3 uKey;
uniform float uTime;
float eHash(float n){ return fract(sin(n*127.1+1.7)*43758.5453); }
float eHash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float eN1(float x){ float i=floor(x), f=x-i; f=f*f*(3.-2.*f); return mix(eHash(i), eHash(i+1.), f); }
float eN2(vec2 p){ vec2 i=floor(p), f=p-i; f=f*f*(3.-2.*f);
  return mix(mix(eHash2(i), eHash2(i+vec2(1.,0.)), f.x), mix(eHash2(i+vec2(0.,1.)), eHash2(i+vec2(1.,1.)), f.x), f.y); }
float eN3(vec3 p){ float z=floor(p.z), f=p.z-z; f=f*f*(3.-2.*f);
  return mix(eN2(p.xy+z*vec2(37.,17.)), eN2(p.xy+(z+1.)*vec2(37.,17.)), f); }
// One family of lines along constant v. u runs along the line, w = fwidth(v) (take it BEFORE any loop).
// The pitch snaps to the power of two that puts lines 7-14 px apart and cross-fades between octaves:
// new lines grow between the old ones while the old ones thin, so the mean tint never jumps.
float eLines(float v, float u, float w, float tone){
  w = clamp(w, 1e-5, 64.);
  float lfr = -log2(w*7.);
  float lf = clamp(lfr, -5., 7.);
  float k = floor(lf), b = lf-k;
  float F = exp2(k+1.);
  float x = v*F, px = w*F;
  float hw = mix(.05, .3, tone)*smoothstep(.015, .09, tone);
  float ne = 2.*floor(x*.5+.5), no = 2.*floor(x*.5)+1.;
  float th = mix(.66, -.5, smoothstep(.03, .36, tone));
  float ue = u*F*.021;
  float me = mix(eN1(ue+eHash(ne/F)*91.), eN1(ue*2.+eHash(ne/F)*91.), b);
  float mo = mix(eN1(ue+eHash(no/F)*91.), eN1(ue*2.+eHash(no/F)*91.), b);
  float we = hw*(2.-b)*smoothstep(th, th+.42, me);
  float wo = hw*b*smoothstep(th, th+.42, mo);
  float aa = .62*px;
  float ce = 1.-smoothstep(we-aa, we+aa, abs(x-ne));
  float co = 1.-smoothstep(wo-aa, wo+aa, abs(x-no));
  float c = max(ce*step(1e-4, we), co*step(1e-4, wo));
  float mean = clamp(hw*2.*smoothstep(th-.2, th+.6, .5), 0., 1.);
  return mix(c, mean, smoothstep(0., 1.2, lf-lfr));       // coarsest octave too fine: dissolve to tint
}
// Full engraving: first family, the 35 degree cross above tone .5, a dot in each lozenge above .8.
float eInk(float tone, vec2 h, float w){
  tone = clamp(tone, 0., 1.);
  float c = eLines(h.x, h.y, w, tone);
  float t2 = smoothstep(.48, .74, tone);
  vec2 r = vec2(.8192*h.x+.5736*h.y, -.5736*h.x+.8192*h.y);
  float c2 = eLines(r.x, r.y, w, tone*t2*.82);
  c = max(c, c2*step(.001, t2));
  float td = smoothstep(.78, .98, tone);
  float wc = clamp(w, 1e-5, 64.);
  float lf = clamp(-log2(wc*7.), -5., 7.);
  float k = floor(lf), b = lf-k, F = exp2(k+1.);
  vec2 q = vec2(h.x, r.x)*F; float aa = .7*wc*F;
  vec2 qa = q-(2.*floor(q*.5)+1.);
  vec2 qb = fract(q)-.5;
  float da = 1.-smoothstep(.3*(1.-b)-aa, .3*(1.-b)+aa, length(qa));
  float db = 1.-smoothstep(.15*b-aa, .15*b+aa, length(qb));
  c = max(c, max(da*(1.-b), db*b)*td*step(lf+.001, 7.));
  return clamp(c, 0., 1.);
}
// Antialiased ink line where d (in the units of wd = fwidth(d)) is within px pixels of zero.
float eEdge(float d, float wd, float px){ wd = max(wd, 1e-6); return 1.-smoothstep(px-.7, px+.7, abs(d)/wd); }
// Laid paper grain, anchored to the dome: pass the view direction (world).
float eGrain(vec3 dir){
  vec3 d = normalize(dir+vec3(1e-5));
  float laid = .5+.5*sin(d.y*900.+eN2(d.xz*9.)*3.);
  return .55*eN3(d*210.)+.3*eN3(d*37.)+.15*laid;
}
// Paper + wash + ink + distance. fog 0..1; fogCol is the world's vellum.
vec3 eCompose(float cov, vec3 wash, float washAmt, float fog, vec3 fogCol, float grain){
  vec3 paper = uPaper*(.9+.08*grain);
  vec3 fill = mix(paper, paper*wash*1.25+wash*.12, clamp(washAmt, 0., 1.));
  vec3 ink = mix(uInk*1.5, uInkFar, smoothstep(0., .5, fog));
  vec3 col = mix(fill, ink, cov*(1.-.85*smoothstep(.45, 1., fog)));
  return mix(col, fogCol, smoothstep(.3, 1., fog));
}
`;

export const FOG_FRAG = /* glsl */`
#include <fog_pars_fragment>
float eFog(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return clamp(1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth), 0., 1.);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}
vec3 eFogCol(){
  #ifdef USE_FOG
    return fogColor;
  #else
    return uPaper*.94;
  #endif
}
`;

export function engraveUniforms(pal = PALETTE, key = [-0.82, 0.5, 0.28]) {
  const c = pal.map((h) => new THREE.Color(h));
  return {
    uPaper: { value: c[0] }, uAged: { value: c[1] }, uInkFar: { value: c[2] }, uInk: { value: c[3] },
    uWashA: { value: c[4] }, uWashB: { value: c[5] }, uGold: { value: c[6] },
    uKey: { value: new THREE.Vector3(key[0], key[1], key[2]).normalize() }, uTime: { value: 0 },
  };
}

// ---------------------------------------------------------------------------------------------
// Ready-made materials for the rest of the world (ordinary meshes in world space).
//   styleMaterial({ uniforms, wash: 'A'|'B'|'gold'|'none'|hex, washAmt, tone, hatch: 'attr'|'world'|'uv',
//                   hatchScale, side })   attribute aHatch (vec2, metres) when hatch === 'attr'.
// ---------------------------------------------------------------------------------------------
function washUniform(u, wash) {
  if (wash === 'A' || wash === undefined) return u.uWashA;
  if (wash === 'B') return u.uWashB;
  if (wash === 'gold') return u.uGold;
  if (wash === 'none') return u.uPaper;
  return { value: new THREE.Color(wash) };
}
export function styleMaterial(o = {}) {
  const u = o.uniforms || engraveUniforms(o.palette, o.keyDir);
  const hatch = o.hatch || 'world';
  return new THREE.ShaderMaterial({
    fog: true, side: o.side ?? THREE.FrontSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...u,
      uWash: washUniform(u, o.wash), uWashAmt: { value: o.wash === 'none' ? 0 : (o.washAmt ?? 0.3) },
      uToneBias: { value: o.tone ?? 0 }, uHScale: { value: o.hatchScale ?? 1 } },
    vertexShader: /* glsl */`
      ${hatch === 'attr' ? 'attribute vec2 aHatch;' : ''}
      varying vec3 vWP, vWN; varying vec2 vH;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix*vec4(position, 1.);
        vWP = wp.xyz; vWN = normalize(mat3(modelMatrix)*normal);
        ${hatch === 'attr' ? 'vH = aHatch;' : hatch === 'uv' ? 'vH = uv;' : 'vH = vec2(wp.y*1.3+dot(wp.xz, vec2(.31,.17)), dot(wp.xz, vec2(.8,-.6)));'}
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      uniform vec3 uWash; uniform float uWashAmt, uToneBias, uHScale;
      varying vec3 vWP, vWN; varying vec2 vH;
      void main(){
        vec2 h = vH*uHScale; float w = fwidth(h.x);
        vec3 N = normalize(vWN); if(!gl_FrontFacing) N = -N;
        float tone = clamp(.86*smoothstep(.7, -.9, dot(N, uKey))+.12*smoothstep(.1, -.9, N.y)+uToneBias, 0., 1.);
        float cov = eInk(tone, h, w);
        vec3 col = eCompose(cov, uWash, uWashAmt*(.8+.5*tone), eFog(), eFogCol(), eGrain(vWP-cameraPosition));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}
// Inverted hull: draw the same geometry again with this, 2-3 px wide, heavier on the shadow side.
export function styleOutline(o = {}) {
  const u = o.uniforms || engraveUniforms(o.palette, o.keyDir);
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.BackSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...u, uResY: o.resY || { value: 900 }, uPxW: { value: o.px ?? 2.4 } },
    vertexShader: /* glsl */`
      uniform vec3 uKey; uniform float uResY, uPxW;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix*vec4(position, 1.);
        vec3 wn = normalize(mat3(modelMatrix)*normal);
        float depth = max(-(viewMatrix*wp).z, .1);
        float k = 2./(projectionMatrix[1][1]*uResY);
        wp.xyz += wn*depth*k*uPxW*(1.+.7*clamp(-dot(wn, uKey), 0., 1.));
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPaper, uInk, uInkFar;
      ${FOG_FRAG}
      void main(){
        float f = eFog();
        vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, f));
        gl_FragColor = vec4(mix(ink, eFogCol(), smoothstep(.3, 1., f)), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// The serpent's own shaders: everything is skinned to the spine texture.
//   position = (b, n, t): metres along the frame's binormal (to the animal's left... its side), normal
//   (dorsal) and tangent (toward the head) at spine distance aS.   aP = (material, A, B, motion kind).
//   aSkin < 0: (b,n) swell with the girth wave.   aSkin >= 0: rides the skin at that radius.
// ---------------------------------------------------------------------------------------------
const SPINE_VERT = /* glsl */`
uniform sampler2D uSpine; uniform float uSpN, uSpLen, uTime, uJaw, uLift;
attribute float aS; attribute vec4 aP; attribute vec2 aH; attribute float aSkin;
void spineFrame(float s, out vec3 P, out vec3 T, out vec3 N, out float g){
  float x = clamp(s/uSpLen, 0., 1.)*(uSpN-1.);
  float i = min(floor(x), uSpN-2.); float f = x-i;
  ivec2 a = ivec2(int(i), 0), b = ivec2(int(i)+1, 0);
  vec4 h0 = texelFetch(uSpine, a, 0), h1 = texelFetch(uSpine, b, 0);
  vec4 l0 = texelFetch(uSpine, a+ivec2(0,1), 0), l1 = texelFetch(uSpine, b+ivec2(0,1), 0);
  vec4 n0 = texelFetch(uSpine, a+ivec2(0,2), 0), n1 = texelFetch(uSpine, b+ivec2(0,2), 0);
  vec4 t0 = texelFetch(uSpine, a+ivec2(0,3), 0), t1 = texelFetch(uSpine, b+ivec2(0,3), 0);
  P = mix(h0.xyz+l0.xyz, h1.xyz+l1.xyz, f); g = mix(h0.w, h1.w, f);
  N = normalize(mix(n0.xyz, n1.xyz, f)+vec3(0., 1e-5, 0.));
  T = normalize(mix(t0.xyz, t1.xyz, f)+vec3(0., 0., 1e-5));
}
// local-space position and normal of this vertex on the posed, animated animal
void serpentVertex(out vec3 wp, out vec3 wn){
  vec3 P, T, N; float g; spineFrame(aS, P, T, N, g);
  vec3 B = normalize(cross(N, T)+vec3(1e-5, 0., 0.));
  vec3 lp = position, ln = normal;
  float kind = aP.w;
  if((kind > 3.5 && kind < 4.5) || aSkin > 50.){      // lower jaw (and what grows on it): hinge about the b axis
    float a = uJaw, c = cos(a), sn = sin(a);
    vec2 q = lp.yz-vec2(-.5, 2.6);
    lp.yz = vec2(-.5, 2.6)+vec2(q.x*c-q.y*sn, q.x*sn+q.y*c);
    ln.yz = vec2(ln.y*c-ln.z*sn, ln.y*sn+ln.z*c);
  }
  float gs = aSkin < -.5 ? g : 1.;
  wp = P+B*(lp.x*gs)+N*(lp.y*gs+(aSkin > 50. ? 0. : max(aSkin, 0.))*(g-1.))+T*lp.z;
  wn = normalize(B*ln.x+N*ln.y+T*ln.z+vec3(0., 1e-5, 0.));
  if(kind > .5 && kind < 1.5){                        // scute: the free edge lifts in travelling ripples
    float rip = max(0., sin(aS*.085-uTime*1.25+aH.y*.35));
    wp += wn*aP.z*uLift*(.18+.82*rip*rip);
  } else if(kind > 1.5 && kind < 2.5){                // fin: fans and ripples (A across, B out along the rays)
    float ph = uTime*1.15+aP.y*.55-aP.z*2.7+aS*.05;
    wp += wn*sin(ph)*aP.z*aP.z*1.5+T*(aP.y-4.)*aP.z*sin(uTime*.55+aS*.02)*.28;
  } else if(kind > 2.5 && kind < 3.5){                // wrack: hangs under gravity from its anchor, streaming
    float d = aP.y;
    wp.y -= d;
    wp += T*ln.x+(T*sin(uTime*1.3+aP.z+d*.55)+B*cos(uTime*.9+aP.z*1.7+d*.4))*d*.075;
    wn = normalize(B*sign(lp.x+1e-4)+T*.3*sin(d*1.7+aP.z));
  } else if(kind > 4.5 && kind < 5.5){                // barbel / tongue / mane: sways from the root
    float a2 = aP.y*aP.y;
    wp += (B*sin(uTime*1.2+aP.z+aP.y*3.)+T*cos(uTime*.8+aP.z*2.+aP.y*2.5)*.6)*a2*1.1;
    wp.y -= a2*.6*(1.+sin(uTime*.7+aP.z));
  } else if(kind > 5.5 && kind < 6.5){                // dorsal fin: a wave runs down the membrane
    float a2 = aP.z*aP.z;
    wp += B*sin(uTime*1.4-aS*.21)*a2*.55-T*a2*(.5+.5*sin(uTime*.5-aS*.03))*.9;
  }
}
`;

const SERPENT_FRAG = /* glsl */`
${ENGRAVE_GLSL}
${FOG_FRAG}
uniform vec3 uLook; uniform float uFinSel, uWet;
varying vec3 vWP, vWN; varying vec2 vH; varying vec4 vP; varying float vLY;
// fish-scale lattice: p.x columns, p.y rows toward the head. returns (inset from the free edge,
// distance outside the scales lying on top, id hash)
vec3 eScales(vec2 p){
  float j = floor(p.y), R = .78;
  float o1 = .5*mod(j+1., 2.), o0 = .5*mod(j, 2.);
  vec2 c2 = vec2(floor(p.x-o0+.5)+o0, j+2.);
  vec2 c1 = vec2(floor(p.x-o1+.5)+o1, j+1.);
  vec2 c0 = vec2(floor(p.x-o0+.5)+o0, j);
  vec2 cm = vec2(floor(p.x-o1+.5)+o1, j-1.);
  float d2 = length(p-c2), d1 = length(p-c1), d0 = length(p-c0), dm = length(p-cm);
  float e, sh; vec2 id;
  if(d1 < R){ e = R-d1; sh = d2-R; id = c1; }
  else if(d0 < R){ e = R-d0; sh = d1-R; id = c0; }
  else { e = R-dm; sh = min(d1, d0)-R; id = cm; }
  return vec3(e, sh, eHash2(id));
}
void main(){
  vec3 N = normalize(vWN); if(!gl_FrontFacing) N = -N;
  float mat = floor(vP.x+.5);
  float w = fwidth(vH.x);
  vec2 sp = vec2(vH.y/.9425, vH.x/.9);
  if(mat > 4.5 && mat < 5.5) sp *= 2.;
  vec2 fs2 = fwidth(sp); float fp = max(fs2.x, fs2.y);
  float fA = fwidth(vP.y), fB = fwidth(vP.z);
  vec3 V = normalize(cameraPosition-vWP);
  float ndl = dot(N, uKey);
  float tone = .86*smoothstep(.7, -.9, ndl);
  tone += .12*smoothstep(.1, -.9, N.y);
  float wetBand = smoothstep(9., 0., vLY);              // darker, wetter toward the waterline
  vec3 wash = uWashA; float washAmt = .3; float edge = 0.; vec3 emis = vec3(0.); float gold = 0.;
  vec2 h = vH;
  if(mat < .5 || (mat > 4.5 && mat < 5.5)){             // skin: scale lattice
    vec3 sc = eScales(sp);
    float far = 1.-smoothstep(.14, .36, fp);
    tone = max(tone, .11);
    edge = (1.-smoothstep(.5*fp, 1.6*fp, sc.x))*far*(.45+.5*tone);
    tone += ((1.-smoothstep(0., .34, sc.y))*.3+(sc.z-.5)*.1)*far+.07*(1.-far);
    tone += .1*wetBand;
    washAmt = .34+.3*tone+.12*sc.z;
  } else if(mat < 1.5){                                 // belly plate: A = 0 leading edge .. 1 free edge
    tone = max(tone*.6, .13)+.55*smoothstep(.62, 0., vP.y);
    edge = max(eEdge(1.-vP.y, fA, 1.3), eEdge(abs(vP.z-.5)-.167, fB, .9)*.55);
    wash = uAged; washAmt = .55;
    h = vec2(vH.y*.6, vH.x);                            // hatch runs along the plates, across the belly
    w = fwidth(h.x);
  } else if(mat < 2.5){                                 // raised scute: A = rim .. centre, B = base .. tip
    tone = tone*.85+.3*(1.-vP.z);
    edge = eEdge(vP.y, fA, 1.2);
    washAmt = .34+.3*tone;
  } else if(mat < 3.5 || mat > 9.5){                    // membrane: A across the rays, B base .. edge (10 = always rose)
    wash = mat > 9.5 ? uWashB : mix(uWashB, uWashA, uFinSel); washAmt = .66+.2*tone;
    tone = .07+.34*tone+.16*smoothstep(.8, 1., vP.z);
    edge = max(eEdge(1.-vP.z, fB, 1.4), eEdge(vP.z, fB, 1.));
    edge = max(edge, eEdge(fract(vP.y+.5)-.5, fA, 1.15)*(.35+.65*(1.-vP.z)));   // the rays
  } else if(mat < 4.5){                                 // bone: spines, tusks, teeth, horns
    tone *= .7; wash = uAged; washAmt = .35;
  } else if(mat < 6.5){                                 // eye: gold-leaf iris, slit pupil tracking the camera
    vec2 e2 = vH; float sgn = vP.y;
    float fac = max(uLook.x*sgn, .3);
    vec2 c = clamp(vec2(uLook.z, uLook.y)/fac*.34, -.42, .42)*step(0., uLook.x*sgn);
    vec2 q = e2-c; float r = length(q);
    float fr = fwidth(r)+1e-4;
    float iris = 1.-smoothstep(.56-fr, .56+fr, r);
    float pup = 1.-smoothstep(1.-fr*2., 1.+fr*2., length(q/vec2(.11, .47)));
    float ring = eEdge(r-.56, fr, 1.5);
    float spark = .75+.5*eN2(q*9.+uTime*.6)+.25*sin(atan(q.y, q.x+1e-5)*24.);
    gold = iris*(1.-pup);
    emis = uGold*2.5*spark*gold;
    edge = max(max(pup, ring), smoothstep(.86, 1., length(e2)));
    tone = .1+.5*smoothstep(.5, 1., length(e2)); wash = uPaper; washAmt = 0.;
    h = vec2(r*3., atan(q.y, q.x+1e-5)); w = fr*3.;
  } else if(mat < 7.5){                                 // wrack and barbels
    tone = .2+.35*tone; washAmt = .75;
    edge = eEdge(abs(vP.y-floor(vP.y+.5))-.5, fA, .0)*0.;
  } else if(mat < 8.5){                                 // barnacle: A = 0 foot .. 1 crater
    tone = tone*.7+.6*smoothstep(.72, .95, vP.y);
    edge = eEdge(vP.y-.74, fA, 1.1);
    wash = uPaper; washAmt = 0.;
  } else {                                              // mouth, tongue
    wash = uWashB; washAmt = .85; tone = .58+.4*tone;
  }
  float cov = max(eInk(tone, h, w), edge);
  float fog = eFog();
  vec3 col = eCompose(cov*(1.-gold), wash, washAmt, fog, eFogCol(), eGrain(-V));
  gl_FragColor = vec4(mix(col, emis, gold*(1.-fog)), 1.);
}
`;

function serpentMaterials(U, extra) {
  const base = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra };
  const main = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: base,
    vertexShader: /* glsl */`
      ${SPINE_VERT}
      varying vec3 vWP, vWN; varying vec2 vH; varying vec4 vP; varying float vLY;
      #include <fog_pars_vertex>
      void main(){
        vec3 lp, ln; serpentVertex(lp, ln);
        vec4 wp = modelMatrix*vec4(lp, 1.);
        vWP = wp.xyz; vWN = normalize(mat3(modelMatrix)*ln); vH = aH; vP = aP; vLY = lp.y;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: SERPENT_FRAG,
  });
  const hull = new THREE.ShaderMaterial({
    fog: true, side: THREE.BackSide, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      ${SPINE_VERT}
      uniform vec3 uKey; uniform float uResY;
      #include <fog_pars_vertex>
      void main(){
        vec3 lp, ln; serpentVertex(lp, ln);
        vec4 wp = modelMatrix*vec4(lp, 1.);
        vec3 wn = normalize(mat3(modelMatrix)*ln);
        float depth = max(-(viewMatrix*wp).z, .1);
        float k = 2./(projectionMatrix[1][1]*uResY);
        wp.xyz += wn*min(depth*k*2.3*(1.+.75*clamp(-dot(wn, uKey), 0., 1.)), .6);
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPaper, uInk, uInkFar;
      ${FOG_FRAG}
      void main(){
        float f = eFog();
        vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, f));
        gl_FragColor = vec4(mix(ink, eFogCol(), smoothstep(.3, 1., f)), 1.);
      }`,
  });
  // the wash: a looser, larger hull, so colour creeps past the outline and breathes
  const wash = new THREE.ShaderMaterial({
    fog: true, side: THREE.BackSide, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      ${SPINE_VERT}
      uniform float uResY;
      varying vec3 vWP; varying float vS;
      #include <fog_pars_vertex>
      void main(){
        vec3 lp, ln; serpentVertex(lp, ln);
        float cr = .5+.5*sin(aS*.13+aH.y*.9+uTime*.22);
        float dpx = max(-(modelViewMatrix*vec4(lp, 1.)).z, .1)*2./(projectionMatrix[1][1]*uResY);
        lp += ln*max(.35+.7*cr, dpx*(4.+6.*cr));
        vec4 wp = modelMatrix*vec4(lp, 1.);
        vWP = wp.xyz; vS = aS;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      varying vec3 vWP; varying float vS;
      void main(){
        float n = eN3(vWP*.22+vec3(0., uTime*.05, 0.));
        float a = (.26+.26*n)*(1.-smoothstep(.25, .9, eFog()));
        vec3 paper = uPaper*.94;
        gl_FragColor = vec4(paper*uWashA*1.25+uWashA*.12, a);
      }`,
  });
  return { main, hull, wash };
}

// ---------------------------------------------------------------------------------------------
// Geometry pen: everything is written in spine space (b, n, t) at spine distance s.
// ---------------------------------------------------------------------------------------------
function makePen() {
  const pos = [], nor = [], aS = [], aH = [], aP = [], aSkin = [], idx = [];
  const pen = {
    n: 0,
    v(b, n, t, nb, nn, nt, s, hv, hu, mat, A, B, kind, skin) {
      pos.push(b, n, t); nor.push(nb, nn, nt); aS.push(s); aH.push(hv, hu); aP.push(mat, A, B, kind); aSkin.push(skin);
      return pen.n++;
    },
    tri(a, b, c) { idx.push(a, b, c); },
    setNormal(k, x, y, z) { nor[k * 3] = x; nor[k * 3 + 1] = y; nor[k * 3 + 2] = z; },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    mark() { return [pen.n, idx.length]; },
    tris() { return idx.length / 3; },
    // smooth normals for everything written since mark m (welding coincident points); orient outward
    smooth(m, orient = true, weld = true) {
      const [v0, i0] = m, cnt = pen.n - v0;
      const acc = new Float32Array(cnt * 3), rep = new Int32Array(cnt);
      if (weld) {
        const map = new Map();
        for (let i = 0; i < cnt; i++) {
          const o = (v0 + i) * 3, key = Math.round(pos[o] * 400) * 1048573 + Math.round(pos[o + 1] * 400) * 8191 + Math.round(pos[o + 2] * 400);
          let r = map.get(key); if (r === undefined) { r = i; map.set(key, i); } rep[i] = r;
        }
      } else for (let i = 0; i < cnt; i++) rep[i] = i;
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < cnt; i++) { const o = (v0 + i) * 3; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; }
      cx /= cnt; cy /= cnt; cz /= cnt;
      let out = 0;
      for (let i = i0; i < idx.length; i += 3) {
        const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
        const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        out += nx * (pos[a] - cx) + ny * (pos[a + 1] - cy) + nz * (pos[a + 2] - cz);
        for (const k of [idx[i], idx[i + 1], idx[i + 2]]) { const r = rep[k - v0] * 3; acc[r] += nx; acc[r + 1] += ny; acc[r + 2] += nz; }
      }
      const flip = orient && out < 0;
      if (flip) for (let i = i0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      for (let i = 0; i < cnt; i++) {
        const r = rep[i] * 3, l = Math.hypot(acc[r], acc[r + 1], acc[r + 2]) || 1, sg = flip ? -1 : 1, o = (v0 + i) * 3;
        nor[o] = sg * acc[r] / l; nor[o + 1] = sg * acc[r + 1] / l; nor[o + 2] = sg * acc[r + 2] / l;
      }
    },
    // (nu+1) x (nv+1) grid of vertices from fn(u, v) -> [b,n,t, s, hv,hu, mat,A,B,kind, skin]
    grid(nu, nv, fn) {
      const base = pen.n;
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
        const q = fn(i / nu, j / nv, i, j);
        pen.v(q[0], q[1], q[2], 0, 1, 0, q[3], q[4], q[5], q[6], q[7], q[8], q[9], q[10]);
      }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = base + i * (nv + 1) + j;
        pen.quad(a, a + nv + 1, a + nv + 2, a + 1);
      }
      return base;
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
      g.setAttribute('aH', new THREE.Float32BufferAttribute(aH, 2));
      g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 4));
      g.setAttribute('aSkin', new THREE.Float32BufferAttribute(aSkin, 1));
      g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 400);
      return g;
    },
  };
  return pen;
}

// Catmull-Rom through sorted [x, y] keys
function curve1(keys, x) {
  const n = keys.length;
  if (x <= keys[0][0]) return keys[0][1];
  if (x >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (i < n - 2 && x > keys[i + 1][0]) i++;
  const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(n - 1, i + 2)][1];
  const t = (x - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3);
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------------
// The spine at rest (the chart pose): a plan curve with a height profile, resampled by arc length.
// ---------------------------------------------------------------------------------------------
const SPD = [0.866, -0.5], SPN = [0.5, 0.866];        // spine direction on the chart (60 degrees off the course) and its normal
const NS = 256;                                        // spine samples in the texture
function buildRestSpine(rng) {
  const pt = (a, off) => new THREE.Vector3(a * SPD[0] + off * SPN[0], 0, a * SPD[1] + off * SPN[1]);
  const tailCurl = rng.range(16, 30) * (rng.chance(0.8) ? 1 : -0.6);
  const plan = new THREE.CatmullRomCurve3([
    pt(-164, tailCurl), pt(-151, tailCurl * 0.5), pt(-136, tailCurl * 0.14), pt(-116, 0), pt(-63.6, 0), pt(0, 0), pt(63.6, 0), pt(90, 0),
    new THREE.Vector3(92, 0, -62), new THREE.Vector3(86, 0, -80), new THREE.Vector3(72, 0, -91), new THREE.Vector3(56, 0, -96.5),
    new THREE.Vector3(42, 0, -95.5), new THREE.Vector3(33.5, 0, -89.5), new THREE.Vector3(30.6, 0, -82.5), new THREE.Vector3(29.6, 0, -78),
  ], false, 'centripetal');
  const M = 1500, pp = plan.getSpacedPoints(M), planLen = plan.getLength(), dq = planLen / M;
  const crownH = [40.5 * rng.range(0.96, 1.04), 40.5, 40.5 * rng.range(0.96, 1.04)];
  const crownA = [-63.6, 0, 63.6];
  // plan distances where the straight (arch) run begins and ends
  let iA = 0, iB = M;
  for (let i = 0; i <= M; i++) { const a = pp[i].x * SPD[0] + pp[i].z * SPD[1]; if (a < -89) iA = i; if (iB === M && a >= 89) iB = i; }
  const humpAt = rng.range(30, 38), humpH = rng.range(0.5, 2.6);
  const tailKeys = [[0, -10], [12, -9.5], [22, -4], [humpAt, humpH], [humpAt + 13, -4.5], [humpAt + 24, -6], [(planLen * iA / M) - 9, 0.5], [planLen * iA / M, 7.5]];
  const neckKeys = [[0, 16.6], [6, 17.3], [13, 19.8], [21, 18], [28, 10], [34, 2], [41, -6], [50, -10]];
  const fy = new Float32Array(M + 1), fr = new Float32Array(M + 1), fs = new Float32Array(M + 1), freg = new Float32Array((M + 1) * 5), fg = new Float32Array(M + 1);
  for (let i = 0; i <= M; i++) {
    const q = i * dq, a = pp[i].x * SPD[0] + pp[i].z * SPD[1];
    let y, R = 4.5;
    const reg = [0, 0, 0, 0, 0];
    if (i <= iA) {
      const e = (iA - i) * dq; y = curve1(tailKeys, e);
      R = 0.95 + 3.55 * Math.pow(1 - sstep(8, planLen * iA / M, e), 0.7);
      reg[0] = 1;
    } else if (i >= iB) {
      const g = (M - i) * dq; y = curve1(neckKeys, g);
      R = 3.0 + 1.5 * sstep(4, 58, g);
      reg[4] = 1;
    } else {
      y = -1e9;
      for (let c = 0; c < 3; c++) { const dd = Math.abs(a - crownA[c]) / 22; y = Math.max(y, crownH[c] * (1 - dd * dd * dd)); }
      const k = 3; y = Math.log(Math.exp(k * Math.max(y, -40) / 10) + Math.exp(-k)) * 10 / k;       // soft floor at -10
      const w0 = 1 - sstep(-37.8, -25.8, a), w2 = sstep(25.8, 37.8, a);
      reg[1] = w0; reg[3] = w2; reg[2] = 1 - w0 - w2;
      const tb = sstep(-89, -80, a), nb = 1 - sstep(80, 89, a);
      reg[0] = (1 - tb); reg[1] *= tb; reg[4] = 1 - nb; reg[3] *= nb;
    }
    fy[i] = y; fr[i] = R; fg[i] = (M - i) * dq;
    for (let c = 0; c < 5; c++) freg[i * 5 + c] = reg[c];
    if (i > 0) fs[i] = fs[i - 1] + Math.hypot(pp[i].x - pp[i - 1].x, y - fy[i - 1], pp[i].z - pp[i - 1].z);
  }
  const L = fs[M];
  const sp = { L, N: NS, x: new Float32Array(NS), y: new Float32Array(NS), z: new Float32Array(NS), ex: new Float32Array(NS), ez: new Float32Array(NS),
    R: new Float32Array(NS), reg: new Float32Array(NS * 5), g: new Float32Array(NS), crownH, sNeck: 0, sTailEnd: 0 };
  let j = 0;
  for (let i = 0; i < NS; i++) {
    const s = (i / (NS - 1)) * L;
    while (j < M - 1 && fs[j + 1] < s) j++;
    const f = Math.min(1, Math.max(0, (s - fs[j]) / Math.max(1e-6, fs[j + 1] - fs[j])));
    sp.x[i] = pp[j].x + (pp[j + 1].x - pp[j].x) * f; sp.z[i] = pp[j].z + (pp[j + 1].z - pp[j].z) * f;
    sp.y[i] = fy[j] + (fy[j + 1] - fy[j]) * f; sp.R[i] = fr[j] + (fr[j + 1] - fr[j]) * f; sp.g[i] = fg[j] + (fg[j + 1] - fg[j]) * f;
    const j0 = Math.max(0, j - 3), j1 = Math.min(M, j + 4), ex = pp[j1].x - pp[j0].x, ez = pp[j1].z - pp[j0].z, el = Math.hypot(ex, ez) || 1;
    sp.ex[i] = ex / el; sp.ez[i] = ez / el;
    for (let c = 0; c < 5; c++) sp.reg[i * 5 + c] = freg[j * 5 + c] + (freg[(j + 1) * 5 + c] - freg[j * 5 + c]) * f;
  }
  sp.sNeck = fs[iB]; sp.sTailEnd = fs[iA];
  // lookups by spine distance (rest pose)
  const at = (arr, s) => { const x = Math.min(1, Math.max(0, s / L)) * (NS - 1), i = Math.min(NS - 2, Math.floor(x)), f = x - i; return arr[i] + (arr[i + 1] - arr[i]) * f; };
  sp.radAt = (s) => at(sp.R, s); sp.yAt = (s) => at(sp.y, s);
  sp.regAt = (s, c) => { const x = Math.min(1, Math.max(0, s / L)) * (NS - 1), i = Math.min(NS - 2, Math.floor(x)); return sp.reg[i * 5 + c]; };
  return sp;
}

// ---------------------------------------------------------------------------------------------
// Body: girth section, tube, belly plates, raised scutes, dorsal fin, barnacles, wrack
// ---------------------------------------------------------------------------------------------
const GIRTH = 4.5, SC_U = 0.9425, SC_S = 0.9;
function sec(th, R) {                                   // (b, n) of the skin at girth angle th (0 = dorsal ridge)
  const c = Math.cos(th), s = Math.sin(th);
  let n = c >= -0.7 ? c : -0.7 - (-c - 0.7) * 0.5;
  n = n * 1.03 + 0.1 * Math.exp(-(th / 0.3) * (th / 0.3));
  return [s * R * 0.98, n * R];
}
async function addTube(pen, sp, step, segs, noise, seedOff, Y) {
  const nR = Math.ceil(sp.L / step);
  for (let i = 0; i <= nR; i++) {
    if (Y && i % 24 === 23) await Y();
    const s = (i / nR) * sp.L;
    let R = sp.radAt(s) * (1 + 0.035 * noise.n2(s * 0.045, seedOff));
    if (i === 0) R = 0.03;
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2 - Math.PI, q = sec(th, R);
      pen.v(q[0], q[1], 0, Math.sin(th), Math.cos(th), 0, s, s, th * GIRTH, 0, 0, 0, 0, -1);
    }
  }
  const base = pen.n - (nR + 1) * (segs + 1);
  for (let i = 0; i < nR; i++) {
    if (Y && i % 48 === 47) await Y();
    for (let j = 0; j < segs; j++) {
      const a = base + i * (segs + 1) + j;
      pen.quad(a, a + segs + 1, a + segs + 2, a + 1);
    }
  }
}
async function addBellyPlates(pen, sp, Y) {
  let yc = 0;
  const span = 0.98, nv = 9;
  const rows = [[0.92, 1.006, 0], [-1.05, 1.055, 1], [-0.95, 0.99, 1]];
  for (let s = 5; s < sp.L - 1.2; s += 1.7) {
    if ((++yc & 31) === 0) await Y();
    const R = sp.radAt(s); if (R < 2.2) continue;
    const m = pen.mark(), base = pen.n;
    for (let r = 0; r < 3; r++) for (let j = 0; j <= nv; j++) {
      const f = j / nv, x = f * 2 - 1, th = Math.PI + x * span, keel = Math.cos(x * Math.PI * 3);
      const q = sec(th, R * (rows[r][1] + (r < 2 ? 0.02 + 0.02 * keel : 0)) * (1 - 0.012 * Math.abs(x)));
      const t = rows[r][0] - (r > 0 ? 0.14 * keel : 0);
      pen.v(q[0], q[1], t, 0, -1, 0, s, s + t, th * GIRTH, 1, rows[r][2], f, 0, -1);
    }
    for (let r = 0; r < 2; r++) for (let j = 0; j < nv; j++) { const a = base + r * (nv + 1) + j; pen.quad(a, a + 1, a + nv + 2, a + nv + 1); }
    pen.smooth(m, true, false);
  }
}
async function addScutes(pen, sp, rng, Y) {
  const rim = [[-0.5, 0.2], [0, 0.36], [0.5, 0.2], [0.64, -0.26], [0, -0.92], [-0.64, -0.26]];
  const tipW = [0, 0, 0, 0.55, 1, 0.55];
  const rows = Math.floor(sp.L / SC_S);
  for (let j = 6; j < rows - 6; j++) {
    if ((j & 31) === 0) await Y();
    const s = j * SC_S, R = sp.radAt(s);
    if (R < 2.0 || sp.yAt(s) < -6) continue;
    const cols = [1, 2, -2, -3, 7, -8]; if (j % 3 === 0) cols.push(4, -5);
    for (const i of cols) {
      const u = (i + 0.5 * (j % 2)) * SC_U, th = u / GIRTH, k = (R / GIRTH) * rng.range(1.05, 1.3);
      const sn = Math.sin(th), cs = Math.cos(th);
      const cq = sec(th, R + 0.2 * k);
      const c = pen.v(cq[0], cq[1], -0.22 * k, sn, cs, -0.12, s, s - 0.22 * k, u, 2, 1, 0.42, 1, -1);
      const first = pen.n;
      for (let r = 0; r < 6; r++) {
        const du = rim[r][0] * k, dt = rim[r][1] * k, thv = th + du / R, q = sec(thv, R + 0.02 + 0.05 * tipW[r]);
        pen.v(q[0], q[1], dt, Math.sin(thv), Math.cos(thv), -0.3 * tipW[r], s, s + dt, u + du, 2, 0, tipW[r], 1, -1);
      }
      for (let r = 0; r < 6; r++) pen.tri(c, first + r, first + (r + 1) % 6);
    }
  }
}
async function addDorsalFin(penOut, penIn, sp, noise, seedOff, Y) {
  const sA = 26, sB = sp.L - 15, n = Math.round((sB - sA) / 2.7), hs = [], ss = [];
  for (let k = 0; k <= n; k++) {
    const s = sA + (k / n) * (sB - sA);
    const taper = sstep(sA, sA + 30, s) * (1 - sstep(sB - 22, sB, s) * 0.55);
    const gap = sstep(-0.55, -0.25, noise.n2(s * 0.016, seedOff + 9));          // sails with gaps between
    const h = 4.0 * Math.min(1.12, Math.max(0.18, 0.72 + 0.5 * noise.n2(s * 0.05, seedOff))) * taper * (0.25 + 0.75 * gap) * (0.82 + 0.3 * (k % 2));
    hs.push(Math.max(0.35, h)); ss.push(s);
  }
  const rake = 0.45;
  for (let k = 0; k <= n; k++) {
    if ((k & 15) === 0) await Y();
    const s = ss[k], h = hs[k], ns = sec(0, sp.radAt(s))[1] - 0.12, m = penOut.mark();
    // the spine: a tapered four-sided bone standing proud of the membrane
    const hh = h * 1.12;
    penOut.grid(4, 4, (u, v) => {
      const a = v * Math.PI * 2, r = 0.17 * (1 - u * 0.86), up = u * hh;
      return [Math.cos(a) * r, ns + up, Math.sin(a) * r * 1.5 - rake * up, s, s, up, 4, 0, u * 1.12, 6, sp.radAt(s)];
    });
    penOut.smooth(m, true);
    if (k === n) break;
    const s2 = ss[k + 1], h2 = hs[k + 1];
    const base = penIn.n, nc = 4, nr = 3;
    for (let c = 0; c <= nc; c++) for (let r = 0; r <= nr; r++) {
      const f = c / nc, sm = s + (s2 - s) * f, hm = (h + (h2 - h) * f) * (1 - 0.3 * Math.sin(Math.PI * f)) * (r / nr);
      const nsm = sec(0, sp.radAt(sm))[1] - 0.12;
      penIn.v(0, nsm + hm, -rake * hm, 1, 0, 0, sm, sm - rake * hm, hm, 3, f, r / nr, 6, sp.radAt(sm));
    }
    for (let c = 0; c < nc; c++) for (let r = 0; r < nr; r++) { const a = base + c * (nr + 1) + r; penIn.quad(a, a + nr + 1, a + nr + 2, a + 1); }
  }
}
async function addBarnacles(pen, sp, rng, count, Y) {
  // legs: stretches of spine standing 1-13 m above the still sea
  const spots = [];
  for (let s = 20; s < sp.L - 20; s += 0.6) { const y = sp.yAt(s); if (y > 0.5 && y < 13) spots.push(s); }
  if (!spots.length) return;
  const ringsAt = []; for (let i = 0; i < 26; i++) ringsAt.push(rng.pick(spots));
  for (let i = 0; i < count; i++) {
    if ((i & 63) === 0) await Y();
    const inRing = rng.chance(0.7), s = inRing ? ringsAt[i % ringsAt.length] + rng.gauss() * 0.45 : rng.pick(spots);
    const R = sp.radAt(s), th = rng.range(-2.2, 2.2), r = rng.range(0.22, 0.55) * (inRing ? 1 : 0.8), h = r * rng.range(0.7, 1.3);
    const sn = Math.sin(th), cs = Math.cos(th), p0 = sec(th, R - 0.03), tw = rng.range(0, 6.28);
    const m = pen.mark(), base = pen.n, K = 5;
    for (let ring = 0; ring < 3; ring++) for (let k = 0; k < K; k++) {
      const a = tw + (k / K) * Math.PI * 2, rr = ring === 0 ? r : ring === 1 ? r * 0.55 : r * 0.3, hh = ring === 0 ? 0 : ring === 1 ? h : h * 0.55;
      const g = Math.cos(a) * rr, t = Math.sin(a) * rr;
      pen.v(p0[0] + cs * g + sn * hh, p0[1] - sn * g + cs * hh, t, sn, cs, 0, s, s + t, th * GIRTH + g, 8, ring === 0 ? 0 : ring === 1 ? 0.74 : 1, 0, 0, -1);
    }
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < K; k++) {
      const a = base + ring * K + k, b = base + ring * K + (k + 1) % K;
      pen.quad(a, b, b + K, a + K);
    }
    pen.tri(base + 2 * K, base + 2 * K + 1, base + 2 * K + 2); pen.tri(base + 2 * K, base + 2 * K + 2, base + 2 * K + 3); pen.tri(base + 2 * K, base + 2 * K + 3, base + 2 * K + 4);
    pen.smooth(m, true, false);
  }
}
async function addWrack(pen, sp, rng, count, Y) {
  const spots = [];
  for (let s = 20; s < sp.L - 8; s += 0.8) if (sp.yAt(s) > 11) spots.push(s);
  if (!spots.length) return;
  for (let i = 0; i < count; i++) {
    if ((i & 31) === 0) await Y();
    const s = rng.pick(spots), R = sp.radAt(s), side = rng.sign(), th = side * rng.range(1.75, 2.45), q = sec(th, R * 0.97);
    const len = rng.range(4, 8) * Math.min(1, (sp.yAt(s) - 3) / 9), ph = rng.range(0, 6.28), wd = rng.range(0.28, 0.5), seg = 8, base = pen.n;
    for (let k = 0; k <= seg; k++) {
      const f = k / seg, w = wd * Math.sqrt(Math.sin(Math.PI * Math.min(0.97, f * 0.9 + 0.07))) * (1 + 0.45 * Math.sin(f * 11 + ph));
      for (const e of [-1, 1]) pen.v(q[0], q[1], 0, e * w, 0, 0, s, e * w * 2.2 + i * 3.7, f * len, 7, f * len, ph, 3, -1);
    }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; pen.quad(a, a + 1, a + 3, a + 2); }
  }
}

// ---------------------------------------------------------------------------------------------
// The head: 14 m long, 7 m high, rigid on the last spine frame (b = its left, n = up, t = forward).
// ---------------------------------------------------------------------------------------------
const HW = [[-1.2, 2.95], [1, 3.1], [3.5, 3.5], [5.5, 3.2], [8, 2.3], [10.5, 1.95], [11.8, 2.15], [12.7, 1.95], [13.35, 1.5], [13.8, 0.85], [14, 0.25]];
const HTOP = [[-1.2, 3.05], [1.5, 3.2], [4, 3.8], [5.6, 3.6], [7.5, 2.5], [9.5, 2.05], [11.5, 2.3], [12.4, 2.35], [13.1, 2.0], [13.65, 1.35], [14, 0.6]];
const HM = [[-1.2, -0.6], [2.6, -0.5], [5, -0.8], [8, -0.45], [11, -0.6], [13, -0.05], [14, 0.3]];
const HJB = [[1, -3.0], [3, -3.1], [6, -2.5], [9.5, -1.8], [12, -1.3], [12.9, -0.75]];
async function addHead(po, pi, sp, rng, variant, Y) {
  const L = sp.L, JAW = 60;
  const V = (b, n, t, hv, hu, mat, A, B, kind, skin) => [b, n, t, L, L + hv, hu, mat, A, B, kind, skin];
  await Y();
  // --- skull and upper jaw
  let m = po.mark();
  po.grid(44, 28, (u, v) => {
    const t = -1.2 + 15.2 * (1 - Math.pow(1 - u, 1.3)), open = sstep(1.5, 3.6, t);
    const w = curve1(HW, t), top = curve1(HTOP, t), mm = curve1(HM, t), bot = -2.95 + (mm - 0.6 + 2.95) * open;
    const p0 = -0.5 * Math.PI + (0.5 - 0.13) * Math.PI * open, ph = p0 + v * (Math.PI - 2 * p0);
    const sn = Math.sin(ph), cs = Math.cos(ph);
    const brow = 0.5 * Math.exp(-(((t - 4.7) / 1.2) ** 2)) * Math.exp(-(((Math.abs(ph - Math.PI / 2) - 0.72) / 0.42) ** 2));
    const nose = 0.3 * Math.exp(-(((t - 12.2) / 0.7) ** 2)) * Math.exp(-(((Math.abs(ph - Math.PI / 2) - 0.5) / 0.3) ** 2));
    const cheek = 0.3 * Math.exp(-(((t - 2.6) / 1.5) ** 2)) * Math.exp(-(((Math.abs(ph - Math.PI / 2) - 1.45) / 0.4) ** 2));
    const k = 1 + (brow + nose + cheek) / Math.max(1.2, w);
    const y = sn >= 0 ? mm + (top - mm) * Math.pow(sn, 0.68) : mm - (mm - bot) * Math.pow(-sn, 0.7);
    const x = w * Math.sign(cs) * Math.pow(Math.abs(cs), 0.85);
    return V(x * k, mm + (y - mm) * k, t, t, (ph - Math.PI / 2) * 3.2, 5, 0, 0, 0, 0);
  });
  po.smooth(m, true);
  await Y();
  // --- lower jaw (hinged)
  const jawTop = (t) => curve1(HM, t) - 0.22, jawW = (t) => curve1(HW, t) * (0.93 - 0.5 * sstep(11.4, 12.9, t));
  m = po.mark();
  po.grid(30, 18, (u, v) => {
    const t = 1 + 11.9 * u, w = jawW(t), top = jawTop(t), jb = curve1(HJB, t), ps = -0.1 * Math.PI + v * 1.2 * Math.PI;
    const sn = Math.sin(ps), cs = Math.cos(ps);
    const y = sn >= 0 ? top - (top - jb) * Math.pow(sn, 0.72) : top + 0.22 * -sn;
    return V(w * Math.sign(cs) * Math.pow(Math.abs(cs), 0.85) * (sn < 0 ? 0.93 : 1), y, t, t, (ps - Math.PI / 2) * 3.2 + 40, 5, 0, 0, 4, 0);
  });
  po.smooth(m, true);
  await Y();
  // --- palate and mouth floor (rose)
  for (const lower of [0, 1]) {
    m = pi.mark();
    pi.grid(10, 4, (u, v) => {
      const t = 2.8 + (lower ? 9.6 : 10.6) * u, w = (lower ? jawW(t) : curve1(HW, t)) * 0.9, x = (v * 2 - 1) * w;
      const y = lower ? jawTop(t) - 0.12 - 0.3 * (1 - (v * 2 - 1) ** 2) : curve1(HM, t) - 0.2 + 0.55 * (1 - (v * 2 - 1) ** 2);
      return V(x, y, t, t, x, 9, 0, 0, lower ? 4 : 0, 0);
    });
    pi.smooth(m, false);
  }
  await Y();
  // --- teeth, fangs
  const cone = (pen, bx, by, bz, dx, dy, dz, len, r, mat, kind, bend, skin = 0) => {
    const mk = pen.mark();
    pen.grid(5, 6, (u, v) => {
      const a = v * Math.PI * 2, rr = r * (1 - u) ** 0.8 + 0.01, c = u * len, bow = bend * u * u * len;
      // frame: axis d, side vectors from world b and t
      return V(bx + dx * c + Math.cos(a) * rr * (1 - Math.abs(dx)) + bow * (bx > 0 ? 1 : -1) * 0, by + dy * c + Math.sin(a) * rr * Math.abs(dz) + bow * dy * 0,
        bz + dz * c + Math.sin(a) * rr * Math.abs(dy) + Math.cos(a) * rr * Math.abs(dx) - bow, c * 0.6, a * rr, mat, 0, u, kind, skin);
    });
    pen.smooth(mk, true);
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const t = 4.6 + i * 0.95 + rng.range(-0.15, 0.15), big = i === 7 ? 1.9 : i > 5 ? 1.25 : 1;
      cone(po, side * curve1(HW, t) * 0.9, curve1(HM, t) - 0.3, t, 0, -1, 0, rng.range(0.6, 0.95) * big, 0.2 * big, 4, 0, 0.12);
    }
    for (let i = 0; i < 8; i++) {
      const t = 5.0 + i * 0.95 + rng.range(-0.15, 0.15);
      cone(po, side * jawW(t) * 0.88, jawTop(t) - 0.1, t, 0, 1, 0, rng.range(0.5, 0.8), 0.18, 4, 4, 0.1);
    }
  }
  await Y();
  // --- boar tusks from the lower jaw (3 m when the head is 'tusked')
  const tuskLen = variant === 'tusked' ? 3.1 : 1.7;
  for (const side of [-1, 1]) {
    m = po.mark();
    const t0 = 9.6, x0 = side * jawW(t0) * 0.92, y0 = jawTop(t0) - 0.35, rad = tuskLen / 1.5;
    po.grid(10, 8, (u, v) => {
      const ang = u * 1.5, a = v * Math.PI * 2, rr = 0.36 * (tuskLen / 3.1) ** 0.6 * (1 - u) ** 0.75 + 0.012;
      const cx = x0 + side * (1 - Math.cos(ang)) * rad * 0.75 + side * u * 0.5, cy = y0 + Math.sin(ang) * rad, cz = t0 + u * 0.5 - (1 - Math.cos(ang)) * rad * 0.55;
      // ring in the plane spanned by the curve's normal (radial) and t
      const ox = side * Math.cos(ang) * 0.8, oy = -Math.sin(ang);
      return V(cx + ox * Math.cos(a) * rr, cy + oy * Math.cos(a) * rr, cz + Math.sin(a) * rr, u * tuskLen * 0.5, a * rr, 4, 0, u, 4, 0);
    });
    po.smooth(m, true);
  }
  await Y();
  // --- eyes (gold leaf), heavy lids
  const eyes = [];
  for (const side of [-1, 1]) {
    const C = [side * curve1(HW, 5.2) * 0.9, 1.7, 5.2], A = new THREE.Vector3(side * 0.9, 0.2, 0.38).normalize();
    const et = new THREE.Vector3(0, 0, 1).addScaledVector(A, -A.z).normalize(), en = new THREE.Vector3().crossVectors(A, et).multiplyScalar(side).normalize();
    if (en.y < 0) en.multiplyScalar(-1);
    const Re = 0.66, amax = 1.3;
    const base = pi.n;
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 14; j++) {
      const al = (i / 6) * amax, be = (j / 14) * Math.PI * 2, sa = Math.sin(al), ca = Math.cos(al) - 0.25;
      const px = A.x * ca + (et.x * Math.cos(be) + en.x * Math.sin(be)) * sa, py = A.y * ca + (et.y * Math.cos(be) + en.y * Math.sin(be)) * sa, pz = A.z * ca + (et.z * Math.cos(be) + en.z * Math.sin(be)) * sa;
      pi.v(C[0] + px * Re, C[1] + py * Re, C[2] + pz * Re, px, py, pz, L, Math.cos(be) * sa / Math.sin(amax), Math.sin(be) * sa / Math.sin(amax), 6, side, 0, 0, 0);
    }
    for (let i = 0; i < 6; i++) for (let j = 0; j < 14; j++) { const a = base + i * 15 + j; pi.quad(a, a + 15, a + 16, a + 1); }
    m = po.mark();
    po.grid(14, 6, (u, v) => {
      const be = u * Math.PI * 2, a = v * Math.PI * 2, lid = 0.2 + 0.1 * Math.max(0, Math.sin(be)), RR = Re * 1.0 + 0.1;
      const rx = (et.x * Math.cos(be) + en.x * Math.sin(be)), ry = (et.y * Math.cos(be) + en.y * Math.sin(be)), rz = (et.z * Math.cos(be) + en.z * Math.sin(be));
      const d = RR + Math.cos(a) * lid, o = Math.sin(a) * lid + 0.05 + 0.12 * Math.max(0, Math.sin(be));
      return V(C[0] + rx * d + A.x * o, C[1] + ry * d + A.y * o, C[2] + rz * d + A.z * o, C[2] + rz * d - L + L, be * 2, 5, 0, 0, 0, 0);
    });
    po.smooth(m, true);
    eyes.push(C);
  }
  await Y();
  // --- blowholes
  const blow = [];
  for (const side of [-1, 1]) {
    const t = 11.3, x = side * 0.78, y = curve1(HTOP, t) - 0.25;
    m = po.mark();
    po.grid(3, 9, (u, v) => { const a = v * Math.PI * 2, r = [0.55, 0.4, 0.3, 0.12][Math.round(u * 3)], h = [0, 0.42, 0.5, 0.2][Math.round(u * 3)]; return V(x + Math.cos(a) * r, y + h, t + Math.sin(a) * r, t, a, 5, 0, 0, 0, 0); });
    po.smooth(m, true);
    blow.push([x, y + 0.5, t]);
  }
  await Y();
  // --- strands: beard of barbels under the jaw, two long whiskers, a mane if the seed says so
  const strand = (x, y, z, dx, dy, dz, len, r, ph, onJaw, mat = 7, curl = 0) => {
    const mk = po.mark();
    po.grid(7, 5, (u, v) => {
      const a = v * Math.PI * 2, rr = r * (1 - u * 0.9) + 0.015, c = u * len;
      return V(x + dx * c + Math.cos(a) * rr + Math.sign(dx) * curl * Math.sin(Math.PI * u) * len * 0.2, y + dy * c - (0.25 + 0.4 * curl) * u * u * len * (1 - Math.abs(dy)),
        z + dz * c + Math.sin(a) * rr, c, a * rr + ph, mat, u, ph, 5, onJaw ? JAW : 0);
    });
    po.smooth(mk, true);
  };
  for (let i = 0; i < 12; i++) {
    const t = rng.range(3.2, 9.5), side = (i % 2) * 2 - 1, x = side * jawW(t) * rng.range(0.1, 0.85);
    strand(x, curve1(HJB, t) * (1 - 0.35 * (x / jawW(t)) ** 2) + 0.2, t, side * 0.1, -0.93, -0.3, rng.range(2.6, 5.6) * (variant === 'maned' ? 1.25 : 1), rng.range(0.16, 0.26), rng.range(0, 6.28), true);
  }
  for (const side of [-1, 1]) strand(side * 1.9, curve1(HM, 12.2) + 0.1, 12.2, side * 0.6, -0.2, -0.75, 5.6, 0.2, rng.range(0, 6.28), false, 7, 1);
  if (variant === 'maned') for (let i = 0; i < 46; i++) {
    const t = rng.range(-1.1, 4.6), ph = rng.range(-1.25, 1.25), w = curve1(HW, t), top = curve1(HTOP, t);
    strand(Math.sin(ph) * w * 0.95, top * Math.cos(ph) * 0.96, t, Math.sin(ph) * 0.5, 0.35 * Math.cos(ph), -0.78, rng.range(3, 6.5), rng.range(0.14, 0.22), rng.range(0, 6.28), false);
  }
  return { blow, eyes, jawTop, jawW };
}

// A fan of rays with membrane between: pectoral fins, tail fin, frills, crest.
//   o: { s, root:[b,n,t], e1, e2 (unit-ish, the fan lies in their plane; angle 0 = e1), a0, a1, len, rays,
//        profile(f)->0..1, sag, kind (2 fans, 6 sways as one), skin, bones }
function addFan(po, pi, o) {
  const e1 = new THREE.Vector3(...o.e1).normalize(), e2 = new THREE.Vector3(...o.e2);
  e2.addScaledVector(e1, -e2.dot(e1)).normalize();
  const nrm = new THREE.Vector3().crossVectors(e1, e2).normalize();
  const rays = o.rays, sub = 3, nc = rays * sub, nr = 5, kind = o.kind ?? 2, skin = o.skin ?? 0, sag = o.sag ?? 0.2;
  const lenAt = (f) => o.len * o.profile(f);
  const base = pi.n;
  for (let c = 0; c <= nc; c++) for (let r = 0; r <= nr; r++) {
    const f = c / nc, a = o.a0 + (o.a1 - o.a0) * f, fr = (c % sub) / sub;
    const len = lenAt(f) * (1 - sag * Math.sin(Math.PI * fr) ** 2), d = len * (0.04 + 0.96 * r / nr);
    const dx = e1.x * Math.cos(a) + e2.x * Math.sin(a), dy = e1.y * Math.cos(a) + e2.y * Math.sin(a), dz = e1.z * Math.cos(a) + e2.z * Math.sin(a);
    pi.v(o.root[0] + dx * d, o.root[1] + dy * d, o.root[2] + dz * d, nrm.x, nrm.y, nrm.z, o.s, a * o.len * 0.55 + (o.hOff || 0), d, o.mat ?? 3, f * rays, r / nr, kind, skin);
  }
  for (let c = 0; c < nc; c++) for (let r = 0; r < nr; r++) { const q = base + c * (nr + 1) + r; pi.quad(q, q + nr + 1, q + nr + 2, q + 1); }
  if (!o.bones) return;
  for (let i = 0; i <= rays; i++) {
    const f = i / rays, a = o.a0 + (o.a1 - o.a0) * f, len = lenAt(f) * (o.boneOver ?? 1.08);
    const dx = e1.x * Math.cos(a) + e2.x * Math.sin(a), dy = e1.y * Math.cos(a) + e2.y * Math.sin(a), dz = e1.z * Math.cos(a) + e2.z * Math.sin(a);
    const sx = dy * nrm.z - dz * nrm.y, sy = dz * nrm.x - dx * nrm.z, sz = dx * nrm.y - dy * nrm.x;
    const pen = kind === 6 ? po : pi, m = pen.mark(), r0 = o.boneR ?? 0.16;
    pen.grid(4, 4, (u, v) => {
      const an = v * Math.PI * 2, rr = r0 * (1 - u * 0.88), d = u * len, cx = Math.cos(an) * rr, cy = Math.sin(an) * rr;
      return [o.root[0] + dx * d + sx * cx + nrm.x * cy, o.root[1] + dy * d + sy * cx + nrm.y * cy, o.root[2] + dz * d + sz * cx + nrm.z * cy,
        o.s, d, an * rr, 4, f * rays, Math.min(1, u * (o.boneOver ?? 1.08)), kind, skin];
    });
    if (kind === 6) pen.smooth(m, true);
    else { const [v0] = m; for (let k = v0; k < pen.n; k++) pen.setNormal(k, nrm.x, nrm.y, nrm.z); }
  }
}
async function addFinsAndCrest(po, pi, sp, rng, variant, Y) {
  const L = sp.L;
  await Y();
  // pectoral fins: 12 m, behind the head
  const sP = L - 13, RP = sp.radAt(sP);
  for (const side of [-1, 1]) {
    const q = sec(side * 1.8, RP * 0.93);
    addFan(po, pi, { s: sP, root: [q[0], q[1], 0], e1: [side * 0.78, -0.12, -0.62], e2: [side * 0.2, 0.78, 0.58], a0: -0.42, a1: 0.92, len: 12, rays: 9,
      profile: (f) => 0.5 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, f * 0.8 + 0.22)), 1.4), sag: 0.16, kind: 2, skin: RP * 0.9, bones: true, boneR: 0.14, hOff: side * 50 });
  }
  await Y();
  // tail fin: a lunate fluke 12 m long on the last of the tail
  addFan(po, pi, { s: 3, root: [0, 0, 0], e1: [0, 0, -1], e2: [0, 1, 0], a0: -0.95, a1: 0.95, len: 12, rays: 10,
    profile: (f) => 0.5 + 0.5 * Math.pow(Math.abs(f * 2 - 1), 1.6), sag: 0.14, kind: 2, skin: 0, bones: true, boneR: 0.15, hOff: 200 });
  await Y();
  // gill frills either side of the head
  for (const side of [-1, 1]) addFan(po, pi, { s: L, root: [side * 2.9, 0.5, 1.0], e1: [side * 0.62, 0.2, -0.76], e2: [side * 0.12, 0.95, 0.28], a0: -0.9, a1: 1.0, len: 4.6, rays: 7,
    profile: (f) => 0.62 + 0.38 * Math.sin(Math.PI * f), sag: 0.24, kind: 2, skin: 0, bones: true, boneR: 0.09, hOff: side * 90, mat: 10 });
  await Y();
  // crest of spines down the skull
  addFan(po, pi, { s: L, root: [0, 2.7, 3.0], e1: [0, 1, 0], e2: [0, 0, -1], a0: -0.55, a1: 1.4, len: variant === 'maned' ? 3.6 : 5.2, rays: 7,
    profile: (f) => 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, f * 0.85 + 0.2)), sag: 0.42, kind: 6, skin: 0, bones: true, boneR: 0.19, boneOver: 1.2, hOff: 300, mat: 10 });
  await Y();
  // ram horns: a ridged spiral behind each brow
  if (variant === 'ram') for (const side of [-1, 1]) {
    const m = po.mark();
    po.grid(30, 8, (u, v) => {
      const ang = -0.5 + u * 7.4, rad = 2.0 * (1 - u * 0.62), an = v * Math.PI * 2;
      const rr = (0.62 * (1 - u) ** 0.8 + 0.03) * (1 + 0.1 * Math.sin(u * 95));
      const cx = side * (2.1 + u * 2.6), cy = 2.9 + Math.sin(ang) * rad * 0.9 - u * 0.9, cz = 2.2 - Math.cos(ang) * rad;
      const ox = 0, oy = Math.sin(ang), oz = -Math.cos(ang);
      return [cx + side * Math.sin(an) * rr + ox, cy + oy * Math.cos(an) * rr, cz + oz * Math.cos(an) * rr, L, L + u * 14, an * rr, 4, 0, u, 0, 0];
    });
    po.smooth(m, true);
  }
  await Y();
  // forked tongue
  const base = pi.n, seg = 9;
  for (let k = 0; k <= seg; k++) for (const e of [-1, 1]) {
    const f = k / seg, fork = Math.max(0, f - 0.72) / 0.28, w = 0.42 * (1 - 0.5 * f) * (1 - fork * 0.75);
    pi.v(e * (w + fork * 0.55), -0.95 - 2.1 * f * f, 7.5 + f * 6.8, 0, 1, 0, L, L + f * 8, e * w, 9, f * 0.9, e * 0.8 + 2, 5, 0);
  }
  for (let k = 0; k < seg; k++) { const a = base + k * 2; pi.quad(a, a + 1, a + 3, a + 2); }
}

// ---------------------------------------------------------------------------------------------
// Line-rain shed by the coils, and the spouts: ribbons that never fall under ~1.6 px wide.
// ---------------------------------------------------------------------------------------------
function buildRain(sp, rng, count, U, extra) {
  const spots = [];
  for (let s = 10; s < sp.L - 4; s += 0.25) if (sp.yAt(s) > 5) spots.push(s);
  const pos = [], aS = [], aQ = [], aR = [], idx = [];
  const n = Math.min(count, spots.length * 4), stride = spots.length / n;
  for (let i = 0; i < n; i++) {
    const s = spots[Math.floor(i * stride)], lane = i % 5, R = sp.radAt(s);
    const b = ((lane + 0.5) / 5 * 2 - 1) * R * 0.86 + rng.range(-0.15, 0.15), ph = (lane * 0.37 + i * 0.6180339) % 1, len = rng.range(3.2, 7.5);
    const drop = R * (0.86 - 0.3 * (b / R) * (b / R));
    for (let k = 0; k < 4; k++) { pos.push(b, drop, len); aS.push(s); aQ.push((k & 1) * 2 - 1, k >> 1); aR.push(ph, rng()); }
    const o = i * 4; idx.push(o, o + 1, o + 3, o, o + 3, o + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(aQ, 2)); g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 2));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 400);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      uniform sampler2D uSpine; uniform float uSpN, uSpLen, uTime, uResY, uRain; uniform vec2 uGust;
      attribute float aS; attribute vec2 aQ, aR;
      varying vec2 vQ; varying float vA;
      #include <fog_pars_vertex>
      void main(){
        float x = clamp(aS/uSpLen, 0., 1.)*(uSpN-1.);
        float i = min(floor(x), uSpN-2.), f = x-i;
        ivec2 a = ivec2(int(i), 0), b = ivec2(int(i)+1, 0);
        vec3 P = mix(texelFetch(uSpine, a, 0).xyz+texelFetch(uSpine, a+ivec2(0,1), 0).xyz, texelFetch(uSpine, b, 0).xyz+texelFetch(uSpine, b+ivec2(0,1), 0).xyz, f);
        vec3 N = mix(texelFetch(uSpine, a+ivec2(0,2), 0).xyz, texelFetch(uSpine, b+ivec2(0,2), 0).xyz, f);
        vec3 T = mix(texelFetch(uSpine, a+ivec2(0,3), 0).xyz, texelFetch(uSpine, b+ivec2(0,3), 0).xyz, f);
        vec3 B = normalize(cross(N, T)+vec3(1e-5, 0., 0.));
        vec3 o = P+B*position.x; o.y -= position.y;
        float cyc = 46.+8.*aR.y;
        float fall = fract(aR.x+uTime*30./cyc)*cyc;
        float len = position.z*(.5+.5*smoothstep(0., 8., fall));
        vec2 sl = uGust*(1.+.4*sin(uTime*.7+aS*.05));
        vec3 top = o+vec3(sl.x*fall, -fall, sl.y*fall);
        vec3 bot = top+vec3(sl.x*len, -len, sl.y*len);
        float vis = step(3.5, o.y)*step(.5, top.y)*uRain;
        bot = mix(top, bot, clamp(top.y/max(top.y-bot.y, 1e-3), 0., 1.));
        vec4 vt = modelViewMatrix*vec4(top, 1.), vb = modelViewMatrix*vec4(bot, 1.);
        vec4 mvPosition = mix(vt, vb, aQ.y);
        vec2 dir = vb.xy-vt.xy; dir = dir/max(length(dir), 1e-4);
        float depth = max(-mvPosition.z, .1);
        float pxw = depth*2./(projectionMatrix[1][1]*uResY);
        float hwid = min(max(.022, .8*pxw), 2.2*pxw);
        mvPosition.xy += vec2(-dir.y, dir.x)*aQ.x*hwid;
        vQ = vec2(aQ.x, aQ.y);
        vA = vis*min(1., .022/hwid*2.6+.12)*(.55+.45*aR.y)*(1.-smoothstep(.75, 1., fall/cyc));
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPaper, uInk, uInkFar;
      varying vec2 vQ; varying float vA;
      ${FOG_FRAG}
      void main(){
        float f = eFog();
        float taper = pow(max(sin(3.14159*clamp(vQ.y, 0., 1.)), 0.), .6);
        float a = vA*(1.-smoothstep(taper*.9-.35, taper*.9+.05, abs(vQ.x)))*(1.-smoothstep(.4, 1., f));
        gl_FragColor = vec4(mix(uInk, uInkFar, min(1., smoothstep(0., .5, f)+.2)), a*.85);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, tris: n * 2 };
}

function buildSpouts(rng, count, U, extra) {
  const aU = [], aArc = [], idx = [], pos = [], seg = 18;
  for (let i = 0; i < count; i++) {
    const blow = i % 2, az = rng.range(0, 6.283), spread = 0.12 + 0.88 * Math.pow(rng(), 0.7), seed = rng();
    const base = pos.length / 3;
    for (let k = 0; k <= seg; k++) for (const e of [-1, 1]) { pos.push(k / seg, e, 0); aArc.push(blow, az, spread, seed); }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aArc', new THREE.Float32BufferAttribute(aArc, 4));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 400);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      uniform vec3 uBlow[2]; uniform float uSpout, uTime, uResY;
      attribute vec4 aArc;
      varying vec3 vQ; varying float vSeed;
      #include <fog_pars_vertex>
      vec3 arcPos(float u, vec3 o, float Hs){
        float q = 1.7*u-1.;
        float r = aArc.z*(Hs*.46*pow(max(u, 0.), 1.9)+4.4*pow(max(u, 0.), .5));     // a palm: wide at the wrist, curling out
        return o+vec3(cos(aArc.y)*r, Hs*(1.-q*q), sin(aArc.y)*r);
      }
      void main(){
        vec3 o = aArc.x < .5 ? uBlow[0] : uBlow[1];
        float pulse = .86+.14*sin(uTime*.9+aArc.w*2.);
        float Hs = 50.*uSpout*pulse*(.6+.4*aArc.w);
        float u = position.x;
        vec4 p0 = modelViewMatrix*vec4(arcPos(u, o, Hs), 1.), p1 = modelViewMatrix*vec4(arcPos(u+.03, o, Hs), 1.);
        vec2 dir = p1.xy-p0.xy; dir = dir/max(length(dir), 1e-4);
        vec4 mvPosition = p0;
        float depth = max(-p0.z, .1);
        float pxw = depth*2./(projectionMatrix[1][1]*uResY);
        float hw = min(max(.045+.06*u, .72*pxw), 3.*pxw);
        mvPosition.xy += vec2(-dir.y, dir.x)*position.y*hw;
        // far off, every other arc is left out so paper shows between the strokes
        float keep = step(fract(aArc.y*3.7+aArc.w*5.3), mix(1., .42, smoothstep(40., 150., depth)));
        vQ = vec3(u, position.y, min(1., (.045+.06*u)/hw*2.4+.15)*step(.02, uSpout)*keep);
        vSeed = aArc.w;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPaper, uInk, uInkFar; uniform float uTime;
      varying vec3 vQ; varying float vSeed;
      ${FOG_FRAG}
      void main(){
        float f = eFog(), u = vQ.x;
        float duty = mix(.5, .2, smoothstep(.5, 1., u));
        float d = fract(u*(7.+4.*vSeed)-uTime*(.55+.3*vSeed)+vSeed*7.);
        float on = step(d, duty), taper = pow(max(sin(3.14159*clamp(d/duty, 0., 1.)), 0.), .5)*on;
        float a = (1.-smoothstep(taper*.95-.4, taper*.95+.05, abs(vQ.y)))*on;
        float u0 = max(0., vSeed-.25)*.5;                 // three arcs in four begin higher up, so the wrist of the palm stays open
        a *= vQ.z*smoothstep(u0, u0+.08, u)*(1.-smoothstep(.9, 1., u))*(1.-smoothstep(.4, 1., f));
        gl_FragColor = vec4(mix(uInk, uInkFar, min(1., smoothstep(0., .5, f)+.3)), a*.8);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, tris: count * seg * 2 };
}

// Waterlines and curl ticks round every leg: one disc per leg, drawn as ink over whatever sea is there.
const MAXLEGS = 12;
function buildLegRings(U, extra, seaGLSL) {
  const pos = [], idx = [], nr = 6, na = 26;
  for (let l = 0; l < MAXLEGS; l++) {
    const base = pos.length / 3;
    for (let i = 0; i <= nr; i++) for (let j = 0; j <= na; j++) pos.push(i / nr, (j / na) * Math.PI * 2, l);
    for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = base + i * (na + 1) + j; idx.push(a, a + na + 1, a + na + 2, a, a + na + 2, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 500);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      uniform vec4 uLeg[${MAXLEGS}];
      ${seaGLSL}
      varying vec3 vR; varying float vStr;
      #include <fog_pars_vertex>
      void main(){
        vec4 leg = uLeg[int(position.z+.5)];
        float d = position.x*22.;
        vec2 dir = vec2(cos(position.y), sin(position.y));
        vec3 lp = vec3(leg.x+dir.x*(leg.z*.82+d), 0., leg.y+dir.y*(leg.z*.82+d));
        vec4 wp = modelMatrix*vec4(lp, 1.);
        wp.y += heroSea(wp.xz)+.14;
        vR = vec3(d, position.y, leg.z); vStr = leg.w;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      varying vec3 vR; varying float vStr;
      void main(){
        float d = vR.x, th = vR.y, r = vR.z+d;
        float ph = d/2.6-uTime*.33;
        float wph = fwidth(d)/2.6+1e-4;
        float arc = th*r;
        // eight waterlines: they travel outward, break into strokes and thin to nothing
        float life = clamp(1.-d/21., 0., 1.);
        float brk = smoothstep(.75-life*.85, 1.05-life*.85, eN1(arc*.16+floor(ph+.5)*7.3));
        float hw = wph*(.9+1.7*life*life)*brk;
        float lines = (1.-smoothstep(hw-wph*.7, hw+wph*.7, abs(fract(ph+.5)-.5)))*step(1e-5, hw)*(.45+.55*life);
        lines *= 1.-smoothstep(.22, .45, wph);
        // collar of curl ticks hugging the leg
        float n = floor(6.283*r/1.9)+1.;
        float cell = th/6.283*n; vec2 q = vec2((fract(cell+uTime*.05)-.5)*1.9, d-1.5+.5*sin(floor(cell)*2.4+uTime*1.1));
        float wq = fwidth(d)+1e-4;
        float curl = 1.-smoothstep(.09, .09+wq*1.4, abs(length(q)-.55));
        curl *= smoothstep(-.35, -.05, q.x+q.y*.4)*step(d, 3.2)*(1.-smoothstep(.2, .5, wq));
        float dark = (1.-smoothstep(0., 1.4, d))*.4;                      // contact darkening at the skin
        float a = max(max(lines, curl), dark)*vStr*(1.-smoothstep(.45, 1., eFog()));
        vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, eFog()));
        gl_FragColor = vec4(mix(ink, uWashA*.6, dark*(1.-max(lines, curl))), a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, tris: MAXLEGS * nr * na * 2 };
}

// The bulge: 60 m of sea standing 10 m, drawn as bunching contour lines.
function buildBulge(U, extra, seaGLSL) {
  const g = new THREE.RingGeometry(0.01, 48, 56, 14);
  g.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      uniform float uBulge, uTime;
      ${seaGLSL}
      varying vec3 vWP; varying vec3 vB;
      #include <fog_pars_vertex>
      void main(){
        float rho = length(position.xz);
        float c = .5+.5*cos(3.14159*min(rho/31., 1.));
        float wob = 1.+.06*sin(uTime*2.3+rho*.3);
        float h = 10.*uBulge*c*wob;
        float slope = -10.*uBulge*.5*3.14159/31.*sin(3.14159*min(rho/31., 1.));
        vec4 wp = modelMatrix*vec4(position.x, h+.1, position.z, 1.);
        wp.y += heroSea(wp.xz);
        vWP = wp.xyz; vB = vec3(rho, h, slope);
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      uniform float uBulge;
      varying vec3 vWP; varying vec3 vB;
      void main(){
        float rho = vB.x;
        float v = vB.y*1.15+rho*.22-uTime*.25*uBulge;                    // contours: bunch on the flanks
        float w = fwidth(v);
        vec2 rd = normalize(vWP.xz+vec2(1e-4));
        vec3 N = normalize(vec3(-rd.x*vB.z, 1., -rd.y*vB.z));
        float tone = clamp(.3+smoothstep(.8, -.4, dot(N, uKey))*.6+.22*smoothstep(8., 31., rho)*uBulge, 0., 1.);
        vec3 Vd = normalize(cameraPosition-vWP);
        float rimk = smoothstep(.2, .02, abs(dot(N, Vd)))*smoothstep(.05, .3, uBulge);
        float cov = max(eInk(tone, vec2(v, atan(rd.y, rd.x)*max(rho, 2.)), w), rimk);
        float a = smoothstep(0., .12, uBulge)*(1.-smoothstep(36., 47., rho));
        vec3 col = eCompose(cov, uWashA, .22+.3*tone, eFog(), eFogCol(), eGrain(vWP-cameraPosition));
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return { mesh, tris: 56 * 14 * 2 };
}

// Viewer stage only (opts.stage): a vellum dome ruled like an engraved sky and a flat engraved sea
// with the serpent's shadow, so the piece can be judged alone. Both are small examples of the style.
const NCAP = 17;
function buildStage(U, extra) {
  const group = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2500, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { ...U },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      varying vec3 vD;
      void main(){
        vec3 d = normalize(vD);
        float el = asin(clamp(d.y, -1., 1.));
        float v = el*el*sign(el)*240.+el*40., w = fwidth(v);
        float tone = smoothstep(.07, 1.1, el)*.34;
        float cov = eLines(v, atan(d.z, d.x+1e-5)*200., w, tone)*.75;
        float fox = smoothstep(.72, .8, eN3(d*13.))*.1;
        vec3 col = eCompose(cov, uAged, .1+fox+.25*smoothstep(.4, -.1, el), .0, uPaper, eGrain(d));
        gl_FragColor = vec4(col, 1.);
      }` }));
  dome.renderOrder = -0.5; dome.frustumCulled = false; group.add(dome);
  const sea = new THREE.Mesh(new THREE.CircleGeometry(1600, 72).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra },
    vertexShader: /* glsl */`
      varying vec3 vWP;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWP = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      uniform vec4 uCaps[${NCAP}];
      varying vec3 vWP;
      float capShadow(vec3 p, vec3 L, vec3 a, vec3 b, float r){
        vec3 ab = b-a, ao = p-a; float abL = dot(ab, L);
        float A = dot(ab, ab)-abL*abL;
        float t = clamp((dot(ao, ab)-dot(ao, L)*abL)/max(A, 1e-3), 0., 1.);
        vec3 c = a+ab*t-p; float s = dot(c, L);
        vec3 d = c-L*max(s, 0.);
        return (1.-smoothstep(r*.75, r*1.5, length(d)))*step(0., s);
      }
      void main(){
        vec2 p = vWP.xz;
        float sw = dot(p, vec2(.342, .94));
        float ph = sw/90.*6.2832+uTime*.5;
        float h = sin(ph)+.4*sin(dot(p, vec2(-.6, .8))/37.*6.2832+uTime*.9);
        float v = sw+4.*sin(dot(p, vec2(.9, -.3))*.045+uTime*.25)+1.5*eN2(p*.03)+uTime*3.;
        float w = fwidth(v);
        float sh = 0.;
        for(int i = 0; i < ${NCAP - 1}; i++) sh = max(sh, capShadow(vWP, uKey, uCaps[i].xyz, uCaps[i+1].xyz, .5*(uCaps[i].w+uCaps[i+1].w)));
        float tone = clamp(.13+.09*h+.4*sh, 0., 1.);
        float cov = eInk(tone, vec2(v, dot(p, vec2(.94, -.342))), w);
        vec3 col = eCompose(cov, uWashA, .14+.3*tone+.2*sh, eFog(), eFogCol(), eGrain(vWP-cameraPosition));
        gl_FragColor = vec4(col, 1.);
      }` }));
  sea.frustumCulled = false; group.add(sea);
  return { group, dome, sea };
}

export async function buildHero(ctx, opts = {}) {
  const THREE_ = THREE;
  const rng = ctx.rng.fork ? ctx.rng.fork('serpent') : ctx.rng;
  const noise = ctx.noise || ctx.core.makeNoise(ctx.seed || 1);
  const detail = ctx.quality?.detail ?? 1;
  const stage = opts.stage ?? (Object.keys(opts).length === 0);
  const pal = opts.palette || PALETTE;
  const U = engraveUniforms(pal, opts.keyDir);
  const variant = opts.head || rng.pick(['tusked', 'tusked', 'ram', 'maned']);
  const nSpouts = opts.spouts || (rng.chance(0.65) ? 2 : 1);
  const finSel = (opts.finWash || (rng.chance(0.78) ? 'rose' : 'verdigris')) === 'rose' ? 0 : 1;
  const seedOff = rng.range(0, 100);
  const seaGLSL = opts.seaGLSL || 'float heroSea(vec2 p){ return 0.; }';

  const sp = buildRestSpine(rng);
  const L = sp.L;
  const data = new Uint16Array(NS * 4 * 4);
  const tex = new THREE_.DataTexture(data, NS, 4, THREE_.RGBAFormat, THREE_.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE_.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const legU = []; for (let i = 0; i < MAXLEGS; i++) legU.push(new THREE_.Vector4(0, 0, 4, 0));
  const capU = []; for (let i = 0; i < NCAP; i++) capU.push(new THREE_.Vector4(0, -50, 0, 4));
  const extra = {
    uSpine: { value: tex }, uSpN: { value: NS }, uSpLen: { value: L }, uJaw: { value: 0.12 }, uLift: { value: 0.24 }, uResY: { value: 900 },
    uLook: { value: new THREE_.Vector3(0, 0, 1) }, uFinSel: { value: finSel }, uWet: { value: 1 }, uRain: { value: 1 }, uGust: { value: new THREE_.Vector2(0.1, 0.05) },
    uBlow: { value: [new THREE_.Vector3(), new THREE_.Vector3()] }, uSpout: { value: 1 }, uLeg: { value: legU }, uBulge: { value: 0 }, uCaps: { value: capU },
    ...(opts.seaUniforms || {}),
  };
  const mats = serpentMaterials(U, extra);
  const object = new THREE_.Group(); object.name = 'chart-makers-serpent';
  const stats = {};

  // ---- geometry (outlined set, plain set, wash hull)
  const po = makePen(), pi = makePen(), pw = makePen();
  const Y = async () => { await ctx.yield?.(); };          // hand a frame back between every builder (order of rng draws unchanged)
  await Y();
  await addTube(po, sp, 1.95, 26, noise, seedOff, Y); stats.tube = po.tris();
  await Y();
  await addTube(pw, sp, 4.2, 12, noise, seedOff, Y);
  await Y();
  await addBellyPlates(po, sp, Y);
  await Y();
  await addScutes(pi, sp, rng.fork ? rng.fork('scutes') : rng, Y); stats.scutes = pi.tris();
  await Y();
  await addDorsalFin(po, pi, sp, noise, seedOff, Y);
  await Y();
  await addBarnacles(pi, sp, rng, Math.round(380 * (0.5 + 0.5 * detail)), Y);
  await Y();
  await addWrack(pi, sp, rng, Math.round(150 * detail), Y);
  await Y();
  const head = await addHead(po, pi, sp, rng, variant, Y);
  await Y();
  await addFinsAndCrest(po, pi, sp, rng, variant, Y);
  await Y();
  const gOut = po.build();
  await Y();
  const gIn = pi.build();
  await Y();
  const gWash = pw.build();
  await Y();
  const add = (g, m, order) => { const me = new THREE_.Mesh(g, m); me.frustumCulled = false; me.renderOrder = order; object.add(me); return me; };
  add(gOut, mats.main, 0); add(gIn, mats.main, 0); add(gOut, mats.hull, 0); add(gWash, mats.wash, 2);
  const rain = buildRain(sp, rng, Math.round(1700 * detail), U, extra); object.add(rain.mesh);
  await Y();
  const spouts = buildSpouts(rng, Math.round(84 * (0.6 + 0.4 * detail)), U, extra); object.add(spouts.mesh);
  await Y();
  let rings = null, bulge = null, stg = null;
  if (opts.waterlines !== false) { rings = buildLegRings(U, extra, seaGLSL); object.add(rings.mesh); }
  if (opts.bulge !== false) { bulge = buildBulge(U, extra, seaGLSL); object.add(bulge.mesh); }
  if (stage) { stg = buildStage(U, extra); object.add(stg.group); }
  stats.triangles = po.tris() * 2 + pi.tris() + pw.tris() + rain.tris + spouts.tris + (rings ? rings.tris : 0) + (bulge ? bulge.tris : 0);
  stats.outlined = po.tris(); stats.plain = pi.tris(); stats.drawCalls = 6 + (rings ? 1 : 0) + (bulge ? 1 : 0) + (stage ? 2 : 0);
  await ctx.yield?.();

  // ---- the pose: rest spine -> rise, breath, head, pacing -> texture
  const px = new Float32Array(NS), py = new Float32Array(NS), pz = new Float32Array(NS), pex = new Float32Array(NS), pez = new Float32Array(NS);
  const toHalf = THREE_.DataUtils.toHalfFloat;
  const st = { progress: 1, headK: null, headAuto: 0, yaw: 0, first: true, pacing: 0, travel: 0, sound: 0,
    pOrigin: new THREE_.Vector3(67.8, 0, -83.3), pDir: new THREE_.Vector3(0.643, 0, -0.766), bulge: 0, headRise: 1, surge: 0, lean: 0 };
  const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(sstep(0, 0.85, x), 0.8) + 0.045 * Math.sin(Math.PI * sstep(0.55, 1, x)));
  const rise = [1, 1, 1, 1, 1];
  let iPivot = NS - 2; for (let i = NS - 1; i >= 0; i--) if (sp.g[i] <= 16) iPivot = i;
  const headPos = new THREE_.Vector3(), camL = new THREE_.Vector3(), tmp = new THREE_.Vector3(), tmp2 = new THREE_.Vector2();
  const eB = new THREE_.Vector3(), eN = new THREE_.Vector3(), eT = new THREE_.Vector3(), eP = new THREE_.Vector3();
  const capsules = new Float32Array(NCAP * 4), legs = [], legPool = [];
  for (let i = 0; i < MAXLEGS; i++) legPool.push({ x: 0, z: 0, r: 0 });
  const bulgeH = (x, z) => { const rho = Math.hypot(x, z); return 10 * st.bulge * (0.5 + 0.5 * Math.cos(Math.PI * Math.min(rho / 31, 1))); };

  function pose(time) {
    const p = st.progress;
    rise[2] = spring((p - 0.17) / 0.5); rise[1] = spring((p - 0.42) / 0.45); rise[3] = spring((p - 0.58) / 0.4);
    rise[0] = spring((p - 0.6) / 0.4); rise[4] = spring((p - 0.75) / 0.25);
    st.headRise = rise[4];
    st.bulge = sstep(0, 0.2, p) * (1 - sstep(0.3, 0.62, p));
    const hk = st.headK ?? st.headAuto, k = st.pacing, yaw = st.yaw * (1 - k);
    const pvx = sp.x[iPivot], pvz = sp.z[iPivot], dir = st.pDir, dl = Math.hypot(dir.x, dir.z) || 1, dx = dir.x / dl, dz = dir.z / dl;
    for (let i = 0; i < NS; i++) {
      const s = (i / (NS - 1)) * L, r5 = i * 5;
      let x = sp.x[i], y = sp.y[i], z = sp.z[i], ex = sp.ex[i], ez = sp.ez[i];
      const up = sstep(3, 30, y);
      let r = 0, br = 0;
      for (let c = 0; c < 5; c++) { const w = sp.reg[r5 + c]; r += w * rise[c]; br += w * Math.sin(time * 0.55 + c * 2.1); }
      y += 1.5 * br * up;
      const g = sp.g[i];
      if (g < 46) y -= hk * 6.9 * sstep(44, 14, g) - 0.7 * Math.sin(time * 0.7) * sstep(40, 14, g);
      const sway = 0.9 * Math.sin(time * 0.4 + s * 0.021) * up;
      x += -ez * sway; z += ex * sway;
      y = -13 + (y + 13) * r;
      if (st.surge !== 0 || st.lean !== 0) z -= sp.reg[r5 + 2] * (st.surge + st.lean * Math.min(1.1, Math.max(0, y) / 40.5));   // the middle arch travels and leans
      if (g < 16) {
        const a = yaw * sstep(16, 3, g), ca = Math.cos(a), sa = Math.sin(a), qx = x - pvx, qz = z - pvz;
        x = pvx + qx * ca + qz * sa; z = pvz - qx * sa + qz * ca;
        const e0 = ex; ex = e0 * ca + ez * sa; ez = -e0 * sa + ez * ca;
      }
      if (k > 0) {
        const sig = L - s, X = st.travel - sig / 1.6, env = sstep(14, 52, sig) * (1 - sstep(215, 300, sig));
        let yp = 2.5 + env * 15.5 * Math.cos((6.2832 * (X - 0.55 * st.travel)) / 50) - 11.5 * sstep(240, 330, sig) + 1.2 * (1 - sstep(0, 40, sig));
        const d0 = (sig / L) * 0.6, sink = sstep(d0, d0 + 0.4, st.sound);
        yp += -44 * sink + 26 * sstep(0.5, 0.75, st.sound) * (1 - sstep(0.8, 1, st.sound)) * sstep(L - 45, L, sig);
        const xp = st.pOrigin.x + dx * X, zp = st.pOrigin.z + dz * X;
        x += (xp - x) * k; y += (yp - y) * k; z += (zp - z) * k; ex += (dx - ex) * k; ez += (dz - ez) * k;
        const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
      }
      px[i] = x; py[i] = y; pz[i] = z; pex[i] = ex; pez[i] = ez;
    }
    legs.length = 0;
    for (let i = 0; i < NS; i++) {
      const a = Math.max(0, i - 1), b = Math.min(NS - 1, i + 1);
      let tx = px[b] - px[a], ty = py[b] - py[a], tz = pz[b] - pz[a]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const bx = pez[i], bz = -pex[i];                    // B = N x T, level; N = T x B
      let nx = ty * bz, ny = tz * bx - tx * bz, nz = -ty * bx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const s = (i / (NS - 1)) * L, girth = 1 + 0.065 * Math.sin(s * 0.075 - time * 0.9) * sstep(0, 60, s) * sstep(0, 30, L - s);
      const o = i * 4, hx = Math.floor(px[i]), hy = Math.floor(py[i]), hz = Math.floor(pz[i]);
      data[o] = toHalf(hx); data[o + 1] = toHalf(hy); data[o + 2] = toHalf(hz); data[o + 3] = toHalf(girth);
      const o1 = o + NS * 4; data[o1] = toHalf(px[i] - hx); data[o1 + 1] = toHalf(py[i] - hy); data[o1 + 2] = toHalf(pz[i] - hz); data[o1 + 3] = 0;
      const o2 = o + NS * 8; data[o2] = toHalf(nx); data[o2 + 1] = toHalf(ny); data[o2 + 2] = toHalf(nz); data[o2 + 3] = 0;
      const o3 = o + NS * 12; data[o3] = toHalf(tx); data[o3 + 1] = toHalf(ty); data[o3 + 2] = toHalf(tz); data[o3 + 3] = 0;
      if (i === NS - 1) { eT.set(tx, ty, tz); eN.set(nx, ny, nz); eB.crossVectors(eN, eT); eP.set(px[i], py[i], pz[i]); }
      if (i > 0 && legs.length < MAXLEGS && (py[i - 1] > 0) !== (py[i] > 0)) {
        const f = py[i - 1] / (py[i - 1] - py[i]), R = sp.R[i] * girth, steep = Math.min(1.7, 1 / Math.max(0.45, Math.abs(ty)));
        if (R > 0.9) { const l = legPool[legs.length]; l.x = px[i - 1] + (px[i] - px[i - 1]) * f; l.z = pz[i - 1] + (pz[i] - pz[i - 1]) * f; l.r = R * steep; legs.push(l); }
      }
    }
    tex.needsUpdate = true;
    for (let i = 0; i < MAXLEGS; i++) { const l = legs[i]; if (l) legU[i].set(l.x, l.z, l.r, 1); else legU[i].w = 0; }
    for (let c = 0; c < NCAP; c++) {
      const i = Math.round((c / (NCAP - 1)) * (NS - 1));
      capsules[c * 4] = px[i]; capsules[c * 4 + 1] = py[i]; capsules[c * 4 + 2] = pz[i]; capsules[c * 4 + 3] = sp.R[i];
      capU[c].set(px[i], py[i], pz[i], sp.R[i]);
    }
    headPos.copy(eP).addScaledVector(eT, 6).addScaledVector(eN, 1.2);
    const bl = extra.uBlow.value;
    for (let c = 0; c < 2; c++) { const q = nSpouts === 2 ? head.blow[c] : [0, head.blow[0][1] + 0.3, 10.8]; bl[c].copy(eP).addScaledVector(eB, q[0]).addScaledVector(eN, q[1]).addScaledVector(eT, q[2]); }
    extra.uBulge.value = st.bulge;
  }
  pose(0);

  // ---- anchors: the brief's course in local space (entry at z = +252, sailing toward -Z)
  const SIN40 = 0.6428, COS40 = 0.766;
  const course = (d) => {
    const y = d < 440 ? 9.5 : d < 526 ? 9.5 + 12.5 * sstep(440, 526, d) : 22 - (d - 526) * 0.2588;
    if (d <= 300) return new THREE_.Vector3(0, y, 252 - d);
    if (d <= 376.8) { const a = (d - 300) / 110; return new THREE_.Vector3(110 - 110 * Math.cos(a), y, -48 - 110 * Math.sin(a)); }
    return new THREE_.Vector3(25.73 + SIN40 * (d - 376.8), y, -118.7 - COS40 * (d - 376.8));
  };
  const anchors = {
    crowns: [new THREE_.Vector3(-55.1, sp.crownH[0] + 4.6, 31.8), new THREE_.Vector3(0, 45.1, 0), new THREE_.Vector3(55.1, sp.crownH[2] + 4.6, -31.8)],
    underCrown: new THREE_.Vector3(0, 9.5, 0),
    flyThrough: [0, 60, 120, 180, 220, 252, 284, 300, 320, 340, 360, 376.8, 410, 440, 480, 526, 560, 588].map(course),
    course,
    portalSeat: { position: course(588), normal: new THREE_.Vector3(-SIN40, 0.26, COS40).normalize(), radius: 7 },
    head: headPos.clone(), headPass: course(330),
    bulge: new THREE_.Vector3(0, 0, 0), rainFoot: new THREE_.Vector3(0, 0, 0),
    pacingOrigin: st.pOrigin.clone(), pacingDir: st.pDir.clone(),
    viewpoints: { entry: course(0), rise: course(112), underArch: course(252), headPass: course(330), exitLook: course(378) },
  };

  const hero = {
    object, radius: 120, extent: 175, height: 68, center: new THREE_.Vector3(0, 22, 0),
    anchors, ground: false, groundY: 0, stats, variant, capsules, legs,
    style: { uniforms: U, pal, material: (o = {}) => styleMaterial({ uniforms: U, ...o }), outline: (o = {}) => styleOutline({ uniforms: U, resY: extra.uResY, ...o }), glsl: ENGRAVE_GLSL },
    spineLength: L, spout: null, rain: 1,
    progressFromU: (u) => Math.min(1, Math.max(0, (u * 42 - 7) / 6)),
    setProgress(p) { st.progress = Math.min(1, Math.max(0, p)); },
    setHead(k) { st.headK = k; },
    setSurge(shift = 0, lean = 0) { st.surge = shift; st.lean = lean; },
    setPacing(k, travel = 0, sound = 0, origin, dir) { st.pacing = Math.min(1, Math.max(0, k)); st.travel = travel; st.sound = Math.min(1, Math.max(0, sound)); if (origin) st.pOrigin.copy(origin); if (dir) st.pDir.copy(dir).normalize(); },
    heightOfBulge: bulgeH,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (ctx.renderer) extra.uResY.value = ctx.renderer.getDrawingBufferSize(tmp2).y;
      object.updateMatrixWorld();
      camL.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camL);   // matrixWorld: the camera behind a portal is placed by matrix
      // the head watches the camera: yaw of the last 27 m of neck, the irises, and it lowers as we close
      const dist = camL.distanceTo(headPos);
      st.headAuto = sstep(120, 35, dist);
      const want = Math.atan2(camL.x - sp.x[iPivot], camL.z - sp.z[iPivot]) - Math.atan2(sp.ex[NS - 1], sp.ez[NS - 1]);
      const wa = Math.atan2(Math.sin(want), Math.cos(want));          // it turns to watch, but keeps a three-quarter face to us
      const wy = Math.max(-0.32, Math.min(0.32, (wa - 0.45 * Math.tanh(wa * 4)) * 0.6)) * sstep(300, 140, dist);
      st.yaw = st.first ? wy : st.yaw + (wy - st.yaw) * (1 - Math.exp(-Math.min(dt, 0.1) * 1.6));
      st.first = false;
      pose(time);
      tmp.copy(camL).sub(headPos).normalize();
      extra.uLook.value.set(tmp.dot(eB), tmp.dot(eN), tmp.dot(eT));
      extra.uJaw.value = 0.08 + 0.05 * Math.sin(time * 0.8) + 0.13 * sstep(110, 35, dist) * (0.75 + 0.25 * Math.sin(time * 2.1));
      extra.uSpout.value = (hero.spout ?? 1) * sstep(0.5, 1, st.headRise) * (1 - 0.9 * st.sound) * (eP.y > 2 ? 1 : 0);
      extra.uRain.value = hero.rain;
      extra.uLift.value = 0.22 + 0.06 * Math.sin(time * 0.6);
      if (stg) {
        tmp.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(tmp); stg.dome.position.copy(tmp);
        const sc = object.parent; if (sc && sc.fog && sc.fog.color) sc.fog.color.copy(U.uPaper.value).multiplyScalar(0.94);
      }
    },
    dispose() { tex.dispose(); },
  };
  return hero;
}
