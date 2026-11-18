// THE GOLDEN CITY: its own dress. ONE shader for everything the city is built of; each face says which stuff it is (aA.y):
// 0 a pale gold wall with rows of tall openings, some lit   1 polished gold   2 fluted gold with fine seams of warm light
// 3 a dark stone retaining wall: ribs, courses, an arcade lit from within under its brow   4 paving   5 light from within
// 6 golden stone in courses   7 a colonnade before a lit hall   8 a gate tower's shaft: fine flutes, slits of light, belts of lit ports   9 a plain banner of crimson cloth
// Each face also carries where it is on its wall: aA.x along it (0 to 1), aA.z metres above its foot, aA.w the wall's height,
// aF the wall's breadth (to be scaled with the instance) and the breadth of one cell of its pattern; the vertex stage turns
// them into whole cells, so a pattern never ends on half an opening. EVERY fine pattern is filtered by the pixel's footprint
// (fwidth of the cell's own coordinates): it eases to its mean as it gets small, so nothing shimmers in flight.
// The gold is METAL by night: it holds the violet sky above, the city's lamps below and the brightest star cloud as a streak.
// ROUND THREE: the windows are drawn in three tiers by the pixel's footprint (windows, then soft lit bays, then the wall's mean
// glow), so the far city shows warm lights and never dots; the finer patterns ease out sooner; whatever stands in the sea is dark
// and wet over its lowest courses (no band at the waterline). Further down: the falls' water and the moonlit mountains.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import { LIGHT_GLSL } from './asgard-bridge-of-light-mat.js';

const VERT = /* glsl */`
attribute vec4 aA, aF; uniform float uTime;
varying vec3 vW, vN; varying vec4 vP; varying vec2 vK;
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal, sc = vec3(1.); float seed = 0.;
  #ifdef USE_INSTANCING
  sc = max(vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)), vec3(1e-3));
  p = instanceMatrix*p; n = mat3(instanceMatrix)*(n/(sc*sc));
  seed = fract(dot(instanceMatrix[3].xz, vec2(.3713, .7291)));
  #endif
  if(aA.y > 8.5){ float g = 1. - clamp(aA.z/max(aA.w, 1.), 0., 1.); p.xyz += n*sin(uTime*.8 + aA.z*.22 + position.x*.13)*.45*g*g; }      // a banner stirs, most at its free end
  vec4 w = modelMatrix*p; vW = w.xyz; vN = mat3(modelMatrix)*n;
  float wm = dot(aF.xyz, sc), cw = max(aF.w, .01), nc = max(1., floor(wm/cw + .5));
  vP = vec4(aA.x*nc, aA.z*sc.y, aA.w*sc.y, wm/nc); vK = vec2(aA.y, seed);
  gl_Position = projectionMatrix*viewMatrix*w;
}`;

const FRAG_HEAD = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec4 vP; varying vec2 vK; uniform vec2 uCity;
${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
${LIGHT_GLSL}
const vec3 C_WARM = vec3(1., .58, .22), C_GOLD = vec3(1., .62, .20), C_STONE = vec3(.33, .22, .095);
float cBox(float x, float a, float b, float f){ return smoothstep(a - f, a + f, x)*(1. - smoothstep(b - f, b + f, x)); }
// what polished gold holds: the violet sky overhead, a paler band at the horizon, the city's own warm light from below
vec3 cEnv(vec3 r){
  vec3 sky = mix(vec3(.20, .22, .46), vec3(.07, .08, .24), smoothstep(0., .7, r.y));
  return mix(vec3(.60, .36, .13), sky, smoothstep(-.25, .12, r.y));
}
`;
// the stuffs, one after another (k: which; cx, ci: place in a cell and the cell's number; h, H: metres up, the wall's height;
// fxc: cells to a pixel; fy: metres to a pixel; fm: metres along to a pixel)
const FRAG_KINDS = /* glsl */`
  if(k < .5){
    // a wall of pale gold stone: storeys of tall openings, lit or dark by the cell
    float row = h/5.5, rf = fract(row), ri = floor(row), body = step(abs(n.y), .5)*step(row, floor(H/5.5 - .35));
    // THREE TIERS by the pixel's footprint: the windows themselves; then, as they get small, soft lit BAYS of two by two (the lit
    // windows gather in bays, so the far city still shows warm lights and no dots); then the wall's mean glow
    float fmx = max(fxc, fy/5.5), keepW = 1. - smoothstep(.10, .32, fmx), keepB = 1. - smoothstep(.3, .9, fmx*.5);
    float win = cBox(cx, .36, .64, fxc + .01)*cBox(rf, .16, .84, fy/5.5 + .01)*body;
    float s1 = floor(seed*61.), s2 = floor(seed*37.), share = .36 + .32*hash11(seed*17. + 2.);
    vec2 bq = vec2(vP.x + s1, row + s2)*.5, bi = floor(bq), bfr = fract(bq);
    float hc = hash12(bi), lit = step(share, .65*hc + .35*hash12(vec2(ci + s1, ri + s2))), litB = clamp((.65*hc + .35 - share)/.35, 0., 1.);
    float blk = cBox(bfr.x, .08, .92, fxc*.5 + .02)*cBox(bfr.y, .08, .92, fy/11. + .02)*body;
    float dark = mix(.09*body, win*(1. - lit), keepW);
    alb = stoneT*(.78 + .3*hash11(seed*53. + 1.))*(1. - .55*dark);
    alb *= .86 + .14*mix(.5, cBox(rf, .06, .94, fy/5.5 + .01), keepW);                 // a string course at every storey
    float whN = hash11(ci*3.7 + ri*9.1 + seed*7.), whB = hash11(bi.x*3.7 + bi.y*9.1 + seed*7. + .5);
    vec3 eN = mix(vec3(1., .50, .16), vec3(1., .84, .56), hash11(whN*13.7 + 1.))*(.6 + 1.5*whN*whN)*win*lit;
    vec3 eB = mix(vec3(1., .50, .16), vec3(1., .84, .56), hash11(whB*13.7 + 1.))*(.55 + .9*whB)*.95*litB*blk;      // a lit bay glows more than the sum of its windows, as lights do from far off
    emit = mix(vec3(1., .66, .34)*.2*body, mix(eB, eN, keepW), keepB);
    foot = .7*exp(-max(h, 0.)/5.); gloss = .22; shade = .42 + .58*smoothstep(0., 24., h);      // shade lies low between the houses
  } else if(k < 1.5){
    alb = goldT; gloss = 1.; foot = .5*exp(-max(h, 0.)/14.); shade = seed > 0. ? .55 + .45*smoothstep(0., 30., h) : 1.;
  } else if(k < 2.5){
    // flutes round a tube: each cell one flute, its two edges bright ribs; every fourth edge a seam of warm light
    float keep = 1. - smoothstep(.08, .3, fxc), a = cx*6.2832;
    vec3 t = cross(vec3(0., 1., 0.), n); t *= inversesqrt(max(dot(t, t), 1e-4));
    n = normalize(n + t*sin(a)*.6*keep);
    alb = C_GOLD*(.80 + .20*cos(a)*keep);
    float q = fract(vP.x*.25 + .5), d = abs(q - .5)*4., wd = max(.13, 1.5*fxc);    // a ribbon never under a pixel and a half
    float seam = (1. - smoothstep(0., wd, d))*min(1., .13/wd*1.9);
    emit = C_WARM*seam*(.5 + .5*exp(-max(h, 0.)/160.))*3.0*(.74 + .26*sin(uTime*.5 + floor(vP.x*.25 + .5)*1.7));      // each seam breathes over 12.6 s, out of step with its neighbour
    gloss = 1.; foot = .7*exp(-max(h, 0.)/22.);
  } else if(k < 3.5){
    // the terrace's retaining wall: dark stone in courses, six ribs to a bay, three arches lit from within under the brow
    float keepR = 1. - smoothstep(.12, .45, fxc*6.), keepC = 1. - smoothstep(.12, .45, fy/3.2);
    float rc = fract(cx*6.), fr6 = fxc*6. + .01, rib = mix(.42, cBox(rc, .29, .71, fr6), keepR);
    float edge = (cBox(rc, .27, .34, fr6) - cBox(rc, .66, .73, fr6))*keepR;            // a rib stands proud: its near edge lit, its far edge in shade
    float joint = mix(.9, cBox(fract(h/3.2), .05, .95, fy/3.2 + .01), keepC);
    alb = vec3(.085, .074, .082)*(.74 + .40*rib + .42*edge)*(.86 + .14*joint);
    float q = (cx - .155)/.69*3., cwm = .23*vP.w, xm = (fract(q) - .5)*cwm, ys = H - 10.5, y0 = H - 19., ar = 2.35;
    float inq = step(0., q)*step(q, 3.);
    float dA = h > ys ? length(vec2(xm, h - ys)) - ar : max(abs(xm) - ar, y0 - h);
    float keepA = 1. - smoothstep(.5, 1.8, max(fm, fy));
    float band = cBox(h, y0, ys + ar, fy + .01);
    float arch = mix(.52*band, (1. - smoothstep(-.6*max(fm, fy) - .02, .6*max(fm, fy) + .02, dA)), keepA)*inq;
    arch = mix(arch, .36*band, (1. - keepA)*(1. - inq));
    emit = C_WARM*arch*(1.25 - .65*smoothstep(y0, ys + ar, h))*(.22 + .88*mix(.8, smoothstep(0., 1.1, -dA), keepA));      // dimmer at the reveal: the arch has depth
    alb = mix(alb, vec3(.03, .02, .01), arch);
    alb = mix(alb, C_STONE*1.15, cBox(dA, .05, .6, .6*max(fm, fy) + .02)*keepA*inq);      // a frame of golden stone round each arch
    float brow = cBox(h, H - 4.2, H + 2., fy + .01) + cBox(h, y0 - 2.6, y0 - 1.4, fy + .01);      // the brow and a string course under the arcade: bands of golden stone (no band at the foot: see the wet courses below)
    brow = min(brow, 1.); alb = mix(alb, C_STONE*(.8 + .2*rib), brow);
    foot = .3*exp(-max(h, 0.)/7.); gloss = .12 + .2*brow; shade = 1. - .6*exp(-max(H - 4.2 - h, 0.)/4.5)*step(h, H - 4.2);      // the brow's shade
  } else if(k < 4.5){
    // paving: pale slabs, their joints; pools of lamp light lie on it
    vec2 pf = fract(pv);
    float keep = 1. - smoothstep(.2, .7, max(fp.x, fp.y));
    float slab = mix(.88, cBox(pf.x, .04, .96, fp.x + .005)*cBox(pf.y, .04, .96, fp.y + .005), keep);
    alb = C_STONE*.72*(.6 + .4*slab)*(.9 + .2*mix(.5, hash12(floor(pv)), keep));
    foot = .25 + .75*smoothstep(.38, .8, vnoise(vW.xz*.05)); gloss = .25;
  } else if(k < 5.5){
    alb = vec3(0.); emit = C_WARM*(1.5 - 1.05*clamp(h/max(H, 1.), 0., 1.))*(.62 + .38*cos(cx*6.2832));
  } else if(k < 6.5){
    float keepC = 1. - smoothstep(.2, .7, fy/2.6);
    alb = C_STONE*(.62 + .38*mix(.9, cBox(fract(h/2.6), .07, .93, fy/2.6 + .01), keepC));
    foot = .8*exp(-max(h, 0.)/9.); gloss = .3;
  } else if(k < 7.5){
    // a colonnade: round columns at each cell's edges, the hall behind them lit
    float keep = 1. - smoothstep(.12, .45, fxc), body = step(abs(n.y), .5), zone = cBox(h, .8, H*.74, fy + .01)*body;
    float gap = cBox(cx, .19, .81, fxc + .01), open = mix(.62, gap, keep)*zone;
    alb = stoneT*(.95 + .25*mix(0., cos((cx - .5)*6.2832), keep)*zone)*(1. - .85*open); shade = .6 + .4*smoothstep(0., 12., h);
    emit = C_WARM*open*(.85 - .5*clamp(h/max(H*.74, 1.), 0., 1.));
    foot = .6*exp(-max(h, 0.)/8.); gloss = .22;
  } else if(k < 8.5){
    // a gate tower's shaft, seen from 17 m: fine flutes (real relief lies under them), a slit of warm light in every second
    // hollow, and every 17 m up a plain belt with a small lit port to each flute
    float keep = 1. - smoothstep(.18, .6, fxc), a = cx*6.2832, hb = fract(h/17.), fb = fy/17. + .004;
    vec3 t = cross(vec3(0., 1., 0.), n); t *= inversesqrt(max(dot(t, t), 1e-4));
    n = normalize(n + t*sin(a)*.35*keep);
    alb = C_GOLD*(.78 + .22*cos(a)*keep);
    float wd = max(.07, 1.5*fxc), slit = (1. - smoothstep(0., wd, abs(cx - .5)))*min(1., .07/wd*1.7)*step(.5, fract(ci*.5))*cBox(hb, .06, .70, fb);
    float belt = cBox(hb, .765, .965, fb), keepP = 1. - smoothstep(.25, .8, max(fxc, fb*7.));
    float port = mix(.22, cBox(cx, .27, .73, fxc + .01), keepP)*cBox(hb, .80, .93, fb);
    alb = mix(alb, C_GOLD*.42, belt*.8*(1. - port));
    emit = C_WARM*(slit*1.7*(.76 + .24*sin(uTime*.5 + ci*.9)) + port*(.75 + .5*hash11(ci*5.3 + floor(h/17.)*11.)));
    gloss = 1.; foot = .7*exp(-max(h, 0.)/22.);
  } else {
    // a plain banner of deep crimson cloth: soft folds run down it as it stirs
    float fold = sin(cx*15. + 1.3*sin(h*.3 - uTime*.9))*.5 + .5;      // upright pleats that sway as the cloth stirs
    alb = vec3(.20, .010, .024)*(.40 + .85*fold); emit = alb*.10; gloss = .05;
  }
`;
export const CITY_GLSL = { VERT, FRAG_HEAD, FRAG_KINDS };

const FRAG = /* glsl */`${FRAG_HEAD}
void main(){
  vec3 w = vW, n = vN*inversesqrt(max(dot(vN, vN), 1e-8)), cam = cameraPosition, alb = vec3(0.), emit = vec3(0.);
  float mk = 1.;
  #ifdef MIRROR
  mk = abMirror(w); w.y = -w.y; n.y = -n.y; cam.y = -cam.y;      // an image is lit as the thing itself is
  #endif
  float k = vK.x, seed = vK.y, cx = fract(vP.x), ci = floor(vP.x), h = vP.y, H = vP.z, gloss = 0., foot = 0., shade = 1.;
  float tone = seed > 0. ? hash11(seed*91.7 + 3.) : .5;      // three metals dealt to the houses: pale white-gold, full gold, deep bronze
  vec3 goldT = tone < .3 ? vec3(1., .80, .52) : (tone > .72 ? vec3(.60, .30, .10) : C_GOLD), stoneT = tone < .3 ? vec3(.50, .40, .24) : (tone > .72 ? vec3(.16, .095, .04) : C_STONE);
  vec2 fw = fwidth(vP.xy), pv = vW.xz/5., fp = fwidth(pv); float fxc = fw.x, fy = fw.y, fm = fw.x*vP.w;
  ${FRAG_KINDS}
  // THE FOOT IN THE WATER: whatever stands in the sea is dark and wet over its lowest courses (to an uneven mark 3 to 4.6 m up), no lamp lies on it there
  float wet = 1. - smoothstep(.3, 3. + 1.6*vnoise(w.xz*.15), w.y);
  alb *= 1. - .62*wet; foot *= 1. - wet; gloss = mix(gloss, max(gloss, .5), wet);
  vec3 ev = cam - w, v = ev*inversesqrt(max(dot(ev, ev), 1e-8)), r = reflect(-v, n);
  float nv = max(dot(n, v), 0.), fres = .5 + .5*pow(max(1. - nv, 1e-4), 3.), ks = max(dot(r, AB_KEY), 1e-4);
  float town = 1. - smoothstep(0., 1., length(w.xz - uCity)/700.);
  vec3 lamp = C_WARM*foot*.55*town;                                              // the lamps at a thing's foot
  vec3 col = alb*(abLight(w, n)*mix(.8, .22, gloss)*shade + lamp*(1. - .5*gloss));                         // metal keeps little of the light that falls on it as its own colour
  col += alb*gloss*(cEnv(r)*fres*1.2*(.45 + .55*shade) + vec3(1., .80, .50)*(1.3*pow(ks, 14.) + 5.*pow(ks, 120.)));
  col += emit;
  col = abFog(col, vW);
  #ifdef MIRROR
  gl_FragColor = vec4(col*.85, .62*mk);
  if(mk < .01) discard;
  #else
  gl_FragColor = vec4(col, 1.);
  #endif
}`;

// cityMat(shared): the city's one material, and (userData.image) the same for a thing's image in the sea
export function cityMat(shared, city) {
  const make = (mirror) => new THREE.ShaderMaterial({ name: 'abCity' + (mirror ? '-image' : ''), vertexShader: VERT, fragmentShader: FRAG,
    defines: mirror ? { MIRROR: 1 } : {}, transparent: mirror, uniforms: { ...shared, uCity: { value: new THREE.Vector2(city.x, city.z) } } });
  const m = make(false); m.userData.image = make(true); return m;
}
// THE CITY'S FALLS (round three): each a real fall. aA = (metres across, which, metres fallen or a speed, the fall's height);
// uv.x across, uv.y 1 at the lip. which: 0 THE FALLING WATER: white soft-edged streaks, a shut white body at the lip that opens
// into separate streamers lower down, ragged at its sides; the streaks draw out as the water speeds up. 1 THE STANDING MIST at
// its foot: densest on the water, billowing slowly. 2 a sheet of water in a basin or a rill (running at aA.z metres a second).
// 3 THE APRON of white foam on the sea before it (aA.z metres out). All of it goes by the clock; every streak is filtered by the
// pixel's footprint and eases to the fall's own mean shape (whiter at the top, thinner below, soft at the sides), never to a strip
export function veilMat(shared, mirror = false) {
  return new THREE.ShaderMaterial({ name: 'abCityVeil' + (mirror ? '-image' : ''), defines: mirror ? { MIRROR: 1 } : {}, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...shared },
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`attribute vec4 aA; varying vec3 vW; varying vec4 vA; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vA = aA; vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vW; varying vec4 vA; varying vec2 vUv;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
      ${LIGHT_GLSL}
      void main(){
        float tm = vA.x, fall = max(vA.z, 0.), f = clamp(fall/max(vA.w, 1.), 0., 1.), x = vUv.x*2. - 1., bell = max(1. - x*x, 0.);
        float g = fall/(1. + fall*.012);      // the water speeds up as it falls: its streaks draw out
        float ft = fwidth(tm), fg = fwidth(g), fq = fwidth(vW.x) + fwidth(vW.z), a = 0., glow = 1.;
        float keepC = 1. - smoothstep(.25, .8, max(ft*.42, fg*.09)), keepT = 1. - smoothstep(.25, .8, max(ft*1.25, fg*.2)), keepH = 1. - smoothstep(.25, .8, max(ft*5.5, fg*.6));
        vec3 w = vW, tint = vec3(.78, .85, 1.); float mk = 1.;
        #ifdef MIRROR
        mk = abMirror(w); w.y = -w.y;
        #endif
        if(vA.y < .5){
          float cords = mix(.5, vnoise(vec2(tm*.42, g*.09 - uTime*.8)), keepC), fine = mix(.5, vnoise(vec2(tm*1.25 + 11., g*.2 - uTime*1.8)), keepT);
          float hair = mix(.5, vnoise(vec2(tm*5.5 + 3., g*.6 - uTime*4.5)), keepH), e = 1. - bell;      // cords 2.4 m across, threads 0.8 m, hairs 0.2 m
          float n = clamp((.55*cords + .30*fine + .15*hair - .5)*2.1 + .5, 0., 1.);
          float thr = mix(.04, .64, smoothstep(0., .8, f)) + .5*e*e, soft = .08 + .16*f;      // shut at the lip; lower down only the stronger streamers hold, with dark gaps, and their edges soften
          float aN = max(smoothstep(thr - soft, thr + soft, n), .24*bell*smoothstep(.2, 1., f)*(.35 + .65*fine));      // between the streamers the water breaks into spray
          float aM = (1. - .55*f)*bell;      // their mean, where the streaks are too fine to draw
          a = mix(aM, aN, keepC)*smoothstep(0., .16, bell)*(1. - .4*smoothstep(.85, 1., f));
          a = max(a, (1. - smoothstep(0., 1.8, fall))*smoothstep(0., .1, bell));      // at the lip the water rolls over, white and shut
          glow = (.16 + .56*fine + .26*hair + .30*cords)*(1. - .2*f) + .25*(1. - smoothstep(0., 2.5, fall));
          tint = mix(vec3(.46, .58, .92), vec3(1.), smoothstep(.4, 1., glow));      // white cords, blue-grey water between them
        } else if(vA.y < 1.5){
          float up = clamp(vUv.y, 0., 1.), bil = vnoise(vec3(tm*.09, up*2.4 - uTime*.14, uTime*.06));
          float low = clamp(1. - up/(.5 + .5*vnoise(vec2(tm*.11 + 7., uTime*.05))), 0., 1.);      // its top lumpy, never a level edge
          a = bell*low*(.25 + .75*low)*(.42 + .55*bil); glow = .58 + .4*bil;
        } else if(vA.y < 2.5){
          // a sheet of water in a basin or a rill: ripples running along it at vA.z metres a second
          vec2 q = vec2(vW.x, vW.z + uTime*vA.z); float kq = 1. - smoothstep(.3, 1.2, fq);
          float rp = mix(.25, smoothstep(.52, .8, .6*vnoise(q*vec2(1.1, .55)) + .4*vnoise(q*vec2(2.6, 1.3) + 7.)), kq);
          a = .8; glow = .14 + 1.5*rp; tint = vec3(.60, .64, .78);      // dark water in its channel, bright ripples running on it
        } else {
          float o1 = clamp(vUv.y, 0., 1.), kq = 1. - smoothstep(.4, 1.6, fq), fo = mix(.5, vnoise(vec2(tm*.45, vA.z*.45 - uTime*.55)), kq);
          a = bell*bell*(1. - o1)*(1. - o1)*(.30 + .70*smoothstep(.3, .7, fo)); glow = .5 + .5*fo;      // foam drifting out from the foot
        }
        vec3 col = abFog(tint*.86*glow, vW); a *= mk;
        gl_FragColor = vec4(col*a, a);
      }` });
}
// THE MOUNTAINS BEHIND THE CITY: night-dark rock, snow on the upper and gentler slopes; MOONLIT (round three): the snow is pale
// blue-white on the slopes that face the great pale moon (typed from the design's words: 16 degrees east of due south, 24
// degrees up), and a pale rim lies along the high crests seen against it; a soft band of mist at the feet; the finer grain
// eases out by the pixel's footprint. `snowLine`: the height at which the snow begins (the farther, lower range carries it lower)
export function rangeMat(shared, mirror = false, snowLine = 240) {
  return new THREE.ShaderMaterial({ name: 'abRange' + (mirror ? '-image' : ''), defines: mirror ? { MIRROR: 1 } : {}, transparent: mirror, uniforms: { ...shared, uSnow: { value: snowLine } },
    vertexShader: /* glsl */`varying vec3 vW, vN; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vW, vN; uniform float uSnow;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
      ${LIGHT_GLSL}
      const vec3 MOON = vec3(.2518, .4067, .8781);
      void main(){
        vec3 w = vW, n = vN*inversesqrt(max(dot(vN, vN), 1e-8)), cam = cameraPosition; float mk = 1.;
        #ifdef MIRROR
        mk = abMirror(w); w.y = -w.y; n.y = -n.y; cam.y = -cam.y;
        #endif
        float fp = fwidth(vW.x) + fwidth(vW.z), keep = 1. - smoothstep(8., 40., fp);
        float big = vnoise(w.xz*.006), fine = mix(.5, vnoise(w.xz*.03), keep);
        // the slopes are broken into ribs and gullies (about 90 m and, nearer, 22 m across), so that the moon and the snow lie on them unevenly
        n += vec3(vnoise(w.xz*.011) - .5, 0., vnoise(w.xz*.011 + 23.) - .5)*.9 + vec3(vnoise(w.xz*.045) - .5, 0., vnoise(w.xz*.045 + 41.) - .5)*.5*keep;
        n *= inversesqrt(max(dot(n, n), 1e-6));
        float line = uSnow + 130.*big, snow = smoothstep(line - 30., line + 70., w.y)*smoothstep(.36, .62, n.y + .22*(fine - .5));
        float kd = max(dot(n, AB_KEY), 0.);      // NIGHT: rock nearly as dark as the far sea; the snow a dim cool glimmer under the star cloud
        vec3 v = cam - w; v *= inversesqrt(max(dot(v, v), 1e-6));
        float wrap = clamp((dot(n, MOON) + .3)/1.3, 0., 1.), gr = 1. - max(dot(n, v), 0.);
        float rim = gr*gr*(.25 + .75*max(dot(-v, MOON), 0.)), high = smoothstep(line - 170., line + 60., w.y);      // the moon stands beyond them: the light catches crests and the slopes turned to it
        vec3 rock = vec3(.020, .023, .050)*(.7 + .6*mix(.5, vnoise(vec2(w.y*.035, dot(w.xz, vec2(.006, .004)))), keep))*(.5 + .5*clamp(n.y, 0., 1.) + .9*kd);
        rock += vec3(.07, .09, .16)*(.6*wrap*wrap + .8*rim)*high;
        vec3 col = mix(rock, vec3(.24, .30, .58)*(.07 + .50*kd*kd) + vec3(.60, .70, 1.)*(.62*wrap*wrap + .70*rim), snow);
        col = mix(col, uFogColor*.8, .6*exp(-max(w.y, 0.)/50.));      // mist lies at the feet
        col = abFog(col, vW);
        #ifdef MIRROR
        gl_FragColor = vec4(col*.85, .62*mk);
        if(mk < .01) discard;
        #else
        gl_FragColor = vec4(col, 1.);
        #endif
      }` });
}
