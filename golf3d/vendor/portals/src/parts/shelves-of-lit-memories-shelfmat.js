// SHELVES OF LIT MEMORIES: the dress of the shelf walls, their orbs, the lanes' floor and the far plain (the shelves' builder).
// Four materials, all plain shaders (linear HDR out, scene.fog honoured, every fine pattern eased out by the pixel's footprint):
//  orbMat    a glass ball drawn on a hull of 20 triangles: the fragment cuts the TRUE sphere on the sight line (round from every
//            side, at every distance), shades it by its true normal: a glow of ONE colour from within, a slow swirl, one highlight
//  wallMat   the shelf walls: kind 0 the lane's own faces (real recesses; each orb's pool of light on its board and back panel),
//            kind 1 a drawn face (near, the sight line is followed into a drawn recess 2.6 m deep and meets true balls, boards
//            or the back panel; far off its rows melt into soft bands of the district's colour), kind 2 tops, heads, piers, ends
//  floorMat  the lanes' floor near the route: dark, polished; it holds the orbs of the lane's two faces as long soft streaks
//  plainMat  the plain as far as it is seen: the folds drawn with their height (the sight line is followed over walls
//            38 m tall), pale tops, glowing faces, dark lanes; loops and whorls far from the route
// The colours of the route's own lane come from ONE small texture dealt at build (a texel an orb), read by all four.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import { ORB, LANE, CHASM } from './shelves-of-lit-memories-plan.js';

const lin = (hex) => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
const F1 = (v) => Number(v).toFixed(2);
export const TEX_W = 512, TEX_H = 32, ROW1 = 16;      // the lane's texture: a column a place along the lane, rows 0-11 the left face's shelves, 16-27 the right face's

// THE BREATH: a soft wave of brightening that travels along a lane by the world's clock (240 m long, a place brightens once in
// 5.5 s: up over 1.2 s, back over 1.5 s, at rest half the time): 0 to 1 at a place xi metres along, ph the lane's own lag
const BREATH = /* glsl */`
float smBreath(float xi, float ph){ float x = fract(xi/240. - uTime/5.5 + ph); return smoothstep(0., .22, x)*(1. - smoothstep(.22, .50, x)); }
`;
const COMMON = /* glsl */`
uniform float uTime; uniform sampler2D uOrbTex; uniform vec4 uRoll; uniform vec2 uReal;
${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
${fx.GLSL_FOG_PARS_FRAG}
${BREATH}
const float DS = ${F1(LANE.orbDs)}, SH0 = ${F1(LANE.shelf0)}, SDY = ${F1(LANE.shelfDy)}, WH = ${F1(LANE.wallH)};
const vec3 LILAC = vec3(.40, .33, .52), SKYUP = vec3(.055, .05, .13), INDIGO = vec3(.040, .036, .11);      // the walls' skin; the sky's light; the deep dark of a recess, so that every orb glows against dark
vec3 smPal(float id){ return id < .5 ? ${lin(ORB.gold)} : id < 1.5 ? ${lin(ORB.blue)} : id < 2.5 ? ${lin(ORB.red)} : id < 3.5 ? ${lin(ORB.green)} : id < 4.5 ? ${lin(ORB.violet)} : ${lin(ORB.grey)}*.8; }
// the district a place of the plain lies in (which colour most of its orbs take): broad patches, gold the most
float smDistrict(vec2 p){
  float a = vnoise(p*.0042 + 3.7), b = vnoise(p*.0071 + 11.3);
  float far = a < .56 ? 0. : (b < .40 ? 1. : b < .50 ? 2. : b < .60 ? 3. : 4.);
  // beside the route the folds keep the lane's own districts along the flight: gold, blue, gold with red and green, violet with gold
  float z = p.y + 70.*(vnoise(p*.011 + 1.9) - .5), c = vnoise(p*.019 + 23.1);
  float near = z < -110. ? 0. : z < 40. ? 1. : z < 230. ? (c < .36 ? 2. : c > .64 ? 3. : 0.) : (c > .60 ? 0. : 4.);
  return abs(p.x + 48.*cos(.0116355*(p.y - 381.))) < 150. + 40.*(a - .5) ? near : far;
}
// the same districts with soft borders: the colour a stretch of shelves shows once its orbs have melted into one glowing band.
// m: the metres of wall one pixel spans along a face seen aslant (0 on the ground): the borders widen with it and the red and
// green patches run into their district's mean, so that a melted face is a soft glow of its district, never upright bars
vec3 smDistrictSoft(vec2 p, float m){
  float a = vnoise(p*.0042 + 3.7), b = vnoise(p*.0071 + 11.3), e = 15. + 30.*m, ec = .06 + .55*m, eb = .03 + .3*m;
  vec3 far = mix(smPal(0.), mix(mix(mix(smPal(1.), smPal(2.), smoothstep(.40 - eb, .40 + eb, b)), smPal(3.), smoothstep(.50 - eb, .50 + eb, b)), smPal(4.), smoothstep(.60 - eb, .60 + eb, b)), smoothstep(.55 - eb, .57 + eb, a));
  float z = p.y + 70.*(vnoise(p*.011 + 1.9) - .5), c = vnoise(p*.019 + 23.1), w = smoothstep(40. - e, 40. + e, z)*(1. - smoothstep(230. - e, 230. + e, z));
  vec3 near = mix(smPal(0.), smPal(1.), smoothstep(-110. - e, -110. + e, z)*(1. - smoothstep(40. - e, 40. + e, z)));
  near = mix(near, smPal(2.), w*(1. - smoothstep(.36 - ec, .36 + ec, c))); near = mix(near, smPal(3.), w*smoothstep(.64 - ec, .64 + ec, c));
  near = mix(near, mix(smPal(4.), smPal(0.), smoothstep(.60 - ec, .60 + ec, c)), smoothstep(230. - e, 230. + e, z));
  return mix(near, far, smoothstep(-15., 15., abs(p.x + 48.*cos(.0116355*(p.y - 381.))) - 150. - 40.*(a - .5)));
}
// an orb of the route's own lane: its colour (rgb) and how bright it is (a), from the texture dealt at build
vec4 smOrb(float i, float row){ return textureLod(uOrbTex, (vec2(i, row) + .5)/vec2(${TEX_W}., ${TEX_H}.), 0.); }
// the ball that is passing a place of the rolling shelf: its number and its colour (a new day's memories come in mixed)
vec3 smBall(float b){ return smPal(floor(hash11(b*1.37 + 5.)*4.999)); }
`;

// ---- THE ORBS. aI: (place along, row in the texture, a die, radius); aT: the shelf's direction there (x, z)
const ORB_VERT = /* glsl */`
attribute vec4 aI; attribute vec2 aT; uniform float uTime; uniform vec4 uRoll; uniform sampler2D uOrbTex;
varying vec3 vW, vC; varying vec4 vCol; varying vec4 vK; varying vec2 vAx;
${fx.GLSL_HASH}
vec3 smPal(float id){ return id < .5 ? ${lin(ORB.gold)} : id < 1.5 ? ${lin(ORB.blue)} : id < 2.5 ? ${lin(ORB.red)} : id < 3.5 ? ${lin(ORB.green)} : ${lin(ORB.violet)}; }
${BREATH}
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec3 c = instanceMatrix[3].xyz; float r = aI.w, roll = 0., sc = 1.;
  vec4 col = textureLod(uOrbTex, (aI.xy + .5)/vec2(${TEX_W}., ${TEX_H}.), 0.); col = vec4(col.rgb*col.a, 1.);
  float farM = smoothstep(140., 380., length(cameraPosition - c));      // far from the eye a ball takes the mean of its row's near balls: a row melts to one colour, no speckle
  if(farM > 0.){ vec4 m1 = textureLod(uOrbTex, (aI.xy + vec2(-1.5, .5))/vec2(${TEX_W}., ${TEX_H}.), 0.), m2 = textureLod(uOrbTex, (aI.xy + vec2(2.5, .5))/vec2(${TEX_W}., ${TEX_H}.), 0.), m3 = textureLod(uOrbTex, (aI.xy + vec2(-.5, .5))/vec2(${TEX_W}., ${TEX_H}.), 0.), m4 = textureLod(uOrbTex, (aI.xy + vec2(1.5, .5))/vec2(${TEX_W}., ${TEX_H}.), 0.);
    col.rgb = mix(col.rgb, .25*(m1.rgb*m1.a + m2.rgb*m2.a + m3.rgb*m3.a + m4.rgb*m4.a), farM); }
  if(abs(aI.y - uRoll.x) < .5 && aI.x >= uRoll.y && aI.x < uRoll.z){      // the rolling shelf: every ball moves on along it by the clock
    float ph = uTime*uRoll.w/${F1(LANE.orbDs)}, sh = fract(ph), b = aI.x - floor(ph);
    c.xz += aT*sh*${F1(LANE.orbDs)}; roll = (b + ph)*${F1(LANE.orbDs)}/r;
    col = vec4(smPal(floor(hash11(b*1.37 + 5.)*4.999)), 1.);
    sc = clamp(min(aI.x + sh - uRoll.y, uRoll.z - aI.x - sh), 0., 1.);      // it comes in and goes out small at the shelf's two ends
  }
  vec4 w = modelMatrix*vec4(c + position*r*sc, 1.);
  vW = w.xyz; vC = (modelMatrix*vec4(c, 1.)).xyz; vCol = col; vK = vec4(aI.z, roll, r*sc, 1. + .25*smBreath((aI.x + .5)*${F1(LANE.orbDs)}, (aI.y < 15.5 ? 0. : .35) + mod(aI.y, 16.)*.012)); vAx = aT;      // w: the breath passing this place of the lane
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const ORB_FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vC; varying vec4 vCol; varying vec4 vK; varying vec2 vAx; uniform float uTime;
${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 ro = cameraPosition, rd = vW - ro; rd *= inversesqrt(max(dot(rd, rd), 1e-6));
  float px = length(dFdx(rd)) + length(dFdy(rd));                    // how much of a turn one pixel is
  vec3 oc = ro - vC; float dist = sqrt(max(dot(oc, oc), 1e-4)), r0 = max(vK.z, 1e-3);
  float foot = px*dist/r0, r = r0*(1. + min(.5*foot, .26));          // a ball of a few pixels is drawn fuller, up to where it touches its neighbours: far off a row is one band, never specks
  float b = dot(oc, rd), disc = b*b - (dot(oc, oc) - r*r), t = -b - sqrt(max(disc, 0.));
  vec3 n = (ro + rd*t - vC)/r; float nv = clamp(-dot(n, rd), 0., 1.), seed = vK.x;
  // GLASS LIT FROM WITHIN: a bright soft core that fades to a deeper rim; inside it two or three broad slow veils of light (a
  // broad noise read at the middle of the sight line's way through the ball, turning slowly about the ball's upright axis)
  vec3 q = n + rd*(.8*nv);
  if(abs(vK.y) > 0.){ vec3 ax = vec3(vAx.y, 0., -vAx.x); float cr = cos(vK.y), sr = sin(vK.y); q = q*cr + cross(ax, q)*sr + ax*dot(ax, q)*(1. - cr); }      // a rolling ball turns its weather with it
  float ang = uTime*(.16 + .16*seed) + seed*40., ca = cos(ang), sa = sin(ang);
  vec3 qs = vec3(ca*q.x - sa*q.z, q.y, sa*q.x + ca*q.z);
  float keep = 1. - smoothstep(.10, .45, foot);
  float veil = mix(.5, smoothstep(.18, .82, .6*vnoise(qs*1.25 + seed*17.) + .4*vnoise(qs*2.1 + vec3(0., uTime*.05, 0.) + seed*5.)), keep);
  float ps = max(sin(uTime*(.45 + .3*hash11(seed*7.3)) + seed*60.), 0.); ps *= ps; ps *= ps; ps *= ps;      // here and there one brightens and eases back (once in 8 to 14 s)
  float pulse = step(.80, hash11(seed*91.7 + 2.))*ps, core = nv*nv*nv;
  vec3 base = vCol.rgb, col = mix(base, vec3(1.), .30*core*veil)*(.15 + .85*core)*(.66 + .52*veil);
  col = mix(col, base*.26, smoothstep(.22, .6, foot));               // (as bright, row for row, as the drawn balls of the walls beside)               // ... and evenly lit
  col *= vCol.a*(1. + .9*pulse)*vK.w*(r0/r);
  float f1 = 1. - nv, fres = f1*f1*f1*keep;
  col += vec3(.10, .09, .22)*fres*.35;                               // the glass holds the sky faintly at its rim
  float hl = max(dot(reflect(rd, n), vec3(0., .75, .66)), 0.);
  col += vec3(1., .98, .95)*1.5*smoothstep(.982, .996, hl)*keep;     // one small clean highlight, from the glow over the tower
  col = fxApplyFog(col);
  gl_FragColor = vec4(col, 1.);
  if(disc < 0.) discard;
}`;
export function orbMat(shared, uni) {
  return new THREE.ShaderMaterial({ name: 'smOrb', vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, fog: true,
    uniforms: { ...fx.fogUniforms(), uTime: shared.uTime, ...uni } });
}
/*END-ORB*/

// ---- THE WALLS. aA: (metres along, depth into the recess, kind, the face: its first row in the lane's texture, or a die)
const SOLID_VERT = /* glsl */`
attribute vec4 aA; varying vec3 vW, vN; varying vec4 vA;
${fx.GLSL_FOG_PARS_VERT}
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vA = aA;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const WALL_FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec4 vA;
${COMMON}
void main(){
  vec3 n = vN*inversesqrt(max(dot(vN, vN), 1e-8)), emit = vec3(0.), alb = LILAC;
  float s = vA.x, dep = vA.y, kind = vA.z, face = floor(vA.w + .5), y = vW.y;      // the face's number is rounded: what is dealt by it must not waver from pixel to pixel
  float rowf = (y - SH0)/SDY, j = clamp(floor(rowf + .02*step(.5, n.y)), 0., 11.), yc = SH0 + 1. + SDY*j;      // a board's top lies exactly on the line between two rows: it is told its own row (the orbs that stand on it), or the row would waver from pixel to pixel and the board stipple
  vec3 light = SKYUP*(.5 + .5*n.y) + vec3(.45, .45, .48)*smoothstep(.5, .9, n.y)*smoothstep(WH - 1.5, WH - .2, y) + vec3(.20, .17, .24)*step(1.5, vA.z)*(1. - .6*abs(n.y));      // the tops lie pale under the sky
  vec2 fwv = vec2(fwidth(s), fwidth(y)); float fw = max(fwv.x, fwv.y);
  if(kind < .5){
    // the lane's own face, a real recess: the three nearest orbs of its row light the board, the back panel and the edges
    float x = s/DS; bool rolling = abs(j + face - uRoll.x) < .5 && x >= uRoll.y && x < uRoll.z;
    if(rolling) x -= uTime*uRoll.w/DS;
    float i0 = floor(x), fr = fract(x); vec3 pool = vec3(0.); vec4 mine = vec4(0.);
    for(int k = -1; k <= 1; k++){
      float fk = float(k); vec4 oc = rolling ? vec4(smBall(i0 + fk), 1.) : smOrb(i0 + fk, j + face);
      vec3 v = vec3((fr - .5 - fk)*DS, y - yc, dep - 1.3); float d2 = dot(v, v) + .45, id = inversesqrt(d2);
      float ndl = abs(n.y) > .5 ? abs(v.y)*id : (dep > 2.5 ? 1.3*id : 2.4);      // a board's front edge catches its row's light
      pool += oc.rgb*oc.a*ndl*1.9/(d2*d2); if(k == 0) mine = oc;                // the light falls off fast: a pool under and behind each orb, deep dark between and above
    }
    float bw = 1. + .25*smBreath(s, (face < 8. ? 0. : .35) + j*.012);
    alb = mix(LILAC, INDIGO, n.y > .5 ? smoothstep(.15, 1.1, dep) : smoothstep(.03, .40, dep));      // inside the recess deep indigo; the boards' front edges (and, seen from above, the front of their tops) stay pale and catch the light
    light += mix(pool, vec3(dot(pool, vec3(.33))), .2)*1.1*bw + vec3(.05, .045, .08);
    emit = pool*.06*bw;                                              // a clear soft pool of each orb's colour on its board and its back panel
    if(dep > 2.5 && !rolling && i0 < uReal.x){      // where no real ball stands (far up the lane) the ball is drawn on the back panel
      float rr = length(vec2((fr - .5)*DS, y - yc)), keep = 1. - smoothstep(.5, 2., fw);
      emit += bw*mine.rgb*mine.a*mix(.26, (.33 + .45*clamp(1. - rr*rr, 0., 1.))*(1. - smoothstep(1. - fw, 1. + fw, rr)), keep);
    }
  } else if(kind < 1.5){
    // a drawn face (dep says which way it runs): twelve shelves, on each a row of balls. The sight line is followed INTO the
    // recess (2.6 m deep): it meets a ball (the true sphere, its edge softened by a pixel's width), a board or the back panel, deep
    // indigo with the ball's pool. So a face is shelves of round glowing balls down to balls three pixels across; smaller than
    // that the row melts, over a long range, into one soft band as bright as what it stands for
    float v = fract(rowf), inrow = step(0., rowf)*step(rowf, 12.);
    // THE MELT GOES BY THE TWO DIRECTIONS APART. Along the shelf the balls run together into one glowing row (a pixel spanning
    // .6 to 2.4 m of the wall); the rows themselves (a glowing line on a dark recess under a pale board edge) stay drawn until a
    // shelf is under about two pixels tall, and only then the face is one band
    float keepX = (1. - smoothstep(.6, 2.4, fwv.x))*(1. - smoothstep(.6, 2.4, fwv.y)), keepY = 1. - smoothstep(.6, 1.25, fwv.y), keepE = 1. - smoothstep(.25, .6, fwv.y), keepH = 1. - smoothstep(.1, .35, fw), keepR = keepY, fv = fwv.y/SDY + .01;      // a ball is drawn where it is five pixels across and more (gone by two and a half, in either direction); the rows are fully drawn from a shelf five pixels tall and are gone by two and a half; before that the pale board edge (the thinnest line) eases into the dark over the balls, so that a row is one glowing line and one dark line, neither thinner than a pixel and a half
    vec3 dc = smDistrictSoft(vW.xz, clamp(fwv.x, 0., 3.));
    float recess = mix(.84, smoothstep(-fv, fv, v - .02)*(1. - smoothstep(-fv, fv, v - .87)), keepR)*inrow;
    float kO = max(keepY, keepX), open = inrow*(1. - smoothstep(.87 - fv, .87 + fv, v))*kO; vec3 nearC = vec3(0.);      // balls are drawn down to three pixels across; where they are squeezed along the shelf the rows stand in
    if(open > .01){
      vec2 nh = n.xz*inversesqrt(max(dot(n.xz, n.xz), 1e-6)), tw = dep*vec2(-nh.y, nh.x);
      vec3 rdw = vW - cameraPosition; rdw *= inversesqrt(max(dot(rdw, rdw), 1e-6));
      vec3 r = vec3(dot(rdw.xz, tw), rdw.y, max(-dot(rdw.xz, nh), 1e-3)), o = vec3(s, y - (SH0 + SDY*j), 0.);      // along, up, into the wall
      float tB = 2.6/r.z, tY = r.y < 0. ? o.y/max(-r.y, 1e-4) : (2.6 - o.y)/max(r.y, 1e-4), tS = min(tB, tY);
      // the row melted along the shelf: the balls' glow at the height the sight line passes them, else the dark recess
      // (as the shelf gets small the glowing line narrows and softens, so that it and the dark over it are each about half a
      // shelf: neither is thinner than a pixel and a half before the rows fade)
      float hB = o.y + r.y*.8/r.z, sm = smoothstep(.3, .9, fwv.y), uB = (hB - 1.)/(1. - .28*sm), qB = clamp(1. - uB*uB, 0., 1.), pB = mix(sqrt(qB), qB, sm);
      nearC = mix(INDIGO*(.7 + mix(dc, vec3(dot(dc, vec3(.33))), .35)*1.1), dc*(.50 + .12*sm), .8*pB);
      if(keepX > .01){
        float sg = r.x < 0. ? -1. : 1., iE = floor((s + r.x*min(.3/r.z, tS))/DS), tO = 1e5, cHit = iE, cov = 0.;
        float eS = clamp(.7*fw, .01, .55);      // a ball's edge is softened by a pixel's width: a small ball is a soft round dot, never a speck
        for(int k = 0; k < 4; k++){
          float ci = iE + float(k)*sg; vec3 q = o - vec3((ci + .5)*DS, 1., 1.3);
          float bq = dot(q, r), dsc = bq*bq - (dot(q, q) - 1.), t = -bq - sqrt(max(dsc, 0.));
          float cv = 1. - smoothstep(1. - eS, 1. + eS, sqrt(max(1. - dsc, 0.)));
          if(cv > 0. && t > 0. && t < tO && t < tS){ tO = t; cHit = ci; cov = cv; }
        }
        float hC = hash12(vec2(cHit, j) + face*37.1);
        float dI = smDistrict(vW.xz + tw*((cHit + .5)*DS - s) + (hash22(vec2(cHit, j) + face*11.3) - .5)*44.);
        // a single odd ball eases toward its neighbours' colour before it is six pixels across, and a dim one is never darker
        // there than half its neighbours' brightness: no dark speck is left on a glowing face
        vec3 cn = smPal(dI), co = smPal(hC < .05 ? 5. : (hC < .12 ? floor(hash11(hC*977.)*4.999) : dI)); float eo = smoothstep(.12, .4, fw);
        co *= max(1., .5*eo*dot(cn, vec3(.3, .59, .11))/max(dot(co, vec3(.3, .59, .11)), 1e-3));
        vec3 oc = mix(co, cn, eo);
        vec3 ph = o + r*tS, vq = vec3((fract(ph.x/DS) - .5)*DS, ph.y - 1., ph.z - 1.3); float d2 = dot(vq, vq) + .3;
        vec3 det = INDIGO*(.7 + mix(oc, vec3(dot(oc, vec3(.33))), .35)*2.4/d2);      // the board or the back panel: deep indigo with the ball's pool on it
        if(cov > 0.){
          vec3 pn = o + r*tO - vec3((cHit + .5)*DS, 1., 1.3); float nv = clamp(-dot(pn, r), 0., 1.), f1 = 1. - nv, f3 = f1*f1*f1;
          float sw = mix(.5, smoothstep(.18, .82, vnoise((pn + r*(.8*nv))*1.25 + hC*17. + vec3(0., uTime*.05, 0.))), keepH);
          vec3 wn = vec3(tw.x*pn.x - nh.x*pn.z, pn.y, tw.y*pn.x - nh.y*pn.z);
          float hl = max(dot(reflect(rdw, wn), vec3(0., .75, .66)), 0.), core = nv*nv*nv;
          det = mix(det, mix(oc, vec3(1.), .30*core*sw)*(.15 + .85*core)*(.66 + .52*sw) + vec3(.10, .09, .22)*f3*.35 + vec3(1., .98, .95)*1.3*smoothstep(.982, .996, hl)*keepH, cov);
        }
        nearC = mix(nearC, det, keepX/max(kO, 1e-3));
      }
    }
    float bw = 1. + .25*smBreath(s, face*.37 + j*.012);
    emit = mix(dc*.17*recess, nearC, open)*bw;      // the melted band is as bright as the balls, boards and dark recesses it stands for
    light += dc*(.04 + .10*recess + .55*keepE*(1. - recess)*inrow)*bw; alb = mix(alb, INDIGO, .85*recess)*(1. - open);      // the boards' edges catch their rows' light: no black ruled lines
  } else if(abs(n.y) < .5){
    // a round head, an end pier, a wall's closed end: the twelve rows run on round it as soft glowing bands of its district's
    // colour between the pale board edges, so that no blank slab stands at a wall's end
    float v = fract(rowf), inrow = step(0., rowf)*step(rowf, 12.), keepR = 1. - smoothstep(.7, 2.6, fwv.y), fv = fwv.y/SDY + .01;
    float recess = mix(.84, smoothstep(-fv, fv, v - .02)*(1. - smoothstep(-fv, fv, v - .87)), keepR)*inrow;
    vec3 dc = smDistrictSoft(vW.xz, 0.);
    float bw = 1. + .25*smBreath(dot(vW.xz, vec2(.25, .97)), .2);
    emit = dc*(.10 + .16*sin(3.1416*clamp((v - .02)/.85, 0., 1.)))*recess*bw; alb = mix(alb, INDIGO, .85*recess);
  }
  vec3 col = alb*light + emit;
  // the farthest walls sink into the plain's luminous haze before their balls get under two pixels across
  vec3 rdv = vW - cameraPosition; float dEye = length(rdv); rdv /= max(dEye, 1e-3);
  float farW = smoothstep(1.3, 2.0, dEye*(length(dFdx(rdv)) + length(dFdy(rdv))))*smoothstep(380., 560., dEye);
  col = mix(col, vec3(1., .66, .26)*.26 + vec3(.03, .025, .05), .9*farW);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;
export function wallMat(shared, uni) {
  return new THREE.ShaderMaterial({ name: 'smWall', vertexShader: SOLID_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fx.fogUniforms(), uTime: shared.uTime, ...uni } });
}

// ---- THE LANES' FLOOR near the route. aA: (metres left of the spine, metres along the spine, the spine's direction x, z)
const FLOOR_FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec4 vA;
${COMMON}
void main(){
  float d = vA.x, s = vA.y; vec2 tg = vA.zw*inversesqrt(max(dot(vA.zw, vA.zw), 1e-6));
  float nl = floor(d/25. + .5), c = d - 25.*nl, e = max(9. - abs(c), 0.), lane0 = 1. - step(.5, abs(nl));
  vec3 V = cameraPosition - vW; V *= inversesqrt(max(dot(V, V), 1e-6));
  // the seams: slabs 5.2 m by 3 m laid half over half, fine dark joints that ease out as they get small
  vec2 u = vec2(s/5.2 + .5*mod(floor(c/3. + 20.), 2.), c/3.), dm = (.5 - abs(fract(u) - .5))*vec2(5.2, 3.), fm = vec2(fwidth(s), fwidth(c)) + 1e-4;
  vec2 ln = (1. - smoothstep(vec2(.03), vec2(.03) + fm, dm))*min(vec2(1.), .09/fm);
  float fmm = max(fm.x, fm.y), seam = max(ln.x, ln.y)*(1. - smoothstep(.03, .22, fmm)), keepS = 1. - smoothstep(.1, .6, fmm);      // faint joints, gone where a pixel is wider than a hand
  float tone = mix(1., .96 + .08*hash12(floor(u) + 7.), keepS);
  vec3 col = vec3(.010, .008, .020);
  // the light that lies on it: a pool of the nearer face's colours along each wall's foot
  float rowS = c > 0. ? 0. : ${ROW1}.; vec3 lc;
  if(lane0 > .5){ float x = s/DS - .5, i0 = floor(x), fr = fract(x);
    vec4 a0 = smOrb(i0, rowS), a1 = smOrb(i0 + 1., rowS), b0 = smOrb(i0, rowS + 1.), b1 = smOrb(i0 + 1., rowS + 1.);
    lc = mix(a0.rgb*a0.a + b0.rgb*b0.a, a1.rgb*a1.a + b1.rgb*b1.a, fr)*.5;
    vec4 w0 = smOrb(i0 - 5., rowS + 1.), w1 = smOrb(i0 + 6., rowS);
    lc = mix(lc, .5*(w0.rgb*w0.a + w1.rgb*w1.a), smoothstep(.35, 1.6, fm.x));      // far off the colours of single orbs run together
  } else lc = smDistrictSoft(vW.xz, 0.);
  float bw = 1. + .25*smBreath(s, lane0 > .5 ? (c > 0. ? 0. : .35) : nl*.37);
  vec3 lf = mix(lc, vec3(dot(lc, vec3(.3, .5, .2))), .3);      // the floor takes the walls' light a little paler than the orbs' own colour
  col += lf*(.03 + .075*exp(-e/2.) + .035*exp(-e/7.))*tone*bw;      // lit ground from wall to wall, brightest at the walls' feet
  // what the polished floor holds: the wall the mirrored sight line meets, its orbs drawn out into long soft streaks
  float a = -(V.x*tg.x + V.z*tg.y), b = -(V.x*tg.y - V.z*tg.x), up = max(V.y, 1e-3);
  float across = max(b > 0. ? 9. - c : 9. + c, 0.), tH = across/max(abs(b), 1e-3), h = tH*up, sH = s + tH*a;
  float rf = (h - SH0)/SDY, j = clamp(floor(rf), 0., 11.), x = sH/DS, inw = step(0., rf)*step(rf, 12.);
  float rb = b > 0. ? 0. : ${ROW1}., ic = floor(x), kf = smoothstep(.35, 1.6, fm.x + .012*tH);
  vec4 oc = smOrb(ic, j + rb), o1 = smOrb(ic - 4., j + rb), o2 = smOrb(ic + 4., j + rb), o3 = smOrb(ic - 9., clamp(j + 2., 0., 11.) + rb), o4 = smOrb(ic + 9., clamp(j - 2., 0., 11.) + rb);
  vec3 occ = mix(oc.rgb*oc.a, .25*(o1.rgb*o1.a + o2.rgb*o2.a + o3.rgb*o3.a + o4.rgb*o4.a), kf);
  occ = mix(occ, dot(occ, vec3(.3, .4, .3))*vec3(.62, .60, 1.05), .7*kf);      // ... and calm to one cool tone      // far off single orbs' colours run together: no fan of colours at the lane's far end
  float bl = min(.5 + .012*tH + 1.2*fm.x, 1.2), fsr = abs(fract(x) - .5)*DS;
  float ms = mix(.55, 1. - smoothstep(.75 - bl, .95 + bl, fsr), 1. - smoothstep(.5, 1.2, bl));      // each orb's column one streak, the gaps between them dark
  float mh = .88 + .12*cos(6.2832*(fract(rf) - .3333))*(1. - smoothstep(10., 60., tH));          // the rows run into one another down the streak
  vec3 refl = mix(vec3(.016, .014, .045), lane0 > .5 ? occ*(.06 + .34*ms*mh)*(1. - .35*h/WH)*(1. - .85*smoothstep(.4, 2., fm.x)) : lf*.15*mix(1., .72 + .28*cos(6.2832*x), 1. - smoothstep(.3, 1.2, fm.x))*(1. - .35*h/WH), inw);      // the side lanes mirror their own walls' glow
  float f1 = 1. - V.y, fres = min((lane0 > .5 ? .09 : .16) + .84*f1*f1*f1*f1*f1, .7);      // polished: it mirrors a little even seen from straight above
  col += refl*fres*(1. - .25*seam)*tone*bw;
  col *= 1. - .18*seam;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
  if(length(vW.xz - vec2(${F1(CHASM.x)}, ${F1(CHASM.z)})) < ${F1(CHASM.r)}) discard;      // the floor ends in a clean lip at the chasm's rim
}`;
export function floorMat(shared, uni) {
  return new THREE.ShaderMaterial({ name: 'smFloor', vertexShader: SOLID_VERT, fragmentShader: FLOOR_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fx.fogUniforms(), uTime: shared.uTime, ...uni } });
}
/*END-FLOOR*/

// ---- THE PLAIN AS FAR AS IT IS SEEN: a drawn ground. AMONG THE TRUE WALLS (to 609 m either side of the spine's curve, z -474
// to 524) it is the lanes' dark floor with the pools of light at the walls' feet. BEYOND THEM THE FOLDS are a field: at the true
// walls' edge it is the walls' own lines (copies of the curve every 26 m), so the drawn walls take them up; from 10 m out a warped
// broad noise comes in, so that they turn in loops and whorls in every direction. Near, the walls are drawn WITH THEIR HEIGHT
// (see the note in main): a pale top, or the next wall's face glowing in its district's colour, else the dark floor.
// Where a pixel is longer than a third of a lane the whole eases to its mean in broad soft bands, and those into the haze.
const PLAIN_FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec4 vA;
${COMMON}
// THE FOLDS as a field (x: walls stand where its fraction is near a half; y: 1, or less where a wall thins out into a gap).
// u is the metres in x from the spine's curve; a the metres outside the true walls' ground. The field is u's own count of walls
// (so the drawn walls run on from the true ones); with a a warped broad noise comes in and u levels off, so that far out only
// the noise is left: level lines that are closed loops, whorls and hairpins; here and there a wall thins to nothing (a gap)
float gGap = 1.;      // how much of the gaps is drawn (they ease out where a pixel is wider than they are: no specks far off)
// 1 where TRUE walls stand (the lane, its offsets and the shifted copies): there the plain is only the lanes' floor
float smTrue(vec2 q){ return step(abs(q.x + 48.*cos(.0116355*(q.y - 381.))), 609.)*step(-474., q.y)*step(q.y, 524.); }
vec2 smFold(vec2 p){
  float u = abs(p.x + 48.*cos(.0116355*(p.y - 381.))), ax = max(u - 609., 0.), ez = max(max(-474. - p.y, p.y - 524.), 0.), a = sqrt(ax*ax + ez*ez);
  float g = smoothstep(10., 150., a), h = max(min(u, 609. + 90.*(1. - exp(-ax/90.))) - 154., -12.7)/26. + .5;
  vec2 q = p + 90.*(vec2(vnoise(p*.0081 + 5.1), vnoise(p*.0081 + 19.7)) - .5);
  float n1 = vnoise(mat2(.8, .6, -.6, .8)*q*.0058 + 17.), n2 = vnoise(mat2(.6, -.8, .8, .6)*q*.0139 + 31.7);
  float gap = clamp((.77 - vnoise(p*.021 + 77.))/.10, 0., 1.);
  return vec2(h + g*(420.*(n1 - .5) + 135.*(n2 - .5))/26., mix(1., gap, g*gGap));
}
// the districts' colours melted: what a far stretch of the plain shows when its patches are smaller than a pixel
vec3 smSoft(vec2 p){
  float a = vnoise(p*.0013 + 2.1), b = vnoise(p*.0017 + 9.4);
  return mix(smPal(0.), mix(smPal(1.), smPal(4.), smoothstep(.35, .65, b)), .8*smoothstep(.50, .64, a));
}
void main(){
  vec2 p = vW.xz; vec3 V = cameraPosition - vW; V *= inversesqrt(max(dot(V, V), 1e-6));
  float fpa = length(dFdx(p)), fpb = length(dFdy(p));
  gGap = 1. - smoothstep(6., 24., max(fpa, fpb));
  vec2 f0 = smFold(p); float F0 = f0.x, gm = clamp(length(vec2(smFold(p + vec2(2., 0.)).x - F0, smFold(p + vec2(0., 2.)).x - F0))*.5, .004, .09);
  float hw = clamp(min(${F1(LANE.wall / 2)}*max(gm, .016), ${F1(LANE.wall)}*gm), .004, .36);      // 7 m where the folds crowd; never wider than 14 m where they spread (there the lane widens)
  // THE HEIGHT: q is where the sight line crosses the tops' level (38 m up) on its way down to this place of the floor. In a wall
  // there: its pale top. Else the sight line goes on over the lane: if it meets the next wall's face before the floor (told by
  // the field's change along its track) the face is seen, at the height it is met; else the floor here
  vec2 off = V.xz/max(V.y, .04)*WH; float L = max(length(off), 1e-3), Lc = min(L, 140.); off *= Lc/L;
  vec2 fT = smFold(p + off), fN = smFold(p + off*.92);
  float FT = fT.x, hwT = hw*fT.y, mTop = hwT - abs(fract(FT) - .5), gv = (fN.x - FT)/max(.08*Lc, .5);
  float rem = gv > 0. ? fract(.5 - hwT - FT) : fract(FT - .5 - hwT), dist = rem/max(abs(gv), 1e-4);
  float fwT = abs(dFdx(FT)) + abs(dFdy(FT)), keepT0 = 1. - smoothstep(.35, 1., fwT), topCov = smoothstep(-.5*fwT - .004, .5*fwT + .004, mTop);
  float inP = smTrue(p), hf = 1. - clamp(dist/Lc, 0., 1.), hh = WH*hf;
  float faceCov = (1. - smoothstep(Lc*.95, Lc*1.05 + .5, dist))*(1. - smTrue(p + off*hf)); topCov *= 1. - smTrue(p + off);      // no drawn wall where a true one stands
  float rowf = (hh - SH0)/SDY, v = fract(rowf), fh = fwidth(hh), keepR = 1. - smoothstep(.5, 2.2, fh), fv = fh/SDY + .02;
  float rows = mix(.80, smoothstep(-fv, fv, v - .04)*(1. - smoothstep(-fv, fv, v - .87)), keepR)*step(0., rowf);      // twelve glowing rows between pale board edges
  float fpm = max(fpa, fpb), dEye = length(cameraPosition - vW);
  vec3 dc = mix(smSoft(p), smDistrictSoft(p, 0.), max(1. - smoothstep(6., 30., fpm), inP));
  // the breath: waves travel south-south-east over the plain, each lane a little out of step with its neighbour; where the lanes
  // have melted to their mean the wave is the lanes' mean
  float xi = dot(p + off, vec2(.25, .97)), wv = 1. + .9*mix(smBreath(xi, .17), smBreath(xi, .35*hash11(floor(FT + .5) + 3.7)), keepT0);
  dc *= wv;
  vec3 top = LILAC*(SKYUP + vec3(.45, .45, .48)), side = (dc*(.04 + .32*rows) + LILAC*(.05 + .25*dc)*(1. - rows))*(.22 + .78*hh/WH);      // a face is seen brighter toward its top: the sight line that goes deep meets less light
  float e = max(abs(fract(F0) - .5) - hw*f0.y, 0.)/gm;
  float fP = 1. - V.y, sheen = min(.16 + .84*fP*fP*fP*fP*fP, .7);
  vec3 flo = vec3(.010, .008, .020) + mix(dc, vec3(dot(dc, vec3(.3, .5, .2))), .3)*(.03 + .075*exp(-e/2.) + .035*exp(-e/7.) + .09*sheen);      // lit polished ground: the pools at the walls' feet and the walls' glow mirrored
  flo = mix(flo, dc*.13 + LILAC*.02, smoothstep(55., 135., L)*(1. - inP));      // seen low, a lane that runs with the sight line shows its two glowing faces, not its floor
  float keepT = 1. - smoothstep(.35, 1., fwT);                                 // where the lanes at the tops' level are finer than a pixel, a lane shows its mean
  vec3 col = mix(mix(dc*.22 + LILAC*.02, mix(flo, side, faceCov), max(keepT, inP)), top, topCov);
  // the folds ease to their mean where one pixel spans more than a third of a wall and its lane (told by the field's own
  // change across the pixel, so walls that run along the sight line stay drawn far out and those across it melt)
  float fwF = abs(dFdx(F0)) + abs(dFdy(F0)), keep = max((1. - smoothstep(.30, .85, fwF))*(1. - smoothstep(4.5, 13., fpm)), inP);
  // FAR OFF the folds are SOFT: their mean, in broad bands (six folds a band, paler and darker by turns, run as the folds run)
  // that ease out where a pixel spans more than a third of a band, and melt into the violet haze toward the horizon
  float bb = .5 + .5*sin(6.2832*F0/6.), keepB = (1. - smoothstep(.25, .8, fwF/6.))*(1. - smoothstep(900., 2400., dEye));
  vec3 mean = top*.32 + (dc*.27 + LILAC*.03)*.50 + flo*.18;
  mean = mix(mean, mix(mean*.60, mean*1.30 + top*.12, bb), keepB);
  // FAR OFF THE PLAIN GLOWS: the shelves' light gathered over the folds, warm gold with the districts' colours, and it shines
  // through the haze, so that the horizon is a line of light sinking into violet, not a dark edge
  float farG = smoothstep(450., 2300., dEye)*(1. - inP);
  mean = mix(mean, mix((smSoft(p)*.35 + vec3(1., .70, .34)*.65)*.30*(.8 + .2*wv), vec3(.40, .24, .50)*.42, .6*smoothstep(2400., 4200., dEye)), .85*farG);
  col = mix(mean, col, keep);
  gl_FragColor = vec4(mix(fxApplyFog(col), col, .6*farG), 1.);
  if(length(p - vec2(${F1(CHASM.x)}, ${F1(CHASM.z)})) < ${F1(CHASM.r)}) discard;
}`;
export function plainMat(shared, uni) {
  return new THREE.ShaderMaterial({ name: 'smPlain', vertexShader: SOLID_VERT, fragmentShader: PLAIN_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fx.fogUniforms(), uTime: shared.uTime, ...uni } });
}
