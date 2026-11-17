// hall-roofed-with-weather: THE STORM in the cloud (the air builder's part): the sheet lightning's patches and their
// cold light, the crawlers under the base, and the rain that never lands.
//
// SHEET LIGHTNING. The cloud glows from within, patch by patch. One sequencer for the whole world: a patch begins
// every half second of the world's clock, each swells over a fifth of a second and fades over a second, and two or
// three run at once, so at any moment of the storm some part of the cloud is alight. (With the crawlers, which never
// begin less than a second and a half apart, no second of the storm has more than three flashes begin in it.) Where
// a patch stands is dealt by its own number from the seed's stream and laid inside the storm's band as the weather's
// timetable puts it at this u; outside the band a patch has no strength. Nothing here blinks.
import * as THREE from 'three';
import { HALL, GALLERY } from './hall-roofed-with-weather-plan.js';
import { GLSL_CLOUD } from './hall-roofed-with-weather-air-cloud.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const STEP = 0.5, LIVE = 1.3;                 // a patch every STEP seconds; each lives LIVE seconds (two or three at once)

// weather: the storm's timetable as the world file hands it in ({ front(u), back(u), at(x, u) })
export function makeLightning(rng, weather) {
  const ph = [rng() * 100, rng() * 100, rng() * 100];
  // (the line below is the one-line sine hash: a common form that belongs to nobody and, by the owner's rule on
  // brought-in code, needs no line of its own)
  const die = (n, k) => { const s = Math.sin(n * 12.9898 + k * 78.233 + ph[k % 3]) * 43758.5453; return s - Math.floor(s); };
  const flashes = [0, 1, 2].map(() => ({ x: 0, z: -60, r: 20, k: 0 }));
  const state = { flashes, sum: 0, x: 0, z: -60 };
  // time: the world's clock; u: the route's share flown (places the band)
  state.update = (time, u) => {
    const front = weather.front(u), back = weather.back(u), n0 = Math.floor(time / STEP);
    let sum = 0, sx = 0, sz = 0;
    for (let i = 0; i < 3; i++) {
      const n = n0 - i, slot = ((n % 3) + 3) % 3, tau = time - n * STEP, f = flashes[slot];
      const env = sstep(0, 0.2, tau) * (1 - sstep(0.35, LIVE, tau));
      const x = clamp(lerp(back + 9, front - 9, die(n, 0)), HALL.x0 + 3, HALL.x1 - 3), z = lerp(HALL.zHigh + 10, HALL.zLow - 8, die(n, 1));
      f.x = x; f.z = z; f.r = lerp(15, 27, die(n, 2)); f.k = env * lerp(0.6, 1, die(n, 3)) * weather.at(x, u);
      sum += f.k; sx += f.k * x; sz += f.k * z;
    }
    state.sum = sum; if (sum > 1e-4) { state.x = sx / sum; state.z = sz / sum; }
  };
  return state;
}
// RAIN THAT NEVER LANDS. Forty-four shafts and curtains ride with the storm's band (each keeps its own place across
// the band and along the hall): a shaft is a round sheaf, a curtain a long narrow one lying any way across the room;
// none is dealt over the gallery. Each is two things, both things of the place, the same for every eye and for a
// picture of any size:
//   ITS STREAKS, some three hundred of them, 2 to 5 m long and 5 cm across (the hall is three times life size),
//   falling aslant toward +x from the cloud's own skin (found by the cloud's height law at the streak's source, so
//   the rain hangs from the base wherever the base is). Every streak thins over the lower half of its fall and is
//   gone at its own end, its tip never lower than between y 11 and y 16: above the table, the benches and all else.
//   ITS VEIL, the fine rain between the streaks: a few soft upright sheets of faint haze laid on the form's own plan
//   (a shaft: three through its middle, a sixth of a turn apart; a curtain: one along its length and four across
//   it), hung from the skin by the same height law and aslant as the streaks are, thinning over the lower half of
//   the fall and gone at the form's own end; grained down the fall, soft at its margins. It is dealt with its form.
// Streak and veil carry the hour's cloud colour, take gold near the thick parts of the candle streams (the rig's
// sixteen places), flare when the cloud over them glows, and sink into the room's own air by their distance. They are
// a medium: they thin toward the eye only inside 0.6 to 2.5 m of true distance, and by nothing else that the eye does.
// ONE WEIGHT AT EVERY DISTANCE: where a streak would be narrower than a pixel and a half it is drawn that wide, and
// its alpha is taken down by the whole of what that adds (its true width over its drawn width), so its weight in
// the picture is its true cover from any distance. What reads as a grey curtain from far off is the veil.
// o: { rng, detail, air { color, density } (the room's), and the cloud's own uniform objects: tN, uTime, uMargin,
// uBand, uVault, uFlash, uSlate; uPx (pixels to a unit of tangent); uGold (16 places, x y z w) }
const RAIN_HALF = 0.025, SLANT = 0.4, FORMS = 44, VEIL = 0.14;    // a streak's half width (m); its lean toward +x for each metre fallen; the count of forms; a veil sheet's weight
// THE FORMS' OWN DICE, in a loop of their own before any streak is dealt, so that a form stands in one place whatever
// the machine's detail: seven dice for the form, then its veil's (four for a shaft, thirteen for a curtain).
// -> [{ bx (its place across the band, from the band's rear), z, end (y), ca, sa (its turn), rx, rz (its plan's two
// half widths), sheets [[x across the band, z, plan direction x, z, half length, weight, seed], ...] }]
export function dealForms(rng) {
  const forms = [];
  for (let k = 0; k < FORMS; k++) {
    const curtain = rng() < 0.4, bx = 5 + 50 * rng(), end = 11.6 + 3.4 * rng(), ang = rng() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang);
    const rx = curtain ? 1 + 1.4 * rng() : 3 + 4 * rng(), rz = curtain ? 9 + 8 * rng() : rx * (0.8 + 0.4 * rng()), reach = Math.max(rx, rz);
    const z = lerp(HALL.zHigh + 3 + reach, GALLERY.z0 - 2 - reach, rng()), sheets = [];
    if (curtain) {
      sheets.push([bx, z, -sa, ca, rz, VEIL * 0.7, rng()]);                 // one along the curtain's length
      for (let j = 0; j < 4; j++) {                                         // four across it: chords of its plan, each a little askew
        const t = -0.6 + 0.4 * j + (rng() - 0.5) * 0.2, a = ang + (rng() - 0.5) * 0.7;
        sheets.push([bx - sa * t * rz, z + ca * t * rz, Math.cos(a), Math.sin(a), Math.max(1, 1.2 * rx * Math.sqrt(1 - t * t)), VEIL * 1.5, rng()]);
      }
    } else {
      const turn = rng();
      for (let j = 0; j < 3; j++) {                                         // three through the shaft's middle: chords of its plan, a sixth of a turn apart
        const th = (turn + j) * Math.PI / 3, c = Math.cos(th), s = Math.sin(th);
        sheets.push([bx, z, c * ca - s * sa, c * sa + s * ca, 1 / Math.sqrt(c * c / (rx * rx) + s * s / (rz * rz)), VEIL, rng()]);
      }
    }
    forms.push({ bx, z, end, ca, sa, rx, rz, sheets });
  }
  return forms;
}
// what the streaks and the veil share: the band, the long walls, their light and their colour
const GLSL_WALLS = /* glsl */`
float inWalls(float x){ return smoothstep(${(HALL.x0 + 0.3).toFixed(1)},${(HALL.x0 + 0.9).toFixed(1)},x)*(1.-smoothstep(${(HALL.x1 - 0.9).toFixed(1)},${(HALL.x1 - 0.3).toFixed(1)},x)); }
`;
const GLSL_RAIN = /* glsl */`
uniform vec4 uGold[16], uFlash[3]; uniform vec3 uSlate, uAir; uniform float uAirDen;
// how far inside the storm's band a place is: 0 at its two edges, 1 from 10 m in
float inBand(float x){ float sa=clamp((uBand.x-x)/10.,0.,1.), sb=clamp((x-uBand.y)/10.,0.,1.), st=min(sa,sb); return st*st*(3.-2.*st); }
// what lights the rain at a place: the candles' gold (x) and the glow of the cloud over it (y)
vec2 rainLit(vec3 c){
  float gold=0., fl=0.;
  for(int i=0;i<16;i++){ vec3 dv=uGold[i].xyz-c; float q=dot(dv,dv)/45.; gold+=uGold[i].w/(1.+q*q); }
  for(int i=0;i<3;i++){ vec2 e=c.xz-uFlash[i].xy; fl+=uFlash[i].w*exp(-dot(e,e)*uFlash[i].z*.5); }
  return vec2(min(gold,1.),min(fl,1.5));
}
// its colour there: the hour's cloud, the gold and the glow; then the room's own air by its distance
vec3 rainCol(vec2 lit, vec3 p){
  vec3 col=uSlate*1.3+.06+vec3(1.,.7,.3)*(lit.x*.5)+vec3(.5,.55,1.)*(lit.y*.5), e=p-cameraPosition;
  return mix(col,uAir,1.-exp(-uAirDen*uAirDen*dot(e,e)));
}
`;
export function makeRain(o) {
  const rng = o.rng, PER = Math.max(96, Math.round(320 * Math.min(1, o.detail))), N = FORMS * PER, TAU = Math.PI * 2;
  const forms = dealForms(rng);
  const aR = new Float32Array(N * 4), aQ = new Float32Array(N * 4); let n = 0;
  for (const F of forms) for (let i = 0; i < PER; i++) {
    const a = rng() * TAU, rr = Math.sqrt(rng()), ux = rr * Math.cos(a) * F.rx, uz = rr * Math.sin(a) * F.rz;
    aR.set([F.bx + ux * F.ca - uz * F.sa, F.z + ux * F.sa + uz * F.ca, clamp(F.end + (rng() - 0.5) * 2, 11, 16), rng()], n * 4);
    aQ.set([17 + 9 * rng(), 2 + 3 * rng(), 0.2 + 0.8 * rng(), 0], n * 4); n++;                  // aQ: fall (m/s), length, how far under the skin it begins
  }
  const uniforms = () => ({ tN: o.tN, uTime: o.uTime, uMargin: o.uMargin, uBand: o.uBand, uVault: o.uVault, uPx: o.uPx, uFlash: o.uFlash, uGold: o.uGold, uSlate: o.uSlate,
    uAir: { value: o.air.color.clone() }, uAirDen: { value: o.air.density } });
  // ---- the streaks
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4)); g.instanceCount = N;
  const m = new THREE.ShaderMaterial({
    uniforms: uniforms(), fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${GLSL_CLOUD}
      ${GLSL_WALLS}
      ${GLSL_RAIN}
      attribute vec4 aR, aQ; uniform float uPx;
      varying vec4 vC; varying vec2 vUv;
      void main(){
        float seed=aR.w, len=aQ.y, x0=uBand.y+aR.x; vec4 info; float whole, edge;
        float top=cloudY(vec2(x0,aR.y),info,whole,edge)-aQ.z, low=aR.z+len*.464, span=max(top-low,2.);      // (low: its middle's lowest, so its tip ends at its own end)
        float ph=fract(uTime*aQ.x/28.+seed), y=top-ph*span, alpha=smoothstep(0.,.08,ph)*(1.-smoothstep(.5,1.,ph))*smoothstep(.2,.7,whole);
        vec3 c=vec3(x0+${SLANT}*(top-y),y,aR.y), axis=nrm(vec3(${SLANT},-1.,0.)), p0=c+axis*(position.y*len*.5), toCam=cameraPosition-p0;
        float depth=sqrt(dot(toCam,toCam)+1e-6), px=.75*depth/uPx, halfW=max(${RAIN_HALF},px);        // px: half of a pixel and a half, in metres at that distance
        alpha*=inBand(c.x)*inWalls(p0.x)*smoothstep(.6,2.5,depth)*min(1.,${RAIN_HALF}/px);           // (the last term: one weight at every distance)
        vec2 lit=rainLit(c);
        vC=vec4(rainCol(lit,p0),min(.85,alpha*(.46+.34*lit.x+.22*lit.y)));
        vUv=position.xy;
        gl_Position=projectionMatrix*viewMatrix*vec4(p0+nrm(cross(axis,toCam))*(position.x*(vC.a<.004?0.:halfW)),1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vC; varying vec2 vUv;
      void main(){ float x2=vUv.x*vUv.x, y2=vUv.y*vUv.y, a=vC.a*(1.-x2)*(1.-y2*y2); gl_FragColor=vec4(vC.rgb,a); if(a<.004) discard; }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'rain'; mesh.frustumCulled = false; mesh.renderOrder = 7;
  // ---- the veils: every sheet is one small grid, hung from the skin at each of its columns
  const COLS = 6, ROWS = 6, grid = [], idx = [], sheets = [];
  for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) grid.push(-1 + 2 * i / COLS, j / ROWS, 0);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const a = j * (COLS + 1) + i, b = a + 1, c = a + COLS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  for (const F of forms) for (const s of F.sheets) sheets.push([s, F.end]);
  const S = sheets.length, aA = new Float32Array(S * 4), aB = new Float32Array(S * 4);
  sheets.forEach(([s, end], i) => { aA.set([s[0], s[1], end, s[6]], i * 4); aB.set([s[2], s[3], s[4], s[5]], i * 4); });
  const vg = new THREE.InstancedBufferGeometry();
  vg.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3)); vg.setIndex(idx);
  vg.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); vg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); vg.instanceCount = S;
  const vm = new THREE.ShaderMaterial({
    uniforms: uniforms(), fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${GLSL_CLOUD}
      ${GLSL_RAIN}
      attribute vec4 aA, aB;                 // aA: its middle across the band, its z, its form's end (y), its seed; aB: its plan direction (x, z), its half length, its weight
      varying vec4 vC, vG; varying vec3 vW;  // vG: across (-1 .. 1), down (0 .. 1), and the grain's two coordinates
      void main(){
        vec2 q=vec2(uBand.y+aA.x,aA.y)+aB.xy*(aB.z*position.x); vec4 info; float whole, edge;
        float top=cloudY(q,info,whole,edge)-.3, span=max(top-aA.z,2.), y=top-position.y*span;
        vec3 p=vec3(q.x+${SLANT}*(top-y),y,q.y); vec2 lit=rainLit(p);
        vC=vec4(rainCol(vec2(lit.x,lit.y*.6),p),aB.w*inBand(p.x)*smoothstep(.2,.7,whole)*(1.+.5*lit.x)); vW=p;
        vG=vec4(position.xy,position.x*aB.z/2.2+aA.w*13.7,y/30.+aA.w*5.3+uTime*.15);        // (the grain slips down the fall by the clock)
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tN;
      ${GLSL_WALLS}
      varying vec4 vC, vG; varying vec3 vW;
      void main(){
        // its grain: fine threads down the fall (a few to a metre across, some metres long), thicker and thinner in broad patches
        float n=texture(tN,vG.zw).r, n2=texture(tN,vG.zw*vec2(.37,2.3)+vec2(.37,.11)).a, grain=.3+1.4*smoothstep(.38,.72,n)*(.6+.8*n2);
        float across=1.-vG.x*vG.x, body=smoothstep(0.,.1,vG.y)*(1.-smoothstep(.45,1.,vG.y)); vec3 e=vW-cameraPosition;
        float a=vC.a*across*across*body*grain*inWalls(vW.x)*smoothstep(.6,2.5,sqrt(dot(e,e)+1e-6));
        gl_FragColor=vec4(vC.rgb,a);
        if(a<.003) discard;
      }`,
  });
  const veil = new THREE.Mesh(vg, vm); veil.name = 'rain-veil'; veil.frustumCulled = false; veil.renderOrder = 6.5;
  return { mesh, veil, triangles: N * 2 + S * COLS * ROWS * 2, drawCalls: 2, dispose() { g.dispose(); m.dispose(); vg.dispose(); vm.dispose(); } };
}
// CRAWLERS. Now and then a forked thread of lightning runs along under the cloud's skin (it hangs 1.3 m under it,
// by the cloud's own height law, and never comes down to the room). Three are laid at the build, each a wandering
// trunk along the hall with a few forks; a fourth, the GREAT one, runs the whole length of the hall: it is laid and
// drawn only in the rare look. A crawler's light sinks into the room's own air by its distance. One begins at most
// every second and a half (the clock's half-second slots, a die for each slot); it runs out along its length in
// half a second, glows with a soft tremble and fades: never a blink. An ordinary one
// lives 1.1 s and is out before the next can begin. The great one lives 1.7 s: NO SECOND GREAT ONE BEGINS WHILE ONE
// LIVES (a beginner whose die says great, a second and a half after another whose die said great, is an ordinary
// one), so the great one always runs and fades whole; an ordinary one may begin under its last glow, in its own slot.
// o: { rng (the crawlers' own stream), rare, weather, air { density } (the room's), tN, uTime, uMargin, uBand, uVault
// (the cloud's own uniform objects) }
export function makeCrawlers(o) {
  const rng = o.rng, segs = [], LEN = [38 + 20 * rng(), 38 + 20 * rng(), 38 + 20 * rng(), HALL.zLow - HALL.zHigh - 14];
  const ph = [rng() * 100, rng() * 100, rng() * 100];             // the slots' dice (below) take their phases here, before the laying
  const lay = (id, x, z, ang, L, t0, t1, w, forks) => {            // one wandering run of short pieces; forks do not fork again
    const n = Math.max(3, Math.round(L / 1.6)); let a = ang, px = x, pz = z;
    for (let i = 0; i < n; i++) {
      a = ang + (a - ang + (rng() - 0.5) * 0.9) * 0.7;
      const qx = px + Math.sin(a) * L / n, qz = pz + Math.cos(a) * L / n, ta = t0 + (t1 - t0) * i / n, tb = t0 + (t1 - t0) * (i + 1) / n;
      segs.push(px, pz, qx, qz, ta, tb, w * (1 - 0.45 * i / n), id);
      const dFork = rng(), dSide = rng(), dAng = rng(), dLen = rng();
      if (forks > 0 && dFork < forks / n) lay(id, qx, qz, a + (dSide < 0.5 ? -1 : 1) * (0.45 + 0.6 * dAng), L * (0.14 + 0.18 * dLen), tb, Math.min(1.1, tb + 0.22), w * 0.55, 0);
      px = qx; pz = qz;
    }
  };
  for (let id = 0; id < (o.rare ? 4 : 3); id++) lay(id, 0, 0, 0, LEN[id], 0, 1, 1, id === 3 ? 11 : 4);
  const N = segs.length / 8, aSeg = new Float32Array(N * 4), aRun = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { aSeg.set(segs.slice(i * 8, i * 8 + 4), i * 4); aRun.set(segs.slice(i * 8 + 4, i * 8 + 8), i * 4); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aSeg', new THREE.InstancedBufferAttribute(aSeg, 4)); g.setAttribute('aRun', new THREE.InstancedBufferAttribute(aRun, 4)); g.instanceCount = N;
  const uCrawl = { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -60, 0, 0)) };          // each: x, z of its root, strength, how far it has run
  const m = new THREE.ShaderMaterial({
    uniforms: { tN: o.tN, uTime: o.uTime, uMargin: o.uMargin, uBand: o.uBand, uVault: o.uVault, uCrawl, uAirDen: { value: o.air.density } }, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${GLSL_CLOUD}
      attribute vec4 aSeg, aRun; uniform vec4 uCrawl[4]; uniform float uAirDen; varying vec2 vK;
      void main(){
        vec4 cw=uCrawl[int(aRun.w+.5)];
        vec2 qa=cw.xy+aSeg.xy, qb=cw.xy+aSeg.zw, q=mix(qa,qb,position.y); vec4 info; float whole, edge;
        vec3 P=vec3(q.x,cloudY(q,info,whole,edge)-1.3,q.y);
        float t=mix(aRun.x,aRun.y,position.y), lit=smoothstep(0.,.07,cw.w-t);
        vec3 e=cameraPosition-P;
        float k=cw.z*lit*whole*step(${(HALL.x0 + 1).toFixed(1)},q.x)*step(q.x,${(HALL.x1 - 1).toFixed(1)})*exp(-uAirDen*uAirDen*dot(e,e));     // (the last term: the room's air)
        vec3 right=nrm(cross(vec3(qb.x-qa.x,0.,qb.y-qa.y),cameraPosition-P));
        P+=right*(position.x*aRun.z*(k<.003?0.:1.5));
        vK=vec2(position.x,k);
        gl_Position=projectionMatrix*viewMatrix*vec4(P,1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vK;
      void main(){ float d2=vK.x*vK.x; gl_FragColor=vec4((vec3(.8,.82,1.)*(exp(-d2*90.)*2.4)+vec3(.42,.38,1.)*(exp(-d2*5.)*(1.-d2)*.32))*vK.y,1.); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'crawlers'; mesh.frustumCulled = false; mesh.renderOrder = 6;
  // (the one-line sine hash again: a common form that belongs to nobody and, by the owner's rule on brought-in code,
  // needs no line of its own)
  const die = (n, k) => { const v = Math.sin(n * 12.9898 + k * 78.233 + ph[k % 3]) * 43758.5453; return v - Math.floor(v); };
  const SLOT = 0.5, P = o.rare ? 0.24 : 0.16, raw = (n) => die(n, 0) < P, begins = (n) => raw(n) && !raw(n - 1) && !raw(n - 2);
  const saysGreat = (n) => o.rare && begins(n) && die(n, 1) < 0.6;        // (the slot three before is the only one a living great one can have begun in)
  const state = { mesh, triangles: N * 2, drawCalls: 1, sum: 0, x: 0, z: -60, dispose() { g.dispose(); m.dispose(); } };
  state.update = (time, u) => {
    const C = uCrawl.value, front = o.weather.front(u), back = o.weather.back(u), n0 = Math.floor(time / SLOT - 0.5);
    for (let id = 0; id < 4; id++) C[id].z = 0;
    let sum = 0;
    for (let i = 3; i >= 0; i--) {                                  // the last four slots: any crawler still alight began in one of them
      const n = n0 - i; if (!begins(n)) continue;
      const great = saysGreat(n) && !saysGreat(n - 3), id = great ? 3 : Math.floor(die(n, 2) * 3) % 3, life = great ? 1.7 : 1.1, tau = time - (n + 0.5) * SLOT;
      if (tau < 0 || tau > life) continue;
      const x = clamp(great ? 0.5 * (front + back) : lerp(back + 13, front - 13, die(n, 3)), HALL.x0 + 9, HALL.x1 - 9);
      const z = great ? HALL.zHigh + 7 : lerp(HALL.zHigh + 9, HALL.zLow - 9 - LEN[id], die(n, 4));
      const k = sstep(0, 0.12, tau) * (1 - sstep(life * 0.55, life, tau)) * (0.82 + 0.18 * Math.sin(time * 9 + n)) * o.weather.at(x, u);
      C[id].set(x, z, k, 1.2 * tau / (great ? 0.9 : 0.45));
      if (k > sum) { sum = k; state.x = x; state.z = z + LEN[id] * 0.5; }
    }
    state.sum = sum;
  };
  return state;
}
