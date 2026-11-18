// OLD LIGHT ARRIVING, the bowl's people and furniture: the seated crowd on 22 tiers, the globes they hold, the tethered lamp floats, the rim's
// pennant masts, the landing stair. Everything in the bowl's own frame (the star's bearing is local -Z; l = x, a = -z).
// THE HUSH IS BUILT IN: nothing here has a travel term; the crowd has no time term at all; floats and pennants move with the wind only.
import * as THREE from 'three';
import { BOWL, STEPS, PATHS, slopeY, footR, LIGHT_GLSL, TOWN_LIT_GLSL, TAN_EL, hillH, bowlXZ, DEG, PEOPLE_KEEP, SHRUB_KEEP } from './old-light-arriving-common.js';
const ARCH_A = BOWL.arch;      // where the arch stands along the axis
import { makeSprites, makeFigures, makeBlades, makeReeds, solidBuilder, makeSolid, LAMP_GLSL, PERSON_GLSL, heldAt } from './old-light-arriving-life.js';

const B = BOWL, ROWS = B.tiers * 2, COLS = 1024, PITCH = 0.9;
// the seat rows: two on each tread
export const rowR = (j) => B.low + B.tread * (j >> 1) + (j & 1 ? 2.95 : 1.15);
export const rowY = (j) => B.yLow + B.rise * ((j >> 1) + 1);
export const rowN = (j) => Math.floor(2 * Math.PI * rowR(j) / PITCH);
// is a seat at height y cut away by the notch or its stepped sides? (ang measured from the star's bearing)
const inNotch = (r, ang, y, pad = 1.2) => Math.cos(ang) > 0 && Math.abs(Math.sin(ang)) * r < STEPS.lmin(y) + pad;

// who sits where: one texel a seat (red: someone is there; green: which cloth; blue: one of the players; alpha: holds a globe). The same
// table places the held globes, draws the bodies, lights them and the steps from the globes and lays their shadows, so all agree.
export async function seatTable(R, full, ok, pause) {
  const data = new Uint8Array(COLS * ROWS * 4), seats = [];
  for (let j = 0; j < ROWS; j++) { const n = rowN(j), r = rowR(j), k = j >> 1; if (pause && j % 4 === 3) await pause();
    for (let c = 0; c < n; c++) { const ang = (c + 0.5) / n * 2 * Math.PI, l = Math.sin(ang) * r, far = Math.cos(ang) > 0;
      const aisle = Math.abs(((ang / (2 * Math.PI) * 16 + 0.5) % 1) - 0.5) * (2 * Math.PI * r / 16) < 0.95;      // sixteen stairs down through the tiers
      const players = far && k < 3 && l < -(B.notch + 1.4) && l > -(B.notch + 27);                               // the players: one unbroken group, low on the left of the notch
      // a bowl two-thirds full is thinnest in its top tiers
      const fill = players ? 1 : full >= 1 ? 0.94 : Math.min(0.95, 1.22 - 0.85 * k / (B.tiers - 1));
      const a = R(), t = R(), s = R(), ph = R() * 6.283;
      if (inNotch(r, ang, rowY(j)) || aisle || a > fill || (ok && Math.abs(l) < 40 && !ok(l, Math.cos(ang) * r, rowY(j) + 1))) continue;
      const i = (j * COLS + c) * 4; data[i] = 255; data[i + 1] = Math.floor(t * 255); data[i + 2] = players ? 255 : 0; data[i + 3] = !players && s < 0.5 ? 255 : 128;
      seats.push({ j, c, ang, r, y: rowY(j), spark: !players && s < 0.5, glint: players && s < 0.16, players, ph });
    } }
  const tex = new THREE.DataTexture(data, COLS, ROWS, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { tex, seats };
}

// WHERE A HELD GLOBE IS: low before its holder, GLOBE_IN metres toward the pool from the seat's line and GLOBE_UP over the tread
export const GLOBE_IN = 0.47, GLOBE_UP = 0.45;
// the seated crowd as three strips a row (the fronts, the shoulders and hoods from above, the backs), cut to people in the shader from
// the seat table: every seat of the bowl is a person at any distance, for the price of a few strips. Each is lit cold by the sky and
// the star from above and WARM by the held globes: its own (on its lap and breast), its neighbours' to either hand, and on its back the
// globes of the row behind. Where a seat is smaller than a pixel the strip is the crowd's MEAN: its mean cloth in its mean light.
// No time term: no one moves.
export async function makeCrowd(LU, table, litGLSL, pause = async () => {}) {
  const P = [], Q = [], I = [], SEG = 120, TALL = 1.7;
  for (let j = 0; j < ROWS; j++) { const r = rowR(j), y = rowY(j), n = rowN(j); if (j % 8 === 7) await pause();
    for (const [kind, r0, y0, r1, y1] of [[0, r - 0.33, y + 0.02, r - 0.33, y + TALL], [1, r - 0.33, y + 0.74, r + 0.34, y + 0.74], [2, r + 0.34, y + 0.02, r + 0.34, y + TALL]]) {
      const lm = STEPS.lmin(y) + 0.5, cut = r > lm ? Math.asin(lm / r) : Math.PI / 2; let prev = -1;
      for (let i = 0; i <= SEG; i++) { const ang = cut + (2 * Math.PI - 2 * cut) * i / SEG, sx = Math.sin(ang), cz = -Math.cos(ang), b = P.length / 3;
        P.push(r0 * sx, y0, r0 * cz, r1 * sx, y1, r1 * cz); Q.push(ang, 0, j, kind, ang, 1, j, kind);
        if (prev >= 0) I.push(prev, b, prev + 1, prev + 1, b, b + 1); prev = b; } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setIndex(I); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uSeats: { value: table.tex } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aQ; varying vec4 vQ; varying vec3 vW, vL, vNr, vNt; ${LIGHT_GLSL}
      void main(){ vQ = aQ; vL = position; float sx = sin(aQ.x), cz = -cos(aQ.x); vNr = olaW(mat3(modelMatrix)*vec3(sx, 0., cz)); vNt = olaW(mat3(modelMatrix)*vec3(cz, 0., -sx)); vec4 w = modelMatrix*vec4(position, 1.); vW = olaW(w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform sampler2D uSeats; varying vec4 vQ; varying vec3 vW, vL, vNr, vNt; ${LIGHT_GLSL} ${litGLSL} ${PERSON_GLSL}
      void main(){ float j = floor(vQ.z + .5), kind = floor(vQ.w + .5), r = ${B.low}. + ${B.tread}.*floor(j*.5) + (mod(j, 2.) > .5 ? 2.95 : 1.15);
        float n = floor(6.2831853*r/${PITCH}), s = vQ.x/6.2831853*n, c = floor(s), su = fract(s) - .5, side = su < 0. ? -1. : 1.;
        float res = clamp(1.6 - 2.4*fwidth(s), 0., 1.);                                            // 1 where a seat is wider than a pixel
        vec4 seat = texture2D(uSeats, vec2((c + .5)/${COLS}., (j + .5)/${ROWS}.));
        vec4 next = texture2D(uSeats, vec2((mod(c + side, n) + .5)/${COLS}., (j + .5)/${ROWS}.));      // the neighbour to the nearer hand
        if (seat.r < .5) discard;
        // who it is: by the seat's own number (a child one in eight, one in sixteen standing, each leaning a little their own way)
        float h1 = olaHash(vec2(c, j)), h2 = olaHash(vec2(c + 17.3, j*3.1 + 5.)), stand = step(.9375, h1) * (1. - step(.5, seat.b));
        vec3 who = vec3(h1 < .125 ? .7 : .88 + .22*h2, stand, (h2 - .5)*.1);
        float xm = su*${PITCH}, ym = vQ.y*${TALL}, v1 = vQ.y, inside;
        if (kind == 1.) { float d = length(vec2(su/.44, (v1 - .5)/.5)); inside = (1. - smoothstep(.9, 1., d)) * (1. - stand); }      // from above: shoulders and a hood
        else inside = olaPerson(vec2(xm, ym), who);
        if (mix(kind == 1. ? 1. : step(ym, .9), inside, res) < .5) discard;                       // (far off: the row's mean body, a metre tall)
        // winter cloth: five quiet colours, the hood a tone lighter; the players one dark group
        vec3 cl = seat.g < .2 ? vec3(.19,.2,.25) : seat.g < .4 ? vec3(.23,.19,.2) : seat.g < .6 ? vec3(.15,.18,.225) : seat.g < .8 ? vec3(.25,.225,.22) : vec3(.18,.21,.2);
        cl *= 1. + .18 * res * step(.5, abs(kind - 1.)) * step(mix(.68, 1.32, stand)*who.x, ym);      // (the hood)
        cl = mix(cl, vec3(.06,.06,.075), step(.5, seat.b));
        vec3 n3 = kind == 1. ? vec3(0., 1., 0.) : (kind == 0. ? -vNr : vNr) + vec3(0., .25, 0.);
        n3 = normalize(n3 + vNt * su * 1.5 * res);                                                  // round the body a little
        float lit = bowlLit(vL);
        // the held globes' warm light on the cloth, by the metres from each globe (its own before it, its neighbour's to one hand)
        float own = step(.75, seat.a), nb = step(.75, next.a) * step(.5, next.r);
        float dy = ym - ${GLOBE_UP.toFixed(2)}, d0 = xm*xm + dy*dy, d1 = (xm - side*${PITCH})*(xm - side*${PITCH}) + dy*dy;
        float front = own * 1.1/(1. + d0/.05) + nb * 1.1/(1. + d1/.05);
        float above = (own * .4 + nb * .15) * (1. - v1);                                           // on the shoulders, from before and below
        float warm = kind == 0. ? front : kind == 1. ? above : .08;                                // (a back takes the globes of the row behind: their mean)
        warm = mix(kind == 2. ? .08 : .16, warm, res) * (1. - step(.5, seat.b)*.8);                // far off: the mean of a lit row
        vec3 col = cl * (olaLight(n3, lit * olaBands(vW.xz)) + vec3(1., .44, .095) * (.05 + warm));
        gl_FragColor = vec4(olaFog(col, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat);
  return { object: mesh, material: mat, triangles: I.length / 3 };
}

// ---- the wind's hand on a tether: where the ribbon is, s of the way up (0 the foot, 1 the globe). The globe leans downwind and sways
// only as the wind sways it; it never rises, never comes loose, and its ribbon is always there.
export const FLOAT_GLSL = /* glsl */`
uniform vec2 uWind;
vec3 floatAt(vec3 foot, float len, float ph, float s){
  float lean = .17 + .06*sin(uTime*.37 + ph) + .035*sin(uTime*.83 + ph*2.3), side = .05*sin(uTime*.5 + ph*1.7);
  vec2 off = (uWind*lean + vec2(-uWind.y, uWind.x)*side) * len * s*s;
  return foot + vec3(off.x, len*s*(1. - .5*lean*lean*s*s), off.y);
}`;
// the widest a float's globe swings from the upright over its foot, for the clearance test (as a share of the ribbon's length)
export const FLOAT_SWING = 0.3;
// items: [{ p: [x,y,z] the tether's foot, len: the ribbon's length, ph }]; wind: the wind's direction on the map in this frame
// mirror: { y, r } a round still water at the frame's own centre (the bowl's pool) in which the globes are seen again
const MIRROR_LONG = '1.6';      // how much longer than wide a globe's image in rippled water is drawn (its light spread over that length)
export function makeFloats(LU, RU, items, wind, mirror = null) {
  const n = items.length, aF = new Float32Array(n * 4), aG = new Float32Array(n * 2);
  items.forEach((it, i) => { aF.set([it.p[0], it.p[1], it.p[2], it.len], i * 4); aG.set([it.ph, it.sink || 0], i * 2); });
  const U = { ...LU, uRes: RU.uRes, uWind: { value: new THREE.Vector2(wind[0], wind[1]).normalize() } };
  const inst = (q) => { const g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
    g.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 2)); g.instanceCount = n; return g; };
  // the globes: plain amber paper, 1.2 m across, a faint ribbed skin and the flame inside. Never under a pixel and a half across; where a
  // globe is widened the skin's light and the flame's are both cut by exactly the area added (the flame by the one law of every flame)
  // (the mirrored globes: each globe's image stands as far under the pool as the globe stands over it; it is drawn where the eye's line to
  // the image crosses the water, at the image's own size on the screen, with half the light, and only inside the pool's round)
  const globeMat = (mir) => new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    // (vF: the flame inside, its own widened size in the card's units and its light cut by the area added)
    vertexShader: /* glsl */`attribute vec4 aF; attribute vec2 aG; uniform vec2 uRes; varying vec2 vQ, vF; varying float vK, vD, vRes, vPh; ${LIGHT_GLSL} ${FLOAT_GLSL}
      void main(){ vec3 p = floatAt(aF.xyz, aF.w, aG.x, 1.) + vec3(0., .6, 0.); float gain = 1., k = 1.;
        ${mir ? `vec3 camL = (inverse(modelMatrix)*vec4(cameraPosition, 1.)).xyz, im = vec3(p.x, ${(2 * mir.y).toFixed(2)} - p.y, p.z);
        k = clamp((camL.y - ${mir.y.toFixed(2)}) / max(camL.y - im.y, 1e-3), 0., 1.); vec3 h = camL + (im - camL)*k;
        gain = .5 * step(${(mir.y + 0.05).toFixed(2)}, camL.y) * step(length(h.xz), ${(mir.r - 0.7).toFixed(1)});
        vec4 mv = viewMatrix*modelMatrix*vec4(im, 1.);` : `vec4 mv = viewMatrix*modelMatrix*vec4(p, 1.);`}
        float px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5), rad = olaLeast(.6, px).x;
        vK = olaLeast(.6, px).y*gain; vec2 fl = olaLeast(.13, px); vF = vec2(fl.x/rad, 3.5*fl.y*gain); vRes = clamp(.6/px*.25, 0., 1.); vQ = position.xy * 2.2; vD = -mv.z; vPh = aG.x;
        ${mir ? `mv = viewMatrix*modelMatrix*vec4(camL + (im - camL)*k*.997, 1.);
        // AN IMAGE IN WATER TREMBLES: the ripples shift it about its place and draw it out a little toward the eye (its light spread
        // over the longer image), so that it reads as a reflection and never as a lamp standing in the pool
        mv.xy += rad * k * vec2(.3*sin(uTime*3.3 + aG.x*5.) + .15*sin(uTime*5.9 + aG.x*11.), .55*sin(uTime*2.6 + aG.x*9.));
        vK /= ${MIRROR_LONG}; vF.y /= ${MIRROR_LONG};
        mv.xy += position.xy * rad * 2.2 * k * vec2(1., ${MIRROR_LONG});` : `mv.xy += position.xy * rad * 2.2 * k;`}
        gl_Position = gain > 0. ? projectionMatrix*mv : vec4(2., 2., 2., 1.); }`,
    // THE GLOW ROUND A GLOBE IS ROUND: it falls to nothing inside the card (at 2.15 radii; the card's edge stands at 2.2), so the card's
    // square never shows. (It was still a fiftieth of the globe's amber at the card's edge and ended there: on dark water, a square.)
    fragmentShader: /* glsl */`varying vec2 vQ, vF; varying float vK, vD, vRes, vPh; ${LIGHT_GLSL} ${LAMP_GLSL}
      void main(){ vec2 q = vQ; float brk = 1.;
        ${mir ? `q.x += .24*sin(q.y*3.1 + uTime*2.9 + vPh*7.) * smoothstep(0., 1., abs(q.y)); brk = .62 + .38*sin(q.y*5.2 - uTime*3.7 + vPh*3.);      // the water breaks the image` : ``}
        float r = length(q), disc = 1. - smoothstep(.94, 1., r);
        float xs = q.x / sqrt(max(1. - q.y*q.y, .02)), rib = (1. - smoothstep(0., .1, abs(fract(asin(clamp(xs, -1., 1.))*1.91 + .5) - .5))) * vRes;
        float skin = disc * (.5 + .5*sqrt(max(1. - r*r, 0.))) * (1. - .22*rib), halo = .1*exp(-max(r - 1., 0.)*2.4) * (1. - disc) * (1. - smoothstep(1.45, 2.15, r));
        float f = exp(-min(vD*vD*uFogDen*uFogDen*.5, 40.));
        gl_FragColor = vec4((vec3(1., .44, .095) * (1.5*skin + halo*4.) * vK + lampLight(r*r/max(vF.x*vF.x, 1e-4), vF.y, 0., 0.)) * f * brk, 0.); }` });
  const globes = new THREE.Mesh(inst(new THREE.PlaneGeometry(2, 2)), globeMat(null));
  globes.frustumCulled = false; globes.renderOrder = 3;
  let images = null; if (mirror) { images = new THREE.Mesh(globes.geometry, globeMat(mirror)); images.frustumCulled = false; images.renderOrder = 2; }
  // the ribbons: thin bands that keep a pixel and a half (thinner in light where they are widened)
  const ribbons = new THREE.Mesh(inst(new THREE.PlaneGeometry(1, 1, 1, 6)), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aF; attribute vec2 aG; uniform vec2 uRes; varying float vS, vA; varying vec3 vW; ${LIGHT_GLSL} ${FLOAT_GLSL}
      void main(){ float s = position.y + .5; vS = s; vec3 p = floatAt(aF.xyz, aF.w, aG.x, s); vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); vec4 mv = viewMatrix*w;
        float px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5), hw = max(.035, .75*px); vA = .035/hw;
        mv.x += position.x * 2. * hw; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`varying float vS, vA; varying vec3 vW; ${LIGHT_GLSL}
      void main(){ vec3 c = vec3(.2,.21,.25) * olaLight(normalize(vec3(.3, .6, .3)), 1.) + vec3(1., .44, .095) * 1.1 * pow(clamp(vS, 0., 1.), 5.);      // (lit by its own globe: the ribbon is read through the globe's glow)
        // (a tether is a thin ribbon read through its globe's glow: plainest under the globe, fainter toward its foot, so that a float
        // seen across the pool is a globe on a thread and never a post standing in the water)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), clamp(vA, 0., 1.) * mix(.3, 1., vS*vS)); }` }));
  ribbons.frustumCulled = false; ribbons.renderOrder = 2.5;
  const group = new THREE.Group(); group.add(ribbons, globes); if (images) group.add(images);
  return { object: group, count: n };
}

// ---- pennants: long soft cloths of one plain slate-pale colour streaming from mast heads (no device, stripe or mark)
// items: [{ p: [x,y,z] the mast's head, len, ph }]
export function makePennants(LU, items, wind) {
  const n = items.length, aF = new Float32Array(n * 4), aG = new Float32Array(n);
  items.forEach((it, i) => { aF.set([it.p[0], it.p[1], it.p[2], it.len], i * 4); aG[i] = it.ph; });
  const q = new THREE.PlaneGeometry(1, 1, 10, 1), g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
  g.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 1)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uWind: { value: new THREE.Vector2(wind[0], wind[1]).normalize() } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aF; attribute float aG; uniform vec2 uWind; varying vec3 vW, vN; varying float vS; ${LIGHT_GLSL}
      vec3 at(float s, float e){ float len = aF.w, wv = sin(s*8. - uTime*3.4 + aG) * .5 * s + sin(s*3.1 - uTime*1.9 + aG*1.7) * .35 * s;
        vec2 sd = vec2(-uWind.y, uWind.x); float lift = .12*sin(uTime*.6 + aG);
        return aF.xyz + vec3(uWind.x*s*len + sd.x*wv, -s*s*len*(.2 - lift) + e*(1.15 - .9*s) + .12*sin(s*6. - uTime*2.6 + aG*.7)*s, uWind.y*s*len + sd.y*wv); }
      void main(){ float s = position.x + .5, e = position.y * 2.; vS = s; vec3 p = at(s, e), d = at(min(s + .05, 1.05), e) - p, up = at(s, e + .2) - p;
        vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*normalize(cross(d, up) + vec3(1e-4))); gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN; varying float vS; ${LIGHT_GLSL} ${TOWN_LIT_GLSL}
      void main(){ vec3 n = vN / max(length(vN), 1e-4); vec3 V = normalize(olaW(cameraPosition) - vW + vec3(0., 1e-5, 0.)); if (dot(n, V) < 0.) n = -n;
        float lit = olaTownLit(vW);      // (the star's light by the cloth's own place: the quay's pennants fly in the town's hill's shade; the bowl's are beyond it)
        vec3 c = vec3(.27,.28,.33) * (olaLight(n, lit) + olaLight(-n, lit)*.35) + vec3(1., .44, .095) * .25 * (1. - smoothstep(0., .25, vS));      // thin cloth lets a little light through
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { object: mesh, count: n };
}

// ---- the bowl dressed. opts: { LU, RU, S: { crowd, floats, masts }, full, litGLSL, wind: [x, z] in this frame,
// far(l, a, y): metres from the route to a point of the bowl's frame (absent when the bowl stands alone), stone: the shell's material }
export async function dressBowl(object, opts) {
  const { LU, RU, S, full, litGLSL } = opts, wind = opts.wind || [0.9, 0.44], far = opts.far || (() => 1e9), pause = opts.yieldFn || (async () => {});
  const gh = (x, z) => { const p = bowlXZ(x, -z); return hillH(p[0], p[1]); };
  const sprites = [], people = [], blades = [], held = [], sb = solidBuilder(), TIMBER = [0.075, 0.065, 0.06], PALE = [0.33, 0.335, 0.37];
  const stand = [];      // what stands on the rim and the outer slope, for whatever flies by: { x, z, r, top } in the bowl's own frame (a thing r metres round, top metres high)
  const SIDE = B.notch + STEPS.n * STEPS.w;      // how far from the axis the notch's stepped sides reach
  // a blade on the bowl's own ground: away from the star is local +Z
  const blade = (x, y, z, h, w, w1, k) => { let t = 1.5, gy = y; for (; t < 110; t += 1.5) { gy = gh(x, z + t); if (y + h - t * TAN_EL <= gy) break; } if (t < 3) return;
    blades.push({ a: [x, y, z], b: [x, Math.max(gh(x, z + t * 0.5), 0), z + t * 0.5], c: [x, Math.max(gy, 0), z + t], w, w1, k }); };
  // the seated crowd and its held globes (people keep PEOPLE_KEEP, 28.5 m, from the route)
  const table = await seatTable(S.crowd, full, (l, a, y) => far(l, a, y) > PEOPLE_KEEP, pause); await pause();
  const crowd = await makeCrowd(LU, table, litGLSL, pause); await pause(); object.add(crowd.object); await pause();
  if (opts.stone) { opts.stone.uniforms.uSeats.value = table.tex;
    // each tier's filled share (what the crowd's second shadows melt to where a seat is smaller than a pixel)
    const got = new Float32Array(B.tiers), all = new Float32Array(B.tiers); for (const st of table.seats) got[st.j >> 1]++; for (let j = 0; j < ROWS; j++) all[j >> 1] += rowN(j);
    opts.stone.uniforms.uTierFill.value = got.map((g, k) => g / all[k]); }
  for (const st of table.seats) { const sx = Math.sin(st.ang), cz = -Math.cos(st.ang), r = st.r - 0.3;
    if (st.spark) sprites.push({ p: [(st.r - GLOBE_IN) * sx, st.y + GLOBE_UP, (st.r - GLOBE_IN) * cz], size: 0.085, bright: 2, ph: st.ph });
    else if (st.glint) sprites.push({ p: [r * sx, st.y + 0.62, r * cz], size: 0.05, bright: 0.8, ph: st.ph }); }
  await pause();
  // standing watchers all round the rim walk
  for (let i = 0; i < 760; i++) { if (i % 120 === 119) await pause(); const ang = S.crowd() * 6.2832, r = 129.4 + 7 * S.crowd(), x = Math.sin(ang) * r, z = -Math.cos(ang) * r;
    if ((Math.cos(ang) > 0 && Math.abs(x) < SIDE + 2.5) || far(x, -z, B.yWalk + 1) < PEOPLE_KEEP) continue;
    const t = Math.floor(S.crowd() * 5), sp = S.crowd() < 0.45, ph = sp ? S.crowd() * 6.283 : 0;
    people.push({ p: [x, B.yWalk, z], h: 1.7, tint: t, lamp: sp, ph }); if (sp) { sprites.push({ p: heldAt([x, B.yWalk, z], 1.7, ph), size: 0.085, bright: 2, ph, wet: true }); held.push([x, z]); }
    if (i % 2 === 0) blade(x, B.yWalk, z, 1.7, 0.3, 0.22, 0.85); }
  await pause();
  // pennant masts round the rim walk, a lamp at each head
  const pennants = [];
  for (let d = 5; d < 360; d += 10) { if (d % 60 === 55) await pause(); const ang = d * DEG, r = 133.5, x = Math.sin(ang) * r, z = -Math.cos(ang) * r, len = S.masts.range(9, 13), ph = S.masts() * 6.283, top = B.yWalk + 24;
    if ((Math.cos(ang) > 0 && Math.abs(x) < SIDE + 5) || far(x, -z, top) < 60 || far(x, -z, B.yWalk + 12) < 60) continue;      // (the road's rule: a mast stands 60 m or more from the road's line)
    sb.pole([x, B.yWalk - 0.3, z], [x, top, z], 0.13, TIMBER, 1); sprites.push({ p: [x, top + 0.35, z], size: 0.3, bright: 3.5, ph, wet: true });
    pennants.push({ p: [x, top - 0.7, z], len, ph }); blade(x, B.yWalk, z, 24, 0.35, 0.2, 1); stand.push({ x, z, r: len + 1, top: top + 1 }); }      // (the mast with the round its cloth can fly in)
  // the tethered lamp floats: ONE RULE FOR EVERY RING. They stand on ten of the bowl's own rings, from the sixth tread up to the rim walk
  // (none lower, all the way round: nothing is flown over the paved ring, the pool or the lowest tiers), every twelfth degree over the
  // far half and every twenty-fourth over the near half (so they never hide the sky), alternate rings set half a step round. They stand
  // IN ORDER: every float of a ring rides at that ring's one height (the rim's highest). The one keep-clear is the road's: a ribbon that
  // would bring its globe near the route is left out.
  const floats = []; await pause();
  for (let q = 2; q < 12; q++) { if (q % 4 === 3) await pause(); const k = 1 + 2 * q, rim = q === 11, r = rim ? 131 : B.low + B.tread * k + 3.6, y = rim ? B.yWalk : B.yLow + B.rise * (k + 1), half = q % 2 ? 0.5 : 0;
    const angs = []; for (let i = 0; i < 15; i++) angs.push(-84 + 12 * (i + half * 0.5)); for (let i = 0; i < 7; i++) angs.push(108 + 24 * (i + half * 0.5));
    for (const d of angs) { const ang = d * DEG, x = Math.sin(ang) * r, z = -Math.cos(ang) * r; if (Math.cos(ang) > 0 && Math.abs(x) < STEPS.lmin(y) + 3.5) continue;
      const len = (rim ? 20 : 11 + (q % 3) * 2.5) + S.floats.range(-0.3, 0.3), ph = S.floats() * 6.283;
      if (far(x, -z, y + len) < 8 + len * FLOAT_SWING) continue;
      floats.push({ p: [x, y, z], len, ph }); } }
  // THE NOTCH'S STEPPED SIDES ARE STANDS LIKE ANY OTHER: every terrace carries three rows of watchers along its length (seated in the
  // front two, some standing in the third), by one law of the bowl's own layout: the share of places taken is fullest on the terrace
  // next the stage and in the front row, and thins a little with every terrace up and every row back; a stair of two places is left
  // open every 13 m along a terrace. Nearly half hold a globe. A lamp float every 14 m along every second terrace.
  for (const sd of [-1, 1]) for (let j = 0; j < STEPS.n; j++) { await pause(); const L0 = B.notch + STEPS.w * j, y = STEPS.y0 + STEPS.rise * j, kc = Math.floor((y - B.yLow) / B.rise + 1e-6), rc = B.low + B.tread * kc;
    for (const [row, off] of [[0, 0.9], [1, 2.4], [2, 3.9]]) { const l = L0 + off, a0 = Math.sqrt(rc * rc - l * l) + 1, a1 = Math.sqrt((B.rim - 3) * (B.rim - 3) - l * l), share = (0.94 - 0.05 * j) * (1 - 0.14 * row) * (full >= 1 ? 1 : 0.86);
      for (let a = a0; a < a1; a += PITCH) { if ((a - a0) % 13 > 11.2 || S.crowd() >= share) continue;
        if (far(sd * l, a, y + 1) < PEOPLE_KEEP) continue;
        const h = row === 2 && S.crowd() < 0.3 ? 1.7 : 1.1, t = Math.floor(S.crowd() * 5), sp = S.crowd() < 0.45, ph = sp ? S.crowd() * 6.283 : 0, p = [sd * l, y, -a];
        people.push({ p, h, tint: t, lamp: sp, ph }); if (sp) { sprites.push({ p: heldAt(p, h, ph), size: 0.085, bright: 2, ph }); held.push([p[0], p[2]]); } } }
    if (j % 2 === 1) { const l = L0 + 3.6, a0 = Math.sqrt(rc * rc - l * l) + 5, a1 = Math.sqrt((B.rim - 3) * (B.rim - 3) - l * l);
      for (let a = a0; a < a1; a += 14) { const len = 11 + S.floats.range(-0.3, 0.3), ph = S.floats() * 6.283; if (far(sd * l, a, y + len) < 8 + len * FLOAT_SWING) continue; floats.push({ p: [sd * l, y, -a], len, ph }); } } }
  // THE STAGE'S TWO EDGES, under its side walls: loose groups of standing watchers (four to ten together, some holding globes; never
  // one alone: a group that the people's keep-clear leaves under four is not built), and plain lamp standards every 15 m, set
  // alternately along the two walls. Nothing stands out on the stage's floor and nothing at the arch.
  { const glows2 = [];
    for (const sd of [-1, 1]) { await pause();
      // (a group's whole place is asked first: the 5.2 m of wall it stands along must lie outside the paved ring and keep the people's
      // clearance at both its ends, or the group is not there; so no group is ever thinned to a few and no one is dealt and dropped)
      for (let a = 22 + S.crowd() * 8; a < ARCH_A - 12; a += S.crowd.range(8, 17)) {
        if (Math.hypot(27.3, a - 2.6) < B.low + 2 || Math.min(far(sd * 27.3, a - 2.6, B.yStage + 1), far(sd * 27.3, a + 2.6, B.yStage + 1)) < PEOPLE_KEEP) continue;
        const n = 4 + Math.floor(S.crowd() * 7);
        for (let i = 0; i < n; i++) { const p = [sd * S.crowd.range(27.3, 29.4), B.yStage, -(a + S.crowd.range(-2.6, 2.6))], t = Math.floor(S.crowd() * 5), sp = S.crowd() < 0.5, ph = sp ? S.crowd() * 6.283 : 0;
          people.push({ p, h: 1.7, tint: t, lamp: sp, ph }); blade(p[0], p[1], p[2], 1.7, 0.3, 0.22, 0.85); if (sp) { sprites.push({ p: heldAt(p, 1.7, ph), size: 0.085, bright: 2, ph }); held.push([p[0], p[2]]); } } }
      for (let a = sd > 0 ? 34 : 41.5; a < ARCH_A - 8; a += 15) { const x = sd * 28.9, z = -a; if (far(x, a, B.yStage + 3.6) < 7.5) continue;
        const ph = S.masts() * 6.283;
        sb.pole([x, B.yStage - 0.2, z], [x, B.yStage + 3.4, z], 0.085, TIMBER, 1); sprites.push({ p: [x, B.yStage + 3.6, z], size: 0.22, bright: 3.5, ph });
        glows2.push({ p: [x, B.yStage, z], r: 12, k: 1, h: 3.4 }); blade(x, B.yStage, z, 3.5, 0.14, 0.1, 1); } }
    for (const g2 of glows2) opts.lamp(g2.p[0], g2.p[2], g2.r, g2.k, g2.h); }
  // the landing stair up the near slope, from the stages at the water to the rim, lamps at its sides
  for (let i = 0; i < 25; i++) { const r = 190 - 2 * i, y = B.yRim * (B.foot - r + 2) / (B.foot - B.rim) + 0.1; sb.box(-3, 3, y - 2.2, y, r - 2, r, PALE, 0);
    if (i % 3 === 1) for (const e of [-1, 1]) { sb.pole([e * 3.5, y - 0.5, r - 1], [e * 3.5, y + 2.6, r - 1], 0.07, TIMBER, 0); sprites.push({ p: [e * 3.5, y + 2.8, r - 1], size: 0.2, bright: 3.5, ph: S.masts() * 6.283, wet: true }); stand.push({ x: e * 3.5, z: r - 1, r: 0.3, top: y + 3.1 }); } }
  await pause();
  // ---- the hill's outer slope as a place: shrubs and small trees unlike in size in loose clumps, lamps along its two terrace paths with
  // their pools of light, watchers sitting out on the grass in loose groups (no one apart), and at the water reed beds and stones.
  // Everything is laid by the hill's own bearings and radii; the road is only asked for clearance.
  const H = S.hill, glows = [], reeds = [], yAt = (r) => B.yRim * (B.foot - r) / (B.foot - B.rim), at = (r, th) => [Math.sin(th) * r, -Math.cos(th) * r];
  const openTo = (th, r, pad = 0) => { const x = Math.sin(th) * r; return !(Math.cos(th) > 0 && Math.abs(x) < SIDE + 6 + pad) && !(Math.cos(th) < 0 && Math.abs(x) < 9 + pad); };      // not in the notch's sides, not on the landing stair
  for (let c = 0; c < 30; c++) { const th0 = H() * 6.283, r0 = H.range(146, 184), n = 2 + Math.floor(H() * 5);
    for (let i = 0; i < n; i++) { const th = th0 + H.range(-0.06, 0.06), r = r0 + H.range(-6, 6), big = H() < 0.3, sz = big ? H.range(2.2, 4) : H.range(0.7, 1.6), g = H(), beat = 1 + Math.floor(H() * 7);
      if (r < 144 || r > 187 || !openTo(th, r, sz) || PATHS.some((t) => Math.abs(r - t) < 2.5 + sz)) continue;
      const [x, z] = at(r, th), y = Math.max(slopeY(r, th), 0), col = [0.04 + 0.02 * g, 0.075 + 0.03 * g, 0.05 + 0.015 * g], lit = Math.cos(th) > 0.15 ? 1 : 0;
      if (far(x, -z, y + sz * 2.6) < SHRUB_KEEP + sz) continue;
      stand.push({ x, z, r: sz * (big ? 1.3 : 1), top: y + sz * (big ? 2.7 : 1.3) });
      if (big) { sb.pole([x, y - 0.5, z], [x, y + sz * 1.3, z], 0.05 * sz, [0.05, 0.04, 0.035], 0); sb.blob([x, y + sz * 1.75, z], sz, sz * 0.85, col, lit, beat); sb.blob([x + sz * 0.5, y + sz * 1.25, z - sz * 0.3], sz * 0.7, sz * 0.6, col, lit, beat); }
      else sb.blob([x, y + sz * 0.55, z], sz, sz * 0.7, col, lit, 0); } }
  await pause();
  for (const t of PATHS) for (let d = 7.5; d < 360; d += 15) { const th = d * DEG, [x, z] = at(t, th), y = yAt(t), ph = H() * 6.283; if (!openTo(th, t) || far(x, -z, y + 3) < 7.5) continue;
    sb.pole([x, y - 0.4, z], [x, y + 2.8, z], 0.07, TIMBER, 0); sprites.push({ p: [x, y + 3, z], size: 0.2, bright: 3.5, ph, wet: true }); glows.push({ p: [x, y, z], r: 7, k: 0.6, h: 2.8 }); stand.push({ x, z, r: 0.3, top: y + 3.3 }); }
  for (let c = 0; c < 24; c++) { const th0 = H() * 6.283, r0 = H.range(148, 181), n = 4 + Math.floor(H() * 7);
    for (let i = 0; i < n; i++) { const th = th0 + H.range(-0.035, 0.035), r = r0 + H.range(-3, 3);
      if (!openTo(th, r) || PATHS.some((q) => Math.abs(r - q) < 1.6)) continue; const [x, z] = at(r, th), y = Math.max(slopeY(r, th), 0); if (far(x, -z, y + 1) < PEOPLE_KEEP) continue;
      const t = Math.floor(H() * 5), sp = H() < 0.5, ph = sp ? H() * 6.283 : 0;
      people.push({ p: [x, y, z], h: 1.1, tint: t, lamp: sp, ph }); stand.push({ x, z, r: 0.6, top: y + 1.5 }); if (sp) { sprites.push({ p: heldAt([x, y, z], 1.1, ph), size: 0.085, bright: 2, ph, wet: true }); held.push([x, z]); } } }
  await pause();
  for (let i = 0; i < 1500; i++) { const th = H() * 6.283, off = H.range(-1, 4.5), h = H.range(1.3, 2.2), ph = H() * 6.283;
    if (Math.sin(th * 4 + 1) + Math.sin(th * 11 + 2) < 0.25 || !openTo(th, B.foot, 4)) continue; const [x, z] = at(footR(th) + off, th); reeds.push({ x, z, h, ph }); }
  for (let i = 0; i < 46; i++) { const th = H() * 6.283, r = footR(th) + H.range(-2.2, 1.2), sz = H.range(0.35, 1.1), g = 0.17 + 0.07 * H(), [x, z] = at(r, th); if (!openTo(th, r, 2)) continue; sb.blob([x, 0.05, z], sz, sz * 0.5, [g, g, g * 1.08], 0, 0); }
  if (reeds.length) object.add(makeReeds(LU, reeds, wind).object);
  await pause();
  for (let i = 0; i < glows.length; i++) { const g = glows[i]; if (i % 16 === 15) await pause(); opts.lamp(g.p[0], g.p[2], g.r, g.k, g.h); }      // their pools of light, into the country's map of lamp light
  for (let i = 0; i < held.length; i++) { if (i % 64 === 63) await pause(); opts.lamp(held[i][0], held[i][1], 2.4, 0.3, 0.5, false, false); }      // and the small pool every held globe lays about its holder's feet
  await pause();
  object.add(makeSolid(LU, sb.geometry(), wind).object);
  if (people.length) object.add(makeFigures(LU, people, { litGLSL, sphere: [0, 30, 0, 150] }).object);
  await pause();
  object.add(makeSprites(LU, RU, sprites, { sphere: [0, 30, 0, 200] }).object); await pause();
  // what stands on the rim and the outer slope lies in the basin's water too: the images of those lamps
  object.add(makeSprites(LU, RU, sprites.filter((q) => q.wet), { mirror: true, gain: 0.55 }).object);
  object.add(makePennants(LU, pennants, wind).object);
  object.add(makeFloats(LU, RU, floats, wind, { y: B.yPool, r: B.pool }).object);
  await pause();
  if (blades.length) object.add(makeBlades(LU, blades, { side: [1, 0, 0] }).object);
  return { table, stand, floats, counts: { seats: table.seats.length, sprites: sprites.length, people: people.length, floats: floats.length, masts: pennants.length, blades: blades.length, crowdTris: crowd.triangles } };
}
