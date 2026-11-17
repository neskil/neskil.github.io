// hall-roofed-with-weather: THE CLOUD THAT IS THE ROOF (the air builder's part).
// At y 46 the room ends in a cloud base that fills it wall to wall; the walls go up into it. What is built:
//   THE BASE: one sheet of the hall's whole plan whose every point hangs at the cloud's own height there (one law,
//     cloudY, shared by every shader here): soft pads with wide soft valleys (the calm stratocumulus), a bank that
//     hangs lower along all four walls (the rim, always), the storm's lower base with its hanging pouches and the
//     long rolled lip of the shelf at its leading edge (placed by the weather's front and back, handed in every
//     frame as uBand: functions of u), and, behind the storm, the tear: ragged holes that widen from the middle of
//     the room, whose margins thin to nothing and curl up, through which the night sky shows. Over the hearth and on
//     up the last leg the base is lifted into THE HOLLOW the fire's smoke has worn: a long vault that rises to the
//     ring, which stands at its end against the vault's wall.
//     Its light: a deep slate body; amber only on the bellies nearest the candle streams and the fire (their places
//     are handed in every frame) falling off fast; violet-white from within where the sheet lightning glows; orange
//     in the hollow, from the fire under it; and its own haze, which thickens down the hall. (Nothing here is lit
//     by the ring: the world leaves the ring undrawn while it is far off, so no light of it stands anywhere.)
//   THE SCUD: a few hundred soft puffs that hang under the base, thickest round the tear's margins, along the rim,
//     under the shelf's lip and along the hollow's lip and mouth, lit by the same law.
//   A CURTAIN of cloud just inside all four walls from the base up, so no wall top is ever seen through the tear.
// WHAT DRIFTS, by the clock: the sheet's pads, pouches and torn margins and the field's scud under them go toward +x
// together, 0.9 m a second (the scud wraps across the field's own width: it thins out where it comes to the bank
// along the +x wall and gathers again out of the bank along the -x wall); the mist's grain creeps along its own
// wall. The rim's bank along the walls, the hollow, and the scud that hangs on those two stand where they are (of
// the hollow only this goes with the drifting pads: its side walls' places wander by up to 1.6 m, its crown swells
// by up to a sixth, and the billows under its crown pass as the pads do). The front, the storm and the tear go by u.
// WHAT HERE READS THE LENS, all of it: the scud's puffs are turned to face it, sorted back to front by their
// distance from it every frame, lit a little from its side (their one normal leans toward it) and thinned inside
// 0.6 to 2.5 m of it (a medium); the sheet takes a faint pale sheen where it is seen at a grazing angle; and sheet,
// scud and curtain sink into the cloud's own haze by their distance from it. None of that places a thing, and but
// for the medium's thinning none shows or hides one.
import * as THREE from 'three';
import { HALL, HEARTH, EXIT } from './hall-roofed-with-weather-plan.js';

const TAU = Math.PI * 2, BASE = HALL.cloudBase;
// THE SKIN'S FLOOR: the law below never lets the skin hang more than DROP_MOST under the base, anywhere, at any u
// or clock (a soft limit that only the deepest of the lip and the pouches feel). The candles take their head room
// from CLOUD_LOW.
export const DROP_MOST = 6.5, CLOUD_LOW = BASE - DROP_MOST;
// the hollow: a vault VAULT.half wide each side of the room's middle line, rising to its full lift toward the ring and
// closed by a steep wall behind the ring (between rear0 and rear1, its place wandering some metres toward the ring
// along its length, with a rolled bank; it meets the side walls in round corners); a rounder dome right over
// the fire. Its run and its lift are taken from the last leg and the ring, handed in by the world file (vaultOf):
// it rises along the hall (along z) over as many metres as the leg is long and has risen whole 12 m before the ring.
// (The leg itself, climbing, covers fewer metres of z than its length, so the hollow begins some metres before the
// leg's foot, toward the high end.) Its crown stands about 6 m over the ring's top: that lift, less a sixteenth
// at the least and more by up to three tenths, as the pads' noises pass over it.
const VAULT = { flat: 11, half: 24, rear0: EXIT.z + 11, rear1: EXIT.z + 19, bank: EXIT.z + 12, dome: 5.5 };
const vaultOf = (leg) => ({ run: leg.length, z0: EXIT.z - 12 - leg.length, lift: EXIT.y + leg.ring + 6 - BASE });
// the sheet's drift toward +x (m/s), and the scud's field: a jittered grid of FIELD_G metres over the plan, 7 m in
// from the walls, which drifts with the sheet and wraps across its own width (FIELD.x0 .. FIELD.x0 + FIELD.span)
const DRIFT = 0.9, FIELD_G = 5.5, FIELD_NX = Math.floor((HALL.x1 - HALL.x0 - 13) / FIELD_G), FIELD = { x0: HALL.x0 + 7 - FIELD_G / 2, span: (FIELD_NX + 1) * FIELD_G };
// ---- one small tiling picture of noise, made from the seed's own stream. r, g, a: three soft noises; b: the
// distance to the nearest seam of a field of jittered cells (the pads). 128 x 128, 8 bits, repeats, mipmapped.
export async function makeNoiseTexture(ctx, rng) {
  const N = 128, data = new Uint8Array(N * N * 4);
  const lat = (per) => { const a = new Float32Array(per * per); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const fbm = async (oct, base) => {
    const out = new Float32Array(N * N); let amp = 1, sum = 0;
    for (let o = 0; o < oct; o++) {
      const per = base << o, L = lat(per), k = per / N;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const fx = x * k, fy = y * k, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const x1 = (x0 + 1) % per, y1 = (y0 + 1) % per, a = L[y0 * per + x0], b = L[y0 * per + x1], c = L[y1 * per + x0], d = L[y1 * per + x1];
        out[y * N + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
      sum += amp; amp *= 0.5;
      await ctx.yield();
    }
    for (let i = 0; i < out.length; i++) out[i] /= sum;
    return out;
  };
  const R = await fbm(4, 4), G = await fbm(4, 4), A = await fbm(4, 8);
  const C = 6, cx = new Float32Array(C * C), cy = new Float32Array(C * C);
  for (let i = 0; i < C * C; i++) { cx[i] = (i % C + 0.15 + 0.7 * rng()) / C; cy[i] = (Math.floor(i / C) + 0.15 + 0.7 * rng()) / C; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (x === 0 && (y & 31) === 0) await ctx.yield();
    const px = (x + 0.5) / N, py = (y + 0.5) / N, gx = Math.floor(px * C), gy = Math.floor(py * C); let f1 = 9, f2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const ix = (gx + i + C) % C, iy = (gy + j + C) % C; let dx = cx[iy * C + ix] - px, dy = cy[iy * C + ix] - py;
      dx -= Math.round(dx); dy -= Math.round(dy); const d = Math.hypot(dx, dy); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    const k = (y * N + x) * 4, st = (v) => Math.max(0, Math.min(255, Math.round(((v - 0.5) * 1.9 + 0.5) * 255)));
    data[k] = st(R[y * N + x]); data[k + 1] = st(G[y * N + x]); data[k + 2] = Math.min(255, Math.round((f2 - f1) * C * 255 * 1.15)); data[k + 3] = st(A[y * N + x]);
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}
const f = (v) => (Number.isInteger(v) ? v + '.' : String(v));
// ---- the cloud's own height and wholeness at a place of the plan (shared by every shader of the cloud).
export const GLSL_CLOUD = /* glsl */`
uniform sampler2D tN; uniform float uTime, uMargin; uniform vec2 uBand; uniform vec3 uVault;      // uVault: the hollow's z0, 1 / its run, its lift; uMargin: how broad the torn margins are (0 .. 1)
#define TN(p) textureLod(tN, p, 0.)
vec3 nrm(vec3 v){ return v*inversesqrt(dot(v,v)+1e-8); }
float stormAtX(float x){ float a=clamp((uBand.x-x)/10.,0.,1.), b=clamp((x-uBand.y)/10.,0.,1.), s=min(a,b); return s*s*(3.-2.*s); }
float wallDist(vec2 q){ return min(min(q.x-(${f(HALL.x0)}),(${f(HALL.x1)})-q.x),min(q.y-(${f(HALL.zHigh)}),(${f(HALL.zLow)})-q.y)); }
// how far the base is lifted into the hollow at a place (0 .. about 28 m). wall: how much of one of its two side
// walls (x), of the bank behind the ring (y), the place is.
float vaultAt(vec2 q, vec4 w, out vec2 wall){
  float t=clamp((q.y-uVault.x)*uVault.y,0.,1.), ramp=t*t*(3.-2.*t);
  float tx=abs(q.x+(w.r-.5)*3.2), ax=clamp((tx-${f(VAULT.flat)})/${f(VAULT.half - VAULT.flat)},0.,1.), prof=1.-ax*ax*(3.-2.*ax);     // a flat crown between two steep soft walls
  float bank=1.+.17*exp(-(q.y-(${f(VAULT.bank)}))*(q.y-(${f(VAULT.bank)}))/9.);                                         // the rolled bank behind the ring
  // (the end wall does not stand on a straight line: along x its place wanders up to 4.5 m toward the ring, by a noise that stands)
  float r=clamp((q.y+4.5*textureLod(tN,vec2(q.x/47.+.23,.61),1.5).g-(${f(VAULT.rear0)}))/${f(VAULT.rear1 - VAULT.rear0)},0.,1.), rear=1.-r*r*(3.-2.*r);
  vec2 h=q-vec2(${f(HEARTH.x)},${f(HEARTH.z)});
  wall=vec2(4.*prof*(1.-prof)*ramp*rear,4.*rear*(1.-rear)*prof);
  // (a side wall and the end wall meet in a round corner: one profile, by how far out a place is across both)
  float c=min(1.,sqrt(ax*ax+r*r)), both=1.-c*c*(3.-2.*c);
  return (uVault.z*ramp*(.94+.2*w.a)+${f(VAULT.dome)}*exp(-dot(h,h)/60.))*both*bank;
}
// how whole the sheet is at a place (1 whole .. 0 a hole) behind the storm: the tear, ragged, widening from the
// middle of the room; never along the walls and never over the hollow (it closes over the last metres before the
// hollow begins, uVault.x: as many as the hollow's flat crown is wide to a side). edge: 1 on the thinning margin,
// which is broader by uMargin.
float cloudWhole(vec2 q, out float edge, out float soft){
  vec2 d=q-vec2(uTime*${f(DRIFT)},0.);
  float behind=clamp((uBand.y-q.x)/24.,0.,1.);
  float mid=smoothstep(9.,18.,wallDist(q))*(1.-smoothstep(uVault.x-${f(VAULT.flat)},uVault.x,q.y));
  float open=min(behind*mid,.96);
  float tn=textureLod(tN,d/83.+vec2(.11,.3),.5).a*.6+textureLod(tN,d/31.,2.).r*.4;
  float fine=(TN(d/9.1).a-.5)*.17+(TN(d/4.3).g-.5)*.06;
  float a=smoothstep(open*1.5-.5,open*1.5-.04,tn+fine);
  soft=smoothstep(open*1.5-.62,open*1.5+.1,tn);
  edge=mix(a*(1.-a),soft*(1.-soft),uMargin)*4.;
  return a;
}
// the y of the cloud's skin at a place of the plan.
// info: x 0 in a fold .. 1 on a pad's or a pouch's belly; y the storm (0..1); z the shelf's lip; w the rim along the walls
float cloudY(vec2 q, out vec4 info, out float whole, out float edge){
  vec2 d=q-vec2(uTime*${f(DRIFT)},0.);
  // (each noise is read no finer than the sheet's own mesh can carry, so the skin has no creases; the fine detail is in its shading)
  vec4 w=textureLod(tN,d/97.+vec2(.13,.71),.6), v=textureLod(tN,d/41.+(w.rg-.5)*.25,1.8), m=textureLod(tN,d/17.+vec2(.37,.05),3.);
  float pad=smoothstep(.2,.8,v.r*.62+w.a*.38);
  float pouch=smoothstep(.28,.8,m.g*.7+v.a*.3);
  float s=stormAtX(q.x);
  float lx=(q.x-(uBand.x-4.5))/4.6, lip=exp(-lx*lx)*(.7+.6*TN(vec2(q.y/67.,uTime*.003+.5)).r);
  float rim=1.-smoothstep(0.,11.,wallDist(q)); rim*=rim;
  float calm=.4+2.8*pad*(.6+.8*w.r)+.8*(m.a-.5)*pad;
  float storm=2.6+2.5*pouch+w.a;
  // inside the hollow the skin is its own billows. On its walls they are laid in the wall's own plane: along the
  // wall, and up it by its height and its run together (so they are not drawn out where a wall leans back into the
  // crown or out into the base): about as round there as under the flat base.
  // (its lift swells by up to a sixth with the pads' middle noise, and never sinks by it: its crown is no level
  // ceiling, and stands nowhere lower over the ring than its own law puts it)
  vec2 wall; float vl=vaultAt(q,vec4(w.r,0.,0.,w.a+1.3*max(v.g-.35,0.)),wall), inV=clamp(vl/6.,0.,1.), up=vl*1.1;
  // (read broad enough that the sheet's cells carry them up a wall's steepest part)
  float mw=mix(textureLod(tN,vec2(q.y,up-.8*abs(q.x))/29.+vec2(.37,.05),3.).g,textureLod(tN,vec2(q.x,up-.8*q.y)/29.+vec2(.11,.6),3.).g,wall.y/(wall.x+wall.y+1e-3));
  float onWall=smoothstep(0.,.75,max(wall.x,wall.y)), bil=smoothstep(.25,.75,mix(m.g*.6+v.a*.4,mw*.8+v.a*.2,onWall));
  // (a billow hangs 3.4 m under the hollow's crown; on a wall it stands a third as far out, so that none hangs before
  // another there as a pendant with a cut outline: a wall's billows are in its shading)
  float drop=(mix(calm,storm,s)+3.4*lip)*(1.-.75*inV)+3.4*bil*inV*(1.-.65*onWall)+2.6*rim*(.6+.8*w.g);
  float even=1.-smoothstep(0.,6.5,wallDist(q)); drop=mix(drop,3.,even);          // it meets the stone at one even height
  // the skin's floor (CLOUD_LOW): never more than ${f(DROP_MOST)} under the base; the limit comes on softly over its last metre and a half
  float lim=max(1.5-abs(drop-${f(DROP_MOST)}),0.)/1.5; drop=min(drop,${f(DROP_MOST)})-lim*lim*.375;
  float soft; whole=cloudWhole(q,edge,soft);
  float torn=1.-soft;
  info=vec4(mix(mix(mix(pad,pouch,s),bil,inV),.75,even),s,lip,rim);
  return ${f(BASE)}-drop+vl+4.5*torn*torn;
}
`;
// ---- the cloud's light (shared): what the candle flames and the fire put on a place of its skin; the fire's glow in
// the hollow; the sheet lightning's glow from within; the cloud's own haze
export const GLSL_CLOUD_LIGHT = /* glsl */`
uniform vec4 uGlow[12]; uniform vec4 uFire, uFlash[3]; uniform vec3 uAmber, uSlate, uBolt, uSilver, uFogCol; uniform float uFogDen;
// n: the skin's normal (mostly facing down). The candles' gold falls off fast: it stays on what hangs nearest them.
vec3 cloudLight(vec3 p, vec3 n){
  vec3 sum=vec3(0.);
  for(int i=0;i<12;i++){ vec3 dv=uGlow[i].xyz-p; float d2=dot(dv,dv), x=d2/110., k=uGlow[i].w/(1.+x*x), nd=clamp(dot(n,dv)*inversesqrt(d2+1e-3)*.6+.5,0.,1.); sum+=uAmber*(k*nd); }
  { vec3 dv=uFire.xyz-p; float d2=dot(dv,dv), inv=inversesqrt(d2+1e-3), up=clamp((-dv.y*inv-.78)/.2,0.,1.);
    float k=uFire.w*(1./(1.+d2/500.)+1.7*up*up/(1.+d2/3200.)), nd=clamp(dot(n,dv)*inv*.6+.5,0.,1.); sum+=vec3(1.,.44,.13)*(k*nd); }
  return sum;
}
// the hollow's own light: the fire's glow goes up into it with the smoke. Orange on its skin from its mouth to its
// crown, strongest over the hearth and less along the vault toward its closed end (the hollow is closed above: no
// other light comes into it)
vec3 hollowLight(vec3 p){
  float m=smoothstep(0.,4.,p.y-${f(BASE)})*smoothstep(uVault.x-2.,uVault.x+20.,p.z)*(1.-smoothstep(${f(VAULT.half - 3)},${f(VAULT.half + 2)},abs(p.x)));
  vec3 dv=p-uFire.xyz; float d2=dot(dv,dv);
  return m*vec3(1.,.44,.13)*(uFire.w*(.1+.3/(1.+d2/2600.)));
}
// the sheet lightning's glow inside the cloud at a place of the plan (three patches, each swelling and fading)
vec3 boltGlow(vec2 q){
  float g=0.;
  for(int i=0;i<3;i++){ vec2 e=(q-uFlash[i].xy)*vec2(1.,.5); g+=uFlash[i].w*exp(-dot(e,e)*uFlash[i].z); }
  return uBolt*g;
}
// the cloud's own haze: it thickens down the hall, so the far ceiling sinks into slate
vec3 cloudAir(vec3 col, vec3 p){ vec3 e=p-cameraPosition; float fd=uFogDen*uFogDen*dot(e,e); return mix(col,uFogCol,1.-exp(-fd)); }
`;
// ---- the base: one sheet over the whole plan (its under side is the front face): nx by nz equal cells, and each
// cell is cut in three across the hollow's two side walls (in x) and across its end wall behind the ring (in z),
// where the skin stands steep: a wall's facets are then about as tall as the flat base's are wide, so the billows
// laid on a wall are carried as finely up it as along it
function stations(a, b, n, fine) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = a + (b - a) * i / n, q = a + (b - a) * (i + 1) / n, mid = (p + q) / 2, k = fine.some(([f0, f1]) => mid > f0 && mid < f1) ? 3 : 1;
    for (let j = 0; j < k; j++) out.push(p + (q - p) * j / k);
  }
  out.push(b);
  return out;
}
function sheetGeometry(nx, nz) {
  const X = stations(HALL.x0 - 0.7, HALL.x1 + 0.7, nx, [[-VAULT.half - 2, 2 - VAULT.flat], [VAULT.flat - 2, VAULT.half + 2]]);
  const Z = stations(HALL.zHigh - 0.7, HALL.zLow + 0.7, nz, [[VAULT.rear0 - 2, VAULT.rear1 + 2]]);
  const cx = X.length - 1, cz = Z.length - 1, pos = new Float32Array((cx + 1) * (cz + 1) * 3), idx = [];
  for (let j = 0; j <= cz; j++) for (let i = 0; i <= cx; i++) { const k = (j * (cx + 1) + i) * 3; pos[k] = X[i]; pos[k + 1] = HALL.wallTop + 8; pos[k + 2] = Z[j]; }
  for (let j = 0; j < cz; j++) for (let i = 0; i < cx; i++) { const a = j * (cx + 1) + i, b = a + 1, c = a + cx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function sheetMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: true, side: THREE.FrontSide,
    vertexShader: /* glsl */`
      ${GLSL_CLOUD}
      varying vec3 vW, vN; varying vec4 vInfo;
      void main(){
        vec2 q=position.xz; vec4 info, i2; float wh, ed, e=1.1;
        float y=cloudY(q,info,wh,ed), yx=cloudY(q+vec2(e,0.),i2,wh,ed), yz=cloudY(q+vec2(0.,e),i2,wh,ed);
        vW=vec3(q.x,y,q.y); vN=nrm(vec3(yx-y,-e,yz-y)); vInfo=info;
        gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_CLOUD}
      ${GLSL_CLOUD_LIGHT}
      varying vec3 vW, vN; varying vec4 vInfo;
      void main(){
        vec2 q=vW.xz; float edge, soft, a=cloudWhole(q,edge,soft);
        vec2 dd=q-vec2(uTime*${f(DRIFT)},0.), da=vec2(q.y,vW.y), db=vec2(q.x,vW.y);
        float steep=clamp(1.5-1.5*vN.y*vN.y,0.,1.);                  // 0 the flat base .. 1 a wall of the hollow or of the tear
        float wx=vN.x*vN.x/(vN.x*vN.x+vN.z*vN.z+1e-4);              // a wall is drawn in its own upright plane, in the world's metres
        vec4 f1=mix(texture(tN,dd/7.3+vec2(.2,.6)),mix(texture(tN,db/7.3+vec2(.5,.1)),texture(tN,da/7.3+vec2(.5,.1)),wx),steep);
        vec4 f2=mix(texture(tN,dd/2.9),mix(texture(tN,db/2.9),texture(tN,da/2.9),wx),steep);
        vec4 f3=mix(texture(tN,dd/19.+vec2(.6,.1)),mix(texture(tN,db/19.+vec2(.6,.1)),texture(tN,da/19.+vec2(.6,.1)),wx),steep);
        float det=mix(f1.a*.45+f2.r*.2+f3.g*.35,.5,.55*steep), belly=vInfo.x, storm=vInfo.y;      // (a wall's fine grain is kept faint: its billows are its shape)
        vec3 n=nrm(vN+vec3(f1.r-.5,0.,f1.g-.5)*.55+vec3(f2.g-.5,0.,f2.a-.5)*.22);
        vec3 V=nrm(cameraPosition-vW); float graze=1.-abs(dot(n,V)); graze*=graze;
        float occ=(.1+.9*belly*belly)*(.7+.6*det), dark=storm*(1.-.7*vInfo.w);       // dark: under the storm's own base (the rim along the walls keeps its light)
        // under the storm the body is the darkest thing in the room (it takes less of the candles' amber too): what
        // lights it there is the sheet lightning's patches, from within
        vec3 col=uSlate*(.5+.5*belly)*(.75+.5*det)*mix(1.,.3,dark)*(1.+.9*vInfo.w)+(cloudLight(vW,n)+uAmber*(.3*vInfo.w))*occ*mix(1.,.5,dark);
        float inner=storm*smoothstep(.3,.8,texture(tN,dd/67.+vec2(uTime*.031,uTime*-.019)).g)*.05;
        col+=(boltGlow(q)+uBolt*inner)*(.7+.45*belly)*(.45+.55*det)*mix(.25,1.,storm);
        col+=uSilver*edge*(.09+.12*det);
        col+=hollowLight(vW)*(.5+det)*(.2+.95*belly*belly);
        col=mix(col,uSlate*1.3,graze*.24);
        gl_FragColor=vec4(cloudAir(col,vW),a);
        if(a<.01) discard;
      }`,
  });
}
// ---- THE MIST ALONG THE WALL HEADS, and the curtain above it. Three upright layers of mist stand just inside all
// four walls (1.1, 2 and 3.1 m in from the stone, clear of its shafts): each thins downward to nothing by its own
// height law and is thinner the further it stands from the wall, so the masonry dissolves upward into the cloud
// over some ten metres and the base never shows a cut outline against stone. Above the base the layer nearest the
// wall goes on up past the stone's top as the curtain seen through the tear (its own top thins raggedly against
// the sky; at the low end, behind the hollow, it stops just over the base).
function curtainMesh(U) {
  const y0 = BASE - 14, yTop = HALL.wallTop + 16, yRim = BASE - 2;
  const LAYERS = [[1.1, yTop, 0.8, BASE - 13], [2, yRim, 0.7, BASE - 11], [3.1, yRim, 0.6, BASE - 9]];   // inset, top, thickness, foot
  const pos = [], uv = [], lay = [], idx = [];
  LAYERS.forEach(([inset, top, thick, foot], li) => {
    const x0 = HALL.x0 + inset, x1 = HALL.x1 - inset, z0 = HALL.zHigh + inset, z1 = HALL.zLow - inset;
    [[x0, z0, x0, z1], [x1, z1, x1, z0], [x1, z0, x0, z0], [x0, z1, x1, z1]].forEach(([ax, az, bx, bz], k) => {
      const L = Math.hypot(bx - ax, bz - az), o = pos.length / 3, t = k === 3 ? Math.min(top, BASE + 3) : top, s0 = k * 37 + li * 11;
      pos.push(ax, y0, az, bx, y0, bz, bx, t, bz, ax, t, az); uv.push(s0, 0, s0 + L, 0, s0 + L, t - y0, s0, t - y0);
      for (let v = 0; v < 4; v++) lay.push(thick, foot);
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(lay, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: U, fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: `attribute vec2 aL; varying vec2 vUv, vL; varying vec3 vW; void main(){ vUv=uv; vL=aL; vW=position; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tN; uniform float uTime; uniform vec3 uSlate, uSilver, uAmber, uFogCol; uniform float uFogDen; varying vec2 vUv, vL; varying vec3 vW;
      void main(){
        vec2 p=vUv-vec2(uTime*.5,0.); float n=texture(tN,p/47.).r*.6+texture(tN,p/15.).a*.4, n2=texture(tN,p/9.+vec2(.4,.2)).g;
        float top=${f(HALL.wallTop + 5)}+6.5*n+2.*n2, up=clamp((vW.y-${f(BASE)})/24.,0.,1.), over=smoothstep(${f(BASE - 2)},${f(BASE + 1)},vW.y);
        float lo=vL.y+3.*n+1.5*n2, mist=vL.x*smoothstep(lo,lo+8.,vW.y)*(.8+.2*n2);
        float a=(1.-smoothstep(top-3.5,top+2.5,vW.y))*mix(mist,1.,over);
        vec3 col=mix(uSlate*(1.3+.5*n)+uAmber*(.14+.1*n),uSlate*(.3+.45*n)+uSilver*(.008+.05*up*up)*(.4+.9*n),over);
        vec3 e=vW-cameraPosition; col=mix(col,uFogCol,1.-exp(-uFogDen*uFogDen*dot(e,e)));
        gl_FragColor=vec4(col,a);
        if(a<.01) discard;
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'cloud-curtain'; mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}
// ---- THE SCUD: soft puffs under the base. Each is dealt a place of the plan and how far it hangs under the skin
// there (the shader finds the skin by the same law, so the scud goes with the shelf, the pouches and the tear).
// kind 0: the field (shown at the tear's margins, under the shelf's lip, under the storm, and a few everywhere; it
// drifts with the sheet); 1: the rim along the walls; 2: the hollow's lip and mouth (these two stand).
// (the hollow's lift at a place as the shader's vaultAt has it, without its noises and its bank: it serves only to
// order the standing puffs by their distance)
function vaultLift(V, x, z) {
  const t = Math.min(1, Math.max(0, (z - V.z0) / V.run)), ramp = t * t * (3 - 2 * t);
  const tx = Math.min(1, Math.max(0, (Math.abs(x) - VAULT.flat) / (VAULT.half - VAULT.flat)));
  const r = Math.min(1, Math.max(0, (z - VAULT.rear0) / (VAULT.rear1 - VAULT.rear0)));
  const c = Math.min(1, Math.hypot(tx, r)), both = 1 - c * c * (3 - 2 * c);
  const hx = x - HEARTH.x, hz = z - HEARTH.z;
  return (V.lift * ramp + VAULT.dome * Math.exp(-(hx * hx + hz * hz) / 60)) * both;
}
function dealPuffs(rng, V) {
  const P = [];                                   // each: [x, how far it hangs under the skin, z, size, seed, kind, squash]
  const G = FIELD_G, NX = FIELD_NX, NZ = Math.floor((HALL.zLow - HALL.zHigh - 13) / G);
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const px = HALL.x0 + 7 + i * G + (rng() - 0.5) * G * 0.9, pz = HALL.zHigh + 7 + j * G + (rng() - 0.5) * G * 0.9;
    const size = 3.2 + 2.8 * rng(), hang = 0.8 + 2.7 * rng(), sq = 0.5 + 0.25 * rng(), seed = rng();
    if (Math.abs(px) < VAULT.half + 1 && pz > V.z0 + 14 && pz < VAULT.rear1 + 2) continue;   // none in the hollow: the last leg flies there, and its walls are their own billows
    P.push([px, hang, pz, size, seed, 0, sq]);
  }
  const W = [[HALL.x0, HALL.zHigh, 0, 1, 1, 0, 170], [HALL.x1, HALL.zHigh, 0, 1, -1, 0, 170], [HALL.x0, HALL.zHigh, 1, 0, 0, 1, 66], [HALL.x0, HALL.zLow, 1, 0, 0, -1, 66]];
  for (const [sx, sz, dx, dz, nx, nz, len] of W) {
    const n = Math.round(len / 3.4);
    for (let k = 0; k < n; k++) {
      const t = (k + rng()) / n * len, inset = 2 + 5.5 * rng();
      P.push([sx + dx * t + nx * inset, 0.5 + 2.5 * rng(), sz + dz * t + nz * inset, 3.5 + 2.5 * rng(), rng(), 1, 0.5 + 0.2 * rng()]);
    }
  }
  for (let side = -1; side <= 1; side += 2) for (let k = 0, n = Math.round((V.run + 14) / 4.4); k < n; k++) {
    P.push([side * (VAULT.half + (rng() - 0.3) * 3), 0.6 + 2 * rng(), V.z0 + 6 + k * 4.4 + (rng() - 0.5) * 2, 3 + 2 * rng(), rng(), 2, 0.55 + 0.2 * rng()]);
  }
  for (let k = 0; k < 6; k++) P.push([(rng() - 0.5) * 22, 0.6 + 1.6 * rng(), V.z0 - 1 + 8 * rng(), 3 + 2 * rng(), rng(), 2, 0.5 + 0.2 * rng()]);

  return P;
}
function puffMesh(U, P, V) {
  const n = P.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const aC = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aS = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  aC.setUsage(THREE.DynamicDrawUsage); aS.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aC', aC); g.setAttribute('aS', aS); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      ${GLSL_CLOUD}
      ${GLSL_CLOUD_LIGHT}
      attribute vec4 aC, aS; varying vec2 vUv; varying vec3 vW, vBody, vWarm, vTop; varying vec3 vK;
      void main(){
        vec2 q=aC.xz; float kind=aS.y, show=1.;
        // the field's scud goes toward +x with the sheet and wraps across the field's own width
        if(kind<.5) q.x=${f(FIELD.x0)}+mod(q.x-(${f(FIELD.x0)})+uTime*${f(DRIFT)},${f(FIELD.span)});
        vec4 info; float whole, edge, sy=cloudY(q,info,whole,edge);
        float y=sy-aC.y;
        if(kind<.5){
          // (it thins out over the field's last 4 m toward the +x wall's bank and gathers over its first 4 m from the
          // -x wall's; and none of it hangs where the skin is lifted into the hollow)
          vec2 wl; float into=smoothstep(0.,4.,q.x-(${f(FIELD.x0)}))*(1.-smoothstep(${f(FIELD.x0 + FIELD.span - 4)},${f(FIELD.x0 + FIELD.span)},q.x));
          show=max(max(edge*1.4,info.z*1.1),max(step(.72,aS.x)*.6,step(.5,aS.x)*info.y*.7))*smoothstep(.03,.25,whole);
          show*=into*(1.-smoothstep(.5,3.,vaultAt(q,vec4(.5),wl)));
        }
        vec3 c=vec3(q.x,y,q.y), e=cameraPosition-c; float d2=dot(e,e), inv=inversesqrt(d2+1e-4);
        show=min(show,1.)*smoothstep(.6,2.5,d2*inv);
        vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]), up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
        vec3 p=c+(right*position.x+up*(position.y*aS.z))*(show<.004?0.:aC.w);
        vK=vec3(show,aS.x,sy);
        vec3 n=nrm(vec3(0.,-1.,0.)+e*inv*.5);
        vBody=uSlate*mix(1.,.3,info.y*(1.-.7*info.w))*(1.+.8*info.w)+uAmber*(.16*info.w);
        vWarm=cloudLight(c,n)+boltGlow(q)*(.5*info.y+.08)+hollowLight(c)*.9;
        vTop=uSilver*(kind<.5?edge*.13:0.);
        vUv=position.xy; vW=p;
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tN; uniform float uTime; uniform vec3 uFogCol; uniform float uFogDen;
      varying vec2 vUv; varying vec3 vW, vBody, vWarm, vTop; varying vec3 vK;
      void main(){
        float r2=dot(vUv,vUv);
        vec2 o=vec2(vK.y*7.31,vK.y*3.17);
        vec4 n1=texture(tN,vUv*.21+o+vec2(uTime*.004,0.)), n2=texture(tN,vUv*.57+o.yx);
        float den=(1.-r2)*(.5+.95*n1.r)+(n2.a-.5)*.34;
        float a=smoothstep(.1,.62,den)*vK.x*.9*(1.-smoothstep(vK.z-2.4,vK.z+.3,vW.y));
        float low=.5-.5*vUv.y;
        vec3 col=vBody*(.62+.5*n1.a)+vWarm*(.3+.7*low)*(.55+.6*n1.g)+vTop*(1.-low);
        vec3 e=vW-cameraPosition; col=mix(col,uFogCol,1.-exp(-uFogDen*uFogDen*dot(e,e)));
        gl_FragColor=vec4(col,a);
        if(a<.01) discard;
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'cloud-scud'; mesh.frustumCulled = false; mesh.renderOrder = 5;
  // back to front, every frame, by each puff's distance from the lens (the order's share of what the head names as
  // reading the lens); a puff of the field is counted where it has drifted to by the clock
  const order = new Uint16Array(n), far = new Float32Array(n), Y = new Float32Array(n);
  for (let i = 0; i < n; i++) { order[i] = i; Y[i] = BASE - 2 - P[i][1] + (P[i][5] < 0.5 ? 0 : vaultLift(V, P[i][0], P[i][2])); }
  const byFar = (a, b) => far[b] - far[a];
  function sort(cam, time) {
    const e = cam.matrixWorld.elements, cx = e[12], cy = e[13], cz = e[14], off = DRIFT * time;
    for (let i = 0; i < n; i++) {
      const q = P[i]; let x = q[0];
      if (q[5] < 0.5) { x = (x - FIELD.x0 + off) % FIELD.span; x = FIELD.x0 + (x < 0 ? x + FIELD.span : x); }
      const dx = x - cx, dy = Y[i] - cy, dz = q[2] - cz; far[i] = dx * dx + dy * dy + dz * dz;
    }
    order.sort(byFar);
    const C = aC.array, S = aS.array;
    for (let k = 0; k < n; k++) { const q = P[order[k]], j = k * 4; C[j] = q[0]; C[j + 1] = q[1]; C[j + 2] = q[2]; C[j + 3] = q[3]; S[j] = q[4]; S[j + 1] = q[5]; S[j + 2] = q[6]; }
    aC.needsUpdate = true; aS.needsUpdate = true;
  }
  return { mesh, sort, n };
}
// ---- THE CLOUD, put together. o: { S (streams), dealt, leg { length, ring } (the last leg's length and the ring's
// radius, metres: the hollow is cut to them) }
// -> { object, uniforms (live: uTime, uBand, uGlow[12], uFire, uFlash[3], ...), noise, update(dt, time, u, camera), triangles, drawCalls, dispose() }
export async function buildCloud(ctx, o) {
  const noise = await makeNoiseTexture(ctx, o.S.pads);
  await ctx.yield();
  const V4 = (x, y, z, w) => new THREE.Vector4(x, y, z, w), C3 = (a) => new THREE.Color(a[0], a[1], a[2]), hour = o.dealt.hour, V = vaultOf(o.leg);
  // it is always night here; the hour the visit deals only tints that night: the body's own colour, the haze it sinks
  // into, and the silver on the torn margins (night: a hidden moon; dawn: a grey-rose first light; golden: the last
  // ember gold of dusk; day: the hidden moon stands higher, so the margins are broader (margin: uMargin, the share
  // of the wider ramp in the margin's width) and colder silver)
  const LOOK = {
    night: { slate: [0.066, 0.088, 0.15], haze: [0.045, 0.06, 0.105], silver: [0.5, 0.58, 0.78], margin: 0 },
    dawn: { slate: [0.082, 0.07, 0.1], haze: [0.05, 0.04, 0.062], silver: [0.86, 0.62, 0.62], margin: 0 },
    golden: { slate: [0.098, 0.074, 0.072], haze: [0.06, 0.042, 0.04], silver: [0.9, 0.66, 0.4], margin: 0 },
    day: { slate: [0.12, 0.14, 0.18], haze: [0.085, 0.1, 0.13], silver: [0.86, 0.94, 1.2], margin: 1 },
  }[hour];
  const U = {
    tN: { value: noise }, uTime: { value: 0 }, uMargin: { value: LOOK.margin }, uBand: { value: new THREE.Vector2(-300, -360) }, uVault: { value: new THREE.Vector3(V.z0, 1 / V.run, V.lift) },
    uGlow: { value: Array.from({ length: 12 }, () => V4(0, 24, -60, 0)) },
    uFire: { value: V4(HEARTH.x, 5, HEARTH.z, 0.9) },
    uFlash: { value: [V4(0, 0, 0.002, 0), V4(0, 0, 0.002, 0), V4(0, 0, 0.002, 0)] },
    uAmber: { value: new THREE.Color(0.66, 0.43, 0.12) }, uSlate: { value: C3(LOOK.slate) },
    uBolt: { value: new THREE.Color(0.58, 0.62, 1.12) }, uSilver: { value: C3(LOOK.silver) },
    uFogCol: { value: C3(LOOK.haze) }, uFogDen: { value: 0.0085 },
  };
  const object = new THREE.Group(); object.name = 'cloud';
  const NX = 72, NZ = 186;
  const base = new THREE.Mesh(sheetGeometry(NX, NZ), sheetMaterial(U)); base.renderOrder = 3; base.frustumCulled = false; base.name = 'cloud-base';
  await ctx.yield();
  const scud = puffMesh(U, dealPuffs(o.S.puffs, V), V);
  object.add(curtainMesh(U), base, scud.mesh);
  await ctx.yield();
  return {
    object, uniforms: U, noise, triangles: base.geometry.index.count / 3 + 24 + scud.n * 2, drawCalls: 3, puffs: scud.n,
    update(dt, time, u, camera) { U.uTime.value = time; if (camera) scud.sort(camera, time); },
    dispose() { noise.dispose(); object.traverse((x) => { if (x.isMesh) { x.geometry.dispose(); x.material.dispose(); } }); },
  };
}
